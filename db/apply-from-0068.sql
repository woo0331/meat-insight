-- 0068~0081 이어 붙이기 (운영 DB 가 67판일 때만). commit; 으로 파일마다 끊어 두었습니다.
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
begin;
alter table listing add column if not exists model text;
alter table listing drop constraint if exists listing_model_ok;
alter table listing add constraint listing_model_ok
  check (model is null or char_length(btrim(model)) between 1 and 40);
do $$
declare r record;
begin
  for r in
    select c.conname
      from pg_constraint c
     where c.conrelid = 'listing'::regclass
       and c.contype = 'c'
       and pg_get_constraintdef(c.oid) ilike '%state%'
       and pg_get_constraintdef(c.oid) ilike '%''open''%'
       and pg_get_constraintdef(c.oid) not ilike '%hidden_why%'
  loop
    execute format('alter table listing drop constraint %I', r.conname);
  end loop;
end $$;
alter table listing add constraint listing_state_ok
  check (state in ('open','reserved','done','closed','hidden'));
create index if not exists listing_live_idx
  on listing (state, created_at desc) where state in ('open','reserved');
alter table listingphoto add column if not exists ord int not null default 0;
alter table listingphoto drop constraint if exists listingphoto_ord_ok;
alter table listingphoto add constraint listingphoto_ord_ok
  check (ord >= 0 and ord <= 99);
create index if not exists listingphoto_ord_idx
  on listingphoto (listing_id, ord, created_at, id);
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
  v_ord   int;
begin
  if v_me is null then raise exception '로그인하셔야 사진을 올릴 수 있습니다'; end if;
  if v_l is null then raise exception '어느 매물인지 알 수 없습니다'; end if;
  if not exists (select 1 from listing
                  where id = v_l and by_user = v_me
                    and state in ('open','reserved')) then
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
  -- ⚠️ 그 수는 여기와 `js/lstphoto.js` **두 곳**에 있고, 화면이 먼저
  --   막아도 **DB 가 다시 봅니다**(화면에서만 막으면 꾸러미를 고쳐
  --   지나갑니다).
  if (select count(*) from listingphoto where listing_id = v_l) >= 10 then
    raise exception '사진은 열 장까지입니다. 먼저 빼 주세요';
  end if;
  select coalesce(max(ord), -1) + 1 into v_ord
    from listingphoto where listing_id = v_l;
  if v_ord > 99 then v_ord := 99; end if;
  v_ext := case v_mime when 'image/jpeg' then 'jpg'
                       when 'image/png'  then 'png'
                       else 'webp' end;
  v_path := 'lst/' || v_l::text || '/photo/' || gen_random_uuid()::text || '.' || v_ext;
  insert into listingphoto (listing_id, by_user, path, mime, bytes, caption, ord)
  values (v_l, v_me, v_path, v_mime, v_bytes, v_cap, v_ord)
  returning id into v_id;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'listingphoto', v_id::text, 'claimed',
          jsonb_build_object('mime', v_mime, 'bytes', v_bytes));
  return jsonb_build_object('id', v_id, 'path', v_path, 'ord', v_ord);
end $$;
revoke all on function claim_listing_photo(jsonb) from public;
grant execute on function claim_listing_photo(jsonb) to authenticated;
create or replace function order_listing_photo(p jsonb default '{}'::jsonb)
  returns int
  language plpgsql security definer set search_path = public as $$
declare
  v_me  uuid := auth.uid();
  v_l   uuid := nullif(btrim(coalesce(p->>'listing','')), '')::uuid;
  v_ids uuid[];
  v_n   int;
  v_have int;
  i     int;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_l is null then raise exception '어느 매물인지 알 수 없습니다'; end if;
  if not exists (select 1 from listing
                  where id = v_l and by_user = v_me
                    and state in ('open','reserved')) then
    raise exception '그 매물의 사진 순서는 바꾸실 수 없습니다';
  end if;
  if p->'ids' is null or jsonb_typeof(p->'ids') <> 'array' then
    raise exception '사진 차례를 보내 주세요';
  end if;
  select array_agg(x::uuid) into v_ids
    from jsonb_array_elements_text(p->'ids') as t(x);
  v_n := coalesce(array_length(v_ids, 1), 0);
  if v_n = 0 then raise exception '사진 차례를 보내 주세요'; end if;
  -- ⚠️ 같은 사진을 두 번 보내면 거절합니다 (한 자리가 비게 됩니다)
  if v_n <> (select count(distinct x) from unnest(v_ids) as t(x)) then
    raise exception '같은 사진이 두 번 들어 있습니다';
  end if;
  select count(*) into v_have from listingphoto where listing_id = v_l;
  if v_n <> v_have then
    raise exception '그 매물의 사진이 %장인데 %장만 보내셨습니다', v_have, v_n;
  end if;
  -- ⚠️ 남의 매물 사진 id 를 섞어 보내는 것을 막습니다
  if exists (select 1 from unnest(v_ids) as t(x)
              where not exists (select 1 from listingphoto
                                 where id = t.x and listing_id = v_l)) then
    raise exception '그 매물의 사진이 아닌 것이 들어 있습니다';
  end if;
  for i in 1 .. v_n loop
    update listingphoto set ord = i - 1 where id = v_ids[i] and listing_id = v_l;
  end loop;
  -- ⚠️ 기록에 **장수만** 남깁니다 (사진 설명 · 경로는 손님 것입니다)
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'listing', v_l::text, 'photo_ordered',
          jsonb_build_object('n', v_n));
  return v_n;
