/* ════════════════════════════════════════════════════════════════════
   요청 접수 (Vercel Serverless Function)   POST /api/quote

   화면 세 곳이 이리로 들어옵니다. `kind` 로 구분합니다.

     "sos"      사장님 SOS        — 문제를 그대로 적어 보내는 것
     "quote"    견적 요청         — 서비스가 정해진 요청서
     "partner"  파트너 등록       — 업체가 등록을 신청하는 것

   ⚠️ **화면이 보내는 칸 이름과 여기서 읽는 칸 이름이 어긋나면 그 칸은
   조용히 사라집니다.** 에러도 안 나고 접수는 성공합니다 — 받아 보는
   사람만 "왜 업체명이 없지?" 하게 됩니다. 실제로 그랬습니다:
   견적 요청이 `service`·`budget`·`detail` 을 보내는데 여기서는 `svc`
   하나만 읽고 있었고, 파트너 등록은 아예 견적으로 처리되어 **업체명과
   취급 서비스가 통째로 빠졌습니다.**
   화면의 `body = {...}` 를 고치면 **여기도 같이 고치고**,
   `node tools/test-api.js` 로 확인하세요.

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
/* ⚠️⚠️ 아래 둘은 **DB 가 설정되어 있을 때만** 일을 합니다. 설정 전에는
   이 주소가 **오늘과 글자 하나 다르지 않게** 동작합니다 — 받아서 슬랙
   으로 보내고 끝입니다. 반쯤 된 저장을 손님에게 보이지 않기 위해서고,
   `api/_send.js` 가 받을 곳이 없을 때 503 을 돌려주는 것과 같은
   규칙입니다 (fail-closed). */
const { dbReady, dbInsert, dbSelect, dbWhy } = require("./_db.js");
const { reqNo, telKey, intakeDup } = require("./_intake.js");

const KINDS = { sos:1, quote:1, partner:1 };

/* 서비스별 요청서의 추가 답(js/data/reqforms.js)을 사람이 읽을 줄로.
   ⚠️ 칸 이름과 값 둘 다 씻습니다 — 여기 들어온 것은 손님이 보낸 것이고,
   메일 제목·본문에 개행이 섞이면 헤더가 쪼개집니다. */
function detailLines(d){
  if(!d || typeof d !== "object") return [];
  /* ⚠️⚠️ **상한에 닿으면 뒤쪽 칸이 조용히 사라집니다.** 매물 내놓기
     (/sell)의 매장 항목이 딱 열둘이라, 하나만 더해도 에러 없이
     빠집니다 — 이 파일 머리말이 경고해 둔 "칸이 조용히 사라지는"
     그 자리입니다. 스물로 둡니다 (메일 한 통이 길어질 뿐입니다). */
  return Object.keys(d).slice(0, 20).map(function(k){
    const key = clean(k, 30), val = clean(d[k], 200);
    return (key && val) ? "  · " + key + " — " + val : null;
  }).filter(Boolean);
}

