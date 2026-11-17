

window.AM_OFFER_APPLY = [
  { key:"quote",   name:"견적 비교",   lead:"조건을 적으시면 여러 곳에서 견적이 옵니다" },
  { key:"install", name:"설치 · 개통", lead:"일정을 정해 설치 · 개통까지" },
  { key:"rental",  name:"렌탈 계약",   lead:"월 단위 계약으로 들여놓는 것" },
  { key:"dispose", name:"처분 · 매각", lead:"쓰던 것을 넘기거나 파는 것" }
];

window.AM_OFFER_COST = [
  { key:"quote",  name:"업체 견적으로",     lead:"조건이 달라 금액을 미리 적지 않습니다" },
  { key:"tool",   name:"계산기로 가늠",     lead:"사장님 조건을 넣어 직접 계산하십니다" },
  { key:"public", name:"공시 자료로",       lead:"공개된 자료에 적힌 값만 냅니다" }
];

window.AM_OFFER_STATUS = [
  { key:"info", name:"정보만",      lead:"⚠️ 제휴사가 없어 신청을 받지 않습니다 (§5)" },
  { key:"live", name:"신청 받는 중", lead:"실제로 신청과 배정이 됩니다" },
  { key:"off",  name:"내림",        lead:"화면에 안 냅니다" }
];

