-- ════════════════════════════════════════════════════════════════════
-- DRAFT 0087 — 회원 상품 올리기 (2026-11-27 대표 지시 · 세 화면 시안의 셋째)
--
-- ⚠️⚠️ **db/migrations 에 넣지 않았습니다 (초안).** 시험 DB(gxjz…)에만 적용했고
--   운영 DB 에는 적용하지 않았습니다. 운영에 올리실 때 번호를 정해 db/migrations 로
--   옮기고 verify.sql 기대값(표 · 함수)을 같이 고칩니다.
--
-- 표 둘   product        — 올린 사람(owner) · 이름 · 분류 · 가격 · 설명 · 배송 · 상태
--         product_photo  — 그 상품의 사진 (다섯 장까지 · 버킷은 request-photos 를 product/ 앞머리로)
-- 상태    review(검수 대기) → live(공개) | hidden(내림)
--         ⚠️⚠️ **올린 사람은 live 로 못 바꿉니다** — 공개는 직원 · 관리자 문입니다.
--         올린 사람이 고치면 다시 review 로 돌아갑니다 (확인 없이 바뀐 내용이 나가지 않게).
-- 문 넷   save_product · claim_product_photo_slot · drop_product_photo · set_product_state
--         표에는 읽기만 줍니다 — 쓰기는 전부 문으로 (소유자 확인이 문 안에 있습니다).
-- ════════════════════════════════════════════════════════════════════
begin;

create table if not exists product (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  cat         text not null,
  price       bigint,                  -- 원 단위 · null = 가격 협의
  body        text,
  ship        text,                    -- 배송 · 수령 조건 (선택)
  state       text not null default 'review',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint product_name_ok  check (btrim(name) <> '' and length(name) <= 80),
  constraint product_cat_ok   check (cat in ('kitchen','supply','furniture','device','etc')),
  constraint product_price_ok check (price is null or (price >= 0 and price <= 9999999999)),
  constraint product_body_ok  check (body is null or length(body) <= 3000),
  constraint product_ship_ok  check (ship is null or length(ship) <= 500),
  constraint product_state_ok check (state in ('review','live','hidden'))
);
create index if not exists product_owner_idx on product (owner_id);

create table if not exists product_photo (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references product(id) on delete cascade,
  path        text not null unique,
  mime        text not null,
  bytes       bigint not null,
  created_at  timestamptz not null default now(),
  constraint pphoto_path_ok  check (path <> '' and length(path) <= 300),
  constraint pphoto_mime_ok  check (mime in ('image/jpeg','image/png','image/webp')),
  constraint pphoto_bytes_ok check (bytes > 0 and bytes <= 8388608)
);
create index if not exists pphoto_prod_idx on product_photo (product_id);

alter table product enable row level security;
alter table product_photo enable row level security;

drop policy if exists product_mine on product;
create policy product_mine on product for select using (owner_id = auth.uid());
drop policy if exists product_staff on product;
create policy product_staff on product for select using (my_role() in ('staff','admin'));
-- 공개된 것만 누구나 (공개 화면이 생기면 씁니다)
drop policy if exists product_live on product;
create policy product_live on product for select using (state = 'live');

drop policy if exists pphoto_mine on product_photo;
create policy pphoto_mine on product_photo for select using (exists (
  select 1 from product p where p.id = product_photo.product_id and p.owner_id = auth.uid()));
drop policy if exists pphoto_staff on product_photo;
create policy pphoto_staff on product_photo for select using (my_role() in ('staff','admin'));
drop policy if exists pphoto_live on product_photo;
create policy pphoto_live on product_photo for select using (exists (
  select 1 from product p where p.id = product_photo.product_id and p.state = 'live'));

grant select on product, product_photo to authenticated;

-- 만들기 · 고치기 — ⚠️ 주인은 언제나 auth.uid() (요청이 보낸 값을 안 믿습니다)
create or replace function save_product(p jsonb) returns jsonb
  language plpgsql security definer set search_path = public as $$
declare
  uid  uuid := auth.uid();
  pid  uuid;
  pr   bigint;
  rw   product;
