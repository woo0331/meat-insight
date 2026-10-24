

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

window.AM_FEE_VAT = [
  { key:"add",  name:"부가세 별도", lead:"수수료에 10%를 더해 청구합니다." },
  { key:"incl", name:"부가세 포함", lead:"적힌 금액 안에 10%가 들어 있습니다." },
  { key:"free", name:"면세",        lead:"부가세가 붙지 않습니다." }
];

window.AM_FEE_WHEN = [
  { key:"lead_ok",  name:"유효 문의 확인 후",  need:"문의가 실제 상담으로 이어졌는지" },
  { key:"signed",   name:"계약 체결 확인 후",  need:"계약서 또는 계약 사실 증빙" },
  { key:"done",     name:"이행 완료 확인 후",  need:"설치·시공 완료 증빙" },
  { key:"paid",     name:"업체 수금 확인 후",  need:"업체가 손님에게 받았다는 증빙" }
];

window.AM_FEE_CYCLE = [
  { key:"now",     name:"건별 즉시" },
  { key:"monthly", name:"월 1회" },
  { key:"half",    name:"월 2회" }
];

window.amFeeSnap = function(policy, at){
  if(!policy || typeof policy !== "object") return null;
  var o = {}, k;
  for(k in policy) if(Object.prototype.hasOwnProperty.call(policy, k)) o[k] = policy[k];
  o.snapAt = at || new Date().toISOString();
  return o;
};

window.amFeeFromDb = function(row){
  if(!row || typeof row !== "object") return null;
  function n(v){
    if(v === null || v === undefined || v === "") return null;
    var x = Number(v);
    return isFinite(x) ? x : null;
  }
  return {
    id:      row.id,
    provider: row.provider_id,
    offer:   row.offer_id || "",
    type:    row.type,
    flat:    n(row.flat),
    rate:    n(row.rate),
    min:     n(row.min_fee),
    max:     n(row.max_fee),
    vat:     row.vat,
    when:    row.confirm_when,
    cycle:   row.cycle,
    refund:  row.refund_rule || "",
    from:    row.from_date || null,
    to:      row.to_date   || null,
    active:  row.active !== false
  };
};

window.amFeeType = function(key){
  var L = window.AM_FEE_TYPE || [], i;
  for(i = 0; i < L.length; i++) if(L[i].key === key) return L[i];
  return null;
};

function num(v){
  return (typeof v === "number" && isFinite(v)) ? v : null;
}

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

  }
  if(p.type === "rate" || p.type === "base_rate"){
    if(rate === null) return "요율을 적어 주세요";
    if(rate <= 0)     return "요율이 0 이하입니다 — 비율 수수료가 아닙니다";

    if(rate > 100)    return "요율이 100%를 넘습니다";
    if(p.type === "base_rate"){
      if(flat === null) return "기본 수수료를 적어 주세요";
      if(flat < 0)      return "기본 수수료가 음수입니다";
    }
  }
  if(min !== null && min < 0) return "최소 수수료가 음수입니다";
  if(max !== null && max < 0) return "최대 수수료가 음수입니다";

  if(min !== null && max !== null && min > max)
    return "최소 수수료가 최대 수수료보다 큽니다";

  if(p.from && p.to && String(p.from) > String(p.to))
    return "적용 시작일이 종료일보다 늦습니다";
  return "";
};

window.amFeeCalc = function(snap, d, opt){
  opt = opt || {}; d = d || {};
  var bad = window.amFeeBadPolicy(snap);
  if(bad) return { ok:false, why:bad };

  if(!opt.preview && !snap.snapAt)
    return { ok:false, why:"정책 사본이 아닙니다 — amFeeSnap() 을 거치세요" };

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

    if(sell < cost) return { ok:false, why:"판매가가 매입가보다 낮습니다 — 마진이 없습니다" };
    base = sell;
    fee  = sell - cost;
  }
  else {
    var amount = num(d.amount);
    if(amount < 0) return { ok:false, why:"계약금액이 음수입니다" };
    base = amount;
    fee  = Math.round(amount * rate / 100);
    if(snap.type === "base_rate") fee += Math.round(flat);

    if(fee === 0 && amount > 0 && (rate > 0 || flat > 0))
      return { ok:false, why:"수수료가 0원으로 떨어집니다 — 요율과 계약금액을 확인해 주세요" };
  }

  var min = num(snap.min), max = num(snap.max);
  var clamped = "";
  if(min !== null && fee < min){ fee = Math.round(min); clamped = "min"; }
  if(max !== null && fee > max){ fee = Math.round(max); clamped = "max"; }

  if(base !== null && base > 0 && fee > base)
    return { ok:false, why:"수수료(" + fee.toLocaleString("ko-KR") +
      "원)가 계약금액(" + base.toLocaleString("ko-KR") +
      "원)보다 큽니다 — 정책의 최소 수수료를 확인해 주세요" };

  if(fee < 0) return { ok:false, why:"수수료가 음수로 계산됩니다" };

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

window.amFeeClawback = function(snap, was, d){
  if(num(was) === null) return { ok:false, why:"확정했던 수수료가 없습니다" };
  var r = window.amFeeCalc(snap, d);

  if(!r.ok){
    if(d && d.cancelled === true)
      return { ok:true, was:was, now:0, back:was, note:"계약 취소 — 전액 환수" };
    return r;
  }
  return { ok:true, was:was, now:r.fee, back:was - r.fee };
};
