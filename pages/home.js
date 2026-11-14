/* ════════════════════════════════════════════════════════════════════
   메인 화면 — 「예약 검색 우선형」 확정 시안 (docs/spec/00-main.webp · 2026-11-14)

   차례는 시안 그대로입니다 —
     ① 히어로 + 찾는 칸(골프장 부킹 · 골프 조인 · 골프장 정보)
     ② 띠 「골프의 모든 순간을, 한곳에서.」
     ③ 어떤 골프를 찾으세요? (분류 열 칸)
     ④ 지금, 나에게 필요한 골프 (사진 카드 셋)
     ⑤ 어디에서 라운드할까요? (지역별 골프장 정보로 가는 길)
     ⑥ 골프 이야기가 모이는 곳 (커뮤니티 · 조인)
     ⑦ 띠 「골프 사업의 다음 기회」 (입점)
     ⑧ 찾고, 비교하고, 연결하세요
     → 푸터 · 폰 바닥 메뉴

   ⚠️⚠️ **여기 적는 글이 곧 구글에 나가는 글입니다** — 지킬 수 없는 말을
   적으면 그대로 거짓말이 됩니다(절대 규칙 5).
   ⚠️⚠️ **지어낸 업체 · 상품 · 숫자를 한 줄도 넣지 않습니다**(절대 규칙 1).
   시안의 사진은 디자인 예시입니다 — 여기서는 저장소에 이미 있는, 상표를
   확인한 분류 사진만 씁니다(`js/data/photos.js`).
   ⚠️ 새 기능을 만들지 않았습니다 — 찾는 칸은 **주소만 짓고** 받는 쪽은
   이미 있는 `/cat/booking`(`rg` · `d` · `t`) · `/cat/matchup`(`rg` · `d`) ·
   골프장 정보 탭(`?tab=course` · `rg` · `q`)입니다.
   ════════════════════════════════════════════════════════════════════ */
var W = global.window, esc = W.esc, icon = W.icon;

function catUrl(k){ var c = W.amCat ? W.amCat(k) : null; return c ? W.amCatUrl(c) : "/categories"; }
/* 골프장 정보 탭으로 가는 주소 — ⚠️ 한 곳에서 짓습니다 */
function courseUrl(rg){
  return catUrl("booking") + "?tab=course" + (rg ? "&rg=" + encodeURIComponent(rg) : "");
}

/* ── ① 히어로 + 찾는 칸 ─────────────────────────────────────────────
   ⚠️⚠️ **양식(form)입니다** — 자바스크립트가 꺼져도 GET 으로 `/cat/booking`
   에 갑니다. 켜져 있으면 `js/homefind.js` 가 날짜 칩을 세우고, 탭에 따라
   보내는 곳과 칸을 바꿉니다.
   ⚠️⚠️ **날짜 칩은 빌드가 찍지 않습니다** — 찍으면 배포한 날의 날짜가
   굳습니다. 빌드는 날짜 고르개(`input type=date`)만 냅니다.
   ⚠️ 탭은 **링크**입니다(자바스크립트가 꺼진 분 · 봇에게 눌러도 아무 일이
   안 나는 칸이 되지 않게 — 절대 규칙 5). */
