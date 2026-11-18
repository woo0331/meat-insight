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
}catch(e){
  bad++; console.log("  ❌ 검사가 멈췄습니다 — " + String(e.stderr || e.message).split("\n").slice(0, 3).join(" "));
}finally{
  stop();
}
console.log("\n" + (pass + bad) + "건 중 " + pass + "건 통과 · " + bad + "건 실패");
process.exit(bad ? 1 : 0);
