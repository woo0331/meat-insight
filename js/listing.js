/* ════════════════════════════════════════════════════════════════════
   중고 직거래 매물 — /cat/used 에서만 돕니다 (DB 는 0056)

   ⚠️⚠️⚠️ **왜 이 화면이 생겼나.** `/cat/used` 가 2026-11-06 까지 "회원
   끼리 직접 사고파는 자리입니다" · "첫 매물이 올라오면 여기에 바로
   보입니다" 라고 적어 놓고, 매물을 올리는 **표도 · 문도 · 화면도** 한
   줄도 없었습니다 — 영원히 안 오는 것을 기다리라고 적은 것입니다.
   그날 글을 사실대로 고쳤고, 0056 과 이 파일이 그 기능을 세웁니다.

   ⚠️⚠️ **목록은 브라우저가 그립니다** — 빌드가 못 찍습니다. 매물은
   회원이 아무 때나 올리고 내리는 자리라, 빌드 때 찍으면 배포할 때마다만
   바뀝니다. 그래서 **설명은 빌드가**(크롤러 · 자바스크립트 꺼진 분이
   읽을 몫), **목록은 브라우저가** 그립니다.

   ⚠️⚠️ **접수가 안 되면 양식을 열지 않습니다** (절대 규칙 5). Supabase
   설정이 없거나 보유 기간(`listingKeep`)이 비면 다 적고 누른 뒤에
   실패합니다 — 그 전에 막습니다 (제15조 제2항 — 법이 요구하는 것을 안
   보여 주고 동의를 받을 수는 없습니다).

   ⚠️⚠️⚠️ **연락처는 여기서 한 번도 안 보입니다.** 목록이 읽는
   `v_listing_open` 에는 연락처 칸이 **아예 없습니다**. 받아들여진 뒤
   서로 **따로 동의**해야 오가고, 그 자리는 `/my` 입니다 (0056 · 제17조).

   ⚠️⚠️ **골프올인원은 거래 당사자가 아닙니다** (전자상거래법 제20조).
   돈이 우리를 지나가지 않고 물건을 우리가 보지 않습니다 — 에스크로도
   안전거래도 **없습니다**. 있다고 적으면 절대 규칙 5 입니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var list = document.getElementById("lslist");
  if(!list || !window.amAuthAsk) return;

  var esc  = window.esc;
  var KEEP = (window.WOW_BIZ || {}).listingKeep || "";
  var REG  = {};
  (window.AM_REGIONS || []).forEach(function(r){ REG[r.key] = r.name; });
  function rgName(k){ return REG[k] || k; }

  /* ⚠️⚠️ **물건 종류는 `js/data/catalog.js` 에서 끌어옵니다** — 여기
     일곱을 글자로 박으면 하위가 느는 날 두 곳이 어긋나고, 그때 화면은
     보내는데 DB 가 거절합니다. `pv` 가 false 인 하위가 **회원끼리만**
     쓰는 것입니다 (업체가 하는 매입 견적 · 위탁판매는 빼야 합니다 —
     그 둘은 업체를 찾는 자리이고 매물이 아닙니다). */
  function subs(){
    var c = window.amCat ? window.amCat("used") : null;
    return (window.amCatItems ? window.amCatItems(c) : []).filter(function(it){
      return it.pv === false;
    });
  }
  function subName(k){
    var L = subs();
    for(var i = 0; i < L.length; i++) if(L[i].key === k) return L[i].name;
    /* ⚠️ 모르는 키는 **키 그대로** 냅니다 (지어내지 않습니다) */
    return String(k || "");
  }

  /* ── 거르개 — 물건 종류 · 지역 · 택배 ─────────────────────────────
     ⚠️⚠️ **거르는 것은 서버입니다.** 쉰 줄만 받아 와서 화면에서 걸러
     내면, 서울 매물이 쉰 줄 밖에 있을 때 **0건으로 보입니다**(에러 없이).
     조인 목록에서 적어 둔 그 줄입니다. */
  /* ⚠️⚠️ `p` 는 **가격대 열쇠**입니다 (금액이 아닙니다) — 경계와 이름은
     `js/data/deal.js` 의 `AM_LST_PRICE` 한 곳이고, 숫자를 주소에 적게
     두면 손님마다 다른 구간이 생겨 현황표의 칸과 못 맞춥니다. */
  /* ⚠️⚠️ `br` 은 브랜드 **글자 그대로**입니다(키가 따로 없습니다) —
     고르개 목록은 `js/data/deal.js` 의 `AM_LST_BRAND` 한 곳이고, DB 에는
     그 글자가 담깁니다. 목록을 DB 에 박으면 늘어나는 날 두 곳이 어긋납니다.
     ⚠️ `o` 는 정렬 열쇠입니다 — 보내는 글자(`price.asc`)는 `AM_LST_SORT`
     한 곳이고 주소에는 **열쇠**만 적습니다(칸 이름이 주소에 박히지 않게).
     ⚠️ `q` 는 제목 찾기입니다 — 거르는 것은 **서버**(`title=ilike.*…*`)입니다. */
  var F = { sub:"", rg:"", ship:false, p:"", br:"", o:"", q:"", cd:"" };
  /* ⚠️ 공개 버킷 주소를 지으려면 설정이 필요합니다 — 없으면 사진 없이
     그립니다(아이콘 타일). 주소를 짓는 규칙은 `amPubUrl()` 한 곳입니다. */
  var CONF = null;
  /* ⚠️ 0058 — 로그인한 분에게만 "조건 저장" 길을 냅니다. 로그인 전에
     그리면 눌러서 로그인 화면으로 갔다가 돌아와도 **저장된 것이 없는**
     꼴이 됩니다 (절대 규칙 5). */
  var SIGNED = false;
  /* ⚠️⚠️ 한 번에 받아 오는 줄 수 — **한 곳**입니다. 화면이 이 수에 닿으면
     "N건" 이 아니라 **"N건 이상"** 이라고 적습니다 (세어 본 값이 아니라
     받아 온 값입니다 · 절대 규칙 1). 두 곳에 적으면 한쪽만 고치는 날
     "50건" 이라고 말해 놓고 실제로는 더 있는 꼴이 됩니다. */
  var LIMIT = 50;

  function readUrl(){
    try{
      var u = new URLSearchParams(location.search);
      F.sub  = (u.get("s")  || "").trim();
      F.rg   = (u.get("rg") || "").trim();
      F.ship = u.get("sh") === "1";
      /* ⚠️ 모르는 가격대 키는 **버립니다** — 주소를 손으로 고쳐 오시면
         아무것도 안 걸리는 화면이 되는데 "매물이 없다" 로 읽힙니다. */
      var pv = (u.get("p") || "").trim();
      F.p = (pv && window.amLstPriceBand && window.amLstPriceBand(pv)) ? pv : "";
      /* ⚠️ 브랜드는 **고르개에 있는 글자만** 받습니다 — 주소를 손으로
         고쳐 오시면 아무것도 안 걸리는 화면이 되는데 "매물이 없다" 로
         읽힙니다. (직접 적으신 브랜드는 고르개에 없으므로 주소로
         좁힐 수 없습니다 — 그건 맞는 동작입니다.) */
      var bv = (u.get("br") || "").trim();
      F.br = ((window.AM_LST_BRAND || []).indexOf(bv) >= 0) ? bv : "";
      var ov = (u.get("o") || "").trim();
      F.o = (ov && window.amLstSort && window.amLstSort(ov).key === ov) ? ov : "";
      F.q = (u.get("q") || "").trim().slice(0, 40);
      /* ⚠️ 모르는 상태 키는 버립니다 — 값은 `AM_LST_COND` 한 곳입니다 */
      var cv = (u.get("cd") || "").trim();
      F.cd = (window.amLstCond && window.amLstCond(cv)) ? cv : "";
    }catch(e){}
  }
  function writeUrl(){
    try{
      var qs = [];
      if(F.sub)  qs.push("s="  + encodeURIComponent(F.sub));
      if(F.rg)   qs.push("rg=" + encodeURIComponent(F.rg));
      if(F.ship) qs.push("sh=1");
      if(F.p)    qs.push("p="  + encodeURIComponent(F.p));
      if(F.br)   qs.push("br=" + encodeURIComponent(F.br));
      if(F.o)    qs.push("o="  + encodeURIComponent(F.o));
      if(F.q)    qs.push("q="  + encodeURIComponent(F.q));
      if(F.cd)   qs.push("cd=" + encodeURIComponent(F.cd));
      history.replaceState(null, "",
        location.pathname + (qs.length ? "?" + qs.join("&") : ""));
    }catch(e){}
  }

  /* ── 거르개 — ⚠️⚠️ PC 는 **왼쪽 레일** · 폰은 **「필터」 단추 하나**
     ─────────────────────────────────────────────────────────────
     ⚠️⚠️⚠️ 2026-11-08 까지 거르개가 폰에서도 **늘 펼쳐져** 있었습니다 —
     고르개 넷이 화면 위를 차지해 매물이 아래로 밀렸습니다. 알아본 다섯
     곳(2nd Swing · SidelineSwap · 번개장터 · 당근 · 골마켓)이 전부
     폰에서는 단추 하나로 모읍니다.
     ⚠️ 가르는 것은 **CSS 한 곳**입니다(`.lsw` 의 1000px 규칙) — 화면이
     폭을 재서 갈래를 정하면 돌려 보는 폭마다 다른 코드가 돕니다. */
  function brandOpts(){
    return (window.AM_LST_BRAND || []).map(function(n){
      return '<option value="' + esc(n) + '"' +
        (F.br === n ? " selected" : "") + '>' + esc(n) + '</option>';
    }).join("");
  }
  function sortOpts(){
    return (window.AM_LST_SORT || []).map(function(x){
      return '<option value="' + esc(x.key) + '"' +
        (F.o === x.key ? " selected" : "") + '>' + esc(x.name) + '</option>';
    }).join("");
  }
  /* 맨 위 줄 — 찾기 · 정렬 · (폰에서만) 필터 단추 */
  function topBar(){
    var n = nowChips().length;
    return '<div class="lsf-top">' +
      '<div class="lsf-q">' + window.icon("search", 19) +
        '<input id="lf-q" type="search" maxlength="40" value="' + esc(F.q) + '" ' +
        'placeholder="찾으시는 물건을 적어 보세요" aria-label="매물 찾기"></div>' +
      /* ⚠️ 폰에서만 보입니다(CSS) — PC 에는 레일이 늘 서 있습니다 */
      '<button type="button" class="lsf-btn" id="lf-open" aria-expanded="false">' +
        window.icon("menu", 19) + '필터' +
        (n ? ' <b>' + esc(String(n)) + '</b>' : "") + '</button>' +
      '<label class="sr" for="lf-o">정렬</label>' +
      '<select id="lf-o" class="lsf-sel">' + sortOpts() + '</select>' +
    '</div>';
  }
  /* 고른 조건 — ⚠️ 칩 하나하나를 **지울 수 있게** 둡니다 */
  function chipRow(){
    var cs = nowChips();
    if(!cs.length) return "";
    return '<div class="lsf-chips">' + cs.map(function(c){
      return '<button type="button" class="lsf-chip" data-off="' + esc(c[0]) + '">' +
        esc(c[1]) + ' ' + window.icon("close", 13) + '</button>';
    }).join("") +
    /* ⚠️ **id 를 달지 않습니다** — 0건 상자도 같은 단추를 내므로 둘이 같이
       있을 때 같은 id 가 둘이 됩니다 (조인의 동의 상자에서 겪은 자리). */
    '<button type="button" class="lsf-clear">조건 모두 지우기</button>' +
    '</div>';
  }
  /* 왼쪽 레일(PC) · 아래에서 올라오는 시트(폰) — **같은 markup** 입니다 */
  function railHtml(){
    var sb = subs().map(function(it){
      return '<option value="' + esc(it.key) + '"' +
        (F.sub === it.key ? " selected" : "") + '>' + esc(it.name) + '</option>';
    }).join("");
    /* ⚠️⚠️ **묶음 여섯을 먼저** 냅니다 — 다른 화면이 묶음으로 보내므로,
       안 내면 그리로 들어온 분의 고르개가 "전국" 으로 보입니다
       (걸러져 있는데 안 걸린 것처럼 보이는 꼴). */
    var rg = (window.AM_REGION_ZONES || []).map(function(z){
      return '<option value="' + esc(z.key) + '"' +
        (F.rg === z.key ? " selected" : "") + '>' +
        esc(window.amZoneLong ? window.amZoneLong(z.key) : z.name) + '</option>';
    }).join("");
    rg = '<optgroup label="지역 묶음">' + rg + '</optgroup>' +
         '<optgroup label="시 · 도">' + (window.AM_REGIONS || []).map(function(r){
      return '<option value="' + esc(r.key) + '"' +
        (F.rg === r.key ? " selected" : "") + '>' + esc(r.name) + '</option>';
    }).join("") + '</optgroup>';
    var pb = (window.AM_LST_PRICE || []).map(function(x){
      return '<option value="' + esc(x.key) + '"' +
        (F.p === x.key ? " selected" : "") + '>' + esc(x.name) + '</option>';
    }).join("");
    var cd = (window.AM_LST_COND || []).map(function(c){
      return '<option value="' + esc(c.key) + '"' +
        (F.cd === c.key ? " selected" : "") + '>' + esc(c.name) + '</option>';
    }).join("");
    return '<div class="lsf-h"><b>필터</b>' +
      '<button type="button" class="lsf-x" id="lf-close" aria-label="필터 닫기">' +
      window.icon("close", 16) + '</button></div>' +
    '<form class="jform lsf-b" id="lsfil">' +
      /* ⚠️⚠️ **브랜드가 첫 칸입니다** — 알아본 다섯 곳이 전부 그렇습니다.
         0056 은 이 칸을 아예 안 받아서 "타이틀리스트 아이언" 을 찾는 분이
         아이언 전부를 밀어 내려가야 했습니다(0068 이 칸을 더했습니다). */
      '<div class="jrow"><label for="lf-br">브랜드</label>' +
        '<select id="lf-br"><option value="">전체 브랜드</option>' +
        brandOpts() + '</select></div>' +
      '<div class="jrow"><label for="lf-s">물건 종류</label>' +
        '<select id="lf-s"><option value="">전체</option>' + sb + '</select></div>' +
      '<div class="jrow"><label for="lf-rg">지역</label>' +
        '<select id="lf-rg"><option value="">전국</option>' + rg + '</select></div>' +
      /* ⚠️ 구간은 `AM_LST_PRICE` 한 곳이고 **아래를 닫고 위를 엽니다**
         (gte · lt) — 둘 다 닫으면 딱 10만원짜리가 두 칸에 다 걸립니다. */
      '<div class="jrow"><label for="lf-p">가격대</label>' +
        '<select id="lf-p"><option value="">전체 가격</option>' + pb + '</select></div>' +
      '<div class="jrow"><label for="lf-cd">물건 상태</label>' +
        '<select id="lf-cd"><option value="">전체 상태</option>' + cd + '</select></div>' +
      '<div class="jrow jrow-full">' +
        '<label class="jchk"><input type="checkbox" id="lf-sh"' +
          (F.ship ? " checked" : "") + '><span>택배도 되는 것만</span></label>' +
        '<p class="jhint">직거래가 기본입니다. 택배는 올리신 분이 ' +
        '된다고 적어 주신 경우입니다 — 골프올인원이 보내 드리지는 않습니다.</p>' +
      '</div>' +
    '</form>' +
    /* ⚠️⚠️ 0058 — 글과 주소는 `js/data/deal.js` 의 amWatchLink() 한
       곳입니다 (분류 화면 셋이 같은 말을 해야 합니다). */
    (SIGNED && window.amWatchLink ? window.amWatchLink("listing") : "") +
    /* ⚠️ 폰 시트의 바닥 — PC 에서는 CSS 가 가립니다 */
    '<div class="lsf-f">' +
      '<button type="button" class="btn btn-line lsf-reset">지우기</button>' +
      '<button type="button" class="btn btn-deep lsf-done">결과 보기</button>' +
    '</div>';
  }

  /* ── 카드 — ⚠️⚠️ **사진이 먼저입니다** ────────────────────────────
     ⚠️⚠️⚠️ 2026-11-08 까지 카드가 글자뿐이었습니다. 알아본 다섯 곳 가운데
     사진 없이 중고채를 파는 곳은 **하나도 없었습니다** — 0056 이 사진을
     담는 표를 안 만든 자리이고 0068 이 만들었습니다.
     ⚠️⚠️ 사진이 **0장이면 아이콘 타일**입니다 — 남의 사진이나 분류 사진을
     깔면 그 매물인 것처럼 보입니다(절대 규칙 1 · 업체 카드와 같은 규칙).
     ⚠️ 버킷이 꺼져 있으면 `amPubUrl()` 이 빈 글자를 돌려주므로 역시
     아이콘 타일입니다 — 주소를 지어내지 않습니다. */
  function card(r){
    var u = window.amPubUrl ? window.amPubUrl(CONF, r.thumb) : "";
    var n = Number(r.photo_n) || 0;
    var ph = u
      ? '<img class="lsc-im" src="' + esc(u) + '" alt="' + esc(r.title) +
        '" loading="lazy" decoding="async">' +
        (n > 1 ? '<span class="lsc-n">사진 ' + esc(String(n)) + '</span>' : "")
      : '<span class="lsc-no">' + window.icon("cart", 26) + '사진 없음</span>';
    return '<li class="lsc">' +
      '<div class="lsc-ph">' + ph +
        '<span class="lsc-cd">' + esc(window.amLstCondName(r.cond)) + '</span>' +
      '</div>' +
      '<div class="lsc-i">' +
        /* ⚠️ 브랜드가 비면 **그 자리를 빼고** 종류만 적습니다 (절대 규칙 2) */
        '<p class="lsc-br">' + esc(r.brand ? (r.brand + " · " + subName(r.sub))
                                           : subName(r.sub)) + '</p>' +
        '<h3 class="lsc-t">' + esc(r.title) + '</h3>' +
        /* ⚠️⚠️ **0 은 "무료" 입니다** — `||` 를 쓰면 0원이 사라집니다.
           세는 자리는 `amLstPrice()` 한 곳입니다. */
        '<p class="lsc-p">' + esc(window.amLstPrice(r.price)) + '</p>' +
        /* ⚠️ "택배" 한 글자로 줄이지 않습니다 — 그러면 택배가 된다는
           뜻인지 택배로만 보낸다는 뜻인지 알 수 없습니다 */
        '<p class="lsc-m">' + esc(rgName(r.region)) +
          (r.ship ? ' · 택배 가능' : ' · 직거래만') +
          (Number(r.ask_n) > 0 ? ' · 문의 ' + esc(String(r.ask_n)) : "") + '</p>' +
        '<button type="button" class="btn btn-sm btn-pt lsc-go" data-id="' +
          esc(r.id) + '">사겠다고 문의하기</button>' +
      '</div>' +
    '</li>';
  }

  /* ── 보내기 — ⚠️ 거절한 말을 그대로 보여 줍니다 ─────────────────── */
  function call(a, name, args){
    return fetch(a.conf.url + "/rest/v1/rpc/" + name, {
      method:"POST",
      headers: Object.assign({ "content-type":"application/json",
                               apikey: a.conf.anonKey },
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

  function load(a){
    /* ⚠️⚠️ `thumb` 은 **목록 카드의 첫 사진**입니다(0068) — 이것이 없으면
       카드마다 사진을 따로 물어보게 되어 스무 장이면 호출이 스무 번 늘고,
       그동안 카드가 비어 있어 "사진 없는 장터" 로 보입니다. */
    var qs = ["select=id,sub,region,ship,title,body,price,cond,ask_n," +
              "brand,photo_n,thumb", "limit=" + LIMIT];
    /* ⚠️⚠️ **보내는 글자는 `AM_LST_SORT` 한 곳**입니다 — 화면이
       `price.asc` 를 따로 적으면 칸 이름이 바뀌는 날 **조용히** 최신순으로
       보입니다(정렬이 안 되는 것은 에러가 안 납니다). */
    var so = window.amLstSort ? window.amLstSort(F.o) : null;
    qs.push("order=" + encodeURIComponent(so ? so.q : "created_at.desc"));
    if(F.sub)  qs.push("sub=eq."    + encodeURIComponent(F.sub));
    /* ⚠️ 브랜드는 **글자 그대로** 견줍니다 (키가 따로 없습니다) */
    if(F.br)   qs.push("brand=eq."  + encodeURIComponent(F.br));
    if(F.cd)   qs.push("cond=eq."   + encodeURIComponent(F.cd));
    /* ⚠️⚠️ 찾기도 **서버**가 합니다 — 쉰 줄만 받아 화면에서 찾으면
       그 쉰 줄 밖의 매물이 영영 안 나옵니다.
       ⚠️ `*` 는 PostgREST 의 자리표이고 손님 글자는 그대로 갑니다 —
       `%` · `_` 를 적으셔도 글자로 찾아지지는 않습니다(그건 맞는 동작이고,
       못 막는 것을 막는다고 적지 않습니다). */
    if(F.q)    qs.push("title=ilike." + encodeURIComponent("*" + F.q + "*"));
    /* ⚠️⚠️⚠️ **묶음(수도권)과 시 · 도(서울)를 한 열쇠로 받습니다** —
       현황표의 칸은 묶음을 보내고 거르개는 시 · 도를 보냅니다. 푸는
       규칙은 `amRegionsFor()` 한 곳이고, 모르는 키면 **아무것도 안
       겁니다**(틀린 키로 0건을 내면 손님은 "매물이 없다" 로 읽습니다). */
    var rs = window.amRegionsFor ? window.amRegionsFor(F.rg) : [];
    if(rs.length) qs.push("region=in.(" + rs.map(encodeURIComponent).join(",") + ")");
    if(F.ship) qs.push("ship=is.true");
    /* ⚠️⚠️ **거르는 것은 서버입니다** — 쉰 줄만 받아 화면에서 거르면
       조건에 맞는 매물이 쉰 줄 밖에 있을 때 0건으로 보입니다.
       ⚠️ `from` 이 null 인 첫 칸은 아래쪽을 안 겁니다 — **0원(무료로
       나눔)이 거기 들어가야** 하기 때문입니다 (0 을 기다리는 자리). */
    var bd = window.amLstPriceBand ? window.amLstPriceBand(F.p) : null;
    if(bd){
      if(bd.from !== null && bd.from !== undefined)
        qs.push("price=gte." + encodeURIComponent(String(bd.from)));
      if(bd.to !== null && bd.to !== undefined)
        qs.push("price=lt."  + encodeURIComponent(String(bd.to)));
    }
    return fetch(a.conf.url + "/rest/v1/v_listing_open?" + qs.join("&"), {
      headers: Object.assign({ apikey:a.conf.anonKey },
                             window.amAuthHeaders ? window.amAuthHeaders() : {})
    }).then(function(r){ return r.ok ? r.json() : []; });
  }

  /* 지금 걸린 가격대 — ⚠️ 거르는 자리와 **같은 함수**를 읽습니다
     (두 곳에 적으면 적힌 말과 실제로 거르는 구간이 어긋납니다). */
  function bd0(){
    return window.amLstPriceBand ? window.amLstPriceBand(F.p) : null;
  }
  /* 지금 걸린 조건을 **칩 한 줄**로 — ⚠️ 거르는 자리와 같은 값을 읽습니다.
     ⚠️⚠️ Baymard 가 "사이트의 20% 가 고른 조건을 안 보여 준다" 고 짚은
     자리입니다 — 무엇으로 좁혔는지가 안 보이면 0건을 "매물이 없다" 로
     읽습니다. */
  function nowChips(){
    var out = [];
    if(F.q)    out.push(["q",   '"' + F.q + '"']);
    if(F.sub)  out.push(["sub", subName(F.sub)]);
    if(F.br)   out.push(["br",  F.br]);
    if(F.rg)   out.push(["rg",  window.amRegionLabel ? window.amRegionLabel(F.rg) : rgName(F.rg)]);
    if(F.cd)   out.push(["cd",  window.amLstCondName(F.cd)]);
    if(bd0())  out.push(["p",   bd0().name]);
    if(F.ship) out.push(["sh",  "택배 가능"]);
    return out;
  }
  function nowBits(){
    var b = [];
    if(F.sub)  b.push(subName(F.sub));
    if(F.br)   b.push(F.br);
    if(F.rg)   b.push(window.amRegionLabel ? window.amRegionLabel(F.rg) : rgName(F.rg));
    if(F.cd)   b.push(window.amLstCondName(F.cd));
    if(F.ship) b.push("택배 가능");
    if(bd0()) b.push(bd0().name);
    return b;
  }

  function paint(a, rows){
    var nl = document.getElementById("lsnow");
    if(nl){
      nl.hidden = false;
      /* ⚠️ **조건을 여기 다시 적지 않습니다** — 바로 위 칩 한 줄이 같은
         말을 합니다(찍어 보니 두 줄이 같은 글이었습니다). 여기는 **센
         수**만 적습니다. */
      nl.textContent = "매물 " + rows.length +
        (rows.length >= LIMIT ? "건 이상" : "건");
    }
    if(!rows.length){
      /* ⚠️⚠️ **"아직 아무도 안 올렸다" 와 "조건에 맞는 것이 없다" 는
         다른 말입니다** — 같은 말로 적으면 손님이 조건을 지워 볼 생각을
         못 합니다. ⚠️ 0건이어도 막다른 길로 두지 않습니다 (절대 규칙 2). */
      list.innerHTML = nowBits().length
        ? '<div class="none">' +
          '<h3>조건에 맞는 매물이 없습니다.</h3>' +
          '<p>조건을 넓혀 보시거나, 가지고 계신 것을 올려 보세요.</p>' +
          '<div class="none-b">' +
            /* ⚠️ 눌림은 **감싼 자리에서 받습니다**(`bindBar`) — 여기서
               따로 달면 지우는 조건이 두 곳이 되고, 실제로 앞 판은
               종류 · 지역 · 택배 셋만 지워 브랜드 · 가격대 · 찾는 말이
               그대로 걸린 채 "지웠습니다" 가 됐습니다. */
            '<button type="button" class="btn btn-line lsf-clear">조건 지우기</button>' +
          '</div></div>'
        : '<div class="none">' +
          '<h3>아직 올라온 매물이 없습니다.</h3>' +
          '<p>첫 매물을 올려 보세요. 사진 없이 글만으로도 올리실 수 있습니다.</p>' +
        '</div>';
      return;
    }
    list.innerHTML = '<ul class="lsc-g">' + rows.map(card).join("") + '</ul>';
    Array.prototype.forEach.call(list.querySelectorAll(".lsc-go"), function(b){
      b.addEventListener("click", function(){
        if(!a.signedIn){ window.location.href = window.amLoginUrl
          ? window.amLoginUrl(window.location.pathname) : "/login"; return; }
        var li = b.closest(".lsc");
        if(li.querySelector("#lsaf")){ li.querySelector("#lsaf").remove(); return; }
        li.insertAdjacentHTML("beforeend",
          askForm(b.getAttribute("data-id"), li.querySelector("h3").textContent));
        li.querySelector(".lsaf-x").addEventListener("click", function(){
          li.querySelector("#lsaf").remove();
        });
        li.querySelector("#lsaf").addEventListener("submit", function(e){
          e.preventDefault();
          var f = e.target, msg = li.querySelector("#lsmsg2");
          var btn = f.querySelector('button[type="submit"]');
          btn.disabled = true;
          msg.hidden = false; msg.textContent = "보내는 중입니다…";
          call(a, "ask_listing", {
            listing_id: f.getAttribute("data-id"),
            msg: f.msg.value, contact: f.contact.value,
            /* ⚠️ 동의 시각은 **누른 그 순간**입니다 (연 시각이 아닙니다) */
            agree_at: new Date().toISOString()
          }).then(function(){
            li.innerHTML = '<div class="none">' +
              '<h3>문의를 보냈습니다.</h3>' +
              /* ⚠️⚠️ 문장 한가운데 링크를 박지 않습니다 (높이 16px) —
                 문단 끝에 **단추**로 냅니다. */
              '<p>올리신 분이 보고 받아들이시면 연락처를 주고받으실 수 ' +
              /* ⚠️ 지킬 수 없는 약속을 하지 않습니다 */
              '있습니다. 언제까지라고 약속드리지는 않습니다.</p>' +
              '<a class="btn btn-pt" href="/my">내 정보에서 보기</a></div>';
          }).catch(function(err){
            btn.disabled = false;
            msg.textContent = String((err && err.message) || "보내지 못했습니다.");
          });
        });
      });
    });
  }

  /* ── 뼈대 ──────────────────────────────────────────────────────────
     ⚠️⚠️ **한 번만** 세웁니다 — 거르개를 고칠 때마다 다시 그리면 찾는
     칸에 글을 적는 동안 글자가 사라집니다 (칸이 새로 그려지므로 초점도
     같이 날아갑니다). 그래서 **다시 그리는 자리를 갈라** 두었습니다 —
     `syncRail()`(고르개의 값) · `syncChips()`(고른 조건 칩 · 단추의 수).
     ⚠️ `#lslist` 는 빌드가 찍어 둔 자리입니다 — **지우지 않고 옮깁니다**
     (지우고 새로 만들면 `amShut()` 이 집던 자리가 사라집니다). */
  function mountBar(){
    var w = document.getElementById("lswrap");
    if(w) return;
    w = document.createElement("div");
    w.id = "lswrap"; w.className = "lsw";
    list.parentNode.insertBefore(w, list);

    var rail = document.createElement("aside");
    rail.id = "lsrail"; rail.className = "lsf-rail";
    rail.setAttribute("aria-label", "매물 거르개");

    var main = document.createElement("div");
    main.id = "lsmain"; main.className = "lsf-main";
    var bar = document.createElement("div");
    bar.id = "lsbar";
    bar.innerHTML = topBar() + '<div id="lschips"></div>' +
      '<p class="jnf-n" id="lsnow" hidden></p>';
    main.appendChild(bar);
    main.appendChild(list);          /* ⚠️ 옮깁니다 (새로 만들지 않습니다) */

    /* ⚠️ 폰에서 시트가 열린 동안 뒤를 덮습니다 — PC 에서는 CSS 가 가립니다 */
    var sc = document.createElement("div");
    sc.id = "lsscrim"; sc.className = "lsf-scrim"; sc.hidden = true;

    w.appendChild(rail); w.appendChild(main); w.appendChild(sc);
    syncRail(); syncChips();
  }
  function syncRail(){
    var r = document.getElementById("lsrail");
    if(r) r.innerHTML = railHtml();
  }
  /* ⚠️ 칩과 **단추에 적힌 수**를 같이 고칩니다 — 폰에서는 레일이 접혀
     있어서, 그 수가 지금 몇 개로 좁혔는지 말해 주는 유일한 자리입니다. */
  function syncChips(){
    var c = document.getElementById("lschips");
    if(c) c.innerHTML = chipRow();
    var o = document.getElementById("lf-open");
    if(o){
      var n = nowChips().length;
      o.innerHTML = window.icon("menu", 19) + "필터" +
        (n ? ' <b>' + esc(String(n)) + '</b>' : "");
    }
  }
  /* 폰의 아래에서 올라오는 시트 — ⚠️ 가르는 것은 **CSS 한 곳**입니다 */
  function sheet(on){
    var w = document.getElementById("lswrap");
    var o = document.getElementById("lf-open");
    var sc = document.getElementById("lsscrim");
    if(!w) return;
    if(on) w.classList.add("lsf-on"); else w.classList.remove("lsf-on");
    if(o) o.setAttribute("aria-expanded", on ? "true" : "false");
    if(sc) sc.hidden = !on;
  }
  /* ⚠️⚠️ 지우는 조건은 **한 곳**입니다 — 칩 지우기 · 「조건 모두 지우기」 ·
     0건 상자의 단추 셋이 같은 줄을 부릅니다. 앞 판은 그 셋이 따로 적혀
     있어 하나는 종류 · 지역 · 택배 셋만 지웠고, 브랜드 · 가격대 · 찾는
     말이 그대로 걸린 채 "지웠습니다" 가 됐습니다.
     ⚠️ **정렬(`o`)은 안 건드립니다** — 정렬은 좁히는 조건이 아닙니다
     (칩에도 안 나옵니다). 같이 되돌리면 손님이 고른 차례가 사라집니다. */
  function offAll(){
    F.sub = ""; F.rg = ""; F.ship = false;
    F.p = ""; F.br = ""; F.q = ""; F.cd = "";
    var q = document.getElementById("lf-q");
    if(q) q.value = "";
  }
  function offOne(k){
    if(k === "sub")      F.sub = "";
    else if(k === "rg")  F.rg = "";
    else if(k === "sh")  F.ship = false;
    else if(k === "p")   F.p = "";
    else if(k === "br")  F.br = "";
    else if(k === "cd")  F.cd = "";
    else if(k === "q"){
      F.q = "";
      var q = document.getElementById("lf-q");
      if(q) q.value = "";
    }
  }

  function bindBar(a){
    var w = document.getElementById("lswrap");
    if(!w) return;

    /* 고르개 · 정렬 — ⚠️ 레일은 **다시 안 그립니다**(고른 값이 이미 보입니다) */
    w.addEventListener("change", function(e){
      var t = e.target;
      if(!t || !t.id) return;
      if(t.id === "lf-br")      F.br  = t.value;
      else if(t.id === "lf-s")  F.sub = t.value;
      else if(t.id === "lf-rg") F.rg  = t.value;
      else if(t.id === "lf-p")  F.p   = t.value;
      else if(t.id === "lf-cd") F.cd  = t.value;
      else if(t.id === "lf-sh") F.ship = !!t.checked;
      else if(t.id === "lf-o")  F.o   = t.value;
      else return;
      writeUrl(); syncChips(); reload(a);
    });

    /* 찾기 — ⚠️ 한 글자마다 묻지 않습니다(400ms 쉬면 묻습니다).
       ⚠️⚠️ 거르는 것은 **서버**입니다 — 쉰 줄만 받아 화면에서 찾으면
       그 쉰 줄 밖의 매물이 영영 안 나옵니다. */
    var tm = null;
    w.addEventListener("input", function(e){
      if(!e.target || e.target.id !== "lf-q") return;
      var v = String(e.target.value || "").slice(0, 40);
      if(tm) clearTimeout(tm);
      tm = setTimeout(function(){
        if(v === F.q) return;
        F.q = v;
        writeUrl(); syncChips(); reload(a);
      }, 400);
    });
    /* ⚠️ 엔터로도 찾습니다 — 양식이 아니라 칸 하나라 저절로 안 돕니다 */
    w.addEventListener("keydown", function(e){
      if(!e.target || e.target.id !== "lf-q" || e.key !== "Enter") return;
      e.preventDefault();
      if(tm) clearTimeout(tm);
      F.q = String(e.target.value || "").slice(0, 40);
      writeUrl(); syncChips(); reload(a);
    });

    /* ⚠️⚠️ 눌림은 **감싼 자리 한 곳**에서 받습니다 — 칩은 다시 그려지고
       0건 상자는 목록 안에 생기므로, 그릴 때마다 달면 빠뜨리는 자리가
       생깁니다.
       ⚠️ 칩 안에는 아이콘(svg)이 있어 `e.target` 이 그 svg 입니다 —
       `closest()` 로 올라가야 합니다(아이콘을 누르면 안 되는 꼴). */
    w.addEventListener("click", function(e){
      var t = e.target;
      if(!t || !t.closest) return;
      var c = t.closest(".lsf-chip");
      if(c){ offOne(c.getAttribute("data-off"));
             writeUrl(); syncRail(); syncChips(); reload(a); return; }
      if(t.closest(".lsf-clear") || t.closest(".lsf-reset")){
        offAll(); writeUrl(); syncRail(); syncChips(); reload(a); return;
      }
      if(t.closest("#lf-open")){ sheet(true);  return; }
      if(t.closest("#lf-close") || t.closest(".lsf-done") ||
         t.closest("#lsscrim")){ sheet(false); return; }
    });
    /* ⚠️ 시트가 열렸을 때 ESC 로 닫힙니다 (가둬 두지 않습니다) */
    document.addEventListener("keydown", function(e){
      if(e.key === "Escape") sheet(false);
    });
  }
  function reload(a){ return load(a).then(function(rows){ paint(a, rows); }); }

  /* ⚠️⚠️ 제15조 제2항 — 수집 항목 · 이용 목적 · 보유 기간을 **동의받는
     그 자리에서** 같이 보여 줍니다. 링크로 빼 두면 "같이 보여 준 것" 이
     아닙니다.
     ⚠️⚠️ **id 를 달지 않습니다** — 이 상자는 올리는 양식과 문의 양식에
     **둘 다** 들어가므로, id 를 달면 둘이 같이 열려 있을 때 같은 id 가
     둘이 됩니다 (조인에서 겪은 자리입니다). */
  function consentBox(){
    return '<div class="jrow jrow-full jconsent">' +
      '<label class="jchk"><input type="checkbox" required> ' +
      '<span>아래 내용으로 개인정보 수집 · 이용에 동의합니다 <b>*</b></span></label>' +
      '<ul class="jterms">' +
        '<li><b>수집 항목</b> 연락처, 적어 주신 글</li>' +
        '<li><b>이용 목적</b> 매물을 알리고 사실 분과 잇기</li>' +
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
    var rg = (window.AM_REGIONS || []).map(function(r){
      return '<option value="' + esc(r.key) + '">' + esc(r.name) + '</option>';
    }).join("");
    var cd = (window.AM_LST_COND || []).map(function(c){
      return '<option value="' + esc(c.key) + '">' + esc(c.name) + '</option>';
    }).join("");
    var br = (window.AM_LST_BRAND || []).map(function(n){
      return '<option value="' + esc(n) + '">' +
        esc(n === "기타" ? "기타 (직접 적기)" : n) + '</option>';
    }).join("");
    return '<form id="lsf" class="jform">' +
      '<div class="jrow jrow-full">' +
        '<label for="l-title">제목 <b>*</b></label>' +
        '<input id="l-title" name="title" required minlength="2" maxlength="60" ' +
        'placeholder="보기: 타이틀리스트 드라이버 10.5도 팝니다">' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="l-sub">물건 종류 <b>*</b></label>' +
        '<select id="l-sub" name="sub" required>' +
          '<option value="">고르세요</option>' + sb + '</select>' +
      '</div>' +
      /* ⚠️⚠️ **브랜드는 고르개 + 직접 적기**입니다 — 목록만 내면 목록에
         없는 브랜드를 가진 분이 올릴 수가 없고(절대 규칙 2), 직접 적기만
         두면 "타이틀리스트" · "타이틀 리스트" · "Titleist" 가 섞여 거르개가
         아무것도 못 모읍니다. 그래서 둘을 같이 냅니다.
         ⚠️ DB 에는 **고른 · 적은 글자 그대로** 담깁니다 (키가 없습니다) —
         0068 이 ≤30자만 받습니다.
         ⚠️ 직접 적으신 브랜드는 고르개에 없으므로 **주소로 좁힐 수
         없습니다** — 그건 맞는 동작입니다 (없는 칸을 만들지 않습니다). */
      '<div class="jrow">' +
        '<label for="l-brand">브랜드 <b>*</b></label>' +
        '<select id="l-brand" name="brand" required>' +
          '<option value="">고르세요</option>' + br + '</select>' +
        '<input id="l-brand2" maxlength="30" hidden ' +
          'aria-label="브랜드를 직접 적습니다" placeholder="브랜드를 적어 주세요">' +
        '<span class="jhint">목록에 없으면 <b>기타</b> 를 고르고 ' +
        '직접 적어 주세요.</span>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="l-cond">물건 상태 <b>*</b></label>' +
        '<select id="l-cond" name="cond" required>' +
          '<option value="">고르세요</option>' + cd + '</select>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="l-rg">지역 <b>*</b></label>' +
        '<select id="l-rg" name="region" required>' +
          '<option value="">고르세요</option>' + rg + '</select>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="l-price">값 <b>*</b></label>' +
        '<input id="l-price" name="price" type="number" min="0" max="100000000" ' +
        'step="1000" inputmode="numeric" required placeholder="원">' +
        /* ⚠️ "협의" 를 우리가 지어 적지 않습니다 — 0 은 무료입니다 */
        '<span class="jhint">무료로 나누시면 <b>0</b> 을 적어 주세요.</span>' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label class="jchk"><input type="checkbox" id="l-ship" name="ship"> ' +
        '<span>택배로도 보내 드릴 수 있습니다</span></label>' +
        '<span class="jhint">골프올인원이 보내 드리지는 않습니다 — ' +
        '보내는 방법과 값은 두 분이 정하십니다.</span>' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label for="l-body">설명 <b>*</b></label>' +
        '<textarea id="l-body" name="body" rows="5" required minlength="5" ' +
        'maxlength="2000" placeholder="브랜드 · 모델 · 쓴 기간 · 흠집 · 구성품을 적어 주세요."></textarea>' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label for="l-contact">연락처 <b>*</b></label>' +
        '<input id="l-contact" name="contact" required maxlength="100" ' +
        'autocomplete="tel" placeholder="전화번호 또는 메신저 아이디">' +
        /* ⚠️⚠️⚠️ 제17조 — 언제 누구에게 가는지를 **적는 그 자리에서** 말합니다 */
        '<span class="jhint">⚠️ 목록에는 <b>안 나옵니다.</b> ' +
        '문의를 받아들이신 뒤 <b>다시 한 번 고르셔야</b> 그분에게만 보입니다.</span>' +
      '</div>' +
      consentBox() +
      '<div class="jrow jrow-full">' +
        '<button type="submit" class="btn btn-pt">매물 올리기</button>' +
        '<p id="lsmsg" class="jmsg" hidden></p>' +
      '</div>' +
    '</form>';
  }

  /* 올린 뒤 안내 — ⚠️ **글자만** 잇습니다 (사진 상자는 따로 이어 붙입니다) */
  function doneHtml(hasPhoto){
    return '<h3>매물을 올렸습니다.</h3>' +
      (hasPhoto
        ? '<p>목록에 바로 보입니다. <b>사진을 지금 붙이실 수 있습니다</b> — ' +
          '나중에 내 정보에서도 붙이실 수 있습니다.</p>'
        : '<p>목록에 바로 보입니다. 문의가 들어오면 내 정보에서 ' +
          '받아들이실 수 있습니다.</p>') +
      /* ⚠️ 문단 한가운데 링크를 박지 않습니다 — 단추로 냅니다 */
      '<a class="btn btn-line" href="/my">내 정보에서 보기</a>';
  }

  function askForm(id, title){
    return '<form id="lsaf" class="jform" data-id="' + esc(id) + '">' +
      '<p class="jafh">사겠다고 문의 — <b>' + esc(title) + '</b></p>' +
      '<div class="jrow jrow-full">' +
        '<label for="ls-msg">남기실 말</label>' +
        '<textarea id="ls-msg" name="msg" rows="3" maxlength="300" ' +
        'placeholder="언제 · 어디서 만날 수 있는지, 궁금한 것을 적어 주세요."></textarea>' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label for="ls-contact">연락처 <b>*</b></label>' +
        '<input id="ls-contact" name="contact" required maxlength="100" ' +
        'autocomplete="tel" placeholder="전화번호 또는 메신저 아이디">' +
        '<span class="jhint">⚠️ 올리신 분에게 <b>바로 가지 않습니다.</b> ' +
        '받아들여진 뒤 <b>다시 한 번 고르셔야</b> 보입니다.</span>' +
      '</div>' +
      consentBox() +
      '<div class="jrow jrow-full">' +
        '<button type="submit" class="btn btn-pt">문의 보내기</button>' +
        '<button type="button" class="btn btn-line lsaf-x">그만두기</button>' +
        '<p id="lsmsg2" class="jmsg" hidden></p>' +
      '</div>' +
    '</form>';
  }

  window.amAuthAsk().then(function(a){
    if(!a || !a.on){
      try{ console.warn("[listing] 로그인 · 접수가 설정되지 않아 중고 직거래를 " +
        "열지 않았습니다 (Vercel 의 SUPABASE_URL · SUPABASE_ANON_KEY)."); }catch(e){}
      /* ⚠️ 빌드가 찍어 둔 "아직 없는 것입니다" 를 그대로 두면
         0건이라고 말하는 것입니다 — 열지 않았다고 적습니다. */
      window.amShut("lslist");
      return;                       /* 빌드가 찍어 둔 글 그대로 */
    }
    if(!KEEP){
      /* ⚠️⚠️ 보유 기간을 못 보여 주면 동의를 받을 수 없습니다 (제15조
         제2항). 운영자에게만 말하고 양식은 안 엽니다 (절대 규칙 3). */
      try{ console.warn("[listing] js/data/site.js 의 listingKeep(보유 기간)이 " +
        "비어 매물 양식을 열지 않았습니다 — 개인정보보호법 제15조 제2항."); }catch(e){}
      return;
    }

    SIGNED = !!a.signedIn;
    CONF = a.conf;
    readUrl();
    mountBar();
    bindBar(a);
    reload(a);

    var box = document.getElementById("lsbox");
    if(!box) return;
    box.className = "jbox";
    box.innerHTML = a.signedIn
      ? openForm()
      : '<div class="none"><h3>매물을 올리려면 로그인하셔야 합니다.</h3>' +
        '<p>올리신 분과 사실 분을 잇는 자리라, 누가 올렸는지 알아야 합니다.</p>' +
        '<a class="btn btn-pt" href="' +
          (window.amLoginUrl ? esc(window.amLoginUrl(window.location.pathname)) : "/login") +
        '">로그인하기</a></div>';
    if(!a.signedIn) return;

    /* ⚠️ 「기타」를 고르시면 직접 적는 칸이 나옵니다 — 그때까지는 가려
       둡니다 (늘 내면 목록에서 고르신 분에게 쓸 데 없는 칸입니다). */
    var bsel = document.getElementById("l-brand");
    var btxt = document.getElementById("l-brand2");
    if(bsel && btxt) bsel.addEventListener("change", function(){
      btxt.hidden = bsel.value !== "기타";
      if(!btxt.hidden){ try{ btxt.focus(); }catch(_){} }
    });
    /* ⚠️⚠️ 보내는 브랜드를 **한 곳**에서 짓습니다 — 두 곳에 적으면
       고르개와 직접 적기가 어긋나는 날 한쪽만 담깁니다.
       ⚠️ 「기타」를 고르고 안 적으셨으면 **"기타"** 그대로 담습니다
       (빈 값으로 보내면 0068 이 거절합니다). */
    function brandNow(){
      if(!bsel) return "";
      if(bsel.value !== "기타") return bsel.value;
      var v = btxt ? String(btxt.value || "").trim() : "";
      return v || "기타";
    }

    document.getElementById("lsf").addEventListener("submit", function(e){
      e.preventDefault();
      var f = e.target, msg = document.getElementById("lsmsg");
      var btn = f.querySelector('button[type="submit"]');
      btn.disabled = true;
      msg.hidden = false; msg.textContent = "올리는 중입니다…";
      call(a, "open_listing", {
        title: f.title.value, sub: f.sub.value, cond: f.cond.value,
        /* ⚠️ 브랜드는 **글자 그대로** 담깁니다 (키가 없습니다 · 0068) */
        brand: brandNow(),
        region: f.region.value, price: f.price.value,
        /* ⚠️ 체크박스는 **참 · 거짓**으로 보냅니다 ("on" 이 아닙니다) */
        ship: !!document.getElementById("l-ship").checked,
        body: f.body.value, contact: f.contact.value,
        agree_at: new Date().toISOString()
      }).then(function(id){
        /* ⚠️ `open_listing` 은 **새 매물의 id** 를 돌려줍니다 — 그 자리에서
           사진을 붙이실 수 있게 상자를 엽니다. 버킷이 꺼져 있으면
           `amLstPhoto.box()` 가 빈 글자라 그 줄이 아예 안 나옵니다.
           ⚠️⚠️ **먼저 물어보고 그립니다** — `ready()` 는 서버에 한 번
           묻습니다. 안 기다리면 그 답이 오기 전에는 꺼진 것으로 읽혀
           사진 칸이 **조용히 안 그려집니다** (스크립트 차례에 기댄 자리를
           두 번 겪었습니다 — `window.amAdPlace` · `AM_TEE_BAND`). */
        var lid = String(id == null ? "" : id).replace(/"/g, "");
        return (lid && window.amLstPhoto
          ? window.amLstPhoto.ready() : Promise.resolve(false))
          .then(function(){ return lid; });
      }).then(function(lid){
        var ph = (lid && window.amLstPhoto) ? window.amLstPhoto.box() : "";
        box.className = ph ? "jbox" : "none";
        box.innerHTML = doneHtml(!!ph);
        /* ⚠️⚠️ 사진 상자는 **이어 붙입니다**(`insertAdjacentHTML`) —
           `innerHTML` 에 이어 적으면 `check-safe` 가 "esc() 없이 변수를
           넣었다" 로 잡습니다. 그 검사가 맞습니다 — 그 상자는 **다른
           파일**(`js/lstphoto.js`)이 만들므로 이 파일을 보는 눈으로는
           손님 글이 섞였는지 알 수 없습니다. 섞인 것은 없지만(붙박이
           양식입니다) 검사를 느슨하게 고치는 쪽이 더 위험합니다. */
        if(ph){
          box.insertAdjacentHTML("beforeend", ph);
          window.amLstPhoto.bind(box.querySelector(".lsp"), lid, a.conf,
                                 function(){ reload(a); });
        }
        reload(a);
      }).catch(function(err){
        btn.disabled = false;
        msg.textContent = String((err && err.message) || "올리지 못했습니다.");
      });
    });
  }).catch(function(){ /* 못 물어봤으면 빌드가 찍은 글 그대로 */ });
})();
