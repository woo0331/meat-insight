

window.AM_GNB = [

  { to:"/startup",   name:"창업 준비", sub:[
      { to:"/startup",      name:"창업 준비 한눈에" },
      { to:"/g/startup",    name:"아이템 · 행정 · 자금" },
      { to:"/g/location",   name:"상권 · 입지" },
      { to:"/g/build",      name:"인테리어 · 설비" },
      { to:"/tools/cost",   name:"창업 비용 계산" },
      { to:"/franchise",    name:"프랜차이즈" } ] },
  { to:"/operation", name:"매장 운영", sub:[
      { to:"/operation",            name:"운영 고민 해결" },
      { to:"/providers/marketing",  name:"매출 · 마케팅" },
      { to:"/providers/it",         name:"POS · 매장 시스템" },
      { to:"/providers/repair",     name:"시설 · 설비 수리" },
      { to:"/tools/bep",            name:"손익분기 계산" } ] },
  { to:"/transfer",  name:"매장 양도양수", sub:[
      { to:"/stores",          name:"매장 매물 찾기" },
      { to:"/assets",          name:"시설 · 장비 매물" },
      { to:"/sell",            name:"매물 등록", form:"sell", off:"/transfer?t=out", offName:"매장 넘기는 순서" },
      { to:"/transfer?t=in",   name:"매장 인수 순서" },
      { to:"/tools/premium",   name:"권리금 계산" } ] },
  { to:"/closure",   name:"폐업·철거", sub:[
      { to:"/closure",              name:"정리 방법 찾기" },
      { to:"/quote?mode=close&from=gnb", name:"매장 정리 상담", form:"close", off:"/closure#pick", offName:"정리 서비스 고르기" },
      { to:"/providers/demolish",   name:"철거" },
      { to:"/providers/restore",    name:"원상복구" },
      { to:"/c/process",            name:"폐업 절차" },
      { to:"/tools/closecost",      name:"폐업 예상비용" } ] },
  { to:"/providers", name:"전문가 상담", sub:[
      { to:"/providers",  name:"분야별 업체 찾기" },
      { to:"/quote",      name:"견적 · 상담 신청", form:"quote", off:"/intake", offName:"접수 안내" },
      { to:"/join",       name:"파트너 입점 안내" } ] },
  { to:"/content",   name:"정보·가이드", sub:[
      { to:"/content",  name:"이용 가이드" },
      { to:"/tools",    name:"계산도구 13개" },
      { to:"/support",  name:"지원사업 찾는 곳" },
      { to:"/faq",      name:"자주 묻는 질문" },
      { to:"/about",    name:"플랫폼 소개" } ] }
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

  var closedBar = (window.WOW_BIZ && WOW_BIZ.sosReady) ? "" :
    '<div role="status" class="hd-closed" style="background:var(--bg-sky,#EFF6FC);color:var(--navy,#0C3D70);'+
      'border-bottom:1px solid var(--line,#E2E8F0);text-align:center;padding:10px 16px;font-size:14px">'+
      '현재 견적 · 매물 등록 · 입점 · 로그인 접수를 받지 않습니다. '+
      '<span class="hd-closed-x">정보 · 계산도구 · 체크리스트는 그대로 이용하실 수 있습니다.</span></div>';
  return closedBar + '<header class="hd"><div class="w-wide hd-in">'+
    Logo() +
    '<nav class="gnb" id="gnb" aria-label="주요 메뉴">'+
      AM_GNB.map(function(m, i){
        return '<div class="gnb-i">'+
          '<a class="gnb-a" href="'+esc(m.to)+'" data-to="'+esc(m.to)+'">'+esc(m.name)+'</a>'+
          (m.sub && m.sub.length
            ? '<button class="gnb-x" type="button" aria-expanded="false" aria-controls="gnb-m-'+i+'" '+
                'aria-label="'+esc(m.name)+' 하위 메뉴" onclick="gnbOpen('+i+')">'+icon("chevd",16)+'</button>'+
              '<div class="gnb-m" id="gnb-m-'+i+'" role="group" aria-label="'+esc(m.name)+'">'+gnbSub(m.sub)+'</div>'
            : '')+
        '</div>';
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

      '<a class="btn btn-nv hd-cta hd-cta-off" href="/intake" data-cta="off">'+
        '접수 안내'+icon("arrow",16)+'</a>'+
      '<a class="btn btn-nv hd-cta hd-cta-on" href="/quote" data-to="/quote" data-cta="on" hidden>'+
        '<span class="hd-cta-w">무료 </span>견적 신청'+icon("arrow",16)+'</a>'+

      '<button class="hd-ic hd-mb" type="button" id="hdMb" aria-label="메뉴"'+
        ' aria-expanded="false" aria-controls="hdMenu" onclick="hdMenu()">'+
        icon("menu",22)+'</button>'+
    '</div>'+
    HeaderDrawer()+
  '</div></header>';
}

function gnbSub(L){
  return L.map(function(x){
    if(!x.form)
      return '<a href="'+esc(x.to)+'" data-to="'+esc(x.to)+'">'+esc(x.name)+'</a>';
    return '<a href="'+esc(x.to)+'" data-to="'+esc(x.to.split("?")[0] === "/quote" && x.form === "quote" ? "/quote" : x.to)+'" '+
        'data-cta="on" data-cta-form="'+esc(x.form)+'" hidden>'+esc(x.name)+'</a>'+
      '<a href="'+esc(x.off)+'" data-cta="off" data-cta-form="'+esc(x.form)+'">'+esc(x.offName || x.name)+'</a>';
  }).join("");
}

window.gnbOpen = function(i, on){
  els(".gnb-i").forEach(function(g, k){
    var b = g.querySelector(".gnb-x"); if(!b) return;
    var want = (k === i) ? (on === undefined ? b.getAttribute("aria-expanded") !== "true" : !!on) : false;
    b.setAttribute("aria-expanded", want ? "true" : "false");
    g.classList.toggle("open", want);
  });
};
if(!window.__gnbWired){
  window.__gnbWired = true;
  document.addEventListener("keydown", function(e){ if(e.key === "Escape") window.gnbOpen(-1, false); });
  document.addEventListener("click", function(e){
    if(!(e.target && e.target.closest && e.target.closest(".gnb-i"))) window.gnbOpen(-1, false);
  });
}

function HeaderDrawer(){

  return '<div class="hd-dw" id="hdMenu" hidden>'+
    '<nav class="hd-dw-g" aria-label="전체 메뉴">'+
      AM_GNB.map(function(m, i){
        if(!(m.sub && m.sub.length))
          return '<a href="'+esc(m.to)+'" data-to="'+esc(m.to)+'">'+esc(m.name)+icon("arrow",16)+'</a>';
        return '<div class="hd-dw-sec">'+
          '<div class="hd-dw-h"><a href="'+esc(m.to)+'" data-to="'+esc(m.to)+'">'+esc(m.name)+'</a>'+
            '<button type="button" class="hd-dw-x" aria-expanded="false" aria-controls="hd-dw-m-'+i+'" '+
              'aria-label="'+esc(m.name)+' 하위 메뉴 펼치기" onclick="hdDwOpen(this)">'+icon("chevd",18)+'</button></div>'+
          '<div class="hd-dw-m" id="hd-dw-m-'+i+'" hidden>'+gnbSub(m.sub)+'</div>'+
        '</div>';
      }).join("")+
      '<a href="/my">'+esc("내 기록")+icon("arrow",16)+'</a>'+
      '<a href="/join">'+esc("파트너 입점")+icon("arrow",16)+'</a>'+

      '<a href="/search">'+esc("통합검색")+icon("arrow",16)+'</a>'+
    '</nav>'+
  '</div>';
}

window.hdDwOpen = function(b){
  var m = document.getElementById(b.getAttribute("aria-controls")); if(!m) return;
  var on = b.getAttribute("aria-expanded") !== "true";
  b.setAttribute("aria-expanded", on ? "true" : "false");
  if(on) m.removeAttribute("hidden"); else m.setAttribute("hidden","");
  b.closest(".hd-dw-sec").classList.toggle("open", on);
};
window.hdMenu = function(open){
  var dw = document.getElementById("hdMenu"),
      bt = document.getElementById("hdMb");
  if(!dw || !bt) return;
  var on = (open === undefined) ? dw.hasAttribute("hidden") : !!open;
  if(on) dw.removeAttribute("hidden"); else dw.setAttribute("hidden","");
  bt.setAttribute("aria-expanded", on ? "true" : "false");
};

window.amQuoteOpen = function(){
  if(!(window.WOW_BIZ && WOW_BIZ.sosReady)) return Promise.resolve(false);
  if(typeof window.amAuthAsk !== "function") return Promise.resolve(false);
  return window.amAuthAsk().then(function(a){ return !!(a && a.quoteOpen); },
                                 function(){ return false; });
};

window.amIntakeOpen = function(form){
  form = form || "quote";
  if(!(window.WOW_BIZ && WOW_BIZ.sosReady)) return Promise.resolve(false);
  if(typeof window.amAuthAsk !== "function") return Promise.resolve(false);
  return window.amAuthAsk().then(function(a){
    return !!(a && a.intake && a.intake[form] === true); }, function(){ return false; });
};

function ctaTagLinks(){
  var cats = (window.AM_CLOSE_SCOPE && AM_CLOSE_SCOPE.cats) || [];
  els('#view a.btn[href^="/quote"], #view a.btn[href^="/sell"], #view a.btn[href^="/join"]').forEach(function(a){
    if(a.hasAttribute("data-cta") || a.hasAttribute("data-go-form")) return;
    var h = a.getAttribute("href") || "", f = "quote";
    if(h.indexOf("/sell") === 0) f = "sell";
    else if(h.indexOf("/join") === 0) f = "join";
    else {
      var q = {};
      (h.split("?")[1] || "").split("#")[0].split("&").forEach(function(kv){
        var p = kv.split("="); if(p[0]) q[p[0]] = decodeURIComponent(p[1] || ""); });
      if(q.mode === "close") f = "close";
      else if(q.side === "close" && q.c && cats.indexOf(String(q.c).split("/")[0]) >= 0){
        a.setAttribute("href", "/quote?mode=close&from=cat-" + String(q.c).replace(/[^a-z0-9]/gi, "-") +
          "&sv=" + encodeURIComponent(q.s ? q.c + "/" + q.s : q.c));
        f = "close";
      }
    }
    a.setAttribute("data-go-form", f);
  });
}
window.hdCtaPaint = hdCtaPaint;
function hdCtaPaint(){
  ctaTagLinks();

  var forms = { quote:1, close:1, sell:1, join:1 };
  els('[data-cta],[data-gate]').forEach(function(a){
    forms[a.getAttribute("data-cta-form") || a.getAttribute("data-gate") || "quote"] = 1; });
  Object.keys(forms).forEach(function(f){
    window.amIntakeOpen(f).then(function(open){
      els('[data-cta]').forEach(function(a){
        if((a.getAttribute("data-cta-form") || "quote") !== f) return;
        var mine = a.getAttribute("data-cta") === (open ? "on" : "off");
        if(mine) a.removeAttribute("hidden"); else a.setAttribute("hidden","");
      });
      els('[data-gate="'+f+'"]').forEach(function(b){

        b.disabled = !open || (b.id === "cq-go" && !!document.getElementById("cq-gu") &&
                                document.getElementById("cq-gu").value === "out");
      });
      document.documentElement.classList.toggle("iq-" + f, !!open);
    });
  });
}

function hdAuthPaint(){
  var box = document.getElementById("hdAuth");
  if(!box || typeof window.amAuthAsk !== "function") return;
  window.amAuthAsk().then(function(a){
    if(!a || !a.on){ box.setAttribute("hidden",""); box.innerHTML = ""; return; }
    box.removeAttribute("hidden");
    box.innerHTML = a.signedIn
      ? '<a class="hd-txt" href="/my">'+icon("user",18)+
          '<span>'+esc("내 계정")+'</span></a>'
      : '<a class="hd-txt" href="/my?next='+encodeURIComponent(window.location.pathname + window.location.search)+'">'+icon("user",18)+
          '<span>'+esc("로그인")+'</span></a>';

    var es = window.amAuthErrSay ? amAuthErrSay() : "";
    if(es && typeof window.toast === "function") toast(es);
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
  if(typeof window.gnbOpen === "function") window.gnbOpen(-1, false);

  var best = -1, bestN = 0;
  (window.AM_GNB || []).forEach(function(m, k){
    var n = (m.sub || []).some(function(x){ return x.to.split(/[?#]/)[0] === p && x.to.split(/[?#]/)[0] !== m.to; }) ? 2
          : (p === m.to || p.indexOf(m.to + "/") === 0) ? 1 : 0;
    if(n > bestN){ bestN = n; best = k; }
  });
  els("a.gnb-a", g).forEach(function(a, k){
    var to = a.getAttribute("data-to");
    var on = k === best;
    a.classList.toggle("on", on);
    if(on) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current");

    if(to === "/quote") a.setAttribute("href", gnbQuoteHref());
  });
}

function MobileNav(){
  return '<nav class="mnav" id="mnav" aria-label="아래 메뉴">'+
    MNAV.map(function(m){
      return '<a href="'+esc(m.to)+'" data-to="'+esc(m.to)+'">'+

        '<span class="mnav-i" data-ic="'+esc(m.icon)+'" aria-hidden="true">'+icon(m.icon,24)+'</span><span class="mnav-t">'+esc(m.name)+'</span></a>';
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

function ftWith(w, pair){
  if(typeof koWith === "function") return koWith(w, pair);
  var t = String(w || ""), c = t.charCodeAt(t.length - 1) - 0xAC00;
  return t + ((c >= 0 && c < 11172 && c % 28) ? pair.charAt(0) : pair.charAt(1));
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
        '<a class="btn btn-nv" href="/join" data-go-form="join">업체 입점하기'+icon("arrow",16)+'</a>'+
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

      '<p class="ft-role">'+esc(ftWith(brandName(),"은는"))+' 통신판매중개자이며 '+
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
  hdCtaPaint();
};

window.hdSearch = function(e){
  e.preventDefault();
  var el = $("hdQ"), v = ((el && el.value) || "").trim();
  if(!v){ toast("찾으실 것을 적어 주세요"); if(el) el.focus(); return false; }
  go("/search?q=" + encodeURIComponent(v));
  if(el) el.blur();
  return false;
};
