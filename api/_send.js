/* ════════════════════════════════════════════════════════════════════
   주문·견적을 밖으로 내보냅니다 (주문과 견적이 같이 씁니다)

   ⚠️ 파일 이름이 밑줄(_)로 시작합니다. Vercel 은 `api/` 안의 파일을
   전부 주소로 만드는데, 밑줄로 시작하는 것은 빼 줍니다 — 이 파일이
   /api/_send 로 열리면 안 됩니다.

   ── 환경변수 ──────────────────────────────────────────
   **하나만 넣으면 전부 그리로 옵니다.** 나누고 싶을 때만 더 넣으세요.

   INTAKE_WEBHOOK_URL   모든 접수를 JSON 으로 POST 합니다 (기본 받을 곳)
   INTAKE_EMAIL_TO      메일로 받을 주소 (쉼표로 여러 개)
   RESEND_API_KEY       메일로 받을 때 필요한 키 (resend.com)
   INTAKE_EMAIL_FROM    보내는 주소 (기본값 onboarding@resend.dev)

   종류별로 따로 받고 싶을 때만 (없으면 위의 INTAKE_* 를 씁니다)
   SOS_WEBHOOK_URL      · SOS_EMAIL_TO       사장님 SOS
   QUOTE_WEBHOOK_URL    · QUOTE_EMAIL_TO     견적 요청
   PARTNER_WEBHOOK_URL  · PARTNER_EMAIL_TO   파트너 등록

   ⚠️ 예전 이름 ORDER_WEBHOOK_URL · ORDER_EMAIL_TO · ORDER_EMAIL_FROM 도
   그대로 받습니다 (부산물몰 때 쓰던 이름입니다). 새로 넣으실 때는
   INTAKE_* 를 쓰세요.

   ⚠️ 하나도 없으면 **실패로 돌려줍니다.** 받을 곳이 없는데
   "접수되었습니다" 라고 하면 손님은 기다리고 요청은 사라집니다.
   ⚠️ 키를 저장소에 적지 마세요 — 공개 저장소입니다.
   ════════════════════════════════════════════════════════════════════ */

function won(n){ return Number(n||0).toLocaleString("ko-KR"); }

/* 종류별 환경변수를 먼저 보고, 없으면 공통을 씁니다.
   ⚠️ kind 는 손님이 보낸 값에서 옵니다 — 그대로 process.env 의 키로
   쓰면 안 됩니다. 알파벳만 남기고 잘라서 씁니다. */
function envFor(kind, suffix){
  const up = String(kind || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 16);
  return (up && process.env[up + suffix]) || null;
}

