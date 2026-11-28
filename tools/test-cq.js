/* 2026-11-28 — 견적 신청 완료 → 내 신청 보기 → 견적 보기 / 비교 (360 · 390 · 1440)
   ⚠️ 서버 응답은 가짜로 받되, /api/me 는 **시험 DB 를 고객 권한으로 읽은 값**(tools/fixtures-cq.json)입니다.
   캡처는 SHOT_DIR 를 주면 남깁니다. */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const ROOTDIR = process.cwd(), OUT = process.env.SHOT_DIR || "";
const FX = JSON.parse(fs.readFileSync(path.join(ROOTDIR, "tools/fixtures-cq.json"), "utf8"));
const MIME = {".html":"text/html;charset=utf-8",".js":"text/javascript;charset=utf-8",".css":"text/css;charset=utf-8",".json":"application/json",".svg":"image/svg+xml",".jpg":"image/jpeg",".png":"image/png",".webp":"image/webp"};
const PORT = 8248, R = "http://localhost:" + PORT;
const srv = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split("?")[0]); let f = path.join(ROOTDIR, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
  if (!fs.existsSync(f)) f = path.join(ROOTDIR, "index.html");
  s.setHeader("content-type", MIME[path.extname(f)] || "application/octet-stream"); s.end(fs.readFileSync(f)); });
const res = []; const ok = (c, m, x) => { res.push((c ? "✅ " : "❌ ") + m + (c ? "" : "  " + JSON.stringify(x === undefined ? "" : x).slice(0, 300))); };
const img = path.join(ROOTDIR, "img", fs.readdirSync(path.join(ROOTDIR, "img")).filter(x => /\.jpg$/.test(x))[0]);

