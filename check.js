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
/* ⚠️ file:// 로는 못 돕니다. 주소가 경로 방식(/c/beef)이라 진짜 서버가
   있어야 합니다. Vercel 을 흉내 내는 작은 서버를 띄웁니다 —
   정적 파일 우선, 없으면 rewrite, 그것도 아니면 404. */
const http = require("http"), fsx = require("fs"), px = require("path");
const RW = [/^\/p\/[^/]+$/, /^\/c\/[^/]+$/, /^\/c\/[^/]+\/[^/]+$/,
            /^\/c\/[^/]+\/[^/]+\/[^/]+$/, /^\/enc\/[^/]+$/,
            /^\/enc\/[^/]+\/[^/]+$/, /^\/products\/[^/]+$/];
const MT = { ".html":"text/html;charset=utf-8", ".js":"text/javascript;charset=utf-8",
  ".css":"text/css;charset=utf-8", ".json":"application/json", ".jpg":"image/jpeg",
  ".png":"image/png", ".xml":"application/xml", ".txt":"text/plain;charset=utf-8" };
const PORT = 8123;
const server = http.createServer((rq,rs)=>{
  const u = decodeURIComponent(rq.url.split("?")[0]);
  const send = (f,code)=>{ try{
    rs.writeHead(code||200,{"content-type":MT[px.extname(f)]||"application/octet-stream"});
    rs.end(fsx.readFileSync(f)); }catch(e){ rs.writeHead(500); rs.end(); } };
  let f = px.join(__dirname, u);
  if(fsx.existsSync(f) && fsx.statSync(f).isDirectory()) f = px.join(f,"index.html");
  if(fsx.existsSync(f) && fsx.statSync(f).isFile()) return send(f);
  if(RW.some(r=>r.test(u))) return send(px.join(__dirname,"index.html"));
  return send(px.join(__dirname,"404.html"), 404);
});
const ROOT = "http://127.0.0.1:" + PORT;

const PAGES = [
  ["/",                 "메인"],
  ["/products",         "전체상품"],
  ["/c/beef",           "소 부산물"],
  ["/c/pork",           "돼지 부산물"],
  ["/c/beef/gut",       "세부 카테고리"],
  ["/p/b-gopchang",     "상품상세"],
  ["/p/b-jira",         "품절 상품"],
  ["/enc/beef",         "부산물 도감"],
  ["/enc/beef/gopchang","도감 부위상세"],
  /* 사진이 아직 없는 부위 — 사진 칸 대신 부위 그림이 들어갑니다.
     빈 네모나 404 가 나는지 여기서 걸립니다. */
  ["/enc/beef/sagol",   "도감 (사진 없는 부위)"],
  ["/enc/pork",         "돼지 도감"],
  ["/b2b",              "업소용 B2B"],
  ["/b2b/quote",        "대량견적 문의"],
  ["/search?q=곱창",     "검색결과"],
  ["/cart",             "장바구니"],
  ["/login",            "로그인"],
  ["/signup",           "회원가입"],
  ["/my",               "마이페이지"],
  ["/about",            "브랜드"],
  ["/terms",            "이용약관"],
  ["/privacy",          "개인정보처리방침"]
];
const VIEWS = [[1440,900,"데스크톱"],[1024,820,"태블릿"],[390,844,"모바일"]];

/* 손님 화면에 있으면 안 되는 말 */
/* ⚠️ 조사를 괄호로 때운 자리(은(는) · 을(를))도 여기서 걸립니다.
   화면에도 보이지만, 더 나쁜 것은 **구글 검색 결과 줄**에 그대로
   나간다는 점입니다 — 카테고리 17개가 실제로 그랬습니다. */
