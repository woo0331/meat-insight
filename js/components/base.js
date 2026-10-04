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

/* 본문에서 허용하는 표시는 `**굵게**` **하나뿐**입니다.
   ⚠️ **순서를 바꾸지 마세요.** `esc()` 를 **먼저** 통과시킨 다음 별표만
   되살립니다. 거꾸로 하면 글에 넣은 `<img onerror=…>` 가 남의
   브라우저에서 돕니다 (절대 규칙 4).
   ⚠️ 별표를 안 떼고 `esc()` 만 쓰면 화면에 `**` 가 글자로 찍힙니다 —
   예전 저장소에서 실제로 그렇게 나갔습니다. */
window.mark = function(s){
  return esc(s).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
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

   ⚠️ **업종을 연상시키는 그림을 남발하지 마세요.** 이 사이트는 모든
   업종의 사장님이 손님입니다 — 아이콘은 **분류를 훑을 수 있게** 하는
   표지이지 장식이 아닙니다 (§54). */
var IC = {
  /* ── 2026-09-30 메인 개편 — 지시서가 부르는 Lucide 아이콘을 채웠습니다.
     ⚠️ 규격은 위와 같습니다: 24 viewBox · fill none · currentColor ·
     round cap/join. 다른 데서 복붙해 오면 **선 굵기와 끝 모양이 달라져**
     한 화면 안에서 아이콘이 따로 놉니다 (지시서 §29). */
  /* ⚠️ 드럼이 작고 손잡이가 짧아 27px 에서 **T 자**로 읽혔고, 바로 옆
     `hammer`(철거)와 실루엣이 겹쳤습니다. 드럼을 키우고 손잡이를 아래로
     길게 빼서 "굴리는 것" 이 보이게 했습니다 (인테리어 · 원상복구). */
  roller:  '<rect x="2.5" y="3.5" width="13" height="6" rx="1.6"/><path d="M15.5 6.5h3A1.8 1.8 0 0 1 20.3 8.3v2.4a1.8 1.8 0 0 1-1.8 1.8H12"/><path d="M12 12.5v2.2"/><rect x="9.5" y="14.7" width="5" height="6.3" rx="1.6"/>',
  calc:    '<rect x="4" y="2.5" width="16" height="19" rx="2.2"/><path d="M8 7h8"/><path d="M8.5 11.5h.01"/><path d="M12 11.5h.01"/><path d="M15.5 11.5h.01"/><path d="M8.5 15.5h.01"/><path d="M12 15.5h.01"/><path d="M15.5 15.5v3"/><path d="M8.5 18.5h4"/>',
  /* ⚠️ 마름모 세 개로 그렸더니 27px 에서 **분자나 거품**으로 읽혔습니다.
     정면에서 본 상자 셋 + 뚜껑선이 훨씬 확실합니다 (재고 처분). */
  /* 매장 양도 — ⚠️ `store` 를 그대로 쓰면 같은 화면의 **프랜차이즈**와
     아이콘이 겹쳐 무엇이 무엇인지 흐려집니다. 가게에서 오른쪽으로
     넘어가는 화살표를 얹어 "넘긴다" 를 보이게 했습니다. */
  handover:'<path d="M3.5 6.5 5 3h11l1.5 3.5"/><path d="M3.5 6.5a2.2 2.2 0 0 0 4.3 0 2.2 2.2 0 0 0 4.3 0 2.2 2.2 0 0 0 4.3 0"/><path d="M5 9.4V20h6.5"/><path d="M14.5 17h6.5"/><path d="M18.3 14.2 21 17l-2.7 2.8"/>',
  /* ⚠️ 2026-10-04 — 사업 단계 카드 01 이 쓰는 로켓입니다. 같은 규격
     (24 viewBox · 선 1.8 · round)으로 **여기에 그렸습니다** — 다른
     데서 복붙해 오면 선 굵기와 끝 모양이 달라져 한 화면에서 따로 놉니다.
     ⚠️ 44px 로 찍어서 읽히는 것을 확인했습니다.

     ⚠️⚠️ **악수(handshake)는 그렸다가 뺐습니다.** 지시서 §13 이
     Handshake 를 적었는데, 24px 에서 그려 보니 **우산인지 버섯인지
     모를 덩어리**로 읽혔습니다 (이 저장소에서 같은 까닭으로 아이콘
     여섯을 다시 그린 적이 있습니다 — glass · coins · boxes · roller ·
     megaphone · pkgck). 뜻이 같고 **이미 작은 크기에서 읽히는 것이
     확인된** `handover`(상자 + 나가는 화살표)를 씁니다 — 그 아이콘이
     바로 "매장 양도" 를 위해 만들어진 것입니다. */
  rocket:  '<path d="M12 2.8c2.7 2 4.3 5.1 4.3 8.6 0 1.6-.3 3-.9 4.3H8.6a10.2 10.2 0 0 1-.9-4.3c0-3.5 1.6-6.6 4.3-8.6Z"/><circle cx="12" cy="9.8" r="1.9"/><path d="M8.2 13.6 5.4 16a2 2 0 0 0-.7 1.5v2.2l3.4-1.4"/><path d="M15.8 13.6 18.6 16a2 2 0 0 1 .7 1.5v2.2l-3.4-1.4"/><path d="M10.4 19.4c.5.9 1 1.5 1.6 1.8.6-.3 1.1-.9 1.6-1.8"/>',
  boxes:   '<rect x="2.5" y="12.5" width="9" height="8.5" rx="1"/><path d="M5.5 12.5v2"/><path d="M8.5 12.5v2"/><rect x="12.5" y="12.5" width="9" height="8.5" rx="1"/><path d="M15.5 12.5v2"/><path d="M18.5 12.5v2"/><rect x="7.5" y="3" width="9" height="8.5" rx="1"/><path d="M10.5 3v2"/><path d="M13.5 3v2"/>',
  filex:   '<path d="M14.5 2.5H7a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z"/><path d="M14.5 2.5V7H19"/><path d="M9.5 12.5 14 17"/><path d="M14 12.5 9.5 17"/>',
  /* ⚠️ 손 + 동전으로 그렸더니 27px 에서 **무슨 모양인지 안 읽혔습니다.**
     동전 더미가 작은 크기에서 훨씬 확실합니다. */
  coins:   '<ellipse cx="12" cy="6.5" rx="6.2" ry="2.7"/><path d="M5.8 6.5v4.3c0 1.5 2.8 2.7 6.2 2.7s6.2-1.2 6.2-2.7V6.5"/><path d="M5.8 10.8v4.3c0 1.5 2.8 2.7 6.2 2.7s6.2-1.2 6.2-2.7v-4.3"/>',
  grad:    '<path d="M2.5 8.5 12 4l9.5 4.5L12 13Z"/><path d="M6.5 10.8V16c0 1.4 2.5 2.6 5.5 2.6s5.5-1.2 5.5-2.6v-5.2"/><path d="M21.5 8.5V14"/>',
  bag:     '<path d="M5 7h14l-1 13.5H6Z"/><path d="M8.5 9.5V6a3.5 3.5 0 0 1 7 0v3.5"/>',
  scan:    '<path d="M3 7.5V5.5a2 2 0 0 1 2-2h2"/><path d="M17 3.5h2a2 2 0 0 1 2 2v2"/><path d="M21 16.5v2a2 2 0 0 1-2 2h-2"/><path d="M7 20.5H5a2 2 0 0 1-2-2v-2"/><path d="M3.5 12h17"/>',
  laptop:  '<rect x="4" y="5" width="16" height="10.5" rx="1.8"/><path d="M2 18.5h20"/>',
  grid:    '<rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/>',
  ruler:   '<path d="M14.8 2.6 21.4 9.2a1.4 1.4 0 0 1 0 2L11 21.6a1.4 1.4 0 0 1-2 0L2.4 15a1.4 1.4 0 0 1 0-2L12.8 2.6a1.4 1.4 0 0 1 2 0Z"/><path d="M11 5.5 13.5 8"/><path d="M8 8.5 10.5 11"/><path d="M5 11.5 7.5 14"/>',
  wallet:  '<rect x="2.5" y="6" width="19" height="13" rx="2.2"/><path d="M2.5 10.5h19"/><path d="M6 3.5h10"/><path d="M17 14.8h.01"/>',
  receipt: '<path d="M5 2.5h14v19l-2.3-1.6-2.3 1.6-2.4-1.6L9.6 21.5 7.3 19.9 5 21.5Z"/><path d="M8.5 7.5h7"/><path d="M8.5 11.5h7"/><path d="M8.5 15.5h4"/>',
  compare: '<path d="M4 6.5h9.5"/><path d="M11 4 13.5 6.5 11 9"/><path d="M20 17.5h-9.5"/><path d="M13 15 10.5 17.5 13 20"/><circle cx="19" cy="6.5" r="2.4"/><circle cx="5" cy="17.5" r="2.4"/>',
  listck:  '<path d="M3 6 4.5 7.5 7 5"/><path d="M3 12.5 4.5 14 7 11.5"/><path d="M3 19 4.5 20.5 7 18"/><path d="M10.5 6.5H21"/><path d="M10.5 13H21"/><path d="M10.5 19.5H21"/>',
  files:   '<path d="M8 2.5h6.5L19 7v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4.5a2 2 0 0 1 2-2Z"/><path d="M14.5 2.5V7H19"/><path d="M3.5 7.5v12a2 2 0 0 0 2 2h9"/>',
  /* 운영 공급업체 — ⚠️ 위에서 본 상자로 두었더니 `boxes` 를 정면 상자로
     다시 그린 뒤로 둘의 결이 안 맞았습니다. 같은 결(정면 상자)로 맞춥니다. */
  pkgck:   '<path d="M3.5 7.5h17v13h-17Z"/><path d="M8 7.5v3"/><path d="M16 7.5v3"/><path d="M3.5 7.5 6 3.5h12l2.5 4"/><path d="M9.2 15.4 11.1 17.3 14.8 13.6"/>',
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
  /* ⚠️ 나팔 + 음파 호(弧)로 그렸더니 27px 에서 **스피커(음량 조절)** 로
     읽혔습니다 — 마케팅이 아니라 "소리 끄기" 로 보입니다. 손잡이가 있는
     확성기(bullhorn)로 다시 그렸습니다. */
  megaphone:'<path d="M3.5 11.2 17 5.5v13L3.5 12.8a1 1 0 0 1 0-1.6Z"/><path d="M17 8.6a3.4 3.4 0 0 1 0 6.8"/><path d="M7 13.4v4.1a2 2 0 0 0 2 2h.6a2 2 0 0 0 2-2v-2.4"/>',
  bulb:  '<path d="M9.2 17h5.6"/><path d="M10 20.5h4"/><path d="M12 3a6 6 0 0 0-3.4 10.9c.5.4.8.9.9 1.6h5c.1-.7.4-1.2.9-1.6A6 6 0 0 0 12 3Z"/>',
  hand:  '<path d="M11 13.5V5.2a1.6 1.6 0 0 1 3.2 0V12"/><path d="M14.2 12V6.6a1.6 1.6 0 0 1 3.2 0V15a6 6 0 0 1-6 6h-.8a5 5 0 0 1-3.8-1.8L4 15.2a1.7 1.7 0 0 1 2.5-2.2L8.8 15"/><path d="M11 13.5a1.6 1.6 0 0 0-3.2 0V15"/>',
  camera:'<path d="M4 8h3l1.6-2.4h6.8L17 8h3a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 20 19H4a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 4 8Z"/><circle cx="12" cy="13" r="3.4"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18A14 14 0 0 1 12 3Z"/>',

  /* ── 업종 (js/data/industries.js) — 2026-09-29 리뉴얼 ──────────
     ⚠️ **소·돼지 그림을 넣지 마세요.** 이제 모든 업종의
     사장님이 손님입니다 — 한 업종이 떠오르는 그림은 나머지
     어느 업종에게도 "여긴 내 자리가 아니네" 로 읽힙니다. */
  utensils:'<path d="M7 3v8a2.5 2.5 0 0 0 5 0V3"/><path d="M9.5 11v10"/><path d="M17.5 3c-1.6 1.4-2.5 3.4-2.5 5.6V13h4V8.6c0-2.2-.9-4.2-2.5-5.6Z"/><path d="M17.5 13v8"/>',
  cup:    '<path d="M4 7h12v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V7Z"/><path d="M16 9h2.2a2.8 2.8 0 0 1 0 5.6H16"/><path d="M6 3.5v1.6"/><path d="M10 3.5v1.6"/><path d="M14 3.5v1.6"/>',
  /* ⚠️ 좁은 V 자(칵테일 잔)로 두었더니 27px 에서 **뾰족한 삼각형**으로
     읽혔습니다. 둥근 잔(Lucide wine)이 작은 크기에서 훨씬 잘 읽힙니다. */
  glass:  '<path d="M8 22h8"/><path d="M12 15v7"/><path d="M7 10h10"/><path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z"/>',
  scissors:'<circle cx="6.5" cy="17.5" r="2.5"/><circle cx="6.5" cy="6.5" r="2.5"/><path d="M8.6 8.4 20 19"/><path d="M8.6 15.6 20 5"/>',
  sparkle:'<path d="M12 3l1.9 5.3L19 10l-5.1 1.7L12 17l-1.9-5.3L5 10l5.1-1.7Z"/><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z"/>',
  dumbbell:'<rect x="2.5" y="8.5" width="3.5" height="7" rx="1.2"/><rect x="18" y="8.5" width="3.5" height="7" rx="1.2"/><path d="M6 12h12"/><path d="M8.5 6.5v11"/><path d="M15.5 6.5v11"/>',
  book:   '<path d="M12 7.5C10.4 5.9 8.2 5.2 5 5.4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1c3-.2 5.3.5 7 2"/><path d="M12 7.5c1.6-1.6 3.8-2.3 7-2.1a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1c-3-.2-5.3.5-7 2"/><path d="M12 7.5v13"/>',
  paw:    '<circle cx="7" cy="8" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="17" cy="8" r="2"/><path d="M12 11c-3 0-5.5 2.4-5.5 5A3 3 0 0 0 10 19c.9 0 1.4-.4 2-.4s1.1.4 2 .4a3 3 0 0 0 3.5-3c0-2.6-2.5-5-5.5-5Z"/>',
  cart:   '<circle cx="9.5" cy="19.5" r="1.4"/><circle cx="17.5" cy="19.5" r="1.4"/><path d="M2.5 4h2.4l2.5 12.2h11L21 7.8H6"/>',
  robot:  '<rect x="4" y="8" width="16" height="11" rx="2.5"/><path d="M12 8V4.8"/><circle cx="12" cy="3.6" r="1.2"/><path d="M9 13v1.6"/><path d="M15 13v1.6"/><path d="M4 12H2.5"/><path d="M21.5 12H20"/>',
  bed:    '<path d="M3 19V7"/><path d="M3 12h18v7"/><path d="M21 19v-3"/><circle cx="7.5" cy="9.5" r="1.8"/><path d="M11 12V9.5h6a2.5 2.5 0 0 1 2.5 2.5"/>',
  briefcase:'<rect x="3" y="7.5" width="18" height="12" rx="2"/><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5"/><path d="M3 13h18"/>',
  key:    '<circle cx="8" cy="12" r="4"/><path d="M12 12h9"/><path d="M18 12v3.5"/><path d="M15 12v2.5"/>',
  map:    '<path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20Z"/><path d="M9 4v13.5"/><path d="M15 6.5V20"/>',
  hammer: '<path d="M14.5 5.5 12 8 9 5l2.5-2.5a4 4 0 0 1 5.6 0l2.4 2.4a4 4 0 0 1 0 5.6L17 13l-3-3Z"/><path d="M11 9 4 16a2.1 2.1 0 0 0 3 3l7-7"/>',
  sofa:   '<path d="M4 11V8.5A2.5 2.5 0 0 1 6.5 6h11A2.5 2.5 0 0 1 20 8.5V11"/><path d="M3 11.5a2 2 0 0 1 2 2V17h14v-3.5a2 2 0 1 1 4 0V19H1v-5.5a2 2 0 0 1 2-2Z"/><path d="M7.5 11h9"/>',
  monitor:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M9 20h6"/><path d="M12 16v4"/>',
  trash:  '<path d="M4 7h16"/><path d="M9 7V5.2A1.2 1.2 0 0 1 10.2 4h3.6A1.2 1.2 0 0 1 15 5.2V7"/><path d="M6.5 7l.9 12a2 2 0 0 0 2 1.9h5.2a2 2 0 0 0 2-1.9l.9-12"/><path d="M10 11v6"/><path d="M14 11v6"/>',
  star:   '<path d="M12 3.6l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.8l5.9-.9Z"/>',
  sliders:'<path d="M4 7h10"/><path d="M18 7h2"/><path d="M4 17h4"/><path d="M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>'
};

window.icon = function(name, size){
  var d = IC[name]; if(!d) return "";
  var s = size || 22;
  return '<svg class="ic" width="'+s+'" height="'+s+'" viewBox="0 0 24 24" aria-hidden="true" '+
    'fill="none" stroke="currentColor" stroke-width="1.8" '+
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
