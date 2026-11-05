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
     ⑦ 1년 캐시를 거는 자산에 내용 값(?v=)이 붙어 있는가
     ⑧ **없는 CSS 변수**를 쓴 자리 (조용히 기본값으로 떨어집니다)

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
/* ⚠️⚠️ **"그 함수가 책임집니다" 를 실제로 따라가 봅니다.**
   위 주석이 "함수가 만들어 준 것을 그대로 넣는 자리는 그 함수가
   책임집니다" 라고 적었는데, 검사는 그 함수를 **따라가지 않았습니다** —
   그래서 카드 한 장을 만드는 함수를 따로 빼면, 안에서 esc() 를 제대로
   거쳤는데도 "esc() 가 없다" 로 잡혔습니다 (화면이 아니라 **검사가
   틀린** 자리입니다).
   ⚠️ 따라가되 **느슨하게 풀지 않습니다.** 그 파일에 선언된 함수를
   부르는데 그 함수 안에 esc() 가 **한 번도 없으면 그대로 잡습니다.**
   ⚠️⚠️ 남는 틈(한 칸은 esc 를 거치고 다른 칸은 안 거치는 함수)은 이
   grep 이 영원히 못 잡습니다 — 그 자리는 `tools/test-desk.js` ·
   `test-admin.js` 가 화면마다 **태그를 실제로 넣어 보고** 잡습니다. */
