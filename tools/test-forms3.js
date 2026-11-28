const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const http = require("http"), fs = require("fs"), path = require("path");
/* 2026-11-27 — 간단한 작성 화면 셋 (견적 · 폐업 견적 · 집기 내놓기 · 상품 올리기) · 360 / 390 / 1440
   사진 · 서버 응답은 가짜로 받습니다 (실제 저장은 시험 Preview 에서 따로 봅니다). */
const ROOTDIR = process.cwd(), OUT = process.env.SHOT_DIR || "";
const MIME = {".html":"text/html;charset=utf-8",".js":"text/javascript;charset=utf-8",".css":"text/css;charset=utf-8",".json":"application/json",".svg":"image/svg+xml",".jpg":"image/jpeg",".png":"image/png",".webp":"image/webp"};
const PORT = 8247, R = "http://localhost:" + PORT;
const srv = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split("?")[0]); let f = path.join(ROOTDIR, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
  if (!fs.existsSync(f)) f = path.join(ROOTDIR, "index.html");
  s.setHeader("content-type", MIME[path.extname(f)] || "application/octet-stream"); s.end(fs.readFileSync(f)); });
const res = []; const ok = (c, m, x) => { res.push((c ? "✅ " : "❌ ") + m + (c ? "" : "  " + JSON.stringify(x || ""))); };
(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  for (const W of [360, 390, 1440]) {
    const ctx = await b.newContext({ viewport: { width: W, height: 900 } });
    await ctx.addInitScript(() => { let w; Object.defineProperty(window, "WOW_BIZ", { configurable:true, get(){ return w; }, set(v){ v.sosReady = true; w = v; } });
      localStorage.setItem("am.auth.v1", JSON.stringify({ access_token:"TOK", refresh_token:"R", exp: Date.now() + 3e6 })); });
    const sent = []; const errs = [];
    await ctx.route("**/api/session**", r => r.fulfill({ contentType:"application/json", body: JSON.stringify({ auth:true, signedIn:true, role:"customer", intake:{ quote:true, close:true, sell:true, join:true } }) }));
    await ctx.route("**/api/upload**", r => r.request().method() === "GET" ? r.fulfill({ contentType:"application/json", body:'{"up":true}' }) : r.fulfill({ contentType:"application/json", body:'{"ok":true,"url":"' + R + '/fake-put"}' }));
    await ctx.route("**/fake-put**", r => r.fulfill({ status:200, body:"" }));
    await ctx.route("**/api/me**", r => r.fulfill({ contentType:"application/json", body:'{"auth":true,"signedIn":true,"role":"customer","requests":[],"quotes":[]}' }));
    await ctx.route("**/api/product**", r => { const m = r.request().method(); if (m === "GET") return r.fulfill({ contentType:"application/json", body:'{"ready":true,"signedIn":true,"products":[]}' });
      const j = JSON.parse(r.request().postData() || "{}"); sent.push({ u:"product", j });
      if (j.op === "save") return r.fulfill({ contentType:"application/json", body:'{"ok":true,"id":"11111111-1111-1111-1111-111111111111","state":"review"}' });
      return r.fulfill({ contentType:"application/json", body:'{"ok":true,"url":"' + R + '/fake-put"}' }); });
    await ctx.route("**/api/quote**", r => { sent.push({ u:"quote", j: JSON.parse(r.request().postData() || "{}") }); r.fulfill({ contentType:"application/json", body:'{"ok":true,"no":"SW-TEST-0001"}' }); });
    const pg = await ctx.newPage(); pg.on("pageerror", e => errs.push(String(e)));
    pg.on("dialog", d => d.accept());
    const img = path.join(ROOTDIR, "img", fs.readdirSync(path.join(ROOTDIR, "img")).filter(x => /\.jpg$/.test(x))[0]);
    async function check(url, tag){
      await pg.goto(R + url); await pg.waitForTimeout(700);
      const ov = await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      ok(ov <= 0, W + " " + tag + " 가로 넘침 없음", ov);
      const small = await pg.evaluate(() => [...document.querySelectorAll("#view form button, #view form a.btn, #view form label.cq-k, #view form summary, #view form label.phup-b")]
        .filter(e => e.offsetParent && e.getBoundingClientRect().height < 40).map(e => e.textContent.trim().slice(0,20)));
      ok(!small.length, W + " " + tag + " 누름 40px 이상", small);
      const ph = await pg.evaluate(() => { const w = document.querySelector("#view .phup-form"); return !!(w && !w.hidden && w.querySelector("label.phup-b") && w.querySelector("label.phup-b2")); });
      ok(ph, W + " " + tag + " 앨범 · 파일 버튼이 처음부터 보임");
      const urlIn = await pg.evaluate(() => !!document.querySelector("#q-img,#sl-img"));
      ok(!urlIn, W + " " + tag + " 사진 링크 칸 없음");
      const subs = await pg.evaluate(() => [...document.querySelectorAll("#view form button[type=submit]")].length);
      ok(subs === 1, W + " " + tag + " 제출 단추 하나", subs);
      if (OUT) await pg.screenshot({ path: OUT + "/" + tag + "-" + W + ".png", fullPage:true });
    }
    // 1 견적 (일반 · 바구니 없음)
    await check("/quote", "quote");
    await pg.check("#q-s-interior"); await pg.check("#q-s-demolish");
    await pg.selectOption("#q-reg", { index:1 }); await pg.fill("#q-name", "시험"); await pg.fill("#q-tel", "010-1234-5678");
    await pg.setInputFiles("#pp-q-a", [img, img]); await pg.waitForTimeout(300);
    await pg.click("#pp-q-x0, [data-ph-x]").catch(()=>{});
    const cnt = await pg.textContent("#view [data-ph-cnt]");
    ok(/1\/5/.test(cnt), W + " quote 사진 2장 → 하나 빼면 1/5", cnt);
    await pg.check("#q-ag"); sent.length = 0;
    await pg.click("#q-f button[type=submit]"); await pg.waitForTimeout(800);
    const qb = (sent.find(x => x.u === "quote") || {}).j || {};
    ok(qb.items && qb.items.length === 2 && qb.region && qb.name === "시험", W + " quote 보낸 몸통 (서비스 2 · 지역 · 이름)", qb);
    ok(/SW-TEST-0001/.test(await pg.textContent("#q-fail")), W + " quote 접수번호 표시");
    ok(/저장됨/.test(await pg.textContent("#q-fail")), W + " quote 사진 저장됨 표시");
    ok(await pg.evaluate(() => { const f = document.getElementById("q-f"), b = document.getElementById("q-fail");
      return f.hidden && !document.getElementById("q-ag").offsetParent && b.nextElementSibling === f && b.offsetParent &&
        b.textContent.indexOf("SW-TEST-0001") < b.textContent.indexOf("저장됨"); }),
      W + " quote 접수 뒤 폼 · 동의 칸은 접히고 접수번호 → 사진 결과가 먼저");
    await pg.click(".qd-new"); await pg.waitForTimeout(500);
    ok(await pg.evaluate(() => !document.getElementById("q-f").hidden && !document.querySelector(".qd")), W + " quote '새로 작성하기' 로 새 폼 (이전 접수 결과 없음)");
    // 2 폐업
    await check("/quote?mode=close", "close");
    await pg.check("#cq-s-demolish-full"); await pg.check("#cq-s-asset");
    await pg.selectOption("#cq-gu", { index:1 }); await pg.fill("#cq-name", "시험"); await pg.fill("#cq-tel", "010-1234-5678"); await pg.check("#cq-ag"); sent.length = 0;
    await pg.click("#cq-go"); await pg.waitForTimeout(800);
    const cb = (sent.find(x => x.u === "quote") || {}).j || {};
    ok(cb.form === "close" && cb.items.map(i=>i.id).join() === "demolish/full,asset", W + " close 몸통", cb);
    await check("/quote?mode=close&sv=demolish/full,restore/shop-restore", "close-pre");
    ok(await pg.evaluate(() => document.querySelectorAll(".cq-got-l li").length === 2 && document.getElementById("cq-svc").hidden), W + " close 앞에서 고른 것은 다시 안 물음");
    // unsure only
    await pg.click(".cq-got-x"); await pg.uncheck("#cq-s-demolish-full"); await pg.uncheck("#cq-s-restore-shop-restore"); await pg.check("#cq-s-un");
    await pg.selectOption("#cq-gu", { index:1 }); await pg.fill("#cq-name", "시험"); await pg.fill("#cq-tel", "010-1234-5678"); await pg.check("#cq-ag"); sent.length = 0;
    await pg.click("#cq-go"); await pg.waitForTimeout(600);
    const ub = (sent.find(x => x.u === "quote") || {}).j || {};
    ok(ub.unsure === true && ub.items.length === 0, W + " close '잘 모르겠어요' 만으로 보냄", ub);
    // 3 집기
    await check("/sell?t=asset", "asset");
    await pg.setInputFiles("#pp-sl-a", [img]); await pg.fill("#sl-item", "4도어 냉장고"); await pg.selectOption("#sl-state", { index:2 });
    await pg.fill("#sl-price", "80"); await pg.selectOption("#sl-reg", { index:1 }); await pg.fill("#sl-name", "시험"); await pg.fill("#sl-tel", "010-1234-5678"); await pg.check("#sl-ag"); sent.length = 0;
    await pg.click("#sl-f button[type=submit]"); await pg.waitForTimeout(800);
    const ab = (sent.find(x => x.u === "quote") || {}).j || {};
    ok(ab.form === "sell" && ab.cat === "asset" && ab.detail["품목"] === "4도어 냉장고" && ab.q, W + " asset 몸통", ab);
    ok(/검수 대기/.test(await pg.textContent("#sl-fail")), W + " asset 완료 화면이 검수 대기라고 말함");
    ok(await pg.evaluate(() => document.getElementById("sl-f").hidden && document.getElementById("sl-fail").offsetParent !== null), W + " asset 접수 뒤 폼이 접히고 결과가 보임");
    // 4 상품
    await check("/my?v=product", "product");
    ok(await pg.evaluate(() => !document.getElementById("pd-fs").disabled), W + " product 로그인 · 준비면 칸이 열림");
    await pg.setInputFiles("#pp-pd-a", [img, img]); await pg.fill("#pd-name", "업소용 냉장고"); await pg.selectOption("#pd-cat", "kitchen"); await pg.fill("#pd-price", "300000"); sent.length = 0;
    await pg.click("#pd-go"); await pg.waitForTimeout(900);
    const sv = sent.filter(x => x.u === "product");
    ok(sv[0] && sv[0].j.op === "save" && !sv[0].j.p.owner && sv.filter(x => x.j.op === "slot").length === 2, W + " product 저장 + 사진 2장 자리", sv.map(x=>x.j.op));
    ok(/검수 대기/.test(await pg.textContent("#pd-fail")), W + " product 상태 검수 대기");
    sent.length = 0; await pg.click("#pd-go"); await pg.waitForTimeout(700);
    const sv2 = sent.filter(x => x.u === "product");
    ok(sv2[0] && sv2[0].j.p.id && sv2.filter(x => x.j.op === "slot").length === 0, W + " product 다시 누르면 새 상품 · 사진 중복 없음", sv2.map(x=>x.j));
    ok(!errs.length, W + " JS 에러 없음", errs);
    await ctx.close();
  }
  await b.close(); srv.close();
  console.log(res.join("\n")); const bad = res.filter(x => x[0] === "❌").length; console.log((bad ? "❌ " : "✅ ") + "통과 " + (res.length - bad) + " · 실패 " + bad); process.exit(bad ? 1 : 0);
})();
