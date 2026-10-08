-- ════════════════════════════════════════════════════════════════════
-- 0003 — 수수료를 확정하는 **문 하나** (§8 · §9 · §13)
--
-- ⚠️⚠️ **왜 이 파일이 생겼나** — 0001 을 실제로 돌려 보다가 알았습니다.
--   `deal.fee` 칸에 authenticated 권한을 안 줬으니 관리자도 화면에서
--   수수료를 못 적고, 서버가 service key 로 붙으면 `auth.uid()` 가
--   비어서 `my_role()` 이 'admin' 이 아니라 **트리거가 막습니다.**
--   즉 아무도 수수료를 확정할 수 없는 상태였습니다. 돌려 보지 않았으면
--   4차에서야 알았을 자리입니다.
--
-- 고치는 길이 둘이었습니다 —
--   ① deal 의 돈 칸에 권한을 열고 RLS·트리거로만 막기
--   ② **문을 하나 만들고 그 문만 열기**  ← 이쪽입니다
--
-- ②를 고른 까닭 — §8 이 "모든 중요한 상태 변경에는 변경자, 변경일시,
--   사유를 기록한다" 고 적었습니다. 문이 하나면 **기록 없이 지나갈
--   길이 없습니다.** 칸을 열어 두면 기록하는 코드를 잊은 길이 하나
--   생기는 날 기록이 비고, 그때는 아무도 모릅니다.
--
-- ⚠️⚠️ 그래서 이 함수들은 **감사 기록을 같이 남깁니다.** 한 트랜잭션
--   이라, 기록이 실패하면 수수료도 안 적힙니다.
-- ════════════════════════════════════════════════════════════════════

-- ── 수수료 확정 (§9 "관리자의 최종 승인") ───────────────────────────
-- ⚠️⚠️ 관리자만. 그리고 **서비스 완료(done) 상태에서만** 됩니다 —
-- 업체가 계약 완료를 신고한 것만으로는 안 됩니다 (§8 마지막 문장).
create or replace function confirm_fee(
  p_deal  uuid,
  p_fee   bigint,
  p_vat   bigint,
  p_total bigint,
  p_snap  jsonb,
  p_proof jsonb,
  p_why   text default null
) returns void
  language plpgsql security definer set search_path = public as $$
declare
  v_req   uuid;
  v_state deal_state;
  v_me    uuid := auth.uid();
begin
  if my_role() <> 'admin' then
    raise exception '수수료 확정은 관리자만 할 수 있습니다';
  end if;
  -- ⚠️ security definer 라 RLS 를 지나가므로, 누구인지 **여기서**
  -- 확인합니다. auth.uid() 가 비어 있으면 기록에 변경자를 못 적습니다.
  if v_me is null then
    raise exception '변경자를 알 수 없습니다 — 관리자로 로그인한 세션에서만 됩니다';
  end if;

  select request_id into v_req from deal where id = p_deal;
  if v_req is null then raise exception '없는 계약입니다'; end if;
  select state into v_state from request where id = v_req;

  -- ⚠️⚠️ js/data/deal.js 의 길(done → fee_wait)과 **같은 규칙**입니다.
  if v_state <> 'done' then
    raise exception '서비스 완료 상태에서만 수수료를 확정할 수 있습니다 (지금: %)', v_state;
  end if;

  -- §9 "계약 완료 증빙 확인"
  if p_proof is null then raise exception '계약 완료 증빙이 없습니다'; end if;
  -- §9 "기존 계약에 적용된 수수료 정책은 추후 정책이 변경되더라도 유지"
  if p_snap is null then raise exception '적용할 수수료 정책 사본이 없습니다'; end if;
  if p_fee is null or p_fee < 0 then raise exception '수수료가 없거나 음수입니다'; end if;

  update deal set
    fee = p_fee, fee_vat = p_vat, fee_total = p_total,
    fee_snap = p_snap, proof = p_proof,
    fee_by = v_me, fee_at = now()
  where id = p_deal;

  update request set state = 'fee_wait' where id = v_req;

  -- ⚠️⚠️ 같은 트랜잭션입니다 — 기록이 실패하면 수수료도 안 적힙니다
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, 'admin', 'deal', p_deal::text, 'done', 'fee_wait', p_why,
          jsonb_build_object('fee', p_fee, 'vat', p_vat, 'total', p_total));
