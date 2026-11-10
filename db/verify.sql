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
--     판 71 · 표 55 · 상태 13 · 역할 4 · 길 70 · 함수 43.
--     ⚠️ 2026-11-09 — 0070 이 판 하나를 더했습니다(표 · 함수는 그대로입니다:
--       `move_listing` 을 **덮어쓴** 것이고 새 함수가 아닙니다).
--     ⚠️⚠️⚠️ **2026-11-09 에 다시 셌습니다.** 그 전에는 판 23 · 표 21 ·
--     함수 48 로 **0023 판의 값**이 남아 있어서, 0069 까지 올린 멀쩡한
--     DB 가 네 줄에서 ❌ 로 찍혔습니다 (판 · 표 · 함수 · anon).
--     ⚠️ 눈대중으로 고치지 않았습니다 — 임시 Postgres 에 0001~0069 를
--     전부 올리고 **이 파일을 실제로 돌려** 나온 값입니다.
--     ⚠️ 전에 여기 적혀 있던 **트리거 4** 는 근거 없는 숫자였습니다 —
--     이 파일이 세는 트리거는 **가입 트리거 하나**(on_auth_user_created)
--     뿐입니다. 세지 않는 것을 기대값처럼 적지 마세요.
--     ⚠️ 이 줄이 2026-11-01 까지 **판 19 · 표 17 · 함수 40** 으로
--     낡아 있었습니다 — 기대값(want)은 맞는데 사장님이 읽는 설명만
--     틀려서, 멀쩡한 DB 를 보고 "판 19 가 맞나" 로 헷갈릴 자리입니다.
--     `checkMigDocs()` 는 세는 목록과 want 만 봅니다 — **설명 주석은
--     사람이 같이 고쳐야 합니다.**
--     저장소를 고치면 이 파일도 같이 고치세요.
--
--  ⚠️⚠️ `tools/test-sql.js` 는 **가짜 auth 스키마**로 돌립니다
--     (db/test/00_stub_auth.sql). 그래서 **진짜 Supabase 에서만
--     드러나는 것**이 둘 있고, 아래 ⑧ ⑨ 가 그것을 봅니다 —
--     auth.users 트리거와 auth.uid() 입니다.
-- ════════════════════════════════════════════════════════════════════

with
/* ① 판 번호 — 마이그레이션 수와 같아야 합니다 (0001~0071).
      ⚠️⚠️ 마이그레이션을 더하는 날 아래 want 도 같이 올리세요 —
      안 올리면 **멀쩡히 올린 DB 를 ❌ 로** 읽습니다. 세는 법은
      ls db/migrations 입니다 (2026-11-10 — 0071 이 한 줄 더했습니다). */
v_ver as (
  select count(*)::int n from schema_version
),
/* ② 표 — 스물하나 전부 있어야 합니다
      ⚠️⚠️ **2026-10-18 — `request_item` 이 목록에서 빠져 있었습니다.**
      0009 로 표가 열셋이 됐고 기대값만 13 으로 올려서, **제대로
      돌린 DB 가 12/13 ❌ 로** 나왔습니다 — 멀쩡한 DB 를 "고쳐야
      합니다" 로 잡는 자리이고, 이것이 사장님이 돌린 DB 를 재는
      유일한 길이라 제일 나쁜 종류입니다. 지금은 `checkMigDocs()` 가
      **목록 수와 기대값이 같은지**를 바로 봅니다. */
