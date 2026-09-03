-- ════════════════════════════════════════════════════════════════════
--  고리 — PHASE 3 스키마 확장
--  매칭 알림 · 1:1 채팅 · 인증 · 거래관리 · 시세 · 구조화 견적
--
--  ⚠️ 추가 전용입니다. DROP/DELETE/TRUNCATE 없음, 기존 컬럼 변경 없음,
--     여러 번 실행해도 안전합니다. phase2_schema.sql 을 먼저 실행하세요.
-- ════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────
-- 1. 기존 테이블 컬럼 추가
-- ────────────────────────────────────────────────────────────

-- 업체: 매칭 조건 · 신뢰 지표 · 바로견적
alter table public.suppliers add column if not exists regions          text[];    -- 영업 가능 지역
alter table public.suppliers add column if not exists response_rate    integer;   -- 견적 응답률 %
alter table public.suppliers add column if not exists avg_response_min integer;   -- 평균 응답 시간(분)
alter table public.suppliers add column if not exists instant_quote    boolean default false;  -- 바로견적 가능
alter table public.suppliers add column if not exists instant_note     text;      -- 바로견적 기본 조건
alter table public.suppliers add column if not exists livestock_permit boolean default false;  -- 축산물 영업허가
alter table public.suppliers add column if not exists permit_no        text;      -- 허가번호
alter table public.suppliers add column if not exists notify_on        boolean default true;   -- 요청 알림 수신

-- 요청: 진정성 · 응답 지표 · 정기 납품
alter table public.purchase_requests add column if not exists buyer_verified boolean default false; -- 사업자 인증 요청
alter table public.purchase_requests add column if not exists recurring    boolean default false;   -- 정기 납품 요청
alter table public.purchase_requests add column if not exists notified_at  timestamptz;             -- 업체 알림 발송 시각
alter table public.purchase_requests add column if not exists notified_cnt integer default 0;       -- 알림 받은 업체 수

-- 견적: 구조화 (단가 × 수량 = 총액)
alter table public.quotes add column if not exists unit_price   numeric;  -- 단가
alter table public.quotes add column if not exists qty          numeric;  -- 수량
alter table public.quotes add column if not exists qty_unit     text;     -- kg / 두 / 톤 / 회
alter table public.quotes add column if not exists total_amount numeric;  -- 총액
alter table public.quotes add column if not exists market_ref   numeric;  -- 비교 기준 시세

-- ────────────────────────────────────────────────────────────
-- 2. 신규 테이블
-- ────────────────────────────────────────────────────────────

-- 2-1) 1:1 채팅방 (요청 ↔ 업체)
create table if not exists public.chat_rooms (
  id               uuid primary key default gen_random_uuid(),
  request_id       text,
  quote_id         text,
  buyer_user_id    uuid,
  buyer_name       text,
  supplier_id      text,
  supplier_user_id uuid,
  supplier_name    text,
  last_message     text,
  last_at          timestamptz default now(),
  created_at       timestamptz default now()
);
create index if not exists chat_rooms_buyer_idx on public.chat_rooms (buyer_user_id);
create index if not exists chat_rooms_sup_idx   on public.chat_rooms (supplier_user_id);

-- 2-2) 채팅 메시지
create table if not exists public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references public.chat_rooms(id) on delete cascade,
  sender_id   uuid,
  sender_name text,
  body        text not null,
  kind        text default 'text',   -- text | quote | system
  is_read     boolean default false,
  created_at  timestamptz default now()
);
create index if not exists chat_msg_room_idx on public.chat_messages (room_id, created_at);

-- 2-3) 업체 매칭 설정 (관심 분야·지역)
create table if not exists public.supplier_prefs (
  id             uuid primary key default gen_random_uuid(),
  supplier_id    text,
  user_id        uuid,
  category_mains text[],          -- 8대분류 key
  regions        text[],
  min_amount     numeric,         -- 이 금액 이상만 알림
  keywords       text[],
  notify_on      boolean default true,
  created_at     timestamptz default now(),
  unique (supplier_id)
);

