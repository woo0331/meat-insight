#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   로그인해야 나오는 화면을 **찍어 봅니다** — /desk · /admin · /my

     node tools/shot-desk.js                 전부 (PC · 폰)
     node tools/shot-desk.js desk            이름에 그 글자가 든 장면만
     node tools/shot-desk.js --list          어떤 장면이 있는지만

   결과는 /tmp/shots-desk/<이름>.png 입니다.

   ⚠️⚠️⚠️ **왜 이 도구가 필요한가.** `/desk` · `/admin` · `/my` 의
   알맹이는 **로그인한 뒤에** 그려집니다. 그래서 —
     · `check-screens` · `check-a11y`  → **빈 상자**만 봅니다 (늘 초록)
     · `tools/shot.js`                → **빈 상자**만 찍습니다
   즉 0045~0052 로 만든 화면(문의함 · 조인 · 커뮤니티 · 인력 · 알림 ·
   사진 · 담당자)은 **아무도 한 번도 눈으로 본 적이 없습니다.**
   작업 기억이 두 곳에서 그 자리를 짚어 둡니다 — "도구는 이것을 못
   잡습니다. 가로로 밀리지도, 글자가 작지도, 대비가 낮지도 않습니다.
   **찍어 보고** 알았습니다."

   ⚠️⚠️ **흉내 장치는 `tools/_stub.js` 한 곳**입니다 — `test-desk.js`
   가 재는 길과 **같은 길**로 엽니다. 베껴 두면 찍는 화면과 재는
   화면이 조용히 달라집니다 (이 저장소가 세 번 겪은 자리입니다).

   ⚠️ **이건 보는 도구이지 검사가 아닙니다.** 통과 · 실패를 내지
   않으므로 `tools/ship.js` 에 **안 넣었습니다** — 사람이 열어 봐야
   뜻이 있습니다. 재는 것은 `tools/test-desk.js` 입니다.

   ⚠️ 가짜 자료는 **"사람이 볼 만한 값"** 입니다 (검사는 경계값을
   씁니다 — 섞으면 둘 다 어색해집니다). 그래도 **손님이 적은 글에
   태그를 하나 넣어 둡니다** — 날것으로 나가면 찍은 그림에 보입니다.
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require("playwright");
const { serve } = require("./_serve.js");
const { FAKE, stub } = require("./_stub.js");
const fs = require("fs"), path = require("path");

const OUT = "/tmp/shots-desk";

/* ── 가짜 자료 ──────────────────────────────────────────────────── */
const NOW = "2026-11-05T02:00:00Z";
const REQ = {
  id:"11111111-1111-1111-1111-111111111111", no:"G-261105-0007",
  side:"golf", cat:"lesson", state:"assigned", region:"gyeonggi",
  name:"홍길동", tel:"010-1234-5678", budget:"40만원 이내",
  memo:"드라이버 슬라이스를 고치고 싶습니다. 주말 오전이 좋습니다.",
  want_at:"2026-11-15", created_at:NOW, agree3rd_at:NOW
};
const ASG = { id:"aaaa1111-1111-1111-1111-111111111111",
  request_id:REQ.id, provider_id:"t-range", state:"accepted",
  created_at:NOW };
const ITEMS = [{ id:"it-1", request_id:REQ.id, service_id:"ls-solo",
                 qty:1, memo:"주 1회" }];
const QUOTE = { id:"qq-1", request_id:REQ.id, provider_id:"t-range",
  amount:400000, unit:"8회", state:"sent", memo:"타석 이용료 별도",
  created_at:NOW, provider:{ name:"성남 그린골프연습장" } };

