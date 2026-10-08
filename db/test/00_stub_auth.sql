-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️ **검사용 가짜 Supabase 입니다. 운영에서 돌리지 마세요.**
--
-- Supabase 는 `auth` 스키마와 `auth.uid()` 를 자기가 들고 있습니다.
-- 그게 없으면 `0001_init.sql` 을 아예 돌려 볼 수가 없어서, 검사용으로
-- **같은 모양만** 만들어 둡니다. `tools/test-sql.js` 만 씁니다.
--
-- ⚠️ 진짜 Supabase 의 auth.uid() 는 JWT 에서 읽습니다. 여기서는
-- 세션 설정(`set local request.user`)에서 읽어, 검사가 "지금 누구로
-- 접속한 셈인가" 를 바꿔 가며 RLS 를 눌러 볼 수 있게 합니다.
-- ════════════════════════════════════════════════════════════════════
create schema if not exists auth;

create table auth.users (
  id    uuid primary key default gen_random_uuid(),
  email text
);

create or replace function auth.uid() returns uuid
  language sql stable as $$
  select nullif(current_setting('request.user', true), '')::uuid
$$;

-- 검사에서 "이 사람으로 접속한 셈" 을 만드는 손잡이
create or replace function become(u uuid) returns void
  language sql as $$ select set_config('request.user', coalesce(u::text,''), false) $$;

-- ⚠️ Supabase 가 들고 있는 역할 셋. 0001_init.sql 의 GRANT 가
-- 이 이름을 가리키므로 검사에서도 같은 이름으로 만듭니다.
-- ⚠️⚠️ nologin 입니다 — 검사는 `set role` 로 갈아입습니다.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon')
    then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated')
    then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role')
    then create role service_role nologin; end if;
end $$;

-- 검사가 auth.users 에 사람을 넣어야 해서 (운영에서는 Supabase 가 넣습니다)
grant usage on schema auth to anon, authenticated, service_role;
grant select on auth.users to authenticated, service_role;
grant insert on auth.users to service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
grant execute on function become(uuid) to anon, authenticated, service_role;
