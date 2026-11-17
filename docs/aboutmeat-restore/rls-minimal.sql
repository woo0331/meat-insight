-- ⚠️ 승인 전에는 실행하지 마세요. (2026-11-17 작성 · 아직 아무 데도 돌리지 않았습니다)
-- 옛 MEAT INSIGHT 표 16개의 공개 쓰기 · 개인정보 읽기를 막는 최소 변경안.
-- 골프올인원 표는 이름이 하나도 나오지 않습니다 — 아래 16개 이름만 다룹니다.
-- 테스트 사이트가 읽는 표 5개(상품 · 커뮤니티 글 · 댓글 · 매물 · 업체)의 '읽기'만 남깁니다.
begin;

-- ① 16개 표에서 anon · 로그인 회원의 권한을 전부 거둡니다 (쓰기 · 지우기 · TRUNCATE 포함)
revoke all on table public.business_members, public.businesses, public.closure_requests, public.community_comments, public.community_posts, public.consult_requests, public.jobs, public.listings, public.members, public.orders, public.partner_requests, public.products, public.purchase_requests, public.subsidy_requests, public.suppliers, public.supply_requests from anon, authenticated;

-- ② RLS 가 꺼져 있던 8개를 켭니다 (정책이 없는 표는 그 순간 아무도 못 읽습니다)
alter table public.businesses        enable row level security;
alter table public.closure_requests  enable row level security;
alter table public.consult_requests  enable row level security;
alter table public.listings          enable row level security;
alter table public.members           enable row level security;
alter table public.partner_requests  enable row level security;
alter table public.subsidy_requests  enable row level security;
alter table public.supply_requests   enable row level security;

-- ③ 공개로 둘 읽기 5개 (개인정보 칸이 없거나, 매물 · 업체처럼 공개가 목적인 표)
grant select on table public.products, public.community_posts, public.community_comments,
                      public.listings, public.businesses to anon;
-- products · community_posts · community_comments 는 이미 'select using (true)' 정책이 있습니다.
create policy am_read_listings   on public.listings   for select to anon using (status = '노출중');
create policy am_read_businesses on public.businesses for select to anon using (true);

commit;

-- ── 확인 (돌린 뒤) ─────────────────────────────────────────────
-- begin; set local role anon; select count(*) from public.consult_requests; rollback;
--   → permission denied 가 나와야 합니다.
-- begin; set local role anon; select count(*) from public.products; rollback;  → 14

-- ── 되돌리기 (돌리기 전 상태 그대로) ────────────────────────────
-- begin;
-- drop policy if exists am_read_listings on public.listings;
-- drop policy if exists am_read_businesses on public.businesses;
-- alter table public.businesses disable row level security;  (나머지 7개도 같은 줄)
-- grant all on table public.business_members, public.businesses, public.closure_requests, public.community_comments, public.community_posts, public.jobs, public.listings, public.members, public.orders, public.partner_requests, public.products, public.purchase_requests, public.subsidy_requests, public.suppliers to anon, authenticated;
-- grant select, insert on table public.consult_requests, public.supply_requests to anon;
-- grant all on table public.consult_requests, public.supply_requests to authenticated;
-- commit;
