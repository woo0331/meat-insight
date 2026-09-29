/* ════════════════════════════════════════════════════════════════════
   메인 (§2 · §57)

   손님이 **3초 안에** 알아야 하는 것은 하나뿐입니다 —
   "가게 시작하거나 정리할 때 여기 들어오면 되는구나."

   그래서 첫 화면에 크게 두는 것은 **선택 두 개**뿐입니다.

   ⚠️ **모든 기능을 메인에 늘어놓지 마세요** (§54). 기능이 많아 보이면
   무엇을 하는 곳인지가 묻힙니다. 여기서 하는 일은 손님을 창업 쪽이나
   폐업 쪽으로 **보내는 것**까지입니다.
   ⚠️ **업체 · 브랜드 · 매물 카드를 첫 화면에 나열하지 마세요.** 지금
   0 곳이라 지어내게 되고, 채워지더라도 그건 전화번호부입니다 (§54).
   ⚠️ **지어낸 숫자를 쓰지 마세요** — 등록 업체 수 · 누적 거래 · 만족도.
   지금 그 값이 하나도 없습니다.
   ════════════════════════════════════════════════════════════════════ */

function PageHome(){
  /* ── 메인 구간 차례 (§23) ───────────────────────────────────
     01 압도적인 히어로 — 창업이냐 폐업이냐, 두 낱말
     02 신뢰 줄 — 지금 사실인 것만
     03 대형 통합검색 — 찾으러 오신 분을 바로 보냅니다
     04 업종 선택 — 여기서부터 화면이 사장님 것이 됩니다
     05 프랜차이즈 — 아직 무엇을 할지 못 정하셨다면
     06 매장 인수 — ⚠️ 매물이 0건이면 **구간째 빠집니다**
     07 창업 ↔ 폐업 연결 — 이 플랫폼의 차별점
     08 폐업 솔루션 — 무엇을 원하시는지부터
     09 어떻게 진행되나 — 세 걸음
     10 사장님 도구 — 지금 당장 되는 것
     11 우리가 다루는 범위 — 실적이 아니라 범위
     12 업체 입점 — 공급 쪽 CTA
     13 자주 묻는 것 · 14 마지막 CTA

     ⚠️ **없는 데이터로 구간을 만들지 마세요** (§27). "지금 많이 찾는
     서비스" · "실제 인기 업체" · "실제 견적 가격" · "실제 후기" 는
     지시서에 있지만 지금 값이 하나도 없습니다 — 만들면 그게
     허위 데이터입니다. 자리와 데이터 구조는 갖춰 두었으니 실제
     데이터가 들어오면 그때 냅니다. */
  return Hero()+
         TrustBar()+
         SearchBand()+
         IndustryBand()+
         FranchiseBand()+
         StoreBand()+
         BridgeBand()+
         CloseBand()+
         HowBand()+
         ToolBand()+
         ScaleBand()+
         JoinBand()+
         FaqBand()+
         FinalBand();
}

/* ── 01 Split Hero — 첫 화면의 주인공은 두 낱말뿐입니다 ────────
   ⚠️ **설명문과 잔 요소로 시선을 나누지 마세요.** 여기서 손님이 할
   일은 딱 하나입니다 — 시작이냐 정리냐. 그 둘만 크게 둡니다.

   ⚠️ **대비는 색이 아니라 무게와 짜임새입니다** (§4). 빨강/초록으로
   나누면 촌스러워지고 "폐업은 나쁜 것" 이라는 말이 됩니다. 두 쪽 다
   같은 남색 계열이고 **깊이만** 다릅니다 — 왼쪽은 푸른 기가 도는
   남색, 오른쪽은 거의 검정에 가까운 남색.

   ⚠️ **사진이 없으면 빈 액자를 두지 않습니다** (절대 규칙 2).
   `photoBox()` 가 없을 때 `.ph-none` 을 돌려주고, 그때는 겹(`.sh-v`)
   자체가 배경이 됩니다. 사진이 생기면 `WOW_PHOTOS` 의 경로만 바꾸면
   그대로 깔립니다 — 화면은 안 고칩니다.

   ⚠️ **색을 정하는 것은 사진이 아니라 겹입니다.** 사진을 아무리
   좋은 것으로 바꿔도 겹이 잿빛이면 화면은 회색 판입니다. */
