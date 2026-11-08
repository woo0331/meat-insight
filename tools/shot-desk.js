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
/* ⚠️ 0064 의 광고 관리 (js/adminbiz.js) — ⚠️⚠️ **가짜 자료도 DB 가 받는
   값이어야 합니다**: 자리는 `ad_place` enum 의 키이고, 돈 갈래는
   `ad_bill_kind` 입니다. 아닌 값을 넣으면 찍힌 그림에 영문 키가 보이고
   그것을 보고 **멀쩡한 화면을 고치려** 들게 됩니다 (조인의 `ok` ·
   문의의 `kind:"service"` · 게시판의 `cm-review` 에 이은 네 번째). */
const AD_BOARD = [
  { id:"ad-1", provider_id:"t-range", provider_name:"남서울 실내연습장",
    advertiser:"남서울 골프", place:"main_hero", cat_key:null, region:null,
    starts_on:"2026-11-01", ends_on:"2026-11-30", price:1000000,
    state:"live", note:null, click_url:"https://example.com/event",
    img_pc:null, img_mo:null, img_alt:"가을 라운드 할인",
    billed:1000000, paid:600000, refunded:100000, net:500000,
    views:1840, clicks:37 },
  { id:"ad-2", provider_id:"t-range", provider_name:"남서울 실내연습장",
    advertiser:null, place:"home_sponsor_a", cat_key:null, region:null,
    starts_on:"2026-12-01", ends_on:"2026-12-31", price:0,
    state:"draft", note:null, click_url:null,
    img_pc:null, img_mo:null, img_alt:null,
    billed:0, paid:0, refunded:0, net:0, views:0, clicks:0 }
];
const AD_BILLS = [
  { id:"ab-1", ad_id:"ad-1", kind:"bill",   amount:1000000,
    on_day:"2026-11-01", memo:"11월 집행" },
  { id:"ab-2", ad_id:"ad-1", kind:"pay",    amount:600000,
    on_day:"2026-11-05", memo:"1차 입금" },
  { id:"ab-3", ad_id:"ad-1", kind:"refund", amount:100000,
    on_day:"2026-11-06", memo:"노출 지연분" }
];
/* ⚠️ 0066 의 골프장 자리 (js/admincourse.js) — ⚠️⚠️ 가짜 값도 DB 가 받는
   값이어야 합니다 (kind 는 golf · range, state 는 open · closed · hidden).
   ⚠️ 줄이 없으면 그 상자가 **빈 채로** 찍혀 아무도 못 봅니다 — 0051 의
   사진 상자가 흉내 자료가 없어 한 번도 안 그려진 그 자리입니다. */
const COURSES_ADM = [
  { id:"c-1", slug:"namseoul-cc", kind:"golf", name:"검사용 남서울 컨트리클럽",
    region:"gyeonggi", gu:"성남시", state:"open", source_id:"mcst-golf" },
  { id:"c-2", slug:"c-8f2a71", kind:"range", name:"검사용 강남 골프연습장",
    region:"seoul", gu:"강남구", state:"open", source_id:"seoul-range" },
  { id:"c-3", slug:"jeju-closed", kind:"golf", name:"검사용 닫힌 골프장",
    region:"jeju", gu:"제주시", state:"closed", source_id:"mcst-golf" }
];
const T_ADMIN = {
  request:[Object.assign({}, REQ, { state:"check" })], provider:PVS,
  provider_apply:APS, request_item:ITEMS, assignment:[],
  v_provider_staff:STAFF_ADM, provider_contact:CONTACT,
  inquiry:INQ, report:REPS, audit_log:LOG, v_course_public:COURSES_ADM,
  review:RV, notice:[], cq:CQM, ca:CAM, jobpost:JOBMINE, joinroom:ROOMS,
  v_ad_board:AD_BOARD, ad_bill:AD_BILLS, fee_policy:[], membership_plan:[],
  provider_membership:[]
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
    brand:"타이틀리스트", model:"스텔스2 10.5도",
    state:"open", hidden_why:null, created_at:"2026-11-06T01:00:00Z" },
  { id:"ls-2", title:"연습용 아이언 무료로 나눔", body:"입문용입니다. 직접 가져가실 분만.",
    sub:"us-iron", region:"gyeonggi", ship:false, price:0, cond:"fair",
    brand:"기타", model:null,
    state:"open", hidden_why:null, created_at:"2026-11-05T01:00:00Z" },
  /* ⚠️ 0069 — **예약중 한 줄**. 「예약 풀기」 단추가 그려지는지 눈으로
     봐야 하는 자리입니다 (되돌리는 길이 없으면 막다른 길입니다). */
  { id:"ls-4", title:"오디세이 퍼터 (예약중)", body:"한 분과 이야기 중입니다.",
    sub:"us-putter", region:"busan", ship:true, price:120000, cond:"like",
    brand:"오디세이", model:null,
    state:"reserved", hidden_why:null, created_at:"2026-11-07T01:00:00Z" },
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

