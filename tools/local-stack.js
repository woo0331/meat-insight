/* 로컬 시험 스택 — 운영 · 원격 Supabase 를 쓰지 않고 실제 브라우저로 핵심 흐름을 눌러 봅니다.

     Postgres 16 (로컬 임시 클러스터 · 0001~0084 · 가짜 auth 스키마)
       ↑
     PostgREST (실제 바이너리 · docker postgrest/postgrest · JWT 로 RLS 가 실제로 걸림)
       ↑
     게이트웨이 :8971  /rest/v1 → PostgREST · /auth/v1 → 아래 "인증 대역"
       ↑
     앱 :8970  restore-public(배포본 그대로) 정적 + api/*.js 를 Vercel 처럼 실행 + /admin 기본 인증

   ⚠️⚠️ 인증 대역 — Supabase Auth(GoTrue) 이미지를 받을 수 없어서(레지스트리 한도 · 프록시) 같은 모양의
   토큰을 발급 · 확인하는 작은 서버로 대신합니다. 로그인 **메일은 보내지 않습니다**.
   매직링크 화면 흐름(메일 → 링크)은 이 스택으로는 검수하지 못합니다 — 보고에 따로 적습니다.
   ⚠️ 키 · 비밀번호는 전부 이 실행에서 새로 만든 **로컬 시험값**이고 out/local-stack/env.json 에만 남습니다.
   ⚠️ 원격 주소를 쓰지 않습니다 — SUPABASE_URL 은 언제나 http://127.0.0.1:8971 입니다.

   node tools/local-stack.js          (멈출 때 Ctrl+C — 클러스터 · 컨테이너를 같이 치웁니다) */
const fs = require("fs"), os = require("os"), path = require("path"), http = require("http"), crypto = require("crypto");
const { execSync, execFileSync, spawn } = require("child_process");
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "out", "local-stack"); fs.mkdirSync(OUT, { recursive:true });
const PGPORT = 55432, GW = 8971, APP = 8970, RESTPORT = 3077;

/* ── 로컬 시험값 ─────────────────────────────────────────────── */
const SECRET = crypto.randomBytes(32).toString("hex");
const b64 = o => Buffer.from(JSON.stringify(o)).toString("base64url");
const sign = claims => { const h = b64({ alg:"HS256", typ:"JWT" }), p = b64(claims);
  return h + "." + p + "." + crypto.createHmac("sha256", SECRET).update(h + "." + p).digest("base64url"); };
const verify = t => { const [h, p, s] = String(t || "").split(".");
  if(!s || crypto.createHmac("sha256", SECRET).update(h + "." + p).digest("base64url") !== s) return null;
  const c = JSON.parse(Buffer.from(p, "base64url").toString()); return (c.exp && c.exp < Date.now()/1000) ? null : c; };
const far = Math.floor(Date.now()/1000) + 3600*24;
const ANON = sign({ role:"anon", iss:"local", exp:far }), SERVICE = sign({ role:"service_role", iss:"local", exp:far });
const ADMIN_PASSWORD = "local-" + crypto.randomBytes(6).toString("hex");
const ENV = {
  SUPABASE_URL:"http://127.0.0.1:" + GW, SUPABASE_ANON_KEY:ANON, SUPABASE_SERVICE_KEY:SERVICE,
  STOREWAY_ACCOUNTS_OPEN:"1", STOREWAY_INTAKE_OPEN:"quote", ADMIN_PASSWORD,
  VERCEL_ENV:"preview"            /* 운영(production) 이 아님 — 알림 · 조회 어댑터가 운영 쪽으로 가지 않게 */
};
/* 알림 · 메일 · cron 변수는 일부러 비웁니다 (실제 채널로 나가지 않게) */
for(const k of ["INTAKE_WEBHOOK_URL","DEAL_WEBHOOK_URL","RESEND_API_KEY","CUSTOMER_EMAIL_FROM","PARTNER_EMAIL_FROM","INTAKE_EMAIL_TO","CRON_SECRET","INTAKE_BUCKET"]) delete process.env[k];
/* 2026-11-23 — LOCAL_NOTIFY=1 이면 알림을 **이 컨테이너 안의 시험 수신처**(127.0.0.1:8972)로만 보냅니다.
   슬랙 · 메일 등 바깥으로는 나가지 않습니다. 받은 것은 out/local-stack/hooks.jsonl 에 줄마다 적고,
   out/local-stack/hook-fail 파일이 있으면 500 으로 실패를 흉내 냅니다(재시도 검수용).
   ⚠️ 운영 · Preview 에는 영향이 없습니다 — 이 도구 안에서만 정하는 값입니다. */
