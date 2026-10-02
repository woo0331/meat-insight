/* ════════════════════════════════════════════════════════════════════
   메인(`/`) — 접속하는 순간 **바로 쓰는 화면**입니다

   > **2026-10-01 사장님 지시 — "랜딩페이지 완전 제거."**
   > 전에는 `/` 가 브랜드 소개 랜딩이고 "플랫폼 시작하기" 를 눌러야
   > `/home` 서비스 메인으로 갔습니다. 그 중간 화면을 **없앴습니다.**
   > 주소를 치면 곧바로 이 화면입니다.

   ⚠️⚠️ **중간 소개 화면(Intro · Splash · Gateway)을 다시 만들지
   마세요.** 로고를 누르거나 `/` 로 오면 **언제나 이 화면**입니다.
   `/home` 은 `vercel.json` 이 308 로 `/` 에 보냅니다 — 옛 주소를
   눌러도 안 깨지라고 남겨 둔 것이지 화면이 아닙니다.

   ⚠️ **랜딩을 지우면서 좋은 것은 가져왔습니다** (지시서 §2) —
   강한 히어로 · START 초록 / CLOSE 주황 · "한 사장님의 끝이 다른
   사장님의 시작" · 큰 글씨 · 넉넉한 여백. 지운 것은 **화면 하나**이지
   그 안의 생각이 아닙니다.

   구간 차례 (지시서 §21 · §24) — `check.js` 가 이 차례를 셉니다.

     ① 히어로        .mh     크림   — 검색 · START/CLOSE · 오른쪽 비주얼
     ② 범위 숫자     .mst    크림   — 히어로에 붙는 얇은 띠
     ③ START/CLOSE   .ms-two 흰색
     ④ 업종 열넷     .mi-g   옅은 회색
     ⑤ 핵심 서비스   .mv-g   흰색
     ⑥ 업체          PARTNERS  아이보리
     ⑦ 프랜차이즈    FRANCHISE 흰색
     ⑧ 매장 인수     TAKE OVER 민트
     ⑨ 가격          PRICE     하늘
     ⑩ 창업↔폐업     .mbr    크림
     ⑪ 사장님 도구   .mt-g   흰색
     ⑫ 후기          REVIEWS 아이보리
     ⑬ 업체 입점     .mjn    흰 구간 위 남색 카드

   ⚠️⚠️ **업체 · 브랜드 · 매물 · 가격 · 후기가 전부 0 입니다.** 카드를
   지어내지 않고 `Empty()` 로 **지금 실제로 되는 것**을 같이 냅니다
   (절대 규칙 1). 열세 구간 중 다섯이 지금 빈 상태인데 **그게 맞습니다.**

   ⚠️ **"준비중 · 모집중" 을 첫 화면에 올리지 마세요** (지시서 §12).
   처음 오신 분이 "아직 준비 중인 플랫폼" 으로 읽습니다. 0 을 말하는
   자리는 각 구간 안(`Empty()`)과 맨 아래 입점 구간입니다.

   ⚠️ 아이콘은 `icon()` 하나만 씁니다 — 24 viewBox · 선 1.8 · round.
   섞어 쓰면 한 화면에서 아이콘이 따로 놉니다 (§27).
   ════════════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════════
   ① 히어로 (지시서 §4 ~ §10)
   ══════════════════════════════════════════════════════════════════
   ⚠️⚠️ **어두운 전면 배경을 쓰지 마세요.** 바탕은 크림
   (`--bg-cream` #FCFAF6)입니다. 임팩트는 어둡게 해서 내는 것이
   아니라 **큰 글씨 · 큰 검색창 · 초록/주황 악센트 · 넓은 여백**으로
   냅니다 (§25). 어두운 면이 15% 를 넘으면 전수 점검이 잡습니다.

   ⚠️ **데스크톱에서 글만 가운데 두지 않습니다** (§9). 왼쪽은 글과
   행동(검색 · START/CLOSE), 오른쪽은 비주얼입니다 — 55:45.

   ⚠️ 폰 차례는 §30 입니다 — 제목 → 설명 → 검색 → START/CLOSE →
   비주얼. DOM 이 그 차례라 좁아지면 저절로 그렇게 쌓입니다.
   **오른쪽 비주얼을 DOM 앞으로 옮기지 마세요.** */

/* 추천 검색어 — ⚠️ **가짜 링크를 만들지 마세요** (§7). 전부 실제로
   결과가 나오는 주소이고, 분야가 있는 것은 그 분야 화면으로 바로
   보냅니다. `to` 가 없으면 통합검색으로 갑니다. */
