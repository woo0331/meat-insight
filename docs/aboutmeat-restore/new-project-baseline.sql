-- ABOUTMEAT 신규 Supabase 프로젝트의 첫 잠금 (2026-11-17 · 아직 아무 데도 안 돌렸습니다)
-- ⚠️ 새 프로젝트(aboutmeat)의 SQL 편집기에서만 실행합니다. 골프올인원 프로젝트에 붙여 넣지 마세요.
-- 새 사업모델이 확정되기 전이므로 표는 하나도 만들지 않습니다. (옛 MEAT INSIGHT 표 16개를 옮기지 않습니다)
-- 하는 일은 하나 — 앞으로 만들 표 · 함수가 공개 키(anon) · 로그인 회원에게 저절로 열리지 않게 합니다.
-- Supabase 는 기본값으로 public 스키마에 새로 만든 표 · 함수를 anon · authenticated 에게 전부 엽니다.
-- 그래서 표를 만들 때마다 권한을 '필요한 만큼만' 직접 주게 됩니다 (골프올인원이 겪은 자리를 미리 막음).
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges revoke execute on functions from public;  -- Postgres 는 새 함수를 PUBLIC(=모두)에게 엽니다 (스키마를 적으면 안 먹습니다)
revoke execute on all functions in schema public from public;

-- 확인: 아래가 0줄이어야 합니다 (postgres 가 앞으로 만드는 것이 anon · authenticated 에게 열리는 기본 권한)
-- select defaclobjtype, defaclacl from pg_default_acl a join pg_roles r on r.oid=a.defaclrole
--  left join pg_namespace n on n.oid=a.defaclnamespace
--  where r.rolname='postgres' and coalesce(n.nspname,'public')='public'
--    and (defaclacl::text like '%anon=%' or defaclacl::text like '%authenticated=%');
--
-- 알아 둘 것 (2026-11-17 최종 확인)
--  · SQL 편집기 · Table Editor 로 만드는 표의 주인은 postgres 라 이 잠금이 걸립니다.
--  · supabase_admin(Supabase 내부)이 만드는 것의 기본 권한은 postgres 로 바꿀 수 없어 그대로 둡니다 — 우리 표와 무관합니다.
--  · service_role(서버 전용 키)은 그대로 쓸 수 있습니다. 화면(anon)에 열 표는 만들 때 grant 와 RLS 정책을 직접 적습니다.
--  · 두 번 실행해도 됩니다. 아무 데이터도 만들거나 지우지 않습니다.
