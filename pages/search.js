/* ════════════════════════════════════════════════════════════════════
   업체찾기 — /search  (업체찾기 개선 지시서)

   ⚠️⚠️ **보내는 열쇠와 받는 열쇠가 같아야 합니다.** 머리말의 검색창은
   name="q" 로 보냅니다. 여기서 읽는 것도 **q** 이고, 거르개는 **cat** ·
   **rg** 입니다. 앞 서비스에서 ?m=apple 을 보내고 mk 를 읽어서
   **거르개가 아무것도 안 걸렀는데** 링크 검사도 흐름 검사도 통과했습니다
   — 눌러 봐야 압니다. `tools/test-search.js` 가 눌러 봅니다.

   ⚠️⚠️⚠️ **빌드가 찍는 것이 "거르개 없는 상태" 입니다.** 자바스크립트가
   꺼진 봇 · 네이버 · LLM 봇은 이 HTML 만 읽습니다. 그래서 승인된 업체
   전부를 **HTML 에 미리 찍고**, 손님이 거르개를 누르면 같은 자료를
   **같은 함수**(`js/card.js`)로 다시 그립니다 — 그래야 화면과 크롤러
   본문이 **다른 말을 하지 않습니다** (앞 서비스에서 열세 번 어긋났고,
   그려진 화면만 보는 검사는 영원히 통과합니다).

   ⚠️ 거르개는 **링크**입니다. 자바스크립트가 없어도 눌리고(주소가
   바뀌며 서버가 다시 찍어 줍니다), 있으면 js/search.js 가 가로채서
   **새로고침 없이** 다시 그립니다. 단추로만 만들면 JS 가 꺼진 손님에게
   **눌러도 아무 일이 안 나는 칸**이 됩니다 (절대 규칙 5).

   ⚠️⚠️ **한 화면에 주소 하나.** 거르개는 전부 질의문자(`?cat=` · `?rg=`)
   로 받고 canonical 은 늘 `/search` 입니다 — 같은 내용이 여러 주소로
   나가면 둘 다 색인에서 손해입니다.
   ════════════════════════════════════════════════════════════════════ */
var W = global.window, esc = W.esc, icon = W.icon;
var card = require("./_card.js");

/* 거르개 한 줄 — ⚠️ 주소를 **한 함수**에서 짓습니다. 두 곳에 지으면
   한쪽만 고쳐서 링크가 조용히 엉뚱한 데로 갑니다 (amCatUrl 로 겪었습니다). */
/* ⚠️⚠️ **꼴이 브라우저 쪽 `url()` 과 같아야 합니다** (js/search.js) —
   어긋나면 눌렀을 때와 주소를 새로 열었을 때가 달라집니다.
   ⚠️ 빌드는 `sub` 를 **안 냅니다**: 하위 칸은 예순둘이라 거르개 줄에
   놓으면 폰에서 가로로 미끄러져 **밀면 보이는 것**이 되고(머리말 메뉴로
   겪은 자리), 거기까지 가는 길은 **분류 화면의 하위 목록**이 냅니다
   (`amSubUrl`). 그래도 자리를 받아 두어 차례가 어긋나지 않게 합니다. */
function furl(cat, rg, sub){
  var qs = [];
  if(cat) qs.push("cat=" + encodeURIComponent(cat));
  if(sub) qs.push("sub=" + encodeURIComponent(sub));
  if(rg)  qs.push("rg=" + encodeURIComponent(rg));
  return "/search" + (qs.length ? "?" + qs.join("&") : "");
}

function chiprow(label, id, items, allLabel){
  return '<div class="sf-r">' +
    '<span class="sf-l" id="' + esc(id) + '-l">' + esc(label) + '</span>' +
    '<div class="sf-c" role="group" aria-labelledby="' + esc(id) + '-l">' +
      '<a class="chip chip-on" data-sf="' + esc(id) + '" data-v="" href="' +
        esc(items.all) + '" aria-pressed="true">' + esc(allLabel) + '</a>' +
      items.list.join("") +
    '</div>' +
  '</div>';
}

