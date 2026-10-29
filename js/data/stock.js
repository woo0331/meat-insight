/* ════════════════════════════════════════════════════════════════════
   직접 매입 재고 — 상태 · 비용 · 수익 (2026-10-29 ⑥)

   ⚠️⚠️ **지금까지의 장부와 성격이 다릅니다.**

     deal(0001)      중개 — 업체가 계약하고 **저희가 수수료를 받습니다**
     device(0020)    직접 매입 — **저희가 기기를 사서 팔습니다**

   그래서 칸이 다릅니다 — 중개는 "계약금액 · 요율 · 수수료 · 입금",
   직접 매입은 "매입원가 · 비용 · 판매가 · 수익" 입니다. 한 표에 합치면
   **수수료 수익과 판매 마진이 한 숫자로 섞여** 어느 쪽이 남는
   장사인지 영영 모릅니다.

   ⚠️⚠️ **이 파일은 key 만 들고 있습니다.** 돈은 전부 DB 가 계산하고
   (`0020_device.sql` 의 문 넷), 여기는 화면이 읽는 이름 · 색 · 차례
   입니다. `checkStockSql()` 이 빌드마다 양쪽을 맞춰 봅니다 —
   한쪽만 고치면 **에러 없이 조용히** 어긋납니다 (`deal.js` ↔
   `deal_move` 에서 세운 규칙 그대로입니다).
   ════════════════════════════════════════════════════════════════════ */

/* ─── 기기 상태 아홉 ──────────────────────────────────────────────
   ⚠️⚠️ **key 를 바꾸지 마세요** — DB enum 과 같아야 하고, 바꾸면
   이미 쌓인 기록이 통째로 어긋납니다.                              */
window.AM_DEV_ST = [
  { key:"waiting",  n:1, name:"매입 대기",   tone:"gray",
    lead:"신청은 받았고 기기가 아직 안 왔습니다." },
  { key:"arrived",  n:2, name:"입고",        tone:"blue",
    lead:"기기가 도착했습니다. 검수를 기다립니다." },
  { key:"checking", n:3, name:"검수 중",     tone:"blue",
    lead:"전원 · 액정 · 배터리 · 기능을 확인하고 있습니다." },
  /* ⚠️⚠️ **재협의는 실패가 아닙니다.** 적어 주신 상태와 검수 결과가
     다르면 **먼저 알리고 동의를 받습니다** — 중고폰 분쟁의 1번
     원인이 이 자리입니다. 여기서 동의하시면 `checked`, 아니면
     `returning`(반송) 입니다. */
  { key:"regrade",  n:4, name:"금액 재협의", tone:"warn",
    lead:"적어 주신 상태와 달라서, 다시 알려 드리고 동의를 기다립니다." },
  { key:"checked",  n:5, name:"검수 완료",   tone:"ok",
    lead:"등급이 정해졌고 매입가가 확정됐습니다." },
  { key:"listed",   n:6, name:"판매 중",     tone:"blue",
    lead:"쇼핑몰에 올라가 있습니다." },
  { key:"sold",     n:7, name:"판매 완료",   tone:"ok", end:true,
    lead:"팔렸습니다. 여기서 실제 수익이 정해집니다." },
  /* ⚠️ 옆길 둘 — `off:true` 는 **판매로 세지 않는다**는 표시입니다
     (전환율이 보류를 계약으로 세던 그 자리와 같은 규칙). */
  { key:"returning",n:8, name:"반송",        tone:"gray", end:true, off:true,
    lead:"매입하지 않고 기기를 돌려 드립니다." },
  { key:"scrapped", n:9, name:"폐기",        tone:"gray", end:true, off:true,
    lead:"팔 수 없어 폐기했습니다. 매입원가가 그대로 손실입니다." }
];

/* 갈 수 있는 길 — ⚠️⚠️ **여기 없는 길은 DB 가 거절합니다.**
   [from, to, 누가] · `staff` 는 직원 · 관리자 둘 다입니다.        */
window.AM_DEV_MOVE = [
  ["waiting",  "arrived",   "staff"],
  ["waiting",  "returning", "staff"],   /* 안 보내신 경우 */
  ["arrived",  "checking",  "staff"],
  ["arrived",  "returning", "staff"],
  ["checking", "checked",   "staff"],
  ["checking", "regrade",   "staff"],
  ["checking", "returning", "staff"],
  ["regrade",  "checked",   "staff"],   /* 동의하셨습니다 */
  ["regrade",  "returning", "staff"],   /* 안 하셨습니다 */
  ["checked",  "listed",    "staff"],
  ["checked",  "scrapped",  "admin"],   /* ⚠️ 폐기는 관리자만 */
  ["listed",   "sold",      "staff"],
  ["listed",   "checked",   "staff"],   /* 내렸습니다 */
  ["listed",   "scrapped",  "admin"]
];

