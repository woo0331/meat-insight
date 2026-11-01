/* ════════════════════════════════════════════════════════════════════
   인증 중고폰 쇼핑몰 — 상품 · 거르개 · 샘플 (2026-10-29)

   ⚠️⚠️ **배열이 둘입니다. 섞지 마세요.**

     AM_PRODUCTS       실제 판매 상품 — 지금 **0건**입니다
     AM_SHOP_SAMPLES   화면이 어떻게 보이는지 보여 드리는 **예시**

   `js/data/sample.js`(업체 예시 프로필)와 **같은 방식**입니다 — 일부러
   다른 배열이라, 예시가 실제 상품 목록 · 검색 · sitemap 어디에도
   섞여 들어갈 수가 없습니다. 한 배열에 `sample:true` 만 달아 두면
   그 깃발을 안 보는 코드가 하나 생기는 날 **지어낸 상품이 구글까지**
   나갑니다 (절대 규칙 1 · 표시 · 광고의 공정화에 관한 법률 제3조).

   ⚠️⚠️ **예시 상품은 살 수 없습니다.** 상세 화면에 구매 단추가 없고,
   그 자리에 왜 없는지가 적혀 있습니다 (§30-7 작동하지 않는 버튼).
   주소는 `NOINDEX` 이고 sitemap 에서 빠집니다 — 지어낸 상품 화면이
   검색에 걸리면 손님이 그걸 보고 돈을 보냅니다.

   ⚠️⚠️ **실제 상품이 한 건이라도 등록되면 예시가 저절로 사라집니다**
   (`amShopSampleOn()`). 코드를 한 줄도 안 고칩니다.

   ⚠️ 모델 · 용량 · 등급 key 는 `js/data/devices.js` 것입니다 —
   여기 또 적지 마세요. `checkShop()` 이 빌드마다 맞춰 봅니다.
   ════════════════════════════════════════════════════════════════════ */

/* ─── 실제 판매 상품 ──────────────────────────────────────────────
   ⚠️⚠️ **비어 있는 것이 맞습니다.** 검수를 마친 기기부터 한 줄씩
   적습니다. 적으실 때의 모양 —

     { id:"ip15p-256-a-01",        // 주소가 됩니다 — /d/ip15p-256-a-01
       model:"iphone-15-pro",       // devices.js 의 key
       cap:256, grade:"A",          // devices.js 의 용량 · 등급 key
       color:"내추럴 티타늄",
       price:1090000,               // ⚠️ 판매가 · 원 단위 정수
       batt:94,                     // 배터리 성능 % — ⚠️ 잰 값만
       parts:["본체","충전 케이블"], // 구성품 — ⚠️ 실제로 보내는 것만
       check:["전원","액정","카메라","스피커","버튼","충전","통화"],
       warranty:30,                 // 보증 일수 — ⚠️ 실제로 지키는 날수
       note:"...", images:[], at:"2026-10-29" }

   ⚠️⚠️ **`batt` 를 모르면 적지 마세요.** 칸을 비우면 화면이 그 줄을
   아예 안 냅니다 — "배터리 미확인" 보다 **없는 줄**이 맞습니다
   (절대 규칙 2). 짐작한 숫자를 적으면 그걸 보고 사십니다.
   ⚠️ `warranty` 가 없으면 보증 줄이 안 나옵니다. 지킬 수 없는 날수를
   적지 마세요 — 적는 순간 채무입니다.                            */
window.AM_PRODUCTS = [];

/* ─── 예시 상품 ───────────────────────────────────────────────────
   ⚠️⚠️ **이것은 상품이 아니라 "화면이 이렇게 보입니다" 입니다.**
   사장님과 손님이 목록 · 상세 · 검색 · 거르개가 실제로 어떻게 도는지
   보실 수 있게 둔 것이고, 전부 **예시** 딱지가 붙습니다.

   ⚠️ 값 · 배터리 · 보증 일수는 **지어낸 숫자**입니다. 그래서 상세
   화면 맨 위가 그렇게 적고 구매 단추가 없습니다.
   ⚠️⚠️ `AM_SHOP_SAMPLE_ON` 을 false 로 두면 구간째 사라집니다.     */
