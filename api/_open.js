/* W03 — 로그인 · 관리자 · 회원 경로를 여는 스위치 (기본 닫힘).

   ⚠️⚠️ 2026-11-17 복구 때 session · me · deal · admin-health 를 503 점검본으로
   **통째로 갈아 끼웠습니다.** 운영 DB 에 골프 판이 얹혀 있어서, 코드만 배포돼도
   로그인 · 관리자 화면이 그 DB 를 두드리면 안 됐기 때문입니다.
   그 판단은 그대로 지킵니다 — 코드를 올려도 이 환경변수를 넣기 전에는
   전과 **글자 하나 다르지 않게** 점검본이 대답합니다.

     STOREWAY_ACCOUNTS_OPEN = 1    → 실제 경로 (여전히 SUPABASE_* 가 있어야 돕니다)
     없거나 다른 값                 → 점검본 (운영 DB · 메일 · 웹훅을 부르지 않음)

   ⚠️ 접수 게이트(STOREWAY_INTAKE_OPEN)와 **다른 스위치**입니다 — 접수를 여는 것과
   관리자 · 로그인을 여는 것은 따로 승인받을 일입니다. 둘을 섞지 마세요.
   ⚠️ 값을 밖으로 내지 않습니다 — 켜져 있는지(true/false)만 씁니다. */
function accountsOpen(){
  return String(process.env.STOREWAY_ACCOUNTS_OPEN || "").trim() === "1";
}

/* 점검본 응답 — 복구 때의 503 과 같은 말입니다 */
function closed(res, extra){
  res.setHeader("Cache-Control", "no-store");
  return res.status(503).json(Object.assign(
    { error:"복구 점검 중으로 현재 접수하지 않습니다.", restoration:true }, extra || {}));
}

module.exports = { accountsOpen, closed };
