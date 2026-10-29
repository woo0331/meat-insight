-- ════════════════════════════════════════════════════════════════════
-- 0020 · 직접 매입 재고 — 검수 · 원가 · 판매가 · 비용 · 수익
--   2026-10-29 ⑥
--
-- ⚠️⚠️ **중개 장부(deal)와 섞지 않습니다.** 그쪽은 "업체가 계약하고
-- 저희가 수수료를 받는" 기록이고, 이쪽은 "저희가 기기를 사서 파는"
-- 기록입니다. 한 표에 합치면 수수료 수익과 판매 마진이 한 숫자로
-- 섞여 **어느 쪽이 남는 장사인지** 영영 모릅니다.
--
-- ⚠️⚠️ **수익을 칸으로 두지 않습니다.** 원가 · 비용 · 판매가에서 셉니다
-- (뷰 v_device_pl). 숫자로 들고 있으면 누군가 손으로 고칠 수 있고
-- 원장과 어긋나기 시작합니다 — 업체 평점을 값으로 저장하지 않는 것과
-- 같은 까닭입니다.
--
-- ⚠️⚠️ **표에 쓰기 권한을 주지 않습니다.** 문 넷으로만 바뀌고, 문마다
-- 감사 기록을 **같은 트랜잭션에서** 남깁니다 (§8 — 기록 없이 지나갈
-- 길이 없습니다). 0003 · 0004 · 0007 과 같은 규칙입니다.
--
-- ⚠️ 고객은 **자기가 보낸 기기**만 봅니다. 업체는 **한 줄도** 못 봅니다 —
-- 직접 매입은 업체와 무관하고, 재고 · 원가가 보이면 그것이 곧 경쟁
-- 정보입니다 (지시서 §10 inhouse 분리와 같은 결입니다).
-- ════════════════════════════════════════════════════════════════════
begin;

-- ── 상태 아홉 ──────────────────────────────────────────────────────
-- ⚠️ js/data/stock.js 의 AM_DEV_ST 와 **같아야 합니다**
--    (checkStockSql() 이 빌드마다 맞춰 봅니다)
do $$ begin
  create type device_state as enum (
    'waiting','arrived','checking','regrade','checked',
    'listed','sold','returning','scrapped');
exception when duplicate_object then null; end $$;

do $$ begin
  create type device_cost_kind as enum (
    'inbound','repair','clean','outbound','fee','etc');
exception when duplicate_object then null; end $$;

-- ── 기기 한 대 ─────────────────────────────────────────────────────
create table if not exists device (
  id          uuid primary key default gen_random_uuid(),
  -- ⚠️ 접수에서 온 기기는 그 신청을 가리킵니다. 직접 사들인 기기는
  --    null 입니다 — 도매로 들여오는 길이 생겨도 이 표가 그대로 받습니다.
  request_id  uuid references request(id) on delete set null,
  state       device_state not null default 'waiting',

  -- 적어 주신 것 (접수 때) — ⚠️ **검수 결과와 갈라 둡니다.**
  -- 합치면 "무엇이 달랐나" 가 기록에서 사라지고, 재협의의 근거가
  -- 없어집니다 (중고폰 분쟁의 1번 원인).
  said_model  text not null,
  said_cap    int,
  said_grade  text,

  -- 검수 결과 — 확정된 것
  model       text,
  cap         int,
  grade       text,
  color       text,
  batt        int,
  imei_tail   text,              -- ⚠️ **뒤 네 자리만** (아래 제약)

  -- 돈 — ⚠️⚠️ 원 단위 정수. 문으로만 채워집니다.
  cost        bigint,            -- 매입원가 (고객에게 드린 금액)
  price       bigint,            -- 판매 희망가
  sold_price  bigint,            -- 실제 판매가
  sold_at     timestamptz,
  listed_at   timestamptz,
  checked_at  timestamptz,
  checked_by  uuid references auth.users(id) on delete set null,
  note        text,
  created_at  timestamptz not null default now(),

  constraint device_cost_sign  check (cost       is null or cost       >= 0),
  constraint device_price_sign check (price      is null or price      >= 0),
  constraint device_sold_sign  check (sold_price is null or sold_price >= 0),
  constraint device_batt_ok    check (batt is null or (batt > 0 and batt <= 100)),
  -- ⚠️⚠️ **IMEI 를 통째로 담지 마세요.** 기기 하나를 특정하는 값이라
  -- 그 자체가 개인정보에 가깝고, 새면 분실 신고 · 명의와 엮입니다.
  -- 같은 기종이 여러 대일 때 **가르는 데만** 쓰므로 뒤 네 자리면 됩니다.
  constraint device_imei_tail  check (imei_tail is null or imei_tail ~ '^[0-9]{4}$'),
  -- ⚠️⚠️ **검수 전에 원가가 적히면 안 됩니다** (§13 가짜 정산과 같은 결).
  constraint device_cost_needs_check
    check (cost is null or (checked_by is not null and checked_at is not null)),
  -- ⚠️⚠️ **판매 완료인데 판매가가 없으면 안 됩니다.**
  constraint device_sold_needs_price
    check (state <> 'sold' or (sold_price is not null and sold_at is not null))
);
create index if not exists device_state_idx on device(state);
create index if not exists device_req_idx   on device(request_id);

