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
  var base = window.amShopReady() ? (window.AM_PRODUCTS || [])
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
