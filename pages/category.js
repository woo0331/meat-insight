/* ════════════════════════════════════════════════════════════════════
   분류 화면 — /cat/<key>  (지시서 3번 "카테고리별 상세 페이지")

   ⚠️⚠️ **주소에 c 한 글자를 쓰지 마세요.** vercel.json 이 /c/:p* 를
   410 으로 보냅니다 (앞 서비스가 쓰던 분류 주소). 거기에 화면을 지으면
   저장소에도 있고 로컬에서도 200 인데 **손님에게만 410** 이 나갑니다.
   tools/check-routes.js 가 빌드에서 멈춥니다.

   ⚠️⚠️ **하위 분류는 지금 따로 주소를 만들지 않습니다.** 59장을 지으면
   전부 내용이 0건인 얇은 화면이 되어 색인에서 손해입니다. 하위는 이
   화면 안에 글로 싣고(크롤러가 읽습니다), 업체가 쌓이면 그때 주소로
   올립니다. 올릴 때는 **한 화면에 주소 하나** 를 지키세요.

   ⚠️ 분류마다 kind 가 다릅니다 — 업체가 없는 분류(중고장터 · 조인 ·
   인력 · 커뮤니티)에 "업체 찾기" 를 붙이면 눌러도 아무 일이 안 나는
   단추가 됩니다. 말도 자리도 kind 로 갈립니다.
   ════════════════════════════════════════════════════════════════════ */
var W = global.window, esc = W.esc, icon = W.icon;
var card = require("./_card.js");

/* kind 마다 다른 말 — ⚠️ 두 곳에 적지 않습니다. 여기 한 곳입니다. */
var KIND = {
  provider: {
    what: "이 분류의 일을 하는 업체를 찾고 비교하는 자리입니다.",
    /* ⚠️⚠️ **길잡이 한 줄이 둘입니다** — 업체가 0곳일 때와 있을 때 할 말이
       다릅니다. 한 줄로 두면 업체가 들어오신 날 "업체가 등록되면 … 되게
       됩니다" 가 **이미 등록된 업체 목록 바로 위에서** 그대로 나옵니다
       (코드는 멀쩡하고 글만 썩는 자리). 고르는 자리는 pvBlock 한 곳입니다. */
    subs: "업체가 등록되면 아래 항목으로 걸러 볼 수 있게 됩니다. 요청하실 때도 여기서 고르십니다.",
    pvOn: "항목을 누르시면 그 일을 하는 업체만 모아 보여 드립니다.",
    zeroT:"아직 등록된 업체가 없습니다.",
    zeroD:"문을 열기 전이라 보여 드릴 업체가 없습니다. 없는 업체를 지어내 보여 드리지 않습니다.",
    /* ⚠️ 전에는 "이 분야 업체로 입점하기" 였습니다. 이 구간을 읽는 사람은
       **그 서비스를 찾는 손님**이라 자리가 어긋났고, 머리말 금색 단추 ·
       푸터와 합쳐 한 화면에 입점 권유가 세 번 나왔습니다 (지시서 §2).
       0곳일 때 손님이 지금 실제로 할 수 있는 것은 매칭 요청입니다. */
    cta:  ["/match", "이 분야로 매칭 요청하기", "match"]
  },
  trade: {
    /* ⚠️⚠️⚠️ **여기가 없는 기능을 있다고 말하고 있었습니다** (2026-11-06).
       전에 적힌 글은 "회원끼리 직접 사고파는 자리입니다" 와 "아직 올라온
       매물이 없습니다 · **첫 매물이 올라오면 여기에 바로 보입니다**" 였
       습니다. 그런데 매물을 올리는 **표도 · 문도 · 화면도 저장소에 한 줄도
       없습니다** — 세어 봤습니다(표 이름 전체를 훑었고, `offer` 는 앞
       사업의 잔재, `device*` 는 중고폰 잔재입니다). 바로 아래 `cta` 가
       `null` 인 것이 그 증거입니다: **올리는 단추가 없습니다.**
       즉 **영원히 안 오는 것을 기다리라고** 적어 둔 것입니다.
       ⚠️⚠️ 2026-11-05 에 조인 · 커뮤니티 · 인력이 "여는 기능은 아직
       없습니다" 라고 적고 있던 자리를 고쳤는데, **이것은 그 거울상**이고
       더 나쁩니다 — 안 하는 일을 한다고 적는 것이기 때문입니다 (절대
       규칙 5 · 표시 · 광고의 공정화에 관한 법률 제3조).
       ⚠️ 지금 이 분류에서 **실제로 되는 것**은 업체를 통한 둘입니다 —
       중고채 매입 견적 · 위탁판매 연결. 그 둘만 적습니다.
       ⚠️ 그렇다고 막다른 길로 두지 않습니다 — 아래 `asks(c)` 가 이 분류의
       매칭 요청 단추를 냅니다 (절대 규칙 2). */
    /* ⚠️⚠️⚠️ **2026-11-08 — 이 줄이 또 썩어 있었습니다.** "업체를 통해
       팔거나 사는 자리" 라고 적혀 있었는데, 그 글은 **매물을 올리는 길이
       아예 없던 2026-11-06** 에 쓴 것입니다. 0056 이 매물을 · 0068 이
       사진과 브랜드를 세운 뒤로 이 분류의 알맹이는 **회원끼리 직거래**
       이고, 업체가 하는 것은 둘(매입 견적 · 위탁판매)뿐이며 그 업체는
       0곳입니다 — 되는 것을 안 적고 안 되는 것을 주된 것처럼 적는
       꼴이었습니다(절대 규칙 5 의 거울상).
       ⚠️ **기능을 세운 날 그 기능을 설명하는 글을 같이 고치세요** —
       이 저장소가 다섯 번 밟은 자리입니다. */
    what: "회원끼리 직접 사고파는 자리입니다. 업체에 맡기는 매입 견적 · " +
          "위탁판매도 아래에서 함께 연결해 드립니다. " +
          "골프올인원은 거래 당사자가 아닙니다.",
    /* ⚠️⚠️ **아홉 가운데 둘만 눌립니다** (`pv:true` 인 매입 견적 ·
       위탁판매). 그래서 아래 "눌러 보시면 …" 한 줄을 **덧붙이지
       않습니다** — 그 줄은 하위가 **전부** 눌릴 때만 붙습니다. */
    /* ⚠️⚠️⚠️ **기능을 세운 날 그 기능을 설명하는 글을 같이 고칩니다.**
       0056 이 매물 올리기를 세웠으니 "아직 열지 않았습니다" 는 이제
       거짓입니다 — 2026-11-05 에 조인 · 커뮤니티 · 인력이 선 뒤에도
       "아직 없습니다" 가 남아 있던 그 자리를 되풀이하지 않습니다.
       ⚠️ 아홉 가운데 **둘만** 링크입니다(업체가 하는 매입 견적 ·
       위탁판매). 나머지 일곱은 **매물의 종류**이고, 아래 매물 목록의
       거르개에서 고르십니다. */
    subs: "물건 종류를 누르시면 그 종류의 매물만 모아 보여 드립니다.",
    /* 업체 쪽 덩이의 머리말 — ⚠️ 중고만 "0곳" 이 **제목이 아닙니다**.
       여기는 업체가 없어도 매물이 도는 자리라, 업체는 **곁들이는 것**
       입니다. 그래서 제목이 "업체에 맡기실 수도 있습니다" 이고 "아직
       등록된 업체가 없습니다" 는 그 안의 h3 입니다. */
    pvH:  "업체에 맡기실 수도 있습니다",
    pvD:  "직접 팔기 번거로우시면 업체가 값을 매겨 사 가거나(매입 견적) " +
          "대신 팔아(위탁판매) 드립니다.",
    pvNote: null,
    cta:  null
  },
  match: {
    what: "함께 라운딩할 사람을 찾는 자리입니다.",
    /* ⚠️⚠️⚠️ 전에는 "여는 기능은 아직 없습니다" 였습니다 — 0046 이
       `open_joinroom` 과 `js/join.js` 를 세운 **뒤에도 그대로** 남아,
       바로 아래 "열려 있는 조인을 불러옵니다" 와 **한 화면이 두 말**을
       하고 있었습니다. 더 나쁜 것은 메인의 0곳 상자가 "지금 하실 수
       있는 것 — 조인 열기" 로 **이 화면에 보낸다**는 것입니다 (2026-11-05
       검수에서 찾았습니다). 하는 일을 안 한다고 적는 것도 절대 규칙 5 입니다.
       ⚠️ 하위는 **글로만** 둡니다 — `joinroom` 에 하위 칸이 없어 좁힐
       자료가 없습니다. 그래서 "아래 항목으로 찾습니다" 라고 적지 않습니다. */
    subs: "회원이 직접 여는 자리입니다. 아래와 같은 자리를 여실 수 있습니다.",
    zeroT:"아직 열린 조인이 없습니다.",
    zeroD:"첫 조인이 열리면 여기에 바로 보입니다.",
    cta:  null
  },
  board: {
    what: "글을 올리고 읽는 자리입니다.",
    /* ⚠️⚠️⚠️ 위 match 와 같은 자리 — 0047(`ask_cq`) · 0048(`open_jobpost`)
       이 선 뒤에도 "올리는 기능은 아직 없습니다" 가 남아 있었습니다. */
    /* ⚠️⚠️ 2026-11-08 — 게시판 열둘이 `<span>` 이라 **한 번도 안
       눌렸습니다**. `js/community.js` 는 진작 `?s=` 를 읽고 있었고요
       (받는 쪽은 있는데 가는 길이 없던 자리). 이제 눌리므로 글도
       그 사실대로 적습니다. */
    subs: "갈래를 누르시면 그 갈래의 글만 모아 보여 드립니다.",
    zeroT:"아직 올라온 글이 없습니다.",
    zeroD:"첫 글이 올라오면 여기에 바로 보입니다.",
    cta:  null
  }
};

/* ⚠️⚠️ **중고장터의 0곳 안내는 업체를 찾는 자리와 같은 말입니다** —
   거기도 결국 "그 일을 하는 업체" 를 기다리는 자리이기 때문입니다. 글을
   두 벌로 적으면 한쪽만 고치는 날 두 화면이 다른 말을 합니다. */
KIND.trade.zeroT = KIND.provider.zeroT;
KIND.trade.zeroD = KIND.provider.zeroD;

/* ⚠️⚠️ **빈 자리를 막다른 길로 두지 않습니다** (절대 규칙 2). 0건일 때
   손님이 **지금 실제로 할 수 있는 것**으로 보냅니다 — 업체 분류는 매칭
   요청입니다.
   ⚠️⚠️ 회원끼리 쓰는 분류(조인 · 커뮤니티 · 인력)에 `cta` 를 안 두는
   까닭은 **할 수 있는 것이 없어서가 아닙니다** — 여는 · 올리는 양식이
   **바로 이 화면 안에** 있습니다(`js/join.js` · `js/community.js` ·
   `js/career.js`). 다른 데로 보낼 까닭이 없어서 안 냅니다.
   ⚠️⚠️ **중고장터도 2026-11-08 에 같은 꼴이 되었습니다** — 여기 "아직
   문이 없어 정말로 `cta` 가 없습니다" 라고 적혀 있었는데 0056 이 그 문을
   세웠고 양식은 **이 화면 안**(`js/listing.js` 의 `#lsbox`)에 있습니다.
   썩은 줄을 또 남길 뻔했습니다 — **기능을 세운 날 그 기능을 설명하는
   주석도 같이** 고치세요.
   ⚠️ 매칭 요청 화면은 업체가 0곳이어도 접수되고(운영자가 받습니다),
   그 화면이 그 사실을 스스로 말합니다. */

/* ── 중고장터만의 머리 — ⚠️ 시안의 히어로 + 퀵액션 줄 (2026-11-09) ──
   ⚠️⚠️⚠️ **「내 구매내역」을 안 만듭니다.** 시안에는 있지만 저희에게는
   주문도 · 결제도 · 배송도 없습니다(결제를 아예 안 받습니다 ·
   제20조의3). 칸을 내면 눌러서 빈 화면으로 가거나, 더 나쁘게는 "거래
   기록이 남는 곳" 으로 읽힙니다 — 지시서 §5 도 "실제 주문/결제 시스템이
   없으면 허위 기록을 만들지 말고 메뉴 명칭 · 노출 여부를 조정한다" 고
   적었습니다.
   ⚠️⚠️ **찜한 상품 옆에 숫자를 안 적습니다**(시안은 「찜한상품 0」) —
   빌드는 그 수를 셀 수가 없고, 0 을 찍으면 그건 **세어 본 값이
   아닙니다**(절대 규칙 1 · 현황표 칸에 `–` 를 적은 그 자리).
   ⚠️ 히어로의 딱지 셋은 시안의 「안전거래 가이드 · 간편한 등록 · 다양한
   골프용품」 자리인데, 셋째는 **매물이 0건일 때 거짓**이라 중개 고지로
   바꿨습니다(그 자리에서 참인 말만 적습니다).
   ⚠️⚠️ 히어로는 메인과 **같은 클래스**(`.hero.hero-ph`)를 씁니다 —
   글자 대비를 책임지는 딥그린 막이 거기 있고, 두 벌로 적으면 한쪽만
   고치는 날 한 화면에서만 글이 안 읽힙니다. `.hero-sm` 은 높이만
   줄입니다. */