/* 저장한 조건 (0058) — ⚠️⚠️ **가짜 자료도 DB 가 받는 값이어야 합니다.**
   조인에서 신청 상태를 `ok` 로 적어 두고, 문의 갈래를 `service` 로 적어
   두어 **찍힌 그림에 영문 키가 나오고** 그것을 보고 멀쩡한 화면을
   고치려 들었던 자리입니다 (화면은 모르는 값을 그대로 보여 주는 것이
   맞습니다). 0058 의 갈래는 `join` · `listing` · `job` 셋입니다. */
const WATCH = [
  { id:"wa-1", kind:"listing", sub:"us-iron", region:"seoul",
    max_price:500000, ship:true, booked:false, created_at:NOW },
  /* ⚠️ 금액 0 — "무료로 나눔" 으로 보여야 합니다 */
  { id:"wa-2", kind:"listing", sub:null, region:null,
    max_price:0, ship:false, booked:false, created_at:NOW },
  { id:"wa-3", kind:"join", sub:null, region:"gyeonggi",
    max_price:150000, ship:false, booked:true, created_at:NOW }
];

/* 구합니다 (0061) — ⚠️ 가짜 자료도 **DB 가 받는 값**이어야 합니다.
   `cat` 은 분류 키(`AM_WANT_OFF` 를 뺀 다섯) · `sub` 은 그 분류의 하위 ·
   매물 상태는 `open · done · closed · hidden` · 답 상태는
   `replied · accepted · rejected · canceled` 입니다. 아닌 값을 넣으면
   화면이 **키를 그대로 보여 주고**(그게 맞습니다) 그 그림을 보고 멀쩡한
   화면을 고치려 들게 됩니다 (이 저장소가 다섯 번 겪은 자리). */
const WTMINE = [
  { id:"aa111111-1111-1111-1111-111111111111", cat:"lesson", sub:"ls-solo",
    region:"gyeonggi", title:"주말 오전에 레슨 받을 곳 찾습니다",
    body:"성남 분당 쪽이면 좋겠습니다. 구력 2년이고 드라이버를 집중해서 " +
         "배우고 싶습니다.",
    budget:200000, when_txt:"주말 오전", state:"open", hidden_why:null,
    created_at:"2026-11-07T01:00:00Z" },
  { id:"aa222222-2222-2222-2222-222222222222", cat:"market", sub:null,
    region:"seoul", title:"입문용 아이언 세트 구합니다",
    body:"무료로 나눠 주실 분을 찾습니다.",
    budget:0, when_txt:null, state:"open", hidden_why:null,
    created_at:"2026-11-06T01:00:00Z" }
];
const WTREP = [
  { id:"bb111111-1111-1111-1111-111111111111",
    w_id:"aa111111-1111-1111-1111-111111111111", by_user:"u2",
    body:"주말 오전 7시 · 9시 자리가 있습니다. 드라이버 위주로 8회 " +
         "과정으로 잡아 드릴 수 있습니다.",
    state:"accepted", created_at:"2026-11-07T02:00:00Z",
    owner_share_at:null, helper_share_at:"2026-11-07T03:00:00Z",
    pro_name:"분당 그린골프아카데미", who:null, owner:"u1" },
  { id:"bb222222-2222-2222-2222-222222222222",
    w_id:"aa111111-1111-1111-1111-111111111111", by_user:"u3",
    /* ⚠️ 손님이 적은 글에 태그를 하나 넣어 둡니다 — 날것으로 나가면
       찍은 그림에 보입니다 (esc 사고는 이 저장소가 서른두 번 겪었습니다). */
    body:"같은 동네입니다. <img src=x onerror=alert(9)> 알려 드릴게요.",
    state:"replied", created_at:"2026-11-07T04:00:00Z",
    owner_share_at:null, helper_share_at:null,
    pro_name:null, who:"김**", owner:"u1" }
];
const WTCON = [
  { reply_id:"bb111111-1111-1111-1111-111111111111",
    owner_contact:null, helper_contact:"031-000-0000",
    owner_share_at:null, helper_share_at:"2026-11-07T03:00:00Z" }
];

