-- ════════════════════════════════════════════════════════════════════
--  0006 — 보류(hold) 상태        2026-10-09 최종 통합 지시서 §8-3
-- ════════════════════════════════════════════════════════════════════
--  > "취소 · 실패 · 보류 상태를 별도로 관리한다."
--
--  ⚠️⚠️ **이 파일은 따라잡기(catch-up)용입니다.**
--  `0001_init.sql` 과 `0004_move_state.sql` 에 보류가 이미 들어가 있어,
--  **새로 세우는 DB 는 이 파일이 없어도 됩니다.** 두 파일을 고친 까닭은
--  아직 어느 DB 에도 안 돌렸기 때문이고(저장소 기준), 혹시 이미
--  돌리셨다면 이 파일이 그 DB 를 같은 자리로 데려옵니다.
--
--  ⚠️ **두 번 돌려도 안전합니다** — add value if not exists ·
--  on conflict do nothing. 그래서 새 DB 에 돌려도 아무 일이 안 납니다.
--
--  ⚠️⚠️ **트랜잭션으로 감싸지 마세요.** `alter type … add value` 로 더한
--  값은 **같은 트랜잭션 안에서 쓸 수 없습니다** — 아래 insert 가 그 값을
--  바로 쓰기 때문에 BEGIN 으로 묶으면 "unsafe use of new value" 로
--  터집니다. psql 기본(문장마다 자동 커밋)으로 돌리세요.
-- ════════════════════════════════════════════════════════════════════

alter type deal_state add value if not exists 'hold' after 'lost';

-- ── 보류로 들어가는 길 ───────────────────────────────────────────────
-- ⚠️⚠️ **계약 전까지만**입니다. signed · done · 정산 쌍은 돈이 얽혀 있어
--    멈추는 것이 아니라 취소 · 환수입니다 (§10-3).
-- ⚠️ 사유(why)를 반드시 받습니다 — 왜 멈췄는지가 안 남으면 다음 사람이
--    그 건을 어떻게 다루어야 할지 모릅니다 (§8 기록).
insert into deal_move (from_state, to_state, role, needs) values
  ('new','hold','staff',array['why']::text[]),
  ('new','hold','admin',array['why']::text[]),
  ('new','hold','customer',array['why']::text[]),
  ('check','hold','staff',array['why']::text[]),
  ('check','hold','admin',array['why']::text[]),
  ('check','hold','customer',array['why']::text[]),
  ('assigned','hold','staff',array['why']::text[]),
  ('assigned','hold','admin',array['why']::text[]),
  ('assigned','hold','customer',array['why']::text[]),
  ('accepted','hold','staff',array['why']::text[]),
  ('accepted','hold','admin',array['why']::text[]),
  ('accepted','hold','customer',array['why']::text[]),
  ('consult','hold','staff',array['why']::text[]),
  ('consult','hold','admin',array['why']::text[]),
  ('consult','hold','customer',array['why']::text[]),
  ('quoted','hold','staff',array['why']::text[]),
  ('quoted','hold','admin',array['why']::text[]),
  ('quoted','hold','customer',array['why']::text[]),
  ('nego','hold','staff',array['why']::text[]),
  ('nego','hold','admin',array['why']::text[]),
  ('nego','hold','customer',array['why']::text[]),
-- ── 보류에서 나가는 길 — 둘뿐입니다 ──────────────────────────────────
-- ⚠️⚠️ **멈췄던 자리로 돌아가지 않고 `check`(다시 확인)부터입니다.**
--    몇 달 전 조건으로 그대로 이어 붙이면 업체도 가격도 바뀌었을 수
--    있습니다 — 다시 확인하는 것이 맞습니다.
-- ⚠️⚠️ **보류에서 돈 상태로 가는 길은 없습니다.**
  ('hold','check','staff','{}'::text[]),
  ('hold','check','admin','{}'::text[]),
  ('hold','lost','staff',array['why']::text[]),
  ('hold','lost','admin',array['why']::text[]),
  ('hold','lost','customer',array['why']::text[])
on conflict (from_state, to_state, role) do nothing;

-- 판 번호 (db/README.md) — ⚠️ 칸 이름은 0002 의 것입니다 (n · name)
insert into schema_version (n, name) values (6, '0006_hold_state')
on conflict (n) do nothing;
