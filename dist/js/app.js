

var ORIGIN = "https://storeway.co.kr";
var RT = { keepScroll:false };

window.nowPath = function(){
  return location.pathname.replace(/\/index\.html$/,"/").replace(/(.)\/+$/,"$1") || "/";
};
window.nowQS = function(k){
  var m = new RegExp("[?&]"+k+"=([^&#]*)").exec(location.search);
  return m ? decodeURIComponent(m[1].replace(/\+/g," ")) : "";
};

var META = {

  "/":          ["내 폰의 가치를 찾는 새로운 방법",
                 "직접 매입 · 전국 업체 경쟁입찰 · 검수를 마친 중고폰 구매를 " +
                 "한곳에서. 기종과 상태를 고르시면 견적을 나란히 놓고 비교하십니다."],

  "/quote":     ["견적 요청",
                 "한 번만 적으시면 조건에 맞는 업체들에 같이 전달합니다. 받으신 제안을 한 화면에서 비교하세요."],

  "/sell":      ["내 폰 팔기 — 기기 선택하고 견적 받기",
                 "쓰시던 휴대폰 · 태블릿 · 워치를 고르고 상태를 확인하시면, 바로 매입 신청을 넣거나 전국 전문업체 견적을 비교하실 수 있습니다."],
  "/shop":      ["내 폰 구매 — 검수를 마친 중고폰만",
                 "제조사 · 모델 · 용량 · 상태 등급으로 찾습니다. 기기마다 검수 항목과 상태를 밝히고, 등록된 재고만 냅니다."],
  "/bid":       ["최고가 경쟁입찰 — 전국 전문업체 견적 비교",
                 "기기를 한 번 등록하시면 조건이 맞는 전문업체들이 매입가를 제출합니다. 받으신 견적을 한 화면에서 나란히 놓고 고르세요."],
  "/track":     ["판매 진행 조회",
                 "접수번호와 연락처로 지금 어느 단계인지 확인하실 수 있습니다. 기기 발송 · 검수 · 정산까지 진행 상황을 그대로 냅니다."],
  "/guide":     ["이용 안내 — 판매부터 정산까지",
                 "기기 등록 · 상태 등급 기준 · 발송 · 검수 · 정산 차례와, 검수 결과가 다를 때 어떻게 되는지까지 적어 두었습니다."],
  "/repair":    ["수리 서비스 — 증상 알려 주시면 수리점을 찾아 드립니다",
                 "깨진 액정 · 배터리 · 충전 단자 · 침수까지, 증상과 기종을 알려 주시면 맞는 수리점을 찾아 연결해 드립니다. 고치는 것과 파는 것을 같이 견줘 보세요."],
  "/biz":       ["기업 · 수출 거래 — 대량 매입 · 해외 수출 문의",
                 "법인 · 대리점의 대량 매입, 기업 일괄 처분, 해외 수출을 상담으로 진행합니다. 수량과 기종을 알려 주시면 확인한 뒤 연락드립니다."],
  "/join":      ["업체 입점하기",
                 "창업과 폐업을 준비하는 사장님이 직접 찾아옵니다. 지역과 전문 분야가 맞는 요청만 받아 보세요. 기본 입점은 무료입니다."],
  "/my":        ["MY",
                 "판매 신청과 받은 견적, 저장해 두신 것을 한 화면에서 보십시오. 진행 조회는 접수번호로도 됩니다."],
  "/search":    ["통합검색",
                 "기종 · 중고폰 상품 · 업체 · 정보를 한 번에 찾습니다. 기종 이름을 그대로 치셔도 됩니다."],

  "/faq":       ["자주 묻는 것",
                 "돈이 드는지, 연락처가 업체에 바로 넘어가는지, 등록된 업체가 몇 곳인지 — 먼저 궁금해하시는 것들에 그대로 답했습니다."],
  "/terms":     ["이용약관",
                 "중개 · 매칭 서비스 기준으로 쓴 이용약관입니다. 회사의 지위, 견적 · 상담의 처리, 업체와 이용자 사이의 책임 범위를 적어 두었습니다."],
  "/privacy":   ["개인정보처리방침",
                 "어떤 정보를 어떤 목적으로 얼마나 보관하는지, 업체에 연락처를 전달할 때 어떻게 다시 동의를 받는지 적어 두었습니다."]
};

