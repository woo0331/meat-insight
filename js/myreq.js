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
      get("request_item?select=request_id,service_id&limit=500"),
      /* ⚠️ 일정은 RLS 가 **내 요청 것만** 내줍니다 (0034 의 appt_mine) */
      get("appointment?select=id,request_id,provider_id,at,kind,place,note,state,why" +
          "&order=at.asc&limit=100"),
      /* 제공 이력 (0039 · 3차 지시서 §5) — ⚠️ RLS 가 **내 요청 것만**
         내줍니다 (0005 의 assign_requester). 철회한 것도 옵니다:
         **넘어간 적이 있다는 사실**을 손님이 볼 수 있어야 합니다. */
      get("assignment?select=id,request_id,provider_id,state,agree3rd_at," +
          "revoked_at,revoked_why,created_at&order=created_at.asc&limit=200")
    ]).then(function(got){
      /* ⚠️ 올리신 파일 (§5-4) — 손님은 **자기 요청의 것만** 봅니다
         (0011 의 photo_mine). */
      var rs = got[0];
      if(!rs || !window.amPhotoRows) return got.concat([{}]);
      return window.amPhotoRows(A.conf, rs.map(function(r){ return r.id; }))
        .then(function(by){ return got.concat([by]); });
    }).then(function(got){
      /* 내가 쓴 후기 (0037) — ⚠️⚠️ **주소에서 내 요청으로 좁힙니다.**
         0037 의 정책은 표를 쓴 사람 · 그 업체 · 운영자에게만 열지만,
         자물쇠를 **두 자리에** 둡니다 (정책이 내려가는 날 이 줄이
         남습니다).
         ⚠️ 가려진 것도 옵니다 (rv_mine) — 손님은 자기 글이 가려진 것을
         알 권리가 있습니다. */
      var rs = got[0];
      if(!rs || !rs.length) return got.concat([[]]);
      return get("review?select=id,request_id,provider_id,rating,body," +
                 "created_at,updated_at,reply,reply_at,hidden_at,hidden_why" +
                 "&request_id=in.(" +
                 rs.map(function(r){ return encodeURIComponent(r.id); }).join(",") +
                 ")&limit=200")
        .then(function(rv){ return got.concat([rv || []]); });
    });
  }

  /* 업체 상호 — ⚠️⚠️ **묶음 읽기(embed)를 쓰지 않습니다.**
     `provider:provider_id(name)` 처럼 한 번에 꺼내면 편하지만, 그 꼴은
     PostgREST 판에 따라 받는 법이 다릅니다. 여기서 틀리면 견적이
     통째로 "읽지 못했습니다" 가 되고, 그걸 눌러 볼 자리가 없습니다.
     ⚠️ 받는 줄은 0031 이 열어 둔 것뿐입니다 — **나에게 배정된 업체**와
     공개 목록에 있는 업체입니다 (아는 상호만 옵니다). */
  /* ⚠️ 견적 · 일정 · 후기 **셋 다** 업체 상호가 필요합니다 (후기를
     쓰는 자리에 "어느 업체" 를 적어야 하니까요) — 한 벌로 모읍니다. */
  function names(){
    var ids = [], seen = {};
    [].slice.call(arguments).forEach(function(L){
      (L || []).forEach(function(q){
        if(q.provider_id && !seen[q.provider_id]){
          seen[q.provider_id] = 1; ids.push(q.provider_id);
        }
      });
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

  /* ── 후기 (0037) ─────────────────────────────────────────────────
     ⚠️⚠️ **조건이 맞을 때만 양식을 냅니다.** 눌러도 DB 가 거절하는
     단추를 미리 만들지 않습니다 (절대 규칙 5) — 조건은 amRvCanWrite()
     한 함수가 봅니다 (js/review.js).
     ⚠️ 가려진 후기는 **고칠 수 없습니다** (0037) — 그러니 양식을 안
     내고, 가려졌다는 것과 까닭만 적습니다. */
  function reviewBlock(r, qs, appts, revs, pnames){
    var ids = [], seen = {};
    [].concat(qs || [], appts || []).forEach(function(x){
      if(x.provider_id && !seen[x.provider_id] &&
         window.amRvCanWrite(x.provider_id, qs, appts)){
        seen[x.provider_id] = 1; ids.push(x.provider_id);
      }
    });
    if(!ids.length) return "";
    return '<h3 class="rv-h">후기</h3>' +
      '<p class="dk-hint">겪으신 그대로 적어 주세요. ' +
      '<b>이 업체 화면에 공개</b>되고, 성함은 성 한 글자만 보입니다.</p>' +
      ids.map(function(pid){
        var pname = pnames[pid] || null;
        var mine = (revs || []).filter(function(v){
          return v.request_id === r.id && v.provider_id === pid;
        })[0] || null;
        var h = '<div class="rv-one">';
        if(mine){
          h += window.amRvRow(mine, { who:"내 후기", pname: pname, hidden:true });
          if(mine.hidden_at)
            h += '<p class="dk-hint">운영자가 가린 후기입니다 — ' +
                 '고객센터로 문의해 주세요.</p>';
          else
            h += window.amRvForm(r.id, pid, pname, mine);
        }else{
          h += window.amRvForm(r.id, pid, pname, null);
        }
        return h + '</div>';
      }).join("");
  }

  /* ── 제공 이력 · 철회 (0039 · 3차 지시서 §5) ─────────────────────
     ⚠️⚠️ **넘어간 적이 있다는 사실을 지우지 않습니다.** 철회해도 줄은
     남고 "철회함" 이라고 적습니다 — 지우면 손님이 "준 적 없다" 로
     읽게 되고, 그건 사실이 아닙니다 (개인정보 보호법 제35조 열람권).
     ⚠️ 철회하면 그 업체는 성함 · 연락처 · 요청 내용 · 사진을 더는 못
     봅니다. 화면이 그 말을 **그대로** 적습니다 — 지킬 수 있는 말입니다. */
  function giveBlock(r, asgs, pnames){
    if(!asgs || !asgs.length) return "";
    return '<h3 class="rv-h">연락처를 전달한 업체 ' + won(asgs.length) + '곳</h3>' +
      '<p class="dk-hint">전달에 동의하신 업체입니다. ' +
      '<b>철회하시면</b> 그 업체는 성함 · 연락처 · 요청 내용 · 올리신 사진을 ' +
      '더는 보지 못하고, 새 견적도 내지 못합니다.</p>' +
      '<div class="gv">' + asgs.map(function(a){
        var pn = pnames[a.provider_id] || null;
        var off = !!a.revoked_at;
        return '<div class="gv-r' + (off ? " gv-off" : "") + '">' +
          '<div class="gv-h">' +
            (pn ? '<b>' + esc(pn) + '</b>'
                : '<b class="rq-q-no">업체 상호를 읽지 못했습니다</b>') +
            (off ? badge("철회함", "bad") : badge("전달됨", "ok")) +
          '</div>' +
          '<p class="gv-d">' + esc(window.amDay(a.agree3rd_at || a.created_at)) +
            ' 전달' + (off ? ' · ' + esc(window.amDay(a.revoked_at)) + ' 철회' : '') +
          '</p>' +
          (off && a.revoked_why
            ? '<p class="gv-d">까닭 — ' + esc(a.revoked_why) + '</p>'
            : '') +
          /* ⚠️ 이미 철회한 것에는 단추를 안 냅니다 (절대 규칙 5) */
          (off ? ''
               : '<div class="dk-b"><button class="btn btn-sm btn-line" ' +
                 'data-revoke="' + esc(a.id) + '">이 업체로의 전달 철회하기</button></div>') +
        '</div>';
      }).join("") + '</div>';
  }

  function card(r, quotes, items, pics, appts, revs, pnames, asgs){
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

    /* 잡힌 일정 (2차 지시서 §7) — ⚠️ 0건이면 아무것도 안 그립니다 */
    (appts || []).forEach(function(ap){
      var ast = window.amApptSt(ap.state) || { name:ap.state, tone:"ink" };
      h += '<div class="ap"><div class="ap-h">' + icon("cal", 15) +
           '<b>' + esc(window.amWhen(ap.at)) + '</b>' +
           badge(window.amApptKindName(ap.kind), "ink") +
           badge(ast.name, ast.tone) + '</div>';
      if(ap.place) h += '<p class="ap-d">' + esc(ap.place) + '</p>';
      if(ap.note)  h += '<p class="ap-d">' + esc(ap.note) + '</p>';
      if(ap.state === "cancel" && ap.why)
        h += '<p class="ap-d">취소 — ' + esc(ap.why) + '</p>';
      /* ⚠️⚠️ **손님도 취소할 수 있습니다** — 못 가게 된 것을 말할 길이
         없으면 업체가 헛걸음합니다. ⚠️ "만났음" 은 업체만 적습니다. */
      if(ap.state === "set")
        h += '<div class="dk-b"><button class="btn btn-sm btn-line" ' +
             'data-apcancel="' + esc(ap.id) + '">못 가게 되었습니다</button></div>';
      h += '</div>';
    });

    /* ⚠️ 올리신 파일 — 0장이면 아무것도 안 그립니다 */
    if(window.amPhotoBlock) h += window.amPhotoBlock(pics);

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
    h += giveBlock(r, asgs, pnames || {});
    h += reviewBlock(r, qs, appts, revs, pnames || {});
    /* ⚠️⚠️ **계약 뒤에는 취소 단추를 안 냅니다** — 눌러도 DB 가
       거절합니다 (절대 규칙 5). 그때는 어디로 가야 하는지 적습니다. */
    if(["signed","done","fee_wait","fee_done","lost"].indexOf(r.state) < 0)
      h += '<div class="dk-b"><button class="btn btn-sm btn-line" ' +
           'data-cancel="' + esc(r.id) + '">이 요청 취소하기</button></div>';
    else if(r.state !== "lost")
      h += '<p class="dk-hint">이미 진행 중인 건이라 혼자 취소하실 수 없습니다 — ' +
           '고객센터로 알려 주세요.</p>';
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
      var rs = got[0], qs = got[1], items = got[2], appts = got[3],
          asgs = got[4], pics = got[5], revs = got[6];
      if(rs === null || qs === null || items === null || appts === null ||
         asgs === null){
        box.innerHTML = '<h2 class="adm-h">내 요청</h2>' +
          '<p class="lmsg">읽지 못했습니다. ' +
          '<button class="btn btn-sm btn-line" data-do="again">다시 읽기</button></p>';
        return;
      }
      /* ⚠️ 상호를 받은 **뒤에** 그립니다 — 먼저 그리고 나중에 채우면
         업체 이름이 한 번 깜빡이고 바뀝니다. */
      return names(qs, appts, revs, asgs).then(function(by){
        qs.forEach(function(q){ q.pname = by[q.provider_id] || null; });
        box.innerHTML = '<h2 class="adm-h">내 요청' +
          (rs.length ? " " + won(rs.length) + "건" : "") + '</h2>' +
          (rs.length
            ? rs.map(function(r){
                return card(r, qs, items, (pics || {})[r.id],
                            appts.filter(function(x){ return x.request_id === r.id; }),
                            revs, by,
                            asgs.filter(function(x){ return x.request_id === r.id; }));
              }).join("")
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
    /* ⚠️ 사진은 **누르셨을 때** 주소를 청합니다 (10분짜리) */
    var ph = e.target.closest ? e.target.closest("button[data-photo]") : null;
    if(ph){
      var row0 = ph.closest(".dk-r"), pm = row0 ? row0.querySelector(".dk-m") : null;
      ph.disabled = true;
      if(pm){ pm.hidden = false; pm.textContent = "여는 중입니다…"; }
      window.amPhotoOpen(ph.getAttribute("data-photo")).then(function(url){
        ph.disabled = false;
        if(pm) pm.hidden = true;
        window.open(url, "_blank", "noopener");
      }).catch(function(err){
        ph.disabled = false;
        if(pm) pm.textContent = why(err);
      });
      return;
    }
    var ac = e.target.closest ? e.target.closest("button[data-apcancel]") : null;
    if(ac){
      var r2 = ac.closest(".dk-r"), m2 = r2 ? r2.querySelector(".dk-m") : null;
      /* ⚠️ 취소에는 까닭을 받습니다 — 업체가 알아야 합니다 (DB 도 봅니다) */
      var w2 = prompt("못 가게 되신 까닭을 적어 주세요 (업체가 봅니다)");
      if(!(w2 && w2.trim())) return;
      ac.disabled = true;
      if(m2){ m2.hidden = false; m2.textContent = "보내는 중입니다…"; }
      rpc("move_appointment", { p: { id: ac.getAttribute("data-apcancel"),
                                     to: "cancel", why: w2.trim() } })
        .then(paint)
        .catch(function(err){
          ac.disabled = false;
          if(m2) m2.textContent = why(err);
        });
      return;
    }
    /* 제공 철회 (0039) — ⚠️ 까닭을 받습니다 (DB 도 받습니다) */
    var rvk = e.target.closest ? e.target.closest("button[data-revoke]") : null;
    if(rvk){
      var r3 = rvk.closest(".dk-r"), m3 = r3 ? r3.querySelector(".dk-m") : null;
      if(!confirm("이 업체로의 연락처 전달을 철회하시겠습니까? " +
                  "철회하면 그 업체는 성함 · 연락처 · 요청 내용 · 사진을 더는 보지 못합니다."))
        return;
      var w3 = prompt("철회하시는 까닭을 적어 주세요 (업체가 왜 끊겼는지 알아야 합니다)");
      if(!(w3 && w3.trim())) return;
      rvk.disabled = true;
      if(m3){ m3.hidden = false; m3.textContent = "보내는 중입니다…"; }
      rpc("revoke_third_party", { p: { assignment: rvk.getAttribute("data-revoke"),
                                       why: w3.trim() } })
        .then(paint)
        .catch(function(err){ rvk.disabled = false; if(m3) m3.textContent = why(err); });
      return;
    }
    /* 요청 취소 (0039) */
    var cxb = e.target.closest ? e.target.closest("button[data-cancel]") : null;
    if(cxb){
      var r4 = cxb.closest(".dk-r"), m4 = r4 ? r4.querySelector(".dk-m") : null;
      if(!confirm("이 요청을 취소하시겠습니까? " +
                  "취소하시면 전달된 업체들에게도 전달이 모두 철회됩니다."))
        return;
      var w4 = prompt("취소하시는 까닭을 적어 주세요");
      if(!(w4 && w4.trim())) return;
      cxb.disabled = true;
      if(m4){ m4.hidden = false; m4.textContent = "보내는 중입니다…"; }
      rpc("cancel_request", { p: { request: cxb.getAttribute("data-cancel"),
                                   why: w4.trim() } })
        .then(paint)
        .catch(function(err){ cxb.disabled = false; if(m4) m4.textContent = why(err); });
      return;
    }
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
    /* 후기 (0037) — ⚠️ 보내는 꾸러미는 js/review.js 가 짓습니다
       (화면마다 짜면 칸 이름 하나가 어긋나도 열리기는 합니다). */
    var rf = e.target.closest ? e.target.closest("form.rvform") : null;
    if(rf){
      e.preventDefault();
      var rm = rf.querySelector(".rvmsg");
      var rb = rf.querySelector('button[type="submit"]');
      rb.disabled = true;
      if(rm){ rm.hidden = false; rm.textContent = "올리는 중입니다…"; }
      window.amRvSend(rpc, rf)
        .then(paint)
        .catch(function(err){
          rb.disabled = false;
          if(rm){ rm.hidden = false; rm.textContent = why(err); }
        });
      return;
    }
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
