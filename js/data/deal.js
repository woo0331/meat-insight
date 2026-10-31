/* ════════════════════════════════════════════════════════════════════
   신청 한 건의 상태 열둘 · 누가 어디로 옮길 수 있는가 (지시서 §8)

   ⚠️⚠️ **key 를 바꾸지 마세요.** 영업 상태 아홉(sales.js)과 같은
   까닭입니다 — 이 값이 DB 행과 감사 기록에 그대로 남습니다. 이름만
   바꾸세요. (DB 쪽 값과 어긋나면 빌드가 멈춥니다 — checkDeal())

   ── 이 파일이 지키는 것 ─────────────────────────────────
   § 8  "고객과 업체, 관리자는 자신의 권한에 맞는 상태만 조회하거나
        변경할 수 있다"
   § 8  "모든 중요한 상태 변경에는 변경자, 변경일시, 사유를 기록한다"
   § 8  "업체가 계약 완료를 신고하더라도 **자동으로 수수료를 확정하지
        않는다**"
   §13  "계약이 성사되지 않았는데 수수료가 확정된 것처럼 처리하지 않음"
   §13  "실제 정산 시스템 구축 전 가짜 결제·정산 완료 상태 생성 금지"

   ⚠️⚠️ 마지막 둘이 이 파일의 존재 이유입니다. 업체가 "계약했습니다"
   를 누르면 상태는 **계약 완료(signed)** 까지만 갑니다. 거기서
   **정산 대기(fee_wait)** 로 넘기는 길은 **관리자 하나**이고, 증빙을
   본 뒤입니다. 그리고 **정산 완료(fee_done)** 는 **실제 입금액이 적혀
   있어야만** 됩니다 — 적혀 있지 않으면 amDealMove() 가 거절합니다.
   ════════════════════════════════════════════════════════════════════ */

/* ── 역할 넷 ─────────────────────────────────────────────────
   ⚠️ `staff`(직원)와 `admin`(관리자)을 갈라 둔 까닭 — 영업 직원이
   배정까지는 하지만 **돈을 확정하지는 못해야** 합니다. 한 사람이
   계약을 따고 수수료까지 확정하면 아무도 교차 확인을 안 합니다. */
window.AM_ROLES = [
  { key:"customer", name:"고객",     lead:"신청하신 사장님" },
  { key:"provider", name:"입점업체", lead:"배정받은 업체" },
  { key:"staff",    name:"직원",     lead:"영업·접수 담당" },
  { key:"admin",    name:"관리자",   lead:"증빙 확인과 정산 승인" }
];

/* ── 상태 열둘 (§8 의 차례 그대로) ───────────────────────────
   who   : 이 상태를 **볼 수 있는** 역할
   money : 이 상태가 **수수료와 관련된 것인가** (true 면 관리자만 옮깁니다)
   end   : 더 갈 곳이 없는 상태 */
