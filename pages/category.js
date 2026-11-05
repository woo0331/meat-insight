/* ════════════════════════════════════════════════════════════════════
   분류 화면 — /cat/<key>  (지시서 3번 "카테고리별 상세 페이지")

   ⚠️⚠️ **주소에 c 한 글자를 쓰지 마세요.** vercel.json 이 /c/:p* 를
   410 으로 보냅니다 (앞 서비스가 쓰던 분류 주소). 거기에 화면을 지으면
   저장소에도 있고 로컬에서도 200 인데 **손님에게만 410** 이 나갑니다.
   tools/check-routes.js 가 빌드에서 멈춥니다.

   ⚠️⚠️ **하위 분류는 지금 따로 주소를 만들지 않습니다.** 59장을 지으면
   전부 내용이 0건인 얇은 화면이 되어 색인에서 손해입니다. 하위는 이
   화면 안에 글로 싣고(크롤러가 읽습니다), 업체가 쌓이면 그때 주소로
   올립니다. 올릴 때는 **한 화면에 주소 하나** 를 지키세요.

   ⚠️ 분류마다 kind 가 다릅니다 — 업체가 없는 분류(중고장터 · 조인 ·
   인력 · 커뮤니티)에 "업체 찾기" 를 붙이면 눌러도 아무 일이 안 나는
   단추가 됩니다. 말도 자리도 kind 로 갈립니다.
   ════════════════════════════════════════════════════════════════════ */
var W = global.window, esc = W.esc, icon = W.icon;
var card = require("./_card.js");

/* kind 마다 다른 말 — ⚠️ 두 곳에 적지 않습니다. 여기 한 곳입니다. */
var KIND = {
  provider: {
    what: "이 분류의 일을 하는 업체를 찾고 비교하는 자리입니다.",
    subs: "업체가 등록되면 아래 항목으로 걸러 볼 수 있게 됩니다. 요청하실 때도 여기서 고르십니다.",
    zeroT:"아직 등록된 업체가 없습니다.",
    zeroD:"문을 열기 전이라 보여 드릴 업체가 없습니다. 없는 업체를 지어내 보여 드리지 않습니다.",
    /* ⚠️ 전에는 "이 분야 업체로 입점하기" 였습니다. 이 구간을 읽는 사람은
       **그 서비스를 찾는 손님**이라 자리가 어긋났고, 머리말 금색 단추 ·
       푸터와 합쳐 한 화면에 입점 권유가 세 번 나왔습니다 (지시서 §2).
       0곳일 때 손님이 지금 실제로 할 수 있는 것은 매칭 요청입니다. */
    cta:  ["/match", "이 분야로 매칭 요청하기", "match"]
  },
  trade: {
    what: "회원끼리 직접 사고파는 자리입니다. 골프올인원은 거래 당사자가 아닙니다.",
    subs: "회원끼리 사고파는 것과, 업체가 해 드리는 것(매입 견적 · 위탁판매)이 같이 있습니다.",
    zeroT:"아직 올라온 매물이 없습니다.",
    zeroD:"첫 매물이 올라오면 여기에 바로 보입니다.",
    cta:  null
  },
  match: {
    what: "함께 라운딩할 사람을 찾는 자리입니다.",
    /* ⚠️⚠️⚠️ 전에는 "여는 기능은 아직 없습니다" 였습니다 — 0046 이
       `open_joinroom` 과 `js/join.js` 를 세운 **뒤에도 그대로** 남아,
       바로 아래 "열려 있는 조인을 불러옵니다" 와 **한 화면이 두 말**을
       하고 있었습니다. 더 나쁜 것은 메인의 0곳 상자가 "지금 하실 수
       있는 것 — 조인 열기" 로 **이 화면에 보낸다**는 것입니다 (2026-11-05
       검수에서 찾았습니다). 하는 일을 안 한다고 적는 것도 절대 규칙 5 입니다.
       ⚠️ 하위는 **글로만** 둡니다 — `joinroom` 에 하위 칸이 없어 좁힐
       자료가 없습니다. 그래서 "아래 항목으로 찾습니다" 라고 적지 않습니다. */
    subs: "회원이 직접 여는 자리입니다. 아래와 같은 자리를 여실 수 있습니다.",
    zeroT:"아직 열린 조인이 없습니다.",
    zeroD:"첫 조인이 열리면 여기에 바로 보입니다.",
    cta:  null
  },
  board: {
    what: "글을 올리고 읽는 자리입니다.",
    /* ⚠️⚠️⚠️ 위 match 와 같은 자리 — 0047(`ask_cq`) · 0048(`open_jobpost`)
       이 선 뒤에도 "올리는 기능은 아직 없습니다" 가 남아 있었습니다. */
    subs: "회원이 직접 올리는 자리입니다. 아래와 같은 글을 올리실 수 있습니다.",
    zeroT:"아직 올라온 글이 없습니다.",
    zeroD:"첫 글이 올라오면 여기에 바로 보입니다.",
    cta:  null
  }
};

