#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   검사가 **실제로 잡는지** 확인합니다 (playwright 필요)

     node tools/prove-checks.js

   ⚠️ 이 저장소에서 통과만 하고 아무것도 안 잡는 검사를 **세 번**
   만들었습니다. `check.js` 가 초록불이라는 것은 "검사가 통과했다" 이지
   "검사가 일을 한다" 가 아닙니다. 그래서 여기서 화면을 **일부러
   되돌려 놓고** 그 검사가 실패로 바뀌는지 봅니다.

   새 검사를 넣으면 아래 `CASES` 에 한 줄을 같이 넣으세요 —
     [검사 이름, 일부러 망가뜨리는 JS]
   이름은 `check.js` 의 `await f("…")` 이름과 **글자 그대로** 같아야
   합니다.

   ⚠️ **이건 검사가 아니라 검사를 검사하는 도구입니다.** 화면이
   멀쩡한지는 `node check.js` 가 봅니다.
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const http=require("http"), fs=require("fs"), path=require("path");
const MIME={".html":"text/html;charset=utf-8",".js":"text/javascript;charset=utf-8",
 ".css":"text/css;charset=utf-8",".json":"application/json",".svg":"image/svg+xml",
 ".jpg":"image/jpeg",".png":"image/png",".ico":"image/x-icon",".txt":"text/plain",".xml":"application/xml"};
const PORT=8321, ROOT="http://localhost:"+PORT;
const srv=http.createServer((rq,rs)=>{let p=decodeURIComponent(rq.url.split("?")[0]);
 let f=path.join(process.cwd(),p);
 if(!fs.existsSync(f)||fs.statSync(f).isDirectory()) f=path.join(f,"index.html");
 if(!fs.existsSync(f)){f=path.join(process.cwd(),"404.html");rs.statusCode=404;}
 rs.setHeader("content-type",MIME[path.extname(f)]||"application/octet-stream");
 rs.end(fs.readFileSync(f));});

const src = fs.readFileSync("check.js","utf8");
const guards = {};
for(const m of src.matchAll(/await f\("([^"]+)",\s*"([^"]*)",\s*`([\s\S]*?)`\);/g))
  /* ⚠️ check.js 는 이 글을 **백틱 문자열**로 넘깁니다. 파일에 적힌
     \\d 는 그때 \d 가 됩니다 — 여기서도 똑같이 한 겹 벗겨야
     같은 코드를 돌리는 것입니다. 안 벗기면 정규식이 아무것도 못
     찾아서 "검사가 멀쩡한데도 실패" 로 보입니다. */
  guards[m[1]] = { url:m[2], body:eval("`" + m[3] + "`") };

