#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   관리자 화면을 **눌러 봅니다** — 입점 신청 목록

   ⚠️⚠️ **성함 · 연락처가 나오는 화면입니다.** 그래서 두 가지를 꼭
   잽니다 —
     ① 운영자가 아니면 **한 줄도 안 보인다**
     ② 신청자가 적은 글이 **esc() 를 거쳐** 나간다 (절대 규칙 4)

   ⚠️ 못 읽은 것과 0건을 **다르게** 말하는지도 봅니다. 못 읽었는데
   0 으로 찍으면 멀쩡한 줄이 사라진 것처럼 보입니다.

   ⚠️ Supabase 를 가짜로 세워 둡니다 — 진짜 DB 쪽은 tools/test-sql.js
   가 따로 눌러 봅니다. 여기서 재는 것은 **화면이 받은 것을 어떻게
   그리는가** 입니다.

   돌리기   node tools/test-admin.js
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path"), http = require("http");
const ROOT = path.join(__dirname, "..");

let bad = 0, ran = 0;
function ok(name, cond, got){
  ran++;
  if(cond) console.log("  ✅ " + name);
  else { bad++; console.log("  ❌ " + name + (got !== undefined ? "  →  " + String(got).slice(0, 200) : "")); }
}

/* 서버는 tools/_serve.js 한 곳에 있습니다 — 운영과 같은 헤더를 보냅니다 */
const { serve, watch } = require("./_serve.js");


/* ⚠️ 운영 CSP(connect-src)가 허락하는 꼴이어야 합니다 — 좁히면
   이 검사가 같이 떨어집니다. 그게 맞습니다. */
const FAKE = "https://sb-test.supabase.co";
const ROWS = [
  { id:"11111111-1111-1111-1111-111111111111", no:"GA261103-0001",
    company:"성남 그린골프연습장", name:"홍길동", tel:"010-1234-5678",
    region:"경기 성남시", services:["rg-in","rg-sim"], state:"new",
    created_at:"2026-11-03T01:00:00Z" },
  /* ⚠️ 신청자가 적은 글에 태그를 넣어 봅니다 — 그대로 나가면 사고입니다 */
  { id:"22222222-2222-2222-2222-222222222222", no:"GA261103-0002",
    company:"<img src=x onerror=alert(1)>", name:"테스트", tel:"010-0000-0000",
    region:null, services:["ls-pro","없는키"], state:"called",
    created_at:"2026-11-03T02:00:00Z" }
];

function stub(p, who, applyBody){
  return Promise.all([
    p.route("**/api/session", function(r){
      return r.fulfill({ status:200, contentType:"application/json",
        body: JSON.stringify(Object.assign({ auth:true, signedIn:true, hats:[],
          conf:{ url:FAKE, anonKey:"k" } }, who)) });
    }),
    p.route(FAKE + "/rest/v1/**", function(r){
      const u = r.request().url();
      if(u.indexOf("provider_apply") >= 0) return applyBody(r);
      /* ⚠️⚠️ 업체 수는 **DB 의 함수**가 셉니다 (0030) — 운영자에게는
         검사용 업체도 보여서, PostgREST 로 그냥 세면 검사용이 섞인
         값을 "업체 수" 로 찍습니다 (2차 지시서 §8). */
      if(u.indexOf("/rpc/provider_counts") >= 0)
        return r.fulfill({ status:200, contentType:"application/json",
                           body: JSON.stringify({ real:4, test:3 }) });
      /* 세는 요청 — content-range 로 갯수를 돌려줍니다 */
      return r.fulfill({ status:200, contentType:"application/json",
        headers:{ "content-range":"0-0/7" }, body:"[]" });
    })
  ]);
}

