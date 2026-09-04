-- ════════════════════════════════════════════════════════════════════
--  고리 — PHASE 4 : 관리자 권한
--  admin.html 이 사용하는 관리자 계정 체계입니다.
--
--  ⚠️ 추가 전용. DROP/DELETE/TRUNCATE 없음. 재실행 안전.
--     phase2 → phase3 를 먼저 실행한 뒤 이 파일을 실행하세요.
-- ════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────
-- 1. 관리자 목록
--    Supabase Auth 로 로그인한 이메일이 이 표에 있으면 관리자입니다.
-- ────────────────────────────────────────────────────────────
create table if not exists public.admins (
  email      text primary key,
  name       text,
  memo       text,
  created_at timestamptz default now()
);

alter table public.admins enable row level security;

-- 본인 행만 조회 가능 (관리자 여부 확인용). 목록 전체는 노출되지 않습니다.
drop policy if exists admins_self on public.admins;
create policy admins_self on public.admins
  for select using (auth.email() = email);

-- ────────────────────────────────────────────────────────────
-- 2. 관리자 판별 함수
--    security definer 라 RLS 를 우회해 정확히 판별합니다.
-- ────────────────────────────────────────────────────────────
create or replace function public.is_gori_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.email = auth.email());
$$;

-- ────────────────────────────────────────────────────────────
-- 3. 🔴 최초 1회 — 본인 이메일을 관리자로 등록하세요
--
--    아래 줄의 주석(--)을 지우고 이메일을 본인 것으로 바꿔 실행하세요.
--    Supabase Auth 에 가입된 이메일이어야 합니다.
--    (고리 사이트에서 회원가입 → 이메일 인증 완료 후 등록)
--
-- insert into public.admins (email, name) values ('여기에@이메일.주소', '운영자')
--   on conflict (email) do nothing;
--
--    등록 후 확인:  select * from public.admins;
-- ────────────────────────────────────────────────────────────

-- ────────────────────────────────────────────────────────────
-- 4. 관리자에게 심사·운영 권한 부여
-- ────────────────────────────────────────────────────────────

-- 인증 심사 (승인 / 반려)
drop policy if exists verif_admin_write on public.verifications;
create policy verif_admin_write on public.verifications
  for update using (public.is_gori_admin());

drop policy if exists verif_admin_del on public.verifications;
create policy verif_admin_del on public.verifications
  for delete using (public.is_gori_admin());

-- 시세 입력·수정·삭제
drop policy if exists mp_write on public.market_prices;
create policy mp_write on public.market_prices
  for insert with check (public.is_gori_admin());
drop policy if exists mp_admin_update on public.market_prices;
create policy mp_admin_update on public.market_prices
  for update using (public.is_gori_admin());
drop policy if exists mp_admin_del on public.market_prices;
create policy mp_admin_del on public.market_prices
  for delete using (public.is_gori_admin());

-- 후기 관리 (신고 처리·삭제)
drop policy if exists reviews_admin_del on public.reviews;
create policy reviews_admin_del on public.reviews
  for delete using (public.is_gori_admin());

-- 거래 상태 조정
drop policy if exists orders_admin on public.orders;
create policy orders_admin on public.orders
  for all using (public.is_gori_admin()) with check (public.is_gori_admin());

-- 당일알바 관리
drop policy if exists dj_admin on public.day_jobs;
create policy dj_admin on public.day_jobs
  for all using (public.is_gori_admin()) with check (public.is_gori_admin());

-- 견적 관리
drop policy if exists quotes_admin on public.quotes;
create policy quotes_admin on public.quotes
  for all using (public.is_gori_admin()) with check (public.is_gori_admin());

-- ════════════════════════════════════════════════════════════════════
-- 5. 🔴 보안 강화 — 기존 테이블 RLS
--
--    지금은 purchase_requests / suppliers / jobs 에 RLS 가 없어
--    브라우저에 노출된 anon 키로 누구나 UPDATE·DELETE 할 수 있습니다.
--    관리자 계정을 3번에서 등록한 뒤 아래를 실행하면 막힙니다.
--
--    ⚠️ 실행하면 구버전 관리자 페이지의 수정·삭제가 멈춥니다:
--       suppliers.html / jobs.html / purchase_request.html
--       → 대신 새 admin.html 을 사용하세요 (관리자 로그인 기반).
--       읽기와 등록(사용자가 요청·업체 올리기)은 계속 동작합니다.
--
--    아래 블록 전체의 주석을 해제하고 실행하세요.
-- ════════════════════════════════════════════════════════════════════
/*
alter table public.purchase_requests enable row level security;
alter table public.suppliers         enable row level security;
alter table public.jobs              enable row level security;

-- 읽기: 전체 공개 (요청·업체 목록은 누구나 봐야 합니다)
drop policy if exists pr_read on public.purchase_requests;
create policy pr_read on public.purchase_requests for select using (true);
drop policy if exists sup_read on public.suppliers;
create policy sup_read on public.suppliers for select using (true);
drop policy if exists jobs_read on public.jobs;
create policy jobs_read on public.jobs for select using (true);

-- 등록: 누구나 (비로그인 요청 등록을 허용하는 현재 정책 유지)
drop policy if exists pr_insert on public.purchase_requests;
create policy pr_insert on public.purchase_requests for insert with check (true);
drop policy if exists sup_insert on public.suppliers;
create policy sup_insert on public.suppliers for insert with check (true);
drop policy if exists jobs_insert on public.jobs;
create policy jobs_insert on public.jobs for insert with check (true);

-- 수정: 본인 것 또는 관리자
drop policy if exists pr_update on public.purchase_requests;
create policy pr_update on public.purchase_requests for update
  using (public.is_gori_admin() or (user_id is not null and auth.uid() = user_id));
drop policy if exists sup_update on public.suppliers;
create policy sup_update on public.suppliers for update
  using (public.is_gori_admin() or (user_id is not null and auth.uid() = user_id));
drop policy if exists jobs_update on public.jobs;
create policy jobs_update on public.jobs for update
  using (public.is_gori_admin() or (user_id is not null and auth.uid() = user_id));

-- 삭제: 관리자만
drop policy if exists pr_delete on public.purchase_requests;
create policy pr_delete on public.purchase_requests for delete using (public.is_gori_admin());
drop policy if exists sup_delete on public.suppliers;
create policy sup_delete on public.suppliers for delete using (public.is_gori_admin());
drop policy if exists jobs_delete on public.jobs;
create policy jobs_delete on public.jobs for delete using (public.is_gori_admin());
*/
