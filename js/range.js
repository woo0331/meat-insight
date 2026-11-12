/* ════════════════════════════════════════════════════════════════════
   골프 연습장 — 찾기 · 거르개 (확정 시안 ⑤)

   ⚠️⚠️⚠️ **카드를 여기서 다시 적지 않습니다.** 빌드가 찍은 카드와 거른
   뒤 다시 그린 카드가 다르면 손님이 거르개를 누르는 순간 카드가 조용히
   달라지고(크롤러가 읽는 글과도 달라집니다), **그려진 화면만 보는 검사는
   영원히 통과**합니다. 둘 다 `js/card.js` 의 `amRangeGrid()` 를 부릅니다.

   ⚠️⚠️ **거르개는 양식(form)입니다 — 단추가 아닙니다.** 자바스크립트가
   꺼진 분에게도 GET 으로 그대로 돕니다. 여기서는 그 눌림을 **가로채서**
   주소만 바꾸고(`pushState`) 목록을 갈아 끼웁니다.

   ⚠️ 거르는 자료는 **빌드가 실어 준 것**입니다(`AM_PROVIDERS`) — 연습장은
   승인된 업체라 아무 때나 늘지 않고, 늘면 다시 배포합니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var W = window, d = document;
  var list = d.getElementById("rnglist");
  var form = d.getElementById("rngform");
  if(!list || !form) return;
  var cnt  = d.getElementById("rngcnt");
  var wrap = d.querySelector(".rng-sec");

  function now(){
    var u = new URLSearchParams(W.location.search);
    return { rg:u.get("rg") || "", io:u.get("io") || "", sc:u.get("sc") || "",
             pk:u.get("pk") || "", p:u.get("p") || "",
             q:(u.get("q") || "").trim() };
  }
  function urlOf(f){
    var u = new URLSearchParams();
    ["rg", "io", "sc", "pk", "p", "q"].forEach(function(k){
      if(f[k]) u.set(k, f[k]);
    });
    var s = u.toString();
    return "/cat/range" + (s ? "?" + s : "");
  }
  /* 고르개를 지금 조건에 맞춥니다 — ⚠️ 안 맞추면 주소로 들어오신 분께
     「전체」라고 적힌 칸 아래 좁혀진 목록이 나옵니다. */
  function fill(f){
    var set = function(id, v){ var e = d.getElementById(id); if(e) e.value = v; };
    set("rng-rg", f.rg); set("rng-io", f.io); set("rng-sc", f.sc);
    set("rng-pk", f.pk); set("rng-p", f.p);   set("rng-q", f.q);
  }

  /* 찾는 말 — ⚠️ 이름 · 소개 · **지역 이름**까지 봅니다(시안이 「지역,
     연습장 이름으로 검색」 이라고 적었습니다). 키가 아니라 **사람이 읽는
     이름**으로 찾습니다 — 손님은 `seoul` 을 치지 않습니다. */
  function hay(p){
    var L = [p.name || "", p.intro || "", p.open_hours || ""];
    (W.amProviderRegions ? W.amProviderRegions(p) : []).forEach(function(r){
      L.push(r);
    });
    ((p && Array.isArray(p.gu)) ? p.gu : []).forEach(function(g){ L.push(g); });
    (W.amRangeOptsOf ? W.amRangeOptsOf(p) : []).forEach(function(n){ L.push(n); });
    return L.join(" ").toLowerCase();
  }

  function pick(f){
    var all  = (W.amProvidersOf ? W.amProvidersOf("range") : []);
    var band = f.p && W.amRangePrice ? W.amRangePrice(f.p) : null;
    var has  = function(p, k){ return W.amRangeHas ? W.amRangeHas(p, k) : false; };
    return all.filter(function(p){
      if(f.rg){
        var R = (p && Array.isArray(p.regions)) ? p.regions : [];
        if(R.indexOf(f.rg) < 0) return false;
      }
      /* ⚠️⚠️ 시설을 **안 고르신 연습장은 빠집니다** — 모르는 것을 아무
         칸에나 넣으면 지어낸 값입니다(절대 규칙 1). 화면이 그 사실을
         0건 안내에서 말합니다. */
      if(f.io && !has(p, f.io)) return false;
      if(f.sc && !has(p, "screen")) return false;
      if(f.pk && !has(p, "parking")) return false;
      if(band){
        /* ⚠️⚠️ 값을 **안 올리신 연습장은 빠집니다** — 같은 까닭입니다. */
        var low = W.amRangeLow ? W.amRangeLow(p) : null;
        if(!low) return false;
        if(band.gte !== null && low.amount < band.gte) return false;
        if(band.lt  !== null && low.amount >= band.lt) return false;
      }
      if(f.q && hay(p).indexOf(f.q.toLowerCase()) < 0) return false;
      return true;
    });
  }

  /* ⚠️⚠️ **0건을 두 가지로 갈라 말합니다** — 아직 아무도 안 들어온 것과,
     조건에 맞는 곳이 없는 것은 다릅니다(절대 규칙 2).
     ⚠️ 고르는 것과 찍는 것을 **갈라 둡니다** — 삼항으로 글 덩이 둘 중
     하나를 innerHTML 에 바로 넣으면 `check-safe` 가 "따라갈 함수 이름이
     없는 줄" 로 잡습니다(그 검사가 맞습니다). */
  function noneNarrow(){
    return '<div class="none"><h3>고르신 조건에 맞는 연습장이 없습니다.</h3>' +
      '<p>조건을 조금 넓혀 보시거나, 원하시는 조건으로 요청을 남기시면 ' +
      '맞는 연습장을 찾아 이어 드립니다. ' +
      '시설 · 가격을 아직 안 올리신 곳은 그 조건으로 좁히면 빠집니다.</p>' +
      '<div class="none-b">' +
      '<a class="btn btn-line" href="/cat/range">조건 모두 지우기</a>' +
      '<a class="btn btn-pri" href="/match?cat=range">연습장 요청하기</a>' +
      '</div></div>';
  }
  function noneEmpty(){
    return '<div class="none rng-none">' +
      '<p class="rng-none-i">' + (W.icon ? W.icon("flag", 34) : "") + '</p>' +
      '<h3>등록된 연습장이 없습니다</h3>' +
      '<p>아직 등록된 골프 연습장이 없습니다. ' +
      '내 연습장을 등록하고 골퍼들에게 소개해 보세요.</p>' +
      '<div class="none-b">' +
      '<a class="btn btn-pri" href="/join">시설 등록</a>' +
      '<a class="btn btn-line" href="/cat/range">다른 지역 보기</a>' +
      '</div></div>';
  }

  function paint(){
    var f = now();
    fill(f);
    var L = pick(f);
    if(L.length){
      list.innerHTML = W.amRangeGrid ? W.amRangeGrid(L) : "";
    }else{
      var any = (W.amProvidersOf ? W.amProvidersOf("range") : []).length;
      list.innerHTML = any ? noneNarrow() : noneEmpty();
    }
    if(cnt) cnt.textContent = (W.won ? W.won(L.length) : String(L.length)) + "곳";
  }

  function go(f, push){
    var u = urlOf(f);
    if(push){ try{ history.pushState({ rng:1 }, "", u); }catch(e){} }
    paint();
    /* ⚠️ 목록 머리로 올립니다 — 안 올리면 거르개를 누른 자리에 그대로
       있어 "아무 일도 안 일어났다" 로 보입니다. */
    if(wrap && wrap.scrollIntoView)
      try{ wrap.scrollIntoView({ block:"start" }); }catch(e){}
  }
  function fromForm(){
    var v = function(id){ var e = d.getElementById(id); return e ? e.value : ""; };
    return { rg:v("rng-rg"), io:v("rng-io"), sc:v("rng-sc"), pk:v("rng-pk"),
             p:v("rng-p"), q:(v("rng-q") || "").trim() };
  }

  form.addEventListener("submit", function(e){
    e.preventDefault();
    go(fromForm(), true);
  });
  /* 고르개는 바꾸는 즉시 — ⚠️ 찾는 칸(`input`)은 **안 받습니다**(글자를
     칠 때마다 다시 그리면 커서가 튕겨 나갑니다 · 0068 의 그 자리). */
  ["rng-rg", "rng-io", "rng-sc", "rng-pk", "rng-p"].forEach(function(id){
    var e = d.getElementById(id);
    if(e) e.addEventListener("change", function(){ go(fromForm(), true); });
  });

  /* 「초기화」 · 「조건 모두 지우기」 · 「다른 지역 보기」 — ⚠️ 전부
     **링크**이고 여기서 가로채기만 합니다(자바스크립트가 꺼져 있으면
     그대로 이동). ⚠️ 눌림은 **감싼 자리 한 곳**에서 받습니다. */
  d.addEventListener("click", function(e){
    var a = e.target.closest ? e.target.closest("a") : null;
    if(!a) return;
    var href = a.getAttribute("href") || "";
    if(href.indexOf("/cat/range") !== 0) return;
    if(e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault();
    var u = new URL(href, W.location.origin);
    var q = new URLSearchParams(u.search);
    var f = q.toString() ? now() : { rg:"", io:"", sc:"", pk:"", p:"", q:"" };
    ["rg", "io", "sc", "pk", "p", "q"].forEach(function(k){
      if(q.has(k)) f[k] = q.get(k) || "";
    });
    go(f, true);
  });

  /* ⚠️⚠️ 뒤로 가기를 받습니다 — `pushState` 로 주소를 바꾸므로, 이 줄이
     없으면 주소만 바뀌고 **목록이 그대로** 있습니다. */
  W.addEventListener("popstate", function(){ paint(); });

  /* 주소에 조건이 실려 들어오셨으면 그 자리에서 한 번 그립니다.
     ⚠️ 조건이 없으면 **다시 안 그립니다** — 빌드가 찍은 것과 같은
     목록이고, 괜히 다시 그리면 자바스크립트가 꺼진 분과 켜진 분이 다른
     HTML 을 보게 됩니다. */
  (function(){
    var f = now();
    if(f.rg || f.io || f.sc || f.pk || f.p || f.q) paint();
    else fill(f);
  })();
})();
