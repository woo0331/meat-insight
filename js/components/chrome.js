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
  /* ⚠️⚠️ **2026-10-08 지시서 §4 의 다섯**입니다 (전에는 일곱).
     시안의 메뉴 그대로이고, 다섯 전부 **실제로 있는 화면**입니다
     (가짜 링크는 절대 규칙 5).

     ⚠️ 빠진 둘이 길을 잃지 않는지 확인했습니다 —
       · `/operation`(매장 운영) → **푸터 첫 칸**(여정 넷)과 05 매장
         구간, 그리고 `/transfer` 화면 안의 여정 줄이 보냅니다.
       · `/tools`(사장님 도구)  → **메인 04 구간이 통째로 그것**이고
         푸터 `서비스` 칸에도 있습니다.
     ⚠️ `정보 · 도구` 는 시안에서 한 칸이지만 저희 화면은 둘입니다
     (`/content` · `/tools`). 펼침메뉴를 새로 만들면 폰에서 누르는
     단계가 하나 늘어서, **글이 예순 편 있는 `/content`** 로 보내고
     도구는 바로 위 04 구간과 푸터가 받습니다.

     ⚠️⚠️ **여섯으로 늘리지 마세요.** 1280px 에서 메뉴가 쓸 수 있는
     폭이 548px 이고, 넘치면 **가로 스크롤이 나는 것이 아니라** 메뉴가
     헤더 오른쪽(검색 · 내 기록 · 입점) 위로 올라앉습니다 — `.gnb` 가
     `min-width:0` 이라 문서 폭은 그대로여서 **전수 점검이 못 잡습니다.**
     ⚠️ 900px 아래에서는 메뉴가 통째로 접히고 아래 네비가 받습니다. */
  /* ⚠️⚠️ 2026-10-09 최종 통합 지시서 §2-2 의 **여덟**입니다 —
     창업 · 매장 운영 · 폐업·정리 · 서비스 신청 · 매장 인수·양도 ·
     정보·계산도구 · 파트너 제휴 · 마이페이지. 뒤의 둘은 왼쪽 줄이
     아니라 **헤더 오른쪽**에 있습니다 (업체 입점 · 내 기록) — 그래서
     왼쪽은 여섯이고 합치면 여덟입니다.
     ⚠️⚠️ **`업체찾기` 를 뺀 자리에 `매장 운영` 이 들어왔습니다.**
     업체찾기는 **지우지 않았습니다** (§12 "기존 기능을 보존한다") —
     메인 02 서비스 카드 여덟 · 03 탐색 구간 · 푸터 `서비스` 칸 ·
     아래 네비 다섯 칸이 전부 `/providers` 로 보냅니다 (누르고 확인했습니다).
     ⚠️ 일곱으로 늘리지 마세요 — 901px 에서 남는 폭을 재서 정한 여섯입니다. */
  /* ⚠️⚠️ **2026-10-11 최종 디자인 지시서 §2 의 여섯**입니다.
     여섯 전부 실제로 있는 화면입니다 (가짜 링크는 절대 규칙 5).
     ⚠️ 지시서의 여섯째는 `고객센터` 인데 **그런 화면이 없습니다** —
     전화도 채팅도 없는데 그 이름을 걸면 손님이 찾다가 못 찾습니다
     (이 저장소가 푸터에서 못박아 둔 자리). 실제로 답이 있는
     `/faq` 로 보내고 이름도 그대로 적습니다.
     ⚠️ `/content`(정보센터)는 헤더에서 빠졌습니다 — 푸터 `서비스`
     칸과, 160개 화면의 글 잇기 구간과 헤더 검색이 받습니다. */
  /* ⚠️⚠️ **2026-10-16 "최종 홈페이지 리뉴얼" §4 의 여덟**입니다.
     여덟 전부 **실제로 있는 화면**입니다 (가짜 링크는 절대 규칙 5) —
     지시서가 적은 여덟을 저희 주소로 옮기면 이렇게 됩니다.

       창업 준비     /startup     매장 운영   /operation
       매장 양도양수 /transfer    폐업 · 정리 /closure
       서비스 · 상품 /providers   계산기      /tools
       이용 가이드   /content     도움말      /faq

     ⚠️⚠️ **지시서의 여덟째는 `고객센터` 인데 그렇게 적지 않았습니다.**
     전화도 채팅도 없고 사업자 전화번호 칸조차 비어 있어서, 그 이름을
     걸면 손님이 **전화번호를 찾다가 못 찾습니다** — 이 저장소가 푸터
     에서 못박아 둔 자리이고 §0-8(작동하지 않는 링크)과 같은 결입니다.
     실제로 답이 있는 `/faq` 로 보내고 이름도 그대로 적습니다. 고객센터
     기능(전화 · 채팅 · 티켓)이 생기는 날 이 한 줄을 바꿉니다.
     ⚠️ `서비스 · 상품` 은 `/providers` 입니다 — 분야 26 · 세부 서비스
     206 이 거기서 갈라지고, `offers.js` 의 수익상품도 **새 주소를 만들지
     않고** 그 분야 화면으로 보냅니다 (§5 콘텐츠 중복 방지).

     ⚠️⚠️ **여덟은 1100px 아래에서 안 들어갑니다 — 재서 접었습니다.**
     여섯일 때 901px 에서 남는 폭이 30px 뿐이었습니다. 그래서 메뉴가
     통째로 접히는 폭을 **900 → 1100px** 으로 올리고, 그 아래는
     **햄버거 서랍**(`HeaderDrawer`)이 여덟을 전부 받습니다.
     ⚠️ 서랍도 같이 올렸습니다 (`css/app.css`) — 한쪽만 올리면
     1001~1100px 에 **메뉴가 아무것도 없게** 됩니다 (이 저장소가
     `display:none` 을 1040 으로 올렸다가 겪은 자리).
     ⚠️⚠️ **아홉으로 늘리지 마세요.** 넘치면 가로 스크롤이 나는 것이
     아니라 메뉴가 헤더 오른쪽 위로 **올라앉고**, `.gnb` 가
     `min-width:0` 이라 전수 점검이 영원히 통과합니다. 손대실 때는
     열두 폭에서 재 보세요. */
  { to:"/startup",   name:"창업 준비" },
  { to:"/operation", name:"매장 운영" },
  { to:"/transfer",  name:"매장 양도양수" },
  { to:"/closure",   name:"폐업 · 정리" },
  { to:"/providers", name:"서비스 · 상품" },
  /* ⚠️ 2026-10-17 §5 가 이 칸을 **계산도구**로 적었습니다. 한 글자가
     늘어 재 봤습니다 — 1441px 이상에서 남는 폭 101 → 88px 입니다
     (아래 표). */
  { to:"/tools",     name:"계산도구" },
  { to:"/content",   name:"이용 가이드" },
  /* ⚠️⚠️ **2026-10-09 지시서 PART 2 4-1 — 여섯째입니다.** 지시서의 아홉
     중 다섯이 위에 있고, `파트너 입점` 과 `로그인·마이페이지` 는 헤더
     **오른쪽**(업체 입점 · 내 기록)에 이미 있습니다. 빠진 것이
     `서비스 신청` 하나였습니다.

     ⚠️⚠️ **재 보고 넣었습니다.** 이 저장소는 "여섯으로 늘리지 마세요"
     라고 적어 두었는데, 그 경고는 메뉴가 **일곱**이던 시절 값입니다.
     다섯으로 줄어든 지금 다시 재 보니 여섯이 들어갑니다 —

         폭      쓰는 폭 / 자리    줄   넘친 칸   가로 스크롤
         1440    427 / 610        1      0        없음
         1280    427 / 450        1      0        없음
         1024    387 / 500        1      0        없음
          980    352 / 456        1      0        없음
          901    352 / 377        1      0        없음   ← 제일 좁습니다

     ⚠️⚠️ **남는 폭이 95px 에서 25px 으로 줄었습니다** (901px 기준).
     일곱으로 늘리거나 메뉴 이름을 길게 하면 그 자리에서 넘칩니다 —
     넘치면 **가로 스크롤이 나는 것이 아니라** 메뉴가 헤더 오른쪽 위로
     올라앉고, `.gnb` 가 `min-width:0` 이라 **전수 점검이 영원히
     통과합니다.** 손대실 때는 위 표처럼 **재 보세요.**

     ⚠️ `/quote` 는 실제로 있는 화면입니다 (견적 · 상담 신청).

     ⚠️⚠️ **2026-10-17 §5 로 다시 쟀습니다** (여덟 · 계산도구) —

         폭        쓰는 폭 / 자리   줄   넘친 칸   가로 스크롤
         2560~1441  577 / 666      1      0        없음   ← 제일 좁습니다
         1440       577 / 1001     1      0        없음
         1280       528 / 841      1      0        없음
         1180       513 / 741      1      0        없음
         1101       513 / 662      1      0        없음
         1100 아래  메뉴가 접히고 햄버거 서랍이 여덟을 받습니다

     ⚠️⚠️ **아홉으로 늘리거나 이름을 더 길게 하지 마세요** — 1441px
     이상에서 남는 폭이 88px 뿐입니다.

     ⚠️⚠️ **고객센터를 적지 않았습니다** (§5 에 있습니다). 그런 화면이
     없고 전화도 채팅도 없습니다 — 사업자 전화번호 칸조차 비어 있어서,
     그 이름을 걸면 손님이 **전화번호를 찾다가 못 찾습니다**. 실제로
     답이 있는 `/faq` 를 `도움말` 로 냅니다 (절대 규칙 2 · 5). */
  { to:"/faq",       name:"도움말" }
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
/* 로고 아래 작은 줄.
   ⚠️⚠️ **2026-10-08 지시서 §4 — "소비자에게 STOREWAY 를 브랜드명으로
   노출하지 않는다."** 전에는 여기가 `en`(STOREWAY)이었고, 그래서
   주소와 화면 이름이 **서로 다른 서비스 둘**로 읽힐 수 있었습니다.
   지금은 시안 그대로 **서브문구**(`sub`)입니다.
   ⚠️ `en` 을 지우지는 않았습니다 — 구조화 데이터의 `alternateName`
   (검색엔진이 읽는 다른 이름)으로만 남습니다. 화면에는 안 나옵니다.
   ⚠️ 이름과 같으면 빈 문자열입니다 (두 번 적지 않습니다). */