/* ⚠️ 담당자 명단 — 업체 쪽은 **가려진 이름**이 옵니다 (보기가 가립니다) */
const STAFF_PV = [
  { who:"김일담", is_me:true,  joined_at:null },
  { who:"이**",   is_me:false, joined_at:"2026-10-20T01:00:00Z" },
  { who:"회원",   is_me:false, joined_at:null }
];
const STAFF_ADM = [
  { provider_id:"t-range", provider_name:"성남 그린골프연습장",
    account_id:"11111111-1111-1111-1111-111111111111",
    who:"김일담", joined_at:"2026-10-20T01:00:00Z" },
  { provider_id:"t-range", provider_name:"성남 그린골프연습장",
    account_id:"22222222-2222-2222-2222-222222222222",
    who:"이이담", joined_at:null },
  { provider_id:"t-fit", provider_name:"분당 피팅랩",
    account_id:"33333333-3333-3333-3333-333333333333",
    who:"박삼담", joined_at:"2026-11-01T01:00:00Z" }
];
const PVS = [
  { id:"t-range", name:"성남 그린골프연습장", state:"approved",
    listed:true, assignable:true, is_test:false, regions:["gyeonggi"],
    subs:["rg-in","rg-sim","ls-solo"], gu:"성남시 분당구" },
  { id:"t-fit", name:"분당 피팅랩", state:"approved", listed:true,
    assignable:true, is_test:false, regions:["gyeonggi"],
    subs:["ft-mend","ft-grip"] },
  { id:"t-none", name:"수원 스크린하우스", state:"approved",
    listed:false, assignable:true, is_test:false, regions:["gyeonggi"],
    subs:["rg-sim"] },
  { id:"t-wait", name:"용인 골프아카데미", state:"pending",
    listed:false, assignable:false, is_test:false, regions:["gyeonggi"],
    subs:["ls-solo"] }
];
const APS = [
  { id:"ap-1", no:"A-261104-0003", biz_name:"일산 인도어",
    person:"최사장", tel:"010-2222-3333", region:"gyeonggi",
    subs:["rg-in"], state:"new", created_at:NOW },
  { id:"ap-2", no:"A-261103-0001", biz_name:"분당 피팅랩",
    person:"박대표", tel:"010-4444-5555", region:"gyeonggi",
    subs:["ft-mend"], state:"done", provider_id:"t-fit", created_at:NOW }
];
const PRICES = [
  { id:"pr-1", provider_id:"t-range", sub:"rg-in", label:"타석 1시간",
    amount:12000, unit:"1시간", note:"" },
  { id:"pr-2", provider_id:"t-range", sub:"ls-solo", label:"주 1회 · 8회권",
    amount:400000, unit:"8회", note:"타석 이용료 별도" }
];
/* 배정받을 때 연락처 (0013 → 0014) — ⚠️ 손님에게는 한 글자도 안 갑니다 */
const CONTACT = [{ provider_id:"t-range", name:"김직통",
  tel:"010-5555-6666", email:"kim@greenpt.test",
  memo:"평일 오전에는 현장에 있습니다" }];
const PHOTOS = [
  { id:"ph-1", provider_id:"t-range", kind:"photo", path:"pv/t-range/photo/a.jpg",
    mime:"image/jpeg", bytes:420000, caption:"실내 타석" },
  { id:"ph-2", provider_id:"t-range", kind:"doc", path:"pv/t-range/doc/b.pdf",
    mime:"application/pdf", bytes:180000, caption:"사업자등록증" }
];
/* ⚠️ 알림은 **제목과 가는 자리**뿐입니다 (본문 칸이 아예 없습니다) */
const NOTICE = [
  { id:"nt-1", kind:"quote", title:"새 견적이 도착했습니다", link:"/my",
    read_at:null, created_at:NOW },
  { id:"nt-2", kind:"joinapply", title:"조인 신청이 들어왔습니다", link:"/my",
    read_at:null, created_at:"2026-11-04T05:00:00Z" },
  { id:"nt-3", kind:"answer", title:"질문에 답변이 달렸습니다", link:"/my",
    read_at:NOW, created_at:"2026-11-03T05:00:00Z" },
  /* ⚠️ 0053 — 갈래가 늘면 아이콘이 **빈 칸**일 수 있습니다 (없는 이름은
     console.warn 만 내고 빈 글자를 돌려줍니다). 눈으로 보려고 한 줄 둡니다. */
  { id:"nt-4", kind:"inquiry", title:"보내신 문의에 답변이 올라왔습니다",
    link:"/my", read_at:null, created_at:NOW }
];
/* ⚠️⚠️⚠️ **가짜 자료도 DB 가 받는 값이어야 합니다.** 여기 넷이 전부
   0045 에 **없는 값**이었습니다 (`kind:"service"` · `"report"` ·
   `state:"new"` · 접수번호 `Q-...`). 화면은 모르는 값을 키 그대로
   보여 주는 것이 맞으므로, 찍힌 그림에 영문 키가 나오고 그것을 보고
   **멀쩡한 화면을 고치려** 들게 됩니다 (조인에서 `ok` 를 적어 두고
   똑같이 밟은 자리입니다). 0045 의 값은 —
     kind   use · biz · privacy · etc
     state  open · reviewing · answered · closed
     no     IQ-YYMMDD-XXXX (0045 가 짓습니다) */
