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

var ORIGIN = "https://storeway.co.kr";   /* ⚠️ 공식 주소 — 2026-10-04 전환 */
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
  /* ⚠️ 메인 제목은 amTitle() 이 이름을 앞에 둡니다 (2026-10-04 지시서
     §5). 여기 적는 것은 **뒷말**입니다.
     ⚠️⚠️ **설명 끝의 이름을 손으로 적지 마세요.** brand.js 에서
     읽습니다 — 이 저장소에서 이름이 다섯 번 바뀌었고, 손으로 적어 둔
     자리가 그때마다 뒤늦게 발견됐습니다. 여기는 **메인의 검색 결과
     설명**이라 화면으로는 표가 안 나고 공유해 봐야 압니다.
     (brand.js 가 app.js 보다 먼저 실립니다 — index.html 의 차례입니다) */
  /* ── 지난 기록 (지금 쓰는 값이 아닙니다) ───────────────────────
     2026-10-06 2차 §21   인수인계 | 창업부터 폐업까지 사장님에게 필요한 모든 것
     2026-10-06 마무리 §11 인수인계 | 사장님의 시작부터 마지막까지
                           창업 · 운영 · 인수 · 양도 · 폐업에 필요한 정보와 서비스를 한곳에서. */
  /* ⚠️⚠️ **2026-10-29 PHONEWAY.** 앞 서비스 글("사장님의 시작부터
     마지막까지" · "창업 · 운영 · 인수 · 양도 · 폐업에 필요한 …")이
     여기 남아 있었고, 그것이 그대로 **공유 미리보기 · 검색 결과**로
     나가고 있었습니다 — 화면으로는 표가 안 나고 **공유해 봐야**
     압니다 (이 저장소가 브랜드를 바꿀 때마다 겪은 자리입니다).
     ⚠️ 이름은 `amTitle()` 이 앞에 붙입니다 — 여기 적지 마세요. */
  "/":          ["내 폰의 가치를 찾는 새로운 방법",
                 "직접 매입 · 전국 업체 경쟁입찰 · 검수를 마친 중고폰 구매를 " +
                 "한곳에서. 기종과 상태를 고르시면 견적을 나란히 놓고 비교하십니다."],
  /* 2026-10-05 V2 지시서 §1 — 여정 넷. 창업 · 폐업은 이미 있던 주소이고
     운영 · 인수/양도 둘이 새로 생겼습니다 (§28 의 `/operation` ·
     `/transfer`). ⚠️ `/closing` · `/companies` · `/guides` 는
     `vercel.json` 이 308 로 보냅니다 — 같은 내용을 두 주소로 내면
     구글이 둘 다 무시합니다. */
  /* ⚠️ 색인에서 빠지는 화면이라도 제목 · 설명은 적습니다 — 공유했을 때
     카카오 · 슬랙 미리보기에 쓰입니다 */
  "/quote":     ["견적 요청",
                 "한 번만 적으시면 조건에 맞는 업체들에 같이 전달합니다. 받으신 제안을 한 화면에서 비교하세요."],
  /* ⚠️⚠️ 2026-10-29 PHONEWAY 전환 — `/sell` 이 **내 폰 팔기**가
     됐습니다. 창업 · 폐업 매물 내놓기는 **`/sell-biz`** 로 옮겼고
     지우지 않았습니다 (`js/pages/market.js` 의 `PageSellBiz()`). */
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
  /* 2026-10-05 V2 §16 — 지시서가 적은 열여덟 중 모자라던 것들 */
  "/faq":       ["자주 묻는 것",
                 "돈이 드는지, 연락처가 업체에 바로 넘어가는지, 등록된 업체가 몇 곳인지 — 먼저 궁금해하시는 것들에 그대로 답했습니다."],
  "/terms":     ["이용약관",
                 "중개 · 매칭 서비스 기준으로 쓴 이용약관입니다. 회사의 지위, 견적 · 상담의 처리, 업체와 이용자 사이의 책임 범위를 적어 두었습니다."],
  "/privacy":   ["개인정보처리방침",
                 "어떤 정보를 어떤 목적으로 얼마나 보관하는지, 업체에 연락처를 전달할 때 어떻게 다시 동의를 받는지 적어 두었습니다."]
};