function logoSub(){
  var B = window.AM_BRAND || {}, sb = B.sub || "";
  return (sb && sb !== (B.name || "")) ? sb : "";
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
      /* ⚠️⚠️ **로그인은 설정됐을 때만 나옵니다** (2026-10-13 §3).
         지시서가 "로그인 또는 내 계정" 을 적었는데, `/api/session` 이
         `auth:false` 인 동안 그 단추를 내면 **눌러도 아무 일이 안
         납니다** — §0-7(클릭해도 작동하지 않는 버튼)이고 이 저장소가
         헤더에서 "로그인" 을 네 번 빼 온 까닭입니다.
         그래서 **빈 칸으로 두고** `hdAuthPaint()` 가 켜졌을 때만
         채웁니다. Vercel 에 환경변수가 들어가는 날 **코드를 한 줄도
         안 고치고** 나타납니다 (`/my` 의 `.my-db` 와 같은 방식). */
      '<span class="hd-auth" id="hdAuth" hidden></span>'+
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
      /* ⚠️⚠️ **2026-10-11 지시서 §2 — 오른쪽은 검색 · 무료 견적 신청 ·
         로그인**입니다. 전에는 `업체 입점` 이 있었는데, 그 길은
         **푸터 `파트너` 칸**이 161개 화면에서 그대로 받습니다 (재서
         확인했습니다).
         ⚠️ `data-to="/quote"` 를 지우지 마세요 — `paintGnb()` 가 그
         표시를 보고 **보던 조건을 href 에 실어 줍니다.** 없으면
         분류 화면에서 눌렀을 때 빈 견적 화면이 떠서 처음부터 다시
         적게 됩니다 (업체 상세의 `quoteTo({})` 로 겪은 사고). */
      '<a class="btn btn-nv hd-cta" href="/quote" data-to="/quote">'+
        '<span class="hd-cta-w">무료 </span>견적 신청'+icon("arrow",16)+'</a>'+
      /* ⚠️⚠️ **폰 햄버거** (§3 — "모바일에서는 간결한 로고, 견적 신청
         진입 버튼, 햄버거 메뉴를 우선 배치한다").
         900px 아래에서는 `.gnb` 가 통째로 접혀서, 그 전까지 **매장
         운영 · 매장 양도양수 · 계산도구 · 도움말 넷은 푸터까지
         내려가야** 닿았습니다 (아래 네비 다섯 칸은 홈 · 창업 · 폐업 ·
         업체찾기 · MY 라 그 넷이 없습니다). 재서 확인한 구멍입니다.
         ⚠️ 아래 네비를 대신하는 것이 아닙니다 — 그쪽은 자주 쓰는
         다섯, 이쪽은 **헤더 메뉴 전부**입니다. */
      '<button class="hd-ic hd-mb" type="button" id="hdMb" aria-label="메뉴"'+
        ' aria-expanded="false" aria-controls="hdMenu" onclick="hdMenu()">'+
        icon("menu",22)+'</button>'+
    '</div>'+
    HeaderDrawer()+
  '</div></header>';
}

