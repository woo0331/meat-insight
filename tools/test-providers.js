#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   업체가 **있을 때**를 눌러 봅니다

   ⚠️⚠️ **이 검사가 있는 까닭.** 지금 업체가 0곳이라, 화면의 "있을 때"
   자리는 **아무도 본 적이 없습니다.** 앞 서비스에서 "0건" 안내만 만들고
   있을 때 그리는 자리를 안 만든 적이 있습니다 — 승인해도 손님에게
   보일 곳이 없었고, 에러도 안 났습니다.

   그래서 **씨앗을 넣고 실제로 찍어 봅니다.** 자료 파일을 잠깐 바꿔
   빌드를 돌리고, 끝나면 **미리 뜬 사본으로 되돌립니다.**
   ⚠️⚠️ 되돌리기는 git 이 아니라 **사본**으로 합니다 —
   `git checkout -- <파일>` 은 그 파일의 작업분 전체를 지웁니다.

   돌리기   node tools/test-providers.js
   ════════════════════════════════════════════════════════════════════ */
const { spawnSync } = require("child_process");
const fs = require("fs"), path = require("path"), os = require("os");
const { chromium } = require("playwright");
const { serve, watch } = require("./_serve.js");

const ROOT = path.join(__dirname, "..");
const GEN  = path.join(ROOT, "js", "data", "providers.generated.js");
const RGEN = path.join(ROOT, "js", "data", "reviews.generated.js");
const TMP  = fs.mkdtempSync(path.join(os.tmpdir(), "pv-"));
const BAK  = path.join(TMP, "providers.keep.js");
const RBAK = path.join(TMP, "reviews.keep.js");

let bad = 0, ran = 0;
function ok(name, cond, got){
  ran++;
  if(cond) console.log("  ✅ " + name);
  else { bad++; console.log("  ❌ " + name + (got !== undefined ? "  →  " + String(got).slice(0, 220) : "")); }
}
function build(){
  return spawnSync(process.execPath, ["build.js"], { cwd: ROOT, stdio:["ignore","pipe","pipe"] });
}
function routes(){
  return JSON.parse(fs.readFileSync(path.join(__dirname, "routes.json"), "utf8")).routes;
}
function seed(rows, at){
  fs.writeFileSync(GEN,
    "/* 검사용 씨앗 — tools/test-providers.js 가 잠깐 바꿔 둔 것입니다. */\n" +
    "window.AM_PROVIDERS_AT = " + JSON.stringify(at || "검사용 씨앗") + ";\n" +
    "window.AM_PROVIDERS = " + JSON.stringify(rows, null, 2) + ";\n");
}

/* ⚠️ 업체가 적은 글에 태그를 넣어 둡니다 — 그대로 나가면 사고입니다 */
/* ⚠️ 하위 키는 js/data/catalog.js 에 있는 **진짜 키**여야 합니다.
   2차 지시서로 하위를 바꿨을 때 여기 ls-pro 가 남아 빌드 가드가
   막았습니다 — 가드가 제 일을 한 것이고, 틀린 것은 **씨앗**입니다. */
const SEED = [
  { id:"green-pt", name:"성남 그린골프연습장",
    intro:"실내 타석 열두 개와 스크린 네 대를 둡니다.",
    regions:["gyeonggi"], subs:["rg-in","rg-sim","ls-solo"],
    since:2019, consult_hours:"평일 09:00~22:00",
    verified:{ brn:true, tel:true }, scale:"mid", brands:["타이틀리스트","캘러웨이"],
    /* ⚠️ 가격은 **업체가 등록한 것**입니다 (0042). 싼 순서로 가져옵니다
       (tools/pull-providers.js 가 amount 로 줄 세웁니다).
       ⚠️⚠️ 하위 키는 그 업체의 subs 에 있는 것이어야 합니다 — DB 의
       트리거가 그것을 봅니다 (여기도 같아야 검사가 거짓이 안 됩니다). */
    prices:[{ sub:"rg-in", label:"타석 1시간", amount:12000, unit:"1시간" },
            { sub:"ls-solo", label:"주 1회 · 8회권", amount:400000, unit:"8회",
              note:"타석 이용료 별도" }] },
  { id:"xss-test", name:"<img src=x onerror=alert(1)>",
    intro:"<script>alert(2)</script> 소개글",
    regions:["seoul"], subs:["ft-mend","ft-grip"], scale:"small" }
];

/* 후기 씨앗 — ⚠️ 자료 파일을 잠깐 바꿉니다. 되돌리기는 **사본**으로
   합니다 (git checkout 은 그 파일의 작업분 전체를 지웁니다). */
function rseed(rows){
  fs.writeFileSync(RGEN,
    "/* 검사용 씨앗 — tools/test-providers.js 가 잠깐 바꿔 둔 것입니다. */\n" +
    "window.AM_REVIEWS_AT = \"검사용 씨앗\";\n" +
    "window.AM_REVIEWS = " + JSON.stringify(rows, null, 2) + ";\n");
}

/* ⚠️⚠️ **별점을 손으로 세어 적습니다.** 5 · 4 · 4 의 평균은 13 나누기
   3 = 4.333… 이고 소수 한 자리로 **4.3** 입니다. 코드와 같은 식으로
   적으면 식을 바꿔도 답이 같아서 아무것도 안 잡습니다.
   ⚠️ 가까운 정수는 4 라 별이 넷 차야 합니다 (★★★★☆).
   ⚠️ 다른 업체의 1점이 섞이면 평균이 3.5 가 됩니다 — 그 1점을 일부러
   넣어 둡니다 (섞이면 이 검사가 떨어집니다). */
const RSEED = [
  { id:"rv-1", provider_id:"green-pt", rating:5, who:"김**",
    body:"타석이 넓고 사장님이 꼼꼼히 봐 주셨습니다.",
    created_at:"2026-10-30T01:00:00Z" },
  { id:"rv-2", provider_id:"green-pt", rating:4, who:"이**",
    body:"<script>alert(3)</script> 글을 넣어 봅니다",
    created_at:"2026-10-29T01:00:00Z",
    reply:"<b>고맙습니다</b> 또 오세요", reply_at:"2026-10-29T05:00:00Z" },
  { id:"rv-3", provider_id:"green-pt", rating:4, who:"박**",
    body:"주차가 조금 좁지만 시설은 좋았습니다.",
    created_at:"2026-10-28T01:00:00Z", edited:true },
  { id:"rv-4", provider_id:"xss-test", rating:1, who:"최**",
    body:"다른 업체의 후기입니다. 섞이면 안 됩니다.",
    created_at:"2026-10-27T01:00:00Z" }
];

function nowServe(){ return serve(0); }

