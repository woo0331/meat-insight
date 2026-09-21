/* ════════════════════════════════════════════════════════════════════
   낱말 가운데가 잘리지 않는가 — 390px 전수

   실제로 이렇게 보였습니다 (모바일 홈):

       이용 방
       법            요청부터 연결까지 네 걸       이용 가이드 ›
                     음입니다

   `31_guide.js` 가 "이용 가이드 ›" 를 붙이면서 머리글에 `.row` 를
   달았는데, 이 머리글만 제목(h2)과 설명(p)이 **형제**라 — 다른 `.row`
   머리글처럼 `<div>` 로 묶여 있지 않아 — 셋이 한 줄에 나란히 섰습니다.
   제목 칸이 73px 로 눌려 "이용 방 / 법" 이 됐습니다.

   업체 카드에서도 같은 일이 있었습니다. `.sc2-rate` 가 `nowrap` flex 라
   옆의 "후기 3 · 거래 42건 · 납기 15분" 이 길면 **"★" 과 "4.9" 가
   위아래로 갈라졌습니다.**

   재는 법: 한 텍스트 노드의 낱말이 N 개면, 낱말을 안 쪼개는 한 줄은
   최대 N 줄입니다. 줄이 낱말보다 많으면 **반드시** 어떤 낱말이 쪼개진
   것입니다. 폰트·줄바꿈 규칙과 무관하게 참인 셈법이라 오탐이 없습니다.
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

const W = 390;
const PAGES = ["h","reqs","suppliers","market","jobs","my","sj","guide","about","contact"];

/* 쪼개져도 괜찮은 것 — 붙여 쓰는 긴 값은 원래 가운데서 끊깁니다 */
const OK = /^[\w.@:/+%-]+$/;          /* URL · 이메일 · 숫자+단위 같은 한 덩이 */

const DETECT = `(() => {
  const bad = [];
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walk.nextNode())) {
    const t = (n.nodeValue || "").trim();
    if (!t) continue;
    const el = n.parentElement;
    if (!el) continue;
    const pg = el.closest(".pg, .footer, header, .bnav");
    if (pg && pg.classList.contains("pg") && pg.hidden) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    if (el.offsetParent === null && cs.position !== "fixed") continue;
    const r = document.createRange();
    r.selectNodeContents(n);
    const rects = [...r.getClientRects()];
    const lines = rects.length;
    if (lines < 2) continue;
    const tokens = t.split(/\\s+/).filter(Boolean);
    /* 앞에 <b> 같은 인라인이 있어 **줄 중간에서 시작하는** 텍스트 노드는
       첫 줄이 토막이라 한 줄을 더 씁니다 — 쪼개진 게 아닙니다.
       (43_about 의 "…<b>연결 고리</b> 하나였습니다." 가 그랬습니다) */
    const lefts = rects.map((x) => x.left);
    const midStart = lines > 1 && lefts[0] > Math.min(...lefts) + 1;
    if (lines <= tokens.length + (midStart ? 1 : 0)) continue;
    bad.push({
      text: t.slice(0, 44),
      lines, tokens: tokens.length,
      sel: el.tagName.toLowerCase() + (el.className ? "." + String(el.className).split(/\\s+/).slice(0,2).join(".") : ""),
      w: Math.round(el.getBoundingClientRect().width)
    });
  }
  return bad;
})()`;

let fail = 0;
function chk(name, got, want) {
  const ok = String(got) === String(want);
  if (!ok) fail++;
  console.log(`  ${ok ? "✅" : "❌"} ${name}: ${got}`);
}

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: W, height: 900 } });
  await ctx.addInitScript({ path: path.join(ROOT, "test", "fake-sb.js") });
  const p = await ctx.newPage();
  await p.goto("file://" + path.join(ROOT, "index.html"));
  await p.waitForTimeout(1700);

  console.log(`1. ${W}px — 낱말 가운데가 잘리는 곳`);
  const all = [];
  for (const pg of PAGES) {
    await p.evaluate((x) => { try { go(x); } catch (e) {} }, pg);
    await p.waitForTimeout(600);
    const bad = (await p.evaluate(DETECT)).filter((x) => !OK.test(x.text.split(/\s+/)[0] || ""));
    bad.forEach((x) => all.push(Object.assign({ pg }, x)));
  }
  all.slice(0, 12).forEach((x) =>
    console.log(`     ${x.pg} · ${x.sel} (${x.w}px) — "${x.text}" ${x.tokens}낱말이 ${x.lines}줄`));
  chk(`${PAGES.length}개 화면`, all.length, 0);

  /* 2. 다시 생기기 쉬운 두 곳은 이름을 걸고 지킵니다 */
  console.log("2. 예전에 실제로 깨졌던 두 곳");
  await p.evaluate(() => { try { go("h"); } catch (e) {} });
  await p.waitForTimeout(500);
  const hd = await p.evaluate(() => {
    const el = [...document.querySelectorAll(".sec-h2")].find((e) => /이용 방법/.test(e.textContent));
    if (!el) return null;
    const r = document.createRange(); r.selectNodeContents(el);
    return { lines: r.getClientRects().length, w: Math.round(el.getBoundingClientRect().width) };
  });
  chk("이용 방법 제목이 한 줄", hd && hd.lines, 1);
  chk("제목 칸이 눌리지 않음(>160px)", !!(hd && hd.w > 160), true);

  await p.evaluate(() => { try { go("suppliers"); } catch (e) {} });
  await p.waitForTimeout(900);
  const star = await p.evaluate(() => {
    const e = document.querySelector("#pg-suppliers .sc2-rate");
    if (!e) return null;
    const sp = e.querySelector("span") || e.appendChild(document.createElement("span"));
    sp.textContent = "후기 3 · 거래 42건 · 납기 15분";   /* 스크린샷에 찍혔던 그 줄 */
    const em = e.querySelector("em"); if (!em) return null;
    const r = document.createRange(); r.selectNodeContents(em);
    return r.getClientRects().length;
  });
  chk("별점이 두 줄로 갈라지지 않음", star, 1);

  /* 3. 안내문이 칸 밖으로 잘리지 않는가 */
  console.log("3. 검색 안내문이 칸 안에 들어가는가");
  const ph = await p.evaluate(() => {
    const i = document.querySelector("#flt-sup-q"); if (!i) return null;
    const cs = getComputedStyle(i);
    const c = document.createElement("span");
    c.style.cssText = "position:absolute;visibility:hidden;white-space:pre;font:" + cs.font;
    c.textContent = i.placeholder; document.body.appendChild(c);
    const tw = c.getBoundingClientRect().width; c.remove();
    const avail = i.getBoundingClientRect().width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    return { ph: i.placeholder, fits: tw <= avail };
  });
  chk("안내문 = " + (ph && ph.ph), ph && ph.fits, true);

  await b.close();
  console.log(fail ? `\n❌ ${fail}개 실패` : "\n✅ 전체 통과");
  process.exit(fail ? 1 : 0);
})();