window.AM_DEAL_ST = [
  { key:"new",      n:1,  name:"신청 접수",         lead:"접수되었습니다. 내용을 확인하고 있습니다.",
    /* ⚠️ 아직 업체가 정해지지 않았습니다 — provider 가 없습니다 */
    who:["customer","staff","admin"] },
  { key:"check",    n:2,  name:"정보 확인 중",      lead:"적어 주신 내용을 확인하고 있습니다.",
    who:["customer","staff","admin"] },
  { key:"assigned", n:3,  name:"업체 배정",         lead:"조건에 맞는 업체에 요청을 보냈습니다.",
    who:["customer","provider","staff","admin"] },
  { key:"accepted", n:4,  name:"업체 수락",         lead:"업체가 요청을 받았습니다.",
    who:["customer","provider","staff","admin"] },
  { key:"consult",  n:5,  name:"상담 진행",         lead:"업체가 상담을 진행하고 있습니다.",
    who:["customer","provider","staff","admin"] },
  { key:"quoted",   n:6,  name:"견적 전달",         lead:"업체가 견적을 전달했습니다.",
    who:["customer","provider","staff","admin"] },
  { key:"nego",     n:7,  name:"계약 협의",         lead:"조건을 협의하고 있습니다.",
    who:["customer","provider","staff","admin"] },
  { key:"signed",   n:8,  name:"계약 완료",         lead:"계약이 체결되었습니다.",
    who:["customer","provider","staff","admin"] },
  { key:"done",     n:9,  name:"서비스 완료",       lead:"설치·이행이 끝났습니다.",
    who:["customer","provider","staff","admin"] },
  /* ⚠️⚠️ `off` — **번호 순서의 옆길**입니다. 취소와 보류는 번호가
     `signed`(8)보다 뒤인데 **계약이 아닙니다.** 번호만 보고 "계약까지
     간 건" 을 세면 **보류가 계약으로 집계됩니다** — 관리자 화면의
     전환율이 부풀려집니다 (찍어 보고 알았습니다). */
  { key:"lost",     n:10, name:"취소 · 실패",        lead:"이 건은 진행되지 않았습니다.",
    who:["customer","provider","staff","admin"], end:true, off:true },
  /* ⚠️⚠️ **보류는 끝이 아닙니다** (2026-10-09 최종 통합 지시서 §8-3 —
     "취소 · 실패 · 보류 상태를 별도로 관리한다"). `lost` 에는 `end:true` 가
     있고 여기에는 **없습니다** — 다시 돌아올 수 있어야 보류입니다.
     보류를 취소로 써 버리면 "다음 달에 다시 연락주세요" 라고 하신 분의
     건이 **실패로 집계됩니다** — 영업 숫자가 거짓말이 됩니다.
     ⚠️⚠️ **계약 뒤로는 보류가 없습니다.** `signed` · `done` · 정산 쌍은
     돈이 얽혀 있어서 멈추는 것이 아니라 **취소 · 환수**입니다 (§10-3).
     길 표에 그 길을 적지 마세요. */
  { key:"hold",     n:11, name:"보류",              lead:"잠시 멈춰 두었습니다. 다시 진행하실 수 있습니다.",
    who:["customer","provider","staff","admin"], off:true },
  /* ⚠️⚠️ 아래 둘은 **돈** 입니다. 고객 화면에 내지 않습니다 — 손님에게
     "정산" 은 우리와 업체 사이의 일이고, 보여 주면 자기 돈으로 읽힙니다. */
  { key:"fee_wait", n:12, name:"정산 대기",         lead:"수수료가 확정되어 정산을 기다립니다.",
    who:["provider","admin"], money:true },
  { key:"fee_done", n:13, name:"정산 완료",         lead:"입금이 확인되었습니다.",
    who:["provider","admin"], money:true, end:true }
];

/* ── 옮길 수 있는 길 ─────────────────────────────────────────
   [어디서, 어디로, 누가 옮길 수 있나, 무엇을 같이 적어야 하나]

   ⚠️⚠️ **여기에 없는 길은 못 갑니다.** 지어내지 말고 여기에 적으세요.
   ⚠️⚠️ `money:true` 인 상태로 들어가는 길은 **admin 하나**입니다 —
   checkDeal() 이 빌드마다 그것을 봅니다 (§8 · §13). */
