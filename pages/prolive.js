/* ════════════════════════════════════════════════════════════════════
   업체 하나 — **빌드 뒤에 승인된 업체** (`/pro?id=<id>` · 2026-11-17)

   ⚠️⚠️⚠️ `/pro/<id>` 는 빌드가 파일로 찍습니다 — 빌드 뒤에 승인된 업체는 그
   파일이 없어 카드를 누르면 404 였습니다(운영자가 다시 가져와 배포할 때까지).
   그래서 그런 업체의 카드는 이 자리로 보내고(js/pvlive.js 가 주소를 짓습니다),
   이 화면은 **브라우저가** 그 업체의 지금 값을 읽어 `/pro/<id>` 와 **같은 함수**
   (js/pvpage.js)로 그립니다.
   ⚠️ 색인하지 않습니다 — 같은 업체가 다음 빌드에서 `/pro/<id>` 로 서면 주소가 둘이
   됩니다(한 화면에 주소 하나). 다음 빌드부터는 카드가 `/pro/<id>` 로 갑니다.
   ⚠️ 자바스크립트가 꺼져 있거나 못 읽으면 **업체찾기로 가는 길**을 냅니다.
   ════════════════════════════════════════════════════════════════════ */
var W = global.window, esc = W.esc;

exports.build = function(){
  var body = '<section class="pghd"><div class="wrap">' +
    '<h1>업체 정보</h1>' +
    '<p class="pghd-l">새로 등록된 업체를 바로 보여 드리는 자리입니다. 업체 정보를 불러오는 중입니다…</p>' +
    '</div></section>' +
    '<section class="sec"><div class="wrap"><div class="none">' +
    '<h3>업체가 보이지 않으면 업체찾기에서 찾아보세요.</h3>' +
    '<p>주소가 바뀌었거나 그 업체가 지금 공개되어 있지 않을 수 있습니다.</p>' +
    '<div class="none-b"><a class="btn btn-pt" href="/search">업체찾기</a>' +
    '<a class="btn btn-line" href="/match">견적 · 매칭 요청</a></div>' +
    '</div></div></section>';
  void esc;
  return {
    route: "/pro", title: "업체 정보", noindex: true, unlinked: true,
    desc: "골프올인원 입점업체 정보 — 새로 등록된 업체를 바로 보여 드립니다.",
    body: body,
    js: W.AM_PVLIVE_JS
  };
};
