/* 접수 게이트 — 서버가 최종으로 "지금 받는가" 를 정합니다 (W01 ①).

   ⚠️⚠️ 화면의 WOW_BIZ.sosReady 는 단추를 그리는 설정일 뿐입니다.
   이 주소로 직접 보내는 요청은 화면을 거치지 않으므로, 받을지 말지는
   여기서 정합니다.

   열려면 둘이 다 있어야 합니다.
     1) 환경변수 STOREWAY_INTAKE_OPEN 에 그 종류가 적혀 있다
        (쉼표로 여럿 · quote · close · sell · join · 비어 있으면 전부 닫힘)
     2) DB 에 저장할 수 있다 (dbReady) — 저장이 확정된 뒤에만 접수
        성공을 말하므로, DB 없이 여는 길을 두지 않습니다 (W02 ①).

   ⚠️ 기본값이 닫힘입니다. 환경변수를 안 넣은 Preview · 새 배포는
   아무것도 받지 않습니다.
   ⚠️ 손님에게는 무엇을 설정해야 하는지 말하지 않습니다 (절대 규칙 3) —
   까닭은 함수 기록에만 남깁니다. */

const { dbReady } = require("./_db.js");

/* ⚠️ 2026-11-18 — close 는 매장 정리 상담(집기 처분 · 철거 · 원상복구)입니다.
   견적(quote)과 **따로** 엽니다. close 만 열어도 일반 견적 · 매물 등록 ·
   입점은 닫힌 그대로입니다. */
const FORMS = { quote: 1, close: 1, sell: 1, join: 1 };

/* 요청 몸통에서 어느 양식인지 가립니다.
   ⚠️ partner 는 업체 입점(/join) 입니다. sell 은 화면이 form 으로 밝힙니다. */
function formOf(b){
  if (!b || typeof b !== "object") return "quote";
  if (b.kind === "partner") return "join";
  if (b.form === "sell") return "sell";
  if (b.form === "close") return "close";
  return "quote";
}

function openList(){
  return String(process.env.STOREWAY_INTAKE_OPEN || "")
    .split(",").map(function(s){ return s.trim().toLowerCase(); })
    .filter(function(s){ return FORMS[s]; });
}

/* { open:true } 이거나 { open:false, why:"운영자용 까닭" } */
function gate(form){
  if (!FORMS[form]) return { open: false, why: "모르는 양식 " + form };
  if (openList().indexOf(form) < 0)
    return { open: false, why: "STOREWAY_INTAKE_OPEN 에 " + form + " 이(가) 없습니다" };
  if (!dbReady())
    return { open: false, why: "DB 설정(SUPABASE_URL · SUPABASE_SERVICE_KEY)이 없어 저장할 수 없습니다" };
  return { open: true };
}

/* 손님에게 보이는 말 — 재개일을 지어내지 않습니다 (W01 ③) */
const CLOSED_SAY = "현재 접수를 받지 않습니다.";

module.exports = { gate, formOf, openList, CLOSED_SAY };
