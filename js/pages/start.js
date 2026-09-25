/* ════════════════════════════════════════════════════════════════════
   창업 프로젝트 — 지시서 9번

   스무 단계를 다섯 마디로 묶어 **순서대로** 보여 줍니다. 이 화면의
   값어치는 "빠진 게 없다" 가 아니라 **"지금 어디쯤인지 알려 준다"**
   는 데 있습니다.

   ⚠️ **기간·비용을 적지 마세요.** 지역·평수·업종에 따라 몇 배씩
   차이 납니다. 근거 없는 "평균 3개월 · 평균 1억" 은 지어낸 숫자입니다
   (지시서 43번 · 절대 규칙 1).

   ⚠️ 체크한 것은 **이 브라우저에만** 남습니다. 이름·연락처는 담지
   않습니다 — 가게 컴퓨터는 여러 사람이 씁니다. 지우는 단추도 같이
   내놓습니다.
   ════════════════════════════════════════════════════════════════════ */

var ST_KEY = "wow.start.v1";

/* ⚠️ localStorage 는 사파리 비공개 모드 등에서 **던집니다.** 감싸지
   않으면 화면이 통째로 안 그려집니다. */
function stLoad(){
  try{
    var raw = localStorage.getItem(ST_KEY);
    var o = raw ? JSON.parse(raw) : null;
    return (o && typeof o === "object") ? o : {};
  }catch(e){ return {}; }
}
function stSave(o){
  try{ localStorage.setItem(ST_KEY, JSON.stringify(o)); }catch(e){}
}

function PageStart(){
  var done = stLoad();
  var phases = wowStartupPhases();
  var total = WOW_STARTUP_STEPS.length;
  var got = WOW_STARTUP_STEPS.filter(function(s){ return done[s.key]; }).length;

  return '<section class="pg-hero pg-hero-d">'+
      '<div class="w">'+
      '<p class="eyebrow">창업 프로젝트</p>'+
      '<h1 class="pg-h1">고깃집 하나 차리는 데<br class="br-m"> 알아볼 게 너무 많으니까.</h1>'+
      '<p class="pg-lead">상권부터 오픈까지 '+total+'가지를 순서대로 정리했습니다. '+
        '하신 것을 눌러 두시면 다음에 뭘 해야 하는지가 한눈에 보입니다.</p>'+
      '<div class="row-cta">'+
        '<a class="btn btn-w btn-lg" href="/start/cost">창업비 정리하기'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-gh btn-lg" href="/sos?q='+
          encodeURIComponent("고깃집을 창업하려는데 뭐부터 해야 할지 모르겠어요.")+
          '">어디서부터 할지 물어보기</a>'+
      '</div>'+
    '</div></section>'+

    '<div class="w st">'+
      StProgress(got, total)+
      phases.map(function(p, pi){ return StPhase(p, pi, done); }).join("")+

      '<div class="st-foot">'+
        '<p class="note">체크한 것은 이 브라우저에만 남습니다. 서버로 보내지 않습니다.</p>'+
        '<button class="btn btn-o" type="button" onclick="stReset()">'+
          icon("refresh",18)+'체크 전부 지우기</button>'+
      '</div>'+

      '<section class="st-cta">'+
        '<h2>혼자 알아보시면 오래 걸립니다.</h2>'+
        '<p>단계마다 어디에 맡겨야 하는지까지 정리해 드립니다. '+
          '지금 막힌 단계를 그대로 적어 주세요.</p>'+
        '<div class="row-cta">'+
          '<a class="btn btn-b btn-lg" href="/sos?c=startup">창업 상담 받기'+icon("arrow",18)+'</a>'+
          '<a class="btn btn-o btn-lg" href="/start/cost">창업비부터 정리하기</a>'+
        '</div>'+
      '</section>'+
    '</div>';
}

function StProgress(got, total){
  var pct = total ? Math.round(got / total * 100) : 0;
  return '<div class="st-pg">'+
    '<div class="st-pg-t"><b>'+got+' / '+total+'</b>'+
      '<span>'+(got === 0 ? "아직 시작 전입니다. 위에서부터 보시면 됩니다."
             : got === total ? "다 하셨습니다. 오픈 준비만 남았습니다."
             : "지금까지 하신 것입니다.")+'</span></div>'+
    '<div class="st-pg-b"><span style="width:'+pct+'%"></span></div>'+
  '</div>';
}

function StPhase(p, pi, done){
  var got = p.items.filter(function(s){ return done[s.key]; }).length;
  return '<section class="st-ph">'+
    '<div class="st-ph-h">'+
      '<span class="st-ph-n">'+("0"+(pi+1))+'</span>'+
      '<span class="st-ph-ic">'+icon(p.icon,22)+'</span>'+
      '<span class="st-ph-t"><b>'+esc(p.name)+'</b>'+
        '<span>'+esc(p.line)+'</span></span>'+
      '<span class="st-ph-c">'+got+'/'+p.items.length+'</span>'+
    '</div>'+
    '<ul class="st-l">'+p.items.map(function(s){ return StStep(s, done); }).join("")+'</ul>'+
  '</section>';
}