var MAIN_SUGGEST = [
  { q:"카페 인테리어", to:"/providers/interior?i=cafe" },
  { q:"음식점 철거",   to:"/providers/demolish?i=restaurant" },
  { q:"프랜차이즈",    to:"/franchise" },
  { q:"매장양도",      to:"/stores" },
  { q:"POS",           to:"/providers/it" },
  { q:"세무사",        to:"/providers/admin" },
  { q:"원상복구",      to:"/providers/restore" }
];

/* 히어로 오른쪽에 뜨는 작은 카드 — ⚠️ **셋을 넘기지 마세요** (§10).
   넷이 되는 순간 SaaS 소개 페이지로 읽힙니다. */
function MainHeroCards(){
  return '<ul class="mh-fc">'+
    '<li class="mh-fc-st"><span class="ic-t">'+icon("seed",24)+'</span>'+
      '<span class="mh-fc-t"><b>START</b><i>새로운 시작</i></span></li>'+
    '<li class="mh-fc-cl"><span class="ic-t">'+icon("box",24)+'</span>'+
      '<span class="mh-fc-t"><b>CLOSE</b><i>깔끔한 정리</i></span></li>'+
    '<li class="mh-fc-w"><span class="ic-t">'+icon("home",24)+'</span>'+
      '<span class="mh-fc-t"><b>창업부터 폐업까지</b><i>한곳에서.</i></span></li>'+
  '</ul>';
}

/* 오른쪽 비주얼 — ⚠️ **빈 회색 상자를 깔지 않습니다.** 사진이 없으면
   액자째 빠지고, 그 자리는 위의 작은 카드가 지킵니다. 사진이 들어오면
   그 위에 붙습니다 (`img/` 에 넣고 `photos.js` 에 한 줄). */
function MainHeroArt(){
  var a = hasPhoto("hero-start"), b = hasPhoto("hero-close");
  return '<div class="mh-art'+(a||b ? "" : " mh-art-none")+'">'+
    (a ? '<figure class="mh-ph mh-ph-a">'+photoBox("hero-start","",true)+'</figure>' : '')+
    (b ? '<figure class="mh-ph mh-ph-b">'+photoBox("hero-close","",true)+'</figure>' : '')+
    MainHeroCards()+
  '</div>';
}

function MainHero(){
  return '<section class="mh"><div class="w mh-in">'+
    '<div class="mh-tx">'+
      '<p class="mh-k">BUSINESS START &amp; CLOSE PLATFORM</p>'+
      '<h1 class="mh-h"><em class="mh-st">창업</em>에 필요한 모든 것.<br> '+
        '<em class="mh-cl">폐업</em>에 필요한 모든 것.</h1>'+
      '<p class="mh-d">시작부터 정리까지,<br class="br-m"> '+
        '사장님에게 필요한 모든 것을 한곳에서.</p>'+

      /* 대형 검색창 — ⚠️ 폼입니다. 엔터로도 가야 합니다 (§6) */
      '<form class="mh-s" onsubmit="return mainSearch(event)" role="search">'+
        '<span class="mh-s-i" aria-hidden="true">'+icon("search",22)+'</span>'+
        '<input type="search" name="q" id="mainQ" autocomplete="off" '+
          'aria-label="통합 검색" placeholder="무엇이 필요하세요?">'+
        '<button class="btn btn-nv" type="submit">검색</button>'+
      '</form>'+
      '<p class="mh-sg">'+MAIN_SUGGEST.map(function(s){
        return '<a href="'+esc(s.to)+'">'+esc(s.q)+'</a>'; }).join("")+'</p>'+

      /* ⚠️ **두 단추의 크기가 같아야 합니다** (§8). 한쪽을 작게 만들면
         그게 "덜 중요한 것" 이라는 말입니다. CSS 가 1fr 1fr 로 잡습니다. */
      '<p class="mh-cta">'+
        '<a class="btn btn-st btn-lg" href="/startup">창업 준비하기'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-cl btn-lg" href="/closure">사업 정리하기'+icon("arrow",18)+'</a>'+
      '</p>'+
    '</div>'+
    MainHeroArt()+
  '</div>'+
  /* ⚠️⚠️ **범위 숫자 띠는 히어로와 같은 구간 안입니다.** 따로 구간으로
     떼었더니 바탕이 둘 다 크림이라 `check.js` 의 "이웃한 두 구간이 붙어
     보임" 이 ΔE 0.00 으로 잡았습니다 — 맞는 지적입니다. 히어로에
     **붙는** 띠이지 다음 구간이 아닙니다 (§11). */
  MainScale()+
  '</section>';
}
window.mainSearch = function(e){
  e.preventDefault();
  var v = (document.getElementById("mainQ") || {}).value || "";
  v = v.trim();
  if(!v){ toast("찾으실 것을 적어 주세요"); return false; }
  go("/search?q=" + encodeURIComponent(v));
  return false;
};

