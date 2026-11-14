/* ════════════════════════════════════════════════════════════════════
   메인 찾는 칸 — 「예약 검색 우선형」 확정 시안 (2026-11-14)

   ⚠️⚠️ **DB 를 한 번도 안 부릅니다** — 주소만 짓습니다. 그래서 설정
   (Supabase)이 없어도 돕니다. 받는 쪽은 이미 있는 화면입니다 —
     골프장 부킹 → /cat/booking   (rg · d · t)
     골프 조인   → /cat/matchup   (rg · d)
     골프장 정보 → /cat/booking?tab=course (q)
   ⚠️⚠️ **자바스크립트가 꺼져도 양식은 돕니다** — 빌드가 찍은 양식이
   GET 으로 /cat/booking 에 갑니다. 여기서는 ① 날짜 칩을 세우고 ② 탭에
   따라 보내는 곳 · 칸 · 단추 글을 바꿉니다.
   ⚠️⚠️ **날짜는 Asia/Seoul** — `getUTC*` 로 꺼냅니다(보는 분 기계의
   시간대로 꺼내면 한국 밖에서 하루가 밀립니다).
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var form = document.getElementById("hmfind");
  if(!form) return;
  var esc  = window.esc;
  var days = document.getElementById("hmdays");
  var dIn  = document.getElementById("hm-d");
  var goT  = document.getElementById("hm-go-t");
  var note = document.getElementById("hm-note");
  var MODE = "booking";

  /* 탭마다 다른 것 — ⚠️ 한 표에 둡니다 (흩어 적으면 한쪽만 고칩니다) */
  var M = {
    booking: { action:"/cat/booking", go:"티타임 찾기",
               note:"예약 신청 후 업체 확인을 거쳐 확정됩니다" },
    join:    { action:"/cat/matchup", go:"조인 찾기",
               note:"함께 칠 분과는 서로 연락처를 따로 열어 이어집니다" },
    course:  { action:"/cat/booking", go:"골프장 찾기",
               note:"공공 자료로 만든 안내입니다 — 예약은 업체가 올린 티타임에서만 됩니다" }
  };

  function kst(plus){ return new Date(Date.now() + 9 * 3600 * 1000 + (plus || 0) * 86400000); }
  function iso(d){ return d.toISOString().slice(0, 10); }
  var WD = ["일","월","화","수","목","금","토"];
  var N  = Number((window.WOW_BIZ || {}).teeBoard) || 7;
  var TODAY = "";

  function chips(){
    TODAY = iso(kst(0));
    if(!dIn.value || dIn.value < TODAY) dIn.value = TODAY;
    dIn.min = TODAY;
    var out = [];
    for(var i = 0; i < N; i++){
      var d = kst(i), v = iso(d);
      var head = (i === 0) ? "오늘 " : (i === 1 ? "내일 " : "");
      out.push('<button type="button" class="hm-day' + (dIn.value === v ? " on" : "") +
        '" data-hmday="' + esc(v) + '" aria-pressed="' + (dIn.value === v) + '">' +
        esc(head) + '<b>' + esc((d.getUTCMonth() + 1) + "." + d.getUTCDate()) + '</b> ' +
        esc(WD[d.getUTCDay()]) + '</button>');
    }
    /* ⚠️ 고르개(`label.hm-date`)는 **그대로 두고** 그 앞에 칩을 끼웁니다 —
       고르개를 다시 그리면 고르신 값이 날아갑니다. */
    var old = days.querySelectorAll(".hm-day");
    for(var j = 0; j < old.length; j++) old[j].parentNode.removeChild(old[j]);
    days.insertAdjacentHTML("afterbegin", out.join(""));
  }

  function setMode(k){
    if(!M[k]) return;
    MODE = k;
    form.setAttribute("action", M[k].action);
    form.querySelectorAll("[data-hmtab]").forEach(function(a){
      var on = a.getAttribute("data-hmtab") === k;
      a.classList.toggle("on", on);
      if(on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
    /* 이 탭에서만 쓰는 칸 — ⚠️ 끈 칸은 **보내지 않습니다**(disabled) */
    form.querySelectorAll("[data-hmonly]").forEach(function(el){
      var on = el.getAttribute("data-hmonly") === k;
      if(el.tagName === "INPUT") el.disabled = !on; else el.hidden = !on;
      el.querySelectorAll && el.querySelectorAll("input").forEach(function(x){ x.disabled = !on; });
    });
    form.querySelectorAll("[data-hmhide]").forEach(function(el){
      var off = (" " + el.getAttribute("data-hmhide") + " ").indexOf(" " + k + " ") >= 0;
      el.hidden = off;
      el.querySelectorAll("select").forEach(function(x){ x.disabled = off; });
    });
    /* 날짜는 골프장 정보에 안 씁니다 — 그 화면은 날짜로 달라지지 않습니다 */
    days.hidden = (k === "course");
    dIn.disabled = (k === "course");
    goT.textContent = M[k].go;
    note.querySelector("span").textContent = M[k].note;
  }

  form.addEventListener("click", function(e){
    var t = e.target && e.target.closest ? e.target : null;
    if(!t) return;
    var tab = t.closest("[data-hmtab]");
    if(tab){ e.preventDefault(); setMode(tab.getAttribute("data-hmtab")); return; }
    var day = t.closest("[data-hmday]");
    if(day){ dIn.value = day.getAttribute("data-hmday"); chips(); }
  });
  dIn.addEventListener("change", function(){ chips(); });
  /* 오늘이 바뀌었으면 칩을 다시 세웁니다 (열어 둔 채 자정을 넘긴 화면) */
  document.addEventListener("visibilitychange", function(){
    if(!document.hidden && iso(kst(0)) !== TODAY) chips();
  });

  /* 시간대 칸 — ⚠️ 빌드는 `data/deal.js` 를 읽지 않아 이 칸을 못 찍습니다.
     말과 경계는 `AM_TEE_BAND` **한 곳**이고(목록 화면 `js/booking.js` 가
     같은 줄을 읽습니다), 여기서 그 줄로 세웁니다. 빌드가 찍었으면 그대로 둡니다. */
  function band(){
    if(document.getElementById("hm-t")) return;
    var B = window.AM_TEE_BAND || [];
    if(!B.length) return;
    var go = form.querySelector(".hm-go");
    go.insertAdjacentHTML("beforebegin",
      '<div class="hm-sel" data-hmhide="join course">' + window.icon("clock", 18) +
      '<label class="sr" for="hm-t">시간대</label>' +
      '<select id="hm-t" name="t"><option value="">전체 시간</option>' +
      B.map(function(b){
        return '<option value="' + esc(b.key) + '">' + esc(b.name) + ' ' + esc(b.lead) + '</option>';
      }).join("") + '</select></div>');
  }

  band();
  chips();
  setMode("booking");
})();