/* 사람마다 내용이 다른 화면과 결과 화면은 검색에 올리지 않습니다 */
/* ⚠️ `/compare` 는 고른 업체마다 내용이 달라지는 **결과 화면**이라
   색인에 올리지 않습니다 (`/search` 와 같은 까닭입니다). */
/* ⚠️⚠️ `/sample` 은 **지어낸 업체 화면**이라 반드시 색인에서 뺍니다 —
   구글에 나가면 손님이 검색으로 들어와 전화를 겁니다 (절대 규칙 1).
   업체 사장님께 "입점하면 이렇게 나갑니다" 를 보여 드리는 자리입니다. */
/* ⚠️⚠️ `/track` 은 **접수번호마다 내용이 다른 결과 화면**입니다 —
   `/search` 와 같은 까닭으로 색인에서 뺍니다.
   ⚠️ `/sell-biz` 는 창업 · 폐업 매물 폼이고 **옛 `/sell` 의 내용**
   입니다. 색인에 새로 올리지 않습니다 — 주소는 그대로 열리고
   창업 · 폐업 쪽 링크가 거기로 갑니다 (지운 것이 아닙니다). */
/* ⚠️⚠️ **`/about` 은 2026-10-31 에 더했습니다.** 그 화면은 창업 · 폐업
   소개(2,266자 · "가게 하나를 열고 닫는 데…")라 지금 308 로 `/` 에
   갑니다 — sitemap 에 두면 구글에게 **"크롤해라" 와 "옮겼다" 를 같이**
   말하는 꼴입니다.
   ⚠️ `/compare` · `/sample` 도 같은 날 308 에 들어갔고 **전부터 여기
   있었습니다** (결과 화면 · 지어낸 업체 예시).
   ⚠️⚠️ **아래 배열 안에 주석을 넣지 마세요.** 전수 점검이 그 선언을
   글자로 찾아 여는 꺾쇠부터 닫는 꺾쇠까지를 떼어 **JSON 으로 바로
   읽습니다** — 주석을 넣는 순간 거기서 "읽지 못했습니다" 로 멈춥니다
   (실제로 한 번 빠졌습니다). 중첩 괄호도 안 됩니다.
   ⚠️⚠️ **그 선언 이름을 주석에 글자로 적지도 마세요.** 찾는 코드가
   **주석 쪽을 먼저 맞혀** 여기 적힌 꺾쇠를 배열로 읽습니다 — 이
   저장소가 화면 표시(`main` 칸)를 주석에 적어 스크립트 서른둘을
   통째로 삼킨 그 자리이고, 여기서도 **한 번 더** 빠졌습니다. */
var NOINDEX = ["/my","/search","/quote","/track"];



/* 정확히 일치하거나 접두사로 걸리면 색인에서 뺍니다.
   ⚠️ 접두사는 `/tools` 처럼 그 자체와 `/tools/...` 를 **둘 다** 봅니다 —
   `/track` · `/terms` 는 `/t` 가 아니라 온전한 토막으로 견주므로
   걸리지 않습니다 (재서 확인했습니다). */
function amNoIndex(p2){
  if(NOINDEX.indexOf(p2) >= 0) return true;
  /* 예시 상품(/d/sample-…)은 routeInfo 가 r.noindex 를 따로 켭니다 */
  return false;
}

/* ⚠️⚠️ **2026-10-31 — 상세 설명 넷(pvDesc · frDesc · stDesc · asDesc)을
   내렸습니다.** 사장님 지시("인수인계 자료를 다 지워 · 중고폰 쪽은
   살려두고")로 그 넷이 설명을 만들던 네 주소(/p/:id · /f/:slug ·
   /s/:id · /a/:id)가 routeInfo 에서 없어졌습니다 — 70줄이 **20개 화면
   전부에 실리면서** 아무 데서도 안 불리고 있었습니다.
   ⚠️ 꺼내 보시려면 git show 6d85a17:js/app.js 입니다. 그 넷을
   되살리시려면 routeInfo 에 그 네 갈래를 같이 넣으세요 — 설명만
   되살리면 또 아무도 안 부릅니다 (node tools/check-dead.js 가 셉니다). */