end $$;
revoke all on function order_listing_photo(jsonb) from public;
grant execute on function order_listing_photo(jsonb) to authenticated;
create table if not exists listingfav (
  by_user    uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references listing(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (by_user, listing_id)
);
create index if not exists listingfav_mine_idx
  on listingfav (by_user, created_at desc);
alter table listingfav enable row level security;
drop policy if exists listingfav_mine on listingfav;
create policy listingfav_mine on listingfav
  for select using (by_user = auth.uid());
grant select on listingfav to authenticated;
create or replace function fav_listing(p jsonb default '{}'::jsonb)
  returns boolean
  language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_l  uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_on boolean := coalesce((p->>'on')::boolean, true);
  v_st text;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_l is null then raise exception '어느 매물인지 알 수 없습니다'; end if;
  if v_on then
    select state into v_st from listing where id = v_l;
    if v_st is null then raise exception '그런 매물이 없습니다'; end if;
    -- ⚠️ 내려간 · 가려진 매물은 찜할 수 없습니다 (목록에 안 보이는 것을
    --   찜해 두면 관심상품에 **열 수 없는 줄**이 쌓입니다)
    if v_st not in ('open','reserved','done') then
      raise exception '지금은 찜할 수 없는 매물입니다';
    end if;
    -- ⚠️ 수백 개면 관심상품 목록이 쓸모없어집니다 (0058 과 같은 결)
    if (select count(*) from listingfav where by_user = v_me) >= 200 then
      raise exception '찜은 200개까지입니다. 먼저 정리해 주세요';
    end if;
    insert into listingfav (by_user, listing_id) values (v_me, v_l)
      on conflict (by_user, listing_id) do nothing;
    return true;
  end if;
  delete from listingfav where by_user = v_me and listing_id = v_l;
  return false;
end $$;
revoke all on function fav_listing(jsonb) from public;
grant execute on function fav_listing(jsonb) to authenticated;
drop view if exists v_listing_fav;
create view v_listing_fav as
  select f.listing_id as id, f.created_at as fav_at,
         l.sub, l.region, l.ship, l.title, l.price, l.cond, l.brand, l.model,
         l.state, l.created_at,
         (select ph.path from listingphoto ph
           where ph.listing_id = l.id
           order by ph.ord, ph.created_at, ph.id limit 1) as thumb
    from listingfav f
    join listing l on l.id = f.listing_id
   where f.by_user = auth.uid()
     and l.state in ('open','reserved','done');
grant select on v_listing_fav to authenticated;
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
  v_model   text := nullif(btrim(coalesce(p->>'model','')), '');
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
  if v_brand is null then
    raise exception '브랜드를 골라 주세요 (모르시면 기타)';
  end if;
  if char_length(v_brand) > 30 then
    raise exception '브랜드가 너무 깁니다 (30자)';
  end if;
  -- ⚠️ 모델명은 **비워도 됩니다** — 모르시는 분이 못 올리면 안 됩니다
  if v_model is not null and char_length(v_model) > 40 then
    raise exception '모델명이 너무 깁니다 (40자)';
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
  -- ⚠️ 예약중도 **팔고 있는 것**으로 셉니다 (아직 안 팔렸습니다)
  if (select count(*) from listing
       where by_user = v_uid and state in ('open','reserved')) >= 10 then
    raise exception '팔고 계신 매물이 열입니다. 먼저 정리해 주세요';
  end if;
  if (select count(*) from listing
       where by_user = v_uid and created_at > now() - interval '1 day') >= 20 then
    raise exception '오늘은 더 올릴 수 없습니다 (하루 스무 개)';
  end if;
  insert into listing (by_user, sub, region, ship, title, body, price,
                       cond, contact, agree_at, brand, model)
  values (v_uid, v_sub, v_region, v_ship, v_title, v_body, v_price,
          v_cond, v_contact, (p->>'agree_at')::timestamptz, v_brand, v_model)
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
  if v_st not in ('open','reserved') then
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
  if p ? 'model' and char_length(btrim(coalesce(p->>'model',''))) > 40 then
    raise exception '모델명이 너무 깁니다 (40자)';
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
    model   = case when p ? 'model'
                   then nullif(btrim(coalesce(p->>'model','')), '')
                   else model end,
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
create or replace function ask_listing(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_lst     uuid := nullif(btrim(coalesce(p->>'listing_id','')), '')::uuid;
  v_msg     text := nullif(btrim(coalesce(p->>'msg','')), '');
  v_contact text := nullif(btrim(coalesce(p->>'contact','')), '');
  v_own     uuid;
  v_st      text;
  v_id      uuid;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_lst is null then raise exception '어느 매물인지 알 수 없습니다'; end if;
  if v_contact is null then raise exception '연락처를 적어 주세요'; end if;
  if length(v_contact) > 100 then raise exception '연락처가 너무 깁니다'; end if;
  if v_msg is not null and length(v_msg) > 300 then
    raise exception '남기실 말이 너무 깁니다 (300자)';
  end if;
  if p->>'agree_at' is null then
    raise exception '개인정보 수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes'
     or (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의 시각이 올바르지 않습니다';
  end if;
  -- ⚠️ 매물 줄을 먼저 잠급니다 (동시에 들어오는 것을 가지런히)
  select by_user, state into v_own, v_st from listing where id = v_lst for update;
  if v_st is null then raise exception '그런 매물이 없습니다'; end if;
  -- ⚠️⚠️ **예약중에도 문의를 받습니다** (0056 → 0069) — 예약중은
  --   "팔렸다" 가 아니고 앞의 거래가 깨질 수 있습니다. 문을 닫아
  --   두면 손님은 까닭을 모르고 "고장" 으로 읽습니다 — 화면이
  --   **예약중이라는 사실을 그 자리에서** 말합니다.
  if v_st not in ('open','reserved') then
    raise exception '지금은 문의를 받지 않는 매물입니다';
  end if;
  -- ⚠️⚠️ 제 매물에 제가 문의할 수 없습니다 (후기에서 제 업체에 못 쓰게
  --   막은 그 자리와 같은 결입니다)
  if coalesce(v_own = v_uid, false) then
    raise exception '올리신 분은 문의하실 수 없습니다';
  end if;
  -- ⚠️ 쏟아붓기 — 하루에 넣는 문의 수를 막습니다
  if (select count(*) from listingask
       where by_user = v_uid and created_at > now() - interval '1 day') >= 30 then
    raise exception '오늘은 더 문의할 수 없습니다 (하루 서른 건)';
  end if;
  insert into listingask (listing_id, by_user, msg, contact, agree_at)
  values (v_lst, v_uid, v_msg, v_contact, (p->>'agree_at')::timestamptz)
  returning id into v_id;
  return v_id;
exception
  -- ⚠️ 같은 매물에 두 번 — 표의 unique 가 막는데, 그 말을 그대로
  --   내보내면 손님에게 영문 제약 이름이 보입니다
  when unique_violation then
    raise exception '이미 이 매물에 문의하셨습니다';
end $$;
revoke all on function ask_listing(jsonb) from public;
grant execute on function ask_listing(jsonb) to authenticated;
create or replace function close_listing(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_to  text := coalesce(nullif(btrim(coalesce(p->>'state','')), ''), 'closed');
  v_own uuid;
  v_st  text;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 매물인지 알 수 없습니다'; end if;
  if v_to not in ('open','reserved','done','closed') then
    raise exception '옮길 수 없는 상태입니다';
  end if;
  select by_user, state into v_own, v_st from listing where id = v_id for update;
  if v_st is null then raise exception '그런 매물이 없습니다'; end if;
  if not coalesce(v_own = v_uid, false) then
    raise exception '올리신 분만 바꾸실 수 있습니다';
  end if;
  if v_st = 'hidden' then
    raise exception '운영자가 가린 매물입니다 — 고객센터로 문의해 주세요';
  end if;
  if v_st not in ('open','reserved') then
    raise exception '이미 내려간 매물입니다';
  end if;
  -- ⚠️ 같은 상태로 옮기는 것은 **거절**합니다 — 조용히 성공으로 끝내면
  --   화면이 "바꿨습니다" 를 적는데 실제로는 아무 일도 안 일어났습니다
  --   (0054 의 "없는 역할을 떼면 거절한다" 와 같은 결).
  if v_to = v_st then
    raise exception '이미 그 상태입니다';
  end if;
  update listing set state = v_to, updated_at = now() where id = v_id;
  return v_to;
end $$;
revoke all on function close_listing(jsonb) from public;
grant execute on function close_listing(jsonb) to authenticated;
drop view if exists v_listing_open;
create view v_listing_open as
  select l.id, l.sub, l.region, l.ship, l.title, l.body, l.price, l.cond,
         l.brand, l.model, l.state, l.created_at,
         left(coalesce(nullif(btrim(a.name), ''), '회원'), 1) ||
         repeat('*', greatest(
           char_length(coalesce(nullif(btrim(a.name), ''), '회원')) - 1, 0))
           as seller,
         (select count(*) from listingask k
           where k.listing_id = l.id and k.state = 'asked') as ask_n,
         (select count(*) from listingphoto f where f.listing_id = l.id) as photo_n,
         (select f.path from listingphoto f
           where f.listing_id = l.id
           order by f.ord, f.created_at, f.id limit 1) as thumb
    from listing l
    left join account a on a.id = l.by_user
   where l.state in ('open','reserved');
grant select on v_listing_open to anon, authenticated;
drop view if exists v_listing_photo_public;
create view v_listing_photo_public as
  select f.id, f.listing_id, f.path, f.caption, f.ord, f.created_at
    from listingphoto f
    join listing l on l.id = f.listing_id
   where l.state in ('open','reserved');
grant select on v_listing_photo_public to anon, authenticated;
insert into schema_version (n, name) values (69, '0069_listing_market')
  on conflict (n) do nothing;
commit;
commit;
begin;
alter table listing add column if not exists hidden_from text;
comment on column listing.hidden_from is
  '가리기 직전의 state. 되돌릴 때 이 값으로 돌아갑니다 (null 이면 open).';
grant select (model, hidden_from) on listing to authenticated;
create or replace function move_listing(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_to  text := nullif(btrim(coalesce(p->>'state','')), '');
  v_why text := nullif(btrim(coalesce(p->>'why','')), '');
  v_st  text;
  v_fr  text;
  v_new text;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 매물인지 알 수 없습니다'; end if;
  -- ⚠️⚠️ 0070 — 되돌리는 길이 생겼습니다. `open` 은 "가리기 전으로" 라는
  --   뜻이고, 어느 상태로 돌아가는지는 `hidden_from` 이 정합니다.
  if v_to not in ('hidden','open') then
    raise exception '옮길 수 없는 상태입니다';
  end if;
  if not coalesce(my_role() in ('staff','admin'), false) then
    raise exception '가리는 것은 운영자만 할 수 있습니다';
  end if;
  select state, hidden_from into v_st, v_fr
    from listing where id = v_id for update;
  if v_st is null then raise exception '그런 매물이 없습니다'; end if;
  if v_to = 'hidden' then
    -- ⚠️⚠️ 까닭을 **반드시** 받습니다 — 까닭 없이 가릴 수 있으면 불평이
    --   올 때마다 지워 주는 자리가 됩니다
    if v_why is null or char_length(v_why) < 5 then
      raise exception '가리는 까닭을 다섯 글자 이상 적어 주세요';
    end if;
    if v_st = 'hidden' then raise exception '이미 가려진 매물입니다'; end if;
    update listing set state = 'hidden', hidden_why = v_why,
                       hidden_by = v_uid, hidden_at = now(),
                       hidden_from = v_st, updated_at = now()
     where id = v_id;
    v_new := 'hidden';
  else
    if v_st <> 'hidden' then raise exception '가려진 매물이 아닙니다'; end if;
    -- ⚠️ 되돌릴 때는 까닭을 안 받습니다 — 받으면 되돌리기가 가리기보다
    --   어려워지고, 그러면 잘못 가린 것이 그대로 남습니다.
    v_new := coalesce(nullif(btrim(coalesce(v_fr,'')), ''), 'open');
    -- ⚠️⚠️ **가리기 전 상태가 다시 `hidden` 일 수는 없습니다** — 그랬으면
    --   위에서 '이미 가려진 매물입니다' 로 막혔습니다. 그래도 한 번 더
    --   봅니다 (0070 전에 손으로 적힌 줄이 있을 수 있습니다).
    if v_new = 'hidden' then v_new := 'open'; end if;
    update listing set state = v_new, hidden_why = null, hidden_by = null,
                       hidden_at = null, hidden_from = null, updated_at = now()
     where id = v_id;
  end if;
  -- ⚠️ 감사 기록에 **본문을 넣지 않습니다** (오래 남고 보는 사람도 넓습니다)
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, data)
  values (v_uid, my_role(), 'listing', v_id::text, v_st, v_new,
          jsonb_build_object('why_len', coalesce(char_length(v_why), 0)));
  return v_new;
end $$;
revoke all on function move_listing(jsonb) from public;
grant execute on function move_listing(jsonb) to authenticated;
insert into schema_version (n, name) values (70, '0070_listing_unhide')
  on conflict (n) do nothing;
commit;
commit;
select max(n) from schema_version;
alter table provider_apply
  add column if not exists by_user uuid references auth.users(id) on delete set null;
create index if not exists provider_apply_byuser_idx
  on provider_apply (by_user) where by_user is not null;
create or replace function make_apply(p jsonb)
  returns text language plpgsql security definer set search_path = public as $$
declare
  v_company  text := btrim(coalesce(p->>'company', ''));
  v_name     text := btrim(coalesce(p->>'name', ''));
  v_tel      text := btrim(coalesce(p->>'tel', ''));
  v_email    text := nullif(btrim(coalesce(p->>'email', '')), '');
  v_brn      text := nullif(btrim(coalesce(p->>'brn', '')), '');
  v_region   text := nullif(btrim(coalesce(p->>'region', '')), '');
  v_addr     text := nullif(btrim(coalesce(p->>'addr', '')), '');
  v_note     text := nullif(btrim(coalesce(p->>'note', '')), '');
  v_svc      text[] := coalesce(
                 (select array_agg(btrim(x)) from jsonb_array_elements_text(
                    case when jsonb_typeof(p->'services') = 'array'
                         then p->'services' else '[]'::jsonb end) as t(x)
                  where btrim(x) <> ''), '{}'::text[]);
  v_digits   text;
  v_no       text;
begin
  -- ⚠️ 자물쇠마다 **다른 말**로 거절합니다. 같은 말이면 하나를 빼 봐도
  --    다른 것이 먼저 막아 엉뚱한 까닭으로 통과합니다.
  if v_company = '' then raise exception '상호를 적어 주세요'; end if;
  if v_name    = '' then raise exception '담당자 성함을 적어 주세요'; end if;
  if v_tel     = '' then raise exception '연락처를 적어 주세요'; end if;
  if length(v_company) > 80  then raise exception '상호가 너무 깁니다'; end if;
  if length(v_name)    > 40  then raise exception '성함이 너무 깁니다'; end if;
  -- ⚠️ 새 칸도 길이를 막습니다 — 안 막으면 2천 자짜리 주소가 들어옵니다
  if v_addr is not null and length(v_addr) > 200 then
    raise exception '사업장 주소가 너무 깁니다';
  end if;
  if v_note is not null and length(v_note) > 2000 then
    raise exception '남기신 말씀이 너무 깁니다';
  end if;
  v_digits := regexp_replace(v_tel, '[^0-9]', '', 'g');
  -- ⚠️ 경계값: 9자리(02-xxx-xxxx)부터 11자리(010-xxxx-xxxx)까지입니다.
  if length(v_digits) < 9 or length(v_digits) > 11 then
    raise exception '연락처를 다시 봐 주세요 — 숫자 아홉에서 열한 자리입니다';
  end if;
  if array_length(v_svc, 1) is null then
    raise exception '하시는 일을 하나 이상 골라 주세요';
  end if;
  if array_length(v_svc, 1) > 20 then
    raise exception '고르신 항목이 너무 많습니다';
  end if;
  -- ⚠️⚠️ 동의 시각은 **화면이 보낸 값**입니다. 미래이거나 너무 오래된
  --    것은 믿지 않습니다 (개인정보보호법 제15조 — 그 자리에서 받은
  --    동의여야 합니다).
  if (p->>'agree_at') is null then
    raise exception '수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes' then
    raise exception '동의 시각이 미래입니다';
  end if;
  if (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의가 오래되었습니다 — 다시 한 번 눌러 주세요';
  end if;
  -- 중복 · 허위 신청 막기 (지시서 5번 A)
  if exists (
    select 1 from provider_apply
     where regexp_replace(tel, '[^0-9]', '', 'g') = v_digits
       and state = 'new'
       and created_at > now() - interval '10 minutes')
  then
    raise exception '방금 같은 번호로 신청이 들어왔습니다 — 잠시 뒤에 다시 해 주세요';
  end if;
  v_no := 'GA' || to_char(now() at time zone 'Asia/Seoul', 'YYMMDD')
               || '-' || lpad(nextval('apply_no_seq')::text, 4, '0');
  -- ⚠️⚠️ 0071 — `by_user` 를 같이 담습니다. 로그인하셨으면 승인하는 그
  --   자리에서 담당자로 이어 드릴 수 있고(초대 코드가 필요 없습니다),
  --   비로그인이면 null 이라 초대 코드 길로 갑니다.
  --   ⚠️ 화면이 보낸 값을 안 믿습니다 — `auth.uid()` 를 씁니다.
  insert into provider_apply
    (no, company, brn, name, tel, email, region, addr, services, note, agree_at, by_user)
  values
    (v_no, v_company, v_brn, v_name, v_tel, v_email, v_region, v_addr, v_svc, v_note,
     (p->>'agree_at')::timestamptz, auth.uid());
  -- ⚠️ 감사 기록에 **성함 · 연락처를 넣지 않습니다.** audit_log 는 오래
  --    남고 보는 사람도 넓습니다. 신청번호로 찾아가면 됩니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (auth.uid(), my_role(), 'provider_apply', v_no, 'new', '입점 신청 접수',
          jsonb_build_object('services', v_svc, 'region', v_region,
                             'signed_in', (auth.uid() is not null)));
  return v_no;
end $$;
revoke all on function make_apply(jsonb) from public;
grant execute on function make_apply(jsonb) to anon, authenticated;
create or replace function link_apply_account(p jsonb)
  returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_no   text     := btrim(coalesce(p->>'no', ''));
  v_why  text     := nullif(btrim(coalesce(p->>'why', '')), '');
  r      provider_apply%rowtype;
  v_cur  text;
  v_crole app_role;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  -- ⚠️ coalesce 로 NULL 을 땅에 내려놓습니다 — my_role() 이 NULL 이면
  --    not (NULL) 이 NULL 이라 if 가 **안 걸립니다** (0034 에서 겪었습니다).
  if not coalesce(v_role in ('staff','admin'), false) then
    raise exception '담당자 연결은 운영자만 할 수 있습니다';
  end if;
  if v_no = '' then raise exception '어느 신청인지 접수번호를 적어 주세요'; end if;
  if v_why is null then raise exception '연결하시는 까닭을 적어 주세요'; end if;
  select * into r from provider_apply where no = v_no;
  if not found then raise exception '그런 신청이 없습니다 — %', v_no; end if;
  -- ⚠️ 자물쇠마다 **다른 말**로 거절합니다
  if r.by_user is null then
    raise exception '로그인하지 않고 넣으신 신청입니다 — 초대 코드를 내 주세요';
  end if;
  if r.provider_id is null then
    raise exception '아직 업체로 등록되지 않은 신청입니다 — 먼저 업체로 등록해 주세요';
  end if;
  if not exists (select 1 from provider where id = r.provider_id) then
    raise exception '그 신청이 가리키는 업체를 찾을 수 없습니다';
  end if;
  select provider_id, role into v_cur, v_crole from account where id = r.by_user;
  if not found then
    raise exception '신청하신 분의 계정을 찾을 수 없습니다';
  end if;
  if coalesce(v_crole in ('staff','admin'), false) then
    raise exception '운영자 계정은 업체 담당자로 이을 수 없습니다';
  end if;
  if v_cur is not null and v_cur = r.provider_id then
    raise exception '이미 그 업체의 담당자입니다';
  end if;
  if v_cur is not null then
    raise exception '그분은 다른 업체에 이어져 있습니다 — 먼저 끊어 주세요';
  end if;
  update account
     set provider_id = r.provider_id,
         role        = 'provider'
   where id = r.by_user;
  -- ⚠️ 기록에 **성함 · 연락처를 넣지 않습니다** — 접수번호와 업체 id 로
  --   찾아가면 됩니다(audit_log 는 오래 남고 보는 사람도 넓습니다).
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'provider', r.provider_id, 'staff-linked', v_why,
          jsonb_build_object('apply_no', r.no, 'via', 'apply'));
  return jsonb_build_object('provider', r.provider_id, 'apply', r.no);
end $$;
revoke all on function link_apply_account(jsonb) from public;
grant execute on function link_apply_account(jsonb) to authenticated;
alter table provider
  add column if not exists kind text
    constraint provider_kind_ck check (kind is null or kind in ('biz','person'));
create or replace function set_provider_kind(p jsonb)
  returns void language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_id   text     := btrim(coalesce(p->>'id', ''));
  v_kind text     := nullif(btrim(coalesce(p->>'kind', '')), '');
  v_why  text     := nullif(btrim(coalesce(p->>'why', '')), '');
  v_was  text;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if not coalesce(v_role = 'admin', false) then
    raise exception '개인 · 사업자 구분은 관리자만 정할 수 있습니다';
  end if;
  if v_id = '' then raise exception '어느 업체인지 적어 주세요'; end if;
  if v_why is null then raise exception '정하시는 까닭을 적어 주세요'; end if;
  if v_kind is not null and v_kind not in ('biz','person') then
    raise exception '구분은 사업자 · 개인 둘 중 하나입니다 — %', v_kind;
  end if;
  select kind into v_was from provider where id = v_id;
  if not found then raise exception '그런 업체가 없습니다 — %', v_id; end if;
  -- ⚠️ 같은 값으로 옮기는 것은 거절합니다 — 조용히 성공하면 화면이
  --   "바꿨습니다" 를 적는데 아무 일도 안 일어났고, 기록만 거짓이 됩니다
  --   (0054 · 0069 에서 세운 규칙).
  if v_was is not distinct from v_kind then
    raise exception '이미 그 값입니다';
  end if;
  update provider set kind = v_kind where id = v_id;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'provider', v_id,
          coalesce('kind:' || v_kind, 'kind:none'), v_why,
          jsonb_build_object('was', v_was));
end $$;
revoke all on function set_provider_kind(jsonb) from public;
grant execute on function set_provider_kind(jsonb) to authenticated;
alter table provider
  add column if not exists place_name text
    constraint provider_place_ck check (place_name is null or length(place_name) <= 80);
alter table provider
  add column if not exists lesson_goals text[] not null default '{}';
create or replace function save_provider_self(
  p_data jsonb default '{}'::jsonb,
  p_why  text  default null
) returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_pv   text     := my_provider();
  v_scale text    := nullif(btrim(coalesce(p_data->>'scale','')), '');
  v_email text    := nullif(btrim(coalesce(p_data->>'email','')), '');
  v_place text    := nullif(btrim(coalesce(p_data->>'placeName','')), '');
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if v_role <> 'provider' or v_pv is null then
    raise exception '업체 계정으로 로그인하셔야 합니다';
  end if;
  if not exists (select 1 from provider where id = v_pv) then
    raise exception '연결된 업체를 찾을 수 없습니다';
  end if;
  if v_scale is not null and v_scale not in ('small','mid','large') then
    raise exception '거래 규모는 small · mid · large 중 하나입니다 — %', v_scale;
  end if;
  if exists (
    select 1 from jsonb_array_elements_text(
      case when jsonb_typeof(p_data->'contactWays') = 'array'
           then p_data->'contactWays' else '[]'::jsonb end) as t(x)
     where btrim(x) not in ('phone','visit','online','shop'))
  then
    raise exception '상담 방식은 전화 · 방문 · 온라인 · 매장 중에서 고르셔야 합니다';
  end if;
  -- ⚠️ 적으셨으면 꼴을 봅니다 (비우는 것은 됩니다 — 지어내지 않습니다).
  --   ⚠️⚠️ **다른 말로 거절합니다** — check 와 같은 말로 거절하면 어느
  --   자물쇠가 막았는지 알 수 없습니다 (검사가 둘을 갈라 셉니다).
  if v_email is not null and v_email not like '%@%.%' then
    raise exception '이메일 꼴이 아닙니다 — %', v_email;
  end if;
  -- ⚠️ 0071 — 레슨 장소. 표의 check 와 **다른 말**로 거절합니다.
  if v_place is not null and length(v_place) > 80 then
    raise exception '레슨 장소 이름이 너무 깁니다 (여든 자까지)';
  end if;
  -- ⚠️⚠️ 레슨 목적은 **키를 안 봅니다**(DB 가 키 묶음을 모릅니다) — 갯수와
  --   길이만 막습니다. 모르는 키가 들어오면 화면이 **그 글자를 그대로**
  --   보여 줍니다(이름을 지어내지 않습니다).
  if (select count(*) from jsonb_array_elements_text(
        case when jsonb_typeof(p_data->'lessonGoals') = 'array'
             then p_data->'lessonGoals' else '[]'::jsonb end)) > 12 then
    raise exception '레슨 목적은 열두 개까지 고르실 수 있습니다';
  end if;
  update provider set
    intro = nullif(btrim(coalesce(p_data->>'intro','')), ''),
    regions = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'regions','[]'::jsonb)) x), '{}'),
    gu = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'gu','[]'::jsonb)) x), '{}'),
    industries = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'industries','[]'::jsonb)) x), '{}'),
    since = nullif(p_data->>'since','')::int,
    consult_hours = nullif(btrim(coalesce(p_data->>'consultHours','')), ''),
    brands = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'brands','[]'::jsonb)) x), '{}'),
    scale = v_scale,
    ceo = nullif(btrim(coalesce(p_data->>'ceo','')), ''),
    addr = nullif(btrim(coalesce(p_data->>'addr','')), ''),
    tel = nullif(btrim(coalesce(p_data->>'tel','')), ''),
    email = v_email,
    contact_ways = coalesce((select array_agg(btrim(x))
      from jsonb_array_elements_text(
        case when jsonb_typeof(p_data->'contactWays') = 'array'
             then p_data->'contactWays' else '[]'::jsonb end) x), '{}'),
    place_name = v_place,
    lesson_goals = coalesce((select array_agg(btrim(x))
      from jsonb_array_elements_text(
        case when jsonb_typeof(p_data->'lessonGoals') = 'array'
             then p_data->'lessonGoals' else '[]'::jsonb end) x
      where btrim(x) <> ''), '{}')
  where id = v_pv;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'provider', v_pv, 'self-updated', p_why, p_data);
  return v_pv;