const HOOK = 8972, LOCAL_NOTIFY = process.env.LOCAL_NOTIFY === "1";
if(LOCAL_NOTIFY){
  ENV.INTAKE_WEBHOOK_URL = "http://127.0.0.1:" + HOOK + "/intake";
  ENV.DEAL_WEBHOOK_URL   = "http://127.0.0.1:" + HOOK + "/deal";
  ENV.CRON_SECRET        = "local-cron-" + crypto.randomBytes(8).toString("hex");
  const HOOKS = path.join(OUT, "hooks.jsonl"); fs.writeFileSync(HOOKS, "");
  http.createServer((req, res) => { let body = ""; req.on("data", d => body += d); req.on("end", () => {
    const fail = fs.existsSync(path.join(OUT, "hook-fail"));
    fs.appendFileSync(HOOKS, JSON.stringify({ at:Date.now(), path:req.url, fail, body }) + "\n");
    res.writeHead(fail ? 500 : 200, { "content-type":"application/json" }); res.end(fail ? '{"ok":false}' : '{"ok":true}'); }); })
    .listen(HOOK, "127.0.0.1");
}
Object.assign(process.env, ENV);
fs.writeFileSync(path.join(OUT, "env.json"), JSON.stringify(Object.assign({ APP:"http://127.0.0.1:" + APP }, ENV), null, 1));

/* ── Postgres ─────────────────────────────────────────────── */
function findBin(){ for(const d of ["/usr/lib/postgresql/16/bin","/usr/lib/postgresql/15/bin"]) if(fs.existsSync(d + "/initdb")) return d;
  return path.dirname(execSync("which initdb").toString().trim()); }
