-- ════════════════════════════════════════════════════════════════════
--  verify.sql — 돌린 DB 가 저장소와 같은가  (한 번에 붙여 넣는 검사)
--
--  Supabase 대시보드 → SQL Editor 에 **이 파일을 통째로** 붙여 넣고
--  Run 하면 검사마다 한 줄씩, 맨 끝에 판정이 나옵니다.
--
--  ⚠️ 읽기만 합니다 — 표도 줄도 권한도 한 글자 안 건드립니다.
--     몇 번 돌려도 안전하고, 운영 중에 돌려도 됩니다.
--
--  ⚠️⚠️ 기대값은 전부 **저장소에서 센 값**입니다 (눈대중이 아닙니다) —
--     판 8 · 표 12 · 상태 13 · 역할 4 · 길 70 · 함수 19 · 트리거 3.
--     저장소를 고치면 이 파일도 같이 고치세요.
--
--  ⚠️⚠️ `tools/test-sql.js` 는 **가짜 auth 스키마**로 돌립니다
--     (db/test/00_stub_auth.sql). 그래서 **진짜 Supabase 에서만
--     드러나는 것**이 둘 있고, 아래 ⑧ ⑨ 가 그것을 봅니다 —
--     auth.users 트리거와 auth.uid() 입니다.
-- ════════════════════════════════════════════════════════════════════

with
/* ① 판 번호 — 일곱 줄이어야 합니다 (0001~0007) */
v_ver as (
  select count(*)::int n from schema_version
),
/* ② 표 — 열하나 전부 있어야 합니다 */
v_tab as (
  select count(*)::int n from information_schema.tables
   where table_schema = 'public'
     and table_name in ('account','assignment','audit_log','deal','deal_move',
                        'fee_policy','offer','provider','quote','request',
                        'schema_version','settlement')
),
/* ③ ⚠️⚠️ RLS 가 안 켜진 표 — 0 이어야 합니다.
      안 켜진 표는 누구나 남의 신청과 계약금액을 읽습니다. */
v_rls as (
  select count(*)::int n, coalesce(string_agg(t.tablename, ', '), '—') who
    from pg_tables t join pg_class c on c.relname = t.tablename
                                    and c.relnamespace = 'public'::regnamespace
   where t.schemaname = 'public' and c.relrowsecurity = false
),
/* ④ 신청 상태 — 열셋 (보류 hold 포함) */
v_st as (
  select count(*)::int n,
         bool_or(e.enumlabel = 'hold') has_hold
    from pg_enum e join pg_type t on t.oid = e.enumtypid
   where t.typname = 'deal_state'
),
/* ⑤ 역할 — 넷 */
v_role as (
  select count(*)::int n from pg_enum e join pg_type t on t.oid = e.enumtypid
   where t.typname = 'app_role'
),
/* ⑥ 갈 수 있는 길 — 일흔 줄 (0006 은 겹치는 줄이라 새 DB 에서 0 을 더합니다) */
v_move as (
  select count(*)::int n from deal_move
),
/* ⑦ 문(함수) — 열여섯 */
/*    ⚠️⚠️ **있는 것을 셉니다 — 기대 목록을 세지 마세요.** 처음에
      `count(*)` 로 적었다가 **values 열여섯 줄을 세고** 있었습니다 —
      함수가 열여섯 개 다 없어도 16/16 ✅ 였습니다. 되돌려 보고
      알았습니다 (이 저장소가 "통과만 하는 검사" 로 겪은 자리). */
v_fn as (
  select count(*) filter (where exists (
                    select 1 from pg_proc p
                     where p.proname = w.f
                       and p.pronamespace = 'public'::regnamespace))::int n,
         coalesce(string_agg(w.f, ', ')
                  filter (where not exists (
                    select 1 from pg_proc p
                     where p.proname = w.f
                       and p.pronamespace = 'public'::regnamespace)), '—') miss
    from (values ('move_state'),('confirm_fee'),('mark_paid'),('clawback_fee'),
                 ('answer_assignment'),('claim_request'),('save_provider'),
                 ('approve_provider'),('save_fee_policy'),('set_fee_policy_active'),
                 ('my_role'),('my_provider'),('is_my_request'),('handle_new_user'),
                 ('provider_guard'),('deal_money_guard'),
                 /* 0008 — 견적 (§4 · §6) */
                 ('submit_quote'),('withdraw_quote'),('choose_quote')) w(f)
),
/* ⑧ ⚠️⚠️ 가입 트리거가 **auth.users 에** 걸렸는가 (진짜 Supabase 전용).
      이게 없으면 가입해도 account 줄이 안 생겨서, 로그인은 되는데
      역할이 없고 /admin 이 영영 "권한이 없습니다" 입니다. */
