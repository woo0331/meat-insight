#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   문 여는 날 준비가 됐나 — **세어서 말해 줍니다**

   ⚠️⚠️ **이것은 합격 · 불합격을 가리는 검사가 아닙니다.** 지금 무엇이
   비어 있고, 그것이 비어 있는 동안 **무엇이 조용히 안 되는지**를 적어
   주는 자리입니다. 그래서 `ship.js` 에 넣지 않았습니다 — 넣으면 문을
   열기 전에는 늘 빨갛고, 빨간 것에 익숙해지면 진짜 빨간 것을 놓칩니다.

   ⚠️⚠️⚠️ **빌드가 막는 것과 안 막는 것을 갈라 적습니다.**
   `SITE_LIVE` 를 켜면 빌드가 **아홉 칸**을 세어 멈춥니다. 그런데 그
   아홉에 안 들어가는데 **비면 조용히 기능이 빠지는 것**이 더 있습니다
   (상담 시간 · 보호책임자 연락처 · 검색엔진 확인 문자열). 그것들은
   아무도 안 막아 주므로 여기서 셉니다.

   ⚠️ **사장님이 바깥에서 하실 것**(Supabase · Vercel)은 저장소에서
   확인할 길이 없습니다 — 확인한 척하지 않고 "여기서는 못 봅니다" 라고
   적습니다 (절대 규칙 5).

   ⚠️ **잰 것이 0개면 실패입니다** — site.js 를 못 읽었는데 "다 됐다" 로
   보이면 안 됩니다.

   돌리기   node tools/check-open.js
   ════════════════════════════════════════════════════════════════════ */
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");

/* site.js 를 빌드와 **같은 길**로 읽습니다 — 두 곳에 적지 않습니다.
   ⚠️ 빌려 쓰고 그대로 돌려놓습니다 (check-deal 이 global.window 를
   덮어써서 빌드를 통째로 깨뜨린 적이 있습니다). */
function biz(){
  const had = Object.prototype.hasOwnProperty.call(global, "window");
  const old = global.window;
  global.window = {};
  try{
    delete require.cache[require.resolve(path.join(ROOT, "js/data/site.js"))];
    require(path.join(ROOT, "js/data/site.js"));
    return global.window.WOW_BIZ || {};
  } finally {
    if(had) global.window = old; else delete global.window;
  }
}
const B = biz();
function has(k){ return !!String(B[k] == null ? "" : B[k]).trim(); }

/* ── ① 빌드가 막는 아홉 칸 ──────────────────────────────────────
   ⚠️ 이 목록은 build.js 의 것과 **같아야** 합니다. 두 곳에 적어 두었으니
   아래에서 실제로 맞춰 봅니다 (어긋나면 그 자리에서 말합니다). */
const BLOCK = [
  ["company",        "상호",                  "전자상거래법 제10조"],
  ["ceo",            "대표자 성명",            "제10조"],
  ["brn",            "사업자등록번호",          "제10조"],
  ["mailOrder",      "통신판매업 신고번호",      "제10조 · 관할 구청 신고가 먼저입니다"],
  ["address",        "사업장 주소",            "제10조"],
  ["phone",          "고객센터 전화",           "제10조 · 고객센터에 연락처가 안 나옵니다"],
  ["email",          "문의 이메일",            "제10조"],
  ["privacyOfficer", "개인정보 보호책임자",      "개인정보보호법 제31조 · 방침에서 그 절이 통째로 빠집니다"],
  ["effective",      "약관 · 방침 시행일",      "약관 · 방침에 시행일 줄이 안 나옵니다"]
];

/* ── ② 아무도 안 막는데 비면 조용히 빠지는 것 ────────────────────── */
const QUIET = [
  ["hours",         "상담 가능 시간",
   "고객센터의 전화 옆 안내가 빠집니다 (전화만 덩그러니 나옵니다)"],
  ["privacyEmail",  "보호책임자 이메일",
   "방침의 보호책임자 절에서 이메일 줄이 빠집니다"],
  ["privacyPhone",  "보호책임자 전화",
   "같은 절에서 전화 줄이 빠집니다"],
  ["naverVerify",   "네이버 서치어드바이저 확인 문자열",
   "네이버에 사이트 등록을 못 합니다 (에러 없이 그냥 안 됩니다)"],
  ["googleVerify",  "구글 서치콘솔 확인 문자열",
   "구글에 사이트 등록을 못 합니다"]
];

/* ── ③ 이미 채워져 있어 **보시기만** 하면 되는 것 ─────────────────── */
const LOOK = [
  ["applyKeep",   "입점 신청 보유 기간",
   "흔한 기본값입니다 — 보시고 바꾸시거나 그대로 두세요"],
  ["inquiryKeep", "문의 기록 보유 기간",
   "전자상거래법 시행령 제6조가 정한 3년입니다 — 바꾸실 까닭이 거의 없습니다"],
  /* ⚠️⚠️ **비면 그 양식이 조용히 안 열립니다** (개인정보보호법 제15조
     제2항 — 보유 기간을 안 보여 주고 동의를 받을 수는 없습니다).
     0046 을 만들며 이 줄을 빠뜨려서, joinKeep 이 비면 사장님이 무엇이
     막혔는지 알 길이 없었습니다. */
  ["joinKeep",    "조인 보유 기간",
   "비면 /cat/matchup 의 조인 여는 양식이 열리지 않습니다 (제15조 제2항)"],
  ["careerKeep",  "구인 · 구직 보유 기간",
   "비면 /cat/career 의 글 올리는 양식이 열리지 않습니다 (제15조 제2항)"]
];

