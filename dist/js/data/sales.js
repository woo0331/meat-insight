

window.AM_SALES_GROUPS = [
  { key:"estate", no:"01", name:"점포 · 부동산", prio:2,
    cats:["store", "area", "transfer"],
    find:["상가 전문 공인중개", "점포 임대 중개", "상권분석", "권리금 중개"] },

  { key:"interior", no:"02", name:"인테리어 · 시공", prio:1,
    cats:["interior"],
    find:["상업 인테리어", "음식점 인테리어", "카페 인테리어", "미용실 인테리어",
          "사무실 인테리어", "전기공사", "설비", "간판"] },

  { key:"demolish", no:"03", name:"철거 · 원상복구", prio:1,
    cats:["demolish", "restore"],
    find:["매장 철거", "부분 철거", "원상복구", "집기 철거", "폐기물 처리"] },

  { key:"equip", no:"04", name:"시설 · 장비 · 수리", prio:1,
    cats:["equip", "furniture", "repair"],
    find:["주방설비", "냉장 냉동장비", "업소용 장비", "중고 주방기기",
          "업소용 가구", "음향 영상"] },

  { key:"it", no:"05", name:"POS · IT · 보안", prio:1,
    cats:["it"],
    find:["POS 대리점", "키오스크", "테이블오더", "CCTV 설치", "매장 인터넷"] },

  { key:"tax", no:"06", name:"세무 · 회계", prio:2,
    cats:["tax"],

    subs:[["admin", "tax-agent"], ["admin", "biz-reg"]],
    find:["세무사 사무실", "기장 대행", "부가세 신고", "폐업 세무"] },

  { key:"labor", no:"07", name:"노무 · 인사", prio:3,
    cats:["labor", "staff"],
    subs:[["admin", "labor-agent"]],
    find:["노무사 사무실", "급여 대행", "4대보험 업무대행"] },

  { key:"marketing", no:"08", name:"마케팅 · 디자인", prio:2,
    cats:["marketing"],
    find:["매장 마케팅 대행", "플레이스 관리", "블로그 대행", "메뉴판 디자인",
          "매장 촬영", "브랜딩"] },

  { key:"clean", no:"09", name:"청소 · 방역 · 관리", prio:2,
    cats:["clean"],
    find:["입주청소", "매장 정기청소", "주방 후드청소", "방역", "해충방제"] },

  { key:"supply", no:"10", name:"식자재 · 운영공급", prio:3,
    cats:["supply"],
    find:["식자재 납품", "육류 납품", "음료 총판", "포장용기", "유니폼"] },

  { key:"legal", no:"11", name:"행정 · 법률 · 전문가", prio:3,
    cats:["admin", "law", "contract"],
    find:["행정사 사무소", "인허가 대행", "법무사", "임대차 분쟁 변호사"] },

  { key:"fund", no:"12", name:"금융 · 보험 · 지원", prio:3,
    cats:["fund"],
    find:["사업자 보험", "정책자금 컨설팅", "정부지원사업 컨설팅"] },

  { key:"closing", no:"13", name:"폐업 · 정리", prio:1,
    cats:["process", "asset", "stock", "waste", "support"],
    find:["폐업 대행", "중고 주방기기 매입", "시설 매입", "재고 처분",
          "사업장 폐기물"] },

  { key:"etc", no:"14", name:"기타", prio:3, etc:true, cats:[],
    find:["프랜차이즈 본사", "창업 컨설팅"] }
];

window.amSalesEtcCats = function(){
  var taken = {};
  (window.AM_SALES_GROUPS || []).forEach(function(g){
    if(!g.etc) (g.cats || []).forEach(function(k){ taken[k] = 1; });
  });
  return (window.AM_CATS || [])
    .filter(function(c){ return !taken[c.key]; })
    .map(function(c){ return c.key; });
};

window.amSalesCats = function(g){
  if(!g) return [];
  return g.etc ? amSalesEtcCats() : (g.cats || []).slice();
};

window.amSalesGroup = function(key){
  var L = window.AM_SALES_GROUPS || [];
  for(var i = 0; i < L.length; i++) if(L[i].key === key) return L[i];
  return null;
};

window.amSalesGroupName = function(key){
  var g = amSalesGroup(key);
  return g ? g.name : "";
};

