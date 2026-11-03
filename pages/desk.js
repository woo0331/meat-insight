/* ════════════════════════════════════════════════════════════════════
   업체 작업실 — /desk  (2차 지시서 §7)

   ⚠️⚠️ **색인하지 않습니다.** 손님 요청의 성함 · 연락처가 나오는
   화면입니다 — 크롤러에게 보일 까닭이 없고, 보이면 안 됩니다.
   ⚠️ 그려지는 것은 전부 `js/desk.js` 가 합니다. 여기 HTML 에는
   **손님 자료가 한 글자도** 들어가지 않습니다 (빌드는 DB 를 안 봅니다).
   ⚠️ 머리말에 요청을 찾아 주는 말 말고는 아무 약속도 하지 않습니다 —
   배정이 0건이면 화면이 0건이라고 말합니다.
   ════════════════════════════════════════════════════════════════════ */
var W = global.window, esc = W.esc, icon = W.icon;

exports.build = function(){
  var body = '<section class="pghd"><div class="wrap">' +
    '<nav class="crumb" aria-label="현재 위치"><a href="/">홈</a>' + icon("arrow",14) +
    '<span aria-current="page">업체 작업실</span></nav>' +
    '<h1>업체 작업실</h1>' +
    '<p class="pghd-l">배정받은 요청을 보시고, 수락하신 뒤 견적을 내시는 자리입니다.</p>' +
  '</div></section>';

  body += '<section class="sec"><div class="wrap">' +
    '<div id="deskbox" class="none" hidden></div></div></section>';

  /* ⚠️⚠️ 수수료 · 정산은 **따로 그립니다** (js/deskfee.js). 손님에게는
     한 줄도 안 보이는 표라(0001 의 fee_mine · deal_mine), 배정 · 견적
     코드와 섞어 두면 한쪽을 고칠 때 그 경계가 흐려집니다. */
  body += '<section class="sec sec-alt"><div class="wrap">' +
    '<div id="feebox" class="none" hidden></div></div></section>';

  return {
    route: "/desk", title: "업체 작업실", noindex: true, unlinked: true,
    desc: "골프올인원 업체 작업실 — 배정받은 요청 확인 · 수락 · 견적 제출.",
    body: body,
    js: ["/js/data/korean.js", "/js/data/deal.js", "/js/data/review.js",
         "/js/photo.js", "/js/auth.js", "/js/review.js",
         "/js/desk.js", "/js/deskfee.js"]
  };
};
