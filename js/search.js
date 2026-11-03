/* ════════════════════════════════════════════════════════════════════
   검색 — /search 에서만 돕니다

   ⚠️⚠️ **열쇠는 q 하나입니다.** 머리말의 검색창이 name="q" 로 보내고
   여기서도 q 를 읽습니다. 한쪽만 바꾸면 **아무것도 안 걸렀는데 화면은
   열립니다** — 눌러 봐야 아는 고장입니다.

   ⚠️ 지금 업체가 0곳이라 **분류를 찾아 줍니다.** 업체가 쌓이면 업체를
   먼저 내고 분류를 그 아래에 둡니다. 없는 업체를 지어내지 않습니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("sres");
  if(!box) return;

  var q = (new URLSearchParams(location.search).get("q") || "").trim();
  var input = document.getElementById("q");
  if(input && q) input.value = q;
  if(!q) return;                       /* 빈 검색이면 아무 말도 안 합니다 */

  var hay = (window.AM_CATS || []).map(function(c){
    var subs = (c.items || []).map(function(i){ return i.name; }).join(" ");
    return { c: c, t: (c.name + " " + c.lead + " " + (c.kw || "") + " " + subs).toLowerCase() };
  });
  var words = q.toLowerCase().split(/\s+/).filter(Boolean);
  var hit = hay.filter(function(h){
    return words.some(function(w){ return h.t.indexOf(w) >= 0; });
  }).map(function(h){ return h.c; });

  box.hidden = false;
  if(!hit.length){
    box.innerHTML =
      "<h3>" + esc(q) + " 로 찾은 것이 없습니다.</h3>" +
      "<p>아래 분류에서 골라 보세요. 업체는 아직 등록 전이라 0곳입니다 — " +
      "없는 업체를 지어내 보여 드리지 않습니다.</p>";
    return;
  }
  box.innerHTML =
    /* ⚠️ 손님이 친 글 뒤에 붙는 조사입니다 — 받침에 따라 와/과 가
       갈립니다 ("퍼터와" · "드라이버와" · "아이언과"). */
    "<h3>" + esc(window.koWith(q, "와과")) + " 맞는 분류 " + hit.length + "가지</h3>" +
    '<ul class="chips" style="justify-content:center;margin-top:14px">' +
    hit.map(function(c){
      return '<li><a class="chip chip-go" href="' + esc(window.amCatUrl(c)) + '">' +
        window.icon(c.icon, 18) + esc(c.name) + "</a></li>";
    }).join("") + "</ul>" +
    "<p style=\"margin-top:14px\">업체는 아직 등록 전이라 0곳입니다.</p>";
})();