window.amSalesGroupOfCat = function(catKey){
  var L = window.AM_SALES_GROUPS || [], i;
  for(i = 0; i < L.length; i++)
    if(!L[i].etc && (L[i].cats || []).indexOf(catKey) >= 0) return L[i];
  for(i = 0; i < L.length; i++)
    if(L[i].etc && amSalesEtcCats().indexOf(catKey) >= 0) return L[i];
  return null;
};

window.amSalesServiceNames = function(g, limit){
  var out = [], seen = {};
  function push(s){ if(s && !seen[s]){ seen[s] = 1; out.push(s); } }

  amSalesCats(g).forEach(function(k){
    var c = window.amCat ? amCat(k) : null;
    if(!c) return;
    push(c.name);
    (c.items || []).forEach(function(it){ push(it.name); });
  });
  (g.subs || []).forEach(function(p){
    var c = window.amCat ? amCat(p[0]) : null;
    if(!c) return;
    (c.items || []).forEach(function(it){ if(it.key === p[1]) push(it.name); });
  });

  return limit ? out.slice(0, limit) : out;
};

window.amSalesProviderN = function(g){
  var n = 0;
  amSalesCats(g).forEach(function(k){
    var c = window.amCat ? amCat(k) : null;
    if(c && window.amProvidersInCat) n += amProvidersInCat(c);
  });
  return n;
};

window.amSalesMainCat = function(g){
  var ks = amSalesCats(g), i, c;
  for(i = 0; i < ks.length; i++){
    c = window.amCat ? amCat(ks[i]) : null;
    if(c && c.kind === "provider") return c.key;
  }
  for(i = 0; i < (g && g.subs || []).length; i++){
    c = window.amCat ? amCat(g.subs[i][0]) : null;
    if(c && c.kind === "provider") return c.key;
  }
  return "";
};

window.AM_SALES_ST = [
  { key:"new",    name:"연락전",   tone:"gray" },
  { key:"recall", name:"재연락",   tone:"warn" },
  { key:"warm",   name:"관심",     tone:"fire" },
  { key:"sent",   name:"입점제안", tone:"blue",  join:true },
  { key:"doc",    name:"자료대기", tone:"blue",  join:true },
  { key:"review", name:"검토필요", tone:"warn",  join:true },
  { key:"done",   name:"입점완료", tone:"ok",    join:true },
  { key:"no",     name:"관심없음", tone:"off" },
  { key:"bad",    name:"번호오류", tone:"off" }
];

window.amSalesStName = function(key){
  var L = window.AM_SALES_ST, i;
  for(i = 0; i < L.length; i++) if(L[i].key === key) return L[i].name;
  return key || "";
};
window.amSalesStTone = function(key){
  var L = window.AM_SALES_ST, i;
  for(i = 0; i < L.length; i++) if(L[i].key === key) return L[i].tone;
  return "gray";
};

window.AM_SALES_RESULT = [
  { key:"warm",   name:"관심있음",  ic:"fire",     st:"warm" },
  { key:"recall", name:"다시 연락", ic:"clock",    st:"recall" },
  { key:"miss",   name:"부재중",    ic:"phone",    st:"recall" },
  { key:"no",     name:"관심없음",  ic:"x",        st:"no" },
  { key:"bad",    name:"번호오류",  ic:"alert",    st:"bad" }
];

window.AM_SALES_WHY = [
  "필요 없음", "기존 광고 충분", "플랫폼 설명 후 거절",
  "비용 관련", "나중에 검토", "기타"
];

window.AM_SALES_WHEN = [
  { key:"1",  name:"내일",    d:1 },
  { key:"3",  name:"3일 후",  d:3 },
  { key:"7",  name:"1주 후",  d:7 }
];

window.AM_SALES_DOC = [
  { key:"basic",  name:"기본정보 (업체명 · 지역)" },
  { key:"tel",    name:"연락처 · 담당자" },
  { key:"svc",    name:"전문 서비스 · 가능 지역" },
  { key:"intro",  name:"회사소개" },
  { key:"logo",   name:"로고 · 대표사진" },
  { key:"folio",  name:"포트폴리오" },
  { key:"verify", name:"사업자 확인자료" }
];