window.AM_DEAL_MOVE = [
  ["new",      "check",    ["staff","admin"]],
  ["new",      "lost",     ["staff","admin","customer"], ["why"]],
  ["check",    "assigned", ["staff","admin"],            ["providerId","agree3rd"]],
  ["check",    "lost",     ["staff","admin","customer"], ["why"]],
  /* 업체가 거절하면 **실패가 아니라 다시 배정**입니다 — 손님 쪽에서
     보면 아직 진행 중인 건입니다 */
  ["assigned", "accepted", ["provider"]],
  ["assigned", "check",    ["provider","staff","admin"], ["why"]],
  ["assigned", "lost",     ["staff","admin","customer"], ["why"]],
  ["accepted", "consult",  ["provider"]],
  ["accepted", "lost",     ["staff","admin","customer"], ["why"]],
  ["consult",  "quoted",   ["provider"]],
  ["consult",  "lost",     ["staff","admin","customer"], ["why"]],
  ["quoted",   "nego",     ["provider","customer"]],
  ["quoted",   "lost",     ["staff","admin","customer"], ["why"]],
  /* ⚠️⚠️ 업체가 "계약했습니다" 를 누르는 자리입니다. 계약금액을 같이
     적게 합니다 — 안 받으면 수수료를 계산할 근거가 없습니다.
     ⚠️ 여기서 수수료는 **확정되지 않습니다** (§8 마지막 문장). */
  ["nego",     "signed",   ["provider","staff","admin"], ["amount"]],
  ["nego",     "lost",     ["staff","admin","customer"], ["why"]],
  ["signed",   "done",     ["provider","staff","admin"]],
  ["signed",   "lost",     ["admin"],                    ["why"]],
  /* ⚠️⚠️ **수수료가 확정되는 유일한 길** — 관리자만, 증빙을 보고.
     `proof` 는 계약 완료 증빙(§9 "계약 완료 증빙 확인")입니다. */
  ["done",     "fee_wait", ["admin"],                    ["proof","feeId"]],
  ["done",     "lost",     ["admin"],                    ["why"]],
  /* ⚠️⚠️ **실제 입금액이 적혀 있어야만** 됩니다 (§13 가짜 정산 금지) */
  ["fee_wait", "fee_done", ["admin"],                    ["paid"]],
  /* 환수 · 취소 (§9 "취소·환불·환수 조건") */
  ["fee_wait", "lost",     ["admin"],                    ["why"]],

  /* ══ 보류 (§8-3) ═══════════════════════════════════
     ⚠️⚠️ **계약 전까지만** 보류할 수 있습니다 — `signed` 부터는 돈이
     얽혀 있어서 멈추는 것이 아니라 취소 · 환수입니다 (§10-3).
     ⚠️ 왼에 **사유를 받습니다**(`why`) — 왜 멈췄는지가 안 남으면
     다음 사람이 그 건을 어떻게 다루어야 할지 모릅니다 (§8 기록).
     ⚠️⚠️ **보류에서 돈 상태로 가는 길이 없습니다.** 나가는 길은 둘
     — 다시 확인(`check`)하거나 접는 것(`lost`)입니다. */
  ["new",      "hold",     ["staff","admin","customer"], ["why"]],
  ["check",    "hold",     ["staff","admin","customer"], ["why"]],
  ["assigned", "hold",     ["staff","admin","customer"], ["why"]],
  ["accepted", "hold",     ["staff","admin","customer"], ["why"]],
  ["consult",  "hold",     ["staff","admin","customer"], ["why"]],
  ["quoted",   "hold",     ["staff","admin","customer"], ["why"]],
  ["nego",     "hold",     ["staff","admin","customer"], ["why"]],
  /* 다시 진행 — ⚠️ 멈췄던 자리가 아니라 **다시 확인부터** 입니다.
     몇 달 전 조건으로 그대로 이어 붙이면 업체도 가격도 바뎀 수 있습니다. */
  ["hold",     "check",    ["staff","admin"]],
  ["hold",     "lost",     ["staff","admin","customer"], ["why"]]
];

/* ── 읽기 ─────────────────────────────────────────────────── */
window.amDealSt = function(key){
  var L = window.AM_DEAL_ST, i;
  for(i = 0; i < L.length; i++) if(L[i].key === key) return L[i];
  return null;
};

window.amDealStName = function(key){
  var s = window.amDealSt(key);
  return s ? s.name : "";
};

/* 계약이 선 뒤인가 — ⚠️⚠️ **번호만 보고 자르지 마세요.** 취소(10)와
   보류(11)가 `signed`(8)보다 번호가 뒤라 같이 걸립니다. 둘은 계약이
   아니라 옆길(`off`)입니다. 관리자 화면의 "계약까지 간 비율" 이
   이것을 씁니다 — 틀리면 숫자가 조용히 부풀려집니다. */
window.amDealAfterSign = function(key){
  var s = window.amDealSt(key), g = window.amDealSt("signed");
  if(!s || !g || s.off) return false;
  return s.n >= g.n;
};

/* 이 역할이 이 상태를 볼 수 있는가 (§8 "자신의 권한에 맞는 상태만 조회") */
window.amDealCanSee = function(key, role){
  var s = window.amDealSt(key);
  if(!s) return false;
  if(role === "admin") return true;
  return s.who.indexOf(role) >= 0;
};

