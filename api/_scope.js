/* 매장 정리 상담 (form = "close") 의 초기 운영 범위 — 2026-11-18 STOREWAY 1차

   ⚠️⚠️ 화면(js/data/closescope.js)과 **같은 값**이어야 합니다.
   build-pages.js 의 checkCloseScope() 가 빌드마다 둘을 맞춰 봅니다.
   한쪽만 고치면 화면은 "연결됩니다" 라고 하는데 서버가 거절하거나,
   반대로 화면이 막는 지역을 서버가 받습니다.

   ⚠️ 초기 대상은 안양 · 군포 · 의왕입니다. 업종은 음식점 · 카페가 주
   대상이지만 **막지는 않습니다** — 철거 · 집기 처분은 업종을 가리지
   않고, 막으면 연결할 수 있는 손님을 돌려보냅니다. 지역만 막습니다
   (그 밖은 실제로 연결할 업체가 없습니다).
   ⚠️ 서비스는 정리에 쓰는 분류 다섯의 것만 받습니다 — 이 접수 길로
   인테리어 견적이 들어오면 일반 견적 접수(quote)가 닫혀 있는데도 그
   접수가 열린 셈이 됩니다. */
const CLOSE_SCOPE = {
  region: "gyeonggi",
  regionName: "경기",
  gu: ["안양시", "군포시", "의왕시"],
  cats: ["transfer", "asset", "demolish", "restore", "waste"],
  focusInd: ["restaurant", "cafe"]
};

/* 손님에게 보이는 말 — 화면과 같은 글자 */
const OUT_SAY = "지금은 안양시 · 군포시 · 의왕시의 매장만 연결해 드립니다. 다른 지역은 아직 연결할 업체가 없어 접수하지 않습니다.";

function inArea(regionKey, regionName, gu){
  const okReg = regionKey === CLOSE_SCOPE.region || regionName === CLOSE_SCOPE.regionName;
  return okReg && CLOSE_SCOPE.gu.indexOf(String(gu || "").trim()) >= 0;
}
function svcOk(id){
  const cat = String(id || "").split("/")[0];
  return CLOSE_SCOPE.cats.indexOf(cat) >= 0;
}

module.exports = { CLOSE_SCOPE, OUT_SAY, inArea, svcOk };