window.AM_SHOP_SAMPLE_ON = true;
window.AM_SHOP_SAMPLES = [
  { id:"sample-ip15p-256-a", model:"iphone-15-pro", cap:256, grade:"A",
    color:"내추럴 티타늄", price:1090000, batt:94, warranty:30,
    parts:["본체","충전 케이블"],
    check:["전원","액정","카메라","스피커","버튼","충전","통화"],
    note:"가까이 봐야 보이는 잔기스가 측면에 있습니다. 액정과 후면은 깨끗합니다." },
  { id:"sample-ip14-128-b", model:"iphone-14", cap:128, grade:"B",
    color:"미드나이트", price:620000, batt:86, warranty:30,
    parts:["본체"],
    check:["전원","액정","카메라","스피커","버튼","충전","통화"],
    note:"후면 하단에 눌림이 있습니다. 기능은 전부 정상입니다." },
  { id:"sample-s24u-512-s", model:"galaxy-s24-ultra", cap:512, grade:"S",
    color:"티타늄 그레이", price:1240000, batt:100, warranty:30,
    parts:["본체","충전 케이블","박스"],
    check:["전원","액정","카메라","스피커","버튼","충전","통화","S펜"],
    note:"개봉만 한 미사용 기기입니다." },
  { id:"sample-s23-256-a", model:"galaxy-s23", cap:256, grade:"A",
    color:"크림", price:540000, batt:91, warranty:30,
    parts:["본체","충전 케이블"],
    check:["전원","액정","카메라","스피커","버튼","충전","통화"],
    note:"보호 필름을 붙여 쓰던 기기로 액정에 흠이 없습니다." },
  { id:"sample-ipad-air11-128-a", model:"ipad-air-11-m2", cap:128, grade:"A",
    color:"스페이스 그레이", price:460000, batt:93, warranty:30,
    parts:["본체","충전 케이블"],
    check:["전원","액정","카메라","스피커","버튼","충전"],
    note:"잔기스 정도이고 화면은 깨끗합니다." },
  { id:"sample-watch-s9-s", model:"apple-watch-s9", cap:0, grade:"S",
    color:"미드나이트", price:390000, batt:98, warranty:30,
    parts:["본체","밴드","충전 케이블"],
    check:["전원","액정","버튼","충전","심박센서"],
    note:"거의 쓰지 않은 기기입니다." }
];

/* ─── 메인에 내는 브랜드 여섯 ─────────────────────────────────────
   2026-10-30 최종 지시서 §2-4 — "이 영역에는 아래 6개 브랜드만 노출한다 ·
   브랜드 순서는 위 순서를 유지한다 · 기존 DB에 다른 제조사가 있더라도
   삭제하지 않고 **메인 노출만** 위 6개로 제한한다."

   ⚠️⚠️ **새 제조사를 만든 것이 아닙니다.** `AM_MAKERS`(기기 카탈로그의
   제조사)를 한 글자도 안 건드렸습니다 — 이것은 `lifecycle.js`(단계) ·
   `journey.js`(여정) · `halls.js`(전문관)와 같은 **묶어 보는 틀**이고,
   하는 일은 "메인에 어느 여섯을 어느 차례로 낼까" 까지입니다.
   제조사 key 를 바꾸면 등록된 상품 · 매입 신청이 **조용히 어긋납니다.**

   ⚠️⚠️ **로고 파일이 Apple · Samsung 둘뿐입니다.** 나머지 넷은
   `AM_MAKER_LOGO` 에 값이 없어서 **로고 칸 자체를 안 그리고** 영문
   이름만 섭니다 (빈 액자를 깔지 않습니다 · 절대 규칙 2). 권한을
   확인한 파일을 주시면 거기 한 줄씩 적으시면 됩니다 — 화면은 한 줄도
   안 고칩니다. 필요한 파일과 경로는 `docs/` 보고서에 적어 두었습니다.

   ⚠️⚠️ **구글 · 화웨이 · 오포 · 샤오미는 지금 취급 모델이 0종입니다.**
   눌러서 가시는 `/shop?m=…` 이 **0건이라고 사실대로** 말합니다 —
   §2-4 가 "현재 상품이 없는 브랜드는 빈 상품을 만들어내지 않는다" 고
   직접 적은 자리입니다. 다루기 시작하시면 `js/data/devices.js` 의
   `AM_MAKERS` 와 `AM_MODELS` 에 적으세요 (⚠️ 용량은 **실제 출시된
   용량**만 — 짐작해 적으면 그 값으로 매입가가 계산됩니다).      */
