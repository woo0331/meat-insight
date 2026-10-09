/* ════════════════════════════════════════════════════════════════════
   패키지 — 2026-10-09 최종 통합 지시서 §4-4 · §6-4

   > "고객이 필요한 상품을 복수 선택해 한 번에 상담 신청할 수 있도록
   >  한다. 복수 상품을 신청하더라도 각 상품의 업체 배정, 계약 상태,
   >  수수료는 **독립적으로 관리한다.**"

   ⚠️⚠️ **패키지는 묶어서 묻는 틀일 뿐, 하나의 계약이 아닙니다.**
   고르신 상품마다 업체가 다르고 계약도 따로입니다 — 화면이 그렇게
   적고 있고, 접수도 상품 목록을 그대로 실어 보냅니다. "패키지 하나로
   다 해결됩니다" 라고 말하면 그 순간 지키지 못할 약속입니다
   (절대 규칙 5).

   ⚠️⚠️ **묶음 할인 · 패키지 가격을 적지 마세요.** 금액 칸이 아예
   없습니다 — 상품마다 지역 · 평수 · 업종으로 몇 배씩 갈리고,
   제휴사가 0곳이라 깎아 드릴 수 있는 주체가 없습니다
   (프랜차이즈 창업비와 같은 까닭).

   ⚠️⚠️ **"인기 패키지" 라고 쓰지 마세요.** 신청 데이터를 하나도
   모으지 않아 무엇이 많이 나가는지 **우리는 모릅니다** (마무리
   지시서 §3 의 금지 표현). 지금 이름은 **묶어서 신청하기** 입니다.

   ⚠️ `items` 는 `offers.js` 의 **상품 id** 입니다. 없는 id 를 적으면
   `build-pages.js` 의 `checkPackages()` 가 빌드를 멈춥니다.
   ════════════════════════════════════════════════════════════════════ */
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

  /* ⚠️⚠️ **철거가 맨 앞이 아닙니다** (§6-4). 넘길 수 있는 것부터
     보고, 그 다음이 처분, 마지막이 철거 · 원상복구입니다 —
     양도가 되면 철거비도 원상복구도 줄어듭니다. */
  { key:"close", side:"close", icon:"handover", tone:"t9",
    name:"폐업 정리 패키지",
    lead:"넘길 수 있는 것부터 확인하고",
    desc:"매장 양도 가능성 → 장비 · 집기 매각 → 철거 · 원상복구 견적 → " +
         "청소 차례로 봅니다.",
    items:["transfer-ready", "used-equip", "stock-clear",
           "demolish-restore", "restore-work", "clean-disinfect"] }
];

/* ── 읽기 ────────────────────────────────────────────────────────
   ⚠️ 없는 상품 id 는 **조용히 빠집니다** (빌드가 먼저 막습니다). */
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

/* 그 쪽(창업 · 폐업)에서 낼 패키지 — `both` 는 양쪽에 다 나옵니다 */
window.amPackagesFor = function(side){
  return (window.AM_PACKAGES || []).filter(function(p){
    return !side || p.side === side || p.side === "both";
  });
};

/* ⚠️⚠️ **신청이 되는 패키지인가** — 상품 하나라도 신청을 받는 중이면
   그렇습니다. 제휴사가 0곳인 지금은 **넷 다 false** 이고, 화면은
   "상담 요청" 까지만 냅니다 (§5 · 절대 규칙 5). */
window.amPackageOpen = function(key){
  return amPackageItems(key).some(function(o){
    return (typeof window.amOfferOpen === "function") ? window.amOfferOpen(o) : false;
  });
};
