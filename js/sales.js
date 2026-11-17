/* ════════════════════════════════════════════════════════════════════
   영업 작업대 — 업체 찾기 → 등록 → 전화 → 결과 → 안내 → 재연락 → 입점
   (2026-10-07 "원페이지 영업·입점 어드민 전면 개편" 지시서)

   ⚠️⚠️ **직원에게 설명할 것이 이것뿐이어야 합니다** (§39) —
   "업체 찾아서 등록하고, 오늘 전화할 업체 위에서부터 전화하고, 통화 결과
   버튼 누르고, 관심 있다고 하면 안내 보내고, 다시 전화하라고 하면 날짜
   누르면 돼."

   ── 어디에 저장되나 ───────────────────────────────────────
   ⚠️⚠️ **이 브라우저 안에만 남습니다** (`localStorage`). 서버도 DB 도
   없습니다 — 그래서 **이 컴퓨터에서만** 보이고, 브라우저 데이터를 지우면
   사라집니다. 직원이 그 사실을 모르면 하루 일이 날아갑니다. 그래서 —
     · 화면 맨 위에 어디 저장되는지 **그대로 적습니다** (절대 규칙 5)
     · **백업 내려받기 · 불러오기**를 같이 냅니다 (§28 과 같은 까닭)
     · 저장이 막힌 브라우저(사파리 비공개 등)에서는 **붉은 줄로 알립니다**
   백엔드가 들어오면 `slLoad()` · `slSave()` **두 함수만** 바꾸면 됩니다.

   ⚠️⚠️ **붙여 넣은 손님 접수는 여기 저장하지 않습니다.** 영업 DB 에
   들어가는 것은 **공개된 사업자 연락처**이고, 손님의 성함 · 연락처는
   관리자 설정 쪽(3번 칸)에서 **읽고 바로 버립니다.** 둘을 섞지 마세요.

   ⚠️ **세는 값은 저장하지 않습니다.** 전화 수 · 통화 수 · 부재중 횟수 ·
   관심 수가 전부 **활동기록에서 세는 값**입니다. 숫자로 들고 있으면
   누군가 그 칸을 손으로 고칠 수 있고, 기록과 어긋나기 시작합니다
   (업체 평점을 값으로 저장하지 않는 것과 같은 까닭입니다).

   ⚠️ **가짜 업체 · 가짜 실적을 넣지 않습니다** (§37 · 절대 규칙 1).
   등록된 것이 없으면 "없습니다" 라고 말하고 등록 단추를 냅니다.
   ════════════════════════════════════════════════════════════════════ */

var SL_KEY = "am.sales.v1";
var SL_BAK = "am.sales.me.v1";

/* 화면이 들고 있는 것 — 거르개 · 펼친 줄 · 떠 있는 판. 저장하지 않습니다. */
var SL = { st:"", g:"", reg:"", q:"", open:"", per:"today", modal:null, dup:null };

var SL_DB = null;      /* 불러온 영업 DB */
var SL_OK = true;      /* 저장이 되는 브라우저인가 */

/* ── 저장 ──────────────────────────────────────────────────
   ⚠️ `localStorage` 는 사파리 비공개 모드에서 **던집니다.** 감싸지
   않으면 화면이 통째로 안 그려집니다. */
function slFresh(){
  /* `last` — 마지막으로 쓴 카테고리 · 지역입니다. ⚠️ 스물, 서른 곳을
     연달아 넣는 자리라 **등록할 때마다 다시 고르게 하면 안 됩니다** (§7). */
  return { v:1, me:"", goal:{ g:"", reg:"", n:30, d:"" },
           last:{ g:"", reg:"" }, co:[] };
}

function slLoad(){
  try {
    var raw = localStorage.getItem(SL_KEY);
    SL_OK = true;
    if(!raw) return slFresh();
    var d = JSON.parse(raw);
    if(!d || typeof d !== "object" || !Array.isArray(d.co)) return slFresh();
    if(!d.goal) d.goal = slFresh().goal;
    if(!d.last) d.last = slFresh().last;
    if(typeof d.me !== "string") d.me = "";
    return d;
  } catch(e){
    SL_OK = false;
    console.warn("[영업 작업대] 저장소를 쓸 수 없습니다 — " + e.message);
    return slFresh();
  }
}

function slSave(){
  try {
    localStorage.setItem(SL_KEY, JSON.stringify(SL_DB));
    SL_OK = true;
  } catch(e){
    SL_OK = false;
    console.warn("[영업 작업대] 저장하지 못했습니다 — " + e.message);
  }
}

function slDb(){
  if(!SL_DB) SL_DB = slLoad();
  return SL_DB;
}

/* 담당자 이름 — §32. 직원이 늘어나도 기록에 누가 했는지 남습니다. */
function slMe(){
  var d = slDb();
  if(d.me) return d.me;
  try { return localStorage.getItem(SL_BAK) || ""; } catch(e){ return ""; }
}

window.slSetMe = function(v){
  var d = slDb();
  d.me = String(v || "").slice(0, 20);
  try { localStorage.setItem(SL_BAK, d.me); } catch(e){}
  slSave();
};

/* ── 날짜 ──────────────────────────────────────────────────
   ⚠️⚠️ `toISOString()` 을 쓰지 마세요 — UTC 로 바꿔서 **한국 시간 아침
   9시 전에는 어제 날짜**가 나옵니다. 재연락 날짜가 하루씩 밀립니다. */
function slDay(dt){
  var d = dt || new Date();
  function p(n){ return (n < 10 ? "0" : "") + n; }
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}

function slToday(){ return slDay(); }

function slPlus(n){
  var d = new Date();
  d.setDate(d.getDate() + n);
  return slDay(d);
}

/* 며칠 지났나 (양수 = 지났음) */
function slDaysAgo(day){
  if(!day) return 0;
  var a = new Date(slToday() + "T00:00:00");
  var b = new Date(day + "T00:00:00");
  return Math.round((a - b) / 86400000);
}

var SL_WD = ["일", "월", "화", "수", "목", "금", "토"];

function slTodayLabel(){
  var d = new Date();
  return d.getFullYear() + "년 " + (d.getMonth() + 1) + "월 " + d.getDate() + "일 " +
    SL_WD[d.getDay()] + "요일";
}

/* 기간 — 오늘 · 이번주(월요일부터) · 이번달 */
function slFrom(per){
  var d = new Date();
  if(per === "week"){
    var wd = d.getDay();                 /* 0=일 */
    d.setDate(d.getDate() - (wd === 0 ? 6 : wd - 1));
    return slDay(d);
  }
  if(per === "month") return slDay(d).slice(0, 8) + "01";
  return slToday();
}

function slInPer(day, per){
  if(!day) return false;
  return day >= slFrom(per) && day <= slToday();
}

/* ── 활동기록 ──────────────────────────────────────────────
   모든 활동이 여기 남습니다 (§27 "모든 활동은 자동으로 기록한다").
   `w` 가 무슨 일인지, `r` 이 통화 결과, `n` 이 메모입니다. */
function slLog(c, w, note, r){
  if(!c.log) c.log = [];
  c.log.push({ d:slToday(), t:slClock(), by:slMe(), w:w,
               n:note || "", r:r || "" });
}

function slClock(){
  var d = new Date();
  function p(n){ return (n < 10 ? "0" : "") + n; }
  return p(d.getHours()) + ":" + p(d.getMinutes());
}

/* 업체 하나에서 **세는** 값들 — 저장하지 않습니다 */
function slCalls(c){
  return (c.log || []).filter(function(x){ return x.w === "call"; }).length;
}
function slMissN(c){
  return (c.log || []).filter(function(x){ return x.r === "miss"; }).length;
}
function slLastCall(c){
  var L = (c.log || []).filter(function(x){ return x.w === "call"; });
  return L.length ? L[L.length - 1].d : "";
}

/* 기간 안의 활동 수 — 퍼널 · 오늘 현황 · 카테고리별 성과가 다 이걸 씁니다 */
function slCount(per, pick, gKey){
  var n = 0;
  slDb().co.forEach(function(c){
    if(gKey && c.g !== gKey) return;
    (c.log || []).forEach(function(x){
      if(slInPer(x.d, per) && pick(x, c)) n++;
    });
  });
  return n;
}

function slStat(per, gKey){
  var co = slDb().co.filter(function(c){ return !gKey || c.g === gKey; });
  return {
    db:    co.filter(function(c){ return slInPer(c.at, per); }).length,
    call:  slCount(per, function(x){ return x.w === "call"; }, gKey),
    /* 통화 = 사람과 말이 된 것. 부재중 · 번호오류는 빼고 셉니다. */
    talk:  slCount(per, function(x){
             return x.w === "call" && x.r !== "miss" && x.r !== "bad"; }, gKey),
    warm:  slCount(per, function(x){ return x.w === "call" && x.r === "warm"; }, gKey),
    sent:  slCount(per, function(x){ return x.w === "sent"; }, gKey),
    done:  slCount(per, function(x){ return x.w === "done"; }, gKey)
  };
}

/* 백분율 — ⚠️ 분모가 0 이면 숫자를 내지 않습니다 ("0%" 는 비율이 아닙니다) */
function slPct(a, b){
  if(!b) return "";
  return Math.round(a / b * 1000) / 10 + "%";
}

/* ════════════════════════════════════════════════════════════════════
   업체 — 등록 · 수정 · 보관 (§7 · §8 · §28)
   ════════════════════════════════════════════════════════════════════ */

/* 전화번호는 **숫자만 남겨서** 견줍니다 — 031-000-0000 과 0310000000 은
   같은 번호입니다. 하이픈을 그대로 비교하면 중복이 줄줄이 쌓입니다. */
function slTel(s){ return String(s || "").replace(/[^0-9]/g, ""); }

