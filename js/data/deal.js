/* ════════════════════════════════════════════════════════════════════
   신청 한 건의 상태 열둘 · 누가 어디로 옮길 수 있는가 (지시서 §8)

   ⚠️⚠️ **key 를 바꾸지 마세요.** 영업 상태 아홉(sales.js)과 같은
   까닭입니다 — 이 값이 DB 행과 감사 기록에 그대로 남습니다. 이름만
   바꾸세요. (DB 쪽 값과 어긋나면 빌드가 멈춥니다 — checkDeal())

   ── 이 파일이 지키는 것 ─────────────────────────────────
   § 8  "고객과 업체, 관리자는 자신의 권한에 맞는 상태만 조회하거나
        변경할 수 있다"
   § 8  "모든 중요한 상태 변경에는 변경자, 변경일시, 사유를 기록한다"
   § 8  "업체가 계약 완료를 신고하더라도 **자동으로 수수료를 확정하지
        않는다**"
   §13  "계약이 성사되지 않았는데 수수료가 확정된 것처럼 처리하지 않음"
   §13  "실제 정산 시스템 구축 전 가짜 결제·정산 완료 상태 생성 금지"

   ⚠️⚠️ 마지막 둘이 이 파일의 존재 이유입니다. 업체가 "계약했습니다"
   를 누르면 상태는 **계약 완료(signed)** 까지만 갑니다. 거기서
   **정산 대기(fee_wait)** 로 넘기는 길은 **관리자 하나**이고, 증빙을
   본 뒤입니다. 그리고 **정산 완료(fee_done)** 는 **실제 입금액이 적혀
   있어야만** 됩니다 — 적혀 있지 않으면 amDealMove() 가 거절합니다.
   ════════════════════════════════════════════════════════════════════ */

/* ── 역할 넷 ─────────────────────────────────────────────────
   ⚠️ `staff`(직원)와 `admin`(관리자)을 갈라 둔 까닭 — 영업 직원이
   배정까지는 하지만 **돈을 확정하지는 못해야** 합니다. 한 사람이
   계약을 따고 수수료까지 확정하면 아무도 교차 확인을 안 합니다. */
window.AM_ROLES = [
  { key:"customer", name:"고객",     lead:"신청하신 사장님" },
  { key:"provider", name:"입점업체", lead:"배정받은 업체" },
  { key:"staff",    name:"직원",     lead:"영업·접수 담당" },
  { key:"admin",    name:"관리자",   lead:"증빙 확인과 정산 승인" }
];

/* ── 상태 열둘 (§8 의 차례 그대로) ───────────────────────────
   who   : 이 상태를 **볼 수 있는** 역할
   money : 이 상태가 **수수료와 관련된 것인가** (true 면 관리자만 옮깁니다)
   end   : 더 갈 곳이 없는 상태 */
window.AM_DEAL_ST = [
  { key:"new",      n:1,  name:"신청 접수",         lead:"접수되었습니다. 내용을 확인하고 있습니다.",
    /* ⚠️ 아직 업체가 정해지지 않았습니다 — provider 가 없습니다 */
    who:["customer","staff","admin"] },
  { key:"check",    n:2,  name:"정보 확인 중",      lead:"적어 주신 내용을 확인하고 있습니다.",
    who:["customer","staff","admin"] },
  { key:"assigned", n:3,  name:"업체 배정",         lead:"조건에 맞는 업체에 요청을 보냈습니다.",
    who:["customer","provider","staff","admin"] },
  { key:"accepted", n:4,  name:"업체 수락",         lead:"업체가 요청을 받았습니다.",
    who:["customer","provider","staff","admin"] },
  { key:"consult",  n:5,  name:"상담 진행",         lead:"업체가 상담을 진행하고 있습니다.",
    who:["customer","provider","staff","admin"] },
  { key:"quoted",   n:6,  name:"견적 전달",         lead:"업체가 견적을 전달했습니다.",
    who:["customer","provider","staff","admin"] },
  { key:"nego",     n:7,  name:"계약 협의",         lead:"조건을 협의하고 있습니다.",
    who:["customer","provider","staff","admin"] },
  { key:"signed",   n:8,  name:"계약 완료",         lead:"계약이 체결되었습니다.",
    who:["customer","provider","staff","admin"] },
  { key:"done",     n:9,  name:"서비스 완료",       lead:"설치·이행이 끝났습니다.",
    who:["customer","provider","staff","admin"] },
  { key:"lost",     n:10, name:"취소 · 실패",        lead:"이 건은 진행되지 않았습니다.",
    who:["customer","provider","staff","admin"], end:true },
  /* ⚠️⚠️ 아래 둘은 **돈** 입니다. 고객 화면에 내지 않습니다 — 손님에게
     "정산" 은 우리와 업체 사이의 일이고, 보여 주면 자기 돈으로 읽힙니다. */
  { key:"fee_wait", n:11, name:"정산 대기",         lead:"수수료가 확정되어 정산을 기다립니다.",
    who:["provider","admin"], money:true },
  { key:"fee_done", n:12, name:"정산 완료",         lead:"입금이 확인되었습니다.",
    who:["provider","admin"], money:true, end:true }
];

