/* ════════════════════════════════════════════════════════════════════
   관리자 메뉴 — 한 번에 한 칸만 (2026-11-01)

   ⚠️⚠️ **구간을 하나도 지우지 않았습니다.** 스물두 구간이 전부 DOM 에
   그대로 있고, 이 파일은 **무엇을 보이게 할지**만 정합니다. 되돌리시려면
   `admin.html` 에서 이 파일과 nav 한 줄을 빼면 전과 똑같이 스물둘이
   세로로 쌓입니다.

   왜 만들었나 — 재 본 값입니다 (관리자 · DB 가 켜진 상태).
     접힌 상태       문서 4,633px(1440) · 6,261px(390)
     설정을 펼치면    #ad 혼자 10,756px(1440) · 14,072px(390) = 열두 화면
     제일 큰 구간     7.수익상품 4,189 · 8.등록 줄 2,440 · 6.초대 글 2,140px
   직원이 매일 쓰는 칸(영업 작업대)이 그 더미 가운데에 묻혀 있었습니다.

   ⚠️⚠️ **영업 작업대 일곱 구간은 메뉴 한 칸입니다.** 2026-10-07 지시서
   §1 · §2 · §39 가 그 작업대를 "한 화면입니다 — 메뉴도 · 엑셀도 ·
   업무일지도 없습니다" 로 못박았습니다. 일곱으로 쪼개면 직원이 전화
   한 통에 메뉴를 세 번 눌러야 합니다. 여기서 메뉴가 하는 일은 **묶는
   것**이고 그 한 화면을 **쪼개지 않는 것**입니다 — 쪼개지 마세요.

   ⚠️⚠️ **그려진 구간만 메뉴에 냅니다.** `#rq` 는 로그인 · DB 가 설정되기
   전에 **한 픽셀도 안 그립니다**(`/api/session` 이 auth:false). 그때
   그 칸을 메뉴에 내면 **눌러도 아무 일이 안 나는 단추**이고 그게
   §30-7 입니다. `adNavPaint()` 가 그 자리에서 세어서 없으면 빼고,
   고르신 칸이 사라지면 첫 칸으로 떨어집니다.

   ⚠️ **담는 것은 칸 이름 하나**입니다 (`am.admin.tab.v1`). 개인정보는
   한 글자도 안 담습니다. 저장이 막힌 브라우저(비공개 모드)에서는 그냥
   기본 칸으로 엽니다 — 조용히 실패하고 화면은 멀쩡합니다.

   ⚠️⚠️ **검사 쪽에서는 `adNavFor(선택자)` 를 쓰세요.** 칸 이름이 아니라
   **건드릴 구간의 선택자**를 주면 그 구간이 든 칸을 스스로 켭니다 —
   아래 `AD_NAV` 묶음을 다시 짜도 검사를 안 고칩니다. 안 켜고 누르면
   `display:none` 이라 click 이 **30초 타임아웃으로 터지고 뒤 블록이
   통째로 안 돕니다** (어느 검사가 틀렸는지도 안 나옵니다).
   ════════════════════════════════════════════════════════════════════ */

/* ⚠️⚠️ 묶음은 **여기 한 곳**입니다. 구간을 늘리면 이 배열에 한 줄
   넣으세요 — 안 넣으면 그 구간은 **어느 칸에도 없어서 영영 안
   보입니다** (지운 것과 같아집니다). `adNavCheck()` 가 그것을 셉니다. */
