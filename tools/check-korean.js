#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   조사가 낱말에서 떨어졌는지 봅니다 (playwright 없이 돕니다)

     node tools/check-korean.js

   ⚠️ 이건 **에러도 안 나고 화면도 멀쩡한** 종류입니다. 긴 글을
   `"…" +` 로 이어 붙이다 보면 줄이 바뀌는 자리에 띄어쓰기가 하나
   들어가고, 그게 하필 낱말 가운데였을 때 화면에 "서면 으로" 가
   찍힙니다. 실제로 그렇게 나가 있었습니다.

   변수를 이어 붙일 때도 같습니다 — `v.brand + " 입니다."` 는
   "시작과 정리 입니다." 가 됩니다.

   ⚠️ **혼자 절대 못 서는 조사 · 어미만 봅니다.** "해야 합니다" 처럼
   띄는 것이 맞는 말까지 넣었더니 631건이 나와서 아무 쓸모가 없었습니다.
   목록을 늘리실 때는 그 낱말이 **문장 첫머리에 올 수 있는지**만
   따져 보세요 — 올 수 있으면 넣지 마세요 ("보다" · "만" · "라면").

   ⚠️ 이건 띄어쓰기만 봅니다. 맞춤법 · 높임말은 사람이 봐야 합니다.
   ════════════════════════════════════════════════════════════════════ */
const fs = require("fs"), path = require("path");

/* 앞말에 반드시 붙는 것들 */
const STICK = ["으로","입니다","습니다","에서","에게","까지","부터","처럼",
  "이라고","라고","이라는","이며","이고","이나","이라면","였습니다",
  "이었습니다","이지만","으니까","으면서","이든","이란","로서","로써"];

const AFTER_WORD = new RegExp("([가-힣]) (" + STICK.join("|") + ")(?![가-힣])", "g");
/* `+ " 입니다."` 꼴 — 앞에 변수가 붙는 자리라 소스만 봐서는 안 보입니다 */
const AFTER_VAR  = new RegExp('\\+\\s*"\\s+(' + STICK.join("|") + ")(?![가-힣])", "g");

/* ⚠️ 주석은 빼고 봅니다. 주석은 화면에 안 나가고, 무엇보다 이 파일의
   설명글에 "서면 으로" 같은 **보기**가 적혀 있어서 안 빼면 검사가
   자기 자신을 잡습니다. */
function strip(src){
  return src.replace(/\/\*[\s\S]*?\*\//g, " ")
            .replace(/(^|[^:\\])\/\/[^\n]*/g, "$1");
}

const SKIP = /node_modules|\.git|^shots$/;
let files = [];
(function walk(d){
  fs.readdirSync(d).forEach(function(f){
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) { if (!SKIP.test(f)) walk(p); }
    else if (/\.js$/.test(f)) files.push(p);
  });
})(".");

const hits = [];
files.forEach(function(p){
  const raw = fs.readFileSync(p, "utf8");
  /* ⚠️ **이어 붙인 뒤의 모습**으로 봅니다. 화면에 나가는 것이 그
     모습이고, 줄 단위로 보면 낱말이 두 줄에 걸쳐 있어 못 찾습니다. */
  const joined = strip(raw).replace(/"\s*\+\s*\n\s*"/g, "");
  [[AFTER_WORD, "낱말에서 떨어짐"], [AFTER_VAR, "변수 뒤에 띄어 붙임"]]
    .forEach(function(pair){
      const re = new RegExp(pair[0].source, "g");
      let m;
      while ((m = re.exec(joined))) {
        const at = joined.slice(0, m.index).split("\n").length;
        hits.push({ file:p, line:at, why:pair[1],
          txt: joined.slice(Math.max(0, m.index - 34), m.index + 44)
                 .replace(/\n/g, " ").trim() });
      }
    });
});

console.log("\n── 조사가 낱말에서 떨어진 곳 · 파일 " + files.length + "개");
if (!hits.length) {
  console.log("  ✅ 없습니다");
  console.log("     ⚠️ 이건 띄어쓰기만 봅니다 — 맞춤법 · 높임말은 사람이 보세요.");
  process.exit(0);
}
hits.forEach(function(h){
  console.log("  ❌ " + h.file + ":" + h.line + "  (" + h.why + ")");
  console.log("     …" + h.txt + "…");
});
console.log("\n❌ " + hits.length + "건");
process.exit(1);
