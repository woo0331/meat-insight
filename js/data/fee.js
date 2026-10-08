/* ════════════════════════════════════════════════════════════════════
   수수료 · 정산 (지시서 §9)

   ⚠️⚠️ **이 저장소에서 제일 위험한 파일입니다.** 계산기가 틀리면
   화면이 흉할 뿐이지만, 여기가 틀리면 **업체에게 잘못된 돈을
   청구**합니다. CLAUDE.md 가 적어 둔 사고 둘이 바로 이 종류입니다 —
   손익분기 85조원(변동비 99.99%)과 권리금 회수 25,000년(월 순이익
   0.01). 둘 다 **경계값은 막고 그 바로 아래를 안 넣어 봐서** 났습니다.
   그래서 `tools/test-fee.js` 가 **경계 바로 아래**를 전부 넣어 봅니다.

   ── §9 가 요구한 것과 이 파일이 지키는 것 ────────────────
   "계약금액, 수수료율, 수수료 확정액, 실제 입금액을 각각 구분해 저장"
     → 넷이 **다른 칸**입니다. amFeeCalc() 는 확정액까지만 내놓고
       입금액은 **건드리지 않습니다** (deal.js 가 fee_done 에서 받습니다)
   "기존 계약에 적용된 수수료 정책은 추후 정책이 변경되더라도 유지"
     → amFeeSnap() 이 **박아 둔 사본**을 만들고, amFeeCalc() 는
       사본이 아니면 거절합니다 (preview 가 아닐 때)
   "계약금액이 신청 시점에 확정되지 않은 경우 … 업체 상담 후 입력"
     → 계약금액이 없으면 **0 으로 계산하지 않고 거절합니다**
   §13 "계약이 성사되지 않았는데 수수료가 확정된 것처럼 처리하지 않음"
     → 확정은 deal.js 의 done → fee_wait(관리자 전용)에서만 일어납니다.
       이 파일은 **계산만** 합니다

   ⚠️ 돈은 **원 단위 정수**로 다룹니다. 소수로 들고 있으면 반올림이
   조금씩 어긋나고, 그 차이가 정산서에서 드러납니다.
   ⚠️ 요율(`rate`)은 **퍼센트 숫자**입니다 (3.5 = 3.5%).
   ════════════════════════════════════════════════════════════════════ */

/* ── 수익모델 여섯 (§9 의 차례 그대로) ───────────────────────
   needs : 계산에 반드시 있어야 하는 값
   ⚠️ key 를 바꾸지 마세요 — 정책 사본과 DB 행에 그대로 남습니다. */
window.AM_FEE_TYPE = [
  { key:"lead",      name:"유효 문의당 정액",       needs:[],
    lead:"문의가 유효하다고 확인되면 건당 정액입니다." },
  { key:"close",     name:"계약·설치 완료당 정액",   needs:[],
    lead:"계약과 이행이 끝나면 건당 정액입니다." },
  { key:"rate",      name:"계약금액의 일정 비율",     needs:["amount"],
    lead:"계약금액에 요율을 곱합니다." },
  { key:"base_rate", name:"기본 + 계약금액 비례",     needs:["amount"],
    lead:"기본 수수료에 계약금액 비례분을 더합니다." },
  { key:"margin",    name:"직접 판매 · 유통 마진",    needs:["sell","cost"],
    lead:"판매가에서 매입가를 뺀 것이 수익입니다." },
  { key:"sub",       name:"반복 발주 · 구독형",        needs:["times"],
    lead:"회차마다 정액입니다." }
];

/* ── 부가세 처리 기준 (§9 "부가세 처리 기준") ───────────────── */
window.AM_FEE_VAT = [
  { key:"add",  name:"부가세 별도", lead:"수수료에 10%를 더해 청구합니다." },
  { key:"incl", name:"부가세 포함", lead:"적힌 금액 안에 10%가 들어 있습니다." },
  { key:"free", name:"면세",        lead:"부가세가 붙지 않습니다." }
];

