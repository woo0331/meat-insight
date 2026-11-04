/* ════════════════════════════════════════════════════════════════════
   고객센터 — /help

   ⚠️⚠️ **주소가 /notice 가 아니라 /help 입니다.** 공지사항이 아니라
   문의받는 자리라서, 나중에 공지 목록이 생겨도 주소가 안 겹칩니다.

   ⚠️⚠️ **전화 · 이메일은 지어낼 수 없습니다** (전자상거래법 제10조).
   비어 있으면 그 줄이 통째로 빠지고, 대신 지금 실제로 되는 것을
   같이 냅니다 — 막다른 길로 두지 않습니다.
   ════════════════════════════════════════════════════════════════════ */
var W = global.window, esc = W.esc, icon = W.icon;

exports.build = function(){
  var ways = [
    ["phone", "전화", W.bizVal("phone"), W.bizVal("hours")],
    ["mail",  "이메일", W.bizVal("email"), null]
  ].filter(function(r){ return r[2]; });

  var body = '<section class="pghd"><div class="wrap">' +
    '<nav class="crumb" aria-label="현재 위치"><a href="/">홈</a>' + icon("arrow",14) +
    '<span aria-current="page">고객센터</span></nav>' +
    '<h1>고객센터</h1>' +
    '<p class="pghd-l">이용 중 막히시는 곳이나 업체와의 문제를 알려 주세요.</p>' +
  '</div></section>';

  if(ways.length){
    body += '<section class="sec"><div class="wrap"><div class="ways">' +
      ways.map(function(r){
        return '<div class="way">' + icon(r[0], 24) +
          '<div><h3>' + esc(r[1]) + '</h3><p>' + esc(r[2]) + '</p>' +
          (r[3] ? '<p class="way-h">' + esc(r[3]) + '</p>' : '') + '</div></div>';
      }).join("") + '</div></div></section>';
  }else{
    /* 운영자에게만 말합니다 — 손님 화면에는 무엇을 설정하라고 안 적습니다 */
    console.warn("  ⚠️ /help — 전화 · 이메일이 비어 있어 연락처를 못 냈습니다 " +
                 "(js/data/site.js 의 phone · email · hours).");
    body += '<section class="sec"><div class="wrap"><div class="none">' +
      '<h2>지금은 문의를 받지 못합니다.</h2>' +
      '<p>문을 열기 전이라 받을 자리를 준비하고 있습니다. 없는 연락처를 적어 두지 않습니다.</p>' +
      '<a class="btn btn-line" href="/categories">' + icon("arrow",18) + '카테고리 둘러보기</a>' +
    '</div></div></section>';
  }

  /* ⚠️⚠️ **머리말 메뉴에서 이용안내를 뺐습니다** (UX 검수 §3) — 읽는
     글이라 매번 누를 자리가 아닙니다. 대신 **묻는 자리인 여기**와
     푸터 · 메인의 '이용 방법' 끝에 길을 둡니다. 메뉴에서 빼기만 하고
     길을 안 남기면 그건 지운 것과 같습니다. */
  body += '<section class="sec"><div class="wrap"><div class="join">' +
    '<div class="join-t"><h2>처음이신가요?</h2>' +
    '<p>손님이 하시는 일 · 업체가 하시는 일 · 알아 두실 것을 한 장에 적어 두었습니다.</p></div>' +
    '<a class="btn btn-pri" href="/guide">' + icon("info", 20) + '이용안내 보기</a>' +
  '</div></div></section>';

  body += '<section class="sec sec-alt"><div class="wrap">' +
    '<div class="sec-hd"><h2>자주 묻는 것</h2></div>' +
    '<ul class="notes">' +
      '<li><b>업체와 분쟁이 생겼습니다.</b> 거래의 당사자는 업체이지만, 중개한 자리로서 알려 주시면 ' +
      '해당 업체에 확인하고 반복되면 노출을 멈춥니다.</li>' +
      /* ⚠️⚠️ **문장 한가운데에 링크를 박지 않습니다.** 글줄 높이가 19px 라
         손가락으로 못 누릅니다 (전수 점검이 잡았습니다). 문단 끝에
         단추로 뺍니다 — 40px 이상입니다. */
      '<li><b>입점하고 싶습니다.</b> 사업자등록 정보와 하시는 일을 등록하시면 됩니다.' +
      '<a class="btn btn-line btn-sm notes-go" href="/join">업체 입점하기</a></li>' +
      '<li><b>내 정보를 업체에 넘기나요?</b> 어느 업체인지 알려 드리고 그때 따로 동의를 받습니다.' +
      '<a class="btn btn-line btn-sm notes-go" href="/privacy">개인정보처리방침 보기</a></li>' +
    '</ul></div></section>';

  return {
    route: "/help", title: "고객센터", crumbs: [["고객센터", "/help"]],
    desc: "골프올인원 고객센터 — 이용 중 막히는 곳, 업체와의 문제, 입점 문의를 받습니다.",
    body: body
  };
};
