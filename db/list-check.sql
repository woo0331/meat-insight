-- ════════════════════════════════════════════════════════════════════
--  골프장 목록 조회 확인 — 적용 뒤 3단계
--
--  ⚠️ **읽기 전용입니다.** insert · update · delete · drop 이 한 줄도
--     없습니다. 몇 번을 돌리셔도 DB 가 안 바뀝니다.
--
--  재는 것: 새 「골프장 정보」 탭이 자료를 읽어 가는 길이 뚫렸는가.
--  그 길은 하나입니다 — anon 키로 보기 `v_course_public` 를 읽습니다
--  (tools/pull-courses.js). 표를 바로 읽지 않습니다.
--
--  ⚠️ 골프장이 0곳으로 나오는 것은 **정상**입니다. 지금 저희에게
--     확인된 골프장 자료가 0줄입니다(공공데이터 접속이 막혀 있습니다).
--     여기서 보는 것은 "자료가 있나" 가 아니라 **"길이 뚫렸나"** 입니다.
-- ════════════════════════════════════════════════════════════════════
with v as (
  select count(*)::int n from pg_views
   where schemaname = 'public' and viewname = 'v_course_public'
), t as (
  select count(*)::int n from pg_tables
   where schemaname = 'public' and tablename in ('course','course_alias','course_source')
), g as (                      -- anon 이 그 보기를 읽을 수 있나
  select count(*)::int n from information_schema.role_table_grants
   where table_schema = 'public' and table_name = 'v_course_public'
     and grantee = 'anon' and privilege_type = 'SELECT'
), gt as (                     -- anon 이 course 표를 직접 읽으면 안 됩니다
  select count(*)::int n from information_schema.role_table_grants
   where table_schema = 'public' and table_name = 'course' and grantee = 'anon'
), c as (                      -- 보기가 내는 칸 (화면이 쓰는 것)
  select count(*)::int n from information_schema.columns
   where table_schema = 'public' and table_name = 'v_course_public'
     and column_name in ('slug','name','region','kind','state','addr',
                         'holes','biz_kind','site_url','photo')
), d as (                      -- 운영자가 등록 · 수정하는 문 셋
  select count(*)::int n from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public'
     and p.proname in ('save_course','move_course','link_course_alias')
), tee as (                    -- 0081 이 더한 사진 칸이 티타임 보기에 있나
  select count(*)::int n from information_schema.columns
   where table_schema = 'public' and table_name = 'v_teetime_open'
     and column_name = 'photo'
), rows as (                   -- 지금 등록된 골프장
  select count(*)::int n from public.course where state = 'open'
)
select 1 as "#", '① 공개 보기 v_course_public'  as "재는 것",
       (select n from v)::text  as "값", '1'  as "맞는 값",
       case when (select n from v) = 1 then '✅' else '❌ 보기가 없습니다 — 0066 이 안 돌았습니다' end as "판정"
union all select 2, '② 골프장 표 셋 (course · alias · source)',
       (select n from t)::text, '3',
       case when (select n from t) = 3 then '✅' else '❌ 0066 이 안 돌았습니다' end
union all select 3, '③ anon 이 그 보기를 읽을 수 있나',
       (select n from g)::text, '1',
       case when (select n from g) = 1 then '✅' else '❌ GRANT 가 없습니다 — 화면이 영원히 0곳으로 보입니다' end
union all select 4, '④ anon 이 course 표를 직접 읽나 (읽으면 안 됩니다)',
       (select n from gt)::text, '0',
       case when (select n from gt) = 0 then '✅' else '❌ 표가 열려 있습니다 — pre-apply 를 안 돌리셨습니다' end
union all select 5, '⑤ 보기가 내는 칸 열 개',
       (select n from c)::text, '10',
       case when (select n from c) = 10 then '✅' else '❌ 0081 이 안 돌았습니다 (photo 칸)' end
union all select 6, '⑥ 운영자 문 셋 (save · move · link)',
       (select n from d)::text, '3',
       case when (select n from d) = 3 then '✅' else '❌ 문이 모자랍니다' end
union all select 7, '⑦ 티타임 보기의 사진 칸 (0081)',
       (select n from tee)::text, '1',
       case when (select n from tee) = 1 then '✅' else '❌ 0081 이 안 돌았습니다' end
union all select 8, '⑧ 지금 등록된 골프장',
       (select n from rows)::text || ' 곳', '0 곳이어도 정상',
       case when (select n from rows) = 0
            then '✅ 길은 뚫렸습니다 — 자료는 아직 0줄입니다 (지어내지 않습니다)'
            else '✅ ' || (select n from rows)::text || ' 곳이 화면에 나갑니다' end
order by 1;