const INQ = [
  { id:"iq-1", no:"IQ-261105-0002", kind:"biz", state:"open",
    body:"업체 입점은 어떻게 신청하나요?", name:"김문의",
    tel:"010-7777-8888", email:"", created_at:NOW },
  { id:"iq-2", no:"IQ-261104-0001", kind:"use", state:"answered",
    body:"<script>alert(1)</script> 요청이 안 들어갑니다", name:"이문의",
    tel:"010-9999-0000", email:"a@b.test",
    answer:"확인해 드렸습니다. 지역을 넓혀 주시면 배정이 갑니다.",
    answered_at:NOW, created_at:"2026-11-04T05:00:00Z" },
  /* ⚠️ 아직 답이 없는 줄도 한 장 — 손님 화면이 "기다리는 중" 을
     어떻게 적는지 눈으로 봐야 합니다 */
  { id:"iq-3", no:"IQ-261106-0003", kind:"privacy", state:"reviewing",
    body:"제 기록을 지워 주세요", name:"박문의", tel:"010-2222-3333",
    email:"", created_at:NOW }
];
const REPS = [
  { id:"rp-1", no:"R-261105-0001", kind:"review", state:"new",
    body:"사실과 다른 후기가 올라왔습니다.", review_id:"rv-1",
    created_at:NOW },
  { id:"rp-2", no:"R-261104-0002", kind:"cq", state:"checking",
    body:"광고글입니다.", cq_id:"cq-1", created_at:NOW }
];
const LOG = [
  { id:"lg-1", at:NOW, by_role:"admin", obj:"provider", obj_id:"t-range",
    from_state:"hidden", to_state:"listed", why:"서류 확인 완료" },
  { id:"lg-2", at:NOW, by_role:"admin", obj:"account",
    obj_id:"22222222-2222-2222-2222-222222222222",
    from_state:"provider", to_state:"customer", why:"그만두셨습니다" }
];
const CQ = [
  { id:"cq-1", cat:"community", title:"초보인데 드라이버 어떻게 고르나요?",
    body:"입문 3개월입니다. 중고로 사도 괜찮을까요?", who:"김**",
    created_at:NOW, answer_n:2 },
  { id:"cq-2", cat:"community", title:"스크린 연습이 실전에 도움이 되나요?",
    body:"주말에만 필드를 나갑니다.", who:"이**", created_at:NOW,
    answer_n:0 }
];
const CQM = [{ id:"cq-1", cat:"community",
  title:"초보인데 드라이버 어떻게 고르나요?",
  body:"입문 3개월입니다.", state:"open", created_at:NOW }];
const CAM = [{ id:"ca-1", q_id:"cq-1", body:"중고도 괜찮습니다.",
  state:"open", created_at:NOW }];
const JOBS = [
  { id:"jb-1", kind:"hire", sub:"hr-pro", region:"gyeonggi",
    title:"분당 실내 연습장 레슨프로 모십니다", body:"주 5일 · 상담 후 결정",
    pay:"월 320만원", terms:"4대보험", as_pro:true,
    pro_name:"성남 그린골프연습장", created_at:NOW, apply_n:3 },
  { id:"jb-2", kind:"seek", sub:"hr-cad", region:"gyeonggi",
    title:"캐디 경력 4년 · 수도권 희망", body:"주말 가능합니다.",
    created_at:NOW, apply_n:0 }
];
const JOBMINE = [{ id:"jb-1", kind:"hire", sub:"hr-pro", region:"gyeonggi",
  title:"분당 실내 연습장 레슨프로 모십니다", body:"주 5일",
  pay:"월 320만원", state:"open", created_at:NOW }];