const CASES = [
  ["지어낸 실적 숫자가 메인에 없다",
   `document.querySelector(".lh-d").textContent = "입점 업체 1,200곳";`],
  ["히어로 제목이 창업부터 폐업까지다",
   `document.querySelector(".lh-h").textContent = "창업 플랫폼";`],
  ["히어로에 누를 곳이 하나뿐이다",
   `document.querySelector(".lh-in").insertAdjacentHTML("beforeend","<a href=/x>또</a>");`],
  ["창업은 초록 · 폐업은 주황이고 빨강이 아니다",
   `document.querySelector(".lh-cl").style.color = "rgb(214,28,28)";`],
  ["연결 구간 두 딱지가 같은 높이에 앉는다",
   `document.querySelector(".lbr-g").style.alignItems = "center";`],
  ["자산 타일이 세로로 길쭉하지 않다",
   `document.querySelectorAll(".lbr-as-g > li")
      .forEach(function(e){ e.style.height = "320px"; });`],
  ["허브 두 갈래 카드의 분야 수가 센 값이다",
   `document.querySelector(".hs-st .hs-more i").textContent = "40개 분야";`],
  ["허브 두 갈래 카드의 크기가 같다",
   `document.querySelector(".hs-cl").style.width = "60%";`],
  ["랜딩 미니카드 아이콘이 분류 것과 같다",
   `document.querySelector(".lsd-st .lsd-i svg").innerHTML =
      document.querySelectorAll(".lsd-st .lsd-i svg")[1].innerHTML;`],
  ["메인 구간 차례가 지시서와 같다",
   `const v = document.getElementById("view");
    v.insertBefore(v.children[3], v.children[1]);`],
  ["이웃한 두 구간이 붙어 보이지 않는다",
   `document.querySelectorAll("#view > section")[7]
      .style.background = "#EAF8F3";`],
  ["규모감 숫자가 손으로 쓴 값이 아니라 센 값이다",
   `document.querySelectorAll(".scale-n")[3].textContent = "500";`],
  ["규모감 숫자가 무엇을 센 값인지 밝힌다",
   `document.querySelector(".scale-n-b").remove();`],
  ["랜딩에 서비스 메인 기능을 끌어오지 않았다",
   `document.querySelector("#view section").insertAdjacentHTML("beforeend","<input name=q>");`],
  ["랜딩 구간 차례가 시안과 같다",
   `document.querySelector(".lbr").remove();`],
  ["어두운 면이 화면의 15% 를 넘지 않는다",
   `document.querySelector(".lin").style.background = "#0B1220";`],
  ["마지막 CTA 가 밝은 민트 · 피치이고 악센트로 말한다",
   `document.querySelector(".lfin-st").style.background = "rgb(10,91,66)";`],
  ["랜딩에서 검색으로 가는 길이 있다",
   `document.querySelector('.hd a[href="/search"]').remove();`],
  ["헤더가 거의 불투명해서 밑의 글자가 안 비친다",
   `document.querySelector(".hd").style.background = "rgba(255,255,255,.5)";`],
  ["입점 화면이 업체 0곳을 0 이라고 말한다",
   `document.querySelectorAll(".join-n")[0].textContent = "12곳";`],
  ["입점 화면에 지킬 수 없는 약속이 없다",
   `document.querySelector(".jn-now-t h2").textContent = "월 30건의 요청을 보장합니다";`],
  ["입점 화면이 연락처는 나중에 간다고 밝힌다",
   `document.querySelectorAll(".jn-req-l > li > b")[0].textContent = "연락처";`],
  ["업종 화면에는 그 업종 글이 맨 앞에 온다",
   `document.querySelector(".rd-l b").textContent =
      "사업자등록 — 언제, 어디서, 무엇을 들고 가나";`],
  ["폐업 글은 주황 쪽 · 창업 글은 초록 쪽으로 물든다",
   `document.getElementById("view").className = "";`],
  ["글 목록 거르개 숫자가 센 값이다",
   `document.querySelectorAll(".chip-g-fil .chip")[0]
      .textContent = "전체 120";`],
  ["카드가 구간 바탕과 같은 색이 아니다",
   `document.querySelectorAll(".lsd-g a")[0].style.background =
      getComputedStyle(document.querySelector(".lin")).backgroundColor;`]
];

/* ══════════════════════════════════════════════════════════════════
   ⚠️⚠️ 먼저: **검사 본문에서 백슬래시가 먹었는지** 봅니다.

   검사 본문은 백틱 문자열입니다. `\\d` 라고 두 겹으로 적어야 실행될 때
   `\d` 가 됩니다. 한 겹으로 적으면 템플릿 문자열이 먹어서 그냥 `d` 가
   되고, 정규식이 아무것도 못 맞혀서 **검사가 영원히 통과합니다.**

   이 저장소에서 **네 번** 당했습니다. 화면도 멀쩡하고 문법도 멀쩡하고
   `node --check` 도 통과합니다 — 그냥 아무것도 안 잡을 뿐입니다.
   그래서 돌릴 때마다 먼저 봅니다.
   ══════════════════════════════════════════════════════════════════ */