let measured = 0, left = 0;
function line(k, name, why, kind){
  measured++;
  const ok = has(k);
  if(!ok && kind !== "look") left++;
  console.log("  " + (ok ? "✅" : "❌") + " " + name.padEnd(26) +
    (ok ? "= " + String(B[k]).slice(0, 44)
        : "비어 있습니다 — " + why));
}

console.log("\n════ 문 여는 날 준비 ════\n");

/* SITE_LIVE 를 읽습니다 — 빌드 파일에서 그대로 */
const bsrc = fs.readFileSync(path.join(ROOT, "build.js"), "utf8");
const live = /var SITE_LIVE\s*=\s*true/.test(bsrc);
console.log("SITE_LIVE = " + (live ? "true — 검색에 올라갑니다"
  : "false — 모든 화면 noindex · robots 가 전부 막습니다"));

/* ⚠️ 위 BLOCK 목록이 build.js 의 것과 같은지 **맞춰 봅니다.**
   두 곳에 적어 둔 목록은 한쪽만 고치면 조용히 어긋납니다. */
const inBuild = (bsrc.match(/\["([a-zA-Z]+)",\s+"[^"]+"\]/g) || [])
  .map(s => (s.match(/\["([a-zA-Z]+)"/) || [])[1]);
const missing = BLOCK.map(r => r[0]).filter(k => inBuild.indexOf(k) < 0);
if(missing.length){
  console.log("\n⚠️⚠️ 이 도구의 목록이 build.js 와 어긋났습니다: " +
              missing.join(", ") + " — 둘 중 하나를 고치세요.");
}

console.log("\n① 빌드가 **막는** 아홉 칸 (js/data/site.js)");
console.log("   ⚠️ SITE_LIVE 를 켜면 빌드가 이 칸들을 세어 **멈춥니다.**");
BLOCK.forEach(r => line(r[0], r[1], r[2], "block"));

console.log("\n② 아무도 안 막는데 **비면 조용히 빠지는 것**");
console.log("   ⚠️ 빌드가 안 막습니다 — 비어도 그냥 그 줄이 사라집니다.");
QUIET.forEach(r => line(r[0], r[1], r[2], "quiet"));

console.log("\n③ 채워져 있습니다 — **보시기만** 하면 됩니다");
LOOK.forEach(r => line(r[0], r[1], r[2], "look"));

/* ── ④ 저장소 밖 ─────────────────────────────────────────────── */
const migs = fs.readdirSync(path.join(ROOT, "db/migrations"))
  .filter(f => /^\d{4}_.*\.sql$/.test(f) && !/_down\.sql$/.test(f)).sort();
const last = migs[migs.length - 1].slice(0, 4);
const applyTxt = fs.readFileSync(path.join(ROOT, "db/apply-from-0008.sql"), "utf8");
const applyHas = applyTxt.indexOf(migs[migs.length - 1].replace(/\.sql$/, "")) >= 0;

console.log("\n④ 사장님이 **바깥에서** 하실 것 — ⚠️ 여기서는 못 봅니다");
console.log("   (저장소만 보고 됐다 · 안 됐다를 말할 수 없어서, 확인한 척하지 않습니다)");
console.log("   □ Supabase → SQL Editor 에 db/apply-from-0008.sql 붙여넣기");
console.log("     · 지금 파일이 담는 범위 0008 ~ " + last +
            (applyHas ? "  ✅ 마지막 번호까지 들어 있습니다"
                      : "  ⚠️ 마지막 번호가 안 들어 있습니다 — node tools/make-apply.js"));
console.log("     · ⚠️ 운영에는 0001~0007 만 돌아가 있습니다 (두 번 붙여 넣어도 안전합니다)");
console.log("   □ Supabase → Authentication 에서 사장님 UID 로 관리자 만들기 (SQL 로만)");
console.log("   □ Vercel → SUPABASE_URL · SUPABASE_ANON_KEY 넣고 **다시 배포**");
console.log("     · 넣는 순간 로그인 · 입점 신청 · 매칭 요청 · **고객센터 문의**가 켜집니다");
console.log("     · ⚠️ Vercel 은 떠 있는 함수에 값을 밀어 넣지 않습니다 — 다시 배포해야 켜집니다");
console.log("   □ (사진 · 서류를 받으시려면) Supabase Storage 에 **비공개** 버킷 + INTAKE_BUCKET");
console.log("     · ⚠️ 안 넣으시면 사진 칸이 **아예 안 나옵니다** (그게 맞습니다)");

/* ── 맺음 ────────────────────────────────────────────────────── */
console.log("\n════════════════════════════════════════");
if(measured === 0){
  console.error("❌ 잰 것이 0개입니다 — js/data/site.js 를 못 읽었습니다.");
  process.exit(1);
}
if(left === 0){
  console.log("✅ site.js 의 칸은 전부 찼습니다 (" + measured + "칸을 쟀습니다).");
  console.log("   다음: ④ 의 네모를 하시고 → build.js 의 SITE_LIVE = true →");
  console.log("        node tools/ship.js → 초록이면 node tools/ship.js --merge");
}else{
  console.log("남은 칸 " + left + "개 / 잰 칸 " + measured + "개.");
  console.log("⚠️ 지어낼 수 없는 값입니다 — 사장님이 채우셔야 합니다.");
  console.log("   비어 있는 동안은 그 줄이 화면에서 **통째로 빠집니다** (빈 칸을 찍지 않습니다).");
}
console.log("   차례와 되돌리는 법은 DEPLOY.md 에 있습니다.\n");
/* ⚠️ 보고일 뿐이라 **안 비웁니다** — 합격 · 불합격이 아닙니다 */
process.exit(0);
