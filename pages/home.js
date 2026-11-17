/* ════════════════════════════════════════════════════════════════════
   메인 화면 — 최종 시안 (2026-11-16 · 이전: docs/spec/00-main.webp · 2026-11-14)

   차례는 최종 시안(2026-11-16) 그대로입니다 —
     ① 히어로 + 찾는 칸(골프장 부킹 · 골프 조인 · 골프장 정보 · 지역 → 골프장 → 시간대)
     ② 분류 열 칸 (한 번만)
     ③ 나에게 맞는 골프를 찾아보세요 (레슨 큰 카드 · 피팅 · 여행)
     ④ 새로 올라온 골프장터 (중고 / 새상품 · 실제 자료만)
     ⑤ 함께 라운드해요 · 골퍼들의 질문 (실제 공개 자료만)
     ⑥ 「골프장 정보는 부킹존에서」 한 줄
     ⑦ 업체 · 프로 입점 안내
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
          /* ⚠️⚠️ 골프장 — 지역을 고르면 js/homefind.js 가 **그 지역의 공개 자료**로
             채웁니다(이름이 아니라 고유 주소 slug 를 보냅니다 · 같은 이름이 있습니다).
             빌드는 비워 두고 꺼 둡니다 — 자바스크립트가 꺼진 분은 지역 전체로 찾습니다. */
          '<div class="hm-sel hm-cs" data-hmhide="join course">' + icon("flag", 18) +
            '<label class="sr" for="hm-cs">골프장</label>' +
            '<select id="hm-cs" name="cs" disabled>' +
            '<option value="">지역을 먼저 고르세요</option></select></div>' +
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
          '<span>지역을 고르면 그 지역 골프장을 고를 수 있습니다 · 예약은 업체 확인 뒤 확정됩니다</span></p>' +
      '</form>' +
    '</div>' +
  '</section>';
}

/* ── ③ 어떤 골프를 찾으세요? ───────────────────────────────────────
   ⚠️⚠️ 이름 · 아이콘 · 주소는 `AM_CATS` 한 곳에서 옵니다 — 두 벌로 적으면
   분류를 고치는 날 한쪽만 바뀝니다. */
function cats(){
  return '<section class="sec hm-s" aria-labelledby="hm-cat-h"><div class="wrap">' +
    '<h2 class="sr" id="hm-cat-h">골프 서비스 바로가기</h2>' +
    '<div class="hm-cats">' + (W.AM_CATS || []).map(function(c){
      return '<a class="hm-cat" href="' + esc(W.amCatUrl(c)) + '">' +
        '<span class="hm-cat-ic">' + icon(c.icon, 30) + '</span>' +
        '<span class="hm-cat-n">' + esc(c.name) + '</span></a>';
    }).join("") + '</div>' +
  '</div></section>';
}

/* ── ④ 나에게 맞는 골프를 찾아보세요 (최종 시안 · 2026-11-16) ───────────
   ⚠️⚠️ **개인화 추천이 아닙니다** — 모든 분께 같은 세 장입니다(「추천」을 쓰지 않습니다).
   ⚠️⚠️ 카드 **전체가 링크 하나**입니다 — 안에 단추 모양(`span`)만 두고 링크를 또
   넣지 않습니다(링크 안의 링크).
   ⚠️⚠️ 사진은 **저장소에 이미 있는, 상표를 확인한 분류 사진**입니다(`cat-lesson` ·
   `cat-fitting` · `cat-travel`). 시안의 인물 사진을 잘라 쓰지 않고, 사진 속 인물을
   입점 프로로 소개하지 않습니다. */