function usedHead(c){
  var ph = W.amPhoto ? W.amPhoto("hero") : null;
  return '<section class="hero hero-sm' + (ph ? " hero-ph" : "") + '">' +
    (ph ? W.amPhotoImg("hero", { cls:"hero-bg", eager:true }) : "") +
    '<div class="wrap hero-in">' +
      '<h1>중고 골프장터</h1>' +
      '<p class="hero-sub">회원끼리 골프용품을 직접 사고파는 자리입니다.<br>' +
      '클럽 · 의류 · 용품을 사진과 함께 올리시고, 매입 · 위탁은 ' +
      '업체로 이어 드립니다.</p>' +
      '<ul class="lshd-b">' +
        '<li><a href="#safe">' + icon("shield", 17) + '안전거래 가이드</a></li>' +
        '<li><a href="#lsbox">' + icon("camera", 17) + '사진 열 장까지</a></li>' +
        '<li>' + icon("info", 17) + '골프올인원은 거래 당사자가 아닙니다</li>' +
      '</ul>' +
    '</div>' +
  '</section>' +
  /* ⚠️ 셋 다 **링크**입니다 — 단추로 만들면 자바스크립트가 꺼진 분 ·
     크롤러에게 눌러도 아무 일이 안 나는 칸이 됩니다(절대 규칙 5).
     ⚠️ 앞 둘은 `/my` 의 **실제 상자**로 갑니다(`#favbox` · `#lsmine`) —
     로그인하지 않으셨으면 `/my` 가 그 자리에서 로그인 길을 냅니다. */
  '<section class="pghd pghd-ls"><div class="wrap lshd">' +
    '<div class="lshd-t">' + crumbs(c) + '</div>' +
    '<nav class="lshd-q" aria-label="중고장터 빠른 이동">' +
      '<a href="/my#favbox">' + icon("heart", 17) + '찜한 상품</a>' +
      '<a href="/my#lsmine">' + icon("store", 17) + '내 판매글</a>' +
      '<a class="btn btn-pt lshd-new" href="#lsbox">' +
        icon("check", 17) + '판매글 등록</a>' +
    '</nav>' +
  '</div></section>';
}

/* ── 안전거래 가이드 — ⚠️ 시안의 바닥 안내입니다 (2026-11-09) ────────
   ⚠️⚠️ 전에는 이 말이 매물 목록 아래 `⚠️` 두 줄로만 있었습니다. 히어로의
   「안전거래 가이드」가 갈 자리가 있어야 하고(절대 규칙 5), 분쟁이 났을
   때 "어디에 적어 두었나" 가 있어야 합니다.
   ⚠️⚠️⚠️ **「안전결제」 · 「거래보호」 를 한 글자도 적지 않습니다** —
   결제를 아예 안 받습니다(제20조의3). 적는 순간 지키지 못할 약속이고,
   오히려 **그것을 내세우는 상대가 사기**라고 말해 주는 쪽이 맞습니다. */
function safeGuide(){
  var L = [
    ["만나서 물건을 보고 거래하세요",
     "중고채는 사진으로 흠집 · 샤프트 강도를 알기 어렵습니다. " +
     "택배는 올리신 분이 된다고 적어 주신 경우이고, 골프올인원이 " +
     "보내 드리지는 않습니다."],
    ["먼저 보내 달라는 요구는 받아들이지 마세요",
     "값을 먼저 보내면 돌려받을 길이 저희에게 없습니다. " +
     "골프올인원은 대금을 받지도 · 맡아 두지도 않습니다."],
    ["「안전결제」 를 하자는 상대는 사기입니다",
     "저희에게는 결제가 아예 없습니다. 그런 주소를 보내 오면 " +
     "누르지 마시고 신고해 주세요."],
    ["연락처는 두 분이 각자 고르셨을 때만 보입니다",
     "문의를 받아들이는 것은 「팔겠습니다」 이지 「번호를 줘도 좋다」 가 " +
     "아닙니다. 연 뒤에도 언제든 닫으실 수 있습니다."],
    ["시세보다 크게 싼 물건은 한 번 더 보세요",
     "사진을 다른 곳에서 가져다 쓰는 일이 있습니다. " +
     "다른 각도에서 찍은 사진을 더 보여 달라고 하셔도 됩니다."]
  ];
  return '<section class="sec" id="safe"><div class="wrap">' +
    '<div class="sec-hd"><h2>안전거래 가이드</h2>' +
    '<p>골프올인원은 통신판매중개자이며 <b>거래 당사자가 아닙니다</b>. ' +
    '값 · 물건 · 배송에 대한 책임은 올리신 분과 사시는 분에게 있습니다.</p></div>' +
    '<ol class="sfg">' + L.map(function(x){
      return '<li><b>' + esc(x[0]) + '</b><span>' + esc(x[1]) + '</span></li>';
    }).join("") + '</ol>' +
    '<p class="jnote">사기 · 분쟁이 생기면 <b>내 정보</b>의 신고 자리나 ' +
    '고객센터로 알려 주세요. 분쟁조정기구 · 수사기관 · 법원의 요청이 ' +
    '있으면 약관에 적힌 대로 거래 기록을 냅니다.</p>' +
    '<div class="none-b">' +
      '<a class="btn btn-line" href="/help">고객센터</a>' +
      '<a class="btn btn-line" href="/terms">이용약관</a>' +
    '</div>' +
  '</div></section>';
}

/* ══ 골프 레슨 — 머리 · 찾는 칸 · 카테고리 카드 (2026-11-10) ════════
   레슨 지시서 §3 · §4 · §5 · §6 · §10 · §13.

   ⚠️⚠️⚠️ **시안에 있는데 안 그리는 것을 여기 적어 둡니다** — 다음 차수가
   "왜 빠졌지" 하고 다시 만들지 않게.
     · **프로 찜 하트** — 프로를 찜하는 표가 아직 없습니다(지시서 §6).
       그리면 눌러도 아무 일이 안 나는 단추입니다(절대 규칙 5).
     · **「인기순」 · 「최신 등록순」 정렬** — 조회도 · 등록일도 공개
       보기에 없습니다. 없는 값으로 줄을 세우면 아무 차례도 아닌 것을
       "인기" 라고 적는 꼴입니다(절대 규칙 1).
     · **「인기 검색어」라는 이름** — 세어 본 적이 없습니다.
       같은 칩을 **「자주 찾는 조건」** 으로 냅니다.
     · **스폰서 프로 자리** — 광고 자리 이름(`ad_place`)에 레슨 사이드
       자리가 없습니다. 자리를 더하는 마이그레이션과 같이 옵니다.
     · **레슨 목적 거르개 · 레슨 장소** — 2026-11-10 저녁에 냈습니다.
       0071 이 `provider.lesson_goals` · `provider.place_name` 을 더해서
       이제 참말입니다. ⚠️ 그 전에는 담는 칸이 없어 **일부러 안**
       만들었습니다 — 칸 없이 고르개를 내면 골라도 걸러 주지 못하는
       칸이고 그건 눌러도 아무 일이 안 나는 칸입니다(절대 규칙 5).
       목록은 `js/data/lesson.js` 의 `AM_LESSON_GOAL` **한 곳**입니다.
     · **지도형 보기** — 좌표를 담는 칸이 없습니다. 0066 이 골프장
       좌표를 **확인 전에는 비워 둔** 그 까닭과 같습니다(틀린 좌표로
       찍으면 손님을 엉뚱한 곳으로 보냅니다).

   ⚠️⚠️ 히어로는 메인 · 중고장터와 **같은 클래스**(`.hero.hero-ph`)를
   씁니다 — 글자 대비를 책임지는 딥그린 막이 거기 있습니다.
   ⚠️⚠️⚠️ **시안의 사진을 안 씁니다** — 모자의 Titleist · 셔츠의 PGA
   글자가 또렷해서, 그대로 깔면 제휴 · 보증으로 읽힙니다(표시광고법
   제3조 · 2026-11-04 에 분류 사진 두 장에서 겪은 그 자리). 지금은
   들여올 때 상표를 확인한 **레슨 분류 사진**을 씁니다. */
function lessonHead(c){
  var ph = W.amPhoto ? W.amPhoto("cat-lesson") : null;
  /* ⚠️ 딱지 셋은 **지금 실제로 되는 것**만 적습니다 — 시안 셋째는
     「레슨 예약」인데 예약을 받는 표가 아직 없어, 지금 참인
     「상담 신청」으로 적습니다(절대 규칙 5). 예약이 서는 날 바꿉니다. */
  var B = [
    ["pin",   "지역별 검색",  "내 주변 프로 찾기"],
    ["user",  "프로 비교",    "경력 · 전문 분야 확인"],
    ["chat",  "상담 신청",    "조건을 적으면 이어 드립니다"]
  ];
  return '<section class="hero hero-sm' + (ph ? " hero-ph" : "") + '">' +
    /* ⚠️⚠️⚠️ 2026-11-11 — `sizes` 를 여기서 덮어씁니다. `cat-lesson` 의
       규격은 메인의 **작은 서비스 카드**(139~189px)를 기준으로 적혀
       있는데, 이 자리는 **화면 폭을 다 쓰는 히어로**입니다. 안 덮으면
       390px 폰이 450px 짜리를 받아 780px 자리에 깔아 **흐립니다**
       (재서 알았습니다 · 찌그러지지도 가로로 밀리지도 않아 어떤 검사도
       안 잡습니다). 같은 사진을 크기가 다른 두 자리에 쓰는 날 이 줄을
       다시 읽으세요. */
    (ph ? W.amPhotoImg("cat-lesson", { cls:"hero-bg", eager:true,
                                       sizes:"100vw" }) : "") +
    '<div class="wrap hero-in">' +
      '<p class="lsn-eyebrow">GOLF LESSON</p>' +
      '<h1>나에게 맞는 골프 프로를 찾아보세요</h1>' +
      '<p class="hero-sub">전국 골프 프로 · 레슨 가격 비교 · ' +
      '상담까지 한 번에</p>' +
      '<ul class="lsn-hb">' + B.map(function(x){
        return '<li>' + icon(x[0], 20) +
          '<b>' + esc(x[1]) + '</b><span>' + esc(x[2]) + '</span></li>';
      }).join("") + '</ul>' +
    '</div>' +
  '</section>' +
  '<section class="pghd pghd-ls"><div class="wrap">' + crumbs(c) + '</div></section>';
}

/* ── 찾는 칸 (§4) ────────────────────────────────────────────────
   ⚠️⚠️⚠️ **양식(form)입니다 — 단추가 아닙니다.** 자바스크립트가 꺼진
   분 · 크롤러에게도 그대로 돕니다(GET 으로 같은 주소에 다시 들어옵니다).
   브라우저가 켜져 있으면 `js/lesson.js` 가 가로채서 **새로고침 없이**
   목록만 갈아 끼웁니다.
   ⚠️⚠️ 고르개의 값은 전부 **키**입니다 — 이름(「서울」 · 「개인 레슨」)을
   보내면 받는 쪽이 못 찾아 **영원히 0건**이 됩니다(광고 분류 · 지역을
   손으로 적게 두었다가 겪은 그 자리).
   ⚠️ 가격대 · 정렬 목록은 `js/data/lesson.js` **한 곳**입니다. */
function lessonFind(c){
  var items = W.amCatItems(c);
  var regs  = (W.amRegionsOf ? W.amRegionsOf(c.key) : (W.AM_REGIONS || []));
  var P     = W.AM_LESSON_PRICE || [];
  function opts(L, kf, nf){
    return L.map(function(x){
      return '<option value="' + esc(kf(x)) + '">' + esc(nf(x)) + '</option>';
    }).join("");
  }
  return '<section class="sec sec-alt lsn-find"><div class="wrap">' +
    '<form id="lsnform" class="lsnf" method="get" action="/cat/lesson" ' +
      'role="search" aria-label="골프 프로 찾기">' +
      '<p class="lsnf-i"><label for="lsn-rg">' + icon("pin", 16) + '지역</label>' +
        '<select id="lsn-rg" name="rg"><option value="">전체 지역</option>' +
        opts(regs, function(r){ return r.key; }, function(r){ return r.name; }) +
        '</select></p>' +
      '<p class="lsnf-i"><label for="lsn-sub">' + icon("swing", 16) + '레슨 종류</label>' +
        '<select id="lsn-sub" name="sub"><option value="">전체 레슨</option>' +
        opts(items, function(i){ return i.key; }, function(i){ return i.name; }) +
        '</select></p>' +
      '<p class="lsnf-i"><label for="lsn-p">' + icon("coin", 16) + '가격대 (1회 기준)</label>' +
        '<select id="lsn-p" name="p"><option value="">전체</option>' +
        opts(P, function(x){ return x.key; }, function(x){ return x.name; }) +
        '</select></p>' +
      /* ⚠️⚠️⚠️ **레슨 목적 거르개는 0071 이 담는 칸을 내 준 뒤에 냈습니다**
         (2026-11-10 저녁). 그 전에는 `pages/category.js` 머리말에 "담는
         칸이 없어 안 만들었습니다" 로 적어 두었습니다 — 칸 없이 고르개를
         내면 골라도 걸러 주지 못하는 칸이고, 그건 눌러도 아무 일이 안 나는
         칸입니다(절대 규칙 5). 이제 `provider.lesson_goals` 가 있습니다.
         ⚠️ 목록은 `js/data/lesson.js` 의 `AM_LESSON_GOAL` **한 곳**입니다. */
      '<p class="lsnf-i"><label for="lsn-g">' + icon("flag", 16) + '레슨 목적</label>' +
        '<select id="lsn-g" name="g"><option value="">전체</option>' +
        opts(W.AM_LESSON_GOAL || [], function(x){ return x.key; },
             function(x){ return x.name; }) +
        '</select></p>' +
      '<p class="lsnf-q"><label class="sr" for="lsn-q">찾는 말</label>' +
        icon("search", 17) +
        '<input id="lsn-q" name="q" type="search" ' +
        'placeholder="프로 이름 · 연습장 · 전문 분야 · 지역"></p>' +
      '<p class="lsnf-go"><button class="btn btn-pri" type="submit">' +
        icon("search", 18) + '검색</button></p>' +
    '</form>' +
    /* ⚠️ 칩마다 **실제로 걸리는 열쇠**를 답니다. 이름을 못 찾은 칩은
       줄째 뺍니다(키를 그대로 찍지 않습니다 · 절대 규칙 2). */
    lessonTags() +
  '</div></section>';
}

function lessonTags(){
  var L = (W.AM_LESSON_TAGS || []).map(function(t){
    var nm = W.amLessonTagName ? W.amLessonTagName(t) : null;
    if(!nm) return "";
    var q = t.rg ? ("rg=" + encodeURIComponent(t.rg))
                 : ("sub=" + encodeURIComponent(t.sub));
    return '<li><a class="chip chip-go" href="/cat/lesson?' + q + '">#' +
      esc(nm) + '</a></li>';
  }).filter(Boolean);
  if(!L.length) return "";
  return '<p class="lsnf-t"><span>자주 찾는 조건</span></p>' +
    '<ul class="chips lsnf-tags">' + L.join("") + '</ul>';
}

