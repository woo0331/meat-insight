/* ════════════════════════════════════════════════════════════════════
   /api/deal — 상태를 바꾸는 유일한 길   POST

   화면이 상태를 직접 쓰지 않습니다. 0003 · 0004 가 만든 **문 다섯**만
   부릅니다 —

     move_state         신청 · 배정 · 상담 · 계약의 상태 (§8)
     answer_assignment  업체의 수락 · 거절 (§7)
     confirm_fee        수수료 확정   ⚠️ 관리자만 (§9 · §13)
     mark_paid          입금 확인     ⚠️ 관리자만
     clawback_fee       환수 · 부분환불 ⚠️ 관리자만
     claim_request      로그인 전에 넣은 신청을 내 것으로 (0005 · §10)

   ⚠️⚠️ **그 사람의 토큰으로 부릅니다.** service key 로 부르면
   `auth.uid()` 가 비어서 함수가 스스로 거절합니다 — 그렇게 설계한
   까닭은 §8 입니다. *"모든 중요한 상태 변경에는 변경자, 변경일시,
   사유를 기록한다."* 변경자를 못 적는 기록은 기록이 아닙니다.

   ⚠️⚠️ **권한을 여기서 판단하지 않습니다.** 누가 무엇을 할 수 있는지는
   DB 의 RLS 와 함수 안에 있습니다. 여기서 또 적으면 두 곳이 어긋나고,
   어긋나면 화면이 안 내는 길로 서버가 통과시킵니다 — 이 저장소가
   `deal.js` ↔ `deal_move` 표를 빌드로 맞춰 보는 까닭과 같습니다.

   ⚠️ 자물쇠가 **둘**입니다. 여기(허용 목록)와 `_db.js`(글자 씻기).
   거절하는 말이 서로 달라야 **어느 자물쇠가 걸렸는지** 압니다 — 이
   저장소가 "겹겹이 막아 둔 것이 검사를 속인다" 로 겪은 자리입니다.
   ════════════════════════════════════════════════════════════════════ */

const { authReady, session, authWhy } = require("./_auth.js");
const { dbRpc, dbWhy } = require("./_db.js");

/* ⚠️⚠️ 여기 없는 이름은 **부르지 않습니다.** 손님이 보낸 글자가 곧
   함수 이름이 되는 자리라, 목록을 두지 않으면 DB 의 아무 함수나
   부를 수 있습니다. */
const OK_FN = {
  move_state:1, answer_assignment:1, claim_request:1,
  confirm_fee:1, mark_paid:1, clawback_fee:1
};

/* 보낼 수 있는 인자 — 이름까지 정해 둡니다. ⚠️ 통째로 넘기면 손님이
   `p_by` 같은 칸을 섞어 보내 **남의 이름으로** 기록을 남길 수 있습니다
   (변경자는 토큰에서만 옵니다). */
/* ⚠️⚠️ **이름을 눈대중으로 적지 마세요.** 처음에 p_amount · p_paid_at ·
   p_delta · p_reason 이라고 적어 두었는데 실제 함수는 p_fee · p_vat ·
   p_total · p_snap · p_new_fee 입니다 — 그대로 두면 수수료 확정이
   **인자 없이** 불려서 거절당합니다. `build-pages.js` 의
   `checkRpcArgs()` 가 SQL 의 함수 정의와 이 목록을 **양쪽으로** 맞춰
   보고, 어긋나면 빌드가 멈춥니다. */
const OK_ARG = {
  p_request:1, p_to:1, p_ctx:1,                        /* move_state */
  p_yes:1, p_why:1,                                    /* answer_assignment */
  p_no:1, p_tel:1,                                     /* claim_request */
  p_deal:1,                                            /* 돈 쪽 셋이 함께 씁니다 */
  p_fee:1, p_vat:1, p_total:1, p_snap:1, p_proof:1,    /* confirm_fee */
  p_paid:1,                                            /* mark_paid */
  p_new_fee:1                                          /* clawback_fee */
};

function pickArgs(a){
  const out = {};
  if(!a || typeof a !== "object") return out;
  Object.keys(a).forEach(function(k){ if(OK_ARG[k]) out[k] = a[k]; });
  return out;
}

module.exports = async function handler(req, res){
  if(req.method !== "POST"){
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error:"POST 로 보내 주세요" });
  }
  res.setHeader("cache-control", "no-store");

  if(!authReady()){
    /* 운영자에게만 까닭을 적습니다 (절대 규칙 3) */
    console.warn("[deal] " + authWhy("nowhere"));
    return res.status(503).json({ error:"아직 처리할 수 없습니다" });
  }

  let b = req.body;
  if(typeof b === "string"){ try{ b = JSON.parse(b); }catch(e){ b = null; } }
  if(!b || typeof b !== "object")
    return res.status(400).json({ error:"내용을 읽을 수 없습니다" });

  const fn = String(b.fn || "");
  /* 첫째 자물쇠 — 허용 목록 */
  if(!OK_FN[fn])
    return res.status(400).json({ error:"허용되지 않은 동작입니다" });

  const s = await session(req);
  if(!s.ok){
    if(s.timeout) return res.status(504).json({ error:"시간이 초과되었습니다. 다시 눌러 주세요" });
    return res.status(401).json({ error:"로그인이 필요합니다" });
  }

  const r = await dbRpc(s.token, fn, pickArgs(b.args));
  if(!r.ok){
    if(r.timeout) return res.status(504).json({ error:"시간이 초과되었습니다. 다시 눌러 주세요" });
    /* ⚠️⚠️ DB 함수가 거절한 **그 말**을 그대로 보여 줍니다. "갈 수 없는
       길입니다 — A → B" · "업체에 연락처를 전달하는 별도 동의를 받지
       못했습니다" 처럼 **무엇을 하면 되는지**가 거기 적혀 있습니다.
       ⚠️ 운영자 글(주소 · 상태코드)은 섞지 않습니다. */
    console.warn("[deal] " + fn + " — " + dbWhy(r.why));
    const msg = String(r.why || "");
    const m = msg.match(/"message"\s*:\s*"([^"]{1,200})"/);
    return res.status(r.status === 403 || r.status === 401 ? 403 : 400)
              .json({ error: m ? m[1] : "처리하지 못했습니다" });
  }

  return res.status(200).json({ ok:true, data:r.data === undefined ? null : r.data });
};
