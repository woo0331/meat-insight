#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   db/apply-from-0008.sql 을 다시 만듭니다 — 사장님이 붙여 넣는 파일

   ⚠️⚠️ **운영 DB 에는 0001~0007 까지만 돌아가 있습니다.** 그래서 이
   파일은 0008 부터 **마지막 번호까지** 이어 붙입니다. 마이그레이션을
   더할 때마다 다시 돌리세요 — 안 돌리면 사장님이 붙여 넣는 파일만
   조용히 옛날 것이 됩니다.

   ⚠️ 한 글자도 바꾸지 않고 **그대로** 잇습니다. 여기서 손보면 저장소의
   파일과 사장님이 돌린 것이 달라집니다.

   돌리기   node tools/make-apply.js
            node tools/make-apply.js --check   (다시 만들지 않고 같은지만 봅니다)
   ════════════════════════════════════════════════════════════════════ */
var fs = require("fs"), path = require("path");
var ROOT = path.join(__dirname, "..");
var DIR  = path.join(ROOT, "db/migrations");

/* 인자 — 아무것도 안 주면 지금까지와 똑같이 돕니다(ship.js 가 그렇게 부릅니다).
   --from N --to M --out <경로> 를 주면 그 구간만 한 조각으로 냅니다.
   ⚠️ 운영 DB 에 우리 판이 **하나도** 없을 때는 0001 부터 내야 합니다 —
      이 저장소의 붙여넣기 파일은 0008 부터여서 그 자리를 못 메웁니다. */
function arg(k, d){
  var i = process.argv.indexOf(k);
  return i > 0 && process.argv[i+1] ? process.argv[i+1] : d;
}
var FROM = parseInt(arg("--from", "8"), 10);
var TO   = parseInt(arg("--to", "9999"), 10);
var OUT  = path.join(ROOT, arg("--out", "db/apply-from-0008.sql"));
var PART = process.argv.indexOf("--from") > 0 || process.argv.indexOf("--to") > 0;

var files = fs.readdirSync(DIR)
  .filter(function(f){ return /^\d{4}_.*\.sql$/.test(f) && !/_down\.sql$/.test(f); })
  .sort()
  .filter(function(f){
    var n = parseInt(f.slice(0,4), 10);
    return n >= FROM && n <= TO;
  });

if(!files.length){ console.error("구간에 든 마이그레이션이 0개입니다 — 번호를 보세요"); process.exit(1); }

var last  = files[files.length-1].slice(0,4);
var first = files[0].slice(0,4);
var head =
"/* ==================================================================\n" +
"   " + first + " ~ " + last + " 를 한 번에 —\n" +
"   Supabase SQL 편집기에 **이 파일을 통째로** 붙여 넣고 Run 하세요.\n" +
"   ==================================================================\n" +
"   WARN 빌드가 만드는 파일입니다 — 손으로 고치지 마세요.\n" +
"   db/migrations 의 " + files.length + "개를 번호 차례로 이어 붙인 것이고\n" +
"   한 글자도 바꾸지 않았습니다. (node tools/make-apply.js)\n" +
"\n" +
(PART
 ? "   조각 파일입니다 — 바로 앞 조각까지 끝낸 DB 에만 쓰세요.\n" +
   "   어디까지 됐는지는 db/resume.sql 이 말해 줍니다\n" +
   "   (select max(n) from schema_version).\n"
 : "   이미 0007 까지 돌려 두신 DB 에 쓰는 것입니다.\n" +
   "   그보다 앞선 판이면 db/README.md 의 차례대로 먼저 올리세요 —\n" +
   "   이 파일은 건너뛴 번호를 메워 주지 않습니다.\n") +
"\n" +
"   돌린 뒤에는 db/verify.sql 을 붙여 넣어 보세요. 중간에서 멈추면 그\n" +
"   파일 하나만 따로 돌리고 그 다음부터 이어 가시면 됩니다 — 번호를\n" +
"   다시 쓰지 않습니다.\n" +
"\n" +
"   WARN 통째로 begin/commit 으로 감싸지 마세요 — 파일마다 제\n" +
"   트랜잭션이 있고 0015 는 일부러 감싸지 않았습니다. */\n\n";

var body = files.map(function(f){
  var bar = "/* ---------------------------- " + f + " ---------------------------- */\n";
  return bar + fs.readFileSync(path.join(DIR, f), "utf8").replace(/\s*$/, "") + "\n";
}).join("\n");

var out = head + body;

if(process.argv.indexOf("--check") >= 0){
  var now = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
  if(now === out){
    console.log("✅ " + path.relative(ROOT, OUT) + " 이 마이그레이션과 같습니다 (" + files.length + "개 · " + last + " 까지)");
    process.exit(0);
  }
  console.error("❌ " + path.relative(ROOT, OUT) + " 이 마이그레이션과 다릅니다 — node tools/make-apply.js 를 돌리세요");
  process.exit(1);
}
fs.writeFileSync(OUT, out);
console.log(path.relative(ROOT, OUT) + " 을 다시 만들었습니다 — " + files.length +
  "개 (" + first + " ~ " + last + ") · " + Math.round(out.length/1024) + "KB");
