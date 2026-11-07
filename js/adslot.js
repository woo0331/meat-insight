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
   `hidden` 으로 남고, 감싼 구간은 CSS 의 `:has()` 가 줄째 가립니다. */
/* ⚠️⚠️⚠️ **2026-11-07 (0064) — 소재 그림이 들어왔습니다.** 그 전까지
   이 파일은 **상호 글자만** 띄웠습니다. 담는 칸이 `ad_run` 에 없었기
   때문입니다 (0064 머리말). 지금 그리는 차례는 —
     ① PC · 모바일 소재가 있으면 `<picture>` 로 그립니다 (원본 비율 보존)
     ② 하나만 있으면 그 하나를 두 폭에 씁니다
     ③ 둘 다 없으면 **전과 똑같이** 글자만 그립니다 (칸을 비워 두지
        않습니다 — 빈 액자가 미완성 사이트로 읽힙니다)
   ⚠️ 지시서 B 의 권장 원본은 `js/data/deal.js` 의 `AM_AD_SIZE` **한
   곳**이고 /admin 이 그 줄을 읽어 안내합니다 — 여기 글자로 적지 않습니다.

   ⚠️⚠️⚠️ **클릭 주소 — `rel` 넷을 전부 답니다.**
     sponsored nofollow  돈 받은 링크입니다 (안 달면 검색엔진이 자연
                         링크로 읽고, 적발되면 사이트 전체가 손해를 봅니다)
     noopener noreferrer 새 창으로 여는 바깥 주소는 `window.opener` 로
                         우리 화면을 조작할 수 있습니다 (지시서 B)
   ⚠️ 주소가 **안전한지는 DB 가 가립니다** (0064 의 `ad_run_click_ck`) —
   화면에서만 가리면 꾸러미를 고쳐 지나갑니다. 여기서는 그래도 **한 번
   더** 봅니다 (자물쇠 둘 · 보기가 뚫리는 날의 보험).
   ⚠️⚠️ **우리 주소는 새 창으로 열지 않습니다** — 같은 창에서 갑니다
   (새 창이 쌓이면 뒤로 가기가 안 됩니다).

   ⚠️⚠️ **노출 · 클릭을 셉니다** (`bump_ad` · 0064) — 비로그인 손님도
   셉니다. 사람 정보를 한 글자도 안 보냅니다 (광고 id 와 갈래뿐입니다).
   ⚠️ 실패하면 **조용히 지나갑니다** — 세는 일 때문에 광고가 안 그려지면
   안 됩니다. */
