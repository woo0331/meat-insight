/* ════════════════════════════════════════════════════════════════════
   관리자 — /admin  (지시서 7번)

   ⚠️⚠️ **세는 것은 DB 가 합니다.** 화면이 목록을 받아 길이를 세면
   RLS 가 가린 줄까지 "없는 것" 으로 읽습니다.
   ⚠️⚠️ **못 읽은 것과 0건은 다릅니다.** 못 읽었는데 0 으로 찍으면
   멀쩡한 줄이 사라진 것처럼 보입니다.
   ⚠️ 운영자가 아니면 왜 안 되는지 자세히 적지 않습니다 — 권한 구조를
   알려 주는 글이 됩니다.
   ⚠️⚠️ **관리자를 이 화면에서 만들 수 없습니다.** 역할 올리기는 SQL
   로만 합니다 (0021 의 account_role_guard · 0025 의 member_hat).
   ════════════════════════════════════════════════════════════════════ */
var W = global.window, esc = W.esc, icon = W.icon;

exports.build = function(){
  var body = '<section class="pghd"><div class="wrap">' +
    '<nav class="crumb" aria-label="현재 위치"><a href="/">홈</a>' + icon("arrow",14) +
    '<span aria-current="page">관리자</span></nav>' +
    '<h1>관리자</h1>' +
    '<p class="pghd-l">회원 · 업체 · 상담 · 거래 · 광고 · 멤버십 현황입니다.</p>' +
  '</div></section>';

  body += '<section class="sec"><div class="wrap">' +
    '<div id="adminbox" class="none" hidden></div></div></section>';

  return {
    route: "/admin", title: "관리자", noindex: true, unlinked: true,
    desc: "골프올인원 관리자 화면.",
    body: body, js: ["/js/data/korean.js", "/js/auth.js", "/js/account.js"]
  };
};
