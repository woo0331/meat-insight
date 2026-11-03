/* ════════════════════════════════════════════════════════════════════
   카테고리 전체보기 — /categories  (머리말의 "카테고리 전체보기")

   분류 열과 그 하위를 **한 화면에 전부** 펼칩니다. 손님이 하려는 일의
   이름을 모를 때 여기서 찾습니다. 크롤러에게도 이 화면이 분류 이름을
   한꺼번에 알리는 자리입니다.
   ════════════════════════════════════════════════════════════════════ */
var W = global.window, esc = W.esc, icon = W.icon;

var KIND_TAG = { provider:"업체 중개", trade:"회원 거래", match:"회원 모임", board:"게시" };

exports.build = function(){
  var body = '<section class="pghd"><div class="wrap">' +
    '<nav class="crumb" aria-label="현재 위치"><a href="/">홈</a>' + icon("arrow",14) +
    '<span aria-current="page">카테고리 전체보기</span></nav>' +
    '<h1>카테고리 전체보기</h1>' +
    '<p class="pghd-l">골프올인원이 중개하는 일 열 가지와 그 안의 항목입니다. ' +
    '하려는 일을 고르시면 그 일을 하는 자리로 이어집니다.</p>' +
  '</div></section>';

  body += '<section class="sec"><div class="wrap"><div class="calist">' +
    W.AM_CATS.map(function(c){
      return '<section class="ca">' +
        '<a class="ca-h" href="' + esc(W.amCatUrl(c)) + '">' +
          icon(c.icon, 26) +
          '<span class="ca-n">' + esc(c.name) + '</span>' +
          '<span class="ca-k">' + esc(KIND_TAG[c.kind] || "") + '</span>' +
        '</a>' +
        '<p class="ca-l">' + esc(c.lead) + '</p>' +
        '<ul class="ca-s">' + W.amCatItems(c).map(function(it){
          return '<li>' + esc(it.name) + '</li>';
        }).join("") + '</ul>' +
      '</section>';
    }).join("") + '</div></div></section>';

  var subs = W.AM_CATS.reduce(function(n,c){ return n + W.amCatItems(c).length; }, 0);
  return {
    route: "/categories",
    title: "카테고리 전체보기",
    desc: "골프올인원의 서비스 분류 " + W.AM_CATS.length + "가지와 항목 " + subs +
          "개를 한 화면에서 봅니다. " +
          W.AM_CATS.map(function(c){ return c.name; }).join(" · ") + ".",
    body: body
  };
};
