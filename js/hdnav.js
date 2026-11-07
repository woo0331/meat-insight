/* ════════════════════════════════════════════════════════════════════
   머리말의 '카테고리' → 열 분류 띠를 엽니다 · 닫습니다   (§2 · 2026-11-07)

   ⚠️⚠️⚠️ **링크를 가로채는 것이지 단추가 아닙니다.** 자바스크립트가
   꺼진 분 · 봇에게는 그대로 `/categories` 로 갑니다 (거기 열 분류가
   다 있습니다). 단추로만 만들면 그분들에게는 **눌러도 아무 일이 안
   나는 칸**입니다 (절대 규칙 5 · 업체찾기 거르개에서 적어 둔 그 자리).

   ⚠️⚠️ **띠는 `hidden` 한 속성으로만** 가립니다 — `<details>` 로
   접으면 그 안의 글이 `check-screens` 의 12px · 대비 검사에서
   빠집니다. 지금은 `check-screens` 가 **재기 전에 그 속성을 떼어**
   폭마다 같이 잽니다.

   ⚠️ 이 파일은 **모든 화면**에 실립니다 (base → auth → hdauth → hdnav).
   띠가 없는 화면에서는 아무 일도 하지 않습니다.
   ⚠️ 로그인 설정과 **아무 상관이 없습니다** — 분류는 늘 열려 있는
   길이므로 `amAuthAsk()` 를 묻지 않습니다 (물으면 설정 전에는 머리말
   메뉴가 안 열리는 꼴이 됩니다).
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var band = document.getElementById("catnav");
  var hit  = document.querySelector("[data-catnav]");
  if(!band || !hit) return;

  function open(on){
    band.hidden = !on;
    hit.setAttribute("aria-expanded", on ? "true" : "false");
  }

  hit.addEventListener("click", function(e){
    /* ⚠️ 새 창 · 가운데 단추로 누르신 것은 **그대로 보냅니다** —
       가로채면 "새 창으로 열기" 가 안 되는 링크가 됩니다. */
    if(e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault();
    open(band.hidden);
  });

  /* ⚠️ 닫는 길을 **셋** 둡니다 — 여는 길만 내고 닫는 길을 안 내면
     폰에서 띠가 화면을 덮은 채 남습니다 (0043 이 잇는 길만 내고 끊는
     길을 안 낸 그 꼴의 작은 판입니다). */
  document.addEventListener("keydown", function(e){
    if(e.key === "Escape" && !band.hidden){ open(false); hit.focus(); }
  });
  document.addEventListener("click", function(e){
    if(band.hidden) return;
    var t = e.target;
    if(!t || !t.closest) return;
    if(t.closest("#catnav") || t.closest("[data-catnav]")) return;
    open(false);
  });
})();
