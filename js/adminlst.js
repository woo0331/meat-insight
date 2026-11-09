/* ════════════════════════════════════════════════════════════════════
   중고 매물 관리 — /admin  (0056 · 0069 · **0070**)

   ⚠️⚠️⚠️ **신고가 들어온 매물만 다룰 수 있었습니다.** `move_listing` 은
   0056 부터 있었지만 부르는 자리가 `js/adminrep.js`(신고 처리) 하나라,
   신고가 **아직 안 들어온** 사기 매물 · 금지 품목은 운영자가 내릴 길이
   없었습니다. `check-doors` 는 이것을 못 잡습니다 — 그 문을 부르는
   화면이 **있기** 때문입니다. 없는 것은 **신고를 거치지 않는 길**이고,
   없는 것은 셀 수가 없습니다.

   ⚠️⚠️⚠️ **되돌리는 길이 아무 데도 없었습니다.** 0056 의 문은
   `hidden` 으로만 갑니다 — 한 번 가리면 올린 분도(제 문들이 전부
   `state in ('open','reserved')` 를 요구합니다) 운영자도 못 되돌려,
   사장님이 SQL 편집기를 여셔야 했습니다. 0070 이 되돌리는 쪽을 냈고
   **가리기 전 상태로** 돌아갑니다(팔린 매물이 「판매중」으로 되살아나지
   않게 · 절대 규칙 1).

   ⚠️⚠️ **지우는 단추를 안 냅니다** — 지우면 문의하신 분 화면에서 그 줄이
   통째로 사라져 무슨 일인지 알 수 없고, 분쟁이 났을 때 낼 것이 없습니다
   (후기를 가리기만 하는 그 까닭 · 제20조의4 ②).

   ⚠️ 직원 · 관리자 둘 다 씁니다 (`move_listing` 이 둘에게 열려 있습니다).
   ⚠️ 설정이 있어야 열리는 자리라 빌드가 찍은 HTML 만 보는 검사는 영원히
   못 봅니다 — `tools/test-desk.js` 가 직접 눌러 봅니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("lsadm");
  if(!box || !window.amAuthAsk) return;

  var esc = window.esc, icon = window.icon;
  var A = null, D = null, Q = "", ST = "";
  var LIMIT = 50;

  /* ⚠️ 상태 말은 `js/data/deal.js` 의 `AM_LST_ST` **한 곳**입니다 —
     여기 또 적으면 0069 의 check 가 늘어나는 날 두 곳이 어긋나고,
     `check-deal` 은 그 한 곳만 봅니다. */
  function stName(k){
    return (window.amLstStName ? window.amLstStName(k) : "") || String(k || "");
  }
  function stList(){
    return (window.AM_LST_ST || []).map(function(x){ return x.key; });
  }
  function subName(k){
    var c = window.amCat ? window.amCat("used") : null;
    var L = (c && window.amCatItems) ? window.amCatItems(c) : [];
    for(var i = 0; i < L.length; i++) if(L[i].key === k) return L[i].name;
    /* ⚠️ 모르는 키는 **그대로** 냅니다 — 이름을 지어내지 않습니다 */
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

  function row(r){
    var hid = r.state === "hidden";
    /* ⚠️ 비는 칸은 **줄에서 빠집니다** — "(미기재)" 를 찍지 않습니다 */
    var bits = [];
    if(r.brand) bits.push(r.brand);
    if(r.model) bits.push(r.model);
    bits.push(subName(r.sub));
    return '<li data-ls="' + esc(r.id) + '">' +
      '<b>' + esc(r.title) + '</b>' +
      '<p class="fe-r">' + esc(stName(r.state)) + ' · ' + esc(bits.join(" · ")) +
        ' · ' + esc(window.amLstPrice ? window.amLstPrice(r.price) : String(r.price)) +
        ' · ' + esc(window.amAgo ? window.amAgo(r.created_at) : "") + '</p>' +
      (hid
        /* ⚠️ 가린 까닭을 그 자리에서 보여 줍니다 — 까닭 없이 못 가리게
           해 두고 그 까닭을 숨기면 다음 운영자가 왜 가렸는지 모릅니다. */
        ? '<p class="fe-r">가린 까닭 — ' + esc(r.hidden_why || "(안 적혔습니다)") +
          /* ⚠️⚠️ **조사를 글자로 박지 않습니다** — 받침에 따라 갈립니다
             (「예약중<b>이</b>」 · 「팔렸습니다<b>가</b>」). 붙이는 자리는
             `js/data/korean.js` 의 `josa()` 한 곳입니다. 처음에 「…으로
             돌아갑니다」 로 적었다가 **찍어 보고** 알았습니다. */
          '</p><p class="fe-r">되돌리면 상태가 <b>' +
          esc(stName(r.hidden_from || "open")) + '</b>' +
          esc(window.josa ? window.josa(stName(r.hidden_from || "open"), "이가") : "가") +
          ' 됩니다.</p>'
        : "") +
      '<div class="dk-b">' +
        /* ⚠️ 매물 자체를 볼 길을 같이 냅니다 — 제목만 보고 가릴 수는
           없습니다 (사진과 설명을 보셔야 합니다). */
        '<a class="btn btn-sm btn-line" href="/cat/used?v=' +
          esc(r.id) + '">매물 보기</a>' +
        (hid
          ? '<button type="button" class="btn btn-sm btn-pri" data-back="1">' +
            '되돌리기</button>'
          : '<button type="button" class="btn btn-sm btn-bad" data-hide="1">' +
            '가리기</button>') +
      '</div>' +
      /* ⚠️ 까닭 칸은 **가릴 때만** 엽니다 — 되돌릴 때도 받으면 되돌리기가
         가리기보다 어려워지고, 그러면 잘못 가린 것이 그대로 남습니다. */
      '<form class="jform lsadm-f" hidden>' +
        '<div class="jrow jrow-full">' +
        '<label>가리는 까닭 <b>*</b> (기록에 남고 지울 수 없습니다)</label>' +
        '<input name="lwhy" required minlength="5" maxlength="200"></div>' +
        '<div class="jrow jrow-full">' +
        '<button type="submit" class="btn btn-pt">이 까닭으로 가리기</button>' +
        '</div>' +
      '</form>' +
    '</li>';
  }

  function stOpts(){
    return '<option value="">전체 상태</option>' + stList().map(function(k){
      return '<option value="' + esc(k) + '"' + (ST === k ? " selected" : "") +
        '>' + esc(stName(k)) + '</option>';
    }).join("");
  }

  function paint(){
    box.hidden = false; box.className = "deskbox";
    if(!D){
      box.innerHTML = '<h2 class="adm-h">' + icon("cart", 19) + '중고 매물 관리</h2>' +
        '<p class="lmsg">읽지 못했습니다. <b>0건이라는 뜻이 아닙니다.</b> ' +
        '<button class="btn btn-sm btn-line" data-do="again">다시 읽기</button></p>';
      return;
    }
    /* ⚠️⚠️ **받아 온 줄이 한도에 닿으면 「N건 이상」** 이라고 적습니다 —
       그 수를 전체인 것처럼 적으면 세어 본 값이 아닙니다 (절대 규칙 1). */
    var many = D.rows.length >= LIMIT;
    box.innerHTML = '<h2 class="adm-h">' + icon("cart", 19) + '중고 매물 관리</h2>' +
      '<p class="myhint">⚠️ <b>지우지 않고 가립니다.</b> 가린 매물은 목록 · ' +
      '상세에서 빠지고, 문의하신 분 화면에는 줄이 남습니다. ' +
      '가린 까닭은 기록에 남고 지울 수 없습니다. ' +
      '되돌리면 <b>가리기 전 상태</b>로 돌아갑니다.</p>' +
      '<form class="jform" id="lsadmq">' +
        '<div class="jrow"><label for="laq">제목으로 찾기</label>' +
        '<input id="laq" maxlength="40" value="' + esc(Q) + '"></div>' +
        '<div class="jrow"><label for="last">상태</label>' +
        '<select id="last">' + stOpts() + '</select></div>' +
      '</form>' +
      '<p class="fe-r">' + esc(D.rows.length ? (many
          ? ("이 목록에 " + D.rows.length + "건 이상")
          : ("이 목록에 " + D.rows.length + "건")) : "조건에 맞는 매물이 없습니다") +
        '</p>' +
      (D.rows.length
        ? '<ul class="fe-p">' + D.rows.map(row).join("") + '</ul>'
        : "") +
      '<p class="lsadm-m lmsg" hidden></p>';
  }

  function say(t){
    var m = box.querySelector(".lsadm-m");
    if(m){ m.hidden = false; m.textContent = t; }
  }

  /* ⚠️⚠️ **거르는 것은 서버입니다** — 쉰 줄만 받아 화면에서 거르면 그
     쉰 줄 밖의 매물이 영영 안 나옵니다 (중고 목록에서 세운 규칙).
     ⚠️⚠️ `model` 은 **0070 이 GRANT 를 준 뒤에야** 읽힙니다 — 0069 가
     칸만 더하고 GRANT 를 안 줘서 그 칸을 부르면 질의가 통째로 거절되고
     이 상자가 **빈 채로** 남습니다. */
  function load(){
    var q = "listing?select=id,title,sub,brand,model,region,price,state," +
            "hidden_why,hidden_from,created_at" +
            "&order=created_at.desc&limit=" + LIMIT;
    if(ST) q += "&state=eq." + encodeURIComponent(ST);
    if(Q.trim()) q += "&title=ilike." +
      encodeURIComponent("*" + Q.trim().replace(/[*%]/g, "") + "*");
    return get(q).then(function(rows){
      /* ⚠️ 못 읽은 것(null)과 0건은 다릅니다 */
      D = rows ? { rows: rows } : null;
      paint();
    });
  }

  var TMR = null;
  box.addEventListener("input", function(e){
    if(!e.target || e.target.id !== "laq") return;
    Q = e.target.value;
    /* ⚠️ 한 글자마다 서버로 보내지 않습니다 — 그리고 다시 그리면
       커서가 튕겨 나가므로 **목록만** 갈아 끼우지 않고 통째로 그린 뒤
       초점을 되돌려 놓습니다 (adminhat 과 같은 꼴). */
    if(TMR) clearTimeout(TMR);
    TMR = setTimeout(function(){
      load().then(function(){
        var f = document.getElementById("laq");
        if(f){ f.focus(); f.setSelectionRange(f.value.length, f.value.length); }
      });
    }, 300);
  });
  box.addEventListener("change", function(e){
    if(!e.target || e.target.id !== "last") return;
    ST = e.target.value; load();
  });
  box.addEventListener("click", function(e){
    var t = e.target;
    if(!t || !t.closest) return;
    if(t.closest("button[data-do='again']")) return void load();
    var b = t.closest("button[data-hide],button[data-back]");
    if(!b) return;
    var li = b.closest("li");
    if(!li) return;
    if(b.getAttribute("data-hide")){
      var f = li.querySelector(".lsadm-f");
      if(f) f.hidden = false;
      return;
    }
    /* ⚠️ 되돌리기는 바로 보냅니다 — 되돌리는 일 자체가 되돌리기입니다 */
    b.disabled = true;
    say("되돌리는 중입니다…");
    rpc("move_listing", { p: { id: li.getAttribute("data-ls"), state:"open" } })
      .then(load)
      .catch(function(err){ b.disabled = false; say(why(err)); });
  });
  box.addEventListener("submit", function(e){
    var f = e.target;
    if(!f || f.tagName !== "FORM") return;
    e.preventDefault();
    if(f.id === "lsadmq") return;          /* 찾기는 보내지 않습니다 */
    var li = f.closest("li");
    if(!li) return;
    var sb = f.querySelector('button[type="submit"]');
    if(sb) sb.disabled = true;
    say("보내는 중입니다…");
    /* ⚠️ 이 문은 저장소의 다른 문처럼 `jsonb` 하나(`p`)를 받습니다 */
    rpc("move_listing", { p: { id: li.getAttribute("data-ls"),
                               state:"hidden", why: f.lwhy.value } })
      .then(load)
      .catch(function(err){ if(sb) sb.disabled = false; say(why(err)); });
  });

  window.amAuthAsk().then(function(a){
    A = a;
    /* ⚠️ 운영자가 아니면 **한 줄도 안 그리고** 읽으러 가지도 않습니다 */
    if(!a || !a.on || !a.signedIn ||
       (a.role !== "admin" && a.role !== "staff")) return;
    return load();
  }).catch(function(){});
})();
