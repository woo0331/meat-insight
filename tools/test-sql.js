#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   DB 를 **실제 Postgres 에서** 눌러 봅니다

     node tools/test-sql.js

   ⚠️⚠️ **이 검사가 있는 까닭.** 앞 서비스에서 0001 을 414줄 써 놓고
   한 번도 돌려 보지 않았다가, 돌려 보니 바로 둘이 나왔습니다 —
   GRANT 가 한 줄도 없었고, 서버가 service key 로 붙으면 auth.uid() 가
   비어서 **아무도 수수료를 확정할 수 없었습니다.** 둘 다 "빌드는
   성공인데 실제로는 안 되는" 종류입니다.

   ⚠️ Postgres 가 없으면 **건너뛰되 통과로 치지 않습니다** (exit 2).
   없는 환경에서 거짓 통과를 만들지 않습니다.

   ⚠️⚠️ 마이그레이션 목록을 손으로 적지 않습니다 — 폴더를 읽어 번호순으로
   돌립니다. 손으로 적으면 새 파일을 더하고 목록을 안 고쳐서 **검사만
   조용히 옛 스키마를 보는** 일이 납니다.
   ════════════════════════════════════════════════════════════════════ */
const { execFileSync, execSync } = require("child_process");
const fs = require("fs"), os = require("os"), path = require("path");

const ROOT = path.join(__dirname, "..");
let bad = 0, ran = 0;
function ok(name, cond, got){
  ran++;
  if(cond) console.log("  ✅ " + name);
  else { bad++; console.log("  ❌ " + name + (got !== undefined ? "  →  " + String(got).slice(0,300) : "")); }
}

function findBin(){
  for(const d of ["/usr/lib/postgresql/16/bin","/usr/lib/postgresql/15/bin",
                  "/usr/lib/postgresql/14/bin","/usr/local/pgsql/bin"])
    if(fs.existsSync(path.join(d,"initdb"))) return d;
  try{ return path.dirname(execSync("which initdb").toString().trim()); }catch(e){ return ""; }
}
const BIN  = findBin();
const DIR  = fs.mkdtempSync(path.join(os.tmpdir(), "golfsql-"));
const PORT = 5400 + (process.pid % 150);
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

/* ⚠️⚠️ **마지막 값만 돌려줍니다.** psql -c 는 문장 전부의 출력을 이어
   내놓습니다 — 통째로 견주다가 멀쩡한 스키마를 열한 건 실패로 잡은
   적이 있습니다. 값이 아니라 **검사가 틀린** 자리였습니다. */
function psql(sql, db){
  const out = execFileSync(path.join(BIN,"psql"),
    ["-h",DIR,"-p",String(PORT),"-U","postgres","-d",db||"golftest",
     "-t","-A","-v","ON_ERROR_STOP=1","-c",sql],
    { stdio:["ignore","pipe","pipe"] }).toString();
  const lines = out.split("\n").map(x=>x.trim()).filter(Boolean);
  /* ⚠️⚠️ 상태줄을 빠짐없이 걸러야 합니다. RESET 을 안 걸러서 값 자리에
     "RESET" 이 돌아오고 멀쩡한 검사 열 건이 실패로 찍혔습니다 —
     값이 아니라 **검사가 틀린** 자리입니다 (앞 서비스에서도 같은 일). */
  const vals = lines.filter(x=>!/^(SET|RESET|SELECT \d+|UPDATE \d+|INSERT \d+|DELETE \d+|BEGIN|COMMIT|ROLLBACK|DO|CREATE|ALTER|DROP|GRANT|REVOKE|COMMENT|TRUNCATE)\b/.test(x));
  return vals.length ? vals[vals.length-1] : "";
}
function psqlFile(f, db){
  return execFileSync(path.join(BIN,"psql"),
    ["-h",DIR,"-p",String(PORT),"-U","postgres","-d",db||"golftest",
     "-q","-v","ON_ERROR_STOP=1","-f",path.join(ROOT,f)],
    { stdio:["ignore","pipe","pipe"] }).toString();
}
function denied(sql, db){
  try{ psql(sql, db); return { no:false }; }
  catch(e){ return { no:true, why:String((e.stderr||e.stdout||e.message)).trim().split("\n")[0] }; }
}
function allowed(sql, db){
  try{ return { yes:true, out:psql(sql, db) }; }
  catch(e){ return { yes:false, why:String((e.stderr||e.stdout||e.message)).trim().split("\n")[0] }; }
}

