-- ════════════════════════════════════════════════════════════════════
-- restore-defacl — 기본 권한(default privileges)만 원래대로 돌립니다.
--
-- 언제 쓰나: 0068~0081 을 **오늘 이어 갈 수 없을 때** 운영 DB 를 pre-apply
--   전의 기본 권한으로 돌려놓기 위해서입니다. `db/post-apply.sql` 의
--   ① 세 줄과 같고, ② 의 긴 점검 대신 지문 한 줄만 확인합니다.
--
-- 바꾸는 것: `public` 스키마에서 **postgres 가 앞으로 만드는 객체**의 기본
--   권한뿐입니다. 이미 있는 표 · 함수 · 데이터 · RLS · 정책은 한 글자도 안
--   바뀝니다. supabase_admin 줄도 안 건드립니다.
--
-- ⚠️⚠️ 이것을 돌린 뒤 0068 을 다시 이어 가려면 **먼저 `db/pre-apply.sql`
--   을 다시 실행**해야 합니다. 안 그러면 0068~0081 이 만드는 새 표 · 함수가
--   anon · authenticated 에게 열린 채 태어납니다 (내부 함수 31개 · 연락처 칸).
--   재개 순서: pre-apply → 0068 … 0081 (한 파일씩 반영 확인) → post-apply.
-- ════════════════════════════════════════════════════════════════════
alter default privileges in schema public grant all     on tables    to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all     on sequences to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to postgres, anon, authenticated, service_role;

-- 확인 — 적용 전(2026-11-14 백업 때) 지문과 같아야 합니다.
select md5(string_agg(pg_get_userbyid(defaclrole) || defaclobjtype::text ||
                      array_to_string(defaclacl, ' '), ','
                      order by defaclrole, defaclobjtype)) as defacl_fp,
       '4b42f19c2243a8010c8b86654cb4c753' as want,
       md5(string_agg(pg_get_userbyid(defaclrole) || defaclobjtype::text ||
                      array_to_string(defaclacl, ' '), ','
                      order by defaclrole, defaclobjtype))
         = '4b42f19c2243a8010c8b86654cb4c753' as same
  from pg_default_acl
 where defaclnamespace = 'public'::regnamespace;