end $$;
revoke all on function save_provider_self(jsonb, text) from public;
grant execute on function save_provider_self(jsonb, text) to authenticated;
drop view if exists v_provider_card;
create view v_provider_card as
  select p.id, p.name, p.intro, p.regions, p.gu, p.subs, p.since,
         p.consult_hours, p.verified, p.brands, p.scale, p.contact_ways,
         p.ceo, p.addr, p.tel, p.email, p.brn,
         p.kind, p.place_name, p.lesson_goals,
         p.is_test
    from provider p
   where p.listed = true
     and p.is_test = false
     and p.state = 'approved';
grant select on v_provider_card to anon, authenticated;
insert into schema_version (n, name) values (71, '0071_pro_self')
  on conflict (n) do nothing;
commit;
do $$
declare r record;
begin
  for r in
    select con.conname
      from pg_constraint con
      join pg_class     c on c.oid = con.conrelid
      join pg_attribute a on a.attrelid = c.oid
                         and a.attnum = any(con.conkey)
     where c.relname = 'jobpost'
       and con.contype = 'c'
       and a.attname = 'kind'
  loop
    execute format('alter table jobpost drop constraint %I', r.conname);
  end loop;
end $$;
alter table jobpost
  add constraint jobpost_kind_ck
  check (kind in ('hire','seek','biz','facility'));
alter table jobpost add column if not exists role     text;
alter table jobpost add column if not exists emp_type text;
alter table jobpost add column if not exists pay_type text;
alter table jobpost add column if not exists pay_min  bigint;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'jobpost_role_ck') then
    alter table jobpost add constraint jobpost_role_ck
      check (role is null or (btrim(role) <> '' and char_length(role) <= 40));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'jobpost_emp_ck') then
    alter table jobpost add constraint jobpost_emp_ck
      check (emp_type is null or (btrim(emp_type) <> '' and char_length(emp_type) <= 40));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'jobpost_paytype_ck') then
    alter table jobpost add constraint jobpost_paytype_ck
      check (pay_type is null or pay_type in
             ('negotiate','monthly','annual','hourly','per_round','price'));
  end if;
  -- ⚠️⚠️ 경계값 — **0 원도 값입니다**(무료로 드리는 시설 · 장비).
  --   위는 100억에서 막습니다: 그 위는 사람이 자릿수를 잘못 적은
  --   것입니다 (99.99% 에서 85조원이 화면에 나간 그 자리 · 작업 기억).
  if not exists (select 1 from pg_constraint where conname = 'jobpost_paymin_ck') then
    alter table jobpost add constraint jobpost_paymin_ck
      check (pay_min is null or (pay_min >= 0 and pay_min <= 10000000000));
  end if;
  -- ⚠️⚠️ 숫자를 적었으면 **무엇의 숫자인지**를 같이 적어야 합니다.
  --   'negotiate'(협의)는 숫자를 들 수 없습니다 — 협의인데 금액이 있으면
  --   화면이 어느 쪽을 적어야 할지 알 수 없습니다.
  if not exists (select 1 from pg_constraint where conname = 'jobpost_pay_pair_ck') then
    alter table jobpost add constraint jobpost_pay_pair_ck
      check (pay_min is null
             or (pay_type is not null and pay_type <> 'negotiate'));
  end if;
end $$;
create index if not exists jobpost_filter_ix
  on jobpost (kind, region, state);
grant select (role, emp_type, pay_type, pay_min) on jobpost to authenticated;
drop view if exists v_job_open;
create view v_job_open as
  select j.id, j.kind, j.sub, j.region, j.title, j.body, j.pay, j.terms,
         j.role, j.emp_type, j.pay_type, j.pay_min,
         j.close_at, j.created_at, j.updated_at,
         case
           when btrim(coalesce(ac.name, '')) = '' then '회원'
           else left(btrim(ac.name), 1) ||
                repeat('*', greatest(char_length(btrim(ac.name)) - 1, 1))
         end as who,
         case when pv.id is not null and pv.state = 'approved'
                   and pv.is_test = false
              then pv.name end as pro_name,
         (select count(*) from jobapply a
           where a.post_id = j.id and a.state in ('applied','accepted')) as apply_n
    from jobpost j
    left join account  ac on ac.id = j.by_user
    left join provider pv on pv.id = j.provider_id
   where j.state = 'open'
     and (j.close_at is null or j.close_at >= kst_today());
grant select on v_job_open to anon, authenticated;
create or replace function open_jobpost(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_kind    text := nullif(btrim(coalesce(p->>'kind','')), '');
  v_sub     text := nullif(btrim(coalesce(p->>'sub','')), '');
  v_region  text := nullif(btrim(coalesce(p->>'region','')), '');
  v_title   text := nullif(btrim(coalesce(p->>'title','')), '');
  v_body    text := nullif(btrim(coalesce(p->>'body','')), '');
  v_pay     text := nullif(btrim(coalesce(p->>'pay','')), '');
  v_terms   text := nullif(btrim(coalesce(p->>'terms','')), '');
  v_contact text := nullif(btrim(coalesce(p->>'contact','')), '');
  v_role    text := nullif(btrim(coalesce(p->>'role','')), '');
  v_emp     text := nullif(btrim(coalesce(p->>'emp_type','')), '');
  v_ptype   text := nullif(btrim(coalesce(p->>'pay_type','')), '');
  v_pmin    bigint;
  v_aspro   boolean := coalesce((p->>'as_pro')::boolean, false);
  v_close   date;
  v_pv      text;
  v_id      uuid;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  if v_kind is null or v_kind not in ('hire','seek','biz','facility') then
    raise exception '구인 · 구직 · 제휴 · 시설 · 장비 거래 가운데 하나를 골라 주세요';
  end if;
  if v_sub is null then
    raise exception '어떤 일인지 골라 주세요';
  end if;
  if char_length(v_sub) > 40 then
    raise exception '분류 값이 올바르지 않습니다';
  end if;
  if v_region is null then
    raise exception '지역을 골라 주세요';
  end if;
  if v_title is null or char_length(v_title) < 2 then
    raise exception '제목을 두 글자 이상 적어 주세요';
  end if;
  if char_length(v_title) > 60 then
    raise exception '제목이 너무 깁니다 (60자)';
  end if;
  if v_body is null or char_length(v_body) < 5 then
    raise exception '내용을 다섯 글자 이상 적어 주세요';
  end if;
  if char_length(v_body) > 2000 then
    raise exception '내용이 너무 깁니다 (2000자)';
  end if;
  if v_pay is not null and char_length(v_pay) > 60 then
    raise exception '급여 칸이 너무 깁니다 (60자)';
  end if;
  if v_terms is not null and char_length(v_terms) > 200 then
    raise exception '근무 조건이 너무 깁니다 (200자)';
  end if;
  if v_contact is null then
    raise exception '연락처를 적어 주세요';
  end if;
  if char_length(v_contact) > 100 then
    raise exception '연락처가 너무 깁니다';
  end if;
  -- ── 새 칸 넷 ────────────────────────────────────────────────────
  if v_role is not null and char_length(v_role) > 40 then
    raise exception '직무 값이 올바르지 않습니다';
  end if;
  if v_emp is not null and char_length(v_emp) > 40 then
    raise exception '고용 형태 값이 올바르지 않습니다';
  end if;
  -- ⚠️ 고용 형태는 사람을 뽑고 찾는 자리에만 있습니다. 제휴 · 시설
  --   거래에 붙으면 거르개가 그 글을 엉뚱한 칸에 모읍니다.
  if v_emp is not null and v_kind not in ('hire','seek') then
    raise exception '고용 형태는 채용 · 구직 공고에만 적을 수 있습니다';
  end if;
  if v_role is not null and v_kind = 'facility' then
    raise exception '시설 · 장비 거래에는 직무를 적지 않습니다';
  end if;
  if v_ptype is not null and v_ptype not in
     ('negotiate','monthly','annual','hourly','per_round','price') then
    raise exception '금액 갈래가 올바르지 않습니다';
  end if;
  -- ⚠️⚠️ **거래 희망가와 급여를 섞지 않습니다** — 같은 칸에 담기지만
  --   뜻이 다릅니다. 섞이면 "월 300만원 이상" 거르개가 중고 타석기
  --   300만원을 같이 끌어옵니다.
  if v_kind = 'facility' and v_ptype is not null
     and v_ptype not in ('negotiate','price') then
    raise exception '시설 · 장비 거래는 급여가 아니라 거래 희망가를 적습니다';
  end if;
  if v_kind <> 'facility' and v_ptype = 'price' then
    raise exception '거래 희망가는 시설 · 장비 거래에만 적을 수 있습니다';
  end if;
  if nullif(btrim(coalesce(p->>'pay_min','')), '') is not null then
    begin
      v_pmin := (p->>'pay_min')::bigint;
    exception when others then
      raise exception '금액은 숫자로 적어 주세요';
    end;
    if v_pmin < 0 then
      raise exception '금액은 0 이상이어야 합니다';
    end if;
    if v_pmin > 10000000000 then
      raise exception '금액이 너무 큽니다 (자릿수를 확인해 주세요)';
    end if;
    if v_ptype is null or v_ptype = 'negotiate' then
      raise exception '금액을 적으시려면 무엇의 금액인지도 골라 주세요';
    end if;
  end if;
  if p->>'agree_at' is null then
    raise exception '개인정보 수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes'
     or (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의 시각이 올바르지 않습니다';
  end if;
  if nullif(btrim(coalesce(p->>'close_at','')), '') is not null then
    begin
      v_close := (p->>'close_at')::date;
    exception when others then
      raise exception '마감일이 올바르지 않습니다';
    end;
    if v_close < current_date then
      raise exception '지난 날짜로는 마감일을 잡을 수 없습니다';
    end if;
    if v_close > current_date + interval '365 days' then
      raise exception '마감일이 너무 멉니다 (1년 안으로)';
    end if;
  end if;
  if v_aspro then
    v_pv := my_provider();
    if v_pv is null then
      raise exception '업체 이름으로 올리려면 업체 담당자로 로그인하셔야 합니다';
    end if;
    if not coalesce((select pv.state = 'approved' and pv.is_test = false
                       from provider pv where pv.id = v_pv), false) then
      raise exception '승인된 업체만 업체 이름으로 올릴 수 있습니다';
    end if;
  end if;
  if (select count(*) from jobpost
       where by_user = v_uid and state = 'open') >= 10 then
    raise exception '올려 두신 글이 열입니다. 먼저 마감해 주세요';
  end if;
  if (select count(*) from jobpost
       where by_user = v_uid and created_at > now() - interval '1 day') >= 20 then
    raise exception '오늘은 더 올릴 수 없습니다 (하루 스무 개)';
  end if;
  insert into jobpost (by_user, provider_id, kind, sub, region, title, body,
                       pay, terms, close_at, contact, agree_at,
                       role, emp_type, pay_type, pay_min)
  values (v_uid, v_pv, v_kind, v_sub, v_region, v_title, v_body,
          v_pay, v_terms, v_close, v_contact, (p->>'agree_at')::timestamptz,
          v_role, v_emp, v_ptype, v_pmin)
  returning id into v_id;
  return v_id;
end $$;
grant execute on function open_jobpost(jsonb) to authenticated;
create or replace function edit_jobpost(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_id      uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_title   text := nullif(btrim(coalesce(p->>'title','')), '');
  v_body    text := nullif(btrim(coalesce(p->>'body','')), '');
  v_pay     text := nullif(btrim(coalesce(p->>'pay','')), '');
  v_terms   text := nullif(btrim(coalesce(p->>'terms','')), '');
  v_contact text := nullif(btrim(coalesce(p->>'contact','')), '');
  v_close   date;
  v_by      uuid;
  v_st      text;
  v_kind    text;
  v_role    text;
  v_emp     text;
  v_ptype   text;
  v_pmin    bigint;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 글인지 알 수 없습니다'; end if;
  select by_user, state, kind, role, emp_type, pay_type, pay_min
    into v_by, v_st, v_kind, v_role, v_emp, v_ptype, v_pmin
    from jobpost where id = v_id for update;
  if v_by is null then raise exception '그런 글이 없습니다'; end if;
  if not coalesce(v_by = v_uid, false) then
    raise exception '올리신 분만 고치실 수 있습니다';
  end if;
  if v_st = 'hidden' then
    raise exception '운영자가 가린 글은 고치실 수 없습니다';
  end if;
  if v_st = 'dropped' then
    raise exception '내리신 글은 고치실 수 없습니다';
  end if;
  if v_title is null or char_length(v_title) < 2 then
    raise exception '제목을 두 글자 이상 적어 주세요';
  end if;
  if char_length(v_title) > 60 then
    raise exception '제목이 너무 깁니다 (60자)';
  end if;
  if v_body is null or char_length(v_body) < 5 then
    raise exception '내용을 다섯 글자 이상 적어 주세요';
  end if;
  if char_length(v_body) > 2000 then
    raise exception '내용이 너무 깁니다 (2000자)';
  end if;
  if v_pay is not null and char_length(v_pay) > 60 then
    raise exception '급여 칸이 너무 깁니다 (60자)';
  end if;
  if v_terms is not null and char_length(v_terms) > 200 then
    raise exception '근무 조건이 너무 깁니다 (200자)';
  end if;
  if v_contact is null then
    raise exception '연락처를 적어 주세요';
  end if;
  if char_length(v_contact) > 100 then
    raise exception '연락처가 너무 깁니다';
  end if;
  -- ── 보냈을 때만 바꿉니다 ────────────────────────────────────────
  if p ? 'role' then
    v_role := nullif(btrim(coalesce(p->>'role','')), '');
  end if;
  if p ? 'emp_type' then
    v_emp := nullif(btrim(coalesce(p->>'emp_type','')), '');
  end if;
  if p ? 'pay_type' then
    v_ptype := nullif(btrim(coalesce(p->>'pay_type','')), '');
  end if;
  if p ? 'pay_min' then
    if nullif(btrim(coalesce(p->>'pay_min','')), '') is null then
      v_pmin := null;
    else
      begin
        v_pmin := (p->>'pay_min')::bigint;
      exception when others then
        raise exception '금액은 숫자로 적어 주세요';
      end;
    end if;
  end if;
  -- ⚠️ 올릴 때와 **같은 말로** 거절합니다 (두 문이 다른 말을 하면
  --   손님은 무엇이 틀렸는지 알 수 없습니다).
  if v_role is not null and char_length(v_role) > 40 then
    raise exception '직무 값이 올바르지 않습니다';
  end if;
  if v_emp is not null and char_length(v_emp) > 40 then
    raise exception '고용 형태 값이 올바르지 않습니다';
  end if;
  if v_emp is not null and v_kind not in ('hire','seek') then
    raise exception '고용 형태는 채용 · 구직 공고에만 적을 수 있습니다';
  end if;
  if v_role is not null and v_kind = 'facility' then
    raise exception '시설 · 장비 거래에는 직무를 적지 않습니다';
  end if;
  if v_ptype is not null and v_ptype not in
     ('negotiate','monthly','annual','hourly','per_round','price') then
    raise exception '금액 갈래가 올바르지 않습니다';
  end if;
  if v_kind = 'facility' and v_ptype is not null
     and v_ptype not in ('negotiate','price') then
    raise exception '시설 · 장비 거래는 급여가 아니라 거래 희망가를 적습니다';
  end if;
  if v_kind <> 'facility' and v_ptype = 'price' then
    raise exception '거래 희망가는 시설 · 장비 거래에만 적을 수 있습니다';
  end if;
  if v_pmin is not null then
    if v_pmin < 0 then
      raise exception '금액은 0 이상이어야 합니다';
    end if;
    if v_pmin > 10000000000 then
      raise exception '금액이 너무 큽니다 (자릿수를 확인해 주세요)';
    end if;
    if v_ptype is null or v_ptype = 'negotiate' then
      raise exception '금액을 적으시려면 무엇의 금액인지도 골라 주세요';
    end if;
  end if;
  if nullif(btrim(coalesce(p->>'close_at','')), '') is not null then
    begin
      v_close := (p->>'close_at')::date;
    exception when others then
      raise exception '마감일이 올바르지 않습니다';
    end;
    if v_close < current_date then
      raise exception '지난 날짜로는 마감일을 잡을 수 없습니다';
    end if;
    if v_close > current_date + interval '365 days' then
      raise exception '마감일이 너무 멉니다 (1년 안으로)';
    end if;
  end if;
  update jobpost
     set title = v_title, body = v_body, pay = v_pay, terms = v_terms,
         close_at = v_close, contact = v_contact,
         role = v_role, emp_type = v_emp,
         pay_type = v_ptype, pay_min = v_pmin,
         updated_at = now()
   where id = v_id;
  return v_id;
end $$;
grant execute on function edit_jobpost(jsonb) to authenticated;
insert into schema_version (n, name) values (72, '0072_job_fields')
  on conflict (n) do nothing;
commit;
select max(n) from schema_version;
create table if not exists trip (
  id          uuid primary key default gen_random_uuid(),
  provider_id text not null references provider(id) on delete cascade,
  by_user     uuid not null references auth.users(id) on delete cascade,
  scope       text not null check (scope in ('home','abroad')),
  dest        text not null check (btrim(dest) <> '' and char_length(dest) <= 40),
  title       text not null check (char_length(btrim(title)) between 2 and 80),
  body        text not null check (char_length(btrim(body)) between 5 and 4000),
  nights      int not null check (nights >= 0 and nights <= 60),
  days        int not null check (days   >= 1 and days   <= 61),
  constraint trip_span_ck check (days > nights),
  price_from  bigint not null check (price_from > 0 and price_from <= 100000000),
  price_note  text check (price_note is null or char_length(price_note) <= 120),
  incl        text[] not null default '{}',
  excl        text[] not null default '{}',
  constraint trip_incl_ck check (array_length(incl,1) is null or array_length(incl,1) <= 12),
  constraint trip_excl_ck check (array_length(excl,1) is null or array_length(excl,1) <= 12),
  state       text not null default 'pending'
              check (state in ('pending','approved','rejected','closed','hidden')),
  hidden_from text,
  state_why   text,
  state_by    uuid references auth.users(id) on delete set null,
  state_at    timestamptz,
  draft       jsonb,
  draft_state text not null default 'none'
              check (draft_state in ('none','pending','rejected')),
  draft_why   text,
  draft_by    uuid references auth.users(id) on delete set null,
  draft_at    timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint trip_why_ck check (
    state not in ('rejected','hidden') or btrim(coalesce(state_why,'')) <> ''),
  constraint trip_draft_ck check (
    (draft_state = 'none') = (draft is null)),
  constraint trip_draft_why_ck check (
    draft_state <> 'rejected' or btrim(coalesce(draft_why,'')) <> '')
);
create index if not exists trip_open_ix  on trip (state, scope, dest);
create index if not exists trip_pv_ix    on trip (provider_id, state);
create index if not exists trip_draft_ix on trip (draft_state);
create table if not exists tripphoto (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references trip(id) on delete cascade,
  by_user    uuid not null references auth.users(id) on delete cascade,
  path       text not null unique,
  mime       text not null,
  bytes      int  not null,
  caption    text,
  ord        int  not null default 0,
  live         boolean not null default true,
  drop_pending boolean not null default false,
  created_at timestamptz not null default now(),
  constraint tripphoto_mime_ok  check (mime in ('image/jpeg','image/png','image/webp')),
  constraint tripphoto_bytes_ok check (bytes > 0 and bytes <= 8388608),
  constraint tripphoto_cap_ok   check (caption is null or char_length(caption) <= 60),
  constraint tripphoto_ord_ok   check (ord >= 0 and ord <= 99),
  constraint tripphoto_drop_ok  check (not drop_pending or live),
  constraint tripphoto_path_ok check (
    path <> '' and length(path) <= 300
    and path = 'trip/' || trip_id::text || '/photo/' || split_part(path, '/', 4))
);
create index if not exists tripphoto_ord_ix on tripphoto (trip_id, ord, created_at);
alter table trip      enable row level security;
alter table tripphoto enable row level security;
drop view if exists v_trip_open;
create view v_trip_open as
  select t.id, t.scope, t.dest, t.title, t.body, t.nights, t.days,
         t.price_from, t.price_note, t.incl, t.excl,
         t.created_at, t.updated_at,
         pv.id   as provider_id,
         pv.name as provider_name,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and ph.live) as photo_n,
         (select ph.path from tripphoto ph
           where ph.trip_id = t.id and ph.live
           order by ph.ord, ph.created_at, ph.id limit 1) as thumb
    from trip t
    join provider pv on pv.id = t.provider_id
   where t.state = 'approved'
     and pv.state = 'approved'
     and pv.is_test = false;
grant select on v_trip_open to anon, authenticated;
drop view if exists v_trip_photo_public;
create view v_trip_photo_public as
  select ph.id, ph.trip_id, ph.path, ph.caption, ph.ord
    from tripphoto ph
    join trip t      on t.id = ph.trip_id
    join provider pv on pv.id = t.provider_id
   where ph.live
     and t.state = 'approved' and pv.state = 'approved' and pv.is_test = false
   order by ph.trip_id, ph.ord, ph.created_at, ph.id;
grant select on v_trip_photo_public to anon, authenticated;
drop view if exists v_trip_mine;
create view v_trip_mine as
  select t.*,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and ph.live) as photo_n,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and not ph.live) as photo_draft_n,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and ph.drop_pending) as photo_drop_n
    from trip t
   where t.provider_id = my_provider();