(async function(){
  fs.copyFileSync(GEN, BAK);
  fs.copyFileSync(RGEN, RBAK);
  let b = null, h = null, startedWith = 0;
  try{
    /* ⚠️⚠️ **"0장" 을 박아 두지 않습니다.** 업체가 생기는 날 멀쩡한
       저장소를 실패로 잡습니다. 지금 몇 장인지 **세어 두고**, 씨앗을
       넣은 뒤 **늘어난 값**만 봅니다 (작업 기억의 "전을 재고 늘어난
       값만 보세요"). */
    console.log("\n── ① 지금 상태를 먼저 세어 둡니다");
    build();
    const before = routes();
    const was = before.filter(r => r.indexOf("/pro/") === 0).length;
    startedWith = was;
    console.log("   지금 업체 화면 " + was + "장 · 전체 " + before.length + "장");

    /* ══════════════════════════════════════════════════════════════
       ⚠️⚠️⚠️ **업체가 0곳일 때 막다른 길이 아닌가** (지시서 §7)

       0곳은 지금 **운영의 실제 상태**입니다. 전에는 0곳 상자가
       "업체가 등록되면 보입니다" 로 끝나서, 손님이 할 수 있는 일이
       **기다리는 것뿐**인 것처럼 보였습니다 — 그런데 업체가 0곳이어도
       **회원끼리 되는 것**이 셋 있습니다 (조인 · 커뮤니티 · 구인구직).
       ⚠️ 갯수를 박지 않습니다 — `amOpenNow()` 가 내는 만큼 셉니다.
       ⚠️⚠️ **빌드와 브라우저가 같은 말을 하는지**까지 봅니다. 이 상자를
       둘이 그리므로(`pages/search.js` · `js/search.js`), 글을 두 벌로
       적으면 손님이 거르개를 누르는 순간 안내가 조용히 달라지고
       **그려진 화면만 보는 검사는 영원히 통과**합니다.
       ══════════════════════════════════════════════════════════════ */
    console.log("\n── ①-2 업체가 0곳일 때 (지금 운영의 실제 상태)");
    {
      const h0 = await nowServe();
      const b0 = await chromium.launch();
      const p0 = await b0.newPage({ viewport:{ width:1280, height:900 } });
      /* `amOpenNow()` 가 내는 줄을 **그 화면에서 읽어** 씁니다 */
      await p0.goto("http://127.0.0.1:" + h0.port + "/search",
                    { waitUntil:"networkidle" });
      const want = await p0.evaluate(function(){
        return (window.amOpenNow ? window.amOpenNow() : []).map(function(x){
          return { href:x.href, label:x.label }; });
      });
      ok("⚠️ 잴 것이 0개면 실패입니다 (지금 되는 것을 읽기는 했는가)",
         want.length > 0, JSON.stringify(want));

      const zeroTxt = (await p0.textContent("#sres")) || "";
      ok("업체찾기가 0곳이라고 말한다",
         /아직 등록된 업체가 없습니다/.test(zeroTxt), zeroTxt.slice(0, 120));
      ok("⚠️⚠️ **빌드가 찍은 0곳 상자**에 지금 되는 것이 전부 있다",
         want.every(function(x){ return zeroTxt.indexOf(x.label) >= 0; }),
         zeroTxt.slice(0, 300));
      ok("  그 길이 **링크**로 있다 (글이 아닙니다)",
         (await p0.evaluate(function(L){
           return L.every(function(x){
             return !!document.querySelector('#sres a[href="' + x.href + '"]'); });
         }, want)) === true, JSON.stringify(want));
      /* ⚠️ 매칭 요청과 **갈라서** 적었는지 */
      ok("  업체를 기다리는 길과 **갈라서** 적는다",
         zeroTxt.indexOf("업체를 기다리지 않고") >= 0, zeroTxt.slice(0, 300));

      /* ⚠️⚠️⚠️ **브라우저가 다시 그려도 같은 말인가** */
      await p0.click('a[data-sf="cat"][data-v="fitting"]');
      await p0.waitForTimeout(300);
      const redrawn = (await p0.textContent("#sres")) || "";
      ok("⚠️⚠️⚠️ 거르개를 눌러 **다시 그려도 같은 말**을 한다 (빌드와 " +
         "브라우저가 두 벌로 적히지 않았는가)",
         want.every(function(x){ return redrawn.indexOf(x.label) >= 0; }) &&
         redrawn.indexOf("업체를 기다리지 않고") >= 0,
         redrawn.slice(0, 300));

      /* 메인의 0곳 상자도 같은 줄을 읽는가 */
      await p0.goto("http://127.0.0.1:" + h0.port + "/", { waitUntil:"networkidle" });
      const homeTxt = (await p0.textContent("main")) || "";
      ok("메인의 0곳 상자에도 지금 되는 것이 전부 있다",
         want.every(function(x){ return homeTxt.indexOf(x.label) >= 0; }),
         homeTxt.slice(0, 200));
      /* ⚠️ 이 구간을 읽는 사람은 **업체를 찾는 손님**입니다 — 입점
         권유를 여기 두면 자리가 어긋납니다 (같은 단추가 두 번). */
      const zeroBox = await p0.evaluate(function(){
        const b2 = document.querySelectorAll(".none");
        for(const x of b2)
          if((x.textContent || "").indexOf("아직 입점한 업체가 없습니다") >= 0)
            return x.innerHTML;
        return "";
      });
      ok("⚠️ 메인 0곳 상자 **안에는 입점 단추를 안 둔다** (바로 아래 띠가 " +
         "같은 말을 합니다)", zeroBox.indexOf('href="/join"') < 0,
         zeroBox.slice(0, 200));

      /* ⚠️ 메인 분류 격자가 **PC 에서 다섯 칸**인가 (지시서 §7) */
      const colN = await p0.evaluate(function(){
        const g = document.querySelector(".cat-grid");
        if(!g) return 0;
        return getComputedStyle(g).gridTemplateColumns.split(/\s+/).filter(Boolean).length;
      });
      ok("⚠️ PC 에서 분류 격자가 **다섯 칸**이다 (열 장이면 두 줄)",
         colN === 5, "칸 " + colN + "개");
      /* ⚠️ 칸 수를 박는 것이 아니라 **열 장이 고르게 나뉘는지**를 봅니다 */
      const catsN = await p0.evaluate(function(){
        return document.querySelectorAll(".cat-grid > .cat").length; });
      ok("  분류 수가 칸 수로 **나누어떨어진다** (빈 칸이 안 생깁니다)",
         colN > 0 && catsN > 0 && catsN % colN === 0,
         "분류 " + catsN + "개 · 칸 " + colN + "개");

      await p0.close(); await b0.close(); h0.srv.close();
    }

    console.log("\n── ② 씨앗을 넣고 다시 찍습니다");
    seed(SEED);
    const r1 = build();
    ok("빌드가 돈다", r1.status === 0,
       (r1.stderr || "").toString().trim().split("\n").slice(-3).join(" | "));
    const after = routes();
    const pros = after.filter(r => r.indexOf("/pro/") === 0);
    ok("씨앗 두 곳만 남는다 (전 것은 덮어씁니다)", pros.length === 2, pros.join(" "));
    ok("주소가 /pro/<id> 다", pros.indexOf("/pro/green-pt") >= 0, pros.join(" "));
    ok("화면 수가 **업체 수만큼만** 달라진다",
       after.length === before.length - was + 2,
       before.length + "(업체 " + was + ") → " + after.length);

    h = await nowServe();
    b = await chromium.launch();
    const p = await b.newPage({ viewport:{ width:1280, height:900 } });
    const hits = watch(p);

    /* 분류 화면 — 업체가 뜨는가 */
    await p.goto("http://127.0.0.1:" + h.port + "/cat/range", { waitUntil:"networkidle" });
    let t = (await p.textContent("main")) || "";
    ok("연습장 분류에 업체가 뜬다", (await p.locator(".pv").count()) === 1,
       await p.locator(".pv").count());
    ok("0곳 안내가 사라진다", t.indexOf("아직 등록된 업체가 없습니다") < 0);
    ok("몇 곳인지 말한다", /업체 1곳/.test(t), t.slice(0, 60));
    ok("중개자임을 그 자리에서 다시 말한다", /통신판매중개자/.test(t));

    /* 한 업체가 여러 분류에 걸치면 그 분류마다 떠야 합니다 */
    await p.goto("http://127.0.0.1:" + h.port + "/cat/lesson", { waitUntil:"networkidle" });
    ok("레슨 분류에도 같은 업체가 뜬다 (subs 가 걸쳐 있습니다)",
       (await p.locator(".pv").count()) === 1);
    await p.goto("http://127.0.0.1:" + h.port + "/cat/fitting", { waitUntil:"networkidle" });
    ok("피팅 분류에는 다른 업체가 뜬다", (await p.locator(".pv").count()) === 1);
    await p.goto("http://127.0.0.1:" + h.port + "/cat/travel", { waitUntil:"networkidle" });
    ok("업체가 없는 분류는 그대로 0곳이라고 말한다",
       /아직 등록된 업체가 없습니다/.test((await p.textContent("main")) || ""));

    /* 업체 화면 */
    const res = await p.goto("http://127.0.0.1:" + h.port + "/pro/green-pt",
                             { waitUntil:"networkidle" });
    ok("업체 화면이 열린다 (410 에 안 걸린다)", res.status() === 200, res.status());
    t = (await p.textContent("main")) || "";
    ok("이름 · 소개가 나온다", /성남 그린골프연습장/.test(t) && /실내 타석/.test(t));
    ok("영업 지역이 **키가 아니라 이름**으로 나온다",
       /경기/.test(t) && t.indexOf("gyeonggi") < 0);
    ok("거래 규모가 사람 말로 나온다", /중간 규모/.test(t));
    ok("취급 브랜드가 나온다", /타이틀리스트/.test(t));
    ok("확인 배지가 나온다", /사업자등록 확인/.test(t));
    /* ⚠️⚠️ **후기가 0건일 때.** 처음에 여기 적어 둔 검사는
       `a && b || !c` 꼴이라 괄호가 없어 **거의 늘 참**이었습니다 —
       아무것도 안 잡는 검사였습니다 (작업 기억의 그 줄). 이제
       **0건일 때 무엇이 보이고 무엇이 안 보이는가**를 따로 봅니다. */
    ok("⚠️ 후기가 0건이면 **숫자를 안 찍는다**",
       !/[0-9]\.[0-9]\s*점/.test(t), (t.match(/[0-9]\.[0-9]\s*점/) || [""])[0]);
    ok("⚠️ 0건이면 **0 이라고 말한다** (지어내지 않습니다)",
       /아직 후기가 없습니다/.test(t));
    ok("⚠️ 0건이어도 막다른 길로 두지 않는다 (쓸 수 있는 조건을 적습니다)",
       /고르시거나 만나신 뒤/.test(t));
    ok("⚠️ 0건일 때 별 글자를 안 그린다",
       (await p.locator("main .stars").count()) === 0,
       await p.locator("main .stars").count());
    ok("⚠️ 연락처를 화면에 두지 않는다", !/01[0-9]-?[0-9]{3,4}-?[0-9]{4}/.test(t));
    const html = await p.content();
    ok("⚠️ 구조화 데이터에 aggregateRating 이 없다", html.indexOf("aggregateRating") < 0);
    /* ⚠️⚠️ 상담 길 (0035) — 이제 단추가 있습니다. 재는 것은 **단추가
       있는가**와 **지키지 못할 약속을 하지 않는가** 둘입니다. */
    /* ⚠️ 갯수를 박지 않습니다 — 후기가 0건일 때 그 자리에서도 같은
       단추를 하나 더 냅니다 (막다른 길로 두지 않으려고). 갯수를 1 로
       박아 두었더니 그 단추를 더한 날 **멀쩡한 화면이 실패**했습니다. */
    const pvBtns = p.locator('main a.btn[href^="/match?pv="]');
    ok("이 업체로 요청하는 단추가 있다", (await pvBtns.count()) >= 1,
       await pvBtns.count());
    /* ⚠️⚠️ **하나만 보지 않습니다** — 둘 가운데 하나에 id 가 빠지면
       그 단추는 업체를 안 고르고 /match 로 갑니다 (조용히). */
    const hrefs = await pvBtns.evaluateAll(
      function(ns){ return ns.map(function(n){ return n.getAttribute("href"); }); });
    ok("  그 주소에 업체 id 가 **빠짐없이** 실린다",
       hrefs.length > 0 && hrefs.every(function(x){ return x === "/match?pv=green-pt"; }),
       hrefs.join(" "));
    /* ⚠️⚠️⚠️ **"바로 이 업체로 간다" 고 말하면 거짓말입니다** — 배정은
       운영자가 하고, 넘기는 순간 상호를 알리고 제3자 제공 동의를 다시
       받습니다 (제17조 제2항). 화면이 그것을 적는지 봅니다. */
    ok("⚠️ 바로 간다는 약속을 **하지 않는다**",
       /약속은 아닙니다/.test(t), t.slice(0, 400));
    ok("⚠️ 넘기기 전에 다시 여쭙는다고 적는다",
       /연락처 전달 동의를 다시/.test(t), t.slice(0, 400));
    ok("대신 갈 곳도 같이 준다", (await p.locator("main .none a.btn").count()) >= 2);

    /* 업체가 적은 글이 esc 를 거치는가 */
    /* ── 업체 화면의 가격표 (0042) ────────────────────────────────
       ⚠️⚠️ 카드에는 **가장 싼 것 하나**만, 업체 화면에는 **올린 것
       전부**를 냅니다. 둘이 어긋나면 손님이 카드를 누른 뒤에 다른
       숫자를 봅니다. */
    ok("업체 화면에 올린 가격이 **전부** 나온다",
       (await p.locator(".doc-t table").nth(1).locator("tbody tr").count()) === 2,
       await p.locator(".doc-t table").nth(1).locator("tbody tr").count());
    t = (await p.textContent("main")) || "";
    ok("  금액과 단위가 같이 나온다",
       t.indexOf("400,000원") >= 0 && t.indexOf("8회") >= 0, t.slice(0, 300));
    ok("  덧말도 나온다 (타석 이용료 별도)", t.indexOf("타석 이용료 별도") >= 0);
    /* ⚠️ 가격을 냈다고 **우리가 보증하는 것처럼** 적지 않습니다 */
    ok("  ⚠️ 거래 당사자가 아니라고 그 자리에서 말한다",
       /거래 당사자가 아/.test(t));
    ok("  ⚠️ 조건에 따라 달라질 수 있다고 말한다", /달라질 수 있/.test(t));

    await p.goto("http://127.0.0.1:" + h.port + "/pro/xss-test", { waitUntil:"networkidle" });
    const h2 = await p.innerHTML("main");
    ok("⚠️ 업체가 적은 태그가 날것으로 안 들어간다",
       h2.indexOf("<img src=x") < 0 && h2.indexOf("<script>alert(2)") < 0 &&
       h2.indexOf("&lt;img") >= 0);
    ok("⚠️ 그 글 때문에 그림 · 스크립트가 생기지 않는다",
       (await p.locator("main img").count()) === 0);

    /* 메인 */
    await p.goto("http://127.0.0.1:" + h.port + "/", { waitUntil:"networkidle" });
    t = (await p.textContent("main")) || "";
    ok("메인에 입점업체 구간이 생긴다", (await p.locator(".pv").count()) === 2);
    ok("메인이 '아직 입점한 업체가 없습니다' 를 더 안 말한다",
       t.indexOf("아직 입점한 업체가 없습니다") < 0);

    /* ══ 업체찾기 (/search) — 개선 지시서 ═══════════════════════════
       ⚠️⚠️ **눌러 봐야 압니다.** 보내는 열쇠(q · cat · rg)와 받는 쪽이
       어긋나면 **거르개가 아무것도 안 걸렀는데 화면은 열립니다** — 앞
       서비스에서 ?m=apple 을 보내고 mk 를 읽어 링크 검사 · 흐름 검사가
       전부 통과했습니다.
       ⚠️⚠️⚠️ **빌드가 찍은 HTML 과 거르개가 다시 그린 HTML 이 같아야
       합니다.** 다르면 손님이 거르개를 누르는 순간 카드가 조용히
       달라지고, 크롤러가 읽는 글과도 어긋납니다 (앞 서비스에서 열세 번). */
    console.log("\n── /search 업체찾기 — 찍힌 것부터");
    await p.goto("http://127.0.0.1:" + h.port + "/search", { waitUntil:"networkidle" });
    await p.waitForTimeout(250);
    t = (await p.textContent("main")) || "";
    ok("거르개 없이 들어가면 업체가 **전부** 보인다",
       (await p.locator("#sres .pv").count()) === 2,
       await p.locator("#sres .pv").count());
    ok("몇 곳인지 말한다", /업체 2곳/.test(t), t.slice(0, 120));
    ok("중개자임을 그 자리에서 말한다", /통신판매중개자/.test(t));
    /* ⚠️⚠️ **자바스크립트 전의 HTML 에 업체가 있어야** 네이버 · 빙 ·
       LLM 봇이 읽습니다. 그려진 화면만 보는 검사는 영원히 통과합니다 —
       그래서 **찍힌 파일**을 직접 읽습니다. */
    const shtml = fs.readFileSync(path.join(ROOT, "search", "index.html"), "utf8");
    ok("⚠️ 자바스크립트 전의 HTML 에도 업체가 들어 있다 (크롤러가 읽습니다)",
       shtml.indexOf("성남 그린골프연습장") >= 0);
    ok("  그 HTML 에 상담 요청 단추도 들어 있다",
       shtml.indexOf('href="/match?pv=green-pt"') >= 0);
    /* ⚠️ 승인 · 공개된 업체만 — 자료가 **보기**에서 나오는지 봅니다.
       화면이 또 좁히면 두 곳에서 좁히는 것이 되어 어긋납니다. */
    const pull = fs.readFileSync(path.join(ROOT, "tools", "pull-providers.js"), "utf8");
    ok("⚠️ 자료를 `provider` 표가 아니라 **공개 보기**에서 가져온다 " +
       "(승인 · 공개 · 검사용 거르기가 그 보기에 있습니다)",
       pull.indexOf('VIEW = "v_provider_card"') >= 0);

    console.log("\n── /search 카드에 들어 있는 것 (지시서 7번)");
    const c1 = await p.locator('#sres .pv[data-pv="green-pt"]');
    ok("상호가 있다", ((await c1.textContent()) || "").indexOf("성남 그린골프연습장") >= 0);
    ok("지역이 있다", ((await c1.textContent()) || "").indexOf("경기") >= 0);
    ok("하는 일(분류)이 있다",
       (await c1.locator(".pv-c li").count()) >= 1, await c1.locator(".pv-c li").count());
    ok("⚠️ 사진 자리는 **아이콘 타일**이다 (남의 사진을 깔지 않습니다)",
       (await c1.locator(".pv-th").count()) === 1 &&
       (await c1.locator("img").count()) === 0);
    ok("상담 요청 단추가 그 업체로 간다",
       ((await c1.locator('a[href^="/match?pv="]').first().getAttribute("href")) || "")
         === "/match?pv=green-pt");
    ok("자세히 보기가 업체 화면으로 간다",
       (await c1.locator('a[href="/pro/green-pt"]').count()) >= 1);
    /* ── 등록된 가격 (0042 · 지시서 7번의 "실제 등록 가격") ──────────
       ⚠️⚠️ **지어낸 값이 아닙니다.** 업체가 /desk 에서 올린 줄을
       그대로 냅니다 (`tools/sql/price.js` 가 DB 쪽을 누릅니다).
       ⚠️ 카드에는 **가장 싼 것**을 냅니다 — 센 값입니다 (저장하지
       않습니다 · 절대 규칙 1). */
    const t1 = (await c1.textContent()) || "";
    ok("등록된 가격이 카드에 나온다", (await c1.locator(".pv-p").count()) === 1);
    ok("  **가장 싼 것**이 나온다 (12,000원)", t1.indexOf("12,000원") >= 0, t1);
    /* ⚠️⚠️ 단위가 빠지면 한 번 값인지 한 달 값인지 모릅니다 */
    ok("  ⚠️ 단위가 **같이** 나온다", t1.indexOf("1시간") >= 0, t1);
    ok("  그 밖에 몇 가지가 더 있는지 말한다", /그 밖 1가지/.test(t1), t1);
    /* ⚠️⚠️ 가격을 **안 올린** 업체는 그 줄이 아예 없어야 합니다 —
       "상담 후 견적" 같은 말을 우리가 지어 넣지 않습니다 (절대 규칙 5). */
    const c2 = await p.locator('#sres .pv[data-pv="xss-test"]');
    ok("⚠️ 가격을 안 올린 업체는 가격 줄이 **아예 없다**",
       (await c2.locator(".pv-p").count()) === 0);
    const tx = (await c2.textContent()) || "";
    ok("  그 자리에 **지어낸 말**이 없다",
       tx.indexOf("상담 후") < 0 && tx.indexOf("문의") < 0 && tx.indexOf("0원") < 0, tx);

    console.log("\n── /search 거르개 — ⚠️ 새로고침하지 않습니다");
    /* ⚠️ 새로고침하면 이 표시가 날아갑니다 — 그것으로 잽니다 */
    await p.evaluate(function(){ window.__kept = "여기 있습니다"; });
    await p.click('a[data-sf="cat"][data-v="fitting"]');
    await p.waitForTimeout(250);
    ok("⚠️ 분류를 누르면 **새로고침되지 않는다**",
       (await p.evaluate(function(){ return window.__kept; })) === "여기 있습니다");
    ok("  주소에 조건이 담긴다 (복사해 보낼 수 있고 뒤로 가기도 됩니다)",
       (await p.evaluate(function(){ return location.search; })) === "?cat=fitting",
       await p.evaluate(function(){ return location.search; }));
    ok("  그 분류의 업체만 남는다", (await p.locator("#sres .pv").count()) === 1,
       await p.locator("#sres .pv").count());
    ok("  남은 것이 맞는 업체다",
       (await p.locator("#sres .pv").first().getAttribute("data-pv")) === "xss-test");
    ok("  지금 조건을 **글로** 말한다",
       /피팅/.test((await p.textContent("#sfnow")) || ""), await p.textContent("#sfnow"));
    ok("  눌린 칸이 화면 읽는 기계에도 눌린 것으로 보인다",
       (await p.getAttribute('a[data-sf="cat"][data-v="fitting"]', "aria-pressed")) === "true");

    /* ⚠️⚠️ 조건을 **겹쳐도** 지켜지나 — 분류를 고른 뒤 지역을 누르면
       분류가 조용히 풀리면 안 됩니다 (링크 주소를 다시 지어야 합니다). */
    await p.click('a[data-sf="rg"][data-v="seoul"]');
    await p.waitForTimeout(250);
    ok("분류 + 지역이 **같이** 걸린다",
       (await p.evaluate(function(){ return location.search; })).indexOf("cat=fitting") >= 0 &&
       (await p.evaluate(function(){ return location.search; })).indexOf("rg=seoul") >= 0,
       await p.evaluate(function(){ return location.search; }));
    ok("  둘 다 맞는 업체가 남는다", (await p.locator("#sres .pv").count()) === 1);
    /* 맞는 것이 없는 조합 — ⚠️ "업체 0곳" 과 다른 말을 해야 합니다 */
    await p.click('a[data-sf="rg"][data-v="busan"]');
    await p.waitForTimeout(250);
    t = (await p.textContent("#sres")) || "";
    ok("조건에 맞는 업체가 없으면 **그렇게** 말한다",
       /조건에 맞는 업체가 없습니다/.test(t), t.slice(0, 160));
    ok("  ⚠️ '등록된 업체가 없습니다' 라고 **말하지 않는다** (다른 상황입니다)",
       t.indexOf("아직 등록된 업체가 없습니다") < 0, t.slice(0, 200));
    ok("  막다른 길로 두지 않는다 (매칭 요청 단추를 낸다)",
       (await p.locator('#sres a[href="/match"]').count()) === 1);
    ok("  조건을 지우는 길도 낸다",
       (await p.locator('#sres a[href="/search"]').count()) === 1);
    ok("  지킬 수 없는 약속을 하지 않는다",
       !/시간 안에|며칠|곧 등록/.test(t), t.slice(0, 200));

    /* 뒤로 가기 */
    await p.goBack();
    await p.waitForTimeout(250);
    ok("⚠️ 뒤로 가기가 **전 조건으로** 돌아간다",
       (await p.locator("#sres .pv").count()) === 1 &&
       (await p.evaluate(function(){ return location.search; })).indexOf("rg=seoul") >= 0,
       await p.evaluate(function(){ return location.search; }));

    /* ══════════════════════════════════════════════════════════════
       하위분류로 좁혀 가는 길 (지시서 §4 · `?sub=`)

       ⚠️⚠️⚠️ **전에는 하위 예순둘이 분류 화면에 글로만 있었습니다.**
       "화면이 있다" 와 "거기까지 가는 길이 있다" 는 다릅니다 —
       `/login` · `/my` 가 아무 데서도 안 이어져 있던 자리와 같습니다.
       ⚠️ 열쇠 이름이 보내는 쪽과 **글자까지** 같은지는 **눌러 봐야**
       압니다 (`?m=apple` 을 보내고 `mk` 를 읽어 거르개가 아무것도
       안 걸렀는데 링크 검사도 흐름 검사도 통과한 적이 있습니다).
       ══════════════════════════════════════════════════════════════ */
    console.log("\n── /search 하위분류로 좁히기 (?sub=)");
    /* green-pt 는 rg-in · rg-sim · ls-solo 를 합니다 · xss-test 는 ft-* */
    await p.goto("http://127.0.0.1:" + h.port + "/search?cat=range&sub=rg-sim",
                 { waitUntil:"networkidle" });
    await p.waitForTimeout(250);
    ok("⚠️⚠️ 하위분류로 좁혀진다 (열쇠 이름이 실제로 맞습니다)",
       (await p.locator("#sres .pv").count()) === 1,
       await p.locator("#sres .pv").count());
    ok("  남은 것이 그 일을 하는 업체다",
       (await p.locator("#sres .pv").first().getAttribute("data-pv")) === "green-pt");
    ok("  지금 조건에 **하위 이름**이 글로 나온다 (칸이 없는 조건입니다)",
       /스크린/.test((await p.textContent("#sfnow")) || ""),
       await p.textContent("#sfnow"));

    /* ⚠️ 그 업체가 **안 하는** 하위로 좁히면 0건이어야 합니다 */
    await p.goto("http://127.0.0.1:" + h.port + "/search?cat=fitting&sub=ft-grip",
                 { waitUntil:"networkidle" });
    await p.waitForTimeout(250);
    ok("다른 하위로 좁히면 **다른 업체**가 남는다",
       (await p.locator("#sres .pv").count()) === 1 &&
       (await p.locator("#sres .pv").first().getAttribute("data-pv")) === "xss-test",
       await p.locator("#sres .pv").count());

    await p.goto("http://127.0.0.1:" + h.port + "/search?cat=range&sub=rg-out",
                 { waitUntil:"networkidle" });
    await p.waitForTimeout(250);
    t = (await p.textContent("#sres")) || "";
    ok("⚠️ 아무도 안 하는 하위면 **조건에 맞는 업체가 없다**고 말한다",
       /조건에 맞는 업체가 없습니다/.test(t), t.slice(0, 160));
    ok("  ⚠️ '등록된 업체가 없습니다' 라고 **말하지 않는다** (다른 상황입니다)",
       t.indexOf("아직 등록된 업체가 없습니다") < 0, t.slice(0, 200));
    ok("  막다른 길로 두지 않는다 (매칭 요청 · 조건 지우기)",
       (await p.locator('#sres a[href="/match"]').count()) === 1 &&
       (await p.locator('#sres a[href="/search"]').count()) === 1);

    /* ⚠️⚠️⚠️ **분류를 바꾸면 하위를 같이 풀어야** 합니다. 안 풀면
       "연습장의 하위" 를 들고 "피팅" 으로 옮겨 가서 **영원히 0건**이
       되고, 손님은 그 분류에 업체가 없는 줄 압니다. */
    await p.goto("http://127.0.0.1:" + h.port + "/search?cat=range&sub=rg-sim",
                 { waitUntil:"networkidle" });
    await p.waitForTimeout(250);
    await p.click('a[data-sf="cat"][data-v="fitting"]');
    await p.waitForTimeout(250);
    const moved = await p.evaluate(function(){ return location.search; });
    ok("⚠️⚠️ 분류를 바꾸면 **하위가 같이 풀린다**",
       moved.indexOf("cat=fitting") >= 0 && moved.indexOf("sub=") < 0, moved);
    ok("  그래서 0건이 되지 않는다", (await p.locator("#sres .pv").count()) === 1,
       await p.locator("#sres .pv").count());
    /* ⚠️ 지역을 눌러도 하위는 지켜져야 합니다 (같은 분류 안입니다) */
    await p.goto("http://127.0.0.1:" + h.port + "/search?cat=range&sub=rg-sim",
                 { waitUntil:"networkidle" });
    await p.waitForTimeout(250);
    await p.click('a[data-sf="rg"][data-v="gyeonggi"]');
    await p.waitForTimeout(250);
    const kept = await p.evaluate(function(){ return location.search; });
    ok("⚠️ 지역을 눌러도 하위는 **지켜진다** (같은 분류 안입니다)",
       kept.indexOf("sub=rg-sim") >= 0 && kept.indexOf("rg=gyeonggi") >= 0, kept);

    /* ⚠️ 모르는 하위 키로 와도 **이름을 지어내지 않습니다** */
    await p.goto("http://127.0.0.1:" + h.port + "/search?sub=이런하위는없습니다",
                 { waitUntil:"networkidle" });
    await p.waitForTimeout(250);
    ok("모르는 하위 키면 0건이고 키를 그대로 적는다 (이름을 지어내지 않습니다)",
       (await p.locator("#sres .pv").count()) === 0 &&
       /이런하위는없습니다/.test((await p.textContent("#sres")) || ""),
       (await p.textContent("#sres")) || "");

    /* ══ 분류 화면의 하위 목록이 **그 주소를 가리키는가** ══════════
       ⚠️ 갯수를 박지 않습니다 — 하위가 늘면 늘어난 대로 돕니다.
       ⚠️⚠️ 업체가 입점하지 않는 하위는 **글로 두어야** 합니다 (링크로
       내면 영원히 0건인 자리로 보내는 것이고, 그건 눌러도 아무 일이
       안 나는 칸과 같습니다). */
    console.log("\n── 분류 화면의 하위 목록이 그 거르개를 가리키나");
    await p.goto("http://127.0.0.1:" + h.port + "/cat/range", { waitUntil:"networkidle" });
    await p.waitForTimeout(200);
    const subLinks = await p.evaluate(function(){
      var out = { link:[], text:0 };
      Array.prototype.forEach.call(document.querySelectorAll(".chips-sub li"), function(li){
        var a = li.querySelector("a");
        if(a) out.link.push(a.getAttribute("href")); else out.text++;
      });
      return out;
    });
    ok("⚠️ 잴 것이 0개면 실패입니다 (하위 목록을 찾기는 했는가)",
       subLinks.link.length > 0, JSON.stringify(subLinks));
    ok("⚠️⚠️ 하위가 **그 거르개 주소**를 가리킨다 (amSubUrl 한 함수)",
       subLinks.link.every(function(h2){
         return /^\/search\?cat=range&sub=rg-/.test(h2); }),
       subLinks.link.join(" "));
    /* 실제로 눌러 봅니다 — 주소만 맞고 안 걸리면 아무 뜻이 없습니다 */
    await p.click('.chips-sub a[href="/search?cat=range&sub=rg-sim"]');
    await p.waitForTimeout(400);
    ok("⚠️⚠️⚠️ 눌러 보니 **실제로 좁혀진다** (주소만 맞는 것이 아닙니다)",
       (await p.locator("#sres .pv").count()) === 1 &&
       (await p.evaluate(function(){ return location.search; }))
         .indexOf("sub=rg-sim") >= 0,
       await p.evaluate(function(){ return location.search; }));

    /* 중고장터 — 물건 종류 하위는 업체가 하는 일이 아니라 **글**입니다 */
    await p.goto("http://127.0.0.1:" + h.port + "/cat/used", { waitUntil:"networkidle" });
    await p.waitForTimeout(200);
    const usedSub = await p.evaluate(function(){
      var link = 0, text = 0;
      Array.prototype.forEach.call(document.querySelectorAll(".chips-sub li"), function(li){
        if(li.querySelector("a")) link++; else text++;
      });
      return { link: link, text: text };
    });
    ok("⚠️ 업체가 입점하지 않는 하위는 **글로** 둔다 (0건 자리로 안 보냅니다)",
       usedSub.text > 0 && usedSub.link > 0, JSON.stringify(usedSub));

    console.log("\n── /search 검색어 (머리말 검색창)");
    await p.goto("http://127.0.0.1:" + h.port + "/search?q=" + encodeURIComponent("연습장"),
                 { waitUntil:"networkidle" });
    await p.waitForTimeout(250);
    ok("검색어로 좁혀진다", (await p.locator("#sres .pv").count()) === 1,
       await p.locator("#sres .pv").count());
    ok("  맞는 업체가 남는다",
       (await p.locator("#sres .pv").first().getAttribute("data-pv")) === "green-pt");
    ok("  검색창에 친 글이 **남아 있다** (다시 치게 하지 않습니다)",
       (await p.inputValue("#q")) === "연습장");
    await p.goto("http://127.0.0.1:" + h.port + "/search?q=" + encodeURIComponent("경기"),
                 { waitUntil:"networkidle" });
    await p.waitForTimeout(250);
    ok("지역 이름으로도 찾아진다", (await p.locator("#sres .pv").count()) === 1);
    /* ⚠️ 검색창에서 보낼 때도 새로고침하지 않습니다 */
    await p.evaluate(function(){ window.__kept2 = "있습니다"; });
    await p.fill("#q", "피팅");
    await p.press("#q", "Enter");
    await p.waitForTimeout(300);
    ok("⚠️ 검색창에서 보내도 **새로고침되지 않는다**",
       (await p.evaluate(function(){ return window.__kept2; })) === "있습니다");
    ok("  주소에 검색어가 담긴다",
       (await p.evaluate(function(){ return location.search; })).indexOf("q=") >= 0,
       await p.evaluate(function(){ return location.search; }));

    console.log("\n── /search 업체 비교 (지시서 9번)");
    await p.goto("http://127.0.0.1:" + h.port + "/search", { waitUntil:"networkidle" });
    await p.waitForTimeout(250);
    /* ⚠️⚠️ **고르기 전에는 비교표가 없습니다** — 빈 표를 미리 그려 두면
       가짜 비교 자료가 들어오는 문이 됩니다 (절대 규칙 1). */
    ok("⚠️ 고르기 전에는 비교표가 **안 보인다**",
       (await p.locator("#scmp .cmp-t").count()) === 0);
    await p.locator("#sres .cmp-x").nth(0).check();
    await p.waitForTimeout(150);
    ok("하나만 고르면 아직 비교가 아니다 (표를 안 그린다)",
       (await p.locator("#scmp .cmp-t").count()) === 0);
    await p.locator("#sres .cmp-x").nth(1).check();
    await p.waitForTimeout(200);
    ok("둘을 고르면 비교표가 나온다", (await p.locator("#scmp .cmp-t").count()) === 1);
    t = (await p.textContent("#scmp")) || "";
    ok("  고른 업체가 둘 다 들어간다",
       t.indexOf("성남 그린골프연습장") >= 0 &&
       (await p.locator("#scmp thead th").count()) === 3, t.slice(0, 120));
    ok("  견주는 줄이 있다 (지역 · 하는 일 · 가격 · 후기 …)",
       (await p.locator("#scmp tbody tr").count()) >= 5,
       await p.locator("#scmp tbody tr").count());
    ok("  등록된 가격이 비교표에 들어간다", t.indexOf("12,000원") >= 0, t.slice(0, 400));
    ok("  ⚠️ 가격을 안 올린 업체의 칸은 **지어내지 않는다**",
       t.indexOf("상담 후") < 0 && t.indexOf("문의") < 0, t.slice(0, 300));
    ok("  비교표에서도 상담 요청을 할 수 있다",
       (await p.locator('#scmp a[href^="/match?pv="]').count()) === 2);
    /* ⚠️ 업체가 적은 글이 비교표 머리에도 들어갑니다 — esc() 를 지나야 합니다 */
    ok("  ⚠️ 업체가 쓴 글이 날것으로 안 나간다",
       (await p.locator("#scmp img").count()) === 0 &&
       (await p.locator("#scmp script").count()) === 0);
    await p.click('#scmp button[data-cmp="off"]');
    await p.waitForTimeout(200);
    ok("비교를 지우면 표가 사라진다", (await p.locator("#scmp .cmp-t").count()) === 0);
    ok("  체크도 같이 풀린다",
       (await p.locator("#sres .cmp-x:checked").count()) === 0);

    /* ⚠️⚠️ **세 폭에서 잽니다** (4차 지시서 §7) — 360 · 390 · 430.
       한 폭만 재면 그 사이에서 깨지는 것을 못 봅니다. */
    for(const W of [360, 390, 430]){
      console.log("\n── ⚠️ /search 폰 폭 " + W + "px (전수 점검이 못 보는 자리)");
      const ph = await b.newPage({ viewport:{ width:W, height:900 } });
      await ph.goto("http://127.0.0.1:" + h.port + "/search", { waitUntil:"networkidle" });
      await ph.waitForTimeout(300);
      /* ⚠️⚠️ **미끄러지는 상자가 화면을 밀지 않는지** — 격자 칸의 기본
         min-width:auto 때문에 폰에서 390px 이 688px 이 된 적이 있습니다. */
      let m = await ph.evaluate(function(){
        return { doc: document.documentElement.scrollWidth, win: window.innerWidth };
      });
      ok("거르개가 있어도 화면이 **가로로 안 밀린다**", m.doc <= m.win + 1,
         "문서 " + m.doc + "px · 화면 " + m.win + "px");
      ok("  거르개는 제 상자 안에서 가로로 미끄러진다 (쌓이지 않습니다)",
         (await ph.evaluate(function(){
           const c = document.querySelector(".sf-c");
           return !!c && c.scrollWidth > c.clientWidth;
         })), "거르개 상자가 미끄러지지 않습니다");
      /* 폰에서도 거르개가 돌아야 합니다 */
      await ph.click('a[data-sf="cat"][data-v="fitting"]');
      await ph.waitForTimeout(250);
      ok("  폰에서도 거르개가 돈다", (await ph.locator("#sres .pv").count()) === 1);
      await ph.goto("http://127.0.0.1:" + h.port + "/search", { waitUntil:"networkidle" });
      await ph.locator("#sres .cmp-x").nth(0).check();
      await ph.locator("#sres .cmp-x").nth(1).check();
      await ph.waitForTimeout(250);
      m = await ph.evaluate(function(){
        return { doc: document.documentElement.scrollWidth, win: window.innerWidth };
      });
      ok("비교표를 펴도 화면이 **가로로 안 밀린다**", m.doc <= m.win + 1,
         "문서 " + m.doc + "px · 화면 " + m.win + "px");
      const small = await ph.evaluate(function(){
        const out = [];
        Array.prototype.forEach.call(document.querySelectorAll("main *"), function(e){
          if(!e.firstChild || e.firstChild.nodeType !== 3) return;
          if(!(e.textContent || "").trim()) return;
          const fs2 = parseFloat(getComputedStyle(e).fontSize);
          if(fs2 < 12) out.push(e.className + " " + fs2 + "px");
        });
        return out.slice(0, 5);
      });
      ok("12px 미만 글자가 없다", small.length === 0, small.join(" · "));
      const tap = await ph.evaluate(function(){
        return Array.prototype.filter.call(
          document.querySelectorAll("main a, main button, main label"),
          function(e){ return e.getBoundingClientRect().height < 39.5; }).length;
      });
      ok("누르는 것이 40px 이상이다", tap === 0, tap + "개");
      await ph.close();
    }

    ok("화면 에러 · CSP 거절이 0건이다", hits.length === 0, hits.join(" | "));

    /* 사람이 볼 그림 — 도구가 "보기 흉한가" 는 영원히 못 잽니다 */
    if(process.argv.indexOf("--shot") >= 0){
      const dir = process.argv[process.argv.indexOf("--shot") + 1] || ".";
      /* ⚠️⚠️ **"보기 흉한가" 는 도구가 영원히 못 잽니다** — 디자인을
         바꿨으면 찍어 보세요. 업체찾기는 **폰도** 찍습니다 (거르개가
         가로로 미끄러지는 자리라 눈으로 봐야 압니다). */
      for(const [u, f, w] of [["/cat/range", "pv-cat", 1280],
                              ["/pro/green-pt", "pv-one", 1280],
                              ["/search", "pv-search", 1280],
                              ["/search", "pv-search-phone", 390]]){
        const sp = await b.newPage({ viewport:{ width:w, height:900 }, deviceScaleFactor:2 });
        await sp.goto("http://127.0.0.1:" + h.port + u, { waitUntil:"networkidle" });
        await sp.waitForTimeout(400);
        /* 비교표도 펴서 찍습니다 — 안 펴면 그 자리는 아무도 안 봅니다 */
        if(f.indexOf("pv-search") === 0){
          await sp.locator("#sres .cmp-x").nth(0).check().catch(function(){});
          await sp.locator("#sres .cmp-x").nth(1).check().catch(function(){});
          await sp.waitForTimeout(300);
        }
        await sp.screenshot({ path: path.join(dir, f + ".png"), fullPage:true });
        await sp.close();
      }
      console.log("   그림을 " + dir + " 에 찍었습니다");
    }
    await p.close();

    /* 사이트맵 · 링크 */
    const sm = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
    ok("사이트맵에 업체 화면이 들어간다", sm.indexOf("/pro/green-pt") >= 0);
    const lk = spawnSync(process.execPath, ["tools/check-links.js"],
      { cwd: ROOT, stdio:["ignore","pipe","pipe"] });
    ok("끊긴 링크 · 410 으로 가는 링크가 0건이다", lk.status === 0,
       (lk.stdout || "").toString().trim().split("\n").slice(-4).join(" | "));

    console.log("\n── ②-b 후기가 **있을 때** (0037)");
    /* ⚠️⚠️ 후기 자리도 지금까지 **아무도 본 적이 없습니다** — 0건이라
       그리는 쪽만 돌았습니다. 씨앗을 넣고 실제로 찍어 봅니다. */
    rseed(RSEED);
    const r4 = build();
    ok("후기를 넣어도 빌드가 돈다", r4.status === 0,
       (r4.stderr || "").toString().trim().split("\n").slice(-3).join(" | "));

    const p2 = await b.newPage({ viewport:{ width:1280, height:900 } });
    const hits2 = watch(p2);
    await p2.goto("http://127.0.0.1:" + h.port + "/pro/green-pt", { waitUntil:"networkidle" });
    let t2 = (await p2.textContent("main")) || "";
    ok("후기 건수가 나온다 (3건)", /후기 3건/.test(t2), t2.slice(0, 300));
    /* ⚠️⚠️ **손으로 센 값**입니다 — 5 · 4 · 4 → 13/3 = 4.3 */
    ok("⚠️ 평균이 **센 값**으로 나온다 (5·4·4 → 4.3)",
       t2.indexOf("4.3") >= 0, (t2.match(/[0-9]\.[0-9]/g) || []).join(" "));
    ok("⚠️ 다른 업체의 1점이 **안 섞인다** (섞이면 3.5 입니다)",
       t2.indexOf("3.5") < 0);
    ok("별 글자가 그려진다", (await p2.locator("main .stars").count()) >= 4,
       await p2.locator("main .stars").count());
    /* ⚠️ 별 글자는 소리로 읽을 것이 없습니다 — 같은 뜻을 글로 한 번 */
    ok("⚠️ 소리로 듣는 분께 점수를 **글로** 적는다",
       /5점 만점에 4점/.test(t2), t2.slice(0, 300));
    ok("작성자가 마스킹된 채로 나온다", /김\*\*/.test(t2));
    ok("⚠️ 본이름이 나올 자리가 없다 (성함 칸을 안 받습니다)",
       t2.indexOf("김후기") < 0 && t2.indexOf("by_user") < 0);
    ok("고친 후기에 **고쳤다고** 적는다", /고침/.test(t2));
    ok("업체 답변이 나온다", /또 오세요/.test(t2));
    ok("  답변이 누구 말인지 적는다", /성남 그린골프연습장 답변/.test(t2));
    /* ⚠️⚠️ 손님 · 업체가 적은 글은 전부 esc() 입니다 (절대 규칙 4) */
    const rh = await p2.innerHTML("main");
    ok("⚠️ 후기에 넣은 태그가 날것으로 안 들어간다",
       rh.indexOf("<script>alert(3)") < 0 && rh.indexOf("&lt;script") >= 0);
    ok("⚠️ 업체 답변에 넣은 태그도 날것으로 안 들어간다",
       rh.indexOf("<b>고맙습니다</b>") < 0 && rh.indexOf("&lt;b&gt;") >= 0);
    ok("⚠️ 그 글 때문에 그림 · 스크립트가 생기지 않는다",
       (await p2.locator("main img").count()) === 0);
    /* ⚠️⚠️⚠️ **후기가 생겨도 aggregateRating 을 안 넣습니다** — 우리가
       별점을 검증할 길이 없고, 적발되면 리치 결과가 통째로 막힙니다. */
    ok("⚠️⚠️ 후기가 생겨도 구조화 데이터에 aggregateRating 이 **없다**",
       (await p2.content()).indexOf("aggregateRating") < 0);
    ok("0건 안내가 사라진다", t2.indexOf("아직 후기가 없습니다") < 0);

    /* ⚠️⚠️ **크롤러가 보는 것과 같은가.** 자바스크립트 전의 HTML 에
       후기가 들어 있어야 네이버 · 빙 · LLM 봇이 봅니다 (그려진 화면만
       보는 검사는 영원히 통과합니다). */
    const raw = fs.readFileSync(path.join(ROOT, "pro", "green-pt", "index.html"), "utf8");
    ok("⚠️⚠️ 자바스크립트 전의 HTML 에 후기가 **이미** 들어 있다",
       raw.indexOf("후기 3건") >= 0 && raw.indexOf("4.3") >= 0);
    ok("  거기에도 본이름이 없다", raw.indexOf("김후기") < 0);

    /* 카드 — 분류 화면에서도 센 값이 나오는가 */
    await p2.goto("http://127.0.0.1:" + h.port + "/cat/range", { waitUntil:"networkidle" });
    const ct = (await p2.textContent("main")) || "";
    ok("분류 카드에도 평균 · 건수가 나온다",
       /후기 3건/.test(ct) && ct.indexOf("4.3") >= 0, ct.slice(0, 300));
    /* ⚠️⚠️ 후기 0건인 업체 카드에 "후기 0건" 을 찍으면 새로 입점한
       업체가 전부 나쁜 업체로 보입니다 — 우리가 만든 평가입니다. */
    await p2.goto("http://127.0.0.1:" + h.port + "/cat/lesson", { waitUntil:"networkidle" });
    ok("⚠️ 후기가 0건인 카드에는 그 줄이 **아예 없다**",
       (await p2.locator(".pv .pv-r").count()) === 1,
       await p2.locator(".pv .pv-r").count());
    ok("후기 화면에서도 에러 · CSP 거절이 0건이다", hits2.length === 0, hits2.join(" | "));
    await p2.close();

    console.log("\n── ②-c 되돌려 보기: 어긋난 후기를 넣으면 빌드가 멈추는가");
    /* ⚠️⚠️ 두 자료 파일은 DB 에서 **따로** 나옵니다 — 한쪽만 다시
       가져오면 그 후기는 아무 화면에도 안 뜨면서 아무 에러도 안 납니다. */
    rseed([{ id:"rv-x", provider_id:"이런업체는없습니다", rating:5,
             who:"김**", body:"없는 업체에 붙은 후기입니다.",
             created_at:"2026-10-30T01:00:00Z" }]);
    const r5 = build();
    ok("없는 업체를 가리키는 후기를 넣으면 **빌드가 멈춘다**", r5.status !== 0,
       "exit=" + r5.status);
    ok("  무엇을 돌려야 하는지 말해 준다",
       /pull-reviews/.test((r5.stderr || "").toString() + (r5.stdout || "").toString()));
    rseed([{ id:"rv-y", provider_id:"green-pt", rating:9, who:"김**",
             body:"별점이 범위를 벗어난 후기입니다.",
             created_at:"2026-10-30T01:00:00Z" }]);
    const r6 = build();
    ok("별점이 1~5 밖이면 **빌드가 멈춘다**", r6.status !== 0, "exit=" + r6.status);
    rseed([]);

    console.log("\n── ③ 되돌려 보기: 가짜 하위 키를 넣으면 빌드가 멈추는가");
    seed([{ id:"bad-one", name:"가짜", subs:["이런하위는없습니다"] }]);
    const r2 = build();
    ok("없는 하위 키를 넣으면 **빌드가 멈춘다**", r2.status !== 0, "exit=" + r2.status);
    ok("무엇이 틀렸는지 말해 준다",
       /그런 하위가 없습니다/.test((r2.stderr || "").toString() + (r2.stdout || "").toString()));
    seed([{ id:"empty-subs", name:"하는 일 없음", subs:[] }]);
    const r3 = build();
    ok("subs 가 비면 **빌드가 멈춘다** (아무 분류에도 안 뜹니다)", r3.status !== 0,
       "exit=" + r3.status);

  }catch(e){
    bad++; ran++;
    console.log("\n❌ 검사가 터졌습니다: " + String(e && e.message || e).slice(0, 300));
  }finally{
    if(b) await b.close();
    if(h) h.srv.close();
    /* ⚠️⚠️ **사본으로 되돌립니다.** 여기를 빠뜨리면 검사용 씨앗이
       저장소에 남아 **없는 업체를 광고하게** 됩니다 (절대 규칙 1). */
    fs.copyFileSync(BAK, GEN);
    fs.copyFileSync(RBAK, RGEN);
    const r = build();
    const back = routes().filter(x => x.indexOf("/pro/") === 0).length;
    ran++;
    /* ⚠️ 후기 씨앗도 같이 되돌렸는지 봅니다 — 남으면 **없는 사람의
       후기**가 저장소에 남고, 그건 지어낸 신뢰입니다 (절대 규칙 1). */
    const rleft = fs.readFileSync(RGEN, "utf8").indexOf("검사용 씨앗") >= 0;
    if(r.status === 0 && back === startedWith && !rleft)
      console.log("  ✅ 씨앗을 되돌렸습니다 (업체 화면 " + back + "장 · 후기 파일도 " +
                  "돌리기 전과 같습니다)");
    else { bad++; console.log("  ❌ 되돌리지 못했습니다 — " +
      "js/data/providers.generated.js · js/data/reviews.generated.js 를 보세요"); }

    /* ⚠️⚠️⚠️ **routes.json 만 보면 안 됩니다.** 2026-11-03 에 여기까지는
       초록이었는데 **찍힌 HTML 두 장이 저장소에 그대로 남아** 커밋까지
       들어갔습니다 (`/pro/green-pt` · `/pro/xss-test`). 사이트맵에도
       routes.json 에도 없어서 링크 검사 · 주소 검사가 전부 지나갔지만,
       Vercel 은 **저장소의 파일을 그대로 섬깁니다** — 올렸으면 없는
       회사를 광고하고 있었을 것입니다. **파일이 실제로 없는지** 봅니다. */
    ran++;
    const left = fs.existsSync(path.join(ROOT, "pro"))
      ? fs.readdirSync(path.join(ROOT, "pro")) : [];
    if(!left.length)
      console.log("  ✅ 찍힌 업체 화면이 저장소에 **한 장도 안 남았습니다**");
    else {
      bad++;
      console.log("  ❌ 검사용 업체 화면이 남았습니다 — pro/" + left.join(" · ") +
                  "  (지우고 다시 빌드하세요. 그대로 올리면 없는 회사를 광고합니다.)");
    }
  }
  console.log("\n" + ran + "건 중 " + (ran - bad) + "건 통과 · " + bad + "건 실패");
  process.exit(bad ? 1 : 0);
})();
