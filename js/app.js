/* ════════════════════════════════════════════════════════════════════
   라우터 · 메타 — 지시서 40번

   ⚠️ **주소는 진짜 경로입니다** (해시가 아닙니다). 해시 뒤는 서버로
   전송되지 않아서, 크롤러 눈에는 화면이 몇 개든 주소가 "/" 하나뿐입니다.
   ⚠️ `location.hash` 를 읽지 마세요. 늘 빈 문자열이라 **에러 없이 조용히
   틀린 답**을 돌려줍니다. `nowPath()` · `nowQS()` 를 쓰세요.

   화면을 새로 만들 때 고치는 곳은 네 군데입니다:
   META → routeInfo() → render() 의 switch → build-pages.js 의 allRoutes().
   ════════════════════════════════════════════════════════════════════ */

var ORIGIN = "https://aboutmeat.co.kr";
var RT = { keepScroll:false };

window.nowPath = function(){
  return location.pathname.replace(/\/index\.html$/,"/").replace(/(.)\/+$/,"$1") || "/";
};
window.nowQS = function(k){
  var m = new RegExp("[?&]"+k+"=([^&#]*)").exec(location.search);
  return m ? decodeURIComponent(m[1].replace(/\+/g," ")) : "";
};

/* 제목과 **설명**. 설명을 비우면 구글이 본문에서 아무 문장이나 가져다
   씁니다 (지시서 41번: SEO · Metadata). */
var META = {
  "/":         ["고기 장사, 뭐가 고민이세요?",
                "고깃집·정육점 사장님의 문제 해결 플랫폼. 창업·운영·원가·시설·매출·확장·정리까지 상황만 말씀해주시면 해결방법부터 적합한 업체 비교까지 도와드립니다."],
  "/sos":      ["사장님 SOS",
                "지금 겪고 계신 문제를 그대로 적어 주세요. 무엇이 필요한 일인지 정리해 드리고, 조건에 맞는 업체를 찾아 드립니다. 무료입니다."],
  "/start":    ["고깃집 창업 프로젝트",
                "상권·점포·인테리어·덕트·주방·냉장·정육장비·인허가까지 20가지를 순서대로 정리해 드립니다."],
  "/start/cost":["창업비 정리표",
                "고깃집 창업비에서 빠뜨리기 쉬운 항목을 전부 늘어놓고, 받으신 견적을 넣어 합계와 빈 칸을 정리해 드립니다."],
  "/check":    ["무료 사업진단",
                "육류원가·거래처·인건비·고정비·시설·메뉴·마케팅·위생 8가지로, 지금 무엇을 파악하고 계시고 무엇이 비어 있는지 정리해 드립니다."],
  "/partners": ["업체 찾기",
                "업체 명단을 드리지 않습니다. 필요한 일을 고르시면 지역·예산·일정에 맞는 곳을 최대 세 곳 찾아 견적을 받아 드립니다."],
  "/request":  ["견적 요청",
                "덕트·인테리어·육류공급 등 필요한 일을 적어 주시면 조건에 맞는 업체 견적을 받아 드립니다."],
  "/lab":      ["사장님 연구소",
                "창업·운영·원가·고기·시설·마케팅·세무노무까지, 고기 장사에 필요한 것만 정리했습니다."],
  "/partner":  ["파트너 안내",
                "고깃집·정육점을 아는 업체를 찾고 있습니다. 조건에 맞는 요청만 보내 드립니다."],
  "/partner/apply":["파트너 등록", "ABOUTMEAT 파트너로 등록하고 조건에 맞는 요청을 받아 보세요."],
  "/my":       ["MY BUSINESS",
                "진단 결과·창업 진행·창업비·견적 비교·읽던 글을 한 화면에서 이어서 하실 수 있습니다."],
  "/problems": ["고민별 해결방법",
                "고깃집·정육점에서 자주 나오는 고민을 직접 확인할 것과 업체에 물어볼 것으로 정리했습니다. 가입 없이 읽으시면 됩니다."],
  "/search":   ["검색",
                "글·서비스·화면을 한 번에 찾습니다. 못 찾으시면 그대로 적어서 물어보시면 됩니다."],
  "/tools":    ["사장님 도구",
                "수율 원가·손익분기·창업비·견적 비교·사업진단. 사장님 가게 숫자로 바로 확인하실 수 있습니다. 가입 없이 무료입니다."],
  "/tools/yield":["수율 원가 계산",
                "원육을 손질하고 나면 원가가 달라집니다. 매입 단가와 손질 전후 무게로 실제 1kg 원가와 1인분 원가를 냅니다."],
  "/tools/bep": ["손익분기 계산",
                "고정비와 매출 대비 비율을 적으시면 한 달에 얼마를 팔아야 본전인지, 하루로 나누면 얼마인지 나옵니다."],
  "/quotes":   ["견적 비교",
                "받으신 견적을 나란히 놓고 금액·기간·A/S·포함 범위를 비교하고, 빠뜨린 질문을 확인합니다."],
  "/login":    ["로그인", "ABOUTMEAT 로그인."],
  "/signup":   ["회원가입", "ABOUTMEAT 회원가입."],
  "/about":    ["ABOUTMEAT 소개",
                "고깃집·정육점 사장님이 장사하다 막히면 물어보는 곳입니다. 무엇을 하고 무엇을 하지 않는지 적어 두었습니다."],
  "/terms":    ["이용약관", "ABOUTMEAT 서비스 이용약관입니다."],
  "/privacy":  ["개인정보처리방침", "ABOUTMEAT 개인정보처리방침입니다."]
};

