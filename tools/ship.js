#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   올리기 전에 거치는 문 하나 — 여기가 초록일 때만 main 으로 갑니다

     node tools/ship.js            전부 돌립니다 (합치지 않습니다)
     node tools/ship.js --quick    Postgres 가 필요한 것은 건너뜁니다
     node tools/ship.js --merge    전부 초록이면 **main 으로 합치고 올립니다**

   ⚠️⚠️ **--merge 는 곧 배포입니다.** main 이 움직이면 Vercel 이 그
   순간 손님 화면을 바꿉니다. 그래서 기본값이 아니고, CI 도 사장님이
   단추를 누를 때만 붙입니다. 건너뛴 묶음이 하나라도 있으면 합치지
   않습니다 — 안 돌려 본 것이 깨진 채로 나갑니다.

   ⚠️⚠️ **올리는 것이 곧 배포입니다.** main 이 움직이면 손님 화면이
   바뀝니다. 그래서 여기를 지나지 않은 것은 올리지 않습니다.

   ⚠️⚠️ **빌드 결과가 커밋과 같은지**도 봅니다. 앞 서비스에서 마이그
   레이션의 **주석 한 줄**만 고치고 빌드를 다시 안 돌려서, 사장님이
   붙여 넣는 파일만 옛날 것이 된 적이 있습니다 — 코드도 배포도
   멀쩡한데 그 파일만 어긋납니다.

   ⚠️ 건너뛴 것은 **통과로 치지 않습니다.** 없는 환경에서 거짓 초록을
   만들지 않습니다 (Postgres 가 없으면 그렇게 적고 1 로 떨어집니다).
   ════════════════════════════════════════════════════════════════════ */
const { spawnSync } = require("child_process");
const path = require("path");
const ROOT = path.join(__dirname, "..");

const quick = process.argv.indexOf("--quick") >= 0;

