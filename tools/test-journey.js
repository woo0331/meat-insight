#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   손님 한 분이 **로그인한 채로** 돌아다녀 봅니다 — tools/test-journey.js

     node tools/test-journey.js
     node tools/test-journey.js --prove    일부러 깨뜨려 봅니다

   ⚠️⚠️⚠️ **왜 이 검사가 따로 있는가**
   ───────────────────────────────────────────────────────────────────
   `check-links` 는 **빌드가 찍은 HTML** 의 링크만 봅니다. 그런데 이
   저장소의 화면 상당수는 **로그인한 뒤에** 링크를 그립니다 —
   `js/myreq.js` 의 "가져오기", `js/matchform.js` 의 "내 정보에서 견적
   보기", `js/deskstart.js` 의 "#mebox", `js/myjoin.js` 의 "골프 조인에서
   열기" … 그 링크들은 **아무 검사도 안 보고 있었습니다.** 하나가
   410 으로 가거나 없는 주소를 가리켜도 초록이었습니다.

   ⚠️⚠️ **그리고 0건인 상자가 막다른 길이 아닌지 봅니다** (절대 규칙 2 —
   "0 인 자리에는 지금 실제로 되는 것을 같이 냅니다"). 2026-11-06 에
   이 검사를 처음 돌려서 찾은 것이 그것입니다: `/my` 의 **내 요청**
   상자가 0건일 때 "로그인 전에 넣은 요청 가져오기" 하나만 내고
   있었습니다 — 오늘 막 가입하신 분께 **옛 요청을 되찾는 법**만 알려
   주고 정작 **새로 넣는 법**(이 서비스의 알맹이)은 한 글자도 없었습니다.
   옆의 세 상자(조인 · 커뮤니티 · 인력)는 전부 길을 내고 있었는데
   거기만 빠져 있었습니다.

   ⚠️ **갯수를 박지 않습니다** — 화면이 늘면 목록만 늘리면 됩니다.
   재는 뜻은 ① 에러 · CSP 거절이 0건인가 ② 그려진 링크가 **실제로
   열리는 주소**인가 ③ 그려진 상자가 **막다른 길이 아닌가** 셋입니다.

   ⚠️ 주소를 파일로 푸는 규칙은 `tools/_serve.js` · `check-links` 와
   **같아야** 합니다 (404 를 더하던 날 셋이 달라서 한 번 겪었습니다).
   ════════════════════════════════════════════════════════════════════ */
"use strict";
const { chromium } = require("playwright");
const { serve, watch }  = require("./_serve.js");
const { stub } = require("./_stub.js");
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");

let bad = 0, ran = 0;
function ok(name, cond, got){
  ran++;
  if(cond) console.log("  ✅ " + name);
  else { bad++; console.log("  ❌ " + name +
    (got === undefined ? "" : "  →  " + String(got).slice(0, 300))); }
}

const CUS = { role:"customer", name:"홍길동", signedIn:true };

/* 손님에게 보일 만한 자료 — ⚠️ 값은 DB 가 받는 것이어야 합니다
   (아니면 화면이 키를 그대로 찍고, 그걸 보고 멀쩡한 코드를 고치려
   들게 됩니다 — 조인에서 겪은 자리입니다). */
const REQ = { id:"r-1", no:"SW-7K3M-92QP", state:"quoted", cat:"lesson",
  region:"서울", gu:"강남구", budget_min:300000, budget_max:800000,
  want_at:"2026-12-01", body:"주말 오전이 좋습니다", name:"홍길동",
  tel:"010-1234-5678", email:"", agree3rd_at:"2026-11-03T03:00:00Z",
  created_at:"2026-11-03T01:00:00Z", want_provider:null, owner_id:null };
