

window.AM_HALLS = [

  { key:"startup", name:"창업 준비", lead:"새로운 시작을 위한 모든 서비스",
    tone:"start", to:"/startup", ic:"seed",
    items:[

      { n:"상권 · 입지",   ia:"mappin",    cat:"area", tone:"sv1" },
      { n:"인테리어",      ia:"interior",  cat:"interior", tone:"sv2" },
      { n:"주방 · 설비",   ia:"kitchen",   cat:"equip", tone:"sv3" },
      { n:"인허가 · 행정", ia:"permit",    cat:"admin", sub:"permit", tone:"sv4" },
      { n:"세무 · 회계",   ia:"tax",       cat:"admin", sub:"tax-agent", tone:"sv5" },
      { n:"창업 자금",     ia:"money",     cat:"fund", tone:"sv6" },

      { n:"창업 아이템",   ia:"bulb",      cat:"item" },
      { n:"직원 채용",     ia:"staff",     cat:"staff" },
      { n:"창업비 계산",   ia:"calc",      to:"/tools/cost", tone:"t6" },
      { n:"상가 · 매물",   ia:"store",     cat:"store" },
      { n:"보험 · 안전",   ia:"shield",    cat:"admin", sub:"insurance" },
      { n:"POS · 결제",   ia:"pos",       cat:"it",    sub:"pos" },
      { n:"오픈 마케팅",   ia:"marketing", cat:"marketing", sub:"open-mkt" }
    ] },

  { key:"operation", name:"매장 운영", lead:"지금 더 잘되는 매장 관리 서비스",
    tone:"ops", to:"/operation", ic:"store",
    items:[

      { n:"마케팅 · 홍보", ia:"marketing", cat:"marketing" },
      { n:"세무 · 회계",   ia:"tax",       cat:"admin",  sub:"tax-agent" },
      { n:"직원 · 노무",   ia:"staff",     cat:"admin",  sub:"labor-agent" },
      { n:"매장 수리",     ia:"repair",    cat:"repair" },
      { n:"POS · 결제",   ia:"pos",       cat:"it",     sub:"pos" },

      { n:"운영 자금",     ia:"money",     cat:"fund" },

      { n:"식자재 · 원재료",ia:"supply",    cat:"supply", sub:"ingredient" },
      { n:"매출 관리",     ia:"chart",     cat:"it",     sub:"sales-mgmt" },
      { n:"보험",         ia:"shield",    cat:"admin",  sub:"insurance" },
      { n:"리모델링",      ia:"interior",  cat:"interior" },
      { n:"위생 관리",     ia:"clean",     cat:"clean" }
    ] },

  { key:"transfer", name:"매장 양도양수", lead:"매장 인수 · 양도부터 권리금까지",
    tone:"pass", to:"/transfer", ic:"handover",
    items:[

      { n:"매장 인수",     ia:"store",    to:"/stores",  tone:"t5" },
      { n:"매장 양도",     ia:"handover", to:"/sell-biz",    tone:"t13" },
      { n:"권리금 정보",   ia:"calc",     to:"/tools/premium", tone:"t6" },
      { n:"계약 · 행정",   ia:"contract", cat:"admin", sub:"legal" },
      { n:"시설 · 장비 인계",ia:"equip",   to:"/assets",  tone:"t12" },
      { n:"양도양수 상담", ia:"admin",    cat:"admin" },

      { n:"인수 점검",      ia:"permit",   to:"/transfer?t=in", tone:"t4" }
    ] },

  { key:"closure", name:"폐업 · 정리", lead:"깔끔한 마무리를 위한 정리 서비스",
    tone:"close", to:"/closure", ic:"boxes",
    items:[

      { n:"폐업 신고",     ia:"permit",   cat:"tax",  sub:"close-report" },

      { n:"철거 · 원상복구",ia:"demolish", cat:"demolish" },
      { n:"시설 · 장비 처분",ia:"equip",   to:"/assets?c=asset", tone:"t12" },
      { n:"재고 정리",     ia:"supply",   to:"/assets?c=stock", tone:"t2" },
      { n:"세금 정산",     ia:"tax",      cat:"tax" },
      { n:"지원제도 안내", ia:"money",    cat:"support" },

      { n:"폐기물 처리",   ia:"trash",    cat:"waste" },
      { n:"원상복구",      ia:"restore",  cat:"restore" },
      { n:"임대차 정리",   ia:"contract", cat:"law",  sub:"lease" },
      { n:"폐업비 계산",   ia:"calc",     to:"/tools/closecost", tone:"t6" }
    ] }
];

window.amHall = function(key){
  var L = window.AM_HALLS || [];
  for(var i=0;i<L.length;i++) if(L[i].key === key) return L[i];
  return L[0];
};

window.amHallTo = function(it){
  if(it.to) return it.to;
  var c = (window.AM_CATS||[]).filter(function(x){ return x.key === it.cat; })[0];
  if(!c) return "";
  var base = (typeof catTo === "function")
    ? catTo(c)
    : (c.to ? c.to : ((c.kind === "provider") ? "/providers/"+c.key : "/c/"+c.key));
  return it.sub ? (base + (base.indexOf("?") < 0 ? "?" : "&") + "s=" + it.sub) : base;
};
