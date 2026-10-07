/* ════════════════════════════════════════════════════════════════════
   메인 (`/`) — 2026-10-07 "최종 전면개편 통합 작업지시서"

   > **«사이트 안은 깊고 풍부하게, 사이트 입구는 극도로 단순하게.»**
   > (§1) — 메인은 모든 기능을 설명하는 화면이 아니라 **사용자를
   > 올바른 길로 보내 주는 입구**입니다 (§5).

   ⚠️⚠️ **구간은 넷뿐입니다** (§6). 헤더 · 푸터를 빼면 —

       02  HERO + 창업 / 폐업·정리 선택      `MainHero()`
       03  인수인계 핵심 브랜드 구조          `MainBridge()`
       04  핵심 서비스 미리보기 (여덟)        `MainServices()`
       05  마지막 CTA                        `MainLast()`

   **끝입니다.** 구간을 더하지 마세요 (§6 · §69 · §70 — "그 기능이
   메인에 반드시 있어야 하는가부터 판단한다").

   ⚠️⚠️ **메인에서 뺀 것은 지운 것이 아닙니다** (§13 · §58 —
   REMOVE FROM HOME 은 삭제가 아닙니다). 어디로 갔는지 —

     업종 열넷            → `/startup` · `/closure` 의 첫 질문
     창업 분야 열셋       → `/startup/:업종` 의 분야 구간
     폐업 분야 열둘       → `/closure` 의 상황별 분야 구간
     사업 단계 여섯       → `/services` (전체 서비스)
     세부 서비스 183      → `/services` · 분류 화면 · 로드맵 걸음
     계산기 열셋          → `/tools` · 로드맵 걸음의 관련 계산기
     정보 글 예순         → `/content` · 로드맵 걸음의 읽을 것
     업체 · 매물 빈 칸    → `/providers` · `/stores` · `/assets`
     이용방법 · 브랜드 철학 → `/about`
     파트너 입점          → `/join` (헤더 · 푸터 CTA 가 그대로 갑니다)
     떠 있는 검색 패널    → 헤더 통합검색 (**모든 화면**에서 씁니다)

   ⚠️ **메인 첫 선택지는 창업 / 폐업·정리 둘뿐입니다** (§3). "운영" ·
   "인수" · "양도" 를 첫 선택지로 올리지 마세요 — 인수는 창업 안에서,
   양도는 폐업 안에서 나옵니다 (§4). 그게 브랜드 이름의 뜻입니다.

   ⚠️⚠️ **가짜 신뢰 숫자를 넣지 마세요** (§52). 회원 수 · 거래건수 ·
   만족도 · 평점 · 시공건수는 지금 전부 0 이고, 적는 순간 표시 · 광고의
   공정화에 관한 법률 제3조입니다.
   ════════════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════════
   02 HERO (§9 ~ §11)
   ══════════════════════════════════════════════════════════════════
   첫 화면에서 **5초 안에** "여기는 창업하거나 사업을 정리하는 사장님을
   위한 서비스구나" 가 읽혀야 합니다 (§9 · §71).

   ⚠️ **불필요한 설명을 추가하지 마세요** (§9). 큰 글씨 한 줄 · 서브
   세 줄 · 카드 둘. 그 아래로 아무것도 더 넣지 않습니다.
   ⚠️⚠️ **두 카드의 크기 · 무게가 같아야 합니다.** 폐업 쪽을 좁히거나
   흐리게 만들면 그게 "덜 중요한 것" 이라는 말입니다 (§10 · §46 —
   폐업은 실패가 아니라 마무리와 다음 연결입니다).
   ⚠️⚠️ **폐업을 BLACK / GRAY 로 어둡게 칠하지 마세요** (§46).
   창업은 BLUE, 폐업은 ORANGE 입니다 — 빨강도 아닙니다. */
