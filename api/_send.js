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

/* ── 우리 화면에서 온 요청인가 ────────────────────────────────
   ⚠️ 이 주소는 누구나 반복해서 두드릴 수 있습니다. 막지 않으면 남이
   사장님의 슬랙·메일을 주문 수백 건으로 도배할 수 있습니다.

   브라우저는 **POST 에 Origin 헤더를 반드시 붙입니다**(GET·HEAD 만
   빼고). 그래서 Origin 이 없거나 우리 도메인이 아니면 화면에서 온
   것이 아닙니다 — curl 이나 스크립트로 직접 두드리는 경우입니다.

   ⚠️ 이것은 **자물쇠가 아니라 문턱**입니다. Origin 은 브라우저 밖에서
   얼마든지 지어낼 수 있습니다. 지나다니며 두드리는 것을 막아 줄 뿐,
   작정하고 도배하는 것은 못 막습니다. 그건 Vercel 의 Firewall 에서
   **속도 제한(Rate Limit)** 을 거세요 — 코드로는 셀 곳이 없습니다
   (서버가 요청마다 새로 뜨고 기억을 공유하지 않습니다).

   ⚠️ www 든 미리보기 주소든 알아서 맞습니다. 정해 둔 도메인과 비교하지
   않고 **요청이 실제로 들어온 host** 와 비교하기 때문입니다. */
function fromOurPages(req){
  const origin = req.headers.origin || "";
  if(!origin) return false;
  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  if(!host) return false;
  try{ return new URL(origin).host === String(host).toLowerCase(); }
  catch(e){ return false; }
}

module.exports = { deliver, clean, won, why, fromOurPages };
