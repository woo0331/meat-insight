/* ════════════════════════════════════════════════════════════════════
   업체 심사 · 정지 — /admin 의 한 자리 (3차 지시서 §2 · §8 · §11-1)

   ⚠️⚠️⚠️ **이 화면이 없어서 `approve_provider` 를 아무도 못 불렀습니다.**
   그 문은 0007 에 쓰고 0012 · 0018 로 두 번 고쳤는데, **부르는 화면이
   한 곳도 없었습니다** — 즉 업체를 승인하려면 사장님이 SQL 편집기를
   열어야 했습니다. "만들어 놓고 안 쓰는 칸" 의 가장 큰 판입니다
   (작업 기억의 그 줄 — 부르는 자리를 세어 보세요).

   ⚠️⚠️ **쓰는 길은 전부 문(function)입니다.** 표를 직접 고치지
   않습니다 —
     set_apply_state      (0016)  입점 신청의 상태
     approve_provider     (0018)  공개 · 배정 가능 · 확인 배지
     set_provider_state   (0038)  승인 · 거절 · 정지
   문마다 **까닭을 받고** 감사 기록과 한 트랜잭션입니다.

   ⚠️⚠️ **확인 배지를 여기서 켜지 않습니다.** 배지는 "서류를 봤다" 는
   뜻인데, 단추 하나로 켜지면 보지 않고도 켜집니다. 서류를 본 사람이
   그 자리에서 켜는 화면이 생기는 날 붙입니다 (절대 규칙 1 · 5).

   ⚠️ 신청자의 성함 · 연락처가 나옵니다 — 운영자가 전화를 걸어야 하는
   자리라 그렇습니다. 화면 밖으로 내보내지 않습니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("probox");
  if(!box || !window.amAuthAsk) return;

  var A = null;
  var TAB = "pv";          /* pv 업체 · ap 입점 신청 */

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
      /* ⚠️ RLS 가 운영자에게만 전부 내줍니다 — 화면이 또 좁히지 않습니다 */
      get("provider?select=id,name,state,state_why,state_at,listed,assignable," +
          "is_test,subs,regions&order=name.asc&limit=300"),
      get("provider_apply?select=id,no,company,brn,name,tel,email,region," +
          "services,note,state,created_at&order=created_at.desc&limit=200")
    ]);
  }

  function badge(name, tone){
    return '<span class="dk-st dk-' + esc(tone) + '">' + esc(name) + '</span>';
  }
  /* 상태 말 — ⚠️ **한 곳**입니다. 화면마다 따로 적으면 어긋납니다. */
  var ST = {
    draft:        { name:"작성 중",   tone:"ink"  },
    submitted:    { name:"접수됨",    tone:"ok"   },
    under_review: { name:"심사 중",   tone:"info" },
    approved:     { name:"승인",      tone:"grn"  },
    rejected:     { name:"거절",      tone:"bad"  },
    suspended:    { name:"정지",      tone:"bad"  }
  };
  var AP = {
    "new":   { name:"새 신청",  tone:"ok"   },
    called:  { name:"연락함",   tone:"info" },
    done:    { name:"등록 완료", tone:"grn" },
    drop:    { name:"진행 안 함", tone:"ink" }
  };
  function stOf(k){ return ST[k] || { name:String(k || ""), tone:"ink" }; }
  function apOf(k){ return AP[k] || { name:String(k || ""), tone:"ink" }; }

  function tabs(){
    return '<div class="bz-tabs" role="tablist">' +
      [["pv","업체"],["ap","입점 신청"]].map(function(t){
        return '<button type="button" class="btn btn-sm ' +
          (TAB === t[0] ? "btn-pri" : "btn-line") + '" data-ptab="' + t[0] + '" ' +
          'role="tab" aria-selected="' + (TAB === t[0] ? "true" : "false") + '">' +
          esc(t[1]) + '</button>';
      }).join("") + '</div>';
  }

  /* ── 업체 ───────────────────────────────────────────────────────── */
  function pvView(list){
    if(!list.length)
      /* ⚠️ 0곳은 고장이 아닙니다 — 지어낸 값이 아니라고 말합니다 */
      return '<p class="myhint">아직 등록된 업체가 없습니다. ' +
             '입점 신청이 들어오면 <b>입점 신청</b> 갈래에서 등록하실 수 있습니다.</p>';
    return '<p class="myhint">⚠️ <b>정지</b>하면 그 업체는 ① 공개 목록에서 빠지고 ' +
      '② 새 배정을 못 받고 ③ 새 견적을 못 냅니다. ' +
      '손님이 <b>이미 받아 둔 견적을 고르는 것</b>은 그대로 됩니다.</p>' +
      '<ul class="fe-p">' + list.map(function(p){
        var s = stOf(p.state);
        return '<li><b>' + esc(p.name) + '</b> ' + badge(s.name, s.tone) +
          (p.is_test ? ' ' + badge("검사용", "warn") : '') +
          (p.listed ? ' ' + badge("공개", "grn") : ' ' + badge("비공개", "ink")) +
          (p.assignable ? ' ' + badge("배정 가능", "grn") : '') +
          '<p class="fe-r">' + esc(p.id) +
            (Array.isArray(p.subs) && p.subs.length
              ? " · 하는 일 " + p.subs.length + "가지" : " · ⚠️ 하는 일이 비었습니다") +
          '</p>' +
          (p.state_why ? '<p class="fe-r">까닭 — ' + esc(p.state_why) + '</p>' : '') +
          '<div class="dk-b">' +
            (p.state === "suspended"
              ? '<button class="btn btn-sm btn-pri" data-pvto="approved" ' +
                'data-pv="' + esc(p.id) + '">정지 풀기</button>'
              : '<button class="btn btn-sm btn-line" data-pvto="suspended" ' +
                'data-pv="' + esc(p.id) + '">정지하기</button>') +
            /* ⚠️ 정지된 업체에는 공개 단추를 **안 냅니다** — 눌러도 DB 가
               거절합니다 (절대 규칙 5). 먼저 정지를 풀어야 합니다. */
            (p.state === "suspended" ? '' :
              '<button class="btn btn-sm btn-line" data-pvlist="' + esc(p.id) + '" ' +
              'data-on="' + (p.listed ? "1" : "0") + '">' +
              (p.listed ? "비공개로" : "공개로") + '</button>' +
              '<button class="btn btn-sm btn-line" data-pvasg="' + esc(p.id) + '" ' +
              'data-on="' + (p.assignable ? "1" : "0") + '">' +
              (p.assignable ? "배정 끄기" : "배정 켜기") + '</button>') +
          '</div></li>';
      }).join("") + '</ul>';
  }

  /* ── 입점 신청 ──────────────────────────────────────────────────── */
  function apView(list){
    if(!list.length)
      return '<p class="myhint">아직 들어온 입점 신청이 없습니다.</p>';
    return '<ul class="fe-p">' + list.map(function(a){
      var s = apOf(a.state);
      return '<li><b>' + esc(a.company || "(상호 없음)") + '</b> ' +
        badge(s.name, s.tone) +
        '<p class="fe-r">' + esc(a.no || "") +
          (a.region ? " · " + esc(a.region) : "") +
          (a.brn ? " · 사업자 " + esc(a.brn) : "") + '</p>' +
        '<p class="fe-r">' + esc(a.name || "") +
          (a.tel ? " · " + esc(a.tel) : "") +
          (a.email ? " · " + esc(a.email) : "") + '</p>' +
        (a.services ? '<p class="fe-r">하려는 일 — ' + esc(a.services) + '</p>' : '') +
        (a.note ? '<p class="fe-r">' + esc(a.note) + '</p>' : '') +
        '<div class="dk-b">' +
          (a.state === "new"
            ? '<button class="btn btn-sm btn-line" data-apto="called" ' +
              'data-ap="' + esc(a.id) + '">연락했음</button>' : '') +
          (a.state !== "drop"
            ? '<button class="btn btn-sm btn-line" data-apto="drop" ' +
              'data-ap="' + esc(a.id) + '">진행 안 함</button>' : '') +
        '</div>' +
        /* ⚠️⚠️ **등록(done)을 단추 하나로 두지 않았습니다.** 등록하려면
           업체 줄을 먼저 만들어야 하는데(주소 · 하는 일 · 지역), 그
           양식이 아직 없습니다. 없는 것을 되는 것처럼 보이면 안 됩니다
           (절대 규칙 5) — 지금은 그 사실을 적습니다. */
        (a.state === "called"
          ? '<p class="dk-hint">⚠️ 업체로 등록하는 양식은 아직 없습니다 — ' +
            '지금은 담당자가 DB 에서 업체를 만든 뒤 이 신청을 ' +
            '<b>등록 완료</b>로 옮깁니다.</p>' : '') +
      '</li>';
    }).join("") + '</ul>';
  }

  function paint(){
    box.hidden = false; box.className = "deskbox";
    box.innerHTML = '<h2 class="adm-h">업체 심사 · 정지</h2>' +
      '<p class="lmsg">읽는 중입니다…</p>';
    load().then(function(got){
      var pvs = got[0], aps = got[1];
      /* ⚠️⚠️ 못 읽었으면 **0건이라고 말하지 않습니다.** */
      if(pvs === null || aps === null){
        box.innerHTML = '<h2 class="adm-h">업체 심사 · 정지</h2>' +
          '<p class="lmsg">읽지 못했습니다. ' +
          '<button class="btn btn-sm btn-line" data-do="again">다시 읽기</button></p>';
        return;
      }
      box.innerHTML = '<h2 class="adm-h">업체 심사 · 정지</h2>' + tabs() +
        '<div class="bz-body">' +
        (TAB === "pv" ? pvView(pvs) : apView(aps)) +
        '</div><p class="dk-m lmsg" hidden></p>';
    });
  }
  function say(t){
    var m = box.querySelector(".dk-m");
    if(m){ m.hidden = false; m.textContent = t; }
  }

  box.addEventListener("click", function(e){
    var t = e.target.closest ? e.target.closest("button[data-ptab]") : null;
    if(t){ TAB = t.getAttribute("data-ptab"); return paint(); }
    var ag = e.target.closest ? e.target.closest("button[data-do='again']") : null;
    if(ag) return paint();

    /* 상태 — ⚠️ 정지 · 거절에만 까닭을 받습니다 (DB 도 그렇습니다).
       푸는 데에도 까닭을 받으면 사람이 아무 글자나 적습니다. */
    var sb = e.target.closest ? e.target.closest("button[data-pvto]") : null;
    if(sb){
      var to = sb.getAttribute("data-pvto"), w = null;
      if(to === "suspended"){
        w = prompt("정지하시는 까닭을 적어 주세요 (기록에 남고, 업체도 볼 수 있습니다)");
        if(!(w && w.trim())) return;
        w = w.trim();
      }
      sb.disabled = true; say("바꾸는 중입니다…");
      rpc("set_provider_state", { p: { id: sb.getAttribute("data-pv"), to: to, why: w } })
        .then(paint).catch(function(err){ sb.disabled = false; say(why(err)); });
      return;
    }
    /* 공개 · 배정 — ⚠️ 둘 다 approve_provider 한 문입니다 */
    var lb = e.target.closest ? e.target.closest("button[data-pvlist]") : null;
    if(lb){
      var on = lb.getAttribute("data-on") === "1";
      var w2 = prompt((on ? "비공개로 돌리시는" : "공개로 켜시는") +
                      " 까닭을 적어 주세요 (기록에 남습니다)");
      if(!(w2 && w2.trim())) return;
      lb.disabled = true; say("바꾸는 중입니다…");
      rpc("approve_provider", { p_id: lb.getAttribute("data-pvlist"),
                                p_listed: !on, p_why: w2.trim() })
        .then(paint).catch(function(err){ lb.disabled = false; say(why(err)); });
      return;
    }
    var ab = e.target.closest ? e.target.closest("button[data-pvasg]") : null;
    if(ab){
      var on2 = ab.getAttribute("data-on") === "1";
      var w3 = prompt((on2 ? "배정을 끄시는" : "배정을 켜시는") +
                      " 까닭을 적어 주세요 (기록에 남습니다)");
      if(!(w3 && w3.trim())) return;
      ab.disabled = true; say("바꾸는 중입니다…");
      rpc("approve_provider", { p_id: ab.getAttribute("data-pvasg"),
                                p_assignable: !on2, p_why: w3.trim() })
        .then(paint).catch(function(err){ ab.disabled = false; say(why(err)); });
      return;
    }
    /* 입점 신청 */
    var pb = e.target.closest ? e.target.closest("button[data-apto]") : null;
    if(pb){
      var to2 = pb.getAttribute("data-apto");
      var w4 = prompt("까닭을 적어 주세요 (기록에 남습니다)");
      if(!(w4 && w4.trim())) return;
      pb.disabled = true; say("바꾸는 중입니다…");
      rpc("set_apply_state", { p_apply: pb.getAttribute("data-ap"),
                               p_to: to2, p_why: w4.trim() })
        .then(paint).catch(function(err){ pb.disabled = false; say(why(err)); });
      return;
    }
  });

  amAuthAsk().then(function(a){
    A = a;
    /* ⚠️ 운영자가 아니면 **한 줄도 안 그립니다** (/admin 의 다른 자리와
       같습니다). 왜 안 되는지도 적지 않습니다 — 권한 구조를 알려 주는
       글이 됩니다. */
    if(!a.on || !a.signedIn) return;
    if(a.role !== "admin" && a.role !== "staff") return;
    paint();
  });
})();
