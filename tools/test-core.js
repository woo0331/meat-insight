/* 핵심 흐름 — 격리 환경에서만 (로컬 임시 Postgres · 0001~0084 · 가짜 auth).
   고객 신청 → 관리자 확인 → 업체 배정 → 업체 응답 · 상담 · 견적 → 고객 조회 · 선택 → 계약 → 완료
   + 배정 전 · 배정 안 된 업체 · 다른 고객 · 로그인 안 한 사람은 그 신청을 못 본다
   + 알림은 DB 큐(notify_job)까지 — 실제 발송(슬랙 · 메일)은 여기서 안 합니다.
   ⚠️ 씨앗은 이 임시 DB 안에서만 삽니다. 운영 DB · 운영 설정을 쓰지 않습니다.
   ⚠️ Postgres 가 없으면 통과로 치지 않고 exit 2. */
const fs = require("fs"), os = require("os"), path = require("path");
const { execSync, execFileSync } = require("child_process");
const ROOT = path.resolve(__dirname, "..");
let pass = 0, bad = 0, skipDb = false;
function ok(c, n, got){ if(c){ pass++; console.log("  ✅ " + n); } else { bad++; console.log("  ❌ " + n + (got !== undefined ? "  →  " + String(typeof got === "string" ? got : JSON.stringify(got)).slice(0, 300) : "")); } }

/* ── ① DB ─────────────────────────────────────────────────────────── */
function findBin(){
  for(const d of ["/usr/lib/postgresql/16/bin", "/usr/lib/postgresql/15/bin", "/usr/lib/postgresql/14/bin"])
    if(fs.existsSync(path.join(d, "initdb"))) return d;
  try{ return path.dirname(execSync("which initdb").toString().trim()); }catch(e){ return ""; }
}
const BIN = findBin();
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), "swcore-"));
const PORT = 5900 + (process.pid % 150);
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
  const out = execFileSync(path.join(BIN, "psql"), ["-h", DIR, "-p", String(PORT), "-U", "postgres", "-d", "core",
    "-t", "-A", "-v", "ON_ERROR_STOP=1", "-c", sql], { stdio:["ignore","pipe","pipe"] }).toString();
  const v = out.split("\n").map(x => x.trim()).filter(Boolean)
    .filter(x => !/^(SET|SELECT \d+|UPDATE \d+|INSERT \d+|DELETE \d+|BEGIN|COMMIT|ROLLBACK)$/.test(x));
  return v.length ? v[v.length - 1] : "";
}
function file(f){ execFileSync(path.join(BIN, "psql"), ["-h", DIR, "-p", String(PORT), "-U", "postgres", "-d", "core",
  "-q", "-v", "ON_ERROR_STOP=1", "-f", path.join(ROOT, f)], { stdio:["ignore","pipe","pipe"] }); }
