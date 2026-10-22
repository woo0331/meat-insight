/* ════════════════════════════════════════════════════════════════════
   /api/deal — 상태를 바꾸는 유일한 길   POST

   화면이 상태를 직접 쓰지 않습니다. 0003 · 0004 가 만든 **문 다섯**만
   부릅니다 —

     move_state         신청 · 배정 · 상담 · 계약의 상태 (§8)
                        ⚠️ 계약 완료로 가면 **계약(deal) 줄이 같이**
                           생깁니다 (0007) — 그게 없으면 수수료를
                           확정할 대상이 영영 안 생깁니다
     answer_assignment  업체의 수락 · 거절 (§7)
     confirm_fee        수수료 확정   ⚠️ 관리자만 (§9 · §13)
     mark_paid          입금 확인     ⚠️ 관리자만
     clawback_fee       환수 · 부분환불 ⚠️ 관리자만
     claim_request      로그인 전에 넣은 신청을 내 것으로 (0005 · §10)
     save_provider      업체 등록 · 수정 (직원 · 관리자 · 0007)
     approve_provider   공개 · 확인 배지 ⚠️ 관리자만 — 등록과 **다른 문**
     save_fee_policy    수수료 정책   ⚠️ 관리자만 (§6 · §9)
     set_fee_policy_active  정책 끄기 · 켜기 ⚠️ 관리자만
     submit_quote       견적 제출 · 수정 ⚠️ 배정을 수락한 업체만 (0008)
     withdraw_quote     견적 철회       ⚠️ 낸 업체만
     choose_quote       고객이 견적을 고름 (고객 · 직원 · 관리자)

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
const { deliver, clean } = require("./_send.js");

/* ⚠️⚠️ 여기 없는 이름은 **부르지 않습니다.** 손님이 보낸 글자가 곧
   함수 이름이 되는 자리라, 목록을 두지 않으면 DB 의 아무 함수나
   부를 수 있습니다. */
const OK_FN = {
  move_state:1, answer_assignment:1, claim_request:1,
  confirm_fee:1, mark_paid:1, clawback_fee:1,
  /* 2026-10-11 2차 (0007) — 업체 등록 · 승인 · 수수료 정책.
     ⚠️⚠️ **표를 열지 않고 문을 늘렸습니다.** 0001 의 GRANT 는
     `authenticated` 에게 insert 를 한 줄도 주지 않습니다 — 표를 열면
     기록 없이 지나가는 길이 하나 생깁니다 (§8). */
  save_provider:1, approve_provider:1,
  save_fee_policy:1, set_fee_policy_active:1,
  /* 2026-10-12 (0008) — 업체 견적 제출 · 수정 · 철회 + 고객의 선택.
     ⚠️⚠️ **상태를 바꾸는 것은 여기가 아닙니다.** `submit_quote` 가
     상담 중인 건을 `quoted` 로 넘길 때도 **DB 안에서 move_state() 를
     부릅니다** — 문이 하나라서 기록이 한 곳에만 남습니다 (§8). */
  submit_quote:1, withdraw_quote:1, choose_quote:1,
  /* 2026-10-17 (0009) — 신청 하나에 서비스 여러 개 · **항목별 배정** (§7).
     ⚠️⚠️ `save_request_items` 는 **여기 없습니다** — 로그인 전에 들어오는
     접수가 service key 로 부르는 길이고, 이 주소는 그 사람의 토큰으로만
     부릅니다. 여기 넣으면 로그인한 누구나 남의 신청에 항목을 꽂아
     넣습니다. */
  assign_item:1, move_item_state:1,
  /* 2026-10-18 (0010) — 회원 계정에 남는 임시저장 · 체크리스트 (§6-2 · §9).
     ⚠️⚠️ **`FN_SAY` 에 넣지 마세요.** 이 둘은 **자동저장**으로 불립니다 —
     운영자에게 알림을 보내면 체크 한 번에 슬랙 한 줄이고, 정작 돈 쪽
     알림이 그 더미에 묻힙니다. `notify()` 는 `FN_SAY` 에 없는 이름을
     **조용히 지나갑니다** (그게 여기서 맞는 동작입니다).
     ⚠️ 계정을 인자로 받지 않습니다 — DB 함수가 `auth.uid()` 에만
     씁니다 (변경자는 토큰에서만 옵니다). */
  save_user_state:1, clear_user_state:1,
  /* 2026-10-22 (0012) — 담당자 · 연락처 열람 이력 (오픈 전 전수검사 P0 ③⑤).
     ⚠️⚠️ note_request_open 은 **FN_SAY 에 넣지 마세요.** 관리자가 전화를
     걸려고 연락처를 열 때마다 불립니다 — 알림을 보내면 하루에 수십 줄이고
     정작 돈 쪽 알림이 그 더미에 묻힙니다 (save_user_state 와 같은 까닭).
     열람 이력은 audit_log 에 그대로 남습니다 (제29조 접속기록). */
  set_owner:1, note_request_open:1
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
  p_new_fee:1,                                         /* clawback_fee */
  /* 0007 — ⚠️ 이름을 **눈대중으로 적지 마세요.** 이 저장소가 돈 쪽
     다섯을 그렇게 적었다가 틀렸고, 그러면 함수가 **인자 없이 불려**
     거절당하는데 화면에는 "처리하지 못했습니다" 만 나갑니다.
     `checkRpcArgs()` 가 SQL 의 정의와 **양쪽으로** 맞춰 봅니다. */
  p_id:1, p_name:1, p_data:1,                          /* save_provider */
  p_listed:1, p_verified:1,                            /* approve_provider */
  p_provider:1,                                        /* save_fee_policy */
  p_active:1,                                          /* set_fee_policy_active */
  /* 0009 — ⚠️ `p_agree3rd` 를 빼지 마세요. 그 칸이 안 가면 DB 가
     제17조로 거절하고, 화면에는 "처리하지 못했습니다" 만 나갑니다. */
  p_item:1, p_agree3rd:1,                              /* assign_item · move_item_state */
  /* 0012 — ⚠️ p_owner 는 **직원 · 관리자 계정**이라야 합니다 (DB 가 봅니다).
     p_assignable 은 listed 와 다른 플래그입니다 — "배정해도 되는가" 입니다. */
  p_owner:1, p_assignable:1,                           /* set_owner · approve_provider */
  /* 0010 — ⚠️ 셋 중 **보낸 것만** 바뀝니다 (안 보낸 칸은 DB 가 그대로
     둡니다). 비우시려면 `[]` · `{}` 를 보내세요 — null 은 "안 바꿈" 입니다. */
  p_pick:1, p_draft:1, p_checks:1                      /* save_user_state */
};