function services(){
  var one = function(k, ph, cls, badge, title, lead, cta){
    var has = W.amPhoto ? W.amPhoto(ph) : null;
    return '<a class="hm-sv ' + cls + (has ? " hm-sv-ph" : "") + '" href="' + esc(catUrl(k)) + '">' +
      (has ? W.amPhotoImg(ph, { cls:"hm-sv-bg" }) : "") +
      '<span class="hm-sv-badge">' + esc(badge) + '</span>' +
      '<span class="hm-sv-t"><b>' + esc(title) + '</b>' +
        (lead ? '<span class="hm-sv-l">' + esc(lead) + '</span>' : "") +
        '<span class="hm-sv-c">' + esc(cta) + icon("arrow", 16) + '</span>' +
      '</span></a>';
  };
  return '<section class="sec hm-s" aria-labelledby="hm-sv-h"><div class="wrap">' +
    '<h2 class="hm-h2" id="hm-sv-h">나에게 맞는 골프를 찾아보세요</h2>' +
    '<div class="hm-svs">' +
      one("lesson", "cat-lesson", "hm-sv-big", "골프 레슨 · 프로",
          "나에게 맞는 프로를 만나보세요", "지역과 레슨 조건으로 찾아보세요", "레슨 · 프로 찾기") +
      '<div class="hm-sv-side">' +
        one("fitting", "cat-fitting", "", "피팅 · 수리",
            "내 클럽에 맞는 점검과 수리", "", "피팅 · 수리 찾기") +
        one("travel", "cat-travel", "", "골프 여행",
            "다음 여행은 골프로", "", "골프여행 둘러보기") +
      '</div>' +
    '</div>' +
  '</div></section>';
}

/* ── ⑤ 새로 올라온 골프장터 — 중고 / 새상품 ─────────────────────────
   ⚠️⚠️⚠️ **상품을 지어내지 않습니다**(시안의 드라이버 · 아이언 · 가격은 예시입니다).
   · 중고 — 회원 매물(0056 · `v_listing_open` 의 **판매중**)을 `js/homemix.js` 가 읽습니다.
     빌드는 그 자리에 「불러오는 중」이 아니라 **갈 길**을 찍어 둡니다(자바스크립트가
     꺼져도 막다른 길이 아니게).
   · 새상품 — 「골프용품 마켓」에 **업체가 올린 상품**(`amMkItems` · 빌드가 실어 준
     자료)입니다. ⚠️ 중고 매물의 「새것」 상태를 새상품으로 내지 않습니다 — 개인이
     파는 물건이고 거래 책임이 다릅니다.
   ⚠️ 탭은 **링크**입니다(자바스크립트가 꺼지면 그 목록 화면으로 갑니다). */
function market(){
  var items = (W.amMkItems && W.amProvidersOf) ? W.amMkItems(W.amProvidersOf("market")) : [];
  var usedUrl = catUrl("used"), newUrl = catUrl("market");
  var none = function(h, p, go){
    return '<div class="hm-mk-none"><p><b>' + esc(h) + '</b> ' + esc(p) + '</p>' +
      '<p class="hm-mk-none-go">' + go + '</p></div>';
  };
  return '<section class="sec hm-s" aria-labelledby="hm-mk-h"><div class="wrap">' +
    '<div class="hm-hd hm-mk-hd"><h2 class="hm-h2" id="hm-mk-h">새로 올라온 골프장터</h2>' +
      '<nav class="hm-mk-tabs" aria-label="골프장터 갈래">' +
        '<a class="hm-mk-tab on" data-mktab="used" href="' + esc(usedUrl) + '" aria-current="true">중고</a>' +
        '<a class="hm-mk-tab" data-mktab="new" href="' + esc(newUrl) + '">새상품</a>' +
      '</nav>' +
      '<a class="hm-all hm-link hm-link-d" id="hm-mk-all" href="' + esc(usedUrl) + '">전체 보기' + icon("arrow", 16) + '</a>' +
    '</div>' +
    '<div class="hm-mk-p" id="hm-mk-used" data-mkpane="used">' +
      none("중고 매물은 중고 골프장터에서 보실 수 있습니다.", "",
        '<a class="btn btn-line btn-sm" href="' + esc(usedUrl) + '">중고 매물 보기</a>') +
    '</div>' +
    /* ⚠️⚠️ 두 꼴(있을 때 · 없을 때)을 다 찍습니다 — 업체 자료를 브라우저가 지금 값으로
       다시 읽으면(js/pvlive.js) 보이는 쪽만 바꾸고 격자를 같은 카드 함수로 갈아 끼웁니다. */
    '<div class="hm-mk-p" id="hm-mk-new" data-mkpane="new" data-pvmk hidden>' +
      '<div data-pvgrid data-pvstate="list"' + (items.length ? '' : ' hidden') + '>' +
        (items.length ? W.amMkGrid(items.slice(0, 4)) : '') + '</div>' +
      '<div data-pvstate="zero"' + (items.length ? ' hidden' : '') + '>' +
        none("아직 새상품을 올린 업체가 없습니다.", "골프용품 업체가 입점하면 여기에 보입니다.",
            '<a class="btn btn-line btn-sm" href="' + esc(newUrl) + '">골프용품 마켓 보기</a>' +
            '<a class="btn btn-line btn-sm" href="/join">업체 입점 신청</a>') + '</div>' +
    '</div>' +
    '<p class="hm-mk-sell">' + icon("bag", 18) + '<span>내 장비도 판매하고 싶다면?</span>' +
      '<a class="hm-link hm-link-d" href="' + esc(usedUrl) + '#lsbox">매물 등록하기' + icon("arrow", 16) + '</a></p>' +
  '</div></section>';
}

