-- ════════════════════════════════════════════════════════════════════
-- db/survey.sql — **이미 들어 있는 DB 를 있는 그대로 조사합니다**
--
-- ⚠️⚠️⚠️ **조회만 합니다.** insert · update · delete · drop · alter ·
--   create · grant · revoke 가 한 줄도 없습니다. 표를 지우지도 ·
--   덮어쓰지도 · 마이그레이션을 돌리지도 않습니다.
--
-- ⚠️⚠️⚠️ **개인정보를 한 글자도 안 냅니다.** 줄의 **내용**을 읽는
--   자리가 없습니다 — 내는 것은 표 이름 · 칸 이름 · 자료형 · 줄 수 ·
--   권한 이름뿐입니다. 성함 · 연락처 · 메일 · 글 내용은 나오지
--   않습니다.
--
-- 쓰는 법: Supabase → SQL Editor 에 통째로 붙여 넣고 Run.
--   결과가 여섯 묶음으로 나옵니다.
-- ════════════════════════════════════════════════════════════════════

-- ① 지금 연 프로젝트가 맞는가 ────────────────────────────────────
-- ⚠️ 프로젝트 ref(igignylgzjphtnyxhhsd 같은 글자)는 SQL 로는 알 수
--   없습니다 — **주소창**과 Project Settings 에 있습니다. 여기서는
--   「같은 DB 를 두 번 열지 않았는지」 가릴 수 있는 값만 냅니다.
select '① 지금 연 DB' as 항목,
       current_database() || ' / ' || current_user as 값,
       (select count(*)::text from pg_namespace
         where nspname not like 'pg_%' and nspname <> 'information_schema')
         || '개 스키마' as 참고;

-- ② public 스키마의 표 — 이름 · 줄 수 · RLS · 정책 수 ─────────────
-- ⚠️ 줄 수는 **세어서** 냅니다(어림값이 아닙니다). 줄의 내용은 안 봅니다.
select '② 표' as 구분,
       c.relname as 표이름,
       (xpath('/row/cnt/text()',
         query_to_xml(format('select count(*) as cnt from public.%I', c.relname),
                      false, true, '')))[1]::text::bigint as 줄수,
       c.relrowsecurity as RLS켜짐,
       (select count(*) from pg_policy p where p.polrelid = c.oid) as 정책수
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r'
 order by c.relname;

-- ③ 그 표들의 칸 — 이름 · 자료형 · 비울 수 있나 ───────────────────
-- ⚠️ **값을 안 읽습니다.** 칸 이름과 자료형만 냅니다.
select '③ 칸' as 구분,
       c.table_name as 표이름,
       c.ordinal_position as 차례,
       c.column_name as 칸이름,
       c.data_type as 자료형,
       c.is_nullable as 비울수있나
  from information_schema.columns c
  join information_schema.tables t
    on t.table_schema = c.table_schema and t.table_name = c.table_name
 where c.table_schema = 'public' and t.table_type = 'BASE TABLE'
 order by c.table_name, c.ordinal_position;

-- ④ 비로그인(anon) · 로그인(authenticated) 에게 열린 표 ────────────
-- ⚠️⚠️ RLS 는 **줄은 막아도 칸은 못 막습니다** — 표가 열려 있으면
--   정책이 좁혀 주더라도 「안 준 칸」은 못 가립니다.
select '④ 권한' as 구분,
       c.relname as 표이름,
       has_table_privilege('anon', c.oid, 'SELECT')          as anon읽기,
       has_table_privilege('anon', c.oid, 'INSERT')          as anon쓰기,
       has_table_privilege('authenticated', c.oid, 'SELECT') as 회원읽기,
       has_table_privilege('authenticated', c.oid, 'INSERT') as 회원쓰기
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r'
 order by c.relname;

-- ⑤ 계정이 몇 개인가 ─────────────────────────────────────────────
-- ⚠️⚠️ **수만 냅니다** — 메일 · 성함 · UID 를 한 줄도 안 냅니다.
select '⑤ 계정' as 구분,
       (select count(*) from auth.users)                            as 전체,
       (select count(*) from auth.users where deleted_at is null)   as 살아있음,
       (select count(*) from auth.users where last_sign_in_at is not null) as 로그인한적있음,
       (select count(*) from auth.identities)                       as 연결된로그인수단;

-- ⑥ 우리 구조와 **이름이 겹치는 것**이 있나 ───────────────────────
-- ⚠️⚠️⚠️ 겹치는 것이 하나라도 있으면 **그대로 올리면 안 됩니다** —
--   같은 이름의 표 · 타입 · 함수가 있으면 마이그레이션이 그 자리에서
--   멈추거나(create table) 남의 것을 덮어씁니다(create or replace).
--   결과가 「(없음)」이어야 「더하기만 하는」 적용이 됩니다.
with ours(kind, nm) as (values
    ('표','account'), ('표','account_hat'), ('표','ad_bill'), ('표','ad_run'),
    ('표','ad_stat'), ('표','appointment'), ('표','assignment'),
    ('표','audit_log'), ('표','ca'), ('표','course'), ('표','course_alias'),
    ('표','course_source'), ('표','cq'), ('표','cqguest_hit'),
    ('표','cqphoto'), ('표','cqpw_try'), ('표','cqview'), ('표','deal'),
    ('표','deal_move'), ('표','fee_policy'), ('표','import_batch'),
    ('표','import_row_issue'), ('표','inquiry'), ('표','jobapply'),
    ('표','jobfav'), ('표','jobpost'), ('표','joinapply'), ('표','joinroom'),
    ('표','listing'), ('표','listingask'), ('표','listingfav'),
    ('표','listingphoto'), ('표','membership_plan'), ('표','notice'),
    ('표','offer'), ('표','provider'), ('표','provider_apply'),
    ('표','provider_contact'), ('표','provider_invite'),
    ('표','provider_membership'), ('표','provider_photo'),
    ('표','provider_price'), ('표','quote'), ('표','report'),
    ('표','request'), ('표','request_item'), ('표','request_photo'),
    ('표','review'), ('표','schema_version'), ('표','settlement'),
    ('표','teebook'), ('표','teetime'), ('표','trip'), ('표','tripdate'),
    ('표','tripphoto'), ('표','user_state'), ('표','wanted'),
    ('표','wantedreply'), ('표','watch'),
    ('타입','deal_state'), ('타입','app_role'), ('타입','fee_type'),
    ('타입','fee_vat'), ('타입','fee_when'), ('타입','fee_cycle'),
    ('타입','offer_status'), ('타입','ad_place'), ('타입','ad_state'),
    ('함수','my_role'), ('함수','my_provider'), ('함수','kst_today'),
    ('함수','handle_new_user'), ('함수','provider_guard'),
    ('함수','deal_money_guard'), ('함수','is_my_request')
)
select '⑥ 이름 겹침' as 구분, o.kind as 갈래, o.nm as 이름,
       '❌ 이미 있습니다' as 결과
  from ours o
 where (o.kind = '표' and exists (
          select 1 from information_schema.tables t
           where t.table_schema = 'public' and t.table_name = o.nm))
    or (o.kind = '타입' and exists (
          select 1 from pg_type ty join pg_namespace ns on ns.oid = ty.typnamespace
           where ns.nspname = 'public' and ty.typname = o.nm))
    or (o.kind = '함수' and exists (
          select 1 from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
           where ns.nspname = 'public' and p.proname = o.nm))
 order by o.kind, o.nm;