function Hero(){
  var side = [
    { k:"START", n:"창업", to:"/startup", cls:"sh-start", ph:"hero-start",
      lead:"처음부터 제대로.",
      sub:"점포부터 인테리어, 장비, 프랜차이즈, 세무, 마케팅까지.",
      go:"창업 시작하기" },
    { k:"CLOSE", n:"폐업", to:"/closure", cls:"sh-close", ph:"hero-close",
      lead:"끝까지 제대로.",
      sub:"매장양도부터 집기처분, 철거, 원상복구, 세무까지.",
      go:"폐업 시작하기" }
  ];
  /* ⚠️ `h1` 은 화면에 **딱 하나**여야 합니다. 두 낱말이 주인공이지만
     제목은 하나라, 읽어 주는 프로그램용으로 한 줄을 두고 눈에 보이는
     큰 글자는 그 안의 `<em>` 으로 둡니다. */
  return '<section class="shero">'+
    '<h1 class="sr-only">창업에 필요한 모든 것, 폐업에 필요한 모든 것 — '+
      esc(amBrand())+'</h1>'+
    '<div class="sh-g">'+ side.map(function(d, i){
      return '<a class="sh '+d.cls+'" href="'+esc(d.to)+'">'+
        '<span class="sh-ph">'+photoBox(d.ph, "sh-img", i === 0)+'</span>'+
        '<span class="sh-v" aria-hidden="true"></span>'+
        '<span class="sh-in">'+
          '<span class="sh-k">'+esc(d.k)+'</span>'+
          '<em class="sh-n">'+esc(d.n)+'</em>'+
          '<b class="sh-l">'+esc(d.lead)+'</b>'+
          '<span class="sh-d">'+esc(d.sub)+'</span>'+
          '<span class="sh-go">'+esc(d.go)+icon("arrow",20)+'</span>'+
        '</span>'+
      '</a>';
    }).join("")+'</div>'+
  '</section>';
}

/* ── 02 신뢰 줄 ──────────────────────────────────────────────────
   ⚠️ **회원 수 · 만족도 · 누적 건수를 적지 마세요** (§54). 여기 적는
   것은 전부 **우리가 지키겠다는 약속**이고, 지금 당장 사실인 것입니다. */
function TrustBar(){
  var rows = [
    ["won",   "찾고 비교하는 것은 무료",   "상담료를 받지 않습니다"],
    ["scale", "추천 · 광고는 그렇다고 표시합니다", "일반 결과는 조건 적합도 순입니다"],
    ["shield","중개자이고 거래 당사자가 아닙니다", "계약은 업체와 직접 하십니다"],
    ["map",   "전국 시 · 군 · 구 기준",     "지역이 맞아야 견적이 뜻이 있습니다"]
  ];
  return '<section class="tbar"><div class="w tbar-g">'+
    rows.map(function(r){
      return '<div class="tbar-i">'+icon(r[0],20)+
        '<span><b>'+esc(r[1])+'</b><em>'+esc(r[2])+'</em></span></div>';
    }).join("")+
  '</div></section>';
}

/* ── 02-2 규모감 — 우리가 다루는 범위 ───────────────────────────
   "플랫폼 규모감" 은 회원 수 · 거래액으로 내는 것이 아닙니다. 그건
   지금 0 이고, 지어내면 절대 규칙 1 위반입니다.

   대신 **우리가 실제로 다루는 범위**를 보여 줍니다. 이건 지어낼 수가
   없습니다 — 아래 숫자는 전부 `AM_INDUSTRIES` · `AM_CATS` 를 **그
   자리에서 세는 것**이라, 분류를 하나 늘리면 숫자도 같이 늘고,
   손으로 고쳐 쓸 자리가 없습니다.

   ⚠️ **여기에 업체 수 · 계약 수 · 만족도를 붙이지 마세요.** 그건
   성과이지 범위가 아니고, 지금 그 값이 하나도 없습니다.
   ⚠️ **`n+` 꼴로 쓰지 마세요.** "183+" 는 센 값이 아니라 부풀린
   값입니다. 센 값은 그냥 183 입니다. */
