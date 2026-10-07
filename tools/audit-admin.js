/* ════════════════════════════════════════════════════════════════════
   영업 작업대 전수 점검 — 일곱 폭 × 아홉 상태

   `/admin` 은 `node check.js` 가 **안 봅니다** (middleware 가 막아서).
   보는 것: 가로 스크롤 · 12px 미만 글씨 · 40px 미만 누름 · 글자 대비(AA) ·
   고르개 딱지가 칸보다 긺 · 자리표시자(undefined · NaN) · 아이콘 빈 자리 ·
   grid 칸에 글과 태그가 섞임.

   ⚠️⚠️ **규칙은 `check.js` 와 같아야 합니다.** 누름은 **높이**로 재고
   (가로로 긴 30px 단추도 누르기 어렵습니다), 대비는 **칸이 직접 들고 있는
   글자**만, 가짜요소 바탕은 **글자를 덮는 크기일 때만** 봅니다 — 글머리
   점(5×5)까지 세면 멀쩡한 글이 전부 걸립니다 (CLAUDE.md 의 180건).

   ⚠️ **씨앗은 검사 안에서만 삽니다.** localStorage 에만 넣고 저장소
   데이터는 그대로 0곳입니다 (절대 규칙 1).

   ⚠️ 되돌려 보실 때는 CSS **맨 뒤에 덧붙이세요.** 같은 규칙 안에 끼워
   넣으면 뒤에 오는 선언이 이겨서 "검사가 안 잡는다" 로 보입니다.
     AUDIT_FAST=1 node tools/audit-admin.js    폭 둘 · 상태 둘만 (빠르게)
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
/* ⚠️ 어디서 돌려도 되게 **이 파일 위치에서** 저장소 뿌리를 찾습니다 */
const ROOT = path.resolve(__dirname, "..");
const TYPE = { ".html":"text/html;charset=utf-8", ".css":"text/css;charset=utf-8",
  ".js":"application/javascript;charset=utf-8", ".png":"image/png" };
const srv = http.createServer((q, r) => {
  let f = decodeURIComponent(q.url.split("?")[0]); if (f === "/") f = "/index.html";
  const p = path.join(ROOT, f);
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { "content-type": TYPE[path.extname(p)] || "text/plain" });
  r.end(fs.readFileSync(p));
});