function proveEscapes(){
  /* ⚠️ **탐지기 자신이 같은 함정에 빠지면 안 됩니다.** 정규식으로 찾으면
     그 정규식의 백슬래시도 먹힐 수 있고, 실제로 `function(w)` 의 `(w)` 를
     오탐으로 잡았습니다. 그래서 **글자 그대로** 비교합니다 —
     `(d+)` · `/s+/` 같은 꼴은 정상 코드에 거의 안 나옵니다. */
  const EATEN = ["(d+)", "(s+)", "(w+)", "(D+)", "(S+)", "(W+)",
                 "/d+/", "/s+/", "/w+/", "/d/", "/s/", "/w/",
                 "[^>]*", "replace(/s", "split(/s", "match(/d"];
  const SAFE = ["[^>]*"];   /* HTML 태그 지우기 — 이건 정상입니다 */
  const bad = [];
  const re = /await f\("([^"]+)",\s*"([^"]+)",\s*`([\s\S]*?)`\);/g;
  let m;
  while((m = re.exec(src))){
    let body;
    try { body = eval("`" + m[3] + "`"); } catch(e){ continue; }
    const hit = EATEN.filter(function(x){
      return SAFE.indexOf(x) < 0 && body.indexOf(x) >= 0; });
    if(hit.length) bad.push(m[1] + "   — " + hit.join(" "));
  }
  /* ⚠️⚠️ **검사 본문의 주석에 백틱이 있으면 문자열이 거기서 끝납니다.**
     이 저장소에서 **세 번** 당했고, 이번(다섯 번째 escape 사고)에도
     `catalog.js` 라고 적었다가 걸렸습니다. node --check 가 잡아 주기는
     하지만, 백틱이 짝을 이루면 파싱이 통과해 버립니다 — 그때는 검사
     본문이 **조용히 잘린 채** 돕니다. 그래서 여기서도 셉니다. */
  {
    const re2 = /await f\("([^"]+)",\s*"([^"]+)",\s*`([\s\S]*?)`\);/g;
    let m2, cut = [];
    while((m2 = re2.exec(src))){
      /* 본문이 return 으로 안 끝나면 잘린 것입니다 */
      if(!/return\s+(true|[^;]+);\s*$/.test(m2[3].trim())) cut.push(m2[1]);
    }
    if(cut.length){
      console.log("\n❌ 검사 본문이 중간에 잘렸습니다 (주석에 백틱?):");
      cut.forEach(function(n){ console.log("   · " + n); });
      console.log("");
      return false;
    }
  }
  if(bad.length){
    console.log("\n❌ 검사 본문에서 백슬래시가 먹었습니다:");
    bad.forEach(function(n){ console.log("   · " + n); });
    console.log("   두 겹으로 적으세요. 이 검사들은 아무것도 안 잡습니다.\n");
    return false;
  }
  console.log("✅ 검사 본문의 정규식이 전부 살아 있습니다 (백슬래시 안 먹음)");
  return true;
}

/* ══════════════════════════════════════════════════════════════════
   전수 점검(AUDIT)의 **묶음 검사**도 되돌려 봅니다.

   `await f(...)` 꼴이 아니라 화면마다 도는 검사라 위의 `CASES` 로는
   못 잡습니다. 그런데 바로 그 묶음에서 사고가 났습니다 — 어두운 면을
   랜딩과 /home 에서만 재고 있었고, 푸터(547px)가 짧은 화면에서는
   **43.9%** 였는데 **78개 화면이 검사 밖**이었습니다.

   그래서 푸터를 일부러 다시 어둡게 해 놓고 "어두운 면이 15% 넘음" 이
   실제로 실패로 바뀌는지 봅니다. ⚠️ 짧은 화면에서 재세요 — 긴 화면만
   보면 통과합니다.
   ══════════════════════════════════════════════════════════════════ */