const FULL = {
  request:[REQ],
  request_item:[{ request_id:"r-1", service_id:"ls-solo", state:"new" }],
  quote:[{ id:"q-1", request_id:"r-1", provider_id:"t-range", amount:600000,
    vat:"add", scope:"주 1회 90분 8회", excludes:"타석 이용료 별도", days:60,
    start_on:"2026-11-10", warranty:"1개월", valid_to:"2026-11-30", note:null,
    state:"open", created_at:"2026-11-03T04:00:00Z", updated_at:null }],
  provider:[{ id:"t-range", name:"남서울 실내연습장" }],
  notice:[{ id:"n-1", kind:"quote", title:"받으신 견적이 하나 늘었습니다",
    link:"/my", obj:null, obj_id:null, read_at:null,
    created_at:"2026-11-06T01:00:00Z" }],
  inquiry:[{ id:"iq-1", no:"IQ-261106-0001", kind:"use",
    body:"요청이 안 들어갑니다", state:"answered",
    answer:"지역을 넓혀 주시면 배정이 갑니다.",
    answered_at:"2026-11-06T02:00:00Z", created_at:"2026-11-05T01:00:00Z" }],
  assignment:[], review:[], appointment:[], cq:[], ca:[],
  v_cq_public:[], v_ca_public:[], joinroom:[], joinapply:[],
  v_join_open:[], v_join_contact:[], jobpost:[], jobapply:[],
  v_job_open:[], v_job_contact:[]
};
/* 오늘 막 가입하신 분 — **가장 흔한 날 1의 모습**입니다 */
const EMPTY = Object.keys(FULL).reduce(function(o, k){ o[k] = []; return o; }, {});

/* 손님이 실제로 지나는 길 — ⚠️ 새 화면을 만드는 날 여기 한 줄 더하세요 */
/* ⚠️⚠️ **분류 열 장을 다 돕니다** (2026-11-06). 전에는 넷만 돌아서
   `/cat/used` 가 **없는 기능을 있다고 말하는 것**을 아무도 안 봤습니다
   ("첫 매물이 올라오면 여기에 바로 보입니다" — 매물을 올리는 표도 문도
   화면도 없습니다). 열 장이라 느려지는 것보다 그 쪽이 큽니다. */
const PAGES = ["/", "/categories", "/cat/lesson", "/cat/used", "/cat/booking",
  "/cat/matchup", "/cat/range", "/cat/market", "/cat/fitting", "/cat/travel",
  "/cat/career", "/cat/community",
  /* ⚠️ 0059 — 게시판 하나로 좁힌 주소도 돕니다 (거르개가 주소를 바꾸므로
     그 주소로 바로 들어와도 열려야 합니다). */
  "/cat/community?s=cm-open",
  /* ⚠️⚠️ 0069 — **중고 상세 화면**(`?v=`)과 묶음 탭(`?g=`)도 그 주소로
     바로 들어와야 합니다. 상세는 흉내 자료가 0줄이라 "지금은 볼 수
     없는 매물입니다" 가 뜨고, 여기서 재는 것은 **에러 0건과 그 상자의
     링크가 실제로 열리는 주소인가**입니다 (`check-links` 는 빌드가 찍은
     HTML 만 보므로 이 뒤는 영원히 못 봅니다). */
  "/cat/used?v=11111111-1111-1111-1111-111111111111",
  "/cat/used?g=club", "/categories", "/search", "/match",
  "/match?cat=lesson", "/my", "/help", "/guide", "/terms", "/privacy",
  "/login", "/404"].filter(function(x, i, L){ return L.indexOf(x) === i; });

