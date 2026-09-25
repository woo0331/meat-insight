/* ════════════════════════════════════════════════════════════════════
   서비스별 요청서 — 지시서 15번

   서비스마다 **물어봐야 하는 것이 다릅니다.** 덕트는 화구 수를 묻고,
   육류 공급은 월 사용량을 묻습니다. 다 똑같은 칸을 내놓으면 업체는
   결국 전화를 걸어 처음부터 다시 묻게 되고, 그러면 우리가 있는 이유가
   없어집니다.

   `js/data/services.js` 의 각 서비스에 `req` 로 여기 이름을 답니다.
   없으면 `common` 을 씁니다.

   ⚠️ **칸을 늘리지 마세요.** 한 서비스에 네 칸까지입니다. 요청서가
   길어지면 사장님이 중간에 닫습니다 — 그러면 업체도 우리도 아무것도
   못 받습니다. 나머지는 업체가 전화로 물으면 됩니다.

   ⚠️ 전부 **선택**입니다. 필수는 상황·성함·연락처뿐입니다.
   모르는 것을 물어 놓고 못 넘어가게 막으면, 모르셔서 온 분이 못 씁니다.

   type:  pick  — 보기 중 하나        num   — 숫자 (unit 을 오른쪽에)
          text  — 한 줄
   ════════════════════════════════════════════════════════════════════ */

window.WOW_REQ_FORMS = {
  common: [
    { key:"pyeong", label:"평수",     type:"num",  unit:"평" },
    { key:"when",   label:"언제쯤",   type:"pick",
      opts:["지금 급합니다","한 달 안","두세 달 안","아직 알아보는 중"] }
  ],

  meat: [
    { key:"kind",   label:"주로 쓰는 고기", type:"pick",
      opts:["한우","한돈","수입육","섞어서"] },
    { key:"amount", label:"월 사용량",  type:"num",  unit:"kg" },
    { key:"now",    label:"지금 거래처", type:"pick",
      opts:["한 곳만 씁니다","두세 곳 씁니다","아직 없습니다"] },
    { key:"pay",    label:"원하는 결제조건", type:"pick",
      opts:["현금·선결제","외상 15일","외상 30일","상관없습니다"] }
  ],

  interior: [
    { key:"pyeong", label:"평수",      type:"num",  unit:"평" },
    { key:"scope",  label:"어디까지",  type:"pick",
      opts:["전체 신규","전체 리뉴얼","부분 시공","아직 모르겠습니다"] },
    { key:"prev",   label:"점포 상태", type:"pick",
      opts:["신규 점포","기존 음식점 자리","지금 영업 중"] },
    { key:"when",   label:"언제쯤",    type:"pick",
      opts:["지금 급합니다","한 달 안","두세 달 안","아직 알아보는 중"] }
  ],

  duct: [
    { key:"fires",  label:"화구 수",   type:"num",  unit:"개" },
    { key:"pyeong", label:"평수",      type:"num",  unit:"평" },
    { key:"floor",  label:"층 · 건물", type:"text" },
    { key:"why",    label:"왜 부르시나요", type:"pick",
      opts:["냄새 · 민원","배기가 약함","신규 시공","점검만"] }
  ]
};

window.wowReqForm = function(svcKey){
  var s = svcKey ? wowService(svcKey) : null;
  var f = (s && s.req) ? WOW_REQ_FORMS[s.req] : null;
  return f || WOW_REQ_FORMS.common;
};
