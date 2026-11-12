/* ════════════════════════════════════════════════════════════════════
   골프 여행 상품 — 여행사 작업실 (/desk · DB 는 0073)

   ⚠️⚠️⚠️ **0073 은 표 둘 · 문 아홉 · 보기 넷을 세워 두고 화면을 한 장도
   안 만들었습니다.** 그래서 `check-doors` 가 그 아홉을 전부 "빈 문" 으로
   세고 있었고, 그 상태로 운영 DB 에 올리면 **여행사가 상품을 올릴 길이
   없는 표**만 생깁니다. 이 화면이 그 길입니다.

   ⚠️⚠️⚠️ **공개본과 수정본이 다릅니다.** 승인된 상품을 고치면 그 값이
   `draft` 로 들어가고 **지금 팔리는 상품은 그대로**입니다 — 운영자가
   수정본을 승인해야 갈아 끼웁니다. 화면이 그 둘을 **갈라서** 보여
   주어야 합니다(안 그러면 고쳐 놓고 "왜 안 바뀌지" 가 됩니다).

   ⚠️⚠️ **사진도 같은 규칙입니다** — 승인 뒤에 올린 사진은 `live=false`
   로 들어가 승인될 때까지 안 보이고, 빼는 것도 `drop_pending` 입니다.

   ⚠️ 승인된 업체만 올릴 수 있습니다 — 문이 거절하므로 **양식을 안 열고
   그 까닭을 적습니다**(눌러도 거절되는 칸을 그리지 않습니다 · 규칙 5).

   ⚠️ 로그인 전에는 **한 글자도 안 그립니다.**
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("triprobox");
  if(!box || !window.amAuthAsk) return;

  var esc = window.esc, icon = window.icon;
  var A = null, ROWS = null, PV = null, UP = false;
  /* 사진은 상품 id 로 묶어 둡니다 — ⚠️ 공개 보기는 **승인된 상품의
     live 사진만** 내므로 여기서는 `v_trip_photo_mine` 을 읽습니다
     (심사 중인 사진의 id 를 알 길이 그것뿐입니다). */
  var PH = {};

  function get(path){
    return fetch(A.conf.url + "/rest/v1/" + path, {
      headers: Object.assign({ apikey:A.conf.anonKey },
                             window.amAuthHeaders ? window.amAuthHeaders() : {})
    }).then(function(r){ return r.ok ? r.json() : null; })
      .catch(function(){ return null; });
  }
  function call(fn, p){
    return fetch(A.conf.url + "/rest/v1/rpc/" + fn, {
      method:"POST",
      headers: Object.assign({ "content-type":"application/json",
                               apikey:A.conf.anonKey },
                             window.amAuthHeaders ? window.amAuthHeaders() : {}),
      body: JSON.stringify({ p: p })
    }).then(function(r){
      return r.text().then(function(t){
        if(!r.ok){ var m = t; try{ m = JSON.parse(t).message || t; }catch(_){}
                   throw new Error(m); }
        try{ return JSON.parse(t); }catch(_){ return t; }
      });
    });
  }

  function dests(scope){
    if(scope === "abroad") return window.AM_TRIP_REGIONS || [];
    if(scope === "home")   return window.AM_REGIONS || [];
    return (window.amRegionsOf ? window.amRegionsOf("travel")
                               : (window.AM_REGIONS || []));
  }
  function destName(k){
    var L = dests("");
    for(var i = 0; i < L.length; i++) if(L[i].key === k) return L[i].name;
    return k ? String(k) : "";
  }
  function stName(k){
    var s = window.amTripSt ? window.amTripSt(k) : null;
    return s ? s.name : String(k || "");
  }
  function stLead(k){
    var s = window.amTripSt ? window.amTripSt(k) : null;
    return s ? (s.lead || "") : "";
  }

  /* ⚠️ 포함 · 불포함은 **고르개가 아니라 거들기**입니다 — 목록에 없는
     것도 적으실 수 있어야 합니다(절대 규칙 2 · 0068 의 브랜드와 같은 결). */
  function itemHint(){
    var L = window.AM_TRIP_ITEM || [];
    if(!L.length) return "";
    return '<span class="jhint">자주 적는 것: ' + esc(L.join(" · ")) +
      ' (쉼표로 나눠 적으시고, 목록에 없는 것도 적으실 수 있습니다)</span>';
  }

  /* ⚠️⚠️⚠️ **같은 id 를 두 양식에 찍지 않습니다.** 이 화면에는 새로
     올리는 양식이 늘 서 있고, 거기에 「고치기」를 누르면 줄마다 양식이
     하나 더 열립니다 — id 를 글자로 박으면 **같은 id 가 둘 · 셋**이
     되고, 화면 읽는 기계가 이름표를 어느 칸에 붙여야 할지 모릅니다
     (0046 의 동의 상자 · 0068 의 사진 상자에서 겪은 그 자리).
     ⚠️ `check-a11y` 는 **빌드가 찍은 HTML** 만 보므로 이 자리를 영원히
     못 봅니다 — 그래서 꼬리표를 양식마다 다르게 답니다. */
  function form(r){
    var e = r || {};
    var sc = e.scope || "home";
    var q = r ? ("-" + String(r.id || "").slice(0, 8)) : "-new";
    return '<form class="jform tpr-f">' +
      '<div class="jrow">' +
        '<label for="tpr-sc' + q + '">국내 · 해외 <b>*</b></label>' +
        '<select id="tpr-sc' + q + '" name="scope" required>' +
          (window.AM_TRIP_SCOPE || []).map(function(s){
            return '<option value="' + esc(s.key) + '"' +
              (sc === s.key ? " selected" : "") + '>' + esc(s.name) + '</option>';
          }).join("") +
        '</select>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="tpr-ds' + q + '">목적지 <b>*</b></label>' +
        '<select id="tpr-ds' + q + '" name="dest" required>' +
          dests(sc).map(function(x){
            return '<option value="' + esc(x.key) + '"' +
              (e.dest === x.key ? " selected" : "") + '>' + esc(x.name) +
              '</option>';
          }).join("") +
        '</select>' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label for="tpr-ti' + q + '">상품 이름 <b>*</b></label>' +
        '<input id="tpr-ti' + q + '" name="title" maxlength="80" required ' +
          'value="' + esc(e.title || "") + '" placeholder="제주 1박 2일 36홀">' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="tpr-ni' + q + '">몇 박 <b>*</b></label>' +
        '<input id="tpr-ni' + q + '" name="nights" inputmode="numeric" required ' +
          'value="' + esc(e.nights === 0 || e.nights ? String(e.nights) : "") +
          '" placeholder="1">' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="tpr-dy' + q + '">며칠 <b>*</b></label>' +
        '<input id="tpr-dy' + q + '" name="days" inputmode="numeric" required ' +
          'value="' + esc(e.days ? String(e.days) : "") + '" placeholder="2">' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="tpr-pf' + q + '">1인 기준 최저가 <b>*</b></label>' +
        '<input id="tpr-pf' + q + '" name="price_from" inputmode="numeric" required ' +
          'value="' + esc(e.price_from ? String(e.price_from) : "") +
          '" placeholder="390000">' +
        /* ⚠️⚠️ 값을 비우게 두면 화면이 "가격 문의" 를 **지어 적게**
           됩니다 (0056 이 매물 값을 반드시 받는 그 까닭). */
        '<span class="jhint">손님 화면에는 「1인 390,000원<b>부터</b>」로 ' +
          '나갑니다 — 가장 싼 조건의 1인 값을 적어 주세요.</span>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="tpr-pn' + q + '">값에 붙는 말</label>' +
        '<input id="tpr-pn' + q + '" name="price_note" maxlength="120" ' +
          'value="' + esc(e.price_note || "") + '" placeholder="일정에 따라 금액 변동">' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="tpr-in' + q + '">포함</label>' +
        '<input id="tpr-in' + q + '" name="incl" maxlength="200" ' +
          'value="' + esc((e.incl || []).join(", ")) + '" placeholder="숙박, 36홀">' +
        itemHint() +
      '</div>' +
      '<div class="jrow">' +
        '<label for="tpr-ex' + q + '">별도</label>' +
        '<input id="tpr-ex' + q + '" name="excl" maxlength="200" ' +
          'value="' + esc((e.excl || []).join(", ")) + '" placeholder="항공, 카트">' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label for="tpr-bd' + q + '">일정 · 안내 <b>*</b></label>' +
        '<textarea id="tpr-bd' + q + '" name="body" rows="7" maxlength="4000" required ' +
          'placeholder="날짜별 일정과 포함 · 불포함 조건을 적어 주세요.">' +
          esc(e.body || "") + '</textarea>' +
      '</div>' +
      '<p class="tpr-msg" role="status"></p>' +
      '<div class="jrow jrow-full tpr-b">' +
        '<button type="submit" class="btn btn-pri">' +
          (r ? "수정본 보내기" : "상품 올리기") + '</button>' +
        (r ? '<button type="button" class="btn btn-bad tpr-x">그만두기</button>' : "") +
      '</div>' +
    '</form>';
  }

  /* 사진 — ⚠️ 버킷이 꺼져 있으면 그 줄을 **줄째 뺍니다**(빈 칸을 안
     남깁니다 · 0068 에서 세운 규칙). */
  function shotLine(x, first){
    var u = window.amPubUrl ? window.amPubUrl(A.conf, x.path) : "";
    var st = x.drop_pending ? "빼는 중"
           : (x.live ? (first ? "대표 사진" : "보이는 중") : "심사 중");
    return '<li class="tpr-s" data-ph="' + esc(x.id) + '">' +
      (u ? '<img src="' + esc(u) + '" alt="' + esc(x.caption || "") +
           '" loading="lazy" decoding="async">'
         : '<span class="tpr-s-x">' + icon("camera", 18) + '</span>') +
      '<span class="tpr-s-t">' + esc(st) + '</span>' +
      /* ⚠️⚠️ 「맨 앞으로」가 곧 「대표로」입니다 — 따로 두면 `ord` 와
         대표가 두 값이 되고 **카드와 상세가 다른 사진**을 냅니다(0069).
         ⚠️ 맨 앞에서는 그 단추를 **안 냅니다**(눌러도 아무 일이 안 나는
         칸입니다 · 절대 규칙 5). */
      '<span class="tpr-s-b">' +
        (first ? "" :
          '<button type="button" class="btn btn-line btn-sm tpr-s-up">맨 앞으로</button>') +
        (x.drop_pending ? "" :
          '<button type="button" class="btn btn-bad btn-sm tpr-s-rm">빼기</button>') +
      '</span>' +
    '</li>';
  }

  function photoBox(r){
    if(!UP) return "";
    return '<div class="tpr-ph" data-trip="' + esc(r.id) + '">' +
      '<p class="tpr-ph-h">' + icon("camera", 15) + '사진 ' +
        esc(String(r.photo_n || 0)) + '장' +
        (r.photo_draft_n ? ' <i>(심사 중 ' + esc(String(r.photo_draft_n)) +
          '장)</i>' : "") +
        (r.photo_drop_n ? ' <i>(빼는 중 ' + esc(String(r.photo_drop_n)) +
          '장)</i>' : "") + '</p>' +
      '<p class="tpr-ph-b">' +
        '<label class="btn btn-line btn-sm">' + icon("camera", 16) +
          '사진 고르기' +
          '<input type="file" class="tpr-ph-i" accept="image/*" multiple hidden>' +
        '</label>' +
      '</p>' +
      ((PH[r.id] || []).length
        ? '<ul class="tpr-sl">' + PH[r.id].map(function(x, i){
            return shotLine(x, i === 0);
          }).join("") + '</ul>'
        : "") +
      '<p class="tpr-ph-m" role="status"></p>' +
    '</div>';
  }

  function row(r){
    var draft = r.draft_state && r.draft_state !== "none";
    var dl = window.amTripDraftSt ? window.amTripDraftSt(r.draft_state) : null;
    return '<li class="tpr-r" data-id="' + esc(r.id) + '">' +
      '<p class="tpr-t"><b>' + esc(r.title) + '</b>' +
        '<span class="tpr-st tpr-st-' + esc(r.state) + '">' +
          esc(stName(r.state)) + '</span></p>' +
      '<p class="tpr-m">' + esc([destName(r.dest),
          (window.amTripSpan ? window.amTripSpan(r) : ""),
          (window.amTripPrice ? window.amTripPrice(r) : "")]
        .filter(Boolean).join(" · ")) + '</p>' +
      '<p class="tpr-lead">' + esc(stLead(r.state)) + '</p>' +
      /* ⚠️⚠️ 반려 까닭은 **올린 분에게 보여 줍니다** — 까닭 없이 못
         반려하게 해 두고 그 까닭을 숨기면 무엇이 문제였는지 알 수가
         없습니다 (0047 에서 세운 규칙). */
      /* ⚠️⚠️⚠️ **칸 이름은 `state_why` 입니다** — `v_trip_mine` 이
         `t.*` 를 내므로 `r.why` 는 **늘 undefined** 였습니다. 그래서
         바로 위 주석이 "까닭을 보여 준다" 고 적어 두고 **한 번도 안
         보여 주고** 있었습니다(에러 0줄 · 화면 검사가 0건이던 자리).
         2026-11-12 에 여행 화면 검사를 넣으면서 드러났습니다. */
      (r.state_why
        ? '<p class="tpr-why">운영자 메모: ' + esc(r.state_why) + '</p>' : "") +
      (draft && dl
        ? '<p class="tpr-draft">' + esc(dl.name) +
            (dl.lead ? ' — ' + esc(dl.lead) : "") +
            (r.draft_why ? ' (' + esc(r.draft_why) + ')' : "") + '</p>'
        : "") +
      photoBox(r) +
      '<p class="tpr-act">' +
        '<button type="button" class="btn btn-line btn-sm tpr-ed">고치기</button>' +
        (r.state === "closed"
          ? '<button type="button" class="btn btn-pt btn-sm tpr-re">다시 판매</button>'
          : (r.state === "approved" || r.state === "pending"
             ? '<button type="button" class="btn btn-bad btn-sm tpr-cl">판매 중지</button>'
             : "")) +
      '</p>' +
      '<div class="tpr-slot"></div>' +
    '</li>';
  }

  /* ⚠️ `check-safe` ⑥ 은 innerHTML 에 들어가는 **덩이마다 함수 이름**을
     따라갑니다 — 변수로 이어 붙이면 따라갈 이름이 없어 잡힙니다. */
  function headHtml(){
    return '<h2>' + icon("plane", 20) + '골프 여행 상품</h2>' +
      '<p class="jnote">올리신 상품은 <b>운영자 확인을 거쳐</b> 손님 ' +
      '목록에 섭니다. 팔고 계신 상품을 고치시면 <b>지금 보이는 상품은 ' +
      '그대로</b> 팔리고, 고치신 내용은 확인을 거쳐 갈아 끼웁니다.</p>';
  }
  function noPvHtml(){
    return '<h2>' + icon("plane", 20) + '골프 여행 상품</h2>' +
      '<p class="none-l">입점하신 업체 계정으로 로그인하셔야 상품을 ' +
      '올리실 수 있습니다.</p>';
  }
  function failHtml(){
    return '<p class="none-l">지금 상품을 불러오지 못했습니다. 상품이 ' +
      '없다는 뜻이 <b>아닙니다.</b> 잠시 뒤에 다시 들러 주세요.</p>';
  }
  function emptyHtml(){
    return '<p class="none-l">아직 올리신 상품이 없습니다.</p>';
  }
  /* ⚠️⚠️⚠️ **`<details>` 로 접지 않습니다.** 처음에 그렇게 썼는데, 이
     저장소는 세 곳에 그 까닭을 적어 두었습니다 — 접힌 글은
     `check-screens` 의 12px · 대비 검사와 `test-desk` 의 누름 40px
     검사에서 **빠집니다**(`getClientRects().length` 가 0 입니다). 즉 그
     양식만 아무도 안 재는 자리가 됩니다.
     ⚠️ 대신 저장소의 다른 /desk 상자와 **같은 꼴**로 단추가 엽니다
     (`js/deskprice.js` 의 `data-pf` 와 같은 결). */
  function newHtml(){
    return '<div class="tpr-new">' +
      '<p class="tpr-new-b"><button type="button" class="btn btn-pt tpr-add">' +
        icon("plane", 17) + '새 상품 올리기</button></p>' +
      '<div class="tpr-new-s">' + (NEW ? form(null) : "") + '</div>' +
    '</div>';
  }
  /* ⚠️ 새 양식이 열려 있는지는 **여기 한 곳**이 들고 있습니다 — 다시
     그릴 때마다 닫히면 적다 만 글이 사라집니다. */
  var NEW = false;
  function draw(){
    if(!PV){
      box.hidden = false;
      box.innerHTML = noPvHtml();
      return;
    }
      /* ⚠️⚠️⚠️ **`none` 을 떼야 합니다.** 빌드가 이 그릇을
         `class="none"` 으로 찍어 두는데(0건 안내용), 그대로 두고 내용을
         채우면 `.none` 의 `text-align:center` 가 **모든 줄을 가운데로**
         밀어 제목만 왼쪽이고 나머지가 가운데인 꼴이 됩니다. 가로로
         밀리지도 · 글자가 작지도 · 대비가 낮지도 않아 **어떤 검사도 안
         잡습니다** — 찍어 보고 알았습니다(`js/adminlst.js` 가 이미
         그렇게 하고 있었습니다). */
    box.hidden = false; box.className = "deskbox";
    var head = headHtml();
    if(ROWS === null){
      box.innerHTML = head + failHtml();
      return;
    }
    box.innerHTML = head +
      (ROWS.length
        ? '<ul class="tpr-l">' + ROWS.map(row).join("") + '</ul>'
        : emptyHtml()) +
      newHtml();
  }

  /* ── 보내는 값 한 곳 ───────────────────────────────────────────
     ⚠️ 두 곳에 적으면 올릴 때와 고칠 때가 **다른 것을 보냅니다**. */
  function fields(f){
    var v = function(sel){
      var e = f.querySelector(sel); return e ? (e.value || "").trim() : "";
    };
    var list = function(s){
      return s.split(",").map(function(x){ return x.trim(); })
              .filter(Boolean);
    };
    return { scope:v("[name=scope]"), dest:v("[name=dest]"),
             title:v("[name=title]"), body:v("[name=body]"),
             nights:v("[name=nights]"), days:v("[name=days]"),
             price_from:v("[name=price_from]"),
             price_note:v("[name=price_note]"),
             incl:list(v("[name=incl]")), excl:list(v("[name=excl]")) };
  }

  /* ⚠️ 상품과 사진을 **한 번에** 받습니다 — 카드마다 따로 물으면
     상품이 스물이면 호출이 스무 번 늘고, 그동안 칸이 비어
     **「사진 없는 상품」** 으로 보입니다 (0068 에서 세운 규칙). */
  function load(){
    return Promise.all([
      get("v_trip_mine?select=*&order=created_at.desc&limit=100"),
      UP ? get("v_trip_photo_mine?select=*&limit=500") : Promise.resolve([])
    ]).then(function(res){
      ROWS = res[0];
      PH = {};
      (res[1] || []).forEach(function(x){
        (PH[x.trip_id] = PH[x.trip_id] || []).push(x);
      });
      draw();
    });
  }

  function msg(f, t, bad){
    var m = f.querySelector(".tpr-msg");
    if(!m) return;
    m.textContent = t;
    m.className = "tpr-msg" + (bad ? " tpr-msg-bad" : "");
  }

  box.addEventListener("submit", function(ev){
    var f = ev.target.closest ? ev.target.closest("form") : null;
    if(!f) return;
    ev.preventDefault();
    var li = f.closest(".tpr-r");
    var p = fields(f);
    if(li) p.id = li.getAttribute("data-id");
    msg(f, "보내는 중입니다…");
    call(li ? "edit_trip" : "open_trip", p).then(function(){
      msg(f, li ? "수정본을 보냈습니다. 확인을 거쳐 갈아 끼웁니다."
                : "올렸습니다. 운영자 확인을 기다립니다.");
      load();
    }, function(e){ msg(f, String(e.message || e), true); });
  });

  /* ⚠️ 갈래를 바꾸면 **목적지 목록 자체가 바뀝니다** — 안 갈아 끼우면
     「해외」를 고르고 국내 시·도를 보내게 됩니다. */
  box.addEventListener("change", function(ev){
    var t = ev.target;
    if(!t || t.name !== "scope") return;
    var f = t.closest("form");
    var ds = f && f.querySelector("[name=dest]");
    if(!ds) return;
    ds.innerHTML = dests(t.value).map(function(x){
      return '<option value="' + esc(x.key) + '">' + esc(x.name) + '</option>';
    }).join("");
  });

  box.addEventListener("click", function(ev){
    var t = ev.target;
    /* ⚠️ 새 양식을 여는 단추는 **줄 바깥**이라 아래 `li` 가드보다
       먼저 받습니다 — 아래에 두면 `closest(".tpr-r")` 가 null 이라
       거기서 돌아나가고 **눌러도 아무 일이 안 납니다**(절대 규칙 5). */
    if(t.closest && t.closest(".tpr-add")){
      NEW = !NEW;
      draw();
      return;
    }
    var li = t.closest ? t.closest(".tpr-r") : null;
    if(!li) return;
    var id = li.getAttribute("data-id");
    var r = (ROWS || []).filter(function(x){ return x.id === id; })[0];
    if(t.closest(".tpr-ed")){
      var slot = li.querySelector(".tpr-slot");
      if(!slot) return;
      slot.innerHTML = slot.innerHTML ? "" : form(r);
      return;
    }
    if(t.closest(".tpr-x")){
      var s2 = li.querySelector(".tpr-slot");
      if(s2) s2.innerHTML = "";
      return;
    }
    if(t.closest(".tpr-cl")){
      call("close_trip", { id:id }).then(load, function(e){
        try{ alert(String(e.message || e)); }catch(_){}
      });
      return;
    }
    if(t.closest(".tpr-re")){
      call("reopen_trip", { id:id }).then(load, function(e){
        try{ alert(String(e.message || e)); }catch(_){}
      });
      return;
    }
    /* 사진 — ⚠️ 빼는 것은 되돌릴 수 없는 일이라 한 번 여쭙습니다 */
    var sl = t.closest ? t.closest(".tpr-s") : null;
    if(sl){
      var pid = sl.getAttribute("data-ph");
      var note = li.querySelector(".tpr-ph-m");
      if(t.closest(".tpr-s-rm")){
        var go = true;
        try{ go = window.confirm("이 사진을 빼시겠습니까?"); }catch(_){}
        if(!go) return;
        if(note) note.textContent = "보내는 중입니다…";
        call("drop_trip_photo", { id:pid }).then(load, function(e){
          if(note) note.textContent = String(e.message || e);
        });
        return;
      }
      if(t.closest(".tpr-s-up")){
        /* ⚠️⚠️ 차례를 바꾸는 문은 **늘어놓은 배열을 통째로** 받고
           **빠짐없이** 와야 합니다 — 일부만 보내면 안 보낸 것이 조용히
           0 이 되어 그것이 대표가 됩니다 (0069 에서 세운 규칙). */
        var ids = (PH[id] || []).map(function(x){ return x.id; });
        ids = [pid].concat(ids.filter(function(x){ return x !== pid; }));
        if(note) note.textContent = "보내는 중입니다…";
        call("order_trip_photo", { trip:id, ids:ids }).then(load, function(e){
          if(note) note.textContent = String(e.message || e);
        });
        return;
      }
    }
  });

  /* 사진 올리기 — ⚠️⚠️ **다시 그린 것만 보냅니다**(`amImgPrep`) — 폰
     사진의 EXIF 에는 찍은 자리의 위도 · 경도가 들어 있고 여행 상품
     사진은 **공개 버킷**입니다. 원본을 받는 가지를 하나라도 두면
     거기로 샙니다 (0070 에서 세운 규칙).
     ⚠️ 못 떼면 **안 올립니다.** */
  box.addEventListener("change", function(ev){
    var inp = ev.target;
    if(!inp.classList || !inp.classList.contains("tpr-ph-i")) return;
    var wrap = inp.closest(".tpr-ph");
    var note = wrap && wrap.querySelector(".tpr-ph-m");
    var trip = wrap && wrap.getAttribute("data-trip");
    var files = Array.prototype.slice.call(inp.files || []);
    inp.value = "";
    if(!files.length || !trip) return;
    if(note) note.textContent = "사진을 준비하는 중입니다…";
    var done = 0, fail = 0;
    var step = files.reduce(function(chain, file){
      return chain.then(function(){
        if(!window.amImgPrep) throw new Error("사진을 다시 그릴 수 없습니다");
        return window.amImgPrep(file).then(function(x){
          /* ⚠️⚠️⚠️ **문을 직접 부르지 않습니다.** `claim_trip_photo` 는
             `{id, path, ord, live}` 만 돌려줍니다 — 서명된 **올릴 주소**를
             낼 수 있는 것은 service key 를 가진 `api/upload.js` 뿐입니다.
             처음에 문을 직접 부르고 `d.url` 로 PUT 했는데, 그 값이 늘
             undefined 라 **PUT 이 한 번도 안 갔습니다**(에러는 "0 / 1장만
             올라갔습니다" 로만 보였습니다). 0068 이 매물 사진에서 세운
             길을 그대로 씁니다 — `/api/upload` 에 `tr:true` 로 청하고,
             **경로는 문이 짓고 버킷은 서버가 고릅니다**. */
          return fetch("/api/upload", {
            method:"POST",
            headers: Object.assign({ "content-type":"application/json" },
                                   window.amAuthHeaders ? window.amAuthHeaders() : {}),
            body: JSON.stringify({ tr:true, trip:trip, mime:x.mime,
                                   bytes:x.blob.size })
          }).then(function(r){
            return r.json().then(function(j){ return { ok:r.ok, j:j }; });
          }).then(function(y){
            if(!y.ok || !y.j || !y.j.url)
              throw new Error((y.j && y.j.error) || "지금 올리지 못했습니다");
            return fetch(y.j.url, { method:"PUT",
              headers:{ "content-type":x.mime }, body:x.blob });
          }).then(function(r){
            if(!r || !r.ok) throw new Error("올리지 못했습니다");
          });
        }).then(function(){ done++; }, function(){ fail++; });
      });
    }, Promise.resolve());
    step.then(function(){
      if(note) note.textContent = fail
        ? (done + " / " + files.length + "장만 올라갔습니다. 다시 눌러 주세요.")
        : (done + "장 올렸습니다. 운영자 확인을 거쳐 손님에게 보입니다.");
      load();
    });
  });

  window.amAuthAsk().then(function(a){
    A = a;
    if(!a || !a.on || !a.signedIn || !a.conf) return;
    PV = a.provider || null;
    if(!PV){ draw(); return; }
    /* ⚠️ 버킷이 켜졌는지는 **서버만** 압니다 — 안 기다리고 그리면 사진
       칸이 조용히 안 그려집니다 (0068 에서 겪은 그 자리). */
    var ready = (window.amPhotoReady
      ? fetch("/api/upload", { headers:{ accept:"application/json" } })
          .then(function(r){ return r.ok ? r.json() : null; })
          .then(function(d){ UP = !!(d && d.tripPhoto); }, function(){ UP = false; })
      : Promise.resolve());
    ready.then(load);
  });
})();