(function(){
  var esc = window.esc;

  /* 한 자리에 몇 줄까지 — ⚠️ 스무 줄이 들어오면 그건 광고가 아니라
     목록입니다. 몇 건 팔렸는지는 운영자가 /admin 에서 봅니다. */
  var MAX = 4;

  var P = null;                       /* 한 번만 읽습니다 */
  var CONF = null;                    /* 공개 버킷 주소를 지으려고 */
  var SEEN = {};                      /* 한 화면에서 같은 광고를 두 번 안 셉니다 */

  /* ⚠️ 차례는 **먼저 사신 분이 먼저**입니다 (보기에 우선순위 칸이
     없습니다 — 없는 칸을 지어내지 않습니다). */
  function rows(a){
    if(P) return P;
    P = fetch(a.conf.url + "/rest/v1/v_ad_live" +
      "?select=id,provider_id,provider_name,place,cat_key,region,label," +
      "advertiser,click_url,img_pc,img_mo,img_alt" +
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

  /* 공개 버킷의 주소 — ⚠️ 버킷이 설정되기 전에는 **빈 글자**를 돌려주고
     화면은 소재 없이 글자만 그립니다 (주소를 지어내지 않습니다). */
  function imgUrl(path){
    if(!path || !CONF || !CONF.pubBucket || !CONF.url) return "";
    return CONF.url + "/storage/v1/object/public/" + CONF.pubBucket + "/" + path;
  }

  /* 광고주 이름 — ⚠️ 적어 두신 것이 있으면 그것, 없으면 업체 상호입니다
     (바깥 광고주를 상호로 적을 수는 없습니다). */
  function who(r){
    return String(r.advertiser || r.provider_name || "");
  }

  /* ⚠️⚠️ **우리 주소인지 바깥 주소인지로 갈립니다** — 바깥만 새 창입니다.
     ⚠️ `//` 로 시작하는 것은 **바깥 주소**입니다 (열린 넘겨주기) — DB 가
     이미 막지만 여기서도 거릅니다. */
  function okUrl(u){
    var v = String(u || "");
    if(!v) return "";
    if(v.indexOf("//") === 0) return "";
    if(v.indexOf("/") === 0) return v;
    if(v.indexOf("https://") !== 0) return "";
    if(v.indexOf("@") >= 0) return "";
    return v;
  }

  /* 그림 — ⚠️ 모바일 소재가 있으면 좁은 폭에서 그것을 씁니다.
     ⚠️⚠️ **원본 비율을 보존합니다** — `width`/`height` 를 모르므로
     CSS 가 `height:auto` 로 두고, 잘라내지 않습니다 (지시서 B).
     ⚠️ `alt` 는 적어 두신 것을 쓰고, 없으면 **광고주 이름 + 광고**
     입니다 (빈 `alt` 는 화면 읽는 기계에 아무 말도 안 합니다). */
  function pic(r){
    var pc = imgUrl(r.img_pc), mo = imgUrl(r.img_mo);
    var one = pc || mo;
    if(!one) return "";
    var alt = String(r.img_alt || "") || (who(r) + " 광고");
    var im = '<img class="adsl-im" src="' + esc(one) + '" alt="' + esc(alt) +
      '" loading="lazy" decoding="async">';
    if(pc && mo)
      return '<picture><source media="(max-width:760px)" srcset="' + esc(mo) +
        '">' + im + '</picture>';
    return im;
  }

  function one(r){
    var have = window.amProvider ? window.amProvider(r.provider_id) : null;
    /* ⚠️ 보기가 내려준 말을 씁니다 — 없으면 그래도 '광고' 는 붙입니다
       (표시를 빠뜨리는 쪽이 더 큰 잘못입니다). */
    var lab = '<span class="adsl-l">' + esc(r.label || "광고") + '</span>';
    var nm  = '<b class="adsl-n">' + esc(who(r)) + '</b>';
    var art = pic(r);
    var body = art ? art + lab : lab + nm;
    var cls  = art ? "adsl-i adsl-has" : "adsl-i";

    /* ⚠️⚠️ 적어 두신 클릭 주소가 먼저입니다 — 없으면 업체 화면입니다. */
    var out = okUrl(r.click_url);
    if(out){
      var away = out.indexOf("/") !== 0;
      return '<li class="' + cls + '"><a class="adsl-a" ' +
        'rel="sponsored nofollow noopener noreferrer"' +
        (away ? ' target="_blank"' : "") +
        ' data-adclick="' + esc(r.id) + '" href="' + esc(out) + '">' + body +
        (art ? "" : '<span class="adsl-g">' +
          (away ? "자세히 보기" : "보러 가기") +
          (window.icon ? window.icon("arrow", 16) : "") + '</span>') +
        '</a></li>';
    }
    /* ⚠️⚠️ **빌드에 없는 업체는 링크를 안 겁니다** — `/pro/<id>` 는
       빌드가 찍는 화면이라, 승인 직후 `pull-providers` 를 안 돌리면 그
       주소가 없습니다 (눌러서 404 로 가는 칸 · 절대 규칙 5). */
    if(!have){
      try{ console.warn("[ad] 집행 중인 광고의 업체가 빌드에 없습니다 — " +
        "node tools/pull-providers.js 로 가져오고 다시 올리시거나, " +
        "/admin 에서 클릭 주소를 적어 주세요: " + r.provider_id); }catch(e){}
      return '<li class="' + cls + '">' + body + '</li>';
    }
    return '<li class="' + cls + '"><a class="adsl-a" ' +
      'rel="sponsored nofollow noopener noreferrer" data-adclick="' + esc(r.id) +
      '" href="' + esc(window.amProviderUrl(have)) + '">' + body +
      (art ? "" : '<span class="adsl-g">업체 보기' +
        (window.icon ? window.icon("arrow", 16) : "") + '</span>') + '</a></li>';
  }

  /* ⚠️⚠️ 세는 문을 부릅니다 — **실패하면 조용히 지나갑니다.**
     ⚠️ 사람 정보를 한 글자도 안 보냅니다 (광고 id 와 갈래뿐입니다). */
  function bump(id, kind){
    if(!CONF || !CONF.url || !id) return;
    var k = kind + ":" + id;
    if(kind === "view"){ if(SEEN[k]) return; SEEN[k] = 1; }
    try{
      fetch(CONF.url + "/rest/v1/rpc/bump_ad", {
        method:"POST", keepalive:true,
        headers: Object.assign({ "content-type":"application/json",
                                 apikey:CONF.anonKey },
                               window.amAuthHeaders ? window.amAuthHeaders() : {}),
        body: JSON.stringify({ p: { ad:id, kind:kind } })
      }).catch(function(){});
    }catch(e){}
  }

  /* ════════════════════════════════════════════════════════════════
     점선 안내 액자 (사장님 시안 · 2026-11-07)

     ⚠️⚠️ 광고가 0건인 자리에 **점선 액자**를 냅니다 — 자리 이름 ·
     무엇을 받는 자리인지 · 권장 사이즈. 시안이 그렇게 그려져 있고
     사장님이 그대로 만들라고 하셨습니다.
     ⚠️ 지시서 B 는 "공개 화면에서는 숨김" 이라고 적었습니다 — 다른
     말이라 **끄는 길을 한 줄**로 두었습니다 (`site.js` 의
     `adPlaceholder`). `false` 면 전처럼 줄째 사라집니다.
     ⚠️⚠️ **적는 말은 `AM_AD_PH` 한 곳**입니다 — 여기 글자로 박으면
     /admin 의 안내와 조용히 어긋납니다. 모르는 자리는 `amAdPh()` 가
     **null** 을 돌려주고, 그러면 액자를 **안 냅니다** (분류 · 지역
     광고는 시안에 액자가 없습니다).
     ⚠️ 권장 사이즈도 `AM_AD_SIZE` 에서 옵니다 — 시안은 프리미엄 ·
     하단에만 적어 두었으므로 `size` 가 참인 자리만 적습니다.
     ⚠️⚠️ 이 액자는 **설정(Supabase)과 무관하게** 섭니다 — 로그인이
     열리기 전에도 사장님이 자리를 보셔야 합니다. 그래서 자리를 켜는
     일은 아래에서 **가장 먼저** 합니다.
     ════════════════════════════════════════════════════════════════ */
  function phOn(){
    var B = window.WOW_BIZ || {};
    return B.adPlaceholder === true;
  }
  function ph(el){
    if(!phOn()) return 0;
    var place = el.getAttribute("data-adslot") || "";
    var f = window.amAdPh ? window.amAdPh(place) : null;
    if(!f) return 0;
    var sz = (f.size && window.amAdSize) ? window.amAdSize(place) : null;
    el.innerHTML = '<div class="adph">' +
      '<span class="adph-l">광고</span>' +
      '<b class="adph-n">' + esc(f.name) + '</b>' +
      '<span class="adph-d">' + esc(f.lead) + '</span>' +
      (sz ? '<span class="adph-s">권장 크기 — PC ' + esc(sz.pc) +
            ' · 모바일 ' + esc(sz.mo) + '</span>' : '') +
    '</div>';
    el.hidden = false;
    return 1;
  }
  /* 설정이 없어도 · 광고가 0건이어도 자리를 세웁니다
     ⚠️⚠️⚠️ **이름을 `window.` 에 걸지 않습니다** — 처음에
     `window.amAdPlace` 로 지었다가 `js/data/deal.js` 의 **같은 이름**
     (광고 자리 이름을 찾는 함수)에 덮여서 액자가 조용히 안 그려졌습니다.
     에러도 없고 `typeof` 는 function 이라 멀쩡해 보였습니다 (작업 기억의
     "같은 이름을 두 번 선언하면 나중 것이 이깁니다" 그 자리). */
  function placeAll(){
    var L = document.querySelectorAll("[data-adslot]");
    Array.prototype.forEach.call(L, function(el){
      if(!el.innerHTML) ph(el);
    });
  }

  /* 자리 하나를 채웁니다 — ⚠️ 0건이면 **그대로 감춰 둡니다**
     (빈 광고 액자를 두면 미완성 사이트로 읽힙니다 · 절대 규칙 2). */
  function fill(el, all){
    var place = el.getAttribute("data-adslot") || "";
    var key   = el.getAttribute("data-adslot-key") || "";
    var L     = pick(all, place, key);
    /* ⚠️⚠️ 0건이면 **점선 액자**를 냅니다 (사장님 시안) — `site.js` 의
       `adPlaceholder` 가 `false` 면 전처럼 줄째 감춥니다 (지시서 B). */
    if(!L.length){ el.innerHTML = ""; if(!ph(el)) el.hidden = true; return 0; }
    el.innerHTML = '<ul class="adsl">' + L.map(one).join("") + '</ul>';
    el.hidden = false;
    L.forEach(function(r){ bump(r.id, "view"); });
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
      CONF = a.conf;
      return rows(a).then(function(all){ return fill(el, all); });
    }).catch(function(){ return 0; });
  };

  /* ⚠️⚠️⚠️ **스크립트 차례에 기대지 않습니다.** 이 파일은 `data/deal.js`
     (액자에 적는 말)와 `data/site.js`(켜고 끄는 한 줄)를 읽는데, 그
     둘이 **이 파일보다 뒤에 실리는 화면**이 있습니다. 바로 돌면 그날
     액자가 **조용히 안 그려집니다**(에러도 없습니다 — 실제로 그랬습니다).
     그래서 문서를 다 읽은 뒤에 돕니다. */
  function go(){
    var slots = document.querySelectorAll("[data-adslot]");
    if(!slots.length) return;

    /* ⚠️⚠️ 점선 액자를 **가장 먼저** 세웁니다 — 설정(Supabase)이 없어도 ·
       로그인이 열리기 전에도 사장님이 자리를 보셔야 합니다. 광고가
       들어오면 `fill()` 이 그 자리를 배너로 **바꿔 끼웁니다**. */
    placeAll();

    if(!window.amAuthAsk) return;

    /* ⚠️ 클릭은 **눌릴 때** 셉니다 — 넘겨주기를 막지 않습니다
       (`keepalive` 로 보내므로 화면이 바뀌어도 갑니다). */
    document.addEventListener("click", function(e){
      var a = e.target.closest ? e.target.closest("a[data-adclick]") : null;
      if(a) bump(a.getAttribute("data-adclick"), "click");
    });

    window.amAuthAsk().then(function(a){
      /* ⚠️ 설정이 없으면 광고를 **한 줄도 안 그립니다** (손님에게는 아무
         말도 하지 않습니다 — 광고가 없는 것과 같아 보이는 것이 맞습니다).
         ⚠️ 점선 액자는 위에서 이미 섰습니다. */
      if(!a || !a.on || !a.conf) return;
      CONF = a.conf;
      return rows(a).then(function(all){
        Array.prototype.forEach.call(slots, function(el){ fill(el, all); });
      });
    }).catch(function(){});
  }
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", go);
  }else{ go(); }
})();
