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
const BAK  = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "pv-")), "providers.keep.js");

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
    verified:{ brn:true, tel:true }, scale:"mid", brands:["타이틀리스트","캘러웨이"] },
  { id:"xss-test", name:"<img src=x onerror=alert(1)>",
    intro:"<script>alert(2)</script> 소개글",
    regions:["seoul"], subs:["ft-mend","ft-grip"], scale:"small" }
];

function nowServe(){ return serve(0); }

(async function(){
  fs.copyFileSync(GEN, BAK);
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
    ok("⚠️ 평점 · 후기 수를 찍지 않는다",
       t.indexOf("평점") < 0 && t.indexOf("점") < 0 || !/[0-9]\.[0-9]\s*점/.test(t));
    ok("⚠️ 연락처를 화면에 두지 않는다", !/01[0-9]-?[0-9]{3,4}-?[0-9]{4}/.test(t));
    const html = await p.content();
    ok("⚠️ 구조화 데이터에 aggregateRating 이 없다", html.indexOf("aggregateRating") < 0);
    /* ⚠️⚠️ 상담 길 (0035) — 이제 단추가 있습니다. 재는 것은 **단추가
       있는가**와 **지키지 못할 약속을 하지 않는가** 둘입니다. */
    ok("이 업체로 요청하는 단추가 있다",
       (await p.locator('main a.btn[href^="/match?pv="]').count()) === 1);
    ok("  그 주소에 업체 id 가 실린다",
       (await p.getAttribute('main a.btn[href^="/match?pv="]', "href")) ===
       "/match?pv=green-pt",
       await p.getAttribute('main a.btn[href^="/match?pv="]', "href"));
    /* ⚠️⚠️⚠️ **"바로 이 업체로 간다" 고 말하면 거짓말입니다** — 배정은
       운영자가 하고, 넘기는 순간 상호를 알리고 제3자 제공 동의를 다시
       받습니다 (제17조 제2항). 화면이 그것을 적는지 봅니다. */
    ok("⚠️ 바로 간다는 약속을 **하지 않는다**",
       /약속은 아닙니다/.test(t), t.slice(0, 400));
    ok("⚠️ 넘기기 전에 다시 여쭙는다고 적는다",
       /연락처 전달 동의를 다시/.test(t), t.slice(0, 400));
    ok("대신 갈 곳도 같이 준다", (await p.locator("main .none a.btn").count()) >= 2);

    /* 업체가 적은 글이 esc 를 거치는가 */
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

    /* 업체찾기 — ⚠️ 눌러 봐야 압니다 (보내는 열쇠와 받는 열쇠) */
    await p.goto("http://127.0.0.1:" + h.port + "/search?q=" + encodeURIComponent("연습장"),
                 { waitUntil:"networkidle" });
    await p.waitForTimeout(250);
    t = (await p.textContent("#sres")) || "";
    ok("검색에서 업체가 먼저 나온다", /맞는 업체 1곳/.test(t), t.slice(0, 60));
    ok("그 링크가 업체 화면으로 간다",
       ((await p.locator("#sres a").first().getAttribute("href")) || "") === "/pro/green-pt");
    await p.goto("http://127.0.0.1:" + h.port + "/search?q=" + encodeURIComponent("경기"),
                 { waitUntil:"networkidle" });
    await p.waitForTimeout(250);
    ok("지역 이름으로도 업체가 찾아진다",
       /맞는 업체/.test((await p.textContent("#sres")) || ""));

    ok("화면 에러 · CSP 거절이 0건이다", hits.length === 0, hits.join(" | "));

    /* 사람이 볼 그림 — 도구가 "보기 흉한가" 는 영원히 못 잽니다 */
    if(process.argv.indexOf("--shot") >= 0){
      const dir = process.argv[process.argv.indexOf("--shot") + 1] || ".";
      for(const [u, f] of [["/cat/range", "pv-cat"], ["/pro/green-pt", "pv-one"]]){
        const sp = await b.newPage({ viewport:{ width:1280, height:900 }, deviceScaleFactor:2 });
        await sp.goto("http://127.0.0.1:" + h.port + u, { waitUntil:"networkidle" });
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
    const r = build();
    const back = routes().filter(x => x.indexOf("/pro/") === 0).length;
    ran++;
    if(r.status === 0 && back === startedWith)
      console.log("  ✅ 씨앗을 되돌렸습니다 (업체 화면 " + back + "장 — 돌리기 전과 같습니다)");
    else { bad++; console.log("  ❌ 되돌리지 못했습니다 — js/data/providers.generated.js 를 보세요"); }

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
