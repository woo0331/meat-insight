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

/* ════════════════════════════════════════════════════════════════════
   광고 자리 넷 — `ad_place` enum (0026)

   ⚠️⚠️⚠️ **전에는 이 목록이 `js/adminbiz.js` 안에만 있었습니다.** 그런데
   2026-11-06 에 손님 화면에 광고를 그리는 파일(`js/adslot.js`)이 생기면서
   **같은 키를 두 곳이** 들게 됐습니다 — 한쪽만 고치는 날 운영자가 고른
   자리와 손님 화면이 찾는 자리가 어긋나고, 그러면 **광고가 조용히 안
   보입니다**(에러도 없습니다). 그래서 줄은 여기 하나입니다.
   ⚠️ `check-deal` 이 0026 의 enum 과 **키를 맞춰 봅니다** (한글은 말입니다).

   칸
     key    DB 의 `ad_place` 값 — **바꾸지 마세요**
     name   운영자 화면에 나가는 이름
     needs  그 자리가 **더 받아야 하는 것** (0026 의 `ad_run_where` check)
              cat   분류 키가 있어야 합니다
              rg    지역 키가 있어야 합니다
              null  더 받을 것이 없습니다
   ⚠️⚠️ **`needs` 를 안 채우면 DB 가 거절합니다** — 분류 광고에 분류 키가
   없으면 어느 분류에도 안 걸려 **에러 없이 조용히 안 보입니다**. 그래서
   0026 이 check 로 막고, 운영자 화면이 그 칸을 **고르개**로 냅니다.
   ════════════════════════════════════════════════════════════════════ */
/* ⚠️⚠️ 광고 자리 — **DB 의 `ad_place` enum 과 같은 묶음**입니다 (0026 → 0062).
   `check-deal` 이 `create type` 과 `alter type … add value` 를 합쳐서
   맞춰 보므로, 한쪽만 고치면 빌드가 멈춥니다.
   ⚠️ `needs` 는 그 자리에 **무엇을 더 골라야 하는지**입니다 — 안 받으면
   어느 분류 · 어느 지역 광고인지 몰라 **영원히 안 걸리는 광고**가 됩니다.
   ⚠️⚠️ 지시서의 슬롯 이름과 짝: HOME_PREMIUM → main_hero ·
   HOME_SPONSOR_A/B → home_sponsor_a/b · HOME_BOTTOM → home_bottom. */
window.AM_AD_PLACE = [
  { key:"main_hero",      name:"메인 프리미엄",   needs:null },
  { key:"home_sponsor_a", name:"메인 스폰서 A",   needs:null },
  { key:"home_sponsor_b", name:"메인 스폰서 B",   needs:null },
  { key:"home_bottom",    name:"메인 하단 와이드", needs:null },
  { key:"main_band",      name:"메인 띠",         needs:null },
  { key:"cat_top",        name:"분류 상단",       needs:"cat" },
  { key:"region",         name:"지역",            needs:"rg"  }
];
window.amAdPlace = function(k){
  var L = window.AM_AD_PLACE || [];
  for(var i = 0; i < L.length; i++) if(L[i].key === k) return L[i];
  return null;
};
/* ⚠️ 모르는 값은 **키 그대로** 냅니다 (빈 칸을 두지 않습니다) */
window.amAdPlaceName = function(k){
  var x = window.amAdPlace(k);
  return x ? x.name : String(k || "");
};

/* ════════════════════════════════════════════════════════════════════
   광고 소재의 권장 원본 (0064 · 최종 작업지시서 B)

   ⚠️⚠️ **자리마다 규격이 다릅니다** — 지시서가 준 값 그대로입니다.
     HOME_PREMIUM    1200x200  /  720x160
     HOME_SPONSOR_A  580x120   /  720x140
     HOME_SPONSOR_B  580x120   /  720x140
     HOME_BOTTOM     1200x150  /  720x120
   ⚠️⚠️⚠️ **이것은 권장일 뿐이고 DB 도 · 화면도 크기를 막지 않습니다.**
   막으려면 올리는 그림의 픽셀을 재야 하는데, 서버는 파일을 지나가게
   하지 않습니다(서명된 주소로 브라우저가 바로 올립니다) — 못 막는 것을
   막는다고 적지 않습니다. 대신 ① 운영자 화면이 그 자리에서 **권장 값을
   말하고** ② 화면이 **원본 비율을 보존해서** 그립니다(`height:auto`) —
   그래서 규격이 조금 달라도 찌그러지지는 않습니다.
   ⚠️ 자리를 더하는 날 이 줄도 같이 더하세요 — 없으면 운영자 화면이
   그 자리에만 권장 값을 안 적습니다 (`amAdSize()` 가 null 을 냅니다).
   ════════════════════════════════════════════════════════════════════ */
