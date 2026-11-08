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

  /* ⚠️⚠️⚠️ **넓은 PC 에서는 띠를 늘 펼쳐 둡니다** (2026-11-08).
     최종 디자인 지시서 1번이 "상단 PC 헤더 — 중앙 카테고리 텍스트 메뉴"
     라고 적었습니다. 그 자리가 바로 이 띠입니다.
     ⚠️⚠️ **폰에서는 그대로 접어 둡니다** — 열 개를 늘 펼치면 여러 줄이
     되어 히어로가 화면 밖으로 밀리고, 손님이 처음 보는 것이 분류 목록이
     됩니다. 그리고 머리말 메뉴가 상자 밖으로 나가면 "밀면 보이는 것은
     보이는 것이 아닙니다" 가 그대로 납니다.
     ⚠️ 가르는 폭은 **한 곳**입니다 — 여기 1180px 과 css/app.css 의
     `.catband` 규칙이 같은 수를 써야 합니다 (두 곳이 어긋나면 꺾쇠만
     남거나 띠가 두 번 그려집니다). */
  var MQ = window.matchMedia ? window.matchMedia("(min-width: 1180px)") : null;
  function wide(){ return !!(MQ && MQ.matches); }

  function open(on){
    band.hidden = !on;
    hit.setAttribute("aria-expanded", on ? "true" : "false");
  }

  /* ⚠️ 넓어지면 펼치고 좁아지면 접습니다 — 폭이 바뀌는 순간 둘이
     어긋나면, 좁은 폭에서 띠가 펼쳐진 채 남아 화면을 덮습니다. */
  function sync(){
    if(wide()){
      open(true);
      /* ⚠️⚠️ **여닫는 칸이 아니게 됩니다** — 그러면 `aria-expanded` 는
         거짓말입니다 (여닫지 않는 것에 "펼쳐져 있다" 를 붙이면 화면
         읽는 기계가 접을 수 있다고 알립니다). 떼어 냅니다. */
      hit.removeAttribute("aria-expanded");
      hit.removeAttribute("aria-controls");
    }else{
      hit.setAttribute("aria-controls", "catnav");
      open(false);
    }
  }
  sync();
  if(MQ){
    if(MQ.addEventListener) MQ.addEventListener("change", sync);
    else if(MQ.addListener) MQ.addListener(sync);
  }

  hit.addEventListener("click", function(e){
    /* ⚠️ 새 창 · 가운데 단추로 누르신 것은 **그대로 보냅니다** —
       가로채면 "새 창으로 열기" 가 안 되는 링크가 됩니다. */
    if(e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    /* ⚠️⚠️ 넓은 PC 에서는 띠가 이미 펼쳐져 있으므로 **그냥 링크**입니다 —
       `/categories` 로 갑니다. 가로채서 접으면 손님이 방금 보시던 메뉴가
       사라집니다. */
    if(wide()) return;
    e.preventDefault();
    open(band.hidden);
  });

  /* ⚠️ 닫는 길을 **셋** 둡니다 — 여는 길만 내고 닫는 길을 안 내면
     폰에서 띠가 화면을 덮은 채 남습니다 (0043 이 잇는 길만 내고 끊는
     길을 안 낸 그 꼴의 작은 판입니다). */
  document.addEventListener("keydown", function(e){
    if(wide()) return;
    if(e.key === "Escape" && !band.hidden){ open(false); hit.focus(); }
  });
  document.addEventListener("click", function(e){
    /* ⚠️⚠️ 넓은 PC 에서는 **닫지 않습니다** — 늘 서 있는 메뉴 줄이라,
       아무 데나 누르면 메뉴가 사라지는 꼴이 됩니다. */
    if(wide()) return;
    if(band.hidden) return;
    var t = e.target;
    if(!t || !t.closest) return;
    if(t.closest("#catnav") || t.closest("[data-catnav]")) return;
    open(false);
  });
})();
