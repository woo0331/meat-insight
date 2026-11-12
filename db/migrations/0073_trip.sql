-- ════════════════════════════════════════════════════════════════════
-- 0073 — 골프 여행 상품 (2026-11-12 · 확정 시안 ⑧)
--
-- 시안이 상품 카드(사진 · 일정 · 1인 가격 · 포함/별도 · 판매사)와
-- 「맞춤 여행 견적」을 요구합니다. 저장소에는 **여행 상품을 담는 표가
-- 한 줄도 없었습니다** — provider_price(0042)는 값 한 줄짜리라 일정 ·
-- 포함/불포함 · 사진을 못 담습니다.
--
-- ⚠️⚠️ **새 표만 만듭니다 — 있는 것을 베끼지 않습니다.**
--   여행사 = 분류가 travel 인 **업체**(provider)입니다. 심사 · 승인 ·
--   정지 · 사업자 신원정보 · 공개 카드가 거기서 이미 돕니다. 여행사
--   표를 따로 만들면 그 여섯을 한 벌 더 만들게 됩니다 (0071 이 프로를
--   새 표로 안 만든 그 까닭).
--
-- ⚠️⚠️⚠️ **승인된 상품만 손님에게 갑니다.** 공개로 나가는 길은
--   v_trip_open **하나**이고 거기 where 절이 자물쇠 그 자체입니다
--   (보기는 RLS 를 지나지 않습니다 — 0026 의 v_ad_live 자리).
--
-- ⚠️ 되돌아갔는지 보는 법:
--     select state, count(*) from trip group by state;
--     select count(*) from v_trip_open;   -- approved 만 세어야 합니다
-- ════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════
-- ① 상품
-- ════════════════════════════════════════════════════════════════════
create table if not exists trip (
  id          uuid primary key default gen_random_uuid(),
  -- ⚠️ 임자는 **업체**입니다. by_user 는 누가 적었나(기록)일 뿐이고
  --   고치는 권한은 provider_id 로 가릅니다 — 담당자가 바뀌어도
  --   상품이 주인을 잃지 않습니다.
  provider_id text not null references provider(id) on delete cascade,
  by_user     uuid not null references auth.users(id) on delete cascade,
  -- 국내 · 해외
  scope       text not null check (scope in ('home','abroad')),
  -- ⚠️⚠️ **목적지 키 묶음을 DB 가 모릅니다** — 국내는 regions.js 의
  --   AM_REGIONS, 해외는 AM_TRIP_REGIONS 이고 둘 다 늘어납니다.
  --   박아 두면 느는 날 두 곳이 어긋나고 화면은 보내는데 DB 가
  --   거절합니다 (0056 이 listing.sub 를 안 박은 그 까닭).
  dest        text not null check (btrim(dest) <> '' and char_length(dest) <= 40),
  title       text not null check (char_length(btrim(title)) between 2 and 80),
  body        text not null check (char_length(btrim(body)) between 5 and 4000),
  -- 일정 — 1박 2일이면 nights 1 · days 2
  nights      int not null check (nights >= 0 and nights <= 60),
  days        int not null check (days   >= 1 and days   <= 61),
  constraint trip_span_ck check (days > nights),
  -- ⚠️⚠️ **1인 기준 최저가를 반드시 받습니다.** 비우면 화면이
  --   "가격 문의" 를 **지어 적게** 됩니다 (0056 이 매물 값을 반드시
  --   받는 그 까닭). 0 원은 여행 상품에 뜻이 없어 막습니다.
  price_from  bigint not null check (price_from > 0 and price_from <= 100000000),
  -- "일정에 따라 금액 변동" 같은 **사실**만 적는 칸입니다
  price_note  text check (price_note is null or char_length(price_note) <= 120),
  -- 포함 · 불포함 — 글자 배열 (숙박 · 36홀 / 항공 · 카트)
  incl        text[] not null default '{}',
  excl        text[] not null default '{}',
  constraint trip_incl_ck check (array_length(incl,1) is null or array_length(incl,1) <= 12),
  constraint trip_excl_ck check (array_length(excl,1) is null or array_length(excl,1) <= 12),
  -- pending   올렸습니다 · 운영자 확인을 기다립니다
  -- approved  승인 — **이때만** 손님 목록에 섭니다
  -- rejected  반려 ⚠️ 까닭이 반드시 있습니다
  -- closed    여행사가 내렸습니다 (판매 종료)
  -- hidden    운영자가 가렸습니다 ⚠️ 까닭이 반드시 있습니다
  state       text not null default 'pending'
              check (state in ('pending','approved','rejected','closed','hidden')),
  -- ⚠️⚠️ 0070 의 그 자리 — 가리기 전 상태를 적어 둡니다. 안 적으면
  --   되돌릴 때 **판매 종료된 상품이 다시 파는 것처럼** 섭니다.
  hidden_from text,
  state_why   text,
  state_by    uuid references auth.users(id) on delete set null,
  state_at    timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint trip_why_ck check (
    state not in ('rejected','hidden') or btrim(coalesce(state_why,'')) <> '')
);
create index if not exists trip_open_ix on trip (state, scope, dest);
create index if not exists trip_pv_ix   on trip (provider_id, state);