/* ── ⑥ 함께 라운드해요 · 골퍼들의 질문 ──────────────────────────────
   ⚠️⚠️ **실제 공개 자료만** — `js/homemix.js` 가 `v_join_open`(모집 중 · 오늘 이후)과
   `v_cq_public`(질문 게시판 · 공개)을 읽습니다. 제목 · 인원 · 조회 수를 지어 넣지
   않습니다. 빌드는 **갈 길**만 찍어 둡니다. */
function together(){
  var ju = catUrl("matchup"), cu = catUrl("community");
  var col = function(id, hid, title, all, fallback){
    return '<div class="hm-tg">' +
      '<div class="hm-hd"><h2 class="hm-h2" id="' + hid + '">' + esc(title) + '</h2>' +
        '<a class="hm-all hm-link hm-link-d" href="' + esc(all) + '">전체 보기' + icon("arrow", 16) + '</a></div>' +
      '<div class="hm-tg-l" id="' + id + '">' + fallback + '</div>' +
    '</div>';
  };
  return '<section class="sec hm-s" aria-label="함께 라운드해요 · 골퍼들의 질문"><div class="wrap hm-tgs">' +
    col("hm-jn", "hm-jn-h", "함께 라운드해요", ju,
      '<p class="hm-tg-none">지금 모집 중인 조인은 골프 조인에서 보실 수 있습니다. ' +
      '<a class="hm-link hm-link-d" href="' + esc(ju) + '">조인 보기 · 모집하기' + icon("arrow", 16) + '</a></p>') +
    col("hm-qa", "hm-qa-h", "골퍼들의 질문", cu + "?s=cm-ask",
      '<p class="hm-tg-none">궁금한 것은 커뮤니티 질문 게시판에 물어보세요. ' +
      '<a class="hm-link hm-link-d" href="' + esc(cu + "?s=cm-ask") + '">질문 보기 · 쓰기' + icon("arrow", 16) + '</a></p>') +
  '</div></section>';
}

/* ── ⑦ 골프장 정보는 부킹존에서 ─────────────────────────────────────
   ⚠️ 메인에서 골프장 목록 · 지역 타일 · 찾는 칸을 걷었습니다(최종 시안). 자료 ·
   상세 화면 · 부킹존의 「골프장 정보」 탭은 그대로이고, 여기는 그리로 가는 길 하나입니다. */
function courseLink(){
  return '<section class="sec hm-s hm-cl-s"><div class="wrap">' +
    '<p class="hm-cl">' + icon("flag", 22) +
      '<span>골프장 정보는 부킹존에서 지역별로 찾아보세요</span>' +
      '<a class="hm-link hm-link-d" href="' + esc(courseUrl("")) + '">골프장 정보 보기' + icon("arrow", 16) + '</a></p>' +
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
    body: hero() + adSlot("main_hero") + cats() + services() + sponsors() +
          market() + together() + courseLink() + adSlot("home_bottom") + biz(),
    /* ⚠️⚠️ **값을 읽는 파일을 싣는 것까지가 기능입니다** — 찾는 칸은
       `site.js`(날 수) · `regions.js`(지역 묶음) · `deal.js`(시간대)를,
       광고 자리는 업체 자료를 읽습니다. */
    js: ["/js/data/providers.generated.js", "/js/data/providers.js",
         "/js/data/site.js", "/js/data/regions.js", "/js/data/deal.js",
         "/js/data/courses.generated.js", "/js/data/courses.js",
         "/js/adslot.js", "/js/homefind.js", "/js/auth.js", "/js/homemix.js",
         /* ⚠️⚠️ 새상품(업체가 올린 상품)을 **지금 값으로** 다시 읽습니다 (js/pvlive.js) —
            카드를 그리는 `card.js` · 상품을 펴 놓는 `data/market.js` 까지 싣는 것이 기능입니다. */
         "/js/data/market.js", "/js/card.js", "/js/data/pvnorm.js", "/js/pvlive.js"]
  };
};