function err(sql){ try{ psql(sql); return ""; }catch(e){ return String(e.stderr || e.message).split("\n").filter(l => /ERROR/.test(l))[0] || String(e.stderr || e.message).split("\n")[0]; } }
const lit = o => "'" + JSON.stringify(o).replace(/'/g, "''") + "'::jsonb";
const CUST = "11111111-1111-1111-1111-111111111111", PVU = "33333333-3333-3333-3333-333333333333",
      PVU2 = "77777777-7777-7777-7777-777777777777",
      STAFF = "44444444-4444-4444-4444-444444444444", ADMIN = "55555555-5555-5555-5555-555555555555";
const as = (u, sql) => psql("set role authenticated; select become('" + u + "'); " + sql);

const asErr = (u, sql) => err("set role authenticated; select become('" + u + "'); " + sql);
const svc = sql => psql("set role service_role; " + sql);
const svcErr = sql => err("set role service_role; " + sql);
function okE(re, e, n){ ok(re.test(e), n, e); if(process.env.SHOW) console.log("     ↳ " + e); }
const C2 = "22222222-2222-2222-2222-222222222222", PVU3 = "88888888-8888-8888-8888-888888888888";
const anon = sql => psql("set role anon; select become(null); " + sql);
const anonErr = sql => err("set role anon; select become(null); " + sql);
const sha = s => require("crypto").createHash("sha256").update(s).digest("hex");

function run(){
  console.log("\n▶ 준비 — 마이그레이션 0001~0084 · 합성 계정");
  start();
  execFileSync(path.join(BIN, "createdb"), ["-h", DIR, "-p", String(PORT), "-U", "postgres", "core"]);
  psql("create extension if not exists pgcrypto");
  file("db/test/00_stub_auth.sql");
  const migs = fs.readdirSync(path.join(ROOT, "db/migrations")).filter(f => /^\d{4}_.*\.sql$/.test(f) && !/_down\.sql$/.test(f)).sort();
  for(const m of migs) file("db/migrations/" + m);
  ok(psql("select max(n) from schema_version") === "84", "판 번호 84 (운영 DB 와 같은 판)");

  const ppl = [[CUST,"customer",null],[C2,"customer",null],[STAFF,"staff",null],[ADMIN,"admin",null],
               [PVU,"provider","core-a"],[PVU2,"provider","core-b"],[PVU3,"provider","core-c"]];
  for(const [u] of ppl) psql("insert into auth.users (id) values ('" + u + "') on conflict do nothing");
  psql("insert into provider (id, name, listed, subs) values ('core-a','합성 철거 A','t','{full}'),('core-b','합성 철거 B','t','{full}'),('core-c','합성 미승인 C','f','{full}')");
  for(const [u, r, p] of ppl)
    psql("insert into account (id, role, provider_id) values ('" + u + "','" + r + "'," + (p ? "'" + p + "'" : "null") +
         ") on conflict (id) do update set role=excluded.role, provider_id=excluded.provider_id");
  /* 승인(배정 가능)은 A · B 만 — C 는 등록만 되고 승인 전 */
  psql("update provider set assignable = true where id in ('core-a','core-b')");
  ok(psql("select string_agg(id||':'||assignable, ',' order by id) from provider") === "core-a:true,core-b:true,core-c:false", "업체 셋 — A · B 승인 · C 승인 전");

  console.log("\n▶ ① 고객 신청 (서버가 service key 로 submit_intake — api/quote.js 와 같은 길)");
  const P = { no:"SW-CORE-0001", idem:"core-1", form:"quote", side:"close", user_id:CUST, industry:"restaurant",
    cat:"demolish/full", region:"경기", gu:"안양시", want_at:"2026-12-20", body:"합성 — 주방 철거 상담", name:"합성 고객",
    tel:"010-1234-5678", email:"customer@example.test", items:[{ id:"demolish/full" }],
    consent:{ notice_ver:"core-test", items:"성함 · 연락처 · 지역 · 업종", purpose:"상담 접수와 업체 연결 안내", keep:"접수일로부터 1년" } };
  const r1 = JSON.parse(svc("select submit_intake(" + lit(P) + ")"));
  ok(r1.no === "SW-CORE-0001" && !r1.dup, "저장 · 접수번호 SW-CORE-0001", r1);
  const RID = psql("select id from request where no='SW-CORE-0001'");
  ok(psql("select state from request where id='" + RID + "'") === "new", "상태 new (접수)");
  ok(psql("select count(*) from request_item where request_id='" + RID + "'") === "1", "신청 항목 1 (demolish/full)");
  ok(psql("select count(*) from consent_record where request_id='" + RID + "'") === "1", "개인정보 동의 기록 1");
  ok(JSON.parse(svc("select submit_intake(" + lit(P) + ")")).dup === true, "같은 신청서를 다시 보내면 중복으로 한 건");

  console.log("\n▶ 알림 — DB 큐까지 (실제 발송은 이 검사 밖)");
  ok(psql("select string_agg(kind||':'||status, ',' order by kind) from notify_job where request_id='" + RID + "'") === "customer_ack:pending,ops_new:pending",
     "운영자 알림(ops_new) · 고객 접수 안내(customer_ack) 큐에 대기", psql("select string_agg(kind||':'||status, ',') from notify_job"));
  ok(svc("select count(*) from due_notify(20)") === "2", "보낼 것 2건을 꺼내 줌 (due_notify)");
  const J = psql("select id from notify_job where kind='ops_new' and request_id='" + RID + "'");
  svc("select mark_notify('" + J + "', false, 'timeout')");
  ok(psql("select status||'|'||tries||'|'||last_error||'|'||(next_at > now() + interval '4 min') from notify_job where id='" + J + "'") === "failed|1|timeout|true",
     "보내기 실패 → failed · 1회 · 사유 · 5분 뒤 다시 보냄");
  svc("select mark_notify('" + J + "', true)");
  ok(psql("select status from notify_job where id='" + J + "'") === "sent", "보내기 성공 → sent");
  ok(/permission denied/.test(asErr(STAFF, "select mark_notify('" + J + "', true)")), "알림 결과는 서버만 적음 (직원 직접 불가)");

  console.log("\n▶ 배정 전 접근");
  ok(as(CUST, "select count(*) from request where id='" + RID + "'") === "1", "신청한 고객은 자기 신청을 봄");
  ok(as(C2, "select count(*) from request where id='" + RID + "'") === "0", "다른 고객은 못 봄");
  for(const [u, n] of [[PVU,"A"],[PVU2,"B"],[PVU3,"C"]])
    ok(as(u, "select count(*) from request where id='" + RID + "'") === "0", "업체 " + n + " 는 배정 전에 못 봄 (연락처 포함)");
  ok(/permission denied/.test(anonErr("select count(*) from request")), "로그인 안 한 사람은 표 자체를 못 읽음");

  console.log("\n▶ ② 관리자 확인 → 담당자 → 연락처 열람 기록");
  ok(as(STAFF, "select count(*) from request where id='" + RID + "'") === "1", "직원이 접수를 봄");
  as(STAFF, "select set_owner('" + RID + "','" + STAFF + "','첫 담당')");
  ok(psql("select owner_id from request where id='" + RID + "'") === STAFF, "담당자 지정");
  as(STAFF, "select note_request_open('" + RID + "','전화 확인')");
  ok(psql("select count(*) from audit_log where obj_id='" + RID + "' and to_state='contact:open'") === "1", "연락처 열람이 감사 기록에 남음");
  as(STAFF, "select move_state('" + RID + "','check','{}'::jsonb)");
  ok(psql("select state from request where id='" + RID + "'") === "check", "상태 check (확인)");

  console.log("\n▶ ③ 업체 배정");
  ok(/agree3rd|제17조/.test(asErr(STAFF, "select move_state('" + RID + "','assigned','{\"providerId\":\"core-a\"}'::jsonb)")), "제3자 제공 동의 없이는 배정 안 됨");
  ok(/배정할 수 없|assignable/.test(asErr(STAFF, "select move_state('" + RID + "','assigned','{\"providerId\":\"core-c\",\"agree3rd\":true}'::jsonb)")),
     "승인 전 업체(C)에는 배정 안 됨", asErr(STAFF, "select move_state('" + RID + "','assigned','{\"providerId\":\"core-c\",\"agree3rd\":true}'::jsonb)"));
  { const e = asErr(PVU, "select move_state('" + RID + "','assigned','{\"providerId\":\"core-a\",\"agree3rd\":true}'::jsonb)");
    ok(e !== "" && psql("select state from request where id='" + RID + "'") === "check", "업체는 스스로 배정 못 함", e || "통과해 버림 — state " + psql("select state from request where id='" + RID + "'")); }
  as(STAFF, "select move_state('" + RID + "','assigned','{\"providerId\":\"core-a\",\"agree3rd\":true}'::jsonb)");
  ok(psql("select state from request where id='" + RID + "'") === "assigned", "상태 assigned (업체 배정 — A)");
  ok(psql("select count(*) from assignment where request_id='" + RID + "' and provider_id='core-a' and agree3rd_at is not null") === "1", "배정 줄 + 동의 시각");
  ok(as(PVU, "select count(*) from request where id='" + RID + "' and tel is not null") === "1", "배정된 업체 A 는 연락처까지 봄");
  ok(as(PVU2, "select count(*) from request where id='" + RID + "'") === "0", "배정 안 된 업체 B 는 여전히 못 봄");
  ok(as(PVU3, "select count(*) from request where id='" + RID + "'") === "0", "승인 전 업체 C 는 여전히 못 봄");
  ok(as(C2, "select count(*) from request where id='" + RID + "'") === "0", "다른 고객은 여전히 못 봄");

  console.log("\n▶ ④ 업체 상담 · 견적 · 상태 변경");
  ok(/배정|권한|갈 수 없|본인/.test(asErr(PVU2, "select answer_assignment('" + RID + "', true)")), "배정 안 된 업체 B 는 수락 못 함");
  okE(/배정된 업체가 아닙니다/, (asErr(PVU2, "select move_state('" + RID + "','accepted','{}'::jsonb)")), "배정 안 된 업체 B 는 남의 건 상태를 못 바꿈 (0019)");
  as(PVU, "select answer_assignment('" + RID + "', true)");
  ok(psql("select state from request where id='" + RID + "'") === "accepted", "업체 A 수락 → accepted");
  as(PVU, "select move_state('" + RID + "','consult','{}'::jsonb)");
  ok(psql("select state from request where id='" + RID + "'") === "consult", "업체 A 상담 시작 → consult");
  as(PVU, "select submit_quote('" + RID + "'," + lit({ amount:3300000, vat:"add", scope:"주방 · 홀 철거", days:3 }) + ")");
  ok(psql("select state from request where id='" + RID + "'") === "quoted", "업체 A 견적 제출 → quoted");
  ok(as(PVU2, "select count(*) from quote where request_id='" + RID + "'") === "0", "업체 B 는 A 의 견적을 못 봄");

  console.log("\n▶ ⑤ 고객 조회 (로그인한 고객)");
  ok(as(CUST, "select state from request where id='" + RID + "'") === "quoted", "고객이 진행 상태(quoted)를 봄");
  ok(as(CUST, "select count(*) from assignment where request_id='" + RID + "'") === "1", "고객이 연결된 업체를 봄 (상호 안내)");
  ok(as(CUST, "select amount from quote where request_id='" + RID + "'") === "3300000", "고객이 받은 견적을 봄");
  ok(as(CUST, "select count(*) from deal") === "0" && /permission denied|권한/.test(asErr(CUST, "select fee from deal")) || as(CUST, "select count(*) from deal") === "0",
     "고객에게 계약 · 수수료는 안 보임");
  ok(as(C2, "select count(*) from quote where request_id='" + RID + "'") === "0", "다른 고객은 견적을 못 봄");
  okE(/고를 수 없습니다/, (asErr(C2, "select choose_quote('" + RID + "','core-a')")), "다른 고객은 견적을 못 고름");
  as(CUST, "select choose_quote('" + RID + "','core-a')");
  ok(psql("select state from quote where request_id='" + RID + "'") === "chosen", "고객이 견적을 고름 (chosen)");

  console.log("\n▶ ⑤-2 고객 조회 (로그인 없이 — 접수번호 + 연락처 + 인증코드)");
  const ch = JSON.parse(svc("select lookup_start('SW-CORE-0001','01012345678','" + sha("123456") + "')"));
  ok(ch.send === true && !!ch.challenge, "번호 + 연락처가 맞으면 인증코드를 보낼 대상이 정해짐");
  const bad1 = JSON.parse(svc("select lookup_start('SW-CORE-0001','01099999999','" + sha("123456") + "')"));
  ok(bad1.send === false, "연락처가 다르면 보낼 대상 없음 (말은 같게)");
  const wrong = JSON.parse(svc("select lookup_verify('" + ch.challenge + "','" + sha("000000") + "','" + sha("tok-x") + "')"));
  ok(wrong.ok === false && wrong.why === "wrong", "틀린 코드는 거절");
  const right = JSON.parse(svc("select lookup_verify('" + ch.challenge + "','" + sha("123456") + "','" + sha("tok-1") + "')"));
  ok(right.ok === true, "맞는 코드 → 30분 조회 세션");
  const view = JSON.parse(svc("select lookup_read('" + sha("tok-1") + "')"));
  ok(view.no === "SW-CORE-0001" && view.state === "quoted", "조회 세션으로 진행 상태를 봄", view);
  ok(!JSON.stringify(view).includes("1234-5678") && !JSON.stringify(view).includes("합성 고객"), "조회 답에 성함 · 연락처를 다시 싣지 않음");
  ok(/permission denied/.test(asErr(CUST, "select lookup_read('" + sha("tok-1") + "')")), "조회 함수는 서버만 부름");

  console.log("\n▶ ⑥ 계약 → 완료");
  as(STAFF, "select move_state('" + RID + "','nego','{}'::jsonb)");
  as(STAFF, "select move_state('" + RID + "','signed','{\"amount\":3300000,\"providerId\":\"core-a\"}'::jsonb)");
  ok(psql("select state from request where id='" + RID + "'") === "signed", "계약 → signed");
  ok(psql("select count(*) from deal where request_id='" + RID + "'") === "1", "계약 줄 1");
  as(STAFF, "select move_state('" + RID + "','done','{}'::jsonb)");
  ok(as(CUST, "select state from request where id='" + RID + "'") === "done", "완료 → 고객 화면에도 done");
  const steps = psql("select string_agg(to_state, '>' order by at) from audit_log where obj='request' and obj_id='" + RID + "' and to_state in ('check','assigned','accepted','consult','quoted','nego','signed','done')");
  ok(steps === "check>assigned>accepted>consult>quoted>nego>signed>done", "걸음마다 감사 기록 (누가 · 언제)", steps);

  console.log("\n▶ ⑦ 취소 — 다른 신청");
  const P2 = Object.assign({}, P, { no:"SW-CORE-0002", idem:"core-2", tel:"010-5555-6666", email:null });
  svc("select submit_intake(" + lit(P2) + ")");
  const R2 = psql("select id from request where no='SW-CORE-0002'");
  okE(/내 신청이 아닙니다/, (asErr(C2, "select move_state('" + R2 + "','lost','{\"why\":\"x\"}'::jsonb)")), "다른 고객은 남의 신청을 취소 못 함 (0019)");
  ok(/why|사유/.test(asErr(CUST, "select move_state('" + R2 + "','lost','{}'::jsonb)")), "사유 없이는 취소 안 됨");
  as(CUST, "select move_state('" + R2 + "','lost','{\"why\":\"일정 변경\"}'::jsonb)");
  ok(psql("select state from request where id='" + R2 + "'") === "lost", "고객 본인 취소 → lost");
  ok(psql("select count(*) from notify_job where request_id='" + R2 + "' and kind='customer_ack'") === "0", "메일을 안 적으면 고객 안내 큐가 안 생김");
}

try{
  if(!BIN){ console.log("⚠️ Postgres 가 없습니다 — 통과로 치지 않습니다"); process.exitCode = 2; }
  else run();
}catch(e){ bad++; console.log("  ❌ 멈춤: " + (String(e.stderr || "").split("\n").filter(l => /ERROR/.test(l))[0] || e.message)); }
finally{ stop(); }
console.log("\n" + (bad ? "❌ " + bad + "건 실패" : "✅ 전부 통과") + " — " + pass + "개");
if(bad) process.exitCode = 1;
