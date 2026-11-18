/* W03 — 관리자 접수함 · 고객 본인 조회를 로컬 임시 Postgres 에서만 눌러 봅니다 (운영 DB 를 쓰지 않습니다).
   0001~0019 위에 0082 를 올리고 submit_intake / submit_apply / mark_notify /
   due_notify 를 합성 자료로 부릅니다. Postgres 가 없으면 통과로 치지 않고
   exit 2 로 끝냅니다. */
const fs = require("fs"), os = require("os"), path = require("path");
const { execSync, execFileSync } = require("child_process");
const ROOT = path.resolve(__dirname, "..");
let pass = 0, bad = 0;
function ok(c, n, got){ if(c){ pass++; console.log("  ✅ " + n); } else { bad++; console.log("  ❌ " + n + (got !== undefined ? "  →  " + String(got).slice(0, 300) : "")); } }

function findBin(){
  for(const d of ["/usr/lib/postgresql/16/bin", "/usr/lib/postgresql/15/bin"])
    if(fs.existsSync(path.join(d, "initdb"))) return d;
  try{ return path.dirname(execSync("which initdb").toString().trim()); }catch(e){ return ""; }
}
const BIN = findBin();
if(!BIN){ console.log("⚠️ Postgres 가 없어 돌리지 못했습니다 — 통과로 치지 않습니다"); process.exit(2); }
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), "sww03-"));
const PORT = 5600 + (process.pid % 150);
const sh = c => execSync(c, { stdio:["ignore","pipe","pipe"] }).toString();
const asPg = (() => { try{ sh("id postgres"); return true; }catch(e){ return false; } })();
const pre = (asPg && sh("id -un").trim() === "root") ? "su postgres -c " : "";
const q = s => pre ? ("'" + s.replace(/'/g, "'\\''") + "'") : s;
let started = false;
function start(){
  if(pre) sh("chown -R postgres:postgres " + DIR);
  sh(pre + q(BIN + "/initdb -D " + DIR + "/data -A trust -U postgres"));
  sh(pre + q(BIN + "/pg_ctl -D " + DIR + "/data -l " + DIR + "/log -o \"-p " + PORT + " -k " + DIR + "\" start -w"));
  started = true;
}
function stop(){ if(started) try{ sh(pre + q(BIN + "/pg_ctl -D " + DIR + "/data stop -m immediate")); }catch(e){} try{ fs.rmSync(DIR, { recursive:true, force:true }); }catch(e){} }
function psql(sql){
  const out = execFileSync(path.join(BIN, "psql"), ["-h", DIR, "-p", String(PORT), "-U", "postgres", "-d", "w03",
    "-t", "-A", "-v", "ON_ERROR_STOP=1", "-c", sql], { stdio:["ignore","pipe","pipe"] }).toString();
  const v = out.split("\n").map(x => x.trim()).filter(Boolean)
    .filter(x => !/^(SET|SELECT \d+|UPDATE \d+|INSERT \d+|DELETE \d+|BEGIN|COMMIT|ROLLBACK)$/.test(x));
  return v.length ? v[v.length - 1] : "";
}
function file(f){ execFileSync(path.join(BIN, "psql"), ["-h", DIR, "-p", String(PORT), "-U", "postgres", "-d", "w03",
  "-q", "-v", "ON_ERROR_STOP=1", "-f", path.join(ROOT, f)], { stdio:["ignore","pipe","pipe"] }); }
function err(sql){ try{ psql(sql); return ""; }catch(e){ return String(e.stderr || e.message).split("\n")[0]; } }
const lit = o => "'" + JSON.stringify(o).replace(/'/g, "''") + "'::jsonb";

const CONSENT = { notice_ver: "quote-2026-11-18", items: "성함 · 연락처 · 지역 · 적어 주신 내용",
  purpose: "견적 요청 접수와 상담 안내", keep: "검사용 보유기간" };
function intake(extra){
  return Object.assign({ no: "SW-T" + Math.random().toString(36).slice(2, 8).toUpperCase(),
    form: "quote", name: "합성 고객", tel: "010-0000-0000", region: "서울", cat: "interior",
    body: "합성 요청 — 검사용", consent: CONSENT }, extra || {});
}

const crypto = require("crypto");
const H = s => crypto.createHash("sha256").update(s).digest("hex");
const CUST = "11111111-1111-1111-1111-111111111111", STAFF = "44444444-4444-4444-4444-444444444444",
      ADMIN = "55555555-5555-5555-5555-555555555555", CUST2 = "22222222-2222-2222-2222-222222222222";
const as = (u, sql) => psql("set role authenticated; select become('" + u + "'); " + sql);
const asErr = (u, sql) => err("set role authenticated; select become('" + u + "'); " + sql);
const svc = sql => psql("set role service_role; " + sql);

(async () => {
try{
  start();
  execFileSync(path.join(BIN, "createdb"), ["-h", DIR, "-p", String(PORT), "-U", "postgres", "w03"]);
  psql("create extension if not exists pgcrypto");
  file("db/test/00_stub_auth.sql");
  const migs = fs.readdirSync(path.join(ROOT, "db/migrations")).filter(f => /^\d{4}_.*\.sql$/.test(f) && !/_down\.sql$/.test(f)).sort();
  for(const m of migs) file("db/migrations/" + m);
  const top = String(Math.max.apply(null, migs.map(m => parseInt(m, 10))));
  ok(psql("select max(n) from schema_version") === top, "마이그레이션이 끝까지 올라감 (판 " + top + ")");
  file("db/migrations/0083_storeway_inbox_lookup.sql");
  ok(true, "0083 을 두 번 붙여 넣어도 멈추지 않음");

  for(const [u, r] of [[CUST,"customer"],[CUST2,"customer"],[STAFF,"staff"],[ADMIN,"admin"]]){
    psql("insert into auth.users (id) values ('" + u + "') on conflict do nothing");
    psql("insert into account (id, role) values ('" + u + "','" + r + "') on conflict (id) do update set role='" + r + "'");
  }
  /* 합성 신청 둘 — 같은 번호로 (중복 후보) · 서비스 둘 */
  const A = intake({ no:"SW-AAAA-0001", tel:"010-1234-5678", items:[{ id:"interior" }, { id:"demolish" }], idem:"k-a" });
  const B = intake({ no:"SW-BBBB-0002", tel:"01012345678", items:[{ id:"clean" }], idem:"k-b" });
  const C = intake({ no:"SW-CCCC-0003", tel:"010-9999-0000", items:[{ id:"it" }], idem:"k-c" });
  for(const x of [A, B, C]) psql("select submit_intake(" + lit(x) + ")");
  const idA = psql("select id from request where no='SW-AAAA-0001'");
  const idB = psql("select id from request where no='SW-BBBB-0002'");
  const idC = psql("select id from request where no='SW-CCCC-0003'");

  console.log("\n▶ 관리자 목록 — 마스킹 · 중복 후보 · 알림 실패 · 서비스 · 상태 모으기");
  psql("update notify_job set status='failed', last_error='E_TEST' where request_id='" + idA + "'");
  const f = JSON.parse(as(STAFF, "select json_agg(row_to_json(t)) from admin_inbox_flags(array['" + idA + "','" + idC + "']::uuid[]) t"));
  const fa = f.find(x => x.id === idA), fc = f.find(x => x.id === idC);
  ok(fa.tel_mask === "010-****-5678", "연락처는 가려서 (010-****-5678)", fa.tel_mask);
  ok(!JSON.stringify(f).includes("1234"), "목록 답에 가운데 번호가 없음");
  ok(fa.dup_count === 1 && fc.dup_count === 0, "같은 번호(하이픈 무관) 다른 신청 → 중복 후보 1", JSON.stringify([fa.dup_count, fc.dup_count]));
  ok(fa.notify_failed === true && fc.notify_failed === false, "알림 실패 표시", JSON.stringify([fa.notify_failed, fc.notify_failed]));
  ok(fa.services.join() === "interior,demolish", "서비스 ID 그대로 (이름이 아니라 stable ID)", fa.services);
  ok(/직원 · 관리자만/.test(asErr(CUST, "select * from admin_inbox_flags(array['" + idA + "']::uuid[])")), "고객은 목록 표시를 못 부름");

  console.log("\n▶ T09 상태 모으기 — 한 서비스가 끝나도 전체가 끝나지 않음");
  psql("update request_item set state='done' where request_id='" + idA + "' and service_id='interior'");
  let ru = JSON.parse(svc("select request_rollup('" + idA + "')"));
  ok(ru.phase === "open" && ru.done === 1 && ru.open === 1, "하나 완료 · 하나 진행 → open (완료 1 · 열림 1)", JSON.stringify(ru));
  psql("update request_item set state='lost' where request_id='" + idA + "' and service_id='demolish'");
  ru = JSON.parse(svc("select request_rollup('" + idA + "')"));
  ok(ru.phase === "done", "하나 완료 · 하나 취소 → done", JSON.stringify(ru));
  psql("update request_item set state='hold' where request_id='" + idA + "' and service_id='demolish'");
  ru = JSON.parse(svc("select request_rollup('" + idA + "')"));
  ok(ru.phase === "hold", "남은 하나가 보류 → hold (완료로 덮지 않음)", JSON.stringify(ru));
  psql("update request_item set state='consult' where request_id='" + idA + "' and service_id='demolish'");
  ok(/permission denied/.test(asErr(STAFF, "select request_rollup('" + idA + "')")), "모으기 함수는 서버만 직접 부름");

  console.log("\n▶ 기한 · 메모 · 연락 기록 · 고객 공개 안내");
  as(STAFF, "select set_next_due('" + idA + "', '2026-11-20T09:00:00+09'::timestamptz, '전화 약속')");
  ok(psql("select to_char(next_due at time zone 'Asia/Seoul','YYYY-MM-DD HH24') from request where id='" + idA + "'") === "2026-11-20 09", "다음 행동 기한 저장 (한국시간 09시)");
  ok(/직원 · 관리자만/.test(asErr(CUST, "select set_next_due('" + idA + "', now(), null)")), "고객은 기한을 못 정함");
  as(STAFF, "select add_request_note('" + idA + "','memo','내부 메모 — 김사장님 오후 선호')");
  as(STAFF, "select add_request_note('" + idA + "','contact','첫 통화 시도', null, 'no_answer')");
  as(STAFF, "select add_request_note('" + idA + "','public','담당자가 확인하고 있습니다. 조건이 맞는 업체를 찾는 중입니다.')");
  ok(/연락 결과를 골라/.test(asErr(STAFF, "select add_request_note('" + idA + "','contact','x')")), "연락 기록은 결과가 있어야 함");
  ok(/메모는 직원/.test(asErr(CUST, "select add_request_note('" + idA + "','public','x')")), "고객은 메모를 못 적음");
  ok(/이 신청의 서비스가 아닙니다/.test(asErr(STAFF, "select add_request_note('" + idA + "','memo','x', (select id from request_item where request_id='" + idC + "' limit 1))")), "다른 신청의 서비스에 메모를 못 붙임");
  ok(as(CUST, "select count(*) from request_note") === "0", "고객은 메모 표를 못 읽음 (0줄)");
  ok(as(STAFF, "select count(*) from request_note where request_id='" + idA + "'") === "3", "직원은 세 가지를 다 봄");
  ok(/permission denied/.test(asErr(STAFF, "update request_note set body='x'")) && /permission denied/.test(asErr(STAFF, "delete from request_note")),
     "메모는 고치거나 지울 수 없음 (기록)");
  const au = psql("select coalesce(json_agg(data)::text,'') from audit_log where obj_id='" + idA + "' and to_state like 'note:%'");
  ok(!au.includes("김사장") && !au.includes("첫 통화"), "감사 기록에 메모 본문이 없음");
  ok(psql("select count(*) from audit_log where obj_id='" + idA + "' and to_state='note:public'") === "1", "공개 안내도 기록에 남음 (공개 표시)");

  console.log("\n▶ T08 본인 조회 — 번호+전화만으로 안 열림 · 인증번호 · 만료 · 재사용 · 반복 시도");
  ok(/permission denied/.test(err("set role anon; select lookup_start('SW-AAAA-0001','01012345678','" + H("x") + "')")) &&
     /permission denied/.test(asErr(CUST, "select lookup_read('" + H("y") + "')")), "조회 함수는 서버만 부름 (anon · 회원 직접 불가)");
  ok(/permission denied/.test(asErr(CUST, "select count(*) from lookup_session")), "조회 토큰 표는 아무도 직접 못 읽음");
  let st = JSON.parse(svc("select lookup_start('sw-aaaa-0001','010-1234-5678','" + H("123456|s1") + "')"));
  ok(st.send === true && st.challenge && st.dest === "010-1234-5678", "번호+전화가 맞으면 보낼 곳이 나옴 (서버에서만)", JSON.stringify(st));
  const bad = JSON.parse(svc("select lookup_start('SW-AAAA-0001','010-0000-1111','" + H("999999|s2") + "')"));
  ok(bad.send === false && bad.challenge && !bad.dest && Object.keys(bad).sort().join() === Object.keys(st).sort().join(),
     "전화가 안 맞아도 같은 모양의 답 (가짜 도전 · 안 보냄)", JSON.stringify(bad));
  ok(svc("select lookup_read('" + H("nothing") + "')") === "", "토큰 없이는 아무것도 안 열림");
  let v = JSON.parse(svc("select lookup_verify('" + bad.challenge + "','" + H("999999|s2") + "','" + H("tok-bad") + "')"));
  ok(v.ok === false, "가짜 도전은 맞는 번호를 적어도 안 열림", JSON.stringify(v));
  for(let i = 0; i < 5; i++) v = JSON.parse(svc("select lookup_verify('" + st.challenge + "','" + H("000000|s1") + "','" + H("t" + i) + "')"));
  v = JSON.parse(svc("select lookup_verify('" + st.challenge + "','" + H("123456|s1") + "','" + H("tok-1") + "')"));
  ok(v.ok === false && v.why === "locked", "다섯 번 틀리면 맞는 번호도 막힘 (추측 차단)", JSON.stringify(v));
  st = JSON.parse(svc("select lookup_start('SW-AAAA-0001','01012345678','" + H("654321|s3") + "')"));
  v = JSON.parse(svc("select lookup_verify('" + st.challenge + "','" + H("654321|s3") + "','" + H("tok-2") + "')"));
  ok(v.ok === true, "맞는 인증번호 → 조회 토큰", JSON.stringify(v));
  v = JSON.parse(svc("select lookup_verify('" + st.challenge + "','" + H("654321|s3") + "','" + H("tok-3") + "')"));
  ok(v.ok === false && v.why === "used", "같은 인증번호 다시 쓰기 → 막힘 (재사용 방지)", JSON.stringify(v));
  const rd = JSON.parse(svc("select lookup_read('" + H("tok-2") + "')"));
  ok(rd && rd.no === "SW-AAAA-0001" && rd.items.length === 2 && rd.rollup.phase === "open", "조회 — 번호 · 서비스별 상태 · 모은 상태", JSON.stringify(rd).slice(0, 200));
  const rs = JSON.stringify(rd);
  ok(!rs.includes("합성 고객") && !rs.includes("1234") && !rs.includes("합성 요청") && !rs.includes("김사장") && !rs.includes("첫 통화"),
     "조회에 성함 · 연락처 · 원문 · 내부 메모 · 연락 기록이 없음");
  ok(rd.notes.length === 1 && rd.notes[0].body.includes("확인하고 있습니다"), "고객 공개 안내만 나감");
  ok(svc("select lookup_read('" + H("tok-2") + "')::jsonb->>'no'") === "SW-AAAA-0001" &&
     (JSON.parse(svc("select lookup_read('" + H("tok-2") + "')")).no !== "SW-BBBB-0002"), "토큰은 그 신청 하나만 엶 (다른 고객 건 불가)");
  psql("update lookup_session set expires_at = now() - interval '1 second' where token_hash='" + H("tok-2") + "'");
  ok(svc("select lookup_read('" + H("tok-2") + "')") === "", "30분이 지나면 토큰 만료");
  st = JSON.parse(svc("select lookup_start('SW-BBBB-0002','01012345678','" + H("111111|s4") + "')"));
  psql("update lookup_challenge set expires_at = now() - interval '1 second' where id='" + st.challenge + "'");
  v = JSON.parse(svc("select lookup_verify('" + st.challenge + "','" + H("111111|s4") + "','" + H("tok-4") + "')"));
  ok(v.ok === false && v.why === "expired", "10분이 지난 인증번호 → 막힘", JSON.stringify(v));
  for(let i = 0; i < 3; i++) svc("select lookup_start('SW-CCCC-0003','01099990000','" + H("x" + i) + "')");
  st = JSON.parse(svc("select lookup_start('SW-CCCC-0003','01099990000','" + H("x9") + "')"));
  ok(st.send === false && !st.dest, "한 신청에 한 시간 세 번까지 — 넷째는 안 보냄 (같은 모양)", JSON.stringify(st));
  ok(psql("select count(*) from lookup_challenge where code_hash ~ '^[0-9]{6}$'") === "0", "인증번호 원문이 DB 에 없음 (해시만)");
  ok(psql("select count(*) from audit_log where to_state='lookup:verified' and (data::text ~ '1234' or data::text ~ 'tok')") === "0", "조회 기록에 연락처 · 토큰이 없음");

  /* ══ 카카오 간편 로그인 — 같은 카카오 계정이 두 번 가입되지 않는가 (계정 줄 기준) ══
     Supabase 는 (공급자 · 카카오 계정 id) 로 auth.users 한 줄을 들고, 재방문은 그 줄의
     로그인 시각만 갱신합니다 (insert 가 아닙니다). 여기서는 그 모양을 흉내 내어
     저희 쪽(account · 0005 트리거)이 줄을 하나만 만드는지와 역할을 못 올리는지 봅니다.
     ⚠️ Supabase 의 신원 묶기 자체는 실제 Supabase 에서만 확인됩니다 (미검증). */
  console.log("\n▶ 카카오 — 첫 로그인 · 재방문 · 역할");
  const KU = "abcdabcd-0000-4000-8000-000000000001";
  psql("insert into auth.users (id, email, raw_user_meta_data) values ('" + KU + "', null, " +
       lit({ provider:"kakao", sub:"kakao-12345", name:"카카오합성", role:"admin" }) + ")");
  ok(psql("select count(*) from account where id='" + KU + "'") === "1" &&
     psql("select role from account where id='" + KU + "'") === "customer",
     "첫 카카오 로그인 — 계정 한 줄 · 역할은 customer (보낸 role 무시)");
  psql("update auth.users set raw_user_meta_data = " + lit({ provider:"kakao", sub:"kakao-12345", name:"카카오합성", role:"admin" }) + " where id='" + KU + "'");
  ok(psql("select count(*) from account where id='" + KU + "'") === "1" &&
     psql("select role from account where id='" + KU + "'") === "customer",
     "재방문(같은 카카오 계정) — 계정이 늘지 않고 역할도 그대로");
  ok(/duplicate key|unique/.test(err("insert into auth.users (id) values ('" + KU + "')")),
     "같은 회원 id 로 두 번째 가입 줄은 생기지 않음");
  ok(psql("select count(*) from pg_proc p where pronamespace = 'public'::regnamespace and " +
          "(prosrc ~* 'merge_account|link_identity|identities')") === "0",
     "저희 DB 에 이메일로 계정을 합치는 함수가 없음 (검증 안 된 연결을 하지 않음)");

  /* ══ E2E — 합성 신청 1건: API 로 저장 → 관리자 확인 · 공개 안내 → 본인 조회 ══════════
     api/quote.js · api/lookup.js 를 **그대로** 부르고, 그 둘이 PostgREST 로 부르는
     /rest/v1/rpc/<함수> 를 이 로컬 Postgres 에서 service_role 로 실행해 돌려줍니다.
     (PostgREST 자체는 흉내입니다 — 운영 Supabase 를 거친 확인은 미검증입니다.) */
  console.log("\n▶ E2E — 접수 API → 관리자 → 본인 조회 API (로컬 Postgres)");
  const ENVK = ["STOREWAY_INTAKE_OPEN","SUPABASE_URL","SUPABASE_SERVICE_KEY","LOOKUP_OTP_ADAPTER","INTAKE_WEBHOOK_URL","VERCEL_ENV","LOOKUP_HMAC_KEY"];
  const keepEnv = {}; ENVK.forEach(k => { keepEnv[k] = process.env[k]; delete process.env[k]; });
  Object.assign(process.env, { STOREWAY_INTAKE_OPEN:"quote", SUPABASE_URL:"https://db.test", SUPABASE_SERVICE_KEY:"svc-test",
    LOOKUP_OTP_ADAPTER:"test", INTAKE_WEBHOOK_URL:"https://hook.test/x" });
  const out = []; const realFetch = global.fetch;
  const reply = (st, obj) => ({ ok: st < 300, status: st, headers:{ get: () => null },
    text: async () => obj === undefined || obj === null ? "" : JSON.stringify(obj), json: async () => obj });
  global.fetch = async (url, opt) => {
    const u = String(url), m = u.match(/\/rest\/v1\/rpc\/([a-z_]+)$/);
    if(m){
      const a = JSON.parse((opt && opt.body) || "{}");
      const parts = Object.keys(a).map(k => k + " := " + (a[k] === null ? "null" :
        typeof a[k] === "object" ? lit(a[k]) : "'" + String(a[k]).replace(/'/g, "''") + "'"));
      try{ const v = psql("set role service_role; select " + m[1] + "(" + parts.join(", ") + ")");
           let d = null; if(v !== ""){ try{ d = JSON.parse(v); }catch(_){ d = v; } }
           return reply(200, d); }
      catch(e){ return reply(400, { message: String(e.stderr || e.message).split("\n")[0] }); }
    }
    if(/\/rest\/v1\/request\?/.test(u)) return reply(200, []);
    out.push(u); return reply(200, {});
  };
  const fresh = n => { Object.keys(require.cache).forEach(k => { if(k.indexOf(path.join(ROOT, "api") + path.sep) === 0) delete require.cache[k]; });
                       return require(path.join(ROOT, "api", n)); };
  const R = (body, h) => ({ method:"POST", body, headers: Object.assign({ origin:"https://storeway.co.kr", host:"storeway.co.kr" }, h || {}) });
  const S = () => { const r = { code:0, body:null, headers:{} }; r.status = c => (r.code = c, r);
                    r.json = b => (r.body = b, r); r.setHeader = (k, v) => { r.headers[k.toLowerCase()] = v; }; return r; };
  const Q = { kind:"quote", name:"합성고객E2E", tel:"010-7777-3333", region:"서울", q:"원문 비밀 XYZ789",
    items:[{ id:"interior" }, { id:"demolish" }], agree:true, idem:"e2e-1" };
  let r = S(); await fresh("quote.js")(R(Q), r);
  ok(r.code === 200 && /^SW-/.test(r.body.no), "접수 API — 200 과 접수번호 (저장 뒤)", JSON.stringify(r.body));
  const no = r.body.no;
  ok(psql("select count(*) from request where no='" + no + "'") === "1" &&
     psql("select count(*) from request_item i join request q on q.id=i.request_id where q.no='" + no + "'") === "2",
     "T02 — 부모 요청 1 · 서비스별 하위 요청 2 저장");
  ok(psql("select string_agg(status, ',') from notify_job j join request q on q.id=j.request_id where q.no='" + no + "'") === "sent",
     "T05 — 저장 뒤 운영자 알림 작업이 보냄으로 기록됨 (개인정보 없는 웹훅)");
  ok(out.length >= 1 && !out.join("").includes("7777"), "웹훅 주소 외에 연락처가 URL 에 안 실림");
  r = S(); await fresh("quote.js")(R(Q), r);
  ok(r.code === 200 && r.body.no === no && psql("select count(*) from request where idem='e2e-1'") === "1", "T03 — 같은 키로 다시 보내도 한 건", JSON.stringify(r.body));
  const idE = psql("select id from request where no='" + no + "'");
  const fe = JSON.parse(as(STAFF, "select json_agg(row_to_json(t)) from admin_inbox_flags(array['" + idE + "']::uuid[]) t"))[0];
  ok(fe.tel_mask === "010-****-3333" && fe.services.join() === "interior,demolish" && fe.form === "quote",
     "관리자 — 목록 표시로 확인 (가린 번호 · 서비스 · 종류)", JSON.stringify(fe));
  as(STAFF, "select add_request_note('" + idE + "','public','접수를 확인했습니다. 담당자가 조건을 보고 있습니다.')");
  as(STAFF, "select add_request_note('" + idE + "','memo','내부용 — 고객 성향 메모')");

  const LK = fresh("lookup.js");
  r = S(); await LK(R({ op:"start", no:no.toLowerCase(), tel:"01077773333" }), r);
  ok(r.code === 200 && r.body.challenge && /^[0-9]{6}$/.test(r.body.testCode || ""), "본인 조회 시작 — 시험용 어댑터가 번호를 줌", JSON.stringify(r.body).replace(/"testCode":"\d+"/, '"testCode":"******"'));
  const ch = r.body.challenge, code = r.body.testCode;
  const r2 = S(); await LK(R({ op:"start", no:no, tel:"010-0000-0000" }), r2);
  ok(r2.code === 200 && r2.body.say === r.body.say && !r2.body.testCode && Object.keys(r2.body).sort().join() === "challenge,ok,say",
     "전화가 틀려도 같은 말 · 같은 모양 (안 맞았다고 갈라 말하지 않음)", JSON.stringify(r2.body));
  r = S(); await LK(R({ op:"read" }, { "x-lookup-token": "x".repeat(40) }), r);
  ok(r.code === 401, "토큰 없이(가짜 토큰) 읽기 → 401");
  r = S(); await LK(R({ op:"verify", challenge:ch, no:no, code: code === "000000" ? "000001" : "000000" }), r);
  ok(r.code === 400 && /맞지 않습니다/.test(r.body.error), "틀린 인증번호 → 400", JSON.stringify(r.body));
  r = S(); await LK(R({ op:"verify", challenge:ch, no:no, code:code }), r);
  ok(r.code === 200 && r.body.token, "맞는 인증번호 → 조회 토큰");
  const tok = r.body.token;
  r = S(); await LK(R({ op:"verify", challenge:ch, no:no, code:code }), r);
  ok(r.code === 400 && /이미 쓴/.test(r.body.error), "같은 인증번호 재사용 → 막힘", JSON.stringify(r.body));
  r = S(); await LK(R({ op:"read" }, { "x-lookup-token": tok }), r);
  const dj = JSON.stringify(r.body);
  ok(r.code === 200 && r.body.data.no === no && r.body.data.items.length === 2 && r.body.data.notes.length === 1,
     "본인 조회 — 번호 · 서비스 둘 · 공개 안내 하나", dj.slice(0, 160));
  ok(!dj.includes("합성고객E2E") && !dj.includes("7777") && !dj.includes("XYZ789") && !dj.includes("내부용"),
     "본인 조회에 성함 · 연락처 · 원문 · 내부 메모가 없음");
  ok(psql("select count(*) from lookup_session where token_hash = '" + tok + "'") === "0", "DB 에는 토큰 원문이 없음 (해시만)");

  process.env.VERCEL_ENV = "production";
  r = S(); await fresh("lookup.js")(R({ op:"start", no:no, tel:"01077773333" }), r);
  ok(r.code === 503 && r.body.closed === true && !r.body.testCode, "운영(production)에서는 시험용 어댑터가 막힘 → 503");
  delete process.env.VERCEL_ENV; delete process.env.LOOKUP_OTP_ADAPTER;
  r = S(); await fresh("lookup.js")(R({ op:"start", no:no, tel:"01077773333" }), r);
  ok(r.code === 503, "어댑터가 없으면 503 (열린 척하지 않음)");
  r = S(); await fresh("lookup.js")(R({ op:"start", no:no, tel:"01077773333" }, { origin:"https://evil.example" }), r);
  ok(r.code === 403, "다른 출처 → 403");
  global.fetch = realFetch;
  ENVK.forEach(k => { if(keepEnv[k] === undefined) delete process.env[k]; else process.env[k] = keepEnv[k]; });
}catch(e){
  bad++; console.log("  ❌ 검사가 멈췄습니다 — " + String(e.stderr || e.message).split("\n").slice(0, 3).join(" "));
}finally{
  stop();
}
console.log("\n" + (pass + bad) + "건 중 " + pass + "건 통과 · " + bad + "건 실패");
process.exit(bad ? 1 : 0);
})();