const T_MY = {
  request:[REQ], request_item:ITEMS, assignment:[ASG], quote:[QUOTE],
  provider:PVS, review:[], appointment:[], notice:NOTICE,
  joinroom:ROOMS, joinapply:ROOMAPP, cq:CQM, ca:CAM,
  jobpost:JOBMINE, jobapply:JOBAPP, v_join_contact:[], v_job_contact:[],
  /* ⚠️ 0045 → 0053 — 내가 보낸 문의와 그 답변 (`js/myinq.js`) */
  inquiry:INQ,
  /* ⚠️ 0056 — 내 중고 매물 (`js/mylisting.js`) */
  listing:LSMINE, listingask:LSASK, v_listing_contact:LSCON,
  /* ⚠️ 0069 의 관심상품 — **팔린 매물도 남습니다**(그 사실을 적는지
     눈으로 봐야 하는 자리입니다). */
  v_listing_fav: [
    { id:"lf-1", title:"담아 둔 타이틀리스트 드라이버", price:350000,
      sub:"us-driver", region:"seoul", ship:false, brand:"타이틀리스트",
      model:"스텔스2", state:"open", thumb:"lst/lf-1/photo/a.jpg",
      fav_at:"2026-11-08T02:00:00Z" },
    { id:"lf-2", title:"팔린 퍼터 (담아 둔 것)", price:0,
      sub:"us-putter", region:"busan", ship:true, brand:null,
      model:null, state:"done", thumb:null,
      fav_at:"2026-11-08T01:00:00Z" }],
  /* ⚠️ 0058 — 저장한 조건 (`js/mywatch.js`). 흉내 자료를 안 주면 그
     상자가 **0건으로만** 그려져 목록 모양을 아무도 못 봅니다 (0051 의
     사진 상자가 `pvPhoto` 를 안 돌려줘 한 번도 안 그려진 그 자리). */
  watch:WATCH,
  /* ⚠️ 0059 — 공개 닉네임 (`js/mynick.js`). 안 주면 그 상자가 "읽지
     못했습니다" 로만 그려져 모양을 아무도 못 봅니다. */
  account:[{ nick:"버디사냥꾼" }],
  /* ⚠️ 0061 — 내가 올린 구합니다 (`js/mywanted.js`) */
  wanted:WTMINE, v_wanted_reply:WTREP, v_wanted_contact:WTCON
};

/* ── 장면 ────────────────────────────────────────────────────────
   이름 · 주소 · 역할 · 표 · rpc · 누를 것(없으면 그대로)          */
/* 게시판 (0059) — ⚠️ `cq.cat` 은 **게시판 키**(cm-*)입니다. 분류 키를
   적어 두면 화면이 키를 그대로 찍고, 그 그림을 보고 멀쩡한 화면을
   고치게 됩니다 (조인에서 `ok` 를 적어 두고 밟은 그 자리). */
const CQ_ID = "11111111-1111-1111-1111-111111111111";
/* 구합니다 목록 (0061) — ⚠️ 공개 보기라 `contact` 칸이 **없습니다** */
const T_WT = {
  v_wanted_open: WTMINE.map(function(w){
    return { id:w.id, cat:w.cat, sub:w.sub, region:w.region, title:w.title,
             body:w.body, budget:w.budget, when_txt:w.when_txt,
             created_at:w.created_at,
             reply_n: w.id.indexOf("aa1") === 0 ? 3 : 0 };
  })
};

/* ⚠️⚠️⚠️ **가짜 자료도 그 화면의 분류여야 합니다.** 마켓 화면에 레슨 글을
   꽂았더니 하위가 `ls-solo` **영문 키 그대로** 찍혔습니다 — 화면은 모르는
   키를 그대로 내는 것이 맞고(이름을 지어내지 않습니다) **틀린 것은 제
   자료**였습니다. 운영에서는 `load()` 가 `cat=eq.market` 으로 좁히므로
   섞일 수가 없습니다. 조인의 `ok` · 문의의 `kind:"service"` · 게시판의
   `cm-review` · 중고의 `us-putter` 에 이어 **다섯째**입니다. */