/* ══════════════════════════════════════════════════════════════════
   ② 범위 숫자 (지시서 §11)
   ══════════════════════════════════════════════════════════════════
   ⚠️⚠️ **회원 수 · 거래액 · 업체 수를 넣지 마세요.** 지금 0 이고,
   적으면 표시광고법 제3조 위반입니다. 여기 내는 것은 **우리가 실제로
   다루는 범위**이고, 전부 `AM_INDUSTRIES` · `AM_CATS` 를 **그 자리에서
   세는 값**입니다 — 분류를 하나 늘리면 숫자도 같이 늡니다.

   ⚠️ **"이 숫자는 분야의 수입니다" 줄을 지우지 마세요.** 숫자만 크게
   띄우면 "업체가 183곳" 으로 읽힙니다. 폰에서 숨기지도 마세요.
   ⚠️ `n+` 꼴로 쓰지 마세요 — 센 값은 그냥 183 입니다. */
function MainScale(){
  var ind = (window.AM_INDUSTRIES||[]).length;
  var cat = (window.AM_CATS||[]).length;
  var sub = (window.AM_CATS||[]).reduce(function(n,c){
    return n + ((c.items||[]).length); }, 0);
  if(!ind || !cat || !sub) return "";   /* 데이터가 비면 띠째 뺍니다 */
  var rows = [
    { n:ind, u:"업종" },
    { n:cat, u:"창업 · 폐업 전문분야" },
    { n:sub, u:"세부 서비스" }
  ];
  return '<div class="mst"><div class="w">'+
    '<ul class="mst-g">'+rows.map(function(r){
      return '<li><b>'+r.n+'</b><i>'+esc(r.u)+'</i></li>'; }).join("")+'</ul>'+
    '<p class="mst-n">이 숫자는 저희가 다루는 <b>분야의 수</b>입니다 — '+
      '등록된 업체 수가 아닙니다.</p>'+
  '</div></div>';
}

/* ══════════════════════════════════════════════════════════════════
   ③ START / CLOSE 큰 카드 (지시서 §13 ~ §16)
   ══════════════════════════════════════════════════════════════════
   ⚠️ **두 카드의 크기와 비율이 같아야 합니다.** 폐업 쪽을 좁히면
   그게 "덜 중요한 것" 이라는 말입니다 — `check.js` 가 폭을 잽니다.

   ⚠️⚠️ **여섯은 이름이 아니라 분류 key 로 적습니다.** 이름 · 아이콘 ·
   링크를 손으로 적어 두었더니 랜딩과 메인이 **서로 다른 아이콘**을
   쓰고 있었습니다 (프랜차이즈가 전구, 철거와 인테리어가 둘 다 망치).
   key 만 적으면 전부 `catalog.js` 에서 옵니다 — 거기를 고치면 여기도
   따라옵니다. 분류가 없는 카드(프랜차이즈)만 `ic` 와 `to` 를 직접
   적습니다. `check.js` 의 "큰 카드 여섯이 분류에서 온다" 가 봅니다. */
var MAIN_START6 = [
  { cat:"store" }, { ic:"store", t:"프랜차이즈", to:"/franchise" },
  { cat:"interior" }, { cat:"equip" }, { cat:"admin" }, { cat:"marketing" }
];
var MAIN_CLOSE6 = [
  { cat:"transfer" }, { cat:"asset" }, { cat:"stock" },
  { cat:"demolish" }, { cat:"restore" }, { cat:"tax" }
];

/* ⚠️⚠️ **분류 → 주소는 `catTo()` 한 곳입니다** (`js/components/ui.js`).
   여기에 똑같은 함수(`amCatTo`)를 하나 더 들고 있었습니다 — 글자까지
   같았습니다. 분류 `kind` 가 하나 늘면 한쪽만 고치게 되고, 그러면
   **메인만 조용히 엉뚱한 주소로** 보냅니다 (다른 화면은 다 맞고요).
   2026-10-01 에 지웠습니다. 새로 만들지 마세요. */
/* key 를 분류로 바꿉니다. ⚠️ **없는 key 는 조용히 빠집니다** — 그래서
   `check.js` 가 여섯이 다 나왔는지 셉니다. */
function mainSix(list){
  var by = {}; (window.AM_CATS||[]).forEach(function(c){ by[c.key] = c; });
  return list.map(function(x){
    if(!x.cat) return { ic:x.ic, name:x.t, to:x.to };
    var c = by[x.cat];
    return c ? { ic:c.icon, name:c.name, to:catTo(c) } : null;
  }).filter(Boolean);
}