function pickArgs(a){
  const out = {};
  if(!a || typeof a !== "object") return out;
  Object.keys(a).forEach(function(k){ if(OK_ARG[k]) out[k] = a[k]; });
  return out;
}

/* ════════════════════════════════════════════════════════════════════
   상태가 바뀌면 운영자에게 한 줄 (2차 10 · 최종 통합 지시서 §8)

   ⚠️⚠️ **손님에게 보내지 않습니다.** 문자 · 카톡 · 알림톡으로 보내려면
   정보통신망법 제50조의 **사전 수신동의**가 먼저이고, 지금 그 동의를
   받는 자리도 받아 둔 기록도 없습니다. 받지도 않은 동의로 보내는 것은
   이 저장소가 영업 문자에서 못박아 둔 그 선을 넘는 일입니다 —
   동의를 받는 자리가 생기는 날 그때 붙입니다.

   ⚠️⚠️ **개인정보를 한 글자도 싣지 않습니다.** 성함 · 연락처 · 메일은
   물론 **사유(`why`)도 안 보냅니다** — 사람이 손으로 적는 칸이라
   "김사장님이 다음 달에…" 가 들어올 수 있고, 그러면 그 순간 새 수탁
   범위가 됩니다 (제26조). 그래서 이 알림은 **"가서 보세요" 까지**이고,
   누가 · 언제 · 왜는 `audit_log` 에 그대로 있습니다 (§8).
   ⚠️ 덕분에 **방침의 수탁자를 고치지 않아도 됩니다** — 개인정보가
   안 나가기 때문입니다. 여기에 이름이나 사유를 더하시려면 그날
   `js/data/legal-privacy.js` 의 `trustees` 도 같이 고치세요
   (환경변수 · 준비 상태값 · 수탁자 셋은 언제나 같이 움직입니다).

   ⚠️ **실패해도 상태 변경을 되돌리지 않습니다.** 상태는 이미 DB 에
   적혔고, 여기서 에러를 돌려주면 운영자가 "안 됐구나" 하고 다시
   누릅니다 — 그러면 두 번째는 "갈 수 없는 길" 로 거절당해서 더
   헷갈립니다. 운영자 로그에만 남깁니다 (절대 규칙 3).

   ⚠️ **받을 곳은 접수와 같습니다** (`INTAKE_WEBHOOK_URL`). 따로 받고
   싶으시면 `DEAL_WEBHOOK_URL` 을 넣으세요 — `_send.js` 의 `envFor()`
   가 종류별 변수를 먼저 봅니다. 하나도 없으면 **조용히 지나갑니다**
   (알림은 거들기이고, 그것 때문에 상태 변경을 잃으면 더 나쁩니다).

   ⚠️ 걸러 내는 일은 **슬랙 워크플로**에서 하세요. 어느 변화를 보고
   싶은지는 운영하시는 분마다 다르고, 코드에 적어 두면 바꾸려면
   배포를 해야 합니다.
   ════════════════════════════════════════════════════════════════════ */