function hero(){
  var ph = W.amPhoto ? W.amPhoto("hero") : null;
  var Z = W.AM_REGION_ZONES || [];
  var B = W.AM_TEE_BAND || [];
  var tab = function(k, href, ic, name, on){
    return '<a class="hm-tab' + (on ? " on" : "") + '" data-hmtab="' + k + '" href="' +
      esc(href) + '"' + (on ? ' aria-current="true"' : "") + '>' +
      icon(ic, 20) + '<span>' + esc(name) + '</span></a>';
  };
  return '<section class="hm-hero' + (ph ? " hm-hero-ph" : "") + '">' +
    (ph ? W.amPhotoImg("hero", { cls:"hm-hero-bg", eager:true }) : "") +
    '<div class="wrap hm-hero-in">' +
      '<h1 class="hm-h1">오늘의 라운드, <b>여기서 시작하세요</b></h1>' +
      '<form class="hm-find" id="hmfind" method="get" action="' + esc(catUrl("booking")) + '">' +
        '<nav class="hm-tabs" aria-label="무엇을 찾으시나요">' +
          tab("booking", catUrl("booking"), "cal",  "골프장 부킹", true) +
          tab("join",    catUrl("matchup"), "flag", "골프 조인",  false) +
          tab("course",  courseUrl(""),     "pin",  "골프장 정보", false) +
        '</nav>' +
        '<div class="hm-days" id="hmdays">' +
          '<label class="hm-date" for="hm-d">' + icon("cal", 18) +
            '<span>날짜 선택</span>' +
            '<input id="hm-d" name="d" type="date"></label>' +
        '</div>' +
        /* 골프장 정보 탭에서만 쓰는 칸 — ⚠️ 처음에는 **꺼 둡니다**(disabled 는
           보내지 않습니다). 자바스크립트가 없으면 이 탭은 링크로 갑니다. */
        '<input type="hidden" name="tab" value="course" disabled data-hmonly="course">' +
        '<div class="hm-q" data-hmonly="course" hidden>' +
          '<label class="sr" for="hm-q">골프장 이름</label>' +
          '<input id="hm-q" name="q" type="search" maxlength="40" disabled ' +
            'placeholder="골프장 이름 · 지역으로 찾기"></div>' +
        '<div class="hm-row">' +
          '<div class="hm-sel" data-hmhide="course">' + icon("pin", 18) +
            '<label class="sr" for="hm-rg">지역</label>' +
            '<select id="hm-rg" name="rg"><option value="">지역 전체</option>' +
            Z.map(function(z){
              return '<option value="' + esc(z.key) + '">' +
                esc(W.amZoneLong ? W.amZoneLong(z.key) : z.name) + '</option>';
            }).join("") + '</select></div>' +
          (B.length
            ? '<div class="hm-sel" data-hmhide="join course">' + icon("clock", 18) +
              '<label class="sr" for="hm-t">시간대</label>' +
              '<select id="hm-t" name="t"><option value="">전체 시간</option>' +
              B.map(function(b){
                return '<option value="' + esc(b.key) + '">' + esc(b.name) +
                  ' ' + esc(b.lead) + '</option>';
              }).join("") + '</select></div>'
            : '') +
          '<button type="submit" class="btn btn-pt hm-go">' + icon("search", 20) +
            '<span id="hm-go-t">티타임 찾기</span></button>' +
        '</div>' +
        /* ⚠️⚠️ 시안의 이 한 줄은 **우리 코드의 참**입니다 — 신청은 `applied`
           로 들어가고 확정은 업체만 합니다(0060). 탭마다 맞는 말로 바꿉니다. */
        '<p class="hm-note" id="hm-note">' + icon("info", 16) +
          '<span>예약 신청 후 업체 확인을 거쳐 확정됩니다</span></p>' +
      '</form>' +
    '</div>' +
  '</section>';
}

/* ── ② 띠 — 골프의 모든 순간을, 한곳에서. ─────────────────────────── */
function band(){
  var bp = W.amPhoto ? W.amPhoto("match-banner") : null;
  return '<section class="sec hm-s"><div class="wrap">' +
    '<div class="hm-band' + (bp ? " hm-band-ph" : "") + '">' +
      (bp ? W.amPhotoImg("match-banner", { cls:"hm-band-bg" }) : "") +
      '<div class="hm-band-t">' +
        '<p class="hm-kick">YOUR GOLF, ALL IN ONE</p>' +
        '<h2>골프의 모든 순간을, <b>한곳에서.</b></h2>' +
        '<p>라운드부터 장비, 레슨과 여행까지. 나에게 맞는 골프를 찾아보세요.</p>' +
        '<p class="hm-band-go">' +
          '<a class="btn btn-pt" href="/categories">골프 서비스 찾기' + icon("arrow", 18) + '</a>' +
          '<a class="hm-link" href="' + esc(courseUrl("")) + '">골프장 둘러보기' + icon("arrow", 18) + '</a>' +
        '</p>' +
      '</div>' +
    '</div>' +
  '</div></section>';
}

