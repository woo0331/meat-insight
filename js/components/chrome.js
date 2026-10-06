/* ════════════════════════════════════════════════════════════════════
   헤더 · 푸터 · 모바일 아래 네비 (§5)

   화면마다 다시 그리지 않고 **한 번 그린 뒤 표시만 바꿉니다** —
   지금 어느 메뉴에 있는지(`paintGnb`), 아래 네비 어느 칸인지
   (`paintMnav`), 사업자 정보가 채워졌는지(`paintBiz`).

   ⚠️ **헤더를 감싸는 칸(`#chrome-t`)에 `display:contents` 가 있어야
   합니다.** 안 그러면 `position:sticky` 가 적혀 있어도 안 붙습니다 —
   감싸개 높이가 헤더 높이와 같아서 붙어 있을 범위가 없습니다.
   맨 위에서는 멀쩡해 보이고 에러도 안 납니다. CLAUDE.md 참고.

   ⚠️ **메뉴를 늘리지 마세요.** 지시서 §5 가 정한 여섯 개입니다.
   손님이 3초 안에 알아야 하는 것은 "창업이냐 폐업이냐" 하나뿐이고,
   메뉴가 길어지면 그게 묻힙니다 (§2 · §54).
   ════════════════════════════════════════════════════════════════════ */

/* ⚠️⚠️ **2026-10-03 리뉴얼 지시서 §2 — 일곱입니다.** 전에는 여섯
   이었고 CLAUDE.md 가 "일곱으로 늘리지 마세요(360px 에서 넘칩니다)"
   라고 적어 두었습니다. 지시서가 일곱을 그림으로 못박았고, 재 보니
   **1040px 아래에서는 메뉴가 통째로 접히고**(아래 네비가 받습니다)
   그 위에서는 일곱이 다 들어갑니다 — 일곱 폭을 전부 재서 가로
   스크롤이 없는 것을 확인했습니다. **여덟으로 늘리지 마세요.**

   ⚠️ 일곱 전부 **실제로 있는 화면**입니다 (지시서 §2 "기존 Route와
   실제 기능을 확인하여 연결한다"). 시안의 `가격` 은 독립 화면이
   없어서 안 넣었습니다 — 가짜 링크는 절대 규칙 5 입니다.
   ⚠️ **"도구"를 뺐습니다** — 지시서 목록에 없습니다. 지운 것이
   아니라 푸터와 메인 도구 구간에 그대로 있습니다.

   ⚠️⚠️ **"서비스"(`/home`) 를 지웠습니다** — 그 화면이 이제 `/` 입니다
   (랜딩 제거). 로고가 거기로 갑니다.
   ⚠️ "플랫폼 소개"(`/about`) 는 §28 의 목록에 없어서 **푸터로** 내렸습니다.
   지운 것이 아닙니다 — 신뢰줄 · 범위 · 진행 방법 · FAQ 가 다 거기
   있습니다. */