window.AM_OFFERS = [
  { id:"store-internet", icon:"globe", name:"매장 인터넷", cat:"it", sub:"internet",
    lead:"개통일을 맞추는 것이 전부입니다. 공사 일정과 함께 잡으세요.",
    apply:"install", consult:true, costWay:"quote",
    fee:"close", feeNote:"개통 확인 후 건당 정액", status:"info",
    to:"/providers/it" },

  { id:"pos-card", icon:"receipt", name:"POS · 카드단말기", cat:"it", sub:"pos",
    lead:"카드 수수료와 단말기 비용은 다른 이야기입니다. 둘을 갈라서 보세요.",
    apply:"install", consult:true, costWay:"quote",
    fee:"close", feeNote:"설치 확인 후 건당 정액", status:"info",
    to:"/providers/it" },

  { id:"cctv-security", icon:"camera", name:"CCTV · 보안", cat:"it", sub:"cctv",
    lead:"대수와 저장 기간이 값을 가릅니다. 녹화 보관은 법에 걸리는 부분이 있습니다.",
    apply:"install", consult:true, costWay:"quote",
    fee:"close", feeNote:"설치 확인 후 건당 정액", status:"info",
    to:"/providers/it" },

  { id:"water-ice-rental", icon:"snow", name:"정수기 · 제빙기 렌탈", cat:"equip",
    lead:"사는 것과 빌리는 것의 차액은 계약 기간에서 갈립니다.",
    apply:"rental", consult:true, costWay:"quote",
    fee:"sub", feeNote:"계약 회차마다 정액", status:"info",
    to:"/providers/equip" },

  { id:"kiosk-order", icon:"monitor", name:"키오스크 · 테이블오더", cat:"it", sub:"kiosk",
    lead:"인건비를 줄이려는 것이라면 먼저 계산해 보세요.",
    apply:"install", consult:true, costWay:"tool",
    fee:"close", feeNote:"설치 확인 후 건당 정액", status:"info",
    to:"/providers/it" },

  { id:"interior-sign", icon:"roller", name:"인테리어 · 간판", cat:"interior", sub:"interior",
    lead:"평수보다 무엇을 뜯는가가 금액을 가릅니다.",
    apply:"quote", consult:true, costWay:"quote",
    fee:"rate", feeNote:"계약금액의 일정 비율", status:"info",
    to:"/providers/interior" },

  { id:"kitchen-equip", icon:"knife", name:"주방 · 업소용 장비", cat:"equip",
    lead:"새것과 중고의 차이는 값이 아니라 수리와 부품입니다.",
    apply:"quote", consult:true, costWay:"quote",
    fee:"rate", feeNote:"계약금액의 일정 비율", status:"info",
    to:"/providers/equip" },

  { id:"demolish-restore", icon:"hammer", name:"철거 · 원상복구", cat:"demolish", sub:"full",
    lead:"원상복구 범위는 계약서에 적힌 대로입니다. 먼저 그것부터 확인하세요.",
    apply:"quote", consult:true, costWay:"quote",
    fee:"rate", feeNote:"계약금액의 일정 비율", status:"info",
    to:"/providers/demolish" },

  { id:"clean-disinfect", icon:"broom", name:"청소 · 방역", cat:"clean", sub:"move-in",
    lead:"문 열기 전 한 번과 정기로 받는 것은 다른 계약입니다.",
    apply:"quote", consult:false, costWay:"quote",
    fee:"lead", feeNote:"유효 문의 확인 후 건당 정액", status:"info",
    to:"/providers/clean" },

  { id:"used-equip", icon:"boxes", name:"중고 시설 · 장비", cat:"asset",
    lead:"정리하시는 사장님의 것이 시작하시는 사장님에게 갑니다.",
    apply:"dispose", consult:false, costWay:"quote",
    fee:"margin", feeNote:"판매가와 매입가의 차액", status:"info",
    to:"/assets" },

  { id:"signage", icon:"sign", name:"간판 · 사인", cat:"interior", sub:"sign",
    lead:"크기와 내달는 자리에 따라 구청 허가가 따로 필요할 수 있습니다.",
    apply:"quote", consult:true, costWay:"quote",
    fee:"rate", feeNote:"계약금액의 일정 비율", status:"info",
    to:"/providers/interior" },

  { id:"hvac", icon:"snow", name:"냉난방 · 공조", cat:"interior", sub:"hvac",
    lead:"평수보다 천장 높이와 주방 열이 용량을 가릅니다.",
    apply:"quote", consult:true, costWay:"quote",
    fee:"rate", feeNote:"계약금액의 일정 비율", status:"info",
    to:"/providers/interior" },

  { id:"furniture-set", icon:"sofa", name:"가구 · 집기", cat:"furniture", sub:"biz-furn",
    lead:"붙박이인지 떼어 옮길 수 있는지를 먼저 보세요 — 정리할 때 갈립니다.",
    apply:"quote", consult:true, costWay:"quote",
    fee:"rate", feeNote:"계약금액의 일정 비율", status:"info",
    to:"/providers/furniture" },

  { id:"booking-order", icon:"calendar", name:"예약 · 주문 솔루션", cat:"it", sub:"booking",
    lead:"예약과 주문은 다른 프로그램일 때가 많습니다. 묶을 수 있는지 보세요.",
    apply:"install", consult:true, costWay:"quote",
    fee:"close", feeNote:"개통 확인 후 건당 정액", status:"info",
    to:"/providers/it" },

  { id:"marketing-svc", icon:"megaphone", name:"오픈 마케팅", cat:"marketing", sub:"open-mkt",
    lead:"문 열기 전에 해 두는 것과 열고 나서 하는 것이 다릅니다.",
    apply:"quote", consult:true, costWay:"quote",
    fee:"lead", feeNote:"유효 문의 확인 후 건당 정액", status:"info",
    to:"/providers/marketing" },

  { id:"food-supply", icon:"utensils", name:"식자재 거래처 연결", cat:"supply", sub:"ingredient",
    lead:"품목마다 거래처가 다릅니다. 육류 · 수산 · 농산을 한 곳에서 받기는 어렵습니다.",
    apply:"quote", consult:true, costWay:"quote",
    fee:"sub", feeNote:"발주 회차마다 정액", status:"info",
    to:"/providers/supply" },

  { id:"consum-supply", icon:"boxes", name:"소모품 · 포장재 정기 공급", cat:"supply", sub:"packaging",
    lead:"배달용기는 단가보다 최소 수량이 부담인 경우가 많습니다.",
    apply:"quote", consult:true, costWay:"quote",
    fee:"sub", feeNote:"발주 회차마다 정액", status:"info",
    to:"/providers/supply" },

  { id:"equip-repair", icon:"tool", name:"장비 수리 · 유지보수", cat:"repair", sub:"kitchen-fix",
    lead:"멈춘 뒤에 부르면 그날 장사가 안 됩니다. 정기 점검을 같이 보세요.",
    apply:"quote", consult:false, costWay:"quote",
    fee:"lead", feeNote:"유효 문의 확인 후 건당 정액", status:"info",
    to:"/providers/repair" },

  { id:"regular-clean", icon:"broom", name:"정기 청소 · 방역", cat:"clean", sub:"regular",
    lead:"한 번 받는 것과 주기로 받는 것은 다른 계약입니다.",
    apply:"quote", consult:false, costWay:"quote",
    fee:"sub", feeNote:"계약 회차마다 정액", status:"info",
    to:"/providers/clean" },

  { id:"place-mkt", icon:"pin", name:"플레이스 · 리뷰 관리", cat:"marketing", sub:"place",
    lead:"검색해서 찾아오는 손님이 여기서 갈립니다.",
    apply:"quote", consult:true, costWay:"quote",
    fee:"sub", feeNote:"월 계약 회차마다 정액", status:"info",
    to:"/providers/marketing" },

  { id:"tax-labor", icon:"briefcase", name:"세무 · 노무 기장", cat:"admin", sub:"tax-agent",
    lead:"직원이 생기면 노무가 같이 따라옵니다.",
    apply:"quote", consult:true, costWay:"quote",
    fee:"sub", feeNote:"월 기장 회차마다 정액", status:"info",
    to:"/providers/admin" },

  { id:"transfer-ready", icon:"handover", name:"매장 양도 준비", cat:"transfer", sub:"store-transfer",
    lead:"넘기기 전에 임대차 승계와 시설 범위를 먼저 정리합니다.",
    apply:"quote", consult:true, costWay:"quote",
    fee:"lead", feeNote:"유효 문의 확인 후 건당 정액", status:"info",
    to:"/stores" },

  { id:"store-photo", icon:"camera", name:"매장 · 시설 촬영", cat:"marketing", sub:"photo",
    lead:"사진 한 장이 보러 오시는 분의 수를 가릅니다.",
    apply:"quote", consult:false, costWay:"quote",
    fee:"close", feeNote:"촬영 완료 후 건당 정액", status:"info",
    to:"/providers/marketing" },

  { id:"stock-clear", icon:"boxes", name:"재고 처분", cat:"stock", sub:"goods",
    lead:"반품이 되는 것부터 갈라 놓으세요 — 거래처와 먼저 얻습니다.",
    apply:"dispose", consult:false, costWay:"quote",
    fee:"margin", feeNote:"판매가와 매입가의 차액", status:"info",
    to:"/assets" },

  { id:"restore-work", icon:"restore", name:"원상복구", cat:"restore", sub:"shop-restore",
    lead:"범위는 임대차 계약서에 적힐 대로입니다. 그것부터 확인하세요.",
    apply:"quote", consult:true, costWay:"quote",
    fee:"rate", feeNote:"계약금액의 일정 비율", status:"info",
    to:"/providers/restore" },

  { id:"waste-disposal", icon:"trash", name:"폐기물 처리", cat:"waste", sub:"biz-waste",
    lead:"사업장 폐기물은 허가받은 업체만 가져갈 수 있고 증빙이 남아야 합니다.",
    apply:"quote", consult:true, costWay:"quote",
    fee:"rate", feeNote:"계약금액의 일정 비율", status:"info",
    to:"/providers/waste" },

  { id:"equip-move", icon:"truck", name:"장비 철거 · 이전", cat:"demolish", sub:"facility",
    lead:"떼어서 옮기면 돈이고 부수면 비용입니다. 순서를 먼저 정하세요.",
    apply:"quote", consult:true, costWay:"quote",
    fee:"rate", feeNote:"계약금액의 일정 비율", status:"info",
    to:"/providers/demolish" }
];