/* 번호를 보기 좋게 — ⚠️ 모양만 바꿉니다. 저장은 적으신 그대로 둡니다. */
function slTelShow(s){
  var t = slTel(s);
  if(t.length === 11) return t.slice(0,3) + "-" + t.slice(3,7) + "-" + t.slice(7);
  if(t.length === 10 && t.slice(0,2) === "02")
    return t.slice(0,2) + "-" + t.slice(2,6) + "-" + t.slice(6);
  if(t.length === 10) return t.slice(0,3) + "-" + t.slice(3,6) + "-" + t.slice(6);
  if(t.length === 9  && t.slice(0,2) === "02")
    return t.slice(0,2) + "-" + t.slice(2,5) + "-" + t.slice(5);
  return String(s || "");
}

function slById(id){
  var L = slDb().co, i;
  for(i = 0; i < L.length; i++) if(L[i].id === id) return L[i];
  return null;
}

/* 같은 번호가 이미 있나 (§8) — 보관한 업체도 찾습니다.
   보관한 것을 빼면 "없다" 고 하고 또 등록하게 되어 중복이 쌓입니다. */
function slDupTel(tel, skipId){
  var t = slTel(tel);
  if(t.length < 8) return null;
  var L = slDb().co, i;
  for(i = 0; i < L.length; i++)
    if(L[i].id !== skipId && slTel(L[i].tel) === t) return L[i];
  return null;
}

/* 보조로 업체명도 봅니다 (§8) — 번호를 다르게 적어 온 같은 업체 */
function slDupName(name, skipId){
  var n = String(name || "").replace(/\s/g, "");
  if(n.length < 2) return null;
  var L = slDb().co, i;
  for(i = 0; i < L.length; i++)
    if(L[i].id !== skipId && String(L[i].name).replace(/\s/g, "") === n) return L[i];
  return null;
}

