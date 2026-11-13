-- ════════════════════════════════════════════════════════════════════
-- db/survey.sql — **이미 들어 있는 DB 를 있는 그대로 조사합니다**
--                  (2판 · 2026-11-13)
--
-- ⚠️⚠️⚠️ **조회만 합니다.** 표를 지우지도 · 덮어쓰지도 · 마이그레이션을
--   돌리지도 않습니다. insert · update · delete · drop · alter ·
--   create · grant · revoke 가 한 줄도 없습니다.
--
-- ⚠️⚠️⚠️ **개인정보를 한 글자도 안 냅니다.** 줄의 **내용**을 읽는 자리가
--   없습니다 — 내는 것은 이름 · 자료형 · 줄 수 · 권한 · 정의문뿐이고
--   성함 · 연락처 · 메일 · 글 내용 · UID 는 나오지 않습니다.
--
-- ⚠️⚠️ **「schema_version 이 없다」만으로 「하나도 안 올라갔다」고 단정하지
--   않습니다.** 그 표는 0002 가 만듭니다 — 0001 만 돌리고 멈췄거나, 손으로
--   일부만 돌렸거나, 그 표만 지웠을 수도 있습니다. 그래서 ⑥⑦⑧ 이
--   **표 · 보기 · 함수 · 타입이 실제로 있는지**를 따로 셉니다.
--
-- 쓰는 법: Supabase → SQL Editor 에 통째로 붙여 넣고 Run.
--   결과가 열한 묶음으로 나옵니다.
-- ════════════════════════════════════════════════════════════════════

-- ① 지금 연 DB ───────────────────────────────────────────────────
-- ⚠️ 프로젝트 ref 는 SQL 로 알 수 없습니다 — **주소창**과
--   Project Settings → General → Reference ID 에 있습니다.
select '① 지금 연 DB' as 항목,
       current_database() || ' / ' || current_user as 값,
       (select count(*)::text from pg_namespace
         where nspname not in ('information_schema')
           and nspname not like 'pg_%') || '개 스키마' as 참고;

-- ② 스키마 목록 ──────────────────────────────────────────────────
-- ⚠️ public 말고 다른 스키마에 숨어 있을 수 있습니다.
select '② 스키마' as 구분, n.nspname as 이름,
       (select count(*) from pg_class c
         where c.relnamespace = n.oid and c.relkind = 'r') as 표수,
       (select count(*) from pg_class c
         where c.relnamespace = n.oid and c.relkind = 'v') as 보기수,
       (select count(*) from pg_proc p where p.pronamespace = n.oid) as 함수수
  from pg_namespace n
 where n.nspname not like 'pg\_%' and n.nspname <> 'information_schema'
 order by n.nspname;

-- ③ public 의 표 — 이름 · 줄 수 · RLS · 정책 수 ───────────────────
-- ⚠️ 줄 수는 **세어서** 냅니다(어림값이 아닙니다). 줄의 내용은 안 봅니다.
select '③ 표' as 구분,
       c.relname as 표이름,
       (xpath('/row/cnt/text()',
         query_to_xml(format('select count(*) as cnt from public.%I', c.relname),
                      false, true, '')))[1]::text::bigint as 줄수,
       c.relrowsecurity as RLS켜짐,
       c.relforcerowsecurity as 임자에게도RLS,
       (select count(*) from pg_policy p where p.polrelid = c.oid) as 정책수
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r'
 order by c.relname;

-- ④ 그 표들의 칸 — 이름 · 자료형 · 비울 수 있나 ───────────────────
select '④ 칸' as 구분, c.table_name as 표이름, c.ordinal_position as 차례,
       c.column_name as 칸이름, c.data_type as 자료형,
       c.udt_name as 세부형, c.is_nullable as 비울수있나
  from information_schema.columns c
  join information_schema.tables t
    on t.table_schema = c.table_schema and t.table_name = c.table_name
 where c.table_schema = 'public' and t.table_type = 'BASE TABLE'
 order by c.table_name, c.ordinal_position;

