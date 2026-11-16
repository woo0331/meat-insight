/* ════════════════════════════════════════════════════════════════════
   내가 신청한 예약 — /my 에서만 돕니다 (DB 는 0060)

   ⚠️⚠️⚠️ **0045 가 답을 받는 자리까지 세워 두고 그 답을 읽는 화면을
   안 만든** 자리를 되풀이하지 않습니다. 업체가 확정 · 거절한 결과를
   손님이 **여기서** 봅니다 — 없으면 신청은 들어가는데 어떻게 됐는지
   아무 데서도 못 보는 꼴이 됩니다.

   ⚠️⚠️ **말이 두 벌입니다** — 업체의 `name`("새 신청" · "확정함")과
   손님의 `mine`("업체가 확정했습니다"). 운영자 · 업체에게 할 말을 손님
   화면에 찍으면 절대 규칙 3 입니다. 여기서는 **`mine` 만** 씁니다.

   ⚠️ 상호와 전화번호는 **업체가 공개한 값**입니다 (사업자 정보이거나
   업체가 적은 예약 문의 번호 — 배정 담당자 직통이 아닙니다 · 0013).

   ⚠️ 0건이면 **한 줄도 안 그립니다** — 예약을 신청한 적 없는 분께
   빈 상자를 두지 않습니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("bkbox");
  if(!box || !window.amAuthAsk) return;

  var esc = window.esc, icon = window.icon;
  var A = null, ROWS = [];

  var REG = {};
  (window.AM_REGIONS || []).forEach(function(r){ REG[r.key] = r.name; });
  /* ⚠️⚠️ **못 찾은 키를 그대로 찍지 않습니다**(지시 6번 · 2026-11-12).
     중립 문구를 내고 누락은 `console.warn` 으로 운영자에게만 갑니다. */
  function rgName(k){
    return window.amKeyName ? window.amKeyName(REG, k, "지역") : "";
  }

  function get(path){
    return fetch(A.conf.url + "/rest/v1/" + path, {
      headers: Object.assign({ apikey:A.conf.anonKey },
                             window.amAuthHeaders ? window.amAuthHeaders() : {})
    }).then(function(r){ return r.ok ? r.json() : null; })
      .catch(function(){ return null; });
  }
  function call(fn, p){
    return fetch(A.conf.url + "/rest/v1/rpc/" + fn, {
      method:"POST",
      headers: Object.assign({ "content-type":"application/json", apikey:A.conf.anonKey },
                             window.amAuthHeaders ? window.amAuthHeaders() : {}),
      body: JSON.stringify({ p: p })
    }).then(function(r){
      return r.text().then(function(t){
        if(!r.ok){ var m = t; try{ m = JSON.parse(t).message || t; }catch(_){}
                   throw new Error(m); }
        try{ return JSON.parse(t); }catch(_){ return t; }
      });
    });
  }
  function day(iso){
    /* ⚠⚠⚠ **글자를 그대로 읽습니다** — 전에는 `"+09:00"` 으로 지어 놓고
       `getMonth()` · `getDate()` 로 꺼냈는데, 그 둘은 **보는 분 기계의
       시간대**로 돌려줍니다. 한국 밖(또는 시간대가 UTC 인 기계)에서
       보시면 **하루 앞으로** 찍혔습니다 — 11-08 자리가 "11월 7일" 로
       보였고, 그러면 손님이 **다른 날짜를 예약**하십니다.
       지금은 `Z` 로 읽고 `getUTC*` 로 꺼냅니다 — 보는 분의 시간대가
       어디든 **적힌 그 날짜 그대로** 나옵니다. */
    var d = new Date(String(iso) + "T00:00:00Z");
    if(isNaN(d.getTime())) return String(iso || "");
    var W = ["일","월","화","수","목","금","토"];
    return (d.getUTCMonth() + 1) + "월 " + d.getUTCDate() + "일(" + W[d.getUTCDay()] + ")";
  }
  function hhmm(t){
    var m = /^(\d{2}):(\d{2})/.exec(String(t || ""));
    return m ? (m[1] + ":" + m[2]) : "";
  }

  function kstToday(){ return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10); }
  /* 0085 — 신청하신 때의 조건(snap)이 있으면 **그것을** 보여 드립니다. 업체가 나중에 값을 바꿔도
     이 신청의 조건은 안 바뀝니다. 칸이 없는 DB(0085 전)면 지금 게시 값 그대로입니다. */
  function snapHtml(b){
    var s = b.snap;
    if(!s || typeof s !== "object" || !Object.keys(s).length) return "";
    var unit = window.amTeeUnit ? window.amTeeUnit(s.price_unit) : "1인";
    var fee = window.amTeeFee(s.green_fee);
    return '<p class="mb-w">신청하신 때 조건 — ' +
      (fee ? '그린피 ' + esc(fee) + ' (' + esc(unit) + ' 기준) · ' : '') +
      '카트 ' + esc(window.amTeeCost(s.cart_rule, s.cart_fee)) + ' · 캐디 ' + esc(window.amTeeCost(s.caddie_rule, s.caddie_fee)) +
      '</p>' + (s.cancel_terms ? '<p class="mb-w">취소 · 변경 — ' + esc(s.cancel_terms) + '</p>' : '');
  }
  function resultHtml(b){
    if(b.state !== "confirmed" || b.outcome === undefined) return "";
    if(String(b.play_at) > kstToday()) return "";
    var oc = window.amTeeOutcome ? window.amTeeOutcome(b.outcome) : null;
    return '<p class="mb-w">이용 결과 — ' + esc(oc ? oc.name : "") +
      (b.cus_result ? ' (내 표시: ' + esc(b.cus_result === "used" ? "이용함" : "이용 안 함") + ')' : '') + '</p>' +
      (b.cus_result ? '' :
        '<div class="dk-b"><button type="button" class="btn btn-sm btn-line mb-mk" data-r="used">이용했습니다</button>' +
        '<button type="button" class="btn btn-sm btn-line mb-mk" data-r="notused">이용하지 않았습니다</button></div>');
  }
  function row(b){
    var st = window.amTeeBookSt(b.state);
    var fee = window.amTeeFee(b.green_fee);
    /* 라운드 날짜가 지나면 취소로 바꾸지 않습니다(서버도 막습니다 · 결과가 사라지지 않게) */
    var canCancel = (b.state === "applied" || b.state === "confirmed") && String(b.play_at) >= kstToday();
    return '<li data-bk="' + esc(b.id) + '">' +
      '<p class="mb-h"><b>' + esc(day(b.play_at)) + '</b>' +
        (hhmm(b.tee_at) ? ' ' + esc(hhmm(b.tee_at)) : '') +
        ' · ' + esc(b.course) +
        '<span class="tt-st tone-' + esc(st.tone) + '">' +
        /* ⚠️⚠️ **손님 말**로 적습니다 (`name` 이 아니라 `mine`) */
        esc(window.amTeeBookMine(b.state)) + '</span></p>' +
      '<p class="mb-m">' +
        '<span>' + esc(b.provider_name) + '</span>' +
        (b.tel ? '<a href="tel:' + esc(b.tel) + '">' + esc(b.tel) + '</a>' : '') +
        '<span>' + esc(rgName(b.region)) + '</span>' +
        '<span>' + esc(String(b.people)) + '명</span>' +
        (fee && !(b.snap && b.snap.green_fee !== undefined) ? '<span>' + esc(fee) + '</span>' : '') +
      '</p>' +
      snapHtml(b) +
      /* ⚠️ 업체가 적은 거절 까닭을 **보여 줍니다** — 안 보여 주면 왜
         안 됐는지 알 수 없습니다 (0047 에서 가린 까닭을 낸 그 까닭). */
      (b.why ? '<p class="mb-w">업체가 적은 까닭 — ' + esc(b.why) + '</p>' : '') +
      (canCancel
        ? '<div class="dk-b">' +
          '<button type="button" class="btn btn-sm btn-bad mb-x">' + (b.state === "confirmed" ? "예약 취소" : "신청 취소") + '</button>' +
          '</div>'
        : ((b.state === "applied" || b.state === "confirmed")
            ? '<p class="mb-w">라운드 날짜가 지나 여기서 취소할 수 없습니다 — 바꿀 일이 있으면 업체에 직접 알려 주세요.</p>' : '')) +
      resultHtml(b) +
    '</li>';
  }

  function paint(){
    /* ⚠️ 0건이면 **한 줄도 안 그립니다** */
    if(!ROWS.length){ box.hidden = true; box.innerHTML = ""; return; }
    box.hidden = false; box.className = "deskbox";
    box.innerHTML = '<h2 class="adm-h">' + icon("cal", 19) + '내가 신청한 예약</h2>' +
      '<p class="myhint">⚠️ <b>신청</b>은 예약이 잡힌 것이 아닙니다 — ' +
      '업체가 확인하고 <b>확정</b>해야 자리가 잡힙니다. 골프올인원은 ' +
      '거래 당사자가 아니며 결제를 받지 않습니다.</p>' +
      '<ul class="mb-l">' + ROWS.map(row).join("") + '</ul>' +
      '<p class="mb-msg lmsg" hidden></p>';
  }

  /* ⚠️ 0085 의 칸(신청 당시 조건 · 결과)을 먼저 묻고, 그 DB 가 아직 0085 전이면 예전 칸으로 다시 묻습니다 */
  var COLS0 = "id,tee_id,people,memo,state,why,created_at,kind,region,course,play_at,tee_at,holes,green_fee," +
              "provider_id,provider_name,tel";
  function reload(){
    var q = "&order=play_at.asc&limit=100";
    return get("v_teebook_mine?select=" + COLS0 + ",snap,pv_result,cus_result,outcome" + q)
      .then(function(rows){ return rows ? rows : get("v_teebook_mine?select=" + COLS0 + q); })
      .then(function(rows){ ROWS = rows || []; paint(); });
  }

  box.addEventListener("click", function(e){
    var t = e.target;
    if(!t || !t.closest || !A) return;
    var mk = t.closest(".mb-mk");
    if(mk){
      var ml = mk.closest("li[data-bk]"); if(!ml) return;
      mk.disabled = true;
      call("mark_teebook", { id: ml.getAttribute("data-bk"), result: mk.getAttribute("data-r") })
        .then(reload)
        .catch(function(err){
          mk.disabled = false;
          var m0 = box.querySelector(".mb-msg");
          if(m0){ m0.hidden = false; m0.textContent = window.amErrText ? window.amErrText(err) : String(err.message || err); }
        });
      return;
    }
    var b = t.closest(".mb-x");
    if(!b) return;
    var li = b.closest("li[data-bk]");
    if(!li) return;
    /* ⚠️ 되돌릴 수 없는 일이라 한 번 여쭙습니다 */
    if(!window.confirm("이 예약 신청을 취소할까요? 취소 · 변경 조건은 신청하신 때의 조건을 따릅니다.")) return;
    b.disabled = true;
    call("move_teebook", { id: li.getAttribute("data-bk"), state:"canceled" })
      .then(reload)
      .catch(function(err){
        b.disabled = false;
        var m = box.querySelector(".mb-msg");
        if(m){ m.hidden = false; m.textContent = String(err.message || err); }
      });
  });

  window.amAuthAsk().then(function(a){
    if(!a || !a.on || !a.signedIn) return;   /* 로그인 전에는 안 그립니다 */
    A = a;
    return reload();
  }).catch(function(){});
})();
