/* ════════════════════════════════════════════════════════════════════
   공통 도우미 — esc · 아이콘 · 짧은 선택자

   ⚠️ **사용자가 쓴 글은 반드시 `esc()` 를 통과시킵니다.** SOS 입력창에
   손님이 적은 문제를 그대로 화면에 찍는 자리가 여럿 있습니다. 안 쓰면
   거기 넣은 `<img onerror=...>` 가 남의 브라우저에서 돕니다.
   ════════════════════════════════════════════════════════════════════ */

window.$   = function(id){ return document.getElementById(id); };
window.els = function(sel, root){ return [].slice.call((root||document).querySelectorAll(sel)); };

window.esc = function(s){
  return String(s == null ? "" : s)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
};

/* 숫자에 쉼표 — 금액은 사장님이 눈으로 읽습니다 */
window.won = function(n){ return Number(n||0).toLocaleString("ko-KR"); };

/* 화면에 적는 모양과 tel: 에 넣는 모양이 다릅니다 */
window.telNum = function(s){ return String(s||"").replace(/[^0-9+]/g,""); };

/* ── 아이콘 ────────────────────────────────────────────────
   ⚠️ 지시서 30번: **지나친 아이콘 사용 금지.** 여기 있는 것이 전부이고,
   늘릴 때는 "이 자리에 아이콘이 없으면 못 알아보는가" 를 먼저 물으세요.
   대부분은 글자가 낫습니다.

   선 굵기는 1.6 으로 통일합니다 — 굵기가 섞이면 조잡해 보입니다. */
var IC = {
  /* 상황 다섯 (js/data/situations.js) */
  seed:  '<path d="M12 21v-7"/><path d="M12 14c0-4 3-7 7-7 0 4-3 7-7 7Z"/><path d="M12 14c0-3.3-2.7-6-6-6 0 3.3 2.7 6 6 6Z"/>',
  gauge: '<path d="M12 14 16 9"/><path d="M4 19a9 9 0 1 1 16 0"/><circle cx="12" cy="19" r="1.4"/>',
  alert: '<path d="M12 8v5"/><circle cx="12" cy="16.6" r="1.1"/><path d="M10.3 3.9 2.6 17.4A1.9 1.9 0 0 0 4.3 20.3h15.4a1.9 1.9 0 0 0 1.7-2.9L13.7 3.9a1.9 1.9 0 0 0-3.4 0Z"/>',
  up:    '<path d="M3 17 9.5 10.5 13.5 14.5 21 7"/><path d="M15 7h6v6"/>',
  box:   '<path d="M3 8.5 12 4l9 4.5v7L12 20l-9-4.5Z"/><path d="M3 8.5 12 13l9-4.5"/><path d="M12 13v7"/>',

  /* 길 안내 */
  search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>',
  user:  '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  home:  '<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/>',
  chev:  '<path d="M9 6l6 6-6 6"/>',
  arrow: '<path d="M4 12h15"/><path d="M13 6l6 6-6 6"/>',
  back:  '<path d="M20 12H5"/><path d="M11 6l-6 6 6 6"/>',
  x:     '<path d="M6 6l12 12M18 6 6 18"/>',
  menu:  '<path d="M4 7h16M4 12h16M4 17h16"/>',

  /* 상태 · 표시 */
  check: '<path d="M4 12.5 9.5 18 20 6.5"/>',
  doc:   '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/>',
  phone: '<path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5L16 12l4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4 6.2 2 2 0 0 1 6.5 3Z"/>',
  chat:  '<path d="M20 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2Z"/>',
  shield:'<path d="M12 3 5 6v5.5c0 4.3 2.9 8 7 9.5 4.1-1.5 7-5.2 7-9.5V6Z"/><path d="M9.2 12.2 11.3 14.3 15 10.6"/>',
  won:   '<path d="M4 7l3.2 10L12 8.5 16.8 17 20 7"/><path d="M3.5 11h17"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.4l3.4 2"/>',

  /* 서비스 묶음 여섯 (js/data/services.js). 여섯 칸을 아이콘 없이 두면
     제목만 여섯 줄이라 훑어지지 않아서 하나씩 답니다 —
     **그 이상 늘리지 마세요** (지시서 30번). */
  truck: '<path d="M3 7h10v9H3Z"/><path d="M13 10h4l3 3v3h-7Z"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
  store: '<path d="M4 10v9h16v-9"/><path d="M3 10 5 4h14l2 6a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0Z"/><path d="M10 19v-5h4v5"/>',
  tool:  '<path d="M15.5 3.5a4.5 4.5 0 0 0-5.6 5.6L3.6 15.4a2 2 0 1 0 2.8 2.8l6.3-6.3a4.5 4.5 0 0 0 5.6-5.6l-2.5 2.5-2.2-2.2Z"/>'
};

window.icon = function(name, size){
  var d = IC[name]; if(!d) return "";
  var s = size || 22;
  return '<svg class="ic" width="'+s+'" height="'+s+'" viewBox="0 0 24 24" aria-hidden="true" '+
    'fill="none" stroke="currentColor" stroke-width="1.6" '+
    'stroke-linecap="round" stroke-linejoin="round">'+d+'</svg>';
};

/* ── 알림 ──────────────────────────────────────────────────
   ⚠️ 읽어 주는 프로그램에도 들리게 합니다. 담기·보냄·동의 누락 안내가
   전부 이걸로 나가므로, role/aria-live 가 없으면 눈이 불편한 손님은
   무슨 일이 일어났는지 알 방법이 없습니다.
   ⚠️ 모바일에서는 **아래 네비 위로** 띄웁니다 (css 에서). */
var TT;
window.toast = function(msg){
  var t = $("toast");
  if(!t){
    t = document.createElement("div");
    t.id = "toast"; t.className = "toast";
    t.setAttribute("role","status");
    t.setAttribute("aria-live","polite");
    document.body.appendChild(t);
  }
  t.textContent = msg; t.classList.add("on");
  clearTimeout(TT); TT = setTimeout(function(){ t.classList.remove("on"); }, 2800);
};
