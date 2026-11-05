/* ════════════════════════════════════════════════════════════════════
   내부 알림 — `/my` · `/desk` 에서 돕니다 (DB 는 0050)

   ⚠️⚠️⚠️ **밖으로 보내지 않습니다.** 문자 · 카톡 · 메일이 아니라
   **화면에서만** 알립니다. 보내기 시작하면 ① 정보통신망법 제50조
   ② 발송사가 수탁자가 되어 개인정보처리방침에 적어야 함(제26조)
   ③ 환경변수가 하나 늘고 비면 조용히 안 보내짐 — 셋이 같이 움직입니다.
   ⚠️ 그래서 화면에 "문자로 알려 드립니다" 같은 말을 **적지 않습니다**
   (절대 규칙 5 — 하지 않는 일을 했다고 말하지 않습니다).

   ⚠️⚠️ **알림에는 본문이 없습니다** (0050 에 칸이 아예 없습니다) —
   제목과 가는 자리까지입니다. 자세한 것은 가는 자리에서 그 사람의
   권한으로 봅니다. 담으면 손님이 적은 글이 한 벌 더 복사되고, 그
   안에 연락처가 들어 있으면 알림이 그것을 나르는 길이 됩니다.

   ⚠️ 0건이면 **아무것도 안 그립니다** (빈 상자를 두면 "알림이 있었는데
   안 보인다" 로 읽힙니다). 로그인 전에도 안 그립니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("noticebox");
  if(!box || !window.amAuthAsk) return;

  var esc = window.esc;
  var A = null;

  /* 갈래마다 아이콘 — ⚠️ **한 곳**입니다 (화면마다 적으면 어긋납니다).
     ⚠️⚠️ **있는 이름만 씁니다.** `window.icon()` 은 없는 이름을 주면
     빈 글자를 돌려주고 `console.warn` 만 냅니다 — 화면에는 **빈 칸**이
     되고 아무 검사도 안 잡습니다 (앞 서비스의 "빈 아이콘 자리").
     처음에 `doc` · `warn` 을 적었는데 둘 다 `js/components/base.js` 에
     **없는 이름**이었습니다. 있는 것만 골랐습니다.
     ⚠️ 모르는 갈래면 `info` 로 떨어집니다 (빈 칸을 두지 않습니다). */
  var IC = { quote:"coin", jobapply:"case", jobmoved:"case",
             joinapply:"people", joinmoved:"people",
             answer:"chat", hidden:"info" };

  function when(iso){
    var d = new Date(iso);
    if(isNaN(d.getTime())) return "";
    var now = new Date();
    var same = d.getFullYear() === now.getFullYear();
    return (same ? "" : d.getFullYear() + "년 ") +
      (d.getMonth() + 1) + "월 " + d.getDate() + "일";
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

  function paint(rows){
    /* ⚠️ 못 읽은 것(null)과 0건은 **다릅니다** — 못 읽었으면 숨긴 채로
       둡니다 (0건이라고 말하지 않습니다). */
    if(!rows || !rows.length){ box.hidden = true; box.innerHTML = ""; return; }
    var unread = rows.filter(function(n){ return !n.read_at; }).length;

    box.className = "nt";
    box.hidden = false;
    box.innerHTML = '<h2 class="nt-h">알림' +
      (unread ? ' <span class="nt-c">' + esc(String(unread)) + '</span>' : '') +
      '</h2>' +
      /* ⚠️⚠️ 지키지 못할 약속을 하지 않습니다 — 우리는 밖으로 안 보냅니다 */
      '<p class="nt-n">⚠️ 문자 · 카톡 · 메일로는 보내 드리지 않습니다. ' +
      '이 자리에서만 알려 드립니다.</p>' +
      '<ul class="nt-l">' + rows.map(function(n){
        return '<li class="nt-i' + (n.read_at ? '' : ' nt-new') + '">' +
          '<span class="nt-ic">' + window.icon(IC[n.kind] || "info", 18) + '</span>' +
          '<a class="nt-t" href="' + esc(n.link) + '">' + esc(n.title) + '</a>' +
          '<span class="nt-d">' + esc(when(n.created_at)) + '</span>' +
          (n.read_at
            ? ''
            : '<button type="button" class="btn btn-sm btn-line nt-r" data-nt="' +
              esc(n.id) + '">읽음</button>') +
        '</li>';
      }).join("") + '</ul>' +
      (unread
        ? '<button type="button" class="btn btn-line nt-all">모두 읽음으로</button>'
        : '') +
      '<p class="nt-m lmsg" hidden></p>';
  }

  function say(t){
    var m = box.querySelector(".nt-m");
    if(m){ m.hidden = false; m.textContent = t; }
  }

  function load(){
    /* ⚠️ 안 읽은 것을 먼저, 그 안에서 새것부터 — 읽은 것은 뒤에
       스물까지만 둡니다 (알림함이 아니라 **지금 볼 것**을 내는 자리). */
    return get("notice?select=id,kind,title,link,read_at,created_at" +
               "&order=read_at.asc,created_at.desc&limit=30")
      .then(function(rows){ paint(rows); return rows; });
  }

  box.addEventListener("click", function(e){
    var one = e.target.closest ? e.target.closest("button[data-nt]") : null;
    if(one){
      one.disabled = true; say("보내는 중입니다…");
      rpc("read_notice", { p: { id: one.getAttribute("data-nt") } })
        .then(load).catch(function(err){ one.disabled = false; say(why(err)); });
      return;
    }
    var all = e.target.closest ? e.target.closest(".nt-all") : null;
    if(all){
      all.disabled = true; say("보내는 중입니다…");
      rpc("read_notice", { p: { all: true } })
        .then(load).catch(function(err){ all.disabled = false; say(why(err)); });
      return;
    }
  });

  window.amAuthAsk().then(function(a){
    A = a;
    /* ⚠️ 로그인 전에는 **한 글자도** 안 그립니다 */
    if(!a || !a.on || !a.signedIn) return;
    load().catch(function(){ /* 못 읽었으면 숨긴 채로 둡니다 */ });
  }).catch(function(){});
})();