window.AM_SHOP_BRANDS = [
  { key:"apple",   en:"Apple",   name:"애플"   },
  { key:"samsung", en:"Samsung", name:"삼성"   },
  { key:"google",  en:"Google",  name:"구글"   },
  { key:"huawei",  en:"Huawei",  name:"화웨이" },
  { key:"oppo",    en:"OPPO",    name:"오포"   },
  { key:"xiaomi",  en:"Xiaomi",  name:"샤오미" }
];

/* 그 브랜드로 지금 낼 수 있는 상품 수 — ⚠️ **세는 값**입니다.
   손으로 적으면 상품을 올릴 때마다 한쪽만 고치게 됩니다.          */
/* ⚠️⚠️ 둘째 인자가 true 면 **예시를 뺀 실제 재고**만 셉니다.
   메인의 브랜드 칸이 그쪽입니다 — 예시를 세면 첫 화면에
   **없는 재고를 "4대" 로** 적는 것이고, 그것이 §0-8 이 직접
   금지한 "임의의 매장 수 · 거래 건수 생성" 입니다 (절대 규칙 1).
   ⚠️ /shop 목록 화면은 예시를 딱지와 함께 내는 자리라 그대로입니다. */
window.amShopBrandN = function(key, real){
  return (typeof window.amShopList === "function")
    ? window.amShopList({ maker:key, real:!!real }).length : 0;
};

/* ─── /shop 거르개의 제조사 축 — ⚠️⚠️ **한 곳입니다** ───────────────
   2026-11-01 — 재서 고쳤습니다.

   메인 브랜드 카드는 `AM_SHOP_BRANDS`(여섯)를 읽고 `/shop?mk=<key>`
   로 보내는데, `/shop` 의 제조사 칩은 `AM_MAKERS`(애플 · 삼성 ·
   기타 **셋**)를 읽고 있었습니다. 그래서 **구글 · 화웨이 · OPPO ·
   샤오미 카드를 누르면 아무 칩도 안 켜졌습니다** — 거르개는 실제로
   걸리는데(카드 0장) 손님은 **자기가 거른 줄 모릅니다.** 메인에서
   그 카드를 누르고 온 분께는 "안 눌린 건가" 로 읽힙니다.
   브라우저로 여섯을 눌러 보고 알았습니다 (링크 검사는 통과합니다 —
   주소가 열리기는 하니까요).

   ⚠️⚠️ **`AM_MAKERS` 를 늘려서 맞추지 않았습니다.** 그쪽은 **기기
   DB 의 제조사 축**이라, 취급 모델이 0종인 넷을 넣으면 `/sell` 의
   모델 고르개에 **고를 것이 없는 제조사**가 생깁니다 (§30-7 "클릭해도
   작동하지 않는" 자리). 기기를 올리시는 날 거기에 넣으시면 됩니다.

   ⚠️ `기타`(etc)는 `AM_SHOP_BRANDS` 에 없습니다 — 거기는 **로고
   카드를 내는 목록**이고 "기타" 는 로고가 없습니다. 거르개에서는
   받아 주어야 해서 `AM_MAKERS` 에서 그 한 줄만 가져옵니다.        */
