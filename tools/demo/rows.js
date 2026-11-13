/* ════════════════════════════════════════════════════════════════════
   시연용 예시 줄 — 시연 서버가 **메모리에만** 들고 있는 가짜 PostgREST
   자료입니다. 운영 DB 에 넣는 길이 없습니다.

   ⚠️⚠️ 값 · 키는 전부 **저장소의 키 묶음**(`js/data/*.js` · 마이그레이션의
   check)에서 가져온 것입니다 — 이 저장소가 「가짜 자료가 DB 가 안 받는
   값이었습니다」를 **일곱 번** 밟은 자리라, `tools/demo/check.js` 가
   돌릴 때마다 맞춰 봅니다.
   ⚠️ 날짜는 돌리는 날 기준입니다.
   ════════════════════════════════════════════════════════════════════ */
var D = require("./data.js");
var kst = D.kst, ago = D.ago, ph = D.ph;

/* uuid 꼴이 필요한 자리가 있습니다 — `js/listing.js` · `js/career.js` 가
   상세 주소의 꼴을 보고 가릅니다(아니면 목록이 그려집니다). */
function uid(n){
  var s = String(n);
  while(s.length < 12) s = "0" + s;
  return "dddddddd-0000-4000-8000-" + s;
}

/* ── ① 골프장 부킹 — 업체가 올린 티타임 ──────────────────────────
   ⚠️ `tel` 은 업체가 **공개를 고르고 적은** 예약 문의 번호 칸입니다.
   지어낸 번호를 넣으면 엉뚱한 분께 전화가 가므로 **안내 글**을 넣습니다. */
/* 골프장 사진 (0081) — ⚠️ 꼴을 DB 가 다시 봅니다
   (`course_photo_ck` — `course/<uuid>/<이름>`). 시연 자료도 그 꼴을
   지킵니다 — 안 지키면 **말쒗한 화면을 고장으로** 보게 됩니다. */
var CN = 0;
function cph(k){ CN++; return "course/" + uid(70000 + CN) + "/" + k + ".jpg"; }

