

window.AM_PICK_SIDE = { startup:"start", closure:"close" };

window.AM_PICK_OFF = ["item", "store", "process", "support"];

window.AM_PICK_TOP = {
  startup: ["area", "interior", "equip", "admin", "fund", "marketing"]
};

window.AM_PICK_IND = {
  startup: {

    restaurant: ["interior", "equip", "admin", "it", "staff", "supply"],
    cafe:       ["interior", "equip", "it", "admin", "marketing", "area"],

    bar:        ["admin", "interior", "equip", "it", "area", "marketing"],

    hair:       ["interior", "equip", "staff", "admin", "marketing", "area"],
    beauty:     ["interior", "equip", "admin", "marketing", "it", "area"],

    gym:        ["area", "interior", "equip", "staff", "it", "marketing"],

    academy:    ["admin", "area", "interior", "staff", "marketing", "it"],
    pet:        ["admin", "interior", "equip", "supply", "marketing", "area"],

    retail:     ["area", "furniture", "admin", "supply", "it", "interior"],

    unmanned:   ["equip", "it", "area", "interior", "admin", "clean"],

    stay:       ["admin", "interior", "equip", "staff", "it", "marketing"],

    office:     ["area", "interior", "furniture", "it", "admin", "marketing"],

    online:     ["it", "admin", "marketing", "supply", "interior", "fund"]
  }
};

window.AM_PICK_QUICK = {

  startup:   ["interior/interior", "interior/sign", "admin/permit",
              "admin/tax-agent", "it/pos", "marketing/open-mkt"],

  operation: ["it/internet", "it/pos", "repair/aircon-fix", "staff/fulltime",
              "supply/consumable", "admin/tax-agent"],

  closure:   ["transfer/store-transfer", "asset/furniture", "demolish/full",
              "restore/shop-restore", "waste/biz-waste", "tax/close-report"],

  transfer:  ["transfer/store-transfer", "transfer/premium", "law/lease",
              "repair/check-up", "it/pos", "asset/furniture"]
};

window.amPickQuick = function(hallKey){
  return ((window.AM_PICK_QUICK || {})[hallKey] || [])
    .map(window.amPickOne).filter(Boolean);
};

window.AM_PICK_EASY = {
  "area":      "가게 자리 알아보기",
  "interior":  "가게 인테리어",

  "equip":     "매장 기계 · 설비",
  "admin":     "사업자 등록 · 허가",
  "fund":      "창업 자금 · 대출",
  "marketing": "마케팅 · 홍보",
  "item":      "무엇을 팔지 정하기",
  "store":     "가게 자리 찾기",
  "furniture": "매장 가구 · 집기",
  "it":        "POS · 인터넷 · CCTV",
  "supply":    "재료 · 소모품 들이기",
  "repair":    "기계 고치기 · 점검",
  "staff":     "직원 구하기",
  "clean":     "청소 · 방역"
};

var PICK_ART = {

  furniture: "sofa"
};

function catSubTo(c, sub){
  var base = (typeof window.catTo === "function") ? window.catTo(c)
    : (c.to ? c.to : ((c.kind === "provider")
        ? "/providers/" + c.key : "/c/" + c.key));
  if(!sub) return base;
  return base + (base.indexOf("?") < 0 ? "?" : "&") + "s=" + encodeURIComponent(sub);
}

function pickArtOf(cat){
  var hit = PICK_ART[cat] || "";
  (window.AM_HALLS || []).forEach(function(h){
    (h.items || []).forEach(function(it){
      if(!hit && it.cat === cat && it.ia) hit = it.ia;
    });
  });
  return hit;
}

window.amPickSplit = function(id){
  var s = String(id || "").split("/");
  return { cat: s[0] || "", sub: (s.length > 1 ? s[1] : "") };
};

window.amPickSubs = function(catKey){
  var c = (typeof window.amCat === "function") ? window.amCat(catKey) : null;
  if(!c) return [];
  var subs = (typeof window.amAllSubs === "function")
    ? window.amAllSubs(c) : (c.items || []);
  var off = window.AM_PICK_OFF || [];
  var out = [];
  subs.forEach(function(s){
    if(!s || !s.key) return;
    if(off.indexOf(c.key + "/" + s.key) >= 0) return;
    out.push(window.amPickWrap(c, s));
  });
  return out;
};

