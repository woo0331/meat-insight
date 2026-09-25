/* ════════════════════════════════════════════════════════════════════
   MY BUSINESS (/my)

   로그인이 없어도 **다시 올 이유**를 만드는 자리입니다. 진단 결과 ·
   창업 진행 · 창업비 · 견적 비교 · 읽던 글이 이 브라우저에 남아 있고,
   여기서 이어서 하실 수 있습니다.

   ⚠️ **전부 이 브라우저에만 있습니다.** 서버에 없습니다. 그래서
   기기를 바꾸면 안 보이고, 브라우저 기록을 지우면 없어집니다.
   그 사실을 화면 맨 위에 적습니다 — 나중에 "내 자료 어디 갔냐" 는
   말이 나오지 않게.

   ⚠️ **성함·연락처를 담지 않습니다.** 가게 컴퓨터·태블릿은 여러 사람이
   씁니다. 담는 것은 점수 · 체크 표시 · 사장님이 적은 금액까지입니다.

   ⚠️ `noindex` 입니다 (사람마다 다릅니다).
   ════════════════════════════════════════════════════════════════════ */

function PageMy(){
  var cards = [MyCheck(), MyStart(), MyCost(), MyQuotes(), MyRead()];
  var some  = cards.filter(function(c){ return c.has; });

  return '<section class="pg-hero"><div class="w">'+
      '<p class="eyebrow">MY BUSINESS</p>'+
      '<h1 class="pg-h1">지금까지 하신 것</h1>'+
      '<p class="pg-lead">'+
        (some.length
          ? '이어서 하시면 됩니다. 아래는 이 브라우저에 남아 있는 것들입니다.'
          : '아직 시작하신 것이 없습니다. 아래 중 하나부터 해 보세요 — '+
            '가입하지 않으셔도 되고, 3분이면 끝납니다.')+'</p>'+
      '<ul class="pg-facts">'+
        fact("lock", "전부 <b>이 브라우저에만</b> 있습니다. 서버에 올리지 않습니다.")+
        fact("info", "그래서 기기를 바꾸시면 안 보입니다. "+
                     "브라우저 기록을 지우면 같이 없어집니다.")+
        fact("user", "성함·연락처는 담지 않습니다.")+
      '</ul>'+
    '</div></section>'+

    '<div class="w my">'+
      '<div class="my-g">'+cards.map(MyCard).join("")+'</div>'+

      (some.length
        ? '<div class="st-foot">'+
            '<p class="note">이 기기에 남은 것을 전부 지웁니다. 되돌릴 수 없습니다.</p>'+
            '<button class="btn btn-o" type="button" onclick="myReset()">'+
              icon("refresh",18)+'내 기록 전부 지우기</button>'+
          '</div>'
        : '')+

      '<section class="st-cta">'+
        '<h2>여기 없는 것은 사람이 합니다.</h2>'+
        '<p>진단도 계산도 결국 사장님 가게를 봐야 답이 나옵니다. '+
          '지금 막힌 것을 적어 주시면 무엇이 필요한 일인지부터 정리해 드립니다.</p>'+
        '<div class="row-cta">'+
          '<a class="btn btn-b btn-lg" href="/sos">무료로 물어보기'+icon("arrow",18)+'</a>'+
          CallButton("btn btn-o btn-lg","전화로 문의")+
        '</div>'+
      '</section>'+
    '</div>';
}

/* 카드 하나 — has 가 false 면 "아직 안 하셨습니다" 로 그립니다.
   ⚠️ 빈 칸을 숨기지 않습니다. 무엇을 할 수 있는 곳인지 모르게 됩니다. */
function MyCard(c){
  return '<a class="mycard'+(c.has?"":" mycard-off")+'" href="'+esc(c.to)+'">'+
    '<span class="mycard-h">'+
      '<span class="mycard-ic">'+icon(c.icon,22)+'</span>'+
      '<b>'+esc(c.name)+'</b>'+
      (c.has ? '<span class="mycard-v">'+c.value+'</span>' : '')+
    '</span>'+
    '<span class="mycard-l">'+(c.has ? c.line : esc(c.empty))+'</span>'+
    '<span class="mycard-go">'+esc(c.has ? c.cta : c.ctaOff)+icon("chev",16)+'</span>'+
  '</a>';
}

