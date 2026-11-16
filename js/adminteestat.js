/* ════════════════════════════════════════════════════════════════════
   티타임 · 예약 집계 — /admin (0085 의 v_teetime_pv_stats)

   ⚠️⚠️ **건수만** 셉니다 — 업체별 올린 자리 · 신청 · 확정 · 거절 · 손님 취소 · 업체 취소 · 이용 결과.
   그린피 전체를 플랫폼 매출로 세지 않고, 업체의 「이용함」 표시만으로 이용이 확인됐다고 적지 않습니다
   (양쪽 표시가 같을 때만 「양쪽 이용 표시」이고, 다르면 「확인 필요」 · 한쪽만이면 「미확인」입니다).
   ⚠️ 보기의 where 절이 운영자(직원 · 관리자)만 줄을 내줍니다 — 화면은 그 결과만 그립니다.
   ⚠️ 0085 가 운영 DB 에 없으면 보기가 없어 **이 상자를 안 그립니다**(빈 표를 0건으로 보이지 않게).
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("teestatbox");
  if(!box || !window.amAuthAsk) return;
  var esc = window.esc, icon = window.icon;

  function cell(n){ return '<td>' + esc(String(Number(n) || 0)) + '</td>'; }
  function table(rows){
    return '<div class="doc-t"><table><caption class="sr-only">업체별 티타임 · 예약 건수</caption>' +
      '<thead><tr><th scope="col">업체</th><th scope="col">올린 자리</th><th scope="col">받는 중</th>' +
      '<th scope="col">신청</th><th scope="col">새 신청</th><th scope="col">확정</th><th scope="col">거절</th>' +
      '<th scope="col">손님 취소</th><th scope="col">업체 취소</th><th scope="col">양쪽 이용 표시</th>' +
      '<th scope="col">확인 필요</th><th scope="col">결과 미확인</th></tr></thead><tbody>' +
      rows.map(function(r){
        return '<tr><th scope="row">' + esc(r.provider_name || r.provider_id) + '</th>' +
          cell(r.tee_n) + cell(r.tee_live_n) + cell(r.book_n) + cell(r.applied_n) + cell(r.confirmed_n) +
          cell(r.rejected_n) + cell(r.cus_canceled_n) + cell(r.pv_canceled_n) + cell(r.used_n) +
          cell(r.disputed_n) + cell(r.unknown_n) + '</tr>';
      }).join("") + '</tbody></table></div>';
  }
  function paint(rows){
    box.hidden = false; box.className = "deskbox";
    box.innerHTML = '<h2 class="adm-h">' + icon("cal", 19) + '티타임 · 예약 집계</h2>' +
      '<p class="myhint">업체별 <b>건수</b>입니다. 금액은 세지 않습니다 — 그린피는 업체와 손님 사이의 값이고 플랫폼 매출이 아닙니다. ' +
      '「양쪽 이용 표시」는 업체와 손님이 모두 이용했다고 표시한 건이고, 결제나 실제 이용을 저희가 확인한 것은 아닙니다. ' +
      '노쇼 표시만으로 아무도 제재하지 않습니다.</p>' +
      (rows.length ? table(rows) : '<p class="myhint">아직 티타임을 올린 업체가 없습니다.</p>');
  }

  window.amAuthAsk().then(function(a){
    if(!a || !a.on || !a.signedIn || (a.role !== "admin" && a.role !== "staff")) return;
    return fetch(a.conf.url + "/rest/v1/v_teetime_pv_stats?select=*&order=book_n.desc&limit=200", {
      headers: Object.assign({ apikey:a.conf.anonKey }, window.amAuthHeaders ? window.amAuthHeaders() : {})
    }).then(function(r){
      /* 보기가 없으면(0085 전) 안 그립니다 — 그 사실은 운영자 기록에만 */
      if(!r.ok){ try{ console.warn("[adminteestat] v_teetime_pv_stats 를 못 읽었습니다 (" + r.status + ") — 0085 를 올리기 전이면 정상입니다."); }catch(e){} return; }
      return r.json().then(function(rows){ paint(rows || []); });
    });
  }).catch(function(){});
})();
