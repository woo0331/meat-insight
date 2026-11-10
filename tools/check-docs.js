/* ════════════════════════════════════════════════════════════════════
   check-docs — **사장님이 보고 따라 하시는 글**이 없는 파일을 가리키나

   ⚠️⚠️⚠️ 2026-11-10 에 `db/README.md` 가 이런 상태였습니다 —
     · `0001`~`0023` 을 손으로 적은 표 (그동안 0070 까지 늘었습니다)
     · 붙여넣기 파일을 「0008 ~ 0022 **열다섯 개**」라고 소개 (예순셋)
     · `select set_provider_inhouse(...)` 를 붙여 넣으라고 적어 둠
       (그 함수는 `0024_golf_reset.sql` 이 **이미 지웠습니다**)
     · `build-pages.js` · `api/quote.js` · `api/deal.js` · `api/me.js`
       — **넷 다 지금 저장소에 없는 파일**입니다
   글은 아무 검사도 안 보므로 몇 달째 아무도 몰랐습니다.

   ⚠️⚠️ **고치는 글만 봅니다** — `CLAUDE.md` 와 `docs/` 는 **지난 일을
   적는 자리**라 없어진 파일 이름이 나오는 것이 맞습니다("…를 걷어
   냈습니다"). 그것까지 잡으면 **멀쩡한 기록을 고장이라고** 하게
   됩니다. 여기서 보는 것은 사장님이 **그대로 따라 하시는** 글뿐입니다.

   ⚠️ 세는 법 — 글 안의 백틱(`` ` ``) 안에서 **저장소 파일처럼 생긴
   것**만 꺼내 `fs.existsSync` 로 눌러 봅니다. 이름을 여기 적어 두지
   않습니다(적으면 그 목록이 또 썩습니다).

   ⚠️ **잰 것이 0개면 실패**입니다 — 꺼낸 이름이 하나도 없으면 꼴이
   바뀌어 **아무것도 안 보는 검사**가 된 것입니다.

   되돌려 보기:  node tools/check-docs.js --prove
   ════════════════════════════════════════════════════════════════════ */
const fs   = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

/* 사장님이 따라 하시는 글 — 지난 일을 적는 글(CLAUDE.md · docs/)은 뺍니다 */
const DOCS = ["README.md", "DEPLOY.md", path.join("db", "README.md")];

/* 저장소 파일처럼 생긴 것. ⚠️ 폴더 이름을 여기 적는 대신 **실제 폴더**를
   읽습니다 — 폴더가 늘어도 따라옵니다. */
const DIRS = fs.readdirSync(ROOT, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name.charAt(0) !== ".")
  .map(d => d.name);

const EXT = ["js", "sql", "css", "json", "md", "yml", "html"];