/* ⚠️ 검사 안에서만 사는 업체입니다 — 저장소 데이터는 그대로 0곳입니다 */
const SEED = {
  v:1, me:"김영업", goal:{ g:"demolish", reg:"gyeonggi", n:30, d:"" },
  last:{ g:"demolish", reg:"gyeonggi" },
  co:[
    { id:"qa1", name:"가나다철거원상복구", tel:"031-000-0000", g:"demolish",
      reg:"gyeonggi", gu:"성남시", url:"https://example.com", memo:"블로그에 시공사진 많음",
      st:"warm", next:"2026-10-03", nextMemo:"수요일 오후에 다시 연락 요청",
      why:"", doc:{}, ar:false, at:"2026-10-05", by:"김영업",
      log:[{d:"2026-10-05",t:"10:12",by:"김영업",w:"add",n:"",r:""},
           {d:"2026-10-06",t:"14:30",by:"김영업",w:"call",n:"관심있음",r:"warm"}] },
    { id:"qa2", name:"사무 · 전문서비스 컨설팅", tel:"02-777-8888", g:"legal",
      reg:"seoul", gu:"강남구", url:"", memo:"", st:"sent", next:"2026-10-07",
      nextMemo:"입점 안내 확인", why:"", doc:{ basic:true, tel:true, svc:true, intro:true },
      ar:false, at:"2026-10-06", by:"김영업",
      log:[{d:"2026-10-06",t:"09:05",by:"김영업",w:"add",n:"",r:""},
           {d:"2026-10-06",t:"11:20",by:"김영업",w:"call",n:"관심있음",r:"warm"},
           {d:"2026-10-06",t:"11:25",by:"김영업",w:"sent",n:"입점 안내 발송",r:""}] },
    { id:"qa3", name:"서울주방설비", tel:"02-333-4444", g:"equip", reg:"seoul",
      gu:"", url:"", memo:"", st:"recall", next:"2026-10-07", nextMemo:"부재중 2회",
      why:"", doc:{}, ar:false, at:"2026-10-07", by:"김영업",
      log:[{d:"2026-10-07",t:"09:00",by:"김영업",w:"add",n:"",r:""},
           {d:"2026-10-07",t:"09:30",by:"김영업",w:"call",n:"부재중",r:"miss"},
           {d:"2026-10-07",t:"13:10",by:"김영업",w:"call",n:"부재중",r:"miss"}] },
    { id:"qa4", name:"부산세무회계", tel:"051-222-3333", g:"tax", reg:"busan",
      gu:"해운대구", url:"", memo:"", st:"no", next:"", nextMemo:"",
      why:"기존 광고 충분", doc:{}, ar:false, at:"2026-10-07", by:"김영업",
      log:[{d:"2026-10-07",t:"10:00",by:"김영업",w:"add",n:"",r:""},
           {d:"2026-10-07",t:"10:40",by:"김영업",w:"call",n:"관심없음",r:"no"},
           {d:"2026-10-07",t:"10:41",by:"김영업",w:"note",n:"거절 사유: 기존 광고 충분",r:""}] },
    { id:"qa5", name:"대구청소방역", tel:"053-111-2222", g:"clean", reg:"daegu",
      gu:"", url:"", memo:"", st:"done", next:"", nextMemo:"", why:"",
      doc:{ basic:true, tel:true, svc:true, intro:true, logo:true, folio:true, verify:true },
      ar:false, at:"2026-10-07", by:"김영업",
      log:[{d:"2026-10-07",t:"08:30",by:"김영업",w:"add",n:"",r:""},
           {d:"2026-10-07",t:"09:10",by:"김영업",w:"call",n:"관심있음",r:"warm"},
           {d:"2026-10-07",t:"09:12",by:"김영업",w:"sent",n:"입점 안내 발송",r:""},
           {d:"2026-10-07",t:"15:00",by:"김영업",w:"done",n:"입점완료",r:""}] },
    { id:"qa6", name:"보관한업체", tel:"064-555-6666", g:"etc", reg:"jeju",
      gu:"", url:"", memo:"", st:"bad", next:"", nextMemo:"", why:"", doc:{},
      ar:true, at:"2026-10-04", by:"김영업", log:[] }
  ]
};

