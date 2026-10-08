#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   신청 한 건의 상태가 **못 갈 길로 안 가는가** (지시서 §8 · §13)

     node tools/test-deal.js

   ⚠️⚠️ **여기서 지키는 네 줄이 이 프로젝트의 법적 울타리입니다.**

   §8  "고객과 업체, 관리자는 **자신의 권한에 맞는 상태만** 조회하거나
        변경할 수 있다"
   §8  "모든 중요한 상태 변경에는 **변경자, 변경일시, 사유**를 기록한다"
   §8  "업체가 계약 완료를 신고하더라도 **자동으로 수수료를 확정하지
        않는다**"
   §13 "실제 정산 시스템 구축 전 **가짜 결제·정산 완료 상태 생성 금지**"

   그리고 하나 더 — **배정은 제3자 제공**입니다 (개인정보보호법
   제17조 제2항). 재동의 없이 배정되면 그 자리에서 법 위반입니다.
   ════════════════════════════════════════════════════════════════════ */

const fs = require("fs");
const path = require("path");

global.window = {};
eval(fs.readFileSync(path.join(__dirname, "..", "js/data/deal.js"), "utf8"));
const W = global.window;

let bad = 0, ran = 0;
function ok(name, cond, got){
  ran++;
  if(cond) console.log("  ✅ " + name);
  else { bad++; console.log("  ❌ " + name + (got !== undefined ? "  →  " + JSON.stringify(got) : "")); }
}

const BY = { by:"u-1" };

console.log("\n── 상태와 역할이 제대로 있는가");
ok("상태가 열둘이다 (§8)", W.AM_DEAL_ST.length === 12, W.AM_DEAL_ST.length);
ok("역할이 넷이다", W.AM_ROLES.length === 4, W.AM_ROLES.length);
{
  const keys = W.AM_DEAL_ST.map(s => s.key);
  ok("상태 key 가 겹치지 않는다", new Set(keys).size === keys.length);
  const roles = W.AM_ROLES.map(r => r.key);
  const badRole = [];
  W.AM_DEAL_ST.forEach(s => s.who.forEach(r => { if(roles.indexOf(r) < 0) badRole.push(s.key + "→" + r); }));
  ok("상태가 없는 역할을 가리키지 않는다", badRole.length === 0, badRole);
  const badMove = [];
  W.AM_DEAL_MOVE.forEach(m => {
    if(!W.amDealSt(m[0])) badMove.push("from " + m[0]);
    if(!W.amDealSt(m[1])) badMove.push("to " + m[1]);
    m[2].forEach(r => { if(roles.indexOf(r) < 0) badMove.push("role " + r); });
  });
  ok("길이 없는 상태 · 없는 역할을 가리키지 않는다", badMove.length === 0, badMove);
}
{
  /* 접수에서 출발해 모든 상태에 닿는가 — 닿지 않는 상태는 **영원히
     쓰이지 않는 칸**입니다 (푸터의 stages 가 그렇게 죽어 있었습니다) */
  const seen = new Set(["new"]);
  let grew = true;
  while(grew){
    grew = false;
    W.AM_DEAL_MOVE.forEach(m => {
      if(seen.has(m[0]) && !seen.has(m[1])){ seen.add(m[1]); grew = true; }
    });
  }
  const unreach = W.AM_DEAL_ST.map(s => s.key).filter(k => !seen.has(k));
  ok("접수에서 모든 상태에 닿는다", unreach.length === 0, unreach);
}

