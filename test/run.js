#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   전체 회귀 테스트

     node test/run.js              전부 실행
     node test/run.js router edit  이름에 router·edit 가 들어간 것만

   실제 브라우저(Chromium)로 index.html 을 띄우고, Supabase 대신
   test/fake-sb.js 의 가짜 클라이언트를 주입해서 확인합니다.
   실제 DB 에는 아무 것도 쓰지 않습니다.

   준비물: playwright (이 저장소에는 포함하지 않습니다)
     npm i -D playwright && npx playwright install chromium
   ════════════════════════════════════════════════════════════════════ */
const { execFileSync } = require("child_process");
const fs = require("fs"), path = require("path");

const DIR = __dirname;
const only = process.argv.slice(2);
const files = fs.readdirSync(DIR)
  .filter(f => f.endsWith("-e2e.js") || f === "e2e.js" || f === "e2e3.js")
  .filter(f => !only.length || only.some(k => f.includes(k)))
  .sort();

if (!files.length) { console.error("실행할 테스트가 없습니다."); process.exit(1); }

let fail = 0;
for (const f of files) {
  process.stdout.write("── " + f + "\n");
  try {
    const out = execFileSync("node", [path.join(DIR, f)], {
      cwd: DIR, encoding: "utf8", timeout: 300000, stdio: ["ignore", "pipe", "pipe"]
    });
    const lines = out.split("\n").filter(l => /✅ (전체 통과|페이지 에러 없음|에러 없음)|❌/.test(l));
    console.log(lines.length ? lines.join("\n") : out.trim().split("\n").slice(-2).join("\n"));
    if (lines.some(l => l.includes("❌"))) fail++;
  } catch (e) {
    console.log("  ❌ 실행 실패: " + String((e.stdout || e.message)).split("\n").slice(-3).join(" "));
    fail++;
  }
}
console.log("\n" + (fail ? "❌ " + fail + "/" + files.length + " 실패" : "✅ " + files.length + "종 전부 통과"));
process.exit(fail ? 1 : 0);