const AUDIT = () => {
  const bad = { scroll:[], font:[], tap:[], contrast:[], sel:[], ph:[], icon:[], grid:[] };

  /* ── 색 ── */
  const parse = c => {
    const m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const p = m[1].split(",").map(x => parseFloat(x));
    return { r:p[0], g:p[1], b:p[2], a:p.length > 3 ? p[3] : 1 };
  };
  const over = (f, b) => ({ r:f.r*f.a + b.r*(1-f.a), g:f.g*f.a + b.g*(1-f.a),
                            b:f.b*f.a + b.b*(1-f.a), a:1 });
  const lum = c => { const f = v => { v /= 255;
      return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); };
    return 0.2126*f(c.r) + 0.7152*f(c.g) + 0.0722*f(c.b); };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b);
    return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05); };

  /* 뒤에 깔린 색 — 투명이면 조상을 타고 올라가고, 덮는 가짜요소도 읽습니다 */
  function bgOf(el) {
    let n = el, acc = [];
    while (n && n.nodeType === 1) {
      const cs = getComputedStyle(n);
      ["::before", "::after"].forEach(ps => {
        const p = getComputedStyle(n, ps);
        if (p.content === "none" || !p.content) return;
        const pc = parse(p.backgroundColor);
        if (!pc || !pc.a) return;
        /* ⚠️⚠️ **가짜요소가 글자를 덮는 크기일 때만** 봅니다. 조상의 상자를
           대신 재면 글머리 점(5×5)이 바탕으로 읽혀 멀쩡한 글이 전부 걸립니다 —
           CLAUDE.md 가 180건으로 겪은 그 자리이고, 처음에 그대로 빠졌습니다. */
        const pw = parseFloat(p.width), ph = parseFloat(p.height);
        if (!(pw > 0) || !(ph > 0)) return;
        const r1 = el.getBoundingClientRect();
        if (pw * ph < r1.width * r1.height * 0.8) return;
        acc.push(pc);
      });
      const c = parse(cs.backgroundColor);
      if (c && c.a) { acc.push(c); if (c.a === 1) break; }
      n = n.parentElement;
    }
    let out = { r:255, g:255, b:255, a:1 };
    for (let i = acc.length - 1; i >= 0; i--) out = over(acc[i], out);
    return out;
  }

  const name = el => {
    let s = el.tagName.toLowerCase();
    if (el.id) s += "#" + el.id;
    if (el.className && typeof el.className === "string")
      s += "." + el.className.trim().split(/\s+/).slice(0, 3).join(".");
    return s;
  };
  const vis = el => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0";
  };

  if (document.documentElement.scrollWidth > window.innerWidth + 1)
    bad.scroll.push(document.documentElement.scrollWidth + " > " + window.innerWidth);

  document.querySelectorAll("#sl *, .ad-fold *, .sl-mod-bg *, .sl-sticky *").forEach(el => {
    if (!vis(el)) return;
    const cs = getComputedStyle(el);
    const own = [].slice.call(el.childNodes)
      .filter(n => n.nodeType === 3).map(n => n.textContent).join("").trim();
    const fs = parseFloat(cs.fontSize);

    if (own && fs && fs < 12) bad.font.push(name(el) + " " + fs + "px");

    /* 누르는 것 — **40px 이상**. ⚠️ `check.js` 와 **같은 규칙**이어야 합니다:
       고르는 자리 전부 · **높이**로 재고(가로로 긴 30px 단추도 누르기 어렵습니다) ·
       체크박스는 감싼 라벨을 잽니다. 처음에 "가로·세로 **둘 다** 40 미만" 으로
       적었다가 200×30 단추를 통과시켰습니다 — 검사가 틀린 것이었습니다. */
    if (el.matches("button, a[href], [onclick], [role=button], select, summary, input[type=checkbox]")
        && cs.position !== "absolute") {
      let box = el.getBoundingClientRect();
      if (el.matches("input[type=checkbox]")) {
        const lb = el.closest("label");
        if (lb) box = lb.getBoundingClientRect();
      }
      const h = Math.round(box.height);
      if (h > 0 && h < 40 && el.offsetParent !== null)
        bad.tap.push(name(el) + " " + h + "px \"" +
          (el.textContent || "").trim().slice(0, 12) + "\"");
    }

    /* 글자 대비 — 칸이 **직접 들고 있는 글자**가 있을 때만 */
    if (own) {
      const fg = parse(cs.color);
      if (fg && fg.a >= 0.95) {
        const bg = bgOf(el);
        const r = ratio(fg, bg);
        const w = parseInt(cs.fontWeight, 10) || 400;
        const big = fs >= 24 || (fs >= 18.66 && w >= 700);
        const need = big ? 3 : 4.5;
        if (r < need) bad.contrast.push(name(el) + " " + r.toFixed(2) +
          " (" + fs + "px/" + w + ", 필요 " + need + ") \"" + own.slice(0, 18) + "\"");
      }
    }

    /* 자리표시자가 새지 않았는지 */
    if (/undefined|NaN|\[object |null곳|: *,/.test(own))
      bad.ph.push(name(el) + " \"" + own.slice(0, 40) + "\"");

    /* 아이콘 자리가 비지 않았는지 */
    if ((el.classList.contains("sl-res-b") || el.classList.contains("sl-sk-b")) &&
        !el.querySelector("svg"))
      bad.icon.push(name(el));

    /* grid 칸에 맨글과 태그가 섞였는지 */
    if (cs.display === "grid" && own && el.children.length)
      bad.grid.push(name(el) + " \"" + own.slice(0, 20) + "\"");
  });

  /* 고르개 딱지가 칸보다 긴지 — <select> 안은 낱말 잘림 검사에 안 걸립니다 */
  const cv = document.createElement("canvas").getContext("2d");
  document.querySelectorAll("select").forEach(s => {
    if (!vis(s)) return;
    const cs = getComputedStyle(s);
    cv.font = cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
    const inner = s.getBoundingClientRect().width -
      parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 24;
    const t = s.options[s.selectedIndex] ? s.options[s.selectedIndex].text : "";
    const w = cv.measureText(t).width;
    if (w > inner) bad.sel.push(name(s) + " \"" + t + "\" " +
      Math.round(w) + " > " + Math.round(inner));
  });
  return bad;
};