/* ⚠️ 지원 상태도 DB 가 받는 값이어야 합니다 (0048) */
const JOBAPP = [{ id:"ja-1", post_id:"jb-1",
  by_user:"44444444-4444-4444-4444-444444444444",
  msg:"이력서 보내 드리겠습니다.", state:"applied", created_at:NOW }];
/* ⚠️⚠️ **가짜 자료가 틀려서 멀쩡한 화면을 고장으로 읽을 뻔했습니다.**
   처음에 `region` 을 빼고 신청 상태를 `ok` 로 적었더니 화면에
   `· ·`(빈 구분점)와 영문 `ok` 가 찍혔습니다 — 코드는 맞고 **값이
   틀린** 것이었습니다 (0046 의 상태는 applied · accepted · rejected ·
   canceled 입니다). 작업 기억의 "검사가 빨갛게 뜨면 코드부터 고치지
   마세요" 가 그대로 걸린 자리입니다.
   ⚠️ 가짜 자료도 **DB 가 받는 값**이어야 합니다. */
const ROOMS = [{ id:"jr-1", title:"일요일 아침 남서울 조인 1자리",
  note:"보기플레이어 환영합니다.", course:"남서울CC", tee:"아침",
  region:"gyeonggi", need:1, budget:180000, play_at:"2026-11-16",
  state:"open", created_at:NOW }];
const ROOMAPP = [{ id:"jp-1", room_id:"jr-1", msg:"참여하고 싶습니다.",
  state:"applied", created_at:NOW,
  by_user:"55555555-5555-5555-5555-555555555555" }];
const RV = [{ id:"rv-1", provider_id:"t-range", rating:5, who:"김**",
  body:"타석이 넓고 꼼꼼히 봐 주셨습니다.", created_at:NOW,
  reply:"또 오세요", reply_at:NOW }];
const MET = { gmv:0, deals:0, users:0, providers:2,
  mau:{ cannot:"방문을 세는 장치가 없습니다" },
  income:{ cannot:"청구 · 입금을 담을 표가 없습니다" } };

/* 역할 */
const PRO  = { role:"provider", name:"김일담", provider:"t-range" };
const ADM  = { role:"admin", name:"관리자" };
const CUS  = { role:"customer", name:"홍길동" };

/* 표 묶음 — ⚠️ 화면이 묻는 **표 이름 앞머리**로 갈립니다 */
const T_DESK = {
  assignment:[ASG], request:[REQ], request_item:ITEMS, quote:[QUOTE],
  review:RV, provider:PVS, provider_price:PRICES,
  provider_photo:PHOTOS, v_provider_staff:STAFF_PV, notice:NOTICE,
  provider_contact:CONTACT,
  appointment:[], report:[]
};
const T_ADMIN = {
  request:[Object.assign({}, REQ, { state:"check" })], provider:PVS,
  provider_apply:APS, request_item:ITEMS, assignment:[],
  v_provider_staff:STAFF_ADM, provider_contact:CONTACT,
  inquiry:INQ, report:REPS, audit_log:LOG,
  review:RV, notice:[], cq:CQM, ca:CAM, jobpost:JOBMINE, joinroom:ROOMS
};
/* ⚠️ 0003 · 0013 의 수수료 · 정산 (js/adminfee.js) — ⚠️⚠️ 가짜 값도
   DB 가 받는 값이어야 합니다 (request.state 는 deal_state enum 이고
   fee_policy.type 은 fee_type enum 입니다). */
const FEE_REQS = [
  { id:"fq-1", no:"SW-7K3M-92QP", state:"done" },
  { id:"fq-2", no:"SW-2P8L-41RT", state:"fee_wait" }
];
const FEE_DEALS = [
  { id:"fd-1", request_id:"fq-1", provider_id:"t-range", amount:10000000,
    fee:null, fee_vat:null, fee_total:null, paid:null, paid_at:null,
    fee_at:null, signed_at:"2026-11-01T01:00:00Z", done_at:"2026-11-04T01:00:00Z" },
  { id:"fd-2", request_id:"fq-2", provider_id:"t-range", amount:5000000,
    fee:400000, fee_vat:40000, fee_total:440000, paid:null, paid_at:null,
    fee_at:NOW, signed_at:"2026-10-20T01:00:00Z", done_at:"2026-11-01T01:00:00Z" }
];
const FEE_POLS = [
  { id:"fp-1", provider_id:"t-range", type:"rate", flat:null, rate:8,
    min_fee:null, max_fee:null, vat:"add", confirm_when:"done", cycle:"now",
    from_date:null, to_date:null }
];
const FEE_SETT = [
  { id:"fs-1", provider_id:"t-range", from_date:"2026-10-01",
    to_date:"2026-10-31", total:880000, state:"wait",
    approved_at:null, paid_at:null }
];