window.amPickWrap = function(c, sub){
  if(!c) return null;
  if(sub && sub.key) return {
    id:   c.key + "/" + sub.key,
    cat:  c.key,
    sub:  sub.key,
    name: sub.name,
    easy: window.AM_PICK_EASY[c.key + "/" + sub.key] || "",
    lead: "",

    desc: c.name,
    ia:   pickArtOf(c.key),
    icon: (sub.icon || c.icon || "check"),
    tone: c.tone || "t7",
    to:   catSubTo(c, sub.key),
    ask:  !!(window.AM_REQ_FORMS && window.AM_REQ_FORMS[c.key])
  };
  return {
    id:   c.key,
    cat:  c.key,
    sub:  "",
    name: c.name,
    easy: window.AM_PICK_EASY[c.key] || "",
    lead: c.lead || "",
    desc: c.desc || "",
    ia:   pickArtOf(c.key),
    icon: c.icon || "check",
    tone: c.tone || "t7",
    to:   (typeof window.catTo === "function") ? window.catTo(c)
          : (c.to ? c.to : ((c.kind === "provider")
              ? "/providers/" + c.key : "/c/" + c.key)),

    ask:  !!(window.AM_REQ_FORMS && window.AM_REQ_FORMS[c.key])
  };
};

window.amPickAll = function(hallKey, industryKey){
  var side = (window.AM_PICK_SIDE || {})[hallKey];
  if(!side) return [];
  var cats = (typeof window.amCatsFor === "function")
    ? window.amCatsFor(industryKey || "", side)
    : (side === "close" ? (window.AM_CLOSE_CATS || []) : (window.AM_START_CATS || []));
  var off = window.AM_PICK_OFF || [];
  var seen = {}, out = [];
  cats.forEach(function(c){
    if(!c || !c.key || seen[c.key]) return;
    if(off.indexOf(c.key) >= 0) return;
    seen[c.key] = 1;
    out.push(window.amPickWrap(c));
  });
  return out;
};

window.amPickTop = function(hallKey, industryKey){
  var all = window.amPickAll(hallKey, industryKey);
  return window.amPickTopIds(hallKey, industryKey).map(function(id){
    return all.filter(function(s){ return s.id === id; })[0];
  }).filter(Boolean);
};

window.amPickTopIds = function(hallKey, industryKey){
  var byInd = ((window.AM_PICK_IND || {})[hallKey] || {})[industryKey || ""];
  return byInd || ((window.AM_PICK_TOP || {})[hallKey] || []);
};

window.amPickIndOn = function(hallKey, industryKey){
  return !!((window.AM_PICK_IND || {})[hallKey] || {})[industryKey || ""];
};

window.amPickRest = function(hallKey, industryKey){
  var ids = window.amPickTopIds(hallKey, industryKey);
  return window.amPickAll(hallKey, industryKey).filter(function(s){
    return ids.indexOf(s.id) < 0; });
};

window.amPickOne = function(id){
  if(!id) return null;
  var p = window.amPickSplit(id);
  var c = (typeof window.amCat === "function") ? window.amCat(p.cat) : null;
  if(!c) return null;
  if(!p.sub) return window.amPickWrap(c);

  var subs = (typeof window.amAllSubs === "function")
    ? window.amAllSubs(c) : (c.items || []);
  var hit = subs.filter(function(s){ return s && s.key === p.sub; })[0];
  return hit ? window.amPickWrap(c, hit) : null;
};

window.amPickLabel = function(s){
  return (s && (s.easy || s.name)) || "";
};