var NOINDEX = ["/my","/search","/quote","/track"];

function amNoIndex(p2){
  if(NOINDEX.indexOf(p2) >= 0) return true;

  return false;
}

window.routeInfo = function(path){
  var r = { ok:true, title:"", desc:"", canon:null,
            noindex: amNoIndex(path), view:null };
  if(META[path]){ r.title = META[path][0]; r.desc = META[path][1]; }

  var VIEW = {

    "/":          "main",
    "/quote":     "quote",
    "/sell":      "phone-sell",
    "/shop":      "phone-shop",
    "/bid":       "phone-bid",
    "/track":     "phone-track",
    "/guide":     "phone-guide",
    "/biz":       "phone-biz",
    "/repair":    "phone-repair",
    "/join":      "join",
    "/my":        "my",
    "/search":    "search",
    "/faq":       "faq",
    "/terms":     "terms",
    "/privacy":   "privacy"
  };
  if(VIEW[path]){ r.view = VIEW[path]; return r; }

  var mdp = /^\/d\/([a-zA-Z0-9-]+)$/.exec(path);
  if(mdp){
    var one = (typeof amShopOne === "function") ? amShopOne(mdp[1]) : null;
    if(!one){ r.ok = false; return r; }
    r.view = "product"; r.product = one;
    var nm = (typeof amShopName === "function") ? amShopName(one.it) : "";
    var gg = (typeof amGrade === "function") ? amGrade(one.it.grade) : null;
    r.title = (one.sample ? "[예시] " : "") + nm + " 중고 — 검수 결과 그대로";
    r.desc  = (one.sample
        ? "⚠️ 실제 상품이 아니라 화면 예시입니다. "
        : "") +
      nm + (one.it.color ? " · " + one.it.color : "") +
      (gg ? " · " + gg.name : "") +
      (one.it.batt ? " · 배터리 " + one.it.batt + "%" : "") +
      ". 외관 등급 · 배터리 상태 · 검수 항목 · 구성품 · 보증 조건을 " +
      "그대로 밝힙니다.";
    r.noindex = !!one.sample;
    return r;
  }

  r.ok = false; return r;
};

window.go = function(url, opt){
  opt = opt || {};
  if(opt.keepScroll) RT.keepScroll = true;

  try { history.replaceState({ y: Math.round(window.scrollY || 0) }, ""); } catch(e){}
  history.pushState(null, "", url);
  render();
};

