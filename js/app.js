/* ════════════════════════════════════════════════════════════════════
   라우터 · 메타 (§46 SEO)

   ⚠️ **주소는 진짜 경로입니다** (해시가 아닙니다). 해시 뒤는 서버로
   전송되지 않아서, 크롤러 눈에는 화면이 몇 개든 주소가 "/" 하나뿐입니다.
   ⚠️ `location.hash` 를 읽지 마세요. 늘 빈 문자열이라 **에러 없이 조용히
   틀린 답**을 돌려줍니다. `nowPath()` · `nowQS()` 를 쓰세요.

   ── 주소 얼개 (§46) ─────────────────────────────────────────────
   /                      두 선택 — 창업이냐 폐업이냐
   /startup               업종 고르기
   /startup/:industry     그 업종의 창업에 필요한 모든 것
   /closure               정리 방법 고르기
   /closure/:industry     그 업종의 폐업에 필요한 모든 것
   /providers             업체찾기 — 분류 고르기
   /providers/:cat        그 분류의 업체 (`?s=` 하위분류 · `?r=` 지역)
   /p/:id                 업체 상세
   /c/:cat                정보 · 매물 성격의 분류 (상권 · 절차 · 자금)
   /franchise             프랜차이즈 · /franchise/:cat · /f/:slug
   /stores                점포 · 상가 · 매장 양도
   /assets                시설 · 집기 · 재고
   /support               지원사업 · /content · /content/:slug
   /quote                 견적 요청   /join  업체 입점
   /my  /search  /about  /terms  /privacy

   ⚠️ **한 화면에 주소 하나.** `/providers/:cat` 은 업체를 찾는 분류만,
   `/c/:cat` 은 나머지만 받습니다. 둘 다 받으면 같은 내용이 두 주소로
   나가고 구글이 **둘 다 무시**합니다.

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
   씁니다. 화면마다 서로 달라야 합니다 — build-pages 가 겹치면 멈춥니다. */