window.AM_AD_SIZE = {
  main_hero:      { pc:"1200x200", mo:"720x160" },
  home_sponsor_a: { pc:"580x120",  mo:"720x140" },
  home_sponsor_b: { pc:"580x120",  mo:"720x140" },
  home_bottom:    { pc:"1200x150", mo:"720x120" }
};
/* ⚠️ 모르는 자리는 **null** 입니다 (0 이나 빈 글자가 아닙니다 — 화면이
   그것을 보고 줄째 뺍니다 · 절대 규칙 2). */
window.amAdSize = function(k){
  var M = window.AM_AD_SIZE || {};
  return M[k] || null;
};

/* ════════════════════════════════════════════════════════════════════
   광고 돈 기록 세 갈래 — `ad_bill_kind` enum (0064)

   ⚠️⚠️⚠️ **계약액과 실제 매출은 다릅니다** (지시서 B — "계약액과 실제
   매출 분리"). `ad_run.price` 는 **적어 둔 계약액**이고, 실제로 오간
   돈은 이 세 갈래의 **줄**입니다. 실매출 = 수납 − 환불 이고 그 셈은
   보기 `v_ad_board` **한 곳**에 있습니다 — 화면이 다시 셈하지 않습니다
   (두 곳에서 세면 어긋나고, 어긋나면 어느 쪽이 참인지 알 수 없습니다).
   ⚠️ `check-deal` 이 0064 의 enum 과 키를 맞춰 봅니다.
   ════════════════════════════════════════════════════════════════════ */
window.AM_AD_BILL = [
  { key:"bill",   name:"청구", tone:"ink"  },
  { key:"pay",    name:"수납", tone:"grn"  },
  { key:"refund", name:"환불", tone:"warn" }
];
window.amAdBillName = function(k){
  var L = window.AM_AD_BILL || [];
  for(var i = 0; i < L.length; i++) if(L[i].key === k) return L[i].name;
  return String(k || "");
};
window.amAdBill = function(k){
  var L = window.AM_AD_BILL || [];
  for(var i = 0; i < L.length; i++) if(L[i].key === k) return L[i];
  return { key:String(k || ""), name:String(k || ""), tone:"ink" };
};

/* ════════════════════════════════════════════════════════════════════
   광고 상태 넷 — `ad_state` enum (0026)

   ⚠️⚠️⚠️ **2026-11-06 까지 화면의 상태 말이 DB 와 달랐습니다.**
   `js/adminbiz.js` 가 `draft · live · paused · done · void` 다섯을 들고
   있었는데 0026 의 enum 은 `draft · live · done · stopped` 넷입니다 —
     · `paused` · `void` 단추는 **누르면 DB 가 거절**했습니다
       (단추는 보이고 DB 가 거절하는 그 자리입니다)
     · 정작 **`stopped` 는 단추가 없어서** 집행 중인 광고를 멈출 길이
       화면에 한 곳도 없었습니다
   `check-deal` 이 이 묶음을 enum 과 맞춰 보지 않고 있었습니다 — 이제 봅니다.
   ⚠️ `tone` 은 배지 **바탕색**입니다 (글자로 쓰지 않습니다 — 상태색은
   배지 바탕용입니다).
   ════════════════════════════════════════════════════════════════════ */
window.AM_AD_STATE = [
  { key:"draft",   name:"준비",    tone:"ink"  },
  { key:"live",    name:"집행 중", tone:"grn"  },
  { key:"stopped", name:"멈춤",    tone:"warn" },
  { key:"done",    name:"끝남",    tone:"ink"  }
];
window.amAdStateName = function(k){
  var L = window.AM_AD_STATE || [];
  for(var i = 0; i < L.length; i++) if(L[i].key === k) return L[i].name;
  return String(k || "");
};

