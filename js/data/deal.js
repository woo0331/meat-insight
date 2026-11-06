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

/* 수수료 — ⚠️ DB 의 enum 셋과 같아야 합니다 (0001 · check-deal 이 봅니다).
   ⚠️⚠️ **고객은 수수료 표를 아예 못 봅니다** (0001 의 fee_mine) —
   우리와 업체 사이의 일인데 보여 주면 자기가 내는 돈으로 읽힙니다.
   그래서 이 말들은 **업체 작업실과 관리자 화면에서만** 씁니다. */
window.AM_FEE_TYPE = [
  { key:"lead",      name:"건당 (연결 1건마다)" },
  { key:"close",     name:"성사당 (계약될 때)" },
  { key:"rate",      name:"거래액의 %" },
  { key:"base_rate", name:"기본료 + %" },
  { key:"margin",    name:"마진 배분" },
  { key:"sub",       name:"월 정액" },
  /* ⚠️⚠️⚠️ **0015 가 더한 둘이 2026-11-06 까지 여기 없었습니다.**
     `alter type fee_type add value` 로 들어온 값이라 `check-deal` 의
     `enumKeys()` 가 **`create type` 만 읽어** 못 봤습니다 — DB 에는
     있는데 화면에 말이 없으니, 그 갈래로 정책을 하나 만드는 날
     업체 화면과 관리자 화면에 **영문 키가 그대로** 찍힐 참이었습니다
     (0006 이 더한 `hold` 는 우연히 적혀 있어 안 걸렸습니다).
     ⚠️ 이름은 0015 가 적어 둔 말 그대로입니다 — 셈법을 **지어내지
     않습니다**(`retain` 의 식은 그 파일에 없습니다). */
  { key:"mrr_rate",  name:"유지 — 월 요금의 %" },
  { key:"retain",    name:"유지 — 유지되는 동안" }
];
window.AM_FEE_WHEN = [
  { key:"lead_ok", name:"연결이 확인된 때" },
  { key:"signed",  name:"계약한 때" },
  { key:"done",    name:"이행이 끝난 때" },
  { key:"paid",    name:"손님이 낸 때" },
  /* ⚠️ 0015 — 같은 자리입니다 (설치한 날 전부를 확정하지 않으려고
     "약정 유지 확인 후" 를 따로 둡니다) */
  { key:"kept",    name:"약정 유지 확인 후" }
];
window.AM_FEE_CYCLE = [
  { key:"now",     name:"그때 바로" },
  { key:"monthly", name:"달마다" },
  { key:"half",    name:"보름마다" }
];
window.AM_SETTLE_ST = [
  { key:"wait", name:"지급 대기", tone:"warn" },
  { key:"paid", name:"지급 완료", tone:"grn"  },
  { key:"hold", name:"보류",      tone:"bad"  }
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
/* 만나는 방법 셋 · 일정 상태 셋 — ⚠️ DB `appointment` 의 check 와
   같아야 합니다 (0034). `tools/check-deal.js` 가 맞춰 봅니다. */
window.AM_APPT_KIND = [
  { key:"visit",  name:"방문" },
  { key:"call",   name:"통화" },
  { key:"online", name:"비대면" }
];
window.AM_APPT_ST = [
  { key:"set",    name:"잡힘",   tone:"info" },
  { key:"done",   name:"만났음", tone:"grn"  },
  { key:"cancel", name:"취소",   tone:"bad"  }
];

/* 고객센터 문의 — 갈래 넷 · 상태 넷 (DB 는 0045)

   ⚠️⚠️⚠️ **말을 두 벌 담습니다 — 키는 한 벌입니다.** 운영자가 보는
   말과 손님이 보는 말이 다릅니다 ("새 문의" 는 운영자의 말이고, 손님
   화면에 찍으면 운영자에게 할 말을 손님에게 찍는 것입니다 · 절대
   규칙 3). 그렇다고 표를 둘로 가르면 **키 묶음이 둘**이 되어 한쪽만
   고치는 날 조용히 어긋납니다 — 그래서 줄은 하나이고 칸이 둘입니다.
   ⚠️ `tools/check-deal.js` 가 0045 의 check 와 **키**를 맞춰 봅니다
   (한글은 안 봅니다 — 그건 말입니다).

   ⚠️⚠️ **손님 쪽 말에 "문자로 알려 드립니다" 를 적지 않습니다** —
   우리는 밖으로 안 보냅니다 (0050 · 절대 규칙 5). 답이 왔다는 것은
   `/my` 에서 보십니다.

   ⚠️ `short` 는 **운영자 목록**의 말입니다 — 한 줄에 여러 건이 쌓이는
   자리라 긴 말을 쓰면 줄이 넘칩니다. 손님에게 여쭙는 자리(`/help` 의
   고르는 칸)는 `name` 을 씁니다. */
window.AM_INQ_KIND = [
  { key:"use",     name:"이용 중 막히는 곳",  short:"이용 문의" },
  { key:"biz",     name:"업체 · 제휴 문의",   short:"업체 · 제휴" },
  { key:"privacy", name:"개인정보 (열람 · 정정 · 삭제 · 동의 철회)",
                                              short:"개인정보" },
  { key:"etc",     name:"그 밖의 문의",       short:"그 밖" }
];
window.AM_INQ_ST = [
  { key:"open",      name:"새 문의", mine:"접수됐습니다",       tone:"ok"   },
  { key:"reviewing", name:"확인 중", mine:"확인하고 있습니다",   tone:"info" },
  /* ⚠️ "답변이 **왔습니다**" 가 아니라 "올라왔습니다" 입니다 — 우리는
     아무 데로도 안 보냅니다 (알림 제목과 같은 말로 둡니다). */
  { key:"answered",  name:"답변함",  mine:"답변이 올라왔습니다", tone:"grn"  },
  /* ⚠️ 손님에게 "닫음" 이라고 적지 않습니다 — 내 문의가 닫혔다는 말은
     거절당한 것처럼 읽힙니다. 끝난 것은 맞고, 까닭은 답변에 있습니다. */
  { key:"closed",    name:"닫음",    mine:"끝난 문의입니다",     tone:"ink"  }
];
window.amInqKindName = function(k){
  var x = amPick(window.AM_INQ_KIND, k); return x ? x.name : String(k || "");
};
window.amInqKindShort = function(k){
  var x = amPick(window.AM_INQ_KIND, k);
  return x ? (x.short || x.name) : String(k || "");
};
window.amInqSt = function(k){ return amPick(window.AM_INQ_ST, k); };

window.amDealSt   = function(k){ return amPick(window.AM_DEAL_ST, k); };
window.amApptKind = function(k){ return amPick(window.AM_APPT_KIND, k); };
window.amApptSt   = function(k){ return amPick(window.AM_APPT_ST, k); };
window.amApptKindName = function(k){
  var x = window.amApptKind(k); return x ? x.name : String(k || "");
};
window.amApptStName = function(k){
  var x = window.amApptSt(k); return x ? x.name : String(k || "");
};

/* 한국 시각으로 읽기 — ⚠️⚠️ **Supabase 는 UTC 입니다.** 그냥 찍으면
   아홉 시간 어긋나고, 보는 사람은 그것을 모릅니다. */
window.amWhen = function(iso){
  if(!iso) return "";
  var d = new Date(iso);
  if(isNaN(d.getTime())) return String(iso);
  var k = new Date(d.getTime() + 9 * 3600 * 1000);
  var wd = ["일","월","화","수","목","금","토"][k.getUTCDay()];
  var h = k.getUTCHours(), ap = h < 12 ? "오전" : "오후";
  var h12 = h % 12; if(h12 === 0) h12 = 12;
  return k.getUTCFullYear() + "년 " + (k.getUTCMonth() + 1) + "월 " +
         k.getUTCDate() + "일 (" + wd + ") " + ap + " " + h12 + "시" +
         (k.getUTCMinutes() ? " " + k.getUTCMinutes() + "분" : "");
};
window.amQuoteSt  = function(k){ return amPick(window.AM_QUOTE_ST, k); };
window.amAssignSt = function(k){ return amPick(window.AM_ASSIGN_ST, k); };
window.amVat      = function(k){ return amPick(window.AM_VAT, k); };
window.amFeeType  = function(k){ return amPick(window.AM_FEE_TYPE, k); };
window.amFeeWhen  = function(k){ return amPick(window.AM_FEE_WHEN, k); };
window.amFeeCycle = function(k){ return amPick(window.AM_FEE_CYCLE, k); };
window.amSettleSt = function(k){ return amPick(window.AM_SETTLE_ST, k); };
window.amFeeTypeName  = function(k){
  var x = window.amFeeType(k);  return x ? x.name : String(k || "");
};
window.amFeeWhenName  = function(k){
  var x = window.amFeeWhen(k);  return x ? x.name : String(k || "");
};
window.amFeeCycleName = function(k){
  var x = window.amFeeCycle(k); return x ? x.name : String(k || "");
};
window.amSettleStName = function(k){
  var x = window.amSettleSt(k); return x ? x.name : String(k || "");
};

/* 수수료 정책 한 줄을 사람 말로 — ⚠️⚠️ **여기 한 곳**에서만 짓습니다.
   화면마다 따로 이어 붙이면 어떤 화면은 부가세를 빠뜨립니다.
   ⚠️ 0 은 값입니다 (무상) — `||` 로 지우지 않습니다. */
/* 수수료를 **세는 한 곳** — 정책 + 계약금액 → 수수료 · 부가세 · 합계

   ⚠️⚠️⚠️ **이 규칙을 화면에 적지 마세요.** `confirm_fee`(0003)는 금액을
   **받기만** 합니다 — 무엇이 맞는 값인지 DB 가 모릅니다. 그러니 세는
   자리가 화면에 흩어지면 그날부터 같은 계약이 화면마다 다른 수수료를
   말합니다. 세는 곳은 여기 하나입니다.

   ⚠️⚠️ **셀 수 없는 것은 null 을 돌려줍니다 — 0 이 아닙니다.**
   `margin`(마진 배분)은 마진을 모르고 `sub`(월 정액)는 건별이 아닙니다.
   그 자리에 0 을 돌려주면 **0원짜리 수수료를 확정**하게 됩니다. null
   이면 화면이 칸을 비워 열고 "직접 적어 주세요" 라고 말합니다
   (지어내지 않습니다 · 절대 규칙 1).
   ⚠️ 모르는 갈래 · 모르는 부가세 처리도 **null** 입니다 — 새 값이 DB 에
   생기는 날 조용히 틀린 금액을 내지 않게.

   ⚠️ 부가세는 `별도`면 더하고(`fee` + 10%), `포함`이면 **합계가 곧
   수수료**이며 그 안에서 세액을 거꾸로 셉니다. 둘을 헷갈리면 금액이
   10% 틀립니다 (작업 기억의 그 줄). */
window.amFeeCalc = function(pol, amount){
  if(!pol) return null;
  var t = pol.type;
  if(t === "margin" || t === "sub") return null;
  var amt  = Number(amount);
  var flat = (pol.flat === null || pol.flat === undefined) ? null : Number(pol.flat);
  var rate = (pol.rate === null || pol.rate === undefined) ? null : Number(pol.rate);
  var fee;
  if(t === "lead" || t === "close"){
    if(flat === null) return null;
    fee = flat;
  }else if(t === "rate"){
    if(rate === null || !isFinite(amt)) return null;
    fee = Math.round(amt * rate / 100);
  }else if(t === "base_rate"){
    if(flat === null || rate === null || !isFinite(amt)) return null;
    fee = flat + Math.round(amt * rate / 100);
  }else{
    return null;
  }
  /* ⚠️ 하한 · 상한은 **있을 때만** 겁니다 (0 도 값입니다 — `||` 로
     보면 0원 하한이 사라집니다 · 작업 기억의 그 줄). */
  if(pol.min_fee !== null && pol.min_fee !== undefined && fee < Number(pol.min_fee))
    fee = Number(pol.min_fee);
  if(pol.max_fee !== null && pol.max_fee !== undefined && fee > Number(pol.max_fee))
    fee = Number(pol.max_fee);
  var vat, total;
  if(pol.vat === "add"){        vat = Math.round(fee * 0.1); total = fee + vat; }
  else if(pol.vat === "incl"){  vat = fee - Math.round(fee / 1.1); total = fee; }
  else if(pol.vat === "free"){  vat = 0; total = fee; }
  else return null;
  return { fee: fee, vat: vat, total: total };
};

window.amFeeLine = function(f){
  if(!f) return "";
  var name = window.amFeeTypeName(f.type);
  /* ⚠️ 이름에 이미 `%` 가 들어 있으면 **그 자리에** 요율을 넣습니다 —
     따로 이어 붙이면 "거래액의 % · 8%" 처럼 두 번 말하게 됩니다
     (찍어 보고 고친 자리입니다). */
  if(f.rate !== null && f.rate !== undefined && name.indexOf("%") >= 0)
    name = name.replace("%", Number(f.rate) + "%");
  var bits = [name];
  if(f.flat !== null && f.flat !== undefined) bits.push(window.won(f.flat) + "원");
  if(f.rate !== null && f.rate !== undefined && bits[0].indexOf("%") < 0)
    bits.push(Number(f.rate) + "%");
  bits.push(window.amVatName(f.vat));
  bits.push(window.amFeeWhenName(f.confirm_when));
  bits.push(window.amFeeCycleName(f.cycle));
  return bits.join(" · ");
};

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