function ScaleBand(){
  var ind = (window.AM_INDUSTRIES || []).length;
  var st  = (window.AM_START_CATS || []).length;
  var cl  = (window.AM_CLOSE_CATS || []).length;
  var sub = (window.AM_CATS || []).reduce(function(a, c){
    return a + ((c.items || []).length); }, 0);

  /* ⚠️ 데이터가 비면 이 구간을 통째로 뺍니다 (절대 규칙 2).
     "0개 분야" 는 규모감이 아니라 미완성 표시입니다. */
  if(!ind || !st || !cl || !sub) return "";

  var n = [
    [ind, "업종",        "음식점부터 사무 · 전문서비스까지"],
    [st,  "창업 분야",   "점포 · 인테리어 · 장비 · 인허가 · 자금"],
    [cl,  "폐업 분야",   "양도 · 처분 · 철거 · 원상복구 · 세무"],
    [sub, "세부 서비스", "업종을 고르시면 필요한 것만 추려 드립니다"]
  ];
  return '<section class="scale"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">우리가 다루는 범위</p>'+
      '<h2 class="scale-h">가게 하나를 열고 닫는 데<br class="br-m"> '+
        '필요한 것은 <em>생각보다 많습니다.</em></h2>'+
    '</div>'+
    '<ul class="scale-g">'+ n.map(function(x){
      /* ⚠️ grid 칸에 맨글을 두지 않습니다 — 태그로 감쌉니다. */
      return '<li class="scale-i">'+
        '<b class="scale-n">'+x[0]+'</b>'+
        '<span class="scale-k">'+esc(x[1])+'</span>'+
        '<span class="scale-l">'+esc(x[2])+'</span>'+
      '</li>';
    }).join("")+'</ul>'+
    /* ⚠️ 이 줄을 지우지 마세요. 숫자만 크게 띄우면 "업체가 183곳" 으로
       읽힙니다. 무엇을 센 값인지 밝혀야 합니다. */
    '<p class="scale-n-b">이 숫자는 저희가 다루는 <b>분야의 수</b>입니다. '+
      '등록된 업체 수나 거래 실적이 아닙니다.</p>'+
  '</div></section>';
}

/* ── 03 업종으로 바로 (§6 · §41) ────────────────────────────────
   창업 쪽으로 한 걸음 더 줄여 줍니다. 업종이 정해지면 그 뒤가
   전부 달라지기 때문에, 여기서 고르고 들어가면 제일 빠릅니다. */
function IndustryBand(){
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">업종부터 고르기</p>'+
      '<h2>어떤 사업을 준비하고 계세요?</h2>'+
      '<p>업종만 고르시면 그 업종 창업에 <b>실제로 필요한 것만</b> 추려 드립니다.</p>'+
    '</div>'+
    IndustryGrid("/startup","")+
    /* ⚠️ 문장 한가운데 링크를 박지 않습니다 — 16px 이라 누르기
       어렵습니다. 문단 끝에 버튼으로 내놓습니다. */
    '<p class="note note-mid">정리하시는 중이신가요?</p>'+
    '<div class="row-cta row-mid"><a class="btn btn-o" href="/closure">'+
      '폐업에서 시작하기'+icon("arrow",16)+'</a></div>'+
  '</div></section>';
}

/* ── 03-2 어떻게 진행되는가 (§37) ───────────────────────────────
   여태 메인 어디에도 **진행 방법**이 없었습니다. 손님이 "업체를
   보여 주는 곳" 까지는 알아도 "그래서 뭘 하면 되는데" 를 모르면
   거기서 닫습니다.

   ⚠️ **세 걸음을 넘기지 마세요.** 넷이 되는 순간 절차로 읽히고,
   절차로 읽히면 귀찮아 보입니다.
   ⚠️ **"몇 시간 안에" 를 적지 마세요** (절대 규칙 5). 업체 회신
   시점은 우리가 지킬 수 있는 약속이 아닙니다 — 약관 제8조와
   FAQ 가 같은 말을 합니다. */
