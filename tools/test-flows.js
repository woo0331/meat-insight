/* ══════════════════════════════════════════════════════════════════
   손님이 실제로 누르는 길을 끝까지 눌러 봅니다 (2026-10-08 §25)
   ══════════════════════════════════════════════════════════════════
   `node check.js` 는 **화면 하나하나**를 봅니다 — 글자 크기 · 대비 ·
   누름 크기 · 구간 차례. 그런데 이 사이트가 파는 것은 화면이 아니라
   **길**입니다: 창업을 누르면 업종이 나오고, 업종을 고르면 순서가
   나오고, 그 걸음을 누르면 업체로 가야 합니다.

   ⚠️⚠️ **길은 화면마다 멀쩡해도 끊길 수 있습니다.** 이 저장소에서
   실제로 그랬습니다 — 영업 작업대가 보내 드리는 `/join` 이 잠겨 있던
   것, `amStore()` 를 아무 데서도 안 부르던 것, 단계 열이 내려오면서
   `/g/:stage` 여섯이 길을 잃을 뻔한 것. 전부 **각 화면은 통과**합니다.

       node tools/test-flows.js

   ⚠️ 길을 바꾸셨으면 여기도 같이 고치세요. 안 고치면 **끊긴 길을
   아무도 안 보고 있습니다.**
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require("playwright");
const http=require("http"),fs=require("fs"),path=require("path");
const root=require("path").resolve(__dirname, "..");
const srv=http.createServer((q,r)=>{let f=decodeURIComponent(q.url.split("?")[0]);let p=path.join(root,f);
 try{ if(fs.statSync(p).isDirectory()) p=path.join(p,"index.html"); }catch(e){ p=path.join(root,"404.html"); }
 try{const b=fs.readFileSync(p);const t=p.endsWith(".css")?"text/css":p.endsWith(".js")?"text/javascript":p.endsWith(".jpg")?"image/jpeg":"text/html";
 r.writeHead(200,{"content-type":t+"; charset=utf-8"});r.end(b);}catch(e){r.writeHead(404);r.end("x");}});
const B="http://127.0.0.1:8377";
let bad=0;
const say=(ok,n,x)=>{ console.log((ok?"  ✅ ":"  ❌ ")+n+(x?"  — "+x:"")); if(!ok) bad++; };
(async()=>{
 await new Promise(r=>srv.listen(8377,r));
 const br=await chromium.launch(); const pg=await br.newPage({viewport:{width:1440,height:900}});
 const errs=[]; pg.on("pageerror",e=>errs.push(String(e.message)));
 const txt=()=>pg.evaluate(()=>document.getElementById("view").textContent);
 const url=()=>pg.evaluate(()=>location.pathname+location.search);
 const click=async(sel)=>{ await pg.click(sel); await pg.waitForTimeout(260); };

 console.log("\n【1】 창업 → 업종 → 신규창업 → 로드맵 → 상세");
 await pg.goto(B+"/",{waitUntil:"networkidle"});
 await click('.mh-pick .hpk-st');
 say((await url())==="/startup","메인 창업 카드 → /startup",await url());
 await click('.ind-g > li:nth-child(2) > a');
 say((await url()).startsWith("/startup/"),"업종 고르기 → /startup/:업종",await url());
 say((await txt()).indexOf("새로 만드는 것과 받는 것")>=0,"STEP 02 분기가 보인다");
 const nNew=await pg.evaluate(()=>document.querySelectorAll(".pcs > li").length);
 say(nNew===14,"신규 창업 로드맵 14걸음","지금 "+nNew);
 const step1=await pg.evaluate(()=>{const a=document.querySelector(".pcs > li .pcs-l");return a?a.getAttribute("href"):null;});
 say(!!step1 && step1!=="#","걸음마다 갈 곳이 있다",step1);

 console.log("\n【2】 창업 → 기존 매장 인수 → 인수 로드맵 → 매장 찾기");
 await click('.swt-g a:nth-child(2)');
 say((await url()).indexOf("how=take")>=0,"인수 분기가 주소에 실린다",await url());
 const nTake=await pg.evaluate(()=>document.querySelectorAll(".pcs > li").length);
 say(nTake===9,"인수 로드맵 9걸음","지금 "+nTake);
 say((await txt()).indexOf("매장 인수, 무엇부터")>=0 || (await txt()).indexOf("매장 인수")>=0,"인수 쪽 제목으로 바뀐다");

 console.log("\n【3】 폐업 → 현재 상황 → 상황별 로드맵");
 await pg.goto(B+"/closure",{waitUntil:"networkidle"});
 const want=await pg.evaluate(()=>[...document.querySelectorAll(".wnt b")].map(b=>b.textContent.trim()));
 say(want.length===4,"상황 넷",want.join(" / "));
 for(const [w,n,key] of [["pass",10,"acq-out"],["money",9,"asset-out"],["fast",13,"closing"]]){
   await pg.goto(B+"/closure?w="+w,{waitUntil:"networkidle"});
   const k=await pg.evaluate(()=>document.querySelectorAll(".pcs > li").length);
   say(k===n,"?w="+w+" → "+key+" "+n+"걸음","지금 "+k);
 }
 await pg.goto(B+"/closure?w=lost",{waitUntil:"networkidle"});
 const q=await pg.evaluate(()=>document.querySelectorAll(".cask-i").length);
 say(q===5,"모르겠어요 → 질문 다섯","지금 "+q);
 await pg.evaluate(()=>{document.getElementById("ask-staff").checked=true;document.getElementById("ask-equip").checked=true;});
 await click('.cask .btn');
 say((await url()).indexOf("w=money")>=0 && (await url()).indexOf("staff=1")>=0,"진단 결과로 보낸다",await url());
 say((await txt()).indexOf("직원이 계시면 기한부터")>=0,"직원 있다고 하면 기한 안내가 붙는다");

 console.log("\n【4】 계산기 · 정보 · 업체 · 입점");
 await pg.goto(B+"/",{waitUntil:"networkidle"});
 await click('.mti-calc .mti-g > li:nth-child(1) > a');
 say((await url())==="/tools/cost","메인 계산도구 → 실제 계산기",await url());
 await pg.evaluate(()=>{const i=document.querySelector("#tl-f input");if(i){i.value="1000";i.dispatchEvent(new Event("input",{bubbles:true}));}});
 await pg.waitForTimeout(200);
 say((await pg.evaluate(()=>!!document.querySelector(".tl-res"))),"계산기 결과 칸이 돈다");
 await pg.goto(B+"/",{waitUntil:"networkidle"});
 await click('.mti-read .mti-rg > li:nth-child(1) > a');
 say((await url()).startsWith("/content/"),"메인 최신 정보 → 글 상세",await url());
 await pg.goto(B+"/",{waitUntil:"networkidle"});
 await click('.msvc-g > li:nth-child(2) > a');
 say((await url()).startsWith("/providers/"),"핵심 서비스 → 업체찾기",await url());
 await pg.goto(B+"/",{waitUntil:"networkidle"});
 await click('.mjn-go a');
 say((await url())==="/join","파트너 입점 → 신청 화면",await url());

 console.log("\n【5】 콘솔 오류");
 say(errs.length===0,"JS 에러 없음",errs.join(" / "));
 console.log(bad?("\n❌ "+bad+"건 실패"):"\n✅ 흐름 전부 통과");
 await br.close(); srv.close(); process.exit(bad?1:0);
})();