/* ── 카테고리 카드 (§5) ───────────────────────────────────────────
   ⚠️⚠️⚠️ **이것이 곧 하위 칩입니다** — `.chips-sub` 를 두 번 내면
   `test-providers` 가 세는 수가 두 배가 되고, 안 내면 레슨 하위 일곱이
   **놓을 자리가 없어 조용히 사라집니다**(2026-11-08 에 칩을 둘로 가르며
   적어 둔 그 함정). 그래서 시안의 가로 카드를 **칩 자리에** 그립니다.
   ⚠️ 이름 · 한 줄은 `js/data/lesson.js` 한 곳에서 옵니다. */
function lessonCats(c){
  var L = W.amLessonCards ? W.amLessonCards() : [];
  if(!L.length) return "";
  return '<section class="sec lsn-catsec"><div class="wrap">' +
    '<ul class="chips chips-sub lsn-cats">' + L.map(function(x){
      return '<li><a class="lsn-cat" href="' +
        esc(W.amSubUrl(c.key, x.key)) + '">' +
        '<b>' + esc(x.name) + '</b>' +
        (x.lead ? '<span>' + esc(x.lead) + '</span>' : "") +
        icon("arrow", 15) + '</a></li>';
    }).join("") + '</ul>' +
  '</div></section>';
}

/* ── 프로 목록 + 우측 레일 (§6 · §10 · §13) ──────────────────────
   ⚠️⚠️⚠️ **0곳이면 지어낸 카드를 한 장도 안 냅니다** (§13 · 절대 규칙 1).
   시안의 프로 여덟 · 평점 · 후기 수 · 가격 · 인증 배지는 **전부 예시**
   입니다. 지금 등록된 프로는 0분이라 §13 의 안내가 나오는 것이 맞습니다.
   ⚠️⚠️ 목록은 **빌드가 찍고**(크롤러 · 자바스크립트 꺼진 분 몫) 거르개를
   누르면 `js/lesson.js` 가 **같은 함수**(`amLessonCard`)로 다시 그립니다 —
   두 벌로 적으면 거르개를 누르는 순간 카드가 조용히 달라지고 그려진
   화면만 보는 검사는 영원히 통과합니다. */
function lessonSec(c, list){
  var S = W.AM_PV_SORT || [];
  var grid = list.length
    ? W.amLessonGrid(list)
    : '<div class="none"><h3>현재 등록된 레슨 프로가 없습니다.</h3>' +
      '<p>골프 프로라면 지금 입점 신청해 주세요. 신청하신 자격과 경력을 ' +
      '운영자가 확인한 뒤 이 자리에 올려 드립니다.</p>' +
      '<div class="none-b"><a class="btn btn-pri" href="/join">' +
      icon("store", 20) + '프로 입점 신청</a></div>' +
      nowOpen(c) + '</div>';

  return '<section class="sec sec-alt lsn-sec"><div class="wrap lsn-w">' +
    '<div class="lsn-main">' +
      '<div class="sec-hd lsn-hd"><h2>레슨 프로</h2>' +
      '<p>골프올인원은 통신판매중개자이며 거래 당사자가 아닙니다. ' +
      '레슨 조건 · 가격은 프로가 직접 등록한 값입니다.</p></div>' +
      '<div class="lsn-bar">' +
        '<p class="lsn-cnt" id="lsncnt">' +
          (list.length ? esc(W.won(list.length)) + '분' : '0분') + '</p>' +
        '<p class="lsn-sort"><label class="sr" for="lsn-o">차례</label>' +
          '<select id="lsn-o" name="o" form="lsnform">' + S.map(function(x){
            return '<option value="' + esc(x.key) + '">' + esc(x.name) + '</option>';
          }).join("") + '</select></p>' +
      '</div>' +
      '<div id="lsnlist">' + grid + '</div>' +
      /* ⚠️ 값이 0건인 프로가 섞일 수 있습니다 — 가격대로 좁히면 그분들이
         빠진다는 것을 **그 자리에서** 말합니다(0건을 "없다" 로 읽지
         않게 · 티타임의 빈 `tee_at` 에서 겪은 그 자리). */
      '<p class="jnote">⚠️ 가격대로 좁히면 <b>레슨 가격을 아직 등록하지 ' +
      '않은 프로</b>는 빠집니다. 값을 모르는 분을 아무 가격대에나 넣으면 ' +
      '그건 저희가 지어낸 값입니다.</p>' +
      /* ⚠️⚠️⚠️ **「요청에 적는 것」을 여기 둡니다** — 레슨은 업체 덩이
         (`pvBlock`)를 안 쓰므로, 안 두면 그 구간이 통째로 사라지고
         `tools/test-match.js` 가 "여쭙는다고 적어 놓고 안 여쭙는" 자리로
         잡습니다(화면의 목록과 `/match` 양식이 **같은 줄**을 읽습니다). */
      asksBlock(c) +
    '</div>' +
    '<aside class="lsn-side" aria-label="레슨 안내">' +
      '<div class="lsn-box lsn-box-dark">' +
        '<p class="lsn-box-h">' + icon("user", 20) + '골프 프로로 입점하세요</p>' +
        '<p>내 프로필과 레슨 상품을 등록하고 더 많은 골퍼를 만나 보세요. ' +
        '자격과 경력은 운영자가 확인합니다.</p>' +
        '<a class="btn btn-gold" href="/join">프로 입점 신청' +
          icon("arrow", 15) + '</a>' +
      '</div>' +
      '<div class="lsn-box">' +
        '<p class="lsn-box-h">' + icon("cal", 20) + '원하는 레슨을 못 찾으셨나요?</p>' +
        '<p>지역 · 예산 · 레슨 목적을 남기시면 조건에 맞는 프로를 ' +
        '찾아 이어 드립니다. 업체에 넘길 때는 상호를 알려 드리고 ' +
        '다시 여쭙습니다.</p>' +
        '<a class="btn btn-line" href="/match?cat=lesson">맞춤 레슨 요청하기' +
          icon("arrow", 15) + '</a>' +
      '</div>' +
      '<div class="lsn-box">' +
        '<p class="lsn-box-h">' + icon("info", 20) + '이용 가이드</p>' +
        '<ul class="lsn-gd">' +
          '<li><a href="/guide">프로 찾는 방법과 상담 절차' +
            icon("arrow", 14) + '</a></li>' +
          '<li><a href="/join">프로 입점 안내' + icon("arrow", 14) + '</a></li>' +
          '<li><a href="/help">고객센터 · 자주 묻는 것' +
            icon("arrow", 14) + '</a></li>' +
        '</ul>' +
      '</div>' +
    '</aside>' +
  '</div></section>';
}

function crumbs(c){
  return '<nav class="crumb" aria-label="현재 위치">' +
    '<a href="/">홈</a>' + icon("arrow", 14) +
    '<a href="/categories">카테고리 전체보기</a>' + icon("arrow", 14) +
    '<span aria-current="page">' + esc(c.name) + '</span></nav>';
}

/* ⚠️ 지시서 §6 — "카테고리 상세 화면의 반복적인 '다른 분류 보기'
   영역은 간소화한다". 전에는 **다른 아홉 중 다섯**을 아무 기준 없이
   잘라 늘어놓았습니다 (분류마다 거의 같은 목록이 나왔습니다).
   지금은 **같은 묶음 안의 형제**만 냅니다 — 레슨 옆에는 연습장 · 피팅이
   오고, 여행 옆에는 부킹 · 조인이 옵니다. 묶음 전체로 가는 길도 같이
   둡니다 (열 분류를 다 보시려면 그 길입니다). */
function related(c){
  var zone = (W.AM_ZONES || []).filter(function(z){
    return (z.cats || []).indexOf(c.key) >= 0;
  })[0];
  if(!zone) return "";
  var sibs = (W.amZoneCats ? W.amZoneCats(zone) : [])
    .filter(function(x){ return x.key !== c.key; });
  if(!sibs.length) return "";
  return '<section class="sec"><div class="wrap">' +
    '<div class="sec-hd"><h2>' + esc(zone.name) + ' 안의 다른 분류</h2></div>' +
    '<ul class="chips">' + sibs.map(function(x){
      return '<li><a class="chip chip-go" href="' + esc(W.amCatUrl(x)) + '">' +
        icon(x.icon, 18) + esc(x.name) + '</a></li>';
    }).join("") +
    '<li><a class="chip chip-go" href="/categories#' + esc(zone.key) + '">' +
      icon("arrow", 18) + '열 분류 전체보기</a></li>' +
    '</ul></div></section>';
}

/* ── 이 분류로 요청하면 **무엇을 여쭙는가** (지시서 §6) ──────────────
   ⚠️⚠️ 분류마다 다릅니다. 목록은 js/data/catalog.js 의 AM_ASK **한 곳**
   에 있고, 매칭 요청 양식도 같은 줄을 읽습니다 — 두 곳에 적으면 화면은
   "여쭙는다" 고 하는데 양식에는 그 칸이 없는 꼴이 됩니다.
   ⚠️ 받을 자리가 없는 분류(조인 · 인력 · 커뮤니티)는 AM_ASK 가 비어
   있고, 그러면 이 구간이 **줄째 빠집니다** (절대 규칙 2). */
/* ⚠️⚠️⚠️ **2026-11-08 — 이것이 큰 제목 하나를 통째로 먹고 있었습니다.**
   업체가 0곳이라 매칭 요청을 넣어도 **배정할 곳이 없는데**, 화면에서
   가장 큰 자리 하나가 그 길이었습니다. 지금은 **업체 구간 안의 h3**
   입니다 — 그 길이 업체를 기다리는 길이라는 것이 자리로 보입니다.
   ⚠️ 길은 안 지웠습니다. 자리만 바꿨습니다. */
function asksBlock(c){
  var a = W.amAskOf ? W.amAskOf(c) : null;
  if(!a) return "";
  return '<div class="asks-w">' +
    '<h3 class="asks-h">' + esc(c.name) + ' 요청에 적는 것</h3>' +
    '<p>이 분류로 매칭 요청을 남기시면 아래를 여쭙습니다. ' +
    '전부 한 양식에서 한 번에 적으십니다. ' +
    '<b>*</b> 는 꼭 적어 주셔야 하는 것입니다.</p>' +
    /* ⚠️⚠️ **별표는 AM_ASK 의 셋째 칸에서 옵니다** — 양식이 required
       를 거는 자리와 **같은 줄**을 읽습니다. 여기 손으로 적으면
       "필수라고 적어 놓고 안 받는" 꼴이 됩니다 (`test-match` 가
       맞춰 봅니다). */
    '<ul class="asks">' + a.map(function(x){
      return '<li><span class="asks-n">' + icon("check", 16) + '</span>' +
        esc(x[0]) + (x[2] ? ' <b>*</b>' : '') + '</li>';
    }).join("") + '</ul>' +
    '<p class="asks-go"><a class="btn btn-pt" href="/match?cat=' + esc(c.key) + '">' +
      icon("match", 20) + esc(c.name) + ' 매칭 요청하기</a></p>' +
  '</div>';
}

/* ── 하위 칩 — ⚠️⚠️ **제가 거르는 목록 바로 위에** 놓습니다 ───────────
   ⚠️⚠️⚠️ 2026-11-08 까지 이 칩이 「…에서 다루는 것」이라는 **제 구간**에
   담겨 열 장 전부 **맨 위**에 있었습니다. 그런데 그 칩이 거르는 목록은
   저 아래였습니다 — 누르고 나서야 어디로 갔는지 아는 꼴입니다.
   ⚠️ 그리고 업체가 0곳이라, 업체찾기로 가는 칩은 **맨 위에서 전부 0건으로**
   보내고 있었습니다. 지금은 업체 구간 안에 있습니다.
   ⚠️ 주소도 · 눌리는지도 `amSubUrl()` · `amSubGoes()` **한 곳**입니다. */
function chips(c, items, note){
  if(!items.length) return "";
  return (note ? '<p class="chips-n">' + esc(note) + '</p>' : '') +
    /* ⚠️ `chips-sub` 는 **잴 자리를 가리키는 이름**입니다 — 관련
       분류 줄도 `.chips` 를 쓰므로, 이름이 없으면 검사가 그 링크까지
       하위 칩으로 셉니다. CSS 는 아래 여백 한 줄뿐입니다. */
    '<ul class="chips chips-sub">' + items.map(function(it){
      return W.amSubGoes(c, it.key)
        ? '<li><a class="chip chip-go" href="' +
          esc(W.amSubUrl(c.key, it.key)) + '">' + esc(it.name) + '</a></li>'
        : '<li><span class="chip">' + esc(it.name) + '</span></li>';
    }).join("") + '</ul>';
}

/* ── 업체 쪽 한 덩이 ──────────────────────────────────────────────
   ⚠️⚠️ **업체찾기로 가는 칩 · 업체 카드(또는 0곳 안내) · 매칭 요청**을
   한 덩이로 묶습니다. 전에는 셋이 화면 세 곳에 흩어져 있어서, 업체가
   0곳인 지금 손님이 **무엇이 업체를 기다리는 길인지** 알 수 없었습니다.
   ⚠️ 0건이어도 막다른 길로 두지 않습니다 — `nowOpen()` 이 지금 실제로
   되는 것으로 보냅니다 (절대 규칙 2). */