-- ② 사진 — 0068 의 listingphoto 를 그대로 베낍니다 (짜임새가 같습니다)
create table if not exists tripphoto (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references trip(id) on delete cascade,
  by_user    uuid not null references auth.users(id) on delete cascade,
  path       text not null unique,
  mime       text not null,
  bytes      int  not null,
  caption    text,
  -- ⚠️⚠️ 대표 사진은 **ord 가 가장 앞선 것**입니다 (boolean 으로 두면
  --   둘 다 참인 줄이 생기고 화면이 멋대로 고릅니다 · 0069).
  ord        int  not null default 0,
  created_at timestamptz not null default now(),
  constraint tripphoto_mime_ok  check (mime in ('image/jpeg','image/png','image/webp')),
  constraint tripphoto_bytes_ok check (bytes > 0 and bytes <= 8388608),
  constraint tripphoto_cap_ok   check (caption is null or char_length(caption) <= 60),
  constraint tripphoto_ord_ok   check (ord >= 0 and ord <= 99),
  -- ⚠️⚠️ **경로 꼴을 표가 다시 봅니다** — 문이 지은 것만 들어갑니다.
  --   '/photo/' 가 글자로 들어가고 **서버가 그것으로 버킷을 고릅니다**
  --   (0051 이 세운 규칙 — 화면이 버킷을 고르게 두면 거기가 구멍입니다).
  constraint tripphoto_path_ok check (
    path <> '' and length(path) <= 300
    and path = 'trip/' || trip_id::text || '/photo/' || split_part(path, '/', 4))
);
create index if not exists tripphoto_ord_ix on tripphoto (trip_id, ord, created_at);

-- ③ 자물쇠 — 표에는 정책도 GRANT 도 **하나도 없습니다**.
--    읽는 길은 보기 넷, 쓰는 길은 문 일곱뿐입니다.
alter table trip      enable row level security;
alter table tripphoto enable row level security;

-- ════════════════════════════════════════════════════════════════════
-- ④ 보기 넷
-- ════════════════════════════════════════════════════════════════════
-- 손님이 보는 목록 — ⚠️ **approved 이고 · 승인된 · 검사용이 아닌 업체**
--   셋을 읽을 때 다시 봅니다 (업체가 정지되면 그 순간 빠집니다 —
--   v_provider_card 와 같은 조건).
create view v_trip_open as
  select t.id, t.scope, t.dest, t.title, t.body, t.nights, t.days,
         t.price_from, t.price_note, t.incl, t.excl,
         t.created_at, t.updated_at,
         pv.id   as provider_id,
         pv.name as provider_name,
         (select count(*) from tripphoto ph where ph.trip_id = t.id) as photo_n,
         (select ph.path from tripphoto ph where ph.trip_id = t.id
           order by ph.ord, ph.created_at, ph.id limit 1) as thumb
    from trip t
    join provider pv on pv.id = t.provider_id
   where t.state = 'approved'
     and pv.state = 'approved'
     and pv.is_test = false;