/* 무슨 일이 있었는가 — ⚠️ 함수 이름을 그대로 내보내지 않습니다
   (`set_fee_policy_active` 를 읽고 무슨 일인지 아는 사람은 저뿐입니다) */
const FN_SAY = {
  move_state:            "신청 상태가 바뀌었습니다",
  answer_assignment:     "업체가 배정에 답했습니다",
  claim_request:         "손님이 신청을 계정으로 가져갔습니다",
  confirm_fee:           "수수료를 확정했습니다",
  mark_paid:             "입금을 확인했습니다",
  clawback_fee:          "수수료를 환수했습니다",
  save_provider:         "업체를 등록 · 수정했습니다",
  approve_provider:      "업체 공개 상태를 바꿨습니다",
  save_fee_policy:       "수수료 정책을 저장했습니다",
  set_fee_policy_active: "수수료 정책을 켜거나 껐습니다",
  assign_item:           "서비스 항목을 업체에 배정했습니다",
  move_item_state:       "서비스 항목의 상태가 바뀌었습니다",
  submit_quote:          "업체가 견적을 냈습니다",
  withdraw_quote:        "업체가 견적을 거뒀습니다",
  choose_quote:          "고객이 견적을 골랐습니다",
  set_owner:             "담당자가 바뀌었습니다"
};

/* 알림에 실어도 되는 것 — ⚠️⚠️ **허용 목록입니다.** 인자가 하나
   늘어날 때마다 조용히 같이 나가지 않게, 실을 것을 적어 둡니다
   (`api/me.js` 가 칸 목록을 손으로 적는 것과 같은 까닭). */
const SAY_ARG = {
  p_request:"신청",  p_deal:"계약",   p_id:"대상",  p_provider:"업체",
  p_to:"바뀐 상태",  p_fee:"수수료",  p_total:"청구액", p_paid:"입금액",
  p_new_fee:"고친 수수료", p_yes:"수락", p_listed:"공개", p_active:"켜짐",
  /* ⚠️ p_owner(담당자 계정 id)는 **안 싣습니다** — 알림은 "가서 보세요"
     까지이고, 누가 맡았는지는 작업대와 audit_log 에 있습니다. */
  p_assignable:"배정 가능"
};

const NOTE_TIMEOUT = 5000;

async function notify(fn, args, role){
  const say = FN_SAY[fn];
  if(!say) return;                       /* 모르는 동작은 안 보냅니다 */

  const lines = Object.keys(SAY_ARG)
    .filter(function(k){ return args[k] !== undefined && args[k] !== null; })
    .map(function(k){ return SAY_ARG[k] + ": " + clean(String(args[k]), 80); });

  const subject = "[인수인계] " + say;
  const text = subject + "\n" +
    "바꾼 사람: " + clean(role || "", 20) + "\n" +
    lines.join("\n") + "\n\n" +
    "⚠️ 누가 · 언제 · 왜는 작업대(/admin)와 기록(audit_log)에 있습니다. " +
    "이 알림에는 성함 · 연락처 · 사유를 싣지 않습니다.";

  /* ⚠️ 시간 제한 — 받는 쪽이 대답을 안 하면 단추가 영원히 눌린 채로
     있습니다 (이 저장소가 접수 fetch 에서 겪은 자리). */
  try{
    await Promise.race([
      deliver("deal", { fn:fn, role:role || "" }, subject, text),
      new Promise(function(ok){ setTimeout(ok, NOTE_TIMEOUT); })
    ]);
  }catch(e){
    console.warn("[deal] 알림 — " + (e && e.message));
  }
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

  /* ⚠️ 성공한 **뒤에만** 보냅니다 — 거절당한 것을 알리면 운영자가
     "바뀌었구나" 로 읽습니다. ⚠️⚠️ `await` 로 기다립니다: 서버리스는
     응답을 돌려준 뒤 프로세스를 멈춰서, 기다리지 않으면 알림이
     **조용히 사라집니다.** 실패는 위에서 삼킵니다. */
  await notify(fn, pickArgs(b.args), s.role);

  return res.status(200).json({ ok:true, data:r.data === undefined ? null : r.data });
};