const BAD = eval(src.match(/^const BAD = (.+);$/m)[1]);
const AUDIT = eval("`" + src.match(/const AUDIT = `([\s\S]*?)`;\n/)[1] + "`");

async function proveAudit(pg){
  let bad = 0;
  for(const u of ["/search", "/tools", "/my"]){
    await pg.goto(ROOT + u, { waitUntil:"load" });
    await pg.waitForTimeout(260);
    const before = (await pg.evaluate(AUDIT)).dark;
    await pg.evaluate(() => {
      const f = document.querySelector("footer.ft");
      if(f) f.style.background = "#062B51"; });
    await pg.waitForTimeout(60);
    const after = (await pg.evaluate(AUDIT)).dark;
    const ok = before.length === 0 && after.length > 0;
    if(!ok) bad++;
    console.log((ok ? "✅" : "❌") + " 어두운 면이 15% 넘음 · " + u +
      "  [지금 " + JSON.stringify(before) +
      " → 푸터를 다시 어둡게 하면 " + JSON.stringify(after).slice(0,50) + "]");
  }

  /* 이웃한 두 구간이 붙어 보임 — 둘째 구간을 첫째와 같은 색으로
     돌려놓고 잡히는지 봅니다. ⚠️ 바탕을 **안 준** 구간도 봐야 합니다 —
     처음에 투명이라고 건너뛰었다가 업종 화면의 두 쌍을 놓쳤습니다. */
  for(const u of ["/startup", "/startup/cafe", "/providers/interior"]){
    await pg.goto(ROOT + u, { waitUntil:"load" });
    await pg.waitForTimeout(260);
    const before = (await pg.evaluate(AUDIT)).tone;
    await pg.evaluate(() => {
      /* ⚠️ 맨 앞은 히어로이고 그라디언트라 색 하나로 안 줄어듭니다 —
         검사가 건너뛰므로 되돌리기가 안 먹습니다. **뒤에서 두 구간**을
         씁니다. (처음에 s[0]·s[1] 로 적었다가 "안 잡는다" 로 나왔는데,
         검사가 아니라 되돌리기가 틀린 것이었습니다.) */
      const s = [...document.querySelectorAll("#view > section")];
      if(s.length > 2)
        s[s.length-1].style.background =
          getComputedStyle(s[s.length-2]).backgroundColor;
    });
    await pg.waitForTimeout(60);
    const after = (await pg.evaluate(AUDIT)).tone;
    const ok = before.length === 0 && after.length > 0;
    if(!ok) bad++;
    console.log((ok ? "✅" : "❌") + " 이웃한 두 구간이 붙어 보임 · " + u +
      "  [지금 " + JSON.stringify(before) +
      " → 둘째를 첫째와 같은 색으로 하면 " + JSON.stringify(after).slice(0,50) + "]");
  }

  /* 마지막 구간 ↔ 푸터 — 푸터를 본문 색으로 돌려놓고 봅니다.
     ⚠️ 푸터에 **테두리를 두면 안 됩니다.** 검사가 그 선을 보고
     통과시켜서, 푸터가 다시 본문과 같은 색이 되어도 아무도 모릅니다. */
  for(const u of ["/providers/interior", "/about"]){
    await pg.goto(ROOT + u, { waitUntil:"load" });
    await pg.waitForTimeout(260);
    const before = (await pg.evaluate(AUDIT)).tone;
    await pg.evaluate(() => {
      const s = [...document.querySelectorAll("#view > section")];
      document.querySelector("footer.ft").style.background =
        getComputedStyle(s[s.length-1]).backgroundColor; });
    await pg.waitForTimeout(60);
    const after = (await pg.evaluate(AUDIT)).tone;
    const ok = before.length === 0 && after.some(x => x.indexOf("푸터") >= 0);
    if(!ok) bad++;
    console.log((ok ? "✅" : "❌") + " 마지막 구간 ↔ 푸터 · " + u +
      "  [지금 " + JSON.stringify(before) +
      " → 푸터를 본문 색으로 하면 " + JSON.stringify(after).slice(0,50) + "]");
  }

  /* "준비 중" 자리표시자 — 프랜차이즈 분류 칸을 원래대로 돌려놓습니다.
     열두 칸이 전부 "준비 중" 이었고, 세는 값(0개 브랜드)을 내야 할
     자리였습니다 (절대 규칙 2). */
  for(const u of ["/franchise", "/join"]){
    await pg.goto(ROOT + u, { waitUntil:"load" });
    await pg.waitForTimeout(260);
    const before = (await pg.evaluate(AUDIT)).ph;
    await pg.evaluate(() => {
      const e = document.querySelector("#view .fc-n, #view .jn-now-l b");
      if(e) e.textContent = "준비 중";
    });
    await pg.waitForTimeout(60);
    const after = (await pg.evaluate(AUDIT)).ph;
    const ok = before.length === 0 && after.length > 0;
    if(!ok) bad++;
    console.log((ok ? "✅" : "❌") + " \"준비 중\" 자리표시자 · " + u +
      "  [지금 " + JSON.stringify(before) +
      " → 한 칸을 준비 중으로 하면 " + JSON.stringify(after).slice(0,50) + "]");
  }
  /* 별표(**)가 글자로 남음 — ⚠️ **자식 태그가 있는 칸**에 넣어서
     봅니다. 전에는 잎사귀만 보고 있어서, 약관·방침의 조문(p 안에
     번호 span 이 있습니다)에 남아 있던 별표를 통째로 놓쳤습니다.
     잎사귀에 넣는 되돌리기로는 그 구멍이 안 드러납니다. */
  for(const u of ["/privacy", "/terms"]){
    await pg.goto(ROOT + u, { waitUntil:"load" });
    await pg.waitForTimeout(260);
    const before = (await pg.evaluate(AUDIT)).star;
    await pg.evaluate(() => {
      const e = document.querySelector("#view p.lg-p > span.lg-n");
      if(e) e.insertAdjacentText("afterend", "**별도의 동의**를 받습니다.");
    });
    await pg.waitForTimeout(60);
    const after = (await pg.evaluate(AUDIT)).star;
    const ok = before.length === 0 && after.length > 0;
    if(!ok) bad++;
    console.log((ok ? "✅" : "❌") + " 별표(**)가 글자로 남음 · " + u +
      "  [지금 " + JSON.stringify(before) +
      " → 자식 있는 칸에 별표를 넣으면 " + JSON.stringify(after).slice(0,50) + "]");
  }

  return bad;
}

