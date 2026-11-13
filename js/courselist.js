/* ════════════════════════════════════════════════════════════════════
   골프장 정보 탭 — 탭 가르기 · 이름 찾기 · 지역 추리기 (/cat/booking)

   ⚠️⚠️⚠️ **설정(Supabase)과 상관없이 돕니다.** 이 화면이 읽는 것은
   빌드가 찍어 둔 `window.AM_COURSES` 하나이고 DB 를 한 번도 안 부릅니다.
   그래서 환경변수가 없어도 탭이 갈리고 거르개가 걸립니다 — 「눌러도
   아무 일이 안 나는 칸」이 안 됩니다(절대 규칙 5 · 메인의 찾는 칸이
   설정이 없으면 통째로 사라지던 그 자리).

   ⚠️⚠️ **탭도 거르개도 링크입니다.** 단추로만 만들면 자바스크립트가
   꺼진 분 · 크롤러에게 눌러도 아무 일이 안 나는 칸이 됩니다. 눌림을
   가로채 `pushState` 로 주소만 바꾸므로 **주소를 복사해 보내도 같은
   화면**이고 **뒤로 가기**도 됩니다.

   ⚠️⚠️⚠️ **날짜 · 시간 거르개는 여기 한 글자도 안 걸립니다.** 골프장
   정보는 "그 골프장이 어떤 곳인가" 라서 날짜로 달라지지 않습니다 —
   날짜를 고르면 골프장 목록이 줄어드는 화면은 손님을 속이는 것입니다.

   ⚠️ 카드는 `amCourseCard()` **한 함수**이고 빌드가 부르는 것과 같습니다
   (두 벌로 적으면 거르개를 누르는 순간 카드가 조용히 달라지고, 그려진
   화면만 보는 검사는 영원히 통과합니다).

   ⚠️⚠️ **눌림은 감싼 자리 한 곳에서 받습니다** — 다시 그릴 때마다 달면
   같은 손놀림에 호출이 여러 번 돕니다(0069 의 `bindBar()` 에서 세운 규칙).
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var tabs = document.querySelector(".cstab");
  var pane = document.getElementById("cspane");
  var tee  = document.getElementById("teepane");
  if(!tabs || !pane || !tee) return;

  var esc  = window.esc;
  var list = document.getElementById("cslist");
  var cnt  = document.getElementById("csf-n");
  var form = document.getElementById("csf");
  var KIND = "golf";
  var S = { tab:"tee", rg:"", q:"" };

  /* ── 주소에서 읽기 ───────────────────────────────────────────────
     ⚠️ 모르는 값은 **버립니다** — `?tab=` 에 아무 글자나 오면 둘 다
     가려 버려 빈 화면이 됩니다. */
  function readUrl(){
    var p = new URLSearchParams(location.search);
    var t = String(p.get("tab") || "");
    S.tab = (t === "course") ? "course" : "tee";
    S.rg  = String(p.get("rg") || "");
    S.q   = String(p.get("q")  || "");
  }
  function url(){
    var p = new URLSearchParams();
    if(S.tab === "course") p.set("tab", "course");
    if(S.rg) p.set("rg", S.rg);
    if(S.q)  p.set("q",  S.q);
    var s = p.toString();
    return location.pathname + (s ? "?" + s : "");
  }
  function go(push){
    if(push) history.pushState({ cs:1 }, "", url());
    paint();
  }

  /* ── 0건을 두 가지로 갈라 말합니다 ───────────────────────────────
     ⚠️⚠️ **"아직 없다" 와 "조건에 안 맞는다" 는 다릅니다** — 섞어 적으면
     조건을 걸어 둔 채 "골프장이 없구나" 로 읽으십니다. */
  function zeroNarrow(){
    return '<div class="none"><h3>조건에 맞는 골프장이 없습니다.</h3>' +
      '<p>고르신 지역 · 찾으신 이름에 맞는 곳이 없습니다. ' +
      '조건을 지우면 전체를 보실 수 있습니다.</p>' +
      '<p class="none-go">' +
      '<button type="button" class="btn btn-line csf-all">조건 지우기</button>' +
      '</p></div>';
  }
  function zeroEmpty(){
    var n = document.createElement("div");
    n.className = "none";
    n.innerHTML = '<h3>아직 등록된 골프장이 없습니다.</h3>' +
      '<p>전국 골프장 정보는 <b>공식 · 공공 출처에서 확인한 것만</b> ' +
      '싣습니다.</p>' +
      '<p class="none-go">' +
      '<a class="btn btn-pt" href="/match?cat=booking">부킹 상담 요청하기</a>' +
      '</p>';
    return n.outerHTML;
  }

  /* ⚠️⚠️⚠️ **칩 줄을 여기서 두 번째로 그리지 않습니다** —
     `amCourseChipRow()` 한 함수를 빌드와 여기가 같이 부릅니다(두 벌로
     적으면 손님이 누르는 순간 칩이 조용히 달라지고, 그려진 화면만 보는
     검사는 영원히 통과합니다 · 업체 카드를 `js/card.js` 한 곳에 모은 그
     까닭). ⚠️ 찾으신 이름은 주소에 **그대로 남깁니다** — 지역을 바꿔도
     복사해 보내면 같은 화면입니다. */
  function chips(){
    if(!pane || !window.amCourseChipRow) return;
    var row = window.amCourseChipRow(location.pathname, KIND, S.rg);
    var old = pane.querySelector(".chips-csrg");
    if(!row){ if(old) old.remove(); return; }
    var box = document.createElement("div");
    box.innerHTML = row;
    var el = box.firstChild;
    if(S.q) el.querySelectorAll("[data-csrg]").forEach(function(a){
      a.setAttribute("href", a.getAttribute("href") + "&q=" +
        encodeURIComponent(S.q));
    });
    if(old) old.replaceWith(el);
    else{
      var cnt = document.getElementById("csf-n");
      if(cnt) cnt.parentNode.insertBefore(el, cnt);
      else pane.appendChild(el);
    }
  }

  function paint(){
    /* 탭 — ⚠️ `hidden` 으로 가립니다(지우지 않습니다 — 돌아올 때 다시
       세워야 합니다 · 0069 의 상세 화면에서 세운 규칙). */
    var onCourse = (S.tab === "course");
    tee.hidden  = onCourse;
    pane.hidden = !onCourse;
    tabs.querySelectorAll("[data-cstab]").forEach(function(a){
      var on = (a.getAttribute("data-cstab") === S.tab);
      a.classList.toggle("on", on);
      if(on) a.setAttribute("aria-current", "true");
      else   a.removeAttribute("aria-current");
    });
    if(!onCourse) return;

    var all = window.amCourseList ? window.amCourseList(KIND) : [];
    var L   = window.amCoursePickCards
                ? window.amCoursePickCards({ rg:S.rg, q:S.q }, KIND) : all;
    if(list){
      list.innerHTML = L.length ? window.amCourseCards(L)
                     : (all.length ? zeroNarrow() : zeroEmpty());
    }
    if(cnt) cnt.textContent = L.length ? ("골프장 " + L.length + "곳") : "";
    var narrowed = !!(S.rg || S.q);
    pane.querySelectorAll(".csf-all").forEach(function(b){ b.hidden = !narrowed; });
    var q = document.getElementById("csf-q");
    if(q && q.value !== S.q) q.value = S.q;
    chips();
  }

  /* ── 눌림 · 보냄은 **한 곳**에서 받습니다 ─────────────────────── */
  function on(root){
    root.addEventListener("click", function(e){
      var t = e.target.closest ? e.target.closest("[data-cstab]") : null;
      if(t && root.contains(t)){
        e.preventDefault();
        S.tab = t.getAttribute("data-cstab") === "course" ? "course" : "tee";
        go(true);
        return;
      }
      var r = e.target.closest ? e.target.closest("[data-csrg]") : null;
      if(r && root.contains(r)){
        e.preventDefault();
        S.rg = r.getAttribute("data-csrg") || "";
        go(true);
        return;
      }
      var a = e.target.closest ? e.target.closest(".csf-all") : null;
      if(a && root.contains(a)){
        e.preventDefault();
        S.rg = ""; S.q = "";
        go(true);
      }
    });
  }
  on(tabs);
  on(pane);

  if(form) form.addEventListener("submit", function(e){
    e.preventDefault();
    var q = document.getElementById("csf-q");
    S.q = q ? String(q.value || "").trim() : "";
    go(true);
  });

  /* ⚠️⚠️ **뒤로 가기를 받습니다** — 탭을 `pushState` 로 바꾸므로 이 줄이
     없으면 주소만 바뀌고 화면이 그대로 있습니다(0069 의 그 자리). */
  window.addEventListener("popstate", function(){ readUrl(); paint(); });

  readUrl();
  paint();
})();