grant select on v_trip_mine to authenticated;
drop view if exists v_trip_photo_mine;
create view v_trip_photo_mine as
  select ph.id, ph.trip_id, ph.path, ph.caption, ph.ord,
         ph.live, ph.drop_pending, ph.created_at
    from tripphoto ph
    join trip t on t.id = ph.trip_id
   where t.provider_id = my_provider()
   order by ph.trip_id, ph.ord, ph.created_at, ph.id;
grant select on v_trip_photo_mine to authenticated;
drop view if exists v_trip_review;
create view v_trip_review as
  select t.*, pv.name as provider_name,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and ph.live) as photo_n,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and not ph.live) as photo_draft_n,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and ph.drop_pending) as photo_drop_n
    from trip t
    join provider pv on pv.id = t.provider_id
   where coalesce(my_role()::text, '') in ('admin','staff');
grant select on v_trip_review to authenticated;
create or replace function trip_fields(p jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_scope text := nullif(btrim(coalesce(p->>'scope','')), '');
  v_dest  text := nullif(btrim(coalesce(p->>'dest','')), '');
  v_title text := nullif(btrim(coalesce(p->>'title','')), '');
  v_body  text := nullif(btrim(coalesce(p->>'body','')), '');
  v_note  text := nullif(btrim(coalesce(p->>'price_note','')), '');
  v_n int; v_d int; v_price bigint;
  v_incl text[] := coalesce((select array_agg(btrim(x)) from
    jsonb_array_elements_text(case when jsonb_typeof(p->'incl') = 'array'
      then p->'incl' else '[]'::jsonb end) x where btrim(x) <> ''), '{}');
  v_excl text[] := coalesce((select array_agg(btrim(x)) from
    jsonb_array_elements_text(case when jsonb_typeof(p->'excl') = 'array'
      then p->'excl' else '[]'::jsonb end) x where btrim(x) <> ''), '{}');
begin
  if v_scope is null or v_scope not in ('home','abroad') then
    raise exception '국내 · 해외 가운데 하나를 골라 주세요';
  end if;
  if v_dest is null or char_length(v_dest) > 40 then
    raise exception '목적지를 골라 주세요';
  end if;
  if v_title is null or char_length(v_title) < 2 then
    raise exception '상품 이름을 두 글자 이상 적어 주세요';
  end if;
  if char_length(v_title) > 80 then
    raise exception '상품 이름이 너무 깁니다 (80자)';
  end if;
  if v_body is null or char_length(v_body) < 5 then
    raise exception '상품 설명을 다섯 글자 이상 적어 주세요';
  end if;
  if char_length(v_body) > 4000 then
    raise exception '상품 설명이 너무 깁니다 (4000자)';
  end if;
  begin
    v_n := coalesce((nullif(btrim(coalesce(p->>'nights','')), ''))::int, -1);
    v_d := coalesce((nullif(btrim(coalesce(p->>'days','')),   ''))::int, -1);
  exception when others then
    raise exception '일정은 숫자로 적어 주세요';
  end;
  if v_n < 0 or v_n > 60 or v_d < 1 or v_d > 61 then
    raise exception '일정이 올바르지 않습니다';
  end if;
  if v_d <= v_n then
    raise exception '일수는 박수보다 하루 많아야 합니다';
  end if;
  begin
    v_price := (nullif(btrim(coalesce(p->>'price_from','')), ''))::bigint;
  exception when others then
    raise exception '가격은 숫자로 적어 주세요';
  end;
  -- ⚠️⚠️ 비우면 화면이 "가격 문의" 를 **지어 적게** 됩니다 (절대 규칙 1)
  if v_price is null then
    raise exception '1인 기준 최저 가격을 적어 주세요';
  end if;
  if v_price <= 0 then
    raise exception '가격은 0원보다 커야 합니다';
  end if;
  if v_price > 100000000 then
    raise exception '가격이 너무 큽니다 (자릿수를 확인해 주세요)';
  end if;
  if v_note is not null and char_length(v_note) > 120 then
    raise exception '가격 안내가 너무 깁니다 (120자)';
  end if;
  if coalesce(array_length(v_incl,1),0) > 12
     or coalesce(array_length(v_excl,1),0) > 12 then
    raise exception '포함 · 불포함 항목은 각각 열둘까지입니다';
  end if;
  return jsonb_build_object(
    'scope', v_scope, 'dest', v_dest, 'title', v_title, 'body', v_body,
    'nights', v_n, 'days', v_d, 'price_from', v_price,
    'price_note', v_note, 'incl', to_jsonb(v_incl), 'excl', to_jsonb(v_excl));
end $$;
revoke all on function trip_fields(jsonb) from public;
create or replace function trip_apply(p_id uuid, d jsonb)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update trip set
    scope = d->>'scope', dest = d->>'dest', title = d->>'title',
    body = d->>'body',
    nights = (d->>'nights')::int, days = (d->>'days')::int,
    price_from = (d->>'price_from')::bigint,
    price_note = nullif(btrim(coalesce(d->>'price_note','')), ''),
    incl = coalesce((select array_agg(x) from
      jsonb_array_elements_text(coalesce(d->'incl','[]'::jsonb)) x), '{}'),
    excl = coalesce((select array_agg(x) from
      jsonb_array_elements_text(coalesce(d->'excl','[]'::jsonb)) x), '{}'),
    updated_at = now()
  where id = p_id;
  -- 사진도 같이 갈아 끼웁니다 — 올린 것은 보이게, 뺀 것은 지웁니다
  delete from tripphoto where trip_id = p_id and drop_pending;
  update tripphoto set live = true where trip_id = p_id and not live;
  -- ⚠️⚠️ **차례도 수정본 안에 담깁니다.** 승인 뒤에 차례를 바꾸면
  --   대표 사진이 그 자리에서 바뀌는데, 그러면 "공개본은 그대로" 가
  --   거짓이 됩니다. 그래서 차례는 여기서 한꺼번에 씁니다.
  if d ? 'photo_order' then
    update tripphoto ph set ord = x.i - 1
      from (select u::uuid as id, ordinality as i
              from jsonb_array_elements_text(d->'photo_order')
                   with ordinality as t(u, ordinality)) x
     where ph.id = x.id and ph.trip_id = p_id;
  end if;
end $$;
revoke all on function trip_apply(uuid, jsonb) from public;
create or replace function open_trip(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_pv text := my_provider();
  v_f  jsonb;
  v_id uuid;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_pv is null then
    raise exception '여행 상품은 입점하신 업체만 올릴 수 있습니다';
  end if;
  if not coalesce((select pv.state = 'approved' and pv.is_test = false
                     from provider pv where pv.id = v_pv), false) then
    raise exception '승인된 업체만 상품을 올릴 수 있습니다';
  end if;
  v_f := trip_fields(p);
  -- ⚠️ 쏟아붓기 막기 — 심사 대기가 쌓이면 운영자가 못 봅니다
  if (select count(*) from trip
       where provider_id = v_pv and state in ('pending','approved')) >= 50 then
    raise exception '올려 두신 상품이 쉰입니다. 먼저 정리해 주세요';
  end if;
  if (select count(*) from trip
       where provider_id = v_pv and created_at > now() - interval '1 day') >= 20 then
    raise exception '오늘은 더 올릴 수 없습니다 (하루 스무 개)';
  end if;
  insert into trip (provider_id, by_user, scope, dest, title, body,
                    nights, days, price_from, price_note, incl, excl)
  values (v_pv, v_me, v_f->>'scope', v_f->>'dest', v_f->>'title', v_f->>'body',
          (v_f->>'nights')::int, (v_f->>'days')::int,
          (v_f->>'price_from')::bigint,
          nullif(btrim(coalesce(v_f->>'price_note','')), ''),
          coalesce((select array_agg(x) from jsonb_array_elements_text(v_f->'incl') x), '{}'),
          coalesce((select array_agg(x) from jsonb_array_elements_text(v_f->'excl') x), '{}'))
  returning id into v_id;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'trip', v_id::text, 'pending',
          jsonb_build_object('provider', v_pv, 'scope', v_f->>'scope'));
  return v_id;
end $$;
revoke all on function open_trip(jsonb) from public;
grant execute on function open_trip(jsonb) to authenticated;
create or replace function edit_trip(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_pv text := my_provider();
  v_id uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_owner text; v_st text;
  v_f jsonb;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 상품인지 알 수 없습니다'; end if;
  select provider_id, state into v_owner, v_st from trip where id = v_id for update;
  if v_owner is null then raise exception '그런 상품이 없습니다'; end if;
  if v_pv is null or v_owner <> v_pv then
    raise exception '올리신 업체만 고치실 수 있습니다';
  end if;
  if v_st = 'hidden' then
    raise exception '운영자가 가린 상품은 고치실 수 없습니다';
  end if;
  if v_st = 'closed' then
    raise exception '판매를 중지하신 상품입니다. 먼저 다시 올려 주세요';
  end if;
  v_f := trip_fields(p);
  if v_st = 'approved' then
    -- 공개본은 그대로 — 수정본만 담습니다
    update trip set draft = v_f, draft_state = 'pending',
                    draft_why = null, draft_by = v_me, draft_at = now(),
                    updated_at = now()
     where id = v_id;
    insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
    values (v_me, my_role(), 'trip', v_id::text, 'draft_pending', '{}'::jsonb);
    return 'draft';
  end if;
  -- 아직 공개된 적이 없습니다 — 그 자리에서 고치고 다시 심사로
  perform trip_apply(v_id, v_f);
  update trip set state = 'pending', state_why = null,
                  state_by = null, state_at = null, updated_at = now()
   where id = v_id;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'trip', v_id::text, 'pending',
          jsonb_build_object('edited', true, 'was', v_st));
  return 'pending';
end $$;
revoke all on function edit_trip(jsonb) from public;
grant execute on function edit_trip(jsonb) to authenticated;
create or replace function close_trip(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_pv text := my_provider();
  v_id uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_owner text; v_st text;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 상품인지 알 수 없습니다'; end if;
  select provider_id, state into v_owner, v_st from trip where id = v_id for update;
  if v_owner is null then raise exception '그런 상품이 없습니다'; end if;
  if v_pv is null or v_owner <> v_pv then
    raise exception '올리신 업체만 중지하실 수 있습니다';
  end if;
  if v_st = 'hidden' then
    raise exception '운영자가 가린 상품입니다';
  end if;
  -- ⚠️ 같은 상태로 옮기는 것은 거절합니다 — 조용히 성공하면 화면이
  --   "중지했습니다" 를 적는데 아무 일도 안 일어났습니다 (0069 의 자리).
  if v_st = 'closed' then
    raise exception '이미 판매를 중지하신 상품입니다';
  end if;
  update trip set state = 'closed', updated_at = now() where id = v_id;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'trip', v_id::text, 'closed',
          jsonb_build_object('was', v_st));
  return v_id;
end $$;
revoke all on function close_trip(jsonb) from public;
grant execute on function close_trip(jsonb) to authenticated;
create or replace function reopen_trip(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_pv text := my_provider();
  v_id uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_owner text; v_st text;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 상품인지 알 수 없습니다'; end if;
  select provider_id, state into v_owner, v_st from trip where id = v_id for update;
  if v_owner is null then raise exception '그런 상품이 없습니다'; end if;
  if v_pv is null or v_owner <> v_pv then
    raise exception '올리신 업체만 다시 올리실 수 있습니다';
  end if;
  if v_st <> 'closed' then
    raise exception '판매를 중지하신 상품만 다시 올리실 수 있습니다';
  end if;
  update trip set state = 'pending', updated_at = now() where id = v_id;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'trip', v_id::text, 'pending',
          jsonb_build_object('reopened', true));
  return v_id;
end $$;
revoke all on function reopen_trip(jsonb) from public;
grant execute on function reopen_trip(jsonb) to authenticated;
create or replace function trip_touch_draft(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare r trip%rowtype;
begin
  select * into r from trip where id = p_id;
  if r.id is null or r.state <> 'approved' then return; end if;
  if r.draft_state <> 'none' then return; end if;
  update trip set
    draft = jsonb_build_object(
      'scope', r.scope, 'dest', r.dest, 'title', r.title, 'body', r.body,
      'nights', r.nights, 'days', r.days, 'price_from', r.price_from,
      'price_note', r.price_note,
      'incl', to_jsonb(r.incl), 'excl', to_jsonb(r.excl)),
    draft_state = 'pending', draft_why = null,
    draft_by = auth.uid(), draft_at = now(), updated_at = now()
  where id = p_id;
end $$;
revoke all on function trip_touch_draft(uuid) from public;
create or replace function move_trip(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_id uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_to text := nullif(btrim(coalesce(p->>'to','')), '');
  v_why text := nullif(btrim(coalesce(p->>'why','')), '');
  v_st text; v_from text;
begin
  if coalesce(my_role()::text, '') not in ('admin','staff') then
    raise exception '운영자만 할 수 있습니다';
  end if;
  if v_id is null then raise exception '어느 상품인지 알 수 없습니다'; end if;
  select state, hidden_from into v_st, v_from from trip where id = v_id for update;
  if v_st is null then raise exception '그런 상품이 없습니다'; end if;
  if v_to is null or v_to not in ('approved','rejected','hidden','restore') then
    raise exception '승인 · 반려 · 가리기 · 되돌리기 가운데 하나를 골라 주세요';
  end if;
  if v_to <> 'restore' and v_to = v_st then
    raise exception '이미 그 상태입니다';
  end if;
  if v_to in ('rejected','hidden') and v_why is null then
    raise exception '까닭을 적어 주세요';
  end if;
  if v_why is not null and char_length(v_why) > 200 then
    raise exception '까닭이 너무 깁니다 (200자)';
  end if;
  if v_to = 'restore' then
    if v_st <> 'hidden' then
      raise exception '가려진 상품만 되돌릴 수 있습니다';
    end if;
    if v_from is null then
      raise exception '가리기 전 상태를 알 수 없습니다';
    end if;
    update trip set state = v_from, hidden_from = null,
                    state_why = null, state_by = v_me, state_at = now(),
                    updated_at = now()
     where id = v_id;
    insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
    values (v_me, my_role(), 'trip', v_id::text, v_from,
            jsonb_build_object('restored', true));
    return v_id;
  end if;
  update trip
     set state = v_to,
         hidden_from = case when v_to = 'hidden' then v_st else null end,
         state_why = v_why, state_by = v_me, state_at = now(),
         updated_at = now()
   where id = v_id;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'trip', v_id::text, v_to,
          jsonb_build_object('was', v_st, 'has_why', v_why is not null));
  return v_id;
end $$;
revoke all on function move_trip(jsonb) from public;
grant execute on function move_trip(jsonb) to authenticated;
create or replace function review_trip_draft(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_id uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_to text := nullif(btrim(coalesce(p->>'to','')), '');
  v_why text := nullif(btrim(coalesce(p->>'why','')), '');
  v_ds text; v_d jsonb;
begin
  if coalesce(my_role()::text, '') not in ('admin','staff') then
    raise exception '운영자만 할 수 있습니다';
  end if;
  if v_id is null then raise exception '어느 상품인지 알 수 없습니다'; end if;
  select draft_state, draft into v_ds, v_d from trip where id = v_id for update;
  if v_ds is null then raise exception '그런 상품이 없습니다'; end if;
  if v_ds = 'none' or v_d is null then
    raise exception '심사할 수정본이 없습니다';
  end if;
  if v_to is null or v_to not in ('approved','rejected') then
    raise exception '승인 · 반려 가운데 하나를 골라 주세요';
  end if;
  if v_to = 'rejected' and v_why is null then
    raise exception '까닭을 적어 주세요';
  end if;
  if v_why is not null and char_length(v_why) > 200 then
    raise exception '까닭이 너무 깁니다 (200자)';
  end if;
  if v_to = 'approved' then
    perform trip_apply(v_id, v_d);
    update trip set draft = null, draft_state = 'none', draft_why = null,
                    draft_by = v_me, draft_at = now(), updated_at = now()
     where id = v_id;
  else
    -- ⚠️ 수정본을 **지우지 않습니다** — 여행사가 그것을 고쳐 다시 냅니다
    update trip set draft_state = 'rejected', draft_why = v_why,
                    draft_by = v_me, draft_at = now(), updated_at = now()
     where id = v_id;
  end if;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'trip', v_id::text, 'draft_' || v_to,
          jsonb_build_object('has_why', v_why is not null));
  return v_id;
end $$;
revoke all on function review_trip_draft(jsonb) from public;
grant execute on function review_trip_draft(jsonb) to authenticated;
create or replace function claim_trip_photo(p jsonb default '{}'::jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_pv text := my_provider();
  v_t  uuid := nullif(btrim(coalesce(p->>'trip','')), '')::uuid;
  v_mime text := lower(btrim(coalesce(p->>'mime','')));
  v_bytes int := coalesce((nullif(btrim(coalesce(p->>'bytes','')), ''))::int, 0);
  v_cap text := nullif(btrim(coalesce(p->>'caption','')), '');
  v_st text; v_ext text; v_path text; v_id uuid; v_ord int; v_after int;
begin
  if v_me is null then raise exception '로그인하셔야 사진을 올릴 수 있습니다'; end if;
  if v_t is null then raise exception '어느 상품인지 알 수 없습니다'; end if;
  select state into v_st from trip
   where id = v_t and v_pv is not null and provider_id = v_pv;
  if v_st is null or v_st in ('closed','hidden') then
    raise exception '그 상품에는 사진을 붙일 수 없습니다';
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
  select count(*) into v_after from tripphoto
   where trip_id = v_t and not drop_pending;
  if v_after >= 10 then
    raise exception '사진은 열 장까지입니다. 먼저 빼 주세요';
  end if;
  select coalesce(max(ord), -1) + 1 into v_ord from tripphoto where trip_id = v_t;
  if v_ord > 99 then v_ord := 99; end if;
  v_ext := case v_mime when 'image/jpeg' then 'jpg'
                       when 'image/png'  then 'png' else 'webp' end;
  v_path := 'trip/' || v_t::text || '/photo/' || gen_random_uuid()::text || '.' || v_ext;
  insert into tripphoto (trip_id, by_user, path, mime, bytes, caption, ord, live)
  values (v_t, v_me, v_path, v_mime, v_bytes, v_cap, v_ord, v_st <> 'approved')
  returning id into v_id;
  -- 승인된 상품이면 **심사를 받아야** 보입니다 (안 열어 두면 영영 안 보입니다)
  perform trip_touch_draft(v_t);
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'tripphoto', v_id::text, 'claimed',
          jsonb_build_object('mime', v_mime, 'bytes', v_bytes,
                             'live', v_st <> 'approved'));
  return jsonb_build_object('id', v_id, 'path', v_path, 'ord', v_ord,
                            'live', v_st <> 'approved');
end $$;
revoke all on function claim_trip_photo(jsonb) from public;
grant execute on function claim_trip_photo(jsonb) to authenticated;
create or replace function drop_trip_photo(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_pv text := my_provider();
  v_id uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_t uuid; v_live boolean; v_drop boolean; v_st text; v_n int;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 사진인지 알 수 없습니다'; end if;
  select ph.trip_id, ph.live, ph.drop_pending, t.state
    into v_t, v_live, v_drop, v_st
    from tripphoto ph join trip t on t.id = ph.trip_id
   where ph.id = v_id and v_pv is not null and t.provider_id = v_pv;
  if v_t is null then raise exception '그 사진은 뺄 수 없습니다'; end if;
  if v_drop then raise exception '이미 뺄 사진으로 표시하셨습니다'; end if;
  if v_st = 'approved' and v_live then
    update tripphoto set drop_pending = true where id = v_id;
    perform trip_touch_draft(v_t);
    insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
    values (v_me, my_role(), 'tripphoto', v_id::text, 'drop_pending', '{}'::jsonb);
    return 'pending';
  end if;
  delete from tripphoto where id = v_id;
  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception '그 사진은 뺄 수 없습니다'; end if;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'tripphoto', v_id::text, 'dropped', '{}'::jsonb);
  return 'dropped';
end $$;
revoke all on function drop_trip_photo(jsonb) from public;
grant execute on function drop_trip_photo(jsonb) to authenticated;
create or replace function order_trip_photo(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_pv text := my_provider();
  v_t  uuid := nullif(btrim(coalesce(p->>'trip','')), '')::uuid;
  v_ids uuid[]; v_have int; v_i int; v_st text; v_d jsonb;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_t is null then raise exception '어느 상품인지 알 수 없습니다'; end if;
  select state into v_st from trip
   where id = v_t and v_pv is not null and provider_id = v_pv;
  if v_st is null then raise exception '그 상품은 고치실 수 없습니다'; end if;
  select coalesce(array_agg(x::uuid), '{}') into v_ids
    from jsonb_array_elements_text(coalesce(p->'ids','[]'::jsonb)) x;
  select count(*) into v_have from tripphoto where trip_id = v_t;
  if coalesce(array_length(v_ids,1),0) <> v_have then
    raise exception '사진 차례는 빠짐없이 보내 주셔야 합니다';
  end if;
  if (select count(distinct u) from unnest(v_ids) u) <> v_have then
    raise exception '같은 사진이 두 번 들어 있습니다';
  end if;
  if exists (select 1 from unnest(v_ids) u
              where u not in (select id from tripphoto where trip_id = v_t)) then
    raise exception '그 상품의 사진이 아닌 것이 섞여 있습니다';
  end if;
  if v_st = 'approved' then
    perform trip_touch_draft(v_t);
    select draft into v_d from trip where id = v_t;
    update trip set draft = coalesce(v_d,'{}'::jsonb)
                      || jsonb_build_object('photo_order', to_jsonb(v_ids)),
                    updated_at = now()
     where id = v_t;
    return 'pending';
  end if;
  v_i := 0;
  while v_i < v_have loop
    update tripphoto set ord = v_i where id = v_ids[v_i + 1];
    v_i := v_i + 1;
  end loop;
  return 'done';
end $$;
revoke all on function order_trip_photo(jsonb) from public;
grant execute on function order_trip_photo(jsonb) to authenticated;
insert into schema_version (n, name) values (73, '0073_trip')
  on conflict (n) do nothing;
commit;
alter table provider add column if not exists range_opts text[] not null default '{}';
alter table provider add column if not exists open_hours text;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'provider_range_opts_ck') then
    alter table provider add constraint provider_range_opts_ck
      check (array_length(range_opts, 1) is null or array_length(range_opts, 1) <= 12);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'provider_open_hours_ck') then
    alter table provider add constraint provider_open_hours_ck
      check (open_hours is null or char_length(btrim(open_hours)) between 1 and 60);
  end if;
end $$;
drop view if exists v_provider_card;
create view v_provider_card as
  select p.id, p.name, p.intro, p.regions, p.gu, p.subs, p.since,
         p.consult_hours, p.verified, p.brands, p.scale, p.contact_ways,
         p.ceo, p.addr, p.tel, p.email, p.brn,
         p.kind, p.place_name, p.lesson_goals,
         p.range_opts, p.open_hours,
         p.is_test
    from provider p
   where p.listed = true
     and p.is_test = false
     and p.state = 'approved';
grant select on v_provider_card to anon, authenticated;
create or replace function save_provider_self(
  p_data jsonb default '{}'::jsonb,
  p_why  text  default null
) returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_pv   text     := my_provider();
  v_scale text    := nullif(btrim(coalesce(p_data->>'scale','')), '');
  v_email text    := nullif(btrim(coalesce(p_data->>'email','')), '');
  v_place text    := nullif(btrim(coalesce(p_data->>'placeName','')), '');
  -- ⚠️ 0074 — 연습장 시설 정보 둘
  v_hours text    := nullif(btrim(coalesce(p_data->>'openHours','')), '');
  v_opts  text[]  := coalesce((select array_agg(btrim(x))
    from jsonb_array_elements_text(
      case when jsonb_typeof(p_data->'rangeOpts') = 'array'
           then p_data->'rangeOpts' else '[]'::jsonb end) x
    where btrim(x) <> ''), '{}');
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if v_role <> 'provider' or v_pv is null then
    raise exception '업체 계정으로 로그인하셔야 합니다';
  end if;
  if not exists (select 1 from provider where id = v_pv) then
    raise exception '연결된 업체를 찾을 수 없습니다';
  end if;
  if v_scale is not null and v_scale not in ('small','mid','large') then
    raise exception '거래 규모는 small · mid · large 중 하나입니다 — %', v_scale;
  end if;
  -- ⚠️ 0074 — 이용 시간과 시설 속성. **키 묶음은 화면이 들고 있고**
  --   여기서는 갯수와 길이만 봅니다 (박아 두면 느는 날 어긋납니다).
  if v_hours is not null and char_length(v_hours) > 60 then
    raise exception '이용 시간이 너무 깁니다 (60자)';
  end if;
  if coalesce(array_length(v_opts, 1), 0) > 12 then
    raise exception '시설 항목은 열둘까지입니다';
  end if;
  if exists (select 1 from unnest(v_opts) u where char_length(u) > 40) then
    raise exception '시설 항목 값이 올바르지 않습니다';
  end if;
  if exists (
    select 1 from jsonb_array_elements_text(
      case when jsonb_typeof(p_data->'contactWays') = 'array'
           then p_data->'contactWays' else '[]'::jsonb end) as t(x)
     where btrim(x) not in ('phone','visit','online','shop'))
  then
    raise exception '상담 방식은 전화 · 방문 · 온라인 · 매장 중에서 고르셔야 합니다';
  end if;
  -- ⚠️ 적으셨으면 꼴을 봅니다 (비우는 것은 됩니다 — 지어내지 않습니다).
  --   ⚠️⚠️ **다른 말로 거절합니다** — check 와 같은 말로 거절하면 어느
  --   자물쇠가 막았는지 알 수 없습니다 (검사가 둘을 갈라 셉니다).
  if v_email is not null and v_email not like '%@%.%' then
    raise exception '이메일 꼴이 아닙니다 — %', v_email;
  end if;
  -- ⚠️ 0071 — 레슨 장소. 표의 check 와 **다른 말**로 거절합니다.
  if v_place is not null and length(v_place) > 80 then
    raise exception '레슨 장소 이름이 너무 깁니다 (여든 자까지)';
  end if;
  -- ⚠️⚠️ 레슨 목적은 **키를 안 봅니다**(DB 가 키 묶음을 모릅니다) — 갯수와
  --   길이만 막습니다. 모르는 키가 들어오면 화면이 **그 글자를 그대로**
  --   보여 줍니다(이름을 지어내지 않습니다).
  if (select count(*) from jsonb_array_elements_text(
        case when jsonb_typeof(p_data->'lessonGoals') = 'array'
             then p_data->'lessonGoals' else '[]'::jsonb end)) > 12 then
    raise exception '레슨 목적은 열두 개까지 고르실 수 있습니다';
  end if;
  update provider set
    intro = nullif(btrim(coalesce(p_data->>'intro','')), ''),
    regions = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'regions','[]'::jsonb)) x), '{}'),
    gu = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'gu','[]'::jsonb)) x), '{}'),
    industries = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'industries','[]'::jsonb)) x), '{}'),
    since = nullif(p_data->>'since','')::int,
    consult_hours = nullif(btrim(coalesce(p_data->>'consultHours','')), ''),
    brands = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'brands','[]'::jsonb)) x), '{}'),
    scale = v_scale,
    ceo = nullif(btrim(coalesce(p_data->>'ceo','')), ''),
    addr = nullif(btrim(coalesce(p_data->>'addr','')), ''),
    tel = nullif(btrim(coalesce(p_data->>'tel','')), ''),
    email = v_email,
    contact_ways = coalesce((select array_agg(btrim(x))
      from jsonb_array_elements_text(
        case when jsonb_typeof(p_data->'contactWays') = 'array'
             then p_data->'contactWays' else '[]'::jsonb end) x), '{}'),
    range_opts = v_opts,
    open_hours = v_hours,
    place_name = v_place,
    lesson_goals = coalesce((select array_agg(btrim(x))
      from jsonb_array_elements_text(
        case when jsonb_typeof(p_data->'lessonGoals') = 'array'
             then p_data->'lessonGoals' else '[]'::jsonb end) x
      where btrim(x) <> ''), '{}')
  where id = v_pv;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'provider', v_pv, 'self-updated', p_why, p_data);
  return v_pv;
