-- ════════════════════════════════════════════════════════════════════
--  db/survey.sql — 운영 DB 를 있는 그대로 조사합니다  (3판 · 2026-11-13)
--
--  ⚠️⚠️⚠️ 조회만 합니다. 표를 지우지도 · 덮어쓰지도 · 마이그레이션을
--    돌리지도 않습니다. insert · update · delete · drop · alter ·
--    create · grant · revoke 가 한 줄도 없습니다.
--
--  ⚠️⚠️⚠️ 개인정보를 한 글자도 안 냅니다. 내는 것은 이름 · 자료형 ·
--    줄 수 · 권한 · 정의문뿐이고, 성함 · 연락처 · 메일 · 글 내용 ·
--    UID 는 나오지 않습니다.
--
--  ⚠️⚠️⚠️ 3판에서 가장 크게 바뀐 것 — **결과가 한 표로 나옵니다.**
--    2판은 SELECT 가 열한 개였고, Supabase SQL Editor 는 여러 문장을
--    돌리면 **맨 끝 결과만** 보여 줍니다. 그래서 열 묶음이 조용히
--    사라졌습니다. 지금은 union all 로 묶은 **문장 하나**이고, 묶음은
--    「구분」 칸으로 갈립니다.
--
--  ⚠️⚠️ 「schema_version 이 없다」만으로 「하나도 안 올라갔다」고 단정하지
--    않습니다. 그 표는 0002 가 만듭니다 — 0001 만 돌리고 멈췄거나, 손으로
--    일부만 돌렸거나, 그 표만 지웠을 수도 있습니다. 그래서 ③~⑨ 가
--    표 · 보기 · 함수 · 타입 · 트리거가 **실제로 있는지**를 따로 셉니다.
--
--  ⚠️ 없을 수도 있는 표(schema_version · auth.users · storage.buckets)는
--    query_to_xml 로 **그때 만들어 돌립니다** — 없는 표를 union 가지에
--    그냥 적으면 그 표가 없는 DB 에서 질의가 통째로 거절됩니다.
--
--  쓰는 법: Supabase → SQL Editor 에 통째로 붙여 넣고 Run.
--           결과가 한 표로 나오니 전부 복사해서 주시면 됩니다.
-- ════════════════════════════════════════════════════════════════════

with
tb as (select c.oid, c.relname, c.relrowsecurity
         from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'r'),
vw as (select c.oid, c.relname
         from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'v'),
