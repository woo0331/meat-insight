#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   tools/ship.js — 한 번에 검사하고 올립니다

     node tools/ship.js -m "커밋 글"      검사 → 커밋 → 브랜치 → main (= 배포)
     node tools/ship.js --check-only      검사만 (아무것도 안 올립니다)
     node tools/ship.js --no-deploy       검사 → 커밋 → 브랜치 (main 은 안 건드립니다)
     node tools/ship.js --fast            빠른 것만 — 배포는 막습니다
     node tools/ship.js --ci              CI 전용 (커밋하지 않고, 빌드 결과가 커밋과 같은지 봅니다)

   ⚠️⚠️ **main 에 합치는 것이 곧 배포입니다.** Vercel 이 main 을 보고
   곧바로 배포합니다 — 이 도구가 main 을 밀면 그 순간 손님 화면이
   바뀝니다.

   ⚠️⚠️ **사람이 확인하는 자리를 "검사가 전부 초록" 으로 바꿨습니다.**
   CLAUDE.md 가 적어 둔 2026-10-08 §24 는 "실제 운영환경 배포는
   사용자의 최종 확인 후" 였습니다. 2026-10-15 사장님 지시("메인에
   업로드까지 시키는것까지 자동으로")로 그 자리를 이 도구가 받습니다.
   그래서 이 도구는 **빨간 것이 하나라도 있으면 배포하지 않습니다** —
   건너뛴 검사도 초록이 아닙니다.

   ⚠️ 검사 차례는 **빠른 것부터**입니다. 전수 점검(check.js)이 20분
   넘게 도는데, 오타 때문에 떨어질 것이라면 그 앞에서 떨어져야 합니다.

   ⚠️ **되돌리기** — 잘못 올라갔으면 되돌린 커밋을 새로 올리세요
   (git revert). main 을 force 로 밀지 마세요: 손님이 받아 간 자산
   주소(?v=)가 사라집니다.
   ════════════════════════════════════════════════════════════════════ */
const { spawnSync } = require("child_process");
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");

const AV = process.argv.slice(2);
const has = f => AV.includes(f);
const MODE = {
  checkOnly: has("--check-only"),
  noDeploy:  has("--no-deploy"),
  fast:      has("--fast"),
  ci:        has("--ci"),
  allowSkip: has("--allow-skip"),
};
const MSG = (() => {
  const i = AV.findIndex(a => a === "-m" || a === "--message");
  return i >= 0 && AV[i + 1] ? AV[i + 1] : "";
})();

const t0 = Date.now();
const el = () => {
  const s = Math.round((Date.now() - t0) / 1000);
  return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
};
const line = () => console.log("─".repeat(66));
/* ⚠️⚠️ **CI 에서 떨어졌을 때 까닭을 읽을 수 있게** 적어 둡니다
   (2026-10-20 에 겪었습니다). GitHub 의 일감 로그는 blob 저장소에서
   오고, 이 저장소에서 쓰는 gh 는 그 호스트에 **안 닿습니다** — 그래서
   CI 가 빨간데 "exit code 1" 밖에 안 보이고, 실제 까닭(`sitemap.xml`
   한 줄 차이)을 찾는 데 한참 걸렸습니다. GitHub 이 주는
   `GITHUB_STEP_SUMMARY` 는 API 로 읽히니 거기에 같이 적습니다.
   ⚠️ 비밀은 안 적습니다 — 여기 흘러드는 것은 검사 출력뿐이고,
   사전 점검이 비밀이 섞인 커밋 자체를 먼저 막습니다. */
const SUMPATH = process.env.GITHUB_STEP_SUMMARY || "";
const SUMBUF  = [];
const sum = s => { if (SUMPATH) SUMBUF.push(String(s)); };
if (SUMPATH) process.on("exit", function(){
  try {
    require("fs").appendFileSync(SUMPATH,
      "\n```\n" + SUMBUF.slice(-400).join("\n") + "\n```\n");
  } catch (e) { /* 요약을 못 적는 것으로 배포를 막지는 않습니다 */ }
});

