

window.AM_GNB = [

  { to:"/startup",   name:"창업 준비" },
  { to:"/operation", name:"매장 운영" },
  { to:"/transfer",  name:"매장 양도양수" },
  { to:"/closure",   name:"폐업 · 정리" },
  { to:"/providers", name:"서비스 · 상품" },

  { to:"/tools",     name:"계산도구" },
  { to:"/content",   name:"이용 가이드" },

  { to:"/faq",       name:"도움말" }
];

var MNAV = [
  { to:"/",          name:"홈",       icon:"home" },
  { to:"/providers", name:"서비스",    icon:"grid" },
  { to:"/tools",     name:"계산도구",  icon:"calc" },
  { to:"/content",   name:"가이드",    icon:"book" },
  { to:"/my",        name:"마이",      icon:"user" }
];

function brandName(){ return (window.AM_BRAND || {}).name || ""; }
function brandSub(){  return (window.AM_BRAND || {}).sub  || ""; }

function logoSub(){
  var B = window.AM_BRAND || {}, sb = B.sub || "";
  return (sb && sb !== (B.name || "")) ? sb : "";
}

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

  return '<a class="lg hd-lg" href="/" aria-label="'+esc(nm)+' 홈">'+
    (mark ? mark :
      '<span class="hd-lg-i" aria-hidden="true">'+icon("home",20)+'</span>'+
      '<span class="hd-lg-t"><b>'+esc(nm)+'</b>'+
        (logoSub() ? '<i>'+esc(logoSub())+'</i>' : '')+'</span>')+
  '</a>';
}

function Header(){

  return '<header class="hd"><div class="w-wide hd-in">'+
    Logo() +
    '<nav class="gnb" id="gnb" aria-label="주요 메뉴">'+
      AM_GNB.map(function(m){
        return '<a href="'+esc(m.to)+'" data-to="'+esc(m.to)+'">'+esc(m.name)+'</a>';
      }).join("")+
    '</nav>'+
    '<div class="hd-r">'+

      '<form class="hd-s" role="search" onsubmit="return hdSearch(event)">'+
        '<span class="hd-s-i" aria-hidden="true">'+icon("search",18)+'</span>'+
        '<input type="search" id="hdQ" name="q" autocomplete="off" '+
          'aria-label="통합 검색" placeholder="원하는 서비스나 업체를 검색하세요.">'+
      '</form>'+
      '<a class="hd-ic hd-ic-s" href="/search" aria-label="검색">'+icon("search",20)+'</a>'+
      '<span class="hd-sep" aria-hidden="true"></span>'+

      '<span class="hd-auth" id="hdAuth" hidden></span>'+

      '<a class="hd-txt" href="/my">'+icon("user",18)+'<span>내 기록</span></a>'+

      '<a class="btn btn-nv hd-cta" href="/quote" data-to="/quote">'+
        '<span class="hd-cta-w">무료 </span>견적 신청'+icon("arrow",16)+'</a>'+

      '<button class="hd-ic hd-mb" type="button" id="hdMb" aria-label="메뉴"'+
        ' aria-expanded="false" aria-controls="hdMenu" onclick="hdMenu()">'+
        icon("menu",22)+'</button>'+
    '</div>'+
    HeaderDrawer()+
  '</div></header>';
}

function HeaderDrawer(){
  return '<div class="hd-dw" id="hdMenu" hidden>'+
    '<nav class="hd-dw-g" aria-label="전체 메뉴">'+
      AM_GNB.map(function(m){
        return '<a href="'+esc(m.to)+'" data-to="'+esc(m.to)+'">'+
          esc(m.name)+icon("arrow",16)+'</a>';
      }).join("")+
      '<a href="/my">'+esc("내 기록")+icon("arrow",16)+'</a>'+
      '<a href="/join">'+esc("파트너 입점")+icon("arrow",16)+'</a>'+

      '<a href="/search">'+esc("통합검색")+icon("arrow",16)+'</a>'+
    '</nav>'+
  '</div>';
}

window.hdMenu = function(open){
  var dw = document.getElementById("hdMenu"),
      bt = document.getElementById("hdMb");
  if(!dw || !bt) return;
  var on = (open === undefined) ? dw.hasAttribute("hidden") : !!open;
  if(on) dw.removeAttribute("hidden"); else dw.setAttribute("hidden","");
  bt.setAttribute("aria-expanded", on ? "true" : "false");
};

function hdAuthPaint(){
  var box = document.getElementById("hdAuth");
  if(!box || typeof window.amAuthAsk !== "function") return;
  window.amAuthAsk().then(function(a){
    if(!a || !a.on){ box.setAttribute("hidden",""); box.innerHTML = ""; return; }
    box.removeAttribute("hidden");
    box.innerHTML = a.signedIn
      ? '<a class="hd-txt" href="/my">'+icon("user",18)+
          '<span>'+esc("내 계정")+'</span></a>'
      : '<a class="hd-txt" href="/my">'+icon("user",18)+
          '<span>'+esc("로그인")+'</span></a>';
  });
}

function gnbQuoteHref(){
  if(!window.quoteTo) return "/quote";
  var p = nowPath(), seg = p.split("/").filter(Boolean), o = {};
  if(seg[0] === "providers" && seg[1]) o.cat = seg[1];
  if(seg[0] === "c" && seg[1])         o.cat = seg[1];
  if((seg[0] === "startup" || seg[0] === "closure") && seg[1]) o.industry = seg[1];
  if(seg[0] === "startup") o.side = "start";
  if(seg[0] === "closure") o.side = "close";

  if(nowQS("i")) o.industry = nowQS("i");
  if(nowQS("r")) o.region   = nowQS("r");
  if(nowQS("s")) o.sub      = nowQS("s");
  if(nowQS("c")) o.cat      = nowQS("c");
  return window.quoteTo(o);
}