/* ════════════════════════════════════════════════════════════════════
   중고 직거래 (0056) — 매물 상태 넷 · 문의 상태 넷 · 물건 상태 넷

   ⚠️⚠️⚠️ **조인은 이 말을 `js/myjoin.js` 안에 들고 있습니다** — 그래서
   아무도 DB 의 check 와 맞춰 보지 않고, 거기서 실제로 사고가 났습니다
   (`||` 가 `?:` 보다 먼저 묶여 닫힌 조인에 영문 `closed` 가 손님
   화면에 찍혔습니다). 중고는 **여기 한 곳**이고 `check-deal` 이 0056 의
   check 와 빌드마다 맞춰 봅니다.

   ⚠️⚠️ **문의 상태는 말이 두 벌입니다** (0053 의 문의 갈래와 같은 꼴) —
     name  **파는 분** 눈으로 ("받았습니다" · "거절했습니다")
     mine  **문의하신 분** 눈으로 ("받아들여졌습니다" · "거절되었습니다")
   한 벌로 두면 파는 분에게 할 말을 문의하신 분 화면에 찍게 됩니다
   (절대 규칙 3). ⚠️ 줄은 하나이고 칸이 둘입니다 — 표를 둘로 가르면 키
   묶음이 둘이 되어 한쪽만 고치는 날 어긋납니다.

   ⚠️ 모르는 값은 **키 그대로** 냅니다 (빈 칸을 두지 않습니다 — 그래야
   잘못 들어간 값이 눈에 보입니다).
   ════════════════════════════════════════════════════════════════════ */
window.AM_LST_ST = [
  { key:"open",   name:"팔고 있습니다",   tone:"grn"  },
  { key:"done",   name:"팔렸습니다",      tone:"ink"  },
  { key:"closed", name:"내렸습니다",      tone:"ink"  },
  { key:"hidden", name:"가려졌습니다",    tone:"bad"  }
];
window.AM_LSTASK_ST = [
  { key:"asked",    name:"기다리는 중",   mine:"기다리는 중",        tone:"warn" },
  { key:"accepted", name:"받았습니다",    mine:"받아들여졌습니다",   tone:"grn"  },
  { key:"rejected", name:"거절했습니다",  mine:"거절되었습니다",     tone:"ink"  },
  { key:"canceled", name:"거뒀습니다",    mine:"거두셨습니다",       tone:"ink"  }
];
/* ── 구합니다 (0061) ─────────────────────────────────────────────
   ⚠️⚠️ **말이 두 벌입니다** — 글을 올린 분의 `name` 과 답한 분의
   `mine`. "받았습니다" 를 답한 분 화면에 찍으면 올린 분에게 할 말을
   답한 분에게 찍는 것입니다 (절대 규칙 3).
   ⚠️ 값은 0061 의 check 와 한 글자도 같아야 합니다 — `check-deal` 이
   빌드마다 맞춰 봅니다 (어긋나면 손님 화면에 영문 키가 찍힙니다). */
window.AM_WANT_ST = [
  { key:"open",   name:"찾는 중",       tone:"grn"  },
  { key:"done",   name:"구했습니다",     tone:"ink"  },
  { key:"closed", name:"내렸습니다",     tone:"ink"  },
  { key:"hidden", name:"가려졌습니다",   tone:"bad"  }
];
window.AM_WREPLY_ST = [
  { key:"replied",  name:"답을 받았습니다", mine:"기다리는 중",      tone:"warn" },
  { key:"accepted", name:"받아들였습니다",  mine:"받아들여졌습니다", tone:"grn"  },
  { key:"rejected", name:"거절했습니다",    mine:"거절되었습니다",   tone:"ink"  },
  { key:"canceled", name:"거뒀습니다",      mine:"거두셨습니다",     tone:"ink"  }
];
/* ⚠️⚠️ **예산 0 은 "무료로 해 주실 분"** 이고 **안 적음(null)과 다릅니다.**
   `||` 를 쓰면 0 이 사라지고 둘이 섞입니다 (작업 기억의 그 자리) —
   그래서 세는 자리를 **한 함수**에 둡니다. */
window.amWantBudget = function(n){
  if(n === null || n === undefined || n === "") return "";
  var v = Number(n);
  if(!isFinite(v)) return "";
  if(v === 0) return "무료로 해 주실 분";
  return v.toLocaleString("ko-KR") + "원";
};
window.amWantSt = function(k){
  var L = window.AM_WANT_ST || [];
  for(var i = 0; i < L.length; i++) if(L[i].key === k) return L[i];
  return null;
};
/* ⚠️ `mine` 을 안 쓰는 쪽(올린 분)과 쓰는 쪽(답한 분)을 **갈라서** 냅니다 */
window.amWReplySt = function(k, mine){
  var L = window.AM_WREPLY_ST || [];
  for(var i = 0; i < L.length; i++) if(L[i].key === k)
    return { key:k, name: mine ? L[i].mine : L[i].name, tone:L[i].tone };
  return null;
};