const T_WT_MK = {
  v_wanted_open: [
    { id:"bb111111-1111-1111-1111-111111111111", cat:"market", sub:"mk-club",
      region:"seoul", title:"타이틀리스트 드라이버 10.5도 중고로 구합니다",
      body:"상태 좋은 것으로 찾습니다. 직거래 선호합니다.",
      budget:400000, when_txt:"이번 달 안으로", created_at:"2026-11-07T01:00:00Z",
      reply_n:2 },
    { id:"bb222222-2222-2222-2222-222222222222", cat:"market", sub:"mk-shoe",
      region:"seoul", title:"여성용 골프화 240 새것 어디가 싼가요",
      body:"브랜드는 상관없습니다.",
      budget:null, when_txt:null, created_at:"2026-11-06T01:00:00Z", reply_n:0 },
    /* ⚠️ 한 줄은 **예산 0** — "무료로 해 주실 분" 이 나오는지 눈으로 봅니다
       (`||` 를 쓰면 0 이 사라지고 "안 적음" 과 섞입니다). */
    { id:"bb333333-3333-3333-3333-333333333333", cat:"market", sub:"mk-train",
      region:"seoul", title:"연습용 드라이버 무료로 주실 분",
      body:"스크린 연습용으로 쓰려고 합니다.",
      budget:0, when_txt:null, created_at:"2026-11-05T01:00:00Z", reply_n:1 }
  ]
};
/* ⚠️ 여행은 **해외 지역**이 사람 말로 나오는지 보는 자리입니다
   (`jp` 가 그대로 찍히면 그림에 보입니다). */
const T_WT_TR = {
  v_wanted_open: [
    { id:"cc111111-1111-1111-1111-111111111111", cat:"travel", sub:"tr-away",
      region:"jp", title:"일본 골프 패키지 2박3일 알아봅니다",
      body:"4명이고 12월 중순으로 생각하고 있습니다.",
      budget:900000, when_txt:"12월 중순", created_at:"2026-11-07T01:00:00Z",
      reply_n:1 },
    { id:"cc222222-2222-2222-2222-222222222222", cat:"travel", sub:"tr-home",
      region:"jeju", title:"제주 2박3일 골프텔 추천 부탁드립니다",
      body:"부부 둘이 갑니다.",
      budget:null, when_txt:null, created_at:"2026-11-06T01:00:00Z", reply_n:0 }
  ]
};

/* 중고 매물 목록 (0056 → 0068) — ⚠️ 공개 보기라 `contact` 칸이
   **없습니다**. ⚠️⚠️ 한 줄은 **사진이 있고** 한 줄은 **없게** 둡니다 —
   둘 다 있으면 "사진 0장이면 아이콘 타일" 을 눈으로 볼 수가 없습니다.
   ⚠️ 한 줄의 브랜드를 **비워** 둡니다 (0068 전에 올라온 매물) — 그 줄에
   "undefined" 가 찍히면 그림에 보입니다.
   ⚠️⚠️ 공개 버킷 주소는 그물 밖이라 그림이 **깨진 네모**로 찍힙니다 —
   그러면 "사진이 안 나온다" 로 읽히므로, 아래에서 그 주소를 가로채
   저장소의 그림으로 바꿔 줍니다 (`PUB` 가로채기). */
/* ⚠️ 0069 가 더한 칸 — `model` · `state` · `created_at` · `seller`.
   ⚠️⚠️ **안 채우면 찍힌 그림이 거짓말을 합니다** — 등록시간 칸이 빈
   글자가 되고 상태 덮개가 안 서서, 그 그림을 보고 "안 만들었구나" 로
   읽습니다 (가짜 자료가 DB 가 받는 값이어야 하는 그 자리의 결). */
const NOW_ISO = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
/* ⚠️⚠️ **`listing.id` 는 uuid 입니다** — `?v=l1` 로 열면 `readUrl()` 이
   꼴을 보고 버려서 **상세가 아니라 목록**이 찍힙니다(화면이 맞고 자료가
   틀린 자리입니다). 상세를 찍는 장면만 uuid 꼴로 갈아 끼웁니다. */
