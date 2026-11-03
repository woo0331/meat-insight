/* ════════════════════════════════════════════════════════════════════
   업체 입점 — /join  (지시서 3번 머리말 "업체 입점하기" · 5번 수익화)

   ⚠️⚠️ **수수료율을 여기 숫자로 적지 않습니다.** 지시서 5번이 "수수료와
   요금은 관리자에서 변경 가능하도록 설계한다" 고 했습니다. 화면에 숫자를
   박으면 관리자에서 바꿔도 **여기만 옛날 값으로 남습니다** — 그게 곧
   업체에 잘못 알린 것이 됩니다. 정해진 요율은 DB(fee_policy)에서
   읽어 보여 줍니다. 지금은 정해진 값이 0건이라 "정해지면 신청하실 때
   미리 보여 드립니다" 까지만 적습니다.

   ⚠️⚠️ **접수처가 꺼져 있으면 폼을 내지 않습니다.** 손님이 길게 적고
   누른 뒤에 실패하는 일을 막습니다 (절대 규칙 5).
   ════════════════════════════════════════════════════════════════════ */
var W = global.window, esc = W.esc, icon = W.icon;

var NEED = [
  ["사업자등록증", "상호 · 대표자 · 사업자등록번호를 확인합니다."],
  ["하시는 일",   "분류 열 가지 안의 항목에서 고르십니다. 여러 개 고르실 수 있습니다."],
  ["영업 지역",   "손님을 받으실 수 있는 지역입니다."],
  ["연락 받을 곳", "손님 문의가 넘어갈 전화 또는 이메일입니다."]
];

exports.build = function(){
  var on = W.bizVal("sosReady") === true;

  var body = '<section class="pghd"><div class="wrap">' +
    '<nav class="crumb" aria-label="현재 위치"><a href="/">홈</a>' + icon("arrow",14) +
    '<span aria-current="page">업체 입점하기</span></nav>' +
    '<h1>업체 입점하기</h1>' +
    '<p class="pghd-l">골프 관련 사업자라면 입점하실 수 있습니다. 입점은 무료입니다. ' +
    '등록하신 분야와 지역에 맞는 손님 문의가 넘어갑니다.</p>' +
  '</div></section>';

  body += '<section class="sec"><div class="wrap">' +
    '<div class="sec-hd"><h2>어떤 업체가 입점하시나요</h2>' +
    '<p>분류 열 가지 중 업체를 중개하는 여섯 곳입니다. 나머지 넷은 회원끼리 쓰는 자리입니다.</p></div>' +
    '<ul class="chips">' + W.amCatsOf("provider").map(function(c){
      return '<li><a class="chip chip-go" href="' + esc(W.amCatUrl(c)) + '">' +
        icon(c.icon, 18) + esc(c.name) + '</a></li>';
    }).join("") + '</ul></div></section>';

  body += '<section class="sec sec-alt"><div class="wrap">' +
    '<div class="sec-hd"><h2>준비하실 것</h2></div>' +
    '<ol class="flow">' + NEED.map(function(r, i){
      return '<li><span class="flow-n">' + (i+1) + '</span>' +
        '<div><h3>' + esc(r[0]) + '</h3><p>' + esc(r[1]) + '</p></div></li>';
    }).join("") + '</ol></div></section>';

  body += '<section class="sec"><div class="wrap">' +
    '<div class="sec-hd"><h2>비용</h2></div>' +
    '<ul class="notes">' +
      '<li><b>입점과 업체 정보 등록은 무료</b>입니다.</li>' +
      '<li>손님과 연결되거나 거래가 성사되면 <b>수수료</b>가 발생합니다. ' +
      '요율은 분야마다 다르고, <b>신청하실 때 화면에서 미리 보여 드린 뒤</b> 동의를 받습니다. ' +
      '지금은 정해진 요율이 없습니다 — 정해지면 여기에 그대로 나옵니다.</li>' +
      '<li>광고 자리와 유료 멤버십은 별도이며, 쓰지 않으셔도 입점에 지장이 없습니다.</li>' +
    '</ul></div></section>';

  if(on){
    body += '<section class="sec sec-alt"><div class="wrap">' +
      '<div class="sec-hd"><h2>입점 신청</h2></div>' +
      '<div class="none"><h3>신청 양식은 5단계에서 켭니다.</h3>' +
      '<p>회원 · 업체 등록을 세우는 중입니다.</p></div></div></section>';
  }else{
    console.warn("  ⚠️ /join — 접수처가 꺼져 있어 신청 양식을 내지 않았습니다 " +
                 "(js/data/site.js 의 sosReady · Vercel 환경변수).");
    body += '<section class="sec sec-alt"><div class="wrap"><div class="none">' +
      '<h3>지금은 입점 신청을 받지 못합니다.</h3>' +
      '<p>받을 자리를 준비하고 있습니다. 다 적으신 뒤에 실패하는 일이 없도록, ' +
      '준비가 끝나기 전에는 양식을 열지 않습니다.</p>' +
      '<a class="btn btn-line" href="/guide">' + icon("arrow",18) + '이용안내 먼저 보기</a>' +
    '</div></div></section>';
  }

  return {
    route: "/join", title: "업체 입점하기",
    desc: "골프 레슨 · 골프장 부킹 · 연습장 · 용품 · 피팅 · 여행 업체의 골프올인원 입점 안내. " +
          "입점과 업체 정보 등록은 무료이며, 연결 · 거래가 성사될 때 수수료가 발생합니다.",
    body: body
  };
};
