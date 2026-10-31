

window.AM_GNB = [

  { to:"/sell",    name:"내 폰 팔기",     ic:"mobile" },
  { to:"/shop",    name:"중고폰 구매",     ic:"bag" },
  { to:"/repair",  name:"수리 서비스",     ic:"tool" },
  { to:"/bid",     name:"B2B 도매·경매",   ic:"gavel" },
  { to:"/biz?t=corp",   name:"기업 대량 매입", ic:"building" },
  { to:"/biz?t=export", name:"해외 수출",   ic:"globe" },
  { to:"/guide",   name:"이용 안내",       ic:"listck" },

  { to:"/faq",     name:"도움말", ic:"chat" }
];

var MNAV = [

  { to:"/",      name:"홈",     icon:"home" },
  { to:"/sell",  name:"팔기",   icon:"mobile" },
  { to:"/shop",  name:"구매",   icon:"bag" },
  { to:"/track", name:"진행",   icon:"search" },
  { to:"/my",    name:"마이",   icon:"user" }
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
      '<span class="hd-lg-i" aria-hidden="true">'+icon("mobile",20)+'</span>'+
      '<span class="hd-lg-t"><b>'+esc(nm)+'</b>'+
        (logoSub() ? '<i>'+esc(logoSub())+'</i>' : '')+'</span>')+
  '</a>';
}

function Header(){

  return '<header class="hd hd-2r"><div class="hd-t1"><div class="w-wide hd-t1-in">'+
    Logo() +

    '<form class="hd-s" role="search" onsubmit="return hdSearch(event)">'+
      '<span class="hd-s-i" aria-hidden="true">'+icon("search",19)+'</span>'+
      '<input type="search" id="hdQ" name="q" autocomplete="off" '+
        'aria-label="통합 검색" placeholder="어떤 기기를 찾고 계신가요? (예: 아이폰 15, 갤럭시 S24)">'+
      '<button class="hd-s-go" type="submit" aria-label="검색">'+icon("search",18)+'</button>'+
    '</form>'+
    '<div class="hd-r">'+
      '<a class="hd-ic hd-ic-s" href="/search" aria-label="검색">'+icon("search",20)+'</a>'+

      '<span class="hd-auth" id="hdAuth" hidden></span>'+

      '<a class="hd-txt" href="/my">'+icon("user",18)+'<span>마이페이지</span></a>'+

      '<a class="hd-ic hd-fav" href="/my" aria-label="찜한 중고폰">'+
        icon("heart",20)+'<span class="hd-fav-n" data-fav-n hidden></span></a>'+

      '<a class="btn btn-nv hd-cta" href="/sell" data-to="/sell">'+
        '<span class="hd-cta-w">판매 </span>신청</a>'+
      '<button class="hd-ic hd-mb" type="button" id="hdMb" aria-label="메뉴"'+
        ' aria-expanded="false" aria-controls="hdMenu" onclick="hdMenu()">'+
        icon("menu",22)+'</button>'+
    '</div>'+
  '</div></div>'+

  '<div class="hd-t2"><nav class="w-wide gnb" id="gnb" aria-label="주요 메뉴">'+
    AM_GNB.map(function(m){
      return '<a href="'+esc(m.to)+'" data-to="'+esc(m.to)+'">'+
        (m.ic ? '<i aria-hidden="true">'+icon(m.ic,17)+'</i>' : '')+
        '<span>'+esc(m.name)+'</span></a>';
    }).join("")+
  '</nav></div>'+
  HeaderDrawer()+
  '</header>';
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
      : '<a class="hd-txt hd-lgi" href="/my">'+
          '<span>'+esc("로그인 · 회원가입")+'</span></a>';
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

  var seen = {};
  els("a", g).forEach(function(a){
    var to = a.getAttribute("data-to");
    var qi = to.indexOf("?"), tp = qi < 0 ? to : to.slice(0, qi);
    var on = (tp === "/") ? (p === "/") : (p === tp || p.indexOf(tp + "/") === 0);
    if(on && qi >= 0){
      var kv = to.slice(qi + 1).split("="), v = nowQS(kv[0]);
      on = v ? (v === kv[1]) : !seen[tp];
      seen[tp] = 1;
    }
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

  [/^\/(sell|bid|biz)(\/|$)/,                    "/sell"],

  [/^\/(shop|d)(\/|$)/,                          "/shop"],
  [/^\/(track|quote)/,                           "/track"],
  [/^\/(my|search|compare|join)/,                "/my"],

  [/^\/(repair|guide|faq|about|terms|privacy|content|support|tools)/, "/"],

  [/^\/(providers|p\/|c\/|g\/|a\/|s\/|franchise|stores|assets|startup|operation|transfer|closure|sell-biz)/, "/"]
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

  var cols = [

    [brandName(), [["/guide","이용 안내"],["/bid","경쟁입찰이란"]]],
    ["판매",     [["/sell","내 폰 팔기"],["/bid","최고가 경쟁입찰"],
                   ["/track","판매 진행 조회"]]],
    ["구매",     [["/shop","중고폰 구매"],["/shop?m=iphone","아이폰"],
                   ["/shop?m=galaxy","갤럭시"],["/shop?m=tablet","태블릿"]]],
    ["파트너",   [["/join","매입업체 입점"]]],
    ["고객지원", [["/faq","자주 묻는 질문"],["/my","내 기록"],
                   ["/terms","이용약관"],["/privacy","개인정보처리방침"]]]
  ];

  var tail = [["/search","통합검색"],["/my","내 기록"]];

  return '<footer class="ft"><div class="w">'+
    '<div class="ft-g">'+
      '<div class="ft-b">'+
        Logo("ft") +

        '<p>'+esc((window.AM_BRAND||{}).slogan || "")+'<br> '+
          '직접 매입 · 전국 업체 경쟁입찰 · 검수 완료 중고폰까지.</p>'+
        '<a class="btn btn-nv" href="/join">업체 입점하기'+icon("arrow",16)+'</a>'+
      '</div>'+

      cols.map(function(c){
        return '<div class="ft-col"><h2><button type="button" class="ft-fold" '+
          'aria-expanded="true" onclick="ftFold(this)">'+
          '<span>'+esc(c[0])+'</span>'+icon("chevd",16)+'</button></h2><ul>'+
          c[1].map(function(l){
            return '<li><a href="'+esc(l[0])+'">'+esc(l[1])+'</a></li>';
          }).join("")+'</ul></div>';
      }).join("")+
    '</div>'+

    '<div class="ft-end">'+
      '<ul class="ft-tail">'+tail.map(function(l){
        return '<li><a href="'+esc(l[0])+'">'+esc(l[1])+'</a></li>'; }).join("")+'</ul>'+

      '<p class="ft-role">'+esc(koWith(brandName(),"은는"))+' 통신판매중개자이며 '+
        '제휴업체와 이용자 사이의 거래 당사자가 아닙니다. '+
        '상품 · 서비스 · 거래 조건에 대한 책임은 각 업체에 있습니다. '+
        '다만 회사가 직접 매입하거나 직접 판매하는 거래는 회사가 당사자이며, '+
        '그 건은 화면에 그렇게 표시합니다.</p>'+
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
