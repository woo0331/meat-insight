#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   전수 점검 **표본 밖** 화면을 훑어봅니다

     node tools/sweep-rest.js            # PAGES 에 없는 화면 전부
     node tools/sweep-rest.js /startup/bar /closure/stay

   `check.js` 의 `PAGES` 는 **일부러 표본**입니다 — 업종 열넷 · 분류
   스물다섯을 다 넣으면 검사가 한참 길어지고, 짜임새가 같은 화면을
   스무 번 재는 셈이기 때문입니다. 그래서 짜임새가 서로 다른 것만
   고릅니다 (장비가 제일 많은 cafe · 재고가 도는 restaurant · 장비가
   없는 etc · 폐업 쪽이 특이한 gym …).

   ⚠️ 그런데 그 판단이 맞는지는 **재 봐야** 압니다. 이 저장소에서
   `/home` 이 PAGES 에 없어서 크롤러 본문이 95자로 나가는 것을 몇 주
   놓친 적이 있습니다. 이 도구가 그 걱정을 싸게 덜어 줍니다 —
   `check.js` 의 **AUDIT 을 그대로 꺼내서** 표본 밖 화면에 돌립니다.

   > **2026-10-01 처음 돌렸을 때** — 표본 밖 46개 화면 × 네 폭에서
   > 걸리는 것이 **하나도 없었습니다.** 표본 추출은 맞았습니다.

   ⚠️ 이건 **AUDIT(화면마다 도는 검사)만** 봅니다. 흐름 검사 ·
   링크 · 크롤러 본문은 `node check.js` 가 봅니다.
   ⚠️ 화면을 새로 만들면 `check.js` 의 `PAGES` 에 넣는 것이 먼저입니다.
   이 도구는 그걸 대신하지 않습니다.
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const http = require("http"), fs = require("fs"), path = require("path");

const MIME = {".html":"text/html;charset=utf-8",".js":"text/javascript;charset=utf-8",
 ".css":"text/css;charset=utf-8",".json":"application/json",".svg":"image/svg+xml",
 ".jpg":"image/jpeg",".png":"image/png",".ico":"image/x-icon",
 ".txt":"text/plain",".xml":"application/xml"};
const PORT = 8477, ROOT = "http://127.0.0.1:" + PORT;
const srv = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split("?")[0]);
  let f = path.join(process.cwd(), p);
  if(!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
  if(!fs.existsSync(f)){ f = path.join(process.cwd(), "404.html"); r.statusCode = 404; }
  r.setHeader("content-type", MIME[path.extname(f)] || "text/plain");
  r.end(fs.readFileSync(f));
});

/* check.js 에서 BAD · AUDIT 을 **그대로** 꺼냅니다 — 베껴 두면
   본검사를 고칠 때 여기만 옛것으로 남습니다. */
const src   = fs.readFileSync("check.js", "utf8");
const BAD   = eval(src.match(/^const BAD = (.+);$/m)[1]);
const AUDIT = eval("`" + src.match(/const AUDIT = `([\s\S]*?)`;\n/)[1] + "`");

/* PAGES 에 있는 주소 */
function sampled(){
  const m = src.match(/const PAGES = \[([\s\S]*?)\n\];/);
  const out = new Set();
  for(const x of m[1].matchAll(/\["([^"]+)"/g)) out.add(x[1].split("?")[0]);
  return out;
}
/* 빌드된 주소 전부 (index.html 이 있는 폴더) */
function built(dir, base){
  let out = [];
  for(const e of fs.readdirSync(dir, { withFileTypes:true })){
    if(!e.isDirectory()) continue;
    if(["node_modules",".git","img","tools",".vercel","api"].includes(e.name)) continue;
    const p = path.join(dir, e.name), url = base + "/" + e.name;
    if(fs.existsSync(path.join(p, "index.html"))) out.push(url);
    out = out.concat(built(p, url));
  }
  return out;
}

(async () => {
  let urls = process.argv.slice(2);
  if(!urls.length){
    const have = sampled();
    urls = built(process.cwd(), "").filter(u => !have.has(u)).sort();
  }
  if(!urls.length){ console.log("표본 밖 화면이 없습니다."); return; }
  console.log("표본 밖 " + urls.length + "개 화면 × 네 폭\n");

  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  let bad = 0;
  for(const w of [1440, 1024, 390, 360]){
    const pg = await (await b.newContext({ viewport:{ width:w, height:900 } })).newPage();
    const errs = [];
    pg.on("pageerror", e => errs.push(String(e)));
    for(const u of urls){
      await pg.goto(ROOT + u, { waitUntil:"load" });
      await pg.waitForTimeout(240);
      const o = await pg.evaluate(AUDIT);
      const hit = Object.keys(o)
        .filter(k => k !== "links" && Array.isArray(o[k]) && o[k].length)
        .map(k => k + " " + JSON.stringify(o[k]).slice(0, 110));
      if(hit.length){ bad++; console.log("❌ " + w + "px " + u + "\n   " + hit.join("\n   ")); }
    }
    if(errs.length){ bad++; console.log("❌ JS 에러 " + w + "px — " + errs.slice(0,3).join(" | ")); }
    await pg.close();
  }
  console.log(bad ? "\n❌ " + bad + "건" : "\n✅ 표본 밖 화면에서도 걸리는 것이 없습니다");
  await b.close(); srv.close();
  process.exit(bad ? 1 : 0);
})();
