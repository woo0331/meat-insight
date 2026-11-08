/* ════════════════════════════════════════════════════════════════════
   구합니다 (0061) — 분류 화면의 "이런 걸 찾고 있어요"

   ⚠️⚠️ **목록은 브라우저가 그립니다** — 빌드가 못 찍습니다. 글은 아무
   때나 올라오고 내려갑니다. 설명 글은 빌드가 찍고(크롤러 몫) 목록만
   여기서 그립니다.

   ⚠️⚠️⚠️ **`/match`(매칭 요청)와 다릅니다 — 화면이 그 차이를 말해야
   합니다.**
     매칭 요청  운영자만 봅니다 · 배정할 때 상호를 알리고 다시 동의를
                받아 그 업체에만 넘깁니다 (제17조 제2항)
     구합니다   **누구나 봅니다** · 글에 연락처를 안 담고, 받아들인 뒤
                **각자 제 것만** 엽니다
   안 적으면 손님이 둘 중 무엇을 써야 할지 모릅니다.

   ⚠️⚠️ **답의 내용은 여기 안 나옵니다** — 개수만 나옵니다. 내용은
   올린 분과 답한 본인만 `/my` 에서 봅니다 (공개로 두면 답에 섞여 들어온
   연락처가 그대로 공개됩니다).

   ⚠️⚠️ **거르는 것은 서버입니다** — 백 줄만 받아 화면에서 거르면 서울
   글이 백 줄 밖에 있을 때 **0건으로 보입니다** (0046 에서 적어 둔 자리).

   ⚠️ 보유 기간(`wantedKeep`)이 비면 **양식을 안 엽니다** — 법이 보여
   주라는 것을 안 보여 주고 동의를 받을 수는 없습니다 (제15조 제2항).
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var list = document.getElementById("wtlist");
  if(!list || !window.amAuthAsk) return;

  var esc  = window.esc;
  var box  = document.getElementById("wtbox");
  /* ⚠️ 어느 분류인지는 **빌드가 상자에 적어 줍니다** (화면이 주소에서
     짐작하면 주소가 바뀌는 날 조용히 어긋납니다). */
  var CAT  = list.getAttribute("data-wcat") || "";
  var KEEP = String((window.WOW_BIZ || {}).wantedKeep || "");
  var A = null, SIGNED = false, PRO = null;

  /* ⚠️⚠️ **그 분류가 고를 수 있는 지역**을 읽습니다 (`amRegionsOf` 한 곳) —
     여행은 국내 열일곱 뒤에 해외 여섯이 붙습니다. `AM_REGIONS` 를 직접
     읽으면 해외 글이 **영문 키 그대로** 찍힙니다(조인에서 `closed` 가
     손님 화면에 찍힌 그 자리). */
  function regs(){
    return (window.amRegionsOf ? window.amRegionsOf(CAT) : (window.AM_REGIONS || [])) || [];
  }
  /* ⚠️ 모르는 키는 **그대로** 적습니다 — 이름을 지어내지 않습니다 */
  function rgName(k){
    var hit = regs().filter(function(r){ return r.key === k; });
    return hit.length ? hit[0].name : String(k || "");
  }

  /* 하위 — ⚠️ `catalog.js` 한 곳에서 끌어옵니다 (글자로 박지 않습니다) */
  function subs(){
    var c = window.amCat ? window.amCat(CAT) : null;
    return (c && window.amCatItems) ? (window.amCatItems(c) || []) : [];
  }
  function subName(k){
    if(!k) return "";
    var L = subs();
    for(var i = 0; i < L.length; i++) if(L[i].key === k) return L[i].name;
    return String(k);
  }

  var F = { sub:"", rg:"", q:"" };
  /* ⚠️⚠️ **한도는 여기 한 곳**입니다 — 받아 온 줄이 이 수에 닿으면
     화면이 "N건 이상" 이라고 적습니다. 그 수를 전체인 것처럼 적으면
     세어 본 값이 아닙니다(절대 규칙 1). */
  var LIMIT = 100;
  /* ⚠️⚠️⚠️ **주소에서 읽는 길이 2026-11-08 까지 없었습니다.** 거르개는
     있었는데 `?s=` · `?rg=` 로 들어오면 아무것도 안 걸렸습니다 — 즉
     현황표(0067)의 칸을 눌러도 **그냥 분류 화면이 열릴 뿐**이었습니다.
     ⚠️⚠️ 열쇠를 더하는 날 **첫 그림 조건도 같이** 봅니다 (`/search` 가
     `?sub=` 만 들고 오면 다시 그리지 않아 아무것도 안 걸렸던 그 자리) —
     여기서는 `load()` 가 늘 F 를 읽으므로 따로 고칠 자리가 없습니다.
     ⚠️ 모르는 키는 **버립니다** — 주소를 손으로 고쳐 오시면 아무것도
     안 걸리는 화면이 되는데, 그러면 "글이 없다" 로 읽힙니다. */
  function readUrl(){
    var u;
    try{ u = new URLSearchParams(window.location.search || ""); }catch(_){ return; }
    var sv = (u.get("s") || "").trim();
    var rv = (u.get("rg") || "").trim();
    if(sv && subs().some(function(x){ return x.key === sv; })) F.sub = sv;
    /* ⚠️ 묶음도 시 · 도도 받습니다 — 푸는 규칙 한 곳으로 가립니다 */
    if(rv && window.amRegionsFor && window.amRegionsFor(rv).length) F.rg = rv;
    F.q = (u.get("q") || "").trim().slice(0, 40);
  }
  /* 지금 걸린 조건을 주소에 적습니다 — ⚠️ 칸이 보내는 열쇠와 **같은
     이름**입니다 (현황표의 cellUrl 과 맞아야 눌렀을 때 같은 목록입니다). */
  function syncUrl(){
    var q = [];
    if(F.sub) q.push("s=" + encodeURIComponent(F.sub));
    if(F.rg)  q.push("rg=" + encodeURIComponent(F.rg));
    /* ⚠️ 찾는 말도 주소에 남깁니다 — 조건을 복사해 보낼 수 있어야 합니다 */
    if(F.q)   q.push("q=" + encodeURIComponent(F.q));
    try{
      window.history.replaceState({}, "",
        window.location.pathname + (q.length ? "?" + q.join("&") : ""));
    }catch(_){}
  }

  /* ── 보내기 — ⚠️ 거절한 말을 그대로 보여 줍니다 ─────────────────── */
  function call(name, args){
    return fetch(A.conf.url + "/rest/v1/rpc/" + name, {
      method:"POST",
      headers: Object.assign({ "content-type":"application/json",
                               apikey: A.conf.anonKey },
                             window.amAuthHeaders ? window.amAuthHeaders() : {}),
      body: JSON.stringify({ p: args })
    }).then(function(r){
      return r.text().then(function(t){
        if(!r.ok){ var m = t; try{ m = JSON.parse(t).message || t; }catch(_){}
                   throw new Error(m); }
        try{ return JSON.parse(t); }catch(_){ return t; }
      });
    });
  }

  function load(){
    /* ⚠️⚠️ **서버에서 거릅니다.** 화면에서 거르면 조건에 맞는 글이
       받아 온 백 줄 밖에 있을 때 0건으로 보입니다. */
    var qs = ["select=id,cat,sub,region,title,body,budget,when_txt," +
              "created_at,reply_n",
              "cat=eq." + encodeURIComponent(CAT),
              "order=created_at.desc", "limit=" + LIMIT];
    if(F.sub) qs.push("sub=eq." + encodeURIComponent(F.sub));
    /* ⚠️⚠️⚠️ **묶음(수도권)과 시 · 도(서울)를 한 열쇠로 받습니다** —
       현황표의 칸은 묶음을 보내고 거르개는 시 · 도를 보냅니다. 푸는
       규칙은 `amRegionsFor()` 한 곳입니다. */
    var rs = window.amRegionsFor ? window.amRegionsFor(F.rg) : [];
    if(rs.length) qs.push("region=in.(" + rs.map(encodeURIComponent).join(",") + ")");
    /* ⚠️⚠️ **찾기도 서버가 합니다** — 백 줄만 받아 화면에서 찾으면 그
       백 줄 밖의 글이 영영 안 나옵니다(0068 에서 적어 둔 자리).
       ⚠️ `*` 와 `%` 는 ilike 의 글자라 그대로 보내면 손님이 친 말과 다른
       것을 찾습니다 — 빼고 보냅니다. */
    if(F.q){
      var qq = F.q.replace(/[*%]/g, " ").trim();
      if(qq) qs.push("title=ilike." + encodeURIComponent("*" + qq + "*"));
    }
    return fetch(A.conf.url + "/rest/v1/v_wanted_open?" + qs.join("&"), {
      headers: Object.assign({ apikey: A.conf.anonKey },
                             window.amAuthHeaders ? window.amAuthHeaders() : {})
    }).then(function(r){ return r.ok ? r.json() : null; })
      .catch(function(){ return null; });
  }

  /* ── 거르개 ─────────────────────────────────────────────────────
     ⚠️⚠️⚠️ 2026-11-08 — 전에는 고르개 **둘**(무엇을 · 지역)이 목록 위에
     가로로 놓여 있었고, 고른 조건은 "지금 조건 — 골프채 · 서울" 한 **글**
     이라 **하나씩 지울 수가 없었습니다.** 0건이 나오면 손님은 무엇으로
     좁혔는지 못 보고 "글이 없구나" 로 읽습니다(0068 에서 중고장터에 칩을
     단 그 까닭이고, 알아본 곳들이 전부 고른 조건을 보여 줍니다).
     ⚠️ 모양은 **0068 의 CSS 를 그대로** 씁니다(`.lsw` · `.lsf-*`) — 같은
     위젯을 두 벌로 그리면 한쪽만 고치는 날 두 화면이 달라집니다.
     ⚠️⚠️ **id 는 갈라 둡니다**(`wt*`) — 클래스는 같이 쓰고 집는 이름은
     따로입니다. 한 화면에 둘이 같이 설 일은 지금 없지만(중고는 구합니다를
     안 받습니다), id 가 겹치면 그날 조용히 엉뚱한 칸을 집습니다. */
  function railHtml(){
    var sb = subs().map(function(it){
      return '<option value="' + esc(it.key) + '"' +
        (F.sub === it.key ? " selected" : "") + '>' + esc(it.name) + '</option>';
    }).join("");
    /* ⚠️⚠️ **묶음 여섯을 먼저** 냅니다 — 다른 화면이 묶음으로 보내므로,
       안 내면 그리로 들어온 분의 고르개가 "전국" 으로 보입니다. */
    var rg = '<optgroup label="지역 묶음">' +
      (window.AM_REGION_ZONES || []).map(function(z){
        return '<option value="' + esc(z.key) + '"' +
          (F.rg === z.key ? " selected" : "") + '>' +
          esc(window.amZoneLong ? window.amZoneLong(z.key) : z.name) + '</option>';
      }).join("") + '</optgroup>';
    /* ⚠️⚠️ **해외는 따로 묶어 냅니다**(여행만) — 시 · 도 틈에 「일본」을
       끼우면 국내인 줄 압니다. 목록은 `amRegionsOf()` 한 곳입니다. */
    var home = [], away = [];
    regs().forEach(function(r){ (r.abroad ? away : home).push(r); });
    function opts(L){
      return L.map(function(r){
        return '<option value="' + esc(r.key) + '"' +
          (F.rg === r.key ? " selected" : "") + '>' + esc(r.name) + '</option>';
      }).join("");
    }
    rg += '<optgroup label="시 · 도">' + opts(home) + '</optgroup>' +
          (away.length ? '<optgroup label="해외">' + opts(away) + '</optgroup>' : "");
    return '<div class="lsf-h"><b>필터</b>' +
      '<button type="button" class="lsf-x" id="wf-close" aria-label="필터 닫기">' +
      window.icon("close", 16) + '</button></div>' +
    '<form class="jform lsf-b" id="wtfil">' +
      '<div class="jrow"><label for="wf-s">무엇을</label>' +
        '<select id="wf-s"><option value="">전체</option>' + sb + '</select></div>' +
      '<div class="jrow"><label for="wf-rg">지역</label>' +
        '<select id="wf-rg"><option value="">전국</option>' + rg + '</select></div>' +
    '</form>' +
    /* ⚠️ 폰 시트의 바닥 — PC 에서는 CSS 가 가립니다 */
    '<div class="lsf-f">' +
      '<button type="button" class="btn btn-line wtf-reset">지우기</button>' +
      '<button type="button" class="btn btn-deep wtf-done">결과 보기</button>' +
    '</div>';
  }

  /* 맨 위 줄 — 찾기 · (폰에서만) 필터 단추
     ⚠️⚠️ **정렬 고르개를 안 냅니다** — 구합니다 글에 쓸 차례가 최신순
     하나뿐입니다. 한 가지뿐인 고르개는 눌러도 아무 일이 안 나는 칸입니다
     (절대 규칙 5). 차례가 둘이 되는 날 그때 냅니다. */
  function topBar(){
    var n = nowChips().length;
    return '<div class="lsf-top">' +
      '<div class="lsf-q">' + window.icon("search", 19) +
        '<input id="wf-q" type="search" maxlength="40" value="' + esc(F.q) + '" ' +
        'placeholder="찾으시는 것을 적어 보세요" aria-label="구합니다 글 찾기"></div>' +
      '<button type="button" class="lsf-btn" id="wf-open" aria-expanded="false">' +
        window.icon("menu", 19) + '필터' +
        (n ? ' <b>' + esc(String(n)) + '</b>' : "") + '</button>' +
    '</div>';
  }

  /* 고른 조건 — ⚠️ 칩 하나하나를 **지울 수 있게** 둡니다.
     ⚠️ **id 를 달지 않습니다** — 0건 상자도 같은 단추를 내므로 둘이
     같이 있을 때 같은 id 가 둘이 됩니다. */
  function nowChips(){
    var out = [];
    if(F.q)   out.push(["q",   '"' + F.q + '"']);
    if(F.sub) out.push(["sub", subName(F.sub)]);
    if(F.rg)  out.push(["rg",  window.amRegionLabel ? window.amRegionLabel(F.rg)
                                                    : rgName(F.rg)]);
    return out;
  }
  function chipRow(){
    var cs = nowChips();
    if(!cs.length) return "";
    return '<div class="lsf-chips">' + cs.map(function(c){
      return '<button type="button" class="lsf-chip" data-off="' + esc(c[0]) + '">' +
        esc(c[1]) + ' ' + window.icon("close", 13) + '</button>';
    }).join("") +
    '<button type="button" class="lsf-clear">조건 모두 지우기</button>' +
    '</div>';
  }

  /* ⚠️⚠️ **지우는 자리가 한 곳**입니다 — 칩 · 「모두 지우기」 · 0건 상자가
     같은 줄을 부릅니다. 0068 에서 0건 상자의 단추가 셋만 지워 "지웠습니다"
     가 거짓이 됐던 자리입니다. */
  function offAll(){
    F.sub = ""; F.rg = ""; F.q = "";
    var q = document.getElementById("wf-q");
    if(q) q.value = "";
  }
  function offOne(k){
    if(k === "sub")     F.sub = "";
    else if(k === "rg") F.rg  = "";
    else if(k === "q"){
      F.q = "";
      var q = document.getElementById("wf-q");
      if(q) q.value = "";
    }
  }

  function card(r){
    var bud = window.amWantBudget ? window.amWantBudget(r.budget) : "";
    var bits = [];
    if(r.sub)      bits.push(subName(r.sub));
    bits.push(rgName(r.region));
    if(r.when_txt) bits.push(esc(r.when_txt));
    /* ⚠️ 답이 0건이면 **그 자리를 안 적습니다** — "답 0건" 을 찍으면
       갓 올라온 글이 전부 인기 없는 글로 보입니다 (후기 0건에 숫자를
       안 찍는 그 까닭). */
    if(Number(r.reply_n) > 0) bits.push("답 " + String(r.reply_n) + "건");
    return '<li class="wtc">' +
      '<div class="wtc-h">' +
        '<h3>' + esc(r.title) + '</h3>' +
        /* ⚠️⚠️ **0 은 "무료로 해 주실 분"** 이고 안 적음과 다릅니다 —
           비면 이 칸이 **줄째 빠집니다**(자리표시자를 안 찍습니다). */
        (bud ? '<span class="wtc-p">' + esc(bud) + '</span>' : '') +
      '</div>' +
      '<p class="wtc-m">' + bits.join(" · ") + '</p>' +
      '<p class="wtc-b">' + esc(r.body) + '</p>' +
      '<p class="wtc-go">' +
        '<button type="button" class="btn btn-pt btn-sm wt-go" data-id="' +
          esc(r.id) + '">답하기</button> ' +
        '<button type="button" class="btn btn-bad btn-sm wt-rep" data-id="' +
          esc(r.id) + '">이 글 신고</button>' +
      '</p>' +
    '</li>';
  }

  /* ⚠️⚠️⚠️ **레일을 다시 그리지 않습니다.** 전에는 `paint()` 가
     `filterBar()` 를 **목록과 함께** 매번 다시 찍었습니다 — 찾는 칸을
     더하는 순간 글자를 한 자 칠 때마다 그 칸이 새로 그려져 **커서가
     튕겨 나갑니다**(에러는 안 납니다). 지금은 **한 번 세우고**
     (`mountBar`) 목록만 갈아 끼웁니다. */
  function mountBar(){
    var w = document.getElementById("wtwrap");
    if(w) return;
    w = document.createElement("div");
    w.id = "wtwrap"; w.className = "lsw";
    list.parentNode.insertBefore(w, list);

    var rail = document.createElement("aside");
    rail.id = "wtrail"; rail.className = "lsf-rail";
    rail.setAttribute("aria-label", "구합니다 글 거르개");

    var main = document.createElement("div");
    main.id = "wtmain"; main.className = "lsf-main";
    var bar = document.createElement("div");
    bar.id = "wtbar";
    bar.innerHTML = topBar() + '<div id="wtchips"></div>' +
      '<p class="jnf-n" id="wtnow" hidden></p>';
    main.appendChild(bar);
    main.appendChild(list);          /* ⚠️ 옮깁니다 (새로 만들지 않습니다) */

    /* ⚠️ 폰에서 시트가 열린 동안 뒤를 덮습니다 — PC 에서는 CSS 가 가립니다 */
    var sc = document.createElement("div");
    sc.id = "wtscrim"; sc.className = "lsf-scrim"; sc.hidden = true;

    w.appendChild(rail); w.appendChild(main); w.appendChild(sc);
    syncRail(); syncChips();
  }
  function syncRail(){
    var r = document.getElementById("wtrail");
    if(r) r.innerHTML = railHtml();
  }
  function syncChips(){
    var c = document.getElementById("wtchips");
    if(c) c.innerHTML = chipRow();
    var o = document.getElementById("wf-open");
    if(o){
      var n = nowChips().length;
      o.innerHTML = window.icon("menu", 19) + "필터" +
        (n ? ' <b>' + esc(String(n)) + '</b>' : "");
    }
  }
  function sheet(on){
    var w = document.getElementById("wtwrap");
    var o = document.getElementById("wf-open");
    var sc = document.getElementById("wtscrim");
    if(!w) return;
    if(on) w.classList.add("lsf-on"); else w.classList.remove("lsf-on");
    if(o) o.setAttribute("aria-expanded", on ? "true" : "false");
    if(sc) sc.hidden = !on;
  }

  /* ⚠️⚠️ **0건 상자는 글자만**입니다 — `check-safe` 가 "innerHTML 에
     변수를 넣는 줄" 을 세는데, 삼항으로 두 글 덩이를 고르면 그 줄에
     변수가 섞여 **esc() 를 따라갈 수가 없습니다.** 그 검사가 맞습니다:
     여기 손님 글이 한 자라도 들어오는 날 날것으로 나갑니다. 그래서
     고르는 것과 찍는 것을 갈라 둡니다(0068 의 `doneHtml()` 과 같은 꼴).
     ⚠️ 지우는 단추는 **`offAll()` 같은 줄**을 부릅니다 — 0068 에서
     0건 상자가 조건 일부만 지워 "지웠습니다" 가 거짓이 된 자리. */
  function noneNarrow(){
    return '<div class="none"><h3>그 조건에 맞는 글이 없습니다.</h3>' +
      '<p>지역이나 종류를 넓혀 보세요.</p>' +
      '<div class="none-b"><button type="button" class="btn btn-line lsf-clear">' +
      '조건 모두 지우기</button></div></div>';
  }
  function noneEmpty(){
    return '<div class="none"><h3>아직 올라온 글이 없습니다.</h3>' +
      '<p>찾으시는 것을 적어 두시면 업체나 다른 회원이 답을 답니다.</p></div>';
  }

  function paint(rows){
    mountBar();
    var on = nowChips().length;
    if(!rows.length){
      /* ⚠️⚠️ **0건을 두 가지로 갈라 말합니다** — "아직 아무도 안
         올렸다" 와 "조건에 맞는 것이 없다" 는 다른 말이고, 섞으면
         거르개를 걸어 둔 분이 "이 자리는 죽었구나" 로 읽습니다. */
      if(on) list.innerHTML = noneNarrow();
      else   list.innerHTML = noneEmpty();
    }else{
      list.innerHTML = '<ul class="wtl">' + rows.map(card).join("") + '</ul>';
    }
    /* ⚠️⚠️ **한도에 닿으면 "N건 이상"** 입니다 — 받아 온 줄 수를 전체인
       것처럼 적으면 세어 본 값이 아닙니다(절대 규칙 1). */
    var nl = document.getElementById("wtnow");
    if(nl){
      nl.hidden = false;
      nl.textContent = rows.length >= LIMIT
        ? ("구합니다 글 " + LIMIT + "건 이상")
        : ("구합니다 글 " + rows.length + "건");
    }
    syncRail(); syncChips();
  }

  /* ⚠️ 거르개는 **한 번만** 묶습니다 — 다시 그릴 때마다 묶으면 같은
     손놀림에 reload 가 여러 번 돕니다. */
  var BOUND = false;
  function bindBar(){
    if(BOUND) return;
    BOUND = true;
    var w = document.getElementById("wtwrap");
    if(!w) return;
    w.addEventListener("change", function(e){
      var t = e.target;
      if(!t || !t.id) return;
      if(t.id === "wf-s")  F.sub = t.value;
      else if(t.id === "wf-rg") F.rg = t.value;
      else return;
      syncUrl(); reload();
    });
    /* ⚠️ 찾는 말은 **치는 동안 기다렸다가** 보냅니다 — 한 자마다 보내면
       호출이 그만큼 늘고 마지막 답이 먼저 온 답을 덮습니다. */
    var tm = null;
    w.addEventListener("input", function(e){
      var t = e.target;
      if(!t || t.id !== "wf-q") return;
      if(tm) clearTimeout(tm);
      tm = setTimeout(function(){
        F.q = String(t.value || "").trim().slice(0, 40);
        syncUrl(); reload();
      }, 400);
    });
    w.addEventListener("keydown", function(e){
      if(e.key !== "Enter") return;
      var t = e.target;
      if(!t || t.id !== "wf-q") return;
      e.preventDefault();
      if(tm) clearTimeout(tm);
      F.q = String(t.value || "").trim().slice(0, 40);
      syncUrl(); reload();
    });
    w.addEventListener("click", function(e){
      var t = e.target;
      if(!t || !t.closest) return;
      if(t.closest("#wf-open")){ sheet(true); return; }
      if(t.closest("#wf-close") || t.closest(".wtf-done") ||
         t.closest("#wtscrim")){ sheet(false); return; }
      if(t.closest(".wtf-reset") || t.closest(".lsf-clear")){
        offAll(); syncUrl(); reload(); return;
      }
      var c = t.closest(".lsf-chip");
      if(c){ offOne(c.getAttribute("data-off")); syncUrl(); reload(); }
    });
  }

  function reload(){
    return load().then(function(rows){
      /* ⚠️⚠️ 못 읽었으면 **0건이라고 말하지 않습니다** — 그리고 센 수도
         안 적습니다(못 읽은 것과 0건은 다릅니다 · 절대 규칙 1). */
      if(!rows){
        mountBar();
        list.innerHTML =
          '<p class="myhint">지금 불러오지 못했습니다. 잠시 뒤에 다시 열어 주세요.</p>';
        var nl = document.getElementById("wtnow");
        if(nl){ nl.hidden = true; nl.textContent = ""; }
        bindBar();
        return;
      }
      paint(rows);
      bindBar();
    });
  }

  /* ⚠️⚠️ 제15조 제2항 — 수집 항목 · 이용 목적 · 보유 기간을 **동의받는
     그 자리에서** 같이 보여 줍니다. 링크로 빼 두면 "같이 보여 준 것" 이
     아닙니다.
     ⚠️⚠️ **id 를 달지 않습니다** — 이 상자는 올리는 양식과 답하는 양식에
     **둘 다** 들어가므로, id 를 달면 둘이 같이 열려 있을 때 같은 id 가
     둘이 됩니다 (조인에서 겪은 자리입니다). */
  function consentBox(){
    return '<div class="jrow jrow-full jconsent">' +
      '<label class="jchk"><input type="checkbox" required> ' +
      '<span>아래 내용으로 개인정보 수집 · 이용에 동의합니다 <b>*</b></span></label>' +
      '<ul class="jterms">' +
        '<li><b>수집 항목</b> 연락처, 적어 주신 글</li>' +
        '<li><b>이용 목적</b> 찾으시는 것을 알리고 해 주실 분과 잇기</li>' +
        '<li><b>보유 기간</b> ' + esc(KEEP) + '</li>' +
        '<li><b>제공</b> 연락처는 <b>받아들인 뒤 따로 고르셨을 때만</b> ' +
          '그 상대 한 분에게 보입니다. 언제든 다시 닫으실 수 있습니다.</li>' +
      '</ul>' +
      '<p class="jhint">동의하지 않으셔도 다른 기능은 그대로 쓰실 수 있습니다.</p>' +
    '</div>';
  }

  function openForm(){
    var sb = subs().map(function(it){
      return '<option value="' + esc(it.key) + '">' + esc(it.name) + '</option>';
    }).join("");
    var rg = regs().map(function(r){
      return '<option value="' + esc(r.key) + '">' + esc(r.name) + '</option>';
    }).join("");
    return '<h3 class="jbox-h">구합니다 글 올리기</h3>' +
      '<form id="wtf" class="jform">' +
      '<div class="jrow jrow-full">' +
        '<label for="w-title">제목 <b>*</b></label>' +
        '<input id="w-title" name="title" required minlength="2" maxlength="60" ' +
        'placeholder="보기: 주말 오전에 레슨 받을 곳 찾습니다"></div>' +
      '<div class="jrow"><label for="w-rg">지역 <b>*</b></label>' +
        '<select id="w-rg" name="region" required>' +
        '<option value="">고르세요</option>' + rg + '</select></div>' +
      /* ⚠️ 하위는 **고르셔도 되고 안 고르셔도 됩니다** — 모르는 것을
         고르게 하면 틀린 하위가 쌓이고, 그러면 업체가 못 찾습니다. */
      '<div class="jrow"><label for="w-sub">무엇을 찾으시나요</label>' +
        '<select id="w-sub" name="sub">' +
        '<option value="">아직 모르겠습니다</option>' + sb + '</select></div>' +
      /* ⚠️⚠️ **예산을 필수로 두지 않습니다** — 강요하면 지어내서
         적습니다 (작업 기억의 그 줄). */
      '<div class="jrow"><label for="w-bud">예산 (원)</label>' +
        '<input id="w-bud" name="budget" type="number" min="0" ' +
        'max="100000000" placeholder="안 적으셔도 됩니다"></div>' +
      '<div class="jrow"><label for="w-when">언제 필요하신가요</label>' +
        '<input id="w-when" name="when_txt" maxlength="60" ' +
        'placeholder="보기: 주말 오전 · 12월 중순"></div>' +
      '<div class="jrow jrow-full">' +
        '<label for="w-body">내용 <b>*</b></label>' +
        '<textarea id="w-body" name="body" rows="4" required minlength="5" ' +
        'maxlength="2000" placeholder="어떤 것을 찾으시는지 적어 주세요."></textarea>' +
        /* ⚠️⚠️ **막을 수는 없습니다** — 막는다고 적지 않고, 적지
           마시라고 **그 자리에서** 말합니다 (게시판과 같습니다). */
        '<p class="jhint">⚠️ 전화번호 · 아이디 같은 연락처는 <b>적지 마세요.</b> ' +
        '이 글은 <b>누구나 봅니다.</b> 연락처는 아래에 따로 적어 주시고, ' +
        '답을 받아들이신 뒤 <b>직접 고르셨을 때만</b> 그 한 분에게 보입니다.</p>' +
      '</div>' +
      '<div class="jrow"><label for="w-ct">연락처 <b>*</b></label>' +
        '<input id="w-ct" name="contact" required maxlength="100" ' +
        'placeholder="전화번호 또는 메신저 아이디"></div>' +
      consentBox() +
      '<div class="jrow jrow-full">' +
        '<button type="submit" class="btn btn-pri">올리기</button>' +
        '<p class="jmsg" id="wtmsg" role="status"></p></div>' +
    '</form>';
  }

  function replyForm(id){
    /* ⚠️⚠️ **업체 이름으로 답하는 것은 고르는 것입니다** — 이어진
       업체가 없으면 그 칸을 **아예 안 냅니다** (그리면 눌러도 거절되는
       칸입니다 · 절대 규칙 5). */
    var proRow = PRO
      ? '<div class="jrow jrow-full">' +
          '<label class="jchk"><input type="checkbox" id="w-pro" checked> ' +
          '<span>업체 이름으로 답합니다</span></label>' +
          '<p class="jhint">업체 이름으로 답하시면 올리신 분에게 ' +
          '<b>상호</b>가 보입니다. 끄시면 개인으로 답하시는 것이고 ' +
          '가린 성함만 보입니다.</p>' +
        '</div>'
      : '';
    return '<h3 class="jbox-h">답하기</h3>' +
      '<form id="wrf" class="jform" data-id="' + esc(id) + '">' +
      '<div class="jrow jrow-full">' +
        '<label for="w-rbody">무엇을 해 드릴 수 있나요 <b>*</b></label>' +
        '<textarea id="w-rbody" name="body" rows="3" required minlength="5" ' +
        'maxlength="500" placeholder="어떻게 도와드릴 수 있는지 적어 주세요."></textarea>' +
        '<p class="jhint">⚠️ 연락처는 <b>여기 적지 마세요.</b> 아래 칸에 ' +
        '따로 적어 주시면, 올리신 분이 받아들이고 <b>서로 직접 고르셨을 ' +
        '때만</b> 보입니다.</p>' +
      '</div>' +
      proRow +
      '<div class="jrow"><label for="w-rct">연락처 <b>*</b></label>' +
        '<input id="w-rct" name="contact" required maxlength="100" ' +
        'placeholder="전화번호 또는 메신저 아이디"></div>' +
      consentBox() +
      '<div class="jrow jrow-full">' +
        '<button type="submit" class="btn btn-pri">답 보내기</button> ' +
        '<button type="button" class="btn btn-bad wrf-x">그만두기</button>' +
        '<p class="jmsg" id="wrmsg" role="status"></p></div>' +
    '</form>';
  }

  /* ── 누름 ────────────────────────────────────────────────────────── */
  function say(el, m){ if(el) el.textContent = String(m || ""); }

  function bindOpen(){
    var f = document.getElementById("wtf");
    if(!f) return;
    f.addEventListener("submit", function(e){
      e.preventDefault();
      var msg = document.getElementById("wtmsg");
      var v = function(n){
        var el = f.querySelector('[name="' + n + '"]');
        return el ? (el.value || "").trim() : "";
      };
      var ck = f.querySelector('.jconsent input[type="checkbox"]');
      if(!ck || !ck.checked){ say(msg, "동의에 체크해 주세요."); return; }
      say(msg, "올리는 중입니다…");
      call("open_wanted", {
        cat: CAT, sub: v("sub") || null, region: v("region"),
        title: v("title"), body: v("body"),
        /* ⚠️⚠️ **0 을 0 으로 보냅니다** — 빈 글자는 "안 적음" 이고
           0 은 "무료로 해 주실 분" 이라 뜻이 다릅니다. `||` 를 쓰면
           0 이 사라집니다 (작업 기억의 그 자리). */
        budget: v("budget") === "" ? null : v("budget"),
        when_txt: v("when_txt") || null,
        contact: v("contact"),
        agree_at: new Date().toISOString()
      }).then(function(){
        if(box) box.innerHTML = "";
        say(msg, "");
        return reload();
      }).catch(function(err){
        say(msg, String((err && err.message) || "올리지 못했습니다."));
      });
    });
  }

  function bindReply(){
    var f = document.getElementById("wrf");
    if(!f) return;
    var x = f.querySelector(".wrf-x");
    if(x) x.addEventListener("click", function(){ if(box) box.innerHTML = ""; });
    f.addEventListener("submit", function(e){
      e.preventDefault();
      var msg = document.getElementById("wrmsg");
      var v = function(n){
        var el = f.querySelector('[name="' + n + '"]');
        return el ? (el.value || "").trim() : "";
      };
      var ck = f.querySelector('.jconsent input[type="checkbox"]');
      if(!ck || !ck.checked){ say(msg, "동의에 체크해 주세요."); return; }
      var pro = document.getElementById("w-pro");
      say(msg, "보내는 중입니다…");
      call("reply_wanted", {
        w_id: f.getAttribute("data-id"),
        body: v("body"), contact: v("contact"),
        /* ⚠️ 이어진 업체가 없으면 칸 자체가 없으므로 null 입니다 */
        as_pro: (pro && pro.checked && PRO) ? PRO : null,
        agree_at: new Date().toISOString()
      }).then(function(){
        if(box) box.innerHTML =
          '<p class="jafh">답을 보냈습니다. 올리신 분이 받아들이면 ' +
          '<b>내 정보</b> 화면에서 연락처를 여실 수 있습니다.</p>' +
          '<p class="wtc-go"><a class="btn btn-line" href="/my">내 정보로 가기</a></p>';
        return reload();
      }).catch(function(err){
        say(msg, String((err && err.message) || "보내지 못했습니다."));
      });
    });
  }

  list.addEventListener("click", function(e){
    var t = e.target;
    if(!t || !t.closest) return;

    var go = t.closest(".wt-go");
    if(go){
      /* ⚠️ 로그인 안 하신 분께는 **로그인 길**을 냅니다 — 양식을 열어
         두고 거절하면 적으신 글이 날아갑니다 (절대 규칙 5). */
      if(!SIGNED){
        if(box) box.innerHTML =
          '<p class="jafh">답하시려면 로그인이 필요합니다. ' +
          '누가 답했는지 알아야 올리신 분이 받아들일 수 있습니다.</p>' +
          '<p class="wtc-go"><a class="btn btn-pri" href="' + loginUrl() +
          '">로그인</a></p>';
        return;
      }
      if(box){ box.innerHTML = replyForm(go.getAttribute("data-id")); bindReply(); }
      return;
    }

    var rep = t.closest(".wt-rep");
    if(rep){
      if(!SIGNED){
        if(box) box.innerHTML =
          '<p class="jafh">신고는 로그인한 뒤에 하실 수 있습니다.</p>' +
          '<p class="wtc-go"><a class="btn btn-pri" href="' + loginUrl() +
          '">로그인</a></p>';
        return;
      }
      var why = window.prompt("무슨 일이 있었는지 적어 주세요 (다섯 글자 이상)");
      if(why === null) return;
      call("open_report", { kind:"abuse", wanted: rep.getAttribute("data-id"),
                            body: String(why || "") })
        .then(function(){ window.alert("접수했습니다. 운영자가 확인합니다."); })
        .catch(function(err){
          window.alert(String((err && err.message) || "신고하지 못했습니다."));
        });
      return;
    }
  });

  /* ⚠️⚠️ **로그인 뒤 돌아올 자리를 잃지 않습니다.** 맨 `/login` 으로
     보내면 로그인한 뒤 `/my` 로 떨어져서, 글을 올리려던 분이 이 화면을
     다시 찾아와야 합니다 (`js/listing.js` 가 쓰는 `amLoginUrl()` 과
     **같은 함수**를 씁니다 — 규칙이 두 곳이 되지 않게). */
  function loginUrl(){
    var here = window.location.pathname + window.location.search;
    return esc(window.amLoginUrl ? window.amLoginUrl(here) : "/login");
  }
  /* 로그인 전 안내 — ⚠️ 누르기 **전에도** 보여 줍니다. 누른 뒤에야
     말하면 손님은 그 단추가 무엇인지 모르고 누르고, 거절을 받습니다. */
  function needLogin(){
    return '<p class="jafh">글을 올리시려면 로그인이 필요합니다. ' +
      '올리신 글을 나중에 고치거나 내리시려면 누가 올렸는지 알아야 합니다.</p>' +
      '<p class="wtc-go"><a class="btn btn-pri" href="' + loginUrl() +
      '">로그인</a></p>';
  }

  var newBtn = document.getElementById("wtnew");
  if(newBtn) newBtn.addEventListener("click", function(){
    if(!SIGNED){
      if(box) box.innerHTML = needLogin();
      return;
    }
    /* ⚠️⚠️ **보유 기간이 비면 양식을 안 엽니다** — 법이 보여 주라는
       것을 안 보여 주고 동의를 받을 수는 없습니다 (제15조 제2항).
       무엇을 설정해야 하는지는 **운영자에게만** 말합니다 (절대 규칙 3). */
    if(!KEEP){
      try{ console.warn("[wanted] js/data/site.js 의 wantedKeep(보유 기간)이 " +
        "비어 구합니다 양식을 열지 않았습니다 — 개인정보보호법 제15조 제2항."); }catch(e){}
      if(box) box.innerHTML =
        '<p class="jafh">지금은 글을 올리실 수 없습니다. ' +
        '준비가 끝나면 이 자리에서 바로 올리실 수 있습니다.</p>' +
        '<p class="wtc-go"><a class="btn btn-pt" href="/help">고객센터</a></p>';
      return;
    }
    if(box){ box.innerHTML = openForm(); bindOpen(); }
  });

  window.amAuthAsk().then(function(a){
    if(!a || !a.on){
      try{ console.warn("[wanted] 로그인 · 접수가 설정되지 않아 구합니다를 " +
        "열지 않았습니다 (Vercel 의 SUPABASE_URL · SUPABASE_ANON_KEY)."); }catch(e){}
      /* ⚠️ 빌드가 찍어 둔 "아직 없습니다" 를 그대로 두면 0건이라고
         말하는 것입니다 — 열지 않았다고 적습니다. */
      if(window.amShut) window.amShut("wtlist");
      return;
    }
    A = a;
    SIGNED = !!a.signedIn;
    /* ⚠️ 주소로 좁혀 오신 길을 **첫 그림 전에** 읽습니다 (현황표의 칸) */
    readUrl();
    /* ⚠️ 로그인 안 하신 분께는 **누르기 전에** 로그인 길을 냅니다 */
    if(!SIGNED && box) box.innerHTML = needLogin();
    /* ⚠️ 업체 역할일 때만 상호로 답할 수 있습니다 */
    PRO = (a.role === "provider" && a.provider) ? a.provider : null;
    return reload();
  }).catch(function(){});
})();