var AD_NAV = [
  /* ── 직원이 매일 쓰는 것 ───────────────────────────────── */
  { k:"sales",  name:"영업 작업대", of:["#sl"], grp:"day" },
  { k:"intake", name:"접수 · 배정", of:[".rq-s-rq"], grp:"day" },
  { k:"deal",   name:"계약 · 정산",
    of:[".rq-s-mn", ".rq-s-fee", ".rq-s-set"], grp:"day" },
  { k:"pv",     name:"업체",
    of:[".rq-s-ap", ".rq-s-pv"], grp:"day" },
  { k:"stock",  name:"직접 매입 재고", of:[".rq-s-dv"], grp:"day" },

  /* ── 대표가 보는 것 — 전에 `<details>` 안에 접혀 있던 여덟 (§29) ──
     ⚠️ 접힘을 메뉴로 바꾼 것이지 **없앤 것이 아닙니다.** 직원 화면에서
     안 보이게 한다는 뜻은 그대로입니다 — 앞 다섯이 직원 칸이고 뒤
     다섯이 대표 칸입니다. */
  { k:"health", name:"접수 상태",
    of:[".ad-s-1", ".ad-s-2"], grp:"boss" },
  { k:"sort",   name:"접수 정리",
    of:[".ad-sub", ".ad-s-3", ".ad-s-4", ".ad-s-5", ".ad-no"], grp:"boss" },
  { k:"invite", name:"업체 초대 글", of:[".ad-s-6"], grp:"boss" },
  { k:"offer",  name:"수익상품", of:[".ad-s-7"], grp:"boss" },
  /* ⚠️⚠️ **메뉴 이름이 다른 단추의 글자를 품으면 안 됩니다.**
     처음에 `제휴업체 등록 줄` 이라고 적었는데, 그 안에 **`업체 등록`**
     이 들어 있어서 `tools/test-admin.js` 의
     `button:has-text('업체 등록')` 이 **영업 작업대의 등록 단추 대신
     이 메뉴를 눌렀습니다** — 칸이 바뀌어 `#sl` 이 숨고 "목록에 등장"
     이 영영 실패했습니다 (에러도 안 나고 "등록이 안 된다" 로만
     보입니다). 이름을 바꾸실 때는 두 도구의 `has-text` 글자와
     **포함 관계**를 보세요. */
  { k:"pvnew",  name:"제휴업체 줄 만들기", of:[".ad-s-8"], grp:"boss" }
];

var AD_NAV_KEY = "am.admin.tab.v1";
/* ⚠️ 위 주석을 보세요 — 업무 시나리오 검사 전용입니다 */
var AD_NAV_OFF = false;
/* 지금 고른 칸. ⚠️ 첫 칸은 **영업 작업대**입니다 — 로그인 없이도 늘
   그려지고(localStorage), 직원이 매일 여는 자리입니다. */
var AD_NAV_AT = AD_NAV[0].k;

/* ── 이 브라우저에 담기 (칸 이름 하나) ────────────────────────── */
function adNavLoad(){
  try{
    var v = localStorage.getItem(AD_NAV_KEY);
    for(var i = 0; i < AD_NAV.length; i++) if(AD_NAV[i].k === v) return v;
  }catch(e){}
  return AD_NAV[0].k;
}
function adNavSave(k){ try{ localStorage.setItem(AD_NAV_KEY, k); }catch(e){} }

/* ── 그 칸의 구간이 화면에 실제로 있는가 ───────────────────────
   ⚠️ 하나라도 있으면 냅니다. 묶음 안에서 일부만 그려지는 경우가
   있습니다 (업체 칸의 입점 신청은 직원 역할에서 빠집니다). */
function adNavHas(it){
  for(var i = 0; i < it.of.length; i++)
    if(document.querySelector(".ad-main " + it.of[i])) return true;
  return false;
}
function adNavLive(){
  var out = [];
  for(var i = 0; i < AD_NAV.length; i++)
    if(adNavHas(AD_NAV[i])) out.push(AD_NAV[i]);
  return out;
}

/* ── 메뉴를 그리고 구간을 가립니다 ─────────────────────────────
   ⚠️⚠️ `#rq` · `#sl` 은 다시 그려집니다 (`rqDraw` · `slDraw`). 그래서
   이 함수가 **그 뒤마다** 다시 돕니다 — 맨 아래 감싸개를 보세요. */
