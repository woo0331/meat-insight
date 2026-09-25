/* ════════════════════════════════════════════════════════════════════
   요청 접수 (Vercel Serverless Function)   POST /api/quote

   지금은 **사장님 SOS** 와 **서비스별 견적 요청**이 둘 다 이리로
   들어옵니다. `kind` 로 구분합니다.

   받을 곳(환경변수)은 **api/_send.js** 머리말에 정리해 두었습니다.
   하나도 없으면 503 을 돌려주고, 화면은 "지금은 접수하지 못합니다" 와
   전화 버튼을 냅니다.

   ⚠️ **여기에 저장하지 않습니다.** 서버도 DB 도 없습니다. 받아서 밖으로
   보내기만 하고, 못 보내면 실패로 돌려줍니다. 성공했다고만 하고 흘려
   버리면 손님은 기다리고 요청은 사라집니다.

   ⚠️ **동의 없이 받지 않습니다.** 성함·연락처는 개인정보입니다. 화면에서
   한 번 막고 여기서 한 번 더 막습니다 — 화면만 믿으면 이 주소로 직접
   보내는 것을 못 막습니다 (개인정보보호법 제15조·제22조).
   ════════════════════════════════════════════════════════════════════ */

const { deliver, clean, why, fromOurPages } = require("./_send.js");

module.exports = async function handler(req, res){
  if(req.method !== "POST"){
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "POST 로 보내 주세요" });
  }

  /* ⚠️ 화면에서 온 것만 받습니다. 자물쇠가 아니라 문턱입니다 —
     진짜 속도 제한은 Vercel Firewall 에서 거세요. */
  if(!fromOurPages(req)){
    console.warn("[ABOUTMEAT] 우리 화면 밖에서 온 요청을 받지 않았습니다 (origin=" +
      (req.headers.origin || "없음") + ")");
    return res.status(403).json({ error: "잘못된 요청입니다" });
  }

  let b = req.body;
  if(typeof b === "string"){ try{ b = JSON.parse(b); }catch(e){ b = null; } }
  if(!b || typeof b !== "object") return res.status(400).json({ error: "내용을 읽지 못했습니다" });
  if(b.agree !== true) return res.status(400).json({ error: "개인정보 수집·이용 동의가 필요합니다" });

  const sos = b.kind === "sos";

  const q = {
    kind:   sos ? "sos" : "quote",
    q:      clean(b.q, 4000),        /* SOS — 손님이 적은 상황 */
    cat:    clean(b.cat, 40),        /* 빠른 선택 분류 */
    svc:    clean(b.svc, 40),        /* 서비스별 요청일 때 */
    name:   clean(b.name || b.co, 80),
    tel:    clean(b.tel, 30),
    email:  clean(b.email, 120),
    biz:    clean(b.biz, 80),        /* 업종 */
    region: clean(b.region, 80),
    items:  clean(b.items, 2000),    /* 견적 요청 본문 */
    at:     new Date().toISOString()
  };

  if(!q.name || !q.tel) return res.status(400).json({ error: "성함과 연락처를 적어 주세요" });
  if(!q.q && !q.items)  return res.status(400).json({ error: "어떤 일인지 적어 주세요" });

  const head = sos ? "[SOS]" : "[견적]";
  const subject = head + " " + q.name + (q.biz ? " · " + q.biz : "") +
                  (q.cat ? " · " + q.cat : q.svc ? " · " + q.svc : "");

  const text = [
    "성함      " + q.name,
    "연락처    " + q.tel,
    q.email  ? "이메일    " + q.email  : null,
    q.biz    ? "업종      " + q.biz    : null,
    q.region ? "지역      " + q.region : null,
    q.cat    ? "분류      " + q.cat    : null,
    q.svc    ? "서비스    " + q.svc    : null,
    "",
    sos ? "── 적어 주신 상황 ──" : "── 필요한 것 ──",
    q.q || q.items
  ].filter(function(x){ return x !== null; }).join("\n");

  const sent = await deliver("quote", q, subject, text);
  if(!sent.ok){
    console.error("[ABOUTMEAT] 요청을 전달하지 못했습니다 — " + why("quote", sent.why));
    return res.status(503).json({ error: "지금 접수하지 못했습니다" });
  }
  res.status(200).json({ ok: true });
};