window.AM_GNB = [
  /* ⚠️⚠️ **일곱입니다.** 2026-10-04 HERO 개편 지시서 §2 는 레퍼런스처럼
     **열둘**(상가·점포 · 인테리어 · 주방설비 · 가구·집기 · POS·시스템 ·
     세무·노무 · 마케팅 · 철거·원상복구 · 매장양도 · 커뮤니티 ·
     프랜차이즈 · 업체찾기)을 적었는데, **재 보니 들어가지 않습니다.**

       1280px 에서 메뉴가 쓸 수 있는 폭   548px
       열둘이 필요한 폭                   741px   (글자 521 + 간격 220)
       일곱이 필요한 폭                   429px

     1440px 에서도 708 자리에 742 가 필요해서 넘칩니다. 넘치면 가로
     스크롤이 나는 것이 아니라 **메뉴가 헤더 오른쪽(검색 · 내 기록 ·
     입점) 위로 올라앉습니다** — 전수 점검이 못 잡는 종류입니다
     (`.gnb` 가 `min-width:0` 이라 문서 폭은 그대로입니다).

     ⚠️ 그래서 **분야는 헤더가 아니라 메인의 "분야 바로가기" 열**과
     `업체찾기` 안에 둡니다 — 한 번 더 누르지만 글자가 겹치지 않습니다.
     ⚠️ **여덟으로 늘리지 마세요.** 1280 에서는 여덟도 들어가지만
     900~940px(메뉴가 접히기 직전)에서 오른쪽과 겹칩니다 — 재 봤습니다.

     ⚠️ 일곱 전부 **실제로 있는 화면**입니다 (가짜 링크는 절대 규칙 5).
     지시서의 `커뮤니티` 는 백엔드가 있어야 하는 게시판이라 넣지
     않았고, `매장양도` 는 `/stores` 와 같은 화면입니다 — 그 화면의
     이름을 지시서 말투대로 **상가·점포**로 바꿨습니다. */
  /* ⚠️⚠️ **2026-10-06 V2 확정 지시서 §23 의 일곱**입니다 — 사업의
     생애주기 넷(창업 · 운영 · 인수·양도 · 폐업)이 앞에 서고, 그 다음이
     업체찾기 · 정보센터 · 도구입니다. 전에는 창업 · 폐업 둘뿐이고 그
     사이(운영 · 인수·양도)로 가는 길이 **메인에만** 있었습니다.
     ⚠️ 빠진 셋(프랜차이즈 · 상가·점포 · 지원정보)은 **푸터와 여정
     화면에 그대로 있습니다** — 길을 지운 것이 아니라 한 단계 안으로
     옮겼습니다. 헤더는 일곱까지만 들어갑니다 (재 본 값, 아래 설명). */
  { to:"/startup",   name:"창업" },
  { to:"/operation", name:"운영" },
  { to:"/transfer",  name:"인수·양도" },
  { to:"/closure",   name:"폐업" },
  { to:"/providers", name:"업체찾기" },
  { to:"/content",   name:"정보센터" },
  { to:"/tools",     name:"도구" }
];

/* 폰 아래 네비 — 다섯 칸을 넘기지 마세요. 손가락이 닿는 폭이 줄고
   무엇이 중요한지가 안 보입니다. */
var MNAV = [
  { to:"/",          name:"홈",     icon:"home" },
  { to:"/startup",   name:"창업",   icon:"seed" },
  { to:"/closure",   name:"폐업",   icon:"box" },
  { to:"/providers", name:"업체찾기", icon:"search" },
  { to:"/my",        name:"MY",     icon:"user" }
];

function brandName(){ return (window.AM_BRAND || {}).name || ""; }
function brandSub(){  return (window.AM_BRAND || {}).sub  || ""; }
/* 로고 아래 작은 줄 — ⚠️ 이름과 **같으면 빈 문자열**입니다 */
function logoSub(){
  var B = window.AM_BRAND || {}, en = B.en || "";
  return (en && en !== (B.name || "")) ? en : "";
}

/* ── 로고 한 벌 (2026-10-06 2차 §22) ────────────────────────────────
   ⚠️⚠️ **로고를 두 군데에 적지 마세요.** 전에는 헤더와 푸터가 각자
   마크업을 들고 있어서, 로고를 바꾸면 **한쪽만 바뀌는** 자리였습니다.
   지금은 이 함수 하나이고 헤더 · 푸터가 같이 부릅니다.

   ⚠️ **그림 로고로 바꾸시려면 `brand.js` 의 `logo` 한 줄**입니다 —
   `logo:"/img/logo.svg"` 로 적으면 헤더 · 푸터가 **한꺼번에** 바뀝니다.
   비워 두면 지금처럼 글자 로고입니다. 임시로 복잡한 로고를 만들지
   않습니다 (§22 — 향후 교체 예정).
   ⚠️ 그림을 넣으실 때 `alt` 는 **브랜드 이름**입니다. 빈 alt 로 두면
   읽어 주는 프로그램에서 로고 자리가 통째로 사라집니다.
   ⚠️ 높이는 CSS(`.lg-img`)가 잡습니다 — 파일 크기에 기대지 마세요. */
function Logo(where){
  var B = window.AM_BRAND || {}, nm = brandName();
  var mark = B.logo
    ? '<img class="lg-img" src="'+esc(B.logo)+'" alt="'+esc(nm)+'" '+
      'width="120" height="28">'
    : "";
  if(where === "ft"){
    return '<a class="lg lg-ft" href="/">'+
      (mark || '<b>'+esc(nm)+'</b><i>'+esc(brandSub())+'</i>')+'</a>';
  }
  /* 헤더 — 마크 타일 + 이름 + (이름과 다를 때만) 영문 작은 줄.
     ⚠️ 작은 줄은 **로고 한 덩어리 안**입니다. 떼어서 따로 내면
     그때부터 서로 다른 서비스 둘로 읽힙니다 (brand.js 의 `en`). */
  return '<a class="lg hd-lg" href="/" aria-label="'+esc(nm)+' 홈">'+
    (mark ? mark :
      '<span class="hd-lg-i" aria-hidden="true">'+icon("home",20)+'</span>'+
      '<span class="hd-lg-t"><b>'+esc(nm)+'</b>'+
        (logoSub() ? '<i>'+esc(logoSub())+'</i>' : '')+'</span>')+
  '</a>';
}

