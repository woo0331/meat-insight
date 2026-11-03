#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   관리자 화면을 **눌러 봅니다** — 입점 신청 목록

   ⚠️⚠️ **성함 · 연락처가 나오는 화면입니다.** 그래서 두 가지를 꼭
   잽니다 —
     ① 운영자가 아니면 **한 줄도 안 보인다**
     ② 신청자가 적은 글이 **esc() 를 거쳐** 나간다 (절대 규칙 4)

   ⚠️ 못 읽은 것과 0건을 **다르게** 말하는지도 봅니다. 못 읽었는데
   0 으로 찍으면 멀쩡한 줄이 사라진 것처럼 보입니다.

   ⚠️ Supabase 를 가짜로 세워 둡니다 — 진짜 DB 쪽은 tools/test-sql.js
   가 따로 눌러 봅니다. 여기서 재는 것은 **화면이 받은 것을 어떻게
   그리는가** 입니다.

   돌리기   node tools/test-admin.js
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path"), http = require("http");
const ROOT = path.join(__dirname, "..");

let bad = 0, ran = 0;
function ok(name, cond, got){
  ran++;
  if(cond) console.log("  ✅ " + name);
  else { bad++; console.log("  ❌ " + name + (got !== undefined ? "  →  " + String(got).slice(0, 200) : "")); }
}

