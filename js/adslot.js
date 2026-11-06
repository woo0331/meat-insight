/* ════════════════════════════════════════════════════════════════════
   광고 자리 — 집행 중인 광고를 손님 화면에 그립니다 (0026 · 0032 · 0055)

   ⚠️⚠️⚠️ **표 · 보기 · 관리 화면은 2026-10-21 에 섰는데, 손님 화면에
   그리는 코드가 2026-11-06 까지 한 곳도 없었습니다.** `ad_run` 에 줄을
   넣고 `state` 를 `live` 로 바꿔도 **아무 데도 안 나왔습니다** — 즉
   광고를 파셔도 띄울 자리가 없었습니다. 돈을 받고 안 띄우는 꼴이라
   기능 누락이 아니라 사고입니다.
   ⚠️ `pages/home.js` 에는 "광고 구간은 집행 중인 광고가 0건이라 그리지
   않습니다" 라고 적혀 있었는데, **0건이라서 안 그린 것이 아니라 그리는
   코드가 없었습니다** — 주석이 코드와 다른 자리의 또 한 판입니다.
   (`save_provider_contact` · `drop_photo` · 문의 답변 · 수수료 다섯에
   이은 **다섯째** "문만 서 있고 화면이 없던" 자리입니다.)

   ⚠️⚠️ **빌드가 못 찍습니다.** 광고는 날짜로 켜지고 꺼지는데
   (`current_date between starts_on and ends_on`), 빌드가 찍으면 배포할
   때마다만 바뀌고 `vercel.json` 이 HTML 에 캐시를 걸어 더 늦습니다.
   그래서 **자리는 빌드가 · 알맹이는 브라우저가** 그립니다. 자리는 0건이면
   `hidden` 으로 남고, 감싼 구간은 CSS 의 `:has()` 가 줄째 가립니다.

   ⚠️⚠️⚠️ **"광고" 라고 반드시 표시합니다** (표시 · 광고의 공정화에 관한
   법률 제3조 · `/guide` 에 그렇게 적어 두었습니다). 그 말은 우리가 짓지
   않고 **보기가 내려주는 `label`** 을 씁니다 — 두 곳에 적으면 한쪽만
   고치는 날 표시가 조용히 빠집니다.

   ⚠️⚠️ **빌드에 없는 업체는 링크를 안 겁니다.** `/pro/<id>` 는 빌드가
   찍는 화면이라, 승인 직후 `tools/pull-providers.js` 를 안 돌리면 그
   주소가 **없습니다** — 링크로 내면 광고를 눌러서 404 로 갑니다
   (눌러도 아무 일이 안 나는 칸 · 절대 규칙 5). 그때는 이름만 내고
   운영자에게 console 로 말합니다 (절대 규칙 3).

   ⚠️ **돈 받은 링크는 `rel="sponsored nofollow"`** 입니다 — 안 달면
   검색엔진이 자연 링크로 읽고, 적발되면 사이트 전체가 손해를 봅니다.
   ════════════════════════════════════════════════════════════════════ */
/* ⚠️⚠️ **자리를 가리키는 이름은 `data-adslot` 입니다 — `data-ad` 가
   아닙니다.** `/admin` 의 광고 줄이 단추에 `data-ad="<광고 id>"` 를 이미
   쓰고 있어서, 같은 이름으로 집으면 이 파일이 **운영자 화면의 단추를
   덮어씁니다** (`.lg` 가 로고이면서 약관이었던 그 자리의 작은 판입니다). */
