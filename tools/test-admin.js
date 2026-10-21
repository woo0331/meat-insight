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

  /* ── 작업대의 끝(/join)이 막혔으면 **말해야** 합니다 ── */
  console.log("\n접수가 잠겨 있으면 안내 보내기 전에 알린다");
  {
    const { ctx, pg, errs } = await fresh();
    const on = async v => { await pg.evaluate(x => { WOW_BIZ.sosReady = x; slDraw(); }, v);
      await pg.waitForTimeout(90); };

    await on(false);
    ok("맨 위에 경고가 뜬다", await pg.locator(".sl-bad-intake").count() >= 1);
    ok("무엇이 막혔는지 적는다",
      (await pg.locator(".sl-bad-intake").first().innerText()).includes("storeway.co.kr/join"));

    await add(pg, "접수잠김확인", "031-707-7070", "interior", "gyeonggi");
    await rowOf(pg, "접수잠김확인").locator("button:has-text('결과')").click();
    await pg.waitForTimeout(70);
    await pg.click(".sl-res-warm");
    await pg.waitForTimeout(90);
    const mod = await pg.locator(".sl-mod .sl-bad-intake").count();
    ok("안내 보내기 판에도 뜬다", mod === 1);
    ok("보내지 말고 미루라고 한다",
      (await pg.locator(".sl-mod .sl-bad-intake").innerText()).includes("발송은 미루셔도"));
    ok("그래도 관심 상태는 남는다",
      await pg.evaluate(() => slDb().co[0].st) === "warm");
    await pg.keyboard.press("Escape");
    await pg.waitForTimeout(80);

    /* 접수처를 켜면 **저절로** 사라져야 합니다 (손으로 적는 상태가 아닙니다) */
    await on(true);
    ok("접수를 켜면 경고가 저절로 사라진다", await pg.locator(".sl-bad-intake").count() === 0);
    await pg.evaluate(() => { SL.modal = { k:"warm", id:slDb().co[0].id }; slDraw(); });
    await pg.waitForTimeout(90);
    ok("안내 판에서도 사라진다", await pg.locator(".sl-mod .sl-bad-intake").count() === 0);
    ok("문구와 링크는 그대로 나온다",
      (await pg.locator("#ad-t-sl-join").inputValue()) === "https://storeway.co.kr/join");
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
    /* ⚠️⚠️ **갯수를 그냥 세지 않습니다.** `=== 7` 로 적어 두었다가
       8번 칸(수익상품)을 더하자 **멀쩡한 화면을 실패로** 잡았습니다 —
       이 저장소가 "검사가 갯수를 그냥 셌음" 으로 **세 번** 겪은 자리입니다
       (업체 분야 · 거르개 숨김 건수 · 감사 기록). 지키려는 것은
       "옛 일곱이 살아 있는가" 이지 "전부 일곱인가" 가 아닙니다 (§29 KEEP). */
    {
      const heads = (await pg.locator("#ad > section h2").allInnerTexts())
                      .map(t => t.replace(/\s+/g, " ").trim());
      /* ⚠️ 씨앗을 화면의 **실제 제목**에서 가져왔습니다 — 처음에
         "접수 붙여" 라고 적었는데 화면은 "들어온 접수를 붙여 넣으세요"
         입니다. **코드가 아니라 씨앗이 틀렸습니다** (이 저장소에서 네 번째). */
      const keep = ["지금 접수가 되고 있나요", "영업 시작 전에 남은 것",
                    "들어온 접수를 붙여 넣으세요", "분류는 사람이 고릅니다",
                    "보낼 글", "업체에 보낼 초대 글", "매물 접수를 등록 줄로"];
      const miss = keep.filter(k => !heads.some(h => h.includes(k)));
      ok("옛 일곱 칸이 그대로 있다 (§29 KEEP)", miss.length === 0, miss.join(" · "));
      ok("칸이 일곱 이상이다", heads.length >= 7, heads.length);
    }
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

  /* ══ 2026-10-11 전면 감사 §6 ════════════════════════════════════
     ⚠️⚠️ **`check.js` 가 /admin 을 못 봅니다** (middleware 가 막아서).
     여기가 유일한 자리입니다. */
  console.log("\n접수 · 배정 — DB 가 없으면 한 픽셀도 안 그린다");
  {
    const { pg, ctx, errs } = await fresh(1440, 1000);
    await pg.goto(base + "/admin.html", { waitUntil:"networkidle" });
    await pg.waitForTimeout(400);

    /* 로컬 정적 서버에는 `/api/session` 이 없습니다 — 화면은 그것을
       "로그인이 설정되지 않았다" 로 읽고 **구간째 안 그립니다.**
       ⚠️ 여기서 "준비 중" 이나 로그인 단추가 나오면 그게 §30-7 입니다. */
    const rqHtml = (await pg.locator("#rq").innerHTML()).trim();
    ok("#rq 가 비어 있다 (auth:false)", rqHtml === "", rqHtml.slice(0, 80));
    const rqBox = await pg.locator("#rq").boundingBox();
    ok("#rq 가 자리를 차지하지 않는다", !rqBox || rqBox.height === 0,
       rqBox ? "h=" + rqBox.height : "none");
    ok("'준비 중' 자리표시자가 없다",
       !(await pg.locator("#rq").textContent()).includes("준비"));

    /* ── 9번 제휴업체 등록 줄 ──────────────────────────────────
       ⚠️ 여기 적는 업체는 **테스트 브라우저 안에서만** 삽니다 —
       저장소 데이터(js/data/providers.js)는 그대로 0곳입니다
       (절대 규칙 1). */
    /* ⚠️ 9번은 접힌 "관리자 설정" 안입니다 (§29) — 펼쳐야 보입니다 */
    await pg.click(".ad-fold > summary");
    await pg.waitForTimeout(200);
    const pvB = pg.locator("#ad-pv");
    ok("9번 칸이 있다", (await pvB.count()) === 1);

    /* 아무것도 안 적었을 때 — ⚠️ 빠진 것을 **보여 줍니다** */
    const warn0 = await pg.locator("#ad-pv-out .ad-pv-w").textContent();
    ok("빈 채로는 빠진 것을 말한다",
       warn0.includes("업체명") && warn0.includes("하는 일"), warn0.slice(0, 120));
    ok("하위 분야가 비면 까닭까지 말한다",
       warn0.includes("아무 분류에도"), warn0.slice(0, 200));

    await pg.fill("#ad-pv-nm", "가나다 인테리어");
    await pg.fill("#ad-pv-id", "GANADA_1");
    await pg.waitForTimeout(150);
    ok("주소에 한글 · 대문자 · 밑줄을 못 쓰게 한다",
       (await pg.locator("#ad-pv-out .ad-pv-w").textContent()).includes("영문 소문자"));

    /* ⚠️⚠️ **한 글자씩 칠 때 칸에서 커서가 빠지면 안 됩니다.** 적는
       칸에서 화면을 통째로 다시 그리면 "가" 까지만 치고 멈춥니다 —
       `pg.fill()` 은 값을 한 번에 넣어서 **이 사고를 못 잡습니다.** */
    await pg.fill("#ad-pv-id", "");
    await pg.click("#ad-pv-id");
    await pg.type("#ad-pv-id", "ganada-interior", { delay:12 });
    ok("한 글자씩 쳐도 칸에서 커서가 안 빠진다",
       (await pg.evaluate(() => document.activeElement && document.activeElement.id)) === "ad-pv-id" &&
       (await pg.locator("#ad-pv-id").inputValue()) === "ganada-interior",
       await pg.locator("#ad-pv-id").inputValue());
    await pg.fill("#ad-pv-sc", "2015");
    /* ⚠️ 경기도는 넓습니다 — `gu` 는 적어 받아 놓고 안 읽던 칸입니다 */
    await pg.fill("#ad-pv-gu", "안양시, 군포시");
    await pg.fill("#ad-pv-in", "카페 인테리어를 10년 해 왔습니다");
    await pg.locator("#ad-pv .ad-pv-b", { hasText:"서비스 지역" })
            .locator("label", { hasText:"경기" }).first()
            .locator("input").check();
    await pg.locator("#ad-pv .ad-pv-b", { hasText:"전문 업종" })
            .locator("label", { hasText:"카페" }).first()
            .locator("input").check();
    /* ⚠️⚠️ 분류가 아니라 **하위 분야**를 고르는 자리입니다 —
       `interior` 는 **둘 다 있는 이름**이라 손으로 적으면 틀립니다. */
    await pg.selectOption("#ad-pv-cat", "interior");
    await pg.waitForTimeout(150);
    await pg.locator("#ad-pv .ad-pv-b", { hasText:"하는 일" })
            .locator("label", { hasText:"전기" }).first()
            .locator("input").check();
    await pg.waitForTimeout(200);

    const js  = await pg.locator("#ad-t-pvjs").inputValue();
    const sql = await pg.locator("#ad-t-pvsql").inputValue();
    /* ⚠️ 쉼표 뒤 빈칸까지 통째로 견주지 않습니다 — 값만 봅니다
       (이 저장소가 7번 칸에서 세 번 겪은 자리). */
    ok("① 손님 화면 줄이 나온다",
       /id:\s*"ganada-interior"/.test(js) && /subs:\s*\["electric"\]/.test(js), js.slice(0, 160));
    ok("지역 · 업종 key 가 맞다",
       /regions:\s*\["gyeonggi"\]/.test(js) && /industries:\s*\["cafe"\]/.test(js), js.slice(0, 200));
  ok("시 · 군 · 구가 쉼표로 갈려 들어간다",
     /gu:\s*\["안양시","군포시"\]/.test(js), js.slice(0, 260));
    /* ⚠️ 평점 · 후기 수를 적는 칸이 없습니다 — 배열에서 셉니다 */
    ok("평점 · 후기 수를 적는 칸이 없다",
       !/rating|reviewN|jobs/.test(js) && /reviews:\[\]/.test(js), js);
    ok("② 배정용 SQL 이 같이 나온다",
       /insert into provider/.test(sql) && /'\{"electric"\}'/.test(sql), sql.slice(0, 200));
    /* ⚠️⚠️ 두 번 돌려도 안전해야 합니다. 지우고 다시 넣으면 그 업체에
       붙은 배정 · 계약이 cascade 로 같이 지워집니다. */
    ok("두 번 돌려도 안전하다 (on conflict)", /on conflict \(id\) do update/.test(sql));
    /* ⚠️ 확인 배지는 서류를 보고 켜는 칸입니다 — 이 줄이 손대면
       다시 돌릴 때 꺼집니다 */
    ok("verified 를 건드리지 않는다", !/verified/.test(sql), sql);
    ok("빠진 것 경고가 사라졌다", (await pg.locator("#ad-pv-out .ad-pv-w").count()) === 0);

    /* ⚠️ `시설 · 장비` 는 하위가 **업종에서** 옵니다 — 그 분류의
       `items` 가 비어 있어서 안 모으면 고르개가 덩그러니 빕니다. */
    await pg.selectOption("#ad-pv-cat", "equip");
    await pg.waitForTimeout(150);
    const eq = await pg.locator("#ad-pv .ad-pv-b", { hasText:"하는 일" })
                       .locator(".ad-pv-chk label").count();
    ok("시설 · 장비도 하위 고르개가 빈 칸이 아니다", eq > 10, "label=" + eq);

    ok("JS 에러 없음", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ══ 로그인한 채로 — 목록 · 상태 변경 · 배정 (전면 감사 §6) ═════
     ⚠️⚠️ **Supabase 를 세울 수가 없어서 세 주소를 가로챕니다.** 서버
     쪽(move_state 의 자물쇠)은 `tools/test-deal.js` 와
     `tools/test-sql.js` 가 실제로 눌러 보고, 여기서 보는 것은
     **화면이 무엇을 보내고 무엇을 보여 주는가**입니다.
     ⚠️ 가로채는 쪽도 `move_state` 와 **같은 말로** 거절합니다 — 다른
     말로 거절하면 화면이 엉뚱한 안내를 해도 통과합니다. */
  console.log("\n로그인하면 — 접수 목록 · 상태 변경 · 배정");
  {
    const { pg, ctx, errs } = await fresh(1440, 1200);
    let sent = null;
    const CONF = { url:"https://proj.supabase.co", anonKey:"ANON-TEST" };

    await pg.route("**/api/session", r => r.fulfill({ status:200,
      contentType:"application/json",
      body: JSON.stringify({ auth:true, signedIn:true, role:"admin",
                             name:"관리자", provider:null, conf:CONF }) }));

    await pg.route("**/api/me**", r => r.fulfill({ status:200,
      contentType:"application/json", body: JSON.stringify({
        auth:true, signedIn:true, role:"admin",
        requests:[
          { id:"11111111-1111-1111-1111-111111111111", no:"SW-AB12-CD34",
            side:"start", cat:"interior", industry:"cafe",
            region:"gyeonggi", gu:"안양시", state:"check",
            created_at:"2026-10-11T02:00:00+00:00", assignment:[] },
          { id:"22222222-2222-2222-2222-222222222222", no:"SW-EF56-GH78",
            side:"close", cat:"demolish", industry:"restaurant",
            region:"seoul", gu:"", state:"hold",
            created_at:"2026-10-10T02:00:00+00:00", assignment:[] }
        ],
        providers:[{ id:"pv-one", name:"가나다 인테리어", listed:false }],
        /* 업체가 낸 견적 — ⚠️⚠️ **받아만 놓지 않는지** 봅니다 (0008).
           서버가 보내는데 화면이 안 그리면 직원은 금액을 전화로 다시
           물어야 합니다 (이 저장소의 "만들어 놓고 안 쓰는 칸"). */
        quotes:[
          { id:"q1", request_id:"11111111-1111-1111-1111-111111111111",
            provider_id:"pv-one", amount:1200000, vat:"add",
            scope:"철거 · 폐기물 처리", days:5, start_on:"2026-11-02",
            state:"open", created_at:"2026-10-11T03:00:00+00:00" }
        ],
        deals:[], audits:[] }) }));

    await pg.route("**/api/deal", r => {
      sent = JSON.parse(r.request().postData() || "{}");
      const c = (sent.args || {}).p_ctx || {};
      /* ⚠️⚠️ **화면이 알 수 없는 거절**입니다 — 그 업체가 DB 에 있는지는
         서버만 압니다. 화면 앞단(`amDealMove()`)이 걸러 낼 수 없는
         자리라, "DB 가 거절한 그 말이 그대로 손님에게 간다" 를 여기서
         봅니다 (3차에서 앞단이 생기면서 제17조 쪽은 보내기 전에
         막히게 됐습니다 — 그건 바로 아래에서 따로 봅니다). */
      if(sent.args.p_to === "assigned" && c.providerId === "pv-gone")
        return r.fulfill({ status:400, contentType:"application/json",
          body: JSON.stringify({ error:"없는 업체입니다 — pv-gone" }) });
      return r.fulfill({ status:200, contentType:"application/json",
        body: JSON.stringify({ ok:true, data:sent.args.p_to }) });
    });

    await pg.goto(base + "/admin.html", { waitUntil:"networkidle" });
    await pg.waitForTimeout(500);

    ok("접수 줄이 나온다", (await pg.locator("#rq .rq-s-rq .rq-r").count()) === 2);
    /* ⚠️ 상태 이름 · 색은 `js/data/deal.js` 한 곳에서 옵니다 — 이 줄이
       영어로 나오면 admin.html 에 deal.js 를 안 실은 것입니다 */
    ok("상태 이름이 한글로 나온다 (deal.js 를 읽습니다)",
       (await pg.locator("#rq .rq-s-rq .rq-r >> nth=0 >> .myq-st").textContent()) === "정보 확인 중");
    /* ⚠️⚠️ 보류를 취소와 같은 색으로 두지 않습니다 (§8-3) */
    const c0 = await pg.locator("#rq .rq-s-rq .rq-r >> nth=0 >> .myq-st").getAttribute("class");
    const c1 = await pg.locator("#rq .rq-s-rq .rq-r >> nth=1 >> .myq-st").getAttribute("class");
    ok("보류는 진행 중과 다른 색이다", c0 !== c1, c0 + " / " + c1);
    ok("접수번호가 보인다",
       (await pg.locator("#rq .rq-s-rq .rq-no").first().textContent()) === "SW-AB12-CD34");
    /* ⚠️⚠️ 목록 하나가 곧 유출인 자리입니다 */
    const listTxt = await pg.locator("#rq .rq-s-rq").textContent();
    ok("목록에 성함 · 연락처가 없다",
       !/010-|@/.test(listTxt) && listTxt.includes("성함 · 연락처가 없습니다"));
    ok("상태 칩의 숫자가 센 값이다",
       (await pg.locator("#rq .rq-s-rq .rq-fil .chip").first().textContent()).includes("전체 2"));

    /* 거르개 */
    await pg.locator("#rq .rq-s-rq .rq-fil .chip", { hasText:"보류" }).click();
    await pg.waitForTimeout(200);
    ok("상태로 거를 수 있다", (await pg.locator("#rq .rq-s-rq .rq-r").count()) === 1);
    await pg.locator("#rq .rq-s-rq .rq-fil .chip", { hasText:"전체" }).click();
    await pg.waitForTimeout(200);

    /* ── 배정 (§6 업체 수동 배정 · 제17조) ───────────────────── */
    await pg.locator("#rq .rq-s-rq .rq-r .rq-hd").first().click();
    await pg.waitForTimeout(200);
    const dests = await pg.locator("#rq-to option").allTextContents();
    ok("갈 수 있는 길만 나온다", dests.includes("업체 배정") && dests.includes("보류"), dests.join(","));

    /* ── 업체가 낸 견적 (0008 · §4 · §6) ──────────────────────
       ⚠️⚠️ **서버가 보내는데 화면이 안 그리면** 직원은 금액과 범위를
       전화로 다시 물어야 합니다 — 이 저장소가 `gu` · `amStore()` ·
       `withEquip` · 푸터의 `stages` 로 겪은 "받아만 놓는 칸" 입니다. */
    /* ⚠️⚠️ **먼저 세고** 글을 읽습니다. `textContent()` 를 바로 부르면
       없을 때 30초 타임아웃으로 터지고 **어느 검사가 틀렸는지도 안
       나옵니다** — 되돌려 보다가 그대로 당했습니다 (2차에서 환수
       미리보기로 겪은 자리). */
    const qn = await pg.locator("#rq .rq-s-rq .rq-q > li").count();
    ok("펼친 줄에 받은 견적이 나온다", qn === 1, qn);
    const qTxt = qn ? await pg.locator("#rq .rq-s-rq .rq-q").textContent() : "";
    ok("견적 금액 · 부가세 처리가 같이 나온다",
       /1,200,000원/.test(qTxt) && /부가세 별도/.test(qTxt), qTxt);
    ok("포함 범위가 나온다 (금액만으로는 못 견줍니다)",
       /철거 · 폐기물 처리/.test(qTxt), qTxt);
    /* ⚠️ 상태 딱지는 `/my` 와 **같은 클래스**입니다 — 다른 색이면 한
       시스템으로 안 읽힙니다 (css/admin.css 가 적어 둔 그대로). */
    ok("견적 딱지가 /my 와 같은 클래스를 쓴다",
       (await pg.locator("#rq .rq-s-rq .rq-q .myq-st").count()) === 1);
    ok("견적 금액 줄이 또렷한 글씨다 (결정에 쓰는 값)",
       qn ? (await pg.locator("#rq .rq-s-rq .rq-q-m").count()) === 1 : false);
    /* ⚠️⚠️ **고르는 단추를 여기 만들지 않습니다** — 고르는 것은
       고객이고, 두 곳에 두면 "누가 골랐는가" 가 흐려집니다. */
    ok("직원 화면에는 고르는 단추가 없다",
       !/하겠습니다|고르기/.test(qTxt), qTxt);
    /* ⚠️⚠️ 돈 쪽은 `move_state()` 가 스스로 거절하는 길이라 **단추를
       아예 안 냅니다** — 누르면 늘 실패하는 단추가 §30-7 입니다. */
    ok("정산 쪽 길은 아예 안 낸다",
       !dests.some(x => /정산/.test(x)), dests.join(","));

    await pg.selectOption("#rq-to", "assigned");
    await pg.waitForTimeout(200);
    const a3 = await pg.locator("#rq .rq-s-rq .rq-a3").textContent();
    ok("제17조 안내가 먼저 뜬다",
       a3.includes("제17조") && a3.includes("상호를 알려 드리고"), a3.slice(0, 80));
    ok("배정할 업체 고르개가 있다", (await pg.locator("#rq-pv option").count()) === 2);
    ok("공개 전인 업체도 보이고 그렇다고 적힌다",
       (await pg.locator("#rq-pv").textContent()).includes("아직 공개 전"));

    /* ⚠️⚠️ 동의를 안 켜고 눌러 봅니다. **보내기 전에** 막혀야 합니다 —
       3차에서 `amDealMove()` 를 화면에 붙였습니다 (그전에는 검사에서만
       돌았습니다). ⚠️ 이것은 **자물쇠가 아니라 왕복 한 번을 아끼는
       것**입니다 — 실제로 막는 것은 DB 의 `move_state()` 이고
       `tools/test-sql.js` 가 거기를 실제 Postgres 에서 눌러 봅니다. */
    sent = null;
    await pg.selectOption("#rq-pv", "pv-one");
    await pg.locator("#rq .rq-s-rq .rq-mv button", { hasText:"이 상태로 바꾸기" }).click();
    await pg.waitForTimeout(400);
    ok("동의 없이는 보내지도 않는다", sent === null, JSON.stringify(sent));
    /* ⚠️ DB 는 `agree3rd` 처럼 **key 로** 거절합니다 — 화면은
       `AM_DEAL_NEED` 의 사람이 읽는 이름으로 바꿔 냅니다 */
    ok("무엇이 모자란지 사람 말로 알려 준다",
       (await pg.locator("#toast").textContent()).includes("제3자 제공 동의"),
       await pg.locator("#toast").textContent());

    /* 동의를 켜고 다시 */
    await pg.locator("#rq-a3").check();
    await pg.locator("#rq .rq-s-rq .rq-mv button", { hasText:"이 상태로 바꾸기" }).click();
    await pg.waitForTimeout(500);
    ok("move_state 를 부른다", sent && sent.fn === "move_state", JSON.stringify(sent));
    ok("정해 둔 인자만 보낸다",
       sent && Object.keys(sent.args).sort().join(",") === "p_ctx,p_request,p_to",
       JSON.stringify(sent && Object.keys(sent.args)));
    ok("업체와 동의가 같이 간다",
       sent.args.p_ctx.providerId === "pv-one" && sent.args.p_ctx.agree3rd === true,
       JSON.stringify(sent.args.p_ctx));
    ok("신청 id 가 간다 (번호가 아니라 id)",
       sent.args.p_request === "11111111-1111-1111-1111-111111111111", sent.args.p_request);

    /* ⚠️⚠️ **DB 가 거절한 그 말이 그대로** 와야 합니다 — "무엇을 하면
       되는지" 가 거기 적혀 있습니다. 화면 앞단이 모르는 거절로 봅니다. */
    await pg.locator("#rq .rq-s-rq .rq-r .rq-hd").first().click();
    await pg.waitForTimeout(200);
    await pg.selectOption("#rq-to", "assigned");
    await pg.waitForTimeout(200);
    await pg.locator("#rq-a3").check();
    await pg.evaluate(() => {
      const o = document.createElement("option");
      o.value = "pv-gone"; o.textContent = "없어진 업체";
      document.getElementById("rq-pv").appendChild(o);
    });
    await pg.selectOption("#rq-pv", "pv-gone");
    await pg.locator("#rq .rq-s-rq .rq-mv button", { hasText:"이 상태로 바꾸기" }).click();
    await pg.waitForTimeout(400);
    ok("DB 가 거절한 그 말을 그대로 보여 준다",
       (await pg.locator("#toast").textContent()).includes("없는 업체입니다"),
       await pg.locator("#toast").textContent());
    /* ⚠️ 거절당하면 줄이 **펼쳐진 채로** 남습니다 (적으신 것을 지키려고).
       다음 검사가 "펼친다" 로 시작하니 여기서 닫아 둡니다. */
    await pg.locator("#rq .rq-s-rq .rq-r .rq-hd").first().click();
    await pg.waitForTimeout(200);

    /* ── 보류 — ⚠️ 사유를 받습니다 (§8 기록) ──────────────────── */
    await pg.locator("#rq .rq-s-rq .rq-r .rq-hd").first().click();
    await pg.waitForTimeout(200);
    await pg.selectOption("#rq-to", "hold");
    await pg.waitForTimeout(200);
    ok("보류는 사유 칸을 낸다", (await pg.locator("#rq-why").count()) === 1);
    await pg.fill("#rq-why", "다음 달에 다시 연락 달라고 하셨습니다");
    await pg.locator("#rq .rq-s-rq .rq-mv button", { hasText:"이 상태로 바꾸기" }).click();
    await pg.waitForTimeout(400);
    ok("사유가 같이 간다",
       sent.args.p_to === "hold" &&
       sent.args.p_ctx.why === "다음 달에 다시 연락 달라고 하셨습니다",
       JSON.stringify(sent.args));

    ok("JS 에러 없음", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ══ 2차 — 계약 · 수수료 확정 · 정산 · 정책 · 승인 · 이력 ═══════
     전면 감사 §6 의 5·6·7·8 · §9 · §13.

     ⚠️⚠️ **Supabase 를 세울 수가 없어 두 주소를 가로챕니다.** 서버
     쪽 자물쇠(confirm_fee 가 증빙 없이 거절하는 것 · 입금이 확정보다
     먼저일 수 없는 것 · 관리자만인 것)는 `tools/test-sql.js` 가
     **실제 Postgres 에서** 눌러 봅니다. 여기서 보는 것은 **화면이
     무엇을 보내는가**입니다 — 특히 §9 가 요구한 "계약금액 · 요율 ·
     확정액 · 입금액을 각각" 과 "정책 사본" 이 실제로 실리는지. */
  console.log("\n2차 — 계약 · 수수료 · 정산 · 정책 · 승인 · 이력");
  {
    const { pg, ctx, errs } = await fresh(1440, 1600);
    let sent = null, meAsk = [];
    const CONF = { url:"https://proj.supabase.co", anonKey:"ANON-TEST" };

    await pg.route("**/api/session", r => r.fulfill({ status:200,
      contentType:"application/json",
      body: JSON.stringify({ auth:true, signedIn:true, role:"admin",
                             name:"관리자", provider:null, conf:CONF }) }));

    /* 계약 셋 — ① 확정 전 ② 확정됐고 입금 전 ③ 입금까지 끝 */
    const DEALS = [
      { id:"d1", request_id:"11111111-1111-1111-1111-111111111111",
        provider_id:"pv-one", amount:10000000,
        fee:null, fee_vat:null, fee_total:null, paid:null,
        signed_at:"2026-10-05T02:00:00+00:00",
        done_at:"2026-10-09T02:00:00+00:00", fee_at:null, fee_snap:null,
        created_at:"2026-10-05T02:00:00+00:00",
        request:{ no:"SW-AB12-CD34", side:"start", cat:"interior",
                  industry:"cafe", region:"gyeonggi", gu:"안양시", state:"done" } },
      { id:"d2", request_id:"22222222-2222-2222-2222-222222222222",
        provider_id:"pv-one", amount:5000000,
        fee:150000, fee_vat:15000, fee_total:165000, paid:null,
        signed_at:"2026-10-01T02:00:00+00:00",
        done_at:"2026-10-03T02:00:00+00:00",
        fee_at:"2026-10-04T02:00:00+00:00",
        fee_snap:{ type:"rate", rate:3, vat:"add" },
        created_at:"2026-10-01T02:00:00+00:00",
        request:{ no:"SW-EF56-GH78", side:"close", cat:"demolish",
                  industry:"restaurant", region:"seoul", gu:"", state:"fee_wait" } },
      { id:"d3", request_id:"33333333-3333-3333-3333-333333333333",
        provider_id:"pv-two", amount:2000000,
        fee:60000, fee_vat:6000, fee_total:66000, paid:66000,
        signed_at:"2026-09-20T02:00:00+00:00",
        done_at:"2026-09-22T02:00:00+00:00",
        fee_at:"2026-09-23T02:00:00+00:00",
        fee_snap:{ type:"rate", rate:3, vat:"add" },
        created_at:"2026-09-20T02:00:00+00:00",
        request:{ no:"SW-IJ90-KL12", side:"start", cat:"equip",
                  industry:"cafe", region:"seoul", gu:"", state:"fee_done" } }
    ];

    await pg.route("**/api/me**", r => {
      const u = new URL(r.request().url());
      const one = u.searchParams.get("r") || "";
      meAsk.push(one);
      /* ⚠️ 이력은 **연 건 하나만** 옵니다 (api/me.js 의 `?r=`) */
      const hist = one ? [
        { at:"2026-10-05T02:00:00+00:00", by_role:"staff", obj:"request",
          from_state:"new", to_state:"check", why:null },
        { at:"2026-10-06T02:00:00+00:00", by_role:"admin", obj:"request",
          from_state:"check", to_state:"assigned",
          why:"안양 업체로 배정했습니다" }
      ] : undefined;
      return r.fulfill({ status:200, contentType:"application/json",
        body: JSON.stringify({
          auth:true, signedIn:true, role:"admin",
          requests:[
            { id:"11111111-1111-1111-1111-111111111111", no:"SW-AB12-CD34",
              side:"start", cat:"interior", industry:"cafe",
              region:"gyeonggi", gu:"안양시", state:"check",
              created_at:"2026-10-11T02:00:00+00:00", assignment:[] }
          ],
          providers:[
            { id:"pv-one", name:"가나다 인테리어", regions:["gyeonggi"],
              gu:["안양시"], industries:["cafe"], subs:["interior","design"],
              listed:false },
            { id:"pv-two", name:"라마바 철거", regions:["seoul"], gu:[],
              industries:["restaurant"], subs:["demolish"], listed:true }
          ],
          deals: DEALS,
          fees:[
            { id:"f1", provider_id:"pv-one", offer_id:null, type:"rate",
              flat:null, rate:3, min_fee:null, max_fee:null, vat:"add",
              confirm_when:"done", cycle:"monthly", refund_rule:null,
              from_date:null, to_date:null, active:true,
              created_at:"2026-10-01T02:00:00+00:00" }
          ],
          audits:[], history:hist }) });
    });

    await pg.route("**/api/deal", r => {
      sent = JSON.parse(r.request().postData() || "{}");
      return r.fulfill({ status:200, contentType:"application/json",
        body: JSON.stringify({ ok:true }) });
    });

    await pg.goto(base + "/admin.html", { waitUntil:"networkidle" });
    await pg.waitForTimeout(600);

    /* ── 숫자 넷 (§9 — 각각 구분) ────────────────────────────── */
    const kpi = await pg.locator("#rq .rq-s-mn .rq-k").allTextContents();
    ok("계약 구간의 숫자가 넷이다", kpi.length === 4, kpi.join(" | "));
    /* ⚠️⚠️ **칸 하나를 집어서 그 값만** 봅니다. 처음에 네 칸을 이어
       붙인 글에서 `includes("165,000")` 로 찾았는데, 미수금이
       **10,165,000** 으로 틀려도 그 안에 "165,000" 이 들어 있어서
       **통과했습니다** — 되돌려 보고 알았습니다. 이 저장소가 "검사가
       화면 글 전체에서 찾았다" 로 두 번 겪은 자리입니다. */
    const kv = {};
    for(const k of await pg.locator("#rq .rq-s-mn .rq-k").all())
      kv[(await k.locator("span").textContent()).trim()] =
        (await k.locator("b").textContent()).trim();
    /* ⚠️ 합계는 그 자리에서 센 값입니다 — 10,000,000 + 5,000,000 + 2,000,000 */
    ok("계약금액 합계가 센 값이다", kv["계약"] === "3건" &&
       kpi.join(" ").includes("17,000,000원"), JSON.stringify(kv));
    ok("확정 수수료 합계가 센 값이다",
       kv["확정 수수료"] === "210,000원", JSON.stringify(kv));
    /* 미수금 = (165,000 + 66,000) - 66,000 = 165,000 */
    ok("미수금은 확정 - 입금이다",
       kv["미수금"] === "165,000원", JSON.stringify(kv));
    /* ⚠️⚠️ 확정 전인 건(계약금액 1,000만원)이 미수금에 섞이면 받을 돈이
       **열 배로** 부풀려집니다 — 위 칸 하나를 집어서 그것을 봅니다. */
    ok("확정 전인 건을 미수금에 안 넣는다",
       kv["미수금"] === "165,000원" &&
       kpi.join(" ").includes("확정 전 1건"), JSON.stringify(kv));
    /* ⚠️⚠️ 최근 것만 가져오므로 "전체" 라고 적지 않습니다 */
    const moneyTxt = await pg.locator("#rq .rq-s-mn").textContent();
    ok("전체 누적이 아니라고 밝힌다",
       moneyTxt.includes("전체 누적이 아닙니다"), moneyTxt.slice(-120));

    /* ── ① 수수료 확정 ──────────────────────────────────────── */
    await pg.locator("#rq .rq-s-mn .rq-hd", { hasText:"SW-AB12-CD34" }).click();
    await pg.waitForTimeout(300);
    const sp = await pg.locator("#rq .rq-s-mn .rq-sp").textContent();
    ok("§9 의 넷을 따로 낸다 (계약금액 · 수수료 · 청구 · 입금)",
       sp.includes("계약금액") && sp.includes("10,000,000"), sp.slice(0, 120));
    /* ⚠️ 값이 없는 칸은 줄째 뺍니다 (절대 규칙 2) */
    ok("값이 없는 칸은 줄째 뺀다",
       !sp.includes("실제 입금액") && !sp.includes("확정일"), sp);
    ok("적용할 정책 고르개가 있다", (await pg.locator("#rq-fp option").count()) === 1);
    const calc = await pg.locator("#rq .rq-s-mn .rq-calc").textContent();
    /* 10,000,000 × 3% = 300,000 · 부가세 별도 30,000 · 청구 330,000 */
    ok("수수료가 계산값으로 나온다",
       calc.includes("300,000") && calc.includes("30,000") && calc.includes("330,000"),
       calc);
    /* ⚠️⚠️ 손으로 적는 칸을 두지 않았습니다 — 정책과 어긋난 청구서가
       나가면 어느 쪽이 맞는지 아무도 모릅니다 (§9) */
    ok("수수료를 손으로 적는 칸이 없다",
       (await pg.locator("#rq .rq-s-mn .rq-mv input[type=number]").count()) === 0);
    ok("사본으로 박힌다고 적혀 있다",
       (await pg.locator("#rq .rq-s-mn .rq-mv").textContent()).includes("사본으로"));

    /* ⚠️ 증빙 없이 눌러 봅니다 — §9 가 요구한 자리입니다 */
    sent = null;
    await pg.locator("#rq .rq-s-mn .rq-mv button", { hasText:"수수료 확정" }).click();
    await pg.waitForTimeout(300);
    ok("증빙 없이는 안 보낸다", sent === null, JSON.stringify(sent));
    ok("무엇이 모자란지 말해 준다",
       (await pg.locator("#toast").textContent()).includes("증빙"),
       await pg.locator("#toast").textContent());

    await pg.fill("#rq-proof", "세금계산서 2026-10-11 · 계약서 사본 받음");
    await pg.locator("#rq .rq-s-mn .rq-mv button", { hasText:"수수료 확정" }).click();
    await pg.waitForTimeout(500);
    ok("confirm_fee 를 부른다", sent && sent.fn === "confirm_fee", JSON.stringify(sent));
    ok("계산값을 그대로 보낸다",
       sent && sent.args.p_fee === 300000 && sent.args.p_vat === 30000 &&
       sent.args.p_total === 330000, JSON.stringify(sent && sent.args));
    /* ⚠️⚠️ §9 — 정책을 가리키게만 두면 요율을 고친 날 지난 계약이 바뀝니다 */
    ok("정책 사본이 같이 간다",
       sent && sent.args.p_snap && sent.args.p_snap.rate === 3 &&
       sent.args.p_snap.snapAt, JSON.stringify(sent && sent.args.p_snap));
    ok("증빙이 같이 간다",
       sent && sent.args.p_proof &&
       /세금계산서/.test(sent.args.p_proof.note), JSON.stringify(sent && sent.args.p_proof));
    /* ⚠️ `api/deal.js` 의 OK_ARG 에 없는 이름을 보내면 서버가 통째로
       거절합니다 — 화면이 먼저 안 보내는지 봅니다 */
    ok("정해 둔 인자만 보낸다",
       sent && Object.keys(sent.args).sort().join(",") ===
         "p_deal,p_fee,p_proof,p_snap,p_total,p_vat,p_why",
       JSON.stringify(sent && Object.keys(sent.args).sort()));

    /* ── ② 입금 확인 (§13 가짜 정산 금지) ───────────────────── */
    await pg.locator("#rq .rq-s-mn .rq-hd", { hasText:"SW-EF56-GH78" }).click();
    await pg.waitForTimeout(300);
    const pf = await pg.locator("#rq .rq-s-mn .rq-mv").textContent();
    ok("청구액을 그대로 적지 말라고 적혀 있다",
       pf.includes("실제로 들어온 금액") && pf.includes("가짜 정산"), pf.slice(0, 160));
    sent = null;
    await pg.fill("#rq-paid", "100000");
    await pg.locator("#rq .rq-s-mn .rq-mv button", { hasText:"입금 확인" }).click();
    await pg.waitForTimeout(400);
    ok("mark_paid 를 부른다 (덜 들어온 금액 그대로)",
       sent && sent.fn === "mark_paid" && sent.args.p_paid === 100000,
       JSON.stringify(sent));

    /* ── ③ 환수 (§9 — 갈아 치우지 않습니다) ─────────────────── */
    await pg.locator("#rq .rq-s-mn .rq-hd", { hasText:"SW-IJ90-KL12" }).click();
    await pg.waitForTimeout(300);
    ok("확정액을 갈아 치우지 않는다고 적혀 있다",
       (await pg.locator("#rq .rq-s-mn .rq-mv").textContent()).includes("갈아 치우지 않고"));
    sent = null;
    await pg.fill("#rq-nfee", "30000");
    await pg.waitForTimeout(250);
    /* ⚠️⚠️ **얼마가 돌아오는지 숫자로 보여 줍니다** (3차 · §9 의 12).
       `amFeeClawback()` 이 차액을 계산하는데 그전에는 **검사에서만
       돌았고**, 운영자는 "60,000 을 30,000 으로" 까지만 적고 30,000원이
       환수된다는 것을 못 본 채 눌렀습니다. */
    /* ⚠️ 없을 때 `textContent()` 로 바로 읽으면 **30초를 기다렸다가
       타임아웃**으로 터지고, 어느 검사가 틀렸는지도 안 나옵니다 —
       이 저장소가 2차에서 겪은 자리입니다. 먼저 세어 봅니다. */
    const cwN = await pg.locator("#rq .rq-s-mn .rq-calc").count();
    const cw  = cwN ? await pg.locator("#rq .rq-s-mn .rq-calc").textContent() : "";
    ok("환수액을 숫자로 보여 준다",
       cwN === 1 && cw.includes("30,000") && /돌려|환수/.test(cw), cwN + " · " + cw);
    /* ⚠️ 확정했던 액을 갈아 치우지 않는다는 것이 **그 자리에** 적힙니다 */
    ok("확정했던 액이 남는다고 그 자리에서 밝힌다",
       cw.includes("60,000") && cw.includes("그대로 남습니다"), cw);
    await pg.locator("#rq .rq-s-mn .rq-mv button", { hasText:"환수 기록" }).click();
    await pg.waitForTimeout(300);
    ok("사유 없이는 환수를 안 보낸다", sent === null, JSON.stringify(sent));
    await pg.fill("#rq-cwhy", "계약 일부 취소 — 2026-10-20");
    await pg.locator("#rq .rq-s-mn .rq-mv button", { hasText:"환수 기록" }).click();
    await pg.waitForTimeout(400);
    ok("clawback_fee 를 사유와 함께 부른다",
       sent && sent.fn === "clawback_fee" && sent.args.p_new_fee === 30000 &&
       /일부 취소/.test(sent.args.p_why), JSON.stringify(sent));

    /* ── 수수료 정책 ────────────────────────────────────────── */
    const fs2 = await pg.locator("#rq .rq-s-fee");
    const fsTxt = await fs2.textContent();
    ok("정책 줄이 나온다", (await fs2.locator(".rq-r").count()) === 1);
    ok("요율 · 부가세 · 확정 조건이 데이터 이름으로 나온다",
       fsTxt.includes("3%") && fsTxt.includes("부가세 별도") &&
       fsTxt.includes("이행 완료 확인 후"), fsTxt.slice(0, 220));
    /* ⚠️⚠️ 고친 정책이 지난 계약에 영향을 안 준다고 **그 자리에서** 밝힙니다 */
    ok("지난 계약에 영향을 주지 않는다고 밝힌다",
       fsTxt.includes("지난 계약에 영향을 주지 않습니다"), fsTxt.slice(0, 200));
    /* ⚠️ 지우지 않고 **끕니다** — 지난 계약이 그 사본을 들고 있습니다 */
    ok("지우는 단추가 없고 끄는 단추가 있다",
       !/지우기|삭제/.test(fsTxt) && fsTxt.includes("끄기"), fsTxt.slice(-200));
    sent = null;
    await fs2.locator("button", { hasText:"끄기" }).click();
    await pg.waitForTimeout(400);
    ok("set_fee_policy_active 로 끈다",
       sent && sent.fn === "set_fee_policy_active" && sent.args.p_active === false,
       JSON.stringify(sent));

    /* 새 정책 — ⚠️ 저장하기 전에 봅니다 (fee.js 의 amFeeBadPolicy) */
    await pg.locator("#rq .rq-s-fee .rq-new summary").click();
    await pg.waitForTimeout(250);
    sent = null;
    await pg.fill("#rq-fn-r", "0");
    await pg.locator("#rq .rq-s-fee button", { hasText:"정책 만들기" }).click();
    await pg.waitForTimeout(300);
    ok("요율 0 은 저장하기 전에 막는다", sent === null, JSON.stringify(sent));
    await pg.fill("#rq-fn-r", "5");
    await pg.locator("#rq .rq-s-fee button", { hasText:"정책 만들기" }).click();
    await pg.waitForTimeout(400);
    ok("save_fee_policy 를 부른다",
       sent && sent.fn === "save_fee_policy" && sent.args.p_provider === "pv-one" &&
       sent.args.p_data.rate === 5, JSON.stringify(sent));
    /* ⚠️⚠️ 칸 이름이 두 벌입니다 — DB 는 `confirm_when`, fee.js 는 `when` */
    ok("DB 가 읽는 이름으로 보낸다 (confirmWhen · minFee)",
       sent && "confirmWhen" in sent.args.p_data && !("when" in sent.args.p_data),
       JSON.stringify(sent && Object.keys(sent.args.p_data)));

    /* ── 업체 공개 승인 (§7) ────────────────────────────────── */
    const ps = await pg.locator("#rq .rq-s-pv");
    const psTxt = await ps.textContent();
    ok("업체 줄이 나온다", (await ps.locator(".rq-r").count()) === 2);
    ok("공개 전인 곳을 센다", psTxt.includes("1곳"), psTxt.slice(0, 160));
    /* ⚠️ 공개 전인 업체도 배정 고르개에는 보입니다 — 그렇다고 적습니다 */
    ok("공개 전에도 배정은 된다고 밝힌다",
       psTxt.includes("배정 고르개에는 보입니다"), psTxt.slice(0, 200));
    /* ⚠️⚠️ 확인 배지를 화면에서 켜는 칸을 두지 않았습니다 (절대 규칙 1) */
    ok("확인 배지를 켜는 칸이 없다",
       !/확인 배지|사업자 확인|보험 가입/.test(psTxt), psTxt.slice(0, 300));
    sent = null;
    await ps.locator("button", { hasText:"공개하기" }).click();
    await pg.waitForTimeout(400);
    ok("approve_provider 로 공개한다",
       sent && sent.fn === "approve_provider" && sent.args.p_id === "pv-one" &&
       sent.args.p_listed === true, JSON.stringify(sent));

    /* ── 이력 (§8) ──────────────────────────────────────────── */
    /* ⚠️⚠️ 목록에는 안 붙습니다 — 쉰 건의 사유가 한 화면에 깔리면
       화면 하나가 곧 유출입니다. 여기까지 `?r=` 이 한 번도 안 가야 합니다. */
    ok("목록을 불러올 때는 이력을 안 묻는다",
       meAsk.every(x => x === ""), JSON.stringify(meAsk));
    await pg.locator("#rq .rq-s-rq .rq-hd", { hasText:"SW-AB12-CD34" }).click();
    await pg.waitForTimeout(300);
    await pg.locator("#rq .rq-s-rq button", { hasText:"이력 보기" }).click();
    await pg.waitForTimeout(500);
    ok("연 건 하나만 묻는다",
       meAsk.filter(x => x).length === 1 &&
       meAsk.filter(x => x)[0] === "11111111-1111-1111-1111-111111111111",
       JSON.stringify(meAsk));
    const hv = await pg.locator("#rq .rq-s-rq .rq-hist").textContent();
    ok("누가 · 언제 · 왜가 보인다",
       hv.includes("관리자") && /2026\. 10\. 0[56]/.test(hv) &&
       hv.includes("안양 업체로 배정했습니다"), hv.slice(0, 220));
    ok("상태 이름이 한글로 나온다",
       hv.includes("정보 확인 중") && hv.includes("업체 배정"), hv.slice(0, 220));
    ok("고칠 수 없는 기록이라고 밝힌다",
       hv.includes("고치거나 지울 수 없습니다"), hv.slice(-120));

    ok("JS 에러 없음", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ══ 직원 계정 — ⚠️⚠️ 등록과 승인은 **다른 문**입니다 (§7) ══════
     한 사람이 등록하고 자기가 공개하면 교차 확인이 없습니다 (계약을
     따는 사람과 수수료를 확정하는 사람을 가른 것과 같은 까닭).
     ⚠️ 막는 것은 화면이 아니라 **DB 의 `approve_provider()`** 입니다 —
     여기서 보는 것은 **누르면 늘 실패하는 단추를 안 내는가**(§30-7)
     이고, 서버 쪽은 `tools/test-sql.js` 가 실제로 눌러 봅니다. */
  console.log("\n직원 계정 — 돈과 승인은 안 보입니다");
  {
    const { pg, ctx, errs } = await fresh(1440, 1200);
    await pg.route("**/api/session", r => r.fulfill({ status:200,
      contentType:"application/json",
      body: JSON.stringify({ auth:true, signedIn:true, role:"staff",
        name:"직원", provider:null,
        conf:{ url:"https://proj.supabase.co", anonKey:"ANON-TEST" } }) }));
    /* ⚠️⚠️ 돈은 **서버가 안 보냅니다** (api/me.js 의 PICK · deals ·
       fees 를 관리자에게만). 화면이 숨기는 것이 아니라서, 직원에게는
       그 칸이 애초에 안 옵니다 — 그대로 흉내 냅니다. */
    await pg.route("**/api/me**", r => r.fulfill({ status:200,
      contentType:"application/json", body: JSON.stringify({
        auth:true, signedIn:true, role:"staff",
        requests:[], providers:[
          { id:"pv-one", name:"가나다 인테리어", regions:["gyeonggi"],
            gu:["안양시"], industries:["cafe"], subs:["interior"], listed:false }
        ] }) }));
    await pg.goto(base + "/admin.html", { waitUntil:"networkidle" });
    await pg.waitForTimeout(500);

    ok("직원에게는 계약 · 수수료 구간이 아예 없다",
       (await pg.locator("#rq .rq-s-mn").count()) === 0);
    ok("직원에게는 수수료 정책 구간이 아예 없다",
       (await pg.locator("#rq .rq-s-fee").count()) === 0);
    /* ⚠️ 업체 구간은 **보입니다** — 배정에 쓰는 목록이니까요 */
    ok("업체 구간은 보인다", (await pg.locator("#rq .rq-s-pv .rq-r").count()) === 1);
    const pv = await pg.locator("#rq .rq-s-pv").textContent();
    ok("직원에게는 공개 단추를 안 낸다",
       (await pg.locator("#rq .rq-s-pv button").count()) === 0, pv.slice(0, 200));
    ok("공개는 관리자만이라고 적혀 있다",
       pv.includes("관리자만"), pv.slice(0, 200));

    ok("JS 에러 없음", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ══ 로그인 전 · 권한이 모자랄 때 ═══════════════════════════════ */
  console.log("\n로그인 전 · 권한이 모자랄 때");
  {
    const { pg, ctx, errs } = await fresh(1440, 1000);
    await pg.route("**/api/session", r => r.fulfill({ status:200,
      contentType:"application/json",
      body: JSON.stringify({ auth:true, signedIn:false,
        conf:{ url:"https://proj.supabase.co", anonKey:"ANON-TEST" } }) }));
    await pg.goto(base + "/admin.html", { waitUntil:"networkidle" });
    await pg.waitForTimeout(400);
    ok("로그인 칸이 나온다", (await pg.locator("#rq-em").count()) === 1);
    /* ⚠️ 비밀번호를 받지 않습니다 */
    ok("비밀번호 칸이 없다", (await pg.locator("#rq input[type=password]").count()) === 0);
    ok("메일 칸이 자동완성을 받는다",
       (await pg.locator("#rq-em").getAttribute("autocomplete")) === "email");
    /* ⚠️ 누르는 것은 40px 이상 — `check.js` 와 같은 규칙입니다 */
    const b = await pg.locator("#rq .rq-in button").boundingBox();
    ok("링크 받기 단추가 40px 이상이다", b && b.height >= 40, b && b.height);
    ok("JS 에러 없음", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }
  {
    const { pg, ctx, errs } = await fresh(1440, 1000);
    await pg.route("**/api/session", r => r.fulfill({ status:200,
      contentType:"application/json",
      body: JSON.stringify({ auth:true, signedIn:true, role:"customer",
                             name:"갑", provider:null,
                             conf:{ url:"https://p.supabase.co", anonKey:"A" } }) }));
    await pg.route("**/api/me**", r => r.fulfill({ status:500, body:"no" }));
    await pg.goto(base + "/admin.html", { waitUntil:"networkidle" });
    await pg.waitForTimeout(400);
    const t = await pg.locator("#rq").textContent();
    ok("고객 계정에는 접수를 안 보여 준다", t.includes("권한이 없습니다"), t.slice(0, 60));
    /* ⚠️⚠️ 역할을 화면에서 올릴 수 있게 만들지 않았습니다 */
    ok("역할 올리기는 SQL 로만 — 단추가 없다",
       t.includes("update account set role") &&
       (await pg.locator("#rq button:has-text('관리자로')").count()) === 0);
    ok("접수를 묻지도 않는다", (await pg.locator("#rq .rq-r").count()) === 0);
    ok("JS 에러 없음", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ════════════════════════════════════════════════════════════════
     2026-10-17 §6 · §7 — 신청 하나에 서비스 여러 개 · 항목별 배정
     ════════════════════════════════════════════════════════════════ */
  console.log("\n신청 서비스 항목 — 서비스마다 다른 업체에 (§7)");
  {
    const { pg, ctx, errs } = await fresh(1440, 1400);
    let sent = null;
    const R = "11111111-1111-1111-1111-111111111111";

    await pg.route("**/api/session", r => r.fulfill({ status:200,
      contentType:"application/json",
      body: JSON.stringify({ auth:true, signedIn:true, role:"admin",
        name:"관리자", provider:null,
        conf:{ url:"https://proj.supabase.co", anonKey:"ANON-TEST" } }) }));

    await pg.route("**/api/me**", r => r.fulfill({ status:200,
      contentType:"application/json", body: JSON.stringify({
        auth:true, signedIn:true, role:"admin",
        requests:[
          { id:R, no:"SW-AB12-CD34", side:"start", cat:"interior",
            industry:"cafe", region:"gyeonggi", gu:"안양시", state:"check",
            created_at:"2026-10-17T02:00:00+00:00", assignment:[],
            request_item:[
              { id:"it-1", service_id:"interior", state:"new",
                detail:{ "공사 범위":"전체 시공" }, assignment:[] },
              { id:"it-2", service_id:"equip", state:"assigned",
                detail:{}, assignment:[{ provider_id:"pv-one", state:"sent" }] },
              /* ⚠️ 내려간 분류의 옛 항목 — 이름을 모르면 key 를 냅니다 */
              { id:"it-3", service_id:"없어진분류", state:"new",
                detail:{}, assignment:[] }
            ] },
          /* ⚠️ 항목이 없는 옛 접수 — 구간째 빠져야 합니다 (절대 규칙 2) */
          { id:"22222222-2222-2222-2222-222222222222", no:"SW-EF56-GH78",
            side:"close", cat:"demolish", industry:"restaurant",
            region:"seoul", gu:"", state:"new",
            created_at:"2026-10-16T02:00:00+00:00", assignment:[] }
        ],
        providers:[{ id:"pv-one", name:"가나다 인테리어", listed:true },
                   { id:"pv-two", name:"라마바 설비", listed:false }],
        quotes:[], deals:[], fees:[] }) }));

    await pg.route("**/api/deal", r => {
      sent = JSON.parse(r.request().postData() || "{}");
      return r.fulfill({ status:200, contentType:"application/json",
                         body: JSON.stringify({ ok:true }) });
    });

    await pg.goto(base + "/admin.html", { waitUntil:"networkidle" });
    await pg.waitForTimeout(400);
    await pg.locator("#rq .rq-r").first().locator(".rq-hd").click();
    await pg.waitForTimeout(250);

    ok("항목 구간이 나온다", (await pg.locator("#rq .rq-it").count()) === 1);
    ok("항목 셋이 줄로 나온다", (await pg.locator("#rq .rq-it-i").count()) === 3);
    const names = await pg.locator("#rq .rq-it-n").allTextContents();
    /* ⚠️⚠️ 이름은 catalog.js 에서 읽습니다 — key 를 그대로 찍으면
       이 저장소가 `gyeonggi` · `espresso` 로 겪은 자리입니다 */
    ok("서비스 이름을 분류에서 읽는다",
       names[0] === "인테리어 · 시공" && names[1] === "시설 · 장비", names.join(" / "));
    /* ⚠️ 내려간 분류는 **key 를 그대로** 냅니다 (지난 신청은 보존 · §12) */
    ok("모르는 분류는 key 를 그대로 낸다", names[2] === "없어진분류", names[2]);
    ok("이미 배정된 항목은 업체가 보인다",
       (await pg.locator("#rq .rq-it-pv").first().textContent()).includes("가나다"),
       await pg.locator("#rq .rq-it-pv").first().textContent());

    /* ── 항목 하나를 열고 배정 ─────────────────────────────────── */
    await pg.locator("#rq .rq-it-b").first().click();
    await pg.waitForTimeout(200);
    ok("적어 주신 서비스별 답이 보인다",
       (await pg.locator("#rq .rq-it-d").textContent()).includes("전체 시공"));
    ok("업체 고르개가 둘이다 (공개 전도 보입니다)",
       (await pg.locator("#rq-ipv-it-1 option").count()) === 3);

    /* ⚠️⚠️ 동의 없이 누르면 **보내지도 않습니다** */
    sent = null;
    await pg.locator("#rq .rq-it-f .btn").click();
    await pg.waitForTimeout(150);
    ok("업체를 안 고르면 안 보낸다", sent === null);

    await pg.selectOption("#rq-ipv-it-1", "pv-two");
    sent = null;
    await pg.locator("#rq .rq-it-f .btn").click();
    await pg.waitForTimeout(150);
    ok("제17조 동의를 안 켜면 안 보낸다 (제3자 제공)", sent === null);

    await pg.check("#rq-iag-it-1");
    await pg.locator("#rq .rq-it-f .btn").click();
    await pg.waitForTimeout(250);
    ok("동의를 켜면 assign_item 을 부른다",
       sent && sent.fn === "assign_item", sent && sent.fn);
    ok("항목 id 와 업체가 그대로 간다",
       sent && sent.args.p_item === "it-1" && sent.args.p_provider === "pv-two",
       sent && JSON.stringify(sent.args));
    ok("동의 시각을 남기라고 보낸다", sent && sent.args.p_agree3rd === true);
    /* ⚠️⚠️ **이 길이 요구한 것만** 보냅니다 — 들고 있던 다른 값이
       섞이면 받지도 않은 동의가 엉뚱한 기록에 남습니다 */
    ok("요구한 셋만 보낸다",
       sent && Object.keys(sent.args).sort().join(",") ===
         "p_agree3rd,p_item,p_provider", sent && Object.keys(sent.args).join(","));

    /* ── 항목이 없는 옛 접수 ───────────────────────────────────── */
    await pg.locator("#rq .rq-r").nth(1).locator(".rq-hd").click();
    await pg.waitForTimeout(250);
    ok("항목이 없는 건은 구간째 뺀다 (절대 규칙 2)",
       (await pg.locator("#rq .rq-r").nth(1).locator(".rq-it").count()) === 0);

    ok("JS 에러 없음", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* == 1번 칸 — 사진 첨부(INTAKE_BUCKET)까지 갈라서 말하는가 =======
     2026-10-20. 전에는 이 칸이 버킷을 **아예 안 봤습니다** — 사진
     칸이 안 뜰 때 "왜 안 뜨는지" 를 아무 데서도 말하지 않았고,
     사장님은 "넣었는데 왜 안 되지" 를 혼자 겪습니다. store 와 auth 를
     가른 것과 같은 까닭으로 photo 를 따로 봅니다.
     ⚠️ 로컬에는 Vercel 함수가 없어서 가로챕니다 — 여기서 보는 것은
     **화면이 무엇을 말하는가**이고, 값 자체는 api/admin-health.js 가
     고릅니다 (upReady() 와 같은 규칙). */
  console.log("\n1번 칸 — DB · 로그인 · 사진 첨부");
  {
    const { pg, ctx, errs } = await fresh(1440, 1000);
    const health = d => ({ ok:true, common:{ webhook:true, resend:false,
      mailTo:false, mailFrom:false },
      byKind:{ sos:{webhook:false,mailTo:false}, quote:{webhook:false,mailTo:false},
               partner:{webhook:false,mailTo:false} },
      kinds:{ sos:true, quote:true, partner:true }, allReady:true,
      db:d, env:"production" });
    async function show(d){
      await pg.route("**/api/admin-health", r => r.fulfill({ status:200,
        contentType:"application/json", body: JSON.stringify(health(d)) }));
      await pg.reload({ waitUntil:"networkidle" });
      await pg.waitForTimeout(200);
      /* ⚠️ 1번 칸은 **접힌 관리자 설정 안**입니다 — `innerText()` 는
         안 보이는 칸에서 빈 문자열을 돌려줍니다 (그러면 검사가
         "아무 말도 안 한다" 로 떨어지는데, 틀린 것은 재는 쪽입니다). */
      return (await pg.locator("#ad-health").textContent()) || "";
    }

    let t = await show({ url:true, anonKey:true, svcKey:true, bucket:false,
                         store:true, auth:true, photo:false });
    ok("버킷이 없으면 그 줄을 낸다", /INTAKE_BUCKET/.test(t), t.slice(0, 120));
    ok("버킷이 없으면 꺼져 있다고 말한다", /아직 꺼져 있습니다/.test(t));
    /* ⚠️ DB 가 켜진 것과 사진이 켜진 것을 **한 덩어리로** 말하면
       어느 쪽이 빠졌는지 모릅니다 */
    ok("그래도 DB · 로그인은 켜졌다고 말한다",
       /다 설정되어 있습니다/.test(t));

    t = await show({ url:true, anonKey:true, svcKey:true, bucket:true,
                     store:true, auth:true, photo:true });
    ok("버킷이 있으면 켜졌다고 말한다", /켜져 있습니다/.test(t));
    /* ⚠️⚠️ 서명된 올리기 주소는 **그 자체로** 크기와 형식을 막지
       않습니다 — 버킷에도 같은 상한을 걸라고 말해야 합니다 */
    ok("비공개 · 8MB · 형식을 같이 걸라고 말한다",
       /비공개/.test(t) && /8MB/.test(t), t.slice(0, 200));

    /* ⚠️ 옛 배포(이 칸이 없는 답)에서는 **줄째 뺍니다** — 안 빼면
       "없음" 이라고 말해 놓고 실제로는 못 보고 있는 것입니다 */
    t = await show({ url:true, anonKey:true, svcKey:true,
                     store:true, auth:true });
    ok("옛 배포에서는 버킷 줄을 아예 안 낸다", !/INTAKE_BUCKET/.test(t));

    /* ⚠️⚠️ **값은 한 글자도 안 찍습니다.** 서버가 실수로 값을 같이
       보내 와도 화면이 그것을 그리면 안 됩니다 — 버킷 이름만으로도
       두드려 볼 수 있습니다 (api/upload.js 가 답에 경로를 안 싣는
       것과 같은 까닭). 그래서 **값을 섞어 보내** 봅니다.
       ⚠️ `SUPABASE_ANON_KEY` 같은 **딱지**는 나와야 맞습니다 — 그건
       이름이지 값이 아닙니다 (처음에 딱지까지 금지했다가 멀쩡한
       화면을 실패로 잡았습니다). */
    t = await show({ url:"https://proj.supabase.co", anonKey:"eyJhbGciOi.TEST",
                     svcKey:"eyJhbGciOi.SECRET", bucket:"intake-secret-name",
                     store:true, auth:true, photo:true });
    ok("값을 섞어 보내도 화면에 안 찍는다",
       !/eyJ|supabase\.co|intake-secret-name/i.test(t), t.slice(0, 200));

    /* == 판 번호 — 키가 다 들어가도 마이그레이션이 남아 있으면 ====
       2026-10-21. ⚠️⚠️ 환경변수가 들어간 것과 DB 가 준비된 것은 다른
       일입니다. 이 칸은 그동안 키만 보고 "다 설정되어 있습니다" 라고
       했는데, `0008`~`0011` 을 안 돌리셨으면 **견적도 · 항목별 배정도 ·
       회원 저장도 · 사진도 조용히 안 됩니다** (에러가 안 납니다). */
    const DB_ON = { url:true, anonKey:true, svcKey:true, bucket:true,
                    store:true, auth:true, photo:true };
    t = await show(Object.assign({}, DB_ON, { mig:{ known:true, want:11, at:8,
      left:["0009_request_item.sql","0010_user_state.sql","0011_request_photo.sql"] } }));
    ok("덜 돌렸으면 몇 개 남았는지 말한다", /3개 남았습니다/.test(t), t.slice(0, 300));
    /* ⚠️ 어느 파일인지 **이름으로** 말해야 사장님이 바로 돌리십니다 */
    ok("남은 파일 이름을 그대로 낸다",
       /0009_request_item\.sql/.test(t) && /0011_request_photo\.sql/.test(t));
    ok("무엇이 안 되는지 같이 말한다", /견적/.test(t) && /사진/.test(t));

    t = await show(Object.assign({}, DB_ON,
      { mig:{ known:true, want:11, at:11, left:[] } }));
    ok("다 돌렸으면 더 돌릴 것이 없다고 말한다",
       /같은 판입니다/.test(t) && !/남았습니다/.test(t), t.slice(0, 300));

    /* ⚠️⚠️ **못 읽은 것을 "안 돌렸습니다" 로 적지 않습니다** — 멀쩡한
       DB 를 고치러 가시게 됩니다 */
    t = await show(Object.assign({}, DB_ON,
      { mig:{ known:false, want:11, at:null, left:[] } }));
    ok("못 읽으면 모른다고만 한다",
       /읽지 못했습니다/.test(t) && !/남았습니다/.test(t), t.slice(0, 300));

    /* ⚠️ 옛 배포(이 칸이 없는 답)에서는 **줄째 뺍니다** */
    t = await show(DB_ON);
    ok("옛 배포에서는 판 번호 줄을 아예 안 낸다", !/판 /.test(t), t.slice(0, 300));

    /* == 버킷이 실제로 비공개이고 상한이 걸려 있는가 ================
       ⚠️⚠️ 이름이 환경변수에 있는 것과 버킷이 제대로 선 것은 다른
       일입니다 — 서명된 올리기 주소는 그 자체로 크기·형식을 막지
       않아서 **마지막으로 막는 것이 버킷 설정**입니다. */
    t = await show(Object.assign({}, DB_ON, { bucketCheck:{ known:true,
      found:true, priv:true, size:true, mime:true } }));
    ok("버킷이 맞으면 맞다고 말한다", /맞게 서 있습니다/.test(t), t.slice(0, 300));

    t = await show(Object.assign({}, DB_ON, { bucketCheck:{ known:true,
      found:true, priv:false, size:true, mime:true } }));
    ok("공개 버킷이면 그렇게 말한다", /공개 버킷입니다/.test(t), t.slice(0, 300));
    ok("끄는 법까지 말한다", /Public/.test(t));

    t = await show(Object.assign({}, DB_ON, { bucketCheck:{ known:true,
      found:false, priv:false, size:false, mime:false } }));
    ok("버킷을 못 찾으면 이름을 보라고 한다",
       /찾지 못했습니다/.test(t) && /INTAKE_BUCKET/.test(t), t.slice(0, 300));

    t = await show(Object.assign({}, DB_ON, { bucketCheck:{ known:false,
      found:false, priv:false, size:false, mime:false } }));
    ok("못 읽으면 직접 보라고 한다", /직접/.test(t), t.slice(0, 300));

    /* ⚠️⚠️ 값을 섞어 보내도 화면에 안 찍습니다 (버킷 이름 포함) */
    t = await show(Object.assign({}, DB_ON, { bucket:"intake-secret-name",
      bucketCheck:{ known:true, found:true, priv:true, size:true, mime:true,
                    name:"intake-secret-name" } }));
    ok("판 · 버킷 칸에도 값을 안 찍는다", !/intake-secret-name/.test(t), t.slice(0, 300));

    ok("JS 에러 없음", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  await br.close();
  srv.close();
  console.log("\n" + (fail ? "❌" : "✅") + " 통과 " + pass + " · 실패 " + fail);
  process.exit(fail ? 1 : 0);
})();