/* 사람마다 내용이 다른 화면과 결과 화면은 검색에 안 올립니다 */
var NOINDEX = ["/my","/login","/signup","/sos","/check/result","/quotes","/search"];

/* 아직 안 만든 화면 — 무엇을 하는 곳인지 적고 지금 할 수 있는 것을 줍니다.
   ⚠️ 빈 화면을 두지 마세요. 눌렀는데 아무것도 없으면 손님에게는
   고장으로 읽힙니다. */
var SOON = {
  "/login":    ["로그인",
                "회원 기능은 아직입니다. 다만 **로그인하지 않으셔도** 진단·창업 체크·창업비·견적 비교는 그대로 되고, 결과는 MY BUSINESS 에 남습니다."],
  "/signup":   ["회원가입",
                "회원 기능은 아직입니다. 가입하지 않으셔도 문의·견적 요청·진단이 전부 됩니다."]
};

/* 주소 → 무엇을 그릴지. build-pages.js 도 이 함수를 써서 메타를 뽑으므로
   여기만 고치면 화면과 정적 파일이 같이 따라옵니다. */
window.routeInfo = function(path, qs){
  var r = { ok:true, path:path, title:null, desc:null, canon:path,
            noindex: NOINDEX.indexOf(path) >= 0, view:null };
  var m = META[path];
  if(m){ r.title = m[0]; r.desc = m[1]; }

  if(path === "/"){ r.view = "home"; r.title = null; r.desc = META["/"][1]; return r; }

  var VIEW = {
    "/sos":           "sos",
    "/check":         "check",
    "/start":         "start",
    "/start/cost":    "cost",
    "/partners":      "partners",
    "/request":       "request",
    "/partner":       "partner",
    "/partner/apply": "partnerApply",
    "/about":         "about",
    "/lab":           "lab",
    "/my":            "my",
    "/quotes":        "quotes",
    "/tools":         "tools",
    "/tools/yield":   "yield",
    "/tools/bep":     "bep",
    "/search":        "search",
    "/problems":      "problems",
    "/terms":         "terms",
    "/privacy":       "privacy"
  };
  if(VIEW[path]){ r.view = VIEW[path]; return r; }

  /* 글 하나 — 주소 안의 주소입니다. 제목·설명을 글에서 가져옵니다.
     ⚠️ 여기서 제목을 안 채우면 검색 결과에 글마다 같은 줄이 나갑니다. */
  var m = /^\/lab\/([a-z0-9-]+)$/.exec(path);
  if(m){
    var post = (typeof wowPost === "function") ? wowPost(m[1]) : null;
    if(post){
      r.view = "post"; r.post = post;
      r.title = post.title; r.desc = post.lead;
      return r;
    }
    r.ok = false; return r;      /* 없는 글은 404 — 빈 화면을 두지 않습니다 */
  }
  /* 문제별 해결 가이드 — 흐름의 **가운데 두 칸**(이해 · 해결방법)입니다.
     ⚠️ 제목·설명을 가이드에서 가져옵니다. 여기서 안 채우면 검색 결과에
     열 줄이 똑같은 말을 합니다. */
  var gm = /^\/problem\/([a-z0-9-]+)$/.exec(path);
  if(gm){
    var gd = (typeof wowGuide === "function") ? wowGuide(gm[1]) : null;
    if(gd){
      r.view = "problem"; r.guide = gd;
      r.title = gd.h1; r.desc = gd.lead;
      return r;
    }
    r.ok = false; return r;    /* 없는 분류는 404 — 빈 화면을 두지 않습니다 */
  }

  if(SOON[path]){ r.view = "soon"; r.soon = SOON[path]; r.noindex = true; return r; }

  r.ok = false; return r;
};

/* ── 화면 옮기기 ────────────────────────────────────────────
   ⚠️ location.href 를 쓰면 페이지가 통째로 새로 뜹니다. */
window.go = function(url, opt){
  opt = opt || {};
  if(opt.keepScroll) RT.keepScroll = true;
  history.pushState(null, "", url);
  render();
};

/* 사이트 안 링크는 새로고침 없이 넘깁니다.
   ⚠️ 새 탭 · 다운로드 · 외부 링크 · /api · tel: · mailto: 는 안 건드립니다. */
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
  go(href);
});
window.addEventListener("popstate", function(){ render(); });