function paintGnb(){
  var p = nowPath();

  var hd = document.querySelector(".hd");
  if(hd) hd.classList.toggle("is-home", p === "/");

  if(typeof window.hdMenu === "function") window.hdMenu(false);

  els('a[data-to="/quote"]', document.querySelector(".hd") || document)
    .forEach(function(a){ a.setAttribute("href", gnbQuoteHref()); });
  var g = $("gnb"); if(!g) return;
  els("a", g).forEach(function(a){
    var to = a.getAttribute("data-to");
    var on = (to === "/") ? (p === "/") : (p === to || p.indexOf(to + "/") === 0);
    a.classList.toggle("on", on);
    if(on) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current");

    if(to === "/quote") a.setAttribute("href", gnbQuoteHref());
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

var MNAV_NEAR = [
  [/^\/tools/,                                   "/tools"],
  [/^\/(content|faq|about|support)/,             "/content"],
  [/^\/(my|search|compare)/,                     "/my"],
  [/^\/(providers|p\/|c\/|g\/|quote|join|franchise|sell|stores|assets|s\/|a\/|startup|operation|transfer|closure)/, "/providers"]
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

function Footer(){

  var stages = (window.AM_STAGES || []).map(function(st){
    return ["/g/" + st.key, st.name];
  });

  var journeys = (window.AM_JOURNEYS || []).map(function(j){
    return [j.to, j.name];
  });

  var cols = [

    [brandName(), [["/about","서비스 소개"]].concat(journeys)],
    ["사업 단계", stages],
    ["서비스",   [["/providers","업체 찾기"],["/content","정보센터"],
                  ["/tools","사장님 도구"],["/stores","매장 찾기"],

                  ["/sell","매장 내놓기"],
                  ["/assets","시설 · 집기"],["/franchise","프랜차이즈"],
                  ["/support","창업 · 폐업 지원"],["/quote","견적 요청"]]],
    ["파트너",   [["/join","파트너 입점"]]],
    ["고객지원", [["/faq","자주 묻는 질문"],["/terms","이용약관"],
                  ["/privacy","개인정보처리방침"]]]
  ];

  var tail = [["/search","통합검색"],["/my","내 기록"]];

  return '<footer class="ft"><div class="w">'+
    '<div class="ft-g">'+
      '<div class="ft-b">'+
        Logo("ft") +
        '<p>'+esc((window.AM_BRAND||{}).slogan || "")+'<br> '+
          '창업에 필요한 모든 것, 폐업에 필요한 모든 것.</p>'+
        '<a class="btn btn-nv" href="/join">업체 입점하기'+icon("arrow",16)+'</a>'+
      '</div>'+

      cols.map(function(c){
        return '<div class="ft-col"><h4><button type="button" class="ft-fold" '+
          'aria-expanded="true" onclick="ftFold(this)">'+
          '<span>'+esc(c[0])+'</span>'+icon("chevd",16)+'</button></h4><ul>'+
          c[1].map(function(l){
            return '<li><a href="'+esc(l[0])+'">'+esc(l[1])+'</a></li>';
          }).join("")+'</ul></div>';
      }).join("")+
    '</div>'+

    '<div class="ft-end">'+
      '<ul class="ft-tail">'+tail.map(function(l){
        return '<li><a href="'+esc(l[0])+'">'+esc(l[1])+'</a></li>'; }).join("")+'</ul>'+

      '<p class="ft-role">'+esc(koWith(brandName(),"은는"))+' 통신판매중개자이며 '+
        '입점 업체와 이용자 사이의 거래 당사자가 아닙니다. '+
        '상품 · 서비스 · 거래 조건에 대한 책임은 각 업체에 있습니다.</p>'+
      '<div class="ft-biz" id="ft-biz"></div>'+
    '</div>'+
  '</div></footer>';
}

function paintBiz(){
  var box = $("ft-biz"); if(!box) return;
  var B = window.WOW_BIZ || {};

  var rows = [
    ["상호", B.company], ["대표", B.ceo], ["사업자등록번호", B.brn],
    ["통신판매업신고", B.mailOrder], ["주소", B.address],
    ["문의", B.email], ["전화", B.phone]
  ].filter(function(r){ return r[1]; });

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

window.paintChrome = function(){ paintGnb(); paintMnav(); paintBiz(); };

window.ftFold = function(btn){
  var col = btn.closest(".ft-col"); if(!col) return;
  var shut = col.classList.toggle("is-fold");
  btn.setAttribute("aria-expanded", shut ? "false" : "true");
};

window.mountChrome = function(){
  var t = $("chrome-t"), b = $("chrome-b");
  if(t) t.innerHTML = Header();
  if(b) b.innerHTML = Footer() + MobileNav();

  if(b && window.innerWidth <= 900)
    els(".ft-col", b).forEach(function(c){
      c.classList.add("is-fold");
      var f = c.querySelector(".ft-fold");
      if(f) f.setAttribute("aria-expanded", "false");
    });
  paintChrome();

  hdAuthPaint();
};

window.hdSearch = function(e){
  e.preventDefault();
  var el = $("hdQ"), v = ((el && el.value) || "").trim();
  if(!v){ toast("찾으실 것을 적어 주세요"); if(el) el.focus(); return false; }
  go("/search?q=" + encodeURIComponent(v));
  if(el) el.blur();
  return false;
};