var TEL = "시연용 — 실제 번호가 아닙니다";
var TEE = [
  { id:uid(101), provider_id:"dm-bk-1", provider_name:"(예시) 수도권 부킹센터",
    kind:"booking", region:"gyeonggi", course:"(예시) 그린밸리CC 신코스",
    play_at:kst(1), tee_at:"06:40:00", holes:18, slots:4, green_fee:148000,
    tel:TEL, note:"카트비 · 캐디피는 포함되는지 업체에 확인해 주세요",
    left_n:2, photo:cph("booking-1") },
  { id:uid(102), provider_id:"dm-bk-1", provider_name:"(예시) 수도권 부킹센터",
    kind:"booking", region:"gyeonggi", course:"(예시) 그린밸리CC 구코스",
    play_at:kst(1), tee_at:"11:20:00", holes:18, slots:4, green_fee:175000,
    tel:TEL, note:"", left_n:4, photo:cph("booking-2") },
  { id:uid(103), provider_id:"dm-bk-1", provider_name:"(예시) 수도권 부킹센터",
    kind:"booking", region:"seoul", course:"(예시) 한강뷰CC",
    play_at:kst(2), tee_at:"07:10:00", holes:18, slots:3, green_fee:235000,
    tel:TEL, note:"주중 조인 가능", left_n:1, photo:cph("booking-3") },
  { id:uid(104), provider_id:"dm-bk-1", provider_name:"(예시) 수도권 부킹센터",
    kind:"booking", region:"incheon", course:"(예시) 서해솔밭CC",
    play_at:kst(2), tee_at:"13:50:00", holes:18, slots:4, green_fee:92000,
    tel:TEL, note:"오후 티오프", left_n:4, photo:cph("booking-4") },
  { id:uid(105), provider_id:"dm-bk-2", provider_name:"(예시) 영남 부킹하우스",
    kind:"booking", region:"busan", course:"(예시) 해운대오션CC",
    play_at:kst(3), tee_at:"06:20:00", holes:18, slots:4, green_fee:198000,
    tel:TEL, note:"", left_n:2, photo:cph("booking-5") },
  { id:uid(106), provider_id:"dm-bk-2", provider_name:"(예시) 영남 부킹하우스",
    kind:"booking", region:"gyeongnam", course:"(예시) 남강레이크CC",
    play_at:kst(3), tee_at:"09:00:00", holes:18, slots:4, green_fee:132000,
    tel:TEL, note:"", left_n:3, photo:cph("booking-6") },
  { id:uid(107), provider_id:"dm-bk-2", provider_name:"(예시) 영남 부킹하우스",
    kind:"booking", region:"daegu", course:"(예시) 팔공산뷰CC",
    play_at:kst(4), tee_at:"15:40:00", holes:9, slots:4, green_fee:68000,
    tel:TEL, note:"9홀 · 야간 조명", left_n:4, photo:cph("booking-7") },
  { id:uid(108), provider_id:"dm-bk-1", provider_name:"(예시) 수도권 부킹센터",
    kind:"booking", region:"gangwon", course:"(예시) 설악하이랜드CC",
    play_at:kst(4), tee_at:"08:30:00", holes:18, slots:4, green_fee:168000,
    tel:TEL, note:"", left_n:2, photo:cph("booking-8") },
  { id:uid(109), provider_id:"dm-bk-1", provider_name:"(예시) 수도권 부킹센터",
    kind:"booking", region:"chungnam", course:"(예시) 금강힐스CC",
    play_at:kst(5), tee_at:"07:50:00", holes:18, slots:4, green_fee:118000,
    tel:TEL, note:"", left_n:4, photo:cph("booking-9") },
  { id:uid(110), provider_id:"dm-bk-2", provider_name:"(예시) 영남 부킹하우스",
    kind:"booking", region:"jeonnam", course:"(예시) 남도바다CC",
    play_at:kst(5), tee_at:"12:10:00", holes:18, slots:4, green_fee:104000,
    tel:TEL, note:"", left_n:1, photo:cph("booking-10") },
  { id:uid(111), provider_id:"dm-bk-1", provider_name:"(예시) 수도권 부킹센터",
    kind:"booking", region:"jeju", course:"(예시) 한라오름CC",
    play_at:kst(6), tee_at:"09:40:00", holes:18, slots:4, green_fee:265000,
    tel:TEL, note:"제주 · 숙박 연계 가능", left_n:3, photo:cph("travel-3") },
  /* ⚠️ **티오프 시각을 아직 안 정한 자리** — 시간대로 좁히면 빠집니다
     (0060 이 적어 둔 자리이고, 화면이 그 사실을 0건 안내에서 말합니다). */
  { id:uid(112), provider_id:"dm-bk-1", provider_name:"(예시) 수도권 부킹센터",
    kind:"booking", region:"gyeonggi", course:"(예시) 북한산뷰CC",
    play_at:kst(6), tee_at:null, holes:18, slots:4, green_fee:155000,
    tel:TEL, note:"티오프 시각은 확정되면 알려 드립니다", left_n:4,
    photo:cph("booking-11") },
  /* ⚠️ **그린피를 아직 안 올린 자리** — 가격으로 좁히면 빠집니다 */
  { id:uid(113), provider_id:"dm-bk-2", provider_name:"(예시) 영남 부킹하우스",
    kind:"booking", region:"ulsan", course:"(예시) 울산바다CC",
    play_at:kst(7), tee_at:"10:30:00", holes:18, slots:4, green_fee:null,
    /* ⚠️ **사진이 없는 자리** — 아이콘 타일로 돌아가는 갈래도
       같이 보셔야 합니다(남의 사진을 깔지 않습니다 · 0068 · 0081) */
    tel:TEL, note:"그린피는 업체에 확인해 주세요", left_n:4, photo:null }
];

/* ── ② 골프 조인 — 회원이 연 자리 ────────────────────────────────
   ⚠️ 조인에는 업체가 없습니다 — 그래서 **사진 칸이 없습니다**(아이콘
   타일). 시안에는 사진이 있지만 담을 자리가 없어 지어내지 않습니다. */
