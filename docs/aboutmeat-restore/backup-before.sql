-- 옛 MEAT INSIGHT 표 16개의 실행 전 권한 · RLS · 정책 상태 (2026-11-17 운영 DB 에서 읽은 값)
-- rls-minimal.sql 을 되돌릴 때 이 파일을 그대로 붙여 넣습니다. 골프 표는 다루지 않습니다.
-- 원래 relacl: 14개 표 anon=arwdDxtm · authenticated=arwdDxtm (= ALL)
--              consult_requests · supply_requests 는 anon=ar (INSERT · SELECT) · authenticated=ALL
-- 칸 단위 권한: 16개 모두 없음
begin;
drop policy if exists am_read_listings   on public.listings;
drop policy if exists am_read_businesses on public.businesses;

grant all on table public.business_members, public.businesses, public.closure_requests,
  public.community_comments, public.community_posts, public.jobs, public.listings, public.members,
  public.orders, public.partner_requests, public.products, public.purchase_requests,
  public.subsidy_requests, public.suppliers to anon, authenticated;
grant insert, select on table public.consult_requests, public.supply_requests to anon;
grant all on table public.consult_requests, public.supply_requests to authenticated;

-- 원래 RLS 꺼짐이던 8개
alter table public.businesses        disable row level security;
alter table public.closure_requests  disable row level security;
alter table public.consult_requests  disable row level security;
alter table public.listings          disable row level security;
alter table public.members           disable row level security;
alter table public.partner_requests  disable row level security;
alter table public.subsidy_requests  disable row level security;
alter table public.supply_requests   disable row level security;
commit;

-- 실행 전 정책 (rls-minimal.sql 은 이 정책들을 지우거나 고치지 않습니다 · 기록용)
--   business_members : allow_insert(INSERT check true) · allow_select(SELECT true) · allow_update(UPDATE true)   roles public
--   community_comments: allow_insert · allow_select                                                              roles public
--   community_posts  : allow_insert · allow_select                                                               roles public
--   jobs             : anon_all(ALL using true check true)                                                       roles anon
--   members          : "Anyone can insert" · "Users can update own data"(using true) · "Users can view own data"(using true)  roles public
--   orders           : allow_insert · allow_select · allow_update                                                roles public
--   products         : allow_delete · allow_insert · allow_select · allow_update                                 roles public
--   purchase_requests: anon_all                                                                                  roles anon
--   suppliers        : anon_all                                                                                  roles anon
--   나머지 7개      : 정책 없음
