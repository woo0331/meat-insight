#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   로그인 · 세션 · 권한 서버층 (지시서 §7 · §8 · §10 · §11 · §13)

     node tools/test-auth.js

   ⚠️⚠️ **DB 없이 전부 확인합니다.** fetch 를 가로채서 "무엇을 어느
   헤더로 보냈는가" 를 봅니다 — 진짜 Supabase 가 있으면 오히려 안 보이는
   것들입니다 (키를 바꿔 쓴 것 · 역할을 요청에서 읽은 것).

   여기서 보는 것 중 제일 중요한 셋 —
     ① **역할을 요청에서 읽지 않는가** (읽으면 누구나 관리자가 됩니다)
     ② **service key 로 읽지 않는가** (읽으면 RLS 가 통째로 꺼집니다)
     ③ **키 · 토큰이 답에 섞이지 않는가**
   ════════════════════════════════════════════════════════════════════ */

const path = require("path");
const ROOT = path.join(__dirname, "..");

let bad = 0, ran = 0;
function ok(name, cond, got){
  ran++;
  if(cond) console.log("  ✅ " + name);
  else { bad++; console.log("  ❌ " + name +
    (got !== undefined ? "  →  " + String(JSON.stringify(got)).slice(0, 300) : "")); }
}

/* ── 가짜 환경 ───────────────────────────────────────────── */
const URL_ = "https://proj.supabase.co";
const ANON = "ANONKEY-aaaa";
const SVC  = "SERVICEKEY-zzzz";
const TOK  = "hdr.body.sig";

function setEnv(o){
  ["SUPABASE_URL","SUPABASE_ANON_KEY","SUPABASE_SERVICE_KEY"].forEach(function(k){
    if(o && Object.prototype.hasOwnProperty.call(o, k)) process.env[k] = o[k];
    else delete process.env[k];
  });
}
function envAll(){ setEnv({ SUPABASE_URL:URL_, SUPABASE_ANON_KEY:ANON, SUPABASE_SERVICE_KEY:SVC }); }

/* ── 가짜 fetch ──────────────────────────────────────────── */
function body(status, obj){
  return { ok:status >= 200 && status < 300, status:status,
           text:async function(){ return obj === undefined ? "" : JSON.stringify(obj); } };
}
let calls = [];
function mock(routes){
  calls = [];
  global.fetch = async function(url, opt){
    const u = String(url);
    calls.push({ url:u, opt:opt || {}, h:(opt && opt.headers) || {} });
    for(const r of routes) if(r[0].test(u)) return r[1](opt);
    return body(404, { message:"no route" });
  };
}
function aborter(){
  const e = new Error("aborted"); e.name = "AbortError"; return e;
}
/* 어느 호출에도 service key 가 섞이지 않았는가 */
function noSvcAnywhere(){
  return calls.every(function(c){
    const all = JSON.stringify(c.h) + String(c.opt.body || "") + c.url;
    return all.indexOf(SVC) < 0;
  });
}

/* ── 가짜 req · res ──────────────────────────────────────── */
function req(o){
  return Object.assign({ method:"GET", headers:{}, body:undefined }, o || {});
}
function res(){
  const r = { code:0, body:null, headers:{} };
  r.setHeader = function(k, v){ r.headers[String(k).toLowerCase()] = v; return r; };
  r.status = function(c){ r.code = c; return r; };
  r.json = function(b){ r.body = b; return r; };
  return r;
}
function leaks(r){
  const s = JSON.stringify(r.body || {});
  return s.indexOf(SVC) >= 0 || s.indexOf(ANON) >= 0 || s.indexOf(TOK) >= 0;
}

/* 운영자용 글은 console.warn 으로 갑니다 — 손님 화면에 안 찍힙니다.
   (절대 규칙 3) 검사 중에는 조용히 모아 둡니다. */
