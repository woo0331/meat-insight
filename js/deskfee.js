/* ════════════════════════════════════════════════════════════════════
   업체가 보는 **수수료 · 정산 내역** — /desk 의 한 자리 (2차 지시서 §7)

   ⚠️⚠️ **고객은 이 표를 아예 못 봅니다** (0001 의 `fee_mine` ·
   `deal_mine`). 우리와 업체 사이의 일인데 손님에게 보이면 **자기가
   내는 돈**으로 읽힙니다. 그래서 이 자리는 `/desk` 에만 있고, RLS 가
   업체 자기 줄만 내줍니다 — 화면이 또 거르지 않습니다.

   ⚠️⚠️ **네 칸을 갈라서 보여 줍니다** (0001 의 deal 머리말 · §9) —
     계약금액 · 수수료 확정액 · 부가세 · 실제 입금액.
   하나로 합치면 "얼마를 확정했다가 얼마를 받았는가" 가 사라집니다.

   ⚠️⚠️ **안 적힌 것과 0원은 다릅니다.** 수수료가 `null` 이면 **아직
   확정 전**이고, `0` 이면 **무상**입니다 — `||` 로 지우면 둘이 같아
   집니다. 화면이 그 둘을 다른 말로 냅니다.

   ⚠️ **합계는 저장하지 않고 계산합니다** (절대 규칙 1). 숫자로 들고
   있으면 누군가 그 칸에 다른 값을 적어 넣습니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("feebox");
  if(!box || !window.amAuthAsk) return;

  var A = null, PV = null;

  function get(q){
    return fetch(A.conf.url + "/rest/v1/" + q, {
      headers: Object.assign({ apikey: A.conf.anonKey }, window.amAuthHeaders())
    }).then(function(r){ return r.ok ? r.json().catch(function(){ return null; }) : null; })
      .catch(function(){ return null; });
  }

  /* ⚠️ 안 적힌 것은 **"아직"** 입니다 — 0원이 아닙니다. */
  function money(v){
    if(v === null || v === undefined) return "아직";
    return won(Number(v)) + "원";
  }
  function day(iso){
    if(!iso) return "";
    var d = new Date(iso);
    if(isNaN(d.getTime())) return String(iso);
    var k = new Date(d.getTime() + 9 * 3600 * 1000);
    return k.getUTCFullYear() + "-" +
      String(k.getUTCMonth() + 1).padStart(2, "0") + "-" +
      String(k.getUTCDate()).padStart(2, "0");
  }

  function load(){
    return Promise.all([
      /* ⚠️ RLS 가 자기 줄만 내줍니다 — provider_id 를 적는 것은
         자물쇠 두 겹입니다 (하나가 내려가도 다른 것이 남습니다). */
      get("deal?select=id,request_id,amount,fee,fee_vat,fee_total,paid,paid_at," +
          "fee_at,signed_at,done_at&provider_id=eq." + encodeURIComponent(PV) +
          "&order=signed_at.desc&limit=100"),
      get("settlement?select=id,from_date,to_date,total,state,paid_at,approved_at" +
          "&provider_id=eq." + encodeURIComponent(PV) +
          "&order=to_date.desc&limit=50"),
      get("fee_policy?select=id,type,flat,rate,min_fee,max_fee,vat,confirm_when," +
          "cycle,refund_rule,from_date,to_date&provider_id=eq." +
          encodeURIComponent(PV) + "&active=is.true&limit=20"),
      get("request?select=id,no&limit=100")
    ]);
  }

  function policyBlock(pol){
    if(!pol.length)
      /* ⚠️ 0건은 고장이 아닙니다 — 0 이라고 말하고 **막다른 길로
         두지 않습니다** (무엇을 해야 하는지 같이 적습니다). */
      return '<p class="myhint">아직 정해진 수수료 정책이 없습니다. ' +
        '지어낸 값이 아닙니다 — 정책이 정해지면 여기에 뜹니다.</p>';
    return '<ul class="fe-p">' + pol.map(function(f){
      var when = (f.from_date || f.to_date)
        ? (esc(f.from_date || "") + " ~ " + esc(f.to_date || "계속")) : "";
      return '<li><b>' + esc(window.amFeeLine(f)) + '</b>' +
        (when ? '<span class="fe-when">' + when + '</span>' : "") +
        (f.min_fee !== null && f.min_fee !== undefined
          ? '<span class="fe-when">최저 ' + esc(won(f.min_fee)) + '원</span>' : "") +
        (f.max_fee !== null && f.max_fee !== undefined
          ? '<span class="fe-when">최고 ' + esc(won(f.max_fee)) + '원</span>' : "") +
        (f.refund_rule ? '<p class="fe-r">' + esc(f.refund_rule) + '</p>' : "") +
      '</li>';
    }).join("") + '</ul>';
  }

  function dealTable(deals, noOf){
    if(!deals.length)
      return '<p class="myhint">아직 계약이 없습니다.</p>';
    return '<div class="doc-t"><table>' +
      '<thead><tr><th scope="col">요청</th><th scope="col">계약일</th>' +
      '<th scope="col">계약금액</th><th scope="col">수수료(부가세 포함)</th>' +
      '<th scope="col">입금</th></tr></thead><tbody>' +
      deals.map(function(d){
        return '<tr><th scope="row">' + esc(noOf[d.request_id] || "—") + '</th>' +
          '<td>' + esc(day(d.signed_at)) + '</td>' +
          '<td>' + esc(money(d.amount)) + '</td>' +
          '<td>' + esc(money(d.fee_total)) +
          (d.fee_at ? '<i class="fe-d">' + esc(day(d.fee_at)) + ' 확정</i>' : "") + '</td>' +
          '<td>' + esc(money(d.paid)) +
          (d.paid_at ? '<i class="fe-d">' + esc(day(d.paid_at)) + '</i>' : "") + '</td>' +
        '</tr>';
      }).join("") + '</tbody></table></div>';
  }

  function settleTable(ss){
    if(!ss.length) return '<p class="myhint">아직 정산 내역이 없습니다.</p>';
    return '<div class="doc-t"><table>' +
      '<thead><tr><th scope="col">기간</th><th scope="col">금액</th>' +
      '<th scope="col">상태</th><th scope="col">지급일</th></tr></thead><tbody>' +
      ss.map(function(x){
        var st = window.amSettleSt(x.state) || { name:x.state, tone:"ink" };
        return '<tr><th scope="row">' + esc(x.from_date + " ~ " + x.to_date) + '</th>' +
          '<td>' + esc(money(x.total)) + '</td>' +
          '<td><span class="dk-st dk-' + esc(st.tone) + '">' +
          esc(st.name) + '</span></td>' +
          '<td>' + esc(day(x.paid_at) || "—") + '</td></tr>';
      }).join("") + '</tbody></table></div>';
  }

  function paint(){
    box.hidden = false; box.className = "deskbox";
    box.innerHTML = '<h2 class="adm-h">수수료 · 정산</h2><p class="lmsg">읽는 중입니다…</p>';
    load().then(function(got){
      var deals = got[0], ss = got[1], pol = got[2], reqs = got[3];
      /* ⚠️⚠️ 하나라도 못 읽었으면 **0건이라고 말하지 않습니다.** */
      if(deals === null || ss === null || pol === null || reqs === null){
        box.innerHTML = '<h2 class="adm-h">수수료 · 정산</h2>' +
          '<p class="lmsg">읽지 못했습니다. ' +
          '<button class="btn btn-sm btn-line" data-do="again">다시 읽기</button></p>';
        return;
      }
      var noOf = {};
      reqs.forEach(function(r){ noOf[r.id] = r.no; });

      /* ⚠️ 합계는 **계산**합니다 (저장하지 않습니다).
         ⚠️⚠️ 아직 확정 안 된 것(null)은 더하지 않고 **따로 셉니다** —
         0 으로 더하면 "확정했는데 0원" 으로 읽힙니다. */
      var feeSum = 0, feeWait = 0, paidSum = 0;
      deals.forEach(function(d){
        if(d.fee_total === null || d.fee_total === undefined) feeWait++;
        else feeSum += Number(d.fee_total);
        if(d.paid !== null && d.paid !== undefined) paidSum += Number(d.paid);
      });

      box.innerHTML = '<h2 class="adm-h">수수료 · 정산</h2>' +
        '<p class="myhint">이 표는 <b>업체와 저희 사이의 것</b>입니다 — ' +
        '손님에게는 보이지 않습니다.</p>' +
        '<div class="cnts">' +
          '<div class="cnt"><dt>계약</dt><dd>' + won(deals.length) + '건</dd></div>' +
          '<div class="cnt"><dt>확정된 수수료</dt><dd>' + won(feeSum) + '원</dd></div>' +
          '<div class="cnt"><dt>입금된 수수료</dt><dd>' + won(paidSum) + '원</dd></div>' +
          (feeWait
            ? '<div class="cnt cnt-t"><dt>아직 확정 전</dt><dd>' +
              won(feeWait) + '건</dd></div>'
            : "") +
        '</div>' +
        '<h3 class="rq-h">지금 적용되는 수수료 정책</h3>' + policyBlock(pol) +
        '<h3 class="rq-h">계약별 수수료</h3>' + dealTable(deals, noOf) +
        '<h3 class="rq-h">정산</h3>' + settleTable(ss) +
        /* ⚠️⚠️ **지킬 수 없는 약속을 하지 않습니다** — 정산일을 적지
           않습니다 (주기는 정책에 적혀 있고, 실제 지급은 사람이 합니다). */
        '<p class="myhint">금액이 다르다고 보이시면 담당자에게 알려 주세요. ' +
        '<b>이 화면에서는 고칠 수 없습니다</b> — 수수료 확정과 입금은 ' +
        '관리자만 적고, 모두 기록에 남습니다.</p>';
    });
  }

  box.addEventListener("click", function(e){
    var b = e.target.closest ? e.target.closest("button[data-do='again']") : null;
    if(b) paint();
  });

  amAuthAsk().then(function(a){
    A = a;
    /* ⚠️ /desk 의 윗자리가 이미 안내합니다 — 같은 말을 두 번 하지
       않습니다 (업체가 아니면 아무것도 그리지 않습니다). */
    if(!a.on || !a.signedIn) return;
    if(a.role !== "provider" || !a.provider) return;
    PV = a.provider;
    paint();
  });
})();
