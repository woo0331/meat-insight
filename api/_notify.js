/* 알림 작업 — 저장이 끝난 뒤 따로 보냅니다 (W02 ⑤ · 지시서 9장)

   ⚠️⚠️ 운영자 알림에 성함 · 연락처 · 자유서술 · 이메일을 싣지 않습니다.
   알림은 슬랙 · 메일 같은 바깥 서비스를 지나가고(수탁자), 채널은 보는 사람이
   넓습니다. 접수번호 · 양식 · 서비스 이름 · 지역만 보내고 원문은 /admin 에서
   권한 있는 사람이 봅니다.
   ⚠️ 결과는 mark_notify() 로 DB 에 적습니다. 실패해도 접수는 그대로이고,
   due_notify() 가 다시 보낼 것을 꺼내 줍니다 (api/notify-retry.js).
   ⚠️ 오류 글은 짧은 코드만 남깁니다 — 바깥 응답 본문에는 무엇이 섞여 있을지
   모릅니다. */

const { deliver, customerAck } = require("./_send.js");
const { dbCallService } = require("./_db.js");

const FORM_NAME = { quote: "견적 요청", sell: "매물 등록", join: "업체 입점" };

/* 바깥 오류를 짧은 코드로 — 사람 정보 · 주소 · 키가 섞이지 않게 */
function errCode(why){
  const s = String(why || "");
  if (s === "nowhere") return "nowhere";
  if (s === "off") return "off";
  const m = s.match(/(webhook|resend)[^0-9]*(\d{3})/);
  if (m) return m[1] + "_" + m[2];
  if (/시간 초과|timeout|abort/i.test(s)) return "timeout";
  return "error";
}

/* info: { form, no, services:[이름], region, near } — 개인정보 없음 */
function opsMessage(info){
  const name = FORM_NAME[info.form] || "접수";
  const subject = "[" + name + "] " + info.no;
  const L = ["접수번호  " + info.no, "종류      " + name];
  if (info.services && info.services.length) L.push("서비스    " + info.services.slice(0, 8).join(" · "));
  if (info.region) L.push("지역      " + info.region);
  if (info.near) L.push("⚠️ 확인 필요  같은 연락처의 최근 접수가 있습니다");
  L.push("");
  L.push("성함 · 연락처 · 내용은 /admin 접수함에서 확인하세요.");
  return { subject: subject, text: L.join("\n"),
           payload: { no: info.no, form: info.form } };
}

/* 작업 하나를 보내고 결과를 적습니다. 실패를 던지지 않습니다.
   돌려주는 것: { kind, ok, state } */
async function runJob(job, info){
  let ok = false, why = "";
  if (job.kind === "customer_ack") {
    if (!info.email) { why = "no_email"; }
    else {
      const r = await customerAck(info.email, info.no);
      ok = !!r.ok; why = r.ok ? "" : r.why;
    }
  } else {
    const m = opsMessage(info);
    const r = await deliver(info.form === "join" ? "partner" : "quote", m.payload, m.subject, m.text);
    ok = !!r.ok; why = r.ok ? "" : r.why;
  }
  const code = ok ? null : errCode(why);
  const mk = await dbCallService("mark_notify", { p_job: job.id, p_ok: ok, p_err: code });
  if (!mk.ok) console.error("[site] 알림 결과를 적지 못했습니다 — " + job.id);
  if (!ok) console.warn("[site] 알림을 보내지 못했습니다 (" + job.kind + " · " + info.no + ") — " + code);
  return { kind: job.kind, ok: ok, state: mk.ok ? mk.data : "unknown" };
}

module.exports = { runJob, opsMessage, errCode, FORM_NAME };
