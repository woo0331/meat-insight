/* ════════════════════════════════════════════════════════════════════
   골프용품 마켓 — 탭 · 거르개 · 찾기 (확정 시안 ⑥ · 2026-11-13)

   ⚠️⚠️⚠️ **카드를 여기서 다시 적지 않습니다.** 빌드가 찍은 카드와 거른
   뒤 다시 그린 카드가 다르면 손님이 거르개를 누르는 순간 카드가 조용히
   달라지고 **그려진 화면만 보는 검사는 영원히 통과**합니다. 둘 다
   `js/card.js` 의 `amMkGrid()` 를 부릅니다.

   ⚠️⚠️ **거르개는 양식(form)입니다 — 단추가 아닙니다.** 자바스크립트가
   꺼진 분에게도 GET 으로 그대로 돕니다. 여기서는 눌림을 가로채 주소만
   바꾸고(`pushState`) 목록을 갈아 끼웁니다.

   ⚠️ 거르는 자료는 **빌드가 실어 준 것**입니다(`AM_PROVIDERS` 의
   `prices`) — 업체가 올린 값이고, 늘면 `tools/pull-providers.js` 로
   다시 가져와 배포합니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var W = window, d = document;
  var list = d.getElementById("mklist");
  var form = d.getElementById("mkform");
  if(!list || !form) return;
  var cnt  = d.getElementById("mkcnt");
  var wrap = d.querySelector(".mk-sec");

  function all(){ return W.amProvidersOf ? W.amProvidersOf("market") : []; }

  function now(){
    var u = new URLSearchParams(W.location.search);
    var t = u.get("t") || "item";
    if(!(W.AM_MK_TAB || []).some(function(x){ return x.key === t; })) t = "item";
    return { t:t, s:u.get("s") || "", b:u.get("b") || "",
             lo:u.get("lo") || "", hi:u.get("hi") || "",
             o:u.get("o") || "", q:(u.get("q") || "").trim() };
  }
  function urlOf(f){
    var u = new URLSearchParams();
    if(f.t && f.t !== "item") u.set("t", f.t);
    ["s", "b", "lo", "hi", "o", "q"].forEach(function(k){
      if(f[k]) u.set(k, f[k]);
    });
    var s = u.toString();
    return "/cat/market" + (s ? "?" + s : "");
  }

  /* 고르개 · 탭을 지금 조건에 맞춥니다 — ⚠️ 안 맞추면 주소로 들어오신
     분께 「전체」라고 적힌 칸 아래 좁혀진 목록이 나옵니다. */
  function fill(f){
    var set = function(id, v){ var e = d.getElementById(id); if(e) e.value = v; };
    set("mk-o", f.o); set("mk-q", f.q); set("mk-lo", f.lo); set("mk-hi", f.hi);
    ["s", "b"].forEach(function(k){
      var L = d.querySelectorAll('#mkform input[name="' + k + '"]');
      var hit = false;
      Array.prototype.forEach.call(L, function(e){
        e.checked = (e.value === (f[k] || ""));
        if(e.checked) hit = true;
      });
      /* ⚠️ 모르는 값이 실려 오면(주소를 손으로 고치신 경우) 「전체」를
         켭니다 — 빈 채로 두면 아무 칸도 안 켜져 손님이 지금 무엇으로
         보고 계신지 알 길이 없습니다. */
      if(!hit && L.length) L[0].checked = true;
    });
    Array.prototype.forEach.call(d.querySelectorAll("[data-mktab]"), function(a){
      var on = (a.getAttribute("data-mktab") || "item") === f.t;
      a.classList.toggle("on", on);
      if(on) a.setAttribute("aria-current", "true");
      else   a.removeAttribute("aria-current");
    });
  }

  /* 찾는 말 — ⚠️ **사람이 읽는 이름**으로 찾습니다(손님은 `mk-ball` 을
     치지 않습니다): 상품명 · 스토어 · 종류 이름 · 비고 · 브랜드. */
  function hay(it){
    var sub = W.amSub ? W.amSub("market", it.sub) : null;
    var nm  = (sub && sub.item && sub.item.name) || "";
    return [it.label, it.store, nm, it.note]
      .concat(it.brands || []).join(" ").toLowerCase();
  }

  function num(v){
    var n = Number(String(v || "").replace(/[^0-9]/g, ""));
    return isFinite(n) && String(v || "").trim() !== "" ? n : null;
  }

  function pickItems(f){
    var L = W.amMkItems ? W.amMkItems(all()) : [];
    /* ⚠️ 「렌탈」 탭은 **하위 키 하나**로 좁히는 자리입니다 — 표를 따로
       두지 않았습니다(`js/data/market.js` 머리말). */
    if(f.t === "rent") L = L.filter(function(x){ return x.sub === "mk-rent"; });
    var lo = num(f.lo), hi = num(f.hi);
    return L.filter(function(it){
      if(f.s && it.sub !== f.s) return false;
      if(f.b && (it.brands || []).indexOf(f.b) < 0) return false;
      /* ⚠️ 경계는 **아래를 열고 위를 닫습니다**(`gte` · `lte`) — 손님이
         적은 숫자는 「그 값까지」로 읽히므로 최고가는 포함합니다. */
      if(lo !== null && it.amount < lo) return false;
      if(hi !== null && it.amount > hi) return false;
      if(f.q && hay(it).indexOf(f.q.toLowerCase()) < 0) return false;
      return true;
    });
  }

  function pickStores(f){
    var lo = num(f.lo), hi = num(f.hi);
    return all().filter(function(p){
      var S = (p && Array.isArray(p.subs)) ? p.subs : [];
      if(f.s && S.indexOf(f.s) < 0) return false;
      if(f.b && ((p.brands || []).indexOf(f.b) < 0)) return false;
      if(lo !== null || hi !== null){
        /* ⚠️⚠️ 값을 **안 올리신 스토어는 빠집니다** — 모르는 값을 아무
           칸에나 넣으면 지어낸 값입니다(피팅 · 레슨과 같은 규칙).
           0건 안내가 그 사실을 그 자리에서 말합니다. */
        var P = (W.amMkItems ? W.amMkItems([p]) : []);
        if(!P.length) return false;
        var ok = P.some(function(it){
          if(lo !== null && it.amount < lo) return false;
          if(hi !== null && it.amount > hi) return false;
          return true;
        });
        if(!ok) return false;
      }
      if(f.q){
        var hs = [p.name || "", p.intro || ""].concat(p.brands || [])
          .join(" ").toLowerCase();
        if(hs.indexOf(f.q.toLowerCase()) < 0) return false;
      }
      return true;
    });
  }

  /* 차례 — ⚠️⚠️ 시안의 「최신 등록순」은 **안 냅니다**(올린 날 칸이
     공개 보기에 없습니다 · 골라도 안 바뀌는 칸은 절대 규칙 5). 「추천순」
     도 안 냅니다 — 무엇이 추천인지 세어 본 적이 없습니다(절대 규칙 1). */
  function sortItems(L, o){
    var nm = function(a, b){
      return String(a.label || "").localeCompare(String(b.label || ""), "ko");
    };
    var by = function(dir){
      return function(a, b){
        return a.amount === b.amount ? nm(a, b)
             : (a.amount < b.amount ? -dir : dir);
      };
    };
    var C = { low:by(1), high:by(-1) };
    return L.slice().sort(C[o] || nm);
  }
  function sortStores(L){
    return L.slice().sort(function(a, b){
      return String(a.name || "").localeCompare(String(b.name || ""), "ko");
    });
  }

  /* ⚠️⚠️ **0건을 두 가지로 갈라 말합니다** — 아직 아무도 안 들어온 것과
     조건에 맞는 것이 없는 것은 다릅니다(절대 규칙 2).
     ⚠️ 고르는 것과 찍는 것을 **갈라 둡니다** — 삼항으로 글 덩이 둘 중
     하나를 innerHTML 에 바로 넣으면 `check-safe` 가 "따라갈 함수 이름이
     없는 줄" 로 잡습니다(그 검사가 맞습니다). */
  function noneNarrow(){
    return '<div class="none"><h3>고르신 조건에 맞는 것이 없습니다.</h3>' +
      '<p>조건을 조금 넓혀 보시거나, 찾으시는 용품을 적어 요청을 ' +
      '남기시면 맞는 업체를 찾아 이어 드립니다. ' +
      '값을 아직 안 올리신 스토어는 가격으로 좁히면 빠집니다.</p>' +
      '<div class="none-b">' +
      '<a class="btn btn-line" href="/cat/market">조건 모두 지우기</a>' +
      '<a class="btn btn-pri" href="/match?cat=market">용품 요청하기</a>' +
      '</div></div>';
  }
  function noneEmpty(){
    return '<div class="none fit-none">' +
      '<p class="fit-none-i">' + (W.icon ? W.icon("bag", 34) : "") + '</p>' +
      '<h3>아직 등록된 상품이 없습니다</h3>' +
      '<p>지금 입점하고 골프용품을 판매해 보세요.</p>' +
      '<div class="none-b">' +
      '<a class="btn btn-pri" href="/join">판매업체 입점 신청</a>' +
      '<a class="btn btn-line" href="/match?cat=market">원하는 용품 요청하기</a>' +
      '</div></div>';
  }

  function paint(){
    var f = now();
    fill(f);
    var tab = W.amMkTab ? W.amMkTab(f.t) : { name:"전체 상품" };
    var n, html;
    if(f.t === "store"){
      var S = sortStores(pickStores(f));
      n = S.length;
      html = n ? (W.amCardGrid ? W.amCardGrid(S) : "") : "";
    }else{
      var L = sortItems(pickItems(f), f.o);
      n = L.length;
      html = n ? (W.amMkGrid ? W.amMkGrid(L) : "") : "";
    }
    if(!n){
      var any = (f.t === "store")
        ? all().length
        : (W.amMkItems ? W.amMkItems(all()).length : 0);
      html = any ? noneNarrow() : noneEmpty();
    }
    list.innerHTML = html;
    if(cnt){
      /* ⚠️ 세는 말이 탭마다 다릅니다 — 「입점 스토어」에 「건」을 붙이면
         업체를 물건처럼 셉니다. */
      cnt.innerHTML = "";
      var b = d.createElement("b");
      b.textContent = (W.won ? W.won(n) : String(n)) +
        (f.t === "store" ? "곳" : "건");
      cnt.appendChild(d.createTextNode(tab.name + " "));
      cnt.appendChild(b);
      var s = d.createElement("span");
      s.className = "fit-note";
      s.textContent = tab.note +
        " 골프올인원은 통신판매중개자이며 거래 당사자가 아닙니다.";
      cnt.appendChild(s);
    }
  }

  function go(f, push){
    var u = urlOf(f);
    if(push){ try{ history.pushState({ mk:1 }, "", u); }catch(e){} }
    paint();
    if(wrap && wrap.scrollIntoView)
      try{ wrap.scrollIntoView({ block:"start" }); }catch(e){}
  }
  function fromForm(){
    var v = function(id){ var e = d.getElementById(id); return e ? e.value : ""; };
    var r = function(k){
      var e = d.querySelector('#mkform input[name="' + k + '"]:checked');
      return e ? e.value : "";
    };
    var f = now();
    return { t:f.t, s:r("s"), b:r("b"), lo:v("mk-lo"), hi:v("mk-hi"),
             o:v("mk-o"), q:(v("mk-q") || "").trim() };
  }

  form.addEventListener("submit", function(e){
    e.preventDefault();
    go(fromForm(), true);
  });
  /* ⚠️⚠️ 네모 칸 · 고르개는 **양식 한 곳**에서 받습니다(0069 의
     `bindBar()` 규칙). ⚠️ 찾는 칸과 가격 칸은 **안 받습니다** — 글자를
     칠 때마다 다시 그리면 커서가 튕겨 나갑니다(0068 의 그 자리). */
  form.addEventListener("change", function(e){
    var t = e.target;
    if(!t || !t.name) return;
    if(t.name === "q" || t.name === "lo" || t.name === "hi") return;
    go(fromForm(), true);
  });

  /* 탭 · 「조건 모두 지우기」 — ⚠️ 전부 **링크**이고 여기서 가로채기만
     합니다. ⚠️ 눌림은 **감싼 자리 한 곳**에서 받습니다. */
  d.addEventListener("click", function(e){
    var a = e.target.closest ? e.target.closest("a") : null;
    if(!a) return;
    var href = a.getAttribute("href") || "";
    if(href.indexOf("/cat/market") !== 0) return;
    if(e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault();
    var u = new URL(href, W.location.origin);
    var q = new URLSearchParams(u.search);
    var f = q.toString()
      ? now()
      : { t:"item", s:"", b:"", lo:"", hi:"", o:"", q:"" };
    ["t", "s", "b", "lo", "hi", "o", "q"].forEach(function(k){
      if(q.has(k)) f[k] = q.get(k) || "";
    });
    /* ⚠️⚠️ **탭을 바꾸면 고른 종류를 같이 풉니다** — 안 풀면 「전체
       상품」에서 골프공을 고른 뒤 「렌탈」로 가서 **영원히 0건**입니다
       (0069 의 묶음 탭에서 세운 규칙). */
    if(a.hasAttribute("data-mktab")){
      var t = a.getAttribute("data-mktab") || "item";
      if(t !== f.t) f.s = "";
      f.t = t;
    }
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
    if(f.t !== "item" || f.s || f.b || f.lo || f.hi || f.o || f.q) paint();
    else fill(f);
  })();
})();