grant select on v_trip_open to anon, authenticated;

create view v_trip_photo_public as
  select ph.id, ph.trip_id, ph.path, ph.caption, ph.ord
    from tripphoto ph
    join trip t      on t.id = ph.trip_id
    join provider pv on pv.id = t.provider_id
   where t.state = 'approved' and pv.state = 'approved' and pv.is_test = false
   order by ph.trip_id, ph.ord, ph.created_at, ph.id;
grant select on v_trip_photo_public to anon, authenticated;

-- 여행사가 제 작업실에서 보는 것 — 상태와 상관없이 **제 업체 것만**
create view v_trip_mine as
  select t.*,
         (select count(*) from tripphoto ph where ph.trip_id = t.id) as photo_n
    from trip t
   where t.provider_id = my_provider();
grant select on v_trip_mine to authenticated;

-- 운영자가 심사하는 자리
create view v_trip_review as
  select t.*, pv.name as provider_name,
         (select count(*) from tripphoto ph where ph.trip_id = t.id) as photo_n
    from trip t
    join provider pv on pv.id = t.provider_id
   where coalesce(my_role()::text, '') in ('admin','staff');
grant select on v_trip_review to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ⑤ 문 — 여행사가 제 상품을 올리고 고치고 내립니다
--   ⚠️⚠️ **임자는 업체입니다.** 담당자 계정이 바뀌어도 상품이 주인을
--     잃지 않게 provider_id 로 가릅니다 (by_user 는 기록입니다).
--   ⚠️ 어느 업체가 여행사인지는 **DB 가 모릅니다** — 분류 키를 박으면
--     하위가 느는 날 어긋납니다. 아무 승인 업체나 올릴 수는 있고,
--     **손님에게 가는 문은 운영자 승인**입니다 (그것이 진짜 자물쇠).
-- ════════════════════════════════════════════════════════════════════
create or replace function open_trip(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me    uuid := auth.uid();
  v_pv    text := my_provider();
  v_scope text := nullif(btrim(coalesce(p->>'scope','')), '');
  v_dest  text := nullif(btrim(coalesce(p->>'dest','')), '');
  v_title text := nullif(btrim(coalesce(p->>'title','')), '');
  v_body  text := nullif(btrim(coalesce(p->>'body','')), '');
  v_note  text := nullif(btrim(coalesce(p->>'price_note','')), '');
  v_n     int;
  v_d     int;
  v_price bigint;
  v_incl  text[] := coalesce((select array_agg(btrim(x)) from
             jsonb_array_elements_text(coalesce(p->'incl','[]'::jsonb)) x
             where btrim(x) <> ''), '{}');
  v_excl  text[] := coalesce((select array_agg(btrim(x)) from
             jsonb_array_elements_text(coalesce(p->'excl','[]'::jsonb)) x
             where btrim(x) <> ''), '{}');
  v_id    uuid;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_pv is null then
    raise exception '여행 상품은 입점하신 업체만 올릴 수 있습니다';
  end if;
  if not coalesce((select pv.state = 'approved' and pv.is_test = false
                     from provider pv where pv.id = v_pv), false) then
    raise exception '승인된 업체만 상품을 올릴 수 있습니다';
  end if;
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
  values (v_pv, v_me, v_scope, v_dest, v_title, v_body,
          v_n, v_d, v_price, v_note, v_incl, v_excl)
  returning id into v_id;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'trip', v_id::text, 'pending',
          jsonb_build_object('provider', v_pv, 'scope', v_scope));
  return v_id;
