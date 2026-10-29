

window.$   = function(id){ return document.getElementById(id); };
window.els = function(sel, root){ return [].slice.call((root||document).querySelectorAll(sel)); };

window.esc = function(s){
  return String(s == null ? "" : s)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
};

window.mark = function(s){
  return esc(s).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
};

window.won = function(n){ return Number(n||0).toLocaleString("ko-KR"); };

window.telNum = function(s){ return String(s||"").replace(/[^0-9+]/g,""); };

var IC = {

  roller:  '<rect x="2.5" y="3.5" width="13" height="6" rx="1.6"/><path d="M15.5 6.5h3A1.8 1.8 0 0 1 20.3 8.3v2.4a1.8 1.8 0 0 1-1.8 1.8H12"/><path d="M12 12.5v2.2"/><rect x="9.5" y="14.7" width="5" height="6.3" rx="1.6"/>',
  calc:    '<rect x="4" y="2.5" width="16" height="19" rx="2.2"/><path d="M8 7h8"/><path d="M8.5 11.5h.01"/><path d="M12 11.5h.01"/><path d="M15.5 11.5h.01"/><path d="M8.5 15.5h.01"/><path d="M12 15.5h.01"/><path d="M15.5 15.5v3"/><path d="M8.5 18.5h4"/>',

  handover:'<path d="M3.5 6.5 5 3h11l1.5 3.5"/><path d="M3.5 6.5a2.2 2.2 0 0 0 4.3 0 2.2 2.2 0 0 0 4.3 0 2.2 2.2 0 0 0 4.3 0"/><path d="M5 9.4V20h6.5"/><path d="M14.5 17h6.5"/><path d="M18.3 14.2 21 17l-2.7 2.8"/>',

  rocket:  '<path d="M12 2.8c2.7 2 4.3 5.1 4.3 8.6 0 1.6-.3 3-.9 4.3H8.6a10.2 10.2 0 0 1-.9-4.3c0-3.5 1.6-6.6 4.3-8.6Z"/><circle cx="12" cy="9.8" r="1.9"/><path d="M8.2 13.6 5.4 16a2 2 0 0 0-.7 1.5v2.2l3.4-1.4"/><path d="M15.8 13.6 18.6 16a2 2 0 0 1 .7 1.5v2.2l-3.4-1.4"/><path d="M10.4 19.4c.5.9 1 1.5 1.6 1.8.6-.3 1.1-.9 1.6-1.8"/>',
  boxes:   '<rect x="2.5" y="12.5" width="9" height="8.5" rx="1"/><path d="M5.5 12.5v2"/><path d="M8.5 12.5v2"/><rect x="12.5" y="12.5" width="9" height="8.5" rx="1"/><path d="M15.5 12.5v2"/><path d="M18.5 12.5v2"/><rect x="7.5" y="3" width="9" height="8.5" rx="1"/><path d="M10.5 3v2"/><path d="M13.5 3v2"/>',
  filex:   '<path d="M14.5 2.5H7a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z"/><path d="M14.5 2.5V7H19"/><path d="M9.5 12.5 14 17"/><path d="M14 12.5 9.5 17"/>',

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

  pkgck:   '<path d="M3.5 7.5h17v13h-17Z"/><path d="M8 7.5v3"/><path d="M16 7.5v3"/><path d="M3.5 7.5 6 3.5h12l2.5 4"/><path d="M9.2 15.4 11.1 17.3 14.8 13.6"/>',

  seed:  '<path d="M12 21v-7"/><path d="M12 14c0-4 3-7 7-7 0 4-3 7-7 7Z"/><path d="M12 14c0-3.3-2.7-6-6-6 0 3.3 2.7 6 6 6Z"/>',
  gauge: '<path d="M12 14 16 9"/><path d="M4 19a9 9 0 1 1 16 0"/><circle cx="12" cy="19" r="1.4"/>',
  alert: '<path d="M12 8v5"/><circle cx="12" cy="16.6" r="1.1"/><path d="M10.3 3.9 2.6 17.4A1.9 1.9 0 0 0 4.3 20.3h15.4a1.9 1.9 0 0 0 1.7-2.9L13.7 3.9a1.9 1.9 0 0 0-3.4 0Z"/>',
  up:    '<path d="M3 17 9.5 10.5 13.5 14.5 21 7"/><path d="M15 7h6v6"/>',
  box:   '<path d="M3 8.5 12 4l9 4.5v7L12 20l-9-4.5Z"/><path d="M3 8.5 12 13l9-4.5"/><path d="M12 13v7"/>',

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

  check: '<path d="M4 12.5 9.5 18 20 6.5"/>',
  badge: '<circle cx="12" cy="12" r="9"/><path d="M8.2 12.3 11 15l4.8-5.2"/>',
  info:  '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r="1"/>',
  lock:  '<rect x="4.5" y="10.5" width="15" height="10" rx="2.2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  shield:'<path d="M12 3 5 6v5.5c0 4.3 2.9 8 7 9.5 4.1-1.5 7-5.2 7-9.5V6Z"/><path d="M9.2 12.2 11.3 14.3 15 10.6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.4l3.4 2"/>',
  refresh:'<path d="M20 11a8 8 0 0 0-14-4.5L4 9"/><path d="M4 5v4h4"/><path d="M4 13a8 8 0 0 0 14 4.5L20 15"/><path d="M20 19v-4h-4"/>',

  doc:   '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/>',
  list:  '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.6" cy="6" r="1.2"/><circle cx="4.6" cy="12" r="1.2"/><circle cx="4.6" cy="18" r="1.2"/>',
  edit:  '<path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="M14.5 6.5l3 3"/>',
  phone: '<path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5L16 12l4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4 6.2 2 2 0 0 1 6.5 3Z"/>',

  gavel: '<path d="m13 4 7 7M9.5 7.5 16.5 14.5M5 21h7M8 18 3.5 13.5l9-9L17 9l-9 9Z"/>',
  mobile:'<rect x="6.5" y="2.5" width="11" height="19" rx="2.6"/><path d="M10 5.6h4"/><path d="M10.6 18.6h2.8"/>',
  chat:  '<path d="M20 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2Z"/>',
  mail:  '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6 8.5-6"/>',
  bell:  '<path d="M18 9a6 6 0 0 0-12 0c0 5-2 6-2 6h16s-2-1-2-6Z"/><path d="M13.7 19a2 2 0 0 1-3.4 0"/>',
  calendar:'<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',

  won:   '<path d="M4 7l3.2 10L12 8.5 16.8 17 20 7"/><path d="M3.5 11h17"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  percent:'<circle cx="7.5" cy="7.5" r="2.6"/><circle cx="16.5" cy="16.5" r="2.6"/><path d="M18.5 5.5 5.5 18.5"/>',
  target:'<circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="4.4"/><circle cx="12" cy="12" r="1.1"/>',
  scale: '<path d="M12 4v16M7 20h10"/><path d="M4 9h16"/><path d="M4 9 1.8 14.2a3.4 3.4 0 0 0 4.4 0Z"/><path d="M20 9l2.2 5.2a3.4 3.4 0 0 1-4.4 0Z"/>',

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

  megaphone:'<path d="M3.5 11.2 17 5.5v13L3.5 12.8a1 1 0 0 1 0-1.6Z"/><path d="M17 8.6a3.4 3.4 0 0 1 0 6.8"/><path d="M7 13.4v4.1a2 2 0 0 0 2 2h.6a2 2 0 0 0 2-2v-2.4"/>',
  bulb:  '<path d="M9.2 17h5.6"/><path d="M10 20.5h4"/><path d="M12 3a6 6 0 0 0-3.4 10.9c.5.4.8.9.9 1.6h5c.1-.7.4-1.2.9-1.6A6 6 0 0 0 12 3Z"/>',
  hand:  '<path d="M11 13.5V5.2a1.6 1.6 0 0 1 3.2 0V12"/><path d="M14.2 12V6.6a1.6 1.6 0 0 1 3.2 0V15a6 6 0 0 1-6 6h-.8a5 5 0 0 1-3.8-1.8L4 15.2a1.7 1.7 0 0 1 2.5-2.2L8.8 15"/><path d="M11 13.5a1.6 1.6 0 0 0-3.2 0V15"/>',
  camera:'<path d="M4 8h3l1.6-2.4h6.8L17 8h3a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 20 19H4a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 4 8Z"/><circle cx="12" cy="13" r="3.4"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18A14 14 0 0 1 12 3Z"/>',

  utensils:'<path d="M7 3v8a2.5 2.5 0 0 0 5 0V3"/><path d="M9.5 11v10"/><path d="M17.5 3c-1.6 1.4-2.5 3.4-2.5 5.6V13h4V8.6c0-2.2-.9-4.2-2.5-5.6Z"/><path d="M17.5 13v8"/>',
  cup:    '<path d="M4 7h12v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V7Z"/><path d="M16 9h2.2a2.8 2.8 0 0 1 0 5.6H16"/><path d="M6 3.5v1.6"/><path d="M10 3.5v1.6"/><path d="M14 3.5v1.6"/>',

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
  sliders:'<path d="M4 7h10"/><path d="M18 7h2"/><path d="M4 17h4"/><path d="M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',

  save:   '<path d="M19.5 21H4.5A1.5 1.5 0 0 1 3 19.5v-15A1.5 1.5 0 0 1 4.5 3H16l5 5v11.5A1.5 1.5 0 0 1 19.5 21z"/><path d="M7 21v-7h10v7"/><path d="M7 3v5h7"/>'
};

