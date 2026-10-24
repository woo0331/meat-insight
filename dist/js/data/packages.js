

window.AM_PACKAGES = [
  { key:"open", side:"start", icon:"rocket", tone:"t1",
    name:"매장 오픈 패키지",
    lead:"문 열기 전에 한 번에 잡는 것들",
    desc:"개통 · 설치 일정이 서로 물려 있어 따로 알아보시면 공사 끝나고도 " +
         "며칠을 더 기다리게 됩니다.",
    items:["store-internet", "pos-card", "cctv-security",
           "kiosk-order", "water-ice-rental"] },

  { key:"build", side:"start", icon:"roller", tone:"t4",
    name:"매장 만들기 패키지",
    lead:"공사와 설비를 같이 보실 때",
    desc:"인테리어 · 간판 · 냉난방 · 주방은 공정이 맞물려서 순서가 틀리면 " +
         "같은 자리를 두 번 뜯습니다.",
    items:["interior-sign", "signage", "hvac", "kitchen-equip", "furniture-set"] },

  { key:"run", side:"both", icon:"refresh", tone:"t12",
    name:"매장 운영 패키지",
    lead:"문 열고 나서 매달 드는 것",
    desc:"식자재 · 소모품 · 정기 청소 · 유지보수처럼 주기를 두고 " +
         "맡기시는 것들입니다.",
    items:["food-supply", "consum-supply", "equip-repair",
           "regular-clean", "place-mkt", "tax-labor"] },

  { key:"close", side:"close", icon:"handover", tone:"t9",
    name:"폐업 정리 패키지",
    lead:"넘길 수 있는 것부터 확인하고",
    desc:"매장 양도 가능성 → 장비 · 집기 매각 → 철거 · 원상복구 견적 → " +
         "청소 차례로 봅니다.",
    items:["transfer-ready", "used-equip", "stock-clear",
           "demolish-restore", "restore-work", "clean-disinfect"] }
];

window.amPackage = function(key){
  var L = window.AM_PACKAGES || [], i;
  for(i = 0; i < L.length; i++) if(L[i].key === key) return L[i];
  return null;
};

window.amPackageItems = function(key){
  var p = window.amPackage(key);
  if(!p) return [];
  return (p.items || []).map(function(id){
    return (typeof window.amOffer === "function") ? window.amOffer(id) : null;
  }).filter(Boolean);
};

window.amPackagesFor = function(side){
  return (window.AM_PACKAGES || []).filter(function(p){
    return !side || p.side === side || p.side === "both";
  });
};

window.amPackageOpen = function(key){
  return amPackageItems(key).some(function(o){
    return (typeof window.amOfferOpen === "function") ? window.amOfferOpen(o) : false;
  });
};