var JOIN = [
  { id:uid(201), title:"주말 아침 같이 치실 분 한 분", body:"한 자리 남았습니다. 편하게 치실 분이면 좋겠습니다.",
    region:"gyeonggi", play_at:kst(2), course:"(예시) 그린밸리CC", booked:true,
    tee:"아침", need:1, budget:150000, left_n:1, level:"beginner" },
  { id:uid(202), title:"평일 조인 두 자리", body:"오전 라운드입니다. 카트비 각자 부담입니다.",
    region:"seoul", play_at:kst(3), course:"(예시) 한강뷰CC", booked:true,
    tee:"오전", need:2, budget:230000, left_n:2, level:"any" },
  { id:uid(203), title:"초보 환영 · 천천히 치실 분", body:"연습장만 다니다 처음 나가시는 분도 괜찮습니다.",
    region:"incheon", play_at:kst(4), course:"(예시) 서해솔밭CC", booked:true,
    tee:"오후", need:3, budget:95000, left_n:3, level:"beginner" },
  { id:uid(204), title:"싱글 분들 모십니다", body:"스코어 신경 쓰시는 분들끼리 치고 싶습니다.",
    region:"gyeonggi", play_at:kst(5), course:"(예시) 북한산뷰CC", booked:false,
    tee:"이른 아침", need:2, budget:180000, left_n:2, level:"low" },
  { id:uid(205), title:"부산 주말 조인 한 자리", body:"바다 보이는 코스입니다.",
    region:"busan", play_at:kst(5), course:"(예시) 해운대오션CC", booked:true,
    tee:"아침", need:1, budget:200000, left_n:1, level:"mid" },
  { id:uid(206), title:"대구 야간 9홀 같이 치실 분", body:"퇴근 뒤 가볍게 9홀 돌겠습니다.",
    region:"daegu", play_at:kst(6), course:"(예시) 팔공산뷰CC", booked:true,
    tee:"야간", need:3, budget:70000, left_n:3, level:"any" },
  { id:uid(207), title:"제주 1박 2일 라운드 동반", body:"숙박은 각자 잡고 라운드만 같이 합니다.",
    region:"jeju", play_at:kst(8), course:"(예시) 한라오름CC", booked:false,
    tee:"오전", need:2, budget:260000, left_n:2, level:"mid" },
  /* ⚠️ **실력을 안 고르신 자리** — 그 조건으로 좁히면 빠지고 딱지도
     안 붙습니다(「무관」을 지어 적지 않습니다). */
  { id:uid(208), title:"강원 단풍 라운드 같이 가요", body:"차 같이 타고 가실 분이면 더 좋습니다.",
    region:"gangwon", play_at:kst(9), course:"(예시) 설악하이랜드CC", booked:false,
    tee:"오전", need:3, budget:null, left_n:3, level:null }
];

