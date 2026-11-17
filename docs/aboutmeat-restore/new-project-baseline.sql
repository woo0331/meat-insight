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

-- 확인: 아래가 0줄이어야 합니다 (anon · authenticated 에게 열리는 기본 권한)
-- select defaclobjtype, defaclacl from pg_default_acl a join pg_namespace n on n.oid=a.defaclnamespace
--  where n.nspname='public' and (defaclacl::text like '%anon=%' or defaclacl::text like '%authenticated=%');
