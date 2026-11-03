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

/* kind 마다 다른 말 — ⚠️ 두 곳에 적지 않습니다. 여기 한 곳입니다. */
var KIND = {
  provider: {
    what: "이 분류의 일을 하는 업체를 찾고 비교하는 자리입니다.",
    zeroT:"아직 등록된 업체가 없습니다.",
    zeroD:"문을 열기 전이라 보여 드릴 업체가 없습니다. 없는 업체를 지어내 보여 드리지 않습니다.",
    cta:  ["/join", "이 분야 업체로 입점하기", "store"]
  },
  trade: {
    what: "회원끼리 직접 사고파는 자리입니다. 골프올인원은 거래 당사자가 아닙니다.",
    zeroT:"아직 올라온 매물이 없습니다.",
    zeroD:"첫 매물이 올라오면 여기에 바로 보입니다.",
    cta:  null
  },
  match: {
    what: "함께 라운딩할 사람을 찾는 자리입니다.",
    zeroT:"아직 열린 조인이 없습니다.",
    zeroD:"첫 조인이 열리면 여기에 바로 보입니다.",
    cta:  null
  },
  board: {
    what: "글을 올리고 읽는 자리입니다.",
    zeroT:"아직 올라온 글이 없습니다.",
    zeroD:"첫 글이 올라오면 여기에 바로 보입니다.",
    cta:  null
  }
};

/* 지금 등록 · 신청을 실제로 받을 수 있는가.
   ⚠️⚠️ 접수처(환경변수)가 꺼져 있으면 **단추를 내지 않습니다.** 손님이
   눌렀다가 막다른 길에 서는 것을 막습니다 (절대 규칙 5). 무엇을
   설정해야 하는지는 손님 화면이 아니라 운영자에게만 말합니다. */
function intakeOn(){ return W.bizVal("sosReady") === true; }

function crumbs(c){
  return '<nav class="crumb" aria-label="현재 위치">' +
    '<a href="/">홈</a>' + icon("arrow", 14) +
    '<a href="/categories">카테고리 전체보기</a>' + icon("arrow", 14) +
    '<span aria-current="page">' + esc(c.name) + '</span></nav>';
}

function related(c){
  var others = (W.AM_CATS || []).filter(function(x){ return x.key !== c.key; }).slice(0, 5);
  if(!others.length) return "";
  return '<section class="sec"><div class="wrap">' +
    '<div class="sec-hd"><h2>다른 분류도 보기</h2></div>' +
    '<ul class="chips">' + others.map(function(x){
      return '<li><a class="chip chip-go" href="' + esc(W.amCatUrl(x)) + '">' +
        icon(x.icon, 18) + esc(x.name) + '</a></li>';
    }).join("") + '</ul></div></section>';
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
      '<p>업체가 등록되면 아래 항목으로 걸러 볼 수 있게 됩니다.</p></div>' +
      '<ul class="chips">' + items.map(function(it){
        return '<li><span class="chip">' + esc(it.name) + '</span></li>';
      }).join("") + '</ul></div></section>'
    : "";

  var zero = '<section class="sec sec-alt"><div class="wrap"><div class="none">' +
    '<h3>' + esc(k.zeroT) + '</h3>' +
    '<p>' + esc(k.zeroD) + '</p>' +
    (k.cta && intakeOn()
      ? '<a class="btn btn-pri" href="' + esc(k.cta[0]) + '">' +
        icon(k.cta[2], 20) + esc(k.cta[1]) + '</a>'
      : '') +
  '</div></div></section>';

  if(k.cta && !intakeOn())
    console.warn("  ⚠️ /cat/" + c.key + " — 접수처가 꺼져 있어 '" + k.cta[1] +
                 "' 단추를 내지 않았습니다 (js/data/site.js 의 sosReady).");

  return {
    route: W.amCatUrl(c),
    title: c.name,
    desc: c.name + " — " + c.lead + ". " + k.what + " " +
          (items.length ? "다루는 것: " + items.map(function(i){ return i.name; }).join(" · ") + "." : ""),
    body: head + subs + zero + related(c)
  };
};
