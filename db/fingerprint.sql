-- ════════════════════════════════════════════════════════════════════
-- fingerprint — 기존 16개 표의 「지문」 (읽기 전용 · 몇 번 돌려도 DB 가 안 바뀝니다)
--
-- ⚠️⚠️ 이 파일은 백업이 아닙니다. 백업이 **제대로 됐는지 · 적용 뒤에도
--   그대로인지**를 견주는 잣대입니다. 세 번 돌립니다 —
--     ① 적용 **전**     → 결과를 통째로 복사해 두십니다(CSV 내려받기)
--     ② 백업을 새 프로젝트에 **복원해 본 뒤** 그 프로젝트에서 → ①과 같아야
--        「백업이 확보됐다」 입니다 (백업 메뉴의 시각만으로는 모릅니다)
--     ③ 적용 **뒤**(post-apply 다음) 운영에서 → ①과 같아야
--        「기존 16개를 안 건드렸다」 입니다
--
-- ⚠️ 줄 수 · 내용 md5 · RLS · 정책 · 표 권한(ACL) 을 냅니다.
--   md5 는 표 내용을 id 차례로 이어 센 값이라 **한 글자만 바뀌어도** 다릅니다.
--   ⚠️ 사람 정보(이메일 · 전화)는 결과에 **한 글자도 안 나옵니다** — 해시와
--   줄 수뿐입니다.
--
-- ⚠️⚠️ 「service_role 미리 있음」 칸 — 0001_init 의
--   `grant all on all tables in schema public to service_role` 이 이 묶음에서
--   **기존 표에 닿는 유일한 줄**입니다. 그 칸이 16개 전부 true 면 그 줄은
--   아무것도 안 바꿉니다(Supabase 기본값이 이미 줍니다). false 가 하나라도
--   있으면 **적용 전에 멈추고** 알려 주세요 — 그 표에만 service_role 권한이
--   새로 붙습니다(RLS 를 지나는 서버 키의 권한입니다).
--
--   돌리는 곳  Supabase → SQL Editor → New query → 붙여넣고 Run
-- ════════════════════════════════════════════════════════════════════
with names(nm) as (
  select unnest(array[
    'business_members','businesses','closure_requests','community_comments',
    'community_posts','consult_requests','jobs','listings','members','orders',
    'partner_requests','products','purchase_requests','subsidy_requests',
    'suppliers','supply_requests'])
),
t as (
  select nm, c.oid
    from names left join pg_class c
      on c.relname = nm and c.relkind = 'r'
     and c.relnamespace = 'public'::regnamespace
)
select t.nm                                                     as "표",
       case when t.oid is null then '❌ 없음' else '있음' end   as "있나",
       (xpath('/row/c/text()', query_to_xml(
          format('select count(*) c from public.%I', t.nm), false, true, '')))[1]::text
                                                               as "줄 수",
       (xpath('/row/m/text()', query_to_xml(
          format('select md5(coalesce(string_agg(x::text, ''|'' order by x::text), '''')) m from public.%I x', t.nm),
          false, true, '')))[1]::text                          as "내용 md5",
       c.relrowsecurity                                         as "RLS",
       (select count(*) from pg_policy p where p.polrelid = t.oid) as "정책 수",
       md5(coalesce((select string_agg(polname::text || ':' || polcmd::text || ':' ||
              coalesce(pg_get_expr(polqual, polrelid), '') || ':' ||
              coalesce(pg_get_expr(polwithcheck, polrelid), ''), ',' order by polname)
              from pg_policy where polrelid = t.oid), ''))      as "정책 md5",
       coalesce(array_to_string(c.relacl, ' '), '(기본)')       as "표 권한",
       has_table_privilege('service_role', t.oid, 'select,insert,update,delete')
                                                               as "service_role 미리 있음"
  from t left join pg_class c on c.oid = t.oid
 where t.oid is not null
union all
select '(16개 가운데 없는 표)', string_agg(nm, ', '), null, null, null, null, null, null, null
  from t where oid is null having count(*) > 0
order by 1;
