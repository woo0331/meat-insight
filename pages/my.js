/* ════════════════════════════════════════════════════════════════════
   내 정보 — /my  (지시서 6번 "하나의 계정이 여러 역할")

   ⚠️⚠️ **권한과 능력을 한 칸에 담지 않습니다.**
     권한(role)  플랫폼이 정합니다 — 화면에서 못 바꿉니다.
     능력(hats)  판매자 · 프로는 본인이 켭니다. 사업자는 승인으로만.
   ⚠️ 색인하지 않습니다 (개인 화면).
   ════════════════════════════════════════════════════════════════════ */
var W = global.window, esc = W.esc, icon = W.icon;

exports.build = function(){
  var body = '<section class="pghd"><div class="wrap">' +
    '<nav class="crumb" aria-label="현재 위치"><a href="/">홈</a>' + icon("arrow",14) +
    '<span aria-current="page">내 정보</span></nav>' +
    '<h1>내 정보</h1>' +
    '<p class="pghd-l">하시는 일을 켜고 끄실 수 있습니다. 켠 만큼 쓸 수 있는 자리가 늘어납니다.</p>' +
  '</div></section>';

  body += '<section class="sec"><div class="wrap">' +
    '<div id="mybox" class="none" hidden></div></div></section>';

  /* ⚠️⚠️ **알림을 맨 위에 둡니다** (0050) — 들어와서 처음 보는 것이
     "무엇이 생겼나" 여야 합니다. 0건이면 그 상자가 **줄째 빠집니다**
     (js/notice.js 가 안 그립니다).
     ⚠️ 밖으로는 **안 보냅니다** — 그래서 "문자로 알려 드립니다" 같은
     말을 어디에도 적지 않습니다 (절대 규칙 5). */
  body += '<section class="sec"><div class="wrap">' +
    '<div id="noticebox" class="none" hidden></div></div></section>';

  /* ⚠️ 내 요청 · 받은 견적은 **따로 그립니다** (js/myreq.js). 한 파일에
     담으면 로그인 자리 하나를 고칠 때마다 견적 비교가 같이 흔들립니다. */
  body += '<section class="sec sec-alt"><div class="wrap">' +
    '<div id="reqbox" class="none" hidden></div></div></section>';

  /* ⚠️ 내 조인도 **따로 그립니다** (js/myjoin.js) — 같은 까닭입니다.
     ⚠️⚠️ 여기가 연락처를 주고받는 유일한 자리입니다 (0046 · 제17조). */
  body += '<section class="sec"><div class="wrap">' +
    '<div id="joinmine" class="none" hidden></div></div></section>';

  /* ⚠️⚠️ 내가 쓴 글도 **여기에서만** 고치고 내립니다 (0047) —
     공개 목록에는 `by_user` 칸이 아예 없어서 임자를 알 길이 없습니다. */
  body += '<section class="sec sec-alt"><div class="wrap">' +
    '<div id="mycq" class="none" hidden></div></div></section>';

  /* ⚠️ 내 구인 · 구직 · 제휴도 **따로 그립니다** (js/myjob.js · 0048).
     ⚠️⚠️ 여기도 연락처를 주고받는 유일한 자리입니다 (제17조 제2항) —
     목록 화면에는 연락처 칸이 아예 없습니다. */
  body += '<section class="sec"><div class="wrap">' +
    '<div id="jobmine" class="none" hidden></div></div></section>';

  /* ⚠️⚠️⚠️ **내가 보낸 문의와 그 답변** (0045 · 화면은 js/myinq.js).
     0045 가 답을 받는 문까지 세워 두고도 그 답을 읽는 화면이 한 곳도
     없었습니다 — 운영자는 답을 적고 손님은 어디서도 못 봤습니다.
     ⚠️ 0건이면 그 상자가 **줄째 빠집니다** (문의를 넣은 적 없는 분께
     빈 상자를 두지 않습니다). */
  body += '<section class="sec sec-alt"><div class="wrap">' +
    '<div id="myinqbox" class="none" hidden></div></div></section>';

  return {
    route: "/my", title: "내 정보", noindex: true, unlinked: true,
    desc: "골프올인원 내 정보 — 개인 판매자 · 골프 프로 · 사업자 회원을 켜고 끕니다.",
    body: body,
    js: ["/js/data/korean.js", "/js/data/deal.js", "/js/data/review.js",
         "/js/auth.js", "/js/photo.js", "/js/account.js",
         "/js/review.js", "/js/myreq.js",
         "/js/data/regions.js", "/js/myjoin.js", "/js/mycq.js",
         "/js/myjob.js", "/js/myinq.js", "/js/notice.js"]
  };
};
