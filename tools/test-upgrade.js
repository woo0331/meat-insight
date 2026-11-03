#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   운영 DB 에 올렸을 때 **기존 데이터가 어떻게 되는가** (지시서 11번 9단계)

   지시서는 "기존 기능과 데이터에 대한 영향 및 테스트 결과를 확인한 뒤
   배포 가능한 상태로 준비할 것" 이라고 적었습니다. 글로 "괜찮습니다"
   라고 쓰는 대신 **실제로 해 봅니다.**

   하는 일
     ① 빈 Postgres 에 **운영과 같은 상태**를 만듭니다 (0001~0007 만)
     ② 중고폰 시절의 손님 자료를 **그대로 닮은 줄**을 넣습니다
        (접수 · 배정 · 계약 · 정산 · 감사 기록)
     ③ 사장님이 **실제로 붙여 넣을 파일**을 그대로 돌립니다
        (db/apply-from-0008.sql — 손으로 고른 파일이 아닙니다)
     ④ 넣어 둔 줄이 **하나도 안 사라졌는지** 셉니다
     ⑤ 중고폰 시절의 분류 키가 **그대로 읽히는지** 봅니다
     ⑥ 골프 쪽 새 문이 **그 DB 에서 도는지** 봅니다

   ⚠️⚠️ **운영 DB 에서 되돌리는 SQL 을 돌리지 마세요.** 돌리면 손님
   접수 · 계약 · 감사 기록이 같이 사라집니다. 되돌리기는 **배포한 커밋을
   revert** 하는 것이지 DB 를 되감는 것이 아닙니다.

   돌리기   node tools/test-upgrade.js
   ════════════════════════════════════════════════════════════════════ */
const { execFileSync, execSync } = require("child_process");
const fs = require("fs"), os = require("os"), path = require("path");

const ROOT = path.join(__dirname, "..");
let bad = 0, ran = 0;
function ok(name, cond, got){
  ran++;
  if(cond) console.log("  ✅ " + name);
  else { bad++; console.log("  ❌ " + name + (got !== undefined ? "  →  " + String(got).slice(0, 260) : "")); }
}