-- ── 검수 기록 ──────────────────────────────────────────────────────
-- ⚠️ 항목마다 한 줄입니다. 한 칸에 몰아 적으면 "무엇을 확인했는지" 가
--    글이 되어 기계가 못 셉니다 — 상품 상세의 "검수한 것" 이 이것입니다.
create table if not exists device_check (
  id        uuid primary key default gen_random_uuid(),
  device_id uuid not null references device(id) on delete cascade,
  item      text not null,                 -- 전원 · 액정 · 배터리 …
  result    text not null,                 -- ok | bad | na
  memo      text,
  by_user   uuid references auth.users(id) on delete set null,
  at        timestamptz not null default now(),
  constraint device_check_result check (result in ('ok','bad','na'))
);
create index if not exists device_check_dev_idx on device_check(device_id);

-- ── 비용 ───────────────────────────────────────────────────────────
-- ⚠️⚠️ **매입원가는 여기 없습니다** (device.cost 한 칸). 섞으면 줄
--    하나를 잘못 지울 때 원가가 바뀝니다.
create table if not exists device_cost (
  id        uuid primary key default gen_random_uuid(),
  device_id uuid not null references device(id) on delete cascade,
  kind      device_cost_kind not null,
  amount    bigint not null,
  memo      text,
  by_user   uuid references auth.users(id) on delete set null,
  at        timestamptz not null default now(),
  -- ⚠️ 음수를 허용합니다 — 환불 · 취소된 비용을 **지우지 않고** 차액으로
  --    적습니다 (환수를 갈아 치우지 않는 것과 같은 규칙).
  constraint device_cost_amount check (amount <> 0)
);
create index if not exists device_cost_dev_idx on device_cost(device_id);

-- ── 갈 수 있는 길 ──────────────────────────────────────────────────
-- ⚠️⚠️ plpgsql 에 손으로 적지 않습니다 — 표로 두고 함수가 읽습니다
--    (0004 의 deal_move 와 같은 방식). checkStockSql() 이 화면의
--    AM_DEV_MOVE 와 맞춰 봅니다.
create table if not exists device_move (
  from_st device_state not null,
  to_st   device_state not null,
  role    app_role    not null,
  primary key (from_st, to_st, role)
);
insert into device_move (from_st, to_st, role) values
  ('waiting','arrived','staff'),   ('waiting','arrived','admin'),
  ('waiting','returning','staff'), ('waiting','returning','admin'),
  ('arrived','checking','staff'),  ('arrived','checking','admin'),
  ('arrived','returning','staff'), ('arrived','returning','admin'),
  ('checking','checked','staff'),  ('checking','checked','admin'),
  ('checking','regrade','staff'),  ('checking','regrade','admin'),
  ('checking','returning','staff'),('checking','returning','admin'),
  ('regrade','checked','staff'),   ('regrade','checked','admin'),
  ('regrade','returning','staff'), ('regrade','returning','admin'),
  ('checked','listed','staff'),    ('checked','listed','admin'),
  ('checked','scrapped','admin'),
  ('listed','sold','staff'),       ('listed','sold','admin'),
  ('listed','checked','staff'),    ('listed','checked','admin'),
  ('listed','scrapped','admin')
on conflict do nothing;

-- ── 손익 — ⚠️⚠️ **세는 값입니다 (칸이 아닙니다)** ──────────────────
create or replace view v_device_pl as
select d.id, d.state, d.model, d.grade,
       coalesce(d.cost, 0)                                   as cost,
       coalesce((select sum(c.amount) from device_cost c
                  where c.device_id = d.id), 0)              as extra,
       coalesce(d.cost, 0) +
       coalesce((select sum(c.amount) from device_cost c
                  where c.device_id = d.id), 0)              as spent,
       d.price, d.sold_price,
       -- 예상 — ⚠️ 판매가를 정해 둔 기기에만
       case when d.price is null then null
            else d.price - (coalesce(d.cost,0) +
                 coalesce((select sum(c.amount) from device_cost c
                            where c.device_id = d.id),0)) end as est_profit,
       -- 실제 — ⚠️⚠️ **팔린 기기에만.** 안 팔린 기기의 예상을 실제에
       -- 섞으면 장부가 거짓말이 됩니다.
       case when d.state <> 'sold' or d.sold_price is null then null
            else d.sold_price - (coalesce(d.cost,0) +
                 coalesce((select sum(c.amount) from device_cost c
                            where c.device_id = d.id),0)) end as real_profit
  from device d;