function HowBand(){
  var step = [
    ["01", "조건을 고릅니다",
     "업종 · 지역 · 필요한 서비스. 가입하지 않으셔도 됩니다.",
     "sliders"],
    ["02", "한 번만 적어 보냅니다",
     "같은 내용을 업체마다 다시 적지 않으셔도 됩니다. "+
     "조건이 맞는 곳에 같이 전달합니다.",
     "mail"],
    ["03", "받으신 제안을 나란히 놓습니다",
     "금액만 보면 틀립니다. 무엇이 포함됐는지가 같아야 비교가 뜻을 "+
     "가집니다 — 그 자리를 만들어 드립니다.",
     "scale"]
  ];
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">어떻게 진행되나</p>'+
      '<h2>업체를 찾아 전화를 돌리는 대신,<br class="br-m"> '+
        '한 번만 적으시면 됩니다.</h2>'+
    '</div>'+
    '<ol class="how-g">'+ step.map(function(x){
      return '<li class="how-i">'+
        '<span class="how-n">'+esc(x[0])+'</span>'+
        '<span class="how-ic">'+icon(x[3],22)+'</span>'+
        '<b class="how-t">'+esc(x[1])+'</b>'+
        '<span class="how-d">'+esc(x[2])+'</span>'+
      '</li>';
    }).join("")+'</ol>'+
    '<div class="row-cta"><a class="btn btn-b btn-lg" href="/quote">'+
      '견적 요청하기'+icon("arrow",18)+'</a>'+
      '<a class="btn btn-o btn-lg" href="/providers">업체 먼저 둘러보기</a></div>'+
  '</div></section>';
}

/* ── 04 무엇을 도와드리나 ────────────────────────────────────────
   ⚠️ 여기서도 **업체를 나열하지 않습니다.** 분류까지입니다. */
function WhatBand(){
  var st = (window.AM_START_CATS||[]).slice(0, 4);
  var cl = (window.AM_CLOSE_CATS||[]).slice(0, 4);
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">무엇을 찾아 드리나</p>'+
      '<h2>필요한 업체를 분류로 찾습니다</h2>'+
      '<p>지역과 업종을 고르시면 조건이 맞는 곳만 보여 드리고, '+
        '한 번 적으신 내용으로 여러 곳에 견적을 요청하실 수 있습니다.</p>'+
    '</div>'+
    '<div class="two">'+
      '<div class="two-c">'+
        '<div class="two-hd"><span class="two-k">START</span><b>창업</b>'+
          '<a class="sec-more" href="/startup">전부 보기'+icon("chev",15)+'</a></div>'+
        '<div class="cat-g">'+st.map(function(c){ return CatCard(c,""); }).join("")+'</div>'+
      '</div>'+
      '<div class="two-c">'+
        '<div class="two-hd"><span class="two-k">CLOSE</span><b>폐업</b>'+
          '<a class="sec-more" href="/closure">전부 보기'+icon("chev",15)+'</a></div>'+
        '<div class="cat-g">'+cl.map(function(c){ return CatCard(c,""); }).join("")+'</div>'+
      '</div>'+
    '</div>'+
  '</div></section>';
}

/* ── 05 창업 ↔ 폐업 (§34 · §57) ────────────────────────────────
   이 플랫폼의 차별점입니다. 다만 **양도양수 사이트처럼 보이면 안
   됩니다** (§34) — 그래서 한 장면으로만 두고, 매물 목록은 여기 안
   깝니다. */
function BridgeBand(){
  return '<section class="bridge">'+
    '<span class="bridge-glow" aria-hidden="true"></span>'+
    '<div class="w bridge-in">'+
      '<p class="bridge-k">창업 ↔ 폐업</p>'+
      '<h2 data-rv>한 사장님의 끝이<br class="br-m"> '+
        '<em>다른 사장님의 시작</em>이 됩니다.</h2>'+
      '<p class="bridge-p" data-rv>정리하시는 사장님이 내놓은 점포 · 시설 · 집기 · '+
        '재고를, 같은 업종을 준비하는 사장님이 찾습니다. '+
        '새로 사는 것보다 싸고, 버리는 것보다 낫습니다.</p>'+
      '<div class="row-cta row-mid">'+
        '<a class="btn btn-w btn-lg" href="/stores">점포 · 매장 보기'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-gh btn-lg" href="/assets">시설 · 집기 보기</a>'+
      '</div>'+
    '</div>'+
  '</section>';
}

