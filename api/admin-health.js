/* ════════════════════════════════════════════════════════════════════
   /api/admin-health — 지금 접수가 실제로 되는 상태인가

   관리자 화면이 제일 먼저 묻는 것입니다. 지금까지는 **직접 폼을 넣어
   봐야만** 알 수 있었고, 그래서 CLAUDE.md 가 같은 경고를 세 군데에
   적어 두고 있습니다 —

     · 환경변수를 넣은 뒤에는 **다시 배포해야** 적용됩니다
     · Production 에 체크가 되어 있어야 합니다
     · 설정 전에 `sosReady` 를 켜면 **손님이 다 적고 눌렀는데 실패**합니다

   이 주소가 그 셋을 한 번에 확인해 줍니다.

   ⚠️ **값은 절대 돌려주지 않습니다.** 있는지 없는지(true/false)만
   돌려줍니다. 웹훅 주소나 API 키가 한 글자라도 새어 나가면 그걸로
   끝입니다. 길이도 알려 주지 않습니다 — 길이도 단서입니다.

   ⚠️ **middleware.js 가 이 주소도 막습니다.** matcher 에서 빼지
   마세요. 빼면 누구나 "이 회사가 슬랙을 쓰는가" 를 알 수 있습니다.
   ⚠️ 막혀 있더라도 혹시 모르니 여기서도 한 번 더 봅니다 — 미들웨어가
   지워지거나 matcher 가 어긋나도 값이 새지 않게.
   ════════════════════════════════════════════════════════════════════ */

/* 있으면 true. ⚠️ 공백만 있는 값은 **없는 것**으로 봅니다 — Vercel 에
   실수로 빈 칸을 저장하면 "넣었다" 고 착각하게 됩니다. */
function has(name){
  var v = process.env[name];
  return typeof v === "string" && v.trim().length > 0;
}

module.exports = function handler(req, res){
  if(req.method !== "GET"){
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "GET 으로 보내 주세요" });
  }

  /* 미들웨어가 앞에서 막지만, 잠금 자체가 설정되지 않았으면 여기서도
     아무것도 알려 주지 않습니다. */
  if(!has("ADMIN_PASSWORD"))
    return res.status(503).json({ error: "관리자 잠금이 설정되지 않았습니다" });

  var common = {
    webhook: has("INTAKE_WEBHOOK_URL") || has("ORDER_WEBHOOK_URL"),
    resend:  has("RESEND_API_KEY"),
    mailTo:  has("INTAKE_EMAIL_TO") || has("ORDER_EMAIL_TO"),
    mailFrom:has("INTAKE_EMAIL_FROM") || has("ORDER_EMAIL_FROM")
  };

  /* 종류별로 따로 받기로 하셨으면 그쪽이 먼저 쓰입니다 */
  var byKind = {
    sos:     { webhook: has("SOS_WEBHOOK_URL"),     mailTo: has("SOS_EMAIL_TO") },
    quote:   { webhook: has("QUOTE_WEBHOOK_URL"),   mailTo: has("QUOTE_EMAIL_TO") },
    partner: { webhook: has("PARTNER_WEBHOOK_URL"), mailTo: has("PARTNER_EMAIL_TO") }
  };

  /* 한 종류라도 받을 곳이 있는가 — api/_send.js 가 판단하는 것과
     같은 규칙입니다 (웹훅 하나, 또는 키와 받는 주소가 **둘 다**). */
  function ready(k){
    var b = byKind[k];
    return !!(b.webhook || common.webhook ||
              ((b.mailTo || common.mailTo) && common.resend));
  }

  var kinds = { sos: ready("sos"), quote: ready("quote"), partner: ready("partner") };
  var allReady = kinds.sos && kinds.quote && kinds.partner;

  /* 캐시하면 다시 배포한 뒤에도 옛 답이 나옵니다 — 그게 제일 헷갈립니다 */
  res.setHeader("cache-control", "no-store");
  res.setHeader("x-robots-tag", "noindex");
  return res.status(200).json({
    ok: true,
    common: common,
    byKind: byKind,
    kinds: kinds,
    allReady: allReady,
    /* 어느 환경에서 도는 중인지. Production 아닌 곳에서만 되는 일이
       실제로 생깁니다 (CLAUDE.md 의 경고). */
    env: process.env.VERCEL_ENV || "unknown"
  });
};
