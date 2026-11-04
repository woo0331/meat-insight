/* ════════════════════════════════════════════════════════════════════
   고객센터 문의함 — /admin 의 한 자리 (0045 · 4차 지시서 §11)

   ⚠️⚠️⚠️ **문만 만들고 화면을 안 만들면 그 기능은 없는 것입니다.**
   0045 가 open_inquiry · move_inquiry 를 열어 두어도, 운영자가 문의를
   **보는 자리**가 없으면 손님이 보낸 글은 아무도 안 읽는 표에 쌓입니다.
   지시서 §11 이 "관리자가 확인할 수 없는 문의 접수 기능은 완료로
   처리하지 않는다" 고 적은 것이 바로 이 자리입니다.

   ⚠️⚠️ **답했다고 두려면 답을 같이 받습니다.** DB 도 막고(0045 의
   inquiry_answer_ck) 여기서도 받습니다 — 답 없이 닫히면 접수함은
   쌓이기만 하는 자리가 되고, 나중에 "어떻게 처리했는가" 가 아무 데도
   없습니다.

   ⚠️⚠️ **적어 주신 연락처는 화면에 그대로 냅니다** — 운영자가 답을
   보내려면 봐야 합니다. 다만 **감사 기록에는 안 들어갑니다**(0045) —
   거기는 오래 남고 보는 사람도 넓습니다.

   ⚠️ 손님이 쓴 글은 전부 esc() 를 지납니다 (절대 규칙 4).
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("inqadm");
  if(!box || !window.amAuthAsk) return;

  var esc = window.esc;
  var A = null;
  var TAB = "live";        /* live 보고 있는 것 · done 끝난 것 */

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

  function badge(name, tone){
    return '<span class="dk-st dk-' + esc(tone) + '">' + esc(name) + '</span>';
  }
  /* 말은 **한 곳**입니다 — 화면마다 따로 적으면 어긋납니다.
     ⚠️ 값은 0045 의 check 제약과 한 글자도 같아야 합니다. */
  var ST = {
    open:      { name:"새 문의",  tone:"ok"   },
    reviewing: { name:"확인 중",  tone:"info" },
    answered:  { name:"답변함",   tone:"grn"  },
    closed:    { name:"닫음",     tone:"ink"  }
  };
  var KIND = {
    use:     "이용 문의",
    biz:     "업체 · 제휴",
    privacy: "개인정보",
    etc:     "그 밖"
  };
  function stOf(k){ return ST[k] || { name:String(k || ""), tone:"ink" }; }

  function tabs(n1, n2){
    return '<div class="bz-tabs" role="tablist">' +
      [["live","보고 있는 것", n1], ["done","끝난 것", n2]].map(function(t){
        return '<button type="button" class="btn btn-sm ' +
          (TAB === t[0] ? "btn-pri" : "btn-line") + '" data-qtab="' + t[0] + '" ' +
          'role="tab" aria-selected="' + (TAB === t[0] ? "true" : "false") + '">' +
          esc(t[1]) + ' ' + String(t[2]) + '</button>';
      }).join("") + '</div>';
  }

  /* 답을 어디로 보내는가 — ⚠️ 없는 칸은 **줄째 뺍니다** (절대 규칙 2) */
  function reach(r){
    var bits = [];
    if(r.name)  bits.push(r.name);
    if(r.tel)   bits.push(r.tel);
    if(r.email) bits.push(r.email);
    if(!bits.length && r.by_user) bits.push("로그인 회원 (계정으로 답합니다)");
    return bits.join(" · ");
  }

  function view(list){
    if(!list.length)
      return '<p class="myhint">' + (TAB === "live"
        ? "들어온 문의가 없습니다."
        : "끝낸 문의가 없습니다.") + '</p>';
    return '<ul class="fe-p">' + list.map(function(r){
      var s = stOf(r.state);
      var live = r.state === "open" || r.state === "reviewing";
      return '<li data-inq="' + esc(r.id) + '">' +
        '<b>' + esc(KIND[r.kind] || r.kind) + '</b> ' + badge(s.name, s.tone) +
        '<p class="fe-r">' + esc(r.no || "") +
          ' · ' + esc(window.amDay ? window.amDay(r.created_at) : "") +
          (reach(r) ? ' · ' + esc(reach(r)) : '') + '</p>' +
        /* ⚠️ 손님이 쓴 글입니다 — esc() 를 반드시 지납니다 */
        '<p class="rep-b">' + esc(r.body || "") + '</p>' +
        (r.answer
          ? '<p class="fe-r">답변 — ' + esc(r.answer) + '</p>' : '') +
        (live
          ? '<div class="dk-b">' +
              (r.state === "open"
                ? '<button class="btn btn-sm btn-line" data-qto="reviewing" ' +
                  'data-qid="' + esc(r.id) + '">확인 중으로</button>' : '') +
              '<button class="btn btn-sm btn-pri" data-qto="answered" ' +
              'data-qid="' + esc(r.id) + '">답변함</button>' +
              '<button class="btn btn-sm btn-line" data-qto="closed" ' +
              'data-qid="' + esc(r.id) + '">닫음</button>' +
            '</div>'
          : '') +
      '</li>';
    }).join("") + '</ul>';
  }

  function paint(){
    box.hidden = false; box.className = "deskbox";
    /* ⚠️⚠️ 제목을 변수로 뽑지 않습니다 — check-safe 가 innerHTML 에
       **변수**를 넣는 줄을 잡습니다. */
    box.innerHTML = '<h2 class="adm-h">고객센터 문의</h2>' +
      '<p class="lmsg">읽는 중입니다…</p>';
    get("inquiry?select=id,no,kind,body,name,tel,email,by_user,state,answer," +
        "created_at,answered_at&order=created_at.desc&limit=200")
      .then(function(rows){
        /* ⚠️⚠️ 못 읽었으면 **0건이라고 말하지 않습니다** */
        if(rows === null){
          box.innerHTML = '<h2 class="adm-h">고객센터 문의</h2>' +
            '<p class="lmsg">읽지 못했습니다. ' +
            '<button class="btn btn-sm btn-line" data-do="again">다시 읽기</button></p>';
          return;
        }
        var live = rows.filter(function(r){
          return r.state === "open" || r.state === "reviewing"; });
        var done = rows.filter(function(r){
          return r.state === "answered" || r.state === "closed"; });
        box.innerHTML = '<h2 class="adm-h">고객센터 문의</h2>' +
          '<p class="myhint">⚠️ <b>답변함</b>으로 옮기려면 무엇이라고 ' +
          '답하셨는지 적어야 합니다 — 적은 글이 기록에 남습니다. ' +
          '답은 적어 주신 연락처로 운영자가 직접 보냅니다 ' +
          '(우리가 메일 · 문자를 보내는 장치는 아직 없습니다).</p>' +
          tabs(live.length, done.length) +
          '<div class="bz-body">' + view(TAB === "live" ? live : done) +
          '</div><p class="dk-m lmsg" hidden></p>';
      });
  }
  function say(t){
    var m = box.querySelector(".dk-m");
    if(m){ m.hidden = false; m.textContent = t; }
  }

  box.addEventListener("click", function(e){
    var tb = e.target.closest ? e.target.closest("button[data-qtab]") : null;
    if(tb){ TAB = tb.getAttribute("data-qtab"); return paint(); }
    var ag = e.target.closest ? e.target.closest("button[data-do='again']") : null;
    if(ag) return paint();

    var mb = e.target.closest ? e.target.closest("button[data-qto]") : null;
    if(mb){
      var to = mb.getAttribute("data-qto"), ans = null;
      /* ⚠️⚠️ **답했다고 두려면 답을 받습니다** (DB 도 막습니다).
         확인 중 · 닫음은 아직 답한 것이 아니라 안 받습니다. */
      if(to === "answered"){
        ans = prompt("무엇이라고 답하셨는지 적어 주세요 (기록에 남습니다)");
        if(!(ans && ans.trim())) return;
        ans = ans.trim();
      }
      mb.disabled = true; say("보내는 중입니다…");
      rpc("move_inquiry", { p: { id: mb.getAttribute("data-qid"), to: to,
                                 answer: ans } })
        .then(paint).catch(function(err){ mb.disabled = false; say(why(err)); });
      return;
    }
  });

  window.amAuthAsk().then(function(a){
    A = a;
    /* ⚠️ 운영자가 아니면 **한 줄도 안 그립니다** — 왜 안 되는지도
       적지 않습니다 (권한 구조를 알려 주는 글이 됩니다). */
    if(!a.on || !a.signedIn) return;
    if(a.role !== "admin" && a.role !== "staff") return;
    paint();
  });
})();
