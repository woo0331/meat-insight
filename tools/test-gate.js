/* T01 — 접수 중단: 화면을 거치지 않고 API 를 직접 불러도 저장 · 전달이
   한 번도 일어나지 않는가 (api/_gate.js).

   ⚠️ 바깥으로 나가는 요청은 global.fetch 를 가로채 셉니다. 닫힌 상태에서
   한 번이라도 나가면 실패입니다 — "503 이 나왔다" 만 보면 DB 에 이미
   쓴 뒤에 503 을 내도 통과하기 때문입니다.
   ⚠️ 운영 주소 · 키를 쓰지 않습니다. 가짜 값만 씁니다. */

const path = require("path");
const ROOT = path.resolve(__dirname, "..");
let pass = 0, fail = 0;
function ok(cond, name, info){
  if (cond) { pass++; console.log("  ✅ " + name); }
  else { fail++; console.log("  ❌ " + name + (info ? "  " + JSON.stringify(info) : "")); }
}

const ENV_KEYS = ["STOREWAY_INTAKE_OPEN", "SUPABASE_URL", "SUPABASE_SERVICE_KEY",
  "INTAKE_WEBHOOK_URL", "RESEND_API_KEY", "INTAKE_EMAIL_TO", "SUPABASE_ANON_KEY"];
const SAVED = {}; ENV_KEYS.forEach(function(k){ SAVED[k] = process.env[k]; });

function fresh(env){
  ENV_KEYS.forEach(function(k){ delete process.env[k]; });
  Object.keys(env).forEach(function(k){ process.env[k] = env[k]; });
  /* require 캐시를 비웁니다 — 안 비우면 담아 둔 모듈이 옛 환경을 들고 있습니다 */
  Object.keys(require.cache).forEach(function(k){
    if (k.indexOf(path.join(ROOT, "api") + path.sep) === 0) delete require.cache[k];
  });
  return require(path.join(ROOT, "api", "quote.js"));
}

const calls = [];
const realFetch = global.fetch;
global.fetch = async function(url, opt){
  calls.push({ url: String(url), method: (opt && opt.method) || "GET" });
  return { ok: true, status: 201, headers: { get: function(){ return null; } },
    json: async function(){ return [{ id: "00000000-0000-0000-0000-000000000001", no: "SW-TEST-0001" }]; },
    text: async function(){ return "[]"; } };
};

function req(body){
  return { method: "POST", body: body,
    headers: { origin: "https://storeway.co.kr", host: "storeway.co.kr",
               "content-type": "application/json" } };
}
function res(){
  const r = { code: 0, body: null, headers: {} };
  r.status = function(c){ r.code = c; return r; };
  r.json = function(b){ r.body = b; return r; };
  r.setHeader = function(k, v){ r.headers[k.toLowerCase()] = v; };
  return r;
}

const QUOTE = { kind: "quote", name: "합성 고객", tel: "010-0000-0000", q: "합성 요청 — 검사용",
  agree: true, idem: "t01-quote-1" };
const SELL  = Object.assign({}, QUOTE, { form: "sell", cat: "transfer", idem: "t01-sell-1" });
const JOIN  = { kind: "partner", name: "합성 담당", tel: "010-0000-0001", company: "합성 업체",
  services: ["interior"], agree: true };
const FAKE_DB = { SUPABASE_URL: "https://example.invalid", SUPABASE_SERVICE_KEY: "fake-service-key" };
const FAKE_SEND = { INTAKE_WEBHOOK_URL: "https://example.invalid/hook" };