/* 이 역할이 여기서 갈 수 있는 길들 */
window.amDealMoves = function(from, role){
  return (window.AM_DEAL_MOVE || []).filter(function(m){
    return m[0] === from && m[2].indexOf(role) >= 0;
  });
};

/* ── 옮기기 ───────────────────────────────────────────────────
   ⚠️⚠️ **여기가 §8 을 기계로 지키는 자리입니다.** 변경자 · 사유 ·
   필요한 값이 없으면 **거절합니다.** 돌려주는 것은 "되는가" 가
   아니라 **왜 안 되는가**까지입니다 — 화면이 손님에게 그대로 적을 수
   있어야 합니다.

   ctx : { by, role, why, amount, paid, proof, providerId, agree3rd, feeId }
   돌려주는 것 : { ok:true, log:{...} }  또는  { ok:false, why:"..." } */
window.amDealMove = function(from, to, ctx){
  ctx = ctx || {};
  if(!window.amDealSt(from)) return { ok:false, why:"없는 상태입니다 — " + from };
  if(!window.amDealSt(to))   return { ok:false, why:"없는 상태입니다 — " + to };
  if(from === to)            return { ok:false, why:"같은 상태입니다" };

  var ok = (window.AM_DEAL_MOVE || []).filter(function(m){
    return m[0] === from && m[1] === to;
  });
  if(!ok.length)
    /* ⚠️ 변수 뒤에 조사를 붙이지 않습니다 — 상태 이름이 "취소 · 실패"
       처럼 가운뎃점으로 끝나면 "취소 · 실패 에서" 가 됩니다 (이 저장소가
       "원상복구 에서" 로 겪은 자리). 화살표로 받습니다. */
    return { ok:false, why:"갈 수 없는 길입니다 — " +
      window.amDealStName(from) + " → " + window.amDealStName(to) };

  var move = ok[0];
  if(move[2].indexOf(ctx.role) < 0)
    return { ok:false, why:"이 변경은 " +
      move[2].map(function(r){ return window.amRoleName(r); }).join(" · ") +
      " 만 할 수 있습니다" };

  /* §8 "변경자, 변경일시, 사유를 기록한다" — 변경자가 없으면 기록이
     아닙니다. ⚠️ 나중에 "누가 바꿨지" 를 물을 수 없는 기록은 없는
     기록과 같습니다. */
  if(!ctx.by) return { ok:false, why:"누가 바꾸는지가 없습니다" };

  var need = move[3] || [], miss = [], i, k;
  for(i = 0; i < need.length; i++){
    k = need[i];
    /* ⚠️ `0` 은 값입니다 — 계약금액 0 과 입금액 0 은 "적지 않은 것" 이
       아닙니다 (권리금 "무권리" 에서 겪은 자리). `!x` 로 보면 사라집니다. */
    if(ctx[k] === undefined || ctx[k] === null || ctx[k] === "") miss.push(k);
  }
  if(miss.length)
    return { ok:false, why:"같이 적어야 하는 것이 빠졌습니다 — " +
      miss.map(function(x){ return window.AM_DEAL_NEED[x] || x; }).join(" · ") };

  /* ⚠️⚠️ 제3자 제공 재동의 (개인정보보호법 제17조 제2항).
     배정은 "업체에게 손님 연락처를 넘기는 일" 입니다. 접수 단계의
     동의에는 그것이 **포함되지 않습니다** — 방침 제4조 제3항이 그렇게
     적혀 있습니다. 동의 없이 배정하면 그 자리에서 법 위반입니다. */
  if(to === "assigned" && ctx.agree3rd !== true)
    return { ok:false, why:"업체에 연락처를 전달하는 별도 동의를 받지 못했습니다" };

  return { ok:true, log:{
    from:from, to:to, by:ctx.by, role:ctx.role,
    at:new Date().toISOString(),
    why:ctx.why || ""
  }};
};

/* 빠진 값의 이름 — 화면에 그대로 나갑니다 */
window.AM_DEAL_NEED = {
  why:        "사유",
  amount:     "계약금액",
  paid:       "실제 입금액",
  proof:      "계약 완료 증빙",
  providerId: "배정할 업체",
  agree3rd:   "제3자 제공 동의",
  feeId:      "적용할 수수료 정책"
};