/* ── 06 업체 입점 (§39) ──────────────────────────────────────────
   ⚠️ **"월 n건의 요청" · "등록 업체 n곳" 을 적지 마세요.** 지금 그
   값이 하나도 없습니다. 적을 수 있는 것은 **어떻게 하겠다는 약속**
   까지입니다. */
function JoinBand(){
  var how = [
    ["광고가 아니라 요청입니다",   "지역과 전문 분야가 맞는 요청만 보내 드립니다."],
    ["기본 입점은 무료입니다",     "프로필 · 지역 · 서비스 · 포트폴리오를 직접 관리하십니다."],
    ["광고는 광고라고 표시합니다",  "일반 검색 결과는 조건 적합도를 기준으로 냅니다."]
  ];
  return '<section class="sec sec-white"><div class="w join-b">'+
    '<div class="join-t">'+
      '<p class="eyebrow">업체 · 전문가 · 프랜차이즈 본사</p>'+
      '<h2>창업과 폐업을 준비하는<br class="br-m"> 사장님이 직접 찾아옵니다.</h2>'+
      '<p class="lead">인테리어 · 철거 · 간판 · 주방설비 · POS · 세무 · 노무 · '+
        '청소 · 마케팅까지. 하시는 일과 지역만 등록해 두시면 됩니다.</p>'+
      '<div class="row-cta">'+
        '<a class="btn btn-b btn-lg" href="/join">업체 입점하기'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-o btn-lg" href="/franchise">프랜차이즈 등록</a>'+
      '</div>'+
    '</div>'+
    '<ul class="join-l">'+how.map(function(h){
      /* ⚠️ `display:grid` 인 칸에 **맨글을 두지 마세요.** 태그로 감싸야
         칸 수와 항목 수가 맞습니다 — 안 그러면 낱말이 딴 줄에 앉습니다. */
      return '<li>'+icon("check",18)+
        '<span><b>'+esc(h[0])+'</b><i>'+esc(h[1])+'</i></span></li>';
    }).join("")+'</ul>'+
  '</div></section>';
}

/* ── 07 자주 묻는 것 ────────────────────────────────────────────
   ⚠️ 화면과 구조화 데이터(JSON-LD)가 `js/data/faq.js` **한 곳**을
   같이 읽습니다. 구글이 "구조화 데이터는 화면 내용과 같아야 한다"
   고 못 박아 두었습니다 — 한쪽만 고치면 어긋납니다.
   ⚠️ 비면 구간째 빠집니다 (절대 규칙 2). */
function FaqBand(){
  var all = (window.amFaq ? amFaq() : []);
  if(!all.length) return "";
  /* ⚠️ 메인에는 **여섯까지**입니다. 열을 다 펴 두었더니 이 구간 하나가
     2,162px 이 되어 메인에서 제일 긴 구간이 됐습니다. 나머지는 /faq
     에서 봅니다 — 숨기는 것이 아니라 옮기는 것이고, 단추가 바로
     아래 있습니다. */
  var f = all.slice(0, 6);
  return '<section class="sec sec-white"><div class="w w-narrow">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">자주 묻는 것</p>'+
      '<h2>먼저 궁금해하시는 것들</h2>'+
    '</div>'+
    '<ul class="faq-l">'+ f.map(function(x, i){
      /* ⚠️ `<details>` 를 쓰지 않은 이유는 접힌 글을 검색엔진이
         낮춰 볼 수 있어서입니다. 여기서는 처음부터 펴 둡니다 —
         답이 짧아서 접을 이유도 없습니다. */
      return '<li class="faq-i">'+
        '<b class="faq-q">'+esc(x.q)+'</b>'+
        '<p class="faq-a">'+esc(x.a)+'</p>'+
      '</li>';
    }).join("")+'</ul>'+
    (all.length > f.length
      ? '<div class="row-cta row-mid"><a class="btn btn-o" href="/faq">'+
        '자주 묻는 것 전부 보기'+icon("arrow",16)+'</a></div>'
      : "")+
  '</div></section>';
}