const say  = s => { console.log(s); sum(s); };
const head = s => { console.log(""); line(); console.log(s); line(); sum(""); sum(s); };

/* ⚠️ tools/test-sql.js 는 initdb 를 PATH 와 **박아 둔 경로 넷**에서
   찾습니다 (16 · 15 · 14 · /usr/local/pgsql). 판이 올라가면 그 목록에서
   빠지는데, 그러면 그 검사가 조용히 건너뛰고 이 도구가 배포를
   막습니다 — 여기서 찾아 PATH 에 얹어 둡니다. 개발 환경과 CI 가
   같은 길을 쓰게 하는 것이 이 몇 줄의 전부입니다. */
(() => {
  let best = "";
  try {
    for (const d of fs.readdirSync("/usr/lib/postgresql")) {
      const b = "/usr/lib/postgresql/" + d + "/bin";
      if (fs.existsSync(path.join(b, "initdb"))) best = b;   /* 뒤의 것 = 높은 판 */
    }
  } catch (e) {}
  if (best && !(process.env.PATH || "").split(":").includes(best))
    process.env.PATH = best + ":" + (process.env.PATH || "");
})();

/* 돌리고 화면에 그대로 흘립니다 (긴 검사라 끝나고 한꺼번에 내면 멈춘 줄 압니다) */
function run(cmd, args, opt) {
  const r = spawnSync(cmd, args, Object.assign({ cwd: ROOT, stdio: "inherit" }, opt || {}));
  if (r.error) return { code: 127, err: r.error.message };
  return { code: r.status == null ? 1 : r.status };
}
function git(args, opt) {
  const r = spawnSync("git", args, Object.assign({ cwd: ROOT, encoding: "utf8" }, opt || {}));
  return { code: r.status == null ? 1 : r.status, out: (r.stdout || "").trim(), err: (r.stderr || "").trim() };
}
function sleep(sec) { spawnSync("sleep", [String(sec)], { stdio: "ignore" }); }

const STOP = [];   /* 배포를 막는 것 */
const WARN = [];   /* 봐 주셔야 하는 것 */

/* ════════ 1. 올리기 전에 — 저장소 쪽 ════════════════════════════ */
head("① 올리기 전에 — 저장소");

if (git(["rev-parse", "--git-dir"]).code) {
  say("❌ git 저장소가 아닙니다."); process.exit(1);
}
const BR = git(["rev-parse", "--abbrev-ref", "HEAD"]).out;
say("  지금 브랜치   " + BR);

/* ⚠️⚠️ main 에서 직접 작업하지 않습니다. 작업 브랜치에 올리고 거기서
   ff 로 합치는 것이 이 저장소의 길입니다 (CLAUDE.md 의 git 규칙). */
if (BR === "main" || BR === "HEAD") {
  say("");
  say("❌ main 에서는 돌리지 않습니다 — 작업 브랜치에서 돌리세요.");
  say("   git checkout -b claude/<이름>");
  process.exit(1);
}

const DIRTY = git(["status", "--porcelain"]).out;
const CHANGED = DIRTY ? DIRTY.split("\n").map(l => l.slice(3).trim()).filter(Boolean) : [];
say("  고친 것       " + (CHANGED.length ? CHANGED.length + "개" : "없음 (이미 커밋돼 있습니다)"));

/* ── 비밀이 섞여 들어가는지 ─────────────────────────────────────
   ⚠️⚠️ **공개 저장소입니다.** service key 한 번이 새면 RLS 를 통째로
   지나가서 손님 연락처와 계약금액 전부가 새는 것과 같습니다.
   그래서 커밋될 파일만 **글자 꼴로** 봅니다 (이름이 아니라 값). */