end $$;
revoke all on function save_provider_self(jsonb, text) from public;
grant execute on function save_provider_self(jsonb, text) to authenticated;
insert into schema_version (n, name) values (74, '0074_range_facility')
  on conflict (n) do nothing;
commit;
drop view if exists v_cq_public;
create view v_cq_public as
  select q.id, q.cat, q.title, q.body, q.created_at, q.updated_at,
         case
           when q.by_user is null then btrim(coalesce(q.guest_nick, '손님'))
           when btrim(coalesce(a.nick, '')) <> '' then btrim(a.nick)
           when btrim(coalesce(a.name, '')) = '' then '회원'
           else left(btrim(a.name), 1) ||
                repeat('*', greatest(char_length(btrim(a.name)) - 1, 1))
         end as who,
         (q.by_user is null or btrim(coalesce(a.nick, '')) <> '') as named,
         (q.by_user is null) as guest,
         coalesce(q.by_user = auth.uid(), false) as mine,
         (select count(*) from ca where ca.q_id = q.id and ca.state = 'live') as answer_n,
         (select count(*) from cqview v where v.q_id = q.id) as view_n,
         (select count(*) from cqphoto f where f.q_id = q.id) as photo_n,
         (select f.path from cqphoto f where f.q_id = q.id
           order by f.created_at, f.id limit 1) as thumb
    from cq q
    left join account a on a.id = q.by_user
   where q.state = 'live';
