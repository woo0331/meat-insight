/* ════════════════════════════════════════════════════════════════════
   업체 작업실 — /desk  (2차 지시서 §7)

   업체가 **배정받은 요청을 보고 · 수락하고 · 견적을 내는** 자리입니다.

   ⚠️⚠️ **여기서 상태를 직접 쓰지 않습니다.** 문은 DB 에 넷뿐입니다 —
     answer_assignment  수락 · 거절            (0004)
     move_state         상담 시작              (0004 · 길 표를 봅니다)
     submit_quote       견적 내기 · 고치기      (0008)
     withdraw_quote     견적 거두기            (0008)
   화면은 **단추를 누르고, DB 가 거절한 말을 그대로** 보여 줍니다.
   화면이 제 길 표를 들고 있으면 "단추는 있는데 DB 가 거절하는" 자리가
   생깁니다 (같은 규칙을 두 곳에 적는 자리).

   ⚠️⚠️ **연락처는 수락한 뒤에 보여 줍니다.** 배정하는 순간 손님의
   제3자 제공 동의를 받았으니(제17조) 법으로는 전달해도 되지만, 거절할
   업체에까지 성함 · 번호를 띄울 까닭이 없습니다. RLS 는 배정된 줄을
   통째로 열어 주므로 **이 가림은 화면 쪽 규칙**입니다 — 그래서
   `tools/test-desk.js` 가 그것까지 잽니다.

   ⚠️⚠️ **눌러도 아무 일이 안 나는 단추를 그리지 않습니다** (절대 규칙 5).
   상태마다 **그때 실제로 되는 것만** 냅니다.

   ⚠️ 손님이 적은 글은 전부 esc() 를 지납니다 (절대 규칙 4).
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("deskbox");
  if(!box || !window.amAuthAsk) return;

  var A = null;          /* 지금 세션 */
  var PV = null;         /* 내 업체 id */
  var OPEN = {};         /* 어느 요청의 견적 양식을 펼쳤나 */
  var APOPEN = {};       /* 어느 요청의 일정 양식을 펼쳤나 */
  var APPT = {};         /* 요청별 지금 일정 (단추가 id 를 알아야 합니다) */

  /* ⚠️ 만들어 놓고 안 쓰는 함수를 두지 않습니다 — 네 번 겪은 자리입니다
     (부르는 자리를 세어 보세요). */
  function say(html, cls){
    box.hidden = false; box.className = cls || "none"; box.innerHTML = html;
  }

  /* ⚠️ DB 가 돌려준 거절 글을 그대로 씁니다 — 자물쇠마다 다른 말로
     거절하게 두었습니다. 손님(업체)이 무엇이 막혔는지 알아야 합니다. */
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

  /* ⚠️⚠️ **못 읽은 것과 0건을 갈라서 돌려줍니다.** 못 읽었는데 빈
     배열로 돌려주면 배정이 **사라진 것처럼** 보입니다 (0 을 기다리는
     자리에 `||` 를 쓰지 않는 것과 같은 까닭입니다). */
  function get(q){
    return fetch(A.conf.url + "/rest/v1/" + q, {
      headers: Object.assign({ apikey: A.conf.anonKey }, window.amAuthHeaders())
    }).then(function(r){
      if(!r.ok) return null;
      return r.json().catch(function(){ return null; });
    }).catch(function(){ return null; });
  }

  /* ── 자료 ───────────────────────────────────────────────────── */
  function load(){
    /* ⚠️⚠️ **묶음 읽기(embed)를 쓰지 않습니다.** `request:request_id(...)`
       처럼 한 번에 꺼내면 편하지만, 그 꼴은 PostgREST 판에 따라 받는
       법이 다릅니다 — 여기서는 눌러 볼 수가 없고, 틀리면 **첫 손님이
       들어온 날** 화면이 통째로 "읽지 못했습니다" 가 됩니다
       (`tools/pull-providers.js` 가 그렇게 한 번도 못 돌았습니다).
       ⚠️ 대신 **RLS 가 이미 좁혀 줍니다** — 업체에게 보이는 `request` 는
       자기에게 배정된 것뿐입니다 (0001 의 request_assigned). 그래서
       따로 걸러 달라고 할 것이 없고, 화면이 request_id 로 맞춰 봅니다. */
    return Promise.all([
      get("assignment?select=id,state,created_at,agree3rd_at,request_id" +
          "&provider_id=eq." + encodeURIComponent(PV) +
          "&order=created_at.desc&limit=50"),
      get("quote?select=id,request_id,amount,vat,scope,excludes,days,start_on," +
          "warranty,valid_to,note,state,updated_at&provider_id=eq." +
          encodeURIComponent(PV) + "&limit=200"),
      get("request_item?select=request_id,service_id,state&limit=500"),
      get("request?select=id,no,state,cat,region,gu,budget_min,budget_max," +
          "want_at,body,name,tel,email,created_at&limit=50"),
      /* ⚠️ 일정은 RLS 가 **내 업체 것만** 내줍니다 (0034 의 appt_provider) */
      get("appointment?select=id,request_id,at,kind,place,note,state,why" +
          "&provider_id=eq." + encodeURIComponent(PV) + "&limit=200"),
      /* 받은 후기 (0037) — ⚠️ RLS 가 **우리 업체 것만** 내줍니다
         (rv_provider). 가려진 것도 옵니다: 가려졌다는 것과 까닭을
         업체가 알아야 다툴 수 있습니다.
         ⚠️⚠️ **작성자 성함이 이 줄에 없습니다** — 표에 있는 by_user 는
         청하지 않습니다 (청해도 쓸 데가 없고, 쓸 데가 생기면 제3자
         제공입니다). 화면은 "손님" 으로 적습니다. */
      get("review?select=id,request_id,rating,body,created_at,updated_at," +
          "reply,reply_at,hidden_at,hidden_why&provider_id=eq." +
          encodeURIComponent(PV) + "&order=created_at.desc&limit=200")
    ]).then(function(got){
      /* ⚠️ 사진은 **요청을 읽은 뒤**에 묻습니다 (어느 요청인지 알아야
         하니까요). ⚠️⚠️ 목록은 RLS 가 좁힙니다 — 업체는 배정된 건의
         사진만 봅니다 (0011 의 photo_provider · 제17조). */
      var reqs = got[3];
      if(!reqs || !window.amPhotoRows) return got.concat([{}]);
      return window.amPhotoRows(A.conf,
        reqs.map(function(r){ return r.id; })).then(function(by){
          return got.concat([by]);
        });
    });
  }

  /* ── 한 장 그리기 ───────────────────────────────────────────── */
  function badge(name, tone){
    return '<span class="dk-st dk-' + esc(tone) + '">' + esc(name) + '</span>';
  }

  function money(r){
    /* ⚠️ 0 은 값입니다 (무료 상담) — 안 적은 것과 갈라 봅니다. */
    var lo = (r.budget_min === null || r.budget_min === undefined) ? null : Number(r.budget_min);
    var hi = (r.budget_max === null || r.budget_max === undefined) ? null : Number(r.budget_max);
    if(lo === null && hi === null) return null;
    if(lo !== null && hi !== null) return won(lo) + "원 ~ " + won(hi) + "원";
    if(lo !== null) return won(lo) + "원 이상";
    return won(hi) + "원 이하";
  }

  function svcNames(items, rid){
    return items.filter(function(x){ return x.request_id === rid; })
      .map(function(x){
        var f = window.amSub ? amSub(x.service_id) : null;
        /* ⚠️ 모르는 키는 키 그대로 — 조용히 빠지면 어긋난 것을
           아무도 모릅니다. */
        return f ? (f.cat.name + " · " + f.item.name) : x.service_id;
      });
  }

  /* 견적 양식 — ⚠️ 고르는 말(부가세)은 js/data/deal.js 에서 꺼냅니다 */
  function quoteForm(rid, q){
    var v = q || {};
    function val(k){
      return (v[k] === null || v[k] === undefined) ? "" : String(v[k]);
    }
    return '<form class="jform dk-f" data-req="' + esc(rid) + '">' +
      '<div class="jrow">' +
        '<label for="q-amt-' + esc(rid) + '">견적 금액 <b>*</b></label>' +
        '<input id="q-amt-' + esc(rid) + '" name="amount" inputmode="numeric" required ' +
        'value="' + esc(val("amount")) + '" placeholder="원">' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="q-vat-' + esc(rid) + '">부가세</label>' +
        '<select id="q-vat-' + esc(rid) + '" name="vat">' +
          (window.AM_VAT || []).map(function(x){
            return '<option value="' + esc(x.key) + '"' +
              (val("vat") === x.key || (!val("vat") && x.key === "add") ? " selected" : "") +
              '>' + esc(x.name) + '</option>';
          }).join("") +
        '</select>' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label for="q-sc-' + esc(rid) + '">이 금액에 무엇이 포함됩니까 <b>*</b></label>' +
        '<textarea id="q-sc-' + esc(rid) + '" name="scope" rows="3" required maxlength="1000" ' +
        'placeholder="예: 1회 90분 레슨 8회 · 스윙 영상 분석 포함">' + esc(val("scope")) + '</textarea>' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label for="q-ex-' + esc(rid) + '">포함되지 않는 것 (별도 비용)</label>' +
        '<textarea id="q-ex-' + esc(rid) + '" name="excludes" rows="2" maxlength="1000" ' +
        'placeholder="예: 타석 이용료는 별도입니다">' + esc(val("excludes")) + '</textarea>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="q-dy-' + esc(rid) + '">예상 소요일</label>' +
        '<input id="q-dy-' + esc(rid) + '" name="days" inputmode="numeric" ' +
        'value="' + esc(val("days")) + '" placeholder="일">' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="q-so-' + esc(rid) + '">시작 가능일</label>' +
        '<input id="q-so-' + esc(rid) + '" name="startOn" type="date" ' +
        'value="' + esc(val("start_on")) + '">' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="q-wr-' + esc(rid) + '">A/S · 보증</label>' +
        '<input id="q-wr-' + esc(rid) + '" name="warranty" maxlength="200" ' +
        'value="' + esc(val("warranty")) + '">' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="q-vt-' + esc(rid) + '">이 견적이 유효한 날까지</label>' +
        '<input id="q-vt-' + esc(rid) + '" name="validTo" type="date" ' +
        'value="' + esc(val("valid_to")) + '">' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label for="q-nt-' + esc(rid) + '">더 하실 말씀</label>' +
        '<textarea id="q-nt-' + esc(rid) + '" name="note" rows="2" maxlength="1000">' +
        esc(val("note")) + '</textarea>' +
      '</div>' +
      /* ⚠️⚠️ **고친 까닭을 받습니다** — 감사 기록에 남습니다 (§8).
         처음 내는 것이면 안 받습니다 (적을 것이 없습니다). */
      (q ? '<div class="jrow jrow-full">' +
             '<label for="q-wy-' + esc(rid) + '">고치는 까닭</label>' +
             '<input id="q-wy-' + esc(rid) + '" name="whyText" maxlength="200" ' +
             'placeholder="기록에 남습니다 (안 적으셔도 됩니다)">' +
           '</div>' : '') +
      '<button class="btn btn-pt" type="submit">' +
      (q ? "견적 고치기" : "견적 내기") + '</button>' +
    '</form>';
  }

  /* 일정 양식 — ⚠️ 만나는 방법은 js/data/deal.js 에서 꺼냅니다
     (DB 의 check 와 같아야 하고, check-deal 이 맞춰 봅니다). */
  function apptForm(rid, ap){
    var v = ap || {};
    /* ⚠️⚠️ `datetime-local` 은 **그 기계의 시각**으로 보여 주고 그대로
       돌려줍니다. 사장님 기계가 한국 시각이면 맞지만, 아니면 어긋납니다
       — 그래서 보낼 때 **한국 시각으로 읽어** ISO 로 바꿉니다. */
    function local(iso){
      if(!iso) return "";
      var d = new Date(iso);
      if(isNaN(d.getTime())) return "";
      var k = new Date(d.getTime() + 9 * 3600 * 1000);
      function p2(n){ return String(n).padStart(2, "0"); }
      return k.getUTCFullYear() + "-" + p2(k.getUTCMonth() + 1) + "-" +
             p2(k.getUTCDate()) + "T" + p2(k.getUTCHours()) + ":" + p2(k.getUTCMinutes());
    }
    return '<form class="jform dk-f ap-f" data-req="' + esc(rid) + '">' +
      '<div class="jrow">' +
        '<label for="a-at-' + esc(rid) + '">만나실 때 <b>*</b> (한국 시각)</label>' +
        '<input id="a-at-' + esc(rid) + '" name="at" type="datetime-local" required ' +
        'value="' + esc(local(v.at)) + '">' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="a-kind-' + esc(rid) + '">어떻게</label>' +
        '<select id="a-kind-' + esc(rid) + '" name="kind">' +
          (window.AM_APPT_KIND || []).map(function(x){
            return '<option value="' + esc(x.key) + '"' +
              ((v.kind || "visit") === x.key ? " selected" : "") + '>' +
              esc(x.name) + '</option>';
          }).join("") +
        '</select>' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label for="a-place-' + esc(rid) + '">어디서</label>' +
        '<input id="a-place-' + esc(rid) + '" name="place" maxlength="200" ' +
        'value="' + esc(v.place || "") + '" placeholder="예: 남서울 실내연습장 3층">' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label for="a-note-' + esc(rid) + '">같이 전할 말</label>' +
        '<textarea id="a-note-' + esc(rid) + '" name="note" rows="2" maxlength="1000">' +
        esc(v.note || "") + '</textarea>' +
      '</div>' +
      /* ⚠️⚠️ **지킬 수 없는 약속을 하지 않습니다** — 문자 · 카톡을
         안 붙였으므로 "알려 드립니다" 라고 쓰지 않습니다. */
      '<p class="dk-hint">적어 두시면 손님 화면(<b>내 정보</b>)에 그대로 보입니다. ' +
      '<b>문자나 알림은 가지 않습니다</b> — 통화로 먼저 정하신 뒤 적어 주세요.</p>' +
      '<button class="btn btn-pt" type="submit">' +
      (ap && ap.state === "set" ? "일정 바꾸기" : "일정 잡기") + '</button>' +
    '</form>';
  }

  function card(a, r, q, items, pics, ap){
    /* ⚠️ RLS 가 가린 줄은 짝이 안 맞아 비어 옵니다 — 조용히 빈 카드를
       그리지 않고 그 사실을 말합니다. */
    if(!r) return '<div class="dk-r"><p class="dk-no">이 배정의 요청을 읽지 못했습니다. ' +
      '담당자에게 알려 주세요.</p></div>';

    var ast = window.amAssignSt(a.state) || { name:a.state, tone:"ink" };
    var rst = window.amDealSt(r.state)   || { name:r.state, tone:"ink" };
    var accepted = a.state === "accepted";
    var svcs = svcNames(items, r.id);
    var bud = money(r);

    var h = '<div class="dk-r" data-req="' + esc(r.id) + '">';
    h += '<div class="dk-h"><b>' + esc(r.no) + '</b>' +
         badge(ast.name, ast.tone) + badge(rst.name, rst.tone) + '</div>';

    /* 값이 없는 줄은 **줄째 뺍니다** (절대 규칙 2) */
    h += '<dl class="dk-d">';
    if(svcs.length) h += '<dt>요청</dt><dd>' + esc(svcs.join(" / ")) + '</dd>';
    if(r.region)    h += '<dt>지역</dt><dd>' + esc(r.region +
                         (r.gu ? " " + r.gu : "")) + '</dd>';
    if(bud)         h += '<dt>예산</dt><dd>' + esc(bud) + '</dd>';
    if(r.want_at)   h += '<dt>희망 일정</dt><dd>' + esc(r.want_at) + '</dd>';
    if(r.body)      h += '<dt>하신 말씀</dt><dd>' + esc(r.body) + '</dd>';
    /* ⚠️⚠️ 연락처는 수락한 뒤에 (머리말 참고) */
    if(accepted){
      h += '<dt>성함</dt><dd>' + esc(r.name) + '</dd>';
      h += '<dt>연락처</dt><dd>' + esc(r.tel) + '</dd>';
      if(r.email) h += '<dt>이메일</dt><dd>' + esc(r.email) + '</dd>';
    }
    h += '</dl>';
    if(!accepted)
      h += '<p class="dk-hint">성함 · 연락처는 <b>수락하신 뒤에</b> 보입니다. ' +
           '거절하시면 보시지 않은 채로 끝납니다.</p>';

    /* ⚠️⚠️ 손님이 붙이신 사진 · 서류 (§5-4). 0장이면 아무것도 안
       그립니다 — 빈 액자를 두면 "있었는데 안 보인다" 로 읽힙니다. */
    if(window.amPhotoBlock) h += window.amPhotoBlock(pics);

    /* ── 상담 일정 (2차 지시서 §7) ────────────────────────────
       ⚠️⚠️ **알림을 보내지 않습니다.** 적어 두고 서로 같은 것을 보는
       자리까지입니다 — "알려 드립니다" 라고 하지 않습니다. */
    if(ap){
      var ast2 = window.amApptSt(ap.state) || { name:ap.state, tone:"ink" };
      h += '<div class="ap"><div class="ap-h">' + icon("cal", 15) +
           '<b>' + esc(window.amWhen(ap.at)) + '</b>' +
           badge(window.amApptKindName(ap.kind), "ink") +
           badge(ast2.name, ast2.tone) + '</div>';
      if(ap.place) h += '<p class="ap-d">' + esc(ap.place) + '</p>';
      if(ap.note)  h += '<p class="ap-d">' + esc(ap.note) + '</p>';
      if(ap.state === "cancel" && ap.why)
        h += '<p class="ap-d">취소 — ' + esc(ap.why) + '</p>';
      h += '</div>';
    }

    /* ── 지금 낸 견적 ─────────────────────────────────────────── */
    if(q){
      var qst = window.amQuoteSt(q.state) || { name:q.state, tone:"ink" };
      h += '<div class="dk-q"><div class="dk-qh">' +
           '<b>' + esc(window.amQuoteAmount(q) || "") + '</b>' +
           badge(qst.name, qst.tone) + '</div>' +
           '<p class="dk-qs">' + esc(q.scope) + '</p>';
      if(q.excludes) h += '<p class="dk-qx">별도 — ' + esc(q.excludes) + '</p>';
      h += '</div>';
      if(q.state === "chosen")
        h += '<p class="dk-hint"><b>손님이 이 견적을 고르셨습니다.</b> ' +
             '고치거나 거두실 수 없습니다 — 바꿀 일이 있으면 담당자에게 알려 주세요.</p>';
    }

    /* ── 지금 되는 것만 ───────────────────────────────────────── */
    var btn = [];
    if(a.state === "sent"){
      btn.push('<button class="btn btn-sm btn-pt" data-do="yes">수락하기</button>');
      btn.push('<button class="btn btn-sm btn-line" data-do="no">거절하기</button>');
    }
    if(accepted && r.state === "accepted")
      btn.push('<button class="btn btn-sm btn-pri" data-do="consult">상담 시작</button>');
    /* ⚠️ 견적을 낼 수 있는 상태는 **0008 이 정합니다** — 여기 적은 넷은
       그 문이 받는 상태와 같아야 합니다 (consult 는 문이 상태를 같이
       넘겨 줍니다). 어긋나면 단추가 보이고 DB 가 거절합니다. */
    var canQuote = accepted &&
      ["consult","quoted","nego"].indexOf(r.state) >= 0 &&
      (!q || q.state !== "chosen");
    if(canQuote)
      btn.push('<button class="btn btn-sm ' + (q ? "btn-line" : "btn-pt") + '" ' +
               'data-do="quote">' + (q ? "견적 고치기" : "견적 내기") + '</button>');
    if(q && q.state === "open")
      btn.push('<button class="btn btn-sm btn-line" data-do="pull">견적 거두기</button>');
    /* ⚠️ 일정은 **수락한 뒤**에, 끝나지 않은 건에만 (DB 와 같은 조건).
       어긋나면 단추가 보이고 DB 가 거절합니다. */
    var canAppt = accepted && ["lost","hold"].indexOf(r.state) < 0;
    if(canAppt)
      btn.push('<button class="btn btn-sm btn-line" data-do="appt">' +
               (ap && ap.state === "set" ? "일정 바꾸기" : "일정 잡기") + '</button>');
    if(canAppt && ap && ap.state === "set"){
      btn.push('<button class="btn btn-sm btn-line" data-do="apdone">만났음</button>');
      btn.push('<button class="btn btn-sm btn-line" data-do="apcancel">일정 취소</button>');
    }
    /* ⚠️⚠️ **업체도 분쟁을 열 수 있어야 합니다** (0040) — 손님이
       약속에 안 나오거나 연락이 끊기는 일이 있고, 그때 길이 없으면
       업체는 전화밖에 할 수 없습니다. ⚠️ 수락한 건에만 냅니다
       (0040 이 "그 거래의 당사자만" 으로 막습니다 · 절대 규칙 5). */
    if(accepted)
      btn.push('<button class="btn btn-sm btn-line" data-do="report">문제 신고</button>');
    if(btn.length) h += '<div class="dk-b">' + btn.join("") + '</div>';

    if(OPEN[r.id] && canQuote) h += quoteForm(r.id, q);
    if(APOPEN[r.id] && canAppt) h += apptForm(r.id, ap);
    h += '<p class="dk-m lmsg" hidden></p></div>';
    return h;
  }

  /* ── 전체 그리기 ────────────────────────────────────────────── */
  /* ── 받은 후기 (0037) ────────────────────────────────────────────
     ⚠️⚠️ **요청 카드 안에 넣지 않습니다.** 후기는 업체에 붙는 것이고
     배정은 요청에 붙는 것이라, 섞어 두면 끝난 요청이 목록에서 빠지는
     날 후기도 같이 사라집니다.
     ⚠️⚠️ **별점을 업체가 고칠 길이 없습니다** (0037 에 그 문이 없습니다)
     — 고칠 수 있으면 후기가 아닙니다. 답변만 답니다.
     ⚠️ 못 읽었으면 **0건이라고 말하지 않습니다.** */
  function reviewBlock(revs){
    /* ⚠️⚠️ 못 읽은 것과 0건을 **갈라서** 말합니다. 섞으면 읽기가
       막힌 날 업체가 "후기가 하나도 없네" 로 읽습니다. */
    if(revs === null)
      return '<h3 class="rv-h">받은 후기</h3>' +
        '<p class="dk-hint">후기를 읽지 못했습니다. ' +
        '<button class="btn btn-sm btn-line" data-do="again">다시 읽기</button></p>';
    if(!revs.length)
      return '<h3 class="rv-h">받은 후기</h3>' +
        '<p class="dk-hint">아직 받은 후기가 없습니다. ' +
        '견적을 고르신 손님이나 만나신 손님이 쓰시면 여기에 뜹니다.</p>';
    /* ⚠️ 평균은 amRating() 이 셉니다 — 여기서 또 세지 않습니다.
       ⚠️⚠️ 다만 amRating() 은 **공개 파일**을 봅니다. 이 화면이 받은
       줄은 가려진 것까지 섞여 있어 같은 값이 아닙니다 — 그래서
       **평균을 여기서 찍지 않습니다** (두 숫자가 다르면 어느 쪽이
       참인지 묻게 됩니다). 건수만 적습니다. */
    return '<h3 class="rv-h">받은 후기 ' + won(revs.length) + '건</h3>' +
      '<p class="dk-hint">별점과 글은 손님이 쓴 것이라 <b>고칠 수 없습니다</b>. ' +
      '답변을 다시면 후기 아래에 공개됩니다.</p>' +
      '<div class="rvs">' + revs.map(function(v){
        return '<div class="rv-one">' +
          window.amRvRow(v, { who:"손님", pname: null, hidden:true }) +
          (v.hidden_at
            ? '<p class="dk-hint">운영자가 가린 후기입니다 — ' +
              '손님 화면에는 안 보이고 답변도 받지 않습니다.</p>'
            : window.amRvReplyForm(v)) +
        '</div>';
      }).join("") + '</div>';
  }

  function paint(){
    box.hidden = false;
    box.className = "deskbox";
    box.innerHTML = '<p class="lmsg">읽는 중입니다…</p>';

    load().then(function(got){
      var asg = got[0], qs = got[1], items = got[2], reqs = got[3],
          appts = got[4], revs = got[5], pics = got[6];
      /* ⚠️⚠️ 넷 중 하나라도 못 읽었으면 **0건이라고 말하지 않습니다.** */
      if(asg === null || qs === null || items === null || reqs === null ||
         appts === null){
        box.className = "none";
        box.innerHTML = '<h2>배정을 읽지 못했습니다.</h2>' +
          '<p>잠시 뒤에 다시 보시거나, 담당자에게 알려 주세요.</p>' +
          '<button class="btn btn-line" data-do="again">다시 읽기</button>';
        return;
      }
      if(!asg.length){
        /* ⚠️ 0건은 고장이 아닙니다 — 0 이라고 말하고, **막다른 길로
           두지 않습니다** (절대 규칙 2). */
        box.className = "none";
        box.innerHTML = '<h2>아직 배정받은 요청이 없습니다.</h2>' +
          '<p>손님 요청이 들어오고 운영자가 조건을 확인하면 여기로 전달됩니다. ' +
          '전달되는 즉시 이 화면에 뜹니다.</p>' +
          '<a class="btn btn-line" href="/my">내 정보</a>';
        return;
      }
      var byReq = {}, byId = {}, byAppt = {};
      qs.forEach(function(q){ byReq[q.request_id] = q; });
      reqs.forEach(function(r){ byId[r.id] = r; });
      appts.forEach(function(x){ byAppt[x.request_id] = x; });
      APPT = byAppt;
      box.innerHTML =
        '<p class="dk-c">배정받은 요청 ' + won(asg.length) + '건</p>' +
        asg.map(function(a){
          return card(a, byId[a.request_id], byReq[a.request_id], items,
                      (pics || {})[a.request_id], byAppt[a.request_id]);
        }).join("") +
        reviewBlock(revs);
    });
  }

  /* ── 누르기 ─────────────────────────────────────────────────── */
  function msgOf(node){
    var r = node.closest(".dk-r");
    return r ? r.querySelector(".dk-m") : null;
  }

  function act(b){
    var row = b.closest(".dk-r");
    var rid = row ? row.getAttribute("data-req") : null;
    var what = b.getAttribute("data-do");
    var m = msgOf(b);

    if(what === "again") return paint();
    if(what === "quote"){
      OPEN[rid] = !OPEN[rid];
      return paint();
    }
    if(what === "appt"){
      APOPEN[rid] = !APOPEN[rid];
      return paint();
    }
    if(!rid) return;

    var call = null, args = null;
    if(what === "yes"){ call = "answer_assignment"; args = { p_request: rid, p_yes: true }; }
    if(what === "no"){
      /* ⚠️ 취소를 누르면 null 입니다 — 빈 글자와 다릅니다. */
      var w1 = prompt("거절하시는 까닭을 적어 주세요 (기록에 남고 운영자가 봅니다)");
      if(!(w1 && w1.trim())) return;
      call = "answer_assignment"; args = { p_request: rid, p_yes: false, p_why: w1.trim() };
    }
    if(what === "consult"){
      call = "move_state";
      args = { p_request: rid, p_to: "consult", p_ctx: {} };
    }
    if(what === "pull"){
      var w2 = prompt("거두시는 까닭을 적어 주세요 (기록에 남습니다)");
      if(!(w2 && w2.trim())) return;
      call = "withdraw_quote"; args = { p_request: rid, p_why: w2.trim() };
    }
    if(what === "apdone" || what === "apcancel"){
      var ap2 = APPT[rid];
      if(!ap2) return;
      var w3 = null;
      if(what === "apcancel"){
        /* ⚠️ 취소에는 까닭을 받습니다 — 헛걸음한 쪽이 알아야 합니다
           (DB 도 그것을 봅니다). */
        w3 = prompt("취소하시는 까닭을 적어 주세요 (손님 화면에 보입니다)");
        if(!(w3 && w3.trim())) return;
      }
      call = "move_appointment";
      args = { p: { id: ap2.id, to: what === "apdone" ? "done" : "cancel",
                    why: w3 ? w3.trim() : null } };
    }
    /* 신고 · 분쟁 (0040) — ⚠️ 보낸 뒤에 **다시 그리지 않습니다.**
       다시 그리면 접수되었다는 말이 그 자리에서 사라집니다. */
    if(what === "report"){
      var w5 = prompt("무슨 일이 있었는지 적어 주세요 (운영자가 봅니다)");
      if(!(w5 && w5.trim())) return;
      b.disabled = true;
      if(m){ m.hidden = false; m.textContent = "보내는 중입니다…"; }
      rpc("open_report", { p: { kind:"dispute", request: rid, body: w5.trim() } })
        .then(function(){
          b.disabled = false;
          if(m) m.textContent = "접수되었습니다. 운영자가 확인합니다.";
        })
        .catch(function(err){ b.disabled = false; if(m) m.textContent = why(err); });
      return;
    }

    if(!call) return;

    b.disabled = true;
    if(m){ m.hidden = false; m.textContent = "보내는 중입니다…"; }
    rpc(call, args).then(function(){
      OPEN[rid] = false;
      paint();
    }).catch(function(err){
      b.disabled = false;
      if(m) m.textContent = why(err);
    });
  }

  /* ⚠️ 못 열면 **그 까닭을 그대로** 보여 줍니다 (조용히 아무 일도
     안 나면 눌러도 안 되는 단추가 됩니다). */
  function openPhoto(b){
    var m = msgOf(b);
    b.disabled = true;
    if(m){ m.hidden = false; m.textContent = "여는 중입니다…"; }
    window.amPhotoOpen(b.getAttribute("data-photo"))
      .then(function(url){
        b.disabled = false;
        if(m) m.hidden = true;
        window.open(url, "_blank", "noopener");
      })
      .catch(function(err){
        b.disabled = false;
        if(m) m.textContent = why(err);
      });
  }

  function submitQuote(f){
    var rid = f.getAttribute("data-req");
    var m = msgOf(f);
    var btn = f.querySelector('button[type="submit"]');
    /* ⚠️ 숫자 칸은 숫자만 보냅니다 — 쉼표 · 원 을 적으셔도 되게. */
    var num = function(v){
      v = String(v || "").replace(/[^0-9]/g, "");
      return v === "" ? null : Number(v);
    };
    var str = function(v){ v = String(v || "").trim(); return v === "" ? null : v; };
    var amt = num(f.amount.value);
    /* ⚠️⚠️ **0 은 값입니다** (무상 · 서비스). 안 적은 것만 막습니다 —
       여기서 `||` 를 쓰면 0원 견적이 "안 적음" 이 됩니다. */
    if(amt === null){
      if(m){ m.hidden = false; m.textContent = "견적 금액을 적어 주세요."; }
      return;
    }
    btn.disabled = true;
    if(m){ m.hidden = false; m.textContent = "보내는 중입니다…"; }
    rpc("submit_quote", {
      p_request: rid,
      p_data: {
        amount: amt, vat: f.vat.value,
        scope: str(f.scope.value), excludes: str(f.excludes.value),
        days: num(f.days.value), startOn: str(f.startOn.value),
        warranty: str(f.warranty.value), validTo: str(f.validTo.value),
        note: str(f.note.value)
      },
      p_why: f.whyText ? str(f.whyText.value) : null
    }).then(function(){
      OPEN[rid] = false;
      paint();
    }).catch(function(err){
      btn.disabled = false;
      if(m) m.textContent = why(err);
    });
  }

  /* ⚠️ 듣는 자리를 **한 번만** 답니다 — paint() 가 innerHTML 을 다시
     쓰므로, 카드마다 달면 다시 그릴 때마다 쌓입니다 (한 번 누르면
     여러 번 보내는 고장). */
  box.addEventListener("click", function(e){
    /* ⚠️ 사진은 **누르셨을 때** 주소를 청합니다 (10분짜리 서명 주소) */
    var ph = e.target.closest ? e.target.closest("button[data-photo]") : null;
    if(ph) return openPhoto(ph);
    var b = e.target.closest ? e.target.closest("button[data-do]") : null;
    if(b) act(b);
  });
  function submitAppt(f){
    var rid = f.getAttribute("data-req"), m = msgOf(f);
    var btn = f.querySelector('button[type="submit"]');
    var v = String(f.at.value || "").trim();
    if(!v){
      if(m){ m.hidden = false; m.textContent = "만나실 때를 적어 주세요."; }
      return;
    }
    /* ⚠️⚠️ **한국 시각으로 읽습니다.** `datetime-local` 은 띠 정보가
       없는 글자("2026-11-05T14:00")라, 그냥 new Date() 하면 **그 기계의
       띠**로 읽습니다 — 사장님이 해외에 계시면 아홉 시간 어긋납니다. */
    var iso = new Date(v + ":00+09:00");
    if(isNaN(iso.getTime())){
      if(m){ m.hidden = false; m.textContent = "만나실 때를 다시 확인해 주세요."; }
      return;
    }
    btn.disabled = true;
    if(m){ m.hidden = false; m.textContent = "보내는 중입니다…"; }
    rpc("set_appointment", { p: {
      request: rid, at: iso.toISOString(), kind: f.kind.value,
      place: String(f.place.value || "").trim() || null,
      note: String(f.note.value || "").trim() || null
    }}).then(function(){
      APOPEN[rid] = false;
      paint();
    }).catch(function(err){
      btn.disabled = false;
      if(m) m.textContent = why(err);
    });
  }

  box.addEventListener("submit", function(e){
    var fa = e.target.closest ? e.target.closest("form.ap-f") : null;
    if(fa){ e.preventDefault(); return submitAppt(fa); }
    /* 후기 답변 (0037) — ⚠️ 꾸러미는 js/review.js 가 짓습니다 */
    var fr = e.target.closest ? e.target.closest("form.rvform") : null;
    if(fr){
      e.preventDefault();
      var rm = fr.querySelector(".rvmsg");
      var rb = fr.querySelector('button[type="submit"]');
      rb.disabled = true;
      if(rm){ rm.hidden = false; rm.textContent = "올리는 중입니다…"; }
      window.amRvSend(rpc, fr).then(paint).catch(function(err){
        rb.disabled = false;
        if(rm){ rm.hidden = false; rm.textContent = why(err); }
      });
      return;
    }
    var f = e.target.closest ? e.target.closest("form.dk-f") : null;
    if(!f) return;
    e.preventDefault();
    submitQuote(f);
  });

  /* ── 문 ─────────────────────────────────────────────────────── */
  amAuthAsk().then(function(a){
    A = a;
    if(!a.on){
      try{ console.warn("[desk] Supabase 설정이 없어 작업실을 열지 않았습니다 — " +
        "Vercel 의 SUPABASE_URL · SUPABASE_ANON_KEY 를 넣고 다시 배포하세요."); }catch(e){}
      /* ⚠️ 손님(업체)에게는 "아직" 까지만 — 무엇을 설정해야 하는지는
         찍지 않습니다 (절대 규칙 3). */
      return say("<h2>" + esc(window.koWith("업체 작업실", "은는")) +
        " 아직 열지 않았습니다.</h2><p>문을 열기 전이라 로그인을 받지 않습니다.</p>" +
        '<a class="btn btn-line" href="/join">입점 신청 안내</a>');
    }
    if(!a.signedIn)
      return say("<h2>로그인하시면 배정받은 요청이 보입니다.</h2>" +
        "<p>메일로 받은 링크 한 번이면 됩니다.</p>" +
        '<a class="btn btn-pri" href="/login">로그인하기</a>');
    if(a.role !== "provider" || !a.provider)
      /* ⚠️ 왜 안 되는지 자세히 적지 않습니다 — 권한 구조를 알려 주는
         글이 됩니다. 대신 **다음에 할 일**을 냅니다. */
      return say("<h2>이 화면은 입점 업체만 볼 수 있습니다.</h2>" +
        "<p>입점 신청이 승인되고 계정이 이어지면 여기에서 요청을 받으십니다.</p>" +
        '<a class="btn btn-line" href="/join">입점 신청하기</a>');
    PV = a.provider;
    paint();
  });
})();