window.amShopMakers = function(){
  var B = window.AM_SHOP_BRANDS || [], M = window.AM_MAKERS || [], out = [], seen = {};
  B.forEach(function(b){ if(!seen[b.key]){ seen[b.key] = 1; out.push({ key:b.key, name:b.name }); } });
  M.forEach(function(m){ if(!seen[m.key]){ seen[m.key] = 1; out.push({ key:m.key, name:m.name }); } });
  return out;
};

/* ─── 소식과 혜택 ─────────────────────────────────────────────────
   2026-10-30 최종 지시서 §2-7 — "실제 게시된 콘텐츠만 표시한다.
   게시물이 없는 경우 임의의 날짜나 가짜 기사를 생성하지 않는다.
   관리자가 게시물을 등록하면 자동으로 메인에 반영되도록 한다."

   ⚠️⚠️ **비어 있는 것이 맞습니다.** 시안의 넉 장(중고폰 시세 업데이트 ·
   고장폰도 판매 가능 · 수리 서비스 오픈 · 해외 수출 파트너 모집)과
   날짜(2024.10.28 …)는 **디자인 예시**입니다 — 적는 순간 없는 소식을
   지어내는 것이고 표시 · 광고의 공정화에 관한 법률 제3조입니다.
   ⚠️ 0건이면 **구간째 안 나옵니다** (자리표시자를 찍지 않습니다 ·
   절대 규칙 2). 한 줄이라도 적으시면 **코드를 한 줄도 안 고치고**
   시안의 넉 장짜리 구간이 섭니다.

   적으실 때의 모양 —
     { id:"price-2026-10", title:"중고폰 시세 업데이트",
       lead:"최신 매입 시세를 확인하세요", at:"2026-10-28",
       to:"/guide", ph:"" }
   ⚠️ `at` 은 **실제로 올린 날**입니다. "n일 전" 같은 상대 표기를 쓰지
   마세요 — 캐시된 화면에서 틀린 날부터 거짓말이 됩니다.
   ⚠️ `to` 는 **실제로 열리는 주소**라야 합니다 (`checkPwNews()` 가
   빌드마다 봅니다). `ph` 는 `js/data/photos.js` 의 자리 이름이고,
   비우면 분류 아이콘이 그 자리를 지킵니다.                         */
window.AM_PW_NEWS = [];

/* ─── 가격 구간 ───────────────────────────────────────────────────
   ⚠️⚠️ **아래를 열고 위를 닫습니다** (`amInRange()` · min < n ≤ max).
   둘 다 닫으면 60만원짜리가 "40~60" 과 "60~80" **두 칸에 다**
   걸립니다 — 이 저장소가 보증금 · 권리금에서 겪은 자리입니다.
   ⚠️ 윗값만 있는 칸이 하나뿐이라야 합니다 (둘이면 0 이 두 칸에).  */
window.AM_SHOP_PRICE = [
  { k:"a", name:"40만원 이하",   max:400000 },
  { k:"b", name:"40~60만원",     min:400000, max:600000 },
  { k:"c", name:"60~80만원",     min:600000, max:800000 },
  { k:"d", name:"80~100만원",    min:800000, max:1000000 },
  { k:"e", name:"100만원 이상",  min:1000000 }
];

/* ════════ 읽는 함수 ════════════════════════════════════════════ */

/* 실제 상품이 있는가 — 화면이 이것 하나만 봅니다 */
window.amShopReady = function(){ return (window.AM_PRODUCTS || []).length > 0; };