function MyCheck(){
  var last = (typeof chkLast === "function") ? chkLast() : null;
  if(!last) return { has:false, icon:"gauge", name:"무료 사업진단", to:"/check",
    empty:"8가지로 지금 무엇을 파악하고 계신지 정리합니다. 3분.",
    ctaOff:"진단 시작하기" };
  var band = wowCheckBand(last.score);
  var names = (last.weak||[]).map(function(k){
    var it = WOW_CHECK.filter(function(x){ return x.key === k; })[0];
    return it ? it.name : null; }).filter(Boolean).slice(0,3);
  return { has:true, icon:"gauge", name:"무료 사업진단", to:"/check",
    value:'<b class="st st-'+esc(band.tone)+'">'+last.score+'점</b>',
    line: names.length
      ? '<b>'+esc(names.join(" · "))+'</b>'+esc(josa(names[names.length-1],"이가"))+' 약하게 나왔습니다.'
      : '여덟 가지를 다 보고 계십니다.',
    cta:"다시 진단하기" };
}

function MyStart(){
  var done = 0, total = (window.WOW_STARTUP_STEPS || []).length;
  try{
    var o = JSON.parse(localStorage.getItem("wow.start.v1") || "{}");
    done = WOW_STARTUP_STEPS.filter(function(s){ return o[s.key]; }).length;
  }catch(e){}
  if(!done) return { has:false, icon:"seed", name:"창업 프로젝트", to:"/start",
    empty:"상권부터 오픈까지 "+total+"가지를 순서대로. 하신 것을 눌러 두시면 남습니다.",
    ctaOff:"창업 단계 보기" };
  return { has:true, icon:"seed", name:"창업 프로젝트", to:"/start",
    value:'<b>'+done+' / '+total+'</b>',
    line: done === total ? '다 하셨습니다. 오픈 준비만 남았습니다.'
                         : '다음에 하실 것이 <b>'+(total-done)+'가지</b> 남았습니다.',
    cta:"이어서 하기" };
}

function MyCost(){
  var sum = 0, n = 0;
  try{
    var o = JSON.parse(localStorage.getItem("wow.cost.v1") || "{}");
    Object.keys(o).forEach(function(k){
      var v = parseFloat(String(o[k]).replace(/[^0-9.]/g,""));
      if(isFinite(v) && v > 0){ sum += v; n++; }
    });
  }catch(e){}
  if(!n) return { has:false, icon:"won", name:"창업비 정리표", to:"/start/cost",
    empty:"빠뜨리기 쉬운 13칸. 받으신 견적을 적으면 합계와 빈 칸이 보입니다.",
    ctaOff:"정리표 열기" };
  return { has:true, icon:"won", name:"창업비 정리표", to:"/start/cost",
    value:'<b>'+won(Math.round(sum))+'<em>만원</em></b>',
    line: n + '칸을 적으셨습니다. <b>' + (13 - n) + '칸</b>이 아직 비어 있습니다.',
    cta:"이어서 적기" };
}

function MyQuotes(){
  var b = (typeof qcBrief === "function") ? qcBrief() : { n:0 };
  if(!b.n) return { has:false, icon:"scale", name:"견적 비교", to:"/quotes",
    empty:"받으신 견적을 나란히 놓고 금액·일정·A/S·포함 범위를 비교합니다.",
    ctaOff:"견적 비교하기" };
  return { has:true, icon:"scale", name:"견적 비교", to:"/quotes",
    value:'<b>'+b.n+'곳</b>',
    line:(b.title ? '<b>'+esc(b.title)+'</b> · ' : '')+
         (b.n < 2 ? '한 곳뿐입니다. 두 곳 이상이어야 비교가 됩니다.'
                  : '물어볼 것 '+b.asked+' / '+b.total+' 을 확인하셨습니다.'),
    cta:"비교 화면 열기" };
}

function MyRead(){
  var recent = (typeof labRecent === "function") ? labRecent(3) : [];
  if(!recent.length) return { has:false, icon:"doc", name:"읽던 글", to:"/lab",
    empty:"원가 · 거래처 · 덕트 · 냉장 · 인허가 · 노무. 읽고 바로 할 수 있는 것까지.",
    ctaOff:"연구소 둘러보기" };
  return { has:true, icon:"doc", name:"읽던 글", to:"/lab/"+recent[0].slug,
    value:'<b>'+recent.length+'편</b>',
    line:'<b>'+esc(recent[0].title)+'</b>'+
         (recent.length > 1 ? ' 외 '+(recent.length-1)+'편' : ''),
    cta:"이어서 읽기" };
}

/* ⚠️ 되돌릴 수 없으므로 한 번 물어봅니다 */
window.myReset = function(){
  if(!confirm("이 브라우저에 남은 진단 결과 · 창업 체크 · 창업비 · 견적 비교 · 읽던 글을 전부 지웁니다.\n되돌릴 수 없습니다. 지울까요?")) return;
  ["wow.check.v1","wow.start.v1","wow.cost.v1","wow.quotes.v1","wow.read.v1","wow.lab.v1"]
    .forEach(function(k){ try{ localStorage.removeItem(k); }catch(e){} });
  rerender(true);
  toast("이 기기에 남은 기록을 전부 지웠습니다.");
};