var META = {
  "/":          ["창업에 필요한 모든 것, 폐업에 필요한 모든 것",
                 "장사를 시작하시나요, 정리하시나요. 업종과 지역만 고르시면 점포 · 인테리어 · 장비 · 프랜차이즈부터 매장 양도 · 철거 · 원상복구 · 폐업 신고까지 필요한 전문업체를 찾고 비교하고 견적받으실 수 있습니다."],
  "/startup":   ["창업 — 어떤 사업을 준비하세요?",
                 "업종만 고르시면 그 업종 창업에 실제로 필요한 것만 추려 드립니다. 점포 · 상권 · 인테리어 · 장비 · 가구 · POS · 공급 · 인허가 · 마케팅까지."],
  "/closure":   ["폐업 — 사업을 어떻게 정리하세요?",
                 "매장 양도 · 시설 집기 처분 · 재고 · 철거 · 원상복구 · 폐기물 · 폐업신고 · 계약 해지까지, 정리에 필요한 곳을 한곳에서 찾습니다."],
  "/providers": ["업체찾기",
                 "인테리어 · 철거 · 간판 · 주방설비 · POS · 세무 · 노무 · 청소까지. 지역과 업종에 맞는 업체를 비교하고 견적을 받으세요."],
  "/franchise": ["프랜차이즈",
                 "업종별 프랜차이즈 브랜드를 창업비 · 가맹비 · 권장 평수 · 모집지역으로 비교하고 창업 상담을 신청하실 수 있습니다."],
  "/stores":    ["점포 · 상가 · 매장 양도",
                 "지역 · 업종 · 평수 · 보증금 · 월세 · 권리금으로 찾습니다. 시설을 그대로 인수할 수 있는 매장도 함께 봅니다."],
  "/assets":    ["시설 · 집기 · 재고",
                 "정리하시는 사장님이 내놓은 주방장비 · 커피머신 · 가구 · POS · 운동기구 · 미용기기와 남은 재고를 찾습니다."],
  "/support":   ["자금 · 정부지원",
                 "창업자금 · 정책자금 · 폐업지원 · 철거비 지원까지, 조건에 맞으면 신청하실 수 있는 지원사업을 모읍니다."],
  "/content":   ["창업 · 폐업 정보",
                 "창업비용 · 철거비 · 원상복구 범위 · 권리금 · 사업자등록 · 폐업신고처럼 실제로 막히는 것만 정리합니다."],
  "/quote":     ["견적 요청",
                 "한 번만 적으시면 조건에 맞는 업체들에 같이 전달합니다. 받으신 제안을 한 화면에서 비교하세요."],
  "/join":      ["업체 입점하기",
                 "창업과 폐업을 준비하는 사장님이 직접 찾아옵니다. 지역과 전문 분야가 맞는 요청만 받아 보세요. 기본 입점은 무료입니다."],
  "/my":        ["MY",
                 "내 창업 · 내 폐업 진행 상황과 받은 견적, 저장한 업체를 한 화면에서 이어서 하실 수 있습니다."],
  "/search":    ["통합검색",
                 "업체 · 프랜차이즈 · 매장 · 시설장비 · 정보를 한 번에 찾습니다."],
  "/tools":     ["사장님 도구",
                 "창업비 정리표 · 월 고정비 · 손익분기 · 인건비율 · 신규 창업과 매장 인수 비교 · 폐업 체크리스트. 전부 무료입니다."],
  "/tools/cost":["창업비 정리표",
                 "빠뜨리기 쉬운 항목을 전부 늘어놓고, 실제로 받으신 견적을 적으면 합계와 아직 안 받은 칸을 보여 드립니다."],
  "/tools/fixed":["월 고정비 계산",
                 "팔리든 안 팔리든 나가는 돈을 더하고, 하루에 얼마를 벌어야 그것만이라도 맞는지 보여 드립니다."],
  "/tools/bep": ["손익분기 계산",
                 "고정비를 공헌이익률로 나눕니다. 본전이 되는 월 매출과 하루 매출, 하루 손님 수까지."],
  "/tools/labor":["인건비율 계산",
                 "매출 대비 인건비가 몇 퍼센트인지. 판정하지 않고 사장님 가게의 흐름을 보시게 합니다."],
  "/tools/vs":  ["신규 창업 vs 매장 인수",
                 "새로 만드는 것과 하던 가게를 받는 것. 들어가는 돈과 문 여는 시점을 나란히 놓습니다."],
  "/tools/close":["폐업 체크리스트",
                 "정리 순서대로 짚어 가며 빠뜨린 것을 찾습니다. 기한이 있는 것이 여럿입니다."],
  "/faq":       ["자주 묻는 것",
                 "돈이 드는지, 연락처가 업체에 바로 넘어가는지, 등록된 업체가 몇 곳인지 — 먼저 궁금해하시는 것들에 그대로 답했습니다."],
  "/about":     ["소개",
                 "무엇을 하고 무엇을 하지 않는지 적어 두었습니다. 저희는 중개자이고 거래 당사자가 아닙니다."],
  "/terms":     ["이용약관",
                 "중개 · 매칭 서비스 기준으로 쓴 이용약관입니다. 회사의 지위, 견적 · 상담의 처리, 업체와 이용자 사이의 책임 범위를 적어 두었습니다."],
  "/privacy":   ["개인정보처리방침",
                 "어떤 정보를 어떤 목적으로 얼마나 보관하는지, 업체에 연락처를 전달할 때 어떻게 다시 동의를 받는지 적어 두었습니다."]
};

/* 사람마다 내용이 다른 화면과 결과 화면은 검색에 올리지 않습니다 */
var NOINDEX = ["/my","/search","/quote"];

