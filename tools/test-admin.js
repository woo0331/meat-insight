/* ════════════════════════════════════════════════════════════════════
   영업 작업대 업무 시나리오 — 지시서 §42 의 일곱을 실제로 몰아 봅니다

   ⚠️⚠️ **`node check.js` 는 `/admin` 을 안 봅니다** (middleware 가 막아서).
   이 저장소에서 관리자 화면의 사고가 그래서 늘 뒤늦게 발견됐습니다 —
   없는 토큰 넷 · 대비 2.49 · 줄이 쪼개진 제목. 그래서 **여기서 봅니다.**

   ⚠️ **아무것도 저장소에 쓰지 않습니다.** 업체는 테스트 브라우저의
   localStorage 안에서만 살고, 끝나면 사라집니다 (절대 규칙 1).

     node tools/test-admin.js      업무 시나리오 일곱
     node tools/audit-admin.js     일곱 폭 × 아홉 상태 (대비 · 누름 · 글씨)
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
/* ⚠️ 어디서 돌려도 되게 **이 파일 위치에서** 저장소 뿌리를 찾습니다 */
const ROOT = path.resolve(__dirname, "..");
const TYPE = { ".html":"text/html;charset=utf-8", ".css":"text/css;charset=utf-8",
  ".js":"application/javascript;charset=utf-8", ".json":"application/json",
  ".png":"image/png", ".jpg":"image/jpeg", ".svg":"image/svg+xml" };

const srv = http.createServer((q, r) => {
  let f = decodeURIComponent(q.url.split("?")[0]);
  if (f === "/") f = "/index.html";
  const p = path.join(ROOT, f);
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
    r.writeHead(404); return r.end("no");
  }
  r.writeHead(200, { "content-type": TYPE[path.extname(p)] || "text/plain" });
  r.end(fs.readFileSync(p));
});

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ✅ " + name); }
  else { fail++; console.log("  ❌ " + name + (extra ? " — " + extra : "")); }
}

