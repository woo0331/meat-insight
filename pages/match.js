/* ════════════════════════════════════════════════════════════════════
   한 번에 견적 · 매칭 요청 — /match   (2차 지시서 §5)

   ⚠️⚠️ **히어로의 두 단추는 서로 다른 일을 합니다** (지시서 §3-B).
     업체 직접 찾기      /search  — 손님이 직접 고르고 비교합니다
     견적 · 매칭 요청하기  /match   — 조건을 적으면 업체가 제안합니다
   둘을 같은 곳으로 보내면 지시서가 못 박은 것을 어깁니다.

   ⚠️⚠️ **제3자 제공 동의를 여기서 받지 않습니다.** 지시서 §5 의 5번은
   여기서 같이 받으라고 적었지만, 그 시점에는 **어느 업체에 줄지
   정해지지 않았습니다.** 개인정보보호법 제17조 제2항은 제공받는 자를
   알리고 동의를 받으라고 합니다 — 누구에게 줄지 모르는 뭉뚱그린
   동의는 위반입니다. 여기서는 **수집 · 이용 동의만** 받고, 업체가
   정해지는 순간 상호를 알리고 **다시** 받습니다.

   ⚠️ 지금은 업체가 0곳이라 **제안이 오지 않습니다.** 그 사실을 화면이
   그대로 말합니다 (절대 규칙 5 — 지킬 수 없는 약속을 하지 않습니다).
   ════════════════════════════════════════════════════════════════════ */
var W = global.window, esc = W.esc, icon = W.icon;

var STEPS = [
  ["원하는 서비스를 고릅니다", "분류 안의 항목에서 고르시면 됩니다. 여러 개 고르셔도 됩니다."],
  ["조건을 적습니다",         "지역 · 예산 · 희망 일정 · 더 하실 말씀."],
  ["업체가 제안합니다",       "조건에 맞는 업체에 요청이 전달되고, 업체가 상담 또는 견적을 보냅니다."],
  ["비교하고 고릅니다",       "받은 제안을 나란히 놓고 보신 뒤 마음에 드는 업체와 진행하십니다."]
];

exports.build = function(){
  var body = '<section class="pghd"><div class="wrap">' +
    '<nav class="crumb" aria-label="현재 위치"><a href="/">홈</a>' + icon("arrow",14) +
    '<span aria-current="page">견적 · 매칭 요청</span></nav>' +
    '<h1>한 번에 견적 · 매칭 요청하기</h1>' +
    '<p class="pghd-l">원하는 조건만 적으시면 그 일을 하는 업체가 제안을 보냅니다. ' +
    '여러 곳을 일일이 찾아다니지 않으셔도 됩니다.</p>' +
  '</div></section>';

  body += '<section class="sec"><div class="wrap">' +
    '<div class="sec-hd"><h2>이렇게 됩니다</h2></div>' +
    '<ol class="flow">' + STEPS.map(function(r, i){
      return '<li><span class="flow-n">' + (i+1) + '</span>' +
        '<div><h3>' + esc(r[0]) + '</h3><p>' + esc(r[1]) + '</p></div></li>';
    }).join("") + '</ol></div></section>';

  body += '<section class="sec sec-alt"><div class="wrap">' +
    '<div class="sec-hd"><h2>요청 적기</h2></div>' +
    '<div id="matchbox" class="none">' +
      '<h2>지금은 요청을 받지 못합니다.</h2>' +
      '<p>받을 자리를 준비하고 있습니다. 다 적으신 뒤에 실패하는 일이 없도록, ' +
      '준비가 끝나기 전에는 양식을 열지 않습니다.</p>' +
      '<a class="btn btn-line" href="/categories">' + icon("arrow",18) + '카테고리 둘러보기</a>' +
    '</div></div></section>';

  body += '<section class="sec"><div class="wrap"><ul class="notes">' +
    '<li>요청을 적으시는 자리에서는 <b>수집 · 이용 동의</b>만 받습니다. ' +
    '업체에 성함과 연락처를 전달할 때에는 <b>어느 업체인지 알려 드리고 그때 다시</b> 동의를 받습니다. ' +
    '동의하지 않으시면 그 업체에는 전달되지 않습니다.</li>' +
    '<li>골프올인원은 <b>통신판매중개자</b>이며 거래 당사자가 아닙니다. ' +
    '제안의 내용과 이행에 관한 책임은 각 업체에 있습니다.</li>' +
    '<li>요청과 제안을 보시는 것은 <b>무료</b>입니다. 수수료는 업체가 부담합니다.</li>' +
    '</ul></div></section>';

  return {
    route: "/match", title: "견적 · 매칭 요청",
    crumbs: [["견적 · 매칭 요청", "/match"]],
    desc: "골프 레슨 · 부킹 · 연습장 · 용품 · 피팅 · 여행 — 조건만 적으면 " +
          "그 일을 하는 업체가 견적과 상담을 제안합니다. 요청은 무료입니다.",
    body: body,
    /* ⚠️ `js/photo.js` 는 **접수한 뒤에만** 칸을 그립니다 (§5-4) —
       버킷이 설정되기 전에는 아무것도 안 그립니다. */
    js: ["/js/data/site.js", "/js/data/regions.js",
         "/js/data/providers.generated.js", "/js/data/providers.js",
         "/js/auth.js", "/js/photo.js", "/js/matchform.js"]
  };
};
