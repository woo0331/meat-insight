/* ════════════════════════════════════════════════════════════════════
   고객센터 — 지금 무엇을 받을 수 있는지 말합니다 (4차 지시서 §9)

   ⚠️⚠️ **네 갈래 가운데 셋은 로그인한 뒤에 합니다** (신고 · 분쟁 ·
   개인정보 요청). 로그인이 설정되기 전에는 그 길이 **열리지 않습니다** —
   화면이 "하실 수 있습니다" 라고 먼저 말하면 가 보시고 막히십니다
   (절대 규칙 5).

   ⚠️ 빌드가 찍는 기본 글은 **닫힌 쪽**입니다. 열렸을 때만 이 파일이
   바꿉니다 — 판단은 js/auth.js 의 amAuthAsk().on **한 곳**입니다
   (조건을 두 곳에 적으면 한쪽만 고쳐서 조용히 어긋납니다).

   ⚠️⚠️ 손님 화면에는 **무엇을 설정하라고 적지 않습니다** (절대 규칙 3).
   운영자에게 할 말은 console.warn 으로만 나갑니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("helpnow");
  if(!box || !window.amAuthAsk) return;

  window.amAuthAsk().then(function(a){
    if(!a || !a.on){
      try{ console.warn("[help] 로그인이 설정되지 않아 신고 · 개인정보 요청 " +
        "경로를 닫힌 상태로 둡니다 (Vercel 의 SUPABASE_URL · SUPABASE_ANON_KEY)."); }catch(e){}
      return;                      /* 빌드가 찍어 둔 닫힌 글 그대로 */
    }
    box.className = "hnow hnow-on";
    box.innerHTML =
      '<p><b>신고 · 분쟁과 개인정보 요청은 로그인하신 뒤 내 정보에서 넣으십니다.</b></p>' +
      '<p class="hnow-s">어느 요청 · 어느 업체에 대한 것인지 고르셔야 해서, ' +
      '로그인이 필요합니다.</p>' +
      '<p class="hnow-b"><a class="btn btn-pri" href="/my">내 정보로 가기</a></p>';
  }).catch(function(){ /* 못 물어봤으면 닫힌 글 그대로 둡니다 */ });
})();