window.amOffer = function(id){
  var L = window.AM_OFFERS || [], i;
  for(i = 0; i < L.length; i++) if(L[i].id === id) return L[i];
  return null;
};

window.amOffers = function(o){
  o = o || {};
  return (window.AM_OFFERS || []).filter(function(x){
    if(x.status === "off") return false;
    if(o.status && x.status !== o.status) return false;
    if(o.cat && x.cat !== o.cat) return false;
    if(o.industry && (x.industries || []).length &&
       (x.industries || []).indexOf(o.industry) < 0) return false;
    return true;
  });
};

window.amOffersForCat = function(cat){
  return (window.AM_OFFERS || []).filter(function(x){
    return x.status !== "off" && x.cat === cat;
  });
};

window.amOfferOpen = function(x){
  if(!x || x.status !== "live") return false;
  var n = (typeof window.amProvidersInCat === "function")
            ? window.amProvidersInCat(x.cat) : 0;
  return n > 0;
};

window.amOfferTodo = function(x){
  var L = [];
  if(!x) return L;
  var n = (typeof window.amProvidersInCat === "function")
            ? window.amProvidersInCat(x.cat) : 0;
  if(!n) L.push("이 분야에 등록된 업체가 없습니다");
  if(!x.fee) L.push("수익모델을 정해야 합니다");
  if(!x.feeNote) L.push("정산 기준을 적어야 합니다");
  if(x.status !== "live") L.push("노출 상태가 '신청 받는 중' 이 아닙니다");
  return L;
};

window.amOfferApplyName = function(k){
  var L = window.AM_OFFER_APPLY || [], i;
  for(i = 0; i < L.length; i++) if(L[i].key === k) return L[i].name;
  return "";
};