end $$;

-- ── 입금 확인 (§9 "실제 입금 확인 후 정산 완료") ────────────────────
-- ⚠️⚠️ §13 "실제 정산 시스템 구축 전 가짜 결제·정산 완료 상태 생성 금지"
create or replace function mark_paid(
  p_deal uuid,
  p_paid bigint,
  p_why  text default null
) returns void
  language plpgsql security definer set search_path = public as $$
declare
  v_req uuid; v_state deal_state; v_fee bigint; v_me uuid := auth.uid();
begin
  if my_role() <> 'admin' then
    raise exception '정산 완료는 관리자만 할 수 있습니다';
  end if;
  if v_me is null then
    raise exception '변경자를 알 수 없습니다';
  end if;
  -- ⚠️ 0 은 값입니다 (부분환불 뒤 0원) — `is null` 로만 봅니다
  if p_paid is null then raise exception '실제 입금액이 없습니다'; end if;
  if p_paid < 0 then raise exception '입금액이 음수입니다'; end if;

  select request_id, fee into v_req, v_fee from deal where id = p_deal;
  if v_req is null then raise exception '없는 계약입니다'; end if;
  -- ⚠️⚠️ 수수료가 확정되지 않았는데 입금을 적으면 그게 가짜 정산입니다
  if v_fee is null then raise exception '수수료가 아직 확정되지 않았습니다'; end if;
  select state into v_state from request where id = v_req;
  if v_state <> 'fee_wait' then
    raise exception '정산 대기 상태에서만 입금을 확인할 수 있습니다 (지금: %)', v_state;
  end if;

  update deal set paid = p_paid, paid_at = now() where id = p_deal;
  update request set state = 'fee_done' where id = v_req;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, 'admin', 'deal', p_deal::text, 'fee_wait', 'fee_done', p_why,
          jsonb_build_object('paid', p_paid));
end $$;

-- ── 환수 · 부분환불 (§9 "취소·환불·환수 조건") ──────────────────────
-- ⚠️⚠️ **확정했던 액을 갈아 치우지 않습니다.** 차액을 기록으로 남깁니다 —
-- 갈아 치우면 "얼마를 확정했다가 얼마를 돌려받았는가" 가 사라집니다.
create or replace function clawback_fee(
  p_deal uuid, p_new_fee bigint, p_why text
) returns bigint
  language plpgsql security definer set search_path = public as $$
declare v_was bigint; v_me uuid := auth.uid();
begin
  if my_role() <> 'admin' then raise exception '환수는 관리자만 할 수 있습니다'; end if;
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if p_why is null or btrim(p_why) = '' then raise exception '환수 사유가 필요합니다'; end if;

  select fee into v_was from deal where id = p_deal;
  if v_was is null then raise exception '확정된 수수료가 없습니다'; end if;

  insert into audit_log (by_user, by_role, obj, obj_id, why, data)
  values (v_me, 'admin', 'deal', p_deal::text, p_why,
          jsonb_build_object('was', v_was, 'now', p_new_fee, 'back', v_was - p_new_fee));

  update deal set fee = p_new_fee where id = p_deal;
  return v_was - p_new_fee;
end $$;

-- ⚠️⚠️ **문을 이 셋만 열어 둡니다.** deal 의 돈 칸에는 authenticated
-- 권한이 없으므로(0001 의 GRANT), 수수료를 적는 길이 이 함수들뿐입니다.
revoke all on function confirm_fee(uuid,bigint,bigint,bigint,jsonb,jsonb,text) from public;
revoke all on function mark_paid(uuid,bigint,text)                            from public;
revoke all on function clawback_fee(uuid,bigint,text)                         from public;
grant execute on function confirm_fee(uuid,bigint,bigint,bigint,jsonb,jsonb,text) to authenticated;
grant execute on function mark_paid(uuid,bigint,text)                            to authenticated;
grant execute on function clawback_fee(uuid,bigint,text)                         to authenticated;

insert into schema_version (n, name) values (3, '0003_confirm_fee')
on conflict (n) do nothing;
