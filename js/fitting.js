/* ════════════════════════════════════════════════════════════════════
   피팅 · 수리 — 탭 · 거르개 · 찾기 (확정 시안 ⑦)

   ⚠️⚠️⚠️ **카드를 여기서 다시 적지 않습니다.** 빌드가 찍은 카드와 거른
   뒤 다시 그린 카드가 다르면 손님이 거르개를 누르는 순간 카드가 조용히
   달라지고(크롤러가 읽는 글과도 달라집니다), **그려진 화면만 보는 검사는
   영원히 통과**합니다. 둘 다 `js/card.js` 의 `amFitGrid()` 를 부릅니다.

   ⚠️⚠️ **거르개는 양식(form)입니다 — 단추가 아닙니다.** 자바스크립트가
   꺼진 분에게도 GET 으로 그대로 돕니다. 여기서는 그 눌림을 **가로채서**
   주소만 바꾸고(`pushState`) 목록을 갈아 끼웁니다. 서비스 종류 탭도
   **링크**입니다(`/cat/fitting?sub=ft-grip`).

   ⚠️ 거르는 자료는 **빌드가 실어 준 것**입니다(`AM_PROVIDERS`) — 피팅은
   승인된 업체라 아무 때나 늘지 않고, 늘면 다시 배포합니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var W = window, d = document;
  var list = d.getElementById("fitlist");
  var form = d.getElementById("fitform");
  if(!list || !form) return;
  var cnt  = d.getElementById("fitcnt");
  var wrap = d.querySelector(".fit-sec");

  function now(){
    var u = new URLSearchParams(W.location.search);
    return { sub:u.get("sub") || "", rg:u.get("rg") || "", w:u.get("w") || "",
             p:u.get("p") || "", o:u.get("o") || "",
             q:(u.get("q") || "").trim() };
  }
  function urlOf(f){
    var u = new URLSearchParams();
    ["sub", "rg", "w", "p", "o", "q"].forEach(function(k){
      if(f[k]) u.set(k, f[k]);
    });
    var s = u.toString();
    return "/cat/fitting" + (s ? "?" + s : "");
  }
  /* 고르개 · 탭을 지금 조건에 맞춥니다 — ⚠️ 안 맞추면 주소로 들어오신
     분께 「전체」라고 적힌 칸 아래 좁혀진 목록이 나옵니다. */
  function fill(f){
    var set = function(id, v){ var e = d.getElementById(id); if(e) e.value = v; };
    set("fit-rg", f.rg); set("fit-w", f.w); set("fit-p", f.p);
    set("fit-o", f.o);   set("fit-q", f.q);
    Array.prototype.forEach.call(d.querySelectorAll(".fit-tab a"), function(a){
      var on = (a.getAttribute("data-sub") || "") === f.sub;
      a.classList.toggle("on", on);
      if(on) a.setAttribute("aria-current", "true");
      else   a.removeAttribute("aria-current");
    });
  }

  /* 찾는 말 — ⚠️ 이름 · 소개 · **지역 이름 · 하는 일 이름**까지 봅니다
     (시안이 「업체명 또는 서비스(예: 그립 교체)로 검색」 이라고 적었습니다).
     키가 아니라 **사람이 읽는 이름**으로 찾습니다 — 손님은 `ft-grip` 을
     치지 않습니다. */
  function subNames(p){
    var c = W.amCat ? W.amCat("fitting") : null;
    var I = (c && W.amCatItems) ? W.amCatItems(c) : [];
    var S = (p && Array.isArray(p.subs)) ? p.subs : [];
    return I.filter(function(i){ return S.indexOf(i.key) >= 0; })
            .map(function(i){ return i.name; });
  }
  function hay(p){
    var L = [p.name || "", p.intro || ""];
    (W.amProviderRegions ? W.amProviderRegions(p) : []).forEach(function(r){
      L.push(r);
    });
    ((p && Array.isArray(p.gu)) ? p.gu : []).forEach(function(g){ L.push(g); });
    subNames(p).forEach(function(n){ L.push(n); });
    (W.amFitWaysOf ? W.amFitWaysOf(p) : []).forEach(function(n){ L.push(n); });
    return L.join(" ").toLowerCase();
  }

  function pick(f){
    var all  = (W.amProvidersOf ? W.amProvidersOf("fitting") : []);
    var band = f.p && W.amFitPrice ? W.amFitPrice(f.p) : null;
    return all.filter(function(p){
      if(f.sub){
        var S = (p && Array.isArray(p.subs)) ? p.subs : [];
        if(S.indexOf(f.sub) < 0) return false;
      }
      if(f.rg){
        var R = (p && Array.isArray(p.regions)) ? p.regions : [];
        if(R.indexOf(f.rg) < 0) return false;
      }
      /* ⚠️⚠️ 이용 방식을 **안 고르신 업체는 빠집니다** — 모르는 것을 아무
         칸에나 넣으면 지어낸 값입니다(절대 규칙 1). 화면이 그 사실을
         0건 안내에서 말합니다. */
      if(f.w && !(W.amFitHasWay ? W.amFitHasWay(p, f.w) : false)) return false;
      if(band){
        /* ⚠️⚠️ 값을 **안 올리신 업체는 빠집니다** — 같은 까닭입니다. */
        var low = W.amFitLow ? W.amFitLow(p) : null;
        if(!low) return false;
        if(band.gte !== null && low.amount < band.gte) return false;
        if(band.lt  !== null && low.amount >= band.lt) return false;
      }
      if(f.q && hay(p).indexOf(f.q.toLowerCase()) < 0) return false;
      return true;
    });
  }

  /* 차례 — ⚠️⚠️ 시안의 「추천순」은 **안 만듭니다.** 무엇이 추천인지
     세어 본 적이 없고, 세는 자료도 없습니다(조회도 · 거래 건수도 안
     셉니다). 지어낸 차례를 「추천」이라고 적으면 절대 규칙 1 입니다.
     ⚠️ 대신 **셀 수 있는 넷**만 냅니다 — 값이 없는 분은 **뒤로** 밀고
     그 안에서는 가나다순입니다(없는 값을 0 으로 치면 가장 싼 곳이
     됩니다). */
  function sortBy(L, o){
    var nm = function(a, b){
      return String(a.name || "").localeCompare(String(b.name || ""), "ko");
    };
    var low = function(p){
      var x = W.amFitLow ? W.amFitLow(p) : null;
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
    var C = { name:nm, low:num(low, 1), high:num(low, -1), rate:num(rate, -1) };
    return L.slice().sort(C[o] || nm);
  }

  /* ⚠️⚠️ **0건을 두 가지로 갈라 말합니다** — 아직 아무도 안 들어온 것과,
     조건에 맞는 곳이 없는 것은 다릅니다(절대 규칙 2).
     ⚠️ 고르는 것과 찍는 것을 **갈라 둡니다** — 삼항으로 글 덩이 둘 중
     하나를 innerHTML 에 바로 넣으면 `check-safe` 가 "따라갈 함수 이름이
     없는 줄" 로 잡습니다(그 검사가 맞습니다). */
  function noneNarrow(){
    return '<div class="none"><h3>고르신 조건에 맞는 업체가 없습니다.</h3>' +
      '<p>조건을 조금 넓혀 보시거나, 클럽 상태를 적어 상담 요청을 ' +
      '남기시면 맞는 업체를 찾아 이어 드립니다. ' +
      '이용 방식 · 공임을 아직 안 올리신 곳은 그 조건으로 좁히면 빠집니다.</p>' +
      '<div class="none-b">' +
      '<a class="btn btn-line" href="/cat/fitting">조건 모두 지우기</a>' +
      '<a class="btn btn-pri" href="/match?cat=fitting">상담 요청하기</a>' +
      '</div></div>';
  }
  function noneEmpty(){
    return '<div class="none fit-none">' +
      '<p class="fit-none-i">' + (W.icon ? W.icon("clubs", 34) : "") + '</p>' +
      '<h3>등록된 피팅 · 수리 업체가 없습니다</h3>' +
      '<p>내 업체를 등록하거나, 원하는 상담 조건을 남겨보세요.</p>' +
      '<div class="none-b">' +
      '<a class="btn btn-pri" href="/join">업체 등록 신청</a>' +
      '<a class="btn btn-line" href="/match?cat=fitting">상담 조건 남기기</a>' +
      '</div></div>';
  }

  function paint(){
    var f = now();
    fill(f);
    var L = sortBy(pick(f), f.o);
    if(L.length){
      list.innerHTML = W.amFitGrid ? W.amFitGrid(L) : "";
    }else{
      var any = (W.amProvidersOf ? W.amProvidersOf("fitting") : []).length;
      list.innerHTML = any ? noneNarrow() : noneEmpty();
    }
    if(cnt) cnt.textContent = (W.won ? W.won(L.length) : String(L.length)) + "곳";
  }

  function go(f, push){
    var u = urlOf(f);
    if(push){ try{ history.pushState({ fit:1 }, "", u); }catch(e){} }
    paint();
    /* ⚠️ 목록 머리로 올립니다 — 안 올리면 거르개를 누른 자리에 그대로
       있어 "아무 일도 안 일어났다" 로 보입니다. */
    if(wrap && wrap.scrollIntoView)
      try{ wrap.scrollIntoView({ block:"start" }); }catch(e){}
  }
  function fromForm(){
    var v = function(id){ var e = d.getElementById(id); return e ? e.value : ""; };
    var f = now();
    return { sub:f.sub, rg:v("fit-rg"), w:v("fit-w"), p:v("fit-p"),
             o:v("fit-o"), q:(v("fit-q") || "").trim() };
  }

  form.addEventListener("submit", function(e){
    e.preventDefault();
    go(fromForm(), true);
  });
  /* 고르개는 바꾸는 즉시 — ⚠️ 찾는 칸(`input`)은 **안 받습니다**(글자를
     칠 때마다 다시 그리면 커서가 튕겨 나갑니다 · 0068 의 그 자리). */
  ["fit-rg", "fit-w", "fit-p", "fit-o"].forEach(function(id){
    var e = d.getElementById(id);
    if(e) e.addEventListener("change", function(){ go(fromForm(), true); });
  });

  /* 탭 · 「초기화」 · 「조건 모두 지우기」 — ⚠️ 전부 **링크**이고 여기서
     가로채기만 합니다(자바스크립트가 꺼져 있으면 그대로 이동).
     ⚠️ 눌림은 **감싼 자리 한 곳**에서 받습니다. */
  d.addEventListener("click", function(e){
    var a = e.target.closest ? e.target.closest("a") : null;
    if(!a) return;
    var href = a.getAttribute("href") || "";
    if(href.indexOf("/cat/fitting") !== 0) return;
    if(e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault();
    var u = new URL(href, W.location.origin);
    var q = new URLSearchParams(u.search);
    var f = q.toString() ? now() : { sub:"", rg:"", w:"", p:"", o:"", q:"" };
    ["sub", "rg", "w", "p", "o", "q"].forEach(function(k){
      if(q.has(k)) f[k] = q.get(k) || "";
    });
    /* 탭은 **하위만** 바꿉니다 — 눌린 것이 탭이면 `sub` 를 그 값으로
       (「전체」는 빈 글자) 둡니다. ⚠️ 다른 조건은 그대로 둡니다(지우면
       지역을 고른 분이 탭을 누를 때마다 처음으로 돌아갑니다). */
    if(a.hasAttribute("data-sub")) f.sub = a.getAttribute("data-sub") || "";
    go(f, true);
  });

  /* ⚠️⚠️ 뒤로 가기를 받습니다 — `pushState` 로 주소를 바꾸므로, 이 줄이
     없으면 주소만 바뀌고 **목록이 그대로** 있습니다. */
  W.addEventListener("popstate", function(){ paint(); });

  /* ⚠️⚠️⚠️ 머리의 단추 이름을 **버킷이 켜졌을 때만** 시안의 말로
     바꿉니다. 시안은 「클럽 사진으로 상담 요청」인데, `INTAKE_BUCKET`
     이 없으면 `/match` 에 **사진 칸이 아예 안 그려집니다**(js/photo.js) —
     그때 그 이름을 내면 없는 것을 있다고 말하는 꼴입니다(절대 규칙 5).
     ⚠️ 켜졌는지는 **서버만** 압니다. 그래서 빌드는 「상담 요청」으로
     찍고 여기서 올려 줍니다 — 못 읽으면 **그대로 둡니다**. */
  (function(){
    var b = d.getElementById("fit-cta");
    if(!b || !W.amPhotoReady) return;
    W.amPhotoReady().then(function(up){
      if(!up) return;
      var t = b.querySelector(".fit-cta-t");
      if(t) t.textContent = "클럽 사진으로 상담 요청";
    }, function(){});
  })();

  /* 주소에 조건이 실려 들어오셨으면 그 자리에서 한 번 그립니다.
     ⚠️ 조건이 없으면 **다시 안 그립니다** — 빌드가 찍은 것과 같은
     목록이고, 괜히 다시 그리면 자바스크립트가 꺼진 분과 켜진 분이 다른
     HTML 을 보게 됩니다. */
  (function(){
    var f = now();
    if(f.sub || f.rg || f.w || f.p || f.o || f.q) paint();
    else fill(f);
  })();
})();
