/* ════════════════════════════════════════════════════════════════════
   check-authenv — /api/session 이 "어느 환경변수가 비었는지" 를
                   값 없이 말해 주는가                    (2026-11-09)

   ⚠️⚠️ **왜 생겼나.** 사장님이 Vercel 에 SUPABASE_URL · SUPABASE_ANON_KEY
   를 넣고 다시 배포하셨는데 /api/session 이 계속 `{"auth":false}` 였고,
   그때 **둘 중 어느 것이 비었는지 알 길이 없었습니다.** 철자가 틀렸나 ·
   Production 에 체크를 안 했나 · 다른 프로젝트인가 — 셋 다 같은 답으로
   보여서 짐작만 오갔습니다. 이제 이름을 말합니다.

   ⚠️⚠️ **값은 한 글자도 나가면 안 됩니다.** 이름은 비밀이 아니지만
   키는 비밀입니다 — 이 검사가 그 선을 지킵니다.

   ⚠️ ship.js 가 돌립니다. `--prove` 를 붙이면 스스로 깨뜨려 봅니다.
   ⚠️ 핸들러를 **직접 불러** 잽니다 (화면 흉내가 아니라 참 코드입니다) —
      ship 묶음 가운데 api/ 를 직접 부르는 첫 자리입니다.
   ════════════════════════════════════════════════════════════════════ */

const path = require("path");

const KEEP = {};
["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_KEY"].forEach(function(k){
  KEEP[k] = process.env[k];
});
function setEnv(o){
  Object.keys(KEEP).forEach(function(k){
    if(o && Object.prototype.hasOwnProperty.call(o, k)) process.env[k] = o[k];
    else delete process.env[k];
  });
}
/* ⚠️ 빌려 쓰고 **그대로 돌려놓습니다** — check-deal 이 global.window 를
   덮어써 빌드를 통째로 깨뜨린 자리와 같은 결입니다. */
function restore(){
  Object.keys(KEEP).forEach(function(k){
    if(KEEP[k] === undefined) delete process.env[k];
    else process.env[k] = KEEP[k];
  });
}

/* ⚠️ require 캐시를 비웁니다 — 환경변수를 바꿔도 담아 둔 모듈은
   옛 값을 들고 있습니다 (그러면 아무것도 안 잡는 검사가 됩니다). */
function handler(){
  ["../api/session.js", "../api/_auth.js"].forEach(function(p){
    delete require.cache[require.resolve(p)];
  });
  return require("../api/session.js");
}
function res(){
  return { code:0, body:null, headers:{},
           setHeader:function(k,v){ this.headers[k] = v; },
           status:function(c){ this.code = c; return this; },
           json:function(o){ this.body = o; return this; } };
}
async function ask(){
  const r = res();
  await handler()(/* req */{ method:"GET", headers:{} }, r);
  return r;
}

const FAKE_URL = "https://checkauthenv.supabase.co";
const FAKE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.checkauthenv.sig";

let pass = 0, fail = 0;
function ok(name, cond, got){
  if(cond){ pass++; console.log("  ✅ " + name); }
  else { fail++; console.log("  ❌ " + name + "  — 받은 것: " + JSON.stringify(got)); }
}

