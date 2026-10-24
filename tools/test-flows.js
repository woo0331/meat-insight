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
 /* ⚠️⚠️ **신청 단추가 폭마다 다른 자리에 있습니다** (2026-10-20
    시안 2 · 3). 1100px 위에서는 오른쪽 고정 패널(`#pka-go`)이고,
    그 아래에서는 하단 고정 띠(`#pk-bar-go`)입니다 — 둘을 동시에
    내면 한 화면에 같은 단추가 둘입니다. **보이는 쪽**을 고릅니다. */
 const pickGoSel=async()=>pg.evaluate(()=>{
   const vis=e=>e&&!e.hidden&&e.getClientRects().length>0&&
     getComputedStyle(e).display!=="none";
   if(vis(document.getElementById("pka-go")))    return "#pka-go";
   if(vis(document.getElementById("pk-bar-go"))) return "#pk-bar-go";
   return "#pk-go-on";
 });
 const pickGo=async()=>{ await click(await pickGoSel()); };
 const pickGoAttr=async(a)=>pg.getAttribute(await pickGoSel(), a);
 const pickGoTxt=async()=>pg.evaluate(sel=>
   (document.querySelector(sel+" span")||{}).textContent||"", await pickGoSel());

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
 await click('.bent-c.ent-transfer a[href="/transfer"]');
 say((await url())==="/transfer","양도양수 배너 → 전문관",await url());
 await pg.goto(B+"/",{waitUntil:"networkidle"});
 /* ⚠️⚠️ **2026-10-22 — 서비스 배너 둘이 메인에서 내려왔습니다**
    (사장님 시안). 그 길은 ③ 직접 서비스 찾기 여덟이 그대로 받습니다 —
    함수는 안 지웠으니 되살리시면 여기에 .bban-c 를 다시 넣으세요. */
 await click('.bdir-c:nth-child(1)');
 say((await url()).startsWith("/providers/"),"직접 찾기 → 분야 화면",await url());
 /* ⚠️⚠️ **2026-10-22 §2 — 히어로가 메인에서 다시 빠졌습니다.**
    그래서 `.bhero-go` 를 누를 수 없습니다 (없는 요소를 집으면
    타임아웃으로 터지고 뒤 블록이 통째로 안 돕니다). 메인에서 신청으로
    가는 **늘 보이는 길**은 헤더 CTA 이고, 그건 160개 화면 전부에
    있습니다 — 그쪽을 눌러 봅니다. 히어로를 되살리시면 그날 여기에
    `.bhero-go` 를 다시 넣으세요. */
 await pg.goto(B+"/",{waitUntil:"networkidle"});
 await click('.hd .hd-cta');
 say((await url()).startsWith("/quote"),"헤더 견적 신청 → 신청 화면",await url());
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
 await pickGo();
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
 const ogo=await pickGoAttr("href");
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
 await pg.evaluate(()=>{ try{ localStorage.clear(); }catch(e){} });
 await pg.reload({waitUntil:"networkidle"});
 /* ⚠️⚠️ **2026-10-18 전체 점검 §3 으로 폐업이 공통 프레임이 됐습니다.**
    패키지가 "신청" 에서 **"위 선택에 담기"** 로 바뀌었습니다 — 한
    화면에 신청 단추가 둘이면 어디서 보내는지가 묻힙니다 (§2 · §5).
    그래서 재는 자리가 `.pkg-*`(옛 패키지 카드) 에서 `.pkp-*`(담는
    카드)로 옮겨졌습니다 — **검사가 틀린 것이 아니라 화면이 바뀐
    것**입니다. 지키는 것(철거가 맨 앞이 아니다)은 그대로입니다. */
 const clHas=await pg.evaluate(()=>
   [...document.querySelectorAll(".pkp-g .pkp-n")].map(x=>x.textContent.trim()));
 say(clHas.length>=1,"폐업 ② 폐업 정리 묶음이 나온다",clHas.join(" · "));
 /* ⚠️⚠️ **철거가 맨 앞이 아니어야 합니다** (§6-4) — 양도 · 매각이 먼저 */
 const clFirst=await pg.evaluate(()=>{
   const l=document.querySelector(".pkp-g .pkp-l");
   return l?l.textContent.trim():"";});
 say(!/^\s*(철거|원상복구)/.test(clFirst),"폐업 ③ 철거가 맨 앞이 아니다",clFirst);
 /* ④ 담으면 위 선택에 쌓입니다 (신청 단추는 바구니 하나뿐입니다) */
 await click('.pkp-g button');
 const clN=await pg.evaluate(()=>(document.querySelector("[data-pick-n]")||{}).textContent||"");
 say(Number(clN)>0,"폐업 ④ 묶음을 누르면 위 선택에 담긴다","지금 "+clN);
 const clGo=await pickGoAttr("href");
 say((clGo||"").indexOf("side=close")>=0,"폐업 ⑤ 신청 주소가 폐업 쪽이다",clGo);
 await pickGo();
 say((await url()).startsWith("/quote"),"폐업 ⑥ 신청 화면으로 간다",await url());
 const side=await pg.evaluate(()=>(document.getElementById("q-side")||{}).value||"");
 say(side==="close","폐업 ⑦ 신청 화면이 폐업 쪽으로 열린다",side);
 await pg.evaluate(()=>{ try{ localStorage.clear(); }catch(e){} });

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
 await pickGo();
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
 /* ⑱ 진행 안내 (2026-10-22 P2) — ⚠️⚠️ **선택**이고 기본은 꺼짐입니다.
    안 고르셔도 접수는 그대로 되고, 안 고른 것이 `false` 로 갑니다. */
 say(!!bodyA && bodyA.notify===false,
     "A-알림① 안 고르면 꺼진 채로 간다", bodyA && bodyA.notify);
 say(await pg.evaluate(()=>{
       const el=document.getElementById("q-nt");
       return !!el && el.required!==true && !el.checked;
     }), "A-알림② 칸이 선택이고 기본으로 꺼져 있다");
 /* ⚠️⚠️ 접수 동의(제15조)와 **다른 칸**이어야 합니다 — 한 상자에 묶으면
    "이것도 켜야 접수되나" 가 되고, 그렇게 받은 동의는 받은 것이
    아닙니다. */
 say(await pg.evaluate(()=>{
       const el=document.getElementById("q-nt");
       return !!el && !el.closest(".agree");
     }), "A-알림③ 접수 동의 상자 안에 들어 있지 않다");
 /* ⚠️⚠️ 광고를 섞지 않습니다 (정보통신망법 제50조) */
 say(await pg.evaluate(()=>{
       const el=document.getElementById("q-nt");
       const t=el?el.parentElement.textContent:"";
       return /광고는 보내지 않/.test(t) && /회신/.test(t) &&
              !/시간 안에|당일|보장/.test(t);
     }), "A-알림④ 광고를 안 보낸다고 적고 끄는 길을 적는다");
 await pg.check("#q-nt");
 const bodyN = await pg.evaluate(()=>{
   let got=null; const real=window.amSend;
   window.amSend=(id,b)=>{ got=b; return false; };
   window.quoteSend(new Event("submit"));
   window.amSend=real; return got;
 });
 say(!!bodyN && bodyN.notify===true, "A-알림⑤ 고르면 켜진 채로 간다",
     bodyN && bodyN.notify);
 await pg.uncheck("#q-nt");

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
 await pickGo();
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
 const go2t = await pickGoTxt();
 say(/선택한 2개 서비스 견적 신청하기/.test(go2t),"E③ 단추에 개수와 할 일이 적힌다",go2t);
 /* 잘못 고른 것을 뺄 수 있는가 */
 await click('#pk-list button[onclick*="equip"]');
 say(await pg.evaluate(()=>document.querySelector("[data-pick-n]").textContent)==="1",
     "E④ 잘못 고른 것을 뺄 수 있다");
 await pg.evaluate(()=>{ try{ localStorage.clear(); }catch(e){} });

 /* ════════════════════════════════════════════════════════════════
    【8】 2026-10-18 전체 점검 §20 — 시나리오 A ~ D · H
    ════════════════════════════════════════════════════════════════
    > §20 — "실제 구현되어 있지 않은 기능은 테스트 성공으로 처리하지
    >  않는다."

    ⚠️⚠️ **E · F · G 는 여기서 돌리지 않습니다.** 셋 다 로그인이
    필요한데 `/api/session` 이 `auth:false` 라 화면이 그 구간째 안
    그립니다 — 돌려서 "통과" 로 적으면 그게 하지 않은 일을 했다고
    말하는 것입니다 (절대 규칙 5). 서버층과 DB 는 `tools/test-auth.js`
    (202개) · `tools/test-sql.js` · `tools/test-admin.js` 가 봅니다.
    ⚠️ 주석에 백틱을 쓰지 마세요. */
 console.log("\n【8】 §20 시나리오 A ~ D · H — 네 전문관을 같은 차례로");

 /* 전문관 넷을 **같은 순서로** 눌러 봅니다 — 고르기 → 담기기 →
    한 번에 신청 → 신청 화면이 그 쪽으로 열리는가 → 항목이 그대로
    실리는가. ⚠️ 하나라도 다르면 §3 프레임 통일이 깨진 것입니다. */
 const HALLS = [
   ["A", "창업 준비",     "/startup",   "start",    3],
   ["B", "매장 운영",     "/operation", "ops",      4],
   ["C", "폐업 정리",     "/closure",   "close",    3],
   ["D", "양도양수",      "/transfer",  "transfer", 2]
 ];
 for(const [no, name, path, side, want] of HALLS){
   await pg.goto(B+path,{waitUntil:"networkidle"});
   await pg.evaluate(()=>{ try{ localStorage.clear(); }catch(e){} });
   await pg.reload({waitUntil:"networkidle"});
   /* ① 묶음을 펼쳐 보이는 체크칸을 모읍니다
      ⚠️⚠️ **있는지가 아니라 보이는지**입니다 — 접힌 목록도 DOM 에는
      그대로 있어서, 있는지만 보면 안 보이는 것을 누르려다 터집니다. */
   await pg.evaluate(()=>{
     document.querySelectorAll('.opg-g [aria-expanded="false"]')
       .forEach(function(b){ try{ b.click(); }catch(e){} });
   });
   await pg.waitForTimeout(260);
   const ck = await pg.$$("#view input.pk-ck:visible");
   say(ck.length >= want, no+"① "+name+" — 고를 수 있는 칸이 "+want+"개 이상", ck.length+"개");
   for(let i = 0; i < want && i < ck.length; i++) await ck[i].click();
   await pg.waitForTimeout(160);
   const n = await pg.evaluate(()=>(document.querySelector("[data-pick-n]")||{}).textContent||"");
   say(n === String(want), no+"② 고른 "+want+"개를 그대로 센다", n);
   /* ② 한 번에 신청 — 폰 고정 띠의 주소에 쪽과 고른 것이 실립니다 */
   const href = await pickGoAttr("href");
   say((href||"").indexOf("side="+side) >= 0, no+"③ 신청 주소의 쪽이 "+side+" 다", href);
   await pickGo();
   say(/^\/quote/.test(await url()), no+"④ 신청 화면으로 간다", await url());
   const got = await pg.evaluate(()=>({
     side: (document.getElementById("q-side")||{}).value||"",
     n: document.querySelectorAll("#q-svl > li").length
   }));
   say(got.side === side, no+"⑤ 신청 화면이 "+side+" 쪽으로 열린다", got.side);
   say(got.n === want, no+"⑥ 고른 "+want+"개가 그대로 적혀 있다", String(got.n));
   /* ③ 보낼 몸통 — ⚠️ 실제로 보내지 않습니다 (운영자에게 시험 접수가
      갑니다). 항목이 하나로 묶여 가는지와 상황 칸이 맞는지를 봅니다. */
   await pg.selectOption("#q-reg","gyeonggi");
   await pg.fill("#q-name","홍길동"); await pg.fill("#q-tel","010-1234-5678");
   await pg.fill("#q-q","검사용 내용입니다");
   await pg.check("#q-ag");
   const body = await pg.evaluate(()=>{
     let got=null; const real=window.amSend;
     window.amSend=(id,b)=>{ got=b; return false; };
     window.quoteSend(new Event("submit"));
     window.amSend=real; return got;
   });
   say(!!body && body.items && body.items.length === want,
       no+"⑦ 한 신청서에 항목 "+want+"개로 간다",
       body && body.items ? body.items.length+"개" : "안 보냈습니다");
   say(!!body && body.side === side, no+"⑧ 보낼 쪽이 "+side+" 다", body && body.side);
   /* ⚠️⚠️ **접수 글의 "상황" 칸** — 전에 close 가 아니면 전부
      "창업 · 시작" 이라 운영 · 양도양수가 창업으로 나갔습니다.
      받아 보는 직원이 그것을 보고 엉뚱한 업체를 찾습니다. */
   const says = body && body.detail && body.detail["상황"];
   const WANT_SAY = { start:"창업 · 시작", ops:"운영",
                      transfer:"인수 · 양도", close:"폐업 · 정리" };
   say(says === WANT_SAY[side],
       no+"⑨ 접수 글의 상황 칸이 "+WANT_SAY[side]+" 다", says);
   await pg.evaluate(()=>{ try{ localStorage.clear(); }catch(e){} });
 }

 /* ── H. 모바일 — 390px 에서 넷을 다시 ────────────────────────── */
 await pg.setViewportSize({ width:390, height:844 });
 for(const [no, name, path, side, want] of HALLS){
   await pg.goto(B+path,{waitUntil:"networkidle"});
   await pg.evaluate(()=>{ try{ localStorage.clear(); }catch(e){} });
   await pg.reload({waitUntil:"networkidle"});
   await pg.evaluate(()=>{
     document.querySelectorAll('.opg-g [aria-expanded="false"]')
       .forEach(function(b){ try{ b.click(); }catch(e){} });
   });
   await pg.waitForTimeout(260);
   const ck = await pg.$$("#view input.pk-ck:visible");
   if(ck.length) await ck[0].click();
   await pg.waitForTimeout(200);
   /* ⚠️⚠️ **고정 띠가 실제로 보이는지**를 봅니다. 이 저장소는
      display:flex 인 칸에 hidden 을 걸어 **속성은 붙었는데 안
      가려지는** 사고를 겪었습니다.
      ⚠️⚠️ **`offsetParent` 로 보지 마세요.** 이 띠는
      `position:fixed` 라 보이든 안 보이든 **늘 null** 입니다 —
      그걸로 재서 넷 다 "안 보입니다" 가 나왔고 **검사가
      틀렸습니다.** 그릴 상자가 있는지(`getClientRects`)와
      display 를 같이 봅니다. */
   const bar = await pg.evaluate(()=>{
     const b=document.getElementById("pk-bar");
     if(!b) return "없음";
     const cs=getComputedStyle(b);
     if(cs.display==="none" || cs.visibility==="hidden" || !b.getClientRects().length)
       return "안 보입니다 (display " + cs.display + ")";
     const r=b.getBoundingClientRect();
     if(r.bottom <= 0 || r.top >= innerHeight) return "화면 밖입니다";
     return Math.round(r.height) >= 40 ? "보입니다 h"+Math.round(r.height) : "너무 낮습니다 h"+Math.round(r.height);
   });
   say(/^보입니다/.test(bar), "H "+name+" — 폰에서 고정 띠가 보인다", bar);
   /* 가로 스크롤 */
   const over = await pg.evaluate(()=>document.documentElement.scrollWidth - document.documentElement.clientWidth);
   say(over <= 0, "H "+name+" — 390px 에서 가로 스크롤이 없다", over+"px");
   await pickGo();
   say(/^\/quote/.test(await url()), "H "+name+" — 폰에서 신청까지 간다", await url());
   await pg.evaluate(()=>{ try{ localStorage.clear(); }catch(e){} });
 }
 await pg.setViewportSize({ width:1280, height:900 });

 /* ══════════════════════════════════════════════════════════════
    【9】 2026-10-20 지시서 PART 18 — 시나리오 열
    ══════════════════════════════════════════════════════════════
    ⚠️⚠️ **보내지는 않습니다.** 접수처가 켜져 있어도 운영자에게
    시험 접수를 보내면 안 됩니다 — 고르고 · 담기고 · 신청 화면이
    되읽는 데까지 봅니다.
    ⚠️ 시나리오 10(관리자)은 로그인이 꺼져 있어 **여기서 못 봅니다** —
    `tools/test-admin.js` 가 가짜 서버로 봅니다. 테스트했다고
    보고하지 않습니다 (PART 18 "실제 테스트가 불가능한 항목은
    테스트했다고 보고하지 않는다"). */
 console.log("\n【9】 PART 18 시나리오");
 await pg.setViewportSize({ width:1440, height:900 });
 const pickN = () => pg.evaluate(()=>{
   try{ var o = JSON.parse(localStorage.getItem("am.pick.v1")||"{}");
        return (o.ids||[]).length; }catch(e){ return -1; } });
 const clear = () => pg.evaluate(()=>{ try{ localStorage.clear(); }catch(e){} });

 /* 시나리오 1 — 창업에서 카페를 고르고 둘을 담아 신청까지 */
 await clear();
 await pg.goto(B+"/startup?i=cafe",{waitUntil:"networkidle"});
 await pg.waitForTimeout(400);
 const s1h = await pg.evaluate(()=>{
   const h = document.querySelector(".stB h2");
   return h ? h.textContent.trim() : ""; });
 say(/카페/.test(s1h), "1 창업 — 업종을 고르면 그 업종 것이 앞에 선다", s1h);
 let cks = await pg.$$(".stB .pk-g .pk-ck");
 if(cks.length > 1){ await cks[0].check(); await cks[1].check(); }
 await pg.waitForTimeout(350);
 say(await pickN() === 2, "1 창업 — 둘이 담긴다", String(await pickN()));
 await pg.goto(B+"/quote",{waitUntil:"networkidle"});
 await pg.waitForTimeout(600);
 const s1q = await pg.evaluate(()=>
   document.querySelectorAll("#rq-pick li, .qp-c, .rq-sv li").length);
 say(/^\/quote/.test(await url()), "1 창업 — 신청 화면까지 간다", await url());

 /* 시나리오 2 — 운영에서 하나만 */
 await clear();
 await pg.goto(B+"/operation",{waitUntil:"networkidle"});
 await pg.waitForTimeout(400);
 const o1 = await pg.$$(".pkq .pk-ck");
 say(o1.length === 6, "2 운영 — 첫 화면에 빠른 선택 여섯이 보인다", o1.length+"개");
 if(o1.length) await o1[0].check();
 await pg.waitForTimeout(350);
 say(await pickN() === 1, "2 운영 — 하나만 담긴다", String(await pickN()));

 /* 시나리오 3 — 폐업에서 둘, 그리고 두 경로 */
 await clear();
 await pg.goto(B+"/closure",{waitUntil:"networkidle"});
 await pg.waitForTimeout(400);
 const cp = await pg.evaluate(()=>document.querySelectorAll(".clp-c").length);
 say(cp === 2, "3 폐업 — 이용 경로 둘을 먼저 고르게 한다", cp+"개");
 const c1 = await pg.$$(".pkq .pk-ck");
 if(c1.length > 1){ await c1[0].check(); await c1[1].check(); }
 await pg.waitForTimeout(350);
 say(await pickN() === 2, "3 폐업 — 둘이 담긴다", String(await pickN()));
 await pg.goto(B+"/closure?p=all",{waitUntil:"networkidle"});
 await pg.waitForTimeout(400);
 const allFirst = await pg.evaluate(()=>{
   const ss = [].slice.call(document.querySelectorAll("#view > section"));
   const i = ss.findIndex(x=>x.querySelector(".wnt"));
   const j = ss.findIndex(x=>x.classList.contains("pkb-sel"));
   return (i >= 0 && j >= 0) ? (i < j) : false; });
 say(allFirst, "3 폐업 — 전체 절차를 고르면 절차가 먼저 온다");

 /* 시나리오 4 — 양도양수 두 경로 */
 for(const [q, want, no] of [["", "매장 인수하기", "/sell"],
                             ["?t=out", "내 매장 내놓기", "/stores"]]){
   await pg.goto(B+"/transfer"+q,{waitUntil:"networkidle"});
   await pg.waitForTimeout(400);
   const m = await pg.evaluate(()=>
     [].slice.call(document.querySelectorAll(".aq-m b")).map(b=>b.textContent.trim()));
   say(m[0] === want, "4 양도양수"+(q||"(인수)")+" — 그 쪽 메뉴가 먼저 온다", m.join(" · "));
 }

 /* 시나리오 5 — 전문관을 옮겨도 선택이 남는다 */
 await clear();
 await pg.goto(B+"/startup",{waitUntil:"networkidle"});
 await pg.waitForTimeout(400);
 cks = await pg.$$(".stB .pk-g .pk-ck");
 if(cks.length) await cks[0].check();
 await pg.waitForTimeout(300);
 const n5 = await pickN();
 for(const r of ["/operation","/closure","/transfer","/tools/cost"]){
   await pg.goto(B+r,{waitUntil:"networkidle"});
   await pg.waitForTimeout(350);
   say(await pickN() === n5, "5 "+r+" 로 옮겨도 선택이 남는다", String(await pickN()));
 }

 /* 시나리오 6 — 새로고침 · 뒤로 가기 */
 await pg.reload({waitUntil:"networkidle"});
 await pg.waitForTimeout(350);
 say(await pickN() === n5, "6 새로고침 뒤에도 남는다", String(await pickN()));
 await pg.goBack({waitUntil:"networkidle"});
 await pg.waitForTimeout(350);
 say(await pickN() === n5, "6 뒤로 가도 남는다", String(await pickN()));

 /* 시나리오 7 — 계산도구에서 관련 서비스로 */
 await clear();
 await pg.goto(B+"/tools/cost",{waitUntil:"networkidle"});
 await pg.waitForTimeout(400);
 const est = await pg.evaluate(()=>!!document.querySelector(".tl-est"));
 say(est, "7 계산도구 — 추정치라고 적는다");
 const t1 = await pg.$$("#pick .pk-ck");
 say(t1.length > 1, "7 계산도구 — 결과 아래에서 바로 고를 수 있다", t1.length+"개");
 if(t1.length) await t1[0].check();
 await pg.waitForTimeout(350);
 say(await pickN() === 1, "7 계산도구 — 같은 바구니에 담긴다", String(await pickN()));

 /* 시나리오 8 — 가이드 검색 · FAQ 아코디언 */
 await pg.goto(B+"/content",{waitUntil:"networkidle"});
 await pg.waitForTimeout(400);
 const tabs = await pg.evaluate(()=>document.querySelectorAll(".chip-g-fil .chip").length);
 say(tabs === 5, "8 가이드 — 탭이 다섯이다", tabs+"개");
 await pg.fill("#ct-q", "권리금");
 await pg.waitForTimeout(300);
 const cf = await pg.evaluate(()=>({
   v: document.querySelectorAll(".ct-l > li:not([hidden])").length,
   a: document.querySelectorAll(".ct-l > li").length }));
 say(cf.v > 0 && cf.v < cf.a, "8 가이드 — 검색이 실제로 거른다", cf.v+"/"+cf.a);
 await pg.goto(B+"/faq",{waitUntil:"networkidle"});
 await pg.waitForTimeout(400);
 say(await pg.evaluate(()=>document.querySelectorAll(".faq-a:not([hidden])").length) === 0,
     "8 FAQ — 처음에는 답이 접혀 있다");
 await click(".faq-q");
 say(await pg.evaluate(()=>document.querySelectorAll(".faq-a:not([hidden])").length) === 1,
     "8 FAQ — 누르면 하나가 펴진다");

 /* 시나리오 9 — 폰에서 고정 띠로 신청까지 (【8】 이 네 전문관에서
    이미 봅니다 — 여기서는 계산도구에서 넘어온 길을 봅니다) */
 await pg.setViewportSize({ width:390, height:844 });
 await pg.goto(B+"/tools/cost",{waitUntil:"networkidle"});
 await pg.waitForTimeout(400);
 const bar9 = await pg.evaluate(()=>{
   const b = document.getElementById("pk-bar");
   if(!b) return "없음";
   const cs = getComputedStyle(b);
   if(cs.display === "none" || !b.getClientRects().length) return "안 보입니다";
   return "보입니다"; });
 say(bar9 === "보입니다", "9 폰 — 계산도구에서도 고정 띠가 보인다", bar9);
 const over9 = await pg.evaluate(()=>
   document.documentElement.scrollWidth - document.documentElement.clientWidth);
 say(over9 <= 0, "9 폰 — 계산도구에 가로 스크롤이 없다", over9+"px");
 await clear();
 await pg.setViewportSize({ width:1280, height:900 });

 /* ══════════════════════════════════════════════════════════════
    【10】 새로고침하면 맨 위에서 시작합니다 (2026-10-21 사장님 지시)

    ⚠️⚠️ **전수 점검은 이걸 못 봅니다** — 한 화면 안에서 도는 검사라
    다시 띄울 수가 없습니다. 거기서 보는 것은 "그 한 줄이 살아 있는가"
    까지이고, **실제로 내려가서 새로고침해 보는 것**은 여기입니다.
    ══════════════════════════════════════════════════════════════ */
 console.log("\n【10】 새로고침하면 맨 위");
 await pg.goto(B+"/startup",{waitUntil:"networkidle"});
 await pg.waitForTimeout(300);
 const tall = await pg.evaluate(()=>document.documentElement.scrollHeight);
 say(tall > 2000, "내려갈 만큼 긴 화면이다", tall+"px");
 await pg.evaluate(()=>window.scrollTo(0, 1500));
 await pg.waitForTimeout(200);
 const before = await pg.evaluate(()=>Math.round(window.scrollY));
 say(before > 1000, "일단 내려가 있다", before+"px");
 await pg.reload({waitUntil:"networkidle"});
 /* ⚠️ 복원은 load **뒤에** 비동기로 일어납니다 — 바로 재면 0 이
    나왔다가 그 뒤에 내려갈 수 있습니다. 넉넉히 기다린 뒤 잽니다
    (끄지 않은 상태에서 1500 으로 돌아오는 것을 확인했습니다). */
 await pg.waitForTimeout(900);
 const after = await pg.evaluate(()=>Math.round(window.scrollY));
 say(after === 0, "새로고침하면 맨 위에서 시작한다", after+"px");
 /* ⚠️⚠️ **"더 보기" 는 그대로 스크롤을 지킵니다** — 목록을 늘리는
    것인데 맨 위로 올라가면 방금 보던 자리를 잃고, 그러면 한 번 더
    안 누릅니다. 위 한 줄이 이쪽까지 끌고 가면 안 됩니다.

    ⚠️ 지금은 **화면에 "더 보기" 가 하나도 없습니다** — 업체 0곳 ·
    매물 0건이라 24장을 넘는 목록이 없습니다. 그래서 링크를 찾아
    누르는 꼴로 적으면 **늘 건너뛰는 검사**가 되고, 그건 검사가
    아닙니다 (이 저장소가 "통과만 하고 아무것도 안 보는 검사" 로
    여러 번 겪은 자리). 링크가 지나는 **그 길**(go 의 keepScroll)을
    직접 눌러 봅니다 — 첫 매물이 올라오는 날 쓰는 길과 같습니다. */
 await pg.goto(B+"/content",{waitUntil:"networkidle"});
 await pg.waitForTimeout(300);
 await pg.evaluate(()=>window.scrollTo(0, 1200));
 await pg.waitForTimeout(200);
 const keepBefore = await pg.evaluate(()=>Math.round(window.scrollY));
 await pg.evaluate(()=>go(location.pathname+"?n=48", { keepScroll:true }));
 await pg.waitForTimeout(400);
 const keepAfter = await pg.evaluate(()=>Math.round(window.scrollY));
 say(keepBefore > 600 && Math.abs(keepAfter - keepBefore) < 80,
     "더 보기 길(keepScroll)은 그대로 스크롤을 지킨다",
     keepBefore+"px → "+keepAfter+"px");
 /* ⚠️ 반대로 평범한 링크는 맨 위로 올라가야 합니다 — 둘이 같아지면
    목록을 늘릴 때마다 보던 자리를 잃습니다 */
 await pg.evaluate(()=>window.scrollTo(0, 1200));
 await pg.waitForTimeout(200);
 await pg.evaluate(()=>go("/faq"));
 await pg.waitForTimeout(400);
 const plain = await pg.evaluate(()=>Math.round(window.scrollY));
 say(plain === 0, "평범한 링크는 맨 위로 올라간다", plain+"px");

 /* ══ 【11】 2026-10-24 1단계 보고서 — 고친 것이 그대로 있는가 ══ */
 console.log("\n【11】 1단계 개선");

 /* ① 뒤로 가기는 **보던 자리로** — 고르개가 폰에서 8,000px 이 넘는데
    신청 화면에 갔다 오면 맨 위였습니다 (아홉 화면을 다시 내려감).
    ⚠️ 새로고침은 그대로 맨 위입니다 — 위 【10】 이 그걸 봅니다. */
 await pg.setViewportSize({ width:390, height:900 });
 await pg.goto(B+"/startup",{waitUntil:"load"}); await pg.waitForTimeout(500);
 await pg.evaluate(()=>window.scrollTo(0, 2500)); await pg.waitForTimeout(200);
 await pg.evaluate(()=>go("/quote")); await pg.waitForTimeout(500);
 await pg.goBack(); await pg.waitForTimeout(600);
 const backY = await pg.evaluate(()=>Math.round(window.scrollY));
 say(Math.abs(backY-2500) < 80, "뒤로 가기는 보던 자리로 돌아간다", backY+"px (2500 이라야)");

 /* ② /join — 히어로에서 신청 폼으로 **바로** 갑니다.
    ⚠️ 이 화면은 영업 작업대의 종착점입니다. 폼이 문서 11,000px 쯤에
    있어서, 내려가지 않고 갈 길이 없으면 거기서 통화가 버려집니다. */
 await pg.goto(B+"/join",{waitUntil:"load"}); await pg.waitForTimeout(500);
 const jn = await pg.evaluate(()=>{
   const q=s=>document.querySelector(s);
   const cta=[...document.querySelectorAll(".pgh .btn")].map(b=>b.getAttribute("href")||"");
   const chips=[...document.querySelectorAll(".join-cat .chip")];
   return { cta, form:!!q("#join-form"), fields:!!q("#join-fields"),
     fold:!!q(".jn-fold-w .fld-b"),
     chipAll:chips.length, chipVis:chips.filter(c=>c.offsetParent).length,
     names:[...document.querySelectorAll(".join-cat > b")].filter(b=>b.offsetParent).length,
     faqOpen:document.querySelectorAll(".faq-a:not([hidden])").length,
     faqAll:document.querySelectorAll(".faq-a").length };
 });
 say(jn.cta.indexOf("#join-form")>=0 && jn.form,
     "/join 히어로에서 신청 폼으로 바로 간다", jn.cta.join(" "));
 say(jn.fold && jn.chipVis===0 && jn.chipAll>50,
     "입점 분야 칩이 접혀 있다 (DOM 에는 그대로)", "보임 "+jn.chipVis+"/"+jn.chipAll);
 say(jn.names>=10, "접혀도 분야 이름은 보인다", jn.names+"개");
 say(jn.faqOpen===0 && jn.faqAll>0,
     "/join FAQ 가 아코디언이다", jn.faqOpen+"/"+jn.faqAll);
 await pg.click(".jn-fold-w .fld-b"); await pg.waitForTimeout(250);
 const open = await pg.evaluate(()=>[...document.querySelectorAll(".join-cat .chip")].filter(c=>c.offsetParent).length);
 say(open>50, "눌러서 펼치면 칩이 나온다", open+"개");

 /* ③ 신청 폼 — 지역도 브라우저가 막습니다 (딱지에 * 가 있습니다) */
 await pg.goto(B+"/quote",{waitUntil:"load"}); await pg.waitForTimeout(500);
 const rq = await pg.evaluate(()=>{
   const e=document.getElementById("q-reg");
   return { req: e ? e.required : null,
     star: !!(document.querySelector("label[for=q-reg] b")) };
 });
 say(rq.req === true && rq.star, "지역 칸이 * 이고 required 다", JSON.stringify(rq));

 /* ④ 전문관 넷의 첫 단추가 **같은 말**입니다 */
 const words = [];
 for(const u of ["/startup","/operation","/transfer","/closure"]){
   await pg.goto(B+u,{waitUntil:"load"}); await pg.waitForTimeout(350);
   words.push(await pg.evaluate(()=>{
     const b=document.querySelector(".pgh .btn-b, .pgh .btn");
     return b ? b.innerText.replace(/\s+/g," ").trim() : "(없음)"; }));
 }
 say(new Set(words).size === 1, "전문관 넷의 첫 단추가 같은 말이다", words.join(" | "));

 console.log("\n【5】 콘솔 오류");
 say(errs.length===0,"JS 에러 없음",errs.join(" / "));
 console.log(bad?("\n❌ "+bad+"건 실패"):"\n✅ 흐름 전부 통과");
 await br.close(); srv.close(); process.exit(bad?1:0);
})();
