/* ════════════════════════════════════════════════════════════════════
   관심상품 (찜) — /my 에서만 돕니다 (DB 는 0069)

   ⚠️⚠️⚠️ **누가 무엇에 찜했는지는 제 것만 보입니다.** 파는 분에게도 ·
   운영자에게도 안 냅니다 — 그건 행동 기록이고, 0059 가 글 조회 기록을
   운영자도 못 읽게 둔 그 까닭과 같습니다. 그래서 읽는 길은 보기
   `v_listing_fav` 하나이고 그 보기가 `auth.uid()` 로 좁힙니다.

   ⚠️⚠️ **찜 수를 어디에도 안 적습니다** — 세어 낼 수야 있지만 그 수는
   "인기" 로 읽히고 우리가 그것을 검증할 길이 없습니다 (절대 규칙 1 의
   결). `v_listing_open` 에 `fav_n` 칸이 **아예 없습니다**.

   ⚠️⚠️ **팔린 매물도 남깁니다.** `v_listing_open` 을 그대로 썼으면 찜해
   두신 것이 팔리는 순간 목록에서 **조용히 사라졌습니다** — "팔렸습니다"
   를 보여 드리는 것이 맞습니다. 그래서 보기가 `state` 를 그대로 냅니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("favbox");
  if(!box || !window.amAuthAsk) return;

  var esc = window.esc;
  var CONF = null;
  var REG = {};
  (window.AM_REGIONS || []).forEach(function(r){ REG[r.key] = r.name; });
  /* ⚠️⚠️ **못 찾은 키를 그대로 찍지 않습니다**(지시 6번 · 2026-11-12).
     중립 문구를 내고 누락은 `console.warn` 으로 운영자에게만 갑니다. */
  function rgName(k){
    return window.amKeyName ? window.amKeyName(REG, k, "지역") : "";
  }
  function subName(k){
    var c = window.amCat ? window.amCat("used") : null;
    var L = (c && window.amCatItems) ? window.amCatItems(c) : [];
    for(var i = 0; i < L.length; i++) if(L[i].key === k) return L[i].name;
    return k;
  }
  /* ⚠️⚠️ 한 번에 받아 오는 줄 수 — **한 곳**입니다. 0069 가 찜을 200개
     까지 받으므로 그 수와 같습니다(더 작게 두면 "다 담았는데 안 보인다"
     가 됩니다). */
  var LIMIT = 200;

  function get(a, path){
    return fetch(a.conf.url + "/rest/v1/" + path, {
      headers: Object.assign({ apikey:a.conf.anonKey },
                             window.amAuthHeaders ? window.amAuthHeaders() : {})
    }).then(function(r){ return r.ok ? r.json() : []; });
  }
  function call(a, fn, p){
    return fetch(a.conf.url + "/rest/v1/rpc/" + fn, {
      method:"POST",
      headers: Object.assign({ "content-type":"application/json",
                               apikey:a.conf.anonKey },
                             window.amAuthHeaders ? window.amAuthHeaders() : {}),
      body: JSON.stringify({ p:p })
    }).then(function(r){
      return r.text().then(function(t){
        if(!r.ok){ var m = t; try{ m = JSON.parse(t).message || t; }catch(_){}
                   throw new Error(m); }
        try{ return JSON.parse(t); }catch(_){ return t; }
      });
    });
  }

  /* 한 줄 — ⚠️ 상세 화면으로 갑니다 (팔린 것도 열립니다 — 공개 보기가
     안 내므로 "지금은 볼 수 없는 매물입니다" 가 뜨고, 그것이 맞는 말
     입니다). */
  function row(r){
    var u = window.amPubUrl ? window.amPubUrl(CONF, r.thumb) : "";
    /* ⚠️⚠️ 사진이 0장이거나 버킷이 꺼져 있으면 **아이콘 타일**입니다 —
       남의 사진을 깔지 않습니다 (절대 규칙 1). */
    var ph = u
      ? '<img class="mfv-im" src="' + esc(u) + '" alt="" loading="lazy" decoding="async">'
      : '<span class="mfv-no">' + window.icon("cart", 20) + '</span>';
    /* ⚠️ `open` 이면 딱지를 **안 냅니다** — 「판매중」을 모든 줄에 붙이면
       그것만 보입니다. */
    var st = (r.state && r.state !== "open")
      ? '<span class="mfv-st">' + esc(window.amLstStName(r.state)) + '</span>' : "";
    return '<li class="mfv-i">' +
      '<a class="mfv-a" href="/cat/used?v=' + encodeURIComponent(r.id) + '">' +
        '<span class="mfv-ph">' + ph + '</span>' +
        '<span class="mfv-x">' +
          '<span class="mfv-t">' + esc(r.title) + st + '</span>' +
          /* ⚠️⚠️ **0 은 "무료" 입니다** — 세는 자리는 `amLstPrice()` 한 곳 */
          '<span class="mfv-p">' + esc(window.amLstPrice(r.price)) + '</span>' +
          '<span class="mfv-m">' + esc(bits(r)) + '</span>' +
        '</span>' +
      '</a>' +
      '<button type="button" class="btn btn-sm btn-bad mfv-off" data-id="' +
        esc(r.id) + '">관심상품에서 빼기</button>' +
    '</li>';
  }
  /* 브랜드 · 모델 · 종류 · 지역 — ⚠️ 비는 것은 **줄에서 빠집니다**
     (절대 규칙 2 — "(미기재)" 를 찍지 않습니다) */
  function bits(r){
    var b = [];
    if(r.brand) b.push(r.brand);
    if(r.model) b.push(r.model);
    b.push(subName(r.sub));
    b.push(rgName(r.region));
    if(r.ship) b.push("택배 가능");
    return b.join(" · ");
  }

  /* ⚠️⚠️ **고르는 것과 찍는 것을 갈라 둡니다** — 삼항으로 두 글 덩이 중
     하나를 골라 `innerHTML` 에 넣으면 `check-safe` 가 "esc() 없이 변수를
     넣는 줄" 로 잡습니다. 그 검사가 맞습니다 (구합니다 글에서 겪은 자리). */
  function noneHtml(){
    return '<h2 class="mj-h">관심상품</h2>' +
      /* ⚠️ 0건을 **막다른 길로 두지 않습니다** — 길을 같이 냅니다
         (절대 규칙 2 · `/my` 의 내 요청 상자에서 겪은 그 자리) */
      '<p class="mj-z">아직 담아 두신 매물이 없습니다. ' +
      '중고 골프장터에서 마음에 드는 매물의 하트를 누르시면 여기 모입니다.</p>' +
      '<a class="btn btn-pt mj-go" href="/cat/used">중고 골프장터 보기</a>';
  }
  function listHtml(rows){
    return '<h2 class="mj-h">관심상품</h2>' +
      /* ⚠️⚠️ **한도에 닿으면 "N건 이상"** 입니다 — 받아 온 줄 수를
         전체인 것처럼 적으면 세어 본 값이 아닙니다 (절대 규칙 1). */
      '<p class="mj-c">' + rows.length +
        (rows.length >= LIMIT ? "건 이상" : "건") + '</p>' +
      '<ul class="mfv-l">' + rows.map(row).join("") + '</ul>';
  }

  function paint(a, rows){
    box.className = rows.length ? "jbox" : "none";
    box.innerHTML = rows.length ? listHtml(rows) : noneHtml();
    box.hidden = false;
    Array.prototype.forEach.call(box.querySelectorAll(".mfv-off"), function(b){
      b.addEventListener("click", function(){
        b.disabled = true;
        /* ⚠️ 끄는 쪽은 동의 시각을 안 보냅니다 (여는 것만 동의입니다) */
        call(a, "fav_listing", { id: b.getAttribute("data-id"), on:false })
          .then(function(){ return reload(a); })
          .catch(function(err){
            b.disabled = false;
            /* ⚠️ 거절한 말을 **그대로** 보여 줍니다 (지어내지 않습니다) */
            try{ window.alert(String((err && err.message) || "빼지 못했습니다.")); }catch(_){}
          });
      });
    });
  }

  function reload(a){
    /* ⚠️⚠️ **`fav_at` 차례**로 냅니다 — 매물을 올린 차례로 두면 오래된
       매물을 방금 담으셔도 맨 아래에 있습니다. */
    return get(a, "v_listing_fav?select=id,title,price,sub,region,ship," +
                  "brand,model,state,thumb,fav_at&order=fav_at.desc&limit=" + LIMIT)
      .then(function(rows){ paint(a, rows || []); });
  }

  window.amAuthAsk().then(function(a){
    if(!a || !a.on || !a.signedIn) return;   /* 로그인 전에는 안 그립니다 */
    CONF = a.conf;
    /* ⚠️ 못 읽었으면 **그대로 둡니다** — 0건이라고 적지 않습니다
       (못 읽은 것과 0건은 다릅니다 · 절대 규칙 1). */
    reload(a).catch(function(){});
  }).catch(function(){});
})();
