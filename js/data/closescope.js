/* 매장 정리 상담의 초기 운영 범위 — api/_scope.js 와 **같은 값**입니다.
   ⚠️ build-pages.js 의 checkCloseScope() 가 둘을 맞춰 봅니다 (한쪽만
   고치면 빌드가 멈춥니다). 서버가 최종으로 다시 확인합니다. */
window.AM_CLOSE_SCOPE = {
  region: "gyeonggi",
  regionName: "경기",
  gu: ["안양시", "군포시", "의왕시"],
  cats: ["transfer", "asset", "demolish", "restore", "waste"],
  focusInd: ["restaurant", "cafe"]
};
window.AM_CLOSE_OUT_SAY = "지금은 안양시 · 군포시 · 의왕시의 매장만 연결해 드립니다. 다른 지역은 아직 연결할 업체가 없어 접수하지 않습니다.";
