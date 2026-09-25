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
   선 굵기는 1.6 으로 통일합니다 — 굵기가 섞이면 조잡해 보입니다.
   전부 24×24 격자, 면 없이 선으로만 그립니다.

   ⚠️ **아이콘이 뜻을 더하지 않는 자리에는 넣지 마세요.** "이 자리에
   아이콘이 없으면 못 알아보는가" 를 먼저 물으세요. 목록·표·본문에서는
   대개 글자가 낫습니다. 여기 있는 것들은 **고를 수 있는 칸**(상황·
   서비스·진단 항목·창업 단계)과 **상태 표시**에 씁니다 — 같은 모양의
   칸이 여러 개 나란히 있을 때 눈이 훑을 수 있게 하는 것이 목적입니다.

   ⚠️ 소·돼지 그림을 넣지 마세요 (지시서 30번). 이 사이트는 고기를
   파는 곳이 아니라 **사업자를 위한 서비스**입니다. */
var IC = {
  /* ── 상황 다섯 (js/data/situations.js) ── */
  seed:  '<path d="M12 21v-7"/><path d="M12 14c0-4 3-7 7-7 0 4-3 7-7 7Z"/><path d="M12 14c0-3.3-2.7-6-6-6 0 3.3 2.7 6 6 6Z"/>',
  gauge: '<path d="M12 14 16 9"/><path d="M4 19a9 9 0 1 1 16 0"/><circle cx="12" cy="19" r="1.4"/>',
  alert: '<path d="M12 8v5"/><circle cx="12" cy="16.6" r="1.1"/><path d="M10.3 3.9 2.6 17.4A1.9 1.9 0 0 0 4.3 20.3h15.4a1.9 1.9 0 0 0 1.7-2.9L13.7 3.9a1.9 1.9 0 0 0-3.4 0Z"/>',
  up:    '<path d="M3 17 9.5 10.5 13.5 14.5 21 7"/><path d="M15 7h6v6"/>',
  box:   '<path d="M3 8.5 12 4l9 4.5v7L12 20l-9-4.5Z"/><path d="M3 8.5 12 13l9-4.5"/><path d="M12 13v7"/>',

  /* ── 길 안내 ── */
  search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>',
  user:  '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="3.4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16.5 3.6a4 4 0 0 1 0 7"/>',
  home:  '<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/>',
  chev:  '<path d="M9 6l6 6-6 6"/>',
  chevd: '<path d="M6 9l6 6 6-6"/>',
  arrow: '<path d="M4 12h15"/><path d="M13 6l6 6-6 6"/>',
  back:  '<path d="M20 12H5"/><path d="M11 6l-6 6 6 6"/>',
  x:     '<path d="M6 6l12 12M18 6 6 18"/>',
  menu:  '<path d="M4 7h16M4 12h16M4 17h16"/>',
  plus:  '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  pin:   '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',

  /* ── 상태 · 표시 ── */
  check: '<path d="M4 12.5 9.5 18 20 6.5"/>',
  badge: '<circle cx="12" cy="12" r="9"/><path d="M8.2 12.3 11 15l4.8-5.2"/>',
  info:  '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r="1"/>',
  lock:  '<rect x="4.5" y="10.5" width="15" height="10" rx="2.2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  shield:'<path d="M12 3 5 6v5.5c0 4.3 2.9 8 7 9.5 4.1-1.5 7-5.2 7-9.5V6Z"/><path d="M9.2 12.2 11.3 14.3 15 10.6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.4l3.4 2"/>',
  refresh:'<path d="M20 11a8 8 0 0 0-14-4.5L4 9"/><path d="M4 5v4h4"/><path d="M4 13a8 8 0 0 0 14 4.5L20 15"/><path d="M20 19v-4h-4"/>',

  /* ── 문서 · 연락 ── */
  doc:   '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/>',
  list:  '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.6" cy="6" r="1.2"/><circle cx="4.6" cy="12" r="1.2"/><circle cx="4.6" cy="18" r="1.2"/>',
  edit:  '<path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="M14.5 6.5l3 3"/>',
  phone: '<path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5L16 12l4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4 6.2 2 2 0 0 1 6.5 3Z"/>',
  chat:  '<path d="M20 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2Z"/>',
  mail:  '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6 8.5-6"/>',
  bell:  '<path d="M18 9a6 6 0 0 0-12 0c0 5-2 6-2 6h16s-2-1-2-6Z"/><path d="M13.7 19a2 2 0 0 1-3.4 0"/>',
  calendar:'<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',

  /* ── 돈 · 수치 ── */
  won:   '<path d="M4 7l3.2 10L12 8.5 16.8 17 20 7"/><path d="M3.5 11h17"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  percent:'<circle cx="7.5" cy="7.5" r="2.6"/><circle cx="16.5" cy="16.5" r="2.6"/><path d="M18.5 5.5 5.5 18.5"/>',
  target:'<circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="4.4"/><circle cx="12" cy="12" r="1.1"/>',
  scale: '<path d="M12 4v16M7 20h10"/><path d="M4 9h16"/><path d="M4 9 1.8 14.2a3.4 3.4 0 0 0 4.4 0Z"/><path d="M20 9l2.2 5.2a3.4 3.4 0 0 1-4.4 0Z"/>',

  /* ── 공간 · 시설 · 장비 (서비스 묶음) ── */
  truck: '<path d="M3 7h10v9H3Z"/><path d="M13 10h4l3 3v3h-7Z"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
  store: '<path d="M4 10v9h16v-9"/><path d="M3 10 5 4h14l2 6a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0Z"/><path d="M10 19v-5h4v5"/>',
  tool:  '<path d="M15.5 3.5a4.5 4.5 0 0 0-5.6 5.6L3.6 15.4a2 2 0 1 0 2.8 2.8l6.3-6.3a4.5 4.5 0 0 0 5.6-5.6l-2.5 2.5-2.2-2.2Z"/>',
  fire:  '<path d="M12 21c3.6 0 6-2.4 6-5.6 0-4-3.2-5.6-3.2-9.4-2 1-3 2.8-3 4.6 0 1-.6 1.8-1.4 1.8S9 11.4 9 10c-1.3 1.2-3 3-3 5.4C6 18.6 8.4 21 12 21Z"/>',
  snow:  '<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/><path d="M9.3 4.8 12 6.6l2.7-1.8M9.3 19.2 12 17.4l2.7 1.8"/>',
  knife: '<path d="M4.5 14.5 16 3l2.5 2.5L7 17Z"/><path d="M6.5 16.5 4 19l-1.5-1.5L5 15"/><path d="M14 10.5 19.5 16a2.5 2.5 0 0 1-3.5 3.5L10.5 14"/>',
  plug:  '<path d="M9 3v5M15 3v5"/><path d="M6 8h12v3a6 6 0 0 1-12 0Z"/><path d="M12 17v4"/>',
  broom: '<path d="M15 4 9.5 9.5"/><path d="M13 7.5 16.5 11"/><path d="M12.8 10.2 6 17v4h10l1.6-6.2Z"/>',
  layers:'<path d="m12 3 9 5-9 5-9-5Z"/><path d="m3 13 9 5 9-5"/>',
  building:'<path d="M4 21V5.5a1.5 1.5 0 0 1 1.5-1.5h7A1.5 1.5 0 0 1 14 5.5V21"/><path d="M14 10h4.5A1.5 1.5 0 0 1 20 11.5V21"/><path d="M2.5 21h19"/><path d="M7 8h4M7 12h4M7 16h4M17 14h1M17 17.5h1"/>',

  /* ── 성장 · 사람 ── */
  megaphone:'<path d="M4 10v4a1.5 1.5 0 0 0 1.5 1.5H8l7 4.5V4L8 8.5H5.5A1.5 1.5 0 0 0 4 10Z"/><path d="M18.5 9.2a4 4 0 0 1 0 5.6"/>',
  bulb:  '<path d="M9.2 17h5.6"/><path d="M10 20.5h4"/><path d="M12 3a6 6 0 0 0-3.4 10.9c.5.4.8.9.9 1.6h5c.1-.7.4-1.2.9-1.6A6 6 0 0 0 12 3Z"/>',
  hand:  '<path d="M11 13.5V5.2a1.6 1.6 0 0 1 3.2 0V12"/><path d="M14.2 12V6.6a1.6 1.6 0 0 1 3.2 0V15a6 6 0 0 1-6 6h-.8a5 5 0 0 1-3.8-1.8L4 15.2a1.7 1.7 0 0 1 2.5-2.2L8.8 15"/><path d="M11 13.5a1.6 1.6 0 0 0-3.2 0V15"/>',
  camera:'<path d="M4 8h3l1.6-2.4h6.8L17 8h3a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 20 19H4a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 4 8Z"/><circle cx="12" cy="13" r="3.4"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18A14 14 0 0 1 12 3Z"/>'
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