function Header(){
  /* ⚠️ 본문 바로가기는 `index.html` 에 이미 있습니다. 여기서 또 내면
     읽어 주는 프로그램에 같은 것이 두 번 들립니다. */
  return '<header class="hd"><div class="w-wide hd-in">'+
    Logo() +
    '<nav class="gnb" id="gnb" aria-label="주요 메뉴">'+
      AM_GNB.map(function(m){
        return '<a href="'+esc(m.to)+'" data-to="'+esc(m.to)+'">'+esc(m.name)+'</a>';
      }).join("")+
    '</nav>'+
    '<div class="hd-r">'+
      /* ⚠️⚠️ 시안 §2 의 **통합검색**입니다. 전에는 히어로 안에 큰
         검색창이 있었는데, 리뉴얼로 히어로가 START/CLOSE 두 장짜리
         비주얼이 되면서 들어갈 자리가 없어졌습니다 — 지우지 않고
         헤더로 올렸습니다. 모든 화면에서 쓸 수 있게 된 쪽이 낫습니다.
         ⚠️ 폼입니다 — 엔터로도 가야 합니다. */
      '<form class="hd-s" role="search" onsubmit="return hdSearch(event)">'+
        '<span class="hd-s-i" aria-hidden="true">'+icon("search",18)+'</span>'+
        '<input type="search" id="hdQ" name="q" autocomplete="off" '+
          'aria-label="통합 검색" placeholder="원하는 서비스나 업체를 검색하세요.">'+
      '</form>'+
      '<a class="hd-ic hd-ic-s" href="/search" aria-label="검색">'+icon("search",20)+'</a>'+
      '<span class="hd-sep" aria-hidden="true"></span>'+
      /* ⚠️ **"로그인" 이라고 적지 마세요.** 시안 §2 에는 로그인이
         있지만 지금 백엔드가 없어서 로그인이라는 기능 자체가
         없습니다 — 눌러도 로그인 화면이 없으면 그건 고장난 것으로
         읽히고, 절대 규칙 5(하지 않은 일을 했다고 하지 않는다)에
         걸립니다. 지시서 §2 자신이 "기존 Route와 실제 기능을 확인하여
         연결한다" 고 적었고, 실제로 있는 것은 `/my` 입니다.
         회원 기능이 생기면 그때 이 한 줄을 바꿉니다. */
      '<a class="hd-txt" href="/my">'+icon("user",18)+'<span>내 기록</span></a>'+
      /* ⚠️ 폰에서는 "업체" 를 접습니다. 다 적어 두면 헤더가 360px 를
         넘겨 **가로 스크롤**이 생깁니다 (실제로 415px 였습니다). */
      '<a class="btn btn-nv hd-cta" href="/join">'+
        '<span class="hd-cta-w">업체 </span>입점'+icon("arrow",16)+'</a>'+
    '</div>'+
  '</div></header>';
}

function paintGnb(){
  var g = $("gnb"); if(!g) return;
  var p = nowPath();
  els("a", g).forEach(function(a){
    var to = a.getAttribute("data-to");
    var on = (to === "/") ? (p === "/") : (p === to || p.indexOf(to + "/") === 0);
    a.classList.toggle("on", on);
    if(on) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current");
  });
}

function MobileNav(){
  return '<nav class="mnav" id="mnav" aria-label="아래 메뉴">'+
    MNAV.map(function(m){
      return '<a href="'+esc(m.to)+'" data-to="'+esc(m.to)+'">'+
        icon(m.icon,21)+'<span>'+esc(m.name)+'</span></a>';
    }).join("")+
  '</nav>';
}

/* 지금 어느 칸인지 — ⚠️ 아래 화면들은 네비에 자기 칸이 없습니다.
   그때 제일 가까운 칸을 켜 둡니다. 아무것도 안 켜져 있으면 손님은
   자기가 어디 있는지 모릅니다. */
