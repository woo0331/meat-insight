/* 2026-11-28 — 로그인이 풀린 채 보내기 (SW-F65J-ZKVY 에서 찾은 자리)
   토큰 갱신이 실패했는데 화면은 '내 계정' 그대로이고 신청이 **조용히 비회원 접수**가 되던 것.
   ⚠️ 서버는 가짜입니다 — /api/auth 갱신을 400 으로 돌려 실패를 재현합니다.
   보는 것 — ① 작성 중 만료 · 화면을 열 때 만료 둘 다 **보내지 않고** 묻는다
            ② 적은 것이 그대로 남는다 · 헤더가 로그인 상태로 남지 않는다
            ③ '로그인 없이 보내기' 는 한 번만 · 토큰 없이 간다
            ④ '다시 로그인하고 보내기' → 돌아오면 적은 것이 되살아나고 토큰을 달고 간다 · 맡긴 것은 지운다
            ⑤ 처음부터 로그인 안 한 분 · 토큰이 살아 있는 분은 예전과 같다 (묻지 않는다) */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const ROOTDIR = process.cwd();
const MIME = {".html":"text/html;charset=utf-8",".js":"text/javascript;charset=utf-8",".css":"text/css;charset=utf-8",".json":"application/json",".svg":"image/svg+xml",".jpg":"image/jpeg",".png":"image/png",".webp":"image/webp"};
const PORT = 8262, R = "http://localhost:" + PORT;
const srv = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split("?")[0]); let f = path.join(ROOTDIR, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
  if (!fs.existsSync(f)) f = path.join(ROOTDIR, "index.html");
  s.setHeader("content-type", MIME[path.extname(f)] || "application/octet-stream"); s.end(fs.readFileSync(f)); });
const res = []; const ok = (c, m, x) => { res.push((c ? "✅ " : "❌ ") + m + (c ? "" : "  " + JSON.stringify(x === undefined ? "" : x).slice(0, 300))); };
const CLOSE = "/quote?mode=close&sv=demolish/full";

