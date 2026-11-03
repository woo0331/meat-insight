/* ════════════════════════════════════════════════════════════════════
   매각 지표 — /admin 의 한 자리 (2차 지시서 §9)

   ⚠️⚠️⚠️ **이 화면의 숫자는 사업의 값을 매기는 데 쓰입니다.** 그래서
   다른 화면과 규칙이 하나 더 있습니다 — **숫자 옆에 뜻을 같이 찍습니다.**
   "유효 상담 100건" 은 아무 뜻도 없고, "업체가 수락한 요청 100건" 은
   뜻이 있습니다. 뜻 없이 나간 숫자는 보는 사람이 제 마음대로 읽습니다.

   ⚠️⚠️ **세는 식이 여기 없습니다.** 식은 DB(`biz_metrics()` · 0033)
   한 곳이고, 말은 `js/data/metrics.js` 한 곳입니다. 화면은 받은 것을
   그리기만 합니다 — 여기서 더하거나 빼면 그 순간 식이 두 곳이 됩니다.

   ⚠️⚠️ **거래액과 플랫폼 수입을 나란히 놓지 않습니다.** 묶음을 갈라
   놓고 묶음마다 무엇인지 적습니다. 나란히 놓으면 보는 사람이 더하고,
   그 합은 **우리 매출이 아닙니다** (§9 가 "분리" 라고 적은 까닭).

   ⚠️⚠️ **못 재는 것을 같이 찍습니다.** DB 가 `cannot` 으로 내려주는
   글을 그대로 냅니다 — 무엇이 빠졌는지 모르고 보는 숫자가 제일
   위험합니다 (절대 규칙 5).
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("metricbox");
  if(!box || !window.amAuthAsk) return;

  var A = null;
  var SPAN = 12;          /* 몇 달치를 볼 것인가 */

  function why(err){
    var w = String((err && err.message) || "");
    try{ w = JSON.parse(w).message || w; }catch(_){}
    return w || "읽지 못했습니다.";
  }

  function rpc(name, args){
    return fetch(A.conf.url + "/rest/v1/rpc/" + name, {
      method:"POST",
      headers: Object.assign({ "content-type":"application/json",
                               apikey: A.conf.anonKey }, window.amAuthHeaders()),
      body: JSON.stringify(args || {})
    }).then(function(r){
      if(!r.ok) return r.text().then(function(t){ throw new Error(t || ("HTTP " + r.status)); });
      return r.json();
    });
  }

  /* 몇 달치를 물을 것인가 — ⚠️ 한국 시각으로 셉니다 (DB 와 같은 규칙).
     ⚠️⚠️ 여기서 UTC 로 달을 뽑으면 **매달 1일 아침 9시 전에** 한 달이
     어긋납니다 — 아무도 안 보는 시간이라 영영 모를 자리입니다. */
  function monthsBack(n){
    var kst = new Date(Date.now() + 9 * 3600 * 1000);
    var y = kst.getUTCFullYear(), m = kst.getUTCMonth();   /* 0~11 */
    var to = y + "-" + String(m + 1).padStart(2, "0");
    var f = new Date(Date.UTC(y, m - (n - 1), 1));
    var from = f.getUTCFullYear() + "-" + String(f.getUTCMonth() + 1).padStart(2, "0");
    return { from: from, to: to };
  }

  function picker(){
    return '<div class="mt-pick"><label for="mt-span">기간</label>' +
      '<select id="mt-span">' +
        [3, 6, 12, 24].map(function(n){
          return '<option value="' + n + '"' + (n === SPAN ? " selected" : "") +
            '>최근 ' + n + '개월</option>';
        }).join("") +
      '</select></div>';
  }

  /* 한 묶음 — ⚠️ 달이 가로로 늘어서므로 **칸째** 가로 스크롤을 줍니다
     (화면 전체가 가로로 밀리면 전수 점검이 잡습니다). */
  function groupTable(g, months){
    var rows = window.amMetricsOf(g.key);
    if(!rows.length) return "";
    return '<section class="mt-g">' +
      '<h3>' + esc(g.name) + '</h3>' +
      '<p class="mt-note">' + mark(g.note) + '</p>' +
      '<div class="doc-t"><table>' +
        '<thead><tr><th scope="col">지표</th>' +
          months.map(function(m){
            return '<th scope="col">' + esc(window.amMonthName(m.month)) + '</th>';
          }).join("") +
        '</tr></thead><tbody>' +
        rows.map(function(mt){
          return '<tr><th scope="row"><b>' + esc(mt.name) + '</b>' +
            '<span class="mt-what">' + mark(mt.what) + '</span></th>' +
            months.map(function(m){
              /* ⚠️⚠️ **0 과 '못 냄' 을 가릅니다.** amMetricText 가
                 null 을 "—" 로, 0 을 "0건" 으로 냅니다. 여기서 `||` 를
                 쓰면 0 이 "못 냄" 으로 바뀝니다. */
              return '<td>' + esc(window.amMetricText(mt.key, m[mt.key])) + '</td>';
            }).join("") + '</tr>';
        }).join("") +
      '</tbody></table></div></section>';
  }

  function paint(){
    box.hidden = false; box.className = "deskbox";
    box.innerHTML = '<h2 class="adm-h">매각 지표</h2><p class="lmsg">세는 중입니다…</p>';
    var span = monthsBack(SPAN);
    rpc("biz_metrics", { p: { from: span.from, to: span.to } }).then(function(d){
      var months = (d && Array.isArray(d.months)) ? d.months : [];
      if(!months.length){
        /* ⚠️ 0건이 아니라 **줄이 안 온 것**입니다 — 다르게 말합니다. */
        box.innerHTML = '<h2 class="adm-h">매각 지표</h2>' +
          '<p class="lmsg">달 자료가 오지 않았습니다. ' +
          '<button class="btn btn-sm btn-line" data-do="again">다시 읽기</button></p>';
        return;
      }
      box.innerHTML = '<h2 class="adm-h">매각 지표</h2>' +
        '<p class="myhint">' + esc(window.amMonthName(d.from)) + " ~ " +
        esc(window.amMonthName(d.to)) + ' · 한국 시각 기준 · ' +
        '<b>검사용 업체는 빼고 셉니다.</b></p>' +
        picker() +
        (window.AM_METRIC_GROUPS || []).map(function(g){
          return groupTable(g, months);
        }).join("") +
        /* ⚠️⚠️ **못 재는 것을 숫자와 같은 화면에** 둡니다 */
        '<section class="mt-cant"><h3>아직 못 재는 것</h3><ul>' +
        ((d && Array.isArray(d.cannot)) ? d.cannot : []).map(function(t){
          return '<li>' + esc(t) + '</li>';
        }).join("") + '</ul>' +
        '<p class="mt-note">이 자리를 비워 두고 숫자만 내보내지 마십시오 — ' +
        '무엇이 빠졌는지 모르고 보는 숫자가 제일 위험합니다.</p></section>';
    }).catch(function(err){
      /* ⚠️ 못 읽은 것과 0건은 다릅니다 */
      box.innerHTML = '<h2 class="adm-h">매각 지표</h2>' +
        '<p class="lmsg">' + esc(why(err)) + ' ' +
        '<button class="btn btn-sm btn-line" data-do="again">다시 읽기</button></p>';
    });
  }

  box.addEventListener("click", function(e){
    var b = e.target.closest ? e.target.closest("button[data-do='again']") : null;
    if(b) paint();
  });
  box.addEventListener("change", function(e){
    if(!e.target || e.target.id !== "mt-span") return;
    var n = Number(e.target.value);
    /* ⚠️ 0 을 기다리는 자리가 아니지만, 이상한 값이 오면 그대로 둡니다 */
    if(n > 0){ SPAN = n; paint(); }
  });

  amAuthAsk().then(function(a){
    A = a;
    /* ⚠️ 운영자가 아니면 **아무것도 그리지 않습니다** — /admin 의
       윗자리가 이미 안내하고 있습니다 (같은 말을 두 번 하지 않습니다). */
    if(!a.on || !a.signedIn) return;
    if(a.role !== "admin" && a.role !== "staff") return;
    paint();
  });
})();
