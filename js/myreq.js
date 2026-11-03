/* ════════════════════════════════════════════════════════════════════
   내 요청과 **받은 견적** — /my 의 한 자리 (2차 지시서 §6)

   ⚠️⚠️ **업체를 나란히 놓는 화면(/search)과 다른 화면입니다.** 여기
   나란히 놓는 것은 **제출된 견적**입니다 — 금액 · 포함 범위 · 기간 ·
   A/S. 0008 머리말이 그 둘을 헷갈려 "이미 있다" 로 읽힌 자리를 적어
   두었습니다.

   ⚠️⚠️ **견적을 줄 세우지 않습니다.** 싼 것을 위로 올리면 그게 플랫폼의
   추천이 되고, 우리는 품질을 재 본 적이 없습니다 (절대 규칙 1).
   **낸 차례대로** 놓고, 견주실 칸을 같이 보여 드립니다.

   ⚠️ 로그인 전에 넣은 요청은 **번호와 연락처로** 가져옵니다
   (`claim_request` · 0005). 번호만으로는 열지 않습니다 — 번호를 손에
   넣은 사람이 남의 성함 · 연락처를 다 보게 됩니다.

   ⚠️ 거둔 견적은 아예 안 옵니다 (0008 의 quote_requester 정책) —
   업체가 거둔 금액을 보여 드리면 하지 않은 약속을 기대하게 됩니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("reqbox");
  if(!box || !window.amAuthAsk) return;

  var A = null;

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
      /* ⚠️ RLS 가 **내 요청만** 내줍니다 (request_mine) — 여기서 또
         좁히지 않습니다. 사용자 id 를 화면이 들고 있으면 그것을 고쳐
         남의 것을 부르려는 시도가 생깁니다. */
      get("request?select=id,no,state,cat,region,gu,want_at,created_at" +
          "&order=created_at.desc&limit=30"),
      get("quote?select=id,request_id,provider_id,amount,vat,scope,excludes,days," +
          "start_on,warranty,valid_to,note,state,created_at" +
          "&order=created_at.asc&limit=200"),
      get("request_item?select=request_id,service_id&limit=500")
    ]);
  }

  /* 업체 상호 — ⚠️⚠️ **묶음 읽기(embed)를 쓰지 않습니다.**
     `provider:provider_id(name)` 처럼 한 번에 꺼내면 편하지만, 그 꼴은
     PostgREST 판에 따라 받는 법이 다릅니다. 여기서 틀리면 견적이
     통째로 "읽지 못했습니다" 가 되고, 그걸 눌러 볼 자리가 없습니다.
     ⚠️ 받는 줄은 0031 이 열어 둔 것뿐입니다 — **나에게 배정된 업체**와
     공개 목록에 있는 업체입니다 (아는 상호만 옵니다). */
  function names(qs){
    var ids = [], seen = {};
    qs.forEach(function(q){
      if(q.provider_id && !seen[q.provider_id]){ seen[q.provider_id] = 1; ids.push(q.provider_id); }
    });
    if(!ids.length) return Promise.resolve({});
    return get("provider?select=id,name&id=in.(" +
               ids.map(encodeURIComponent).join(",") + ")&limit=50")
      .then(function(rows){
        var by = {};
        /* ⚠️ 못 읽었으면 **빈 짝**을 돌려줍니다 — 화면이 "상호를 읽지
           못했습니다" 라고 말합니다 (조용히 빈 칸으로 두지 않습니다). */
        (rows || []).forEach(function(p){ by[p.id] = p.name; });
        return by;
      });
  }

  function badge(name, tone){
    return '<span class="dk-st dk-' + esc(tone) + '">' + esc(name) + '</span>';
  }

  /* 진행 막대 — ⚠️ 차례가 아닌 상태(보류 · 진행 안 함)는 **안 그립니다**
     (js/data/deal.js 의 amDealStep 이 null 을 돌려줍니다). */
  function steps(state){
    var n = window.amDealStep(state);
    if(n === null) return "";
    return '<div class="rq-bar" role="img" aria-label="' +
      esc(n + "단계 / 전체 " + window.AM_DEAL_STEPS + "단계") + '">' +
      '<i style="width:' + Math.round(n / window.AM_DEAL_STEPS * 100) + '%"></i></div>';
  }

  function quoteCard(q, chosenSome){
    var st = window.amQuoteSt(q.state) || { name:q.state, tone:"ink" };
    /* ⚠️⚠️ RLS 가 업체 줄을 안 열어 주면 상호가 비어 옵니다 —
       **"(미기재)" 를 찍지 않고** 그 사실을 말합니다 (0031 이 그
       자리를 고쳤지만, 정책이 내려가는 날 조용히 빈 칸이 되지 않게). */
    var pname = q.pname || null;
    var h = '<div class="rq-q' + (q.state === "chosen" ? " rq-q-on" : "") + '">' +
      '<div class="rq-qh">' +
      (pname ? '<b>' + esc(pname) + '</b>'
             : '<b class="rq-q-no">업체 상호를 읽지 못했습니다</b>') +
      badge(st.name, st.tone) + '</div>' +
      '<p class="rq-amt">' + esc(window.amQuoteAmount(q) || "") + '</p>' +
      '<dl class="dk-d">' +
      '<dt>포함</dt><dd>' + esc(q.scope) + '</dd>' +
      (q.excludes ? '<dt>별도</dt><dd>' + esc(q.excludes) + '</dd>' : "") +
      (q.days ? '<dt>예상 기간</dt><dd>' + esc(won(q.days) + "일") + '</dd>' : "") +
      (q.start_on ? '<dt>시작 가능</dt><dd>' + esc(q.start_on) + '</dd>' : "") +
      (q.warranty ? '<dt>A/S · 보증</dt><dd>' + esc(q.warranty) + '</dd>' : "") +
      (q.valid_to ? '<dt>유효 기한</dt><dd>' + esc(q.valid_to) + '</dd>' : "") +
      (q.note ? '<dt>업체 말씀</dt><dd>' + esc(q.note) + '</dd>' : "") +
      '</dl>';
    /* ⚠️ 이미 고르신 뒤에는 고르는 단추를 안 냅니다 — 눌러도 DB 가
       같은 값을 돌려주고 아무 일도 안 납니다 (절대 규칙 5). */
    if(q.state === "open" && !chosenSome)
      h += '<div class="dk-b"><button class="btn btn-sm btn-pt" data-pick="' +
           esc(q.provider_id) + '">이 견적으로 하겠습니다</button></div>';
    if(q.state === "chosen")
      h += '<p class="dk-hint">이 견적으로 고르셨습니다. 업체가 연락드립니다 — ' +
           '조건을 더 맞추실 일이 있으면 업체와 이야기하신 뒤 담당자에게 알려 주세요.</p>';
    return h + '</div>';
  }

  function card(r, quotes, items){
    var st = window.amDealSt(r.state) || { name:r.state, tone:"ink" };
    var svcs = items.filter(function(x){ return x.request_id === r.id; })
      .map(function(x){
        var f = window.amSub ? amSub(x.service_id) : null;
        return f ? (f.cat.name + " · " + f.item.name) : x.service_id;
      });
    var qs = quotes.filter(function(q){ return q.request_id === r.id; });
    var chosenSome = qs.some(function(q){ return q.state === "chosen"; });

    var h = '<div class="dk-r" data-req="' + esc(r.id) + '">';
    h += '<div class="dk-h"><b>' + esc(r.no) + '</b>' + badge(st.name, st.tone) + '</div>';
    h += steps(r.state);
    h += '<dl class="dk-d">';
    if(svcs.length) h += '<dt>요청</dt><dd>' + esc(svcs.join(" / ")) + '</dd>';
    if(r.region)    h += '<dt>지역</dt><dd>' + esc(r.region + (r.gu ? " " + r.gu : "")) + '</dd>';
    if(r.want_at)   h += '<dt>희망 일정</dt><dd>' + esc(r.want_at) + '</dd>';
    h += '</dl>';

    if(qs.length){
      h += '<h3 class="rq-h">받은 견적 ' + won(qs.length) + '건</h3>' +
        '<p class="dk-hint">낸 차례대로 놓았습니다. ' +
        '<b>싼 순서가 아닙니다</b> — 포함되는 것이 다르면 금액만으로는 견줄 수 없습니다.</p>' +
        '<div class="rq-qs">' + qs.map(function(q){
          return quoteCard(q, chosenSome);
        }).join("") + '</div>';
    }else{
      /* ⚠️⚠️ **지킬 수 없는 약속을 하지 않습니다.** 몇 시간 안에 온다고
         적지 않습니다 — 지금 상태에서 실제로 무엇을 기다리는지만. */
      h += '<p class="dk-hint">' + esc(
        r.state === "new"      ? "접수되었습니다. 운영자가 요청하신 조건을 확인하고 있습니다."
        : r.state === "check"  ? "조건에 맞는 업체를 찾고 있습니다. 업체가 정해지면 상호를 알려 드리고 연락처 전달 동의를 다시 여쭙니다."
        : r.state === "assigned" ? "업체에 전달했습니다. 업체가 수락하면 상담이 시작됩니다."
        : r.state === "accepted" ? "업체가 수락했습니다. 곧 상담이 시작됩니다."
        : r.state === "consult"  ? "상담 중입니다. 업체가 견적을 내면 여기에 뜹니다."
        : "아직 받은 견적이 없습니다.") + '</p>';
    }
    h += '<p class="dk-m lmsg" hidden></p></div>';
    return h;
  }

  /* 번호와 연락처로 가져오는 자리 — ⚠️ 늘 냅니다 (요청이 0건이어도,
     있어도). 로그인 전에 넣은 것이 더 있을 수 있습니다. */
  function claimForm(){
    return '<form id="cf" class="jform rq-c">' +
      '<div class="jrow">' +
        '<label for="c-no">요청번호</label>' +
        '<input id="c-no" name="no" required maxlength="20" placeholder="SW-0000-0000">' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="c-tel">그때 적으신 연락처</label>' +
        '<input id="c-tel" name="tel" required inputmode="tel" placeholder="010-0000-0000">' +
      '</div>' +
      '<button class="btn btn-line" type="submit">내 요청으로 가져오기</button>' +
      '<p id="cmsg" class="lmsg" hidden></p>' +
    '</form>';
  }

  function paint(){
    box.hidden = false; box.className = "deskbox";
    box.innerHTML = '<h2 class="adm-h">내 요청</h2><p class="lmsg">읽는 중입니다…</p>';
    load().then(function(got){
      var rs = got[0], qs = got[1], items = got[2];
      if(rs === null || qs === null || items === null){
        box.innerHTML = '<h2 class="adm-h">내 요청</h2>' +
          '<p class="lmsg">읽지 못했습니다. ' +
          '<button class="btn btn-sm btn-line" data-do="again">다시 읽기</button></p>';
        return;
      }
      /* ⚠️ 상호를 받은 **뒤에** 그립니다 — 먼저 그리고 나중에 채우면
         업체 이름이 한 번 깜빡이고 바뀝니다. */
      return names(qs).then(function(by){
        qs.forEach(function(q){ q.pname = by[q.provider_id] || null; });
        box.innerHTML = '<h2 class="adm-h">내 요청' +
          (rs.length ? " " + won(rs.length) + "건" : "") + '</h2>' +
          (rs.length
            ? rs.map(function(r){ return card(r, qs, items); }).join("")
            : '<p class="myhint">아직 넣으신 요청이 없습니다. ' +
              '로그인 전에 넣으신 것이 있으면 아래에서 가져오실 수 있습니다.</p>') +
          '<h3 class="rq-h">로그인 전에 넣은 요청 가져오기</h3>' +
          '<p class="dk-hint">요청번호와 <b>그때 적으신 연락처</b>가 둘 다 맞아야 열립니다.</p>' +
          claimForm();
      });
    });
  }

  box.addEventListener("click", function(e){
    var again = e.target.closest ? e.target.closest("button[data-do='again']") : null;
    if(again) return paint();
    var b = e.target.closest ? e.target.closest("button[data-pick]") : null;
    if(!b) return;
    var row = b.closest(".dk-r"), m = row ? row.querySelector(".dk-m") : null;
    var rid = row ? row.getAttribute("data-req") : null;
    if(!rid) return;
    if(!confirm("이 업체의 견적으로 진행하시겠습니까? 고르신 뒤에는 바꾸시려면 " +
                "담당자에게 알려 주셔야 합니다.")) return;
    b.disabled = true;
    if(m){ m.hidden = false; m.textContent = "보내는 중입니다…"; }
    rpc("choose_quote", { p_request: rid, p_provider: b.getAttribute("data-pick") })
      .then(paint)
      .catch(function(err){
        b.disabled = false;
        if(m) m.textContent = why(err);
      });
  });

  box.addEventListener("submit", function(e){
    var f = e.target.closest ? e.target.closest("#cf") : null;
    if(!f) return;
    e.preventDefault();
    var m = document.getElementById("cmsg");
    var btn = f.querySelector('button[type="submit"]');
    btn.disabled = true;
    m.hidden = false; m.textContent = "찾는 중입니다…";
    rpc("claim_request", { p_no: f.no.value, p_tel: f.tel.value })
      .then(function(){ paint(); })
      .catch(function(err){
        btn.disabled = false;
        /* ⚠️ DB 가 **한 가지 말로만** 거절합니다 (번호가 없는 것과
           연락처가 다른 것을 갈라 주면 번호를 긁을 수 있습니다). */
        m.textContent = why(err);
      });
  });

  amAuthAsk().then(function(a){
    A = a;
    /* ⚠️ /my 의 윗자리가 이미 안내합니다 — 같은 말을 두 번 하지
       않습니다 (로그인 전 · 설정 전에는 아무것도 그리지 않습니다). */
    if(!a.on || !a.signedIn) return;
    paint();
  });
})();
