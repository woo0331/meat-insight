/* STOREWAY 1차 — 매장 정리 상담 흐름을 **격리 환경에서만** 눌러 봅니다 (운영 DB · 운영 설정을 쓰지 않습니다).

   ① DB (로컬 임시 Postgres · 0001~0084 · 가짜 auth)
      신청 → 저장 → 접수 길 기록 → 담당자 → 업체 연결(제17조 동의) → 운영자 견적 기록
      → 견적 비교 칸 → 계약 → 결과(사유 · 확인일 · 정산 여부) / 다른 건은 종료
      → 시각 뷰(개인정보 없음) · 업체 연결 전 연락처 비공개
   ② API (가짜 DB · 가짜 웹훅)
      닫힘 · 지역 밖 · 정리 분류 밖 · 중복 제출 · 유입 경로에 연락처가 안 실림
   ⚠️ 씨앗(업체 · 신청)은 **이 임시 DB 안에서만** 삽니다 — 저장소 데이터는 그대로입니다.
   ⚠️ Postgres 가 없으면 ① 을 통과로 치지 않고 exit 2 입니다. */
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
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), "sws1-"));
const PORT = 5750 + (process.pid % 150);
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
  const out = execFileSync(path.join(BIN, "psql"), ["-h", DIR, "-p", String(PORT), "-U", "postgres", "-d", "s1",
    "-t", "-A", "-v", "ON_ERROR_STOP=1", "-c", sql], { stdio:["ignore","pipe","pipe"] }).toString();
  const v = out.split("\n").map(x => x.trim()).filter(Boolean)
    .filter(x => !/^(SET|SELECT \d+|UPDATE \d+|INSERT \d+|DELETE \d+|BEGIN|COMMIT|ROLLBACK)$/.test(x));
  return v.length ? v[v.length - 1] : "";
}
function file(f){ execFileSync(path.join(BIN, "psql"), ["-h", DIR, "-p", String(PORT), "-U", "postgres", "-d", "s1",
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

function dbPart(){
  console.log("\n▶ ① DB — 마이그레이션 0001~0084");
  start();
  execFileSync(path.join(BIN, "createdb"), ["-h", DIR, "-p", String(PORT), "-U", "postgres", "s1"]);
  psql("create extension if not exists pgcrypto");
  file("db/test/00_stub_auth.sql");
  const migs = fs.readdirSync(path.join(ROOT, "db/migrations")).filter(f => /^\d{4}_.*\.sql$/.test(f) && !/_down\.sql$/.test(f)).sort();
  for(const m of migs) file("db/migrations/" + m);
  ok(psql("select max(n) from schema_version") === "84", "판 번호 84");
  file("db/migrations/0084_storeway_close_consult.sql");
  ok(true, "0084 를 두 번 돌려도 멈추지 않음");
  ok(psql("select count(*) from deal_move") === "78", "갈 수 있는 길 78 (직원 · 관리자 네 걸음 더함)", psql("select count(*) from deal_move"));

  /* 합성 씨앗 — 이 임시 DB 안에서만 */
  for(const [u, r, p] of [[CUST,"customer",null],[STAFF,"staff",null],[ADMIN,"admin",null],[PVU,"provider","syn-demo"],[PVU2,"provider","syn-other"]])
    psql("insert into auth.users (id) values ('" + u + "') on conflict do nothing");
  psql("insert into provider (id, name, listed, subs) values ('syn-demo','합성 철거업체','t','{full}'),('syn-other','합성 다른업체','t','{full}')");
  for(const [u, r, p] of [[CUST,"customer",null],[STAFF,"staff",null],[ADMIN,"admin",null],[PVU,"provider","syn-demo"],[PVU2,"provider","syn-other"]])
    psql("insert into account (id, role, provider_id) values ('" + u + "','" + r + "'," + (p ? "'" + p + "'" : "null") +
         ") on conflict (id) do update set role=excluded.role, provider_id=excluded.provider_id");
  psql("update provider set assignable = true where id in ('syn-demo','syn-other')");

  console.log("\n▶ 신청 → 저장 → 접수 길");
  const CONSENT = { notice_ver:"close-test", items:"이름 · 휴대폰 · 지역 · 필요한 서비스 · 적어 주신 추가 정보(선택)",
                    purpose:"매장 정리 상담 접수와 업체 연결 안내", keep:"접수일로부터 1년" };
  const P = { no:"SW-CLS1-0001", idem:"s1-a", form:"quote", side:"close", industry:"restaurant", cat:"asset/kitchen-eq",
    region:"경기", gu:"안양시", want_at:"2026-12-20", body:"매장 정리 상담 — 합성", name:"합성 고객", tel:"010-2222-3333",
    items:[{ id:"asset/kitchen-eq" }, { id:"demolish/full" }], consent:CONSENT };
  const r1 = JSON.parse(svc("select submit_intake(" + lit(P) + ")"));
  ok(r1.no === "SW-CLS1-0001" && !r1.dup, "저장됨 (접수번호)", r1);
  const r2 = JSON.parse(svc("select submit_intake(" + lit(P) + ")"));
  ok(r2.dup === true && psql("select count(*) from request where idem='s1-a'") === "1", "같은 신청서를 다시 보내면 한 건 (중복 제출)", r2);
  svc("select note_intake_meta('SW-CLS1-0001','close','close|closure-urgent|/closure')");
  ok(psql("select channel||' '||src from request where no='SW-CLS1-0001'") === "close close|closure-urgent|/closure", "접수 길 · 유입 경로가 적힘");
  ok(/request_src_ck/.test(svcErr("select note_intake_meta('SW-CLS1-0001','close','close|01022223333')")), "유입 경로에 전화번호 꼴이 들어가면 DB 가 막음");
  ok(/request_src_ck/.test(svcErr("select note_intake_meta('SW-CLS1-0001','close','a@b.c')")), "유입 경로에 메일 꼴이 들어가면 DB 가 막음");
  ok(/permission denied/.test(asErr(STAFF, "select note_intake_meta('SW-CLS1-0001','close','x')")), "접수 길 기록은 서버만 부름");
  ok(psql("select count(*) from consent_record c join request r on r.id=c.request_id where r.no='SW-CLS1-0001'") === "1", "동의 기록이 한 줄 남음 (기존 증거 재사용)");
  const RID = psql("select id from request where no='SW-CLS1-0001'");

  console.log("\n▶ 관리자 확인 → 담당자 → 업체 연결");
  ok(as(STAFF, "select count(*) from request where id='" + RID + "'") === "1", "직원이 접수를 봄");
  ok(as(PVU, "select count(*) from request where id='" + RID + "'") === "0", "업체는 연결 전에 그 신청(연락처 포함)을 못 봄");
  as(STAFF, "select set_owner('" + RID + "','" + STAFF + "','첫 담당')");
  ok(psql("select owner_id from request where id='" + RID + "'") === STAFF, "담당자 지정");
  as(STAFF, "select move_state('" + RID + "','check','{}'::jsonb)");
  ok(/agree3rd|제17조/.test(asErr(STAFF, "select move_state('" + RID + "','assigned','{\"providerId\":\"syn-demo\"}'::jsonb)")), "제3자 제공 동의 없이는 업체 연결이 안 됨");
  as(STAFF, "select move_state('" + RID + "','assigned','{\"providerId\":\"syn-demo\",\"agree3rd\":true}'::jsonb)");
  ok(psql("select state from request where id='" + RID + "'") === "assigned", "업체 연결 (assigned)");
  ok(as(PVU, "select count(*) from request where id='" + RID + "'") === "1", "연결된 업체만 그 뒤에 봄");
  ok(as(PVU2, "select count(*) from request where id='" + RID + "'") === "0", "다른 업체는 여전히 못 봄");

  console.log("\n▶ 운영자 견적 기록 → 견적 도착");
  ok(/연결된 업체가 아닙니다/.test(asErr(STAFF, "select staff_record_quote('" + RID + "','syn-other'," + lit({ amount:1000000, scope:"x" }) + ")")), "연결 안 된 업체의 견적은 못 적음");
  ok(/직원 · 관리자만/.test(asErr(CUST, "select staff_record_quote('" + RID + "','syn-demo'," + lit({ amount:1, scope:"x" }) + ")")), "고객은 견적을 못 적음");
  ok(/작업 범위/.test(asErr(STAFF, "select staff_record_quote('" + RID + "','syn-demo'," + lit({ amount:1000 }) + ")")), "작업 범위 없이는 안 됨");
  ok(/금액/.test(asErr(STAFF, "select staff_record_quote('" + RID + "','syn-demo'," + lit({ scope:"x" }) + ")")), "금액 없이는 안 됨");
  const QD = { amount:3300000, vat:"add", scope:"주방 · 홀 전체 철거", waste:"포함 (5톤 1대)", restore:"바닥 · 벽 원상복구 포함",
               excludes:"간판 철거", extra:"폐기물 초과 시 1톤당 추가", days:3 };
  as(STAFF, "select staff_record_quote('" + RID + "','syn-demo'," + lit(QD) + ",'전화로 받은 견적')");
  ok(psql("select state from request where id='" + RID + "'") === "quoted", "견적 도착 (assigned → accepted → consult → quoted)");
  const qrow = psql("select concat_ws('|',amount,vat,scope,waste,restore,excludes,extra,days,src) from quote where request_id='" + RID + "'");
  ok(qrow === "3300000|add|주방 · 홀 전체 철거|포함 (5톤 1대)|바닥 · 벽 원상복구 포함|간판 철거|폐기물 초과 시 1톤당 추가|3|staff", "비교 칸 여섯이 그대로 남음 (누가 적었나: staff)", qrow);
  ok(psql("select count(*) from audit_log where obj='request' and obj_id='" + RID + "' and by_role='staff' and to_state in ('accepted','consult','quoted')") === "3", "넘어간 걸음마다 직원으로 기록");
  as(STAFF, "select staff_record_quote('" + RID + "','syn-demo'," + lit(Object.assign({}, QD, { amount:3100000 })) + ")");
  ok(psql("select amount from quote where request_id='" + RID + "'") === "3100000" && psql("select count(*) from quote where request_id='" + RID + "'") === "1", "다시 적으면 그 견적을 고침 (한 업체 한 줄)");

  console.log("\n▶ 계약 → 결과 기록");
  ok(/계약 또는 종료/.test(asErr(STAFF, "select set_outcome('" + RID + "','x','2026-12-01')")), "계약 전에는 결과를 못 적음");
  as(STAFF, "select move_state('" + RID + "','nego','{}'::jsonb)");
  as(STAFF, "select move_state('" + RID + "','signed','{\"amount\":3100000,\"providerId\":\"syn-demo\"}'::jsonb)");
  ok(psql("select state from request where id='" + RID + "'") === "signed", "계약 (signed)");
  ok(psql("select count(*) from deal where request_id='" + RID + "' and signed_at is not null") === "1", "계약 줄과 계약 시각이 생김");
  ok(/사유/.test(asErr(STAFF, "select set_outcome('" + RID + "','  ','2026-12-01')")), "사유 없이는 안 됨");
  as(STAFF, "select set_outcome('" + RID + "','철거 + 원상복구 계약','2026-12-01','pending')");
  ok(psql("select outcome_why||'|'||outcome_on||'|'||settle from request where id='" + RID + "'") === "철거 + 원상복구 계약|2026-12-01|pending", "계약 사유 · 확인일 · 정산 전");
  as(STAFF, "select move_state('" + RID + "','done','{}'::jsonb)");
  as(STAFF, "select set_outcome('" + RID + "','작업 완료 확인','2026-12-05','done')");
  ok(psql("select settle from request where id='" + RID + "'") === "done", "완료 · 정산 확인 기록 (결제 · 청구는 하지 않음)");
  ok(psql("select count(*) from audit_log where obj='request' and obj_id='" + RID + "' and why='작업 완료 확인'") === "1", "결과 기록이 감사 기록에 남음");

  console.log("\n▶ 다른 건 — 종료");
  const P2 = Object.assign({}, P, { no:"SW-CLS2-0002", idem:"s1-b", tel:"010-4444-5555" });
  svc("select submit_intake(" + lit(P2) + ")");
  const RID2 = psql("select id from request where no='SW-CLS2-0002'");
  as(STAFF, "select move_state('" + RID2 + "','lost','{\"why\":\"고객이 직접 처리\"}'::jsonb)");
  as(STAFF, "select set_outcome('" + RID2 + "','고객이 직접 처리','2026-11-20','none')");
  ok(psql("select state||'|'||settle from request where id='" + RID2 + "'") === "lost|none", "종료 사유 · 정산 없음");

  console.log("\n▶ 시각 뷰 — 접수 · 업체 응답 · 견적 · 계약 (개인정보 없음)");
  const cols = psql("select string_agg(column_name, ',' order by ordinal_position) from information_schema.columns where table_name='intake_funnel'");
  ok(!/\b(name|tel|email|body|detail|tel_key)\b/.test(cols), "뷰에 성함 · 연락처 · 원문 칸이 없음", cols);
  const fn = as(STAFF, "select concat_ws('|', channel, (intake_at is not null), (assigned_at is not null), (vendor_at is not null), (quote_at is not null), (signed_at is not null), (closed_at is not null)) from intake_funnel where id='" + RID + "'");
  ok(fn === "close|t|t|f|t|t|t", "접수 · 연결 · 견적 · 계약 · 완료 시각이 잡히고, 업체 응답(vendor_at)은 비어 있음 — 직원이 대신 넘겼기 때문", fn);
  const px = as(STAFF, "select concat_ws('|', (proxy_at is not null), vendor_via, (vendor_quote_at is null)) from intake_funnel where id='" + RID + "'");
  ok(px === "t|staff|t", "대리 기록은 proxy_at · vendor_via=staff 로 따로 잡히고, 업체가 낸 견적 시각도 비어 있음", px);

  console.log("\n▶ 대리 기록 — 실제 변경자 · 시각 · 업체 응답 집계에서 빠짐");
  const who = psql("select string_agg(to_state||':'||by_role||':'||(by_user='" + STAFF + "')||':'||(at is not null), ',' order by id) from audit_log where obj='request' and obj_id='" + RID + "' and to_state in ('accepted','consult','quoted','nego')");
  ok(who === "accepted:staff:true:true,consult:staff:true:true,quoted:staff:true:true,nego:staff:true:true",
     "업체가 넘길 네 걸음 모두 실제 변경자(직원 계정) · 역할 staff · 시각이 남음", who);
  ok(psql("select count(*) from audit_log where obj='request' and obj_id='" + RID + "' and by_role='provider'") === "0", "그 건에 업체 역할로 남은 기록은 0 — 업체가 응답한 것처럼 안 남음");
  /* 세 번째 건 — 업체가 스스로 받음 */
  const P3 = Object.assign({}, P, { no:"SW-CLS3-0003", idem:"s1-c", tel:"010-6666-7777" });
  svc("select submit_intake(" + lit(P3) + ")");
  const RID3 = psql("select id from request where no='SW-CLS3-0003'");
  as(STAFF, "select move_state('" + RID3 + "','check','{}'::jsonb)");
  as(STAFF, "select move_state('" + RID3 + "','assigned','{\"providerId\":\"syn-demo\",\"agree3rd\":true}'::jsonb)");
  as(PVU, "select move_state('" + RID3 + "','accepted','{}'::jsonb)");
  ok(as(STAFF, "select vendor_via||'|'||(vendor_at is not null)||'|'||(proxy_at is null) from intake_funnel where id='" + RID3 + "'") === "provider|true|true", "업체가 스스로 받은 건은 vendor_via=provider · vendor_at 이 잡힘", as(STAFF, "select vendor_via||'|'||(vendor_at is not null)||'|'||(proxy_at is null) from intake_funnel where id='" + RID3 + "'"));
  ok(as(STAFF, "select count(*) from audit_log where obj='request' and obj_id='" + RID3 + "' and by_role='provider'") === "1", "직원도 업체가 스스로 넘긴 이력을 봄 (그래야 대리 기록과 가를 수 있음)");
  psql("insert into audit_log (by_user, by_role, obj, obj_id, to_state, why) values ('" + ADMIN + "','admin','deal','syn-deal','fee_wait','합성 기록')");
  ok(as(STAFF, "select count(*) from audit_log where obj not in ('request','quote') and by_user <> '" + STAFF + "'") === "0" &&
     psql("select count(*) from audit_log where obj='deal' and obj_id='syn-deal'") === "1", "직원에게 계약 · 정산 · 업체 기록은 그대로 안 열림");
  const vr = as(STAFF, "select concat_ws('|',assigned_n,vendor_n,proxy_n,none_n,vendor_rate,(vendor_median_min is not null)) from vendor_response where provider_id='syn-demo'");
  ok(vr === "2|1|1|0|50.0|t", "업체 응답률은 업체 직접 응답만 셈 (배정 2 · 직접 1 · 대리 1 → 50%) · 응답 시간도 직접 응답만", vr);
  ok(as(STAFF, "select count(*) from vendor_response where provider_id='syn-other'") === "0", "배정 없는 업체는 줄이 없음 (0% 를 만들지 않음)");
  ok(as(CUST, "select count(*) from vendor_response") === "0" && as(PVU, "select count(*) from vendor_response") === "0", "고객 · 업체는 응답 집계를 못 봄 (직원 · 관리자만)");
  ok(/permission denied/.test(err("set role anon; select count(*) from vendor_response")), "로그인 안 한 쪽은 응답 집계를 못 읽음");
  ok(as(PVU2, "select count(*) from intake_funnel") === "0", "다른 업체는 뷰에서도 0줄 (RLS 를 그대로 거침)");
  ok(/permission denied/.test(err("set role anon; select count(*) from intake_funnel")), "로그인 안 한 쪽은 뷰를 못 읽음");
}

/* ── ② API ────────────────────────────────────────────────────────── */
async function apiPart(){
  console.log("\n▶ ② API — 매장 정리 상담 (가짜 DB)");
  const load = (open) => {
    ["STOREWAY_INTAKE_OPEN","SUPABASE_URL","SUPABASE_SERVICE_KEY","INTAKE_WEBHOOK_URL"].forEach(k => delete process.env[k]);
    Object.assign(process.env, { STOREWAY_INTAKE_OPEN: open, SUPABASE_URL: "https://db.invalid",
      SUPABASE_SERVICE_KEY: "svc", INTAKE_WEBHOOK_URL: "https://hook.invalid/x" });
    Object.keys(require.cache).forEach(k => { if(k.indexOf(path.join(ROOT, "api") + path.sep) === 0) delete require.cache[k]; });
    return require(path.join(ROOT, "api", "quote.js"));
  };
  const w = { rpc: [], hooks: [], dup:false };
  global.fetch = async function(url, init){
    const u = String(url), body = init && init.body ? JSON.parse(init.body) : null;
    const resp = (s, d) => ({ ok: s < 400, status: s, headers: { get(){ return ""; } }, text: async () => JSON.stringify(d), json: async () => d });
    if(u.indexOf("/rest/v1/rpc/") > 0){ const fn = u.split("/rpc/")[1]; w.rpc.push({ fn, body });
      if(fn === "submit_intake") return w.dup ? resp(200, { no:"SW-FIRST-0001", dup:true }) : resp(200, { no: body.p.no, dup:false, jobs:[] });
      return resp(200, null); }
    if(u.indexOf("/rest/v1/") > 0) return resp(200, []);
    if(u.indexOf("hook.invalid") > 0){ w.hooks.push(body); return resp(200, {}); }
    return resp(404, {});
  };
  const req = b => ({ method:"POST", body:b, headers:{ origin:"https://storeway.co.kr", host:"storeway.co.kr" } });
  const res = () => { const r = { code:0, body:null }; r.status = c => (r.code = c, r); r.json = b => (r.body = b, r); r.setHeader = () => {}; return r; };
  const B = { kind:"quote", form:"close", name:"합성고객", tel:"010-7777-8888", region:"경기", regionKey:"gyeonggi", gu:"군포시",
    industry:"cafe", wantAt:"2026-12-31", items:[{ id:"asset/kitchen-eq" }, { id:"demolish/full" }], idem:"api-1",
    src:"close|closure-urgent|/closure", agree:true };

  let h = load("quote"), r = res(); w.rpc = [];
  await h(req(B), r);
  ok(r.code === 503 && r.body.closed === true && w.rpc.length === 0, "매장 정리 상담이 닫혀 있으면 503 · DB 를 안 부름", r.body);

  h = load("close");
  r = res(); w.rpc = []; await h(req(Object.assign({}, B, { gu:"수원시" })), r);
  ok(r.code === 422 && r.body.outArea === true && /안양시 · 군포시 · 의왕시/.test(r.body.error) && w.rpc.length === 0, "지역 밖 → 422 · 정확한 안내 · DB 를 안 부름", r.body);
  r = res(); w.rpc = []; await h(req(Object.assign({}, B, { region:"서울", regionKey:"seoul", gu:"안양시" })), r);
  ok(r.code === 422, "서울 + 안양시 같은 엇갈린 값도 지역 밖", r.body);
  r = res(); w.rpc = []; await h(req(Object.assign({}, B, { items:[{ id:"interior" }] })), r);
  ok(r.code === 400 && w.rpc.length === 0, "정리 분류 밖 서비스(인테리어)는 이 길로 안 받음", r.body);
  /* 2026-11-27 대표 지시 — 업종 · 정리 희망일은 '추가 정보(선택)' 로 내려갔습니다 (화면 · 서버 같은 규칙) */
  r = res(); w.rpc = []; await h(req(Object.assign({}, B, { wantAt:"", industry:"", idem:"api-nowant" })), r);
  ok(r.code === 200 && r.body.no, "업종 · 정리 희망일이 없어도 받음 (선택)", r.body);
  r = res(); w.rpc = []; await h(req(Object.assign({}, B, { items:[], unsure:true, idem:"api-unsure" })), r);
  ok(r.code === 200 && r.body.no, "'잘 모르겠어요' 만 골라도 받음", r.body);
  r = res(); w.rpc = []; await h(req(Object.assign({}, B, { items:[], idem:"api-none" })), r);
  ok(r.code === 400 && w.rpc.length === 0, "서비스도 '잘 모르겠어요' 도 없으면 안 받음", r.body);
  r = res(); w.rpc = []; await h(req(Object.assign({}, B, { agree:false })), r);
  ok(r.code === 400 && w.rpc.length === 0, "동의 없이는 안 받음", r.body);

  r = res(); w.rpc = []; w.hooks = []; await h(req(B), r);
  const sub = w.rpc.find(x => x.fn === "submit_intake"), meta = w.rpc.find(x => x.fn === "note_intake_meta");
  ok(r.code === 200 && r.body.ok && r.body.no, "지역 안 → 접수번호", r.body);
  ok(sub && sub.body.p.form === "quote" && sub.body.p.side === "close" && sub.body.p.gu === "군포시" && sub.body.p.want_at === "2026-12-31", "저장 칸 — 양식 quote · 상황 close · 시군 · 희망일", sub && sub.body.p);
  ok(sub && sub.body.p.consent && /매장 정리 상담/.test(sub.body.p.consent.purpose), "매장 정리 상담 고지문으로 동의 증거", sub && sub.body.p.consent);
  ok(sub && /매장 정리 상담 — /.test(sub.body.p.body), "상담 내용을 안 적으셔도 고르신 것으로 채움", sub && sub.body.p.body);
  ok(meta && meta.body.p_channel === "close" && meta.body.p_src === "close|closure-urgent|/closure", "접수 길 · 유입 경로 기록", meta && meta.body);
  ok(!JSON.stringify(w.hooks).includes("7777-8888") && !JSON.stringify(meta || {}).includes("7777"), "알림 · 유입 기록에 연락처가 없음", w.hooks);
  r = res(); w.rpc = []; await h(req(Object.assign({}, B, { src:"close|010-7777-8888" })), r);
  const meta2 = w.rpc.find(x => x.fn === "note_intake_meta");
  ok(meta2 && meta2.body.p_src === null, "유입 경로에 연락처 꼴이 오면 버림", meta2 && meta2.body);
  w.dup = true; r = res(); w.rpc = []; await h(req(B), r);
  ok(r.code === 200 && r.body.dup === true && !w.rpc.some(x => x.fn === "note_intake_meta"), "중복 제출 → 먼저 받은 번호 · 다시 안 적음", r.body);
  w.dup = false;
  r = res(); w.rpc = []; await h(req(Object.assign({}, B, { form:undefined, items:[{ id:"interior" }], q:"인테리어" })), r);
  ok(r.code === 503, "매장 정리 상담만 열면 일반 견적은 그대로 닫힘", r.body);
}

(async () => {
  try{
    if(!BIN){ console.log("⚠️ Postgres 가 없어 ① 을 돌리지 못했습니다 — 통과로 치지 않습니다"); skipDb = true; }
    else dbPart();
    await apiPart();
  }catch(e){ bad++; console.log("  ❌ 멈춤 — " + String(e.stderr || e.message || e).slice(0, 600)); }
  finally{ stop(); }
  console.log("\n" + (bad ? "❌ " : "✅ ") + "통과 " + pass + " · 실패 " + bad);
  process.exit(bad ? 1 : (skipDb ? 2 : 0));
})();