const BIN = findBin(), DIR = fs.mkdtempSync(path.join(os.tmpdir(), "swlocal-"));
const sh = c => execSync(c, { stdio:["ignore","pipe","pipe"] }).toString();
const asPg = (() => { try{ sh("id postgres"); return true; }catch(e){ return false; } })();
const pre = (asPg && sh("id -un").trim() === "root") ? "su postgres -c " : "";
const q = s => pre ? ("'" + s.replace(/'/g, "'\\''") + "'") : s;
function psql(sql){ return execFileSync(BIN + "/psql", ["-h","127.0.0.1","-p",String(PGPORT),"-U","postgres","-d","postgres","-t","-A","-v","ON_ERROR_STOP=1","-c",sql], { stdio:["ignore","pipe","pipe"] }).toString().trim(); }
function file(f){ execFileSync(BIN + "/psql", ["-h","127.0.0.1","-p",String(PGPORT),"-U","postgres","-d","postgres","-q","-v","ON_ERROR_STOP=1","-f",path.join(ROOT, f)], { stdio:["ignore","pipe","pipe"] }); }
let pgUp = false, restId = "";
function cleanup(){
  if(restId) try{ sh("docker rm -f " + restId); }catch(e){}
  if(pgUp) try{ sh(pre + q(BIN + "/pg_ctl -D " + DIR + "/data stop -m immediate")); }catch(e){}
  try{ fs.rmSync(DIR, { recursive:true, force:true }); }catch(e){}
}
process.on("SIGINT", () => { cleanup(); process.exit(0); }); process.on("SIGTERM", () => { cleanup(); process.exit(0); });

function startDb(){
  if(pre) sh("chown -R postgres:postgres " + DIR);
  sh(pre + q(BIN + "/initdb -D " + DIR + "/data -A trust -U postgres"));
  sh(pre + q(BIN + "/pg_ctl -D " + DIR + "/data -l " + DIR + "/log -o \"-p " + PGPORT + " -h 127.0.0.1 -k " + DIR + "\" start -w"));
  pgUp = true;
  psql("create extension if not exists pgcrypto");
  file("db/test/00_stub_auth.sql");
  /* 운영 Supabase 와 같은 auth.uid() — PostgREST 가 넣는 request.jwt.claims 를 읽습니다 (운영 정의를 읽어 맞춤) */
  psql("create or replace function auth.uid() returns uuid language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''), (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'))::uuid $$");
  const migs = fs.readdirSync(path.join(ROOT, "db/migrations")).filter(f => /^\d{4}_.*\.sql$/.test(f) && !/_down\.sql$/.test(f)).sort();
  for(const m of migs) file("db/migrations/" + m);
  /* PostgREST 가 붙는 역할 — Supabase 와 같은 짜임 */
  psql("alter role service_role bypassrls");
  /* 2026-11-23 — Supabase 는 service_role 에 public 표 전부의 권한을 **기본으로** 줍니다(운영 · 시험 프로젝트에서
     has_table_privilege 로 확인). 이 스택은 그걸 안 만들어서 알림 재시도(api/notify-retry.js)가 request_item 을
     못 읽고 실패했습니다 — 코드가 아니라 스택의 차이라 여기서 맞춥니다. */
  psql("grant usage on schema public to service_role");
  psql("grant select, insert, update, delete on all tables in schema public to service_role");
  psql("grant usage, select on all sequences in schema public to service_role");
  psql("do $$ begin if not exists (select 1 from pg_roles where rolname='authenticator') then create role authenticator login noinherit; end if; end $$");
  psql("grant anon, authenticated, service_role to authenticator");
  psql("alter table auth.users add column if not exists created_at timestamptz default now()");
  console.log("  DB 판 " + psql("select max(n) from schema_version") + " · 마이그레이션 " + migs.length + "개");
}

function startRest(){
  restId = sh("docker run -d --rm --network host -e PGRST_DB_URI=postgres://authenticator@127.0.0.1:" + PGPORT + "/postgres" +
    " -e PGRST_DB_SCHEMAS=public -e PGRST_DB_ANON_ROLE=anon -e PGRST_JWT_SECRET=" + SECRET +
    " -e PGRST_SERVER_PORT=" + RESTPORT + " postgrest/postgrest:v12.2.12").trim();
  for(let i = 0; i < 40; i++){ try{ sh("curl -s -o /dev/null -w '%{http_code}' --noproxy '*' http://127.0.0.1:" + RESTPORT + "/"); return; }catch(e){} execSync("sleep 0.5"); }
  throw new Error("PostgREST 가 안 떴습니다");
}

/* ── 게이트웨이 (REST 프록시 + 인증 대역) ───────────────────────── */
const links = {}, refresh = {};
function userRow(where){ const r = psql("select row_to_json(u) from (select id, email, coalesce(raw_user_meta_data,'{}'::jsonb) as user_metadata from auth.users where " + where + " limit 1) u"); return r ? JSON.parse(r) : null; }
const lit = s => "'" + String(s).replace(/'/g, "''") + "'";
function session(u){ const now = Math.floor(Date.now()/1000);
  const at = sign({ sub:u.id, email:u.email, role:"authenticated", aud:"authenticated", iat:now, exp:now + 3600 });
  const rt = crypto.randomBytes(16).toString("hex"); refresh[rt] = u.id;
  return { access_token:at, token_type:"bearer", expires_in:3600, expires_at:now + 3600, refresh_token:rt, user:u }; }
function body(req){ return new Promise(r => { let d = ""; req.on("data", c => d += c); req.on("end", () => { try{ r(d ? JSON.parse(d) : {}); }catch(e){ r({}); } }); }); }
function send(res, code, obj){ res.writeHead(code, { "content-type":"application/json" }); res.end(obj === undefined ? "" : JSON.stringify(obj)); }
function claimsOf(req){ const a = String(req.headers.authorization || "").replace(/^Bearer /, ""); return verify(a); }

http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  if(u.pathname.startsWith("/rest/v1")){
    const hdr = Object.assign({}, req.headers); delete hdr.host;
    if(!hdr.authorization && hdr.apikey) hdr.authorization = "Bearer " + hdr.apikey;
    const pr = http.request({ host:"127.0.0.1", port:RESTPORT, method:req.method, path:u.pathname.slice(8) + u.search, headers:hdr }, r2 => {
      res.writeHead(r2.statusCode, r2.headers); r2.pipe(res); });
    pr.on("error", e => send(res, 502, { message:e.message })); req.pipe(pr); return;
  }
  if(!u.pathname.startsWith("/auth/v1")) return send(res, 404, { message:"not found" });
  const p = u.pathname.slice(8), c = claimsOf(req), b = await body(req);
  const isService = c && c.role === "service_role";
  if(p === "/user" && req.method === "GET"){ if(!c || !c.sub) return send(res, 401, { message:"invalid token" }); const x = userRow("id = " + lit(c.sub)); return x ? send(res, 200, x) : send(res, 401, { message:"no user" }); }
  if(p === "/admin/users" && req.method === "POST"){ if(!isService) return send(res, 403, {});
    if(userRow("email = " + lit(b.email))) return send(res, 422, { msg:"already registered" });
    psql("insert into auth.users (email) values (" + lit(b.email) + ")"); return send(res, 200, userRow("email = " + lit(b.email))); }
  if(p === "/admin/generate_link" && req.method === "POST"){ if(!isService) return send(res, 403, {});
    const x = userRow("email = " + lit(b.email)); if(!x) return send(res, 404, { msg:"user not found" });
    const t = crypto.randomBytes(16).toString("hex"); links[t] = x.id; return send(res, 200, { hashed_token:t, properties:{ hashed_token:t } }); }
  if(p === "/verify" && req.method === "POST"){ const id = links[b.token_hash]; delete links[b.token_hash];
    if(!id) return send(res, 403, { msg:"invalid link" }); return send(res, 200, session(userRow("id = " + lit(id)))); }
  if(p === "/token" && u.searchParams.get("grant_type") === "refresh_token"){ const id = refresh[b.refresh_token];
    if(!id) return send(res, 400, { msg:"invalid refresh" }); return send(res, 200, session(userRow("id = " + lit(id)))); }
  if(p === "/otp") return send(res, 200, {});          /* 메일을 보내지 않습니다 */
  if(p === "/logout") return send(res, 204);
  return send(res, 404, { message:"auth stand-in: " + p });
}).listen(GW, "127.0.0.1");

/* ── 앱 (배포본 + Vercel 함수 흉내 + /admin 기본 인증) ─────────────── */
const PUB = path.join(ROOT, "restore-public");
const MIME = { ".html":"text/html; charset=utf-8", ".js":"text/javascript", ".css":"text/css", ".json":"application/json", ".png":"image/png", ".jpg":"image/jpeg", ".webp":"image/webp", ".svg":"image/svg+xml", ".ico":"image/x-icon", ".xml":"application/xml", ".txt":"text/plain" };
function staticFile(p){
  const clean = decodeURIComponent(p).replace(/\.\.+/g, "");
  for(const c of [clean, clean + ".html", path.join(clean, "index.html")]){
    const f = path.join(PUB, c); if(f.startsWith(PUB) && fs.existsSync(f) && fs.statSync(f).isFile()) return f; }
  return null;
}
function adminOk(req){ const a = String(req.headers.authorization || ""); if(!a.startsWith("Basic ")) return false;
  const d = Buffer.from(a.slice(6), "base64").toString(); return d.slice(d.indexOf(":") + 1) === ADMIN_PASSWORD; }
http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  if(["/admin","/admin.html","/api/admin-health"].includes(u.pathname) && !adminOk(req)){
    res.writeHead(401, { "www-authenticate":'Basic realm="admin"' }); return res.end("Authentication required"); }
  const m = /^\/api\/([a-z-]+)$/.exec(u.pathname);
  if(m){
    const f = path.join(ROOT, "api", m[1] + ".js"); if(!fs.existsSync(f)) return send(res, 404, { error:"no api" });
    const raw = await new Promise(r => { let d = ""; req.on("data", c => d += c); req.on("end", () => r(d)); });
    let parsed = raw; try{ parsed = raw ? JSON.parse(raw) : undefined; }catch(e){}
    const rq = { method:req.method, headers:req.headers, url:req.url, query:Object.fromEntries(u.searchParams), body:parsed };
    let code = 200; const hd = {};
    const rs = { status(c){ code = c; return rs; }, setHeader(k, v){ hd[k] = v; return rs; }, getHeader(k){ return hd[k]; },
      json(o){ res.writeHead(code, Object.assign({ "content-type":"application/json" }, hd)); res.end(JSON.stringify(o)); return rs; },
      send(s){ res.writeHead(code, hd); res.end(typeof s === "string" ? s : JSON.stringify(s)); return rs; },
      end(s){ res.writeHead(code, hd); res.end(s); return rs; } };
    try{ await require(f)(rq, rs); }catch(e){ console.error("[api " + m[1] + "]", e.message); if(!res.headersSent) send(res, 500, { error:"local runner" }); }
    return;
  }
  const f = staticFile(u.pathname === "/" ? "/index.html" : u.pathname);
  if(!f){ const nf = path.join(PUB, "404.html"); res.writeHead(404, { "content-type":"text/html; charset=utf-8" }); return res.end(fs.existsSync(nf) ? fs.readFileSync(nf) : "404"); }
  /* ⚠️ 로컬 시험 전용 덮어쓰기 — 화면 쪽 접수 스위치(WOW_BIZ.sosReady)를 이 서버가 내보낼 때만 켭니다.
     저장소 파일은 그대로입니다 (운영 · Preview 에서는 코드의 값이 그대로 나갑니다). */
  if(/\/js\/data\/site\.js$/.test(f)){
    const src = fs.readFileSync(f, "utf8").replace(/sosReady\s*:\s*false/, "sosReady:true");
    res.writeHead(200, { "content-type":"text/javascript" }); return res.end(src);
  }
  res.writeHead(200, { "content-type":MIME[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res);
}).listen(APP, "127.0.0.1");

try{
  console.log("▶ 로컬 시험 스택");
  if(!fs.existsSync(PUB)) execSync("node build-pages.js && node tools/make-restore-public.js", { cwd:ROOT, stdio:"ignore" });
  startDb(); startRest();
  console.log("  PostgREST :" + RESTPORT + " · 게이트웨이 :" + GW + " · 앱 http://127.0.0.1:" + APP);
  console.log("  값 → out/local-stack/env.json (로컬 시험값) · " + (LOCAL_NOTIFY ? "알림 → 로컬 시험 수신처 :" + HOOK + " (바깥으로 안 나감)" : "알림 · 메일 변수는 비워 둠"));
  fs.writeFileSync(path.join(OUT, "ready"), String(Date.now()));
}catch(e){ console.error("⛔ " + (e.stderr ? String(e.stderr).split("\n").find(l => /ERROR|error/.test(l)) : e.message)); cleanup(); process.exit(1); }
