-- ABOUTMEAT 전용 Supabase 프로젝트용 스키마 (2026-11-17 준비 · 아직 아무 데도 안 돌렸습니다)
-- ⚠️ 새 프로젝트(aboutmeat)의 SQL 편집기에서만 실행합니다. 골프올인원 프로젝트에는 절대 붙여 넣지 마세요.
-- 칸 · 기본값 · 제약은 공용 프로젝트(igignylgzjphtnyxhhsd)의 옛 표 16개를 2026-11-17 에 읽어 그대로 옮겼습니다.
-- 권한은 옛 상태를 옮기지 않고 처음부터 잠급니다:
--   · 공개 키(anon) · 로그인 회원은 기본 권한 0 — Supabase 의 기본 GRANT 를 먼저 걷습니다
--   · 공개 읽기는 상품 · 노출 중인 매물 · 확인된 업체 셋뿐
--   · 신청 · 주문 · 상담 · 회원 · 커뮤니티는 공개 키로 읽기도 쓰기도 못 함 (운영 개시 승인 때 '넣기만' 엽니다)
--   · 관리자는 Supabase Auth 계정 + am_admin 표로만 (화면 코드에 비밀번호를 두지 않습니다)
begin;

alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;

create table public.community_posts (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  category text not null, title text not null, content text,
  author text default '익명', views integer default 0, likes integer default 0);
create table public.community_comments (
  id uuid not null default gen_random_uuid() primary key,
  post_id uuid references public.community_posts(id) on delete cascade,
  content text not null, author text default '익명', created_at timestamptz default now());
create table public.business_members (
  id uuid not null default gen_random_uuid() primary key,
  name text not null, phone text not null unique, business_name text not null, business_number text not null,
  business_type text, address text, status text default '심사중', memo text, created_at timestamptz default now());
create table public.businesses (
  id uuid not null default gen_random_uuid() primary key, created_at timestamptz default now(),
  name text not null, category text not null, region text, description text, contact text, address text,
  is_premium boolean default false, ad_type text default 'free', is_verified boolean default false);
create table public.closure_requests (
  id uuid not null default gen_random_uuid() primary key, created_at timestamptz default now(),
  name text, phone text, address text, area text, memo text, status text default '접수');
create table public.consult_requests (
  id uuid not null default gen_random_uuid() primary key,
  name text not null, phone text not null, plan text, type text, region text, timeline text, capital text,
  contact text, memo text, status text default '신규', created_at timestamptz default now(), email text,
  payment_method text default '무통장입금', payment_status text default '입금대기', order_id text, category text);
create table public.jobs (
  id uuid not null default gen_random_uuid() primary key,
  kind text not null default 'hire', job_role text, experience text, employment text, pay text, location text,
  company text, applicant_name text, contact text, is_urgent boolean default false, detail text,
  status text default '모집중', created_at timestamptz default now());
create table public.listings (
  id uuid not null default gen_random_uuid() primary key, created_at timestamptz default now(),
  type text not null, business_type text, title text not null, description text, address text, region text,
  price integer, deposit integer, monthly_rent integer, area integer, contact text,
  status text default '노출중', is_premium boolean default false);
create table public.members (
  id uuid not null default gen_random_uuid() primary key,
  kakao_id varchar(255) not null unique, nickname varchar(255), email varchar(255), profile_image text,
  role varchar(50) default 'member', created_at timestamptz default now(),
  last_login_at timestamptz default now(), is_active boolean default true);
create table public.orders (
  id uuid not null default gen_random_uuid() primary key, order_number text unique,
  buyer_name text not null, buyer_phone text not null, business_name text, business_number text,
  delivery_address text, delivery_date date, items jsonb not null, total_amount integer not null,
  status text default '주문접수', memo text, is_regular boolean default false, regular_cycle text,
  created_at timestamptz default now());
create table public.partner_requests (
  id uuid not null default gen_random_uuid() primary key, category text, name text not null, phone text not null,
  company text, email text, region text, biz_no text, website text, items text, volume text, area text, memo text,
  status text default '신규', created_at timestamptz default now());
create table public.products (
  id uuid not null default gen_random_uuid() primary key, category text not null, name text not null, grade text,
  price_per_kg integer not null, min_order_kg numeric default 1, stock_kg numeric default 0,
  is_available boolean default true, description text, image_url text, is_special boolean default false,
  created_at timestamptz default now(), updated_at timestamptz default now());
create table public.purchase_requests (
  id uuid not null default gen_random_uuid() primary key, item_category text, buyer_company text, budget_text text,
  description text, created_at timestamptz default now(), request_number text, category text, region text,
  buyer_name text, buyer_phone text, status text default '견적대기', quote_count integer default 0);
create table public.subsidy_requests (
  id uuid not null default gen_random_uuid() primary key, created_at timestamptz default now(),
  name text, phone text, business_type text, region text, memo text, status text default '접수');
create table public.suppliers (
  id uuid not null default gen_random_uuid() primary key, name text not null, rep_name text, brn text, contact text,
  region text, categories text[] default '{}', description text, min_qty text, lead_time text,
  rating numeric default 0,  -- ⚠️ 저장된 평점 — 화면에 내기 전에 근거를 확인하세요
  is_verified boolean default false, created_at timestamptz default now());
create table public.supply_requests (
  id uuid not null default gen_random_uuid() primary key, name text not null, phone text not null, biz_name text,
  type text, region text, items text, volume text, cycle text, price text, memo text,
  status text default '신규', created_at timestamptz default now());

-- 관리자: Supabase Auth 계정 id 를 여기에 넣은 사람만 (운영 개시 때 대표자 계정 한 줄)
create table public.am_admin (user_id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz default now());

-- 16개 + am_admin 전부 RLS 켬
do $$ declare t text; begin
  foreach t in array array['community_posts','community_comments','business_members','businesses','closure_requests',
    'consult_requests','jobs','listings','members','orders','partner_requests','products','purchase_requests',
    'subsidy_requests','suppliers','supply_requests','am_admin'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
  end loop; end $$;

create or replace function public.am_is_admin() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.am_admin where user_id = auth.uid()) $$;
revoke all on function public.am_is_admin() from public, anon;
grant execute on function public.am_is_admin() to authenticated;

-- 공개 읽기 셋
grant select on table public.products, public.listings, public.businesses to anon, authenticated;
create policy am_pub_products   on public.products   for select using (is_available);
create policy am_pub_listings   on public.listings   for select using (status = '노출중');
create policy am_pub_businesses on public.businesses for select using (is_verified);

-- 관리자: 16개 표를 읽고 고침 (TRUNCATE 는 누구에게도 주지 않습니다)
do $$ declare t text; begin
  foreach t in array array['community_posts','community_comments','business_members','businesses','closure_requests',
    'consult_requests','jobs','listings','members','orders','partner_requests','products','purchase_requests',
    'subsidy_requests','suppliers','supply_requests'] loop
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
    execute format('create policy am_admin_all on public.%I for all to authenticated using (public.am_is_admin()) with check (public.am_is_admin())', t);
  end loop; end $$;

commit;

-- 운영 개시 승인 때 (지금은 열지 않습니다): 신청 양식은 '넣기만' — 읽기 권한 없이
--   grant insert on table public.consult_requests to anon;
--   create policy am_form_consult on public.consult_requests for insert to anon with check (true);
--   (supply · partner · closure · subsidy · purchase · orders 도 같은 꼴 · 하루 건수 제한은 서버 함수로)