/* ── 옮길 수 있는 길 ─────────────────────────────────────────
   [어디서, 어디로, 누가 옮길 수 있나, 무엇을 같이 적어야 하나]

   ⚠️⚠️ **여기에 없는 길은 못 갑니다.** 지어내지 말고 여기에 적으세요.
   ⚠️⚠️ `money:true` 인 상태로 들어가는 길은 **admin 하나**입니다 —
   checkDeal() 이 빌드마다 그것을 봅니다 (§8 · §13). */
window.AM_DEAL_MOVE = [
  ["new",      "check",    ["staff","admin"]],
  ["new",      "lost",     ["staff","admin","customer"], ["why"]],
  ["check",    "assigned", ["staff","admin"],            ["providerId","agree3rd"]],
  ["check",    "lost",     ["staff","admin","customer"], ["why"]],
  /* 업체가 거절하면 **실패가 아니라 다시 배정**입니다 — 손님 쪽에서
     보면 아직 진행 중인 건입니다 */
  ["assigned", "accepted", ["provider"]],
  ["assigned", "check",    ["provider","staff","admin"], ["why"]],
  ["assigned", "lost",     ["staff","admin","customer"], ["why"]],
  ["accepted", "consult",  ["provider"]],
  ["accepted", "lost",     ["staff","admin","customer"], ["why"]],
  ["consult",  "quoted",   ["provider"]],
  ["consult",  "lost",     ["staff","admin","customer"], ["why"]],
  ["quoted",   "nego",     ["provider","customer"]],
  ["quoted",   "lost",     ["staff","admin","customer"], ["why"]],
  /* ⚠️⚠️ 업체가 "계약했습니다" 를 누르는 자리입니다. 계약금액을 같이
     적게 합니다 — 안 받으면 수수료를 계산할 근거가 없습니다.
     ⚠️ 여기서 수수료는 **확정되지 않습니다** (§8 마지막 문장). */
  ["nego",     "signed",   ["provider","staff","admin"], ["amount"]],
  ["nego",     "lost",     ["staff","admin","customer"], ["why"]],
  ["signed",   "done",     ["provider","staff","admin"]],
  ["signed",   "lost",     ["admin"],                    ["why"]],
  /* ⚠️⚠️ **수수료가 확정되는 유일한 길** — 관리자만, 증빙을 보고.
     `proof` 는 계약 완료 증빙(§9 "계약 완료 증빙 확인")입니다. */
  ["done",     "fee_wait", ["admin"],                    ["proof","feeId"]],
  ["done",     "lost",     ["admin"],                    ["why"]],
  /* ⚠️⚠️ **실제 입금액이 적혀 있어야만** 됩니다 (§13 가짜 정산 금지) */
  ["fee_wait", "fee_done", ["admin"],                    ["paid"]],
  /* 환수 · 취소 (§9 "취소·환불·환수 조건") */
  ["fee_wait", "lost",     ["admin"],                    ["why"]]
];

/* ── 읽기 ─────────────────────────────────────────────────── */
window.amDealSt = function(key){
  var L = window.AM_DEAL_ST, i;
  for(i = 0; i < L.length; i++) if(L[i].key === key) return L[i];
  return null;
};

window.amDealStName = function(key){
  var s = window.amDealSt(key);
  return s ? s.name : "";
};

/* 이 역할이 이 상태를 볼 수 있는가 (§8 "자신의 권한에 맞는 상태만 조회") */
window.amDealCanSee = function(key, role){
  var s = window.amDealSt(key);
  if(!s) return false;
  if(role === "admin") return true;
  return s.who.indexOf(role) >= 0;
};