/* ── 수수료가 확정되는 조건 (§9 "수수료 확정 조건") ──────────
   ⚠️⚠️ 어느 것을 고르셔도 **확정은 관리자가 누릅니다** (§8 · §13).
   이 값은 "관리자가 무엇을 보고 눌러야 하는가" 입니다. */
window.AM_FEE_WHEN = [
  { key:"lead_ok",  name:"유효 문의 확인 후",  need:"문의가 실제 상담으로 이어졌는지" },
  { key:"signed",   name:"계약 체결 확인 후",  need:"계약서 또는 계약 사실 증빙" },
  { key:"done",     name:"이행 완료 확인 후",  need:"설치·시공 완료 증빙" },
  { key:"paid",     name:"업체 수금 확인 후",  need:"업체가 손님에게 받았다는 증빙" }
];

/* ── 정산 주기 (§9 "정산 주기") ─────────────────────────────── */
window.AM_FEE_CYCLE = [
  { key:"now",     name:"건별 즉시" },
  { key:"monthly", name:"월 1회" },
  { key:"half",    name:"월 2회" }
];

/* ── 정책 사본 ────────────────────────────────────────────────
   §9 "기존 계약에 적용된 수수료 정책은 추후 정책이 변경되더라도
   유지되어야 한다."

   ⚠️⚠️ 정책을 **가리키게** 두면(policyId 만 저장) 요율을 고친 날
   **지난 계약의 수수료가 같이 바뀝니다.** 그래서 계약에 **박아 둔
   사본**을 붙입니다. 사본에는 `snapAt`(박아 둔 날)이 있습니다. */
window.amFeeSnap = function(policy, at){
  if(!policy || typeof policy !== "object") return null;
  var o = {}, k;
  for(k in policy) if(Object.prototype.hasOwnProperty.call(policy, k)) o[k] = policy[k];
  o.snapAt = at || new Date().toISOString();
  return o;
};

window.amFeeType = function(key){
  var L = window.AM_FEE_TYPE || [], i;
  for(i = 0; i < L.length; i++) if(L[i].key === key) return L[i];
  return null;
};

/* 숫자인가 — ⚠️ `0` 은 숫자입니다 (적지 않은 것이 아닙니다) */
function num(v){
  return (typeof v === "number" && isFinite(v)) ? v : null;
}

/* ── 정책이 말이 되는가 ────────────────────────────────────────
   ⚠️ 정책을 **저장하기 전에** 부릅니다. 저장된 뒤에 틀린 것을 찾으면
   그 정책으로 이미 계산된 건이 생깁니다. */
window.amFeeBadPolicy = function(p){
  if(!p || typeof p !== "object") return "정책이 없습니다";
  var t = window.amFeeType(p.type);
  if(!t) return "없는 수익모델입니다 — " + p.type;

  var vat = (window.AM_FEE_VAT || []).filter(function(x){ return x.key === p.vat; });
  if(!vat.length) return "부가세 처리 기준을 골라 주세요";
  var when = (window.AM_FEE_WHEN || []).filter(function(x){ return x.key === p.when; });
  if(!when.length) return "수수료 확정 조건을 골라 주세요";
  var cyc = (window.AM_FEE_CYCLE || []).filter(function(x){ return x.key === p.cycle; });
  if(!cyc.length) return "정산 주기를 골라 주세요";

  var flat = num(p.flat), rate = num(p.rate),
      min = num(p.min), max = num(p.max);

  if(p.type === "lead" || p.type === "close" || p.type === "sub"){
    if(flat === null) return "정액 수수료를 적어 주세요";
    if(flat < 0)      return "정액 수수료가 음수입니다";
    /* ⚠️ 0 원 정액은 "무료" 라는 뜻이라 말이 됩니다 — 막지 않습니다 */
  }
  if(p.type === "rate" || p.type === "base_rate"){
    if(rate === null) return "요율을 적어 주세요";
    if(rate <= 0)     return "요율이 0 이하입니다 — 비율 수수료가 아닙니다";
    /* ⚠️⚠️ 100% 를 넘는 수수료는 계약금액보다 많이 받는다는 말입니다 */
    if(rate > 100)    return "요율이 100%를 넘습니다";
    if(p.type === "base_rate"){
      if(flat === null) return "기본 수수료를 적어 주세요";
      if(flat < 0)      return "기본 수수료가 음수입니다";
    }
  }
  if(min !== null && min < 0) return "최소 수수료가 음수입니다";
  if(max !== null && max < 0) return "최대 수수료가 음수입니다";
  /* ⚠️ 둘 다 있으면 min ≤ max 여야 합니다 — 뒤집히면 어느 쪽을 따라야
     할지 코드가 정하게 되고, 그건 계약서와 다른 답이 나오는 길입니다 */
  if(min !== null && max !== null && min > max)
    return "최소 수수료가 최대 수수료보다 큽니다";

  if(p.from && p.to && String(p.from) > String(p.to))
    return "적용 시작일이 종료일보다 늦습니다";
  return "";
};

