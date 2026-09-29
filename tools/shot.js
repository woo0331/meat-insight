#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   화면을 찍어 봅니다 (playwright 필요)

     node tools/shot.js "/|1440|home" "/|390|home-m" "/tools|1440|tools|900"

   칸은 `주소|폭|파일이름|스크롤` 입니다. 스크롤 자리에 `full` 을 쓰면
   페이지 전체를 한 장으로, 숫자를 쓰면 그만큼 내린 뒤에 찍습니다.
   결과는 /tmp/shots/<이름>.png 입니다.

   ⚠️ **디자인을 바꿨으면 적어만 두지 말고 찍어서 보세요.** 이 저장소에서
   로고가 화면마다 잘려 있던 것을(클래스 이름이 겹쳤습니다) 눈으로 보고서야
   찾았습니다 — 에러도 가로 스크롤도 안 나서 전수 점검은 계속 통과했습니다.

   ⚠️ 이건 **보는 도구**이지 검사가 아닙니다. 통과·실패를 내지 않습니다.
   실제 검사는 `node check.js` 입니다.
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const MIME = {".html":"text/html;charset=utf-8",".js":"text/javascript;charset=utf-8",
 ".css":"text/css;charset=utf-8",".json":"application/json",".svg":"image/svg+xml",
 ".jpg":"image/jpeg",".png":"image/png",".ico":"image/x-icon",".txt":"text/plain",".xml":"application/xml"};
const PORT=8231, ROOT="http://localhost:"+PORT;
const srv = http.createServer((req,res)=>{
  let p = decodeURIComponent(req.url.split("?")[0]);
  let f = path.join(process.cwd(), p);
  if(!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
  if(!fs.existsSync(f)) { f = path.join(process.cwd(), "404.html"); res.statusCode=404; }
  res.setHeader("content-type", MIME[path.extname(f)]||"application/octet-stream");
  res.end(fs.readFileSync(f));
});
(async()=>{
  await new Promise(r=>srv.listen(PORT,r));
  const b = await chromium.launch();
  const jobs = process.argv.slice(2);
  for(const j of jobs){
    const [url, w, name, full] = j.split("|");
    const ctx = await b.newContext({ viewport:{width:+w, height:900}, deviceScaleFactor:1 });
    const pg = await ctx.newPage();
    await pg.goto(ROOT+url, { waitUntil:"load" });
    await pg.waitForTimeout(400);
    if(full && /^[0-9]+$/.test(full)){ await pg.evaluate(y=>window.scrollTo(0,+y), full); await pg.waitForTimeout(300); }
    await pg.screenshot({ path:"/tmp/shots/"+name+".png", fullPage: full === "full" });
    await ctx.close();
    console.log(name);
  }
  await b.close(); srv.close();
})();
