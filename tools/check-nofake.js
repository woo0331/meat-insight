/* ════════════════════════════════════════════════════════════════════
   최종 빌드에 **지어낸 자료가 없는가** — 손님에게 나가는 파일만 봅니다

   ⚠️⚠️⚠️ **왜 따로 세는가.** 이 저장소는 손님 화면을 **빌드가 찍어서
   커밋**합니다. 그래서 Vercel 은 저장소의 파일을 그대로 섬기고, 검사
   도구가 잠깐 꽂은 씨앗이 그 순간 커밋되면 **없는 회사가 광고되는**
   일이 실제로 있었습니다(2026-11-09 — `/pro/green-pt` · `/pro/xss-test`
   두 장이 올라갔습니다). 표시 · 광고의 공정화에 관한 법률 제3조이고,
   절대 규칙 1 입니다.

   ⚠️⚠️ **네 가지를 갈라서** 봅니다 —
     ① 업체 자료가 **검사용 씨앗 판**이 아닌가
     ② 찍힌 `/pro/<id>` 가 그 자료의 업체와 **수가 맞는가**
     ③ 씨앗 표식(`[검사용]` · `is_test` …)이 찍힌 HTML 에 있는가
     ④ **흉내 자료의 글자**가 찍힌 HTML 에 섞였는가
   하나로 묶어 세면 "엉뚱한 까닭으로 통과" 합니다.

   ⚠️⚠️⚠️ **④ 의 목록이 썩지 않게** — 여기 적은 글자가 그 도구들에
   **실제로 있는지**를 먼저 봅니다. 도구에서 이름을 바꾸면 이 검사는
   "목록이 썩었습니다" 로 **큰 소리로 멈춥니다**. 조용히 0건이 되어
   아무것도 안 잡는 검사가 되지 않게.
   ════════════════════════════════════════════════════════════════════ */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

let pass = 0, fail = 0;
function ok(what, good, why){
  if(good){ pass++; console.log("  ✅ " + what); }
  else { fail++; console.log("  ❌ " + what + (why ? "  →  " + why : "")); }
}
function rd(p){ try{ return fs.readFileSync(path.join(ROOT, p), "utf8"); }catch(e){ return ""; } }

/* 손님에게 나가는 HTML 전부 — ⚠️ `tools/` · `docs/` · `db/` 는 안 봅니다
   (거기는 검사와 기록의 자리이고, 거기까지 잡으면 멀쩡한 기록을
   고장이라고 합니다). */
function builtHtml(){
  const out = [];
  (function walk(dir){
    let ls = [];
    try{ ls = fs.readdirSync(dir, { withFileTypes:true }); }catch(e){ return; }
    for(const e of ls){
      const full = path.join(dir, e.name);
      const rel = path.relative(ROOT, full);
      if(e.isDirectory()){
        if(/^(node_modules|\.git|tools|docs|db|img|\.github)(\/|$)/.test(rel)) continue;
        walk(full);
      } else if(/\.html$/.test(e.name)) out.push(rel);
    }
  })(ROOT);
  return out;
}

const HTML = builtHtml();
console.log("\n── 최종 빌드에 지어낸 자료가 없는가");
ok("찍힌 화면을 실제로 모았다 (0장이면 이 검사가 고장입니다)",
   HTML.length > 0, HTML.length + "장");

/* ── ① 업체 자료가 검사용 씨앗 판인가 ───────────────────────────── */
const GEN = rd("js/data/providers.generated.js");
ok("① 업체 자료가 **검사용 씨앗 판이 아니다**",
   GEN.indexOf("검사용 씨앗") < 0,
   GEN.indexOf("검사용 씨앗") >= 0 ? "js/data/providers.generated.js 첫 줄을 보세요" : "");

/* 업체 수 — ⚠️ 숫자를 박지 않고 **자료에서 셉니다** */
function pvCount(){
  const m = GEN.match(/\{\s*id\s*:/g);
  return m ? m.length : 0;
}
const PV = pvCount();

/* ── ② 찍힌 /pro/<id> 가 자료와 수가 맞는가 ─────────────────────── */
const proDirs = HTML.filter(function(f){ return /^pro\//.test(f); });
ok("② 찍힌 업체 화면 수가 자료의 업체 수와 같다",
   proDirs.length === PV,
   "찍힌 " + proDirs.length + "장 · 자료 " + PV + "곳" +
   (proDirs.length ? " — " + proDirs.join(" ") : ""));

/* ── ③ 씨앗 표식 ─────────────────────────────────────────────────
   ⚠️ `is_test` 는 **칸 이름**이라 화면 코드에 나올 까닭이 없습니다. */
const SEED = ["[검사용]", "green-pt", "xss-test", "is_test", "폰웨이"];
SEED.forEach(function(w){
  const hit = HTML.filter(function(f){ return rd(f).indexOf(w) >= 0; });
  ok("③ 씨앗 표식 「" + w + "」 가 찍힌 화면에 없다", hit.length === 0,
     hit.slice(0, 5).join(" "));
});

/* ── ④ 흉내 자료의 글자 ──────────────────────────────────────────
   ⚠️⚠️ 왼쪽이 **찾을 글자**, 오른쪽이 **그 글자가 들어 있어야 하는
   도구**입니다. 도구에서 사라지면 "목록이 썩었습니다" 로 멈춥니다. */
const FAKE = [
  ["주말에 라운딩 다녀왔습니다",   "tools/test-desk.js"],
  ["드라이버 슬라이스 고치는 법",     "tools/test-desk.js"],
  ["버디사냥꾼",                   "tools/test-desk.js"],
  ["참골프아카데미",               "tools/test-desk.js"],
  ["주말 오전 레슨 구합니다",      "tools/test-desk.js"]
];
FAKE.forEach(function(pair){
  const w = pair[0], src = pair[1];
  const inTool = rd(src).indexOf(w) >= 0;
  ok("④ 「" + w + "」 가 " + src + " 에 아직 있다 (목록이 안 썩었습니다)",
     inTool, inTool ? "" : "그 도구에서 이름이 바뀌었습니다 — 이 목록을 같이 고치세요");
  const hit = HTML.filter(function(f){ return rd(f).indexOf(w) >= 0; });
  ok("   그리고 **찍힌 화면에는 없다**", hit.length === 0, hit.slice(0, 5).join(" "));
});

/* ── 되돌려 보기 ────────────────────────────────────────────────── */
if(process.argv.indexOf("--prove") >= 0){
  console.log("\n  일부러 되돌려 봅니다");
  const probe = path.join(ROOT, "__fake-probe.html");
  fs.writeFileSync(probe, "<!doctype html><p>버디사냥꾼</p><p>[검사용] 아이언</p>");
  const again = builtHtml().filter(function(f){
    return rd(f).indexOf("버디사냥꾼") >= 0 || rd(f).indexOf("[검사용]") >= 0;
  });
  fs.unlinkSync(probe);
  console.log(again.length >= 1
    ? "  ✅ 가짜 글이 든 화면을 넣으니 잡습니다 (" + again.join(" ") + ")"
    : "  ❌ 못 잡습니다 — 이 검사가 고장입니다");
  if(!again.length) fail++;
}

console.log("\n" + (pass + fail) + "건 중 " + pass + "건 통과 · " + fail + "건 실패");
process.exit(fail ? 1 : 0);