/* ⚠️ 수수료 · 정산 상자를 그리려면 요청 줄이 `done` · `fee_wait` 여야
   합니다 — 앞의 배정 자리가 쓰는 줄을 **갈아 치우지 않고 더합니다**. */
T_ADMIN.request = T_ADMIN.request.concat(FEE_REQS);
T_ADMIN.deal       = FEE_DEALS;
/* ⚠️ 0025 · 0054 — 회원 역할. `member_hat` 은 seller · pro · biz 입니다 */
T_ADMIN.account = [
  { id:"ac-1", name:"김회원", role:"customer" },
  { id:"ac-2", name:"이프로", role:"customer" },
  { id:"ac-3", name:"최직원", role:"staff" }
];
T_ADMIN.account_hat = [{ account_id:"ac-2", hat:"pro" }];
T_ADMIN.fee_policy = FEE_POLS;
T_ADMIN.settlement = FEE_SETT;

/* ⚠️⚠️ 0056 — 내 중고 매물 (`js/mylisting.js`).
   ⚠️ **가짜 자료도 DB 가 받는 값이어야 합니다** — 물건 종류는 `us-*`
   하위 키, 물건 상태는 0056 의 `cond` 넷(new · like · good · fair),
   상태는 open · done · closed · hidden 입니다. 아닌 값을 넣으면 찍힌
   그림에 영문 키가 나오고, 그것을 보고 **멀쩡한 화면을 고치려** 들게
   됩니다 (조인의 `ok` · 문의의 `service` 에서 두 번 밟았습니다).
   ⚠️ `contact` · `agree_at` 은 **안 넣습니다** — 0056 이 그 칸을 안 줘서
   화면이 부르지도 않습니다 (넣으면 진짜 서버와 다른 꼴이 됩니다). */
const LSMINE = [
  { id:"ls-1", title:"타이틀리스트 드라이버 10.5도", body:"2년 썼고 흠집 조금 있습니다. 헤드커버 같이 드립니다.",
    sub:"us-driver", region:"seoul", ship:false, price:350000, cond:"good",
    state:"open", hidden_why:null, created_at:"2026-11-06T01:00:00Z" },
  { id:"ls-2", title:"연습용 아이언 무료로 나눔", body:"입문용입니다. 직접 가져가실 분만.",
    sub:"us-iron", region:"gyeonggi", ship:false, price:0, cond:"fair",
    state:"open", hidden_why:null, created_at:"2026-11-05T01:00:00Z" },
  { id:"ls-3", title:"가려진 매물", body:"운영자가 가린 자리입니다.",
    sub:"us-bag", region:"seoul", ship:true, price:120000, cond:"like",
    state:"hidden", hidden_why:"금지된 물건으로 보입니다",
    created_at:"2026-11-04T01:00:00Z" }
];
const LSASK = [
  { id:"la-1", listing_id:"ls-1", msg:"오늘 저녁에 볼 수 있을까요?",
    state:"asked", by_user:"u-b1", seller_share_at:null, buyer_share_at:null,
    created_at:"2026-11-06T02:00:00Z" },
  { id:"la-2", listing_id:"ls-1", msg:"값 조금 조정되나요?",
    state:"accepted", by_user:"u-b2", seller_share_at:null, buyer_share_at:null,
    created_at:"2026-11-06T03:00:00Z" },
  /* 내가 넣은 문의 — ⚠️ listing_id 가 내 매물이 아니라 갈라집니다 */
  { id:"la-9", listing_id:"남의-매물", msg:"저도 사고 싶습니다",
    state:"accepted", by_user:"me", seller_share_at:null, buyer_share_at:null,
    created_at:"2026-11-06T04:00:00Z" }
];
/* ⚠️⚠️ **수락만으로는 둘 다 비어 있습니다** (제17조 제2항) — 찍힌
   그림에서 "아직 안 여셨습니다" 가 보이는 것이 맞습니다. */
