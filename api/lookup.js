/* /api/lookup — 비회원 본인 조회 (W03 · T08)   POST

     { op:"start",  no, tel }               → { ok, challenge }        같은 모양 (맞든 안 맞든)
     { op:"verify", challenge, no, code }   → { ok, token } 또는 { ok:false, error }
     { op:"read" }  + 머리 x-lookup-token   → { ok, data }

   ⚠️⚠️ 접수번호 + 전화번호만으로는 열리지 않습니다 — 인증번호까지 맞아야 30분짜리 토큰이 나옵니다.
   ⚠️⚠️ 번호 · 전화가 맞는지 갈라서 말하지 않습니다 (긁어 보기 방지).
   ⚠️ 토큰은 URL 에 싣지 않습니다 (머리로만) — 주소창 · 기록 · 분석 이벤트로 새지 않게.
   ⚠️ 로그에 번호 · 전화 · 인증번호 · 토큰을 남기지 않습니다.
   ⚠️ 어댑터가 없으면(운영 포함) 503 — 열린 척하지 않습니다. */
const { fromOurPages } = require("./_send.js");
const { dbCallService } = require("./_db.js");
const L = require("./_lookup.js");

const CLOSED = "지금은 본인 확인 조회를 할 수 없습니다.";
const SAY_START = "접수번호와 전화번호가 맞으면 그 번호로 인증번호를 보냈습니다. 10분 안에 적어 주세요.";

module.exports = async function handler(req, res){
  res.setHeader("Cache-Control", "no-store");
  if(req.method !== "POST"){ res.setHeader("Allow", "POST"); return res.status(405).json({ error:"POST 로 보내 주세요" }); }
  if(!fromOurPages(req)) return res.status(403).json({ error:"이 화면에서만 쓸 수 있습니다" });
  if(!L.lookupReady()) return res.status(503).json({ error:CLOSED, closed:true });
  const b = (req.body && typeof req.body === "object") ? req.body : {};
  const op = String(b.op || "");

  if(op === "start"){
    const no = L.normNo(b.no), tel = String(b.tel || "").replace(/[^0-9]/g, "");
    if(!/^[A-Z0-9-]{4,40}$/.test(no) || tel.length < 8 || tel.length > 13)
      return res.status(400).json({ error:"접수번호와 전화번호를 확인해 주세요" });
    const code = L.newCode();
    const r = await dbCallService("lookup_start", { p_no:no, p_tel:tel, p_code_hash:L.codeHash(no, code) });
    if(!r.ok || !r.data || !r.data.challenge){
      console.warn("[lookup] start 실패 — " + (r.timeout ? "timeout" : "db"));
      return res.status(503).json({ error:"지금 처리하지 못했습니다. 잠시 뒤 다시 눌러 주세요" });
    }
    const out = { ok:true, challenge:r.data.challenge, say:SAY_START };
    if(r.data.send && r.data.dest){
      const s = await L.send(r.data.dest, code);
      if(!s.ok) console.warn("[lookup] 인증번호 발송 실패");
      /* ⚠️ 시험용 어댑터에서만 — 운영에서는 adapter() 가 비어 여기까지 오지 않습니다 */
      if(s.testCode){ out.testCode = s.testCode; out.testNote = "시험용 어댑터 — 실제로 보내지 않았습니다"; }
    }
    return res.status(200).json(out);
  }

  if(op === "verify"){
    const ch = String(b.challenge || ""), code = String(b.code || "").replace(/[^0-9]/g, "");
    if(!/^[0-9a-f-]{36}$/.test(ch) || code.length !== 6)
      return res.status(400).json({ error:"인증번호 여섯 자리를 적어 주세요" });
    const token = L.newToken();
    const r = await dbCallService("lookup_verify", { p_challenge:ch, p_code_hash:L.codeHash(b.no, code),
                                                     p_token_hash:L.tokenHash(token) });
    if(!r.ok || !r.data) return res.status(503).json({ error:"지금 처리하지 못했습니다. 잠시 뒤 다시 눌러 주세요" });
    if(r.data.ok) return res.status(200).json({ ok:true, token:token, minutes:30 });
    const why = r.data.why;
    const say = why === "expired" ? "인증번호 시간이 지났습니다. 처음부터 다시 받아 주세요."
              : why === "used"    ? "이미 쓴 인증번호입니다. 처음부터 다시 받아 주세요."
              : why === "locked"  ? "여러 번 틀려서 막혔습니다. 처음부터 다시 받아 주세요."
              :                     "인증번호가 맞지 않습니다.";
    return res.status(400).json({ ok:false, error:say });
  }

  if(op === "read"){
    const t = String(req.headers["x-lookup-token"] || "");
    if(!/^[A-Za-z0-9_-]{30,80}$/.test(t)) return res.status(401).json({ error:"본인 확인을 다시 해 주세요" });
    const r = await dbCallService("lookup_read", { p_token_hash:L.tokenHash(t) });
    if(!r.ok) return res.status(503).json({ error:"지금 불러오지 못했습니다. 잠시 뒤 다시 눌러 주세요" });
    if(!r.data) return res.status(401).json({ error:"확인 시간이 지났습니다. 본인 확인을 다시 해 주세요" });
    return res.status(200).json({ ok:true, data:r.data });
  }

  return res.status(400).json({ error:"허용되지 않은 요청입니다" });
};
