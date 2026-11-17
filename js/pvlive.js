/* ════════════════════════════════════════════════════════════════════
   업체 자료를 **화면이 열릴 때 지금 값으로** 덮습니다 (2026-11-17)

   ⚠️⚠️⚠️ 전에는 업체 · 가격 · 시설 사진 · 후기가 **빌드 때 HTML 에 박혀**
   나갔습니다(`tools/pull-providers.js` → `providers.generated.js`). 그래서
     · 업체가 /desk 에서 소개 · 가격 · 사진을 고쳐도 **운영자가 다시 가져와
       배포할 때까지** 손님 화면은 옛 값이었고
     · 정지 · 공개 끄기 된 업체가 **옛 HTML 에 그대로** 남았고(카드와 /pro 화면)
     · 새로 승인한 업체는 배포 전까지 **아무 데도** 안 보였습니다.
   지금은 같은 공개 보기(`v_provider_card` · `v_provider_price_public` ·
   `v_provider_photo_public` · `v_review_public`)를 **그 화면에 필요한 범위만**
   읽어 같은 꼴(js/data/pvnorm.js)로 다듬고, 화면은 같은 카드 함수로 다시 그립니다.

   ⚠️⚠️ 기준 — 무엇을 믿나
     · **읽었으면** 그것이 참입니다. 빌드 자료에 있는데 지금 없는 업체(정지 ·
       공개 끄기)는 **빼고**, 빌드에 없는 업체는 **더합니다**.
     · **못 읽었으면** 빌드 자료를 지우지 않되 **지금 값처럼 보이지 않게** 그 자리에
       「언제 기준인지 · 지금과 다를 수 있다」를 적습니다. ⚠️ 0곳을 「없다」로 읽게
       두지 않습니다(못 읽은 것과 0곳은 다릅니다).
     · **설정이 없으면**(Supabase 를 안 켠 배포 · 로컬 검사) 아무것도 안 합니다 —
       읽을 곳이 없고, 그때는 빌드 자료가 유일한 자료입니다.
     · ⚠️ 업체 정보 · 등록 가격은 **안내 자료**이고 판매 가능 여부가 아닙니다. 자리 ·
       매물처럼 **사고팔 수 있는지**가 걸린 것(티타임 · 중고 매물)은 처음부터 빌드에
       안 박고 늘 서버에서 읽습니다(js/booking.js · js/listing.js) — 기준이 다릅니다.

   ⚠️ 알림 — `am:providers` 이벤트를 보내고 `window.AM_PV_STATE` 에 off · ok · fail 을
   적습니다. 목록을 다시 그리는 화면(업체찾기 · 레슨 · 연습장 · 피팅 · 마켓)은 그
   이벤트를 듣고, 빌드만 그리던 자리(분류 화면의 업체 덩이 · 메인 새상품 · /pro)는
   여기서 직접 갈아 끼웁니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var W = window, esc = W.esc;
  var N = W.amPvNorm;
  /* 빌드가 실어 준 업체 id — 이 안에 있는 업체만 /pro/<id> 화면이 **파일로** 있습니다 */
  var BUILT = {};
  (W.AM_PROVIDERS || []).forEach(function(p){ BUILT[p.id] = true; });
  W.AM_PROVIDERS_BUILT = BUILT;
  W.AM_PV_STATE = "wait";

  /* ⚠️⚠️ 빌드에 없는 업체의 화면은 `/pro?id=<id>` 입니다(파일이 없는 주소로 보내면 404) —
     그 자리는 이 파일이 지금 값으로 그립니다. 빌드는 이 덮개 없이 /pro/<id> 를 짓습니다. */
  var urlOf = W.amProviderUrl;
  if(urlOf){
    W.amProviderUrl = function(p){
      var id = (typeof p === "string") ? p : (p && p.id);
      if(id && !BUILT[id]) return "/pro?id=" + encodeURIComponent(id);
      return urlOf(p);
    };
  }

  function scope(){
    var path = (location.pathname || "/").replace(/\/+$/, "") || "/";
    var m = /^\/pro\/([^\/]+)$/.exec(path);
    if(m) return { id: decodeURIComponent(m[1]), pro: true };
    if(path === "/pro"){
      var q = "";
      try{ q = new URLSearchParams(location.search).get("id") || ""; }catch(e){}
      return q ? { id: q, pro: true } : null;
    }
    m = /^\/cat\/([a-z]+)$/.exec(path);
    if(m){
      var c = W.amCat ? W.amCat(m[1]) : null;
      if(!c || !c.provider) return null;
      var subs = (W.amCatItems ? W.amCatItems(c) : []).map(function(x){ return x.key; });
      return subs.length ? { cat: c.key, subs: subs } : null;
    }
    if(path === "/") return scopeOf("market");
    if(path === "/match"){
      /* 업체 화면에서 오셨으면 **그 업체 하나만** 읽습니다(필요한 범위만) */
      var pv = "";
      try{ pv = new URLSearchParams(location.search).get("pv") || ""; }catch(e){}
      return pv ? { id: pv } : { all: true };
    }
    if(path === "/search") return { all: true };
    return null;
  }
  function scopeOf(key){
    var c = W.amCat ? W.amCat(key) : null;
    var subs = c && W.amCatItems ? W.amCatItems(c).map(function(x){ return x.key; }) : [];
    return subs.length ? { cat: key, subs: subs } : null;
  }
  function inScope(s, p){
    if(s.all) return true;
    if(s.id) return p.id === s.id;
    var mine = p.subs || [];
    return mine.some(function(k){ return s.subs.indexOf(k) >= 0; });
  }

  function get(a, view, qs){
    var h = { apikey: a.conf.anonKey };
    if(W.amAuthHeaders) h = Object.assign(h, W.amAuthHeaders());
    return fetch(a.conf.url + "/rest/v1/" + view + "?" + qs.join("&"), { headers: h })
      .then(function(r){
        if(!r.ok) throw new Error(view + " " + r.status);
        return r.json();
      }).then(function(x){
        if(!Array.isArray(x)) throw new Error(view + " 목록이 아님");
        return x;
      });
  }
  function inList(ids){
    return "in.(" + ids.map(function(i){ return '"' + String(i).replace(/"/g, "") + '"'; })
      .map(encodeURIComponent).join(",") + ")";
  }

  function read(a, s){
    var q = ["select=" + N.COLS, "is_test=eq.false", "order=id.asc", "limit=500"];
    if(s.id) q.push("id=eq." + encodeURIComponent(s.id));
    else if(s.subs) q.push("subs=ov." + encodeURIComponent("{" + s.subs.join(",") + "}"));
    return get(a, "v_provider_card", q).then(function(rows){
      var list = N.clean(rows);
      if(!list.length) return { list: list, reviews: [] };
      var ids = list.map(function(p){ return p.id; });
      var base = N.pubBase(a.conf.url, a.conf.pubBucket);
      return Promise.all([
        get(a, "v_provider_price_public",
            ["select=" + N.PCOLS, "provider_id=" + inList(ids), "order=amount.asc"]),
        base ? get(a, "v_provider_photo_public",
            ["select=" + N.FCOLS, "provider_id=" + inList(ids), "order=created_at.asc"])
             : Promise.resolve([]),
        get(a, "v_review_public",
            ["select=" + N.RCOLS, "provider_id=" + inList(ids),
             "order=created_at.desc", "limit=2000"])
      ]).then(function(x){
        N.join(list, x[0], x[1], base);
        var R = N.reviews(x[2]);
        if(R.bad.length) try{ console.warn("[pvlive] 그리지 않은 후기 " + R.bad.length +
          "건 — 별점 범위 · 작성자 가림이 어긋났습니다 (0037 의 보기를 보세요)."); }catch(e){}
        return { list: list, reviews: R.rows };
      });
    });
  }

  function merge(s, got){
    var keep = (W.AM_PROVIDERS || []).filter(function(p){ return !inScope(s, p); });
    var gone = (W.AM_PROVIDERS || []).filter(function(p){ return inScope(s, p); })
      .map(function(p){ return p.id; });
    W.AM_PROVIDERS = keep.concat(got.list);
    var drop = {};
    gone.concat(got.list.map(function(p){ return p.id; })).forEach(function(i){ drop[i] = true; });
    W.AM_REVIEWS = (W.AM_REVIEWS || []).filter(function(v){ return !drop[v.provider_id]; })
      .concat(got.reviews);
  }

  /* ── 빌드만 그리던 자리를 갈아 끼웁니다 ──────────────────────────── */
  function paintBlocks(){
    /* 분류 화면의 업체 덩이 — 두 꼴(있을 때 · 0곳)을 빌드가 다 찍어 두었습니다 */
    Array.prototype.forEach.call(document.querySelectorAll("[data-pvblock]"), function(sec){
      var key = sec.getAttribute("data-pvblock");
      var L = W.amProvidersOf ? W.amProvidersOf(key) : [];
      var on = L.length > 0;
      Array.prototype.forEach.call(sec.querySelectorAll("[data-pvstate]"), function(el){
        el.hidden = (el.getAttribute("data-pvstate") === "list") ? !on : on;
      });
      var n = sec.querySelector("[data-pvn]");
      if(n) n.textContent = W.won ? W.won(L.length) : String(L.length);
      var g = sec.querySelector("[data-pvgrid]");
      if(g){ g.innerHTML = on && W.amCardGrid ? W.amCardGrid(L) : ""; g.hidden = !on; }
      /* 빌드 때 할 말이 없어 숨겨 둔 덩이 — 업체가 생기면 세웁니다 */
      if(sec.hasAttribute("data-pvhide")) sec.hidden = !on;
    });
    /* 메인 — 새상품 */
    Array.prototype.forEach.call(document.querySelectorAll("[data-pvmk]"), function(box){
      var items = (W.amMkItems && W.amProvidersOf) ? W.amMkItems(W.amProvidersOf("market")) : [];
      var on = items.length > 0;
      Array.prototype.forEach.call(box.querySelectorAll("[data-pvstate]"), function(el){
        el.hidden = (el.getAttribute("data-pvstate") === "list") ? !on : on;
      });
      var g = box.querySelector("[data-pvgrid]");
      if(g) g.innerHTML = on && W.amMkGrid ? W.amMkGrid(items.slice(0, 4)) : "";
    });
  }

  function paintPro(s){
    var main = document.querySelector("main");
    if(!main || !W.amPvPage) return;
    var p = (W.AM_PROVIDERS || []).filter(function(x){ return x.id === s.id; })[0];
    if(!p){
      main.innerHTML = '<section class="pghd"><div class="wrap">' +
        '<h1>지금은 볼 수 없는 업체입니다.</h1>' +
        '<p class="pghd-l">이 업체는 지금 공개되어 있지 않습니다 — 입점이 멈췄거나 ' +
        '업체가 공개를 껐습니다. 같은 일을 하는 다른 업체를 찾아보세요.</p>' +
        '<div class="none-b"><a class="btn btn-pt" href="/search">업체찾기</a>' +
        '<a class="btn btn-line" href="/match">견적 · 매칭 요청</a></div>' +
        '</div></section>';
      document.title = "지금은 볼 수 없는 업체 — 골프올인원";
      return;
    }
    var o = W.amPvPage(p);
    main.innerHTML = o.body;
    document.title = o.title + " — 골프올인원";
  }

  /* 못 읽었을 때 — ⚠️ 빌드 자료를 **지금 값처럼** 두지 않습니다 */
  function atText(){
    var t = String(W.AM_PROVIDERS_AT || "");
    var m = /^(\d{4})-(\d\d)-(\d\d) (\d\d):(\d\d) UTC$/.exec(t);
    if(!m) return "";
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) + 9 * 3600 * 1000);
    var p2 = function(n){ return (n < 10 ? "0" : "") + n; };
    return d.getUTCFullYear() + "." + p2(d.getUTCMonth() + 1) + "." + p2(d.getUTCDate()) +
           " " + p2(d.getUTCHours()) + ":" + p2(d.getUTCMinutes());
  }
  function staleNote(s){
    var main = document.querySelector("main");
    if(!main || document.getElementById("pvstale")) return;
    var at = atText();
    var box = document.createElement("div");
    box.id = "pvstale";
    box.className = "pvstale";
    box.setAttribute("role", "status");
    box.innerHTML = '<div class="wrap"><p><b>업체 정보의 지금 내용을 확인하지 못했습니다.</b> ' +
      (at ? '아래 업체 · 등록 가격 · 사진은 <b>' + esc(at) + '</b>에 가져온 것이라 지금과 다를 수 있습니다. '
          : '아래 업체 · 등록 가격 · 사진은 지금과 다를 수 있습니다. ') +
      (s && s.pro ? '' : '업체 수가 0곳으로 보여도 <b>확인한 수가 아닙니다</b>. ') +
      '상담 · 견적을 요청하시면 업체가 지금 조건으로 다시 알려 드립니다.</p>' +
      '<button type="button" class="btn btn-line btn-sm" data-pvretry>다시 확인하기</button></div>';
    var first = main.firstElementChild;
    if(first && first.nextSibling) main.insertBefore(box, first.nextSibling);
    else main.appendChild(box);
  }

  function tell(state){
    W.AM_PV_STATE = state;
    try{ W.dispatchEvent(new CustomEvent("am:providers", { detail: { state: state } })); }catch(e){}
  }

  function run(a, s){
    return read(a, s).then(function(got){
      merge(s, got);
      var old = document.getElementById("pvstale");
      if(old) old.remove();
      if(s.pro) paintPro(s); else paintBlocks();
      tell("ok");
    }, function(e){
      if(W.amFailLog) W.amFailLog("pvlive", e);
      staleNote(s);
      tell("fail");
    });
  }

  if(!N || !W.amAuthAsk){ W.AM_PV_STATE = "off"; return; }
  var S = scope();
  if(!S){ W.AM_PV_STATE = "off"; return; }
  W.amAuthAsk().then(function(a){
    if(!a || !a.on || !a.conf){ tell("off"); return; }
    document.addEventListener("click", function(e){
      var b = e.target && e.target.closest ? e.target.closest("[data-pvretry]") : null;
      if(!b) return;
      b.disabled = true;
      run(a, S).then(function(){ b.disabled = false; });
    });
    return run(a, S);
  }).catch(function(){ tell("off"); });
})();