function FinalBand(){
  return '<section class="final">'+
    '<div class="w final-in">'+
      '<h2>창업에 필요한 모든 것.<br> 폐업에 필요한 모든 것.</h2>'+
      '<p>업종과 지역만 고르시면 됩니다. 가입 없이 무료로 시작하세요.</p>'+
      '<div class="row-cta row-mid">'+
        '<a class="btn btn-w btn-lg" href="/startup">창업 시작하기'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-gh btn-lg" href="/closure">폐업 시작하기</a>'+
      '</div>'+
    '</div>'+
  '</section>';
}

/* ── 03 대형 통합검색 (§5 · §23-03) ─────────────────────────────
   ⚠️ **히어로에는 안 둡니다.** 첫 화면의 주인공은 두 낱말이고, 적는
   칸이 하나 생기는 순간 그 둘이 작아집니다. 검색은 히어로 **다음**
   자리입니다.
   ⚠️ 추천 검색어는 **실제로 결과가 나오는 것**만 둡니다. 눌렀는데
   "결과 없음" 이 나오면 검색이 고장난 것처럼 보입니다 — 아래
   `amSearch()` 로 실제 걸리는 것만 추렸습니다. */
function SearchBand(){
  var tips = ["인테리어","철거","프랜차이즈","POS","매장 양도","원상복구","세무","간판"]
    .filter(function(q){
      return !window.amSearch || (amSearch(q) || {}).total > 0; });
  return '<section class="sec sec-white"><div class="w w-narrow sb-b">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">통합검색</p>'+
      /* ⚠️ 제목을 길게 쓰지 마세요. 세 줄로 접히면 검색창보다 제목이
         커져서 무엇을 하는 자리인지가 묻힙니다. */
      '<h2 class="sb-h">지금 무엇이 필요하세요?</h2>'+
      '<p class="sb-p">업체 · 프랜차이즈 · 매장 · 시설장비 · 정보를 한 번에 찾습니다.</p>'+
    '</div>'+
    /* ⚠️ `form` 은 JS 가 안 돌 때도 `/search?q=` 로 넘어가야 합니다 */
    '<form class="sb-f" action="/search" method="get" role="search">'+
      '<span class="sb-f-ic" aria-hidden="true">'+icon("search",22)+'</span>'+
      '<input type="search" name="q" id="hq" '+
        'placeholder="카페 인테리어, 철거, 프랜차이즈, POS, 세무사" '+
        'aria-label="무엇을 찾으세요?">'+
      '<button class="btn btn-b" type="submit">검색</button>'+
    '</form>'+
    (tips.length
      ? '<ul class="sb-t">'+tips.map(function(q){
          return '<li><a href="/search?q='+encodeURIComponent(q)+'">'+esc(q)+'</a></li>';
        }).join("")+'</ul>'
      : "")+
  '</div></section>';
}

/* ── 08 프랜차이즈 (§14 · §23-08) ──────────────────────────────
   ⚠️ **브랜드 카드를 지어내지 마세요.** 지금 0개입니다. 낼 수 있는
   것은 **분류**까지이고, 브랜드가 등록되면 그때 카드가 나옵니다. */
function FranchiseBand(){
  var cats = (window.AM_FRANCHISE_CATS || []).slice(0, 8);
  if(!cats.length) return "";
  var brands = (window.AM_FRANCHISES || []).length;
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">프랜차이즈</p>'+
      '<h2>어떤 장사를 시작할지<br class="br-m"> 아직 고민이시라면</h2>'+
      '<p>본사가 정해 둔 것을 따라가는 대신, 조건을 놓고 비교하실 수 있게 '+
        '만들고 있습니다.</p>'+
      '<a class="sec-more" href="/franchise">전부 보기'+icon("chev",15)+'</a>'+
    '</div>'+
    '<ul class="chip-g">'+cats.map(function(c){
      return '<li><a class="chip" href="/franchise/'+esc(c.key)+'">'+esc(c.name)+'</a></li>';
    }).join("")+'</ul>'+
    /* ⚠️ 0 이면 0 이라고 말합니다 (절대 규칙 1). 여기서 얼버무리면
       "브랜드가 많은 줄 알았는데" 가 됩니다. */
    (brands ? ""
      : '<p class="note note-mid">등록된 브랜드는 아직 없습니다. 본사 '+
        '정보공개서에 있는 값만 올리기 때문입니다 — 창업비를 지어내면 '+
        '그 숫자로 수천만 원을 빌리러 가시게 됩니다.</p>'+
        '<div class="row-cta row-mid">'+
          '<a class="btn btn-o" href="/franchise">분류로 둘러보기'+icon("arrow",16)+'</a>'+
          '<a class="btn btn-o" href="/join">본사라면 등록하기</a>'+
        '</div>')+
  '</div></section>';
}

