

window.AM_STAGES = [
  { key:"startup",  no:"01", name:"창업 준비",     icon:"rocket", tone:"pt",
    side:"start",
    lead:"사업의 첫걸음을 준비하세요.",
    copy:"사업의 첫걸음을<br> 준비하세요.",
    sub:"프랜차이즈 · 인허가 · 창업지원 · 사업계획",
    cats:["item","admin","fund","staff"],

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

    cats:["interior","equip","furniture","it"] },

  { key:"operation",no:"04", name:"매장 운영",     icon:"chart", tone:"t2",
    side:"start",
    lead:"운영에 필요한 서비스를 한곳에서.",
    copy:"운영에 필요한 서비스를<br> 한곳에서.",
    sub:"세무 · 노무 · 마케팅 · 청소 · 식자재 · 관리",

    cats:["marketing","clean","supply","repair"] },

  { key:"transfer", no:"05", name:"매장 양도 · 양수", icon:"handover",  tone:"t3",
    side:"both",
    lead:"좋은 매장을 이어받고, 잘 넘겨보세요.",
    copy:"좋은 매장을 이어받고,<br> 잘 넘겨보세요.",
    sub:"매장매물 · 권리금 · 시설인수 · 계약지원",

    cats:["transfer","asset","stock"] },

  { key:"closing",  no:"06", name:"폐업 · 정리",   icon:"boxes", tone:"t13",
    side:"close",
    lead:"사업의 마지막까지 안전하게.",
    copy:"사업의 마지막까지<br> 안전하게.",
    sub:"철거 · 원상복구 · 집기처분 · 행정",

    cats:["process","demolish","restore","waste","tax","labor","contract","law","support"] }
];

window.amStage = function(key){
  var L = window.AM_STAGES || [];
  for(var i = 0; i < L.length; i++) if(L[i].key === key) return L[i];
  return null;
};

window.amStageCats = function(stage){
  var by = {}; (window.AM_CATS || []).forEach(function(c){ by[c.key] = c; });
  return (stage && stage.cats ? stage.cats : []).map(function(k){ return by[k]; })
    .filter(Boolean);
};

window.amStageOf = function(catKey){
  var L = window.AM_STAGES || [];
  for(var i = 0; i < L.length; i++)
    if((L[i].cats || []).indexOf(catKey) >= 0) return L[i];
  return null;
};

window.amStageTo = function(stage){ return "/g/" + stage.key; };