/* tok: "valid" | "expired" | "none" */
async function ctxOf(b, W, tok, o){
  const ctx = await b.newContext({ viewport:{ width:W, height:800 } });
  await ctx.addInitScript((t) => { let w; Object.defineProperty(window, "WOW_BIZ", { configurable:true, get(){ return w; }, set(v){ v.sosReady = true; w = v; } });
    if (t !== "none" && !sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded","1");
      localStorage.setItem("am.auth.v1", JSON.stringify({ access_token:"TOK", refresh_token:"R", at: t === "expired" ? Date.now() - 1000 : Date.now() + 3e6 })); } }, tok);
  o.posts = []; o.refresh = 0;
  await ctx.route("**/api/session**", r => { const a = r.request().headers()["authorization"] || "";
    r.fulfill({ contentType:"application/json", body: JSON.stringify({ auth:true, kakao:true, signedIn: /^Bearer TOK2?$/.test(a), role:"customer",
      intake:{ quote:true, close:true, sell:true, join:true }, conf:{ url:"x", anon:"y" } }) }); });
  await ctx.route("**/api/auth**", r => { let b2 = {}; try{ b2 = JSON.parse(r.request().postData() || "{}"); }catch(e){}
    if (b2.op === "oauth") return r.fulfill({ contentType:"application/json", body: JSON.stringify({ url: R + "/fake-kakao?to=" + encodeURIComponent(b2.path) }) });
    o.refresh++; r.fulfill({ status:400, contentType:"application/json", body:'{"error":"x"}' }); });
  /* 카카오에 다녀온 척 — 새 토큰을 남기고 돌아갈 자리로 */
  await ctx.route("**/fake-kakao**", r => { const to = new URL(r.request().url()).searchParams.get("to");
    r.fulfill({ contentType:"text/html", body:'<script>localStorage.setItem("am.auth.v1",JSON.stringify({access_token:"TOK2",refresh_token:"R2",at:Date.now()+3e6}));location.replace(' + JSON.stringify(to) + ')</script>' }); });
  await ctx.route("**/api/upload**", r => r.fulfill({ contentType:"application/json", body:'{"up":false}' }));
  await ctx.route("**/api/me**", r => r.fulfill({ contentType:"application/json", body:'{"auth":true,"signedIn":false}' }));
  await ctx.route("**/api/quote**", r => { o.posts.push(r.request().headers()["authorization"] || "");
    r.fulfill({ contentType:"application/json", body: JSON.stringify({ ok:true, no:"SW-TEST-0001", state:"new", linked: !!r.request().headers()["authorization"] }) }); });
  return ctx;
}
async function fillClose(pg){
  await pg.selectOption("#cq-gu", { index:1 }); await pg.fill("#cq-name", "검수"); await pg.fill("#cq-tel", "010-0000-1128");
  await pg.evaluate(() => document.querySelectorAll("#cq-f details").forEach(d => d.open = true));
  await pg.fill("#cq-q", "메모 보존 확인"); await pg.check("#cq-ag");
}
const look = pg => pg.evaluate(() => ({
  ask: !!document.querySelector(".q-relogin"), done: !!document.querySelector(".qd"),
  name: (document.getElementById("cq-name") || {}).value, tel: (document.getElementById("cq-tel") || {}).value,
  q: (document.getElementById("cq-q") || {}).value, gu: (document.getElementById("cq-gu") || {}).value,
  ag: !!(document.getElementById("cq-ag") || {}).checked,
  hd: (document.getElementById("hdU") || { getAttribute(){ return ""; } }).getAttribute("data-auth"),
  kept: sessionStorage.getItem("am.relogin.v1"), errTxt: (document.getElementById("cq-fail") || {}).innerText || "" }));

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  for (const W of [360, 1440]) {
    for (const when of ["mid", "load"]) {
      const o = {}; const ctx = await ctxOf(b, W, when === "load" ? "expired" : "valid", o); const pg = await ctx.newPage();
      const errs = []; pg.on("pageerror", e => errs.push(String(e)));
      await pg.goto(R + CLOSE); await pg.waitForTimeout(800);
      if (when === "mid") {
        ok((await look(pg)).hd === "in", W + " " + when + " 작성 시작 때는 로그인 상태");
        await pg.evaluate(() => { const t = JSON.parse(localStorage.getItem("am.auth.v1")); t.at = Date.now() - 1000; localStorage.setItem("am.auth.v1", JSON.stringify(t)); });
      }
      await fillClose(pg);
      await pg.click("#cq-go"); await pg.waitForTimeout(700);
      let v = await look(pg);
      ok(v.ask && !v.done && o.posts.length === 0, W + " " + when + " 로그인이 풀렸으면 보내지 않고 묻는다", { v, posts:o.posts });
      ok(v.name === "검수" && v.tel === "010-0000-1128" && v.q === "메모 보존 확인" && v.ag, W + " " + when + " 적은 내용이 그대로 남는다", v);
      ok(v.hd !== "in", W + " " + when + " 헤더가 '내 계정' 으로 남지 않는다", v.hd);
      ok(/내 기록에 자동으로 연결되지 않습니다/.test(v.errTxt) && /사진은 다시 골라/.test(v.errTxt), W + " " + when + " 까닭과 사진 안내를 그 자리에서 말한다");
      const btnOk = await pg.evaluate(() => { const b2 = document.getElementById("cq-go"); return b2 && !b2.disabled; });
      ok(btnOk, W + " " + when + " 보내기 단추가 '보내는 중' 으로 묶이지 않는다");
      if (!v.ask) { ok(false, W + " " + when + " 묻는 상자가 없어 뒤 검사를 건너뜁니다"); await ctx.close(); continue; }
      if (when === "mid") {
        /* ③ 로그인 없이 보내기 — 한 번만 · 토큰 없이 */
        await pg.click("[data-rl-anon]"); await pg.click("[data-rl-anon]").catch(()=>{}); await pg.waitForTimeout(800);
        v = await look(pg);
        ok(o.posts.length === 1 && o.posts[0] === "" && v.done, W + " 로그인 없이 보내기 → 한 번 · 토큰 없이 · 완료 화면", { posts:o.posts, done:v.done });
      } else {
        /* ④ 다시 로그인하고 보내기 */
        await pg.click("[data-rl-in]"); await pg.waitForURL(u => /\/quote\?mode=close/.test(String(u)) && !/fake-kakao/.test(String(u))); await pg.waitForTimeout(900);
        v = await look(pg);
        ok(v.name === "검수" && v.tel === "010-0000-1128" && v.q === "메모 보존 확인" && v.gu && v.ag, W + " 다시 로그인하고 돌아오면 적은 내용이 되살아난다", v);
        ok(v.kept === null, W + " 맡겨 둔 작성 내용은 되살린 뒤 지운다", v.kept);
        await pg.click("#cq-go"); await pg.waitForTimeout(900);
        v = await look(pg);
        ok(!v.ask && v.done && o.posts.length === 1 && o.posts[0] === "Bearer TOK2", W + " 다시 로그인한 뒤 보내기 → 토큰을 달고 한 번", { posts:o.posts, ask:v.ask, done:v.done });
        const lk = await pg.evaluate(() => !!document.querySelector('.qd a[href^="/my?no="]'));
        ok(lk, W + " 완료 화면에 '내 신청 보기'");
      }
      ok(errs.length === 0, W + " " + when + " 화면 오류 없음", errs);
      await ctx.close();
    }
    /* ⑤ 예전과 같은 둘 */
    for (const tok of ["none", "valid"]) {
      const o = {}; const ctx = await ctxOf(b, W, tok, o); const pg = await ctx.newPage();
      await pg.goto(R + CLOSE); await pg.waitForTimeout(800); await fillClose(pg);
      await pg.click("#cq-go"); await pg.waitForTimeout(800);
      const v = await look(pg);
      ok(!v.ask && v.done && o.posts.length === 1 && o.posts[0] === (tok === "valid" ? "Bearer TOK" : ""),
        W + (tok === "none" ? " 처음부터 로그인 안 한 분은 묻지 않고 그대로 보낸다" : " 토큰이 살아 있으면 묻지 않고 토큰을 달고 보낸다"), { posts:o.posts, ask:v.ask });
      ok(o.refresh === 0, W + " " + tok + " 갱신을 괜히 부르지 않는다", o.refresh);
      await ctx.close();
    }
    /* 일반 견적(/quote)도 같은 문을 지납니다 */
    { const o = {}; const ctx = await ctxOf(b, W, "valid", o); const pg = await ctx.newPage();
      await pg.goto(R + "/quote"); await pg.waitForTimeout(800);
      await pg.evaluate(() => { const t = JSON.parse(localStorage.getItem("am.auth.v1")); t.at = Date.now() - 1000; localStorage.setItem("am.auth.v1", JSON.stringify(t)); });
      await pg.check("#q-s-demolish"); await pg.selectOption("#q-reg", { index:1 }); await pg.fill("#q-name", "검수"); await pg.fill("#q-tel", "010-0000-1128"); await pg.check("#q-ag");
      await pg.click("#q-f button[type=submit]"); await pg.waitForTimeout(800);
      const v = await pg.evaluate(() => ({ ask: !!document.querySelector(".q-relogin"), name: document.getElementById("q-name").value }));
      ok(v.ask && o.posts.length === 0 && v.name === "검수", W + " 일반 견적도 로그인이 풀렸으면 보내지 않고 묻는다", { v, posts:o.posts });
      await ctx.close(); }
  }
  await b.close(); srv.close();
  console.log(res.join("\n"));
  const bad = res.filter(x => x.startsWith("❌")).length;
  console.log("\n" + (res.length - bad) + " / " + res.length + (bad ? "  ❌ " + bad : "  ✅"));
  process.exit(bad ? 1 : 0);
})();