grant select on v_cq_public to anon, authenticated;
insert into schema_version (n, name) values (75, '0075_cq_thumb')
  on conflict (n) do nothing;
commit;
alter table provider add column if not exists fit_ways text[] not null default '{}';
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'provider_fit_ways_ck') then
    alter table provider add constraint provider_fit_ways_ck
      check (array_length(fit_ways, 1) is null or array_length(fit_ways, 1) <= 6);
  end if;
end $$;
drop view if exists v_provider_card;
create view v_provider_card as
  select p.id, p.name, p.intro, p.regions, p.gu, p.subs, p.since,
         p.consult_hours, p.verified, p.brands, p.scale, p.contact_ways,
         p.ceo, p.addr, p.tel, p.email, p.brn,
         p.kind, p.place_name, p.lesson_goals,
         p.range_opts, p.open_hours,
         p.fit_ways,
         p.is_test
    from provider p
   where p.listed = true
     and p.is_test = false
     and p.state = 'approved';
grant select on v_provider_card to anon, authenticated;
create or replace function save_provider_self(
  p_data jsonb default '{}'::jsonb,
  p_why  text  default null
) returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_pv   text     := my_provider();
  v_scale text    := nullif(btrim(coalesce(p_data->>'scale','')), '');
  v_email text    := nullif(btrim(coalesce(p_data->>'email','')), '');
  v_place text    := nullif(btrim(coalesce(p_data->>'placeName','')), '');
  -- ⚠️ 0074 — 연습장 시설 정보 둘
  v_hours text    := nullif(btrim(coalesce(p_data->>'openHours','')), '');
  v_opts  text[]  := coalesce((select array_agg(btrim(x))
    from jsonb_array_elements_text(
      case when jsonb_typeof(p_data->'rangeOpts') = 'array'
           then p_data->'rangeOpts' else '[]'::jsonb end) x
    where btrim(x) <> ''), '{}');
  -- ⚠️ 0076 — 피팅 이용 방식
  v_fw    text[]  := coalesce((select array_agg(btrim(x))
    from jsonb_array_elements_text(
      case when jsonb_typeof(p_data->'fitWays') = 'array'
           then p_data->'fitWays' else '[]'::jsonb end) x
    where btrim(x) <> ''), '{}');
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if v_role <> 'provider' or v_pv is null then
    raise exception '업체 계정으로 로그인하셔야 합니다';
  end if;
  if not exists (select 1 from provider where id = v_pv) then
    raise exception '연결된 업체를 찾을 수 없습니다';
  end if;
  if v_scale is not null and v_scale not in ('small','mid','large') then
    raise exception '거래 규모는 small · mid · large 중 하나입니다 — %', v_scale;
  end if;
  -- ⚠️ 0074 — 이용 시간과 시설 속성. **키 묶음은 화면이 들고 있고**
  --   여기서는 갯수와 길이만 봅니다 (박아 두면 느는 날 어긋납니다).
  if v_hours is not null and char_length(v_hours) > 60 then
    raise exception '이용 시간이 너무 깁니다 (60자)';
  end if;
  if coalesce(array_length(v_opts, 1), 0) > 12 then
    raise exception '시설 항목은 열둘까지입니다';
  end if;
  if exists (select 1 from unnest(v_opts) u where char_length(u) > 40) then
    raise exception '시설 항목 값이 올바르지 않습니다';
  end if;
  -- ⚠️ 0076 — 이용 방식. 표의 check 와 **다른 말**로 거절합니다
  --   (같은 말로 거절하면 어느 자물쇠가 막았는지 알 수 없습니다).
  if coalesce(array_length(v_fw, 1), 0) > 6 then
    raise exception '이용 방식은 여섯 가지까지입니다';
  end if;
  if exists (select 1 from unnest(v_fw) u where char_length(u) > 40) then
    raise exception '이용 방식 값이 올바르지 않습니다';
  end if;
  if exists (
    select 1 from jsonb_array_elements_text(
      case when jsonb_typeof(p_data->'contactWays') = 'array'
           then p_data->'contactWays' else '[]'::jsonb end) as t(x)
     where btrim(x) not in ('phone','visit','online','shop'))
  then
    raise exception '상담 방식은 전화 · 방문 · 온라인 · 매장 중에서 고르셔야 합니다';
  end if;
  -- ⚠️ 적으셨으면 꼴을 봅니다 (비우는 것은 됩니다 — 지어내지 않습니다).
  if v_email is not null and v_email not like '%@%.%' then
    raise exception '이메일 꼴이 아닙니다 — %', v_email;
  end if;
  -- ⚠️ 0071 — 레슨 장소. 표의 check 와 **다른 말**로 거절합니다.
  if v_place is not null and length(v_place) > 80 then
    raise exception '레슨 장소 이름이 너무 깁니다 (여든 자까지)';
  end if;
  -- ⚠️⚠️ 레슨 목적은 **키를 안 봅니다**(DB 가 키 묶음을 모릅니다) — 갯수와
  --   길이만 막습니다. 모르는 키가 들어오면 화면이 **그 글자를 그대로**
  --   보여 줍니다(이름을 지어내지 않습니다).
  if (select count(*) from jsonb_array_elements_text(
        case when jsonb_typeof(p_data->'lessonGoals') = 'array'
             then p_data->'lessonGoals' else '[]'::jsonb end)) > 12 then
    raise exception '레슨 목적은 열두 개까지 고르실 수 있습니다';
  end if;
  update provider set
    intro = nullif(btrim(coalesce(p_data->>'intro','')), ''),
    regions = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'regions','[]'::jsonb)) x), '{}'),
    gu = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'gu','[]'::jsonb)) x), '{}'),
    industries = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'industries','[]'::jsonb)) x), '{}'),
    since = nullif(p_data->>'since','')::int,
    consult_hours = nullif(btrim(coalesce(p_data->>'consultHours','')), ''),
    brands = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'brands','[]'::jsonb)) x), '{}'),
    scale = v_scale,
    ceo = nullif(btrim(coalesce(p_data->>'ceo','')), ''),
    addr = nullif(btrim(coalesce(p_data->>'addr','')), ''),
    tel = nullif(btrim(coalesce(p_data->>'tel','')), ''),
    email = v_email,
    contact_ways = coalesce((select array_agg(btrim(x))
      from jsonb_array_elements_text(
        case when jsonb_typeof(p_data->'contactWays') = 'array'
             then p_data->'contactWays' else '[]'::jsonb end) x), '{}'),
    range_opts = v_opts,
    open_hours = v_hours,
    fit_ways = v_fw,
    place_name = v_place,
    lesson_goals = coalesce((select array_agg(btrim(x))
      from jsonb_array_elements_text(
        case when jsonb_typeof(p_data->'lessonGoals') = 'array'
             then p_data->'lessonGoals' else '[]'::jsonb end) x
      where btrim(x) <> ''), '{}')
  where id = v_pv;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'provider', v_pv, 'self-updated', p_why, p_data);
  return v_pv;
end $$;
revoke all on function save_provider_self(jsonb, text) from public;
grant execute on function save_provider_self(jsonb, text) to authenticated;
insert into schema_version (n, name) values (76, '0076_fitting')
  on conflict (n) do nothing;
commit;
select max(n) from schema_version;
begin;
alter table trip add column if not exists depart_kind text not null default 'none';
alter table trip add column if not exists depart_from date;
alter table trip add column if not exists depart_to   date;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'trip_depart_kind_ck') then
    alter table trip add constraint trip_depart_kind_ck
      check (depart_kind in ('dates','range','none'));
  end if;
  -- ⚠️ `range` 면 둘 다 있어야 하고, 아니면 둘 다 없어야 합니다 —
  --   한쪽만 있으면 화면이 「12월~」처럼 **반쪽 기간**을 적게 됩니다.
  if not exists (select 1 from pg_constraint where conname = 'trip_depart_span_ck') then
    alter table trip add constraint trip_depart_span_ck
      check ((depart_kind = 'range')
             = (depart_from is not null and depart_to is not null));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'trip_depart_order_ck') then
    alter table trip add constraint trip_depart_order_ck
      check (depart_from is null or depart_to is null or depart_to >= depart_from);
  end if;
end $$;
create table if not exists tripdate (
  trip_id   uuid not null references trip(id) on delete cascade,
  depart_on date not null,
  primary key (trip_id, depart_on)
);
alter table tripdate enable row level security;
create index if not exists tripdate_ix on tripdate (trip_id, depart_on);
create or replace function trip_months(
  p_kind text, p_from date, p_to date, p_days date[])
returns text[] language sql immutable as $$
  select case
    when p_kind = 'range' and p_to >= kst_today() then (
      select array_agg(distinct to_char(m, 'YYYY-MM') order by to_char(m, 'YYYY-MM'))
        from generate_series(
               date_trunc('month', greatest(p_from, kst_today()))::date,
               date_trunc('month', p_to)::date,
               interval '1 month') m)
    when p_kind = 'dates' then (
      select array_agg(distinct to_char(d, 'YYYY-MM') order by to_char(d, 'YYYY-MM'))
        from unnest(coalesce(p_days, '{}'::date[])) d
       where d >= kst_today())
    else null end
$$;
grant execute on function trip_months(text, date, date, date[])
  to anon, authenticated;
create or replace function trip_next_depart(
  p_kind text, p_from date, p_to date, p_days date[])
returns date language sql immutable as $$
  select case
    when p_kind = 'range' and p_to >= kst_today()
      then greatest(p_from, kst_today())
    when p_kind = 'dates' then (
      select min(d) from unnest(coalesce(p_days, '{}'::date[])) d
       where d >= kst_today())
  end
$$;
grant execute on function trip_next_depart(text, date, date, date[])
  to anon, authenticated;