/* ⚠️ 서랍은 **헤더 메뉴와 같은 목록**(`AM_GNB`)에서 옵니다 — 손으로
   적으면 메뉴를 하나 늘릴 때 한쪽만 고치게 되고, 그러면 폰에서만
   조용히 빠집니다 (이 저장소가 아이콘 표 · 랜딩 미니카드로 겪은
   자리입니다). */
function HeaderDrawer(){
  return '<div class="hd-dw" id="hdMenu" hidden>'+
    '<nav class="hd-dw-g" aria-label="전체 메뉴">'+
      AM_GNB.map(function(m){
        return '<a href="'+esc(m.to)+'" data-to="'+esc(m.to)+'">'+
          esc(m.name)+icon("arrow",16)+'</a>';
      }).join("")+
      '<a href="/my">'+esc("내 기록")+icon("arrow",16)+'</a>'+
      '<a href="/join">'+esc("파트너 입점")+icon("arrow",16)+'</a>'+
      /* ⚠️⚠️ **통합검색을 여기에도 둡니다** (2026-10-19). 320px
         (옛 아이폰 SE)에서 헤더 오른쪽이 11px 넘쳐서 가로 스크롤이
         났고, 거기서는 돋보기를 접습니다 — 서랍에 없으면 그 기계에서
         **검색이 아예 사라집니다.** 360px 위에서는 돋보기가 그대로
         있고 이 줄은 덧길입니다. */
      '<a href="/search">'+esc("통합검색")+icon("arrow",16)+'</a>'+
    '</nav>'+
  '</div>';
}