function findBin(){
  for(const d of ["/usr/lib/postgresql/16/bin","/usr/lib/postgresql/15/bin",
                  "/usr/lib/postgresql/14/bin","/usr/local/pgsql/bin"])
    if(fs.existsSync(path.join(d,"initdb"))) return d;
  try{ return path.dirname(execSync("which initdb").toString().trim()); }catch(e){ return ""; }
}
const BIN  = findBin();
const DIR  = fs.mkdtempSync(path.join(os.tmpdir(), "golfup-"));
const PORT = 5600 + (process.pid % 150);
let started = false;
function sh(c){ return execSync(c, { stdio:["ignore","pipe","pipe"] }).toString(); }
function asPg(){ try{ sh("id postgres"); return true; }catch(e){ return false; } }
function me(){ try{ return sh("id -un").trim(); }catch(e){ return ""; } }
function pre(){ return (asPg() && me() === "root") ? "su postgres -c " : ""; }
function q(s){ return pre() ? ("'" + s.replace(/'/g, "'\\''") + "'") : s; }
function start(){
  if(pre()) sh("chown -R postgres:postgres " + DIR);
  sh(pre() + q(BIN + "/initdb -D " + DIR + "/data -A trust -U postgres"));
  sh(pre() + q(BIN + "/pg_ctl -D " + DIR + "/data -l " + DIR + "/log -o \"-p " +
     PORT + " -k " + DIR + "\" start"));
  started = true;
}
function stop(){
  if(!started) return;
  try{ sh(pre() + q(BIN + "/pg_ctl -D " + DIR + "/data stop -m immediate")); }catch(e){}
  try{ fs.rmSync(DIR, { recursive:true, force:true }); }catch(e){}
}
function psql(sql, db){
  const out = execFileSync(path.join(BIN,"psql"),
    ["-h",DIR,"-p",String(PORT),"-U","postgres","-d",db||"upgrade",
     "-t","-A","-v","ON_ERROR_STOP=1","-c",sql],
    { stdio:["ignore","pipe","pipe"] }).toString();
  const lines = out.split("\n").map(x=>x.trim()).filter(Boolean);
  const vals = lines.filter(x=>!/^(SET|RESET|SELECT \d+|UPDATE \d+|INSERT \d+|DELETE \d+|BEGIN|COMMIT|ROLLBACK|DO|CREATE|ALTER|DROP|GRANT|REVOKE|COMMENT|TRUNCATE)\b/.test(x));
  return vals.length ? vals[vals.length-1] : "";
}
function psqlFile(f){
  return execFileSync(path.join(BIN,"psql"),
    ["-h",DIR,"-p",String(PORT),"-U","postgres","-d","upgrade",
     "-q","-v","ON_ERROR_STOP=1","-f",path.join(ROOT,f)],
    { stdio:["ignore","pipe","pipe"] }).toString();
}
function allowed(sql){
  try{ return { yes:true, out:psql(sql) }; }
  catch(e){ return { yes:false, why:String((e.stderr||e.stdout||e.message)).trim()
    .split("\n").filter(x=>/ERROR/.test(x)).join(" | ") }; }
}

if(!BIN){
  console.log("\n⚠️  Postgres 가 없어서 돌리지 못했습니다. **통과로 치지 않습니다.**\n");
  process.exit(2);
}

try{
  start();
  psql("create database upgrade", "postgres");

  console.log("\n── ① 운영과 같은 상태를 만듭니다 (0001 ~ 0007 만)");
  psqlFile("db/test/00_stub_auth.sql");
  const PROD = ["0001_init","0002_schema_version","0003_confirm_fee","0004_move_state",
                "0005_account_claim","0006_hold_state","0007_deal_provider_fee"];
  PROD.forEach(f => psqlFile("db/migrations/" + f + ".sql"));
  ok("운영 판 번호가 7 이다", psql("select max(n)::text from schema_version") === "7");

  console.log("\n── ② 중고폰 시절의 손님 자료를 닮은 줄을 넣습니다");
  const U = psql("insert into auth.users (email) values ('old@x.test') returning id");
  const V = psql("insert into auth.users (email) values ('oldadmin@x.test') returning id");
  psql("insert into account (id, role, name) values " +
       "('" + U + "','customer','옛손님'), ('" + V + "','admin','옛관리자') " +
       "on conflict (id) do update set role = excluded.role, name = excluded.name");
  psql("insert into provider (id, name, listed, subs, regions) values " +
       "('old-shop','종로 중고폰', true, array['lcd','battery'], array['seoul'])");
  /* ⚠️ 신청에는 **그 시절의 분류 키**가 글자로 들어 있습니다 — 골프 키가
     그것과 겹치면 여기 뜻이 조용히 바뀝니다. 그래서 겹치지 않게 지었고,
     여기서 실제로 그대로 읽히는지 봅니다. */
  /* ⚠️ 그 시절 분류 키는 request.cat 에 **글자로** 들어 있습니다
     (request_item.service_id 는 0009 부터라 운영에는 아직 없습니다). */
  const R = psql("insert into request (no, side, cat, name, tel, agree_at, body) values " +
                 "('SW20261101','ops','fix','옛손님','01011112222', now(), " +
                 "'액정이 깨졌습니다') returning id");
  psql("insert into assignment (request_id, provider_id, agree3rd_at) " +
       "values ('" + R + "','old-shop', now())");
  psql("insert into deal (request_id, provider_id, amount) values ('" + R + "','old-shop', 120000)");
  psql("insert into audit_log (by_user, by_role, obj, obj_id, to_state, why) values " +
       "('" + V + "','admin','request','" + R + "','new','옛 기록')");

  const before = {};
  ["account","provider","request","assignment","deal","audit_log","fee_policy","settlement"]
    .forEach(t => before[t] = psql("select count(*)::text from " + t));
  console.log("   넣어 둔 줄: " + Object.keys(before)
    .map(t => t + " " + before[t]).join(" · "));

  console.log("\n── ③ 사장님이 붙여 넣을 **그 파일 그대로** 돌립니다");
  let upOk = true, upWhy = "";
  try{ psqlFile("db/apply-from-0008.sql"); }
  catch(e){
    upOk = false;
    upWhy = String(e.stderr||e.stdout||e.message).split("\n").filter(x=>/ERROR/.test(x)).join(" | ");
  }
  ok("db/apply-from-0008.sql 이 끝까지 돈다", upOk, upWhy);
  /* ⚠️⚠️ **판 번호를 숫자로 박지 않습니다.** 28 이라고 적어 뒀다가
     0029 를 더한 날 멀쩡한 저장소를 실패로 잡았습니다 (작업 기억의
     "검사에 그날의 개수를 박지 마세요"). 파일에서 셉니다. */
  var want = fs.readdirSync(path.join(ROOT, "db/migrations"))
    .filter(function(f){ return /^\d{4}_.*\.sql$/.test(f) && !/_down\.sql$/.test(f); })
    .map(function(f){ return parseInt(f.slice(0, 4), 10); })
    .reduce(function(a, b){ return Math.max(a, b); }, 0);
  ok("판 번호가 마지막 파일 번호(" + want + ")까지 올라간다",
     psql("select max(n)::text from schema_version") === String(want),
     psql("select max(n)::text from schema_version"));

  console.log("\n── ④ 넣어 둔 줄이 하나도 안 사라졌는가");
  Object.keys(before).forEach(function(t){
    const now = psql("select count(*)::text from " + t);
    ok(t + " 줄 수가 그대로다 (" + before[t] + ")", now === before[t], "지금 " + now);
  });
  ok("손님 신청의 내용이 그대로다",
     psql("select body from request where id='" + R + "'") === "액정이 깨졌습니다");
  ok("계약 금액이 그대로다",
     psql("select amount::text from deal where request_id='" + R + "'") === "120000");
  ok("옛 감사 기록이 그대로다",
     psql("select why from audit_log where obj_id='" + R + "' and why='옛 기록'") === "옛 기록");

  console.log("\n── ⑤ 중고폰 시절의 분류 키가 그대로 읽히는가");
  /* ⚠️⚠️ 골프 키가 옛 키와 겹치면 **여기 뜻이 조용히 바뀝니다.**
     tools/check-keys.js 가 빌드에서 막지만, 올린 뒤에도 그대로인지
     실제 DB 에서 한 번 더 봅니다. */
  ok("옛 신청의 분류 키(cat)가 'fix' 그대로다",
     psql("select cat from request where id='" + R + "'") === "fix");
  ok("옛 업체의 subs 가 그대로다",
     psql("select array_to_string(subs,',') from provider where id='old-shop'") === "lcd,battery");

  /* ⚠️⚠️ **0030 이 붙인 `is_test` 가 기존 업체를 건드리지 않았는가.**
     `not null` 을 default 와 같이 적지 않으면 줄이 있는 표에서 그
     자리에서 터집니다. 더 조용한 사고는 default 를 true 로 적는 것인데,
     그러면 **올리는 순간 참 업체가 전부 손님 화면에서 사라집니다.** */
  ok("올린 뒤에도 옛 업체는 **참 업체**다 (is_test 가 false)",
     psql("select is_test::text from provider where id='old-shop'") === "false");
  ok("옛 업체가 공개 보기에 그대로 들어온다 (0032 — 사라지지 않았다)",
     psql("select count(*)::text from v_provider_card where id='old-shop'") === "1");
  /* ⚠️ 옛 자료에 검사용이 하나도 없어야 합니다 — 있으면 0030 의
     default 가 틀린 것입니다. */
  ok("옛 자료에 검사용으로 찍힌 업체가 **하나도 없다**",
     psql("select count(*)::text from provider where is_test") === "0");

  console.log("\n── ⑥ 중고폰 전용 표만 걷혔는가");
  ok("기기 재고 표가 없다 (애초에 없던 것)",
     psql("select count(*)::text from pg_tables where schemaname='public' " +
          "and tablename like 'device%'") === "0");
  ok("provider.inhouse 칸이 없다",
     psql("select count(*)::text from information_schema.columns " +
          "where table_name='provider' and column_name='inhouse'") === "0");
  ok("중고폰 수익상품이 0건이다",
     psql("select count(*)::text from offer where id like '%buyin%'") === "0");

  console.log("\n── ⑦ 골프 쪽 새 문이 이 DB 에서 도는가");
  ok("account_hat 표가 생겼다",
     psql("select count(*)::text from pg_tables where tablename='account_hat'") === "1");
  ok("광고 · 멤버십 표가 생겼다",
     psql("select count(*)::text from pg_tables where tablename in " +
          "('ad_run','membership_plan','provider_membership')") === "3");
  ok("멤버십 요금제는 **빈 표**다 (지어낸 값 0건)",
     psql("select count(*)::text from membership_plan") === "0");

  const a = allowed("select make_apply(jsonb_build_object(" +
    "'company','성남 그린골프','name','홍길동','tel','01012345678'," +
    "'services', jsonb_build_array('rg-in'), 'agree_at', to_jsonb(now())))");
  ok("입점 신청 문이 이 DB 에서 돈다", a.yes && /^GA\d{6}-\d{4}$/.test(a.out),
     a.yes ? a.out : a.why);

  /* ⚠️ 옛 업체 계정을 이으면 사업자 모자가 저절로 붙는가 (0028) */
  psql("update account set role='provider', provider_id='old-shop' where id='" + U + "'");
  ok("옛 계정을 업체에 이으면 사업자 모자가 붙는다",
     psql("select count(*)::text from account_hat where account_id='" + U +
          "' and hat='biz'") === "1");

  console.log("\n── ⑧ 두 번 돌려도 안전한가 (사장님이 실수로 또 붙여 넣으면)");
  let twice = true, twiceWhy = "";
  try{ psqlFile("db/apply-from-0008.sql"); }
  catch(e){
    twice = false;
    twiceWhy = String(e.stderr||e.stdout||e.message).split("\n").filter(x=>/ERROR/.test(x)).join(" | ");
  }
  ok("두 번째도 끝까지 돈다", twice, twiceWhy);
  Object.keys(before).forEach(function(t){
    if(t === "audit_log") return;        /* 감사 기록은 늘어나는 것이 맞습니다 */
    const now = psql("select count(*)::text from " + t);
    ok("두 번 돌려도 " + t + " 가 안 늘어난다", now === before[t], "지금 " + now);
  });

}catch(e){
  bad++; ran++;
  console.log("\n❌ 검사가 터졌습니다: " +
    String(e.stderr||e.stdout||e.message).trim().split("\n").slice(0, 6).join("\n"));
}finally{
  stop();
}
console.log("\n" + ran + "건 중 " + (ran - bad) + "건 통과 · " + bad + "건 실패");
process.exit(bad ? 1 : 0);
