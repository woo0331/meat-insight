-- ════════════════════════════════════════════════════════════════════
-- resume — "어디까지 됐나" 를 묻는 조회입니다. **아무것도 바꾸지 않습니다.**
--
-- 중간에서 멈췄을 때 이것만 돌리시면 **다음에 무엇을 붙여 넣어야 하는지**
-- 그 자리에서 말해 줍니다. 번호를 다시 쓰지 않으므로, 멈춘 조각을 처음부터
-- 다시 붙여 넣으면 안 됩니다 (이미 지난 번호가 `create policy` 에서 터집니다).
--
-- ⚠️ 마이그레이션은 파일마다 제 트랜잭션이 있습니다. 그래서 멈춘 그 파일은
--   **통째로 되돌아가** 있고, 그 파일부터 다시 하면 됩니다.
-- ════════════════════════════════════════════════════════════════════
with sv as (
  select case when to_regclass('public.schema_version') is null then -1
              else (xpath('/row/v/text()',
                     query_to_xml('select coalesce(max(n),0) v from public.schema_version',
                                  false, true, '')))[1]::text::int end n
)
select 구분, 값 from (
  select 1 순, '① 적용된 마지막 판' 구분,
         case when n < 0 then '(schema_version 표가 없습니다 = 아직 한 조각도 안 돌았습니다)'
              else n::text end 값 from sv
  union all
  select 2, '② 다음에 붙여 넣을 파일',
         case when (select n from sv) <  1 then 'db/pre-apply.sql → db/apply-all-1.sql'
              when (select n from sv) < 24 then 'db/apply-all-1.sql 을 **멈춘 번호부터** (db/migrations 에서 한 파일씩)'
              when (select n from sv) = 24 then 'db/apply-all-2.sql'
              when (select n from sv) < 45 then 'db/apply-all-2.sql 을 **멈춘 번호부터** (db/migrations 에서 한 파일씩)'
              when (select n from sv) = 45 then 'db/apply-all-3.sql'
              when (select n from sv) < 59 then 'db/apply-all-3.sql 을 **멈춘 번호부터** (db/migrations 에서 한 파일씩)'
              when (select n from sv) = 59 then 'db/apply-all-4.sql'
              when (select n from sv) < 70 then 'db/apply-all-4.sql 을 **멈춘 번호부터** (db/migrations 에서 한 파일씩)'
              when (select n from sv) = 70 then 'db/apply-all-5.sql'
              when (select n from sv) < 81 then 'db/apply-all-5.sql 을 **멈춘 번호부터** (db/migrations 에서 한 파일씩)'
              else 'db/post-apply.sql → db/verify.sql (전부 끝났습니다)' end
  union all
  select 3, '③ 기본 권한이 지금 좁혀져 있나',
         coalesce((select case when array_to_string(d.defaclacl,' ') like '%anon=%'
                               then '아니요 — 복원된 상태입니다 (post-apply 를 이미 돌리셨습니다)'
                               else '예 — 좁혀져 있습니다 (올리는 중)' end
                     from pg_default_acl d join pg_namespace n on n.oid = d.defaclnamespace
                    where n.nspname = 'public' and d.defaclobjtype = 'r'
                      and d.defaclrole = (select oid from pg_roles where rolname = current_user)),
                  '좁혀져 있습니다 (그 줄이 아예 없습니다)')
  union all
  select 4, '④ 기존 16개 표가 그대로인가',
         (select count(*)::text from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind = 'r'
             and c.relname in ('business_members','businesses','closure_requests',
               'community_comments','community_posts','consult_requests','jobs','listings',
               'members','orders','partner_requests','products','purchase_requests',
               'subsidy_requests','suppliers','supply_requests')) || ' / 16 개'
) x order by x.순;