console.log("\n── ⚠️⚠️ 돈이 걸린 상태로는 관리자만 들어간다 (§8 · §13)");
{
  const moneyIn = W.AM_DEAL_MOVE.filter(m => (W.amDealSt(m[1]) || {}).money);
  ok("돈 상태로 들어가는 길이 있다", moneyIn.length > 0);
  const notAdminOnly = moneyIn.filter(m => m[2].length !== 1 || m[2][0] !== "admin");
  ok("돈 상태로 들어가는 길은 전부 관리자 전용이다",
     notAdminOnly.length === 0, notAdminOnly.map(m => m[0] + "→" + m[1] + " " + m[2]));
}
{
  /* §8 마지막 문장 — 업체가 "계약했습니다" 를 눌러도 수수료는 확정되지
     않습니다. 계약 완료(signed)에서 정산 대기로 **바로 가는 길이
     없어야** 합니다. */
  const shortcut = W.AM_DEAL_MOVE.filter(m => m[0] === "signed" && (W.amDealSt(m[1]) || {}).money);
  ok("계약 완료에서 정산으로 바로 가는 길이 없다", shortcut.length === 0, shortcut);
  const r = W.amDealMove("signed", "fee_wait", Object.assign({ role:"admin", proof:"x", feeId:"f1" }, BY));
  ok("계약 완료 → 정산 대기는 관리자여도 거절된다 (이행 완료를 거쳐야)",
     r.ok === false, r.why);
}
{
  const r = W.amDealMove("done", "fee_wait", Object.assign({ role:"provider", proof:"x", feeId:"f1" }, BY));
  ok("업체는 수수료를 확정할 수 없다", r.ok === false && /관리자/.test(r.why), r.why);
  const s = W.amDealMove("done", "fee_wait", Object.assign({ role:"staff", proof:"x", feeId:"f1" }, BY));
  ok("직원도 수수료를 확정할 수 없다", s.ok === false, s.why);
  const a = W.amDealMove("done", "fee_wait", Object.assign({ role:"admin", proof:"x", feeId:"f1" }, BY));
  ok("관리자는 증빙과 정책을 적으면 확정할 수 있다", a.ok === true, a.why);
}
{
  /* §9 "계약 완료 증빙 확인" · "관리자의 최종 승인" */
  const noProof = W.amDealMove("done", "fee_wait", Object.assign({ role:"admin", feeId:"f1" }, BY));
  ok("증빙 없이는 확정하지 못한다", noProof.ok === false && /증빙/.test(noProof.why), noProof.why);
  const noPolicy = W.amDealMove("done", "fee_wait", Object.assign({ role:"admin", proof:"x" }, BY));
  ok("적용할 수수료 정책 없이는 확정하지 못한다",
     noPolicy.ok === false && /정책/.test(noPolicy.why), noPolicy.why);
}

console.log("\n── ⚠️⚠️ 가짜 정산 완료를 만들 수 없다 (§13)");
{
  const noPaid = W.amDealMove("fee_wait", "fee_done", Object.assign({ role:"admin" }, BY));
  ok("실제 입금액 없이 정산 완료로 못 간다",
     noPaid.ok === false && /입금/.test(noPaid.why), noPaid.why);
  const paid = W.amDealMove("fee_wait", "fee_done", Object.assign({ role:"admin", paid:330000 }, BY));
  ok("입금액을 적으면 정산 완료로 간다", paid.ok === true, paid.why);
  /* ⚠️ 0 은 값입니다 — 입금 0원도 "적은 것" 입니다 (부분환불 뒤 0원) */
  const zero = W.amDealMove("fee_wait", "fee_done", Object.assign({ role:"admin", paid:0 }, BY));
  ok("입금액 0 은 '적지 않은 것' 이 아니다", zero.ok === true, zero.why);
  /* 접수에서 정산 완료로 건너뛰는 길 */
  const jump = W.amDealMove("new", "fee_done", Object.assign({ role:"admin", paid:1 }, BY));
  ok("접수에서 정산 완료로 건너뛸 수 없다", jump.ok === false, jump.why);
}

console.log("\n── ⚠️⚠️ 배정은 제3자 제공 재동의가 있어야 한다 (제17조 제2항)");
{
  const no = W.amDealMove("check", "assigned",
    Object.assign({ role:"admin", providerId:"p1", agree3rd:false }, BY));
  ok("재동의 없이 배정하지 못한다", no.ok === false && /동의/.test(no.why), no.why);
  const miss = W.amDealMove("check", "assigned",
    Object.assign({ role:"admin", providerId:"p1" }, BY));
  ok("동의 칸이 아예 없으면 배정하지 못한다", miss.ok === false, miss.why);
  const yes = W.amDealMove("check", "assigned",
    Object.assign({ role:"admin", providerId:"p1", agree3rd:true }, BY));
  ok("재동의가 있으면 배정한다", yes.ok === true, yes.why);
  const noWho = W.amDealMove("check", "assigned",
    Object.assign({ role:"admin", agree3rd:true }, BY));
  ok("배정할 업체 없이 배정하지 못한다", noWho.ok === false && /업체/.test(noWho.why), noWho.why);
}

