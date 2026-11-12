/* ════════════════════════════════════════════════════════════════════
   골프 여행 상품 심사 — /admin 에서만 돕니다 (DB 는 0073)

   ⚠️⚠️⚠️ **문이 있는데 누르는 자리가 없으면 그 기능은 없는 것입니다.**
   0073 은 `move_trip`(승인 · 반려 · 가리기 · 되돌리기)과
   `review_trip_draft`(수정본 심사)를 세워 두고 화면을 안 만들었습니다 —
   그러면 여행사가 올린 상품이 **영원히 심사 중**으로 남습니다.

   ⚠️⚠️⚠️ **공개본 심사와 수정본 심사는 다른 문입니다.** 팔고 있는
   상품의 수정본을 반려해도 **공개본은 그대로 팔립니다** — 화면이 그
   둘을 갈라서 보여 주지 않으면 운영자가 무엇을 승인하는지 모릅니다.

   ⚠️⚠️ **반려 · 가리기는 까닭이 반드시**입니다 (문이 거절합니다).
   까닭 없이 가릴 수 있으면 불평할 때마다 지워 주는 자리가 됩니다.

   ⚠️ 운영자가 아니면 **한 글자도 안 그립니다.**
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("tripadm");
  if(!box || !window.amAuthAsk) return;

  var esc = window.esc, icon = window.icon;
  var A = null, ROWS = null;

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

  function destName(k){
    var L = (window.amRegionsOf ? window.amRegionsOf("travel") : []);
    for(var i = 0; i < L.length; i++) if(L[i].key === k) return L[i].name;
    return k ? String(k) : "";
  }
  function stName(k){
    var s = window.amTripSt ? window.amTripSt(k) : null;
    return s ? s.name : String(k || "");
  }

  /* ⚠️⚠️ 수정본은 **바뀐 칸만** 보여 줍니다 — 통째로 늘어놓으면
     운영자가 무엇이 달라졌는지 눈으로 찾아야 합니다. */
  var FIELD = { scope:"국내 · 해외", dest:"목적지", title:"상품 이름",
                body:"일정 · 안내", nights:"몇 박", days:"며칠",
                price_from:"1인 최저가", price_note:"값에 붙는 말",
                incl:"포함", excl:"별도" };
  function same(a, b){
    if(Array.isArray(a) || Array.isArray(b))
      return JSON.stringify(a || []) === JSON.stringify(b || []);
    return String(a === null || a === undefined ? "" : a) ===
           String(b === null || b === undefined ? "" : b);
  }
  function diff(r){
    var d = r.draft;
    if(!d || typeof d !== "object") return "";
    var out = [];
    Object.keys(FIELD).forEach(function(k){
      if(!(k in d)) return;
      if(same(r[k], d[k])) return;
      out.push('<li><b>' + esc(FIELD[k]) + '</b> ' +
        '<span class="tpa-old">' + esc(txt(r[k], k)) + '</span>' +
        ' → <span class="tpa-new">' + esc(txt(d[k], k)) + '</span></li>');
    });
    if(!out.length)
      return '<p class="tpa-d">수정본에 바뀐 칸이 없습니다.</p>';
    return '<ul class="tpa-d">' + out.join("") + '</ul>';
  }
  function txt(v, k){
    if(Array.isArray(v)) return v.join(" · ");
    if(v === null || v === undefined || v === "") return "(없음)";
    /* ⚠️⚠️ **금액을 적는 자리는 `amTripPrice()` 한 곳**입니다 — 그대로
       `String()` 하면 `720000` 이 찍혀 사장님이 자리를 세어 읽으셔야
       합니다(손님이 40~60대라는 그 까닭과 같습니다). 그리고 "부터" 가
       빠지면 우리가 값을 확정해 말하는 꼴입니다. */
    if(k === "price_from" && window.amTripPrice)
      return window.amTripPrice({ price_from: v }) || String(v);
    return String(v);
  }

  function row(r){
    var draft = r.draft_state === "pending";
    return '<li class="tpa-r" data-id="' + esc(r.id) + '">' +
      '<p class="tpa-t"><b>' + esc(r.title) + '</b>' +
        '<span class="tpa-st">' + esc(stName(r.state)) + '</span>' +
        (draft ? '<span class="tpa-st tpa-st-d">수정본 심사</span>' : "") +
      '</p>' +
      '<p class="tpa-m">' + esc([r.provider_name, destName(r.dest),
          (window.amTripSpan ? window.amTripSpan(r) : ""),
          (window.amTripPrice ? window.amTripPrice(r) : "")]
        .filter(Boolean).join(" · ")) + '</p>' +
      (draft ? diff(r) : "") +
      /* ⚠️⚠️⚠️ **되돌리면 어느 상태로 가는지** 그 자리에서 말합니다 —
         0070 이 중고 매물에서 세운 규칙입니다(가리기 전 상태를
         `hidden_from` 에 적어 두고 그리로 돌아갑니다). 안 적으면
         운영자가 「판매 중」으로 되는 줄 알고 누릅니다 — 이미 판매를
         중지한 상품이 **다시 파는 것처럼** 서는 꼴입니다(절대 규칙 1).
         ⚠️ `hidden_from` 이 비어 있으면 **아무 말도 안 적습니다**
         (모르는 것을 지어 적지 않습니다). */
      backHtml(r) +
      '<p class="tpa-w"><label class="sr-only" for="tpa-w-' + esc(r.id) +
        '">까닭</label>' +
        '<input id="tpa-w-' + esc(r.id) + '" class="tpa-why" maxlength="200" ' +
        'placeholder="반려 · 가리기는 까닭을 적어 주세요"></p>' +
      '<p class="tpa-act">' +
        (draft
          ? '<button type="button" class="btn btn-pri btn-sm tpa-dok">수정본 승인</button>' +
            '<button type="button" class="btn btn-bad btn-sm tpa-dno">수정본 반려</button>'
          : "") +
        (r.state === "pending"
          ? '<button type="button" class="btn btn-pri btn-sm tpa-ok">승인</button>' +
            '<button type="button" class="btn btn-bad btn-sm tpa-no">반려</button>'
          : "") +
        (r.state === "approved"
          ? '<button type="button" class="btn btn-bad btn-sm tpa-hide">가리기</button>'
          : "") +
        /* ⚠️⚠️ **되돌리는 길을 꼭 냅니다** — 한 번 가리면 올린 분의 문이
           전부 막혀(제 문들이 상태를 요구합니다) 사장님이 SQL 편집기를
           여셔야 합니다 (0070 에서 중고 매물로 겪은 그 자리). */
        (r.state === "hidden" || r.state === "rejected"
          ? '<button type="button" class="btn btn-line btn-sm tpa-back">되돌리기</button>'
          : "") +
      '</p>' +
      '<p class="tpa-msg" role="status"></p>' +
    '</li>';
  }

  /* ⚠️ `check-safe` ⑥ 은 innerHTML 에 들어가는 **덩이마다 함수 이름**을
     따라갑니다 — 변수로 이어 붙이면 따라갈 이름이 없어 잡힙니다(그
     검사가 맞습니다). 글자뿐인 덩이도 이름을 답니다. */
  function backHtml(r){
    if(r.state !== "hidden" || !r.hidden_from) return "";
    var nm = stName(r.hidden_from);
    /* ⚠️⚠️ **조사를 글자로 박지 않습니다** — 「판매 중」은 받침이 있어
       「이」, 「반려」는 「가」입니다. 붙이는 자리는 `josa()` 한 곳입니다
       (작업 기억에 세 번 적힌 자리). */
    return '<p class="tpa-back-n">되돌리면 상태가 <b>' + esc(nm) + '</b>' +
      esc(window.josa ? window.josa(nm, "이가") : "이") + ' 됩니다.</p>';
  }
  function headHtml(){
    return '<h2>' + icon("plane", 20) + '여행 상품 심사</h2>';
  }
  function failHtml(){
    return '<p class="none-l">지금 여행 상품을 불러오지 못했습니다. ' +
      '0건이라는 뜻이 <b>아닙니다.</b></p>';
  }
  function todoHtml(n){
    return '<p class="jnote">확인을 기다리는 것 <b>' +
      esc(String(n)) + '건</b></p>';
  }
  function emptyHtml(){
    return '<p class="none-l">아직 올라온 여행 상품이 없습니다.</p>';
  }
  function draw(){
    box.hidden = false;
    var head = headHtml();
    if(ROWS === null){
      box.innerHTML = head + failHtml();
      return;
    }
    /* ⚠️ 심사할 것을 **맨 위로** 올립니다 — 섞여 있으면 운영자가 찾아야
       합니다. 수정본 심사도 같은 급입니다. */
    var todo = ROWS.filter(function(r){
      return r.state === "pending" || r.draft_state === "pending"; });
    var rest = ROWS.filter(function(r){
      return !(r.state === "pending" || r.draft_state === "pending"); });
    /* ⚠️⚠️ **0 과 「못 읽음」은 다릅니다** — 0건이면 그 사실만 적고
       수를 지어내지 않습니다. */
    box.innerHTML = head + todoHtml(todo.length) +
      (ROWS.length
        ? '<ul class="tpa-l">' + todo.concat(rest).map(row).join("") + '</ul>'
        : emptyHtml());
  }

  function load(){
    return get("v_trip_review?select=*&order=created_at.desc&limit=100")
      .then(function(rows){ ROWS = rows; draw(); });
  }

  box.addEventListener("click", function(ev){
    var t = ev.target;
    var li = t.closest ? t.closest(".tpa-r") : null;
    if(!li) return;
    var id = li.getAttribute("data-id");
    var why = (li.querySelector(".tpa-why") || {}).value || "";
    var m = li.querySelector(".tpa-msg");
    var go = function(fn, p){
      if(m){ m.textContent = "보내는 중입니다…"; m.className = "tpa-msg"; }
      call(fn, p).then(load, function(e){
        if(m){ m.textContent = String(e.message || e);
               m.className = "tpa-msg tpa-msg-bad"; }
      });
    };
    if(t.closest(".tpa-ok"))   return go("move_trip", { id:id, to:"approved" });
    if(t.closest(".tpa-no"))   return go("move_trip", { id:id, to:"rejected", why:why });
    if(t.closest(".tpa-hide")) return go("move_trip", { id:id, to:"hidden", why:why });
    if(t.closest(".tpa-back")) return go("move_trip", { id:id, to:"restore" });
    if(t.closest(".tpa-dok"))
      return go("review_trip_draft", { id:id, to:"approved" });
    if(t.closest(".tpa-dno"))
      return go("review_trip_draft", { id:id, to:"rejected", why:why });
  });

  window.amAuthAsk().then(function(a){
    A = a;
    if(!a || !a.on || !a.signedIn || !a.conf) return;
    /* ⚠️ 운영자가 아니면 **한 글자도 안 그립니다** — 보기가 0줄을
       돌려주기는 하지만, 그려 두면 눌러도 거절되는 칸입니다. */
    if(a.role !== "admin" && a.role !== "staff") return;
    load();
  });
})();