window.AM_PICK_GROUP = {
  operation: [
    { key:"ad",     name:"가게 광고 · 홍보",      ia:"marketing", tone:"sv1",
      lead:"플레이스 · SNS · 전단지까지",
      any:"marketing",
      subs:["marketing/place","marketing/sns","marketing/blog","marketing/review",
            "marketing/ad-agency","marketing/outdoor","marketing/flyer","marketing/crm"] },

    { key:"tax",    name:"세금 · 회계",          ia:"tax",       tone:"sv5",
      lead:"기장 · 신고 · 회계 프로그램",
      any:"admin/tax-agent",
      subs:["admin/tax-agent","it/acct-sw","it/sales-mgmt"] },

    { key:"people", name:"직원 구하기 · 노무 상담", ia:"staff",     tone:"sv4",
      lead:"채용 · 근로계약 · 4대보험",
      any:"staff",
      subs:["staff/fulltime","staff/parttime","staff/pro-staff","staff/headhunt",
            "staff/training","admin/labor-agent","it/hr-pay"] },

    { key:"fix",    name:"매장 기계 · 시설 수리",  ia:"repair",    tone:"sv3",
      lead:"냉장고 · 에어컨 · 전기 · 주방기기",
      any:"repair",
      subs:["repair/fridge-fix","repair/aircon-fix","repair/elec-fix","repair/kitchen-fix",
            "repair/coffee-fix","repair/ice-fix","repair/it-fix","repair/check-up",
            "repair/rental-care"] },

    { key:"pos",    name:"POS · 인터넷 · 카드 단말기", ia:"pos",   tone:"sv2",
      lead:"설치 · 교체 · 통신",
      any:"it",

      subs:["it/pos","it/payment","it/kiosk","it/table-order","it/cctv",
            "it/internet","it/phone","it/wifi","it/booking","it/waiting",
            "it/rental"] },

    { key:"goods",  name:"식자재 · 매장 물품",     ia:"supply",    tone:"sv6",
      lead:"거래처 · 포장재 · 소모품",
      any:"supply",
      subs:["supply/ingredient","supply/meat","supply/seafood","supply/produce",
            "supply/beverage","supply/coffee-bean","supply/bakery","supply/liquor",
            "supply/packaging","supply/disposable","supply/consumable",
            "supply/hygiene","supply/uniform","supply/office-sup"] },

    { key:"clean",  name:"매장 청소 · 방역",       ia:"clean",     tone:"t5",
      lead:"주방 · 에어컨 · 방역 · 해충",
      any:"clean",
      subs:["clean/kitchen-clean","clean/aircon","clean/disinfect","clean/pest",
            "clean/regular","clean/facility","clean/move-in"] },

    { key:"care",   name:"매장 보험 · 운영 상담",  ia:"shield",    tone:"t12",
      lead:"보험 · 법률 · 지원제도",
      any:"admin/insurance",
      subs:["admin/insurance","admin/legal","admin/admin-agent","admin/certify",
            "fund/policy-fund","fund/gov-program"] }
  ],

  closure: [
    { key:"pass",   name:"매장 넘기기",          ia:"handover", tone:"t13",
      lead:"권리금 · 인수자 찾기까지",
      any:"transfer",
      subs:["transfer/store-transfer","transfer/premium","transfer/equip-transfer",
            "transfer/find-buyer","transfer/fc-transfer"] },

    { key:"sell",   name:"시설 · 장비 팔기",      ia:"money",    tone:"t12",
      lead:"주방장비 · 냉장고 · 가구를 돈으로",
      any:"asset",
      subs:["asset/kitchen-eq","asset/fridge","asset/espresso","asset/furniture",
            "asset/pos","asset/kiosk","asset/fitness","asset/salon-eq","asset/biz-eq"] },

    { key:"stock",  name:"남은 재고 정리",        ia:"supply",   tone:"t2",
      lead:"식자재 · 상품 · 포장재",
      any:"stock",
      subs:["stock/ingredient","stock/goods","stock/packaging","stock/consumable",
            "stock/material","stock/etc-stock"] },

    { key:"demo",   name:"철거",                 ia:"demolish", tone:"sv4",
      lead:"전체 · 부분 · 주방 · 간판",
      any:"demolish",
      subs:["demolish/full","demolish/partial","demolish/kitchen",
            "demolish/sign","demolish/facility"] },

    { key:"back",   name:"원상복구",             ia:"restore",  tone:"sv1",
      lead:"빌려 쓰기 전 상태로 돌려놓기",
      any:"restore",
      subs:["restore/shop-restore","restore/electric","restore/plumbing","restore/gas",
            "restore/floor","restore/wall","restore/ceiling","restore/sign"] },

    { key:"waste",  name:"폐기물 버리기",         ia:"trash",    tone:"t7",
      lead:"사업장 폐기물 · 대형 · 전자제품",
      any:"waste",
      subs:["waste/biz-waste","waste/bulky","waste/furniture","waste/electronics",
            "waste/biz-eq","waste/recycle"] },

    { key:"report", name:"폐업 신고 · 세금",      ia:"tax",      tone:"sv5",
      lead:"신고 · 부가세 · 인허가 정리",
      any:"tax",
      subs:["tax/close-report","tax/vat","tax/income-tax","tax/biz-reg",
            "tax/permit","tax/consult"] },

    { key:"end",    name:"계약 해지 · 직원 정리",  ia:"contract", tone:"sv3",
      lead:"인터넷 · 렌탈 · 보험 · 퇴직금",
      any:"contract",
      subs:["contract/internet","contract/phone","contract/pos","contract/kiosk",
            "contract/rental","contract/water","contract/cctv","contract/security",
            "contract/insurance","labor/resign","labor/severance","labor/insurance4",
            "labor/contract-end","labor/consult"] }
  ],

  transfer: [
    { key:"pass",   name:"내 매장 넘기기",        ia:"handover", tone:"t13",
      lead:"권리금 · 인수자 찾기까지",
      any:"transfer",
      subs:["transfer/store-transfer","transfer/premium","transfer/equip-transfer",
            "transfer/find-buyer","transfer/fc-transfer"] },

    { key:"deal",   name:"계약 · 임대차 검토",    ia:"contract", tone:"t6",
      lead:"계약서 · 임대차 승계 · 분쟁",
      any:"admin/legal",
      subs:["admin/legal","admin/admin-agent","admin/certify",
            "law/lease","law/dispute","law/consult"] },

    { key:"asset",  name:"시설 · 장비 인계",      ia:"equip",    tone:"t12",
      lead:"주방장비 · 냉장고 · 가구",
      any:"asset",
      subs:["asset/kitchen-eq","asset/fridge","asset/espresso","asset/furniture",
            "asset/pos","asset/kiosk","asset/fitness","asset/salon-eq","asset/biz-eq"] },

    { key:"stock",  name:"재고 인계",            ia:"supply",   tone:"t2",
      lead:"식자재 · 상품 · 포장재",
      any:"stock",
      subs:["stock/ingredient","stock/goods","stock/packaging","stock/consumable",
            "stock/material","stock/etc-stock"] },

    { key:"sys",    name:"POS · 인터넷 승계",     ia:"pos",      tone:"sv2",
      lead:"명의 변경 · 재설치 · 교체",
      any:"it",
      subs:["it/pos","it/payment","it/kiosk","it/cctv","it/internet","it/phone"] },

    { key:"fix",    name:"인수 전 점검 · 손볼 것", ia:"repair",   tone:"sv3",
      lead:"시설 점검 · 부분 공사 · 간판 교체",
      any:"repair",
      subs:["repair/check-up","repair/elec-fix","repair/kitchen-fix","repair/it-fix",
            "interior/interior","interior/sign","interior/paint","interior/floor"] }
  ]
};