function picks(text){
  const out = [];
  /* 백틱 안의 덩이만 봅니다 — 본문에 그냥 적은 말은 파일이 아닙니다 */
  const re = /`([^`\n]+)`/g;
  let m;
  while((m = re.exec(text))){
    const raw = m[1].trim();
    /* 한 낱말이고 · 확장자가 있고 · 공백이 없어야 파일 후보입니다 */
    if(!raw || /\s/.test(raw)) continue;
    const dot = raw.lastIndexOf(".");
    if(dot < 0) continue;
    if(EXT.indexOf(raw.slice(dot + 1).toLowerCase()) < 0) continue;
    /* 주소(/api/session)도 · 바깥 주소도 아닙니다 */
    if(raw.charAt(0) === "/" || raw.indexOf("://") >= 0) continue;
    /* 과거 커밋을 가리키는 것은 지금 없어도 맞습니다 (git show <sha>:<파일>) */
    if(raw.indexOf(":") >= 0) continue;
    const top = raw.split("/")[0];
    const isFile = raw.indexOf("/") < 0 && fs.existsSync(path.join(ROOT, raw));
    if(DIRS.indexOf(top) < 0 && !isFile && raw.indexOf("/") >= 0) continue;
    out.push(raw);
  }
  return out;
}

/* ⚠️⚠️ **폴더를 뺀 줄임말은 글에서 맞는 말입니다** — `ship.js` 는
   `tools/ship.js` 이고 `verify.sql` 은 `db/verify.sql` 입니다. 그것까지
   "없다" 고 하면 **멀쩡한 글을 고장이라고** 합니다(이 저장소가 여러 번
   밟은 자리). 그래서 **이름만 같은 파일이 저장소 어딘가에 있으면**
   맞는 것으로 봅니다 — 없는 이름은 그래도 그대로 잡힙니다. */
const HAVE = new Set();
(function walk(dir){
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function(d){
    if(d.name.charAt(0) === "." || d.name === "node_modules") return;
    const abs = path.join(dir, d.name);
    if(d.isDirectory()) walk(abs); else HAVE.add(d.name);
  });
})(ROOT);

function exists(name){
  if(fs.existsSync(path.join(ROOT, name))) return true;
  return name.indexOf("/") < 0 && HAVE.has(name);
}

/* ⚠️⚠️ **없어진 파일을 일부러 가리키는 꼴이 있습니다** — 이 저장소는
   앞 서비스 것을 `git show 4563539:<파일>` 로 적습니다("…가 있었습니다 ·
   되살리시려면 …"). 그 글은 **맞는 글**이라 잡으면 안 됩니다.
   ⚠️ 다만 **그 글 안에 그 커밋 주소가 실제로 적혀 있을 때만** 봐줍니다 —
   그냥 "없어졌습니다" 라고만 적어 두면 되살릴 길이 없으니 잡습니다. */
function pardoned(text, name){
  const base = name.split("/").pop();
  return new RegExp("git show [0-9a-f]{7,40}:[^\\s`]*" +
    base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).test(text);
}

let seen = 0;
const bad = [];
DOCS.forEach(function(rel){
  const abs = path.join(ROOT, rel);
  if(!fs.existsSync(abs)){ bad.push(rel + " — 그 글 자체가 없습니다"); return; }
  const text = fs.readFileSync(abs, "utf8");
  picks(text).forEach(function(name){
    seen++;
    if(pardoned(text, name)) return;
    if(!exists(name))
      bad.push(rel + " 가 가리키는 `" + name + "` 이 저장소에 없습니다");
  });
});

/* ⚠️ 되돌려 보기 — 없는 이름을 넣어 보고 잡히는지 봅니다 */
if(process.argv.indexOf("--prove") >= 0){
  const bait = picks("앞: `tools/there-is-no-such-file.js` · 뒤: `db/migrations/9999_nope.sql`")
    .filter(n => !exists(n));
  console.log("   되돌려 보기 — 없는 이름 둘을 넣으니 " + bait.length + "건 잡습니다");
  if(bait.length !== 2){
    console.error("❌ 되돌려 보기가 안 잡습니다 — 꺼내는 꼴이 깨졌습니다");
    process.exit(1);
  }
}

if(seen === 0){
  console.error("❌ 잰 것이 0개입니다 — 글에서 파일 이름을 하나도 못 꺼냈습니다 " +
                "(꼴이 바뀌어 아무것도 안 보는 검사가 되었습니다)");
  process.exit(1);
}

if(bad.length){
  console.error("❌ 따라 하시는 글이 **없는 파일**을 가리킵니다 — " + bad.length + "건");
  bad.forEach(b => console.error("   · " + b));
  console.error("   ⚠️ 글은 아무 검사도 안 봅니다. 파일을 지우거나 이름을 바꾸는 날");
  console.error("      README · DEPLOY · db/README 를 같이 고치세요.");
  process.exit(1);
}

console.log("✅ 따라 하시는 글 " + DOCS.length + "장 · 가리키는 파일 " +
            seen + "개 · 없는 것 0건");
