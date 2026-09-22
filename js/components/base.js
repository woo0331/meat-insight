/* ════════════════════════════════════════════════════════════════════
   공통 도우미 + 아이콘

   ⚠️ esc() 를 반드시 통과시킵니다. 상품명·검색어처럼 밖에서 온 글을
   그냥 innerHTML 에 넣으면 <img onerror=...> 가 남의 브라우저에서
   실행됩니다. 렌더러를 새로 쓸 때도 이 esc() 를 쓰세요.
   ════════════════════════════════════════════════════════════════════ */
window.esc = function(s){
  return String(s==null?"":s)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
};
window.$  = function(id){ return document.getElementById(id); };
window.el = function(sel, root){ return (root||document).querySelector(sel); };
window.els= function(sel, root){ return [].slice.call((root||document).querySelectorAll(sel)); };

/* 아이콘 — 선 아이콘 한 벌. 시안처럼 가늘고 차분하게. */
var IC = {
  search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  user:  '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  cart:  '<circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 7H6"/>',
  heart: '<path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1l8.8 8.8 8.8-8.8a5 5 0 0 0 0-7.1z"/>',
  home:  '<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/>',
  grid:  '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  shield:'<path d="M12 3l7.5 3v5.5c0 4.6-3.1 8.4-7.5 9.5-4.4-1.1-7.5-4.9-7.5-9.5V6z"/><path d="M9.2 12.2l1.9 1.9 3.8-3.9"/>',
  drop:  '<path d="M12 3s6 6.4 6 10.3A6 6 0 0 1 6 13.3C6 9.4 12 3 12 3z"/>',
  box:   '<path d="M3 8.2 12 3.5l9 4.7v7.6L12 20.5l-9-4.7z"/><path d="M3 8.2 12 13l9-4.8M12 13v7.5"/>',
  truck: '<path d="M2 6.5h11v9H2z"/><path d="M13 9.5h4.2l2.8 3.2v2.8H13z"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  doc:   '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/>',
  phone: '<path d="M6 3h3l2 5-2.2 1.6a12 12 0 0 0 5.6 5.6L16 13l5 2v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4 5.2 2 2 0 0 1 6 3z"/>',
  tag:   '<path d="M3 12.6V4h8.6l8.6 8.6-8.6 8.6z"/><circle cx="7.6" cy="7.6" r="1.4"/>',
  chat:  '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-5.1A8 8 0 1 1 21 12z"/>',
  chev:  '<path d="M9 5l7 7-7 7"/>',
  arrow: '<path d="M4 12h15"/><path d="M13 6l6 6-6 6"/>',
  star:  '<path d="M12 3.6l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.8l5.9-.9z"/>',
  plus:  '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  check: '<path d="M4.5 12.5l5 5 10-10"/>',
  factory:'<path d="M3 21V10l6 3.5V10l6 3.5V7l6 3.5V21z"/>',
  award: '<circle cx="12" cy="9" r="5.2"/><path d="M8.6 13.4 7 21l5-2.4L17 21l-1.6-7.6"/>',
  x:     '<path d="M6 6l12 12M18 6L6 18"/>'
};
window.icon = function(name, size, fill){
  var d = IC[name]; if(!d) return "";
  var s = size || 22;
  return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" aria-hidden="true" '+
    'fill="'+(fill||"none")+'" stroke="currentColor" stroke-width="1.6" '+
    'stroke-linecap="round" stroke-linejoin="round">'+d+'</svg>';
};

/* 이미지 — 파일이 없으면 **빈 회색 상자 대신** 아이보리 바탕에
   브랜드 마크를 둡니다. 깨진 그림 아이콘이 보이면 미완성으로 읽힙니다. */
/* 컷아웃 일러스트(q- · e-)는 배경을 투명하게 뺀 PNG, 사진은 JPG 입니다.
   확장자를 데이터마다 적지 않고 이름 앞글자로 고릅니다 — 새 그림을
   넣을 때 규칙만 지키면 되고, 잘못 적어 빈 상자가 될 일이 없습니다. */
window.imgExt = function(name){ return /^[qe]-/.test(String(name)) ? ".png" : ".jpg"; };
window.imgTag = function(name, alt, cls){
  return '<img src="img/'+esc(name)+imgExt(name)+'" alt="'+esc(alt||"")+'"'+
    (cls?' class="'+esc(cls)+'"':'')+' loading="lazy" '+
    'onerror="this.onerror=null;this.style.background=\'var(--green-bg)\';this.removeAttribute(\'src\');">';
};