/* id — 겹치지 않게. 주소가 되는 값이 아니라 **기록을 잇는 값**입니다. */
function slNewId(){
  return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/* 등록 (§7) — 필수는 업체명 · 전화번호 · 카테고리 셋뿐입니다 */
window.slAdd = function(){
  var name = ($("sl-name") || {}).value || "";
  var tel  = ($("sl-tel")  || {}).value || "";
  var g    = ($("sl-g")    || {}).value || "";
  var reg  = ($("sl-reg")  || {}).value || "";
  var gu   = ($("sl-gu")   || {}).value || "";
  var url  = ($("sl-url")  || {}).value || "";
  var memo = ($("sl-memo") || {}).value || "";

  name = name.trim(); tel = tel.trim();

  /* ⚠️ 빠진 칸을 **말해 줍니다.** 조용히 아무 일도 안 하면 직원은
     단추가 고장 난 줄 압니다. */
  var miss = [];
  if(!name) miss.push("업체명");
  if(slTel(tel).length < 8) miss.push("전화번호");
  if(!g) miss.push("카테고리");
  if(miss.length){
    toast(miss.join(" · ") + "을(를) 적어 주세요");
    var f = $(!name ? "sl-name" : (slTel(tel).length < 8 ? "sl-tel" : "sl-g"));
    if(f) f.focus();
    return;
  }

  /* 중복이면 **등록하지 않고** 기존 업체를 보여 줍니다 (§8) */
  var dup = slDupTel(tel) || slDupName(name);
  if(dup){
    SL.dup = dup.id;
    slDraw();
    var box = $("sl-dup");
    if(box && box.scrollIntoView) box.scrollIntoView({ block:"nearest" });
    return;
  }

  var c = { id:slNewId(), name:name, tel:tel, g:g, reg:reg, gu:gu.trim(),
            url:url.trim(), memo:memo.trim(), st:"new", next:"", nextMemo:"",
            why:"", doc:{}, ar:false, at:slToday(), by:slMe(), log:[] };
  slLog(c, "add", "");
  slDb().co.unshift(c);
  /* ⚠️ 다음 업체도 보통 **같은 분야 · 같은 지역**입니다. 기억해 두지
     않으면 서른 곳을 넣는 동안 서른 번 다시 고르게 됩니다. */
  slDb().last = { g:g, reg:reg };
  slSave();

  SL.dup = null;
  /* 등록 후 칸을 비우고 커서를 다시 업체명으로 (§7) — 스물, 서른 개를
     연달아 넣는 자리입니다. ⚠️ 카테고리 · 지역은 **그대로 둡니다**:
     보통 같은 분야 · 같은 지역을 몰아서 찾으십니다. */
  ["sl-name", "sl-tel", "sl-url", "sl-memo", "sl-gu"].forEach(function(id){
    var el = $(id); if(el) el.value = "";
  });
  slDraw();
  var nm = $("sl-name");
  if(nm) nm.focus();
  toast(name + " 등록했습니다");
};

/* 엔터로 다음 칸 · 마지막 칸에서 엔터면 등록 (§7 — 손이 마우스로 안 가게) */
window.slKey = function(ev, next){
  if(ev.key !== "Enter") return;
  ev.preventDefault();
  if(next === "add") slAdd();
  else { var el = $(next); if(el) el.focus(); }
};

window.slDupGo = function(id){
  SL.dup = null;
  SL.q = "";
  SL.st = "";
  SL.open = id;
  slDraw();
  var row = document.getElementById("sl-row-" + id);
  if(row && row.scrollIntoView) row.scrollIntoView({ block:"center" });
};

window.slDupClose = function(){ SL.dup = null; slDraw(); };

/* ── 수정 (§28) ────────────────────────────────────────────
   삭제는 쉽게 눌리지 않게 합니다 — 기본은 **보관**입니다. */
window.slEdit = function(id, field, v){
  var c = slById(id);
  if(!c) return;
  var was = c[field];
  v = String(v == null ? "" : v).trim();
  if(was === v) return;
  c[field] = v;
  slLog(c, "edit", field + ": " + (was || "(빈칸)") + " → " + (v || "(빈칸)"));
  slSave();
};

window.slArchive = function(id, on){
  var c = slById(id);
  if(!c) return;
  c.ar = !!on;
  slLog(c, "ar", on ? "보관함으로" : "보관 해제");
  slSave();
  slDraw();
  toast(c.name + (on ? " 보관했습니다" : " 보관을 풀었습니다"));
};

/* ── 상태 바꾸기 ───────────────────────────────────────────
   ⚠️ 직원이 상태를 손으로 고르는 자리를 **만들지 않았습니다** (§13 —
   "별도로 직원이 상태를 다시 변경하지 않게 한다"). 상태는 통화 결과와
   발송 · 입점 단추를 누를 때 **저절로** 바뀝니다. */
function slSetSt(c, st, w, note){
  c.st = st;
  slLog(c, w || st, note || "");
  slSave();
}

/* 통화 결과 (§12) */
/* ⚠️ 결과를 누르는 순간 **전화 한 건이 기록됩니다.** 그래서 전화 수 ·
   통화 수를 직원이 따로 적을 일이 없습니다 (§22 · §31). */
window.slResult = function(id, r){
  var c = slById(id);
  if(!c) return;
  var R = (window.AM_SALES_RESULT || []).filter(function(x){ return x.key === r; })[0];
  if(!R) return;

  /* 통화 한 건 — `r` 이 결과입니다 */
  slLog(c, "call", R.name, r);
  c.st = R.st;

  if(r === "miss"){
    /* §15 — 부재중이면 **다음 영업일**로 저절로 올립니다. 직원이
       날짜를 또 고르지 않게 합니다. */
    c.next = slNextWorkday();
    c.nextMemo = "부재중 " + slMissN(c) + "회";
    slSave();
    SL.modal = null;
    slDraw();
    toast(c.name + " 부재중 " + slMissN(c) + "회 — " + c.next + " 로 올렸습니다");
    return;
  }
  if(r === "bad"){
    c.next = "";
    slSave();
    SL.modal = null;
    slDraw();
    toast(c.name + " 번호오류로 적었습니다");
    return;
  }
  if(r === "warm"){
    c.next = "";
    slSave();
    SL.modal = { k:"warm", id:id };   /* 바로 입점 안내 보내기 (§13) */
    slDraw();
    return;
  }
  if(r === "recall"){
    /* ⚠️⚠️ 날짜를 **미리 내일로** 잡아 둡니다. 판을 그냥 닫으면 날짜가
       없는 "재연락" 이 되어 **오늘 목록에도 연락전에도 안 떠서 그대로
       잊힙니다.** 아래 판에서 고르시면 덮어씁니다. */
    c.next = slPlus(1);
    c.nextMemo = "";
    slSave();
    SL.modal = { k:"when", id:id };   /* 언제 다시 연락할까요 (§14) */
    slDraw();
    return;
  }
  /* 관심없음 — 사유는 고르지 않아도 됩니다 (§16) */
  c.next = "";
  slSave();
  SL.modal = { k:"why", id:id };
  slDraw();
};

/* 토 · 일을 건너뜁니다 — 월요일 아침에 "지난 토요일 재연락" 이 쌓여
   있으면 밀린 목록이 거짓으로 길어집니다. */
function slNextWorkday(){
  var d = new Date();
  do { d.setDate(d.getDate() + 1); } while(d.getDay() === 0 || d.getDay() === 6);
  return slDay(d);
}

/* 재연락 날짜 (§14) */
window.slWhen = function(id, days){
  var c = slById(id);
  if(!c) return;
  var memo = (($("sl-when-memo") || {}).value || "").trim();
  /* ⚠️ 먼저 `c.next` 에 넣고 검사하면, 날짜를 안 고르고 누른 순간
     **이미 잡혀 있던 약속이 지워집니다.** 따로 받아서 확인한 뒤 넣습니다. */
  var when = days ? slPlus(Number(days)) : (($("sl-when-d") || {}).value || "");
  if(!when){ toast("날짜를 골라 주세요"); return; }
  c.next = when;
  c.nextMemo = memo;
  slLog(c, "plan", c.next + (memo ? " · " + memo : ""));
  slSave();
  SL.modal = null;
  slDraw();
  toast(c.name + " → " + c.next + " 재연락");
};

/* 거절 사유 (§16) — 안 고르고 닫아도 상태는 이미 관심없음입니다 */
window.slWhy = function(id, why){
  var c = slById(id);
  if(!c) return;
  c.why = why || "";
  if(why) slLog(c, "note", "거절 사유: " + why);
  slSave();
  SL.modal = null;
  slDraw();
  toast(c.name + " 관심없음으로 적었습니다");
};

/* 발송 완료 (§13) — 누르면 상태가 **저절로** 입점제안이 됩니다 */
window.slSent = function(id){
  var c = slById(id);
  if(!c) return;
  slSetSt(c, "sent", "sent", "입점 안내 발송");
  /* ⚠️ 보내 놓고 잊히는 것이 제일 많습니다. 3일 뒤로 확인 약속을
     자동으로 잡아 둡니다 — 직원이 날짜를 또 고르지 않게 (§22). */
  c.next = slPlus(3);
  c.nextMemo = "입점 안내 확인";
  slSave();
  SL.modal = null;
  slDraw();
  toast(c.name + " 입점제안 — " + c.next + " 확인 예정");
};

/* 입점 진행 (§19 · §21) */
window.slStage = function(id, st){
  var c = slById(id);
  if(!c) return;
  slSetSt(c, st, st, amSalesStName(st));
  if(st === "done"){ c.next = ""; c.nextMemo = ""; }
  if(st === "doc"){ c.next = slPlus(3); c.nextMemo = "자료 확인"; }
  slSave();
  slDraw();
  toast(c.name + " → " + amSalesStName(st));
};

/* 자료 완성도 (§21) — 받은 것을 눌러 둡니다. ⚠️ **세는 값**이라
   손으로 적는 퍼센트 칸이 없습니다. */
window.slDoc = function(id, key, on){
  var c = slById(id);
  if(!c) return;
  if(!c.doc) c.doc = {};
  c.doc[key] = !!on;
  slLog(c, "note", "자료 " + key + (on ? " 받음" : " 취소"));
  slSave();
  slDraw();
};

function slDocPct(c){
  var L = window.AM_SALES_DOC || [], n = 0;
  L.forEach(function(d){ if(c.doc && c.doc[d.key]) n++; });
  return L.length ? Math.round(n / L.length * 100) : 0;
}

/* 메모 (§22 — 자유입력은 짧은 메모까지) */
window.slNote = function(id){
  var c = slById(id);
  if(!c) return;
  var el = $("sl-note-" + id);
  var v = (el ? el.value : "").trim();
  if(!v){ toast("적을 내용이 없습니다"); return; }
  slLog(c, "note", v);
  if(el) el.value = "";
  slSave();
  slDraw();
  toast("적었습니다");
};

/* ── 떠 있는 판 ───────────────────────────────────────────── */
window.slOpen = function(k, id){ SL.modal = { k:k, id:id }; slDraw(); };
window.slShut = function(){ SL.modal = null; slDraw(); };

/* ── 거르개 (§9 · §26) ─────────────────────────────────────
   ⚠️ 상태 칩의 **입점제안**은 제안 뒤 진행 중인 것을 다 집습니다
   (제안 · 자료대기 · 검토필요). 직원이 보기에는 "안내 보낸 곳" 하나입니다. */
var SL_FIL = [
  { key:"",       name:"전체" },
  { key:"new",    name:"연락전" },
  { key:"recall", name:"재연락" },
  { key:"warm",   name:"관심" },
  { key:"sent",   name:"입점제안", also:["doc", "review"] },
  { key:"done",   name:"입점완료" },
  { key:"no",     name:"거절",     also:["bad"] }
];

function slStMatch(fil, st){
  if(!fil) return true;
  var F = SL_FIL.filter(function(x){ return x.key === fil; })[0];
  if(!F) return st === fil;
  return st === F.key || (F.also || []).indexOf(st) >= 0;
}

/* 검색 — 업체명 · 전화번호 · 지역 · 카테고리 (§26).
   ⚠️ 번호는 **일부만 적어도** 찾아야 합니다 (숫자만 남겨서 견줍니다). */
function slHit(c, q){
  if(!q) return true;
  var s = String(q).trim().toLowerCase();
  var digits = slTel(s);
  if(digits.length >= 2 && slTel(c.tel).indexOf(digits) >= 0) return true;
  var hay = [c.name, c.tel, c.gu, c.memo,
             amSalesGroupName(c.g),
             (window.amRegionName ? amRegionName(c.reg) : "")]
            .join(" ").toLowerCase();
  return hay.indexOf(s) >= 0;
}

function slList(){
  return slDb().co.filter(function(c){
    if(c.ar) return false;
    if(!slStMatch(SL.st, c.st)) return false;
    if(SL.g && c.g !== SL.g) return false;
    if(SL.reg && c.reg !== SL.reg) return false;
    return slHit(c, SL.q);
  });
}

/* 오늘 다시 연락할 업체 (§17 · §18) — 밀린 것이 **위로** 옵니다 */
function slRecallList(){
  return slDb().co
    .filter(function(c){
      if(c.ar) return false;
      if(c.st === "done" || c.st === "no" || c.st === "bad") return false;
      return c.next && c.next <= slToday();
    })
    .sort(function(a, b){ return a.next < b.next ? -1 : (a.next > b.next ? 1 : 0); });
}

window.slFil = function(what, v){
  SL[what] = v;
  if(what === "st") SL.open = "";
  slDraw();
};

window.slSearch = function(v){ SL.q = v; slDraw(); };
window.slPer = function(p){ SL.per = p; slDraw(); };
window.slRow = function(id){ SL.open = (SL.open === id ? "" : id); slDraw(); };

/* ════════════════════════════════════════════════════════════════════
   그리기 — 한 화면 (§2 · §34)

   차례가 곧 우선순위입니다. 첫 화면에 **오늘 현황 · 오늘 할 일 · 빠른
   등록 · 재연락 · 업체 목록**이 오고, 실적과 통계는 아래로 내립니다.
   ⚠️ 업체 상세는 **줄을 눌러 펼칩니다** — 다른 화면으로 보내지 않습니다.
   ════════════════════════════════════════════════════════════════════ */

function slOpt(list, val, ph){
  return '<option value="">' + esc(ph) + '</option>' +
    list.map(function(o){
      return '<option value="' + esc(o[0]) + '"' +
        (o[0] === val ? ' selected' : '') + '>' + esc(o[1]) + '</option>';
    }).join("");
}

/* 영업 카테고리 고르개 — ⚠️ 먼저 돌 분야(prio 1)가 위에 옵니다 (§6) */
function slGroupOpts(){
  return (window.AM_SALES_GROUPS || [])
    .slice()
    .sort(function(a, b){ return (a.prio - b.prio) || (a.no < b.no ? -1 : 1); })
    .map(function(g){ return [g.key, g.no + ". " + g.name]; });
}

function slRegionOpts(){
  return (window.AM_REGIONS || []).map(function(r){ return [r.key, r.name]; });
}

/* ── ① 오늘 영업 (§3) ─────────────────────────────────────── */
function slTop(){
  var s = slStat("today");
  var cells = [
    ["DB 등록",  s.db,   ""],
    ["전화",     s.call, ""],
    ["관심",     s.warm, "warm"],
    ["입점제안", s.sent, "sent"],
    ["입점완료", s.done, "done"]
  ];
  return '<section class="sl-s sl-top">' +
    '<div class="sl-top-h">' +
      '<h2>오늘 영업</h2>' +
      '<span class="sl-date">' + esc(slTodayLabel()) + '</span>' +
    '</div>' +
    '<div class="sl-nums">' +
      cells.map(function(c){
        /* 숫자를 누르면 아래 목록이 그 상태로 걸러집니다 (§3) */
        return c[2]
          ? '<button class="sl-n" type="button" onclick="slFil(\'st\',\'' + c[2] + '\')">' +
              '<b>' + c[1] + '</b><i>' + esc(c[0]) + '</i></button>'
          : '<div class="sl-n"><b>' + c[1] + '</b><i>' + esc(c[0]) + '</i></div>';
      }).join("") +
    '</div>' +
  '</section>';
}

/* ── ② 오늘 찾을 업체 (§4 · §5) ───────────────────────────── */
function slGoalBox(){
  var G = slDb().goal;
  var g = G.g ? amSalesGroup(G.g) : null;
  var goal = Number(G.n) || 0;

  /* 진행 = **오늘 등록한 수**입니다 (고른 분야 · 지역 안에서) */
  var done = slDb().co.filter(function(c){
    if(!slInPer(c.at, "today")) return false;
    if(G.g && c.g !== G.g) return false;
    if(G.reg && c.reg !== G.reg) return false;
    return true;
  }).length;
  var pct = goal ? Math.min(100, Math.round(done / goal * 100)) : 0;

  /* 그 분야에서 **무슨 말로 찾나** — 검색할 말입니다 (서비스 목록이 아닙니다) */
  var find = g ? (g.find || []) : [];
  var svc  = g ? amSalesServiceNames(g, 8) : [];
  var regN = G.reg ? amRegionName(G.reg) : "";

  return '<section class="sl-s">' +
    '<h2>오늘 찾을 업체</h2>' +
    '<div class="sl-goal-f">' +
      '<label class="sl-f"><span>카테고리</span>' +
        '<select class="f-sel" onchange="slGoal(\'g\',this.value)">' +
          slOpt(slGroupOpts(), G.g, "골라 주세요") + '</select></label>' +
      '<label class="sl-f"><span>지역</span>' +
        '<select class="f-sel" onchange="slGoal(\'reg\',this.value)">' +
          slOpt(slRegionOpts(), G.reg, "전국") + '</select></label>' +
      '<label class="sl-f sl-f-n"><span>오늘 목표</span>' +
        '<input type="number" min="1" max="200" inputmode="numeric" value="' + goal +
          '" onchange="slGoal(\'n\',this.value)"></label>' +
    '</div>' +

    (g
      ? '<div class="sl-goal-now">' +
          '<b>' + esc(g.name) + '</b>' +
          (regN ? '<span>' + esc(regN) + '</span>' : '<span>전국</span>') +
          '<i>' + done + ' / ' + goal + '</i>' +
        '</div>' +
        '<div class="sl-bar"><span style="width:' + pct + '%"></span></div>' +
        (find.length
          ? '<p class="sl-find"><b>이 말로 찾으세요</b>' +
            find.map(function(w){
              return '<span class="sl-kw">' + esc(w) + '</span>';
            }).join("") + '</p>'
          : '') +
        (svc.length
          ? '<p class="sl-svc"><b>저희가 이 분야에서 다루는 서비스</b> ' +
            esc(svc.join(" · ")) +
            (amSalesServiceNames(g).length > svc.length
              ? ' 외 ' + (amSalesServiceNames(g).length - svc.length) + '개' : '') +
            '</p>'
          : '')
      : '<p class="sl-empty">카테고리를 고르시면 오늘 무엇을 찾을지와 ' +
        '검색할 말이 나옵니다.</p>') +
  '</section>';
}

window.slGoal = function(what, v){
  var G = slDb().goal;
  if(what === "n"){
    var n = Math.max(1, Math.min(200, Number(v) || 1));
    G.n = n;
  } else G[what] = v;
  G.d = slToday();
  if(what === "g" || what === "reg"){
    if(!slDb().last) slDb().last = { g:"", reg:"" };
    slDb().last[what === "g" ? "g" : "reg"] = v;
  }
  slSave();
  /* 등록 칸의 카테고리 · 지역도 같이 맞춰 둡니다 — 같은 분야를 몰아서
     넣으시는 자리라 두 번 고르게 하지 않습니다 (§22) */
  if(what === "g"){ var e = $("sl-g"); if(e) e.value = v; }
  if(what === "reg"){ var r = $("sl-reg"); if(r) r.value = v; }
  slDraw();
};

/* 등록 칸이 미리 골라 둘 값 — 마지막에 쓴 것, 없으면 오늘 목표의 것 */
function slLast(){
  var d = slDb(), L = d.last || {}, G = d.goal || {};
  return { g: L.g || G.g || "", reg: L.reg || G.reg || "" };
}

/* ── ③ 빠른 업체 등록 (§7 · §8) ───────────────────────────── */
function slAddBox(){
  var G = slLast();
  var dup = SL.dup ? slById(SL.dup) : null;

  return '<section class="sl-s sl-add">' +
    '<h2>업체 빠른 등록</h2>' +
    '<p class="sl-lead">업체명 · 전화번호 · 카테고리만 적으면 됩니다. ' +
      '엔터로 다음 칸으로 넘어가고, 마지막 칸에서 엔터를 누르면 등록됩니다 — ' +
      '등록하면 칸이 비고 커서가 업체명으로 돌아갑니다.</p>' +

    (dup ? slDupBox(dup) : '') +

    '<div class="sl-add-g">' +
      '<label class="sl-f sl-f-w"><span>업체명 <em>*</em></span>' +
        '<input id="sl-name" type="text" autocomplete="organization" ' +
          'placeholder="예: 대한인테리어" onkeydown="slKey(event,\'sl-tel\')"></label>' +
      '<label class="sl-f"><span>전화번호 <em>*</em></span>' +
        '<input id="sl-tel" type="tel" inputmode="tel" autocomplete="tel" ' +
          'placeholder="031-000-0000" onkeydown="slKey(event,\'sl-g\')"></label>' +
      '<label class="sl-f"><span>카테고리 <em>*</em></span>' +
        '<select id="sl-g" class="f-sel">' +
          slOpt(slGroupOpts(), G.g, "골라 주세요") + '</select></label>' +
      '<label class="sl-f"><span>지역</span>' +
        '<select id="sl-reg" class="f-sel">' +
          slOpt(slRegionOpts(), G.reg, "고르지 않음") + '</select></label>' +
      '<label class="sl-f"><span>시 · 군 · 구</span>' +
        '<input id="sl-gu" type="text" autocomplete="off" placeholder="예: 성남시" ' +
          'onkeydown="slKey(event,\'sl-url\')"></label>' +
      '<label class="sl-f sl-f-w"><span>홈페이지 · 블로그 · SNS</span>' +
        '<input id="sl-url" type="url" inputmode="url" autocomplete="off" ' +
          'placeholder="https://" onkeydown="slKey(event,\'sl-memo\')"></label>' +
      '<label class="sl-f sl-f-w"><span>메모</span>' +
        '<input id="sl-memo" type="text" autocomplete="off" ' +
          'placeholder="예: 블로그에 시공사진 많음" onkeydown="slKey(event,\'add\')"></label>' +
    '</div>' +
    '<div class="sl-acts">' +
      '<button class="btn btn-b sl-big" type="button" onclick="slAdd()">' +
        icon("plus", 20) + '업체 등록</button>' +
    '</div>' +
  '</section>';
}

/* 중복 (§8) — 등록하지 않고 **기존 업체를 보여 줍니다** */
function slDupBox(c){
  return '<div class="sl-dup" id="sl-dup">' +
    '<b>' + icon("alert", 18) + '이미 등록된 업체입니다</b>' +
    '<p><strong>' + esc(c.name) + '</strong><br>' +
      esc(c.at) + ' 등록<br>현재 상태: ' + esc(amSalesStName(c.st)) +
      (slCalls(c) ? ' · 통화 ' + slCalls(c) + '회' : '') + '</p>' +
    '<div class="sl-acts">' +
      '<button class="btn btn-b" type="button" onclick="slDupGo(\'' + c.id + '\')">' +
        '기존 업체 보기</button>' +
      '<button class="btn btn-o" type="button" onclick="slDupClose()">닫기</button>' +
    '</div>' +
  '</div>';
}

/* ── ④ 오늘 다시 연락할 업체 (§17 · §18) ──────────────────── */
function slRecallBox(){
  var L = slRecallList();
  if(!L.length) return '';

  var late = L.filter(function(c){ return slDaysAgo(c.next) > 0; }).length;

  return '<section class="sl-s sl-rc">' +
    '<h2>오늘 다시 연락할 업체 <em>' + L.length + '</em></h2>' +
    (late
      ? '<p class="sl-lead sl-lead-bad">' + icon("alert", 16) +
        '약속 날짜가 지난 곳이 ' + late + '곳입니다 — <b>오래 밀린 순</b>으로 ' +
        '놓았습니다. 위에서부터 전화하세요.</p>'
      : '<p class="sl-lead">오늘 연락하기로 한 곳입니다. 위에서부터 전화하세요.</p>') +
    '<div class="sl-rc-g">' +
      L.map(slRecallCard).join("") +
    '</div>' +
  '</section>';
}

function slRecallCard(c){
  var ago = slDaysAgo(c.next);
  var last = slLastCall(c);
  var lastAgo = last ? slDaysAgo(last) : null;

  return '<div class="sl-rc-c' + (ago > 0 ? ' sl-rc-late' : '') + '">' +
    '<div class="sl-rc-t">' +
      '<b>' + esc(c.name) + '</b>' +
      (ago > 0
        ? '<span class="sl-late">' + icon("alert", 14) + ago + '일 지남</span>'
        : '<span class="sl-tod">오늘</span>') +
    '</div>' +
    '<p class="sl-rc-m">' + esc(slWhere(c)) + '</p>' +
    '<p class="sl-rc-w">' +
      (lastAgo === null ? '아직 통화 전'
        : (lastAgo === 0 ? '오늘 통화' : lastAgo + '일 전 통화')) +
      ' · ' + esc(amSalesStName(c.st)) +
      (slMissN(c) ? ' · 부재중 ' + slMissN(c) + '회' : '') +
    '</p>' +
    (c.nextMemo ? '<p class="sl-rc-n">“' + esc(c.nextMemo) + '”</p>' : '') +
    '<div class="sl-acts">' +
      '<button class="btn btn-b" type="button" onclick="slOpen(\'call\',\'' + c.id + '\')">' +
        icon("phone", 18) + '전화하기</button>' +
      '<a class="btn btn-o sl-tel-a" href="tel:' + esc(telNum(c.tel)) + '">' +
        esc(slTelShow(c.tel)) + '</a>' +
    '</div>' +
  '</div>';
}

/* 어디 업체인가 — 카테고리 · 지역 한 줄.
   ⚠️ 비어 있는 것은 **줄째 빼지 않고 가운뎃점만 뺍니다** — 점이 매달려
   "인테리어 · " 로 나오는 사고가 이 저장소에 있었습니다. */
function slWhere(c){
  var out = [];
  var g = amSalesGroupName(c.g);
  if(g) out.push(g);
  var r = c.reg ? amRegionName(c.reg) : "";
  var place = [r, c.gu].filter(function(x){ return !!x; }).join(" ");
  if(place) out.push(place);
  return out.join(" · ");
}

/* ── ⑤ 업체 영업관리 (§9 · §10 · §26) ─────────────────────── */
function slListBox(){
  var all = slDb().co.filter(function(c){ return !c.ar; });
  var L = slList();
  var arN = slDb().co.filter(function(c){ return c.ar; }).length;

  /* 아무것도 없을 때 (§37) — ⚠️ 가짜 업체를 넣지 않습니다 */
  if(!all.length){
    return '<section class="sl-s" id="sl-list">' +
      '<h2>업체 영업관리</h2>' +
      '<div class="sl-none">' +
        '<b>아직 등록된 영업 업체가 없습니다.</b>' +
        '<p>위 <b>업체 빠른 등록</b>에 업체명 · 전화번호 · 카테고리만 적으면 ' +
          '바로 이 목록에 나옵니다. 첫 번째 업체를 등록해 보세요.</p>' +
        '<button class="btn btn-b sl-big" type="button" onclick="slFocusAdd()">' +
          icon("plus", 20) + '업체 등록</button>' +
      '</div>' +
    '</section>';
  }

  return '<section class="sl-s" id="sl-list">' +
    '<h2>업체 영업관리 <em>' + all.length + '</em></h2>' +

    '<div class="sl-chips">' +
      SL_FIL.map(function(f){
        var n = all.filter(function(c){ return slStMatch(f.key, c.st); }).length;
        return '<button type="button" class="sl-chip' +
          (SL.st === f.key ? ' on' : '') + '" onclick="slFil(\'st\',\'' +
          f.key + '\')">' + esc(f.name) + '<i>' + n + '</i></button>';
      }).join("") +
    '</div>' +

    '<div class="sl-fils">' +
      '<label class="sl-f"><span>카테고리</span>' +
        '<select class="f-sel" onchange="slFil(\'g\',this.value)">' +
          slOpt(slGroupOpts(), SL.g, "카테고리 전체") + '</select></label>' +
      '<label class="sl-f"><span>지역</span>' +
        '<select class="f-sel" onchange="slFil(\'reg\',this.value)">' +
          slOpt(slRegionOpts(), SL.reg, "지역 전체") + '</select></label>' +
      '<label class="sl-f sl-f-w"><span>검색</span>' +
        '<input type="search" value="' + esc(SL.q) + '" ' +
          'placeholder="업체명 · 전화번호 일부 · 지역" ' +
          'oninput="slSearch(this.value)"></label>' +
    '</div>' +

    (L.length
      ? '<div class="sl-rows">' + L.map(slRowHtml).join("") + '</div>'
      : '<p class="sl-empty">조건에 맞는 업체가 없습니다. 위 거르개를 ' +
        '바꿔 보세요.</p>') +

    (L.length !== all.length
      ? '<p class="sl-off">전체 ' + all.length + '곳 중 ' + L.length +
        '곳을 보고 있습니다 — 거르개로 ' + (all.length - L.length) +
        '곳이 빠졌습니다.</p>'
      : '') +

    (arN
      ? '<p class="sl-off">보관함에 ' + arN + '곳이 있습니다. ' +
        '<button class="sl-link" type="button" onclick="slOpen(\'arch\',\'\')">' +
        '보관함 보기</button></p>'
      : '') +
  '</section>';
}

window.slFocusAdd = function(){
  var el = $("sl-name");
  if(el){ el.focus(); if(el.scrollIntoView) el.scrollIntoView({ block:"center" }); }
};

/* 업체 한 줄 (§10) — 많이 보여 주지 않습니다. 누르면 펼쳐집니다 (§27). */
function slRowHtml(c){
  var on = SL.open === c.id;
  var tone = amSalesStTone(c.st);
  var ago = c.next ? slDaysAgo(c.next) : null;

  return '<div class="sl-row' + (on ? ' on' : '') + '" id="sl-row-' + c.id + '">' +
    '<div class="sl-row-h">' +
      '<button class="sl-row-b" type="button" onclick="slRow(\'' + c.id + '\')" ' +
        'aria-expanded="' + (on ? 'true' : 'false') + '">' +
        '<span class="sl-row-n">' + esc(c.name) + '</span>' +
        '<span class="sl-row-m">' + esc(slWhere(c) || "분류 없음") + '</span>' +
        '<span class="sl-row-t">' + esc(slTelShow(c.tel)) + '</span>' +
        '<span class="sl-bd sl-bd-' + tone + '">' + esc(amSalesStName(c.st)) + '</span>' +
        (ago !== null && ago > 0
          ? '<span class="sl-late">' + ago + '일 지남</span>'
          : (c.next ? '<span class="sl-nx">' + esc(c.next) + '</span>' : '')) +
        '<span class="sl-row-c">' + icon(on ? "chev" : "chevd", 18) + '</span>' +
      '</button>' +
      '<div class="sl-row-a">' +
        '<button class="btn btn-b" type="button" onclick="slOpen(\'call\',\'' + c.id + '\')">' +
          icon("phone", 16) + '전화</button>' +
        '<button class="btn btn-o" type="button" onclick="slOpen(\'res\',\'' + c.id + '\')">' +
          '결과</button>' +
      '</div>' +
    '</div>' +
    (on ? slRowOpen(c) : '') +
  '</div>';
}

/* 펼친 줄 (§27) — 기본정보 · 상태 · 마지막/다음 연락 · 통화횟수 · 기록 */
function slRowOpen(c){
  var last = slLastCall(c);
  var facts = [
    ["현재 상태",   amSalesStName(c.st)],
    ["등록일",      c.at + (c.by ? " · " + c.by : "")],
    ["마지막 연락", last || "아직 없음"],
    ["다음 연락",   c.next || "약속 없음"],
    ["통화 횟수",   slCalls(c) + "회" + (slMissN(c) ? " (부재중 " + slMissN(c) + "회)" : "")]
  ];
  if(c.why) facts.push(["거절 사유", c.why]);

  return '<div class="sl-open">' +
    '<dl class="sl-facts">' +
      facts.map(function(f){
        return '<dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd>';
      }).join("") +
    '</dl>' +

    /* 고치기 (§28) — 잘못 등록한 것을 그 자리에서 고칩니다 */
    '<div class="sl-ed">' +
      '<label class="sl-f sl-f-w"><span>업체명</span>' +
        '<input type="text" value="' + esc(c.name) + '" ' +
          'onchange="slEdit(\'' + c.id + '\',\'name\',this.value);slDraw()"></label>' +
      '<label class="sl-f"><span>전화번호</span>' +
        '<input type="tel" inputmode="tel" value="' + esc(c.tel) + '" ' +
          'onchange="slEdit(\'' + c.id + '\',\'tel\',this.value);slDraw()"></label>' +
      '<label class="sl-f"><span>카테고리</span>' +
        '<select class="f-sel" onchange="slEdit(\'' + c.id + '\',\'g\',this.value);slDraw()">' +
          slOpt(slGroupOpts(), c.g, "고르지 않음") + '</select></label>' +
      '<label class="sl-f"><span>지역</span>' +
        '<select class="f-sel" onchange="slEdit(\'' + c.id + '\',\'reg\',this.value);slDraw()">' +
          slOpt(slRegionOpts(), c.reg, "고르지 않음") + '</select></label>' +
      '<label class="sl-f"><span>시 · 군 · 구</span>' +
        '<input type="text" value="' + esc(c.gu) + '" ' +
          'onchange="slEdit(\'' + c.id + '\',\'gu\',this.value);slDraw()"></label>' +
      '<label class="sl-f sl-f-w"><span>홈페이지 · 블로그 · SNS</span>' +
        '<input type="url" inputmode="url" value="' + esc(c.url) + '" ' +
          'onchange="slEdit(\'' + c.id + '\',\'url\',this.value);slDraw()"></label>' +
    '</div>' +
    (c.url
      ? '<p class="sl-url"><a href="' + esc(c.url) + '" target="_blank" ' +
        'rel="noopener noreferrer">' + icon("globe", 16) + '업체 홈페이지 열기</a></p>'
      : '') +

    /* 메모 (§22 — 짧게) */
    '<div class="sl-note">' +
      '<label class="sl-f sl-f-w"><span>메모 적기</span>' +
        '<input id="sl-note-' + c.id + '" type="text" autocomplete="off" ' +
          'placeholder="예: 오후에 전화 요청"></label>' +
      '<button class="btn btn-o" type="button" onclick="slNote(\'' + c.id + '\')">' +
        '메모 저장</button>' +
    '</div>' +

    /* 영업기록 (§27) — 전부 저절로 쌓인 것입니다 */
    '<div class="sl-log">' +
      '<b>영업기록</b>' +
      ((c.log || []).length
        ? '<ul>' + (c.log || []).slice().reverse().map(function(x){
            return '<li><span class="sl-log-d">' + esc(x.d) + ' ' + esc(x.t || "") +
              '</span><span class="sl-log-w">' + esc(slLogName(x)) + '</span>' +
              (x.n ? '<span class="sl-log-n">' + esc(x.n) + '</span>' : '') +
              (x.by ? '<span class="sl-log-b">' + esc(x.by) + '</span>' : '') +
            '</li>';
          }).join("") + '</ul>'
        : '<p class="sl-empty">아직 기록이 없습니다.</p>') +
    '</div>' +

    '<div class="sl-acts sl-acts-end">' +
      (c.st === "done"
        ? ''
        : '<button class="btn btn-o" type="button" onclick="slOpen(\'join\',\'' +
          c.id + '\')">입점 진행</button>') +
      '<button class="btn btn-o sl-arch" type="button" ' +
        'onclick="slArchive(\'' + c.id + '\',true)">' +
        icon("box", 16) + '보관</button>' +
    '</div>' +
  '</div>';
}

function slLogName(x){
  if(x.w === "add")  return "업체 등록";
  if(x.w === "call") return "전화 → " + (x.n || "통화");
  if(x.w === "plan") return "재연락 예정";
  if(x.w === "sent") return "입점 안내 발송";
  if(x.w === "edit") return "수정";
  if(x.w === "note") return "메모";
  if(x.w === "ar")   return "보관";
  return amSalesStName(x.w) || x.w;
}

/* ── ⑥ 입점 진행 (§19 · §21) ──────────────────────────────── */
var SL_JOIN_ST = ["sent", "doc", "review", "done"];

function slJoinBox(){
  var L = slDb().co.filter(function(c){
    return !c.ar && SL_JOIN_ST.indexOf(c.st) >= 0;
  });
  if(!L.length) return '';

  return '<section class="sl-s">' +
    '<h2>입점 진행 <em>' + L.length + '</em></h2>' +
    '<p class="sl-lead">안내를 보낸 곳부터 입점이 끝난 곳까지입니다. ' +
      '업체가 <b>' + esc(slJoinLink()) + '</b> 에서 직접 적습니다 — ' +
      '받은 자료를 눌러 두시면 완성도가 저절로 세어집니다.</p>' +
    /* ⚠️⚠️ **"새 입점신청" 알림을 만들지 않았습니다** (절대 규칙 5).
       업체가 /join 에서 보낸 신청은 접수처(슬랙 · 메일)로 바로 가고, 이
       화면은 그걸 받아 볼 서버가 없습니다. 종 모양만 띄워 두면 직원이
       **오지 않을 알림을 기다립니다** — 어디로 오는지를 그대로 적습니다. */
    slIntakeWarn("stage") +
    '<p class="sl-note-s">' + icon("alert", 16) +
      '업체가 보낸 입점신청은 <b>슬랙 · 메일(접수처)로 갑니다.</b> ' +
      '이 화면에 저절로 뜨지 않습니다 — 받아 보시면 여기서 자료를 눌러 ' +
      '두세요. 받아 둘 서버가 없어서, 뜨는 척하면 그게 거짓말입니다.</p>' +
    '<div class="sl-jn-g">' + L.map(slJoinCard).join("") + '</div>' +
  '</section>';
}

function slJoinLink(){ return "storeway.co.kr/join"; }

/* ⚠️⚠️ **이 작업대의 끝은 `/join` 입니다.** 거기가 접수를 못 받는 상태면,
   직원이 전화로 설득해서 링크를 보내 드린 업체가 **다 적고 눌렀다가
   실패**합니다 — 어렵게 만든 첫인상을 그 자리에서 잃습니다.
   접수처(환경변수)가 비면 `WOW_BIZ.sosReady` 를 내리게 되어 있고,
   그러면 여기가 저절로 켜집니다. **손으로 적는 상태가 아닙니다** —
   접수처를 켜시면 이 경고가 저절로 사라집니다. */
function slIntakeOff(){
  return !(window.WOW_BIZ && WOW_BIZ.sosReady);
}

function slIntakeWarn(where){
  if(!slIntakeOff()) return "";
  return '<div class="sl-bad sl-bad-intake">' + icon("alert", 18) +
    '<span><b>지금 입점신청을 받지 못합니다.</b> ' +
    esc(slJoinLink()) + ' 가 <b>접수 잠김</b> 상태라, 링크를 보내 드려도 ' +
    '업체가 다 적고 누르면 실패합니다. ' +
    (where === "send"
      ? '<b>먼저 접수처를 켜신 뒤에 보내세요</b> — 전화로 관심을 받아 두시고 ' +
        '발송은 미루셔도 됩니다 (상태는 그대로 관심으로 남습니다).'
      : '관리자 설정 1번 칸을 보시고, Vercel 환경변수에 ' +
        'INTAKE_WEBHOOK_URL 을 넣고 다시 배포하세요.') +
    '</span></div>';
}

function slJoinCard(c){
  var pct = slDocPct(c);
  var D = window.AM_SALES_DOC || [];

  return '<div class="sl-jn">' +
    '<div class="sl-jn-h">' +
      '<b>' + esc(c.name) + '</b>' +
      '<span class="sl-bd sl-bd-' + amSalesStTone(c.st) + '">' +
        esc(amSalesStName(c.st)) + '</span>' +
    '</div>' +
    '<p class="sl-rc-m">' + esc(slWhere(c)) + ' · ' + esc(slTelShow(c.tel)) + '</p>' +
    '<p class="sl-jn-p">자료 완성도 <b>' + pct + '%</b></p>' +
    '<div class="sl-bar sl-bar-s"><span style="width:' + pct + '%"></span></div>' +
    '<ul class="sl-docs">' +
      D.map(function(d){
        var on = !!(c.doc && c.doc[d.key]);
        return '<li><label class="sl-ck">' +
          '<input type="checkbox"' + (on ? ' checked' : '') +
            ' onchange="slDoc(\'' + c.id + '\',\'' + d.key + '\',this.checked)">' +
          '<span>' + esc(d.name) + '</span></label></li>';
      }).join("") +
    '</ul>' +
    '<div class="sl-acts">' +
      '<button class="btn btn-o" type="button" onclick="slOpen(\'warm\',\'' + c.id + '\')">' +
        icon("doc", 16) + '안내 다시 보내기</button>' +
      (c.st !== "doc"
        ? '<button class="btn btn-o" type="button" onclick="slStage(\'' + c.id +
          '\',\'doc\')">자료대기</button>' : '') +
      (c.st !== "review"
        ? '<button class="btn btn-o" type="button" onclick="slStage(\'' + c.id +
          '\',\'review\')">검토필요</button>' : '') +
      (c.st !== "done"
        ? '<button class="btn btn-b" type="button" onclick="slStage(\'' + c.id +
          '\',\'done\')">' + icon("check", 16) + '입점완료</button>' : '') +
    '</div>' +
  '</div>';
}

/* ── ⑦ 영업 현황 (§23 · §24 · §25 · §31) ──────────────────── */
var SL_PER = [["today", "오늘"], ["week", "이번주"], ["month", "이번달"]];

function slStatBox(){
  var s = slStat(SL.per);
  var any = slDb().co.length;

  /* 퍼널 (§24) — 복잡한 차트 대신 숫자입니다 */
  var steps = [
    ["DB",       s.db],
    ["전화",     s.call],
    ["통화",     s.talk],
    ["관심",     s.warm],
    ["입점제안", s.sent],
    ["입점완료", s.done]
  ];

  return '<section class="sl-s sl-st">' +
    '<h2>영업 현황</h2>' +
    '<div class="sl-chips">' +
      SL_PER.map(function(p){
        return '<button type="button" class="sl-chip' +
          (SL.per === p[0] ? ' on' : '') + '" onclick="slPer(\'' + p[0] + '\')">' +
          esc(p[1]) + '</button>';
      }).join("") +
    '</div>' +

    (!any
      ? '<p class="sl-empty">업체를 등록하시면 여기에 실적이 쌓입니다. ' +
        '숫자를 미리 만들어 두지 않습니다.</p>'
      : '<div class="sl-funnel">' +
          steps.map(function(st, i){
            return (i ? '<span class="sl-fn-a">' + icon("chevd", 16) + '</span>' : '') +
              '<div class="sl-fn"><b>' + st[1] + '</b><i>' + esc(st[0]) + '</i></div>';
          }).join("") +
        '</div>' +

        /* ⚠️ 분모가 0 이면 비율을 **안 냅니다** ("0%" 는 비율이 아닙니다) */
        /* ⚠️⚠️ **비율만 내면 1건이 100% 로 보입니다.** 몇 중 몇인지를 같이
           적습니다 — 손익분기에서 "공헌이익률 0%" 가 85조원을 가린 것과
           같은 까닭입니다. 분모가 0 이면 비율을 아예 안 냅니다. */
        '<p class="sl-rate">' +
          (s.talk ? '통화 → 관심 <b>' + slPct(s.warm, s.talk) + '</b> <i>(' +
            s.talk + ' 중 ' + s.warm + ')</i>' : '') +
          (s.talk && s.warm ? ' · ' : '') +
          (s.warm ? '관심 → 입점 <b>' + slPct(s.done, s.warm) + '</b> <i>(' +
            s.warm + ' 중 ' + s.done + ')</i>' : '') +
          (!s.talk && !s.warm ? '통화가 쌓이면 전환율이 나옵니다.' : '') +
        '</p>' +
        /* ⚠️ **이 기간에 일어난 일**을 셉니다. 어제 등록한 곳에 오늘 전화하면
           전화가 DB 보다 많습니다 — 퍼널 모양만 보고 "숫자가 틀렸다" 고
           읽히지 않게 그대로 적습니다. */
        '<p class="sl-note-s">이 기간에 <b>일어난 일</b>을 셉니다. ' +
          '전에 등록한 업체에 전화하면 전화가 DB 보다 많을 수 있습니다 — ' +
          '틀린 것이 아닙니다.</p>' +

        slCatTable() +
        slReport()) +

    slBackup() +
  '</section>';
}

/* 카테고리별 성과 (§25) — 활동이 있는 묶음만 냅니다 */
function slCatTable(){
  var rows = (window.AM_SALES_GROUPS || []).map(function(g){
    var s = slStat(SL.per, g.key);
    return { name:g.name, s:s };
  }).filter(function(r){ return r.s.call || r.s.warm || r.s.done || r.s.db; });

  if(!rows.length) return '';
  rows.sort(function(a, b){ return b.s.call - a.s.call; });

  return '<div class="sl-tbl-w"><table class="sl-tbl">' +
    '<caption>카테고리별 성과</caption>' +
    '<thead><tr><th scope="col">카테고리</th><th scope="col">DB</th>' +
      '<th scope="col">전화</th><th scope="col">관심</th>' +
      '<th scope="col">입점</th></tr></thead><tbody>' +
    rows.map(function(r){
      return '<tr><th scope="row">' + esc(r.name) + '</th>' +
        '<td>' + r.s.db + '</td><td>' + r.s.call + '</td>' +
        '<td>' + r.s.warm + '</td><td>' + r.s.done + '</td></tr>';
    }).join("") +
    '</tbody></table></div>';
}

/* 업무현황 (§31) — 직원이 따로 일일보고를 쓰지 않게 합니다 */
function slReportText(){
  var d = new Date();
  var s = slStat("today");
  var rc = slRecallList().length;
  var plan = slDb().co.filter(function(c){
    return !c.ar && c.next && c.next > slToday();
  }).length;

  var L = [];
  L.push((d.getMonth() + 1) + "월 " + d.getDate() + "일 업무현황" +
    (slMe() ? " · " + slMe() : ""));
  L.push("");
  L.push("신규 업체: " + s.db);
  L.push("전화: " + s.call);
  L.push("통화: " + s.talk);
  L.push("관심: " + s.warm);
  L.push("입점제안: " + s.sent);
  L.push("입점완료: " + s.done);
  L.push("");
  L.push("오늘 남은 재연락: " + rc);
  L.push("앞으로 재연락 예정: " + plan);
  return L.join("\n");
}

function slReport(){
  return '<div class="sl-rep">' +
    '<div class="sl-rep-h"><b>오늘 업무현황</b>' +
      '<button class="btn btn-o" type="button" onclick="adCopy(\'sl-rep\')">' +
        icon("doc", 16) + '업무현황 복사</button></div>' +
    '<textarea id="ad-t-sl-rep" rows="12" spellcheck="false">' +
      esc(slReportText()) + '</textarea>' +
    '<p class="sl-note-s">그대로 복사해서 카카오톡으로 보내시면 됩니다. ' +
      '숫자는 <b>활동기록에서 세는 값</b>이라 손으로 고칠 자리가 없습니다.</p>' +
  '</div>';
}

/* ── 백업 ──────────────────────────────────────────────────
   ⚠️⚠️ 이 브라우저에만 있는 기록이라 **내려받아 두지 않으면** 컴퓨터를
   바꾸거나 브라우저 데이터를 지울 때 사라집니다. 서버가 없다는 사실을
   숨기지 않고, 대신 옮길 방법을 냅니다. */
function slBackup(){
  var n = slDb().co.length;
  return '<div class="sl-bk">' +
    '<b>' + icon("files", 16) + '기록 백업</b>' +
    '<p>영업 기록은 <b>이 브라우저 안에만</b> 있습니다 (업체 ' + n + '곳). ' +
      '서버에 저장되지 않으니, 하루 일을 마치시면 내려받아 두세요. ' +
      '다른 컴퓨터에서 쓰실 때는 그 파일을 불러오면 그대로 이어집니다.</p>' +
    '<div class="sl-acts">' +
      '<button class="btn btn-o" type="button" onclick="slDown()">' +
        icon("filex", 16) + '내려받기</button>' +
      '<label class="btn btn-o sl-up">' + icon("up", 16) + '불러오기' +
        '<input type="file" accept="application/json,.json" onchange="slUp(this)">' +
      '</label>' +
    '</div>' +
  '</div>';
}

window.slDown = function(){
  try {
    var txt = JSON.stringify(slDb(), null, 2);
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([txt], { type:"application/json" }));
    /* ⚠️⚠️ **파일 이름을 한글로 적으면 크로미움이 통째로 버립니다** —
       blob 주소에서는 `download` 라는 이름에 **확장자도 없이** 떨어져서,
       눌러도 열리지 않고 백업을 여러 번 받으면 `download(1)` 로 쌓입니다.
       재현해서 확인했습니다 (한글 → "download", 영문 → 그대로). 윈도에서
       한글 파일명이 깨지는 것까지 생각하면 영문이 맞습니다. */
    a.download = "storeway-sales-" + slToday() + ".json";
    document.body.appendChild(a);
    a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 0);
    toast("내려받았습니다");
  } catch(e){ toast("내려받지 못했습니다 — " + e.message); }
};