/* ── 계산 ─────────────────────────────────────────────────────
   snap : amFeeSnap() 이 만든 사본 (preview 일 때는 정책 그대로도 됩니다)
   d    : { amount, sell, cost, times, at }
          amount  계약금액 (원)        — rate · base_rate
          sell·cost 판매가 · 매입가 (원) — margin
          times   회차                  — sub
          at      기준일 (YYYY-MM-DD)   — 정책 적용 기간 확인
   opt  : { preview:true } 면 사본이 아니어도 계산합니다 (예상 안내용)

   돌려주는 것
     { ok:true, base, fee, supply, vat, total, type, name, preview }
     { ok:false, why:"..." }

   ⚠️⚠️ **0 을 돌려주지 않습니다.** 계약금액이 아직 없으면 0 원이
   아니라 **"아직 없습니다"** 입니다 — 0 을 돌려주면 그 값이 정산서에
   그대로 올라갑니다. */
window.amFeeCalc = function(snap, d, opt){
  opt = opt || {}; d = d || {};
  var bad = window.amFeeBadPolicy(snap);
  if(bad) return { ok:false, why:bad };

  if(!opt.preview && !snap.snapAt)
    return { ok:false, why:"정책 사본이 아닙니다 — amFeeSnap() 을 거치세요" };

  /* 적용 기간 (§9 "정책 적용 시작일과 종료일") */
  var at = d.at ? String(d.at).slice(0, 10) : null;
  if(at){
    if(snap.from && at < String(snap.from).slice(0, 10))
      return { ok:false, why:"이 정책의 적용 시작일 — " + snap.from };
    if(snap.to && at > String(snap.to).slice(0, 10))
      return { ok:false, why:"이 정책의 적용 종료일 — " + snap.to };
  }

  var t = window.amFeeType(snap.type);
  var flat = num(snap.flat) || 0, rate = num(snap.rate) || 0;
  var base = null, fee = null, i;

  /* 꼭 있어야 하는 값 — ⚠️ 없으면 0 이 아니라 거절입니다 */
  var LABEL = { amount:"계약금액", sell:"판매가", cost:"매입가", times:"회차" };
  for(i = 0; i < t.needs.length; i++){
    if(num(d[t.needs[i]]) === null)
      return { ok:false, why:LABEL[t.needs[i]] + "이 아직 없습니다" };
  }

  if(snap.type === "lead" || snap.type === "close"){
    fee = Math.round(flat);
  }
  else if(snap.type === "sub"){
    var times = num(d.times);
    if(times < 1 || Math.round(times) !== times)
      return { ok:false, why:"회차는 1 이상의 정수여야 합니다" };
    fee  = Math.round(flat) * times;
    base = null;
  }
  else if(snap.type === "margin"){
    var sell = num(d.sell), cost = num(d.cost);
    if(sell < 0 || cost < 0) return { ok:false, why:"판매가 · 매입가가 음수입니다" };
    /* ⚠️ 마진이 음수면 **손실**입니다. 수수료로 적으면 업체에게 돈을
       주는 꼴이 되니, 숫자 대신 사실을 말합니다. */
    if(sell < cost) return { ok:false, why:"판매가가 매입가보다 낮습니다 — 마진이 없습니다" };
    base = sell;
    fee  = sell - cost;
  }
  else {                                  /* rate · base_rate */
    var amount = num(d.amount);
    if(amount < 0) return { ok:false, why:"계약금액이 음수입니다" };
    base = amount;
    fee  = Math.round(amount * rate / 100);
    if(snap.type === "base_rate") fee += Math.round(flat);

    /* ⚠️⚠️ **경계값 바로 아래** — 요율도 계약금액도 0 보다 큰데 계산이
       0 원으로 떨어지는 자리입니다 (요율 0.0001% · 계약금액 1,000원).
       0 원을 내놓으면 정산서에 "수수료 0원" 이 그대로 올라가고,
       그건 계산이 아니라 **잘못된 확신**입니다. 손익분기가 변동비
       99.99% 에서 85조원을 내놓은 것과 같은 종류입니다. */
    if(fee === 0 && amount > 0 && (rate > 0 || flat > 0))
      return { ok:false, why:"수수료가 0원으로 떨어집니다 — 요율과 계약금액을 확인해 주세요" };
  }

  /* 최소 · 최대 (§9) — ⚠️ 차례가 중요합니다. 최소를 먼저 올리고 최대로
     누릅니다. 거꾸로 하면 min > max 인 정책에서 결과가 달라지는데,
     그 정책은 위에서 이미 막았습니다 (둘 다 막아 둡니다). */
  var min = num(snap.min), max = num(snap.max);
  var clamped = "";
  if(min !== null && fee < min){ fee = Math.round(min); clamped = "min"; }
  if(max !== null && fee > max){ fee = Math.round(max); clamped = "max"; }

  /* ⚠️⚠️ 수수료가 계약금액보다 크면 멈춥니다. 최소 수수료 100만원
     정책에 50만원 계약이 들어오면 그렇게 됩니다 — 계산은 맞지만
     청구서로는 말이 안 됩니다. 사람이 봐야 하는 자리입니다. */
  if(base !== null && base > 0 && fee > base)
    return { ok:false, why:"수수료(" + fee.toLocaleString("ko-KR") +
      "원)가 계약금액(" + base.toLocaleString("ko-KR") +
      "원)보다 큽니다 — 정책의 최소 수수료를 확인해 주세요" };

  if(fee < 0) return { ok:false, why:"수수료가 음수로 계산됩니다" };

  /* 부가세 */
  var supply, vatAmt, total;
  if(snap.vat === "add"){       supply = fee; vatAmt = Math.round(fee * 0.1); total = supply + vatAmt; }
  else if(snap.vat === "incl"){ total  = fee; supply = Math.round(fee / 1.1); vatAmt = total - supply; }
  else {                        supply = fee; vatAmt = 0;                     total = fee; }

  return { ok:true,
    type:snap.type, name:t.name,
    base:base, fee:fee, supply:supply, vat:vatAmt, total:total,
    clamped:clamped,
    preview:!snap.snapAt,
    when:snap.when, cycle:snap.cycle };
};

/* ── 환수 · 부분환불 (§9 "취소·환불·환수 조건") ───────────────
   계약금액이 줄거나 취소되면 **이미 확정한 수수료와의 차액**이
   환수액입니다.

   ⚠️⚠️ 새로 계산한 값으로 **갈아 치우지 않습니다.** 확정했던 액을
   그대로 두고 차액을 따로 적습니다 — 갈아 치우면 "얼마를 확정했다가
   얼마를 돌려받았는가" 가 기록에서 사라집니다.

   돌려주는 것 : { ok:true, was, now, back }   back > 0 이면 환수할 돈 */
window.amFeeClawback = function(snap, was, d){
  if(num(was) === null) return { ok:false, why:"확정했던 수수료가 없습니다" };
  var r = window.amFeeCalc(snap, d);
  /* 계약이 통째로 취소되어 계약금액이 없어진 경우는 전액 환수입니다 */
  if(!r.ok){
    if(d && d.cancelled === true)
      return { ok:true, was:was, now:0, back:was, note:"계약 취소 — 전액 환수" };
    return r;
  }
  return { ok:true, was:was, now:r.fee, back:was - r.fee };
};