const warned = [];
const realWarn = console.warn, realErr = console.error;
console.warn = function(){ warned.push(Array.from(arguments).join(" ")); };
console.error = function(){ warned.push(Array.from(arguments).join(" ")); };

const A = require(path.join(ROOT, "api", "_auth.js"));
const D = require(path.join(ROOT, "api", "_db.js"));
const Hsession = require(path.join(ROOT, "api", "session.js"));
const Hdeal    = require(path.join(ROOT, "api", "deal.js"));
const Hme      = require(path.join(ROOT, "api", "me.js"));

const USER  = [/\/auth\/v1\/user/,  function(){ return body(200, { id:"u-1", email:"a@test" }); }];
const ACCT  = [/\/rest\/v1\/account/, function(){ return body(200, [{ role:"customer", provider_id:null, name:"갑" }]); }];

(async function(){

console.log("\n── 설정이 되어 있는가 (fail-closed)");
{
  setEnv({});
  ok("아무것도 없으면 꺼져 있다", A.authReady() === false);
  setEnv({ SUPABASE_URL:"  ", SUPABASE_ANON_KEY:"  " });
  ok("공백만 있는 값은 없는 것으로 본다", A.authReady() === false);
  setEnv({ SUPABASE_URL:URL_ });
  ok("주소만 있으면 꺼져 있다", A.authReady() === false);
  envAll();
  ok("둘이 있으면 켜진다", A.authReady() === true);
}

console.log("\n── 토큰을 헤더에서만 받는가");
{
  ok("Bearer 세 토막을 받는다", A.bearer(req({ headers:{ authorization:"Bearer " + TOK } })) === TOK);
  ok("토막이 둘이면 안 받는다", A.bearer(req({ headers:{ authorization:"Bearer a.b" } })) === "");
  ok("Basic 은 안 받는다",     A.bearer(req({ headers:{ authorization:"Basic abc" } })) === "");
  ok("헤더가 없으면 빈 값",    A.bearer(req()) === "");
  /* ⚠️ 줄바꿈이 섞인 것을 그대로 상위 서비스에 던지지 않습니다 */
  ok("줄바꿈이 섞이면 안 받는다",
     A.bearer(req({ headers:{ authorization:"Bearer a.b.c\nX-Admin: 1" } })) === "");
  /* ⚠️ 역할을 헤더로 보내도 토큰이 아닙니다 */
  ok("role 헤더는 토큰이 아니다",
     A.bearer(req({ headers:{ role:"admin" } })) === "");
}

console.log("\n── 이 토큰이 누구인가 (Supabase 에게 묻습니다)");
{
  setEnv({});
  mock([USER]);
  let r = await A.whoami(TOK);
  ok("설정 전에는 열지 않는다 (nowhere)", !r.ok && r.why === "nowhere", r);
  ok("설정 전에는 아예 묻지도 않는다", calls.length === 0, calls.length);

  envAll();
  mock([USER]);
  r = await A.whoami(TOK);
  ok("누구인지 돌려준다", r.ok && r.sub === "u-1", r);
  ok("apikey 는 공개 키로 보낸다", calls[0].h.apikey === ANON, calls[0].h);
  ok("authorization 은 그 사람의 토큰으로 보낸다",
     calls[0].h.authorization === "Bearer " + TOK, calls[0].h);
  /* ⚠️⚠️ 여기에 service key 가 섞이면 "누구인가" 가 아니라 "전부" 가 됩니다 */
  ok("service key 를 보내지 않는다", noSvcAnywhere(), calls.map(c => c.h));

  mock([[/\/auth\/v1\/user/, function(){ return body(401, { message:"bad jwt" }); }]]);
  r = await A.whoami(TOK);
  ok("거절당하면 ok 가 아니다", !r.ok, r);
  ok("까닭 글이 200자 안쪽이다", String(r.why).length <= 230, String(r.why).length);
  ok("까닭 글에 토큰이 섞이지 않는다", String(r.why).indexOf(TOK) < 0, r.why);

  global.fetch = async function(){ throw aborter(); };
  r = await A.whoami(TOK);
  ok("시간이 초과되면 끊긴 것으로 알려 준다", !r.ok && r.timeout === true, r);

  ok("토큰이 없으면 묻지 않는다", (await A.whoami("")).why === "no token");
}

console.log("\n── ⚠️⚠️ 역할을 요청이 아니라 DB 에서 읽는가");
{
  envAll();
  /* 줄이 없으면 **가장 낮은 역할** — 없는 것을 관리자로 읽으면 사고입니다 */
  mock([USER, [/\/rest\/v1\/account/, function(){ return body(200, []); }]]);
  let a = await A.roleOf(TOK, "u-1");
  ok("account 줄이 없으면 customer 다 (관리자가 아닙니다)", a.role === "customer", a);

  mock([USER, [/\/rest\/v1\/account/, function(){
    return body(200, [{ role:"admin", provider_id:null, name:"관리자" }]); }]]);
  a = await A.roleOf(TOK, "u-1");
  ok("DB 가 admin 이라고 하면 admin 이다", a.role === "admin", a);
  ok("자기 줄만 묻는다 (id=eq.)", /account\?[^ ]*id=eq\.u-1/.test(calls[0].url), calls[0].url);
  ok("역할을 읽을 때도 그 사람의 토큰으로 읽는다",
     calls[0].h.authorization === "Bearer " + TOK && calls[0].h.apikey === ANON, calls[0].h);
  ok("역할을 읽을 때 service key 를 쓰지 않는다", noSvcAnywhere(), calls.map(c => c.h));

  /* ⚠️⚠️ 화면이 보낸 역할은 **아무 힘이 없어야** 합니다 */
  mock([USER, ACCT]);
  const s = await A.session(req({
    headers:{ authorization:"Bearer " + TOK, role:"admin", "x-role":"admin" },
    body:{ role:"admin" } }));
  ok("요청에 role:admin 을 넣어도 customer 다", s.ok && s.role === "customer", s);
}

console.log("\n── 함수 이름 자물쇠 (둘째 — 글자 씻기)");
{
  ok("빈 이름은 빈 값", D.safeFn("") === "" && D.safeFn(null) === "");
  ok("세미콜론과 공백을 걷어낸다", D.safeFn("drop; select 1") === "dropselect", D.safeFn("drop; select 1"));
  ok("대문자를 내린다", D.safeFn("Move_State") === "move_state");
  ok("멀쩡한 이름은 그대로", D.safeFn("confirm_fee") === "confirm_fee");
}

console.log("\n── 읽기 · 부르기는 **그 사람의 토큰으로** (RLS 를 거쳐서)");
{
  envAll();
  mock([[/\/rest\/v1\/rpc\/move_state/, function(){ return body(200, "assigned"); }]]);
  let r = await D.dbRpc(TOK, "move_state", { p_request:"r-1", p_to:"assigned" });
  ok("rpc 주소로 부른다", r.ok && /\/rest\/v1\/rpc\/move_state$/.test(calls[0].url), calls[0] && calls[0].url);
  ok("apikey 는 공개 키 · authorization 은 그 사람의 토큰",
     calls[0].h.apikey === ANON && calls[0].h.authorization === "Bearer " + TOK, calls[0].h);
  /* ⚠️⚠️ service key 로 부르면 auth.uid() 가 비어서 **감사 기록에 변경자가
     안 남습니다** (0003 · 0004 가 그래서 스스로 거절합니다) */
  ok("service key 로 부르지 않는다", noSvcAnywhere(), calls.map(c => c.h));

  r = await D.dbRpc(TOK, "!!!", {});
  ok("씻어서 빈 이름이 되면 거절한다 (둘째 자물쇠의 그 말)",
     !r.ok && r.why === "함수 이름이 비었습니다", r);

  r = await D.dbRpc("", "move_state", {});
  ok("토큰이 없으면 부르지 않는다", !r.ok && r.why === "no token", r);

  setEnv({ SUPABASE_URL:URL_, SUPABASE_SERVICE_KEY:SVC });   /* 공개 키가 없는 상태 */
  r = await D.dbRpc(TOK, "move_state", {});
  ok("공개 키가 없으면 열지 않는다 (service key 로 대신하지 않습니다)",
     !r.ok && r.why === "nowhere", r);

  envAll();
  mock([[/\/rest\/v1\/request/, function(){ return body(200, [{ no:"SW-AAAA-0001" }]); }]]);
  const q = await D.dbSelectAs(TOK, "request", "?select=no");
  ok("읽기도 그 사람의 토큰으로", q.ok && calls[0].h.authorization === "Bearer " + TOK, calls[0].h);
  ok("읽기에 service key 를 쓰지 않는다", noSvcAnywhere(), calls.map(c => c.h));
}

console.log("\n── /api/session");
{
  envAll();
  let r = res();
  await Hsession(req({ method:"POST" }), r);
  ok("GET 만 받는다", r.code === 405, r);

  setEnv({});
  r = res(); mock([USER, ACCT]);
  await Hsession(req(), r);
  ok("설정 전에는 auth:false (에러가 아닙니다)",
     r.code === 200 && r.body.auth === false && r.body.signedIn === false, r.body);
  ok("설정 전에는 Supabase 에 묻지 않는다", calls.length === 0, calls.length);

  envAll();
  r = res();
  await Hsession(req(), r);
  ok("토큰이 없으면 signedIn:false (에러가 아닙니다)",
     r.code === 200 && r.body.auth === true && r.body.signedIn === false, r.body);

  r = res(); mock([USER, ACCT]);
  await Hsession(req({ headers:{ authorization:"Bearer " + TOK, role:"admin" } }), r);
  ok("로그인하면 역할을 돌려준다 (DB 의 값으로)",
     r.body.signedIn === true && r.body.role === "customer", r.body);
  ok("업체가 아니면 provider 가 null", r.body.provider === null, r.body);
  ok("캐시하지 않는다", r.headers["cache-control"] === "no-store", r.headers);
  ok("답에 키 · 토큰이 섞이지 않는다", !leaks(r), r.body);

  /* 업체면 업체 주소가 같이 나갑니다 */
  r = res();
  mock([USER, [/\/rest\/v1\/account/, function(){
    return body(200, [{ role:"provider", provider_id:"pv-one", name:"가나다" }]); }]]);
  await Hsession(req({ headers:{ authorization:"Bearer " + TOK } }), r);
  ok("업체면 업체 주소가 나간다", r.body.role === "provider" && r.body.provider === "pv-one", r.body);
}

console.log("\n── /api/deal — 상태를 바꾸는 유일한 길");
{
  envAll();
  let r = res();
  await Hdeal(req({ method:"GET" }), r);
  ok("POST 만 받는다", r.code === 405, r);

  /* 첫째 자물쇠 — 허용 목록. ⚠️ 둘째(글자 씻기)와 **다른 말**이라야
     어느 자물쇠가 걸렸는지 압니다 */
  r = res(); mock([USER, ACCT]);
  await Hdeal(req({ method:"POST", headers:{ authorization:"Bearer " + TOK },
                    body:{ fn:"drop_everything", args:{} } }), r);
  ok("목록에 없는 함수는 거절한다 (첫째 자물쇠의 그 말)",
     r.code === 400 && r.body.error === "허용되지 않은 동작입니다", r.body);
  ok("거절할 때는 Supabase 에 묻지도 않는다", calls.length === 0, calls.length);

  r = res();
  await Hdeal(req({ method:"POST", headers:{ authorization:"Bearer " + TOK },
                    body:{ fn:"", args:{} } }), r);
  ok("빈 함수 이름도 첫째 자물쇠가 잡는다",
     r.code === 400 && r.body.error === "허용되지 않은 동작입니다", r.body);

  setEnv({});
  r = res();
  await Hdeal(req({ method:"POST", body:{ fn:"move_state" } }), r);
  ok("설정 전에는 503", r.code === 503, r);
  ok("손님에게 설정 방법을 찍지 않는다 (절대 규칙 3)",
     String(r.body.error).indexOf("SUPABASE") < 0 &&
     String(r.body.error).indexOf("Vercel") < 0, r.body);
  ok("운영자에게는 까닭이 남는다",
     warned.some(w => w.indexOf("SUPABASE_URL") >= 0), warned.slice(-2));

  envAll();
  r = res();
  await Hdeal(req({ method:"POST", body:{ fn:"move_state" } }), r);
  ok("토큰이 없으면 401", r.code === 401, r);

  /* ⚠️⚠️ 정해 둔 인자만 넘어가야 합니다 — `p_by` 를 섞어 보내
     **남의 이름으로** 기록을 남기지 못합니다 */
  r = res();
  mock([USER, ACCT, [/\/rpc\/move_state/, function(){ return body(200, "assigned"); }]]);
  await Hdeal(req({ method:"POST", headers:{ authorization:"Bearer " + TOK },
    body:{ fn:"move_state",
           args:{ p_request:"r-1", p_to:"assigned", p_ctx:{ agree3rd:true },
                  p_by:"55555555-5555-5555-5555-555555555555", role:"admin" } } }), r);
  const sent = JSON.parse(calls[calls.length - 1].opt.body || "{}");
  ok("정해 둔 인자는 넘어간다", sent.p_request === "r-1" && sent.p_to === "assigned", sent);
  ok("p_by 를 섞어 보내도 안 넘어간다", sent.p_by === undefined, sent);
  ok("role 을 섞어 보내도 안 넘어간다", sent.role === undefined, sent);
  ok("성공하면 ok", r.code === 200 && r.body.ok === true, r.body);
  ok("답에 키 · 토큰이 섞이지 않는다", !leaks(r), r.body);

  /* ⚠️ DB 함수가 거절한 **그 말**이 손님에게 그대로 가야 합니다 —
     "무엇을 하면 되는지" 가 거기 적혀 있습니다 */
  r = res();
  mock([USER, ACCT, [/\/rpc\/move_state/, function(){
    return body(400, { code:"P0001", message:"갈 수 없는 길입니다 — new → done" }); }]]);
  await Hdeal(req({ method:"POST", headers:{ authorization:"Bearer " + TOK },
                    body:{ fn:"move_state", args:{ p_request:"r-1", p_to:"done" } } }), r);
  ok("DB 가 거절한 말을 그대로 보여 준다",
     r.body.error === "갈 수 없는 길입니다 — new → done", r.body);
  ok("상태코드 · 주소를 손님 글에 섞지 않는다",
     String(r.body.error).indexOf("db 400") < 0 &&
     String(r.body.error).indexOf("supabase") < 0, r.body);

  /* ⚠️⚠️ 돈 쪽 함수의 인자가 **실제로 넘어가는가.** 처음에 OK_ARG 를
     눈대중으로 적어 두어서(p_amount · p_delta …) 수수료 확정이 인자
     없이 불릴 상태였습니다 — 빌드의 checkRpcArgs() 가 SQL 과 맞춰
     보지만, 여기서도 한 번 봅니다. */
  r = res();
  mock([USER, [/\/rest\/v1\/account/, function(){
         return body(200, [{ role:"admin", provider_id:null, name:"관리자" }]); }],
        [/\/rpc\/confirm_fee/, function(){ return body(200, null); }]]);
  await Hdeal(req({ method:"POST", headers:{ authorization:"Bearer " + TOK },
    body:{ fn:"confirm_fee", args:{ p_deal:"d-1", p_fee:300000, p_vat:30000,
      p_total:330000, p_snap:{ type:"rate", rate:3 }, p_proof:{ kind:"계약서" },
      p_why:"증빙 확인" } } }), r);
  const fee = JSON.parse(calls[calls.length - 1].opt.body || "{}");
  ok("수수료 확정의 인자 일곱이 다 넘어간다",
     fee.p_deal === "d-1" && fee.p_fee === 300000 && fee.p_vat === 30000 &&
     fee.p_total === 330000 && !!fee.p_snap && !!fee.p_proof && fee.p_why === "증빙 확인", fee);

  r = res();
  mock([USER, [/\/rest\/v1\/account/, function(){
         return body(200, [{ role:"admin", provider_id:null, name:"관리자" }]); }],
        [/\/rpc\/clawback_fee/, function(){ return body(200, -50000); }]]);
  await Hdeal(req({ method:"POST", headers:{ authorization:"Bearer " + TOK },
    body:{ fn:"clawback_fee", args:{ p_deal:"d-1", p_new_fee:250000, p_why:"부분환불" } } }), r);
  const cb = JSON.parse(calls[calls.length - 1].opt.body || "{}");
  ok("환수의 인자 셋이 다 넘어간다",
     cb.p_deal === "d-1" && cb.p_new_fee === 250000 && cb.p_why === "부분환불", cb);

  /* 허용 목록 여섯이 그대로 있는가 */
  const src = require("fs").readFileSync(path.join(ROOT, "api", "deal.js"), "utf8");
  ["move_state","answer_assignment","claim_request","confirm_fee","mark_paid","clawback_fee"]
    .forEach(function(f){ ok("허용 목록에 " + f + " 가 있다", src.indexOf(f + ":1") >= 0); });
}

console.log("\n── /api/me — 역할마다 **어느 칸을** 가져오는가");
{
  envAll();
  /* ⚠️ 주석을 먼저 걷어냅니다. 처음에 소스 전체에서 찾았더니 **이
     규칙을 설명하는 주석**("select=* 로 두면 …")에 걸려서 멀쩡한 코드를
     실패로 잡았습니다 — 이 저장소가 "검사가 화면 글 전체에서 찾음" 으로
     여러 번 겪은 자리입니다. 틀린 것은 코드가 아니라 검사였습니다. */
  const src = require("fs").readFileSync(path.join(ROOT, "api", "me.js"), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
  ok("select=* 를 쓰지 않는다 (칸을 손으로 적습니다)",
     src.indexOf("select=*") < 0 && src.indexOf("*") < 0, src.match(/.{0,40}\*.{0,40}/));

  /* 고객 — ⚠️ 수수료 · 정산을 **묻지도 않습니다** */
  let r = res();
  mock([USER, ACCT, [/\/rest\/v1\/request/, function(){ return body(200, [{ no:"SW-AAAA-0001" }]); }]]);
  await Hme(req({ headers:{ authorization:"Bearer " + TOK } }), r);
  const cust = calls.filter(c => /\/rest\/v1\/request/.test(c.url))[0].url;
  ok("고객 칸에 수수료 · 입금이 없다",
     !/fee|paid|amount/.test(decodeURIComponent(cust)), decodeURIComponent(cust));
  ok("고객에게는 계약을 묻지도 않는다",
     calls.every(c => !/\/rest\/v1\/deal/.test(c.url)), calls.map(c => c.url));
  ok("고객 칸에 연결된 업체 상호가 있다 (제17조 재동의가 상호를 알려 드립니다)",
     /provider\(/.test(decodeURIComponent(cust)), decodeURIComponent(cust));
  ok("답에 키 · 토큰이 섞이지 않는다", !leaks(r), r.body);

  /* 업체 — 연락처가 옵니다 (그게 배정입니다) + 계약 */
  r = res();
  mock([USER, [/\/rest\/v1\/account/, function(){
         return body(200, [{ role:"provider", provider_id:"pv-one", name:"가나다" }]); }],
        [/\/rest\/v1\/request/, function(){ return body(200, []); }],
        [/\/rest\/v1\/deal/,    function(){ return body(200, []); }]]);
  await Hme(req({ headers:{ authorization:"Bearer " + TOK } }), r);
  const pv = decodeURIComponent(calls.filter(c => /\/rest\/v1\/request/.test(c.url))[0].url);
  ok("업체 칸에 연락처가 있다", /tel/.test(pv), pv);
  ok("업체에게는 계약을 묻는다", calls.some(c => /\/rest\/v1\/deal/.test(c.url)));

  /* 직원 · 관리자 — ⚠️ 목록에 성함 · 연락처를 깔지 않습니다 */
  r = res();
  mock([USER, [/\/rest\/v1\/account/, function(){
         return body(200, [{ role:"staff", provider_id:null, name:"직원" }]); }],
        [/\/rest\/v1\/request/, function(){ return body(200, []); }]]);
  await Hme(req({ headers:{ authorization:"Bearer " + TOK } }), r);
  const st = decodeURIComponent(calls.filter(c => /\/rest\/v1\/request/.test(c.url))[0].url);
  ok("직원 목록에 성함 · 연락처가 없다",
     !/(^|,)name(,|$)/.test(st) && !/(^|,)tel(,|$)/.test(st), st);

  r = res();
  mock([USER, [/\/rest\/v1\/account/, function(){
         return body(200, [{ role:"admin", provider_id:null, name:"관리자" }]); }],
        [/\/rest\/v1\/request/, function(){ return body(200, []); }],
        [/\/rest\/v1\/deal/,    function(){ return body(200, []); }]]);
  await Hme(req({ headers:{ authorization:"Bearer " + TOK } }), r);
  const ad = decodeURIComponent(calls.filter(c => /\/rest\/v1\/request/.test(c.url))[0].url);
  ok("관리자 목록도 성함 · 연락처 없이 본다", ad === st, [ad, st]);
  ok("관리자에게는 계약을 묻는다", calls.some(c => /\/rest\/v1\/deal/.test(c.url)));

  /* 전부 그 사람의 토큰으로 */
  ok("읽기 전부 service key 를 쓰지 않는다", noSvcAnywhere(), calls.map(c => c.h));

  setEnv({});
  r = res();
  await Hme(req({ headers:{ authorization:"Bearer " + TOK } }), r);
  ok("설정 전에는 auth:false (에러가 아닙니다)", r.code === 200 && r.body.auth === false, r.body);
}

console.log("\n── 시간 제한 (두 층이 같은 8초)");
{
  ok("로그인 확인 8초", A.AUTH_TIMEOUT === 8000, A.AUTH_TIMEOUT);
  ok("DB 8초",        D.DB_TIMEOUT === 8000, D.DB_TIMEOUT);
  /* ⚠️ 화면의 20초 안에 들어와야 합니다 — 로그인 확인과 DB 를 연달아
     부르는 길이 있으니 둘을 더해도 20초 안쪽이라야 합니다 */
  ok("둘을 더해도 화면의 20초 안쪽", A.AUTH_TIMEOUT + D.DB_TIMEOUT < 20000,
     A.AUTH_TIMEOUT + D.DB_TIMEOUT);
}

console.warn = realWarn; console.error = realErr;
console.log("\n" + (bad ? "❌ " + bad + "/" + ran + " 실패" : "✅ " + ran + "개 전부 통과") + "\n");
process.exit(bad ? 1 : 0);

})().catch(function(e){
  console.warn = realWarn; console.error = realErr;
  console.log("\n❌ 검사가 도중에 멈췄습니다 — " + (e && e.stack || e));
  process.exit(1);
});
