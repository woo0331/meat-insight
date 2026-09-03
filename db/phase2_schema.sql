-- ════════════════════════════════════════════════════════════════════
--  고리 (aboutmeat.co.kr) — PHASE 2 스키마 확장
--  "축산업에 필요한 모든 연결" 거래 구조 (요청 → 견적 → 선택 → 거래 → 후기)
--
--  ⚠️ 이 스크립트는 "추가 전용"입니다.
--     · DROP / DELETE / TRUNCATE 없음
--     · 기존 컬럼 변경·삭제 없음
--     · 추가되는 컬럼은 전부 NULL 허용 또는 기본값 보유 → 기존 행에 영향 없음
--     · 여러 번 실행해도 안전합니다 (IF NOT EXISTS)
--
--  실행 방법: Supabase 대시보드 → SQL Editor → 붙여넣기 → Run
-- ════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────
-- 1. 기존 테이블 컬럼 추가
--    기존 컬럼(category, description 등)은 그대로 두고 나란히 사용합니다.
--    구버전 관리자 페이지(purchase_request.html 등)는 계속 동작합니다.
-- ────────────────────────────────────────────────────────────────

-- 1-1) 견적 요청
alter table public.purchase_requests add column if not exists user_id       uuid;    -- 작성자 (로그인 시)
alter table public.purchase_requests add column if not exists title         text;    -- 요청 제목
alter table public.purchase_requests add column if not exists category_main text;    -- 8대분류 key (meat/process/logi/labor/job/equip/startup/haccp)
alter table public.purchase_requests add column if not exists subcategory   text;    -- 소분류
alter table public.purchase_requests add column if not exists detail        jsonb;   -- STEP2 구조화 입력 (수량·단가·납기 등)
alter table public.purchase_requests add column if not exists deadline      date;    -- 희망 납품일/완료일
alter table public.purchase_requests add column if not exists priority      text;    -- 비교 우선순위 (가격,품질,납기…)
alter table public.purchase_requests add column if not exists visibility    text default 'all';  -- all | cert | private
alter table public.purchase_requests add column if not exists selected_quote_id text; -- 선택된 견적
alter table public.purchase_requests add column if not exists closed_at     timestamptz;

-- 1-2) 공급업체
alter table public.suppliers add column if not exists user_id         uuid;
alter table public.suppliers add column if not exists category_mains  text[];   -- 8대분류 key 배열
alter table public.suppliers add column if not exists services        text[];   -- 제공 서비스
alter table public.suppliers add column if not exists items           text[];   -- 취급 품목
alter table public.suppliers add column if not exists haccp           boolean default false;
alter table public.suppliers add column if not exists brn_verified    boolean default false;  -- 사업자 인증
alter table public.suppliers add column if not exists images          text[];   -- 회사 사진 URL
alter table public.suppliers add column if not exists intro           text;     -- 상세 소개
alter table public.suppliers add column if not exists deal_count      integer default 0;  -- 거래실적
alter table public.suppliers add column if not exists review_count    integer default 0;
alter table public.suppliers add column if not exists address         text;

-- 1-3) 구인구직 (정규직·장기)
alter table public.jobs add column if not exists user_id  uuid;
alter table public.jobs add column if not exists benefits text;

-- ────────────────────────────────────────────────────────────────
-- 2. 신규 테이블
--    참고: request_id / supplier_id 등은 기존 테이블의 id 타입(uuid·bigint)을
--          현재 확인할 수 없어 text 로 두고 애플리케이션에서 String() 처리합니다.
--          기존 테이블 타입을 확인한 뒤 FK 로 승격하는 것을 권장합니다.
-- ────────────────────────────────────────────────────────────────

-- 2-1) 견적 — 요청에 업체가 보내는 제안 (플랫폼의 핵심)
create table if not exists public.quotes (
  id            uuid primary key default gen_random_uuid(),
  request_id    text        not null,
  supplier_id   text,
  supplier_name text        not null,
  user_id       uuid,
  price         numeric,
  price_unit    text default '총액',      -- 총액 | 원/kg | 원/두 | 일당 …
  lead_time     text,                     -- 납기
  delivery      text,                     -- 배송조건
  conditions    text,                     -- 추가 제안
  region        text,
  contact       text,
  valid_until   date,
  status        text default '대기',      -- 대기 | 선택됨 | 미선택 | 취소
  created_at    timestamptz default now()
);
create index if not exists quotes_request_idx  on public.quotes (request_id);
create index if not exists quotes_supplier_idx on public.quotes (supplier_id);

-- 2-2) 후기·평점
create table if not exists public.reviews (
  id           uuid primary key default gen_random_uuid(),
  target_type  text not null,             -- supplier | worker
  target_id    text not null,
  request_id   text,
  user_id      uuid,
  author_name  text,
  rating       numeric(2,1) not null,     -- 1.0 ~ 5.0
  content      text,
  deal_summary text,                      -- 거래 요약 (예: 한우 지육 10두)
  created_at   timestamptz default now()
);
create index if not exists reviews_target_idx on public.reviews (target_type, target_id);

