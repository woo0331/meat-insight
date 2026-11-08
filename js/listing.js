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
  /* ⚠️ `g` 는 묶음 탭 · `v` 는 상세로 볼 매물 id 입니다 (0069).
     ⚠️⚠️ **`q` 는 찾는 말이고 `v` 는 매물 하나**입니다 — 한 열쇠로 두면
     "타이틀리스트" 를 찾는 것과 그 매물 하나를 보는 것이 섞입니다. */
  var F = { sub:"", rg:"", ship:false, p:"", br:"", o:"", q:"", cd:"", g:"", v:"" };
  /* 지금 보고 있는 쪽 몇째 — ⚠️ 0 에서 셉니다 */
  var PG = 0;
  /* 내가 찜한 매물 — ⚠️⚠️ **제 것만** 받습니다(`v_listing_fav`). 남의
     찜은 어디서도 못 읽습니다(행동 기록입니다 · 0069). */
  var FAV = {};
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
  var LIMIT = 24;
  /* ⚠️⚠️ **쪽을 나눕니다** (0069 · 시안) — 받아 온 줄이 한도에 닿으면
     다음 쪽이 있다는 뜻입니다. ⚠️ 전체 쪽 수는 **모릅니다** — 그래서
     "3 / 12" 처럼 적지 않고 「다음」 단추만 냅니다(모르는 수를 적으면
     그건 지어낸 숫자입니다 · 절대 규칙 1). */

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
      /* ⚠️ 모르는 묶음 키는 **버립니다** — 주소를 손으로 고쳐 오시면
         아무것도 안 걸리는 화면이 되는데 "매물이 없다" 로 읽힙니다. */
      var gv = (u.get("g") || "").trim();
      F.g = (gv && gv !== "all" && window.amLstGroup && window.amLstGroup(gv)) ? gv : "";
      /* ⚠️⚠️ **상세로 볼 매물 id** — 꼴만 봅니다(36자). 틀린 꼴을 그대로
         서버에 보내면 PostgREST 가 400 을 내고 화면은 "못 읽었습니다" 가
         됩니다 — 꼴이 아니면 **목록으로** 갑니다. */
      var vv = (u.get("v") || "").trim();
      F.v = /^[0-9a-fA-F-]{36}$/.test(vv) ? vv : "";
      /* ⚠️ 쪽은 주소에 **1 부터** 적고 안에서는 0 부터 셉니다 — 주소에
         "0쪽" 이 보이면 손님이 읽을 수 없습니다. 틀린 값은 첫 쪽입니다. */
      var gp = parseInt(u.get("pg") || "1", 10);
      PG = (gp > 1 && gp < 500) ? gp - 1 : 0;
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
      if(F.g)    qs.push("g="  + encodeURIComponent(F.g));
      if(F.v)    qs.push("v="  + encodeURIComponent(F.v));
      /* ⚠️ 쪽은 주소에 **남깁니다** — 셋째 쪽을 보시다 새로 고치면 첫
         쪽으로 돌아가고, 그러면 복사해 보낸 주소도 다른 화면입니다. */
      if(PG > 0)  qs.push("pg=" + String(PG + 1));
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
  /* ── 묶음 탭 — ⚠️ 시안의 「전체 · 클럽 · 의류&신발 · 용품 · 기타」 ───
     ⚠️⚠️⚠️ **탭과 아래 거르개가 같은 것을 두 번 묻지 않게** 했습니다 —
     탭은 **묶음**(여러 종류를 한 번에)이고 거르개는 **한 종류**입니다.
     묶는 규칙은 `AM_LST_GROUP` **한 곳**이고 둘이 같은 줄을 읽습니다
     (화면이 "클럽이면 드라이버 · 우드 · …" 를 따로 적으면 종류가 느는
     날 그 탭에서 새 종류가 조용히 빠집니다 · 절대 규칙 5).
     ⚠️⚠️ **단추가 아니라 링크**입니다 — 자바스크립트가 꺼진 분 · 봇에게
     단추는 눌러도 아무 일이 안 나는 칸입니다. 눌림은 가로채서 주소만
     바꿉니다 (업체찾기 거르개에서 세운 규칙). */
  function tabs(){
    var G = window.AM_LST_GROUP || [];
    if(!G.length) return "";
    /* 지금 켜진 탭 — 종류가 걸려 있으면 그 종류가 든 묶음, 묶음만
       걸려 있으면 그 묶음, 아무것도 없으면 「전체」입니다.
       ⚠️ `amLstGroupOf()` 가 못 찾으면 **null** 이라 아무 탭도 안
       켜집니다 — 모르는 종류를 「전체」로 읽으면 탭이 엉뚱한 곳에 켜집니다. */
    var on = F.sub
      ? ((window.amLstGroupOf && window.amLstGroupOf(F.sub)) || {}).key
      : (F.g || "all");
    return '<nav class="lstab" aria-label="물건 묶음">' + G.map(function(x){
      return '<a class="lstab-i' + (on === x.key ? " on" : "") +
        '" href="' + esc(tabUrl(x.key)) + '" data-g="' + esc(x.key) + '"' +
        (on === x.key ? ' aria-current="true"' : "") + '>' +
        esc(x.name) + '</a>';
    }).join("") + '</nav>';
  }
  function tabUrl(g){
    var qs = [];
    if(g && g !== "all") qs.push("g=" + encodeURIComponent(g));
    if(F.rg)   qs.push("rg=" + encodeURIComponent(F.rg));
    if(F.ship) qs.push("sh=1");
    if(F.q)    qs.push("q="  + encodeURIComponent(F.q));
    return "/cat/used" + (qs.length ? "?" + qs.join("&") : "");
  }

  /* ── 카드 — ⚠️ 시안대로 **1:1 정사각 사진** 격자입니다 (0069) ───────
     ⚠️⚠️⚠️ **카드 전체가 상세 화면으로 가는 링크**입니다. 앞 판은 카드
     안에 「사겠다고 문의하기」 단추만 있고 **상세 화면이 없어서**, 사진
     한 장 · 설명 몇 줄을 목록 안에서만 볼 수 있었습니다 — 중고채를
     사는 분이 각도마다 찍은 사진을 보고 고르는데 그 자리가 없었습니다.
     문의 단추는 **상세 화면으로 옮겼습니다**(링크 안에 단추를 넣으면
     어느 쪽이 눌리는지 브라우저마다 다릅니다).
     ⚠️⚠️ **찜 단추는 링크 바깥**입니다 — 안에 넣으면 같은 자리입니다.
     ⚠️⚠️ **사진이 0장이면 아이콘 타일**입니다 — 남의 사진이나 분류
     사진을 깔면 그 매물인 것처럼 보입니다 (절대 규칙 1).
     ⚠️ 버킷이 꺼져 있으면 `amPubUrl()` 이 **빈 글자**를 돌려주므로 역시
     아이콘 타일입니다 (주소를 지어내지 않습니다). */
  function card(r){
    var u = window.amPubUrl ? window.amPubUrl(CONF, r.thumb) : "";
    var n = Number(r.photo_n) || 0;
    var ph = u
      ? '<img class="lsc-im" src="' + esc(u) + '" alt="' + esc(r.title) +
        '" loading="lazy" decoding="async">' +
        (n > 1 ? '<span class="lsc-n">' + esc(String(n)) + '장</span>' : "")
      : '<span class="lsc-no">' + window.icon("cart", 26) + '사진 없음</span>';
    /* ⚠️⚠️ **팔린 · 예약중은 사진 위 덮개**입니다 (시안) — 글자로만
       적으면 격자에서 안 보입니다. ⚠️ 말은 `AM_LST_ST` 한 곳이고,
       `open` 이면 덮개를 **안 냅니다**(「판매중」 딱지를 모든 카드에
       붙이면 그것만 보입니다). */
    var st = r.state && r.state !== "open"
      ? '<span class="lsc-st lsc-st-' + esc(r.state) + '">' +
        esc(window.amLstStName(r.state)) + '</span>' : "";
    return '<li class="lsc">' +
      '<a class="lsc-a" href="' + esc(oneUrl(r.id)) + '" data-one="' + esc(r.id) + '">' +
        '<span class="lsc-ph">' + ph + st +
          '<span class="lsc-cd">' + esc(window.amLstCondName(r.cond)) + '</span>' +
        '</span>' +
        '<span class="lsc-i">' +
          '<span class="lsc-t">' + esc(r.title) + '</span>' +
          /* ⚠️⚠️ **0 은 "무료" 입니다** — `||` 를 쓰면 0원이 사라집니다.
             세는 자리는 `amLstPrice()` 한 곳입니다. */
          '<span class="lsc-p">' + esc(window.amLstPrice(r.price)) + '</span>' +
          /* ⚠️ 브랜드 · 모델명이 비면 **그 자리를 빼고** 종류만 적습니다
             (절대 규칙 2 — "(미기재)" 를 찍지 않습니다) */
          '<span class="lsc-br">' + esc(brLine(r)) + '</span>' +
          /* ⚠️ 시안이 카드마다 지역과 올린 지 얼마나 되었나를 적습니다 */
          '<span class="lsc-m">' + esc(rgName(r.region)) + ' · ' +
            esc(window.amAgo ? window.amAgo(r.created_at) : "") +
            (r.ship ? ' · 택배 가능' : "") + '</span>' +
        '</span>' +
      '</a>' + favBtn(r.id) +
    '</li>';
  }
  /* 브랜드 · 모델 · 종류 한 줄 — ⚠️ 비는 것은 **줄에서 빠집니다** */
  function brLine(r){
    var b = [];
    if(r.brand) b.push(r.brand);
    if(r.model) b.push(r.model);
    b.push(subName(r.sub));
    return b.join(" · ");
  }
  /* ⚠️⚠️ **찜은 로그인하신 분에게만** 냅니다 — 그리면 눌러서 로그인
     화면으로 갔다가 돌아와도 **찜된 것이 없는** 꼴이 됩니다 (절대 규칙 5).
     ⚠️ 찜 **수는 안 적습니다** — 세어 낼 수야 있지만 "인기" 로 읽히고
     우리가 검증할 길이 없습니다 (0069 머리말의 까닭 셋). */
  function favBtn(id){
    if(!SIGNED) return "";
    var on = FAV[id] ? " on" : "";
    return '<button type="button" class="lsc-fav' + on + '" data-fav="' + esc(id) +
      '" aria-pressed="' + (FAV[id] ? "true" : "false") +
      '" title="관심상품"><span class="sr-only">관심상품에 ' +
      (FAV[id] ? "담김" : "담기") + '</span>' + window.icon("heart", 18) + '</button>';
  }
  /* 찜 단추의 글자 — ⚠️ **한 곳**입니다 (상세의 단추와 다시 그릴 때가
     같은 줄을 읽습니다 — 두 벌로 적으면 누르는 순간 글이 달라집니다) */
  function favLabel(on){
    return window.icon("heart", 16) +
      esc(on ? " 관심상품에 담김" : " 관심상품에 담기");
  }
  function oneUrl(id){ return "/cat/used?v=" + encodeURIComponent(String(id)); }

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
    var qs = ["select=id,sub,region,ship,title,price,cond,ask_n," +
              "brand,model,state,created_at,photo_n,thumb", "limit=" + LIMIT];
    /* ⚠️⚠️ **본문(`body`)을 목록에서 안 받습니다** (0069) — 카드가 쓰지
       않는데 받으면 스물네 줄마다 2,000자씩 따라옵니다. 본문은 **상세
       화면**이 한 줄만 받습니다. */
    /* ⚠️ 쪽 — PostgREST 는 `offset` 으로 넘깁니다 */
    if(PG > 0) qs.push("offset=" + String(PG * LIMIT));
    /* ⚠️⚠️ **보내는 글자는 `AM_LST_SORT` 한 곳**입니다 — 화면이
       `price.asc` 를 따로 적으면 칸 이름이 바뀌는 날 **조용히** 최신순으로
       보입니다(정렬이 안 되는 것은 에러가 안 납니다). */
    var so = window.amLstSort ? window.amLstSort(F.o) : null;
    qs.push("order=" + encodeURIComponent(so ? so.q : "created_at.desc"));
    if(F.sub)  qs.push("sub=eq."    + encodeURIComponent(F.sub));
    /* ⚠️⚠️⚠️ **묶음 탭은 종류 여럿을 한 번에 겁니다** — 종류가 걸려
       있으면 그것이 이깁니다(더 좁은 조건입니다). 키 묶음은
       `AM_LST_GROUP` 한 곳에서 읽습니다 — 화면이 "클럽이면 드라이버 ·
       우드 · …" 를 따로 적으면 종류가 느는 날 그 탭에서 새 종류가
       **조용히 빠집니다**(절대 규칙 5). */
    else if(F.g){
      var gr = window.amLstGroup ? window.amLstGroup(F.g) : null;
      var gk = (gr && gr.subs) || [];
      if(gk.length) qs.push("sub=in.(" + gk.map(encodeURIComponent).join(",") + ")");
    }
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
  /* ── 내가 찜한 것 ────────────────────────────────────────────────
     ⚠️⚠️ **제 것만** 받습니다(`v_listing_fav`) — 남의 찜은 어디서도 못
     읽습니다(행동 기록입니다 · 0069). 그래서 로그인 전에는 **아예 안
     물어봅니다**(물어보면 permission denied 가 콘솔에 쌓입니다).
     ⚠️ 못 읽으면 **빈 묶음**입니다 — 화면은 찜 단추를 꺼진 채로 냅니다
     (켜진 것처럼 그리면 눌러도 안 꺼지는 칸이 됩니다). */
  function loadFav(a){
    if(!a.signedIn) return Promise.resolve({});
    return fetch(a.conf.url + "/rest/v1/v_listing_fav?select=id&limit=200", {
      headers: Object.assign({ apikey:a.conf.anonKey },
                             window.amAuthHeaders ? window.amAuthHeaders() : {})
    }).then(function(r){ return r.ok ? r.json() : []; })
      .then(function(rows){
        var m = {};
        (rows || []).forEach(function(x){ m[x.id] = true; });
        return m;
      }).catch(function(){ return {}; });
  }

  /* ── 상세 화면 ──────────────────────────────────────────────────
     ⚠️⚠️⚠️ **2026-11-08 까지 이 화면이 아예 없었습니다.** 카드를 눌러도
     갈 자리가 없어서, 중고채를 사는 분이 각도마다 찍은 사진을 보고 고르는
     그 일을 **목록 카드 안에서** 해야 했습니다 — 알아본 다섯 곳 가운데
     상세 화면이 없는 곳은 하나도 없었습니다.
     ⚠️⚠️ **보기를 새로 안 만들었습니다** — `v_listing_open` 에
     `?id=eq.<uuid>` 로 한 줄만 받습니다(보기를 더하면 공개로 나가는 길이
     둘이 되고, 한쪽만 고치는 날 한쪽만 샙니다).
     ⚠️ 사진은 `v_listing_photo_public` 에서 **차례대로** 받습니다 —
     그 보기가 `ord` 를 내므로 **대표와 첫 장이 같습니다**(0069). */
  function loadOne(a, id){
    var h = Object.assign({ apikey:a.conf.anonKey },
                          window.amAuthHeaders ? window.amAuthHeaders() : {});
    return Promise.all([
      fetch(a.conf.url + "/rest/v1/v_listing_open?select=id,sub,region,ship," +
            "title,body,price,cond,brand,model,state,seller,ask_n,photo_n" +
            "&id=eq." + encodeURIComponent(id) + "&limit=1",
            { headers:h }).then(function(r){ return r.ok ? r.json() : []; }),
      fetch(a.conf.url + "/rest/v1/v_listing_photo_public?select=path,caption,ord" +
            "&listing_id=eq." + encodeURIComponent(id) +
            "&order=ord.asc&limit=10",
            { headers:h }).then(function(r){ return r.ok ? r.json() : []; })
    ]).then(function(x){
      return { row: (x[0] || [])[0] || null, ph: x[1] || [] };
    });
  }

  /* 상세 — 사진 묶음. ⚠️ 0장이면 **아이콘 타일**입니다 (남의 사진을
     깔지 않습니다 · 절대 규칙 1). ⚠️ 한 장이면 작은 그림 줄을 안 냅니다. */
  function oneShots(ph){
    var us = (ph || []).map(function(f){
      return window.amPubUrl ? window.amPubUrl(CONF, f.path) : "";
    }).filter(Boolean);
    if(!us.length){
      return '<div class="lsd-ph lsd-ph-no">' +
        window.icon("cart", 40) +
        '<p>올리신 분이 사진을 아직 안 붙였습니다.</p></div>';
    }
    var big = '<div class="lsd-ph"><img id="lsd-big" src="' + esc(us[0]) +
      '" alt="" decoding="async"></div>';
    if(us.length < 2) return big;
    /* ⚠️⚠️ **단추가 아니라 작은 그림 단추**입니다 — 누르면 큰 그림만
       갈아 끼웁니다(주소는 안 바꿉니다. 사진은 한 매물의 한 부분입니다). */
    return big + '<div class="lsd-th">' + us.map(function(u, i){
      return '<button type="button" class="lsd-t' + (i ? "" : " on") +
        '" data-shot="' + esc(u) + '"><img src="' + esc(u) +
        '" alt="사진 ' + esc(String(i + 1)) + '" loading="lazy" decoding="async">' +
        '</button>';
    }).join("") + '</div>';
  }

  /* 상세 — 값 줄들. ⚠️⚠️ **비는 줄은 줄째 빠집니다** (절대 규칙 2 —
     "(미기재)" 를 찍지 않습니다). */
  function oneRows(r){
    var out = [];
    out.push(["물건 종류", subName(r.sub)]);
    if(r.brand) out.push(["브랜드", r.brand]);
    if(r.model) out.push(["모델명", r.model]);
    out.push(["물건 상태", window.amLstCondName(r.cond)]);
    out.push(["거래 지역", rgName(r.region) + (r.ship ? " · 택배도 됩니다" : " · 직거래만")]);
    /* ⚠️ 판매자는 **보기가 가려서** 냅니다(`김**`) — 화면이 가리면
       본이름이 이미 브라우저까지 온 것입니다(0052 에서 세운 규칙).
       ⚠️ 못 받았으면 그 줄을 **안 냅니다**(「회원」 을 지어 적지 않습니다). */
    if(r.seller) out.push(["판매자", r.seller]);
    return '<dl class="lsd-dl">' + out.map(function(x){
      return '<dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd>';
    }).join("") + '</dl>';
  }

  /* ⚠️⚠️⚠️ **거래 주의사항을 상세 화면에 적습니다** — 골프올인원은
     거래 당사자가 아닙니다(전자상거래법 제20조 제1항). 돈이 우리를
     지나가지 않고 물건을 우리가 보지 않습니다. 푸터에도 있지만, **돈이
     오가는 결정을 하는 그 자리**에서 한 번 더 말합니다.
     ⚠️ **「안전거래」 · 「안전결제」 를 적지 않습니다** — 결제를 아예 받지
     않습니다(제20조의3 · 절대 규칙 5). */
  function oneWarn(){
    return '<div class="lsd-warn">' +
      '<h3>' + window.icon("shield", 18) + ' 거래하실 때</h3>' +
      '<ul>' +
        '<li>골프올인원은 <b>거래 당사자가 아닙니다.</b> 회원끼리 직접 ' +
          '주고받으시는 거래이고, 저희가 대금을 받거나 물건을 확인하지 않습니다.</li>' +
        '<li>만나서 <b>물건을 직접 보고</b> 주고받으시는 쪽이 가장 안전합니다. ' +
          '택배로 받으실 때는 보내는 분의 이름과 연락처를 함께 적어 두세요.</li>' +
        '<li>샤프트 · 헤드의 상태와 <b>정품 여부</b>는 받으시는 분이 보셔야 ' +
          '합니다. 저희가 확인해 드릴 수 없습니다.</li>' +
        '<li>문제가 생기면 <b>고객센터로 신고</b>해 주세요. 분쟁조정기구 · ' +
          '법원의 요청이 있으면 저희가 가진 기록을 제공합니다.</li>' +
      '</ul></div>';
  }

  /* 상세 한 장 */
  function oneHtml(r, ph){
    /* ⚠️ `open` 이면 딱지를 **안 냅니다** — 「판매중」을 모든 매물에
       붙이면 그것만 보입니다. */
    var st = r.state && r.state !== "open"
      ? '<span class="lsd-st lsc-st-' + esc(r.state) + '">' +
        esc(window.amLstStName(r.state)) + '</span>' : "";
    return '<div class="lsd">' +
      '<p class="lsd-back"><a href="' + esc(backUrl()) + '" data-back="1">' +
        window.icon("arrow", 16) + ' 매물 목록으로</a></p>' +
      oneShots(ph) +
      '<div class="lsd-i">' +
        '<p class="lsd-k">' + esc(subName(r.sub)) + st + '</p>' +
        '<h2 class="lsd-ti">' + esc(r.title) + '</h2>' +
        /* ⚠️⚠️ **0 은 "무료" 입니다** — 세는 자리는 `amLstPrice()` 한 곳 */
        '<p class="lsd-p">' + esc(window.amLstPrice(r.price)) + '</p>' +
        oneRows(r) +
        '<div class="lsd-b" id="lsd-b"></div>' +
      '</div>' +
      /* ⚠️ 본문은 **손님이 쓴 글**입니다 — `esc()` 를 지나야 합니다 */
      '<div class="lsd-body"><h3>설명</h3><p>' + esc(r.body) + '</p></div>' +
      oneWarn() +
    '</div>';
  }
  /* 목록으로 돌아가는 주소 — ⚠️ **걸려 있던 조건을 그대로** 들고
     갑니다(안 들고 가면 셋째 쪽에서 들어온 분이 첫 쪽으로 떨어집니다). */
  function backUrl(){
    var keep = F.v; F.v = "";
    var qs = [];
    if(F.sub)  qs.push("s="  + encodeURIComponent(F.sub));
    if(F.g)    qs.push("g="  + encodeURIComponent(F.g));
    if(F.rg)   qs.push("rg=" + encodeURIComponent(F.rg));
    if(F.ship) qs.push("sh=1");
    if(F.p)    qs.push("p="  + encodeURIComponent(F.p));
    if(F.br)   qs.push("br=" + encodeURIComponent(F.br));
    if(F.o)    qs.push("o="  + encodeURIComponent(F.o));
    if(F.q)    qs.push("q="  + encodeURIComponent(F.q));
    if(F.cd)   qs.push("cd=" + encodeURIComponent(F.cd));
    if(PG > 0) qs.push("pg=" + String(PG + 1));
    F.v = keep;
    return "/cat/used" + (qs.length ? "?" + qs.join("&") : "");
  }
  /* 상세의 단추 줄 — ⚠️⚠️ 로그인 여부로 **할 말이 갈립니다** */
  function oneBtns(r, mine){
    if(mine){
      /* ⚠️⚠️ **제 매물에는 문의 단추를 안 냅니다** — 문이 거절합니다
         (그리면 눌러도 아무 일이 안 나는 칸입니다 · 절대 규칙 5).
         고치고 내리는 자리는 `/my` 입니다. */
      return '<p class="lsd-mine">올리신 매물입니다. ' +
        '고치거나 내리시는 자리는 내 정보입니다.</p>' +
        '<a class="btn btn-pt" href="/my">내 정보에서 관리하기</a>';
    }
    if(!SIGNED){
      return '<p class="lsd-mine">문의하시려면 로그인하셔야 합니다. ' +
        '올리신 분과 사실 분을 잇는 자리라 누가 문의했는지 알아야 합니다.</p>' +
        '<a class="btn btn-pt" href="' +
          (window.amLoginUrl ? esc(window.amLoginUrl("/cat/used?v=" + r.id)) : "/login") +
        '">로그인하기</a>';
    }
    /* ⚠️ 팔린 · 내려간 매물에는 문의 단추를 안 냅니다 (문이 거절합니다) */
    if(r.state !== "open" && r.state !== "reserved"){
      return '<p class="lsd-mine">이 매물은 더 문의를 받지 않습니다.</p>' +
        '<a class="btn btn-line" href="' + esc(backUrl()) + '">다른 매물 보기</a>';
    }
    /* ⚠️⚠️ **예약중이라는 사실을 그 자리에서** 말합니다 — 문의는 받지만
       앞선 분이 있다는 것을 모르고 기다리시면 안 됩니다. */
    var note = r.state === "reserved"
      ? '<p class="lsd-mine">지금 다른 분과 이야기 중인 매물입니다. ' +
        '그 거래가 어그러지면 연락을 받으실 수 있습니다.</p>' : "";
    return note +
      '<button type="button" class="btn btn-pt lsd-ask" data-id="' + esc(r.id) +
        '">사겠다고 문의하기</button>' +
      '<button type="button" class="btn btn-bad lsd-fav' + (FAV[r.id] ? " on" : "") +
        '" data-fav="' + esc(r.id) + '" aria-pressed="' +
        (FAV[r.id] ? "true" : "false") + '">' + favLabel(!!FAV[r.id]) + '</button>';
  }

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
         수**만 적습니다.
         ⚠️⚠️ **쪽을 나누면 "N건" 이 그 쪽의 수입니다** — 전체인 것처럼
         적으면 세어 본 값이 아닙니다(절대 규칙 1). 쪽이 넘어가면
         "몇째 쪽" 을 적고, 다음 쪽이 있으면 **"이 쪽에 N건"** 입니다. */
      nl.textContent = PG > 0
        ? (PG + 1) + "번째 쪽 · 이 쪽에 " + rows.length + "건"
        : (rows.length >= LIMIT
            ? "이 쪽에 " + rows.length + "건 (다음 쪽이 있습니다)"
            : "매물 " + rows.length + "건");
    }
    if(!rows.length){
      /* ⚠️⚠️ **"아직 아무도 안 올렸다" 와 "조건에 맞는 것이 없다" 는
         다른 말입니다** — 같은 말로 적으면 손님이 조건을 지워 볼 생각을
         못 합니다. ⚠️ 0건이어도 막다른 길로 두지 않습니다 (절대 규칙 2).
         ⚠️⚠️ **쪽을 넘겨 와서 0건인 것은 셋째 경우**입니다 — 조건을
         지우라고 적으면 엉뚱한 말입니다(조건은 맞고 쪽이 지나간
         것입니다). */
      list.innerHTML = PG > 0 ? nonePage() :
        (nowBits().length ? noneNarrow() : noneEmpty());
      bindList(a);
      return;
    }
    list.innerHTML = tabs() + '<ul class="lsc-g">' + rows.map(card).join("") +
      '</ul>' + pager(rows.length);
    bindList(a);
  }
  /* ⚠️⚠️ **고르는 것과 찍는 것을 갈라 둡니다** — 삼항으로 두 글 덩이 중
     하나를 골라 `innerHTML` 에 넣으면 `check-safe` 가 "esc() 없이 변수를
     넣는 줄" 로 잡습니다. 그 검사가 맞습니다 — 여기 손님 글이 한 자라도
     들어오는 날 날것으로 나갑니다 (구합니다 글에서 겪은 자리). */
  function nonePage(){
    return '<div class="none">' +
      '<h3>이 쪽에는 매물이 없습니다.</h3>' +
      '<p>앞쪽으로 돌아가 보세요.</p>' +
      '<div class="none-b">' +
        '<a class="btn btn-pt" href="' + esc(pageUrl(0)) + '">첫 쪽으로</a>' +
      '</div></div>';
  }
  function noneNarrow(){
    return '<div class="none">' +
      '<h3>조건에 맞는 매물이 없습니다.</h3>' +
      '<p>조건을 넓혀 보시거나, 가지고 계신 것을 올려 보세요.</p>' +
      '<div class="none-b">' +
        /* ⚠️ 눌림은 **감싼 자리에서 받습니다**(`bindBar`) — 여기서
           따로 달면 지우는 조건이 두 곳이 되고, 실제로 앞 판은
           종류 · 지역 · 택배 셋만 지워 브랜드 · 가격대 · 찾는 말이
           그대로 걸린 채 "지웠습니다" 가 됐습니다. */
        '<button type="button" class="btn btn-line lsf-clear">조건 지우기</button>' +
      '</div></div>';
  }
  function noneEmpty(){
    return '<div class="none">' +
      '<h3>아직 올라온 매물이 없습니다.</h3>' +
      '<p>첫 매물을 올려 보세요. 사진 없이 글만으로도 올리실 수 있습니다.</p>' +
    '</div>';
  }

  /* ── 쪽 넘기기 ──────────────────────────────────────────────────
     ⚠️⚠️⚠️ **전체 쪽 수를 적지 않습니다.** 받아 온 줄이 한도에 닿았다는
     것은 "다음 쪽이 있다" 는 뜻일 뿐이고, 몇 쪽인지는 **세어 보지
     않았습니다** — "3 / 12" 처럼 적으면 그건 지어낸 숫자입니다
     (절대 규칙 1). 시안에 번호 줄이 있지만, 세어 본 수가 없는 번호는
     적을 수 없습니다.
     ⚠️⚠️ **단추가 아니라 링크**입니다 — 자바스크립트가 꺼진 분 · 봇에게
     단추는 눌러도 아무 일이 안 나는 칸입니다. */
  function pager(n){
    var prev = PG > 0
      ? '<a class="lspg-b" href="' + esc(pageUrl(PG - 1)) + '" data-pg="' +
        String(PG - 1) + '">' + window.icon("arrow", 16) + ' 앞쪽</a>'
      : '';
    var next = n >= LIMIT
      ? '<a class="lspg-b lspg-n" href="' + esc(pageUrl(PG + 1)) + '" data-pg="' +
        String(PG + 1) + '">다음 쪽 ' + window.icon("arrow", 16) + '</a>'
      : '';
    if(!prev && !next) return "";
    return '<nav class="lspg" aria-label="쪽 넘기기">' + prev +
      '<span class="lspg-i">' + (PG + 1) + '쪽</span>' + next + '</nav>';
  }
  function pageUrl(n){
    var keep = PG; PG = n;
    var keepV = F.v; F.v = "";
    var qs = [];
    if(F.sub)  qs.push("s="  + encodeURIComponent(F.sub));
    if(F.g)    qs.push("g="  + encodeURIComponent(F.g));
    if(F.rg)   qs.push("rg=" + encodeURIComponent(F.rg));
    if(F.ship) qs.push("sh=1");
    if(F.p)    qs.push("p="  + encodeURIComponent(F.p));
    if(F.br)   qs.push("br=" + encodeURIComponent(F.br));
    if(F.o)    qs.push("o="  + encodeURIComponent(F.o));
    if(F.q)    qs.push("q="  + encodeURIComponent(F.q));
    if(F.cd)   qs.push("cd=" + encodeURIComponent(F.cd));
    if(n > 0)  qs.push("pg=" + String(n + 1));
    PG = keep; F.v = keepV;
    return "/cat/used" + (qs.length ? "?" + qs.join("&") : "");
  }

  /* ⚠️⚠️⚠️ **눌림을 묶는 자리는 `bindBar()` 한 곳입니다.** 이 파일이
     스스로 적어 둔 규칙입니다 — "칩은 다시 그려지고 0건 상자는 목록 안에
     생기므로, 그릴 때마다 달면 빠뜨리는 자리가 생깁니다." 0069 가 더한
     것들(묶음 탭 · 쪽 · 찜 · 카드 · 상세의 작은 그림 · 목록으로)도 전부
     그 한 곳에서 받습니다. 그래서 여기서는 **다시 그린 뒤에 묶을 것이
     없습니다** — 그릴 때마다 묶으면 같은 손놀림에 호출이 두 번 돕니다
     (`#lslist` 가 `#lswrap` **안**이라 `.lsf-clear` 가 실제로 두 번
     돌 참이었습니다). */
  function bindList(a){
    /* ⚠️ 그릴 때마다 할 일은 **단추 줄을 채우는 것** 하나입니다 —
       그것만 `innerHTML` 로 만들어진 뒤에 값을 알 수 있습니다. */
    void a;
  }

  /* ⚠️⚠️ **찜은 눌린 그 단추만 바꿉니다** — 목록을 다시 그리면 보고
     계신 자리가 맨 위로 튕깁니다. 그리고 **서버가 돌려준 값**으로
     바꿉니다(화면이 먼저 뒤집어 놓으면 거절당한 날 켜진 채 남습니다). */
  function toggleFav(a, btn, id){
    if(!a.signedIn){
      window.location.href = window.amLoginUrl
        ? window.amLoginUrl("/cat/used?v=" + id) : "/login";
      return;
    }
    btn.disabled = true;
    call(a, "fav_listing", { id:id, on: !FAV[id] }).then(function(on){
      var yes = (on === true || on === "true");
      if(yes) FAV[id] = true; else delete FAV[id];
      btn.disabled = false;
      btn.classList.toggle("on", yes);
      btn.setAttribute("aria-pressed", yes ? "true" : "false");
      /* ⚠️ 상세의 단추는 글자도 바뀝니다 — 목록의 것은 아이콘뿐입니다.
         ⚠️⚠️ **글자를 짓는 자리는 `favLabel()` 한 곳**입니다 — 여기서
         이어 붙이면 `check-safe` 가 "esc() 없이 변수를 넣는 줄" 로
         잡습니다. 그 검사가 맞습니다(따라갈 함수 이름이 없습니다). */
      if(btn.classList.contains("lsd-fav")){
        btn.innerHTML = favLabel(yes);
      }else{
        var sr = btn.querySelector(".sr-only");
        if(sr) sr.textContent = "관심상품에 " + (yes ? "담김" : "담기");
      }
    }).catch(function(err){
      btn.disabled = false;
      /* ⚠️ 거절한 말을 **그대로** 보여 줍니다 (지어내지 않습니다) */
      try{ window.alert(String((err && err.message) || "담지 못했습니다.")); }catch(_){}
    });
  }

  /* ── 그리기 — ⚠️⚠️ **상세냐 목록이냐를 한 곳에서** 가릅니다 ──────
     ⚠️ 가르는 것은 `F.v` 하나입니다 — 두 곳에서 보면 뒤로 가기를 눌렀을
     때 한쪽만 바뀌어 **목록 위에 상세가 남습니다**. */
  function draw(a){
    if(F.v) return drawOne(a);
    side(false);
    return reload(a);
  }
  /* ⚠️⚠️⚠️ **감싼 상자(`#lswrap`)를 가리면 상세까지 같이 가려집니다** —
     `#lslist` 가 그 안에 있습니다(`mountBar()` 가 **옮겨** 넣습니다).
     처음에 `w.hidden = true` 로 적었다가 상세 화면이 **DOM 에는 있고
     눈에는 안 보이는** 꼴이 될 참이었습니다. 더 나쁜 것은 **제 검사가
     그것을 통과시켰다**는 것입니다 — `querySelector(".lsd")` 는 가려진
     것도 찾아 주므로 "상세가 섰다" 로 읽혔습니다(`offsetParent` 로
     재면 안 되는 그 자리와 같은 결입니다. 그려졌는지는
     **`getClientRects().length`** 로 봅니다).
     ⚠️ 그래서 가리는 것은 **거르개 레일과 맨 위 줄 · 올리는 양식**이고,
     목록 자리는 그대로 둡니다. 그리고 레일이 빠진 만큼 본문이 넓어지게
     감싼 상자에 딱지를 답니다(`lsw-1`) — 안 달면 PC 에서 **왼쪽 262px
     이 빈 칸**으로 남습니다. */
  function side(on){
    var w  = document.getElementById("lswrap");
    var rl = document.getElementById("lsrail");
    var br = document.getElementById("lsbar");
    if(rl) rl.hidden = !!on;
    if(br) br.hidden = !!on;
    if(w) w.classList.toggle("lsw-1", !!on);
    /* ⚠️⚠️⚠️ **목록 화면의 머리글과 하위 칩까지 같이 가립니다** — 빌드가
       찍어 둔 「올라온 매물」 구간 제목 · 길잡이 한 줄 · 물건 종류 칩
       열셋 · 아래 주의 두 줄이 `#lswrap` **밖**에 있어서, 상세를 열어도
       그것들이 그대로 위에 서 있었습니다. 재 보니 폰에서 제목이
       **1,602px** 아래였습니다 — 손님이 상세를 열고 화면 두 개를 밀어야
       물건 이름이 나옵니다. 가로로 밀리지도 · 글자가 작지도 · 대비가
       낮지도 않아 **어떤 검사도 안 잡습니다**. **찍어 보고** 알았습니다.
       ⚠️ 집는 법은 **「`#lswrap` 말고 전부」** 입니다 — 클래스 이름을
       늘어놓으면 빌드가 한 줄 더 찍는 날 그것만 남습니다(이 저장소가
       "열쇠를 더하는 날 첫 그림 조건도 같이" 로 겪은 자리).
       ⚠️ **지우지 않고 가립니다** — 목록으로 돌아올 때 다시 세워야 합니다. */
    var box = w && w.parentNode;
    if(box){
      Array.prototype.forEach.call(box.children, function(el){
        if(el !== w) el.hidden = !!on;
      });
    }
  }
  function drawOne(a){
    /* ⚠️⚠️ **상세를 볼 때는 거르개와 올리는 양식을 가립니다** — 남겨
       두면 한 화면에 "이 매물" 과 "모든 매물의 거르개" 가 같이 서서
       무엇을 거르는 칸인지 알 수 없습니다. (지우지 않고 **가립니다** —
       지우면 목록으로 돌아올 때 다시 세워야 합니다.)
       ⚠️⚠️⚠️ 가리는 자리는 **`side()` 한 곳**입니다 — 여기서 상자를
       직접 집으면 `#lswrap` 을 가려 **상세까지 같이 가려집니다**
       (`#lslist` 가 그 안입니다). 실제로 그렇게 적었다가 잡았습니다. */
    side(true);
    list.innerHTML = '<p class="lsd-wait">불러오는 중입니다…</p>';
    var id = F.v;
    return loadOne(a, id).then(function(x){
      /* ⚠️⚠️ 그 사이에 손님이 뒤로 가기를 눌렀으면 **안 그립니다** —
         안 보면 늦게 온 답이 목록을 덮어씁니다. */
      if(F.v !== id) return;
      if(!x.row){
        /* ⚠️⚠️ **"없다" 와 "못 읽었다" 를 가립니다** — 공개 보기는 팔린 ·
           내려간 · 가려진 매물을 안 냅니다. 그러니 0줄은 "그런 매물이
           없다" 가 아니라 **"지금은 볼 수 없다"** 입니다 (절대 규칙 1 ·
           모르는 것을 단정하지 않습니다). */
        list.innerHTML = '<div class="none">' +
          '<h3>지금은 볼 수 없는 매물입니다.</h3>' +
          '<p>팔렸거나 올리신 분이 내렸을 수 있습니다.</p>' +
          '<div class="none-b"><a class="btn btn-pt" href="' + esc(backUrl()) +
            '" data-back="1">매물 목록으로</a></div></div>';
        bindOne(a, null);
        return;
      }
      list.innerHTML = oneHtml(x.row, x.ph);
      bindOne(a, x.row);
    }).catch(function(){
      if(F.v !== id) return;
      /* ⚠️ 못 읽은 것을 "없다" 로 적지 않습니다 */
      list.innerHTML = '<div class="none">' +
        '<h3>매물을 불러오지 못했습니다.</h3>' +
        '<p>잠시 뒤에 다시 열어 보세요. 0건이라는 뜻이 아닙니다.</p>' +
        '<div class="none-b"><a class="btn btn-pt" href="' + esc(backUrl()) +
          '" data-back="1">매물 목록으로</a></div></div>';
      bindOne(a, null);
    });
  }

  /* ⚠️ 쪽 · 탭 · 상세를 오갈 때 맨 위로 — 안 올리면 다음 쪽의 첫 줄이
     화면 밖에 있어 **아무 일도 안 난 것처럼** 보입니다. */
  function top0(){
    try{ window.scrollTo({ top:0, behavior:"smooth" }); }catch(_){ }
  }

  /* 지금 보고 있는 매물 한 줄 — ⚠️ 문의 양식의 제목에 씁니다.
     ⚠️⚠️ **담아 두는 것은 이것 하나**입니다(제목뿐). 다른 값은 그릴 때
     쓰고 버립니다 — 담아 두면 다른 창에서 값이 바뀐 날 옛 값을 그립니다. */
  var ONE = null;

  function bindOne(a, r){
    ONE = r;
    if(!r) return;
    /* 단추 줄 — ⚠️⚠️ **제 매물인지는 화면이 모릅니다**(`v_listing_open`
       에 `by_user` 가 없습니다 · 0056). 그래서 문의 단추를 내고, 제
       매물이면 **문이 거절한 말을 그대로** 보여 줍니다("올리신 분은
       문의하실 수 없습니다") — 알아내려고 다른 보기를 더 부르면 그
       호출이 모든 상세에 붙습니다. */
    var bw = document.getElementById("lsd-b");
    if(bw) bw.innerHTML = oneBtns(r, false);
    void a;
  }

  /* 문의 보내기 — ⚠️ 묶는 자리는 `bindBar()` 한 곳이고 여기는 **보내는
     일**만 합니다 (양식이 다시 열릴 때마다 묶으면 두 번 보냅니다). */
  function sendAsk(a, f){
    var wrap = f.parentNode;
    var msg = wrap.querySelector("#lsmsg2");
    var btn = f.querySelector('button[type="submit"]');
    if(btn) btn.disabled = true;
    if(msg){ msg.hidden = false; msg.textContent = "보내는 중입니다…"; }
    call(a, "ask_listing", {
      listing_id: f.getAttribute("data-id"),
      msg: f.msg.value, contact: f.contact.value,
      /* ⚠️ 동의 시각은 **누른 그 순간**입니다 (연 시각이 아닙니다) */
      agree_at: new Date().toISOString()
    }).then(function(){
      wrap.innerHTML = '<div class="none">' +
        '<h3>문의를 보냈습니다.</h3>' +
        /* ⚠️⚠️ 문장 한가운데 링크를 박지 않습니다 (높이 16px) —
           문단 끝에 **단추**로 냅니다. */
        '<p>올리신 분이 보고 받아들이시면 연락처를 주고받으실 수 ' +
        /* ⚠️ 지킬 수 없는 약속을 하지 않습니다 */
        '있습니다. 언제까지라고 약속드리지는 않습니다.</p>' +
        '<a class="btn btn-pt" href="/my">내 정보에서 보기</a></div>';
    }).catch(function(err){
      if(btn) btn.disabled = false;
      /* ⚠️ 거절한 말을 **그대로** 보여 줍니다 — 제 매물에 문의하시면
         문이 "올리신 분은 문의하실 수 없습니다" 라고 말합니다 */
      if(msg) msg.textContent = String((err && err.message) || "보내지 못했습니다.");
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

      /* ── 0069 에서 더한 것들 ─────────────────────────────────────
         ⚠️ 새 탭 · 다른 창으로 여시는 것은 **가로채지 않습니다** */
      var mod = e.metaKey || e.ctrlKey || e.shiftKey || e.button;

      /* 찜 — ⚠️ 카드가 링크이므로 **먼저** 봅니다(링크로 떠나지 않게) */
      var fv = t.closest("[data-fav]");
      if(fv){
        e.preventDefault(); e.stopPropagation();
        toggleFav(a, fv, fv.getAttribute("data-fav"));
        return;
      }
      /* 작은 그림 — 큰 그림만 갈아 끼웁니다 (주소는 안 바꿉니다) */
      var sh = t.closest("[data-shot]");
      if(sh){
        var big = document.getElementById("lsd-big");
        if(big) big.src = sh.getAttribute("data-shot");
        Array.prototype.forEach.call(w.querySelectorAll(".lsd-t"),
          function(x){ x.classList.remove("on"); });
        sh.classList.add("on");
        return;
      }
      /* 묶음 탭 */
      var gb = t.closest("[data-g]");
      if(gb && !mod){
        e.preventDefault();
        var g = gb.getAttribute("data-g");
        F.g = (g === "all") ? "" : g;
        /* ⚠️⚠️ **묶음을 바꾸면 종류를 같이 풉니다** — 안 풀면 「클럽」
           에서 아이언을 고른 뒤 「용품」으로 가도 아이언이 그대로 걸려
           **영원히 0건**입니다 (업체찾기에서 분류를 바꿀 때 하위를 푸는
           그 까닭). */
        F.sub = ""; PG = 0;
        writeUrl(); syncRail(); syncChips(); reload(a);
        top0();
        return;
      }
      /* 쪽 넘기기 */
      var pb = t.closest("[data-pg]");
      if(pb && !mod){
        e.preventDefault();
        PG = Math.max(0, parseInt(pb.getAttribute("data-pg"), 10) || 0);
        writeUrl(); reload(a);
        top0();
        return;
      }
      /* 목록으로 돌아가기 (상세에서) */
      var bk = t.closest("[data-back]");
      if(bk && !mod){
        e.preventDefault();
        var u = backUrl();
        F.v = "";
        try{ history.pushState(null, "", u); }catch(_){}
        draw(a);
        top0();
        return;
      }
      /* 카드 → 상세 */
      var ob = t.closest("[data-one]");
      if(ob && !mod){
        e.preventDefault();
        F.v = ob.getAttribute("data-one");
        try{ history.pushState(null, "", oneUrl(F.v)); }catch(_){}
        draw(a);
        top0();
        return;
      }
      /* 문의 양식 열기 · 닫기 */
      if(t.closest(".lsaf-x")){
        var of = w.querySelector("#lsaf");
        if(of) of.remove();
        return;
      }
      var ak = t.closest(".lsd-ask");
      if(ak){
        var bw = document.getElementById("lsd-b");
        if(!bw) return;
        if(bw.querySelector("#lsaf")){ bw.querySelector("#lsaf").remove(); return; }
        bw.insertAdjacentHTML("beforeend",
          askForm(ak.getAttribute("data-id"), ONE ? ONE.title : ""));
        return;
      }
    });

    /* ⚠️⚠️ **보내기도 감싼 자리에서 받습니다** — 양식이 다시 그려질 때
       마다 묶으면 한 번 보낸 뒤 다시 열었을 때 **두 번 보냅니다**.
       ⚠️ `submit` 은 거품처럼 올라옵니다(`change` 와 달리 `focus` 류가
       아닙니다). */
    w.addEventListener("submit", function(e){
      var f = e.target;
      if(!f || f.id !== "lsaf") return;
      e.preventDefault();
      sendAsk(a, f);
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
      /* ⚠️⚠️ **모델명은 브랜드와 반대로 비워도 됩니다** (0069) — 반드시
         받으면 모델명을 모르시는 분이 매물을 **아예 못 올립니다**
         (절대 규칙 2). 그래서 별표를 안 붙이고, 비면 상세 화면에서
         **줄째 빠집니다**("(미기재)" 를 찍지 않습니다). */
      '<div class="jrow">' +
        '<label for="l-model">모델명</label>' +
        '<input id="l-model" name="model" maxlength="40" ' +
          'placeholder="예: 스텔스2 · P790">' +
        '<span class="jhint">모르시면 비워 두셔도 됩니다. ' +
        '적어 두시면 찾는 분이 더 쉽게 봅니다.</span>' +
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
    /* ⚠️⚠️ **찜을 먼저 받고 그립니다** — 안 기다리면 카드가 꺼진 하트로
       먼저 그려지고, 답이 온 뒤에 다시 그려야 합니다(그러면 보고 계신
       자리가 맨 위로 튕깁니다). 못 읽으면 빈 묶음이고 그대로 그립니다. */
    loadFav(a).then(function(m){ FAV = m; draw(a); });
    /* ⚠️⚠️⚠️ **뒤로 가기를 받습니다** — 상세로 들어가는 길이 `pushState`
       라, 이 줄이 없으면 뒤로 가기를 눌러도 **화면이 그대로** 있습니다
       (주소만 바뀌어서, 손님은 뒤로 가기가 고장난 것으로 읽습니다). */
    window.addEventListener("popstate", function(){ readUrl(); draw(a); });

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
        /* ⚠️ 모델명은 **비울 수 있습니다** — 빈 글자를 보내면 0069 가
           null 로 담습니다 (보냈는지를 `p ? 'model'` 로 봅니다). */
        model: f.model.value,
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
