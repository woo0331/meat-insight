/* ════════════════════════════════════════════════════════════════════
   회원 역할(능력 딱지) 붙이기 · 떼기 — /admin (0025 · 0028 · 0054)

   ⚠️⚠️ **권한(role)과 능력(hat)은 다른 것입니다.**
     권한  customer · provider · staff · admin — 플랫폼이 정합니다
     능력  seller(판매자) · pro(골프 프로) · biz(사업자)
   여기서 바꾸는 것은 **능력**뿐입니다. 권한을 올리는 길은 0043 의
   초대 코드 하나이고, 그 길을 여기에 또 내지 않습니다.

   ⚠️⚠️⚠️ **`biz` 는 이 화면에 단추를 안 냅니다.** 그 딱지의 주인은
   사람이 아니라 **0028 의 트리거**입니다 — 계정이 업체에 이어지면
   저절로 붙고 끊기면 저절로 떨어집니다. 여기서 붙여 봐야 그 계정이
   다음에 한 번 바뀌는 순간 사라지고, 떼어 봐야 되돌아옵니다. 그건
   **눌러도 아무 일이 안 나는 단추**입니다 (절대 규칙 5). 그래서
   지금 상태만 보여 주고 어떻게 바뀌는지를 적습니다.

   ⚠️⚠️ **떼는 문이 2026-11-06 까지 없었습니다** — 0025 는 운영자에게
   `grant_hat`(붙이기)만 주고 떼는 길은 `drop_my_hat`(**본인만**)뿐이라,
   잘못 붙인 딱지를 사장님이 SQL 편집기에서 직접 지우셔야 했습니다.
   0054 가 `revoke_hat` 을 냈습니다 (0043 이 잇는 길만 내고 끊는 길을
   안 낸 자리와 같은 꼴입니다).

   ⚠️⚠️ **인자가 자리로 갑니다** (`p_user` · `p_hat` · `p_why`) —
   `{ p: {...} }` 로 보내면 거절됩니다. 까닭은 **반드시** 받습니다(§8).

   ⚠️ 설정이 있어야 열리는 자리라 빌드가 찍은 HTML 만 보는 검사는
   영원히 못 봅니다 — `tools/test-desk.js` 가 직접 눌러 봅니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("hatadm");
  if(!box || !window.amAuthAsk) return;

  var esc = window.esc, icon = window.icon;
  var A = null, D = null, Q = "";

  /* ⚠️ 말은 여기 한 곳입니다 — 값은 0025 의 `member_hat` enum 과 한
     글자도 같아야 합니다 (다르면 DB 가 거절하고, 손님은 눌렀는데 왜
     안 되는지 모릅니다).
     ⚠️⚠️ `self` 는 "본인이 켜고 끄는 것" 입니다 — 운영자가 붙여 줄 수는
     있지만 `/my` 에서 본인도 켤 수 있습니다. `biz` 만 다릅니다. */
  var HATS = [
    { key:"seller", name:"판매자",   self:true  },
    { key:"pro",    name:"골프 프로", self:true  },
    { key:"biz",    name:"사업자",   self:false }
  ];
  function hatName(k){
    for(var i = 0; i < HATS.length; i++) if(HATS[i].key === k) return HATS[i].name;
    /* ⚠️ 모르는 값은 **키 그대로** 냅니다 (빈 칸을 두지 않습니다) */
    return String(k || "");
  }

  function get(q){
    return fetch(A.conf.url + "/rest/v1/" + q, {
      headers: Object.assign({ apikey: A.conf.anonKey }, window.amAuthHeaders())
    }).then(function(r){ return r.ok ? r.json().catch(function(){ return null; }) : null; })
      .catch(function(){ return null; });
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
  function why(err){
    var w = String((err && err.message) || "");
    try{ w = JSON.parse(w).message || w; }catch(_){}
    return w || "하지 못했습니다.";
  }

  function row(m){
    var mine = D.hats[m.id] || [];
    return '<li data-acc="' + esc(m.id) + '">' +
      '<b>' + esc(m.name || "(성함 없음)") + '</b>' +
      '<p class="fe-r">' +
        (mine.length
          ? mine.map(hatName).map(esc).join(" · ")
          /* ⚠️ 0건은 고장이 아닙니다 — 0 이라고 말합니다 */
          : '켜진 역할이 없습니다') + '</p>' +
      '<div class="dk-b">' +
        HATS.filter(function(h){ return h.self; }).map(function(h){
          var on = mine.indexOf(h.key) >= 0;
          return '<button type="button" class="btn btn-sm ' +
            (on ? "btn-line" : "btn-pri") + '" data-hat="' + esc(h.key) + '" ' +
            'data-on="' + (on ? "1" : "0") + '">' +
            esc(on ? (h.name + " 떼기") : (h.name + " 붙이기")) + '</button>';
        }).join("") +
      '</div>' +
      '<form class="jform hat-f" hidden>' +
        '<div class="jrow jrow-full"><label>까닭 <b>*</b> (기록에 남고 지울 수 없습니다)</label>' +
        '<input name="hwhy" required maxlength="200"></div>' +
        '<div class="jrow jrow-full">' +
        '<button type="submit" class="btn btn-pt">이 까닭으로 바꾸기</button></div>' +
      '</form>' +
    '</li>';
  }

  function paint(){
    if(!D){
      box.innerHTML = '<h2 class="adm-h">' + icon("user", 19) + '회원 역할</h2>' +
        '<p class="lmsg">읽지 못했습니다. ' +
        '<button class="btn btn-sm btn-line" data-do="again">다시 읽기</button></p>';
      return;
    }
    var q = Q.trim();
    var list = D.accs.filter(function(m){
      return !q || String(m.name || "").indexOf(q) >= 0;
    }).slice(0, 50);

    box.hidden = false; box.className = "deskbox";
    /* ⚠️⚠️ 제목을 변수로 뽑지 않습니다 — check-safe 가 innerHTML 에
       **변수**를 넣는 줄을 잡습니다. */
    box.innerHTML = '<h2 class="adm-h">' + icon("user", 19) + '회원 역할</h2>' +
      '<p class="myhint">⚠️ 여기서 바꾸는 것은 <b>능력</b>입니다 — ' +
      '판매자 · 골프 프로는 회원 본인도 <b>내 정보</b>에서 켜고 끌 수 있고, ' +
      '여기서는 대신 해 드릴 수 있습니다. ' +
      /* ⚠️⚠️ 하지 않는 일을 했다고 적지 않습니다 — biz 는 트리거가 정합니다 */
      '<b>사업자</b>는 단추를 내지 않습니다 — 그 역할은 업체에 이어질 때 ' +
      '저절로 붙고 끊기면 저절로 떨어집니다.</p>' +
      '<form class="jform" id="hatq"><div class="jrow jrow-full">' +
      '<label for="hq">성함으로 찾기</label>' +
      '<input id="hq" name="q" maxlength="40" value="' + esc(Q) + '"></div></form>' +
      (list.length
        ? '<ul class="fe-p">' + list.map(row).join("") + '</ul>'
        : '<p class="myhint">찾으시는 회원이 없습니다.</p>') +
      '<p class="hat-m lmsg" hidden></p>';
  }

  function say(t){
    var m = box.querySelector(".hat-m");
    if(m){ m.hidden = false; m.textContent = t; }
  }

  function load(){
    return Promise.all([
      /* ⚠️ 관리자는 모든 계정을 봅니다 (0001 의 account_admin). 직원은
         직원 · 관리자 줄만 보이므로(0012 의 account_staff) 이 상자는
         **관리자에게만** 그립니다 — 반쯤 빈 목록을 내지 않습니다. */
      get("account?select=id,name,role&order=name.asc&limit=300"),
      get("account_hat?select=account_id,hat&limit=1000")
    ]).then(function(r){
      /* ⚠️ 못 읽은 것(null)과 0건은 다릅니다 */
      if(!r[0] || !r[1]){ D = null; return paint(); }
      D = { accs:r[0], hats:{} };
      r[1].forEach(function(h){
        if(!D.hats[h.account_id]) D.hats[h.account_id] = [];
        D.hats[h.account_id].push(h.hat);
      });
      paint();
    });
  }

  box.addEventListener("input", function(e){
    if(e.target && e.target.id === "hq"){ Q = e.target.value; paint();
      var f = document.getElementById("hq");
      if(f){ f.focus(); f.setSelectionRange(f.value.length, f.value.length); } }
  });
  box.addEventListener("submit", function(e){
    var f = e.target;
    if(!f || f.tagName !== "FORM") return;
    e.preventDefault();
    if(f.id === "hatq") return;           /* 찾기는 보내지 않습니다 */
    var li = f.closest("li");
    var btn = li ? li.querySelector("button[data-hat][data-open='1']") : null;
    if(!li || !btn) return;
    var sb = f.querySelector('button[type="submit"]');
    if(sb) sb.disabled = true;
    say("보내는 중입니다…");
    /* ⚠️⚠️ **자리 인자입니다** — `{ p: {...} }` 로 보내면 거절됩니다 */
    rpc(btn.getAttribute("data-on") === "1" ? "revoke_hat" : "grant_hat",
        { p_user: li.getAttribute("data-acc"),
          p_hat:  btn.getAttribute("data-hat"),
          p_why:  f.hwhy.value })
      .then(load)
      .catch(function(err){ if(sb) sb.disabled = false; say(why(err)); });
  });
  box.addEventListener("click", function(e){
    var t = e.target;
    if(!t || !t.closest) return;
    if(t.closest("button[data-do='again']")) return void load();
    var b = t.closest("button[data-hat]");
    if(!b) return;
    var li = b.closest("li");
    /* ⚠️ 어느 단추로 열었는지 적어 둡니다 — 한 줄에 단추가 둘이라
       양식만 보고는 붙이는 것인지 떼는 것인지 알 수 없습니다. */
    Array.prototype.forEach.call(li.querySelectorAll("button[data-hat]"),
      function(x){ x.removeAttribute("data-open"); });
    b.setAttribute("data-open", "1");
    var f = li.querySelector(".hat-f");
    if(f){ f.hidden = false; }
  });

  window.amAuthAsk().then(function(a){
    A = a;
    /* ⚠️ 관리자가 아니면 **한 줄도 안 그리고** 읽으러 가지도 않습니다 */
    if(!a || !a.on || !a.signedIn || a.role !== "admin") return;
    return load();
  }).catch(function(){});
})();
