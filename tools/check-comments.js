#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   주석이 코드를 삼키는 자리 — 빌드에서 멈춥니다

   ⚠️⚠️ **별표 둘 뒤에 빗금(별표별표슬래시)을 쓰면 블록 주석이 거기서
   닫힙니다.** 뒤가 코드가 되는데, 중괄호 짝이 맞으면 문법 검사도
   통과하고 빌드도 "성공" 이라고 말합니다. 오늘만 두 번 걸렸습니다 —
   강조하려고 적은 별표 둘 바로 뒤에 주소를 적었습니다.

   ⚠️ **백틱은 여기서 안 봅니다.** 작업 기억은 "주석에 백틱을 쓰지
   마세요" 라고 적었는데, 그 함정은 **소스 글자를 템플릿 문자열 안에
   끼워 넣는 구조**에서만 납니다 (앞 서비스의 빌드가 검사 본문을 그렇게
   끼웠습니다). 지금 구조에는 그런 자리가 없고, 되살린 파일 수백 줄이
   백틱을 쓰고 있어 전부 잡으면 **경고가 늘 떠서 진짜 함정이 묻힙니다.**
   ⚠️⚠️ **소스를 템플릿 문자열에 끼워 넣는 코드를 만드는 날 이 규칙을
   다시 켜세요.** 그날부터는 백틱 하나가 검사를 통째로 삼킵니다.

   ⚠️⚠️ **한글을 \\u 이스케이프로 적지 마세요** — 낱말이 조용히
   망가집니다. 빌드도 검사도 전부 통과합니다.

   돌리기   node tools/check-comments.js
            node tools/check-comments.js --prove
   ════════════════════════════════════════════════════════════════════ */
var fs = require("fs"), path = require("path");
var ROOT = path.join(__dirname, "..");
var SKIP = ["node_modules", ".git", "dist", "db/apply-from-0008.sql"];

function walk(dir, out){
  fs.readdirSync(dir).forEach(function(f){
    var full = path.join(dir, f);
    var rel = path.relative(ROOT, full);
    if(SKIP.some(function(s){ return rel === s || rel.indexOf(s + path.sep) === 0; })) return;
    var st = fs.statSync(full);
    if(st.isDirectory()) walk(full, out);
    else if(/\.(js|sql|css)$/.test(f)) out.push(rel);
  });
  return out;
}

/* ⚠️⚠️ **주석 안인지 실제로 따라가며 봅니다.** 처음에는 줄에 별표 둘 +
   빗금이 있으면 무조건 잡았는데, 문자열 안의 glob("**" + "/api/...")까지
   다섯 건 잡았습니다 — 화면이 아니라 **검사가 틀린** 자리입니다.
   문자열 · 줄 주석 · 템플릿을 갈라 가며 블록 주석 안만 봅니다. */
function scan(rel){
  var txt = fs.readFileSync(path.join(ROOT, rel), "utf8");
  var sql = /\.sql$/.test(rel);
  var hits = [], i = 0, line = 1, st = "code", q = "";
  function rest(k){                      /* 그 줄에 남은 글자 */
    var e = txt.indexOf("\n", k); return txt.slice(k, e < 0 ? txt.length : e);
  }
  while(i < txt.length){
    var c = txt[i], c2 = txt[i] + txt[i+1];
    if(c === "\n") line++;
    if(st === "code"){
      if(c2 === "/*"){ st = "block"; i += 2; continue; }
      if(!sql && c2 === "//"){ st = "linec"; i += 2; continue; }
      if(sql && c2 === "--"){ st = "linec"; i += 2; continue; }
      if(c === '"' || c === "'" || c === "`"){ st = "str"; q = c; i++; continue; }
      i++; continue;
    }
    if(st === "linec"){ if(c === "\n") st = "code"; i++; continue; }
    if(st === "str"){
      if(c === "\\"){ i += 2; continue; }
      if(c === q) st = "code";
      i++; continue;
    }
    /* 블록 주석 안 */
    if(c2 === "*/"){
      /* 닫히는 자리 바로 앞이 별표인가 — 그러면 글쓴이는 별표 강조를
         적었을 뿐인데 주석이 여기서 끝난 것입니다. 그 줄에 글이 더
         남아 있으면 그 글이 **코드가 됩니다.** */
      var starBefore = txt[i-1] === "*";
      var after = rest(i + 2).trim();
      if(starBefore && after.length > 0)
        hits.push(line + ": 별표 둘 뒤 빗금 — 여기서 주석이 닫히고 뒤가 코드가 됩니다  " +
                  after.slice(0, 50));
      st = "code"; i += 2; continue;
    }
    i++;
  }
  /* 한글을 \u 로 적은 자리 — 낱말이 조용히 망가집니다 */
  txt.split("\n").forEach(function(l, k){
    if(/\\u[aA][cC][0-9a-fA-F]{2}|\\u[dD]7[aA][0-9a-fA-F]|\\u[bB-cC][0-9a-fA-F]{3}/.test(l))
      hits.push((k+1) + ": 한글을 \\u 로 적었습니다  " + l.trim().slice(0, 50));
  });
  return hits;
}

var files = walk(ROOT, []);
var bad = 0;
files.forEach(function(f){
  scan(f).forEach(function(h){ bad++; console.error("❌ " + f + "  " + h); });
});

if(process.argv.indexOf("--prove") >= 0){
  /* ⚠️ 일부러 깨뜨려 봅니다 — 잡지 못하면 이 검사는 아무것도 안 합니다 */
  var tmp = path.join(ROOT, "tools", "__probe.js");
  fs.writeFileSync(tmp,
    "/* 강조 **" + "/join 을 적으면 여기서 닫힙니다 */\nvar x = 1;\n");
  var got = scan(path.relative(ROOT, tmp)).length;
  fs.unlinkSync(tmp);
  console.log("되돌려 보기: 일부러 넣으니 " + got + "건 잡힘  " + (got ? "O" : "❌ 아무것도 안 잡습니다"));
  if(!got) process.exit(1);
}

console.log((bad ? "" : "✅ ") + "파일 " + files.length + "개 · 주석이 코드를 삼키는 자리 " + bad + "건");
process.exit(bad ? 1 : 0);
