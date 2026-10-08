#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   수수료 계산이 말이 되는 숫자를 내놓는가 (지시서 §9)

     node tools/test-fee.js

   ⚠️⚠️ **이 검사가 있는 이유** — 이 저장소는 같은 사고를 두 번 냈습니다.
   손익분기 계산기가 변동비 100% 는 막으면서 **99.99%** 는 통과시켜
   본전 매출을 **85조원**으로 냈고, 권리금 계산기가 월 순이익 0.01 에
   회수 기간 **300,000개월(25,000년)** 을 냈습니다. 둘 다 **경계값은
   막고 그 바로 아래를 안 넣어 봐서** 났습니다.

   수수료는 화면이 아니라 **업체에게 보내는 청구서**입니다. 그래서
   여기는 경계 바로 아래를 전부 넣어 봅니다.

   ⚠️ 반대로 **너무 넓게 막는 것도 고장**입니다 — 정상 조건에서 결과가
   제대로 나오는 것까지 같이 봅니다.
   ════════════════════════════════════════════════════════════════════ */

const fs = require("fs");
const path = require("path");

global.window = {};
for(const f of ["js/data/fee.js"])
  eval(fs.readFileSync(path.join(__dirname, "..", f), "utf8"));
const W = global.window;

let bad = 0, ran = 0;
function ok(name, cond, got){
  ran++;
  if(cond) console.log("  ✅ " + name);
  else { bad++; console.log("  ❌ " + name + (got !== undefined ? "  →  " + JSON.stringify(got) : "")); }
}

/* 쓸 만한 기본 정책 */
function P(o){
  return W.amFeeSnap(Object.assign({
    type:"rate", rate:3, vat:"add", when:"done", cycle:"monthly"
  }, o || {}), "2026-10-08T00:00:00.000Z");
}

console.log("\n── 정책이 말이 되는가");
ok("쓸 만한 정책은 통과한다", W.amFeeBadPolicy(P()) === "");
ok("없는 수익모델을 막는다", !!W.amFeeBadPolicy(P({ type:"zzz" })));
ok("부가세 기준을 안 고르면 막는다", !!W.amFeeBadPolicy(P({ vat:"" })));
ok("확정 조건을 안 고르면 막는다", !!W.amFeeBadPolicy(P({ when:"" })));
ok("정산 주기를 안 고르면 막는다", !!W.amFeeBadPolicy(P({ cycle:"" })));
ok("요율 0 을 막는다", !!W.amFeeBadPolicy(P({ rate:0 })));
ok("요율 음수를 막는다", !!W.amFeeBadPolicy(P({ rate:-1 })));
/* ⚠️ 경계 바로 위 · 바로 아래 */
ok("요율 100% 는 받는다 (경계)", W.amFeeBadPolicy(P({ rate:100 })) === "");
ok("요율 100.01% 를 막는다 (경계 바로 위)", !!W.amFeeBadPolicy(P({ rate:100.01 })));
ok("최소 > 최대 를 막는다", !!W.amFeeBadPolicy(P({ min:200, max:100 })));
ok("최소 = 최대 는 받는다 (경계)", W.amFeeBadPolicy(P({ min:100, max:100 })) === "");
ok("시작일이 종료일보다 늦으면 막는다",
   !!W.amFeeBadPolicy(P({ from:"2026-12-01", to:"2026-11-01" })));
ok("정액 모델에 정액이 없으면 막는다", !!W.amFeeBadPolicy(P({ type:"close", flat:null })));
ok("정액 0원은 받는다 (무료라는 뜻)",
   W.amFeeBadPolicy(P({ type:"close", flat:0 })) === "");

console.log("\n── 정책 사본이 아니면 계산하지 않는다 (§9 정책 유지)");
{
  const live = { type:"rate", rate:3, vat:"add", when:"done", cycle:"monthly" };
  const r = W.amFeeCalc(live, { amount:10000000 });
  ok("사본이 아니면 거절한다", r.ok === false, r.why);
  const p = W.amFeeCalc(live, { amount:10000000 }, { preview:true });
  ok("preview 면 계산하고 preview 로 표시한다", p.ok === true && p.preview === true, p);
  /* ⚠️⚠️ 정책을 고쳐도 사본의 값으로 계산되어야 합니다 */
  const snap = W.amFeeSnap(live);
  live.rate = 30;
  const after = W.amFeeCalc(snap, { amount:10000000 });
  ok("정책을 고쳐도 사본의 요율로 계산한다", after.ok && after.fee === 300000, after.fee);
}