function MainSide(o){
  var all = o.cats || [];
  if(!all.length) return "";          /* 데이터가 비면 카드째 뺍니다 */
  var six = mainSix(o.six);
  if(!six.length) return "";
  return '<div class="ms ms-'+o.cls+'">'+
    /* ⚠️ 사진은 카드의 30~40% 까지입니다 (§16). 사진 위에 짙은 막을
       씌우지 마세요 — 0장일 때는 액자째 빠집니다. */
    (hasPhoto(o.photo) ? '<figure class="ms-ph">'+photoBox(o.photo)+'</figure>' : '')+
    '<div class="ms-b">'+
      '<p class="ms-k">'+esc(o.kicker)+'</p>'+
      '<h3 class="ms-h">'+esc(o.title)+'</h3>'+
      '<p class="ms-d">'+esc(o.lead)+'</p>'+
      '<ul class="ms-g">'+six.map(function(c){
        return '<li><a href="'+esc(c.to)+'">'+
          '<span class="ic-t">'+icon(c.ic,26)+'</span>'+
          '<b>'+esc(c.name)+'</b></a></li>'; }).join("")+'</ul>'+
      '<p class="ms-more"><a href="'+esc(o.to)+'">'+esc(o.title)+
        ' 전체 보기'+icon("arrow",16)+'</a>'+
        '<i>'+all.length+'개 분야</i></p>'+
    '</div>'+
  '</div>';
}
function MainTwo(){
  var st = MainSide({ cls:"st", to:"/startup", kicker:"START", title:"창업",
    lead:"사업의 시작에 필요한 모든 것을 찾아보세요.",
    photo:"side-start", six:MAIN_START6, cats:(window.AM_START_CATS||[]) });
  var cl = MainSide({ cls:"cl", to:"/closure", kicker:"CLOSE", title:"폐업",
    lead:"잘 정리하는 것도 다음을 위한 준비입니다.",
    photo:"side-close", six:MAIN_CLOSE6, cats:(window.AM_CLOSE_CATS||[]) });
  if(!st || !cl) return "";
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd sec-hd-c"><h2>시작하시나요,<br class="br-m"> '+
      '정리하시나요?</h2></div>'+
    '<div class="ms-two">'+st+cl+'</div>'+
  '</div></section>';
}

/* ══════════════════════════════════════════════════════════════════
   ④ 업종 고르기 (지시서 §17 ~ §19)
   ══════════════════════════════════════════════════════════════════
   ⚠️ 업종 카드는 장식이 아닙니다 — 누르면 그 업종 창업 화면으로 가고,
   거기서 그 업종에 맞는 분류 · 장비 · 글이 나옵니다.
   ⚠️ **카드 전체를 업종 색으로 칠하지 마세요.** 카드는 흰색이고 색은
   아이콘 타일에만 들어갑니다 (§19). 색은 `industries.js` 의 `tone`
   한 줄이라 여기서 손으로 적을 자리가 없습니다.
   ⚠️ 바탕이 옅은 회색인 이유 — 앞 구간(START/CLOSE)이 흰색입니다.
   둘 다 흰색이면 **두 구간이 한 구간으로 읽힙니다.** */
function MainIndustry(){
  var L = (window.AM_INDUSTRIES||[]);
  if(!L.length) return "";
  return '<section class="sec sec-gray"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">BUSINESS CATEGORY</p>'+
      '<h2>어떤 사업을 하고 계세요?</h2>'+
      '<p>업종을 선택하면 필요한 서비스를 빠르게 찾아드립니다.</p></div>'+
    '<ul class="mi-g">'+L.map(function(i){
      return '<li class="tn-'+esc(i.tone||"t7")+'">'+
        '<a href="/startup/'+esc(i.key)+'">'+
          '<span class="ic-t">'+icon(i.icon,26)+'</span>'+
          '<b>'+esc(i.name)+'</b></a></li>'; }).join("")+'</ul>'+
  '</div></section>';
}

/* ══════════════════════════════════════════════════════════════════
   ⑤ 핵심 서비스 여덟 (지시서 §20)
   ══════════════════════════════════════════════════════════════════
   ⚠️ 색은 **의미**입니다 (§27) — 초록 창업 · 주황 정리 · 파랑 정보/IT ·
   보라 세무 · 분홍 마케팅 · 금색 프랜차이즈 · 청록 매장 · 회청 장비.
   예뻐 보인다고 아무 색이나 쓰지 마세요. */
