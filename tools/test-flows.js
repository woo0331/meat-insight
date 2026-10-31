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
 /* ⚠️⚠️ **2026-10-31 — 창업 · 폐업 묶음 여덟을 지웠습니다.** 사장님
    지시("인수인계 자료를 다 지워 · 중고폰 쪽은 살려두고")로 그 화면
    파일이 없어져서, 거기를 누르던 【1】【2】【3】【6】【7】【8】【9】
    【13】 과 【4】② · 【12】② 는 **빈 화면에서 click 이 30초 타임아웃**
    으로 터지고 뒤 묶음이 통째로 안 돌 자리였습니다.
    ⚠️ 꺼내 보시려면 git show 6d85a17:tools/test-flows.js 입니다 —
    되살리시는 날 그 묶음들도 같이 되살리세요.
    ⚠️ pickGo* 헬퍼 넷도 같이 내렸습니다 (쓰는 묶음이 다 없어졌고,
    #pka-go · #pk-bar-go 가 있던 전문관 화면이 지금 없습니다). */
 console.log("\n【4】 메인에서 갈라지는 길 · 계산기 · 정보 · 입점");
 /* ⚠️⚠️ **2026-10-29 PHONEWAY — 메인이 통째로 바뀌었습니다.**
    여기 있던 길(진입 카드 넷 · 직접 찾기 여덟 · 계산도구 카드 ·
    가이드 카드 · 헤더 계산기 · 헤더 이용 가이드)은 전부 STOREWAY
    메인 것이고 지금 **하나도 없습니다.**
    ⚠️⚠️ **2026-10-31 로 ② 가 없어졌습니다.** 전에는 창업 · 폐업
    157개로 가는 길을 **푸터 한 줄**로 들어가서 거기서 /tools ·
    /content · /closure · /operation · /transfer 가 이어지는지 봤는데,
    그 화면 파일이 없어져서 **집을 요소가 없습니다** — 없는 요소를
    click 하면 30초 타임아웃으로 터지고 뒤 묶음이 통째로 안 돕니다.
    ⚠️ 되살리시려면 git show 6d85a17:tools/test-flows.js 입니다. */

 /* ── PHONEWAY 메인 ──────────────────────────────────────────── */
 await pg.goto(B+"/",{waitUntil:"networkidle"});
 await click('.pwh-go a[href="/sell"]');
 say((await url())==="/sell","히어로 내 폰 팔기 → /sell",await url());
 await pg.goto(B+"/",{waitUntil:"networkidle"});
 await click('.pwh-go a[href="/shop"]');
 say((await url())==="/shop","히어로 중고폰 구매 → /shop",await url());
 /* ⚠️⚠️ **2026-10-30 전면 리뉴얼 §2 — 누르는 자리가 또 바뀌었습니다.**
    기기 선택 넷(.pwd-g .dvc) · 바로가기 다섯(.pwq-c)은 메인에서
    내려갔고 (함수도 CSS 도 안 지웠습니다), 지금은 **핵심 서비스
    여섯(.pwsv-c)** · **브랜드 여섯(.pwbr-c)** · **안내 배너 셋(.pwbz-c)**
    입니다. ⚠️ 없는 요소를 집으면 **click 이 30초 타임아웃으로 터지고
    뒤 블록이 통째로 안 돕니다** — 어느 검사가 틀렸는지도 안 나옵니다.
    그 구간을 되살리시면 **여기도 같이** 뒤집으세요. */
 /* 핵심 서비스 여섯 — ⚠️ 여섯 전부 **지금 열리는 화면**입니다
    (§0-6 · §0-7 — 안 열리는 메뉴를 가짜 화면으로 보내지 않습니다). */
 await pg.goto(B+"/",{waitUntil:"networkidle"});
 const svc = await pg.evaluate(()=>{
   const a = [].slice.call(document.querySelectorAll(".pwsv-c"));
   return { n:a.length, bad:a.filter(function(e){
     const h = e.getAttribute("href") || ""; return h.charAt(0) !== "/"; }).length,
     inner:a.filter(function(e){ return !!e.querySelector("a"); }).length }; });
 say(svc.n>0 && svc.bad===0 && svc.inner===0,
   "핵심 서비스 여섯이 전부 사이트 안 주소이고 카드 안에 또 링크가 없다",
   svc.n+"장 · 밖 "+svc.bad+" · 안에 링크 "+svc.inner);
 for(const [sel, want, nm] of [['.pwsv-c[href="/sell"]',  "/sell",  "내 폰 판매"],
                               ['.pwsv-c[href="/repair"]',"/repair","수리 서비스"],
                               ['.pwsv-c[href="/bid"]',   "/bid",   "B2B 경매"]]){
   await pg.goto(B+"/",{waitUntil:"networkidle"});
   await click(sel);
   say((await url())===want,"핵심 서비스 · "+nm+" → "+want,await url());
 }
 /* 브랜드 여섯 — ⚠️⚠️ 재고가 0건인 브랜드도 **화면은 열려야** 합니다
    (0건을 0건이라고 말하는 자리입니다 · 절대 규칙 2). */
 /* ⚠️⚠️ **열리는지만 보지 마세요.** 전에는 `startsWith("/shop")` 만 봐서,
    열쇠가 틀려(`?m=`) 브랜드가 **하나도 안 걸리고 전부** 나오는데도 여섯
    다 통과했습니다 (`/shop` 이 읽는 열쇠는 `mk` 입니다). 지금 보는 것은
    **거른 목록이 안 거른 목록보다 적은가**입니다 — 그 한 줄이 그 사고를
    바로 잡습니다.
    ⚠️ 취급 모델이 0종인 넷(구글 · 화웨이 · OPPO · 샤오미)은 **0건 안내**가
    맞습니다 (절대 규칙 2) — `AM_MAKERS` 에 넣으면 `/sell` 모델 고르개에
    고를 것이 없는 제조사가 생깁니다. */
 /* ⚠️ 상품 카드는 `.shp-g > li` 가 아니라 **`.shp-w > a.shp-c`** 입니다
    (찜 단추가 `a` 밖이라 감싸개가 하나 있습니다). `li` 로 세었다가
    여섯이 전부 0건으로 읽혀 멀쩡한 화면을 실패로 잡았습니다 — 검사가
    틀린 자리입니다. */
 await pg.goto(B+"/shop",{waitUntil:"networkidle"});
 await pg.waitForTimeout(260);
 const shopAll = await pg.evaluate(()=>document.querySelectorAll(".shp-g .shp-c").length);
 for(const [k, nm, en] of [["apple","애플","Apple"],["samsung","삼성","Samsung"],
       ["google","구글","Google"],["huawei","화웨이","Huawei"],
       ["oppo","오포","OPPO"],["xiaomi","샤오미","Xiaomi"]]){
   await pg.goto(B+"/",{waitUntil:"networkidle"});
   await pg.evaluate(()=>document.querySelector(".pwbr-g").scrollIntoView());
   /* ⚠️⚠️ **주소로 집지 마세요.** `[href="/shop?mk=..."]` 로 집으면 열쇠가
      또 틀어지는 날 click 이 **30초 타임아웃으로 터지고** 뒤 묶음이 통째로
      안 돕니다 (어느 검사가 틀렸는지도 안 나옵니다). 손님이 보는 **이름**
      으로 집으면 그때 깨끗하게 ❌ 가 납니다. */
   await click('.pwbr-c:has(b:text-is("'+en+'"))');
   const u = await url();
   const r = await pg.evaluate(()=>({
     n: document.querySelectorAll(".shp-g .shp-c").length,
     e: !!document.querySelector(".pws-e") }));
   say(u==="/shop?mk="+k && r.n < shopAll && (r.n > 0 || r.e),
     "브랜드 · "+nm+" → "+u+" · "+r.n+"건(안 거르면 "+shopAll+") 0건안내 "+r.e,
     u+" n="+r.n+" e="+r.e);
 }
 /* 안내 배너 셋 — ⚠️ 셋 다 **실제로 열려야** 합니다 (§0-6 · §0-7)
    ⚠️⚠️ **기업 매입은 질의문자까지 그대로 가야 합니다.** `/biz` 는 기업
    매입과 해외 수출이 **같이 쓰는 화면**이고 어느 쪽인지는 `?t=` 가
    정합니다 — 여기서 `/biz` 만 기다리면 탭이 조용히 엉뚱한 쪽으로
    열려도 통과합니다 (주소를 둘로 나누지 않은 까닭이 그것입니다). */
 for(const [sel, want, nm] of [['.pwbz-c[href="/guide"]', "/guide", "검수 인증"],
                               ['.pwbz-c[href="/repair"]',"/repair","수리 vs 판매"],
                               ['.pwbz-c[href="/biz?t=corp"]',"/biz?t=corp","기업 대량 매입"]]){
   await pg.goto(B+"/",{waitUntil:"networkidle"});
   await click(sel);
   say((await url())===want,"안내 배너 · "+nm+" → "+want,await url());
 }
 /* 중고폰 목록 거르개 — ⚠️⚠️ **맨 위로 튀지 않습니다** (§2-5).
    목록을 좁히는 것인데 맨 위로 올라가면 방금 보던 자리를 잃습니다 —
    data-keep 이 그 표시입니다 (js/app.js 의 click 가로채기가 봅니다). */
 await pg.goto(B+"/",{waitUntil:"networkidle"});
 const keep = await pg.evaluate(()=>{
   const a = [].slice.call(document.querySelectorAll(".pwpd-fil .chip"));
   return { n:a.length, bad:a.filter(function(e){
     return !e.hasAttribute("data-keep"); }).length }; });
 say(keep.n>0 && keep.bad===0,"중고폰 거르개가 맨 위로 안 튀게 되어 있다",
     keep.n+"칸 · 표시 빠진 것 "+keep.bad);
 /* 하단 CTA 둘 */
 await pg.goto(B+"/",{waitUntil:"networkidle"});
 await click('.pwc a[href="/sell"]');
 say((await url())==="/sell","하단 CTA → /sell",await url());
 await pg.goto(B+"/",{waitUntil:"networkidle"});
 await click('.pwc a[href="/guide"]');
 say((await url())==="/guide","하단 CTA → /guide",await url());
 /* ⚠️ 헤더 CTA 는 **167개 화면 전부**에 있는 늘 보이는 길입니다 */
 await pg.goto(B+"/",{waitUntil:"networkidle"});
 await click('.hd .hd-cta');
 say((await url())==="/sell","헤더 팔기 → /sell",await url());
 /* ⚠️⚠️ 헤더 메뉴가 **전부 실제로 열려야** 합니다 — 하나라도 막히면
    167개 화면에서 그 길이 끊깁니다.
    ⚠️⚠️ **메뉴 목록을 글자로 박지 마세요.** 전에 여섯을 손으로 적어
    두었다가, 2026-10-29 오렌지 시안 §3-A 로 `/track` 이 헤더에서
    내려가자 **없는 메뉴를 누르려다 click 이 30초 타임아웃으로
    터졌습니다** (뒤 블록이 통째로 안 돌고 어느 검사가 틀렸는지도
    안 나왔습니다). 여기서 지키는 것은 이름이 아니라 **어느 메뉴도
    막다른 길이 아니다** 라서, 지금 화면의 메뉴를 그대로 읽습니다. */
 const gnb = await pg.evaluate(()=>[].slice.call(
   document.querySelectorAll(".hd .gnb a")).map(function(a){
     return [a.getAttribute("href"), a.textContent.trim()]; }));
 say(gnb.length>0,"헤더 메뉴를 읽었다",gnb.length+"칸");
 for(const [h,n] of gnb){
   await pg.goto(B+"/",{waitUntil:"networkidle"});
   await click('.hd .gnb a[href="'+h+'"]');
   say((await url())===h,"헤더 "+n+" → "+h,await url());
 }
 /* ⚠️⚠️ **`/track`(판매 진행 조회)이 헤더에서 내려갔습니다** — 지운
    것이 아니라 자리가 바뀐 것이라, 갈 길이 **실제로 남아 있는지**
    여기서 봅니다 (푸터 한 줄). 안 보면 색인은 되어 있는데 사이트
    안에서는 아무 데서도 안 걸리는 화면이 하나 생깁니다. */
 await pg.goto(B+"/",{waitUntil:"networkidle"});
 await click('.ft a[href="/track"]');
 say((await url())==="/track","푸터 판매 진행 조회 → /track",await url());
 /* ⚠️ 매입업체 입점 — 끝이 막히지 않았는지 푸터에서 눌러 봅니다 */
 await pg.goto(B+"/",{waitUntil:"networkidle"});
 await click('.ft a[href="/join"]');
 say((await url())==="/join","푸터 매입업체 입점 → 신청 화면",await url());

 /* ══════════════════════════════════════════════════════════════
    【10】 새로고침하면 맨 위에서 시작합니다 (2026-10-21 사장님 지시)

    ⚠️⚠️ **전수 점검은 이걸 못 봅니다** — 한 화면 안에서 도는 검사라
    다시 띄울 수가 없습니다. 거기서 보는 것은 "그 한 줄이 살아 있는가"
    까지이고, **실제로 내려가서 새로고침해 보는 것**은 여기입니다.
    ══════════════════════════════════════════════════════════════ */
 console.log("\n【10】 새로고침하면 맨 위");
 /* ⚠️ **충분히 긴 화면**이라야 합니다 — 재 본 값: /join 8,145px ·
    /terms 7,386 · /privacy 6,532 · / 4,927. /search(1,542) 처럼 짧은
    화면에서는 1,500px 로 내려갈 수가 없어 되돌리기가 헛돕니다. */
 await pg.goto(B+"/join",{waitUntil:"networkidle"});
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
 await pg.goto(B+"/join",{waitUntil:"networkidle"});
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
 await pg.goto(B+"/join",{waitUntil:"load"}); await pg.waitForTimeout(500);
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
     catAll:document.querySelectorAll(".join-cat").length,
     names:[...document.querySelectorAll(".join-cat > b")].filter(b=>b.offsetParent).length,
     faqOpen:document.querySelectorAll(".faq-a:not([hidden])").length,
     faqAll:document.querySelectorAll(".faq-a").length };
 });
 say(jn.cta.indexOf("#join-form")>=0 && jn.form,
     "/join 히어로에서 신청 폼으로 바로 간다", jn.cta.join(" "));
 /* ⚠️⚠️ **기준값을 손으로 적지 마세요.** 전에는 `chipAll>50` ·
    `names>=10` 이었는데, 그건 창업 · 폐업 분류 열일곱 · 칩 128개에
    맞춰 박아 둔 수였습니다 — 2026-10-29 로 이 구간이 **취급 기기**
    (종류 넷)로 바뀌자 멀쩡한 화면이 세 건 실패로 떨어졌습니다.
    지켜야 하는 것은 개수가 아니라 셋입니다 — ① 접혀 있다
    ② 접혀도 묶음 이름은 보인다 ③ 펼치면 전부 나온다. 세는 값으로
    보면 데이터가 어떻게 바뀌어도 그 셋을 계속 봅니다. */
 say(jn.fold && jn.chipAll>0 && jn.chipVis===0,
     "취급 기기 칩이 접혀 있다 (DOM 에는 그대로)", "보임 "+jn.chipVis+"/"+jn.chipAll);
 say(jn.catAll>0 && jn.names===jn.catAll,
     "접혀도 묶음 이름은 보인다", jn.names+"/"+jn.catAll);
 say(jn.faqOpen===0 && jn.faqAll>0,
     "/join FAQ 가 아코디언이다", jn.faqOpen+"/"+jn.faqAll);
 await pg.click(".jn-fold-w .fld-b"); await pg.waitForTimeout(250);
 const open = await pg.evaluate(()=>[...document.querySelectorAll(".join-cat .chip")].filter(c=>c.offsetParent).length);
 say(open===jn.chipAll, "눌러서 펼치면 칩이 전부 나온다", open+"/"+jn.chipAll);

 /* ③ 신청 폼 — 지역도 브라우저가 막습니다 (딱지에 * 가 있습니다) */
 await pg.goto(B+"/quote",{waitUntil:"load"}); await pg.waitForTimeout(500);
 const rq = await pg.evaluate(()=>{
   const e=document.getElementById("q-reg");
   return { req: e ? e.required : null,
     star: !!(document.querySelector("label[for=q-reg] b")) };
 });
 say(rq.req === true && rq.star, "지역 칸이 * 이고 required 다", JSON.stringify(rq));

 /* ⚠️⚠️ **④ 전문관 넷의 첫 단추가 같은 말인가** 를 지웠습니다
    (2026-10-31). /startup · /operation · /transfer · /closure 네
    화면이 없어졌고, 중고폰 쪽의 네 입구(판매 · 구매 · 입찰 ·
    수리)는 **하는 일이 서로 달라** 단추 글자가 같아야 할 까닭이
    없습니다 — 억지로 맞추면 그게 거짓입니다.
    ⚠️ 되살리시는 날 git show 6d85a17:tools/test-flows.js 에서
    그 열 줄을 꺼내 오세요. */

 /* ══ 【12】 메인에서 시작하는 시나리오 ══════════════════════════
    ⚠️⚠️ **2026-10-29 PHONEWAY — 메인 진입 카드 넷이 없어졌습니다.**
    여기 있던 "메인 → 전문관 → 서비스 선택 → 견적 신청" 은 STOREWAY
    메인 것입니다. **두 쪽으로 갈랐습니다** —
      ① PHONEWAY 메인이 내는 길 (판매 · 구매)
      ② 창업 · 폐업 전문관 넷 — 푸터 한 줄로 들어간 뒤 **직접**
         (메인에 그 네 카드가 없으니 "메인 진입 카드" 로는 못 잽니다)
    ⚠️ 보내지는 않습니다 — 신청 화면이 고른 것을 되읽는 데까지입니다. */
 console.log("\n【12】 메인에서 시작하는 시나리오");
 await pg.setViewportSize({ width:1440, height:900 });

 /* ── PHONEWAY — 메인에서 /sell 까지, 그리고 끝까지 고릅니다 ─── */
 await pg.evaluate(()=>{ try{ localStorage.clear(); }catch(e){} });
 await pg.goto(B+"/",{waitUntil:"networkidle"}); await pg.waitForTimeout(400);
 /* ⚠️ 2026-10-30 전면 리뉴얼 §2-3 — 메인의 첫 걸음은 **핵심 서비스
    카드**입니다 (기기 선택 넷은 내려갔습니다 · 없는 요소를 집으면
    click 이 타임아웃으로 터지고 뒤 블록이 통째로 안 돕니다). */
 await click('.pwsv-c[href="/sell"]');
 say((await url())==="/sell","메인 핵심 서비스 · 내 폰 판매 → 내 폰 팔기",await url());
 /* 기기 → 제조사 → 모델 → 상태 → 견적 · 신청. ⚠️ 끝이 막히지 않았는지
    **실제로 눌러** 봅니다 (고르개가 주소에 실리는 꼴입니다). */
 /* ⚠️⚠️ **기기 종류 · 제조사 칩은 접혀 있습니다** (2026-10-29 §2 —
    큰 카드 넷이 먼저입니다). 카드가 **제조사와 종류를 한 번에**
    고르므로 손님이 실제로 하는 것은 카드 한 번입니다.
    ⚠️ 메인에서 기기 카드가 내려간 뒤에도 /sell 01 걸음의 카드 넷은
    그대로입니다 — 거기가 고르는 자리이고, 메인은 보내기만 합니다. */
 say((await pg.locator('#pf-chip').count())===0,
     "01 걸음의 첫 화면에 칩 줄이 안 펼쳐져 있다");
 say((await pg.locator('.dvc').count())===4,"기기 카드가 넷이다");
 await click('.dvc:has-text("아이폰")');
 say((await url()).indexOf("mk=apple")>=0 && (await url()).indexOf("kd=phone")>=0,
     "카드 한 번에 제조사와 종류가 같이 실린다",await url());
 say((await pg.getAttribute('.dvc:has-text("아이폰")',"aria-pressed"))==="true",
     "고른 카드가 눌린 것으로 읽힌다");
 /* ⚠️⚠️ **워치 · 버즈 · 기타 제조사 길이 살아 있는지** 같이 봅니다 —
    카드 넷이 덮지 않는 조합이고, 넷째 카드가 그 칩 줄을 펼칩니다.
    여기서 끊기면 그 기기를 가진 분은 팔 길이 아예 없습니다. */
 await click('.dvc:has-text("기타 기기")');
 await pg.waitForTimeout(400);
 say((await pg.locator('#pf-chip .chip-g .chip:has-text("워치")').count())>0,
     "기타 기기를 누르면 워치 · 버즈 칩이 나온다");
 await click('#pf-chip .chip-g .chip:has-text("스마트폰")');
 await click('#pf-chip .chip-g .chip:has-text("애플")');
 say((await url()).indexOf("mk=apple")>=0,"펼친 칩으로도 그대로 고를 수 있다",await url());
 await pg.selectOption("#pf-md", { index:1 });
 await pg.waitForTimeout(400);
 say((await url()).indexOf("md=")>=0,"모델이 주소에 실린다",await url());
 /* ⚠️⚠️ **용량까지 골라야 2단계가 열립니다** (`pwSellStep()`) — 모델만
    고르고 "2단계가 안 열린다" 고 적으면 **검사가 틀린** 것입니다. */
 const pwCap = await pg.$$('#pf-1 .chip-g .chip');
 if(pwCap.length) await pwCap[pwCap.length-1].click();
 await pg.waitForTimeout(450);
 say((await pg.locator("#pf-2").count())>0,"용량까지 고르면 2단계(상태 · 등급)가 열린다");
 /* 등급을 고르면 3단계(견적 · 신청)가 열려야 합니다 */
 const gr = await pg.$$('#pf-2 .pwf-g');
 if(gr.length){ await gr[0].click(); await pg.waitForTimeout(450); }
 say((await pg.locator("#pf-3").count())>0,"3단계(견적 · 신청)가 열린다");
 /* ⚠️⚠️ **매입 기준가가 0건이라 금액을 내지 않습니다** (절대 규칙 1).
    기준가를 넣으시면 이 줄이 **반대로** 뒤집혀야 합니다. */
 say((await pg.locator("#pf-3").innerText()).indexOf("원")<0 ||
     (await pg.evaluate(()=>typeof amBuyReady==="function" && !amBuyReady())),
     "기준가 0건이라 예상 금액을 안 낸다");
 say((await pg.locator("#pf-send").count())>0,"신청 단추가 있다");
 /* 구매 쪽 */
 await pg.goto(B+"/",{waitUntil:"networkidle"});
 await click('.pwsv-c[href="/shop"]');
 say((await url()).startsWith("/shop"),"메인 핵심 서비스 → 중고폰 구매",await url());

 /* ══ 【14】 2026-10-29 ③ — 중고폰 쇼핑몰을 실제로 눌러 봅니다 ══
    ⚠️⚠️ **거르개가 장식이 아닌지**가 핵심입니다. 칩의 주소를 눈으로
    보면 멀쩡해 보이는데, `shopUrl()` 이 짧은 이름(`kd`)을 받고 안에서
    긴 이름(`kind`)을 읽고 있어서 **칩 전부가 `/shop` 으로** 가고
    있었습니다 — 에러도 안 나고 화면도 멀쩡했습니다. 눌러 봐야 압니다.
    ⚠️ 실제 상품이 등록되면 예시가 사라져서 이 묶음은 건너뜁니다. */
 console.log("\n【14】 중고폰 쇼핑몰");
 await pg.goto(B+"/shop",{waitUntil:"networkidle"});
 const spOn = await pg.evaluate(()=>typeof amShopSampleOn==="function" && amShopSampleOn());
 if(!spOn){
   console.log("  — 실제 상품이 등록되어 예시 검사는 건너뜁니다");
 } else {
   const n0 = await pg.evaluate(()=>document.querySelectorAll(".shp-c").length);
   say(n0>0, "목록에 카드가 있다", n0+"장");
   /* 칩을 **눌러서** 주소가 바뀌는지 */
   await pg.click('.shp-fil .chip-g a:nth-child(2)');
   await pg.waitForTimeout(400);
   const u1 = (await pg.url()).replace(/^.*?:\d+/,"");
   say(u1.indexOf("?")>0, "거르개 칩이 주소를 바꾼다", u1);
   const n1 = await pg.evaluate(()=>document.querySelectorAll(".shp-c").length);
   say(n1>0 && n1<n0, "그만큼 목록이 줄어든다", n0+" → "+n1);
   /* ⚠️ 둘을 같이 걸면 **둘 다** 주소에 남아야 합니다 — 한 칸만 싣고
      나머지를 버리면 손님이 자기가 끈 줄 모릅니다 */
   const grs = await pg.$$('.shp-fil .pwf-r:nth-of-type(4) .chip');
   if(grs[2]) await grs[2].click();
   await pg.waitForTimeout(400);
   const u2 = (await pg.url()).replace(/^.*?:\d+/,"");
   say(u2.indexOf("kd=")>0 && u2.indexOf("gr=")>0, "거르개가 쌓인다 (한 칸만 남지 않는다)", u2);
   const off = await pg.evaluate(()=>(document.querySelector(".shp-n")||{}).textContent||"");
   say(off.indexOf("숨겼")>=0, "거르개로 몇 건이 빠졌는지 밝힌다", off.trim());
   /* ⚠️⚠️ 2026-10-30 모바일 지시서 §2 — **거르개를 눌러도 맨 위로 안 튄다.**
      전에는 칩이 링크라 render() 끝의 scrollTo(0,0) 을 탔습니다. 지금은
      목록(#shp-res)만 갈아 끼웁니다 — 화면을 통째로 다시 그리면 이 줄이
      다시 떨어집니다. ⚠️ 누르기 **전에** 칩을 화면에 들여 두고 잽니다
      (안 그러면 click 이 스스로 스크롤해서 그 값을 "튀었다" 로 잽니다). */
   await pg.goto(B+"/shop",{waitUntil:"networkidle"});
   const yLen0 = await pg.evaluate(()=>history.length);
   const ySteps = [];
   for(const sel of ['.shp-fil a.chip[data-shf="maker"][data-shv="apple"]',
                     '.shp-fil a.chip[data-shf="kind"][data-shv="phone"]']){
     await pg.locator(sel).scrollIntoViewIfNeeded();
     await pg.evaluate(()=>window.scrollBy(0, 40));
     const y0 = await pg.evaluate(()=>Math.round(scrollY));
     await pg.click(sel); await pg.waitForTimeout(250);
     const y1 = await pg.evaluate(()=>Math.round(scrollY));
     ySteps.push(y0+"→"+y1);
   }
   say(ySteps.every(t=>{ const a=t.split("→"); return Math.abs(a[0]-a[1])<=2; }),
     "거르개를 눌러도 보던 자리가 그대로다", ySteps.join(" · "));
   const yOn = await pg.evaluate(()=>[...document.querySelectorAll(".shp-fil a.chip.on")]
     .map(a=>a.getAttribute("data-shv")).join(","));
   say(yOn.indexOf("apple")>=0 && yOn.indexOf("phone")>=0,
     "제자리에서 갈아 끼워도 거르개가 쌓인다", yOn);
   say(await pg.evaluate(()=>history.length)===yLen0,
     "거르개 하나하나가 뒤로 가기 칸을 늘리지 않는다");
   await pg.locator(".shp-rs").scrollIntoViewIfNeeded();
   const yR0 = await pg.evaluate(()=>Math.round(scrollY));
   await pg.click(".shp-rs"); await pg.waitForTimeout(250);
   const yR = await pg.evaluate(()=>({y:Math.round(scrollY),u:location.pathname+location.search}));
   say(yR.u==="/shop" && Math.abs(yR.y-yR0)<=2, "필터 초기화가 거르개만 풀고 스크롤은 그대로다",
     yR0+"→"+yR.y+" · "+yR.u);
   /* 찾기 — ⚠️ 손님은 띄어쓰기를 안 합니다 */
   await pg.goto(B+"/shop",{waitUntil:"networkidle"});
   await pg.fill("#sh-q","아이폰15");
   await pg.click(".shp-q .btn");
   await pg.waitForTimeout(400);
   const nq = await pg.evaluate(()=>document.querySelectorAll(".shp-c").length);
   say(nq===1, "띄어쓰기 없이 쳐도 걸린다", nq+"장");
   /* 0건이면 막다른 길이 아닌가 */
   await pg.goto(B+"/shop?q=zzzz",{waitUntil:"networkidle"});
   const z = await pg.evaluate(()=>({e:!!document.querySelector(".pws-e"),
     go:!!document.querySelector('.pws-e a[href="/shop"]')}));
   say(z.e && z.go, "0건이면 까닭과 풀기 단추를 낸다");
   /* 카드를 눌러 상세로 — ⚠️ 예시에는 구매 단추가 없어야 합니다 */
   await pg.goto(B+"/shop",{waitUntil:"networkidle"});
   await pg.click(".shp-c");
   await pg.waitForTimeout(500);
   const d = await pg.evaluate(()=>({u:location.pathname,
     ex:(document.querySelector(".shp-note")||{}).textContent||"",
     buy:((document.getElementById("view")||document.body).textContent||"").indexOf("중고폰 구매하기")>=0,
     h1:((document.querySelector("#view h1")||{}).textContent||"").trim()}));
   say(d.u.indexOf("/d/")===0, "카드가 상세로 열린다", d.u);
   say(d.h1.length>0, "상세 제목이 비지 않았다", d.h1);
   say(d.ex.indexOf("예시")>=0, "상세가 예시라고 맨 위에서 말한다");
   say(!d.buy, "예시에는 구매 단추가 없다");
 }

 console.log("\n【5】 콘솔 오류");
 say(errs.length===0,"JS 에러 없음",errs.join(" / "));
 console.log(bad?("\n❌ "+bad+"건 실패"):"\n✅ 흐름 전부 통과");
 await br.close(); srv.close(); process.exit(bad?1:0);
})();