console.log("\n── 정상 조건에서 제대로 나오는가 (너무 넓게 막지 않았는가)");
{
  const r = W.amFeeCalc(P({ rate:3 }), { amount:10000000 });
  ok("1,000만원 · 3% → 수수료 30만원", r.ok && r.fee === 300000, r.fee);
  ok("부가세 별도 → 공급가 30만 · 부가세 3만 · 합계 33만",
     r.supply === 300000 && r.vat === 30000 && r.total === 330000, r);
}
{
  const r = W.amFeeCalc(P({ vat:"incl", rate:3 }), { amount:10000000 });
  ok("부가세 포함 → 합계가 수수료와 같다", r.ok && r.total === 300000, r);
  ok("부가세 포함 → 공급가 + 부가세 = 합계",
     r.supply + r.vat === r.total, r);
}
{
  const r = W.amFeeCalc(P({ vat:"free", rate:3 }), { amount:10000000 });
  ok("면세 → 부가세 0", r.ok && r.vat === 0 && r.total === r.fee, r);
}
{
  const r = W.amFeeCalc(P({ type:"close", flat:50000 }), {});
  ok("완료당 정액 → 계약금액 없이도 계산된다", r.ok && r.fee === 50000, r);
}
{
  const r = W.amFeeCalc(P({ type:"base_rate", flat:100000, rate:2 }), { amount:10000000 });
  ok("기본 10만 + 2% → 30만원", r.ok && r.fee === 300000, r.fee);
}
{
  const r = W.amFeeCalc(P({ type:"margin", flat:null, rate:null, vat:"add", when:"done", cycle:"now" }),
                        { sell:1200000, cost:900000 });
  ok("유통 마진 → 판매가 - 매입가", r.ok && r.fee === 300000, r);
}
{
  const r = W.amFeeCalc(P({ type:"sub", flat:20000 }), { times:6 });
  ok("구독형 6회차 → 12만원", r.ok && r.fee === 120000, r.fee);
}

