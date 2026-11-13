/* ════════════════════════════════════════════════════════════════════
   골프 레슨 — 거르개 · 정렬 (2026-11-10 · 레슨 지시서 §4 · §6)

   ⚠️⚠️⚠️ **카드를 여기서 다시 적지 않습니다.** 빌드가 찍은 카드와
   거른 뒤 다시 그린 카드가 다르면 손님이 거르개를 누르는 순간 카드가
   조용히 달라지고(크롤러가 읽는 글과도 달라집니다), **그려진 화면만
   보는 검사는 영원히 통과**합니다. 둘 다 `js/card.js` 의
   `amLessonCard()` 를 부릅니다.

   ⚠️⚠️ **거르개는 양식(form)입니다 — 단추가 아닙니다.** 자바스크립트가
   꺼진 분에게도 GET 으로 그대로 돕니다. 여기서는 그 눌림을 **가로채서**
   주소만 바꾸고(`pushState`) 목록을 갈아 끼웁니다 — 그래야 주소를 복사해
   보내도 같은 화면이고 뒤로 가기도 됩니다.

   ⚠️⚠️ **눌림은 감싼 자리 한 곳**에서 받습니다 — 카드 · 칩 · 카테고리
   카드가 다시 그려질 때마다 묶으면 같은 손놀림에 호출이 여러 번 돕니다
   (`js/listing.js` 가 적어 둔 그 규칙).

   ⚠️ 거르는 자료는 **빌드가 실어 준 것**입니다(`AM_PROVIDERS`) — 레슨
   프로는 승인된 업체라 아무 때나 늘지 않고, 늘면 다시 배포합니다.
   그래서 서버에 다시 묻지 않습니다(중고 매물과 다른 자리입니다).
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var W = window, d = document;
  var list = d.getElementById("lsnlist");
  var form = d.getElementById("lsnform");
  if(!list || !form) return;
  var cnt  = d.getElementById("lsncnt");
  var sec  = form.closest ? form.closest(".lsn-find") : null;
  var wrap = d.querySelector(".lsn-sec");
  var esc  = W.esc;

  /* 지금 걸린 조건 — ⚠️ **주소가 참값**입니다. 화면이 따로 들고 있으면
     뒤로 가기 · 주소 복사에서 둘이 어긋납니다. */
  function now(){
    var u = new URLSearchParams(W.location.search);
    return { rg: u.get("rg") || "", sub: u.get("sub") || "",
             p: u.get("p") || "", g: u.get("g") || "", q: (u.get("q") || "").trim(),
             o: u.get("o") || "name",
             /* ⚠️ 보기(격자 · 목록)는 **좁히는 조건이 아닙니다** — 칩에도
                안 넣고 「필터 초기화」로도 안 지웁니다(0068 의 정렬과 같은 결). */
             v: (u.get("v") === "list") ? "list" : "" };
  }
  function urlOf(f){
    var u = new URLSearchParams();
    if(f.rg)  u.set("rg", f.rg);
    if(f.sub) u.set("sub", f.sub);
    if(f.p)   u.set("p", f.p);
    if(f.g)   u.set("g", f.g);
    if(f.q)   u.set("q", f.q);
    if(f.o && f.o !== "name") u.set("o", f.o);
    if(f.v)   u.set("v", f.v);
    var s = u.toString();
    return "/cat/lesson" + (s ? "?" + s : "");
  }

  /* 고른 조건의 **사람이 읽는 이름** — ⚠️ 못 찾으면 그 칩을 **안 냅니다**
     (키를 날것으로 찍지 않습니다 · 지시 6번). */
  function nameOf(k, v){
    if(!v) return "";
    if(k === "rg")  return W.amRegion ? (W.amRegion(v) || {}).name || "" : "";
    if(k === "sub"){
      /* ⚠️ `amSub()` 는 **하위 키 하나**를 받습니다(분류를 같이 넘기지
         않습니다) — 잘못 부르면 **칩이 조용히 안 그려집니다**(에러 0줄). */
      var s = W.amSub ? W.amSub(v) : null;
      return (s && s.item && s.item.name) || "";
    }
    if(k === "p"){
      var b = (W.AM_LESSON_PRICE || []).filter(function(x){ return x.key === v; })[0];
      return b ? b.name : "";
    }
    if(k === "g") return W.amLessonGoalName ? (W.amLessonGoalName(v) || "") : "";
    if(k === "q") return v;
    return "";
  }
  var CHIPKEYS = ["sub", "g", "p", "rg", "q"];
  /* ⚠️ 글 덩이를 **이름 있는 함수**로 꺼냅니다 — 삼항으로 innerHTML 에
     바로 넣으면 `check-safe` 가 "따라갈 함수 이름이 없는 줄" 로 잡습니다. */
  function chipHtml(f){
    var on = CHIPKEYS.filter(function(k){ return f[k]; });
    if(!on.length) return "";
    return '<span class="lsn-chips-t">선택된 조건</span>' +
      on.map(function(k){
        var nm = nameOf(k, f[k]);
        if(!nm) return "";
        var g = {}; CHIPKEYS.forEach(function(x){ g[x] = f[x]; });
        g[k] = "";
        g.o = f.o; g.v = f.v;
        return '<a class="lsn-chip" data-off="' + esc(k) + '" href="' +
          esc(urlOf(g)) + '">' + esc(nm) +
          '<i aria-hidden="true">' + (W.icon ? W.icon("close", 13) : "") + '</i>' +
          '<span class="sr">조건 지우기</span></a>';
      }).join("") +
      '<a class="lsn-chip-all" href="' + esc(urlOf({ o:f.o, v:f.v })) + '">' +
        '전체 해제</a>';
  }

  /* 고르개를 지금 조건에 맞춥니다 — ⚠️ 안 맞추면 주소로 들어오신 분께
     "전체" 라고 적힌 칸 아래 좁혀진 목록이 나옵니다. */
  function fill(f){
    var set = function(id, v){ var e = d.getElementById(id); if(e) e.value = v; };
    set("lsn-q", f.q); set("lsn-o", f.o);
    /* ⚠️⚠️ 레일 넷은 **네모 칸(radio)** 입니다(확정 시안 ④) — `value` 로
       맞출 수가 없으므로 **이름으로 묶어** 그 값의 칸을 켭니다. 모르는 값이
       실려 오면 「전체」가 켜집니다(빈 채로 두면 아무 칸도 안 켜져 손님이
       지금 무엇으로 보고 계신지 알 길이 없습니다). */
    ["rg", "sub", "p", "g"].forEach(function(k){
      var L = d.querySelectorAll('.lsn-rail input[name="' + k + '"]');
      var hit = false;
      Array.prototype.forEach.call(L, function(e){
        e.checked = (e.value === (f[k] || ""));
        if(e.checked) hit = true;
      });
      if(!hit && L.length) L[0].checked = true;
    });
    var box = d.getElementById("lsnchips");
    if(box){
      var h = chipHtml(f);
      box.innerHTML = h;
      if(h) box.removeAttribute("hidden");
      else  box.setAttribute("hidden", "");
    }
    Array.prototype.forEach.call(d.querySelectorAll(".lsn-vb"), function(a){
      var on = ((a.getAttribute("data-view") || "") === f.v);
      a.classList.toggle("on", on);
      if(on) a.setAttribute("aria-current", "true");
      else   a.removeAttribute("aria-current");
    });
    /* ⚠️ 목록 보기는 **클래스 한 줄**입니다 — 카드를 다시 적지 않습니다
       (두 벌로 적으면 한쪽만 고치는 날 둘이 달라집니다). */
    if(list) list.classList.toggle("is-list", f.v === "list");
  }

  function lessonSubsOf(p){
    return (W.amProviderSubs ? W.amProviderSubs(p) : []).filter(function(k){
      var s = W.amSub ? W.amSub(k) : null;
      return s && s.cat && s.cat.key === "lesson";
    });
  }

  /* 찾는 말 — ⚠️ 이름 · 소개 · **지역 이름** · **레슨 종류 이름**까지
     봅니다(시안이 "프로 이름, 연습장, 전문 분야, 지역" 이라고 적었습니다).
     키가 아니라 **사람이 읽는 이름**으로 찾습니다 — 손님은 `ls-solo` 를
     치지 않습니다. */
  function hay(p){
    var L = [p.name || "", p.intro || ""];
    (W.amProviderRegions ? W.amProviderRegions(p) : []).forEach(function(r){
      L.push(r);
    });
    ((p && Array.isArray(p.gu)) ? p.gu : []).forEach(function(g){ L.push(g); });
    lessonSubsOf(p).forEach(function(k){
      var s = W.amSub ? W.amSub(k) : null;
      if(s && s.item && s.item.name) L.push(s.item.name);
    });
    return L.join(" ").toLowerCase();
  }

  function pick(f){
    var all = (W.amProvidersOf ? W.amProvidersOf("lesson") : []);
    var band = f.p && W.amLessonPrice ? W.amLessonPrice(f.p) : null;
    return all.filter(function(p){
      if(f.rg){
        var R = (p && Array.isArray(p.regions)) ? p.regions : [];
        if(R.indexOf(f.rg) < 0) return false;
      }
      if(f.sub && lessonSubsOf(p).indexOf(f.sub) < 0) return false;
      /* ⚠️⚠️ 0071 — 레슨 목적. **안 고르신 프로는 빠집니다** —
         모르는 것을 아무 목적에나 넣으면 지어낸 것입니다(절대 규칙 1).
         가격대와 같은 결이고, 화면이 그 사실을 그 자리에서 적습니다. */
      if(f.g){
        var G = (p && Array.isArray(p.lesson_goals)) ? p.lesson_goals : [];
        if(G.indexOf(f.g) < 0) return false;
      }
      if(band){
        /* ⚠️⚠️ 값을 **안 올리신 프로는 빠집니다** — 모르는 값을 아무
           가격대에나 넣으면 그건 지어낸 값입니다(절대 규칙 1). 화면이
           그 사실을 그 자리에서 적습니다. */
        var low = W.amLessonLow ? W.amLessonLow(p) : null;
        if(!low) return false;
        if(band.gte !== null && low.amount < band.gte) return false;
        if(band.lt  !== null && low.amount >= band.lt) return false;
      }
      if(f.q && hay(p).indexOf(f.q.toLowerCase()) < 0) return false;
      return true;
    });
  }

  /* ⚠️ 값 · 평점이 없는 분은 **뒤로** 보냅니다(섞어 두면 "싼 순" 맨 위가
     값을 모르는 분이 됩니다). 없는 것끼리는 가나다순입니다. */
  function sortBy(L, o){
    var nm = function(a, b){
      return String(a.name || "").localeCompare(String(b.name || ""), "ko");
    };
    var low = function(p){
      var x = W.amLessonLow ? W.amLessonLow(p) : null;
      return x ? x.amount : null;
    };
    var rate = function(p){
      var r = W.amRating ? W.amRating(p.id) : null;
      return r ? r.avg : null;
    };
    var num = function(get, dir){
      return function(a, b){
        var x = get(a), y = get(b);
        if(x === null && y === null) return nm(a, b);
        if(x === null) return 1;
        if(y === null) return -1;
        return x === y ? nm(a, b) : (x < y ? -dir : dir);
      };
    };
    /* ⚠️ 등록된 날을 모르는 업체는 **뒤로** 갑니다(값 · 평점과 같은 규칙) */
    var newAt = function(p){ return W.amPvNewAt ? W.amPvNewAt(p) : null; };
    var C = { name: nm, low: num(low, 1), high: num(low, -1), rate: num(rate, -1) };
    C["new"] = num(newAt, -1);
    return L.slice().sort(C[o] || nm);
  }

  /* 조건에 맞는 분이 없을 때 — ⚠️ 조건을 지우는 길을 **그 자리에서** 냅니다 */
  function noneNarrow(){
    return '<div class="none"><h3>고르신 조건에 맞는 프로가 없습니다.</h3>' +
      '<p>조건을 조금 넓혀 보시거나, 맞춤 레슨 요청을 남기시면 ' +
      '조건에 맞는 프로를 찾아 이어 드립니다.</p>' +
      '<div class="none-b">' +
      '<a class="btn btn-line" href="/cat/lesson">조건 모두 지우기</a>' +
      '<a class="btn btn-pri" href="/match?cat=lesson">맞춤 레슨 요청</a>' +
      '</div></div>';
  }
  /* 아직 아무도 안 들어오셨을 때 (§13) — ⚠️ 지어낸 카드를 한 장도
     안 냅니다. 막다른 길로도 안 둡니다(입점 신청으로 보냅니다). */
  function noneEmpty(){
    return '<div class="none"><h3>현재 등록된 레슨 프로가 없습니다.</h3>' +
      '<p>골프 프로라면 지금 입점 신청해 주세요.</p>' +
      '<div class="none-b"><a class="btn btn-pri" href="/join">' +
      '프로 입점 신청</a></div></div>';
  }

  function paint(){
    var f = now();
    fill(f);
    var L = sortBy(pick(f), f.o);
    if(L.length){
      list.innerHTML = W.amLessonGrid ? W.amLessonGrid(L) : "";
    }else{
      /* ⚠️⚠️ **0건을 두 가지로 갈라 말합니다** — 아직 아무도 안 들어온
         것과, 조건에 맞는 분이 없는 것은 다릅니다(절대 규칙 2).
         ⚠️⚠️ 고르는 것과 찍는 것을 **갈라 둡니다** — 삼항으로 글 덩이
         둘 중 하나를 골라 innerHTML 에 바로 넣으면 `check-safe` 가
         "따라갈 함수 이름이 없는 줄" 로 잡습니다. 그 검사가 맞습니다:
         거기 손님 글이 한 자라도 들어오는 날 날것으로 나갑니다
         (0061 의 `noneNarrow()` · 0068 의 `doneHtml()` 과 같은 꼴). */
      var any = (W.amProvidersOf ? W.amProvidersOf("lesson") : []).length;
      list.innerHTML = any ? noneNarrow() : noneEmpty();
    }
    if(cnt) cnt.textContent = "프로 " +
      (W.won ? W.won(L.length) : String(L.length)) + "명";
  }

  function go(f, push){
    var u = urlOf(f);
    if(push){ try{ history.pushState({ lsn:1 }, "", u); }catch(e){} }
    paint();
    /* ⚠️ 목록 머리로 올립니다 — 안 올리면 거르개를 누른 자리에 그대로
       있어 "아무 일도 안 일어났다" 로 보입니다. */
    if(wrap && wrap.scrollIntoView)
      try{ wrap.scrollIntoView({ block:"start" }); }catch(e){}
  }

  /* ⚠️⚠️ 레일은 네모 칸(radio)이라 **켜진 것**을 읽습니다 — 없으면 빈
     글자(= 전체)입니다. 보기(`v`)는 양식에 없으므로 **주소에서** 그대로
     들고 옵니다(안 들고 오면 거르개를 누를 때마다 격자로 되돌아갑니다). */
  function pickedOf(name){
    var e = d.querySelector('.lsn-rail input[name="' + name + '"]:checked');
    return e ? (e.value || "") : "";
  }
  function fromForm(){
    var v = function(id){ var e = d.getElementById(id); return e ? e.value : ""; };
    return { rg:pickedOf("rg"), sub:pickedOf("sub"),
             p:pickedOf("p"), g:pickedOf("g"),
             q:(v("lsn-q") || "").trim(), o:v("lsn-o") || "name",
             v:now().v };
  }

  form.addEventListener("submit", function(e){
    e.preventDefault();
    go(fromForm(), true);
  });
  /* 고르개는 바꾸는 즉시 — ⚠️ 찾는 칸(`input[type=search]`)은 **안
     받습니다**(글자를 칠 때마다 다시 그리면 커서가 튕겨 나갑니다 · 0068).
     ⚠️⚠️ 레일의 칸들은 `form="lsnform"` 으로 묶여 있을 뿐 **양식의 자손이
     아니라서** 양식에서는 `change` 를 받을 수 없습니다 — 문서에서 받고
     이름으로 가립니다. */
  var WATCH = { rg:1, sub:1, p:1, g:1, o:1 };
  d.addEventListener("change", function(e){
    var t = e.target;
    if(!t || !t.name || !WATCH[t.name]) return;
    if(t.tagName === "INPUT" && t.type === "search") return;
    go(fromForm(), true);
  });

  /* 칩 · 카테고리 카드 · 「전체 해제」 · 보기 토글 — ⚠️ 전부 **링크**이고
     여기서 가로채기만 합니다(자바스크립트가 꺼져 있으면 그대로 이동). */
  d.addEventListener("click", function(e){
    var a = e.target.closest ? e.target.closest("a") : null;
    if(!a) return;
    var href = a.getAttribute("href") || "";
    if(href.indexOf("/cat/lesson") !== 0) return;
    if(e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault();
    var f = now();
    var off = a.getAttribute("data-off");
    var view = a.getAttribute("data-view");
    if(off){
      /* ⚠️ 칩은 **그 조건만** 지웁니다 — 주소에 그 열쇠가 **없는 것**이
         지우라는 뜻이라, 있는 열쇠만 덮어쓰면 아무것도 안 지워집니다. */
      f[off] = "";
    } else if(view !== null){
      f.v = (view === "list") ? "list" : "";
    } else if(a.classList.contains("lsn-chip-all")){
      /* ⚠️ 정렬 · 보기는 **좁히는 조건이 아니라** 남깁니다. */
      f = { rg:"", sub:"", p:"", g:"", q:"", o:f.o, v:f.v };
    } else {
      var u = new URL(href, W.location.origin);
      var q = new URLSearchParams(u.search);
      if(!q.toString()) f = { rg:"", sub:"", p:"", g:"", q:"", o:f.o, v:f.v };
      ["rg", "sub", "p", "g", "q", "o"].forEach(function(k){
        if(q.has(k)) f[k] = q.get(k) || "";
      });
      if(q.has("v")) f.v = (q.get("v") === "list") ? "list" : "";
    }
    go(f, true);
  });

  /* ⚠️⚠️ 뒤로 가기를 받습니다 — `pushState` 로 주소를 바꾸므로, 이 줄이
     없으면 주소만 바뀌고 **목록이 그대로** 있습니다. */
  W.addEventListener("popstate", function(){ paint(); });

  /* 주소에 조건이 실려 들어오셨으면 그 자리에서 한 번 그립니다.
     ⚠️ 조건이 없으면 **다시 안 그립니다** — 빌드가 찍은 것과 같은 목록이고,
     괜히 다시 그리면 자바스크립트가 꺼진 분과 켜진 분이 다른 HTML 을
     보게 됩니다(그리고 그만큼 느려집니다). */
  (function(){
    var f = now();
    if(f.rg || f.sub || f.p || f.g || f.q || f.v || (f.o && f.o !== "name")) paint();
    else fill(f);
  })();
})();
