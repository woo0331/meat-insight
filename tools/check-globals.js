#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   `window.` 없이 쓴 맨이름 — 빌드에서 멈춥니다

   ⚠️⚠️ **이 검사가 있는 까닭.** 브라우저에서는 `window.foo = …` 로 둔
   것을 그냥 `foo()` 로 불러도 됩니다. 그런데 **빌드와 검사는 node 에서**
   돌고, 거기서는 `window` 가 흉내 낸 객체라 맨이름이 터집니다.

   세 번 밟았습니다 (2026-11-03) —
     `korean.js` 의 `josa` · `koJong`,  `catalog.js` 의 `amCatItems`,
     `regions.js` 의 `AM_REGIONS` · `amRegion`.
   ⚠️ 셋 다 **화면에서는 멀쩡했고** 빌드에서만 터졌습니다. 더 나쁜 꼴도
   있습니다 — 그 자리가 `try` 안이면 **조용히 빈 값**이 됩니다.

   재는 법 — `js/` 안에서 `window.NAME = …` 로 둔 이름을 모으고,
   같은 파일에서 그 이름을 **`window.` 없이** 쓴 자리를 찾습니다.
   ⚠️ 글자 · 주석 안은 봅니다만, 제 이름을 선언하는 줄(`window.NAME =`)과
   지역 변수(`var NAME`)는 뺍니다.

   돌리기   node tools/check-globals.js
            node tools/check-globals.js --prove
   ════════════════════════════════════════════════════════════════════ */
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");

function walk(dir, out){
  fs.readdirSync(dir).forEach(function(f){
    const full = path.join(dir, f);
    if(fs.statSync(full).isDirectory()) return walk(full, out);
    if(/\.js$/.test(f)) out.push(path.relative(ROOT, full));
  });
  return out;
}
const FILES = walk(path.join(ROOT, "js"), []);

/* 글자 · 주석을 지웁니다 — 그 안의 이름은 코드가 아닙니다 */
function strip(src){
  /* ⚠️ 주석을 공백 하나로 바꾸면 **줄이 줄어들어 줄 번호가 밀립니다.**
     처음에 그렇게 찍어서 43줄이라고 알렸는데 실제로는 95줄이었습니다.
     줄바꿈은 그대로 두고 글자만 지웁니다. */
  return src
    .replace(/\/\*[\s\S]*?\*\//g, function(m){ return m.replace(/[^\n]/g, " "); })
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ")
    .replace(/'(\\.|[^'\\])*'/g, "''")
    .replace(/"(\\.|[^"\\])*"/g, '""')
    .replace(/`(\\.|[^`\\])*`/g, "``");
}

function scan(rel){
  const raw  = fs.readFileSync(path.join(ROOT, rel), "utf8");
  const code = strip(raw);
  /* 이 파일이 window 에 두는 이름 */
  const mine = [];
  let m, re = /window\.([A-Za-z_$][\w$]*)\s*=/g;
  while((m = re.exec(code))) if(mine.indexOf(m[1]) < 0) mine.push(m[1]);
  if(!mine.length) return [];

  /* 지역 변수로 가린 이름은 뺍니다 (같은 이름의 var 가 있으면 그쪽입니다) */
  const local = {};
  let lm, lre = /\b(?:var|let|const|function)\s+([A-Za-z_$][\w$]*)/g;
  while((lm = lre.exec(code))) local[lm[1]] = 1;

  const hits = [];
  mine.forEach(function(name){
    if(local[name]) return;
    /* `window.` 이나 `.` 뒤가 아닌 자리에서 쓰인 곳 */
    const use = new RegExp("(^|[^\\w$.])" + name.replace(/\$/g, "\\$") + "\\b", "g");
    const lines = code.split("\n");
    lines.forEach(function(l, i){
      use.lastIndex = 0;
      if(!use.test(l)) return;
      /* 제 이름을 두는 줄은 뺍니다 */
      if(new RegExp("window\\." + name.replace(/\$/g, "\\$") + "\\s*=").test(l)) return;
      hits.push((i + 1) + ": " + name + " 을 window. 없이 씁니다  " +
                raw.split("\n")[i].trim().slice(0, 56));
    });
  });
  return hits;
}

let bad = 0;
FILES.forEach(function(f){
  scan(f).forEach(function(h){ bad++; console.error("❌ " + f + "  " + h); });
});

if(process.argv.indexOf("--prove") >= 0){
  const probe = path.join(ROOT, "js", "__probe.js");
  fs.writeFileSync(probe,
    "window.amProbeThing = function(){ return 1; };\n" +
    "window.amProbeUse = function(){ return amProbeThing(); };\n");
  const got = scan(path.relative(ROOT, probe)).length;
  fs.unlinkSync(probe);
  console.log("되돌려 보기: 맨이름을 넣으니 " + got + "건 잡힘  " +
              (got ? "O" : "❌ 아무것도 안 잡습니다"));
  if(!got) process.exit(1);
}

console.log((bad ? "" : "✅ ") + "js 파일 " + FILES.length +
            "개 · window. 없이 쓴 맨이름 " + bad + "건");
process.exit(bad ? 1 : 0);