/* 차례가 뜻이 있습니다 — 먼저 찍고, 찍힌 것을 잽니다. */
const STEPS = [
  ["화면을 찍습니다",            ["build.js"],                    false],
  ["붙여넣기 파일을 다시 만듭니다", ["tools/make-apply.js"],         false],
  ["주석이 코드를 삼키나",        ["tools/check-comments.js", "--prove"], false],
  ["window. 없이 쓴 맨이름",      ["tools/check-globals.js", "--prove"], false],
  ["상태 말이 DB 와 같나",        ["tools/check-deal.js", "--prove"], false],
  /* ⚠️⚠️ **문을 만들고 부르는 화면을 안 만든 자리** — approve_provider 가
     그랬습니다 (문을 세 번 고쳤는데 부르는 자리가 0곳). 사람이 손으로
     grep 해서 겨우 찾았으니, 도구가 셉니다. */
  ["문을 부르는 자리가 있나",      ["tools/check-doors.js", "--prove"], false],
  /* ⚠️ 뒤 번호가 앞 번호를 덮는 짝이 작업 기억에 적힌 대로인가 —
     목록이 썩으면 **없는 안전을 있다고** 읽습니다 (앞 번호를 다시
     붙여 넣는 날 조용히 내려갑니다). */
  ["덮는 짝이 적힌 대로인가",      ["tools/check-chains.js", "--prove"], false],
  ["분류 키가 옛 키와 겹치나",     ["tools/check-keys.js"],         false],
  /* ⚠️ `--prove` 를 붙입니다 — esc() 검사가 함수를 따라가게 고친 뒤로는
     되돌려 보지 않으면 **느슨해진 자리**를 알 수 없습니다. */
  ["키 · 헤더 · CSP",            ["tools/check-safe.js", "--prove"], false],
  ["주소가 vercel 규칙에 걸리나",  ["tools/check-routes.js", "--prove"], false],
  ["링크가 실제로 열리나",        ["tools/check-links.js"],        false],
  /* ⚠️ 사진 규격 — **파일을 실제로 열어** 잽니다 (0장이면 0장이라고
     말하고 통과로 치지 않습니다). */
  ["사진이 규격에 맞나",          ["tools/check-photos.js"],       false],
  /* ⚠️ 이름표에 폭 **갯수를 적지 않습니다.** "네 폭" 이라고 박아
     두었는데 그 사이 360 · 430 이 늘어 **다섯 폭**이 되어 있었습니다
     (2026-11-05). 재는 폭은 check-screens.js 의 WIDTHS 한 곳입니다. */
  ["폭마다 전부 잽니다",          ["tools/check-screens.js"],      false],
  ["접근성을 잽니다",            ["tools/check-a11y.js"],         false],
  ["입점 신청 양식을 눌러 봅니다", ["tools/test-join.js"],          false],
  ["매칭 요청 양식을 눌러 봅니다",  ["tools/test-match.js"],         false],
  ["고객센터 문의를 눌러 봅니다",   ["tools/test-help.js"],          false],
  ["관리자 화면을 눌러 봅니다",    ["tools/test-admin.js"],         false],
  /* ⚠️⚠️ **로그인한 뒤에 그려진 링크**는 check-links 가 못 봅니다 —
     이 묶음이 유일한 자리입니다 (0건인 상자가 막다른 길이 아닌지도). */
  ["손님이 한 바퀴 돌아봅니다",    ["tools/test-journey.js"],       false],
  /* ⚠️⚠️ 견적 흐름의 세 화면 — 배정 · 견적 제출 · 견적 비교.
     ⚠️ 그 가운데 **화면 쪽 규칙** 둘은 DB 가 안 막습니다 (수락 전
     연락처 가리기 · 동의 체크 없이 안 보내기) — 여기서만 잡힙니다. */
  ["견적 흐름 세 화면을 눌러 봅니다", ["tools/test-desk.js"],          false],
  /* ⚠️⚠️ 업체가 0곳이라 "있을 때" 자리는 아무도 본 적이 없습니다 —
     씨앗을 넣고 실제로 찍어 봅니다. 끝나면 사본으로 되돌립니다. */
  ["업체가 있을 때를 눌러 봅니다",  ["tools/test-providers.js"],     false],
  /* ⚠️⚠️ 사진이 0장이라 사진이 들어가는 자리는 아무도 본 적이 없습니다 —
     **가장 밝은 사진**을 일부러 넣어 흰 글자가 읽히는지 잽니다.
     ⚠️ 막을 옅게 하면 이 검사가 실제로 떨어지는지까지 봅니다. */
  ["사진이 들어왔을 때를 눌러 봅니다", ["tools/test-photos.js"],     false],
  ["DB 를 눌러 봅니다",          ["tools/test-sql.js"],           true],
  /* ⚠️⚠️ 운영 DB 에 올렸을 때 기존 자료가 어떻게 되는지 — 지시서 11번이
     "기존 기능과 데이터에 대한 영향 및 테스트 결과를 확인한 뒤" 라고
     적은 자리입니다. 글로 괜찮다고 쓰지 않고 실제로 해 봅니다. */
  ["올렸을 때 기존 자료가 어떻게 되나", ["tools/test-upgrade.js"],   true]
];

let bad = 0, skipped = [];
const t0 = Date.now();

for(const [name, argv, needsPg] of STEPS){
  if(quick && needsPg){ skipped.push(name); continue; }
  process.stdout.write("\n▶ " + name + "  (" + argv[0] + ")\n");
  const r = spawnSync(process.execPath, argv, { cwd: ROOT, stdio:["ignore","pipe","pipe"] });
  const out = (r.stdout || "").toString().trim();
  const err = (r.stderr || "").toString().trim();
  /* 마지막 줄만 보여 줍니다 — 떨어지면 전부 보여 줍니다 */
  if(r.status === 0){
    const last = out.split("\n").filter(Boolean).slice(-1)[0] || "(조용히 끝났습니다)";
    console.log("   " + last);
    if(err) err.split("\n").filter(Boolean).forEach(l => console.log("   " + l));
  }else if(r.status === 2){
    /* 건너뜀 — 통과로 치지 않습니다 */
    bad++; skipped.push(name);
    console.log(out || err);
  }else{
    bad++;
    console.log(out); if(err) console.log(err);
  }
}