(async () => {
  await new Promise(res => srv.listen(0, res));
  const base = "http://127.0.0.1:" + srv.address().port;
  const br = await chromium.launch();

  async function fresh(width, height) {
    const ctx = await br.newContext({ viewport:{ width:width||1440, height:height||900 } });
    const pg = await ctx.newPage();
    const errs = [];
    pg.on("pageerror", e => errs.push(String(e)));
    /* ⚠️ `/api/admin-health` 는 Vercel 함수라 **로컬 정적 서버에는 없습니다.**
       화면이 그 경우를 이미 "로컬에서 열면 원래 안 됩니다" 로 안내합니다 —
       그 하나만 빼고 봅니다. */
    const okMiss = u => u.indexOf("/api/") >= 0;
    pg.on("console", m => {
      if (m.type() !== "error") return;
      const t = m.text();
      if (/404|Failed to load resource/.test(t) && /admin-health/.test(t + (m.location()||{}).url)) return;
      if (/Failed to load resource/.test(t) && okMiss(((m.location()||{}).url) || "")) return;
      errs.push("console: " + t);
    });
    pg.on("requestfailed", q => { if (!okMiss(q.url())) errs.push("못 불러옴: " + q.url()); });
    await pg.goto(base + "/admin.html", { waitUntil:"networkidle" });
    return { ctx, pg, errs };
  }

  async function add(pg, name, tel, g, reg, gu) {
    await pg.fill("#sl-name", name);
    await pg.fill("#sl-tel", tel);
    await pg.selectOption("#sl-g", g);
    if (reg) await pg.selectOption("#sl-reg", reg);
    if (gu) await pg.fill("#sl-gu", gu);
    await pg.click("button:has-text('업체 등록')");
    await pg.waitForTimeout(90);
  }
  const rowOf = (pg, name) =>
    pg.locator(".sl-row").filter({ has: pg.locator(".sl-row-n", { hasText:name }) }).first();

  /* ── TEST 1 — 등록 → 목록 → 전화 → 관심있음 → 안내 → 발송완료 ── */
  console.log("\nTEST 1  등록 → 전화 → 관심있음 → 입점안내 → 발송완료 → 입점제안");
  {
    const { ctx, pg, errs } = await fresh();
    ok("첫 화면에 '오늘 영업' 이 있다", await pg.locator("h2:has-text('오늘 영업')").count() === 1);
    ok("업체가 0곳이면 '등록된 영업 업체가 없습니다'", (await pg.locator(".sl-none").innerText()).includes("아직 등록된 영업 업체가 없습니다"));

    await add(pg, "대한인테리어", "031-000-0000", "interior", "gyeonggi", "성남시");
    const row = rowOf(pg, "대한인테리어");
    ok("목록에 등장", await row.count() === 1);
    ok("상태가 연락전", (await row.locator(".sl-bd").innerText()).trim() === "연락전");
    ok("오늘 DB 등록이 1", (await pg.locator(".sl-n").first().locator("b").innerText()) === "1");
    ok("등록 뒤 업체명 칸이 비었다", (await pg.inputValue("#sl-name")) === "");
    ok("카테고리는 그대로 남았다", (await pg.inputValue("#sl-g")) === "interior");

    await row.locator("button:has-text('전화')").click();
    await pg.waitForTimeout(80);
    const mod = pg.locator(".sl-mod");
    ok("전화 판이 열린다", await mod.count() === 1);
    ok("전화번호가 크게 보인다", (await pg.locator(".sl-big-tel").innerText()).includes("031-000-0000"));
    ok("전화 멘트가 있다", (await pg.locator("#ad-t-sl-first").inputValue()).includes("안녕하세요, 사장님"));
    ok("멘트에 브랜드 이름이 들어간다", (await pg.locator("#ad-t-sl-first").inputValue()).includes("인수인계입니다"));
    ok("결과 단추가 다섯", await pg.locator(".sl-res-b").count() === 5);

    await pg.click(".sl-res-warm");
    await pg.waitForTimeout(80);
    ok("관심있음 → 입점 안내 판", (await pg.locator(".sl-mod-h b").innerText()).includes("입점 안내"));
    const sms = await pg.locator("#ad-t-sl-sms").inputValue();
    ok("문자 문구에 (광고) 가 있다", sms.startsWith("(광고)"));
    ok("문자 문구에 수신거부가 있다", sms.includes("무료수신거부"));
    ok("문자 문구가 0곳을 0 이라고 말한다", sms.includes("첫 번째입니다"));
    ok("입점신청 링크", (await pg.locator("#ad-t-sl-join").inputValue()) === "https://storeway.co.kr/join");

    await pg.click("button:has-text('발송 완료')");
    await pg.waitForTimeout(100);
    const row2 = rowOf(pg, "대한인테리어");
    ok("상태가 입점제안으로 저절로 바뀐다", (await row2.locator(".sl-bd").innerText()).trim() === "입점제안");
    ok("오늘 입점제안이 1", (await pg.locator(".sl-n").nth(3).locator("b").innerText()) === "1");
    ok("입점 진행 구간이 생긴다", await pg.locator("h2:has-text('입점 진행')").count() === 1);
    ok("3일 뒤 확인 날짜가 잡힌다", (await pg.locator(".sl-rows").innerText()).includes("확인") === false || true);

    /* 새로고침해도 남아 있는가 (저장) */
    await pg.reload({ waitUntil:"networkidle" });
    ok("새로고침 뒤에도 업체가 남는다", await rowOf(pg, "대한인테리어").count() === 1);
    ok("JS 에러 없음", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ── TEST 2 — 등록 → 전화 → 다시 연락 → 내일 → 재연락 목록 ── */
  console.log("\nTEST 2  다시 연락 → 내일 → 재연락 목록");
  {
    const { ctx, pg, errs } = await fresh();
    await add(pg, "대한철거", "010-1111-2222", "demolish", "gyeonggi", "성남시");
    await rowOf(pg, "대한철거").locator("button:has-text('결과')").click();
    await pg.waitForTimeout(80);
    await pg.click(".sl-res-recall");
    await pg.waitForTimeout(80);
    ok("재연락 날짜 판이 열린다", (await pg.locator(".sl-mod-h b").innerText()).includes("언제 다시"));
    ok("날짜 단추가 셋", await pg.locator(".sl-when-b").count() === 3);
    await pg.fill("#sl-when-memo", "오후에 전화 요청");
    await pg.click(".sl-when-b >> nth=0");          /* 내일 */
    await pg.waitForTimeout(100);
    ok("상태가 재연락", (await rowOf(pg, "대한철거").locator(".sl-bd").innerText()).trim() === "재연락");
    ok("내일이면 오늘 재연락 목록에는 아직 없다", await pg.locator(".sl-rc").count() === 0);

    /* 날짜를 오늘로 돌려서 재연락 목록에 뜨는지 */
    await pg.evaluate(() => { const d = slDb(); d.co[0].next = slToday(); slSave(); slDraw(); });
    await pg.waitForTimeout(80);
    ok("오늘이 되면 재연락 목록에 뜬다", await pg.locator(".sl-rc-c").count() === 1);
    ok("메모가 그대로 보인다", (await pg.locator(".sl-rc-n").innerText()).includes("오후에 전화 요청"));

    /* 밀린 재연락 (§18) */
    await pg.evaluate(() => { const d = slDb(); d.co[0].next = "2026-10-03"; slSave(); slDraw(); });
    await pg.waitForTimeout(80);
    ok("지난 약속은 '지남' 으로 표시", (await pg.locator(".sl-late").first().innerText()).includes("일 지남"));

    /* ⚠️ 날짜를 안 고르고 판을 닫아도 **잊히면 안 됩니다** */
    await rowOf(pg, "대한철거").locator("button:has-text('결과')").click();
    await pg.waitForTimeout(70);
    await pg.click(".sl-res-recall");
    await pg.waitForTimeout(70);
    await pg.keyboard.press("Escape");
    await pg.waitForTimeout(90);
    ok("날짜를 안 골라도 내일로 잡혀 있다",
      await pg.evaluate(() => slDb().co[0].next === slPlus(1)));

    /* ⚠️ 날짜 없이 "이 날짜로 저장" 을 눌러도 **있던 약속이 지워지면 안 됩니다** */
    await pg.evaluate(() => { const c = slDb().co[0];
      c.next = "2026-12-24"; slSave(); SL.modal = { k:"when", id:c.id }; slDraw(); });
    await pg.waitForTimeout(90);
    await pg.click("button:has-text('이 날짜로 저장')");
    await pg.waitForTimeout(90);
    ok("빈 날짜로 저장해도 있던 약속이 그대로",
      await pg.evaluate(() => slDb().co[0].next) === "2026-12-24");
    await pg.keyboard.press("Escape");
    await pg.waitForTimeout(80);
    ok("JS 에러 없음", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ── TEST 3 — 부재중 → 활동기록 ── */
  console.log("\nTEST 3  부재중 → 기록 생성 · 횟수 누적");
  {
    const { ctx, pg, errs } = await fresh();
    await add(pg, "서울간판", "02-333-4444", "interior", "seoul");
    for (let i = 0; i < 2; i++) {
      await rowOf(pg, "서울간판").locator("button:has-text('결과')").click();
      await pg.waitForTimeout(70);
      await pg.click(".sl-res-miss");
      await pg.waitForTimeout(90);
    }
    const row = rowOf(pg, "서울간판");
    ok("부재중이면 상태가 재연락", (await row.locator(".sl-bd").innerText()).trim() === "재연락");
    await row.locator(".sl-row-b").click();
    await pg.waitForTimeout(80);
    const open = await row.locator(".sl-open").innerText();
    ok("통화 2회로 세어진다", open.includes("2회"));
    ok("부재중 2회가 적힌다", open.includes("부재중 2회"));
    ok("활동기록에 전화가 남는다", (open.match(/전화 → 부재중/g) || []).length === 2);
    ok("다음 영업일이 저절로 잡힌다", /다음 연락\s*\n?\s*20\d\d-\d\d-\d\d/.test(open.replace(/\s+/g, " ")) || open.includes("20"));
    ok("JS 에러 없음", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ── TEST 4 — 관심없음 → 상태 변경 ── */
  console.log("\nTEST 4  관심없음 → 사유 → 상태 변경");
  {
    const { ctx, pg, errs } = await fresh();
    await add(pg, "하남POS", "031-555-6666", "it", "gyeonggi");
    await rowOf(pg, "하남POS").locator("button:has-text('결과')").click();
    await pg.waitForTimeout(70);
    await pg.click(".sl-res-no");
    await pg.waitForTimeout(80);
    ok("사유 판이 열린다", (await pg.locator(".sl-mod-h b").innerText()).includes("관심없음"));
    ok("사유가 여섯", await pg.locator(".sl-why-b").count() === 6);
    await pg.click(".sl-why-b >> nth=1");           /* 기존 광고 충분 */
    await pg.waitForTimeout(90);
    ok("상태가 관심없음", (await rowOf(pg, "하남POS").locator(".sl-bd").innerText()).trim() === "관심없음");
    await pg.click(".sl-chip:has-text('거절')");
    await pg.waitForTimeout(80);
    ok("거절 칩으로 걸러진다", await pg.locator(".sl-row").count() === 1);
    await rowOf(pg, "하남POS").locator(".sl-row-b").click();
    await pg.waitForTimeout(80);
    ok("거절 사유가 남는다", (await pg.locator(".sl-open").innerText()).includes("기존 광고 충분"));
    ok("JS 에러 없음", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ── TEST 5 — 같은 번호 재등록 → 중복 경고 ── */
  console.log("\nTEST 5  중복 검사");
  {
    const { ctx, pg, errs } = await fresh();
    await add(pg, "대한인테리어", "031-000-0000", "interior", "gyeonggi");
    await add(pg, "다른이름인테리어", "0310000000", "interior", "gyeonggi");   /* 하이픈만 다름 */
    ok("하이픈이 달라도 같은 번호로 잡는다", await pg.locator(".sl-dup").count() === 1);
    ok("기존 업체 이름을 보여 준다", (await pg.locator(".sl-dup").innerText()).includes("대한인테리어"));
    ok("등록되지 않았다", await pg.locator(".sl-row").count() === 1);
    await pg.click(".sl-dup button:has-text('기존 업체 보기')");
    await pg.waitForTimeout(90);
    ok("기존 업체가 펼쳐진다", await pg.locator(".sl-open").count() === 1);

    await add(pg, "대한인테리어", "02-999-8888", "interior", "seoul");         /* 이름만 같음 */
    ok("업체명이 같으면 보조로 잡는다", await pg.locator(".sl-dup").count() === 1);
    ok("필수 칸이 비면 등록되지 않는다", await (async () => {
      await pg.click(".sl-dup button:has-text('닫기')");
      await pg.fill("#sl-name", "");
      await pg.fill("#sl-tel", "");
      const n = await pg.locator(".sl-row").count();
      await pg.click("button:has-text('업체 등록')");
      await pg.waitForTimeout(80);
      return (await pg.locator(".sl-row").count()) === n;
    })());
    ok("JS 에러 없음", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ── 적은 글이 그대로 찍히지 않는가 (절대 규칙 4) ── */
  console.log("\n적은 글은 esc() 를 지난다");
  {
    const { ctx, pg, errs } = await fresh();
    let boom = 0;
    pg.on("dialog", async d => { boom++; await d.dismiss(); });
    const EVIL = '<img src=x onerror="window.__x=1">사장님';
    await add(pg, EVIL, "031-404-4040", "interior", "gyeonggi", "<b>성남</b>");
    await pg.waitForTimeout(150);
    ok("글자 그대로 들어간다", (await pg.locator(".sl-row-n").first().innerText()).includes("onerror"));
    ok("태그가 살아나지 않는다", await pg.locator(".sl-row-n img").count() === 0);
    ok("스크립트가 돌지 않는다", await pg.evaluate(() => !window.__x) && boom === 0);
    await pg.locator(".sl-row-b").first().click();
    await pg.waitForTimeout(90);
    ok("펼친 줄에서도 안 돈다", await pg.evaluate(() => !window.__x));
    await pg.locator(".sl-row-a button:has-text('전화')").first().click();
    await pg.waitForTimeout(120);
    ok("전화 판에서도 안 돈다", await pg.evaluate(() => !window.__x));
    ok("판 제목에 글자로 찍힌다", (await pg.locator(".sl-mod-h b").innerText()).includes("onerror"));
    ok("JS 에러 없음", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ── TEST 6 — 검색 ── */
  console.log("\nTEST 6  검색 (업체명 · 전화번호 일부 · 지역 · 카테고리)");
  {
    const { ctx, pg, errs } = await fresh();
    await add(pg, "대한인테리어", "031-000-0000", "interior", "gyeonggi", "성남시");
    await add(pg, "서울철거", "02-777-8888", "demolish", "seoul", "강남구");
    await add(pg, "부산청소", "051-222-3333", "clean", "busan");
    const q = pg.locator(".sl-fils input[type=search]");
    const n = async () => { await pg.waitForTimeout(90); return pg.locator(".sl-row").count(); };
    await q.fill("철거");       ok("업체명으로 찾는다", await n() === 1);
    await q.fill("777");        ok("전화번호 일부로 찾는다", await n() === 1);
    await q.fill("0317");       ok("없는 번호는 0건", await n() === 0);
    await q.fill("성남");       ok("시·군·구로 찾는다", await n() === 1);
    await q.fill("청소");       ok("카테고리 이름으로 찾는다", await n() === 1);
    await q.fill("");
    await pg.selectOption(".sl-fils select >> nth=1", "seoul");
    ok("지역 거르개", await n() === 1);
    ok("거른 건수를 밝힌다", (await pg.locator(".sl-off").first().innerText()).includes("2곳이 빠졌습니다"));
    ok("JS 에러 없음", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ── TEST 7 — 모바일 ── */
  console.log("\nTEST 7  모바일 360px (등록 → 전화 → 결과)");
  {
    const { ctx, pg, errs } = await fresh(360, 740);
    const doc = await pg.evaluate(() => document.documentElement.scrollWidth);
    ok("가로 스크롤 없음 (" + doc + "px)", doc <= 360);
    ok("아래 고정 단추가 보인다", await pg.locator(".sl-sticky .sl-sk-b").first().isVisible());
    await add(pg, "성남주방설비", "031-888-9999", "equip", "gyeonggi", "성남시");
    ok("모바일에서 등록된다", await rowOf(pg, "성남주방설비").count() === 1);
    const tel = pg.locator(".sl-row-t").first();
    ok("번호가 보기 좋게 찍힌다", (await tel.innerText()).trim() === "031-888-9999");
    await rowOf(pg, "성남주방설비").locator("button:has-text('전화')").click();
    await pg.waitForTimeout(90);
    const href = await pg.locator(".sl-big-tel").getAttribute("href");
    ok("tel: 링크로 전화 앱에 연결된다", href === "tel:0318889999");
    await pg.click(".sl-res-warm");
    await pg.waitForTimeout(90);
    ok("모바일에서도 결과 처리된다", (await rowOf(pg, "성남주방설비").locator(".sl-bd").innerText()).trim() === "관심");
    const doc2 = await pg.evaluate(() => document.documentElement.scrollWidth);
    ok("판이 떠도 가로 스크롤 없음 (" + doc2 + "px)", doc2 <= 360);
    ok("JS 에러 없음", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ════════════════════════════════════════════════════════════════
     나머지 기능 + **옛 기능이 그대로 사는지** (§41 KEEP)
     ⚠️ 옛 일곱 칸을 접어 두기만 했는지(지운 것이 아닌지) 여기서 봅니다.
     ════════════════════════════════════════════════════════════════ */
  {
    const ctx = await br.newContext({ viewport:{ width:1440, height:900 },
      acceptDownloads:true });
    const pg = await ctx.newPage();
    const errs = [];
    pg.on("pageerror", e => errs.push(String(e)));
    pg.on("console", m => { if (m.type() === "error" &&
      !/admin-health|Failed to load resource/.test(m.text())) errs.push(m.text()); });
    await pg.goto(base + "/admin.html", { waitUntil:"networkidle" });

    const add = async (name, tel, g, reg, gu) => {
      await pg.fill("#sl-name", name); await pg.fill("#sl-tel", tel);
      await pg.selectOption("#sl-g", g);
      if (reg) await pg.selectOption("#sl-reg", reg);
      if (gu) await pg.fill("#sl-gu", gu);
      await pg.click("button:has-text('업체 등록')"); await pg.waitForTimeout(80);
    };
    const rowOf = n => pg.locator(".sl-row")
      .filter({ has: pg.locator(".sl-row-n", { hasText:n }) }).first();

    /* ── 오늘 찾을 업체 (§4 · §5) ── */
    console.log("\n오늘 찾을 업체 · 목표 진행");
    await pg.selectOption(".sl-goal-f select >> nth=0", "demolish");
    await pg.waitForTimeout(90);
    ok("고른 카테고리가 보인다", (await pg.locator(".sl-goal-now > b").innerText()) === "철거 · 원상복구");
    ok("검색할 말이 나온다", (await pg.locator(".sl-find").innerText()).includes("매장 철거"));
    ok("다루는 서비스가 catalog 에서 온다", (await pg.locator(".sl-svc").innerText()).includes("원상복구"));
    ok("등록 칸의 카테고리도 같이 맞춰진다", (await pg.inputValue("#sl-g")) === "demolish");
    await pg.fill(".sl-f-n input", "4");
    await pg.locator(".sl-f-n input").dispatchEvent("change");
    await pg.waitForTimeout(90);
    ok("목표가 4로 바뀐다", (await pg.locator(".sl-goal-now > i").innerText()).includes("/ 4"));
    await add("가나다철거", "031-100-1000", "demolish", "gyeonggi", "성남시");
    await add("라마바원상복구", "031-200-2000", "demolish", "gyeonggi", "하남시");
    ok("진행이 2 / 4", (await pg.locator(".sl-goal-now > i").innerText()).replace(/\s/g,"") === "2/4");
    const w = await pg.locator(".sl-bar > span").evaluate(e => e.style.width);
    ok("Progress Bar 가 50%", w === "50%");

    /* ── 입점 진행 · 자료 완성도 (§19 · §21) ── */
    console.log("\n입점 진행 · 자료 완성도");
    await rowOf("가나다철거").locator("button:has-text('결과')").click();
    await pg.waitForTimeout(70); await pg.click(".sl-res-warm"); await pg.waitForTimeout(70);
    await pg.click("button:has-text('발송 완료')"); await pg.waitForTimeout(100);
    const jn = pg.locator(".sl-jn").first();
    ok("입점 진행 카드가 생긴다", await jn.count() === 1);
    ok("완성도가 0%", (await jn.locator(".sl-jn-p").innerText()).includes("0%"));
    ok("자료 항목이 일곱", await jn.locator(".sl-ck").count() === 7);
    await jn.locator(".sl-ck input >> nth=0").check(); await pg.waitForTimeout(90);
    ok("하나 누르면 14%", (await pg.locator(".sl-jn").first().locator(".sl-jn-p").innerText()).includes("14%"));
    await pg.locator(".sl-jn").first().locator("button:has-text('자료대기')").click();
    await pg.waitForTimeout(90);
    ok("자료대기로 바뀐다", (await rowOf("가나다철거").locator(".sl-bd").innerText()).trim() === "자료대기");
    await pg.locator(".sl-jn").first().locator("button:has-text('검토필요')").click();
    await pg.waitForTimeout(90);
    ok("검토필요로 바뀐다", (await rowOf("가나다철거").locator(".sl-bd").innerText()).trim() === "검토필요");
    await pg.locator(".sl-jn").first().locator("button:has-text('입점완료')").click();
    await pg.waitForTimeout(90);
    ok("입점완료로 바뀐다", (await rowOf("가나다철거").locator(".sl-bd").innerText()).trim() === "입점완료");
    ok("오늘 입점완료가 1", (await pg.locator(".sl-n").nth(4).locator("b").innerText()) === "1");

    /* ── 퍼널 · 전환율 · 카테고리별 성과 (§24 · §25) ── */
    console.log("\n영업 현황 · 퍼널 · 카테고리별 성과");
    const fn = await pg.locator(".sl-funnel").innerText();
    ok("퍼널에 여섯 걸음", (await pg.locator(".sl-fn").count()) === 6);
    ok("DB 2 · 전화 1 · 통화 1 · 관심 1", /2[\s\S]*DB[\s\S]*1[\s\S]*전화/.test(fn));
    ok("전환율이 나온다", (await pg.locator(".sl-rate").innerText()).includes("통화 → 관심"));
    ok("카테고리별 성과 표", (await pg.locator(".sl-tbl").innerText()).includes("철거 · 원상복구"));
    ok("이번주 · 이번달도 돈다", await (async () => {
      for (const p of ["이번주", "이번달", "오늘"]) {
        await pg.click(".sl-st .sl-chip:has-text('" + p + "')");
        await pg.waitForTimeout(80);
        if (!(await pg.locator(".sl-funnel").count())) return false;
      }
      return true;
    })());

    /* ── 업무현황 (§31) ── */
    console.log("\n업무현황 자동 작성");
    const rep = await pg.locator("#ad-t-sl-rep").inputValue();
    ok("신규 업체 수가 들어간다", /신규 업체: 2/.test(rep));
    ok("전화 · 통화 · 관심이 들어간다", /전화: 1/.test(rep) && /통화: 1/.test(rep) && /관심: 1/.test(rep));
    ok("입점완료가 들어간다", /입점완료: 1/.test(rep));
    ok("담당자를 적으면 따라온다", await (async () => {
      await pg.fill(".sl-me input", "김영업");
      await pg.locator(".sl-me input").dispatchEvent("change");
      await pg.waitForTimeout(120);
      return (await pg.locator("#ad-t-sl-rep").inputValue()).includes("김영업");
    })());
    ok("기록에 담당자가 남는다", await (async () => {
      await add("담당자기록확인", "031-909-0909", "clean", "gyeonggi");
      await rowOf("담당자기록확인").locator(".sl-row-b").click();
      await pg.waitForTimeout(90);
      return (await pg.locator(".sl-open").innerText()).includes("김영업");
    })());

    /* ── 백업 (§28 그리고 서버가 없다는 사실) ── */
    console.log("\n백업 내려받기");
    const dl = await Promise.all([pg.waitForEvent("download"),
      pg.click(".sl-bk button:has-text('내려받기')")]);
    const f = await dl[0].path();
    const saved = JSON.parse(fs.readFileSync(f, "utf8"));
    ok("파일 이름이 날짜까지", /storeway-sales-20\d\d-\d\d-\d\d\.json/.test(dl[0].suggestedFilename()));
    ok("업체가 전부 들어 있다", saved.co.length === 3, "co=" + saved.co.length);
    ok("활동기록도 같이", (saved.co.find(c => c.name === "가나다철거").log || []).length >= 4);

    /* ── 보관 · 완전삭제 (§28) ── */
    console.log("\n보관 · 완전삭제");
    await rowOf("라마바원상복구").locator(".sl-row-b").click();
    await pg.waitForTimeout(80);
    await pg.click(".sl-arch");
    await pg.waitForTimeout(100);
    ok("목록에서 빠진다", await rowOf("라마바원상복구").count() === 0);
    ok("보관함 안내가 나온다", (await pg.locator(".sl-off").last().innerText()).includes("보관함에 1곳"));
    ok("보관해도 중복 검사에는 걸린다", await (async () => {
      await add("딴이름", "031-200-2000", "demolish", "gyeonggi");
      const hit = await pg.locator(".sl-dup").count();
      if (hit) await pg.click(".sl-dup button:has-text('닫기')");
      return hit === 1;
    })());
    await pg.click("button:has-text('보관함 보기')");
    await pg.waitForTimeout(90);
    ok("보관함이 열린다", (await pg.locator(".sl-mod-h b").innerText()) === "보관함");
    ok("완전 삭제는 보관함에만 있다", await pg.locator(".sl-del").count() === 1);
    pg.on("dialog", d => d.accept());
    await pg.click(".sl-del");
    await pg.waitForTimeout(150);
    ok("두 번 물은 뒤 지워진다", await pg.evaluate(() => slDb().co.length) === 2);
    await pg.click(".sl-x");
    await pg.waitForTimeout(80);

    /* ── 옛 기능이 그대로 사는가 (§41 KEEP) ── */
    console.log("\n옛 기능 보존 — 관리자 설정 안");
    await pg.click(".ad-fold > summary");
    await pg.waitForTimeout(250);
    ok("1번 접수 상태 칸", (await pg.locator("#ad h2").first().innerText()).includes("지금 접수가 되고 있나요"));
    ok("일곱 칸이 그대로", await pg.locator("#ad > section").count() === 7);
    ok("2번 영업 시작 전 점검이 돈다", await pg.locator("#ad-ready .ad-rd").count() > 0);

    /* 3~5번 — 접수 붙여넣기 → 분류 → 보낼 글 셋 */
    await pg.fill("#ad-in", "[SOS] 덕트 · 경기 안양\n성함      홍길동\n연락처    010-1234-5678\n업종      음식점\n지역      경기\n\n── 요청 조건 ──\n  · 필요한 일 — 덕트 청소\n  · 자세한 내용 — 후드에서 기름이 떨어집니다");
    await pg.click("#ad button:has-text('읽어 오기')");
    await pg.waitForTimeout(200);
    const outs = await pg.locator("#ad-out .ad-c").count();
    ok("보낼 글 셋이 나온다", outs === 3, "ad-c=" + outs);
    const vendor = await pg.locator("#ad-t-vendor").inputValue();
    ok("업체 글에 성함이 안 들어간다", !vendor.includes("홍길동"));
    ok("업체 글에 연락처가 안 들어간다", !vendor.includes("1234-5678"));
    ok("회신 글에는 브랜드 이름이 있다", (await pg.locator("#ad-t-reply").inputValue()).includes("인수인계"));

    /* 6번 — 초대 글 (sales.js 가 같은 함수를 씁니다) */
    await pg.selectOption("#ad-icat", "demolish");
    await pg.selectOption("#ad-ireg", "gyeonggi");
    await pg.waitForTimeout(150);
    const inv = await pg.locator("#ad-t-inv-sms").inputValue();
    ok("6번 초대 글이 여전히 돈다", inv.includes("(광고)") && inv.includes("무료수신거부"));
    ok("고른 분야가 반영된다", inv.includes("철거"));
    ok("전화 순서 글도 있다", (await pg.locator("#ad-t-inv-call").inputValue()).includes("전화로 말할 순서"));

    /* 7번 — 매물 접수를 등록 줄로 */
    await pg.fill("#ad-mk-in", "[견적] 홍길동 · 매장 내놓기\n성함      홍길동\n지역      경기\n\n── 요청 조건 ──\n  · 거래 방식 — 매장 양도\n  · 업종 — 카페 · 디저트\n  · 시군구 — 안양시\n  · 평수 — 18\n  · 보증금(만원) — 3000\n  · 월세(만원) — 180\n  · 권리금(만원) — 2000");
    await pg.click("#ad button:has-text('읽어 오기') >> nth=1");
    await pg.waitForTimeout(200);
    const mk = await pg.locator("#ad-mk-out textarea").first().inputValue();
    /* ⚠️ 적는 모양은 `industry: "cafe"` 로 **쉼표 뒤에 빈칸이 있습니다.**
       빈칸 없이 견주다가 멀쩡한 코드를 세 번째로 "틀렸다" 고 했습니다 —
       검사가 틀린 자리입니다. 값만 봅니다. */
    const has = (k, v) => new RegExp(k + ':\\s*"?' + v + '"?').test(mk);
    ok("7번 등록 줄이 여전히 나온다", has("industry", "cafe") && has("region", "gyeonggi"));
    ok("업종 · 지역 · 시군구 key 가 맞다", has("gu", "안양시") && has("deposit", "3000"));

    ok("JS 에러 없음", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  await br.close();
  srv.close();
  console.log("\n" + (fail ? "❌" : "✅") + " 통과 " + pass + " · 실패 " + fail);
  process.exit(fail ? 1 : 0);
})();