async function run(){
  console.log("\n▶ /api/session 이 빈 환경변수 이름을 말하는가  (check-authenv)");

  /* ① 둘 다 비었을 때 */
  setEnv({});
  let r = await ask();
  ok("둘 다 비면 auth:false", r.code === 200 && r.body && r.body.auth === false, r.body);
  ok("둘 다 비면 이름 둘을 집는다",
     Array.isArray(r.body.need) && r.body.need.length === 2 &&
     r.body.need.indexOf("SUPABASE_URL") >= 0 &&
     r.body.need.indexOf("SUPABASE_ANON_KEY") >= 0, r.body.need);

  /* ② 한쪽만 비었을 때 — **그 하나만** 집어야 철자 틀린 자리를 가리킵니다 */
  setEnv({ SUPABASE_URL:FAKE_URL });
  r = await ask();
  ok("URL 만 넣으면 ANON_KEY 하나만 집는다",
     r.body.auth === false && Array.isArray(r.body.need) &&
     r.body.need.length === 1 && r.body.need[0] === "SUPABASE_ANON_KEY", r.body.need);

  setEnv({ SUPABASE_ANON_KEY:FAKE_KEY });
  r = await ask();
  ok("키만 넣으면 URL 하나만 집는다",
     r.body.auth === false && Array.isArray(r.body.need) &&
     r.body.need.length === 1 && r.body.need[0] === "SUPABASE_URL", r.body.need);

  /* ③ 공백만 있는 값 — Vercel 에 빈 칸을 저장하고 "넣었다" 고 읽는 자리 */
  setEnv({ SUPABASE_URL:FAKE_URL, SUPABASE_ANON_KEY:"   " });
  r = await ask();
  ok("공백만 있는 값도 '비었다' 로 집는다",
     r.body.auth === false &&
     (r.body.need || []).indexOf("SUPABASE_ANON_KEY") >= 0, r.body.need);

  /* ④ ⚠️⚠️ 값이 한 글자도 안 나가는가 — 이름은 괜찮고 키는 안 됩니다 */
  setEnv({ SUPABASE_URL:FAKE_URL });
  r = await ask();
  let s = JSON.stringify(r.body);
  ok("값이 한 글자도 안 담긴다",
     s.indexOf(FAKE_URL) < 0 && s.indexOf(FAKE_KEY) < 0 &&
     s.indexOf("supabase.co") < 0, s);

  /* ⑤ 둘 다 채우면 auth:true — 너무 넓게 막는 것도 고장입니다 */
  setEnv({ SUPABASE_URL:FAKE_URL, SUPABASE_ANON_KEY:FAKE_KEY });
  r = await ask();
  ok("둘 다 채우면 auth:true 이고 need 가 없다",
     r.body.auth === true && r.body.need === undefined, r.body);

  /* ⑥ 잰 것이 0개면 실패입니다 (아무것도 안 재고 초록이 되지 않게) */
  ok("잰 것이 0개가 아니다", pass + fail >= 7, pass + fail);

  restore();
}

/* ── 되돌려 보기 — 일부러 깨뜨려 실제로 잡히는지 ─────────────────── */
async function prove(){
  console.log("\n▶ 되돌려 보기 (--prove)");
  const fs = require("fs");
  const p = path.join(__dirname, "..", "api", "session.js");
  const keep = fs.readFileSync(p, "utf8");
  let caught = 0;

  /* 미끼 ① — need 를 통째로 뺍니다 (옛 꼴로 되돌립니다) */
  fs.writeFileSync(p, keep.replace("need: authMissing()", "need: undefined"), "utf8");
  let r = await ask().catch(function(){ return { body:{} }; });
  if(!Array.isArray(r.body && r.body.need)){ caught++; console.log("  ✅ need 를 빼면 잡습니다"); }
  else console.log("  ❌ need 를 빼도 안 잡습니다");

  /* 미끼 ② — 값을 같이 담아 봅니다 (키가 새는 꼴) */
  fs.writeFileSync(p, keep.replace("need: authMissing()",
    "need: authMissing(), url: process.env.SUPABASE_URL"), "utf8");
  setEnv({ SUPABASE_URL:FAKE_URL });
  r = await ask().catch(function(){ return { body:{} }; });
  if(JSON.stringify(r.body).indexOf(FAKE_URL) >= 0){
    caught++; console.log("  ✅ 값이 섞여 나가면 잡습니다");
  } else console.log("  ❌ 값이 섞여 나가도 안 잡습니다");

  fs.writeFileSync(p, keep, "utf8");
  restore();
  console.log("  (되돌려 놓았습니다 — 미끼 2개 중 " + caught + "개를 잡습니다)");
  return caught === 2;
}

(async function(){
  await run();
  let proved = true;
  if(process.argv.indexOf("--prove") >= 0) proved = await prove();
  console.log("\n   " + (pass + fail) + "건 중 " + pass + "건 통과 · " + fail + "건 실패");
  process.exit(fail === 0 && proved ? 0 : 1);
})();
