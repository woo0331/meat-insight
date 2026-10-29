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
const { dbSelectAs, dbRpc } = require("./_db.js");

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
/* 담당자로 둘 수 있는 직원 · 관리자. ⚠️ 모자라기 시작하면 숫자를
   올리는 것이 아니라 **검색**이 필요한 때입니다 (업체 고르개와 같은 선). */
const STAFF_LIMIT = 100;

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
    /* ⚠️⚠️ 2026-10-22 (0012) — **owner_id** 는 "이 건을 지금 누가
       맡았나" 입니다. `audit_log.by_user`(누가 바꿨나)와 다른 것이고,
       없으면 직원이 둘이 되는 날 **같은 건에 두 사람이 전화**합니다.
       ⚠️ 담당자의 **성함은 여기로 안 옵니다** — 화면이 직원 목록
       (아래 out.staff)에서 id 로 찾습니다 (최소 수집). */
    "id,no,side,cat,industry,region,gu,state,owner_id,created_at," +
    "assignment(provider_id,state,created_at)," + ITEMS_S + "," + PHOTOS
};

/* 신청 **한 건**의 연락처 (2026-10-22 P0 ③ · 직원 · 관리자만)
   ⚠️⚠️ **목록에는 없고 여기에만 있습니다.** 목록 하나가 곧 유출인
   자리라 쉰 건의 성함 · 번호를 깔지 않습니다 — 그런데 **여는 길도
   없어서** 관리자가 슬랙을 보고 전화하고 있었습니다 (작업대에서
   상태를 바꾸는 일과 전화하는 일이 다른 창에 있었습니다).
   ⚠️ 열면 `note_request_open()` 이 **열람 이력을 남깁니다**
   (개인정보보호법 제29조 접속기록). 기록이 남으면 "필요할 때만
   여는" 것이 지켜집니다. */