-- ── RLS ────────────────────────────────────────────────────────────
alter table device       enable row level security;
alter table device_check enable row level security;
alter table device_cost  enable row level security;
alter table device_move  enable row level security;

-- ⚠️⚠️ 고객은 **자기가 보낸 기기**만, 그리고 **돈 칸은 안 줍니다**
--    (아래 GRANT 가 칸을 가릅니다 — RLS 는 줄은 막아도 칸은 못 막습니다).
create policy device_mine on device for select to authenticated
  using (request_id is not null and is_my_request(request_id));
create policy device_staff on device for select to authenticated
  using (my_role() in ('staff','admin'));
create policy device_check_staff on device_check for select to authenticated
  using (my_role() in ('staff','admin'));
-- ⚠️ 검수 결과는 고객도 봅니다 — "무엇을 확인했는지" 를 못 보면
--    재협의 금액을 받아들일 근거가 없습니다.
create policy device_check_mine on device_check for select to authenticated
  using (exists (select 1 from device d
                  where d.id = device_check.device_id
                    and d.request_id is not null
                    and is_my_request(d.request_id)));
-- ⚠️⚠️ **비용은 직원 · 관리자만.** 고객에게 보이면 "원가가 이만큼인데
--    왜 이 값에 샀나" 가 되고, 업체에게 보이면 경쟁 정보입니다.
create policy device_cost_staff on device_cost for select to authenticated
  using (my_role() in ('staff','admin'));
create policy device_move_read on device_move for select to authenticated
  using (true);

-- ── GRANT — ⚠️⚠️ 읽기만. 쓰기는 문으로만 ──────────────────────────
-- ⚠️ anon 에게는 아무것도 주지 않습니다.
grant select (id, request_id, state, said_model, said_cap, said_grade,
              model, cap, grade, color, batt, checked_at, note, created_at,
              price, sold_at, listed_at)
  on device to authenticated;
-- ⚠️⚠️ `cost` · `sold_price` · `imei_tail` · `checked_by` 는 **안 줍니다** —
--    고객에게 원가가 보이면 안 되고, 직원 화면은 아래 함수로 받습니다.
grant select on device_check to authenticated;
grant select on device_cost  to authenticated;
grant select on device_move  to authenticated;

-- ════════ 문 넷 — 기록 없이 지나갈 길이 없습니다 ═══════════════════

-- ① 상태 옮기기
create or replace function move_device(
  p_device uuid, p_to device_state, p_data jsonb default '{}'::jsonb)
returns device language plpgsql security definer set search_path = public as $$
declare v_d device; v_role app_role; v_need text[]; v_k text;
        v_from device_state;
begin
  v_role := my_role();
  -- ⚠️⚠️ 변경자를 못 적는 기록은 기록이 아닙니다 (§8)
  if auth.uid() is null then raise exception '누가 바꾸는지 알 수 없습니다'; end if;
  if v_role not in ('staff','admin') then raise exception '권한이 없습니다'; end if;

  select * into v_d from device where id = p_device for update;
  if not found then raise exception '없는 기기입니다'; end if;
  v_from := v_d.state;

  -- ⚠️ 길 표에 없으면 거절 — 역할이 모자란 것과 **갈라서** 말합니다
  --    (화면이 다른 안내를 해야 합니다 · 0004 와 같은 규칙).
  if not exists (select 1 from device_move
                  where from_st = v_d.state and to_st = p_to) then
    raise exception '갈 수 없는 길입니다 — % → %', v_d.state, p_to;
  end if;
  if not exists (select 1 from device_move
                  where from_st = v_d.state and to_st = p_to and role = v_role) then
    raise exception '그 상태로 옮길 권한이 없습니다 — %', p_to;
  end if;

  -- ⚠️ 같이 적어야 하는 것 — `0` 과 `false` 는 값입니다 (있는지만 봅니다)
  v_need := case p_to
    when 'checked'   then array['grade','cost']
    when 'regrade'   then array['why']
    when 'listed'    then array['price']
    when 'sold'      then array['soldPrice']
    when 'returning' then array['why']
    when 'scrapped'  then array['why']
    else array[]::text[] end;
  foreach v_k in array v_need loop
    if p_data->v_k is null or p_data->>v_k = '' then
      raise exception '%', v_k;
    end if;
  end loop;

  if p_to = 'checked' then
    update device set state = p_to,
      grade = p_data->>'grade',
      model = coalesce(p_data->>'model', model),
      cap   = coalesce((p_data->>'cap')::int, cap),
      color = coalesce(p_data->>'color', color),
      batt  = coalesce((p_data->>'batt')::int, batt),
      imei_tail = coalesce(p_data->>'imeiTail', imei_tail),
      cost  = (p_data->>'cost')::bigint,
      checked_by = auth.uid(), checked_at = now()
     where id = p_device returning * into v_d;
  elsif p_to = 'listed' then
    update device set state = p_to, price = (p_data->>'price')::bigint,
      listed_at = now() where id = p_device returning * into v_d;
  elsif p_to = 'sold' then
    update device set state = p_to, sold_price = (p_data->>'soldPrice')::bigint,
      sold_at = now() where id = p_device returning * into v_d;
  else
    update device set state = p_to,
      note = coalesce(p_data->>'why', note)
     where id = p_device returning * into v_d;
  end if;

  -- ⚠️⚠️ 기록과 상태 변경이 **한 트랜잭션**입니다 — 기록이 실패하면
  --    상태도 안 바뀝니다.
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why)
  values (auth.uid(), v_role, 'device', p_device::text,
          v_from::text, p_to::text, nullif(p_data->>'why',''));
  return v_d;
