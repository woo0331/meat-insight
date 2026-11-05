/* ════════════════════════════════════════════════════════════════════
   업체 **담당자 직통 연락처** — /desk  (DB 는 0013 → 0014)

   ⚠️⚠️⚠️ **문은 2026-10-22 에 섰는데 화면이 없었습니다.** 0013 의
   머리말이 왜 필요한지까지 적어 두었습니다 — "지금은 배정해도 걸 곳이
   업체 **대표번호**뿐입니다. 대표번호는 낮에 사무실이 받고, 현장에
   있는 담당자에게 닿는 데 하루가 갑니다." 그 길을 내려고 표와 문을
   만들어 놓고 **적는 자리를 안 만들었습니다**(`check-doors` 의
   `KNOWN` 에 그렇게 적혀 있던 자리입니다).

   ⚠️⚠️ **이 연락처는 손님에게 한 글자도 안 나갑니다.** 보는 사람은
   **운영자와 이 업체**뿐입니다 (0013 의 RLS — 손님은 정책이 아예
   없어서 한 줄도 못 봅니다). 그 사실을 **적는 그 자리에서** 말합니다.

   ⚠️⚠️ **`provider` 표에 안 넣고 표를 갈랐습니다** (0013). `provider`
   는 `listed = true` 면 로그인한 누구나 읽을 수 있어서, 거기에 직통
   번호를 넣으면 **손님 전부가 담당자 휴대폰을 봅니다.** RLS 는 줄은
   막아도 **칸은 못 막습니다.**

   ⚠️ **넷을 다 비워서 보내면 줄을 지웁니다** (문이 그렇게 합니다) —
   빈 줄을 남기지 않습니다. 화면도 그 길을 그대로 냅니다.

   ⚠️⚠️ **인자가 자리로 갑니다** (`p_provider` · `p_data` · `p_why`) —
   0014 가 0013 의 서명을 그대로 두었기 때문입니다. 이 저장소의 다른
   문들처럼 `{ p: {...} }` 로 보내면 **인자 이름이 안 맞아 거절**됩니다.

   ⚠️ 설정이 있어야 열리는 자리라 빌드가 찍은 HTML 만 보는 검사는
   영원히 못 봅니다 — `tools/test-desk.js` 가 직접 눌러 봅니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("pvctbox");
  if(!box || !window.amAuthAsk) return;

  var esc = window.esc, icon = window.icon;
  var A = null, PV = null, ROW = null, MSG = "";

  function why(err){
    var w = String((err && err.message) || "");
    try{ w = JSON.parse(w).message || w; }catch(_){}
    return w || "하지 못했습니다.";
  }
  function get(q){
    return fetch(A.conf.url + "/rest/v1/" + q, {
      headers: Object.assign({ apikey: A.conf.anonKey }, window.amAuthHeaders())
    }).then(function(r){ return r.ok ? r.json().catch(function(){ return null; }) : null; })
      .catch(function(){ return null; });
  }
  /* ⚠️⚠️ **자리 인자**입니다 — `{ p: {...} }` 가 아닙니다 (위 머리말) */
  function rpc(args){
    return fetch(A.conf.url + "/rest/v1/rpc/save_provider_contact", {
      method:"POST",
      headers: Object.assign({ "content-type":"application/json",
                               apikey: A.conf.anonKey }, window.amAuthHeaders()),
      body: JSON.stringify(args)
    }).then(function(r){
      return r.text().then(function(t){
        if(!r.ok){ var m = t; try{ m = JSON.parse(t).message || t; }catch(_){}
                   throw new Error(m); }
        try{ return JSON.parse(t); }catch(_){ return t; }
      });
    });
  }

  function val(id){
    var e = box.querySelector("#" + id);
    return e ? String(e.value || "").trim() : "";
  }

  function paint(){
    var r = ROW || {};
    var has = !!(r.name || r.tel || r.email || r.memo);
    box.className = "deskbox";
    box.hidden = false;
    box.innerHTML =
      '<h2 class="adm-h">' + icon("phone", 19) + '배정받을 때 연락처</h2>' +
      /* ⚠️⚠️ **누가 보는지 · 왜 받는지 · 얼마나 두는지를 그 자리에서**
         같이 말합니다 (개인정보보호법 제15조 제2항). 보유 기간은
         입점 계약이 끝날 때까지로, 개인정보처리방침의 입점업체 줄과
         **같은 말**입니다 — 두 곳에 다른 기간을 적지 않습니다. */
      '<p class="myhint">요청을 배정해 드릴 때 <b>저희가 연락할 곳</b>입니다. ' +
        '대표번호만 있으면 현장에 계신 분께 닿는 데 하루가 갑니다.</p>' +
      '<p class="myhint">⚠️ 여기 적으신 것은 <b>운영자와 이 업체만</b> 봅니다 — ' +
        '손님 화면에는 한 글자도 나오지 않습니다. 입점 계약이 끝날 때까지 두고, ' +
        '끝나면 지웁니다.</p>' +
      (MSG ? '<p class="lmsg">' + esc(MSG) + '</p>' : "") +
      '<form class="jform" id="pvct-f" novalidate>' +
        '<div class="jrow"><label for="pvct-n">담당자 이름</label>' +
          '<input id="pvct-n" name="name" type="text" maxlength="40" ' +
            'autocomplete="off" value="' + esc(r.name || "") + '"></div>' +
        '<div class="jrow"><label for="pvct-t">직통 · 휴대폰</label>' +
          '<input id="pvct-t" name="tel" type="tel" maxlength="40" ' +
            'inputmode="tel" autocomplete="off" value="' + esc(r.tel || "") + '"></div>' +
        '<div class="jrow"><label for="pvct-e">이메일</label>' +
          '<input id="pvct-e" name="email" type="email" maxlength="80" ' +
            'autocomplete="off" value="' + esc(r.email || "") + '"></div>' +
        '<div class="jrow"><label for="pvct-m">언제 연락이 되는지</label>' +
          '<input id="pvct-m" name="memo" type="text" maxlength="100" ' +
            'autocomplete="off" placeholder="예: 평일 오전에는 현장에 있습니다" ' +
            'value="' + esc(r.memo || "") + '"></div>' +
        /* ⚠️ 제출 단추가 가로 전체인 것은 이 저장소의 관례입니다
           (`/match` · `/help` 의 양식과 같습니다). */
        '<div class="jrow jrow-full">' +
          '<button type="submit" class="btn btn-pt" id="pvct-save">저장</button>' +
        '</div>' +
        /* ⚠️⚠️ 지우는 길은 **넷을 비워 보내는 것**입니다 (문이 그때 줄을
           지웁니다). 적은 것이 없으면 그 단추를 안 냅니다 — 눌러도
           아무 일이 안 나는 단추를 두지 않습니다 (절대 규칙 5).
           ⚠️ 저장과 **같은 줄에 같은 크기로** 두었더니 되돌리기 어려운
           쪽이 똑같이 커 보였습니다 (찍어 보고 알았습니다) — 줄을
           가르고 제 너비만 차지하게 둡니다. */
        (has ? '<div class="jrow jrow-full pvct-del">' +
                 '<button type="button" class="btn btn-line" id="pvct-x">' +
                 '적은 것 지우기</button></div>' : "") +
      '</form>';
  }

  function save(data, note){
    var b = box.querySelector("#pvct-save");
    if(b) b.disabled = true;
    MSG = "저장하는 중입니다…";
    return rpc({ p_provider: PV, p_data: data, p_why: note })
      .then(load)
      .then(function(){ MSG = note; paint(); })
      .catch(function(err){ MSG = why(err); paint(); });
  }

  box.addEventListener("submit", function(e){
    if(!e.target || e.target.id !== "pvct-f") return;
    e.preventDefault();
    save({ name: val("pvct-n"), tel: val("pvct-t"),
           email: val("pvct-e"), memo: val("pvct-m") }, "저장했습니다.");
  });
  box.addEventListener("click", function(e){
    var b = e.target.closest ? e.target.closest("#pvct-x") : null;
    if(!b) return;
    /* ⚠️ 지우면 배정했을 때 걸 곳이 대표번호뿐으로 돌아갑니다 —
       그 사실을 묻는 자리에서 말합니다. */
    if(!window.confirm("적으신 연락처를 지웁니다.\n" +
      "지우면 요청을 배정해 드릴 때 대표번호로만 연락드리게 됩니다.")) return;
    save({ name:"", tel:"", email:"", memo:"" }, "지웠습니다.");
  });

  function load(){
    /* ⚠️ 칸을 글자로 적습니다 — `select=*` 면 보기에 칸이 붙는 날
       쓰지도 않는 것이 같이 내려옵니다. */
    return get("provider_contact?select=name,tel,email,memo&provider_id=eq." +
               encodeURIComponent(PV))
      .then(function(rows){ ROW = (rows && rows[0]) || null; });
  }

  window.amAuthAsk().then(function(a){
    A = a;
    /* ⚠️ 업체 담당자가 아니면 **한 줄도** 안 그리고 **읽으러 가지도**
       않습니다 (0050 의 알림 상자가 그 줄을 빠뜨렸던 자리입니다). */
    if(!a || !a.on || !a.signedIn || a.role !== "provider") return;
    PV = a.provider;
    if(!PV) return;
    return load().then(paint);
  }).catch(function(){});
})();