-- 2-3) 당일알바 — 현장 단기인력 (구인구직과 분리)
create table if not exists public.day_jobs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid,
  company       text not null,
  contact       text not null,
  work_type     text not null,            -- 발골 | 정형 | 세절 | 포장 | 생산 | 상하차 …
  work_date     date not null,
  start_time    text,
  end_time      text,
  headcount     integer default 1,
  pay           integer,                  -- 금액
  pay_type      text default '일당',      -- 일당 | 시급
  region        text,
  address       text,
  experience    text,                     -- 필요 경력
  detail        text,
  status        text default '모집중',    -- 모집중 | 마감 | 완료
  created_at    timestamptz default now()
);
create index if not exists day_jobs_date_idx on public.day_jobs (work_date desc);

-- 2-4) 당일알바 지원
create table if not exists public.day_job_applications (
  id          uuid primary key default gen_random_uuid(),
  day_job_id  text not null,
  user_id     uuid,
  worker_name text not null,
  contact     text not null,
  experience_years integer default 0,
  skills      text[],
  message     text,
  status      text default '지원',        -- 지원 | 선택됨 | 미선택 | 완료
  created_at  timestamptz default now()
);
create index if not exists dja_job_idx on public.day_job_applications (day_job_id);

-- 2-5) 인력 프로필 — 경력·가능업무·평점·작업횟수
create table if not exists public.worker_profiles (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid,
  name         text not null,
  contact      text,
  experience_years integer default 0,
  skills       text[],
  regions      text[],
  rating       numeric(2,1) default 0,
  work_count   integer default 0,
  intro        text,
  created_at   timestamptz default now()
);

-- 2-6) 관심업체
create table if not exists public.favorites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  target_type text not null,              -- supplier | worker
  target_id   text not null,
  created_at  timestamptz default now(),
  unique (user_id, target_type, target_id)
);

-- 2-7) 알림
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  type       text,                        -- quote | selected | review | dayjob …
  title      text not null,
  body       text,
  link       text,
  is_read    boolean default false,
  created_at timestamptz default now()
);
create index if not exists notif_user_idx on public.notifications (user_id, is_read);

-- ────────────────────────────────────────────────────────────────
-- 3. RLS — 신규 테이블에만 적용합니다.
--    기존 테이블(purchase_requests/suppliers/jobs)은 현재 운영 중인
--    관리자 페이지가 anon 키로 CRUD 하고 있어, 여기서 RLS 를 켜면
--    기존 화면이 즉시 멈춥니다. 그래서 건드리지 않았습니다.
--    → 아래 4번의 보안 강화 안내를 참고해 별도로 진행하세요.
--
--    신규 테이블 정책: 읽기·쓰기 허용 / 수정·삭제는 차단
--    (기존 테이블처럼 누구나 지울 수 있는 상태가 되지 않도록 막았습니다)
-- ────────────────────────────────────────────────────────────────
alter table public.quotes               enable row level security;
alter table public.reviews              enable row level security;
alter table public.day_jobs             enable row level security;
alter table public.day_job_applications enable row level security;
alter table public.worker_profiles      enable row level security;
alter table public.favorites            enable row level security;
alter table public.notifications        enable row level security;

do $$
declare t text;
begin
  foreach t in array array['quotes','reviews','day_jobs','day_job_applications','worker_profiles'] loop
    execute format('drop policy if exists %I on public.%I', t||'_read',   t);
    execute format('drop policy if exists %I on public.%I', t||'_insert', t);
    execute format('create policy %I on public.%I for select using (true)', t||'_read', t);
    execute format('create policy %I on public.%I for insert with check (true)', t||'_insert', t);
  end loop;
end $$;

-- 작성자 본인만 상태를 바꿀 수 있게 (로그인한 경우)
drop policy if exists quotes_update on public.quotes;
create policy quotes_update on public.quotes
  for update using (user_id is not null and auth.uid() = user_id);

drop policy if exists dja_update on public.day_job_applications;
create policy dja_update on public.day_job_applications
  for update using (user_id is not null and auth.uid() = user_id);

drop policy if exists day_jobs_update on public.day_jobs;
create policy day_jobs_update on public.day_jobs
  for update using (user_id is not null and auth.uid() = user_id);

-- 관심업체·알림은 본인 것만
drop policy if exists favorites_own on public.favorites;
create policy favorites_own on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists notifications_own on public.notifications;
create policy notifications_own on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────
-- 4. 🔴 보안 강화 (별도 점검 후 실행하세요 — 지금은 주석 처리)
--
--    현재 suppliers.html / jobs.html / purchase_request.html 이
--    브라우저에 노출된 anon 키로 UPDATE·DELETE 를 실행합니다.
--    RLS 가 꺼져 있다면 URL 을 아는 누구나 전체 데이터를 삭제할 수 있습니다.
--
--    아래를 실행하면 즉시 안전해지지만, 위 관리자 페이지의 수정·삭제 기능이
--    멈춥니다. 관리자 인증(Supabase Auth 로그인)을 붙인 뒤 실행하세요.
--
-- alter table public.purchase_requests enable row level security;
-- alter table public.suppliers         enable row level security;
-- alter table public.jobs              enable row level security;
--
-- create policy pr_read   on public.purchase_requests for select using (true);
-- create policy pr_insert on public.purchase_requests for insert with check (true);
-- create policy pr_write  on public.purchase_requests for update using (auth.role() = 'authenticated');
-- create policy pr_del    on public.purchase_requests for delete using (auth.role() = 'authenticated');
-- (suppliers / jobs 도 동일하게)
-- ────────────────────────────────────────────────────────────────
