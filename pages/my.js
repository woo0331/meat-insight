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

  /* ⚠️ 내 요청 · 받은 견적은 **따로 그립니다** (js/myreq.js). 한 파일에
     담으면 로그인 자리 하나를 고칠 때마다 견적 비교가 같이 흔들립니다. */
  body += '<section class="sec sec-alt"><div class="wrap">' +
    '<div id="reqbox" class="none" hidden></div></div></section>';

  return {
    route: "/my", title: "내 정보", noindex: true, unlinked: true,
    desc: "골프올인원 내 정보 — 개인 판매자 · 골프 프로 · 사업자 회원을 켜고 끕니다.",
    body: body,
    js: ["/js/data/korean.js", "/js/data/deal.js", "/js/auth.js",
         "/js/photo.js", "/js/account.js", "/js/myreq.js"]
  };
};
