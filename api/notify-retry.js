/* 실패한 알림을 다시 보냅니다 (W02 ⑤)

   ⚠️ Vercel Cron 이 `Authorization: Bearer <CRON_SECRET>` 을 달고 부를 때만
   돕니다. 비밀값이 없거나 다르면 아무것도 안 하고 401 입니다.
   ⚠️ 접수 게이트(STOREWAY_INTAKE_OPEN)와 상관없이 돕니다 — 이미 저장된
   접수의 알림이라 새로 받는 것이 아닙니다.
   ⚠️ 응답에 개인정보를 싣지 않습니다 — 몇 건을 보냈는지 셈만 돌려줍니다.
   ⚠️ 운영에서 돌리려면 vercel.json 의 crons 와 CRON_SECRET 환경변수가
   필요합니다 — 대표 승인 전에는 넣지 않았습니다. */

const crypto = require("crypto");
const { dbReady, dbCallService, dbSelect } = require("./_db.js");
const { runJob } = require("./_notify.js");

function same(a, b){
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

module.exports = async function handler(req, res){
  res.setHeader("Cache-Control", "no-store");
  const secret = String(process.env.CRON_SECRET || "");
  const got = String((req.headers && req.headers.authorization) || "");
  if (!secret || !same(got, "Bearer " + secret)) return res.status(401).json({ error: "unauthorized" });
  if (!dbReady()) return res.status(503).json({ error: "db_off" });

  const due = await dbCallService("due_notify", { p_limit: 20 });
  if (!due.ok) return res.status(503).json({ error: "db_error" });
  const jobs = Array.isArray(due.data) ? due.data : [];
  const out = { picked: jobs.length, sent: 0, failed: 0 };

  for (const job of jobs) {
    let info = null;
    if (job.request_id) {
      const r = await dbSelect("request", "?select=no,form,region,email,request_item(service_id)&id=eq." +
        encodeURIComponent(job.request_id) + "&limit=1");
      const row = r.ok && r.rows[0];
      if (row) info = { form: row.form || "quote", no: row.no, region: row.region || "",
        email: row.email || "", services: (row.request_item || []).map(function(x){ return x.service_id; }) };
    } else if (job.apply_id) {
      const r = await dbSelect("provider_apply", "?select=no,region,services&id=eq." +
        encodeURIComponent(job.apply_id) + "&limit=1");
      const row = r.ok && r.rows[0];
      if (row) info = { form: "join", no: row.no, region: row.region || "", services: row.services || [] };
    }
    if (!info) { out.failed++; continue; }
    const r = await runJob(job, info);
    if (r.ok) out.sent++; else out.failed++;
  }
  return res.status(200).json(out);
};
