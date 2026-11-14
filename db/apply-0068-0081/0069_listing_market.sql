-- 0069_listing_market · 운영 DB 판이 68 일 때만 실행합니다
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
select max(n) as ver from schema_version;