const SECRET = [
  [/eyJ[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\./, "JWT 꼴 (Supabase anon · service key)"],
  [/\bsb_secret_[A-Za-z0-9_-]{16,}/,              "Supabase secret key"],
  [/\bsbp_[A-Za-z0-9]{32,}/,                      "Supabase 개인 토큰"],
  [/\bxox[baprs]-[0-9A-Za-z-]{10,}/,              "Slack 토큰"],
  [/hooks\.slack\.com\/(services|workflows)\/[A-Za-z0-9/+_-]{16,}/, "Slack 웹훅 주소"],
  [/\bre_[A-Za-z0-9]{24,}/,                       "Resend API 키"],
  [/\bsk-[A-Za-z0-9_-]{24,}/,                     "sk- 로 시작하는 API 키"],
  [/\bgh[pousr]_[A-Za-z0-9]{30,}/,                "GitHub 토큰"],
  [/\bgithub_pat_[A-Za-z0-9_]{30,}/,              "GitHub 토큰"],
  [/\bAKIA[0-9A-Z]{16}\b/,                        "AWS 액세스 키"],
  [/-----BEGIN (RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/, "비밀키 파일"],
];
const SKIP_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".ico", ".woff", ".woff2", ".ttf", ".otf", ".zip", ".gz"]);
let scanned = 0;
CHANGED.forEach(f => {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p) || !fs.statSync(p).isFile()) return;
  if (SKIP_EXT.has(path.extname(f).toLowerCase())) return;
  if (fs.statSync(p).size > 4 * 1024 * 1024) return;
  const s = fs.readFileSync(p, "utf8");
  scanned++;
  SECRET.forEach(([re, what]) => {
    if (re.test(s)) STOP.push("비밀이 섞였습니다 — " + f + " 에 " + what);
  });
});
say("  비밀 검사     " + scanned + "개 파일" + (STOP.length ? " ❌" : " ✅"));

/* ── 지어낸 데이터가 커밋에 들어가는지 ──────────────────────────
   ⚠️⚠️ 절대 규칙 1. 검사 씨앗은 **검사 안에서만** 살아야 합니다 —
   zz- 는 check.js 가 자기가 끼워 넣은 것을 걸러내는 예약 접두사라,
   저장소 데이터에 그 글자가 있으면 씨앗이 남은 것입니다. */