window.amPickGroups = function(hallKey){
  return ((window.AM_PICK_GROUP || {})[hallKey] || []).map(function(g){
    var any  = window.amPickOne(g.any);
    var subs = (g.subs || []).map(window.amPickOne).filter(Boolean);
    if(!any || !subs.length) return null;
    return {
      key:  g.key,
      name: g.name,
      lead: g.lead || "",
      ia:   g.ia || any.ia,
      tone: g.tone || any.tone,
      any:  any,
      subs: subs,

      ids:  [any.id].concat(subs.map(function(s){ return s.id; }))
            .filter(function(v, i, a){ return a.indexOf(v) === i; })
    };
  }).filter(Boolean);
};

window.amPickHallCats = function(hallKey){
  var seen = {}, out = [];
  var add = function(k){
    if(!k || seen[k]) return;
    if((window.AM_PICK_OFF || []).indexOf(k) >= 0) return;
    var s = window.amPickOne(k);
    if(!s || s.sub) return;
    seen[k] = 1; out.push(s);
  };
  ((window.amHall ? [window.amHall(hallKey)] : [])).forEach(function(h){
    if(h && h.key === hallKey) (h.items || []).forEach(function(it){ add(it.cat); });
  });
  ((window.AM_PICK_GROUP || {})[hallKey] || []).forEach(function(g){
    add(window.amPickSplit(g.any).cat);
    (g.subs || []).forEach(function(id){ add(window.amPickSplit(id).cat); });
  });
  if(hallKey === "operation"){
    (window.AM_OPSVC || []).forEach(function(g){
      (g.items || []).forEach(function(o){ add(o.cat); });
    });
    (window.AM_OPS || []).forEach(function(o){ add(o.cat); });
  }

  if(hallKey === "closure"){
    (window.AM_CLOSE_CATS || []).forEach(function(c){ add(c.key || c); });
  }
  return out;
};