document.addEventListener("click", function(ev){
  if(ev.defaultPrevented || ev.button !== 0) return;
  if(ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
  var a = ev.target.closest && ev.target.closest("a[href]");
  if(!a) return;
  if(a.target && a.target !== "_self") return;
  if(a.hasAttribute("download")) return;
  var href = a.getAttribute("href") || "";
  if(!/^\//.test(href)) return;
  if(/^\/api\//.test(href)) return;
  ev.preventDefault();
  if(href === location.pathname + location.search) return;

  go(href, { keepScroll: a.hasAttribute("data-keep") });
});

window.addEventListener("popstate", function(e){
  var y = e && e.state && typeof e.state.y === "number" ? e.state.y : null;
  if(y !== null) RT.keepScroll = true;
  render();
  if(y !== null) setTimeout(function(){ window.scrollTo(0, y); }, 0);
});

function sideOf(r){

  if(r.view === "phone-sell" || r.view === "phone-shop" ||
     r.view === "phone-bid"  || r.view === "phone-track" ||
     r.view === "phone-guide" ||

     r.view === "phone-biz" || r.view === "phone-repair" ||

     r.view === "join" || r.view === "faq" ||

     r.view === "search" || r.view === "my") return "pw-skin";
  if(r.view === "startup" || r.view === "startupIndustry") return "side-start";
  if(r.view === "closure" || r.view === "closureIndustry") return "side-close";

  if(r.view === "operation" || r.view === "acquisition") return "";

  if(r.stage){
    if(r.stage.side === "start") return "side-start";
    if(r.stage.side === "close") return "side-close";
    return "";
  }

  if(r.content && r.content.side === "start") return "side-start";
  if(r.content && r.content.side === "close") return "side-close";

  var k = r.cat && (r.cat.key || r.cat);
  if(k && window.amCatSide){
    var s = amCatSide(k);
    if(s === "start") return "side-start";
    if(s === "close") return "side-close";
  }
  return "";
}

var TONE_CLS = { white:"sec-white", gray:"sec-gray", warm:"" };
function toneGroup(e){
  var c = " " + (e.className || "") + " ";
  if(c.indexOf(" sec-white ") >= 0) return "white";
  if(c.indexOf(" sec-gray ")  >= 0) return "gray";
  if(c.indexOf(" sec-ivory ") >= 0) return "ivory";
  if(c.indexOf(" sec-start ") >= 0) return "mint";
  if(c.indexOf(" sec-blue ")  >= 0) return "sky";

  if(c.indexOf(" sec-close ") >= 0) return "peach";

  if(c.indexOf(" sec-calc ")  >= 0) return "lav";
  if(c.indexOf(" sec-step ")  >= 0) return "step";

  return "warm";
}
function paintTones(){
  var v = $("view"); if(!v) return;

  if(document.documentElement.classList.contains("ivh")) return;
  var sec = [].slice.call(v.children).filter(function(e){
    return e.tagName === "SECTION"; });
  for(var i = 1; i < sec.length; i++){
    var prev = toneGroup(sec[i-1]);
    if(toneGroup(sec[i]) !== prev) continue;
    var next = (i + 1 < sec.length) ? toneGroup(sec[i+1]) : "";
    var pick = ["white","gray","warm"].filter(function(t){
      return t !== prev && t !== next; })[0]
      || ["white","gray","warm"].filter(function(t){ return t !== prev; })[0];
    sec[i].classList.remove("sec-white","sec-gray","sec-cream");
    if(TONE_CLS[pick]) sec[i].classList.add(TONE_CLS[pick]);
  }
}

function render(){
  var path = nowPath();
  var r = routeInfo(path, {});
  if(!r.ok) return notFound(path);

  var html;
  switch(r.view){
    case "main":            html = PageMain();                      break;
    case "quote":           html = PageQuote();                     break;
    case "phone-sell":      html = PageSell();                      break;
    case "phone-shop":      html = PageShop();                      break;
    case "phone-bid":       html = PageBid();                       break;
    case "phone-track":     html = PageTrack();                     break;
    case "phone-guide":     html = PageGuide();                     break;
    case "phone-biz":       html = PageBiz();                       break;
    case "phone-repair":    html = PageRepair();                    break;
    case "product":         html = PageProduct(r.product);          break;
    case "join":            html = PageJoin();                      break;
    case "my":              html = PageMy();                        break;
    case "search":          html = PageSearch();                    break;
    case "faq":             html = PageFaq();                       break;
    case "terms":           html = PageTerms();                     break;
    case "privacy":         html = PagePrivacy();                   break;
    default:                return notFound(path);
  }

  document.documentElement.classList.toggle("ivh", nowPath() === "/");
  $("view").className = sideOf(r);
  $("view").innerHTML = html;
  paintTones();
  paintMeta(r);
  paintChrome();
  initReveal();

  if(nowPath() === "/my" && typeof window.myLoadDb === "function") window.myLoadDb();

  if(nowPath() === "/track" && typeof window.pwTrackInit === "function") window.pwTrackInit();

  if(typeof window.pickPaint === "function") window.pickPaint();

  if(typeof window.amStateSync === "function") window.amStateSync();

  if(nowPath() === "/quote" && typeof window.quoteDraftPaint === "function")
    window.quoteDraftPaint();
  if(!RT.keepScroll) window.scrollTo(0,0);
  RT.keepScroll = false;
}
window.render = render;

window.rerender = function(keepScroll){
  if(keepScroll) RT.keepScroll = true;
  render();
};

function notFound(path){
  $("view").innerHTML =
    '<div class="w pad-pg">'+
      '<p class="eyebrow">404</p>'+
      '<h1 class="pg-h1">찾으시는 페이지가 없습니다.</h1>'+
      '<p class="pg-lead">주소가 바뀌었을 수 있습니다. 팔거나 사시려는 것을 '+
        '고르시면 거기서 다시 찾으실 수 있습니다.</p>'+
      '<div class="row-cta">'+
        '<a class="btn btn-b btn-lg" href="/sell">내 폰 팔기'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-o btn-lg" href="/shop">중고폰 구매</a>'+
      '</div>'+
    '</div>';
  document.title = "찾을 수 없습니다 · " + ((window.AM_BRAND||{}).name || "");
  paintChrome();
  try{ console.warn("[router] 알 수 없는 주소: "+path); }catch(e){}
}

function paintMeta(r){
  var B = window.AM_BRAND || {};

  document.title = window.amTitle(r.title || "", r.canon || nowPath());
  setMeta("name","description", r.desc || META["/"][1]);
  setMeta("property","og:title", document.title);
  setMeta("property","og:description", r.desc || META["/"][1]);
  setMeta("property","og:url", ORIGIN + (r.canon || nowPath()));

  var c = document.querySelector('link[rel="canonical"]');
  if(!c){ c = document.createElement("link"); c.rel = "canonical"; document.head.appendChild(c); }
  c.href = ORIGIN + (r.canon || nowPath());

  var rb = document.querySelector('meta[name="robots"]');
  if(r.noindex){
    if(!rb){ rb = document.createElement("meta"); rb.name = "robots"; document.head.appendChild(rb); }
    rb.content = "noindex, follow";
  }else if(rb){ rb.remove(); }
}
function setMeta(attr, key, val){
  var el = document.querySelector("meta["+attr+'="'+key+'"]');
  if(!el){ el = document.createElement("meta"); el.setAttribute(attr,key); document.head.appendChild(el); }
  el.setAttribute("content", val || "");
}

try{
  if("scrollRestoration" in history) history.scrollRestoration = "manual";
}catch(e){}

document.addEventListener("DOMContentLoaded", function(){
  mountChrome();

  var root = document.documentElement;
  function onScroll(){ root.classList.toggle("sc", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive:true });
  onScroll();
  initReveal();
  render();
});

var RV_IO = null;
function initReveal(){
  var list = els2("[data-rv]");
  if(!list.length) return;
  var reduce = false;
  try{ reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; }catch(e){}
  if(reduce || typeof IntersectionObserver !== "function"){
    list.forEach(function(e){ e.classList.add("rv-on"); });
    return;
  }
  if(!RV_IO){
    RV_IO = new IntersectionObserver(function(xs){
      xs.forEach(function(x){
        if(!x.isIntersecting) return;
        x.target.classList.add("rv-on");
        RV_IO.unobserve(x.target);
      });
    }, { rootMargin:"0px 0px -12% 0px", threshold:0.12 });
  }
  list.forEach(function(e){
    if(e.classList.contains("rv-on")) return;
    RV_IO.observe(e);
  });
}

function els2(sel){ return [].slice.call(document.querySelectorAll(sel)); }