/* ── 배정 한 건의 상태 셋 (`assignment.state`) ────────────────────
   ⚠️⚠️ **신청 상태 열셋과 다른 것입니다.** 이쪽은 "그 업체가 이 건에
   어떻게 답했는가" 이고, 한 신청에 여러 줄이 생길 수 있습니다.
   ⚠️⚠️ **화면에 key 를 그대로 찍지 마세요.** 이 저장소가 포트폴리오에
   `gyeonggi` 를, 자산에 `espresso` 를 그대로 찍은 자리입니다 — 이름을
   찾는 함수가 아예 없어서 났던 사고입니다.
   ⚠️ **거절은 실패가 아닙니다** — 신청은 다시 확인(`check`)으로
   돌아가고, 손님 쪽에서 보면 아직 진행 중인 건입니다.
   ⚠️ key 는 `db/migrations/0001_init.sql` 의 `assignment.state` 이고,
   `checkDealSql()` 이 SQL 이 실제로 쓰는 값과 맞춰 봅니다. */
window.AM_ASSIGN_ST = [
  { key:"sent",     name:"보냈습니다" },
  { key:"accepted", name:"업체가 받았습니다" },
  { key:"declined", name:"업체가 거절했습니다" }
];
window.amAssignName = function(key){
  var L = window.AM_ASSIGN_ST, i;
  for(i = 0; i < L.length; i++) if(L[i].key === key) return L[i].name;
  return "";
};

/* 딱지 색 — ⚠️⚠️ **한 곳입니다.** `/my`(고객 · 업체)와 `/admin`(접수 ·
   배정)이 같은 상태를 서로 다른 색으로 내면 같은 시스템으로 안 읽힙니다.
   처음에 `js/pages/my.js` 안에 적어 두었다가, /admin 이 같은 딱지를
   내면서 **두 벌이 될 자리**라 여기로 올렸습니다 (이 저장소가
   `amCatTo`/`catTo` · 랜딩 아이콘 · 도구 아이콘 표로 겪은 자리).
   ⚠️⚠️ **보류를 취소와 같은 색으로 두지 마세요.** 멈춘 것과 접은 것은
   다른 일이고, 같은 색이면 사장님이 끝난 줄 압니다 (§8-3).
   ⚠️ 쓰는 쪽은 `.myq-st .myq-<이 값>` 입니다 — 글자는 전부 짙은
   단계라 AA 를 넘깁니다 (상태색은 배지 **바탕**용입니다). */
window.amDealTone = function(key){
  var s = window.amDealSt(key);
  if(!s)                return "gray";
  if(s.key === "hold")  return "warn";
  if(s.key === "lost")  return "gray";
  if(s.end)             return "ok";
  return "on";
};

window.amRoleName = function(key){
  var L = window.AM_ROLES || [], i;
  for(i = 0; i < L.length; i++) if(L[i].key === key) return L[i].name;
  return key;
};

/* ════════════════════════════════════════════════════════════════════
   견적 상태 넷 (0008 · 최종 통합 지시서 §4 · §6)

   ⚠️⚠️ **`db/migrations/0008_quote.sql` 의 check 와 같아야 합니다.**
   `build-pages.js` 의 `checkQuoteSql()` 이 빌드마다 맞춰 봅니다 —
   한쪽만 고치면 화면이 모르는 상태가 와서 딱지가 **빈 칸**이 되거나,
   화면이 내는 값을 DB 가 거절합니다 (이 저장소가 배정 상태 ·
   `deal_move` 로 겪은 자리).

   ⚠️ `passed`(고르지 않음)와 `withdrawn`(업체가 거둠)을 **한 가지로
   묶지 마세요.** 앞은 고객이 다른 곳을 고른 것이고 뒤는 업체가 말을
   거둔 것입니다 — 같은 말로 덮으면 "왜 이 견적이 없어졌나" 를 아무도
   못 댑니다. 그래서 거둔 견적은 고객 화면에 아예 안 보이고(RLS),
   고르지 않은 견적은 그대로 보입니다.
   ════════════════════════════════════════════════════════════════════ */