/* ⚠️⚠️ **빈 자리를 막다른 길로 두지 않습니다** (절대 규칙 2). 0건일 때
   손님이 **지금 실제로 할 수 있는 것**으로 보냅니다 — 업체 분류는 매칭
   요청입니다.
   ⚠️⚠️ 회원끼리 쓰는 분류(조인 · 커뮤니티 · 인력)에 `cta` 를 안 두는
   까닭은 **할 수 있는 것이 없어서가 아닙니다** — 여는 · 올리는 양식이
   **바로 이 화면 안에** 있습니다(`js/join.js` · `js/community.js` ·
   `js/career.js`). 다른 데로 보낼 까닭이 없어서 안 냅니다.
   ⚠️ 중고장터(`trade`)는 아직 문이 없어 정말로 `cta` 가 없습니다.
   (전에는 이 주석이 "조인 · 커뮤니티는 아직 할 수 있는 것이 없어서" 라고
   적혀 있었습니다 — 0046~0048 이 선 뒤에 썩은 줄이었습니다.)
   ⚠️ 매칭 요청 화면은 업체가 0곳이어도 접수되고(운영자가 받습니다),
   그 화면이 그 사실을 스스로 말합니다. */

function crumbs(c){
  return '<nav class="crumb" aria-label="현재 위치">' +
    '<a href="/">홈</a>' + icon("arrow", 14) +
    '<a href="/categories">카테고리 전체보기</a>' + icon("arrow", 14) +
    '<span aria-current="page">' + esc(c.name) + '</span></nav>';
}

/* ⚠️ 지시서 §6 — "카테고리 상세 화면의 반복적인 '다른 분류 보기'
   영역은 간소화한다". 전에는 **다른 아홉 중 다섯**을 아무 기준 없이
   잘라 늘어놓았습니다 (분류마다 거의 같은 목록이 나왔습니다).
   지금은 **같은 묶음 안의 형제**만 냅니다 — 레슨 옆에는 연습장 · 피팅이
   오고, 여행 옆에는 부킹 · 조인이 옵니다. 묶음 전체로 가는 길도 같이
   둡니다 (열 분류를 다 보시려면 그 길입니다). */
function related(c){
  var zone = (W.AM_ZONES || []).filter(function(z){
    return (z.cats || []).indexOf(c.key) >= 0;
  })[0];
  if(!zone) return "";
  var sibs = (W.amZoneCats ? W.amZoneCats(zone) : [])
    .filter(function(x){ return x.key !== c.key; });
  if(!sibs.length) return "";
  return '<section class="sec"><div class="wrap">' +
    '<div class="sec-hd"><h2>' + esc(zone.name) + ' 안의 다른 분류</h2></div>' +
    '<ul class="chips">' + sibs.map(function(x){
      return '<li><a class="chip chip-go" href="' + esc(W.amCatUrl(x)) + '">' +
        icon(x.icon, 18) + esc(x.name) + '</a></li>';
    }).join("") +
    '<li><a class="chip chip-go" href="/categories#' + esc(zone.key) + '">' +
      icon("arrow", 18) + '열 분류 전체보기</a></li>' +
    '</ul></div></section>';
}

/* ── 이 분류로 요청하면 **무엇을 여쭙는가** (지시서 §6) ──────────────
   ⚠️⚠️ 분류마다 다릅니다. 목록은 js/data/catalog.js 의 AM_ASK **한 곳**
   에 있고, 매칭 요청 양식도 같은 줄을 읽습니다 — 두 곳에 적으면 화면은
   "여쭙는다" 고 하는데 양식에는 그 칸이 없는 꼴이 됩니다.
   ⚠️ 받을 자리가 없는 분류(조인 · 인력 · 커뮤니티)는 AM_ASK 가 비어
   있고, 그러면 이 구간이 **줄째 빠집니다** (절대 규칙 2). */