/* 주소 → 파일. `cleanUrls` 처럼 `<주소>.html` 도 풉니다 (404 가 그 자리). */
function resolves(href){
  if(!href) return false;
  if(href.indexOf("#") === 0) return true;
  if(/^(https?:|mailto:|tel:)/.test(href)) return true;
  const u = href.split("#")[0].split("?")[0];
  if(u === "" || u === "/") return fs.existsSync(path.join(ROOT, "index.html"));
  const rel = u.replace(/^\//, "");
  return fs.existsSync(path.join(ROOT, rel)) ||
         fs.existsSync(path.join(ROOT, rel, "index.html")) ||
         fs.existsSync(path.join(ROOT, rel + ".html"));
}

/* ⚠️ 막다른 길이 아니라는 뜻 — 그 상자 안에서 **할 수 있는 것이 하나는
   있는가** (어디로 가는 링크 · 누르는 단추 · 적는 양식 가운데 하나).
   갯수를 세지 않습니다. */
/* ⚠️ 새 /my 상자를 만드는 날 **이 줄을 같이 늘리세요** — 안 늘리면
   그 상자만 조용히 아무도 안 재는 자리가 됩니다 (0056 의 lsmine). */
/* ⚠️⚠️ **새 /my 상자를 만드는 날 여기 한 줄을 같이 더하세요** — 안
   더하면 그 상자만 조용히 아무도 안 재는 자리가 됩니다 (0051 의 사진
   상자가 흉내 자료가 없어 한 번도 안 그려진 그 자리). */
const MY_BOXES = ["mybox", "reqbox", "joinmine", "lsmine", "mycq", "jobmine",
                  /* ⚠️ 0059 — 공개 닉네임 상자 (js/mynick.js) */
                  "wchbox", "nickbox",
                  /* ⚠️ 0061 — 내가 올린 구합니다 (js/mywanted.js) */
                  "wtmine",
                  /* ⚠️ 0069 — 관심상품 (js/myfav.js). **새 `/my` 상자를
                     만드는 날 이 줄과 `shot-desk` 의 `BOXES` 를 같이
                     늘립니다** — 안 늘리면 그 상자만 조용히 아무도 안
                     재고 아무도 안 보는 자리가 됩니다. */
                  "favbox"];

(async function(){
  const prove = process.argv.indexOf("--prove") >= 0;
  const PORT = 8910 + (process.pid % 40);
  const srv = (await serve(PORT)).srv;
  const b = await chromium.launch();
  const base = "http://127.0.0.1:" + PORT;

  /* 그 상자 **안쪽**의 링크만 — 머리말 · 푸터를 집지 않게 */
  async function boxLinks(id){
    const p = await b.newPage({ viewport:{ width:1280, height:900 } });
    await stub(p, CUS, EMPTY, {}, true);
    await p.goto(base + "/my", { waitUntil:"networkidle" });
    await p.waitForTimeout(600);
    const out = await p.evaluate(function(i){
      const e = document.getElementById(i);
      return e ? Array.prototype.map.call(e.querySelectorAll("a[href]"),
        function(a){ return a.getAttribute("href"); }) : [];
    }, id);
    await p.close();
    return out;
  }

  async function look(route, tables){
    const p = await b.newPage({ viewport:{ width:1280, height:900 } });
    const errs = watch(p);
    await stub(p, CUS, tables, {}, true);
    await p.goto(base + route, { waitUntil:"networkidle" });
    await p.waitForTimeout(600);
    const r = await p.evaluate(function(ids){
      const out = { hrefs:[], noHref:0, text:0, boxes:{} };
      out.hrefs = Array.prototype.map.call(document.querySelectorAll("a[href]"),
        function(a){ return a.getAttribute("href"); });
      out.noHref = Array.prototype.filter.call(document.querySelectorAll("a"),
        function(a){ return !a.getAttribute("href"); }).length;
      out.text = (document.body.innerText || "").trim().length;
      /* ⚠️ 글자 수(`text`)와 **글 자체**(`body`)는 다릅니다 — 섞어 쓰면
         숫자에 indexOf 를 걸어 조용히 터집니다. */
      out.body = (document.body.innerText || "");
      ids.forEach(function(id){
        const e = document.getElementById(id);
        if(!e || e.hidden || !e.children.length) return;   /* 안 그려졌으면 셀 것이 없습니다 */
        out.boxes[id] = e.querySelectorAll("a[href], button, form").length;
      });
      return r2(out);
      function r2(x){ return x; }
    }, MY_BOXES);
    await p.close();
    return { errs: errs, r: r };
  }

  console.log("\n── 손님이 로그인한 채로 한 바퀴 돕니다");
  for(const route of PAGES){
    const { errs, r } = await look(route, FULL);
    ok(route + " — 화면 에러 · CSP 거절이 0건이다", errs.length === 0,
       errs.join(" | "));
    /* ⚠️⚠️ **로그인한 뒤에 그려진 링크**는 check-links 가 영원히 못
       봅니다 — 여기가 유일한 자리입니다. */
    const dead = Array.from(new Set(r.hrefs)).filter(function(h){ return !resolves(h); });
    ok("  그려진 링크가 전부 열리는 주소다 (" + r.hrefs.length + "개)",
       dead.length === 0 && r.hrefs.length > 0, dead.join(" · "));
    /* ⚠️ 눌러도 아무 일이 안 나는 칸을 만들지 않습니다 (절대 규칙 5) */
    ok("  href 없는 a 태그가 없다", r.noHref === 0, "a " + r.noHref + "개");
  }


  /* ══════════════════════════════════════════════════════════════
     머리말 메뉴 일곱 + 하위 메뉴   (2026-11-09 · 통합 지시서 §3 · §5)

     ⚠️⚠️⚠️ **`check-screens` 는 이 자리를 못 봅니다.** 하위 메뉴는
     `display:none` 으로 시작하고 그 도구는 **안 그려진 칸을 건너뜁니다**
     (일부러 그렇게 고친 자리입니다). 그래서 펼친 뒤의 글자 대비 · 가로
     밀림 · 누름 높이는 **여기서만** 재집니다.
     ⚠️ 그리고 폰에서는 `js/hdmenu.js` 가 메뉴를 접으므로, 햄버거를
     **눌러 보지 않으면** 메뉴 일곱이 영원히 안 재집니다.

     ⚠️ 갯수를 박지 않습니다 — `build.js` 의 `NAV` 가 늘면 이 검사도
     같이 늘어야 하므로, 화면에서 **세어서** 맞춰 봅니다.
     ══════════════════════════════════════════════════════════════ */
  console.log("\n── 머리말 메뉴 일곱과 하위 메뉴");
  {
    const p = await b.newPage({ viewport:{ width:1440, height:900 } });
    await p.goto(base + "/", { waitUntil:"domcontentloaded" });

    const top = await p.evaluate(function(){
      var is = [].slice.call(document.querySelectorAll(".gnb .gnb-i"));
      return {
        n: is.length,
        names: is.map(function(x){
          var a = x.querySelector(".gnb-t");
          return a ? (a.textContent||"").trim() : ""; }),
        hrefs: is.map(function(x){
          var a = x.querySelector(".gnb-t");
          return a ? a.getAttribute("href") : null; }),
        /* 하위가 있는 칸에는 펼치는 단추가 있어야 합니다 */
        toggles: is.filter(function(x){ return x.querySelector(".gnb-x"); }).length,
        subs: is.map(function(x){
          return [].slice.call(x.querySelectorAll(".gnb-d a"))
                   .map(function(a){ return a.getAttribute("href"); }); })
      };
    });
    ok("PC 에서 상단 메뉴가 **일곱**이다", top.n === 7, top.n + "개 · " + top.names.join(" / "));
    ok("  일곱 다 **링크**다 (단추만 있는 칸이 없습니다)",
       top.hrefs.length === 7 && top.hrefs.every(function(h){ return h && h !== "#"; }),
       JSON.stringify(top.hrefs));
    ok("  일곱 다 하위 메뉴를 펼치는 단추가 있다", top.toggles === 7, top.toggles + "개");

    /* ⚠️⚠️ **하위 링크가 전부 열리는 주소인가** — 여기가 유일한 자리입니다
       (`check-links` 는 빌드가 찍은 HTML 의 링크를 보지만 `#` 뒤는 안 봅니다). */
    const subAll = top.subs.reduce(function(a,b){ return a.concat(b); }, []);
    const subDead = Array.from(new Set(subAll)).filter(function(h){ return !resolves(h); });
    ok("  하위 메뉴 링크가 전부 열리는 주소다 (" + subAll.length + "개)",
       subAll.length > 0 && subDead.length === 0, subDead.join(" · "));
    ok("  ⚠️ 하위가 0개인 메뉴가 없다 (펼쳐도 빈 칸이면 절대 규칙 5)",
       top.subs.every(function(l){ return l.length > 0; }),
       JSON.stringify(top.subs.map(function(l){ return l.length; })));

    /* 펼치기 — ⚠️ 단추를 **눌러서** 봅니다(`:hover` 는 CSS 라 따로 재야
       하지만, 손가락 · 키보드로 되는지가 더 중요합니다). */
    const before = await p.evaluate(function(){
      var d = document.querySelector(".gnb .gnb-i .gnb-d");
      return { shown: d ? d.getClientRects().length > 0 : null,
               exp: document.querySelector(".gnb .gnb-x").getAttribute("aria-expanded") };
    });
    ok("  펼치기 전에는 하위가 **안 보인다**", before.shown === false, JSON.stringify(before));
    ok("  펼치기 전 aria-expanded 가 false 다", before.exp === "false", String(before.exp));

    await p.click(".gnb .gnb-i:first-child .gnb-x");
    const after = await p.evaluate(function(){
      var i = document.querySelector(".gnb .gnb-i");
      var d = i.querySelector(".gnb-d");
      var r = d.getBoundingClientRect();
      /* 펼친 칸의 글자색 · 바탕색을 **재서** 봅니다 (계산이 아니라 값) */
      var a = d.querySelector("a");
      var cs = getComputedStyle(a);
      return { shown: d.getClientRects().length > 0,
               exp: i.querySelector(".gnb-x").getAttribute("aria-expanded"),
               right: r.right, vw: window.innerWidth,
               tapH: Math.round(a.getBoundingClientRect().height),
               color: cs.color, bg: getComputedStyle(d).backgroundColor,
               wide: document.documentElement.scrollWidth > window.innerWidth + 1 };
    });
    ok("  단추를 누르면 하위가 **펼쳐진다**", after.shown === true, JSON.stringify(after));
    ok("  펼친 뒤 aria-expanded 가 true 다", after.exp === "true", String(after.exp));
    ok("  펼친 칸이 **화면 밖으로 안 나간다**", after.right <= after.vw + 1,
       after.right + " / " + after.vw);
    ok("  펼쳐도 **가로로 안 밀린다**", after.wide === false, JSON.stringify(after));
    /* ⚠️ 누르는 자리는 40px 이상입니다 (손님이 40~60대입니다) */
    ok("  하위 링크의 누름 높이가 40px 이상이다", after.tapH >= 40, after.tapH + "px");

    /* ⚠️⚠️ **하나만 열립니다** — 여럿이 같이 열리면 떠 있는 칸이 겹칩니다 */
    await p.click(".gnb .gnb-i:nth-child(2) .gnb-x");
    const onN = await p.evaluate(function(){
      return document.querySelectorAll(".gnb .gnb-i.on").length; });
    ok("  한 번에 **하나만** 펼쳐진다", onN === 1, onN + "개");

    /* Esc — ⚠️ 닫고 **초점을 단추로 되돌립니다** (키보드 접근성 · §5) */
    await p.keyboard.press("Escape");
    const esc = await p.evaluate(function(){
      return { on: document.querySelectorAll(".gnb .gnb-i.on").length,
               focus: document.activeElement &&
                      document.activeElement.className };
    });
    ok("  Esc 로 닫힌다", esc.on === 0, JSON.stringify(esc));
    ok("  Esc 뒤 초점이 **펼치기 단추**로 돌아온다",
       String(esc.focus || "").indexOf("gnb-x") >= 0, String(esc.focus));

    /* 키보드로 펼치기 — ⚠️ 단추이므로 Enter 가 눌림과 같아야 합니다 */
    await p.evaluate(function(){
      document.querySelector(".gnb .gnb-i:nth-child(3) .gnb-x").focus(); });
    await p.keyboard.press("Enter");
    const kb = await p.evaluate(function(){
      var i = document.querySelectorAll(".gnb .gnb-i")[2];
      return i.querySelector(".gnb-d").getClientRects().length > 0; });
    ok("  키보드(Enter)로도 펼쳐진다", kb === true, String(kb));
    await p.close();
  }

  /* 폰 — 햄버거 */
  for(const w of [360, 390, 430]){
    const p = await b.newPage({ viewport:{ width:w, height:900 } });
    await p.goto(base + "/", { waitUntil:"domcontentloaded" });
    const shut = await p.evaluate(function(){
      var b = document.querySelector(".hd-burger");
      var g = document.querySelector(".gnb");
      return { burger: b ? b.getClientRects().length > 0 : false,
               hidden: b ? b.hasAttribute("hidden") : null,
               menu: g ? g.getClientRects().length > 0 : null,
               js: document.querySelector(".hd").classList.contains("nav-js") };
    });
    ok(w + "px — 햄버거가 **보인다**", shut.burger === true, JSON.stringify(shut));
    ok("  " + w + "px — `hidden` 이 떨어졌다 (js 가 켜진 표)",
       shut.hidden === false && shut.js === true, JSON.stringify(shut));
    ok("  " + w + "px — 열기 전에는 메뉴가 접혀 있다", shut.menu === false, JSON.stringify(shut));

    /* ⚠️⚠️ **눌리지 않아도 검사가 죽으면 안 됩니다.** 되돌려 보기로
       햄버거를 숨겨 보니 `p.click` 이 그 자리에서 터져 **뒤 검사가 통째로
       안 돌았습니다** — 그러면 무엇이 더 깨졌는지 알 수가 없습니다.
       못 누른 것도 결과로 적고 계속 갑니다. */
    let clicked = true;
    try{ await p.click(".hd-burger", { timeout: 4000 }); }
    catch(e){ clicked = false; }
    ok("  " + w + "px — 햄버거를 **누를 수 있다**", clicked === true, "못 눌렀습니다");
    const open = await p.evaluate(function(){
      var is = [].slice.call(document.querySelectorAll(".gnb .gnb-i"));
      var seen = is.filter(function(x){
        var a = x.querySelector(".gnb-t");
        return a && a.getClientRects().length > 0; });
      var box = document.querySelector(".gnb").getBoundingClientRect();
      /* ⚠️⚠️ **밀면 보이는 것은 보이는 것이 아닙니다** — 상자 밖으로
         밀린 칸이 있는지 셉니다 (2026-11-04 에 넷째 메뉴로 겪은 자리). */
      var out = seen.filter(function(x){
        var r = x.getBoundingClientRect();
        return r.right > box.right + 1 || r.left < box.left - 1; }).length;
      return { n: seen.length, out: out,
               wide: document.documentElement.scrollWidth > window.innerWidth + 1,
               exp: document.querySelector(".hd-burger").getAttribute("aria-expanded") };
    });
    ok("  " + w + "px — 누르면 메뉴 **일곱이 다 보인다**", open.n === 7, JSON.stringify(open));
    ok("  " + w + "px — 상자 밖으로 밀린 메뉴가 0개다", open.out === 0, JSON.stringify(open));
    ok("  " + w + "px — 메뉴를 열어도 가로로 안 밀린다", open.wide === false, JSON.stringify(open));
    ok("  " + w + "px — 햄버거의 aria-expanded 가 true 다", open.exp === "true", String(open.exp));

    /* 폰에서도 하위가 펼쳐져야 합니다 (아코디언) */
    try{ await p.click(".gnb .gnb-i:first-child .gnb-x", { timeout: 4000 }); }catch(e){}
    const acc = await p.evaluate(function(){
      var d = document.querySelector(".gnb .gnb-i .gnb-d");
      var r = d.getBoundingClientRect();
      return { shown: d.getClientRects().length > 0,
               right: Math.round(r.right), vw: window.innerWidth,
               wide: document.documentElement.scrollWidth > window.innerWidth + 1 };
    });
    ok("  " + w + "px — 하위가 아코디언으로 펼쳐진다", acc.shown === true, JSON.stringify(acc));
    ok("  " + w + "px — 펼쳐도 가로로 안 밀린다",
       acc.wide === false && acc.right <= acc.vw + 1, JSON.stringify(acc));
    await p.close();
  }

  /* ⚠️⚠️⚠️ **열 분류 띠 묶음을 뺐습니다** (2026-11-08) — 머리말이 시안
     대로 **한 줄**이 되면서 띠(`#catnav`)와 `js/hdnav.js` 가 없어졌습니다.
     열 분류로 가는 길은 ① 머리말 메뉴 아홉 ② 푸터의 '서비스' 칸 **열**
     ③ `/categories` 셋이고, `check-links` 의 외톨이 검사가 그 길을 셉니다.
     ⚠️ 안 쓰는 검사를 남겨 두면 다음 차수가 **없는 기능을 있다고** 읽습니다
     (0052 에서 겪은 자리). 지우는 것까지가 일입니다. */

  /* ══════════════════════════════════════════════════════════════
     ⚠️⚠️⚠️ **설정이 꺼져 있을 때 "0건" 이라고 말하던 자리** (2026-11-07)

     빌드가 찍어 둔 글이 "보이지 않으면 아직 올라온 글이 없는 것입니다"
     였습니다. 그런데 로그인 · 접수가 설정되기 전에는 목록을 **불러오지도
     못하므로**, 그 글이 손님 화면에 그대로 남아 **0건이라고 말하고**
     있었습니다 — 실제로는 열지 않은 것입니다 (절대 규칙 5 · 작업 기억의
     "못 읽었으면 0건이라고 말하지 않습니다"). 다섯 화면이 그랬고, 사장님이
     "커뮤니티에 글쓰기 기능이 없다" 고 하신 것이 바로 이 꼴입니다 —
     글쓰기 단추도 목록도 **로그인 뒤에** 그려지므로 설정 전에는 한 줄도
     안 나오는데, 화면은 "글이 없다" 고만 적고 있었습니다.

     ⚠️⚠️ **흉내 장치를 안 씌우고** 엽니다 — 그것이 지금 운영의 상태와
     같습니다 (`_serve.js` 는 서버리스 함수를 안 돌리므로 `/api/session`
     이 404 이고, 화면은 "설정 안 됨" 으로 읽습니다). 흉내를 씌우면
     Supabase 가 켜진 길만 재게 되어 **이 자리는 영원히 안 보입니다.**
     ⚠️ 갯수를 박지 않습니다 — 새 목록 화면을 만드는 날 `SHUT` 에 한 줄만
     더하세요 (상자 id 와 함께). 안 더하면 그 화면만 조용히 같은 꼴이
     됩니다.
     ══════════════════════════════════════════════════════════════ */
  console.log("\n── ⚠️⚠️⚠️ 설정이 꺼져 있을 때 — **0건이라고 말하지 않는가**");
  {
    const SHUT = [["/cat/community","cqlist"], ["/cat/booking","ttlist"],
                  ["/cat/matchup","joinlist"], ["/cat/used","lslist"],
                  ["/cat/career","joblist"]];
    let seen = 0;
    for(const pair of SHUT){
      const route = pair[0], id = pair[1];
      const p0 = await b.newPage({ viewport:{ width:1280, height:900 } });
      const errs = watch(p0);
      /* ⚠️ 흉내를 **안** 씌웁니다 */
      await p0.goto(base + route, { waitUntil:"networkidle" });
      await p0.waitForTimeout(600);
      const r0 = await p0.evaluate(function(i){
        const e = document.getElementById(i);
        if(!e) return null;
        const a = e.querySelector('a[href="/help"]');
        return { txt:(e.innerText || "").replace(/\s+/g, " ").trim(),
                 /* ⚠️ `hidden` 을 걸어도 안 가려지는 자리가 있어
                    `offsetParent` 로 **실제로 보이는지** 봅니다 */
                 help: !!(a && a.offsetParent) };
      }, id);
      await p0.close();
      ok(route + " — #" + id + " 상자가 있다 (잴 자리를 찾았다)", !!r0, "없습니다");
      if(!r0) continue;
      seen++;
      ok("  설정이 꺼졌을 때 **0건이라고 말하지 않는다**",
         r0.txt.indexOf("없는 것입니다") < 0, r0.txt.slice(0, 140));
      ok("  그 대신 **준비가 끝나지 않았다**고 적는다",
         r0.txt.indexOf("아직 준비가 끝나지 않았습니다") >= 0, r0.txt.slice(0, 140));
      /* ⚠️ 막다른 길로 두지 않습니다 (절대 규칙 2) */
      ok("  막다른 길이 아니다 — 고객센터로 가는 길이 **보인다**", r0.help,
         "단추가 없거나 가려져 있습니다");
      /* ⚠️ 운영자에게 할 말은 console 로만 (절대 규칙 3) */
      ok("  무엇을 설정해야 하는지는 화면에 적지 않는다",
         r0.txt.indexOf("SUPABASE") < 0 && r0.txt.indexOf("Vercel") < 0,
         r0.txt.slice(0, 140));
      ok("  그 자리에서 화면 에러가 나지 않는다", errs.length === 0, errs.join(" | "));
    }
    /* ⚠️ 잰 것이 0개면 실패입니다 */
    ok("⚠️ 잰 화면이 0개가 아니다 (" + seen + "장)", seen === SHUT.length,
       seen + "/" + SHUT.length);
  }

  console.log("\n── ⚠️⚠️ 오늘 막 가입하신 분의 /my — **막다른 길이 아닌가**");
  {
    const { errs, r } = await look("/my", EMPTY);
    ok("화면 에러가 0건이다", errs.length === 0, errs.join(" | "));
    const drawn = Object.keys(r.boxes);
    /* ⚠️ 잰 것이 0개면 실패입니다 — 상자를 하나도 못 찾고 초록이 되는
       자리를 만들지 않습니다. */
    ok("0건인 상자가 그래도 몇 개는 그려진다 (잰 것이 0이 아니다)",
       drawn.length > 0, JSON.stringify(r.boxes));
    drawn.forEach(function(id){
      ok("  #" + id + " 에 **할 수 있는 것**이 있다 (0건이어도 막다른 길이 아니다)",
         r.boxes[id] > 0, "누를 것 " + r.boxes[id] + "개");
    });
    /* ⚠️⚠️⚠️ **이 서비스의 알맹이는 매칭 요청입니다.** 0건인 자리에서
       그 길을 안 내면, 막 가입하신 분은 "옛 요청 가져오기" 만 보게
       됩니다 (2026-11-06 에 실제로 그랬습니다). */
    /* ⚠️⚠️⚠️ **그 상자 안쪽만** 봅니다. 화면 전체에서 `/match` 를
       찾으면 **머리말 메뉴**가 그 글자를 들고 있어서, 상자에서 단추를
       떼어내도 초록입니다 — 되돌려 보기가 그것을 잡았습니다(0052 의
       `#pvstadm` 에서 똑같이 밟은 자리입니다). */
    const inBox = await boxLinks("reqbox");
    ok("⚠️⚠️ 요청이 0건일 때 **그 상자 안에서** 새로 넣는 길을 낸다 " +
       "(가져오기만 두지 않는다)",
       inBox.indexOf("/match") >= 0, inBox.join(" · ").slice(0, 200));
  }

  /* ══════════════════════════════════════════════════════════════
     ⚠️⚠️⚠️ **없는 기능을 있다고 말하는 자리** (2026-11-06)

     `/cat/used` 가 "회원끼리 직접 사고파는 자리입니다" · "첫 매물이
     올라오면 여기에 바로 보입니다" 라고 적고 있었습니다 — 그런데 매물을
     올리는 표도 · 문도 · 화면도 저장소에 한 줄도 없습니다. 2026-11-05 에
     조인 · 커뮤니티가 "여는 기능은 아직 없습니다" 라고 적고 있던 자리를
     고쳤는데, **이것은 그 거울상**이고 더 나쁩니다 (안 하는 일을 한다고
     적는 것 · 절대 규칙 5).

     ⚠️⚠️ **글자를 박지 않고 저장소에서 세어** 가릅니다 — 매물을 올리는
     문이 생기는 날 이 검사가 **스스로 뒤집힙니다**(그때는 안내문을 지우
     라고 말합니다). 글자로 박아 두면 기능을 만든 날 멀쩡한 화면을
     실패로 잡습니다.
     ══════════════════════════════════════════════════════════════ */
  console.log("\n── ⚠️⚠️ 중고장터 — 없는 기능을 있다고 말하지 않는가");
  {
    /* 회원이 **직접 매물을 올리는 문**이 있나 — 저장소에서 셉니다.
       (조인은 `open_joinroom`, 커뮤니티는 `ask_cq`, 인력은
        `open_jobpost` 입니다. 중고에 해당하는 것이 있으면 그 이름입니다.) */
    const mig = fs.readdirSync(path.join(ROOT, "db", "migrations"))
      .filter(function(f){ return /^\d{4}_.*\.sql$/.test(f); })
      .map(function(f){ return fs.readFileSync(
        path.join(ROOT, "db", "migrations", f), "utf8"); }).join("\n");
    const hasDoor = ["open_listing", "open_goods", "open_sale", "open_useditem",
                     "post_listing"].some(function(n){
      return mig.indexOf("function " + n + "(") >= 0;
    });
    const { r } = await look("/cat/used", FULL);
    const t = r.body || "";
    if(hasDoor){
      ok("매물을 올리는 문이 생겼으니 그 길을 화면에 낸다",
         t.indexOf("아직 열지 않았습니다") < 0,
         "문이 생겼는데 화면이 아직 '열지 않았습니다' 라고 적습니다");
    }else{
      ok("매물을 올리는 문이 **없으니** 매물을 기다리라고 적지 않는다",
         t.indexOf("첫 매물") < 0 && t.indexOf("올라온 매물") < 0,
         t.slice(0, 200));
      ok("  그 대신 **아직 열지 않았다**고 말한다 (안 하는 일을 한다고 적지 않습니다)",
         t.indexOf("아직 열지 않았습니다") >= 0, t.slice(0, 200));
    }
  }

  if(prove){
    console.log("\n── ⚠️ 일부러 깨뜨려 봅니다");
    ok("없는 주소를 **안 열린다고** 말한다", !resolves("/이런주소는없습니다"));
    ok("  있는 주소는 열린다고 말한다", resolves("/match") && resolves("/"));
    ok("  폴더가 아닌 자리도 푼다 (404.html)", resolves("/404"));
    ok("  바깥 주소 · 닻은 보지 않는다",
       resolves("https://example.test/x") && resolves("#mebox"));
    ok("  빈 href 는 **안 열린다**고 말한다", !resolves(""));
  }

  await b.close(); srv.close();
  console.log("\n" + ran + "건 중 " + (ran - bad) + "건 통과 · " + bad + "건 실패");
  process.exit(bad ? 1 : 0);
})();
