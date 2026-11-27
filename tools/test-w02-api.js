/* W02 — api/quote.js 와 api/notify-retry.js 를 가짜 DB · 가짜 웹훅으로 눌러 봅니다.
   T03 중복 · T04 DB 장애 · T05 알림 장애 · T06 입력 검증 · 개인정보가 알림에 안 실리는가 ·
   동의 고지문이 화면과 같은가. 운영 주소 · 키를 쓰지 않습니다. */
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..");
let pass = 0, bad = 0;
function ok(c, n, got){ if(c){ pass++; console.log("  ✅ " + n); } else { bad++; console.log("  ❌ " + n + (got !== undefined ? "  →  " + JSON.stringify(got).slice(0, 300) : "")); } }

const ENV = { STOREWAY_INTAKE_OPEN: "quote,sell,join", SUPABASE_URL: "https://db.invalid",
  SUPABASE_SERVICE_KEY: "svc-key-never-leak", INTAKE_WEBHOOK_URL: "https://hook.invalid/x" };
function load(file, extra){
  ["STOREWAY_INTAKE_OPEN","SUPABASE_URL","SUPABASE_SERVICE_KEY","INTAKE_WEBHOOK_URL","RESEND_API_KEY",
   "CUSTOMER_EMAIL_FROM","CRON_SECRET","SUPABASE_ANON_KEY","INTAKE_EMAIL_TO"].forEach(k => delete process.env[k]);
  Object.assign(process.env, ENV, extra || {});
  Object.keys(require.cache).forEach(k => { if(k.indexOf(path.join(ROOT, "api") + path.sep) === 0) delete require.cache[k]; });
  return require(path.join(ROOT, "api", file));
}
/* 가짜 바깥: rpc 이름마다 정한 답 · 웹훅 본문 모으기 */
function world(o){
  o = o || {};
  const w = { rpc: [], hooks: [], gets: [] };
  global.fetch = async function(url, init){
    const u = String(url), body = init && init.body ? JSON.parse(init.body) : null;
    const resp = (status, data) => ({ ok: status < 400, status, headers: { get(){ return ""; } },
      text: async () => data === undefined ? "" : JSON.stringify(data), json: async () => data });
    if(u.indexOf("https://db.invalid/rest/v1/rpc/") === 0){
      const fn = u.split("/rpc/")[1]; w.rpc.push({ fn, body });
      if(fn === "submit_intake" || fn === "submit_apply"){
        if(o.dbDown) throw new Error("ECONNRESET");
        if(o.dbErr) return resp(500, { message: "boom" });
        if(o.dup) return resp(200, { no: "SW-FIRST-0001", dup: true });
        return resp(200, { no: body.p.no, dup: false, request_id: "r1",
          jobs: [{ id: "j-ops", kind: fn === "submit_apply" ? "ops_new_apply" : "ops_new" }]
            .concat(body.p.email && fn === "submit_intake" ? [{ id: "j-ack", kind: "customer_ack" }] : []) });
      }
      if(fn === "mark_notify") return resp(200, body.p_ok ? "sent" : "failed");
      if(fn === "due_notify") return resp(200, o.due || []);
      return resp(404, { message: "no fn" });
    }
    if(u.indexOf("https://db.invalid/rest/v1/") === 0){ w.gets.push(u); return resp(200, o.rows || []); }
    if(u.indexOf("https://hook.invalid/") === 0){ w.hooks.push(body); return o.hookDown ? resp(500, {}) : resp(200, {}); }
    if(/api\.resend\.com/.test(u)){ w.hooks.push({ mail: body }); return resp(200, {}); }
    return resp(404, {});
  };
  return w;
}
const req = (b, h) => ({ method: "POST", body: b, headers: Object.assign({ origin: "https://storeway.co.kr", host: "storeway.co.kr" }, h || {}) });
function res(){ const r = { code: 0, body: null, h: {} }; r.status = c => (r.code = c, r); r.json = b => (r.body = b, r); r.setHeader = (k, v) => { r.h[k.toLowerCase()] = v; }; return r; }

const Q = { kind: "quote", name: "합성고객김", tel: "010-9999-1111", email: "syn@test.invalid", region: "서울",
  q: "비밀스러운 내용 ABC123", items: [{ id: "interior" }], agree: true, idem: "idem-a" };