/* ── 09 바로 인수 가능한 매장 (§16 · §23-09) ───────────────────
   ⚠️ **매물이 없으면 구간째 뺍니다** (절대 규칙 2). 가짜 매물은
   허위매물이고, 보고 연락한 사람의 시간을 훔치는 일입니다.
   데이터가 들어오면 이 구간이 저절로 나옵니다. */
function StoreBand(){
  var list = (window.AM_STORES || []).slice(0, 4);
  if(!list.length) return "";
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">매장 인수</p>'+
      '<h2>새로 만들지 않아도 됩니다</h2>'+
      '<p>바로 시작할 수 있는 매장입니다. 적힌 값은 올리신 사장님이 적은 '+
        '것이고 저희가 확인하거나 보증하는 값이 아닙니다.</p>'+
      '<a class="sec-more" href="/stores">전부 보기'+icon("chev",15)+'</a>'+
    '</div>'+
    '<div class="mk-g">'+list.map(function(s){
      return (window.StoreCard ? StoreCard(s) : ""); }).join("")+'</div>'+
  '</div></section>';
}

/* ── 11 폐업 솔루션 (§8 · §23-11) ──────────────────────────────
   메인에서도 **무엇을 원하시는지**부터 묻습니다. 폐업 쪽으로 오신
   분은 대개 지쳐 계셔서, 목록을 보여 드리면 거기서 닫습니다. */
function CloseBand(){
  var w = (window.AM_CLOSE_WANTS || []);
  if(!w.length) return "";
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">CLOSE · 폐업</p>'+
      '<h2>정리도 순서가 있습니다</h2>'+
      '<p>기한이 있는 일이 여럿이라 빠뜨리면 문을 닫은 뒤에도 돈이 나갑니다. '+
        '원하시는 것을 고르시면 그에 맞는 절차만 추려 드립니다.</p>'+
    '</div>'+
    '<ul class="wnt-l">'+w.map(function(x){
      return '<li><a class="wnt" href="/closure?w='+encodeURIComponent(x.key)+'">'+
        '<span class="wnt-ic">'+icon(x.icon,20)+'</span>'+
        '<b>'+esc(x.name)+'</b>'+
        '<span class="wnt-l-d">'+esc(x.lead)+'</span>'+
      '</a></li>';
    }).join("")+'</ul>'+
  '</div></section>';
}

/* ── 12 사장님 도구 (§10 · §23-12) ─────────────────────────────── */
function ToolBand(){
  var list = (window.amTools ? amTools() : []).slice(0, 6);
  if(!list.length) return "";
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">사장님 도구</p>'+
      '<h2>숫자를 넣어 보면 정해집니다</h2>'+
      '<p>전부 무료이고 가입하지 않으셔도 됩니다. 적으신 숫자는 이 '+
        '브라우저에만 남습니다.</p>'+
      '<a class="sec-more" href="/tools">전부 보기'+icon("chev",15)+'</a>'+
    '</div>'+
    /* ⚠️ 폰에서는 옆으로 넘깁니다 — 여섯을 세로로 쌓으면 이 구간
       하나가 2,050px 입니다. 숨기는 것은 하나도 없습니다. */
    '<ul class="tl-g tl-g-h">'+list.map(function(t){
      return '<li><a class="tl-c" href="'+esc(t.to)+'">'+
        '<span class="tl-c-ic">'+icon(t.icon,22)+'</span>'+
        '<b>'+esc(t.name)+'</b>'+
        '<span class="tl-c-l">'+esc(t.lead)+'</span>'+
        /* ⚠️ 나오는 값 자리에 그럴듯한 숫자를 넣지 마세요 */
        '<span class="tl-c-m"><em>'+esc(t.ask)+'</em>'+icon("arrow",14)+
          '<em>'+esc(t.out)+'</em></span>'+
      '</a></li>';
    }).join("")+'</ul>'+
  '</div></section>';
}