function adNavPaint(){
  var main = document.querySelector(".ad-main");
  var nav  = document.getElementById("ad-nav");
  if(!main || !nav) return;

  /* ⚠️⚠️ **업무 시나리오 검사 전용 — 화면에서 켜는 길이 없습니다.**
     `tools/test-admin.js` 는 **기능**을 봅니다 (190군데를 누르고 적고
     고릅니다). 그 도구에게까지 칸을 고르게 하면 구간을 옮길 때마다
     190자리를 같이 고쳐야 하고, 그러다 한 자리를 놓치면 click 이
     **30초 타임아웃으로 터지고 뒤 블록이 통째로 안 돕니다**.
     그래서 거기서는 전부 펼쳐 놓고 보고, **생김새는
     `tools/audit-admin.js` 가 칸마다 · 일곱 폭에서** 봅니다.
     ⚠️ `audit-admin.js` 는 이 길을 **쓰지 않습니다** — 쓰면 메뉴가
     켜진 모습을 아무도 안 보게 됩니다. */
  if(AD_NAV_OFF){
    nav.innerHTML = ""; main.removeAttribute("data-tab");
    var off = main.querySelectorAll(".ad-off");
    for(var z = 0; z < off.length; z++) off[z].classList.remove("ad-off");
    return;
  }

  var live = adNavLive();
  /* ⚠️ 그릴 칸이 하나도 없으면 **메뉴를 안 냅니다** — 빈 알약 줄만
     남으면 그게 자리표시자입니다 (절대 규칙 2). */
  if(!live.length){ nav.innerHTML = ""; main.removeAttribute("data-tab"); return; }

  /* 고르신 칸이 사라졌으면 첫 칸으로 */
  var ok = false;
  for(var i = 0; i < live.length; i++) if(live[i].k === AD_NAV_AT) ok = true;
  if(!ok) AD_NAV_AT = live[0].k;

  /* 메뉴 — 직원 칸과 대표 칸 사이에 구분 */
  var h = "", lastGrp = "";
  for(var j = 0; j < live.length; j++){
    var it = live[j];
    if(lastGrp && it.grp !== lastGrp)
      h += '<span class="ad-nav-sep" aria-hidden="true"></span>';
    lastGrp = it.grp;
    h += '<button type="button" class="ad-nav-b' +
      (it.k === AD_NAV_AT ? " is-on" : "") + '"' +
      ' aria-pressed="' + (it.k === AD_NAV_AT ? "true" : "false") + '"' +
      ' onclick="adNavGo(\'' + it.k + '\')">' + esc(it.name) + '</button>';
  }
  nav.innerHTML = h;
  main.setAttribute("data-tab", AD_NAV_AT);

  /* 구간 가리기 — ⚠️⚠️ 고른 칸에 **없는 구간 전부**를 가립니다.
     "고른 것만 보이게" 로 적으면 `AD_NAV` 에 안 적힌 구간이 늘
     보여서, 메뉴를 어느 칸에 두어도 그 구간이 따라옵니다. */
  var on = {};
  for(var m = 0; m < live.length; m++) if(live[m].k === AD_NAV_AT)
    for(var n = 0; n < live[m].of.length; n++) on[live[m].of[n]] = 1;

  var all = {};
  for(var p = 0; p < AD_NAV.length; p++)
    for(var q = 0; q < AD_NAV[p].of.length; q++) all[AD_NAV[p].of[q]] = 1;

  for(var sel in all){
    var es = main.querySelectorAll(sel);
    for(var r = 0; r < es.length; r++)
      es[r].classList.toggle("ad-off", !on[sel]);
  }
}
window.adNavPaint = adNavPaint;

/* ── 칸 고르기 ─────────────────────────────────────────────────
   ⚠️ 맨 위로 올립니다 — 긴 칸(수익상품 4,189px)에서 짧은 칸으로
   옮기면 스크롤이 문서 끝에 남아 **빈 화면이 보입니다.** */
function adNavGo(k){
  for(var i = 0; i < AD_NAV.length; i++) if(AD_NAV[i].k === k){
    AD_NAV_AT = k; adNavSave(k); adNavPaint();
    try{ window.scrollTo(0, 0); }catch(e){}
    return true;
  }
  return false;
}
window.adNavGo = adNavGo;

/* ── 선택자가 든 칸을 켭니다 (검사 · 바로가기용) ─────────────────
   ⚠️⚠️ 검사 쪽에서는 **이쪽**을 쓰세요. 칸 이름을 박아 두면 묶음을
   다시 짤 때마다 검사를 같이 고쳐야 합니다. */
