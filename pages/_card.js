/* ════════════════════════════════════════════════════════════════════
   업체 카드 — ⚠️⚠️ **그리는 곳이 둘 이상이라 여기 한 곳에 둡니다**
   (분류 화면 · 메인의 신규 입점업체 · 업체찾기). 화면마다 따로 그리면
   한쪽만 고쳐서 조용히 달라집니다.

   ⚠️ 업체가 적은 글은 전부 esc() 를 거칩니다 (절대 규칙 4).
   ⚠️ 값이 없는 줄은 줄째 뺍니다 — "(미기재)" 를 안 찍습니다.
   ════════════════════════════════════════════════════════════════════ */
var W = global.window, esc = W.esc, icon = W.icon;

exports.card = function(p){
  var regs  = W.amProviderRegions(p);
  var cats  = W.amProviderCats(p);
  var scale = W.amProviderScale(p);
  var ok    = W.amProviderVerified(p);
  var meta  = [];
  if(regs.length)  meta.push(regs.join(" · "));
  if(scale)        meta.push(scale);

  return '<a class="pv" href="' + esc(W.amProviderUrl(p)) + '">' +
    '<div class="pv-h"><h3>' + esc(p.name) + '</h3>' +
      (ok.length ? '<span class="pv-ok">' + icon("check", 15) + '확인됨</span>' : '') +
    '</div>' +
    (meta.length ? '<p class="pv-m">' + esc(meta.join(" · ")) + '</p>' : '') +
    (p.intro ? '<p class="pv-i">' + esc(String(p.intro).slice(0, 90)) + '</p>' : '') +
    (cats.length
      ? '<ul class="pv-c">' + cats.slice(0, 3).map(function(c){
          return '<li>' + esc(c.name) + '</li>';
        }).join("") + '</ul>'
      : '') +
  '</a>';
};

exports.grid = function(list){
  return '<div class="pvs">' + list.map(exports.card).join("") + '</div>';
};