window.slUp = function(input){
  var f = input && input.files && input.files[0];
  if(!f) return;
  var rd = new FileReader();
  rd.onload = function(){
    var d;
    try { d = JSON.parse(String(rd.result)); }
    catch(e){ toast("읽을 수 없는 파일입니다"); return; }
    if(!d || !Array.isArray(d.co)){ toast("영업기록 파일이 아닙니다"); return; }
    /* ⚠️ 되돌릴 수 없으니 한 번 묻습니다 — 지금 쌓인 것이 사라집니다 */
    /* ⚠️ `confirm()` 은 그냥 글자입니다 — 별표를 적으면 그대로 찍힙니다 */
    if(!confirm("지금 이 브라우저의 업체 " + slDb().co.length + "곳을 " +
                "파일의 " + d.co.length + "곳으로 바꿉니다. 계속할까요?")) return;
    SL_DB = d;
    if(!SL_DB.goal) SL_DB.goal = slFresh().goal;
    slSave();
    slDraw();
    toast("불러왔습니다 — 업체 " + d.co.length + "곳");
  };
  rd.readAsText(f);
  input.value = "";
};

/* ════════════════════════════════════════════════════════════════════
   떠 있는 판 — 전화 · 안내 발송 · 재연락 · 사유 (§11 ~ §16)

   ⚠️ 페이지를 떠나지 않습니다. 직원이 돌아올 자리를 잃으면 "어디까지
   했지" 가 생깁니다 (§11 "페이지 이동 없이").
   ⚠️⚠️ 글을 **쓰게 하지 않습니다** (§22). 누르고 · 고르고 · 복사하고 ·
   날짜만 찍습니다.
   ════════════════════════════════════════════════════════════════════ */

