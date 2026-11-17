/* ════════════════════════════════════════════════════════════════════
   신청번호 · 중복 · 스팸 (지시서 §6)

   ⚠️ 파일 이름이 밑줄(_)로 시작합니다. Vercel 은 `api/` 안의 파일을
   전부 주소로 만드는데 밑줄로 시작하는 것은 빼 줍니다 — 이 파일이
   `/api/_intake` 로 열리면 안 됩니다 (`api/_send.js` 와 같습니다).

   ── §6 이 요구한 것 ──────────────────────────────────────
   "모든 신청에 고유 신청번호를 발급한다"
   "중복 신청과 스팸을 방지하고, 개인정보는 권한에 따라 접근을 제한한다"

   ⚠️⚠️ **여기에는 DB 가 없습니다.** 전부 순수 함수입니다 — 최근 신청
   목록을 받아서 판단만 합니다. 그래서 DB 를 세우기 전에도 전부 검사할
   수 있습니다 (`node tools/test-intake.js`).
   ════════════════════════════════════════════════════════════════════ */

const crypto = require("crypto");

/* ── 신청번호 ─────────────────────────────────────────────────
   ⚠️⚠️ **순번으로 만들지 마세요.** `2026-0001` 꼴이면 남의 신청번호를
   세어 볼 수 있습니다 — 그 번호로 조회가 되는 순간 다른 사장님의
   성함·연락처·요청 내용이 보입니다.

   ⚠️ 그렇다고 아무 글자나 쓰면 안 됩니다. 직원이 **전화로 읽어 줘야**
   하는 번호입니다 — `0/O` · `1/I/L` · `U`(V 와 헷갈림)를 뺀 서른두
   글자만 씁니다 (Crockford base32).

   ⚠️⚠️ **Math.random() 을 쓰지 마세요.** 예측이 됩니다. 돈과 개인정보가
   걸린 번호라 crypto 로 뽑습니다.

   ⚠️ 날짜를 앞에 붙이지 않았습니다. 보기에는 좋은데 "이 회사가 한 달에
   몇 건 받는가" 가 번호에서 읽힙니다. */
const A32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";   /* I · L · O · U 없음 */

function reqNo(){
  /* 8글자 = 40비트. 속도 제한과 같이 쓰면 넉넉합니다. */
  const b = crypto.randomBytes(8);
  let s = "";
  for(let i = 0; i < 8; i++) s += A32[b[i] % 32];
  /* 읽어 주기 쉽게 넷씩 끊습니다 — 보관은 이 꼴 그대로입니다 */
  return "SW-" + s.slice(0, 4) + "-" + s.slice(4);
}

/* 손님이 적어 온 번호를 받아 봅니다 (대소문자 · 띄어쓰기 상관없이) */
function reqNoClean(v){
  const s = String(v == null ? "" : v).toUpperCase().replace(/[^0-9A-Z]/g, "");
  const m = s.match(/^SW([0-9A-Z]{8})$/);
  if(!m) return "";
  /* 뺀 글자가 섞여 있으면 우리 번호가 아닙니다 */
  for(const c of m[1]) if(A32.indexOf(c) < 0) return "";
  return "SW-" + m[1].slice(0, 4) + "-" + m[1].slice(4);
}

/* ── 전화번호 ─────────────────────────────────────────────────
   ⚠️⚠️ `031-000-0000` 과 `0310000000` 은 **같은 번호**입니다. 하이픈을
   그대로 비교하면 중복이 줄줄이 쌓입니다 — `/admin` 영업 작업대가
   이미 같은 규칙을 쓰고 있습니다 (CLAUDE.md §8). */
function telKey(v){
  return String(v == null ? "" : v).replace(/[^0-9]/g, "");
}

/* ── 중복 · 스팸 (§6) ─────────────────────────────────────────
   recent : [{ no, tel, offer_id, cat, created_at }] — 최근 신청들
   now    : Date 또는 ISO 문자열

   돌려주는 것
     { dup:true,  no:"SW-…", why:"…" }   같은 요청을 또 누른 것
     { spam:true, why:"…" }              같은 번호로 너무 많이
     { ok:true }                          받아도 됩니다

   ⚠️⚠️ **손님에게 "스팸입니다" 라고 말하지 마세요** (절대 규칙 3 —
   운영자에게 할 말을 손님 화면에 찍지 않습니다). `why` 는 로그용이고,
   손님에게는 `say` 를 냅니다. */
const DUP_MIN   = 10;     /* 같은 요청을 이 안에 또 누르면 중복 */
const SPAM_HOUR = 1;      /* 이 시간 안에 */
const SPAM_MAX  = 5;      /* 이 건수를 넘으면 스팸 */