/* 열고 닫기. ⚠️ 주소가 바뀌면 `paintGnb()` 가 닫습니다 — 안 닫으면
   눌러서 넘어간 화면 위에 서랍이 그대로 덮여 있습니다. */
window.hdMenu = function(open){
  var dw = document.getElementById("hdMenu"),
      bt = document.getElementById("hdMb");
  if(!dw || !bt) return;
  var on = (open === undefined) ? dw.hasAttribute("hidden") : !!open;
  if(on) dw.removeAttribute("hidden"); else dw.setAttribute("hidden","");
  bt.setAttribute("aria-expanded", on ? "true" : "false");
};

/* ⚠️⚠️ **로그인이 설정되기 전에는 아무것도 안 그립니다** (§0-7 ·
   절대 규칙 2 · 5). `auth:false` 면 `hidden` 인 채로 둡니다 —
   "준비 중" 도 적지 않습니다. */
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

/* ⚠️⚠️ **헤더의 `서비스 신청` 이 보던 조건을 들고 갑니다.**
   그러지 않으면 `/providers/interior?i=cafe&r=gyeonggi` 를 보던 분이
   누를 때 **빈 견적 화면**이 떠서 처음부터 다시 적게 됩니다 — 이
   저장소가 업체 상세의 `quoteTo({})` 로 이미 겪은 사고입니다.
   전수 점검의 "분류 → 견적 요청으로 조건이 넘어간다" 가 잡았습니다.

   ⚠️ 조건은 **지금 주소**에서만 읽습니다 (경로 + 질의문자) — 화면이
   들고 있는 상태를 따로 읽으려 하면 화면마다 다른 코드가 됩니다.
   ⚠️ `quoteTo()` 한 곳을 그대로 씁니다 (`js/components/ui.js`). */