create or replace function set_trip_depart(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_pv   text := my_provider();
  v_id   uuid := nullif(p->>'trip','')::uuid;
  v_kind text := coalesce(nullif(btrim(p->>'kind'),''), 'none');
  v_from date := nullif(p->>'from','')::date;
  v_to   date := nullif(p->>'to',''  )::date;
  v_arr  jsonb := coalesce(p->'dates', '[]'::jsonb);
  v_st   text;
  v_n    int;
begin
  if v_pv is null then raise exception '업체 담당자만 쓸 수 있습니다'; end if;
  if v_id is null then raise exception '어느 상품인지 알 수 없습니다'; end if;
  select state into v_st from trip
   where id = v_id and provider_id = v_pv for update;
  if v_st is null then raise exception '그 상품을 찾을 수 없습니다'; end if;
  if v_st = 'hidden' then
    raise exception '가려진 상품은 고칠 수 없습니다 — 고객센터로 문의해 주세요';
  end if;
  if v_kind not in ('dates','range','none') then
    raise exception '출발 방식은 확정 출발일 · 출발 가능 기간 · 미정 셋 가운데 하나입니다';
  end if;
  if v_kind = 'range' then
    if v_from is null or v_to is null then
      raise exception '출발 가능 기간은 시작일과 마지막 날을 함께 적어 주세요';
    end if;
    if v_to < v_from then
      raise exception '마지막 날이 시작일보다 앞설 수 없습니다';
    end if;
    if v_to < kst_today() then
      raise exception '이미 지난 기간입니다 — 오늘 이후로 적어 주세요';
    end if;
    if v_to > kst_today() + 730 then
      raise exception '출발 가능 기간은 2년 안으로 적어 주세요';
    end if;
  else
    v_from := null; v_to := null;
  end if;
  -- ⚠️ 확정 출발일은 **그 상품의 전부**로 갈아 끼웁니다
  delete from tripdate where trip_id = v_id;
  if v_kind = 'dates' then
    if jsonb_typeof(v_arr) <> 'array' then
      raise exception '출발일은 목록으로 보내 주세요';
    end if;
    insert into tripdate (trip_id, depart_on)
    select v_id, (x)::date
      from jsonb_array_elements_text(v_arr) t(x)
     where btrim(x) <> ''
    on conflict do nothing;
    select count(*) into v_n from tripdate where trip_id = v_id;
    if v_n = 0 then
      raise exception '출발일을 하나 이상 적어 주세요';
    end if;
    if v_n > 60 then
      raise exception '출발일은 60개까지 적을 수 있습니다';
    end if;
    -- ⚠️⚠️ **지난 날짜는 아예 안 받습니다** — 받아 두면 여행사 화면에는
    --   남고 손님 화면에서는 빠져 **둘이 다른 말**을 합니다.
    if exists (select 1 from tripdate
                where trip_id = v_id and depart_on < kst_today()) then
      raise exception '지난 날짜는 출발일로 넣을 수 없습니다';
    end if;
    if exists (select 1 from tripdate
                where trip_id = v_id and depart_on > kst_today() + 730) then
      raise exception '출발일은 2년 안으로 적어 주세요';
    end if;
  end if;
  update trip
     set depart_kind = v_kind, depart_from = v_from, depart_to = v_to,
         updated_at = now()
   where id = v_id;
  -- ⚠️ 기록에 **날짜를 안 담습니다** — 무엇을 바꿨는지는 상품을 보면
  --   됩니다. 기록은 오래 남고 보는 사람이 넓습니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why)
  values (auth.uid(), my_role(), 'trip', v_id::text,
          'depart-' || v_kind, null);
  return jsonb_build_object('ok', true, 'kind', v_kind,
                            'n', coalesce(v_n, 0));
end $$;
revoke all on function set_trip_depart(jsonb) from public;
grant execute on function set_trip_depart(jsonb) to authenticated;
drop view if exists v_trip_date_public;
create view v_trip_date_public as
  select d.trip_id, d.depart_on
    from tripdate d
    join trip t      on t.id = d.trip_id
    join provider pv on pv.id = t.provider_id
   where d.depart_on >= kst_today()
     and t.state = 'approved' and pv.state = 'approved' and pv.is_test = false
   order by d.trip_id, d.depart_on;
grant select on v_trip_date_public to anon, authenticated;
drop view if exists v_trip_date_mine;
create view v_trip_date_mine as
  select d.trip_id, d.depart_on
    from tripdate d
    join trip t on t.id = d.trip_id
   where t.provider_id = my_provider()
   order by d.trip_id, d.depart_on;
grant select on v_trip_date_mine to authenticated;
drop view if exists v_trip_open;
create view v_trip_open as
  select t.id, t.scope, t.dest, t.title, t.body, t.nights, t.days,
         t.price_from, t.price_note, t.incl, t.excl,
         t.created_at, t.updated_at,
         t.depart_kind, t.depart_from, t.depart_to,
         coalesce(trip_months(t.depart_kind, t.depart_from, t.depart_to, dd.days),
                  '{}'::text[]) as months,
         trip_next_depart(t.depart_kind, t.depart_from, t.depart_to, dd.days)
           as depart_next,
         pv.id   as provider_id,
         pv.name as provider_name,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and ph.live) as photo_n,
         (select ph.path from tripphoto ph
           where ph.trip_id = t.id and ph.live
           order by ph.ord, ph.created_at, ph.id limit 1) as thumb
    from trip t
    join provider pv on pv.id = t.provider_id
    left join lateral (
      select array_agg(d.depart_on order by d.depart_on) as days
        from tripdate d where d.trip_id = t.id) dd on true
   where t.state = 'approved'
     and pv.state = 'approved'
     and pv.is_test = false;
grant select on v_trip_open to anon, authenticated;
drop view if exists v_trip_mine;
create view v_trip_mine as
  select t.*,
         coalesce(trip_months(t.depart_kind, t.depart_from, t.depart_to, dd.days),
                  '{}'::text[]) as months,
         trip_next_depart(t.depart_kind, t.depart_from, t.depart_to, dd.days)
           as depart_next,
         (select count(*) from tripdate d where d.trip_id = t.id) as date_n,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and ph.live) as photo_n,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and not ph.live) as photo_draft_n,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and ph.drop_pending) as photo_drop_n
    from trip t
    left join lateral (
      select array_agg(d.depart_on order by d.depart_on) as days
        from tripdate d where d.trip_id = t.id) dd on true
   where t.provider_id = my_provider();
grant select on v_trip_mine to authenticated;
insert into schema_version (n, name) values (77, '0077_trip_depart')
on conflict (n) do nothing;
commit;
commit;
begin;
create table if not exists jobfav (
  by_user    uuid not null references auth.users(id) on delete cascade,
  post_id    uuid not null references jobpost(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (by_user, post_id)
);
create index if not exists jobfav_mine_idx on jobfav (by_user, created_at desc);
alter table jobfav enable row level security;
drop policy if exists jobfav_mine on jobfav;
create policy jobfav_mine on jobfav
  for select using (by_user = auth.uid());
grant select on jobfav to authenticated;
create or replace function fav_jobpost(p jsonb default '{}'::jsonb)
  returns boolean
  language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_j  uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_on boolean := coalesce((p->>'on')::boolean, true);
  v_st text;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_j is null then raise exception '어느 공고인지 알 수 없습니다'; end if;
  if v_on then
    select state into v_st from jobpost where id = v_j;
    if v_st is null then raise exception '그런 공고가 없습니다'; end if;
    -- ⚠️ 내려간 · 가려진 공고는 담을 수 없습니다 — 담아 두면 저장
    --   목록에 **열 수 없는 줄**이 쌓입니다.
    if v_st not in ('open','closed') then
      raise exception '지금은 저장할 수 없는 공고입니다';
    end if;
    if (select count(*) from jobfav where by_user = v_me) >= 200 then
      raise exception '저장은 200개까지입니다. 먼저 정리해 주세요';
    end if;
    insert into jobfav (by_user, post_id) values (v_me, v_j)
      on conflict (by_user, post_id) do nothing;
    return true;
  end if;
  delete from jobfav where by_user = v_me and post_id = v_j;
  return false;
end $$;
revoke all on function fav_jobpost(jsonb) from public;
grant execute on function fav_jobpost(jsonb) to authenticated;
drop view if exists v_job_fav;
create view v_job_fav as
  select f.post_id as id, f.created_at as fav_at,
         j.kind, j.sub, j.region, j.title,
         j.pay, j.terms, j.close_at, j.state,
         j.role, j.emp_type, j.pay_type, j.pay_min,
         j.created_at,
         case when pv.id is not null and pv.state = 'approved'
                   and pv.is_test = false
              then pv.name end as pro_name
    from jobfav f
    join jobpost j on j.id = f.post_id
    left join provider pv on pv.id = j.provider_id
   where f.by_user = auth.uid()
     and j.state in ('open','closed')
   order by f.created_at desc;
grant select on v_job_fav to authenticated;
insert into schema_version (n, name) values (78, '0078_job_fav')
on conflict (n) do nothing;
commit;
commit;
begin;
alter table provider add column if not exists fit_terms text;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'provider_fit_terms_ck') then
    alter table provider add constraint provider_fit_terms_ck
      check (fit_terms is null or char_length(fit_terms) <= 120);
  end if;
end $$;
drop view if exists v_provider_card;
create view v_provider_card as
  select p.id, p.name, p.intro, p.regions, p.gu, p.subs, p.since,
         p.consult_hours, p.verified, p.brands, p.scale, p.contact_ways,
         p.ceo, p.addr, p.tel, p.email, p.brn,
         p.kind, p.place_name, p.lesson_goals,
         p.range_opts, p.open_hours,
         p.fit_ways,
         p.fit_terms,
         p.created_at,
         p.is_test
    from provider p
   where p.listed = true
     and p.is_test = false
     and p.state = 'approved';
grant select on v_provider_card to anon, authenticated;
create or replace function save_provider_self(
  p_data jsonb default '{}'::jsonb,
  p_why  text  default null
) returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_pv   text     := my_provider();
  v_scale text    := nullif(btrim(coalesce(p_data->>'scale','')), '');
  v_email text    := nullif(btrim(coalesce(p_data->>'email','')), '');
  v_place text    := nullif(btrim(coalesce(p_data->>'placeName','')), '');
  -- ⚠️ 0074 — 연습장 시설 정보 둘
  v_hours text    := nullif(btrim(coalesce(p_data->>'openHours','')), '');
  v_opts  text[]  := coalesce((select array_agg(btrim(x))
    from jsonb_array_elements_text(
      case when jsonb_typeof(p_data->'rangeOpts') = 'array'
           then p_data->'rangeOpts' else '[]'::jsonb end) x
    where btrim(x) <> ''), '{}');
  -- ⚠️ 0076 — 피팅 이용 방식
  v_fw    text[]  := coalesce((select array_agg(btrim(x))
    from jsonb_array_elements_text(
      case when jsonb_typeof(p_data->'fitWays') = 'array'
           then p_data->'fitWays' else '[]'::jsonb end) x
    where btrim(x) <> ''), '{}');
  -- ⚠️ 0079 — 피팅 거래 조건 (부품비 포함 여부 등). **업체가 적는
  --   값**이고 우리가 지어내지 않습니다 — 비면 화면에서 줄째 빠집니다.
  v_fterms text := nullif(btrim(coalesce(p_data->>'fitTerms','')), '');
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if v_role <> 'provider' or v_pv is null then
    raise exception '업체 계정으로 로그인하셔야 합니다';
  end if;
  if not exists (select 1 from provider where id = v_pv) then
    raise exception '연결된 업체를 찾을 수 없습니다';
  end if;
  if v_scale is not null and v_scale not in ('small','mid','large') then
    raise exception '거래 규모는 small · mid · large 중 하나입니다 — %', v_scale;
  end if;
  -- ⚠️ 0074 — 이용 시간과 시설 속성. **키 묶음은 화면이 들고 있고**
  --   여기서는 갯수와 길이만 봅니다 (박아 두면 느는 날 어긋납니다).
  if v_fterms is not null and char_length(v_fterms) > 120 then
    raise exception '거래 조건은 120자까지 적을 수 있습니다';
  end if;
  if v_hours is not null and char_length(v_hours) > 60 then
    raise exception '이용 시간이 너무 깁니다 (60자)';
  end if;
  if coalesce(array_length(v_opts, 1), 0) > 12 then
    raise exception '시설 항목은 열둘까지입니다';
  end if;
  if exists (select 1 from unnest(v_opts) u where char_length(u) > 40) then
    raise exception '시설 항목 값이 올바르지 않습니다';
  end if;
  -- ⚠️ 0076 — 이용 방식. 표의 check 와 **다른 말**로 거절합니다
  --   (같은 말로 거절하면 어느 자물쇠가 막았는지 알 수 없습니다).
  if coalesce(array_length(v_fw, 1), 0) > 6 then
    raise exception '이용 방식은 여섯 가지까지입니다';
  end if;
  if exists (select 1 from unnest(v_fw) u where char_length(u) > 40) then
    raise exception '이용 방식 값이 올바르지 않습니다';
  end if;
  if exists (
    select 1 from jsonb_array_elements_text(
      case when jsonb_typeof(p_data->'contactWays') = 'array'
           then p_data->'contactWays' else '[]'::jsonb end) as t(x)
     where btrim(x) not in ('phone','visit','online','shop'))
  then
    raise exception '상담 방식은 전화 · 방문 · 온라인 · 매장 중에서 고르셔야 합니다';
  end if;
  -- ⚠️ 적으셨으면 꼴을 봅니다 (비우는 것은 됩니다 — 지어내지 않습니다).
  if v_email is not null and v_email not like '%@%.%' then
    raise exception '이메일 꼴이 아닙니다 — %', v_email;
  end if;
  -- ⚠️ 0071 — 레슨 장소. 표의 check 와 **다른 말**로 거절합니다.
  if v_place is not null and length(v_place) > 80 then
    raise exception '레슨 장소 이름이 너무 깁니다 (여든 자까지)';
  end if;
  -- ⚠️⚠️ 레슨 목적은 **키를 안 봅니다**(DB 가 키 묶음을 모릅니다) — 갯수와
  --   길이만 막습니다. 모르는 키가 들어오면 화면이 **그 글자를 그대로**
  --   보여 줍니다(이름을 지어내지 않습니다).
  if (select count(*) from jsonb_array_elements_text(
        case when jsonb_typeof(p_data->'lessonGoals') = 'array'
             then p_data->'lessonGoals' else '[]'::jsonb end)) > 12 then
    raise exception '레슨 목적은 열두 개까지 고르실 수 있습니다';
  end if;
  update provider set
    intro = nullif(btrim(coalesce(p_data->>'intro','')), ''),
    regions = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'regions','[]'::jsonb)) x), '{}'),
    gu = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'gu','[]'::jsonb)) x), '{}'),
    industries = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'industries','[]'::jsonb)) x), '{}'),
    since = nullif(p_data->>'since','')::int,
    consult_hours = nullif(btrim(coalesce(p_data->>'consultHours','')), ''),
    brands = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'brands','[]'::jsonb)) x), '{}'),
    scale = v_scale,
    ceo = nullif(btrim(coalesce(p_data->>'ceo','')), ''),
    addr = nullif(btrim(coalesce(p_data->>'addr','')), ''),
    tel = nullif(btrim(coalesce(p_data->>'tel','')), ''),
    email = v_email,
    contact_ways = coalesce((select array_agg(btrim(x))
      from jsonb_array_elements_text(
        case when jsonb_typeof(p_data->'contactWays') = 'array'
             then p_data->'contactWays' else '[]'::jsonb end) x), '{}'),
    range_opts = v_opts,
    open_hours = v_hours,
    fit_ways = v_fw,
    fit_terms = v_fterms,
    place_name = v_place,
    lesson_goals = coalesce((select array_agg(btrim(x))
      from jsonb_array_elements_text(
        case when jsonb_typeof(p_data->'lessonGoals') = 'array'
             then p_data->'lessonGoals' else '[]'::jsonb end) x
      where btrim(x) <> ''), '{}')
  where id = v_pv;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'provider', v_pv, 'self-updated', p_why, p_data);
  return v_pv;
end $$;
insert into schema_version (n, name) values (79, '0079_fitting_terms')
on conflict (n) do nothing;
commit;
commit;
alter table joinroom add column if not exists level text;
alter table joinroom drop constraint if exists joinroom_level_ck;
alter table joinroom add  constraint joinroom_level_ck
  check (level is null or level in ('any','beginner','mid','low'));
grant select (level) on joinroom to authenticated;
alter table listing add column if not exists flex text;
alter table listing add column if not exists hand text;
alter table listing drop constraint if exists listing_flex_ck;
alter table listing add  constraint listing_flex_ck
  check (flex is null or flex in ('r','sr','s','x'));
alter table listing drop constraint if exists listing_hand_ck;
alter table listing add  constraint listing_hand_ck
  check (hand is null or hand in ('right','left'));
