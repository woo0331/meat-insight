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

   ⚠️⚠️ **설정이 없어도 찾는 칸과 표의 뼈대는 그립니다** (2026-11-08) —
   다만 칸에 숫자 대신 `–` 를 적고 **0건이 아니라 못 읽은 것**이라고
   말합니다. 그 둘을 섞으면 그것이 지어낸 숫자입니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("teeboard");
  if(!box || !window.amAuthAsk) return;

  var esc = window.esc;
  /* ⚠️⚠️ **어느 탭이 먼저 열릴지는 빌드가 상자에 적어 줍니다**
     (`data-teekind`) — 메인과 `/cat/booking` 은 부킹 · `/cat/matchup` 은
     조인입니다. 화면이 주소를 보고 다시 판단하면 규칙이 두 곳이 되고,
     주소를 하나 더하는 날 한쪽만 고치게 됩니다(`#ttlist` 와 같은 꼴).
     ⚠️ 모르는 값이면 부킹입니다 — 빈 표를 내지 않습니다. */
  var A = null;
  var KIND = (box.getAttribute("data-teekind") === "join") ? "join" : "booking";
  /* 찾는 칸이 들고 있는 값 — ⚠️ 표의 `KIND` 와 **같은 변수**를 읽습니다.
     두 곳에 따로 두면 탭을 바꿨을 때 표와 단추가 다른 말을 합니다. */
  var FIND = { d:"", rg:"", course:"", t:"" };
  /* 티오프 시간대 — 말과 경계는 js/data/deal.js 의 AM_TEE_BAND 한 곳입니다.
     ⚠️ 조인은 시각이 **자유 글자**(joinroom.tee — "아침 · 오전")라
     숫자로 견줄 수가 없습니다 — 그래서 그 칸을 **아예 안 냅니다**
     (고르게 두고 안 걸러 주면 눌러도 아무 일이 안 나는 칸입니다 · 절대 규칙 5).
     ⚠️⚠️⚠️ **스크립트 차례에 기대지 않습니다** — 메인은 `data/deal.js` 를
     이 파일보다 **뒤에** 싣습니다. 불러올 때 값을 담아 두면 그 자리에서
     빈 배열이 되어 시간대 칸이 **조용히 안 그려집니다**(에러 0줄 ·
     `window.amAdPlace` 가 덮여 액자가 안 그려진 그 자리와 같은 결).
     그래서 **부를 때마다** 읽습니다 (차례를 고치는 것으로 때우면 다음에
     새 화면이 다른 차례로 적는 날 또 납니다). */
  function bands(){ return window.AM_TEE_BAND || []; }
  /* ⚠️⚠️ 골프장 고르개는 **올라온 티타임의 골프장만** 담습니다 —
     목록을 지어내면 영원히 0건인 자리로 보내는 것입니다(절대 규칙 1 · 5).
     0곳이면 그 칸을 **아예 안 냅니다**(절대 규칙 2). */
  var COURSES = [];
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

  /* ⚠️⚠️⚠️ **표는 늘 그립니다** (2026-11-08) — 설정이 없어 숫자를 못
     읽을 때도 **날짜 열과 지역 줄은 그대로** 세웁니다. 전에는 그 자리에
     한 줄짜리 안내만 남아서, 시안의 오른쪽 절반이 손님에게는 **빈 글**
     이었습니다.
     ⚠️⚠️ 다만 칸에 **0 을 적지 않습니다** — 세어 본 것이 아니라 못 읽은
     것이므로 `–` 를 적고 그 뜻을 표 아래에서 말합니다. 0 과 "모름" 을
     섞으면 그것이 지어낸 숫자입니다 (절대 규칙 1). */
  function table(rows, unknown){
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
        /* ⚠️ 못 읽었으면 **숫자를 적지 않습니다** (0 이 아닙니다) */
        if(unknown) return '<td><span class="tbd-x">–</span></td>';
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
      '일 동안 지역별로 올라온 자리 수' +
      (unknown ? ' — 지금은 숫자를 읽지 못했습니다' : '') + '</caption>' +
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

  /* ⚠️⚠️ **못 읽었을 때는 "0건" 이라고 말하지 않습니다** — 세어 본 것이
     아니라 읽지 못한 것입니다(절대 규칙 1). 표의 뼈대는 그대로 두고
     칸이 왜 비어 있는지를 여기서 말합니다. */
  function noteOff(){
    return '<p class="tbd-note">표의 칸은 <b>아직 숫자를 읽지 못한 자리</b>입니다 — ' +
      '0건이라는 뜻이 아닙니다. 날짜 · 지역 · 시간대를 고르고 <b>찾아보기</b>는 ' +
      '지금도 됩니다.</p>';
  }
  function noteFail(){
    return '<p class="tbd-note">지금 숫자를 불러오지 못했습니다 — ' +
      '0건이라는 뜻이 아닙니다. 잠시 뒤에 다시 열어 주세요.</p>';
  }

  /* ── 찾는 칸 ───────────────────────────────────────────────────
     ⚠️⚠️⚠️ **2026-11-07 까지 이 칸이 없었습니다.** 메인에 "원하는
     날짜와 지역의 자리 찾기" 라는 **제목만 달아 놓고 찾는 칸을 안
     만들었습니다** — 손님에게는 제목이 거짓말이고, "눌러도 아무 일이
     안 나는 단추" 의 사촌입니다(절대 규칙 5). 사장님이 주신 시안의
     왼쪽 절반이 통째로 비어 있었습니다.
     ⚠️ 거르개 열쇠는 `cellUrl()` 과 **같은 이름**(`rg` · `d`)을 씁니다 —
     표의 칸을 눌렀을 때와 **같은 목록**이 열려야 합니다. */
  function findBox(){
    var rg = ZONES.map(function(z){
      return '<option value="' + esc(z.key) + '"' +
        (FIND.rg === z.key ? " selected" : "") + ">" + esc(z.name) + "</option>";
    }).join("");
    /* ⚠️ 골프장은 **있을 때만** 냅니다 (0곳이면 고를 것이 없는 칸입니다) */
    var course = COURSES.length
      ? '<div class="tbf-r"><label for="tbf-c">골프장</label>' +
        '<select id="tbf-c" data-tbf="course"><option value="">전체 골프장</option>' +
        COURSES.map(function(c){
          return '<option value="' + esc(c) + '"' +
            (FIND.course === c ? " selected" : "") + ">" + esc(c) + "</option>";
        }).join("") + "</select></div>"
      : "";
    /* 티오프 시간대 — ⚠️ **부킹에만** 냅니다. 말과 경계는 AM_TEE_BAND
       한 곳이고, 목록 화면(js/booking.js)이 **같은 줄**을 읽습니다 —
       두 곳에 적으면 "오전" 이 화면마다 다른 시각을 가리킵니다. */
    var BS = bands();
    var band = BS.map(function(b){
      return '<option value="' + esc(b.key) + '"' +
        (FIND.t === b.key ? " selected" : "") + ">" + esc(b.name) +
        " " + esc(b.lead) + "</option>";
    }).join("");
    var bandBox = BS.length
      ? '<div class="tbf-r"><label for="tbf-t">시간대</label>' +
        '<select id="tbf-t" data-tbf="t"><option value="">전체 시간</option>' +
        band + "</select></div>"
      : "";
    var isJoin = (KIND === "join");
    return '<div class="tbf">' +
      '<div class="tbf-sw" role="group" aria-label="무엇을 찾으시나요">' +
        '<button type="button" class="tbf-b' + (isJoin ? "" : " tbf-on") +
          '" data-teetab="booking">' + window.icon("cal", 20) + '골프장 부킹</button>' +
        '<button type="button" class="tbf-b' + (isJoin ? " tbf-on" : "") +
          '" data-teetab="join">' + window.icon("people", 20) + '골프 조인</button>' +
      '</div>' +
      '<div class="tbf-in">' +
        '<p class="tbf-lead">' + (isJoin
          ? '원하는 날짜와 지역의 <b>조인 자리</b>를 찾아보세요.'
          : '원하는 날짜와 지역의 <b>골프장 티타임</b>을 찾아보세요.') + '</p>' +
        '<div class="tbf-g">' +
          '<div class="tbf-r"><label for="tbf-d">라운드 날짜</label>' +
          '<input id="tbf-d" type="date" data-tbf="d" value="' + esc(FIND.d) + '"></div>' +
          '<div class="tbf-r"><label for="tbf-rg">지역</label>' +
          '<select id="tbf-rg" data-tbf="rg"><option value="">전체 지역</option>' +
          rg + '</select></div>' +
          (isJoin ? "" : bandBox) +
          (isJoin ? "" : course) +
        '</div>' +
        /* ⚠️ 시각이 **안 적힌 자리**(0060 의 tee_at 은 비울 수 있습니다)는
           시간대를 고르시면 빠집니다 — 그 사실을 그 자리에서 말합니다
           (없는 것과 안 보여 주는 것은 다릅니다 · 절대 규칙 5). */
        ((!isJoin && FIND.t)
          ? '<p class="tbf-hint">시간대를 고르시면 <b>티오프 시각이 적힌 자리만</b> 나옵니다.</p>'
          : "") +
        '<button type="button" class="btn btn-deep tbf-go">' +
          window.icon("search", 20) +
          (isJoin ? "조인 찾아보기" : "부킹 검색하기") + '</button>' +
      '</div>' +
    '</div>';
  }

  /* 찾는 칸이 보내는 자리 — ⚠️ `cellUrl()` 과 **같은 열쇠**입니다 */
  function findUrl(){
    var base = (KIND === "join") ? "/cat/matchup" : "/cat/booking";
    var q = [];
    if(FIND.rg) q.push("rg=" + encodeURIComponent(FIND.rg));
    if(FIND.d)  q.push("d="  + encodeURIComponent(FIND.d));
    /* ⚠️ 조인에는 골프장 칸이 없습니다 — 보내면 받는 쪽이 모릅니다 */
    if(KIND !== "join" && FIND.course)
      q.push("course=" + encodeURIComponent(FIND.course));
    /* ⚠️ 시간대도 조인에는 안 보냅니다 — 받는 쪽이 모릅니다 */
    if(KIND !== "join" && FIND.t)
      q.push("t=" + encodeURIComponent(FIND.t));
    return base + (q.length ? "?" + q.join("&") : "");
  }

  /* ⚠️ 탭 둘은 **표 한 곳**에서 나옵니다 — 열쇠를 속성에 넣는
     자리라 esc() 를 거칩니다. */
  var TABS = [["booking", "부킹 현황"], ["join", "조인 현황"]];
  function tabs(){
    return '<div class="tbd-sw">' + TABS.map(function(t){
      return '<button type="button" class="tbd-b' + (KIND === t[0] ? " tbd-on" : "") +
        '" data-teetab="' + esc(t[0]) + '">' + esc(t[1]) + '</button>';
    }).join("") + '</div>';
  }

  /* ⚠️ 찾는 칸과 표를 **한 덩이**로 감쌉니다 — PC 에서 왼쪽 · 오른쪽,
     폰에서 위 · 아래입니다 (시안 그대로).
     ⚠⚠ **그리는 자리를 한 함수로** 두었습니다 — 감싸는 것과 찍는 것을
     나눔면 `innerHTML` 줄이 esc() 없는 껍데기 함수를 부르게 되어
     check-safe 가 따라갈 자리를 잃습니다. */
  function paintBox(inner){
    box.innerHTML = '<div class="tbw">' + findBox() +
      '<div class="tbd-stat"><div class="tbd-h">' +
        '<h2 class="tbd-t2">날짜 · 지역별 현황</h2>' + tabs() +
      '</div>' + inner + '</div></div>';
  }

  function draw(){
    box.hidden = false;
    /* ⚠️⚠️⚠️ **찾는 칸은 설정과 상관없이 그립니다** — 그 칸은 주소만
       짓고 DB 를 안 읽습니다. 전에는 설정이 없으면 구간을 통째로
       치워서, 지시서가 "핵심 메인 기능" 으로 요구한 부킹 · 조인
       찾는 칸이 손님에게 **없는 것**이었습니다.
       ⚠️ 못 읽을 때 **0건이라고 말하지 않습니다** — 세어 본 것이 아니라
       못 읽은 것입니다(절대 규칙 1). */
    if(!A){
      paintBox(table(null, true) + noteOff());
      return Promise.resolve();
    }
    paintBox('<p class="myhint">불러오는 중입니다…</p>');
    var to = iso(kst(DAYS - 1));
    var q = (KIND === "join")
      ? "v_join_count?select=region,play_at,n&play_at=lte." + encodeURIComponent(to)
      : "v_teetime_count?select=region,play_at,n&kind=eq.booking" +
        "&play_at=lte." + encodeURIComponent(to);
    return get(q + "&limit=2000").then(function(rows){
      if(!rows){
        /* ⚠️ 못 읽었으면 **0건이라고 말하지 않습니다** */
        paintBox(table(null, true) + noteFail());
        return;
      }
      var total = rows.reduce(function(a, r){ return a + (Number(r.n) || 0); }, 0);
      paintBox(table(rows) + note(total));
    });
  }

  box.addEventListener("click", function(e){
    var t = e.target;
    if(!t || !t.closest) return;
    /* 찾아보기 — ⚠️ 거르개를 **주소에 담아** 보냅니다. 그래야 주소를
       복사해 보내도 같은 화면이고 뒤로 가기도 됩니다. */
    if(t.closest(".tbf-go")){ window.location.href = findUrl(); return; }
    var b = t.closest("[data-teetab]");
    if(!b) return;
    KIND = b.getAttribute("data-teetab");
    draw();
  });
  /* ⚠️ 고르개는 `change` 로 받습니다 — 누름(click)으로만 받으면
     키보드로 고르는 분에게는 아무 일이 안 납니다. */
  box.addEventListener("change", function(e){
    var t = e.target;
    if(!t || !t.getAttribute) return;
    var k = t.getAttribute("data-tbf");
    if(k) FIND[k] = t.value;
  });

  /* ⚠️⚠️⚠️ **설정이 없을 때 이 구간을 통째로 치우고 있었습니다** (2026-11-08 에 고쳤습니다).
     첫 판은 그냥 돌아가서 빌드가 찍어 둔 **제목만 덩그러니** 남았고, 두 번째
     판은 구간을 치워서 **찾는 칸까지 같이 없았습니다** — 지시서가 "핵심 메인
     기능" 으로 요구한 부킹 · 조인 찾는 칸이 손님에게 **없는 것**이 된
     것입니다. 그 칸은 주소만 짓고 DB 를 안 읽습니다.
     ⚠️ 지금은 `draw()` 가 A 가 없어도 **찾는 칸과 표의 뼈대**를 그리고,
     칸에는 숫자 대신 `–` 를 적습니다 — **0건이 아닙니다.** */

  window.amAuthAsk().then(function(a){
    if(!a || !a.on){
      try{ console.warn("[teeboard] 로그인 · 접수가 설정되지 않아 현황표를 " +
        "열지 않았습니다 (Vercel 의 SUPABASE_URL · SUPABASE_ANON_KEY). " +
        "찾는 칸은 그대로 돕니다."); }catch(e){}
      draw();
      return;
    }
    A = a;
    /* ⚠️⚠️ 골프장 고르개는 **올라온 티타임에서 모읍니다** — 목록을
       지어내면 고르는 순간 영원히 0건인 자리로 갑니다. 못 읽으면
       그냥 그 칸을 안 냅니다(지어내지 않습니다). */
    return get("v_teetime_open?select=course&kind=eq.booking&limit=500")
      .then(function(rows){
        var seen = {};
        (rows || []).forEach(function(r){
          var c = String(r.course || "").trim();
          if(c && !seen[c]){ seen[c] = 1; COURSES.push(c); }
        });
        COURSES.sort(function(a, b){ return a.localeCompare(b, "ko"); });
      })
      .then(draw);
  }).catch(function(){});
})();