/* 물건 상태 — ⚠️ 값은 0056 의 `cond` check 와 한 글자도 같아야 합니다 */
window.AM_LST_COND = [
  { key:"new",  name:"미사용 (새것)" },
  { key:"like", name:"거의 새것" },
  { key:"good", name:"사용감 적음" },
  { key:"fair", name:"사용감 많음" }
];

function amLstPick(L, k){
  for(var i = 0; i < (L || []).length; i++) if(L[i].key === k) return L[i];
  return null;
}
window.amLstSt = function(k){
  var x = amLstPick(window.AM_LST_ST, k);
  return x || { name:String(k || ""), tone:"ink" };
};
/* 파는 분 눈 — ⚠️ `mine` 과 섞어 쓰지 마세요 (절대 규칙 3) */
window.amLstAskSt = function(k){
  var x = amLstPick(window.AM_LSTASK_ST, k);
  return x || { name:String(k || ""), mine:String(k || ""), tone:"ink" };
};
/* 문의하신 분 눈 */
window.amLstAskMine = function(k){
  var x = amLstPick(window.AM_LSTASK_ST, k);
  return x ? x.mine : String(k || "");
};
window.amLstCondName = function(k){
  var x = amLstPick(window.AM_LST_COND, k);
  return x ? x.name : String(k || "");
};
/* 값 — ⚠️⚠️ **0 은 "무료" 입니다** (빈 값이 아닙니다). `||` 를 쓰면
   `0 || …` 이 거짓이 되어 0원이 사라집니다 (작업 기억 — 0 을 기다리는
   자리에 `||` 를 쓰지 마세요). */
/* ════════════════════════════════════════════════════════════════════
   티타임 (0060) — 업체가 올리는 자리와 손님의 예약 신청

   ⚠️⚠️⚠️ **'예약 완료' 라는 말을 쓰지 않습니다.** 업체가 확인하기
   전까지는 **'예약 신청'** 입니다 (지시서 §6). 확정 전에 "완료" 라고
   적으면 하지 않은 일을 했다고 말하는 것입니다 (절대 규칙 5).
   ⚠️⚠️ **말이 두 벌입니다** — 업체의 `name` 과 손님의 `mine`.
   "받았습니다" 를 손님 화면에 찍으면 운영자에게 할 말을 손님에게
   찍는 것입니다 (절대 규칙 3).
   ⚠️ 키는 0060 의 check 와 **한 글자도 같아야** 합니다 —
   `check-deal` 이 빌드마다 맞춰 봅니다.
   ════════════════════════════════════════════════════════════════════ */
window.AM_TEE_KIND = [
  { key:"booking", name:"골프장 부킹", lead:"한 팀을 통째로" },
  { key:"join",    name:"골프 조인",   lead:"자리 단위로" }
];
window.AM_TEE_ST = [
  { key:"open",   name:"받는 중", tone:"ok" },
  { key:"closed", name:"닫음",    tone:"ink" },
  { key:"hidden", name:"가려짐",  tone:"bad" }
];
window.AM_TEEBOOK_ST = [
  /* 업체 눈 · 손님 눈 */
  { key:"applied",   name:"새 신청",   mine:"신청했습니다 — 업체 확인을 기다립니다", tone:"info" },
  { key:"confirmed", name:"확정함",    mine:"업체가 확정했습니다",                 tone:"ok"   },
  { key:"rejected",  name:"거절함",    mine:"업체가 받지 못했습니다",               tone:"bad"  },
  { key:"canceled",  name:"손님이 취소", mine:"취소하셨습니다",                      tone:"ink"  }
];
function amTeePick(L, k){
  for(var i = 0; i < (L || []).length; i++) if(L[i].key === k) return L[i];
  return null;
}
window.amTeeKind = function(k){
  var x = amTeePick(window.AM_TEE_KIND, k);
  /* ⚠️ 모르는 키는 **키 그대로** 냅니다 (지어내지 않습니다) */
  return x || { name:String(k || ""), lead:"" };
};
window.amTeeSt = function(k){
  var x = amTeePick(window.AM_TEE_ST, k);
  return x || { name:String(k || ""), tone:"ink" };
};
/* 업체 눈 */
window.amTeeBookSt = function(k){
  var x = amTeePick(window.AM_TEEBOOK_ST, k);
  return x || { name:String(k || ""), mine:String(k || ""), tone:"ink" };
};
/* 손님 눈 — ⚠️ `name` 과 섞어 쓰지 마세요 (절대 규칙 3) */
window.amTeeBookMine = function(k){
  var x = amTeePick(window.AM_TEEBOOK_ST, k);
  return x ? x.mine : String(k || "");
};
/* 그린피 — ⚠️⚠️ **0 은 "무료" 이고 빈 값은 "안 적음"** 입니다.
   `||` 를 쓰면 0 이 사라져 둘이 같아 보입니다 (amLstPrice 와 같은 자리). */