exports.build = function(){
  var cats = W.AM_CATS || [];
  var regs = W.AM_REGIONS || [];
  var list = W.amProviders();

  /* ── 머리 — ⚠️ 낮게 둡니다 (지시서 2번). 소개글이 길면 손님이 첫
     화면에서 업체를 못 봅니다. 한 줄만 둡니다. */
  var body = '<section class="pghd pghd-tt"><div class="wrap">' +
    '<nav class="crumb" aria-label="현재 위치"><a href="/">홈</a>' + icon("arrow",14) +
    '<span aria-current="page">업체찾기</span></nav>' +
    '<h1>업체찾기</h1>' +
    '<p class="pghd-l">위 검색창에 하려는 일을 치시거나, 아래에서 지역 · 분류로 ' +
    '좁혀 보세요.</p>' +
  '</div></section>';

  /* ── 거르개 ─────────────────────────────────────────────────────
     ⚠️ 폰에서는 가로로 미끄러집니다 (지시서 4번). 줄바꿈으로 쌓으면
     거르개가 화면 두 장을 차지해서 업체가 안 보입니다. */
  body += '<section class="sfilt"><div class="wrap">' +
    chiprow("분류", "cat", {
      all: furl(null, null),
      list: cats.map(function(c){
        return '<a class="chip" data-sf="cat" data-v="' + esc(c.key) + '" href="' +
          esc(furl(c.key, null)) + '" aria-pressed="false">' +
          icon(c.icon, 17) + esc(c.name) + '</a>';
      })
    }, "전체") +
    chiprow("지역", "rg", {
      all: furl(null, null),
      list: regs.map(function(r){
        return '<a class="chip" data-sf="rg" data-v="' + esc(r.key) + '" href="' +
          esc(furl(null, r.key)) + '" aria-pressed="false">' + esc(r.name) + '</a>';
      })
    }, "전국") +
    /* ⚠️ 지금 무엇으로 좁혔는지 **글로** 말합니다. 칸 색만으로는
       폰에서 안 보입니다 (가로로 미끄러져 화면 밖에 있습니다). */
    /* ⚠️ 0곳일 때는 **아무 말도 안 합니다** — 바로 아래 빈 자리 상자가
       같은 말을 합니다. 전에는 한 화면에 두 번 찍혔습니다 (지시서 §2). */
    (list.length
      ? '<p class="sf-now" id="sfnow">승인된 업체 ' + W.won(list.length) +
        '곳을 전부 보고 있습니다.</p>'
      : '<p class="sf-now" id="sfnow" hidden></p>') +
  '</div></section>' +
  /* 지역 광고 자리 — ⚠️⚠️ **열쇠를 빌드가 못 정합니다.** 지역은 손님이
     거르개에서 고르는 것이라, 빌드가 찍는 HTML 에는 아직 지역이 없습니다
     (빈 열쇠는 어느 광고에도 안 걸립니다 — 0026 의 check 가 지역 광고에
     지역을 요구하므로 빈 값인 광고는 없습니다). 그래서 `js/search.js` 가
     다시 그릴 때마다 **그때 고른 지역**으로 이 자리를 채웁니다.
     ⚠️ 그리는 코드를 거기 한 벌 더 적지 않습니다 — `amAdFill()` 한
     함수를 부릅니다 (업체 카드를 두 곳에서 그리다 겪은 자리입니다). */
  '<section class="sec sec-ad"><div class="wrap">' +
    '<div class="adsl-w" data-adslot="region" data-adslot-key="" hidden></div>' +
  '</div></section>';

  /* ── 결과 ───────────────────────────────────────────────────────
     ⚠️⚠️ **있을 때와 없을 때를 둘 다 찍습니다.** 앞 서비스에서 "0곳"
     안내만 만들어 두고 **있을 때 그리는 자리를 안 만든** 적이 있습니다 —
     승인해도 손님에게 보일 곳이 없었습니다. */
  body += '<section class="sec sec-alt"><div class="wrap">' +
    '<div class="sec-hd"><h2 id="sresh">' +
      (list.length ? '업체 ' + W.won(list.length) + '곳' : '업체') + '</h2>' +
      '<p>골프올인원은 통신판매중개자이며 거래 당사자가 아닙니다. ' +
      '승인된 업체만 보여 드립니다.</p></div>' +
    '<div id="sres">' + (list.length
      ? card.grid(list, { thumb:true, actions:true, compare:true })
      : zero()) + '</div>' +
    /* 비교 — ⚠️⚠️ **비교할 업체가 없으면 이 자리가 아예 없습니다.**
       빈 비교표를 그려 두면 가짜 비교 데이터가 들어오는 문이 됩니다
       (절대 규칙 1). 자바스크립트가 업체를 고를 때만 채웁니다. */
    (list.length > 1
      ? '<div id="scmp" class="cmp" hidden></div>'
      : '') +
  '</div></section>';

  /* ── 골프장 · 연습장 (0066) ─────────────────────────────────────
     ⚠️⚠️⚠️ **업체와 갈라서 냅니다.** 골프장은 **저희 입점업체가 아닙니다** —
     공공 자료에서 가져온 시설 정보이고, 저희와 아무 계약이 없습니다.
     섞어 내면 손님이 "골프올인원에 입점한 골프장" 으로 읽습니다.
     ⚠️⚠️ 카드는 `amCourseGrid()` **한 함수**에서 그립니다 — 빌드와
     브라우저가 같은 함수를 부릅니다 (업체 카드에서 배운 자리).
     ⚠️ 0곳이면 **0곳이라고 말합니다** — 지어내지 않습니다. */
  var cs = W.amCoursePick ? W.amCoursePick({}) : [];
  body += '<section class="sec" id="courses"><div class="wrap">' +
    '<div class="sec-hd"><h2 id="csresh">' +
      (cs.length ? '골프장 · 연습장 ' + W.won(cs.length) + '곳' : '골프장 · 연습장') +
      '</h2>' +
      '<p>공공 자료에서 가져온 <b>시설 정보</b>입니다. ' +
      '저희 입점업체가 아니며, <b>예약을 보장하지 않습니다.</b></p></div>' +
    '<div id="csres">' + (cs.length
      ? W.amCourseGrid(cs)
      : '<div class="none"><h2>아직 불러온 골프장이 없습니다.</h2>' +
        '<p>공식 공공데이터에서 받아 넣기 전이라 보여 드릴 시설이 없습니다. ' +
        '없는 골프장을 지어내 보여 드리지 않습니다.</p>' +
        '<p class="none-or">지금 하실 수 있는 것</p><div class="none-b">' +
        '<a class="btn btn-line" href="/match?cat=booking">' + icon("arrow",18) +
        '부킹 요청 남기기</a>' +
        '<a class="btn btn-line" href="' + esc(W.amCatUrl(W.amCat("booking"))) + '">' +
        icon("flag",18) + '올라온 티타임 보기</a>' +
        '</div></div>') + '</div>' +
  '</div></section>';

  /* ⚠️⚠️ **아래에 분류 목록을 또 늘어놓지 않습니다** (지시서 §7 —
     "상단과 하단에 동일한 카테고리 목록을 반복하지 않는다"). 위 거르개가
     이미 같은 열 분류를 칩으로 내고 있었습니다.
     ⚠️ 분류 화면으로 가는 길은 **머리말 메뉴 · 메인의 분류 카드 ·
     /categories** 셋에 그대로 있습니다 — 길을 없앤 것이 아닙니다
     (check-links 의 외톨이 검사가 그것을 봅니다). */

  return {
    route: "/search", title: "업체찾기", crumbs: [["업체찾기", "/search"]],
    desc: "골프 업체를 지역 · 분류로 찾습니다. " +
          (list.length ? "승인된 업체 " + list.length + "곳. " : "") +
          cats.map(function(c){ return c.name; }).join(" · ") + ".",
    body: body,
    js: ["/js/data/korean.js", "/js/data/regions.js",
         "/js/data/providers.generated.js", "/js/data/providers.js",
         "/js/data/reviews.generated.js", "/js/data/review.js",
         /* ⚠️ 골프장 자료와 카드 함수를 **같이** 실어야 합니다 — 안 실으면
            거르개를 눌러도 골프장 구간만 처음 것 그대로 남습니다
            (값을 읽는 파일을 싣는 것까지가 기능입니다). */
         "/js/data/courses.generated.js", "/js/data/courses.js",
         "/js/card.js", "/js/search.js", "/js/adslot.js"]
  };
};

