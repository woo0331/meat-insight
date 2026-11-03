#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   보안 검수 (지시서 11번 8단계 · 10번 "개인정보 보호와 보안 설계")

   ⚠️⚠️ **이 저장소는 공개입니다.** 키를 한 번 적으면 지워도 git 기록에
   남습니다 — 지우는 것이 아니라 **키를 새로 발급**해야 합니다.

   재는 것
     ① 키처럼 생긴 글자가 저장소에 있는가
     ② service key 가 **화면 쪽 코드**에 닿는가
        (그 키는 RLS 를 통째로 지나갑니다 — 한 줄이면 전부 털립니다)
     ③ vercel.json 에 보안 헤더가 그대로 있는가
     ④ CSP 가 화면이 실제로 부르는 바깥 주소를 **허락하는가**
        (좁으면 배포 뒤에야 전부 죽습니다 — 로컬은 영원히 초록)
     ⑤ .env 같은 파일이 따라 들어왔는가
     ⑥ 손님이 적은 글을 화면에 낼 때 esc() 를 거치는가

   돌리기   node tools/check-safe.js
            node tools/check-safe.js --prove
   ════════════════════════════════════════════════════════════════════ */
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");

let bad = 0, ran = 0;
function ok(name, cond, got){
  ran++;
  if(cond) console.log("  ✅ " + name);
  else { bad++; console.log("  ❌ " + name + (got !== undefined ? "  →  " + String(got).slice(0, 220) : "")); }
}

const SKIP = ["node_modules", ".git", "db/apply-from-0008.sql"];
function walk(dir, out){
  fs.readdirSync(dir).forEach(function(f){
    const full = path.join(dir, f), rel = path.relative(ROOT, full);
    if(SKIP.some(function(s){ return rel === s || rel.indexOf(s + path.sep) === 0; })) return;
    const st = fs.statSync(full);
    if(st.isDirectory()) walk(full, out);
    else out.push(rel);
  });
  return out;
}
const FILES = walk(ROOT, []);
const TEXT = FILES.filter(function(f){ return /\.(js|sql|json|html|css|md|txt|xml|yml)$/.test(f); });

/* ── ① 키처럼 생긴 글자 ─────────────────────────────────────────
   ⚠️ 이름만 보지 않고 **값의 꼴**을 봅니다. 이름(SUPABASE_ANON_KEY)은
   적혀 있어야 하는 글이고, 값이 적히면 사고입니다. */
const PATTERNS = [
  [/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\./, "JWT 로 보이는 값"],
  [/\bsk-[A-Za-z0-9]{20,}/, "sk- 로 시작하는 키"],
  [/\bsb(p|s)_[A-Za-z0-9]{20,}/, "Supabase 키"],
  [/xox[baprs]-[A-Za-z0-9-]{10,}/, "슬랙 토큰"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "비밀 키 파일"],
  [/https:\/\/hooks\.slack\.com\/[A-Za-z0-9\/]{20,}/, "슬랙 웹훅 주소"]
];
console.log("\n── 키가 저장소에 들어왔는가");
let found = [];
TEXT.forEach(function(f){
  const t = fs.readFileSync(path.join(ROOT, f), "utf8");
  PATTERNS.forEach(function(p){
    if(p[0].test(t)) found.push(f + " — " + p[1]);
  });
});
ok("키처럼 생긴 값이 0건이다", found.length === 0, found.join(" / "));

/* ── ② service key 가 화면 쪽에 닿는가 ──────────────────────────
   ⚠️⚠️ 이 키는 RLS 를 통째로 지나갑니다. 화면(js/ · pages/ · 찍힌 html)
   에는 **이름조차** 나오면 안 됩니다 — 나온다는 것은 거기서 쓰려 했다는
   뜻입니다. 서버(api/)에서만 씁니다. */
const CLIENT = TEXT.filter(function(f){
  return f.indexOf("js" + path.sep) === 0 || f.indexOf("pages" + path.sep) === 0 ||
         /index\.html$/.test(f);
});
/* ⚠️ **주석은 빼고 봅니다.** js/auth.js 는 "service key 는 화면에
   내려오지 않습니다" 라고 **적어 두었을 뿐**인데 처음에 그것을 유출로
   잡았습니다 — 화면이 아니라 검사가 틀린 자리입니다. 코드 줄에
   나오는 것만 셉니다. */