v_trg as (
  select count(*)::int n from pg_trigger
   where tgname = 'on_auth_user_created' and not tgisinternal
),
/* ⑨ ⚠️⚠️ auth.uid() 가 있는가 — 없으면 0003 · 0004 의 모든 문이
      "변경자를 모릅니다" 로 거절합니다 (기록 없는 변경을 막는 자물쇠). */
v_uid as (
  select count(*)::int n from pg_proc p
   where p.proname = 'uid' and p.pronamespace = 'auth'::regnamespace
),
/* ⑩ ⚠️⚠️ 돈 칸에 로그인 사용자 쓰기 권한 — 0 이어야 합니다.
      열려 있으면 업체가 자기 수수료를 고칩니다. */
v_money as (
  select count(*)::int n,
         coalesce(string_agg(column_name, ', '), '—') who
    from information_schema.column_privileges
   where table_name = 'deal' and grantee = 'authenticated'
     and privilege_type = 'UPDATE'
     and column_name in ('fee','fee_total','fee_snap','paid')
),
/* ⑪ ⚠️⚠️ 감사 기록을 고치거나 지우는 정책 — 0 이어야 합니다.
      고칠 수 있는 기록은 기록이 아닙니다. */
v_audit as (
  select count(*)::int n from pg_policies
   where tablename = 'audit_log' and cmd in ('UPDATE','DELETE','ALL')
),
/* ⑫ ⚠️ 로그인 안 한 사람(anon)에게 준 권한 — 0 이어야 합니다.
      공개 목록은 빌드가 미리 만든 HTML 이 냅니다. */
v_anon as (
  select count(*)::int n,
         coalesce(string_agg(distinct table_name, ', '), '—') who
    from information_schema.role_table_grants
   where grantee = 'anon' and table_schema = 'public'
),
/* ⑬ ⚠️⚠️ 가입할 때 역할을 고를 수 없는가 — 트리거가 'customer' 를 박습니다. */
v_cust as (
  select count(*)::int n from pg_proc p
   where p.proname = 'handle_new_user'
     and p.pronamespace = 'public'::regnamespace
     and pg_get_functiondef(p.oid) like '%''customer''%'
),
rows as (
  select 1 i, '판 번호 (0001~0008)'             t, v_ver.n::text   got, '8'  want from v_ver
  union all select  2, '표 (public)',              v_tab.n::text,  '12' from v_tab
  union all select  3, '⚠️ RLS 안 켜진 표: ' || v_rls.who, v_rls.n::text, '0' from v_rls
  union all select  4, '신청 상태 (hold 포함: ' ||
                       case when v_st.has_hold then 'O' else 'X' end || ')',
                       v_st.n::text, '13' from v_st
  union all select  5, '역할',                     v_role.n::text, '4'  from v_role
  union all select  6, '갈 수 있는 길 (deal_move)', v_move.n::text, '70' from v_move
  union all select  7, '문(함수) · 빠진 것: ' || v_fn.miss, v_fn.n::text, '19' from v_fn
  union all select  8, '⚠️ 가입 트리거 (auth.users)', v_trg.n::text, '1' from v_trg
  union all select  9, '⚠️ auth.uid()',            v_uid.n::text,  '1'  from v_uid
  union all select 10, '⚠️ 돈 칸 쓰기 권한: ' || v_money.who, v_money.n::text, '0' from v_money
  union all select 11, '⚠️ 감사 기록 수정·삭제 정책', v_audit.n::text, '0' from v_audit
  union all select 12, '⚠️ anon 권한: ' || v_anon.who, v_anon.n::text, '0' from v_anon
  union all select 13, '가입 시 역할을 customer 로 박음', v_cust.n::text, '1' from v_cust
)
select i "#", t "검사", got "지금", want "기대",
       case when got = want then '✅' else '❌ 고쳐야 합니다' end "판정"
  from rows order by i;