-- 2-4) 인증 서류 (사업자 / HACCP / 축산물 영업허가)
create table if not exists public.verifications (
  id          uuid primary key default gen_random_uuid(),
  target_type text not null default 'supplier',
  target_id   text not null,
  user_id     uuid,
  kind        text not null,      -- brn | haccp | livestock_permit | etc
  number      text,               -- 사업자번호 / 인증번호 / 허가번호
  holder      text,               -- 상호 · 대표자
  file_url    text,
  status      text default '심사중',  -- 심사중 | 승인 | 반려
  memo        text,
  created_at  timestamptz default now(),
  reviewed_at timestamptz
);
create index if not exists verif_target_idx on public.verifications (target_type, target_id);

-- 2-5) 거래 (견적 선택 이후의 진행 상태)
create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  request_id     text not null,
  quote_id       text,
  buyer_user_id  uuid,
  buyer_name     text,
  buyer_phone    text,
  supplier_id    text,
  supplier_name  text,
  amount         numeric,
  title          text,
  status         text default '거래확정',  -- 거래확정 | 준비중 | 배송중 | 완료 | 취소
  timeline       jsonb default '[]'::jsonb,
  memo           text,
  created_at     timestamptz default now(),
  completed_at   timestamptz
);
create index if not exists orders_buyer_idx on public.orders (buyer_user_id);
create index if not exists orders_sup_idx   on public.orders (supplier_id);

-- 2-6) 시세 (견적을 시세와 비교하기 위한 기준값)
create table if not exists public.market_prices (
  id         uuid primary key default gen_random_uuid(),
  category   text,              -- beef | pork | byproduct | import
  item       text not null,     -- 한우 지육 1등급 …
  grade      text,
  price      numeric not null,
  unit       text default '원/kg',
  change     numeric,           -- 전일 대비
  source     text,
  price_date date default current_date,
  created_at timestamptz default now()
);
create index if not exists mp_date_idx on public.market_prices (price_date desc);

-- ────────────────────────────────────────────────────────────
-- 3. 매칭 알림 — 요청이 등록되면 조건이 맞는 업체에 알림 (DB 트리거)
--    클라이언트가 아니라 DB 에서 처리하므로 어떤 경로로 등록해도 동작합니다.
-- ────────────────────────────────────────────────────────────
create or replace function public.gori_notify_matching_suppliers()
returns trigger
language plpgsql
security definer          -- 다른 사용자에게 알림을 넣어야 하므로 필요합니다
set search_path = public
as $$
declare
  n integer := 0;
begin
  insert into public.notifications (user_id, type, title, body, link)
  select s.user_id,
         'request',
         '새 요청이 등록되었습니다',
         coalesce(new.title, new.description, new.category) || ' · ' || coalesce(new.region, '전국'),
         'req:' || new.id::text
  from public.suppliers s
  left join public.supplier_prefs p on p.supplier_id = s.id::text
  where s.user_id is not null
    and coalesce(s.notify_on, true)
    and coalesce(p.notify_on, true)
    -- 분야: 업체가 설정한 관심 분야 또는 등록 분야와 겹칠 때
    and (
      new.category_main is null
      or (p.category_mains is not null and new.category_main = any(p.category_mains))
      or (p.category_mains is null and s.category_mains is not null and new.category_main = any(s.category_mains))
      or (p.category_mains is null and s.category_mains is null)
    )
    -- 지역: 설정이 없거나 전국이면 통과
    and (
      new.region is null or new.region = '전국'
      or p.regions is null or '전국' = any(p.regions)
      or exists (select 1 from unnest(p.regions) r where new.region like '%' || r || '%' or r like '%' || new.region || '%')
    );
  get diagnostics n = row_count;

  update public.purchase_requests
     set notified_at = now(), notified_cnt = n
   where id = new.id;

  return new;
exception when others then
  return new;   -- 알림 실패가 요청 등록을 막지 않도록
end $$;

