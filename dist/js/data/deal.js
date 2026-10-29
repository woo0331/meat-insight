

window.AM_ROLES = [
  { key:"customer", name:"고객",     lead:"신청하신 사장님" },
  { key:"provider", name:"입점업체", lead:"배정받은 업체" },
  { key:"staff",    name:"직원",     lead:"영업·접수 담당" },
  { key:"admin",    name:"관리자",   lead:"증빙 확인과 정산 승인" }
];

window.AM_DEAL_ST = [
  { key:"new",      n:1,  name:"신청 접수",         lead:"접수되었습니다. 내용을 확인하고 있습니다.",

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
    who:["customer","provider","staff","admin"], end:true, off:true },

  { key:"hold",     n:11, name:"보류",              lead:"잠시 멈춰 두었습니다. 다시 진행하실 수 있습니다.",
    who:["customer","provider","staff","admin"], off:true },

  { key:"fee_wait", n:12, name:"정산 대기",         lead:"수수료가 확정되어 정산을 기다립니다.",
    who:["provider","admin"], money:true },
  { key:"fee_done", n:13, name:"정산 완료",         lead:"입금이 확인되었습니다.",
    who:["provider","admin"], money:true, end:true }
];

window.AM_DEAL_MOVE = [
  ["new",      "check",    ["staff","admin"]],
  ["new",      "lost",     ["staff","admin","customer"], ["why"]],
  ["check",    "assigned", ["staff","admin"],            ["providerId","agree3rd"]],
  ["check",    "lost",     ["staff","admin","customer"], ["why"]],

  ["assigned", "accepted", ["provider"]],
  ["assigned", "check",    ["provider","staff","admin"], ["why"]],
  ["assigned", "lost",     ["staff","admin","customer"], ["why"]],
  ["accepted", "consult",  ["provider"]],
  ["accepted", "lost",     ["staff","admin","customer"], ["why"]],
  ["consult",  "quoted",   ["provider"]],
  ["consult",  "lost",     ["staff","admin","customer"], ["why"]],
  ["quoted",   "nego",     ["provider","customer"]],
  ["quoted",   "lost",     ["staff","admin","customer"], ["why"]],

  ["nego",     "signed",   ["provider","staff","admin"], ["amount"]],
  ["nego",     "lost",     ["staff","admin","customer"], ["why"]],
  ["signed",   "done",     ["provider","staff","admin"]],
  ["signed",   "lost",     ["admin"],                    ["why"]],

  ["done",     "fee_wait", ["admin"],                    ["proof","feeId"]],
  ["done",     "lost",     ["admin"],                    ["why"]],

  ["fee_wait", "fee_done", ["admin"],                    ["paid"]],

  ["fee_wait", "lost",     ["admin"],                    ["why"]],

  ["new",      "hold",     ["staff","admin","customer"], ["why"]],
  ["check",    "hold",     ["staff","admin","customer"], ["why"]],
  ["assigned", "hold",     ["staff","admin","customer"], ["why"]],
  ["accepted", "hold",     ["staff","admin","customer"], ["why"]],
  ["consult",  "hold",     ["staff","admin","customer"], ["why"]],
  ["quoted",   "hold",     ["staff","admin","customer"], ["why"]],
  ["nego",     "hold",     ["staff","admin","customer"], ["why"]],

  ["hold",     "check",    ["staff","admin"]],
  ["hold",     "lost",     ["staff","admin","customer"], ["why"]]
];

window.amDealSt = function(key){
  var L = window.AM_DEAL_ST, i;
  for(i = 0; i < L.length; i++) if(L[i].key === key) return L[i];
  return null;
};

window.amDealStName = function(key){
  var s = window.amDealSt(key);
  return s ? s.name : "";
};

window.amDealAfterSign = function(key){
  var s = window.amDealSt(key), g = window.amDealSt("signed");
  if(!s || !g || s.off) return false;
  return s.n >= g.n;
};

window.amDealCanSee = function(key, role){
  var s = window.amDealSt(key);
  if(!s) return false;
  if(role === "admin") return true;
  return s.who.indexOf(role) >= 0;
};