(async function(){
  const PORT = 8790 + (process.pid % 50);
  const srv = (await serve(PORT)).srv;
  const b = await chromium.launch();
  const URL = "http://127.0.0.1:" + PORT + "/admin";

  /* ── ① 운영자가 아닐 때 ─────────────────────────────────────── */
  console.log("\n── 운영자가 아니면 한 줄도 안 보입니다");
  let p = await b.newPage({ viewport:{ width:1280, height:900 } });
  let reached = false;
  await stub(p, { role:"customer", name:"일반회원" }, function(r){
    reached = true;
    return r.fulfill({ status:200, contentType:"application/json", body: JSON.stringify(ROWS) });
  });
  await p.goto(URL, { waitUntil:"networkidle" });
  await p.waitForTimeout(400);
  let txt = (await p.textContent("#adminbox")) || "";
  ok("운영자만 볼 수 있다고 말한다", /운영자만/.test(txt), txt.slice(0, 50));
  ok("신청 목록을 **아예 읽으러 가지도 않는다**", reached === false);
  ok("성함 · 연락처가 한 글자도 안 나온다",
     txt.indexOf("홍길동") < 0 && txt.indexOf("1234-5678") < 0);
  await p.close();

  /* ── ② 관리자일 때 ─────────────────────────────────────────── */
  console.log("\n── 관리자는 봅니다");
  p = await b.newPage({ viewport:{ width:1280, height:900 } });
  /* ⚠️ CSP 거절과 화면 에러를 같이 모읍니다 (tools/_serve.js 의 watch) */
  const errs = watch(p);
  await stub(p, { role:"admin", name:"관리자" }, function(r){
    return r.fulfill({ status:200, contentType:"application/json", body: JSON.stringify(ROWS) });
  });
  await p.goto(URL, { waitUntil:"networkidle" });
  await p.waitForTimeout(500);
  ok("화면 에러 · CSP 거절이 0건이다", errs.length === 0, errs.join(" | "));
  /* ⚠️ 갯수를 박지 않습니다 — 세는 칸이 늘면 엉뚱하게 떨어집니다.
     ⚠️⚠️ 대신 **0 보다 많은지**와 뜻이 맞는지를 봅니다. */
  ok("세는 칸이 그려진다", (await p.locator(".cnt").count()) > 0,
     await p.locator(".cnt").count());
  let cntTxt = (await p.textContent(".cnts")) || "";
  ok("⚠️ 업체 수를 참 업체와 검사용으로 **갈라서** 보여 준다",
     /업체/.test(cntTxt) && cntTxt.indexOf("4곳") >= 0 &&
     /그중 검사용/.test(cntTxt) && cntTxt.indexOf("3곳") >= 0, cntTxt);
  ok("  둘을 **합쳐서** 보여 주지 않는다 (7곳이 업체 수가 아닙니다)",
     cntTxt.indexOf("7곳") < 0, cntTxt);
  /* ⚠️⚠️⚠️ **입점 신청 목록은 `#adminbox` 가 아니라 `#probox` 입니다**
     (2026-11-10 에 합쳤습니다). 그 전에는 같은 표를 두 상자가 **각자**
     그렸고, 그래서 **글도 두 곳이라 둘이 같이 썩었습니다** — 적은 쪽이
     "화면에서 업체를 만들 수 없습니다 — SQL 로 하십니다" 라고 적고
     있었는데 `#probox` 에는 0023 부터 그 단추가 있었습니다.
     ⚠️ 적은 쪽을 걷어냈으니 **재는 자리도 같이 옮깁니다** — 기능을 빼는
     날 그 검사도 같이 고칩니다(안 고치면 멀쩡한 코드가 실패로 잡히고,
     뜻을 안 옮기면 그 자리가 **아무도 안 재는 자리**가 됩니다). */
  ok("⚠️ 세는 상자가 목록을 **두 번 그리지 않는다**",
     (await p.locator("#adminbox .apl-r").count()) === 0 &&
     (await p.locator("#adminbox .fe-p").count()) === 0);
  /* ⚠️⚠️ 수만 적고 **어디서 보는지** 안 적으면 막다른 길입니다
     (절대 규칙 2) — 길 한 줄이 남아 있는지 봅니다. */
  let adm = ((await p.textContent("#adminbox")) || "").replace(/\s+/g, " ");
  ok("  대신 **어디서 보는지** 한 줄로 가리킨다 (막다른 길이 아니다)",
     /입점 신청[^。]*칸에서/.test(adm), adm.slice(-90));

  /* ⚠️ 기본은 「업체」 칸입니다 — 눌러서 「입점 신청」으로 옮깁니다 */
  await p.click("#probox button[data-ptab='ap']");
  /* ⚠️⚠️ 누른 뒤에는 paint() 가 다시 읽는 동안 탭이 없습니다 —
     시간으로 기다리면 느린 날 **멀짱한 화면이 떨어집니다**. */
  await p.waitForSelector("#probox button[data-ptab='ap'][aria-selected='true']");
  ok("⚠️ 「입점 신청」 칸이 켜진다",
     (await p.getAttribute("#probox button[data-ptab='ap']", "aria-selected")) === "true");
  const apn = await p.locator("#probox .fe-p > li").count();
  ok("신청 두 줄이 그려진다", apn === 2, apn);

  const html = await p.innerHTML("#probox");
  ok("⚠️ 신청자가 적은 태그가 **날것으로 안 들어간다**",
     html.indexOf("<img src=x") < 0 && html.indexOf("&lt;img") >= 0);
  const imgs = await p.locator("#probox img").count();
  ok("⚠️ 그 글 때문에 그림이 생기지 않는다", imgs === 0, imgs);

  txt = (await p.textContent("#probox")) || "";
  /* ⚠️⚠️⚠️ **이 줄이 합치면서 나빠질 자리였습니다** — `#probox` 는
     `esc(a.services)` 로 적고 있었고 그 칸은 text[] 라, 그대로 두면
     `rg-in,rg-sim` 처럼 **영문 키가 쉼표로** 찍혔습니다. 걷어낸 쪽이
     `amSub()` 로 풀어 적고 있었으므로 그 일을 `subNames()` 로 옮겼습니다. */
  ok("하위 키를 사람 말로 바꿔 보여 준다", txt.indexOf("실내 연습장") >= 0);
  ok("  **쉼표로 이은 영문 키**를 안 찍는다", txt.indexOf("rg-in,rg-sim") < 0, txt.slice(0, 120));
  ok("모르는 키는 **키 그대로** 보여 준다 (조용히 빠지지 않는다)",
     txt.indexOf("없는키") >= 0);
  /* ⚠️ 상태 말은 `#probox` 의 것입니다 — 걷어낸 쪽은 「통화함」이었고
     이쪽은 「연락함」입니다. 검사에 그날의 글자를 박지 않고 **두 상태가
     사람 말로 나오는지**를 봅니다. */
  ok("상태를 사람 말로 보여 준다",
     txt.indexOf("새 신청") >= 0 && txt.indexOf("연락함") >= 0);
  ok("지역이 비어도 '(미기재)' 를 안 찍는다",
     txt.indexOf("미기재") < 0 && txt.indexOf("undefined") < 0 && txt.indexOf("null") < 0);

  /* 누르는 것이 전부 40px 이상인가
     ⚠️⚠️ **잰 것이 0개면 실패입니다** — 상자를 옮기면서 선택자가 아무
     칸도 안 집는 날 조용히 초록이 됩니다. 그래서 **센 수**도 같이 봅니다.
     ⚠️ 안 그려진 칸은 누르는 것이 아닙니다 — 높이가 0 이라 끼면 멀쩡한
     화면이 떨어집니다(`getClientRects().length` 로 거릅니다). */
  const taps = await p.evaluate(function(){
    var all = Array.prototype.slice.call(document.querySelectorAll(
      "#probox button, #probox a, #adminbox button, #adminbox a"))
      .filter(function(e){ return e.getClientRects().length > 0; });
    return { n: all.length, low: all.filter(function(e){
      return e.getBoundingClientRect().height < 39.5; }).length };
  });
  ok("⚠️ 잴 칸을 찾기는 했다", taps.n > 0, taps.n);
  ok("누르는 것이 전부 40px 이상이다", taps.low === 0, taps.low);
  await p.close();

  /* ── ③ 읽지 못했을 때 ─────────────────────────────────────────
     ⚠️ 못 읽은 것과 0건은 **다릅니다** — 못 읽었는데 0 으로 찍으면
     멀쩡한 줄이 사라진 것처럼 보입니다 (절대 규칙 1). */
  console.log("\n── 못 읽은 것과 0건을 다르게 말합니다");
  p = await b.newPage({ viewport:{ width:1280, height:900 } });
  await stub(p, { role:"admin", name:"관리자" }, function(r){
    return r.fulfill({ status:500, contentType:"application/json", body:"{}" });
  });
  await p.goto(URL, { waitUntil:"networkidle" });
  await p.waitForTimeout(500);
  txt = (await p.textContent("#probox")) || "";
  ok("읽지 못하면 그렇다고 말한다", /읽지 못했습니다/.test(txt), txt.slice(-60));
  ok("읽지 못한 것을 0건이라고 하지 않는다", txt.indexOf("0건") < 0);
  /* ⚠️⚠️ 못 읽었을 때는 **안 처리한 수도 안 적습니다** (0 과 다릅니다) */
  ok("⚠️ 못 읽었으면 안 처리한 수를 **안 적는다**",
     (await p.locator("#probox .bz-n").count()) === 0);
  /* ⚠️ 막다른 길로 두지 않습니다 — 다시 읽는 단추를 냅니다 */
  ok("  다시 읽는 길을 낸다",
     (await p.locator("#probox button[data-do='again']").count()) === 1);
  await p.close();

  p = await b.newPage({ viewport:{ width:1280, height:900 } });
  await stub(p, { role:"admin", name:"관리자" }, function(r){
    return r.fulfill({ status:200, contentType:"application/json", body:"[]" });
  });
  await p.goto(URL, { waitUntil:"networkidle" });
  await p.waitForTimeout(500);
  await p.click("#probox button[data-ptab='ap']");
  /* ⚠️⚠️ 누른 뒤에는 paint() 가 다시 읽는 동안 탭이 없습니다 —
     시간으로 기다리면 느린 날 **멀짱한 화면이 떨어집니다**. */
  await p.waitForSelector("#probox button[data-ptab='ap'][aria-selected='true']");
  txt = (await p.textContent("#probox")) || "";
  ok("0건이면 0건이라고 말한다", /아직 들어온 입점 신청이 없습니다/.test(txt),
     txt.slice(-60));
  /* ⚠️ 0 이면 뱃지를 **안 답니다** — 늘 켜져 있는 잔소리가 됩니다 */
  ok("⚠️ 0건이면 안 처리한 수를 **안 적는다**",
     (await p.locator("#probox .bz-n").count()) === 0);
  await p.close();

  await b.close(); srv.close();
  console.log("\n" + ran + "건 중 " + (ran - bad) + "건 통과 · " + bad + "건 실패");
  process.exit(bad ? 1 : 0);
})();