/* ─── 값이 그 구간에 드는가 — ⚠️⚠️ **한 곳입니다** ──────────────────
   2026-11-01 — 되살렸습니다. 2026-10-31 에 창업 · 폐업
   `js/data/market.js` 를 지울 때 **이 함수가 같이 날아갔습니다** —
   `/shop` 의 가격 거르개가 이것을 부르는 유일한 자리인데, 가격 칩을
   누르면 `TypeError: window.amInRange is not a function` 으로
   **목록이 통째로 안 그려졌습니다** (거르개 줄까지 사라지고 0건).
   거르개를 안 걸면 안 터지니 다른 길로는 표가 안 납니다 —
   `/shop?pr=a` 를 눌러 보고 알았습니다.

   ⚠️⚠️ **아래는 열고 위는 닫습니다** (min < n ≤ max).
   둘 다 닫으면 60만원짜리가 "40~60만원" 과 "60~80만원"
   **두 칸에 다 걸립니다** — 손님이 60~80을 골랐는데 60짜리가 나오면
   그때부터 거르개를 안 씁니다. 이 방향이라야 딱지도 맞습니다 —
   "40만원 이하" 는 400,000 을 담고 "40~60만원" 은 안 담습니다.

   ⚠️ **값을 안 적은 상품은 어느 칸에도 안 걸립니다** (`val == null`).
   조건을 건 손님에게 "모르는 것" 을 섞어 보내면 헛걸음입니다 —
   ⚠️ 반대로 `0` 은 값입니다.                                        */
window.amInRange = function(val, opt){
  if(val == null || !opt) return false;
  var n = Number(val);
  if(!isFinite(n)) return false;
  if(opt.min != null && n <= opt.min) return false;
  if(opt.max != null && n >  opt.max) return false;
  return true;
};
/* 예시를 낼 자리인가 — ⚠️ 실제 상품이 생기면 저절로 false 입니다 */
window.amShopSampleOn = function(){
  return !window.amShopReady() && window.AM_SHOP_SAMPLE_ON !== false &&
         (window.AM_SHOP_SAMPLES || []).length > 0;
};

/* 한 건 — ⚠️ 예시와 실제를 **갈라서** 돌려줍니다.
   돌려주는 것은 { it, sample } 이고, 화면이 `sample` 을 보고
   구매 단추를 낼지 예시 안내를 낼지 정합니다. 한 덩이로 합치면
   그 깃발을 안 보는 코드가 생기는 날 예시가 상품으로 팔립니다. */
window.amShopOne = function(id){
  var real = (window.AM_PRODUCTS || []).filter(function(x){ return x.id === id; })[0];
  if(real) return { it:real, sample:false };
  var sp = (window.AM_SHOP_SAMPLES || []).filter(function(x){ return x.id === id; })[0];
  if(sp && window.amShopSampleOn()) return { it:sp, sample:true };
  return null;
};

/* 목록 — 거르개와 찾기를 거친 것
   ⚠️⚠️ **실제 상품이 있으면 예시를 섞지 않습니다.** 섞으면 손님이
   살 수 있는 것과 없는 것이 한 줄에 나란히 섭니다.                */
window.amShopList = function(f){
  f = f || {};
  /* ⚠️⚠️ `real:true` 는 **예시를 아예 안 섞는다**는 뜻입니다 —
     메인이 그쪽으로 부릅니다 (§2-5 "실제 재고 데이터 기준" · §0-8). */
  var base = (f.real || window.amShopReady()) ? (window.AM_PRODUCTS || [])
           : (window.amShopSampleOn() ? (window.AM_SHOP_SAMPLES || []) : []);
  var q = String(f.q || "").trim().toLowerCase();
  var qn = q.replace(/\s+/g, "");
  return base.filter(function(p){
    var md = (typeof amModel === "function") ? amModel(p.model) : null;
    if(f.kind && (!md || md.kind !== f.kind)) return false;
    if(f.maker && (!md || md.maker !== f.maker)) return false;
    if(f.grade && p.grade !== f.grade) return false;
    if(f.price){
      var r = (window.AM_SHOP_PRICE || []).filter(function(x){ return x.k === f.price; })[0];
      /* ⚠️ 없는 key 는 거르개를 **그냥 안 겁니다** — 밖으로 퍼진
         옛 링크가 조용히 0건을 내지 않게요. */
      if(r && !window.amInRange(p.price, r)) return false;
    }
    if(qn){
      /* ⚠️ 손님은 띄어쓰기를 안 합니다 ("아이폰15") — 지워서 봅니다 */
      var hay = [(md ? md.name : ""), p.color || "",
                 (typeof amMakerName === "function" && md ? amMakerName(md.maker) : ""),
                 (typeof amKindName === "function" && md ? amKindName(md.kind) : "")
                ].join(" ").toLowerCase().replace(/\s+/g, "");
      if(hay.indexOf(qn) < 0) return false;
    }
    return true;
  });
};