/* ── ③ 중고 골프장터 ────────────────────────────────────────────── */
function L(n, o){
  o.id = uid(300 + n);
  o.ask_n = o.ask_n || 0;
  o.seller = o.seller || "김**";
  o.state = o.state || "open";
  o.photo_n = o.photo_n || (o.shots ? o.shots.length : 0);
  o.thumb = o.shots ? ("lst/" + o.id + "/photo/" + o.shots[0] + ".jpg") : null;
  return o;
}
var LIST = [
  L(1,  { sub:"us-driver", region:"seoul",   ship:true,  title:"(예시) 드라이버 10.5도 헤드커버 포함",
          body:"작년에 사서 열 번 정도 쳤습니다. 페이스에 잔기스 조금 있습니다.",
          price:350000, cond:"like", brand:"타이틀리스트", model:"TSR2",
          flex:"s", hand:"right", created_at:ago(2), shots:["used-1","used-2","used-3"], ask_n:3 }),
  L(2,  { sub:"us-iron", region:"gyeonggi", ship:true, title:"(예시) 연습용 아이언 세트 5~P",
          body:"입문용으로 쓰던 세트입니다. 그립은 새로 감았습니다.",
          price:280000, cond:"good", brand:"미즈노", model:"JPX 921",
          flex:"r", hand:"right", created_at:ago(5), shots:["used-4","used-5"], ask_n:1 }),
  L(3,  { sub:"us-wedge", region:"busan", ship:false, title:"(예시) 웨지 52도 · 56도 두 자루",
          body:"그루브 살아 있습니다. 직거래만 합니다.",
          price:120000, cond:"good", brand:"클리브랜드", model:"RTX 6",
          flex:"s", hand:"right", created_at:ago(9), shots:["used-6"] }),
  L(4,  { sub:"us-putter", region:"seoul", ship:true, title:"(예시) 블레이드 퍼터 34인치",
          body:"헤드커버 같이 드립니다.",
          price:210000, cond:"like", brand:"오디세이", model:"White Hot OG",
          flex:null, hand:"right", created_at:ago(14), shots:["used-7","used-8"], ask_n:2 }),
  L(5,  { sub:"us-wood", region:"incheon", ship:true, title:"(예시) 3번 우드 15도",
          body:"바닥 사용감 있습니다. 사진 보시고 문의 주세요.",
          price:160000, cond:"fair", brand:"테일러메이드", model:"Stealth 2",
          flex:"sr", hand:"right", created_at:ago(20), shots:["used-9"] }),
  L(6,  { sub:"us-utility", region:"gyeonggi", ship:true, title:"(예시) 유틸리티 4번 22도",
          body:"왼손잡이용입니다.",
          price:140000, cond:"good", brand:"핑", model:"G430",
          flex:"r", hand:"left", created_at:ago(26), shots:["used-10"] }),
  L(7,  { sub:"us-set", region:"daegu", ship:false, title:"(예시) 입문 풀세트 (백 포함)",
          body:"골프 시작하시는 분께 넘깁니다. 백 · 커버 다 있습니다.",
          price:520000, cond:"fair", brand:"기타", model:"",
          flex:"r", hand:"right", created_at:ago(32), shots:["used-11","used-12"], ask_n:5 }),
  L(8,  { sub:"us-shaft", region:"seoul", ship:true, title:"(예시) 드라이버 샤프트 S 플렉스",
          body:"팁 안 잘랐습니다.",
          price:90000, cond:"like", brand:"기타", model:"Ventus Blue 6",
          flex:"s", hand:null, created_at:ago(38), shots:["used-13"] }),
  L(9,  { sub:"us-bag", region:"gyeonggi", ship:false, title:"(예시) 캐디백 · 보스턴백 세트",
          body:"한 시즌 썼습니다.",
          price:90000, cond:"good", brand:"기타", model:"",
          flex:null, hand:null, created_at:ago(44), shots:["used-14"], state:"done" }),
  L(10, { sub:"us-ball", region:"seoul", ship:true, title:"(예시) 로스트볼 A급 30개",
          body:"세척해서 보내 드립니다.",
          price:25000, cond:"good", brand:"브리지스톤", model:"",
          flex:null, hand:null, created_at:ago(50), shots:["used-15"] }),
  L(11, { sub:"us-wear", region:"incheon", ship:true, title:"(예시) 골프 바람막이 (여성 M)",
          body:"한 번 입었습니다.",
          price:60000, cond:"like", brand:"기타", model:"",
          flex:null, hand:null, created_at:ago(56), shots:["used-16"] }),
  L(12, { sub:"us-shoes", region:"gyeonggi", ship:true, title:"(예시) 골프화 265mm 스파이크리스",
          body:"사이즈가 안 맞아 내놓습니다.",
          price:75000, cond:"like", brand:"기타", model:"",
          flex:null, hand:null, created_at:ago(62), shots:["used-17"] }),
  L(13, { sub:"us-range", region:"busan", ship:false, title:"(예시) 퍼팅매트 3m",
          body:"집에서 쓰던 것입니다.",
          price:0, cond:"fair", brand:"기타", model:"",
          flex:null, hand:null, created_at:ago(68), shots:["used-18"] }),
  L(14, { sub:"us-acc", region:"seoul", ship:true, title:"(예시) 거리측정기 (레이저)",
          body:"배터리 새로 넣었습니다.",
          price:230000, cond:"good", brand:"기타", model:"",
          flex:null, hand:null, created_at:ago(74), shots:["used-19"], state:"reserved", ask_n:4 }),
  L(15, { sub:"us-gear", region:"gyeonggi", ship:true, title:"(예시) 스윙 연습기",
          body:"실내에서 쓸 수 있습니다.",
          price:45000, cond:"good", brand:"기타", model:"",
          flex:null, hand:null, created_at:ago(80), shots:["used-20"] }),
  /* ⚠️ **사진이 0장인 매물** — 아이콘 타일로 돌아가는 자리를 같이
     보셔야 합니다(남의 사진을 깔지 않습니다 · 0068). */
  L(16, { sub:"us-iron", region:"gwangju", ship:false, title:"(예시) 아이언 세트 (사진은 나중에 올리겠습니다)",
          body:"사진은 주말에 찍어 올리겠습니다.",
          price:300000, cond:"fair", brand:"스릭슨", model:"",
          flex:"r", hand:"right", created_at:ago(90) })
];