fn as (select p.oid, p.proname, p.prosecdef, p.proacl
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'),
-- ⚠️⚠️ 역할을 **이름이 아니라 oid** 로 넘깁니다. 이름을 넘기면 그 역할이
--   없는 DB 에서 「role anon does not exist」로 질의가 통째로 터집니다.
--   oid 는 없으면 null 이고, 권한 함수도 null 을 돌려줍니다 — 그래서
--   아래에서 「(역할 없음)」으로 적습니다.
rl as (select (select oid from pg_roles where rolname = 'anon')          as anon,
              (select oid from pg_roles where rolname = 'authenticated') as auth)

select 구분, 이름, 값1, 값2, 값3 from (

  -- ① 지금 연 DB ──────────────────────────────────────────────────
  -- ⚠️ 프로젝트 ref 는 SQL 로 알 수 없습니다 — 주소창과
  --   Project Settings → General → Reference ID 에 있습니다.
  select 1 as 순, '① 환경' as 구분, current_database() as 이름,
         current_user as 값1,
         to_char(now() at time zone 'Asia/Seoul', 'YYYY-MM-DD HH24:MI')
           || ' (KST)' as 값2,
         split_part(version(), ' ', 2)
           || case when (select count(*) from pg_roles
                          where rolname in ('anon','authenticated')) = 2
                   then '' else '  ⚠️ anon/authenticated 역할이 없습니다'
              end as 값3

  -- ② 스키마 — public 말고 다른 곳에 숨어 있을 수 있습니다 ─────────
  union all
  select 2, '② 스키마', n.nspname,
         (select count(*) from pg_class c
           where c.relnamespace = n.oid and c.relkind = 'r')::text || '표',
         (select count(*) from pg_class c
           where c.relnamespace = n.oid and c.relkind = 'v')::text || '보기',
         (select count(*) from pg_proc p
           where p.pronamespace = n.oid)::text || '함수'
    from pg_namespace n
   where n.nspname not like 'pg\_%' and n.nspname <> 'information_schema'

  -- ③ 표 — 줄 수 · RLS · 정책 수 · 읽기 권한 ─────────────────────
  -- ⚠️ 줄 수는 세어서 냅니다(어림값이 아닙니다). 줄의 내용은 안 봅니다.
  -- ⚠️⚠️ RLS 는 줄은 막아도 칸은 못 막습니다 — 표가 열려 있으면
  --   정책이 좁혀 주더라도 「안 준 칸」은 가려지지 않습니다.
  union all
  select 3, '③ 표', t.relname,
         (xpath('/row/c/text()', query_to_xml(
            format('select count(*) as c from public.%I', t.relname),
            false, true, '')))[1]::text || '줄',
         case when t.relrowsecurity then 'RLS 켜짐' else 'RLS 꺼짐' end
           || ' · 정책 '
           || (select count(*) from pg_policy p where p.polrelid = t.oid)::text
           || '개',
         'anon읽기=' || coalesce(has_table_privilege(rl.anon, t.oid, 'SELECT')::text, '?')
           || ' 회원읽기=' || coalesce(has_table_privilege(rl.auth, t.oid, 'SELECT')::text, '?')
           || ' anon쓰기=' || coalesce(has_table_privilege(rl.anon, t.oid, 'INSERT')::text, '?')
           || ' 회원쓰기=' || coalesce(has_table_privilege(rl.auth, t.oid, 'INSERT')::text, '?')
    from tb t, rl

  -- ④ 칸 — 표마다 한 줄로 모읍니다 (느낌표는 not null) ────────────
  union all
  select 4, '④ 칸', c.table_name,
         count(*)::text || '칸',
         string_agg(c.column_name || ' ' || c.udt_name
                    || case when c.is_nullable = 'NO' then '!' else '' end,
                    ', ' order by c.ordinal_position),
         ''
    from information_schema.columns c
    join information_schema.tables t2
      on t2.table_schema = c.table_schema and t2.table_name = c.table_name
   where c.table_schema = 'public' and t2.table_type = 'BASE TABLE'
   group by c.table_name

  -- ⑤ 정책 ────────────────────────────────────────────────────────
  union all
  select 5, '⑤ 정책', c.relname,
         p.polname,
         case p.polcmd when 'r' then 'select' when 'a' then 'insert'
              when 'w' then 'update' when 'd' then 'delete'
              else '전부' end,
         -- ⚠️ 정책 식에는 줄바꿈이 들어 있습니다 — 그대로 내면 한 줄이
         --   여러 줄로 흐트러져 복사한 결과를 읽을 수가 없습니다.
         'where ' || coalesce(left(regexp_replace(
              pg_get_expr(p.polqual, p.polrelid), '\s+', ' ', 'g'), 110), '-')
           || ' / check ' || coalesce(left(regexp_replace(
              pg_get_expr(p.polwithcheck, p.polrelid), '\s+', ' ', 'g'), 110), '-')
    from pg_policy p
    join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'

  -- ⑥ 보기 — 공개로 나가는 길입니다 ──────────────────────────────
  -- ⚠️⚠️ 보기는 RLS 를 지나지 않습니다(임자 권한으로 돕니다). 그래서
  --   보기의 where 절이 자물쇠 그 자체입니다.
  union all
  select 6, '⑥ 보기', v.relname,
         'anon읽기=' || coalesce(has_table_privilege(rl.anon, v.oid, 'SELECT')::text, '?'),
         '회원읽기=' || coalesce(has_table_privilege(rl.auth, v.oid, 'SELECT')::text, '?'),
         ''
    from vw v, rl

  -- ⑦ 함수 — ⚠️⚠️ 함수는 표와 반대로 만드는 순간 public 에게 ────
  --   EXECUTE 가 붙습니다. proacl 이 비어 있으면(기본) 로그인한 누구나
  --   부를 수 있다는 뜻입니다 — revoke 를 걸었는지 여기서 봅니다.
  union all
  select 7, '⑦ 함수', f.proname,
         case when f.prosecdef then 'security definer' else 'invoker' end,
         'anon실행=' || coalesce(has_function_privilege(rl.anon, f.oid, 'EXECUTE')::text, '?')
           || ' 회원실행=' || coalesce(has_function_privilege(rl.auth, f.oid, 'EXECUTE')::text, '?'),
         coalesce(f.proacl::text, '(기본 — public 에게 실행이 열려 있습니다)')
    from fn f, rl

  -- ⑧ 타입(enum) — 화면의 상태 말과 맞춰 봅니다 ──────────────────
  union all
  select 8, '⑧ 타입', t.typname,
         count(*)::text || '개',
         string_agg(e.enumlabel, ', ' order by e.enumsortorder),
         ''
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    join pg_namespace n on n.oid = t.typnamespace
   where n.nspname = 'public'
   group by t.typname

  -- ⑨ 트리거 — public 과 auth 를 **갈라서** 봅니다 ────────────────
  -- ⚠️ 0005 가 auth.users 에 트리거를 답니다 — 거기가 비어 있으면
  --   가입은 되는데 account 줄이 안 생깁니다.
  union all
  select 9, '⑨ 트리거 public', c.relname, tg.tgname,
         case when tg.tgenabled = 'O' then '켜짐'
              else '꺼짐(' || tg.tgenabled::text || ')' end,
         ''
    from pg_trigger tg
    join pg_class c on c.oid = tg.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and not tg.tgisinternal

  union all
  select 10, '⑩ 트리거 auth', c.relname, tg.tgname,
         case when tg.tgenabled = 'O' then '켜짐'
              else '꺼짐(' || tg.tgenabled::text || ')' end,
         ''
    from pg_trigger tg
    join pg_class c on c.oid = tg.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'auth' and not tg.tgisinternal

  -- ⑪ 기본 권한 — ⚠️⚠️⚠️ 「지금 표에 걸린 권한」과 다릅니다. ──────
  --   alter default privileges 가 걸려 있으면, 우리 표가 만들어지는
  --   그 순간 anon 에게 저절로 열립니다.
  union all
  select 11, '⑪ 기본권한', coalesce(n.nspname, '(스키마 전체)'),
         pg_get_userbyid(d.defaclrole) || ' 가 만들 때',
         case d.defaclobjtype when 'r' then '표' when 'v' then '보기'
              when 'S' then '시퀀스' when 'f' then '함수'
              when 'T' then '타입' else d.defaclobjtype::text end,
         d.defaclacl::text
    from pg_default_acl d
    left join pg_namespace n on n.oid = d.defaclnamespace

  -- ⑫ 스키마 권한 — anon 이 CREATE 를 가지면 그 자체가 구멍입니다 ─
  union all
  select 12, '⑫ 스키마권한', n.nspname,
         'anon usage=' || coalesce(has_schema_privilege(rl.anon, n.oid, 'USAGE')::text, '?')
           || ' create=' || coalesce(has_schema_privilege(rl.anon, n.oid, 'CREATE')::text, '?'),
         '회원 usage=' || coalesce(has_schema_privilege(rl.auth, n.oid, 'USAGE')::text, '?')
           || ' create=' || coalesce(has_schema_privilege(rl.auth, n.oid, 'CREATE')::text, '?'),
         ''
    from pg_namespace n, rl
   where n.nspname in ('public', 'storage', 'auth')

  -- ⑬ 계정 — ⚠️ 수만 셉니다. 메일 · UID 는 한 글자도 안 냅니다 ────
  union all
  select 13, '⑬ 계정', 'auth.users',
         (xpath('/row/v/text()', query_to_xml(
            case when to_regclass('auth.users') is null
              then 'select ''(auth.users 가 없습니다)'' as v'
              else 'select count(*)::text || ''명'' as v from auth.users' end,
            false, true, '')))[1]::text,
         (xpath('/row/v/text()', query_to_xml(
            -- ⚠️ 표만 보지 않고 **칸이 있는지도** 봅니다 — GoTrue 판이
            --   바뀌어 칸 이름이 다르면 질의가 통째로 터집니다.
            case when to_regclass('auth.users') is null
                   or not exists (select 1 from information_schema.columns
                                   where table_schema = 'auth'
                                     and table_name = 'users'
                                     and column_name = 'last_sign_in_at')
              then 'select ''(로그인 기록 칸이 없습니다)'' as v'
              else 'select ''한 번이라도 로그인 '' || count(*)::text || ''명'' as v'
                   || ' from auth.users where last_sign_in_at is not null' end,
            false, true, '')))[1]::text,
         (xpath('/row/v/text()', query_to_xml(
            case when to_regclass('public.account') is null
              then 'select ''(account 표가 없습니다)'' as v'
              else 'select ''account '' || count(*)::text || ''줄'' as v'
                   || ' from public.account' end,
            false, true, '')))[1]::text

  -- ⑭ 적용된 판 — ⚠️ 표가 없다고 미적용으로 단정하지 않습니다 ─────
  union all
  select 14, '⑭ schema_version', '적용된 판 번호',
         (xpath('/row/v/text()', query_to_xml(
            case when to_regclass('public.schema_version') is null
              then 'select ''(표가 없습니다 — 그것만으로 미적용이라고 '
                   || '단정하지 않습니다. ③~⑨ 를 보세요)'' as v'
              else 'select coalesce(string_agg(n::text, '', '' order by n),'
                   || ' ''(빈 표)'') as v from public.schema_version' end,
            false, true, '')))[1]::text,
         (xpath('/row/v/text()', query_to_xml(
            case when to_regclass('public.schema_version') is null
              then 'select ''-'' as v'
              else 'select ''마지막 판 '' || coalesce(max(n)::text, ''(없음)'')'
                   || ' as v from public.schema_version' end,
            false, true, '')))[1]::text,
         ''

  -- ⑮ 저장소 버킷 — 손님 사진 · 증빙서류 · 업체 사진이 갈 자리 ────
  -- ⚠️⚠️ 비공개여야 하는 것(증빙서류)과 공개여야 하는 것(업체 사진 ·
  --   매물 사진)이 다릅니다 — 공개 버킷은 주소만 알면 누구나 엽니다.
  union all
  select 15, '⑮ 저장소 버킷', '목록',
         (xpath('/row/v/text()', query_to_xml(
            case when to_regclass('storage.buckets') is null
              then 'select ''(storage.buckets 가 없습니다)'' as v'
              else 'select coalesce(string_agg(name ||'
                   || ' case when public then '' (공개)'' else '' (비공개)'' end,'
                   || ' '', '' order by name), ''(버킷 0개)'') as v'
                   || ' from storage.buckets' end,
            false, true, '')))[1]::text,
         '', ''

) x
order by x.순, x.이름, x.값1;
