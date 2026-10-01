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

/* ⚠️ **일곱입니다** (2026-09-30 지시서 §4). 넘기지 마세요 — 좁은
   노트북에서 줄이 바뀌거나 가로로 넘칩니다. 메뉴가 두 줄이 되는
   순간 헤더가 판때기로 읽힙니다. */
window.AM_GNB = [
  { to:"/about",     name:"플랫폼 소개" },
  { to:"/home",      name:"서비스" },
  { to:"/startup",   name:"창업" },
  { to:"/closure",   name:"폐업" },
  { to:"/providers", name:"업체찾기" },
  { to:"/stores",    name:"매장인수" }
];
/* ⚠️ 시안의 메뉴는 플랫폼 소개 · 서비스 · **이용사례 · 파트너사 ·
   뉴스** 다섯입니다. 뒤의 셋은 **안 만들었습니다** — 이용사례 0건 ·
   등록 업체 0곳 · 뉴스 없음이라 셋 다 빈 화면이 됩니다 (절대 규칙
   1 · 2). 내용이 생기면 여기 한 줄씩 더하면 됩니다. */

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

function Header(){
  /* ⚠️ 본문 바로가기는 `index.html` 에 이미 있습니다. 여기서 또 내면
     읽어 주는 프로그램에 같은 것이 두 번 들립니다. */
  return '<header class="hd"><div class="w-wide hd-in">'+
    '<a class="lg hd-lg" href="/" aria-label="'+esc(brandName())+' 홈">'+
      '<span class="hd-lg-i" aria-hidden="true">'+icon("home",20)+'</span>'+
      '<span class="hd-lg-t"><b>'+esc(brandName())+'</b>'+
        '<i>'+esc(brandSub())+'</i></span></a>'+
    '<nav class="gnb" id="gnb" aria-label="주요 메뉴">'+
      AM_GNB.map(function(m){
        return '<a href="'+esc(m.to)+'" data-to="'+esc(m.to)+'">'+esc(m.name)+'</a>';
      }).join("")+
    '</nav>'+
    '<div class="hd-r">'+
      '<a class="hd-ic" href="/search" aria-label="검색">'+icon("search",20)+'</a>'+
      /* ⚠️ **"로그인" 이라고 적지 마세요.** 지시서 §4 에는 로그인이
         있지만 지금 백엔드가 없어서 로그인이라는 기능 자체가
         없습니다 — 눌러도 로그인 화면이 없으면 그건 고장난 것으로
         읽히고, 절대 규칙 5(하지 않은 일을 했다고 하지 않는다)에
         걸립니다. 회원 기능이 생기면 그때 이 한 줄을 바꿉니다. */
      '<a class="hd-txt" href="/my">내 기록</a>'+
      /* ⚠️ 시안(§5)의 헤더 CTA 는 **플랫폼 시작하기**입니다. 전에는
         여기가 "업체 입점하기" 였는데, 입점은 `/home` 위쪽과 푸터에
         그대로 있습니다 — 지운 것이 아닙니다. */
      /* ⚠️ 폰에서는 "플랫폼" 을 접습니다. 다 적어 두면 헤더가 390px 를
         넘겨 **가로 스크롤**이 생깁니다 (실제로 415px 였습니다). */
      '<a class="btn btn-nv hd-cta" href="/home">'+
        '<span class="hd-cta-w">플랫폼 </span>시작하기'+icon("arrow",16)+'</a>'+
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
  var cols = [
    ["창업", [["/startup","창업 시작하기"],["/franchise","프랜차이즈"],
              ["/stores","점포 · 상가"],["/providers","업체찾기"]]],
    ["폐업", [["/closure","폐업 시작하기"],["/stores","매장 양도"],
              ["/assets","시설 · 집기 처분"],["/support","폐업지원"]]],
    ["서비스", [["/quote","견적 요청"],["/content","창업 · 폐업 정보"],
              ["/tools","사장님 도구"],["/join","업체 입점하기"]]]
  ];
  /* 시안의 맨 아랫줄 — ⚠️ "고객센터" 는 **없는 화면**이라 안 적습니다.
     대신 실제로 답이 있는 `/faq` 로 보냅니다 (절대 규칙 2 · 5). */
  var tail = [["/about","플랫폼 소개"],["/faq","자주 묻는 것"],
              ["/terms","이용약관"],["/privacy","개인정보처리방침"]];

  return '<footer class="ft"><div class="w">'+
    '<div class="ft-g">'+
      '<div class="ft-b">'+
        '<a class="lg lg-ft" href="/"><b>'+esc(brandName())+'</b>'+
          '<i>'+esc(brandSub())+'</i></a>'+
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
    '<p class="ft-role">'+esc(brandName())+'은 통신판매중개자이며 '+
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
