#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   화면을 찍는 자리 — 한 소스에서 **화면과 크롤러 본문을 같이** 냅니다

   ⚠️⚠️ **왜 이렇게 만드는가.** 앞 서비스에서 화면과 크롤러 본문이
   **열세 번** 어긋났습니다. 그려진 화면만 보는 검사는 **영원히
   통과**하고, 어긋난 글이 그대로 구글에 나갑니다. 여기서는 본문을
   **한 번만** 짓고 그 글자가 그대로 index.html 에 들어가므로, 둘이
   어긋날 **길이 없습니다.**

   ⚠️⚠️ 네이버 · 빙 · LLM 봇은 자바스크립트를 안 돌립니다. 본문은
   <noscript> 안도 display:none 도 아닌 **진짜 본문 자리**에 있어야
   합니다. 그래서 이 파일이 HTML 을 통째로 찍습니다.

   ⚠️ 자산 주소에 내용 값을 붙입니다 (/css/app.css?v=<sha1 앞 8>).
   이름이 안 바뀌면 손님 브라우저가 **옛 파일을 계속 씁니다** —
   "배포했는데 안 바뀐다" 는 말을 들으면 여기부터 보세요.

   돌리기   node build.js
   ════════════════════════════════════════════════════════════════════ */
var fs = require("fs"), path = require("path"), crypto = require("crypto");

/* ⚠️⚠️ **영업을 시작하는 날 이 값을 true 로 바꾸세요.**
   false 이면 모든 화면에 noindex 가 붙습니다 — 안 걷으면 새 화면이
   검색에 **조용히, 에러 없이** 안 올라갑니다. 빌드가 매번 알립니다. */
var SITE_LIVE = false;

/* ── 데이터 읽기 — 브라우저와 같은 파일을 그대로 씁니다 ────────── */
global.window = {};
["js/components/base.js","js/data/korean.js","js/data/brand.js",
 "js/data/site.js","js/data/catalog.js","js/data/regions.js",
 "js/data/providers.generated.js","js/data/providers.js",
 "js/data/reviews.generated.js","js/data/review.js",
 /* 전국 골프장 · 연습장 (0066) — ⚠️ 참은 DB 한 곳입니다
    (node tools/pull-courses.js 가 찍습니다) */
 "js/data/courses.generated.js","js/data/courses.js",
 "js/data/photos.js","js/card.js",
 "js/data/legal-terms.js","js/data/legal-privacy.js"]
  .forEach(function(f){ require("./" + f); });
/* ⚠️⚠️ **srcset 에 없는 파일을 적지 않게** — 빌드가 파일을 보고
   말해 줍니다 (브라우저는 못 봅니다). 없는 변형을 적으면 404 가
   나고 브라우저는 조용히 원본을 써서, 폰이 PC 용 파일을 받습니다. */
