/* ════════════════════════════════════════════════════════════════════
   업체찾기 — /search

   ⚠️⚠️ **보내는 열쇠와 받는 열쇠가 같아야 합니다.** 머리말의 검색창은
   name="q" 로 보냅니다. 여기서 읽는 것도 **q** 입니다. 앞 서비스에서
   ?m=apple 을 보내고 mk 를 읽어서 **거르개가 아무것도 안 걸렀는데**
   링크 검사도 흐름 검사도 통과했습니다 — 눌러 봐야 압니다.

   ⚠️ 자바스크립트가 꺼진 봇도 이 화면을 읽습니다. 그래서 분류 목록은
   **HTML 에 미리 찍어** 둡니다. 검색 결과만 자바스크립트가 덧댑니다.
   ════════════════════════════════════════════════════════════════════ */
var W = global.window, esc = W.esc, icon = W.icon;

exports.build = function(){
  var body = '<section class="pghd"><div class="wrap">' +
    '<nav class="crumb" aria-label="현재 위치"><a href="/">홈</a>' + icon("arrow",14) +
    '<span aria-current="page">업체찾기</span></nav>' +
    '<h1>업체찾기</h1>' +
    '<p class="pghd-l">하려는 일을 치시거나 아래 분류에서 고르세요. ' +
    '분류 이름을 모르셔도 됩니다 — "퍼터 팔기" 처럼 하려는 일로 찾아집니다.</p>' +
  '</div></section>';

  /* 결과가 들어갈 자리. ⚠️ 비어 있을 때 아무 말도 없으면 고장으로 보입니다. */
  body += '<section class="sec"><div class="wrap">' +
    '<div id="sres" class="none" hidden></div>' +
  '</div></section>';

  body += '<section class="sec"><div class="wrap">' +
    '<div class="sec-hd"><h2>분류에서 고르기</h2></div>' +
    '<ul class="chips">' + W.AM_CATS.map(function(c){
      return '<li><a class="chip chip-go" href="' + esc(W.amCatUrl(c)) + '">' +
        icon(c.icon, 18) + esc(c.name) + '</a></li>';
    }).join("") + '</ul></div></section>';

  return {
    route: "/search", title: "업체찾기", crumbs: [["업체찾기", "/search"]],
    desc: "골프 업체와 서비스를 찾습니다. " +
          W.AM_CATS.map(function(c){ return c.name; }).join(" · ") + " 분류에서 고르거나 검색하세요.",
    body: body,
    js: ["/js/data/korean.js", "/js/search.js"]
  };
};