async function ctxOf(b, W, o){
  const ctx = await b.newContext({ viewport:{ width:W, height:800 } });
  await ctx.addInitScript((signed) => { let w; Object.defineProperty(window, "WOW_BIZ", { configurable:true, get(){ return w; }, set(v){ v.sosReady = true; w = v; } });
    if(signed) localStorage.setItem("am.auth.v1", JSON.stringify({ access_token:"TOK", refresh_token:"R", exp: Date.now() + 3e6 })); }, !!o.signed);
  await ctx.route("**/api/session**", r => r.fulfill({ contentType:"application/json", body: JSON.stringify({ auth:o.authOn !== false, signedIn:!!o.signed, role:"customer", intake:{ quote:true, close:true, sell:true, join:true } }) }));
  await ctx.route("**/api/upload**", r => {
    if (r.request().method() === "GET") return r.fulfill({ contentType:"application/json", body:'{"up":true}' });
    o.slots = (o.slots || 0) + 1;
    r.fulfill({ contentType:"application/json", body: JSON.stringify({ ok:true, url: R + "/fake-put/" + o.slots }) }); });
  o.puts = 0;
  await ctx.route("**/fake-put/**", r => { o.puts++; const n = +r.request().url().split("/").pop();
    if (o.failSlot && n === o.failSlot) return r.fulfill({ status:500, body:"" }); r.fulfill({ status:200, body:"" }); });
  o.posts = 0;
  await ctx.route("**/api/quote**", r => { o.posts++; setTimeout(() => r.fulfill({ contentType:"application/json",
    body: JSON.stringify({ ok:true, no:"SW-QA28-0002", state:"new", linked:!!o.signed }) }), o.slow || 0); });
  await ctx.route("**/api/me**", r => r.fulfill({ contentType:"application/json",
    body: JSON.stringify(o.me === false ? { auth:true, signedIn:false } : Object.assign({ auth:true, signedIn:true, role:"customer" }, FX)) }));
  return ctx;
}
async function noOverflow(pg){ return pg.evaluate(() => document.documentElement.scrollWidth - innerWidth); }
/* 하단 메뉴가 마지막 단추를 가리는가 — 맨 아래까지 내려서 겹침을 잽니다 */
async function navCovers(pg, sel){
  return pg.evaluate((s) => { const b = document.querySelector(s), n = document.querySelector(".mnav");
    if(!b || !n || !n.offsetParent && getComputedStyle(n).display === "none") return false;
    b.scrollIntoView({ block:"center" }); const r = b.getBoundingClientRect(), m = n.getBoundingClientRect();
    return m.height > 0 && getComputedStyle(n).display !== "none" && r.bottom > m.top && r.top < m.bottom; }, sel);
}

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  for (const W of [360, 390, 1440]) {
    for (const kind of ["quote", "close"]) {
      // ① 로그인 · 사진 3장 중 1장 실패 · 연속 클릭 · 느린 응답
      const o = { signed:true, failSlot:2, slow:600 }; const ctx = await ctxOf(b, W, o); const pg = await ctx.newPage();
      const errs = []; pg.on("pageerror", e => errs.push(String(e)));
      const url = kind === "close" ? "/quote?mode=close&sv=demolish/full,restore/shop-restore" : "/quote";
      await pg.goto(R + url); await pg.waitForTimeout(700);
      if (kind === "quote") { await pg.check("#q-s-demolish"); await pg.selectOption("#q-reg", { index:1 }); await pg.fill("#q-name", "검수"); await pg.fill("#q-tel", "010-0000-1128");
        await pg.setInputFiles("#pp-q-a", [img, img, img]); await pg.check("#q-ag"); }
      else { await pg.selectOption("#cq-gu", { index:1 }); await pg.fill("#cq-name", "검수"); await pg.fill("#cq-tel", "010-0000-1128");
        await pg.setInputFiles("#pp-cq-a", [img, img, img]); await pg.check("#cq-ag"); }
      await pg.waitForTimeout(300);
      const btn = kind === "close" ? "#cq-go" : "#q-f button[type=submit]";
      await pg.click(btn); await pg.click(btn, { force:true }).catch(()=>{}); await pg.click(btn, { force:true }).catch(()=>{});
      await pg.waitForTimeout(1800);
      ok(o.posts === 1, W + " " + kind + " 연속 클릭 · 느린 응답에도 접수 요청 1번", o.posts);
      const v = await pg.evaluate(() => { const q = document.querySelector(".qd"); if(!q) return null;
        const t = q.innerText; const at = s => t.indexOf(s);
        return { focus: document.activeElement && document.activeElement.id, formHidden: !!document.querySelector("form[hidden]"),
          agreeVis: [...document.querySelectorAll(".agree")].some(a => a.offsetParent),
          order: [at("견적 신청이 접수됐습니다"), at("SW-QA28-0002"), at("현재 상태"), at("사진 2장이 저장됐어요. 1장은 다시 올릴 수 있어요"), at("업체가 정해지면"), at("내 신청 보기"), at("새로 작성하기")],
          href: (q.querySelector('a[href^="/my?no="]') || {}).getAttribute ? q.querySelector('a[href^="/my?no="]').getAttribute("href") : "",
          st: (q.querySelector(".qd-st em") || {}).textContent, top: q.getBoundingClientRect().top,
          bad: /업체가 확인 중|시간 안에|곳에서|최저가/.test(t) }; });
      ok(v && v.focus === "qd-h", W + " " + kind + " 완료 제목에 초점", v && v.focus);
      ok(v && v.formHidden && !v.agreeVis, W + " " + kind + " 작성 폼 · 동의 칸이 접힘", v);
      ok(v && v.order.every((x, i, a) => x >= 0 && (i === 0 || x > a[i - 1])), W + " " + kind + " 순서: 제목→번호→상태→사진→다음 단계→내 신청 보기→새로 작성", v && v.order);
      ok(v && v.st === "접수됨" && !v.bad, W + " " + kind + " 상태는 서버 값(new→접수됨) · 약속 문구 없음", v);
      ok(v && v.top >= 0 && v.top < 800, W + " " + kind + " 스크롤 없이 완료 영역이 보임", v && v.top);
      ok(v && /SW-QA28-0002/.test(v.href), W + " " + kind + " 내 신청 보기 → /my?no=", v && v.href);
      ok(o.puts === 3, W + " " + kind + " 사진 3장 올림 (1장 실패)", o.puts);
      ok(!(await navCovers(pg, ".qd-new")), W + " " + kind + " 하단 메뉴가 마지막 단추를 안 가림");
      ok((await noOverflow(pg)) <= 0, W + " " + kind + " 가로 넘침 없음");
      if (OUT && W === 390 && kind === "close") { await pg.evaluate(() => { window.scrollTo(0, 0); document.querySelector(".q-done").scrollIntoView(); }); await pg.waitForTimeout(2600); await pg.screenshot({ path: OUT + "/1-접수완료-390.png" }); }
      ok(await pg.evaluate(() => { const b = document.querySelector(".qd [data-ph-retry]"); return !!b && b.offsetParent !== null; }), W + " " + kind + " 실패한 사진이 있을 때만 '다시 올리기' 가 보임");
      // 실패한 1장만 다시
      o.failSlot = 0; const before = o.puts;
      await pg.click(".qd [data-ph-retry]"); await pg.waitForTimeout(800);
      ok(o.puts - before === 1, W + " " + kind + " 다시 올리기는 실패한 1장만", o.puts - before);
      ok(/사진 3장이 저장됐어요/.test(await pg.textContent(".qd")), W + " " + kind + " 다시 올린 뒤 '사진 3장이 저장됐어요'");
      ok(await pg.evaluate(() => { const b = document.querySelector(".qd [data-ph-retry]"); return !b || b.offsetParent === null; }), W + " " + kind + " 다 저장되면 '다시 올리기' 가 사라짐");
      // 새로 작성하기 — 이전 번호 · 사진이 안 남음
      await pg.click(".qd-new"); await pg.waitForTimeout(700);
      ok(await pg.evaluate(() => !document.querySelector(".qd") && !/SW-QA28-0002/.test(document.body.innerText) && !document.querySelector("form[hidden]") && document.querySelector("[data-ph-cnt]") && /^0\//.test(document.querySelector("[data-ph-cnt]").textContent)),
        W + " " + kind + " 새로 작성하기: 이전 번호 · 사진 결과 없음");
      // 내 신청 보기
      await pg.goto(R + "/my?no=SW-QA28-0002"); await pg.waitForTimeout(900);
      const d = await pg.evaluate(() => { const s = document.getElementById("myrd"); if(!s) return null; const t = s.innerText;
        const cards = [...s.querySelectorAll(".myqt-c")].map(c => c.innerText);
        const rows = [...(s.querySelector(".myqc") || document).querySelectorAll(":scope > div > dt")].map(x => x.textContent);
        return { top:s.getBoundingClientRect().top, st:(s.querySelector(".myrd-l em")||{}).textContent, t, cards, rows,
          go:(s.querySelector(".myrd-go a")||{}).textContent, contact:/010-0000-1128|검수 시험/.test(document.body.innerText) }; });
      ok(d && d.st === "견적 도착", W + " " + kind + " 상세: 견적 2건 → 견적 도착", d && d.st);
      ok(d && /군포시/.test(d.t) && /전체 철거/.test(d.t) && /2026\.\s?11\.\s?28/.test(d.t), W + " " + kind + " 상세: 서비스 · 지역 · 접수일", d && d.t.slice(0, 200));
      ok(d && /견적 비교 2건/.test(d.go || ""), W + " " + kind + " 주요 단추: 견적 비교 2건", d && d.go);
      ok(d && d.rows.join(",") === "총액,포함 작업,제외 · 추가 비용,가능 일정,실측", W + " " + kind + " 카드 순서 (업체명 → 총액 → 포함 → 제외 → 일정 → 실측)", d && d.rows);
      ok(d && d.cards.length === 2 && /이 견적에 없음: .*원상복구/.test(d.cards[0]) && !/이 견적에 없음/.test(d.cards[1]), W + " " + kind + " 적용 범위가 다름을 표시", d && d.cards.map(c => c.slice(0, 160)));
      ok(d && /4,800,000원 → 5,300,000원/.test(d.t) && /현장 실측/.test(d.t), W + " " + kind + " 금액 변경 이력 (이전 금액 · 사유 · 날짜)");
      ok(d && /집기 매입[\s\S]*1,200,000원/.test(d.cards[1]) && /부가세 포함/.test(d.cards[1]) && /부가세 별도/.test(d.cards[0]), W + " " + kind + " 집기 매입 따로 · 부가세 저장값 그대로");
      ok(d && !d.contact, W + " " + kind + " 상세에 이름 · 연락처 없음");
      ok(d && d.top >= -5 && d.top < 400, W + " " + kind + " 상세가 맨 위에 바로 보임", d && d.top);
      ok((await noOverflow(pg)) <= 0, W + " " + kind + " /my 가로 넘침 없음");
      if (OUT && W === 390 && kind === "close") {
        await pg.evaluate(() => window.scrollTo(0, 0)); await pg.evaluate(() => document.getElementById("myrd").scrollIntoView());
        await pg.screenshot({ path: OUT + "/2-내신청상세-390.png" });
        await pg.evaluate(() => document.querySelector(".myqt").scrollIntoView()); await pg.screenshot({ path: OUT + "/3-견적비교-390.png", fullPage:false });
      }
      // 다른 상태들
      for (const [no, want, goWant] of [["SW-QA28-0001","접수됨",""],["SW-QA28-0003","업체 답변 대기",""],["SW-QA28-0004","업체 답변 대기",""],["SW-QA28-0005","계약 완료","견적 보기"]]) {
        await pg.goto(R + "/my?no=" + no); await pg.waitForTimeout(700);
        const x = await pg.evaluate(() => { const s = document.getElementById("myrd"); return s ? { st:(s.querySelector(".myrd-l em")||{}).textContent, go:(s.querySelector(".myrd-go a")||{}).textContent||"", n:s.querySelectorAll(".myqt-c").length, t:s.innerText } : null; });
        ok(x && x.st === want && (goWant ? x.go.indexOf(goWant) >= 0 : !x.go), W + " " + kind + " " + no + " → " + want + (goWant ? " · " + goWant : " · 견적 단추 없음"), x && { st:x.st, go:x.go });
        if (no === "SW-QA28-0003") ok(x && /잘 모르겠어요/.test(x.t), W + " " + kind + " '잘 모르겠어요' 신청의 서비스 표시");
        if (no === "SW-QA28-0005") ok(x && /업체 확인 필요/.test(x.t) && !/(^|[^0-9,])0원/.test(x.t), W + " " + kind + " 빠진 칸은 '업체 확인 필요' (0원 · 포함으로 안 씀)");
      }
      await pg.goto(R + "/my?no=SW-ZZZZ-9999"); await pg.waitForTimeout(700);
      ok(await pg.evaluate(() => !!document.getElementById("my-nohit") && !document.getElementById("myrd")), W + " " + kind + " 이 계정에 없는 번호는 열지 않음");
      ok(!errs.length, W + " " + kind + " JS 에러 없음", errs);
      await ctx.close();
      if (W !== 390) continue;
      // ② 비로그인 · 사진 없음
      const o2 = { signed:false, me:false }; const c2 = await ctxOf(b, W, o2); const p2 = await c2.newPage();
      await p2.goto(R + url); await p2.waitForTimeout(700);
      if (kind === "quote") { await p2.check("#q-s-demolish"); await p2.selectOption("#q-reg", { index:1 }); await p2.fill("#q-name", "검수"); await p2.fill("#q-tel", "010-0000-1128"); await p2.check("#q-ag"); }
      else { await p2.selectOption("#cq-gu", { index:1 }); await p2.fill("#cq-name", "검수"); await p2.fill("#cq-tel", "010-0000-1128"); await p2.check("#cq-ag"); }
      await p2.click(btn); await p2.waitForTimeout(900);
      const g = await p2.evaluate(() => { const q = document.querySelector(".qd"); return q ? { ph: !!q.querySelector(".qd-ph"), mine: !!q.querySelector('a[href^="/my?no="]'),
        primary:(q.querySelector(".qd-go .btn-b")||{}).textContent||"", claim:(q.querySelector('a[href^="/my?claim="]')||{}).getAttribute ? q.querySelector('a[href^="/my?claim="]').getAttribute("href") : "" } : null; });
      ok(g && !g.ph, W + " " + kind + " 사진 없이 내면 사진 자리 없음", g);
      ok(g && !g.mine && /접수번호 복사/.test(g.primary), W + " " + kind + " 비로그인: 주요 단추는 접수번호 복사 (작동 안 하는 조회 단추 없음)", g);
      ok(g && /claim=SW-QA28-0002/.test(g.claim), W + " " + kind + " 비로그인: 로그인하고 가져오기 → /my?claim=", g && g.claim);
      await p2.goto(R + "/my?claim=SW-QA28-0002"); await p2.waitForTimeout(700);
      await c2.close();
    }
  }
  await b.close(); srv.close();
  console.log(res.join("\n"));
  const bad = res.filter(x => x[0] === "❌").length; console.log((bad ? "❌ " : "✅ ") + "통과 " + (res.length - bad) + " · 실패 " + bad); process.exit(bad ? 1 : 0);
})();
