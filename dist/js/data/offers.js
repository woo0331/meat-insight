

window.AM_OFFER_APPLY = [
  { key:"sell",  name:"내 폰 팔기",   lead:"기기를 적으시면 매입 · 입찰로 이어집니다" },
  { key:"quote", name:"견적 비교",    lead:"조건을 적으시면 여러 곳에서 견적이 옵니다" },
  { key:"buy",   name:"중고폰 구매",  lead:"검수를 마친 기기를 고르시는 것" },
  { key:"bulk",  name:"대량 · 수출 상담", lead:"대수가 많아 사람이 먼저 상담하는 것" }
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

  { id:"ph-buyin", icon:"mobile", name:"스마트폰 직접 매입", cat:"buyin", sub:"ph-buy",
    lead:"등급과 용량이 값을 가릅니다. 기준가가 없으면 예상 금액을 내지 않습니다.",
    apply:"sell", consult:false, costWay:"quote",
    fee:"margin", feeNote:"재판매가에서 매입가와 검수 원가를 뺀 차액", status:"info",
    to:"/sell" },

  { id:"tab-buyin", icon:"laptop", name:"태블릿 · 워치 · 이어폰 매입", cat:"buyin", sub:"tab-buy",
    lead:"스마트폰보다 기종이 적어 등급표가 단순합니다.",
    apply:"sell", consult:false, costWay:"quote",
    fee:"margin", feeNote:"재판매가에서 매입가와 검수 원가를 뺀 차액", status:"info",
    to:"/sell" },

  { id:"self-buyin", icon:"box", name:"자급제 · 공기계 매입", cat:"buyin", sub:"self-buy",
    lead:"약정이 없는 기기라 명의와 잠금만 확인하면 됩니다.",
    apply:"sell", consult:false, costWay:"quote",
    fee:"margin", feeNote:"재판매가에서 매입가와 검수 원가를 뺀 차액", status:"info",
    to:"/sell" },

  { id:"bid-match", icon:"gavel", name:"매입업체 경쟁입찰 중개", cat:"buyin",
    lead:"저희가 사는 것이 아니라 제휴 매입업체가 입찰합니다 — 중개입니다.",
    apply:"quote", consult:false, costWay:"quote",
    fee:"rate", feeNote:"낙찰가의 일정 비율 · 업체 수금 확인 후", status:"info",
    to:"/bid" },

  { id:"broken-buyin", icon:"alert", name:"고장 · 파손폰 매입", cat:"broken",
    lead:"켜지지 않아도 값이 붙습니다. 무엇이 고장인지만 적으시면 됩니다.",
    apply:"sell", consult:false, costWay:"quote",
    fee:"margin", feeNote:"수리 · 부품 회수 뒤 재판매 차액", status:"info",
    to:"/sell" },

  { id:"part-lot", icon:"boxes", name:"부품용 단말기 매입", cat:"broken", sub:"part-bad",
    lead:"살릴 수 없는 기기도 모듈 단위로는 거래됩니다.",
    apply:"sell", consult:false, costWay:"quote",
    fee:"margin", feeNote:"부품 판매가에서 매입가를 뺀 차액", status:"info",
    to:"/sell" },

  { id:"fix-match", icon:"tool", name:"수리 업체 연결", cat:"fix",
    lead:"기종과 증상으로 갈립니다. 부품을 구할 수 있는지가 먼저입니다.",
    apply:"quote", consult:false, costWay:"quote",
    fee:"close", feeNote:"수리 완료 확인 후 건당 정액", status:"info",
    to:"/repair" },

  { id:"fix-data", icon:"filex", name:"데이터 복구 연결", cat:"fix", sub:"data",
    lead:"침수 · 액정 고장과 다른 일입니다. 복구율을 약속하지 않습니다.",
    apply:"quote", consult:true, costWay:"quote",
    fee:"close", feeNote:"복구 완료 확인 후 건당 정액", status:"info",
    to:"/repair" },

  { id:"shop-sale", icon:"store", name:"검수 중고폰 판매", cat:"shop",
    lead:"검수를 마친 기기만 올립니다. 등급과 배터리 상태를 같이 냅니다.",
    apply:"buy", consult:false, costWay:"quote",
    fee:"margin", feeNote:"판매가에서 매입가와 검수 원가를 뺀 차액", status:"info",
    to:"/shop" },

  { id:"lot-whole", icon:"layers", name:"등급별 벌크 도매", cat:"wholesale", sub:"bulk",
    lead:"대수와 등급 구성으로 값이 갈립니다. 한 대씩 보는 거래가 아닙니다.",
    apply:"bulk", consult:true, costWay:"quote",
    fee:"margin", feeNote:"도매가에서 매입가를 뺀 차액", status:"info",
    to:"/biz" },

  { id:"auction-fee", icon:"gavel", name:"B2B 경매 중개", cat:"wholesale", sub:"auction",
    lead:"참여 업체끼리 값을 냅니다 — 저희는 자리를 열고 중개합니다.",
    apply:"bulk", consult:true, costWay:"quote",
    fee:"rate", feeNote:"낙찰가의 일정 비율 · 업체 수금 확인 후", status:"info",
    to:"/biz" },

  { id:"corp-buyin", icon:"building", name:"기업 · 법인 대량 매입", cat:"corp", sub:"office",
    lead:"자산 목록과 반출 절차가 먼저입니다. 대수가 많으면 사람이 갑니다.",
    apply:"bulk", consult:true, costWay:"quote",
    fee:"margin", feeNote:"재판매가에서 매입가와 회수 원가를 뺀 차액", status:"info",
    to:"/biz?t=corp" },

  { id:"wipe-cert", icon:"shield", name:"데이터 완전 삭제 증명", cat:"corp", sub:"wipe-cert",
    lead:"업무용 단말기는 삭제를 증명해야 반출이 끝납니다.",
    apply:"bulk", consult:true, costWay:"quote",
    fee:"close", feeNote:"증명서 발급 건당 정액", status:"info",
    to:"/biz?t=corp" },

  { id:"export-buyer", icon:"globe", name:"해외 바이어 연결", cat:"export", sub:"buyer",
    lead:"나라마다 받는 등급과 기종이 다릅니다. 통관이 따라옵니다.",
    apply:"bulk", consult:true, costWay:"quote",
    fee:"rate", feeNote:"수출 대금의 일정 비율 · 수금 확인 후", status:"info",
    to:"/biz?t=export" },

  { id:"inspect-fee", icon:"scan", name:"검수 · 등급 판정", cat:"inspect", sub:"grade",
    lead:"외관과 기능을 갈라서 봅니다. 등급은 사람이 정하고 기준을 밝힙니다.",
    apply:"quote", consult:false, costWay:"quote",
    fee:"close", feeNote:"검수 완료 건당 정액", status:"info",
    to:"/quote?c=inspect" },

  { id:"pickup-post", icon:"truck", name:"택배 · 방문 수거", cat:"pickup", sub:"post",
    lead:"포장이 반입니다. 깨진 액정은 따로 싸야 더 깨지지 않습니다.",
    apply:"sell", consult:false, costWay:"quote",
    fee:"close", feeNote:"수거 완료 건당 정액", status:"info",
    to:"/sell" },

  { id:"access-sale", icon:"plug", name:"액세서리 · 부자재", cat:"access",
    lead:"기기와 같이 나가는 것들입니다. 케이스 · 충전기 · 포장재.",
    apply:"buy", consult:false, costWay:"quote",
    fee:"margin", feeNote:"판매가에서 매입가를 뺀 차액", status:"info",
    to:"/shop" }
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