grant select (flex, hand) on listing to authenticated;
create index if not exists listing_flex_idx on listing (flex)
  where flex is not null;
create index if not exists listing_hand_idx on listing (hand)
  where hand is not null;
create index if not exists joinroom_level_idx on joinroom (level)
  where level is not null;
create or replace function open_joinroom(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_region  text := nullif(btrim(coalesce(p->>'region','')), '');
  v_play    date;
  v_title   text := nullif(btrim(coalesce(p->>'title','')), '');
  v_body    text := nullif(btrim(coalesce(p->>'body','')), '');
  v_course  text := nullif(btrim(coalesce(p->>'course','')), '');
  v_tee     text := nullif(btrim(coalesce(p->>'tee','')), '');
  v_note    text := nullif(btrim(coalesce(p->>'note','')), '');
  v_level   text := nullif(btrim(coalesce(p->>'level','')), '');
  v_contact text := nullif(btrim(coalesce(p->>'contact','')), '');
  v_need    int;
  v_budget  int;
  v_id      uuid;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_region is null then raise exception '지역을 골라 주세요'; end if;
  if v_title is null or char_length(v_title) < 2 then
    raise exception '제목을 두 글자 이상 적어 주세요';
  end if;
  if char_length(v_title) > 60 then
    raise exception '제목이 너무 깁니다 (60자)';
  end if;
  if p->>'play_at' is null or btrim(p->>'play_at') = '' then
    raise exception '언제 치실지 골라 주세요';
  end if;
  begin
    v_play := (p->>'play_at')::date;
  exception when others then
    raise exception '날짜가 올바르지 않습니다';
  end;
  if v_play < kst_today() then
    raise exception '지난 날짜로는 열 수 없습니다';
  end if;
  if v_play > kst_today() + 90 then
    raise exception '90일 뒤까지만 열 수 있습니다';
  end if;
  if p->>'need' is null or btrim(p->>'need') = '' then
    raise exception '몇 분을 찾으시는지 적어 주세요';
  end if;
  begin
    v_need := btrim(p->>'need')::int;
  exception when others then
    raise exception '인원은 숫자로 적어 주세요';
  end;
  if v_need < 1 or v_need > 3 then
    raise exception '찾으시는 인원은 1~3명입니다';
  end if;
  if nullif(btrim(coalesce(p->>'budget','')), '') is not null then
    begin
      v_budget := btrim(p->>'budget')::int;
    exception when others then
      raise exception '예상 비용은 숫자로 적어 주세요';
    end;
    if v_budget < 0 or v_budget > 100000000 then
      raise exception '예상 비용이 올바르지 않습니다';
    end if;
  end if;
  -- ⚠️ 실력은 **안 고르셔도 됩니다** — 고르셨으면 아는 값이어야 합니다
  --   (모르는 글자를 담으면 화면이 「미확인」을 찍습니다).
  if v_level is not null and v_level not in ('any','beginner','mid','low') then
    raise exception '실력 값이 올바르지 않습니다';
  end if;
  if v_contact is null then raise exception '연락처를 적어 주세요'; end if;
  if length(v_contact) > 100 then raise exception '연락처가 너무 깁니다'; end if;
  if p->>'agree_at' is null then
    raise exception '개인정보 수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes'
     or (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의 시각이 올바르지 않습니다';
  end if;
  if (select count(*) from joinroom
       where by_user = v_uid and state = 'open') >= 5 then
    raise exception '열어 두신 자리가 다섯입니다. 먼저 정리해 주세요';
  end if;
  if (select count(*) from joinroom
       where by_user = v_uid and created_at > now() - interval '1 day') >= 10 then
    raise exception '오늘은 더 열 수 없습니다 (하루 열 개)';
  end if;
  insert into joinroom (by_user, region, play_at, title, body, course,
                        tee, need, budget, note, level, contact, agree_at)
  values (v_uid, v_region, v_play, v_title, v_body, v_course,
          v_tee, v_need, v_budget, v_note, v_level,
          v_contact, (p->>'agree_at')::timestamptz)
  returning id into v_id;
  return v_id;
end $$;
revoke all on function open_joinroom(jsonb) from public;
grant execute on function open_joinroom(jsonb) to authenticated;
create or replace function edit_joinroom(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid    uuid := auth.uid();
  v_id     uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_owner  uuid;
  v_state  text;
  v_title  text := nullif(btrim(coalesce(p->>'title','')), '');
  v_body   text := nullif(btrim(coalesce(p->>'body','')), '');
  v_course text := nullif(btrim(coalesce(p->>'course','')), '');
  v_tee    text := nullif(btrim(coalesce(p->>'tee','')), '');
  v_note   text := nullif(btrim(coalesce(p->>'note','')), '');
  v_need   int;
  v_budget int;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 자리인지 알 수 없습니다'; end if;
  select by_user, state into v_owner, v_state
    from joinroom where id = v_id for update;
  if v_state is null then raise exception '그런 자리가 없습니다'; end if;
  if not coalesce(v_owner = v_uid, false) then
    raise exception '여신 분만 고치실 수 있습니다';
  end if;
  if v_state <> 'open' then
    raise exception '열려 있는 자리만 고치실 수 있습니다';
  end if;
  if v_title is null or char_length(v_title) < 2 then
    raise exception '제목을 두 글자 이상 적어 주세요';
  end if;
  if char_length(v_title) > 60 then
    raise exception '제목이 너무 깁니다 (60자)';
  end if;
  if p->>'need' is null or btrim(p->>'need') = '' then
    raise exception '몇 분을 찾으시는지 적어 주세요';
  end if;
  begin
    v_need := btrim(p->>'need')::int;
  exception when others then
    raise exception '인원은 숫자로 적어 주세요';
  end;
  if v_need < 1 or v_need > 3 then
    raise exception '찾으시는 인원은 1~3명입니다';
  end if;
  -- ⚠️ 이미 수락한 분보다 적게 줄이지 못합니다
  if v_need < (select count(*) from joinapply a
                where a.room_id = v_id and a.state = 'accepted') then
    raise exception '이미 수락하신 분보다 적게 줄일 수 없습니다';
  end if;
  if nullif(btrim(coalesce(p->>'budget','')), '') is not null then
    begin
      v_budget := btrim(p->>'budget')::int;
    exception when others then
      raise exception '예상 비용은 숫자로 적어 주세요';
    end;
    if v_budget < 0 or v_budget > 100000000 then
      raise exception '예상 비용이 올바르지 않습니다';
    end if;
  end if;
  if p ? 'level' then
    if nullif(btrim(coalesce(p->>'level','')), '') is not null
       and btrim(p->>'level') not in ('any','beginner','mid','low') then
      raise exception '실력 값이 올바르지 않습니다';
    end if;
  end if;
  update joinroom
     set title = v_title, body = v_body, course = v_course,
         tee = v_tee, note = v_note, need = v_need, budget = v_budget,
         level = case when p ? 'level'
                      then nullif(btrim(coalesce(p->>'level','')), '')
                      else level end,
         updated_at = now()
   where id = v_id;
  return v_id;
end $$;
revoke all on function edit_joinroom(jsonb) from public;
grant execute on function edit_joinroom(jsonb) to authenticated;
create or replace view v_join_open as
  select r.id, r.region, r.play_at, r.title, r.body, r.course, r.booked,
         r.tee, r.need, r.budget, r.note, r.created_at,
         (select count(*) from joinapply a
           where a.room_id = r.id and a.state = 'accepted') as taken_n,
         r.need - (select count(*) from joinapply a
                    where a.room_id = r.id and a.state = 'accepted') as left_n,
         (select count(*) from joinapply a
           where a.room_id = r.id and a.state = 'applied') as waiting_n,
         r.level
    from joinroom r
   where r.state = 'open'
     and r.play_at >= kst_today();
grant select on v_join_open to anon, authenticated;
create or replace view v_listing_open as
  select l.id, l.sub, l.region, l.ship, l.title, l.body, l.price, l.cond,
         l.brand, l.model, l.state, l.created_at,
         left(coalesce(nullif(btrim(a.name), ''), '회원'), 1) ||
         repeat('*', greatest(
           char_length(coalesce(nullif(btrim(a.name), ''), '회원')) - 1, 0))
           as seller,
         (select count(*) from listingask k
           where k.listing_id = l.id and k.state = 'asked') as ask_n,
         (select count(*) from listingphoto f where f.listing_id = l.id) as photo_n,
         (select f.path from listingphoto f
           where f.listing_id = l.id
           order by f.ord, f.created_at, f.id limit 1) as thumb,
         l.flex, l.hand
    from listing l
    left join account a on a.id = l.by_user
   where l.state in ('open','reserved');
grant select on v_listing_open to anon, authenticated;
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
  v_model   text := nullif(btrim(coalesce(p->>'model','')), '');
  v_flex    text := nullif(btrim(coalesce(p->>'flex','')), '');
  v_hand    text := nullif(btrim(coalesce(p->>'hand','')), '');
  v_ship    boolean := coalesce((p->>'ship')::boolean, false);
  v_price   int;
  v_id      uuid;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_sub is null then raise exception '물건 종류를 골라 주세요'; end if;
  if v_region is null then raise exception '지역을 골라 주세요'; end if;
  if v_brand is null then
    raise exception '브랜드를 골라 주세요 (모르시면 기타)';
  end if;
  if char_length(v_brand) > 30 then
    raise exception '브랜드가 너무 깁니다 (30자)';
  end if;
  if v_model is not null and char_length(v_model) > 40 then
    raise exception '모델명이 너무 깁니다 (40자)';
  end if;
  -- ⚠️ 플렉스 · 좌우타는 **안 고르셔도 됩니다**(클럽이 아닌 물건도
  --   있습니다). 고르셨으면 아는 값이어야 합니다.
  if v_flex is not null and v_flex not in ('r','sr','s','x') then
    raise exception '샤프트 플렉스 값이 올바르지 않습니다';
  end if;
  if v_hand is not null and v_hand not in ('right','left') then
    raise exception '좌타 · 우타 값이 올바르지 않습니다';
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
  if v_cond is null then raise exception '물건 상태를 골라 주세요'; end if;
  if v_cond not in ('new','like','good','fair') then
    raise exception '물건 상태가 올바르지 않습니다';
  end if;
  if v_contact is null then raise exception '연락처를 적어 주세요'; end if;
  if length(v_contact) > 100 then raise exception '연락처가 너무 깁니다'; end if;
  if p->>'agree_at' is null then
    raise exception '개인정보 수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes'
     or (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의 시각이 올바르지 않습니다';
  end if;
  if (select count(*) from listing
       where by_user = v_uid and state in ('open','reserved')) >= 10 then
    raise exception '팔고 계신 매물이 열입니다. 먼저 정리해 주세요';
  end if;
  if (select count(*) from listing
       where by_user = v_uid and created_at > now() - interval '1 day') >= 20 then
    raise exception '오늘은 더 올릴 수 없습니다 (하루 스무 개)';
  end if;
  insert into listing (by_user, sub, region, ship, title, body, price,
                       cond, contact, agree_at, brand, model, flex, hand)
  values (v_uid, v_sub, v_region, v_ship, v_title, v_body, v_price,
          v_cond, v_contact, (p->>'agree_at')::timestamptz,
          v_brand, v_model, v_flex, v_hand)
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
  if v_st not in ('open','reserved') then
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
  if p ? 'model' and char_length(btrim(coalesce(p->>'model',''))) > 40 then
    raise exception '모델명이 너무 깁니다 (40자)';
  end if;
  if p ? 'flex' then
    if nullif(btrim(coalesce(p->>'flex','')), '') is not null
       and btrim(p->>'flex') not in ('r','sr','s','x') then
      raise exception '샤프트 플렉스 값이 올바르지 않습니다';
    end if;
  end if;
  if p ? 'hand' then
    if nullif(btrim(coalesce(p->>'hand','')), '') is not null
       and btrim(p->>'hand') not in ('right','left') then
      raise exception '좌타 · 우타 값이 올바르지 않습니다';
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
    model   = case when p ? 'model'
                   then nullif(btrim(coalesce(p->>'model','')), '')
                   else model end,
    flex    = case when p ? 'flex'
                   then nullif(btrim(coalesce(p->>'flex','')), '')
                   else flex end,
    hand    = case when p ? 'hand'
                   then nullif(btrim(coalesce(p->>'hand','')), '')
                   else hand end,
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
insert into schema_version (n, name) values (80, '0080_join_level_listing_spec')
on conflict (n) do nothing;
commit;
alter table course add column if not exists photo text;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'course_photo_ck') then
    alter table course add constraint course_photo_ck
      check (photo is null or
             (photo ~ '^course/[0-9a-f-]{36}/[A-Za-z0-9._-]{1,80}$'
              and position('..' in photo) = 0));
  end if;
end $$;
create or replace function save_course_photo(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare v_role app_role := my_role(); v_id uuid; v_photo text; v_n int;
begin
  if coalesce(v_role::text,'') not in ('staff','admin') then
    raise exception '골프장 사진은 운영자만 고칠 수 있습니다';
  end if;
  v_id := nullif(p->>'id','')::uuid;
  if v_id is null then raise exception '어느 골프장인지 알려 주세요'; end if;
  if not (p ? 'photo') then raise exception '사진 경로를 보내 주세요'; end if;
  v_photo := nullif(btrim(coalesce(p->>'photo','')), '');
  update course set photo = v_photo, updated_at = now() where id = v_id;
  get diagnostics v_n = row_count;
  -- ⚠️ 0줄이면 **거절합니다** — 조용히 끝내면 기록에 "바꿨다" 가 남는데
  --    아무 일도 안 일어난 것입니다(0054 의 그 자리).
  if v_n = 0 then raise exception '그 골프장을 찾을 수 없습니다'; end if;
  insert into audit_log (by_user, what, obj, note)
  values (auth.uid(), 'save_course_photo', v_id::text,
          case when v_photo is null then '사진을 뺐습니다' else '사진을 적었습니다' end);
end $$;
revoke all on function save_course_photo(jsonb) from public;
grant execute on function save_course_photo(jsonb) to authenticated;
create or replace view v_teetime_open as
  select t.id, t.provider_id, p.name as provider_name,
         t.kind, t.region, t.course, t.play_at, t.tee_at, t.holes,
         t.slots, t.green_fee,
         coalesce(nullif(btrim(coalesce(t.tel, '')), ''), p.tel) as tel,
         t.note, t.created_at,
         t.slots - (select coalesce(sum(b.people), 0) from teebook b
                     where b.tee_id = t.id
                       and b.state in ('applied','confirmed')) as left_n,
         (select count(*) from teebook b
           where b.tee_id = t.id and b.state = 'confirmed') as confirmed_n,
         t.course_id,
         (select c.slug from course c
           where c.id = t.course_id and c.state <> 'hidden') as course_slug,
         (select c.photo from course c
           where c.id = t.course_id and c.state <> 'hidden') as photo
    from teetime t
    join provider p on p.id = t.provider_id
   where t.state = 'open'
     and t.play_at >= kst_today()
     and p.listed = true
     and p.is_test = false
     and p.state = 'approved';
grant select on v_teetime_open to anon, authenticated;
create or replace view v_course_public as
  select c.id, c.slug, c.kind, c.name, c.region, c.gu,
         c.addr, c.addr_road, c.tel, c.holes, c.biz_kind, c.site_url,
         c.lat, c.lng, c.state, c.updated_at,
         (select s.source_id from course_source s
           where s.course_id = c.id order by s.created_at limit 1) as source_id,
         (select max(s.as_of) from course_source s where s.course_id = c.id) as as_of,
         c.photo
    from course c
   where c.state <> 'hidden';
grant select on v_course_public to anon, authenticated;
insert into schema_version (n, name) values (81, '0081_course_photo')
on conflict (n) do nothing;
commit;
select max(n) from schema_version;
