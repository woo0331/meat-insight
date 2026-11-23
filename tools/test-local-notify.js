/* 로컬 시험 스택(LOCAL_NOTIFY=1)에서 알림 실패 · 재시도를 눌러 봅니다.
   ⚠️ 알림은 이 컨테이너 안 127.0.0.1:8972 시험 수신처로만 갑니다 — 슬랙 · 메일로 안 나갑니다.
   쓰는 법: LOCAL_NOTIFY=1 node tools/local-stack.js  (다른 창)
            NODE_PATH=... node tools/test-local-notify.js
   보는 것: ① 수신처가 실패(500)면 접수는 그대로 되고 알림 작업이 실패로 남는다
            ② 비밀값 없이 재시도 주소를 부르면 401
            ③ 수신처가 살아난 뒤 재시도하면 그 알림이 '보냄' 으로 바뀌고 한 번만 도착한다
            ④ 도착한 알림에 성함 · 연락처 · 메일이 없다 */
const fs = require("fs"), path = require("path"), { execSync } = require("child_process");
const { chromium } = require("playwright");
const OUT = path.join(__dirname, "..", "out", "local-stack");
const ENV = JSON.parse(fs.readFileSync(path.join(OUT, "env.json"), "utf8"));
const APP = ENV.APP, HOOKS = path.join(OUT, "hooks.jsonl"), FAIL = path.join(OUT, "hook-fail");
if(!ENV.CRON_SECRET || !/127\.0\.0\.1:8972/.test(ENV.INTAKE_WEBHOOK_URL || "")){ console.error("⛔ LOCAL_NOTIFY=1 로 띄운 로컬 스택이 아닙니다 — 멈춥니다"); process.exit(2); }
const psql = q => execSync('psql -h 127.0.0.1 -p 55432 -U postgres -At -c "' + q + '"').toString().trim();
let fail = 0; const ok = (c, m, d) => { if(!c) fail++; console.log((c ? "  ✅ " : "  ❌ ") + m + (d ? "  — " + d : "")); };
const hooks = () => fs.readFileSync(HOOKS, "utf8").split("\n").filter(Boolean).map(l => JSON.parse(l));
(async () => {
  fs.writeFileSync(FAIL, "1");
  const n0 = hooks().length;
  const b = await chromium.launch(); const pg = await (await b.newContext({ viewport:{ width:390, height:844 } })).newPage();
  await pg.goto(APP + "/quote?side=close&sv=" + encodeURIComponent("demolish/full"), { waitUntil:"networkidle" });
  const tel = "010-0009-" + String(Date.now()).slice(-4);
  await pg.selectOption("#q-reg", "gyeonggi"); await pg.fill("#q-name", "알림 시험"); await pg.fill("#q-tel", tel);
  await pg.fill("#q-q", "로컬 시험 — 알림 실패 · 재시도"); await pg.check("#q-ag");
  await pg.locator("#view form [type=submit]").first().click(); await pg.waitForTimeout(3500);
  const no = ((await pg.evaluate(() => document.querySelector("#view").innerText)).match(/SW-[A-Z0-9]{4}-[A-Z0-9]{4}/) || [""])[0];
  await b.close();
  ok(/^SW-/.test(no), "① 수신처가 실패해도 접수는 됨 · 접수번호", no);
  const st1 = psql("select j.status from notify_job j join request r on r.id=j.request_id where r.no='" + no + "' and j.kind='ops_new'");
  ok(st1 && st1 !== "sent", "① 그 알림 작업이 '보냄' 이 아님", st1);
  ok(hooks().slice(n0).some(h => h.fail), "① 수신처는 실패(500)로 한 번 받음");

  const r401 = await fetch(APP + "/api/notify-retry", { method:"POST" });
  ok(r401.status === 401, "② 비밀값 없이 재시도 → 401", r401.status);

  fs.unlinkSync(FAIL);
  psql("update notify_job set next_at=now() - interval '1 minute' where request_id=(select id from request where no='" + no + "')");
  const n1 = hooks().length;
  const rr = await fetch(APP + "/api/notify-retry", { method:"POST", headers:{ authorization:"Bearer " + ENV.CRON_SECRET } });
  const rj = await rr.json().catch(() => ({}));
  ok(rr.status === 200 && rj.sent >= 1, "③ 재시도 → 보냄", JSON.stringify(rj));
  const st2 = psql("select j.status from notify_job j join request r on r.id=j.request_id where r.no='" + no + "' and j.kind='ops_new'");
  ok(st2 === "sent", "③ 알림 작업이 '보냄' 으로 바뀜", st2);
  const got = hooks().slice(n1).filter(h => !h.fail && h.body.indexOf(no) >= 0);
  ok(got.length === 1, "③ 그 접수 알림이 한 번만 도착", got.length + "건");
  const rr2 = await fetch(APP + "/api/notify-retry", { method:"POST", headers:{ authorization:"Bearer " + ENV.CRON_SECRET } });
  const rj2 = await rr2.json().catch(() => ({}));
  ok(hooks().filter(h => !h.fail && h.body.indexOf(no) >= 0).length === 1, "③ 다시 불러도 또 보내지 않음", JSON.stringify(rj2));
  const body = got.map(h => h.body).join("\n");
  ok(body.indexOf(tel) < 0 && body.indexOf(tel.replace(/-/g, "")) < 0 && body.indexOf("알림 시험") < 0 && body.indexOf("@") < 0,
     "④ 알림에 성함 · 연락처 · 메일 없음");
  console.log(fail ? "❌ " + fail : "✅ 전부");
  process.exit(fail ? 1 : 0);
})();