function asks(c){
  var a = W.amAskOf ? W.amAskOf(c) : null;
  if(!a) return "";
  return '<section class="sec sec-alt"><div class="wrap">' +
    '<div class="sec-hd"><h2>' + esc(c.name) + ' 요청에 적는 것</h2>' +
    '<p>이 분류로 매칭 요청을 남기시면 아래를 여쭙습니다. ' +
    '전부 한 양식에서 한 번에 적으십니다. ' +
    '<b>*</b> 는 꼭 적어 주셔야 하는 것입니다.</p></div>' +
    /* ⚠️⚠️ **별표는 AM_ASK 의 셋째 칸에서 옵니다** — 양식이 required
       를 거는 자리와 **같은 줄**을 읽습니다. 여기 손으로 적으면
       "필수라고 적어 놓고 안 받는" 꼴이 됩니다 (`test-match` 가
       맞춰 봅니다). */
    '<ul class="asks">' + a.map(function(x){
      return '<li><span class="asks-n">' + icon("check", 16) + '</span>' +
        esc(x[0]) + (x[2] ? ' <b>*</b>' : '') + '</li>';
    }).join("") + '</ul>' +
    '<p class="asks-go"><a class="btn btn-pt" href="/match?cat=' + esc(c.key) + '">' +
      icon("match", 20) + esc(c.name) + ' 매칭 요청하기</a></p>' +
  '</div></section>';
}