function codeLines(f){
  return fs.readFileSync(path.join(ROOT, f), "utf8").split("\n")
    .filter(function(l){ return !/^\s*(\/\/|\*|\/\*|--)/.test(l); });
}
const leak = CLIENT.filter(function(f){
  return codeLines(f).some(function(l){ return /SUPABASE_SERVICE_KEY|service_role/.test(l); });
});
console.log("\n── service key 가 화면 쪽에 닿는가");
ok("화면 쪽 파일 " + CLIENT.length + "개에 service key 가 0건이다",
   leak.length === 0, leak.join(" / "));

/* ── ③ 보안 헤더 ────────────────────────────────────────────── */
console.log("\n── 보안 헤더");
const V = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8"));
const H = {};
(V.headers || []).forEach(function(h){ (h.headers || []).forEach(function(x){ H[x.key] = x.value; }); });
[["Content-Security-Policy", null],
 ["Strict-Transport-Security", /max-age=\d{7,}/],
 ["X-Content-Type-Options", /nosniff/],
 ["Referrer-Policy", /strict-origin/],
 ["X-Frame-Options", /SAMEORIGIN|DENY/],
 ["Permissions-Policy", /camera=\(\)/]
].forEach(function(r){
  ok(r[0] + " 가 있다", !!H[r[0]] && (!r[1] || r[1].test(H[r[0]])), H[r[0]] || "(없음)");
});

/* ── ④ CSP 가 화면이 부르는 바깥 주소를 허락하는가 ──────────────
   ⚠️⚠️ **connect-src 'self' 로만 두면 배포 뒤 전부 죽습니다.** 로그인 ·
   입점 신청 · 관리자가 모두 Supabase 로 갑니다. 로컬 검사 서버가
   헤더를 안 보내던 시절에는 이것을 아무도 못 잡았습니다. */
console.log("\n── CSP 가 실제로 부르는 곳을 허락하는가");
const csp = H["Content-Security-Policy"] || "";
const conn = (csp.split(";").map(function(s){ return s.trim(); })
  .find(function(s){ return s.indexOf("connect-src") === 0; }) || "");
ok("connect-src 에 Supabase 가 들어 있다", /supabase\.co/.test(conn), conn || "(connect-src 없음)");
ok("script-src 에 바깥 주소를 열어 두지 않았다",
   !/script-src[^;]*https?:\/\//.test(csp),
   (csp.split(";").find(function(s){ return s.trim().indexOf("script-src") === 0; }) || "").trim());
ok("object-src 가 none 이다", /object-src\s+'none'/.test(csp));
ok("base-uri 가 self 다", /base-uri\s+'self'/.test(csp));

/* ── ⑤ 따라 들어온 비밀 파일 ───────────────────────────────── */
console.log("\n── 따라 들어온 파일");
const env = FILES.filter(function(f){ return /(^|\/)\.env/.test(f) || /\.pem$|\.p12$|\.key$/.test(f); });
ok(".env · 키 파일이 0건이다", env.length === 0, env.join(" / "));
const ignore = fs.existsSync(path.join(ROOT, ".gitignore"))
  ? fs.readFileSync(path.join(ROOT, ".gitignore"), "utf8") : "";
ok(".gitignore 가 .env 를 막고 있다", /\.env/.test(ignore));

/* ── ⑥ 손님이 적은 글을 낼 때 esc() ─────────────────────────────
   ⚠️ 완벽한 검사는 못 됩니다 — innerHTML 에 변수가 들어가는 자리를 세고,
   그 줄에 esc( 가 같이 있는지만 봅니다. 그래도 빠뜨린 자리를 여러 번
   잡아 줍니다. */
