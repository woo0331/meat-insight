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
/* 감사 기록은 한 계약에 여러 줄이 쌓입니다 (확정 · 입금 · 환수) —
   같은 수로 두면 환수 줄이 뒤로 밀려 합계가 조용히 모자랍니다. */
const AUDIT_LIMIT = 200;
/* 배정할 업체를 고르는 목록이라 신청보다 넉넉합니다 — 지금 0곳이고,
   ⚠️ 여기가 모자라기 시작하면 고르개가 아니라 **검색**이 필요한 때입니다
   (목록을 조용히 자르지 말고 그때 고치세요). */
const PROV_LIMIT = 200;

/* 수수료 정책 — 업체마다 여럿일 수 있습니다 (상품별 · 기간별) */
const FEE_LIMIT = 200;
/* 견적 — 신청 하나에 여럿 오고(배정한 업체마다 하나) 신청은 LIMIT 건
   입니다. ⚠️ 모자라면 숫자를 올리는 것이 아니라 **신청별로 묻는 때**입니다
   (이력을 연 건 하나만 묻는 것과 같은 까닭). */
const QUOTE_LIMIT = 300;
/* 신청 **한 건**의 이력. ⚠️ 한 건이 쉰 번 넘게 바뀌면 그건 이 숫자를
   올릴 때가 아니라 **그 건을 들여다볼 때**입니다. */
const HIST_LIMIT = 100;

/* ⚠️ 칸 목록을 역할마다 **손으로** 적습니다. `select=*` 로 두면 칸이
   하나 늘 때마다 조용히 같이 나갑니다. */
/* ⚠️⚠️ **`id` 를 빠뜨리면 견적이 통째로 안 보입니다.** 견적은
   `request_id` 로 신청에 붙는데, 고객 · 업체 칸에 `id` 가 없어서
   화면이 **짝을 못 맞췄습니다** — 에러도 안 나고 구간이 그냥 안
   그려집니다 (이 저장소가 "조용히 안 나오는" 으로 여러 번 겪은 꼴).
   ⚠️ 자기 신청의 id 입니다 — RLS 가 이미 자기 줄만 주고, 이력
   (`?r=`)도 같은 RLS 를 거칩니다. */
/* ⚠️⚠️ 2026-10-17 §6 · §7 — **신청 서비스 항목**을 같이 가져옵니다.
   항목이 안 오면 관리자가 "인테리어 → A · 주방 → B" 를 할 자리가 화면에
   없습니다 (그게 이번에 고친 자리입니다).
   ⚠️ 항목의 배정도 같이 묻습니다 — 어느 항목에 누가 붙었는지를 화면이
   한 번에 그려야 합니다. RLS 가 **볼 수 있는 줄만** 돌려줍니다. */
/* ⚠️⚠️ 2026-10-18 §7-3 — **사진은 경로를 내려보내지 않습니다.** 보는
   길은 `/api/upload?p=<id>` 하나이고, 거기서 **그때그때 서명된 주소**를
   만듭니다 (버킷은 비공개입니다). 경로를 내려보내면 그 글자만으로
   버킷을 두드려 볼 수 있는 길이 생깁니다. */
const PHOTOS = "request_photo(id,mime,bytes,created_at)";

const ITEMS_C = "request_item(id,service_id,state)";
const ITEMS_S = "request_item(id,service_id,state,detail," +
                "assignment(provider_id,state,created_at))";

/* ── 회원 계정에 남는 임시저장 · 체크리스트 (0010 · 2026-10-18 §6-2 · §9)
   ⚠️ 역할과 무관합니다 — **자기 줄 하나**이고 RLS 의 `state_mine` 이
   그것만 줍니다. 그래서 칸을 역할마다 가르지 않습니다.
   ⚠️ `account_id` 를 안 가져옵니다 — 자기 줄인 것이 이미 정해져 있어
   화면이 쓸 일이 없습니다 (최소 수집). */
