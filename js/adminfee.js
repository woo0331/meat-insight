/* ════════════════════════════════════════════════════════════════════
   수수료 확정 · 입금 · 월 정산서 — /admin 의 한 자리 (0003 · 0013)

   ⚠️⚠️⚠️ **돈이 한 바퀴를 못 돌고 있었습니다.** 문은 2026-10-21(0003)
   과 10-22(0013)에 섰는데 **부르는 화면이 한 곳도 없었습니다** —
     confirm_fee       수수료를 확정하는 문        화면 0곳
     mark_paid         입금을 적는 문              화면 0곳
     clawback_fee      환수 · 부분환불             화면 0곳
     build_settlement  월 정산서를 만드는 문        화면 0곳
     hold_settlement   정산 보류 · 해제            화면 0곳
   그런데 `js/deskfee.js` 는 **그 결과를 이미 그리고 있습니다**
   (`fee_total` · `fee_at` · `paid_at` 과 `settlement` 표). 즉 업체
   작업실의 수수료 칸은 **영원히 0건**이었고, 사장님이 Supabase SQL
   편집기를 직접 치셔야 숫자가 생겼습니다. 매각 지표(0033)의 수수료도
   여기서 옵니다 — 이 화면이 없으면 그 숫자는 늘 0 입니다.
   ⚠️ `save_provider_contact`(적는 자리가 없던 자리) · `drop_photo`
   (단추가 없던 자리) · 문의 답변(읽는 자리가 없던 자리)에 이은
   **넷째**입니다.

   ⚠️⚠️ **`check-doors` 가 이 다섯 가운데 둘을 못 잡았습니다.** 그
   도구는 "다른 SQL 이 부르면 안쪽 도움함수" 로 세는데, `confirm_fee` ·
   `mark_paid` 는 0004 · 0007 · 0009 의 **거절 문구 안에** 이름이
   들어 있습니다("수수료는 confirm_fee() · mark_paid() 로만 갑니다").
   그 줄이 "부르는 자리" 로 세어졌습니다 — 같이 고쳤습니다.

   ⚠️⚠️⚠️ **인자가 자리로 갑니다** (`p_deal` · `p_fee` · …). 저장소의
   다른 문은 거의 `jsonb` 하나(`p`)를 받는데 0003 · 0013 은 그렇지
   않습니다 — 습관대로 보내면 **인자 이름이 안 맞아 거절**됩니다
   (`save_provider_contact` 에서 겪은 그 자리). 검사가 보내는 꾸러미를
   뜯어 봅니다.

   ⚠️⚠️ **금액을 이 화면이 지어내지 않습니다.** 세는 곳은
   `js/data/deal.js` 의 `amFeeCalc()` **한 곳**이고, 셀 수 없는 정책
   (마진 배분 · 월 정액 · 유지 둘)에는 **null** 이 돌아옵니다 — 그때는
   칸을 비워 열고 직접 적으시게 합니다. 0 을 채워 두면 **0원짜리
   수수료를 확정**하게 됩니다 (절대 규칙 1).

   ⚠️ **검사용 업체는 딱지를 붙입니다** — 매각 지표에 섞이면 안 되는
   줄이고, 여기가 사장님이 돈을 세는 자리입니다.
   ⚠️ 설정이 있어야 열리는 자리라 빌드가 찍은 HTML 만 보는 검사는
   영원히 못 봅니다 — `tools/test-desk.js` 가 직접 눌러 봅니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("feeadm");
  if(!box || !window.amAuthAsk) return;

  var esc = window.esc, icon = window.icon, won = window.won;
  var A = null, TAB = "fix";          /* fix · paid · settle */
  var D = null;

  function get(q){
    return fetch(A.conf.url + "/rest/v1/" + q, {
      headers: Object.assign({ apikey: A.conf.anonKey }, window.amAuthHeaders())
    }).then(function(r){ return r.ok ? r.json().catch(function(){ return null; }) : null; })
      .catch(function(){ return null; });
  }
  /* ⚠️⚠️ **자리 인자입니다** — `{ p: {...} }` 로 보내면 거절됩니다 */
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
  function day(iso){ return window.amDay ? window.amDay(iso) : ""; }
  function num(v){
    var t = String(v === null || v === undefined ? "" : v).replace(/[^0-9-]/g, "");
    return t === "" ? null : Number(t);
  }

  /* ⚠️ 증빙 갈래 — 무엇으로 확인했는지를 **적게** 합니다 (§9 "계약 완료
     증빙 확인"). 0003 은 비어 있으면 거절합니다. */
  var PROOF = [
    { key:"contract", name:"계약서를 봤습니다" },
    { key:"receipt",  name:"입금증 · 영수증을 봤습니다" },
    { key:"call",     name:"손님 · 업체에 확인했습니다" },
    { key:"etc",      name:"그 밖" }
  ];

  function pvName(id){
    var p = D.pvs[id];
    return p ? p.name : String(id || "");
  }
  function testTag(id){
    var p = D.pvs[id];
    /* ⚠️ 검사용이 매각 지표에 섞이면 그건 사는 쪽에 하는 거짓말입니다 */
    return (p && p.is_test) ? ' <span class="dk-st dk-warn">검사용</span>' : "";
  }
  function polOf(id){ return D.pols[id] || null; }

  /* ── 수수료 확정 대기 ─────────────────────────────────────────── */
  function fixRow(d){
    var pol  = polOf(d.provider_id);
    var calc = window.amFeeCalc ? window.amFeeCalc(pol, d.amount) : null;
    var req  = D.reqs[d.request_id] || {};
    return '<li data-deal="' + esc(d.id) + '">' +
      '<b>' + esc(pvName(d.provider_id)) + '</b>' + testTag(d.provider_id) +
      '<p class="fe-r">' + esc(req.no || "") +
        ' · 계약금액 ' + esc(won(d.amount)) + '원' +
        (d.done_at ? ' · ' + esc(day(d.done_at)) + ' 이행 완료' : '') + '</p>' +
      '<p class="fe-r">' +
        (pol ? '적용 정책 — ' + esc(window.amFeeLine(pol))
             /* ⚠️ 정책이 없으면 **없다고 말합니다** (지어내지 않습니다) */
             : '<b>적용할 수수료 정책이 없습니다</b> — 금액을 직접 적어 주세요.') +
      '</p>' +
      (pol && !calc
        ? '<p class="fe-r"><b>이 정책은 건별로 셀 수 없습니다</b> — ' +
          '마진 · 회차를 보고 직접 적어 주세요.</p>'
        : '') +
      '<div class="dk-b">' +
        '<button type="button" class="btn btn-sm btn-pri" data-fix="' +
        esc(d.id) + '">수수료 확정</button></div>' +
      '<form class="jform fee-f" hidden data-calc="' +
        esc(calc ? String(calc.fee) : "") + '">' +
        '<div class="jrow"><label>수수료(원) <b>*</b></label>' +
        '<input name="fee" inputmode="numeric" required value="' +
        esc(calc ? String(calc.fee) : "") + '"></div>' +
        '<div class="jrow"><label>부가세(원)</label>' +
        '<input name="vat" inputmode="numeric" value="' +
        esc(calc ? String(calc.vat) : "") + '"></div>' +
        '<div class="jrow"><label>합계(원)</label>' +
        '<input name="total" inputmode="numeric" value="' +
        esc(calc ? String(calc.total) : "") + '"></div>' +
        '<div class="jrow"><label>무엇으로 확인하셨습니까 <b>*</b></label>' +
        '<select name="proofkind" required>' +
          PROOF.map(function(k){
            return '<option value="' + esc(k.key) + '">' + esc(k.name) + '</option>';
          }).join("") +
        '</select></div>' +
        '<div class="jrow jrow-full"><label>증빙 메모 <b>*</b></label>' +
        '<input name="proofnote" required maxlength="200" ' +
        'placeholder="예: 11월 3일 계약서 사본 확인"></div>' +
        '<div class="jrow jrow-full"><label>까닭 (기록에 남습니다)</label>' +
        '<input name="fwhy" maxlength="200"></div>' +
        '<div class="jrow jrow-full">' +
        '<button type="submit" class="btn btn-pt">이 금액으로 확정</button></div>' +
      '</form>' +
    '</li>';
  }

  /* ── 입금 · 환수 ──────────────────────────────────────────────── */
  function payRow(d, done){
    var req = D.reqs[d.request_id] || {};
    return '<li data-deal="' + esc(d.id) + '">' +
      '<b>' + esc(pvName(d.provider_id)) + '</b>' + testTag(d.provider_id) +
      '<p class="fe-r">' + esc(req.no || "") +
        ' · 확정 수수료 ' + esc(won(d.fee_total)) + '원' +
        (d.fee_at ? ' · ' + esc(day(d.fee_at)) + ' 확정' : '') +
        (done && d.paid_at
          ? ' · <b>' + esc(won(d.paid)) + '원 들어옴</b> (' + esc(day(d.paid_at)) + ')'
          : '') + '</p>' +
      '<div class="dk-b">' +
        (done ? ''
              : '<button type="button" class="btn btn-sm btn-pri" data-pay="' +
                esc(d.id) + '">입금 확인</button>') +
        '<button type="button" class="btn btn-sm btn-line" data-claw="' +
        esc(d.id) + '">환수 · 부분환불</button>' +
      '</div>' +
      (done ? '' :
      '<form class="jform pay-f" hidden>' +
        '<div class="jrow"><label>실제 입금액(원) <b>*</b></label>' +
        '<input name="paid" inputmode="numeric" required value="' +
        esc(d.fee_total === null || d.fee_total === undefined
              ? "" : String(d.fee_total)) + '"></div>' +
        '<div class="jrow"><label>까닭 (기록에 남습니다)</label>' +
        '<input name="pwhy" maxlength="200"></div>' +
        '<div class="jrow jrow-full">' +
        '<button type="submit" class="btn btn-pt">입금으로 적기</button></div>' +
      '</form>') +
      /* ⚠️⚠️ **확정했던 액을 갈아 치우지 않습니다** — 차액이 기록으로
         남습니다 (0003). 그래서 사유가 **반드시** 있어야 합니다. */
      '<form class="jform claw-f" hidden>' +
        '<div class="jrow"><label>고칠 수수료(원) <b>*</b></label>' +
        '<input name="newfee" inputmode="numeric" required></div>' +
        '<div class="jrow jrow-full"><label>환수 사유 <b>*</b></label>' +
        '<input name="cwhy" required maxlength="200"></div>' +
        '<div class="jrow jrow-full">' +
        '<button type="submit" class="btn btn-line">환수로 적기</button></div>' +
      '</form>' +
    '</li>';
  }

  /* ── 월 정산서 ───────────────────────────────────────────────── */
  var SET_ST = { wait:{ name:"입금 대기", tone:"warn" },
                 paid:{ name:"입금 완료", tone:"grn"  },
                 hold:{ name:"보류",      tone:"bad"  } };
  function setRow(s){
    /* ⚠️ 모르는 상태는 **키 그대로** 냅니다 (빈 칸을 두지 않습니다) */
    var st = SET_ST[s.state] || { name:String(s.state || ""), tone:"ink" };
    return '<li data-sett="' + esc(s.id) + '">' +
      '<b>' + esc(pvName(s.provider_id)) + '</b>' + testTag(s.provider_id) +
      ' <span class="dk-st dk-' + esc(st.tone) + '">' + esc(st.name) + '</span>' +
      '<p class="fe-r">' + esc(s.from_date || "") + ' ~ ' + esc(s.to_date || "") +
        ' · 확정 합계 ' + esc(won(s.total)) + '원' +
        (s.paid_at ? ' · ' + esc(day(s.paid_at)) + ' 입금' : '') + '</p>' +
      '<div class="dk-b">' +
        (s.state === "paid"
          /* ⚠️⚠️ 들어온 돈을 보류로 덮지 않습니다 (문도 거절합니다) */
          ? ''
          : '<button type="button" class="btn btn-sm btn-line" data-hold="' +
            esc(s.id) + '" data-to="' + (s.state === "hold" ? "off" : "on") + '">' +
            (s.state === "hold" ? "보류 풀기" : "보류하기") + '</button>') +
      '</div>' +
      '<form class="jform hold-f" hidden>' +
        '<div class="jrow jrow-full"><label>보류 사유 <b>*</b></label>' +
        '<input name="hwhy" required maxlength="200"></div>' +
        '<div class="jrow jrow-full">' +
        '<button type="submit" class="btn btn-line">보류로 적기</button></div>' +
      '</form>' +
    '</li>';
  }

  function makeForm(){
    var opts = Object.keys(D.pvs).sort(function(a, b){
      return String(D.pvs[a].name).localeCompare(String(D.pvs[b].name), "ko");
    }).map(function(id){
      return '<option value="' + esc(id) + '">' + esc(D.pvs[id].name) +
             (D.pvs[id].is_test ? " (검사용)" : "") + '</option>';
    }).join("");
    if(!opts)
      return '<p class="myhint">등록된 업체가 없어 정산서를 만들 수 없습니다.</p>';
    return '<form class="jform" id="setf">' +
      '<div class="jrow"><label for="sf-pv">업체 <b>*</b></label>' +
      '<select id="sf-pv" name="pv" required>' + opts + '</select></div>' +
      '<div class="jrow"><label for="sf-a">시작일 <b>*</b></label>' +
      '<input id="sf-a" name="from" type="date" required></div>' +
      '<div class="jrow"><label for="sf-b">끝일 <b>*</b></label>' +
      '<input id="sf-b" name="to" type="date" required></div>' +
      '<div class="jrow jrow-full"><label for="sf-w">까닭 (기록에 남습니다)</label>' +
      '<input id="sf-w" name="swhy" maxlength="200"></div>' +
      '<div class="jrow jrow-full">' +
      '<button type="submit" class="btn btn-pt">이 기간으로 정산서 만들기</button></div>' +
    '</form>';
  }

  function tabs(n1, n2, n3){
    return '<div class="bz-tabs" role="tablist">' +
      [["fix","수수료 확정", n1], ["paid","입금 · 환수", n2],
       ["settle","월 정산서", n3]].map(function(t){
        return '<button type="button" class="btn btn-sm ' +
          (TAB === t[0] ? "btn-pri" : "btn-line") + '" data-ftab="' + t[0] + '" ' +
          'aria-selected="' + (TAB === t[0] ? "true" : "false") + '" role="tab">' +
          esc(t[1]) + ' ' + esc(String(t[2])) + '</button>';
      }).join("") + '</div>';
  }

  function body(fix, wait, done){
    if(TAB === "fix")
      return fix.length
        ? '<ul class="fe-p">' + fix.map(fixRow).join("") + '</ul>'
        /* ⚠️ 0건은 고장이 아닙니다 — 왜 비었는지 같이 적습니다 */
        : '<p class="myhint">확정할 수수료가 없습니다 — ' +
          '<b>서비스 완료</b>가 된 계약만 여기 올라옵니다.</p>';
    if(TAB === "paid")
      return (wait.length
        ? '<ul class="fe-p">' + wait.map(function(d){ return payRow(d, false); }).join("") + '</ul>'
        : '<p class="myhint">입금을 기다리는 건이 없습니다.</p>') +
        '<h3 class="mj-sh">입금이 끝난 것</h3>' +
        (done.length
          ? '<ul class="fe-p">' + done.map(function(d){ return payRow(d, true); }).join("") + '</ul>'
          : '<p class="myhint">아직 없습니다.</p>');
    return makeForm() +
      '<h3 class="mj-sh">만들어 둔 정산서</h3>' +
      (D.setts.length
        ? '<ul class="fe-p">' + D.setts.map(setRow).join("") + '</ul>'
        : '<p class="myhint">아직 만든 정산서가 없습니다.</p>');
  }

  function paint(){
    /* ⚠️⚠️ 제목을 변수로 뽑지 않습니다 — check-safe 가 innerHTML 에
       **변수**를 넣는 줄을 잡습니다. */
    if(!D){
      box.innerHTML = '<h2 class="adm-h">' + icon("coin", 19) + '수수료 · 정산</h2>' +
        '<p class="lmsg">읽지 못했습니다. ' +
        '<button class="btn btn-sm btn-line" data-do="again">다시 읽기</button></p>';
      return;
    }
    var fix = [], wait = [], done = [];
    D.deals.forEach(function(d){
      var st = (D.reqs[d.request_id] || {}).state;
      /* ⚠️⚠️ **문이 보는 것과 같은 값으로 가릅니다** — 0003 은
         `request.state` 를 봅니다(`done` → 확정 · `fee_wait` → 입금).
         `fee_at` 으로 가르면 화면에는 단추가 있고 DB 가 거절합니다. */
      if(st === "done")      fix.push(d);
      else if(st === "fee_wait") wait.push(d);
      else if(st === "fee_done") done.push(d);
    });
    box.hidden = false; box.className = "deskbox";
    box.innerHTML = '<h2 class="adm-h">' + icon("coin", 19) + '수수료 · 정산</h2>' +
      '<p class="myhint">⚠️ 수수료를 확정하면 업체 작업실에 그대로 보입니다. ' +
      '확정한 금액 · 증빙 · 까닭은 <b>기록에 남고 지울 수 없습니다</b>. ' +
      '입금은 <b>실제로 들어온 뒤에만</b> 적습니다.</p>' +
      tabs(fix.length, wait.length, D.setts.length) +
      '<div class="bz-body">' + body(fix, wait, done) + '</div>' +
      '<p class="fee-m lmsg" hidden></p>';
  }

  function say(t){
    var m = box.querySelector(".fee-m");
    if(m){ m.hidden = false; m.textContent = t; }
  }

  function load(){
    return Promise.all([
      get("deal?select=id,request_id,provider_id,amount,fee,fee_vat,fee_total," +
          "paid,paid_at,fee_at,signed_at,done_at&order=signed_at.desc&limit=200"),
      get("request?select=id,no,state&limit=500"),
      get("provider?select=id,name,is_test&order=name.asc&limit=300"),
      get("fee_policy?select=id,provider_id,type,flat,rate,min_fee,max_fee,vat," +
          "confirm_when,cycle,from_date,to_date&active=is.true&limit=300"),
      get("settlement?select=id,provider_id,from_date,to_date,total,state," +
          "approved_at,paid_at&order=to_date.desc&limit=100")
    ]).then(function(r){
      /* ⚠️ 못 읽은 것(null)과 0건은 다릅니다 — 못 읽었으면 그렇게 말합니다 */
      if(!r[0] || !r[1] || !r[2]){ D = null; return paint(); }
      D = { deals:r[0], reqs:{}, pvs:{}, pols:{}, setts:r[4] || [] };
      r[1].forEach(function(q){ D.reqs[q.id] = q; });
      r[2].forEach(function(p){ D.pvs[p.id] = p; });
      /* ⚠️ 한 업체에 정책이 여럿일 수 있습니다 — **가장 최근 것**을
         씁니다 (기간이 겹치면 사람이 보고 고칠 수 있게 칸을 엽니다). */
      (r[3] || []).forEach(function(f){
        if(!D.pols[f.provider_id]) D.pols[f.provider_id] = f;
      });
      paint();
    });
  }

  function toggle(li, sel){
    var f = li.querySelector(sel);
    if(f) f.hidden = !f.hidden;
    return f;
  }

  box.addEventListener("click", function(e){
    var t = e.target.closest ? e.target : null;
    if(!t) return;
    var tb = t.closest("button[data-ftab]");
    if(tb){ TAB = tb.getAttribute("data-ftab"); return paint(); }
    if(t.closest("button[data-do='again']")) return load();
    var fx = t.closest("button[data-fix]");
    if(fx) return void toggle(fx.closest("li"), ".fee-f");
    var py = t.closest("button[data-pay]");
    if(py) return void toggle(py.closest("li"), ".pay-f");
    var cw = t.closest("button[data-claw]");
    if(cw) return void toggle(cw.closest("li"), ".claw-f");
    var hd = t.closest("button[data-hold]");
    if(hd){
      /* ⚠️ 보류를 **푸는** 데에는 사유를 안 받습니다 (문도 안 받습니다) —
         거는 쪽만 받습니다. 그래서 양식을 안 엽니다. */
      if(hd.getAttribute("data-to") === "off"){
        hd.disabled = true; say("보내는 중입니다…");
        return void rpc("hold_settlement", { p_id: hd.getAttribute("data-hold"),
                                             p_hold: false })
          .then(load).catch(function(err){ hd.disabled = false; say(why(err)); });
      }
      return void toggle(hd.closest("li"), ".hold-f");
    }
  });

  box.addEventListener("submit", function(e){
    var f = e.target;
    if(!f || f.tagName !== "FORM") return;
    e.preventDefault();
    var btn = f.querySelector('button[type="submit"]');
    var li  = f.closest("li");
    var id  = li ? (li.getAttribute("data-deal") || li.getAttribute("data-sett")) : null;
    if(btn) btn.disabled = true;
    say("보내는 중입니다…");
    function fail(err){ if(btn) btn.disabled = false; say(why(err)); }

    if(f.classList.contains("fee-f")){
      var pol = D.pols[(D.deals.filter(function(d){ return d.id === id; })[0] || {}).provider_id];
      /* ⚠️⚠️ **그때의 정책을 사본으로 같이 보냅니다** (§9 — 나중에
         요율이 바뀌어도 이미 확정한 건은 따라 바뀌면 안 됩니다).
         ⚠️ 정책이 없으면 **없었다고** 적습니다 (지어내지 않습니다). */
      return void rpc("confirm_fee", {
        p_deal:  id,
        p_fee:   num(f.fee.value),
        p_vat:   num(f.vat.value),
        p_total: num(f.total.value),
        p_snap:  pol ? { policy: pol, line: window.amFeeLine(pol),
                         at: new Date().toISOString() }
                     : { policy: null, at: new Date().toISOString(),
                         note: "적용할 정책이 없어 관리자가 직접 적었습니다" },
        p_proof: { kind: f.proofkind.value, note: f.proofnote.value,
                   at: new Date().toISOString() },
        p_why:   f.fwhy.value || null
      }).then(load).catch(fail);
    }
    if(f.classList.contains("pay-f")){
      return void rpc("mark_paid", { p_deal: id, p_paid: num(f.paid.value),
                                     p_why: f.pwhy.value || null })
        .then(load).catch(fail);
    }
    if(f.classList.contains("claw-f")){
      return void rpc("clawback_fee", { p_deal: id, p_new_fee: num(f.newfee.value),
                                        p_why: f.cwhy.value })
        .then(load).catch(fail);
    }
    if(f.classList.contains("hold-f")){
      return void rpc("hold_settlement", { p_id: id, p_hold: true,
                                           p_why: f.hwhy.value })
        .then(load).catch(fail);
    }
    if(f.id === "setf"){
      return void rpc("build_settlement", { p_provider: f.pv.value,
                                            p_from: f.from.value, p_to: f.to.value,
                                            p_why: f.swhy.value || null })
        .then(load).catch(fail);
    }
    if(btn) btn.disabled = false;
  });

  window.amAuthAsk().then(function(a){
    A = a;
    /* ⚠️ 운영자가 아니면 **한 줄도 안 그리고** 읽으러 가지도 않습니다 —
       돈이 걸린 자리입니다. 0003 · 0013 은 **관리자만** 받습니다
       (직원도 거절합니다 — 계약을 따는 사람과 청구서를 만드는 사람이
       같으면 아무도 교차 확인을 안 합니다). */
    if(!a || !a.on || !a.signedIn || a.role !== "admin") return;
    return load();
  }).catch(function(){});
})();