drop trigger if exists trg_gori_notify_suppliers on public.purchase_requests;
create trigger trg_gori_notify_suppliers
  after insert on public.purchase_requests
  for each row execute function public.gori_notify_matching_suppliers();

-- ────────────────────────────────────────────────────────────
-- 4. 업체 응답 지표 자동 갱신 — 견적을 보낼 때마다 재계산
-- ────────────────────────────────────────────────────────────
create or replace function public.gori_update_supplier_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  avg_min integer;
  total   integer;
  picked  integer;
begin
  if new.supplier_id is null then return new; end if;

  select count(*),
         count(*) filter (where q.status = '선택됨'),
         avg(extract(epoch from (q.created_at - r.created_at)) / 60)::integer
    into total, picked, avg_min
    from public.quotes q
    join public.purchase_requests r on r.id::text = q.request_id
   where q.supplier_id = new.supplier_id;

  update public.suppliers
     set avg_response_min = greatest(coalesce(avg_min, 0), 0),
         response_rate    = case when total > 0 then round(picked * 100.0 / total) else null end
   where id::text = new.supplier_id;

  return new;
exception when others then
  return new;
end $$;

drop trigger if exists trg_gori_supplier_stats on public.quotes;
create trigger trg_gori_supplier_stats
  after insert or update of status on public.quotes
  for each row execute function public.gori_update_supplier_stats();

-- ────────────────────────────────────────────────────────────
-- 5. RLS — 신규 테이블
-- ────────────────────────────────────────────────────────────
alter table public.chat_rooms     enable row level security;
alter table public.chat_messages  enable row level security;
alter table public.supplier_prefs enable row level security;
alter table public.verifications  enable row level security;
alter table public.orders         enable row level security;
alter table public.market_prices  enable row level security;

-- 채팅: 참여자 본인만 (로그인 필수)
drop policy if exists chat_rooms_own on public.chat_rooms;
create policy chat_rooms_own on public.chat_rooms for all
  using (auth.uid() = buyer_user_id or auth.uid() = supplier_user_id)
  with check (auth.uid() = buyer_user_id or auth.uid() = supplier_user_id);

drop policy if exists chat_msg_own on public.chat_messages;
create policy chat_msg_own on public.chat_messages for all
  using (exists (select 1 from public.chat_rooms r
                  where r.id = chat_messages.room_id
                    and (auth.uid() = r.buyer_user_id or auth.uid() = r.supplier_user_id)))
  with check (exists (select 1 from public.chat_rooms r
                  where r.id = chat_messages.room_id
                    and (auth.uid() = r.buyer_user_id or auth.uid() = r.supplier_user_id)));

-- 매칭 설정 · 인증: 읽기 공개(배지 노출용) / 쓰기는 본인
drop policy if exists prefs_read on public.supplier_prefs;
create policy prefs_read on public.supplier_prefs for select using (true);
drop policy if exists prefs_write on public.supplier_prefs;
create policy prefs_write on public.supplier_prefs for all
  using (user_id is null or auth.uid() = user_id) with check (true);

drop policy if exists verif_read on public.verifications;
create policy verif_read on public.verifications for select using (true);
drop policy if exists verif_insert on public.verifications;
create policy verif_insert on public.verifications for insert with check (true);

-- 거래: 당사자만 읽고 쓰기 (미로그인 거래도 있으므로 user_id 없으면 허용)
drop policy if exists orders_party on public.orders;
create policy orders_party on public.orders for all
  using (buyer_user_id is null or auth.uid() = buyer_user_id
         or exists (select 1 from public.suppliers s where s.id::text = orders.supplier_id and s.user_id = auth.uid()))
  with check (true);

-- 시세: 누구나 읽기, 쓰기는 로그인 사용자 (운영자가 입력)
drop policy if exists mp_read on public.market_prices;
create policy mp_read on public.market_prices for select using (true);
drop policy if exists mp_write on public.market_prices;
create policy mp_write on public.market_prices for insert with check (auth.role() = 'authenticated');