v_tab as (
  /* ⚠️⚠️⚠️ **표 이름을 손으로 적어 두지 않습니다** (2026-11-09). 전에는
     스물한 개를 글자로 박아 두어서, 앞 서비스(중고폰)의 표 넷이 지워지고
     골프 표가 마흔 넘게 늘어난 뒤에도 **그 스물한 개만** 세고 있었습니다
     (그래서 멀쩡한 DB 가 17/21 로 ❌ 였습니다).
     이제 public 스키마의 **진짜 표**를 셉니다 — 보기(view)는 뺍니다. */
  select count(*)::int n from information_schema.tables
   where table_schema = 'public' and table_type = 'BASE TABLE'
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
/* ⑦ 문(함수) — 서른하나 */
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
                 ('submit_quote'),('withdraw_quote'),('choose_quote'),
                 /* 0009 — 신청 하나에 서비스 여러 개 (2026-10-17 §6 · §7) */
                 ('save_request_items'),('assign_item'),('move_item_state'),
                 ('is_my_item'),
                 /* 0010 — 회원 임시저장 · 체크리스트 (2026-10-18 §6-2 · §9) */
                 ('save_user_state'),('clear_user_state'),
                 ('user_state_guard'),
                 /* 0011 — 사진 · 서류 (2026-10-18 §7-3 · §15) */
                 ('claim_photo_slot'),('drop_photo'),
                 /* 0012 — 담당자 · 연락처 열람 이력 (2026-10-22 P0 ③⑤) */
                 ('set_owner'),('note_request_open'),
                 ('assignment_assignable'),
                 /* 0013 — 업체 담당자 · 기간별 정산 (2026-10-22 P1 ⑬⑭) */
                 ('save_provider_contact'),('build_settlement'),
                 ('hold_settlement'),
                 /* 0014 — 업체가 스스로 고치는 문 (2026-10-22 P2 ⑳) */
                 ('save_provider_self'),
                 /* 0016 — 업체 입점 신청 (2026-10-25 진단 P1-7) */
                 ('set_apply_state'),
                 /* 0018 — 업체 계정 연결 (2026-10-25 최종 지시서 §5) */
                 ('provider_linked'),('provider_link_check'),
                 ('linked_providers'),
                 /* 0019 — 남의 건을 밀 수 없게 (2026-10-25 §6 · §7) */
                 ('request_scope_check'),
                 /* 0020 — 직접 매입 재고 (2026-10-29 PHONEWAY ⑥) */
                 /* ⚠️ 앞 서비스(중고폰)의 기기 함수 넷
                    (make_device · move_device · add_device_check ·
                    add_device_cost)과 set_provider_inhouse 는 **지워졌습니다**.
                    목록에 남겨 두면 멀쩡한 DB 가 "빠진 것 다섯" 으로
                    찍힙니다 — 그래서 뺐습니다(2026-11-09). */
                 /* ⚠️⚠️ 0021 — 자체 매입 부서를 경쟁 입찰에서 갈라 둡니다
                    (2026-10-30 PHONEWAY §10). `account_role_guard` 가
                    **입찰을 내는 쪽과 다 보는 쪽이 같은 계정일 수 없게**
                    막습니다 — 이게 없으면 한 줄로 둘 다 됩니다. */
                 ('account_role_guard'),
                 /* 0022 — 앞 서비스 접수를 보관 표시로 (2026-11-01 §6).
                    ⚠️ 지우는 문이 아닙니다 — 내려놓고 되돌립니다. */
                 ('archive_legacy_side'),('restore_legacy_request')) w(f)
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
/* ⑫ ⚠️⚠️⚠️ **표와 보기를 갈라서 봅니다** (2026-11-09).
      전에는 "anon 에게 준 권한은 0 이어야 한다" 였습니다 — 0023 판에서는
      맞는 말이었습니다(공개 목록을 빌드가 찍은 HTML 이 냈습니다). 지금은
      자유게시판 읽기(0059) · 광고(0064) · 공개 카드가 **공개 보기**로
      나가므로 보기 열여덟이 열려 있는 것이 **맞습니다.**
      ⚠️⚠️ 막아야 하는 것은 **표(base table)** 입니다 — 보기는 `where`
      절로 줄과 칸을 고를 수 있지만, 표를 열면 RLS 가 줄은 막아도 **칸은
      못 막습니다**(0064 가 `ad_run` 에서 단가 · 메모가 새던 것을 거둔
      그 자리).
      ⚠️ `membership_plan` 하나만 일부러 열려 있습니다 — 우리가 파는
      멤버십 요금제이고 칸이 이름 · 월 요금 · 혜택 · 공개 여부뿐이라
      공개가 맞습니다(0026). 그 하나는 빼고 셉니다. */
v_anon as (
  select count(*) filter (where t.table_type = 'BASE TABLE'
                            and t.table_name <> 'membership_plan')::int n,
         coalesce(string_agg(distinct t.table_name, ', ')
                  filter (where t.table_type = 'BASE TABLE'
                            and t.table_name <> 'membership_plan'), '—') who,
         count(distinct t.table_name) filter (where t.table_type = 'VIEW')::int views
    from information_schema.role_table_grants g
    join information_schema.tables t
      on t.table_schema = g.table_schema and t.table_name = g.table_name
   where g.grantee = 'anon' and g.table_schema = 'public'
),
/* ⑬ ⚠️⚠️ 가입할 때 역할을 고를 수 없는가 — 트리거가 'customer' 를 박습니다. */
v_cust as (
  select count(*)::int n from pg_proc p
   where p.proname = 'handle_new_user'
     and p.pronamespace = 'public'::regnamespace
     and pg_get_functiondef(p.oid) like '%''customer''%'
),
rows as (
  select 1 i, '판 번호 (0001~0071)'            t, v_ver.n::text   got, '71' want from v_ver
  union all select  2, '표 (public · 보기 뺀 것)',  v_tab.n::text,  '55' from v_tab
  union all select  3, '⚠️ RLS 안 켜진 표: ' || v_rls.who, v_rls.n::text, '0' from v_rls
  union all select  4, '신청 상태 (hold 포함: ' ||
                       case when v_st.has_hold then 'O' else 'X' end || ')',
                       v_st.n::text, '13' from v_st
  union all select  5, '역할',                     v_role.n::text, '4'  from v_role
  union all select  6, '갈 수 있는 길 (deal_move)', v_move.n::text, '70' from v_move
  union all select  7, '문(함수) · 빠진 것: ' || v_fn.miss, v_fn.n::text, '43' from v_fn
  union all select  8, '⚠️ 가입 트리거 (auth.users)', v_trg.n::text, '1' from v_trg
  union all select  9, '⚠️ auth.uid()',            v_uid.n::text,  '1'  from v_uid
  union all select 10, '⚠️ 돈 칸 쓰기 권한: ' || v_money.who, v_money.n::text, '0' from v_money
  union all select 11, '⚠️ 감사 기록 수정·삭제 정책', v_audit.n::text, '0' from v_audit
  union all select 12, '⚠️ anon 이 읽는 **표**(요금제 빼고): ' || v_anon.who ||
                       '  · 공개 보기 ' || v_anon.views::text || '개는 정상',
                       v_anon.n::text, '0' from v_anon
  union all select 13, '가입 시 역할을 customer 로 박음', v_cust.n::text, '1' from v_cust
)
select i "#", t "검사", got "지금", want "기대",
       case when got = want then '✅' else '❌ 고쳐야 합니다' end "판정"
  from rows order by i;
