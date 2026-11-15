/* 메인 「전국 골프장 정보」 — 찾기 · 지역 · 초기화 · 더 보기 (2026-11-15)
   ════════════════════════════════════════════════════════════════════
   ⚠️⚠️ **DB 를 한 번도 안 부릅니다** — 빌드가 찍어 둔 `AM_COURSES` 만
   읽습니다(골프장 정보 탭 `js/courselist.js` 와 같은 자료 · 같은 거르개
   `amCoursePickCards` · 같은 줄 `amCourseGrid`). 거르는 규칙을 여기에
   한 벌 더 적지 않습니다.
   ⚠️⚠️ **한 번에 `HM_CS_PAGE` 곳씩만** 그립니다 — 508장을 한꺼번에
   그리면 폰에서 메인이 무거워집니다.
   ⚠️⚠️ **주소 규칙은 그 탭과 같습니다**(`tab=course` · `rg` · `q`) —
   「전체 골프장 보기」가 지금 고른 조건을 그대로 들고 갑니다. 권역 키
   (capital)는 이 파일이 시·도로 풀어 거르고, 넘길 때는 **그대로** 넘깁니다
   (받는 쪽이 같은 일을 합니다).
   ⚠️ 메인 주소는 안 바꿉니다(pushState 를 안 씁니다) — 메인에 조건이
   남으면 다시 오셨을 때 엉뚱하게 좁혀진 목록을 보십니다. */
(function(){
  var W = window;
  function boot(){
    var form = document.getElementById("hmcs");
    if(!form || !W.amCoursePickCards || !W.amCourseGrid || !W.amCourseList) return;
    var box  = document.getElementById("hmcs-l");
    var cnt  = document.getElementById("hmcs-n");
    var q    = document.getElementById("hmcs-q");
    var rg   = document.getElementById("hmcs-rg");
    var more = form.parentNode.querySelector(".hmcs-more");
    var full = form.parentNode.querySelector(".hmcs-full");
    var reset = form.querySelector(".hmcs-reset");
    /* ⚠️ 폰(한 줄에 한 곳)에서는 반만 — 12곳이면 그 구간만 두 화면 반입니다 */
    var PAGE = Number(W.HM_CS_PAGE) || 12;
    if(W.matchMedia && W.matchMedia("(max-width: 560px)").matches) PAGE = Math.ceil(PAGE / 2);
    var shown = PAGE, L = [];
    var base = form.getAttribute("action") || "/cat/booking";

    function keys(v){
      if(v && W.amZone && W.amZone(v) && W.amZoneRegions) return W.amZoneRegions(v).join(",");
      return v;
    }
    function fullUrl(){
      var p = new URLSearchParams();
      p.set("tab", "course");
      if(rg.value) p.set("rg", rg.value);
      if(q.value.trim()) p.set("q", q.value.trim());
      return base + "?" + p.toString();
    }
    function noneHtml(){
      return '<div class="none none-sm"><h3>조건에 맞는 골프장이 없습니다</h3>' +
        '<p>이름을 줄이거나 지역을 넓혀 보세요. 공개 자료에 없는 골프장일 수도 있습니다.</p></div>';
    }
    function paint(){
      var all = W.amCourseList("golf").length;
      var narrowed = !!(rg.value || q.value.trim());
      box.innerHTML = L.length ? W.amCourseGrid(L.slice(0, shown)) : noneHtml();
      /* ⚠️⚠️ 결과 수와 전체 수를 **갈라서** 적습니다 */
      cnt.innerHTML = narrowed
        ? '조건에 맞는 골프장 <b>' + W.esc(String(L.length)) + '곳</b> · 공개 자료 전체 ' + W.esc(String(all)) + '곳'
        : '공개 자료 전체 <b>' + W.esc(String(all)) + '곳</b>';
      more.hidden = (L.length <= shown);
      if(!more.hidden) more.textContent = "더 보기 (" + Math.min(PAGE, L.length - shown) + "곳 더)";
      reset.hidden = !narrowed;
      full.href = fullUrl();
      full.firstChild.nodeValue = narrowed ? "이 조건으로 전체 보기" : "전체 골프장 보기";
    }
    function run(){
      shown = PAGE;
      L = W.amCoursePickCards({ rg:keys(rg.value), q:q.value }, "golf");
      paint();
    }
    form.addEventListener("submit", function(e){ e.preventDefault(); run(); });
    rg.addEventListener("change", run);
    form.addEventListener("reset", function(){ setTimeout(function(){ run(); q.focus(); }, 0); });
    more.addEventListener("click", function(){ shown += PAGE; paint(); });
    run();
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
