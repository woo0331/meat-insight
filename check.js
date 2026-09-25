/* ════════════════════════════════════════════════════════════════════
   ABOUTMEAT 전수 점검

   실행:  node check.js

   19개 화면 × 데스크톱·태블릿·모바일 세 폭에서
     1. JS 에러 · 못 불러온 파일
     2. 가로 스크롤
     3. 12px 미만 글씨 (연세 있는 사장님이 폰으로 읽습니다)
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
/* build-pages.js 가 만든 HTML 이 없는 **주소 안의 주소**만 여기 둡니다
   (vercel.json 의 rewrites 와 같은 구실). 나머지는 전부 진짜 파일입니다. */
const RW = [/^\/partners\/[^/]+$/, /^\/lab\/[^/]+$/];
/* ⚠️ `.svg` 를 빠뜨리면 그림이 application/octet-stream 으로 나가서
   브라우저가 **그리지 않고 alt 글자만** 보여 줍니다. 화면은 멀쩡해
   보이는데 사진 자리가 전부 글자가 됩니다 — 실제로 그렇게 봤습니다. */
const MT = { ".html":"text/html;charset=utf-8", ".js":"text/javascript;charset=utf-8",
  ".css":"text/css;charset=utf-8", ".json":"application/json", ".jpg":"image/jpeg",
  ".png":"image/png", ".svg":"image/svg+xml", ".ico":"image/x-icon",
  ".xml":"application/xml", ".txt":"text/plain;charset=utf-8" };
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
  ["/",                "메인"],
  ["/sos",             "사장님 SOS"],
  ["/sos?c=duct",      "SOS (분류 고른 채로)"],
  ["/start",           "창업 프로젝트"],
  ["/start/cost",      "창업비 정리표"],
  ["/check",           "무료 사업진단"],
  ["/partners",        "업체 찾기"],
  ["/request",         "견적 요청 (고르는 화면)"],
  ["/request?s=duct",  "견적 요청 (덕트)"],
  ["/request?s=beef-supply", "견적 요청 (육류 공급)"],
  ["/lab",             "사장님 연구소"],
  ["/partner",         "파트너 안내"],
  ["/partner/apply",   "파트너 등록"],
  ["/about",           "소개"],
  ["/terms",           "이용약관"],
  ["/privacy",         "개인정보처리방침"],
  ["/my",              "MY BUSINESS"],
  ["/login",           "로그인"],
  ["/nope",            "없는 주소"]
];
const VIEWS = [[1440,900,"데스크톱"],[1024,820,"태블릿"],[390,844,"모바일"]];

/* 손님 화면에 있으면 안 되는 말 */
/* ⚠️ 조사를 괄호로 때운 자리(은(는) · 을(를))도 여기서 걸립니다.
   화면에도 보이지만, 더 나쁜 것은 **구글 검색 결과 줄**에 그대로
   나간다는 점입니다 — 카테고리 17개가 실제로 그랬습니다. */
/* ⚠️ "지시서 12번" 이 파트너 안내 화면에 그대로 나간 적이 있습니다.
   운영자끼리 쓰는 말(지시서 · 스펙 · MVP · 어드민 · TODO)은 손님 화면에
   있으면 안 됩니다 (절대 규칙 3). */
