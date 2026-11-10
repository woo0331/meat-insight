/* ════════════════════════════════════════════════════════════════════
   머리말 메뉴 — 하위 메뉴 여닫기 · 폰 햄버거   (2026-11-09 · 지시서 §3)
   드롭다운이 사라지는 고장 고침                 (2026-11-10 · 지시서 1~4)

   ⚠️⚠️⚠️ **이 파일이 없어도 메뉴는 돕니다.** 맨 위 일곱은 언제나 링크이고
   (build.js 의 navItem()), 넓은 PC 에서는 CSS 의 :hover ·
   :focus-within 이 하위를 펼칩니다. 이 파일이 더하는 것은 셋입니다 —
     ① 좁은 폭의 **햄버거**(없으면 메뉴 일곱이 그냥 다 보입니다)
     ② 손가락으로 **눌러서** 펼치기 (:hover 가 없는 기계)
     ③ **200ms 유예** — 마우스가 메뉴를 벗어나도 곧바로 안 닫습니다
   그래서 .hd 에 nav-js 를 붙이는 것이 **이 파일이 켜졌다는 표**이고,
   CSS 는 그 표가 있을 때만 메뉴를 접습니다. 접기만 하고 여는 길이 없으면
   폰에서 메뉴가 통째로 없는 것이 됩니다(절대 규칙 5).

   ⚠️⚠️⚠️ **2026-11-10 — 사장님이 겪은 고장의 참 원인은 CSS 였습니다.**
   펼침 칸이 margin-top:6px 로 떨어져 있어서, 이름에서 하위로 마우스를
   내리는 길에 **아무것도 안 걸린 6px 띠**가 있었습니다. 거기서 :hover 가
   끊기고 display 는 전환이 안 되므로 **그 자리에서 사라졌습니다**(재 보니
   3px 만 내려도 닫혔습니다). CSS 에 다리를 놓아 그 틈을 메웠고, 이 파일은
   그 위에 **유예**를 얹습니다 — 휠을 굴리거나 비스듬히 지나가도 버팁니다.

   ⚠️⚠️ **경계(1341px)를 여기 적지 않습니다.** 같은 규칙을 두 곳에 적으면
   한쪽만 고치는 날 조용히 어긋납니다(이 저장소가 여러 번 밟은 자리) —
   CSS 가 .gnb 에 --nav-hover 를 1 로 두고, 여기서는 **그 값을 읽습니다.**

   ⚠️⚠️ **aria-expanded 를 반드시 같이 바꿉니다** — 화면 읽는 기계에는
   그 속성이 "열렸나" 의 전부입니다. 모양만 바꾸고 속성을 안 바꾸면
   눈으로는 열렸는데 기계에는 닫힌 채입니다.

   ⚠️ 눌림은 **감싼 자리 한 곳**에서 받습니다(document 하나) — 단추마다
   따로 달면 메뉴가 느는 날 빠뜨리는 자리가 생깁니다.

   ⚠️ window. 에 아무것도 걸지 않습니다 — 이 저장소가 같은 이름을 두 번
   걸어 조용히 덮인 자리를 두 번 겪었습니다(amAdPlace · amRegionsFor).
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

  /* 넓은 PC 인가 — ⚠️ 경계는 CSS 한 곳에만 있습니다(--nav-hover) */
  function hoverOn(){
    try{
      return getComputedStyle(gnb).getPropertyValue("--nav-hover").trim() === "1";
    }catch(e){ return false; }
  }

  /* 하나만 엽니다 — ⚠️ 여럿이 같이 열리면 아코디언이 길어져 아래 메뉴가
     화면 밖으로 밀리고, PC 에서는 떠 있는 칸이 서로 겹칩니다.
     ⚠️ 여는 칸의 shut 을 같이 뗍니다 — 안 떼면 Esc 로 닫은 메뉴가
     그다음에 **아무리 눌러도 안 열립니다**(CSS 의 .shut 이 이깁니다). */
  function openOnly(it){
    items().forEach(function(x){
      var on = (x === it);
      x.classList.toggle("on", on);
      if(on) x.classList.remove("shut");
      var b = x.querySelector(".gnb-x");
      if(b) b.setAttribute("aria-expanded", on ? "true" : "false");
    });
  }
  function closeAll(){ openOnly(null); }

  /* ── 200ms 유예 ──────────────────────────────────────────────────
     ⚠️⚠️ display 는 전환(transition)이 안 되므로 CSS 로는 늦출 수가
     없습니다. 그래서 **닫는 일만** 여기서 늦춥니다 — 여는 것은 CSS 의
     :hover 가 곧바로 합니다(느리게 열리면 고장으로 보입니다).
     ⚠️ 다시 들어오시면 그 시계를 **끕니다** — 안 끄면 돌아왔는데도
     200ms 뒤에 닫힙니다. */
  var shutT = null;
  function cancelShut(){ if(shutT){ clearTimeout(shutT); shutT = null; } }

  /* ⚠️⚠️⚠️ **마우스로 연 것은 hov 입니다 — on 이 아닙니다.**
     한 가지로 묶었다가 "마우스가 올라가며 on 이 붙고, 그 자리에서 누르면
     닫기만 하는" 고장을 만들었습니다(터치 되는 넓은 화면에서는 눌러서
     열 수가 아예 없었습니다). on 은 **누름 · Enter** 의 것입니다. */
  function hovOnly(it){
    items().forEach(function(x){ x.classList.toggle("hov", x === it); });
  }
  function shutSoon(){
    cancelShut();
    shutT = setTimeout(function(){ shutT = null; hovOnly(null); closeAll(); }, 200);
  }

  /* 마우스를 올리면 엽니다 — ⚠️ mouseover 는 거품으로 올라오므로
     감싼 자리 하나로 받습니다(메뉴가 느는 날 빠뜨리는 자리가 없습니다). */
  gnb.addEventListener("mouseover", function(e){
    if(!hoverOn()) return;
    var it = e.target.closest ? e.target.closest(".gnb-i") : null;
    if(!it) return;
    cancelShut();
    /* ⚠️ 마우스가 다시 움직였으면 Esc · 눌러서 닫은 것을 풉니다 */
    it.classList.remove("shut");
    hovOnly(it);
  });

  /* ⚠️⚠️⚠️ **mouseleave 를 .gnb 에 답니다 — 칸마다가 아닙니다.**
     펼침 칸은 .gnb 의 **자손**이므로(떠 있어도 DOM 은 안쪽입니다) 거기로
     들어가는 길에는 안 걸립니다. 메뉴 A 에서 B 로 옮기는 것도 .gnb 안이라
     안 걸리고, mouseover 가 갈아 줍니다. 칸마다 달면 A→B 로 옮길 때마다
     시계가 돌아 깜빡입니다. */
  gnb.addEventListener("mouseleave", function(){
    if(!hoverOn()) return;
    shutSoon();
  });

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
      cancelShut();
      var it = x.closest(".gnb-i");
      /* ⚠️⚠️ 눌러서 닫을 때는 shut 을 같이 답니다 — 마우스가 아직 그
         단추 위에 있으므로, 안 달면 CSS 의 :hover 가 **그대로 열어
         둡니다**(눌렀는데 아무 일이 안 난 것으로 보입니다). */
      if(it && it.classList.contains("on")){
        closeAll(); hovOnly(null); it.classList.add("shut");
      }else openOnly(it);
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
     분의 초점이 사라진 칸에 남아 그다음 Tab 이 어디로 갈지 모릅니다.
     ⚠️⚠️⚠️ 그런데 그 단추가 .gnb-i **안**이라, 되돌리는 순간
     :focus-within 이 다시 참이 되어 **눈에는 안 닫혔습니다.** 그래서
     shut 을 답니다(CSS 가 특정도로 :focus-within 을 넘습니다). */
  document.addEventListener("keydown", function(e){
    if(e.key !== "Escape") return;
    var it = gnb.querySelector(".gnb-i.on, .gnb-i.hov, .gnb-i:hover, .gnb-i:focus-within");
    if(it){
      var b = it.querySelector(".gnb-x");
      cancelShut();
      closeAll();
      hovOnly(null);
      it.classList.add("shut");
      if(b) b.focus();
      return;
    }
    if(hd.classList.contains("nav-on")){
      setNav(false);
      if(burger) burger.focus();
    }
  });

  /* ⚠️ 초점이 그 칸을 **떠나면** shut 을 풉니다 — 안 풀면 Esc 를 누른
     뒤 Tab 으로 다시 돌아오셨을 때 초점이 들어와도 안 열립니다.
     ⚠️⚠️⚠️ 그리고 **넓은 PC 에서는 같이 닫습니다** — Enter 로 연 메뉴는
     on 이 남으므로, 초점이 Tab 으로 지나가 버린 뒤에도 떠 있는 칸이
     그대로 남아 있었습니다(앞 판부터 그랬고 아무 검사도 안 봤습니다).
     ⚠️ 좁은 폭(아코디언)에서는 **안 닫습니다** — 거기서 여는 것은 손가락
     으로 **누른 것**이고, 누른 단추의 초점이 빠지는 기계가 있어서 닫으면
     눌러도 안 열리는 것처럼 보입니다. 가르는 값은 CSS 의 --nav-hover
     한 곳입니다.
     ⚠️ focusout 은 **다음 칸으로 옮기기 전에** 먼저 나므로, 어디로
     갔는지는 한 박자 뒤에 봅니다. */
  gnb.addEventListener("focusout", function(e){
    var it = e.target.closest ? e.target.closest(".gnb-i") : null;
    if(!it) return;
    setTimeout(function(){
      if(it.contains(document.activeElement)) return;
      it.classList.remove("shut");
      if(hoverOn() && !it.matches(":hover")){ hovOnly(null); closeAll(); }
    }, 0);
  });
})();