global.window.amPhotoHasSize = function(u){
  try{ return fs.existsSync(path.join(__dirname, String(u).replace(/^\//, ""))); }
  catch(e){ return false; }
};
/* ⚠️⚠️⚠️ **사진 주소에도 내용 값을 붙입니다** (2026-11-04 에 빠져 있는
   것을 찾았습니다). `vercel.json` 이 `/img/**` 에 **`immutable` 1년**
   캐시를 걸어 두는데, 주소가 안 바뀌면 브라우저는 **다시 물어보지도
   않습니다** — 그래서 사진을 바꿔 배포해도 이미 다녀간 손님은 1년
   동안 옛 사진을 봅니다. 코드도 배포도 멀쩡하고 화면만 옛날입니다.
   ⚠️ css · js · 아이콘에는 이미 붙어 있었는데 **사진만** 빠져 있었습니다
   (`amPhotoImg()` 가 주소를 따로 짓기 때문입니다).
   ⚠️ `ver()` 는 아래에 적혀 있지만 함수 선언이라 끌어올려집니다. */
global.window.amPhotoVer = function(u){
  return ver(String(u).split("?")[0].replace(/^\//, ""));
};

var W = global.window, esc = W.esc, icon = W.icon;

function ver(file){
  try{
    return "?v=" + crypto.createHash("sha1")
      .update(fs.readFileSync(file)).digest("hex").slice(0,8);
  }catch(e){ return ""; }
}

/* ════════════════════════════════════════════════════════════════════
   머리말 — **상단 메뉴 일곱 + 하위 메뉴** (2026-11-09 · 통합 지시서)

   ⚠️⚠️⚠️ **열에서 일곱으로 묶었습니다.** 전에는 시안의 이름 열이 한 줄에
   평평하게 서 있었고, 하위로 가는 길은 분류 화면까지 들어가야 있었습니다.
   지금은 일곱이 머리말에 서고 **그 아래 하위 메뉴가 펼쳐집니다.**

   ⚠️⚠️⚠️ **길은 하나도 안 없어졌습니다.** 지시서 §4 가 "기존 페이지 ·
   URL · 데이터를 삭제하지 않는다" 고 못박았습니다 —
     · 분류 **열 전부**가 메인의 분류 띠 · `/categories` · 푸터의
       '서비스' 칸에 그대로 있습니다
     · 머리말 일곱에 이름이 안 뜨는 분류(조인 · 중고 · 연습장)는
       **하위 메뉴**에 있습니다
     · `골프 인력 · 비즈니스` 는 일곱에도 하위에도 자리가 없습니다 —
       지시서의 하위 목록에 그 줄이 없기 때문입니다. **지우지 않았고**
       메인 띠 · `/categories` · 푸터 셋으로 그대로 들어갑니다
       (`check-links` 의 외톨이 검사가 그것을 셉니다).
   ⚠️ 주소는 **글자로 박지 않습니다** — `navHref()` 가 `amCatUrl()` ·
   `amSubUrl()` 로 짓습니다(주소를 두 곳에 지었다가 링크 예순다섯 곳이
   410 으로 갈 뻔한 그 자리).

   ⚠️⚠️ **이름은 지시서의 말 · 가는 자리는 우리 분류**입니다. 지시서가
   "메뉴 명칭이 다르면 탐색용 별칭으로 매핑하고 기존 URL · 분류를 임의로
   바꾸지 말 것" 이라고 적었습니다.

   ⚠️⚠️ **하위가 둘 이상인 자리는 쉼표**로 보냅니다 — `js/search.js` 가
   갈라 **하나라도 맞으면** 냅니다. 하나만 보내면 메뉴 이름이 "신발" 을
   말해 놓고 안 걸러 주는 꼴입니다(「골프 의류 · 신발」 · 「샤프트 · 그립
   교체」 · 「중고 매입 · 위탁」 · 「골프 정보 · 후기」 넷이 그 자리입니다).

   ⚠️⚠️⚠️ **「골프 회원권」만 새 화면입니다**(`/membership`). 지시서가
   "신규 전문관으로 구축하되 **초기에는 정보 및 상담 중심**" 이라고
   적었습니다 — 그래서 시세 · 매물 · 거래를 **담지 않습니다**:
     · 회원권 호가는 저희에게 **자료가 없습니다**. 지어내면 절대 규칙 1
       이고, 작업 기억이 "제휴가 필요한 값은 칸을 아예 안 만든다" 로
       적어 둔 바로 그 줄에 **회원권 호가**가 있습니다.
     · 그래서 분류(`AM_CATS`)로 올리지 **않았습니다** — 올리면
       `/search?cat=membership` 이 영원히 0건인 자리가 되고, 메인 분류
       띠가 열하나가 되어 마지막 줄에 구멍이 생깁니다(그 나누어떨어짐을
       `test-providers` 가 잽니다).
   ⚠️ 회원권 업체가 실제로 입점하시는 날 분류로 올립니다 — 그때 띠의
   칸 수도 같이 보세요. */
var MEMBER_URL = "/membership";

var NAV = [
  /* 지시서의 이름            우리 자리 */
  { name:"부킹 · 조인", cat:"booking", subs:[
    { name:"골프장 부킹",        cat:"booking" },
    { name:"골프 조인",          cat:"matchup" },
    /* ⚠️ 0066 의 전국 골프장 마스터는 `/search` 아래 구간입니다 —
       `pages/course.js` 가 빵부스러기에서 쓰는 주소와 **같은 자리**로
       보냅니다(두 곳이 다른 데를 가리키지 않게). */
    { name:"전국 골프장 찾기",   href:"/search#courses" },
    /* ⚠️ 날짜 × 지역 현황표는 `/cat/booking` 에 있습니다. 그 구간의
       제목이 `id="tbd-h"` 라 그 자리로 바로 내려갑니다. */
    { name:"날짜 · 지역별 현황", cat:"booking", hash:"#tbd-h" }
  ]},
  { name:"골프마켓", cat:"market", subs:[
    { name:"중고 골프장터",     cat:"used" },
    { name:"신품 골프클럽",     cat:"market", sub:"mk-club" },
    { name:"골프 의류 · 신발",  cat:"market", sub:"mk-wear,mk-shoe" },
    { name:"골프용품",          cat:"market" },
    { name:"골프 렌탈",         cat:"market", sub:"mk-rent" },
    /* ⚠️ 이 둘만 **업체가 하는 일**(`pv:true`)이라 업체찾기로 갑니다 —
       나머지 열셋은 회원끼리 쓰는 물건 종류라 매물 목록을 좁힙니다. */
    { name:"중고 매입 · 위탁",  cat:"used",   sub:"us-buyquote,us-consign" }
  ]},
  { name:"레슨 · 연습장", cat:"lesson", subs:[
    { name:"골프 레슨",      cat:"lesson" },
    /* ⚠️ "프로를 찾는다" 는 곧 **업체찾기**입니다 — 레슨으로 좁힌
       업체 목록이고, 주소는 `navHref()` 가 분류 키로 짓습니다. */
    { name:"레슨 프로 찾기", cat:"lesson", find:true },
    { name:"골프 연습장",    cat:"range" },
    { name:"스크린골프",     cat:"range",  sub:"rg-sim" }
  ]},
  { name:"골프여행", cat:"travel", subs:[
    { name:"국내 골프여행", cat:"travel", sub:"tr-home" },
    { name:"해외 골프여행", cat:"travel", sub:"tr-away" },
    { name:"골프 패키지",   cat:"travel", sub:"tr-pack" },
    { name:"골프 캠프",     cat:"travel", sub:"tr-camp" }
  ]},
  { name:"피팅 · 수리", cat:"fitting", subs:[
    { name:"골프클럽 피팅",      cat:"fitting" },
    { name:"샤프트 · 그립 교체", cat:"fitting", sub:"ft-shaft,ft-grip" },
    { name:"골프클럽 수리",      cat:"fitting", sub:"ft-mend" }
  ]},
  { name:"골프 회원권", href: MEMBER_URL, subs:[
    /* ⚠️⚠️⚠️ 다섯 다 **같은 화면의 구간**입니다 — 호가 · 매물을 담는
       화면이 아니라 "무엇을 확인하셔야 하는지" 와 상담으로 가는 길을
       적은 자리입니다. 없는 자료로 화면을 만들면 절대 규칙 1 입니다. */
    { name:"회원권 시세",     href: MEMBER_URL + "#price" },
    { name:"회원권 매수",     href: MEMBER_URL + "#buy"   },
    { name:"회원권 매도",     href: MEMBER_URL + "#sell"  },
    { name:"법인 회원권",     href: MEMBER_URL + "#corp"  },
    { name:"회원권 전문업체", href: MEMBER_URL + "#pro"   }
  ]},
  { name:"커뮤니티", cat:"community", subs:[
    { name:"자유게시판",       cat:"community", sub:"cm-open" },
    { name:"골프 질문 · 답변", cat:"community", sub:"cm-ask" },
    /* ⚠️⚠️ 「정보 · 후기」는 게시판 **넷**입니다(골프 정보 · 골프장
       후기 · 레슨 후기 · 장비 후기). 하나만 보내면 메뉴가 "후기" 를
       말해 놓고 후기를 안 냅니다 — `js/community.js` 가 쉼표를 갈라
       `cat=in.(…)` 로 보냅니다. */
    { name:"골프 정보 · 후기", cat:"community", sub:"cm-tip,cm-course,cm-lesson,cm-gear" },
    { name:"골프 동호회",      cat:"community", sub:"cm-club" }
  ]}
];

/* 주소를 짓는 자리는 **여기 하나**입니다 (하위 메뉴도 같은 함수가 씁니다) */
function navHref(n){
  if(n.href) return n.href;
  if(n.find) return "/search?cat=" + encodeURIComponent(n.cat);
  if(n.sub)  return W.amSubUrl(n.cat, n.sub);
  return W.amCatUrl(W.amCat(n.cat)) + (n.hash || "");
}

/* 메뉴 하나를 그립니다 — ⚠️⚠️ **맨 위 칸은 언제나 링크**입니다.
   단추로만 만들면 자바스크립트가 꺼진 분 · 크롤러에게는 눌러도 아무 일이
   안 나는 칸이 됩니다(절대 규칙 5 · 거르개에서 세운 그 규칙). 펼치는 것은
   **옆의 작은 단추**이고, PC 에서는 마우스를 올리거나 키보드 초점이
   들어와도 CSS 가 펼칩니다(자바스크립트 없이도 됩니다). */
function navItem(n, i){
  var id = "gm" + i;
  var top = '<a class="gnb-t" href="' + esc(navHref(n)) + '">' + esc(n.name) + '</a>';
  if(!(n.subs && n.subs.length)) return '<div class="gnb-i">' + top + '</div>';
  return '<div class="gnb-i">' + top +
    '<button class="gnb-x" type="button" aria-expanded="false" ' +
            'aria-controls="' + id + '" aria-label="' + esc(n.name) + ' 하위 메뉴">' +
      icon("down", 16) + '</button>' +
    '<div class="gnb-d" id="' + id + '">' +
      n.subs.map(function(s){
        return '<a href="' + esc(navHref(s)) + '">' + esc(s.name) + '</a>';
      }).join("") +
    '</div>' +
  '</div>';
}

function header(){
  var B = W.AM_BRAND, cut = B.enCut;
  return '<header class="hd"><div class="wrap hd-in">' +
    /* ⚠️ 로고 그림은 `js/data/brand.js` 의 `AM_BRAND.logo` 한 곳입니다 —
       지금은 임시 표식(`img/brand/logo.png`)이 들어가 있고, 진짜 로고
       파일이 오면 그 줄의 주소만 바꾸시면 머리말 · 푸터가 같이 바뀝니다.
       비우면 금색 방패 아이콘으로 떨어집니다(빈 칸을 내지 않습니다). */
    '<a class="lg" href="/" aria-label="' + esc(B.name) + ' 홈">' +
      /* ⚠️ 가로 · 세로를 **실제 모양대로** 적습니다. 네모(40x40)로
         적으면 브라우저가 그만큼 자리를 잡아 두었다가 그림이 오면
         좁아지면서 **옆의 글자가 밀립니다**(레이아웃 이동). */
      (B.logo
        ? '<img class="lg-im" src="' + esc(B.logo + ver(B.logo.replace(/^\//, ""))) +
                '" alt="" aria-hidden="true" ' +
          'width="34" height="46">'
        : '<span class="lg-mk">' + icon("shield", 38) + '</span>') +
      '<span class="lg-tx">' +
        '<span class="lg-en">' + esc(B.en.slice(0,cut)) + '<b>' + esc(B.en.slice(cut)) + '</b></span>' +
        '<span class="lg-ko">' + esc(B.name) + '</span>' +
      '</span>' +
    '</a>' +

    /* ⚠️⚠️⚠️ **햄버거는 `hidden` 으로 내보냅니다.** `js/hdmenu.js` 가
       켜질 때만 그 속성을 떼고 `.hd` 에 `nav-js` 를 붙입니다 — 그래야
       자바스크립트가 꺼진 분에게는 **지금까지와 똑같이** 메뉴 일곱이
       격자로 그대로 보입니다(단추만 내고 여는 길이 없으면 폰에서
       메뉴가 통째로 사라집니다 · 절대 규칙 5). */
    '<button class="hd-burger" type="button" hidden aria-expanded="false" ' +
            'aria-controls="gnb" aria-label="메뉴 열기">' +
      icon("menu", 24) + '</button>' +

    '<nav class="gnb" id="gnb" aria-label="주요 메뉴">' +
      NAV.map(navItem).join("") +
    '</nav>' +

    '<div class="hd-r">' +
      /* ⚠️⚠️ **시안의 오른쪽 돋보기**입니다 — 단추가 아니라 **링크**이고
         `/search` 로 갑니다. 거기에 같은 검색 칸이 있습니다. 눌러도 아무
         일이 안 나는 아이콘을 만들지 않습니다(절대 규칙 5).
         ⚠️ 아이콘만 있으면 화면 읽는 기계에 할 말이 없으므로
         `aria-label` 을 답니다. */
      '<a class="hd-sch" href="/search" aria-label="골프 서비스 · 업체 검색">' +
        icon("search", 22) + '</a>' +
      /* ⚠️ 로그인 · 회원가입 칸은 `js/hdauth.js` 가 여기 맨 앞에
         끼웁니다 (설정이 켜졌을 때만 — 절대 규칙 5). */
      '<a class="btn btn-gold btn-sm" href="/join">' + icon("store", 18) + '업체 입점하기</a>' +
    '</div>' +
  '</div>' +
  '</header>';
}

/* ⚠️⚠️ 전자상거래법 제20조 제1항 — **중개한다는 사실을 미리 알립니다.**
   고지하지 않으면 제20조의2 로 통신판매업자와 **연대책임**입니다.
   그래서 약관이 아니라 **모든 화면의 푸터**에 둡니다.

   ⚠️⚠️⚠️ **이 줄을 지우지 마세요.** 2026-11-06 에 사장님이 푸터가 길다고
   하셔서 **뒷 문장만** 뺐습니다 — "상품 · 서비스의 거래 정보 및 거래에
   관한 책임은 각 판매자(입점업체)에게 있습니다." 그 문장은 관행이고 법이
   요구하는 것은 **앞 문장**입니다(중개자이며 당사자가 아니다). 앞 문장까지
   빼면 고지가 없어져 **제20조의2 의 연대책임**이 붙습니다 — 손님이 업체와
   분쟁이 났을 때 그 손해를 우리가 같이 뭅니다.
   ⚠️ 책임의 소재는 **약관 제5조**에 그대로 남아 있습니다 (거기서 뺀 것이
   아닙니다). 분류 화면 · 업체찾기의 안내문도 그대로입니다. */
var MIDDLE_NOTICE =
  "{이름}은 통신판매중개자이며 통신판매의 당사자가 아닙니다.";

/* 사업자 정보 — ⚠️ **빈 칸은 줄째 뺍니다.** 지어내지 않습니다 (제10조). */
function bizRows(){
  var rows = [
    ["상호", "company"], ["대표자", "ceo"], ["사업자등록번호", "brn"],
    ["통신판매업 신고번호", "mailOrder"], ["주소", "address"],
    ["전화", "phone"], ["이메일", "email"], ["개인정보 보호책임자", "privacyOfficer"]
  ].filter(function(r){ return W.bizVal(r[1]); });
  if(!rows.length){
    /* ⚠️ 화면마다 한 번씩 찍으면 빌드 기록이 같은 말로 덮입니다 — 한 번만 */
    if(!bizRows.warned){
      bizRows.warned = true;
      console.warn("  ⚠️ 사업자 정보 여덟 칸이 비어 있습니다 — 영업 시작 전에 " +
                   "js/data/site.js 를 채우세요 (전자상거래법 제10조).");
    }
    return "";
  }
  return '<div class="ft-biz"><dl>' + rows.map(function(r){
    return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(W.bizVal(r[1])) + '</dd>';
  }).join("") + '</dl></div>';
}

function footer(){
  var B = W.AM_BRAND;
  var cols = [
    /* ⚠️⚠️⚠️ **열 분류를 전부 냅니다** (2026-11-08) — 머리말이 시안대로
       아홉으로 줄면서 `골프 연습장` · `골프 인력 · 비즈니스` 가 머리말에서
       빠졌습니다. 메뉴에서 빼기만 하고 길을 안 남기면 지운 것과 같습니다
       (`check-links` 의 외톨이 검사가 그것을 잡습니다). 전에는 다섯만
       냈습니다. */
    /* ⚠️⚠️ **셋째 칸은 그 줄에 붙일 class 입니다** (2026-11-08) — 분류가
       열이라 한 줄씩 쌓으면 그 칸만 400px 가 되고, 푸터 **왼쪽이 통째로
       비어** 미완성 사이트로 보입니다(찍어 보고 알았습니다 · 가로로
       밀리지도 · 글자가 작지도 않아 어떤 검사도 안 잡습니다).
       `ft-two` 가 넓은 폭에서만 두 열로 접습니다 — 폰에서는 한 열입니다. */
    ["서비스", (W.AM_CATS || []).map(function(c){
      return [W.amCatUrl(c), c.name]; }), "ft-two"],
    /* ⚠️⚠️ **업체찾기 · 매칭 요청이 여기 있어야 합니다** — 시안의
       머리말에는 그 둘이 없습니다. 길을 남기지 않으면 매칭 요청(손님이
       견적을 받는 주된 길)으로 가는 자리가 메인의 띠 하나뿐이 됩니다. */
    /* ⚠️ `골프 회원권` 은 **분류가 아니라 독립 화면**이라 위 '서비스' 칸
       (= `AM_CATS`)에 안 들어갑니다 — 그래서 여기 둡니다. 머리말 하위
       메뉴에만 두면 자바스크립트가 꺼진 폰에서 길이 한 곳뿐입니다. */
    ["이용 안내", [["/search","업체찾기"], ["/match","매칭 요청"],
                   ["/membership","골프 회원권"],
                   ["/guide","이용안내"], ["/help","고객센터"],
                   ["/join","업체 입점하기"]]],
    ["약관 · 방침", [["/terms","이용약관"], ["/privacy","개인정보처리방침"]]]
  ];
  return '<footer class="ft"><div class="wrap">' +
    '<div class="ft-top">' +
      /* ⚠️ 머리말과 **같은 표식**입니다 (3차 시안) — 로고 그림이 오면
         `AM_BRAND.logo` 한 칸으로 둘 다 바뀝니다. */
      '<div class="ft-bd">' +
        '<div class="ft-lg">' +
          (B.logo
            ? '<img class="lg-im" src="' + esc(B.logo + ver(B.logo.replace(/^\//, ""))) +
                '" alt="" aria-hidden="true" ' +
              'width="25" height="34">'
            : '<span class="lg-mk ft-mk">' + icon("shield", 32) + '</span>') +
          '<span class="lg-en" style="font-size:18px">' +
            esc(B.en.slice(0, B.enCut)) + '<b>' + esc(B.en.slice(B.enCut)) + '</b></span>' +
        '</div>' +
        '<p style="margin-top:10px;font-size:14px">' + esc(B.sub) + '</p></div>' +
      '<nav class="ft-nav" aria-label="푸터 메뉴">' + cols.map(function(c){
        /* ⚠️ h4 였다가 접근성 점검에 걸렸습니다 — 본문이 h2 까지만 쓰는데
           푸터가 h4 로 뛰면 낭독기가 "빠진 단계" 로 읽습니다. */
        return '<div' + (c[2] ? ' class="' + esc(c[2]) + '"' : '') +
          '><h2 class="ft-h">' + esc(c[0]) + '</h2><ul>' + c[1].map(function(l){
          return '<li><a href="' + esc(l[0]) + '">' + esc(l[1]) + '</a></li>';
        }).join("") + '</ul></div>';
      }).join("") + '</nav>' +
    '</div>' +
    bizRows() +
    '<p class="ft-mid">' + esc(MIDDLE_NOTICE.replace("{이름}", B.name)) + '</p>' +
    '<p class="ft-cr">&copy; ' + new Date().getFullYear() + ' ' + esc(B.name) + '</p>' +
  '</div></footer>';
}

/* ════════════════════════════════════════════════════════════════════
   화면 한 장 — 머리 · 본문 · 꼬리
   ════════════════════════════════════════════════════════════════════ */
function page(o){
  var B = W.AM_BRAND, site = W.bizVal("site") || "";
  var title = W.amTitle(o.title, o.route);
  var canon = site + (o.route === "/" ? "/" : o.route);
  /* ── 구조화 데이터 ────────────────────────────────────────
     ⚠️⚠️ **없는 별점(aggregateRating)을 넣지 마세요.** 적발되면 리치
     결과가 **통째로** 막힙니다. 후기가 쌓이면 그때 실제 배열에서
     계산해 넣습니다 — 값으로 들고 있지 않습니다.
     ⚠️ 사업자 정보가 없으면 Organization 을 **안 냅니다.** 빈 칸을
     넣으면 검색엔진에 틀린 정보를 알리는 것이 됩니다. */
  var ld = [{
    "@context":"https://schema.org", "@type":"WebSite",
    name: B.name, alternateName: B.en, url: site + "/",
    description: o.desc,
    inLanguage: "ko-KR",
    potentialAction: { "@type":"SearchAction",
      target: { "@type":"EntryPoint", urlTemplate: site + "/search?q={search_term_string}" },
      "query-input":"required name=search_term_string" }
  }];

  var org = { "@context":"https://schema.org", "@type":"Organization",
              name: B.name, alternateName: B.en, url: site + "/" };
  var oFields = 0;
  if(W.bizVal("company")){ org.legalName = W.bizVal("company"); oFields++; }
  if(W.bizVal("phone")){   org.telephone = W.bizVal("phone");   oFields++; }
  if(W.bizVal("email")){   org.email     = W.bizVal("email");   oFields++; }
  if(W.bizVal("address")){ org.address   = { "@type":"PostalAddress",
                                             streetAddress: W.bizVal("address"),
                                             addressCountry:"KR" }; oFields++; }
  if(oFields) ld.push(org);

  /* 빵부스러기 — 화면이 그린 길과 **같은 길**이어야 합니다 */
  if(Array.isArray(o.crumbs) && o.crumbs.length){
    ld.push({ "@context":"https://schema.org", "@type":"BreadcrumbList",
      itemListElement: [["홈","/"]].concat(o.crumbs).map(function(c, i){
        return { "@type":"ListItem", position: i + 1, name: c[0],
                 item: site + (c[1] === "/" ? "/" : c[1]) };
      }) });
  }
  if(o.ld) ld.push(o.ld);
  /* ⚠️ 구조화 데이터에 **없는 별점(aggregateRating)을 넣지 마세요** —
     적발되면 리치 결과가 통째로 막힙니다. 후기가 쌓이면 그때 실제
     배열에서 계산해 넣습니다. */
  return '<!doctype html>\n<html lang="ko">\n<head>\n' +
    '<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    /* ⚠️⚠️ 안드로이드 크롬 · 삼성 인터넷의 자동 다크 모드를 막습니다.
       CSS 에도 같은 선언이 있습니다 — **둘 다** 있어야 합니다. */
    '<meta name="color-scheme" content="only light">\n' +
    '<title>' + esc(title) + '</title>\n' +
    '<meta name="description" content="' + esc(o.desc) + '">\n' +
    /* ⚠️ 개인 화면(/my · /admin)은 **영업을 시작해도** 색인하지 않습니다.
       SITE_LIVE 와 따로 둡니다 — 한 칸으로 묶으면 문 여는 날 같이
       열립니다. */
    ((SITE_LIVE && !o.noindex) ? '' : '<meta name="robots" content="noindex,nofollow">\n') +
    '<link rel="canonical" href="' + esc(canon) + '">\n' +
    '<meta property="og:type" content="website">\n' +
    '<meta property="og:site_name" content="' + esc(B.name) + '">\n' +
    '<meta property="og:title" content="' + esc(title) + '">\n' +
    '<meta property="og:description" content="' + esc(o.desc) + '">\n' +
    '<meta property="og:url" content="' + esc(canon) + '">\n' +
    /* ⚠️⚠️ **탭 아이콘 — 로고를 그대로 쓰지 않았습니다.** 바탕이
       투명한 방패를 32px 탭에 그대로 넣으면 금색 테두리만 남아
       무엇인지 안 읽힙니다. 딥그린 면을 깔고 그 위에 올립니다.
       ⚠️ 주소에 내용 값을 붙입니다 — 안 붙이면 로고를 바꾸신 날
       손님 브라우저가 **옛 아이콘을 계속** 씁니다. */
    '<link rel="icon" type="image/png" sizes="32x32" href="/img/brand/icon-32.png' +
      ver("img/brand/icon-32.png") + '">\n' +
    '<link rel="apple-touch-icon" href="/img/brand/icon-180.png' +
      ver("img/brand/icon-180.png") + '">\n' +
    '<link rel="stylesheet" href="/css/tokens.css' + ver("css/tokens.css") + '">\n' +
    '<link rel="stylesheet" href="/css/app.css' + ver("css/app.css") + '">\n' +
    (W.bizVal("naverVerify")
      ? '<meta name="naver-site-verification" content="' + esc(W.bizVal("naverVerify")) + '">\n' : '') +
    (W.bizVal("googleVerify")
      ? '<meta name="google-site-verification" content="' + esc(W.bizVal("googleVerify")) + '">\n' : '') +
    ld.map(function(x){
      /* ⚠️⚠️⚠️ **JSON.stringify 는 `<` 를 안 바꿉니다.** 구조화 데이터에
         들어가는 이름 · 설명은 DB 에서 오고(업체 상호 · 골프장 이름),
         거기에 `</script>` 가 섞이면 **스크립트 자리를 빠져나갑니다** —
         `esc()` 를 지난 본문은 멀쩡한데 이 자리만 날것이었습니다
         (2026-11-07 · `test-course` 가 잡았습니다).
         ⚠️ JSON 안에서는 `\u003c` 가 **같은 글자**라 뜻이 안 바뀝니다. */
      return '<script type="application/ld+json">' +
        JSON.stringify(x)
          .replace(/</g, "\\u003c")
          .replace(/>/g, "\\u003e")
          .replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029") +
        '</script>\n';
    }).join("") +
    '</head>\n<body>\n' +
    '<a class="skip" href="#main">본문 바로가기</a>\n' +
    header() + '\n<main id="main">\n' + o.body + '\n</main>\n' + footer() + '\n' +
    /* ⚠️ 자바스크립트는 **덧대는 것**입니다. 본문은 이미 위에 다 있습니다 —
       스크립트가 안 돌아도 화면이 비지 않습니다. */
    /* ⚠️⚠️⚠️ **로그인 자리를 모든 화면에 싣습니다** (UX 검수 §8).
       전에는 `/login` 과 `/my` 가 **아무 데서도 안 이어져 있었습니다** —
       매칭 요청을 넣은 손님이 받은 견적을 보러 갈 길이 주소를 직접
       치는 것뿐이었습니다. `js/account.js` 에 머리말 자리를 그리는
       함수가 이미 있었는데, 그 파일이 /login · /my · /admin 에만
       실려 있어서 **정작 손님이 보는 화면에서는 안 돌았습니다.**
       ⚠️ 로그인이 설정되기 전(`auth:false`)에는 **아무것도 안 그립니다** —
       눌러도 아무 일이 안 나는 단추를 만들지 않습니다 (절대 규칙 5).
       ⚠️⚠️ **차례가 뜻이 있습니다**: korean(조사) → auth(세션) →
       account(머리말). 그리고 **같은 파일을 두 번 싣지 않습니다** —
       화면이 제 목록에 또 적어 두었을 수 있습니다 (두 번 실으면 그
       파일의 즉시실행이 두 번 돌아 머리말 칸이 둘이 됩니다). */
    /* ⚠️ **머리말 셋은 화면마다 쓰는 것이 없어도 싣습니다** — 그래야
       로그인 자리가 모든 화면에 뜹니다. 그 밖의 공통(brand · catalog)은
       **제 스크립트가 있는 화면에만** 싣습니다 (메인은 전에 스크립트가
       한 장도 없었습니다 — 까닭 없이 무겁게 하지 않습니다).
       ⚠️⚠️ 차례가 뜻이 있습니다 (base → auth → hdauth) · **같은 파일을
       두 번 싣지 않습니다** (두 번 실으면 즉시실행이 두 번 돕니다). */
    /* ⚠️⚠️ hdmenu — 머리말의 **하위 메뉴와 폰 햄버거**라 로그인과 상관없이
       **모든 화면**에 실립니다. 빠뜨리면 그 화면만 햄버거가 안 열리고,
       하위 메뉴가 손가락으로는 안 펼쳐집니다(PC 의 `:hover` 는 CSS 라
       그 화면도 됩니다 — 그래서 빠뜨려도 **에러가 한 줄도 안 납니다**). */
    ['/js/components/base.js','/js/auth.js','/js/hdauth.js','/js/hdmenu.js']
      .concat(o.js ? ['/js/data/brand.js','/js/data/catalog.js'] : [])
      .concat(o.js ? (Array.isArray(o.js) ? o.js : [o.js]) : [])
      .filter(function(f, i, L){ return L.indexOf(f) === i; })
      .map(function(f){ return '<script src="' + f + ver(f.replace(/^\//,"")) + '"></script>\n'; })
      .join("") +
    '</body>\n</html>\n';
}

module.exports = { page: page, header: header, footer: footer, ver: ver,
                   W: W, SITE_LIVE: SITE_LIVE };

if(require.main === module){
  var routeGuard = require("./tools/check-routes.js");

  /* ⚠️⚠️ **화면의 상태 말과 DB 의 상태 키가 같은가** — 한쪽만 고치면
     에러 없이 조용히 어긋납니다 (손님 화면에 `fee_wait` 가 영문 그대로
     찍히거나, 단추는 보이고 DB 가 거절합니다). 찍기 **전에** 멈춥니다. */
  /* ⚠️⚠️⚠️ **문 여는 날의 자물쇠 — 여기가 마지막입니다.**
     `SITE_LIVE` 를 true 로 바꾸면 noindex 가 걷히고 robots 가 열립니다.
     그런데 **사업자 정보 여덟 칸이 비어 있어도 빌드는 그냥 됐습니다** —
     경고 한 줄만 찍고 넘어갔습니다. 그대로 올리면 **사업자 정보 없이
     영업하는 꼴**이고 전자상거래법 제10조입니다.
     ⚠️ 경고는 **사람이 안 봅니다.** 빌드 기록이 길면 그 한 줄은
     묻힙니다 — 그래서 **멈춥니다.**
     ⚠️ 지어낼 수 없는 값들이라, 여기서 할 수 있는 일은 멈추는 것뿐입니다
     (빈 칸을 채워 주는 것이 아니라). */
  if(SITE_LIVE){
    var need = [
      ["company",        "상호"],
      ["ceo",            "대표자 성명"],
      ["brn",            "사업자등록번호"],
      ["mailOrder",      "통신판매업 신고번호"],
      ["address",        "사업장 주소"],
      ["phone",          "고객센터 전화"],
      ["email",          "문의 이메일"],
      ["privacyOfficer", "개인정보 보호책임자"],
      /* ⚠️ 시행일이 없으면 약관 · 방침이 **언제부터인지** 말하지
         못합니다 (화면이 그 줄을 빼 버립니다). */
      ["effective",      "약관 · 방침 시행일"]
    ].filter(function(r){ return !W.bizVal(r[0]); });
    if(need.length){
      console.error("❌ SITE_LIVE 가 true 인데 **비어 있는 칸**이 " +
                    need.length + "개 있습니다 — 올리면 사업자 정보 없이 " +
                    "영업하는 꼴입니다 (전자상거래법 제10조).");
      need.forEach(function(r){
        console.error("   · js/data/site.js 의 " + r[0] + " — " + r[1]);
      });
      console.error("   ⚠️ 지어낼 수 없는 값입니다. 채우시거나, " +
                    "SITE_LIVE 를 false 로 되돌리세요.");
      process.exit(1);
    }
  }

  var dealGuard = require("./tools/check-deal.js").run();
  if(dealGuard.bad.length){
    dealGuard.bad.forEach(function(m){ console.error("❌ " + m); });
    process.exit(1);
  }
  var cat  = require("./pages/category.js");
  var home = require("./pages/home.js");
  var list = require("./pages/categories.js");
  /* ⚠️ `notfound` 는 루트의 **404.html** 로 나갑니다 (그 파일 머리말) —
     목록에는 다른 화면과 같이 두어 제목 겹침 · 주소 검사 · 접근성 ·
     전수 점검이 **똑같이** 보게 합니다. */
  var flat = ["guide", "help", "join", "search", "match", "login", "my", "admin",
               "desk", "terms", "privacy", "membership", "notfound"].map(function(n){
    return require("./pages/" + n + ".js").build();
  });

  /* ⚠️⚠️ **업체가 쓰는 하위 키가 진짜인지 먼저 봅니다.** 분류 키를
     적었거나 오타가 나면 그 업체만 **조용히 아무 데도 안 뜹니다** —
     에러도 404 도 안 납니다 (0016 머리말이 적어 둔 자리).
     ⚠️ 자료는 DB 에서 나오므로, 여기서 멈추면 DB 를 고쳐야 합니다. */
  var provs = W.amProviders();
  var subBad = [];
  provs.forEach(function(p){
    (Array.isArray(p.subs) ? p.subs : []).forEach(function(k){
      if(!W.amSub(k)) subBad.push(p.id + " 의 subs 에 '" + k + "' — 그런 하위가 없습니다");
    });
    if(!(Array.isArray(p.subs) && p.subs.length))
      subBad.push(p.id + " 에 subs 가 비었습니다 — 아무 분류에도 안 뜹니다");
  });
  if(subBad.length){
    subBad.forEach(function(m){ console.error("❌ " + m); });
    process.exit(1);
  }

  /* ⚠️⚠️ **후기가 가리키는 업체가 자료에 있는가.** 두 파일
     (providers.generated.js · reviews.generated.js)은 DB 에서 **따로**
     나옵니다 — 한쪽만 다시 가져오면 어긋나고, 그러면 그 후기는
     **아무 화면에도 안 뜨면서 평균에는 안 들어갑니다** (에러도 안 납니다).
     ⚠️ 조용히 거르지 않고 멈춥니다. 고치는 법은 한 줄입니다:
        node tools/pull-providers.js && node tools/pull-reviews.js
     ⚠️ 평점이 1~5 밖인 줄도 여기서 멈춥니다 — amRating() 이 안 세고
     넘기지만, 세지 않은 줄이 파일에 있다는 것 자체가 고장입니다. */
  var byId = {};
  provs.forEach(function(p){ byId[p.id] = 1; });
  var rvBad = [];
  W.amReviews().forEach(function(v){
    if(!byId[v.provider_id])
      rvBad.push("후기 " + v.id + " 가 '" + v.provider_id +
                 "' 를 가리키는데 업체 자료에 없습니다");
    if(!(Number(v.rating) >= 1 && Number(v.rating) <= 5))
      rvBad.push("후기 " + v.id + " 의 별점이 1~5 밖입니다 (" + v.rating + ")");
  });
  if(rvBad.length){
    rvBad.forEach(function(m){ console.error("❌ " + m); });
    console.error("   ⚠️ node tools/pull-providers.js && node tools/pull-reviews.js");
    process.exit(1);
  }

  /* ⚠️⚠️ **네 영역이 열 분류를 빠짐없이 한 번씩 덮는가** (2차 지시서 §4).
     빠지면 그 분류는 메인에서 길이 하나 줄고, 겹치면 같은 분류가 두 번
     나옵니다 — 둘 다 에러 없이 조용합니다. */
  var zSeen = {}, zBad = [];
  (W.AM_ZONES || []).forEach(function(z){
    (z.cats || []).forEach(function(k){
      if(!W.amCat(k)) zBad.push(z.key + " 영역이 가리키는 '" + k + "' 분류가 없습니다");
      else if(zSeen[k]) zBad.push("'" + k + "' 분류가 영역 둘에 들어 있습니다");
      else zSeen[k] = 1;
    });
  });
  (W.AM_CATS || []).forEach(function(c){
    if(!zSeen[c.key]) zBad.push("'" + c.key + "' 분류가 **어느 영역에도** 없습니다");
  });
  if(zBad.length){ zBad.forEach(function(m){ console.error("❌ " + m); }); process.exit(1); }

  var prov = require("./pages/provider.js");
  /* ⚠️⚠️ **골프장 화면은 자료가 있을 때만 찍힙니다** (0066). 0곳이면
     한 장도 안 찍고, 그게 맞습니다 — 없는 골프장 주소를 만들어 두면
     손님이 눌러서 빈 화면을 봅니다 (절대 규칙 2 · 5).
     ⚠️ 참은 DB 한 곳입니다: node tools/pull-courses.js */
  var crs   = require("./pages/course.js");
  var cours = W.amCourses();
  /* ⚠️ slug 가 겹치면 **한 화면이 다른 화면을 덮어씁니다** (에러 없이
     조용히). pull-courses 도 보지만 손으로 넣는 날을 위해 여기서도 봅니다. */
  var csSeen = {}, csBad = [];
  cours.forEach(function(c){
    if(!c.slug) csBad.push((c.name || "이름 없음") + " 에 slug 가 없습니다");
    else if(csSeen[c.slug]) csBad.push("골프장 slug 가 겹칩니다 — " + c.slug);
    else csSeen[c.slug] = 1;
  });
  if(csBad.length){ csBad.forEach(function(m){ console.error("❌ " + m); }); process.exit(1); }

  var built = [home.build(), list.build()]
    .concat(W.AM_CATS.map(function(c){ return cat.build(c); }))
    .concat(flat)
    .concat(provs.map(function(p){ return prov.build(p); }))
    .concat(cours.map(function(c){ return crs.build(c); }));

  /* ⚠️⚠️ 찍기 전에 **주소가 vercel.json 에 잡아먹히는지** 먼저 봅니다.
     걸리면 저장소에는 파일이 멀쩡한데 손님에게는 410 이 나갑니다 —
     로컬에서는 영원히 안 보이는 고장입니다. */
  var eaten = built.map(function(b){
    return { r: b.route, hit: routeGuard.swallows(b.route) };
  }).filter(function(x){ return x.hit; });
  if(eaten.length){
    eaten.forEach(function(x){
      console.error("❌ " + x.r + " 은 vercel.json 의 '" + x.hit.s + "' 에 걸려 " +
                    x.hit.d + " 로 갑니다");
    });
    process.exit(1);
  }

  var wrote = {};
  built.forEach(function(b){
    /* ⚠️⚠️ `b.file` 은 **404 전용**입니다 — Vercel 은 없는 주소에
       **출력 루트의 `404.html`** 을 냅니다. `404/index.html` 에 두면
       `/404` 로 직접 들어갈 때만 보이고 정작 없는 주소에서는 안 나옵니다.
       ⚠️ 아래 "찍지 않은 화면 지우기" 는 `index.html` 만 훑으므로
       이 파일은 쓸려 나가지 않습니다. */
    var file = b.file ? b.file
             : b.route === "/" ? "index.html"
             : b.route.replace(/^\//, "") + "/index.html";
    wrote[file] = 1;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, page(b));
  });

  /* ⚠️⚠️⚠️ **찍지 않은 HTML 이 저장소에 남아 있나.**
     2026-11-03 에 `tools/test-providers.js` 가 검사용 씨앗으로 찍은
     **없는 업체의 화면 두 장**(`/pro/green-pt` · `/pro/xss-test`)이
     커밋에 그대로 들어가 있었습니다. 검사는 자료 파일(`providers.
     generated.js`)만 사본으로 되돌리고 **찍힌 HTML 은 안 지웠습니다.**
     사이트맵에도 routes.json 에도 없어서 링크 검사 · 주소 검사가
     전부 초록이었는데, Vercel 은 **저장소의 파일을 그대로 섬깁니다** —
     올렸으면 `/pro/green-pt` 가 **없는 회사를 광고**하고 있었을
     것입니다 (절대 규칙 1 · 표시광고법 제3조).
     ⚠️ 그래서 빌드가 **제가 안 찍은 index.html 을 지웁니다.** 지운 것을
     말하고 지나갑니다 — 조용히 지우면 손으로 둔 화면이 사라진 것을
     아무도 모릅니다. ⚠️ 이 자리는 빌드의 출력 폴더입니다. 손으로 쓴
     화면을 두시려면 `build.js` 가 찍게 하세요. */
  var SKIPDIR = ["node_modules", ".git", "db", "tools", "js", "css", "pages",
                 "api", "img", ".github", ".vercel"];
  var orphan = [];
  (function sweep(dir){
    fs.readdirSync(dir).forEach(function(f){
      var full = path.join(dir, f);
      var rel = path.relative(".", full);
      if(dir === "." && SKIPDIR.indexOf(f) >= 0) return;
      if(f.charAt(0) === "." && dir === ".") return;
      var st = fs.statSync(full);
      if(st.isDirectory()) return sweep(full);
      if(f !== "index.html") return;
      if(!wrote[rel]) orphan.push(rel);
    });
  })(".");
  orphan.forEach(function(f){
    fs.unlinkSync(f);
    /* 빈 폴더까지 치웁니다 — 남겨 두면 다음 빌드가 또 돌 때 조용합니다 */
    var d = path.dirname(f);
    while(d !== "." && fs.existsSync(d) && fs.readdirSync(d).length === 0){
      fs.rmdirSync(d); d = path.dirname(d);
    }
    console.warn("  ⚠️ 찍지 않은 화면을 지웠습니다 — /" +
                 f.replace(/\/index\.html$/, "").replace(/^index\.html$/, ""));
  });

  /* 같은 제목이 둘이면 검색엔진이 둘 다 흘립니다 — 빌드에서 멈춥니다 */
  var seen = {}, dup = [];
  built.forEach(function(b){
    var t = W.amTitle(b.title, b.route);
    if(seen[t]) dup.push(t + "  (" + seen[t] + " · " + b.route + ")");
    seen[t] = b.route;
  });
  if(dup.length){ dup.forEach(function(d){ console.error("❌ 제목이 겹칩니다: " + d); }); process.exit(1); }

  /* 찍은 주소를 적어 둡니다 — 전수 점검이 인자 없이 돌 때 이것을 읽습니다.
     ⚠️ 주소가 **사라지는** 것도 여기서 보입니다 (전 목록과 견주세요). */
  /* ⚠️ 한 파일에 둡니다 — 두 곳에 적으면 한쪽만 고쳐서 어긋납니다.
     unlinked 는 **일부러 아무 데서도 안 거는** 화면입니다 (로그인 자리는
     자바스크립트가 넣고, 관리자는 메뉴에 두지 않습니다). */
  fs.writeFileSync("tools/routes.json", JSON.stringify({
    routes:   built.map(function(b){ return b.route; }),
    unlinked: built.filter(function(b){ return b.unlinked; })
                   .map(function(b){ return b.route; })
  }, null, 2) + "\n");

  /* ── 사이트맵 · robots (지시서 9번) ──────────────────────────
     ⚠️⚠️ **주소 목록은 여기 한 곳에서 나옵니다.** 손으로 적은 사이트맵은
     화면을 지우거나 늘린 날 조용히 어긋납니다 — 검색엔진이 없는 주소를
     긁고, 새 주소는 영영 모릅니다.
     ⚠️ 개인 화면(noindex)은 **빼고** 적습니다. 사이트맵에 넣고 noindex 를
     거는 것은 "오라고 해 놓고 보지 말라" 는 말이라 둘 다 손해입니다.
     ⚠️⚠️ SITE_LIVE 가 false 면 robots 가 **전부 막습니다.** 문 열기 전에
     긁히면 "준비 중" 화면이 검색 결과에 박힙니다. */
  var site = W.bizVal("site") || "";
  var pub  = built.filter(function(b){ return !b.noindex; });
  var day  = new Date().toISOString().slice(0, 10);

  fs.writeFileSync("sitemap.xml",
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    pub.map(function(b){
      return "  <url><loc>" + site + (b.route === "/" ? "/" : b.route) + "</loc>" +
             "<lastmod>" + day + "</lastmod>" +
             "<changefreq>" + (b.route === "/" ? "daily" : "weekly") + "</changefreq>" +
             "<priority>" + (b.route === "/" ? "1.0" : "0.7") + "</priority></url>";
    }).join("\n") + "\n</urlset>\n");

  fs.writeFileSync("robots.txt", SITE_LIVE
    ? ("User-agent: *\n" +
       "Allow: /\n" +
       /* 개인 화면은 긁지 않게 — 사이트맵에도 없습니다 */
       built.filter(function(b){ return b.noindex; })
            .map(function(b){ return "Disallow: " + b.route + "\n"; }).join("") +
       "\nSitemap: " + site + "/sitemap.xml\n")
    : ("# 아직 문을 열기 전입니다 — 전부 막습니다.\n" +
       "# 영업을 시작하는 날 build.js 의 SITE_LIVE 를 true 로 바꾸면\n" +
       "# 이 파일이 Allow 로 다시 찍힙니다.\n" +
       "User-agent: *\n" +
       "Disallow: /\n"));

  console.log("사이트맵 " + pub.length + "개 주소 · robots " +
              (SITE_LIVE ? "열림" : "전부 막음"));
  console.log("업체 " + provs.length + "곳 (" + (W.AM_PROVIDERS_AT || "?") + ")" +
              (provs.length ? "" : " — 0곳이라 화면이 0곳이라고 말합니다"));

  console.log("화면 " + built.length + "장 찍었습니다 — " +
              built.map(function(b){ return b.route; }).join(" "));
  if(!SITE_LIVE)
    console.warn("  ⚠️⚠️ SITE_LIVE 가 false 입니다 — 모든 화면에 noindex 가 붙습니다. " +
                 "영업을 시작하는 날 build.js 에서 true 로 바꾸세요.");
}