const LSCON = [
  { ask_id:"la-2", seller_contact:null, buyer_contact:null,
    seller_share_at:null, buyer_share_at:null },
  { ask_id:"la-9", seller_contact:null, buyer_contact:null,
    seller_share_at:null, buyer_share_at:null }
];

const T_MY = {
  request:[REQ], request_item:ITEMS, assignment:[ASG], quote:[QUOTE],
  provider:PVS, review:[], appointment:[], notice:NOTICE,
  joinroom:ROOMS, joinapply:ROOMAPP, cq:CQM, ca:CAM,
  jobpost:JOBMINE, jobapply:JOBAPP, v_join_contact:[], v_job_contact:[],
  /* ⚠️ 0045 → 0053 — 내가 보낸 문의와 그 답변 (`js/myinq.js`) */
  inquiry:INQ,
  /* ⚠️ 0056 — 내 중고 매물 (`js/mylisting.js`) */
  listing:LSMINE, listingask:LSASK, v_listing_contact:LSCON
};

/* ── 장면 ────────────────────────────────────────────────────────
   이름 · 주소 · 역할 · 표 · rpc · 누를 것(없으면 그대로)          */
const SCENES = [
  ["desk",            "/desk",  PRO, T_DESK,  {}],
  ["desk-price-open", "/desk",  PRO, T_DESK,  {}, "#pricebox [data-pf='open']"],
  ["admin",           "/admin", ADM, T_ADMIN, { biz_metrics: MET }],
  ["admin-new-pv",    "/admin", ADM, T_ADMIN, { biz_metrics: MET },
                      "#probox button[data-ptab='new']"],
  ["admin-apply",     "/admin", ADM, T_ADMIN, { biz_metrics: MET },
                      "#probox button[data-ptab='ap']"],
  ["my",              "/my",    CUS, T_MY,    {}],
  /* ⚠️ 로그인 안 한 자리도 한 장 — "한 줄도 안 보이는가" 는 눈으로도
     봐야 합니다 (글이 남아 있으면 그림에 보입니다). */
  ["desk-notmine",    "/desk",  CUS, T_DESK,  {}],
  ["admin-notmine",   "/admin", CUS, T_ADMIN, { biz_metrics: MET }]
];
/* ⚠️ 폭 — PC 하나 · 폰 **가장 좁은 것**(360). 작업 기억: 390 에서는
   멀쩡하고 360 에서만 드러난 고장이 있었습니다. */
const WIDTHS = [[1280, "pc"], [360, "mo"]];

/* ── 상자마다 따로 ───────────────────────────────────────────────
   ⚠️⚠️ **화면 한 장이 12,000px 입니다** — 사람이 한 번에 못 봅니다.
   그래서 **상자마다** 따로 찍습니다. 새로 만든 자리(0045~0052)가
   특히 그렇습니다 — 한 번도 눈으로 본 적이 없는 자리라 작게 찍어야
   읽힙니다.
   ⚠️ 이름을 여기 적되 **갯수는 안 셉니다** — 상자가 늘면 줄을 더합니다.
   ⚠️⚠️ **새 화면을 만드는 날 이 줄을 같이 늘리세요.** 안 늘리면 그
   상자만 영원히 아무도 안 보는 자리가 됩니다 (재는 범위와 같은
   규칙입니다). */
const BOXES = {
  "/desk": [["notice", "#noticebox"], ["start", "#dstbox"], ["assign", "#deskbox"],
            ["me", "#mebox"], ["contact", "#pvctbox"], ["staff", "#pvstbox"],
            ["photo", "#pvphbox"], ["price", "#pricebox"],
            ["fee", "#feebox"]],
  "/admin": [["apply", "#adminbox"], ["assign", "#assignbox"],
             ["metric", "#metricbox"], ["pro", "#probox"],
             ["staff", "#pvstadm"], ["report", "#repbox"],
             ["inq", "#inqadm"], ["biz", "#bizbox"],
             /* ⚠️ 0003 · 0013 의 수수료 · 정산 (js/adminfee.js) */
             ["fee", "#feeadm"],
             /* ⚠️ 0025 · 0054 의 회원 역할 (js/adminhat.js) */
             ["hat", "#hatadm"], ["log", "#logbox"]],
  /* ⚠️ 처음에 `#myreqbox` · `#myjoinbox` 처럼 **지어낸 id** 를 적어
     두어서 `/my` 상자가 한 장도 안 찍혔습니다 — 찍히는 갯수를 보고
     알았습니다. `pages/my.js` 에서 세어 고쳤습니다. */
  "/my": [["me", "#mybox"], ["notice", "#noticebox"], ["req", "#reqbox"],
          ["join", "#joinmine"], ["cq", "#mycq"], ["job", "#jobmine"],
          /* ⚠️ 0056 의 내 중고 매물 (js/mylisting.js) */
          ["listing", "#lsmine"],
          ["inq", "#myinqbox"]]
};

