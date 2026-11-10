/* ════════════════════════════════════════════════════════════════════
   로그인 — /login

   ⚠️⚠️ **비밀번호를 받지 않습니다.** 메일로 한 번 쓰는 링크만 보냅니다.
   비밀번호를 받으면 저장 · 재설정 · 유출 대비가 전부 따라옵니다.

   ⚠️⚠️⚠️ **소셜 로그인 단추 셋(카카오 · 네이버 · 구글)은 여기가
   아니라 `js/account.js` 가 그립니다** — 어느 것이 실제로 켜져
   있는지는 Supabase 만 알기 때문입니다 (`amAuthProviders()` 가
   물어봅니다). 빌드가 미리 찍으면 안 켠 단추가 손님 화면에
   서고, 누르면 거절당합니다 (절대 규칙 5).
   ⚠️ 색 · 이름 · 마크는 `js/data/social.js` 한 곳입니다.

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
    /* ⚠️⚠️ 이 줄은 **길이 몇 개든 참이어야** 합니다 — 소셜 로그인이
       켜지면 들어오시는 길이 넷이 되는데, 여기에 메일 이야기만
       적어 두면 그 순간 틀린 말이 됩니다. 그리고 메일 링크를
       설명하는 줄은 **양식 바로 위 한 곳**(js/account.js)에
       있습니다 — 두 곳에 적으면 한쪽만 고치는 날 어긋납니다. */
    '<p class="pghd-l">로그인하시면 보내신 요청과 받은 견적, 올리신 글을 ' +
    '한자리에서 보실 수 있습니다. 비밀번호는 만들지도 받지도 않습니다.</p>' +
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
    body: body, /* ⚠️⚠️ `social.js` 를 안 실으면 `window.AM_SOCIAL` 이 없어
       `amAuthProviders()` 가 **빈 배열**을 돌려주고 소셜 단추가
       조용히 안 그려집니다 (에러 0줄). `/help` 가 `site.js` 를
       안 실어 문의 양식이 조용히 안 열렸던 그 자리입니다. */
    js: ["/js/data/korean.js", "/js/data/social.js", "/js/auth.js",
         "/js/account.js"]
  };
};