end $$;

-- ② 검수 항목 적기
create or replace function add_device_check(
  p_device uuid, p_item text, p_result text, p_memo text default null)
returns device_check language plpgsql security definer set search_path = public as $$
declare v_r device_check; v_role app_role;
begin
  v_role := my_role();
  if auth.uid() is null then raise exception '누가 적는지 알 수 없습니다'; end if;
  if v_role not in ('staff','admin') then raise exception '권한이 없습니다'; end if;
  if coalesce(trim(p_item),'') = '' then raise exception '검수 항목이 비었습니다'; end if;
  if p_result not in ('ok','bad','na') then raise exception '검수 결과를 확인해 주세요'; end if;
  insert into device_check (device_id, item, result, memo, by_user)
  values (p_device, trim(p_item), p_result, nullif(trim(coalesce(p_memo,'')),''), auth.uid())
  returning * into v_r;
  return v_r;
end $$;

-- ③ 비용 적기
create or replace function add_device_cost(
  p_device uuid, p_kind device_cost_kind, p_amount bigint, p_memo text default null)
returns device_cost language plpgsql security definer set search_path = public as $$
declare v_r device_cost; v_role app_role;
begin
  v_role := my_role();
  if auth.uid() is null then raise exception '누가 적는지 알 수 없습니다'; end if;
  if v_role not in ('staff','admin') then raise exception '권한이 없습니다'; end if;
  -- ⚠️⚠️ **0 원 비용을 적지 않습니다** — 0 은 비용이 아니라 "없음" 이고,
  --    줄이 쌓이면 원장을 읽기만 어려워집니다.
  if p_amount is null or p_amount = 0 then raise exception '비용이 0 원입니다'; end if;
  insert into device_cost (device_id, kind, amount, memo, by_user)
  values (p_device, p_kind, p_amount, nullif(trim(coalesce(p_memo,'')),''), auth.uid())
  returning * into v_r;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why)
  values (auth.uid(), v_role, 'device_cost', p_device::text,
          p_kind::text, nullif(trim(coalesce(p_memo,'')),''));
  return v_r;
end $$;

-- ④ 기기 만들기 (접수에서 또는 직접)
create or replace function make_device(
  p_request uuid, p_model text, p_cap int default null, p_grade text default null)
returns device language plpgsql security definer set search_path = public as $$
declare v_d device; v_role app_role;
begin
  v_role := my_role();
  if auth.uid() is null then raise exception '누가 만드는지 알 수 없습니다'; end if;
  if v_role not in ('staff','admin') then raise exception '권한이 없습니다'; end if;
  if coalesce(trim(p_model),'') = '' then raise exception '기종이 비었습니다'; end if;
  insert into device (request_id, said_model, said_cap, said_grade)
  values (p_request, trim(p_model), p_cap, nullif(trim(coalesce(p_grade,'')),''))
  returning * into v_d;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state)
  values (auth.uid(), v_role, 'device', v_d.id::text, 'waiting');
  return v_d;
end $$;

revoke all on function move_device(uuid, device_state, jsonb) from public;
revoke all on function add_device_check(uuid, text, text, text) from public;
revoke all on function add_device_cost(uuid, device_cost_kind, bigint, text) from public;
revoke all on function make_device(uuid, text, int, text) from public;
grant execute on function move_device(uuid, device_state, jsonb) to authenticated;
grant execute on function add_device_check(uuid, text, text, text) to authenticated;
grant execute on function add_device_cost(uuid, device_cost_kind, bigint, text) to authenticated;
grant execute on function make_device(uuid, text, int, text) to authenticated;

insert into schema_version (n, name) values (20, '0020_device')
on conflict (n) do nothing;

commit;