(async function(){
  const want = process.argv.slice(2).filter(function(a){
    return a.indexOf("--") !== 0; });
  if(process.argv.indexOf("--list") >= 0){
    SCENES.forEach(function(s){ console.log("  " + s[0] + "   " + s[1]); });
    return;
  }
  fs.mkdirSync(OUT, { recursive:true });

  const PORT = 8790 + (process.pid % 40);
  const srv = (await serve(PORT)).srv;
  const b = await chromium.launch();
  const base = "http://127.0.0.1:" + PORT;
  let n = 0;

  for(const [name, route, who, tables, rpcs, pre] of SCENES){
    if(want.length && !want.some(function(w){ return name.indexOf(w) >= 0; }))
      continue;
    for(const [w, tag] of WIDTHS){
      const p = await b.newPage({ viewport:{ width:w, height:900 },
                                  deviceScaleFactor: 2 });
      /* ⚠️ 화면이 조용히 터지면 그림만 보고는 모릅니다 — 같이 적습니다 */
      const errs = [];
      p.on("pageerror", function(e){ errs.push(String(e.message || e)); });
      p.on("console", function(m){
        if(m.type() === "error") errs.push(m.text());
      });
      /* ⚠️⚠️ `up` 을 **참**으로 줍니다 — 버킷이 설정된 뒤의 모습을
         봐야 합니다 (지금 운영은 꺼져 있어서 그 칸이 아예 안 나옵니다). */
      await stub(p, who, tables, rpcs, true);
      await p.goto(base + route, { waitUntil:"networkidle" });
      await p.waitForTimeout(600);
      if(pre){
        try{ await p.click(pre, { timeout:3000 });
             await p.waitForTimeout(500); }
        catch(e){ console.log("   ⚠️ 못 눌렀습니다 — " + pre); }
      }
      const f = path.join(OUT, name + "-" + tag + ".png");
      await p.screenshot({ path:f, fullPage:true });
      /* ⚠️ 상자마다 따로 — 보이는 것만 (`hidden` 인 상자는 건너뜁니다:
         그려지지 않은 자리를 빈 그림으로 찍으면 "봤다" 고 착각합니다). */
      for(const [bn, sel] of (BOXES[route] || [])){
        const el = await p.$(sel);
        if(!el) continue;
        const vis = await el.evaluate(function(e){
          return !e.hidden && !!e.offsetParent && e.children.length > 0; });
        if(!vis) continue;
        await el.screenshot({ path: path.join(OUT,
          name + "-" + tag + "--" + bn + ".png") }).catch(function(){});
        n++;
      }
      const h = await p.evaluate(function(){
        return { h: document.documentElement.scrollHeight,
                 over: document.documentElement.scrollWidth -
                       window.innerWidth };
      });
      n++;
      console.log("  " + (name + "-" + tag).padEnd(20) +
        " " + String(h.h).padStart(5) + "px 높이" +
        (h.over > 1 ? "  ⚠️ 가로로 " + h.over + "px 밀립니다" : "") +
        (errs.length ? "  ⚠️ 에러 " + errs.length + "건: " +
          errs[0].slice(0, 80) : ""));
      await p.close();
    }
  }

  await b.close(); srv.close();
  console.log("\n" + n + "장 찍었습니다 — " + OUT);
  console.log("⚠️ 이건 **보는 도구**입니다. 통과 · 실패를 내지 않으므로");
  console.log("   열어서 **눈으로** 보세요 (도구가 못 잡는 것을 보려고 찍습니다).");
})();
