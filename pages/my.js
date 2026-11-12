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

  /* ⚠️⚠️ 내가 신청한 예약 (0060 · js/mybook.js) — ⚠️⚠️⚠️ 이 화면이
     없으면 신청은 들어가는데 **업체가 확정했는지 어디서도 못 봅니다**
     (0045 가 답을 받는 자리까지 세우고 읽는 화면을 안 만든 그 자리).
     ⚠️ 0건이면 그 상자가 **줄째 빠집니다**. */
  body += '<section class="sec"><div class="wrap">' +
    '<div id="bkbox" class="none" hidden></div></div></section>';

  /* ⚠️ 내 조인도 **따로 그립니다** (js/myjoin.js) — 같은 까닭입니다.
     ⚠️⚠️ 여기가 연락처를 주고받는 유일한 자리입니다 (0046 · 제17조). */
  body += '<section class="sec"><div class="wrap">' +
    '<div id="joinmine" class="none" hidden></div></div></section>';

  /* ⚠️⚠️ 내가 쓴 글도 **여기에서만** 고치고 내립니다 (0047) —
     공개 목록에는 `by_user` 칸이 아예 없어서 임자를 알 길이 없습니다. */
  body += '<section class="sec sec-alt"><div class="wrap">' +
    '<div id="mycq" class="none" hidden></div></div></section>';

  /* ⚠️⚠️ 공개 닉네임 (0059 · js/mynick.js) — 게시판에 글쓴이로 나가는
     이름입니다. 안 정하시면 공개 보기가 **성함을 가려서** 냅니다.
     ⚠️ 글 상자 바로 아래에 둡니다 — 글을 올리기 전에 정하는 것이
     순서이고, 맨 위에 두면 게시판을 안 쓰는 분께 쓸 일 없는 칸이
     먼저 보입니다. */
  body += '<section class="sec"><div class="wrap">' +
    '<div id="nickbox" class="none" hidden></div></div></section>';

  /* ⚠️⚠️ 내 중고 매물도 **따로 그립니다** (js/mylisting.js · 0056).
     ⚠️⚠️⚠️ 여기도 연락처를 주고받는 유일한 자리입니다 (제17조 제2항) —
     목록 화면(`/cat/used`)에는 연락처 칸이 **아예 없습니다**. */
  body += '<section class="sec sec-alt"><div class="wrap">' +
    '<div id="lsmine" class="none" hidden></div></div></section>';

  /* ⚠️⚠️ 관심상품 — 찜해 두신 중고 매물 (0069 · js/myfav.js).
     ⚠️⚠️⚠️ **누가 무엇에 찜했는지는 제 것만 보입니다** — 파는 분에게도 ·
     운영자에게도 안 냅니다(행동 기록입니다 · 0059 의 조회 기록과 같은
     결). 그래서 보기도 `v_listing_fav` 하나이고 `auth.uid()` 로 좁힙니다.
     ⚠️ **찜 수를 어디에도 안 적습니다** — 세어 낼 수야 있지만 "인기" 로
     읽히고 우리가 검증할 길이 없습니다 (절대 규칙 1 의 결). */
  body += '<section class="sec"><div class="wrap">' +
    '<div id="favbox" class="none" hidden></div></div></section>';

  /* ⚠️⚠️ 저장한 공고 — 담아 두신 구인 · 구직 · 제휴 글 (0078 ·
     js/myjobfav.js). 관심상품과 **같은 규칙**입니다: 제 것만 보이고,
     저장 수는 어디에도 안 적고, **마감된 공고도 남깁니다**(마감되는
     순간 조용히 사라지면 저장해 두신 분이 무엇이 없어졌는지 알 수가
     없습니다). */
  body += '<section class="sec sec-alt"><div class="wrap">' +
    '<div id="jobfavbox" class="none" hidden></div></div></section>';

  /* ⚠️⚠️ 내 구합니다 글과 받은 답 (0061 · js/mywanted.js).
     ⚠️⚠️⚠️ 여기도 **연락처를 주고받는 유일한 자리**입니다 (제17조
     제2항) — 목록 화면(분류 다섯)에는 연락처 칸이 **아예 없습니다**.
     ⚠️ 받아들이기만으로는 안 열립니다. 각자 **제 것만** 열고 언제든
     닫습니다. */
  body += '<section class="sec"><div class="wrap">' +
    '<div id="wtmine" class="none" hidden></div></div></section>';

  /* ⚠️⚠️ 저장한 조건 (0058 · js/mywatch.js) — 조건을 저장해 두면 맞는
     글이 올라올 때 **내부 알림**이 꽂힙니다.
     ⚠️⚠️⚠️ 밖으로 안 보냅니다 (문자 · 카톡 · 메일을 붙이면 정보통신망법
     제50조 · 수탁자 · 환경변수 셋이 같이 움직입니다).
     ⚠️ 보유 기간(`site.js` 의 `watchKeep`)이 비면 양식을 **안 엽니다** —
     그래서 아래 js 목록에 **`/js/data/site.js` 가 있어야** 합니다. */
  body += '<section class="sec"><div class="wrap">' +
    '<div id="wchbox" class="none" hidden></div></div></section>';

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
         /* ⚠️⚠️ 0058 — `watchKeep` 이 여기 있습니다. 안 실으면 값이 빈
            글자가 되어 **설정이 안 된 것과 똑같이** 보이고 조건 저장
            양식이 조용히 안 열립니다 (`/help` 가 이 파일을 안 실어서
            문의 양식이 안 열렸던 그 자리입니다). */
         "/js/data/site.js",
         "/js/auth.js", "/js/photo.js", "/js/account.js",
         "/js/review.js", "/js/myreq.js",
         "/js/data/regions.js", "/js/myjoin.js", "/js/mycq.js",
         /* ⚠️ `lstphoto.js` 는 매물 사진 상자 **한 곳**입니다 (0068) —
            `/cat/used` 도 같은 파일을 싣습니다. */
         /* ⚠️⚠️⚠️ `imgprep.js` 를 **사진 상자보다 먼저** 싣습니다 — 올리기 전에
            위치정보(EXIF)를 떼고 줄이는 한 곳입니다. 안 실으면
            `amImgPrep` 이 없어 올리기가 **거절**됩니다(원본을 그냥
            올리지 않습니다 — 그 한 장만 조용히 집 좌표를 달고
            공개 버킷에 들어갑니다). */
         "/js/myjob.js", "/js/imgprep.js", "/js/lstphoto.js", "/js/mylisting.js",
         "/js/myfav.js", "/js/myjobfav.js",
         "/js/myinq.js", "/js/mynick.js",
         /* ⚠️ 0061 — catalog.js 가 분류 · 하위 이름을, deal.js 가 상태
            말과 예산 셈을, regions.js 가 지역 이름을 줍니다 (빌드가
            catalog 를 저절로 싣습니다). */
         "/js/mywanted.js",
         "/js/mybook.js",
         "/js/mywatch.js", "/js/notice.js"]
  };
};
