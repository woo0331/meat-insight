-- ════════════════════════════════════════════════════════════════════
--  0015 — 유지 수수료 (2026-10-25 진단 P1-6)
-- ════════════════════════════════════════════════════════════════════
--  통신 · 렌탈처럼 **유지되는 동안** 받는 구조를 담습니다.
--
--  왜 `sub` 로 안 되는가 —
--    `sub`      회차마다 **정액**        (월 5만원 집과 15만원 집이 같아집니다)
--    `mrr_rate` 월 **요금의 일정 비율**  × 회차
--
--  그리고 유지분은 **계약한 날이 아니라 유지된 것을 확인한 날** 확정
--  됩니다. `done`(이행 완료)으로 두면 설치한 날 전부를 확정하게 되고,
--  그건 아직 받지도 않은 달까지 청구하는 것입니다 — 그래서 확정 조건에
--  `kept`(약정 유지 확인 후)를 같이 늘립니다.
--
--  ⚠️⚠️ **트랜잭션으로 감싸지 마세요.** `alter type … add value` 로 더한
--  값은 같은 트랜잭션 안에서 쓸 수 없습니다 — psql 기본(문장마다 자동
--  커밋)으로 돌리세요. 0006 과 같은 까닭입니다.
--
--  ⚠️ **두 번 돌려도 안전합니다** (add value if not exists ·
--  on conflict do nothing).
--
--  ⚠️⚠️ **0001 을 고치지 않았습니다.** 그 파일은 이미 돌아갔고,
--  마이그레이션은 번호를 다시 쓰지 않습니다. 그래서 값을 늘리는 길은
--  이 `alter type` 뿐이고, `build-pages.js` 의 `checkDealSql()` 이
--  **0001 의 create type 과 뒤의 alter type 을 합쳐서** 화면의 key 와
--  맞춰 봅니다 (한쪽만 고치면 빌드가 멈춥니다).
-- ════════════════════════════════════════════════════════════════════

-- ── 수익모델 둘 (js/data/fee.js 의 AM_FEE_TYPE) ──────────────────────
alter type fee_type add value if not exists 'mrr_rate' after 'sub';
alter type fee_type add value if not exists 'retain'   after 'mrr_rate';

-- ── 확정 조건 하나 (js/data/fee.js 의 AM_FEE_WHEN) ───────────────────
alter type fee_when add value if not exists 'kept' after 'paid';

-- ⚠️ 표는 한 칸도 안 늘렸습니다. 월 요금 · 회차는 관리자 화면이
--    적어서 계산하고, 확정된 금액만 `deal.fee` 로 들어갑니다 —
--    `deal.amount` 에는 그 기간에 손님이 낸 요금 합(base)이 들어가서
--    "수수료가 계약금액보다 크다" 는 자물쇠가 그대로 돕니다.
-- ⚠️⚠️ `fee_rate_range` 제약(0 < rate ≤ 100)이 유지분에도 그대로
--    걸립니다 — 월 요금의 100% 를 넘게 받는 정책은 없습니다.

insert into schema_version (n, name) values (15, '0015_retain_fee')
  on conflict (n) do nothing;