end $$;
revoke all on function open_trip(jsonb) from public;
grant execute on function open_trip(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 고치기 — ⚠️⚠️⚠️ **고치면 다시 심사로 갑니다.**
--   "승인된 상품만 손님 목록에 보인다" 를 지키려면 승인 뒤에 값을
--   바꾼 것이 그대로 나가면 안 됩니다 (값을 올려 적어도 아무도
--   못 봅니다). 그 사실을 화면이 그 자리에서 말합니다.
--   ⚠️ 내려간 · 가려진 상품은 못 고칩니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function edit_trip(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me    uuid := auth.uid();
  v_pv    text := my_provider();
  v_id    uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_owner text;
  v_st    text;
  v_scope text := nullif(btrim(coalesce(p->>'scope','')), '');
  v_dest  text := nullif(btrim(coalesce(p->>'dest','')), '');
  v_title text := nullif(btrim(coalesce(p->>'title','')), '');
  v_body  text := nullif(btrim(coalesce(p->>'body','')), '');
  v_note  text := nullif(btrim(coalesce(p->>'price_note','')), '');
  v_n int; v_d int; v_price bigint;
  v_incl  text[] := coalesce((select array_agg(btrim(x)) from
             jsonb_array_elements_text(coalesce(p->'incl','[]'::jsonb)) x
             where btrim(x) <> ''), '{}');
  v_excl  text[] := coalesce((select array_agg(btrim(x)) from
             jsonb_array_elements_text(coalesce(p->'excl','[]'::jsonb)) x
             where btrim(x) <> ''), '{}');
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
    raise exception '내리신 상품은 고치실 수 없습니다';
  end if;

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

  update trip
     set scope = v_scope, dest = v_dest, title = v_title, body = v_body,
         nights = v_n, days = v_d, price_from = v_price, price_note = v_note,
         incl = v_incl, excl = v_excl,
         state = 'pending', state_why = null, state_by = null, state_at = null,
         updated_at = now()
   where id = v_id;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'trip', v_id::text, 'pending',
          jsonb_build_object('edited', true, 'was', v_st));
  return v_id;
end $$;
revoke all on function edit_trip(jsonb) from public;
grant execute on function edit_trip(jsonb) to authenticated;

-- 내리기 — 여행사가 판매를 끝냅니다 (지우지 않습니다)
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
    raise exception '올리신 업체만 내리실 수 있습니다';
  end if;
  if v_st = 'hidden' then
    raise exception '운영자가 가린 상품입니다';
  end if;
  -- ⚠️ 같은 상태로 옮기는 것은 거절합니다 — 조용히 성공하면 화면이
  --   "내렸습니다" 를 적는데 아무 일도 안 일어났습니다 (0069 의 자리).
  if v_st = 'closed' then
    raise exception '이미 내리신 상품입니다';
  end if;
  update trip set state = 'closed', updated_at = now() where id = v_id;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'trip', v_id::text, 'closed',
          jsonb_build_object('was', v_st));
  return v_id;