/* 이 역할이 여기서 갈 수 있는 길들 */
window.amDealMoves = function(from, role){
  return (window.AM_DEAL_MOVE || []).filter(function(m){
    return m[0] === from && m[2].indexOf(role) >= 0;
  });
};

/* ── 옮기기 ───────────────────────────────────────────────────
   ⚠️⚠️ **여기가 §8 을 기계로 지키는 자리입니다.** 변경자 · 사유 ·
   필요한 값이 없으면 **거절합니다.** 돌려주는 것은 "되는가" 가
   아니라 **왜 안 되는가**까지입니다 — 화면이 손님에게 그대로 적을 수
   있어야 합니다.

   ctx : { by, role, why, amount, paid, proof, providerId, agree3rd, feeId }
   돌려주는 것 : { ok:true, log:{...} }  또는  { ok:false, why:"..." } */
window.amDealMove = function(from, to, ctx){
  ctx = ctx || {};
  if(!window.amDealSt(from)) return { ok:false, why:"없는 상태입니다 — " + from };
  if(!window.amDealSt(to))   return { ok:false, why:"없는 상태입니다 — " + to };
  if(from === to)            return { ok:false, why:"같은 상태입니다" };

  var ok = (window.AM_DEAL_MOVE || []).filter(function(m){
    return m[0] === from && m[1] === to;
  });
  if(!ok.length)
    /* ⚠️ 변수 뒤에 조사를 붙이지 않습니다 — 상태 이름이 "취소 · 실패"
       처럼 가운뎃점으로 끝나면 "취소 · 실패 에서" 가 됩니다 (이 저장소가
       "원상복구 에서" 로 겪은 자리). 화살표로 받습니다. */
    return { ok:false, why:"갈 수 없는 길입니다 — " +
      window.amDealStName(from) + " → " + window.amDealStName(to) };

  var move = ok[0];
  if(move[2].indexOf(ctx.role) < 0)
    return { ok:false, why:"이 변경은 " +
      move[2].map(function(r){ return window.amRoleName(r); }).join(" · ") +
      " 만 할 수 있습니다" };

  /* §8 "변경자, 변경일시, 사유를 기록한다" — 변경자가 없으면 기록이
     아닙니다. ⚠️ 나중에 "누가 바꿨지" 를 물을 수 없는 기록은 없는
     기록과 같습니다. */
  if(!ctx.by) return { ok:false, why:"누가 바꾸는지가 없습니다" };

  var need = move[3] || [], miss = [], i, k;
  for(i = 0; i < need.length; i++){
    k = need[i];
    /* ⚠️ `0` 은 값입니다 — 계약금액 0 과 입금액 0 은 "적지 않은 것" 이
       아닙니다 (권리금 "무권리" 에서 겪은 자리). `!x` 로 보면 사라집니다. */
    if(ctx[k] === undefined || ctx[k] === null || ctx[k] === "") miss.push(k);
  }
  if(miss.length)
    return { ok:false, why:"같이 적어야 하는 것이 빠졌습니다 — " +
      miss.map(function(x){ return window.AM_DEAL_NEED[x] || x; }).join(" · ") };

  /* ⚠️⚠️ 제3자 제공 재동의 (개인정보보호법 제17조 제2항).
     배정은 "업체에게 손님 연락처를 넘기는 일" 입니다. 접수 단계의
     동의에는 그것이 **포함되지 않습니다** — 방침 제4조 제3항이 그렇게
     적혀 있습니다. 동의 없이 배정하면 그 자리에서 법 위반입니다. */
  if(to === "assigned" && ctx.agree3rd !== true)
    return { ok:false, why:"업체에 연락처를 전달하는 별도 동의를 받지 못했습니다" };

  return { ok:true, log:{
    from:from, to:to, by:ctx.by, role:ctx.role,
    at:new Date().toISOString(),
    why:ctx.why || ""
  }};
};

/* 빠진 값의 이름 — 화면에 그대로 나갑니다 */
window.AM_DEAL_NEED = {
  why:        "사유",
  amount:     "계약금액",
  paid:       "실제 입금액",
  proof:      "계약 완료 증빙",
  providerId: "배정할 업체",
  agree3rd:   "제3자 제공 동의",
  feeId:      "적용할 수수료 정책"
};

window.amRoleName = function(key){
  var L = window.AM_ROLES || [], i;
  for(i = 0; i < L.length; i++) if(L[i].key === key) return L[i].name;
  return key;
};
