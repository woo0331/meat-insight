/* ════════════════════════════════════════════════════════════════════
   매각 지표의 **말과 뜻** — 한 곳입니다 (2차 지시서 §9)

   ⚠️⚠️⚠️ **지표는 숫자가 아니라 정의입니다.** "유효 상담 100건" 은
   아무 뜻도 없고, "업체가 수락한 요청 100건" 은 뜻이 있습니다. 정의를
   적어 두지 않으면 다음 사람이 다른 식으로 세고, 그 둘이 같은 이름을
   달고 투자자에게 갑니다. 그래서 **이름 옆에 뜻을 같이** 둡니다 —
   화면이 숫자 밑에 그 글을 그대로 찍습니다.

   ⚠️⚠️ **세는 식은 여기 없습니다.** 식은 DB(`biz_metrics()` · 0033)
   한 곳에 있고, 여기는 **그것을 사람 말로 옮긴 것**뿐입니다. 식을 두
   곳에 적으면 한쪽만 고쳐서 조용히 어긋납니다.
   ⚠️ `tools/sql/metrics.js` 가 **DB 가 내는 키**와 여기 적은 키를
   돌려 보고 맞춰 봅니다 — 한쪽에만 있으면 검사가 떨어집니다.

   ⚠️⚠️ **못 재는 것을 잰 척하지 않습니다.** 방문자 기준 MAU 는 재는
   장치가 없어서 **아직 못 냅니다** (절대 규칙 5). 대신 로그인해서
   실제로 뭔가를 한 회원 수를 내고, 그것이 방문자가 아니라는 것을
   화면에 적습니다.
   ════════════════════════════════════════════════════════════════════ */

/* 묶음 — 화면이 이 차례로 그립니다.
   ⚠️⚠️ **거래액과 순매출을 한 묶음에 넣지 않습니다.** 둘을 나란히
   놓으면 보는 사람이 더합니다 — 거래액은 손님이 업체에 낸 돈이고
   우리 돈이 아닙니다 (2차 지시서 §9 가 "분리" 라고 적은 까닭). */
window.AM_METRIC_GROUPS = [
  { key:"flow",  name:"상담 흐름",
    note:"요청이 들어와 업체가 받기까지. 비율의 분모는 그달 요청 수입니다." },
  { key:"gmv",   name:"거래액 (손님이 업체에 낸 돈)",
    note:"플랫폼 매출이 아닙니다. 중개한 거래의 크기입니다." },
  { key:"rev",   name:"플랫폼이 버는 돈",
    note:"⚠️ 입금 기록이 있는 것은 수수료뿐입니다. 광고 · 멤버십은 금액이 적혀 있을 뿐 받은 기록이 없습니다." },
  { key:"user",  name:"회원",
    note:"⚠️ 방문자 수가 아닙니다 — 재는 장치가 아직 없습니다." }
];

/* 지표 — ⚠️ `key` 는 DB 가 내는 키와 **글자까지** 같아야 합니다.
   `unit` 은 "원" · "건" · "%" 셋뿐입니다 (화면이 그것으로 꼴을 고릅니다). */