function intakeDup(now, recent, q){
  const t  = telKey(q && q.tel);
  if(!t) return { ok:true };                 /* 번호가 없으면 다른 데서 막습니다 */
  const at = (now instanceof Date) ? now : new Date(now || Date.now());
  const L  = Array.isArray(recent) ? recent : [];

  /* 같은 번호의 것만 봅니다 */
  const mine = L.filter(r => telKey(r && r.tel) === t);

  /* ⓪ ⚠️⚠️ **멱등 열쇠가 먼저입니다** (2026-10-17 §8 "재시도 요청의
     중복 접수를 방지하기 위한 멱등성 처리"). 화면이 신청서 하나에
     열쇠 하나를 만들어 보내므로, 같은 열쇠가 오면 **끊겨서 다시
     누르신 것**이지 새 신청이 아닙니다 — 시각도 분류도 안 봅니다.
     ⚠️ 20초에 끊고 다시 누르시면 10분 창 안이라 ① 도 잡지만, 분류가
     다르거나(여러 서비스) 10분이 지난 재시도는 ① 이 못 잡습니다. */
  const idem = String((q && q.idem) || "").trim();
  if(idem){
    const same0 = mine.filter(r => String(r.idem || "").trim() === idem);
    if(same0.length)
      return { ok:true, dup:true, no:same0[0].no,
               why:"같은 신청서를 다시 보내셨습니다 (멱등 열쇠가 같습니다)",
               say:"이미 접수되었습니다." };
  }

  /* ① 같은 상품(또는 같은 분류)으로 DUP_MIN 분 안에 또
     ⚠️ **다른 상품이면 중복이 아닙니다.** 사장님이 인테리어와 철거를
     둘 다 신청하는 것은 정상입니다 — 거기서 막으면 장사를 막습니다.

     ⚠️⚠️ **2026-10-25 최종 지시서 §3 으로 정책이 바뀌었습니다.**
     지시서가 이렇게 정했습니다 —
       · "같은 전화번호와 같은 서비스를 다시 신청하더라도 **명시적으로
          새 신청을 시작한 경우에는 허용**한다."
       · "업무상 중복이 의심되는 경우에는 **관리자가 확인할 수 있도록
          하되, 정상 신청을 임의로 차단하지 않는다.**"

     "명시적으로 새 신청" 을 무엇으로 아는가 — **멱등 열쇠**입니다.
     화면이 신청서 하나에 열쇠 하나를 만들고, 보내고 나면 비웁니다
     (`quoteIdemClear()`). 그러니 **열쇠가 왔는데 ⓪ 에서 안 걸렸다**는
     것은 손님이 폼을 새로 시작하셨다는 뜻입니다 → 받습니다.

     ⚠️⚠️ **열쇠가 아예 없으면 그대로 막습니다.** 열쇠가 없으면 끊긴
     재시도와 새 신청을 **구분할 길이 없고**, 안 막으면 20초에 끊긴
     요청을 다시 누르신 분의 접수가 두 건이 됩니다. 옛 화면 · 손으로
     만든 요청이 그 길입니다. */
  const same = mine.filter(function(r){
    const a = (q.offerId || q.offer_id || "") || "", b = r.offer_id || "";
    const c = q.cat || "",                             d = r.cat || "";
    const sameWhat = (a && b) ? a === b : (c && d ? c === d : false);
    if(!sameWhat) return false;
    const mins = (at - new Date(r.created_at)) / 60000;
    return mins >= 0 && mins < DUP_MIN;
  });
  if(same.length){
    if(!idem)
      return { dup:true, no:same[0].no,
        why:"같은 번호 · 같은 서비스로 " + DUP_MIN + "분 안에 또 들어왔습니다 " +
            "(멱등 열쇠가 없어 재시도와 새 신청을 구분할 수 없습니다)",
        say:"방금 같은 요청이 접수되었습니다. 접수번호를 확인해 주세요." };
    /* ⚠️ 받습니다 — 다만 **운영자가 볼 수 있게** 표시합니다.
       `near` 는 손님 화면에 한 글자도 안 나갑니다 (절대 규칙 3) —
       슬랙 글에 한 줄로 붙고, 그 자리가 직원이 보는 자리입니다. */
    return { ok:true, near:true, no:same[0].no,
      why:"같은 번호 · 같은 서비스로 " + DUP_MIN + "분 안에 " +
          (same.length + 1) + "번째입니다 (새 신청으로 받았습니다 — " +
          "멱등 열쇠가 다릅니다)" };
  }

  /* ② 한 시간에 너무 많이
     ⚠️ 이것은 **문턱**입니다. 진짜 속도 제한은 Vercel Firewall 에서
     거세요 — 서버 함수는 요청마다 새로 뜨고 기억을 공유하지 않아서
     코드로는 셀 곳이 없습니다 (api/_send.js 머리말과 같은 이야기). */
  const hour = mine.filter(function(r){
    const mins = (at - new Date(r.created_at)) / 60000;
    return mins >= 0 && mins < SPAM_HOUR * 60;
  });
  if(hour.length >= SPAM_MAX)
    return { spam:true,
      why:"같은 번호로 " + SPAM_HOUR + "시간에 " + hour.length + "건",
      say:"요청이 너무 많습니다. 잠시 뒤에 다시 시도해 주세요." };

  return { ok:true };
}

module.exports = { reqNo, reqNoClean, telKey, intakeDup,
                   A32, DUP_MIN, SPAM_HOUR, SPAM_MAX };
