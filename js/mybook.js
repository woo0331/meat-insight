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
  function rgName(k){ return REG[k] || String(k || ""); }

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
    var d = new Date(String(iso) + "T00:00:00+09:00");
    if(isNaN(d.getTime())) return String(iso || "");
    var W = ["일","월","화","수","목","금","토"];
    return (d.getMonth() + 1) + "월 " + d.getDate() + "일(" + W[d.getDay()] + ")";
  }
  function hhmm(t){
    var m = /^(\d{2}):(\d{2})/.exec(String(t || ""));
    return m ? (m[1] + ":" + m[2]) : "";
  }

  function row(b){
    var st = window.amTeeBookSt(b.state);
    var fee = window.amTeeFee(b.green_fee);
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
        (fee ? '<span>' + esc(fee) + '</span>' : '') +
      '</p>' +
      /* ⚠️ 업체가 적은 거절 까닭을 **보여 줍니다** — 안 보여 주면 왜
         안 됐는지 알 수 없습니다 (0047 에서 가린 까닭을 낸 그 까닭). */
      (b.why ? '<p class="mb-w">업체가 적은 까닭 — ' + esc(b.why) + '</p>' : '') +
      (b.state === "applied" || b.state === "confirmed"
        ? '<div class="dk-b">' +
          '<button type="button" class="btn btn-sm btn-bad mb-x">신청 취소</button>' +
          '</div>'
        : '') +
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

  function reload(){
    return get("v_teebook_mine?select=id,tee_id,people,memo,state,why," +
               "created_at,kind,region,course,play_at,tee_at,holes,green_fee," +
               "provider_id,provider_name,tel&order=play_at.asc&limit=100")
      .then(function(rows){ ROWS = rows || []; paint(); });
  }

  box.addEventListener("click", function(e){
    var t = e.target;
    if(!t || !t.closest || !A) return;
    var b = t.closest(".mb-x");
    if(!b) return;
    var li = b.closest("li[data-bk]");
    if(!li) return;
    /* ⚠️ 되돌릴 수 없는 일이라 한 번 여쭙습니다 */
    if(!window.confirm("이 예약 신청을 취소할까요?")) return;
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
