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
  /* ⚠️⚠️ **2026-10-29 PHONEWAY — 여섯입니다.**
     여섯 전부 **실제로 열리는 화면**입니다. 없는 주소를 메뉴에 걸면
     눌러도 빈 화면이고, 그건 지시서 §12 와 절대 규칙 5 가 금지한
     "작동하지 않는 버튼" 입니다.

     ⚠️⚠️ **일곱으로 늘리거나 이름을 길게 하지 마세요.** 넘치면
     **가로 스크롤이 나는 것이 아니라** 메뉴가 헤더 오른쪽(검색 ·
     내 기록 · CTA) 위로 **올라앉습니다** — `.gnb` 가 `min-width:0`
     이라 문서 폭은 그대로여서 가로 스크롤 검사는 영원히 통과합니다.
     그래서 AUDIT 에 `hdfit` 이 따로 있습니다. 손대실 때는 재 보세요.

     ⚠️ 앞 서비스(STOREWAY)의 메뉴 여덟은 `git show 36e953c` 에
     그대로 있습니다. */
  /* ⚠️⚠️ **2026-10-29 오렌지 시안 §3-A 의 여섯**입니다.
     ⚠️ `판매 진행 조회`(/track)가 헤더에서 내려왔습니다 — **지운
     것이 아닙니다.** 재서 확인한 갈 곳: 푸터 `판매` 칸 · 폰 아래
     네비 `진행` · 접수 완료 안내의 단추. 셋 다 그대로 열립니다. */
  /* ⚠️⚠️ **2026-10-30 최종 지시서 §2-1 의 여덟**입니다. 여덟 전부
     **실제로 열리고 실제로 무언가를 받는 화면**입니다 — 시안의 여덟 중
     `매장 찾기` 하나만 다르고, 까닭은 바로 아래에 적어 두었습니다.

     ⚠️⚠️ **`기업 매입` 과 `해외 수출` 은 같은 화면(`/biz`)의 두 입구
     입니다.** 화면을 둘로 쪼개지 않은 까닭 — 받는 칸(회사명 · 담당자 ·
     연락처 · 거래 종류 · 수량)이 글자까지 같아서, 쪼개면 **같은 내용이
     두 주소로 나가고 구글이 둘 다 무시합니다.** `?t=` 가 머리말과
     거래 종류 기본값을 바꿉니다 (옛 `/transfer?t=in|out` 과 같은 방식).

     ⚠️⚠️ **`매장 찾기` 를 넣지 않았습니다.** 지금 매장이 **0곳**이고,
     §0-8 이 "매장 수를 생성하지 않는다" 를 직접 금지합니다. 넣으면
     눌러서 빈 화면을 보시는 메뉴가 여덟 중 하나를 차지합니다
     (§0-7 "가짜 화면으로 연결하지 않는다"). 매장이 생기는 날 그 자리를
     `이용 안내` 와 바꾸시면 됩니다 — 이름만 한 줄입니다.

     ⚠️⚠️ **`고객센터` 라고 적지 않았습니다.** 시안이 그 이름을 적었지만
     전화도 채팅도 없고 **사업자 전화번호 칸조차 비어 있어서**, 그
     이름으로 오신 분이 번호를 찾다가 못 찾습니다 (2026-10-30 사장님이
     직접 정하신 자리입니다). 가는 곳은 시안과 같은 자리이고 거기 있는
     것은 자주 묻는 질문입니다. 전화 창구가 생기면 그날 `WOW_BIZ.phone`
     을 채우세요 — 화면이 그 값을 보고 전화 단추를 저절로 냅니다.

     ⚠️⚠️ **아홉으로 늘리거나 이름을 길게 하지 마세요.** 넘치면
     **가로 스크롤이 나는 것이 아니라** 메뉴가 헤더 오른쪽 위로
     **올라앉습니다** — `.gnb` 가 `min-width:0` 이라 문서 폭은 그대로여서
     가로 스크롤 검사는 영원히 통과합니다. AUDIT 의 `hdfit` 이 그
     자리이고, 손대실 때는 **재 보세요.** */
  { to:"/shop",    name:"중고폰 구매" },
  { to:"/sell",    name:"내 폰 판매" },
  { to:"/repair",  name:"수리 서비스" },
  { to:"/bid",     name:"B2B 경매" },
  { to:"/biz?t=corp",   name:"기업 매입" },
  { to:"/biz?t=export", name:"해외 수출" },
  { to:"/guide",   name:"이용 안내" },
  /* ⚠️⚠️ **"고객센터" 라고 적지 마세요** (2026-10-30 사장님이 정하셨고,
     이 저장소가 앞 서비스에서부터 못박아 둔 규칙입니다). 전화도 채팅도
     없고 사업자 전화번호 칸조차 비어 있어서, 그 이름으로 오신 분이
     **번호를 찾다가 못 찾습니다.** 시안 §3-A 가 그 이름을 적었지만
     가는 곳은 `/faq` 이고, 거기 있는 것은 자주 묻는 질문입니다.
     ⚠️ 전화 창구가 실제로 생기면 그날 `WOW_BIZ.phone` 을 채우세요 —
     화면이 그 값을 보고 전화 단추를 저절로 냅니다. 이름을 되돌리는
     것은 그때 함께 정하실 일입니다. */
  { to:"/faq",     name:"도움말" }
];