function serve(port){
  const T = { ".html":"text/html;charset=utf-8", ".css":"text/css;charset=utf-8",
              ".js":"text/javascript;charset=utf-8" };
  const s = http.createServer(function(q, r){
    const u = decodeURIComponent(q.url.split("?")[0]);
    let f = path.join(ROOT, u === "/" ? "index.html" : u);
    if(!fs.existsSync(f) && fs.existsSync(f + ".html")) f = f + ".html";
    if(fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
    if(!fs.existsSync(f) || fs.statSync(f).isDirectory()){ r.writeHead(404); return r.end("404"); }
    r.writeHead(200, { "Content-Type": T[path.extname(f)] || "application/octet-stream" });
    r.end(fs.readFileSync(f));
  });
  return new Promise(function(done){ s.listen(port, function(){ done(s); }); });
}

const FAKE = "http://sb.test";
const ROWS = [
  { id:"11111111-1111-1111-1111-111111111111", no:"GA261103-0001",
    company:"성남 그린골프연습장", name:"홍길동", tel:"010-1234-5678",
    region:"경기 성남시", services:["rg-in","rg-sim"], state:"new",
    created_at:"2026-11-03T01:00:00Z" },
  /* ⚠️ 신청자가 적은 글에 태그를 넣어 봅니다 — 그대로 나가면 사고입니다 */
  { id:"22222222-2222-2222-2222-222222222222", no:"GA261103-0002",
    company:"<img src=x onerror=alert(1)>", name:"테스트", tel:"010-0000-0000",
    region:null, services:["ls-pro","없는키"], state:"called",
    created_at:"2026-11-03T02:00:00Z" }
];

function stub(p, who, applyBody){
  return Promise.all([
    p.route("**/api/session", function(r){
      return r.fulfill({ status:200, contentType:"application/json",
        body: JSON.stringify(Object.assign({ auth:true, signedIn:true, hats:[],
          conf:{ url:FAKE, anonKey:"k" } }, who)) });
    }),
    p.route(FAKE + "/rest/v1/**", function(r){
      const u = r.request().url();
      if(u.indexOf("provider_apply") >= 0) return applyBody(r);
      /* 세는 요청 — content-range 로 갯수를 돌려줍니다 */
      return r.fulfill({ status:200, contentType:"application/json",
        headers:{ "content-range":"0-0/7" }, body:"[]" });
    })
  ]);
}

(async function(){
  const PORT = 8790 + (process.pid % 50);
  const srv = await serve(PORT);
  const b = await chromium.launch();
  const URL = "http://127.0.0.1:" + PORT + "/admin";

  /* ── ① 운영자가 아닐 때 ─────────────────────────────────────── */
  console.log("\n── 운영자가 아니면 한 줄도 안 보입니다");
  let p = await b.newPage({ viewport:{ width:1280, height:900 } });
  let reached = false;
  await stub(p, { role:"customer", name:"일반회원" }, function(r){
    reached = true;
    return r.fulfill({ status:200, contentType:"application/json", body: JSON.stringify(ROWS) });
  });
  await p.goto(URL, { waitUntil:"networkidle" });
  await p.waitForTimeout(400);
  let txt = (await p.textContent("#adminbox")) || "";
  ok("운영자만 볼 수 있다고 말한다", /운영자만/.test(txt), txt.slice(0, 50));
  ok("신청 목록을 **아예 읽으러 가지도 않는다**", reached === false);
  ok("성함 · 연락처가 한 글자도 안 나온다",
     txt.indexOf("홍길동") < 0 && txt.indexOf("1234-5678") < 0);
  await p.close();

  /* ── ② 관리자일 때 ─────────────────────────────────────────── */
  console.log("\n── 관리자는 봅니다");
  p = await b.newPage({ viewport:{ width:1280, height:900 } });
  let errs = [];
  p.on("pageerror", function(e){ errs.push(String(e)); });
  await stub(p, { role:"admin", name:"관리자" }, function(r){
    return r.fulfill({ status:200, contentType:"application/json", body: JSON.stringify(ROWS) });
  });
  await p.goto(URL, { waitUntil:"networkidle" });
  await p.waitForTimeout(500);
  ok("화면 에러가 없다", errs.length === 0, errs.join(" | "));
  ok("세는 칸이 그려진다", (await p.locator(".cnt").count()) === 8,
     await p.locator(".cnt").count());
  ok("신청 두 줄이 그려진다", (await p.locator(".apl-r").count()) === 2,
     await p.locator(".apl-r").count());

  const html = await p.innerHTML("#adminbox");
  ok("⚠️ 신청자가 적은 태그가 **날것으로 안 들어간다**",
     html.indexOf("<img src=x") < 0 && html.indexOf("&lt;img") >= 0);
  const imgs = await p.locator("#adminbox img").count();
  ok("⚠️ 그 글 때문에 그림이 생기지 않는다", imgs === 0, imgs);

  txt = (await p.textContent("#adminbox")) || "";
  ok("하위 키를 사람 말로 바꿔 보여 준다", txt.indexOf("실내 연습장") >= 0);
  ok("모르는 키는 **키 그대로** 보여 준다 (조용히 빠지지 않는다)",
     txt.indexOf("없는키") >= 0);
  ok("상태를 사람 말로 보여 준다", txt.indexOf("새 신청") >= 0 && txt.indexOf("통화함") >= 0);
  ok("지역이 비어도 '(미기재)' 를 안 찍는다",
     txt.indexOf("미기재") < 0 && txt.indexOf("undefined") < 0 && txt.indexOf("null") < 0);

  /* 누르는 것이 전부 40px 이상인가 */
  const low = await p.evaluate(function(){
    return Array.prototype.filter.call(
      document.querySelectorAll("#adminbox button, #adminbox a"),
      function(e){ return e.getBoundingClientRect().height < 39.5; }).length;
  });
  ok("누르는 것이 전부 40px 이상이다", low === 0, low);
  await p.close();

  /* ── ③ 읽지 못했을 때 ──────────────────────────────────────── */
  console.log("\n── 못 읽은 것과 0건을 다르게 말합니다");
  p = await b.newPage({ viewport:{ width:1280, height:900 } });
  await stub(p, { role:"admin", name:"관리자" }, function(r){
    return r.fulfill({ status:500, contentType:"application/json", body:"{}" });
  });
  await p.goto(URL, { waitUntil:"networkidle" });
  await p.waitForTimeout(500);
  txt = (await p.textContent("#adminbox")) || "";
  ok("읽지 못하면 그렇다고 말한다", /읽지 못했습니다/.test(txt), txt.slice(-60));
  ok("읽지 못한 것을 0건이라고 하지 않는다", txt.indexOf("0건") < 0);
  await p.close();

  p = await b.newPage({ viewport:{ width:1280, height:900 } });
  await stub(p, { role:"admin", name:"관리자" }, function(r){
    return r.fulfill({ status:200, contentType:"application/json", body:"[]" });
  });
  await p.goto(URL, { waitUntil:"networkidle" });
  await p.waitForTimeout(500);
  txt = (await p.textContent("#adminbox")) || "";
  ok("0건이면 0건이라고 말한다", /아직 들어온 신청이 없습니다/.test(txt), txt.slice(-60));
  await p.close();

  await b.close(); srv.close();
  console.log("\n" + ran + "건 중 " + (ran - bad) + "건 통과 · " + bad + "건 실패");
  process.exit(bad ? 1 : 0);
})();
