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
 /* ⚠️⚠️ **2026-10-17 창업 준비 §2 로 업종 고르개가 접혔습니다.**
    주인공이 **서비스 고르기**(§2-B)이고, 고르는 격자 둘이 나란히 있으면
    "같은 선택 영역의 반복" 입니다 (§11). 길은 그대로이고 **한 번 더
    누릅니다** — 단추에 "업종 고르기 (14개)" 라고 적혀 있습니다.
    ⚠️ `/startup/:업종` 열넷은 색인되어 있어서 **지우면 안 되는 길**
    입니다 (§15). 그래서 여기서 끝까지 눌러 봅니다. */
 await click('button[aria-controls="st-ind"]');
 say(await pg.evaluate(()=>getComputedStyle(document.getElementById("st-ind")).display)!=="none",
     "업종 고르개가 펼쳐진다");
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
 /* ⚠️ 2026-10-17 §9 — 히어로가 빠지고 **견적 신청 안내 카드**가
    그 자리를 받았습니다 (선택받는 이유 구간 오른쪽). 첫 화면에서
    멀지 않은 데서 바로 신청할 수 있어야 합니다. */
 await pg.goto(B+"/",{waitUntil:"networkidle"});
 await click('.bqc a[href="/quote"]');
 say((await url()).startsWith("/quote"),"견적 안내 카드 → 견적 · 상담 신청",await url());
 /* ⚠️ §12 — 계산도구 넷이 실제로 열려야 합니다 */
 await pg.goto(B+"/",{waitUntil:"networkidle"});
 await click('.bcal-g > li:nth-child(1) > a');
 say((await url()).startsWith("/tools/"),"계산도구 카드 → 계산기",await url());
 /* ⚠️ §13 — 이용 가이드가 실제 글로 열려야 합니다 */
 await pg.goto(B+"/",{waitUntil:"networkidle"});
 await click('.bgd-g > li:nth-child(1) > a');
 say((await url()).startsWith("/content/"),"이용 가이드 카드 → 글",await url());


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
 /* ⚠️⚠️ **2026-10-17 창업 준비 §11 로 패키지가 "담기" 가 됐습니다.**
    전에는 패키지 카드마다 **제 신청 단추**가 있어서, 서비스 고르개와
    합치면 "신청" 단추가 둘이었습니다 — 이번 지시서가 없애려는 것이
    그 헷갈림입니다 (§0 "무엇을 눌러야 하는지 즉시 알 수 있어야 한다").
    지금은 **위 선택에 담기만** 하고 신청은 한 자리에서 합니다.
    ⚠️ `PackBand()` 와 `packages.js` 는 한 글자도 안 건드렸습니다 —
    `/closure` · `/transfer` 가 전과 똑같이 씁니다 (§15). 【3】 이 그쪽을
    끝까지 눌러 봅니다. */
 await pg.goto(B+"/startup",{waitUntil:"networkidle"});
 await pg.evaluate(()=>{ try{ localStorage.clear(); }catch(e){} });
 await pg.reload({waitUntil:"networkidle"});
 const pkN=await pg.evaluate(()=>document.querySelectorAll(".pkp-g > li").length);
 say(pkN>=1,"창업 ③ 창업 묶음이 나온다","지금 "+pkN);
 /* 묶음이 **분류로** 담깁니다 — 상품 다섯이 분류 둘일 수 있습니다
    (인터넷 · POS · CCTV · 키오스크가 전부 it). 잃는 것은 없습니다 —
    신청 화면의 it 질문이 그 넷을 그대로 묻습니다. */
 const willAdd=await pg.evaluate(()=>{
   const c=[...document.querySelectorAll(".pkp-c")]
     .filter(x=>x.textContent.indexOf("매장 오픈")>=0)[0];
   return c ? (c.querySelector(".pkp-l")||{}).textContent||"" : "";});
 say(willAdd.indexOf("POS")>=0 || willAdd.indexOf("주방")>=0,
   "창업 ④ 매장 오픈 묶음에 무엇이 담기는지 이름으로 적혀 있다",willAdd);
 await pg.evaluate(()=>{
   const c=[...document.querySelectorAll(".pkp-c")]
     .filter(x=>x.textContent.indexOf("매장 오픈")>=0)[0];
   c.querySelector("button").click();});
 await pg.waitForTimeout(250);
 const addedN=await pg.evaluate(()=>document.querySelector("[data-pick-n]").textContent);
 say(+addedN>=2,"창업 ⑤ 묶음을 누르면 선택에 담긴다","지금 "+addedN);
 /* ⚠️ 두 번 눌러도 안 늘어납니다 (§3-2 중복 선택 방지) */
 await pg.evaluate(()=>{
   const c=[...document.querySelectorAll(".pkp-c")]
     .filter(x=>x.textContent.indexOf("매장 오픈")>=0)[0];
   c.querySelector("button").click();});
 await pg.waitForTimeout(250);
 say(await pg.evaluate(()=>document.querySelector("[data-pick-n]").textContent)===addedN,
   "창업 ⑤-b 두 번 눌러도 안 늘어난다");
 await click("#pk-bar-go");
 say((await url()).startsWith("/quote"),"창업 ⑥ 담은 것 → 신청 화면",await url());
 /* ⚠️ 보는 자리가 바뀌었습니다 — 상품 줄(`.qof-l`)이 아니라 **서비스
    줄**(`#q-svl`)입니다. 창업 쪽은 상품 id 가 아니라 **분류 key** 로
    담기기 때문입니다 (§6 "서비스 ID는 기존 서비스 데이터의 고유 ID"). */
 const q3=await pg.evaluate(()=>document.querySelectorAll("#q-svl > li").length);
 say(q3===2,"창업 ⑦ 신청 화면이 담은 둘을 되읽는다","지금 "+q3);
 const what=await pg.evaluate(()=>(document.getElementById("q-what")||{}).value||"");
 say(what.indexOf("인터넷")>=0,"창업 ⑧ 필요한 일 칸이 미리 적혀 있다",what);

 /* ② 운영 고객 — 2026-10-18 "매장 운영 전문관 2차" §16 시나리오 A~D
    ⚠️⚠️ **보는 자리가 통째로 바뀌었습니다.** 전에는 운영 서비스관
    여섯 묶음 · 업종별 차례 · 패키지를 눌러 봤는데, §2 가 "서비스를
    실제로 선택하는 영역은 페이지에서 하나만" 으로 정하면서 그 셋이
    내려왔습니다 — 검사가 틀린 것이 아니라 **화면이 바뀐 것**이라
    같이 옮깁니다 (이 저장소의 규칙입니다).
    ⚠️ 내려온 구간이 가리키던 분류는 대표 여덟 + 전체 서비스 보기가
    빠짐없이 받습니다 — `checkPickGroup()` 이 빌드마다 셉니다. */
 await pg.goto(B+"/operation",{waitUntil:"networkidle"});
 await pg.evaluate(()=>{ try{ localStorage.clear(); }catch(e){} });
 await pg.reload({waitUntil:"networkidle"});
 const osec=await pg.evaluate(()=>document.querySelectorAll("#view > section").length);
 say(osec===7,"운영 ① 일곱 영역이다 (§2)","지금 "+osec);
 const ogr=await pg.evaluate(()=>document.querySelectorAll(".opg-c").length);
 say(ogr===8,"운영 ② 대표 여덟이 나온다 (§4-2)","지금 "+ogr);
 await click(".opg-h");
 const osub=await pg.evaluate(()=>
   document.querySelectorAll(".opg-p:not([hidden]) .pks-r").length);
 say(osub>0,"운영 ③ 카드를 누르면 세부가 펼쳐진다 (§4-4)","지금 "+osub);
 await pg.evaluate(()=>{
   const b=[...document.querySelectorAll(".opg-p:not([hidden]) input[data-pick]")];
   b[0].click(); b[1].click(); });
 await pg.waitForTimeout(220);
 await click(".opg-g > li:nth-child(4) .opg-h");
 await pg.evaluate(()=>{
   const c=document.querySelectorAll(".opg-c")[3];
   c.querySelector("input[data-pick]").click(); });
 await pg.waitForTimeout(220);
 const on3=await pg.evaluate(()=>document.querySelectorAll("#pk-list > li").length);
 say(on3===3,"운영 ④ 카드 둘에 걸쳐 셋을 고른다 (§5-1)","지금 "+on3);
 await pg.reload({waitUntil:"networkidle"});
 const on3b=await pg.evaluate(()=>document.querySelectorAll("#pk-list > li").length);
 say(on3b===3,"운영 ⑤ 새로고침해도 고른 것이 남는다 (§5-3)","지금 "+on3b);
 await pg.evaluate(()=>{ const i=document.getElementById("pkf-q");
   i.value="세금"; i.dispatchEvent(new Event("input")); });
 await pg.waitForTimeout(220);
 const fnd=await pg.evaluate(()=>
   document.querySelectorAll("#pkb-find [data-pick-q]:not([hidden])").length);
 say(fnd>0,"운영 ⑥ '세금' 으로 찾으면 나온다 (§4-5)","지금 "+fnd);
 const ock=await pg.evaluate(()=>
   document.querySelectorAll(".ock-l:not(.is-fold-all) > li").length);
 say(ock===6,"운영 ⑦ 체크리스트 대표 여섯 (§9)","지금 "+ock);
 say((await txt()).indexOf("신청이 아닙니다")>=0,
   "운영 ⑧ 체크는 신청이 아니라고 적혀 있다 (§9 · 절대 규칙 5)");
 const ogo=await pg.evaluate(()=>{
   const a=document.getElementById("pk-bar-go");
   return a?a.getAttribute("href"):""; });
 say(ogo.indexOf("side=ops")>=0,"운영 ⑨ 신청 주소가 운영 쪽이다 (§7)",ogo);
 await pg.goto(B+ogo,{waitUntil:"networkidle"});
 const oq=await pg.evaluate(()=>document.querySelectorAll("#q-svl > li").length);
 say(oq===3,"운영 ⑩ 신청 화면이 고른 셋을 되읽는다 (§7-2)","지금 "+oq);
 const oside=await pg.evaluate(()=>(document.getElementById("q-side")||{}).value||"");
 say(oside==="ops","운영 ⑪ 무엇 때문에 = 운영 (§7-2)",oside);

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

 /* ════════════════════════════════════════════════════════════════
    【7】 2026-10-17 창업 준비 전문관 §16 — 시나리오 A ~ E
    ════════════════════════════════════════════════════════════════
    ⚠️⚠️ **실제로 눌러 봅니다.** 지시서가 "테스트할 수 없는 항목은
    완료로 표시하지 않는다" 고 적었습니다. 여기서 재는 것은 화면까지
    이고, DB 저장 · 관리자 접수는 `tools/test-sql.js`(246개) ·
    `tools/test-api.js`(96개) · `tools/test-admin.js`(253개)가 봅니다. */
 console.log("\n【7】 §16 시나리오 A ~ E — 고르고 · 담기고 · 한 번에");

 /* ── A. 단일 서비스 ─────────────────────────────────────────── */
 await pg.goto(B+"/startup",{waitUntil:"networkidle"});
 await pg.evaluate(()=>{ try{ localStorage.clear(); }catch(e){} });
 await pg.reload({waitUntil:"networkidle"});
 await click('[data-pick="interior"]');
 say(await pg.evaluate(()=>document.querySelector("[data-pick-n]").textContent)==="1",
     "A① 인테리어 하나를 고르면 1 로 센다");
 await click("#pk-bar-go");
 say(/^\/quote/.test(await url()),"A② 신청 화면으로 간다",await url());
 say(await pg.evaluate(()=>document.querySelectorAll("#q-svl > li").length)===1,
     "A③ 고른 하나가 그대로 적혀 있다");
 await pg.selectOption("#q-reg","gyeonggi");
 await pg.fill("#q-name","홍길동"); await pg.fill("#q-tel","010-1234-5678");
 await pg.fill("#q-q","20평 카페 인테리어입니다");
 await pg.check("#q-ag");
 /* ⚠️ 실제로 보내지는 않습니다 — 접수처가 꺼져 있고, 켜져 있어도
    운영자에게 시험 접수를 보내면 안 됩니다. **보낼 몸통**을 재 봅니다. */
 const bodyA = await pg.evaluate(()=>{
   let got=null; const real=window.amSend;
   window.amSend=(id,b)=>{ got=b; return false; };
   window.quoteSend(new Event("submit"));
   window.amSend=real; return got;
 });
 say(!!bodyA && bodyA.items && bodyA.items.length===1 && bodyA.items[0].id==="interior",
     "A④ 항목 하나로 보낸다", bodyA && JSON.stringify(bodyA.items));
 say(!!bodyA && bodyA.agree===true && !!bodyA.idem,
     "A⑤ 동의와 멱등 열쇠가 실린다");

 /* ── B. 복수 서비스 — 하나의 신청서 ──────────────────────────── */
 await pg.goto(B+"/startup",{waitUntil:"networkidle"});
 await pg.evaluate(()=>{ try{ localStorage.clear(); }catch(e){} });
 await pg.reload({waitUntil:"networkidle"});
 for(const id of ["interior","equip","it"]){
   /* ⚠️⚠️ **있는지가 아니라 보이는지**를 봐야 합니다. 접힌 목록도
      DOM 에는 그대로 있어서, 있는지만 보면 펼치는 단추를 안 누르고
      "안 보이는 것을 누르려다" 30초 뒤에 터집니다 (재서 알았습니다). */
   const seen=await pg.evaluate(k=>{
     const e=document.querySelector('[data-pick="'+k+'"]');
     return !!e && e.getBoundingClientRect().width > 0; },id);
   if(!seen) await click('button[aria-controls="st-rest"]');
   await click('[data-pick="'+id+'"]');
 }
 say(await pg.evaluate(()=>document.querySelectorAll("#pk-list > li").length)===3,
     "B① 셋이 한 바구니에 담긴다");
 await click("#pk-bar-go");
 say(await pg.evaluate(()=>document.querySelectorAll("#q-svl > li").length)===3,
     "B② 신청 화면이 셋을 되읽는다");
 /* ⚠️⚠️ **공통 정보는 한 번만** (§5-4) — 성함 · 연락처 칸이 하나여야 합니다 */
 say(await pg.evaluate(()=>document.querySelectorAll("#q-name").length)===1 &&
     await pg.evaluate(()=>document.querySelectorAll("#q-tel").length)===1,
     "B③ 공통 칸은 한 벌뿐이다 (같은 것을 세 번 안 묻습니다)");
 say(await pg.evaluate(()=>document.querySelectorAll(".rqf").length)===3,
     "B④ 서비스마다 다른 질문만 따로 열린다");
 await pg.selectOption("#q-reg","gyeonggi");
 await pg.fill("#q-name","홍길동"); await pg.fill("#q-tel","010-1234-5678");
 await pg.fill("#q-q","카페 하나 엽니다"); await pg.check("#q-ag");
 const bodyB = await pg.evaluate(()=>{
   let got=null; const real=window.amSend;
   window.amSend=(id,b)=>{ got=b; return false; };
   window.quoteSend(new Event("submit"));
   window.amSend=real; return got;
 });
 say(!!bodyB && bodyB.items.length===3,"B⑤ 신청서 하나에 항목 셋으로 간다",
     bodyB && bodyB.items.length);
 say(!!bodyB && bodyB.items.map(x=>x.id).join(",")==="interior,equip,it",
     "B⑥ 항목 id 가 분류 key 다 (이름이 아닙니다)",
     bodyB && bodyB.items.map(x=>x.id).join(","));

 /* ── C. 임시저장 → 이동 → 복구 → 수정 ────────────────────────── */
 await pg.fill("#q-gu","안양시"); await pg.fill("#q-py","20");
 await pg.evaluate(()=>window.quoteDraftSave());
 say(await pg.evaluate(()=>!!localStorage.getItem("am.draft.v1")),"C① 조건이 저장된다");
 /* ⚠️⚠️ **성함 · 연락처 · 자세한 내용은 안 담깁니다** (§4-1) */
 const raw = await pg.evaluate(()=>localStorage.getItem("am.draft.v1")||"");
 say(raw.indexOf("홍길동")<0 && raw.indexOf("1234-5678")<0 && raw.indexOf("카페 하나")<0,
     "C② 개인정보는 브라우저에 안 담긴다");
 await pg.goto(B+"/content",{waitUntil:"networkidle"});
 await pg.goto(B+"/quote?side=start",{waitUntil:"networkidle"});
 say(await pg.evaluate(()=>document.querySelectorAll("#q-svl > li").length)===3,
     "C③ 다시 와도 고른 셋이 살아 있다");
 await pg.evaluate(()=>window.quoteDraftLoad());
 say(await pg.evaluate(()=>document.getElementById("q-gu").value)==="안양시",
     "C④ 저장한 조건을 불러온다");
 await pg.fill("#q-gu","군포시");
 say(await pg.evaluate(()=>document.getElementById("q-gu").value)==="군포시",
     "C⑤ 불러온 뒤에도 고칠 수 있다");
 await pg.evaluate(()=>window.quoteDraftDel&&0);   /* confirm 이 떠서 직접 지웁니다 */
 await pg.evaluate(()=>{ try{ localStorage.removeItem("am.draft.v1"); }catch(e){} });

 /* ── D. 오류 대응 ────────────────────────────────────────────── */
 await pg.goto(B+"/quote?side=start&sv=interior",{waitUntil:"networkidle"});
 const miss = await pg.evaluate(()=>{
   let got="sent"; const real=window.amSend;
   window.amSend=()=>{ got="sent"; return false; };
   document.getElementById("q-ag").checked=true;
   got="blocked"; window.quoteSend(new Event("submit"));
   window.amSend=real; return got;
 });
 say(miss==="blocked","D① 필수값이 비면 안 보낸다");
 /* ⚠️ 잘못된 연락처 (§8) */
 await pg.selectOption("#q-reg","gyeonggi");
 await pg.fill("#q-name","홍"); await pg.fill("#q-tel","123");
 await pg.fill("#q-q","내용"); await pg.check("#q-ag");
 const badTel = await pg.evaluate(()=>{
   let sent=false; const real=window.amSend;
   window.amSend=()=>{ sent=true; return false; };
   window.quoteSend(new Event("submit"));
   window.amSend=real; return sent;
 });
 say(badTel===false,"D② 잘못된 연락처를 막는다");
 /* ⚠️⚠️ **연속 클릭** — 같은 신청서면 멱등 열쇠가 같아야 합니다 */
 await pg.fill("#q-tel","010-1234-5678");
 const twice = await pg.evaluate(()=>{
   const out=[]; const real=window.amSend;
   window.amSend=(id,b)=>{ out.push(b.idem); return false; };
   window.quoteSend(new Event("submit"));
   window.quoteSend(new Event("submit"));
   window.amSend=real; return out;
 });
 say(twice.length===2 && twice[0]===twice[1] && !!twice[0],
     "D③ 두 번 눌러도 같은 멱등 열쇠다 (중복 접수 방지)", twice.join(" / "));
 /* ⚠️ 뒤로 가기 — 적은 값이 남아 있어야 합니다 (§9-4) */
 await pg.goto(B+"/startup",{waitUntil:"networkidle"});
 await pg.goBack({waitUntil:"networkidle"});
 say(await pg.evaluate(()=>document.querySelectorAll("#q-svl > li").length)>=1,
     "D④ 뒤로 와도 고른 것이 남아 있다");

 /* ── E. 처음 오신 분이 설명 없이 할 수 있는가 ─────────────────── */
 await pg.goto(B+"/startup",{waitUntil:"networkidle"});
 await pg.evaluate(()=>{ try{ localStorage.clear(); }catch(e){} });
 await pg.reload({waitUntil:"networkidle"});
 const t = await txt();
 say(t.indexOf("여러 개를 함께 고르실 수 있습니다")>=0,
     "E① 여러 개를 고를 수 있다고 적혀 있다");
 say(t.indexOf("고르기만 하면")>=0 && t.indexOf("접수됩니다")>=0,
     "E② 고르는 것과 신청하는 것을 갈라서 말한다");
 /* ⚠️ 단추 글씨에 **무엇이 일어나는지**가 적혀 있어야 합니다 (§9-2) */
 await click('[data-pick="interior"]');
 await click('[data-pick="equip"]');
 const go2t = await pg.evaluate(()=>document.querySelector("#pk-bar-go span").textContent);
 say(/선택한 2개 서비스 견적 신청하기/.test(go2t),"E③ 단추에 개수와 할 일이 적힌다",go2t);
 /* 잘못 고른 것을 뺄 수 있는가 */
 await click('#pk-list button[onclick*="equip"]');
 say(await pg.evaluate(()=>document.querySelector("[data-pick-n]").textContent)==="1",
     "E④ 잘못 고른 것을 뺄 수 있다");
 await pg.evaluate(()=>{ try{ localStorage.clear(); }catch(e){} });

 console.log("\n【5】 콘솔 오류");
 say(errs.length===0,"JS 에러 없음",errs.join(" / "));
 console.log(bad?("\n❌ "+bad+"건 실패"):"\n✅ 흐름 전부 통과");
 await br.close(); srv.close(); process.exit(bad?1:0);
})();
