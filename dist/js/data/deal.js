

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
    say:"폐업 — 정리하려고 합니다" }
];
window.amSide = function(key){
  var L = window.AM_SIDES, i;
  for(i = 0; i < L.length; i++) if(L[i].key === key) return L[i];
  return null;
};

window.amSideName = function(key){
  var s = window.amSide(key);
  return s ? s.name : "";
};