exports.build = function(c){
  var k = KIND[c.kind] || KIND.provider;
  var items = W.amCatItems(c);

  var head = '<section class="pghd"><div class="wrap">' +
    crumbs(c) +
    '<h1>' + esc(c.name) + '</h1>' +
    '<p class="pghd-l">' + esc(c.lead) + ' — ' + esc(k.what) + '</p>' +
  '</div></section>';

  /* ⚠️⚠️⚠️ **하위 예순둘까지 가는 길** (지시서 §4). 전에는 여기가
     **글**이었습니다 — "누르는 것처럼 보이게 만들면 눌러도 아무 일이
     안 나는 칸이 된다" 는 까닭이었고, 그때는 하위로 좁히는 자리가
     실제로 없었습니다. 지금은 업체찾기가 `sub` 로 좁힙니다
     (`js/search.js`), 그래서 **누르면 실제로 좁혀집니다.**
     ⚠️ 주소는 `amSubUrl()` **한 함수**에서만 짓습니다.
     ⚠️⚠️ **업체가 입점하는 하위만** 링크로 냅니다 — 조인 · 커뮤니티의
     하위를 업체찾기로 보내면 그 화면은 영원히 0건이고, 그건 눌러도
     아무 일이 안 나는 칸과 같습니다. 그 둘은 글로 둡니다.
     ⚠️ 업체가 0곳이어도 막다른 길이 아닙니다 — 업체찾기의 0건 자리가
     "조건에 맞는 업체가 없습니다" 와 **매칭 요청 단추**를 같이 냅니다. */
  var canPv = W.amCatItemsForProvider(c).map(function(it){ return it.key; });
  var subs = items.length
    ? '<section class="sec"><div class="wrap">' +
      '<div class="sec-hd"><h2>' + esc(c.name) + '에서 다루는 것</h2>' +
      '<p>' + esc(k.subs) +
      /* ⚠️⚠️ **무엇이 걸러지는지는 `amSubFinds()` 한 곳**이 정합니다 —
         `/cat/career` 의 하위는 업체가 아니라 **구인 · 구직 글**을
         좁히는데 여기가 "업체만 모아" 라고 적고 있었습니다 (2026-11-05). */
      (canPv.length
        ? (W.amSubFinds(c) === "글"
            ? ' 눌러 보시면 그 갈래의 글만 모아 보여 드립니다.'
            : ' 눌러 보시면 그 일을 하는 업체만 모아 보여 드립니다.')
        : '') +
      '</p></div>' +
      /* ⚠️ `chips-sub` 는 **잴 자리를 가리키는 이름**입니다 — 관련
         분류 줄도 `.chips` 를 쓰므로, 이름이 없으면 검사가 그 링크까지
         하위로 세어 멀쩡한 화면을 실패로 잡습니다 (실제로 그랬습니다). */
      '<ul class="chips chips-sub">' + items.map(function(it){
        return canPv.indexOf(it.key) >= 0
          ? '<li><a class="chip chip-go" href="' +
            esc(W.amSubUrl(c.key, it.key)) + '">' + esc(it.name) + '</a></li>'
          : '<li><span class="chip">' + esc(it.name) + '</span></li>';
      }).join("") + '</ul></div></section>'
    : "";

  /* ⚠️⚠️ **업체가 있을 때와 없을 때를 둘 다 그립니다.** 앞 서비스에서
     "0곳" 안내만 만들어 두고 **있을 때 그리는 자리를 안 만든** 적이
     있습니다 — 승인해도 손님에게 보일 곳이 없었습니다.
     tools/test-providers.js 가 **둘 다** 눌러 봅니다. */
  var list = W.amProvidersOf(c.key);
  if(list.length){
    return {
      route: W.amCatUrl(c), title: c.name,
      crumbs: [["카테고리 전체보기", "/categories"], [c.name, W.amCatUrl(c)]],
      desc: c.name + " — " + c.lead + ". " + k.what + " 지금 " + list.length + "곳이 있습니다.",
      body: head + subs +
        '<section class="sec sec-alt"><div class="wrap">' +
          '<div class="sec-hd"><h2>' + esc(c.name) + ' 업체 ' + W.won(list.length) + '곳</h2>' +
          '<p>골프올인원은 통신판매중개자이며 거래 당사자가 아닙니다.</p></div>' +
          card.grid(list) +
        '</div></section>' + asks(c) + related(c)
    };
  }

  /* ⚠️⚠️⚠️ **조인은 막다른 길이 아닙니다** (0046 · 지시서 §2.A).
     여기는 업체를 찾는 자리가 아니라 **회원끼리 여는** 자리라,
     "업체 0곳" 안내 대신 **열린 조인 목록과 여는 양식**이 옵니다.
     ⚠️ 설명은 **빌드가** 찍습니다 (크롤러 · 자바스크립트 꺼진 분이
     읽을 몫). 목록은 아무 때나 바뀌므로 **브라우저가** 그립니다 —
     빌드 때 찍으면 배포할 때만 바뀝니다.
     ⚠️ 아래 글을 지우면 봇에게는 **빈 화면**이 됩니다. */
  var joinSec = (c.kind === "match")
    ? '<section class="sec sec-alt"><div class="wrap">' +
      '<div class="sec-hd"><h2>열려 있는 조인</h2>' +
      '<p>회원이 직접 여는 자리입니다. 날짜 · 지역 · 인원을 적어 올리시면 ' +
      '다른 회원이 참가를 신청합니다. ' +
      /* ⚠️ 지어낸 약속을 하지 않습니다 — 우리가 부킹을 잡아 주지 않습니다 */
      '골프올인원은 부킹을 대신 잡아 드리지 않으며 거래 당사자가 아닙니다.</p></div>' +
      '<div id="joinlist">' +
        '<div class="none"><h3>조인을 보시려면 잠시만 기다려 주세요.</h3>' +
        '<p>열려 있는 조인을 불러옵니다. 보이지 않으면 아직 열린 조인이 ' +
        '없는 것입니다.</p></div>' +
      '</div>' +
      '<div id="joinbox"></div>' +
      '<p class="jnote">⚠️ 연락처는 목록에 나오지 않습니다. 참가가 ' +
      '수락된 뒤 서로 따로 고르셨을 때만 그 상대 한 분에게 보입니다.</p>' +
      '</div></section>'
    : '';

  /* ⚠️⚠️ **커뮤니티도 막다른 길이 아닙니다** (0047 · §2.C).
     ⚠️ 설명은 빌드가 찍고(크롤러 몫) 글 목록은 브라우저가 그립니다. */
  var cqSec = (c.key === "community")
    ? '<section class="sec sec-alt"><div class="wrap">' +
      '<div class="sec-hd"><h2>질문과 답변</h2>' +
      '<p>골프에 대해 궁금한 것을 묻고 회원끼리 답하는 자리입니다. ' +
      /* ⚠️ 지어낸 약속을 하지 않습니다 — 우리가 답해 드리는 곳이 아닙니다 */
      '골프올인원이 답변을 드리지는 않으며, 답변의 내용은 ' +
      '적으신 회원의 것입니다.</p></div>' +
      '<div id="cqlist">' +
        '<div class="none"><h3>질문을 보시려면 잠시만 기다려 주세요.</h3>' +
        '<p>올라온 질문을 불러옵니다. 보이지 않으면 아직 올라온 질문이 ' +
        '없는 것입니다.</p></div>' +
      '</div>' +
      '<div id="cqbox"></div>' +
      '<p class="jnote">⚠️ 올리신 글은 <b>누구나 봅니다.</b> 전화번호 · ' +
      '아이디 같은 연락처는 적지 마세요. 문제가 있는 글은 신고하실 수 ' +
      '있고, 올리신 글은 내 정보 화면에서 고치거나 내리실 수 있습니다.</p>' +
      '</div></section>'
    : '';

  /* ⚠️⚠️ **인력 · 비즈니스도 막다른 길이 아닙니다** (0048).
     하위분류 여섯 이름만 보이고 올릴 자리도 지원할 자리도 없었습니다 —
     막다른 분류 셋 가운데 마지막입니다.
     ⚠️ 설명은 빌드가 찍고(크롤러 몫) 글 목록은 브라우저가 그립니다.
     ⚠️ 거르개도 **목록 안에** 브라우저가 그립니다 — 빌드가 찍어 두면
     자바스크립트가 꺼진 분에게 눌러도 아무 일이 안 나는 칸이 됩니다. */
  var jobSec = (c.key === "career")
    ? '<section class="sec sec-alt"><div class="wrap">' +
      '<div class="sec-hd"><h2>구인 · 구직 · 제휴</h2>' +
      '<p>골프장 · 연습장 · 아카데미가 사람을 구하고, 프로 · 캐디가 ' +
      '일자리를 찾고, 업체끼리 제휴 · 거래를 제안하는 자리입니다. ' +
      /* ⚠️ 지어낸 약속을 하지 않습니다 — 우리가 채용을 대신 하지 않습니다 */
      '골프올인원은 채용을 대신 진행하지 않으며 거래 당사자가 아닙니다. ' +
      '적어 주신 조건이 사실인지는 서로 확인하셔야 합니다.</p></div>' +
      '<div id="joblist">' +
        '<div class="none"><h3>글을 보시려면 잠시만 기다려 주세요.</h3>' +
        '<p>올라온 글을 불러옵니다. 보이지 않으면 아직 올라온 글이 ' +
        '없는 것입니다.</p></div>' +
      '</div>' +
      '<div id="jobbox"></div>' +
      '<p class="jnote">⚠️ 연락처는 목록에 나오지 않습니다. 지원이 ' +
      '수락된 뒤 서로 따로 고르셨을 때만 그 상대 한 분에게 보입니다. ' +
      '올리신 글은 내 정보 화면에서 고치거나 마감하실 수 있습니다.</p>' +
      '</div></section>'
    : '';

  var zero = '<section class="sec sec-alt"><div class="wrap"><div class="none">' +
    '<h2>' + esc(k.zeroT) + '</h2>' +
    '<p>' + esc(k.zeroD) + '</p>' +
    /* ⚠️⚠️ **바로 아래 "요청에 적는 것" 구간에 같은 단추가 있으면**
       한 화면에 매칭 요청 단추가 둘이 됩니다 (지시서 §2 — 중복). 그쪽이
       무엇을 여쭙는지까지 말해 주므로 그쪽을 남기고 여기는 뺍니다.
       ⚠️ 그 구간이 없는 분류(조인 · 인력 · 커뮤니티)에서는 여기도 비어
       있습니다 — 그 분류는 지금 할 수 있는 것이 정말로 없습니다. */
    (k.cta && !(W.amAskOf && W.amAskOf(c))
      ? '<a class="btn btn-pri" href="' + esc(k.cta[0]) + '">' +
        icon(k.cta[2], 20) + esc(k.cta[1]) + '</a>'
      : '') +
  '</div></div></section>';

  return {
    route: W.amCatUrl(c),
    title: c.name,
    crumbs: [["카테고리 전체보기", "/categories"], [c.name, W.amCatUrl(c)]],
    desc: c.name + " — " + c.lead + ". " + k.what + " " +
          (items.length ? "다루는 것: " + items.map(function(i){ return i.name; }).join(" · ") + "." : ""),
    /* ⚠️⚠️ **값을 읽는 파일을 싣는 것까지가 기능입니다.** `/help` 에서
       `site.js` 를 안 실어 문의 양식이 **에러 한 줄 없이** 안 열린 적이
       있습니다 — joinKeep 이 빈 문자열이 되어 "설정이 안 된 것" 과
       똑같이 보였습니다. 여기서 같은 실수를 하지 않습니다.
       ⚠️ regions.js 는 지역 고르는 칸이 읽습니다. */
    js: (c.kind === "match")
      ? ["/js/data/site.js", "/js/data/regions.js", "/js/join.js"]
      : (c.key === "community" ? ["/js/community.js"]
      /* ⚠️⚠️ **값을 읽는 파일을 싣는 것까지가 기능입니다** — site.js 가
         careerKeep(보유 기간)을, regions.js 가 지역 칸을, catalog.js 가
         하위분류 칸을 줍니다 (catalog 는 빌드가 저절로 싣습니다). */
      : (c.key === "career"
          ? ["/js/data/site.js", "/js/data/regions.js", "/js/career.js"]
          : null)),
    /* ⚠️ 조인은 제 구간이 "0건" 을 스스로 말하므로 zero 를 **안 겹칩니다**
       (한 화면에 "없습니다" 가 두 번 나오면 미완성으로 읽힙니다). */
    body: head + subs + (joinSec || cqSec || jobSec || zero) + asks(c) + related(c)
  };
};
