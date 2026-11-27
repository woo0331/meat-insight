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
  /* ⚠️⚠️ 2026-11-19 홈페이지 전체 디자인 개편 (승인 6) — **여섯 + 펼침 메뉴**입니다.
     시안의 메뉴 그대로 — 창업 준비 · 매장 운영 · 매장 양도양수 · 폐업·철거 ·
     전문가 상담 · 정보·가이드. 전에 맨 위에 있던 서비스·상품 · 계산도구 · 이용 가이드 ·
     도움말 넷은 **펼침 메뉴 안으로** 들어갔습니다 (지운 것이 아닙니다 — 주소도 그대로입니다).
     ⚠️⚠️ 맨 위 칸(to)은 **그대로 누르면 그 화면**입니다 — 펼침은 덧길입니다. 폰 서랍도
     같은 목록을 씁니다 (두 곳에 적지 않습니다).
     ⚠️⚠️ 접수가 걸린 칸(form)은 **짝으로** 그립니다 — 열렸을 때만 신청 화면으로,
     닫혀 있으면 off 쪽 주소로 갑니다 (hdCtaPaint 가 data-cta 짝을 그대로 켜고 끕니다).
     닫힌 접수를 메뉴가 열어 주는 길을 만들지 마세요.
     ⚠️ 하위 주소는 전부 tools/urls.json 에 있는 것입니다 (가짜 링크 금지). */
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

/* 폰 아래 네비 — 다섯 칸을 넘기지 마세요. 손가락이 닿는 폭이 줄고
   무엇이 중요한지가 안 보입니다. */
