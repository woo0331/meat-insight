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

  /* ⚠️⚠️ 배정은 **따로 그립니다** (js/assign.js). 그 단추가 개인정보
     보호법 제17조를 지나는 자리라, 현황 세는 코드와 섞어 두면 한쪽을
     고칠 때 동의 받는 자리가 같이 흔들립니다. */
  body += '<section class="sec sec-alt"><div class="wrap">' +
    '<div id="assignbox" class="none" hidden></div></div></section>';

  /* ⚠️⚠️ 매각 지표도 **따로 그립니다** (js/metrics.js). 사업의 값을
     매기는 숫자라, 현황 세는 코드와 섞어 두면 한쪽을 고칠 때 지표가
     같이 흔들립니다. */
  body += '<section class="sec"><div class="wrap">' +
    '<div id="metricbox" class="none" hidden></div></div></section>';

  /* ⚠️⚠️ 수수료 정책 · 광고 · 멤버십도 **따로 그립니다** (js/adminbiz.js).
     돈이 걸린 자리라, 세는 코드 · 배정 코드와 섞어 두면 한쪽을 고칠 때
     그 경계가 흐려집니다. ⚠️ 이 자리는 **관리자만**입니다 (직원도
     안 됩니다 — 문들이 전부 관리자만 받습니다). */
  /* 업체 심사 · 정지 (3차 지시서 §2 · §8) — ⚠️ 이 자리가 없어서
     approve_provider 를 부르는 화면이 한 곳도 없었습니다. */
  body += '<section class="sec"><div class="wrap">' +
    '<div id="probox" class="none" hidden></div></div></section>';

  /* 업체 담당자 (0052) — ⚠️⚠️⚠️ **담당자를 끊는 문이 저장소에 한 줄도
     없었습니다.** 0043 이 잇는 길(초대 코드)만 냈고, 그만둔 담당자는
     사장님이 SQL 을 직접 치셔야 끊겼습니다 — 그때까지 그 사람은 그
     업체의 요청과 손님 연락처를 계속 봅니다. ⚠️ 담당자가 0명인 업체도
     여기서 모아 냅니다 (0018 이 막으려던 자리입니다). */
  body += '<section class="sec sec-alt"><div class="wrap">' +
    '<div id="pvstadm" class="none" hidden></div></div></section>';

  /* 신고 · 분쟁 (0040 · 3차 지시서 §6 · §8) — ⚠️ 문만 만들고 이 자리를
     안 만들면 손님이 보낸 신고는 아무도 안 읽는 표에 쌓입니다. */
  body += '<section class="sec sec-alt"><div class="wrap">' +
    '<div id="repbox" class="none" hidden></div></div></section>';

  /* 고객센터 문의 (0045 · 4차 지시서 §11) — ⚠️⚠️ 지시서가 "관리자가
     확인할 수 없는 문의 접수 기능은 완료로 처리하지 않는다" 고 적은
     바로 그 자리입니다. 문(open_inquiry)만 열고 이 자리를 안 만들면
     손님이 보낸 문의는 아무도 안 읽는 표에 쌓입니다. */
  body += '<section class="sec"><div class="wrap">' +
    '<div id="inqadm" class="none" hidden></div></div></section>';

  body += '<section class="sec sec-alt"><div class="wrap">' +
    '<div id="bizbox" class="none" hidden></div></div></section>';

  /* ⚠️⚠️⚠️ **수수료 확정 · 입금 · 월 정산서** (0003 · 0013 · js/adminfee.js).
     문 다섯이 2026-10-21/22 에 섰는데 **부르는 화면이 한 곳도 없어서**,
     업체 작업실의 수수료 칸이 영원히 0건이었고 사장님이 SQL 편집기를
     직접 치셔야 숫자가 생겼습니다. 매각 지표의 수수료도 여기서 옵니다. */
  body += '<section class="sec"><div class="wrap">' +
    '<div id="feeadm" class="none" hidden></div></div></section>';

  /* 운영 감사 기록 (4차 지시서 §5) — ⚠️⚠️ 기록은 0004 부터 쌓고
     있었는데 **보는 자리가 0곳**이었습니다. */
  body += '<section class="sec"><div class="wrap">' +
    '<div id="logbox" class="none" hidden></div></div></section>';

  return {
    route: "/admin", title: "관리자", noindex: true, unlinked: true,
    desc: "골프올인원 관리자 화면.",
    body: body,
    js: ["/js/data/korean.js", "/js/data/deal.js", "/js/data/metrics.js",
         "/js/data/regions.js",
         "/js/data/review.js", "/js/auth.js", "/js/photo.js",
         "/js/account.js", "/js/review.js", "/js/assign.js",
         "/js/adminpro.js", "/js/adminrep.js", "/js/admininq.js",
         "/js/adminlog.js", "/js/metrics.js", "/js/adminbiz.js",
         "/js/adminstaff.js", "/js/adminfee.js"]
  };
};