const LST_U1 = "aaaaaaaa-0069-4000-8000-000000000001";
const LST_U3 = "aaaaaaaa-0069-4000-8000-000000000003";
const T_LST = {
  v_listing_fav: [{ id:"l2" }],
  v_listing_open: [
    { id:"l1", sub:"us-driver", region:"seoul", ship:false,
      title:"드라이버 10.5도 팝니다 (헤드커버 포함)",
      body:"2년 쓴 드라이버입니다.", price:350000, cond:"good", ask_n:0,
      brand:"타이틀리스트", model:"스텔스2 10.5도", state:"open",
      created_at:NOW_ISO, seller:"김**",
      photo_n:3, thumb:"lst/l1/photo/a.jpg" },
    { id:"l2", sub:"us-iron", region:"gyeonggi", ship:true,
      title:"연습용 아이언 무료로 나눔합니다",
      body:"연습용 아이언입니다.", price:0, cond:"fair", ask_n:2,
      brand:null, model:null, state:"open", created_at:NOW_ISO,
      seller:"이**", photo_n:0, thumb:null },
    /* ⚠️ 가짜 자료도 **DB 가 받는 값**이어야 합니다 — 처음에
       `us-putter` 라고 적어 두었다가 찍은 그림에 **영문 키가 그대로**
       찍혔습니다 (이 저장소가 다섯 번 겪은 자리). 있는 키는
       `us-driver · us-wood · us-iron · us-wedge · us-shaft · us-bag ·
       us-gear` 입니다. */
    { id:"l3", sub:"us-wedge", region:"busan", ship:true,
      title:"웨지 52도 · 56도 두 자루 팝니다", body:"거의 안 썼습니다.",
      price:120000, cond:"like", ask_n:1,
      brand:"오디세이", model:null, state:"reserved",
      created_at:NOW_ISO, seller:"박**",
      photo_n:1, thumb:"lst/l3/photo/a.jpg" },
    { id:"l4", sub:"us-bag", region:"incheon", ship:false,
      title:"캐디백 · 보스턴백 세트", body:"한 시즌 썼습니다.",
      price:90000, cond:"good", ask_n:0,
      brand:"기타", model:null, state:"done", created_at:NOW_ISO,
      seller:"최**", photo_n:2, thumb:"lst/l4/photo/a.jpg" }
  ]
};

const T_CQ = {
  v_cq_public: [
    { id:CQ_ID, cat:"cm-open", title:"주말에 라운딩 다녀왔습니다",
      body:"날씨가 좋아서 스코어도 잘 나왔습니다.\n다음에 또 가려고 합니다.",
      who:"버디사냥꾼", named:true, created_at:"2026-11-06T01:00:00Z",
      updated_at:"2026-11-06T01:00:00Z",
      answer_n:2, view_n:42, photo_n:0, mine:true },
    { id:"22222222-2222-2222-2222-222222222222", cat:"cm-ask",
      title:"드라이버 슬라이스 어떻게 고치셨나요", body:"오른쪽으로 많이 휩니다.",
      /* ⚠️ 손님이 적은 글에 태그를 하나 넣어 둡니다 — 날것으로 나가면
         찍은 그림에 보입니다 (esc 사고는 이 저장소가 서른두 번 겪었습니다). */
      who:"김**", named:false, created_at:"2026-11-05T01:00:00Z",
      updated_at:"2026-11-05T01:00:00Z",
      answer_n:0, view_n:7, photo_n:0, mine:false }
  ],
  v_ca_public: [
    { id:"a1", q_id:CQ_ID, who:"그린필드", named:true,
      body:"좋네요. <img src=x onerror=alert(9)> 어느 골프장이셨나요?",
      created_at:"2026-11-06T02:00:00Z", by_asker:false, mine:false },
    { id:"a2", q_id:CQ_ID, who:"버디사냥꾼", named:true,
      body:"남서울CC 다녀왔습니다.", created_at:"2026-11-06T02:30:00Z",
      by_asker:true, mine:true }
  ],
  account: [{ nick:"버디사냥꾼" }]
};

