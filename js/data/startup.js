/* ════════════════════════════════════════════════════════════════════
   창업 프로젝트 — 지시서 9번의 20가지 그대로

   순서가 곧 **일하는 순서**입니다. 상권을 못 정했는데 간판부터 알아보는
   사장님이 실제로 많습니다. 이 목록의 값어치는 "빠진 것이 없다" 가
   아니라 **"지금 어디쯤인지 알려 준다"** 는 데 있습니다.

   ⚠️ `svc` 는 그 단계에서 실제로 부르게 되는 파트너 서비스입니다
   (js/data/services.js). 비어 있는 단계는 업체를 부르는 일이 아니라
   사장님이 직접 정하는 일입니다 — 그 차이를 화면에서 보여 줍니다.

   ⚠️ **기간·비용을 여기에 적지 마세요.** 지역·평수·업종에 따라 몇 배씩
   차이 납니다. 숫자는 창업비 계산기(/start/cost)가 **범위로** 말합니다.
   ════════════════════════════════════════════════════════════════════ */

window.WOW_STARTUP_STEPS = [
  { key:"area", icon:"pin", name:"상권",       svc:null,        self:true,
    line:"어디서 할지. 여기서 틀리면 나머지가 다 소용없습니다." },
  { key:"shop", icon:"building", name:"점포",       svc:null,        self:true,
    line:"평수 · 층 · 권리금 · 임대조건" },
  { key:"plan", icon:"doc", name:"사업계획",   svc:"consult",
    line:"메뉴 · 객단가 · 목표 매출 · 손익 계산" },
  { key:"interior", icon:"store", name:"인테리어",   svc:"interior",
    line:"고깃집은 환기와 동선이 먼저입니다" },
  { key:"duct", icon:"fire", name:"덕트 · 환기", svc:"duct",
    line:"민원의 대부분이 여기서 나옵니다" },
  { key:"kitchen", icon:"tool", name:"주방",       svc:"kitchen",
    line:"급배수 · 후드 · 가스 배관" },
  { key:"cold", icon:"snow", name:"냉장 · 냉동", svc:"cold",
    line:"워크인 · 쇼케이스 · 숙성고" },
  { key:"meatgear", icon:"knife", name:"정육장비",   svc:"slicer",
    line:"육절기 · 골절기 · 진공기 · 저울" },
  { key:"table", icon:"layers", name:"테이블 · 로스터", svc:null,
    line:"좌석 수와 화구 수가 덕트 용량을 정합니다" },
  { key:"sign", icon:"bulb", name:"간판",       svc:"sign",
    line:"옥외광고물 신고가 필요할 수 있습니다" },
  { key:"pos", icon:"chart", name:"POS",        svc:"pos",   line:"" },
  { key:"cctv", icon:"camera", name:"CCTV",       svc:"cctv",  line:"" },
  { key:"net", icon:"globe", name:"인터넷",     svc:"net",   line:"" },
  { key:"beef", icon:"truck", name:"육류 공급",  svc:"beef-supply",
    line:"거래처가 원가를 정합니다. 최소 세 곳은 비교하세요" },
  { key:"food", icon:"box", name:"식자재",     svc:"food",  line:"" },
  { key:"drink", icon:"box", name:"주류",       svc:"drink", line:"" },
  { key:"permit", icon:"shield", name:"인허가",     svc:null,    self:true,
    line:"영업신고 · 위생교육 · 소방 · 옥외광고물" },
  { key:"tax", icon:"doc", name:"세무 · 노무", svc:"tax",
    line:"사업자등록 · 4대보험 · 근로계약서" },
  { key:"market", icon:"megaphone", name:"마케팅",     svc:"marketing",
    line:"오픈 전에 시작해야 오픈 날 손님이 옵니다" },
  { key:"open", icon:"check", name:"오픈준비",   svc:null,    self:true,
    line:"시운전 · 교육 · 시식 · 초도 발주" }
];

/* ── 다섯 마디 (메인 · /start 가 같이 씁니다) ───────────────
   스무 개를 한 줄로 늘어놓으면 숨이 막힙니다. 일이 실제로 묶이는
   단위로 다섯 마디를 만들어 두고, 그 안에서 순서를 봅니다.

   ⚠️ `steps` 는 위 WOW_STARTUP_STEPS 의 key 입니다. 단계를 더하거나
   빼면 여기도 같이 고치세요 — `wowStartupPhases()` 가 어긋난 key 를
   조용히 버리지 않고 console.warn 으로 알려 줍니다. */