window.routeInfo = function(path){
  var r = { ok:true, title:"", desc:"", canon:null,
            noindex: NOINDEX.indexOf(path) >= 0, view:null };
  if(META[path]){ r.title = META[path][0]; r.desc = META[path][1]; }

  var VIEW = {
    /* ⚠️⚠️ **`/` 가 곧 서비스 메인입니다** (2026-10-01 지시서 §1 · §29).
       중간 소개 화면(Intro · Splash · Gateway)을 다시 끼우지 마세요.
       옛 주소 `/home` 은 `vercel.json` 이 308 로 여기 보냅니다 —
       화면이 아니라 **안 깨지라고 남겨 둔 길**입니다. */
    "/":          "main",
    "/startup":   "startup",
    "/closure":   "closure",
    "/providers": "providers",
    "/franchise": "franchise",
    "/stores":    "stores",
    "/assets":    "assets",
    "/support":   "support",
    "/content":   "contents",
    "/quote":     "quote",
    "/join":      "join",
    "/my":        "my",
    "/search":    "search",
    "/tools":      "tools",
    "/tools/cost": "tool-cost",
    "/tools/fixed":"tool-fixed",
    "/tools/bep":  "tool-bep",
    "/tools/labor":"tool-labor",
    "/tools/vs":   "tool-vs",
    "/tools/close":"tool-close",
    "/faq":       "faq",
    "/about":     "about",
    "/terms":     "terms",
    "/privacy":   "privacy"
  };
  if(VIEW[path]){ r.view = VIEW[path]; return r; }

  /* 업종별 창업 — /startup/cafe */
  var m = /^\/startup\/([a-z0-9-]+)$/.exec(path);
  if(m){
    var ind = (typeof amIndustry === "function") ? amIndustry(m[1]) : null;
    if(!ind){ r.ok = false; return r; }
    r.view = "startupIndustry"; r.industry = ind;
    r.title = ind.name + " 창업 — 필요한 모든 것";
    r.desc  = ind.name + " 창업에 실제로 필요한 것만 추렸습니다. " +
              "점포 · 상권 · 인테리어 · " + (ind.equip[0] ? ind.equip[0].name + " · " : "") +
              "가구 · POS · 인허가 · 마케팅까지 업체를 비교하고 견적을 받으세요.";
    return r;
  }
  /* 업종별 폐업 — /closure/restaurant */
  var mc = /^\/closure\/([a-z0-9-]+)$/.exec(path);
  if(mc){
    var ind2 = (typeof amIndustry === "function") ? amIndustry(mc[1]) : null;
    if(!ind2){ r.ok = false; return r; }
    r.view = "closureIndustry"; r.industry = ind2;
    r.title = ind2.name + " 폐업 — 정리에 필요한 모든 것";
    r.desc  = ind2.name + " 정리에 필요한 것을 순서대로 정리했습니다. " +
              "매장 양도 · 시설 집기 처분 · 재고 · 철거 · 원상복구 · 폐업신고까지.";
    return r;
  }
  /* 업체를 찾는 분류 — /providers/interior */
  var mp = /^\/providers\/([a-z0-9-]+)$/.exec(path);
  if(mp){
    var pc = (typeof amCat === "function") ? amCat(mp[1]) : null;
    if(!pc || pc.kind !== "provider"){ r.ok = false; return r; }
    r.view = "providerCat"; r.cat = pc;
    r.title = pc.name + " 업체찾기";
    r.desc  = pc.desc + " " + (pc.items||[]).slice(0,6).map(function(i){ return i.name; }).join(" · ") +
              " 전문업체를 지역과 업종으로 비교하실 수 있습니다.";
    return r;
  }
  /* 정보 · 매물 성격의 분류 — /c/area */
  var mcat = /^\/c\/([a-z0-9-]+)$/.exec(path);
  if(mcat){
    var cc = (typeof amCat === "function") ? amCat(mcat[1]) : null;
    if(!cc || cc.kind === "provider"){ r.ok = false; return r; }
    r.view = "cat"; r.cat = cc;
    r.title = cc.name;
    r.desc  = cc.desc + " " + (cc.items||[]).slice(0,6).map(function(i){ return i.name; }).join(" · ") + ".";
    return r;
  }
  /* 프랜차이즈 분류 — /franchise/cafe */
  var mf = /^\/franchise\/([a-z0-9-]+)$/.exec(path);
  if(mf){
    var fc = (typeof amFranchiseCat === "function") ? amFranchiseCat(mf[1]) : null;
    if(!fc){ r.ok = false; return r; }
    r.view = "franchiseCat"; r.fcat = fc;
    r.title = fc.name + " 프랜차이즈";
    r.desc  = fc.name + " 프랜차이즈 브랜드를 창업비 · 가맹비 · 권장 평수 · 모집지역으로 비교하고 창업 상담을 신청하실 수 있습니다.";
    return r;
  }
  /* 브랜드 상세 — /f/:slug */
  var mfd = /^\/f\/([a-z0-9-]+)$/.exec(path);
  if(mfd){
    var fr = (typeof amFranchise === "function") ? amFranchise(mfd[1]) : null;
    if(!fr){ r.ok = false; return r; }
    r.view = "franchiseOne"; r.fr = fr;
    r.title = fr.name; r.desc = fr.intro || "";
    return r;
  }
  /* 업체 상세 — /p/:id */
  var mpd = /^\/p\/([a-z0-9-]+)$/.exec(path);
  if(mpd){
    var pv = (typeof amProvider === "function") ? amProvider(mpd[1]) : null;
    if(!pv){ r.ok = false; return r; }
    r.view = "providerOne"; r.provider = pv;
    r.title = pv.name; r.desc = pv.intro || "";
    return r;
  }
  /* 글 하나 — /content/:slug */
  var mct = /^\/content\/([a-z0-9-]+)$/.exec(path);
  if(mct){
    var ct = (typeof amContent === "function") ? amContent(mct[1]) : null;
    if(!ct){ r.ok = false; return r; }
    r.view = "content"; r.content = ct;
    r.title = ct.title; r.desc = ct.lead;
    return r;
  }

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
/* 이 화면이 창업 쪽인가 폐업 쪽인가 — 아니면 어느 쪽도 아닌가 */
function sideOf(r){
  if(r.view === "startup" || r.view === "startupIndustry") return "side-start";
  if(r.view === "closure" || r.view === "closureIndustry") return "side-close";
  /* 글 하나(/content/:slug)는 **그 글이 어느 쪽 것인지**를 따릅니다.
     창업 화면에서 초록 카드를 눌러 들어갔는데 글이 파랑으로 뜨면
     같은 사이트로 안 읽힙니다. side:"both" 인 글은 한쪽으로
     물들이지 않습니다 — 양쪽 다 보는 글이기 때문입니다. */
  if(r.content && r.content.side === "start") return "side-start";
  if(r.content && r.content.side === "close") return "side-close";
  /* 분류 화면은 그 분류가 어느 쪽 것인지를 따릅니다 */
  var k = r.cat && (r.cat.key || r.cat);
  if(k && window.amCatSide){
    var s = amCatSide(k);
    if(s === "start") return "side-start";
    if(s === "close") return "side-close";
  }
  return "";
}

/* ── 구간 바탕이 연달아 같지 않게 (§21) ──────────────────────────────
   ⚠️⚠️ **바탕을 함수마다 손으로 적으면 반드시 어긋납니다.** 구간은
   데이터에 따라 통째로 빠지고(ReadBand 는 맞는 글이 없으면 ""),
   업종마다 개수가 달라집니다 — 그래서 이웃이 바뀝니다. 실제로
   `/startup` 에서 **흰 구간이 셋 연달아** 나와 한 덩어리로 읽혔고,
   업종 화면에서는 웜 화이트 두 쌍이 붙어 있었습니다.

   그래서 **그린 다음에 차례를 보고** 겹치는 것만 다음 바탕으로
   밀어 줍니다. 각자 정해 둔 바탕은 겹치지 않는 한 그대로 둡니다 —
   메인(`/`)은 지시서가 차례를 정해 두었고 겹치는 데가 없어서
   아무것도 안 바뀝니다.

   ⚠️ **묶음으로 봅니다.** 웜 화이트(`--bg` #FDFBF7)와 크림
   (`--bg-cream` #FCFAF6)은 ΔE 0.35 라 사람 눈에 같은 색입니다 —
   클래스 이름만 보면 "다르다" 로 빠집니다.
   ⚠️ 돌려 쓰는 셋은 서로 ΔE 2.5 이상입니다 (흰 ↔ 회 3.12 ·
   회 ↔ 웜 3.68 · 웜 ↔ 흰 2.53). 바꾸시려면 셋을 다시 재 보세요.
   `check.js` 가 화면마다 실제로 그려진 색으로 다시 봅니다. */
var TONE_CLS = { white:"sec-white", gray:"sec-gray", warm:"" };
function toneGroup(e){
  var c = " " + (e.className || "") + " ";
  if(c.indexOf(" sec-white ") >= 0) return "white";
  if(c.indexOf(" sec-gray ")  >= 0) return "gray";
  if(c.indexOf(" sec-ivory ") >= 0) return "ivory";
  if(c.indexOf(" sec-start ") >= 0) return "mint";
  if(c.indexOf(" sec-blue ")  >= 0) return "sky";
  /* 크림과 "바탕 안 준 구간" 은 같은 묶음입니다 (ΔE 0.35) */
  return "warm";
}
function paintTones(){
  var v = $("view"); if(!v) return;
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
    case "startup":         html = PageStartup();                   break;
    case "startupIndustry": html = PageStartupIndustry(r.industry); break;
    case "closure":         html = PageClosure();                   break;
    case "closureIndustry": html = PageClosureIndustry(r.industry);  break;
    case "providers":       html = PageProviders();                 break;
    case "providerCat":     html = PageProviderCat(r.cat);          break;
    case "providerOne":     html = PageProviderOne(r.provider);     break;
    case "cat":             html = PageCat(r.cat);                  break;
    case "franchise":       html = PageFranchise();                 break;
    case "franchiseCat":    html = PageFranchiseCat(r.fcat);        break;
    case "franchiseOne":    html = PageFranchiseOne(r.fr);          break;
    case "stores":          html = PageStores();                    break;
    case "assets":          html = PageAssets();                    break;
    case "support":         html = PageSupport();                   break;
    case "contents":        html = PageContents();                  break;
    case "content":         html = PageContent(r.content);          break;
    case "quote":           html = PageQuote();                     break;
    case "join":            html = PageJoin();                      break;
    case "my":              html = PageMy();                        break;
    case "search":          html = PageSearch();                    break;
    case "tools":           html = PageTools();                     break;
    case "tool-cost":       html = PageToolCost();                  break;
    case "tool-fixed":      html = PageToolFixed();                 break;
    case "tool-bep":        html = PageToolBep();                   break;
    case "tool-labor":      html = PageToolLabor();                 break;
    case "tool-vs":         html = PageToolVs();                    break;
    case "tool-close":      html = PageToolClose();                 break;
    case "faq":             html = PageFaq();                       break;
    case "about":           html = PageAbout();                     break;
    case "terms":           html = PageTerms();                     break;
    case "privacy":         html = PagePrivacy();                   break;
    default:                return notFound(path);
  }

  /* ⚠️ 창업 쪽 화면은 초록, 폐업 쪽 화면은 주황으로 **통째로** 물들입니다.
     규칙을 수십 개 고치는 대신 `--blue` 계열 변수를 이 안에서만 다시
     정의합니다 — 강조색이 전부 그 변수를 거치기 때문입니다 (css/pages.css).
     ⚠️ 헤더 · 푸터는 `#view` 밖이라 그대로 남습니다. 거기까지 물들면
     화면마다 머리가 바뀌어 한 사이트로 안 읽힙니다. */
  $("view").className = sideOf(r);
  $("view").innerHTML = html;
  paintTones();
  paintMeta(r);
  paintChrome();
  initReveal();
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

function notFound(path){
  $("view").innerHTML =
    '<div class="w pad-pg">'+
      '<p class="eyebrow">404</p>'+
      '<h1 class="pg-h1">찾으시는 페이지가 없습니다.</h1>'+
      '<p class="pg-lead">주소가 바뀌었을 수 있습니다. 창업과 폐업 둘 중 '+
        '하나를 고르시면 거기서 다시 찾으실 수 있습니다.</p>'+
      '<div class="row-cta">'+
        '<a class="btn btn-b btn-lg" href="/startup">창업 시작하기'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-o btn-lg" href="/closure">폐업 시작하기</a>'+
      '</div>'+
    '</div>';
  document.title = "찾을 수 없습니다 · " + ((window.AM_BRAND||{}).name || "");
  paintChrome();
  try{ console.warn("[router] 알 수 없는 주소: "+path); }catch(e){}
}

/* ── 메타 ──────────────────────────────────────────────────── */
function paintMeta(r){
  var B = window.AM_BRAND || {};
  var site = (B.name || "") + " · " + (B.sub || "");
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
  mountChrome();
  /* ⚠️ 붙박이 헤더가 처음부터 그림자를 달고 있으면 맨 위에서 화면이
     두 겹으로 보입니다. **내려가기 시작한 뒤에만** 띄웁니다.
     ⚠️ passive:true — 스크롤마다 도는 손이라 빼면 스크롤이 끕끕해집니다. */
  var root = document.documentElement;
  function onScroll(){ root.classList.toggle("sc", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive:true });
  onScroll();
  initReveal();
  render();
});

/* ── 스크롤하면 나타나는 것 ────────────────────────────────────
   `data-rv` 를 단 요소가 화면에 들어오면 `.rv-on` 이 붙습니다.

   ⚠️ **과하게 쓰지 마세요.** 모든 것이 움직이면 아무것도 안 움직이는
   것과 같고, 손님은 스크롤할 때마다 기다리게 됩니다.
   ⚠️ 움직임을 싫어하는 설정이거나 IntersectionObserver 가 없으면
   **바로 보여 줍니다.** 안 보이는 채로 남으면 그건 고장입니다.
   ⚠️ 차례(`--rvd`)는 인라인으로 넣지 마세요 — build-pages 의 CSS 변수
   검사가 인라인 값을 못 봐서 "정의되지 않은 변수" 로 멈춥니다. */
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
/* ⚠️ `els()` 는 components/base.js 것입니다. 이름이 겹치는 지역 변수를
   쓰다 세 번 조용히 깨졌으므로 따로 둡니다. */
function els2(sel){ return [].slice.call(document.querySelectorAll(sel)); }