window.AM_QUOTE_ST = [
  { key:"open",      name:"받은 견적",   tone:"on"   },
  { key:"chosen",    name:"고른 견적",   tone:"ok"   },
  { key:"passed",    name:"고르지 않음", tone:"gray" },
  { key:"withdrawn", name:"업체가 거둠", tone:"gray" }
];
window.amQuoteSt = function(key){
  var L = window.AM_QUOTE_ST, i;
  for(i = 0; i < L.length; i++) if(L[i].key === key) return L[i];
  return null;
};
window.amQuoteName = function(key){
  var s = window.amQuoteSt(key);
  return s ? s.name : "";
};
window.amQuoteTone = function(key){
  var s = window.amQuoteSt(key);
  return s ? s.tone : "gray";
};

/* ════════════════════════════════════════════════════════════════════
   업체 입점 신청 상태 넷 (0016 · 2026-10-25 진단 P1-7)

   `/join` 으로 들어온 입점 신청이 어디까지 갔는지입니다.

   ⚠️⚠️ **신청(`request`) 상태 열셋과 다른 것입니다.** 이쪽은 **업체가
   우리에게** 등록을 신청한 것이고, 그쪽은 **손님이 서비스를** 신청한
   것입니다 — 같은 딱지로 섞으면 접수 목록과 입점 목록이 한 통이 됩니다.

   ⚠️⚠️ **`db/migrations/0016_provider_apply.sql` 의 enum 과 같아야
   합니다.** 어긋나면 화면이 모르는 값이 와서 딱지가 **빈 칸**이 되거나
   (`amApplyName()` 이 빈 문자열을 돌려줍니다), 화면이 내는 값을 DB 가
   거절합니다 — `checkDealSql()` 이 빌드마다 맞춰 봅니다.

   ⚠️ **`drop`(진행 안 함)을 끝으로 닫지 않았습니다.** 다시 `called` 로
   되돌릴 수 있습니다 — "지금은 생각이 없다" 가 반 년 뒤에도 그런 것은
   아닙니다 (보류에 `end:true` 를 안 붙인 그 자리).
   ════════════════════════════════════════════════════════════════════ */
window.AM_APPLY_ST = [
  { key:"new",    name:"새 신청",     tone:"on"   },
  { key:"called", name:"통화함",      tone:"warn" },
  { key:"done",   name:"등록 완료",   tone:"ok"   },
  { key:"drop",   name:"진행 안 함",  tone:"gray" }
];
window.amApplySt = function(key){
  var L = window.AM_APPLY_ST, i;
  for(i = 0; i < L.length; i++) if(L[i].key === key) return L[i];
  return null;
};
window.amApplyName = function(key){
  var s = window.amApplySt(key);
  return s ? s.name : "";
};
window.amApplyTone = function(key){
  var s = window.amApplySt(key);
  return s ? s.tone : "gray";
};

/* 부가세 표기 — ⚠️ 금액만 적어 두면 둘을 견줄 수가 없습니다
   (한 곳은 별도, 한 곳은 포함이면 실제로 내는 돈이 10% 다릅니다).
   ⚠️⚠️ **여기서 세금을 계산하지 않습니다** — 요율을 박아 두면 바뀌는
   날부터 거짓말입니다 (이 저장소가 4대보험에서 적어 둔 그 규칙).
   적는 것은 **업체가 어떻게 적었는가**까지입니다. */
window.amQuoteVat = function(key){
  if(key === "incl") return "부가세 포함";
  if(key === "free") return "면세";
  return "부가세 별도";
};

/* ── 쪽(side) 이름 넷 ────────────────────────────────────────────
   > `db/migrations/0001_init.sql` 133줄 — `side` 는
   > **start | ops | transfer | close** 넷입니다.

   ⚠️⚠️ **세 곳이 이것을 손으로 적고 있었고 셋 다 틀렸습니다.**
   2026-10-18 전체 점검에서 재서 찾았습니다 —

   | 어디 | 어떻게 틀렸나 |
   |---|---|
   | 신청 화면의 고르개 | `transfer` 선택지가 **없었습니다** |
   | 접수 글의 "상황" 칸 | `close` 가 아니면 전부 **"창업 · 시작"** |
   | 관리자 접수 목록 | `ops` · `transfer` 가 **빈 칸** |

   운영 중인 사장님이 "창업" 으로, 양도양수가 "창업" 으로 접수되면
   배정하는 직원이 그것을 보고 **엉뚱한 업체**를 찾습니다 — 2026-10-18
   에 `ops` 하나를 고치고도 `transfer` 가 같은 자리에 남아 있었습니다.
   ⚠️ **이제 이름은 여기 한 곳입니다.** 화면에 적지 마세요. */