var MAIN_SVC = [
  { k:"interior", ic:"roller",    t:"인테리어 · 시공", d:"설계 · 전기 · 배관 · 가스", c:"st" },
  { k:"fr",       ic:"store",     t:"프랜차이즈",      d:"정보공개서에 있는 값만",     c:"gd" },
  { k:"equip",    ic:"tool",      t:"시설 · 장비",      d:"주방 · 냉동 · 간판 · 가구",  c:"sl" },
  { k:"it",       ic:"monitor",   t:"POS · IT",        d:"POS · 키오스크 · CCTV",     c:"bl" },
  { k:"admin",    ic:"calc",      t:"세무 · 노무",      d:"세무사 · 노무사 · 4대보험",  c:"pu" },
  { k:"marketing",ic:"megaphone", t:"마케팅 · 디자인",  d:"네이밍 · 로고 · SNS",       c:"pk" },
  { k:"transfer", ic:"pin",       t:"매장 양도 · 인수", d:"자리를 넘기고, 이어받고",   c:"tl" },
  { k:"demolish", ic:"hammer",    t:"철거 · 원상복구",  d:"철거 · 원상복구 · 폐기물",   c:"cl" }
];
function MainServices(){
  var by = {}; (window.AM_CATS||[]).forEach(function(c){ by[c.key] = c; });
  var items = MAIN_SVC.map(function(s){
    if(s.k === "fr")       return { s:s, to:"/franchise" };
    if(s.k === "transfer") return { s:s, to:"/stores" };
    var c = by[s.k];
    return c ? { s:s, to:catTo(c) } : null;
  }).filter(Boolean);
  if(!items.length) return "";
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">MOST REQUESTED</p>'+
      '<h2>지금 무엇이 필요하세요?</h2>'+
      '<p>많이 찾으시는 것부터 모았습니다.</p></div>'+
    '<ul class="mv-g">'+items.map(function(x){
      return '<li class="hv-'+x.s.c+'"><a href="'+esc(x.to)+'">'+
        '<span class="ic-t">'+icon(x.s.ic,27)+'</span>'+
        '<span class="mv-t"><b>'+esc(x.s.t)+'</b><i>'+esc(x.s.d)+'</i></span>'+
        '<span class="mv-go" aria-hidden="true">'+icon("arrow",18)+'</span>'+
      '</a></li>'; }).join("")+'</ul>'+
  '</div></section>';
}

/* ── 구간 한 벌 — 데이터가 있으면 카드, 없으면 Empty ──────────────
   ⚠️⚠️ **카드를 지어내지 마세요** (절대 규칙 1). 업체 0곳인데 여섯
   장을 채워 두면 그 순간 없는 회사를 광고하는 것이고 표시광고법
   제3조 위반입니다. 0 이면 0 이라고 말하고, 대신 **지금 실제로 되는
   것**을 같이 냅니다. */
function MainBand(o){
  return '<section class="sec '+esc(o.bg||"")+'"><div class="w">'+
    '<div class="sec-hd'+(o.mid?" sec-hd-c":"")+'">'+
      (o.kicker ? '<p class="eyebrow">'+esc(o.kicker)+'</p>' : '')+
      '<h2>'+o.h+'</h2>'+
      (o.lead ? '<p>'+esc(o.lead)+'</p>' : '')+'</div>'+
    o.body+
  '</div></section>';
}

/* ── ⑥ 사장님들이 찾는 업체 ─────────────────────────────────────── */
function MainProviders(){
  var n = (window.AM_PROVIDERS||[]).length;
  var body = n
    ? '<div class="pv-g">'+(window.AM_PROVIDERS||[]).slice(0,6).map(function(p){
        return ProviderCard(p); }).join("")+'</div>'+
        /* ⚠️⚠️ **차례를 밝힙니다** — 약관 제6조 제4항이 "광고 순서의
           기준을 밝힌다" 고 적어 두었고, `join.js` 의 약속도 "추천 ·
           상단노출 같은 광고 상품이 생기면 광고라고 표시한다" 입니다.
           지금은 그런 상품이 없어서 등록된 차례 그대로입니다 — 업체가
           늘어난 뒤에도 이 줄과 실제가 같아야 합니다.
           ⚠️ `featured` · `추천` 칸을 만들지 마세요. 만드는 순간 이
           줄이 거짓이 되고, 표시 없는 상단노출은 표시광고법 문제입니다. */
        '<p class="note note-mid">등록된 차례로 냅니다. 광고로 위에 올린 자리는 없습니다.</p>'+
      '<p class="row-cta row-mid"><a class="btn btn-nv" href="/providers">'+
        '업체 전체 보기'+icon("arrow",18)+'</a></p>'
    : Empty({ icon:"users", title:"아직 등록된 업체가 없습니다",
        text:"업체를 지어내지 않습니다. 지금은 모으는 중이고, 등록되는 대로 "+
             "분야 · 지역으로 찾으실 수 있습니다. 먼저 조건을 남겨 두시면 "+
             "업체가 들어올 때 그 조건으로 전달합니다.",
        cta:'<a class="btn btn-nv" href="/quote">조건 남기고 견적 요청'+icon("arrow",18)+'</a>'+
            '<a class="btn btn-o" href="/join">업체로 입점하기</a>' });
  return MainBand({ bg:"sec-ivory", kicker:"PARTNERS", h:"사장님들이 찾는 업체",
    lead:"업종과 지역에 맞는 전문업체를 비교해 보세요.", body:body });
}

