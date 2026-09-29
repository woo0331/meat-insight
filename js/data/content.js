/* ════════════════════════════════════════════════════════════════════
   Content — 창업 · 폐업 과정에 실제로 필요한 정보 (§45)

   ⚠️ **블로그를 만들지 않습니다** (§45 · §54). 검색 수요가 있고
   실제로 그 과정에서 필요한 것만 씁니다 — "카페 창업비용" · "음식점
   철거비" · "상가 원상복구" · "폐업신고" 같은 것들.

   ⚠️⚠️ **금액과 시세를 지어내지 마세요.** "카페 창업비용 5,000만원"
   을 쓰려면 그 숫자를 어디서 세었는지 댈 수 있어야 합니다. 못 대면
   **금액 대신 "무엇이 금액을 가르는가"** 를 씁니다 — 평수 · 지역 ·
   철거 유무 · 시설 인수 여부. 그게 실제로 더 쓸모 있습니다.

   ⚠️ **법령과 제도는 바뀝니다.** 조문을 적을 때는 **어디서 확인하는지**
   를 같이 적습니다 (관할 구청 · 세무서 · 고용노동부).

   ⚠️ 글 끝은 항상 **지금 할 수 있는 일**로 맺습니다 — 관련 업체 ·
   프랜차이즈 · 매물 · 견적으로 이어 줍니다 (§45).

   {
     slug:"", side:"start|close|both", cat:"", industry:"",
     title:"", lead:"", read:5,
     body:[ {h:"", p:["",""], ul:["",""]} ],
     source:[ {name:"", where:""} ],     확인하는 곳
     next:{ cat:"", sub:"", label:"" },  이어지는 곳
     at:"2026-09-29"
   }
   ════════════════════════════════════════════════════════════════════ */

window.AM_CONTENTS = [];

window.amContent = function(slug){
  var r = (window.AM_CONTENTS||[]).filter(function(c){ return c.slug === slug; });
  return r.length ? r[0] : null;
};
window.amContents = function(f){
  f = f || {};
  return (window.AM_CONTENTS||[]).filter(function(c){
    if(f.side     && c.side !== f.side && c.side !== "both") return false;
    if(f.industry && c.industry && c.industry !== f.industry) return false;
    return true;
  });
};