/* 복사할 글 한 덩이 — ⚠️ `adCopy()` 를 그대로 씁니다 (id 가 `ad-t-` 로
   시작해야 합니다). 복사 방식이 두 가지가 되면 한쪽만 고치게 됩니다. */
function slCard(title, key, text, rows){
  return '<div class="sl-cp">' +
    '<div class="sl-cp-h"><b>' + esc(title) + '</b>' +
      '<button class="btn btn-b" type="button" onclick="adCopy(\'' + key + '\')">' +
        icon("doc", 16) + '복사</button></div>' +
    '<textarea id="ad-t-' + key + '" rows="' + (rows || 6) + '" spellcheck="false">' +
      esc(text) + '</textarea>' +
  '</div>';
}

/* 그 업체에 맞는 초대 글감 — 영업 카테고리를 **사이트 분류로** 바꿔
   `adInvite()` 에 넘깁니다. 글은 6번 칸과 **같은 함수**에서 나옵니다
   (§30 — 기존 영업자료를 버리지 않고 흐름 안으로 옮깁니다). */
function slInvite(c){
  var g = c.g ? amSalesGroup(c.g) : null;
  return adInvite(g ? amSalesMainCat(g) : "", c.reg || "");
}

/* 첫 멘트 (§11) — ⚠️ 이름 뒤에 조사를 붙이지 않는 꼴로 적었습니다.
   브랜드 이름이 바뀌어도 "인수인계은" 같은 것이 나오지 않습니다. */