window.AM_METRICS = [
  { key:"req", group:"flow", unit:"건", name:"들어온 요청",
    what:"그달에 접수된 매칭 요청. 검사용 업체에만 넘긴 요청은 뺍니다." },
  { key:"req_test", group:"flow", unit:"건", name:"그중 검사용",
    /* ⚠️ 0 이어도 줄을 냅니다 — "검사용이 안 섞였다" 도 알아야 하는
       값입니다. 0 인 줄을 숨기면 그 지표가 있는 줄도 모릅니다. */
    what:"검사용 업체에만 넘어간 요청. 위 숫자에서 **뺀** 수입니다." },
  { key:"assigned", group:"flow", unit:"건", name:"업체에 넘긴 요청",
    what:"제3자 제공 동의를 받고 실제 업체에 전달한 요청." },
  { key:"accepted", group:"flow", unit:"건", name:"유효 상담",
    what:"업체가 **수락한** 요청. 전화가 닿았고 업체가 맡기로 한 건입니다." },
  { key:"rate_valid", group:"flow", unit:"%", name:"유효 상담 비율",
    what:"유효 상담 ÷ 들어온 요청. ⚠️ 요청이 0건인 달은 비율을 내지 않습니다." },
  { key:"quoted", group:"flow", unit:"건", name:"견적이 나간 요청",
    what:"업체가 금액을 적어 낸 요청. 거둔 견적은 빼지 않습니다." },

  { key:"deals", group:"gmv", unit:"건", name:"계약",
    what:"계약일(signed_at)이 그달인 건." },
  { key:"gmv", group:"gmv", unit:"원", name:"거래액",
    what:"그달 계약의 계약금액 합. ⚠️ 플랫폼 매출이 아닙니다." },
  { key:"gmv_missing", group:"gmv", unit:"건", name:"금액이 안 적힌 계약",
    what:"계약은 됐는데 금액 칸이 빈 건. ⚠️ 이만큼 거래액이 **덜 잡혀** 있습니다." },

  { key:"fee_paid", group:"rev", unit:"원", name:"받은 수수료",
    what:"입금일(paid_at)이 그달인 실제 입금액. **입금 기록이 있는 유일한 돈**입니다." },
  { key:"fee_set", group:"rev", unit:"원", name:"확정한 수수료",
    what:"수수료 확정일(fee_at)이 그달인 확정액(부가세 포함). 받은 돈과 다릅니다." },
  { key:"fee_due", group:"rev", unit:"원", name:"확정했는데 못 받은 것",
    what:"확정한 수수료 − 받은 수수료. ⚠️ 음수면 지난달 확정분이 이달에 들어온 것입니다." },
  { key:"ad", group:"rev", unit:"원", name:"광고 (청구 기록 없음)",
    what:"집행 시작일이 그달인 광고의 금액 합. ⚠️ 받은 기록이 아니라 **적어 둔 금액**입니다." },
  { key:"mship", group:"rev", unit:"원", name:"멤버십 월정액 (청구 기록 없음)",
    what:"그달에 살아 있던 멤버십의 월정액 합. ⚠️ 청구 · 입금 장치가 아직 없습니다." },

  { key:"users", group:"user", unit:"명", name:"활동 회원",
    what:"그달에 로그인해서 실제로 뭔가를 한 **일반 회원**. ⚠️ 운영자와 업체는 뺍니다. **방문자 수가 아닙니다.**" }
];

window.amMetric = function(k){
  var L = window.AM_METRICS;
  for(var i = 0; i < L.length; i++) if(L[i].key === k) return L[i];
  return null;
};
window.amMetricsOf = function(groupKey){
  return window.AM_METRICS.filter(function(m){ return m.group === groupKey; });
};

/* 숫자를 사람이 읽는 꼴로 — ⚠️⚠️ **null 과 0 은 다릅니다.**
   `null` 은 "낼 수 없다"(분모가 0 인 비율), `0` 은 "0 이다" 입니다.
   여기서 `||` 를 쓰면 0 이 "못 냄" 으로 바뀝니다. */
window.amMetricText = function(key, v){
  var m = window.amMetric(key);
  if(!m) return String(v);
  if(v === null || v === undefined) return "—";
  if(m.unit === "%"){
    /* ⚠️ 소수 한 자리까지. 반올림해서 100% 가 되는 것을 막지 않습니다 —
       실제로 전부 수락했으면 100% 가 맞습니다. */
    return (Math.round(Number(v) * 10) / 10) + "%";
  }
  return window.won(Number(v)) + m.unit;
};

/* 달 이름 — DB 가 `2026-11` 로 줍니다 (한국 시각 기준) */
window.amMonthName = function(ym){
  var p = String(ym || "").split("-");
  if(p.length !== 2) return String(ym || "");
  return p[0] + "년 " + Number(p[1]) + "월";
};
