-- ════════════════════════════════════════════════════════════════════
--  고리 (aboutmeat.co.kr) — PHASE 7 : 신고 · 문의 창구
--
--  왜 필요한가
--    고리는 요청자와 업체를 연결하는 중개 서비스인데, 지금은 문제가
--    생겼을 때 알릴 곳이 없습니다. 허위 요청, 연락 두절, 부적절한
--    게시물이 있어도 이용자가 할 수 있는 게 없고, 운영하는 쪽도
--    그런 일이 있었는지 알 방법이 없습니다.
--    문의도 마찬가지입니다 — 푸터에 전화번호와 이메일만 있고,
--    사이트 안에서 남길 창구가 없습니다.
--
--  무엇을 바꾸는가
--    테이블 두 개를 새로 만들기만 합니다.
--    기존 테이블·컬럼·데이터는 하나도 건드리지 않습니다.
--
--      reports    신고 (요청 / 업체 / 견적 / 구인구직)
--      inquiries  고객센터 문의
--
--  실행하지 않아도 됩니다
--    실행 전에는 신고·문의 화면이 "아직 준비되지 않았습니다" 안내와
--    고객센터 연락처를 보여 주고, 나머지 기능은 그대로 동작합니다.
--    (클라이언트가 PGRST205 를 보고 스스로 물러납니다)
--
--  되돌리는 방법
--    맨 아래 주석 처리된 drop table 두 줄을 실행하면 됩니다.
-- ════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────
-- 1. 신고
-- ────────────────────────────────────────────────────────────
create table if not exists public.reports (
  id           uuid primary key default gen_random_uuid(),
  target_type  text not null,                    -- request | supplier | quote | job
  target_id    text not null,
  target_name  text,                             -- 신고 당시의 제목·업체명 (나중에 원본이 지워져도 남게)
  reason       text not null,                    -- 허위·과장 / 연락 두절 / 부적절한 내용 / 사기 의심 / 기타
  detail       text,
  reporter_id  uuid references auth.users(id) on delete set null,
  reporter_name  text,
  reporter_phone text,
  status       text not null default '접수',      -- 접수 / 확인중 / 처리완료 / 반려
  admin_memo   text,
  created_at   timestamptz not null default now()
);

create index if not exists reports_target_idx  on public.reports(target_type, target_id);
create index if not exists reports_status_idx  on public.reports(status, created_at desc);

-- ────────────────────────────────────────────────────────────
-- 2. 문의
-- ────────────────────────────────────────────────────────────
create table if not exists public.inquiries (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null default '일반',       -- 일반 / 요청·견적 / 업체 등록 / 결제·환불 / 개인정보 / 신고
  name        text not null,
  phone       text,
  email       text,
  content     text not null,
  user_id     uuid references auth.users(id) on delete set null,
  status      text not null default '접수',       -- 접수 / 답변완료
  answer      text,
  created_at  timestamptz not null default now()
);

create index if not exists inquiries_status_idx on public.inquiries(status, created_at desc);

-- ────────────────────────────────────────────────────────────
-- 3. RLS — 누구나 넣을 수 있고, 읽는 것은 본인 것과 관리자만
--
--    신고는 로그인하지 않은 사람도 할 수 있어야 합니다(요청은 로그인
--    없이 올릴 수 있으므로). 대신 남의 신고를 읽지는 못합니다.
--    admins 테이블은 db/phase4_admin.sql 에서 만듭니다. 없으면
--    아래 관리자 정책 두 개만 실패하니, phase4 를 먼저 실행하세요.
-- ────────────────────────────────────────────────────────────
alter table public.reports   enable row level security;
alter table public.inquiries enable row level security;

drop policy if exists reports_insert_any on public.reports;
create policy reports_insert_any on public.reports
  for insert to anon, authenticated with check (true);

drop policy if exists reports_select_own on public.reports;
create policy reports_select_own on public.reports
  for select to authenticated using (reporter_id = auth.uid());

drop policy if exists inquiries_insert_any on public.inquiries;
create policy inquiries_insert_any on public.inquiries
  for insert to anon, authenticated with check (true);

drop policy if exists inquiries_select_own on public.inquiries;
create policy inquiries_select_own on public.inquiries
  for select to authenticated using (user_id = auth.uid());

-- 관리자 전체 열람·수정 (admins 테이블이 있을 때만)
do $$
begin
  if to_regclass('public.admins') is not null then
    execute $p$
      drop policy if exists reports_admin_all on public.reports;
      create policy reports_admin_all on public.reports
        for all to authenticated
        using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
        with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));
    $p$;
    execute $p$
      drop policy if exists inquiries_admin_all on public.inquiries;
      create policy inquiries_admin_all on public.inquiries
        for all to authenticated
        using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
        with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));
    $p$;
  else
    raise notice 'admins 테이블이 없어 관리자 정책은 건너뜁니다. db/phase4_admin.sql 을 먼저 실행하세요.';
  end if;
end $$;

-- ────────────────────────────────────────────────────────────
-- 되돌리기
-- ────────────────────────────────────────────────────────────
-- drop table if exists public.reports;
-- drop table if exists public.inquiries;