/* ⚠️⚠️ 찍은 결과가 커밋과 같은가 — 빌드를 안 돌리고 올린 것을 잡습니다 */
console.log("\n▶ 빌드 결과가 커밋과 같은가  (git status)");
const g = spawnSync("git", ["status", "--porcelain", "--",
  "index.html", "cat", "categories", "guide", "help", "join", "search",
  "login", "my", "admin", "terms", "privacy",
  "tools/routes.json", "db/apply-from-0008.sql", "sitemap.xml", "robots.txt"],
  { cwd: ROOT, stdio:["ignore","pipe","pipe"] });
const dirty = (g.stdout || "").toString().trim();
if(dirty){
  bad++;
  console.log("   ❌ 빌드가 만든 파일이 커밋과 다릅니다 — 다시 커밋하세요:");
  dirty.split("\n").forEach(l => console.log("      " + l));
}else{
  console.log("   ✅ 같습니다");
}

/* ── 초록이면 main 으로 (--merge 일 때만) ──────────────────────── */
const wantMerge = process.argv.indexOf("--merge") >= 0;
if(wantMerge && !bad && !skipped.length){
  console.log("\n▶ main 으로 합칩니다  (--merge)");
  const br = spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"],
    { cwd: ROOT, stdio:["ignore","pipe","pipe"] }).stdout.toString().trim();
  /* ⚠️ fast-forward 가 아니면 합치지 않습니다 — 합치기 커밋을 만들면
     되돌릴 때 길이 꼬입니다. */
  const ff = spawnSync("git", ["merge-base", "--is-ancestor", "origin/main", br],
    { cwd: ROOT, stdio:"ignore" });
  if(ff.status !== 0){
    bad++;
    console.log("   ❌ origin/main 이 이 브랜치의 조상이 아닙니다 — 먼저 가져와 맞추세요.");
  }else{
    const steps = [
      ["git", ["checkout", "main"]],
      ["git", ["merge", "--ff-only", br]],
      ["git", ["push", "origin", "main"]],
      ["git", ["checkout", br]]
    ];
    for(const [c, a] of steps){
      const r = spawnSync(c, a, { cwd: ROOT, stdio:["ignore","pipe","pipe"] });
      if(r.status !== 0){
        bad++;
        console.log("   ❌ " + c + " " + a.join(" ") + "\n      " +
          (r.stderr || "").toString().trim().split("\n").slice(0, 3).join("\n      "));
        break;
      }
    }
    if(!bad) console.log("   ✅ main 으로 올렸습니다 — **손님 화면이 바뀝니다.**");
  }
}else if(wantMerge && skipped.length){
  bad++;
  console.log("\n❌ 건너뛴 묶음이 있어 합치지 않습니다 — 안 돌려 본 것이 깨진 채 나갑니다.");
}

const sec = ((Date.now() - t0) / 1000).toFixed(1);
console.log("\n" + "─".repeat(52));
if(skipped.length)
  console.log("⚠️  건너뛴 것 " + skipped.length + "개: " + skipped.join(" · ") +
              "\n   ⚠️ **통과로 치지 않습니다.**");
if(bad){
  console.log("❌ " + bad + "개 묶음이 막았습니다 — 올리지 마세요.  (" + sec + "초)");
  process.exit(1);
}
/* ⚠️ 건너뛴 것이 있으면 "전부 초록" 이라고 말하지 않습니다 — 그 말을
   믿고 올리면, 안 돌려 본 묶음이 깨진 채로 손님 화면에 갑니다. */
if(skipped.length)
  console.log("◻ 돌린 것은 전부 초록입니다. 건너뛴 " + skipped.length +
              "개를 돌리기 전에는 올리지 마세요.  (" + sec + "초)");
else
  console.log("✅ 전부 초록입니다 — 올려도 됩니다.  (" + sec + "초)");