var MNAV_NEAR = [
  [/^\/(startup|franchise|support)/, "/startup"],
  [/^\/closure/,                     "/closure"],
  [/^\/(providers|p|c|quote|join)/,  "/providers"],
  [/^\/(stores|assets)/,             "/providers"],
  [/^\/(my|search|content)/,         "/my"]
];
function paintMnav(){
  var n = $("mnav"); if(!n) return;
  var p = nowPath(), want = null;
  for(var i=0;i<MNAV_NEAR.length;i++){ if(MNAV_NEAR[i][0].test(p)){ want = MNAV_NEAR[i][1]; break; } }
  if(p === "/") want = "/";
  els("a", n).forEach(function(a){
    var on = a.getAttribute("data-to") === want;
    a.classList.toggle("on", on);
    if(on) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current");
  });
}

/* ── 푸터 ────────────────────────────────────────────────────────
   ⚠️ **값이 없는 줄은 자리표시자를 찍지 말고 줄째 뺍니다.** 손님 눈에
   `(미기재)` · `undefined` 가 보이면 그 순간 미완성 사이트입니다. */
/* ── 푸터 ─────────────────────────────────────────────────────────
   시안(§13)은 로고 + 링크 넷 + SNS 한 줄입니다. 그런데 푸터는
   **118개 화면이 같이 쓰는 것**이라, 랜딩에 맞춰 넷으로 줄이면
   나머지 화면에서 창업 · 폐업 · 업체찾기로 가는 길이 막힙니다.

   그래서 시안의 **차분한 한 판**은 따라가되 길은 남겼습니다 —
   다섯 칸을 **셋**으로 줄이고, 깊은 계산기 주소 다섯은 `/tools`
   한 줄로 모으고, 시안의 네 링크는 **맨 아래 한 줄**로 뺐습니다.

   ⚠️ SNS 아이콘은 **안 답니다.** 계정이 없어서 `href="#"` 을 만들면
   그건 가짜 링크입니다 (§13 이 직접 금지합니다). 계정이 생기면
   여기에 한 줄씩 더하세요. */
function Footer(){
  /* ⚠️⚠️ **첫 칸이 2026-10-04 에 "사업 단계" 로 바뀌었습니다.**
     전에는 `창업`(창업 시작하기 · 프랜차이즈 · 점포·상가 · 업체찾기)
     이었는데, 그 넷이 **전부 헤더에 그대로 있습니다** — 푸터에서
     한 번 더 내는 것보다, **메인에서만 갈 수 있던 사업 단계 여섯**을
     모든 화면에서 갈 수 있게 하는 쪽이 낫습니다.
     ⚠️ 잃은 길이 없는지 확인했습니다 — `/startup` · `/franchise` ·
     `/providers` 는 헤더에, `/stores` 는 헤더와 아래 `폐업` 칸에
     있습니다.
     ⚠️ 이름 · 주소를 손으로 적지 마세요 — `lifecycle.js` 에서 옵니다. */
  var stages = (window.AM_STAGES || []).map(function(st){
    return ["/g/" + st.key, st.name];
  });
  /* ⚠️ 둘째 칸이 `폐업` 이었는데, 그 넷(매장 양도 · 시설·집기 처분 ·
     폐업지원)이 **첫 칸의 `폐업 · 정리` 안에 다 있습니다** — 바로 옆에
     같은 것을 두 번 내는 셈이라 **찾는 화면**으로 바꿨습니다.
     ⚠️ 창업 · 폐업 진입은 여기 그대로 있습니다 (헤더에도 있습니다). */
  /* ⚠️ 2026-10-06 V2 확정 §24 — 첫 칸이 **여정 넷**입니다. 헤더와 같은
     축이라야 "여기가 어디로 가는 곳인가" 가 한 번에 읽힙니다.
     ⚠️ 이름 · 주소를 손으로 적지 마세요 — `journey.js` 에서 옵니다.
     ⚠️ 사업 단계 여섯은 **둘째 칸**으로 내렸습니다 (지운 것이 아닙니다). */
  var journeys = (window.AM_JOURNEYS || []).map(function(j){
    return [j.to, j.name];
  });
  var cols = [
    ["서비스", journeys.concat([["/providers","업체찾기"],
              ["/content","정보센터"],["/tools","사장님 도구"]])],
    ["사업 단계", stages],
    ["찾기", [["/franchise","프랜차이즈"],["/stores","상가 · 점포"],
              ["/assets","시설 · 집기"],["/support","창업 · 폐업 지원"],
              ["/quote","견적 요청"],["/join","파트너 입점"]]]
  ];
  /* 시안의 맨 아랫줄 — ⚠️ "고객센터" 는 **없는 화면**이라 안 적습니다.
     대신 실제로 답이 있는 `/faq` 로 보냅니다 (절대 규칙 2 · 5). */
  var tail = [["/about","플랫폼 소개"],["/faq","자주 묻는 것"],
              ["/terms","이용약관"],["/privacy","개인정보처리방침"]];

  return '<footer class="ft"><div class="w">'+
    '<div class="ft-g">'+
      '<div class="ft-b">'+
        Logo("ft") +
        '<p>'+esc((window.AM_BRAND||{}).slogan || "")+'<br> '+
          '창업에 필요한 모든 것, 폐업에 필요한 모든 것.</p>'+
        '<a class="btn btn-nv" href="/join">업체 입점하기'+icon("arrow",16)+'</a>'+
      '</div>'+
      cols.map(function(c){
        return '<div class="ft-col"><h4>'+esc(c[0])+'</h4><ul>'+
          c[1].map(function(l){
            return '<li><a href="'+esc(l[0])+'">'+esc(l[1])+'</a></li>';
          }).join("")+'</ul></div>';
      }).join("")+
    '</div>'+
    '<ul class="ft-tail">'+tail.map(function(l){
      return '<li><a href="'+esc(l[0])+'">'+esc(l[1])+'</a></li>'; }).join("")+'</ul>'+
    /* ⚠️ 중개자라는 사실을 미리 알립니다 — 전자상거래법 제20조 제1항.
       안 알리면 제20조의2 에 따라 연대책임을 집니다. 지우지 마세요. */
    '<p class="ft-role">'+esc(koWith(brandName(),"은는"))+' 통신판매중개자이며 '+
      '입점 업체와 이용자 사이의 거래 당사자가 아닙니다. '+
      '상품 · 서비스 · 거래 조건에 대한 책임은 각 업체에 있습니다.</p>'+
    '<div class="ft-biz" id="ft-biz"></div>'+
  '</div></footer>';
}

