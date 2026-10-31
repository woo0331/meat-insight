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
  /* ⚠️⚠️ 2026-10-31 — **푸터에 창업 · 폐업 가교를 다시 넣어** 봅니다
     (사장님 지시 — "인수인계 자료들은 다 지워줘").
     그 157개는 지금 `vercel.json` 이 308 로 `/` 에 보냅니다 — 화면에
     길을 남기면 손님이 눌러도 메인으로 튕기고, 그건 **링크가 고장난
     것**으로 읽힙니다. 전에는 그 반대("길이 한 곳은 남아야 한다")가
     규칙이었고, 2026-10-31 로 뒤집혔습니다.
     ⚠️ 집는 자리가 **푸터**인 것이 요점입니다 — 푸터는 180개 화면이
     같이 쓰므로 거기 한 줄이 살아나면 전부에서 살아납니다. 본문
     쪽에 걸면 "푸터가 다시 생겼을 때 잡히는지" 를 증명하지 못합니다.
     ⚠️ `.ft-tail` 은 실제로 `/` 에 있습니다 — 없는 요소를 집으면
     되돌리기가 헛돌고 "검사가 안 잡는다" 로 보입니다 (이 저장소가
     열여섯 번 겪은 자리). */
  ["창업 · 폐업으로 가는 길이 화면에 없다",
   `var ul = document.querySelector(".ft-tail");
    if(ul){
      var li = document.createElement("li");
      li.innerHTML = '<a href="/startup">창업 · 폐업 서비스</a>';
      ul.appendChild(li);
    }`],
  /* ══ 2026-10-29 PHONEWAY — 조회할 곳이 없는 동안의 `/track` ═════
     전의 꼴—폼을 내고 안내를 감춘 꼴—으로 되돌립니다. 그러면
     손님이 적고 누르셨는데 "아직 안 열었습니다" 가 나옵니다 (§30-7).
     ⚠ 두 칸이 둘 다 `/track` 에 실제로 있습니다 — 없는 요소를 집으면
     되돌리기가 헛돌고 "검사가 안 잡는다" 로 보입니다. */
  ["진행 조회: 조회할 곳이 없으면 폼을 안 낸다",
   `var fm = document.getElementById("tk-fm");
    var off = document.getElementById("tk-off");
    if(fm) fm.hidden = false;
    if(off) off.hidden = true;`],
  /* ⚠️⚠️ 2026-10-30 — 헤더 메뉴의 이름을 **"고객센터" 로 되돌려** 봅니다.
     전화 창구가 없는데 그 이름을 걸면 번호를 찾다가 못 찾으십니다.
     ⚠️ 집는 자리가 **헤더**인 것이 요점입니다 — 먼저 있던 검사는
     /track 의 view 안만 봐서 이 자리를 한 번도 못 봤습니다. 되돌리기를
     본문 쪽에 걸면 넓힌 검사가 무엇을 잡는지 증명하지 못합니다. */
  ["없는 고객센터로 보내는 길이 없다",
   `var a = document.querySelector('.hd .gnb a[href="/faq"]');
    if(a) a.textContent = "고객센터";`],
  /* ⚠️⚠️ 2026-10-29 ③ — 예시 상품에서 **예시 딱지를 떼어** 봅니다.
     떼면 지어낸 값이 실제 상품으로 읽힙니다 (절대 규칙 1).
     ⚠️ 안내 상자를 지우는 쪽으로 적지 마세요 — 그러면 "안내가
     없습니다" 가 먼저 나서 **딱지 검사가 도는지는 모릅니다**
     (이 저장소가 "겹겹이 막아 둔 것이 검사를 속인다" 로 겪은 자리). */
  ["쇼핑몰: 예시면 예시라고 밝히고 살 수 없다",
   `var ex = document.querySelectorAll(".shp-ex");
    for(var i = 0; i < ex.length; i++) ex[i].remove();`],
  /* ⚠️⚠️ 예시 상세에 **구매 단추를 돌려 놓아** 봅니다 — 누를 때마다
     실패하는 단추입니다 (§30-7). ⚠️ 이 되돌리기는 **이미 그려진 뒤에**
     도므로 그리는 함수를 바꿔치기해도 아무 일이 안 납니다 — DOM 을
     직접 건드립니다 (이 저장소가 여러 번 겪은 자리). */
  ["쇼핑몰: 예시 상세에는 구매 단추가 없다",
   `var box = document.querySelector(".shp-d-tx .note-box");
    if(box) box.insertAdjacentHTML("afterend",
      '<div class="pwb-go"><a class="btn btn-pw" href="/quote">중고폰 구매하기</a></div>');`],
  /* ⚠️⚠️ 2026-10-25 §10 — 신청 화면의 단계 안내를 **손으로 적은 말**로
     바꿔 봅니다. 그러면 제휴가 붙은 날에도 "아직 없습니다" 가 남습니다
     (이 저장소가 CLAUDE.md 의 "아직 안 된 것" 표에서 겪은 자리). */
  /* ⚠️ `CASES` 는 **[이름, 되돌리는 코드]** 짝입니다 — 객체로 적었다가
     `.for is not iterable` 로 터졌습니다. */
  ["신청 화면이 지금 어느 단계인지 센 값으로 말한다",
   `window.QuoteStage = function(){
      return '<p class="note-box qt-stage"><b>지금 등록된 제휴업체는 없습니다.</b> ' +
             '손으로 적어 둔 말이라 업체가 생겨도 안 바뀝니다.</p>';
    };
    var el = document.querySelector(".qt-stage");
    if(el) el.outerHTML = window.QuoteStage();`],
  /* ══ 2026-10-25 §4 — 접수 실패 때 대체 연락 수단 ═══════════════
     그 줄을 **만들지 않는** 꼴로 되돌립니다 (복사 단추만 있던 때). */
  ["접수가 실패하면 적은 내용과 대체 연락 수단을 낸다",
   `window.sendFail = function(failId, again, body, msg){
      var box = document.getElementById(failId); if(!box) return;
      box.innerHTML = '<div class="notice-bad"><b>지금은 접수되지 않았습니다.</b>'+
        '<p>적어 주신 내용은 <b>그대로 남아 있습니다.</b></p>'+
        '<button type="button">적은 내용 복사</button></div>';
    };`],

  /* ══ 2026-10-25 P0 — 사업자 정보가 채워도 안 나오던 자리 ══════════
     푸터 렌더러를 **그때 꼴 그대로**(B.name · B.bizNo · B.mailOrderNo ·
     B.addr) 되돌려 놓습니다. 그러면 채워도 네 줄이 안 나옵니다.
     ⚠️ 그리는 함수를 바꿔치기하는 되돌리기가 보통은 안 먹습니다(검사가
     이미 그려진 뒤에 도니까요) — 여기는 **검사가 스스로 다시 그리기**
     때문에 먹습니다. */
  ["사업자 정보를 채우면 푸터에 일곱 줄이 실제로 나온다",
   `window.paintBiz = function(){
      var B = window.WOW_BIZ || {}, box = document.getElementById("ft-biz");
      if(!box) return;
      var rows = [["상호", B.name], ["대표", B.ceo],
                  ["사업자등록번호", B.bizNo], ["통신판매업신고", B.mailOrderNo],
                  ["주소", B.addr], ["문의", B.email], ["전화", B.phone]]
                 .filter(function(r){ return r[1]; });
      box.innerHTML = rows.map(function(r){
        return "<span>" + r[0] + " " + r[1] + "</span>"; }).join("");
    };`],

  /* ══ 2026-10-21 — 새로고침하면 맨 위에서 시작한다 ════════════════
     ⚠️ 브라우저가 되돌려 놓는 것을 다시 켜 봅니다. 화면은 한 픽셀도
     안 바뀌고 **새로고침할 때만** 달라지는 종류라, 되돌리기를 안 넣으면
     그 한 줄이 지워져도 아무도 모릅니다. */
  ["새로고침하면 맨 위에서 시작한다",
   `try{ history.scrollRestoration = "auto"; }catch(e){}`],

  /* PART 11-3 — 답이 처음부터 펼쳐져 있으면 아코디언이 아닙니다. */
  ["FAQ 가 접혔다 펴진다",
   `[].slice.call(document.querySelectorAll(".faq-a")).forEach(function(e){
      e.hidden = false; });`],

  /* PART 11-2 — 비어 있는 카테고리 칩을 하나 끼워 넣어 봅니다
     (눌러 보면 아무것도 없는 칸입니다 · 절대 규칙 2). */
  ["FAQ 카테고리가 센 값이고 빈 칸이 없다",
   `var ul = document.querySelector(".chip-g-fil");
    if(ul){ var li = document.createElement("li");
      li.innerHTML = '<a class="chip" href="/faq?c=etc">기타 0</a>';
      ul.appendChild(li); }`],

  /* ══ 2026-10-11 전면 감사 1차 — 로그인 ═════════════════════════
     ⚠️ 되돌리기는 **그려진 뒤에** 돕니다 — 그려 두고 DOM 을 건드립니다.
     "로그인이 설정되기 전에는 아무것도 안 낸다" 를 어기는 가장 흔한
     꼴이 **미리 만들어 둔 로그인 단추**입니다 (§30-7). */
  ["MY: 로그인이 설정되기 전에는 아무것도 안 낸다",
   `var b = document.getElementById("my-db");
    if(b){ b.hidden = false;
      b.innerHTML = '<div class="w"><p>로그인 준비 중</p></div>'; }`],
  /* ⚠️⚠️ 토큰을 안 보내면 로그인해도 영영 signedIn:false 입니다 —
     에러도 안 나고 화면도 멀쩡해서 **구간이 그냥 안 보일 뿐**입니다. */
  ["MY: 토큰이 있으면 Authorization 을 보낸다",
   `window.amAuthHeaders = function(){ return {}; };`],

  /* ③ ⚠️⚠️ **저장만 했는데 접수된 것처럼** 적어 봅니다 (§4 · 절대 규칙 5) */
  ["임시저장이 접수가 아니라고 말한다",
   `var p = document.querySelector(".q-draft .q-draft-t span");
    if(p) p.innerHTML = "<b>지금 적은 조건을 저장해 두실 수 있습니다.</b>";`],

  /* ⑥ §7-3 — ⚠️⚠️ **설정 전인데 사진 칸을 내게** 만들어 봅니다.
     올릴 데가 없는 칸은 고르고 눌렀다가 실패하는 길입니다. */
  ["버킷이 설정되기 전에는 사진 칸이 안 나온다",
   `window.amPhotoAfter = function(box){
      var w = document.createElement("div");
      w.className = "phup";
      w.textContent = "사진 고르기";
      box.appendChild(w);
    };`],
  /* ══ 2026-10-08 수익형 플랫폼 지시서 §6 ═══════════════════════ */
  /* ⚠️ 되돌리기는 **그려진 뒤에** 돕니다 — DOM 을 직접 건드립니다
     (그리는 함수를 바꾸면 아무 일이 안 납니다 · 열 번째로 겪은 자리). */
  /* ⚠️ 이 되돌리기는 **구간이 있는가**를 봅니다. 같은 검사가 보는
     "날짜 칸이 date 인가" 는 **데이터 성질**이라 DOM 을 건드려서는
     못 되돌립니다 — 그쪽은 `AM_REQ_FORMS` 를 직접 바꿔 보고
     확인했습니다 (corp 의 "회수 희망 시점" 을 text 로 → 걸립니다). */
  ["서비스마다 다르게 묻는다",
   `var b = document.querySelector(".rqf"); if(b) b.remove();`],
  ["칸이 없는 분류면 구간째 뺀다",
   `/* 분류를 안 고른 /quote 에 서비스별 구간을 억지로 만들어 둡니다 */
    var d = document.createElement("div"); d.className = "rqf";
    d.innerHTML = '<p class="rqf-h">억지로 넣은 구간</p>';
    document.querySelector("#q-f").prepend(d);`],
  ["빈 칸을 접수에 담지 않는다",
   `/* 0 을 빈 것으로 보는 옛 꼴로 되돌립니다 — 권리금 "무권리" 가
      사라지는 그 꼴입니다 */
    window.amDropEmpty = function(o){
      var out = {}, k;
      for(k in o) if(o[k]) out[k] = o[k];
      return out;
    };`],
  /* ⚠️⚠️ 금지 표현을 한 자리에 넣어 보면 걸려야 합니다 (2026-10-06
     마무리 지시서 §3). 이 저장소에서 "인기 검색어" → "추천 검색어" →
     "바로가기" 로 두 번 옮겼고, 서비스 제목도 하루에 두 번 오갔습니다.
     되돌아가는 것을 막는 것이 이 검사의 일입니다. */
  ["근거 없는 인기 · 추천 표현이 없다",
   /* ⚠️ 2026-10-11 — .msvc 가 전문관 구간(.mhall)으로 바뀌었습니다.
      없는 요소를 집으면 되돌리기가 **터져서** "검사가 안 잡는다" 로
      보입니다 — 이 저장소가 여덟 번 겪은 자리입니다. */
   /* ⚠️ 2026-10-13 §6 — 전문관 구간 머리말이 **h1** 이 됐습니다
      (히어로 두 판이 같은 무게라 h1 을 올릴 수 없어서입니다).
      h2 를 집으면 null 이라 되돌리기가 터집니다 — 아홉 번째. */
   `(document.querySelector(".mhall h1") ||
     document.querySelector(".mhall h2") ||
     document.querySelector("#view h1")).textContent =
       "사장님들이 많이 찾는 서비스";`],
  /* 구간이 자기 톤을 숨기면 걸려야 합니다 — `.mjy` 가 꼭 그랬습니다
     (클래스로는 아무 말도 안 하고 CSS 로만 회색) */
  ["이웃한 두 구간이 붙어 보이지 않는다",
   `(function(){
      const S = document.querySelectorAll("#view > section");
      if(S.length < 3) return;
      /* 둘째를 첫째와 같은 색으로 — 클래스를 지우고 직접 칠합니다 */
      const c = getComputedStyle(S[0]).backgroundColor;
      S[1].className = S[1].className.replace(/sec-[a-z0-9]+/g, "");
      S[1].style.background = c;
      S[0].style.background = c;
    })();`],
  /* 예시 딱지를 떼면 걸려야 합니다 */
  ["입점 화면의 예시는 예시라고 밝힌다",
   /* ⚠⚠ 2026-10-29 — 예시 카드가 지금 화면에 **없습니다.**
      전의 되돌리기(`.jn-ex-tag` 지우기)는 지울 것이 없어 **헛돌고**
      "검사가 안 잡는다" 로 보였을 자리입니다 (이 저장소가 열두 번
      겪은 것). 지금은 **딱지 없이 다시 켜는 꼴**을 만들어 봅니다 —
      매입업체용 예시를 나중에 다시 켜면서 딱지를 잊는 바로 그것입니다. */
   `var w = document.querySelector("#view .w"); if(w){
      var d = document.createElement("div"); d.className = "jn-ex";
      d.innerHTML = '<p class="jn-ex-h"><b>업체 카드는 이렇게 보입니다</b></p>' +
                    '<div class="jn-ex-b"><b>가나다 매입</b></div>';
      w.appendChild(d);
    }`],
  /* 시간 제한을 걷어내면 걸려야 합니다 — 멈추면 영원히 "보내는 중…". */
  ["접수가 멈추면 끊고 적은 글을 돌려준다",
   `window.amSend = function(failId, body){
      const btn = document.querySelector("form button[type=submit]");
      if(btn){ btn.disabled = true; btn.textContent = "보내는 중…"; }
      fetch("/api/quote", { method:"POST",
        headers:{ "content-type":"application/json" }, body: JSON.stringify(body) });
      return false;                      /* 시간 제한이 없던 그때 */
    };`],
  /* ⚠️⚠️ "가격은 10건 이상 · 기준일 있는 것만 낸다" 되돌리기를
     **지웠습니다** (2026-10-31). 그 검사는 창업 · 폐업 가격 데이터와
     함께 없어졌는데 이 줄만 남아 `? 검사를 못 찾음` 으로 세어지고
     있었습니다 — 그대로 두면 "되돌려 본 적 있다" 고 믿게 되는데
     되돌릴 검사가 없습니다. ⚠️ **검사 이름을 바꾸거나 지우면 여기도
     같이** 보세요 (이 저장소가 두 번 겪은 자리입니다). */
  ["입점 배지와 업체찾기가 같은 규칙으로 센다",
   `window.amProvidersInCat = function(){ return 99; };`],
  /* 조사를 손으로 적던 그때 — ⚠️ `koWith` 를 바꿔치기해서는 안 됩니다.
     그러면 **다시 그리지 않아** 화면 글자가 그대로라 엉뚱하게 통과/실패
     합니다 (처음에 그렇게 짰다가 "인수인계는 가 화면에 있습니다" 라는
     앞뒤 안 맞는 말로 걸렸습니다). 실제 사고는 **화면에 찍힌 글자**가
     틀린 것이므로, 글자를 그때처럼 바꿔 놓습니다. */
  ["브랜드 이름 뒤 조사를 손으로 적지 않는다",
   `const nm = (window.AM_BRAND || {}).name || "";
    const right = window.koWith(nm, "은는").slice(nm.length);
    const wrong = right === "은" ? "는" : "은";
    document.querySelectorAll(".ft-role, .note-box").forEach(function(e){
      e.textContent = e.textContent.split(nm + right).join(nm + wrong);
    });`],
  /* 하지 않는 저장을 한다고 적어 두면 걸려야 합니다 (절대 규칙 5). */
  ["견적: 요청을 저장한다는 말과 실제가 같다",
   `document.querySelector("#q-f .note-mid").textContent =
      "보내고 나면 이 브라우저에 요청 내용이 남아, 아래에서 비교하실 수 있습니다.";`],
  /* ⚠️ 되돌리기가 **없는 요소**를 집으면 터지고, 그러면 "검사가 안
     잡는다" 가 아니라 **되돌리기가 틀린** 것입니다 (이 저장소에서
     아홉 번째). 2026-10-09 시안으로 히어로 카드의 `.hpk-d` 가 체크
     셋(`.hpk-ck`)으로 바뀌었습니다 — 집는 자리를 같이 옮깁니다. */
  /* ⚠️ 2026-10-11 최종 디자인 §3 — 히어로의 체크 셋(.hpk-ck)이
     없어졌습니다. **없는 요소를 집으면 되돌리기가 터지고**, 그러면
     "검사가 안 잡는다" 가 아니라 되돌리기가 틀린 것입니다 (열 번째).
     지금은 전문관 서비스 칸에 지어낸 수를 박아 봅니다. */
  /* ⚠️ 2026-10-16 §3 — 전문관 서비스 격자(.hsv-g)가 메인에서
     내려왔습니다. **없는 요소를 집으면 되돌리기가 터지고**, 그러면
     "검사가 안 잡는다" 가 아니라 되돌리기가 틀린 것입니다 (열한 번째).
     지금은 진입 카드의 대표 서비스 칸에 지어낸 수를 박아 봅니다. */
  /* ⚠️ 2026-10-17 §6 — 대표 서비스 칸이 .bent-sv 가 됐고 안에 아이콘
     이 들어 있습니다. svg 를 지우지 않게 **이름 칸(span)만** 집습니다. */
  ["지어낸 실적 숫자가 메인에 없다",
   /* ⚠️ 2026-10-20 시안 1(확대본) — 카드가 간결해져 대표 서비스
      칸이 없어졌습니다. 지어낸 수를 박는 자리를 카드의 한 줄로
      옮깁니다 — 없는 요소를 집으면 되돌리기가 터져 "검사가 안
      잡는다" 로 보입니다 (이 저장소에서 열두 번 겪은 자리). */
   /* ⚠️⚠️ 2026-10-29 PHONEWAY — 카드 한 줄이 .pww-l 입니다. .bent-tx 는
      메인에 **없으므로** 그걸 집으면 되돌리기가 터지고 "검사가 안
      잡는다" 로 보입니다 (이 저장소에서 열세 번 겪은 자리). */
   /* ⚠️⚠️ 2026-10-29 오렌지 시안 — 카드 한 줄이 .pwbz-d 입니다.
      .pww-l 은 메인에 **없으므로** 그걸 집으면 되돌리기가 터지고
      "검사가 안 잡는다" 로 보입니다 (이 저장소 열네 번째). */
   `document.querySelector(".pwbz-d").textContent = "누적 거래 32,581건";`],
  /* ⚠️⚠️ **2026-10-13 §5 — 히어로에는 h1 이 없습니다.** 전에는 h1
     글자를 바꿔 되돌렸는데, 지금 검사가 보는 것은 **두 판의 크기 ·
     무게**입니다 (한쪽을 좁히면 그게 "덜 중요한 것" 이라는 말입니다).
     글자를 바꾸면 아무 일도 안 나서 "검사가 안 잡는다" 로 보입니다 —
     검사가 아니라 되돌리기가 틀린 자리, 열 번째입니다. */
  /* ⚠️⚠️ **2026-10-17 §4 — 히어로가 메인에서 빠졌습니다.** 검사가
     보는 것은 "첫 구간이 진입 카드 셋이고 머리말이 짧은가" 라서,
     되돌리기도 그쪽입니다 — 머리말을 히어로만큼 키웁니다.
     ⚠️ .bhero 는 메인에 **없으므로** 그걸 집으면 되돌리기가 터집니다
     (이 저장소에서 열한 번 겪은 자리). */
  /* ⚠️⚠️ **2026-10-22 — 히어로가 돌아왔다가 같은 날 "최상단 디자인
     최종 변경" §2 로 다시 빠졌습니다.** 검사가 보는 것은 "첫 구간이
     진입 카드 넷 · h1 이 거기 하나 · **번호가 01~04**" 이고, 되돌리기는
     그중 번호를 끊습니다 — 넷째 카드를 지워 01·02·03 에서 끝냅니다
     (사장님이 실제로 걸린 자리입니다).
     ⚠️ .bhero 는 메인에 **없으므로** 그걸 집으면 되돌리기가 터집니다
     (이 저장소에서 열두 번 겪은 자리). */
  /* ⚠️⚠️ **2026-10-29 오렌지 시안 — 히어로(pwh) 다음이 기기 선택(pwd)
     이고, 그 다음이 사업 배너(pwbz) · 바로가기(pwq) 입니다.** 검사가
     보는 것은 다섯입니다 — 구간 일곱의 차례 · h1 이 히어로에 하나 ·
     기기 · 배너 · 바로가기 수가 **데이터에서 오는 것** · 지킬 수 없는
     약속 없음 · 기업 · 수출은 문의 단계라고 밝힐 것.
     되돌리기는 그중 **수**를 끊습니다 — 배너 한 장을 지워 넷이 셋이
     되게 합니다 (화면만 바뀌고 데이터는 그대로입니다).
     ⚠️ .pww-c · .bent-c 는 지금 메인에 **없으므로** 그걸 집으면
     되돌리기가 터집니다 (이 저장소에서 열여섯 번 겪은 자리). */
  ["메인은 히어로 다음이 핵심 서비스이고 구간 수가 데이터와 같다",
   `document.querySelector(".pwbz-g > li:last-child").remove();`],
  /* ⚠️⚠️ 되돌리기는 **검사가 실제로 보는 것**을 망가뜨려야 합니다.
     검색 가는 길을 지울 때 입력칸만 지우고 돋보기를 남겼다가 "검사가
     안 잡는다" 로 보였던 적이 있습니다 — 검사가 아니라 되돌리기가
     틀렸던 것입니다. 여기서는 바로가기 하나를 가짜 링크로 만듭니다
     (지시서 §26 "버튼 → 실제 Link"). */
  /* ⚠️⚠️ 되돌리기는 **검사가 실제로 보는 것**을 망가뜨려야 합니다.
     검색 가는 길은 입력칸과 돋보기 **둘**이라, 한쪽만 지우면 "검사가
     안 잡는다" 로 보입니다 — 둘 다 지웁니다 (이 저장소에서 겪었습니다). */
  /* ⚠️⚠️ **규칙이 두 번 뒤집혀서 되돌리기도 두 번 바뀌었습니다.**
     ① 2026-10-13 §3 — 메인에서는 검색이 없어야 했습니다 (그때는
        .is-home 을 떼는 것이 되돌리기였습니다).
     ② 2026-10-15 §3 — 다시 **있어야** 합니다. 그래서 지금은 **지우는
        쪽**이 되돌리기입니다.
     ⚠️ 검색 가는 길은 입력칸과 돋보기 **둘**이라 한쪽만 지우면 "검사가
     안 잡는다" 로 보입니다 — 둘 다 지웁니다 (겪은 자리입니다). */
  ["어느 화면에서나 검색으로 가는 길이 있고 메인이 두 갈래로 갈린다",
   `document.querySelectorAll(".hd .hd-s, .hd .hd-ic-s")
      .forEach(function(e){ e.style.display = "none"; });`],
  /* ⚠️⚠️ **폐업이 빨강으로 넘어가던 그때.** 빨강은 "폐업은 나쁜 것"
     이라는 말이 됩니다 — 이 저장소가 여러 곳에 못박아 둔 자리입니다. */
  /* ⚠️ 검사가 보는 자리가 전문관 카드(.mhall-c.hall-close)의 **바탕**
     으로 옮겨갔습니다 — 글자색을 칠하면 아무 일도 안 납니다. */
  /* ⚠️ 2026-10-16 §2-1 — 셋이 **서로 달라야** 합니다. 폐업 카드를
     창업과 같은 색으로 칠해 "색이 겹칩니다" 를 만듭니다.
     ⚠️⚠️ 2026-10-26 — 집는 자리가 **번호 알약**입니다. 브라운 통일로
     카드 면이 넷 다 같은 크림이 되어 검사도 거기를 재는데, 카드 면을
     칠하면 **아무 일도 안 납니다** ("전 true → 후 true") — 되돌리기가
     틀린 자리이고 이 저장소에서 열두 번 겪었습니다. 메인을 전면 리뉴얼
     직전으로 되돌릴 때 이 줄까지 같이 되돌렸다가 실제로 걸렸습니다. */
  /* ⚠️⚠️ 2026-10-29 오렌지 시안 — 사업 배너 둘의 면 색을 같게 만들어
     봅니다. 재는 자리가 **카드 자신의 면**(.pwbz-c)이라 거기 집습니다 —
     2026-10-30 §2-6 으로 **셋**이 됐고, 셋이 **일부러 같은 딥 브라운**
     입니다 — 색으로는 되돌릴 것이 없어서 **무게**를 끊습니다
     (둘째를 좁히고 낮춥니다). ⚠️ grid 의 stretch 를 덮어야 하니
     폭과 높이를 같이 줍니다. */
  ["안내 배너 셋의 무게가 같고 흰 글자가 읽히는 면이다",
   `const e = document.querySelectorAll(".pwbz-c")[1];
    e.style.width = "60%"; e.style.minHeight = "0"; e.style.height = "70px";`],
  /* ⚠️ 2026-10-11 간소화 §2 — 연결 구간이 메인에서 내려와 되돌릴
     요소가 없습니다. **없는 요소를 집으면 되돌리기가 터지고**, 그러면
     "검사가 안 잡는다" 로 보입니다 (이 저장소에서 아홉 번 겪은 자리).
     검사는 "없으면 건너뜀" 으로 남겨 두었으니 되살리시는 날 이 줄도
     같이 되살리세요. */
  /* ⚠️⚠️ 2026-10-31 — 이 되돌리기가 **없어진 선택자**(.mbr-p .ph ·
     창업 · 폐업 연결 구간)를 집고 있었습니다. 아무 일도 안 하니
     "검사가 안 잡는다" 로 보입니다 — **검사가 아니라 되돌리기가
     틀린** 자리이고 이 저장소에서 열일곱 번째입니다.
     ⚠️ 쉼표로 나눠 찾습니다 — CSS 쪽이 ".dvc-ph .ph, .dvc-im" 처럼
     묶음이라 글자를 통째로 견주면 또 못 찾습니다. */
  ["사진 자리가 비율을 무시하고 늘어나지 않는다",
   `for(const sh of document.styleSheets){
      let rules; try { rules = sh.cssRules; } catch(e){ continue; }
      if(!rules) continue;
      for(const r of rules){
        const parts = (r.selectorText || "").split(",").map(s => s.trim());
        if(parts.indexOf(".dvc-ph .ph") >= 0) r.style.objectFit = "fill";
      }
    }`],
  /* ⚠️ grid 의 stretch 를 덮어야 합니다 — 폭과 높이를 같이 줄입니다. */
  /* ⚠️ grid 의 stretch 를 덮어야 합니다 — 폭과 높이를 같이 줄입니다.
     ⚠️⚠️ 2026-10-29 오렌지 시안 — 재는 자리가 **기기 선택 카드 넷**
     (2026-10-30 §2-3)입니다. ⚠️ .pwd-g .dvc 는 메인에 없어졌습니다 —
     그걸 집으면 되돌리기가 **아무 일도 안 하고** "검사가 안 잡는다" 로
     보입니다 (이 저장소에서 열여섯 번 겪은 자리). */
    ["핵심 서비스 카드 여섯의 크기가 같다",
   `const e3 = document.querySelectorAll(".pwsv-g .pwsv-c")[2];
   e3.style.width = "70%"; e3.style.minHeight = "0"; e3.style.height = "80px";`],
  ["메인 구간 차례가 지시서와 같다",
   `const v = document.getElementById("view");
    v.insertBefore(v.children[3], v.children[1]);`],
  /* ⚠️ 되돌리기는 **규칙 쪽**을 망가뜨려야 합니다 — 검사가 1280px 에서
     돌아서 화면을 접어 봐도 아무 일이 안 납니다 (이 저장소가 "되돌리기가
     없는 요소를 집음" 으로 여덟 번 겪은 자리입니다). */
  ["폰에서 긴 묶음을 접어 둔다",
   `for(const sh of document.styleSheets){
      let rules; try { rules = sh.cssRules; } catch(e){ continue; }
      if(!rules) continue;
      for(const r of rules){
        if(!r.media || r.media.mediaText.indexOf("900px") < 0) continue;
        for(const q of (r.cssRules || []))
          if(q.selectorText === ".pkg-l.is-fold") q.style.display = "grid";
      }
    }`],
  /* ⚠️ 색을 **글자로 적지 마세요.** "[7] 을 민트로" 로 적어 두었더니
     구간 차례가 바뀌면서 그 자리가 원래 민트라 **되돌리기가 no-op** 이
     됐고, 검사가 멀쩡한데 "안 잡는다" 로 보였습니다. 이웃의 **실제
     배경을 읽어서** 같게 만듭니다 — 차례가 또 바뀌어도 삽니다. */
  ["이웃한 두 구간이 붙어 보이지 않는다",
   `const S = document.querySelectorAll("#view > section");
    const prev = getComputedStyle(S[S.length - 3]).backgroundColor;
    S[S.length - 2].style.background = prev;`],
  /* ⚠️ 랜딩을 없앴으므로 "랜딩에 기능을 끌어오지 않았다" 는 반대가
     됐습니다 — 이제 랜딩 구간이 **되살아나는 것**을 되돌려 봅니다. */
  ["메인(/)이 중간 소개 화면이 아니다",
   `document.querySelector("#view").insertAdjacentHTML("afterbegin",
      "<section class=lh>랜딩이 돌아옴</section>");`],
  /* ⚠️⚠️ 2026-10-17 §3-2 — 메인 본문이 **다시 밝아졌습니다.** 그래서
     되돌리기도 다시 뒤집혔습니다: §3-2 가 **이름까지 적은** 구간
     (선택받는 이유)을 어둡게 해서 "밝지 않습니다" 를 만듭니다.
     ⚠️ 아무 구간이나 집으면 안 됩니다 — 양도양수 배너와 하단 CTA 는
     지시서가 다크로 정한 자리라 어둡게 해도 아무 일이 안 납니다
     (되돌리기가 틀린 자리, 이 저장소에서 열한 번 겪었습니다). */
  ["메인 구간 바탕은 밝고 그 표시가 메인 밖으로 안 샌다",
   /* ⚠️ 2026-10-25 §1 — .bwhy 가 내려가서 §3-2 가 이름까지 적은
      자리를 **히어로**가 받습니다 (§1-01 "BRIGHT PREMIUM 유지").
      없는 요소를 집으면 되돌리기가 터집니다 (열세 번째). */
   /* ⚠️ 2026-10-29 PHONEWAY — §2 가 이름까지 적은 자리를 **히어로
      (pwh)** 가 받습니다. .bhero 는 메인에 **없으므로** 그걸 집으면
      되돌리기가 터집니다 (열네 번째). */
   `document.querySelector(".pwh").style.backgroundColor = "#0B1F36";`],
  /* 짝 검사 — 속화면에 메인 표시가 새면 걸려야 합니다 */
  ["속화면은 그대로 밝고 메인 표시가 안 묻었다",
   `document.documentElement.classList.add("ivh");`],
  /* ⚠️ 길이 **둘**입니다 (넓은 화면은 입력칸, 좁은 화면은 돋보기).
     하나만 지우면 다른 하나가 남아서 되돌리기가 헛돕니다 — 실제로
     돋보기만 지웠다가 "검사가 안 잡는다" 로 보였습니다. */
  ["어느 화면에서나 검색으로 가는 길이 있다",
   `document.querySelectorAll('.hd a[href="/search"], .hd .hd-s')
      .forEach(function(e){ e.remove(); });`],
  /* ⚠️⚠️ **골드 검사에 되돌리기가 없었습니다.** 2026-10-13 §2 로
     행동색이 브라운이 되자 그 검사가 "파랑이 아닙니다" 로 걸렸는데,
     되돌리기가 없어서 **고친 뒤 실제로 잡는지 아무도 못 봤을**
     자리였습니다. 금색을 실제로 칠해 봅니다. */
  ["골드가 버튼 · 링크의 행동색을 빼앗지 않는다",
   `document.querySelector(".btn-b").style.background = "#D5B998";`],
  ["헤더가 거의 불투명해서 밑의 글자가 안 비친다",
   `document.querySelector(".hd").style.background = "rgba(255,255,255,.5)";`],
  ["입점 화면이 업체 0곳을 0 이라고 말한다",
   `document.querySelectorAll(".join-n")[0].textContent = "12곳";`],
  ["입점 화면에 지킬 수 없는 약속이 없다",
   `document.querySelector(".jn-now-t h2").textContent = "월 30건의 요청을 보장합니다";`],
  ["입점 화면이 연락처는 나중에 간다고 밝힌다",
   `document.querySelectorAll(".jn-req-l > li > b")[0].textContent = "연락처";`],
  ["검색이 기종과 상품을 같이 찾는다",
   /* 기종 색인을 비웁니다 — 2026-10-29 전까지 실제로 그랬습니다
      (예순다섯이 색인에 아예 없어서 "갤럭시 S24" 가 0건이었습니다).
      ⚠️ 글 본문 쪽과 달리 캐시가 없습니다 — js/pages/search.js 가
      amSearch() 를 부를 때마다 AM_MODELS 를 다시 훑습니다. */
   `window.AM_MODELS = [];`],
  ["카드가 구간 바탕과 같은 색이 아니다",
   /* ⚠️ 바탕만 같게 하면 안 잡힙니다 — **테두리가 있으면 카드로
      읽힌다**고 봐 주기 때문입니다. 그림자로만 보이는 상태를
      만들려면 테두리도 같이 없애야 합니다. */
   /* ⚠️⚠️ 전에는 **구간(section)의 배경**을 칠했습니다. 2026-10-06 에
      paintTones() 가 겹치는 톤을 밀면서 그 구간의 톤 클래스가 빠졌고,
      구간 배경이 **투명**이 되자 카드까지 투명으로 칠해 아무것도
      안 잡게 됐습니다 — 검사가 아니라 **되돌리기가 틀린** 열한 번째
      자리입니다. 검사가 보는 것과 똑같이 "실제로 뒤에 보이는 면" 을
      찾아서 칠합니다. */
   /* ⚠️ 2026-10-08 — 메인에 `.mi-g`(업종 카드)가 없습니다. 지울 것이
      **실제로 있는** 카드를 고릅니다 — 없는 것을 집으면 되돌리기가
      터지거나 아무 일도 안 나서 "검사가 안 잡는다" 로 보입니다
      (이 저장소에서 다섯 번 겪은 자리입니다). */
   /* ⚠️ 2026-10-11 최종 디자인 — .msvc-g · .mti-c · .hpk 가 전부
      메인에서 내려왔습니다. 지금 있는 카드는 계산도구(.mcal-g > li) ·
      절차(.mstp-g > li) · 전문관(.mhall-c) 입니다. */
   /* ⚠️ 2026-10-16 §3 — 지금 메인에 있는 카드는 진입(.bent-c > a) ·
      까닭(.bwhy-c) · 절차(.bstep-c) · 배너(.bban-c > a) 입니다.
      **없는 요소를 집으면 되돌리기가 터집니다** (열한 번째). */
   /* ⚠️ 2026-10-30 전면 리뉴얼 §2 — 지금 메인의 카드는 핵심
      서비스(.pwsv-c) · 브랜드(.pwbr-c) · 상품(.pwpd-c · 0건이면 .pwpd-0) ·
      안내 배너(.pwbz-c) · 이용 방법(.pwst-c) · 고지(.pwt-c) 입니다.
      아래 || 사슬의 .pws-c · .pww-c 는 **옛 구간을 되살리실 때를 위한
      것**이고 지금은 .pwsv-c 가 먼저 맞습니다.
      **없는 요소를 집으면 되돌리기가 터집니다** (열네 번째). */
   `const a = document.querySelector(".pwsv-c") ||
             document.querySelector(".pwst-c") ||
             document.querySelector(".pws-c") ||
             document.querySelector(".pww-c");
    const back = (function(el){
      let e = el.parentElement;
      while(e){
        const c = getComputedStyle(e).backgroundColor;
        if(c && c !== "rgba(0, 0, 0, 0)" && c !== "transparent") return c;
        e = e.parentElement;
      }
      return getComputedStyle(document.body).backgroundColor;
    })(a);
    a.style.border = "none";
    a.style.boxShadow = "none";
    a.style.background = back;`],

  /* ══ 메인 카드 (2026-10-06) ═════════════════════════════════════ */
  /* 아이콘을 손으로 적어 둔 표로 되돌리면 — 표에 없는 도구가 전부
     같은 기본 아이콘이 됩니다 */
  /* ⚠️ 보정표가 낡았을 때와 **같은 모양**으로 망가뜨립니다 — 아이콘
     하나의 보정 g 를 줄여 봅니다. 표를 고치는 것이 아니라 **그려진
     것**을 건드려야 맞습니다 (검사가 표를 안 보고 화면을 재니까요).
     ⚠️ 집을 것이 실제로 있는 화면이라야 합니다 — 메인에는 컬러
     아이콘이 스물여덟 장 있습니다 (없는 요소를 집으면 아무 일도 안
     나서 "검사가 안 잡는다" 로 보입니다 — 이 저장소에서 열한 번). */
  ["컬러 아이콘이 모두 같은 크기로 그려진다",
   `const g = document.querySelector("#view svg.ia > g");
    if(g) g.setAttribute("transform", "translate(12 12) scale(0.5)");`],
  /* ══ 2026-10-11 UI/UX 지시서 — 전문관 넷 ═══════════════════════ */
  /* 한 전문관 안에서 두 칸이 같은 아이콘을 쓰면 걸려야 합니다 —
     열두 칸에 같은 그림이 둘이면 무엇이 무엇인지 흐려집니다.
     ⚠️ 되돌리기는 **그려진 뒤에** 돕니다. DOM 을 직접 건드립니다. */
  ["메인 아이콘이 비지 않고 한 묶음 안에서 겹치지 않는다",
   /* ⚠️ 2026-10-25 §1 — .bwhy-i 가 내려가서 집을 것이 없습니다
      (t[1] 이 undefined 라 되돌리기가 터집니다 · 열네 번째).
      지금 메인에서 한 묶음 안에 아이콘이 여럿인 곳은 진입 카드 넷과
      직접 찾기 여덟입니다. */
   /* ⚠️ 2026-10-29 PHONEWAY — 한 묶음 안에 아이콘이 여럿인 곳은
      구매 갈래 넷(.pws-c i)과 이용 방법 다섯(.pwst-c i)입니다.
      .bdir-i 는 메인에 없어 t[1] 이 undefined 라 터집니다 (열네 번째). */
   /* ⚠️ 2026-10-30 전면 리뉴얼 — 한 묶음 안에 아이콘이 여럿인 곳은
      **핵심 서비스 여섯(.pwsv-i)** 과 이용 방법 다섯입니다.
      .pwq-c 는 메인에 없어 t[1] 이 undefined 라 터집니다 (열다섯 번째). */
   `const t = [].slice.call(document.querySelectorAll("#view .pwsv-i svg"));
    t[1].innerHTML = t[0].innerHTML;`],

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
    /* ⚠️⚠️ **검사 이름에 백틱을 쓰지 마세요.** 쓰면 여기 정규식이
       본문을 엉뚱하게 잘라 내고, eval 이 문자열이 아닌 것을 돌려줘서
       `body.indexOf is not a function` 으로 터집니다. 실제로 한 번
       그랬습니다 — 조용히 넘기면 그 검사만 escape 탐지 밖이 됩니다. */
    if(typeof body !== "string"){
      console.log("\n❌ 검사 본문을 못 읽었습니다: " + m[1]);
      console.log("   검사 이름에 백틱이 들어갔는지 보세요.\n");
      return false;
    }
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
  /* ⚠️⚠️ **검사 본문이 실제로 돌 수 있는 코드인지 먼저 봅니다.**
     `node --check check.js` 는 **문자열 안을 안 봅니다** — 본문이
     문법적으로 깨져 있어도 통과하고, 그 검사만 조용히 안 돕니다.
     실제로 겪은 것 둘 —
       · 주석에 백틱 (열여섯 번)  → 문자열이 거기서 끝남
       · 주석에 별표 뒤 빗금      → **블록 주석이 거기서 닫힘**
         (굵게 표시로 적은 "별표별표빗금startup..." 이 그랬습니다)
     둘 다 브라우저를 띄우기 전에 여기서 잡힙니다. */
  {
    const broke = [];
    const re3 = /await f\("([^"]+)",\s*"([^"]*)",\s*`([\s\S]*?)`\);/g;
    let m3;
    while((m3 = re3.exec(src))){
      let body; try { body = eval("`" + m3[3] + "`"); } catch(e){ continue; }
      if(typeof body !== "string") continue;
      try { new Function("return (async()=>{ " + body + " })()"); }
      catch(e){ broke.push(m3[1] + "   — " + e.message); }
    }
    if(broke.length){
      console.log("\n❌ 검사 본문이 문법적으로 깨졌습니다 (그 검사는 안 돕니다):");
      broke.forEach(function(n){ console.log("   · " + n); });
      console.log("   주석에 백틱, 그리고 별표 뒤 빗금을 쓰지 마세요.\n");
      return false;
    }
  }
  if(bad.length){
    console.log("\n❌ 검사 본문에서 백슬래시가 먹었습니다:");
    bad.forEach(function(n){ console.log("   · " + n); });
    console.log("   두 겹으로 적으세요. 이 검사들은 아무것도 안 잡습니다.\n");
    return false;
  }
  console.log("✅ 검사 본문이 전부 돌 수 있는 코드입니다 (백슬래시 · 백틱 · 주석 닫힘)");
  return true;
}

