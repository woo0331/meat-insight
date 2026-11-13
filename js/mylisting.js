/* ════════════════════════════════════════════════════════════════════
   내 중고 매물 — /my 에서만 돕니다 (DB 는 0056)

   ⚠️⚠️⚠️ **여기가 연락처를 주고받는 유일한 자리입니다** (제17조 제2항).
   목록(`/cat/used`)에는 연락처가 한 번도 안 나옵니다. 받아들여진 뒤
   **각자 따로** 누르셔야 그 상대 한 분에게만 보입니다 — 받아들이는 것은
   "팔겠습니다" 이지 "내 번호를 줘도 좋다" 가 아닙니다. 둘은 다른
   결정이라 단추도 다릅니다.
   ⚠️ 한쪽만 눌러도 그쪽 것만 갑니다 (맞바꾸기를 강요하지 않습니다).
   ⚠️ 언제든 **다시 닫을 수 있습니다** (동의 철회).

   ⚠️⚠️ **상태 말은 `js/data/deal.js` 한 곳입니다.** 조인은 이 말을 제
   화면 안에 들고 있어서 아무도 DB 와 맞춰 보지 않았고, 거기서 영문
   `closed` 가 손님 화면에 찍혔습니다 — `check-deal` 이 0056 의 check 와
   빌드마다 맞춰 봅니다.
   ⚠️⚠️ **파는 분 말과 사는 분 말이 다릅니다** (`name` · `mine`) —
   한 벌로 쓰면 파는 분에게 할 말을 사는 분 화면에 찍습니다 (절대 규칙 3).

   ⚠️⚠️ 로그인 전에는 **한 글자도 안 그립니다.**
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("lsmine");
  if(!box || !window.amAuthAsk) return;

  var esc = window.esc;
  var REG = {};
  (window.AM_REGIONS || []).forEach(function(r){ REG[r.key] = r.name; });
  /* ⚠️⚠️ **못 찾은 키를 그대로 찍지 않습니다**(지시 6번 · 2026-11-12).
     중립 문구를 내고 누락은 `console.warn` 으로 운영자에게만 갑니다. */
  function rgName(k){
    return window.amKeyName ? window.amKeyName(REG, k, "지역") : "";
  }
  function subName(k){
    var f = window.amSub ? window.amSub(k) : null;
    /* ⚠️ 모르는 키는 **키 그대로** 냅니다 (지어내지 않습니다) */
    return (f && f.item && f.item.name) ? f.item.name : String(k || "");
  }

  function get(a, path){
    return fetch(a.conf.url + "/rest/v1/" + path, {
      headers: Object.assign({ apikey:a.conf.anonKey },
                             window.amAuthHeaders ? window.amAuthHeaders() : {})
    }).then(function(r){ return r.ok ? r.json() : []; });
  }
  function call(a, fn, p){
    return fetch(a.conf.url + "/rest/v1/rpc/" + fn, {
      method:"POST",
      headers: Object.assign({ "content-type":"application/json", apikey:a.conf.anonKey },
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

  /* 연락처 칸 — ⚠️ 없으면 "아직 안 여셨습니다" 라고 말합니다 (빈 자리를
     두면 "연락처가 없는 사람" 으로 읽힙니다). */
  function contactLine(label, val){
    return '<p class="mj-c">' + esc(label) + ' ' +
      (val ? '<b>' + esc(val) + '</b>'
           : '<span class="mj-no">아직 안 여셨습니다</span>') + '</p>';
  }
  function shareBtn(id, mine, who){
    return '<button type="button" class="btn ' + (mine ? "btn-line" : "btn-pt") +
      ' ls-share" data-id="' + esc(id) + '" data-on="' + (mine ? "0" : "1") + '">' +
      (mine ? "내 연락처 다시 감추기" : "내 연락처를 " + esc(who) + "에게 보여 주기") +
      '</button>';
  }

  /* 아직 팔고 있는 자리인가 — ⚠️ **예약중도 들어갑니다**(0069).
     ⚠️⚠️ 이 판단을 화면 곳곳에 흩어 적으면 한 곳만 고치는 날 어떤
     단추는 나오고 어떤 단추는 안 나옵니다 — **한 함수**입니다. */
  function live(st){ return st === "open" || st === "reserved"; }

  /* 매물 한 줄의 단추들 — ⚠️ 예약중이면 **되돌리는 단추**를 냅니다
     (없으면 잘못 누른 분이 매물을 다시 올려야 하고 받아 둔 문의가
     통째로 날아갑니다 · 막다른 길 · 절대 규칙 2). */
  function btns(r){
    var ph = (window.amLstPhoto && window.amLstPhoto.on())
      ? '<button type="button" class="btn btn-line ls-ph" data-id="' +
        esc(r.id) + '">사진</button>' : '';
    /* ⚠️⚠️ **예약중 단추의 말이 상태마다 갈립니다** — 한 말로 두면
       눌러도 아무 일이 안 나는 칸이 됩니다(이미 그 상태면 문이
       "이미 그 상태입니다" 로 거절합니다 · 0069). */
    var res = r.state === "reserved"
      ? '<button type="button" class="btn btn-line ls-open" data-id="' + esc(r.id) +
        '">예약 풀기</button>'
      : '<button type="button" class="btn btn-line ls-res" data-id="' + esc(r.id) +
        '">예약중으로</button>';
    return ph + res +
      '<button type="button" class="btn btn-line ls-edit" data-id="' + esc(r.id) +
      '">고치기</button>' +
      '<button type="button" class="btn btn-line ls-sold" data-id="' + esc(r.id) +
      '">팔렸습니다</button>' +
      '<button type="button" class="btn btn-line ls-close" data-id="' + esc(r.id) +
      '">내리기</button>' +
      /* ⚠️ 손님이 보는 화면으로 가는 길 — 올리신 분이 **제 매물이 어떻게
         보이는지** 볼 자리가 없었습니다 (사진 차례를 바꾼 뒤 확인할 곳) */
      '<a class="btn btn-bad" href="/cat/used?v=' + encodeURIComponent(r.id) +
      '">손님 화면으로 보기</a>';
  }

  function paint(a, mine, asks, contacts){
    var cm = {};
    contacts.forEach(function(c){ cm[c.ask_id] = c; });

    var html = '<h2 class="mj-h">내 중고 매물</h2>';

    /* ── 내가 올린 매물 ─────────────────────────────────────────── */
    html += '<h3 class="mj-sh">내가 올린 매물</h3>';
    if(!mine.length){
      /* ⚠️ 0건을 막다른 길로 두지 않습니다 — 단추로 길을 냅니다
         (절대 규칙 2 · `/my` 의 내 요청 상자에서 겪은 그 자리) */
      html += '<p class="mj-z">아직 올리신 매물이 없습니다.</p>' +
        '<a class="btn btn-pt mj-go" href="/cat/used">중고 골프장터에서 올리기</a>';
    }else{
      html += '<ul class="mj-l">' + mine.map(function(r){
        var got = (asks[r.id] || []);
        var st  = window.amLstSt(r.state);
        return '<li class="mj-i">' +
          '<p class="mj-t"><b>' + esc(r.title) + '</b> · ' +
            esc(window.amLstPrice(r.price)) + ' · ' +
            /* ⚠️ 브랜드가 비면 **그 자리를 빼고** 종류만 적습니다
               (0068 전에 올라온 매물은 비어 있습니다 · 절대 규칙 2) */
            (r.brand ? esc(r.brand) + ' · ' : '') +
            /* ⚠️ 모델명도 비면 **그 자리를 빼고** 넘어갑니다 (0069) */
            (r.model ? esc(r.model) + ' · ' : '') + esc(subName(r.sub)) +
            ' · ' + esc(rgName(r.region)) + ' · ' + esc(st.name) + '</p>' +
          /* ⚠️ 가린 까닭을 글쓴이에게 보여 줍니다 — 까닭 없이 못 가리게
             해 두고 그 까닭을 숨기면 무엇이 문제였는지 모릅니다 */
          (r.state === "hidden" && r.hidden_why
            ? '<p class="mq-w">가린 까닭 — ' + esc(r.hidden_why) + '</p>' : '') +
          (got.length
            ? '<ul class="mj-a">' + got.map(function(q){
                var c = cm[q.id];
                return '<li>' +
                  '<p class="mj-m">' + (q.msg ? esc(q.msg) : '(남기신 말 없음)') +
                    ' — <b>' + esc(window.amLstAskSt(q.state).name) + '</b></p>' +
                  (q.state === "asked"
                    ? '<button type="button" class="btn btn-pt ls-ok" data-id="' +
                        esc(q.id) + '">받아들이기</button>' +
                      '<button type="button" class="btn btn-line ls-no" data-id="' +
                        esc(q.id) + '">거절</button>'
                    : '') +
                  (q.state === "accepted"
                    ? contactLine("문의하신 분 연락처", c && c.buyer_contact) +
                      shareBtn(q.id, !!(c && c.seller_share_at), "문의하신 분")
                    : '') +
                '</li>';
              }).join("") + '</ul>'
            : '<p class="mj-z">아직 문의가 없습니다.</p>') +
          /* ⚠️⚠️⚠️ **예약중에도 단추를 냅니다** (0069) — `state = 'open'`
             만 보면 예약중으로 둔 매물을 **고칠 수도 · 사진을 붙일 수도 ·
             되돌릴 수도** 없습니다(0069 가 문 넷을 같이 고친 그 까닭).
             ⚠️⚠️ **사진은 여기서도 붙입니다** — 올리신 직후
             (`/cat/used`)에만 붙일 수 있게 두면 그 화면을 닫은 분의
             매물은 영원히 사진이 없습니다 (막다른 길 · 절대 규칙 2).
             ⚠️ 상자 markup 과 올리는 길은 `js/lstphoto.js` **한 곳**
             입니다 — 두 화면에 따로 적으면 한쪽만 고치는 날 어긋납니다.
             ⚠️ 버킷이 꺼져 있으면 단추를 **안 냅니다**(눌러도 아무 일이
             안 나는 단추를 미리 만들지 않습니다). */
          (live(r.state) ? btns(r) : '') +
        '</li>';
      }).join("") + '</ul>';
    }

    /* ── 내가 문의한 것 ─────────────────────────────────────────── */
    var sent = asks.__sent || [];
    html += '<h3 class="mj-sh">내가 문의한 매물</h3>';
    if(!sent.length){
      html += '<p class="mj-z">아직 문의하신 매물이 없습니다.</p>';
    }else{
      html += '<ul class="mj-l">' + sent.map(function(q){
        var c = cm[q.id];
        return '<li class="mj-i">' +
          /* ⚠️⚠️ **사는 분 눈의 말**을 씁니다 (`mine`) — "받았습니다" 는
             파는 분의 말이고, 여기 찍으면 절대 규칙 3 입니다. */
          '<p class="mj-t"><b>' + esc(window.amLstAskMine(q.state)) + '</b>' +
            (q.msg ? ' · ' + esc(q.msg) : '') + '</p>' +
          (q.state === "asked"
            ? '<button type="button" class="btn btn-line ls-cancel" data-id="' + esc(q.id) +
              '">문의 거두기</button>' : '') +
          (q.state === "accepted"
            ? contactLine("올리신 분 연락처", c && c.seller_contact) +
              shareBtn(q.id, !!(c && c.buyer_share_at), "올리신 분")
            : '') +
        '</li>';
      }).join("") + '</ul>';
    }

    html += '<p class="jnote">⚠️ 연락처는 <b>받아들여진 뒤 직접 ' +
      '누르셨을 때만</b> 그 상대 한 분에게 보입니다. 언제든 다시 ' +
      '감추실 수 있습니다. ⚠️ 골프올인원은 거래 당사자가 아닙니다 — ' +
      '만나서 물건을 보고 거래하시고, 먼저 보내 달라는 요구는 ' +
      '받아들이지 마세요.</p>' +
      '<p id="lsmmsg" class="jmsg" hidden></p>';

    box.className = "mj";
    box.hidden = false;
    box.innerHTML = html;

    function act(sel, fn){
      Array.prototype.forEach.call(box.querySelectorAll(sel), function(b){
        b.addEventListener("click", function(){
          var msg = document.getElementById("lsmmsg");
          b.disabled = true;
          msg.hidden = false; msg.textContent = "보내는 중입니다…";
          fn(b).then(function(){ reload(a); })
               .catch(function(err){
                 b.disabled = false;
                 /* ⚠️ DB 가 거절한 말을 **그대로** 보여 줍니다 */
                 msg.textContent = String((err && err.message) || "하지 못했습니다.");
               });
        });
      });
    }
    act(".ls-ok",     function(b){ return call(a, "move_listingask",
      { id: b.getAttribute("data-id"), state:"accepted" }); });
    act(".ls-no",     function(b){ return call(a, "move_listingask",
      { id: b.getAttribute("data-id"), state:"rejected" }); });
    act(".ls-cancel", function(b){ return call(a, "move_listingask",
      { id: b.getAttribute("data-id"), state:"canceled" }); });
    act(".ls-sold",   function(b){ return call(a, "close_listing",
      { id: b.getAttribute("data-id"), state:"done" }); });
    act(".ls-close",  function(b){ return call(a, "close_listing",
      { id: b.getAttribute("data-id"), state:"closed" }); });
    /* ⚠️⚠️ **예약중은 오갑니다** (0069) — 되돌리는 길이 없으면 잘못 누른
       분이 매물을 다시 올려야 하고 받아 둔 문의가 통째로 날아갑니다
       (막다른 길 · 절대 규칙 2). 문도 그 둘을 다 받습니다. */
    act(".ls-res",    function(b){ return call(a, "close_listing",
      { id: b.getAttribute("data-id"), state:"reserved" }); });
    act(".ls-open",   function(b){ return call(a, "close_listing",
      { id: b.getAttribute("data-id"), state:"open" }); });
    /* ⚠️⚠️ 연락처를 여는 것은 **따로 동의**입니다 — 누른 그 순간을 보냅니다.
       ⚠️ 닫을 때는 동의 시각을 안 보냅니다 (문이 여는 쪽만 봅니다 —
       닫을 때도 요구하면 철회를 막는 꼴입니다). */
    act(".ls-share",  function(b){
      var on = b.getAttribute("data-on") === "1";
      return call(a, "share_listingcontact", on
        ? { id: b.getAttribute("data-id"), on:true, agree_at: new Date().toISOString() }
        : { id: b.getAttribute("data-id"), on:false });
    });

    /* ── 고치기 ───────────────────────────────────────────────────
       ⚠️⚠️ **물건 종류와 지역은 못 고칩니다.** 바꾸면 문의하신 분이
       전혀 다른 물건에 묶입니다 — 그건 고치는 것이 아니라 새 매물입니다
       (조인에서 날짜 · 지역을 못 고치게 둔 그 까닭).
       ⚠️⚠️ **문이 보낸 칸만 고칩니다** — 그래서 양식이 칸을 빠뜨려도
       그 칸이 지워지지 않습니다 (`save_provider_self` 와 다릅니다).
       ⚠️ 연락처는 표에서 못 읽어 오므로(칸 GRANT) **비워 열고**, 비워
       보내면 그대로 둡니다 — 그 사실을 그 자리에서 말합니다. */
    /* ── 사진 — ⚠️ 누를 때 **그 매물 것만** 물어봅니다 ───────────────
       ⚠️⚠️ 늘 펼쳐 두면 매물 쉰 개에 호출이 쉰 번 늘고, 그동안 화면이
       멈춰 보입니다. 그래서 누르면 엽니다.
       ⚠️ 사진이 바뀌면 목록 카드의 첫 장도 바뀌므로 다시 그립니다 —
       안 그리면 올려도 카드가 그대로여서 "안 올라갔다" 로 보입니다. */
    Array.prototype.forEach.call(box.querySelectorAll(".ls-ph"), function(b){
      b.addEventListener("click", function(){
        var li = b.closest(".mj-i");
        var open = li.querySelector(".lsp");
        if(open){ open.remove(); return; }
        if(!window.amLstPhoto) return;
        var html = window.amLstPhoto.box();
        if(!html) return;
        li.insertAdjacentHTML("beforeend", html);
        window.amLstPhoto.bind(li.querySelector(".lsp"),
                               b.getAttribute("data-id"), a.conf, null);
      });
    });

    Array.prototype.forEach.call(box.querySelectorAll(".ls-edit"), function(b){
      b.addEventListener("click", function(){
        var li = b.closest(".mj-i");
        var open = li.querySelector(".ls-ef");
        if(open){ open.remove(); return; }
        var r = mine.filter(function(x){ return x.id === b.getAttribute("data-id"); })[0];
        if(!r) return;
        var cd = (window.AM_LST_COND || []).map(function(c){
          return '<option value="' + esc(c.key) + '">' + esc(c.name) + '</option>';
        }).join("");
        /* ⚠️⚠️ 브랜드는 **고르개 + 직접 적기**입니다 (올리는 양식과 같은
           규칙) — 목록에 없는 브랜드를 가진 분이 못 고치면 안 됩니다.
           ⚠️ 지금 담긴 글자가 목록에 없으면 **그대로 한 줄 더** 넣어
           고른 것으로 보여 줍니다 (안 넣으면 저장할 때마다 엉뚱한
           브랜드로 바뀝니다). */
        var now = String(r.brand || "");
        var BL = (window.AM_LST_BRAND || []).slice();
        var free = !!now && BL.indexOf(now) < 0;
        var br = (free ? ['<option value="' + esc(now) + '" selected>' +
                          esc(now) + '</option>'] : []).concat(
          BL.map(function(n){
            return '<option value="' + esc(n) + '"' +
              (now === n ? " selected" : "") + '>' +
              esc(n === "기타" ? "기타 (직접 적기)" : n) + '</option>';
          })).join("");
        li.insertAdjacentHTML("beforeend",
          '<form class="jform ls-ef" data-id="' + esc(r.id) + '">' +
            '<div class="jrow jrow-full"><label>제목 <b>*</b></label>' +
            '<input name="title" required minlength="2" maxlength="60" value="' +
              esc(r.title) + '"></div>' +
            '<div class="jrow"><label>값 <b>*</b></label>' +
            '<input name="price" type="number" min="0" max="100000000" step="1000" ' +
            'inputmode="numeric" required value="' + esc(String(r.price)) + '"></div>' +
            '<div class="jrow"><label>브랜드 <b>*</b></label>' +
            '<select name="brand" required>' + br + '</select>' +
            '<input class="ls-br2" maxlength="30" hidden ' +
              'aria-label="브랜드를 직접 적습니다" placeholder="브랜드를 적어 주세요">' +
            '<span class="jhint">목록에 없으면 <b>기타</b> 를 고르고 ' +
            '직접 적어 주세요.</span></div>' +
            /* ⚠️⚠️ **모델명은 비울 수 있습니다** (0069) — 별표를 안 붙입니다.
               ⚠️ 적혀 있던 값을 **미리 채웁니다** — 안 채우면 늘 보내는
               칸이라 저장할 때마다 지워집니다 (`save_provider_self` 가
               `industries` 를 지우고 있던 그 자리). */
            '<div class="jrow"><label>모델명</label>' +
            '<input name="model" maxlength="40" value="' + esc(r.model || "") +
              '" placeholder="예: 스텔스2 · P790">' +
            '<span class="jhint">모르시면 비워 두셔도 됩니다.</span></div>' +
            '<div class="jrow"><label>물건 상태 <b>*</b></label>' +
            '<select name="cond" required>' + cd + '</select></div>' +
            /* ⚠️⚠️ 0080 — 샤프트 플렉스 · 좌/우타. **비울 수 있고 비우는
               것도 보내는 것**입니다 — 적혀 있던 값을 미리 채우지 않으면
               저장할 때마다 지워집니다(모델명과 같은 자리). */
            '<div class="jrow"><label>샤프트 플렉스</label>' +
            '<select name="flex">' + fxOpts(r.flex) + '</select></div>' +
            '<div class="jrow"><label>좌 · 우타</label>' +
            '<select name="hand">' + hdOpts(r.hand) + '</select>' +
            '<span class="jhint">골프채가 아니면 <b>해당 없음</b> 으로 ' +
            '두세요.</span></div>' +
            '<div class="jrow jrow-full"><label class="jchk">' +
            '<input type="checkbox" name="ship"' + (r.ship ? " checked" : "") + '> ' +
            '<span>택배로도 보내 드릴 수 있습니다</span></label></div>' +
            '<div class="jrow jrow-full"><label>설명 <b>*</b></label>' +
            '<textarea name="body" rows="4" required minlength="5" maxlength="2000">' +
              esc(r.body || "") + '</textarea></div>' +
            '<div class="jrow jrow-full"><label>연락처</label>' +
            '<input name="contact" maxlength="100" autocomplete="tel">' +
            '<span class="jhint">비워 두시면 <b>지금 것이 그대로</b> 남습니다. ' +
            '적으신 연락처는 보안을 위해 다시 불러오지 않습니다.</span></div>' +
            '<p class="jhint jrow-full">물건 종류와 지역은 여기서 못 바꿉니다 — ' +
            '바꾸시려면 내리고 새로 올려 주세요 (문의하신 분이 다른 물건에 ' +
            '묶이지 않게).</p>' +
            '<div class="jrow jrow-full">' +
            '<button type="submit" class="btn btn-pt">고친 내용 저장</button></div>' +
          '</form>');
        var f = li.querySelector(".ls-ef");
        f.cond.value = String(r.cond);
        /* ⚠️ 「기타」를 고르시면 직접 적는 칸이 나옵니다 */
        var b2 = f.querySelector(".ls-br2");
        if(b2) f.brand.addEventListener("change", function(){
          b2.hidden = f.brand.value !== "기타";
          if(!b2.hidden){ try{ b2.focus(); }catch(_){} }
        });
        /* ⚠️⚠️ 보내는 브랜드를 **한 곳**에서 짓습니다 (올리는 양식과 같은
           규칙) — 두 곳에 적으면 한쪽만 고치는 날 둘이 다른 값을 담습니다 */
        function brandNow(){
          if(f.brand.value !== "기타") return f.brand.value;
          var v = b2 ? String(b2.value || "").trim() : "";
          return v || "기타";
        }
        f.addEventListener("submit", function(e){
          e.preventDefault();
          var msg = document.getElementById("lsmmsg");
          var sb = f.querySelector('button[type="submit"]');
          sb.disabled = true;
          msg.hidden = false; msg.textContent = "저장하는 중입니다…";
          /* ⚠️ 연락처는 **적으셨을 때만** 보냅니다 — 빈 글자를 보내도
             문이 그대로 두지만, 안 보내는 쪽이 뜻이 분명합니다. */
          var p = { id: f.getAttribute("data-id"), title: f.title.value,
                    body: f.body.value, price: f.price.value,
                    brand: brandNow(),
                    /* ⚠️⚠️ **모델명은 비우는 것도 보내는 것**입니다 (0069) —
                       늘 보내므로 비우면 지워집니다 (문이 `p ? 'model'` 로
                       보냈는지를 봅니다). `coalesce` 로 받는 칸이면 빈
                       글자가 "안 보냈다" 와 섞여 **지울 수가 없습니다**. */
                    model: f.model.value,
                    /* ⚠️ 0080 — 비우면 null 로 담깁니다 */
                    flex: f.flex.value, hand: f.hand.value,
                    cond: f.cond.value, ship: !!f.ship.checked };
          if(f.contact.value) p.contact = f.contact.value;
          call(a, "edit_listing", p)
            .then(function(){ reload(a); })
            .catch(function(err){
              sb.disabled = false;
              msg.textContent = String((err && err.message) || "저장하지 못했습니다.");
            });
        });
      });
    });
  }

  /* 0080 — 고르개 글자를 **한 곳**에서 짓습니다 (고치기 양식만 씁니다) */
  function fxOpts(v){
    return optList(window.AM_LST_FLEX, v);
  }
  function hdOpts(v){
    return optList(window.AM_LST_HAND, v);
  }
  function optList(L, v){
    return '<option value="">해당 없음 · 모름</option>' +
      (L || []).map(function(x){
        return '<option value="' + esc(x.key) + '"' +
          (String(v || "") === x.key ? " selected" : "") + '>' +
          esc(x.name) + '</option>';
      }).join("");
  }

  function reload(a){
    return Promise.all([
      /* ⚠️ 고치기 양식이 읽을 칸까지 **같이** 가져옵니다 — 빠뜨리면
         양식이 빈 칸으로 열립니다.
         ⚠️⚠️ `contact` · `agree_at` 은 **부르지 않습니다** — 0056 이 그
         칸을 안 줬으므로 부르면 **질의가 통째로 거절**됩니다 (0053 의
         `memo` · `answered_by` 에서 겪은 그 자리입니다). */
      get(a, "listing?select=id,title,body,sub,region,ship,price,cond,state," +
             "brand,model,flex,hand,hidden_why,created_at" +
             "&order=created_at.desc&limit=50"),
      get(a, "listingask?select=id,listing_id,msg,state,created_at,by_user," +
             "seller_share_at,buyer_share_at&order=created_at.desc&limit=200"),
      get(a, "v_listing_contact?select=ask_id,seller_contact,buyer_contact," +
             "seller_share_at,buyer_share_at&limit=200")
    ]).then(function(r){
      var mine = r[0] || [], qs = r[1] || [], contacts = r[2] || [];
      /* ⚠️ RLS 가 **내 매물에 들어온 것**과 **내가 넣은 것**을 둘 다
         내려 줍니다 — 어느 쪽인지는 listing_id 로 갈라야 합니다. */
      var ids = {}; mine.forEach(function(x){ ids[x.id] = true; });
      var byLst = {}, sent = [];
      qs.forEach(function(x){
        if(ids[x.listing_id]){ (byLst[x.listing_id] = byLst[x.listing_id] || []).push(x); }
        else sent.push(x);
      });
      byLst.__sent = sent;
      paint(a, mine, byLst, contacts);
    });
  }

  window.amAuthAsk().then(function(a){
    if(!a || !a.on || !a.signedIn) return;   /* 로그인 전에는 안 그립니다 */
    /* ⚠️⚠️ **사진 버킷이 켜졌는지 먼저 묻고 그립니다** — 안 기다리면
       그 답이 오기 전에 그려 「사진」 단추가 조용히 안 나옵니다
       (스크립트 차례에 기댄 자리를 두 번 겪었습니다).
       ⚠️ 못 물어봐도 목록은 그립니다 — 사진 단추만 안 납니다. */
    var pre = window.amLstPhoto ? window.amLstPhoto.ready()
                                : Promise.resolve(false);
    pre.catch(function(){}).then(function(){
      return reload(a);
    }).catch(function(){ /* 못 읽었으면 숨긴 채로 둡니다 */ });
  }).catch(function(){});
})();