function paintBiz(){
  var box = $("ft-biz"); if(!box) return;
  var B = window.WOW_BIZ || {};
  var rows = [
    ["상호", B.name], ["대표", B.ceo], ["사업자등록번호", B.bizNo],
    ["통신판매업신고", B.mailOrderNo], ["주소", B.addr],
    ["문의", B.email], ["전화", B.phone]
  ].filter(function(r){ return r[1]; });

  /* ⚠️ 하나도 없으면 **구간째 뺍니다.** 빈 표를 두면 미완성으로
     읽힙니다 (절대 규칙 2). 영업 시작 전에는 반드시 필요합니다
     — 전자상거래법 제10조. */
  if(!rows.length){
    box.innerHTML = '<span class="ft-cp">© '+new Date().getFullYear()+' '+
      esc(brandName())+'</span>';
    if(!window.__bizWarned){
      window.__bizWarned = true;
      console.warn("[site] 사업자 정보가 비어 있습니다. js/data/site.js 의 WOW_BIZ 를 채우세요 (전자상거래법 제10조).");
    }
    return;
  }
  box.innerHTML = rows.map(function(r){
    return '<span>'+esc(r[0])+' '+esc(r[1])+'</span>';
  }).join("") + '<span class="ft-cp">© '+new Date().getFullYear()+' '+esc(brandName())+'</span>';
}

/* 화면을 그릴 때마다 헤더·네비 표시를 맞춥니다 */
window.paintChrome = function(){ paintGnb(); paintMnav(); paintBiz(); };

window.mountChrome = function(){
  var t = $("chrome-t"), b = $("chrome-b");
  if(t) t.innerHTML = Header();
  if(b) b.innerHTML = Footer() + MobileNav();
  paintChrome();
};

/* 헤더 통합검색 — ⚠️ 빈 채로 보내면 `/search` 가 빈 화면입니다. */
window.hdSearch = function(e){
  e.preventDefault();
  var el = $("hdQ"), v = ((el && el.value) || "").trim();
  if(!v){ toast("찾으실 것을 적어 주세요"); if(el) el.focus(); return false; }
  go("/search?q=" + encodeURIComponent(v));
  if(el) el.blur();
  return false;
};