console.log("\n── ⚠️⚠️ 경계값 **바로 아래** (85조원 · 25,000년이 났던 자리)");
{
  /* 요율도 계약금액도 0 보다 큰데 반올림이 0 으로 떨어지는 자리 */
  const r = W.amFeeCalc(P({ rate:0.0001 }), { amount:1000 });
  ok("요율 0.0001% · 계약금액 1,000원 → 0원을 내놓지 않고 거절한다",
     r.ok === false && /0원/.test(r.why), r);
}
{
  const r = W.amFeeCalc(P({ rate:0.01 }), { amount:10000 });
  ok("요율 0.01% · 계약금액 1만원 → 1원이라 통과한다 (경계 바로 위)",
     r.ok === true && r.fee === 1, r);
}
{
  /* ⚠️ 계약금액이 아직 없으면 **0 이 아니라 거절** 입니다 */
  const r = W.amFeeCalc(P(), {});
  ok("계약금액이 없으면 0 원이 아니라 거절한다",
     r.ok === false && /계약금액/.test(r.why), r);
  const z = W.amFeeCalc(P({ type:"close", flat:50000 }), { amount:0 });
  ok("계약금액 0 은 '적지 않은 것' 이 아니다 (정액은 그대로 계산)",
     z.ok === true && z.fee === 50000, z);
}
{
  const r = W.amFeeCalc(P(), { amount:-1 });
  ok("계약금액 음수를 막는다", r.ok === false, r.why);
}
{
  /* ⚠️⚠️ 최소 수수료가 계약금액보다 큰 자리 — 계산은 맞지만 청구서로는
     말이 안 됩니다 */
  const r = W.amFeeCalc(P({ rate:3, min:1000000 }), { amount:500000 });
  ok("수수료가 계약금액보다 크면 거절한다",
     r.ok === false && /계약금액/.test(r.why), r);
  /* ⚠️ 씨앗을 고쳤습니다 — 처음에 50만원 x 3% = 1.5만원으로 적었다가
     "최소 1만원에 안 걸린다" 로 실패했습니다. **틀린 것은 코드가 아니라
     씨앗**이었습니다 (영업기간 검사에서 같은 실수를 한 적이 있습니다).
     20만원 x 3% = 6,000원 → 최소 1만원으로 올라가고, 1만원은 계약금액
     안이라 통과해야 합니다. */
  const okCase = W.amFeeCalc(P({ rate:3, min:10000 }), { amount:200000 });
  ok("최소 수수료로 올라가고 계약금액 안이면 통과한다",
     okCase.ok === true && okCase.fee === 10000 && okCase.clamped === "min", okCase);
}
{
  const r = W.amFeeCalc(P({ rate:50, max:100000 }), { amount:10000000 });
  ok("최대 수수료로 눌린다", r.ok && r.fee === 100000 && r.clamped === "max", r);
}
{
  /* 요율 100% 짜리는 수수료 = 계약금액 입니다 — '크다' 가 아니라 '같다' 라
     통과해야 합니다 (경계) */
  const r = W.amFeeCalc(P({ rate:100 }), { amount:1000000 });
  ok("요율 100% → 수수료 = 계약금액, 통과한다 (경계)",
     r.ok === true && r.fee === 1000000, r);
}
{
  const r = W.amFeeCalc(P({ type:"sub", flat:20000 }), { times:0 });
  ok("구독 회차 0 을 막는다", r.ok === false, r.why);
  const h = W.amFeeCalc(P({ type:"sub", flat:20000 }), { times:1.5 });
  ok("구독 회차 소수를 막는다", h.ok === false, h.why);
  const one = W.amFeeCalc(P({ type:"sub", flat:20000 }), { times:1 });
  ok("구독 회차 1 은 통과한다 (경계)", one.ok === true && one.fee === 20000, one);
}
{
  const r = W.amFeeCalc(P({ type:"margin" }), { sell:900000, cost:900001 });
  ok("판매가가 매입가보다 낮으면 거절한다 (경계 바로 아래)", r.ok === false, r.why);
  const e = W.amFeeCalc(P({ type:"margin" }), { sell:900000, cost:900000 });
  ok("판매가 = 매입가 → 마진 0, 0원을 그대로 낸다 (경계)",
     e.ok === true && e.fee === 0, e);
}

console.log("\n── 적용 기간 (§9)");
{
  const p = P({ from:"2026-11-01", to:"2026-12-31" });
  ok("시작일 전이면 거절한다", W.amFeeCalc(p, { amount:1000000, at:"2026-10-31" }).ok === false);
  ok("시작일 당일은 통과한다 (경계)", W.amFeeCalc(p, { amount:1000000, at:"2026-11-01" }).ok === true);
  ok("종료일 당일은 통과한다 (경계)", W.amFeeCalc(p, { amount:1000000, at:"2026-12-31" }).ok === true);
  ok("종료일 다음날은 거절한다 (경계 바로 위)",
     W.amFeeCalc(p, { amount:1000000, at:"2027-01-01" }).ok === false);
}

console.log("\n── 환수 · 부분환불 (§9)");
{
  const p = P({ rate:3 });
  const r = W.amFeeClawback(p, 300000, { amount:5000000 });
  ok("계약금액이 절반으로 줄면 15만원을 환수한다",
     r.ok && r.was === 300000 && r.now === 150000 && r.back === 150000, r);
  const c = W.amFeeClawback(p, 300000, { cancelled:true });
  ok("계약이 취소되면 전액 환수한다", c.ok && c.back === 300000, c);
  const up = W.amFeeClawback(p, 300000, { amount:20000000 });
  ok("계약금액이 늘면 환수액이 음수 (더 받을 돈)", up.ok && up.back === -300000, up);
  ok("확정했던 액이 없으면 거절한다", W.amFeeClawback(p, null, { amount:1 }).ok === false);
}

console.log("\n── 실제 입금액은 계산이 건드리지 않는다 (§9 넷을 구분해 저장)");
{
  const r = W.amFeeCalc(P(), { amount:10000000, paid:999 });
  ok("계산 결과에 입금액 칸이 없다", r.ok && r.paid === undefined, Object.keys(r));
}

console.log("\n" + (bad ? "❌ " + bad + "/" + ran + " 실패" : "✅ " + ran + "개 전부 통과") + "\n");
process.exit(bad ? 1 : 0);