/* ── ⑦ 프랜차이즈 ─────────────────────────────────────────────────
   ⚠️ 창업비는 **정보공개서에 있는 값**이어야 합니다 (가맹사업법).
   `source` 와 `asOf` 가 없는 금액은 화면에 안 나옵니다. */
function MainFranchise(){
  var n = (window.AM_FRANCHISES||[]).length;
  var body = n
    ? '<div class="fr-g">'+(window.AM_FRANCHISES||[]).slice(0,6).map(function(f){
        return FranchiseCard(f); }).join("")+'</div>'+
      '<p class="row-cta row-mid"><a class="btn btn-nv" href="/franchise">'+
        '브랜드 전체 보기'+icon("arrow",18)+'</a></p>'
    : Empty({ icon:"store", title:"아직 등록된 브랜드가 없습니다",
        text:"창업비는 정보공개서에 적힌 값만 올립니다. 근거 없는 금액을 "+
             "보시고 수천만 원을 빌리러 가시면 안 되기 때문입니다. "+
             "확인한 브랜드부터 하나씩 올립니다.",
        cta:'<a class="btn btn-nv" href="/startup">창업 준비부터 보기'+icon("arrow",18)+'</a>' });
  return MainBand({ bg:"sec-white", kicker:"FRANCHISE",
    h:"어떤 장사를 시작할지 고민이라면",
    lead:"예산과 조건에 맞는 프랜차이즈를 찾아보세요.", body:body });
}

/* ── ⑧ 바로 시작할 수 있는 매장 ───────────────────────────────────
   ⚠️ 평수 · 보증금 · 월세 · 권리금은 **올리신 사장님이 적은 값**이고
   우리가 확인하거나 보증하는 값이 아닙니다 — 카드가 그렇게 밝힙니다. */
function MainStores(){
  var L = (window.AM_STORES||[]);
  var body = L.length
    ? '<div class="mk-g">'+L.slice(0,6).map(function(s){ return StoreCard(s); }).join("")+'</div>'+
      '<p class="row-cta row-mid"><a class="btn btn-nv" href="/stores">'+
        '매장 전체 보기'+icon("arrow",18)+'</a></p>'
    : Empty({ icon:"pin", title:"아직 올라온 매장이 없습니다",
        text:"허위매물을 만들지 않습니다. 보고 연락하신 시간을 훔치는 일이라서요. "+
             "정리하시는 사장님이 올리시면 그대로 보입니다.",
        cta:'<a class="btn btn-st" href="/stores">매장 내놓기'+icon("arrow",18)+'</a>'+
            '<a class="btn btn-o" href="/closure">폐업 준비부터 보기</a>' });
  return MainBand({ bg:"sec-start", kicker:"TAKE OVER",
    h:"새로 만들지 않아도 됩니다",
    lead:"이미 준비된 매장에서 더 빨리 시작하실 수 있습니다.", body:body });
}

/* ── ⑨ 가격 · 견적 데이터 ─────────────────────────────────────────
   ⚠️⚠️ **평균가를 지어내지 마세요.** 견적이 0건이라 숫자가 없습니다.
   "얼마쯤" 을 적어 두면 사장님이 그 숫자로 협상하러 갑니다. 대신
   **무엇이 금액을 가르는가**를 냅니다 — 그건 근거를 댈 수 있습니다. */
function MainPrice(){
  var L = (typeof amQuoteStats === "function") ? amQuoteStats() : [];
  var body = L.length
    ? '<ul class="hp-g">'+L.map(function(q){
        return '<li><b>'+esc(q.name)+'</b><em>'+esc(q.range)+'</em>'+
          '<i>'+esc(q.asOf)+' 확인 · 견적 '+q.n+'건</i></li>'; }).join("")+'</ul>'
    : Empty({ icon:"chart", title:"가격 데이터를 모으는 중입니다",
        text:"평균가를 지어내지 않습니다. 사장님이 그 숫자를 들고 협상하러 "+
             "가시기 때문입니다. 실제 견적이 쌓이면 범위와 확인한 날짜를 "+
             "같이 냅니다. 그때까지는 무엇이 금액을 가르는지를 글로 적어 두었습니다.",
        cta:'<a class="btn btn-nv" href="/content">무엇이 금액을 가르나'+icon("arrow",18)+'</a>'+
            '<a class="btn btn-o" href="/tools/cost">창업비 직접 재 보기</a>' });
  return MainBand({ bg:"sec-blue", kicker:"PRICE",
    h:"다른 사장님들은 얼마에 하셨을까?", body:body });
}