function bodiesWithEsc(src){
  const has = {}, lacks = {};
  /* `function name(` · `var name = function(` · `name = function(` 셋 */
  const decl = /(?:function\s+([A-Za-z_$][\w$]*)\s*\(|(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*function\s*\()/g;
  let m;
  while((m = decl.exec(src)) !== null){
    const name = m[1] || m[2];
    /* 여는 중괄호부터 짝이 맞을 때까지 — ⚠️ 문자열 안의 괄호를
       세면 엉뚱한 데서 끊깁니다. */
    let k = src.indexOf("{", decl.lastIndex);
    if(k < 0) continue;
    let depth = 0, q = "", body = "";
    for(; k < src.length; k++){
      const c = src[k];
      if(q){ if(c === "\\"){ body += c + src[++k]; continue; }
             body += c; if(c === q) q = ""; continue; }
      if(c === "'" || c === '"' || c === "`"){ q = c; body += c; continue; }
      body += c;
      if(c === "{") depth++;
      if(c === "}"){ depth--; if(depth === 0) break; }
    }
    /* ⚠️ **글자만 잇는 함수는 안전합니다.** `claimForm()` 처럼 붙박이
       양식을 돌려주는 함수에는 esc() 를 거칠 것이 아예 없습니다 —
       그것까지 "esc() 가 없다" 로 잡으면 경고가 늘 떠서 진짜가 묻힙니다.
       문자열 · 주석 · 예약어를 걷어 내고 **잇는 자리 옆에 이름이
       있는지**만 봅니다. 하나라도 있으면 값이 들어오는 함수입니다. */
    const stripped = body
      .replace(/'(\\.|[^'])*'/g, "'S'").replace(/"(\\.|[^"])*"/g, '"S"')
      .replace(/`(\\.|[^`])*`/g, "`S`")
      .replace(/'S'|"S"|`S`/g, " ")
      .replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ")
      .replace(/\b(return|function|var|let|const|if|else|true|false|null|undefined|typeof|new)\b/g, " ");
    const joinsValue = /\+\s*[A-Za-z_$]|[A-Za-z_$][\w$]*\s*\+/.test(stripped);
    if(/\besc\(|\bmark\(/.test(body) || !joinsValue) has[name] = 1;
    else lacks[name] = 1;
  }
  return { has: has, lacks: lacks };
}

function scanEsc(list){
  const risky = [];
  list.forEach(function(pair){
  const f = pair[0], src = pair[1];
  const fn = bodiesWithEsc(src);
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
    /* ⚠️⚠️⚠️ **주석은 코드가 아닙니다 — 걷어내고 봅니다** (2026-11-05).
       두 가지가 나왔습니다 —
       ① **멀쩡한 줄을 잡았습니다.** 글자만 이어 붙인 문장 한가운데
          `(높이 16px)` 이라는 주석이 있었는데 그 `px` 를 **변수로**
          읽었습니다. 그때까지 안 걸린 것은 그 자리 주석이 전부
          한글이었기 때문이고, 영문이 한 글자 섞이는 날 터질
          참이었습니다.
       ② **더 나쁜 쪽 — 주석으로 검사를 속일 수 있었습니다.**
          아래 "esc() 를 거쳤는가" 를 **주석까지 포함해** 보고 있어서,
          `/* esc( 를 거쳤습니다 *(슬래시)` 라고 적어 두기만 하면 진짜
          위험한 줄이 **그냥 지나갔습니다.**
       ⚠️⚠️ 걷어내는 **차례가 중요합니다** —
         ⓐ 블록 주석 먼저 (글자 안에 들어 있을 일이 드뭅니다)
         ⓑ 그다음 글자 (따옴표 안)
         ⓒ 마지막에 한 줄 주석
       ⓒ 를 먼저 하면 `https://…` 의 `//` 를 주석으로 읽어 **주소가
       든 줄을 통째로 삼킵니다.** */
    const code = rhs.replace(/\/\*[\s\S]*?\*\//g, "")
                    .replace(/'(\\.|[^'])*'/g, "").replace(/"(\\.|[^"])*"/g, "")
                    .replace(/`(\\.|[^`])*`/g, "")
                    .replace(/\/\/[^\n]*/g, "");
    const noStr = code.replace(SAFEFN, "(");
    if(!/[A-Za-z_$]/.test(noStr)) return;          /* 글자만 이은 것 */
    /* ⚠️ **주석을 걷어낸 코드에서** 봅니다 — 주석에 적힌 esc( 로는
       못 빠져나갑니다. */
    if(/\besc\(|\bmark\(/.test(code)) return;    /* 거쳤습니다 */

    /* 이 파일에 선언된 함수를 쓰는가 — 그렇다면 그 함수를 따라갑니다.
       ⚠️⚠️ **부르는 꼴만 찾으면 안 됩니다.** `rows.map(card)` 처럼
       **이름만 넘기는** 자리가 있어서, `card(` 만 찾다가 따라갈 것이
       없다고 보고 멀쩡한 줄을 잡았습니다 (되돌려 보기에서 드러났습니다).
       ⚠️ `x.card` 같은 속성 이름은 뺍니다 (앞 글자가 점이면 아닙니다). */
    const used = {};
    let c2;
    const idRe = /(\.?)([A-Za-z_$][\w$]*)/g;
    while((c2 = idRe.exec(rhs)) !== null) if(!c2[1]) used[c2[2]] = 1;
    const mine = Object.keys(used).filter(function(n){
      return fn.has[n] || fn.lacks[n];
    });
    /* ⚠️ 부르는 함수 가운데 **esc() 가 없는 것이 하나라도** 있으면
       잡습니다. 하나도 안 부르면 전처럼 잡습니다 (따라갈 것이 없습니다). */
    if(mine.length && mine.every(function(n){ return !!fn.has[n]; })) return;
    risky.push(f + ":" + (i + 1) + "  " + l.trim().slice(0, 56));
  });
  });
  return risky;
}
const risky = scanEsc(CLIENT.filter(function(f){ return /\.js$/.test(f); })
  .map(function(f){ return [f, fs.readFileSync(path.join(ROOT, f), "utf8")]; }));
ok("innerHTML 에 esc() 없이 변수를 넣는 줄이 없다", risky.length === 0, risky.join(" / "));

/* ── ⑦ **1년 캐시를 거는 자산에 내용 값이 붙어 있는가** ───────────
   ⚠️⚠️⚠️ 2026-11-04 에 찾았습니다 — `vercel.json` 이 `/img/**` 에
   `max-age=31536000, immutable` 을 거는데, **사진 주소에만 내용 값이
   없었습니다.** `immutable` 은 "바뀌지 않으니 다시 물어보지도 마라"
   는 뜻이라, 사진을 바꿔 배포해도 **이미 다녀간 손님은 1년 동안 옛
   사진**을 봅니다. 코드도 배포도 멀쩡하고 화면만 옛날입니다.
   css · js · 아이콘에는 붙어 있었는데 `amPhotoImg()` 가 주소를 따로
   짓는 바람에 그 열일곱 자리만 빠졌습니다.
   ⚠️ 규칙을 `/img/` 로 박지 않습니다 — **vercel.json 에서 immutable 을
   건 자리**를 읽어 그 자리 전부를 봅니다 (다음에 다른 폴더에 걸어도
   같이 잡힙니다). */
console.log("\n── 1년 캐시 + 내용 값");
const IMMU = (V.headers || []).filter(function(h){
  return (h.headers || []).some(function(x){
    return x.key === "Cache-Control" && String(x.value).indexOf("immutable") >= 0;
  });
}).map(function(h){
  try{ return new RegExp("^" + h.source + "$"); }catch(e){ return null; }
}).filter(Boolean);

const PAGES = FILES.filter(function(f){ return /(^|\/)index\.html$/.test(f); });
let assetSeen = 0;
const noVer = [];
PAGES.forEach(function(f){
  const html = fs.readFileSync(path.join(ROOT, f), "utf8");
  /* src · href · srcset 전부 — srcset 은 쉼표로 갈라 봅니다 */
  (html.match(/(?:src|href|srcset)="[^"]*"/g) || []).forEach(function(at){
    at.slice(at.indexOf('"') + 1, -1).split(",").forEach(function(part){
      const u = part.trim().split(/\s+/)[0];
      if(!u || u.charAt(0) !== "/") return;
      const bare = u.split("?")[0];
      if(!IMMU.some(function(re){ return re.test(bare); })) return;
      assetSeen++;
      if(u.indexOf("?v=") < 0 && noVer.indexOf(u) < 0) noVer.push(u);
    });
  });
});
/* ⚠️ "잴 것이 없으면 0 으로 끝나는 검사" 를 만들지 않습니다 */
ok("1년 캐시가 걸린 자산 주소를 실제로 쟀다", assetSeen > 0, "잰 주소 " + assetSeen + "개");
ok("1년 캐시가 걸린 자산에 내용 값(?v=)이 전부 붙어 있다",
   noVer.length === 0,
   noVer.length ? noVer.length + "곳: " + noVer.slice(0, 4).join(" · ") : "");

/* ── ⑧ **없는 CSS 변수를 쓴 자리** ───────────────────────────────
   ⚠️⚠️⚠️ 없는 변수를 쓰면 `var(--없는것)` 이 **조용히 기본값으로**
   떨어집니다 — 에러도 없고, 색이 "왜 안 바뀌지" 로만 보입니다.
   2026-11-05 에 `--bad-line` 을 지어 썼고, 그 전(조인)에는
   `--pt-text` · `--r-s` · `--ivory` 셋을 지어 썼습니다.
   ⚠️⚠️ **그때 제가 쓴 찾는 코드가 틀렸습니다** — 줄머리만 보아서
   `tokens.css` 가 한 줄에 셋씩 적어 둔 변수를 "없다" 고 했고, 그
   말을 믿고 **멀쩡한 `--bad-text` 를 바꿨습니다**. 그래서 여기서는
   줄 어디에 있든 `--이름:` 을 **다 모읍니다.**
   ⚠️ 쓰는 쪽은 `var(--이름` 만 셉니다 (대체값이 있어도 없는 변수는
   없는 것입니다 — 두 벌로 적어 두는 셈이고 한쪽만 고치게 됩니다). */
console.log("\n── 없는 CSS 변수");
const CSSF = FILES.filter(function(f){ return /\.css$/.test(f); });
const DEFINED = new Set();
CSSF.forEach(function(f){
  const t = fs.readFileSync(path.join(ROOT, f), "utf8");
  /* ⚠️ 이름 꼴을 **좁게 잡지 않습니다** — CSS 변수 이름에는 한글도
     들어갈 수 있고, 좁게 잡으면 그런 이름의 오타를 **아무것도 안
     잡는 검사**가 됩니다 (되돌려 보기가 그것을 잡았습니다). */
  (t.match(/--[^\s:;,(){}]+\s*:/g) || []).forEach(function(m){
    DEFINED.add(m.replace(/\s*:$/, ""));
  });
});
let usedN = 0;
const ghost = [];
CSSF.forEach(function(f){
  const t = fs.readFileSync(path.join(ROOT, f), "utf8");
  (t.match(/var\(\s*--[^\s:;,(){}]+/g) || []).forEach(function(m){
    const v = m.replace(/^var\(\s*/, "");
    usedN++;
    if(!DEFINED.has(v) && ghost.indexOf(f + " " + v) < 0) ghost.push(f + " " + v);
  });
});
/* ⚠️ "잴 것이 없으면 0 으로 끝나는 검사" 를 만들지 않습니다 */
ok("CSS 변수를 실제로 쟀다 (정의 " + DEFINED.size + "개)", usedN > 0,
   "쓴 자리 " + usedN + "곳");
ok("없는 CSS 변수를 쓴 자리가 없다", ghost.length === 0,
   ghost.slice(0, 5).join(" · "));

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

  /* ⚠️⚠️ **함수를 따라가게 고친 뒤 꼭 되돌려 봅니다.** 느슨해진 자리로
     진짜가 지나가면, 검사는 늘 초록인데 손님 글이 날것으로 나갑니다. */
  /* ⑧ — 없는 변수를 하나 지어 써 봅니다 */
  const cssProbe = path.join(ROOT, "css", "__probe.css");
  /* ⚠️ **실제로 날 만한 오타**를 넣습니다 (`--bad-line` 처럼 있는
     이름에서 한 조각이 다른 것). 그리고 한글 이름도 같이 — 처음에
     한글만 넣었더니 이름 꼴을 좁게 잡은 탓에 **아무것도 안 잡혔고**,
     되돌려 보기가 그것을 잡았습니다. */
  fs.writeFileSync(cssProbe,
    ".x{ color: var(--bad-line); }\n.y{ color: var(--이런변수는없습니다); }\n");
  const pf = fs.readdirSync(path.join(ROOT, "css"))
    .filter(function(f){ return /\.css$/.test(f); });
  let caught = false;
  const defined2 = new Set();
  pf.forEach(function(f){
    const t = fs.readFileSync(path.join(ROOT, "css", f), "utf8");
    (t.match(/--[^\s:;,(){}]+\s*:/g) || []).forEach(function(m){
      defined2.add(m.replace(/\s*:$/, "")); });
  });
  const got2 = [];
  pf.forEach(function(f){
    const t = fs.readFileSync(path.join(ROOT, "css", f), "utf8");
    (t.match(/var\(\s*--[^\s:;,(){}]+/g) || []).forEach(function(m){
      const v = m.replace(/^var\(\s*/, "");
      if(!defined2.has(v)){ caught = true; got2.push(v); } });
  });
  fs.unlinkSync(cssProbe);
  console.log("  없는 CSS 변수를 지어 쓰니 잡히나: " +
    (caught ? "O" : "❌ 못 잡습니다") + "  (" + got2.join(" · ") + ")");
  console.log("  ⚠️ **한글 이름**의 오타도 잡나: " +
    (got2.indexOf("--이런변수는없습니다") >= 0 ? "O" : "❌ 못 잡습니다"));
  /* ⚠️ 한 줄에 셋씩 적어 둔 변수를 **정의로 읽는지**까지 봅니다 —
     전에 줄머리만 보아서 멀쩡한 변수를 "없다" 고 했습니다. */
  console.log("  한 줄에 여럿 적은 변수를 정의로 읽나: " +
    (defined2.has("--bad-text") && defined2.has("--bad-soft") ? "O" : "❌"));

  console.log("\n  esc() 검사를 일부러 되돌려 봅니다");
  const probes = [
    ["손님 글을 그대로 잇는 자리",
     "box.innerHTML = '<b>' + row.name + '</b>';", true],
    ["esc() 를 거치면 안 잡힌다",
     "box.innerHTML = '<b>' + esc(row.name) + '</b>';", false],
    ["esc() 없는 **함수**를 따라 들어가서 잡는다",
     "function card(r){ return '<b>' + r.name + '</b>'; }\n" +
     "box.innerHTML = '<div>' + rows.map(card).join('') + '</div>';", true],
    ["esc() 를 거치는 함수는 안 잡는다",
     "function card(r){ return '<b>' + esc(r.name) + '</b>'; }\n" +
     "box.innerHTML = '<div>' + rows.map(card).join('') + '</div>';", false],
    ["글자만 잇는 함수는 안 잡는다 (거칠 것이 없습니다)",
     "function form(){ return '<form>' + '<input>' + '</form>'; }\n" +
     "box.innerHTML = '<div>' + form() + '</div>';", false],
    ["안전한 함수와 **섞여도** 안 섞인 쪽을 잡는다",
     "function okc(r){ return esc(r.a); }\n" +
     "function badc(r){ return '<i>' + r.b + '</i>'; }\n" +
     "box.innerHTML = '<div>' + okc(x) + badc(y) + '</div>';", true]
  ];
  let probeBad = 0;
  probes.forEach(function(pr){
    const got = scanEsc([["probe.js", pr[1]]]).length > 0;
    const good = got === pr[2];
    if(!good) probeBad++;
    console.log("  " + (good ? "O" : "❌") + " " + pr[0] +
                (good ? "" : "  → 기대 " + (pr[2] ? "잡힘" : "안 잡힘") +
                             " · 실제 " + (got ? "잡힘" : "안 잡힘")));
  });
  if(probeBad) bad++;
  if(!got){ process.exit(1); }
}

console.log("\n" + ran + "건 중 " + (ran - bad) + "건 통과 · " + bad + "건 실패");
process.exit(bad ? 1 : 0);