(async function(){
  console.log("▶ T02 · 정상 — 저장 한 번 · 알림은 그 뒤");
  { const h = load("quote.js"); const w = world(); const r = res(); await h(req(Q), r);
    ok(r.code === 200 && /^SW-/.test(r.body.no), "200 과 접수번호", r.body);
    const fns = w.rpc.map(x => x.fn);
    ok(fns[0] === "submit_intake", "저장은 submit_intake 한 번", fns);
    ok(fns.filter(f => f === "submit_intake").length === 1, "submit_intake 는 딱 한 번");
    ok(fns.indexOf("mark_notify") > 0, "알림 결과를 mark_notify 로 적음", fns);
    const p = w.rpc[0].body.p;
    ok(p.consent && p.consent.notice_ver && p.consent.keep, "동의 고지문(버전 · 보유기간)을 같이 보냄", p.consent);
    ok(p.form === "quote" && Array.isArray(p.items) && p.items[0].id === "interior", "양식 · 서비스 항목을 보냄");
    const hook = JSON.stringify(w.hooks);
    ok(hook.indexOf("합성고객김") < 0 && hook.indexOf("9999") < 0 && hook.indexOf("비밀스러운") < 0 && hook.indexOf("syn@test") < 0,
       "운영자 알림에 성함 · 연락처 · 내용 · 이메일이 없음 (지시서 9장)", hook);
    ok(hook.indexOf(r.body.no) >= 0, "운영자 알림에 접수번호는 있음"); }

  console.log("\n▶ T04 DB 장애 — 성공 화면을 내지 않음");
  for (const [n, o] of [["DB 연결 끊김", { dbDown: true }], ["DB 500", { dbErr: true }]]) {
    const h = load("quote.js"); const w = world(o); const r = res(); await h(req(Q), r);
    ok(r.code === 503 && !r.body.no && !r.body.ok, n + " → 503 · 번호 없음", r.body);
    ok(w.hooks.length === 0, n + " → 알림도 안 보냄 (저장 안 된 접수를 알리지 않음)", w.hooks);
    ok(/다시 보내/.test(r.body.error || ""), n + " → 다시 보내라고 안내 (재시도 가능)", r.body); }

  console.log("\n▶ T05 알림 장애 — 접수는 유지 · 실패를 적음");
  { const h = load("quote.js"); const w = world({ hookDown: true }); const r = res(); await h(req(Q), r);
    ok(r.code === 200 && r.body.no, "웹훅이 500 이어도 접수는 200", r.body);
    const mk = w.rpc.filter(x => x.fn === "mark_notify" && x.body.p_job === "j-ops")[0];
    ok(mk && mk.body.p_ok === false && mk.body.p_err === "webhook_500", "실패를 짧은 코드로 적음", mk && mk.body); }

  console.log("\n▶ T03 중복 — DB 가 먼저 받은 번호");
  { const h = load("quote.js"); const w = world({ dup: true }); const r = res(); await h(req(Q), r);
    ok(r.code === 200 && r.body.no === "SW-FIRST-0001" && r.body.dup === true, "같은 키 → 먼저 받은 번호", r.body);
    ok(w.hooks.length === 0, "중복이면 알림을 또 보내지 않음"); }

  console.log("\n▶ T06 입력 검증");
  for (const [n, b] of [["동의 없음", Object.assign({}, Q, { agree: false })],
                        ["연락처 없음", Object.assign({}, Q, { tel: "" })],
                        ["없는 서비스 id", Object.assign({}, Q, { items: [{ id: "no-such-svc" }] })],
                        ["받지 않는 종류(sos)", Object.assign({}, Q, { kind: "sos" })],
                        ["서비스도 내용도 없음", Object.assign({}, Q, { q: "", items: undefined, serviceName: "" })],
                        ["지역 없음", Object.assign({}, Q, { region: "" })]]) {
    const h = load("quote.js"); const w = world(); const r = res(); await h(req(b), r);
    ok(r.code === 400 && w.rpc.length === 0, n + " → 400 · DB 를 부르지 않음", { code: r.code, body: r.body, rpc: w.rpc.length }); }

  console.log("\n▶ T10 매물 · 입점");
  { const h = load("quote.js"); const w = world(); const r = res();
    await h(req(Object.assign({}, Q, { form: "sell", cat: "transfer", items: undefined, idem: "s1" })), r);
    ok(w.rpc[0] && w.rpc[0].body.p.form === "sell", "매물은 form=sell 로 저장 (DB 가 review 로 둠)", w.rpc[0] && w.rpc[0].body.p.form); }
  { const h = load("quote.js"); const w = world(); const r = res();
    await h(req({ kind: "partner", company: "합성업체", name: "담당", tel: "010-1", services: ["인테리어"], agree: true, state: "approved" }), r);
    ok(w.rpc[0] && w.rpc[0].fn === "submit_apply" && w.rpc[0].body.p.state === undefined, "입점은 submit_apply · 화면이 보낸 state 를 넘기지 않음", w.rpc[0]); }

  console.log("\n▶ 동의 고지문이 화면 동의 상자와 같은 글자");
  { const { NOTICE } = load("_consent.js");
    const src = { quote: "js/pages/quote.js", sell: "js/pages/market.js", join: "js/pages/providers.js" };
    for (const k of Object.keys(src)) {
      const t = fs.readFileSync(path.join(ROOT, src[k]), "utf8");
      ok(t.indexOf(NOTICE[k].items) >= 0 && t.indexOf(NOTICE[k].purpose) >= 0 && t.indexOf(NOTICE[k].keep) >= 0,
         k + " — 항목 · 목적 · 보유기간이 화면과 같음", NOTICE[k]); } }

  console.log("\n▶ 고객 접수 안내 메일 (옛 test-api 에서 옮김)");
  { const h = load("quote.js", { RESEND_API_KEY: "re_x", CUSTOMER_EMAIL_FROM: "hi@storeway.co.kr" });
    const w = world(); const r = res(); await h(req(Object.assign({}, Q, { idem: "m1" })), r);
    const m = (w.hooks.filter(x => x.mail)[0] || {}).mail;
    ok(!!m && m.to.length === 1 && m.to[0] === "syn@test.invalid", "손님 한 사람에게만 감", m);
    const t = (m && m.text) || "";
    ok(t.indexOf(r.body.no) >= 0, "안내에 발급된 접수번호가 있음");
    ok(t.indexOf("광고가 아닙니다") >= 0, "광고가 아니라고 적음");
    ok(!/업체에 전달했습니다|업체에 전달되었습니다/.test(t), "업체에 넘겼다고 하지 않음");
    ok(!/시간 안에|당일 연락|24시간|보장/.test(t), "회신 시점을 약속하지 않음"); }
  { const h = load("quote.js", { RESEND_API_KEY: "re_x", CUSTOMER_EMAIL_FROM: "hi@storeway.co.kr" });
    const w = world(); const r = res();
    await h(req(Object.assign({}, Q, { idem: "m2", email: "a@test.invalid,b@test.invalid" })), r);
    const m = (w.hooks.filter(x => x.mail)[0] || {}).mail;
    ok(!m || m.to.length === 1, "쉼표로 여러 주소에 쪼개 보내지 않음", m && m.to); }

  console.log("\n▶ 재시도 주소");
  { const h = load("notify-retry.js", { CRON_SECRET: "s3cret" }); const w = world(); const r = res();
    await h({ headers: {} }, r); ok(r.code === 401 && w.rpc.length === 0, "비밀값 없으면 401 · DB 안 부름"); }
  { const h = load("notify-retry.js"); world(); const r = res();
    await h({ headers: { authorization: "Bearer " } }, r); ok(r.code === 401, "CRON_SECRET 이 비어 있으면 아무도 못 부름"); }
  { const h = load("notify-retry.js", { CRON_SECRET: "s3cret" });
    const w = world({ due: [{ id: "j9", kind: "ops_new", request_id: "r9" }], rows: [{ no: "SW-R9", form: "quote", region: "부산", request_item: [{ service_id: "interior" }] }] });
    const r = res(); await h({ headers: { authorization: "Bearer s3cret" } }, r);
    ok(r.code === 200 && r.body.picked === 1 && r.body.sent === 1, "밀린 알림을 꺼내 다시 보냄", r.body);
    ok(JSON.stringify(r.body).indexOf("SW-R9") < 0, "응답에 접수 내용을 싣지 않음 (셈만)");
    ok(w.gets.every(u => !/select=[^&]*(name|tel)/.test(u)), "재시도는 성함 · 연락처를 읽지 않음", w.gets); }

  console.log("\n" + (pass + bad) + "건 중 " + pass + "건 통과 · " + bad + "건 실패");
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log("❌ 멈춤 — " + e.stack); process.exit(1); });