/* ── ③ 어떤 골프를 찾으세요? ───────────────────────────────────────
   ⚠️⚠️ 이름 · 아이콘 · 주소는 `AM_CATS` 한 곳에서 옵니다 — 두 벌로 적으면
   분류를 고치는 날 한쪽만 바뀝니다. */
function cats(){
  return '<section class="sec hm-s" aria-labelledby="hm-cat-h"><div class="wrap">' +
    '<h2 class="hm-h2" id="hm-cat-h">어떤 골프를 찾으세요?</h2>' +
    '<div class="hm-cats">' + (W.AM_CATS || []).map(function(c){
      return '<a class="hm-cat" href="' + esc(W.amCatUrl(c)) + '">' +
        '<span class="hm-cat-ic">' + icon(c.icon, 30) + '</span>' +
        '<span class="hm-cat-n">' + esc(c.name) + '</span></a>';
    }).join("") + '</div>' +
  '</div></section>';
}

/* ── ④ 지금, 나에게 필요한 골프 ────────────────────────────────────
   ⚠️⚠️ **개인화 추천이 아닙니다** — 모든 분께 같은 세 장이고, 누가 무엇을
   보셨는지 세지 않습니다. 그래서 「추천」 이라는 말을 쓰지 않습니다
   (절대 규칙 5 · 표시광고법 제3조). 제목은 시안 글자 그대로입니다. */
function needs(){
  var one = function(k, ph, cls, title, lead, cta){
    var has = W.amPhoto ? W.amPhoto(ph) : null;
    return '<a class="hm-need ' + cls + (has ? " hm-need-ph" : "") + '" href="' +
      esc(catUrl(k)) + '">' +
      (has ? W.amPhotoImg(ph, { cls:"hm-need-bg" }) : "") +
      '<span class="hm-need-t"><b>' + title + '</b>' +
        (lead ? '<span class="hm-need-l">' + esc(lead) + '</span>' : "") +
        (cta ? '<span class="btn btn-sm btn-pt hm-need-c">' + esc(cta) + icon("arrow", 16) + '</span>' : "") +
      '</span>' +
      (cta ? "" : '<span class="hm-need-go" aria-hidden="true">' + icon("arrow", 18) + '</span>') +
    '</a>';
  };
  return '<section class="sec hm-s" aria-labelledby="hm-need-h"><div class="wrap">' +
    '<h2 class="hm-h2" id="hm-need-h">지금, 나에게 필요한 골프</h2>' +
    '<div class="hm-needs">' +
      one("used", "cat-used", "hm-need-big", "장비를 바꾸는<br>더 좋은 방법",
          "중고장터 · 매입 · 위탁", "중고장터 둘러보기") +
      one("lesson", "cat-lesson", "", "나에게 맞는<br>레슨 찾기", "", "") +
      one("travel", "cat-travel", "", "다음 여행은<br>골프로", "", "") +
    '</div>' +
  '</div></section>';
}

/* ── ⑤ 어디에서 라운드할까요? ───────────────────────────────────────
   ⚠️⚠️ 누르면 **골프장 정보 탭**(`/cat/booking?tab=course`)이 그 지역으로
   좁혀져 열립니다 — 합의한 골프장 찾기 화면입니다.
   ⚠️⚠️ 지역이 둘 이상인 칸은 **쉼표**로 보냅니다(경기 · 인천 · 충청) —
   받는 쪽(`amCoursePickCards`)이 쉼표를 갈라 읽습니다.
   ⚠️ 사진은 **그 지역 사진이 아닙니다** — 분위기를 위한 골프장 풍경이라
   `alt` 를 비우고(장식) 이름표가 지역을 말합니다. */