function slFirstWords(c){
  var v = slInvite(c);
  var L = [];
  L.push("안녕하세요, 사장님.");
  L.push("창업부터 운영, 인수 · 양도, 폐업까지 사장님께 필요한 업체와 정보를");
  L.push("연결하는 플랫폼 " + v.brand + "입니다.");
  L.push("");
  L.push("지금 초기 파트너 업체를 모으고 있어서 연락드렸습니다.");
  L.push("기본 입점은 무료인데, 잠깐 안내드려도 괜찮을까요?");
  return L.join("\n");
}

function slModalWrap(title, sub, body, id){
  return '<div class="sl-mod-bg" onclick="slShutBg(event)">' +
    '<div class="sl-mod" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"' +
      ' tabindex="-1" id="sl-mod">' +
      '<div class="sl-mod-h">' +
        '<div><b>' + esc(title) + '</b>' +
          (sub ? '<span>' + esc(sub) + '</span>' : '') + '</div>' +
        '<button class="sl-x" type="button" onclick="slShut()" aria-label="닫기">' +
          icon("x", 20) + '</button>' +
      '</div>' +
      '<div class="sl-mod-b">' + body + '</div>' +
    '</div>' +
  '</div>';
}

window.slShutBg = function(ev){
  if(ev.target && ev.target.classList && ev.target.classList.contains("sl-mod-bg"))
    slShut();
};