window.icon = function(name, size){
  var d = IC[name]; if(!d) return "";
  var s = size || 22;
  return '<svg class="ic" width="'+s+'" height="'+s+'" viewBox="0 0 24 24" aria-hidden="true" '+
    'fill="none" stroke="currentColor" stroke-width="1.8" '+
    'stroke-linecap="round" stroke-linejoin="round">'+d+'</svg>';
};

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

window.amDate = function(v){
  var m = String(v || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? (m[1] + ". " + m[2] + ". " + m[3]) : "";
};

window.amDropEmpty = function(o){
  var out = {}, k, v;
  for(k in o) if(Object.prototype.hasOwnProperty.call(o, k)){
    v = o[k];
    if(v === null || v === undefined) continue;
    if(typeof v === "string" && !v.trim()) continue;
    out[k] = v;
  }
  return out;
};

var AM_IDEM = {};
window.amIdem = function(ns){
  ns = ns || "q";
  if(AM_IDEM[ns]) return AM_IDEM[ns];
  var a;
  if(window.crypto && crypto.getRandomValues){
    a = new Uint8Array(16); crypto.getRandomValues(a);
    AM_IDEM[ns] = [].map.call(a, function(b){ return (b+256).toString(16).slice(1); }).join("");
  }else{
    AM_IDEM[ns] = String(Date.now()) + "-" + String(Math.random()).slice(2);
  }
  return AM_IDEM[ns];
};
window.amIdemClear = function(ns){ delete AM_IDEM[ns || "q"]; };

var IA = {

  bulb: '<path class="a2" d="M24 5c8.3 0 15 6.6 15 14.7 0 5.3-2.8 9.4-5.6 12.3-1.4 1.5-2.4 3-2.4 4.6V38H17v-1.4c0-1.6-1-3.1-2.4-4.6C11.8 29.1 9 25 9 19.7 9 11.6 15.7 5 24 5z"/>'+
    '<path class="a1" d="M17 36h14a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H17a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2z"/>'+
    '<path class="a1" d="M19 42h10a2 2 0 0 1-2 3h-6a2 2 0 0 1-2-3z"/>'+
    '<path class="aw" d="M22.5 31V22h3v9z"/>'+
    '<path class="aw" d="M18 17.5l5 5-2.1 2.1-5-5zM30 17.5l-5 5 2.1 2.1 5-5z"/>',

  mappin: '<path class="a2" d="M4 13l12-5v27L4 40zM32 8l12 5v27l-12-5z"/>'+
    '<path class="a2" d="M16 8l16 0v27l-16 5z"/>'+
    '<path class="a1" d="M24 9c5.5 0 10 4.4 10 9.9 0 7-7.6 14.9-9.3 16.5a1 1 0 0 1-1.4 0C21.6 33.8 14 25.9 14 18.9 14 13.4 18.5 9 24 9z"/>'+
    '<circle class="aw" cx="24" cy="19" r="4.2"/>',

  money: '<circle class="a2" cx="38" cy="34" r="8"/><circle class="a2" cx="10" cy="36" r="6"/>'+
    '<path class="a1" d="M19 13h10c6.6 3.3 11 9.4 11 16.4 0 7.5-6.9 12.6-16 12.6S8 36.9 8 29.4C8 22.4 12.4 16.3 19 13z"/>'+
    '<path class="a1" d="M17.5 5h13a1.5 1.5 0 0 1 1.2 2.4L29 12H19l-2.7-4.6A1.5 1.5 0 0 1 17.5 5z"/>'+
    '<path class="aw" d="M19.5 21h3.1l1.4 3.2L25.4 21h3.1l-2.6 5h2v2h-2.6v1.2H28v2h-3.1V34h-1.8v-2.8H20v-2h3.1V28H20v-2h2z"/>',

  permit: '<path class="a2" d="M9 7h30a3 3 0 0 1 3 3v31a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V10a3 3 0 0 1 3-3z"/>'+
    '<path class="a1" d="M17 4h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H17a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>'+
    '<path class="aw" d="M13 20h22v3H13zM13 27h14v3H13z"/>'+
    '<circle class="a1" cx="34" cy="34" r="8"/>'+
    '<path class="aw" d="M30.3 34.1l2-2 2.2 2.2 3.4-3.6 2 1.9-5.3 5.6z"/>',

  staff: '<circle class="a2" cx="35" cy="17" r="6"/>'+
    '<path class="a2" d="M35 25c5.5 0 10 3.6 10 8v7H25v-7c0-4.4 4.5-8 10-8z"/>'+
    '<circle class="a1" cx="18" cy="15" r="7.5"/>'+
    '<path class="a1" d="M18 25c6.6 0 12 4.3 12 9.6V42H6v-7.4C6 29.3 11.4 25 18 25z"/>'+
    '<path class="aw" d="M16.5 30h3v10h-3z"/>',

  calc: '<path class="a2" d="M10 4h28a4 4 0 0 1 4 4v32a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z"/>'+
    '<path class="a1" d="M11 9h26a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H11a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z"/>'+
    '<path class="aw" d="M14 13h12v3H14z"/>'+
    '<path class="a1" d="M12 24h6v5h-6zM21 24h6v5h-6zM30 24h6v5h-6zM12 33h6v5h-6zM21 33h6v5h-6zM30 33h6v5h-6z"/>',

  shield: '<path class="a2" d="M24 4l16 6v14c0 10.4-6.8 17.6-16 20-9.2-2.4-16-9.6-16-20V10z"/>'+
    '<path class="a1" d="M24 4l16 6v6H8v-6z"/>'+
    '<path class="a1" d="M23 24.6l-4.2-4.3-3.3 3.3 7.5 7.7 11-11.4-3.3-3.3z"/>',

  supply: '<path class="a2" d="M5 14.5v20.8a2 2 0 0 0 1.3 1.9L23 43V21z"/>'+
    '<path class="a1" d="M43 14.5v20.8a2 2 0 0 1-1.3 1.9L25 43V21z"/>'+
    '<path class="a1" d="M23.3 5.1a2 2 0 0 1 1.4 0l17.6 6.6a1 1 0 0 1 0 1.9L24 20.5 5.7 13.6a1 1 0 0 1 0-1.9z"/>'+
    '<path class="aw" d="M14 8.6l18.4 6.9-3.3 1.3-18.4-7z"/>',

  tax: '<path class="a2" d="M10 3h18l10 10v31a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z"/>'+
    '<path class="a1" d="M28 3l10 10H30a2 2 0 0 1-2-2z"/>'+
    '<path class="a1" d="M7 18h31v3H7zM7 25h22v3H7z"/>'+
    '<circle class="a1" cx="33" cy="35" r="9"/>'+
    '<path class="aw" d="M28.6 29.5h2.6l1.8 3.6 1.8-3.6h2.6l-2.4 4.5h1.6v1.8h-2.5v1.1h2.5V38h-2.5v2.4h-2.2V38h-2.5v-1.1h2.5V35.8h-2.5V34h1.6z"/>',

  repair: '<path class="a2" d="M13.5 5.2a2 2 0 0 1 2 0l6.6 3.8a2 2 0 0 1 1 1.8v7.6a2 2 0 0 1-1 1.8l-6.6 3.8a2 2 0 0 1-2 0l-6.6-3.8a2 2 0 0 1-1-1.8v-7.6a2 2 0 0 1 1-1.8z"/>'+
    '<path class="a1" d="M41.8 7.2a1.4 1.4 0 0 1 2.3.6 13.5 13.5 0 0 1-16.6 16.4L12.9 39a4.6 4.6 0 0 1-6.5-6.5l14.8-14.8A13.5 13.5 0 0 1 37.6 1.3a1.4 1.4 0 0 1 .5 2.3l-6.6 6.6 1.4 5.3 5.3 1.4z"/>'+
    '<circle class="aw" cx="9.6" cy="35.8" r="2.3"/>',

  chart: '<path class="a2" d="M8 6h32a4 4 0 0 1 4 4v28a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4z"/>'+
    '<path class="a1" d="M12 26h5v11h-5zM21.5 20h5v17h-5zM31 13h5v24h-5z"/>'+
    '<path class="aw" d="M12 18.6l7.5-6.1 5.6 3.4 9.4-7.4 1.9 2.4-10.7 8.4-5.6-3.4-6.2 5z"/>',

  handover: '<path class="a2" d="M8 19h22v21a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3z"/>'+
    '<path class="a1" d="M7 8h24a2 2 0 0 1 1.9 1.4L35 16H3l2.1-6.6A2 2 0 0 1 7 8z"/>'+
    '<path class="a1" d="M14 28h9a2 2 0 0 1 2 2v13H12V30a2 2 0 0 1 2-2z"/>'+
    '<path class="a1" d="M33 23l9 8-9 8v-5h-7v-6h7z"/>',

  contract: '<path class="a2" d="M9 3h18l10 10v31a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z"/>'+
    '<path class="a1" d="M27 3l10 10h-8a2 2 0 0 1-2-2z"/>'+
    '<path class="a1" d="M11 17h18v3H11zM11 24h13v3H11z"/>'+
    '<path class="a1" d="M41.6 22.6l3.8 3.8a1.4 1.4 0 0 1 0 2L30.6 43.2l-6.3 1.7a1 1 0 0 1-1.2-1.2l1.7-6.3 14.8-14.8a1.4 1.4 0 0 1 2 0z"/>'+
    '<path class="aw" d="M38.4 25.8l3.8 3.8-2.1 2.1-3.8-3.8z"/>',

  store: '<path class="a2" d="M8 20h32v20a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3z"/>'+
    '<path class="a1" d="M8 20h32v6H8z"/>'+
    '<path class="a1" d="M7 8h34a2 2 0 0 1 1.9 1.4L45 17H3l2.1-7.6A2 2 0 0 1 7 8z"/>'+
    '<path class="a1" d="M19 30h10a2 2 0 0 1 2 2v11H17V32a2 2 0 0 1 2-2z"/>'+
    '<path class="aw" d="M13 10.5h5.5L17 17h-6zM24.5 10.5H30L31 17h-6.5zM27 34h2v4h-2z"/>',

  interior: '<path class="a2" d="M6 6h22v14H6z"/>'+
    '<path class="a1" d="M6 6h22a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/>'+
    '<path class="a1o" d="M30 13h7a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4H27v4"/>'+
    '<path class="a1" d="M22 27h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H22a2 2 0 0 1-2-2V29a2 2 0 0 1 2-2z"/>'+
    '<path class="aw" d="M9 11h16v4H9z"/>',

  equip: '<path class="a2" d="M5 14h38v26a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z"/>'+
    '<path class="a1" d="M8 10h32a3 3 0 0 1 3 3v9H5v-9a3 3 0 0 1 3-3z"/>'+
    '<circle class="aw" cx="17" cy="16" r="4"/><circle class="aw" cx="31" cy="16" r="4"/>'+
    '<path class="a1" d="M5 28h38v3H5z"/>'+
    '<circle class="a1" cx="15" cy="37" r="3"/><circle class="a1" cx="24" cy="37" r="3"/>'+
    '<circle class="a1" cx="33" cy="37" r="3"/>',

  it: '<path class="a2" d="M4 8h30v22H4z"/>'+
    '<path class="a1" d="M7 6h24a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4z"/>'+
    '<path class="aw" d="M8 11h16v3H8zM8 17h11v3H8z"/>'+
    '<path class="a1o" d="M19 30v6M12 36h14"/>'+
    '<path class="a1" d="M28 25h14a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H28a3 3 0 0 1-3-3V28a3 3 0 0 1 3-3z"/>'+
    '<path class="aw" d="M25 30h20v3H25zM29 36h6v2h-6z"/>',

  admin: '<path class="a2" d="M10 4h20l8 8v24H10z"/>'+
    '<path class="a1" d="M12 3h16l9 9v20a3 3 0 0 1-3 3H12a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z"/>'+
    '<path class="aw" d="M14 13h12v3H14zM14 19h12v3H14zM14 25h7v3h-7z"/>'+
    '<circle class="a1" cx="34" cy="34" r="10"/>'+
    '<path class="awo" d="M29.5 34.3l3.2 3.2 6-6.4"/>',

  marketing: '<path class="a2" d="M4 18h10l16-9v26l-16-9H4z"/>'+
    '<path class="a1" d="M6 17h8l16-9a2 2 0 0 1 3 1.7v28.6A2 2 0 0 1 30 40l-16-9H6a2 2 0 0 1-2-2V19a2 2 0 0 1 2-2z"/>'+
    '<path class="a1" d="M14 31h6l2 11a2 2 0 0 1-2 2.3h-3a2 2 0 0 1-2-1.7z"/>'+
    '<path class="a1o" d="M37 17a10 10 0 0 1 0 14M42 12a17 17 0 0 1 0 24"/>',

  demolish: '<path class="a2" d="M4 31h40v12H4z"/>'+
    '<path class="a1" d="M4 31h40v4H4z"/>'+
    '<path class="a1o" d="M14 35v8M24 35v8M34 35v8M4 39h40"/>'+
    '<path class="a1" d="M26 4l14 8a2 2 0 0 1 .8 2.7l-2.6 4.6a2 2 0 0 1-2.7.8l-14-8z"/>'+
    '<path class="a1" d="M22.8 14.2l3.4 2-11.4 13a2.2 2.2 0 1 1-3.3-2.9z"/>',

  clean: '<path class="a2" d="M12 19h18v24H12z"/>'+
    '<path class="a1" d="M15 17h12a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H15a4 4 0 0 1-4-4V21a4 4 0 0 1 4-4z"/>'+
    '<path class="aw" d="M13 25h16v6H13z"/>'+
    '<path class="a1" d="M17 6h8v9h-8z"/>'+
    '<path class="a1" d="M25 8h8l5-4 2 2-5 6h-10z"/>'+
    '<path class="a1o" d="M38 17l4-1.5M38 23l4 1.5M40 20h4"/>',

  net: '<path class="a2" d="M6 28h36v13H6z"/>'+
    '<path class="a1" d="M9 27h30a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-6a4 4 0 0 1 4-4z"/>'+
    '<circle class="aw" cx="14" cy="34" r="2.2"/><circle class="aw" cx="21" cy="34" r="2.2"/>'+
    '<circle class="aw" cx="28" cy="34" r="2.2"/>'+
    '<path class="a1o" d="M34 27V20"/>'+
    '<path class="a1o" d="M16 15.5a15 15 0 0 1 21 0M22 21a7.5 7.5 0 0 1 9 0"/>',

  pos: '<path class="a2" d="M10 12h28v31H10z"/>'+
    '<path class="a1" d="M14 8h20a5 5 0 0 1 5 5v26a5 5 0 0 1-5 5H14a5 5 0 0 1-5-5V13a5 5 0 0 1 5-5z"/>'+
    '<path class="aw" d="M14 13h20v8H14z"/>'+
    '<circle class="aw" cx="19" cy="29" r="2.4"/><circle class="aw" cx="29" cy="29" r="2.4"/>'+
    '<circle class="aw" cx="19" cy="37" r="2.4"/><circle class="aw" cx="29" cy="37" r="2.4"/>'+
    '<path class="a1o" d="M39 11h5v8"/>',

  cctv: '<path class="a2" d="M8 15l26-7 4 13-26 7z"/>'+
    '<path class="a1" d="M9 13.5l24-6.5a2 2 0 0 1 2.5 1.4l2.6 9.6a2 2 0 0 1-1.4 2.5l-24 6.5a2 2 0 0 1-2.5-1.4L7.6 16a2 2 0 0 1 1.4-2.5z"/>'+
    '<circle class="aw" cx="31" cy="14" r="3.4"/>'+
    '<path class="a1" d="M38 10l7-2 2 7-7 2z"/>'+
    '<path class="a1o" d="M14 28l5 7"/>'+
    '<path class="a1" d="M22 33h7v10h-7z"/><path class="a1" d="M17 41h17v3H17z"/>',

  rental: '<path class="a2" d="M12 5h24v38H12z"/>'+
    '<path class="a1" d="M16 4h16a5 5 0 0 1 5 5v30a5 5 0 0 1-5 5H16a5 5 0 0 1-5-5V9a5 5 0 0 1 5-5z"/>'+
    '<path class="aw" d="M15 9h18v11H15z"/>'+
    '<path class="aw" d="M22 24h4v4h-4z"/>'+
    '<path class="aw" d="M24 30c2.7 3.3 4 5.2 4 6.8a4 4 0 0 1-8 0c0-1.6 1.3-3.5 4-6.8z"/>'+
    '<path class="a1o" d="M19 44h10"/>',

  kiosk: '<path class="a2" d="M8 4h22v38H8z"/>'+
    '<path class="a1" d="M12 3h14a5 5 0 0 1 5 5v30a5 5 0 0 1-5 5H12a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5z"/>'+
    '<path class="aw" d="M11 9h16v12H11zM11 25h16v3H11zM11 31h10v3H11z"/>'+
    '<path class="a1" d="M33 23a3 3 0 0 1 6 0v7l3 2.2c1.6 1.2 2 2.7 1.2 4.5l-2.2 4.8c-.7 1.5-1.8 2.2-3.4 2.2h-5.4c-1.3 0-2.3-.5-3.1-1.6l-4.3-5.8c-1-1.3-.7-2.9.6-3.8 1.3-.9 2.8-.6 3.8.5l1.8 2z"/>',

  sign: '<path class="a1" d="M5 3h4v42H5z"/>'+
    '<path class="a1" d="M9 7h26v4H9z"/>'+
    '<path class="a1o" d="M16 11v5M32 11v5"/>'+
    '<path class="a2" d="M12 16h30v18H12z"/>'+
    '<path class="a1" d="M15 15h22a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H15a4 4 0 0 1-4-4V19a4 4 0 0 1 4-4z"/>'+
    '<path class="aw" d="M15 21h18v4H15zM15 28h11v3H15z"/>',

  kitchen: '<path class="a1o" d="M17 10c0-3.5 2-4.5 2-8M25 10c0-3.5 2-4.5 2-8M33 10c0-3.5 2-4.5 2-8"/>'+
    '<path class="a2" d="M8 20h30v13a9 9 0 0 1-9 9H17a9 9 0 0 1-9-9z"/>'+
    '<path class="a1" d="M8 22h30v11a9 9 0 0 1-9 9H17a9 9 0 0 1-9-9z"/>'+
    '<path class="a1" d="M4 15h38a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2z"/>'+
    '<path class="a1o" d="M38 26h4a3.5 3.5 0 0 1 0 7h-4"/>',

  restore: '<path class="a2" d="M4 12h30v31H4z"/>'+
    '<path class="a1" d="M4 12h30v7H4zM4 23h30v7H4zM4 34h30v7H4z"/>'+
    '<path class="aw" d="M13 12h3v7h-3zM24 23h3v7h-3zM13 34h3v7h-3z"/>'+
    '<path class="a1" d="M30 4l12 7-9 13-8-5z"/>'+
    '<path class="a1o" d="M27 21.5L22 30"/>',

  won: '<path class="a2" d="M4 11h34a3 3 0 0 1 3 3v17a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V14a3 3 0 0 1 3-3z"/>'+
    '<path class="a1" d="M1 17h40v11H1z"/>'+
    '<path class="aw" d="M13 19.5h3l2.2 5 2.2-5h3l-3.4 7.6h2.4v1.9h-3.2l-.5 1.1h3.7v1.9h-8.6v-1.9h3.7l-.5-1.1h-3.2v-1.9h2.4z"/>'+
    '<circle class="a1" cx="36" cy="35" r="10"/>'+
    '<circle class="aw" cx="36" cy="35" r="5.4"/>',

  wallet: '<path class="a2" d="M6 10h31a5 5 0 0 1 5 5v22a5 5 0 0 1-5 5H6a3 3 0 0 1-3-3V13a3 3 0 0 1 3-3z"/>'+
    '<path class="a1" d="M3 13a3 3 0 0 1 3-3h26v8H3z"/>'+
    '<path class="a1" d="M28 21h17v12H28a6 6 0 0 1 0-12z"/>'+
    '<circle class="aw" cx="34" cy="27" r="3.4"/>',

  trash: '<path class="a1" d="M8 14h32l-2.9 28.3A4 4 0 0 1 33.1 46H14.9a4 4 0 0 1-4-3.7z"/>'+
    '<path class="a2" d="M14.4 20h19.2l-1.5 20H15.9z"/>'+
    '<path class="aw" d="M19.4 24h3.2v13h-3.2zM25.4 24h3.2v13h-3.2z"/>'+
    '<path class="a1" d="M4 8h40v6H4z"/>'+
    '<path class="a1" d="M18.5 2h11v6h-11z"/>',

  law: '<path class="a1" d="M21.8 9h4.4v33h-4.4z"/>'+
    '<path class="a1" d="M13 42h22v4.2H13z"/>'+
    '<path class="a1" d="M6.5 13.2h35v3.6h-35z"/>'+
    '<path class="a1o" d="M12 16.8v4.4M36 16.8v4.4"/>'+
    '<path class="a2" d="M3.4 21.2h17.2L12 33.4z"/>'+
    '<path class="a2" d="M27.4 21.2h17.2L36 33.4z"/>'+
    '<path class="aw" d="M8.2 23.8h7.6L12 29.2zM32.2 23.8h7.6L36 29.2z"/>'+
    '<path class="a1" d="M24 3.2a3.4 3.4 0 1 1 0 6.8 3.4 3.4 0 0 1 0-6.8z"/>',

  stock: '<path class="a1" d="M4.5 25h18.2v18H4.5z"/>'+
    '<path class="a1" d="M25.3 25h18.2v18H25.3z"/>'+
    '<path class="a2" d="M14.9 5h18.2v18H14.9z"/>'+
    '<path class="aw" d="M10.3 25h6.6v7.2h-6.6zM31.1 25h6.6v7.2h-6.6z"/>'+
    '<path class="aw" d="M20.7 5h6.6v7.2h-6.6z"/>',

  sofa: '<path class="a1" d="M11 5h26a5 5 0 0 1 5 5v18H6V10a5 5 0 0 1 5-5z"/>'+
    '<path class="a2" d="M14 9h20a2 2 0 0 1 2 2v14H12V11a2 2 0 0 1 2-2z"/>'+
    '<path class="a1" d="M4 20a4 4 0 0 1 8 0v14H4zM36 20a4 4 0 0 1 8 0v14h-8z"/>'+
    '<path class="a1" d="M3 26h42a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3z"/>'+
    '<path class="aw" d="M13 30h22v3.4H13z"/>'+
    '<path class="a1" d="M6 40h5v5H6zM37 40h5v5h-5z"/>'
};

var IA_FIT = {
  bulb:[0.9995,0.012,-0.998],
  mappin:[1,0,0],
  money:[0.9524,0.19,1.619],
  permit:[1,0,0],
  staff:[1.0256,-2.154,-1.385],
  calc:[1,0,0],
  shield:[1,0,0],
  supply:[1.0519,-1.246,-1.232],
  tax:[0.9091,1.727,1.273],
  repair:[1.0167,-1.269,3.105],
  chart:[1,0,0],
  handover:[1.0256,0.923,-2.154],
  contract:[0.9091,0.445,1.273],
  store:[0.9524,1.143,-0.286],
  interior:[1.0811,-0.324,-2.486],
  equip:[1.0526,-1.263,-3.895],
  it:[0.9524,1.143,1.619],
  admin:[0.9756,-1.854,1.073],
  marketing:[0.9311,0.275,-0.224],
  demolish:[1,0,0.5],
  clean:[1.0256,-4.205,-0.103],
  net:[1.0526,-1.263,-3.48],
  pos:[1.1111,-5.444,-4.889],
  cctv:[1.0131,-3.616,-1.793],
  rental:[1,0,0],
  kiosk:[0.9828,-0.865,1.052],
  sign:[0.9524,1.619,1.143],
  kitchen:[0.9195,2.161,3.77],
  restore:[1.0256,0.41,-0.103],
  won:[0.8889,3.111,-0.889],
  wallet:[0.9524,1.143,-0.762],
  trash:[0.9091,2.182,2.182],
  law:[0.9302,1.674,1.023],
  stock:[1.0256,-0.615,-0.615],
  sofa:[0.8333,4,3.167]
};

var IA_ALIAS = {
  item:"bulb", area:"mappin", furniture:"sofa", fund:"wallet",
  transfer:"handover", asset:"sofa", waste:"trash", labor:"staff"
};
window.iconArt = function(name, size, opt){
  name = IA_ALIAS[name] || name;
  var d = IA[name]; if(!d) return "";
  var s = size || 46;
  var f = (opt && opt.raw) ? null : IA_FIT[name];
  if(f) d = '<g transform="translate('+f[1]+' '+f[2]+') scale('+f[0]+')">'+
    d+'</g>';

  return '<svg class="ia" data-ia="'+name+'" width="'+s+'" height="'+s+'" '+
    'viewBox="0 0 48 48" '+
    'aria-hidden="true" fill="none" stroke-linecap="round" stroke-linejoin="round">'+
    d+'</svg>';
};

window.hasIconArt = function(name){ return !!IA[IA_ALIAS[name] || name]; };