var RG = [
  { name:"경기 · 인천", rg:"gyeonggi,incheon", ph:"cat-booking" },
  { name:"강원",        rg:"gangwon",          ph:"zone-play" },
  { name:"충청",        rg:"chungbuk,chungnam", ph:"cat-matchup" },
  { name:"제주",        rg:"jeju",             ph:"cat-travel" }
];
function where(){
  return '<section class="sec hm-s" aria-labelledby="hm-rg-h"><div class="wrap">' +
    '<div class="hm-hd"><h2 class="hm-h2" id="hm-rg-h">어디에서 라운드할까요?</h2>' +
      '<p class="hm-sub">지역별 골프장 정보와 공식 홈페이지를 확인하세요.</p>' +
      '<a class="btn btn-sm btn-line hm-all" href="' + esc(courseUrl("")) + '">전국 골프장 보기' +
        icon("arrow", 16) + '</a></div>' +
    '<div class="hm-rgs">' + RG.map(function(r){
      var has = W.amPhoto ? W.amPhoto(r.ph) : null;
      return '<a class="hm-rg' + (has ? " hm-rg-ph" : "") + '" href="' + esc(courseUrl(r.rg)) + '">' +
        (has ? W.amPhotoImg(r.ph, { cls:"hm-rg-bg", alt:"" }) : "") +
        '<span class="hm-rg-n">' + esc(r.name) + icon("arrow", 16) + '</span></a>';
    }).join("") + '</div>' +
  '</div></section>';
}

/* ── ⑥ 골프 이야기가 모이는 곳 ─────────────────────────────────────
   ⚠️ 게시판 키는 `AM_CATS` 의 커뮤니티 하위입니다(`cm-ask` · `cm-course` ·
   `cm-gear`) — 받는 쪽(`js/community.js`)이 쉼표를 갈라 읽습니다. */
function story(){
  var cu = catUrl("community");
  var one = function(href, ic, t, l){
    return '<a class="hm-st" href="' + esc(href) + '">' +
      '<span class="hm-st-ic">' + icon(ic, 26) + '</span>' +
      '<span class="hm-st-t"><b>' + esc(t) + '</b><span>' + esc(l) + '</span></span>' +
      '<span class="hm-st-go" aria-hidden="true">' + icon("arrow", 16) + '</span></a>';
  };
  return '<section class="sec hm-s" aria-labelledby="hm-st-h"><div class="wrap">' +
    '<h2 class="hm-h2" id="hm-st-h">골프 이야기가 모이는 곳</h2>' +
    '<div class="hm-sts">' +
      one(cu + "?s=cm-ask", "chat", "궁금한 건 물어보세요", "질문 · 답변") +
      one(catUrl("matchup"), "people", "함께 라운드해요", "골프 조인") +
      one(cu + "?s=cm-course,cm-gear", "swing", "경험을 나눠주세요", "라운드 · 장비 이야기") +
      '<a class="btn btn-pt hm-st-all" href="' + esc(cu) + '">커뮤니티 가기' + icon("arrow", 18) + '</a>' +
    '</div>' +
  '</div></section>';
}

/* ── ⑦ 띠 — 골프 사업의 다음 기회 ──────────────────────────────── */
function biz(){
  var pp = W.amPhoto ? W.amPhoto("partner-banner") : null;
  return '<section class="sec hm-s"><div class="wrap">' +
    '<div class="hm-biz' + (pp ? " hm-biz-ph" : "") + '">' +
      (pp ? W.amPhotoImg("partner-banner", { cls:"hm-biz-bg" }) : "") +
      '<div class="hm-biz-t">' +
        '<h2>골프 사업의 다음 기회,<br><b>' + esc(W.AM_BRAND.name) + '에서.</b></h2>' +
        '<p>프로 · 연습장 · 골프샵 · 여행사</p>' +
      '</div>' +
      '<p class="hm-biz-go">' +
        '<a class="btn btn-pt" href="/join">업체 · 프로 등록하기' + icon("arrow", 18) + '</a>' +
        '<a class="btn btn-ghost" href="/guide">입점 안내</a>' +
      '</p>' +
    '</div>' +
  '</div></section>';
}

/* ── ⑧ 찾고, 비교하고, 연결하세요 ──────────────────────────────────
   ⚠️⚠️ 세 줄은 **지금 실제로 하는 일**입니다 — 찾기(분류 · 업체찾기) ·
   비교(업체찾기의 나란히 보기 · 견적 비교) · 연결(상담 요청). 결제 ·
   예약 확정을 대신 한다고 적지 않습니다(절대 규칙 5). */
