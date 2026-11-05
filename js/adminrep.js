/* ════════════════════════════════════════════════════════════════════
   신고 · 분쟁 — /admin 의 한 자리 (0040 · 3차 지시서 §6 · §8)

   ⚠️⚠️⚠️ **문만 만들고 화면을 안 만들면 그 기능은 없는 것입니다.**
   0040 이 `open_report` · `move_report` 를 열어 두었어도, 운영자가
   신고를 **보는 자리**가 없으면 손님이 보낸 글은 아무도 안 읽는 표에
   쌓입니다. 작업 기억의 그 줄입니다 (approve_provider 가 그랬습니다).

   ⚠️⚠️ **까닭 없이 닫을 수 없습니다.** DB 도 막고(0040 의
   report_resolution_ck) 여기서도 받습니다 — 까닭 없이 닫히면 신고함은
   쌓이기만 하는 자리가 되고, 나중에 다툼이 생겼을 때 "어떻게
   처리했는가" 가 아무 데도 없습니다.

   ⚠️⚠️ **신고한 사람이 누구인지 이 화면에 안 찍습니다.** 표에는
   `by_user` 가 있지만 보여 줄 까닭이 없습니다 — 운영자가 할 일은
   내용을 보고 처리하는 것이고, 누가 썼는지는 그 다음입니다. 업체 쪽에
   말이 새 나가는 길을 화면에서부터 막습니다 (0040 은 업체가 제게 들어온
   신고를 아예 못 읽게 두었습니다).

   ⚠️ 요청 번호 · 업체 상호는 **따로 읽어서** 붙입니다. 묶음 읽기
   (embed)로 꺼내면 정책에 막힌 줄이 조용히 null 로 와서 "누구 건인지
   없는 신고" 가 됩니다 (작업 기억의 그 줄 — 0031 에서 겪었습니다).
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("repbox");
  if(!box || !window.amAuthAsk) return;

  var A = null;
  var TAB = "live";        /* live 열린 것 · done 끝난 것 */

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
      /* ⚠️⚠️ **가리키는 칸을 빠뜨리면 "무엇에 대한 신고인지 없는
         신고" 가 됩니다.** 0046 · 0047 · 0048 이 칸을 넷 더했는데
         여기서 안 읽으면 운영자 화면에는 아무것도 안 적힙니다 —
         에러는 한 줄도 없습니다. */
      get("report?select=id,kind,request_id,provider_id,review_id," +
          "joinroom_id,cq_id,ca_id,jobpost_id,body,state," +
          "resolution,created_at,closed_at&order=created_at.desc&limit=200"),
      get("request?select=id,no&order=created_at.desc&limit=500"),
      get("provider?select=id,name&order=name.asc&limit=300"),
      /* ⚠️ 신고된 글의 제목 · 지금 상태를 **따로 읽어** 붙입니다.
         묶음 읽기(embed)로 꺼내면 정책에 막힌 줄이 조용히 null 로
         와서 "제목 없는 글" 이 됩니다 (0031 에서 겪은 자리).
         ⚠️ 연락처 칸은 **안 읽습니다** — 칸 단위 GRANT 가 막고,
         운영자가 신고를 처리하는 데 필요한 것도 아닙니다. */
      get("cq?select=id,title,state&order=created_at.desc&limit=300"),
      get("ca?select=id,q_id,state&order=created_at.desc&limit=300"),
      get("jobpost?select=id,title,state&order=created_at.desc&limit=300"),
      get("joinroom?select=id,title,state&order=created_at.desc&limit=300")
    ]);
  }

  function badge(name, tone){
    return '<span class="dk-st dk-' + esc(tone) + '">' + esc(name) + '</span>';
  }
  /* 말은 **한 곳**입니다 — 화면마다 따로 적으면 어긋납니다 */
  var ST = {
    open:      { name:"새 신고",  tone:"ok"   },
    reviewing: { name:"확인 중",  tone:"info" },
    resolved:  { name:"처리됨",   tone:"grn"  },
    rejected:  { name:"반려",     tone:"ink"  }
  };
  var KIND = { abuse:"신고", dispute:"분쟁" };
  function stOf(k){ return ST[k] || { name:String(k || ""), tone:"ink" }; }

  function tabs(n1, n2){
    return '<div class="bz-tabs" role="tablist">' +
      [["live","보고 있는 것", n1], ["done","끝난 것", n2]].map(function(t){
        return '<button type="button" class="btn btn-sm ' +
          (TAB === t[0] ? "btn-pri" : "btn-line") + '" data-rtab="' + t[0] + '" ' +
          'role="tab" aria-selected="' + (TAB === t[0] ? "true" : "false") + '">' +
          esc(t[1]) + ' ' + String(t[2]) + '</button>';
      }).join("") + '</div>';
  }

  /* ⚠️ 무엇에 대한 신고인가 — 셋 가운데 있는 것만 적습니다
     (`(미기재)` 를 찍지 않습니다 · 절대 규칙 2). */
  function target(r, nos, pnames, posts){
    var bits = [];
    if(r.request_id)
      bits.push("요청 " + (nos[r.request_id] || r.request_id.slice(0, 8)));
    if(r.provider_id)
      bits.push("업체 " + (pnames[r.provider_id] || r.provider_id));
    if(r.review_id) bits.push("후기");
    if(r.joinroom_id)
      bits.push("조인 자리" + (posts.jr[r.joinroom_id]
        ? " — " + posts.jr[r.joinroom_id].title : ""));
    /* ⚠️ 제목을 못 읽었으면 **지어내지 않습니다** — 종류만 적습니다 */
    if(r.cq_id)
      bits.push("커뮤니티 질문" + (posts.cq[r.cq_id]
        ? " — " + posts.cq[r.cq_id].title : ""));
    if(r.ca_id) bits.push("커뮤니티 답변");
    if(r.jobpost_id)
      bits.push("구인 · 구직 글" + (posts.jb[r.jobpost_id]
        ? " — " + posts.jb[r.jobpost_id].title : ""));
    return bits.join(" · ");
  }

  /* ⚠️⚠️⚠️ **가리는 문을 부르는 화면이 여기입니다.** 0047 · 0048 이
     `move_cq` · `move_ca` · `move_jobpost` 를 열어 두었어도, 운영자가
     누를 자리가 없으면 사장님은 SQL 편집기를 열어야 합니다 — 작업
     기억의 `approve_provider` 가 바로 그랬습니다.
     ⚠️ `check-doors` 는 이것을 **못 잡습니다**: 그 문들은 글쓴이가
     내리는 길(`js/mycq.js` · `js/myjob.js`)에서 이미 불리고 있어서
     "부르는 자리가 있다" 로 세어집니다. 갈래마다 세지 않습니다.
     ⚠️ 가린 글은 다시 못 가립니다 — 이미 가려진 것에는 단추를
     내지 않습니다 (눌러도 아무 일이 안 나는 단추를 만들지 않습니다). */
  function hideBtn(r, posts){
    var it = r.cq_id ? { fn:"move_cq", id:r.cq_id, row:posts.cq[r.cq_id],
                         name:"질문" }
           : r.ca_id ? { fn:"move_ca", id:r.ca_id, row:posts.ca[r.ca_id],
                         name:"답변" }
           : r.jobpost_id ? { fn:"move_jobpost", id:r.jobpost_id,
                              row:posts.jb[r.jobpost_id], name:"글" }
           /* ⚠️ 0049 — 조인 자리도 가립니다. 전에는 신고를 받아 놓고
              운영자가 할 수 있는 일이 "처리했음" 뿐이었습니다 (닫는
              문은 **연 사람만** 씁니다). */
           : r.joinroom_id ? { fn:"move_joinroom", id:r.joinroom_id,
                               row:posts.jr[r.joinroom_id], name:"조인 자리" }
           : null;
    if(!it) return "";
    if(it.row && it.row.state === "hidden")
      return '<p class="fe-r">이 ' + esc(it.name) + '은 이미 가려져 있습니다.</p>';
    return '<button class="btn btn-sm btn-line" data-hfn="' + esc(it.fn) + '" ' +
      'data-hid="' + esc(it.id) + '" data-hname="' + esc(it.name) + '">' +
      '이 ' + esc(it.name) + ' 가리기</button>';
  }

  function view(list, nos, pnames, posts){
    if(!list.length)
      return '<p class="myhint">' + (TAB === "live"
        ? "들어온 신고 · 분쟁이 없습니다."
        : "끝낸 신고 · 분쟁이 없습니다.") + '</p>';
    return '<ul class="fe-p">' + list.map(function(r){
      var s = stOf(r.state);
      var live = r.state === "open" || r.state === "reviewing";
      return '<li data-rep="' + esc(r.id) + '">' +
        '<b>' + esc(KIND[r.kind] || r.kind) + '</b> ' + badge(s.name, s.tone) +
        '<p class="fe-r">' + esc(target(r, nos, pnames, posts)) +
          ' · ' + esc(window.amDay ? window.amDay(r.created_at) : "") + '</p>' +
        /* ⚠️ 손님 · 업체가 쓴 글입니다 — esc() 를 반드시 지납니다 */
        '<p class="rep-b">' + esc(r.body || "") + '</p>' +
        (r.resolution
          ? '<p class="fe-r">처리 — ' + esc(r.resolution) + '</p>' : '') +
        (live
          ? '<div class="dk-b">' +
              (r.state === "open"
                ? '<button class="btn btn-sm btn-line" data-rto="reviewing" ' +
                  'data-rid="' + esc(r.id) + '">확인 중으로</button>' : '') +
              '<button class="btn btn-sm btn-pri" data-rto="resolved" ' +
              'data-rid="' + esc(r.id) + '">처리했음</button>' +
              '<button class="btn btn-sm btn-line" data-rto="rejected" ' +
              'data-rid="' + esc(r.id) + '">반려</button>' +
              hideBtn(r, posts) +
            '</div>'
          : '') +
      '</li>';
    }).join("") + '</ul>';
  }

  function paint(){
    box.hidden = false; box.className = "deskbox";
    /* ⚠️⚠️ 제목을 변수로 뽑지 않습니다 — `check-safe` 가 innerHTML 에
       **변수**를 넣는 줄을 잡는데, 그 검사를 느슨하게 고치면 손님 글이
       날것으로 나가는 날 아무것도 안 잡습니다 (작업 기억의 그 줄). */
    box.innerHTML = '<h2 class="adm-h">신고 · 분쟁</h2>' +
      '<p class="lmsg">읽는 중입니다…</p>';
    load().then(function(got){
      var reps = got[0], reqs = got[1], pvs = got[2];
      /* ⚠️ 못 읽은 것은 **빈 표**로 둡니다 — 그러면 제목 없이 종류만
         적히고, 지어낸 제목이 찍히지 않습니다 (절대 규칙 1 · 2). */
      var posts = { cq:{}, ca:{}, jb:{}, jr:{} };
      (got[3] || []).forEach(function(x){ posts.cq[x.id] = x; });
      (got[4] || []).forEach(function(x){ posts.ca[x.id] = x; });
      (got[5] || []).forEach(function(x){ posts.jb[x.id] = x; });
      (got[6] || []).forEach(function(x){ posts.jr[x.id] = x; });
      /* ⚠️⚠️ 못 읽었으면 **0건이라고 말하지 않습니다** */
      if(reps === null){
        box.innerHTML = '<h2 class="adm-h">신고 · 분쟁</h2>' +
          '<p class="lmsg">읽지 못했습니다. ' +
          '<button class="btn btn-sm btn-line" data-do="again">다시 읽기</button></p>';
        return;
      }
      var nos = {}, pnames = {};
      (reqs || []).forEach(function(x){ nos[x.id] = x.no; });
      (pvs  || []).forEach(function(x){ pnames[x.id] = x.name; });
      var live = reps.filter(function(r){
        return r.state === "open" || r.state === "reviewing"; });
      var done = reps.filter(function(r){
        return r.state === "resolved" || r.state === "rejected"; });
      box.innerHTML = '<h2 class="adm-h">신고 · 분쟁</h2>' +
        '<p class="myhint">⚠️ 업체는 <b>제게 들어온 신고를 읽지 못합니다</b> — ' +
        '운영자가 보고 걸러서 전합니다. ' +
        '<b>처리했음 · 반려</b>에는 어떻게 하셨는지를 적어야 합니다.</p>' +
        tabs(live.length, done.length) +
        '<div class="bz-body">' +
        view(TAB === "live" ? live : done, nos, pnames, posts) +
        '</div><p class="dk-m lmsg" hidden></p>';
    });
  }
  function say(t){
    var m = box.querySelector(".dk-m");
    if(m){ m.hidden = false; m.textContent = t; }
  }

  box.addEventListener("click", function(e){
    var tb = e.target.closest ? e.target.closest("button[data-rtab]") : null;
    if(tb){ TAB = tb.getAttribute("data-rtab"); return paint(); }
    var ag = e.target.closest ? e.target.closest("button[data-do='again']") : null;
    if(ag) return paint();

    /* ⚠️⚠️ **까닭 없이 가릴 수 없습니다** — 문도 막고(0047 · 0048)
       표의 check 도 막습니다. 여기서도 받습니다. 까닭 없이 가릴 수
       있으면 불평할 때마다 지워 주는 자리가 되고, 그러면 글이 광고입니다.
       ⚠️ 그 까닭은 **글쓴이에게 보여 줍니다** (`/my` 가 찍습니다) —
       무엇이 문제였는지 모르면 고칠 수도 없습니다. */
    var hb = e.target.closest ? e.target.closest("button[data-hfn]") : null;
    if(hb){
      var hname = hb.getAttribute("data-hname");
      /* ⚠️ 한글 조사를 **글자로 박지 않습니다** — 받침에 따라 갈려서
         "질문를" · "조인 자리을" 이 나갑니다 (문법도 빌드도 검사도
         전부 통과합니다 — 띄워 봐야 압니다). 붙이는 함수는
         `koWith` 한 곳이지만, 여기서는 아예 **조사가 안 붙는 꼴**로
         적습니다 (이름을 문장 끝에 둡니다) — 붙일 까닭이 없으면
         안 붙이는 쪽이 한 군데 덜 어긋납니다. */
      var hw = prompt("가리는 까닭을 적어 주세요 — " + hname + "\n" +
                      "(다섯 글자 이상 · 글쓴이에게 보입니다)");
      if(!(hw && hw.trim().length >= 5)) return;
      hb.disabled = true; say("가리는 중입니다…");
      rpc(hb.getAttribute("data-hfn"),
          { p: { id: hb.getAttribute("data-hid"), state:"hidden", why: hw.trim() } })
        .then(paint).catch(function(err){ hb.disabled = false; say(why(err)); });
      return;
    }

    var mb = e.target.closest ? e.target.closest("button[data-rto]") : null;
    if(mb){
      var to = mb.getAttribute("data-rto"), res = null;
      /* ⚠️⚠️ 끝내는 데에는 **까닭을 받습니다** (DB 도 막습니다).
         확인 중으로 옮기는 것은 아직 안 끝난 것이라 안 받습니다. */
      if(to === "resolved" || to === "rejected"){
        res = prompt("어떻게 처리하셨는지 적어 주세요 (기록에 남습니다)");
        if(!(res && res.trim())) return;
        res = res.trim();
      }
      mb.disabled = true; say("보내는 중입니다…");
      rpc("move_report", { p: { id: mb.getAttribute("data-rid"), to: to,
                                resolution: res } })
        .then(paint).catch(function(err){ mb.disabled = false; say(why(err)); });
      return;
    }
  });

  amAuthAsk().then(function(a){
    A = a;
    /* ⚠️ 운영자가 아니면 **한 줄도 안 그립니다** — 왜 안 되는지도
       적지 않습니다 (권한 구조를 알려 주는 글이 됩니다). */
    if(!a.on || !a.signedIn) return;
    if(a.role !== "admin" && a.role !== "staff") return;
    paint();
  });
})();