/* ══════════════════════════════════════════════════════════════════
   ⑩ 한 사장님의 끝이 다른 사장님의 시작 (지시서 §22 · §23)
   ══════════════════════════════════════════════════════════════════
   ⚠️ 히어로 다음으로 **기억에 남아야 하는 구간**입니다. 다른 구간보다
   크게 냅니다 — 이 플랫폼의 차별점이라서입니다.
   ⚠️ **주황 → 남색 → 초록**의 흐름이 한눈에 보여야 합니다.
   ⚠️⚠️ **폐업 쪽을 처연하게 쓰지 마세요.** 실패가 아니라 정리와 다음
   단계입니다 — 손실 · 실패라는 낱말을 쓰지 않습니다.
   ⚠️ 오른쪽에 왼쪽 자산을 그대로 다시 적지 마세요. 적는 것은 **그것이
   다음 사장님에게 무엇인지**입니다. */
var MAIN_FLOW_CL = [
  { ic:"store", n:"매장" }, { ic:"tool", n:"시설" },
  { ic:"sofa",  n:"장비 · 가구" }, { ic:"boxes", n:"재고" }
];
var MAIN_FLOW_ST = [
  { ic:"pin",   n:"매장 인수", d:"상권을 처음부터 다시 찾지 않아도 됩니다" },
  { ic:"tool",  n:"시설 활용", d:"쓸 수 있는 것은 새로 사지 않아도 됩니다" },
  { ic:"clock", n:"빠른 오픈", d:"공사 기간이 줄어 문을 빨리 엽니다" },
  { ic:"wallet",n:"비용 절감", d:"처음부터 만드는 것보다 덜 듭니다" }
];
function MainBridge(){
  return '<section class="sec mbr"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">START &amp; CLOSE</p>'+
      '<h2>한 사장님의 끝이<br class="br-m"> 다른 사장님의 시작이 됩니다.</h2>'+
      '<p>쓰던 매장과 시설이, 다음 사장님에게는 새로운 시작이 될 수 있습니다.</p>'+
    '</div>'+
    '<div class="mbr-g">'+
      '<div class="mbr-c mbr-cl">'+
        '<p class="mbr-k">정리하는 사장님</p>'+
        (hasPhoto("flow-close") ? '<figure class="mbr-p">'+photoBox("flow-close")+'</figure>' : '')+
        '<ul class="mbr-l">'+MAIN_FLOW_CL.map(function(x){
          return '<li><span class="ic-t">'+icon(x.ic,24)+'</span><b>'+esc(x.n)+'</b></li>';
        }).join("")+'</ul>'+
      '</div>'+
      '<div class="mbr-m">'+
        '<span class="mbr-arw mbr-arw-in" aria-hidden="true"></span>'+
        '<div class="mbr-logo">'+
          '<span class="mbr-logo-i">'+icon("home",26)+'</span>'+
          '<b>'+esc(amBrand())+'</b>'+
          '<i>업종 · 지역 · 조건으로 잇습니다</i>'+
        '</div>'+
        '<span class="mbr-arw mbr-arw-out" aria-hidden="true"></span>'+
      '</div>'+
      '<div class="mbr-c mbr-st">'+
        '<p class="mbr-k mbr-k-st">창업하는 사장님</p>'+
        (hasPhoto("flow-start") ? '<figure class="mbr-p">'+photoBox("flow-start")+'</figure>' : '')+
        '<ul class="mbr-l mbr-l-st">'+MAIN_FLOW_ST.map(function(x){
          return '<li><span class="ic-t">'+icon(x.ic,24)+'</span>'+
            '<span class="mbr-tx"><b>'+esc(x.n)+'</b><i>'+esc(x.d)+'</i></span></li>';
        }).join("")+'</ul>'+
      '</div>'+
    '</div>'+
    '<p class="row-cta row-mid">'+
      '<a class="btn btn-st" href="/stores">매장 인수하기'+icon("arrow",18)+'</a>'+
      '<a class="btn btn-cl" href="/assets">시설 · 집기 보기'+icon("arrow",18)+'</a></p>'+
  '</div></section>';
}

/* ── ⑪ 사장님 도구 ────────────────────────────────────────────────
   ⚠️ 도구 목록은 `AM_TOOLS` 하나입니다 — 여기에 손으로 적지 마세요.
   아이콘과 악센트만 여기서 붙입니다. */
