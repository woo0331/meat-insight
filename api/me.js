/* ════════════════════════════════════════════════════════════════════
   /api/me — 내가 볼 수 있는 신청 · 배정 · 계약   GET

   §10 (고객 마이페이지) · §11 (입점업체 대시보드) 가 읽는 자리입니다.

   ⚠️⚠️ **거르는 일을 여기서 하지 않습니다.** 역할마다 "무엇을 볼 수
   있는가" 는 DB 의 RLS 한 곳에 있고, 이 주소는 **그 사람의 토큰으로**
   읽습니다 (`api/_db.js` 의 callAs). service key 로 읽으면 RLS 가 통째로
   꺼져서 전부 보입니다 — 바꿔 쓰지 마세요.

   여기서 정하는 것은 **어느 칸을 가져올지**까지입니다. RLS 는 줄은
   막아도 칸은 막지 못하니, 필요 없는 개인정보를 애초에 안 가져옵니다
   (개인정보보호법 제3조 제1항 — 최소 수집).

     고객   내 신청 + 연결된 업체 **상호까지** (제17조 재동의가 상호를
            알려 드리고 받는 것이라, 상호를 못 보면 §10 이 성립하지
            않습니다). ⚠️ 수수료 · 정산은 아예 묻지 않습니다 — 우리와
            업체 사이의 일인데 보여 주면 자기가 내는 돈으로 읽힙니다.
     업체   나에게 배정된 신청 (연락처 포함 — 그게 배정입니다) + 내 계약
     직원   목록은 **연락처 없이**. 전화하려면 건을 열어야 합니다 —
     관리자 목록에 성함과 번호를 깔아 두면 화면 하나가 곧 유출입니다.
   ════════════════════════════════════════════════════════════════════ */

const { authReady, bearer, session } = require("./_auth.js");
const { dbSelectAs } = require("./_db.js");

const LIMIT = 50;

/* ⚠️ 칸 목록을 역할마다 **손으로** 적습니다. `select=*` 로 두면 칸이
   하나 늘 때마다 조용히 같이 나갑니다. */
const PICK = {
  customer:
    "no,side,cat,industry,region,gu,state,want_at,created_at," +
    "assignment(state,created_at,provider(id,name))",
  provider:
    "no,side,cat,industry,region,gu,state,want_at,body,detail,created_at," +
    "name,tel,email,assignment(state,why,created_at)",
  staff:
    "id,no,side,cat,industry,region,gu,state,created_at," +
    "assignment(provider_id,state,created_at)"
};

module.exports = async function handler(req, res){
  if(req.method !== "GET"){
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error:"GET 으로 보내 주세요" });
  }
  /* ⚠️ 사람마다 다른 답입니다 — 캐시되면 남의 신청이 내 화면에 옵니다 */
  res.setHeader("cache-control", "no-store");

  if(!authReady())      return res.status(200).json({ auth:false, signedIn:false });
  if(!bearer(req))      return res.status(200).json({ auth:true, signedIn:false });

  const s = await session(req);
  if(!s.ok){
    if(s.timeout) return res.status(504).json({ error:"시간이 초과되었습니다. 다시 눌러 주세요" });
    return res.status(200).json({ auth:true, signedIn:false });
  }

  const role = s.role === "admin" ? "staff" : s.role;
  const pick = PICK[role] || PICK.customer;

  const q = await dbSelectAs(s.token, "request",
    "?select=" + encodeURIComponent(pick) +
    "&order=created_at.desc&limit=" + LIMIT);
  if(!q.ok){
    if(q.timeout) return res.status(504).json({ error:"시간이 초과되었습니다. 다시 눌러 주세요" });
    console.warn("[me] " + q.why);
    return res.status(502).json({ error:"지금 불러오지 못했습니다. 잠시 뒤 다시 눌러 주세요" });
  }

  const out = { auth:true, signedIn:true, role:s.role, requests:q.rows };

  /* 업체 · 관리자만 계약을 봅니다. ⚠️ 고객에게는 **묻지도 않습니다** —
     RLS 가 어차피 빈 목록을 주지만, 안 묻는 쪽이 한 겹 더 안전합니다. */
  if(s.role === "provider" || s.role === "admin"){
    const d = await dbSelectAs(s.token, "deal",
      "?select=" + encodeURIComponent(
        "id,request_id,provider_id,amount,fee,fee_vat,fee_total,paid,paid_at," +
        "signed_at,done_at,fee_at,created_at") +
      "&order=created_at.desc&limit=" + LIMIT);
    if(d.ok) out.deals = d.rows;
    else console.warn("[me] deal — " + d.why);
  }

  return res.status(200).json(out);
};