window.amDealMoves = function(from, role){
  return (window.AM_DEAL_MOVE || []).filter(function(m){
    return m[0] === from && m[2].indexOf(role) >= 0;
  });
};

window.amDealMove = function(from, to, ctx){
  ctx = ctx || {};
  if(!window.amDealSt(from)) return { ok:false, why:"없는 상태입니다 — " + from };
  if(!window.amDealSt(to))   return { ok:false, why:"없는 상태입니다 — " + to };
  if(from === to)            return { ok:false, why:"같은 상태입니다" };

  var ok = (window.AM_DEAL_MOVE || []).filter(function(m){
    return m[0] === from && m[1] === to;
  });
  if(!ok.length)

    return { ok:false, why:"갈 수 없는 길입니다 — " +
      window.amDealStName(from) + " → " + window.amDealStName(to) };

  var move = ok[0];
  if(move[2].indexOf(ctx.role) < 0)
    return { ok:false, why:"이 변경은 " +
      move[2].map(function(r){ return window.amRoleName(r); }).join(" · ") +
      " 만 할 수 있습니다" };

  if(!ctx.by) return { ok:false, why:"누가 바꾸는지가 없습니다" };

  var need = move[3] || [], miss = [], i, k;
  for(i = 0; i < need.length; i++){
    k = need[i];

    if(ctx[k] === undefined || ctx[k] === null || ctx[k] === "") miss.push(k);
  }
  if(miss.length)
    return { ok:false, why:"같이 적어야 하는 것이 빠졌습니다 — " +
      miss.map(function(x){ return window.AM_DEAL_NEED[x] || x; }).join(" · ") };

  if(to === "assigned" && ctx.agree3rd !== true)
    return { ok:false, why:"업체에 연락처를 전달하는 별도 동의를 받지 못했습니다" };

  return { ok:true, log:{
    from:from, to:to, by:ctx.by, role:ctx.role,
    at:new Date().toISOString(),
    why:ctx.why || ""
  }};
};

window.AM_DEAL_NEED = {
  why:        "사유",
  amount:     "계약금액",
  paid:       "실제 입금액",
  proof:      "계약 완료 증빙",
  providerId: "배정할 업체",
  agree3rd:   "제3자 제공 동의",
  feeId:      "적용할 수수료 정책"
};

window.AM_ASSIGN_ST = [
  { key:"sent",     name:"보냈습니다" },
  { key:"accepted", name:"업체가 받았습니다" },
  { key:"declined", name:"업체가 거절했습니다" }
];
window.amAssignName = function(key){
  var L = window.AM_ASSIGN_ST, i;
  for(i = 0; i < L.length; i++) if(L[i].key === key) return L[i].name;
  return "";
};

window.amDealTone = function(key){
  var s = window.amDealSt(key);
  if(!s)                return "gray";
  if(s.key === "hold")  return "warn";
  if(s.key === "lost")  return "gray";
  if(s.end)             return "ok";
  return "on";
};

window.amRoleName = function(key){
  var L = window.AM_ROLES || [], i;
  for(i = 0; i < L.length; i++) if(L[i].key === key) return L[i].name;
  return key;
};

window.AM_QUOTE_ST = [
  { key:"open",      name:"받은 견적",   tone:"on"   },
  { key:"chosen",    name:"고른 견적",   tone:"ok"   },
  { key:"passed",    name:"고르지 않음", tone:"gray" },
  { key:"withdrawn", name:"업체가 거둠", tone:"gray" }
];
window.amQuoteSt = function(key){
  var L = window.AM_QUOTE_ST, i;
  for(i = 0; i < L.length; i++) if(L[i].key === key) return L[i];
  return null;
};
window.amQuoteName = function(key){
  var s = window.amQuoteSt(key);
  return s ? s.name : "";
};
window.amQuoteTone = function(key){
  var s = window.amQuoteSt(key);
  return s ? s.tone : "gray";
};