const seeded = [];
["providers", "market", "franchise", "support"].forEach(n => {
  const p = path.join(ROOT, "js/data/" + n + ".js");
  if (!fs.existsSync(p)) return;
  const s = fs.readFileSync(p, "utf8");
  s.split("\n").forEach((l, i) => {
    if (/["']zz-/.test(l)) seeded.push("js/data/" + n + ".js:" + (i + 1));
  });
});
if (seeded.length) STOP.push("검사 씨앗이 남았습니다 (zz-) — " + seeded.join(" · "));

/* 지금 몇 건인지 **세어서** 적습니다. 막지는 않습니다 — 사장님이 실제
   업체를 받아 오시면 늘어나는 것이 맞습니다. 다만 늘었으면 보이게 합니다. */
const counts = (() => {
  try {
    const g = { window: {} };
    ["providers", "market", "franchise", "support"].forEach(n => {
      const p = path.join(ROOT, "js/data/" + n + ".js");
      if (fs.existsSync(p)) new Function("window", fs.readFileSync(p, "utf8"))(g.window);
    });
    const L = k => Array.isArray(g.window[k]) ? g.window[k].length : "?";
    return { pv: L("AM_PROVIDERS"), st: L("AM_STORES"), as: L("AM_ASSETS"),
             fc: L("AM_FRANCHISES"), sp: L("AM_SUPPORTS") };
  } catch (e) { return null; }
})();
if (counts) {
  say("  지금 데이터   업체 " + counts.pv + "곳 · 점포 " + counts.st + "건 · 시설 " +
      counts.as + "건 · 브랜드 " + counts.fc + "개 · 공고 " + counts.sp + "건");
  if (counts.pv || counts.st || counts.as || counts.fc || counts.sp)
    WARN.push("데이터가 0 이 아닙니다 — 실제로 받아 오신 것만 올라가는지 보세요 (절대 규칙 1)");
}

/* ── 검사용 가짜 auth 를 운영 코드가 부르는지 ───────────────────
   ⚠️ db/test/00_stub_auth.sql 은 **운영에서 돌리면 안 됩니다.** */
const stubRef = spawnSync("grep", ["-rln", "00_stub_auth", "api", "js", "db/migrations"],
  { cwd: ROOT, encoding: "utf8" }).stdout || "";
if (stubRef.trim()) STOP.push("검사용 가짜 auth 를 운영 코드가 가리킵니다 — " + stubRef.trim().split("\n").join(" · "));

/* ⚠️⚠️ 여기서 걸린 것은 **지금 멈춥니다.** 비밀이 섞였거나 씨앗이
   남은 채로 스무 분을 더 돌릴 까닭이 없고, 그 스무 분 동안 작업
   트리에 그것이 올라가 있습니다. */
if (STOP.length) {
  say("");
  say("❌ 올리지 않습니다 — 검사를 돌리기 전에 걸렸습니다:");
  STOP.forEach(s => say("   · " + s));
  say("");
  process.exit(1);
}

/* ════════ 2. 빌드 + 검사 ═══════════════════════════════════════ */
/* ⚠️ need:true 는 **배포를 막는** 검사입니다. need:false 는 없습니다 —
   초록이 아닌 것으로 배포하지 않는다는 것이 이 도구의 전부입니다. */
const STEPS = [
  { n: "check.js 문법",        c: ["node", ["--check", "check.js"]],              fast: true },
  { n: "빌드 + 가드 마흔",     c: ["node", ["build-pages.js"]],                   fast: true },
  { n: "조사 띄어쓰기",        c: ["node", ["tools/check-korean.js"]],            fast: true },
  { n: "사진 규격",            c: ["node", ["tools/check-photos.js"]],            fast: true },
  { n: "접수 API 계약",        c: ["node", ["tools/test-api.js"]],                fast: true },
  { n: "접수번호 · 중복",      c: ["node", ["tools/test-intake.js"]],             fast: true },
  { n: "상태 열셋",            c: ["node", ["tools/test-deal.js"]],               fast: true },
  { n: "수수료 계산",          c: ["node", ["tools/test-fee.js"]],                fast: true },
  { n: "로그인 · 권한 서버층", c: ["node", ["tools/test-auth.js"]],               fast: true },
  { n: "DB 스키마 (psql)",     c: ["node", ["tools/test-sql.js"]],                fast: true, skip2: true },
  { n: "손님이 누르는 길",     c: ["node", ["tools/test-flows.js"]] },
  { n: "/admin 업무 시나리오", c: ["node", ["tools/test-admin.js"]] },
  { n: "표본 밖 화면",         c: ["node", ["tools/sweep-rest.js"]] },
  { n: "/admin 전수 점검",     c: ["node", ["tools/audit-admin.js"]] },
  { n: "검사가 실제로 잡는가", c: ["node", ["tools/prove-checks.js"]] },
  { n: "전수 점검 (제일 긺)",  c: ["node", ["check.js"]] },
];

const RESULT = [];
let red = 0;

head("② 빌드 + 검사" + (MODE.fast ? "  ⚠️ --fast — 느린 것은 건너뜁니다 (배포 못 합니다)" : ""));

for (const s of STEPS) {
  if (MODE.fast && !s.fast) { RESULT.push([s.n, "건너뜀", "--fast"]); continue; }
  console.log("");
  say("▶ " + s.n + "   [" + el() + "]");
  const r = run(s.c[0], s.c[1]);
  if (r.code === 0) { RESULT.push([s.n, "통과", ""]); continue; }
  if (s.skip2 && r.code === 2) {
    /* ⚠️ 검사가 스스로 "통과로 치지 않습니다" 라고 말하는 자리입니다
       (Postgres 가 없을 때). 그래서 **배포를 막습니다** — 확인하지
       못한 것을 확인한 것처럼 세지 않습니다. */
    RESULT.push([s.n, "건너뜀", "Postgres 가 없습니다"]);
    if (MODE.allowSkip) WARN.push(s.n + " — 건너뛴 채로 올립니다 (--allow-skip)");
    else STOP.push(s.n + " 를 돌리지 못했습니다 (Postgres 없음) — 깔고 다시 돌리시거나 --allow-skip");
    continue;
  }
  RESULT.push([s.n, "실패", "exit " + r.code]);
  red++;
  /* ⚠️ 첫 빨강에서 멈춥니다. 빌드가 깨진 채로 스무 분을 더 돌릴
     까닭이 없고, 고쳐야 할 자리가 그 출력 바로 위에 있습니다. */
  break;
}

/* ⚠️⚠️ CI 에서는 **빌드 결과가 커밋과 같은지** 봅니다. 사람이
   build-pages.js 를 잊고 올리면 손님 화면과 저장소가 어긋나는데,
   화면으로는 표가 안 납니다. */
if (MODE.ci && !red) {
  const d = git(["status", "--porcelain"]);
  if (d.out) {
    red++;
    RESULT.push(["빌드 결과가 커밋과 같은가", "실패", "node build-pages.js 를 돌리고 커밋하세요"]);
    say("");
    say("❌ 빌드가 파일을 바꿨습니다 — 커밋된 결과물이 소스와 다릅니다:");
    d.out.split("\n").slice(0, 40).forEach(l => say("   " + l));
  } else RESULT.push(["빌드 결과가 커밋과 같은가", "통과", ""]);
}

/* ════════ 3. 표 ═══════════════════════════════════════════════ */
head("③ 검사 결과   [" + el() + "]");
RESULT.forEach(([n, st, why]) => {
  const m = st === "통과" ? "✅" : st === "건너뜀" ? "⚠️ " : "❌";
  say("  " + m + " " + n.padEnd(26, " ") + (why || ""));
});

const canDeploy = !red && !STOP.length && !MODE.fast && !MODE.checkOnly && !MODE.noDeploy;

if (red || STOP.length) {
  say("");
  if (STOP.length) { say("❌ 올리지 않습니다 —"); STOP.forEach(s => say("   · " + s)); }
  if (red) say("❌ 검사가 떨어졌습니다 — 위 출력에 어디인지 적혀 있습니다.");
  say("");
  say("   고친 뒤 다시 돌리세요:  node tools/ship.js -m \"...\"");
  process.exit(1);
}
WARN.forEach(w => say("  ⚠️  " + w));

if (MODE.checkOnly) { say(""); say("✅ 전부 통과 — --check-only 라 아무것도 올리지 않았습니다. [" + el() + "]"); process.exit(0); }
if (MODE.fast)      { say(""); say("✅ 빠른 것은 전부 통과 — ⚠️ --fast 는 배포하지 않습니다. 올리실 때는 그냥 돌리세요. [" + el() + "]"); process.exit(0); }

/* ════════ 4. 커밋 + 브랜치 ════════════════════════════════════ */
head("④ 커밋 + 브랜치");

if (!MODE.ci) {
  const d2 = git(["status", "--porcelain"]).out;
  if (!d2) say("  고친 것이 없습니다 — 커밋을 만들지 않습니다.");
  else {
    const msg = MSG || "빌드 결과 갱신";
    say("  커밋 글       " + msg + (MSG ? "" : "   ⚠️ -m 으로 적어 주시는 쪽이 낫습니다"));
    d2.split("\n").slice(0, 30).forEach(l => say("     " + l));
    if (d2.split("\n").length > 30) say("     … 그리고 " + (d2.split("\n").length - 30) + "개 더");
    if (git(["add", "-A"]).code) { say("❌ git add 가 실패했습니다."); process.exit(1); }
    const body = msg + "\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>";
    if (git(["commit", "-m", body]).code) { say("❌ git commit 이 실패했습니다."); process.exit(1); }
    say("  ✅ " + git(["rev-parse", "--short", "HEAD"]).out);
  }
}

/* 네트워크로 밀 때는 2 · 4 · 8 · 16초로 네 번까지 다시 해 봅니다 */
function push(args) {
  for (let i = 0; i < 5; i++) {
    const r = git(args, { stdio: ["ignore", "inherit", "inherit"] });
    if (r.code === 0) return true;
    if (i === 4) return false;
    const w = [2, 4, 8, 16][i];
    say("  ⚠️  밀기가 실패했습니다 — " + w + "초 뒤에 다시 해 봅니다 (" + (i + 1) + "/4)");
    sleep(w);
  }
  return false;
}

if (!MODE.ci) {
  say("  브랜치로 밉니다 — origin/" + BR);
  if (!push(["push", "-u", "origin", BR])) { say("❌ 브랜치 밀기가 실패했습니다."); process.exit(1); }
}

if (MODE.noDeploy) {
  say("");
  say("✅ 검사 통과 · 브랜치까지 올렸습니다 — ⚠️ --no-deploy 라 main 은 안 건드렸습니다. [" + el() + "]");
  process.exit(0);
}

/* ════════ 5. main 으로 합치기 = 배포 ══════════════════════════ */
head("⑤ main 으로 합치기 — ⚠️⚠️ 이것이 곧 배포입니다 (Vercel)");

const SHA = git(["rev-parse", "HEAD"]).out;
if (git(["fetch", "origin", "main"], { stdio: ["ignore", "inherit", "inherit"] }).code) {
  say("❌ origin/main 을 가져오지 못했습니다."); process.exit(1);
}

/* ⚠️⚠️ ff 가 되는지 **먼저** 봅니다. 안 되면 멈춥니다 — main 을 force
   로 밀거나 합치기 커밋을 만들지 않습니다 (손님이 받아 간 ?v= 주소가
   사라지고, 다른 줄의 작업이 조용히 지워집니다). */
if (git(["merge-base", "--is-ancestor", "origin/main", SHA]).code) {
  const n = git(["rev-list", "--count", SHA + "..origin/main"]).out;
  say("");
  say("❌ ff 로 합칠 수 없습니다 — origin/main 이 " + n + "커밋 앞서 있습니다.");
  say("   먼저 가져와 합치고 다시 돌리세요:");
  say("     git fetch origin main && git merge origin/main");
  say("   ⚠️ main 을 force 로 밀지 마세요.");
  process.exit(1);
}
if (git(["rev-parse", "origin/main"]).out === SHA) {
  say("  origin/main 이 이미 같은 커밋입니다 (" + git(["rev-parse", "--short", SHA]).out + ") — 올릴 것이 없습니다.");
  say("");
  say("✅ 끝났습니다. [" + el() + "]");
  process.exit(0);
}

const ahead = git(["rev-list", "--count", "origin/main.." + SHA]).out;
say("  올라갈 커밋    " + ahead + "개");
git(["log", "--oneline", "origin/main.." + SHA], { stdio: ["ignore", "inherit", "inherit"] });

/* ⚠️ 어디서 끝나든 작업 브랜치로 돌아옵니다 — main 에 서 있는 채로
   끝나면 다음 작업이 그대로 main 에 쌓입니다. */
let back = false;
const goBack = () => { if (!back) { back = true; git(["checkout", BR], { stdio: "ignore" }); } };
process.on("exit", goBack);

if (git(["checkout", "-B", "main", "origin/main"], { stdio: ["ignore", "inherit", "inherit"] }).code) {
  say("❌ main 으로 옮기지 못했습니다."); process.exit(1);
}
if (git(["merge", "--ff-only", SHA], { stdio: ["ignore", "inherit", "inherit"] }).code) {
  say("❌ ff 합치기가 실패했습니다."); process.exit(1);
}
if (!push(["push", "origin", "main"])) {
  say("❌ main 밀기가 실패했습니다 — 아직 배포되지 않았습니다.");
  process.exit(1);
}
goBack();

head("✅ 배포했습니다   [" + el() + "]");
say("  main          " + git(["rev-parse", "--short", "origin/main"]).out + "  (" + ahead + "커밋)");
say("  브랜치         " + BR);
say("");
say("  ⚠️ Vercel 이 1 ~ 2분 안에 올립니다. 올라간 뒤 보실 것 —");
say("     · storeway.co.kr 를 열어 색이 바뀌었는지");
say("     · /admin 1번 칸의 store · auth");
say("     · 남은 사람 몫은 docs/GO-LIVE.md");
say("");
