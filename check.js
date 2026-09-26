/* ════════════════════════════════════════════════════════════════════
   ABOUTMEAT 전수 점검

   실행:  node check.js

   26개 화면 × 데스크톱·태블릿·모바일 세 폭에서
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
  ["/lab?c=fac",       "연구소 (분류 고른 채로)"],
  /* ⚠️ 글 화면이 검사에 아예 안 들어가 있었습니다. 열두 편이 통째로
     안 보이고 있었던 셈입니다 — 제목(h1) 검사를 일부러 깨 봤는데
     안 걸려서 알았습니다. 제일 긴 것과 목록이 많은 것을 넣습니다. */
  ["/lab/duct-smell-complaint", "글 (덕트 민원)"],
  ["/lab/open-permits",         "글 (오픈 인허가)"],
  ["/quotes",          "견적 비교"],
  ["/tools",           "도구 모음"],
  ["/tools/yield",     "수율 원가 계산"],
  ["/tools/bep",       "손익분기 계산"],
  ["/search?q=%EB%8D%95%ED%8A%B8", "검색 결과"],
  ["/search?q=zzz",    "검색 (못 찾음)"],
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
  const W = window.innerWidth, out = { small:[], tap:[], wrap:[], bad:[], glue:[], mix:[], h1:[] };
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
  /* 7-2. grid 칸에서 **글이 딴 칸으로 튀는가**
     ⚠️ 이 버그를 세 번 만들었습니다. display:grid 인 칸에 글을 그냥
     넣고 그 안에 <b> 를 쓰면 <b> 가 딴 칸이 됩니다. 칸 수를 넘으면
     다음 줄로 넘어가서 "최대 세 곳" 과 "입니다." 가 다른 줄에 앉고,
     칸이 좁으면 글자가 한 자씩 세로로 쪼개집니다. 에러도 안 나고
     JS 도 멀쩡해서 다른 검사에 안 걸립니다.

     ⚠️ "아이콘 + 글" 은 정상입니다 (칸 두 개에 항목 두 개). 문제는
     **항목 수가 칸 수를 넘는데 그중에 맨글이 섞여 있을 때**입니다.
     고치는 법은 하나 — 글 전체를 <span> 하나로 감싸세요.
     일부러 그렇게 둔 곳에는 class 에 'g-mix' 를 다세요. */
  document.querySelectorAll("body *").forEach(el => {
    if (!vis(el)) return;
    const c = getComputedStyle(el);
    if (c.display !== "grid" && c.display !== "inline-grid") return;
    if (String(el.className).indexOf("g-mix") >= 0) return;
    const tpl = c.gridTemplateColumns;
    /* ⚠️ 여기서 정규식을 쓰지 마세요. 이 검사는 **템플릿 문자열 안**에
       들어 있어서 백슬래시-s 가 그냥 s 로 바뀝니다 — 두 번 당했습니다.
       계산된 값은 항상 공백으로 나뉘므로 문자열 split 이면 됩니다. */
    const tracks = (!tpl || tpl === "none")
      ? 1 : tpl.trim().split(" ").filter(Boolean).length;
    let text = 0, items = 0;
    el.childNodes.forEach(n => {
      if (n.nodeType === 3 && n.nodeValue.trim()) { text++; items++; }
      else if (n.nodeType === 1) {
        const cs = getComputedStyle(n);
        if (cs.position !== "absolute" && cs.position !== "fixed" && cs.display !== "none") items++;
      }
    });
    if (text > 0 && items > tracks)
      out.mix.push(String(el.className || el.tagName).split(" ")[0] +
        "|칸"+tracks+"에 항목"+items+"|" + (el.textContent||"").trim().slice(0,20));
  });

  /* 7-3. 문장 **한가운데**에 덩어리(block/flex/grid)가 끼어 있는가
     ⚠️ CSS 선택자를 넓게 쓰다가 네 번 겪었습니다. ".notice-bad b" 처럼
     자식 기호 없이 쓰면 제목용 <b> 뿐 아니라 **문장 안의 <b> 까지** 덩어리가
     되어 그 낱말만 딴 줄에 앉습니다. "적어 주신 내용은 / 그대로 남아
     있습니다. / 잠시 뒤 …" 처럼요.
     ⚠️ 고치는 법은 자식 기호 하나입니다. 일부러 그런 곳은 class 에 'g-mix'. */
  document.querySelectorAll("b, strong, em, i, span, a, code").forEach(el => {
    if (!vis(el)) return;
    if (String(el.className).indexOf("g-mix") >= 0) return;
    const d = getComputedStyle(el).display;
    if (d !== "block" && d !== "flex" && d !== "grid") return;
    const par = el.parentElement; if (!par) return;
    if (String(par.className).indexOf("g-mix") >= 0) return;
    const pd = getComputedStyle(par).display;
    if (pd === "grid" || pd === "inline-grid" || pd === "flex" || pd === "inline-flex") return;
    let text = 0;
    par.childNodes.forEach(n => { if (n.nodeType === 3 && n.nodeValue.trim()) text++; });
    if (text > 0)
      out.mix.push(el.tagName.toLowerCase()+"."+String(el.className||par.className||"").split(" ")[0]+
        "|문장 속 "+d+"|"+(el.textContent||"").trim().slice(0,18));
  });

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
  /* 9. 화면마다 제목(h1)이 **딱 하나** 있는가
     ⚠️ 없으면 읽어 주는 프로그램 사용자가 "여기가 어디인지" 를 못
     잡고, 구글도 화면의 주제를 못 잡습니다. 여러 개면 무엇이 주제인지
     알 수 없습니다. 화면을 새로 만들 때 제일 자주 빠뜨립니다. */
  {
    /* ⚠️ 404.html 은 라우터 밖에서 혼자 뜨는 화면이라 #view 가 없습니다.
       그래서 #view 가 없으면 main 에서 셉니다 — 안 그러면 "제목이
       없다" 는 오탐이 납니다. */
    const root = document.getElementById("view") || document.querySelector("main") || document.body;
    const h1 = [...root.querySelectorAll("h1")].filter(vis);
    if (h1.length !== 1)
      out.h1.push(h1.length === 0 ? "제목(h1)이 없습니다" : "제목(h1)이 "+h1.length+"개입니다");
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

    const bad = { small:[], tap:[], wrap:[], bad:[], glue:[], mix:[], h1:[], over:[] };
    for (const [hash, name] of PAGES) {
      await p.goto(ROOT + hash, { waitUntil:"load" });
      await p.waitForTimeout(280);
      const a = await p.evaluate(AUDIT);
      a.links.forEach(l => seenLinks.add(l));
      if (a.over) bad.over.push(name);
      ["small","tap","wrap","bad","glue","mix","h1"].forEach(k =>
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
      ["grid 칸에 글과 태그가 섞임", uniq(bad.mix)],
      ["화면 제목(h1)", uniq(bad.h1)],
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

  /* ── 화면과 화면이 **실제로 이어지는가** ────────────────────
     ⚠️ 화면 하나하나가 되는 것과, 눌렀을 때 **다음 화면으로 값이
     넘어가는 것**은 다릅니다. 여기가 끊기면 손님은 같은 것을 두 번
     적게 되고, 대개 거기서 닫습니다. */
  await f("메인 입력창 → SOS 로 적은 말이 넘어간다", "/", `
    document.getElementById("ask").value = "덕트 냄새가 납니다";
    askGo({preventDefault(){}});
    await new Promise(r=>setTimeout(r,300));
    return location.pathname === "/sos"
        && document.getElementById("s-q").value === "덕트 냄새가 납니다";`);
  await f("메인 짧은 단추 → 입력창이 채워진다", "/", `
    askFill(2);
    await new Promise(r=>setTimeout(r,150));
    const v = document.getElementById("ask").value;
    return v.length > 5 && v === WOW_ASK_CHIPS[2].ask;`);
  await f("메인 상황 카드 → SOS 에 상황이 채워진다", "/", `
    const a = [...document.querySelectorAll(".sit")].find(x => x.href.indexOf("/sos?") >= 0);
    if(!a) return "상황 카드에 SOS 로 가는 것이 없습니다";
    go(a.getAttribute("href"));
    await new Promise(r=>setTimeout(r,300));
    return document.getElementById("s-q").value.length > 5;`);
  await f("메인 고민 카드 → SOS 에 분류가 켜진다", "/", `
    const a = [...document.querySelectorAll(".prob")].find(x => x.href.indexOf("c=duct") >= 0);
    if(!a) return "덕트 고민 카드가 없습니다";
    go(a.getAttribute("href"));
    await new Promise(r=>setTimeout(r,300));
    return !!document.querySelector('#s-cat .pk.on[data-k="duct"]');`);
  await f("메인 서비스 묶음 → 업체 찾기의 그 묶음으로", "/", `
    go("/partners?g=space");
    await new Promise(r=>setTimeout(r,300));
    return !!document.querySelector("#g-space.on");`);
  await f("업체 찾기 → 견적 요청서로 서비스가 넘어간다", "/partners", `
    const a = document.querySelector('.svc-i[href*="s=duct"]');
    if(!a) return "덕트 칸이 없습니다";
    go(a.getAttribute("href"));
    await new Promise(r=>setTimeout(r,300));
    return document.getElementById("rq-svc").value === "duct";`);

  await f("진단 결과 → MY 에 남는다", "/check", `
    try{ localStorage.clear(); }catch(e){}
    render(); await new Promise(r=>setTimeout(r,200));
    WOW_CHECK.forEach(it => chkPick(it.key, 1));
    chkDone({preventDefault(){}});
    await new Promise(r=>setTimeout(r,300));
    go("/my"); await new Promise(r=>setTimeout(r,300));
    const t = document.getElementById("view").textContent;
    return /50점/.test(t) && /무료 사업진단/.test(t);`);
  await f("진단 결과 → 이 결과로 물어보기가 SOS 를 채운다", "/check", `
    WOW_CHECK.forEach(it => chkPick(it.key, 2));
    chkDone({preventDefault(){}});
    await new Promise(r=>setTimeout(r,300));
    const a = document.querySelector('.res-cta a[href^="/sos"]');
    if(!a) return "이 결과로 물어보기 단추가 없습니다";
    go(a.getAttribute("href"));
    await new Promise(r=>setTimeout(r,300));
    return document.getElementById("s-q").value.indexOf("사업진단") >= 0;`);
  await f("창업 체크 → MY 에 남는다", "/start", `
    try{ localStorage.clear(); }catch(e){}
    render(); await new Promise(r=>setTimeout(r,200));
    stToggle("area", true); stToggle("shop", true);
    await new Promise(r=>setTimeout(r,250));
    go("/my"); await new Promise(r=>setTimeout(r,300));
    return /2 \\/ 20/.test(document.getElementById("view").textContent);`);
  await f("창업비 → MY 에 합계가 남는다", "/start/cost", `
    try{ localStorage.clear(); }catch(e){}
    render(); await new Promise(r=>setTimeout(r,200));
    costIn("shop","5,000"); costIn("interior","3,200");
    await new Promise(r=>setTimeout(r,200));
    go("/my"); await new Promise(r=>setTimeout(r,300));
    return /8,200/.test(document.getElementById("view").textContent);`);
  await f("견적 비교 → MY 에 남는다", "/quotes", `
    try{ localStorage.clear(); }catch(e){}
    render(); await new Promise(r=>setTimeout(r,250));
    qcTitle("40평 덕트 재시공");
    qcSet(0,"co","가나덕트"); qcSet(0,"price","1200");
    qcSet(1,"co","다라환기"); qcSet(1,"price","1650");
    await new Promise(r=>setTimeout(r,250));
    const gap = document.querySelector(".qc-sum").textContent;
    go("/my"); await new Promise(r=>setTimeout(r,300));
    const my = document.getElementById("view").textContent;
    return /450/.test(gap) && /2곳/.test(my) && /40평 덕트 재시공/.test(my);`);
  await f("읽던 글 → MY 에 남는다", "/lab/meat-cost-rate", `
    go("/my"); await new Promise(r=>setTimeout(r,300));
    return /읽던 글/.test(document.getElementById("view").textContent)
        && /육류원가율/.test(document.getElementById("view").textContent);`);
  await f("MY 전부 지우기가 실제로 지운다", "/my", `
    const old = window.confirm; window.confirm = () => true;
    myReset(); window.confirm = old;
    await new Promise(r=>setTimeout(r,300));
    const t = document.getElementById("view").textContent;
    return /아직 시작하신 것이 없습니다/.test(t);`);

  await f("연구소 분류 탭이 실제로 걸러 준다", "/lab?c=fac", `
    const n = document.querySelectorAll(".pcard").length;
    const want = wowPostsIn("fac").length;
    return n === want && n > 0 && n < WOW_POSTS.length;`);
  await f("글 체크리스트가 남는다", "/lab/duct-smell-complaint", `
    try{ localStorage.removeItem("wow.lab.v1"); }catch(e){}
    render(); await new Promise(r=>setTimeout(r,250));
    postCk("duct-smell-complaint", 0, true);
    await new Promise(r=>setTimeout(r,150));
    render(); await new Promise(r=>setTimeout(r,250));
    return document.querySelectorAll(".post-ck-l input:checked").length === 1;`);
  await f("검색이 글·서비스·화면을 같이 찾는다", "/search?q=%EB%8D%95%ED%8A%B8", `
    const kinds = [...document.querySelectorAll(".srch-r-t em")].map(e => e.textContent);
    return kinds.length >= 3 && new Set(kinds).size >= 3;`);
  await f("못 찾으면 물어보는 길을 준다", "/search?q=zzz없는말zzz", `
    const a = document.querySelector('.srch-none a[href^="/sos?q="]');
    return !!a;`);
  await f("지역을 고르면 요청에 실린다", "/request?s=duct", `
    document.getElementById("rq-region-s").value = "경기";
    document.getElementById("rq-region").value = "안양";
    document.getElementById("rq-q").value = "덕트 냄새";
    document.getElementById("rq-name").value = "홍길동";
    document.getElementById("rq-tel").value = "010-1234-5678";
    document.getElementById("rq-ag").checked = true;
    let body=null; const o=window.fetch;
    window.fetch=function(u,i){ body=JSON.parse(i.body); return Promise.reject(new Error("테스트")); };
    reqSend({preventDefault(){}});
    await new Promise(r=>setTimeout(r,250)); window.fetch=o;
    return !!body && body.region === "경기 안양";`);

  /* ── 접수가 실패했을 때 ────────────────────────────────────
     ⚠️ 이 화면은 **실패해야 나옵니다.** 그래서 평소 전수 점검에는
     아예 안 잡힙니다 — 일부러 실패시켜서 봅니다. 실제로 이 상태에서
     CSS 선택자 실수(.notice-bad b)로 문장이 깨진 적이 있습니다. */
  const failSetup = `
    document.getElementById("s-q").value = "덕트 냄새 민원이 계속 들어옵니다. 3년 전에 시공했습니다.";
    document.getElementById("s-name").value = "홍길동";
    document.getElementById("s-tel").value = "010-1234-5678";
    document.getElementById("s-ag").checked = true;
    window.fetch = function(){ return Promise.resolve({ ok:false, status:503,
      json:()=>Promise.resolve({error:"지금 접수하지 못했습니다"}) }); };
    sosSend({preventDefault(){}});
    await new Promise(r=>setTimeout(r,400));`;

  await f("접수 실패해도 적은 글이 남는다", "/sos", failSetup + `
    return document.getElementById("s-q").value.length > 10
        && !!document.querySelector("#s-err .notice-bad");`);
  await f("실패 안내가 다시 보내기와 복사를 준다", "/sos", failSetup + `
    const t = [...document.querySelectorAll("#s-err button")].map(b => b.textContent);
    const copy = document.querySelector("#s-err button[data-t]");
    return t.some(x => /다시 보내기/.test(x)) && t.some(x => /복사/.test(x))
        && !!copy && (copy.getAttribute("data-t")||"").indexOf("덕트") >= 0;`);
  await f("실패 안내를 읽어 주는 프로그램이 알아챈다", "/sos", failSetup + `
    return document.querySelector("#s-err .notice-bad").getAttribute("role") === "alert";`);
  /* ⚠️ 문장 안의 <b> 가 덩어리가 되면 그 낱말만 딴 줄에 앉습니다 */
  await f("실패 안내 문장이 줄을 깨지 않는다", "/sos", failSetup + `
    const bad = [...document.querySelectorAll("#s-err .notice-bad span b")]
      .filter(b => { const d = getComputedStyle(b).display;
                     return d === "block" || d === "flex" || d === "grid"; });
    return bad.length ? bad.length + "군데가 문장 속에서 덩어리가 되었습니다" : true;`);
  await f("실패한 뒤 다시 보낼 수 있다", "/sos", failSetup + `
    let tried = 0;
    window.fetch = function(){ tried++; return Promise.resolve({ ok:false, status:503,
      json:()=>Promise.resolve({}) }); };
    document.querySelector("#s-err button").click();
    await new Promise(r=>setTimeout(r,400));
    return tried === 1 && !document.getElementById("s-go").disabled;`);

  /* ── 도구와 글이 서로 이어지는가 ──────────────────────────
     ⚠️ 도구는 "해 보는 것" 이고 글은 "알려 주는 것" 입니다. 둘이 따로
     놀면 진단을 받고도 뭘 읽을지 모르고, 글을 읽고도 뭘 할지 모릅니다. */
  await f("진단 결과가 약한 항목의 글로 보낸다", "/check", `
    WOW_CHECK.forEach(it => chkPick(it.key, 2));   /* 전부 0점 */
    chkDone({preventDefault(){}});
    await new Promise(r=>setTimeout(r,300));
    const links = [...document.querySelectorAll(".res-i-post")];
    if(!links.length) return "글로 가는 길이 하나도 없습니다";
    const want = WOW_CHECK.filter(c => c.post).length;
    return links.length === want
      || links.length + " / 글이 붙은 항목 " + want;`);
  await f("진단에서 걸린 글 주소가 실제로 열린다", "/check", `
    WOW_CHECK.forEach(it => chkPick(it.key, 2));
    chkDone({preventDefault(){}});
    await new Promise(r=>setTimeout(r,300));
    const a = document.querySelector(".res-i-post");
    go(a.getAttribute("href"));
    await new Promise(r=>setTimeout(r,300));
    return !!document.querySelector(".post-hd h1");`);
  await f("창업 단계에서 그 단계 글로 간다", "/start", `
    const links = [...document.querySelectorAll(".st-tag-post")];
    const want = WOW_STARTUP_STEPS.filter(s => s.post).length;
    if(links.length !== want) return links.length + " / " + want;
    go(links[0].getAttribute("href"));
    await new Promise(r=>setTimeout(r,300));
    return !!document.querySelector(".post-hd h1");`);
  /* ⚠️ 가는 곳을 여기에 **박아 두지 마세요.** 글이 가리키는 도구가
     바뀌면 검사만 빨갛게 되고 정작 고칠 것은 없습니다. 글이 적어 둔
     주소와 단추가 같은지, 눌렀을 때 거기로 가는지를 봅니다. */
  await f("글 끝에서 도구로 간다", "/lab/meat-cost-rate", `
    const want = (wowPost("meat-cost-rate").tool || [])[0];
    if(!want) return "글에 도구가 적혀 있지 않습니다";
    const a = document.querySelector(".post-tool");
    if(!a) return "도구로 가는 길이 없습니다";
    if(a.getAttribute("href") !== want)
      return "글은 " + want + " 인데 단추는 " + a.getAttribute("href");
    go(want);
    await new Promise(r=>setTimeout(r,300));
    return location.pathname === want || "눌렀더니 " + location.pathname;`);
  /* ⚠️ 없는 글을 가리키면 손님이 404 를 봅니다 */
  await f("가리키는 글이 전부 실제로 있다", "/", `
    const slugs = new Set(WOW_POSTS.map(p => p.slug));
    const bad = [].concat(
      WOW_CHECK.filter(c => c.post && !slugs.has(c.post)).map(c => "진단:"+c.post),
      WOW_STARTUP_STEPS.filter(s => s.post && !slugs.has(s.post)).map(s => "창업:"+s.post));
    return bad.length ? bad.join(" ") : true;`);
  await f("글이 가리키는 도구 주소가 전부 열린다", "/", `
    const bad = [];
    for(const p of WOW_POSTS){
      if(!p.tool) continue;
      const r = routeInfo(p.tool[0].split("?")[0], {});
      if(!r.ok) bad.push(p.slug + "→" + p.tool[0]);
    }
    return bad.length ? bad.join(" ") : true;`);

  /* ── 접수처가 없을 때 ─────────────────────────────────────
     ⚠️ 접수처(Vercel 환경변수)를 넣기 전에 sosReady 를 켜 두면, 손님이
     다 적고 눌렀는데 실패합니다. 그리고 전화번호도 없으면 연락할
     방법이 하나도 없는 화면이 됩니다 — 그러면 그냥 나갑니다. */
  await f("접수처가 없으면 폼 **위에** 미리 알린다", "/sos", `
    if(bizVal("sosReady")) return true;           /* 켜 두셨으면 넘어갑니다 */
    const n = document.querySelector(".notice"), form = document.querySelector("form.form");
    if(!n) return "안내가 없습니다";
    return n.getBoundingClientRect().top < form.getBoundingClientRect().top
      || "안내가 폼 아래에 있습니다";`);
  await f("견적 요청·파트너 등록에도 같이 알린다", "/request?s=duct", `
    if(bizVal("sosReady")) return true;
    if(!document.querySelector(".notice")) return "견적 요청에 안내가 없습니다";
    go("/partner/apply"); await new Promise(r=>setTimeout(r,300));
    return !!document.querySelector(".notice") || "파트너 등록에 안내가 없습니다";`);
  /* ⚠️ "못 받습니다" 로 끝내면 막다른 길입니다 */
  await f("안내가 막다른 길이 아니다", "/sos", `
    if(bizVal("sosReady")) return true;
    const outs = [...document.querySelectorAll(".notice a")].map(a => a.getAttribute("href"));
    return outs.length >= 2 || "지금 할 수 있는 것으로 가는 길이 없습니다";`);
  await f("sosReady 를 켜면 안내가 사라진다", "/sos", `
    const was = WOW_BIZ.sosReady;
    WOW_BIZ.sosReady = true; render();
    await new Promise(r=>setTimeout(r,250));
    const gone = !document.querySelector(".notice");
    WOW_BIZ.sosReady = was; render();
    await new Promise(r=>setTimeout(r,250));
    return gone || "켜 두어도 안내가 남습니다";`);
  /* ⚠️ **안 쓰는 회사를 방침에 적어 두는 것도 사실과 다른 방침**입니다.
     접수처가 없는데 "슬랙에 전달합니다" 가 적혀 있으면 안 됩니다. */
  await f("안 쓰는 접수처가 방침에 적혀 있지 않다", "/privacy", `
    if(bizVal("sosReady")) return true;
    const bad = (WOW_PRIVACY.trustees||[])
      .filter(t => /전달|발송/.test(String(t[1]||"")))
      .map(t => t[0]);
    return bad.length ? bad.join(" ") + " 가 적혀 있는데 접수처는 아직 없습니다" : true;`);

  /* ── 도구: 사장님이 적은 값을 나눈 것까지만 ────────────────
     지어낼 여지가 없는 계산이라는 말은, 뒤집으면 **안 적은 칸을
     메우면 그 순간 지어낸 숫자**라는 뜻입니다. 빈 칸이 "—" 로
     남는지를 먼저 봅니다. */
  await f("수율: 안 적으면 숫자를 지어내지 않는다", "/tools/yield", `
    try{ localStorage.clear(); }catch(e){}
    render();
    await new Promise(r=>setTimeout(r,250));
    const bs = [...document.querySelectorAll("#yl-res .tl-o b")].map(b=>b.textContent.trim());
    return (bs.length === 4 && bs.every(t => t === "—"))
      || "빈 칸에 " + bs.join(" / ") + " 가 나왔습니다";`);
  await f("수율: 적은 값을 나눈 값이 나온다", "/tools/yield", `
    try{ localStorage.clear(); }catch(e){}
    render();
    await new Promise(r=>setTimeout(r,200));
    ylIn("price","20,000"); ylIn("inkg","10"); ylIn("outkg","6.5");
    ylIn("serve","180");    ylIn("sell","18,000");
    await new Promise(r=>setTimeout(r,200));
    const bs = [...document.querySelectorAll("#yl-res .tl-o b")].map(b=>b.textContent.trim());
    const want = ["65%","30,769원/kg","5,538원","30.8%"];
    return bs.join("|") === want.join("|") || bs.join(" / ");`);
  await f("수율: 적은 숫자가 남는다", "/tools/yield", `
    render();
    await new Promise(r=>setTimeout(r,250));
    return document.getElementById("tl-price").value === "20,000"
      || "다시 열었더니 비어 있습니다";`);
  await f("수율: 지우면 빈 칸으로 돌아간다", "/tools/yield", `
    ylReset();
    await new Promise(r=>setTimeout(r,250));
    const bs = [...document.querySelectorAll("#yl-res .tl-o b")].map(b=>b.textContent.trim());
    return (document.getElementById("tl-price").value === "" && bs.every(t => t === "—"))
      || "지운 뒤에도 숫자가 남아 있습니다";`);

  await f("손익분기: 비율이 없으면 본전 매출을 내지 않는다", "/tools/bep", `
    try{ localStorage.clear(); }catch(e){}
    render();
    await new Promise(r=>setTimeout(r,200));
    bepIn("rent","1,000");
    await new Promise(r=>setTimeout(r,200));
    const bs = [...document.querySelectorAll("#bep-res .tl-o b")].map(b=>b.textContent.trim());
    return (bs[0] === "1,000만원" && bs[1] === "—" && bs[2] === "—")
      || bs.join(" / ");`);
  await f("손익분기: 고정비와 비율로 본전 매출이 나온다", "/tools/bep", `
    try{ localStorage.clear(); }catch(e){}
    render();
    await new Promise(r=>setTimeout(r,200));
    bepIn("rent","1,000"); bepIn("labor","800"); bepIn("util","150"); bepIn("etc","50");
    bepIn("food","35");    bepIn("fee","5");
    bepIn("days","26");    bepIn("ticket","30,000");
    await new Promise(r=>setTimeout(r,200));
    const bs = [...document.querySelectorAll("#bep-res .tl-o b")].map(b=>b.textContent.trim());
    const want = ["2,000만원","60%","3,333만원","128만원"];
    const note = document.querySelector("#bep-res .tl-note").textContent;
    if(bs.join("|") !== want.join("|")) return bs.join(" / ");
    return note.indexOf("43분") >= 0 || "하루 손님 수가 안 나옵니다";`);
  /* ⚠️ 많이 팔수록 손해인 조건을 "본전 매출" 로 얼버무리면 안 됩니다 */
  await f("손익분기: 변동비가 100%를 넘으면 그렇게 말한다", "/tools/bep", `
    try{ localStorage.clear(); }catch(e){}
    render();
    await new Promise(r=>setTimeout(r,200));
    bepIn("rent","1,000"); bepIn("food","70"); bepIn("fee","40");
    await new Promise(r=>setTimeout(r,200));
    const bs = [...document.querySelectorAll("#bep-res .tl-o b")].map(b=>b.textContent.trim());
    const note = document.querySelector("#bep-res .tl-note").textContent;
    return (bs[2] === "—" && note.indexOf("100%") >= 0)
      || "본전 매출 " + bs[2] + " / " + note.slice(0,40);`);

  await f("도구에서 적은 것이 MY 에 뜬다", "/tools/bep", `
    try{ localStorage.clear(); }catch(e){}
    render();
    await new Promise(r=>setTimeout(r,200));
    bepIn("rent","1,000"); bepIn("labor","800"); bepIn("util","150"); bepIn("etc","50");
    bepIn("food","35");    bepIn("fee","5");
    go("/my");
    await new Promise(r=>setTimeout(r,300));
    const t = document.getElementById("view").textContent;
    try{ localStorage.clear(); }catch(e){}
    return (t.indexOf("손익분기 계산") >= 0 && t.indexOf("3,333") >= 0)
      || "MY 에 안 보입니다";`);
  await f("도구 모음에서 다섯 가지가 전부 열린다", "/tools", `
    const hrefs = [...document.querySelectorAll(".tl-c")].map(a=>a.getAttribute("href"));
    const want = ["/check","/tools/yield","/tools/bep","/start/cost","/quotes"];
    return want.every(w => hrefs.indexOf(w) >= 0) || hrefs.join(" ");`);

  /* ── 머리말(head): 브라우저로는 표가 안 나는 것들 ──────────
     ⚠️ 화면을 그리고 나면 JS(paintMeta)가 canonical 을 고쳐 놓기 때문에,
     **브라우저로 봐서는 멀쩡합니다.** 크롤러가 읽는 것은 고쳐지기 전의
     HTML 입니다 — 그래서 여기서는 화면을 보지 않고 **파일을 그대로
     받아서** 셉니다. 실제로 canonical 이 화면마다 둘씩 나가고 있었고,
     전수 점검은 그동안 전부 통과했습니다. */
  await f("화면마다 canonical 이 하나이고 제 주소를 가리킨다", "/", `
    const urls = ["/sos","/check","/tools/yield","/tools/bep","/lab","/my","/start/cost"];
    const bad = [];
    for(const u of urls){
      const html = await (await fetch(u, { cache:"no-store" })).text();
      const n = html.split('<link rel="canonical"').length - 1;
      if(n !== 1){ bad.push(u + " → canonical " + n + "개"); continue; }
      const i = html.indexOf('<link rel="canonical"');
      const seg = html.slice(i, i + 160);
      if(seg.indexOf('href="https://aboutmeat.co.kr' + u + '"') < 0)
        bad.push(u + " → " + seg.slice(0, 70));
    }
    return bad.length ? bad.join(" / ") : true;`);
  await f("화면마다 제목이 하나다", "/", `
    const urls = ["/","/sos","/tools","/tools/bep","/lab/open-permits"];
    const bad = [];
    for(const u of urls){
      const html = await (await fetch(u, { cache:"no-store" })).text();
      const n = html.split("<title>").length - 1;
      if(n !== 1) bad.push(u + " → 제목 " + n + "개");
    }
    return bad.length ? bad.join(" / ") : true;`);
  /* ⚠️ 사람마다 다른 화면이 검색에 올라가면 남의 견적 비교가 잡힙니다 */
  await f("사람마다 다른 화면은 검색에 안 올라간다", "/", `
    const bad = [];
    for(const u of ["/my","/quotes","/search"]){
      const html = await (await fetch(u, { cache:"no-store" })).text();
      if(html.indexOf('name="robots" content="noindex') < 0) bad.push(u);
    }
    return bad.length ? bad.join(" ") + " 에 noindex 가 없습니다" : true;`);

  console.log("\n── 새 화면 흐름 " + 16 + "개 · 화면이 이어지는가 " + 18 +
              "개 · 접수 실패 " + 5 + "개 · 도구와 글 " + 6 +
              "개 · 접수처 없음 " + 5 + "개 · 도구 계산 " + 9 +
              "개 · 머리말 " + 3 + "개");
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
})().catch(err => {
  /* ⚠️ 도중에 터지면 **검사를 안 한 것**입니다 — 통과가 아닙니다.
     브라우저가 도중에 닫히면(메모리 부족·강제 종료) Node 가 스택을
     그대로 토해 내는데, 그 화면만 보면 무엇이 잘못됐는지 모릅니다.
     여기서 받아서 사람 말로 적고 **1 로 끝냅니다.**

     ⚠️ `node check.js | tail` 처럼 파이프로 넘기면 끝 숫자가 tail 의
     것이 됩니다. 실패해도 0 으로 읽힙니다 — 파이프 없이 돌리거나
     `; echo EXIT=${PIPESTATUS[0]}` 을 붙이세요. */
  const m = (err && err.message) ? err.message : String(err);
  console.error("\n❌ 검사를 끝내지 못했습니다 — " + m);
  if (m.indexOf("closed") >= 0)
    console.error("   브라우저가 도중에 닫혔습니다. 대개 메모리가 모자란 것입니다 —" +
                  " 다시 돌려 보시고, 계속 그러면 VIEWS 를 줄여서 나눠 돌리세요.");
  process.exit(1);
});