const ONE_CONTACT = "id,no,name,tel,email,body,detail,want_at,owner_id," +
                    "side,cat,industry,region,gu,state,created_at";

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

  /* ⚠️⚠️ **연락처는 따로 물어야 나옵니다** (`?r=<id>&c=1`). 줄을 펼칠
     때마다 주면 ① 열람 이력이 "펼친 횟수" 가 되어 뜻이 없어지고
     ② 쓸 일 없는 개인정보가 화면까지 따라옵니다. 전화를 걸려고
     **일부러 누르는 자리**라야 기록이 뜻을 가집니다. */
  const wantContact = String((req.query && req.query.c) || "") === "1";

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

  /* ⚠️ `me` 는 **자기 계정 id** 입니다 — 담당자를 "내가 맡기" 로 둘 때와
     "내 건만" 을 거를 때 화면이 자기 id 를 알아야 합니다. 남의 것이
     아니라 자기 것이라 보내도 되는 값입니다 (토큰에서 왔습니다). */
  const out = { auth:true, signedIn:true, role:s.role, me:s.sub, requests:q.rows };
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

  /* 내 업체 한 줄 (2026-10-22 P2 ⑳ · 업체 계정만)
     ⚠️⚠️ **고치는 화면이 그것을 되읽어야** 합니다 — 지금 적힌 값을
     모르면 소개를 고치려는 분이 처음부터 다시 적습니다.
     ⚠️ `provider_public` 정책에 `id = my_provider()` 가 있어서 공개
     전(`listed=false`)이어도 **자기 줄은** 보입니다.
     ⚠️⚠️ `verified` 를 **같이 가져옵니다** — 업체 화면이 "무엇이
     확인됐는가" 를 내는데, 그건 **못 고치는 칸**이라고 그 자리에서
     말해 주어야 합니다 (안 보여 주면 "왜 안 켜지나" 를 물으러 옵니다). */
  if(s.role === "provider"){
    const mine = await dbSelectAs(s.token, "provider",
      "?select=" + encodeURIComponent(
        "id,name,intro,regions,gu,industries,subs,since,consult_hours," +
        "verified,listed,assignable") +
      "&id=eq." + encodeURIComponent(s.provider_id || "") + "&limit=1");
    if(mine.ok) out.mine = (mine.rows || [])[0] || null;
    else console.warn("[me] provider(mine) — " + mine.why);

    /* 담당자 — ⚠️ `provider_contact_self` 가 자기 줄만 엽니다 (0013).
       ⚠️ `updated_by` 는 안 가져옵니다 (화면이 쓰지 않습니다 · 최소 수집). */
    const mc = await dbSelectAs(s.token, "provider_contact",
      "?select=" + encodeURIComponent("provider_id,name,tel,email,memo,updated_at") +
      "&provider_id=eq." + encodeURIComponent(s.provider_id || "") + "&limit=1");
    if(mc.ok) out.myContact = (mc.rows || [])[0] || null;
    else console.warn("[me] provider_contact(mine) — " + mc.why);
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
        /* ⚠️⚠️ 2026-10-22 (0012) — **`assignable` 을 같이 가져옵니다.**
           `listed`(손님 목록에 보이는가)와 다른 것이고, 안 가져오면
           화면이 배정 고르개에서 **잠글 수가 없습니다** — 구두 합의
           단계 업체에 배정되면 그 순간 제17조입니다. */
        "id,name,regions,gu,industries,subs,listed,assignable") +
      "&order=name.asc&limit=" + PROV_LIMIT);
    if(p.ok) out.providers = p.rows;
    else console.warn("[me] provider — " + p.why);

    /* ⚠️⚠️ 2026-10-25 (0018) — **계정이 이어졌는가**를 같이 보냅니다.
       길 표에서 `assigned → accepted` · `accepted → consult` ·
       `consult → quoted` 세 걸음이 **업체 전용**이라, 계정이 안 이어진
       업체에 배정하면 그 건이 **배정에서 멈춥니다.** 화면이 그것을
       보여 줄 수 있어야 합니다.
       ⚠️ `account` 를 직접 읽지 않습니다 — 직원에게는 **직원 · 관리자
       줄만** 열려 있습니다 (0012 `account_staff`). 그래서 문으로 묻고,
       돌아오는 것은 **업체 id 뿐**입니다 (사람 정보가 아닙니다).
       ⚠️ 실패해도 목록은 그대로 냅니다 — 연결 표시만 안 보입니다
       (배정 자체는 DB 가 막습니다). */
    const lk = await dbRpc(s.token, "linked_providers", {});
    if(lk.ok && Array.isArray(lk.data)) out.linked = lk.data;
    else console.warn("[me] linked_providers — " + (lk.why || "모양이 다릅니다"));

    /* 담당자 고르개 (2026-10-22 P0 ⑤) — 직원 · 관리자 계정만입니다.
       ⚠️⚠️ **고객 계정은 애초에 안 옵니다** — 0012 의 `account_staff`
       정책이 `role in ('staff','admin')` 으로 묶어 두었습니다. 화면
       코드로만 거르면 버그 하나에 고객 성함 목록이 섭니다.
       ⚠️ 이름이 없는 계정도 그대로 옵니다 — 화면이 메일 대신 id 앞
       토막을 보여 줍니다 (지어내지 않습니다). */
    const st = await dbSelectAs(s.token, "account",
      "?select=" + encodeURIComponent("id,name,role") +
      "&role=in.(staff,admin)&order=name.asc&limit=" + STAFF_LIMIT);
    if(st.ok) out.staff = st.rows;
    else console.warn("[me] account(staff) — " + st.why);

    /* 업체 담당자 (2026-10-22 P1 ⑬ · 0013) — 배정하고 **전화할 사람**.
       ⚠️⚠️ **`provider` 가 아니라 별도 표입니다.** 0001 의 GRANT 가
       `grant select on provider to authenticated` 로 표째라, 거기에
       직통 번호를 넣으면 `listed=true` 인 줄을 **로그인한 손님 전부가**
       읽습니다 (RLS 는 줄은 막아도 칸은 못 막습니다).
       ⚠️ 고객 연락처처럼 **한 번 더 눌러 받게 하지 않았습니다** —
       그쪽은 접수하신 분의 개인정보라 열람 이력이 뜻을 가지는데,
       이것은 업체가 **영업용으로 준 연락처**이고 `/admin` 영업
       작업대가 이미 같은 성격의 값을 그대로 들고 있습니다. 대신
       직원 · 관리자 밖으로는 한 글자도 안 나갑니다 (0013 의 RLS 에
       고객 정책이 **아예 없습니다**).
       ⚠️ `updated_by` 를 안 가져옵니다 — 화면이 쓰지 않습니다 (최소 수집). */
    const pc = await dbSelectAs(s.token, "provider_contact",
      "?select=" + encodeURIComponent("provider_id,name,tel,email,memo,updated_at") +
      "&order=updated_at.desc&limit=" + PROV_LIMIT);
    if(pc.ok) out.contacts = pc.rows;
    else console.warn("[me] provider_contact — " + pc.why);

    /* 업체 입점 신청 (2026-10-25 진단 P1-7 · 0016) — `/join` 으로
       들어온 것입니다.
       ⚠️⚠️ **고객 · 업체에게는 묻지도 않습니다.** 0016 의 RLS 에 그
       정책이 **아예 없어서** 어차피 0줄이지만, 묻지 않는 쪽이 한 겹 더
       안전합니다 (`audit_log` 를 관리자에게만 묻는 것과 같은 선).
       ⚠️ `moved_by` 를 안 가져옵니다 — 화면이 쓰지 않습니다 (최소 수집).
       ⚠️⚠️ 담당자 연락처(`tel` · `email`)는 **업체가 영업용으로 적어
       보낸 것**이라 그대로 가져옵니다 — 손님의 개인정보처럼 한 번 더
       눌러 받게 하지 않습니다 (`provider_contact` 와 같은 선). 대신
       직원 · 관리자 밖으로는 한 글자도 안 나갑니다. */
    const ap = await dbSelectAs(s.token, "provider_apply",
      "?select=" + encodeURIComponent(
        "id,no,company,brn,name,tel,email,region,industry,services,note," +
        "state,provider_id,memo,moved_at,created_at") +
      "&order=created_at.desc&limit=" + LIMIT);
    if(ap.ok) out.applies = ap.rows;
    else console.warn("[me] provider_apply — " + ap.why);

    /* 직접 매입 재고 (2026-10-29 PHONEWAY ⑥ · 0020) — 우리가 사서
       고쳐 파는 **매매 장부**입니다 (deal 은 중개 장부입니다).
       ⚠️⚠️ **업체에게는 묻지도 않습니다.** 0020 의 RLS 에 그 정책이
       아예 없어서 어차피 0줄이지만, 매입원가가 곧 경쟁 정보라
       묻지 않는 쪽이 한 겹 더 안전합니다 (지시서 §10).
       ⚠️⚠️ **수익을 칸으로 안 가져옵니다** — `v_device_pl` 이 원가와
       붙은 비용을 그 자리에서 셉니다 (평점을 값으로 안 들고 있는
       것과 같은 까닭 · 숫자로 들고 있으면 기록과 어긋나기 시작합니다).
       ⚠️ 뷰를 거치므로 `cost` · `sold_price` 도 같이 옵니다 — 직원이
       검수하고 값을 매기는 자리라 그게 맞습니다. 그 둘은 **고객 ·
       업체에게는 칸 권한 자체가 없습니다** (0020 의 GRANT). */
    const dv = await dbSelectAs(s.token, "v_device_pl",
      "?select=" + encodeURIComponent(
        "id,request_id,state,said_model,said_cap,said_grade," +
        "model,cap,color,grade,batt,imei_tail,note," +
        "cost,price,sold_price,spent,est_profit,real_profit," +
        "checked_at,listed_at,sold_at,created_at") +
      "&order=created_at.desc&limit=" + LIMIT);
    if(dv.ok) out.devices = dv.rows;
    else console.warn("[me] v_device_pl — " + dv.why);

    /* 비용 — ⚠️ 기기마다 따로 묻지 않습니다 (기기 쉰 대면 왕복이 쉰
       번입니다). 한 번에 가져와 화면이 기기별로 묶습니다. */
    const dc = await dbSelectAs(s.token, "device_cost",
      "?select=" + encodeURIComponent("id,device_id,kind,amount,memo,at") +
      "&order=at.desc&limit=" + (LIMIT * 4));
    if(dc.ok) out.deviceCosts = dc.rows;
    else console.warn("[me] device_cost — " + dc.why);
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

  /* ── 기간별 정산 (§9 · §12 · 0013) ───────────────────────────────
     ⚠️⚠️ **관리자만**입니다. 업체에게는 `settle_mine` 정책이 자기 것만
     주지만, 여기서 **묻지 않는 쪽이 한 겹 더 안전합니다** (수수료
     정책과 같은 선). 직원은 돈을 안 봅니다.
     ⚠️⚠️ `state` 를 그대로 믿지 마세요 — 입금의 진실은 건별
     `deal.paid` 이고, 이 줄은 `build_settlement()` 이 **그 시점에
     세어 둔 사본**입니다 (정책 사본과 같은 까닭). 화면이 "언제 센
     값인가"(`approved_at`)를 같이 냅니다. */
  if(s.role === "admin"){
    const se = await dbSelectAs(s.token, "settlement",
      "?select=" + encodeURIComponent(
        "id,provider_id,from_date,to_date,total,state,approved_at,paid_at,created_at") +
      "&order=from_date.desc&limit=" + FEE_LIMIT);
    if(se.ok) out.settles = se.rows;
    else console.warn("[me] settlement — " + se.why);
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

  /* ── 신청 한 건의 연락처 (2026-10-22 P0 ③) ──────────────────────
     ⚠️⚠️ **직원 · 관리자만**입니다. 고객 · 업체는 자기 쪽 칸에서 이미
     받고 있어서(PICK.customer · PICK.provider) 또 줄 까닭이 없습니다 —
     여기서 역할을 안 보면 업체가 `?c=1` 로 **배정 안 된 건의** 연락처를
     긁는 길이 열립니다 (RLS 가 줄은 막지만 묻지 않는 쪽이 한 겹 더
     안전합니다 · PICK 을 역할마다 손으로 적는 것과 같은 선).
     ⚠️ 거르는 일은 RLS 가 합니다 — `request_staff` 가 직원 · 관리자에게
     줄을 열어 둡니다. */
  if(one && wantContact && role === "staff"){
    const c1 = await dbSelectAs(s.token, "request",
      "?select=" + encodeURIComponent(ONE_CONTACT) +
      "&id=eq." + encodeURIComponent(one) + "&limit=1");
    if(c1.ok && c1.rows && c1.rows[0]){
      out.contact = c1.rows[0];
      /* ⚠️⚠️ **기록을 먼저 남기고 주는 것이 아닙니다** — 기록이 실패해도
         연락처는 돌려줍니다. 전화를 걸어야 하는 사람을 기록 때문에
         막으면 손님이 기다립니다 (중복 검사가 실패해도 접수를 막지
         않는 것과 같은 판단). 대신 운영자에게 남깁니다 (절대 규칙 3). */
      const lg = await dbRpc(s.token, "note_request_open",
        { p_request: one, p_why: "작업대에서 연락처를 열었습니다" });
      if(!lg.ok) console.warn("[me] note_request_open — " + lg.why);
    }
    else if(!c1.ok) console.warn("[me] request(contact) — " + c1.why);
  }

  return res.status(200).json(out);
};
