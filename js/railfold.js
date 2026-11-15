/* ════════════════════════════════════════════════════════════════════
   조건 레일 접기 — 폰 폭(760px 이하)에서 「조건 고르기」 단추로 접습니다
   (2026-11-15 · 레슨 · 피팅 · 마켓이 같은 `.fit-rail` 을 씁니다)

   ⚠️⚠️ 폰에서 레일(지역 열일곱 · 방식 · 가격 …)이 통째로 펼쳐져 있어,
   목록까지 두 화면을 밀어야 했습니다(손님이 40~60대입니다).
   ⚠️⚠️ **접는 것은 이 파일이 돌 때만**입니다 — 빌드는 레일을 그대로
   찍고, 자바스크립트가 꺼진 분 · 크롤러에게는 펼친 채로 보입니다
   (접기만 하고 여는 길이 없으면 조건을 고를 길이 사라집니다 · 절대 규칙 5).
   ⚠️ 가르는 폭은 **CSS 한 곳**(`.rail-fold-b` 의 760px 규칙)입니다 —
   이 파일은 폭을 재지 않습니다. PC 에서는 단추가 안 보이고 레일이 늘 섭니다.
   ⚠️ 단추 글에 **고른 조건 수**를 적습니다 — 접힌 채 무엇으로 좁혔는지
   안 보이면 0건을 "업체가 없다" 로 읽습니다. 「전체」(빈 값)는 안 셉니다.
   ⚠️ `<details>` 로 접지 않습니다(접힌 글은 12px · 대비 검사에서 빠집니다).
   ════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  function picked(r){
    var n = 0;
    Array.prototype.forEach.call(r.querySelectorAll("input:checked"), function(i){
      if(String(i.value || "") !== "") n++;
    });
    return n;
  }
  function label(b, r){
    var open = r.classList.contains("rail-open"), n = picked(r);
    b.textContent = (open ? "조건 접기" : "조건 고르기") + (n ? " · " + n + "개 고름" : "");
    b.setAttribute("aria-expanded", open ? "true" : "false");
  }
  Array.prototype.forEach.call(document.querySelectorAll(".fit-rail"), function(r, k){
    if(r.getAttribute("data-fold")) return;
    r.setAttribute("data-fold", "1");
    if(!r.id) r.id = "railfold-" + k;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "btn btn-line rail-fold-b";
    b.setAttribute("aria-controls", r.id);
    r.parentNode.insertBefore(b, r);
    r.classList.add("rail-foldable");
    label(b, r);
    b.addEventListener("click", function(){
      r.classList.toggle("rail-open");
      label(b, r);
    });
    /* ⚠️ 레일 칸은 양식 밖(`form=`)에 있을 수 있어 **레일에서** 받습니다 */
    r.addEventListener("change", function(){ label(b, r); });
  });
})();