function StStep(s, done){
  var on = !!done[s.key];
  var svc = s.svc ? wowServiceName(s.svc) : null;
  return '<li class="st-i'+(on?" on":"")+'">'+
    /* ⚠️ 누르는 자리는 체크박스가 아니라 **줄 전체**입니다.
       20px 짜리 네모를 손가락으로 맞추게 하지 않습니다. */
    '<label class="st-i-l">'+
      '<input type="checkbox" '+(on?"checked ":"")+
        'onchange="stToggle(\''+esc(s.key)+'\', this.checked)">'+
      '<span class="st-i-b">'+
        '<b>'+icon(s.icon,18)+esc(s.name)+'</b>'+
        (s.line ? '<span class="st-i-d">'+esc(s.line)+'</span>' : '')+
      '</span>'+
    '</label>'+
    '<span class="st-i-r">'+
      (s.self
        ? '<span class="st-tag st-tag-self">사장님이 정합니다</span>'
        : (svc ? '<a class="st-tag st-tag-svc" href="/request?s='+encodeURIComponent(s.svc)+'">'+
             esc(svc)+' 견적'+icon("chev",14)+'</a>' : ''))+
    '</span>'+
  '</li>';
}

window.stToggle = function(key, on){
  var o = stLoad();
  if(on) o[key] = 1; else delete o[key];
  stSave(o);
  rerender(true);
};

window.stReset = function(){
  stSave({});
  toast("체크를 전부 지웠습니다.");
  rerender(true);
};

/* ════════════════════════════════════════════════════════════════════
   창업비 정리표 — 지시서 10번

   ⚠️ **가격을 지어내지 않습니다.** 지시서 10번이 못 박아 둔 것입니다 —
   "초기 데이터가 충분하지 않으면 정확한 가격을 지어내지 말 것."
   지역·평수·업종·시공 수준에 따라 항목마다 몇 배씩 차이 납니다.
   근거 없는 "예상 3,200만원" 은 사장님이 그 숫자로 돈을 빌리러 갑니다.

   그래서 이 화면은 **계산기가 아니라 정리표**입니다.
     · 빠뜨리기 쉬운 항목을 전부 늘어놓고
     · 사장님이 **실제로 받은 견적**을 칸에 적으면
     · 합계와 빠진 칸을 보여 줍니다.
   숫자는 전부 사장님 것이라 틀릴 여지가 없고, "아직 안 받은 견적" 이
   몇 개인지가 그 자리에서 보입니다. 그게 이 화면의 값어치입니다.
   ════════════════════════════════════════════════════════════════════ */

var COST_KEY = "wow.cost.v1";
/* 정리표 칸 — WOW_COST_PARTS 에 어느 서비스로 견적을 받는지를 붙였습니다 */
var COST_ROWS = [
  { key:"shop",     name:"점포",      icon:"building", svc:null,
    hint:"보증금 · 권리금 · 첫 달 임대료" },
  { key:"interior", name:"인테리어",  icon:"store",    svc:"interior",
    hint:"철거 · 목공 · 전기 · 도장" },
  { key:"duct",     name:"덕트 · 환기", icon:"fire",   svc:"duct",
    hint:"화구 수가 용량을 정합니다" },
  { key:"kitchen",  name:"주방",      icon:"tool",     svc:"kitchen",
    hint:"급배수 · 후드 · 가스" },
  { key:"cold",     name:"냉장 · 냉동", icon:"snow",   svc:"cold",
    hint:"워크인 · 쇼케이스 · 숙성고" },
  { key:"meatgear", name:"정육장비",  icon:"knife",    svc:"slicer",
    hint:"육절기 · 골절기 · 진공기 · 저울" },
  { key:"table",    name:"테이블 · 로스터", icon:"layers", svc:null,
    hint:"좌석 수 × 단가" },
  { key:"sign",     name:"간판",      icon:"bulb",     svc:"sign",
    hint:"외부 · 내부 사인" },
  { key:"pos",      name:"POS · 기기", icon:"chart",   svc:"pos",
    hint:"POS · 키오스크 · CCTV · 인터넷" },
  { key:"first",    name:"초도 육류 · 식자재", icon:"truck", svc:"beef-supply",
    hint:"첫 발주분" },
  { key:"permit",   name:"인허가 · 등록", icon:"shield", svc:null,
    hint:"영업신고 · 위생교육 · 소방 · 옥외광고물" },
  { key:"market",   name:"오픈 마케팅", icon:"megaphone", svc:"marketing",
    hint:"전단 · 지도등록 · 사진" },
  { key:"buffer",   name:"운전자금",  icon:"won",      svc:null,
    hint:"자리 잡을 때까지 버틸 돈. 제일 많이 빠뜨리는 칸입니다" }
];

function costLoad(){
  try{
    var o = JSON.parse(localStorage.getItem(COST_KEY) || "{}");
    return (o && typeof o === "object") ? o : {};
  }catch(e){ return {}; }
}
function costSave(o){ try{ localStorage.setItem(COST_KEY, JSON.stringify(o)); }catch(e){} }