if(!BIN){
  console.log("\n⚠️  Postgres 가 없어서 돌리지 못했습니다 (initdb 를 못 찾았습니다).");
  console.log("   ⚠️ **통과로 치지 않습니다.**  apt-get install -y postgresql\n");
  process.exit(2);
}

const MIGS = fs.readdirSync(path.join(ROOT,"db/migrations"))
  .filter(f => /^\d{4}_.*\.sql$/.test(f) && !/_down\.sql$/.test(f))
  .sort()
  .map(f => "db/migrations/" + f);

try{
  start();
  psql("create database golftest", "postgres");

  console.log("\n── 마이그레이션이 실제로 돌아가는가");
  psqlFile("db/test/00_stub_auth.sql");
  let applied = 0;
  for(const m of MIGS){
    try{ psqlFile(m); applied++; }
    catch(e){
      bad++; ran++;   /* ⚠️ ran 을 같이 올립니다 — 안 올리면 "통과 -1건" 이 찍힙니다 */
      /* ⚠️ NOTICE 가 앞에 잔뜩 붙습니다 — 진짜 까닭은 ERROR 줄입니다.
         처음에 앞 세 줄만 찍다가 NOTICE 만 보고 엉뚱한 곳을 고쳤습니다. */
      const all = String(e.stderr||e.stdout||e.message).trim().split("\n");
      const err = all.filter(x => /ERROR|치명|FATAL/.test(x));
      console.log("  ❌ " + m + "  →  " + (err.length ? err : all.slice(-3)).join(" | "));
      break;
    }
  }
  ok("파일 " + MIGS.length + "개가 번호순으로 전부 돈다", applied === MIGS.length,
     applied + "/" + MIGS.length);

  /* ⚠️ 판 번호는 schema_version 이 들고 있습니다 — 파일 수와 **다르면**
     어떤 파일이 자기 번호를 안 적은 것입니다 (조용히 어긋납니다). */
  const sv = psql("select count(*)::text from schema_version");
  ok("schema_version 줄 수가 파일 수와 같다", String(MIGS.length) === sv,
     "파일 " + MIGS.length + " · 표 " + sv);

  module.exports = {};
  require("./sql/roles.js")({ ok, psql, psqlFile, denied, allowed });
  require("./sql/money.js")({ ok, psql, psqlFile, denied, allowed });
  require("./sql/apply.js")({ ok, psql, psqlFile, denied, allowed });
  require("./sql/match.js")({ ok, psql, psqlFile, denied, allowed });
  /* ⚠️⚠️ 견적 문 셋(0008)은 2026-10 에 써 둔 뒤로 **한 번도 돌아간 적이
     없었습니다** — 배정이 없으면 첫 줄에서 거절하기 때문입니다. */
  require("./sql/quote.js")({ ok, psql, psqlFile, denied, allowed });
  /* ⚠️⚠️ 사장님이 붙여 넣으실 **안내문**은 아무 검사도 안 봅니다 —
     그래서 그 파일을 실제로 붙여 넣어 봅니다. */
  require("./sql/seed.js")({ ok, psql, psqlFile, denied, allowed });
  /* ⚠️⚠️ 매각 지표는 **사업의 값을 매기는 숫자**입니다 — 틀리면 투자자에게
     거짓을 말한 것이 됩니다. 경계값을 다른 묶음보다 많이 넣었습니다. */
  require("./sql/appt.js")({ ok, psql, psqlFile, denied, allowed });
  require("./sql/metrics.js")({ ok, psql, psqlFile, denied, allowed });
  /* ⚠️⚠️ 후기는 **지어낸 신뢰가 들어오는 문**입니다 — 아무나 쓸 수
     있으면 광고이고, 평점을 칸에 저장하면 누군가 4.9 를 적습니다.
     "누가 쓸 수 있나" 와 "집계 칸이 없는가" 를 같이 봅니다. */
  require("./sql/review.js")({ ok, psql, psqlFile, denied, allowed });
  /* ⚠️⚠️ 정지는 **그 업체의 영업을 멈추는 일**입니다 — 뜻하는 것 셋을
     따로 누르고, 일부러 안 막은 둘도 같이 눌러 봅니다. */
  require("./sql/suspend.js")({ ok, psql, psqlFile, denied, allowed });

}catch(e){
  bad++; ran++;
  console.log("\n❌ 검사가 터졌습니다: " + String(e.stderr||e.stdout||e.message).trim().split("\n").slice(0,5).join("\n"));
}finally{
  stop();
}
console.log("\n" + ran + "건 중 " + (ran-bad) + "건 통과 · " + bad + "건 실패");
process.exit(bad ? 1 : 0);
