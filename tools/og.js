#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   공유 미리보기 그림을 만듭니다 — tools/og.html → /og.jpg

     node tools/og.js

   카카오톡 · 페이스북 · 슬랙에 주소를 붙였을 때 뜨는 그림입니다.
   1200×630 으로 찍습니다 (`og:image:width/height` 와 같아야 합니다).

   ⚠️⚠️ **한글 글꼴이 있는 기계에서 찍어야 합니다.** 글꼴 CDN 이 막힌
   곳에서 찍으면 한글이 **네모로** 나오고, 그 그림이 한 번 퍼지면
   카카오·페이스북 캐시에 한참 남습니다. 그래서 여기서 먼저 글꼴이
   있는지 보고, 없으면 **찍지 않고 멈춥니다.**

   없을 때 까는 법 (npm 은 이 환경에서 열려 있습니다) —
     npm pack pretendard
     tar -xzf pretendard-*.tgz package/dist/public/variable/PretendardVariable.ttf
     mkdir -p ~/.local/share/fonts
     cp package/dist/public/variable/PretendardVariable.ttf ~/.local/share/fonts/
     fc-cache -f

   ⚠️ **브랜드 이름을 tools/og.html 에 적지 마세요.** 여기서
   `js/data/brand.js` 를 읽어 넣습니다 — 이름을 정하시면 그 한 줄만
   바꾸면 이 그림도 같이 바뀝니다.
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const { execFileSync } = require("child_process");
const fs = require("fs"), path = require("path");

const ROOT = process.cwd();
const OUT  = path.join(ROOT, "og.jpg");
const W = 1200, H = 630;

/* ── ① 한글 글꼴이 있는가 ─────────────────────────────────────── */
function hasPretendard(){
  try{
    const out = execFileSync("fc-match", ["Pretendard Variable"], { encoding:"utf8" });
    return /Pretendard/i.test(out);
  }catch(e){ return false; }   /* fontconfig 이 없는 기계 — 아래서 직접 봅니다 */
}

/* ── ② 브랜드 이름 ───────────────────────────────────────────── */
function brand(){
  const sandbox = { window:{} };
  const src = fs.readFileSync(path.join(ROOT, "js/data/brand.js"), "utf8");
  new Function("window", src)(sandbox.window);
  const B = sandbox.window.AM_BRAND || {};
  if(!B.name) throw new Error("js/data/brand.js 의 AM_BRAND.name 이 비었습니다");
  return B;
}

(async () => {
  if(!hasPretendard()){
    console.error(
      "\n❌ 한글 글꼴(Pretendard)이 이 기계에 없습니다 — **찍지 않았습니다.**\n" +
      "   이대로 찍으면 한글이 네모로 나오고, 그 그림이 카카오 · 페이스북\n" +
      "   캐시에 한참 남습니다. 아래를 먼저 돌리세요.\n\n" +
      "     npm pack pretendard\n" +
      "     tar -xzf pretendard-*.tgz package/dist/public/variable/PretendardVariable.ttf\n" +
      "     mkdir -p ~/.local/share/fonts\n" +
      "     cp package/dist/public/variable/PretendardVariable.ttf ~/.local/share/fonts/\n" +
      "     fc-cache -f\n");
    process.exit(1);
  }

  const B = brand();
  const src = fs.readFileSync(path.join(ROOT, "tools/og.html"), "utf8");

  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{ width:W, height:H }, deviceScaleFactor:1 });
  const pg = await ctx.newPage();
  await pg.setContent(src, { waitUntil:"load" });
  /* 이름은 화면이 아니라 **여기서** 넣습니다 */
  await pg.evaluate(function(v){
    document.documentElement.dataset.brand = v.name;
    document.documentElement.dataset.sub   = v.sub || "";
    /* setContent 뒤라 안에 있던 스크립트는 이미 돌았습니다 — 다시 넣습니다 */
    document.getElementById("og-brand").textContent = v.name;
    document.getElementById("og-sub").textContent   = v.sub || "";
  }, { name:B.name, sub:B.sub });
  await pg.waitForTimeout(250);

  /* ⚠️ 글자가 네모(tofu)로 나왔는지 그림에서 직접 봅니다. 글꼴 검사를
     통과해도 Chromium 이 다른 글꼴을 골랐을 수 있습니다 — 제목 칸의
     폭이 터무니없이 좁거나 넓으면 글꼴이 안 먹은 것입니다. */
  const w = await pg.evaluate(function(){
    const h = document.querySelector("h1");
    return { px:h.getBoundingClientRect().width,
             font:getComputedStyle(h).fontFamily };
  });
  if(w.px < 400 || w.px > 1100){
    console.error("❌ 제목 폭이 " + Math.round(w.px) + "px 입니다 — 글꼴이 안 먹은 것 같습니다 (" + w.font + ")");
    await b.close(); process.exit(1);
  }

  const el = await pg.$("#og");
  await el.screenshot({ path:OUT, type:"jpeg", quality:92 });
  await b.close();

  const kb = Math.round(fs.statSync(OUT).size / 1024);
  console.log("✅ og.jpg — " + W + "×" + H + " · " + kb + "KB · " + B.name);
  console.log("   ⚠️ 카카오 · 페이스북은 예전 그림을 캐시해 둡니다. 배포한 뒤");
  console.log("      카카오톡 디버거 · 페이스북 Sharing Debugger 에서 한 번");
  console.log("      긁어 주셔야 새 그림이 보입니다.");
})();
