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
/* rpc 호출의 본문 — ⚠️⚠️ **"마지막 호출" 로 집지 마세요.** 2차에서
   상태 변경 뒤에 **운영자 알림**(웹훅)이 한 번 더 나가면서, 마지막
   호출이 rpc 가 아닌 날이 옵니다. 주소로 집습니다. */
function rpcBody(fn){
  const c = calls.filter(function(x){ return x.url.indexOf("/rpc/" + fn) >= 0; });
  return c.length ? JSON.parse(c[c.length - 1].opt.body || "{}") : null;
}
/* 알림으로 나간 것 (웹훅) */
function hookCalls(){
  return calls.filter(function(x){ return x.url.indexOf("hooks.example") >= 0; });
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
/* 샜는가 — ⚠️⚠️ **`service key` 와 그 사람의 토큰은 어디에도** 나오면
   안 됩니다. service key 는 RLS 를 통째로 지나가고, 토큰은 그 사람
   자신입니다.
   ⚠️ **anon key 는 다릅니다.** 그 키는 새도 괜찮게 설계된 **공개 키**
   이고, 무엇을 볼 수 있는지는 전부 RLS 가 정합니다 — 화면이 매직링크를
   보내려면 그 키가 필요해서 `/api/session` 이 `conf` 로 내려줍니다.
   그래서 **`conf` 밖에 있으면 샌 것**으로 봅니다 (처음에 통째로 금지해
   두었다가 `conf` 를 더하면서 걸렸습니다 — 그때 "검사가 틀렸다" 가
   아니라 **기준이 거칠었습니다**). */
function leaks(r){
  const b = r.body || {};
  const all = JSON.stringify(b);
  if(all.indexOf(SVC) >= 0 || all.indexOf(TOK) >= 0) return true;
  /* anon key — `conf` 를 뺀 나머지에서 찾습니다 */
  const rest = Object.assign({}, b); delete rest.conf;
  return JSON.stringify(rest).indexOf(ANON) >= 0;
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

  /* ── 화면에 내려주는 설정 (2026-10-11 · 1차 로그인) ──────────────
     화면이 매직링크를 보내려면 **주소와 공개 키**가 필요합니다.
     ⚠️⚠️ 내려가는 것이 그 **둘뿐**인지 칸 이름으로 봅니다 — `conf` 에
     칸이 하나 늘면 그 순간 같이 나갑니다 (`select=*` 를 안 쓰는 것과
     같은 까닭입니다). */
  r = res(); mock([USER, ACCT]);
  await Hsession(req({ headers:{ authorization:"Bearer " + TOK } }), r);
  ok("설정 뒤에는 화면이 쓸 주소 · 공개 키를 내려준다",
     r.body.conf && r.body.conf.url && r.body.conf.anonKey === ANON, r.body.conf);
  ok("conf 에 든 칸은 주소 · 공개 키 **둘뿐**이다",
     Object.keys(r.body.conf || {}).sort().join(",") === "anonKey,url",
     Object.keys(r.body.conf || {}));
  ok("conf 에 service key 가 없다",
     JSON.stringify(r.body.conf || {}).indexOf(SVC) < 0, r.body.conf);

  /* ⚠️ 로그인 전에도 화면이 메일을 보내야 하니 **토큰이 없어도** 옵니다 */
  r = res();
  await Hsession(req(), r);
  ok("토큰이 없어도 conf 는 온다 (로그인 메일을 보내려면 필요합니다)",
     r.body.auth === true && r.body.signedIn === false &&
     r.body.conf && r.body.conf.anonKey === ANON, r.body);

  /* ⚠️⚠️ **설정 전에는 아무것도 내려가지 않습니다.** 화면은 `auth:false`
     면 구간째 안 그립니다 — 거기에 주소가 섞여 나가면 안 됩니다. */
  setEnv({});
  r = res();
  await Hsession(req(), r);
  ok("설정 전에는 conf 도 없다", !r.body.conf, r.body);
  envAll();
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
  const sent = rpcBody("move_state");
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
  const fee = rpcBody("confirm_fee");
  ok("수수료 확정의 인자 일곱이 다 넘어간다",
     fee.p_deal === "d-1" && fee.p_fee === 300000 && fee.p_vat === 30000 &&
     fee.p_total === 330000 && !!fee.p_snap && !!fee.p_proof && fee.p_why === "증빙 확인", fee);

  r = res();
  mock([USER, [/\/rest\/v1\/account/, function(){
         return body(200, [{ role:"admin", provider_id:null, name:"관리자" }]); }],
        [/\/rpc\/clawback_fee/, function(){ return body(200, -50000); }]]);
  await Hdeal(req({ method:"POST", headers:{ authorization:"Bearer " + TOK },
    body:{ fn:"clawback_fee", args:{ p_deal:"d-1", p_new_fee:250000, p_why:"부분환불" } } }), r);
  const cb = rpcBody("clawback_fee");
  ok("환수의 인자 셋이 다 넘어간다",
     cb.p_deal === "d-1" && cb.p_new_fee === 250000 && cb.p_why === "부분환불", cb);

  /* 허용 목록 여섯이 그대로 있는가 */
  const src = require("fs").readFileSync(path.join(ROOT, "api", "deal.js"), "utf8");
  ["move_state","answer_assignment","claim_request","confirm_fee","mark_paid","clawback_fee",
   /* 0007 (2차) — ⚠️ 표를 열지 않고 **문을 늘렸습니다** */
   "save_provider","approve_provider","save_fee_policy","set_fee_policy_active"]
    .forEach(function(f){ ok("허용 목록에 " + f + " 가 있다", src.indexOf(f + ":1") >= 0); });
}

console.log("\n── /api/deal — 상태가 바뀌면 운영자에게 한 줄 (2차 10)");
{
  /* ⚠️⚠️ **손님에게 보내지 않습니다.** 문자 · 카톡 · 알림톡은
     정보통신망법 제50조의 **사전 수신동의**가 먼저이고, 지금 그 동의를
     받는 자리도 받아 둔 기록도 없습니다. */
  const HOOK = "https://hooks.example/deal";
  const okHook = [/hooks\.example/, function(){ return body(200, { ok:true }); }];
  const ADMIN = [/\/rest\/v1\/account/, function(){
    return body(200, [{ role:"admin", provider_id:null, name:"관리자" }]); }];

  envAll();
  process.env.INTAKE_WEBHOOK_URL = HOOK;

  let r = res();
  mock([USER, ADMIN, [/\/rpc\/confirm_fee/, function(){ return body(200, null); }], okHook]);
  await Hdeal(req({ method:"POST", headers:{ authorization:"Bearer " + TOK },
    body:{ fn:"confirm_fee", args:{ p_deal:"d-1", p_fee:300000, p_vat:30000,
      p_total:330000, p_snap:{ type:"rate", rate:3 },
      p_proof:{ note:"세금계산서 받음" },
      p_why:"김사장님이 다음 달에 쓰신다고 하셔서 확인했습니다" } } }), r);

  ok("상태 변경은 그대로 성공한다", r.code === 200 && r.body.ok === true, r.body);
  const hk = hookCalls();
  ok("운영자에게 한 줄 나간다", hk.length === 1, hk.length);

  const sentTxt = hk.length ? String(hk[0].opt.body || "") : "";
  /* ⚠️⚠️ **개인정보를 한 글자도 싣지 않습니다** (제3조 제1항 · 제26조).
     사유(`why`)도 안 보냅니다 — 사람이 손으로 적는 칸이라 성함이
     들어올 수 있고, 그러면 그 순간 새 수탁 범위가 됩니다. */
  ok("사유를 싣지 않는다 (손으로 적는 칸이라 성함이 들어옵니다)",
     sentTxt.indexOf("김사장") < 0 && sentTxt.indexOf("다음 달에") < 0, sentTxt.slice(0, 200));
  ok("증빙 글도 싣지 않는다",
     sentTxt.indexOf("세금계산서") < 0, sentTxt.slice(0, 200));
  /* ⚠️ 함수 이름을 그대로 내보내지 않습니다 — 읽고 무슨 일인지
     알 수 있어야 합니다 */
  ok("무슨 일인지 사람 말로 적는다",
     sentTxt.indexOf("수수료를 확정했습니다") >= 0, sentTxt.slice(0, 200));
  ok("누가 바꿨는지 역할이 간다", sentTxt.indexOf("admin") >= 0, sentTxt.slice(0, 200));
  ok("금액은 간다 (개인정보가 아닙니다)",
     sentTxt.indexOf("300000") >= 0, sentTxt.slice(0, 300));
  ok("가서 보라고 적는다",
     sentTxt.indexOf("/admin") >= 0, sentTxt.slice(-200));
  /* ⚠️ 알림에도 키가 섞이면 안 됩니다 */
  ok("알림에 키 · 토큰이 섞이지 않는다",
     sentTxt.indexOf(SVC) < 0 && sentTxt.indexOf(TOK) < 0, sentTxt.slice(0, 200));

  /* ⚠️⚠️ **거절당하면 안 보냅니다** — "바뀌었구나" 로 읽힙니다 */
  r = res();
  mock([USER, ADMIN, [/\/rpc\/move_state/, function(){
    return body(400, { code:"P0001", message:"갈 수 없는 길입니다 — new → done" }); }], okHook]);
  await Hdeal(req({ method:"POST", headers:{ authorization:"Bearer " + TOK },
                    body:{ fn:"move_state", args:{ p_request:"r-1", p_to:"done" } } }), r);
  ok("거절당하면 알림을 안 보낸다", hookCalls().length === 0, hookCalls().length);

  /* ⚠️⚠️ **알림이 실패해도 상태 변경을 되돌리지 않습니다.** 상태는
     이미 DB 에 적혔고, 여기서 에러를 돌려주면 운영자가 다시 누릅니다 —
     두 번째는 "갈 수 없는 길" 로 거절당해서 더 헷갈립니다. */
  r = res();
  mock([USER, ADMIN, [/\/rpc\/move_state/, function(){ return body(200, "hold"); }],
        [/hooks\.example/, function(){ throw new Error("webhook down"); }]]);
  await Hdeal(req({ method:"POST", headers:{ authorization:"Bearer " + TOK },
                    body:{ fn:"move_state", args:{ p_request:"r-1", p_to:"hold" } } }), r);
  ok("알림이 터져도 상태 변경은 성공이다", r.code === 200 && r.body.ok === true, r.body);

  /* ⚠️ 받을 곳이 없으면 **조용히 지나갑니다** — 알림은 거들기이고,
     그것 때문에 상태 변경을 잃으면 더 나쁩니다 */
  delete process.env.INTAKE_WEBHOOK_URL;
  r = res();
  mock([USER, ADMIN, [/\/rpc\/move_state/, function(){ return body(200, "hold"); }]]);
  await Hdeal(req({ method:"POST", headers:{ authorization:"Bearer " + TOK },
                    body:{ fn:"move_state", args:{ p_request:"r-1", p_to:"hold" } } }), r);
  ok("받을 곳이 없어도 상태 변경은 성공이다", r.code === 200 && r.body.ok === true, r.body);
  ok("받을 곳이 없으면 아무 데도 안 두드린다",
     calls.every(c => c.url.indexOf("hooks.example") < 0), calls.map(c => c.url));

  /* ⚠️ 알림에 실을 것도 **허용 목록**입니다 — 인자가 하나 늘 때마다
     조용히 같이 나가지 않게 */
  const src = require("fs").readFileSync(path.join(ROOT, "api", "deal.js"), "utf8");
  ok("실을 것을 허용 목록으로 둔다", /SAY_ARG\s*=/.test(src));
  ok("사유 · 증빙은 그 목록에 없다",
     !/p_why\s*:/.test(src.slice(src.indexOf("SAY_ARG"), src.indexOf("NOTE_TIMEOUT"))) &&
     !/p_proof\s*:/.test(src.slice(src.indexOf("SAY_ARG"), src.indexOf("NOTE_TIMEOUT"))),
     src.slice(src.indexOf("SAY_ARG"), src.indexOf("NOTE_TIMEOUT")));

  setEnv({});
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
  /* ⚠️ 환수는 **감사 기록**에 남습니다 (0003 clawback_fee) — 계약을 안
     묻는 것만 보고 통과시키면 돈이 그쪽 길로 샐 수 있습니다. */
  ok("고객에게는 환수 기록도 묻지 않는다",
     calls.every(c => !/audit_log/.test(c.url)), calls.map(c => c.url));
  ok("고객 칸에 연결된 업체 상호가 있다 (제17조 재동의가 상호를 알려 드립니다)",
     /provider\(/.test(decodeURIComponent(cust)), decodeURIComponent(cust));
  /* ⚠️⚠️ 배정 고르개(업체 목록)는 **직원 · 관리자만**입니다. 거기 오는
     것은 `listed=false` 인 **아직 안 켠 업체까지**라, 고객 · 업체에게
     내려가면 공개 전인 업체가 새는 것입니다. */
  ok("고객에게는 업체 목록을 묻지 않는다",
     calls.every(c => !/\/rest\/v1\/provider\b/.test(c.url)), calls.map(c => c.url));
  /* ── 견적 (0008 · §6) ──────────────────────────────────────────
     ⚠️⚠️ **견적 금액은 수수료가 아닙니다.** 견적은 고객이 업체에 내는
     돈이라 고객이 봐야 하고, 수수료는 업체가 우리에게 내는 돈이라 고객이
     보면 안 됩니다 — 둘을 한 낱말로 묶으면 비교 화면이 통째로 막힙니다. */
  /* ⚠️⚠️ **`id` 가 없으면 견적이 통째로 안 보입니다.** 견적은
     `request_id` 로 신청에 붙는데 신청 칸에 `id` 가 없으면 화면이 짝을
     못 맞춥니다 — 에러도 안 나고 구간이 그냥 안 그려집니다. 실제로
     그렇게 적어 두었다가 **찍어 보고** 알았습니다. */
  ok("고객 칸에 신청 id 가 있다 (견적이 거기 붙습니다)",
     /(^|,|=)id(,|$)/.test(decodeURIComponent(cust).split("select=")[1] || ""), cust);
  const cq = calls.filter(c => /\/rest\/v1\/quote/.test(c.url))[0];
  ok("고객에게는 견적을 묻는다 (§6 비교)", !!cq, calls.map(c => c.url));
  const cqu = cq ? decodeURIComponent(cq.url) : "";
  ok("고객 견적 칸에 업체 상호가 있다 (누구의 견적인지)",
     /provider\(/.test(cqu), cqu);
  ok("고객 견적 칸에 비교에 쓰는 것이 다 있다",
     /amount/.test(cqu) && /scope/.test(cqu) && /warranty/.test(cqu), cqu);
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
  ok("업체에게는 환수 합계를 묻지 않는다 (자기 건 기록은 DB 가 보여 줍니다)",
     calls.every(c => !/audit_log/.test(c.url)), calls.map(c => c.url));
  ok("업체에게도 업체 목록을 묻지 않는다",
     calls.every(c => !/\/rest\/v1\/provider\b/.test(c.url)), calls.map(c => c.url));
  /* ⚠️ 업체도 **지금 적힌 값**이 와야 고칠 수 있습니다 — 안 주면 빈 폼에
     처음부터 다시 적습니다 (업체 상세의 quoteTo({}) 로 겪은 자리). */
  ok("업체 칸에도 신청 id 가 있다",
     /(^|,|=)id(,|$)/.test(pv.split("select=")[1] || ""), pv);
  const pq = calls.filter(c => /\/rest\/v1\/quote/.test(c.url))[0];
  ok("업체에게도 견적을 묻는다 (고치려면 지금 값이 있어야 합니다)",
     !!pq, calls.map(c => c.url));
  ok("업체 견적 칸에는 업체 상호를 붙이지 않는다 (자기 것입니다)",
     pq && !/provider\(/.test(decodeURIComponent(pq.url)),
     pq && decodeURIComponent(pq.url));

  /* 직원 · 관리자 — ⚠️ 목록에 성함 · 연락처를 깔지 않습니다 */
  r = res();
  mock([USER, [/\/rest\/v1\/account/, function(){
         return body(200, [{ role:"staff", provider_id:null, name:"직원" }]); }],
        [/\/rest\/v1\/request/, function(){ return body(200, []); }],
        [/\/rest\/v1\/provider\b/, function(){
          return body(200, [{ id:"pv-one", name:"가나다", listed:false }]); }]]);
  await Hme(req({ headers:{ authorization:"Bearer " + TOK } }), r);
  const st = decodeURIComponent(calls.filter(c => /\/rest\/v1\/request/.test(c.url))[0].url);
  ok("직원 목록에 성함 · 연락처가 없다",
     !/(^|,)name(,|$)/.test(st) && !/(^|,)tel(,|$)/.test(st), st);
  ok("직원은 계약 · 환수를 묻지 않는다",
     calls.every(c => !/\/rest\/v1\/deal|audit_log/.test(c.url)), calls.map(c => c.url));
  /* 배정 고르개 — ⚠️ 업체가 0곳이면 0곳이라고 말하고 **등록하는 길**을
     냅니다. 지어낸 업체를 끼워 넣지 않습니다 (절대 규칙 1). */
  const pvq = calls.filter(c => /\/rest\/v1\/provider\b/.test(c.url));
  ok("직원에게는 배정할 업체 목록을 준다 (§6 업체 수동 배정)",
     pvq.length === 1 && Array.isArray(r.body.providers) &&
     r.body.providers[0] && r.body.providers[0].id === "pv-one", r.body.providers);
  /* ⚠️ `verified` 는 jsonb 라 통째로 따라 나옵니다 — 배정에 쓰는 값이
     아니니 애초에 안 가져옵니다 (최소 수집). */
  ok("업체 목록에 verified 를 묻지 않는다",
     pvq.length === 1 && !/verified/.test(decodeURIComponent(pvq[0].url)),
     pvq.length ? decodeURIComponent(pvq[0].url) : "");

  r = res();
  mock([USER, [/\/rest\/v1\/account/, function(){
         return body(200, [{ role:"admin", provider_id:null, name:"관리자" }]); }],
        [/\/rest\/v1\/request/, function(){ return body(200, []); }],
        [/\/rest\/v1\/deal/,    function(){ return body(200, []); }],
        [/\/rest\/v1\/provider\b/, function(){ return body(200, []); }],
        [/audit_log/,            function(){ return body(200, []); }]]);
  await Hme(req({ headers:{ authorization:"Bearer " + TOK } }), r);
  ok("관리자에게도 배정할 업체 목록을 준다",
     calls.some(c => /\/rest\/v1\/provider\b/.test(c.url)), calls.map(c => c.url));
  const ad = decodeURIComponent(calls.filter(c => /\/rest\/v1\/request/.test(c.url))[0].url);
  ok("관리자 목록도 성함 · 연락처 없이 본다", ad === st, [ad, st]);
  ok("관리자에게는 계약을 묻는다", calls.some(c => /\/rest\/v1\/deal/.test(c.url)));
  /* §10 미수금 · 환수액 — ⚠️⚠️ 환수는 `deal` 에 안 남습니다. 확정했던
     액을 갈아 치우지 않으려고 **차액을 감사 기록**에 적기 때문입니다. */
  const au = calls.filter(c => /audit_log/.test(c.url))[0];
  ok("관리자에게만 환수 기록을 묻는다", !!au, calls.map(c => c.url));
  ok("환수 기록도 계약(deal) 것만 묻는다",
     !!au && /obj=eq\.deal/.test(au.url), au && au.url);
  ok("환수 기록 칸에 성함 · 연락처가 없다",
     !!au && !/name|tel|email/.test(decodeURIComponent(au.url)),
     au && decodeURIComponent(au.url));

  /* 전부 그 사람의 토큰으로 */
  ok("읽기 전부 service key 를 쓰지 않는다", noSvcAnywhere(), calls.map(c => c.h));

  /* ══ 2026-10-11 2차 — 수수료 정책 · 계약 · 이력 ═══════════════════ */
  /* ⚠️⚠️ 요율은 **관리자만**입니다 — 업체에게 남의 요율이 보이면 안
     되고, 직원은 돈을 안 봅니다 (PICK 과 같은 선). */
  ok("관리자에게는 수수료 정책을 준다",
     calls.some(c => /fee_policy/.test(c.url)), calls.map(c => c.url));
  /* ⚠️ 계약 한 줄만 보면 **어느 건인지** 모릅니다 — 신청을 붙입니다.
     ⚠️⚠️ 그래도 성함 · 연락처는 안 붙입니다 (목록 하나가 곧 유출). */
  {
    const dq = decodeURIComponent(calls.filter(c => /\/rest\/v1\/deal/.test(c.url))[0].url);
    ok("계약에 어느 신청인지가 붙는다", /request\(/.test(dq), dq);
    /* ⚠️⚠️ 처음에 `request(…)` 안을 **걷어내고** 봤습니다 — 그러면
       정작 연락처가 샐 수 있는 자리를 안 보는 검사가 됩니다. 되돌려
       보니 `request(…,name,tel)` 을 그대로 통과시켰습니다
       (**검사가 틀린 자리** · 이 저장소가 여러 번 겪었습니다).
       붙인 것까지 **통째로** 봅니다. */
    ok("계약 목록에 성함 · 연락처가 없다",
       !/\bname\b|\btel\b|\bemail\b/.test(dq), dq);
  }

  /* 직원 · 업체 · 고객에게는 **묻지도 않습니다** */
  for(const [who, acct] of [
    ["직원",  { role:"staff",    provider_id:null,   name:"직원" }],
    ["업체",  { role:"provider", provider_id:"pv-one", name:"가나다" }],
    ["고객",  { role:"customer", provider_id:null,   name:"갑" }]
  ]){
    r = res();
    mock([USER, [/\/rest\/v1\/account/, function(){ return body(200, [acct]); }],
          [/\/rest\/v1\/request/,  function(){ return body(200, []); }],
          [/\/rest\/v1\/provider\b/, function(){ return body(200, []); }],
          [/\/rest\/v1\/deal/,     function(){ return body(200, []); }],
          [/fee_policy/,             function(){ return body(200, []); }]]);
    await Hme(req({ headers:{ authorization:"Bearer " + TOK } }), r);
    ok(who + "에게는 수수료 정책을 묻지 않는다",
       calls.every(c => !/fee_policy/.test(c.url)), calls.map(c => c.url));
  }

  /* ── 신청 한 건의 이력 (§6 "신청 및 변경 이력") ──────────────────
     ⚠️⚠️ **목록에 다 붙이지 않습니다** — 사유에 사정이 적히는 글이라
     쉰 건을 통째로 내리면 화면 하나가 곧 유출입니다. */
  const RID = "11111111-2222-3333-4444-555555555555";
  r = res();
  mock([USER, ACCT, [/\/rest\/v1\/request/, function(){ return body(200, []); }],
        [/audit_log/, function(){ return body(200, [{ at:"x", to_state:"check" }]); }]]);
  await Hme(req({ headers:{ authorization:"Bearer " + TOK }, query:{ r:RID } }), r);
  {
    const hq = calls.filter(c => /audit_log/.test(c.url))[0];
    ok("한 건을 물으면 그 건의 이력만 가져온다",
       hq && decodeURIComponent(hq.url).indexOf("obj_id=eq." + RID) >= 0,
       hq ? decodeURIComponent(hq.url) : "안 불렀습니다");
    ok("이력 질의에 성함 · 연락처가 없다",
       hq && !/name|tel/.test(decodeURIComponent(hq.url)), hq && hq.url);
    ok("이력이 답에 담긴다", Array.isArray(r.body.history), r.body.history);
  }
  /* ⚠️ 주소에서 온 글자가 그대로 질의에 들어가는 자리입니다 */
  r = res(); mock([USER, ACCT]);
  await Hme(req({ headers:{ authorization:"Bearer " + TOK },
                  query:{ r:"' or 1=1 --" } }), r);
  ok("uuid 꼴이 아니면 묻지 않고 거절한다",
     r.code === 400 && calls.every(c => !/audit_log/.test(c.url)), r.body);

  setEnv({});
  r = res();
  await Hme(req({ headers:{ authorization:"Bearer " + TOK } }), r);
  ok("설정 전에는 auth:false (에러가 아닙니다)", r.code === 200 && r.body.auth === false, r.body);
}

/* ── /api/admin-health — 있는지 없는지만 (전면 감사 1차 ①) ────────
   ⚠️⚠️ 이 주소가 **값을 한 글자라도** 돌려주면 그걸로 끝입니다.
   길이도 단서라 길이도 안 돌려줍니다. */
console.log("\n── /api/admin-health — 값은 안 돌려준다");
{
  const Hhealth = require(path.join(ROOT, "api", "admin-health.js"));
  const keep = process.env.ADMIN_PASSWORD;

  envAll();
  delete process.env.ADMIN_PASSWORD;
  let r = res();
  Hhealth(req({ method:"GET" }), r);
  ok("관리자 잠금이 없으면 아무것도 안 알려 준다", r.code === 503, r.body);

  process.env.ADMIN_PASSWORD = "pw-test";
  r = res();
  Hhealth(req({ method:"GET" }), r);
  ok("DB · 로그인 상태를 같이 돌려준다",
     r.body.db && r.body.db.store === true && r.body.db.auth === true, r.body.db);
  /* ⚠️⚠️ 주소도 · 키도 · 길이도 안 나갑니다 */
  const dump = JSON.stringify(r.body);
  ok("주소 · 키가 한 글자도 안 나간다",
     dump.indexOf(SVC) < 0 && dump.indexOf(ANON) < 0 && dump.indexOf(URL_) < 0, dump);
  ok("길이도 안 알려 준다", !/length|len"/.test(dump), dump);
  ok("캐시하지 않는다", r.headers["cache-control"] === "no-store", r.headers);

  /* ⚠️⚠️ **저장과 로그인을 갈라서** 봅니다 — 한 덩어리로 보면 어느
     쪽이 빠졌는지 모르고, 그 차이가 그대로 사장님이 겪는 증상입니다
     (접수번호는 나오는데 로그인만 안 되는 꼴). */
  setEnv({ SUPABASE_URL:URL_, SUPABASE_SERVICE_KEY:SVC });
  r = res(); Hhealth(req({ method:"GET" }), r);
  ok("공개 키만 빠지면 로그인만 꺼진다",
     r.body.db.store === true && r.body.db.auth === false, r.body.db);

  setEnv({ SUPABASE_URL:URL_, SUPABASE_ANON_KEY:ANON });
  r = res(); Hhealth(req({ method:"GET" }), r);
  ok("서버 키만 빠지면 저장만 꺼진다",
     r.body.db.store === false && r.body.db.auth === true, r.body.db);

  /* ⚠️ 공백만 있는 값은 **없는 것**입니다 — Vercel 에 빈 칸을
     저장하면 "넣었다" 고 착각하게 됩니다. */
  setEnv({ SUPABASE_URL:URL_, SUPABASE_ANON_KEY:"   ", SUPABASE_SERVICE_KEY:SVC });
  r = res(); Hhealth(req({ method:"GET" }), r);
  ok("공백만 있는 값은 없는 것으로 본다", r.body.db.auth === false, r.body.db);

  if(keep === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = keep;
  envAll();
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