function MainHeroCard(o){
  return '<article class="mhc mhc-'+o.cls+'">'+
    '<p class="mhc-k">'+esc(o.badge)+'</p>'+
    /* ⚠️ 맨글 + block 태그를 한 칸에 섞지 마세요 — "문장 속 block"
       으로 걸립니다. 둘 다 태그로 감쌉니다 (CLAUDE.md 의 grid 함정과
       같은 자리입니다). */
    '<h2 class="mhc-h"><b>'+esc(o.title)+'</b><i>준비하고 있어요</i></h2>'+
    '<p class="mhc-d">'+o.lead+'</p>'+
    '<p class="mhc-go"><a class="btn btn-lg '+esc(o.btn)+'" href="'+esc(o.to)+'">'+
      esc(o.cta)+icon("arrow",18)+'</a></p>'+
  '</article>';
}
function MainHero(){
  /* ⚠️⚠️ **사진은 양옆 바깥 기둥에만 깝니다** (§10 — 왼쪽은 시작하는
     사장님, 오른쪽은 정리하는 사장님). 글과 카드는 전부 HTML 이고
     사진 위에 올라가지 않습니다 — 사진 안에 글자를 합성하지 않는
     것과 같은 까닭입니다.
     ⚠️ **폰에서는 사진을 접습니다** (§51 — 선택지가 최대한 빨리
     보여야 합니다). 사진이 0장이면 아무것도 안 그립니다 (절대 규칙 2 —
     "이미지 준비 중" 을 찍지 않습니다). */
  var ph = ["hero-start","hero-close"].filter(function(k){ return hasPhoto(k); });
  return '<section class="sec mh">'+
    (ph.length === 2
      ? '<div class="mh-ph" aria-hidden="true">'+
          '<span class="mh-ph-l">'+photoBox("hero-start","",true)+'</span>'+
          '<span class="mh-ph-r">'+photoBox("hero-close","",true)+'</span>'+
        '</div>'
      : '')+
    '<div class="w mh-in">'+
      /* ⚠️ `<br class="br-m">` 뒤에는 **띄어쓰기를 하나** 둡니다 —
         좁아지면 이 줄바꿈이 사라지는데, 없으면 앞뒤 낱말이 붙습니다. */
      '<h1 class="mh-h1">사장님의 <em>시작과 마지막</em>을<br class="br-m"> '+
        '연결합니다.</h1>'+
      '<p class="mh-lead">창업을 준비하는 순간부터, 사업을 정리하고<br class="br-m"> '+
        '다음 사장님에게 넘기는 순간까지. '+esc(koWith(amBrand(),"이가"))+' 함께합니다.</p>'+
      '<div class="mh-two">'+
        MainHeroCard({ cls:"st", to:"/startup", btn:"btn-st", badge:"새로운 시작",
          title:"창업", cta:"창업 시작하기",
          lead:'업종에 맞는 준비순서부터<br class="br-m"> 필요한 업체와 정보까지 '+
               '한 번에 찾아보세요.' })+
        MainHeroCard({ cls:"cl", to:"/closure", btn:"btn-cl", badge:"마무리와 새로운 연결",
          title:"폐업·정리", cta:"폐업·정리 시작하기",
          lead:'넘길 수 있는 것부터,<br class="br-m"> 폐업 절차와 철거·원상복구까지 '+
               '필요한 순서대로 안내합니다.' })+
      '</div>'+
    '</div>'+
  '</section>';
}

/* ══════════════════════════════════════════════════════════════════
   03 인수인계의 핵심 (§14 ~ §17)
   ══════════════════════════════════════════════════════════════════
   히어로 **바로 다음**에 브랜드의 존재 이유를 보여 줍니다. 손님이 이
   구간을 보고 «아, 그래서 이름이 인수인계구나» 라고 이해해야 합니다
   (§17 · §71).

   ⚠️ 왼쪽에 적은 것을 오른쪽에 그대로 다시 적지 마세요. 오른쪽에
   적는 것은 **그것이 다음 사장님에게 무엇인지**입니다.
   ⚠️⚠️ **두 칸의 무게가 같아야 합니다.** 한쪽을 크게 하거나 색을
   세게 하면, 이 구간이 하는 말 자체가 무너집니다. */
