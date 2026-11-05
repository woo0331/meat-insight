/* ════════════════════════════════════════════════════════════════════
   내 조인 — /my 에서만 돕니다 (DB 는 0046)

   ⚠️⚠️⚠️ **여기가 연락처를 주고받는 유일한 자리입니다** (제17조 제2항).
   목록(`/cat/matchup`)에는 연락처가 한 번도 안 나옵니다. 수락된 뒤
   **각자 따로** 누르셔야 그 상대 한 분에게만 보입니다 — 수락은
   "같이 치자" 이지 "내 번호를 줘도 좋다" 가 아닙니다. 둘은 다른
   결정이라 단추도 다릅니다.
   ⚠️ 한쪽만 눌러도 그쪽 것만 갑니다 (맞바꾸기를 강요하지 않습니다 —
   강요하면 "줘야 받는" 구조가 되어 사실상 강제 동의입니다).
   ⚠️ 언제든 **다시 닫을 수 있습니다** (동의 철회).

   ⚠️⚠️ 로그인 전에는 **한 글자도 안 그립니다.** 빌드가 찍어 둔 빈
   상자가 그대로 숨어 있습니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("joinmine");
  if(!box || !window.amAuthAsk) return;

  var esc = window.esc;
  var REG = {};
  (window.AM_REGIONS || []).forEach(function(r){ REG[r.key] = r.name; });

  function dayText(iso){
    var d = new Date(iso + "T00:00:00");
    if(isNaN(d.getTime())) return iso;
    var w = ["일","월","화","수","목","금","토"][d.getDay()];
    return (d.getMonth() + 1) + "월 " + d.getDate() + "일 (" + w + ")";
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

  var ST = { applied:"기다리는 중", accepted:"수락됨",
             rejected:"거절됨", canceled:"거둠" };
  /* ⚠️⚠️⚠️ **자리 상태와 신청 상태는 다른 말입니다 — 갈라 둡니다.**
     전에는 한 줄에 `ST[r.state] || r.state === "open" ? … : r.state` 로
     적었는데, 자바스크립트는 `||` 를 `?:` 보다 **먼저** 묶습니다. 그래서
     닫힌 자리에서는 조건이 거짓이 되어 영문 `closed` 가 손님 화면에
     그대로 찍혔습니다 — 에러도 없고 열린 자리만 보면 영원히 멀쩡합니다.
     ⚠️ 상태 말은 **한 곳**에 적습니다 (작업 기억 — 같은 규칙을 두 곳에
     적으면 조용히 어긋납니다). */
  var RST = { open:"받는 중", closed:"닫혔습니다", done:"지난 자리",
              hidden:"운영자가 가렸습니다" };

  /* 연락처 칸 — ⚠️ **없으면 "아직 안 여셨습니다" 라고 말합니다.**
     빈 자리를 두면 "연락처가 없는 사람" 으로 읽힙니다. */
  function contactLine(label, val){
    return '<p class="mj-c">' + esc(label) + ' ' +
      (val ? '<b>' + esc(val) + '</b>'
           : '<span class="mj-no">아직 안 여셨습니다</span>') + '</p>';
  }

  function shareBtn(id, mine, who){
    return '<button type="button" class="btn ' + (mine ? "" : "btn-pt") +
      ' mj-share" data-id="' + esc(id) + '" data-on="' + (mine ? "0" : "1") + '">' +
      (mine ? "내 연락처 다시 감추기" : "내 연락처를 " + esc(who) + "에게 보여 주기") +
      '</button>';
  }

  function paint(a, rooms, applies, contacts){
    var cm = {};
    contacts.forEach(function(c){ cm[c.apply_id] = c; });

    var html = '<h2 class="mj-h">내 조인</h2>';

    /* ── 내가 연 자리 ───────────────────────────────────────────── */
    html += '<h3 class="mj-sh">내가 연 자리</h3>';
    if(!rooms.length){
      /* ⚠️ 0건을 막다른 길로 두지 않습니다 — 단추로 길을 냅니다 */
      html += '<p class="mj-z">아직 여신 자리가 없습니다.</p>' +
        '<a class="btn btn-pt mj-go" href="/cat/matchup">골프 조인에서 열기</a>';
    }else{
      html += '<ul class="mj-l">' + rooms.map(function(r){
        var mine = (applies[r.id] || []);
        return '<li class="mj-i">' +
          '<p class="mj-t"><b>' + esc(r.title) + '</b> · ' +
            esc(dayText(r.play_at)) + ' · ' + esc(REG[r.region] || r.region) +
            ' · ' + esc(RST[r.state] || r.state) + '</p>' +
          /* ⚠️ 가린 까닭을 연 사람에게 보여 줍니다 (0049) — 까닭 없이
             가릴 수 없게 해 두고 그 까닭을 숨기면, 무엇이 문제였는지
             모르니 다시 열 때도 같은 일을 합니다. */
          (r.state === "hidden" && r.hidden_why
            ? '<p class="mq-w">가린 까닭 — ' + esc(r.hidden_why) + '</p>' : '') +
          (mine.length
            ? '<ul class="mj-a">' + mine.map(function(ap){
                var c = cm[ap.id];
                return '<li>' +
                  '<p class="mj-m">' + (ap.msg ? esc(ap.msg) : '(남기신 말 없음)') +
                    ' — <b>' + esc(ST[ap.state] || ap.state) + '</b></p>' +
                  (ap.state === "applied"
                    ? '<button type="button" class="btn btn-pt mj-ok" data-id="' +
                        esc(ap.id) + '">수락</button>' +
                      '<button type="button" class="btn btn-line mj-no-b" data-id="' +
                        esc(ap.id) + '">거절</button>'
                    : '') +
                  (ap.state === "accepted"
                    ? contactLine("신청하신 분 연락처", c && c.apply_contact) +
                      shareBtn(ap.id, !!(c && c.host_share_at), "신청하신 분")
                    : '') +
                '</li>';
              }).join("") + '</ul>'
            : '<p class="mj-z">아직 신청이 없습니다.</p>') +
          (r.state === "open"
            ? '<button type="button" class="btn btn-line mj-edit" data-id="' + esc(r.id) +
              '">고치기</button>' +
              '<button type="button" class="btn btn-line mj-close" data-id="' + esc(r.id) +
              '">이 자리 닫기</button>' : '') +
        '</li>';
      }).join("") + '</ul>';
    }

    /* ── 내가 신청한 것 ─────────────────────────────────────────── */
    var sent = applies.__sent || [];
    html += '<h3 class="mj-sh">내가 신청한 자리</h3>';
    if(!sent.length){
      html += '<p class="mj-z">아직 신청하신 자리가 없습니다.</p>';
    }else{
      html += '<ul class="mj-l">' + sent.map(function(ap){
        var c = cm[ap.id];
        return '<li class="mj-i">' +
          '<p class="mj-t"><b>' + esc(ST[ap.state] || ap.state) + '</b>' +
            (ap.msg ? ' · ' + esc(ap.msg) : '') + '</p>' +
          (ap.state === "applied"
            ? '<button type="button" class="btn btn-line mj-cancel" data-id="' + esc(ap.id) +
              '">신청 거두기</button>' : '') +
          (ap.state === "accepted"
            ? contactLine("여신 분 연락처", c && c.room_contact) +
              shareBtn(ap.id, !!(c && c.guest_share_at), "여신 분")
            : '') +
        '</li>';
      }).join("") + '</ul>';
    }

    html += '<p class="jnote">⚠️ 연락처는 <b>수락된 뒤 직접 누르셨을 때만</b> ' +
      '그 상대 한 분에게 보입니다. 언제든 다시 감추실 수 있습니다.</p>' +
      '<p id="mjmsg" class="jmsg" hidden></p>';

    box.className = "mj";
    box.hidden = false;
    box.innerHTML = html;

    function act(sel, fn){
      Array.prototype.forEach.call(box.querySelectorAll(sel), function(b){
        b.addEventListener("click", function(){
          var msg = document.getElementById("mjmsg");
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
    act(".mj-ok",     function(b){ return call(a, "move_joinapply",
      { id: b.getAttribute("data-id"), state:"accepted" }); });
    act(".mj-no-b",   function(b){ return call(a, "move_joinapply",
      { id: b.getAttribute("data-id"), state:"rejected" }); });
    act(".mj-cancel", function(b){ return call(a, "move_joinapply",
      { id: b.getAttribute("data-id"), state:"canceled" }); });
    act(".mj-close",  function(b){ return call(a, "close_joinroom",
      { id: b.getAttribute("data-id") }); });

    /* ── 고치기 (지시서 §2.A — 작성자 본인 수정) ──────────────────
       ⚠️⚠️ **날짜 · 지역은 못 고칩니다.** 바꾸면 신청하신 분이 전혀
       다른 약속에 묶입니다 — 그건 고치는 것이 아니라 새 자리입니다.
       문도 그 둘은 아예 안 받습니다 (보내도 무시합니다). */
    Array.prototype.forEach.call(box.querySelectorAll(".mj-edit"), function(b){
      b.addEventListener("click", function(){
        var li = b.closest(".mj-i");
        var open = li.querySelector(".mj-ef");
        if(open){ open.remove(); return; }
        var r = rooms.filter(function(x){ return x.id === b.getAttribute("data-id"); })[0];
        if(!r) return;
        li.insertAdjacentHTML("beforeend",
          '<form class="jform mj-ef" data-id="' + esc(r.id) + '">' +
            '<div class="jrow jrow-full"><label>제목 <b>*</b></label>' +
            '<input name="title" required minlength="2" maxlength="60" value="' +
              esc(r.title) + '"></div>' +
            '<div class="jrow jrow-full"><label>설명 <b>*</b></label>' +
            '<textarea name="body" rows="3" required minlength="5" maxlength="1000">' +
              esc(r.body || "") + '</textarea></div>' +
            '<div class="jrow"><label>골프장</label>' +
            '<input name="course" maxlength="60" value="' + esc(r.course || "") + '"></div>' +
            '<div class="jrow"><label>희망 티타임</label>' +
            '<input name="tee" maxlength="30" value="' + esc(r.tee || "") + '"></div>' +
            '<div class="jrow"><label>더 필요한 인원</label>' +
            '<select name="need"><option value="1">1명</option>' +
            '<option value="2">2명</option><option value="3">3명</option></select></div>' +
            '<div class="jrow"><label>1인 예상 비용</label>' +
            '<input name="budget" type="number" min="0" max="10000000" step="1000" ' +
            'inputmode="numeric" value="' + esc(r.budget == null ? "" : r.budget) + '"></div>' +
            '<p class="jhint jrow-full">날짜와 지역은 여기서 못 바꿉니다 — ' +
            '바꾸시려면 닫고 새로 여셔야 합니다 (신청하신 분이 다른 약속에 ' +
            '묶이지 않게).</p>' +
            '<div class="jrow jrow-full">' +
            '<button type="submit" class="btn btn-pt">고친 내용 저장</button></div>' +
          '</form>');
        var f = li.querySelector(".mj-ef");
        f.need.value = String(r.need);
        f.addEventListener("submit", function(e){
          e.preventDefault();
          var msg = document.getElementById("mjmsg");
          var sb = f.querySelector('button[type="submit"]');
          sb.disabled = true;
          msg.hidden = false; msg.textContent = "저장하는 중입니다…";
          call(a, "edit_joinroom", {
            id: f.getAttribute("data-id"), title: f.title.value, body: f.body.value,
            course: f.course.value, tee: f.tee.value, need: f.need.value,
            budget: f.budget.value
          }).then(function(){ reload(a); })
            .catch(function(err){
              sb.disabled = false;
              msg.textContent = String((err && err.message) || "저장하지 못했습니다.");
            });
        });
      });
    });
    /* ⚠️⚠️ 연락처를 여는 것은 **따로 동의**입니다 — 누른 그 순간을 보냅니다 */
    act(".mj-share",  function(b){ return call(a, "share_joincontact",
      { id: b.getAttribute("data-id"), on: b.getAttribute("data-on") === "1",
        agree_at: new Date().toISOString() }); });
  }

  function reload(a){
    return Promise.all([
      /* ⚠️ 고치기 양식이 읽을 칸까지 **같이** 가져옵니다 — 빠뜨리면
         양식이 빈 칸으로 열리고, 저장하는 순간 그 값이 **지워집니다**
         (`save_provider_self` 에서 겪은 "보낸 것으로 통째로 덮어쓰기"). */
      get(a, "joinroom?select=id,title,body,course,tee,budget,play_at," +
             "region,state,need,hidden_why&order=play_at.asc&limit=50"),
      get(a, "joinapply?select=id,room_id,msg,state,created_at,by_user," +
             "host_share_at,guest_share_at&order=created_at.desc&limit=200"),
      get(a, "v_join_contact?select=apply_id,room_contact,apply_contact," +
             "host_share_at,guest_share_at&limit=200")
    ]).then(function(r){
      var rooms = r[0] || [], aps = r[1] || [], contacts = r[2] || [];
      /* ⚠️ RLS 가 **내 자리에 들어온 것**과 **내가 넣은 것**을 둘 다
         내려 줍니다 — 어느 쪽인지는 room_id 로 갈라야 합니다. */
      var ids = {}; rooms.forEach(function(x){ ids[x.id] = true; });
      var byRoom = {}, sent = [];
      aps.forEach(function(x){
        if(ids[x.room_id]){ (byRoom[x.room_id] = byRoom[x.room_id] || []).push(x); }
        else sent.push(x);
      });
      byRoom.__sent = sent;
      paint(a, rooms, byRoom, contacts);
    });
  }

  window.amAuthAsk().then(function(a){
    if(!a || !a.on || !a.signedIn) return;   /* 로그인 전에는 안 그립니다 */
    reload(a).catch(function(){ /* 못 읽었으면 숨긴 채로 둡니다 */ });
  }).catch(function(){});
})();
