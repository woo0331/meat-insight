-- 0068_listing_photo · 운영 DB 판이 67 일 때만 실행합니다
begin;
drop view if exists v_listing_count;
drop view if exists v_job_count;
drop view if exists v_wanted_count;
drop view if exists v_cq_count;
alter table listing add column if not exists brand text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'listing_brand_ok') then
    alter table listing add constraint listing_brand_ok
      check (brand is null or (btrim(brand) <> '' and char_length(brand) <= 30));
  end if;
end $$;
create index if not exists listing_brand_idx on listing (brand) where state = 'open';
create index if not exists listing_price_idx on listing (price) where state = 'open';
grant select (brand) on listing to authenticated;
create table if not exists listingphoto (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listing(id) on delete cascade,
  by_user    uuid not null references auth.users(id) on delete cascade,
  path       text not null unique,
  mime       text not null,
  bytes      int  not null,
  caption    text,
  created_at timestamptz not null default now(),
  constraint listingphoto_mime_ok check (mime in ('image/jpeg','image/png','image/webp')),
  constraint listingphoto_bytes_ok check (bytes > 0 and bytes <= 8388608),
  constraint listingphoto_caption_ok check (caption is null or char_length(caption) <= 60),
  constraint listingphoto_path_ok check (
    path <> '' and length(path) <= 300
    and path = 'lst/' || listing_id::text || '/photo/' || split_part(path, '/', 4))
);
create index if not exists listingphoto_l_idx on listingphoto (listing_id, created_at);
alter table listingphoto enable row level security;
drop policy if exists listingphoto_mine on listingphoto;
create policy listingphoto_mine on listingphoto
  for select using (by_user = auth.uid() or my_role() in ('staff','admin'));
grant select on listingphoto to authenticated;
create or replace function claim_listing_photo(p jsonb default '{}'::jsonb)
  returns jsonb
  language plpgsql security definer set search_path = public as $$
declare
  v_me    uuid := auth.uid();
  v_l     uuid := nullif(btrim(coalesce(p->>'listing','')), '')::uuid;
  v_mime  text := lower(btrim(coalesce(p->>'mime','')));
  v_bytes int  := coalesce((nullif(btrim(coalesce(p->>'bytes','')), ''))::int, 0);
  v_cap   text := nullif(btrim(coalesce(p->>'caption','')), '');
  v_ext   text;
  v_path  text;
  v_id    uuid;
begin
  if v_me is null then raise exception '로그인하셔야 사진을 올릴 수 있습니다'; end if;
  if v_l is null then raise exception '어느 매물인지 알 수 없습니다'; end if;
  -- ⚠️⚠️ **제 매물에만** 붙입니다. 운영자도 남의 매물에 사진을 못 붙입니다 —
  --   붙일 까닭이 없고, 붙으면 올리신 분이 안 올린 것이 그 매물에 달립니다.
  if not exists (select 1 from listing
                  where id = v_l and by_user = v_me and state = 'open') then
    raise exception '그 매물에는 사진을 붙일 수 없습니다';
  end if;
  if v_mime not in ('image/jpeg','image/png','image/webp') then
    raise exception '사진은 JPG · PNG · WEBP 만 올리실 수 있습니다';
  end if;
  if v_bytes <= 0 or v_bytes > 8388608 then
    raise exception '한 장에 8MB 까지 올리실 수 있습니다';
  end if;
  if v_cap is not null and char_length(v_cap) > 60 then
    raise exception '사진 설명이 너무 깁니다 (60자)';
  end if;
  if (select count(*) from listingphoto where listing_id = v_l) >= 8 then
    raise exception '사진은 여덟 장까지입니다. 먼저 빼 주세요';
  end if;
  v_ext := case v_mime when 'image/jpeg' then 'jpg'
                       when 'image/png'  then 'png'
                       else 'webp' end;
  v_path := 'lst/' || v_l::text || '/photo/' || gen_random_uuid()::text || '.' || v_ext;
  insert into listingphoto (listing_id, by_user, path, mime, bytes, caption)
  values (v_l, v_me, v_path, v_mime, v_bytes, v_cap)
  returning id into v_id;
  -- ⚠️ 기록에 **사진 설명을 안 담습니다** (손님 글입니다)
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'listingphoto', v_id::text, 'claimed',
          jsonb_build_object('mime', v_mime, 'bytes', v_bytes));
  return jsonb_build_object('id', v_id, 'path', v_path);