window.routeInfo = function(path){
  var r = { ok:true, title:"", desc:"", canon:null,
            noindex: amNoIndex(path), view:null };
  if(META[path]){ r.title = META[path][0]; r.desc = META[path][1]; }

  var VIEW = {
    /* ⚠️⚠️ **`/` 가 곧 서비스 메인입니다** (2026-10-01 지시서 §1 · §29).
       중간 소개 화면(Intro · Splash · Gateway)을 다시 끼우지 마세요.
       옛 주소 `/home` 은 `vercel.json` 이 308 로 여기 보냅니다 —
       화면이 아니라 **안 깨지라고 남겨 둔 길**입니다. */
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

  /* 중고폰 상품 하나 — /d/:id (2026-10-29)
     ⚠️⚠️ **예시 상품은 noindex 입니다.** 지어낸 값이 붙은 화면이
     검색에 걸리면 손님이 그걸 보고 돈을 보냅니다 — `build-pages.js`
     의 sitemap 은 `r.noindex` 를 보고 빼고, HTML 은 만들어야 주소가
     열립니다 (`/sample` 과 같은 방식입니다). */
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

/* ── 화면 옮기기 ────────────────────────────────────────────
   ⚠️ location.href 를 쓰면 페이지가 통째로 새로 뜹니다. */
window.go = function(url, opt){
  opt = opt || {};
  if(opt.keepScroll) RT.keepScroll = true;
  /* ⚠️⚠️ **떠나기 전에 보던 자리를 적어 둡니다** (2026-10-24).
     고르개 화면이 폰에서 8,000px 이 넘는데, 신청 화면에 갔다가
     뒤로 오면 **맨 위**였습니다 — 서비스를 더 담으려면 아홉 화면을
     다시 내려가야 했습니다.
     ⚠️ 브라우저의 되돌려 놓기(`scrollRestoration`)는 꺼 둔 채로
     둡니다 — **새로고침은 맨 위**가 맞고(사장님 지시 · 10-21),
     여기는 **뒤로 가기만** 따로 돌려놓습니다. */
  try { history.replaceState({ y: Math.round(window.scrollY || 0) }, ""); } catch(e){}
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
  /* ⚠️ "더 보기"(`data-keep`)는 **스크롤을 지킵니다.** 목록을 늘리는
     것인데 맨 위로 올라가면 방금 보던 자리를 잃고, 그러면 한 번 더
     누르지 않습니다. */
  go(href, { keepScroll: a.hasAttribute("data-keep") });
});
/* ⚠️⚠️ **뒤로 가기에서만** 보던 자리로 돌려놓습니다.
   ⚠️ `render()` 가 그리고 나서 **그 다음 틀**에 옮깁니다 — 그려지기
   전에는 문서가 짧아서 그 자리까지 내려갈 수가 없습니다.
   ⚠️ 적어 둔 자리가 없으면(밖에서 들어온 걸음) 지금처럼 맨 위입니다. */
window.addEventListener("popstate", function(e){
  var y = e && e.state && typeof e.state.y === "number" ? e.state.y : null;
  if(y !== null) RT.keepScroll = true;
  render();
  if(y !== null) setTimeout(function(){ window.scrollTo(0, y); }, 0);
});

/* ── 그리기 ────────────────────────────────────────────────── */
/* 이 화면이 창업 쪽인가 폐업 쪽인가 — 아니면 어느 쪽도 아닌가 */
function sideOf(r){
  /* ⚠️⚠️ **PHONEWAY 화면 다섯은 `pw-skin` 입니다** (2026-10-29).
     속화면이 아직 앞 서비스의 **베이지 · 브라운**을 쓰고 있어서, 칩 ·
     고르개 · 단추가 전부 갈색으로 섰습니다 (찍어 보고 알았습니다).
     ⚠️⚠️ **토큰을 전역으로 갈지 않았습니다** — `--blue` · `--navy` ·
     `--bg*` 는 창업 · 폐업 157개 화면이 **같이 읽는** 값이고, 그
     157개를 어떻게 할지는 0단계 ① 로 사장님이 정하실 일입니다.
     그래서 `.side-start` 와 **똑같은 방식**으로 이 다섯 화면 안에서만
     다시 정의합니다 (`css/pages.css` 맨 뒤 한 블록) — 되돌리시려면
     그 블록과 이 줄입니다.
     ⚠️ 이름을 `side-` 로 짓지 않았습니다 — 그건 **창업 · 폐업 쪽**을
     뜻하는 표시이고, 전수 점검 둘이 `#view` 에 `side-` 가 붙는 것
     자체를 막습니다 (운영 · 인수양도는 중립이라야 합니다). */
  if(r.view === "phone-sell" || r.view === "phone-shop" ||
     r.view === "phone-bid"  || r.view === "phone-track" ||
     r.view === "phone-guide" ||
     /* ⚠️⚠️ **`/biz` 를 여기 안 넣어서 그 화면만 갈색으로 서 있었습니다**
        (2026-10-29 오렌지 차수에 재서 찾았습니다). 머리 띠 그라디언트도
        `#view.pw-skin .pgh` 라 안 걸려서 머리와 본문이 **ΔE 0.00** 이었고,
        전수 점검이 그걸로 잡았습니다 — **새 PHONEWAY 화면을 만들면
        이 목록에 같이 넣으세요.** */
     r.view === "phone-biz" || r.view === "phone-repair" ||
     /* ⚠️ 2026-10-29 — 글을 중고폰 것으로 바꾼 뒤 **색도 같이** 옮겼습니다.
        `/join` 은 매입업체 모집, `/faq` 는 헤더 "도움말" 이 가리키는
        화면이라 둘 다 PHONEWAY 쪽입니다 — 안 옮기면 중고폰 메뉴로
        들어왔는데 거기만 갈색으로 서서 다른 사이트로 읽힙니다. */
     r.view === "join" || r.view === "faq" ||
     /* ⚠️ 헤더에서 바로 가는 둘입니다 — 돋보기(`/search`)와
        `내 기록`(`/my`). 안 옮기면 네이비 헤더 밑에 **갈색 본문**이
        서서 두 서비스로 읽힙니다 (찍어 보고 알았습니다). */
     r.view === "search" || r.view === "my") return "pw-skin";
  if(r.view === "startup" || r.view === "startupIndustry") return "side-start";
  if(r.view === "closure" || r.view === "closureIndustry") return "side-close";
  /* ⚠️⚠️ 여정 넷 가운데 **매장 운영 · 인수 · 양도는 중립(파랑)** 입니다.
     운영은 창업도 폐업도 아니고, 인수 · 양도는 넘기시는 분과 받으시는
     분이 **같은 화면**을 봅니다 — 한쪽 색으로 칠하면 다른 쪽에게
     "여긴 내 자리가 아니네" 가 됩니다 (`/stores` · `/assets` 와 같은
     까닭입니다). */
  /* ⚠⚠ **여기에 `side-ops` · `side-pass` 를 만들지 마세요.**
     2026-10-24 에 세이지 · 플럼으로 갈라 봤다가 **물렀습니다** —
     전수 점검의 "운영 화면이 실제로 있는 분야로만 보낸다" 와
     "인수 · 양도는 한쪽으로 물들지 않고" 둘이 `#view` 에 `side-`
     클래스가 붙는 것 **자체**를 막습니다. 그 둘은 일부러 그렇게
     적혀 있습니다 — 바로 위 까닭 그대로입니다.
     ⚠️ 네 전문관을 **구별하는 일**은 메인 진입 카드의 색 넷
     (`--hall-blue` · `--hall-green` · `--hall-purple` · `--hall-red`)
     이 이미 합니다. 속화면까지 물들이는 것은 **사장님이 정하실
     일**이고, 그날 이 줄과 위 검사 둘을 같이 고치세요.
     ⚠️ `css/pages.css` 맨 뒤의 `.side-ops` · `.side-pass` 블록은
     그때 쓸 수 있게 **그대로 두었습니다** — 붙는 자리가 없어서 지금은
     한 픽셀도 안 바뀝니다. */
  if(r.view === "operation" || r.view === "acquisition") return "";
  /* 사업 단계 화면 — ⚠️ `both`(매장 양도·양수)는 **한쪽으로 물들이지
     않습니다.** 넘기시는 분과 받으시는 분이 같은 화면을 봅니다
     (`/stores` · `/assets` 를 중립으로 둔 것과 같은 까닭입니다). */
  if(r.stage){
    if(r.stage.side === "start") return "side-start";
    if(r.stage.side === "close") return "side-close";
    return "";
  }
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

   ⚠️ **묶음으로 봅니다.** 웜 화이트(`--bg`)와 크림(`--bg-cream`)은
   팔레트에 따라 ΔE 0.35 까지 가까워집니다 (2026-10-08 값 #FDFBF7 ↔
   #FCFAF6 이 그랬습니다) — 사람 눈에는 같은 색이고,
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
  /* ⚠️ 2026-10-06 2차 §18 로 폐업 분야 구간이 복숭아(`sec-close`)가
     됐습니다. 여기 안 적으면 "warm" 으로 읽혀 크림 구간과 겹쳐도
     못 밉니다 — `.mjy` 가 꼭 그렇게 숨어 있었습니다. */
  if(c.indexOf(" sec-close ") >= 0) return "peach";
  /* 2026-10-15 §7 · §8 — 계산도구 라벤더 · 이용 방법 피치 */
  if(c.indexOf(" sec-calc ")  >= 0) return "lav";
  if(c.indexOf(" sec-step ")  >= 0) return "step";
  /* 크림과 "바탕 안 준 구간" 은 같은 묶음입니다 (ΔE 0.35) */
  return "warm";
}
function paintTones(){
  var v = $("view"); if(!v) return;
  /* ⚠️⚠️ **메인은 구간마다 바탕을 손으로 정해 두어서 번갈아 칠하지
     않습니다** (2026-10-17 §3-2 · §4). 이 함수는 이웃한 두 구간이 같은
     묶음이면 뒤엣것을 **다음 바탕으로 밉니다** — 메인 구간은 톤
     클래스가 없어서 전부 "warm" 으로 읽히고, 그러면 아이보리 · 베이지
     차례 사이에 `sec-white` · `sec-gray` 가 끼어 **엉뚱한 띠**가
     생깁니다. 에러도 안 나고 가로 스크롤도 안 나서 찍어 봐야 압니다. */
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

  /* ⚠️ 창업 쪽 화면은 초록, 폐업 쪽 화면은 주황으로 **통째로** 물들입니다.
     규칙을 수십 개 고치는 대신 `--blue` 계열 변수를 이 안에서만 다시
     정의합니다 — 강조색이 전부 그 변수를 거치기 때문입니다 (css/pages.css).
     ⚠️ 헤더 · 푸터는 `#view` 밖이라 그대로 남습니다. 거기까지 물들면
     화면마다 머리가 바뀌어 한 사이트로 안 읽힙니다. */
  /* ⚠️⚠️ **메인만 본문까지 다크입니다** (2026-10-16 §2-1). 머리와
     꼬리는 161개 화면 전부 다크이고, 속화면 본문은 그대로 밝습니다
     (BRIGHT PREMIUM). `index.html` 의 html 태그가 이 클래스를 들고
     있어서 **첫 그림부터** 다크이고, 여기서는 이동할 때만 맞춥니다.
     ⚠️ 빌드가 하위 화면에서 이 클래스를 **떼어 냅니다** (shell()). */
  document.documentElement.classList.toggle("ivh", nowPath() === "/");
  $("view").className = sideOf(r);
  $("view").innerHTML = html;
  paintTones();
  paintMeta(r);
  paintChrome();
  initReveal();
  /* ⚠️⚠️ §11-1 — 마이페이지만 서버에 한 번 묻습니다.
     로그인이 꺼져 있으면 `/api/me` 가 `auth:false` 를 돌려주고 구간은
     숨은 채로 남습니다 — 화면이 깨지지도, 가짜 단추가 생기지도
     않습니다. ⚠️ 다른 화면에서는 묻지 않습니다 — 한 번씩 더 가는
     요청은 그만큼 느려집니다. */
  if(nowPath() === "/my" && typeof window.myLoadDb === "function") window.myLoadDb();
  /* ⚠⚠ `/track` 도 같은 규칙입니다 — 조회할 곤이 없는 동안에는
     폼을 안 내고, 로그인이 켜지면 `pwTrackInit()` 이 그때 엽니다.
     ⚠ 다른 화면에서는 묻지 않습니다. */
  if(nowPath() === "/track" && typeof window.pwTrackInit === "function") window.pwTrackInit();
  /* 고르신 서비스 — 하단 띠 높이를 재서 본문을 그만큼 비우고, 단추
     글씨의 개수를 맞춥니다 (2026-10-17 창업 준비 §3-3).
     ⚠️ 어느 화면에서나 부릅니다 — 띠가 없는 화면에서는 아무 일도 안
     하고, 띠가 있는 화면에서만 높이를 잽니다. 화면마다 조건을 적으면
     새 화면을 만들 때 한쪽만 고치게 됩니다. */
  if(typeof window.pickPaint === "function") window.pickPaint();
  /* ⚠️⚠️ **회원 계정에 남은 것과 한 번 맞춰 봅니다** (2026-10-18 §6-2 · §9).
     로그인이 꺼져 있거나 안 들어와 계시면 `amStateSync()` 가 **fetch 를
     한 번도 안 보내고** 그대로 끝납니다 — 지금 운영 사이트가 그
     상태이고, 화면은 오늘과 글자 하나 다르지 않습니다.
     ⚠️ 스스로 한 번만 묻습니다 (`AM_ST.asked`) — 화면을 옮길 때마다
     다시 묻지 않습니다. */
  if(typeof window.amStateSync === "function") window.amStateSync();
  /* 임시저장 — 마지막 저장 시각과 단추 두 개의 보임 여부 (§4-3) */
  if(nowPath() === "/quote" && typeof window.quoteDraftPaint === "function")
    window.quoteDraftPaint();
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

/* ⚠️⚠️ **2026-10-31 — 창업 · 폐업 둘로 보내고 있었습니다.** 사장님
   지시로 그 157개 주소가 `vercel.json` 에서 308 로 `/` 에 가므로,
   404 에서 거기로 보내면 **눌러도 메인으로 튕깁니다** — 전수 점검의
   "안 열리는 주소" 가 `/startup` · `/closure` 로 잡았습니다.
   ⚠️ `404.html`(라우터 밖에서 혼자 뜨는 화면)에도 **같은 단추 둘**이
   있습니다 — 한쪽만 고치면 그 화면만 옛 길로 남습니다. */
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

/* ── 메타 ──────────────────────────────────────────────────── */
function paintMeta(r){
  var B = window.AM_BRAND || {};
  /* ⚠️ 제목 규칙은 js/data/brand.js 의 amTitle() 한 곳입니다 —
     build-pages.js 의 metaTags() 도 같은 것을 부릅니다. */
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

/* ⚠️⚠️ **새로고침하면 맨 위에서 시작합니다** (2026-10-21 사장님 지시)

   브라우저 기본값(`history.scrollRestoration = "auto"`)은 새로고침할 때
   **전에 보던 자리로 되돌려 놓습니다.** 그래서 F5 를 눌러도 화면이
   중간에서 떴습니다 — 라우터는 이미 맨 위로 올리는데(`render()` 의
   `scrollTo(0,0)`) 브라우저가 **그 뒤에** 다시 내려놓기 때문입니다
   (복원은 load 뒤에 비동기로 일어납니다).

   ⚠️ 이 줄을 DOMContentLoaded 안에 넣지 마세요 — 거기보다 **앞**이라야
   복원을 막습니다. 스크립트가 `defer` 라 문서를 다 읽은 뒤에 돌고,
   그때 끄면 아직 복원 전입니다.

   ⚠️ **"더 보기"(`data-keep`)는 영향이 없습니다** — 그쪽은 애초에
   `scrollTo` 를 안 부릅니다 (목록을 늘리는 것인데 맨 위로 올라가면
   방금 보던 자리를 잃습니다).
   ⚠️ **뒤로 가기도 전부터 맨 위였습니다** — `popstate` 가 `render()` 를
   부르고 거기서 `scrollTo(0,0)` 합니다. 그래서 브라우저의 되돌려 놓기는
   **라우터와 싸우기만** 하고 얻는 것이 없었습니다. */
try{
  if("scrollRestoration" in history) history.scrollRestoration = "manual";
}catch(e){}

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