(function(){
  var esc = window.esc;

  /* 한 자리에 몇 줄까지 — ⚠️ 스무 줄이 들어오면 그건 광고가 아니라
     목록입니다. 몇 건 팔렸는지는 운영자가 /admin 에서 봅니다. */
  var MAX = 4;

  var P = null;                       /* 한 번만 읽습니다 */

  /* ⚠️ 차례는 **먼저 사신 분이 먼저**입니다 (보기에 우선순위 칸이
     없습니다 — 없는 칸을 지어내지 않습니다). */
  function rows(a){
    if(P) return P;
    P = fetch(a.conf.url + "/rest/v1/v_ad_live" +
      "?select=id,provider_id,provider_name,place,cat_key,region,label" +
      "&order=starts_on.asc&limit=40", {
      headers: Object.assign({ apikey:a.conf.anonKey },
                             window.amAuthHeaders ? window.amAuthHeaders() : {})
    }).then(function(r){ return r.ok ? r.json() : []; })
      .catch(function(){ return []; });
    return P;
  }

  /* 그 자리에 걸리는 줄만 — ⚠️ 분류 광고는 `cat_key` 가, 지역 광고는
     `region` 이 **같아야** 걸립니다 (0026 의 check 가 그 둘을 요구합니다).
     ⚠️⚠️ 운영자가 분류 이름('골프 레슨')이나 지역 이름('서울')을 적으면
     여기서 **영원히 안 걸립니다** — 그래서 /admin 의 그 칸을 고르개로
     바꿨습니다 (키를 손으로 적게 두면 조용히 안 보이는 광고가 됩니다). */
  function pick(all, place, key){
    return all.filter(function(r){
      if(r.place !== place) return false;
      if(place === "cat_top") return String(r.cat_key || "") === String(key || "");
      if(place === "region")  return String(r.region  || "") === String(key || "");
      return true;
    }).slice(0, MAX);
  }

  function one(r){
    var have = window.amProvider ? window.amProvider(r.provider_id) : null;
    /* ⚠️ 보기가 내려준 말을 씁니다 — 없으면 그래도 '광고' 는 붙입니다
       (표시를 빠뜨리는 쪽이 더 큰 잘못입니다). */
    var lab = '<span class="adsl-l">' + esc(r.label || "광고") + '</span>';
    var nm  = '<b class="adsl-n">' + esc(r.provider_name || "") + '</b>';
    if(!have){
      try{ console.warn("[ad] 집행 중인 광고의 업체가 빌드에 없습니다 — " +
        "node tools/pull-providers.js 로 가져오고 다시 올리세요: " +
        r.provider_id); }catch(e){}
      return '<li class="adsl-i">' + lab + nm + '</li>';
    }
    return '<li class="adsl-i"><a class="adsl-a" rel="sponsored nofollow" href="' +
      esc(window.amProviderUrl(have)) + '">' + lab + nm +
      '<span class="adsl-g">업체 보기' +
      (window.icon ? window.icon("arrow", 16) : "") + '</span></a></li>';
  }

  /* 자리 하나를 채웁니다 — ⚠️ 0건이면 **그대로 감춰 둡니다**
     (빈 광고 액자를 두면 미완성 사이트로 읽힙니다 · 절대 규칙 2). */
  function fill(el, all){
    var place = el.getAttribute("data-adslot") || "";
    var key   = el.getAttribute("data-adslot-key") || "";
    var L     = pick(all, place, key);
    if(!L.length){ el.hidden = true; el.innerHTML = ""; return 0; }
    el.innerHTML = '<ul class="adsl">' + L.map(one).join("") + '</ul>';
    el.hidden = false;
    return L.length;
  }

  /* 밖에서 부르는 길 — ⚠️ `/search` 의 지역 광고는 손님이 지역을 고를
     때마다 바뀌므로, 그 화면이 다시 그린 뒤 이것을 부릅니다. 그리는
     코드를 거기 한 벌 더 적지 않습니다 (두 곳에 적으면 조용히 달라집니다). */
  window.amAdFill = function(el, key){
    if(!el) return Promise.resolve(0);
    if(key !== undefined && key !== null) el.setAttribute("data-adslot-key", key);
    if(!window.amAuthAsk) return Promise.resolve(0);
    return window.amAuthAsk().then(function(a){
      if(!a || !a.on || !a.conf) return 0;
      return rows(a).then(function(all){ return fill(el, all); });
    }).catch(function(){ return 0; });
  };

  var slots = document.querySelectorAll("[data-adslot]");
  if(!slots.length || !window.amAuthAsk) return;
  window.amAuthAsk().then(function(a){
    /* ⚠️ 설정이 없으면 **한 줄도 안 그립니다** (손님에게는 아무 말도
       하지 않습니다 — 광고가 없는 것과 같아 보이는 것이 맞습니다). */
    if(!a || !a.on || !a.conf) return;
    return rows(a).then(function(all){
      Array.prototype.forEach.call(slots, function(el){ fill(el, all); });
    });
  }).catch(function(){});
})();
