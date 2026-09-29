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

window.AM_GNB = [
  { to:"/startup",   name:"창업" },
  { to:"/closure",   name:"폐업" },
  { to:"/providers", name:"업체찾기" },
  { to:"/franchise", name:"프랜차이즈" },
  { to:"/stores",    name:"매장 · 시설" },
  { to:"/support",   name:"지원정보" }
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

function Header(){
  /* ⚠️ 본문 바로가기는 `index.html` 에 이미 있습니다. 여기서 또 내면
     읽어 주는 프로그램에 같은 것이 두 번 들립니다. */
  return '<header class="hd"><div class="w-wide hd-in">'+
    '<a class="lg" href="/" aria-label="'+esc(brandName())+' 홈">'+
      '<b>'+esc(brandName())+'</b><span>'+esc(brandSub())+'</span></a>'+
    '<nav class="gnb" id="gnb" aria-label="주요 메뉴">'+
      AM_GNB.map(function(m){
        return '<a href="'+esc(m.to)+'" data-to="'+esc(m.to)+'">'+esc(m.name)+'</a>';
      }).join("")+
    '</nav>'+
    '<div class="hd-r">'+
      '<a class="hd-ic" href="/search" aria-label="검색">'+icon("search",20)+'</a>'+
      '<a class="hd-txt" href="/my">로그인</a>'+
      /* ⚠️ 입점 CTA 는 **늘 보여야 합니다** (§39). 업체가 모이지 않으면
         이 플랫폼은 아무것도 아닙니다. */
      '<a class="btn btn-b hd-cta" href="/join">업체 입점하기</a>'+
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
function Footer(){
  var cols = [
    ["창업", [["/startup","창업 시작하기"],["/franchise","프랜차이즈"],
              ["/stores","점포 · 상가"],["/providers","업체찾기"]]],
    ["폐업", [["/closure","폐업 시작하기"],["/stores","매장 양도"],
              ["/assets","시설 · 집기 처분"],["/support","폐업지원"]]],
    ["함께", [["/join","업체 입점하기"],["/quote","견적 요청"],
              ["/content","창업 · 폐업 정보"],["/support","지원사업"]]],
    ["안내", [["/my","MY"],["/faq","자주 묻는 것"],["/search","검색"],
              ["/terms","이용약관"],["/privacy","개인정보처리방침"]]]
  ];
  return '<footer class="ft"><div class="w">'+
    '<div class="ft-g">'+
      '<div class="ft-b">'+
        '<a class="lg lg-ft" href="/"><b>'+esc(brandName())+'</b></a>'+
        '<p>'+esc((window.AM_BRAND||{}).slogan || "")+'<br>'+
          '창업에 필요한 모든 것, 폐업에 필요한 모든 것.</p>'+
        '<a class="btn btn-o" href="/join">업체 입점하기'+icon("arrow",16)+'</a>'+
      '</div>'+
      cols.map(function(c){
        return '<div class="ft-col"><h4>'+esc(c[0])+'</h4><ul>'+
          c[1].map(function(l){
            return '<li><a href="'+esc(l[0])+'">'+esc(l[1])+'</a></li>';
          }).join("")+'</ul></div>';
      }).join("")+
    '</div>'+
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
