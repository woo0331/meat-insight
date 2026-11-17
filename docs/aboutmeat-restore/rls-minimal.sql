-- ⚠️ 대표자의 명시적 승인 전에는 실행하지 마세요. (A안 전용 · 2026-11-17 최종판 · 운영에 아직 안 돌렸습니다)
-- B안(테스트 사이트용 읽기 다시 열기)은 대표자 결정(2026-11-17)에 따라 이 파일에서 뺐습니다.
-- 실행 뒤 옛 MEAT INSIGHT 표 16개는 공개 키(anon) · 로그인 회원(authenticated)으로 아무것도 할 수 없습니다.
-- 운영자 권한(postgres · service_role)은 그대로라 자료는 지워지지 않고 Dashboard 에서 계속 볼 수 있습니다.
--
-- 대상 (16개 · 전부 public 스키마 · 옛 MEAT INSIGHT 표)
--   business_members businesses closure_requests community_comments community_posts consult_requests
--   jobs listings members orders partner_requests products purchase_requests subsidy_requests
--   suppliers supply_requests
--
-- 골프올인원 영향 재확인 (운영 DB · 2026-11-17 · 읽기만)
--   · 16개 이름 모두 존재 · 이 이름을 본문에 쓰는 함수(모든 사용자 스키마) 0 · 이 표에 기댄 보기 0
--   · 이 표의 트리거 0 · 다른 표의 정책이 이 이름을 쓰는 곳 0 · 외래 키는 community_comments→community_posts 하나
--   · auth.users 의 트리거 on_auth_user_created(handle_new_user)는 위 16개를 쓰지 않음(함수 본문 검색 0)
--   · 골프 화면 코드(js · pages · api)에서 16개 이름 호출 0
--   · 이 파일에는 골프 표 · auth 스키마 이름이 한 번도 나오지 않습니다
-- 실행 전: backup-before.sql 을 따로 보관하세요 (되돌릴 때 그대로 붙여 넣습니다).

begin;

revoke all on table
  public.business_members, public.businesses, public.closure_requests, public.community_comments,
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

-- ══ 확인 (돌린 뒤 · 한 줄씩) ═══════════════════════════════════════════
-- begin; set local role anon; select count(*) from public.consult_requests; rollback;  → permission denied
-- begin; set local role anon; select count(*) from public.products;         rollback;  → permission denied
-- begin; set local role anon; truncate public.community_posts;              rollback;  → permission denied
-- 골프 쪽이 그대로인지: 실행 전후로 아래 값이 같아야 합니다
-- select count(*) from information_schema.role_table_grants where grantee in ('anon','authenticated')
--   and table_schema='public' and table_name not in ('business_members','businesses','closure_requests',
--   'community_comments','community_posts','consult_requests','jobs','listings','members','orders',
--   'partner_requests','products','purchase_requests','subsidy_requests','suppliers','supply_requests');