function gnbQuoteHref(){
  if(!window.quoteTo) return "/quote";
  var p = nowPath(), seg = p.split("/").filter(Boolean), o = {};
  if(seg[0] === "providers" && seg[1]) o.cat = seg[1];
  if(seg[0] === "c" && seg[1])         o.cat = seg[1];
  if((seg[0] === "startup" || seg[0] === "closure") && seg[1]) o.industry = seg[1];
  if(seg[0] === "startup") o.side = "start";
  if(seg[0] === "closure") o.side = "close";
  /* 주소에 실린 것이 더 셉니다 — 거르개로 고른 값이기 때문입니다 */
  if(nowQS("i")) o.industry = nowQS("i");
  if(nowQS("r")) o.region   = nowQS("r");
  if(nowQS("s")) o.sub      = nowQS("s");
  if(nowQS("c")) o.cat      = nowQS("c");
  return window.quoteTo(o);
}

function paintGnb(){
  var p = nowPath();
  /* ⚠️⚠️ **메인의 헤더 검색만 접습니다** (2026-10-13 §3 — "기존
     메인페이지 상단 검색 아이콘은 제거한다. 다만 기존 검색 기능
     자체는 삭제하지 않고 필요한 서비스 페이지에서 계속 사용할 수
     있도록 유지한다").
     ⚠️ **헤더에서 통째로 빼지 마세요** — 160개 화면에서 검색이
     사라집니다. 접는 것은 `/` 한 곳뿐이고, 그래서 `check.js` 의
     "어느 화면에서나 검색으로 가는 길이 있다" 도 메인만 빼고 봅니다. */
  var hd = document.querySelector(".hd");
  if(hd) hd.classList.toggle("is-home", p === "/");
  /* 주소가 바뀌면 폰 서랍을 닫습니다 — 안 닫으면 넘어간 화면 위에
     그대로 덮여 있습니다. */
  if(typeof window.hdMenu === "function") window.hdMenu(false);
  /* ⚠️⚠️ **헤더 오른쪽 CTA 는 `#gnb` 밖입니다.** 2026-10-11 최종 디자인
     §2 로 `업체 입점` 자리가 `무료 견적 신청`(`/quote`)이 되면서, 조건을
     실어 주는 코드가 `#gnb` 안만 돌아 **그 단추만 조용히 빠졌습니다** —
     `/providers/interior?i=cafe&r=gyeonggi` 를 보던 분이 누르면 **빈 견적
     화면**이 떠서 처음부터 다시 적게 됩니다 (업체 상세의 `quoteTo({})`
     로 이미 겪은 사고). 전수 점검의 "분류 → 견적 요청으로 조건이
     넘어간다" 가 잡았습니다. 헤더 전체에서 그 표시를 찾습니다. */
  els('a[data-to="/quote"]', document.querySelector(".hd") || document)
    .forEach(function(a){ a.setAttribute("href", gnbQuoteHref()); });
  var g = $("gnb"); if(!g) return;
  els("a", g).forEach(function(a){
    var to = a.getAttribute("data-to");
    var on = (to === "/") ? (p === "/") : (p === to || p.indexOf(to + "/") === 0);
    a.classList.toggle("on", on);
    if(on) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current");
    /* ⚠️ `data-to` 는 그대로 둡니다 — 지금 화면 표시가 그걸로 갈립니다.
       바꾸는 것은 `href` 하나입니다. */
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
  /* ⚠️⚠️ **2026-10-06 마무리 지시서 §9 의 다섯 칸**입니다 —
       인수인계 · 사업 단계 · 서비스 · 파트너 · 고객지원.
     ⚠️⚠️ **칸 수를 바꾸면 `css/app.css` 의 `.ft-g` 도 같이 고치세요.**
     셋에서 다섯이 됐는데 격자를 안 고치면 두 칸이 아래로 밀리고
     브랜드 칸 옆에 **화면 절반짜리 빈 자리**가 남습니다 — 에러도 안
     나고 가로 스크롤도 안 납니다 (찍어 보고 알았습니다).
     ⚠️ 이름 · 주소를 손으로 적지 마세요 — 여정은 `journey.js`,
     단계는 `lifecycle.js` 에서 옵니다.
     ⚠️⚠️ **"고객센터" 라고 적지 않습니다.** 그런 화면이 없습니다 —
     전화도 채팅도 없는데 그 이름을 걸면 손님이 찾다가 못 찾습니다
     (절대 규칙 2 · 5). 실제로 답이 있는 `/faq` 를 그 이름으로 냅니다.
     ⚠️⚠️ **서비스 칸을 줄이지 마세요.** 헤더 일곱에 프랜차이즈 ·
     시설 · 집기 · 지원사업 · 견적 요청이 **없습니다** — 푸터에서 빼면
     메인을 뺀 **140여 개 화면에서 그리로 가는 길이 사라집니다.**
     지시서 §9 의 목록은 **최소**로 보고 잃는 길이 없게 채웠습니다. */
  /* ⚠️⚠️ **2026-10-08 — "사업 단계" 칸이 여정 넷에서 단계 여섯으로
     바뀌었습니다.** 메인이 지시서 §3 의 일곱 구간으로 다시 짜이면서
     `MainStage()`(단계 여섯 열)가 메인에서 내려왔는데, 그 열이
     **`/g/:stage` 여섯으로 가는 유일한 길**이었습니다 — 그대로 두면
     색인은 되어 있는데 사이트 안에서는 아무 데서도 안 걸리는 화면이
     여섯 생깁니다. 여기가 그 길을 받습니다 (`stages` 는 전부터 여기
     계산돼 있었는데 **아무 데서도 안 쓰이고 있었습니다**).
     ⚠️ 여정 넷은 길을 잃지 않습니다 — `창업` · `운영` · `인수·양도` ·
     `폐업` 이 헤더 앞 네 칸입니다. */
  var cols = [
    /* ⚠️ 이름 · 주소를 손으로 적지 마세요 — 여정은 `journey.js`,
       단계는 `lifecycle.js` 에서 옵니다. */
    [brandName(), [["/about","서비스 소개"]].concat(journeys)],
    ["사업 단계", stages],
    ["서비스",   [["/providers","업체 찾기"],["/content","정보센터"],
                  ["/tools","사장님 도구"],["/stores","매장 찾기"],
                  /* ⚠️⚠️ 2026-10-20 시안 1(확대본) — 메인 진입 카드가
                     간결해지면서 `/sell` 로 가는 길이 메인에서 사라졌습니다.
                     전문관(`/transfer`)은 **기본값이 인수 쪽**이라 양도로 한 번
                     더 눌러야 나옵니다 — 재서 알았습니다. 매물을 내놓는
                     입구라 끝기면 안 됩니다 (매물이 0건인 까닭 중 하나가
                     바로 이 길이 없었던 것입니다). 푸터는 167개 화면이
                     같이 쓰는 자리라 여기가 받습니다. */
                  ["/sell","매장 내놓기"],
                  ["/assets","시설 · 집기"],["/franchise","프랜차이즈"],
                  ["/support","창업 · 폐업 지원"],["/quote","견적 요청"]]],
    ["파트너",   [["/join","파트너 입점"]]],
    ["고객지원", [["/faq","자주 묻는 질문"],["/terms","이용약관"],
                  ["/privacy","개인정보처리방침"]]]
  ];
  /* ⚠️⚠️ **이 아래 `tail` 선언을 지우지 마세요** — 밑에서 씁니다.
     인덱스로 칸을 갈아 끼우다 통째로 삼킨 적이 있습니다. `node --check`
     도 빌드도 통과하고 **푸터만 런타임에 터집니다** (빌드는 화면
     스크립트를 실행하지 않습니다). 고친 뒤에는 되읽어 확인하세요. */
  /* 시안의 맨 아랫줄 — ⚠️ "고객센터" 는 **없는 화면**이라 안 적습니다.
     대신 실제로 답이 있는 `/faq` 로 보냅니다 (절대 규칙 2 · 5). */
  /* ⚠️ 위 칸들과 **겹치지 않는 것만** 둡니다 — 같은 링크를 한
     화면에서 두 번 내면 어느 쪽이 맞는지 흐려집니다. 소개 · 약관 ·
     방침 · FAQ 는 전부 위 칸으로 올라갔습니다. */
  var tail = [["/search","통합검색"],["/my","내 기록"]];

  return '<footer class="ft"><div class="w">'+
    '<div class="ft-g">'+
      '<div class="ft-b">'+
        Logo("ft") +
        '<p>'+esc((window.AM_BRAND||{}).slogan || "")+'<br> '+
          '창업에 필요한 모든 것, 폐업에 필요한 모든 것.</p>'+
        '<a class="btn btn-nv" href="/join">업체 입점하기'+icon("arrow",16)+'</a>'+
      '</div>'+
      /* ⚠️⚠️ **머리말을 단추로 감쌉니다 — 폰에서 접기 위해서입니다.**
         링크 스물셋이 세로로 쌓이면 푸터가 **1,317px**(폰 화면 1.5개)이
         되고, 머리말 다섯 덩이가 줄줄이 지나가 **"푸터가 다섯 번
         반복된다"** 로 읽힙니다 (사장님이 그렇게 보셨습니다).
         ⚠️ 링크를 **하나도 안 뺍니다** — 푸터에서 빼면 메인을 뺀
         160개 화면에서 그리로 가는 길이 사라집니다. DOM 에 그대로
         있고 접기만 합니다 (크롤러 · 링크 검사도 그대로 봅니다).
         ⚠️ `<button>` 은 `<h4>` **안**입니다 — 반대로 넣으면 버튼의
         내용 모델(phrasing)을 어깁니다. */
      cols.map(function(c){
        return '<div class="ft-col"><h4><button type="button" class="ft-fold" '+
          'aria-expanded="true" onclick="ftFold(this)">'+
          '<span>'+esc(c[0])+'</span>'+icon("chevd",16)+'</button></h4><ul>'+
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

/* ⚠️⚠️ **`ui.js` 의 `FoldBtn` 을 쓰지 않습니다.** `admin.html` 은
   `ui.js` 를 안 읽어서, 거기 기대면 그 화면에서만 **에러 없이 조용히**
   안 돕니다 (`amGet`/`amSet` 으로 겪은 자리입니다). 여기 둡니다. */
window.ftFold = function(btn){
  var col = btn.closest(".ft-col"); if(!col) return;
  var shut = col.classList.toggle("is-fold");
  btn.setAttribute("aria-expanded", shut ? "false" : "true");
};

window.mountChrome = function(){
  var t = $("chrome-t"), b = $("chrome-b");
  if(t) t.innerHTML = Header();
  if(b) b.innerHTML = Footer() + MobileNav();
  /* ⚠️⚠️ **접는 것은 좁은 폭에서만**이고, 펼치는 규칙은 CSS 의
     `@media (max-width:900px)` **안**에 있습니다 — 넓혔을 때 저절로
     펼쳐집니다. 그 규칙을 미디어 쿼리 밖으로 내면 넓은 화면에서
     접힌 채 **펼칠 방법이 없어집니다** (이 저장소가 적어 둔 자리).
     ⚠️ JS 가 안 돌면 `is-fold` 가 안 붙어 **전부 펼쳐진 채**입니다 —
     지금과 같은 모습이라 안전합니다. */
  if(b && window.innerWidth <= 900)
    els(".ft-col", b).forEach(function(c){
      c.classList.add("is-fold");
      var f = c.querySelector(".ft-fold");
      if(f) f.setAttribute("aria-expanded", "false");
    });
  paintChrome();
  /* ⚠️ 로그인 칸은 한 번만 묻습니다 (`amAuthAsk()` 가 스스로 캐시합니다) —
     화면을 옮길 때마다 `/api/session` 을 때리지 않습니다. */
  hdAuthPaint();
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