var MAIN_FLOW_CL = [
  { ic:"store",  n:"매장" },
  { ic:"roller", n:"시설 · 인테리어" },
  { ic:"sofa",   n:"장비 · 집기" },
  { ic:"boxes",  n:"재고" },
  { ic:"users",  n:"직원 · 거래처 정리" }
];
var MAIN_FLOW_ST = [
  { ic:"pin",    n:"매장 인수" },
  { ic:"tool",   n:"기존 시설 활용" },
  { ic:"handover", n:"중고 장비 구매" },
  { ic:"wallet", n:"초기비용 절감" },
  { ic:"clock",  n:"빠른 창업 준비" }
];
function MainBridge(){
  return '<section class="sec sec-blue mbr"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<h2>한 사장님의 끝이<br class="br-m"> <em class="mh-st">다른 사장님의 시작</em>이 됩니다.</h2>'+
      '<p>'+esc(koWith(amBrand(),"은는"))+' 정리하는 사장님과 시작하는 사장님을 이어, '+
        '사장님의 다음을 함께하는 플랫폼입니다.</p>'+
    '</div>'+
    '<div class="mbr-g">'+
      '<div class="mbr-c mbr-cl">'+
        '<p class="mbr-k">정리하는 사장님</p>'+
        /* ⚠️ 사진은 **있으면** 들어갑니다 (§49). 0장이면 아무것도 안
           그립니다 — "이미지 준비 중" 을 찍지 않습니다 (절대 규칙 2). */
        (hasPhoto("flow-close") ? '<figure class="mbr-p">'+photoBox("flow-close")+'</figure>' : '')+
        '<ul class="mbr-l">'+MAIN_FLOW_CL.map(function(x){
          return '<li>'+icon("check",17)+'<b>'+esc(x.n)+'</b></li>'; }).join("")+'</ul>'+
      '</div>'+
      '<div class="mbr-m">'+
        '<span class="mbr-arw mbr-arw-in" aria-hidden="true"></span>'+
        '<div class="mbr-logo">'+
          '<span class="mbr-logo-i" aria-hidden="true">'+icon("handover",26)+'</span>'+
          '<b>'+esc(amBrand())+'</b>'+
          /* ⚠️ §16 이 적은 한 줄입니다. 길게 설명하지 않습니다. */
          '<i>사장님의 다음을<br> 이어주는 플랫폼</i>'+
        '</div>'+
        '<span class="mbr-arw mbr-arw-out" aria-hidden="true"></span>'+
      '</div>'+
      '<div class="mbr-c mbr-st">'+
        '<p class="mbr-k mbr-k-st">시작하는 사장님</p>'+
        (hasPhoto("flow-start") ? '<figure class="mbr-p">'+photoBox("flow-start")+'</figure>' : '')+
        '<ul class="mbr-l mbr-l-st">'+MAIN_FLOW_ST.map(function(x){
          return '<li>'+icon("check",17)+'<b>'+esc(x.n)+'</b></li>'; }).join("")+'</ul>'+
      '</div>'+
    '</div>'+
    /* ⚠️ 두 단추가 **각 칸 사람의 것**입니다. 한쪽을 크게 하지 마세요. */
    '<p class="row-cta row-mid">'+
      '<a class="btn btn-cl" href="/closure?s=transfer">'+
        '내 매장 양도 준비하기'+icon("arrow",18)+'</a>'+
      '<a class="btn btn-st" href="/stores">인수 가능한 매장 보기'+icon("arrow",18)+'</a></p>'+
  '</div></section>';
}

/* ══════════════════════════════════════════════════════════════════
   04 핵심 서비스 미리보기 (§18 · §19)
   ══════════════════════════════════════════════════════════════════
   ⚠️⚠️ **여기에서도 모든 서비스를 보여 주지 않습니다** (§18).
   대표 여덟까지이고, 나머지는 "전체 서비스 보기" 한 줄이 받습니다.

   ⚠️ 이름 · 아이콘 · 링크는 전부 `catalog.js` 에서 옵니다 — 여기에
   적는 것은 **어느 분류를 앞에 낼지**와 한 줄 설명뿐입니다.
   ⚠️ "지금 많이 찾는 서비스" 라고 쓰지 마세요 — 이용 데이터를 모으지
   않아서 무엇이 많이 찾는 것인지 **우리는 모릅니다**. */