window.AM_SIDES = [
  { key:"start",    name:"창업 · 시작",   short:"창업",   pick:"/startup#pick",
    say:"창업 — 시작하려고 합니다" },
  { key:"ops",      name:"운영",          short:"운영",   pick:"/operation#pick",
    say:"운영 — 장사하면서 필요합니다" },
  { key:"transfer", name:"인수 · 양도",   short:"양도양수", pick:"/transfer#pick",
    say:"인수 · 양도 — 매장을 받거나 넘깁니다" },
  { key:"close",    name:"폐업 · 정리",   short:"폐업",   pick:"/closure#pick",
    say:"폐업 — 정리하려고 합니다" },
  /* ⚠⚠ **2026-10-29 PHONEWAY — 둘을 더했습니다.**
     전에는 `/sell`(내 폰 팔기)이 `side` 를 안 보내서,
     `api/quote.js` 가 기본값 **`"start"`** 를 박아 저장했습니다 —
     중고폰 매입 신청이 전부 **"창업 · 시작" 건으로** 들어가고,
     `/admin` 목록을 보는 직원이 그걸 보고 **창업 업체**를 찾습니다.
     이 저장소가 `ops` · `transfer` 로 두 번 겪은 자리의 **세 번째**입니다.
     ⚠ `request.side` 는 `text not null` 일 뿐 **check 가 없어서**(0001 133줄)
     마이그레이션 없이도 그대로 저장됩니다.
     ⚠⚠ `pw:true` 는 **`/quote` 고르개에 안 내는 표시**입니다 —
     거기는 창업 · 폐업 신청 화면이라, 안 걸러내면 거기서
     "중고폰 직접 매입" 을 고를 수 있게 됩니다. */
  { key:"buyin",    name:"중고폰 · 직접 매입", short:"직접매입", pick:"/sell", pw:true,
    say:"중고폰 — 폰웨이가 바로 사는 것" },
  { key:"bid",      name:"중고폰 · 경쟁입찰", short:"경쟁입찰", pick:"/sell", pw:true,
    say:"중고폰 — 업체 경쟁입찰" },
  /* 2026-10-29 시안 §3-E — 기업 · 수출 거래. ⚠️ 거래 절차가 아직
     없어서 **문의 접수**까지입니다 (화면이 그렇게 적습니다). */
  { key:"export",   name:"기업 · 수출 거래", short:"기업수출", pick:"/biz", pw:true,
    say:"기업 · 수출 — 대량 매입 · 해외 수출 문의" },
  /* 2026-10-30 최종 지시서 §2-3 · §5 — 수리 서비스.
     ⚠️⚠️ **안 더하면 수리 접수가 `"start"`(창업 건)로 저장됩니다** —
     `api/quote.js` 가 `side` 가 없을 때 그 값을 박습니다. 이 저장소가
     `ops` · `transfer` · 중고폰 셋으로 **네 번** 겪은 자리입니다.
     ⚠️ `pw:true` — `/quote`(창업 · 폐업 신청) 고르개에 안 냅니다. */
  { key:"repair",   name:"중고폰 · 수리",    short:"수리",   pick:"/repair", pw:true,
    say:"수리 — 쓰던 기기를 고치려고 합니다" },
  /* ⚠️⚠️ **2026-10-31 — 구매가 빠져 있었습니다 (다섯 번째).**
     `/shop` 상세의 **중고폰 구매하기**가 `/quote?c=shop&p=…` 로 가는데
     여기에 "구매" 쪽이 없어서, 그 문의가 **"창업" 건으로** 저장되고
     있었습니다 — `/quote` 의 고르개 기본값이 `start` 였습니다. 직원이
     목록에서 그걸 보고 **창업 업체**를 찾습니다.
     이 저장소가 `ops` · `transfer` · 중고폰 둘 · `repair` 로 겪은 그
     자리이고, 재서 찾았습니다.
     ⚠️ `request.side` 는 `text not null` 일 뿐 **check 가 없어서**
     (0001 133줄) 마이그레이션 없이 그대로 저장됩니다. */
  { key:"shop",     name:"중고폰 · 구매",    short:"구매",   pick:"/shop", pw:true,
    say:"중고폰 — 사려고 합니다" }
];

