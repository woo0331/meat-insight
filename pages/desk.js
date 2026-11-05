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

  /* ⚠️⚠️ **알림을 맨 위에 둡니다** (0050) — 업체도 지원 · 신고가
     들어온 것을 여기서 압니다. 0건이면 줄째 빠집니다.
     ⚠️ 밖으로는 **안 보냅니다** (문자 · 카톡 · 메일 없음). */
  /* ⚠️⚠️ `data-role` — **이 자리는 업체 담당자의 것입니다.** 안 적으면
     일반회원이 이 주소로 들어와도 제 알림을 읽으러 갑니다 (그 화면의
     다른 자리는 "한 줄도 안 보이고 읽으러 가지도 않는다" 인데 알림만
     혼자 움직이는 꼴입니다). */
  body += '<section class="sec"><div class="wrap">' +
    '<div id="noticebox" class="none" data-role="provider" hidden></div>' +
    '</div></section>';

  body += '<section class="sec"><div class="wrap">' +
    '<div id="deskbox" class="none" hidden></div></div></section>';

  /* ⚠️⚠️ 수수료 · 정산은 **따로 그립니다** (js/deskfee.js). 손님에게는
     한 줄도 안 보이는 표라(0001 의 fee_mine · deal_mine), 배정 · 견적
     코드와 섞어 두면 한쪽을 고칠 때 그 경계가 흐려집니다. */
  /* 업체 정보 (0044) — ⚠️⚠️ 이 자리가 없어서 업체는 소개 한 줄을
     고치려고 운영자에게 전화해야 했습니다 (save_provider_self 를
     부르는 자리가 0곳이었습니다). */
  body += '<section class="sec"><div class="wrap">' +
    '<div id="mebox" class="none" hidden></div></div></section>';

  /* 사진 · 증빙서류 (0051) — ⚠️⚠️ **시설 사진은 손님 누구나 보고,
     증빙서류는 운영자와 이 업체만** 봅니다. 둘을 한 자리에 두되 화면이
     갈라서 말합니다 — 섞어 두면 사업자등록증을 사진 칸에 올리는 날이
     오고, 그러면 그게 공개됩니다.
     ⚠️ 버킷이 없으면 그 칸이 **아예 안 나옵니다** (갈래마다 따로). */
  body += '<section class="sec sec-alt"><div class="wrap">' +
    '<div id="pvphbox" class="none" hidden></div></div></section>';

  /* 가격 등록 (0042) — ⚠️⚠️ 이 자리가 없으면 업체는 가격을 올릴 길이
     없고, 업체찾기의 가격 줄은 **영원히 비어 있습니다.** */
  body += '<section class="sec sec-alt"><div class="wrap">' +
    '<div id="pricebox" class="none" hidden></div></div></section>';

  body += '<section class="sec"><div class="wrap">' +
    '<div id="feebox" class="none" hidden></div></div></section>';

  return {
    route: "/desk", title: "업체 작업실", noindex: true, unlinked: true,
    desc: "골프올인원 업체 작업실 — 배정받은 요청 확인 · 수락 · 견적 제출.",
    body: body,
    js: ["/js/data/korean.js", "/js/data/deal.js", "/js/data/review.js",
         "/js/data/regions.js", "/js/data/providers.js",
         "/js/photo.js", "/js/auth.js", "/js/review.js",
         "/js/desk.js", "/js/deskme.js", "/js/deskprice.js",
         "/js/deskfee.js", "/js/deskphoto.js", "/js/notice.js"]
  };
};