const BAD = /undefined|NaN|\[object |null년|console\.|localStorage|TODO|FIXME|placeholder|[은는이가을를와과](\([은는이가을를와과]\))/i;

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
    /* 4. 누르는 것 40px — <button> 만이 아니라 onclick 을 단 것도 전부.
       ⚠️ 체크박스는 **자기 자신이 아니라 감싼 라벨이 누르는 자리**입니다.
       20px 짜리 체크박스가 44px 라벨 안에 있으면 손가락이 닿는 크기는
       44px 입니다. 체크박스를 40px 로 키우는 것은 오히려 이상합니다 —
       그래서 라벨이 있으면 라벨을 재고, 없을 때만 자기 크기를 봅니다. */
    if (e.matches("button, a[href], [onclick], [role=button], select, input[type=checkbox]")
        && c.position!=="absolute") {
      let box = r;
      if (e.matches("input[type=checkbox]")) {
        const lb = e.closest("label");
        if (lb) box = lb.getBoundingClientRect();
      }
      const h = Math.round(box.height);
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
  out.links = [...document.querySelectorAll('a[href^="/"]')].map(a=>a.getAttribute("href"));
  return out;
})()`;

(async () => {
  await new Promise(r=>server.listen(PORT,r));
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
      empty: ((document.getElementById("view")||{textContent:""}).textContent||"").trim().length < 30
    }));
    if (st.empty) dead.push(l+" (빈 화면)");
  }
  console.log("\n── 링크 " + seenLinks.size + "개");
  if (dead.length) { fail++; console.log("  ❌ 안 열리는 주소 "+dead.length+"건: "+dead.slice(0,6).join(" / ")); }
  else console.log("  ✅ 전부 열림");

  /* 8. 주소가 화면에 실제로 반영되는가
     ⚠️ 해시(#/…)를 진짜 경로로 바꾼 뒤, 해시를 읽던 자리가 **에러 없이
     조용히 틀린 답**을 내놓고 있었습니다. 헤더 메뉴가 어느 화면에서도
     안 켜지고, 모바일 아래 네비는 늘 "홈" 이었고, "찜" 을 눌러도
     주문내역이 나왔습니다. 화면은 그려지니 위의 검사들은 다 통과합니다 —
     그래서 여기서 따로 봅니다. */
  const NAV = [
    ["/c/beef",        "헤더 메뉴 켜짐",   () => !!document.querySelector('#gnb a.on[href="/c/beef"]')],
    ["/products/trim", "헤더 메뉴 켜짐",   () => !!document.querySelector('#gnb a.on[href="/products/trim"]')],
    ["/p/b-gopchang",  "아래 네비 켜짐",   () => !!document.querySelector('.mnav a.on[data-m="/products"]')],
    ["/",              "아래 네비 홈",     () => !!document.querySelector('.mnav a.on[data-m="/"]')],
    ["/my?t=wish",     "찜 탭 열림",       () => !!document.querySelector('.tabs a.on[href="/my?t=wish"]')],
    ["/my",            "주문 탭 열림",     () => !!document.querySelector('.tabs a.on[href="/my?t=order"]')],
    ["/signup?biz=1",  "사업자 가입 제목", () => /사업자 회원가입/.test(document.querySelector(".pg-h1").textContent)],
    ["/signup",        "일반 가입 제목",   () => document.querySelector(".pg-h1").textContent.trim()==="회원가입"]
  ];
  const navBad = [];
  const np = await (await b.newContext({ viewport:{width:390,height:900} })).newPage();
  for (const [url, what, fn] of NAV) {
    await np.goto(ROOT + url, { waitUntil:"load" });
    await np.waitForTimeout(220);
    let ok = false;
    try { ok = await np.evaluate("("+fn.toString()+")()"); } catch(e){ ok = false; }
    if (!ok) navBad.push(url+" › "+what);
  }
  console.log("\n── 주소가 화면에 반영되는가 " + NAV.length + "개");
  if (navBad.length) { fail++; console.log("  ❌ "+navBad.length+"건: "+navBad.join(" / ")); }
  else console.log("  ✅ 전부 맞음");

  await b.close();
  server.close();
  console.log(fail ? "\n❌ "+fail+"개 항목 실패" : "\n✅ 전체 통과");
  process.exit(fail ? 1 : 0);
})();
