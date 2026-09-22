/* ════════════════════════════════════════════════════════════════════
   ABOUTMEAT 전수 점검

   실행:  node check.js

   12개 페이지 × 데스크톱·태블릿·모바일 세 폭에서
     1. JS 에러 · 못 불러온 파일
     2. 가로 스크롤
     3. 12px 미만 글씨 (사업자·연세 있는 손님이 kg 단가를 읽습니다)
     4. 40px 미만으로 누르는 것
     5. 낱말 가운데가 잘리는 곳
     6. 손님 화면에 남은 개발자 말 · undefined · NaN
     7. 링크가 실제로 열리는지 (죽은 주소가 없는지)
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const ROOT = "file://" + __dirname + "/index.html";

const PAGES = [
  ["#/",                 "메인"],
  ["#/products",         "전체상품"],
  ["#/c/beef",           "소 부산물"],
  ["#/c/pork",           "돼지 부산물"],
  ["#/c/beef/gut",       "세부 카테고리"],
  ["#/p/b-gopchang",     "상품상세"],
  ["#/enc/beef",         "부산물 도감"],
  ["#/enc/beef/gopchang","도감 부위상세"],
  ["#/b2b",              "업소용 B2B"],
  ["#/b2b/quote",        "대량견적 문의"],
  ["#/search?q=곱창",     "검색결과"],
  ["#/cart",             "장바구니"],
  ["#/login",            "로그인"],
  ["#/signup",           "회원가입"],
  ["#/my",               "마이페이지"],
  ["#/about",            "브랜드"]
];
const VIEWS = [[1440,900,"데스크톱"],[1024,820,"태블릿"],[390,844,"모바일"]];

/* 손님 화면에 있으면 안 되는 말 */
const BAD = /undefined|NaN|\[object |null년|console\.|localStorage|TODO|FIXME|placeholder/i;

const AUDIT = `(() => {
  const W = window.innerWidth, out = { small:[], tap:[], wrap:[], bad:[] };
  const vis = e => {
    const c = getComputedStyle(e);
    if (c.display==="none" || c.visibility==="hidden" || +c.opacity===0) return false;
    const r = e.getBoundingClientRect();
    return r.width>0 && r.height>0;
  };
  document.querySelectorAll("body *").forEach(e => {
    if (!vis(e)) return;
    const c = getComputedStyle(e), r = e.getBoundingClientRect();
    const leaf = !e.children.length && (e.textContent||"").trim();

    /* 3. 12px 미만 */
    if (leaf) {
      const f = parseFloat(c.fontSize);
      if (f < 12) out.small.push(e.className+"|"+f+"px|"+(e.textContent||"").trim().slice(0,14));
    }
    /* 4. 누르는 것 40px — <button> 만이 아니라 onclick 을 단 것도 전부 */
    if (e.matches("button, a[href], [onclick], [role=button], select, input[type=checkbox]")
        && !e.closest("label.flt-c") && c.position!=="absolute") {
      const h = Math.round(r.height);
      if (h > 0 && h < 40 && e.offsetParent !== null)
        out.tap.push(e.tagName+"."+String(e.className).split(" ")[0]+"|"+h+"px|"+(e.textContent||"").trim().slice(0,12));
    }
    /* 6. 손님 화면에 남은 개발자 말 */
    if (leaf && ${BAD.source ? "/"+BAD.source+"/i" : "/$^/"}.test(e.textContent))
      out.bad.push((e.textContent||"").trim().slice(0,40));
  });
  /* 5. 낱말 가운데 잘림 — 낱말 수보다 줄 수가 많으면 쪼개진 것입니다 */
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walk.nextNode())) {
    const t = (n.nodeValue||"").trim(); if (!t) continue;
    const el = n.parentElement; if (!el || !vis(el)) continue;
    const r = document.createRange(); r.selectNodeContents(n);
    const rects = [...r.getClientRects()]; if (rects.length < 2) continue;
    const toks = t.split(/\\s+/).filter(Boolean);
    const lefts = rects.map(x=>x.left);
    const mid = lefts[0] > Math.min(...lefts) + 1;          /* 줄 중간에서 시작 */
    if (rects.length <= toks.length + (mid?1:0)) continue;
    out.wrap.push(t.slice(0,30)+" ("+toks.length+"낱말 "+rects.length+"줄)");
  }
  out.over = document.documentElement.scrollWidth > W + 1;
  out.links = [...document.querySelectorAll('a[href^="#/"]')].map(a=>a.getAttribute("href"));
  return out;
})()`;

(async () => {
  const b = await chromium.launch();
  let fail = 0;
  const seenLinks = new Set();

  for (const [w,h,vn] of VIEWS) {
    const ctx = await b.newContext({ viewport:{width:w,height:h} });
    const p = await ctx.newPage();
    const errs = [], miss = [];
    p.on("pageerror", e => errs.push(e.message));
    p.on("requestfailed", r => {
      const u = r.url();
      if (!/pretendard|cdn\.jsdelivr/.test(u)) miss.push(u.split("/").pop());
    });

    const bad = { small:[], tap:[], wrap:[], bad:[], over:[] };
    for (const [hash, name] of PAGES) {
      await p.goto(ROOT + hash, { waitUntil:"load" });
      await p.waitForTimeout(280);
      const a = await p.evaluate(AUDIT);
      a.links.forEach(l => seenLinks.add(l));
      if (a.over) bad.over.push(name);
      ["small","tap","wrap","bad"].forEach(k =>
        a[k].forEach(x => bad[k].push(name+" › "+x)));
    }

    const uniq = a => [...new Set(a)];
    const rows = [
      ["JS 에러",            errs],
      ["못 불러온 파일",      uniq(miss)],
      ["가로 스크롤",        bad.over],
      ["12px 미만 글씨",     uniq(bad.small)],
      ["40px 미만 누름",     uniq(bad.tap)],
      ["낱말 가운데 잘림",   uniq(bad.wrap)],
      ["개발자 말 노출",     uniq(bad.bad)]
    ];
    console.log("\n── " + vn + " (" + w + "px)");
    rows.forEach(([n,v]) => {
      if (v.length) { fail++; console.log("  ❌ "+n+" "+v.length+"건: "+v.slice(0,4).join(" / ")); }
      else console.log("  ✅ "+n);
    });
    await ctx.close();
  }

  /* 7. 링크가 실제로 열리는지 — 죽은 주소는 손님에게 고장입니다 */
  const ctx = await b.newContext({ viewport:{width:1280,height:900} });
  const p = await ctx.newPage();
  const dead = [];
  for (const l of [...seenLinks]) {
    await p.goto(ROOT + l, { waitUntil:"load" });
    await p.waitForTimeout(220);
    const st = await p.evaluate(() => ({
      hash: location.hash,
      empty: (document.getElementById("view").textContent||"").trim().length < 30
    }));
    /* 홈으로 튕겼거나(주소가 #/ 로 정리됨) 본문이 비면 죽은 주소입니다 */
    if (st.empty || (l !== "#/" && st.hash === "#/")) dead.push(l+" → "+st.hash+(st.empty?" (빈 화면)":""));
  }
  console.log("\n── 링크 " + seenLinks.size + "개");
  if (dead.length) { fail++; console.log("  ❌ 안 열리는 주소 "+dead.length+"건: "+dead.slice(0,6).join(" / ")); }
  else console.log("  ✅ 전부 열림");

  await b.close();
  console.log(fail ? "\n❌ "+fail+"개 항목 실패" : "\n✅ 전체 통과");
  process.exit(fail ? 1 : 0);
})();
