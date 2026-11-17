/* W02 — 접수 저장을 로컬 임시 Postgres 에서만 눌러 봅니다 (운영 DB 를 쓰지 않습니다).
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
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), "sww02-"));
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
  const out = execFileSync(path.join(BIN, "psql"), ["-h", DIR, "-p", String(PORT), "-U", "postgres", "-d", "w02",
    "-t", "-A", "-v", "ON_ERROR_STOP=1", "-c", sql], { stdio:["ignore","pipe","pipe"] }).toString();
  const v = out.split("\n").map(x => x.trim()).filter(Boolean)
    .filter(x => !/^(SET|SELECT \d+|UPDATE \d+|INSERT \d+|DELETE \d+|BEGIN|COMMIT|ROLLBACK)$/.test(x));
  return v.length ? v[v.length - 1] : "";
}
function file(f){ execFileSync(path.join(BIN, "psql"), ["-h", DIR, "-p", String(PORT), "-U", "postgres", "-d", "w02",
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

try{
  start();
  execFileSync(path.join(BIN, "createdb"), ["-h", DIR, "-p", String(PORT), "-U", "postgres", "w02"]);
  psql("create extension if not exists pgcrypto");
  file("db/test/00_stub_auth.sql");
  const migs = fs.readdirSync(path.join(ROOT, "db/migrations")).filter(f => /^\d{4}_.*\.sql$/.test(f) && !/_down\.sql$/.test(f)).sort();
  for(const m of migs) file("db/migrations/" + m);
  ok(psql("select max(n) from schema_version") === "82", "0001~0019 위에 0082 가 올라감 (판 82)");
  // 두 번 붙여 넣어도 멈추지 않음
  let again = ""; try{ file("db/migrations/0082_storeway_intake.sql"); }catch(e){ again = String(e.stderr || e.message); }
  ok(again === "", "0082 를 두 번 돌려도 멈추지 않음", again);

  console.log("\n▶ T02 정상 신청 — 부모 1 + 서비스 항목 + 동의 + 알림 작업");
  const r1 = JSON.parse(psql("select submit_intake(" + lit(intake({ idem: "k-1", email: "a@test.invalid",
    items: [{ id: "interior", detail: { "평수": "20" } }, { id: "demolish" }] })) + ")"));
  ok(r1.dup === false && /^SW-/.test(r1.no), "번호를 돌려줌", JSON.stringify(r1));
  const RID = r1.request_id;
  ok(psql("select count(*) from request where id='" + RID + "'") === "1", "부모 요청 1건");
  ok(psql("select count(*) from request_item where request_id='" + RID + "'") === "2", "서비스 항목 2건");
  ok(psql("select string_agg(state::text, ',') from request_item where request_id='" + RID + "'") === "new,new", "항목마다 상태가 따로 있음");
  ok(psql("select count(*) from consent_record where request_id='" + RID + "' and notice_ver='quote-2026-11-18' and keep='검사용 보유기간'") === "1", "동의 증거(버전 · 보유기간)가 남음");
  ok(psql("select string_agg(kind, ',' order by kind) from notify_job where request_id='" + RID + "'") === "customer_ack,ops_new", "알림 작업 둘 (운영자 · 고객 안내)");
  ok(psql("select count(*) from audit_log where obj='request' and obj_id='" + RID + "' and why='intake'") === "1", "감사기록 1줄");
  ok(psql("select form || '|' || coalesce(listing_state,'-') from request where id='" + RID + "'") === "quote|-", "견적은 form=quote · 검수 상태 없음");

  console.log("\n▶ T03 중복 제출");
  const r1b = JSON.parse(psql("select submit_intake(" + lit(intake({ idem: "k-1" })) + ")"));
  ok(r1b.dup === true && r1b.no === r1.no, "같은 키를 다시 보내면 먼저 받은 번호", JSON.stringify(r1b));
  ok(psql("select count(*) from request where idem='k-1'") === "1", "같은 키로는 1건뿐");
  ok(psql("select count(*) from notify_job where request_id='" + RID + "'") === "2", "다시 보내도 알림 작업이 늘지 않음");
  const r2 = JSON.parse(psql("select submit_intake(" + lit(intake({ idem: "k-2" })) + ")"));
  ok(r2.dup === false && r2.no !== r1.no, "같은 연락처라도 새 키면 별도 신청으로 받음 (막지 않음)");

  console.log("\n▶ T04 · 원자성 — 하나라도 실패하면 전부 되돌아감");
  const before = psql("select count(*) from request");
  const e4 = err("select submit_intake(" + lit(intake({ idem: "k-bad", items: [{ id: "interior" }, { id: "" }] })) + ")");
  ok(/빈 서비스 id/.test(e4), "빈 서비스 id 로 거절", e4);
  ok(psql("select count(*) from request") === before, "부모 요청도 남지 않음 (부분 저장 없음)");
  ok(psql("select count(*) from consent_record where request_id is not null") === psql("select count(*) from request"), "동의 기록도 같이 되돌아감");

  console.log("\n▶ T06 입력 검증 · 권한");
  ok(/동의 기록이 비었습니다/.test(err("select submit_intake(" + lit(intake({ consent: null })) + ")")), "동의 없으면 거절");
  ok(/동의 기록이 비었습니다/.test(err("select submit_intake(" + lit(intake({ consent: { notice_ver: "x" } })) + ")")), "동의 항목이 비면 거절");
  ok(/성함과 연락처/.test(err("select submit_intake(" + lit(intake({ tel: "" })) + ")")), "연락처 없으면 거절");
  ok(/모르는 양식/.test(err("select submit_intake(" + lit(intake({ form: "evil" })) + ")")), "모르는 양식 거절");
  ok(/permission denied/.test(err("set role anon; select submit_intake(" + lit(intake()) + ")")), "공개 키(anon)는 부를 수 없음");
  ok(/permission denied/.test(err("set role authenticated; select submit_intake(" + lit(intake()) + ")")), "로그인 회원도 직접 부를 수 없음");
  const ro = JSON.parse(psql("select submit_intake(" + lit(intake({ offer_id: "no-such-offer" })) + ")"));
  ok(psql("select coalesce(offer_id,'null') from request where id='" + ro.request_id + "'") === "null", "없는 상품 id 는 비우고 접수는 살림");
  const rx = JSON.parse(psql("select submit_intake(" + lit(intake({ body: "<script>alert(1)</script>" })) + ")"));
  ok(psql("select body from request where id='" + rx.request_id + "'") === "<script>alert(1)</script>", "악성 글은 글자 그대로 담김 (화면이 esc 로 그립니다)");

  console.log("\n▶ T10 매물 · 입점");
  const rs = JSON.parse(psql("select submit_intake(" + lit(intake({ form: "sell", cat: "transfer", idem: "k-sell" })) + ")"));
  ok(psql("select listing_state from request where id='" + rs.request_id + "'") === "review", "매물은 검수대기(review)로 저장");
  { const e10 = err("insert into request (no,side,name,tel,agree_at,form) values ('SW-X','start','a','010-1',now(),'sell')");
    ok(/request_listing_ck/.test(e10), "매물인데 검수 상태가 비면 표가 거절", e10); }
  const ra = JSON.parse(psql("select submit_apply(" + lit({ no: "SW-PA01", company: "합성 업체", name: "합성 담당",
    tel: "010-0000-0002", services: ["interior"], state: "approved", consent: { notice_ver: "join-1", keep: "검사용" } }) + ")"));
  ok(psql("select state || '|' || coalesce(provider_id,'null') from provider_apply where id='" + ra.apply_id + "'") === "new|null",
     "입점은 심사대기(new) · 화면이 approved 를 보내도 무시 · 업체로 안 만들어짐");
  ok(psql("select count(*) from provider where name='합성 업체'") === "0", "공개 업체 목록에 저절로 안 올라감");

  console.log("\n▶ T05 알림 — 저장과 분리 · 재시도 · 중복 발송 방지");
  const J = r1.jobs.find(j => j.kind === "ops_new").id;
  ok(psql("select mark_notify('" + J + "', false, 'webhook 500')") === "failed", "실패하면 failed");
  ok(psql("select (next_at > now())::text || '|' || tries from notify_job where id='" + J + "'") === "true|1", "다음 시도 시각이 미래 · 횟수 1");
  ok(psql("select count(*) from request where id='" + RID + "'") === "1", "알림이 실패해도 접수는 그대로");
  ok(psql("select count(*) from due_notify(100) where id='" + J + "'") === "0", "기다릴 시각 전에는 재시도 목록에 없음");
  psql("update notify_job set next_at = now() - interval '1 min' where id='" + J + "'");
  ok(psql("select count(*) from due_notify(100) where id='" + J + "'") === "1", "시각이 지나면 재시도 목록에 나옴");
  ok(psql("select mark_notify('" + J + "', true)") === "sent", "다시 보내 성공하면 sent");
  ok(psql("select mark_notify('" + J + "', true)") === "skip", "보낸 것을 또 보내지 않음 (skip)");
  const J2 = r2.jobs[0].id;
  let last = "";
  for(let i = 0; i < 5; i++){ psql("update notify_job set next_at = now() where id='" + J2 + "'"); last = psql("select mark_notify('" + J2 + "', false, 'down')"); }
  ok(last === "gave_up", "다섯 번 실패하면 gave_up (운영자 확인 대상)", last);

  console.log("\n▶ 개인정보 — 알림 · 감사기록에 성함 · 연락처가 없음");
  const cols = psql("select string_agg(column_name, ',') from information_schema.columns where table_name='notify_job'");
  ok(!/name|tel|email|body/.test(cols.replace(/updated_at|created_at|dedupe_key/g, "")), "notify_job 에 개인정보 칸이 없음", cols);
  ok(psql("select count(*) from audit_log where why='intake' and (data::text like '%010-0000%' or data::text like '%합성 고객%')") === "0", "감사기록에 성함 · 연락처 없음");

  console.log("\n▶ T07 일부 — 동의 · 알림 기록은 직원 · 관리자만");
  psql("insert into auth.users (id) values ('11111111-1111-1111-1111-111111111111'),('22222222-2222-2222-2222-222222222222') on conflict do nothing");
  psql("insert into account (id, role) values ('11111111-1111-1111-1111-111111111111','customer') on conflict (id) do update set role='customer'");
  psql("insert into account (id, role) values ('22222222-2222-2222-2222-222222222222','staff') on conflict (id) do update set role='staff'");
  ok(psql("set role authenticated; select become('11111111-1111-1111-1111-111111111111'); select count(*) from consent_record") === "0", "손님은 동의 기록을 못 읽음 (0줄)");
  ok(psql("set role authenticated; select become('11111111-1111-1111-1111-111111111111'); select count(*) from notify_job") === "0", "손님은 알림 작업을 못 읽음 (0줄)");
  ok(Number(psql("set role authenticated; select become('22222222-2222-2222-2222-222222222222'); select count(*) from notify_job")) > 0, "직원은 알림 작업을 봄 (실패 확인)");
  ok(/permission denied/.test(err("set role authenticated; select become('22222222-2222-2222-2222-222222222222'); update notify_job set status='sent'")), "직원도 알림 작업을 직접 고칠 수 없음");
  // 운영처럼 기본 권한이 넓어도 공개 키가 표에 못 쓰는가
  ok(/permission denied/.test(err("set role anon; insert into notify_job (kind, dedupe_key) values ('ops_new','x')")), "공개 키는 알림 작업 표에 못 씀");
  ok(/permission denied/.test(err("set role anon; select * from consent_record")), "공개 키는 동의 기록을 못 읽음");
}catch(e){ bad++; console.log("❌ 검사가 도중에 멈췄습니다 — " + String(e.stderr || e.message).split("\n").slice(0, 3).join(" ")); }
finally{ stop(); }
console.log("\n" + (pass + bad) + "건 중 " + pass + "건 통과 · " + bad + "건 실패");
process.exit(bad ? 1 : 0);
