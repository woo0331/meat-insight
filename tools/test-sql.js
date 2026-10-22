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
  /* ⚠️ 마이그레이션 목록은 한 고데입니다 — 아래 "판 번호" 검사가
     이 길이를 그대로 씁니다 (수를 두 곳에 적으면 어긋납니다).
     ⚠️ 첫 줄은 검사용 가짜 auth 라 판 번호에 안 들어갑니다. */
  const MIGS = ["db/migrations/0001_init.sql",
                  "db/migrations/0002_schema_version.sql",
                  "db/migrations/0003_confirm_fee.sql",
                  "db/migrations/0004_move_state.sql",
                  "db/migrations/0005_account_claim.sql",
                  /* ⚠️⚠️ 0006 은 **따라잡기**용입니다 — 0001 · 0004 에 이미
                     보류가 들어 있어서 여기서는 **아무 일도 안 나야** 맞습니다.
                     돌려 보는 까닭은 두 번 돌려도 안전한지를 재보는 것입니다
                     (add value if not exists · on conflict do nothing).
                     ⚠️ 트랜잭션으로 감지 않습니다 — 감으면 새 enum 값을 같은
                     트랜잭션에서 못 써서 터집니다. */
                  "db/migrations/0006_hold_state.sql",
                  /* 2차 — 계약 줄 · 업체 등록/승인 · 수수료 정책 */
                  "db/migrations/0007_deal_provider_fee.sql",
                  /* 0008 — 견적 제출 · 수정 · 철회 + 고객의 선택 (§4 · §6).
                     ⚠️ 새 표(quote)와 문 셋입니다 — 아래 블록이 끝까지
                     눌러 봅니다. */
                  "db/migrations/0008_quote.sql",
                  /* ⚠️ 0009 — 신청 하나에 서비스 여러 개 (2026-10-17 §6 · §7).
                     `request_item` 과 항목별 배정이 여기 있습니다. */
                  "db/migrations/0009_request_item.sql",
                  /* ⚠️ 0010 — 회원 계정에 남는 임시저장 · 체크리스트
                     (2026-10-18 §6-2 · §9) */
                  "db/migrations/0010_user_state.sql",
                  /* ⚠️ 0011 — 신청에 붙는 사진 · 서류 (2026-10-18 §7-3 · §15) */
                  "db/migrations/0011_request_photo.sql",
                  /* ⚠️ 0012 — 담당자 · 배정 가능 여부 · 열람 이력 · 수익상품
                     (2026-10-22 오픈 전 전수검사 P0 ③④⑤⑦).
                     ⚠️⚠️ **배정 트리거가 여기서 생깁니다** — 아래 씨앗의
                     업체에 assignable 을 켜 두지 않으면 **그 뒤의 모든
                     배정 검사가 "아직 배정할 수 없는 업체" 로** 떨어집니다
                     (검사가 아니라 씨앗이 틀린 것이 됩니다). */
                  "db/migrations/0012_owner_assignable_offer.sql",
                  /* ⚠️ 0013 — 업체 담당자(별도 표) + 기간별 정산
                     (2026-10-22 전수검사 P1 ⑬⑭).
                     ⚠️⚠️ 담당자를 `provider` 가 아니라 **따로** 둔 까닭 —
                     0001 의 GRANT 가 표째라 거기 직통 번호를 넣으면
                     로그인한 손님 전부가 읽습니다. 아래 블록이 그것을
                     눌러 봅니다 (고객 토큰으로 0줄). */
                  "db/migrations/0013_provider_contact_settlement.sql"];
  for(const f of ["db/test/00_stub_auth.sql"].concat(MIGS)){
    let e = "";
    try{ psqlFile(f); }catch(err){ /* ⚠️⚠️ NOTICE 가 먼저 쏟아져서 앞 세 줄만 보면 **진짜
         까닭이 안 보입니다** — 0009 에서 실제로 그랬습니다. ERROR 줄을
         먼저 찾고, 없을 때만 앞쪽을 냅니다. */
      const all = String(err.stderr || err.message).split("\n");
      const hit = all.filter(x => /ERROR|치명|FATAL/.test(x));
      e = (hit.length ? hit : all.filter(Boolean).slice(0,3)).join(" "); }
    ok(f.replace("db/", "") + " 가 돈다", e === "", e);
  }
  /* ⚠️ 수를 손으로 적지 마세요 — 마이그레이션을 하나 더할 때마다 여기도
     고쳐야 하고, 안 고치면 **멀줦한 것을 실패로** 잡습니다
     (이 저장소가 "감사 기록을 갯수로 셈" 으로 겪은 자리). 돌린 파일 수를 씁니다. */
  ok("판 번호가 돌린 만큼 들어온다",
     psql("select count(*) from schema_version") === String(MIGS.length),
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
    /* ⚠️⚠️ **assignable 을 켜 둡니다** (0012). 안 켜면 배정 트리거가
       막아서 **아래 배정 · 계약 · 수수료 검사가 통째로** "아직 배정할 수
       없는 업체" 로 떨어집니다 — 그건 코드가 아니라 **씨앗이 틀린**
       것입니다 (이 저장소가 영업기간 · 가격 씨앗에서 겪은 자리).
       ⚠️ 꺼진 쪽은 아래 "배정 가능으로 켜지 않은 업체" 블록이 따로 세웁니다. */
    insert into provider (id, name, listed, assignable) values
      ('pv-one','가나다','t','t'),('pv-two','라마바','t','t');
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

    /* ══ 보류 (2026-10-09 §8-3) ══════════════════════════════════
       ⚠️⚠️ 보류는 **끝이 아닙니다** — 다시 진행할 수 있어야 보류이고,
       못 돌아오면 이름만 다른 취소입니다. 그래서 들어가는 것과
       **나오는 것**을 둘 다 눌러 봅니다. */
    {
      const RH = "aaaaaaaa-0000-0000-0000-000000000012";
      psql(`insert into request (id, no, user_id, side, name, tel, agree_at, state) values
        ('${RH}','SW-AAAA-0012','${A}','start','카','01066660000',now(),'check');`);
      const mvh = (u, to, ctx) =>
        as(u) + "select move_state('" + RH + "','" + to + "'," + (ctx || "'{}'::jsonb") + ")";

      /* ⚠️ 사유 없이 보류하면 왜 멈췄는지가 안 남습니다 (§8 기록) */
      let h = denied(mvh(ST, "hold"));
      ok("사유 없이 보류하지 못한다", h.no && /why/.test(h.why || ""), h.why);

      h = allowed(mvh(ST, "hold", `'{"why":"사장님이 다음 달에 다시 보자고 하셨습니다"}'::jsonb`));
      ok("사유를 적으면 보류할 수 있다", h.yes, h.why);
      ok("상태가 보류로 바뀌었다",
         psql("select state from request where id='" + RH + "'") === "hold");

      /* ⚠️⚠️ **보류에서 돈 상태로 가는 길이 없어야 합니다** */
      h = denied(mvh(AD, "fee_wait", `'{"proof":"x","feeId":"y"}'::jsonb`));
      ok("보류에서 정산으로 넘어가지 못한다", h.no, h.why);
      /* ⚠️ 멈췄던 자리로 바로 되돌아가지 않습니다 — 다시 확인부터 */
      h = denied(mvh(ST, "assigned", `'{"providerId":"pv-one","agree3rd":true}'::jsonb`));
      ok("보류에서 배정으로 바로 가지 못한다", h.no, h.why);

      h = allowed(mvh(ST, "check"));
      ok("보류에서 다시 확인으로 돌아온다 (끝이 아닙니다)", h.yes, h.why);
      ok("상태가 다시 확인 중이다",
         psql("select state from request where id='" + RH + "'") === "check");
      /* ⚠️ 보류도 기록이 남습니다 — 들어갈 때 하나 · 나올 때 하나 */
      ok("보류도 감사 기록이 남는다",
         psql("select count(*) from audit_log where obj='request' and obj_id='" + RH + "'") === "2");

      /* ⚠️⚠️ **계약 뒤로는 보류가 없습니다** (§10-3) */
      const RS = "aaaaaaaa-0000-0000-0000-000000000013";
      psql(`insert into request (id, no, user_id, side, name, tel, agree_at, state) values
        ('${RS}','SW-AAAA-0013','${A}','start','타','01055550000',now(),'signed');`);
      const hs = denied(as(AD) + "select move_state('" + RS + "','hold','{\"why\":\"x\"}'::jsonb)");
      ok("계약 완료에서는 보류하지 못한다 (돈이 얽히면 취소 · 환수)",
         hs.no && /갈 수 없는 길/.test(hs.why || ""), hs.why);
    }
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

  /* ══ 0007 — 2차 "수익을 기록한다" ════════════════════════════════
     ⚠️⚠️ **0003 이 만든 문에 길이 없었습니다.** `confirm_fee(p_deal …)`
     는 `deal` 한 줄을 받아야 하는데 그 줄을 만드는 길이 없었습니다 —
     상태는 "계약 완료" 인데 `deal` 표는 비어서 **확정할 대상이
     없었습니다.** 여기서는 신청 하나를 **접수부터 정산 완료까지**
     끝까지 밀어 봅니다. */
  console.log("\n── ⚠️⚠️ 0007 계약 줄이 생기는가 — 끝까지 밀어 봅니다");
  {
    const A  = "11111111-1111-1111-1111-111111111111";
    const PV = "33333333-3333-3333-3333-333333333333";
    const ST = "44444444-4444-4444-4444-444444444444";
    const AD = "55555555-5555-5555-5555-555555555555";
    const as = u => "set role authenticated; select become('" + u + "'); ";
    const R = "aaaaaaaa-0000-0000-0000-000000000021";
    psql(`insert into request (id, no, user_id, side, name, tel, agree_at, state) values
      ('${R}','SW-AAAA-0021','${A}','start','파','01021210000',now(),'new');`);
    const mv = (u, to, ctx) =>
      as(u) + "select move_state('" + R + "','" + to + "'," + (ctx || "'{}'::jsonb") + ")";

    /* 접수 → 확인 → 배정(제17조) → 수락 → 상담 → 견적 → 협의 */
    psql(mv(ST, "check"));
    psql(mv(ST, "assigned", `'{"providerId":"pv-one","agree3rd":true}'::jsonb`));
    psql(as(PV) + "select answer_assignment('" + R + "', true)");
    psql(mv(PV, "consult"));
    psql(mv(PV, "quoted"));
    psql(mv(PV, "nego"));
    ok("협의까지 왔다", psql("select state from request where id='" + R + "'") === "nego");
    /* ⚠️ 여기까지는 계약 줄이 **없어야** 합니다 */
    ok("계약 전에는 계약 줄이 없다",
       psql("select count(*) from deal where request_id='" + R + "'") === "0");

    /* 계약금액 없이 계약 완료 — 길 표의 needs 가 막습니다 */
    let r = denied(mv(AD, "signed"));
    ok("계약금액 없이는 계약 완료가 안 된다",
       r.no && /같이 적어야/.test(r.why || ""), r.why);

    let a = allowed(mv(AD, "signed", `'{"amount":10000000}'::jsonb`));
    ok("계약 완료로 갈 수 있다", a.yes, a.why);
    /* ⚠️⚠️ **이 줄이 0007 의 전부입니다** — 없으면 수수료를 확정할
       대상이 영영 생기지 않습니다. */
    ok("계약 완료에 계약 줄이 같이 생긴다",
       psql("select count(*) from deal where request_id='" + R + "'") === "1");
    ok("계약금액 · 업체 · 계약 시각이 적힌다",
       psql(`select amount::text||'/'||provider_id||'/'||(signed_at is not null)::text
               from deal where request_id='` + R + "'") === "10000000/pv-one/true");

    /* ⚠️ 수락한 업체로 붙었는가 — 지어내지 않습니다 */
    psql(mv(PV, "done"));
    ok("서비스 완료 시각이 적힌다",
       psql("select (done_at is not null)::text from deal where request_id='" + R + "'") === "true");

    const D = psql("select id::text from deal where request_id='" + R + "'");

    /* ⚠️⚠️ 수수료 확정 — 증빙 · 정책 사본이 없으면 거절 (§9) */
    r = denied(as(AD) + "select confirm_fee('" + D + "',300000,30000,330000," +
      `'{"type":"rate","rate":3}'::jsonb, null)`);
    ok("증빙 없이는 수수료를 확정할 수 없다",
       r.no && /증빙/.test(r.why || ""), r.why);
    /* ⚠️ 업체는 자기 수수료를 확정할 수 없습니다 (§8 교차 확인) */
    r = denied(as(PV) + "select confirm_fee('" + D + "',300000,30000,330000," +
      `'{"type":"rate","rate":3}'::jsonb,'{"by":"세금계산서"}'::jsonb)`);
    ok("업체는 자기 수수료를 확정할 수 없다",
       r.no && /관리자만/.test(r.why || ""), r.why);

    a = allowed(as(AD) + "select confirm_fee('" + D + "',300000,30000,330000," +
      `'{"type":"rate","rate":3}'::jsonb,'{"by":"세금계산서"}'::jsonb,'3% 적용')`);
    ok("관리자는 수수료를 확정할 수 있다", a.yes, a.why);
    ok("정산 대기로 넘어간다",
       psql("select state from request where id='" + R + "'") === "fee_wait");
    /* ⚠️⚠️ 확정했으면 **누가 언제** 가 반드시 같이 있습니다 (제약) */
    ok("확정자 · 확정 시각이 같이 적힌다",
       psql("select (fee_by is not null and fee_at is not null)::text from deal where id='" + D + "'")
         === "true");

    /* ⚠️⚠️ 입금 확인 */
    a = allowed(as(AD) + "select mark_paid('" + D + "',330000,'입금 확인')");
    ok("입금을 확인하면 정산 완료가 된다",
       a.yes && psql("select state from request where id='" + R + "'") === "fee_done", a.why);

    /* ⚠️⚠️ 환수는 갈아 치우지 않고 **차액을 기록**합니다 */
    a = allowed(as(AD) + "select clawback_fee('" + D + "',100000,'부분 환불')");
    ok("환수하면 차액이 돌아온다", a.yes && a.out === "200000", a.why || a.out);
    ok("환수 기록이 남는다",
       psql(`select (data->>'back') from audit_log
              where obj='deal' and obj_id='` + D + "' order by at desc limit 1") === "200000");

    /* ⚠️⚠️ 한 신청에 계약은 **하나**입니다 — 두 줄이 생기면 수수료를
       어느 줄에 확정할지 갈립니다 */
    r = denied(`insert into deal (request_id, provider_id, amount)
                values ('` + R + "','pv-two',1)");
    ok("한 신청에 계약 줄이 둘 생기지 않는다", r.no, r.why);
  }

  console.log("\n── ⚠️⚠️ 0007 계약 줄을 아무 업체로나 만들지 않는가");
  {
    const A  = "11111111-1111-1111-1111-111111111111";
    const AD = "55555555-5555-5555-5555-555555555555";
    const as = u => "set role authenticated; select become('" + u + "'); ";
    /* 배정이 **하나도 없는** 건 — 지어내지 않고 거절해야 합니다 */
    const R2 = "aaaaaaaa-0000-0000-0000-000000000022";
    psql(`insert into request (id, no, user_id, side, name, tel, agree_at, state) values
      ('${R2}','SW-AAAA-0022','${A}','start','하','01022230000',now(),'nego');`);
    let r = denied(as(AD) + "select move_state('" + R2 + "','signed','{\"amount\":100}'::jsonb)");
    ok("배정이 없으면 계약을 지어내지 않는다",
       r.no && /배정된 업체가 없어/.test(r.why || ""), r.why);
    ok("그래서 상태도 안 바뀐다",
       psql("select state from request where id='" + R2 + "'") === "nego");

    /* 배정이 **둘**인데 아무도 수락 안 한 건 — 고르라고 해야 합니다 */
    psql(`insert into assignment (request_id, provider_id, agree3rd_at) values
      ('${R2}','pv-one',now()),('${R2}','pv-two',now());`);
    r = denied(as(AD) + "select move_state('" + R2 + "','signed','{\"amount\":100}'::jsonb)");
    ok("배정이 여럿이면 어느 업체인지 고르라고 한다",
       r.no && /골라 주세요/.test(r.why || ""), r.why);
    /* 배정 안 된 업체를 적어 보면 거절 */
    r = denied(as(AD) + "select move_state('" + R2 +
      "','signed','{\"amount\":100,\"providerId\":\"pv-none\"}'::jsonb)");
    ok("배정되지 않은 업체로는 계약을 못 만든다",
       r.no && /배정되지 않은/.test(r.why || ""), r.why);
    /* 골라 주면 됩니다 */
    const a = allowed(as(AD) + "select move_state('" + R2 +
      "','signed','{\"amount\":100,\"providerId\":\"pv-two\"}'::jsonb)");
    ok("골라 주면 그 업체로 계약이 생긴다",
       a.yes && psql("select provider_id from deal where request_id='" + R2 + "'") === "pv-two", a.why);
  }

  console.log("\n── ⚠️⚠️ 0007 업체 등록 · 승인 (§6 · §7)");
  {
    const A  = "11111111-1111-1111-1111-111111111111";
    const PV = "33333333-3333-3333-3333-333333333333";
    const ST = "44444444-4444-4444-4444-444444444444";
    const AD = "55555555-5555-5555-5555-555555555555";
    const as = u => "set role authenticated; select become('" + u + "'); ";
    const D  = `'{"subs":["interior"],"regions":["gyeonggi"],"industries":["cafe"]}'::jsonb`;

    /* ⚠️⚠️ 표에 insert 권한을 주지 않았습니다 — 문으로만 들어갑니다 */
    let r = denied(as(AD) + "insert into provider (id,name) values ('x-direct','직접')");
    ok("표에 직접 넣는 길이 없다 (문으로만)", r.no, r.why);

    r = denied(as(PV) + "select save_provider('x-one','가','" + "" + "'::jsonb)".replace("''::jsonb","{}'::jsonb"));
    ok("업체 자신은 다른 업체를 등록할 수 없다", r.no, r.why);

    /* 주소가 될 값 — 한글 · 대문자 · 밑줄은 거절 */
    r = denied(as(ST) + "select save_provider('가나다','가나다'," + D + ")");
    ok("주소에 한글을 못 쓴다", r.no && /영문 소문자/.test(r.why || ""), r.why);
    r = denied(as(ST) + "select save_provider('X_One','가나다'," + D + ")");
    ok("주소에 대문자 · 밑줄을 못 쓴다", r.no && /영문 소문자/.test(r.why || ""), r.why);
    /* ⚠️⚠️ 하는 일이 비면 아무 분류에도 안 걸립니다 */
    r = denied(as(ST) + "select save_provider('x-one','가나다','{}'::jsonb)");
    ok("하는 일이 비면 거절한다", r.no && /하는 일/.test(r.why || ""), r.why);

    let a = allowed(as(ST) + "select save_provider('x-one','가나다 인테리어'," + D + ",'영업에서 받아 옴')");
    ok("직원은 업체를 등록할 수 있다", a.yes, a.why);
    ok("등록 기록이 남는다",
       psql("select to_state from audit_log where obj='provider' and obj_id='x-one' order by at desc limit 1")
         === "created");
    /* ⚠️⚠️ **등록만으로는 공개되지 않습니다** — 승인이 따로입니다 */
    ok("등록만으로는 공개되지 않는다 (listed=false)",
       psql("select listed::text from provider where id='x-one'") === "false");
    ok("등록만으로는 확인 배지가 안 켜진다",
       psql("select verified::text from provider where id='x-one'") === "{}");

    /* 다시 부르면 고쳐집니다 (두 줄이 안 생깁니다) */
    a = allowed(as(ST) + "select save_provider('x-one','가나다 인테리어(이전)'," + D + ")");
    ok("다시 부르면 고쳐진다 (줄이 둘 안 생긴다)",
       a.yes && psql("select count(*) from provider where id='x-one'") === "1", a.why);

    /* ⚠️⚠️ 승인은 **관리자만** — 직원이 자기가 등록하고 자기가 켜면
       교차 확인이 없습니다 */
    r = denied(as(ST) + "select approve_provider('x-one', true)");
    ok("직원은 공개 · 확인 배지를 못 켠다", r.no && /관리자만/.test(r.why || ""), r.why);
    r = denied(as(PV) + "select approve_provider('pv-one', true)");
    ok("업체 자신도 못 켠다", r.no && /관리자만/.test(r.why || ""), r.why);

    a = allowed(as(AD) + `select approve_provider('x-one', true, '{"biz":true}'::jsonb, '서류 확인')`);
    ok("관리자는 공개하고 배지를 켤 수 있다",
       a.yes && psql("select listed::text||'/'||(verified->>'biz') from provider where id='x-one'")
         === "true/true", a.why);
    ok("승인 기록이 남는다",
       psql(`select from_state||'→'||to_state from audit_log
              where obj='provider' and obj_id='x-one' order by at desc limit 1`) === "hidden→listed");
    /* ⚠️ null 은 "안 건드림" 입니다 — false 와 갈라 봅니다 */
    a = allowed(as(AD) + "select approve_provider('x-one', null, null, '아무것도 안 바꿈')");
    ok("null 은 안 건드린다 (false 와 다릅니다)",
       a.yes && psql("select listed::text from provider where id='x-one'") === "true", a.why);
    a = allowed(as(AD) + "select approve_provider('x-one', false, null, '내림')");
    ok("false 는 실제로 내린다",
       a.yes && psql("select listed::text from provider where id='x-one'") === "false", a.why);
  }

  console.log("\n── ⚠️⚠️ 0007 수수료 정책 (§6 · §9)");
  {
    const ST = "44444444-4444-4444-4444-444444444444";
    const AD = "55555555-5555-5555-5555-555555555555";
    const as = u => "set role authenticated; select become('" + u + "'); ";

    let r = denied(as(ST) + `select save_fee_policy('pv-one','{"type":"rate","rate":3}'::jsonb)`);
    ok("정책은 직원이 못 만든다", r.no && /관리자만/.test(r.why || ""), r.why);
    r = denied(as(AD) + `select save_fee_policy('pv-none','{"type":"rate","rate":3}'::jsonb)`);
    ok("없는 업체에는 정책을 못 만든다", r.no && /없는 업체/.test(r.why || ""), r.why);
    /* ⚠️ 제약은 0001 이 들고 있습니다 — 여기서 또 적지 않고 **그것이
       실제로 막는지**만 봅니다 */
    r = denied(as(AD) + `select save_fee_policy('pv-one','{"type":"rate","rate":200}'::jsonb)`);
    ok("요율 100% 넘는 정책은 제약이 막는다",
       r.no && /fee_rate_range/.test(r.why || ""), r.why);
    r = denied(as(AD) + `select save_fee_policy('pv-one','{"type":"rate","rate":3,"minFee":500000,"maxFee":100000}'::jsonb)`);
    ok("최소가 최대보다 큰 정책은 제약이 막는다",
       r.no && /fee_minmax/.test(r.why || ""), r.why);

    /* ⚠️ 갯수를 **그냥 세지 않습니다** — 앞 블록이 이미 pv-one 에
       정책을 하나 심어 두었습니다. 처음에 `=== "1"` 로 적었다가
       멀쩡한 코드를 "틀렸다" 고 했습니다 (**검사가 틀린 자리** ·
       이 저장소가 감사 기록 · 업체 수로 세 번 겪었습니다).
       **전을 재고 늘어난 값**만 봅니다. */
    const was = Number(psql("select count(*) from fee_policy where provider_id='pv-one'"));
    const a = allowed(as(AD) +
      `select save_fee_policy('pv-one','{"type":"rate","rate":3,"minFee":10000,"vat":"add","cycle":"monthly"}'::jsonb, null, '표준 3%')`);
    ok("관리자는 정책을 만들 수 있다", a.yes && /^[0-9a-f-]{36}$/.test(a.out), a.why || a.out);
    const FP = a.out;
    ok("정책 기록이 남는다",
       psql("select to_state from audit_log where obj='fee_policy' and obj_id='" + FP + "'")
         === "created");
    ok("처음에는 켜져 있다",
       psql("select active::text from fee_policy where id='" + FP + "'") === "true");

    /* 고치기 — 새 줄이 안 생겨야 합니다 */
    const b = allowed(as(AD) +
      `select save_fee_policy('pv-one','{"type":"rate","rate":5}'::jsonb,'` + FP + "'::uuid,'5% 로')");
    const now = Number(psql("select count(*) from fee_policy where provider_id='pv-one'"));
    ok("만들면 하나 늘고 · 고치면 안 는다",
       b.yes && now === was + 1, b.why || (was + " → " + now));
    ok("고친 값이 들어간다",
       psql("select rate::text from fee_policy where id='" + FP + "'") === "5.0000");

    /* ⚠️ 지우지 않고 **끕니다** — 지난 계약이 사본을 들고 있습니다 */
    const c = allowed(as(AD) + "select set_fee_policy_active('" + FP + "', false, '요율 개편')");
    ok("정책은 지우지 않고 끈다",
       c.yes && psql("select active::text from fee_policy where id='" + FP + "'") === "false", c.why);
    const d = denied(as(ST) + "select set_fee_policy_active('" + FP + "', true)");
    ok("끄고 켜는 것도 관리자만", d.no && /관리자만/.test(d.why || ""), d.why);
  }

  /* ══ 0008 — 견적 제출 · 수정 · 철회 + 고객의 선택 (§4 · §6) ════════
     ⚠️⚠️ 상태 열셋에 `quoted`(견적 전달)는 처음부터 있었는데 **금액이
     아무 데도 안 남았습니다** — "냈다" 는 사실뿐이라 고객은 전화로 들은
     금액을 기억해야 했고, 둘을 나란히 놓고 고를 자리가 없었습니다.
     여기서는 견적을 **내고 · 고치고 · 거두고 · 고르는** 길을 끝까지
     눌러 봅니다. */
  console.log("\n── ⚠️⚠️ 0008 견적 — 내고 · 고치고 · 고릅니다");
  {
    const A   = "11111111-1111-1111-1111-111111111111";
    const B   = "22222222-2222-2222-2222-222222222222";
    const PV  = "33333333-3333-3333-3333-333333333333";
    const PV2 = "66666666-6666-6666-6666-666666666666";
    const ST  = "44444444-4444-4444-4444-444444444444";
    const AD  = "55555555-5555-5555-5555-555555555555";
    const as  = u => "set role authenticated; select become('" + u + "'); ";
    const R   = "aaaaaaaa-0000-0000-0000-000000000031";

    /* 업체 계정 하나를 더 만듭니다 — 비교는 **둘 이상**이라야 뜻이
       있습니다 (하나만 두면 "나머지는 passed" 를 못 재 봅니다). */
    psql(`insert into auth.users (id, email) values ('${PV2}','pv2@test')
            on conflict (id) do nothing;
          insert into account (id, role, provider_id) values ('${PV2}','provider','pv-two')
            on conflict (id) do update set role='provider', provider_id='pv-two';
          insert into request (id, no, user_id, side, name, tel, agree_at, state) values
            ('${R}','SW-AAAA-0031','${A}','start','견','01031310000',now(),'new');`);
    const mv = (u, to, ctx) =>
      as(u) + "select move_state('" + R + "','" + to + "'," + (ctx || "'{}'::jsonb") + ")";
    const sub = (u, data) =>
      as(u) + "select submit_quote('" + R + "'," + data + ")";

    /* 배정 전에는 못 냅니다 */
    let r = denied(sub(PV, `'{"amount":1000000,"scope":"철거 전체"}'::jsonb`));
    ok("배정 전에는 견적을 못 낸다", r.no && /배정되지 않았습니다/.test(r.why || ""), r.why);

    psql(mv(ST, "check"));
    psql(mv(ST, "assigned", `'{"providerId":"pv-one","agree3rd":true}'::jsonb`));
    /* 수락 전에는 못 냅니다 — ⚠️ 배정만 받고 답을 안 한 곳이 금액을
       내면 고객은 그 업체가 받아들인 줄 압니다 */
    r = denied(sub(PV, `'{"amount":1000000,"scope":"철거 전체"}'::jsonb`));
    ok("수락 전에는 견적을 못 낸다", r.no && /수락/.test(r.why || ""), r.why);

    psql(as(PV) + "select answer_assignment('" + R + "', true)");
    /* 상담 전에도 못 냅니다 — 길 표의 차례가 그렇습니다 */
    r = denied(sub(PV, `'{"amount":1000000,"scope":"철거 전체"}'::jsonb`));
    ok("상담 전에는 견적을 못 낸다", r.no && /상담/.test(r.why || ""), r.why);

    psql(mv(PV, "consult"));

    /* ⚠️⚠️ 금액을 안 적었으면 **0원으로 적어 두지 않고 거절**합니다 */
    r = denied(sub(PV, `'{"scope":"철거 전체"}'::jsonb`));
    ok("금액 없이는 거절한다", r.no && /금액/.test(r.why || ""), r.why);
    /* 범위 없는 견적은 금액만 적힌 종이입니다 */
    r = denied(sub(PV, `'{"amount":1000000}'::jsonb`));
    ok("포함 범위 없이는 거절한다", r.no && /포함/.test(r.why || ""), r.why);
    r = denied(sub(PV, `'{"amount":-1,"scope":"철거"}'::jsonb`));
    ok("음수 금액은 거절한다", r.no, r.why);
    /* ⚠️⚠️ **거절하는 말이 사람 말이라야 합니다** — `api/deal.js` 가 DB 의
       거절 글을 **그대로** 손님에게 보여 주기 때문입니다. 형변환에 맡기면
       `invalid input value for enum fee_vat: "x"` 가 그대로 나갑니다. */
    r = denied(sub(PV, `'{"amount":1,"scope":"철거","vat":"zzz"}'::jsonb`));
    ok("모르는 부가세 값은 사람 말로 거절한다",
       r.no && /골라 주세요/.test(r.why || ""), r.why);
    r = denied(sub(PV, `'{"amount":1,"scope":"철거","startOn":"다음달 초"}'::jsonb`));
    ok("날짜가 아닌 글은 사람 말로 거절한다",
       r.no && /날짜를 다시/.test(r.why || ""), r.why);
    r = denied(sub(PV, `'{"amount":1,"scope":"철거","days":0}'::jsonb`));
    ok("소요일 0 은 거절한다", r.no && /하루 이상/.test(r.why || ""), r.why);

    /* 직원은 대신 못 냅니다 — 업체가 적은 금액이 아니게 됩니다 */
    r = denied(sub(ST, `'{"amount":1000000,"scope":"철거"}'::jsonb`));
    ok("직원은 견적을 대신 못 낸다", r.no && /업체만/.test(r.why || ""), r.why);
    r = denied(sub(A, `'{"amount":1000000,"scope":"철거"}'::jsonb`));
    ok("고객은 견적을 못 낸다", r.no, r.why);

    /* ⚠️⚠️ 상담 중에 내면 **상태도 같이** 넘어갑니다 (move_state 로) */
    let a = allowed(sub(PV, `'{"amount":1200000,"vat":"add","scope":"철거 · 폐기물 처리",
      "excludes":"석면 해체","days":5,"startOn":"2026-11-02","warranty":"하자 1년",
      "validTo":"2026-11-30","note":"현장 확인 뒤 조정될 수 있습니다"}'::jsonb`));
    ok("상담 중이면 견적을 낼 수 있다", a.yes, a.why);
    ok("견적을 내면 상태가 견적 전달로 같이 간다",
       psql("select state from request where id='" + R + "'") === "quoted");
    ok("견적 줄이 하나 생긴다",
       psql("select count(*) from quote where request_id='" + R + "'") === "1");
    ok("적은 값이 그대로 들어간다",
       psql(`select amount::text||'/'||vat::text||'/'||days::text||'/'||state
               from quote where request_id='` + R + "' and provider_id='pv-one'")
         === "1200000/add/5/open");
    /* ⚠️ 상태를 바꾼 것도 **move_state 가** 기록을 남깁니다 */
    ok("견적 기록과 상태 기록이 둘 다 남는다",
       psql("select count(*) from audit_log where obj='quote'") !== "0" &&
       psql("select count(*) from audit_log where obj='request' and to_state='quoted'") !== "0");

    /* 고치면 줄이 안 늘고 값만 바뀝니다 */
    a = allowed(sub(PV, `'{"amount":1100000,"scope":"철거 · 폐기물 처리 · 청소"}'::jsonb`));
    ok("견적을 고칠 수 있다", a.yes, a.why);
    ok("고쳐도 줄이 안 는다",
       psql("select count(*) from quote where request_id='" + R + "'") === "1");
    ok("고친 금액이 들어간다",
       psql("select amount::text from quote where request_id='" + R +
            "' and provider_id='pv-one'") === "1100000");

    /* ⚠️⚠️ **거절한 업체가 금액을 내면 안 됩니다.** 위의 "수락 전에는"
       은 상태가 `assigned` 라 **상태 검사가 먼저** 막습니다 — 그러니까
       수락 확인 줄을 빼도 그 검사는 다른 까닭으로 걸립니다. 겹겹이
       막아 둔 것이 검사를 속이는 자리라(이 저장소가 0003 에서 겪었습니다)
       **상담 중인데 거절한 곳**으로 따로 재 봅니다. */
    psql(`insert into assignment (request_id, provider_id, state, agree3rd_at)
          values ('${R}','pv-two','declined', now())
          on conflict (request_id, provider_id) do update set state='declined';`);
    r = denied(sub(PV2, `'{"amount":1,"scope":"x"}'::jsonb`));
    ok("거절한 업체는 상담 중에도 견적을 못 낸다",
       r.no && /수락/.test(r.why || ""), r.why);

    /* ⚠️ `0` 은 값입니다 — "무상 · 서비스" 를 0 으로 적을 수 있습니다 */
    psql(`update assignment set state='accepted'
           where request_id='${R}' and provider_id='pv-two';`);
    a = allowed(sub(PV2, `'{"amount":0,"scope":"첫 현장은 무상으로 봐 드립니다"}'::jsonb`));
    ok("0 원도 값이다 (무상)", a.yes, a.why);
    ok("견적이 둘이 된다",
       psql("select count(*) from quote where request_id='" + R + "'") === "2");

    /* ── 고객이 고릅니다 ───────────────────────────────────────── */
    r = denied(as(B) + "select choose_quote('" + R + "','pv-one')");
    ok("남의 신청 견적은 못 고른다", r.no, r.why);
    a = allowed(as(A) + "select choose_quote('" + R + "','pv-one','범위가 더 넓어서')");
    ok("고객은 견적을 고를 수 있다", a.yes, a.why);
    ok("고른 것만 chosen 이고 나머지는 passed",
       psql(`select string_agg(provider_id||':'||state, ' ' order by provider_id)
               from quote where request_id='` + R + "'")
         === "pv-one:chosen pv-two:passed");
    ok("고른 시각이 적힌다",
       psql("select (chosen_at is not null)::text from quote where request_id='" + R +
            "' and provider_id='pv-one'") === "true");
    /* 두 번 눌러도 터지지 않습니다 */
    a = allowed(as(A) + "select choose_quote('" + R + "','pv-one')");
    ok("두 번 골라도 터지지 않는다", a.yes, a.why);

    /* ⚠️⚠️ 고른 견적은 못 고치고 못 거둡니다 — 조용히 말을 바꾸는 일입니다 */
    r = denied(sub(PV, `'{"amount":9900000,"scope":"철거"}'::jsonb`));
    ok("고객이 고른 견적은 못 고친다", r.no && /고른 견적/.test(r.why || ""), r.why);
    r = denied(as(PV) + "select withdraw_quote('" + R + "')");
    ok("고객이 고른 견적은 못 거둔다", r.no && /고른 견적/.test(r.why || ""), r.why);

    /* ── 거두기 ────────────────────────────────────────────────── */
    a = allowed(as(PV2) + "select withdraw_quote('" + R + "','일정이 안 맞습니다')");
    ok("낸 업체는 견적을 거둘 수 있다", a.yes, a.why);
    ok("거둔 견적은 지우지 않고 상태만 바꾼다",
       psql("select state from quote where request_id='" + R + "' and provider_id='pv-two'")
         === "withdrawn");
    r = denied(as(PV2) + "select withdraw_quote('" + R + "')");
    ok("두 번 거두면 거절한다", r.no, r.why);
    r = denied(as(PV) + "select withdraw_quote('aaaaaaaa-0000-0000-0000-000000000002')");
    ok("낸 적 없는 견적은 못 거둔다", r.no, r.why);

    /* ⚠️⚠️ **거둔 견적은 고객에게 아예 안 보입니다** (RLS).
       업체가 거둔 금액으로 기대를 하면 그건 업체가 하지 않은 약속입니다. */
    ok("고객에게 거둔 견적은 안 보인다",
       psql(as(A) + "select count(*) from quote where request_id='" + R + "'") === "1",
       psql(as(A) + "select count(*) from quote where request_id='" + R + "'"));
    ok("업체는 자기가 거둔 것도 본다",
       psql(as(PV2) + "select count(*) from quote") === "1");
    ok("업체에게 남의 견적은 안 보인다",
       psql(as(PV2) + "select count(*) from quote where provider_id='pv-one'") === "0");
    ok("고객 B 에게는 이 신청의 견적이 하나도 안 보인다",
       psql(as(B) + "select count(*) from quote where request_id='" + R + "'") === "0");
    ok("직원은 전부 본다",
       psql(as(ST) + "select count(*) from quote where request_id='" + R + "'") === "2");

    /* ⚠️⚠️ **표를 열지 않았습니다** — 문만 엽니다 (§8) */
    const wr = psql(
      "select count(*) from information_schema.column_privileges " +
      "where table_name='quote' and grantee='authenticated' " +
      "and privilege_type in ('INSERT','UPDATE','DELETE')");
    ok("quote 표에 쓰기 권한이 없다 (문만 엽니다)", wr === "0", wr);
    const an = psql(
      "select count(*) from information_schema.table_privileges " +
      "where table_name='quote' and grantee='anon'");
    ok("anon 에게 quote 권한이 없다", an === "0", an);
    const anf = psql(
      "select count(*) from information_schema.routine_privileges " +
      "where routine_name in ('submit_quote','withdraw_quote','choose_quote') " +
      "and grantee='anon'");
    ok("anon 에게 견적 문 권한이 없다", anf === "0", anf);
    /* 로그인 없이 부르면 함수가 스스로 거절합니다 */
    r = denied("set role authenticated; select become(null); " +
               "select submit_quote('" + R + `','{"amount":1,"scope":"x"}'::jsonb)`);
    ok("로그인 없이 견적을 못 낸다", r.no, r.why);

    /* ⚠️⚠️ 계약 뒤에는 못 냅니다 — 계약금액이 이미 기록에 적혔는데
       견적을 고치면 "무엇을 보고 계약했나" 가 어긋납니다 (§9) */
    psql(mv(PV, "nego"));
    psql(mv(AD, "signed", `'{"amount":1100000,"providerId":"pv-one"}'::jsonb`));
    r = denied(as(PV2) + "select submit_quote('" + R + `','{"amount":5,"scope":"x"}'::jsonb)`);
    ok("계약 뒤에는 견적을 못 낸다", r.no && /견적을 낼 수 없습니다/.test(r.why || ""), r.why);
  }

  /* ════════════════════════════════════════════════════════════════
     0009 — 신청 하나에 서비스 여러 개 (2026-10-17 §6 · §7)
     ════════════════════════════════════════════════════════════════ */
  console.log("\n── ⚠️⚠️ 0009 신청 항목 — 서비스마다 다른 업체에 배정");
  {
    const A   = "11111111-1111-1111-1111-111111111111";
    const B   = "22222222-2222-2222-2222-222222222222";
    const PV  = "33333333-3333-3333-3333-333333333333";   /* pv-one */
    const PV2 = "66666666-6666-6666-6666-666666666666";   /* pv-two */
    const ST  = "44444444-4444-4444-4444-444444444444";
    const AD  = "55555555-5555-5555-5555-555555555555";
    const as  = u => "set role authenticated; select become('" + u + "'); ";
    const R   = "aaaaaaaa-0000-0000-0000-000000000041";

    psql(`insert into request (id, no, user_id, side, name, tel, agree_at, state) values
            ('${R}','SW-AAAA-0041','${A}','start','항','01041410000',now(),'new');`);

    /* ── ③ 접수가 항목을 적습니다 (한 트랜잭션 · 멱등) ───────────── */
    const items = `'[{"id":"interior","detail":{"공사 범위":"전체 시공"}},
                     {"id":"equip","detail":{}},
                     {"id":"marketing","detail":{}}]'::jsonb`;
    psql(`select save_request_items('${R}', ${items})`);
    ok("항목 셋이 들어갔다",
       psql(`select count(*) from request_item where request_id='${R}'`) === "3");
    ok("서비스별 답이 항목에 담긴다",
       psql(`select detail->>'공사 범위' from request_item
              where request_id='${R}' and service_id='interior'`) === "전체 시공");

    /* ⚠️⚠️ §8 멱등 — 재시도가 줄을 늘리면 안 됩니다 */
    psql(`select save_request_items('${R}', ${items})`);
    ok("두 번 불러도 줄이 안 늘어난다 (멱등 · §8)",
       psql(`select count(*) from request_item where request_id='${R}'`) === "3");

    /* ⚠️ 같은 서비스를 두 번 담지 않습니다 (§3-2) */
    const dup = denied(`insert into request_item (request_id, service_id)
                        values ('${R}','interior')`);
    ok("같은 서비스를 두 번 담지 못한다", dup.no && /request_item_once|duplicate/i.test(dup.why), dup.why);

    /* ⚠️ 빈 id 는 건너뛰고 나머지는 살립니다 — 접수를 잃는 쪽이 더 나쁩니다 */
    const R2 = "aaaaaaaa-0000-0000-0000-000000000042";
    psql(`insert into request (id, no, user_id, side, name, tel, agree_at, state) values
            ('${R2}','SW-AAAA-0042','${A}','start','빈','01042420000',now(),'new');
          select save_request_items('${R2}', '[{"id":""},{"id":"clean"}]'::jsonb);`);
    ok("빈 id 는 건너뛰고 나머지는 담는다",
       psql(`select count(*) from request_item where request_id='${R2}'`) === "1");

    const I1 = psql(`select id from request_item where request_id='${R}' and service_id='interior'`);
    const I2 = psql(`select id from request_item where request_id='${R}' and service_id='equip'`);

    /* ── ④ 배정 = 제3자 제공 (제17조 제2항) ──────────────────────── */
    const asg = (u, item, pv, ag) =>
      as(u) + `select assign_item('${item}','${pv}',${ag})`;

    const noAg = denied(asg(AD, I1, "pv-one", "false"));
    ok("동의 없이 배정하지 못한다 (제17조)", noAg.no && /제3자/.test(noAg.why), noAg.why);

    const byCust = denied(asg(A, I1, "pv-one", "true"));
    ok("고객은 배정하지 못한다", byCust.no && /직원|관리자/.test(byCust.why), byCust.why);

    const noPv = denied(asg(AD, I1, "없는업체", "true"));
    ok("없는 업체로 배정하지 못한다", noPv.no && /등록된 업체/.test(noPv.why), noPv.why);

    /* ⚠️⚠️ 여기가 §7 의 핵심입니다 — **항목마다 다른 업체** */
    psql(asg(ST, I1, "pv-one", "true"));
    psql(asg(AD, I2, "pv-two", "true"));
    ok("항목마다 다른 업체가 배정된다 (§7)",
       psql(`select string_agg(ri.service_id || '→' || a.provider_id, ' ' order by ri.service_id)
               from assignment a join request_item ri on ri.id = a.item_id
              where ri.request_id='${R}'`) === "equip→pv-two interior→pv-one");
    ok("배정하면 항목 상태가 assigned 가 된다",
       psql(`select state from request_item where id='${I1}'`) === "assigned");
    ok("신청 쪽 제3자 동의 시각도 남는다",
       psql(`select agree3rd_at is not null from request where id='${R}'`) === "t");
    ok("배정이 감사 기록에 남는다 (§8)",
       psql(`select count(*) from audit_log
              where obj='request_item' and obj_id='${I1}' and to_state='assigned'`) === "1");

    /* 같은 업체를 같은 항목에 두 번 — 줄이 안 늘어납니다 */
    psql(asg(AD, I1, "pv-one", "true"));
    ok("같은 항목에 같은 업체를 두 번 배정해도 줄이 하나",
       psql(`select count(*) from assignment where item_id='${I1}'`) === "1");

    /* ── ⑤ 항목 상태 ─────────────────────────────────────────────── */
    const mvi = (u, item, to) => as(u) + `select move_item_state('${item}','${to}')`;

    /* ⚠️⚠️ 돈이 걸린 상태로는 **여기서** 못 갑니다 (§13 가짜 정산) */
    const money = denied(mvi(AD, I1, "fee_wait"));
    ok("항목에서 수수료 상태로 못 간다", money.no && /수수료는 계약/.test(money.why), money.why);

    /* ⚠️ 배정은 ④ 로만 — 제17조 동의를 받는 자리가 하나라야 합니다 */
    const viaMove = denied(mvi(AD, I2, "assigned"));
    ok("배정은 move_item_state 로 못 한다", viaMove.no && /assign_item/.test(viaMove.why), viaMove.why);

    /* ⚠️ 길 표(deal_move)를 그대로 봅니다 */
    const noWay = denied(mvi(AD, I1, "signed"));
    ok("길 표에 없는 길로 못 간다", noWay.no && /갈 수 없는 길/.test(noWay.why), noWay.why);

    psql(mvi(PV, I1, "accepted"));
    ok("업체가 수락하면 항목만 바뀐다",
       psql(`select state from request_item where id='${I1}'`) === "accepted" &&
       psql(`select state from request_item where id='${I2}'`) === "assigned");
    ok("항목 상태 변경이 감사 기록에 남는다",
       psql(`select count(*) from audit_log
              where obj='request_item' and obj_id='${I1}' and to_state='accepted'`) === "1");

    /* ── RLS — 누가 어느 항목을 보는가 ───────────────────────────── */
    const see = (u, sql) => psql(as(u) + sql);
    ok("신청하신 분은 자기 항목 셋을 본다",
       see(A, `select count(*) from request_item where request_id='${R}'`) === "3");
    ok("남의 항목은 하나도 안 보인다",
       see(B, `select count(*) from request_item where request_id='${R}'`) === "0");
    /* ⚠️⚠️ 업체는 **배정된 항목만** — 같은 신청의 다른 서비스는 안 보입니다 */
    ok("업체는 배정된 항목만 본다 (제17조)",
       see(PV, `select string_agg(service_id,' ') from request_item where request_id='${R}'`) === "interior");
    ok("직원은 전부 본다",
       see(ST, `select count(*) from request_item where request_id='${R}'`) === "3");

    /* ── ⓪ 멱등 열쇠 (§8) ───────────────────────────────────────── */
    psql(`insert into request (no, side, name, tel, agree_at, idem) values
            ('SW-AAAA-0051','start','멱','01051510000',now(),'idem-abc');`);
    const twice = denied(`insert into request (no, side, name, tel, agree_at, idem) values
            ('SW-AAAA-0052','start','멱','01051510000',now(),'idem-abc')`);
    ok("같은 멱등 열쇠로 두 번 못 넣는다 (§8)",
       twice.no && /request_idem_once|duplicate/i.test(twice.why), twice.why);
    psql(`insert into request (no, side, name, tel, agree_at) values
            ('SW-AAAA-0053','start','널','01053530000',now());
          insert into request (no, side, name, tel, agree_at) values
            ('SW-AAAA-0054','start','널','01053530000',now());`);
    ok("열쇠가 없는 접수는 여러 번 들어간다 (옛 화면)",
       psql(`select count(*) from request where tel='01053530000'`) === "2");

    /* ⚠️⚠️ 표를 열지 않았습니다 — 문으로만 바뀝니다 (§8) */
    const wr = denied(as(AD) + `update request_item set state='lost' where id='${I1}'`);
    ok("request_item 에 쓰기 권한이 없다 (문만 엽니다)", wr.no, wr.why);
    const anon = denied("set role anon; select count(*) from request_item");
    ok("anon 에게 request_item 권한이 없다", anon.no, anon.why);
    const anonFn = denied(`set role anon; select assign_item('${I1}','pv-one',true)`);
    ok("anon 에게 배정 문 권한이 없다", anonFn.no, anonFn.why);
  }

  /* ════════════════════════════════════════════════════════════════
     0010 — 회원 계정에 남는 임시저장 · 체크리스트 (2026-10-18 §6-2 · §9)
     ════════════════════════════════════════════════════════════════ */
  console.log("\n── ⚠️⚠️ 0010 회원 메모장 — 자기 줄만 · 담을 수 있는 칸만");
  {
    const A  = "11111111-1111-1111-1111-111111111111";
    const B  = "22222222-2222-2222-2222-222222222222";
    const AD = "55555555-5555-5555-5555-555555555555";
    const as = u => "set role authenticated; select become('" + u + "'); ";

    /* ── ③ 저장하는 문 ──────────────────────────────────────────── */
    psql(as(A) + `select save_user_state(
            '["interior","repair/aircon-fix"]'::jsonb,
            '{"q-ind":"cafe","q-reg":"gyeonggi"}'::jsonb,
            '["sales","tax"]'::jsonb)`);
    ok("저장하면 줄이 하나 생긴다",
       psql(`select count(*) from user_state where account_id='${A}'`) === "1");
    ok("고른 서비스가 그대로 들어간다",
       psql(`select pick->>1 from user_state where account_id='${A}'`) === "repair/aircon-fix");

    /* ⚠️⚠️ **안 보낸 칸은 그대로 둡니다** — 한 화면의 자동저장이 다른
       화면이 적어 둔 것을 쓸어 버리면 안 됩니다 */
    psql(as(A) + `select save_user_state('["clean"]'::jsonb, null, null)`);
    ok("안 보낸 칸은 그대로 남는다 (조건)",
       psql(`select draft->>'q-ind' from user_state where account_id='${A}'`) === "cafe");
    ok("안 보낸 칸은 그대로 남는다 (체크)",
       psql(`select jsonb_array_length(checks) from user_state where account_id='${A}'`) === "2");
    ok("보낸 칸은 바뀐다",
       psql(`select jsonb_array_length(pick) from user_state where account_id='${A}'`) === "1");

    /* ⚠️ 비우는 것은 `[]` 로 보냅니다 (null 과 다릅니다) */
    psql(as(A) + `select save_user_state('[]'::jsonb, null, null)`);
    ok("빈 배열로 보내면 비워진다",
       psql(`select jsonb_array_length(pick) from user_state where account_id='${A}'`) === "0");

    /* ── ② ⚠️⚠️ 담을 수 있는 칸을 DB 가 정합니다 ────────────────── */
    let r = denied(as(A) + `select save_user_state(null,'{"q-name":"홍길동"}'::jsonb,null)`);
    ok("조건 밖의 칸(성함)은 거절한다",
       r.no && /저장할 수 없는 칸입니다/.test(r.why || ""), r.why);
    r = denied(as(A) + `select save_user_state(null,'{"q-tel":"010-1234-5678"}'::jsonb,null)`);
    ok("조건 밖의 칸(연락처)은 거절한다",
       r.no && /저장할 수 없는 칸입니다/.test(r.why || ""), r.why);
    /* ⚠️ 거절하는 말에 **값을 싣지 않습니다** — 성함이 로그에 남으면 안 됩니다 */
    ok("거절하는 말에 값이 안 실린다", !/홍길동|1234-5678/.test(r.why || ""), r.why);
    r = denied(as(A) + `select save_user_state(null,'{"q-ind":123}'::jsonb,null)`);
    ok("글자가 아닌 값은 거절한다",
       r.no && /저장할 수 없는 값입니다/.test(r.why || ""), r.why);
    r = denied(as(A) + `select save_user_state(null,'{"q-ind":"` + "가".repeat(121) + `"}'::jsonb,null)`);
    ok("너무 긴 값은 거절한다", r.no && /너무 깁니다/.test(r.why || ""), r.why);
    r = denied(as(A) + `select save_user_state('[{"a":1}]'::jsonb,null,null)`);
    ok("서비스 id 가 글자가 아니면 거절한다",
       r.no && /서비스 id/.test(r.why || ""), r.why);
    r = denied(as(A) + `select save_user_state(null,null,'[""]'::jsonb)`);
    ok("빈 체크 항목은 거절한다", r.no && /체크 항목/.test(r.why || ""), r.why);

    /* ⚠️ 상한 — 자동저장으로 들어오는 줄이라 막아 둡니다 (§15) */
    const many = "[" + Array.from({length:61}, (_,i) => '"x' + i + '"').join(",") + "]";
    r = denied(as(A) + `select save_user_state('${many}'::jsonb,null,null)`);
    ok("예순을 넘기면 거절한다 (상한)",
       r.no && /user_state_pick_cap|상한|check/i.test(r.why || ""), r.why);

    /* ── ⚠️⚠️ 자기 줄만 봅니다 ──────────────────────────────────── */
    psql(as(B) + `select save_user_state('["demolish"]'::jsonb,null,null)`);
    ok("남의 메모장은 안 보인다",
       psql(as(B) + `select count(*) from user_state`) === "1");
    ok("자기 것만 보인다",
       psql(as(B) + `select pick->>0 from user_state`) === "demolish");
    /* ⚠️ 관리자에게도 **열지 않았습니다** — 남의 메모장을 보는 것은
       운영에 필요한 일이 아닙니다 */
    ok("관리자에게도 남의 메모장이 안 보인다",
       psql(as(AD) + `select count(*) from user_state`) === "0");

    /* ── ⚠️⚠️ 표를 열지 않았습니다 — 문으로만 바뀝니다 (§8) ──────── */
    r = denied(as(A) + `update user_state set pick='["x"]'::jsonb where account_id='${A}'`);
    ok("user_state 에 쓰기 권한이 없다 (문만 엽니다)", r.no, r.why);
    r = denied(as(B) + `update user_state set pick='["x"]'::jsonb where account_id='${A}'`);
    ok("남의 줄도 못 고친다", r.no, r.why);
    r = denied(as(A) + `delete from user_state where account_id='${A}'`);
    ok("표에서 바로 못 지운다", r.no, r.why);
    r = denied("set role anon; select count(*) from user_state");
    ok("anon 에게 user_state 권한이 없다", r.no, r.why);
    r = denied("set role anon; select save_user_state('[]'::jsonb,null,null)");
    ok("anon 에게 저장 문 권한이 없다", r.no, r.why);

    /* ⚠️ 로그인 없이(변경자를 모르는 채) 저장하지 못합니다 */
    r = denied("set role authenticated; select become(null::uuid); select save_user_state('[]'::jsonb,null,null)");
    ok("로그인 없이 못 저장한다", r.no && /로그인이 필요합니다/.test(r.why || ""), r.why);

    /* ── ④ 지우는 길 ──────────────────────────────────────────── */
    psql(as(A) + `select clear_user_state()`);
    ok("지우면 줄이 없어진다",
       psql(`select count(*) from user_state where account_id='${A}'`) === "0");
    ok("남의 줄은 안 지워진다",
       psql(`select count(*) from user_state where account_id='${B}'`) === "1");

    /* ⚠️⚠️ **감사 기록을 남기지 않습니다** — 자동저장이라 체크 한 번에
       줄 하나씩 쌓이면 정작 돈 기록이 그 더미에 묻힙니다. 전을 재고
       **안 늘어났는지**만 봅니다 (갯수를 적어 두면 검사를 하나 더할
       때마다 어긋납니다 — 이 저장소가 두 번 겪은 자리). */
    const before = psql(`select count(*) from audit_log`);
    psql(as(B) + `select save_user_state('["clean"]'::jsonb,null,null)`);
    psql(as(B) + `select clear_user_state()`);
    ok("메모장은 감사 기록을 남기지 않는다",
       psql(`select count(*) from audit_log`) === before);
  }

  /* ════════════════════════════════════════════════════════════════
     0011 — 신청에 붙는 사진 · 서류 (2026-10-18 §7-3 · §15)
     ════════════════════════════════════════════════════════════════ */
  console.log("\n── ⚠️⚠️ 0011 사진 — 번호 + 연락처가 맞아야 자리를 줍니다");
  {
    const A   = "11111111-1111-1111-1111-111111111111";
    const B   = "22222222-2222-2222-2222-222222222222";
    const PV  = "33333333-3333-3333-3333-333333333333";   /* pv-one */
    const PV2 = "66666666-6666-6666-6666-666666666666";   /* pv-two */
    const ST  = "44444444-4444-4444-4444-444444444444";
    const AD  = "55555555-5555-5555-5555-555555555555";
    const as  = u => "set role authenticated; select become('" + u + "'); ";
    const R   = "aaaaaaaa-0000-0000-0000-000000000061";
    const NO  = "SW-AAAA-0061";

    psql(`insert into request (id, no, user_id, side, name, tel, agree_at, state) values
            ('${R}','${NO}','${A}','ops','사','031-061-0000',now(),'new');`);
    /* ⚠️⚠️ **`bytes || 100000` 으로 적지 마세요.** `0` 이 거짓이라
       "빈 파일은 거절한다" 가 **10만 바이트를 보내고** 통과해 버립니다 —
       게다가 그 줄이 실제로 들어가서 뒤의 개수 검사까지 어긋났습니다.
       **틀린 것은 코드가 아니라 씨앗**이었습니다 (이 저장소가 "무권리
       0" · 영업기간 경계값으로 여러 번 겪은 자리). */
    const slot = (no, tel, mime, bytes) =>
      `select claim_photo_slot('${no}','${tel}','${mime === undefined ? "image/jpeg" : mime}',` +
      (bytes === undefined ? 100000 : bytes) + ")";

    /* ── ⚠️⚠️ 번호만으로는 안 됩니다 ───────────────────────────── */
    let r = denied(slot(NO, "01000000000"));
    ok("연락처가 틀리면 자리를 안 준다",
       r.no && /신청번호와 연락처를 확인해 주세요/.test(r.why || ""), r.why);
    const why1 = r.why;
    r = denied(slot("SW-ZZZZ-9999", "031-061-0000"));
    ok("없는 번호도 자리를 안 준다", r.no, r.why);
    /* ⚠️⚠️ **틀린 까닭을 갈라서 말하지 않습니다** — 갈라 주면 번호가
       있는지를 확인해 가며 긁을 수 있습니다 (claim_request 와 같은 규칙) */
    ok("틀린 까닭을 갈라서 말하지 않는다",
       String(why1).indexOf("신청번호와 연락처를 확인해 주세요") >= 0 &&
       String(r.why).indexOf("신청번호와 연락처를 확인해 주세요") >= 0, [why1, r.why]);

    /* ⚠️ 숫자만 남겨 견줍니다 (031-061-0000 과 0310610000 은 같은 번호) */
    const got = psql(slot(NO, "0310610000"));
    ok("하이픈이 없어도 같은 번호로 본다", /"path"/.test(got), got);
    ok("경로가 신청 아래에 생긴다", /req\//.test(got) && got.indexOf(R) >= 0, got);
    /* ⚠️⚠️ 경로에 **번호 · 연락처가 안 들어갑니다** */
    ok("경로에 번호 · 연락처가 없다",
       got.indexOf("SW-") < 0 && got.indexOf("0610000") < 0, got);
    ok("사진 줄이 하나 생긴다",
       psql(`select count(*) from request_photo where request_id='${R}'`) === "1");

    /* ── 형식 · 크기 ────────────────────────────────────────────── */
    r = denied(slot(NO, "0310610000", "image/gif"));
    ok("GIF 는 거절한다", r.no && /JPG/.test(r.why || ""), r.why);
    r = denied(slot(NO, "0310610000", "text/html"));
    ok("HTML 은 거절한다", r.no, r.why);
    r = denied(slot(NO, "0310610000", "image/jpeg", 8388609));
    ok("8MB 를 넘기면 거절한다", r.no && /8MB/.test(r.why || ""), r.why);
    r = denied(slot(NO, "0310610000", "image/jpeg", 0));
    ok("빈 파일은 거절한다", r.no, r.why);
    /* ⚠️ 경계 **바로 아래**도 넣어 봅니다 (이 저장소의 규칙) */
    psql(slot(NO, "0310610000", "application/pdf", 8388608));
    ok("딱 8MB 는 들어간다",
       psql(`select count(*) from request_photo where request_id='${R}'`) === "2");

    /* ── ⚠️ 다섯까지 (§15 악용 방어) ────────────────────────────── */
    psql(slot(NO, "0310610000")); psql(slot(NO, "0310610000")); psql(slot(NO, "0310610000"));
    r = denied(slot(NO, "0310610000"));
    ok("여섯 장째는 거절한다", r.no && /다섯 장까지/.test(r.why || ""), r.why);
    ok("다섯 장에서 멈춘다",
       psql(`select count(*) from request_photo where request_id='${R}'`) === "5");

    /* §8 — 기록이 남습니다. ⚠️ 번호 · 연락처 · 경로는 안 싣습니다 */
    const au = psql(`select data::text from audit_log
                      where obj='request' and obj_id='${R}'
                        and why='사진을 올렸습니다' order by at desc limit 1`);
    ok("사진을 올린 것이 기록에 남는다", /mime/.test(au), au);
    ok("기록에 번호 · 연락처 · 경로가 없다",
       au.indexOf("SW-") < 0 && au.indexOf("0610000") < 0 && au.indexOf("req/") < 0, au);

    /* ── ⚠️⚠️ 누가 볼 수 있는가 ─────────────────────────────────── */
    const P1 = psql(`select id from request_photo where request_id='${R}' limit 1`);
    ok("신청하신 분은 자기 사진을 본다",
       psql(as(A) + `select count(*) from request_photo`) === "5");
    ok("남의 사진은 하나도 안 보인다",
       psql(as(B) + `select count(*) from request_photo`) === "0");
    /* ⚠️⚠️ **배정되지 않은 업체에게는 안 보입니다** — 남의 가게 내부
       사진입니다 (제17조) */
    ok("배정 전에는 업체에게 안 보인다",
       psql(as(PV) + `select count(*) from request_photo`) === "0");
    psql(as(ST) + `select move_state('${R}','check','{}'::jsonb)`);
    psql(as(ST) + `select move_state('${R}','assigned',
            '{"providerId":"pv-one","agree3rd":true}'::jsonb)`);
    ok("배정된 업체는 본다 (그게 배정입니다)",
       psql(as(PV) + `select count(*) from request_photo`) === "5");
    ok("배정 안 된 다른 업체는 못 본다",
       psql(as(PV2) + `select count(*) from request_photo`) === "0");
    ok("직원은 본다", psql(as(ST) + `select count(*) from request_photo`) === "5");

    /* ── ⚠️⚠️ 표를 열지 않았습니다 — 문으로만 바뀝니다 (§8) ──────── */
    r = denied(as(A) + `insert into request_photo (request_id, path, mime, bytes)
                        values ('${R}','req/x.jpg','image/jpeg',100)`);
    ok("request_photo 에 쓰기 권한이 없다 (문만 엽니다)", r.no, r.why);
    r = denied(as(A) + `delete from request_photo where id='${P1}'`);
    ok("표에서 바로 못 지운다", r.no, r.why);
    r = denied("set role anon; select count(*) from request_photo");
    ok("anon 에게 request_photo 권한이 없다", r.no, r.why);
    /* ⚠️⚠️ **자리를 내주는 문은 service key 전용입니다** — 로그인한
       누구나 부를 수 있으면 남의 신청에 꽂습니다 */
    /* ⚠️⚠️ **어느 자물쇠가 걸렸는지 봅니다.** 처음에 "막히기만 하면
       통과" 로 적었더니, `authenticated` 에게 권한을 **줘 보고도**
       검사가 통과했습니다 — 그때는 **다섯 장 상한**이 먼저 막아서
       엉뚱한 까닭으로 거절된 것이었습니다. 이 저장소가 0003 에서
       "겹겹이 막아 둔 것이 검사를 속인다" 로 겪은 자리 그대로입니다.
       지금은 **권한 에러인지**까지 맞춰 봅니다. */
    r = denied(as(A) + slot(NO, "0310610000"));
    ok("로그인 사용자는 자리 문을 못 부른다 (권한 자체가 없습니다)",
       r.no && /permission denied|권한/i.test(r.why || ""), r.why);
    r = denied("set role anon; " + slot(NO, "0310610000"));
    ok("anon 도 자리 문을 못 부른다 (권한 자체가 없습니다)",
       r.no && /permission denied|권한/i.test(r.why || ""), r.why);

    /* ── ③ 빼기 ───────────────────────────────────────────────── */
    r = denied(as(PV) + `select drop_photo('${P1}')`);
    ok("업체는 사진을 못 뺀다 (남이 올린 자료입니다)",
       r.no && /권한이 없습니다/.test(r.why || ""), r.why);
    r = denied(as(B) + `select drop_photo('${P1}')`);
    ok("남의 사진을 못 뺀다", r.no, r.why);
    psql(as(A) + `select drop_photo('${P1}')`);
    ok("올리신 분은 뺀다",
       psql(`select count(*) from request_photo where request_id='${R}'`) === "4");
    const au2 = psql(`select count(*) from audit_log
                       where obj_id='${R}' and why='사진을 뺐습니다'`);
    ok("뺀 것도 기록에 남는다 (§8)", au2 === "1", au2);
    psql(as(AD) + `select drop_photo(
            (select id from request_photo where request_id='${R}' limit 1))`);
    ok("관리자도 뺀다",
       psql(`select count(*) from request_photo where request_id='${R}'`) === "3");
  }

  console.log("\n── ⚠️⚠️ 0012 담당자 · 배정 가능 · 열람 이력 · 수익상품");
  {
    const as = u => "set role authenticated; select become('" + u + "'); ";
    const A  = "11111111-1111-1111-1111-111111111111";
    const ST = "44444444-4444-4444-4444-444444444444";
    const AD = "55555555-5555-5555-5555-555555555555";
    const R  = "aaaaaaaa-0000-0000-0000-000000000120";
    psql(`insert into request (id, no, side, name, tel, agree_at, state) values
            ('${R}','SW-AAAA-0120','start','최사장','01077770000',now(),'check')
          on conflict (id) do nothing;`);

    /* ══ 배정 가능 여부 — listed 와 다른 플래그 ═══════════════════
       ⚠️⚠️ 구두 제휴 합의 단계에서 배정되면 그 순간 성함 · 연락처가
       그 업체로 넘어갑니다 (제17조). 기본값이 false 여야 맞습니다. */
    psql(`insert into provider (id, name, listed, subs) values
            ('pv-new','새업체','t','{interior}') on conflict (id) do nothing;`);
    ok("등록만 하면 배정 가능이 꺼져 있다 (fail-closed)",
       psql("select assignable from provider where id='pv-new'") === "f");

    let r = denied(as(AD) + `select move_state('${R}','assigned',
              '{"providerId":"pv-new","agree3rd":true}'::jsonb)`);
    /* ⚠️⚠️ **에러 글까지 맞춰 봅니다.** "막히기만 하면 통과" 로 적으면
       엉뚱한 자물쇠(동의 · 길 표)가 먼저 막아도 초록이 됩니다 — 이
       저장소가 0003 에서 겪은 자리입니다. */
    ok("배정 가능으로 켜지 않은 업체에는 배정하지 못한다",
       r.no && /배정할 수 없는 업체/.test(r.why || ""), r.why);

    r = denied(as(ST) + "select approve_provider('pv-new', null, null, null, true)");
    ok("배정 가능은 직원이 못 켠다 (관리자만)",
       r.no && /관리자만/.test(r.why || ""), r.why);

    psql(as(AD) + "select approve_provider('pv-new', null, null, '계약서 확인', true)");
    ok("관리자가 켜면 켜진다",
       psql("select assignable from provider where id='pv-new'") === "t");
    ok("켠 것이 기록에 남는다 (§8)",
       psql(`select count(*) from audit_log where obj='provider'
              and obj_id='pv-new' and why='계약서 확인'`) === "1");
    psql(as(AD) + `select move_state('${R}','assigned',
            '{"providerId":"pv-new","agree3rd":true}'::jsonb)`);
    ok("켜면 배정된다",
       psql(`select count(*) from assignment
              where request_id='${R}' and provider_id='pv-new'`) === "1");

    /* ⚠️ 자리로 부르던 옛 호출(네 번째가 사유)이 그대로 돌아야 합니다 —
       새 인자를 가운데 끼우면 거기서 터집니다 (실제로 넷이 걸렸습니다). */
    psql(as(AD) + "select approve_provider('pv-new', true, null, '옛 자리 호출')");
    ok("옛 자리 호출(네 인자)이 그대로 돈다",
       psql("select listed from provider where id='pv-new'") === "t");

    /* ══ 담당자 — audit_log.by_user 와 다른 것입니다 ════════════ */
    r = denied(as(A) + `select set_owner('${R}','${ST}')`);
    ok("고객은 담당자를 못 정한다",
       r.no && /직원 · 관리자만/.test(r.why || ""), r.why);
    r = denied(as(ST) + `select set_owner('${R}','${A}')`);
    ok("고객 계정을 담당자로 못 둔다",
       r.no && /직원 · 관리자 계정이 아닙니다/.test(r.why || ""), r.why);

    psql(as(ST) + `select set_owner('${R}','${ST}','내가 맡습니다')`);
    ok("직원이 자기를 담당자로 둔다",
       psql(`select owner_id from request where id='${R}'`) === ST);
    ok("담당자 바뀜이 기록에 남는다 (§8)",
       psql(`select count(*) from audit_log where obj='request'
              and obj_id='${R}' and to_state='owner:set'`) === "1");
    /* ⚠️ 비울 수 있어야 합니다 — 담당을 잘못 정한 날 되돌릴 길이 없으면
       그 건이 영영 남의 것입니다. */
    psql(as(AD) + `select set_owner('${R}', null, '다시 배정')`);
    ok("담당자를 비울 수 있다",
       psql(`select coalesce(owner_id::text,'-') from request where id='${R}'`) === "-");

    /* ⚠️⚠️ 직원이 **직원 목록**을 볼 수 있어야 담당자 고르개가 찹니다 */
    ok("직원이 직원 · 관리자 계정을 본다 (담당자 고르개)",
       Number(psql(as(ST) + "select count(*) from account where role in ('staff','admin')")) >= 2);
    ok("직원에게 고객 계정은 안 보인다",
       psql(as(ST) + "select count(*) from account where role='customer'") === "0");

    /* ══ 연락처 열람 이력 (제29조 접속기록) ════════════════════ */
    r = denied(as(A) + `select note_request_open('${R}')`);
    ok("고객은 열람 기록을 못 남긴다",
       r.no && /직원 · 관리자만/.test(r.why || ""), r.why);
    psql(as(ST) + `select note_request_open('${R}','전화하려고 열었습니다')`);
    ok("열어 본 것이 기록에 남는다",
       psql(`select count(*) from audit_log where obj_id='${R}'
              and to_state='contact:open'`) === "1");
    /* ⚠️⚠️ **성함도 번호도 기록에 안 적습니다** — 기록은 못 지우는
       것이라, 열람 이력에 연락처를 박으면 그 자체가 또 하나의 보관입니다. */
    ok("열람 기록에 성함 · 번호가 없다",
       psql(`select count(*) from audit_log where obj_id='${R}'
              and to_state='contact:open'
              and (coalesce(why,'') like '%최사장%' or coalesce(data::text,'') like '%0107777%')`) === "0");
    /* 표에 직접 쓰는 길이 없어야 문이 뜻을 가집니다 */
    r = denied(as(ST) + `insert into audit_log (by_user, obj, obj_id) values ('${ST}','request','${R}')`);
    ok("기록을 직접 넣는 길이 없다 (문으로만)", r.no, r.why);

    /* ══ 수익상품 — offer 표가 비어 있었습니다 ══════════════════ */
    ok("수익상품이 offer 표에 들어 있다",
       Number(psql("select count(*) from offer")) === 27);
    ok("전부 info 다 (제휴사 0곳인데 live 면 신청 가능으로 읽힙니다)",
       psql("select count(*) from offer where status <> 'info'") === "0");
    /* ⚠️⚠️ 이 FK 가 비어 있어서 **상품별 요율을 못 걸고 있었습니다** */
    psql(as(AD) + `select save_fee_policy('pv-new',
            '{"type":"rate","rate":"3","offerId":"pos-card"}'::jsonb)`);
    ok("상품별 수수료 정책을 걸 수 있다",
       psql("select count(*) from fee_policy where offer_id='pos-card'") === "1");
    /* 다시 돌려도 사장님이 켜 둔 status 를 안 되돌립니다 */
    psql("update offer set status='live' where id='pos-card'");
    psqlFile("db/migrations/0012_owner_assignable_offer.sql");
    ok("다시 돌려도 켜 둔 status 를 안 되돌린다",
       psql("select status from offer where id='pos-card'") === "live");
    psql("update offer set status='info' where id='pos-card'");
  }

  console.log("\n── ⚠️⚠️ 0013 업체 담당자(별도 표) · 기간별 정산");
  {
    const as = u => "set role authenticated; select become('" + u + "'); ";
    const A  = "11111111-1111-1111-1111-111111111111";
    const PV = "33333333-3333-3333-3333-333333333333";   /* pv-one */
    const ST = "44444444-4444-4444-4444-444444444444";
    const AD = "55555555-5555-5555-5555-555555555555";

    /* ══ ⑬ 업체 담당자 ══════════════════════════════════════════ */
    let r = denied(as(A) + `select save_provider_contact('pv-one','{"name":"김담당"}'::jsonb)`);
    ok("고객은 업체 담당자를 못 적는다",
       r.no && /직원 · 관리자만/.test(r.why || ""), r.why);
    r = denied(as(ST) + `select save_provider_contact('zz-none','{"name":"x"}'::jsonb)`);
    ok("없는 업체는 거절한다", r.no && /없는 업체/.test(r.why || ""), r.why);
    r = denied(as(ST) + `select save_provider_contact('pv-one','{"email":"abc"}'::jsonb)`);
    ok("메일 꼴을 본다", r.no && /메일 주소/.test(r.why || ""), r.why);

    psql(as(ST) + `select save_provider_contact('pv-one',
            '{"name":"김담당","tel":"010-1111-2222","email":"a@b.com","memo":"오전에 연락"}'::jsonb,
            '업체에서 받아 왔습니다')`);
    ok("직원이 담당자를 적는다",
       psql("select count(*) from provider_contact where provider_id='pv-one'") === "1");
    ok("직통 번호가 들어 있다",
       psql("select tel from provider_contact where provider_id='pv-one'") === "010-1111-2222");

    /* ⚠️⚠️ **이것이 이 표를 따로 만든 까닭입니다.** `provider` 에 넣으면
       0001 의 `grant select on provider to authenticated` 가 표째라
       `listed=true` 인 줄을 **로그인한 손님 전부가** 읽습니다 — RLS 는
       줄은 막아도 칸은 못 막습니다. */
    ok("⚠️⚠️ 고객에게는 한 줄도 안 보인다",
       psql(as(A) + "select count(*) from provider_contact") === "0");
    ok("업체는 자기 것만 본다",
       psql(as(PV) + "select count(*) from provider_contact") === "1");
    ok("직원은 본다",
       Number(psql(as(ST) + "select count(*) from provider_contact")) >= 1);

    /* ⚠️⚠️ 감사 기록은 **못 지우는 것**이라, 거기에 번호를 박으면 그
       자체가 또 하나의 보관입니다 (`note_request_open` 과 같은 규칙). */
    ok("⚠️⚠️ 감사 기록에 이름 · 번호가 없다",
       psql(`select count(*) from audit_log where obj='provider_contact'
              and (coalesce(data::text,'') like '%김담당%'
                or coalesce(data::text,'') like '%010-1111%'
                or coalesce(why,'')  like '%010-1111%')`) === "0");
    ok("채워진 칸 이름만 남는다",
       psql(`select count(*) from audit_log where obj='provider_contact'
              and data::text like '%tel%'`) === "1");

    r = denied(as(ST) + `insert into provider_contact (provider_id, name)
                           values ('pv-two','직접')`);
    ok("표에 직접 쓰는 길이 없다 (문으로만)", r.no, r.why);

    /* ⚠️ 넷이 다 비면 **빈 줄을 안 남깁니다** (절대 규칙 2) */
    psql(as(ST) + `select save_provider_contact('pv-one','{}'::jsonb,'담당자가 그만두셨습니다')`);
    ok("넷이 비면 줄째 지운다",
       psql("select count(*) from provider_contact where provider_id='pv-one'") === "0");
    ok("지운 것도 기록에 남는다 (§8)",
       psql(`select count(*) from audit_log where obj='provider_contact'
              and to_state='cleared'`) === "1");

    /* ══ ⑭ 기간별 정산 ═════════════════════════════════════════
       ⚠️⚠️ **업체를 새로 만듭니다.** 앞 블록들이 `pv-one` 에
       `confirm_fee()` 를 불러 두었고 그 `fee_at` 은 **now()** 입니다 —
       오늘이 10월이라 "10월 정산" 에 그것까지 섞여서 합이 안 맞았습니다.
       **코드가 아니라 씨앗이 틀린** 자리입니다 (이 저장소의 단골). */
    psql(`insert into provider (id, name, listed, assignable, subs) values
            ('pv-set','정산업체','t','t','{interior}')
          on conflict (id) do nothing;`);

    /* ⚠️⚠️ 확정 전인 계약(9,900만원)을 **계약금액으로** 섞으면 받을 돈이
       열 배로 부풀려집니다 — 미수금에서 겪은 그 자리입니다. */
    const mk = (n, when, fee, tot, paid, pAt) =>
      `insert into request (id, no, side, name, tel, agree_at, state) values
         ('aaaaaaaa-0000-0000-0000-00000000013${n}','SW-SET-013${n}',
          'start','ㄱ','0101111000${n}',now(),'done') on conflict (id) do nothing;
       insert into deal (request_id, provider_id, amount, fee, fee_total,
                         fee_by, fee_at, paid, paid_at) values
         ('aaaaaaaa-0000-0000-0000-00000000013${n}','pv-set',10000000,
          ${fee},${tot},'${AD}',${when},${paid},${pAt})
       on conflict (request_id) do nothing;`;
    psql(mk(1, "'2026-10-05'", 300000, 330000, 330000, "'2026-10-07'"));
    psql(mk(2, "'2026-10-20'", 600000, 660000, "null", "null"));
    psql(mk(3, "'2026-11-10'", 400000, 440000, 440000, "'2026-11-12'"));
    psql(mk(4, "'2026-12-03'", 200000, 220000, "null", "null"));
    /* 확정 전 — fee 가 없으면 **세지 않습니다** */
    psql(`insert into request (id, no, side, name, tel, agree_at, state) values
            ('aaaaaaaa-0000-0000-0000-000000000139','SW-SET-0139',
             'start','ㅁ','01011110009',now(),'done') on conflict (id) do nothing;
          insert into deal (request_id, provider_id, amount) values
            ('aaaaaaaa-0000-0000-0000-000000000139','pv-set',99000000)
          on conflict (request_id) do nothing;`);

    r = denied(as(ST) + `select build_settlement('pv-set','2026-10-01','2026-10-31')`);
    ok("직원은 정산을 못 만든다",
       r.no && /관리자만/.test(r.why || ""), r.why);
    r = denied(as(AD) + `select build_settlement('pv-set','2026-10-31','2026-10-01')`);
    ok("기간이 거꾸로면 거절한다",
       r.no && /거꾸로/.test(r.why || ""), r.why);
    r = denied(as(AD) + `select build_settlement('zz-none','2026-10-01','2026-10-31')`);
    ok("없는 업체는 거절한다 (정산)", r.no && /없는 업체/.test(r.why || ""), r.why);
    /* ⚠️ "0원 청구서" 는 청구서가 아닙니다 (절대 규칙 2) */
    r = denied(as(AD) + `select build_settlement('pv-set','2026-01-01','2026-01-31')`);
    ok("⚠️ 셀 것이 없으면 0원 정산을 안 만든다",
       r.no && /확정된 수수료가 없습니다/.test(r.why || ""), r.why);

    const SID = psql(as(AD) +
      `select build_settlement('pv-set','2026-10-01','2026-10-31','10월 정산')`);
    ok("확정된 것만 더한다 (330,000 + 660,000)",
       psql(`select total from settlement where id='${SID}'`) === "990000");
    ok("⚠️⚠️ 확정 전인 계약금액(9,900만원)을 안 섞는다",
       Number(psql(`select total from settlement where id='${SID}'`)) < 99000000);
    ok("들어온 돈이 모자라면 대기다",
       psql(`select state from settlement where id='${SID}'`) === "wait");
    ok("집계가 기록에 남는다 (§8)",
       psql(`select count(*) from audit_log where obj='settlement'
              and obj_id='${SID}'`) === "1");

    /* 11월은 확정 440,000 · 입금 440,000 이라 **세어 보면** 입금입니다 */
    const S11 = psql(as(AD) +
      `select build_settlement('pv-set','2026-11-01','2026-11-30','11월')`);
    ok("입금이 차면 집계가 입금으로 바뀐다",
       psql(`select state from settlement where id='${S11}'`) === "paid");
    ok("입금일이 같이 적힌다",
       psql(`select count(*) from settlement where id='${S11}'
              and paid_at is not null`) === "1");

    /* ⚠️⚠️ **관리자도 표를 직접 못 고칩니다** — GRANT 가 읽기만입니다.
       여기가 열려 있으면 "가짜 정산" 의 길이 하나 생깁니다 (§13). */
    r = denied(as(AD) + `update settlement set state='paid' where id='${SID}'`);
    ok("⚠️⚠️ 관리자도 정산을 직접 'paid' 로 못 고친다", r.no, r.why);

    /* 입금이 실제로 들어오면(건별 mark_paid) **다시 세어서** 바뀝니다.
       ⚠️ `set role authenticated` 없이 become 만 하면 관리자 신분으로
       상위 권한이라, 돈 칸 트리거를 지나면서 씨앗을 고칠 수 있습니다. */
    psql(`select become('${AD}'); update deal set paid=660000,
            paid_at='2026-10-25' where request_id='aaaaaaaa-0000-0000-0000-000000000132'`);
    psql(as(AD) + `select build_settlement('pv-set','2026-10-01','2026-10-31','다시')`);
    ok("건별 입금이 차면 10월도 입금이 된다",
       psql(`select state from settlement where id='${SID}'`) === "paid");
    ok("같은 기간을 다시 세면 덮는다 (줄이 하나)",
       psql(`select count(*) from settlement where provider_id='pv-set'
              and from_date='2026-10-01' and to_date='2026-10-31'`) === "1");

    /* ⚠️ 들어온 돈을 보류로 덮지 않습니다 — 기록을 거짓으로 만듭니다 */
    r = denied(as(AD) + `select hold_settlement('${SID}',true,'증빙 확인 중')`);
    ok("⚠️ 입금으로 집계된 정산은 보류로 못 바꾼다",
       r.no && /이미 입금/.test(r.why || ""), r.why);

    /* 12월 — 입금 0 이라 대기이고, 여기서 보류를 눌러 봅니다 */
    const S12 = psql(as(AD) +
      `select build_settlement('pv-set','2026-12-01','2026-12-31','12월')`);
    r = denied(as(ST) + `select hold_settlement('${S12}',true,'x')`);
    ok("직원은 보류를 못 한다", r.no && /관리자만/.test(r.why || ""), r.why);
    r = denied(as(AD) + `select hold_settlement('${S12}',true)`);
    ok("사유 없는 보류는 거절한다", r.no && /사유/.test(r.why || ""), r.why);
    psql(as(AD) + `select hold_settlement('${S12}',true,'증빙을 더 받기로 했습니다')`);
    ok("보류가 된다", psql(`select state from settlement where id='${S12}'`) === "hold");
    ok("보류가 기록에 남는다 (§8)",
       psql(`select count(*) from audit_log where obj='settlement'
              and obj_id='${S12}' and to_state='hold'`) === "1");
    /* ⚠️⚠️ 사람이 세워 둔 것을 다시 세면서 풀어 버리면 왜 멈췄는지가
       사라집니다 */
    psql(as(AD) + `select build_settlement('pv-set','2026-12-01','2026-12-31','다시')`);
    ok("⚠️⚠️ 다시 세도 보류를 안 풀어 버린다",
       psql(`select state from settlement where id='${S12}'`) === "hold");
    psql(as(AD) + `select hold_settlement('${S12}',false,'증빙을 받았습니다')`);
    ok("보류를 풀면 대기로 돌아온다",
       psql(`select state from settlement where id='${S12}'`) === "wait");

    /* ⚠️⚠️ **손으로 'paid' 로 가는 문이 없는지**를 글자로도 봅니다 —
       나중에 "편해서" 그 문을 하나 만드는 날 §13 이 무너집니다. */
    const sql13 = fs.readFileSync(
      path.join(ROOT, "db/migrations/0013_provider_contact_settlement.sql"), "utf8");
    const holdFn = sql13.slice(sql13.indexOf("function hold_settlement"));
    ok("⚠️⚠️ 보류 문이 'paid' 를 쓰지 않는다",
       !/case when p_hold then 'hold' else 'paid'/.test(holdFn) &&
       !/state\s*=\s*'paid'/.test(holdFn));

    /* 업체는 자기 정산만 봅니다 (settle_mine) */
    ok("고객에게는 정산이 안 보인다",
       psql(as(A) + "select count(*) from settlement") === "0");
    ok("업체는 남의 정산을 못 본다 (pv-one 은 0건)",
       psql(as(PV) + "select count(*) from settlement where provider_id='pv-set'") === "0");
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
