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
  ["연결 구간 두 기둥의 무게가 같다",
   `document.querySelector(".lbr-g").style.alignItems = "center";`],
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
  ["마지막 CTA 가 초록 · 주황 반반이다",
   `document.querySelector(".lfin-cl").style.background = "rgb(200,24,24)";`],
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

(async()=>{
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
  await b.close(); srv.close();
  console.log(bad ? "\n❌ " + bad + "개가 실제로 안 잡습니다" : "\n✅ 전부 실제로 잡습니다");
  process.exit(bad?1:0);
})();
