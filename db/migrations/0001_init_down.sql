-- ════════════════════════════════════════════════════════════════════
-- 0001_init 되돌리기
--
-- ⚠️⚠️ **이 파일을 운영에서 돌리면 신청 · 계약 · 정산 · 감사 기록이
-- 전부 사라집니다.** 되돌리기 전에 반드시 백업을 뜨세요
-- (db/README.md 의 "백업 · 복구").
-- ⚠️⚠️ 감사 기록(audit_log)은 법적 증빙입니다 — 지우기 전에 내려받아
-- 두세요. 지우고 나면 "누가 언제 무엇을 승인했는가" 를 댈 수 없습니다.
--
-- 그래서 일부러 **한 줄로 안 만들었습니다.** 지우실 것만 골라
-- 주석을 푸세요.
-- ════════════════════════════════════════════════════════════════════

-- ── 0005 (가입하면 줄 만들기 · 신청번호로 가져오기) ──────────────
-- ⚠️ 트리거를 먼저 떼야 합니다 — auth.users 에 붙어 있습니다
-- drop trigger if exists on_auth_user_created on auth.users;
-- drop function if exists handle_new_user();
-- drop function if exists claim_request(text, text);
-- drop policy   if exists assign_requester on assignment;
-- drop function if exists is_my_request(uuid);

-- ── 0004 (상태를 바꾸는 문) ──────────────────────────────────────
-- drop function if exists answer_assignment(uuid, boolean, text);
-- drop function if exists move_state(uuid, deal_state, jsonb);
-- drop table    if exists deal_move;

-- ── 0003 (수수료를 확정하는 문) ──────────────────────────────────
-- drop function if exists clawback_fee(uuid, bigint, text);
-- drop function if exists mark_paid(uuid, bigint, text);
-- drop function if exists confirm_fee(uuid, bigint, bigint, bigint, jsonb, jsonb, text);

-- ── 0002 ─────────────────────────────────────────────────────────
-- drop table if exists schema_version;

-- ── 0001 ─────────────────────────────────────────────────────────
-- drop trigger if exists deal_money_guard_t on deal;
-- drop trigger if exists provider_guard_t   on provider;
-- drop function if exists deal_money_guard();
-- drop function if exists provider_guard();
-- drop function if exists my_provider();
-- drop function if exists my_role();

-- drop table if exists audit_log;
-- drop table if exists settlement;
-- drop table if exists deal;
-- drop table if exists fee_policy;
-- drop table if exists assignment;
-- drop table if exists request;
-- drop table if exists offer;
-- alter table account drop constraint if exists account_provider_fk;
-- drop table if exists provider;
-- drop table if exists account;

-- drop type if exists offer_status;
-- drop type if exists fee_cycle;
-- drop type if exists fee_when;
-- drop type if exists fee_vat;
-- drop type if exists fee_type;
-- drop type if exists app_role;
-- drop type if exists deal_state;
