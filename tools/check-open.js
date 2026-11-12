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
   "비면 /cat/career 의 글 올리는 양식이 열리지 않습니다 (제15조 제2항)"],
  ["listingKeep", "중고 직거래 보유 기간",
   "비면 /cat/used 의 매물 올리는 양식이 열리지 않습니다 (제15조 제2항)"],
  ["watchKeep",   "저장한 조건 보유 기간",
   "비면 /my 의 조건 저장 양식이 열리지 않습니다 (제15조 제2항)"],
  /* ⚠️ 0060 — 비면 `/cat/booking` 의 예약 신청 양식이 **조용히** 안
     열립니다 (성함 · 연락처가 업체에 넘어가는 자리입니다). */
  ["bookKeep",    "예약 신청 보유 기간",
   "비면 /cat/booking 의 예약 신청 양식이 열리지 않습니다 (제15조 제2항)"],
  /* ⚠️ 0061 — 비면 분류 다섯(레슨 · 연습장 · 마켓 · 피팅 · 여행)의
     구합니다 양식이 **조용히** 안 열립니다. */
  ["wantedKeep",  "구합니다 보유 기간",
   "비면 분류 다섯의 구합니다 올리는 양식이 열리지 않습니다 (제15조 제2항)"]
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
/* ⚠️⚠️⚠️ **사진을 올리는 길은 이 키가 있어야 섭니다 — 2026-11-12 에
   이 줄이 빠져 있던 것을 찾았습니다.** `api/upload.js` 는 서명된 올릴
   주소를 Supabase 에 청하는데, 그 청은 **service key 로만** 됩니다
   (`api/_db.js` 의 `dbReady()` 가 `SUPABASE_URL` + `SUPABASE_SERVICE_KEY`
   둘을 봅니다). 버킷 둘을 다 만드셔도 이 키가 없으면 `/api/upload` 가
   **전부 거짓**을 돌려주고, 화면은 사진 칸을 **아예 안 그립니다** —
   에러도 한 줄 안 납니다. 그래서 「버킷을 만들었는데 사진 칸이 안
   나온다」로만 보입니다.
   ⚠️⚠️ **이 키는 RLS 를 통째로 지나갑니다** — 서버(`api/`)에서만 씁니다.
   Vercel 환경변수에만 넣으시고 채팅 · 코드 · 저장소에 적지 마세요. */
console.log("   □ Vercel → SUPABASE_SERVICE_KEY 넣고 **다시 배포** (사진을 올리려면 반드시)");
console.log("     · ⚠️⚠️ 이 키가 없으면 **버킷을 만드셔도** 사진 칸이 한 곳도 안 나옵니다");
console.log("     · ⚠️ 서버에서만 씁니다 — 손님 화면에는 한 글자도 안 내려갑니다");
console.log("   □ (손님 사진 · 업체 증빙서류) Supabase Storage 에 **비공개** 버킷 + INTAKE_BUCKET");
console.log("     · ⚠️ 안 넣으시면 사진 칸이 **아예 안 나옵니다** (그게 맞습니다)");
/* ⚠️⚠️⚠️ **업체 시설 사진은 공개 버킷입니다.** 그 사진은 손님 화면에
   정적 HTML 의 `<img>` 로 찍히므로(빌드가 pull-providers 의 자료를
   읽습니다) 10분짜리 서명 주소를 쓸 수가 없습니다 — 공개라야 합니다.
   ⚠️ **증빙서류는 여기 안 들어갑니다** — 서버가 DB 가 돌려준 경로로
   버킷을 고릅니다 (api/upload.js 의 bucketForPath). */
console.log("   □ (업체 **시설 사진** · **매물 사진**(0068) · 게시판 글 사진 ·\n      **여행 상품 사진**(0073) · 광고 소재) Storage 에 **공개** 버킷 + PROVIDER_BUCKET");
console.log("     · ⚠️⚠️ 이 버킷은 **공개입니다** — 주소를 아는 사람은 누구나 봅니다.");
console.log("       손님 화면(업체 카드 · 업체 화면)에 그대로 찍히므로 공개라야 합니다.");
console.log("       ⚠️ **증빙서류는 여기 안 들어갑니다** (서버가 갈래로 버킷을 고릅니다).");
console.log("     · ⚠️ 안 넣으시면 **시설 사진 칸만** 빠지고 서류 칸은 그대로 돕니다");
console.log("     · ⚠️⚠️ **광고 소재(PC · 모바일)도 이 버킷입니다** (0064) — 안 넣으시면");
console.log("       /admin 에 소재 올리는 칸이 **아예 안 나오고**, 광고는 그때까지");
console.log("       **광고주 이름만** 띄웁니다 (배너 그림은 안 나옵니다)");

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
