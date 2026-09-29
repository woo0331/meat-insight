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
  return Hero()+
         TrustBar()+
         ScaleBand()+
         IndustryBand()+
         WhatBand()+
         BridgeBand()+
         JoinBand()+
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
    ["scale", "광고비로 순서를 바꾸지 않습니다", "조건이 맞는 곳만 보여 드립니다"],
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

/* ── 04 무엇을 도와드리나 ────────────────────────────────────────
   ⚠️ 여기서도 **업체를 나열하지 않습니다.** 분류까지입니다. */
function WhatBand(){
  var st = (window.AM_START_CATS||[]).slice(0, 6);
  var cl = (window.AM_CLOSE_CATS||[]).slice(0, 6);
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
    ["순서를 돈으로 바꾸지 않습니다","광고비를 받고 위에 올려 드리지 않습니다."]
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