/* 통화 결과 단추 다섯 (§12) — 전화 판과 결과 판이 같이 씁니다 */
function slResultBtns(c){
  return '<div class="sl-res">' +
    (window.AM_SALES_RESULT || []).map(function(r){
      return '<button class="sl-res-b sl-res-' + r.key + '" type="button" ' +
        'onclick="slResult(\'' + c.id + '\',\'' + r.key + '\')">' +
        icon(r.ic, 22) + '<span>' + esc(r.name) + '</span></button>';
    }).join("") +
  '</div>';
}

function slModal(){
  var m = SL.modal;
  if(!m) return '';
  if(m.k === "arch") return slModalWrap("보관함", "", slArchBody());

  var c = slById(m.id);
  if(!c) return '';

  if(m.k === "call"){
    var v = slInvite(c);
    return slModalWrap(c.name + " 영업전화", slWhere(c),
      '<a class="sl-big-tel" href="tel:' + esc(telNum(c.tel)) + '">' +
        icon("phone", 22) + esc(slTelShow(c.tel)) + '</a>' +
      (slMissN(c)
        ? '<p class="sl-warn">' + icon("alert", 16) + '부재중 ' + slMissN(c) +
          '회입니다. 같은 곳에 계속 걸지 않도록 이번에도 안 받으시면 ' +
          '다음 영업일로 한 번 더 미루고, 그 뒤에는 보관을 생각해 보세요.</p>'
        : '') +
      (c.memo ? '<p class="sl-memo">메모 — ' + esc(c.memo) + '</p>' : '') +
      '<h3 class="sl-h3">전화 멘트</h3>' +
      slCard("이렇게 시작하세요", "sl-first", slFirstWords(c), 7) +
      /* ⚠️ 14줄로 두었더니 **통화 결과 단추가 화면 밖**으로 밀렸습니다 —
         통화가 끝난 직후에 누르는 단추라 손이 닿는 데 있어야 합니다.
         칸 안에서 스크롤되니 글은 그대로입니다 (찍어 보고 알았습니다). */
      slCard("그다음 말할 순서 (읽지 마시고 말로)", "sl-call", adInviteCall(v), 9) +
      '<h3 class="sl-h3">통화 결과를 눌러 주세요</h3>' +
      '<p class="sl-note-s">누르면 전화 한 건이 저절로 기록됩니다 — ' +
        '따로 적으실 것이 없습니다.</p>' +
      slResultBtns(c));
  }

  if(m.k === "res")
    return slModalWrap(c.name + " 통화 결과", slWhere(c), slResultBtns(c));

  if(m.k === "warm"){
    var w = slInvite(c);
    return slModalWrap("입점 안내 보내기", c.name,
      slIntakeWarn("send") +
      '<p class="sl-note-s">' + icon("alert", 16) +
        '<b>문자 · 카톡으로 보내시려면 통화에서 "문자로 주소 보내 드려도 ' +
        '될까요?" 를 먼저 물으셔야 합니다</b> — 정보통신망법 제50조의 ' +
        '수신동의입니다. 21시~08시에는 보내지 마세요.</p>' +
      slCard("카카오톡 · 문자 (짧게)", "sl-sms", adInviteSms(w), 12) +
      slCard("소개 링크", "sl-site", "https://storeway.co.kr", 1) +
      slCard("입점신청 링크", "sl-join", "https://storeway.co.kr/join", 1) +
      slCard("이메일 (길게)", "sl-mail", adInviteMail(w), 14) +
      '<div class="sl-acts sl-acts-end">' +
        '<button class="btn btn-b sl-big" type="button" onclick="slSent(\'' +
          c.id + '\')">' + icon("check", 20) + '발송 완료</button>' +
      '</div>' +
      '<p class="sl-note-s">발송 완료를 누르면 상태가 <b>입점제안</b>으로 ' +
        '바뀌고, 3일 뒤 확인 날짜가 저절로 잡힙니다.</p>');
  }

  if(m.k === "when"){
    return slModalWrap("언제 다시 연락할까요?", c.name,
      '<div class="sl-when">' +
        (window.AM_SALES_WHEN || []).map(function(w){
          return '<button class="sl-when-b" type="button" onclick="slWhen(\'' +
            c.id + '\',' + w.d + ')"><b>' + esc(w.name) + '</b>' +
            '<i>' + esc(slPlus(w.d)) + '</i></button>';
        }).join("") +
      '</div>' +
      '<div class="sl-when-f">' +
        '<label class="sl-f"><span>날짜 직접 선택</span>' +
          '<input id="sl-when-d" type="date" min="' + slToday() + '"></label>' +
        '<label class="sl-f sl-f-w"><span>메모 <em>(없어도 됩니다)</em></span>' +
          '<input id="sl-when-memo" type="text" autocomplete="off" ' +
            'placeholder="예: 오후에 전화 요청"></label>' +
        '<button class="btn btn-b" type="button" onclick="slWhen(\'' + c.id +
          '\',0)">이 날짜로 저장</button>' +
      '</div>');
  }

  if(m.k === "why"){
    return slModalWrap("관심없음으로 적었습니다", c.name,
      '<p class="sl-note-s">사유는 <b>고르지 않아도 됩니다.</b> ' +
        '그냥 닫으셔도 기록은 남습니다.</p>' +
      '<div class="sl-why">' +
        (window.AM_SALES_WHY || []).map(function(w){
          return '<button class="sl-why-b" type="button" onclick="slWhy(\'' +
            c.id + '\',\'' + esc(w) + '\')">' + esc(w) + '</button>';
        }).join("") +
      '</div>' +
      '<div class="sl-acts sl-acts-end">' +
        '<button class="btn btn-o" type="button" onclick="slWhy(\'' + c.id +
          '\',\'\')">사유 없이 닫기</button>' +
      '</div>');
  }

  if(m.k === "join"){
    return slModalWrap("입점 진행", c.name,
      '<p class="sl-note-s">업체가 <b>storeway.co.kr/join</b> 에서 직접 ' +
        '적습니다. 받은 자료를 눌러 두시면 완성도가 세어집니다.</p>' +
      slJoinCard(c));
  }

  return '';
}