var MNAV = [
  { to:"/",          name:"홈",       icon:"home" },
  { to:"/providers", name:"서비스",    icon:"grid" },
  { to:"/tools",     name:"계산도구",  icon:"calc" },
  { to:"/content",   name:"가이드",    icon:"book" },
  { to:"/my",        name:"내 기록",   icon:"user" }
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
/* 2026-11-22 — 악수형 심볼 (brand.js 의 mark). 글자 대신 쓰지 않고 **글자 옆**에 섭니다.
   ⚠️ 그라디언트 id 가 화면 안에서 겹치면 둘째 것이 첫째 것을 가져다 씁니다 — 자리마다 이름을 따로.
   ⚠️ 장식입니다(aria-hidden) — 이름은 바로 옆 글자와 링크의 aria-label 이 말합니다. */
function brandMark(where){
  var B = window.AM_BRAND || {};
  if(!B.mark) return "";
  var id = "bmg-" + (where || "hd");
  var st = where === "ft"
    ? '<stop offset="0" stop-color="#DCCBB5"/><stop offset="1" stop-color="#B8956D"/>'
    : '<stop offset="0" stop-color="#B8956D"/><stop offset=".55" stop-color="#7A5633"/><stop offset="1" stop-color="#6A4B3B"/>';
  return '<svg class="bmark" viewBox="'+esc(B.markBox || "0 0 500 420")+'" aria-hidden="true" focusable="false">'+
    '<defs><linearGradient id="'+id+'" x1="0" y1="0" x2="1" y2="1">'+st+'</linearGradient></defs>'+
    '<path fill="url(#'+id+')" fill-rule="evenodd" d="'+esc(B.mark)+'"/></svg>';
}
function Logo(where){
  var B = window.AM_BRAND || {}, nm = brandName();
  var mark = B.logo
    ? '<img class="lg-img" src="'+esc(B.logo)+'" alt="'+esc(nm)+'" '+
      'width="120" height="28">'
    : "";
  if(where === "ft"){
    return '<a class="lg lg-ft" href="/" aria-label="'+esc(nm)+' 홈">'+
      (mark || '<span class="lg-ft-i" aria-hidden="true">'+brandMark("ft")+'</span><b>'+esc(nm)+'</b><i>'+esc(brandSub())+'</i>')+'</a>';
  }
  /* 헤더 — 마크 타일 + 이름 + (이름과 다를 때만) 영문 작은 줄.
     ⚠️ 작은 줄은 **로고 한 덩어리 안**입니다. 떼어서 따로 내면
     그때부터 서로 다른 서비스 둘로 읽힙니다 (brand.js 의 `en`). */
  return '<a class="lg hd-lg" href="/" aria-label="'+esc(nm)+' 홈">'+
    (mark ? mark :
      '<span class="hd-lg-i" aria-hidden="true">'+(brandMark("hd") || icon("store",20))+'</span>'+
      '<span class="hd-lg-t"><b>'+esc(nm)+'</b>'+
        (logoSub() ? '<i>'+esc(logoSub())+'</i>' : '')+'</span>')+
  '</a>';
}

function Header(){
  /* ⚠️ 본문 바로가기는 `index.html` 에 이미 있습니다. 여기서 또 내면
     읽어 주는 프로그램에 같은 것이 두 번 들립니다. */
  /* ⚠️ 2026-11-18 W01 ③ — 접수 중단 띠. 밝은 면에 짙은 글자입니다 (전에는 짙은 남색
     띠라 폰 360px 첫 화면의 어두운 면이 15% 를 넘었습니다 · sweep-rest 13건).
     ⚠️ sosReady 가 켜지면 저절로 사라집니다 — 손으로 지우는 띠를 만들지 않습니다.
     재개일은 적지 않습니다 (확정되지 않았습니다). */
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
      /* 2026-11-26 모바일 — 사람 아이콘 (900px 아래에서만). 로그인 상태는 hdAuthPaint() 가 주소 · 이름을 맞춥니다.
         비로그인이고 카카오가 켜져 있으면 /my?next=<지금 자리> 로 — /my 가 로그인 칸으로 내려가고, 로그인 뒤 이 자리로 돌아옵니다. */
      /* 2026-11-27 대표 지시 — 사람 아이콘 자리를 **글자 단추**로 (모바일 · PC 모두 상단에 바로 보임).
         로그아웃 → '로그인 및 회원가입' (누르면 /my 의 '카카오로 시작하기') · 로그인 → '내 계정'.
         ⚠️ 로그인이 설정 안 된 곳(운영: 카카오 꺼짐)에서는 **안 그립니다** — 눌러도 로그인 화면이 없는 단추가 됩니다.
         그래서 처음에는 hidden 이고 amEntryPaint() 가 /api/session 답을 보고 켭니다. '내 기록' 은 따로 그대로입니다. */
      '<a class="hd-lgn" id="hdU" href="/my" hidden>'+icon("user",16)+'<span class="hd-lgn-t">로그인 및 회원가입</span></a>'+
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
      /* ⚠️⚠️ 2026-11-18 — 견적 접수 상태에 따라 둘 중 **하나만** 보입니다.
         기본은 "접수 안내"(닫힘)이고, 서버 게이트(api/_gate.js 의 quote)가
         열려 있고 화면 설정(WOW_BIZ.sosReady)도 켜져 있을 때만 "견적 신청" 으로
         바꿉니다 — `hdCtaPaint()`. 못 읽으면 닫힘 그대로입니다 (fail-closed).
         ⚠️ 태그를 바꿔 끼우지 않고 둘 다 두고 hidden 으로 가립니다 —
         `.hd-cta[hidden]{display:none}` 이 css/app.css 에 같이 있어야 합니다
         (.btn 이 inline-flex 라 작성자 CSS 가 [hidden] 을 이깁니다). */
      '<a class="btn btn-nv hd-cta hd-cta-off" href="/intake" data-cta="off">'+
        '접수 안내'+icon("arrow",16)+'</a>'+
      '<a class="btn btn-nv hd-cta hd-cta-on" href="/quote" data-to="/quote" data-cta="on" hidden>'+
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
/* 펼침 메뉴 한 칸 — 접수가 걸린 칸은 짝으로 그립니다 (열림 on · 닫힘 off).
   ⚠️ 기본은 **닫힘 쪽만** 보입니다 (on 은 hidden) — 못 읽으면 닫힘 그대로 (fail-closed). */
function gnbSub(L){
  return L.map(function(x){
    if(!x.form)
      return '<a href="'+esc(x.to)+'" data-to="'+esc(x.to)+'">'+esc(x.name)+'</a>';
    return '<a href="'+esc(x.to)+'" data-to="'+esc(x.to.split("?")[0] === "/quote" && x.form === "quote" ? "/quote" : x.to)+'" '+
        'data-cta="on" data-cta-form="'+esc(x.form)+'" hidden>'+esc(x.name)+'</a>'+
      '<a href="'+esc(x.off)+'" data-cta="off" data-cta-form="'+esc(x.form)+'">'+esc(x.offName || x.name)+'</a>';
  }).join("");
}
/* PC 펼침 — 마우스를 올리면 CSS(:hover · :focus-within)가 열고, 단추는 **누르는 손 ·
   키보드**를 위한 것입니다. 하나만 열고, Esc · 바깥 누름 · 주소 바뀜에 닫습니다. */
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
  /* ⚠️⚠️ 2026-11-19 — 폰은 **누르는 아코디언**입니다 (승인 6 · 터치형). 맨 위 이름은
     그대로 그 화면으로 가고, 옆의 단추가 하위 칸을 엽니다 (48px · aria-expanded). */
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
      '<a href="/my" id="hdDwMy">'+esc("내 기록")+icon("arrow",16)+'</a>'+
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

/* 2026-11-18 — 헤더 CTA 를 견적 접수 상태로 고릅니다.
   ⚠️⚠️ 별도 상태값을 만들지 않습니다. 둘 다 이미 있는 것입니다 —
     · 서버 접수 게이트 api/_gate.js 의 quote (/api/session 의 intake.quote)
     · 화면 설정 WOW_BIZ.sosReady (꺼져 있으면 /quote 양식이 스스로 잠깁니다)
   둘 다 켜져야 "견적 신청" 입니다. 한쪽만 보면 헤더는 열림인데 양식은 잠긴
   어긋남이 생깁니다. 서버의 접수 차단은 이것과 상관없이 그대로입니다. */
window.amQuoteOpen = function(){
  if(!(window.WOW_BIZ && WOW_BIZ.sosReady)) return Promise.resolve(false);
  if(typeof window.amAuthAsk !== "function") return Promise.resolve(false);
  return window.amAuthAsk().then(function(a){ return !!(a && a.quoteOpen); },
                                 function(){ return false; });
};
/* 2026-11-18 STOREWAY 1차 — 양식 하나의 열림 (quote · close · sell · join).
   ⚠️⚠️ 화면 설정(sosReady)과 그 양식의 서버 게이트가 **둘 다** 켜져야
   열림입니다. 매장 정리 상담(close)만 열었을 때 견적 · 매물 · 입점 단추가
   같이 열리면 안 됩니다 — 그래서 양식마다 따로 봅니다. */
window.amIntakeOpen = function(form){
  form = form || "quote";
  if(!(window.WOW_BIZ && WOW_BIZ.sosReady)) return Promise.resolve(false);
  if(typeof window.amAuthAsk !== "function") return Promise.resolve(false);
  return window.amAuthAsk().then(function(a){
    return !!(a && a.intake && a.intake[form] === true); }, function(){ return false; });
};
/* 2026-11-18 STOREWAY 1차 — 본문의 신청 단추(.btn)를 **어느 양식인지** 표시합니다.
   ⚠️⚠️ 화면마다 손으로 data-cta 짝을 다는 대신 주소로 가립니다 —
     /quote?mode=close → close · /sell → sell · /join → join · 나머지 /quote → quote.
   닫힌 양식의 단추는 CSS(html.iq-<양식>)가 가립니다 (css/app.css).
   ⚠️ 정리 분류(집기 · 철거 · 원상복구 · 폐기물 · 양도)의 폐업 쪽 견적 단추는
   매장 정리 상담 양식으로 돌립니다 — 그 화면에서 일반 견적이 닫혀 있어도
   매장 정리 상담만 열 수 있게. 이미 짝이 있는 단추(data-cta · data-go-form)는
   건드리지 않습니다. */
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
  /* data-cta 짝은 data-cta-form 으로 어느 양식인지 밝힙니다 (없으면 견적).
     data-gate 는 보내기 단추 — 열렸을 때만 풀립니다 (기본은 잠김). */
  /* ⚠️ 넷 다 늘 봅니다 — <html> 의 iq-<양식> 칸이 고르개 신청 단추
     (data-go-form)를 CSS 로 가립니다 (css/app.css). 기본은 닫힘입니다. */
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
        /* 지역 밖을 고르셨으면 열려 있어도 잠근 채입니다 (매장 정리 상담) */
        b.disabled = !open || (b.id === "cq-go" && !!document.getElementById("cq-gu") &&
                                document.getElementById("cq-gu").value === "out");
      });
      document.documentElement.classList.toggle("iq-" + f, !!open);
    });
  });
}

