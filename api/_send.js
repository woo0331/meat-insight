/* ════════════════════════════════════════════════════════════════════
   주문·견적을 밖으로 내보냅니다 (주문과 견적이 같이 씁니다)

   ⚠️ 파일 이름이 밑줄(_)로 시작합니다. Vercel 은 `api/` 안의 파일을
   전부 주소로 만드는데, 밑줄로 시작하는 것은 빼 줍니다 — 이 파일이
   /api/_send 로 열리면 안 됩니다.

   ── 환경변수 ──────────────────────────────────────────
   ORDER_WEBHOOK_URL   주문·견적 JSON 을 그대로 POST 합니다
   QUOTE_WEBHOOK_URL   견적만 따로 보낼 곳 (없으면 위를 씁니다)
   RESEND_API_KEY      이메일로 받을 때
   ORDER_EMAIL_TO      주문 받을 주소 (쉼표로 여러 개)
   QUOTE_EMAIL_TO      견적 받을 주소 (없으면 위를 씁니다)
   ORDER_EMAIL_FROM    보내는 주소 (기본값 onboarding@resend.dev)

   ⚠️ 하나도 없으면 **실패로 돌려줍니다.** 받을 곳이 없는데
   "접수되었습니다" 라고 하면 손님은 기다리고 주문은 사라집니다.
   ⚠️ 키를 저장소에 적지 마세요 — 공개 저장소입니다.
   ════════════════════════════════════════════════════════════════════ */

function won(n){ return Number(n||0).toLocaleString("ko-KR"); }

/* kind: "order" | "quote" — 견적은 따로 보낼 곳이 있으면 그리로 */
async function deliver(kind, payload, subject, text){
  const hook = (kind === "quote" && process.env.QUOTE_WEBHOOK_URL) || process.env.ORDER_WEBHOOK_URL;
  const key  = process.env.RESEND_API_KEY;
  const to   = (kind === "quote" && process.env.QUOTE_EMAIL_TO) || process.env.ORDER_EMAIL_TO;
  if(!hook && !(key && to)) return { ok:false, why:"nowhere" };

  const errs = [];
  if(hook){
    try{
      const r = await fetch(hook, {
        method:"POST", headers:{ "content-type":"application/json" },
        /* 슬랙·구글챗처럼 text 만 읽는 곳도 있어서 같이 넣습니다 */
        body: JSON.stringify(Object.assign({ kind:kind, text:subject+"\n\n"+text }, payload))
      });
      if(r.ok) return { ok:true };
      errs.push("webhook " + r.status);
    }catch(e){ errs.push("webhook " + (e && e.message)); }
  }
  if(key && to){
    try{
      const r = await fetch("https://api.resend.com/emails", {
        method:"POST",
        headers:{ "content-type":"application/json", authorization:"Bearer " + key },
        body: JSON.stringify({
          from: process.env.ORDER_EMAIL_FROM || "onboarding@resend.dev",
          to: to.split(",").map(s => s.trim()).filter(Boolean),
          subject: subject, text: text
        })
      });
      if(r.ok) return { ok:true };
      errs.push("resend " + r.status + " " + (await r.text().catch(()=> "")).slice(0,200));
    }catch(e){ errs.push("resend " + (e && e.message)); }
  }
  return { ok:false, why: errs.join(" / ") || "unknown" };
}

/* 줄바꿈·제어문자를 지우고 길이를 자릅니다 — 메일 제목에 개행이
   들어가면 헤더가 쪼개집니다 */
function clean(s, max){
  return String(s == null ? "" : s)
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim().slice(0, max || 200);
}

function why(kind, reason){
  return reason === "nowhere"
    ? "Vercel 환경변수에 " + (kind==="quote" ? "QUOTE_WEBHOOK_URL / QUOTE_EMAIL_TO 또는 " : "") +
      "ORDER_WEBHOOK_URL 또는 RESEND_API_KEY·ORDER_EMAIL_TO 를 넣으세요."
    : "받는 쪽 주소와 키를 확인하세요. (" + reason + ")";
}

module.exports = { deliver, clean, won, why };
