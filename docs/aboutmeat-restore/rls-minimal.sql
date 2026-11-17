-- ⚠️ 대표자 승인 전에는 실행하지 마세요. (2026-11-17 최종 검토판 · 운영에 아직 안 돌렸습니다)
-- 옛 MEAT INSIGHT 표 16개만 다룹니다. 골프올인원 표 · 보기 · 함수 · 회원(auth.users · account)의
-- 이름은 이 파일에 한 번도 나오지 않습니다.
-- 실행 전 반드시: backup-before.sql 을 따로 보관해 두세요 (되돌릴 때 그대로 붙여 넣습니다).
--
-- 운영 DB 에서 확인한 것 (2026-11-17 · 읽기만)
--   · 16개 표를 참조하는 보기 · 트리거 · public 함수 · 다른 표의 정책 · realtime 발행: 0건
--   · 외래 키: community_comments → community_posts 하나뿐 (둘 다 16개 안)
--   · 골프 화면 코드(js · pages · api)에서 16개 표 이름을 부르는 곳: 0곳
--   → 이 SQL 은 골프 쪽에 닿는 길이 없습니다.

-- ══ A. 최우선 — 개인정보 읽기 · 쓰기 · 지우기 · TRUNCATE 차단 ══════════════
begin;

revoke all on table public.business_members, public.businesses, public.closure_requests, public.community_comments,
  public.community_posts, public.consult_requests, public.jobs, public.listings, public.members,
  public.orders, public.partner_requests, public.products, public.purchase_requests,
  public.subsidy_requests, public.suppliers, public.supply_requests
  from anon, authenticated;

alter table public.businesses        enable row level security;
alter table public.closure_requests  enable row level security;
alter table public.consult_requests  enable row level security;
alter table public.listings          enable row level security;
alter table public.members           enable row level security;
alter table public.partner_requests  enable row level security;
alter table public.subsidy_requests  enable row level security;
alter table public.supply_requests   enable row level security;

commit;
-- A 만 돌려도 됩니다. 그러면 16개 표 전부 공개 키로 아무것도 못 합니다
-- (테스트 사이트의 상품 · 매물 화면도 '불러오지 못함' 이 됩니다).

-- ══ B. 테스트 사이트가 읽는 공개 자료만 다시 열기 (A 뒤에 · 선택) ═════════
-- 커뮤니티 글 · 댓글은 검증 전까지 공개하지 않기로 했으므로 열지 않습니다.
begin;

grant select on table public.products, public.listings, public.businesses to anon;
-- products 에는 이미 'allow_select using (true)' 정책이 있습니다.
create policy am_read_listings   on public.listings   for select to anon using (status = '노출중');
create policy am_read_businesses on public.businesses for select to anon using (true);

commit;

-- ══ 확인 (돌린 뒤 · 각 줄 따로) ═════════════════════════════════════════
-- begin; set local role anon; select count(*) from public.consult_requests; rollback;  → permission denied
-- begin; set local role anon; select count(*) from public.community_posts;  rollback;  → permission denied
-- begin; set local role anon; truncate public.products;                     rollback;  → permission denied
-- begin; set local role anon; select count(*) from public.products;         rollback;  → 14 (B 를 돌렸을 때)
-- begin; set local role anon; select count(*) from public.course;           rollback;  → 골프 공개 자료 그대로 (전과 같은 수)
--
-- 되돌리기는 backup-before.sql (실행 전 상태를 운영 DB 에서 그대로 읽어 만든 것)