const STATE_PICK = "pick,draft,checks,updated_at";

const PICK = {
  customer:
    "id,no,side,cat,industry,region,gu,state,want_at,created_at," +
    "assignment(state,created_at,provider(id,name))," + ITEMS_C + "," + PHOTOS,
  /* ⚠️ 업체에게는 **배정된 항목만** 갑니다 (RLS 의 `item_provider`) —
     같은 신청에 담긴 다른 서비스는 안 보입니다 (제17조). */
  provider:
    "id,no,side,cat,industry,region,gu,state,want_at,body,detail,created_at," +
    "name,tel,email,assignment(state,why,created_at)," + ITEMS_C + "," + PHOTOS,
  /* ⚠️⚠️ 목록에 **성함 · 연락처가 없습니다** — 화면 하나가 곧 유출인
     자리입니다. 전화하려면 건을 열어야 합니다. */
  staff:
    "id,no,side,cat,industry,region,gu,state,created_at," +
    "assignment(provider_id,state,created_at)," + ITEMS_S + "," + PHOTOS
};

module.exports = async function handler(req, res){
  if(req.method !== "GET"){
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error:"GET 으로 보내 주세요" });
  }
  /* ⚠️ 사람마다 다른 답입니다 — 캐시되면 남의 신청이 내 화면에 옵니다 */
  res.setHeader("cache-control", "no-store");

  /* ⚠️⚠️ **주소에서 온 글자는 묻기 전에 거릅니다.** 그대로 질의에
     들어가는 자리이고, 늦게 거르면 못 쓸 값으로 DB 를 세 번 두드린
     뒤에 거절하게 됩니다 (표 이름을 소문자와 밑줄만 남기는 것과 같은
     까닭). ⚠️ `r` 은 신청 **한 건**의 이력을 물을 때만 옵니다. */
  const one = String((req.query && req.query.r) || "").trim();
  if(one && !/^[0-9a-fA-F-]{36}$/.test(one))
    return res.status(400).json({ error:"신청 번호를 읽을 수 없습니다" });

  /* ⚠️⚠️ **`?s=1` 은 메모장만 묻습니다.** 고르신 서비스 · 적어 두신
     조건 · 체크해 두신 항목은 `/startup` · `/operation` · `/quote` 가
     **화면을 열 때마다** 맞춰 봐야 하는 값인데, 거기서 이 주소를
     그냥 부르면 신청 쉰 건 · 견적 삼백 건이 같이 내려옵니다 — 쓰지도
     않는 개인정보를 화면까지 끌고 오는 것이고 받는 양도 몇 배입니다.
     ⚠️ **새 주소를 만들지 않았습니다** — 질의문자 하나입니다. */
  const onlyState = String((req.query && req.query.s) || "") === "1";

  if(!authReady())      return res.status(200).json({ auth:false, signedIn:false });
  if(!bearer(req))      return res.status(200).json({ auth:true, signedIn:false });

  const s = await session(req);
  if(!s.ok){
    if(s.timeout) return res.status(504).json({ error:"시간이 초과되었습니다. 다시 눌러 주세요" });
    return res.status(200).json({ auth:true, signedIn:false });
  }

  /* ── 메모장 (0010) ────────────────────────────────────────────────
     ⚠️ 줄이 없으면 **빈 값**입니다 (404 가 아닙니다) — 아직 아무것도
     저장하지 않으신 분이고, 그건 잘못된 일이 아닙니다 (절대 규칙 2).
     ⚠️ 못 읽어도 **나머지를 막지 않습니다** — 메모장은 거들기이고,
     그것 때문에 신청 내역이 안 보이면 더 나쁩니다. */
  async function readState(){
    const st = await dbSelectAs(s.token, "user_state",
      "?select=" + encodeURIComponent(STATE_PICK) + "&limit=1");
    if(!st.ok){ console.warn("[me] user_state — " + st.why); return null; }
    return (st.rows && st.rows[0]) || null;
  }

  if(onlyState){
    const st = await readState();
    return res.status(200).json({
      auth:true, signedIn:true, role:s.role, state: st });
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
  /* 마이페이지가 "저장해 두신 것" 을 같이 냅니다 (§6-2 · §9) */
  out.state = await readState();

  /* 업체 · 관리자만 계약을 봅니다. ⚠️ 고객에게는 **묻지도 않습니다** —
     RLS 가 어차피 빈 목록을 주지만, 안 묻는 쪽이 한 겹 더 안전합니다. */
  if(s.role === "provider" || s.role === "admin"){
    const d = await dbSelectAs(s.token, "deal",
      "?select=" + encodeURIComponent(
        "id,request_id,provider_id,amount,fee,fee_vat,fee_total,paid,paid_at," +
        "signed_at,done_at,fee_at,fee_snap,created_at," +
        /* ⚠️ 계약 한 줄만 보면 **어느 건인지** 모릅니다 — 관리자가
           수수료를 확정할 때 보는 것은 "누구의 무슨 일" 입니다.
           ⚠️⚠️ 성함 · 연락처는 **안 가져옵니다** (목록 하나가 곧
           유출인 자리 · PICK.staff 와 같은 선). */
        "request(no,side,cat,industry,region,gu,state)") +
      "&order=created_at.desc&limit=" + LIMIT);
    if(d.ok) out.deals = d.rows;
    else console.warn("[me] deal — " + d.why);
  }

  /* 배정할 업체 목록 — 직원 · 관리자만입니다 (§6 "업체 수동 배정").
     ⚠️⚠️ **고객 · 업체에게는 묻지도 않습니다.** 공개 목록은 빌드가 미리
     만든 HTML 이 내보내니(`/providers`) 로그인해서 DB 로 볼 이유가 없고,
     여기 오는 것은 `listed=false` 인 **아직 안 켠 업체까지**입니다
     (`provider_public` 정책이 직원 · 관리자에게만 그것을 열어 둡니다).
     ⚠️ `verified` 를 안 가져옵니다 — 배정에 쓰는 값이 아니고 jsonb 라
     통째로 따라 나옵니다 (최소 수집). */
  if(role === "staff"){
    const p = await dbSelectAs(s.token, "provider",
      "?select=" + encodeURIComponent(
        "id,name,regions,gu,industries,subs,listed") +
      "&order=name.asc&limit=" + PROV_LIMIT);
    if(p.ok) out.providers = p.rows;
    else console.warn("[me] provider — " + p.why);
  }

  /* 환수 · 부분환불 — ⚠️⚠️ **`deal` 에는 안 남습니다.** 확정했던 액을
     갈아 치우지 않으려고 차액을 **감사 기록**에 적습니다 (0003 의
     clawback_fee). 그래서 §10 의 "환수액" 은 여기서 가져옵니다.
     ⚠️ 관리자만입니다 — 업체에게는 자기 건의 기록이 보이지만 합계를
     낼 자리가 아니고, 직원은 돈을 안 봅니다 (위 PICK 과 같은 선).
     ⚠️⚠️ **거르는 일을 질의로 하지 않습니다.** jsonb 경로 거르개는
     PostgREST 가 400 을 돌려주면 **에러 없이 숫자만 0** 이 됩니다 —
     DB 가 아직 안 서서 눌러 볼 수가 없어, 확실히 되는 것(obj)만 걸고
     차액이 적힌 줄은 화면이 고릅니다. 그래서 화면이 "이 줄에서 센
     값" 이라고 밝힙니다. */
  if(s.role === "admin"){
    const c = await dbSelectAs(s.token, "audit_log",
      "?select=" + encodeURIComponent("at,obj_id,data") +
      "&obj=eq.deal&order=at.desc&limit=" + AUDIT_LIMIT);
    if(c.ok) out.audits = c.rows;
    else console.warn("[me] audit_log — " + c.why);
  }

  /* ── 수수료 정책 (§6 "수수료 정책 등록" · 0007) ──────────────────
     ⚠️⚠️ **관리자만**입니다. 업체에게 남의 요율이 보이면 안 되고,
     직원은 돈을 안 봅니다 (위 PICK 과 같은 선). RLS 의 `fee_mine` 이
     업체에게 자기 것만 주지만, **안 묻는 쪽이 한 겹 더 안전합니다.** */
  if(s.role === "admin"){
    const f = await dbSelectAs(s.token, "fee_policy",
      "?select=" + encodeURIComponent(
        "id,provider_id,offer_id,type,flat,rate,min_fee,max_fee,vat," +
        "confirm_when,cycle,refund_rule,from_date,to_date,active,created_at") +
      "&order=created_at.desc&limit=" + FEE_LIMIT);
    if(f.ok) out.fees = f.rows;
    else console.warn("[me] fee_policy — " + f.why);
  }

  /* ── 견적 (§4 · §6 · 0008) ───────────────────────────────────────
     ⚠️⚠️ **칸을 역할마다 손으로 적습니다** (위 PICK 과 같은 선).
     `select=*` 로 두면 칸이 하나 늘 때마다 조용히 같이 나갑니다.

     고객 ─ 비교에 쓰는 것 + **업체 상호**. 거둔 견적은 애초에 오지
            않습니다 (0008 의 `quote_requester` 정책이 걸러 줍니다) —
            업체가 거둔 금액으로 기대를 하면 그건 업체가 하지 않은
            약속입니다 (절대 규칙 5).
     업체 ─ 내가 낸 것. ⚠️ 고치려면 지금 적힌 값이 화면에 있어야
            합니다 (안 주면 빈 폼에 처음부터 다시 적습니다 — 업체
            상세의 `quoteTo({})` 로 겪은 자리).
     직원 · 관리자 ─ 같은 칸. ⚠️ 성함 · 연락처는 `request` 쪽에서도
            안 가져옵니다 (PICK.staff 와 같은 선).

     ⚠️ 돈이 걸린 값이지만 **수수료가 아닙니다.** 견적 금액은 고객이
     업체에 내는 돈이고, 수수료는 업체가 우리에게 내는 돈입니다 —
     고객에게 수수료를 안 보여 주는 규칙과 어긋나지 않습니다. */
  {
    const qp = "id,request_id,provider_id,amount,vat,scope,excludes,days," +
               "start_on,warranty,valid_to,note,state,chosen_at," +
               "created_at,updated_at";
    const qq = await dbSelectAs(s.token, "quote",
      "?select=" + encodeURIComponent(
        s.role === "customer" ? qp + ",provider(id,name)" : qp) +
      "&order=created_at.desc&limit=" + QUOTE_LIMIT);
    if(qq.ok) out.quotes = qq.rows;
    else console.warn("[me] quote — " + qq.why);
  }

  /* ── 신청 한 건의 이력 (§6 "신청 및 변경 이력" · §8) ──────────────
     ⚠️⚠️ **목록에 다 붙이지 않습니다.** 신청 쉰 건의 이력을 통째로
     내리면 화면 하나가 곧 유출이고(사유에 사정이 적힙니다), 받는 양도
     몇 배가 됩니다. **연 건 하나만** 가져옵니다.
     ⚠️ 거르는 일은 RLS 가 합니다 — `audit_read` 가 자기 것만 줍니다. */
  if(one){
    const h = await dbSelectAs(s.token, "audit_log",
      "?select=" + encodeURIComponent("at,by_role,obj,from_state,to_state,why") +
      "&obj=eq.request&obj_id=eq." + encodeURIComponent(one) +
      "&order=at.asc&limit=" + HIST_LIMIT);
    if(h.ok) out.history = h.rows;
    else console.warn("[me] audit_log(request) — " + h.why);
  }

  return res.status(200).json(out);
};
