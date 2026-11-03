/* ════════════════════════════════════════════════════════════════════
   상담 · 견적의 **말** — 한 곳입니다

   DB 는 상태를 `new` · `quoted` 같은 영문 키로 들고 있습니다
   (`deal_state` enum · 0001). 화면은 사람 말로 보여 줘야 하는데, 그
   짝을 화면마다 따로 적으면 한쪽만 고쳐서 조용히 어긋납니다 — 앞
   서비스에서 화면의 key 와 DB 의 값으로 여러 번 겪은 자리입니다.

   ⚠️⚠️ **여기에 상태를 더하거나 빼면 DB 도 같이 고쳐야 합니다.**
   `tools/check-deal.js` 가 빌드마다 `db/migrations` 의 enum 과
   견주어, 한쪽에만 있는 것이 있으면 **빌드를 멈춥니다.** 이름(한글)은
   안 봅니다 — 그건 말이고, 검사가 봐야 하는 것은 **키**입니다.

   ⚠️⚠️ **길(어디서 어디로 갈 수 있나)을 여기 적지 않았습니다.** 그
   표는 DB(`deal_move`)에 있고 거기가 참입니다. 화면이 제 표를 들고
   있으면 "화면에는 단추가 있는데 DB 가 거절하는" 자리가 생깁니다 —
   화면은 **단추를 누르고 DB 가 거절한 말을 그대로** 보여 줍니다.

   ⚠️ 진행 정도(step)는 손님에게 "어디까지 왔나" 를 보여 주는 데만
   씁니다. 숫자를 저장하지 않습니다 — 상태에서 **계산**합니다.
   ════════════════════════════════════════════════════════════════════ */

/* 상담 상태 열셋 — ⚠️ 키는 DB 의 `deal_state` 와 같아야 합니다.
   ⚠️ `tone` 은 배지 **바탕** 색입니다 (상태색은 글자로 쓰면 대비가
   모자랍니다 — 짙은 단계는 CSS 가 고릅니다). */
window.AM_DEAL_ST = [
  { key:"new",      name:"접수",        tone:"ok",   step:1 },
  { key:"check",    name:"확인 중",     tone:"ok",   step:2 },
  { key:"assigned", name:"업체 배정",   tone:"info", step:3 },
  { key:"accepted", name:"업체 수락",   tone:"info", step:4 },
  { key:"consult",  name:"상담 중",     tone:"info", step:5 },
  { key:"quoted",   name:"견적 받음",   tone:"info", step:6 },
  { key:"nego",     name:"조건 조정",   tone:"info", step:7 },
  { key:"signed",   name:"계약",        tone:"grn",  step:8 },
  { key:"done",     name:"완료",        tone:"grn",  step:9 },
  /* ⚠️ 아래 넷은 **차례가 아닙니다** — step 을 주지 않습니다.
     주면 진행 막대가 "보류" 를 8단계처럼 그립니다. */
  { key:"hold",     name:"보류",        tone:"warn", step:0 },
  { key:"lost",     name:"진행 안 함",  tone:"bad",  step:0 },
  { key:"fee_wait", name:"수수료 대기", tone:"warn", step:0 },
  { key:"fee_done", name:"수수료 완료", tone:"grn",  step:0 }
];

/* 견적 상태 넷 — ⚠️ DB `quote.state` 의 check 와 같아야 합니다 */
window.AM_QUOTE_ST = [
  { key:"open",      name:"받은 견적",   tone:"info" },
  { key:"chosen",    name:"고른 견적",   tone:"grn"  },
  { key:"passed",    name:"고르지 않음", tone:"ink"  },
  /* ⚠️ 손님에게는 **안 보입니다** (0008 의 quote_requester 정책).
     업체 자기 화면에서만 보이는 말입니다. */
  { key:"withdrawn", name:"거둔 견적",   tone:"bad"  }
];

/* 부가세 처리 셋 — ⚠️ DB `fee_vat` enum 과 같아야 합니다.
   ⚠️⚠️ **"별도" 와 "포함" 을 헷갈리면 금액이 10% 틀립니다.** 손님이
   보는 자리에서는 금액 옆에 이 말을 **반드시** 같이 적습니다. */
window.AM_VAT = [
  { key:"add",  name:"부가세 별도" },
  { key:"incl", name:"부가세 포함" },
  { key:"free", name:"면세" }
];

/* 배정 상태 셋 — ⚠️ DB `assignment.state` 의 글자와 같아야 합니다
   (enum 이 아니라 text 입니다 — 0001). */
window.AM_ASSIGN_ST = [
  { key:"sent",     name:"전달됨",  tone:"ok"   },
  { key:"accepted", name:"수락",    tone:"grn"  },
  { key:"declined", name:"거절",    tone:"bad"  }
];

/* ── 꺼내 쓰는 자리 ──────────────────────────────────────────────
   ⚠️⚠️ **모르는 키를 조용히 빈 칸으로 만들지 않습니다.** 키 그대로
   돌려줍니다 — 빈 칸이면 화면과 DB 가 어긋난 것을 아무도 모릅니다
   (관리자 화면의 하위 분류에서 쓴 것과 같은 규칙). */
function amPick(list, key){
  for(var i = 0; i < list.length; i++) if(list[i].key === key) return list[i];
  return null;
}
window.amDealSt   = function(k){ return amPick(window.AM_DEAL_ST, k); };
window.amQuoteSt  = function(k){ return amPick(window.AM_QUOTE_ST, k); };
window.amAssignSt = function(k){ return amPick(window.AM_ASSIGN_ST, k); };
window.amVat      = function(k){ return amPick(window.AM_VAT, k); };

window.amDealName = function(k){
  var s = window.amDealSt(k);   return s ? s.name : String(k || "");
};
window.amQuoteName = function(k){
  var s = window.amQuoteSt(k);  return s ? s.name : String(k || "");
};
window.amAssignName = function(k){
  var s = window.amAssignSt(k); return s ? s.name : String(k || "");
};
window.amVatName = function(k){
  var s = window.amVat(k);      return s ? s.name : String(k || "");
};

/* 손님에게 "어디까지 왔나" — ⚠️ 차례가 아닌 상태는 **막대를 안 그립니다**
   (null 을 돌려줍니다). 0 으로 돌려주면 "접수 전" 처럼 보입니다 —
   0 을 기다리는 자리에 `||` 를 쓰지 않는 것과 같은 까닭입니다. */
window.AM_DEAL_STEPS = 9;
window.amDealStep = function(k){
  var s = window.amDealSt(k);
  if(!s || !s.step) return null;
  return s.step;
};

/* 돈 — ⚠️⚠️ **`won()` 은 js/components/base.js 한 곳에** 있습니다.
   여기서 또 적으면 천 단위 쉼표 규칙이 두 곳이 됩니다.
   ⚠️ 부가세 말을 **금액과 붙여서** 내보냅니다 — 떼어 놓으면 화면마다
   한쪽만 적습니다. */
window.amQuoteAmount = function(q){
  if(!q || q.amount === null || q.amount === undefined) return null;
  return window.won(q.amount) + "원 · " + window.amVatName(q.vat);
};