function flow(){
  var one = function(href, ic, t, l){
    return '<a class="hm-fl" href="' + esc(href) + '">' +
      '<span class="hm-fl-ic">' + icon(ic, 26) + '</span>' +
      '<span class="hm-fl-t"><b>' + esc(t) + '</b><span>' + esc(l) + '</span></span></a>';
  };
  return '<section class="sec hm-s" aria-labelledby="hm-fl-h"><div class="wrap">' +
    '<div class="hm-hd"><h2 class="hm-h2" id="hm-fl-h">찾고, 비교하고, 연결하세요</h2>' +
      '<p class="hm-sub">서비스 조건은 등록 업체와 직접 확인하세요.</p></div>' +
    '<div class="hm-fls">' +
      one("/categories", "search", "찾아보기", "원하는 골프 서비스를 쉽게 찾고") +
      one("/search", "grid", "비교하기", "여러 업체를 같은 기준으로 비교하고") +
      one("/match", "match", "연결하기", "원하는 업체 또는 전문가와 바로 연결하세요") +
    '</div>' +
  '</div></section>';
}

/* 광고 자리 — ⚠️ 0건이면 손님에게는 줄째 숨고(`:has()`), 운영자에게만
   점선 자리가 섭니다(`js/adslot.js`). 시안에 없는 빈 띠를 손님에게 내지
   않습니다. 팔고 있는 자리라 지우지 않았습니다. */
function adSlot(place){
  return '<section class="sec sec-ad"><div class="wrap">' +
    '<div class="adsl-w" data-adslot="' + place + '" hidden></div>' +
  '</div></section>';
}
function sponsors(){
  return '<section class="sec sec-ad sec-spon"><div class="wrap">' +
    '<div class="spon-grid">' +
      '<div class="adsl-w" data-adslot="home_sponsor_a" hidden></div>' +
      '<div class="adsl-w" data-adslot="home_sponsor_b" hidden></div>' +
    '</div>' +
  '</div></section>';
}

/* 폰 바닥 메뉴 — ⚠️ 분류 화면과 **같은 꼴**(`.cqnav`)입니다. 「등록」은
   업체 · 프로 등록(`/join`)입니다 — 메인에는 손님이 올릴 글 자리가
   없습니다. PC 에서는 CSS 가 안 그립니다. */
function botNav(){
  var one = function(href, name, ic, cls){
    return '<a href="' + esc(href) + '"' + (cls ? ' class="' + cls + '"' : '') + '>' +
      '<i class="cqnav-i">' + icon(ic) + '</i><span>' + esc(name) + '</span></a>';
  };
  return '<nav class="cqnav" aria-label="빠른 이동">' +
    one("/", "홈", "home") + one("/search", "검색", "search") +
    one("/join", "등록", "plus", "cqnav-put") + one("/my", "내정보", "user") +
  '</nav>';
}

exports.build = function(){
  return {
    route: "/",
    title: W.AM_BRAND.slogan,
    desc: W.AM_BRAND.desc + " 골프장 부킹 · 조인 · 골프장 정보부터 레슨 · 중고 골프장터 · " +
          "용품 · 피팅 · 여행까지 골프 업체를 한곳에서 찾고 비교합니다.",
    botnav: botNav(),
    body: hero() + adSlot("main_hero") + band() + cats() + needs() + sponsors() +
          where() + story() + adSlot("home_bottom") + biz() + flow(),
    /* ⚠️⚠️ **값을 읽는 파일을 싣는 것까지가 기능입니다** — 찾는 칸은
       `site.js`(날 수) · `regions.js`(지역 묶음) · `deal.js`(시간대)를,
       광고 자리는 업체 자료를 읽습니다. */
    js: ["/js/data/providers.generated.js", "/js/data/providers.js",
         "/js/data/site.js", "/js/data/regions.js", "/js/data/deal.js",
         "/js/adslot.js", "/js/homefind.js"]
  };
};