var MAIN_TOOL_IC = {
  cost: { ic:"wallet",  c:"st" }, bep:   { ic:"chart",   c:"bl" },
  labor:{ ic:"users",   c:"pu" }, fixed: { ic:"receipt", c:"tl" },
  vs:   { ic:"compare", c:"gd" }, close: { ic:"listck",  c:"cl" }
};
function MainTools(){
  var L = (window.AM_TOOLS||[]);
  if(!L.length) return "";
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">TOOLS</p>'+
      '<h2>사장님 도구</h2>'+
      '<p>창업과 운영, 정리에 필요한 숫자를 직접 재 보세요. '+
        '적으신 숫자는 이 브라우저에만 남습니다.</p></div>'+
    '<ul class="mt-g">'+L.map(function(t){
      var m = MAIN_TOOL_IC[t.key] || { ic:"gauge", c:"bl" };
      return '<li class="hv-'+m.c+'"><a href="/tools/'+esc(t.key)+'">'+
        '<span class="ic-t">'+icon(m.ic,26)+'</span>'+
        '<b>'+esc(t.name)+'</b><i>'+esc(t.lead)+'</i></a></li>'; }).join("")+'</ul>'+
  '</div></section>';
}

/* ── ⑫ 후기 ───────────────────────────────────────────────────────
   ⚠️⚠️ **후기를 지어내지 마세요.** 평점도 후기 수도 값으로 들고 있지
   않습니다 — 후기는 **업체 안**(`p.reviews`)에 들어 있고 평점도 거기서
   계산합니다. 손으로 적어 넣을 자리가 없습니다. */
function MainReviews(){
  var rv = [];
  (window.AM_PROVIDERS||[]).forEach(function(p){
    (p.reviews||[]).forEach(function(r){ rv.push({ r:r, p:p }); });
  });
  rv.sort(function(a,b){ return String(b.r.at||"").localeCompare(String(a.r.at||"")); });
  var body = rv.length
    ? '<ul class="hr-g">'+rv.slice(0,3).map(function(x){
        return '<li><span class="hr-q">'+icon("chat",20)+'</span>'+
          '<p>'+esc(x.r.text||"")+'</p>'+
          '<i>'+esc(x.p.name||"")+(x.r.at ? ' · '+esc(x.r.at) : '')+'</i></li>';
      }).join("")+'</ul>'
    : Empty({ icon:"star", title:"첫 이용후기가 곧 올라옵니다",
        text:"후기를 지어내지 않습니다. 실제로 연결된 사장님이 쓰신 것만 "+
             "올리고, 평점은 그 후기에서 계산합니다 — 손으로 적는 자리가 없습니다.",
        cta:'<a class="btn btn-nv" href="/quote">견적 요청하기'+icon("arrow",18)+'</a>' });
  return MainBand({ bg:"sec-ivory", kicker:"REVIEWS",
    h:"실제 사장님들의 경험", mid:true, body:body });
}

/* ── ⑬ 업체 입점 ──────────────────────────────────────────────────
   ⚠️ **이 화면에서 어두운 면은 여기 한 장뿐입니다.** 푸터와 붙지 않게
   위에 밝은 구간(후기)이 옵니다.
   ⚠️ **성과를 지어내지 마세요.** "월 n건" 은 지금 0 입니다. 낼 수 있는
   것은 지금 사실인 것과 지키겠다는 약속까지입니다.
   ⚠️ 지시서 §12 — 첫 화면에 있던 "모집중 · 준비중" 은 여기로 모읍니다. */
function MainJoin(){
  var cats = (window.AM_CATS||[]).filter(function(c){ return c.kind === "provider"; });
  return '<section class="sec mjn"><div class="w">'+
    '<div class="mjn-c">'+
      '<div class="mjn-t">'+
        '<p class="mjn-k">PARTNER</p>'+
        '<h2>사장님을 찾는 업체인가요?</h2>'+
        '<p>실제로 창업 · 폐업을 준비하시는 분들을 만나 보세요. '+
          '기본 입점은 무료이고, 지금은 초기 파트너를 모집하고 있습니다.</p>'+
        (cats.length ? '<ul class="mjn-l">'+cats.slice(0,10).map(function(c){
          return '<li>'+icon(c.icon,18)+esc(c.name)+'</li>'; }).join("")+'</ul>' : '')+
      '</div>'+
      '<p class="mjn-go"><a class="btn btn-w" href="/join">'+
        '무료로 입점하기'+icon("arrow",18)+'</a></p>'+
    '</div>'+
  '</div></section>';
}

/* ⚠️ **구간을 더하거나 차례를 바꾸시려면 지시서를 먼저 고치세요.**
   `check.js` 의 "메인 구간 차례가 지시서와 같다" 가 열셋을 셉니다. */
function PageMain(){
  return MainHero()+ MainTwo()+ MainIndustry()+ MainServices()+
         MainProviders()+ MainFranchise()+ MainStores()+ MainPrice()+
         MainBridge()+ MainTools()+ MainReviews()+ MainJoin();
}
