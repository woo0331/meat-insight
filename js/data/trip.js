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

/* ════════════════════════════════════════════════════════════════════
   출발일 · 출발 가능 기간   (0077 · 2026-11-12)

   ⚠️⚠️⚠️ **담는 꼴이 셋입니다** — 확정 출발일 여럿(`dates`) · 기간
   안이면 언제든(`range`) · 아직 안 정함(`none`). 셋을 한 칸에 글자로
   담으면("12월 출발 가능") 달로 거를 수가 없습니다. 거르는 값은
   0077 의 `months`(text[])이고 DB 가 **세어서** 냅니다.

   ⚠️⚠️ **「아직 안 정함」을 「없음」으로 적지 않습니다** — 일정이 없는
   상품이 아니라 **아직 안 올리신** 상품입니다. 그 둘을 섞으면 손님이
   "이 여행사는 일정이 없구나" 로 읽습니다(절대 규칙 1 · 2).

   ⚠️ 날짜는 **한국 날짜**입니다 — `getMonth()` · `getDate()` 는 보는
   분 기계의 시간대로 돌려주므로 UTC 로 9시간 밀고 `getUTC*` 로
   꺼냅니다(`js/booking.js` 가 하루 앞으로 찍히던 그 자리).
   ════════════════════════════════════════════════════════════════════ */
window.AM_TRIP_DEPART = [
  { key:"dates", name:"확정 출발일" },
  { key:"range", name:"출발 가능 기간" },
  { key:"none",  name:"출발일 미등록" }
];

window.amTripDepartName = function(k){
  return window.amKeyName
    ? window.amKeyName(window.AM_TRIP_DEPART, k, "출발 방식")
    : String(k || "");
};

/* 한국 날짜 — {y, m, d} */
window.amKstYmd = function(at){
  var t = (at instanceof Date) ? at.getTime() : Date.now();
  var k = new Date(t + 9 * 3600 * 1000);
  return { y: k.getUTCFullYear(), m: k.getUTCMonth() + 1, d: k.getUTCDate() };
};

/* 고르개에 낼 달 — ⚠️ **이번 달부터** `n` 개입니다. 지난 달을 내면
   고를 수는 있는데 맞는 상품이 영원히 0건입니다(절대 규칙 5). */
window.amTripMonths = function(n){
  var k = window.amKstYmd();
  var out = [], y = k.y, m = k.m, i;
  for(i = 0; i < (n || 12); i++){
    out.push({ key: y + "-" + (m < 10 ? "0" : "") + m,
               name: y + "년 " + m + "월" });
    m++; if(m > 12){ m = 1; y++; }
  }
  return out;
};

window.amTripMonthName = function(k){
  var s = String(k || "");
  var m = /^(\d{4})-(\d{2})$/.exec(s);
  return m ? (m[1] + "년 " + Number(m[2]) + "월") : "";
};

/* 날짜 한 개 — ⚠️ `Z` 로 읽고 `getUTC*` 로 꺼냅니다 */
window.amTripDay = function(iso){
  var s = String(iso || "");
  if(!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "";
  var d = new Date(s + "T00:00:00Z");
  if(isNaN(d.getTime())) return "";
  return d.getUTCFullYear() + "년 " + (d.getUTCMonth() + 1) + "월 " +
         d.getUTCDate() + "일";
};

/* 카드 · 상세에 적는 한 줄.
   ⚠️⚠️ **셋을 다른 말로** 냅니다 — 같은 말로 내면 「아직 안 정함」이
   「오늘 출발」처럼 읽힙니다. 돌려주는 것은 {kind, text} 이고 화면이
   `kind` 로 색을 가릅니다(글자를 다시 뜯지 않게). */
window.amTripDepart = function(r){
  if(!r) return { kind:"none", text:"출발일 미등록" };
  var k = String(r.depart_kind || "none");
  if(k === "dates"){
    var nx = window.amTripDay(r.depart_next);
    return nx
      ? { kind:"dates", text:"가장 가까운 출발 " + nx }
      /* ⚠️ 확정 출발일을 적어 두셨는데 **앞으로 남은 것이 없는** 자리 —
         「미등록」이라고 적으면 거짓입니다(안 올린 것이 아닙니다). */
      : { kind:"past", text:"올려 두신 출발일이 모두 지났습니다" };
  }
  if(k === "range"){
    var a = window.amTripDay(r.depart_from), b = window.amTripDay(r.depart_to);
    if(a && b) return { kind:"range", text:a + " ~ " + b + " 사이 출발" };
    if(a) return { kind:"range", text:a + "부터 출발" };
    return { kind:"none", text:"출발일 미등록" };
  }
  return { kind:"none", text:"출발일 미등록" };
};