/* 화면에 내는 이름 — ⚠️ 모델 key 를 날것으로 찍지 마세요
   (포트폴리오가 `gyeonggi` 를 그대로 찍었던 그 자리입니다). */
window.amShopName = function(p){
  var md = (typeof amModel === "function") ? amModel(p.model) : null;
  var cap = p.cap ? (p.cap >= 1024 ? (p.cap/1024)+"TB" : p.cap+"GB") : "";
  return [(md ? md.name : p.model), cap].filter(Boolean).join(" ");
};

/* ─── 메인 02 핵심 서비스 여섯 · 05 안내 배너 셋 (§2-3 · §2-6) ───
⚠️⚠️ **js/pages/* 에 두면 크롤러에서 빠집니다.**
   build-pages.js 는 js/data 만 읽어서, 거기 있으면 그 값이
   undefined 라 **크롤러 본문에서 구간이 에러 없이 조용히 빠집니다**
   (이 저장소가 MAIN_STEPS 로 겪은 자리입니다 — 실제로 두 구간이
   제목만 나가고 목록이 통째 빠졌습니다). 그래서 여기입니다. */

/* ⚠️ `sm` 은 **폰 빠른 메뉴 다섯**이 쓰는 짧은 이름입니다 (시안 §9).
   거기는 한 칸이 73px 이라 "기업 대량 매입" 이 세 줄로 쪼개집니다 —
   뜻은 그대로 두고 글자 수만 줄였습니다 (재 보고 정했습니다).
   ⚠️ 없으면 `nm` 이 그대로 섭니다. */
/* ⚠️⚠️ 2026-10-31 지시서 §2 — **제목 · 설명 · 차례가 확정 시안 그대로**
   입니다. `d` 는 **두 줄**이고 (시안의 설명이 두 줄입니다) 크롤러
   본문은 그 둘을 가운뎃점으로 이어 냅니다 — 한 곳에 적어야 화면과
   크롤러가 어긋나지 않습니다 (이 저장소가 열두 번 겪은 자리).
   ⚠️ `ph` 는 `WOW_PHOTO_SLOTS` 의 자리 이름입니다. 사진이 없으면
   `PwServices()` 가 컬러 아이콘으로 돌아갑니다 (빈 액자 금지).
   ⚠️ `sm` 은 **폰 빠른 메뉴 다섯**이 쓰는 짧은 이름입니다 — 한 칸이
   73px 이라 긴 이름은 세 줄로 쪼개집니다. */