/* 매물 사진 줄 — `v_listing_photo_public` */
var LIST_PH = [];
LIST.forEach(function(r){
  (r.shots || []).forEach(function(k, i){
    LIST_PH.push({ listing_id:r.id, path:"lst/" + r.id + "/photo/" + k + ".jpg",
                   caption:"", ord:i });
  });
  delete r.shots;
});

/* ── ⑧ 골프 여행 ────────────────────────────────────────────────── */
function T(n, o){
  o.id = uid(400 + n);
  o.provider_id = o.provider_id || "dm-tr-1";
  o.provider_name = o.provider_name || "(예시) 골프여행 투어원";
  o.created_at = o.created_at || ago(24 * n);
  o.updated_at = o.created_at;
  o.photo_n = o.shots ? o.shots.length : 0;
  o.thumb = o.shots ? ("tr/" + o.id + "/photo/" + o.shots[0] + ".jpg") : null;
  return o;
}
var TRIP = [
  T(1, { scope:"abroad", dest:"jp", title:"(예시) 후쿠오카 3박 4일 · 3라운드",
         body:"공항 픽업 · 숙소 · 라운드 세 번이 들어 있습니다. 인솔자가 같이 갑니다.",
         nights:3, days:4, price_from:890000, price_note:"2인 1실 기준 · 항공료 별도",
         incl:"숙박 3박 · 그린피 3회 · 카트 · 공항 픽업", excl:"항공료 · 캐디피 · 식사",
         depart_kind:"dates", depart_from:null, depart_to:null,
         months:[kst(20).slice(0,7), kst(50).slice(0,7)], depart_next:kst(20),
         shots:["travel-1","travel-2"] }),
  T(2, { scope:"abroad", dest:"th", title:"(예시) 방콕 4박 5일 · 4라운드",
         body:"명문 코스 네 곳을 돕니다. 캐디피 포함입니다.",
         nights:4, days:5, price_from:1180000, price_note:"2인 1실 기준 · 항공료 별도",
         incl:"숙박 4박 · 그린피 4회 · 캐디피 · 카트", excl:"항공료 · 식사 · 개인 경비",
         depart_kind:"range", depart_from:kst(25), depart_to:kst(80),
         months:[kst(25).slice(0,7), kst(55).slice(0,7)], depart_next:kst(25),
         shots:["travel-4"] }),
  T(3, { scope:"home", dest:"jeju", title:"(예시) 제주 2박 3일 골프텔 패키지",
         body:"골프텔 숙박과 라운드 두 번입니다. 렌터카는 따로 잡으셔야 합니다.",
         nights:2, days:3, price_from:520000, price_note:"2인 1실 기준",
         incl:"숙박 2박 · 그린피 2회 · 조식", excl:"항공료 · 렌터카 · 캐디피",
         depart_kind:"range", depart_from:kst(3), depart_to:kst(120),
         months:[kst(3).slice(0,7), kst(35).slice(0,7)], depart_next:kst(3),
         provider_id:"dm-tr-2", provider_name:"(예시) 제주 골프텔 투어",
         shots:["travel-3","travel-5"] }),
  T(4, { scope:"abroad", dest:"vn", title:"(예시) 다낭 3박 5일 · 3라운드",
         body:"야간 라운드 한 번이 들어 있습니다.",
         nights:3, days:5, price_from:960000, price_note:"2인 1실 기준 · 항공료 별도",
         incl:"숙박 3박 · 그린피 3회 · 공항 픽업", excl:"항공료 · 캐디피",
         depart_kind:"none", depart_from:null, depart_to:null,
         months:[], depart_next:null,
         shots:["travel-6"] }),
  /* ⚠️ **값을 아직 안 올린 상품** — 가격으로 좁히면 빠집니다 */
  T(5, { scope:"home", dest:"gangwon", title:"(예시) 속초 1박 2일 라운드",
         body:"값은 인원에 따라 달라 상담으로 안내드립니다.",
         nights:1, days:2, price_from:null, price_note:"인원에 따라 다릅니다",
         incl:"숙박 1박 · 그린피 1회", excl:"교통 · 식사",
         depart_kind:"range", depart_from:kst(5), depart_to:kst(60),
         months:[kst(5).slice(0,7)], depart_next:kst(5) })
];
var TRIP_PH = [];
TRIP.forEach(function(r){
  (r.shots || []).forEach(function(k, i){
    TRIP_PH.push({ trip_id:r.id, path:"tr/" + r.id + "/photo/" + k + ".jpg",
                   caption:"", ord:i });
  });
  delete r.shots;
});
var TRIP_DATE = [];
TRIP.forEach(function(r){
  if(r.depart_kind !== "dates") return;
  [20, 34, 48, 62].forEach(function(d){
    TRIP_DATE.push({ trip_id:r.id, depart_on:kst(d), seats:8 });
  });
});

