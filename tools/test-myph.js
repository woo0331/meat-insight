/* 2026-11-28 — 사진이 '올리는 중' 에 머무는 경우와 내 기록에서 다시 첨부 (SW-ZNF3-7W8E 에서 찾은 자리)
   ⚠️ 서버는 가짜입니다. 실제 시험 DB 의 SW-ZNF3-7W8E 는 사진 기록 1 · 파일 0 이었습니다.
   보는 것 — ① 파일 전송이 끝나지 않으면 시간 뒤 '저장 실패' + '다시 올리기' (화면이 '올리는 중' 에 안 머뭄)
            ② 다시 올리기는 **같은 자리(같은 주소)** 를 씁니다 — 자리 요청 1번 · 성공 뒤 '저장됨'
            ③ 내 기록: 저장된 사진은 '저장됨' · 파일이 없는 자리는 '파일이 저장되지 않았어요' + '이 사진 다시 첨부'
            ④ 다시 첨부는 **그 사진 id 로** 보냅니다(op:mine · 연락처를 화면이 안 보냄 · 토큰을 달고) → '저장됨'
            ⑤ 새 사진 추가도 같은 문(op:mine) · 버킷이 꺼져 있으면 구역째 안 그림 */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const ROOTDIR = process.cwd();
const FX = JSON.parse(fs.readFileSync(path.join(ROOTDIR, "tools/fixtures-cq.json"), "utf8"));
const MIME = {".html":"text/html;charset=utf-8",".js":"text/javascript;charset=utf-8",".css":"text/css;charset=utf-8",".json":"application/json",".svg":"image/svg+xml",".jpg":"image/jpeg",".png":"image/png",".webp":"image/webp"};
const PORT = 8263, R = "http://localhost:" + PORT;
const srv = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split("?")[0]); let f = path.join(ROOTDIR, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
  if (!fs.existsSync(f)) f = path.join(ROOTDIR, "index.html");
  s.setHeader("content-type", MIME[path.extname(f)] || "application/octet-stream"); s.end(fs.readFileSync(f)); });
const res = []; const ok = (c, m, x) => { res.push((c ? "✅ " : "❌ ") + m + (c ? "" : "  " + JSON.stringify(x === undefined ? "" : x).slice(0, 300))); };
const img = path.join(ROOTDIR, "img", fs.readdirSync(path.join(ROOTDIR, "img")).filter(x => /\.jpg$/.test(x))[0]);
/* 내 기록 씨앗 — 비로그인 접수를 가져온 건 · 사진 둘(하나는 파일 있음 · 하나는 파일 없음) */
const ME = JSON.parse(JSON.stringify(FX));
ME.requests = [{ id:"r-znf3", no:"SW-ZNF3-7W8E", side:"close", cat:"restore", region:"경기", gu:"의왕시", state:"new",
  created_at:"2026-11-28T07:35:48Z", request_item:[{ service_id:"restore/shop-restore", state:"new" }], assignment:[],
  request_photo:[{ id:"11111111-1111-4111-8111-111111111111", mime:"image/jpeg", bytes:2308291, created_at:"2026-11-28T07:35:52Z" },
                 { id:"22222222-2222-4222-8222-222222222222", mime:"image/jpeg", bytes:1518333, created_at:"2026-11-28T07:35:52Z" }] }];
ME.quotes = []; ME.quoteRevs = [];

