/* ════════════════════════════════════════════════════════════════════
   이 골프장에 올라온 자리 — /course/<slug>  (DB 는 0060 · 0066)

   ⚠️⚠️⚠️ **골프장이 올린 것이 아닙니다.** 저희에 입점한 업체가 올린
   티타임을 그 골프장 이름으로 묶어 보여 주는 것뿐입니다. 화면이 그
   사실을 그 자리에서 말하고, **"예약 가능" 이라고 적지 않습니다**
   (업체가 확인하기 전까지는 '예약 신청' 입니다 · 지시서 §6).

   ⚠️⚠️ **거르는 것은 서버입니다** — 전부 받아 화면에서 고르면 다른
   골프장 자리가 쉰 줄 밖에 있을 때 **0건으로 보입니다** (조인 거르개에서
   겪은 자리).

   ⚠️⚠️ **0건이면 상자를 치우고 아래 안내를 남깁니다** — 빈 띠를 두면
   미완성 사이트로 읽힙니다 (절대 규칙 2).
   ⚠️ 설정이 없으면 **한 줄도 안 그립니다** (손님에게는 아무 말도 안
   합니다 — 절대 규칙 3).
   ⚠️ 손님이 적은 글은 **반드시 esc()** 를 지납니다 (절대 규칙 4).
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("csTee");
  if(!box || !window.amAuthAsk) return;
  var esc  = window.esc;
  var slug = box.getAttribute("data-course") || "";
  if(!slug) return;
  var none = document.querySelector(".cs-none");

  function money(v){
    if(v === null || v === undefined || v === "") return "";
    /* ⚠️ 0 을 기다리는 자리에 `||` 를 쓰지 않습니다 */
    var n = Number(v);
    if(!isFinite(n)) return "";
    return window.won ? window.won(n) + "원" : String(n) + "원";
  }
  function day(iso){
    var d = new Date(String(iso || "") + "T00:00:00Z");
    if(isNaN(d.getTime())) return String(iso || "");
    /* ⚠️⚠️ **보는 분 기계의 시간대로 꺼내지 않습니다** — getMonth() 는
       UTC 인 기계에서 하루 앞을 돌려주고, 그러면 손님이 **다른 날짜를
       예약**합니다 (0060 에서 세 파일이 그랬습니다). */
    return (d.getUTCMonth() + 1) + "." + d.getUTCDate();
  }
  function row(t){
    var left = Number(t.left_n);
    return '<li class="cst"><a href="' +
      esc(window.amCatUrl(window.amCat("booking"))) + '?d=' + esc(String(t.play_at)) +
      '&rg=' + esc(String(t.region)) + '">' +
      '<span class="cst-d">' + esc(day(t.play_at)) +
        (t.tee_at ? ' ' + esc(String(t.tee_at).slice(0, 5)) : '') + '</span>' +
      '<span class="cst-n">' + esc(String(t.provider_name || "")) + '</span>' +
      '<span class="cst-m">' +
        (t.holes ? '<span>' + esc(String(t.holes)) + '홀</span>' : '') +
        (isFinite(left) ? '<span>남은 자리 ' + esc(String(Math.max(left, 0))) + '</span>' : '') +
        (money(t.green_fee) ? '<span>' + esc(money(t.green_fee)) + '</span>' : '') +
      '</span></a></li>';
  }

  window.amAuthAsk().then(function(a){
    if(!a || !a.on){
      try{ console.warn("[coursetee] 로그인 · 접수가 설정되지 않아 티타임을 " +
        "열지 않았습니다 (Vercel 의 SUPABASE_URL · SUPABASE_ANON_KEY)."); }catch(e){}
      return;
    }
    var h = { apikey:a.conf.anonKey };
    if(window.amAuthHeaders) h = Object.assign(h, window.amAuthHeaders());
    /* ⚠️ 거르는 것은 **서버**입니다 (course_slug 로 좁혀서 받습니다) */
    return fetch(a.conf.url + "/rest/v1/v_teetime_open?select=id,provider_name," +
        "region,play_at,tee_at,holes,green_fee,left_n&course_slug=eq." +
        encodeURIComponent(slug) + "&order=play_at.asc&limit=20",
        { headers:h })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(rows){
        /* ⚠️ 못 읽었으면 **0건이라고 말하지 않습니다** — 그냥 둡니다 */
        if(!rows || !rows.length) return;
        box.innerHTML = '<ul class="cst-list">' + rows.map(row).join("") + '</ul>';
        box.hidden = false;
        if(none) none.hidden = true;
      })
      .catch(function(){});
  }).catch(function(){});
})();