/* ── ⑨ 골프 인력 · 비즈니스 ─────────────────────────────────────── */
function J(n, o){
  o.id = uid(500 + n);
  o.created_at = o.created_at || ago(12 * n);
  o.apply_n = o.apply_n || 0;
  return o;
}
var JOB = [
  J(1, { kind:"hire", sub:"cr-coach", region:"seoul", title:"(예시) 실내 연습장 레슨 프로 모십니다",
         body:"주 5일 · 타석 레슨 위주입니다. 레슨비는 7:3 배분입니다.",
         pay:"기본급 + 레슨비 배분", terms:"4대보험 · 주 5일",
         role:"jr-coach", emp_type:"je-full", pay_type:"monthly", pay_min:3000000,
         close_at:kst(21), who:"김**", pro_name:"(예시) 강남 스윙랩", apply_n:4 }),
  J(2, { kind:"hire", sub:"cr-caddy", region:"gyeonggi", title:"(예시) 주말 캐디 모집",
         body:"주말만 근무하실 분 찾습니다. 숙소 제공됩니다.",
         pay:"식대 제공", terms:"숙소 제공 · 주말 근무",
         role:"jr-etc", emp_type:"je-part", pay_type:"per_round", pay_min:150000,
         close_at:kst(14), who:"이**", pro_name:null, apply_n:7 }),
  J(3, { kind:"seek", sub:"cr-coach", region:"gyeonggi", title:"(예시) 레슨 경력 6년 · 프로 자리 구합니다",
         body:"초보 · 주니어 레슨 경험이 많습니다. 분당 · 수원 쪽 원합니다.",
         pay:"", terms:"주 5일 희망",
         role:"jr-coach", emp_type:"je-full", pay_type:"negotiate", pay_min:null,
         close_at:null, who:"박**", pro_name:null }),
  J(4, { kind:"hire", sub:"cr-hire", region:"busan", title:"(예시) 골프샵 매니저 채용",
         body:"매장 운영과 고객 응대를 맡아 주실 분입니다.",
         pay:"성과급 별도", terms:"4대보험 · 주 5일 · 중식 제공",
         role:"jr-manage", emp_type:"je-full", pay_type:"annual", pay_min:36000000,
         close_at:kst(30), who:"최**", pro_name:"(예시) 부산 연습용품점", apply_n:2 }),
  J(5, { kind:"hire", sub:"cr-hand", region:"seoul", title:"(예시) 피팅 보조 구합니다",
         body:"그립 교체 · 샤프트 작업 보조입니다. 배우실 분 환영합니다.",
         pay:"교육 기간 중에도 같은 시급", terms:"주 3일 · 오후",
         role:"jr-fit", emp_type:"je-part", pay_type:"hourly", pay_min:13000,
         close_at:kst(10), who:"정**", pro_name:"(예시) 강남 클럽피팅랩", apply_n:1 }),
  J(6, { kind:"biz", sub:"cr-tieup", region:"gyeonggi", title:"(예시) 연습장 · 레슨 프로 제휴 찾습니다",
         body:"타석 스물네 개 연습장입니다. 상주 프로 두 분을 더 두고 싶습니다.",
         pay:"", terms:"배분 조건 협의",
         role:"jr-coach", emp_type:"je-free", pay_type:"negotiate", pay_min:null,
         close_at:null, who:"강**", pro_name:"(예시) 분당 그린실내연습장" }),
  J(7, { kind:"biz", sub:"cr-b2b", region:"seoul", title:"(예시) 골프용품 납품처 찾습니다",
         body:"매장 두 곳에 들어갈 볼 · 장갑 납품처를 찾습니다.",
         pay:"", terms:"월 단위 발주",
         role:"jr-sales", emp_type:"je-etc", pay_type:"negotiate", pay_min:null,
         close_at:null, who:"윤**", pro_name:"(예시) 송파 골프프라자" }),
  /* ⚠️ **조건을 안 적은 공고** — 급여 · 고용형태로 좁히면 빠집니다 */
  J(8, { kind:"seek", sub:"cr-caddy", region:"jeju", title:"(예시) 제주 캐디 일자리 찾습니다",
         body:"경력 3년입니다.",
         pay:"", terms:"",
         role:null, emp_type:null, pay_type:null, pay_min:null,
         close_at:null, who:"임**", pro_name:null })
];

