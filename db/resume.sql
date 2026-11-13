-- ════════════════════════════════════════════════════════════════════
-- resume — "어디까지 됐나" 를 묻는 조회입니다. **아무것도 바꾸지 않습니다.**
--
-- 중간에서 멈췄을 때 이것만 돌리시면 **다음에 무엇을 붙여 넣어야 하는지**
-- 그 자리에서 말해 줍니다. 번호를 다시 쓰지 않으므로, 멈춘 조각을 처음부터
-- 다시 붙여 넣으면 안 됩니다 (이미 지난 번호가 `create policy` 에서 터집니다).
--
-- ⚠️⚠️⚠️ 2026-11-13 정정 — **"멈춘 파일은 통째로 되돌아간다" 는 틀린 말입니다.**
--   마이그레이션 81개 가운데 **16개는 begin/commit 으로 안 감싸져 있습니다** —
--     0001 · 0002 · 0003 · 0004 · 0005 · 0006 · 0015 · 0045 ·
--     0071 · 0072 · 0073 · 0074 · 0075 · 0076 · 0080 · 0081
--   (조각으로는 1번에 일곱 · 2번에 하나(0045) · 5번에 여덟 · 3·4번에는 없습니다)
--   그 열여섯 가운데 하나가 중간에 멈추면 **앞부분이 적용된 채로 남습니다.**
--   그래서 아래 ⑤ 가 "멈춘 번호가 그 열여섯에 드는가" 를 말해 줍니다 —
--   들면 그 파일을 **그냥 다시 붙여 넣지 마시고** 저에게 ⑥ 의 값을 알려
--   주세요 (이미 만들어진 것이 무엇인지 보고 그 지점부터 이어야 합니다).
--
-- ⚠️⚠️ **"schema_version 이 없다 = 한 번도 안 돌았다" 도 틀린 말입니다.**
--   그 표는 **0002 가** 만듭니다. 0001 이 중간에 멈추면 표 · 함수가 일부
--   생긴 채로 표만 없습니다. 그래서 ④ 가 **우리 객체가 몇 개 있는지**를
--   따로 셉니다 — ① 이 "없음" 인데 ④ 가 0보다 크면 **0001 이 중간에
--   멈춘 것**입니다.
-- ════════════════════════════════════════════════════════════════════
with sv as (
  select case when to_regclass('public.schema_version') is null then -1
              else (xpath('/row/v/text()',
                     query_to_xml('select coalesce(max(n),0) v from public.schema_version',
                                  false, true, '')))[1]::text::int end n
),
other(t) as (values
  ('business_members'),('businesses'),('closure_requests'),('community_comments'),
  ('community_posts'),('consult_requests'),('jobs'),('listings'),('members'),('orders'),
  ('partner_requests'),('products'),('purchase_requests'),('subsidy_requests'),
  ('suppliers'),('supply_requests')),