async function ctxOf(b, W, o){
  const ctx = await b.newContext({ viewport:{ width:W, height:800 } });
  await ctx.addInitScript((m) => { let w; Object.defineProperty(window, "WOW_BIZ", { configurable:true, get(){ return w; }, set(v){ v.sosReady = true; w = v; } });
    window.AM_PH_PUT_MS = 1500;
    if (m.signed) localStorage.setItem("am.auth.v1", JSON.stringify({ access_token:"TOK", refresh_token:"R", at: Date.now() + 3e6 })); }, { signed: !!o.signed });
  o.slots = []; o.puts = {}; o.gets = [];
  await ctx.route("**/api/session**", r => r.fulfill({ contentType:"application/json", body: JSON.stringify({ auth:true, kakao:true, signedIn:!!o.signed, role:"customer", intake:{ quote:true, close:true, sell:true, join:true }, conf:{ url:"x", anon:"y" } }) }));
  await ctx.route("**/api/upload**", r => {
    const q = r.request();
    if (q.method() === "GET") {
      const pid = new URL(q.url()).searchParams.get("p");
      if (!pid) return r.fulfill({ contentType:"application/json", body: JSON.stringify({ up: o.up !== false }) });
      o.gets.push({ pid, auth: q.headers()["authorization"] || "" });
      if (pid.startsWith("1111")) return r.fulfill({ contentType:"application/json", body: JSON.stringify({ ok:true, url: R + "/img/" + path.basename(img), mime:"image/jpeg" }) });
      return r.fulfill({ contentType:"application/json", body: JSON.stringify({ ok:false, missing:true, mime:"image/jpeg" }) });
    }
    let bd = {}; try{ bd = JSON.parse(q.postData() || "{}"); }catch(e){}
    o.slots.push({ bd, auth: q.headers()["authorization"] || "" });
    r.fulfill({ contentType:"application/json", body: JSON.stringify({ ok:true, url: R + "/fake-put/" + o.slots.length }) }); });
  /* PUT — o.hang 이면 첫 번째는 끝내 대답하지 않습니다(아이폰에서 본 것: 확인 요청만 가고 전송이 안 끝남) */
  await ctx.route("**/fake-put/**", r => { const n = r.request().url().split("/").pop(); o.puts[n] = (o.puts[n] || 0) + 1;
    if (o.hang && o.puts[n] === 1) return; r.fulfill({ status:200, body:"" }); });
  await ctx.route("**/api/quote**", r => r.fulfill({ contentType:"application/json", body: JSON.stringify({ ok:true, no:"SW-ZNF3-7W8E", state:"new", linked:false }) }));
  await ctx.route("**/api/me**", r => r.fulfill({ contentType:"application/json", body: JSON.stringify(Object.assign({ auth:true, signedIn:true, role:"customer", name:"" }, ME)) }));
  return ctx;
}

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  for (const W of [390, 1440]) {
    /* ①② 완료 화면 — 전송이 안 끝남 → 실패 → 같은 자리로 다시 */
    { const o = { hang:true }; const ctx = await ctxOf(b, W, o); const pg = await ctx.newPage();
      const errs = []; pg.on("pageerror", e => errs.push(String(e)));
      await pg.goto(R + "/quote?mode=close&sv=restore/shop-restore"); await pg.waitForTimeout(800);
      await pg.selectOption("#cq-gu", { index:1 }); await pg.fill("#cq-name", "검수"); await pg.fill("#cq-tel", "010-0000-2904");
      await pg.setInputFiles("#pp-cq-a", [img]); await pg.check("#cq-ag"); await pg.waitForTimeout(200);
      await pg.click("#cq-go"); await pg.waitForTimeout(700);
      const mid = await pg.evaluate(() => (document.querySelector(".qd .phup-st") || {}).textContent || "");
      ok(/올리는 중/.test(mid), W + " 전송 중에는 '올리는 중…'", mid);
      await pg.waitForTimeout(1800);
      const v = await pg.evaluate(() => ({ st:(document.querySelector(".qd .phup-st") || {}).textContent || "",
        sum:(document.querySelector(".qd [data-ph-sum]") || {}).textContent || "",
        retry: (() => { const x = document.querySelector(".qd [data-ph-retry]"); return !!x && !x.hidden; })(), no:/SW-ZNF3-7W8E/.test(document.body.innerText) }));
      ok(/저장 실패/.test(v.st) && v.retry && v.no, W + " 끝나지 않으면 시간 뒤 '저장 실패' + '다시 올리기' · 접수번호 그대로", v);
      if (!v.retry) { ok(false, W + " 다시 올리기 단추가 없어 뒤 검사를 건너뜁니다"); await ctx.close(); continue; }
      await pg.click(".qd [data-ph-retry]"); await pg.waitForTimeout(800);
      const w2 = await pg.evaluate(() => ({ st:(document.querySelector(".qd .phup-st") || {}).textContent || "", sum:(document.querySelector(".qd [data-ph-sum]") || {}).textContent || "" }));
      ok(o.slots.length === 1 && o.puts["1"] === 2, W + " 다시 올리기는 같은 자리(주소)로 — 자리 요청 1번 · 같은 주소 PUT 2번", { slots:o.slots.length, puts:o.puts });
      ok(/저장됨/.test(w2.st) && /사진 1장이 저장됐어요/.test(w2.sum), W + " 재시도 성공 뒤 '저장됨' · '사진 1장이 저장됐어요'", w2);
      ok(errs.length === 0, W + " 화면 오류 없음", errs);
      await ctx.close(); }
    /* ③④⑤ 내 기록 — 가져온 비로그인 접수의 사진 */
    { const o = { signed:true }; const ctx = await ctxOf(b, W, o); const pg = await ctx.newPage();
      const errs = []; pg.on("pageerror", e => errs.push(String(e)));
      await pg.goto(R + "/my?no=SW-ZNF3-7W8E"); await pg.waitForTimeout(1200);
      const v = await pg.evaluate(() => { const b2 = document.getElementById("myph"); if(!b2) return null;
        const li = [...b2.querySelectorAll("li[data-myph]")].map(x => ({ st:(x.querySelector("[data-myph-st]")||{}).textContent, re:!!x.querySelector(".myph-re input"), img:!!x.querySelector(".phup-th img") }));
        return { shown:!b2.hidden, li, add:!!b2.querySelector(".myph-add input[data-ph-in]") }; });
      ok(v && v.shown && v.li.length === 2, W + " 내 기록에 사진 구역 · 두 장", v);
      ok(v && v.li[0].st === "저장됨" && v.li[0].img && !v.li[0].re, W + " 파일이 있는 사진은 '저장됨' + 미리보기", v && v.li[0]);
      ok(v && /저장되지 않았어요/.test(v.li[1].st) && v.li[1].re, W + " 파일이 없는 자리는 '파일이 저장되지 않았어요' + '이 사진 다시 첨부'", v && v.li[1]);
      ok(o.gets.length === 2 && o.gets.every(g => g.auth === "Bearer TOK"), W + " 저장 여부는 토큰을 달고 서버(저장소)에 묻는다", o.gets);
      await pg.setInputFiles("#myph-re-22222222-2222-4222-8222-222222222222", [img]); await pg.waitForTimeout(900);
      const s1 = o.slots[0] || { bd:{} };
      ok(s1.bd.op === "mine" && s1.bd.photo === "22222222-2222-4222-8222-222222222222" && s1.bd.no === "SW-ZNF3-7W8E" && s1.auth === "Bearer TOK", W + " 다시 첨부는 그 사진 id 로 (op:mine · 토큰)", s1);
      ok(!("tel" in s1.bd), W + " 다시 첨부에 연락처를 화면이 안 보낸다 (서버가 안에서 읽음)", s1.bd);
      const st2 = await pg.evaluate(() => (document.querySelector('li[data-myph="22222222-2222-4222-8222-222222222222"] [data-myph-st]') || {}).textContent);
      ok(st2 === "저장됨", W + " 다시 첨부 성공 뒤 '저장됨'", st2);
      /* 새 사진 추가 */
      await pg.setInputFiles("#pp-myph-a", [img]); await pg.waitForTimeout(400);
      await pg.click("[data-myph-save]"); await pg.waitForTimeout(900);
      const s2 = o.slots[1] || { bd:{} };
      ok(s2.bd.op === "mine" && !s2.bd.photo && s2.bd.no === "SW-ZNF3-7W8E", W + " 새 사진 추가도 같은 문(op:mine · 새 자리)", s2.bd);
      const st3 = await pg.evaluate(() => (document.querySelector("#myph .myph-add .phup-st") || {}).textContent);
      ok(/저장됨/.test(st3 || ""), W + " 새 사진도 '저장됨'", st3);
      ok((await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, W + " 가로 넘침 없음");
      ok(errs.length === 0, W + " 화면 오류 없음", errs);
      await ctx.close(); }
    /* 버킷이 꺼져 있으면 구역째 안 그림 */
    { const o = { signed:true, up:false }; const ctx = await ctxOf(b, W, o); const pg = await ctx.newPage();
      await pg.goto(R + "/my?no=SW-ZNF3-7W8E"); await pg.waitForTimeout(1000);
      const h = await pg.evaluate(() => { const x = document.getElementById("myph"); return !x || x.hidden; });
      ok(h && o.gets.length === 0, W + " 버킷이 꺼져 있으면 사진 구역을 안 그리고 묻지도 않는다", { h, gets:o.gets.length });
      await ctx.close(); }
  }
  await b.close(); srv.close();
  console.log(res.join("\n"));
  const bad = res.filter(x => x.startsWith("❌")).length;
  console.log("\n" + (res.length - bad) + " / " + res.length + (bad ? "  ❌ " + bad : "  ✅"));
  process.exit(bad ? 1 : 0);
})();