function nowOpen(cat){
  var here = W.amCatUrl(cat);
  /* ⚠️ 보고 계신 분류를 넘깁니다 — 구합니다 글을 **이 분류에 맞는
     자리**로 보내려는 것입니다 (중고채를 찾는 분을 레슨으로 보내지
     않게 · 지시서 §12). */
  var L = (W.amOpenNow ? W.amOpenNow(cat.key) : []).filter(function(x){
    return x.href !== here;
  });
  if(!L.length) return "";
  return '<p class="none-or">업체를 기다리지 않고 지금 하실 수 있는 것</p>' +
    '<div class="none-b">' + L.map(function(x){
      return '<a class="btn btn-line" href="' + esc(x.href) + '">' +
        icon(x.icon, 18) + esc(x.label) + '</a>';
    }).join("") + '</div>';
}
/* ── 연습장 전용 머리 · 찾는 칸 · 거르개 (확정 시안 ⑤) ──────────────
   ⚠️⚠️⚠️ **지도를 안 그립니다.** 시안 ⑤ 는 오른쪽 40% 가 지도인데,
   `course` 의 좌표는 0066 이 **확인 전에는 비워 둡니다**(공공 인허가
   자료에 EPSG:5174 · 2097 이 섞여 있어, 틀린 좌표로 찍으면 손님을
   엉뚱한 곳으로 보냅니다). `provider` 에는 좌표 칸이 아예 없습니다.
   없는 좌표로 지도를 그리면 **지어낸 위치**이고(절대 규칙 1), 빈 지도
   액자를 두면 **눌러도 아무 일이 안 나는 칸**입니다(절대 규칙 5).
   그래서 목록이 폭을 다 씁니다 — 좌표가 들어오는 날 오른쪽을 엽니다.
   ⚠️⚠️ 거르개는 **양식(form)** 입니다 — 자바스크립트가 꺼져도 GET 으로
   그대로 돕니다. 켜져 있으면 `js/range.js` 가 가로채 주소만 바꿉니다.
   ⚠️ 고르개의 값은 전부 `js/data/*.js` **한 곳**에서 읽습니다 — 화면에
   박으면 시설 종류가 느는 날 두 곳이 어긋납니다. */
function rangeHead(c){
  var opt = function(L, cur, all){
    return '<option value="">' + esc(all) + '</option>' +
      L.map(function(x){
        return '<option value="' + esc(x.key) + '">' + esc(x.name) + '</option>';
      }).join("");
  };
  var REG = W.AM_REGIONS || [];
  var PRC = W.AM_RANGE_PRICE || [];
  return '<section class="sec rng-hd"><div class="wrap">' +
    crumbs(c) +
    '<h1 class="rng-t">' + icon("flag", 30) + esc(c.name) + '</h1>' +
    '<p class="rng-sub">내 주변 연습 공간을 한눈에 비교하세요</p>' +
    '<form class="rngf" id="rngform" method="get" action="' +
      esc(W.amCatUrl(c)) + '">' +
      '<div class="rngf-q">' +
        '<label for="rng-q" class="sr-only">지역이나 연습장 이름으로 찾기</label>' +
        '<span class="rngf-i" aria-hidden="true">' + icon("search", 18) + '</span>' +
        '<input id="rng-q" name="q" type="search" maxlength="40" ' +
          'placeholder="지역, 연습장 이름으로 검색">' +
        '<button type="submit" class="btn btn-pri">검색</button>' +
      '</div>' +
      '<div class="rngf-row">' +
        '<label class="sr-only" for="rng-rg">지역</label>' +
        '<select id="rng-rg" name="rg">' + opt(REG, "", "지역 전체") + '</select>' +
        '<label class="sr-only" for="rng-io">실내 · 실외</label>' +
        '<select id="rng-io" name="io">' +
          '<option value="">실내 · 실외 전체</option>' +
          '<option value="indoor">실내</option>' +
          '<option value="outdoor">실외</option>' +
        '</select>' +
        '<label class="sr-only" for="rng-sc">스크린</label>' +
        '<select id="rng-sc" name="sc">' +
          '<option value="">스크린 전체</option>' +
          '<option value="1">스크린 있는 곳</option>' +
        '</select>' +
        '<label class="sr-only" for="rng-pk">주차</label>' +
        '<select id="rng-pk" name="pk">' +
          '<option value="">주차 전체</option>' +
          '<option value="1">주차 되는 곳</option>' +
        '</select>' +
        '<label class="sr-only" for="rng-p">가격</label>' +
        '<select id="rng-p" name="p">' + opt(PRC, "", "가격 전체") + '</select>' +
        /* ⚠️ 「초기화」는 **링크**입니다 — 자바스크립트가 꺼져도 돕니다 */
        '<a class="rngf-x" href="' + esc(W.amCatUrl(c)) + '">' +
          icon("arrow", 15) + '초기화</a>' +
      '</div>' +
    '</form>' +
  '</div></section>';
}

/* ⚠️⚠️ 목록은 빌드가 **한 번** 찍고, 거르개를 누르면 `js/range.js` 가
   **같은 함수**(`amRangeGrid`)로 다시 그립니다 — 두 벌로 적으면 거르개를
   누르는 순간 카드가 조용히 달라집니다. */
function rangeSec(c, list){
  return '<section class="sec sec-alt rng-sec"><div class="wrap">' +
    /* ⚠️ 시안에 구간 제목이 없지만 **제목 단계를 건너뛰면 안 됩니다** —
       0곳 안내가 h3 라 h1 바로 뒤에 오면 화면 읽는 기계가 한 단계를
       잃습니다. 보이지 않는 h2 로 그 자리를 메웁니다(check-a11y). */
    '<h2 class="sr-only">연습장 목록</h2>' +
    '<p class="rng-cnt">연습장 <b id="rngcnt">' + W.won(list.length) + '곳</b>' +
      '<span class="rng-note">골프올인원은 통신판매중개자이며 거래 ' +
      '당사자가 아닙니다.</span></p>' +
    '<div id="rnglist">' +
      (list.length ? W.amRangeGrid(list) : rangeNone()) +
    '</div>' +
  '</div></section>';
}
/* ⚠️⚠️ 0곳은 고장이 아닙니다 — 시안 ⑤ 의 「등록 전 화면」 문구를 그대로
   쓰고 **막다른 길로 두지 않습니다**(절대 규칙 2). */
function rangeNone(){
  return '<div class="none rng-none">' +
    '<p class="rng-none-i">' + icon("flag", 34) + '</p>' +
    '<h3>등록된 연습장이 없습니다</h3>' +
    '<p>아직 등록된 골프 연습장이 없습니다. ' +
    '내 연습장을 등록하고 골퍼들에게 소개해 보세요.</p>' +
    '<div class="none-b">' +
      '<a class="btn btn-pri" href="/join">' + icon("store", 18) + '시설 등록</a>' +
      '<a class="btn btn-line" href="/cat/range">다른 지역 보기</a>' +
    '</div>' +
  '</div>';
}

/* ════════════════════════════════════════════════════════════════════
   피팅 · 수리 (확정 시안 ⑦)
   ⚠️⚠️⚠️ **서비스 종류 탭이 곧 하위 칩입니다** — 두 번 내면
     `test-providers` 가 세는 수가 두 배가 되고, 안 내면 피팅 하위 여섯이
     **놓을 자리가 없어 조용히 사라집니다**(2026-11-08 에 칩을 둘로 가르며
     적어 둔 그 함정 · 레슨의 카테고리 카드와 같은 자리).
   ⚠️ 그래서 `pvBlock` 은 `noChips` 로 부릅니다.
   ⚠️⚠️ 「전체」는 `<ul class="chips-sub">` **바깥**입니다 — 그 안에 넣으면
     칩 수가 하위 수보다 하나 많아져 멀쩡한 화면이 실패로 잡힙니다.
   ════════════════════════════════════════════════════════════════════ */
function fitTabs(c, items){
  var cur = '<a class="fit-tab-a on" data-sub="" href="' + esc(W.amCatUrl(c)) +
    '" aria-current="true">전체</a>';
  return '<nav class="fit-tab" aria-label="서비스 종류">' + cur +
    '<ul class="chips chips-sub">' + items.map(function(i){
      return '<li><a class="fit-tab-a" data-sub="' + esc(i.key) + '" href="' +
        esc(W.amSubUrl(c, i.key)) + '">' + esc(i.name) + '</a></li>';
    }).join("") + '</ul>' +
  '</nav>';
}

function fitHead(c){
  var opt = function(L, all){
    return '<option value="">' + esc(all) + '</option>' +
      L.map(function(x){
        return '<option value="' + esc(x.key) + '">' + esc(x.name) + '</option>';
      }).join("");
  };
  var REG = W.AM_REGIONS || [];
  var WAY = W.AM_FIT_WAY || [];
  var PRC = W.AM_FIT_PRICE || [];
  var SRT = W.AM_PV_SORT || [];
  return '<section class="sec fit-hd"><div class="wrap">' +
    crumbs(c) +
    '<div class="fit-hd-r">' +
      '<div>' +
        '<h1 class="fit-t">' + icon("clubs", 30) + esc(c.name) + '</h1>' +
        '<p class="fit-sub">클럽의 고민, 전문 업체와 상담하세요</p>' +
      '</div>' +
      /* ⚠️⚠️⚠️ 시안의 이름은 「클럽 **사진**으로 상담 요청」인데,
         `INTAKE_BUCKET` 이 없으면 `/match` 에 **사진 칸이 아예 안
         그려집니다**(js/photo.js). 그때 그 이름을 내면 없는 것을 있다고
         말하는 꼴입니다(절대 규칙 5). 빌드는 켜졌는지 알 수 없으므로
         (서버만 압니다) 여기서는 「상담 요청」으로 찍고, `js/fitting.js`
         가 서버에 물어본 뒤 켜져 있을 때만 시안의 이름으로 올립니다. */
      '<a class="btn btn-deep fit-cta" id="fit-cta" href="/match?cat=' +
        esc(c.key) + '">' + icon("camera", 19) +
        '<span class="fit-cta-t">클럽 상태 적고 상담 요청</span>' +
        icon("arrow", 16) + '</a>' +
    '</div>' +
  '</div></section>';
}

/* ⚠️⚠️ 목록은 빌드가 **한 번** 찍고, 거르개를 누르면 `js/fitting.js` 가
   **같은 함수**(`amFitGrid`)로 다시 그립니다 — 두 벌로 적으면 거르개를
   누르는 순간 카드가 조용히 달라집니다.
   ⚠️ 왼쪽 레일(거르개)과 오른쪽(찾는 칸 + 목록)이 한 양식입니다 —
   자바스크립트가 꺼져 있어도 **「검색」 한 번으로 GET** 이 돕니다. */
function fitSec(c, list, items){
  var opt = function(L, all){
    return '<option value="">' + esc(all) + '</option>' +
      L.map(function(x){
        return '<option value="' + esc(x.key) + '">' + esc(x.name) + '</option>';
      }).join("");
  };
  var REG = W.AM_REGIONS || [];
  var WAY = W.AM_FIT_WAY || [];
  var PRC = W.AM_FIT_PRICE || [];
  var SRT = W.AM_PV_SORT || [];
  return '<section class="sec sec-alt fit-sec"><div class="wrap">' +
    '<h2 class="sr-only">피팅 · 수리 업체 목록</h2>' +
    fitTabs(c, items) +
    '<form class="fitw" id="fitform" method="get" action="' +
      esc(W.amCatUrl(c)) + '">' +
      '<aside class="fit-rail" aria-label="상세 조건">' +
        '<p class="fit-rail-h">' + icon("pin", 15) + '지역</p>' +
        '<label class="sr-only" for="fit-rg">지역</label>' +
        '<select id="fit-rg" name="rg">' + opt(REG, "지역 전체") + '</select>' +
        '<p class="fit-rail-h">' + icon("store", 15) + '서비스 방식</p>' +
        '<label class="sr-only" for="fit-w">서비스 방식</label>' +
        '<select id="fit-w" name="w">' +
          '<option value="">방식 전체</option>' +
          WAY.map(function(x){
            return '<option value="' + esc(x.key) + '">' + esc(x.name) +
              (x.lead ? " (" + esc(x.lead) + ")" : "") + '</option>';
          }).join("") +
        '</select>' +
        '<p class="fit-rail-h">' + icon("coin", 15) + '가격</p>' +
        '<label class="sr-only" for="fit-p">가격</label>' +
        '<select id="fit-p" name="p">' + opt(PRC, "가격 전체") + '</select>' +
        /* ⚠️ 「조건 모두 지우기」는 **링크**입니다 — 자바스크립트가
           꺼져도 돕니다. 탭(`sub`)까지 같이 지웁니다. */
        '<a class="fit-rail-x" href="' + esc(W.amCatUrl(c)) + '">' +
          icon("arrow", 15) + '조건 모두 지우기</a>' +
      '</aside>' +
      '<div class="fit-main">' +
        '<div class="fitf-q">' +
          '<label for="fit-q" class="sr-only">업체명이나 서비스로 찾기</label>' +
          '<span class="fitf-i" aria-hidden="true">' + icon("search", 18) + '</span>' +
          '<input id="fit-q" name="q" type="search" maxlength="40" ' +
            'placeholder="업체명 또는 서비스(예: 그립 교체)로 검색">' +
          '<button type="submit" class="btn btn-pri">검색</button>' +
        '</div>' +
        '<div class="fit-cnt">' +
          '<p>피팅 · 수리 업체 <b id="fitcnt">' + W.won(list.length) + '곳</b>' +
            '<span class="fit-note">골프올인원은 통신판매중개자이며 거래 ' +
            '당사자가 아닙니다.</span></p>' +
          /* ⚠️⚠️ 시안의 「추천순」은 **안 냅니다** — 무엇이 추천인지
             세어 본 적이 없습니다(절대 규칙 1). 셀 수 있는 넷만 냅니다. */
          '<label class="sr-only" for="fit-o">차례</label>' +
          '<select id="fit-o" name="o">' + opt(SRT, "가나다순") + '</select>' +
        '</div>' +
        '<div id="fitlist">' +
          (list.length ? W.amFitGrid(list) : fitNone()) +
        '</div>' +
      '</div>' +
    '</form>' +
  '</div></section>';
}
/* ⚠️⚠️ 0곳은 고장이 아닙니다 — 시안 ⑦ 의 「등록 전 화면」 문구를 그대로
   쓰고 **막다른 길로 두지 않습니다**(절대 규칙 2). */
function fitNone(){
  return '<div class="none fit-none">' +
    '<p class="fit-none-i">' + icon("clubs", 34) + '</p>' +
    '<h3>등록된 피팅 · 수리 업체가 없습니다</h3>' +
    '<p>내 업체를 등록하거나, 원하는 상담 조건을 남겨보세요.</p>' +
    '<div class="none-b">' +
      '<a class="btn btn-pri" href="/join">' + icon("store", 18) + '업체 등록 신청</a>' +
      '<a class="btn btn-line" href="/match?cat=fitting">상담 조건 남기기</a>' +
    '</div>' +
  '</div>';
}