/* ⚠️⚠️ **소비자 서비스는 정확히 다섯입니다** (C안 §6 — "메인페이지
   핵심 서비스는 정확히 5개다 … B2B 도매 · 경매, 기업 대량 매입, 해외
   수출은 이 5개 서비스 카드에 넣지 않는다").
   ⚠️⚠️ **셋을 지운 것이 아닙니다** — `/bid` · `/biz?t=corp` ·
   `/biz?t=export` 는 그대로 열리고, **사업자 전용관**(`/business`)의
   `AM_BIZ_HALL` 이 받습니다 (§9 · §10). 메인에서는 딥 브라운 배너
   하나로 그 화면으로 보냅니다 — 빼면 그 셋이 사이트 안에서 길을
   잃습니다 (이 저장소가 묶음 주소 여섯으로 겪은 자리).
   ⚠️ `svc-b2b` · `svc-corp` · `svc-export` **사진 파일은 지우지
   마세요** — `js/data/photos.js` 의 자리가 그대로 있고 사업자 전용관
   쪽에 붙일 자산입니다.

   ⚠️⚠️ **`내 폰 시세` · `알뜰폰 · 선불폰` 은 사진이 없습니다.** C안 §7
   이 다섯 장을 적었는데 권한이 확인된 파일이 **셋**입니다 — 없으면
   `PwServices()` 가 `hasPhoto()` 를 보고 **컬러 아이콘**으로 섭니다
   (빈 액자를 깔지 않습니다 · 절대 규칙 2). 파일을 주시면
   `js/data/photos.js` 에 자리 두 줄만 더하면 코드를 한 줄도 안 고치고
   사진으로 바뀝니다 (§17 보고 대상).
   ⚠️ 그래서 `ia` 는 **장식이 아니라 실제로 그려지는 값**입니다 —
   `iconArt()` 에 없는 이름을 적으면 **빈 문자열**이 돌아와 타일이
   덩그러니 빕니다 (에러도 404 도 없습니다). `sim` 은 그래서 새로
   그렸습니다. */
window.PW_SVC5 = [
  { to:"/sell",   ia:"mobile", ph:"svc-sell",   nm:"내 폰 판매",
    sm:"내 폰 팔기", d:["최고가 경쟁견적", "지금 바로 판매하세요"] },
  { to:"/shop",   ia:"bag",    ph:"svc-buy",    nm:"중고폰 구매",
    d:["검수된 중고폰을", "안전하게 구매하세요"] },
  { to:"/repair", ia:"repair", ph:"svc-repair", nm:"수리 서비스",
    d:["정확한 견적과", "빠른 수리 접수"] },
  /* ⚠️⚠️ **금액을 약속하는 글을 적지 마세요.** 매입 기준가가 0건이라
     (`amBuyReady()`) `/price` 는 금액을 **아예 안 냅니다** — "시세
     확인" 이라고 적으면 눌러 오신 분이 숫자를 찾다가 못 찾습니다
     (절대 규칙 5 · §8 "허위 가격을 표시하지 않는다"). 기준가를
     넣으시면 그날 이 두 줄을 되돌리시면 됩니다. */
  { to:"/price",  ia:"chart",  ph:"svc-price",  nm:"내 폰 시세",
    sm:"내 폰 시세", d:["기종과 상태에 따라", "값이 어떻게 갈리는지"] },
  /* ⚠️⚠️ **요금제 · 혜택을 적지 마세요.** 통신사 제휴가 **0곳**이고
     §11 이 "제휴가 없는 통신사나 실제 제공하지 않는 요금제 · 혜택은
     노출하지 않는다" 고 직접 적었습니다. 지금 하는 일은 **안내와
     문의 접수**까지입니다. */
  { to:"/mvno",   ia:"sim",    ph:"svc-mvno",   nm:"알뜰폰 · 선불폰",
    sm:"알뜰폰",    d:["유심 · eSIM · 개통", "안내와 문의 접수"] }
];


window.PW_BAN3 = [
  { to:"/guide",        ia:"shield", cta:"검수 기준 보기",
    nm:"검수 인증 중고폰",   d:"꼼꼼한 검수로 더 안전한 중고폰" },
  { to:"/repair",       ia:"repair", cta:"수리 접수하기",
    nm:"수리 vs 판매, 어떤 게 유리할까?", d:"수리비와 매입가를 같이 보고 고르세요" },
  { to:"/biz?t=corp",   ia:"tower",  cta:"상담 신청하기",
    nm:"기업 · 법인 대량 매입", d:"회사 보유 단말기, 한 번에 정리하세요" }
];