console.log("\n── 손님이 적은 글");
/* ⚠️⚠️ **줄이 아니라 문장으로 봅니다.** 처음에는 한 줄만 보고
   "esc 가 없다" 고 세 건을 잡았는데, esc() 는 **다음 줄**에 있었습니다.
   여는 괄호가 닫힐 때까지 이어 붙여서 한 문장으로 봅니다.
   ⚠️ 이 검사는 완벽하지 않습니다 — 변수 없이 글자만 잇는 자리는
   안전하므로 빼고, 변수가 들어가는데 esc() 가 한 번도 없는 문장만
   잡습니다. 손으로도 한 번씩 보세요. */
let risky = [];
CLIENT.filter(function(f){ return /\.js$/.test(f); }).forEach(function(f){
  const src = fs.readFileSync(path.join(ROOT, f), "utf8");
  const lines = src.split("\n");
  lines.forEach(function(l, i){
    const m = l.match(/innerHTML\s*\+?=/);
    if(!m) return;
    /* 문장을 **문자 단위로** 모읍니다 — 깊이가 0 인 곳의 세미콜론에서
       끊습니다. 줄 끝으로만 끊다가 "nav.innerHTML = ''; main.remove…"
       같은 줄을 통째로 삼켜 또 잘못 잡았습니다. */
    let k = src.indexOf(l) + l.indexOf(m[0]) + m[0].length;
    let depth = 0, rhs = "", q = "";
    for(; k < src.length; k++){
      const c = src[k];
      if(q){ if(c === "\\"){ rhs += c + src[++k]; continue; }
             rhs += c; if(c === q) q = ""; continue; }
      if(c === "'" || c === '"' || c === "`"){ q = c; rhs += c; continue; }
      if(c === "(" || c === "[" || c === "{") depth++;
      if(c === ")" || c === "]" || c === "}") depth--;
      if(c === ";" && depth <= 0) break;
      rhs += c;
    }
    /* ⚠️ 잇는 자리(+)가 없으면 넘어갑니다 — 글자 하나만 넣거나
       함수가 만들어 준 것을 그대로 넣는 자리입니다. 그 함수 안의
       esc() 는 그 함수가 책임집니다 (거기도 이 검사가 봅니다). */
    if(rhs.indexOf("+") < 0) return;
    /* ⚠️ 저장소가 **스스로 만드는** 글자는 손님이 적은 것이 아닙니다 —
       icon() 은 저장소의 SVG, won() · num() 은 숫자입니다. 이것들만
       있는 문장까지 잡으면 경고가 늘 떠서 진짜가 묻힙니다. */
    const SAFEFN = /\b(icon|iconArt|won|num|amCatUrl)\s*\(/g;
    const noStr = rhs.replace(/'(\\.|[^'])*'/g, "").replace(/"(\\.|[^"])*"/g, "")
                     .replace(/`(\\.|[^`])*`/g, "").replace(SAFEFN, "(");
    if(!/[A-Za-z_$]/.test(noStr)) return;          /* 글자만 이은 것 */
    if(/\besc\(|\bmark\(/.test(rhs)) return;      /* 거쳤습니다 */
    risky.push(f + ":" + (i + 1) + "  " + l.trim().slice(0, 56));
  });
});
ok("innerHTML 에 esc() 없이 변수를 넣는 줄이 없다", risky.length === 0, risky.join(" / "));

if(process.argv.indexOf("--prove") >= 0){
  console.log("\n되돌려 보기 — 일부러 넣어 봅니다");
  const probe = path.join(ROOT, "js", "__probe.js");
  fs.writeFileSync(probe, "var k = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
    "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4ifQ.abc';\n");
  let got = 0;
  PATTERNS.forEach(function(p){ if(p[0].test(fs.readFileSync(probe, "utf8"))) got++; });
  fs.unlinkSync(probe);
  console.log("  JWT 를 넣으니 " + got + "건 잡힘  " + (got ? "O" : "❌ 못 잡습니다"));
  const narrow = "connect-src 'self'";
  console.log("  connect-src 를 좁히면 잡히나: " + (/supabase\.co/.test(narrow) ? "❌" : "O"));
  if(!got){ process.exit(1); }
}

console.log("\n" + ran + "건 중 " + (ran - bad) + "건 통과 · " + bad + "건 실패");
process.exit(bad ? 1 : 0);