/* ── 업체가 0곳일 때 ────────────────────────────────────────────────
   ⚠️⚠️ **막다른 길로 두지 않습니다** (절대 규칙 2). 0곳이라고만 적고
   끝내면 손님은 뒤로 가기만 누릅니다 — 지금 **실제로 되는 것**을 같이
   냅니다. 매칭 요청은 업체가 0곳이어도 접수되고(운영자가 받습니다),
   /match 화면이 그 사실을 스스로 말합니다.
   ⚠️ "곧 등록됩니다" 처럼 지킬 수 없는 말은 안 적습니다 (절대 규칙 5). */
function zero(){
  return '<div class="none">' +
    '<h3>아직 등록된 업체가 없습니다.</h3>' +
    '<p>문을 열기 전이라 보여 드릴 업체가 없습니다. ' +
    '없는 업체를 지어내 보여 드리지 않습니다. ' +
    '원하시는 조건을 남겨 두시면 업체가 등록되는 대로 운영자가 맞춰 봅니다.</p>' +
    '<div class="none-b">' +
      /* ⚠️ 입점 권유를 여기서 뺐습니다 (지시서 §2) — 이 구간을 읽는
         사람은 **업체를 찾는 손님**입니다. 입점으로 가는 길은 머리말
         금색 단추와 푸터에 그대로 있습니다. */
      '<a class="btn btn-pt" href="/match">' + icon("match", 20) + '매칭 요청 남기기</a>' +
    '</div>' +
    nowOpen() +
  '</div>';
}