/* ── ⑩ 골프 커뮤니티 ────────────────────────────────────────────── */
function C(n, o){
  o.id = uid(600 + n);
  o.created_at = o.created_at || ago(3 * n);
  o.updated_at = o.created_at;
  o.named = true;
  o.mine = false;
  o.guest = false;
  o.photo_n = o.shots ? o.shots.length : 0;
  o.thumb = o.shots ? ("cq/" + o.id + "/photo/" + o.shots[0] + ".jpg") : null;
  return o;
}
var CQ = [
  C(1,  { cat:"cm-open", title:"(예시) 처음 필드 나가는데 무엇부터 챙기면 좋을까요",
          body:"다음 주에 처음 라운드를 나갑니다. 공 몇 개 · 장갑 말고 또 뭘 챙겨야 할까요.",
          who:"새벽라운드", answer_n:3, view_n:142 }),
  C(2,  { cat:"cm-course", title:"(예시) 수도권 가성비 좋은 코스 추천 부탁드립니다",
          body:"주중 15만원 안쪽으로 괜찮은 곳 있을까요.",
          who:"그린지기", answer_n:5, view_n:318, shots:["community-1"] }),
  C(3,  { cat:"cm-lesson", title:"(예시) 레슨 몇 개월 받으면 100타 깨나요",
          body:"주 2회 받고 있는데 석 달째입니다.",
          who:"백돌이탈출", answer_n:4, view_n:256 }),
  C(4,  { cat:"cm-gear", title:"(예시) 드라이버 샤프트 R 에서 SR 로 바꿔도 될까요",
          body:"헤드스피드가 40 정도 나옵니다.",
          who:"장비병환자", answer_n:2, view_n:190, shots:["community-2"] }),
  C(5,  { cat:"cm-screen", title:"(예시) 스크린이랑 필드 거리가 많이 다른가요",
          body:"스크린에서는 7번으로 150 보내는데 필드에서는 안 됩니다.",
          who:"실내파", answer_n:6, view_n:402 }),
  C(6,  { cat:"cm-swing", title:"(예시) 슬라이스 교정 영상 봐주실 분",
          body:"그립을 바꿔 봤는데도 계속 오른쪽으로 휩니다.",
          who:"우슬라이스", answer_n:1, view_n:88, shots:["community-3"] }),
  C(7,  { cat:"cm-begin", title:"(예시) 골린이인데 연습장 고를 때 뭘 봐야 하나요",
          body:"집 근처에 세 곳이 있습니다.",
          who:"이제시작", answer_n:3, view_n:121 }),
  C(8,  { cat:"cm-tip", title:"(예시) 퍼팅 거리감 잡는 저만의 방법",
          body:"백스윙 크기를 시계 바늘로 외웠더니 편해졌습니다.",
          who:"퍼터장인", answer_n:2, view_n:233 }),
  C(9,  { cat:"cm-event", title:"(예시) 이번 달 동호회 월례회 후기",
          body:"열두 분 나오셨습니다. 날씨가 좋았습니다.",
          who:"총무입니다", answer_n:0, view_n:64, shots:["community-4"] }),
  C(10, { cat:"cm-club", title:"(예시) 수도권 주말 동호회 회원 모집",
          body:"월 1회 월례회를 합니다. 초보도 환영합니다.",
          who:"그린클럽", answer_n:4, view_n:177 }),
  C(11, { cat:"cm-women", title:"(예시) 여성 골퍼 의류 사이즈 질문",
          body:"브랜드마다 많이 다른가요.",
          who:"분당아이언", answer_n:2, view_n:95 }),
  C(12, { cat:"cm-ask", title:"(예시) 캐디피는 보통 얼마인가요",
          body:"수도권 기준으로 궁금합니다.",
          who:"궁금이", answer_n:3, view_n:310 })
];
var CA = [];
CQ.forEach(function(q, qi){
  var N = q.answer_n;
  for(var i = 0; i < N && i < 3; i++){
    CA.push({ id:uid(7000 + qi * 10 + i), q_id:q.id,
      who:["라운드왕","필드고수","연습벌레","클럽장"][i % 4], named:true,
      body:"(예시) 답변입니다 — 시연용으로 넣은 글이라 실제 조언이 아닙니다.",
      created_at:ago(2 + i), by_asker:false, mine:false });
  }
});
var CQ_PH = [];
CQ.forEach(function(q){
  (q.shots || []).forEach(function(k, i){
    CQ_PH.push({ id:uid(8000 + CQ_PH.length), q_id:q.id,
                 path:"cq/" + q.id + "/photo/" + k + ".jpg", caption:"",
                 created_at:q.created_at });
  });
  delete q.shots;
});