(async function(){
  console.log("▶ T01 접수 중단 — 서버가 막는가");

  const cases = [
    ["환경변수가 하나도 없음", {}],
    ["DB 는 있는데 STOREWAY_INTAKE_OPEN 이 없음", Object.assign({}, FAKE_DB, FAKE_SEND)],
    ["다른 종류만 열려 있음 (join)", Object.assign({ STOREWAY_INTAKE_OPEN: "join" }, FAKE_DB, FAKE_SEND)],
    ["열려 있지만 DB 가 없음", Object.assign({ STOREWAY_INTAKE_OPEN: "quote,sell,join" }, FAKE_SEND)]
  ];
  for (const [name, env] of cases) {
    for (const [what, body] of [["견적", QUOTE], ["매물", SELL]]) {
      const h = fresh(env); calls.length = 0;
      const r = res(); await h(req(body), r);
      ok(r.code === 503 && r.body && r.body.closed === true, name + " · " + what + " → 503 closed", { code: r.code, body: r.body });
      ok(calls.length === 0, name + " · " + what + " → 바깥 요청 0건", calls);
      ok(!(r.body && r.body.no), name + " · " + what + " → 접수번호를 내주지 않음");
    }
  }

  /* 닫힌 말에 운영자용 낱말이 섞이지 않는가 (절대 규칙 3) */
  {
    const h = fresh({}); const r = res(); await h(req(QUOTE), r);
    const t = JSON.stringify(r.body);
    ok(!/STOREWAY|SUPABASE|환경변수|설정/.test(t), "손님 말에 설정 이름이 없음", t);
    ok(/현재 접수를 받지 않습니다/.test(t), "손님 말이 지시서 문구와 같음", t);
    ok(r.headers["cache-control"] === "no-store", "닫힌 응답을 캐시하지 않음");
  }

  /* 종류마다 따로 열리는가 — join 만 열면 견적은 닫힘 */
  {
    const env = Object.assign({ STOREWAY_INTAKE_OPEN: "join" }, FAKE_DB, FAKE_SEND);
    const h = fresh(env); calls.length = 0;
    const r = res(); await h(req(JOIN), r);
    ok(!(r.body && r.body.closed), "join 만 열면 입점 신청은 게이트를 지남 (닫힘 표시 없음)", { code: r.code, body: r.body });
  }

  /* 열면 실제로 게이트를 지나 저장 길로 들어가는가 (너무 넓게 막는 것도 고장) */
  {
    const env = Object.assign({ STOREWAY_INTAKE_OPEN: "quote" }, FAKE_DB, FAKE_SEND);
    const h = fresh(env); calls.length = 0;
    const r = res(); await h(req(QUOTE), r);
    ok(r.code !== 503 || !(r.body && r.body.closed), "quote 를 열면 게이트에서 막지 않음", { code: r.code, body: r.body });
    ok(calls.some(function(c){ return c.url.indexOf("https://example.invalid/rest/v1/") === 0; }),
      "열린 뒤에는 DB 로 요청이 감", calls.map(function(c){ return c.method + " " + c.url; }));
  }

  /* 우리 화면 밖에서 온 요청은 게이트 전에 403 (그대로 유지) */
  {
    const h = fresh({}); const r = res();
    await h({ method: "POST", body: QUOTE, headers: { origin: "https://evil.example" } }, r);
    ok(r.code === 403, "다른 출처는 403");
  }

  /* 2026-11-18 — 헤더 CTA 가 읽는 값(/api/session 의 intake.quote)이
     접수 API 와 **같은 게이트**를 따르는가. 견적만 보고, 다른 종류와 섞지 않고,
     까닭(why)은 밖으로 안 내보내는가. 바깥 요청은 0건이어야 합니다. */
  console.log("\n▶ 헤더 CTA 상태 — /api/session 의 intake.quote");
  for (const [nm, env, want] of [
    ["아무것도 없음", {}, false],
    ["sell · join 만 열림 (견적은 닫힘)", Object.assign({ STOREWAY_INTAKE_OPEN: "sell,join" }, FAKE_DB), false],
    ["quote 는 적혔지만 DB 없음", { STOREWAY_INTAKE_OPEN: "quote" }, false],
    ["quote + DB", Object.assign({ STOREWAY_INTAKE_OPEN: "quote" }, FAKE_DB), true]
  ]){
    fresh(env);
    const sh = require(path.join(ROOT, "api", "session.js"));
    calls.length = 0;
    const r = res(); await sh({ method: "GET", headers: {} }, r);
    ok(r.code === 200 && r.body && r.body.intake && r.body.intake.quote === want,
      nm + " → intake.quote " + want, r.body);
    ok(calls.length === 0, nm + " → 바깥 요청 0건", calls);
    ok(!JSON.stringify(r.body).match(/STOREWAY_INTAKE_OPEN|SUPABASE|why/),
      nm + " → 설정 이름 · 까닭을 내보내지 않음", r.body);
    ok(Object.keys(r.body.intake).join() === "quote", nm + " → 견적 하나만 담음", r.body.intake);
  }

  global.fetch = realFetch;
  ENV_KEYS.forEach(function(k){ if (SAVED[k] === undefined) delete process.env[k]; else process.env[k] = SAVED[k]; });
  console.log("\n" + (pass + fail) + "건 중 " + pass + "건 통과 · " + fail + "건 실패");
  process.exit(fail ? 1 : 0);
})();