function PageCost(){
  var v = costLoad();
  return '<section class="pg-hero"><div class="w">'+
      '<p class="eyebrow">창업비 정리표</p>'+
      '<h1 class="pg-h1">창업비, 빠뜨린 칸이 있으신가요?</h1>'+
      '<p class="pg-lead">받으신 견적을 칸에 적으시면 합계와 <b>아직 안 받은 견적</b>이 '+
        '한눈에 보입니다.</p>'+
      /* ⚠️ 할 수 없는 것을 **쓰기 전에** 말합니다. */
      '<ul class="pg-facts">'+
        fact("info", "<b>예상 금액을 알려 드리지 않습니다.</b> "+
          "같은 40평이라도 지역·시공 수준에 따라 몇 배씩 차이 납니다. "+
          "근거 없는 숫자로 사업계획을 세우시면 안 됩니다.")+
        fact("lock", "적으신 금액은 이 브라우저에만 남습니다. 서버로 보내지 않습니다.")+
        fact("hand", "모르는 칸은 비워 두세요. 그 칸이 바로 견적을 받아야 할 곳입니다.")+
      '</ul>'+
    '</div></section>'+

    '<div class="w cost">'+
      '<ul class="cost-l">'+COST_ROWS.map(function(r){
        var svc = r.svc ? wowServiceName(r.svc) : null;
        return '<li class="cost-i">'+
          '<span class="cost-ic">'+icon(r.icon,20)+'</span>'+
          '<span class="cost-t"><b>'+esc(r.name)+'</b>'+
            '<span>'+esc(r.hint)+'</span></span>'+
          '<span class="cost-in">'+
            '<label class="sr" for="cs-'+esc(r.key)+'">'+esc(r.name)+' 금액</label>'+
            '<input id="cs-'+esc(r.key)+'" type="text" inputmode="numeric"'+
              ' placeholder="" value="'+esc(v[r.key]||"")+'"'+
              ' autocomplete="off" oninput="costIn(\''+esc(r.key)+'\',this.value)">'+
            '<em>만원</em></span>'+
          (svc ? '<a class="cost-go" href="/request?s='+encodeURIComponent(r.svc)+'">'+
             '견적 받기'+icon("chev",14)+'</a>'
               : '<span class="cost-go cost-go-off">직접 정하는 칸</span>')+
        '</li>';
      }).join("")+'</ul>'+

      '<div class="cost-sum" id="cost-sum">'+CostSum(v)+'</div>'+

      '<div class="st-foot">'+
        '<button class="btn btn-o" type="button" onclick="costReset()">'+
          icon("refresh",18)+'적은 금액 전부 지우기</button>'+
      '</div>'+

      '<section class="st-cta">'+
        '<h2>빈 칸부터 견적을 받아 보세요.</h2>'+
        '<p>어떤 칸인지 적어 주시면 조건에 맞는 곳을 찾아 견적을 받아 드립니다. '+
          '비용은 들지 않습니다.</p>'+
        '<div class="row-cta">'+
          '<a class="btn btn-b btn-lg" href="/request">견적 요청하기'+icon("arrow",18)+'</a>'+
          '<a class="btn btn-o btn-lg" href="/start">창업 단계 보기</a>'+
        '</div>'+
      '</section>'+
    '</div>';
}

function CostSum(v){
  var sum = 0, filled = 0;
  COST_ROWS.forEach(function(r){
    var n = parseFloat(String(v[r.key]||"").replace(/[^0-9.]/g,""));
    if(isFinite(n) && n > 0){ sum += n; filled++; }
  });
  var left = COST_ROWS.length - filled;
  return '<div class="cost-sum-l">'+
      '<span>적으신 '+filled+'칸 합계</span>'+
      '<b>'+(filled ? won(Math.round(sum))+'<em>만원</em>' : '<em class="cost-none">—</em>')+'</b>'+
    '</div>'+
    '<p class="cost-sum-p">'+
      (filled === 0
        ? '받으신 견적을 위에 적어 보세요. 합계가 여기 나옵니다.'
        : left > 0
          ? '아직 <b>'+left+'칸</b>이 비어 있습니다. 창업비가 계획보다 커지는 이유는 '+
            '대개 이 빈 칸들입니다.'
          : '모든 칸을 채우셨습니다. 이 합계는 <b>사장님이 적으신 금액을 더한 값</b>이고, '+
            '저희가 예상한 금액이 아닙니다.')+
    '</p>';
}

window.costIn = function(key, val){
  var o = costLoad();
  if(String(val||"").trim()) o[key] = val; else delete o[key];
  costSave(o);
  var el = $("cost-sum");
  if(el) el.innerHTML = CostSum(o);   /* 입력 중이라 화면을 다시 그리지 않습니다 */
};

window.costReset = function(){
  costSave({});
  toast("적으신 금액을 전부 지웠습니다.");
  rerender(true);
};