/* ── 구합니다 글 (마켓 · 여행 · 레슨 · 연습장 · 피팅) ──────────── */
function W(n, o){
  o.id = uid(900 + n);
  o.created_at = o.created_at || ago(6 * n);
  o.reply_n = o.reply_n || 0;
  return o;
}
var WANT = [
  W(1, { cat:"market", sub:"mk-club", region:"seoul", title:"(예시) 입문용 아이언 세트 찾습니다",
         body:"30만원 안쪽으로 보고 있습니다.", budget:300000, when_txt:"이번 달 안", reply_n:2 }),
  W(2, { cat:"market", sub:"mk-wear", region:"gyeonggi", title:"(예시) 여성 골프웨어 매장 추천 받습니다",
         body:"분당 근처로 찾습니다.", budget:null, when_txt:"", reply_n:1 }),
  W(3, { cat:"travel", sub:"tr-away", region:"jp", title:"(예시) 일본 3박 4일 골프 패키지 견적 받고 싶습니다",
         body:"네 명이서 갑니다. 11월~12월 중 아무 때나 됩니다.", budget:1000000,
         when_txt:"11월~12월", reply_n:3 }),
  W(4, { cat:"travel", sub:"tr-home", region:"jeju", title:"(예시) 제주 2박 3일 골프텔 알아봅니다",
         body:"부부 둘입니다.", budget:600000, when_txt:"다음 달", reply_n:0 }),
  W(5, { cat:"lesson", sub:"ls-solo", region:"seoul", title:"(예시) 주말에만 가능한 1:1 레슨 프로 찾습니다",
         body:"평일은 시간이 안 납니다.", budget:400000, when_txt:"주말", reply_n:2 }),
  W(6, { cat:"range", sub:"rg-in", region:"gyeonggi", title:"(예시) 24시간 여는 실내 연습장 있을까요",
         body:"야근이 잦습니다.", budget:null, when_txt:"", reply_n:1 }),
  W(7, { cat:"fitting", sub:"ft-shaft", region:"busan", title:"(예시) 샤프트 교체 공임 견적 받습니다",
         body:"드라이버 한 자루입니다.", budget:50000, when_txt:"이번 주", reply_n:0 })
];

module.exports = {
  v_teetime_open: TEE,
  v_join_open: JOIN,
  v_listing_open: LIST,
  v_listing_photo_public: LIST_PH,
  v_listing_fav: [],
  v_trip_open: TRIP,
  v_trip_photo_public: TRIP_PH,
  v_trip_date_public: TRIP_DATE,
  v_job_open: JOB,
  v_job_fav: [],
  v_cq_public: CQ,
  v_ca_public: CA,
  v_cq_photo_public: CQ_PH,
  v_wanted_open: WANT,
  v_ad_live: []
};