var MAIN_SVC = [
  { k:"store",     d:"상권 · 입지, 점포" },
  { k:"interior",  d:"설비, 전기, 간판" },
  { k:"equip",     d:"주방, 냉난방, 중고장비" },
  { k:"it",        d:"POS, 키오스크, CCTV" },
  { k:"admin",     d:"기장, 신고, 직원관리" },
  { k:"marketing", d:"온라인광고, 브랜딩" },
  { k:"demolish",  d:"폐기물, 철거, 복구" },
  { k:"clean",     d:"매장청소, 방역, 시설관리" }
];
function MainServices(){
  var by = {}; (window.AM_CATS||[]).forEach(function(c){ by[c.key] = c; });
  var items = MAIN_SVC.map(function(x){
    var c = by[x.k]; return c ? { c:c, d:x.d } : null; }).filter(Boolean);
  if(!items.length) return "";
  return '<section class="sec sec-white msvc"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<h2>사장님에게 필요한 모든 서비스를<br class="br-m"> 한 곳에서</h2>'+
      /* ⚠️ 이름 뒤에 "에서" 는 받침과 무관합니다 — `koWith()` 를
         넣었다가 "인수인계가에서" 가 됐습니다 (찍어 보고 알았습니다). */
      '<p>업체, 정보, 계산도구까지. 창업과 폐업에 필요한 서비스를 '+
        esc(amBrand())+'에서 확인하세요.</p>'+
    '</div>'+
    '<ul class="msvc-g">'+items.map(function(x){
      /* ⚠️ 색은 `catalog.js` 의 `tone` 한 줄입니다 — 손으로 적지 마세요. */
      return '<li class="tn-'+esc(x.c.tone||"t7")+'"><a href="'+esc(catTo(x.c))+'">'+
        '<span class="msvc-ic">'+icon(x.c.icon,26)+'</span>'+
        '<b>'+esc(x.c.name)+'</b><i>'+esc(x.d)+'</i></a></li>'; }).join("")+
      '<li class="msvc-all"><a href="/services">'+
        '<span class="msvc-ic">'+icon("plus",26)+'</span>'+
        '<b>전체 서비스 보기</b><i>'+icon("arrow",16)+'</i></a></li>'+
    '</ul>'+
  '</div></section>';
}

/* ══════════════════════════════════════════════════════════════════
   05 마지막 CTA (§20)
   ══════════════════════════════════════════════════════════════════
   ⚠️ HERO 와 **같은 BLUE / ORANGE 구조**입니다 (§20). 여기서 색을
   바꾸면 손님이 "아까 그 선택과 같은 것인가" 를 다시 생각해야 합니다. */
function MainLast(){
  return '<section class="sec sec-start mend"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<h2>어디서부터 시작해야 할지<br class="br-m"> 모르겠다면?</h2>'+
      '<p>지금 상황을 선택하면<br class="br-m"> 필요한 순서부터 안내해드립니다.</p>'+
    '</div>'+
    '<p class="row-cta row-mid">'+
      '<a class="btn btn-st btn-lg" href="/startup">창업 준비하기'+icon("arrow",18)+'</a>'+
      '<a class="btn btn-cl btn-lg" href="/closure">폐업·정리 준비하기'+icon("arrow",18)+'</a>'+
    '</p>'+
  '</div></section>';
}

/* ══════════════════════════════════════════════════════════════════
   사업 단계 카드 — `/services` 와 `/g/:stage` 가 같이 씁니다
   ══════════════════════════════════════════════════════════════════
   ⚠️⚠️ **생김새는 여기 한 곳입니다.** 두 곳에 적으면 서로 달라집니다.
   ⚠️ 카드가 **통째로** 눌립니다 — 안에 또 링크를 넣지 마세요
   (`<a>` 안의 `<a>` 는 브라우저가 쪼개 버립니다).
   ⚠️⚠️ **사진이 없으면 아래 띠를 아예 안 그립니다** (절대 규칙 2).
   빈 액자를 반쯤 깔아 두면 카드 여섯이 전부 "준비 중" 으로 읽힙니다. */
function StageCard(s){
  var key = "category-" + s.key;
  var ph  = (typeof hasPhoto === "function") && hasPhoto(key);
  return '<a href="'+esc(amStageTo(s))+'" class="stg'+tn(s.tone)+(ph ? " stg-ph" : "")+'">'+
    '<span class="stg-t">'+
      '<span class="stg-h">'+
        '<span class="stg-i">'+icon(s.icon,24)+'</span>'+
        '<b>'+esc(s.name)+'</b>'+
      '</span>'+
      '<em class="stg-c">'+(s.copy || esc(s.lead))+'</em>'+
      '<i class="stg-s">'+esc(s.sub)+'</i>'+
    '</span>'+
    (ph ? '<span class="stg-img">'+photoBox(key)+'</span>' : '')+
    '<span class="stg-go" aria-hidden="true">'+icon("arrow",16)+'</span>'+
  '</a>';
}

/* ══════════════════════════════════════════════════════════════════
   메인 (§6)
   ══════════════════════════════════════════════════════════════════
   ⚠️⚠️ **구간을 더하지 마세요.** 넷입니다. 새 기능이 생겨도 "그 기능이
   메인에 반드시 있어야 하는가" 부터 묻습니다 (§70) — 대부분은
   내부 페이지입니다. `check.js` 의 "메인 구간 차례가 지시서와 같다"
   가 넷을 셉니다. */
function PageMain(){
  return MainHero() + MainBridge() + MainServices() + MainLast();
}