console.log("\n── §8 변경자 · 사유 기록");
{
  const noBy = W.amDealMove("new", "check", { role:"admin" });
  ok("변경자가 없으면 거절한다", noBy.ok === false && /누가/.test(noBy.why), noBy.why);
  const r = W.amDealMove("new", "check", { role:"admin", by:"u-1" });
  ok("통과하면 기록을 돌려준다", r.ok && r.log && r.log.by === "u-1" && !!r.log.at, r.log);
  ok("기록에 어디서 어디로 · 누구의 역할이 남는다",
     r.log.from === "new" && r.log.to === "check" && r.log.role === "admin", r.log);
  const noWhy = W.amDealMove("new", "lost", Object.assign({ role:"admin" }, BY));
  ok("실패 처리에는 사유가 반드시 있어야 한다",
     noWhy.ok === false && /사유/.test(noWhy.why), noWhy.why);
  const withWhy = W.amDealMove("new", "lost", Object.assign({ role:"admin", why:"연락이 닿지 않음" }, BY));
  ok("사유를 적으면 실패 처리된다", withWhy.ok === true && withWhy.log.why === "연락이 닿지 않음", withWhy);
}

console.log("\n── 역할마다 다른 길 (§8 권한)");
{
  ok("업체는 배정받은 건을 수락할 수 있다",
     W.amDealMove("assigned", "accepted", Object.assign({ role:"provider" }, BY)).ok === true);
  ok("고객은 업체 대신 수락할 수 없다",
     W.amDealMove("assigned", "accepted", Object.assign({ role:"customer" }, BY)).ok === false);
  ok("고객은 자기 건을 취소할 수 있다",
     W.amDealMove("quoted", "lost", Object.assign({ role:"customer", why:"다른 곳으로 결정" }, BY)).ok === true);
  ok("업체가 거절하면 실패가 아니라 다시 확인으로 돌아간다",
     W.amDealMove("assigned", "check", Object.assign({ role:"provider", why:"지역을 못 갑니다" }, BY)).ok === true);
  ok("계약 완료에는 계약금액이 있어야 한다",
     W.amDealMove("nego", "signed", Object.assign({ role:"provider" }, BY)).ok === false);
  ok("계약금액을 적으면 계약 완료로 간다",
     W.amDealMove("nego", "signed", Object.assign({ role:"provider", amount:10000000 }, BY)).ok === true);
  ok("계약금액 0 도 적은 것이다 (무상 시공)",
     W.amDealMove("nego", "signed", Object.assign({ role:"provider", amount:0 }, BY)).ok === true);
}

console.log("\n── 볼 수 있는 것만 본다 (§8 조회 권한)");
{
  ok("고객은 돈 상태를 볼 수 없다", W.amDealCanSee("fee_wait", "customer") === false);
  ok("고객은 정산 완료를 볼 수 없다", W.amDealCanSee("fee_done", "customer") === false);
  ok("업체는 자기 정산을 볼 수 있다", W.amDealCanSee("fee_wait", "provider") === true);
  ok("관리자는 전부 본다",
     W.AM_DEAL_ST.every(s => W.amDealCanSee(s.key, "admin")));
  ok("업체는 배정 전 접수를 볼 수 없다", W.amDealCanSee("new", "provider") === false);
  ok("직원은 돈 상태를 볼 수 없다", W.amDealCanSee("fee_wait", "staff") === false);
}

console.log("\n── 없는 상태 · 제자리");
{
  ok("없는 상태를 거절한다", W.amDealMove("zzz", "check", Object.assign({ role:"admin" }, BY)).ok === false);
  ok("같은 상태로 옮기지 못한다", W.amDealMove("check", "check", Object.assign({ role:"admin" }, BY)).ok === false);
  ok("끝난 건을 되살리는 길이 없다",
     W.amDealMoves("fee_done", "admin").length === 0, W.amDealMoves("fee_done", "admin"));
}

console.log("\n" + (bad ? "❌ " + bad + "/" + ran + " 실패" : "✅ " + ran + "개 전부 통과") + "\n");
process.exit(bad ? 1 : 0);