mine as (
  select count(*) n from pg_class c join pg_namespace s on s.oid = c.relnamespace
   where s.nspname = 'public' and c.relkind = 'r'
     and c.relname not in (select t from other)
),
nowrap(k) as (values (1),(2),(3),(4),(5),(6),(15),(45),(71),(72),(73),(74),(75),(76),(80),(81))
select 구분, 값 from (
  select 1 순, '① 적용된 마지막 판' 구분,
         case when n < 0 then 'schema_version 표가 없습니다 (④ 를 같이 보세요)'
              else n::text end 값 from sv
  union all
  select 2, '② 멈춘 곳 — 다음에 돌아야 할 번호',
         case when (select n from sv) < 0 then '0001 (또는 0001 이 중간에 멈춤)'
              when (select n from sv) >= 81 then '(없습니다 — 81 까지 끝났습니다)'
              else lpad(((select n from sv) + 1)::text, 4, '0') end
  union all
  select 3, '③ 다음에 붙여 넣을 파일',
         case when (select n from sv) <  1 then 'db/pre-apply.sql → db/apply-all-1.sql'
              when (select n from sv) < 24 then 'db/apply-all-1.sql 의 **멈춘 번호부터** (db/migrations 에서 한 파일씩)'
              when (select n from sv) = 24 then 'db/apply-all-2.sql'
              when (select n from sv) < 45 then 'db/apply-all-2.sql 의 **멈춘 번호부터** (db/migrations 에서 한 파일씩)'
              when (select n from sv) = 45 then 'db/apply-all-3.sql'
              when (select n from sv) < 59 then 'db/apply-all-3.sql 의 **멈춘 번호부터** (db/migrations 에서 한 파일씩)'
              when (select n from sv) = 59 then 'db/apply-all-4.sql'
              when (select n from sv) < 70 then 'db/apply-all-4.sql 의 **멈춘 번호부터** (db/migrations 에서 한 파일씩)'
              when (select n from sv) = 70 then 'db/apply-all-5.sql'
              when (select n from sv) < 81 then 'db/apply-all-5.sql 의 **멈춘 번호부터** (db/migrations 에서 한 파일씩)'
              else 'db/post-apply.sql → db/verify.sql (전부 끝났습니다)' end
  union all
  select 4, '④ 골프올인원 표가 벌써 몇 개 있나',
         (select n::text from mine) || ' 개'
         || case when (select n from sv) < 0 and (select n from mine) > 0
                 then '  ⚠️ schema_version 은 없는데 표가 있습니다 = 0001 이 중간에 멈췄습니다 (그냥 다시 돌리지 마세요)'
                 when (select n from sv) < 0 then '  (아직 한 줄도 안 돌았습니다)'
                 else '' end
  union all
  select 5, '⑤ 멈춘 파일이 되돌아갔나',
         case when (select n from sv) >= 81 then '(해당 없음 — 끝났습니다)'
              when (select n from sv) < 0 and (select n from mine) = 0
                   then '(해당 없음 — 아직 시작 전입니다)'
              when exists (select 1 from nowrap where k = case when (select n from sv) < 0 then 1
                                                  else (select n from sv) + 1 end)
              then '⚠️ 아닙니다 — 그 번호는 트랜잭션으로 안 감싼 열여섯 가운데 하나입니다. '
                   || '앞부분이 적용된 채 남아 있을 수 있으니 **그 파일을 그냥 다시 붙여 넣지 마세요.** '
                   || '⑥ 의 값을 알려 주시면 이어 갈 자리를 짚어 드립니다.'
              else '예 — 그 번호는 트랜잭션으로 감싸져 있어 통째로 되돌아갔습니다. 그 파일부터 다시 하시면 됩니다.' end
  union all
  select 6, '⑥ (⑤ 가 경고일 때만) 멈춘 번호가 만들려던 것 가운데 이미 있는 것',
         case when (select n from sv) >= 81 then '(해당 없음)'
              else coalesce((
                select string_agg(x.nm, ', ' order by x.nm) from (
                  select c.relname nm from pg_class c join pg_namespace s on s.oid = c.relnamespace
                   where s.nspname = 'public' and c.relkind in ('r','v')
                     and c.relname not in (select t from other)
                   order by c.oid desc limit 12) x), '(없습니다)')
              || '   ← 가장 나중에 만들어진 차례로 열둘' end
  union all
  select 7, '⑦ 기본 권한이 지금 좁혀져 있나',
         coalesce((select case when array_to_string(d.defaclacl,' ') like '%anon=%'
                               then '아니요 — 복원된 상태입니다 (post-apply 를 이미 돌리셨습니다)'
                               else '예 — 좁혀져 있습니다 (올리는 중)' end
                     from pg_default_acl d join pg_namespace n on n.oid = d.defaclnamespace
                    where n.nspname = 'public' and d.defaclobjtype = 'r'
                      and d.defaclrole = (select oid from pg_roles where rolname = current_user)),
                  '예 — 좁혀져 있습니다 (그 줄이 아예 없습니다)')
  union all
  select 8, '⑧ 기존 16개 표가 그대로인가',
         (select count(*)::text from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind = 'r'
             and c.relname in (select t from other)) || ' / 16 개'
) x order by x.순;