window.amTeeFee = function(n){
  if(n === null || n === undefined || n === "") return "";
  var v = Number(n);
  if(!isFinite(v)) return "";
  return v === 0 ? "무료" : (window.won(v) + "원");
};

window.amLstPrice = function(n){
  if(n === null || n === undefined || n === "") return "";
  var v = Number(n);
  if(!isFinite(v)) return "";
  return v === 0 ? "무료로 나눔" : (window.won(v) + "원");
};

/* ════════════════════════════════════════════════════════════════════
   저장해 두는 조건 (0058) — ⚠️ 말은 **여기 한 곳**입니다
   ────────────────────────────────────────────────────────────────────
   ⚠️⚠️ `check-deal` 이 0058 의 `watch.kind` check 와 빌드마다 맞춰
   봅니다. 조인은 이 말을 `js/myjoin.js` 안에 들고 있어서 아무도 DB 와
   안 맞춰 봤고, 거기서 영문 `closed` 가 손님 화면에 찍혔습니다.
   ⚠️ `where` 는 그 조건을 **어디서 저장하는지**이고, 화면이 "이 조건
   저장" 단추를 그릴 때 씁니다 — 주소를 두 곳에 적지 않게.
   ⚠️⚠️ `sub` · `price` · `ship` · `booked` 는 그 갈래에서 **고를 수
   있는지**입니다. 0058 의 문이 못 걸릴 조건을 거절하므로(조인에
   하위분류 · 중고 아닌데 택배), 화면이 그 칸을 내면 **눌러도 거절되는
   칸**이 됩니다 (절대 규칙 5). 그래서 문의 규칙을 여기 한 벌 적고
   화면이 그것을 읽습니다.
   ════════════════════════════════════════════════════════════════════ */
window.AM_WATCH = [
  { key:"join",    name:"골프 조인",        where:"/cat/matchup",
    sub:false, price:true,  ship:false, booked:true },
  { key:"listing", name:"중고 직거래",      where:"/cat/used",
    sub:true,  price:true,  ship:true,  booked:false },
  { key:"job",     name:"인력 · 비즈니스",  where:"/cat/career",
    /* ⚠️ 급여(`pay`)가 **글자**라 숫자로 견줄 수 없습니다 (0048 이
       "협의" 를 지어 적지 않으려고 비울 수 있게 두었습니다) — 그래서
       금액 칸을 **안 냅니다**. 받아 두면 영원히 안 걸립니다. */
    sub:true,  price:false, ship:false, booked:false }
];
window.amWatch = function(k){
  return window.AM_WATCH.filter(function(x){ return x.key === k; })[0] || null;
};
window.amWatchName = function(k){
  var f = window.amWatch(k);
  return f ? f.name : String(k || "");
};

/* "이 조건을 저장하고 알림 받기" 로 가는 링크 (0058)
   ⚠️⚠️ **글과 주소를 한 곳에** 둡니다 — 분류 화면 셋(조인 · 중고 ·
   인력)이 같은 말을 해야 하고, 세 곳에 적으면 한쪽만 고치는 날 둘이
   다른 말을 합니다 (메인의 믿음 줄과 "일하는 방식" 이 그랬습니다).
   ⚠️ 가는 자리는 `/my` 이고 `?w=` 로 **그 갈래를 열어 둡니다** —
   그러지 않으면 손님이 거기서 갈래를 다시 고릅니다.
   ⚠️⚠️ **거르개의 값을 주소에 싣지 않습니다.** 싣는 순간 같은 규칙이
   두 곳(화면의 거르개 · /my 의 양식)이 되고, 거르개가 늘어나는 날
   한쪽만 고치게 됩니다. `/my` 에서 한 번 더 고르시는 것이 맞습니다.
   ⚠️ 로그인 전에는 **부르지 않습니다** — 화면이 가립니다 (로그인
   화면으로 보내 놓고 "저장했습니다" 가 되면 안 됩니다). */
window.amWatchLink = function(kind){
  var f = window.amWatch ? window.amWatch(kind) : null;
  if(!f) return "";
  return '<p class="wch-cta"><a class="btn btn-sm btn-line" href="/my?w=' +
    encodeURIComponent(f.key) + '">' +
    (window.icon ? window.icon("search", 18) : "") +
    '조건을 저장하고 알림 받기</a></p>';
};
