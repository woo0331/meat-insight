/* 로컬 시험 스택(LOCAL_NOTIFY=1)에서 알림 실패 · 재시도를 눌러 봅니다.
   ⚠️ 알림은 이 컨테이너 안 127.0.0.1:8972 시험 수신처로만 갑니다 — 슬랙 · 메일로 안 나갑니다.
   쓰는 법: LOCAL_NOTIFY=1 node tools/local-stack.js  (다른 창)
            NODE_PATH=... node tools/test-local-notify.js
   보는 것: ① 수신처가 실패(500)면 접수는 그대로 되고 알림 작업이 실패로 남는다
            ② 비밀값 없이 재시도 주소를 부르면 401
            ③ 수신처가 살아난 뒤 재시도하면 그 알림이 '보냄' 으로 바뀌고 한 번만 도착한다
            ④ 도착한 알림에 성함 · 연락처 · 메일이 없다
            ⑤ (2026-11-24) "서비스" 줄이 내부 코드가 아니라 한글 이름 — 하나 · 여럿 · 재시도로 보낸 것 모두
               (저장된 request_item.service_id 는 코드 그대로) */
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
  /* ⑤ 서비스 이름 — 위 재시도로 도착한 글(하나 고름) */
  const line = t => ((t.match(/서비스\s+([^\n"]+)/) || [])[1] || "").trim();
  const txt1 = got.map(h => { try{ return JSON.parse(h.body).text || ""; }catch(e){ return h.body; } }).join("\n");
  ok(line(txt1) === "철거 · 전체철거", "⑤ 재시도 알림 · 하나 고름 → 한글 이름", line(txt1));
  ok(txt1.indexOf("demolish/full") < 0, "⑤ 알림에 내부 코드(demolish/full) 없음");
  ok(psql("select string_agg(service_id, ',') from request_item where request_id=(select id from request where no='" + no + "')") === "demolish/full",
     "⑤ 저장된 서비스 코드는 그대로 (demolish/full)");
  /* ⑤ 여럿 고름 — 수신처가 살아 있을 때 바로 도착하는 길 */
  const multi = ["demolish/full", "restore/shop-restore", "waste/biz-waste"];
  const b2 = await chromium.launch(); const pg2 = await (await b2.newContext({ viewport:{ width:390, height:844 } })).newPage();
  await pg2.goto(APP + "/quote?side=close&sv=" + encodeURIComponent(multi.join(",")), { waitUntil:"networkidle" });
  const tel2 = "010-0008-" + String(Date.now()).slice(-4); const n2 = hooks().length;
  await pg2.selectOption("#q-reg", "gyeonggi"); await pg2.fill("#q-name", "복수 시험"); await pg2.fill("#q-tel", tel2);
  await pg2.fill("#q-q", "로컬 시험 — 복수 서비스 알림"); await pg2.check("#q-ag");
  await pg2.locator("#view form [type=submit]").first().click(); await pg2.waitForTimeout(3500);
  const no2 = ((await pg2.evaluate(() => document.querySelector("#view").innerText)).match(/SW-[A-Z0-9]{4}-[A-Z0-9]{4}/) || [""])[0];
  await b2.close();
  const got2 = hooks().slice(n2).filter(h => !h.fail && h.body.indexOf(no2) >= 0);
  const txt2 = got2.map(h => { try{ return JSON.parse(h.body).text || ""; }catch(e){ return h.body; } }).join("\n");
  console.log("     예시 ↓\n" + txt2.split("\n").map(x => "     | " + x).join("\n"));
  ok(got2.length === 1 && line(txt2) === "철거 · 전체철거 / 원상복구 · 상가 원상복구 / 폐기물 · 수거 · 사업장 폐기물",
     "⑤ 여럿 고름 → 한글 이름 셋 · 한 번 도착", line(txt2));
  ok(!/demolish\/|restore\/|waste\//.test(txt2), "⑤ 여럿 고름 알림에도 내부 코드 없음");
  ok(psql("select string_agg(service_id, ',' order by service_id) from request_item where request_id=(select id from request where no='" + no2 + "')") === multi.slice().sort().join(","),
     "⑤ 여럿 고름 · 저장 코드 그대로");
  ok(txt2.indexOf(tel2) < 0 && txt2.indexOf(tel2.replace(/-/g, "")) < 0 && txt2.indexOf("복수 시험") < 0 && txt2.indexOf("@") < 0 && txt2.indexOf("로컬 시험 —") < 0,
     "④ 여럿 고름 알림에도 성함 · 연락처 · 메일 · 내용 없음");
  console.log(fail ? "❌ " + fail : "✅ 전부");
  process.exit(fail ? 1 : 0);
})();