end $$;
revoke all on function close_trip(jsonb) from public;
grant execute on function close_trip(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 운영자 — 승인 · 반려 · 가리기 · 되돌리기
--   ⚠️⚠️ 반려 · 가리기는 **까닭이 반드시** 있습니다 (표의 check 가
--     다시 봅니다 — 자물쇠 둘이고 말이 다릅니다).
--   ⚠️⚠️⚠️ 되돌릴 때는 **가리기 전 상태로** 갑니다 — approved 로만
--     되돌리면 판매 종료된 상품이 **다시 파는 것처럼** 섭니다 (0070).
-- ════════════════════════════════════════════════════════════════════
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

-- ════════════════════════════════════════════════════════════════════
-- ⑥ 사진 — 0068 · 0069 의 매물 사진을 그대로 베낍니다
--   ⚠️⚠️⚠️ **경로는 문이 짓고 버킷은 서버가 고릅니다** (0051 의 규칙).
--     화면이 경로를 지으면 남의 상품 칸에 쓸 수 있고, 화면이 버킷을
--     고르면 비공개 자료를 공개 버킷에 올릴 수 있습니다.
--   ⚠️ 열 장 · 한 장에 8MB — 그 수는 여기와 화면 **두 곳**이고,
--     화면이 먼저 막아도 **DB 가 다시 봅니다**.
-- ════════════════════════════════════════════════════════════════════
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
  v_ext text; v_path text; v_id uuid; v_ord int;
begin
  if v_me is null then raise exception '로그인하셔야 사진을 올릴 수 있습니다'; end if;
  if v_t is null then raise exception '어느 상품인지 알 수 없습니다'; end if;
  if v_pv is null or not exists (select 1 from trip
       where id = v_t and provider_id = v_pv
         and state in ('pending','approved','rejected')) then
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
  if (select count(*) from tripphoto where trip_id = v_t) >= 10 then
    raise exception '사진은 열 장까지입니다. 먼저 빼 주세요';
  end if;

  select coalesce(max(ord), -1) + 1 into v_ord from tripphoto where trip_id = v_t;
  if v_ord > 99 then v_ord := 99; end if;
  v_ext := case v_mime when 'image/jpeg' then 'jpg'
                       when 'image/png'  then 'png' else 'webp' end;
  v_path := 'trip/' || v_t::text || '/photo/' || gen_random_uuid()::text || '.' || v_ext;

  insert into tripphoto (trip_id, by_user, path, mime, bytes, caption, ord)
  values (v_t, v_me, v_path, v_mime, v_bytes, v_cap, v_ord)
  returning id into v_id;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'tripphoto', v_id::text, 'claimed',
          jsonb_build_object('mime', v_mime, 'bytes', v_bytes));
  return jsonb_build_object('id', v_id, 'path', v_path, 'ord', v_ord);
end $$;
revoke all on function claim_trip_photo(jsonb) from public;
grant execute on function claim_trip_photo(jsonb) to authenticated;

-- 빼기 — ⚠️ 없는 사진을 빼면 **거절**합니다 (조용히 0줄로 끝내면
--   기록에 "뺐다" 가 남는데 아무 일도 안 일어난 것입니다 · 0054)
create or replace function drop_trip_photo(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_pv text := my_provider();
  v_id uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_t  uuid; v_n int;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 사진인지 알 수 없습니다'; end if;
  select ph.trip_id into v_t from tripphoto ph
    join trip t on t.id = ph.trip_id
   where ph.id = v_id and v_pv is not null and t.provider_id = v_pv;
  if v_t is null then raise exception '그 사진은 뺄 수 없습니다'; end if;
  delete from tripphoto where id = v_id;
  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception '그 사진은 뺄 수 없습니다'; end if;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'tripphoto', v_id::text, 'dropped', '{}'::jsonb);
  return v_id;
end $$;
revoke all on function drop_trip_photo(jsonb) from public;
grant execute on function drop_trip_photo(jsonb) to authenticated;

-- 차례 바꾸기 — ⚠️⚠️ **늘어놓은 배열을 통째로** 받고 **빠짐없이** 와야
--   합니다. 일부만 보내면 안 보낸 것이 조용히 0 이 되어 그것이
--   대표 사진이 됩니다 (0069 의 그 자리).
create or replace function order_trip_photo(p jsonb)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_pv text := my_provider();
  v_t  uuid := nullif(btrim(coalesce(p->>'trip','')), '')::uuid;
  v_ids uuid[];
  v_have int; v_i int;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_t is null then raise exception '어느 상품인지 알 수 없습니다'; end if;
  if v_pv is null or not exists (select 1 from trip
       where id = v_t and provider_id = v_pv) then
    raise exception '그 상품은 고치실 수 없습니다';
  end if;
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
  v_i := 0;
  while v_i < v_have loop
    update tripphoto set ord = v_i where id = v_ids[v_i + 1];
    v_i := v_i + 1;
  end loop;
  return v_have;
end $$;
revoke all on function order_trip_photo(jsonb) from public;
grant execute on function order_trip_photo(jsonb) to authenticated;

insert into schema_version (n, name) values (73, '0073_trip')
  on conflict (n) do nothing;
