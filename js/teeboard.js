/* ════════════════════════════════════════════════════════════════════
   날짜 · 지역별 현황 — 메인 (DB 는 0060 · 지시서 §5)

   ⚠️⚠️⚠️ **숫자를 지어내지 않습니다.** 표의 모든 칸은 공개 보기
   (`v_teetime_count` · `v_join_count`)가 **실제로 센 값**이고, 그
   보기들은 목록 보기(`v_teetime_open` · `v_join_open`) **위에** 서
   있습니다 — 그래서 표의 숫자와 목록의 줄 수가 **구조적으로** 달라질
   수 없습니다 (§5 의 "집계 조건과 결과 목록 필터 일치").
   ⚠️ 0건인 칸은 **0 이라고 적습니다** (빈칸으로 두면 "모름" 과 섞입니다).

   ⚠️⚠️ **부킹은 지금 전부 0 입니다** — 제휴 골프장이 확인한 티타임만
   올라오고 아직 0건입니다. 그 사실을 표 아래에 **적고** 실제로 되는
   길(부킹 상담 요청)을 같이 냅니다 (막다른 길로 두지 않습니다 ·
   절대 규칙 2). 0 을 "곧 생깁니다" 로 포장하지 않습니다.

   ⚠️⚠️ **지역 묶음은 `js/data/regions.js` 의 `AM_REGION_ZONES` 한
   곳**입니다 — 표가 묶는 규칙과 칸을 눌렀을 때 목록이 거르는 규칙이
   같은 표를 읽어야 합니다. 두 곳에 적으면 숫자와 줄 수가 어긋납니다.

   ⚠️⚠️ **날짜는 Asia/Seoul** 입니다 — `toISOString()` 으로 오늘을 지으면
   한국에서 아침 9시 전에 하루가 밀립니다.

   ⚠️ 설정이 없으면 **한 줄도 안 그립니다** (빌드가 찍어 둔 안내 그대로).
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("teeboard");
  if(!box || !window.amAuthAsk) return;

  var esc = window.esc;
  var A = null, KIND = "booking";
  var DAYS = Number((window.WOW_BIZ || {}).teeBoard) || 14;
  var ZONES = window.AM_REGION_ZONES || [];

  /* ⚠️ 한국 기준 오늘부터 — 날짜 글자는 YYYY-MM-DD 입니다 */
  function kst(plus){
    return new Date(Date.now() + 9 * 3600 * 1000 + (plus || 0) * 86400000);
  }
  function iso(d){ return d.toISOString().slice(0, 10); }
  function days(){
    var W = ["일","월","화","수","목","금","토"], out = [];
    for(var i = 0; i < DAYS; i++){
      var d = kst(i);
      out.push({ iso: iso(d), m: d.getUTCMonth() + 1, d: d.getUTCDate(),
                 w: W[d.getUTCDay()] });
    }
    return out;
  }

  function get(path){
    var h = { apikey:(A && A.conf ? A.conf.anonKey : "") };
    if(window.amAuthHeaders) h = Object.assign(h, window.amAuthHeaders());
    return fetch(A.conf.url + "/rest/v1/" + path, { headers:h })
      .then(function(r){ return r.ok ? r.json() : null; })
      .catch(function(){ return null; });
  }

  /* 칸을 누르면 가는 자리 — ⚠️ 거르개 열쇠를 **한 곳**에서 짓습니다 */
  function cellUrl(zone, day){
    var base = (KIND === "join") ? "/cat/matchup" : "/cat/booking";
    return base + "?rg=" + encodeURIComponent(zone) + "&d=" + encodeURIComponent(day);
  }

  function table(rows){
    var ds = days();
    /* 묶음 × 날짜로 모읍니다 — ⚠️ 보기는 **지역별**로 주므로 여기서
       묶습니다 (묶는 규칙은 regions.js 한 곳입니다). */
    var sum = {};
    (rows || []).forEach(function(r){
      var z = window.amZoneOf(r.region);
      if(!z) return;                       /* 모르는 지역은 안 셉니다 */
      var k = z.key + "|" + String(r.play_at).slice(0, 10);
      sum[k] = (sum[k] || 0) + (Number(r.n) || 0);
    });
    var th = ds.map(function(x){
      var cls = x.w === "토" ? ' class="tbd-sat"'
              : (x.w === "일" ? ' class="tbd-sun"' : "");
      return '<th scope="col"' + cls + '>' + esc(String(x.m)) + "/" +
        esc(String(x.d)) + "(" + esc(x.w) + ")</th>";
    }).join("");
    var body = ZONES.map(function(z){
      var td = ds.map(function(x){
        var n = sum[z.key + "|" + x.iso] || 0;
        return "<td>" + (n > 0
          ? '<a class="tbd-n" href="' + esc(cellUrl(z.key, x.iso)) + '">' +
            esc(String(n)) + "</a>"
          /* ⚠️ 0 은 **0 이라고 적습니다** — 빈칸은 "모름" 과 섞입니다 */
          : '<span class="tbd-0">0</span>') + "</td>";
      }).join("");
      return '<tr><th scope="row">' + esc(z.name) + "</th>" + td + "</tr>";
    }).join("");
    /* ⚠️ 가로로 도는 상자에는 `position:relative` — 화면 읽는 기계용
       글이 문서 기준으로 튀어 폰 화면을 민 자리가 있었습니다. */
    return '<div class="tbd-s"><table class="tbd-t">' +
      '<caption class="sr">앞으로 ' + esc(String(DAYS)) +
      '일 동안 지역별로 올라온 자리 수</caption>' +
      '<thead><tr><th scope="col">지역</th>' + th + "</tr></thead>" +
      "<tbody>" + body + "</tbody></table></div>";
  }

  function note(total){
    if(KIND === "join"){
      return total > 0
        ? '<p class="tbd-note">숫자는 <b>지금 열려 있는 조인</b>을 센 것입니다. ' +
          '누르시면 그 날짜 · 지역으로 좁힌 목록이 열립니다.</p>'
        : '<p class="tbd-note">아직 열린 조인이 <b>0건</b>입니다. ' +
          '지어낸 숫자를 채우지 않습니다. ' +
          '<a class="btn btn-sm btn-line" href="/cat/matchup">조인 자리 보기</a></p>';
    }
    /* ⚠️⚠️ 0 을 포장하지 않습니다 — 왜 0 인지와 지금 되는 길을 적습니다 */
    return total > 0
      ? '<p class="tbd-note">숫자는 <b>제휴 골프장이 올린 티타임</b>을 센 ' +
        '것입니다. 누르시면 그 날짜 · 지역으로 좁힌 목록이 열립니다. ' +
        '예약 신청을 보내시면 <b>업체가 확인하고 확정</b>합니다.</p>'
      : '<p class="tbd-note">아직 올라온 티타임이 <b>0건</b>입니다 — ' +
        '제휴 골프장이 확인한 자리만 여기에 올라오고, 저희가 티타임을 ' +
        '직접 들고 있지 않습니다. 지금은 <b>상담 요청</b>으로 받습니다. ' +
        '<a class="btn btn-sm btn-pt" href="/match?cat=booking">부킹 상담 요청하기</a></p>';
  }

  function tabs(){
    return '<div class="tbd-sw">' +
      '<button type="button" class="tbd-b' + (KIND === "booking" ? " tbd-on" : "") +
        '" data-teetab="booking">부킹 현황</button>' +
      '<button type="button" class="tbd-b' + (KIND === "join" ? " tbd-on" : "") +
        '" data-teetab="join">조인 현황</button>' +
    '</div>';
  }

  function draw(){
    box.hidden = false;
    box.innerHTML = '<div class="tbd-h">' +
      '<h2 class="tbd-t2">날짜 · 지역별 현황</h2>' + tabs() + '</div>' +
      '<p class="myhint">불러오는 중입니다…</p>';
    var to = iso(kst(DAYS - 1));
    var q = (KIND === "join")
      ? "v_join_count?select=region,play_at,n&play_at=lte." + encodeURIComponent(to)
      : "v_teetime_count?select=region,play_at,n&kind=eq.booking" +
        "&play_at=lte." + encodeURIComponent(to);
    return get(q + "&limit=2000").then(function(rows){
      if(!rows){
        /* ⚠️ 못 읽었으면 **0건이라고 말하지 않습니다** */
        box.innerHTML = '<div class="tbd-h">' +
          '<h2 class="tbd-t2">날짜 · 지역별 현황</h2>' + tabs() + '</div>' +
          '<p class="myhint">지금 불러오지 못했습니다. 잠시 뒤에 다시 열어 주세요.</p>';
        return;
      }
      var total = rows.reduce(function(a, r){ return a + (Number(r.n) || 0); }, 0);
      box.innerHTML = '<div class="tbd-h">' +
        '<h2 class="tbd-t2">날짜 · 지역별 현황</h2>' + tabs() + '</div>' +
        table(rows) + note(total);
    });
  }

  box.addEventListener("click", function(e){
    var t = e.target;
    if(!t || !t.closest) return;
    var b = t.closest("[data-teetab]");
    if(!b) return;
    KIND = b.getAttribute("data-teetab");
    draw();
  });

  window.amAuthAsk().then(function(a){
    if(!a || !a.on){
      try{ console.warn("[teeboard] 로그인 · 접수가 설정되지 않아 현황표를 " +
        "열지 않았습니다 (Vercel 의 SUPABASE_URL · SUPABASE_ANON_KEY)."); }catch(e){}
      return;
    }
    A = a;
    return draw();
  }).catch(function(){});
})();
