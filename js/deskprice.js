/* ════════════════════════════════════════════════════════════════════
   업체가 올리는 **가격** — /desk 의 한 자리 (0042 · 업체찾기 개선 7번)

   ⚠️⚠️⚠️ **문만 만들고 이 화면을 안 만들면 그 기능은 없는 것입니다.**
   `save_provider_price` 를 부르는 자리가 0곳이면 업체는 가격을 올릴
   길이 없고, 그러면 업체찾기의 가격 줄은 **영원히 비어 있습니다**
   (`tools/check-doors.js` 가 그것을 셉니다).

   ⚠️⚠️ **하는 일에 있는 하위만** 고를 수 있습니다. DB 의 트리거도 같은
   것을 보지만(0042), 화면이 안 되는 것을 미리 내면 눌러도 거절되는
   칸이 됩니다 (절대 규칙 5). 목록은 `js/data/catalog.js` 한 곳에서
   옵니다 — 손으로 적으면 어긋납니다.

   ⚠️⚠️ **단위를 반드시 받습니다.** "90만원" 만 적으면 한 번인지 한 달
   인지 알 수 없고, 그건 손님이 오해하는 자리입니다. 비우면 DB 가
   거절하고, 화면이 그 말을 그대로 보여 줍니다.

   ⚠️⚠️ **올린 가격이 손님에게 보이는 때**를 그 자리에서 말합니다 —
   빌드가 HTML 에 찍기 때문에, 자료를 다시 가져와 올려야 보입니다
   (`tools/pull-providers.js`). 그 말을 안 적으면 업체는 "올렸는데 왜
   안 보이나" 로 운영자에게 전화합니다.

   ⚠️ 내리는 것은 **지우는 것이 아닙니다** (`active = false`) — 얼마를
   걸어 두었나가 기록입니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("pricebox");
  if(!box || !window.amAuthAsk) return;

  var A = null, PV = null, OPEN = false, EDIT = null;

  function why(err){
    var w = String((err && err.message) || "");
    try{ w = JSON.parse(w).message || w; }catch(_){}
    return w || "하지 못했습니다.";
  }
  function rpc(name, args){
    return fetch(A.conf.url + "/rest/v1/rpc/" + name, {
      method:"POST",
      headers: Object.assign({ "content-type":"application/json",
                               apikey: A.conf.anonKey }, window.amAuthHeaders()),
      body: JSON.stringify(args || {})
    }).then(function(r){
      if(!r.ok) return r.text().then(function(t){ throw new Error(t || ("HTTP " + r.status)); });
      return r.text().then(function(t){ try{ return JSON.parse(t); }catch(_){ return t; } });
    });
  }
  function get(q){
    return fetch(A.conf.url + "/rest/v1/" + q, {
      headers: Object.assign({ apikey: A.conf.anonKey }, window.amAuthHeaders())
    }).then(function(r){ return r.ok ? r.json().catch(function(){ return null; }) : null; })
      .catch(function(){ return null; });
  }

  function load(){
    return Promise.all([
      /* ⚠️ RLS 가 제 줄만 내줍니다 — provider_id 를 적는 것은 자물쇠
         두 겹입니다 (하나가 내려가도 다른 것이 남습니다). */
      get("provider_price?select=id,sub,label,amount,unit,note,active" +
          "&provider_id=eq." + encodeURIComponent(PV) +
          "&order=active.desc,amount.asc&limit=100"),
      get("provider?select=id,subs&id=eq." + encodeURIComponent(PV) + "&limit=1")
    ]);
  }

  function subName(k){
    var f = window.amSub ? window.amSub(k) : null;
    return f ? (f.cat.name + " · " + f.item.name) : k;
  }

  /* ⚠️ 그 업체가 하는 일만 — 비면 양식을 내지 않고 **무엇을 먼저
     해야 하는지** 말합니다 (막다른 길로 두지 않습니다). */
  function form(subs, row){
    if(!subs.length)
      return '<p class="myhint">하시는 일이 등록되어 있지 않아 가격을 올릴 수 없습니다. ' +
             '운영자에게 하시는 일을 먼저 알려 주세요.</p>';
    return '<form id="pf" class="jform">' +
      '<div class="jrow">' +
        '<label for="pf-sub">무슨 서비스의 가격인가요 <b>*</b></label>' +
        '<select id="pf-sub" name="sub" required>' +
          subs.map(function(k){
            return '<option value="' + esc(k) + '"' +
              (row && row.sub === k ? " selected" : "") + '>' +
              esc(subName(k)) + '</option>';
          }).join("") +
        '</select>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="pf-label">무엇의 가격인가요 <b>*</b></label>' +
        '<input id="pf-label" name="label" required maxlength="60" ' +
        'placeholder="주 1회 · 8회권" value="' +
        esc((row && row.label) || "") + '">' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="pf-amount">금액 (원) <b>*</b></label>' +
        '<input id="pf-amount" name="amount" required inputmode="numeric" ' +
        'placeholder="400000" value="' +
        esc(row && (row.amount === 0 || row.amount) ? String(row.amount) : "") + '">' +
        '<p class="agree-no">무료면 <b>0</b> 을 적으세요. 1억까지 적을 수 있습니다.</p>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="pf-unit">단위 <b>*</b></label>' +
        '<input id="pf-unit" name="unit" required maxlength="20" ' +
        'placeholder="8회" list="pf-units" value="' + esc((row && row.unit) || "") + '">' +
        '<datalist id="pf-units">' +
          ["1회","8회","10회","1개월","3개월","1년","1시간","1인","1세트","1박"]
            .map(function(u){ return '<option value="' + u + '"></option>'; }).join("") +
        '</datalist>' +
        /* ⚠️⚠️ 단위가 없으면 손님이 오해합니다 — 그 까닭을 적습니다 */
        '<p class="agree-no">단위가 없으면 손님이 <b>한 번 값인지 한 달 값인지</b> ' +
        '알 수 없습니다.</p>' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label for="pf-note">덧말</label>' +
        '<input id="pf-note" name="note" maxlength="200" ' +
        'placeholder="타석 이용료 별도" value="' + esc((row && row.note) || "") + '">' +
      '</div>' +
      '<button class="btn btn-pt" type="submit">' +
        (row ? "이 가격 고치기" : "가격 올리기") + '</button>' +
      (row ? '<button class="btn btn-line" type="button" data-pf="cancel">그만두기</button>' : '') +
      '<p class="pf-m lmsg" hidden></p>' +
    '</form>';
  }

  function rows(list){
    if(!list.length)
      /* ⚠️ 0건은 고장이 아닙니다 — 0 이라고 말하고, 0 인 자리에 지금
         실제로 되는 것을 같이 냅니다 (절대 규칙 2). */
      return '<p class="myhint">아직 올리신 가격이 없습니다. ' +
             '올리시면 업체찾기 화면의 카드와 비교표에 그 금액이 나옵니다. ' +
             '올리지 않으셔도 됩니다 — 그때는 그 줄이 아예 빠집니다.</p>';
    return '<ul class="fe-p">' + list.map(function(r){
      return '<li' + (r.active ? '' : ' class="pr-off"') + '>' +
        '<b>' + esc(r.label) + '</b>' +
        (r.active ? '' : ' <span class="dk-st dk-ink">내림</span>') +
        '<p class="fe-r"><b>' + esc(window.won(r.amount)) + '원</b>' +
          ' / ' + esc(r.unit) + ' · ' + esc(subName(r.sub)) + '</p>' +
        (r.note ? '<p class="fe-r">' + esc(r.note) + '</p>' : '') +
        (r.active
          ? '<div class="dk-b">' +
              '<button class="btn btn-sm btn-line" data-pedit="' + esc(r.id) + '">고치기</button>' +
              '<button class="btn btn-sm btn-line" data-pdown="' + esc(r.id) + '">내리기</button>' +
            '</div>'
          /* ⚠️ 내린 것에는 단추를 안 냅니다 (DB 가 거절합니다) */
          : '') +
      '</li>';
    }).join("") + '</ul>';
  }

  var LIST = [], SUBS = [];

  function paint(){
    box.hidden = false; box.className = "deskbox";
    box.innerHTML = '<h2 class="adm-h">가격 등록</h2>' +
      '<p class="lmsg">읽는 중입니다…</p>';
    return load().then(function(got){
      var list = got[0], pv = got[1];
      /* ⚠️⚠️ 못 읽었으면 **0건이라고 말하지 않습니다** */
      if(list === null){
        box.innerHTML = '<h2 class="adm-h">가격 등록</h2>' +
          '<p class="lmsg">읽지 못했습니다. ' +
          '<button class="btn btn-sm btn-line" data-pf="again">다시 읽기</button></p>';
        return;
      }
      LIST = list;
      SUBS = (pv && pv[0] && Array.isArray(pv[0].subs))
        ? pv[0].subs.filter(function(k){ return !!(window.amSub && window.amSub(k)); })
        : [];
      var row = EDIT ? LIST.filter(function(x){ return x.id === EDIT; })[0] : null;
      box.innerHTML = '<h2 class="adm-h">가격 등록</h2>' +
        /* ⚠️⚠️ 손님에게 **언제 보이는지**를 그 자리에서 말합니다 */
        '<p class="myhint">올리신 가격은 업체찾기 · 업체 화면에 그대로 나옵니다. ' +
        '화면에 찍히는 것은 운영자가 자료를 다시 올린 뒤입니다 — ' +
        '올리신 뒤 바로 안 보이면 그 때문입니다.</p>' +
        rows(LIST) +
        '<div class="pr-f">' +
          (OPEN || row ? form(SUBS, row)
            : (SUBS.length
                ? '<button class="btn btn-pt" data-pf="open">가격 올리기</button>'
                : '<p class="myhint">하시는 일이 등록되어 있지 않아 가격을 올릴 수 ' +
                  '없습니다. 운영자에게 먼저 알려 주세요.</p>')) +
        '</div>' +
        '<p class="dk-m lmsg" hidden></p>';
    });
  }
  function say(t){
    var m = box.querySelector(".dk-m");
    if(m){ m.hidden = false; m.textContent = t; }
  }

  box.addEventListener("click", function(e){
    var ag = e.target.closest ? e.target.closest("[data-pf='again']") : null;
    if(ag) return paint();
    var op = e.target.closest ? e.target.closest("[data-pf='open']") : null;
    if(op){ OPEN = true; EDIT = null; return paint(); }
    var cx = e.target.closest ? e.target.closest("[data-pf='cancel']") : null;
    if(cx){ OPEN = false; EDIT = null; return paint(); }
    var ed = e.target.closest ? e.target.closest("button[data-pedit]") : null;
    if(ed){ EDIT = ed.getAttribute("data-pedit"); OPEN = true; return paint(); }
    var dn = e.target.closest ? e.target.closest("button[data-pdown]") : null;
    if(dn){
      /* ⚠️ 내리는 것은 지우는 것이 아니라고 그 자리에서 말합니다 */
      if(!confirm("이 가격을 내리시겠습니까? 손님 화면에서 빠집니다 " +
                  "(기록은 남습니다).")) return;
      dn.disabled = true; say("내리는 중입니다…");
      rpc("drop_provider_price", { p: { id: dn.getAttribute("data-pdown") } })
        .then(function(){ return paint(); })
        .then(function(){ say("내렸습니다."); })
        .catch(function(err){ dn.disabled = false; say(why(err)); });
      return;
    }
  });

  box.addEventListener("submit", function(e){
    var f = e.target.closest ? e.target.closest("form#pf") : null;
    if(!f) return;
    e.preventDefault();
    var m = f.querySelector(".pf-m");
    var bt = f.querySelector('button[type="submit"]');
    /* ⚠️ 숫자 칸은 숫자만 보냅니다 — 쉼표 · "원" 을 적으셔도 되게.
       ⚠️⚠️ 빈 칸을 0 으로 보내지 않습니다 ("안 적었다" 와 "0원" 은
       다릅니다) — 비면 DB 가 "금액을 적어 주세요" 로 거절합니다. */
    var raw = (f.querySelector("#pf-amount").value || "").replace(/[^0-9-]/g, "");
    var p = { sub: f.querySelector("#pf-sub").value,
              label: (f.querySelector("#pf-label").value || "").trim(),
              unit: (f.querySelector("#pf-unit").value || "").trim(),
              note: (f.querySelector("#pf-note").value || "").trim() };
    if(raw !== "") p.amount = Number(raw);
    if(EDIT) p.id = EDIT;
    bt.disabled = true;
    if(m){ m.hidden = false; m.textContent = "보내는 중입니다…"; }
    rpc("save_provider_price", { p: p })
      .then(function(){
        OPEN = false; EDIT = null;
        return paint();
      })
      .then(function(){ say("올렸습니다. 손님 화면에는 자료를 다시 올린 뒤에 보입니다."); })
      .catch(function(err){
        bt.disabled = false;
        if(m) m.textContent = why(err);
      });
  });

  amAuthAsk().then(function(a){
    A = a;
    /* ⚠️ 업체가 아니면 **한 줄도 안 그립니다** — /desk 의 윗자리가
       이미 안내합니다 (같은 말을 두 번 하지 않습니다). */
    if(!a.on || !a.signedIn) return;
    if(a.role !== "provider" || !a.provider) return;
    PV = a.provider;
    paint();
  });
})();