end $$;
revoke all on function claim_listing_photo(jsonb) from public;
grant execute on function claim_listing_photo(jsonb) to authenticated;
create or replace function drop_listing_photo(p jsonb default '{}'::jsonb)
  returns int
  language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_id uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_n  int;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 사진인지 알 수 없습니다'; end if;
  -- ⚠️ 올리신 분과 운영자가 뺍니다 (운영자는 신고를 받고 빼야 합니다)
  delete from listingphoto
   where id = v_id
     and (by_user = v_me or my_role() in ('staff','admin'));
  get diagnostics v_n = row_count;
  -- ⚠️⚠️ 0줄이면 **거절**합니다 — 조용히 끝내면 기록에 "뺐다" 가 남는데
  --   실제로는 아무 일도 안 일어난 것입니다 (0054 에서 적어 둔 그 자리).
  if v_n = 0 then raise exception '그 사진을 뺄 수 없습니다'; end if;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state)
  values (v_me, my_role(), 'listingphoto', v_id::text, 'dropped');
  return v_n;
end $$;
revoke all on function drop_listing_photo(jsonb) from public;
grant execute on function drop_listing_photo(jsonb) to authenticated;
create or replace function open_listing(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_sub     text := nullif(btrim(coalesce(p->>'sub','')), '');
  v_region  text := nullif(btrim(coalesce(p->>'region','')), '');
  v_title   text := nullif(btrim(coalesce(p->>'title','')), '');
  v_body    text := nullif(btrim(coalesce(p->>'body','')), '');
  v_cond    text := nullif(btrim(coalesce(p->>'cond','')), '');
  v_contact text := nullif(btrim(coalesce(p->>'contact','')), '');
  v_brand   text := nullif(btrim(coalesce(p->>'brand','')), '');
  v_ship    boolean := coalesce((p->>'ship')::boolean, false);
  v_price   int;
  v_id      uuid;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  if v_sub is null then
    raise exception '물건 종류를 골라 주세요';
  end if;
  if v_region is null then
    raise exception '지역을 골라 주세요';
  end if;
  -- ⚠️⚠️ **브랜드를 비워 둘 수 없습니다** — 비면 거르개에 아무도 안 고르는
  --   칸이 생기고 그 매물은 영영 안 보입니다. 모르시면 화면이 「기타」를
  --   냅니다(목록만 두면 없는 브랜드를 가진 분이 글을 못 올립니다).
  if v_brand is null then
    raise exception '브랜드를 골라 주세요 (모르시면 기타)';
  end if;
  if char_length(v_brand) > 30 then
    raise exception '브랜드가 너무 깁니다 (30자)';
  end if;
  if v_title is null or char_length(v_title) < 2 then
    raise exception '제목을 두 글자 이상 적어 주세요';
  end if;
  if char_length(v_title) > 60 then
    raise exception '제목이 너무 깁니다 (60자)';
  end if;
  if v_body is null or char_length(v_body) < 5 then
    raise exception '설명을 다섯 글자 이상 적어 주세요';
  end if;
  if char_length(v_body) > 2000 then
    raise exception '설명이 너무 깁니다 (2000자)';
  end if;
  if p->>'price' is null or btrim(p->>'price') = '' then
    raise exception '값을 적어 주세요 (무료로 나누시면 0)';
  end if;
  begin
    v_price := btrim(p->>'price')::int;
  exception when others then
    raise exception '값은 숫자로 적어 주세요';
  end;
  if v_price < 0 or v_price > 100000000 then
    raise exception '값이 올바르지 않습니다';
  end if;
  if v_cond is null then
    raise exception '물건 상태를 골라 주세요';
  end if;
  if v_cond not in ('new','like','good','fair') then
    raise exception '물건 상태가 올바르지 않습니다';
  end if;
  if v_contact is null then
    raise exception '연락처를 적어 주세요';
  end if;
  if length(v_contact) > 100 then
    raise exception '연락처가 너무 깁니다';
  end if;
  if p->>'agree_at' is null then
    raise exception '개인정보 수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes'
     or (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의 시각이 올바르지 않습니다';
  end if;
  if (select count(*) from listing
       where by_user = v_uid and state = 'open') >= 10 then
    raise exception '팔고 계신 매물이 열입니다. 먼저 정리해 주세요';
  end if;
  if (select count(*) from listing
       where by_user = v_uid and created_at > now() - interval '1 day') >= 20 then
    raise exception '오늘은 더 올릴 수 없습니다 (하루 스무 개)';
  end if;
  insert into listing (by_user, sub, region, ship, title, body, price,
                       cond, contact, agree_at, brand)
  values (v_uid, v_sub, v_region, v_ship, v_title, v_body, v_price,
          v_cond, v_contact, (p->>'agree_at')::timestamptz, v_brand)
  returning id into v_id;
  return v_id;
end $$;
revoke all on function open_listing(jsonb) from public;
grant execute on function open_listing(jsonb) to authenticated;
create or replace function edit_listing(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_own uuid;
  v_st  text;
  v_n   int;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 매물인지 알 수 없습니다'; end if;
  select by_user, state into v_own, v_st from listing where id = v_id for update;
  if v_st is null then raise exception '그런 매물이 없습니다'; end if;
  if not coalesce(v_own = v_uid, false) then
    raise exception '올리신 분만 고치실 수 있습니다';
  end if;
  if v_st <> 'open' then
    raise exception '팔고 있는 매물만 고치실 수 있습니다';
  end if;
  if p ? 'title' then
    if char_length(btrim(coalesce(p->>'title',''))) < 2
       or char_length(btrim(p->>'title')) > 60 then
      raise exception '제목은 2~60자입니다';
    end if;
  end if;
  if p ? 'body' then
    if char_length(btrim(coalesce(p->>'body',''))) < 5
       or char_length(btrim(p->>'body')) > 2000 then
      raise exception '설명은 5~2000자입니다';
    end if;
  end if;
  if p ? 'brand' then
    if nullif(btrim(coalesce(p->>'brand','')), '') is null then
      raise exception '브랜드를 골라 주세요 (모르시면 기타)';
    end if;
    if char_length(btrim(p->>'brand')) > 30 then
      raise exception '브랜드가 너무 깁니다 (30자)';
    end if;
  end if;
  if p ? 'price' then
    if nullif(btrim(coalesce(p->>'price','')), '') is null then
      raise exception '값을 적어 주세요 (무료로 나누시면 0)';
    end if;
    if (p->>'price')::int < 0 or (p->>'price')::int > 100000000 then
      raise exception '값이 올바르지 않습니다';
    end if;
  end if;
  if p ? 'cond' and coalesce(p->>'cond','') not in ('new','like','good','fair') then
    raise exception '물건 상태가 올바르지 않습니다';
  end if;
  if p ? 'contact' and length(coalesce(p->>'contact','')) > 100 then
    raise exception '연락처가 너무 깁니다';
  end if;
  update listing set
    sub     = coalesce(nullif(btrim(coalesce(p->>'sub','')),    ''), sub),
    region  = coalesce(nullif(btrim(coalesce(p->>'region','')), ''), region),
    title   = coalesce(nullif(btrim(coalesce(p->>'title','')),  ''), title),
    body    = coalesce(nullif(btrim(coalesce(p->>'body','')),   ''), body),
    cond    = coalesce(nullif(btrim(coalesce(p->>'cond','')),   ''), cond),
    brand   = coalesce(nullif(btrim(coalesce(p->>'brand','')),  ''), brand),
    price   = coalesce(nullif(btrim(coalesce(p->>'price','')),  '')::int, price),
    ship    = coalesce((p->>'ship')::boolean, ship),
    contact = coalesce(nullif(btrim(coalesce(p->>'contact','')), ''), contact),
    updated_at = now()
   where id = v_id;
  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception '고치지 못했습니다'; end if;
  return 'edited';
end $$;
revoke all on function edit_listing(jsonb) from public;
grant execute on function edit_listing(jsonb) to authenticated;
drop view if exists v_listing_open;
create view v_listing_open as
  select l.id, l.sub, l.region, l.ship, l.title, l.body, l.price, l.cond,
         l.brand, l.created_at,
         (select count(*) from listingask a
           where a.listing_id = l.id and a.state = 'asked') as ask_n,
         (select count(*) from listingphoto f where f.listing_id = l.id) as photo_n,
         (select f.path from listingphoto f
           where f.listing_id = l.id order by f.created_at, f.id limit 1) as thumb
    from listing l
   where l.state = 'open';
grant select on v_listing_open to anon, authenticated;
drop view if exists v_listing_photo_public;
create view v_listing_photo_public as
  select f.id, f.listing_id, f.path, f.caption, f.created_at
    from listingphoto f
    join listing l on l.id = f.listing_id
   where l.state = 'open';
grant select on v_listing_photo_public to anon, authenticated;
insert into schema_version (n, name) values (68, '0068_listing_photo')
  on conflict (n) do nothing;
commit;
commit;
select max(n) as ver from schema_version;
