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

  /* ⚠️⚠️ **네 묶음으로 나눕니다** (UX 검수 §2 · §6). 메인의 "무엇을
     하시려고 오셨나요?" 카드가 `/categories#<묶음>` 으로 옵니다 —
     묶음을 눌렀는데 분류 하나로 보내면 나머지는 어디 갔는지 알 수
     없습니다. 그래서 **묶음 설명은 여기 한 곳**에 두고, 메인은
     이름과 한 줄까지만 둡니다.
     ⚠️ 묶음에 안 들어간 분류가 생기면 **빠뜨리지 않고** 맨 아래에
     냅니다 (AM_ZONES 에 적는 것을 잊은 날, 그 분류가 조용히 사라지면
     아무도 모릅니다). */
  var seen = {};
  (W.AM_ZONES || []).forEach(function(z){
    W.amZoneCats(z).forEach(function(c){ seen[c.key] = 1; });
  });
  var rest = W.AM_CATS.filter(function(c){ return !seen[c.key]; });

  /* ⚠️⚠️⚠️ **묶음 사진이 2026-11-07 에 여기로 왔습니다.**
     `zone-learn` · `zone-trade` · `zone-play` · `zone-biz` 넷은 원래
     **메인의 네 카드**가 그렸는데, 최종 작업지시서 A 가 메인에서 그
     구간을 서비스 카드로 바꾸라고 해서 그리는 자리가 **0곳**이 됐습니다
     — 사진 파일은 저장소에 그대로 있는데 **아무 데도 안 나오는** 자리가
     될 참이었고, `js/data/photos.js` 의 설명은 여전히 "메인 … 카드" 라고
     적혀 있었습니다(주석이 코드와 다른 자리). `test-photos` 가 잡았습니다.
     ⚠️ 뜻이 정확히 맞는 자리가 여기입니다 — 이 화면이 바로 **그 네
     묶음**입니다(`/categories#<묶음>`).
     ⚠️ 사진이 없으면 **액자를 비워 두지 않고** 줄째 안 그립니다
     (빈 회색 칸이 보이면 그 순간 미완성 사이트로 읽힙니다 · 절대 규칙 2).
     ⚠️ 배경 장식이라 `alt` 를 비우고 `aria-hidden` 을 답니다 — 소리로
     읽을 것이 없습니다(비운 alt 를 안 달면 접근성 검사가 멈춥니다). */
  function block(id, name, lead, list){
    var zp = (id !== "rest" && W.amPhoto) ? W.amPhoto("zone-" + id) : null;
    return '<section class="sec' + (id === "rest" ? " sec-alt" : "") + '" id="' +
      esc(id) + '"><div class="wrap">' +
      (zp ? '<div class="zph">' +
              W.amPhotoImg("zone-" + id, { cls:"zph-i" }) + '</div>' : '') +
      '<div class="sec-hd"><h2>' + esc(name) + '</h2>' +
      (lead ? '<p>' + esc(lead) + '</p>' : '') + '</div>' +
      '<div class="calist">' + list.map(card).join("") + '</div>' +
      '</div></section>';
  }

  function card(c){
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
  }

  body += (W.AM_ZONES || []).map(function(z){
    var cs = W.amZoneCats(z);
    if(!cs.length) return "";          /* ⚠️ 빈 묶음은 안 그립니다 */
    return block(z.key, z.name, z.lead, cs);
  }).join("");
  if(rest.length)
    body += block("rest", "그 밖의 분류", null, rest);

  var subs = W.AM_CATS.reduce(function(n,c){ return n + W.amCatItems(c).length; }, 0);
  return {
    route: "/categories",
    title: "카테고리 전체보기",
    /* ⚠️ 화면의 crumb 과 **같은 길**입니다 — 두 곳에 적으면 검색엔진에
       나가는 길과 손님이 보는 길이 어긋납니다. */
    crumbs: [["카테고리 전체보기", "/categories"]],
    ld: { "@context":"https://schema.org", "@type":"ItemList",
          name:"골프올인원 서비스 분류",
          itemListElement: W.AM_CATS.map(function(c, i){
            return { "@type":"ListItem", position:i+1, name:c.name,
                     url: W.amCatUrl(c) };
          }) },
    desc: "골프올인원의 서비스 분류 " + W.AM_CATS.length + "가지와 항목 " + subs +
          "개를 한 화면에서 봅니다. " +
          W.AM_CATS.map(function(c){ return c.name; }).join(" · ") + ".",
    body: body
  };
};
