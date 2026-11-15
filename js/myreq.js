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

  /* ── 비교견적 (0082) ──────────────────────────────────────────
     ⚠️⚠️⚠️ 스위치(compareOn)가 꺼져 있으면 오늘과 똑같이 묻습니다 — 0082 가
     없는 DB 에 compare · kind · terms · blind 를 물으면 질의가 통째로 거절됩니다.
     ⚠️⚠️ 「상담 선택」은 예약 · 계약 · 결제가 **아닙니다.** 고르시는 그 자리에서
     상호를 보여 드리고 그 업체에만 연락처를 넘기는 동의를 받습니다
     (개인정보보호법 제17조 제2항). 동의 단추를 눌러야만 pick_quote 가 갑니다. */
  function cmpOn(){ return !!(window.amCmpOn && window.amCmpOn()); }
  function cmpCfg(cat){ return window.amCmp ? window.amCmp(cat) : null; }
  function kstToday(){
    var k = new Date(Date.now() + 9 * 3600 * 1000);
    function p2(n){ return String(n).padStart(2, "0"); }
    return k.getUTCFullYear() + "-" + p2(k.getUTCMonth() + 1) + "-" + p2(k.getUTCDate());
  }
  function errText(err){
    return window.amErrText ? window.amErrText({ message: why(err) }) : why(err);
  }
  var PICKING = false;   /* 상담 선택을 보내는 중 — 두 번 안 보냅니다 */

  function load(){
    var on = cmpOn();
    return Promise.all([
      /* ⚠️ RLS 가 **내 요청만** 내줍니다 (request_mine) — 여기서 또
         좁히지 않습니다. 사용자 id 를 화면이 들고 있으면 그것을 고쳐
         남의 것을 부르려는 시도가 생깁니다. */
      get("request?select=id,no,state,cat,region,gu,want_at,created_at" +
          (on ? ",compare,detail" : "") +
          "&order=created_at.desc&limit=30"),
      get("quote?select=id,request_id,provider_id,amount,vat,scope,excludes,days," +
          "start_on,warranty,valid_to,note,state,created_at" + (on ? ",kind,terms" : "") +
          "&order=created_at.asc&limit=200"),
      get("request_item?select=request_id,service_id&limit=500"),
      /* ⚠️ 일정은 RLS 가 **내 요청 것만** 내줍니다 (0034 의 appt_mine) */
      get("appointment?select=id,request_id,provider_id,at,kind,place,note,state,why" +
          "&order=at.asc&limit=100"),
      /* 제공 이력 (0039 · 3차 지시서 §5) — ⚠️ RLS 가 **내 요청 것만**
         내줍니다 (0005 의 assign_requester). 철회한 것도 옵니다:
         **넘어간 적이 있다는 사실**을 손님이 볼 수 있어야 합니다. */
      get("assignment?select=id,request_id,provider_id,state,agree3rd_at," +
          "revoked_at,revoked_why,created_at" + (on ? ",blind" : "") +
          "&order=created_at.asc&limit=200")
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

  function detailRows(r){
    var d = (r && r.detail && typeof r.detail === "object") ? r.detail : {};
    var cfg = cmpCfg(r.cat), seen = {}, h = "";
    ((cfg && cfg.ask) || []).forEach(function(f){
      seen[f.k] = 1;
      var v = d[f.k];
      if(v !== null && v !== undefined && String(v).trim() !== "")
        h += '<dt>' + esc(f.label) + '</dt><dd>' + esc(String(v)) + '</dd>';
    });
    Object.keys(d).forEach(function(k){
      if(seen[k]) return;
      var v = d[k];
      if(v !== null && v !== undefined && String(v).trim() !== "")
        h += '<dt>' + esc(k) + '</dt><dd>' + esc(String(v)) + '</dd>';
    });
    return h;
  }

  /* 비교표 — ⚠️⚠️ **낸 차례대로** 놓습니다(싼 순서가 아닙니다). 「최저가」 ·
     「최고가」 딱지를 안 붙입니다 — 포함되는 것이 다르면 금액만으로 못 견줍니다.
     ⚠️ 칸 이름은 AM_CMP[분류].terms 한 곳에서(업체 양식이 같은 줄을 읽습니다). */
  function cmpTable(r, qs, today, ended){
    var cfg = cmpCfg(r.cat) || { terms:[], amount:"금액" };
    var kinds = window.AM_CMP_KIND || {};
    var chosen = qs.some(function(q){ return q.state === "chosen"; });
    function T(q){ return (q.terms && typeof q.terms === "object") ? q.terms : {}; }
    function cell(v){
      return (v === null || v === undefined || String(v).trim() === "")
        ? '<td class="cmp-sm">적지 않음</td>' : '<td>' + esc(String(v)) + '</td>';
    }
    var rows = [];
    rows.push('<tr><th scope="row">견적 종류</th>' + qs.map(function(q){
      return cell(q.kind && window.amKeyName ? window.amKeyName(kinds, q.kind, "견적 종류") : null); }).join("") + '</tr>');
    rows.push('<tr><th scope="row">' + esc(cfg.amount || "금액") + '</th>' + qs.map(function(q){
      return cell(window.amQuoteAmount(q)); }).join("") + '</tr>');
    (cfg.terms || []).forEach(function(f){
      rows.push('<tr><th scope="row">' + esc(f.label) + '</th>' + qs.map(function(q){
        return cell(T(q)[f.k]); }).join("") + '</tr>');
    });
    rows.push('<tr><th scope="row">포함</th>' + qs.map(function(q){
      return cell(q.scope); }).join("") + '</tr>');
    rows.push('<tr><th scope="row">별도 비용</th>' + qs.map(function(q){
      return cell(q.excludes); }).join("") + '</tr>');
    rows.push('<tr><th scope="row">유효기간</th>' + qs.map(function(q){
      if(!q.valid_to) return '<td class="cmp-sm">적지 않음</td>';
      var ex = q.state === "open" && window.amCmpExpired && window.amCmpExpired(q, today);
      return '<td>' + esc(q.valid_to) + '까지' +
        (ex ? ' <span class="dk-st dk-bad cmp-exp">만료</span>' : "") + '</td>';
    }).join("") + '</tr>');
    rows.push('<tr><th scope="row">업체 말씀</th>' + qs.map(function(q){
      return cell(q.note); }).join("") + '</tr>');
    rows.push('<tr><th scope="row">상태</th>' + qs.map(function(q){
      var st = window.amQuoteSt(q.state) || { name:q.state, tone:"ink" };
      var name = q.state === "chosen" ? "상담 선택" : st.name;
      return '<td>' + badge(name, st.tone) + '</td>';
    }).join("") + '</tr>');
    rows.push('<tr><th scope="row">고르기</th>' + qs.map(function(q){
      var ex = window.amCmpExpired && window.amCmpExpired(q, today);
      if(q.state === "open" && !ex && !chosen && !ended)
        return '<td><button type="button" class="btn btn-sm btn-pt" data-cpick="' +
          esc(q.provider_id) + '" data-pname="' + esc(q.pname || "") + '">' +
          '이 업체와 상담하기</button></td>';
      if(q.state === "chosen")
        return '<td class="cmp-sm">고르신 업체입니다</td>';
      if(q.state === "open" && ex)
        return '<td class="cmp-sm">유효기간이 지나 고를 수 없습니다</td>';
      return '<td class="cmp-sm">—</td>';
    }).join("") + '</tr>');
    return '<div class="cmp-s"><table class="cmp-t cmpq">' +
      '<caption class="sr-only">받은 비교 견적</caption>' +
      '<thead><tr><th scope="col">항목</th>' + qs.map(function(q){
        return '<th scope="col">' + (q.pname ? esc(q.pname)
          : '<span class="rq-q-no">업체 상호를 읽지 못했습니다</span>') + '</th>';
      }).join("") + '</tr></thead>' +
      '<tbody>' + rows.join("") + '</tbody></table></div>';
  }

  /* 상담 선택 동의 상자 — ⚠️ 보유 기간이 비면 동의를 받지 않습니다
     (무엇을 얼마나 두는지 안 보여 드리고 받을 수 없습니다 · 제15조 제2항). */
  function consentHtml(pid, pname){
    var keep = String(((window.WOW_BIZ || {}).applyKeep) || "").trim();
    var who = pname ? '<b>' + esc(pname) + '</b>' : "고르신 업체";
    if(!keep)
      return '<p class="dk-hint">지금은 상담할 업체를 고르실 수 없습니다. ' +
        '고객센터로 문의해 주세요.</p>';
    return '<div class="agree cmp-ag" data-cpv="' + esc(pid) + '">' +
      '<h3>연락처 제공 동의 (개인정보보호법 제17조 제2항)</h3>' +
      '<dl>' +
        '<dt>제공받는 자</dt><dd>' + who + '</dd>' +
        '<dt>넘기는 항목</dt><dd>성함 · 연락처 (적으셨으면 이메일)</dd>' +
        '<dt>목적</dt><dd>상담 연락</dd>' +
        '<dt>보유 기간</dt><dd>' + esc(keep) + '</dd>' +
      '</dl>' +
      '<p class="agree-no">이 업체 <b>한 곳에만</b> 넘어갑니다. 예약 · 계약 · 결제가 아닙니다 — ' +
      '고르시면 다른 업체의 견적은 「고르지 않음」으로 바뀝니다.</p>' +
      '<div class="dk-b">' +
        '<button type="button" class="btn btn-sm btn-pt" data-cgo="' + esc(pid) + '">' +
        '동의하고 이 업체 선택</button>' +
        '<button type="button" class="btn btn-sm btn-line" data-cno="1">그만두기</button>' +
      '</div>' +
    '</div>';
  }

  function cmpCard(r, qs, items, pics, appts, revs, pnames, asgs){
    var today = kstToday();
    var stg = window.amCmpStage ? window.amCmpStage(r, qs, today) : { name:"" };
    var ended = ["lost","done","signed","fee_wait","fee_done"].indexOf(r.state) >= 0;
    var svcs = items.filter(function(x){ return x.request_id === r.id; })
      .map(function(x){
        var f = window.amSub ? amSub(x.service_id) : null;
        return f ? (f.cat.name + " · " + f.item.name) : x.service_id;
      });
    var chosen = qs.filter(function(q){ return q.state === "chosen"; })[0] || null;
    var h = '<div class="dk-r" data-req="' + esc(r.id) + '">';
    h += '<div class="dk-h"><b>' + esc(r.no) + '</b>' + badge("비교견적", "info") +
         (stg.name ? badge(stg.name, "grn") : "") + '</div>';
    h += '<dl class="dk-d">';
    if(svcs.length) h += '<dt>요청</dt><dd>' + esc(svcs.join(" / ")) + '</dd>';
    if(r.region)    h += '<dt>지역</dt><dd>' + esc(r.region + (r.gu ? " " + r.gu : "")) + '</dd>';
    if(r.want_at)   h += '<dt>희망 일정</dt><dd>' + esc(r.want_at) + '</dd>';
    h += detailRows(r);
    h += '</dl>';
    (appts || []).forEach(function(ap){
      var ast = window.amApptSt(ap.state) || { name:ap.state, tone:"ink" };
      h += '<div class="ap"><div class="ap-h">' + icon("cal", 15) +
           '<b>' + esc(window.amWhen(ap.at)) + '</b>' +
           badge(window.amApptKindName(ap.kind), "ink") +
           badge(ast.name, ast.tone) + '</div>';
      if(ap.place) h += '<p class="ap-d">' + esc(ap.place) + '</p>';
      if(ap.note)  h += '<p class="ap-d">' + esc(ap.note) + '</p>';
      if(ap.state === "set")
        h += '<div class="dk-b"><button class="btn btn-sm btn-line" ' +
             'data-apcancel="' + esc(ap.id) + '">못 가게 되었습니다</button></div>';
      h += '</div>';
    });
    if(window.amPhotoBlock) h += window.amPhotoBlock(pics, true);

    if(qs.length){
      h += '<h3 class="rq-h">받은 비교 견적 ' + won(qs.length) + '건</h3>' +
        '<p class="dk-hint">낸 차례대로 놓았습니다. ' +
        '<b>싼 순서가 아닙니다</b> — 포함되는 것이 다르면 금액만으로는 견줄 수 없습니다. ' +
        '「예상 견적」은 실물을 확인한 뒤 달라질 수 있습니다.</p>' +
        cmpTable(r, qs, today, ended) +
        '<div class="cmp-agw" hidden></div>';
    }else{
      h += '<p class="dk-hint">아직 받은 견적이 없습니다. 업체가 낸 견적만 여기에 뜹니다 — ' +
           '견적이 오지 않으면 아무것도 지어 보여 드리지 않습니다.</p>';
    }
    if(chosen)
      h += '<p class="dk-hint"><b>상담 선택 — 예약 · 계약 · 결제가 아닙니다. 업체가 연락드립니다.</b> ' +
           '조건을 맞추신 뒤 바꿀 일이 있으면 고객센터로 알려 주세요.</p>';
    /* ⚠️ 연락처가 실제로 넘어간 배정만 「전달한 업체」입니다(비교 배정은 안 넘깁니다) */
    h += giveBlock(r, (asgs || []).filter(function(a){
      return a.agree3rd_at && !a.blind;
    }), pnames || {});
    h += reviewBlock(r, qs, appts, revs, pnames || {});
    if(!ended)
      h += '<div class="dk-b"><button class="btn btn-sm btn-line" ' +
           'data-cancel="' + esc(r.id) + '">이 요청 취소하기</button></div>';
    else if(r.state !== "lost")
      h += '<p class="dk-hint">이미 진행 중인 건이라 혼자 취소하실 수 없습니다 — ' +
           '고객센터로 알려 주세요.</p>';
    if(r.state !== "lost")
      h += '<div class="dk-b"><button class="btn btn-sm btn-line" ' +
           'data-report="' + esc(r.id) + '">이 건에 문제가 있습니다</button></div>';
    h += '<p class="dk-m lmsg" hidden></p></div>';
    return h;
  }

  function card(r, quotes, items, pics, appts, revs, pnames, asgs){
    if(r.compare)
      return cmpCard(r, quotes.filter(function(q){ return q.request_id === r.id; }),
                     items, pics, appts, revs, pnames, asgs);
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
    /* ⚠️ `true` — **제가 올린 파일**이라 빼는 단추가 같이 나옵니다
       (0011 의 `drop_photo`). 업체 화면(`js/desk.js`)에서는 켜지
       않습니다 — 문도 업체를 거절합니다. */
    if(window.amPhotoBlock) h += window.amPhotoBlock(pics, true);

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
    /* ⚠️⚠️ **신고는 단계와 무관하게 냅니다** (0040 · 3차 지시서 §6).
       취소가 막히는 자리(계약 뒤)가 바로 다툼이 나는 자리인데, 그때
       길이 없으면 손님은 전화밖에 할 수 없습니다.
       ⚠️ 눌러도 아무 일이 안 나는 단추가 아닙니다 — 운영자 화면
       (/admin 의 신고 · 분쟁)이 그것을 받습니다. */
    if(r.state !== "lost")
      h += '<div class="dk-b"><button class="btn btn-sm btn-line" ' +
           'data-report="' + esc(r.id) + '">이 건에 문제가 있습니다</button></div>';
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
            /* ⚠️⚠️⚠️ **0 인 자리에 "지금 되는 것" 을 같이 냅니다**
               (절대 규칙 2). 전에는 이 자리가 "가져오기" 하나뿐이라,
               오늘 막 가입하신 분께 **옛 요청을 되찾는 법**만 알려 주고
               정작 **새로 넣는 법**은 한 글자도 안 적혀 있었습니다 —
               이 서비스의 알맹이가 바로 그 요청인데 말입니다.
               ⚠️ 옆의 세 상자(조인 · 커뮤니티 · 인력)는 전부 "어디서
               올리세요" 단추를 내고 있었는데 여기만 빠져 있었습니다. */
            : '<p class="myhint">아직 넣으신 요청이 없습니다. ' +
              '조건만 적으시면 그 일을 하는 업체가 견적을 보냅니다.</p>' +
              '<a class="btn btn-pt mj-go" href="/match">견적 · 매칭 요청하기</a>' +
              '<p class="myhint">로그인 전에 넣으신 것이 있으면 ' +
              '아래에서 가져오실 수 있습니다.</p>') +
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
    /* ⚠️⚠️⚠️ **되돌릴 수 없는 일이라 한 번 여쭙습니다.** 파일을
       빼면 업체도 운영자도 더는 못 봅니다 (0011 은 줄을 지웁니다 —
       가리는 것이 아닙니다). 무엇을 빼는지 **이름까지** 말합니다. */
    var dp = e.target.closest ? e.target.closest("button[data-dropphoto]") : null;
    if(dp){
      if(!window.confirm("이 파일을 뺄까요? — " + dp.getAttribute("data-what") +
                         "\n빼시면 되돌릴 수 없고, 업체와 운영자도 더는 " +
                         "보지 못합니다.")) return;
      var row1 = dp.closest(".dk-r"), dm = row1 ? row1.querySelector(".dk-m") : null;
      dp.disabled = true;
      if(dm){ dm.hidden = false; dm.textContent = "빼는 중입니다…"; }
      /* ⚠️ 이 문은 **jsonb 가 아니라 자리 인자**를 받습니다 (0011) —
         `{ p: … }` 로 보내면 "함수를 찾을 수 없습니다" 가 됩니다. */
      rpc("drop_photo", { p_photo: dp.getAttribute("data-dropphoto") })
        .then(paint)
        .catch(function(err){
          dp.disabled = false;
          /* ⚠️ DB 가 거절한 말을 **그대로** 보여 줍니다 */
          if(dm) dm.textContent = why(err);
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
    /* 신고 · 분쟁 (0040) — ⚠️ **글자 수 규칙을 두 곳에 적지 않습니다.**
       몇 글자부터인지는 DB 가 정하고(다섯 글자), 거절하는 말을 그대로
       보여 줍니다. 여기서 또 재면 한쪽만 고치는 날 조용히 어긋납니다. */
    var rpb = e.target.closest ? e.target.closest("button[data-report]") : null;
    if(rpb){
      var r6 = rpb.closest(".dk-r"), m6 = r6 ? r6.querySelector(".dk-m") : null;
      var w6 = prompt("무슨 일이 있었는지 적어 주세요 (운영자가 봅니다)");
      if(!(w6 && w6.trim())) return;
      rpb.disabled = true;
      if(m6){ m6.hidden = false; m6.textContent = "보내는 중입니다…"; }
      /* ⚠️ 지킬 수 없는 말을 하지 않습니다 — "몇 시간 안에" 라고
         적지 않고, 접수되었다는 사실까지만 말합니다 (절대 규칙 5). */
      rpc("open_report", { p: { kind:"dispute",
                                request: rpb.getAttribute("data-report"),
                                body: w6.trim() } })
        .then(function(){
          rpb.disabled = false;
          if(m6) m6.textContent = "접수되었습니다. 운영자가 확인합니다.";
        })
        .catch(function(err){ rpb.disabled = false; if(m6) m6.textContent = why(err); });
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
    /* 비교견적 — 「이 업체와 상담하기」는 동의 상자만 엽니다(아직 안 보냅니다) */
    var cp = e.target.closest ? e.target.closest("button[data-cpick]") : null;
    if(cp){
      var rc = cp.closest(".dk-r"), aw = rc ? rc.querySelector(".cmp-agw") : null;
      if(!aw) return;
      aw.innerHTML = consentHtml(cp.getAttribute("data-cpick"), cp.getAttribute("data-pname"));
      aw.hidden = false;
      var gb = aw.querySelector("button[data-cgo]");
      if(gb && gb.focus) gb.focus();
      return;
    }
    var cn = e.target.closest ? e.target.closest("button[data-cno]") : null;
    if(cn){
      var aw2 = cn.closest(".cmp-agw");
      if(aw2){ aw2.innerHTML = ""; aw2.hidden = true; }
      return;
    }
    var cg = e.target.closest ? e.target.closest("button[data-cgo]") : null;
    if(cg){
      if(PICKING) return;
      var rg = cg.closest(".dk-r"), mg = rg ? rg.querySelector(".dk-m") : null;
      var ridg = rg ? rg.getAttribute("data-req") : null;
      if(!ridg) return;
      PICKING = true;
      cg.disabled = true;
      if(mg){ mg.hidden = false; mg.textContent = "보내는 중입니다…"; }
      rpc("pick_quote", { p: { request: ridg, provider: cg.getAttribute("data-cgo"),
                               share: true } })
        .then(function(){ PICKING = false; paint(); })
        .catch(function(err){
          PICKING = false;
          cg.disabled = false;
          if(mg) mg.textContent = errText(err);
        });
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