window.AM_APPLY_ST = [
  { key:"new",    name:"새 신청",     tone:"on"   },
  { key:"called", name:"통화함",      tone:"warn" },
  { key:"done",   name:"등록 완료",   tone:"ok"   },
  { key:"drop",   name:"진행 안 함",  tone:"gray" }
];
window.amApplySt = function(key){
  var L = window.AM_APPLY_ST, i;
  for(i = 0; i < L.length; i++) if(L[i].key === key) return L[i];
  return null;
};
window.amApplyName = function(key){
  var s = window.amApplySt(key);
  return s ? s.name : "";
};
window.amApplyTone = function(key){
  var s = window.amApplySt(key);
  return s ? s.tone : "gray";
};

window.amQuoteVat = function(key){
  if(key === "incl") return "부가세 포함";
  if(key === "free") return "면세";
  return "부가세 별도";
};

window.AM_SIDES = [
  { key:"start",    name:"창업 · 시작",   short:"창업",   pick:"/startup#pick",
    say:"창업 — 시작하려고 합니다" },
  { key:"ops",      name:"운영",          short:"운영",   pick:"/operation#pick",
    say:"운영 — 장사하면서 필요합니다" },
  { key:"transfer", name:"인수 · 양도",   short:"양도양수", pick:"/transfer#pick",
    say:"인수 · 양도 — 매장을 받거나 넘깁니다" },
  { key:"close",    name:"폐업 · 정리",   short:"폐업",   pick:"/closure#pick",
    say:"폐업 — 정리하려고 합니다" },

  { key:"buyin",    name:"중고폰 · 직접 매입", short:"직접매입", pick:"/sell", pw:true,
    say:"중고폰 — 폰웨이가 바로 사는 것" },
  { key:"bid",      name:"중고폰 · 경쟁입찰", short:"경쟁입찰", pick:"/sell", pw:true,
    say:"중고폰 — 업체 경쟁입찰" }
];

window.AM_QUOTE_LABELS = {
  def: {
    amount:   "견적 금액 (원) *",
    amountHint:"⚠️ 이 금액이 고객 화면에 그대로 나갑니다. 0 원은 '무상' 으로 읽힙니다",
    scope:    "이 금액에 포함되는 것 *",
    scopeHint:"범위 없는 견적은 금액만 적힌 종이입니다",
    excludes: "별도로 드는 것",
    exHint:   "나중에 또 받게 되는 비용을 미리 적어 두면 분쟁이 줄어듭니다",
    days:     "예상 소요일",
    startOn:  "시작 가능일",
    warranty: "A/S · 보증",
    scopeRow: "포함 범위",
    exRow:    "별도",
    wsRow:    "A/S · 보증"
  },
  phone: {
    amount:   "매입 금액 (원) *",
    amountHint:"⚠️ 이 금액이 판매자 화면에 그대로 나갑니다. 검수 뒤 달라지면 먼저 알리셔야 합니다",
    scope:    "이 금액에 포함되는 것 *",
    scopeHint:"수거 방식(택배 · 방문) · 포장 · 택배비 부담을 같이 적어 주세요",
    excludes: "검수에서 차감될 수 있는 것",
    exHint:   "미리 적어 두시면 검수 뒤 다툴 일이 줄어듭니다",
    days:     "정산 소요일 (기기를 받은 뒤)",
    startOn:  "수거 가능일",
    warranty: "검수 기준 · 재검수",
    scopeRow: "수거 · 포함 조건",
    exRow:    "차감될 수 있는 것",
    wsRow:    "검수 기준"
  }
};

window.amQuoteLabels = function(side){
  var L = window.AM_QUOTE_LABELS || {};
  return (side === "buyin" || side === "bid") ? (L.phone || L.def || {}) : (L.def || {});
};

window.amSide = function(key){
  var L = window.AM_SIDES, i;
  for(i = 0; i < L.length; i++) if(L[i].key === key) return L[i];
  return null;
};

window.amSideName = function(key){
  var s = window.amSide(key);
  return s ? s.name : "";
};
