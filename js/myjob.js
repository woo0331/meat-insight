/* ════════════════════════════════════════════════════════════════════
   내 구인 · 구직 — /my 에서만 돕니다 (DB 는 0048)

   ⚠️⚠️⚠️ **여기가 연락처를 주고받는 유일한 자리입니다** (제17조 제2항).
   목록(`/cat/career`)에는 연락처가 한 번도 안 나옵니다. 수락된 뒤
   **각자 따로** 누르셔야 그 상대 한 분에게만 보입니다 — 수락은
   "이야기해 봅시다" 이지 "내 번호를 줘도 좋다" 가 아닙니다. 둘은 다른
   결정이라 단추도 다릅니다.
   ⚠️ 한쪽만 눌러도 그쪽 것만 갑니다 (맞바꾸기를 강요하지 않습니다 —
   강요하면 "줘야 받는" 구조가 되어 사실상 강제 동의입니다).
   ⚠️ 언제든 **다시 닫을 수 있습니다** (동의 철회).

   ⚠️⚠️ **지우지 않고 내립니다.** 내린 글도 줄로 남습니다 — 지우면
   "그런 글 올린 적 없다" 가 되고, 신고가 들어왔을 때 댈 것이 없습니다.
   ⚠️ 운영자가 **가린** 글은 글쓴이도 못 고치고 못 옮깁니다. 가린
   까닭은 보여 드립니다.

   ⚠️⚠️ 로그인 전에는 **한 글자도 안 그립니다.**
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("jobmine");
  if(!box || !window.amAuthAsk) return;

  var esc = window.esc;
  var REG = {};
  (window.AM_REGIONS || []).forEach(function(r){ REG[r.key] = r.name; });

  /* ⚠️ 하위분류 이름은 catalog.js 에서 읽습니다 (두 곳에 안 적습니다) */
  var SUBNAME = {};
  (window.AM_CATS || []).forEach(function(c){
    if(c.key === "career") (c.items || []).forEach(function(i){
      SUBNAME[i.key] = i.name; });
  });

  /* ⚠️⚠️ **상태 말은 한 곳에.** 글 상태와 지원 상태는 **다른 말**이라
     갈라 둡니다 — 한 표로 쓰면 영문 키가 손님 화면에 그대로 찍힙니다
     (조인에서 실제로 그랬습니다). */
  var PST = { open:"받는 중", closed:"마감했습니다",
              dropped:"내렸습니다", hidden:"운영자가 가렸습니다" };
  var AST = { applied:"기다리는 중", accepted:"수락됨",
              rejected:"거절됨", canceled:"거둠" };
  var KNAME = { hire:"구인", seek:"구직", biz:"제휴 · 거래" };

  function dayText(iso){
    var d = new Date(iso + "T00:00:00");
    if(isNaN(d.getTime())) return iso;
    return (d.getMonth() + 1) + "월 " + d.getDate() + "일";
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

  /* 연락처 칸 — ⚠️ **없으면 "아직 안 여셨습니다" 라고 말합니다.**
     빈 자리를 두면 "연락처가 없는 사람" 으로 읽힙니다. */
  function contactLine(label, val){
    return '<p class="mj-c">' + esc(label) + ' ' +
      (val ? '<b>' + esc(val) + '</b>'
           : '<span class="mj-no">아직 안 여셨습니다</span>') + '</p>';
  }

  function shareBtn(id, mine, who){
    return '<button type="button" class="btn ' + (mine ? "" : "btn-pt") +
      ' mb-share" data-id="' + esc(id) + '" data-on="' + (mine ? "0" : "1") + '">' +
      (mine ? "내 연락처 다시 감추기" : "내 연락처를 " + esc(who) + "에게 보여 주기") +
      '</button>';
  }

  function paint(a, posts, incoming, sent, contacts){
    var cm = {};
    contacts.forEach(function(c){ cm[c.apply_id] = c; });

    var html = '<h2 class="mj-h">내 구인 · 구직 · 제휴</h2>';

    /* ── 내가 올린 글 ───────────────────────────────────────────── */
    html += '<h3 class="mj-sh">내가 올린 글</h3>';
    if(!posts.length){
      /* ⚠️ 0건을 막다른 길로 두지 않습니다 — 단추로 길을 냅니다 */
      html += '<p class="mj-z">아직 올리신 글이 없습니다.</p>' +
        '<a class="btn btn-pt mj-go" href="/cat/career">인력 · 비즈니스에서 올리기</a>';
    }else{
      html += '<ul class="mj-l">' + posts.map(function(j){
        var got = incoming[j.id] || [];
        var live = j.state === "open";
        return '<li class="mj-i" data-id="' + esc(j.id) + '">' +
          '<p class="mj-t"><b>' + esc(j.title) + '</b> · ' +
            esc(KNAME[j.kind] || j.kind) + ' · ' +
            esc(SUBNAME[j.sub] || j.sub) + ' · ' +
            esc(REG[j.region] || j.region) +
            ' · <span class="mq-s">' + esc(PST[j.state] || j.state) + '</span>' +
            (j.close_at ? ' · 마감 ' + esc(dayText(j.close_at)) : '') + '</p>' +
          /* ⚠️ 가린 까닭을 보여 드립니다 — 까닭 없이 가릴 수 없게 해
             두었고, 그 까닭을 숨기면 글쓴이는 무엇이 문제였는지 알 수
             없습니다. */
          (j.state === "hidden" && j.hidden_why
            ? '<p class="mq-w">가린 까닭 — ' + esc(j.hidden_why) + '</p>' : '') +
          (got.length
            ? '<ul class="mj-a">' + got.map(function(ap){
                var c = cm[ap.id];
                return '<li>' +
                  '<p class="mj-m">' + (ap.msg ? esc(ap.msg) : '(적어 주신 말 없음)') +
                    ' — <b>' + esc(AST[ap.state] || ap.state) + '</b></p>' +
                  (ap.state === "applied"
                    ? '<button type="button" class="btn btn-pt mb-ok" data-id="' +
                        esc(ap.id) + '">수락</button>' +
                      '<button type="button" class="btn btn-line mb-no" data-id="' +
                        esc(ap.id) + '">거절</button>'
                    : '') +
                  (ap.state === "accepted"
                    ? contactLine("보내신 분 연락처", c && c.apply_contact) +
                      shareBtn(ap.id, !!(c && c.host_share_at), "보내신 분")
                    : '') +
                '</li>';
              }).join("") + '</ul>'
            : '<p class="mj-z">아직 들어온 것이 없습니다.</p>') +
          (live
            ? '<div class="mq-act">' +
                '<button type="button" class="btn btn-line mb-edit">고치기</button>' +
                '<button type="button" class="btn btn-line mb-close">마감하기</button>' +
                '<button type="button" class="btn btn-line mb-drop">내리기</button>' +
              '</div>'
            : (j.state === "closed"
                ? '<div class="mq-act">' +
                    '<button type="button" class="btn btn-line mb-drop">내리기</button>' +
                  '</div>'
                : '')) +
        '</li>';
      }).join("") + '</ul>';
    }

    /* ── 내가 보낸 것 ───────────────────────────────────────────── */
    html += '<h3 class="mj-sh">내가 보낸 지원 · 제안</h3>';
    if(!sent.length){
      html += '<p class="mj-z">아직 보내신 것이 없습니다.</p>';
    }else{
      html += '<ul class="mj-l">' + sent.map(function(ap){
        var c = cm[ap.id];
        return '<li class="mj-i">' +
          '<p class="mj-t"><b>' + esc(AST[ap.state] || ap.state) + '</b>' +
            (ap.msg ? ' · ' + esc(ap.msg) : '') + '</p>' +
          (ap.state === "applied"
            ? '<button type="button" class="btn btn-line mb-cancel" data-id="' + esc(ap.id) +
              '">거두기</button>' : '') +
          (ap.state === "accepted"
            ? contactLine("올리신 분 연락처", c && c.post_contact) +
              shareBtn(ap.id, !!(c && c.guest_share_at), "올리신 분")
            : '') +
        '</li>';
      }).join("") + '</ul>';
    }

    html += '<p class="jnote">⚠️ 연락처는 <b>수락된 뒤 직접 누르셨을 때만</b> ' +
      '그 상대 한 분에게 보입니다. 언제든 다시 감추실 수 있습니다. ' +
      '내리신 글은 목록에서 빠지지만 <b>기록은 남습니다.</b></p>' +
      '<p id="mbmsg" class="jmsg" hidden></p>';

    box.className = "mj";
    box.hidden = false;
    box.innerHTML = html;

    function act(sel, fn, askWhat){
      Array.prototype.forEach.call(box.querySelectorAll(sel), function(b){
        b.addEventListener("click", function(){
          /* ⚠️ 되돌릴 수 없는 일은 한 번 여쭙습니다 */
          if(askWhat && !window.confirm(askWhat)) return;
          var msg = document.getElementById("mbmsg");
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
    act(".mb-ok",     function(b){ return call(a, "move_jobapply",
      { id: b.getAttribute("data-id"), state:"accepted" }); });
    act(".mb-no",     function(b){ return call(a, "move_jobapply",
      { id: b.getAttribute("data-id"), state:"rejected" }); });
    act(".mb-cancel", function(b){ return call(a, "move_jobapply",
      { id: b.getAttribute("data-id"), state:"canceled" }); });
    act(".mb-close",  function(b){ return call(a, "move_jobpost",
      { id: b.closest(".mj-i").getAttribute("data-id"), state:"closed" }); },
      "이 글을 마감할까요? 목록에서 빠집니다.");
    act(".mb-drop",   function(b){ return call(a, "move_jobpost",
      { id: b.closest(".mj-i").getAttribute("data-id"), state:"dropped" }); },
      "이 글을 내릴까요? 기록은 남습니다.");
    /* ⚠️⚠️ 연락처를 여는 것은 **따로 동의**입니다 — 누른 그 순간을 보냅니다 */
    act(".mb-share",  function(b){ return call(a, "share_jobcontact",
      { id: b.getAttribute("data-id"), on: b.getAttribute("data-on") === "1",
        agree_at: new Date().toISOString() }); });

    /* ── 고치기 ──────────────────────────────────────────────────
       ⚠️⚠️ **갈래 · 분류 · 지역은 못 고칩니다.** 바꾸면 들어온 지원이
       전혀 다른 자리로 옮겨 갑니다 — 그건 고치는 것이 아니라 새 글입니다.
       문도 그 셋은 아예 안 받습니다 (보내도 무시합니다).
       ⚠️⚠️ **양식이 읽을 칸을 다 가져옵니다** — 빠뜨리면 빈 칸으로
       열리고 저장하는 순간 그 값이 지워집니다. */
    Array.prototype.forEach.call(box.querySelectorAll(".mb-edit"), function(b){
      b.addEventListener("click", function(){
        var li = b.closest(".mj-i");
        var open = li.querySelector(".mb-ef");
        if(open){ open.remove(); return; }
        var j = posts.filter(function(x){
          return x.id === li.getAttribute("data-id"); })[0];
        if(!j) return;
        li.insertAdjacentHTML("beforeend",
          '<form class="jform mb-ef">' +
            '<div class="jrow jrow-full"><label>제목 <b>*</b></label>' +
            '<input name="title" required minlength="2" maxlength="60" value="' +
              esc(j.title) + '"></div>' +
            '<div class="jrow jrow-full"><label>내용 <b>*</b></label>' +
            '<textarea name="body" rows="4" required minlength="5" maxlength="2000">' +
              esc(j.body || "") + '</textarea></div>' +
            '<div class="jrow"><label>급여 · 조건</label>' +
            '<input name="pay" maxlength="60" value="' + esc(j.pay || "") + '"></div>' +
            '<div class="jrow"><label>근무 조건</label>' +
            '<input name="terms" maxlength="200" value="' + esc(j.terms || "") + '"></div>' +
            '<div class="jrow"><label>마감일</label>' +
            '<input name="close_at" type="date" value="' + esc(j.close_at || "") + '"></div>' +
            '<div class="jrow jrow-full"><label>연락처 <b>*</b></label>' +
            '<input name="contact" required maxlength="100" autocomplete="tel" ' +
            'placeholder="전화번호 또는 메신저 아이디">' +
            /* ⚠️⚠️⚠️ **연락처는 보낸 것으로 덮습니다.** 그래서 지금 값을
               채워 두지 **않습니다** — 채우려면 목록에서 읽어야 하는데,
               그 칸은 칸 단위 GRANT 로 **일부러** 막혀 있습니다 (내
               연락처라도 표에서는 안 읽힙니다). 비워 보내면 문이
               거절하므로 조용히 지워질 일은 없습니다. */
            '<span class="jhint">⚠️ 연락처는 <b>다시 적어 주셔야</b> ' +
            '합니다 — 저장하면 적어 주신 것으로 바뀝니다.</span></div>' +
            '<p class="jhint jrow-full">갈래 · 분류 · 지역은 여기서 못 바꿉니다 — ' +
            '바꾸면 들어온 지원이 전혀 다른 자리로 옮겨 갑니다.</p>' +
            '<div class="jrow jrow-full">' +
            '<button type="submit" class="btn btn-pt">고친 내용 저장</button></div>' +
          '</form>');
        var f = li.querySelector(".mb-ef");
        f.addEventListener("submit", function(e){
          e.preventDefault();
          var msg = document.getElementById("mbmsg");
          var sb = f.querySelector('button[type="submit"]');
          sb.disabled = true;
          msg.hidden = false; msg.textContent = "저장하는 중입니다…";
          call(a, "edit_jobpost", {
            id: li.getAttribute("data-id"), title: f.title.value,
            body: f.body.value, pay: f.pay.value, terms: f.terms.value,
            close_at: f.close_at.value, contact: f.contact.value
          }).then(function(){ reload(a); })
            .catch(function(err){
              sb.disabled = false;
              msg.textContent = String((err && err.message) || "저장하지 못했습니다.");
            });
        });
      });
    });
  }

  function reload(a){
    /* ⚠️ 고치는 양식이 읽을 칸을 **다 가져옵니다** — 빠뜨리면 양식이
       빈 칸으로 열리고 저장하는 순간 그 값이 지워집니다.
       ⚠️ `contact` 는 **일부러 안 가져옵니다** (칸 단위 GRANT 가
       막습니다 — 가져오려 하면 그 질의가 통째로 거절당합니다). */
    return Promise.all([
      get(a, "jobpost?select=id,kind,sub,region,title,body,pay,terms," +
             "close_at,state,hidden_why,created_at" +
             "&order=created_at.desc&limit=100"),
      get(a, "jobapply?select=id,post_id,by_user,msg,state,created_at," +
             "host_share_at,guest_share_at&order=created_at.desc&limit=200"),
      get(a, "v_job_contact?select=apply_id,post_contact,apply_contact," +
             "host_share_at,guest_share_at&limit=200")
    ]).then(function(r){
      var posts = r[0] || [], aps = r[1] || [], contacts = r[2] || [];
      /* ⚠️⚠️ RLS 가 **내 글에 들어온 것**과 **내가 보낸 것**을 둘 다
         내려 줍니다 — 어느 쪽인지 갈라야 합니다.
         ⚠️ 가르는 것은 `by_user` 로 합니다. 글 목록이 100개에서 끊기면
         id 로 가르는 쪽은 **내 글에 들어온 것을 "내가 보낸 것" 으로**
         잘못 읽습니다. uid 를 못 읽을 때만 id 로 가릅니다.
         ⚠️ 이것은 **보여 주는 쪽 갈래**이고 권한이 아닙니다 — 무엇을
         볼 수 있는지는 이미 RLS 가 정했습니다. */
      var me  = window.amAuthUid ? window.amAuthUid() : "";
      var ids = {}; posts.forEach(function(x){ ids[x.id] = true; });
      var byPost = {}, sent = [];
      aps.forEach(function(x){
        var mine = me ? (x.by_user === me) : !ids[x.post_id];
        if(mine) sent.push(x);
        else (byPost[x.post_id] = byPost[x.post_id] || []).push(x);
      });
      paint(a, posts, byPost, sent, contacts);
    });
  }

  window.amAuthAsk().then(function(a){
    if(!a || !a.on || !a.signedIn) return;   /* 로그인 전에는 안 그립니다 */
    reload(a).catch(function(){ /* 못 읽었으면 숨긴 채로 둡니다 */ });
  }).catch(function(){});
})();