function adNavFor(sel){
  if(!sel) return false;
  for(var i = 0; i < AD_NAV.length; i++)
    for(var j = 0; j < AD_NAV[i].of.length; j++){
      var o = AD_NAV[i].of[j];
      /* 선택자가 그 구간 이름으로 시작하거나(`.rq-s-mn .rq-hd`),
         그 구간 이름이 선택자 안에 있으면(`#rq .rq-s-mn`) 그 칸입니다 */
      if(sel === o || sel.indexOf(o) === 0 || sel.indexOf(o + " ") >= 0 ||
         sel.indexOf(" " + o) >= 0)
        return adNavGo(AD_NAV[i].k);
    }
  /* `#rq` 처럼 묶음 이름이 아닌 것 — 그 안에 있는 구간의 칸으로 */
  if(sel.indexOf("#rq") === 0) return adNavGo("intake");
  if(sel.indexOf("#ad") === 0) return adNavGo("sort");
  if(sel.indexOf("#sl") === 0) return adNavGo("sales");
  return false;
}
window.adNavFor = adNavFor;

/* ── 어느 칸에도 없는 구간이 있는가 ────────────────────────────
   ⚠️⚠️ 있으면 그 구간은 **영영 안 보입니다** — 지운 것과 같아집니다.
   `tools/test-admin.js` 가 이 값을 봅니다. */
function adNavCheck(){
  var main = document.querySelector(".ad-main");
  if(!main) return [];
  var known = {};
  for(var i = 0; i < AD_NAV.length; i++)
    for(var j = 0; j < AD_NAV[i].of.length; j++){
      var es = main.querySelectorAll(AD_NAV[i].of[j]);
      for(var k = 0; k < es.length; k++) known[es[k].className] = 1;
    }
  var lost = [];
  var secs = main.querySelectorAll("#rq > section, #sl > section, #ad > section");
  for(var m = 0; m < secs.length; m++){
    var hit = false;
    for(var n = 0; n < AD_NAV.length; n++)
      for(var p = 0; p < AD_NAV[n].of.length; p++)
        if(secs[m].matches(AD_NAV[n].of[p]) ||
           (AD_NAV[n].of[p].charAt(0) === "#" &&
            secs[m].parentNode === document.querySelector(AD_NAV[n].of[p]))) hit = true;
    if(!hit) lost.push((secs[m].className || secs[m].id || "?") + " — " +
      ((secs[m].querySelector("h2") || {}).textContent || "").trim().slice(0, 20));
  }
  return lost;
}
window.adNavCheck = adNavCheck;

/* ── 메뉴를 끄고 전부 펼칩니다 (업무 시나리오 검사 전용) ───────── */
function adNavOff(){ AD_NAV_OFF = true; adNavPaint(); }
window.adNavOff = adNavOff;

/* ── 다시 그린 뒤에도 가려 둡니다 ──────────────────────────────
   ⚠️⚠️ `rqDraw` · `slDraw` 는 **맨 위 함수 선언**이라 전역 객체의
   칸입니다 — 그래서 `window.xxx` 를 바꿔치기하면 **그 파일 안에서
   부르는 자리까지 전부** 이 감싸개를 지납니다 (CLAUDE.md 의 `tlRes`
   와 같은 자리). ⚠️ `tlWire()` 처럼 **값으로 잡아 두면** 아무 일도
   안 납니다 — 반드시 `window` 쪽을 감싸세요.
   ⚠️ `adInit()` 은 한 번만 돌아서 감쌀 것이 없습니다. */
(function(){
  ["rqDraw", "slDraw"].forEach(function(n){
    var f = window[n];
    if(typeof f !== "function") return;
    window[n] = function(){
      var out = f.apply(this, arguments);
      try{ adNavPaint(); }catch(e){ console.warn("[adnav]", e); }
      return out;
    };
  });
})();

/* 처음 그리기 — ⚠️ 세 renderer 가 다 돈 뒤라야 구간을 셀 수 있습니다 */
(function(){
  function go(){
    AD_NAV_AT = adNavLoad();
    adNavPaint();
    /* ⚠️⚠️ `#rq` 는 `/api/session` 을 기다립니다 — 처음 그릴 때는
       없다가 **나중에 생깁니다.** 그때 메뉴에 그 칸이 안 생기면
       로그인해도 접수 목록으로 갈 길이 없습니다. rqDraw 감싸개가
       받지만, 안 불리는 경우까지 한 번 더 봅니다. */
    var n = 0;
    var t = setInterval(function(){
      adNavPaint();
      if(++n > 20) clearInterval(t);
    }, 300);
  }
  if(document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", go);
  else go();
})();