/* kind: "sos" | "quote" | "partner" */
async function deliver(kind, payload, subject, text){
  const hook = envFor(kind, "_WEBHOOK_URL") ||
               process.env.INTAKE_WEBHOOK_URL || process.env.ORDER_WEBHOOK_URL;
  const key  = process.env.RESEND_API_KEY;
  const to   = envFor(kind, "_EMAIL_TO") ||
               process.env.INTAKE_EMAIL_TO || process.env.ORDER_EMAIL_TO;
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
          from: process.env.INTAKE_EMAIL_FROM || process.env.ORDER_EMAIL_FROM ||
                "onboarding@resend.dev",
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

/* ════════════════════════════════════════════════════════════════════
   손님에게 보내는 **접수 완료 안내** (2026-10-22 오픈 전 전수검사 P0 ⑥)

   ⚠️⚠️ **지금까지 손님에게 가는 것이 하나도 없었습니다.** 접수 사실을
   아는 길이 그 화면의 "접수되었습니다" 한 번뿐이고, 창을 닫으면
   접수번호도 사라졌습니다 — 문의하실 때 댈 번호가 없어집니다.

   ⚠️⚠️ **문자 · 알림톡이 아니라 메일입니다.** 문자는 발송사 계약과
   발신번호 사전등록이 먼저이고, 그 둘은 사장님이 하실 일입니다.
   메일은 이미 들어와 있는 `RESEND_API_KEY` 길을 그대로 씁니다.

   ⚠️⚠️ **보낼 곳이 설정되기 전에는 아무 일도 안 합니다** (fail-closed) —
   접수는 그대로 되고 **안내만 안 갑니다.** 안내 때문에 접수를 잃는
   쪽이 더 나쁩니다 (중복 검사가 실패해도 접수를 막지 않는 것과 같은
   판단). 그래서 이 함수는 **실패를 던지지 않습니다.**

   ⚠️⚠️ **켜시는 날 방침의 수탁자를 같은 날 고치세요** (개인정보보호법
   제26조). 손님의 **메일 주소**가 Resend 로 갑니다 — 미국 회사라
   국가도 적습니다 (제28조의8). `js/data/legal-privacy.js` 의
   `trustees` 한 줄입니다. 환경변수 · 준비 상태값 · 방침 수탁자 셋은
   **늘 같이 움직입니다** (접수처에서 세 번 겪은 자리).

   ⚠️ **광고가 아닙니다.** 신청하신 건의 접수 사실과 접수번호를
   알려 드리는 거래 정보라, 정보통신망법 제50조의 광고성 정보
   사전동의와 다른 건입니다. ⚠️ 그래서 이 글에 **다른 서비스 권유를
   섞지 마세요** — 섞는 순간 광고가 되고 그때는 사전동의가 먼저입니다.

   ⚠️⚠️ **"업체에 전달했습니다" 라고 하지 않습니다.** 배정은 관리자가
   확인하고 나중에 하는 일이고, 그때 **상호를 알리고 제3자 제공
   동의를 다시** 받습니다 (제17조 제2항).
   ⚠️ **회신 시점도 약속하지 않습니다** (약관 제8조 · 절대 규칙 5).
   ════════════════════════════════════════════════════════════════════ */
async function customerAck(to, no){
  const key  = process.env.RESEND_API_KEY;
  /* ⚠️ 보내는 주소를 **따로** 둡니다. 운영자에게 보내던 주소를 그대로
     쓰면 손님에게 가는 메일의 From 이 내부 주소가 됩니다 — 답장이
     아무도 안 보는 곳으로 갑니다. 없으면 **안 보냅니다.** */
  const from = process.env.CUSTOMER_EMAIL_FROM;
  const addr = clean(to, 120);
  /* ⚠️ 꼴만 봅니다 — 보낼 수 있는지는 받는 쪽이 압니다 */
  if(!key || !from || !addr || addr.indexOf("@") < 1) return { ok:false, why:"off" };

  const L = [];
  L.push("신청이 접수되었습니다.");
  L.push("");
  /* ⚠️⚠️ 번호는 **실제로 저장된 뒤에만** 옵니다 (api/quote.js). 없으면
     줄째 뺍니다 — 없는 번호를 적으면 그 번호로 물어봤을 때 아무것도
     없습니다 (절대 규칙 2 · 5). */
  if(no){
    L.push("접수번호  " + clean(no, 20));
    L.push("문의하실 때 이 번호를 알려 주시면 빠릅니다.");
    L.push("");
  }
  L.push("담당자가 내용을 확인한 뒤 적어 주신 연락처로 연락드립니다.");
  L.push("회신 시점을 약속드리지는 않습니다.");
  L.push("");
  L.push("업체에 연락처를 전달하는 것은 아직 하지 않았습니다 —");
  L.push("연결할 업체가 정해지면 상호를 알려 드리고 그때 다시 여쭙습니다.");
  L.push("");
  L.push("이 메일은 신청하신 건의 접수 안내이며 광고가 아닙니다.");

  try{
    const r = await fetch("https://api.resend.com/emails", {
      method:"POST",
      headers:{ "content-type":"application/json", authorization:"Bearer " + key },
      body: JSON.stringify({
        from: from,
        /* ⚠️⚠️ **한 사람에게만** 보냅니다. 쉼표를 그대로 넘기면 손님이
           적은 글로 여러 곳에 보내는 길이 열립니다. */
        to: [addr],
        subject: "[접수] 신청이 접수되었습니다" + (no ? " (" + clean(no, 20) + ")" : ""),
        text: L.join("\n")
      })
    });
    if(r.ok) return { ok:true };
    return { ok:false, why:"resend " + r.status };
  }catch(e){ return { ok:false, why:"resend " + (e && e.message) }; }
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
    ? "받을 곳이 없습니다. Vercel → Settings → Environment Variables 에 " +
      "INTAKE_WEBHOOK_URL 하나를 넣거나, RESEND_API_KEY 와 INTAKE_EMAIL_TO 를 " +
      "같이 넣으세요. 넣은 뒤에는 **다시 배포해야** 적용됩니다."
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

/* ── 진행 안내 (2026-10-22 오픈 전 전수검사 P2 ⑱) ─────────────────
   배정 · 견적 도착을 **받으시겠다고 하신 분에게만** 보냅니다.

   ⚠️⚠️ **상호도 금액도 싣지 않습니다.** 운영자 알림을 "가서 보세요"
   까지로 둔 것과 같은 까닭입니다 — 메일 주소를 한 글자 잘못 적으신
   경우 그 메일이 남에게 갑니다. 거기에 어느 업체가 얼마를 냈는지까지
   적혀 있으면 그건 유출입니다. 번호와 "들어와서 보세요" 까지입니다.
   ⚠️⚠️ **광고를 섞지 마세요.** 한 줄만 권유를 넣으면 그때부터 광고성
   정보이고 사전 수신동의가 먼저입니다 (정보통신망법 제50조).
   ⚠️⚠️ **회신 시점을 약속하지 않습니다** (약관 제8조).
   ⚠️ 끄는 길을 본문에 적습니다 — 로그인 없이 들어오는 접수라 수신거부
   토큰이 없습니다. */
const STEP_SAY = {
  assigned: { s:"연결할 업체가 정해졌습니다",
              l:"연결할 업체가 정해졌습니다." },
  quoted:   { s:"견적이 도착했습니다",
              l:"업체가 보낸 견적이 도착했습니다." }
};

async function customerStep(to, no, kind){
  const key  = process.env.RESEND_API_KEY;
  const from = process.env.CUSTOMER_EMAIL_FROM;
  const addr = clean(to, 120);
  const say  = STEP_SAY[kind];
  /* ⚠️ 하나라도 없으면 **아무 일도 안 합니다** (fail-closed) — 접수는
     그대로 됩니다. 지금 운영이 그 상태입니다. */
  if(!key || !from || !addr || addr.indexOf("@") < 1 || !say)
    return { ok:false, why:"off" };

  const L = [];
  L.push(say.l);
  L.push("");
  /* ⚠️ 번호가 없으면 **줄째 뺍니다** (절대 규칙 2) */
  if(no){
    L.push("접수번호  " + clean(no, 20));
    L.push("");
  }
  L.push("내 기록에서 확인하실 수 있습니다 —");
  L.push("https://storeway.co.kr/my");
  /* ⚠️ 로그인하신 적이 없어도 볼 수 있는 길을 같이 적습니다 */
  if(no) L.push("로그인하신 적이 없으시면 그 화면에서 접수번호와 연락처로 가져오실 수 있습니다.");
  L.push("");
  L.push("업체에 연락처를 전달할 때는 어느 업체인지 알려 드리고 그때 다시 여쭙습니다.");
  L.push("");
  L.push("이 메일은 신청하신 건의 진행 안내이며 광고가 아닙니다.");
  L.push("받지 않으시려면 이 메일에 회신해 주시면 바로 멈춥니다.");

  try{
    const r = await fetch("https://api.resend.com/emails", {
      method:"POST",
      headers:{ "content-type":"application/json", authorization:"Bearer " + key },
      body: JSON.stringify({
        /* ⚠️⚠️ **한 사람에게만** 보냅니다 (쉼표를 그대로 넘기지 않습니다) */
        from: from, to: [addr],
        subject: "[진행] " + say.s + (no ? " (" + clean(no, 20) + ")" : ""),
        text: L.join("\n")
      })
    });
    if(r.ok) return { ok:true };
    return { ok:false, why:"resend " + r.status };
  }catch(e){ return { ok:false, why:"resend " + (e && e.message) }; }
}

module.exports = { deliver, customerAck, customerStep, clean, won, why, fromOurPages };