(async () => {
  await new Promise(r => srv.listen(0, r));
  const base = "http://127.0.0.1:" + srv.address().port;
  const br = await chromium.launch();
  const FAST = !!process.env.AUDIT_FAST;
  const WIDTHS = FAST ? [1440, 360] : [1440, 1280, 1024, 900, 768, 430, 360];
  const KEYS = ["scroll","font","tap","contrast","sel","ph","icon","grid"];
  const LABEL = { scroll:"가로 스크롤", font:"12px 미만 글씨", tap:"40px 미만 누름",
    contrast:"글자가 바탕에 묻힘", sel:"고르개 딱지가 칸보다 긺",
    ph:"자리표시자가 샘", icon:"아이콘 자리가 빔", grid:"grid 칸에 글과 태그가 섞임" };
  const all = {}; KEYS.forEach(k => all[k] = []);
  /* 화면을 네 상태로 — 기본 · 펼친 줄 · 전화 판 · 관리자 설정 펼침 */
  const STATES = [
    ["기본", async pg => {}],
    ["펼친 줄", async pg => { await pg.click(".sl-row-b >> nth=0"); }],
    ["전화 판", async pg => { await pg.evaluate(() => { SL.modal = { k:"call", id:"qa1" }; slDraw(); }); }],
    ["안내 판", async pg => { await pg.evaluate(() => { SL.modal = { k:"warm", id:"qa1" }; slDraw(); }); }],
    ["재연락 판", async pg => { await pg.evaluate(() => { SL.modal = { k:"when", id:"qa1" }; slDraw(); }); }],
    ["사유 판", async pg => { await pg.evaluate(() => { SL.modal = { k:"why", id:"qa1" }; slDraw(); }); }],
    ["보관함", async pg => { await pg.evaluate(() => { SL.modal = { k:"arch", id:"" }; slDraw(); }); }],
    ["관리자 설정", async pg => { await pg.click(".ad-fold > summary"); await pg.waitForTimeout(200); }],
    ["이번달 실적", async pg => { await pg.click(".sl-st .sl-chip:has-text('이번달')"); }]
  ].filter((_, i) => !FAST || i === 0 || i === 2);

  for (const w of WIDTHS) {
    for (const [sname, setup] of STATES) {
      const ctx = await br.newContext({ viewport:{ width:w, height:900 } });
      await ctx.addInitScript(d => {
        localStorage.setItem("am.sales.v1", JSON.stringify(d));
      }, SEED);
      const pg = await ctx.newPage();
      await pg.goto(base + "/admin.html", { waitUntil:"networkidle" });
      await setup(pg);
      await pg.waitForTimeout(150);
      const bad = await pg.evaluate(AUDIT);
      Object.keys(bad).forEach(k => bad[k].forEach(v =>
        all[k].push(w + "px " + sname + " · " + v)));
      await ctx.close();
    }
  }
  await br.close(); srv.close();

  let n = 0;
  KEYS.forEach(k => {
    const u = [...new Set(all[k])];
    if (!u.length) return;
    n += u.length;
    console.log("\n❌ " + LABEL[k] + " — " + u.length + "건");
    u.slice(0, 14).forEach(v => console.log("   · " + v));
    if (u.length > 14) console.log("   … 외 " + (u.length - 14) + "건");
  });
  console.log(n ? "\n합계 " + n + "건" : "\n✅ 일곱 폭 × 아홉 상태 전부 통과");
  process.exit(n ? 1 : 0);
})();
