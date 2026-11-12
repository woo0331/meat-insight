/* ════════════════════════════════════════════════════════════════════
   골프 여행 상품 — 말과 셈 (0073 · 확정 시안 ⑧)

   ⚠️⚠️ **말을 화면 안에 두지 않습니다.** 0046 의 조인이 상태 말을
   `js/myjoin.js` 안에 들고 있다가 아무도 DB 와 맞춰 보지 않아 영문
   `closed` 가 손님 화면에 찍혔습니다. 여기 한 곳이고 `check-deal` 이
   0073 의 check 와 빌드마다 맞춰 봅니다.

   ⚠️⚠️ **말이 두 벌입니다** — 여행사에게 할 말(`name`)과 손님에게 할
   말은 다릅니다. 손님 화면에는 **공개된 것만** 나가므로 상태 말이
   아예 필요 없습니다 (공개 보기가 approved 만 냅니다).
   ════════════════════════════════════════════════════════════════════ */

/* 국내 · 해외 — ⚠️ 목적지 목록은 `amRegionsOf("travel")` 이 줍니다
   (국내는 AM_REGIONS · 해외는 AM_TRIP_REGIONS). 여기 또 적지 않습니다. */
window.AM_TRIP_SCOPE = [
  { key:"home",   name:"국내" },
  { key:"abroad", name:"해외" }
];

/* 상품 상태 — 여행사 작업실에서 쓰는 말입니다 */
window.AM_TRIP_ST = [
  { key:"pending",  name:"심사 중",   lead:"운영자 확인을 기다립니다 (아직 손님에게 안 보입니다)" },
  { key:"approved", name:"판매 중",   lead:"손님 목록에 보입니다" },
  { key:"rejected", name:"반려",      lead:"까닭을 보시고 고쳐서 다시 올리실 수 있습니다" },
  { key:"closed",   name:"판매 중지",  lead:"손님에게 보이지 않습니다" },
  { key:"hidden",   name:"가려짐",    lead:"운영자가 가렸습니다" }
];
/* 수정본 상태 — ⚠️⚠️ **공개본과 다른 줄입니다.** 하나로 묶으면
   "판매 중인데 수정본이 반려됨" 을 말할 수가 없습니다. */
window.AM_TRIP_DRAFT_ST = [
  { key:"none",     name:"" },
  { key:"pending",  name:"수정본 심사 중", lead:"지금 보이는 상품은 그대로 팔립니다" },
  { key:"rejected", name:"수정본 반려",    lead:"지금 보이는 상품은 그대로입니다. 고쳐서 다시 내실 수 있습니다" }
];
window.amTripSt = function(k){
  var L = window.AM_TRIP_ST || [];
  for(var i = 0; i < L.length; i++) if(L[i].key === k) return L[i];
  return null;
};
window.amTripDraftSt = function(k){
  var L = window.AM_TRIP_DRAFT_ST || [];
  for(var i = 0; i < L.length; i++) if(L[i].key === k) return L[i];
  return null;
};

/* 포함 · 불포함으로 자주 적는 것 — ⚠️ **고르개가 아니라 거들기**입니다.
   목록에 없는 것도 적으실 수 있어야 합니다 (0068 의 브랜드와 같은 결 —
   목록만 내면 목록에 없는 것을 가진 분이 못 올립니다 · 절대 규칙 2). */
window.AM_TRIP_ITEM = ["숙박", "36홀", "54홀", "카트", "캐디", "식사",
                       "항공", "리무진", "그린피", "보험"];

/* ⚠️⚠️ 일정은 **박 · 일 두 숫자**이고 글자로 저장하지 않습니다 —
   "1박 2일" 로 담으면 기간으로 거를 수가 없습니다. 적는 자리는 한 곳. */
window.amTripSpan = function(r){
  if(!r) return "";
  var n = Number(r.nights), d = Number(r.days);
  if(!isFinite(d) || d < 1) return "";
  return (n > 0 ? (n + "박 ") : "") + d + "일";
};

/* ⚠️⚠️⚠️ **"부터" 를 반드시 붙입니다** — price_from 은 1인 기준
   **최저가**이고 그 값이 곧 여행 값이 아닙니다. 빼면 우리가 값을
   확정해 말하는 것이 됩니다 (절대 규칙 1 · 시안도 "1인 390,000원부터").
   ⚠️ 못 읽었으면 **빈 글자**입니다 — 0원을 적지 않습니다. */
window.amTripPrice = function(r){
  if(!r) return "";
  var w = Number(r.price_from);
  if(!isFinite(w) || w <= 0) return "";
  return "1인 " + w.toLocaleString("ko-KR") + "원부터";
};