/* ⚠️⚠️ **같이 적어야 하는 것** — 비면 DB 가 거절합니다.
   `0` 과 `false` 는 값입니다 (있는지만 봅니다).                   */
window.AM_DEV_NEED = {
  checked:   ["grade", "cost"],   /* 확정 등급 · 매입원가 */
  regrade:   ["why"],             /* 무엇이 달랐는지 — 고객에게 갑니다 */
  listed:    ["price"],           /* 판매가 */
  sold:      ["soldPrice"],       /* 실제 판매가 */
  returning: ["why"],
  scrapped:  ["why"]
};

/* ─── 비용 갈래 여섯 ──────────────────────────────────────────────
   ⚠️⚠️ **매입원가는 여기 없습니다** (`device.cost` 한 칸입니다).
   섞으면 "원가가 얼마였나" 를 비용 줄을 더해야 알 수 있고, 줄
   하나를 잘못 지우면 원가가 바뀝니다.                              */
window.AM_DEV_COST = [
  { key:"inbound",  name:"수거 · 입고 배송" },
  { key:"repair",   name:"수리 · 부품" },
  { key:"clean",    name:"세척 · 소모품" },
  { key:"outbound", name:"판매 배송" },
  { key:"fee",      name:"결제 · 판매 수수료" },
  { key:"etc",      name:"그 밖" }
];

/* ════════ 읽는 함수 ════════════════════════════════════════════ */
window.amDevSt = function(k){
  return (window.AM_DEV_ST||[]).filter(function(x){ return x.key === k; })[0] || null; };
window.amDevStName = function(k){ var s = window.amDevSt(k); return s ? s.name : k; };
window.amDevTone = function(k){ var s = window.amDevSt(k); return s ? s.tone : "gray"; };
/* 판매로 세는 상태인가 — ⚠️ 반송 · 폐기를 팔린 것으로 세면 실적이
   거짓말이 됩니다 (전환율이 보류를 계약으로 세던 자리와 같습니다) */
window.amDevSold = function(k){ return k === "sold"; };
window.amDevOff  = function(k){ var s = window.amDevSt(k); return !!(s && s.off); };

/* 갈 수 있는 길인가 — ⚠️ **화면 앞단의 안내일 뿐 자물쇠가 아닙니다.**
   막는 것은 DB 의 move_device() 입니다 (화면 코드로만 막으면 버그
   하나에 뚫립니다). 여기는 왕복 한 번을 아끼고 **사람 말로** 미리
   알려 주는 데까지입니다.                                          */
window.amDevCan = function(from, to, role){
  if(role !== "staff" && role !== "admin") return { ok:false, why:"권한이 없습니다" };
  var hit = (window.AM_DEV_MOVE||[]).filter(function(m){
    return m[0] === from && m[1] === to; })[0];
  if(!hit) return { ok:false, why:"갈 수 없는 길입니다 — " +
    window.amDevStName(from) + " → " + window.amDevStName(to) };
  if(hit[2] === "admin" && role !== "admin")
    return { ok:false, why:"관리자만 할 수 있습니다" };
  return { ok:true, need:(window.AM_DEV_NEED||{})[to] || [] };
};

/* ⚠️⚠️ **수익을 값으로 저장하지 않습니다.** 원가 · 비용 · 판매가에서
   그때그때 셉니다 — 숫자로 들고 있으면 누군가 그 칸을 손으로 고칠 수
   있고 원장과 어긋나기 시작합니다 (업체 평점을 값으로 저장하지 않는
   것과 **같은 까닭**입니다).
   ⚠️ 돌려주는 `real` 은 **팔린 기기에만** 있습니다. 안 팔린 기기의
   "예상 수익" 을 실제 수익에 섞으면 장부가 거짓말이 됩니다.       */
window.amDevProfit = function(d){
  var cost  = Number(d && d.cost || 0);
  var extra = (d && d.costs || []).reduce(function(a, c){
    return a + Number(c.amount || 0); }, 0);
  var spent = cost + extra;
  var ask   = (d && d.price != null) ? Number(d.price) : null;
  var got   = (d && d.sold_price != null) ? Number(d.sold_price) : null;
  return {
    spent: spent,
    /* 예상 — 판매가를 정해 둔 기기에만 */
    est:  ask != null ? (ask - spent) : null,
    /* 실제 — 팔린 기기에만 */
    real: (got != null && d.state === "sold") ? (got - spent) : null
  };
};
