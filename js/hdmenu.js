/* ════════════════════════════════════════════════════════════════════
   머리말 메뉴 — 하위 메뉴 여닫기 · 폰 햄버거   (2026-11-09 · 지시서 §3)

   ⚠️⚠️⚠️ **이 파일이 없어도 메뉴는 돕니다.** 맨 위 일곱은 언제나 링크이고
   (`build.js` 의 `navItem()`), 넓은 PC 에서는 CSS 의 `:hover` ·
   `:focus-within` 이 하위를 펼칩니다. 이 파일이 더하는 것은 두 가지뿐입니다 —
     ① 좁은 폭의 **햄버거**(없으면 메뉴 일곱이 그냥 다 보입니다)
     ② 손가락으로 **눌러서** 펼치기 (`:hover` 가 없는 기계)
   그래서 `.hd` 에 `nav-js` 를 붙이는 것이 **이 파일이 켜졌다는 표**이고,
   CSS 는 그 표가 있을 때만 메뉴를 접습니다. 접기만 하고 여는 길이 없으면
   폰에서 메뉴가 통째로 없는 것이 됩니다(절대 규칙 5).

   ⚠️⚠️ **`aria-expanded` 를 반드시 같이 바꿉니다** — 화면 읽는 기계에는
   그 속성이 "열렸나" 의 전부입니다. 모양만 바꾸고 속성을 안 바꾸면
   눈으로는 열렸는데 기계에는 닫힌 채입니다.

   ⚠️ 눌림은 **감싼 자리 한 곳**에서 받습니다(`document` 하나) — 단추마다
   따로 달면 메뉴가 느는 날 빠뜨리는 자리가 생깁니다.

   ⚠️ `window.` 에 아무것도 걸지 않습니다 — 이 저장소가 같은 이름을 두 번
   걸어 조용히 덮인 자리를 두 번 겪었습니다(`amAdPlace` · `amRegionsFor`).
   ════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";

  var hd = document.querySelector(".hd");
  if(!hd) return;
  var burger = hd.querySelector(".hd-burger");
  var gnb    = hd.querySelector(".gnb");
  if(!gnb) return;

  /* 이 파일이 켜졌다는 표 — CSS 가 이 표를 보고 좁은 폭에서 접습니다 */
  hd.classList.add("nav-js");
  if(burger) burger.removeAttribute("hidden");

  function items(){
    return [].slice.call(gnb.querySelectorAll(".gnb-i"));
  }

  /* 하나만 엽니다 — ⚠️ 여럿이 같이 열리면 아코디언이 길어져 아래 메뉴가
     화면 밖으로 밀리고, PC 에서는 떠 있는 칸이 서로 겹칩니다. */
  function openOnly(it){
    items().forEach(function(x){
      var on = (x === it);
      x.classList.toggle("on", on);
      var b = x.querySelector(".gnb-x");
      if(b) b.setAttribute("aria-expanded", on ? "true" : "false");
    });
  }
  function closeAll(){ openOnly(null); }

  function setNav(on){
    hd.classList.toggle("nav-on", on);
    if(burger){
      burger.setAttribute("aria-expanded", on ? "true" : "false");
      burger.setAttribute("aria-label", on ? "메뉴 닫기" : "메뉴 열기");
    }
    if(!on) closeAll();
  }

  document.addEventListener("click", function(e){
    var x = e.target.closest ? e.target.closest(".gnb-x") : null;
    if(x){
      e.preventDefault();
      var it = x.closest(".gnb-i");
      openOnly(it && it.classList.contains("on") ? null : it);
      return;
    }
    if(burger && e.target.closest && e.target.closest(".hd-burger")){
      e.preventDefault();
      setNav(!hd.classList.contains("nav-on"));
      return;
    }
    /* 바깥을 누르면 닫습니다 — ⚠️ 메뉴 **안**을 누른 것은 빼야 합니다
       (하위 링크를 누르는 순간 닫히면 그 링크가 안 눌립니다). */
    if(!e.target.closest || !e.target.closest(".hd")) { closeAll(); setNav(false); }
  });

  /* ⚠️ Esc 로 닫고 **초점을 되돌려 줍니다** — 안 되돌리면 키보드로 쓰시는
     분의 초점이 사라진 칸에 남아 그다음 Tab 이 어디로 갈지 모릅니다. */
  document.addEventListener("keydown", function(e){
    if(e.key !== "Escape") return;
    var it = gnb.querySelector(".gnb-i.on");
    if(it){
      var b = it.querySelector(".gnb-x");
      closeAll();
      if(b) b.focus();
      return;
    }
    if(hd.classList.contains("nav-on")){
      setNav(false);
      if(burger) burger.focus();
    }
  });
})();