begin
  if uid is null then raise exception '로그인이 필요합니다'; end if;
  if coalesce(btrim(p->>'name'),'') = '' then raise exception '상품명을 적어 주세요'; end if;
  if coalesce(p->>'cat','') not in ('kitchen','supply','furniture','device','etc') then
    raise exception '카테고리를 골라 주세요'; end if;
  if coalesce(btrim(p->>'price'),'') = '' then pr := null;
  elsif (p->>'price') !~ '^[0-9]{1,10}$' then raise exception '판매 가격은 숫자로 적어 주세요';
  else pr := (p->>'price')::bigint; end if;

  if coalesce(p->>'id','') <> '' then
    pid := (p->>'id')::uuid;
    select * into rw from product where id = pid;
    if not found or rw.owner_id <> uid then
      raise exception '이 상품을 고칠 수 없습니다'; end if;
    update product set name = btrim(p->>'name'), cat = p->>'cat', price = pr,
      body = nullif(btrim(coalesce(p->>'body','')),''), ship = nullif(btrim(coalesce(p->>'ship','')),''),
      state = case when state = 'hidden' then 'hidden' else 'review' end,
      updated_at = now()
     where id = pid;
  else
    select count(*) into pr from product where owner_id = uid and created_at > now() - interval '1 hour';
    if pr >= 20 then raise exception '잠시 뒤에 다시 올려 주세요'; end if;
    pr := case when coalesce(btrim(p->>'price'),'') = '' then null else (p->>'price')::bigint end;
    insert into product (owner_id, name, cat, price, body, ship)
    values (uid, btrim(p->>'name'), p->>'cat', pr,
            nullif(btrim(coalesce(p->>'body','')),''), nullif(btrim(coalesce(p->>'ship','')),''))
    returning id into pid;
  end if;
  return jsonb_build_object('id', pid, 'state', (select state from product where id = pid));
end $$;
revoke all on function save_product(jsonb) from public, anon;
grant execute on function save_product(jsonb) to authenticated;

create or replace function claim_product_photo_slot(p_product uuid, p_mime text, p_bytes bigint)
  returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid(); n int; ext text; newp text;
begin
  if uid is null then raise exception '로그인이 필요합니다'; end if;
  if not exists (select 1 from product where id = p_product and owner_id = uid) then
    raise exception '이 상품에 사진을 올릴 수 없습니다'; end if;
  select count(*) into n from product_photo where product_id = p_product;
  if n >= 5 then raise exception '사진은 다섯 장까지 올리실 수 있습니다'; end if;
  ext := case p_mime when 'image/jpeg' then 'jpg' when 'image/png' then 'png'
                     when 'image/webp' then 'webp' else null end;
  if ext is null then raise exception '사진은 JPG · PNG · WEBP 만 올리실 수 있습니다'; end if;
  if p_bytes is null or p_bytes <= 0 or p_bytes > 8388608 then
    raise exception '한 장에 8MB 까지 올리실 수 있습니다'; end if;
  newp := 'product/' || p_product::text || '/' || replace(gen_random_uuid()::text,'-','') || '.' || ext;
  insert into product_photo (product_id, path, mime, bytes) values (p_product, newp, p_mime, p_bytes);
  update product set state = case when state = 'hidden' then 'hidden' else 'review' end, updated_at = now()
   where id = p_product;
  return jsonb_build_object('path', newp, 'n', n + 1);
end $$;
revoke all on function claim_product_photo_slot(uuid, text, bigint) from public, anon;
grant execute on function claim_product_photo_slot(uuid, text, bigint) to authenticated;

create or replace function drop_product_photo(p_photo uuid) returns jsonb
  language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); r record;
begin
  if uid is null then raise exception '로그인이 필요합니다'; end if;
  select ph.id, ph.path, p.owner_id into r from product_photo ph join product p on p.id = ph.product_id
   where ph.id = p_photo;
  if not found then raise exception '사진을 찾을 수 없습니다'; end if;
  if r.owner_id <> uid and my_role() not in ('staff','admin') then
    raise exception '이 사진을 뺄 권한이 없습니다'; end if;
  delete from product_photo where id = p_photo;
  return jsonb_build_object('path', r.path);
end $$;
revoke all on function drop_product_photo(uuid) from public, anon;
grant execute on function drop_product_photo(uuid) to authenticated;

-- 공개 · 내림 — ⚠️ 직원 · 관리자만 (올린 사람이 스스로 공개할 수 없습니다)
create or replace function set_product_state(p_product uuid, p_state text) returns void
  language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or my_role() not in ('staff','admin') then
    raise exception '공개 여부는 운영자가 정합니다'; end if;
  if p_state not in ('review','live','hidden') then raise exception '없는 상태입니다'; end if;
  update product set state = p_state, updated_at = now() where id = p_product;
  if not found then raise exception '상품을 찾을 수 없습니다'; end if;
end $$;
revoke all on function set_product_state(uuid, text) from public, anon;
grant execute on function set_product_state(uuid, text) to authenticated;

commit;
