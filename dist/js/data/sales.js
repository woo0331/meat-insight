

window.AM_SALES_GROUPS = [
  { key:"buyin", no:"01", name:"중고폰 매입점", prio:1,
    cats:["buyin"],
    find:["중고폰 매입", "휴대폰 매입", "폰 매입 전문", "중고 아이폰 매입",
          "갤럭시 매입", "태블릿 매입"] },

  { key:"broken", no:"02", name:"고장 · 파손폰 매입", prio:1,
    cats:["broken"],
    find:["액정파손 폰 매입", "고장폰 매입", "침수폰 매입", "부품용 폰 매입",
          "배터리 불량 폰 매입"] },

  { key:"fix", no:"03", name:"수리 · 리퍼", prio:1,
    cats:["fix"],
    find:["휴대폰 수리", "아이폰 수리", "액정 교체", "배터리 교체",
          "사설 수리점", "메인보드 수리"] },

  { key:"inspect", no:"04", name:"검수 · 데이터 삭제", prio:1,
    cats:["inspect"],
    find:["휴대폰 데이터 삭제", "단말기 검수", "IMEI 조회",
          "리퍼 검수", "통신사 잠금 해제"] },

  { key:"wholesale", no:"05", name:"도매 · 경매", prio:1,
    cats:["wholesale"],
    find:["중고폰 도매", "휴대폰 도매상", "중고폰 경매", "단말기 벌크",
          "부품용 로트"] },

  { key:"corp", no:"06", name:"기업 · 법인 매입", prio:2,
    cats:["corp"],
    find:["법인 휴대폰 매입", "기업 단말기 처분", "업무용 기기 반납",
          "렌탈 단말기 회수", "자산 평가"] },

  { key:"export", no:"07", name:"해외 수출 · 바이어", prio:2,
    cats:["export"],
    find:["중고폰 수출", "휴대폰 바이어", "수출 통관 대행",
          "컨테이너 수출", "해외 도매"] },

  { key:"shop", no:"08", name:"중고폰 판매점", prio:2,
    cats:["shop"],
    find:["중고폰 판매점", "리퍼폰 판매", "중고 휴대폰 매장",
          "자급제 중고폰"] },

  { key:"logi", no:"09", name:"수거 · 배송 · 부자재", prio:3,
    cats:["pickup", "access"],
    find:["택배 수거 대행", "퀵 수거", "방문 수거",
          "휴대폰 케이스 도매", "충전기 도매", "강화유리 도매"] },

  { key:"etc", no:"10", name:"기타", prio:3, etc:true, cats:[],
    find:["통신기기 유통", "휴대폰 액세서리 총판"] }
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