-- ⑤ 권한 · 정책 ─────────────────────────────────────────────────
-- ⚠️⚠️ RLS 는 **줄은 막아도 칸은 못 막습니다** — 표가 열려 있으면
--   정책이 좁혀 주더라도 「안 준 칸」은 못 가립니다.
select '⑤ 표 권한' as 구분, c.relname as 표이름,
       has_table_privilege('anon', c.oid, 'SELECT')          as anon읽기,
       has_table_privilege('anon', c.oid, 'INSERT')          as anon넣기,
       has_table_privilege('anon', c.oid, 'UPDATE')          as anon고치기,
       has_table_privilege('authenticated', c.oid, 'SELECT') as 회원읽기,
       has_table_privilege('authenticated', c.oid, 'INSERT') as 회원넣기,
       has_table_privilege('authenticated', c.oid, 'UPDATE') as 회원고치기
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r'
 order by c.relname;

select '⑤ 정책' as 구분, c.relname as 표이름, p.polname as 정책이름,
       p.polcmd as 무엇에,
       pg_get_expr(p.polqual, p.polrelid)      as 읽는조건,
       pg_get_expr(p.polwithcheck, p.polrelid) as 쓰는조건
  from pg_policy p
  join pg_class c on c.oid = p.polrelid
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public'
 order by c.relname, p.polname;

-- ⑤-3 **기본 권한(pg_default_acl)** — 앞으로 만들 객체에 미리 걸린 권한 ──
-- ⚠️⚠️⚠️ **「지금 표에 걸린 권한」과 「앞으로 만들 객체에 저절로 붙는
--   권한」은 다릅니다.**
--   · `grant select on all tables in schema public to anon` 은 **그때
--     있던 표에만** 걸립니다 → ⑤ 에서 보입니다.
--   · `alter default privileges in schema public grant select on tables
--     to anon` 은 **앞으로 만드는 표에 저절로** 붙습니다 → 여기서만
--     보입니다.
--   뒤가 걸려 있으면 우리 표 59개가 만들어지는 **그 순간** anon 에게
--   열립니다. 우리 SQL 은 표마다 `revoke all` 을 먼저 거는 자리가
--   있지만 **모든 표가 그렇지는 않습니다** — 그래서 미리 봐야 합니다.
-- ⚠️ `defaclobjtype` : r=표 · v=보기 · S=시퀀스 · f=함수 · T=타입
select '⑤ 기본권한' as 구분,
       coalesce(n.nspname, '(스키마 전체)') as 스키마,
       pg_get_userbyid(d.defaclrole) as 누가만들때,
       case d.defaclobjtype when 'r' then '표' when 'v' then '보기'
            when 'S' then '시퀀스' when 'f' then '함수'
            when 'T' then '타입' else d.defaclobjtype::text end as 무엇에,
       d.defaclacl::text as 붙는권한
  from pg_default_acl d
  left join pg_namespace n on n.oid = d.defaclnamespace
 order by 스키마, 누가만들때, 무엇에;

-- ⑤-4 **스키마 자체의 권한** ────────────────────────────────────
-- ⚠️ anon · 회원이 public 스키마에 CREATE 를 가지고 있으면 그 자체가
--   구멍입니다(Postgres 15 부터는 기본이 꺼져 있습니다).
select '⑤ 스키마 권한' as 구분, n.nspname as 스키마,
       has_schema_privilege('anon', n.oid, 'USAGE')          as anon사용,
       has_schema_privilege('anon', n.oid, 'CREATE')         as anon만들기,
       has_schema_privilege('authenticated', n.oid, 'USAGE')  as 회원사용,
       has_schema_privilege('authenticated', n.oid, 'CREATE') as 회원만들기,
       n.nspacl::text as 권한원문
  from pg_namespace n
 where n.nspname in ('public', 'auth', 'storage')
 order by n.nspname;

-- ⑥ 보기(view) ──────────────────────────────────────────────────
select '⑥ 보기' as 구분, viewname as 이름, viewowner as 임자
  from pg_views where schemaname = 'public' order by viewname;

-- ⑦ 함수 ────────────────────────────────────────────────────────
-- ⚠️ 본문은 안 냅니다(길고, 남의 코드입니다) — 이름 · 인자 · 보안속성만.
select '⑦ 함수' as 구분, p.proname as 이름,
       pg_get_function_identity_arguments(p.oid) as 인자,
       p.prosecdef as security_definer,
       has_function_privilege('anon', p.oid, 'EXECUTE')          as anon실행,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as 회원실행
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
 order by p.proname;

-- ⑧ 타입(enum 등) ───────────────────────────────────────────────
select '⑧ 타입' as 구분, t.typname as 이름, t.typtype as 갈래,
       (select count(*) from pg_enum e where e.enumtypid = t.oid) as 값개수
  from pg_type t join pg_namespace n on n.oid = t.typnamespace
 where n.nspname = 'public' and t.typtype in ('e','c','d')
   and not exists (select 1 from pg_class c
                    where c.oid = t.typrelid and c.relkind in ('r','v','m'))
 order by t.typname;