/* ── 견적 칸의 이름 — ⚠️⚠️ **한 곳입니다** ────────────────────────
   2026-10-29 PHONEWAY. `quote` 표(0008)는 **새 표를 만들지 않고
   그대로 씁니다** — 칸이 중고폰 입찰에도 그대로 맞습니다. 다만
   **읽히는 말이 반대**입니다:

     창업 · 폐업   업체가 일을 해 주고 **받는** 돈
     중고폰 입찰   업체가 기기를 **사 가며 주는** 돈

   그래서 "시작 가능일" 은 "수거 가능일" 이고, "A/S · 보증" 은
   "검수 기준 · 재검수" 입니다. 그대로 두면 매입업체가 **남의 말로
   적힌 폼**을 채우게 되고, 판매자는 "A/S" 가 무엇인지 묻습니다.

   ⚠️⚠️ **화면마다 손으로 적지 마세요.** 입찰 폼(`/my` 업체 쪽) ·
   비교 카드(`/my` 고객 쪽) · `/admin` 의 받은 견적 **셋이 같이**
   읽습니다 — 두 곳에 적으면 업체가 적은 칸과 판매자가 보는 칸의
   이름이 달라집니다 (이 저장소가 `amCatTo`/`catTo` 로 겪은 자리). */
window.AM_QUOTE_LABELS = {
  def: {
    amount:   "견적 금액 (원) *",
    amountHint:"⚠️ 이 금액이 고객 화면에 그대로 나갑니다. 0 원은 '무상' 으로 읽힙니다",
    scope:    "이 금액에 포함되는 것 *",
    scopeHint:"범위 없는 견적은 금액만 적힌 종이입니다",
    excludes: "별도로 드는 것",
    exHint:   "나중에 또 받게 되는 비용을 미리 적어 두면 분쟁이 줄어듭니다",
    days:     "예상 소요일",
    startOn:  "시작 가능일",
    warranty: "A/S · 보증",
    scopeRow: "포함 범위",
    exRow:    "별도",
    wsRow:    "A/S · 보증"
  },
  phone: {
    amount:   "매입 금액 (원) *",
    amountHint:"⚠️ 이 금액이 판매자 화면에 그대로 나갑니다. 검수 뒤 달라지면 먼저 알리셔야 합니다",
    scope:    "이 금액에 포함되는 것 *",
    scopeHint:"수거 방식(택배 · 방문) · 포장 · 택배비 부담을 같이 적어 주세요",
    excludes: "검수에서 차감될 수 있는 것",
    exHint:   "미리 적어 두시면 검수 뒤 다툴 일이 줄어듭니다",
    days:     "정산 소요일 (기기를 받은 뒤)",
    startOn:  "수거 가능일",
    warranty: "검수 기준 · 재검수",
    scopeRow: "수거 · 포함 조건",
    exRow:    "차감될 수 있는 것",
    wsRow:    "검수 기준"
  }
};
/* ⚠️ 모르는 쪽이면 기본(창업 · 폐업)입니다 — 빈 칸을 만들지 않습니다 */
window.amQuoteLabels = function(side){
  var L = window.AM_QUOTE_LABELS || {};
  return (side === "buyin" || side === "bid") ? (L.phone || L.def || {}) : (L.def || {});
};

window.amSide = function(key){
  var L = window.AM_SIDES, i;
  for(i = 0; i < L.length; i++) if(L[i].key === key) return L[i];
  return null;
};
/* ⚠️ 모르는 값에는 **빈 문자열**입니다 — 자리표시자를 찍지 않습니다
   (절대 규칙 2). 옛 접수에 없는 값이 들어 있을 수 있습니다. */
window.amSideName = function(key){
  var s = window.amSide(key);
  return s ? s.name : "";
};