module.exports = async function handler(req, res){
  if(req.method !== "POST"){
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "POST 로 보내 주세요" });
  }

  /* ⚠️ 화면에서 온 것만 받습니다. 자물쇠가 아니라 문턱입니다 —
     진짜 속도 제한은 Vercel Firewall 에서 거세요. */
  if(!fromOurPages(req)){
    console.warn("[site] 우리 화면 밖에서 온 요청을 받지 않았습니다 (origin=" +
      (req.headers.origin || "없음") + ")");
    return res.status(403).json({ error: "잘못된 요청입니다" });
  }

  let b = req.body;
  if(typeof b === "string"){ try{ b = JSON.parse(b); }catch(e){ b = null; } }
  if(!b || typeof b !== "object") return res.status(400).json({ error: "내용을 읽지 못했습니다" });
  if(b.agree !== true) return res.status(400).json({ error: "개인정보 수집·이용 동의가 필요합니다" });

  const kind = KINDS[b.kind] ? b.kind : "quote";

  /* 어느 화면에서 왔든 공통 */
  const q = {
    kind:   kind,
    name:   clean(b.name, 80),
    tel:    clean(b.tel, 30),
    email:  clean(b.email, 120),
    region: clean(b.region, 80),
    at:     new Date().toISOString()
  };

  if(kind === "sos"){
    q.q   = clean(b.q, 4000);       /* 손님이 적은 상황 */
    q.cat = clean(b.cat, 40);       /* 빠른 선택 분류 */
    q.biz = clean(b.biz, 80);       /* 업종 */
  }
  else if(kind === "quote"){
    q.service     = clean(b.service, 40);
    q.serviceName = clean(b.serviceName, 60);
    q.q           = clean(b.q, 4000);
    q.budget      = clean(b.budget, 40);
    q.detail      = detailLines(b.detail);   /* 서비스마다 다른 답 */
    /* 해결 가이드에서 고르신 "업체에 물어볼 것".
       ⚠️ 이건 사장님이 업체에게 **대신 물어봐 달라고 맡기신 것**입니다.
       빠뜨리면 요청은 성공하는데 정작 물어볼 것이 사라집니다. */
    q.asks        = (Array.isArray(b.asks) ? b.asks : [])
                      .slice(0, 20)
                      .map(function(x){ return clean(x, 200); })
                      .filter(Boolean);
  }
  else {                             /* partner */
    q.company = clean(b.company, 80);
    q.brn     = clean(b.brn, 40);
    q.exp     = clean(b.exp, 200);
    q.note    = clean(b.note, 2000);
    q.services = (Array.isArray(b.serviceNames) && b.serviceNames.length
                    ? b.serviceNames : (Array.isArray(b.services) ? b.services : []))
                 .slice(0, 40).map(function(s){ return clean(s, 40); }).filter(Boolean);
  }

  /* ── 빠진 것 확인 ─────────────────────────────────────────
     ⚠️ 화면에서도 막지만 여기서 한 번 더 봅니다. 이 주소로 직접
     보내는 것은 화면을 거치지 않습니다. */
  if(!q.name || !q.tel) return res.status(400).json({ error: "성함과 연락처를 적어 주세요" });
  if(kind === "partner"){
    if(!q.company)         return res.status(400).json({ error: "업체명을 적어 주세요" });
    if(!q.services.length) return res.status(400).json({ error: "어떤 일을 하시는지 골라 주세요" });
  }else if(!q.q){
    return res.status(400).json({ error: "어떤 일인지 적어 주세요" });
  }

  /* ════════════════════════════════════════════════════════════
     §6 "모든 신청에 고유 신청번호를 발급한다"
     §6 "중복 신청과 스팸을 방지한다"

     ⚠️⚠️ **DB 가 없으면 접수번호를 발급하지 않습니다.** 번호를 내주고
     저장은 안 하면, 손님이 그 번호로 물어봐도 아무것도 없습니다 —
     그게 "하지 않은 일을 했다고 말하는 것" 입니다 (절대 규칙 5).
     번호는 **실제로 저장된 뒤에만** 손님에게 갑니다.

     ⚠️ 업체 입점(partner)은 신청이 아니라 **업체 등록**입니다. 다른
     표로 가야 해서 지금은 전과 똑같이 슬랙으로만 보냅니다 (§7 업체
     관리에서 붙습니다).
     ════════════════════════════════════════════════════════════ */
  let no = "";
  if(kind !== "partner" && dbReady()){
    /* 최근 한 시간, 같은 번호의 것만 가져옵니다
       ⚠️ 손님이 보낸 값을 질의문자에 그대로 이어 붙이지 않습니다 */
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const found = await dbSelect("request",
      "?select=no,tel,offer_id,cat,created_at" +
      "&tel=eq." + encodeURIComponent(telKey(q.tel)) +
      "&created_at=gte." + encodeURIComponent(since) +
      "&order=created_at.desc&limit=20");

    /* ⚠️ DB 가 대답하지 않으면 **접수를 막지 않습니다.** 중복 검사는
       편의이고, 그것 때문에 손님의 요청을 잃으면 더 나쁩니다.
       대신 운영자에게 남깁니다 (절대 규칙 3). */
    if(!found.ok) console.error("[site] 중복 검사를 못 했습니다 — " + dbWhy(found.why));
    else {
      const dup = intakeDup(new Date(), found.rows,
        { tel:q.tel, offerId:clean(b.offerId, 60), cat:q.cat || q.service });
      /* 같은 요청을 또 누른 것 — 두 번 보내지 않고 먼저 받은 번호를
         그대로 돌려줍니다 (손님에게는 성공입니다) */
      if(dup.dup){
        console.warn("[site] 중복 접수 — " + dup.why);
        return res.status(200).json({ ok:true, no:dup.no, dup:true, say:dup.say });
      }
      if(dup.spam){
        console.warn("[site] 접수가 너무 많습니다 — " + dup.why);
        /* ⚠️⚠️ 손님에게 "스팸" 이라고 하지 않습니다 (절대 규칙 3) */
        return res.status(429).json({ error:dup.say });
      }
    }

    /* 저장 — ⚠️ 저장이 실패하면 접수를 막지 않고 번호만 안 냅니다.
       슬랙으로는 그대로 갑니다. 손님의 요청을 잃는 쪽이 더 나쁩니다. */
    const cand = reqNo();
    const row = {
      no:        cand,
      side:      clean(b.side, 20) || (kind === "sos" ? "ops" : "start"),
      industry:  q.biz || clean(b.industry, 40) || null,
      cat:       q.cat || q.service || null,
      offer_id:  clean(b.offerId, 60) || null,
      region:    q.region || null,
      gu:        clean(b.gu, 40) || null,
      want_at:   clean(b.wantAt, 40) || null,
      body:      q.q || null,
      detail:    (b.detail && typeof b.detail === "object") ? b.detail : {},
      name:      q.name,
      tel:       q.tel,
      email:     q.email || null,
      /* ⚠️⚠️ 동의를 **시각으로** 남깁니다. boolean 으로 두면 "언제
         받았나" 를 못 대고, 그게 분쟁에서 받지 않은 것과 같아집니다. */
      agree_at:  new Date().toISOString(),
      /* ⚠️⚠️ 제3자 제공 재동의는 **여기서 받지 않습니다** (제17조 제2항).
         어느 업체에 줄지 정해지지 않았으니까요 — 배정할 때 받습니다.
         방침 제4조 제3항이 그렇게 적혀 있습니다. 비워 둡니다. */
      state:     "new"
    };
    const saved = await dbInsert("request", row);
    if(saved.ok) no = cand;
    else console.error("[site] 접수를 저장하지 못했습니다 — " + dbWhy(saved.why));
  }

  const head = kind === "sos" ? "[SOS]" : kind === "partner" ? "[파트너]" : "[견적]";
  const subject =
    kind === "partner"
      ? head + " " + q.company + " · " + q.services.slice(0,3).join(" · ") +
        (q.services.length > 3 ? " 외 " + (q.services.length - 3) : "")
      : head + " " + q.name +
        (kind === "sos"
           ? (q.biz ? " · " + q.biz : "") + (q.cat ? " · " + q.cat : "")
           : (q.serviceName ? " · " + q.serviceName : q.service ? " · " + q.service : ""));

  const L = [];
  /* ⚠️ 제일 위에 둡니다 — 직원이 전화하면서 제일 먼저 묻는 것입니다 */
  if(no) L.push("접수번호  " + no);
  if(kind === "partner") L.push("업체명    " + q.company);
  L.push("성함      " + q.name);
  L.push("연락처    " + q.tel);
  if(q.email)  L.push("이메일    " + q.email);
  if(q.biz)    L.push("업종      " + q.biz);
  if(q.region) L.push("지역      " + q.region);
  if(q.cat)    L.push("분류      " + q.cat);
  if(q.serviceName || q.service)
               L.push("서비스    " + (q.serviceName || q.service));
  if(q.budget) L.push("예산      " + q.budget + " 만원");
  if(q.brn)    L.push("사업자번호 " + q.brn);
  if(q.exp)    L.push("경력      " + q.exp);

  if(kind === "partner"){
    L.push("");
    L.push("── 하시는 일 ──");
    L.push(q.services.join(" · "));
    if(q.note){ L.push(""); L.push("── 더 하신 말씀 ──"); L.push(q.note); }
  }else{
    if(q.detail && q.detail.length){
      L.push("");
      L.push("── 요청 조건 ──");
      q.detail.forEach(function(x){ L.push(x); });
    }
    L.push("");
    L.push(kind === "sos" ? "── 적어 주신 상황 ──" : "── 필요한 것 ──");
    L.push(q.q);
    /* ⚠️ **제일 아래**에 둡니다. 업체에 견적을 부탁할 때 그대로 옮겨
       적을 수 있어야 하는 목록이라, 다른 것과 섞이면 안 됩니다. */
    if(q.asks && q.asks.length){
      L.push("");
      L.push("── 업체에 물어봐 달라고 하신 것 ──");
      q.asks.forEach(function(x, i){ L.push("  " + (i+1) + ". " + x); });
    }
  }
  const text = L.join("\n");

  const sent = await deliver(kind, q, subject, text);
  if(!sent.ok){
    console.error("[site] 요청을 전달하지 못했습니다 — " + why(kind, sent.why));
    return res.status(503).json({ error: "지금 접수하지 못했습니다" });
  }
  /* ⚠️ `no` 는 **실제로 저장됐을 때만** 들어갑니다. 화면은 있으면
     보여 주고 없으면 안 보여 줍니다 (자리표시자를 찍지 않습니다 —
     절대 규칙 2). */
  res.status(200).json(no ? { ok: true, no: no } : { ok: true });
};
