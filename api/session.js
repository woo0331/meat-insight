/* ════════════════════════════════════════════════════════════════════
   /api/session — 로그인이 설정되어 있는가 · 나는 누구인가   GET

   화면이 제일 먼저 묻는 것입니다. 까닭은 하나 —

   ⚠️⚠️ **로그인이 없는데 "로그인" 단추를 내면** §30-7(클릭해도 작동하지
   않는 버튼)과 §30-8(기능이 없는데 완료된 것처럼)을 정면으로 어깁니다.
   CLAUDE.md 가 헤더에서 "로그인" 을 뺀 까닭 그대로입니다. 그래서 화면은
   이 주소에 먼저 묻고, `auth:false` 면 **그 구간째 안 그립니다**
   (절대 규칙 2 — 자리표시자를 찍지 않습니다).

   ⚠️ **값을 돌려주지 않습니다.** 설정됐는지(true/false)와, 로그인한
   사람이면 **그 사람 자신의** 역할 · 이름까지입니다. 키 · 토큰 ·
   주소는 한 글자도 나가지 않습니다 (`api/admin-health.js` 와 같은 규칙).

   ⚠️ 역할은 **요청이 아니라 DB** 에서 읽습니다 — `api/_auth.js` 머리말.
   ════════════════════════════════════════════════════════════════════ */

const { authReady, bearer, session, publicConf } = require("./_auth.js");
/* 2026-11-18 — 헤더 CTA 가 "견적 신청" 인지 "접수 안내" 인지를 정하는 값입니다.
   ⚠️⚠️ 새 상태를 만들지 않습니다 — 접수 API 가 쓰는 **그 게이트**(api/_gate.js)를
   그대로 읽습니다. 화면이 "열림" 이라고 말하는 순간과 서버가 실제로 받는 순간이
   어긋날 수 없습니다.
   ⚠️ 견적(quote) 하나만 봅니다 — 매물 등록 · 입점이 열려 있어도 견적이 닫혀 있으면
   닫힘입니다 (종류를 섞지 않습니다).
   ⚠️ true/false 만 나갑니다. 까닭(why)은 운영자용이라 내보내지 않습니다 (절대 규칙 3).
   ⚠️ 환경변수만 읽습니다 — DB · 메일 · 웹훅을 부르지 않습니다. */
const { gate } = require("./_gate.js");
function intakeState(){ return { quote: gate("quote").open === true }; }

module.exports = async function handler(req, res){
  if(req.method !== "GET"){
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error:"GET 으로 보내 주세요" });
  }
  /* ⚠️ 사람마다 다른 답이라 **캐시하지 않습니다.** 캐시되면 남의 역할이
     내 화면에 올 수 있습니다. */
  res.setHeader("cache-control", "no-store");

  if(!authReady())
    return res.status(200).json({ auth:false, signedIn:false, intake:intakeState() });

  /* ⚠️⚠️ **공개 키만 나갑니다** (`publicConf()`). 화면이 Supabase Auth 를
     직접 불러 매직링크를 받으려면 주소와 공개 키가 필요합니다 —
     service key 는 여기로도 어디로도 안 나갑니다. */
  const conf = publicConf();

  /* 토큰이 없으면 "설정은 됐고 아직 로그인 안 했다" 입니다.
     ⚠️ 이것은 에러가 아닙니다 — 401 로 돌려주면 화면이 깨진 것처럼
     보이고, 손님은 아무 잘못도 하지 않았습니다. */
  if(!bearer(req))
    return res.status(200).json({ auth:true, signedIn:false, conf:conf, intake:intakeState() });

  const s = await session(req);
  if(!s.ok){
    /* 토큰이 만료되었거나 로그아웃된 것입니다. 까닭은 운영자용이라
       손님에게는 "로그인 안 됨" 까지만 (절대 규칙 3). */
    if(s.why && s.why !== "no token") console.warn("[session] " + s.why);
    return res.status(200).json({ auth:true, signedIn:false, conf:conf, intake:intakeState() });
  }

  return res.status(200).json({
    auth:true, signedIn:true,
    conf:conf,
    intake:intakeState(),
    role:s.role,
    /* ⚠️ 업체 역할일 때만 나갑니다. 다른 역할에 붙여 두면 화면이
       "나는 업체다" 로 읽습니다. */
    provider: s.role === "provider" ? (s.provider_id || null) : null,
    name:s.name || ""
  });
};

/* 복구 점검본: 운영 DB·메일·웹훅을 호출하지 않고 종료합니다. */
module.exports = function restorationClosed(req, res){
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ auth:false, signedIn:false, restoration:true, intake:intakeState() });
};
