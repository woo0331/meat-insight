

window.AM_CATS = [

  { key:"buyin", name:"중고폰 매입", icon:"mobile", kind:"provider",
    lead:"쓰던 기기를 팔고 싶으실 때입니다.",
    kw:"폰팔기 핸드폰 휴대폰 중고 처분 판매 되팔기 보상판매 공기계",
    items:[
      { key:"ph-buy",    name:"스마트폰 매입" },
      { key:"tab-buy",   name:"태블릿 매입" },
      { key:"watch-buy", name:"스마트워치 매입" },
      { key:"buds-buy",  name:"무선이어폰 매입" },
      { key:"nb-buy",    name:"노트북 매입" },
      { key:"self-buy",  name:"자급제 · 공기계 매입" }
    ]},

  { key:"broken", name:"고장 · 파손폰 매입", icon:"bolt", kind:"provider",
    lead:"깨지거나 켜지지 않아도 값이 나올 수 있습니다.",
    kw:"액정깨짐 파손 침수 먹통 안켜짐 고장 부품 폐폰 깨진폰",
    items:[
      { key:"lcd-bad",   name:"액정 파손" },
      { key:"wet-bad",   name:"침수" },
      { key:"pwr-bad",   name:"전원 불량" },
      { key:"batt-bad",  name:"배터리 불량" },
      { key:"back-bad",  name:"뒷판 · 프레임 파손" },
      { key:"part-bad",  name:"부품용 단말기" }
    ]},

  { key:"fix", name:"수리 서비스", icon:"tool", kind:"provider",
    lead:"고쳐서 더 쓰실 수 있는지부터 봅니다.",
    kw:"수리 AS 사설수리 액정교체 배터리교체 충전 침수복구 데이터복구",
    items:[
      { key:"lcd",     name:"액정 교체" },
      { key:"battery", name:"배터리 교체" },
      { key:"charge",  name:"충전 단자 수리" },
      { key:"camera",  name:"카메라 수리" },
      { key:"sound",   name:"스피커 · 마이크 수리" },
      { key:"wet-fix", name:"침수 복구" },
      { key:"board",   name:"메인보드 수리" },
      { key:"data",    name:"데이터 복구" }
    ]},

  { key:"shop", name:"검수 중고폰 판매", icon:"cart", kind:"provider",
    lead:"검수하고 등급을 매긴 기기를 팝니다.",
    kw:"중고폰구매 구입 사기 쇼핑몰 리퍼 중고기기 자급제구매",
    items:[
      { key:"ph-sell",    name:"스마트폰" },
      { key:"tab-sell",   name:"태블릿" },
      { key:"watch-sell", name:"스마트워치" },
      { key:"buds-sell",  name:"무선이어폰" },
      { key:"nb-sell",    name:"노트북" }
    ]},

  { key:"wholesale", name:"B2B 도매 · 경매", icon:"boxes", kind:"provider",
    lead:"전문업체끼리 수량으로 거래하는 자리입니다.",
    kw:"도매 벌크 경매 입찰 물량 다량 업자 사입 등급별",
    items:[
      { key:"lot",      name:"단말기 도매" },
      { key:"bulk",     name:"등급별 벌크" },
      { key:"auction",  name:"경매 참여" },
      { key:"part-lot", name:"부품 · 모듈 도매" }
    ]},

  { key:"corp", name:"기업 · 법인 대량 매입", icon:"building", kind:"provider",
    lead:"업무용 기기를 한 번에 정리하실 때입니다.",
    kw:"기업 법인 단체 업무용 사내 임대폰 리스 자산정리 대량",
    items:[
      { key:"office",    name:"업무용 단말기 정리" },
      { key:"lease",     name:"임대 · 리스 단말기 회수" },
      { key:"wipe-cert", name:"데이터 완전 삭제 증명" },
      { key:"asset-val", name:"자산 목록 평가" }
    ]},

  { key:"export", name:"해외 수출 · 바이어", icon:"globe", kind:"provider",
    lead:"해외로 내보내는 거래를 잇습니다.",
    kw:"수출 해외 바이어 무역 통관 선적 컨테이너 외국",
    items:[
      { key:"buyer",     name:"해외 바이어 연결" },
      { key:"customs",   name:"수출 통관" },
      { key:"container", name:"등급별 컨테이너" },
      { key:"shipping",  name:"선적 · 물류" }
    ]},

  { key:"inspect", name:"검수 · 데이터 삭제", icon:"scan", kind:"provider",
    lead:"상태를 판정하고 안에 남은 것을 지웁니다.",
    kw:"검수 등급 판정 상태확인 초기화 데이터삭제 개인정보 잠금 아이클라우드",
    items:[
      { key:"grade",  name:"외관 등급 판정" },
      { key:"func",   name:"기능 검수" },
      { key:"imei",   name:"제조번호 조회" },
      { key:"wipe",   name:"데이터 완전 삭제" },
      { key:"unlock", name:"잠금 해제 확인" }
    ]},

  { key:"pickup", name:"수거 · 배송", icon:"truck", kind:"provider",
    lead:"기기를 가져오고 돌려보내는 일입니다.",
    kw:"택배 수거 방문 발송 보내는법 포장 배송 퀵",
    items:[
      { key:"post",  name:"택배 수거" },
      { key:"visit", name:"방문 수거" },
      { key:"store", name:"매장 방문" },
      { key:"pack",  name:"안전 포장" }
    ]},

  { key:"access", name:"액세서리 · 부자재", icon:"plug", kind:"provider",
    lead:"기기와 같이 쓰는 것들입니다.",
    kw:"케이스 필름 충전기 케이블 보호필름 거치대 포장재 액세서리",
    items:[
      { key:"case",    name:"케이스 · 필름" },
      { key:"charger", name:"충전기 · 케이블" },
      { key:"wrap",    name:"보호 포장재" },
      { key:"stand",   name:"거치대" }
    ]}

];

window.amCat = function(key){
  var L = window.AM_CATS || [];
  for(var i = 0; i < L.length; i++) if(L[i].key === key) return L[i];
  return null;
};

window.amCatItems = function(c){
  if(!c) return [];
  return c.items || [];
};

window.amAllSubs = function(c){
  if(!c) return [];
  return c.items || [];
};

window.amSubName = function(catKey, subKey){
  var c = window.amCat(catKey); if(!c) return "";
  var L = c.items || [];
  for(var i = 0; i < L.length; i++) if(L[i].key === subKey) return L[i].name;
  return "";
};

window.amPickSplit = function(id){
  var s = String(id || "").split("/");
  return { cat: s[0] || "", sub: (s.length > 1 ? s[1] : "") };
};

window.amPickWrap = function(c, sub){
  if(!c) return null;
  var ask = !!(window.AM_REQ_FORMS && window.AM_REQ_FORMS[c.key]);
  if(sub && sub.key) return {
    id:c.key + "/" + sub.key, cat:c.key, sub:sub.key,
    name:sub.name, easy:"", lead:"",

    desc:c.name,
    icon:(sub.icon || c.icon || "check"),
    to:(typeof window.catTo === "function") ? window.catTo(c) : "",
    ask:ask
  };
  return {
    id:c.key, cat:c.key, sub:"",
    name:c.name, easy:"", lead:(c.lead || ""), desc:(c.desc || ""),
    icon:(c.icon || "check"),
    to:(typeof window.catTo === "function") ? window.catTo(c) : "",
    ask:ask
  };
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