/* 보관함 (§28) — 완전 삭제는 여기 **한 곳**에만 있습니다 */
function slArchBody(){
  var L = slDb().co.filter(function(c){ return c.ar; });
  if(!L.length) return '<p class="sl-empty">보관한 업체가 없습니다.</p>';
  return '<p class="sl-note-s">보관한 업체는 목록과 재연락에서 빠지지만 ' +
      '<b>중복 검사에는 그대로 걸립니다</b> — 같은 곳을 또 등록하지 않게 ' +
      '하려는 것입니다.</p>' +
    '<div class="sl-rows">' +
      L.map(function(c){
        return '<div class="sl-row"><div class="sl-row-h">' +
          '<span class="sl-row-b sl-row-s">' +
            '<span class="sl-row-n">' + esc(c.name) + '</span>' +
            '<span class="sl-row-m">' + esc(slWhere(c)) + '</span>' +
            '<span class="sl-row-t">' + esc(slTelShow(c.tel)) + '</span>' +
          '</span>' +
          '<div class="sl-row-a">' +
            '<button class="btn btn-o" type="button" onclick="slArchive(\'' +
              c.id + '\',false)">되돌리기</button>' +
            '<button class="btn btn-o sl-del" type="button" onclick="slDel(\'' +
              c.id + '\')">' + icon("trash", 16) + '완전 삭제</button>' +
          '</div>' +
        '</div></div>';
      }).join("") +
    '</div>';
}

/* ⚠️ 되돌릴 수 없습니다. 보관함 안에서만 누를 수 있고, 두 번 묻습니다. */
window.slDel = function(id){
  var c = slById(id);
  if(!c) return;
  if(!confirm(c.name + " 의 기록을 완전히 지웁니다.\n" +
              "영업기록 " + (c.log || []).length + "건도 같이 사라지고 " +
              "되돌릴 수 없습니다. 계속할까요?")) return;
  if(!confirm("정말 지울까요? 이 창을 닫으면 되돌릴 방법이 없습니다.")) return;
  slDb().co = slDb().co.filter(function(x){ return x.id !== id; });
  slSave();
  slDraw();
  toast("지웠습니다");
};

/* ── 전부 그리기 ──────────────────────────────────────────── */
function slDraw(){
  var root = $("sl");
  if(!root) return;

  root.innerHTML =
    slHead() +
    slTop() +
    slGoalBox() +
    slAddBox() +
    slRecallBox() +
    slListBox() +
    slJoinBox() +
    slStatBox();

  var mod = $("sl-mod-root");
  if(mod){
    mod.innerHTML = slModal();
    var box = $("sl-mod");
    if(box && box.focus) box.focus();
    document.body.classList.toggle("sl-locked", !!SL.modal);
  }

  var bar = $("sl-sticky");
  if(bar) bar.innerHTML = slSticky();
}
window.slDraw = slDraw;

/* 맨 위 줄 — 담당자와 **어디 저장되는지** (절대 규칙 5) */
function slHead(){
  var rc = slRecallList().length;
  return slIntakeWarn("top") +
  (SL_OK ? '' :
    '<div class="sl-bad">' + icon("alert", 18) +
      '<b>이 브라우저에 저장할 수 없습니다.</b> 비공개 모드이거나 브라우저가 ' +
      '저장을 막고 있습니다 — 지금 적으시는 것은 <b>새로고침하면 사라집니다.</b> ' +
      '일반 창에서 다시 열어 주세요.</div>') +
  '<div class="sl-me">' +
    '<label class="sl-f"><span>담당자</span>' +
      '<input type="text" value="' + esc(slMe()) + '" placeholder="이름을 적어 두세요" ' +
        'onchange="slSetMe(this.value);slDraw()"></label>' +
    '<p>적어 두시면 모든 영업기록에 누가 했는지 같이 남습니다. ' +
      '기록은 <b>이 브라우저 안에만</b> 있습니다 — 맨 아래에서 백업을 ' +
      '내려받으실 수 있습니다.</p>' +
    (rc ? '<a class="sl-jump" href="#sl-list">오늘 재연락 ' + rc + '건</a>' : '') +
  '</div>';
}

/* 모바일 아래 고정 단추 (§36) — 둘만 둡니다 */
function slSticky(){
  var rc = slRecallList().length;
  return '<button class="sl-sk-b" type="button" onclick="slFocusAdd()">' +
      icon("plus", 20) + '업체등록</button>' +
    '<button class="sl-sk-b" type="button" onclick="slGoRecall()">' +
      icon("clock", 20) + '재연락' + (rc ? ' ' + rc : '') + '</button>';
}

window.slGoRecall = function(){
  var L = slRecallList();
  if(!L.length){ toast("오늘 다시 연락할 업체가 없습니다"); return; }
  SL.modal = { k:"call", id:L[0].id };
  slDraw();
};

/* Esc 로 닫습니다 — 떠 있는 판에서 나갈 길이 하나뿐이면 갇힙니다 */
document.addEventListener("keydown", function(ev){
  if(ev.key === "Escape" && SL.modal) slShut();
});

document.addEventListener("DOMContentLoaded", function(){ slDraw(); });
