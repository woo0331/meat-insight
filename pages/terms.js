/* ════════════════════════════════════════════════════════════════════
   이용약관 — /terms   (글은 js/data/legal-terms.js 한 곳에 있습니다)

   ⚠️ 시행일 · 상호는 js/data/site.js 에서 옵니다. 비어 있으면 그 줄이
   통째로 빠지고 운영자에게만 경고가 갑니다 — "(미기재)" 를 찍지
   않습니다 (절대 규칙 2 · 3).
   ════════════════════════════════════════════════════════════════════ */
var W = global.window, esc = W.esc;

/* "- " 로 시작하는 줄은 목록으로 냅니다 — 글과 짜임새를 한 곳에서 */
function para(lines){
  var out = "", li = [];
  function flush(){
    if(li.length){ out += '<ul class="doc-ul">' + li.join("") + '</ul>'; li = []; }
  }
  lines.forEach(function(s){
    if(s.indexOf("- ") === 0) li.push('<li>' + esc(s.slice(2)) + '</li>');
    else { flush(); out += '<p>' + esc(s) + '</p>'; }
  });
  flush();
  return out;
}

exports.build = function(){
  var T = W.AM_TERMS, biz = W.bizVal("company"), eff = W.bizVal("effective");

  var body = '<section class="pghd"><div class="wrap">' +
    '<nav class="crumb" aria-label="현재 위치"><a href="/">홈</a>' +
    '<span aria-current="page">' + esc(T.title) + '</span></nav>' +
    '<h1>' + esc(T.title) + '</h1>' +
    '<p class="pghd-l">' + esc(T.lead) + '</p>' +
    (eff ? '<p class="doc-eff">시행일 ' + esc(eff) + '</p>' : '') +
  '</div></section>';

  if(!eff) console.warn("  ⚠️ /terms — 시행일이 비어 있어 그 줄을 뺐습니다 " +
                        "(js/data/site.js 의 effective).");
  if(!biz) console.warn("  ⚠️ /terms — 상호가 비어 있어 본문은 '회사' 로만 적힙니다 " +
                        "(전자상거래법 제10조 · 영업 전 필수).");

  body += '<section class="sec"><div class="wrap"><div class="doc">' +
    T.arts.map(function(a){
      return '<section class="doc-a" id="t' + a.n + '">' +
        '<h2>제' + a.n + '조 (' + esc(a.t) + ')</h2>' + para(a.p) + '</section>';
    }).join("") +
  '</div></div></section>';

  return {
    route: "/terms", title: T.title, crumbs: [[T.title, "/terms"]],
    desc: "골프올인원 이용약관. 골프올인원은 통신판매중개자이며 통신판매의 당사자가 아닙니다. " +
          "거래에 관한 책임은 각 입점업체에 있습니다.",
    body: body
  };
};