/* 폰 아래 네비 — 다섯 칸을 넘기지 마세요. 손가락이 닿는 폭이 줄고
   무엇이 중요한지가 안 보입니다. */
var MNAV = [
  /* ⚠️⚠️ 다섯 전부 실제로 열리는 화면입니다. ⚠️ 아무것도 안 켜지면
     손님은 자기가 어디 있는지 모릅니다 — MNAV_NEAR 도 같이 보세요. */
  { to:"/",      name:"홈",     icon:"home" },
  { to:"/sell",  name:"팔기",   icon:"mobile" },
  { to:"/shop",  name:"구매",   icon:"bag" },
  { to:"/track", name:"진행",   icon:"search" },
  { to:"/my",    name:"마이",   icon:"user" }
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
      '<span class="hd-lg-i" aria-hidden="true">'+icon("mobile",20)+'</span>'+
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
      /* ⚠️ 시안 §2-1 의 **판매 신청** 단추입니다. 좁은 폭에서는
         "판매 " 를 접어 `신청` 만 남습니다 — 다 적어 두면 헤더가
         360px 를 넘겨 가로 스크롤이 생깁니다 (실제로 415px 였습니다). */
      '<a class="btn btn-nv hd-cta" href="/sell" data-to="/sell">'+
        '<span class="hd-cta-w">판매 </span>신청'+icon("arrow",16)+'</a>'+
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
  /* ⚠️⚠️ **한 화면에 입구가 둘일 수 있습니다** — `기업 매입`과
     `해외 수출` 이 둘 다 `/biz` 입니다. 경로만 보면 **둘 다
     켜져서** 손님은 자기가 어디 있는지 모릅니다. 질의문자가 붙은
     칸은 **그 값까지 맞아야** 켜고, 주소에 그 값이 없으면 **첫
     칸**을 켭니다 (그 화면의 기본값이 첫 칸이라야 맞습니다). */
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
  /* ⚠️⚠️ **아무것도 안 켜지면 손님은 자기가 어디 있는지 모릅니다.**
     앞 서비스에서 화면 여섯이 아무 칸도 안 켜진 채 돌고 있었습니다 —
     새 주소를 만들 때마다 여기도 같이 보세요.
     ⚠️⚠️ **창업·폐업 주소를 "구매" 로 묶지 마세요.** 6단계에서 내릴
     주소라 어딘가에 묶어 둬야 하는데, 전에 `/shop`(중고폰 구매)에
     묶어 두었더니 **창업 준비 화면을 보고 있는데 아래 네비의 "구매"
     가 켜졌습니다** — 손님은 자기가 중고폰을 사는 중이라고 읽습니다.
     그건 아무것도 안 켜는 것보다 나쁩니다(거짓이니까요). 지금은
     **홈**으로 묶습니다 — "네비의 어느 칸도 아니다" 를 뜻하고 홈은
     그 전부의 부모입니다 (`/guide` · `/faq` · `/content` · `/tools` ·
     `/about` 이 이미 그렇게 묶여 있습니다). */
  /* ⚠️⚠️ **끝을 묶어 두세요** (`(\/|$)`). 느슨하게 `^\/sell` 로
     적었더니 **`/sell-biz`(매물 내놓기)에서 "팔기"(내 폰 팔기)가
     켜졌습니다** — 헤더에서 `to + "/"` 로 막아 둔 그 사고가 아래
     네비에만 남아 있었습니다. 먼저 맞은 줄이 이기니 접두사가 겹치는
     주소가 생길 때마다 여기를 보세요. */
  [/^\/(sell|bid|biz)(\/|$)/,                    "/sell"],
  /* ⚠️⚠️ **`/d/:id`(중고폰 상품 상세)가 아무 칸도 안 켜고 있었습니다**
     (2026-10-31 에 재서 찾았습니다). `/shop` 의 카드를 누르면 전부
     거기로 가는데 `^\/shop` 에 안 걸려서, **상품을 보는 동안 네비가
     통째로 비어** 있었습니다 — 바로 위 ⚠️⚠️ 가 적어 둔 그 사고입니다.
     ⚠️ 켜는 칸은 **구매**가 맞습니다 (그 상품이 쇼핑몰 것입니다). */
  [/^\/(shop|d)(\/|$)/,                          "/shop"],
  [/^\/(track|quote)/,                           "/track"],
  [/^\/(my|search|compare|join)/,                "/my"],
  /* ⚠️⚠️ **`/repair`(수리 서비스)도 안 켜지고 있었습니다** — 헤더
     메뉴 여덟 중 하나인데 여기 한 줄이 빠져 있었습니다.
     ⚠️ 켜는 칸은 **홈**입니다. 수리는 파는 것도 사는 것도 아니라
     "팔기" · "구매" 로 묶으면 **거짓**이 됩니다 (그건 아무것도 안
     켜는 것보다 나쁩니다 — 바로 아래 ⚠️⚠️). 네비에 수리 칸을
     만들려면 다섯을 여섯으로 늘려야 하고, 그러면 손가락이 닿는 폭이
     줄어 `AM_MNAV` 의 ⚠️ 와 부딪칩니다. */
  [/^\/(repair|guide|faq|about|terms|privacy|content|support|tools)/, "/"],
  /* 아래는 창업·폐업 시절 주소 — 6단계에서 사라집니다.
     ⚠️ 켜는 칸은 **홈**입니다 (바로 위 ⚠️⚠️ — "구매" 로 두면 거짓입니다) */
  /* ⚠️ `a/` · `s/` 는 창업·폐업 **매물 상세**입니다 — "구매"(중고폰)에
     묶으면 그것도 거짓입니다 (지금 매물 0건이라 안 보이지만, 한 건
     올라오는 날 켜집니다). */
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
  /* ⚠⚠ **여기에 `stages` · `journeys` 두 지역변수가 있었습니다 —
     계산만 되고 아무 데서도 안 쓰였습니다.** 2026-10-29 PHONEWAY
     푸터로 바뀜 때 그 둘을 내는 칸이 없어졌는데 선언만 남아 있었습니다 —
     `gu` · `amStore()` · `withEquip` 과 같은 "만들어 놓고 안 쓰는 칸"
     입니다. 지우면서 **그 둘이 내던 길이 어디로 갔는지를 재서**
     아래 `tail` 에 두 줄로 남겨 두었습니다.
     ⚠️⚠️ **그 두 줄도 2026-10-31 에 뺐습니다** (사장님 지시) — 창업 ·
     폐업 157개는 지금 `vercel.json` 이 308 로 `/` 에 보냅니다. 아래
     `tail` 선언의 주석을 보세요.
     ⚠ 되살리실 일이 생기면 `git show 36e953c:js/components/chrome.js` 에
     그때 모양 그대로 있습니다 (여정 넷 · 단계 여섯). */
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
    /* ⚠️⚠️ **2026-10-29 PHONEWAY — 다섯 칸.** 칸 수를 바꾸면
       `css/app.css` 의 `.ft-g` 도 같이 고치세요 — 안 고치면 칸이
       아래로 밀리고 브랜드 칸 옆에 화면 절반짜리 빈 자리가 남습니다
       (에러도 안 나고 가로 스크롤도 안 납니다).
       ⚠️ 여기 적은 주소는 전부 **실제로 열립니다.**
       ⚠️ 앞 서비스의 다섯 칸은 `git show 36e953c` 에 있습니다. */
    /* ⚠ 여기 "고객센터" 가 있었는데 **금지어**이고, 게다가
       아래 `고객지원` 칸의 "자주 묻는 질문" 과 **같은 주소**였습니다 —
       한 푸터에 같은 데로 가는 줄이 둘이면 어느 쪽을 쓸지가 흐려집니다. */
    [brandName(), [["/guide","이용 안내"],["/bid","경쟁입찰이란"]]],
    ["판매",     [["/sell","내 폰 팔기"],["/bid","최고가 경쟁입찰"],
                   ["/track","판매 진행 조회"]]],
    ["구매",     [["/shop","중고폰 구매"],["/shop?m=iphone","아이폰"],
                   ["/shop?m=galaxy","갤럭시"],["/shop?m=tablet","태블릿"]]],
    ["파트너",   [["/join","매입업체 입점"]]],
    ["고객지원", [["/faq","자주 묻는 질문"],["/my","내 기록"],
                   ["/terms","이용약관"],["/privacy","개인정보처리방침"]]]
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
  /* ⚠️⚠️ **창업 · 폐업으로 가던 가교 둘을 2026-10-31 에 뺐습니다**
     (사장님 지시 — "인수인계 자료들은 다 지워줘"). 전에는 여기
     `/startup`("창업 · 폐업 서비스")과 `/g/startup`("사업 단계별
     서비스") 두 줄이 창업 · 폐업 157개 화면으로 가는 **유일한 길**
     이었습니다.

     ⚠️⚠️ **길을 끊기 전에 `vercel.json` 에 redirect 를 먼저 넣었습니다**
     — 그 157개는 이미 색인돼 있어서, 길만 끊으면 북마크와 검색으로
     들어오신 분은 들어오고 사이트 안에서는 아무 데서도 안 걸리는
     꼴입니다. 지금은 **308 로 `/` 에** 보냅니다 (스물넷 패턴).

     ⚠️ 되돌리시려면 ① `vercel.json` 맨 뒤 redirect 스물넷 ②
     `js/app.js` 의 `NOINDEX_PRE` ③ 여기 두 줄을 **같이** 되살리세요.
     한쪽만 되살리면 길은 있는데 308 이 먼저 걸립니다.
     ⚠️ `check.js` 의 짝 검사가 "창업 · 폐업으로 가는 길이 화면에
     없다" 로 뒤집혀 있어서, 여기 다시 넣으면 거기서 걸립니다. */
  var tail = [["/search","통합검색"],["/my","내 기록"]];


  return '<footer class="ft"><div class="w">'+
    '<div class="ft-g">'+
      '<div class="ft-b">'+
        Logo("ft") +
        /* ⚠⚠ 둘째 줄은 **지금 사실인 것만** 적습니다. 여기에
           2026-10-29 까지 앞 서비스의 "창업에 필요한 모든 것,
           폐업에 필요한 모든 것." 이 그대로 남아 **167개 화면
           전부**에 나가고 있었습니다 — 팔레트를 바꾸면서 색만 보고
           글을 안 봤습니다 (찍어 보고 알았습니다).
           ⚠ 브랜드 이름과 한 줄은 `brand.js` 한 곳입니다 — 손으로
           적지 마세요 (이 저장소가 이름을 일곱 번 바꾸면서 다섯 번
           뒤늦게 찾은 자리입니다). */
        '<p>'+esc((window.AM_BRAND||{}).slogan || "")+'<br> '+
          '직접 매입 · 전국 업체 경쟁입찰 · 검수 완료 중고폰까지.</p>'+
        '<a class="btn btn-nv" href="/join">업체 입점하기'+icon("arrow",16)+'</a>'+
      '</div>'+
      /* ⚠️⚠️ **머리말을 단추로 감쌉니다 — 폰에서 접기 위해서입니다.**
         링크 스물셋이 세로로 쌓이면 푸터가 **1,317px**(폰 화면 1.5개)이
         되고, 머리말 다섯 덩이가 줄줄이 지나가 **"푸터가 다섯 번
         반복된다"** 로 읽힙니다 (사장님이 그렇게 보셨습니다).
         ⚠️ 링크를 **하나도 안 뺍니다** — 푸터에서 빼면 메인을 뺀
         160개 화면에서 그리로 가는 길이 사라집니다. DOM 에 그대로
         있고 접기만 합니다 (크롤러 · 링크 검사도 그대로 봅니다).
         ⚠️ `<button>` 은 머리말 **안**입니다 — 반대로 넣으면 버튼의
         내용 모델(phrasing)을 어깁니다.
         ⚠️⚠️ **h2 입니다 (h4 가 아닙니다).** 163개 화면을 재 보니
         #view 안에서 제일 깊은 제목이 **148개는 h2 · 15개는 h1**
         (프랜차이즈 열셋 · /content · /faq)입니다 — 푸터를 h4 로 두면
         문서 차례가 **163개 전부**에서 h2(또는 h1) → h4 로 건너뛰고,
         h3 으로 둬도 h1 뿐인 열다섯에서 건너뜁니다. h2 가 어디서도
         안 건너뛰는 유일한 값이고, 뜻으로도 푸터 칸은 본문 구간과
         나란한 꼭대기 묶음입니다.
         ⚠️ 전수 점검이 **`#view` 안만** 보고 있어서 이 건너뜀을
         아무도 안 보고 있었습니다 (지금은 문서 전체를 봅니다).
         ⚠️ 크기 · 색은 `css/app.css` 의 `.ft-col h2` 가 그대로
         잡습니다 — 바꾸시려면 **거기 두 줄**도 같이 고치세요. */
      cols.map(function(c){
        return '<div class="ft-col"><h2><button type="button" class="ft-fold" '+
          'aria-expanded="true" onclick="ftFold(this)">'+
          '<span>'+esc(c[0])+'</span>'+icon("chevd",16)+'</button></h2><ul>'+
          c[1].map(function(l){
            return '<li><a href="'+esc(l[0])+'">'+esc(l[1])+'</a></li>';
          }).join("")+'</ul></div>';
      }).join("")+
    '</div>'+
    /* ⚠️⚠️ **맨 아랫줄 셋을 한 덩이로 감쌉니다** (2026-10-20).
       전에는 `.ft-tail` · `.ft-role` 이 **저마다 가로줄(border-top)을
       하나씩** 들고 있어서, 푸터 하나가 화면에서는 가로줄로 갈린
       **덩이 셋**(칸 다섯 → 통합검색·내 기록 → 중개 고지 · 사업자)으로
       보였습니다 — 사장님이 "푸터가 세 번 반복된다" 고 하신 것이
       이것입니다. 재 보니 푸터는 **화면마다 정확히 하나**였고
       (`mountChrome()` 은 한 번만 돌고 `innerHTML =` 로 갈아 끼웁니다),
       늘어난 것은 DOM 이 아니라 **가로줄**이었습니다.
       ⚠️ 그래서 가로줄은 **이 감싸개 하나**가 긋습니다 — 안쪽 둘에
       다시 `border-top` 을 주면 그날 셋으로 돌아갑니다.
       ⚠️ 링크도 글도 차례도 한 글자 안 바꿨습니다. */
    '<div class="ft-end">'+
      '<ul class="ft-tail">'+tail.map(function(l){
        return '<li><a href="'+esc(l[0])+'">'+esc(l[1])+'</a></li>'; }).join("")+'</ul>'+
      /* ⚠️ 중개자라는 사실을 미리 알립니다 — 전자상거래법 제20조 제1항.
         안 알리면 제20조의2 에 따라 연대책임을 집니다. 지우지 마세요. */
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
  /* ⚠️⚠️ **칸 이름은 `js/data/site.js` 의 WOW_BIZ 것 그대로입니다.**
     2026-10-25 까지 여기가 `B.name` · `B.bizNo` · `B.mailOrderNo` ·
     `B.addr` 를 읽고 있었는데 site.js 는 `company` · `brn` ·
     `mailOrder` · `address` 입니다 — 여덟 칸을 다 채워도 푸터에는
     **대표 · 문의 · 전화 셋만** 나왔습니다 (띄워서 재서 확인). 빈 칸은
     설계상 줄째 빠지니까 화면이 멀쩡해 보이고, `/admin` 2번 칸과
     빌드 경고는 **맞는 이름**을 세기 때문에 "✅ 사업자 정보" 라고
     말합니다 — 채우고도 안 나오는 것을 아무도 못 잡는 자리였습니다
     (전자상거래법 제10조 제1항이 표시하라고 정한 네 항목입니다).
     ⚠️ 이제 `build-pages.js` 의 `checkBizFields()` 가 **WOW_BIZ 에
     없는 칸 이름을 읽으면 빌드를 멈춥니다.** */
  var rows = [
    ["상호", B.company], ["대표", B.ceo], ["사업자등록번호", B.brn],
    ["통신판매업신고", B.mailOrder], ["주소", B.address],
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