/* ── 그리기 ────────────────────────────────────────────────── */
function render(){
  var path = nowPath();
  var r = routeInfo(path, {});
  if(!r.ok) return notFound(path);

  var html;
  switch(r.view){
    case "home":         html = PageHome();          break;
    case "sos":          html = PageSos();           break;
    case "check":        html = PageCheck();         break;
    case "start":        html = PageStart();         break;
    case "cost":         html = PageCost();          break;
    case "partners":     html = PagePartners();      break;
    case "request":      html = PageRequest();       break;
    case "partner":      html = PagePartner();       break;
    case "partnerApply": html = PagePartnerApply();  break;
    case "about":        html = PageAbout();         break;
    case "lab":          html = PageLab();           break;
    case "my":           html = PageMy();            break;
    case "quotes":       html = PageQuotes();        break;
    case "tools":        html = PageTools();          break;
    case "yield":        html = PageYield();          break;
    case "bep":          html = PageBep();            break;
    case "search":       html = PageSearch();        break;
    case "post":         html = PagePost(r.post);    break;
    case "problem":      html = PageProblem(r.guide); break;
    case "problems":     html = PageProblems();      break;
    case "terms":        html = PageTerms();         break;
    case "privacy":      html = PagePrivacy();       break;
    case "soon":         html = PageSoon(r.soon);    break;
    default:             return notFound(path);
  }

  $("view").innerHTML = html;
  paintMeta(r);
  paintGnb(); paintMnav(); paintBiz();
  if(r.view === "home" && typeof askRotate === "function") askRotate();
  if(r.view === "post" && typeof labSeen === "function") labSeen(r.post.slug);
  if(!RT.keepScroll) window.scrollTo(0,0);
  RT.keepScroll = false;
}
window.render = render;

/* 같은 화면을 다시 그립니다. 목록에서 체크 하나 눌렀는데 맨 위로
   튀어 올라가면 사장님은 자기가 뭘 잘못 누른 줄 압니다. */
window.rerender = function(keepScroll){
  if(keepScroll) RT.keepScroll = true;
  render();
};

/* 아직 안 만든 화면 — 무엇을 할 곳인지 적고, 지금 할 수 있는 것을 줍니다 */
function PageSoon(s){
  /* ⚠️ 준비 중 화면이 **막다른 길이 되면 안 됩니다.** 무엇을 할 곳인지
     적고, 지금 할 수 있는 것을 반드시 같이 냅니다. */
  return '<div class="w soon">'+
    '<p class="eyebrow">준비 중</p>'+
    '<h1>'+esc(s[0])+'</h1>'+
    '<p class="soon-p">'+esc(s[1]).replace(/\*\*([^*]+)\*\*/g,"<b>$1</b>")+'</p>'+
    '<p class="soon-n">아직 열지 못했습니다. 그동안은 <b>바로 물어봐 주세요</b> — '+
      '같은 일을 사람이 직접 해 드립니다.</p>'+
    '<div class="row-cta">'+
      '<a class="btn btn-b btn-lg" href="/sos">무료로 물어보기'+icon("arrow",18)+'</a>'+
      '<a class="btn btn-o btn-lg" href="/my">MY BUSINESS 보기</a>'+
      CallButton("btn btn-o btn-lg","전화로 문의")+
    '</div>'+
  '</div>';
}

function notFound(path){
  $("view").innerHTML =
    '<div class="w soon">'+
      '<p class="eyebrow">404</p>'+
      '<h1>찾으시는 페이지가 없습니다.</h1>'+
      '<p class="soon-p">주소가 바뀌었을 수 있습니다.</p>'+
      '<div class="row-cta">'+
        '<a class="btn btn-b btn-lg" href="/">홈으로</a>'+
        '<a class="btn btn-o btn-lg" href="/sos">무료로 물어보기</a>'+
      '</div>'+
    '</div>';
  document.title = "찾을 수 없습니다 · ABOUTMEAT";
  paintGnb(); paintMnav(); paintBiz();
  try{ console.warn("[ABOUTMEAT] 알 수 없는 주소: "+path); }catch(e){}
}

/* ── 메타 ──────────────────────────────────────────────────── */
function paintMeta(r){
  var site = "ABOUTMEAT · 고기 사업자 문제해결";
  document.title = (r.title ? r.title + " · " : "") + site;
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

/* ── 시작 ──────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", function(){
  $("chrome-t").innerHTML = Header();
  $("chrome-b").innerHTML = Footer() + MobileNav() + FloatCta();
  /* 조금 내려가면 따라다니는 단추가 나타납니다.
     ⚠️ passive:true — 스크롤마다 도는 손이라 이걸 빼면 스크롤이 끕끕해집니다. */
  window.addEventListener("scroll", function(){
    var f = $("fab"); if(!f) return;
    f.classList.toggle("on", window.scrollY > 560);
  }, { passive:true });
  render();
});