/* ⚠️⚠️ **로그인이 설정되기 전에는 아무것도 안 그립니다** (§0-7 ·
   절대 규칙 2 · 5). `auth:false` 면 `hidden` 인 채로 둡니다 —
   "준비 중" 도 적지 않습니다. */
/* 2026-11-26 — 로그인으로 가는 진입 셋(상단 사람 아이콘 · 메뉴 · 하단 '내 기록')을 한 곳에서 맞춥니다.
   비로그인 + 카카오 켜짐 → /my?next=<지금 자리> (로그인 칸으로 내려가고 로그인 뒤 돌아옵니다)
   로그인됨 → /my '내 계정' · 로그인 꺼짐/카카오 꺼짐 → /my '내 기록' (지금과 같음 — 없는 로그인을 내지 않습니다) */
/* 견적서에서 누르면 **지금 고른 지역 · 업종**을 돌아올 주소에 싣습니다 — 그 칸들은 주소에 없어서,
   로그인하고 돌아오면 서비스는 남는데 지역이 비었습니다 (2026-11-27 검수에서 찾음). 연락처 · 이름은 싣지 않습니다. */
function amEntryCur(){
  var p = window.location.pathname, q = new URLSearchParams(window.location.search);
  if(p === "/quote"){
    var v = function(id){ var e = document.getElementById(id); return e && e.value ? e.value : ""; };
    if(q.get("mode") === "close"){
      if(v("cq-gu")) q.set("gu", v("cq-gu")); if(v("cq-ind")) q.set("i", v("cq-ind"));
    } else {
      if(v("q-reg")) q.set("r", v("q-reg")); if(v("q-ind")) q.set("i", v("q-ind"));
    }
  }
  var qs = q.toString();
  return p + (qs ? "?" + qs : "");
}
window.amEntryCur = amEntryCur;
/* 누르는 순간 다시 맞춥니다 (그려 둔 주소는 칸을 고르기 전 것입니다) */
document.addEventListener("click", function(ev){
  var a = ev.target && ev.target.closest && ev.target.closest('#hdU, #hdDwMy, #mnav a[data-to="/my"]');
  if(a && window.amAuthNow && window.AM_AUTH_ASKED_ONCE) amEntryPaint(amAuthNow());
}, true);
function amEntryPaint(a){
  var cur = amEntryCur();
  var st = (a && a.on && a.signedIn) ? "in" : ((a && a.on && a.kakao) ? "out" : "off");
  var href = st === "out" && window.location.pathname !== "/my" ? "/my?next=" + encodeURIComponent(cur) : "/my";
  var u = document.getElementById("hdU");
  if(u){ u.setAttribute("href", st === "in" ? "/my" : href); u.setAttribute("data-auth", st);
         var t = u.querySelector(".hd-lgn-t"); if(t) t.textContent = st === "in" ? "내 계정" : "로그인 및 회원가입";
         if(st === "off") u.setAttribute("hidden", ""); else u.removeAttribute("hidden"); }
  var d = document.getElementById("hdDwMy");
  if(d){ d.setAttribute("href", href);
         d.firstChild.textContent = st === "in" ? "내 계정" : st === "out" ? "로그인 및 회원가입" : "내 기록"; }
  els('#mnav a[data-to="/my"]').forEach(function(m){ m.setAttribute("href", href); });
}
window.amEntryPaint = amEntryPaint;
function hdAuthPaint(){
  var box = document.getElementById("hdAuth");
  if(!box || typeof window.amAuthAsk !== "function") return;
  window.amAuthAsk().then(function(a){
    window.AM_AUTH_ASKED_ONCE = true;
    amEntryPaint(a);
    /* 2026-11-25 — 고객 로그인은 카카오 하나라, 카카오가 꺼져 있으면 "로그인" 칸도 안 냅니다
       (/my 에 로그인 칸이 없어 빈 화면으로 가는 링크가 됩니다). 로그인된 분의 "내 계정" 은 그대로. */
    if(!a || !a.on || (!a.signedIn && !a.kakao)){ box.setAttribute("hidden",""); box.innerHTML = ""; return; }
    box.removeAttribute("hidden");
    box.innerHTML = a.signedIn
      ? '<a class="hd-txt" href="/my">'+icon("user",18)+
          '<span>'+esc("내 계정")+'</span></a>'
      : '<a class="hd-txt" href="/my?next='+encodeURIComponent(window.location.pathname + window.location.search)+'">'+icon("user",18)+
          '<span>'+esc("로그인")+'</span></a>';
    /* 2026-11-18 — 카카오 취소 · 실패로 돌아왔으면 그 자리에서 알립니다 */
    var es = window.amAuthErrSay ? amAuthErrSay() : "";
    if(es && typeof window.toast === "function") toast(es);
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
  if(typeof window.gnbOpen === "function") window.gnbOpen(-1, false);
  /* 켜지는 맨 위 칸은 **하나**입니다 — 하위 칸이 지금 주소와 같으면 그 칸이 먼저이고
     (예: /providers/marketing → 매장 운영), 없으면 맨 위 주소가 앞에 붙는 칸입니다. */
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
    /* ⚠️ `data-to` 는 그대로 둡니다 — 지금 화면 표시가 그걸로 갈립니다.
       바꾸는 것은 `href` 하나입니다. */
    if(to === "/quote") a.setAttribute("href", gnbQuoteHref());
  });
}

