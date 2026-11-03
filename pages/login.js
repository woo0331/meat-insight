/* ════════════════════════════════════════════════════════════════════
   로그인 — /login

   ⚠️⚠️ **비밀번호를 받지 않습니다.** 메일로 한 번 쓰는 링크만 보냅니다.
   비밀번호를 받으면 저장 · 재설정 · 유출 대비가 전부 따라옵니다.

   ⚠️⚠️ **여기 찍히는 글은 로그인이 켜져 있든 꺼져 있든 참입니다.**
   양식은 자바스크립트가 덧댑니다 — /api/session 이 auth:false 면
   단추를 하나도 안 그립니다 (눌러도 아무 일이 안 나는 단추 금지).
   ════════════════════════════════════════════════════════════════════ */
var W = global.window, esc = W.esc, icon = W.icon;

exports.build = function(){
  var body = '<section class="pghd"><div class="wrap">' +
    '<nav class="crumb" aria-label="현재 위치"><a href="/">홈</a>' + icon("arrow",14) +
    '<span aria-current="page">로그인</span></nav>' +
    '<h1>로그인</h1>' +
    '<p class="pghd-l">메일 주소로 한 번 쓰는 링크를 보내 드립니다. ' +
    '비밀번호는 만들지도 받지도 않습니다.</p>' +
  '</div></section>';

  body += '<section class="sec"><div class="wrap">' +
    '<div id="loginbox" class="none" hidden></div>' +
    '<ul class="notes" style="margin-top:22px">' +
      '<li>가입과 로그인이 같습니다. 처음 들어오시면 그대로 회원이 됩니다.</li>' +
      '<li>로그인 뒤에 <b>하는 일</b>(개인 판매자 · 골프 프로)을 직접 켜실 수 있습니다. ' +
      '사업자 회원은 입점 신청이 승인될 때 붙습니다.</li>' +
      '<li>이 브라우저에만 로그인 기록이 남습니다. 성함과 연락처는 담지 않습니다.' +
      '<a class="btn btn-line btn-sm notes-go" href="/privacy">개인정보처리방침 보기</a></li>' +
    '</ul></div></section>';

  return {
    route: "/login", title: "로그인", noindex: true, unlinked: true,
    desc: "골프올인원 로그인 — 메일로 받은 링크 한 번으로 들어옵니다. 비밀번호를 만들지 않습니다.",
    body: body, js: ["/js/data/korean.js", "/js/auth.js", "/js/account.js"]
  };
};