-- ⑨ **auth 스키마의 트리거** ────────────────────────────────────
-- ⚠️⚠️⚠️ **여기가 가장 위험한 자리입니다.** 우리 0005 는
--   auth.users 에 「on_auth_user_created」 트리거를 걸고, 그 전에
--   「drop trigger if exists on_auth_user_created on auth.users」 를
--   돌립니다. 기존 앱이 **같은 이름**을 쓰고 있으면 그 줄이 남의
--   가입 처리를 **떼어 냅니다.** 이름이 달라도, 가입할 때 두 트리거가
--   같이 돌면 서로를 방해할 수 있습니다.
select '⑨ auth 트리거' as 구분, c.relname as 표, t.tgname as 트리거,
       p.proname as 부르는함수, t.tgenabled as 켜짐
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  join pg_proc p on p.oid = t.tgfoid
 where n.nspname = 'auth' and not t.tgisinternal
 order by c.relname, t.tgname;

-- ⑨-2 public 의 트리거도 같이 ───────────────────────────────────
select '⑨ public 트리거' as 구분, c.relname as 표, t.tgname as 트리거,
       p.proname as 부르는함수, t.tgenabled as 켜짐
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  join pg_proc p on p.oid = t.tgfoid
 where n.nspname = 'public' and not t.tgisinternal
 order by c.relname, t.tgname;

-- ⑩ 계정 · 로그인 수단 — **수만** 냅니다 ─────────────────────────
-- ⚠️⚠️ 메일 · 성함 · UID 를 한 줄도 안 냅니다.
select '⑩ 계정' as 구분,
       (select count(*) from auth.users)                                as 전체,
       (select count(*) from auth.users where deleted_at is null)       as 살아있음,
       (select count(*) from auth.users where last_sign_in_at is not null) as 로그인한적있음,
       (select count(*) from auth.identities)                           as 연결수단줄수;

-- ⑩-2 어떤 로그인 수단을 쓰고 있나 (갈래와 **수만**) ─────────────
-- ⚠️ 카카오 · 구글을 이미 쓰고 계신지가 여기서 보입니다.
select '⑩ 로그인 수단' as 구분, provider as 갈래, count(*) as 사람수
  from auth.identities group by provider order by provider;

-- ⑪ 우리 구조와 **이름이 겹치는 것** ────────────────────────────
-- ⚠️⚠️⚠️ 겹치는 것이 하나라도 있으면 **그대로 올리면 안 됩니다.**
--   같은 이름의 표가 있으면 create table 이 멈추고, 같은 이름의
--   함수 · 보기가 있으면 create or replace 가 **남의 것을 덮어씁니다.**
--   ⚠️ 겹침이 0건이어도 「안전하다」는 뜻은 아닙니다 — ⑨ 의 auth
--   트리거와 ⑤ 의 권한을 같이 보셔야 합니다.
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
    ('함수','deal_money_guard'), ('함수','is_my_request'),
    ('함수','account_role_guard'), ('함수','account_biz_hat'),
    ('함수','notify_one'), ('함수','make_request'), ('함수','make_apply')
)
select '⑪ 이름 겹침' as 구분, o.kind as 갈래, o.nm as 이름,
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

-- ⑪-2 우리 마이그레이션이 **일부라도** 돌았나 ──────────────────
-- ⚠️⚠️ schema_version 이 없어도 이 셋 중 하나라도 있으면 **일부가 이미
--   돌았다**는 뜻입니다. 셋 다 0이어야 「한 번도 안 돌았다」입니다.
select '⑪ 일부 적용 흔적' as 구분,
       (select count(*) from information_schema.tables
         where table_schema = 'public'
           and table_name in ('account','provider','request','deal',
                              'assignment','audit_log','settlement',
                              'fee_policy','offer'))          as 우리표0001개수,
       (select count(*) from pg_type ty join pg_namespace ns on ns.oid = ty.typnamespace
         where ns.nspname = 'public'
           and ty.typname in ('app_role','deal_state','fee_type','fee_vat',
                              'fee_when','fee_cycle','offer_status')) as 우리타입개수,
       (select count(*) from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
         where ns.nspname = 'public'
           and p.proname in ('my_role','my_provider','handle_new_user',
                             'provider_guard','deal_money_guard'))    as 우리함수개수;