const SCENES = [
  ["desk",            "/desk",  PRO, T_DESK,  {}],
  ["desk-price-open", "/desk",  PRO, T_DESK,  {}, "#pricebox [data-pf='open']"],
  ["admin",           "/admin", ADM, T_ADMIN, { biz_metrics: MET }],
  ["admin-new-pv",    "/admin", ADM, T_ADMIN, { biz_metrics: MET },
                      "#probox button[data-ptab='new']"],
  ["admin-apply",     "/admin", ADM, T_ADMIN, { biz_metrics: MET },
                      "#probox button[data-ptab='ap']"],
  /* ⚠️ 0064 의 광고 관리 — **갈래를 눌러야 보입니다.**
     안 누르면 첫 갈래(수수료 정책)만 찍힐다 — 그 상자 안에 갈래가
     여럿이면 **나머지는 영원히 아무도 안 보는 자리**가 됩니다. */
  ["admin-ad",        "/admin", ADM, T_ADMIN, { biz_metrics: MET },
                      "#bizbox button[data-tab='ad']"],
  ["my",              "/my",    CUS, T_MY,    {}],
  /* ⚠️ 자유게시판 (0059) — 모아보기 · 게시판 하나 · 글 하나 */
  ["board",           "/cat/community",         CUS, T_CQ, {}],
  ["board-one",       "/cat/community?s=cm-open", CUS, T_CQ, {}],
  ["board-post",      "/cat/community?q=11111111-1111-1111-1111-111111111111",
                      CUS, T_CQ, {}],
  /* ⚠️ 로그인 안 한 자리도 한 장 — "한 줄도 안 보이는가" 는 눈으로도
     봐야 합니다 (글이 남아 있으면 그림에 보입니다). */
  /* ⚠️ 구합니다 (0061) — 분류 화면의 목록 (업체가 0곳이어도 도는 자리) */
  ["wanted",          "/cat/lesson", CUS, T_WT, {}],
  /* ⚠️⚠️ 2026-11-08 — 구합니다에도 **거르개 레일**이 섰습니다(0068 의 틀).
     폰에서는 아래 시트라 **눌러야 보입니다** — 안 누르면 그 시트는 영원히
     아무도 안 보는 자리입니다. 그리고 여행만 **해외 지역**이 나오므로
     그 장을 따로 찍습니다(그림에서만 보이는 자리). */
  ["wanted-filter",   "/cat/market", CUS, T_WT_MK, {}, "#wf-open"],
  ["wanted-chips",    "/cat/market?rg=seoul&q=" + encodeURIComponent("드라이버"),
                      CUS, T_WT_MK, {}],
  ["wanted-travel",   "/cat/travel", CUS, T_WT_TR, {}],
  /* ⚠️⚠️ 중고 매물 (0068) — **사진 카드 격자와 거르개**입니다. 폰에서는
     거르개가 아래 시트라 **눌러야 보입니다** — 안 누르면 그 시트는
     영원히 아무도 안 보는 자리입니다 (PC 는 레일이 늘 서 있습니다). */
  ["used",            "/cat/used", CUS, T_LST, {}],
  ["used-filter",     "/cat/used", CUS, T_LST, {}, "#lf-open"],
  /* ⚠️⚠️⚠️ **상세 화면 (0069)** — 2026-11-08 까지 이 화면이 아예
     없었습니다. 찍어 보지 않으면 "보기 흉한가" 를 알 수 없습니다. */
  ["used-one",        "/cat/used?v=" + LST_U1, CUS,
    Object.assign({}, T_LST, {
      v_listing_open: [Object.assign({}, T_LST.v_listing_open[0],
                                     { id: LST_U1 })],
      v_listing_photo_public: [
        { path:"lst/l1/photo/a.jpg", caption:"앞면", ord:0 },
        { path:"lst/l1/photo/b.jpg", caption:"뒷면", ord:1 },
        { path:"lst/l1/photo/c.jpg", caption:"헤드", ord:2 }] }), {}],
  /* ⚠️ 예약중 매물의 상세 — **그 사실을 그 자리에서 말하는지** 봅니다 */
  ["used-one-res",    "/cat/used?v=" + LST_U3, CUS,
    Object.assign({}, T_LST, {
      v_listing_open: [Object.assign({}, T_LST.v_listing_open[2],
                                     { id: LST_U3 })],
      v_listing_photo_public: [
        { path:"lst/l3/photo/a.jpg", caption:"", ord:0 }] }), {}],
  /* ⚠️ 조건을 걸고 들어온 자리 — 칩 한 줄이 보이는지 눈으로 봅니다 */
  ["used-chips",      "/cat/used?br=" + encodeURIComponent("타이틀리스트") +
                      "&cd=good&rg=seoul&sh=1", CUS, T_LST, {}],
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
             ["hat", "#hatadm"], ["course", "#csadm"], ["log", "#logbox"]],
  /* ⚠️ 처음에 `#myreqbox` · `#myjoinbox` 처럼 **지어낸 id** 를 적어
     두어서 `/my` 상자가 한 장도 안 찍혔습니다 — 찍히는 갯수를 보고
     알았습니다. `pages/my.js` 에서 세어 고쳤습니다. */
  /* ⚠️⚠️ 게시판(0059)도 **설정이 있어야 열립니다** — `check-screens` 는
     빈 상자만 봅니다. 모아보기 · 글 하나를 여기서 찍습니다. */
  "/cat/community": [["board", "#cqlist"]],
  "/my": [["me", "#mybox"], ["notice", "#noticebox"], ["req", "#reqbox"],
          ["join", "#joinmine"], ["cq", "#mycq"], ["job", "#jobmine"],
          /* ⚠️ 0056 의 내 중고 매물 (js/mylisting.js) */
          ["listing", "#lsmine"],
          /* ⚠️ 0058 의 저장한 조건 (js/mywatch.js) */
          ["watch", "#wchbox"],
          /* ⚠️ 0059 의 공개 닉네임 (js/mynick.js) */
          ["nick", "#nickbox"],
          /* ⚠️ 0061 의 내가 올린 구합니다 (js/mywanted.js) */
          ["wanted", "#wtmine"],
          /* ⚠️ 0069 의 관심상품 (js/myfav.js) — **새 상자를 만드는 날
             이 줄을 같이 늘립니다.** 안 늘리면 그 안은 영원히 아무도
             안 보는 자리가 됩니다 (0051 의 사진 상자가 그랬습니다). */
          ["fav", "#favbox"],
          ["inq", "#myinqbox"]],
  /* ⚠️⚠️ 구합니다(0061)도 **설정이 있어야 열립니다** — `check-screens` 는
     빈 상자만 봅니다. 분류 화면의 목록을 여기서 찍습니다. */
  "/cat/lesson": [["wanted", "#wtlist"]],
  /* ⚠️ 레일은 목록 **밖**(`#wtwrap`)이라 `#wtlist` 만 집으면 안 찍힙니다 */
  "/cat/market": [["wanted", "#wtwrap"]],
  "/cat/travel": [["wanted", "#wtwrap"]],
  /* ⚠️⚠️ 중고 매물 (0068) — 거르개 묶음(`#lswrap`)과 목록을 따로 찍습니다 */
  "/cat/used": [["wrap", "#lswrap"], ["bar", "#lsbar"], ["list", "#lslist"],
                ["rail", "#lsrail"], ["form", "#lsbox"],
                /* ⚠️ 0069 — 상세 화면. `?v=` 로 들어오면 목록 자리에
                   그려지므로 `#lslist` 가 그 상자입니다. */
                ["detail", ".lsd"]]
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
      /* ⚠️⚠️ 공개 버킷의 사진 주소를 가로채 **저장소의 그림**을 줍니다 —
         안 주면 그림이 깨진 네모로 찍혀 "사진이 안 나온다" 로 읽힙니다
         (보는 도구라 여기서만 합니다 · 검사는 주소만 봅니다). */
      await p.route("**/storage/v1/object/public/**", function(r){
        return r.fulfill({ status:200, contentType:"image/jpeg",
          body: fs.readFileSync(path.join(__dirname, "..", "img", "mock",
                                          "cat-used.jpg")) });
      });
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
      /* ⚠️⚠️ **질의문자를 떼고 찾습니다** — `/cat/community?s=cm-open` ·
         `/cat/used?br=…` 처럼 조건을 걸고 들어온 자리가 BOXES 와 안 맞아
         **상자가 한 장도 안 찍히고** 있었습니다 (전체 화면만 찍혔습니다). */
      for(const [bn, sel] of (BOXES[route.split("?")[0]] || [])){
        const el = await p.$(sel);
        if(!el) continue;
        /* ⚠️⚠️ **`offsetParent` 로 재면 안 됩니다** — `position:fixed` 인
           칸은 보이고 있어도 **null** 입니다. 폰의 거르개 시트가 그 꼴이라
           열어 놓고 찍어도 **한 장도 안 찍혔습니다**(작업 기억의 `.sr-only`
           자리와 같은 결 · 거기서는 반대로 null 이 아니었습니다).
           그려졌는지는 **네모가 있는가**로 봅니다. */
        const vis = await el.evaluate(function(e){
          return !e.hidden && e.getClientRects().length > 0 &&
                 e.children.length > 0; });
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