/* ════════════════════════════════════════════════════════════════════
   골프 여행 (확정 시안 ⑧ · 0073)
   ⚠️⚠️⚠️ **빌드는 상품을 한 장도 안 찍습니다** — 여행 상품은 `trip`
     표에서 오고 그 표는 **빌드가 안 읽습니다**(업체 · 후기와 달리
     `tools/pull-*` 이 없습니다). 그래서 이 자리는 **그릇만** 두고
     `js/trip.js` 가 채웁니다.
   ⚠️⚠️ 그러면 자바스크립트가 꺼진 분 · 크롤러에게는 빈 자리가 되므로,
     그릇 안에 **무엇이 여기 오는지**를 적어 둡니다(빈 `<div>` 를 두고
     「판매글 등록」 단추가 아무 데도 안 데려가던 그 자리 · 2026-11-10).
   ════════════════════════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════════════════════════
   골프 인력 · 비즈니스 (확정 시안 ⑨)
   ⚠️ 두 단추는 **같은 자리**(`#jobbox` · 글 올리는 양식)로 갑니다 —
     「제휴 제안」은 `?k=biz` 로 갈래를 미리 골라 둡니다.
   ⚠️⚠️ 그 자리는 **빌드가 글 한 줄을 미리 찍어 둡니다** — 설정이 없어
     화면이 못 그리는 날 단추가 **아무 데도 안 데려가지 않게**(`#lsbox`
     에서 겪은 그 자리 · 절대 규칙 5).
   ════════════════════════════════════════════════════════════════════ */
function careerHead(c){
  return '<section class="sec jb-hd"><div class="wrap">' +
    crumbs(c) +
    '<div class="jb-hd-r">' +
      '<div>' +
        '<h1 class="jb-t">' + icon("case", 30) + esc(c.name) + '</h1>' +
        '<p class="jb-sub">골프 업계의 일자리와 파트너를 연결합니다</p>' +
      '</div>' +
      '<p class="jb-cta">' +
        '<a class="btn btn-deep" href="#jobbox">' + icon("plus", 18) +
          '공고 등록</a>' +
        '<a class="btn btn-goldline" href="/cat/career?k=biz#jobbox">' +
          icon("people", 18) + '제휴 제안</a>' +
      '</p>' +
    '</div>' +
  '</div></section>';
}

function tripHead(c){
  return '<section class="sec tp-hd"><div class="wrap">' +
    crumbs(c) +
    '<div class="tp-hd-r">' +
      '<div>' +
        '<h1 class="tp-t">' + icon("plane", 30) + esc(c.name) + '</h1>' +
        '<p class="tp-sub">일정과 포함 조건까지 비교하는 골프여행</p>' +
      '</div>' +
      /* ⚠️ 「맞춤 여행 견적」은 **이미 도는 길**(매칭 요청)로 갑니다 —
         새 양식을 만들면 받는 자리가 둘이 되고 한쪽만 고치는 날
         어긋납니다. */
      '<a class="btn btn-goldline tp-cta" href="/match?cat=' + esc(c.key) + '">' +
        icon("chat", 19) + '맞춤 여행 견적</a>' +
    '</div>' +
  '</div></section>';
}

/* ⚠️ `#tripbox` 는 **빌드가 찍는 빈 그릇**입니다 — 머리말이나 다른
   화면에서 `#tripbox` 로 보내는 날, 못 채우는 갈래마다 거기에 글을
   남기는지 보세요(`js/trip.js` 의 shutBox · failBox). */
function tripSec(){
  return '<section class="sec sec-alt tp-sec"><div class="wrap">' +
    '<h2 class="sr-only">여행 상품 찾기</h2>' +
    '<div id="tripbox">' +
      '<noscript><p class="jnote">골프 여행 상품은 브라우저에서 ' +
        '불러옵니다. 자바스크립트를 켜시면 이 자리에 상품 목록과 ' +
        '찾는 칸이 나옵니다.</p></noscript>' +
    '</div>' +
  '</div></section>';
}

function pvBlock(c, k, list, pvItems, opt){
  /* 업체를 받지 않는 분류(조인 · 커뮤니티)는 이 덩이가 **통째로** 빠집니다 */
  if(!c.provider) return "";
  var ask = asksBlock(c);
  /* ⚠️ 할 말이 하나도 없으면 **구간째 뺍니다** — 인력(`career`)은 업체를
     받지만 하위 칩이 전부 제 글 목록으로 가고 AM_ASK 도 비어 있어,
     업체가 0곳인 동안은 "아직 등록된 업체가 없습니다" 한 줄만 남습니다.
     그 한 줄은 손님이 할 수 있는 일이 없는 자리입니다 (절대 규칙 2). */
  if(!list.length && !pvItems.length && !ask) return "";
  /* ⚠️⚠️ `quiet` — 목록과 0곳 안내를 **다른 구간이 이미 냈을 때**
     씁니다(연습장). 하위 칩과 매칭 요청은 그대로 남깁니다 — 그
     둘은 **업체찾기로 가는 길**이라 지우면 갈 자리가 없어집니다. */
  if(opt && opt.quiet){
    /* ⚠️⚠️ `noChips` — 하위 칩도 **다른 구간이 이미 냈을 때** 씁니다
       (피팅의 서비스 종류 탭). 두 번 내면 같은 여섯이 한 화면에
       두 줄 서고, 칩을 세는 검사가 두 배를 셎니다. */
    var cz = (opt.noChips ? "" : chips(c, pvItems, k.pvOn || k.subs));
    if(!cz && !ask) return "";
    return '<section class="sec sec-alt"><div class="wrap">' +
      cz + ask +
    '</div></section>';
  }
  /* ⚠️ 칩 위의 길잡이 한 줄은 **업체가 있을 때와 0곳일 때가 다릅니다** */
  var note = k.pvNote !== undefined ? k.pvNote
           : (list.length ? (k.pvOn || k.subs) : k.subs);
  if(list.length)
    return '<section class="sec sec-alt"><div class="wrap">' +
      '<div class="sec-hd"><h2>' + esc(c.name) + ' 업체 ' + W.won(list.length) + '곳</h2>' +
      '<p>골프올인원은 통신판매중개자이며 거래 당사자가 아닙니다.</p></div>' +
      chips(c, pvItems, note) +
      card.grid(list) + ask +
    '</div></section>';
  return '<section class="sec sec-alt"><div class="wrap">' +
    '<div class="sec-hd"><h2>' + esc(k.pvH || k.zeroT) + '</h2>' +
    '<p>' + esc(k.pvH ? k.pvD : k.zeroD) + '</p></div>' +
    chips(c, pvItems, note) +
    '<div class="none">' +
      (k.pvH ? '<h3>' + esc(k.zeroT) + '</h3><p>' + esc(k.zeroD) + '</p>' : '') +
      /* ⚠️⚠️ 매칭 요청 단추가 **한 화면에 둘**이 되지 않게 — 아래
         `asksBlock` 이 무엇을 여쭙는지까지 말해 주므로 그쪽을 남깁니다. */
      (k.cta && !ask
        ? '<a class="btn btn-pri" href="' + esc(k.cta[0]) + '">' +
          icon(k.cta[2], 20) + esc(k.cta[1]) + '</a>'
        : '') +
      nowOpen(c) +
    '</div>' + ask +
  '</div></section>';
}

