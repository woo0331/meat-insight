#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   gori-app.js 빌드
   src/ 의 조각들을 아래 순서대로 이어붙여 gori-app.js 를 만듭니다.

     node build.js            빌드
     node build.js --check    빌드 결과가 현재 파일과 같은지만 확인

   순서 규칙
     · 07_init.js 는 반드시 마지막 — 전체를 감싼 IIFE 의 닫는 괄호가 여기 있습니다.
     · 12_redesign.js 는 13_onboard.js 뒤 — 리디자인이 온보딩 함수를 감쌉니다.
     · 14 이후 확장들은 12 뒤 — 리디자인이 다시 덮어쓰지 못하게 합니다.
   ════════════════════════════════════════════════════════════════════ */
const fs=require("fs"), path=require("path");

const ORDER=[
  "01_core.js","02_request.js","03_quote.js","04_daily.js","05_supplier.js","06_my.js",
  "08_match.js","09_chat.js","10_trust.js","11_wire3.js","13_onboard.js","12_redesign.js",
  "14_router.js","15_filter.js","16_edit.js","17_market.js","18_jobs.js","19_find.js",
  "20_live.js","21_guard.js","22_pwa.js","23_notif.js","24_content.js","25_a11y.js",
  "26_kakao.js","27_offline.js","28_stale.js","29_supedit.js","30_suphome.js","31_guide.js","32_report.js",
  "07_init.js"
];

const SRC=path.join(__dirname,"src");
const OUT=path.join(__dirname,"gori-app.js");

const have=fs.readdirSync(SRC).filter(f=>f.endsWith(".js")).sort();
const missing=ORDER.filter(f=>!have.includes(f));
const extra=have.filter(f=>!ORDER.includes(f));
if(missing.length){ console.error("빠진 파일:", missing.join(", ")); process.exit(1); }
if(extra.length){ console.error("ORDER 에 없는 파일:", extra.join(", "), "— build.js 의 ORDER 에 추가하세요."); process.exit(1); }

const out=ORDER.map(f=>fs.readFileSync(path.join(SRC,f),"utf8")).join("");

if(process.argv.includes("--check")){
  const cur=fs.existsSync(OUT)?fs.readFileSync(OUT,"utf8"):"";
  if(cur===out){ console.log("gori-app.js 최신 상태입니다."); process.exit(0); }
  console.error("gori-app.js 가 src/ 와 다릅니다. `node build.js` 를 실행하세요."); process.exit(1);
}

fs.writeFileSync(OUT,out);
console.log("gori-app.js 생성 — "+ORDER.length+"개 조각, "+(out.length/1024).toFixed(1)+" KB");
