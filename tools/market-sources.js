/* ════════════════════════════════════════════════════════════════════
   축평원 시세를 어디서 어떻게 가져오는가 — **이 파일 한 곳**에만 적습니다.

   ⚠️ 운영자가 확인해야 하는 곳입니다.
      축평원·공공데이터포털은 키를 발급받아야 부를 수 있고, 엔드포인트
      이름과 파라미터는 기관이 바꾸기도 합니다. 개발 환경에서는 두 곳 모두
      막혀 있어 실제 응답을 확인하지 못했습니다 — 그래서 **응답 모양을
      추측해서 박아 두지 않고**, 받은 것을 그대로 보여주는 --probe 를
      먼저 돌리게 만들었습니다.

        node tools/market-sync.js --probe
        → 받은 응답이 그대로 찍힙니다. 그걸 보고 아래 pick/map 만 맞추면 됩니다.

   숫자를 지어내지 않는다(CLAUDE.md 3번)는 규칙이 여기에도 걸립니다.
   파싱이 안 되면 **0건으로 끝내고 실패로 알립니다.** 비슷한 값을 만들어
   넣지 않습니다.
   ════════════════════════════════════════════════════════════════════ */

"use strict";

/* market_prices.category 가 쓰는 값 — 17_market.js 의 MK_CATS 와 같아야 합니다 */
const CATS = { beef:"한우·소", pork:"돼지", byproduct:"부산물", import:"수입육" };

/* 축종 코드/이름을 우리 분류로 옮깁니다. 모르는 값은 버리지 않고 etc 로 둡니다
   — 화면에서는 분류 탭에 안 뜨지만 목록에는 남습니다. */
function toCat(v){
  const s = String(v == null ? "" : v);
  if (/한우|육우|소|牛|beef|^1$/i.test(s)) return "beef";
  if (/돼지|한돈|豚|pork|^2$/i.test(s))    return "pork";
  if (/부산물|내장|byproduct/i.test(s))     return "byproduct";
  if (/수입|import/i.test(s))               return "import";
  return "etc";
}

/* 응답 어디에 목록이 들어 있는지 — 기관마다 다릅니다.
   흔한 모양을 차례로 시도하고, 못 찾으면 null 을 돌려줍니다(=실패). */
function pickRows(json){
  if (Array.isArray(json)) return json;
  const tries = [
    j => j && j.response && j.response.body && j.response.body.items && j.response.body.items.item,
    j => j && j.response && j.response.body && j.response.body.items,
    j => j && j.body && j.body.items && j.body.items.item,
    j => j && j.data,
    j => j && j.items,
    j => j && j.list,
    j => j && j.result,
  ];
  for (const f of tries){
    let v; try { v = f(json); } catch(e){ v = null; }
    if (Array.isArray(v)) return v;
    if (v && typeof v === "object") return [v];
  }
  return null;
}

/* 한 줄을 market_prices 한 행으로. 칸 이름이 기관마다 달라서 후보를 나열합니다. */
function firstOf(row, keys){
  for (const k of keys){
    if (row && row[k] != null && String(row[k]).trim() !== "") return row[k];
  }
  return null;
}
function num(v){
  if (v == null) return null;
  const n = Number(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}
/* YYYYMMDD · YYYY-MM-DD · YYYY.MM.DD 를 전부 받습니다 */
function toDate(v){
  const s = String(v == null ? "" : v).replace(/[^0-9]/g, "");
  if (s.length !== 8) return null;
  return s.slice(0,4) + "-" + s.slice(4,6) + "-" + s.slice(6,8);
}

function mapRow(row, sourceName){
  const item  = firstOf(row, ["item","itemName","prdlstNm","GRADE_NM","kindNm","mtrlNm","name","품목"]);
  const grade = firstOf(row, ["grade","gradeNm","judgeGradeNm","등급"]);
  const price = num(firstOf(row, ["price","avgPrice","auctionPrice","cost","경락가","평균가"]));
  const date  = toDate(firstOf(row, ["price_date","date","judgeDate","auctionDate","stdDt","baseDate","기준일"]));
  const cat   = toCat(firstOf(row, ["category","lmDiv","kind","축종","species"]) || item);

  if (!item || price == null || !Number.isFinite(price) || price <= 0) return null;
  return {
    category: cat,
    item: String(item).trim(),
    grade: grade ? String(grade).trim() : null,
    price,
    unit: "원/kg",
    price_date: date,             /* 없으면 부르는 쪽에서 오늘로 채웁니다 */
    source: sourceName,
  };
}

/* ── 가져올 곳 ──────────────────────────────────────────────────────
   url(key, ymd) 는 문자열 하나를 돌려줍니다. 키는 환경변수에서 옵니다.
   ⚠️ 아래 두 주소는 **확인이 필요합니다.** --probe 로 한 번 받아 보고
      맞지 않으면 이 줄만 고치면 됩니다. */
const SOURCES = {
  /* 공공데이터포털 — 축산물품질평가원 축산유통정보 */
  kape: {
    name: "축산물품질평가원",
    needsKey: "KAPE_KEY",
    url(key, ymd){
      const d = ymd.replace(/-/g, "");
      return "https://apis.data.go.kr/B552895/openapi/service/OpenAPIService/getMeatPriceInfo"
           + "?serviceKey=" + encodeURIComponent(key)
           + "&pageNo=1&numOfRows=500&_type=json"
           + "&baseDate=" + d;
    },
  },
  /* 축산유통정보(ekapepia) 직접 — 별도 키 */
  ekape: {
    name: "축산유통정보",
    needsKey: "EKAPE_KEY",
    url(key, ymd){
      const d = ymd.replace(/-/g, "");
      return "https://www.ekapepia.com/openapi/json/priceAuction.do"
           + "?authKey=" + encodeURIComponent(key)
           + "&stdt=" + d + "&eddt=" + d;
    },
  },
};

module.exports = { CATS, SOURCES, pickRows, mapRow, toCat, toDate, num, firstOf };
