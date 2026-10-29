

window.AM_DEV_ST = [
  { key:"waiting",  n:1, name:"매입 대기",   tone:"gray",
    lead:"신청은 받았고 기기가 아직 안 왔습니다." },
  { key:"arrived",  n:2, name:"입고",        tone:"blue",
    lead:"기기가 도착했습니다. 검수를 기다립니다." },
  { key:"checking", n:3, name:"검수 중",     tone:"blue",
    lead:"전원 · 액정 · 배터리 · 기능을 확인하고 있습니다." },

  { key:"regrade",  n:4, name:"금액 재협의", tone:"warn",
    lead:"적어 주신 상태와 달라서, 다시 알려 드리고 동의를 기다립니다." },
  { key:"checked",  n:5, name:"검수 완료",   tone:"ok",
    lead:"등급이 정해졌고 매입가가 확정됐습니다." },
  { key:"listed",   n:6, name:"판매 중",     tone:"blue",
    lead:"쇼핑몰에 올라가 있습니다." },
  { key:"sold",     n:7, name:"판매 완료",   tone:"ok", end:true,
    lead:"팔렸습니다. 여기서 실제 수익이 정해집니다." },

  { key:"returning",n:8, name:"반송",        tone:"gray", end:true, off:true,
    lead:"매입하지 않고 기기를 돌려 드립니다." },
  { key:"scrapped", n:9, name:"폐기",        tone:"gray", end:true, off:true,
    lead:"팔 수 없어 폐기했습니다. 매입원가가 그대로 손실입니다." }
];

window.AM_DEV_MOVE = [
  ["waiting",  "arrived",   "staff"],
  ["waiting",  "returning", "staff"],
  ["arrived",  "checking",  "staff"],
  ["arrived",  "returning", "staff"],
  ["checking", "checked",   "staff"],
  ["checking", "regrade",   "staff"],
  ["checking", "returning", "staff"],
  ["regrade",  "checked",   "staff"],
  ["regrade",  "returning", "staff"],
  ["checked",  "listed",    "staff"],
  ["checked",  "scrapped",  "admin"],
  ["listed",   "sold",      "staff"],
  ["listed",   "checked",   "staff"],
  ["listed",   "scrapped",  "admin"]
];

window.AM_DEV_NEED = {
  checked:   ["grade", "cost"],
  regrade:   ["why"],
  listed:    ["price"],
  sold:      ["soldPrice"],
  returning: ["why"],
  scrapped:  ["why"]
};

window.AM_DEV_COST = [
  { key:"inbound",  name:"수거 · 입고 배송" },
  { key:"repair",   name:"수리 · 부품" },
  { key:"clean",    name:"세척 · 소모품" },
  { key:"outbound", name:"판매 배송" },
  { key:"fee",      name:"결제 · 판매 수수료" },
  { key:"etc",      name:"그 밖" }
];

window.amDevSt = function(k){
  return (window.AM_DEV_ST||[]).filter(function(x){ return x.key === k; })[0] || null; };
window.amDevStName = function(k){ var s = window.amDevSt(k); return s ? s.name : k; };
window.amDevTone = function(k){ var s = window.amDevSt(k); return s ? s.tone : "gray"; };

window.amDevSold = function(k){ return k === "sold"; };
window.amDevOff  = function(k){ var s = window.amDevSt(k); return !!(s && s.off); };

window.amDevCan = function(from, to, role){
  if(role !== "staff" && role !== "admin") return { ok:false, why:"권한이 없습니다" };
  var hit = (window.AM_DEV_MOVE||[]).filter(function(m){
    return m[0] === from && m[1] === to; })[0];
  if(!hit) return { ok:false, why:"갈 수 없는 길입니다 — " +
    window.amDevStName(from) + " → " + window.amDevStName(to) };
  if(hit[2] === "admin" && role !== "admin")
    return { ok:false, why:"관리자만 할 수 있습니다" };
  return { ok:true, need:(window.AM_DEV_NEED||{})[to] || [] };
};

window.amDevProfit = function(d){
  var cost  = Number(d && d.cost || 0);
  var extra = (d && d.costs || []).reduce(function(a, c){
    return a + Number(c.amount || 0); }, 0);
  var spent = cost + extra;
  var ask   = (d && d.price != null) ? Number(d.price) : null;
  var got   = (d && d.sold_price != null) ? Number(d.sold_price) : null;
  return {
    spent: spent,

    est:  ask != null ? (ask - spent) : null,

    real: (got != null && d.state === "sold") ? (got - spent) : null
  };
};