window.WOW_STARTUP_PHASES = [
  { key:"place", name:"자리 정하기", icon:"pin",
    line:"어디서 · 몇 평으로 · 무엇을 팔지",
    steps:["area","shop","plan"] },
  { key:"build", name:"공사", icon:"tool",
    line:"한 번 하면 오래 갑니다. 여기서 아끼면 나중에 두 배로 듭니다",
    steps:["interior","duct","kitchen"] },
  { key:"gear", name:"설비 · 장비", icon:"snow",
    line:"고기를 보관하고 손질하고 구울 것들",
    steps:["cold","meatgear","table","sign"] },
  { key:"supply", name:"거래처 · 운영", icon:"truck",
    line:"매달 나가는 돈이 여기서 정해집니다",
    steps:["beef","food","drink","pos","cctv","net"] },
  { key:"open", name:"오픈", icon:"megaphone",
    line:"빠뜨리면 문을 못 여는 것들",
    steps:["permit","tax","market","open"] }
];

/* 마디마다 실제 단계 객체를 담아 돌려줍니다.
   ⚠️ 어느 마디에도 안 들어간 단계가 있으면 알려 줍니다 — 조용히
   빠지면 화면에서 그 단계가 통째로 사라집니다. */
window.wowStartupPhases = function(){
  var byKey = {}, used = {};
  WOW_STARTUP_STEPS.forEach(function(s){ byKey[s.key] = s; });
  var out = WOW_STARTUP_PHASES.map(function(p){
    var items = [];
    p.steps.forEach(function(k){
      if(!byKey[k]){
        try{ console.warn("[ABOUTMEAT] 창업 단계 '"+k+"' 를 찾지 못했습니다 — "+
          "js/data/startup.js 의 WOW_STARTUP_PHASES 와 WOW_STARTUP_STEPS 가 어긋났습니다."); }catch(e){}
        return;
      }
      used[k] = 1; items.push(byKey[k]);
    });
    return { key:p.key, name:p.name, icon:p.icon, line:p.line, items:items };
  });
  var left = WOW_STARTUP_STEPS.filter(function(s){ return !used[s.key]; });
  if(left.length){
    try{ console.warn("[ABOUTMEAT] 어느 마디에도 안 들어간 창업 단계: "+
      left.map(function(s){ return s.key; }).join(", ")); }catch(e){}
  }
  return out;
};

/* ── 창업비 계산기가 묻는 것 (지시서 10번) ────────────────
   ⚠️ **초기 데이터가 충분하지 않으면 정확한 가격을 지어내지 마세요.**
   지시서 10번이 못 박아 둔 것입니다. 결과는 반드시 "예상 범위 · 참고용"
   이라고 화면에 적고, 근거가 없는 항목은 아예 빼세요. */
window.WOW_COST_FIELDS = [
  { key:"region",   label:"지역",        type:"region", need:true },
  { key:"kind",     label:"업종",        type:"pick",  need:true,
    opts:["고깃집","정육식당","정육점","정육점+식당"] },
  { key:"pyeong",   label:"평수",        type:"num",   need:true, unit:"평" },
  { key:"seats",    label:"예상 좌석",   type:"num",   unit:"석" },
  { key:"meat",     label:"주력 육류",   type:"pick",
    opts:["한우","한돈","수입육","섞어서"] },
  { key:"level",    label:"인테리어 수준", type:"pick",
    opts:["기본","중간","고급"] },
  { key:"prev",     label:"점포 상태",   type:"pick",
    opts:["신규 점포","기존 음식점 자리"] },
  { key:"budget",   label:"예상 예산",   type:"money", unit:"원" },
  { key:"openAt",   label:"오픈 예정일", type:"date" }
];

/* 결과에서 나누어 보여 줄 항목 (지시서 10번) */
window.WOW_COST_PARTS = [
  "점포","인테리어","덕트","주방","냉장설비","정육장비","POS","간판",
  "초도 육류","운전자금"
];
