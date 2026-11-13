-- ════════════════════════════════════════════════════════════════════
-- check-evt — 읽기 전용. **0단계**에서 한 번 돌리고 결과만 보내 주세요.
--
-- survey 가 못 본 것 다섯만 묻습니다 (쓰기 구문 0개 · CSV 로 내려받기).
--   ① 이벤트 트리거  — survey 는 `pg_trigger`(표 트리거)만 봤습니다.
--      `rls_auto_enable` 이 여기 걸려 있으면 **표를 만들 때마다** 돕니다.
--   ② 그 함수가 실제로 무엇을 하는지 (정의 · security · 실행 권한 · 임자)
--   ③ 기존 16개 표의 정책이 **어느 역할에** 걸려 있는지 (survey 는 역할을
--      안 냈습니다 — `{}` 면 PUBLIC 이고 anon 까지 포함입니다)
--   ④ 설치된 확장과 그 스키마 (0063 이 pgcrypto 를 씁니다)
--   ⑤ realtime publication 이 "모든 표" 인지 (그러면 새 표 59개가 같이 들어갑니다)
--
-- ⚠️ 저는 임시 Postgres 에서 ①을 **두 가지로 흉내 내** 눌러 보았습니다 —
--   (가) 새 표마다 RLS 를 켜는 경우 (나) force RLS 까지 켜는 경우.
--   둘 다 마이그레이션 81개가 **전부 통과**하고 권한도 똑같았습니다.
--   그래도 실제 정의는 이 조회로 **확인**하고 올리는 것이 맞습니다.
-- ════════════════════════════════════════════════════════════════════
select 구분, 이름, 값1, 값2 from (
  select 1 순, '① 이벤트 트리거' 구분, e.evtname 이름,
         e.evtevent || ' · ' || array_to_string(coalesce(e.evttags, array['(모든 명령)']), ',') 값1,
         pg_get_userbyid(e.evtowner) || ' · ' ||
         case e.evtenabled when 'O' then '켜짐' when 'D' then '꺼짐'
              when 'R' then 'replica' else 'always' end || ' → ' ||
         (select p.proname from pg_proc p where p.oid = e.evtfoid) 값2
    from pg_event_trigger e
  union all
  select 1, '① 이벤트 트리거', '(없습니다)', '', ''
   where not exists (select 1 from pg_event_trigger)
  union all
  select 2, '② rls_auto_enable', 'security / 임자 / 실행권한',
         case when p.prosecdef then 'security definer' else 'security invoker' end ||
         ' · ' || pg_get_userbyid(p.proowner) ||
         ' · anon=' || has_function_privilege('anon', p.oid, 'execute') ||
         ' 회원=' || has_function_privilege('authenticated', p.oid, 'execute'),
         coalesce(array_to_string(p.proconfig, ' '), '(search_path 를 안 적었습니다)')
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  union all
  select 3, '② rls_auto_enable 정의', 'pg_get_functiondef',
         replace(replace(pg_get_functiondef(p.oid), chr(10), ' ⏎ '), chr(9), ' '), ''
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  union all
  select 4, '③ 정책이 걸린 역할', c.relname || ' · ' || p.polname,
         case when p.polroles = '{0}'::oid[] then 'PUBLIC (anon 포함)'
              else (select string_agg(coalesce(r.rolname, '(oid ' || ro || ')'), ', ')
                      from unnest(p.polroles) ro left join pg_roles r on r.oid = ro) end,
         p.polcmd::text
    from pg_policy p join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
  union all
  select 5, '④ 설치된 확장', e.extname,
         coalesce(n.nspname, '(스키마 없음)'), e.extversion
    from pg_extension e left join pg_namespace n on n.oid = e.extnamespace
  union all
  select 6, '⑤ publication', p.pubname,
         case when p.puballtables then '모든 표 (새 표도 저절로 들어갑니다)'
              else '고른 표만' end,
         (select count(*)::text || '개 표' from pg_publication_rel r where r.prpubid = p.oid)
    from pg_publication p
  union all
  select 6, '⑤ publication', '(없습니다)', '', ''
   where not exists (select 1 from pg_publication)
) x order by x.순, x.이름, x.값1;
