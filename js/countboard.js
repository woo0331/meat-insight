/* ════════════════════════════════════════════════════════════════════
   종류 · 지역별 현황 — 중고 · 인력 · 구합니다 · 게시판 (DB 는 0067)

   ⚠️⚠️⚠️ **숫자를 지어내지 않습니다.** 표의 모든 칸은 공개 보기
   (v_listing_count · v_job_count · v_wanted_count · v_cq_count)가
   **실제로 센 값**입니다. 못 읽었을 때는 숫자 자리에 "–" 를 적고
   **0 이라고 말하지 않습니다** — 세어 본 것이 아니라 못 읽은 것이고,
   그 둘을 섞으면 그것이 지어낸 숫자입니다 (절대 규칙 1).
   ⚠️ 0건인 칸은 **0 이라고 적습니다** (빈칸으로 두면 "모름" 과 섞입니다).

   ⚠️⚠️⚠️ **가로축에 날짜를 쓰지 않습니다.** 부킹 · 조인(js/teeboard.js)은
   "언제 치느냐" 가 물건이라 날짜가 축이지만, 중고채 · 구인 글 ·
   구합니다 글은 날짜로 찾는 것이 아닙니다. 축은 0067 머리말에 있습니다.

   ⚠️⚠️ **게시판에는 표를 안 냅니다** — cq 표에 **지역 칸이 없습니다**.
   없는 축을 만들려고 칸을 새로 만들면 누군가 그 칸을 채웁니다. 그래서
   게시판은 **게시판마다 한 숫자**입니다.

   ⚠️⚠️ **설정(Supabase)이 없어도 찾는 칸과 뼈대는 그립니다** — 찾는
   칸은 주소만 짓고 DB 를 안 읽습니다. 전에는 메인 현황표가 설정이
   없으면 한 줄짜리 안내만 남아 시안의 오른쪽 절반이 **빈 글**이었습니다.

   ⚠️⚠️⚠️ **스크립트 차례에 기대지 않습니다** — 이 파일이 읽는 값
   (AM_REGION_ZONES · AM_CATS · AM_JOB_KIND · AM_LST_PRICE)은 화면마다
   싣는 차례가 다릅니다. 불러올 때 담아 두면 그 자리에서 빈 배열이 되어
   칸이 **조용히 안 그려집니다**(에러 0줄 · window.amAdPlace 가 덮여
   액자가 안 그려진 그 자리와 같은 결). 그래서 **부를 때마다** 읽습니다.

   ⚠️ 거르개 열쇠는 cellUrl() 과 findUrl() 이 **같은 이름**을 씁니다 —
   표의 칸을 눌렀을 때와 찾기를 눌렀을 때가 **같은 목록**이어야 합니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("countboard");
  if(!box) return;

  var esc = window.esc;
  var KIND = box.getAttribute("data-cb") || "";
  /* 구합니다는 **분류마다** 서는 자리라 어느 분류인지를 상자가 적어
     줍니다 — 화면이 주소로 짐작하면 주소가 바뀌는 날 어긋납니다. */
  var CAT  = box.getAttribute("data-cbcat") || "";
  var A = null;

  /* 찾는 칸이 들고 있는 값 — ⚠️ 표와 **같은 변수**입니다 */
  var FIND = { row:"", rg:"", extra:"", extra2:"" };

  function zones(){ return window.AM_REGION_ZONES || []; }
  function cat(k){ return window.amCat ? window.amCat(k) : null; }
  function items(k){
    var c = cat(k);
    return (c && c.items) ? c.items : [];
  }

  /* ── 자리마다 다른 것 — **한 표**에 모읍니다 ───────────────────
     rows()    세로축 (키 · 이름)
     view      공개 보기 주소
     keyOf(r)  보기 줄에서 세로축 키를 꺼내는 법
     base      칸을 눌렀을 때 가는 화면
     rowQ/rgQ  그 화면이 **실제로 읽는** 질의문자 이름
     ⚠️⚠️ rowQ · rgQ 를 지어 적으면 칸은 그려지는데 눌러도 안 걸러집니다
     (화면이 보내는 열쇠와 받는 쪽이 달라 거르개가 아무것도 안 걸렀던
     그 자리 · 절대 규칙 5). 받는 쪽은 js/listing.js · js/career.js ·
     js/wanted.js · js/community.js 입니다. */
  function spec(){
    if(KIND === "used") return {
      title:"물건 종류 · 지역별 현황",
      rowHead:"물건 종류",
      lead:'원하는 <b>물건 종류 · 지역 · 가격대</b>의 중고 매물을 찾아보세요.',
      go:"중고 매물 검색하기",
      /* ⚠️ 업체가 하는 매입 견적 · 위탁판매(pv:true)는 매물이 아닙니다 */
      rows: items("used").filter(function(i){ return !i.pv; }),
      view:"v_listing_count?select=sub,region,n",
      keyOf:function(r){ return r.sub; },
      base:"/cat/used", rowQ:"s", rgQ:"rg"
    };
    if(KIND === "career") return {
      title:"갈래 · 지역별 현황",
      rowHead:"갈래",
      lead:'원하는 <b>갈래 · 하는 일 · 지역</b>의 구인 · 구직 글을 찾아보세요.',
      go:"구인 · 구직 검색하기",
      rows: window.AM_JOB_KIND || [],
      view:"v_job_count?select=kind,region,n",
      keyOf:function(r){ return r.kind; },
      base:"/cat/career", rowQ:"k", rgQ:"rg"
    };
    if(KIND === "wanted") return {
      title:"무엇을 · 어느 지역에서 찾고 계신가",
      rowHead:"무엇을",
      lead:'이 분류에서 <b>손님이 찾고 계신 것</b>을 하위 · 지역으로 좁혀 보세요.',
      go:"구합니다 글 보기",
      rows: items(CAT),
      /* ⚠️ 보기는 분류를 담고 있으므로 **서버에서** 제 분류로 좁힙니다 */
      view:"v_wanted_count?select=cat,sub,region,n&cat=eq." + encodeURIComponent(CAT),
      keyOf:function(r){ return r.sub; },
      base:(window.amCatUrl ? window.amCatUrl(cat(CAT) || CAT) : "/cat/" + CAT),
      rowQ:"s", rgQ:"rg"
    };
    return null;
  }

  function get(path){
    var h = { apikey:(A && A.conf ? A.conf.anonKey : "") };
    if(window.amAuthHeaders) h = Object.assign(h, window.amAuthHeaders());
    return fetch(A.conf.url + "/rest/v1/" + path, { headers:h })
      .then(function(r){ return r.ok ? r.json() : null; })
      .catch(function(){ return null; });
  }

  /* 칸을 누르면 가는 자리 — ⚠️ 열쇠를 **한 곳**에서 짓습니다 */
  function cellUrl(S, rowKey, zoneKey){
    return S.base + "?" + S.rowQ + "=" + encodeURIComponent(rowKey) +
           "&" + S.rgQ + "=" + encodeURIComponent(zoneKey);
  }

  /* 찾는 칸이 보내는 자리 — ⚠️ cellUrl() 과 **같은 열쇠**입니다 */
  function findUrl(S){
    var q = [];
    if(FIND.row) q.push(S.rowQ + "=" + encodeURIComponent(FIND.row));
    if(FIND.rg)  q.push(S.rgQ  + "=" + encodeURIComponent(FIND.rg));
    /* ⚠️ 가격대 · 택배는 **중고에만** 있습니다 — 다른 화면에 보내면
       받는 쪽이 모르고, 모르는 열쇠는 조용히 버려집니다(절대 규칙 5). */
    if(KIND === "used"){
      if(FIND.extra)  q.push("p=" + encodeURIComponent(FIND.extra));
      if(FIND.extra2) q.push("sh=1");
    }
    /* ⚠️ 인력의 '하는 일' 은 그 화면이 `s` 로 읽습니다 */
    if(KIND === "career" && FIND.extra)
      q.push("s=" + encodeURIComponent(FIND.extra));
    return S.base + (q.length ? "?" + q.join("&") : "");
  }

  /* ── 표 ───────────────────────────────────────────────────────
     ⚠️⚠️⚠️ **표는 늘 그립니다.** 설정이 없어 숫자를 못 읽을 때도 줄과
     열은 그대로 세우고 칸에만 "–" 를 적습니다 (메인 현황표와 같은 규칙).
     ⚠️⚠️ 0 과 "모름" 을 **다른 클래스**로 적습니다 — 한 자리에서 재면
     뼈대만 보고 통과하는 검사가 됩니다. */
  function table(S, rows, unknown){
    var Z = zones();
    /* 지역을 묶음으로 모읍니다 — ⚠️ 묶는 규칙은 regions.js 한 곳입니다
       (표가 묶는 규칙과 목록이 거르는 규칙이 같은 표를 읽어야 합니다). */
    var sum = {};
    (rows || []).forEach(function(r){
      var z = window.amZoneOf(r.region);
      if(!z) return;                       /* 모르는 지역은 안 셉니다 */
      /* ⚠️⚠️ 하위가 **비어 있는 줄**(구합니다는 하위가 필수가 아닙니다)은
         어느 줄에도 안 더합니다 — 더하면 손님이 안 고른 하위에 글이
         있는 것처럼 보입니다 (절대 규칙 1). 그 사실을 아래에서 말합니다. */
      var rk = S.keyOf(r);
      if(!rk) return;
      var k = rk + "|" + z.key;
      sum[k] = (sum[k] || 0) + (Number(r.n) || 0);
    });
    var th = Z.map(function(z){
      return '<th scope="col">' + esc(z.name) + "</th>";
    }).join("");
    var body = (S.rows || []).map(function(it){
      var td = Z.map(function(z){
        if(unknown) return '<td><span class="tbd-x">–</span></td>';
        var n = sum[it.key + "|" + z.key] || 0;
        return "<td>" + (n > 0
          ? '<a class="tbd-n" href="' + esc(cellUrl(S, it.key, z.key)) + '">' +
            esc(String(n)) + "</a>"
          : '<span class="tbd-0">0</span>') + "</td>";
      }).join("");
      return '<tr><th scope="row">' + esc(it.name) + "</th>" + td + "</tr>";
    }).join("");
    /* ⚠️ 가로로 도는 상자에는 position:relative (CSS 에 있습니다) */
    return '<div class="tbd-s"><table class="tbd-t">' +
      '<caption class="sr">' + esc(S.rowHead) +
      '별 · 지역별로 지금 올라와 있는 글 수' +
      (unknown ? " — 지금은 숫자를 읽지 못했습니다" : "") + "</caption>" +
      '<thead><tr><th scope="col">' + esc(S.rowHead) + "</th>" + th +
      "</tr></thead><tbody>" + body + "</tbody></table></div>";
  }

  /* ⚠️⚠️ 하위를 안 적은 글이 있을 수 있다는 것을 **그 자리에서** 말합니다 —
     숨기면 손님이 표의 합과 목록 수가 다른 것을 보고 숫자를 못 믿습니다. */
  function subNote(){
    return (KIND === "wanted")
      ? ' 하위를 안 적으신 글은 표에 안 들어갑니다 — 아래 목록에는 나옵니다.'
      : "";
  }
  function noteOn(total){
    return total > 0
      ? '<p class="tbd-note">숫자는 <b>지금 올라와 있는 글</b>을 센 것입니다. ' +
        '칸을 누르시면 그 조건으로 좁힌 목록이 열립니다.' + subNote() + '</p>'
      : '<p class="tbd-note">아직 올라온 글이 <b>0건</b>입니다 — ' +
        '지어낸 숫자를 채우지 않습니다. 첫 글을 올려 주시면 여기에 바로 섭니다.</p>';
  }
  /* ⚠️⚠️ 못 읽었을 때 **"0건" 이라고 말하지 않습니다** (절대 규칙 1) */
  function noteOff(){
    return '<p class="tbd-note">표의 칸은 <b>아직 숫자를 읽지 못한 자리</b>입니다 — ' +
      '0건이라는 뜻이 아닙니다. 조건을 고르고 <b>찾아보기</b>는 지금도 됩니다.</p>';
  }
  function noteFail(){
    return '<p class="tbd-note">지금 숫자를 불러오지 못했습니다 — ' +
      '0건이라는 뜻이 아닙니다. 잠시 뒤에 다시 열어 주세요.</p>';
  }

  function opt(list, sel, nameOf){
    return (list || []).map(function(x){
      return '<option value="' + esc(x.key) + '"' +
        (sel === x.key ? " selected" : "") + ">" +
        esc(nameOf ? nameOf(x) : x.name) + "</option>";
    }).join("");
  }

  /* ── 찾는 칸 ──────────────────────────────────────────────────
     ⚠️ 설정과 상관없이 그립니다 — 주소만 짓고 DB 를 안 읽습니다. */
  function findBox(S){
    var Z = zones();
    var rows =
      '<div class="tbf-r"><label for="cbf-row">' + esc(S.rowHead) + "</label>" +
        '<select id="cbf-row" data-cbf="row"><option value="">전체</option>' +
        opt(S.rows, FIND.row) + "</select></div>" +
      '<div class="tbf-r"><label for="cbf-rg">지역</label>' +
        '<select id="cbf-rg" data-cbf="rg"><option value="">전체 지역</option>' +
        /* ⚠️ 고르개는 **자세한 이름**입니다(amZoneLong) — 표의 줄머리만
           짧게 줄이고, 무엇이 들어 있는지는 고를 때 그대로 말합니다. */
        opt(Z, FIND.rg, function(z){
          return window.amZoneLong ? window.amZoneLong(z.key) : z.name;
        }) + "</select></div>";

    if(KIND === "used"){
      rows +=
        '<div class="tbf-r"><label for="cbf-p">가격대</label>' +
          '<select id="cbf-p" data-cbf="extra"><option value="">전체 가격</option>' +
          opt(window.AM_LST_PRICE || [], FIND.extra) + "</select></div>" +
        '<div class="tbf-r"><label for="cbf-sh">받는 방법</label>' +
          '<select id="cbf-sh" data-cbf="extra2">' +
          '<option value="">직거래 · 택배 전부</option>' +
          '<option value="1"' + (FIND.extra2 ? " selected" : "") +
          ">택배 되는 것만</option></select></div>";
    }
    if(KIND === "career"){
      rows +=
        '<div class="tbf-r"><label for="cbf-s">하는 일</label>' +
          '<select id="cbf-s" data-cbf="extra"><option value="">전체</option>' +
          opt(items("career"), FIND.extra) + "</select></div>";
    }
    return '<div class="tbf">' +
      '<div class="tbf-in">' +
        '<p class="tbf-lead">' + S.lead + "</p>" +
        '<div class="tbf-g">' + rows + "</div>" +
        '<button type="button" class="btn btn-deep tbf-go">' +
          window.icon("search", 20) + esc(S.go) + "</button>" +
      "</div></div>";
  }

  /* ⚠️⚠️ **감싸는 것과 찍는 것을 한 함수에** 둡니다 — 나누면 innerHTML
     줄이 esc() 없는 껍데기 함수를 부르게 되어 check-safe 가 따라갈
     자리를 잃습니다 (teeboard 와 같은 까닭). */
  function paintBox(S, inner){
    box.innerHTML = '<div class="tbw">' + findBox(S) +
      '<div class="tbd-stat"><div class="tbd-h">' +
        '<h2 class="tbd-t2">' + esc(S.title) + "</h2>" +
      "</div>" + inner + "</div></div>";
  }

  /* ── 게시판 — 표가 아니라 게시판마다 글 수 ─────────────────────
     ⚠️⚠️ **0건인 게시판을 숨기지 않습니다** — 숨기면 그 게시판에 첫
     글을 남길 길이 사라지고(막다른 길 · 절대 규칙 2), 글쓰기 고르개에는
     나오므로 두 화면이 다른 말을 합니다. */
  function boardChips(rows, unknown){
    var B = items("community");
    var n = {};
    (rows || []).forEach(function(r){ n[r.cat] = Number(r.n) || 0; });
    return B.map(function(b){
      var v = unknown ? null : (n[b.key] || 0);
      return '<a class="cqb-c2" href="/cat/community?s=' + esc(b.key) + '">' +
        '<span class="cqb-nm">' + esc(b.name) + "</span>" +
        (v === null
          ? '<span class="tbd-x">–</span>'
          : (v > 0 ? '<span class="cqb-n">' + esc(String(v)) + "</span>"
                   : '<span class="tbd-0">0</span>')) + "</a>";
    }).join("");
  }
  /* ⚠️⚠️ **칸을 만드는 자리와 찍는 자리를 가릅니다** — 한 함수에 두고
     지역 변수로 이어 붙이면 `check-safe` 가 그 문장에서 esc() 를 못
     보고 잡습니다 (따라갈 함수 이름이 없습니다). 글자만인 안내문은
     **그 자리에 그대로** 적습니다. */
  function boardBox(rows, unknown){
    box.innerHTML = '<div class="tbf cb-wide"><div class="tbf-in">' +
      '<p class="tbf-lead">게시판마다 <b>지금 올라온 글 수</b>입니다 — ' +
      '누르면 그 게시판만 나옵니다.</p>' +
      '<div class="cqb-grid">' + boardChips(rows, unknown) + "</div>" +
      (unknown
        ? '<p class="tbf-hint">칸의 <b>–</b> 는 아직 숫자를 읽지 못한 ' +
          '자리입니다 — 0건이라는 뜻이 아닙니다.</p>'
        : '<p class="tbf-hint">0건인 게시판도 그대로 둡니다 — ' +
          '첫 글을 남길 자리입니다.</p>') +
      "</div></div>";
  }


  function draw(){
    box.hidden = false;
    if(KIND === "board"){
      if(!A){ boardBox(null, true); return Promise.resolve(); }
      return get("v_cq_count?select=cat,n").then(function(rows){
        if(!rows){ boardBox(null, true); return; }
        boardBox(rows, false);
      });
    }
    var S = spec();
    /* ⚠️ 모르는 갈래면 **아무것도 안 그립니다** — 빈 표를 내지 않습니다 */
    if(!S || !S.rows || !S.rows.length){ box.hidden = true; return Promise.resolve(); }
    if(!A){ paintBox(S, table(S, null, true) + noteOff()); return Promise.resolve(); }
    return get(S.view).then(function(rows){
      if(!rows){ paintBox(S, table(S, null, true) + noteFail()); return; }
      var total = rows.reduce(function(a, r){ return a + (Number(r.n) || 0); }, 0);
      paintBox(S, table(S, rows, false) + noteOn(total));
    });
  }

  box.addEventListener("change", function(e){
    var t = e.target;
    if(!t || !t.getAttribute) return;
    var k = t.getAttribute("data-cbf");
    if(k) FIND[k] = t.value;
  });
  box.addEventListener("click", function(e){
    var t = e.target;
    if(!t || !t.closest) return;
    if(t.closest(".tbf-go")){
      var S = spec();
      if(S) window.location.href = findUrl(S);
    }
  });

  /* ⚠️⚠️ 스크립트 차례에 기대지 않습니다 — 읽는 값이 이 파일보다 뒤에
     실리는 화면이 있습니다. DOMContentLoaded 뒤에 한 번 그립니다. */
  function start(){
    if(!window.amAuthAsk){ draw(); return; }
    window.amAuthAsk().then(function(a){
      /* ⚠️⚠️ 여기서 보는 것은 `a.on` 입니다 — `a.conf` 는 설정이
         꺼져 있어도 빈 껍데기로 올 수 있어, 그것으로 가르면 읽지도
         못하면서 **읽은 상태로 알고** 칸에 0 을 적게 됩니다. */
      if(!a || !a.on){
        /* ⚠️ 운영자에게 할 말은 console 로 (절대 규칙 3) */
        try{ console.warn("[countboard] 로그인 · 접수가 설정되지 않아 " +
          "현황 숫자를 읽지 못했습니다 (Vercel 의 SUPABASE_URL · " +
          "SUPABASE_ANON_KEY). 뼈대와 찾는 칸은 그대로 돕니다."); }catch(e){}
        A = null; draw(); return;
      }
      A = a; draw();
    }).catch(function(){ A = null; draw(); });
  }
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", start);
  } else { start(); }
})();
