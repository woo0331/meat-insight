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
 /* ⚠️⚠️ **히어로의 창업 / 폐업 선택 카드가 없어졌습니다**
    (2026-10-11 최종 디자인 지시서 §3 — 히어로는 카피 + 통합검색 +
    바로가기 칩입니다). 메인에서 `/startup` 으로 가는 길은 전문관
    카드를 고르고 **전체보기**이고, 그게 손님이 실제로 누르는 길입니다. */
 /* ⚠️⚠️ **2026-10-16 §3-3 — 메인에서 /startup 으로 가는 길이 진입
    카드 셋의 첫 장이 됐습니다** (전문관 넷 + 전체보기는 내려왔습니다).
    카드 전체가 하나의 링크라 카드를 그대로 누릅니다. */
 await click('.bent-c.ent-startup > a');
 say((await url())==="/startup","메인 진입 카드 창업 준비 → /startup",await url());
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
 /* ⚠️⚠️ **2026-10-16 §3 — 계산도구 구간이 메인에서 내려왔습니다.**
    길은 **헤더 "계산기"** 가 받습니다 — 끝이 막히지 않았는지 거기서
    눌러 봅니다 (함수는 안 지웠고 /tools 가 열셋을 다 들고 있습니다). */
 await click('.hd .gnb a[href="/tools"]');
 say((await url())==="/tools","헤더 계산기 → 계산도구 목록",await url());
 await click('#view a[href="/tools/cost"]');
 say((await url())==="/tools/cost","계산도구 목록 → 실제 계산기",await url());
 await pg.evaluate(()=>{const i=document.querySelector("#tl-f input");if(i){i.value="1000";i.dispatchEvent(new Event("input",{bubbles:true}));}});
 await pg.waitForTimeout(200);
 say((await pg.evaluate(()=>!!document.querySelector(".tl-res"))),"계산기 결과 칸이 돈다");
 /* ⚠️⚠️ **"최신 정보" 구간이 메인에서 내려왔습니다** (최종 디자인
    지시서 §1 — 메인은 일곱 구간이고 글 구간이 없습니다). 글 예순 편이
    길을 잃지 않았는지 **남은 길**로 끝까지 눌러 봅니다 — 마지막 구간의
    도움 줄과 푸터 `정보센터` 둘입니다. */
 /* ⚠️⚠️ **2026-10-16 §4 — 글 예순 편으로 가는 길이 헤더 "이용
    가이드" 가 됐습니다** (메인의 도움 줄은 §3 의 아홉 영역에
    없습니다). 끝이 막히지 않았는지 거기서 눌러 봅니다. */
 await pg.goto(B+"/",{waitUntil:"networkidle"});
 await click('.hd .gnb a[href="/content"]');
 say((await url())==="/content","헤더 이용 가이드 → 정보센터",await url());
 await click('.ct-l > li:nth-child(1) a');
 say((await url()).startsWith("/content/"),"정보센터 → 글 상세",await url());
 await pg.goto(B+"/",{waitUntil:"networkidle"});
 /* ⚠️ 2026-10-11 UI/UX 지시서 §2 — 분류 여덟(.msvc-g)이 **전문관
    넷**이 됐습니다. 끝이 막힌 길이 생기지 않았는지 눌러서 봅니다 —
    ① 전문관을 고르면 그 전문관 서비스가 나오고 ② 서비스 칸이 실제
    화면으로 가고 ③ 전체보기가 그 전문관으로 갑니다. */
 /* ⚠️⚠️ **2026-10-16 §3 — 메인에서 전문관을 고르는 구간이
    내려왔습니다.** 진입 카드 셋이 전문관 세 화면으로 **바로** 보내고,
    매장 양도양수는 ④ 가로형 배너가 받습니다. 끝이 막힌 길이 생기지
    않았는지 넷 다 눌러 봅니다. */
 await click('.bent-c.ent-closure > a');
 say((await url())==="/closure","메인 진입 카드 폐업 · 정리 → /closure",await url());
 await pg.goto(B+"/",{waitUntil:"networkidle"});
 await click('.bent-c.ent-operation > a');
 say((await url())==="/operation","메인 진입 카드 매장 운영 → /operation",await url());
 await pg.goto(B+"/",{waitUntil:"networkidle"});
 await click('.bpass a[href="/transfer"]');
 say((await url())==="/transfer","양도양수 배너 → 전문관",await url());
 await pg.goto(B+"/",{waitUntil:"networkidle"});
 await click('.bban-c:nth-child(1) > a');
 say((await url()).startsWith("/providers/"),"배너 → 분야 화면",await url());
 /* ⚠️ 업체찾기로 가는 길도 헤더에 있어야 합니다 (메뉴에서 빠지면
    160개 화면에서 길이 끊깁니다) */
 await pg.goto(B+"/",{waitUntil:"networkidle"});
 await click('.hd .gnb a[href="/providers"]');
 say((await url())==="/providers","헤더 서비스 · 상품 → 업체찾기",await url());
 /* ⚠️ 2026-10-11 간소화 지시서 §2-F — 파트너 입점 구간이 메인에서
    내려왔습니다. ⚠️⚠️ **최종 디자인 지시서 §2 로 헤더 CTA 도 "무료
    견적 신청"(`/quote`) 이 됐습니다** — 업체 입점은 이제 **푸터**가
    유일한 길입니다. 끝이 막히지 않았는지 거기서 눌러 봅니다. */
 await pg.goto(B+"/",{waitUntil:"networkidle"});
 await click('.ft a[href="/join"]');
 say((await url())==="/join","푸터 업체 입점 → 신청 화면",await url());
 /* §2-E — 메인에서 견적 · 상담으로 가는 길이 하나는 있어야 합니다 */
 await pg.goto(B+"/",{waitUntil:"networkidle"});
 await click('.bcta-go a[href="/quote"]');
 say((await url()).startsWith("/quote"),"마지막 구간 → 견적 · 상담 신청",await url());
 /* ⚠️ 히어로에서도 한 번 — 첫 화면에서 바로 신청할 수 있어야 합니다 */
 await pg.goto(B+"/",{waitUntil:"networkidle"});
 await click('.bhero-go a[href="/quote"]');
 say((await url()).startsWith("/quote"),"히어로 → 견적 · 상담 신청",await url());


 /* ══════════════════════════════════════════════════════════════
    §15 — 지시서가 "실제로 작동해야 한다" 고 적은 세 시나리오
    ══════════════════════════════════════════════════════════════
    ⚠️⚠️ 화면만 예쁘게 만들고 **끝이 막힌 길**을 남기지 않기 위한
    검사입니다. 이 저장소에서 영업 작업대의 끝(`/join`)이 잠긴 폼이던
    사고가 있었습니다 — 흐름을 만들면 그 흐름의 **끝이 열려 있는지**
    까지 눌러 봐야 합니다. */
 console.log("\n【6】 §15 세 시나리오 — 창업 · 운영 · 폐업");

 /* ① 창업 고객 — 카페 창업 → 로드맵 → 매장 오픈 패키지 → 신청 */
 await pg.goto(B+"/startup/cafe",{waitUntil:"networkidle"});
 say((await txt()).indexOf("카페")>=0,"창업 ① 카페 창업 화면이 열린다");
 const rmN=await pg.evaluate(()=>document.querySelectorAll(".pcs > li").length);
 say(rmN>=8,"창업 ② 로드맵 걸음이 나온다","지금 "+rmN);
 await pg.goto(B+"/startup",{waitUntil:"networkidle"});
 const pkN=await pg.evaluate(()=>document.querySelectorAll(".pkg-g > li").length);
 say(pkN>=1,"창업 ③ 창업 패키지가 나온다","지금 "+pkN);
 /* 인터넷 · POS · CCTV 가 실제로 그 패키지 안에 있는가 */
 const openHas=await pg.evaluate(()=>{
   const c=document.querySelector('.pkg-c[data-pk="open"]');
   if(!c) return "";
   return [...c.querySelectorAll('input[type="checkbox"]')].map(x=>x.value).join(",");});
 say(["store-internet","pos-card","cctv-security"].every(k=>openHas.indexOf(k)>=0),
   "창업 ④ 매장 오픈 패키지에 인터넷 · POS · CCTV 가 들어 있다",openHas);
 /* 둘을 빼면 링크가 **실제로 따라오는가** — 안 따라오면 고르신 것과
    다른 것이 넘어갑니다 */
 await pg.evaluate(()=>{
   const c=document.querySelector('.pkg-c[data-pk="open"]');
   const b=[...c.querySelectorAll('input[type="checkbox"]')];
   b[3].checked=false; b[3].dispatchEvent(new Event("change",{bubbles:true}));
   b[4].checked=false; b[4].dispatchEvent(new Event("change",{bubbles:true}));});
 await pg.waitForTimeout(150);
 const href3=await pg.evaluate(()=>document.getElementById("pkg-go-open").getAttribute("href"));
 /* ⚠️ 쉼표는 encodeURIComponent 가 **%2C 로 감습니다** — 날것 쉼표로
    기다렸다가 멀줦한 코드를 실패로 잡았습니다 — **검사가 틀렸습니다.**
    푸는 쪽(nowQS)은 되돌려 읽으므로 둘 다 받습니다. */
 const h3=decodeURIComponent(href3||"");
 say(/o=store-internet,pos-card,cctv-security(&|$)/.test(h3),
   "창업 ⑤ 체크를 뺀다 신청 링크가 따라온다",h3);
 await click('#pkg-go-open');
 say((await url()).startsWith("/quote"),"창업 ⑥ 패키지 → 신청 화면",await url());
 const q3=await pg.evaluate(()=>document.querySelectorAll(".qof-l > li").length);
 say(q3===3,"창업 ⑦ 신청 화면이 고른 상품 셋을 되읽는다","지금 "+q3);
 const what=await pg.evaluate(()=>(document.getElementById("q-what")||{}).value||"");
 say(what.indexOf("인터넷")>=0,"창업 ⑧ 필요한 일 칸이 미리 적혀 있다",what);

 /* ② 운영 고객 — 음식점 운영 → 포장재 · 청소 · 수리 → 상담 신청 */
 await pg.goto(B+"/operation?i=restaurant",{waitUntil:"networkidle"});
 const og=await pg.evaluate(()=>document.querySelectorAll(".opsv-g > li").length);
 say(og===6,"운영 ① 여섯 묶음이 나온다","지금 "+og);
 const op=await pg.evaluate(()=>[...document.querySelectorAll(".opsv-pick b")].map(x=>x.textContent.trim()));
 say(op.length>0 && /식자재|육류|수산/.test(op.slice(0,4).join(" ")),
   "운영 ② 음식점 것이 먼저 나온다",op.slice(0,4).join(" · "));
 await click('.opsv-g > li:nth-child(2) .opsv-l > li:nth-child(1) > a');
 say((await url()).startsWith("/providers/supply"),"운영 ③ 소모품 · 포장재 → 업체찾기",await url());
 await pg.goto(B+"/operation",{waitUntil:"networkidle"});
 const runHas=await pg.evaluate(()=>{
   const c=document.querySelector('.pkg-c[data-pk="run"]');
   return c?[...c.querySelectorAll('input[type="checkbox"]')].map(x=>x.value).join(","):"";});
 say(runHas.indexOf("equip-repair")>=0 && runHas.indexOf("regular-clean")>=0,
   "운영 ④ 운영 패키지에 수리 · 정기청소가 들어 있다",runHas);
 await click('#pkg-go-run');
 say((await url()).startsWith("/quote"),"운영 ⑤ 패키지 → 신청 화면",await url());

 /* ③ 폐업 고객 — 음식점 폐업 → 장비 매각 → 철거 · 원상복구 */
 await pg.goto(B+"/closure/restaurant",{waitUntil:"networkidle"});
 say((await txt()).indexOf("음식점")>=0,"폐업 ① 음식점 폐업 화면이 열린다");
 await pg.goto(B+"/closure",{waitUntil:"networkidle"});
 const clHas=await pg.evaluate(()=>{
   const c=document.querySelector('.pkg-c[data-pk="close"]');
   return c?[...c.querySelectorAll('.pkg-nm')].map(x=>x.textContent.trim()):[];});
 say(clHas.length>=4,"폐업 ② 폐업 정리 패키지가 나온다",clHas.join(" · "));
 /* ⚠️⚠️ **철거가 맨 앞이 아니어야 합니다** (§6-4) — 양도 · 매각이 먼저 */
 const firstTwo=clHas.slice(0,2).join(" ");
 say(!/철거|원상복구/.test(firstTwo),"폐업 ③ 철거가 맨 앞이 아니다",firstTwo);
 await click('#pkg-go-close');
 say((await url()).startsWith("/quote"),"폐업 ④ 패키지 → 신청 화면",await url());
 const side=await pg.evaluate(()=>(document.getElementById("q-side")||{}).value||"");
 say(side==="close","폐업 ⑤ 신청 화면이 폐업 쪽으로 열린다",side);

 console.log("\n【5】 콘솔 오류");
 say(errs.length===0,"JS 에러 없음",errs.join(" / "));
 console.log(bad?("\n❌ "+bad+"건 실패"):"\n✅ 흐름 전부 통과");
 await br.close(); srv.close(); process.exit(bad?1:0);
})();
