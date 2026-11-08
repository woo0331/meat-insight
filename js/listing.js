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
  var F = { sub:"", rg:"", ship:false, p:"" };
  /* ⚠️ 0058 — 로그인한 분에게만 "조건 저장" 길을 냅니다. 로그인 전에
     그리면 눌러서 로그인 화면으로 갔다가 돌아와도 **저장된 것이 없는**
     꼴이 됩니다 (절대 규칙 5). */
  var SIGNED = false;

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
    }catch(e){}
  }
  function writeUrl(){
    try{
      var qs = [];
      if(F.sub)  qs.push("s="  + encodeURIComponent(F.sub));
      if(F.rg)   qs.push("rg=" + encodeURIComponent(F.rg));
      if(F.ship) qs.push("sh=1");
      if(F.p)    qs.push("p="  + encodeURIComponent(F.p));
      history.replaceState(null, "",
        location.pathname + (qs.length ? "?" + qs.join("&") : ""));
    }catch(e){}
  }

  function filterBar(){
    var sb = subs().map(function(it){
      return '<option value="' + esc(it.key) + '"' +
        (F.sub === it.key ? " selected" : "") + '>' + esc(it.name) + '</option>';
    }).join("");
    /* ⚠️⚠️ **묶음 여섯을 먼저** 냅니다 — 현황표의 칸이 묶음을 보내므로,
       안 내면 칸을 눌러 들어온 분의 고르개가 "전국" 으로 보입니다
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
    return '<form class="jform jnf-f" id="lsfil">' +
      '<div class="jrow"><label for="lf-s">물건 종류</label>' +
        '<select id="lf-s"><option value="">전체</option>' + sb + '</select></div>' +
      '<div class="jrow"><label for="lf-rg">지역</label>' +
        '<select id="lf-rg"><option value="">전국</option>' + rg + '</select></div>' +
      /* ⚠️⚠️ **값으로 좁히는 길이 2026-11-08 까지 없었습니다** — 0056 은
         `listing.price` 를 반드시 받아 놓고 목록은 그 칸으로 못 좁혔습니다.
         ⚠️ 구간은 `AM_LST_PRICE` 한 곳이고 **아래를 닫고 위를 엽니다**
         (gte · lt) — 둘 다 닫으면 딱 10만원짜리가 두 칸에 다 걸립니다. */
      '<div class="jrow"><label for="lf-p">가격대</label>' +
        '<select id="lf-p"><option value="">전체 가격</option>' + pb + '</select></div>' +
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
    '<p class="jnf-n" id="lsnow" hidden></p>';
  }

  function card(r){
    return '<li class="lsc">' +
      '<div class="lsc-h">' +
        '<h3>' + esc(r.title) + '</h3>' +
        /* ⚠️⚠️ **0 은 "무료" 입니다** — `||` 를 쓰면 0원이 사라집니다.
           세는 자리는 `amLstPrice()` 한 곳입니다. */
        '<span class="lsc-p">' + esc(window.amLstPrice(r.price)) + '</span>' +
      '</div>' +
      '<p class="lsc-m">' + esc(subName(r.sub)) +
        ' · ' + esc(window.amLstCondName(r.cond)) +
        ' · ' + esc(rgName(r.region)) +
        (r.ship ? ' · 택배 가능' : '') +
        (Number(r.ask_n) > 0 ? ' · 문의 ' + esc(String(r.ask_n)) + '건' : '') +
      '</p>' +
      '<p class="lsc-b">' + esc(r.body) + '</p>' +
      '<button type="button" class="btn btn-pt lsc-go" data-id="' +
        esc(r.id) + '">사겠다고 문의하기</button>' +
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
    var qs = ["select=id,sub,region,ship,title,body,price,cond,ask_n",
              "order=created_at.desc", "limit=50"];
    if(F.sub)  qs.push("sub=eq."    + encodeURIComponent(F.sub));
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
  function nowBits(){
    var b = [];
    if(F.sub)  b.push(subName(F.sub));
    if(F.rg)   b.push(window.amRegionLabel ? window.amRegionLabel(F.rg) : rgName(F.rg));
    if(F.ship) b.push("택배 가능");
    if(bd0()) b.push(bd0().name);
    return b;
  }

  function paint(a, rows){
    var nl = document.getElementById("lsnow");
    if(nl){
      var b = nowBits();
      nl.hidden = false;
      nl.textContent = (b.length ? b.join(" · ") + " — " : "") +
        "매물 " + rows.length + "건";
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
            '<button type="button" class="btn btn-line" id="lf-all">조건 지우기</button>' +
          '</div></div>'
        : '<div class="none">' +
          '<h3>아직 올라온 매물이 없습니다.</h3>' +
          '<p>첫 매물을 올려 보세요. 사진 없이 글만으로도 올리실 수 있습니다.</p>' +
        '</div>';
      var ab = document.getElementById("lf-all");
      if(ab) ab.addEventListener("click", function(){
        F.sub = ""; F.rg = ""; F.ship = false;
        writeUrl(); mountBar(); reload(a);
      });
      return;
    }
    list.innerHTML = '<ul class="lsl">' + rows.map(card).join("") + '</ul>';
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

  function mountBar(){
    var box = document.getElementById("lsfilbox");
    if(!box){
      box = document.createElement("div");
      box.id = "lsfilbox";
      list.parentNode.insertBefore(box, list);
    }
    box.innerHTML = filterBar();
  }
  function bindBar(a){
    var box = document.getElementById("lsfilbox");
    if(!box) return;
    box.addEventListener("change", function(e){
      var t = e.target;
      if(!t || !t.id) return;
      if(t.id === "lf-s")       F.sub = t.value;
      else if(t.id === "lf-rg") F.rg = t.value;
      else if(t.id === "lf-sh") F.ship = !!t.checked;
      else if(t.id === "lf-p")  F.p = t.value;
      else return;
      writeUrl();
      reload(a);
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

    document.getElementById("lsf").addEventListener("submit", function(e){
      e.preventDefault();
      var f = e.target, msg = document.getElementById("lsmsg");
      var btn = f.querySelector('button[type="submit"]');
      btn.disabled = true;
      msg.hidden = false; msg.textContent = "올리는 중입니다…";
      call(a, "open_listing", {
        title: f.title.value, sub: f.sub.value, cond: f.cond.value,
        region: f.region.value, price: f.price.value,
        /* ⚠️ 체크박스는 **참 · 거짓**으로 보냅니다 ("on" 이 아닙니다) */
        ship: !!document.getElementById("l-ship").checked,
        body: f.body.value, contact: f.contact.value,
        agree_at: new Date().toISOString()
      }).then(function(){
        box.className = "none";
        box.innerHTML = '<h3>매물을 올렸습니다.</h3>' +
          '<p>목록에 바로 보입니다. 문의가 들어오면 내 정보에서 ' +
          '받아들이실 수 있습니다.</p>' +
          '<a class="btn btn-pt" href="/my">내 정보에서 보기</a>';
        reload(a);
      }).catch(function(err){
        btn.disabled = false;
        msg.textContent = String((err && err.message) || "올리지 못했습니다.");
      });
    });
  }).catch(function(){ /* 못 물어봤으면 빌드가 찍은 글 그대로 */ });
})();