(async()=>{
  if(!proveEscapes()) process.exit(1);
  await new Promise(r=>srv.listen(PORT,r));
  const b = await chromium.launch();
  const pg = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
  let bad = 0;
  for(const [name, breakJs] of CASES){
    const g = guards[name];
    if(!g){ console.log("? 검사를 못 찾음: " + name); bad++; continue; }
    await pg.goto(ROOT + g.url, { waitUntil:"load" });
    await pg.waitForTimeout(260);
    /* 먼저 멀쩡한 상태에서 통과하는지 */
    const before = await pg.evaluate("(async()=>{ " + g.body + " })()");
    await pg.evaluate(breakJs);
    await pg.waitForTimeout(80);
    const after = await pg.evaluate("(async()=>{ " + g.body + " })()");
    const ok = (before === true) && (after !== true);
    if(!ok) bad++;
    console.log((ok ? "✅" : "❌") + " " + name +
      "  [되돌리기 전 " + JSON.stringify(before).slice(0,40) +
      " → 후 " + JSON.stringify(after).slice(0,60) + "]");
  }
  bad += await proveAudit(pg);
  await b.close(); srv.close();
  console.log(bad ? "\n❌ " + bad + "개가 실제로 안 잡습니다" : "\n✅ 전부 실제로 잡습니다");
  process.exit(bad?1:0);
})();