/* ══════════════════════════════════════════════════════════════════
   전수 점검(AUDIT)의 **묶음 검사**도 되돌려 봅니다.

   `await f(...)` 꼴이 아니라 화면마다 도는 검사라 위의 `CASES` 로는
   못 잡습니다. 그런데 바로 그 묶음에서 사고가 났습니다 — 어두운 면을
   랜딩과 서비스 메인에서만 재고 있었고, 푸터(547px)가 짧은 화면에서는
   **43.9%** 였는데 **78개 화면이 검사 밖**이었습니다.

   그래서 푸터를 일부러 다시 어둡게 해 놓고 "어두운 면이 15% 넘음" 이
   실제로 실패로 바뀌는지 봅니다. ⚠️ 짧은 화면에서 재세요 — 긴 화면만
   보면 통과합니다.
   ══════════════════════════════════════════════════════════════════ */
const BAD = eval(src.match(/^const BAD = (.+);$/m)[1]);
const AUDIT = eval("`" + src.match(/const AUDIT = `([\s\S]*?)`;\n/)[1] + "`");

async function proveAudit(pg){
  let bad = 0;

  /* ⓪ 머리 · 푸터 · 아래 네비가 하나가 아님 (2026-10-20).
     되돌리기 **둘**입니다 —
       ① 푸터를 한 벌 더 그려 봅니다 (렌더링 구조가 덧붙이기로 바뀐 꼴)
       ② 맨 아랫줄에 가로줄을 하나 더 그어 봅니다 (푸터 하나가 덩이
          둘로 갈려 "반복" 으로 읽히던 그 꼴)
     ⚠️ 하나로 묶지 마세요 — ① 만 보면 "줄이 늘어나는 것" 을, ② 만
     보면 "푸터가 두 벌이 되는 것" 을 영원히 놓칩니다. */
  {
    await pg.goto(ROOT + "/", { waitUntil:"load" });
    await pg.waitForTimeout(260);
    const before = (await pg.evaluate(AUDIT)).chrome;

    await pg.evaluate(() => {
      const ft = document.querySelector(".ft");
      if(ft) ft.parentNode.appendChild(ft.cloneNode(true));
    });
    await pg.waitForTimeout(60);
    const dup = (await pg.evaluate(AUDIT)).chrome;
    const ok1 = before.length === 0 && dup.some(x => x.indexOf("푸터가 2개") >= 0);
    if(!ok1) bad++;
    console.log((ok1 ? "✅" : "❌") + " 머리 · 푸터 · 아래 네비가 하나가 아님 ① 푸터 두 벌" +
      "  [지금 " + JSON.stringify(before) + " → 한 벌 더 그리면 " +
      JSON.stringify(dup).slice(0,70) + "]");

    /* 되돌려 놓고 ② */
    await pg.goto(ROOT + "/", { waitUntil:"load" });
    await pg.waitForTimeout(260);
    await pg.evaluate(() => {
      /* `.ft-tail` 이 제 가로줄을 다시 들고 있던 꼴 — 다만 그것은
         `.ft-end` **안**이라 안 세집니다. 세는 자리(`.ft .w` 의 바로
         아래 자식)에 긋습니다. */
      const g = document.querySelector(".ft > .w > .ft-g");
      if(g) g.style.borderTop = "1px solid #888";
    });
    await pg.waitForTimeout(60);
    const two = (await pg.evaluate(AUDIT)).chrome;
    const ok2 = two.some(x => x.indexOf("가로줄이 2개") >= 0);
    if(!ok2) bad++;
    console.log((ok2 ? "✅" : "❌") + " 머리 · 푸터 · 아래 네비가 하나가 아님 ② 가로줄 둘" +
      "  [가로줄을 하나 더 그으면 " + JSON.stringify(two).slice(0,70) + "]");
  }

  /* ⓪-2 flex 칸에 글과 태그가 섞임 (2026-10-25).
     메인 범위 숫자 띠의 ⓘ 줄이 실제로 그 꼴이었습니다 — flex 에
     맨글 둘 + `<b>` 하나라 320px 에서 "서비 / 스" · "분류 / 기준" 으로
     쪼개졌습니다. 고친 뒤 되돌려 봅니다: 감싼 태그를 풀어 맨글로
     되돌려 놓습니다.
     ⚠️ 검사는 grid 만 보고 있었고 flex 는 **아무도 안 보고**
     있었습니다 — 이 되돌리기가 그것을 지킵니다. */
  {
    /* ⚠️⚠️ **재는 화면이 메인입니다** (2026-10-29 PHONEWAY).
       실제 그 꼴이던 .msvc-sc-n(범위 숫자 띠의 ⓘ 줄)은 메인에서
       내려간 구간 안이라 지금 **어느 화면에도 안 그려집니다** —
       거기서 집으면 되돌리기가 아무 일도 안 해서 "검사가 안 잡는다"
       로 보입니다 (열네 번째).
       ⚠️⚠️ /operation 의 .pks-r 로 옮겼다가 **또 헛돌았습니다** —
       그쪽은 접힌 묶음 안이라 **폭 · 높이가 0** 이고, AUDIT 의
       vis() 가 그런 칸을 건너뜁니다 (열다섯 번째). 지금은 메인
       히어로의 신뢰 요소 띠(.pwh-tr-g li — 아이콘 + span>(b+span))
       이고, **보이는지(폭 · 높이)까지** 보고 고릅니다.
       ⚠️⚠️ **선택자를 박아 두지 않았습니다** — 아래 걷기가 조건
       (보이는 flex + 자식 span 안에 태그 둘 이상)으로 **그 자리에서
       찾습니다.** 히어로가 다시 짜일 때마다 집는 자리가 바뀌는데,
       박아 두면 그때마다 되돌리기가 조용히 헛돕니다 (2026-10-30 에
       히어로를 고치면서 옛 .pwh-ch li 가 없어졌고, 걷기가 이 띠를
       알아서 찾았습니다). 고치실 때는 **재서** 확인하세요. */
    await pg.goto(ROOT + "/", { waitUntil:"load" });
    await pg.waitForTimeout(260);
    const before = (await pg.evaluate(AUDIT)).mix;
    const did = await pg.evaluate(() => {
      /* ⚠️⚠️ **감싼 태그를 풀기만 하면 아무 일도 안 납니다** (열다섯 번째).
         `.pks-r > span` 안이 `<b>` + `<i>` 라 **둘 다 태그**이고, 풀어
         봐야 맨글이 **0개**입니다 — 검사는 "flex 안에 맨글이 둘 이상"
         을 보는데 그 꼴이 안 만들어져서 "검사가 안 잡는다" 로
         보였습니다. **검사가 아니라 되돌리기가 틀린** 자리입니다.
         ⚠️ 실제로 겪은 꼴(2026-10-25 범위 숫자 띠)은
         `아이콘 + 맨글 + <b> + 맨글` 입니다 — 태그 하나에 맨글 둘.
         그래서 감싼 태그를 풀고 **안쪽 태그를 맨글로 되돌립니다.** */
      const all = [].slice.call(document.querySelectorAll("#view *"));
      for(const p of all){
        if(getComputedStyle(p).display !== "flex") continue;
        /* ⚠️⚠️ **보이는 칸만** — AUDIT 의 vis() 가 폭 · 높이 0 인 칸을
           건너뛰기 때문에, 접힌 묶음 안을 집으면 아무 일도 안 납니다. */
        const r = p.getBoundingClientRect();
        if(r.width <= 0 || r.height <= 0) continue;
        const sp = p.querySelector(":scope > span");
        if(!sp) continue;
        const kids = [].slice.call(sp.childNodes);
        const tags = kids.filter(function(n){ return n.nodeType === 1; });
        if(tags.length < 2) continue;
        /* 감싼 태그를 풀고 */
        while(sp.firstChild) p.insertBefore(sp.firstChild, sp);
        sp.remove();
        /* 안쪽 태그를 맨글로 — 이제 flex 에 맨글 둘이 섞입니다 */
        tags.forEach(function(t){
          t.parentNode.replaceChild(
            document.createTextNode(" " + (t.textContent || "x") + " "), t);
        });
        return true;
      }
      return false;
    });
    await pg.waitForTimeout(60);
    const after = (await pg.evaluate(AUDIT)).mix;
    const ok = did && before.length === 0 &&
      after.some(x => x.indexOf("flex 에 맨글") >= 0);
    if(!ok) bad++;
    console.log((ok ? "✅" : "❌") + " grid · flex 칸에 글과 태그가 섞임 (flex)" +
      "  [지금 " + JSON.stringify(before) + " → 감싼 태그를 풀면 " +
      JSON.stringify(after).slice(0,70) + "]");
  }

  /* ① 본문(푸터 제외) 어두운 면 — 구간 하나를 짙게 칠해 봅니다.
     ⚠️⚠️ **전에는 푸터를 어둡게 해서 쟀습니다.** 2026-10-13 지시서
     §12 로 푸터가 **이미 짙은 에스프레소**가 되었고, ① 은 푸터를
     분자에서 빼서 재기 때문에 그 되돌리기는 **아무 일도 안 나서**
     "검사가 안 잡는다" 로 보였을 것입니다 — 이 저장소가 여러 번
     겪은 "되돌리기가 틀린" 자리입니다. 지울 것이 아니라 **본문을**
     어둡게 해야 합니다. */
  /* ⚠️ 2026-10-31 — /tools 가 창업 · 폐업과 함께 없어졌습니다.
     /shop 은 구간 둘 · /my 는 넷이라 집을 것이 실제로 있습니다 (재 봤습니다). */
  for(const u of ["/search", "/shop", "/my"]){
    await pg.goto(ROOT + u, { waitUntil:"load" });
    await pg.waitForTimeout(260);
    const before = (await pg.evaluate(AUDIT)).dark;
    await pg.evaluate(() => {
      /* ⚠️ 구간이 없는 화면도 있어서 #view 자신을 받침으로 둡니다 */
      const s = [...document.querySelectorAll("#view > section")];
      const t = s.length ? s[s.length-1] : document.getElementById("view");
      if(t) t.style.background = "#241B15";
    });
    await pg.waitForTimeout(60);
    const after = (await pg.evaluate(AUDIT)).dark;
    const ok = before.length === 0 && after.some(x => x.indexOf("본문") >= 0);
    if(!ok) bad++;
    console.log((ok ? "✅" : "❌") + " 어두운 면 ① 본문 15% 넘음 · " + u +
      "  [지금 " + JSON.stringify(before) +
      " → 본문 구간을 짙게 하면 " + JSON.stringify(after).slice(0,60) + "]");
  }

  /* ② 첫 화면 어두운 면 — **#view 의 min-height 를 걷어냅니다.**
     지시서 §12 의 짙은 푸터를 첫 화면에서 막아 주는 줄이 그것
     하나이니, 그것을 지우면 이 검사가 잡아야 합니다.
     ⚠️ 짧은 화면에서만 납니다 — /startup 같은 긴 화면은 min-height 가
     없어도 푸터가 첫 화면에 오지 않습니다 (되돌리기가 틀릴 자리). */
  /* ⚠️ compare 화면은 **안 씁니다** — 문서가 1,949px 이라 min-height 가
     없어도 푸터가 첫 화면에 안 옵니다. 되돌리기가 헛돌면 "검사가 안
     잡는다" 로 보입니다 (검사가 아니라 되돌리기가 틀린 자리). 이
     검사가 지키는 것은 **제일 짧은 화면**이라 /search 가 맞습니다. */
  for(const u of ["/search"]){
    await pg.goto(ROOT + u, { waitUntil:"load" });
    await pg.waitForTimeout(260);
    const before = (await pg.evaluate(AUDIT)).dark;
    await pg.evaluate(() => {
      const v = document.getElementById("view");
      if(v) v.style.minHeight = "0px";
    });
    await pg.waitForTimeout(60);
    const after = (await pg.evaluate(AUDIT)).dark;
    const ok = before.length === 0 && after.some(x => x.indexOf("첫 화면") >= 0);
    if(!ok) bad++;
    console.log((ok ? "✅" : "❌") + " 어두운 면 ② 첫 화면 15% 넘음 · " + u +
      "  [지금 " + JSON.stringify(before) +
      " → min-height 를 떼면 " + JSON.stringify(after).slice(0,60) + "]");
  }

  /* 제목 차례를 건너뜀 — h2 하나를 h3 으로 바꿔 놓고 봅니다.
     ⚠️ **고쳐 놓고 되돌리기를 안 넣으면** 그 검사가 실제로 잡는지
     아무도 못 봅니다 (골드 검사가 그렇게 비어 있었습니다). */
  /* ⚠️ **#view 안에 h2 가 실제로 있는 화면**이라야 합니다 — 재 본 값:
     / 7개 · /terms 19개 · /guide 3개. /shop · /search · /track 은 0개라
     거기서 집으면 되돌리기가 헛돕니다 (이 저장소에서 열여섯 번). */
  for(const u of ["/", "/terms", "/guide"]){
    await pg.goto(ROOT + u, { waitUntil:"load" });
    await pg.waitForTimeout(260);
    const before = (await pg.evaluate(AUDIT)).hord;
    const did = await pg.evaluate(() => {
      const v = document.getElementById("view");
      const h2 = v && v.querySelector("h2");
      if(!h2) return false;
      const h3 = document.createElement("h3");
      h3.innerHTML = h2.innerHTML;
      h2.replaceWith(h3);
      return true;
    });
    await pg.waitForTimeout(60);
    const after = (await pg.evaluate(AUDIT)).hord;
    const ok = did && before.length === 0 && after.length > 0;
    if(!ok) bad++;
    console.log((ok ? "✅" : "❌") + " 제목 차례를 건너뜀 · " + u +
      "  [지금 " + JSON.stringify(before) +
      " → h2 하나를 h3 으로 바꾸면 " + JSON.stringify(after).slice(0,60) + "]");
  }

  /* 제목 차례 — **푸터**도 보는가 (2026-10-26 에 넓혔습니다).
     ⚠️⚠️ 바로 위 되돌리기는 view 안의 h2 를 바꿉니다. 그러면 검사가
     view 안만 보던 때에도 통과해서, **넓힌 것이 실제로 무엇을 잡는지**
     아무도 못 봅니다 — 푸터 칸 머리말을 h4 로 되돌려서 잽니다.
     (그게 163개 화면에서 h2 → h4 로 건너뛰고 있던 바로 그 자리입니다.) */
  /* ⚠️ 푸터 칸 머리말(.ft-col h2)은 **180개 화면 전부에 다섯 개**입니다 */
  for(const u of ["/", "/guide"]){
    await pg.goto(ROOT + u, { waitUntil:"load" });
    await pg.waitForTimeout(260);
    const before = (await pg.evaluate(AUDIT)).hord;
    const did = await pg.evaluate(() => {
      const h = document.querySelector(".ft-col h2");
      if(!h) return false;
      const n = document.createElement("h4");
      n.innerHTML = h.innerHTML;
      n.className = h.className;
      h.replaceWith(n);
      return true;
    });
    await pg.waitForTimeout(60);
    const after = (await pg.evaluate(AUDIT)).hord;
    const ok = did && before.length === 0 && after.length > 0;
    if(!ok) bad++;
    console.log((ok ? "✅" : "❌") + " 제목 차례를 건너뜀 (푸터) · " + u +
      "  [지금 " + JSON.stringify(before) +
      " → 푸터 h2 를 h4 로 되돌리면 " + JSON.stringify(after).slice(0,60) + "]");
  }


  /* 제목이 비었음 — 2026-10-29 에 실제로 그랬습니다. PgHero() 의 칸
     이름을 h1 이 아니라 h 로 적어 **다섯 화면이 전부 빈 제목**으로
     나갔는데, 개수는 1 이라 "h1 이 딱 하나" 가 통과했습니다.
     ⚠️ 그래서 되돌리기도 **개수를 바꾸지 않고 글자만 비웁니다** —
     지우면 개수 검사에 걸려서 새 검사가 무엇을 잡는지 증명이 안 됩니다.
     ⚠️⚠️ **그런데 textContent 를 빈 문자열로 두면 그것도 개수 검사에
     걸립니다.** 빈 블록은 폭은 있어도 **높이가 0** 이라 vis() 가 떨어
     내고, 그러면 h1 이 0개가 되어 "제목(h1)이 없습니다" 가 먼저
     납니다 — 실제로 그렇게 나왔고 **검사가 아니라 되돌리기가 틀린**
     자리였습니다 (이 저장소에서 열세 번째). 이 검사가 혼자 잡는 것은
     **상자는 보이는데 낱말이 없는 제목**이라, 줄바꿈 안 되는 공백 한
     자를 넣습니다 — 그러면 높이가 생겨 개수는 1 이고, trim() 은 그
     글자를 지워서 "비었습니다" 가 납니다. */
  for(const u of ["/sell", "/guide"]){
    await pg.goto(ROOT + u, { waitUntil:"load" });
    await pg.waitForTimeout(260);
    const before = (await pg.evaluate(AUDIT)).h1;
    await pg.evaluate(() => {
      const h = document.querySelector("#view h1");
      /* U+00A0 — 그려지므로 높이가 생기고, trim() 이 지우므로 낱말은 0 */
      if(h) h.textContent = "\u00a0";
    });
    await pg.waitForTimeout(60);
    const after = (await pg.evaluate(AUDIT)).h1;
    const ok = before.length === 0 && after.some(x => x.indexOf("비었습니다") >= 0);
    if(!ok) bad++;
    console.log((ok ? "✅" : "❌") + " 제목(h1)이 비었음 · " + u +
      "  [지금 " + JSON.stringify(before) +
      " → 낱말만 비우면 " + JSON.stringify(after).slice(0,60) + "]");
  }

  /* 이웃한 두 구간이 붙어 보임 — 둘째 구간을 첫째와 같은 색으로
     돌려놓고 잡히는지 봅니다. ⚠️ 바탕을 **안 준** 구간도 봐야 합니다 —
     처음에 투명이라고 건너뛰었다가 업종 화면의 두 쌍을 놓쳤습니다. */
  /* ⚠️ 구간이 **셋 이상이고 바탕을 실제로 들고 있는** 화면이라야
     합니다 — 재 본 값: / 8개(8개가 바탕 있음) · /join 10개(9) ·
     /guide 4개(3). /terms · /privacy 는 `#view > section` 이 **0개**라
     거기서 집으면 터집니다. */
  for(const u of ["/", "/join", "/guide"]){
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
  /* ⚠️⚠️ 구간이 **하나라도 있는** 화면이라야 합니다 — 약관 · 방침은
     `#view > section` 이 0개라 `s[s.length-1]` 이 undefined 로 터집니다. */
  for(const u of ["/", "/join"]){
    await pg.goto(ROOT + u, { waitUntil:"load" });
    await pg.waitForTimeout(260);
    const before = (await pg.evaluate(AUDIT)).tone;
    /* ⚠️⚠️ **없는 것을 집으면 터집니다.** 전에는 그대로 집어서
       `Cannot read properties of null` 로 proveAudit 이 **그 자리에서
       멈췄고**, 뒤의 되돌리기가 통째로 안 돌았습니다 — 어느 것이
       틀렸는지도 안 나옵니다. 못 집으면 **그 한 건만** 실패로 적습니다. */
    const did = await pg.evaluate(() => {
      const s = [...document.querySelectorAll("#view > section")];
      const ft = document.querySelector("footer.ft");
      if(!ft || !s.length) return false;
      ft.style.background = getComputedStyle(s[s.length-1]).backgroundColor;
      return true;
    });
    await pg.waitForTimeout(60);
    const after = (await pg.evaluate(AUDIT)).tone;
    const ok = did && before.length === 0 && after.some(x => x.indexOf("푸터") >= 0);
    if(!ok) bad++;
    console.log((ok ? "✅" : "❌") + " 마지막 구간 ↔ 푸터 · " + u +
      (did ? "" : "  [구간이나 푸터를 못 집었습니다 — 되돌리기가 틀린 자리]") +
      "  [지금 " + JSON.stringify(before) +
      " → 푸터를 본문 색으로 하면 " + JSON.stringify(after).slice(0,50) + "]");
  }

  /* 글자가 바탕에 묻힘 — **기준이 1.6 이었습니다.** 그때는 13px 설명글이
     대비 3.4 로 사이트 전체에 앉아 있어도 통과했습니다. 그 상태를
     되돌려 놓고 지금 기준(AA)이 잡는지 봅니다. */
  /* ⚠️ 잎사귀 글자 칸이 많은 화면 — 재 본 값: / 44개 · /faq 31개 */
  for(const u of ["/", "/faq"]){
    await pg.goto(ROOT + u, { waitUntil:"load" });
    await pg.waitForTimeout(260);
    const before = (await pg.evaluate(AUDIT)).dim;
    await pg.evaluate(() => {
      /* 옛 --ink3 로 되돌립니다 — 흰 바탕에서 3.66 입니다 */
      document.documentElement.style.setProperty("--ink3", "#7B8794");
      document.querySelectorAll("p, i, span").forEach(function(e){
        if(!e.children.length && (e.textContent||"").trim())
          e.style.color = "#7B8794"; });
    });
    await pg.waitForTimeout(60);
    const after = (await pg.evaluate(AUDIT)).dim;
    const ok = before.length === 0 && after.length > 0;
    if(!ok) bad++;
    console.log((ok ? "✅" : "❌") + " 글자가 바탕에 묻힘(AA) · " + u +
      "  [지금 " + JSON.stringify(before).slice(0,40) +
      " → 옛 흐린 색으로 되돌리면 " + JSON.stringify(after).slice(0,60) + "]");
  }

  /* ⚠️⚠️ **아이콘이 든 칸도 재는가** — 대비 검사가 오래도록
     "잎사귀"(자식이 하나도 없는 칸)만 보고 있었습니다. 이 저장소의
     배지 · 칩 · 단추는 거의 전부 svg 아이콘 하나를 품고 있어서
     **한 번도 안 재졌습니다** (후기 인증 배지가 대비 3.06 으로 그
     밑에 숨어 있었습니다). 아이콘이 든 칸의 글자색만 흐리게 바꿔
     놓고 잡히는지 봅니다 — 잎사귀만 보던 때로 돌아가면 못 잡습니다.
     ⚠️ 지울 것이 **실제로 있는** 화면을 고릅니다 (이 저장소에서
     타일이 없는 화면에 되돌리기를 걸어 헛물을 켠 적이 있습니다). */
  /* ⚠️ svg 를 품고 **제 글자도 들고 있는** 칸이 실제로 있는 화면 —
     재 본 값: / 5개 · /join 8개 (/guide · /shop 은 0개입니다). */
  for(const u of ["/", "/join"]){
    await pg.goto(ROOT + u, { waitUntil:"load" });
    await pg.waitForTimeout(260);
    const before = (await pg.evaluate(AUDIT)).dim;
    const n = await pg.evaluate(() => {
      let k = 0;
      document.querySelectorAll("#view *").forEach(function(e){
        if(!e.querySelector("svg")) return;
        const own = [].slice.call(e.childNodes)
          .filter(function(x){ return x.nodeType === 3; })
          .map(function(x){ return x.nodeValue; }).join("").trim();
        if(!own) return;
        e.style.color = "#E8E8E8";   /* 흰 바탕에서 대비 1.3 */
        k++;
      });
      return k;
    });
    await pg.waitForTimeout(60);
    const after = (await pg.evaluate(AUDIT)).dim;
    const ok = n > 0 && before.length === 0 && after.length > 0;
    if(!ok) bad++;
    console.log((ok ? "✅" : "❌") + " 아이콘이 든 칸도 대비를 잰다 · " + u +
      "  [바꾼 칸 " + n + "개 · 지금 " + JSON.stringify(before).slice(0,30) +
      " → 흐리게 하면 " + JSON.stringify(after).slice(0,60) + "]");
  }

  /* "준비 중" 자리표시자 — 프랜차이즈 분류 칸을 원래대로 돌려놓습니다.
     열두 칸이 전부 "준비 중" 이었고, 세는 값(0개 브랜드)을 내야 할
     자리였습니다 (절대 규칙 2). */
  /* ⚠️ 2026-10-31 — /franchise 가 없어졌습니다. 세는 값을 내는 자리가
     남은 곳은 /join 의 분야 배지(.jn-now-l b · 재 보니 3개)입니다. */
  for(const u of ["/join"]){
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
  /* 지킬 수 없는 약속 — 지시서 §5 가 금지한 낱말을 화면에 넣어 봅니다.
     ⚠️⚠️ 이 검사는 화면마다 도는 AUDIT 이라 `CASES` 로는 못 잡습니다.
     2026-10-31 까지 **메인의 신뢰 요소 한 칸**만 보고 있어서 /quote 의
     머리말이 "무료입니다" 로 나가는 것을 아무도 안 봤습니다 —
     §5 는 사이트 전체의 규칙이라 재는 자리도 화면 전부입니다. */
  for(const u of ["/", "/quote"]){
    await pg.goto(ROOT + u, { waitUntil:"load" });
    await pg.waitForTimeout(260);
    const before = (await pg.evaluate(AUDIT)).vow;
    await pg.evaluate(() => {
      const e = document.querySelector("#view p, #view .pg-lead, #view h2");
      if(e) e.textContent = e.textContent + " 무료입니다. 최고가 보장.";
    });
    await pg.waitForTimeout(60);
    const after = (await pg.evaluate(AUDIT)).vow;
    const ok = before.length === 0 && after.length > 0;
    if(!ok) bad++;
    console.log((ok ? "✅" : "❌") + " 지킬 수 없는 약속 · " + u +
      "  [지금 " + JSON.stringify(before) +
      " → 무료 · 최고가 보장을 적으면 " + JSON.stringify(after).slice(0,50) + "]");
  }
  /* 아이콘 자리가 비었음 — 타일 안의 svg 를 지워 봅니다.
     없는 아이콘 key 를 적으면 icon() 이 **빈 문자열**을 돌려줘서
     타일이 덩그러니 빕니다 (매장 구간의 "장비" 가 fridge 라는 없는
     이름으로 몇 주 비어 있었습니다). 에러도 404 도 안 납니다. */
  /* ⚠️ 되돌리기가 **지울 것이 있는 화면**이라야 합니다 — 처음에
     /startup 을 적었는데 거기에는 .ic-t 도 .stg-i 도 없어서 아무것도
     안 지워졌고, "검사가 안 잡는다" 로 보였습니다 (검사가 아니라
     되돌리기가 틀린 것입니다 — 이 저장소에서 여러 번 겪었습니다).
     지금 타일이 있는 화면은 / (45개) · /transfer (5) · /g/:stage (1)
     입니다. /tools · /providers · /about · /startup 에는 없습니다. */
  /* ⚠️ 타일이 실제로 있는 화면 — 재 본 값: / 22개 · /join 6개 · /my 3개
     (/shop · /guide · /terms 는 0개입니다). */
  for(const u of ["/", "/join"]){
    await pg.goto(ROOT + u, { waitUntil:"load" });
    await pg.waitForTimeout(260);
    const before = (await pg.evaluate(AUDIT)).ico;
    await pg.evaluate(() => {
      /* ⚠️ 2026-10-11 — 메인의 타일이 .ia-t(계산도구) · .mhall-i ·
         .mstp-i 로 바뀌었습니다. 집는 자리를 AUDIT 과 같이 넓힙니다 —
         없는 요소를 집으면 아무 일도 안 나서 "검사가 안 잡는다" 로
         보입니다 (검사가 아니라 되돌리기가 틀린 자리, 열 번째). */
      /* ⚠️ 2026-10-16 §3 — 메인의 타일이 .bent-i · .bwhy-i · .bban-i ·
         .bstep-i 로 바뀌었습니다. 집는 자리를 AUDIT 과 같이 넓힙니다 —
         없는 요소를 집으면 아무 일도 안 나서 "검사가 안 잡는다" 로
         보입니다 (검사가 아니라 되돌리기가 틀린 자리, 열한 번째). */
      const e = document.querySelector("#view .ic-t svg, #view .stg-i svg," +
        " #view .ia-t svg, #view .mhall-i svg, #view .mstp-i svg," +
        " #view .bent-i svg, #view .bwhy-i svg, #view .bban-i svg," +
        " #view .bstep-i svg, #view .bcal-i svg," +
        /* 2026-10-30 전면 리뉴얼 — 신뢰 넷 · **핵심 서비스 여섯** ·
           안내 배너 셋. ⚠️ .pww-ic · .pwd-g · .pwq-c 는 메인에 없어
           그것만 적으면 아무것도 안 지워지고 "검사가 안 잡는다" 로
           보입니다 (열여섯 번째). */
        " #view .pww-ic svg, #view .pwh-tr-g i svg," +
        " #view .pwsv-i svg, #view .pwbz-ic svg");
      if(e) e.remove();
    });
    await pg.waitForTimeout(60);
    const after = (await pg.evaluate(AUDIT)).ico;
    const ok = before.length === 0 && after.length > 0;
    if(!ok) bad++;
    console.log((ok ? "✅" : "❌") + " 아이콘 자리가 비었음 · " + u +
      "  [지금 " + JSON.stringify(before) +
      " → 타일에서 svg 를 지우면 " + JSON.stringify(after).slice(0,50) + "]");
  }

  /* 헤더 메뉴가 오른쪽 위로 올라앉음 — 2026-10-16 §4 로 메뉴가 여덟이
     되면서 넣은 검사입니다.
     ⚠️⚠️ **이것은 어느 검사도 안 보던 자리입니다.** 메뉴가 쓸 수 있는
     폭을 넘기면 가로 스크롤이 나는 것이 아니라 메뉴가 헤더 오른쪽 위로
     올라앉습니다 — gnb 가 min-width:0 이라 문서 폭이 그대로여서
     "가로 스크롤" 도 "낱말 잘림" 도 영원히 통과합니다.
     ⚠️ 되돌리기는 메뉴가 **보이는 폭**에서 해야 합니다 (1100px 아래는
     통째로 접히고 햄버거 서랍이 받습니다). */
  for(const u of ["/"]){
    await pg.setViewportSize({ width:1440, height:900 });
    await pg.goto(ROOT + u, { waitUntil:"load" });
    await pg.waitForTimeout(260);
    const before = (await pg.evaluate(AUDIT)).hdfit;
    await pg.evaluate(() => {
      document.querySelectorAll(".hd .gnb a").forEach(function(a){
        a.textContent = a.textContent + " 아주아주 긴 메뉴 이름";
      });
    });
    await pg.waitForTimeout(60);
    const after = (await pg.evaluate(AUDIT)).hdfit;
    const ok = before.length === 0 && after.length > 0;
    if(!ok) bad++;
    console.log((ok ? "✅" : "❌") + " 헤더 메뉴가 오른쪽 위로 올라앉음 · " + u +
      "  [지금 " + JSON.stringify(before) +
      " → 메뉴 이름을 길게 하면 " + JSON.stringify(after).slice(0,70) + "]");
  }

  /* 고르개 딱지가 칸보다 긺 — 딱지를 길게 바꿔 봅니다. 이 저장소에서
     세 번 당한 자리이고, 세 번 다 select 안이라 다른 검사에 안 걸렸습니다. */
  /* ⚠️⚠️ **넓은 화면에서는 되돌려도 안 잡힙니다** — 거기서는 칸이
     `width:auto` 라 딱지를 길게 하면 **칸이 같이 넓어집니다.** 잘리는
     것은 폭이 좁아 칸이 묶일 때뿐이라, 폰 폭으로 재야 합니다.
     (처음에 기본 폭으로 두었다가 "검사가 안 잡는다" 로 보였습니다 —
     검사가 아니라 되돌리기가 틀린 자리입니다.) */
  const vpWas = pg.viewportSize();
  /* ⚠️ `#view select.sel` 이 실제로 있는 화면 — 재 본 값: /repair 4개 ·
     /quote 3개 (/stores · /assets 는 창업 · 폐업과 함께 없어졌습니다). */
  for(const u of ["/quote", "/repair"]){
    await pg.setViewportSize({ width:360, height:900 });
    await pg.goto(ROOT + u, { waitUntil:"load" });
    await pg.waitForTimeout(260);
    const before = (await pg.evaluate(AUDIT)).sel;
    await pg.evaluate(() => {
      const e = document.querySelector("#view select.sel");
      /* ⚠️ 칸이 `width:auto` 라 **조금 긴 정도로는 칸이 같이 넓어집니다.**
         줄 폭(max-width:100%)을 넘겨야 잘립니다 — 넉넉히 깁니다. */
      if(e && e.options[0]) e.options[0].textContent =
        "아주 길고 긴 거르개 딱지 전체 — 칸보다 훨씬 더 긴 이름을 일부러 적습니다";
    });
    await pg.waitForTimeout(60);
    const after = (await pg.evaluate(AUDIT)).sel;
    const ok = before.length === 0 && after.length > 0;
    if(!ok) bad++;
    console.log((ok ? "✅" : "❌") + " 고르개 딱지가 칸보다 긺 · " + u +
      "  [지금 " + JSON.stringify(before) +
      " → 딱지를 길게 하면 " + JSON.stringify(after).slice(0,50) + "]");
  }
  if(vpWas) await pg.setViewportSize(vpWas);

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
    /* 먼저 멀쩡한 상태에서 통과하는지
       ⚠️⚠️ **검사 본문이 터져도 어느 건인지 이름을 냅니다.** 전에는
       그대로 던져서 `Cannot set properties of null` 한 줄만 보이고
       **어느 검사인지도 · 남은 되돌리기도** 안 나왔습니다 — 화면이
       바뀌어 검사가 집던 요소가 없어질 때마다 나는 일입니다
       (되돌리기가 터지는 경우를 바로 아래에서 이미 그렇게 받고
       있었는데 이쪽만 빠져 있었습니다). */
    let before;
    try {
      before = await pg.evaluate("(async()=>{ " + g.body + " })()");
    } catch(e){
      console.log("❌ " + name + "   — 검사 본문이 터집니다: " +
        String(e && e.message || e).split("\n")[0].slice(0,120));
      bad++; continue;
    }
    /* ⚠️⚠️ **되돌리기가 터지면 그 한 건만 실패로 적고 넘어갑니다.**
       전에는 여기서 그대로 던져서 **남은 되돌리기가 통째로 안 돌았고**,
       터진 것이 어느 건인지도 안 나왔습니다 (SyntaxError 한 줄만
       보고 범인을 찾느라 한참 걸렸습니다). */
    try {
      await pg.evaluate(breakJs);
    } catch(e){
      bad++;
      console.log("❌ " + name + "  [되돌리기가 터졌습니다 — " +
        String(e.message).split("\n")[0] + "]");
      continue;
    }
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
