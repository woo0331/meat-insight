/* ════════════════════════════════════════════════════════════════════
   사업 단계 여섯 (2026-10-04 "카테고리 및 서비스 구조 전면 개편")

   이 파일은 **새 분류를 만들지 않습니다.** `catalog.js` 의 분류
   스물다섯을 **사장님의 생애주기**로 묶어 보는 틀일 뿐입니다 —

       창업 → 상가·입지 → 매장 만들기 → 매장 운영
            → 매장 양도·양수 → 폐업·정리

   손님이 "인테리어·시공" 이라는 말을 몰라도 **"나는 지금 가게를
   만들고 있다"** 만으로 찾을 수 있게 하는 것이 목적입니다.

   ⚠️⚠️ **분류를 지우거나 이름을 바꾸지 않았습니다.** `catalog.js` 의
   키 · 이름 · 하위 · 주소가 그대로입니다. 업체(`subs`) · 매물(`sub`) ·
   글(`cat`) · 업종(`startup`/`closure`)이 전부 그 키를 쓰기 때문에,
   여기서 이름을 바꾸면 **등록된 모든 데이터가 조용히 어긋납니다.**
   이 파일은 그 위에 얹는 **보는 틀**입니다.

   ⚠️⚠️ **스물다섯이 빠짐없이 한 곳씩 들어갑니다.** 아래 `cats` 를
   고치실 때 `check.js` 의 "사업 단계 여섯이 분류 스물다섯을 빠짐없이
   나눠 가진다" 가 **빠진 것 · 겹치는 것 · 없는 키**를 전부 잡습니다.
   한 분류를 두 단계에 넣고 싶어지면, 그건 그 분류를 쪼갤 때입니다.

   ⚠️ **창업/폐업 두 쪽은 그대로입니다.** `AM_START_CATS` ·
   `AM_CLOSE_CATS` 가 여전히 업종 화면(`/startup/:industry`)과 메인
   업종 거르개를 움직입니다 — 이 여섯은 그것과 **다른 축**이고,
   둘 다 같은 분류를 가리킵니다.
   ════════════════════════════════════════════════════════════════════ */

window.AM_STAGES = [
  { key:"startup",  no:"01", name:"창업 준비",     icon:"rocket", tone:"pt",
    side:"start",
    lead:"사업의 첫걸음을 준비하세요.",
    copy:"사업의 첫걸음을<br> 준비하세요.",
    sub:"프랜차이즈 · 인허가 · 창업지원 · 사업계획",
    cats:["item","admin","fund","staff"],
    /* ⚠️ 프랜차이즈는 분류가 아니라 **독립 화면**입니다. 정보구조로는
       창업 준비 안이지만, 앞으로 중요한 서비스라 메인 검색 탭에서도
       따로 냅니다 (지시서 §13 — 둘 다 유지). */
    extra:[{ name:"프랜차이즈", to:"/franchise", icon:"store",
             lead:"브랜드를 비교하고 정보공개서를 확인합니다" }] },

  { key:"location", no:"02", name:"상가 · 입지",   icon:"pin",   tone:"t1",
    side:"start",
    lead:"좋은 시작은 좋은 자리에서 시작됩니다.",
    copy:"좋은 시작은 좋은 자리에서<br> 시작됩니다.",
    sub:"상가 · 상권분석 · 권리금 · 임대차",
    cats:["store","area"] },

  { key:"build",    no:"03", name:"매장 만들기",   icon:"tool",  tone:"t4",
    side:"start",
    lead:"내 사업에 맞는 공간을 완성하세요.",
    copy:"내 사업에 맞는 공간을<br> 완성하세요.",
    sub:"인테리어 · 시설 · 장비 · 간판 · POS",
    /* 지시서 §16 의 네 묶음(공간 · 시설 · 집기 · 시스템)이 그대로
       분류 넷입니다 — 묶음을 또 만들지 않고 분류를 그 차례로 둡니다. */
    cats:["interior","equip","furniture","it"] },

  { key:"operation",no:"04", name:"매장 운영",     icon:"chart", tone:"t2",
    side:"start",
    lead:"운영에 필요한 서비스를 한곳에서.",
    copy:"운영에 필요한 서비스를<br> 한곳에서.",
    sub:"세무 · 노무 · 마케팅 · 청소 · 식자재 · 관리",
    /* ⚠️ 지시서 §17 — 창업과 폐업은 한 번이지만 **운영은 반복**입니다.
       부가 메뉴로 취급하지 마세요. */
    cats:["marketing","clean","supply"] },

  { key:"transfer", no:"05", name:"매장 양도 · 양수", icon:"handover",  tone:"t3",
    side:"both",
    lead:"좋은 매장을 이어받고, 잘 넘겨보세요.",
    copy:"좋은 매장을 이어받고,<br> 잘 넘겨보세요.",
    sub:"매장매물 · 권리금 · 시설인수 · 계약지원",
    /* ⚠️⚠️ 브랜드 이름과 가장 직접 닿는 자리입니다 (지시서 §14) —
       다른 단계의 하위로 숨기지 마세요.
       ⚠️ 시설·집기와 재고가 여기 있는 것은, 그 둘이 **넘기는 쪽과
       받는 쪽이 같은 화면을 보는** 자리이기 때문입니다 (`/assets`). */
    cats:["transfer","asset","stock"] },

  { key:"closing",  no:"06", name:"폐업 · 정리",   icon:"boxes", tone:"t13",
    side:"close",
    lead:"사업의 마지막까지 안전하게.",
    copy:"사업의 마지막까지<br> 안전하게.",
    sub:"철거 · 원상복구 · 집기처분 · 행정",
    /* 지시서 §15 — 메인에 다섯 칸으로 흩어져 있던 것을 하나로 모으고,
       세부는 이 단계를 누른 **다음에** 냅니다. 메인은 단순하게. */
    cats:["process","demolish","restore","waste","tax","labor","contract","law","support"] }
];

window.amStage = function(key){
  var L = window.AM_STAGES || [];
  for(var i = 0; i < L.length; i++) if(L[i].key === key) return L[i];
  return null;
};

/* 그 단계가 들고 있는 **실제 분류 객체**들 — 없는 키는 조용히 빠집니다
   (빌드가 막기 때문에 운영 중에 그럴 일은 없습니다) */
window.amStageCats = function(stage){
  var by = {}; (window.AM_CATS || []).forEach(function(c){ by[c.key] = c; });
  return (stage && stage.cats ? stage.cats : []).map(function(k){ return by[k]; })
    .filter(Boolean);
};

/* ⚠️ **되찾기(기존 분류 → 새 대분류).** 분류 화면에서 "이게 어느
   단계인가" 를 말해 주거나, 나중에 업체·매물을 단계로 거를 때 씁니다.
   매핑을 두 곳에 적지 마세요 — 위 `cats` 한 곳입니다. */
window.amStageOf = function(catKey){
  var L = window.AM_STAGES || [];
  for(var i = 0; i < L.length; i++)
    if((L[i].cats || []).indexOf(catKey) >= 0) return L[i];
  return null;
};

window.amStageTo = function(stage){ return "/g/" + stage.key; };
