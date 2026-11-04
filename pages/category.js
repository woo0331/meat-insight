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
    subs: "회원이 직접 여는 자리입니다. 여는 기능은 아직 없습니다 — 열리면 아래 항목으로 찾습니다.",
    zeroT:"아직 열린 조인이 없습니다.",
    zeroD:"첫 조인이 열리면 여기에 바로 보입니다.",
    cta:  null
  },
  board: {
    what: "글을 올리고 읽는 자리입니다.",
    subs: "회원이 직접 올리는 자리입니다. 올리는 기능은 아직 없습니다 — 열리면 아래로 나뉩니다.",
    zeroT:"아직 올라온 글이 없습니다.",
    zeroD:"첫 글이 올라오면 여기에 바로 보입니다.",
    cta:  null
  }
};

/* ⚠️⚠️ **빈 자리를 막다른 길로 두지 않습니다** (절대 규칙 2). 0건일 때
   손님이 **지금 실제로 할 수 있는 것**으로 보냅니다 — 업체 분류는 매칭
   요청, 회원끼리 쓰는 분류(장터 · 조인 · 커뮤니티)는 아직 할 수 있는 것이
   없어서 단추를 안 냅니다 (눌러도 아무 일이 안 나는 단추를 만들지
   않습니다 · 절대 규칙 5).
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
    '전부 한 양식에서 한 번에 적으십니다.</p></div>' +
    '<ul class="asks">' + a.map(function(x){
      return '<li><span class="asks-n">' + icon("check", 16) + '</span>' +
        esc(x[0]) + '</li>';
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

  /* 하위 — ⚠️ 지금은 **거르개가 아니라 글**입니다. 누르는 것처럼
     보이게 만들면 눌러도 아무 일이 안 나는 칸이 됩니다. */
  var subs = items.length
    ? '<section class="sec"><div class="wrap">' +
      '<div class="sec-hd"><h2>' + esc(c.name) + '에서 다루는 것</h2>' +
      '<p>' + esc(k.subs) + '</p></div>' +
      '<ul class="chips">' + items.map(function(it){
        return '<li><span class="chip">' + esc(it.name) + '</span></li>';
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
    body: head + subs + zero + asks(c) + related(c)
  };
};
