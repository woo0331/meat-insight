#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   DB 스키마를 **실제 Postgres 에서** 눌러 봅니다 (§8 · §9 · §13)

     node tools/test-sql.js

   ⚠️⚠️ **이 검사가 생긴 까닭** — `db/migrations/0001_init.sql` 을 414줄
   써 놓고 **한 번도 돌려 보지 않았습니다.** 사장님 운영 DB 에 붙여
   넣으라고 드리기 전에 돌려 보니 바로 둘이 나왔습니다 —
     ① GRANT 가 한 줄도 없어서 Supabase 의 기본 설정에 **암묵적으로
        기대고** 있었습니다
     ② 서버가 service key 로 붙으면 `auth.uid()` 가 비어서 트리거가
        막아, **아무도 수수료를 확정할 수 없었습니다** (0003 이 그 고침)
   둘 다 "빌드는 성공인데 실제로는 안 되는" 종류입니다.

   ⚠️ Postgres 가 있으면 임시 클러스터를 **스스로 띄웁니다.** 없으면
   건너뛰고(성공으로 치지 않고) 까닭을 적습니다 — 없는 환경에서
   거짓 통과를 만들지 않습니다.
   ════════════════════════════════════════════════════════════════════ */

const { execFileSync, execSync } = require("child_process");
const fs   = require("fs");
const os   = require("os");
const path = require("path");

const ROOT = path.join(__dirname, "..");
let bad = 0, ran = 0;
function ok(name, cond, got){
  ran++;
  if(cond) console.log("  ✅ " + name);
  else { bad++; console.log("  ❌ " + name + (got !== undefined ? "  →  " + String(got).slice(0, 300) : "")); }
}

/* ── Postgres 찾기 ─────────────────────────────────────────── */
function findBin(){
  for(const d of ["/usr/lib/postgresql/16/bin", "/usr/lib/postgresql/15/bin",
                  "/usr/lib/postgresql/14/bin", "/usr/local/pgsql/bin"])
    if(fs.existsSync(path.join(d, "initdb"))) return d;
  try{ return path.dirname(execSync("which initdb").toString().trim()); }catch(e){ return ""; }
}
const BIN  = findBin();
const DIR  = fs.mkdtempSync(path.join(os.tmpdir(), "swsql-"));
const PORT = 5400 + (process.pid % 150);
let started = false;

function sh(cmd){ return execSync(cmd, { stdio:["ignore","pipe","pipe"] }).toString(); }