exports.build = function(c){
  var k = KIND[c.kind] || KIND.provider;
  var items = W.amCatItems(c);

  /* ⚠️ 중고장터만 **머리가 다릅니다** — 시안이 골프장 배경 히어로와
     퀵액션 줄을 요구합니다(개편 지시서 §2-2 · §2-3). 다른 아홉 장은
     그대로입니다 (한 장 때문에 열 장을 바꾸지 않습니다). */
  var head = (c.key === "used") ? usedHead(c)
    /* ⚠️ 레슨도 **머리가 다릅니다** (2026-11-10 · 레슨 지시서 §3) */
    : (c.key === "lesson") ? lessonHead(c)
    /* ⚠️ 연습장도 **머리가 다릅니다** (확정 시안 ⑤) — 깃발 제목 ·
       찾는 칸 · 고르개 다섯이 한 덩이입니다 */
    : (c.key === "range") ? rangeHead(c)
    /* ⚠️ 피팅 · 수리도 **머리가 다릅니다** (확정 시안 ⑦) — 제목 옆에
       「클럽 상태 적고 상담 요청」 단추가 붙습니다 */
    : (c.key === "fitting") ? fitHead(c)
    /* ⚠️ 여행도 **머리가 다릅니다** (확정 시안 ⑧) */
    : (c.key === "travel") ? tripHead(c)
    /* ⚠️ 인력 · 비즈니스도 **머리가 다릅니다** (확정 시안 ⑨) */
    : (c.key === "career") ? careerHead(c)
    : '<section class="pghd"><div class="wrap">' +
    crumbs(c) +
    '<h1>' + esc(c.name) + '</h1>' +
    '<p class="pghd-l">' + esc(c.lead) + ' — ' + esc(k.what) + '</p>' +
  '</div></section>';

  /* ⚠️⚠️⚠️ **하위 예순둘까지 가는 길** (지시서 §4). 전에는 여기가
     **글**이었습니다 — "누르는 것처럼 보이게 만들면 눌러도 아무 일이
     안 나는 칸이 된다" 는 까닭이었고, 그때는 하위로 좁히는 자리가
     실제로 없었습니다. 지금은 업체찾기가 `sub` 로 좁힙니다
     (`js/search.js`), 그래서 **누르면 실제로 좁혀집니다.**
     ⚠️ 주소는 `amSubUrl()` **한 함수**에서만 짓습니다.
     ⚠️⚠️ **업체가 입점하는 하위만** 링크로 냅니다 — 조인 · 커뮤니티의
     하위를 업체찾기로 보내면 그 화면은 영원히 0건이고, 그건 눌러도
     아무 일이 안 나는 칸과 같습니다. 그 둘은 글로 둡니다.
     ⚠️ 업체가 0곳이어도 막다른 길이 아닙니다 — 업체찾기의 0건 자리가
     "조건에 맞는 업체가 없습니다" 와 **매칭 요청 단추**를 같이 냅니다. */
  /* 광고 자리 — ⚠️ 알맹이는 `js/adslot.js` 가 그립니다 (광고는 날짜로
     켜지고 꺼져 빌드가 못 찍습니다). 0건이면 hidden 으로 남고 감싼 구간은
     CSS 의 `:has()` 가 줄째 가립니다.
     ⚠️⚠️ **자리 열쇠(`cat_top`)와 분류 키를 같이 적습니다** — 0026 의
     check 가 분류 광고에 `cat_key` 를 요구하고, 손님 화면은 **그 키가
     같은** 광고만 냅니다 (이름을 적으면 영원히 안 걸립니다). */
  var adTop = '<section class="sec sec-ad"><div class="wrap">' +
    '<div class="adsl-w" data-adslot="cat_top" data-adslot-key="' +
      esc(c.key) + '" hidden></div></div></section>';

  /* ── 하위 칩을 **둘로 가릅니다** ──────────────────────────────────
     ⚠️⚠️⚠️ 2026-11-08 — 전에는 「…에서 다루는 것」이라는 제 구간에 아홉 ·
     열둘을 통째로 담아 **열 장 전부 맨 위**에 놓았습니다. 그런데 그 칩이
     거르는 목록은 화면 저 아래였고, 업체가 0곳이라 업체찾기로 가는 칩은
     **맨 위에서 전부 0건으로** 보내고 있었습니다.
     ⚠️ 가르는 잣대는 **그 칩이 어디로 가느냐** 하나입니다(`amSubUrl()`) —
     `/search` 로 가면 업체 쪽, 아니면 이 화면의 제 목록 쪽입니다. 화면이
     분류 이름으로 따로 판단하면 갈래가 늘어나는 날 두 곳이 어긋납니다. */
  var pvItems = W.amCatItemsForProvider(c).filter(function(it){
    return W.amSubUrl(c.key, it.key).indexOf("/search") === 0;
  });
  var pvKeys  = pvItems.map(function(it){ return it.key; });
  var ownItems = items.filter(function(it){ return pvKeys.indexOf(it.key) < 0; });
  var ownChips = chips(c, ownItems, k.subs);

  /* ⚠️⚠️ **업체가 있을 때와 없을 때를 둘 다 그립니다.** 앞 서비스에서
     "0곳" 안내만 만들어 두고 **있을 때 그리는 자리를 안 만든** 적이
     있습니다 — 승인해도 손님에게 보일 곳이 없었습니다.
     tools/test-providers.js 가 **둘 다** 눌러 봅니다. */
  /* ⚠️⚠️⚠️ **중고 직거래도 막다른 길이 아닙니다** (0056). 2026-11-06
     까지 이 화면은 "회원끼리 직접 사고파는 자리입니다 · 첫 매물이
     올라오면 여기에 바로 보입니다" 라고 적어 놓고 **매물을 올리는 표도 ·
     문도 · 화면도** 없었습니다 — 영원히 안 오는 것을 기다리라고 적은
     것입니다. 그날 글을 사실대로 고쳤고, 이제 기능이 섰습니다.
     ⚠️ 설명은 빌드가 찍고(크롤러 · 자바스크립트 꺼진 분 몫) 목록은
     브라우저가 그립니다 — 매물은 아무 때나 올라오고 내려갑니다.
     ⚠️⚠️ 거르개도 **목록 앞에 브라우저가** 그립니다 (빌드가 찍어 두면
     자바스크립트가 꺼진 분에게 눌러도 아무 일이 안 나는 칸이 됩니다). */
  var lsSec = (c.key === "used")
    ? '<section class="sec sec-alt"><div class="wrap">' +
      '<div class="sec-hd"><h2>올라온 매물</h2>' +
      '<p>회원이 직접 올리는 자리입니다. 물건 종류 · 지역 · 값 · 상태를 ' +
      '적어 올리시면 다른 회원이 사겠다고 문의합니다. ' +
      /* ⚠️⚠️ 지어낸 약속을 하지 않습니다 — 돈이 우리를 지나가지 않고
         물건을 우리가 보지 않습니다 (전자상거래법 제20조) */
      '골프올인원은 거래 당사자가 아니며, 결제 · 배송 · 안전거래를 ' +
      '대신해 드리지 않습니다.</p></div>' +
      ownChips +
      '<div id="lslist">' +
        '<div class="none"><h3>매물을 보시려면 잠시만 기다려 주세요.</h3>' +
        '<p>올라온 매물을 불러옵니다. 보이지 않으면 아직 올라온 매물이 ' +
        '없는 것입니다.</p></div>' +
      '</div>' +
      /* ⚠️⚠️ **빈 칸으로 두지 않습니다** — 폰 바닥 메뉴의 「등록」이
         이 자리로 오는데, 설정이 없으면 화면이 아무것도 안 그려
         **눌러도 아무 일이 안 나는 칸**이 됩니다(`#lsbox` 에서
         겪은 그 자리 · 절대 규칙 5). 화면이 그리면 덮어씁니다. */
      '<div id="lsbox"><p class="jnote">판매글을 올리는 자리입니다. 로그인하시면 여기에 양식이 열립니다.</p></div>' +
      /* ⚠️⚠️ **경고 하나에 `<p>` 하나**입니다 (2026-11-08) — 한 문단에
         ⚠️ 둘을 이어 붙였더니 1280px 에서 한 줄로 늘어서 어디서 끊어
         읽어야 하는지 안 보였습니다(손님이 40~60대입니다). 찍어 보고
         알았습니다 — 글자가 작지도 · 가로로 밀리지도 않아 검사는 전부
         초록이었습니다. */
      /* ⚠️⚠️ 전에 여기 있던 ⚠️ 두 줄은 **안전거래 가이드**(`#safe`)로
         옮겼습니다 — 두 곳에 적으면 한쪽만 고치는 날 둘이 다른 말을
         합니다. 여기서는 **그 자리로 가는 길**만 냅니다. */
      '<p class="jnote">⚠️ 연락처는 목록에 나오지 않습니다. 문의가 ' +
      '받아들여진 뒤 서로 따로 고르셨을 때만 그 상대 한 분에게 보입니다. ' +
      '거래하시기 전에 <b>아래 안전거래 가이드</b>를 꼭 읽어 보세요.</p>' +
      '</div></section>'
    : '';

  var joinSec = (c.kind === "match")
    ? '<section class="sec sec-alt"><div class="wrap">' +
      '<div class="sec-hd"><h2>열려 있는 조인</h2>' +
      '<p>회원이 직접 여는 자리입니다. 날짜 · 지역 · 인원을 적어 올리시면 ' +
      '다른 회원이 참가를 신청합니다. ' +
      /* ⚠️ 지어낸 약속을 하지 않습니다 — 우리가 부킹을 잡아 주지 않습니다 */
      '골프올인원은 부킹을 대신 잡아 드리지 않으며 거래 당사자가 아닙니다.</p></div>' +
      ownChips +
      '<div id="joinlist">' +
        '<div class="none"><h3>조인을 보시려면 잠시만 기다려 주세요.</h3>' +
        '<p>열려 있는 조인을 불러옵니다. 보이지 않으면 아직 열린 조인이 ' +
        '없는 것입니다.</p></div>' +
      '</div>' +
      /* ⚠️⚠️ **빈 칸으로 두지 않습니다** — 폰 바닥 메뉴의 「등록」이
         이 자리로 오는데, 설정이 없으면 화면이 아무것도 안 그려
         **눌러도 아무 일이 안 나는 칸**이 됩니다(`#lsbox` 에서
         겪은 그 자리 · 절대 규칙 5). 화면이 그리면 덮어씁니다. */
      '<div id="joinbox"><p class="jnote">조인 자리를 여는 양식이 여기에 열립니다. 로그인하셔야 합니다.</p></div>' +
      '<p class="jnote">⚠️ 연락처는 목록에 나오지 않습니다. 참가가 ' +
      '수락된 뒤 서로 따로 고르셨을 때만 그 상대 한 분에게 보입니다.</p>' +
      '</div></section>'
    : '';

  /* ⚠️⚠️ **커뮤니티도 막다른 길이 아닙니다** (0047 · §2.C).
     ⚠️ 설명은 빌드가 찍고(크롤러 몫) 글 목록은 브라우저가 그립니다.
     ⚠️⚠️⚠️ **2026-11-06 — 이 글이 "질문과 답변" 이라고 적고 있었습니다.**
     0059 가 게시판 일곱(자유게시판 · 라운딩 후기 · 장비 리뷰 · 레슨
     후기 · 골프장 정보 · 초보 질문 · 골프 유머)과 댓글 · 사진 · 회원
     조회를 세웠는데 글만 그대로였습니다 — 하는 일을 안 한다고 적는 것도
     거짓입니다(절대 규칙 5). */
  var cqSec = (c.key === "community")
    ? '<section class="sec sec-alt"><div class="wrap">' +
      '<div class="sec-hd"><h2>커뮤니티 게시판</h2>' +
      '<p>게시판 ' + W.esc(String(W.amCatItems(c).length)) + '곳에 회원끼리 ' +
      '글을 올리고 댓글을 답니다. 글과 댓글은 <b>가입 안 하셔도 보실 수 ' +
      '있고</b>, 올리거나 댓글을 다시려면 로그인하셔야 합니다(올리신 글을 ' +
      '나중에 고치거나 내리시려면 누가 올렸는지 알아야 합니다). ' +
      /* ⚠️ 지어낸 약속을 하지 않습니다 — 우리가 답해 드리는 곳이 아닙니다 */
      '골프올인원이 답변을 드리지는 않으며, 글과 댓글의 내용은 ' +
      '적으신 회원의 것입니다.</p></div>' +
      /* ⚠️⚠️ 오른쪽 안내 레일(확정 시안 ⑩)은 **빌드가 찍습니다** —
         글자뿐이라 설정이 없어도 · 자바스크립트가 꺼져도 · 크롤러에게도
         그대로 보입니다. 화면(`js/community.js`)이 그리면 그 셋에서
         사라지고, 받은 글자를 잇는 함수가 되어 `check-safe` ⑥ 이
         잡습니다(맞는 말입니다 — 다음 사람이 거기에 손님 글을 넣는 날
         날것으로 나갑니다).
         ⚠️ 여기에 「인기글 · 랭킹」을 두지 않습니다 — 세어 본 적이
         없습니다(0047 §2.C · 절대 규칙 1).
         ⚠️ 폰에서는 CSS 한 곳이 목록 **아래**로 내립니다. */
      '<div class="cqw">' +
      /* ⚠️⚠️⚠️ **게시판 메뉴 — 확정 시안 ⑩ 의 PC 왼쪽 기둥.**
         빌드가 **링크로** 찍습니다 — 자바스크립트가 꺼진 분도 누를 수
         있고 크롤러도 게시판 열둘을 봅니다. 화면(`js/community.js` 의
         `paintBd()`)은 **켜진 칸만** 갈아 끼웁니다.
         ⚠️⚠️ 주소 꼴은 `js/community.js` 의 `url()` 과 **같아야** 합니다
         (`?s=<키>`) — 두 곳이 다른 주소를 지으면 눌러도 안 걸립니다.
         ⚠️ 폰에서는 CSS 한 곳이 **가로 알약 줄**로 되돌립니다. */
      '<nav class="cqw-bd" id="cqbd" aria-label="게시판">' +
        '<div class="sf-c cqb-c">' +
          (W.amCqTabs ? W.amCqTabs() : []).map(function(t){
            var to = (t.boards || []).join(",");
            return '<a class="chip cqtab' + (t.key === "all" ? " chip-on" : "") +
              '" href="' + W.esc(W.amCatUrl(c) + (to ? "?s=" + encodeURIComponent(to) : "")) +
              '" data-bd="' + W.esc(to) + '">' + W.esc(t.name) + '</a>';
          }).join("") +
          '<a class="chip cqtab" href="' + W.esc(W.amCatUrl(c)) + '?s=boards" ' +
            'data-bd="boards">전체 게시판</a>' +
        '</div>' +
      '</nav>' +
      '<div class="cqw-main" id="cqlist">' +
        '<div class="none"><h3>글을 보시려면 잠시만 기다려 주세요.</h3>' +
        '<p>올라온 글을 불러옵니다. 보이지 않으면 아직 올라온 글이 ' +
        '없는 것입니다.</p></div>' +
      '</div>' +
      '<aside class="cqw-side">' +
        '<section class="cqa">' +
          '<h3 class="cqa-h">이용 안내</h3>' +
          '<p class="cqa-card">' + W.icon("flag") +
            '<b>서로 존중하는<br>골프 이야기</b></p>' +
          '<p class="cqa-p">질문, 경험, 장비, 라운드 등 골프와 관련된 ' +
          '다양한 이야기를 자유롭게 나눠주세요.</p>' +
        '</section>' +
      '</aside>' +
      '</div>' +
      /* ⚠️⚠️⚠️ **게시판 열둘로 바로 가는 길은 여기 그대로 둡니다.**
         위의 탭은 시안 ⑩ 의 **대표 여섯**이고, 어느 탭에도 안 든 게시판이
         넷 있습니다(골프 정보 · 대회 · 이벤트 · 동호회 · 여성 골퍼).
         이 줄이 없으면 그 넷은 **빌드가 찍은 HTML 에서 사라지고**
         크롤러 · 자바스크립트가 꺼진 분에게는 없는 게시판이 됩니다.
         ⚠️ 자리를 탭 **아래**로 내렸습니다 — 시안은 맨 위가 탭입니다. */
      '<div class="cqall"><h3 class="cqall-h">모든 게시판 바로가기</h3>' +
      ownChips + '</div>' +
      /* ⚠️⚠️ **빈 칸으로 두지 않습니다** — 폰 바닥 메뉴의 「등록」이
         이 자리로 오는데, 설정이 없으면 화면이 아무것도 안 그려
         **눌러도 아무 일이 안 나는 칸**이 됩니다(`#lsbox` 에서
         겪은 그 자리 · 절대 규칙 5). 화면이 그리면 덮어씁니다. */
      '<div id="cqbox"><p class="jnote">글을 쓰는 양식이 여기에 열립니다. 비회원도 쓰실 수 있습니다.</p></div>' +
      '<p class="jnote">⚠️ 올리신 글은 <b>누구나 봅니다.</b> 전화번호 · ' +
      '아이디 같은 연락처는 적지 마세요. 글쓴이는 정하신 닉네임으로 ' +
      '나오고, 안 정하셨으면 성함을 가려서(김**) 냅니다. 문제가 있는 글은 ' +
      '신고하실 수 있고, 올리신 글은 내 정보 화면에서 고치거나 내리실 수 ' +
      '있습니다.</p>' +
      '</div></section>'
    : '';

  /* ⚠️⚠️ **인력 · 비즈니스도 막다른 길이 아닙니다** (0048).
     하위분류 여섯 이름만 보이고 올릴 자리도 지원할 자리도 없었습니다 —
     막다른 분류 셋 가운데 마지막입니다.
     ⚠️ 설명은 빌드가 찍고(크롤러 몫) 글 목록은 브라우저가 그립니다.
     ⚠️ 거르개도 **목록 안에** 브라우저가 그립니다 — 빌드가 찍어 두면
     자바스크립트가 꺼진 분에게 눌러도 아무 일이 안 나는 칸이 됩니다. */
  var jobSec = (c.key === "career")
    ? '<section class="sec sec-alt"><div class="wrap">' +
      '<div class="sec-hd"><h2>구인 · 구직 · 제휴</h2>' +
      '<p>골프장 · 연습장 · 아카데미가 사람을 구하고, 프로 · 캐디가 ' +
      '일자리를 찾고, 업체끼리 제휴 · 거래를 제안하는 자리입니다. ' +
      /* ⚠️ 지어낸 약속을 하지 않습니다 — 우리가 채용을 대신 하지 않습니다 */
      '골프올인원은 채용을 대신 진행하지 않으며 거래 당사자가 아닙니다. ' +
      '적어 주신 조건이 사실인지는 서로 확인하셔야 합니다.</p></div>' +
      ownChips +
      '<div id="joblist">' +
        '<div class="none"><h3>글을 보시려면 잠시만 기다려 주세요.</h3>' +
        '<p>올라온 글을 불러옵니다. 보이지 않으면 아직 올라온 글이 ' +
        '없는 것입니다.</p></div>' +
      '</div>' +
      /* ⚠️⚠️ **빈 칸으로 두지 않습니다** — 폰 바닥 메뉴의 「등록」이
         이 자리로 오는데, 설정이 없으면 화면이 아무것도 안 그려
         **눌러도 아무 일이 안 나는 칸**이 됩니다(`#lsbox` 에서
         겪은 그 자리 · 절대 규칙 5). 화면이 그리면 덮어씁니다. */
      '<div id="jobbox"><p class="jnote">공고를 올리는 양식이 여기에 열립니다. 로그인하셔야 합니다.</p></div>' +
      '<p class="jnote">⚠️ 연락처는 목록에 나오지 않습니다. 지원이 ' +
      '수락된 뒤 서로 따로 고르셨을 때만 그 상대 한 분에게 보입니다. ' +
      '올리신 글은 내 정보 화면에서 고치거나 마감하실 수 있습니다.</p>' +
      '</div></section>'
    : '';

  /* ⚠️⚠️⚠️ **회원끼리 쓰는 구간은 업체가 있을 때도 그립니다.**
     전에는 이 넷이 `var list = …` **뒤에** 적혀 있어서, 업체가 한 곳이라도
     있는 분류에서는 이른 `return` 이 먼저 나가 **그 구간이 통째로
     사라졌습니다** (`var` 는 끌어올려지지만 값은 그때 undefined 입니다).
     중고(업체가 하는 매입 견적 · 위탁판매)와 인력(업체가 입점하는 분류)이
     바로 그런 자리입니다 — 첫 업체를 승인하신 날 매물 목록과 구인 글이
     조용히 없어질 참이었습니다.
     ⚠️ "0곳 안내만 만들고 **있을 때 그리는 자리를 안 만든**" 자리의
     거울상입니다 (앞 서비스에서 겪은 그 줄). 그래서 **한 곳**에 묶어
     두고 두 갈래가 같이 씁니다. */
  /* ⚠️⚠️⚠️ **티타임 자리** (0060) — 업체가 올린 **남는 자리**입니다.
     ⚠️⚠️ 회원 조인(0046)과 **갈라서** 냅니다 — 전자상거래법 제20조의4 ③
     이 "개인 판매자와 사업자가 섞여 있으면 **구분해 표시**" 하라고
     합니다. `/cat/matchup` 에서는 이 구간이 회원 조인 **위**에 서고,
     각자 제목이 누가 내놓은 자리인지 말합니다.
     ⚠️ 설명은 **빌드가** 찍고(크롤러 몫) 목록은 **브라우저가** 그립니다.
     ⚠️ `data-teekind` 로 부킹인지 조인인지 알려 줍니다 — 화면이 주소로
     다시 판단하면 규칙이 두 곳이 됩니다. */
  /* ⚠️⚠️⚠️ **찾는 칸 + 날짜 · 지역별 현황** (2026-11-07 · 시안) —
     메인에만 있어서, 머리말에서 「골프장 부킹」을 누르고 들어오신 분은
     **목록부터** 보셨습니다 — 어느 날짜 · 어느 지역에 자리가 있는지를
     보는 자리가 그 화면에 없었습니다. 지금은 목록 **위**에 같은 띠가 섭니다.
     ⚠⚠ **그리는 코드는 `js/teeboard.js` 한 곳**입니다 — 메인과 두 벌로
     적으면 한쪽만 고치는 날 둘이 다른 말을 합니다(업체 카드를 빌드와
     브라우저 둘이 그리던 그 자리).
     ⚠⚠ `data-teekind` 가 **어느 탭이 먼저 열릴지**를 정합니다 — 부킹
     화면은 부킹 · 조인 화면은 조인. 화면이 주소로 다시 판단하면 규칙이
     두 곳이 됩니다(`#ttlist` 와 같은 꼴). */
  var teeFind = (c.key === "booking" || c.kind === "match")
    ? '<section class="sec sec-alt" aria-labelledby="tbd-h"><div class="wrap">' +
      '<div class="sec-hd"><h2 id="tbd-h">원하는 날짜와 지역의 자리 찾기</h2>' +
      '<p>제휴 골프장이 올린 <b>티타임</b>과 회원이 연 <b>조인</b>을 ' +
      '날짜 · 지역으로 나눠 보여 드립니다. ' +
      '골프올인원은 거래 당사자가 아니며 <b>결제를 받지 않습니다.</b></p></div>' +
      /* ⚠️ 알맹이는 브라우저가 그립니다 — 자리는 날마다 바뀝니다 */
      '<div id="teeboard" data-teekind="' +
        (c.key === "booking" ? "booking" : "join") + '" hidden></div>' +
      '</div></section>'
    : '';

  var teeSec = (c.key === "booking" || c.kind === "match")
    ? '<section class="sec"><div class="wrap">' +
      '<div class="sec-hd"><h2>' +
        (c.key === "booking" ? '제휴 골프장이 올린 티타임' : '업체가 내놓은 조인 자리') +
      '</h2>' +
      '<p>입점한 골프장 · 업체가 직접 올린 <b>남는 자리</b>입니다. ' +
      /* ⚠️⚠️⚠️ '예약 완료' 를 약속하지 않습니다 (지시서 §6) */
      '예약 신청을 보내시면 <b>업체가 확인하고 확정</b>합니다 — 신청만으로 ' +
      '자리가 잡히지 않습니다. 골프올인원은 거래 당사자가 아니며 ' +
      '<b>결제를 받지 않습니다.</b></p></div>' +
      '<div id="ttlist" data-teekind="' +
        (c.key === "booking" ? "booking" : "join") + '">' +
        '<div class="none"><h3>자리를 보시려면 잠시만 기다려 주세요.</h3>' +
        '<p>올라온 자리를 불러옵니다. 보이지 않으면 아직 올라온 자리가 ' +
        '없는 것입니다.</p></div>' +
      '</div>' +
      '<p class="jnote">⚠️ 상호와 전화번호는 <b>업체가 공개한 값</b>입니다 ' +
      '(사업자 정보 또는 업체가 적은 예약 문의 번호). 예약을 신청하시면 ' +
      '성함과 연락처가 <b>그 업체에만</b> 넘어갑니다.</p>' +
      '</div></section>'
    : '';

  /* ── 구합니다 (0061) — 업체가 입점하는 분류 다섯 ────────────────
     ⚠️⚠️⚠️ **서는 분류는 `amWantCats()` 한 곳이 정합니다** (레슨 ·
     연습장 · 마켓 · 피팅 · 여행 — 부킹은 뺍니다). 여기서 키를 다시
     적으면 두 곳이 어긋나고, 그때 화면은 그려지는데 목록이 영원히
     0건입니다.
     ⚠️⚠️⚠️ **`/match`(매칭 요청)와 다르다는 것을 그 자리에서
     말합니다** — 둘이 비슷해 보이지만 하나는 운영자만 보고 하나는
     누구나 봅니다. 안 적으면 손님이 어느 쪽을 써야 할지 모릅니다.
     ⚠️ 알맹이는 브라우저가 그립니다 (`js/wanted.js`) — 글은 아무 때나
     올라오고 내려갑니다. 설명은 빌드가 찍습니다 (크롤러 몫).
     ⚠️ 어느 분류인지는 **상자에 적어 줍니다**(`data-wcat`) — 화면이
     주소에서 짐작하면 주소가 바뀌는 날 조용히 어긋납니다. */
  var wtSec = (W.amWantOn && W.amWantOn(c))
    ? '<section class="sec sec-alt"><div class="wrap">' +
      '<div class="sec-hd"><h2>이런 걸 찾고 있어요</h2>' +
      '<p>회원이 직접 올리는 자리입니다. 찾으시는 것을 적어 두시면 ' +
      '업체나 다른 회원이 답을 답니다. <b>연락처는 글에 적지 마세요</b> — ' +
      '답을 받아들이신 뒤 서로 따로 고르셨을 때만 열립니다. ' +
      '골프올인원은 거래 당사자가 아닙니다.</p></div>' +
      '<div id="wtlist" data-wcat="' + esc(c.key) + '">' +
        '<div class="none"><h3>글을 보시려면 잠시만 기다려 주세요.</h3>' +
        '<p>올라온 글을 불러옵니다.</p></div>' +
      '</div>' +
      /* ⚠️⚠️ **빈 칸으로 두지 않습니다** — 폰 바닥 메뉴의 「등록」이
         이 자리로 오는데, 설정이 없으면 화면이 아무것도 안 그려
         **눌러도 아무 일이 안 나는 칸**이 됩니다(`#lsbox` 에서
         겪은 그 자리 · 절대 규칙 5). 화면이 그리면 덮어씁니다. */
      '<div id="wtbox"><p class="jnote">「구합니다」 글을 올리는 양식이 여기에 열립니다. 로그인하셔야 합니다.</p></div>' +
      '<p class="jafh">' +
        '<button type="button" class="btn btn-pri" id="wtnew">' +
        '구합니다 글 올리기</button></p>' +
      /* ⚠️⚠️ **두 길이 어떻게 다른지 적습니다.** 안 적으면 손님이
         "매칭 요청" 과 "구합니다" 가 같은 것인 줄 압니다. */
      '<p class="jnote">⚠️ 이 글은 <b>누구나 봅니다.</b> ' +
      '조용히 업체 견적만 받아 보고 싶으시면 ' +
      '<b>매칭 요청</b>을 쓰세요 — 그쪽은 운영자만 보고, 업체에 넘길 ' +
      '때 상호를 알려 드리고 다시 여쭙습니다.</p>' +
      '<p class="jnote">⚠️ 연락처는 목록에 나오지 않습니다.</p>' +
      '<p class="wtc-go"><a class="btn btn-line" href="' +
        esc(W.amCatUrl(c)).replace(/^\/cat\//, "/match?cat=") +
        '">매칭 요청으로 견적 받기</a></p>' +
      '</div></section>'
    : '';

  /* ⚠️⚠️⚠️ **"0곳 안내를 대신하는 구간" 과 "곁들이는 구간" 은 다릅니다.**
     조인 · 중고 · 게시판 · 인력은 그 분류 **자체가** 회원끼리 쓰는
     자리라, 업체가 0곳이어도 "아직 등록된 업체가 없습니다" 를 낼 까닭이
     없습니다 — 그 구간이 0건을 스스로 말합니다. 그런데 **구합니다(0061)
     와 티타임(0060)은 다릅니다** — 그 분류에는 업체 쪽이 따로 있고,
     이 둘은 거기에 **곁들이는** 자리입니다.
     ⚠️ 처음에 셋을 한 덩이로 묶었더니, 구합니다를 더한 순간 레슨 ·
     연습장 · 마켓 · 피팅 · 여행에서 **"아직 등록된 업체가 없습니다" 가
     통째로 사라졌습니다**(그리고 거기 붙어 있던 매칭 요청 단추까지).
     `test-providers` 가 여행 분류에서 잡았습니다 — 가로로 밀리지도 ·
     글자가 작지도 않아 다른 검사는 전부 초록이었습니다. */
  /* ⚠️⚠️⚠️ **2026-11-08 — 차례를 뒤집었습니다.**
     전에는 `head + adTop + subs(칩) + teeFind + sideSec + (ownSec || zero)`
     였습니다. 그래서 **열 장 전부**가 이렇게 보였습니다 —
       ① 맨 위에 하위 칩 한 줄(업체 0곳이라 거의 다 0건으로 갑니다)
       ② 조인 화면은 **업체가 내놓은 자리**가 **회원이 연 조인**보다 위
       ③ 「<분류> 요청에 적는 것」이 큰 제목 하나를 통째로
     지금은 **지금 실제로 되는 것이 위**입니다:
       회원 것(`ownSec` 매물 · 조인 · 게시판 · 구인 · 구합니다)
       → 업체 것(`pvSec` 칩 · 카드 또는 0곳 안내 · 매칭 요청)
     ⚠️⚠️ 다만 **업체가 실제로 있으면 업체가 위**입니다 — 그때는 손님이
     업체를 찾으러 온 것이 맞습니다. 가르는 것은 `list.length` 하나이고
     아래 한 줄뿐입니다 (분류마다 적어 두면 갈래가 늘어나는 날 어긋납니다).
     ⚠️ `teeFind`(찾는 칸)는 **늘 맨 위**입니다 — 그 칸은 부킹 · 조인을
     찾는 자리이고 시안이 그렇게 요구했습니다. */
  var ownSec = lsSec + joinSec + cqSec + jobSec + wtSec;
  /* ⚠️⚠️⚠️ **2026-11-07 — `/cat/matchup` 에 `#ttlist` 가 한 줄도 안 찍혔습니다.**
     그때 차례가 `ownSec || (sideSec + zero)` 라, 조인 화면처럼 ownSec 이
     있는 분류에서는 sideSec 이 **통째로 사라졌습니다** — 0060 이 세운
     "업체가 내놓은 조인 자리" 가 **처음부터 죽은 코드**였습니다
     (`js/booking.js` 는 `#ttlist` 가 없으면 그자리에서 나갑니다 · 에러 0줄).
     ⚠️ 2026-11-08 에 **구간을 더하기만 하는 꼴**로 바꿔 그 함정을 없앴습니다 —
     이제 `ownSec` 도 `teeSec` 도 `pvSec` 도 **서로를 지우지 않습니다.** */

  /* ⚠️⚠️⚠️ **가지를 둘로 두지 않습니다** (2026-11-08). 전에는 "업체가
     있을 때" 와 "0곳일 때" 가 `return` 둘로 갈려 있었고, 그래서 한쪽에만
     구간을 더하는 일이 **두 번** 났습니다 — 여행에서 구합니다를 더했다가
     0곳 안내가 통째로 사라진 자리, `/cat/matchup` 에 `#ttlist` 가 한 줄도
     안 찍혀 0060 이 세운 코드가 **처음부터 죽어 있던** 자리.
     지금은 줄기가 하나이고, 업체 쪽은 `pvBlock()` 한 함수가 **있을 때와
     없을 때를 같이** 그립니다. */
  var list  = W.amProvidersOf(c.key);
  /* ⚠️⚠️⚠️ **레슨은 업체 덩이를 제 것으로 바꿔 넣습니다** (2026-11-10).
     `pvBlock` 은 「칩 + 카드 또는 0곳 안내 + 요청에 적는 것」 한 덩이인데,
     레슨 시안은 **찾는 칸 · 카테고리 카드 · 4열 카드 · 우측 레일**을
     요구합니다. 그래서 레슨만 `lessonFind + lessonCats + lessonSec` 로
     갈아 끼우고 **나머지 아홉 장은 그대로 둡니다**(한 장 때문에 열 장을
     바꾸지 않습니다 · 중고장터 머리와 같은 규칙).
     ⚠️ 그 셋이 `pvBlock` 이 내던 것을 **빠짐없이** 냅니다 — 하위 칩
     (`lessonCats`) · 0곳 안내(§13) · 요청에 적는 것(`asksBlock`).
     하나라도 빠지면 `test-providers` · `test-match` 가 잡습니다. */
  var pvSec = (c.key === "lesson")
    ? lessonSec(c, list)
    /* ⚠️⚠️ 연습장은 **가로 카드 목록**입니다(확정 시안 ⑤) —
       `pvBlock` 의 격자 카드와 모양이 다릅니다. 하위 칩 · 매칭
       요청은 그대로 두고(길을 안 지우려고) 목록만 갈아 끼욵니다. */
    /* ⚠️⚠️⚠️ 연습장은 `rangeSec` 이 목록과 0곳 안내를 둘 다 냅니다 —
       그렇다고 `pvBlock` 을 그대로 부르면 **「업체가 없습니다」가 한
       화면에 두 번** 나옵니다(찍어 보고 알았습니다). 그래서 `quiet` 로
       하위 칩과 매칭 요청만 남깁니다 — **길은 하나도 안 지우고** 같은
       말을 두 번 하지만 않습니다. */
    : (c.key === "range")
    ? rangeSec(c, list) + pvBlock(c, k, list, pvItems, { quiet:true })
    /* ⚠️⚠️⚠️ 피팅은 **탭이 곧 하위 칩**이라 `noChips` 입니다 —
       그냥 `quiet` 로 두면 같은 여섯이 **한 화면에 두 줄** 서고,
       `test-providers` 가 세는 칩 수가 두 배가 됩니다. */
    : (c.key === "fitting")
    ? fitSec(c, list, items) + pvBlock(c, k, list, pvItems, { quiet:true, noChips:true })
    /* ⚠️⚠️ 여행은 **상품이 먼저**입니다 — 시안의 알맹이고,
       여행사 목록은 그 아래입니다(하위 칩과 매칭 요청은 그대로 남깁니다). */
    : (c.key === "travel")
    ? tripSec() + pvBlock(c, k, list, pvItems)
    : pvBlock(c, k, list, pvItems);
  /* ⚠️⚠️ **찾는 칸과 카테고리 카드는 늘 맨 위**입니다 — 시안이 그렇고,
     아래 차례(회원 것 ↔ 업체 것)가 뒤집혀도 흔들리면 안 되는 자리라
     `teeFind` 처럼 **덩이 밖**에 둡니다. 전에 덩이 안에 두었더니 프로가
     0분일 때 「이런 걸 찾고 있어요」(구합니다) 아래로 내려갔습니다. */
  var lsnTop = (c.key === "lesson") ? (lessonFind(c) + lessonCats(c)) : "";

  /* ⚠️⚠️⚠️ **조인은 막다른 길이 아닙니다** (0046 · 지시서 §2.A).
     여기는 업체를 찾는 자리가 아니라 **회원끼리 여는** 자리라,
     "업체 0곳" 안내 대신 **열린 조인 목록과 여는 양식**이 옵니다.
     ⚠️ 설명은 **빌드가** 찍습니다 (크롤러 · 자바스크립트 꺼진 분이
     읽을 몫). 목록은 아무 때나 바뀌므로 **브라우저가** 그립니다 —
     빌드 때 찍으면 배포할 때만 바뀝니다.
     ⚠️ 아래 글을 지우면 봇에게는 **빈 화면**이 됩니다. */
  /* ⚠️⚠️⚠️ **0곳 상자가 막다른 길이었습니다** (2026-11-08) — 메인과
     업체찾기는 `amOpenNow()` 로 "업체를 기다리지 않고 지금 하실 수 있는
     것" 다섯을 내는데, **분류 화면의 0곳 상자만 길이 하나도 없었습니다.**
     거기서 손님이 할 수 있는 일이 뒤로 가기뿐이었습니다 (절대 규칙 2).
     ⚠️⚠️ **줄은 `amOpenNow()` 한 곳**입니다 — 글을 여기 따로 적으면
     세 화면이 조용히 다른 말을 합니다.
     ⚠️⚠️ **지금 보고 계신 분류로 보내는 줄은 뺍니다** — 그 줄의 주소는
     이 화면 자신이라, 그대로 두면 **눌러도 제자리인 단추**가 됩니다
     (레슨 화면의 "구합니다 글 올리기" 가 그 자리입니다 · 절대 규칙 5).
     ⚠️ 0건이면 줄째 빠집니다 (지어내지 않습니다). */

  /* ⚠️⚠️⚠️ **폰 바닥 메뉴** (확정 시안 ⑤ ⑦ ⑧ ⑨ ⑩ · 2026-11-12)
     네 칸이 **전부 실제 주소**입니다 — 시안의 「채팅」은 그 기능이
     없으므로 넣지 않습니다(절대 규칙 5).
     ⚠️⚠️ 「등록」이 가는 자리는 분류마다 다릅니다. 손님이 올릴 것이
       없는 분류(부킹 — 티타임은 업체가 올립니다)에는 **「입점」**
       으로 적고 `/join` 으로 보냅니다. 없는 일을 "등록" 이라고 적지
       않습니다.
     ⚠️ 가는 자리는 **빈 칸이 아닙니다** — 위의 다섯 상자에 안내문을
       찍어 두었습니다.
     ⚠️ PC 에서는 CSS 가 아예 안 그립니다. */
  function botNav(c){
    var put = "/join", lab = "입점";
    if(c.key === "community"){ put = "#cqbox";   lab = "글쓰기"; }
    else if(c.key === "career"){  put = "#jobbox";  lab = "등록"; }
    else if(c.key === "matchup"){ put = "#joinbox"; lab = "등록"; }
    else if(c.key === "used"){    put = "#lsbox";   lab = "등록"; }
    else if(W.amWantOn && W.amWantOn(c)){ put = "#wtbox"; lab = "등록"; }
    var one = function(href, name, ic, on){
      return '<a href="' + esc(href) + '"' + (on ? ' class="cqnav-on"' : '') + '>' +
        W.icon(ic) + '<span>' + esc(name) + '</span></a>';
    };
    return '<nav class="cqnav" aria-label="빠른 이동">' +
      one("/", "홈", "home") +
      one("/search", "검색", "search") +
      one(put, lab, "plus") +
      one("/my", "내정보", "user") +
    '</nav>';
  }

  return {
    route: W.amCatUrl(c),
    botnav: botNav(c),
    title: c.name,
    crumbs: [["카테고리 전체보기", "/categories"], [c.name, W.amCatUrl(c)]],
    desc: c.name + " — " + c.lead + ". " + k.what + " " +
          (items.length ? "다루는 것: " + items.map(function(i){ return i.name; }).join(" · ") + "." : ""),
    /* ⚠️⚠️ **값을 읽는 파일을 싣는 것까지가 기능입니다.** `/help` 에서
       `site.js` 를 안 실어 문의 양식이 **에러 한 줄 없이** 안 열린 적이
       있습니다 — joinKeep 이 빈 문자열이 되어 "설정이 안 된 것" 과
       똑같이 보였습니다. 여기서 같은 실수를 하지 않습니다.
       ⚠️ regions.js 는 지역 고르는 칸이 읽습니다. */
    /* ⚠️⚠️⚠️ **광고 파일 셋은 갈래와 상관없이 늘 싣습니다** — 갈래마다
       적어 두면 새 갈래가 생기는 날 그 분류만 광고가 **조용히 안
       나옵니다**(에러도 없습니다). 그래서 뒤에 `concat` 으로 붙입니다.
       ⚠️ providers 둘은 adslot 이 `/pro/<id>` 를 짓고(amProviderUrl)
       그 업체가 **빌드에 있는지** 보는 데(amProvider) 씁니다 — 없으면
       링크를 안 걸어 404 로 보내지 않습니다. */
    js: ((c.kind === "match")
      /* ⚠️⚠️ deal.js — 0058 의 `amWatchLink()`(조건 저장으로 가는 길)와
         `AM_WATCH` 가 거기 있습니다. 안 실으면 그 단추가 **조용히 안
         그려집니다** (제 가드가 `window.amWatchLink ?` 로 넘어갑니다). */
      /* ⚠️ 0060 — 업체가 내놓은 조인 자리도 같은 화면에 섭니다 */
      /* ⚠️⚠️ teeboard.js — 찾는 칸 + 날짜 · 지역별 현황입니다(2026-11-07).
         안 실으면 그 상자가 `hidden` 인 채로 남고 **에러도 안 납니다.** */
      ? ["/js/data/site.js", "/js/data/regions.js", "/js/data/deal.js",
         "/js/teeboard.js", "/js/join.js", "/js/booking.js"]
      /* ⚠️⚠️ 0060 — `/cat/booking` 은 **값을 읽는 파일 셋**이 있어야
         합니다: site.js(보유 기간 · 찾을 수 있는 날 수 — 비면 신청
         양식을 **안 엽니다**) · regions.js(지역 칸) · deal.js(상태 말).
         하나라도 빠지면 양식이 **조용히** 안 열립니다. */
      : (c.key === "booking"
          ? ["/js/data/site.js", "/js/data/regions.js", "/js/data/deal.js",
             "/js/teeboard.js", "/js/booking.js"]
      /* ⚠️ 게시판 글 사진도 **공개 버킷**으로 가므로 `imgprep.js` 가
         먼저 서야 합니다 (위치정보를 떼는 한 곳입니다). */
      : (c.key === "community" ? ["/js/imgprep.js", "/js/community.js"]
      /* ⚠️⚠️ **값을 읽는 파일을 싣는 것까지가 기능입니다** — site.js 가
         careerKeep(보유 기간)을, regions.js 가 지역 칸을, catalog.js 가
         하위분류 칸을 줍니다 (catalog 는 빌드가 저절로 싣습니다). */
      : (c.key === "career"
          ? ["/js/data/site.js", "/js/data/regions.js", "/js/data/deal.js",
             "/js/career.js"]
      /* ⚠️⚠️ **값을 읽는 파일을 싣는 것까지가 기능입니다** — site.js 가
         listingKeep(보유 기간 · 비면 양식을 안 엽니다) · regions.js 가
         지역 칸 · **deal.js 가 물건 상태 말**을 줍니다. 하나라도 빠지면
         양식이 조용히 안 열립니다 (`/help` 가 site.js 를 안 실어 문의
         양식이 안 열렸던 그 자리입니다). */
      : (c.key === "used"
          /* ⚠️ `lstphoto.js` 는 매물 사진 상자 **한 곳**입니다 (0068) —
             `/my` 도 같은 파일을 싣습니다. 안 실으면 올리신 직후 사진
             칸이 조용히 안 나옵니다. */
          ? ["/js/data/site.js", "/js/data/regions.js", "/js/data/deal.js",
          /* ⚠️⚠️⚠️ `imgprep.js` 를 **사진 상자보다 먼저** 싣습니다 — 올리기 전에
            위치정보(EXIF)를 떼고 줄이는 한 곳입니다. 안 실으면
            `amImgPrep` 이 없어 올리기가 **거절**됩니다(원본을 그냥
            올리지 않습니다 — 그 한 장만 조용히 집 좌표를 달고
            공개 버킷에 들어갑니다). */
             "/js/imgprep.js", "/js/lstphoto.js", "/js/listing.js"]
      /* ⚠️⚠️ 0061 — **값을 읽는 파일을 싣는 것까지가 기능입니다**:
         site.js 가 wantedKeep(비면 양식을 **안 엽니다**) · regions.js 가
         지역 칸 · deal.js 가 예산 셈(`amWantBudget`)을 줍니다. 하나라도
         빠지면 양식이 **조용히** 안 열립니다 (`/help` 가 site.js 를 안
         실어 문의 양식이 안 열렸던 그 자리입니다). */
      : ((W.amWantOn && W.amWantOn(c))
          ? ["/js/data/site.js", "/js/data/regions.js", "/js/data/deal.js",
             "/js/wanted.js"]
          : [])))))).concat(["/js/data/providers.generated.js",
                          "/js/data/providers.js", "/js/adslot.js"])
    /* ⚠️⚠️ 레슨은 **카드를 브라우저도 그립니다** — `js/card.js` 를 안
       실으면 `amLessonCard` 가 없어 거르개를 누르는 순간 목록이 조용히
       비어 버립니다(에러 0줄). `data/lesson.js` 는 가격대 · 정렬 ·
       카테고리 카드를 주는 한 곳이고, `data/review.js` 는 평점을
       셉니다(별이 조용히 빠집니다). */
    .concat(c.key === "lesson"
      ? ["/js/data/reviews.generated.js", "/js/data/review.js",
         "/js/data/lesson.js", "/js/card.js", "/js/lesson.js"]
      : [])
    /* ⚠️⚠️ 연습장도 **카드를 브라우저가 다시 그립니다** — `js/card.js`
       를 안 실으면 `amRangeCard` 가 없어 거르개를 누르는 순간 목록이
       조용히 비어 버립니다(에러 0줄). `data/review.js` 는 평점을 셎니다. */
    .concat(c.key === "range"
      ? ["/js/data/reviews.generated.js", "/js/data/review.js",
         "/js/card.js", "/js/range.js"]
      : [])
    /* ⚠️ 피팅은 **차례**에 후기 평점이 들어가고(`amRating`),
       머리의 단추 이름을 올리려고 `js/photo.js` 를 읽습니다 —
       ⚠️⚠️ **값을 읽는 파일을 싣는 것까지가 기능입니다**
       (`/help` 가 `site.js` 를 안 실어 문의 양식이 조용히 안 열린 그 자리). */
    .concat(c.key === "fitting"
      ? ["/js/data/reviews.generated.js", "/js/data/review.js",
         "/js/photo.js", "/js/card.js", "/js/fitting.js"]
      : [])
    /* ⚠️⚠️ 여행도 **말을 읽는 파일을 싣는 것까지가 기능**입니다 —
       `data/trip.js`(값 · 일정 말)가 안 실리면 값이 **조용히 빈 글자**가
       됩니다. 지역 목록(`data/regions.js`)은 위에서 이미 실습니다. */
    .concat(c.key === "travel"
      ? ["/js/data/trip.js", "/js/trip.js"]
      : []),
    /* ⚠️⚠️ **차례 한 줄이 이 화면의 뜻입니다** — 찾는 칸이 맨 위,
       그 다음이 **지금 실제로 되는 것**(회원 것), 그 다음이 업체 것.
       업체가 실제로 있으면 그때만 업체가 앞으로 옵니다. */
    /* ⚠️ 안전거래 가이드는 **중고장터에만** 섭니다 — 히어로의 그 링크가
       갈 자리이고(절대 규칙 5), 회원끼리 돈이 오가는 자리가 여기입니다. */
    body: head + adTop + teeFind + lsnTop +
          /* ⚠️⚠️ 레슨은 **프로 목록이 알맹이**라 프로가 0분이어도
             맨 앞입니다 — 그 자리가 §13 의 「등록된 프로가 없습니다」와
             입점 신청을 냅니다. 뒤로 미루면 시안에서 가장 중요한 구간이
             「이런 걸 찾고 있어요」 아래로 내려갑니다(찍어 보고 알았습니다). */
          /* ⚠️⚠️ 레슨 · **연습장**은 그 목록이 화면의 알맹이라 업체가
             0곳이어도 **맨 앞**입니다 — 그 자리가 시안의 「등록된 …이
             없습니다」와 등록 길을 냅니다. 뒤로 미루면 시안에서 가장
             중요한 구간이 「이런 걸 찾고 있어요」 아래로 내려갑니다. */
          ((list.length || c.key === "lesson" || c.key === "range" ||
            c.key === "fitting" || c.key === "travel")
                       ? (pvSec + teeSec + ownSec)
                       : (ownSec + teeSec + pvSec)) +
          (c.key === "used" ? safeGuide() : "") +
          related(c)
  };
};