const BAD = /undefined|NaN|\[object |null년|console\.|localStorage|TODO|FIXME|placeholder|지시서|스펙 ?\d|어드민|[은는이가을를와과](\([은는이가을를와과]\))/i;

const AUDIT = `(() => {
  const W = window.innerWidth, out = { small:[], tap:[], wrap:[], bad:[], glue:[] };
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
    /* ⚠️ 가운뎃점·빗금·쉼표도 **낱말 경계**입니다.
       "육절기·골절기·진공기" 가 "육절기·골절기· / 진공기" 로 줄이
       바뀌는 것은 낱말이 쪼개진 게 아닙니다. 띄어쓰기만 세면 이런
       것이 전부 걸려서, 정작 잡아야 할 "고소 / 함" 이 묻힙니다. */
    const toks = t.split(/[\\s·・\\/,]+/).filter(Boolean);
    const lefts = rects.map(x=>x.left);
    /* "줄 중간에서 시작" 이면 줄이 하나 더 늘 수 있어 한 줄 봐줍니다.
       ⚠️ 다만 **가운데·오른쪽 정렬에서는 이 판단을 쓰면 안 됩니다.**
       가운데 정렬은 줄마다 왼쪽 끝이 달라서, 둘째 줄이 조금만 길어도
       "중간에서 시작했다" 로 잘못 읽습니다. 실제로 1440px 에서 쪼개진
       낱말을 그렇게 놓쳤습니다 (390px 에서만 잡혔습니다). */
    const ta = getComputedStyle(el).textAlign;
    const mid = (ta === "left" || ta === "start") &&
                lefts[0] > Math.min(...lefts) + 1;
    if (rects.length <= toks.length + (mid?1:0)) continue;
    out.wrap.push(t.slice(0,30)+" ("+toks.length+"낱말 "+rects.length+"줄)");
  }
  /* 8. br.br-m 이 좁은 화면에서 사라질 때 앞뒤 낱말이 붙는가
     ⚠️ 이건 **가로 스크롤도 에러도 안 나고 화면도 멀쩡합니다.** 글자만
     "차리는 데알아볼 게" 로 붙습니다. 실제로 그렇게 나갔습니다.
     띄어쓰기는 br 뒤에 둡니다 — 줄바꿈 다음 공백은 넓은 화면에서
     브라우저가 지우므로 표가 안 납니다. */
  document.querySelectorAll("br.br-m").forEach(br => {
    if (getComputedStyle(br).display !== "none") return;
    const pv = br.previousSibling, nx = br.nextSibling;
    const a = (pv && pv.nodeType === 3) ? pv.nodeValue : "";
    const z = (nx && nx.nodeType === 3) ? nx.nodeValue : "";
    if (/\\s$/.test(a) || /^\\s/.test(z)) return;
    out.glue.push(a.trim().slice(-8) + "↔" + z.trim().slice(0,8));
  });
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

    const bad = { small:[], tap:[], wrap:[], bad:[], glue:[], over:[] };
    for (const [hash, name] of PAGES) {
      await p.goto(ROOT + hash, { waitUntil:"load" });
      await p.waitForTimeout(280);
      const a = await p.evaluate(AUDIT);
      a.links.forEach(l => seenLinks.add(l));
      if (a.over) bad.over.push(name);
      ["small","tap","wrap","bad","glue"].forEach(k =>
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
      ["줄바꿈 사라져 낱말 붙음", uniq(bad.glue)],
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
     ⚠️ 해시를 읽던 자리가 남으면 **에러 없이 조용히 틀린 답**을 냅니다.
     화면은 그려지니 위의 검사들은 다 통과합니다 — 그래서 따로 봅니다. */
  const NAV = [
    ["/sos",        "헤더 메뉴 없음(SOS는 GNB 밖)", () => !document.querySelector("#gnb a.on")],
    ["/start",      "헤더 메뉴 켜짐", () => !!document.querySelector('#gnb a.on[href="/start"]')],
    ["/check",      "헤더 메뉴 켜짐", () => !!document.querySelector('#gnb a.on[href="/check"]')],
    ["/partners",   "아래 네비 켜짐", () => !!document.querySelector('.mnav a.on[data-m="/partners"]')],
    ["/",           "아래 네비 홈",   () => !!document.querySelector('.mnav a.on[data-m="/"]')],
    ["/sos",        "아래 네비 SOS",  () => !!document.querySelector('.mnav a.on[data-m="/sos"]')],
    ["/sos?q=%ED%85%8C%EC%8A%A4%ED%8A%B8", "메인에서 적은 말이 넘어옴",
      () => document.getElementById("s-q").value === "테스트"],
    ["/sos?c=duct", "고른 분류가 켜져 있음",
      () => !!document.querySelector('#s-cat .pk.on[data-k="duct"]')],
    ["/request?s=duct", "고른 서비스로 요청서가 뜸",
      () => document.getElementById("rq-svc").value === "duct"
         && !!document.getElementById("rq-f-fires")],
    ["/request?s=beef-supply", "서비스마다 묻는 칸이 다름",
      () => !!document.getElementById("rq-f-amount")
         && !document.getElementById("rq-f-fires")],
    ["/request?s=nope-없는것", "모르는 서비스는 영문 key 를 안 찍고 고르는 화면으로",
      () => !document.getElementById("rq-svc")
         && document.getElementById("view").textContent.indexOf("nope") < 0]
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

  /* 9. SOS 접수 — 동의 없이는 보내지 않습니다
     ⚠️ 동의 없이 받은 개인정보는 개인정보보호법 제15조 위반입니다.
     화면에서 한 번, 서버(api/quote.js)에서 한 번 막습니다. */
  const sosBad = [];
  const sp = await (await b.newContext({ viewport:{width:1440,height:1000} })).newPage();
  const t = async (name, fn) => { let ok=false;
    try{ ok = await sp.evaluate("(async()=>{ "+fn+" })()"); }catch(e){ ok = "에러 "+e.message; }
    if (ok !== true) sosBad.push(name + (typeof ok==="string" ? " ("+ok+")" : "")); };
  await sp.goto(ROOT + "/sos", { waitUntil:"load" });
  await sp.waitForTimeout(250);

  const fill = `
    document.getElementById("s-q").value="덕트 냄새 민원이 들어옵니다";
    document.getElementById("s-name").value="홍길동";
    document.getElementById("s-tel").value="010-1234-5678";`;
  await t("동의 없이는 보내지 않는다", `
    SOS.sending=false; render(); await new Promise(r=>setTimeout(r,150));
    ${fill}
    document.getElementById("s-ag").checked=false;
    let sent=false; const f=window.fetch;
    window.fetch=function(){ sent=true; return Promise.reject(new Error("테스트")); };
    sosSend({preventDefault(){}});
    await new Promise(r=>setTimeout(r,200)); window.fetch=f;
    return sent===false;`);
  await t("동의하면 보낸다", `
    SOS.sending=false; render(); await new Promise(r=>setTimeout(r,150));
    ${fill}
    document.getElementById("s-ag").checked=true;
    let sent=false; const f=window.fetch;
    window.fetch=function(){ sent=true; return Promise.reject(new Error("테스트")); };
    sosSend({preventDefault(){}});
    await new Promise(r=>setTimeout(r,250)); window.fetch=f;
    return sent===true;`);
  await t("분류는 하나만 골라진다", `
    SOS.sending=false; render(); await new Promise(r=>setTimeout(r,150));
    const ps=[...document.querySelectorAll("#s-cat .pk")];
    sosPick(ps[0]); sosPick(ps[3]);
    return document.querySelectorAll("#s-cat .pk.on").length===1;`);
  /* ⚠️ 지어낸 숫자를 화면에 내지 않습니다 (지시서 43번 · 절대 규칙 1).
     업체 수 · 계약 수 · 절감금액 · 고객 수 · 평점 · 시공건수 —
     실제 데이터가 없으면 그 구간을 **아예 내지 않습니다.**
     ⚠️ 시안에 "3,200+ 사장님 · 1,500+ 검증된 업체 · 만족도 98%" 와
     별점 "4.9 (120)" 이 있었습니다. 그게 여기서 걸려야 합니다. */
  const FAKE = [
    ["실적 수식어",  /[0-9][0-9,]*\s*(건|곳|명|원|개)\s*(절감|달성|계약|등록|이용|돌파|시공)/],
    ["n+ 꼴 숫자",   /[0-9][0-9,]*\s*\+/],
    ["만족도·성공률", /(만족도|재구매율|성공률|정확도)\s*[0-9]/],
    ["누적·총 실적", /(누적|총)\s*[0-9][0-9,]*\s*(건|곳|명|개)/],
    ["별점",        /[★⭐]|[0-5]\.[0-9]\s*\(\s*[0-9]+\s*\)/]
  ];
  await t("메인에 지어낸 실적 숫자가 없다", `
    go("/"); await new Promise(r=>setTimeout(r,250));
    const txt=document.getElementById("view").textContent;
    const hit=${JSON.stringify(FAKE.map(f=>[f[0],f[1].source]))}
      .filter(f=>new RegExp(f[1]).test(txt)).map(f=>f[0]);
    return hit.length ? hit.join("·")+" 가 보입니다" : true;`);
  console.log("\n── SOS 흐름 " + 5 + "개");
  if (sosBad.length) { fail++; console.log("  ❌ "+sosBad.length+"건: "+sosBad.join(" / ")); }
  else console.log("  ✅ 전부 맞음");

  /* 9-2. 새 화면들이 실제로 굴러가는가
     ⚠️ 화면이 **그려지는 것**과 **되는 것**은 다릅니다. 위의 검사들은
     그려지기만 하면 전부 통과합니다. */
  const flowBad = [];
  const fp = await (await b.newContext({ viewport:{width:1280,height:900} })).newPage();
  const f = async (name, url, fn) => {
    await fp.goto(ROOT + url, { waitUntil:"load" });
    await fp.waitForTimeout(250);
    let ok;
    try { ok = await fp.evaluate("(async()=>{ "+fn+" })()"); }
    catch(e){ ok = "에러 "+e.message; }
    if (ok !== true) flowBad.push(name + (typeof ok === "string" ? " ("+ok+")" : "")); };

  await f("진단: 안 고르면 결과가 안 나온다", "/check", `
    chkDone({preventDefault(){}});
    await new Promise(r=>setTimeout(r,200));
    return !document.querySelector(".ring");`);
  await f("진단: 여덟 개 고르면 결과가 나온다", "/check", `
    WOW_CHECK.forEach(it => chkPick(it.key, 0));
    chkDone({preventDefault(){}});
    await new Promise(r=>setTimeout(r,250));
    return !!document.querySelector(".ring")
        && document.querySelector(".ring-n b").textContent === "100";`);
  await f("진단: 점수가 고른 답을 따라간다", "/check", `
    WOW_CHECK.forEach(it => chkPick(it.key, 2));   /* 전부 0점짜리 */
    chkDone({preventDefault(){}});
    await new Promise(r=>setTimeout(r,250));
    return document.querySelector(".ring-n b").textContent === "0";`);
  await f("진단: 원가율은 적은 숫자를 나눈 값이다", "/check", `
    document.getElementById("ck-sales").value = "7,000";
    document.getElementById("ck-meat").value  = "2,400";
    chkRate();
    await new Promise(r=>setTimeout(r,120));
    return document.querySelector(".chk-rate-n").textContent.indexOf("34.3") === 0;`);

  await f("창업: 체크가 남는다", "/start", `
    try{ localStorage.clear(); }catch(e){}
    render();
    await new Promise(r=>setTimeout(r,150));
    stToggle("area", true);
    await new Promise(r=>setTimeout(r,200));
    const n = document.querySelector(".st-pg-t b").textContent.trim();
    render();
    await new Promise(r=>setTimeout(r,200));
    return n === "1 / 20"
        && document.querySelector(".st-pg-t b").textContent.trim() === "1 / 20";`);
  await f("창업: 지우면 0 으로 돌아간다", "/start", `
    stToggle("area", true); stToggle("shop", true);
    await new Promise(r=>setTimeout(r,150));
    stReset();
    await new Promise(r=>setTimeout(r,200));
    return document.querySelector(".st-pg-t b").textContent.trim() === "0 / 20";`);

  await f("창업비: 합계가 적은 값의 합이다", "/start/cost", `
    try{ localStorage.clear(); }catch(e){}
    render();
    await new Promise(r=>setTimeout(r,200));
    costIn("shop","5,000"); costIn("interior","3,200");
    await new Promise(r=>setTimeout(r,150));
    const t = document.getElementById("cost-sum").textContent;
    try{ localStorage.clear(); }catch(e){}
    return t.indexOf("8,200") >= 0 && t.indexOf("2칸") >= 0;`);
  /* ⚠️ 예상 금액을 지어내지 않습니다 — 아무것도 안 적었으면 합계도 없어야 합니다 */
  await f("창업비: 안 적으면 숫자를 지어내지 않는다", "/start/cost", `
    try{ localStorage.clear(); }catch(e){}
    render();
    await new Promise(r=>setTimeout(r,200));
    const t = document.getElementById("cost-sum").textContent;
    return !/[0-9]/.test(t.replace(/0칸/,""));`);

  await f("견적: 동의 없이는 안 보낸다", "/request?s=duct", `
    document.getElementById("rq-q").value = "덕트 냄새가 납니다";
    document.getElementById("rq-name").value = "홍길동";
    document.getElementById("rq-tel").value = "010-1234-5678";
    document.getElementById("rq-ag").checked = false;
    let sent=false; const o=window.fetch;
    window.fetch=function(){ sent=true; return Promise.reject(new Error("테스트")); };
    reqSend({preventDefault(){}});
    await new Promise(r=>setTimeout(r,200)); window.fetch=o;
    return sent===false;`);
  await f("견적: 동의하면 보낸다", "/request?s=duct", `
    document.getElementById("rq-q").value = "덕트 냄새가 납니다";
    document.getElementById("rq-name").value = "홍길동";
    document.getElementById("rq-tel").value = "010-1234-5678";
    document.getElementById("rq-ag").checked = true;
    let body=null; const o=window.fetch;
    window.fetch=function(u,i){ body=JSON.parse(i.body); return Promise.reject(new Error("테스트")); };
    reqSend({preventDefault(){}});
    await new Promise(r=>setTimeout(r,250)); window.fetch=o;
    return !!body && body.service==="duct" && body.agree===true;`);
  await f("파트너: 서비스를 안 고르면 안 보낸다", "/partner/apply", `
    document.getElementById("pt-co").value="가나덕트";
    document.getElementById("pt-name").value="홍길동";
    document.getElementById("pt-tel").value="010-1234-5678";
    document.getElementById("pt-ag").checked=true;
    let sent=false; const o=window.fetch;
    window.fetch=function(){ sent=true; return Promise.reject(new Error("테스트")); };
    ptSend({preventDefault(){}});
    await new Promise(r=>setTimeout(r,200)); window.fetch=o;
    return sent===false;`);
  /* ⚠️ 사진이 **실제로 그려지는가.** 파일이 없거나 서버가 엉뚱한
     content-type 으로 내보내면 브라우저는 그림 대신 alt 글자만
     보여 줍니다 — 화면은 멀쩡해 보이고 JS 에러도 안 납니다.
     실제로 .svg 를 application/octet-stream 으로 내보내서 사진 자리가
     전부 글자가 된 적이 있습니다. */
  /* ⚠️ `img.complete` 를 기다리면 **멈춥니다.** loading="lazy" 인
     그림은 화면에 들어오기 전까지 load 도 error 도 안 쏩니다 — 실제로
     검사가 12분 동안 멈춰 있었습니다. 주소를 직접 받아 봅니다. */
  await f("메인의 사진이 실제로 열린다", "/", `
    const srcs = [...new Set([...document.querySelectorAll("#view img.ph, #view img.ph-bg")]
      .map(i => i.getAttribute("src")).filter(Boolean))];
    if(!srcs.length) return "사진이 한 장도 없습니다";
    const bad = [];
    for(const u of srcs){
      try{
        const res = await fetch(u, { cache:"no-store" });
        const ct = res.headers.get("content-type") || "";
        if(!res.ok) bad.push(u + " → " + res.status);
        else if(!/^image\\//.test(ct)) bad.push(u + " → " + (ct || "타입 없음"));
      }catch(e){ bad.push(u + " → " + e.message); }
    }
    return bad.length ? bad.join(" / ") : true;`);
  /* ⚠️ 그림은 봐도 못 읽는 손님이 있습니다 */
  await f("사진마다 무엇이 찍혔는지 적혀 있다", "/", `
    const bad = [...document.querySelectorAll("#view img.ph")]
      .filter(i => !(i.getAttribute("alt")||"").trim())
      .map(i => i.getAttribute("src"));
    return bad.length ? bad.join(" ") + " 에 alt 가 없습니다" : true;`);

  /* ⚠️ 약관·방침이 쇼핑몰 기준으로 되돌아가면 여기서 걸립니다 */
  await f("약관에 쇼핑몰 문구가 남아 있지 않다", "/terms", `
    const t = document.getElementById("view").textContent;
    return !/청약철회|배송|재화등의 공급|신선식품/.test(t);`);
  await f("방침에 중개자 지위와 제3자 제공이 적혀 있다", "/privacy", `
    const t = document.getElementById("view").textContent;
    return /별도의 동의/.test(t) && /Vercel/.test(t);`);

  console.log("\n── 새 화면 흐름 " + 16 + "개");
  if (flowBad.length) { fail++; console.log("  ❌ "+flowBad.length+"건: "+flowBad.join(" / ")); }
  else console.log("  ✅ 전부 맞음");

  /* 10. 알림(토스트)이 보이고 들리는가
     ⚠️ 담기·품절·동의 누락 안내가 **전부 토스트**입니다. 아래 네비에
     가리거나 읽어 주는 프로그램이 못 읽으면, 손님은 담겼는지 아닌지를
     알 방법이 없습니다. 둘 다 화면은 멀쩡해 보여서 위 검사들은 통과합니다. */
  const tstBad = [];
  for (const w of [390, 1440]) {
    const tp = await (await b.newContext({ viewport:{width:w,height:844} })).newPage();
    await tp.goto(ROOT + "/sos", { waitUntil:"load" });
    await tp.waitForTimeout(250);
    await tp.evaluate(() => toast("테스트 알림입니다"));
    await tp.waitForTimeout(200);
    const r = await tp.evaluate(() => {
      const t = document.getElementById("toast");
      if (!t) return { none:true };
      const tr = t.getBoundingClientRect();
      const n = document.querySelector(".mnav");
      const on = n && getComputedStyle(n).display !== "none";
      const nr = on ? n.getBoundingClientRect() : null;
      return {
        over: nr ? Math.max(0, Math.round(tr.bottom - nr.top)) : 0,
        offscreen: Math.round(tr.bottom) > Math.round(innerHeight),
        live: t.getAttribute("aria-live"), role: t.getAttribute("role"),
        shown: getComputedStyle(t).opacity !== "0"
      };
    });
    if (r.none)        tstBad.push(w+"px: 토스트가 안 뜸");
    else {
      if (!r.shown)    tstBad.push(w+"px: 토스트가 안 보임");
      if (r.over > 0)  tstBad.push(w+"px: 아래 네비에 "+r.over+"px 가림");
      if (r.offscreen) tstBad.push(w+"px: 화면 밖으로 나감");
      if (r.role !== "status" || r.live !== "polite")
                       tstBad.push(w+"px: 읽어 주는 프로그램이 못 읽음 (role/aria-live 없음)");
    }
    await tp.close();
  }
  console.log("\n── 알림이 보이고 들리는가");
  if (tstBad.length) { fail++; console.log("  ❌ "+tstBad.length+"건: "+tstBad.join(" / ")); }
  else console.log("  ✅ 두 폭 다 맞음");

  await b.close();
  server.close();
  console.log(fail ? "\n❌ "+fail+"개 항목 실패" : "\n✅ 전체 통과");
  process.exit(fail ? 1 : 0);
})();
