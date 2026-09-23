/* ════════════════════════════════════════════════════════════════════
   대량견적 문의 접수 (Vercel Serverless Function)   POST /api/quote

   받을 곳(환경변수)은 **api/_send.js** 머리말에 정리해 두었습니다.
   하나도 없으면 503 을 돌려주고, 화면은 "지금은 이 양식으로 접수하지
   못합니다" 와 전화 버튼을 냅니다.

   ⚠️ **동의 없이 받지 않습니다.** 업체명·담당자·연락처·이메일은
   개인정보입니다. 화면에서 한 번 막고 여기서 한 번 더 막습니다 —
   화면만 믿으면 이 주소로 직접 보내는 것을 못 막습니다
   (개인정보보호법 제15조·제22조).

   ⚠️ **여기에 저장하지 않습니다.** 보내지 못하면 실패로 돌려주고,
   화면이 손님에게 전화로 안내합니다.
   ════════════════════════════════════════════════════════════════════ */

const { deliver, clean, why } = require("./_send.js");

module.exports = async function handler(req, res){
  if(req.method !== "POST"){
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "POST 로 보내 주세요" });
  }

  let b = req.body;
  if(typeof b === "string"){ try{ b = JSON.parse(b); }catch(e){ b = null; } }
  if(!b || typeof b !== "object") return res.status(400).json({ error: "문의 내용을 읽지 못했습니다" });

  if(b.agree !== true) return res.status(400).json({ error: "개인정보 수집·이용 동의가 필요합니다" });

  const q = {
    co:    clean(b.co, 80),
    name:  clean(b.name, 40),
    tel:   clean(b.tel, 30),
    email: clean(b.email, 120),
    items: clean(b.items, 1000),
    at:    new Date().toISOString()
  };
  if(!q.co || !q.name || !q.tel) return res.status(400).json({ error: "업체명·담당자·연락처를 적어 주세요" });
  if(!q.items) return res.status(400).json({ error: "필요하신 품목을 적어 주세요" });

  const text = [
    "업체명    " + q.co,
    "담당자    " + q.name,
    "연락처    " + q.tel,
    q.email ? "이메일    " + q.email : null,
    "",
    "필요 품목",
    q.items
  ].filter(function(x){ return x !== null; }).join("\n");

  const sent = await deliver("quote", q, "[견적] " + q.co + " · " + q.name, text);
  if(!sent.ok){
    console.error("[ABOUTMEAT] 견적 문의를 전달하지 못했습니다 — " + why("quote", sent.why));
    return res.status(503).json({ error: "지금 문의를 접수하지 못했습니다" });
  }
  res.status(200).json({ ok: true });
};