function MobileNav(){
  return '<nav class="mnav" id="mnav" aria-label="아래 메뉴">'+
    MNAV.map(function(m){
      return '<a href="'+esc(m.to)+'" data-to="'+esc(m.to)+'">'+
        /* 2026-11-19 — 아이콘을 감싸는 칸(.mnav-i)이 활성 탭의 연한 파랑 배경을 받습니다. 24px · 선 2px 는 CSS 가 맞춥니다. */
        '<span class="mnav-i" data-ic="'+esc(m.icon)+'" aria-hidden="true">'+icon(m.icon,24)+'</span><span class="mnav-t">'+esc(m.name)+'</span></a>';
    }).join("")+
  '</nav>';
}

/* 지금 어느 칸인지 — ⚠️ 아래 화면들은 네비에 자기 칸이 없습니다.
   그때 제일 가까운 칸을 켜 둡니다. 아무것도 안 켜져 있으면 손님은
   자기가 어디 있는지 모릅니다. */
var MNAV_NEAR = [
  [/^\/tools/,                                   "/tools"],
  [/^\/(content|faq|about|support)/,             "/content"],
  /* 2026-11-26 — 검색 · 업체 비교는 '내 기록' 이 아니라 서비스 찾기입니다 (검색에서 '마이' 가 켜져 있었습니다) */
  [/^\/my/,                                      "/my"],
  [/^\/(search|compare|providers|p\/|c\/|g\/|quote|join|franchise|sell|stores|assets|s\/|a\/|startup|operation|transfer|closure)/, "/providers"]
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
/* 2026-11-20 — 푸터의 조사. korean.js 가 못 실렸을 때(배포 직후 요청 하나가 실패하는 경우) 여기서 멈추면
   mountChrome() 뒤의 화면 그리기가 통째로 안 돌아 본문이 안 섭니다 (운영에서 한 번 보였고 격리 환경에서 재현했습니다).
   koWith 가 있으면 그것을 쓰고, 없으면 마지막 글자의 받침만 보고 고릅니다 (koJong 과 같은 규칙 ·
   한글이 아니면 받침 없음). ⚠️ 조사를 손으로 적지 마세요 — 이름이 바뀌면 "인수인계은" 이 됩니다. */
/* 2026-11-25 — /about 의 중개자 고지(info.js)와 업종 운영 띠(journey.js)도 이 함수를 씁니다.
   korean.js 가 못 실려도 화면이 서야 하는 자리는 koWith 를 맨손으로 부르지 말고 ftWith 를 쓰세요. */
function ftWith(w, pair){
  if(typeof koWith === "function") return koWith(w, pair);
  var t = String(w || ""), c = t.charCodeAt(t.length - 1) - 0xAC00;
  return t + ((c >= 0 && c < 11172 && c % 28) ? pair.charAt(0) : pair.charAt(1));
}
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

  /* 2026-11-20 대표 확정 시안 — 푸터 위 짙은 띠 (브랜드 · 약속 셋 · 문의).
     ⚠️⚠️ 시안의 "검증된 업체 연결" · "고객센터 1588-0000 · 평일 09~18" 은 **안 씁니다** —
        검증 기능이 없고(표시광고법 제3조), 번호 · 운영시간이 확인되지 않았습니다.
        전화번호는 WOW_BIZ.phone 이 채워지면 그 값이 그대로 나오고, 비어 있으면 /faq 로 보냅니다.
     ⚠️ .ft .w **밖**에 둡니다 — 푸터를 가르는 가로줄은 .ft .w 안에서 하나라야 합니다(check.js). */
  var telNo = (typeof bizVal === "function") ? String(bizVal("phone") || "") : "";
  var band = '<div class="ft-band"><div class="w ft-bw">'+
    /* 2026-11-22 — 푸터에 실제로 보이는 브랜드 자리는 이 띠입니다(Logo("ft") 는 접혀 있습니다) · 같은 악수형 심볼 */
    '<p class="ft-bb"><span class="ft-bb-i" aria-hidden="true">'+brandMark("ft")+'</span><span class="ft-bb-t"><b>'+esc(brandName())+'</b><span>'+esc(brandSub())+'</span></span></p>'+
    [["layers","한 번에 여러 서비스","필요한 서비스를 골라 한 번에 신청"],
     ["calc","계산도구 · 가이드","비용과 준비 순서를 미리 확인"],
     ["users","창업부터 폐업까지","단계마다 필요한 서비스를 한곳에서"]].map(function(x){
      return '<p class="ft-bi">'+icon(x[0],26)+'<span><b>'+esc(x[1])+'</b><i>'+esc(x[2])+'</i></span></p>';
    }).join("")+
    (telNo ? '<a class="ft-bi ft-bc" href="tel:'+esc(telNo.replace(/[^0-9]/g,""))+'">'+icon("phone",26)+'<span><b>고객센터 '+esc(telNo)+'</b><i>전화로 문의하기</i></span></a>'
        : '<a class="ft-bi ft-bc" href="/faq">'+icon("chat",26)+'<span><b>문의 · 도움말</b><i>자주 묻는 질문 보기</i></span></a>')+
  '</div></div>';

  return '<footer class="ft">'+band+'<div class="w">'+
    '<div class="ft-g">'+
      '<div class="ft-b">'+
        Logo("ft") +
        '<p>'+esc((window.AM_BRAND||{}).slogan || "")+'<br> '+
          '창업에 필요한 모든 것, 폐업에 필요한 모든 것.</p>'+
        '<a class="btn btn-nv" href="/join" data-go-form="join">업체 입점하기'+icon("arrow",16)+'</a>'+
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
window.paintChrome = function(){ paintGnb(); paintMnav(); paintBiz();
  /* 2026-11-26 — 로그인 진입의 next 는 **지금 자리**라 화면을 옮길 때마다 다시 맞춥니다 (서버에 다시 묻지 않습니다 — 받아 둔 값) */
  if(window.amAuthNow && window.AM_AUTH_ASKED_ONCE) amEntryPaint(amAuthNow()); };

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
  hdCtaPaint();
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