function start(){
  /* initdb 는 root 로 못 돕니다 — postgres 사용자가 있으면 그쪽으로 */
  const asPg = (() => { try{ sh("id postgres"); return true; }catch(e){ return false; } })();
  const me   = (() => { try{ return sh("id -un").trim(); }catch(e){ return ""; } })();
  const pre  = (asPg && me === "root") ? ("su postgres -c ") : "";
  if(pre) sh("chown -R postgres:postgres " + DIR);
  const q = s => pre ? ("'" + s.replace(/'/g, "'\\''") + "'") : s;
  sh(pre + q(BIN + "/initdb -D " + DIR + "/data -A trust -U postgres"));
  sh(pre + q(BIN + "/pg_ctl -D " + DIR + "/data -l " + DIR + "/log -o \"-p " + PORT + " -k " + DIR + "\" start"));
  started = true;
}
function stop(){
  if(!started) return;
  try{
    const asPg = (() => { try{ sh("id postgres"); return true; }catch(e){ return false; } })();
    const me   = (() => { try{ return sh("id -un").trim(); }catch(e){ return ""; } })();
    const pre  = (asPg && me === "root") ? "su postgres -c " : "";
    const q = s => pre ? ("'" + s.replace(/'/g, "'\\''") + "'") : s;
    sh(pre + q(BIN + "/pg_ctl -D " + DIR + "/data stop -m immediate"));
  }catch(e){}
  try{ fs.rmSync(DIR, { recursive:true, force:true }); }catch(e){}
}

/* ── psql ─────────────────────────────────────────────────── */
/* ⚠️⚠️ **마지막 줄만 돌려줍니다.** `-c "set role …; select …"` 는 문장
   **전부**의 출력을 이어서 내놓습니다 — 처음에 그걸 통째로 견주다가
   멀쩡한 스키마를 11건 "실패" 로 잡았습니다. 값은 맞고 **검사가
   틀렸습니다** (이 저장소가 "검사가 아니라 되돌리기/씨앗이 틀렸다" 로
   여러 번 겪은 그 자리입니다). */
function psql(sql, db){
  const out = execFileSync(path.join(BIN, "psql"),
    ["-h", DIR, "-p", String(PORT), "-U", "postgres", "-d", db || "swtest",
     "-t", "-A", "-v", "ON_ERROR_STOP=1", "-c", sql],
    { stdio:["ignore","pipe","pipe"] }).toString();
  const lines = out.split("\n").map(x => x.trim()).filter(Boolean);
  /* SET · SELECT 1 같은 상태줄은 값이 아닙니다 */
  const vals = lines.filter(x => !/^(SET|SELECT \d+|UPDATE \d+|INSERT \d+|DELETE \d+|BEGIN|COMMIT)$/.test(x));
  return vals.length ? vals[vals.length - 1] : "";
}
function psqlFile(f, db){
  return execFileSync(path.join(BIN, "psql"),
    ["-h", DIR, "-p", String(PORT), "-U", "postgres", "-d", db || "swtest",
     "-q", "-v", "ON_ERROR_STOP=1", "-f", path.join(ROOT, f)],
    { stdio:["ignore","pipe","pipe"] }).toString();
}
/* 막혀야 하는 것 — 막히면 true, 통과하면 false */
function denied(sql, db){
  try{ psql(sql, db); return { no:false }; }
  catch(e){ return { no:true, why:String((e.stderr || e.stdout || e.message)).trim().split("\n")[0] }; }
}
/* 되어야 하는 것 */
function allowed(sql, db){
  try{ return { yes:true, out:psql(sql, db) }; }
  catch(e){ return { yes:false, why:String((e.stderr || e.stdout || e.message)).trim().split("\n")[0] }; }
}

if(!BIN){
  console.log("\n⚠️  Postgres 가 없어서 돌리지 못했습니다 (initdb 를 못 찾았습니다).");
  console.log("   ⚠️ **통과로 치지 않습니다** — 이 검사는 실제 Postgres 가 있어야 뜻이 있습니다.");
  console.log("   apt-get install -y postgresql  또는  PATH 에 initdb 를 두세요.\n");
  process.exit(2);
}

try{
  start();
  psql("create database swtest", "postgres");
  console.log("\n── 마이그레이션이 실제로 돌아가는가");
  for(const f of ["db/test/00_stub_auth.sql",
                  "db/migrations/0001_init.sql",
                  "db/migrations/0002_schema_version.sql",
                  "db/migrations/0003_confirm_fee.sql",
                  "db/migrations/0004_move_state.sql",
                  "db/migrations/0005_account_claim.sql"]){
    let e = "";
    try{ psqlFile(f); }catch(err){ e = String(err.stderr || err.message).split("\n").slice(0,3).join(" "); }
    ok(f.replace("db/", "") + " 가 돈다", e === "", e);
  }
  ok("판 번호가 다섯까지 들어온다", psql("select count(*) from schema_version") === "5",
     psql("select count(*) from schema_version"));

  /* ⚠️⚠️ db/README.md 가 돌려 보라고 적은 바로 그 쿼리입니다 */
  const noRls = psql(
    "select coalesce(string_agg(t.tablename, ' '), '') from pg_tables t " +
    "join pg_class c on c.relname = t.tablename " +
    "where t.schemaname = 'public' and c.relrowsecurity = false");
  ok("RLS 가 안 켜진 표가 없다", noRls === "", noRls);

  /* ⚠️ 돈 칸에 로그인 사용자 권한이 **없어야** 합니다 */
  const feeGrant = psql(
    "select count(*) from information_schema.column_privileges " +
    "where table_name='deal' and grantee='authenticated' and privilege_type='UPDATE' " +
    "and column_name in ('fee','fee_total','fee_snap','paid')");
  ok("deal 의 돈 칸에 로그인 사용자 쓰기 권한이 없다", feeGrant === "0", feeGrant);
  const verGrant = psql(
    "select count(*) from information_schema.column_privileges " +
    "where table_name='provider' and grantee='authenticated' and privilege_type='UPDATE' " +
    "and column_name in ('verified','listed','id')");
  ok("provider 의 확인 배지 · 공개 여부에 쓰기 권한이 없다", verGrant === "0", verGrant);

  /* ── 씨앗 ──────────────────────────────────────────────────
     ⚠️ 지어낸 업체가 아닙니다 — **검사용 DB 안에서만** 살고 저장소
     데이터(js/data/providers.js)는 그대로 0곳입니다 (절대 규칙 1). */
  console.log("\n── 씨앗 넣기 (검사용 DB 안에서만)");
  psql(`
    insert into auth.users (id, email) values
      ('11111111-1111-1111-1111-111111111111','a@test'),
      ('22222222-2222-2222-2222-222222222222','b@test'),
      ('33333333-3333-3333-3333-333333333333','pv@test'),
      ('44444444-4444-4444-4444-444444444444','staff@test'),
      ('55555555-5555-5555-5555-555555555555','admin@test');
    insert into provider (id, name, listed) values ('pv-one','가나다','t'),('pv-two','라마바','t');
    insert into account (id, role, provider_id) values
      ('11111111-1111-1111-1111-111111111111','customer',null),
      ('22222222-2222-2222-2222-222222222222','customer',null),
      ('33333333-3333-3333-3333-333333333333','provider','pv-one'),
      ('44444444-4444-4444-4444-444444444444','staff',null),
      ('55555555-5555-5555-5555-555555555555','admin',null)
    /* ⚠️⚠️ 0005 의 트리거가 가입하는 순간 account 줄을 **이미** 만듭니다
       (역할은 customer 로 박혀 있습니다). 그래서 역할을 올리는 것은
       insert 가 아니라 **update** 입니다 — db/README.md 1-4 가 적어 둔
       update account set role='admin' 그대로입니다. */
    on conflict (id) do update set role = excluded.role,
                                   provider_id = excluded.provider_id;
    insert into request (id, no, user_id, side, name, tel, agree_at, state) values
      ('aaaaaaaa-0000-0000-0000-000000000001','SW-AAAA-0001','11111111-1111-1111-1111-111111111111','start','갑','01011110000',now(),'done'),
      ('aaaaaaaa-0000-0000-0000-000000000002','SW-AAAA-0002','22222222-2222-2222-2222-222222222222','start','을','01022220000',now(),'new');
    insert into assignment (request_id, provider_id, agree3rd_at) values
      ('aaaaaaaa-0000-0000-0000-000000000001','pv-one', now());
    insert into deal (id, request_id, provider_id, amount) values
      ('dddddddd-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','pv-one',10000000);
  `);
  ok("씨앗이 들어갔다", psql("select count(*) from request") === "2");

  console.log("\n── 제약 (constraints)");
  {
    /* ⚠️⚠️ **어느 자물쇠가 걸렸는지 구분합니다.** 처음에 그냥
       "막히는가" 만 봤더니, 제약을 빼 보아도 **트리거가 먼저 막아서**
       검사가 엉뚱한 까닭으로 통과했습니다 — 되돌려 보고 알았습니다.
       그래서 제약을 보려면 트리거를 **통과시킨 뒤**(관리자 세션 + 상위
       권한)에 제약만 남게 해 놓고, 에러 글까지 맞춰 봅니다. */
    const asAdminSuper = "select become('55555555-5555-5555-5555-555555555555'); ";
    let r = denied(asAdminSuper +
      "update deal set fee = 300000 where id='dddddddd-0000-0000-0000-000000000001'");
    ok("승인자 없이 수수료를 적을 수 없다 (제약)",
       r.no && /deal_fee_needs_approval/.test(r.why || ""), r.why);
    /* ⚠️⚠️ §13 — 입금액은 수수료가 먼저 확정돼 있어야 합니다 */
    r = denied(asAdminSuper +
      "update deal set paid = 1 where id='dddddddd-0000-0000-0000-000000000001'");
    ok("수수료 없이 입금액을 적을 수 없다 (제약)",
       r.no && /deal_paid_needs_fee/.test(r.why || ""), r.why);
    /* 트리거 쪽도 따로 봅니다 — 관리자가 아니면 돈 칸을 못 건드립니다 */
    r = denied("update deal set fee = 300000 where id='dddddddd-0000-0000-0000-000000000001'");
    ok("관리자 세션이 아니면 돈 칸을 못 건드린다 (트리거)",
       r.no && /관리자만/.test(r.why || ""), r.why);
    r = denied("update deal set amount = -1 where id='dddddddd-0000-0000-0000-000000000001'");
    ok("계약금액 음수를 막는다", r.no, r.why);
    /* ⚠️⚠️ 제17조 제2항 — 배정에 재동의 시각이 없으면 안 됩니다 */
    r = denied("insert into assignment (request_id, provider_id) values " +
               "('aaaaaaaa-0000-0000-0000-000000000002','pv-two')");
    ok("제3자 제공 동의 시각 없이 배정할 수 없다", r.no, r.why);
    r = denied("insert into request (no, side, name, tel, agree_at) values " +
               "('SW-AAAA-0001','start','병','010',now())");
    ok("접수번호가 겹칠 수 없다", r.no, r.why);
    /* 수수료 정책 — js/data/fee.js 의 amFeeBadPolicy() 와 같은 규칙 */
    const pol = "insert into fee_policy (provider_id, type, rate, vat, confirm_when, cycle";
    r = denied(pol + ") values ('pv-one','rate',100.01,'add','done','monthly')");
    ok("요율 100.01% 를 막는다 (경계 바로 위)", r.no, r.why);
    let a = allowed(pol + ", min_fee, max_fee) values ('pv-one','rate',100,'add','done','monthly',null,null)");
    ok("요율 100% 는 받는다 (경계)", a.yes, a.why);
    r = denied(pol + ", min_fee, max_fee) values ('pv-one','rate',3,'add','done','monthly',200,100)");
    ok("최소 > 최대 를 막는다", r.no, r.why);
    r = denied(pol + ", from_date, to_date) values ('pv-one','rate',3,'add','done','monthly','2026-12-01','2026-11-01')");
    ok("적용 시작일이 종료일보다 늦으면 막는다", r.no, r.why);
    r = denied("insert into settlement (provider_id, from_date, to_date) values ('pv-one','2026-12-01','2026-11-01')");
    ok("정산 기간이 뒤집히면 막는다", r.no, r.why);
  }

  console.log("\n── 트리거 — 업체가 스스로 못 켜는 것 (절대 규칙 1)");
  {
    const asPv = "set role authenticated; select become('33333333-3333-3333-3333-333333333333'); ";
    let r = denied(asPv + "update provider set verified = '{\"biz\":true}' where id='pv-one'");
    ok("업체가 확인 배지를 스스로 못 켠다", r.no, r.why);
    r = denied(asPv + "update provider set listed = false where id='pv-one'");
    ok("업체가 공개 여부를 못 바꾼다", r.no, r.why);
    r = denied(asPv + "update provider set id = 'pv-new' where id='pv-one'");
    ok("업체가 주소(id)를 못 바꾼다 (이미 색인된 주소)", r.no, r.why);
    const a = allowed(asPv + "update provider set name = '가나다 인테리어' where id='pv-one'");
    ok("업체가 자기 이름은 바꿀 수 있다", a.yes, a.why);
    r = denied(asPv + "update provider set name = 'x' where id='pv-two'");
    ok("업체가 **남의** 정보를 못 바꾼다 (RLS)", r.no || psql("select name from provider where id='pv-two'") === "라마바",
       psql("select name from provider where id='pv-two'"));
  }

  console.log("\n── ⚠️⚠️ RLS — 남의 것이 안 보이는가 (§8)");
  {
    function asUser(u, sql){
      return psql("set role authenticated; select become('" + u + "'); " + sql);
    }
    const A = "11111111-1111-1111-1111-111111111111";
    const B = "22222222-2222-2222-2222-222222222222";
    const PV= "33333333-3333-3333-3333-333333333333";
    const ST= "44444444-4444-4444-4444-444444444444";
    const AD= "55555555-5555-5555-5555-555555555555";

    ok("고객은 자기 신청 한 건만 본다",
       asUser(A, "select count(*) from request") === "1", asUser(A, "select count(*) from request"));
    ok("고객 A 에게 B 의 신청이 안 보인다",
       asUser(A, "select count(*) from request where no='SW-AAAA-0002'") === "0");
    ok("업체는 **배정된** 한 건만 본다",
       asUser(PV, "select count(*) from request") === "1", asUser(PV, "select count(*) from request"));
    ok("업체에게 배정 안 된 신청이 안 보인다",
       asUser(PV, "select count(*) from request where no='SW-AAAA-0002'") === "0");
    ok("직원은 둘 다 본다", asUser(ST, "select count(*) from request") === "2");
    ok("관리자는 둘 다 본다", asUser(AD, "select count(*) from request") === "2");

    /* ⚠️⚠️ 고객에게 수수료 표가 보이면 자기가 내는 돈으로 읽힙니다 */
    ok("고객에게 계약(돈)이 안 보인다", asUser(A, "select count(*) from deal") === "0");
    ok("고객에게 수수료 정책이 안 보인다", asUser(A, "select count(*) from fee_policy") === "0");
    ok("업체는 자기 계약을 본다", asUser(PV, "select count(*) from deal") === "1");
    ok("관리자는 계약을 본다", asUser(AD, "select count(*) from deal") === "1");

    /* 로그인 안 한 사람 */
    ok("로그인 안 한 사람(anon)은 신청을 아예 못 읽는다",
       denied("set role anon; select count(*) from request").no);
  }

  console.log("\n── ⚠️⚠️ 수수료를 확정하는 문이 하나인가 (§8 · §9 · §13)");
  {
    const D  = "dddddddd-0000-0000-0000-000000000001";
    const AD = "55555555-5555-5555-5555-555555555555";
    const PV = "33333333-3333-3333-3333-333333333333";
    const ST = "44444444-4444-4444-4444-444444444444";
    const snap = `'{"type":"rate","rate":3,"vat":"add","snapAt":"2026-10-08"}'::jsonb`;
    const proof= `'{"kind":"contract","at":"2026-10-08"}'::jsonb`;
    const call = (u, args) =>
      "set role authenticated; select become('" + u + "'); select confirm_fee('" + D + "'," + args + ")";

    /* ⚠️⚠️ **에러 글까지 맞춰 봅니다.** 그냥 "막히는가" 만 보면,
       confirm_fee 의 관리자 확인을 빼 보아도 **트리거가 먼저 막아서**
       검사가 통과합니다 — 되돌려 보고 알았습니다. 함수 자신의 자물쇠가
       걸렸는지를 보려면 **어느 글로 거절했는지**를 봐야 합니다. */
    let r = denied(call(PV, "300000,30000,330000," + snap + "," + proof + ",'x'"));
    ok("업체는 수수료를 확정할 수 없다 (함수가 먼저 막습니다)",
       r.no && /수수료 확정은 관리자만/.test(r.why || ""), r.why);
    r = denied(call(ST, "300000,30000,330000," + snap + "," + proof + ",'x'"));
    ok("직원도 수수료를 확정할 수 없다 (함수가 먼저 막습니다)",
       r.no && /수수료 확정은 관리자만/.test(r.why || ""), r.why);
    r = denied(call(AD, "300000,30000,330000," + snap + ",null,'x'"));
    ok("증빙 없이는 확정할 수 없다 (§9)", r.no, r.why);
    r = denied(call(AD, "300000,30000,330000,null," + proof + ",'x'"));
    ok("정책 사본 없이는 확정할 수 없다 (§9)", r.no, r.why);

    const a = allowed(call(AD, "300000,30000,330000," + snap + "," + proof + ",'증빙 확인'"));
    ok("관리자는 증빙과 사본을 주면 확정할 수 있다", a.yes, a.why);
    ok("확정액이 들어갔다", psql("select fee from deal where id='" + D + "'") === "300000");
    /* ⚠️⚠️ §8 "변경자, 변경일시" — 함수가 저절로 적습니다 */
    ok("승인자와 시각이 같이 적혔다",
       psql("select (fee_by is not null and fee_at is not null) from deal where id='" + D + "'") === "t");
    ok("상태가 정산 대기로 넘어갔다",
       psql("select state from request where no='SW-AAAA-0001'") === "fee_wait");
    /* ⚠️⚠️ 문이 하나라 **기록 없이 지나갈 길이 없습니다** */
    ok("감사 기록이 같이 남았다",
       psql("select count(*) from audit_log where obj_id='" + D + "' and to_state='fee_wait'") === "1");
    ok("기록에 변경자와 사유가 남았다",
       psql("select (by_user is not null and why='증빙 확인') from audit_log where to_state='fee_wait'") === "t");

    /* 두 번 확정 — 이미 fee_wait 이라 거절 */
    r = denied(call(AD, "999999,0,999999," + snap + "," + proof + ",'또'"));
    ok("두 번 확정할 수 없다 (상태가 이미 넘어갔습니다)", r.no, r.why);
  }

  console.log("\n── ⚠️⚠️ 가짜 정산 완료를 만들 수 없는가 (§13)");
  {
    const D = "dddddddd-0000-0000-0000-000000000001";
    const AD= "55555555-5555-5555-5555-555555555555";
    const PV= "33333333-3333-3333-3333-333333333333";
    const paid = (u, v, why) =>
      "set role authenticated; select become('" + u + "'); select mark_paid('" + D + "'," + v + "," + why + ")";

    let r = denied(paid(PV, "330000", "'x'"));
    ok("업체는 정산 완료로 못 넘긴다 (함수가 먼저 막습니다)",
       r.no && /정산 완료는 관리자만/.test(r.why || ""), r.why);
    r = denied(paid(AD, "null", "'x'"));
    ok("입금액 없이 정산 완료로 못 넘긴다", r.no, r.why);
    r = denied(paid(AD, "-1", "'x'"));
    ok("입금액 음수를 막는다", r.no, r.why);
    const a = allowed(paid(AD, "330000", "'입금 확인'"));
    ok("관리자가 입금액을 적으면 정산 완료가 된다", a.yes, a.why);
    ok("상태가 정산 완료다", psql("select state from request where no='SW-AAAA-0001'") === "fee_done");
    ok("입금 기록이 남았다",
       psql("select count(*) from audit_log where to_state='fee_done'") === "1");
    /* ⚠️⚠️ **0 은 값입니다** (부분환불 뒤 0원). 처음에 여기를
       `select 1` 로 적어 두었는데 그건 **아무것도 안 보는 검사**였습니다 —
       이 저장소가 여러 번 만든 "통과만 하고 아무것도 안 잡는 검사" 라
       실제로 0원을 넣어 봅니다. 둘째 계약을 세워서 확인합니다. */
    const D2 = "dddddddd-0000-0000-0000-000000000002";
    /* ⚠️ 블록 안에서 다시 정합니다 — 앞 블록의 const 는 여기서 안 보입니다
       (처음에 빠뜨려서 `snap is not defined` 로 검사가 멈췄습니다) */
    const snap = `'{"type":"rate","rate":3,"vat":"add","snapAt":"2026-10-08"}'::jsonb`;
    const proof= `'{"kind":"contract","at":"2026-10-08"}'::jsonb`;
    psql(`
      insert into request (id, no, user_id, side, name, tel, agree_at, state) values
        ('aaaaaaaa-0000-0000-0000-000000000003','SW-AAAA-0003',
         '11111111-1111-1111-1111-111111111111','start','정','01033330000',now(),'done');
      insert into deal (id, request_id, provider_id, amount) values
        ('${D2}','aaaaaaaa-0000-0000-0000-000000000003','pv-one',500000);
    `);
    const as2 = "set role authenticated; select become('" + AD + "'); ";
    allowed(as2 + "select confirm_fee('" + D2 + "',15000,1500,16500," + snap + "," + proof + ",'둘째')");
    const z = allowed(as2 + "select mark_paid('" + D2 + "',0,'환불 뒤 0원')");
    ok("입금액 0 도 적을 수 있다 (0 은 '적지 않은 것' 이 아닙니다)", z.yes, z.why);
    ok("0 을 적어도 정산 완료가 된다",
       psql("select state from request where no='SW-AAAA-0003'") === "fee_done");
    ok("0 이 그대로 저장된다 (null 이 아닙니다)",
       psql("select coalesce(paid::text,'NULL') from deal where id='" + D2 + "'") === "0");
  }

  console.log("\n── ⚠️⚠️ 감사 기록을 고치거나 지울 수 없는가 (§8)");
  {
    const AD = "55555555-5555-5555-5555-555555555555";
    const as = u => "set role authenticated; select become('" + u + "'); ";
    /* ⚠️⚠️ **갯수를 그냥 세지 않습니다.** 처음에 `=== "2"` 로 적어
       두었다가, 뒤에 검사를 하나 더하자 기록이 4줄이 되어 **멀쩡한
       스키마를 실패로** 잡았습니다 — 이 저장소가 "검사가 갯수를 그냥
       셌음" 으로 두 번 겪은 자리입니다. 전을 재고 **안 바뀌었는지**만
       봅니다. */
    const before = psql("select count(*) from audit_log");
    const sum    = psql("select coalesce(string_agg(why, '|' order by id), '') from audit_log");
    let r = denied(as(AD) + "update audit_log set why = '바꿔치기'");
    ok("관리자도 감사 기록을 못 고친다", r.no, r.why);
    r = denied(as(AD) + "delete from audit_log");
    ok("관리자도 감사 기록을 못 지운다", r.no, r.why);
    ok("기록의 수가 그대로다", psql("select count(*) from audit_log") === before, before);
    ok("기록의 내용도 그대로다 (한 글자도 안 바뀜)",
       psql("select coalesce(string_agg(why, '|' order by id), '') from audit_log") === sum);
    /* 정책 자체가 없어야 합니다 */
    ok("감사 기록에 고치거나 지우는 정책이 아예 없다",
       psql("select count(*) from pg_policies where tablename='audit_log' " +
            "and cmd in ('UPDATE','DELETE','ALL')") === "0");
  }

  console.log("\n── 환수는 갈아 치우지 않고 차액을 남긴다 (§9)");
  {
    const D = "dddddddd-0000-0000-0000-000000000001";
    const AD= "55555555-5555-5555-5555-555555555555";
    const as = u => "set role authenticated; select become('" + u + "'); ";
    let r = denied(as(AD) + "select clawback_fee('" + D + "',150000,'')");
    ok("사유 없이 환수할 수 없다", r.no, r.why);
    const a = allowed(as(AD) + "select clawback_fee('" + D + "',150000,'계약금액 절반 감액')");
    ok("환수액을 돌려준다 (30만 → 15만 = 15만)", a.yes && a.out === "150000", a.out || a.why);
    ok("확정했던 액과 지금 액이 기록에 둘 다 남았다",
       psql("select (data->>'was')||'/'||(data->>'now') from audit_log where why='계약금액 절반 감액'")
         === "300000/150000");
  }

  console.log("\n── ⚠️⚠️ 상태를 바꾸는 문 하나 (§8) — move_state()");
  {
    const A  = "11111111-1111-1111-1111-111111111111";
    const PV = "33333333-3333-3333-3333-333333333333";
    const ST = "44444444-4444-4444-4444-444444444444";
    const AD = "55555555-5555-5555-5555-555555555555";
    const as = u => "set role authenticated; select become('" + u + "'); ";
    /* 새 신청 하나 (검사용 DB 안에서만 삽니다) */
    const R = "aaaaaaaa-0000-0000-0000-000000000009";
    psql(`insert into request (id, no, user_id, side, name, tel, agree_at, state) values
      ('${R}','SW-AAAA-0009','${A}','start','무','01099990000',now(),'new');`);
    const mv = (u, to, ctx) =>
      as(u) + "select move_state('" + R + "','" + to + "'," + (ctx || "'{}'::jsonb") + ")";

    /* 길 자체가 없는 것 */
    let r = denied(mv(AD, "signed"));
    ok("갈 수 없는 길을 막는다", r.no && /갈 수 없는 길/.test(r.why || ""), r.why);
    /* 역할이 모자란 것 — ⚠️ 길이 없는 것과 **갈라서** 말해 줍니다 */
    r = denied(mv(PV, "check"));
    ok("역할이 모자란 것과 길이 없는 것을 갈라서 말한다",
       r.no && /으\)?로는 할 수 없습니다/.test(r.why || ""), r.why);
    /* ⚠️⚠️ 돈 상태는 이 문으로 못 갑니다 (§9 가 증빙과 정책 사본을
       더 받으라고 적었습니다).
       ⚠️⚠️ **위험한 자리는 `done → fee_wait` 입니다** — 그 길은 표에
       실제로 있어서, 이 막는 줄이 없으면 관리자가 **수수료를 확정하지
       않고 정산 대기를 만들** 수 있습니다 (§13 가짜 정산).
       처음에 `new → fee_wait` 으로 재 봤는데 그건 **길 표가 먼저
       막아서** 엉뚱한 까닭으로 통과했습니다 — 되돌려 보고 알았습니다. */
    {
      const RD = "aaaaaaaa-0000-0000-0000-000000000011";
      psql(`insert into request (id, no, user_id, side, name, tel, agree_at, state) values
        ('${RD}','SW-AAAA-0011','${A}','start','차','01077770000',now(),'done');`);
      const r2 = denied(as(AD) + "select move_state('" + RD + "','fee_wait'," +
        `'{"proof":"x","feeId":"y"}'::jsonb)`);
      ok("서비스 완료에서도 정산 대기로 못 넘긴다 (§13 가짜 정산)",
         r2.no && /confirm_fee/.test(r2.why || ""), r2.why);
      ok("그래서 수수료 없는 정산 대기가 만들어지지 않는다",
         psql("select state from request where id='" + RD + "'") === "done");
    }
    r = denied(mv(AD, "fee_wait"));
    ok("길 표에 없는 돈 상태도 막는다", r.no, r.why);

    let a = allowed(mv(ST, "check"));
    ok("직원은 정보 확인 중으로 옮길 수 있다", a.yes, a.why);
    /* ⚠️⚠️ §8 — 기록이 **저절로** 남습니다 */
    ok("감사 기록이 같이 남는다",
       psql("select count(*) from audit_log where obj='request' and obj_id='" + R + "'") === "1");
    ok("기록에 누가 · 어느 역할로 바꿨는지 남는다",
       psql("select by_user::text||'/'||by_role from audit_log where obj_id='" + R + "'")
         === ST + "/staff");

    /* ⚠️⚠️ 배정 = 제3자 제공 (제17조 제2항) */
    /* ⚠️ 둘을 갈라서 봅니다 — 처음에 `agree3rd` 를 **아예 안 넣고**
       제17조 메시지를 기다렸는데, 빠진 칸 검사가 먼저 걸렸습니다
       (둘 다 막는 것은 맞고 **씨앗이 틀렸습니다**). */
    r = denied(mv(AD, "assigned", `'{"providerId":"pv-one"}'::jsonb`));
    ok("동의 칸이 아예 없으면 배정하지 못한다",
       r.no && /agree3rd/.test(r.why || ""), r.why);
    r = denied(mv(AD, "assigned", `'{"providerId":"pv-one","agree3rd":false}'::jsonb`));
    ok("동의를 안 하셨으면 배정하지 못한다 (제17조 제2항)",
       r.no && /동의/.test(r.why || ""), r.why);
    r = denied(mv(AD, "assigned", `'{"agree3rd":true}'::jsonb`));
    ok("배정할 업체 없이 배정하지 못한다",
       r.no && /빠졌습니다/.test(r.why || ""), r.why);
    r = denied(mv(AD, "assigned", `'{"agree3rd":true,"providerId":"zzz"}'::jsonb`));
    ok("없는 업체로 배정하지 못한다", r.no && /없는 업체/.test(r.why || ""), r.why);

    a = allowed(mv(AD, "assigned", `'{"agree3rd":true,"providerId":"pv-one","why":"조건이 맞음"}'::jsonb`));
    ok("재동의와 업체가 있으면 배정한다", a.yes, a.why);
    ok("배정 줄이 같이 생긴다",
       psql("select count(*) from assignment where request_id='" + R + "'") === "1");
    /* ⚠️⚠️ 동의를 **시각으로** 남깁니다 — boolean 이면 "언제" 를 못 댑니다 */
    ok("배정 줄에 제3자 제공 동의 시각이 남는다",
       psql("select (agree3rd_at is not null) from assignment where request_id='" + R + "'") === "t");
    ok("신청에도 동의 시각이 남는다",
       psql("select (agree3rd_at is not null) from request where id='" + R + "'") === "t");
    ok("기록에 사유가 남는다",
       psql("select why from audit_log where obj_id='" + R + "' and to_state='assigned'") === "조건이 맞음");
    /* ⚠️ 동의 자체가 기록의 data 에 남습니다 (why 는 따로) */
    ok("기록의 data 에 동의와 업체가 남는다",
       psql("select (data->>'agree3rd')||'/'||(data->>'providerId') from audit_log " +
            "where obj_id='" + R + "' and to_state='assigned'") === "true/pv-one");

    /* 업체 수락 · 거절 */
    r = denied(as(AD) + "select answer_assignment('" + R + "',true,null)");
    ok("관리자가 업체 대신 수락할 수 없다", r.no && /업체만/.test(r.why || ""), r.why);
    a = allowed(as(PV) + "select answer_assignment('" + R + "',true,null)");
    ok("배정받은 업체는 수락할 수 있다", a.yes && a.out === "accepted", a.out || a.why);
    ok("배정 줄도 수락으로 바뀐다",
       psql("select state from assignment where request_id='" + R + "'") === "accepted");

    /* ⚠️ 거절은 **실패가 아니라 다시 확인**입니다 */
    const R2 = "aaaaaaaa-0000-0000-0000-000000000010";
    psql(`insert into request (id, no, user_id, side, name, tel, agree_at, state) values
      ('${R2}','SW-AAAA-0010','${A}','start','자','01088880000',now(),'check');`);
    allowed(as(AD) + "select move_state('" + R2 + "','assigned'," +
      `'{"agree3rd":true,"providerId":"pv-one"}'::jsonb)`);
    const no = allowed(as(PV) + "select answer_assignment('" + R2 + "',false,'지역을 못 갑니다')");
    ok("업체가 거절하면 실패가 아니라 다시 확인으로 돌아간다",
       no.yes && no.out === "check", no.out || no.why);
    ok("거절 사유가 배정 줄에 남는다",
       psql("select why from assignment where request_id='" + R2 + "'") === "지역을 못 갑니다");

    /* 고객이 자기 건을 취소 — 사유가 반드시 */
    r = denied(mv(A, "lost"));
    ok("사유 없이 취소하지 못한다", r.no && /빠졌습니다/.test(r.why || ""), r.why);
    a = allowed(mv(A, "lost", `'{"why":"다른 곳으로 결정"}'::jsonb`));
    ok("사유를 적으면 고객이 취소할 수 있다", a.yes, a.why);

    /* 끝난 건은 더 못 움직입니다 */
    r = denied(mv(AD, "check"));
    ok("취소된 건을 되살리는 길이 없다", r.no, r.why);
  }

  console.log("\n── 길 표가 화면과 같은가 (deal_move ↔ AM_DEAL_MOVE)");
  {
    global.window = global.window || {};
    const W2 = {};
    global.window = W2;
    eval(fs.readFileSync(path.join(ROOT, "js/data/deal.js"), "utf8"));
    const want = [];
    for(const m of W2.AM_DEAL_MOVE)
      for(const r of m[2])
        want.push(m[0] + ">" + m[1] + ">" + r + ">" + (m[3] || []).join("+"));
    const got = psql(
      "select coalesce(string_agg(from_state||'>'||to_state||'>'||role||'>'||" +
      "array_to_string(needs,'+'), ',' order by from_state, to_state, role), '') from deal_move")
      .split(",").filter(Boolean);
    ok("길의 수가 같다", got.length === want.length, got.length + " vs " + want.length);
    const miss = want.filter(x => got.indexOf(x) < 0);
    ok("길이 하나하나 같다", miss.length === 0, miss.slice(0, 5));
  }

  console.log("\n── 상태값이 화면과 같은가 (js/data/deal.js · fee.js)");
  {
    global.window = {};
    for(const f of ["js/data/deal.js", "js/data/fee.js"])
      eval(fs.readFileSync(path.join(ROOT, f), "utf8"));
    const W = global.window;
    function enumVals(t){
      return psql("select string_agg(e.enumlabel, ' ' order by e.enumsortorder) " +
        "from pg_enum e join pg_type t on t.oid=e.enumtypid where t.typname='" + t + "'");
    }
    ok("신청 상태 열둘이 같다",
       enumVals("deal_state") === W.AM_DEAL_ST.map(x => x.key).join(" "), enumVals("deal_state"));
    ok("역할 넷이 같다",
       enumVals("app_role") === W.AM_ROLES.map(x => x.key).join(" "), enumVals("app_role"));
    ok("수익모델 여섯이 같다",
       enumVals("fee_type") === W.AM_FEE_TYPE.map(x => x.key).join(" "), enumVals("fee_type"));
  }


  console.log("\n── 0005 가입하면 줄이 생기는가 (역할은 못 고릅니다)");
  {
    const as = u => "set role authenticated; select become('" + u + "'); ";

    /* 트리거가 account 줄을 만들었는가 — 씨앗이 auth.users 에 다섯을
       넣었으니 다섯 줄이 있어야 합니다 */
    ok("auth.users 다섯에 account 줄이 다 있다",
       psql("select count(*) from account") === "5", psql("select count(*) from account"));

    /* ⚠️⚠️ 가입할 때 역할을 **고를 수 없어야** 합니다. raw_user_meta_data
       에 admin 을 적어 보냅니다 — 화면에서 보내는 값입니다. */
    psql("insert into auth.users (id, email, raw_user_meta_data) values " +
         "('66666666-6666-6666-6666-666666666666','evil@test'," +
         "'{\"role\":\"admin\",\"name\":\"나쁜 사람\"}'::jsonb)");
    const r6 = psql("select role::text from account where id='66666666-6666-6666-6666-666666666666'");
    ok("가입하면서 역할을 admin 으로 적어 보내도 customer 다", r6 === "customer", r6);
    const n6 = psql("select name from account where id='66666666-6666-6666-6666-666666666666'");
    ok("이름은 받아 적는다", n6 === "나쁜 사람", n6);

    /* 두 번 돌려도 안전한가 (마이그레이션을 다시 돌리는 일이 있습니다) */
    let twice = "";
    try{ psqlFile("db/migrations/0005_account_claim.sql"); }
    catch(e){ twice = String(e.stderr || e.message).split("\n").slice(0,2).join(" "); }
    ok("0005 를 두 번 돌려도 터지지 않는다", twice === "", twice);
  }

  console.log("\n── 0005 신청하신 분이 자기 배정을 보는가 (§10 · 제17조)");
  {
    const as = u => "set role authenticated; select become('" + u + "'); ";
    const A = "11111111-1111-1111-1111-111111111111";   /* aaaa…0001 의 주인 */
    const B = "22222222-2222-2222-2222-222222222222";   /* 남 */
    const mine = allowed(as(A) + "select provider_id from assignment");
    ok("내 배정의 업체가 보인다", mine.yes && mine.out === "pv-one", mine.out || mine.why);
    const other = allowed(as(B) + "select count(*) from assignment");
    ok("남의 배정은 안 보인다", other.yes && other.out === "0", other.out || other.why);

    /* ⚠️⚠️ 배정은 보여도 **수수료 표와 계약은 그대로 안 보여야** 합니다 */
    const f = allowed(as(A) + "select count(*) from fee_policy");
    ok("고객에게 수수료 정책은 안 보인다", f.yes && f.out === "0", f.out || f.why);
    const d = allowed(as(A) + "select count(*) from deal");
    ok("고객에게 계약은 안 보인다", d.yes && d.out === "0", d.out || d.why);
  }

  console.log("\n── 0005 신청번호로 내 것으로 (claim_request · §10)");
  {
    const as = u => "set role authenticated; select become('" + u + "'); ";
    const C = "66666666-6666-6666-6666-666666666666";   /* 방금 가입한 사람 */
    const B = "22222222-2222-2222-2222-222222222222";

    /* 로그인 없이 넣은 신청 하나 (user_id 가 비어 있습니다) */
    psql("insert into request (id,no,side,name,tel,agree_at) values " +
         "('bbbbbbbb-0000-0000-0000-000000000001','SW-ABCD-2345','start','병','031-000-1234',now())");

    /* ⚠️⚠️ 번호만 맞고 연락처가 틀리면 안 됩니다 */
    const wrongTel = denied(as(C) + "select claim_request('SW-ABCD-2345','01099998888')");
    ok("번호는 맞고 연락처가 틀리면 거절한다", wrongTel.no, wrongTel.why);

    /* ⚠️⚠️ 없는 번호와 틀린 연락처가 **같은 말**로 거절돼야 합니다 —
       갈라 주면 번호가 있는지를 확인해 가며 긁을 수 있습니다 */
    const noSuch = denied(as(C) + "select claim_request('SW-ZZZZ-9999','01099998888')");
    ok("없는 번호도 거절한다", noSuch.no, noSuch.why);
    ok("둘이 같은 말로 거절한다",
       noSuch.no && wrongTel.no && noSuch.why === wrongTel.why,
       [noSuch.why, wrongTel.why]);

    /* 뺀 글자가 섞인 번호 */
    const bad32 = denied(as(C) + "select claim_request('SW-ABIO-2345','0310001234')");
    ok("I·L·O·U 가 섞인 번호를 받지 않는다", bad32.no, bad32.why);

    /* ⚠️ 하이픈이 섞인 연락처는 **같은 번호**입니다 */
    const beforeAudit = psql("select count(*) from audit_log");
    const got = allowed(as(C) + "select claim_request('sw abcd 2345','031 000 1234')");
    ok("소문자 · 띄어쓰기 · 하이픈이 섞여도 알아본다",
       got.yes && got.out === "bbbbbbbb-0000-0000-0000-000000000001", got.out || got.why);
    const owner = psql("select user_id::text from request where no='SW-ABCD-2345'");
    ok("신청이 그 사람 것이 되었다", owner === C, owner);

    /* §8 — 중요한 변경은 누가 언제. ⚠️ 갯수를 박아 두지 않고 **전을
       재서 늘었는지**만 봅니다 (이 저장소가 두 번 겪은 자리입니다). */
    const afterAudit = psql("select count(*) from audit_log");
    ok("감사 기록이 한 줄 늘었다",
       Number(afterAudit) === Number(beforeAudit) + 1, beforeAudit + " → " + afterAudit);

    /* ⚠️⚠️ 이미 남의 것이 된 신청은 못 가져갑니다 */
    const steal = denied(as(B) + "select claim_request('SW-ABCD-2345','0310001234')");
    ok("남의 것이 된 신청은 못 가져간다", steal.no, steal.why);

    /* 내가 이미 가진 것을 또 눌러도 터지지 않습니다 (두 번 누름) */
    const again = allowed(as(C) + "select claim_request('SW-ABCD-2345','0310001234')");
    ok("내 것을 또 눌러도 터지지 않는다", again.yes, again.why);

    /* ⚠️ 로그인하지 않은 쪽(anon)에게는 **권한 자체가 없어야** 합니다 */
    const anonCan = psql(
      "select count(*) from information_schema.routine_privileges " +
      "where routine_name='claim_request' and grantee='anon'");
    ok("anon 에게 claim_request 권한이 없다", anonCan === "0", anonCan);

    /* 로그인하지 않은 상태로 부르면 함수가 스스로 거절합니다 */
    const noUid = denied("set role authenticated; select become(null); " +
                         "select claim_request('SW-ABCD-2345','0310001234')");
    ok("로그인 없이 부르면 거절한다", noUid.no, noUid.why);
  }

  console.log("\n── 되돌리기 파일이 실수로 안 돌아가는가");
  {
    const down = fs.readFileSync(path.join(ROOT, "db/migrations/0001_init_down.sql"), "utf8");
    const live = down.split("\n").filter(l => l.trim() && !l.trim().startsWith("--"));
    /* ⚠️⚠️ 통째로 돌아가는 되돌리기 파일은 언젠가 실수로 운영에서
       돌아갑니다. 전부 주석이어야 합니다. */
    ok("되돌리기 파일에 바로 도는 줄이 없다", live.length === 0, live.slice(0, 3));
  }
}catch(e){
  bad++;
  console.log("\n❌ 검사가 도중에 멈췄습니다 — " + String(e.stderr || e.message).split("\n").slice(0,5).join("\n"));
}finally{
  stop();
}

console.log("\n" + (bad ? "❌ " + bad + "/" + ran + " 실패" : "✅ " + ran + "개 전부 통과") + "\n");
process.exit(bad ? 1 : 0);