/* ⚠️⚠️⚠️ **업체를 기다리는 동안 할 수 있는 것** (지시서 §7).
   업체가 0곳이어도 **회원끼리 되는 것**이 셋 있습니다 — 조인 ·
   커뮤니티 · 구인 · 구직 (0046 · 0047 · 0048). 전에는 0곳 화면이
   "매칭 요청" 하나만 내서, 업체를 기다리는 동안 손님이 할 수 있는
   것이 **없는 것처럼** 보였습니다.
   ⚠️⚠️ **줄은 `amOpenNow()` 한 곳에서 옵니다** — 이 상자를 빌드와
   브라우저가 **둘 다** 그리므로(여기와 `js/search.js`), 글을 두 벌로
   적으면 거르개를 누르는 순간 안내가 조용히 달라집니다.
   ⚠️ 매칭 요청과 **갈라서** 적습니다 — 하나는 업체를 기다리는 길이고
   이쪽은 기다리지 않는 길입니다. 섞어 두면 넷 가운데 무엇이 무엇인지
   알 수 없습니다. */
function nowOpen(){
  var L = (W.amOpenNow ? W.amOpenNow() : []);
  if(!L.length) return "";          /* ⚠️ 0건이면 줄째 빠집니다 */
  return '<p class="none-or">업체를 기다리지 않고 지금 하실 수 있는 것</p>' +
    '<div class="none-b">' + L.map(function(x){
      return '<a class="btn btn-line" href="' + esc(x.href) + '">' +
        icon(x.icon, 18) + esc(x.label) + '</a>';
    }).join("") + '</div>';
}
