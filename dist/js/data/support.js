

window.AM_SUPPORTS = [];

window.AM_SUPPORT_WHERE = [
  { key:"bizinfo", side:"both",
    org:"기업마당 (중소벤처기업부)",
    what:"부처와 지자체의 지원사업 공고가 한곳에 모입니다. 제일 먼저 볼 곳입니다.",
    find:"지역과 업종으로 거른 뒤 '소상공인' 으로 다시 거릅니다",
    url:"https://www.bizinfo.go.kr", checked:true },

  { key:"semas", side:"both",
    org:"소상공인시장진흥공단",
    what:"소상공인 정책자금 · 교육 · 컨설팅, 그리고 폐업하시는 분을 위한 사업까지 다룹니다.",
    find:"정리하시는 중이면 '폐업' 으로, 시작하시는 중이면 '창업' 으로 찾으십니다",
    url:"https://www.semas.or.kr", checked:true },

  { key:"kstartup", side:"start",
    org:"K-Startup (창업진흥원)",
    what:"창업 지원사업 공고가 모입니다. 업종보다 '창업 단계' 로 나뉘어 있습니다.",
    find:"예비창업 · 초기창업으로 나뉘니 지금 단계부터 고르십니다",
    url:"https://www.k-startup.go.kr", checked:true },

  { key:"sinbo", side:"start",
    org:"지역신용보증재단 (시 · 도별)",
    what:"담보가 모자라 대출이 막힐 때 보증을 서 주는 곳입니다. 시 · 도마다 따로 있습니다.",
    find:"사업장이 있는 시 · 도 이름 + 신용보증재단",
    url:"", checked:false },

  { key:"local", side:"both",
    org:"관할 시 · 군 · 구청과 시 · 도",
    what:"간판 정비 · 환경 개선 · 임차료 같은 지자체 자체 사업은 여기에만 올라옵니다. "+
         "전국 포털에는 안 뜨는 것이 많습니다.",
    find:"구청 홈페이지의 고시 · 공고 게시판. 전화로 물어보시는 것이 제일 빠릅니다",
    url:"", checked:false },

  { key:"noranusan", side:"both",
    org:"노란우산공제 (중소기업중앙회)",
    what:"매달 부어 두었다가 폐업하실 때 받는 공제입니다. 압류가 안 되고 소득공제도 됩니다.",
    find:"가입은 시작하실 때, 받는 것은 정리하실 때입니다",
    url:"https://www.8899.or.kr", checked:true },

  { key:"ei", side:"both",
    org:"고용보험 · 근로복지공단",
    what:"직원과 관련된 것 — 사회보험료 지원, 고용 유지, 직원이 그만둘 때의 절차.",
    find:"직원이 한 명이라도 있으면 폐업 전에 반드시 한 번 확인하십니다",
    url:"https://www.ei.go.kr", checked:true },

  { key:"hometax", side:"close",
    org:"국세청 홈택스 · 관할 세무서",
    what:"폐업 신고와 부가가치세 확정신고를 하는 곳입니다. 지원사업은 아니지만 기한이 있습니다.",
    find:"폐업일이 속한 달의 다음 달 25일까지 확정신고입니다 — 세무서에 먼저 물어보십니다",
    url:"https://www.hometax.go.kr", checked:true }
];

window.amSupportWhere = function(side){
  return (window.AM_SUPPORT_WHERE || []).filter(function(x){
    return !side || x.side === side || x.side === "both";
  }).map(function(x){
    return x.checked && x.url ? x : Object.assign({}, x, { url:"" });
  });
};

window.amSupports = function(side){
  return (window.AM_SUPPORTS||[]).filter(function(s){
    if(!s.link) return false;
    return !side || s.side === side || s.side === "both";
  });
};
