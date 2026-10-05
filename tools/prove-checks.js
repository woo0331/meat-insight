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
  /* ══ 도구 열셋 (2026-10-05 V2 §16) ══════════════════════════════ */
  /* 묶음을 떼면 걸려야 합니다 — 떼면 목록에서 조용히 빠집니다 */
  ["도구 열셋이 저마다 묶음과 갈 곳을 가진다",
   `window.AM_TOOLS = (window.AM_TOOLS||[]).map(function(t){
      return t.key === "margin" ? Object.assign({}, t, { grp:"" }) : t; });`],
  /* 10년 한도를 걷어내면 25,000년이 숫자로 나옵니다 */
  ["권리금 계산이 사람이 못 받는 기간을 숫자로 내지 않는다",
   /* ⚠️⚠️ `PremiumRes` 를 바꿔치기해도 **아무 일이 안 납니다** —
      `tlWire()` 가 적는 함수를 만들 때 그 함수를 **값으로 잡아** 두기
      때문입니다. 적는 함수 쪽을 감싸야 합니다 (열 번째 "되돌리기가
      틀렸습니다"). */
   `window.premiumIn = (function(real){
      return function(k, val){
        real(k, val);
        const el = document.getElementById("tl-res");
        /* 한도를 안 보던 그때 — 300,000개월이 그대로 나왔습니다 */
        if(el) el.innerHTML = el.innerHTML.split("10년이 넘습니다").join("300,000개월");
      };
    })(window.premiumIn);`],
  /* 돌아오는 돈을 안 세면 걸려야 합니다 */
  ["폐업 예상비용이 돌아오는 돈을 같이 센다",
   `window.AM_CLOSE_IN = [];`],
  /* 내려간 업체를 기록에서 안 지우면 걸려야 합니다 */
  ["저장한 업체가 MY 로 이어진다",
   `window.MySaved = (function(real){
      return function(){
        /* 내려간 업체를 안 걸러 내던 그때 */
        const ids = window.amSaved();
        return '<div class="my-next"><h2>저장한 업체 ' + ids.length + '곳</h2></div>';
      };
    })(window.MySaved);`],
  /* 계산 결과에서 업체로 가는 길을 걷어내면 걸려야 합니다 */
  ["계산 결과에서 업체로 가는 길이 있다",
   `window.AM_TOOLS = (window.AM_TOOLS||[]).map(function(t){
      return t.key === "cost" ? Object.assign({}, t, { rel:[] }) : t; });`],
  /* 글 끝의 업체 수를 손으로 적어 넣으면 걸려야 합니다 */
  ["글 끝에 관련 서비스 · 업체 · 도구가 붙는다",
   `document.querySelectorAll(".cn-n").forEach(function(e){
      e.textContent = "인테리어 · 시공 분야에 등록된 업체 23곳";   /* 지어낸 숫자 */
    });`],
  /* 도구를 색인에서 빼면 걸려야 합니다 */
  ["검색이 도구와 여정도 찾는다",
   `window.AM_TOOLS = [];`],
  /* 체크칸을 카드(링크) 안으로 넣으면 걸려야 합니다 */
  ["업체 둘을 나란히 비교할 수 있다",
   `window.ProviderPickCard = function(p){
      /* 체크칸을 카드 안에 넣던 그때 — 링크 안의 누름입니다 */
      return '<div class="pv-w">' + window.ProviderCard(p).replace("</a>",
        '<label class="pv-ck"><input type="checkbox"><span>비교</span></label></a>') + '</div>';
    };`],
  /* 아무도 안 적은 칸을 채워 내면 걸려야 합니다.
     ⚠️ 이 검사는 **스스로 다시 그립니다**(업체를 끼워 넣으니까) —
     DOM 을 미리 고쳐 놓으면 그 그리기에 지워집니다. 그리는 함수를
     감싸야 합니다. */
  ["비교표는 안 적은 값을 지어내지 않는다",
   `window.PageCompare = (function(real){
      return function(){
        return real().split('<em class="cmp-no">\u2014</em>').join("빠름");
      };
    })(window.PageCompare);`],
  /* 예시 프로필을 손님 목록에 섞으면 걸려야 합니다 */
  ["예시 프로필이 손님 화면에 섞이지 않는다",
   `window.AM_PROVIDERS.push(window.amSample("provider"));`],
  /* 예시 딱지를 떼면 걸려야 합니다 */
  ["입점 화면의 예시는 예시라고 밝힌다",
   `document.querySelectorAll(".jn-ex-tag").forEach(function(e){ e.remove(); });`],
  /* ══ 여정 넷 (2026-10-05 V2) — 되돌려 보고 실제로 잡히는지 ══════ */
  /* 단계 하나를 두 여정에 넣으면 걸려야 합니다 */
  ["여정 넷이 단계 여섯을 빠짐없이 나눠 가진다",
   `window.AM_JOURNEYS = (window.AM_JOURNEYS||[]).map(function(j){
      /* 운영 여정이 매장 만들기까지 가져가 버린 그때 */
      return j.key === "operation" ? Object.assign({}, j, { stages:["operation","build"] }) : j; });`],
  /* 없는 하위 분류를 가리키면 걸려야 합니다 */
  ["운영 화면이 실제로 있는 분야로만 보낸다",
   `window.AM_OPS = (window.AM_OPS||[]).map(function(o){
      return o.name === "세무 · 기장" ? Object.assign({}, o, { sub:"없는하위" }) : o; });`],
  /* 인수 · 양도를 한쪽 색으로 칠하면 걸려야 합니다.
     ⚠️ 되돌리기는 **그릴 때가 아니라 그려진 뒤에** 돕니다 — 그리는
     함수를 바꿔치기해도 화면은 이미 그려져 있어서 아무 일이 안
     납니다 (그렇게 짰다가 "검사가 안 잡는다" 로 보였습니다).
     DOM 을 직접 건드립니다. */
  ["인수 · 양도는 한쪽으로 물들지 않고 두 길이 같은 무게다",
   `document.getElementById("view").className = "side-start";`],
  /* 걸음에서 갈 곳을 걷어내면 걸려야 합니다 */
  ["준비 과정의 걸음마다 갈 곳이 있다",
   `document.querySelectorAll(".pcs-ls").forEach(function(e){ e.innerHTML = ""; });`],
  ["빈 칸이 읽을 것을 같이 낸다",
   `document.querySelectorAll(".empty-rl").forEach(function(e){ e.remove(); });`],
  /* 시간 제한을 걷어내면 걸려야 합니다 — 멈추면 영원히 "보내는 중…". */
  ["접수가 멈추면 끊고 적은 글을 돌려준다",
   `window.amSend = function(failId, body){
      const btn = document.querySelector("form button[type=submit]");
      if(btn){ btn.disabled = true; btn.textContent = "보내는 중…"; }
      fetch("/api/quote", { method:"POST",
        headers:{ "content-type":"application/json" }, body: JSON.stringify(body) });
      return false;                      /* 시간 제한이 없던 그때 */
    };`],
  /* 데이터가 0이라 안 보이던 자리들 — 되돌리면 걸려야 합니다. */
  ["출처 없는 창업비는 목록에서도 안 나온다",
   `window.FranchiseCard = function(f){
      const c = (f && f.cost) || {};           /* 출처를 안 보던 그때 */
      return "<a>" + f.name + (c.total ? " 총 " + c.total.toLocaleString() + "만원" : "") + "</a>";
    };`],
  ["후기 평점은 계산값이고 이름은 가려서 낸다",
   `window.amProviderBadges = function(p){
      const v = (p && p.verified) || {};
      return v.biz ? ["사업자 확인"] : [];      /* 첫 배지만 내던 그때 */
    };`],
  ["공고는 원문 링크가 있는 것만 낸다",
   `window.amSupports = function(side){
      return (window.AM_SUPPORTS || []).filter(function(s){
        return !side || s.side === side || s.side === "both"; });  /* link 를 안 보던 그때 */
    };`],
  ["가격은 10건 이상 · 기준일 있는 것만 낸다",
   `window.amQuoteStats = function(){ return window.AM_QUOTE_STATS || []; };`],
  /* 분류를 안 넘기면(옛 버그) 모든 업체가 모든 분야에 나옵니다. */
  ["업체는 자기 분야에만 나온다",
   `const real = window.amProviders;
    window.amProviders = function(f){
      f = Object.assign({}, f); delete f.cat;   /* 분류를 빠뜨리던 그때 */
      return real(f);
    };`],
  ["입점 배지와 업체찾기가 같은 규칙으로 센다",
   `window.amProvidersInCat = function(){ return 99; };`],
  /* 업종 차례를 안 따르고 그냥 전부 내던 그때로 되돌리면 걸려야 합니다. */
  /* ⚠️⚠️ **`amCatsFor` 를 바꿔치기하면 안 됩니다.** 검사가 "화면이
     데이터와 같은가" 를 보는데, 데이터 쪽을 망가뜨리면 **둘 다 같이
     틀려서** 검사가 통과해 버립니다 (처음에 그렇게 짰다가 걸렸습니다).
     망가뜨릴 것은 **화면이 업종을 안 읽는 것** 쪽입니다. */
  ["업종을 고르면 그 업종 차례로 펼쳐진다",
   `const real = window.nowQS;
    window.nowQS = function(k){ return k === "i" ? "" : real(k); };  /* 업종을 안 읽던 그때 */
    window.rerender(true);`],
  /* 토글이 주소에 상태를 안 싣던 그때. */
  ["창업 · 정리 토글이 실제로 쪽을 바꾼다",
   `document.querySelectorAll(".mfit-t").forEach(function(t){ t.setAttribute("href", "/"); });`],
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
  /* 매물 카드가 `<div>` 로 돌아가면(옛 모습) 열 수가 없어야 걸립니다. */
  ["매물 카드가 상세로 열린다",
   `window.StoreCard = function(s){
      return "<div class=mk><b>" + s.title + "</b></div>";   /* 안 열리던 그때 */
    };`],
  /* 매출을 "누가 적은 값" 없이 숫자만 내면 걸려야 합니다. */
  ["점포 상세가 적힌 값만 내고 매출은 누가 적었는지 밝힌다",
   `const real = window.PageStoreOne;
    window.PageStoreOne = function(s){
      return real(s).replace(/사장님이 적으신 값[^<]*/g, "");
    };`],
  /* 장비 key 를 이름으로 안 바꾸면 화면에 `espresso` 가 나와야 걸립니다. */
  ["시설 상세가 장비 종류를 영문 key 로 내지 않는다",
   `window.amEquipName = function(k){ return k; };      /* key 를 그대로 찍던 그때 */`],
  /* 목록을 통째로 그리면(옛 모습) 걸려야 합니다. */
  ["목록이 길어도 한 번에 다 그리지 않는다",
   `window.amShown = function(total){ return total; };  /* 다 그리던 그때 */
    window.MoreBtn  = function(){ return ""; };`],
  /* 하지 않는 저장을 한다고 적어 두면 걸려야 합니다 (절대 규칙 5). */
  ["견적: 요청을 저장한다는 말과 실제가 같다",
   `document.querySelector("#q-f .note-mid").textContent =
      "보내고 나면 이 브라우저에 요청 내용이 남아, 아래에서 비교하실 수 있습니다.";`],
  ["지어낸 실적 숫자가 메인에 없다",
   `document.querySelector(".hp2-d").textContent = "입점 업체 1,200곳";`],
  ["히어로 제목이 창업 · 폐업 두 낱말을 주인공으로 둔다",
   `document.querySelector(".mval-h").textContent = "창업 플랫폼";`],
  /* ⚠️⚠️ 되돌리기는 **검사가 실제로 보는 것**을 망가뜨려야 합니다.
     검색 가는 길을 지울 때 입력칸만 지우고 돋보기를 남겼다가 "검사가
     안 잡는다" 로 보였던 적이 있습니다 — 검사가 아니라 되돌리기가
     틀렸던 것입니다. 여기서는 바로가기 하나를 가짜 링크로 만듭니다
     (지시서 §26 "버튼 → 실제 Link"). */
  ["히어로에서 바로 찾고 바로 갈라진다",
   `document.querySelector(".mstg-g > li > a").setAttribute("href", "#");`],
  ["창업은 초록 · 폐업은 주황이고 빨강이 아니다",
   `document.querySelector(".mval-h .mh-cl").style.color = "rgb(214,28,28)";`],
  ["연결 구간 두 딱지가 같은 높이에 앉는다",
   `document.querySelector(".mbr-g").style.alignItems = "center";
    document.querySelector(".mbr-cl .mbr-l").insertAdjacentHTML("beforeend",
      "<li style=height:120px>늘림</li>");`],
  ["사진 자리가 비율을 무시하고 늘어나지 않는다",
   `for(const sh of document.styleSheets){
      let rules; try { rules = sh.cssRules; } catch(e){ continue; }
      if(!rules) continue;
      for(const r of rules)
        if(r.selectorText === ".mbr-p .ph") r.style.objectFit = "fill";
    }`],
  /* 이름을 분류에 없는 것으로 바꿔 놓습니다 — 손으로 적으면 이렇게 됩니다 */
  /* ⚠️ 되돌리기는 **데이터 쪽**을 망가뜨려야 합니다 — 화면만 고치면
     "이름이 데이터와 다릅니다" 로 잡혀서, 정작 지키려는 것(분류 스물
     다섯이 빠짐없이 나뉘는가)이 확인되지 않습니다. */
  ["사업 단계 여섯이 분류 스물다섯을 빠짐없이 나눠 가진다",
   `window.AM_STAGES[5].cats = window.AM_STAGES[5].cats.slice(1);`],
  ["히어로 두 장의 크기가 같다",
   `document.querySelector(".hp2-cl").style.flex = "1 1 70%";`],
  /* ⚠️⚠️ **아이콘 칸(.stg-i)만 집어야 합니다.** 처음에
     ".mstg-g > li > a svg" 로 적었더니 **화살표까지** 걸려서
     [아이콘0, 화살표0, 아이콘1, …] 이 되고, 0번에 화살표를 넣는 바람에
     아이콘끼리는 여전히 달라 "검사가 안 잡는다" 로 나왔습니다 —
     검사가 아니라 되돌리기가 틀린 것이었습니다 (이 저장소에서 세 번째). */
  ["단계 카드 여섯의 아이콘이 저마다 다르다",
   `const sv = document.querySelectorAll(".mstg-g .stg-i svg");
    sv[0].innerHTML = sv[1].innerHTML;`],
  ["업종 열넷이 저마다 다른 색을 쓴다",
   /* ⚠️ `.ic-t` 에 transition 이 걸려 있어서 그냥 바꾸면 **색이 번지는
      도중**에 재어 다른 값이 나옵니다 — 되돌리기가 헛돕니다. 끕니다. */
   `const t = document.querySelectorAll(".mi-g > li > a");
    const a0 = t[0].querySelector(".ic-t"), a1 = t[1].querySelector(".ic-t");
    t[1].style.transition = "none"; a1.style.transition = "none";
    t[1].style.background = getComputedStyle(t[0]).backgroundColor;
    a1.style.background = getComputedStyle(a0).backgroundColor;`],
  ["메인 구간 차례가 지시서와 같다",
   `const v = document.getElementById("view");
    v.insertBefore(v.children[3], v.children[1]);`],
  /* ⚠️ 색을 **글자로 적지 마세요.** "[7] 을 민트로" 로 적어 두었더니
     구간 차례가 바뀌면서 그 자리가 원래 민트라 **되돌리기가 no-op** 이
     됐고, 검사가 멀쩡한데 "안 잡는다" 로 보였습니다. 이웃의 **실제
     배경을 읽어서** 같게 만듭니다 — 차례가 또 바뀌어도 삽니다. */
  ["이웃한 두 구간이 붙어 보이지 않는다",
   `const S = document.querySelectorAll("#view > section");
    const prev = getComputedStyle(S[S.length - 3]).backgroundColor;
    S[S.length - 2].style.background = prev;`],
  ["규모감 숫자가 손으로 쓴 값이 아니라 센 값이다",
   `document.querySelectorAll(".scale-n")[3].textContent = "500";`],
  ["규모감 숫자가 무엇을 센 값인지 밝힌다",
   `document.querySelector(".scale-n-b").remove();`],
  /* ⚠️ 랜딩을 없앴으므로 "랜딩에 기능을 끌어오지 않았다" 는 반대가
     됐습니다 — 이제 랜딩 구간이 **되살아나는 것**을 되돌려 봅니다. */
  ["메인(/)이 중간 소개 화면이 아니다",
   `document.querySelector("#view").insertAdjacentHTML("afterbegin",
      "<section class=lh>랜딩이 돌아옴</section>");`],
  ["어두운 면이 화면의 15% 를 넘지 않는다",
   /* ⚠️ 구간 **하나**로는 모자랍니다 — 메인이 9,600px 이라 한 구간은
      7% 밖에 안 됩니다. 어두운 테마로 되돌아가는 것을 재현하려면
      위쪽 여섯 구간을 통째로 어둡게 해야 합니다. */
   `[...document.querySelectorAll("#view > section")].slice(0, 6)
      .forEach(function(e){ e.style.background = "#0B1220"; });`],
  /* ⚠️ 길이 **둘**입니다 (넓은 화면은 입력칸, 좁은 화면은 돋보기).
     하나만 지우면 다른 하나가 남아서 되돌리기가 헛돕니다 — 실제로
     돋보기만 지웠다가 "검사가 안 잡는다" 로 보였습니다. */
  ["어느 화면에서나 검색으로 가는 길이 있다",
   `document.querySelectorAll('.hd a[href="/search"], .hd .hd-s')
      .forEach(function(e){ e.remove(); });`],
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
  ["계산기가 말이 안 되는 숫자를 내지 않는다",
   /* 1% 아래 공헌이익률을 막던 것을 풀어 놓습니다 — 전에 그랬습니다 */
   `window.BepRes = (function(orig){
      return function(v){
        const out = orig(v);
        if(out.indexOf("99%를 넘습니다") < 0) return out;
        const fix = ["rent","labor","util","lease","loan","etc"]
          .reduce(function(a,k){ const x=parseFloat(v[k]); return a+(isFinite(x)?x:0); },0);
        const varSum = ["mat","fee"]
          .reduce(function(a,k){ const x=parseFloat(v[k]); return a+(isFinite(x)?x:0); },0);
        const cm = 100 - varSum;
        return out.replace("—", (fix/(cm/100)).toLocaleString()+"만원")
                  .replace("99%를 넘습니다", "공헌이익률 0%");
      };
    })(window.BepRes);
    window.bepIn("mat", 99.99);`],
  ["검색이 글 본문까지 찾는다",
   /* 글 색인을 **제목 + 머리말**로 되돌려 놓습니다 — 전에 그랬습니다.
      ⚠️ 본문을 편 글자는 slug 로 **캐시**되므로, body 만 비우면 이미
      캐시된 값이 그대로 나와서 되돌리기가 헛돕니다. slug 까지 바꿔
      캐시를 비켜 갑니다 (제목은 그대로라 검사가 보는 값은 같습니다). */
   `window.AM_CONTENTS = window.AM_CONTENTS.map(function(c){
      const d = Object.assign({}, c);
      d.slug = c.slug + "-nobody";
      d.body = [];
      return d;
    });`],
  ["글 목록 거르개 숫자가 센 값이다",
   `document.querySelectorAll(".chip-g-fil .chip")[0]
      .textContent = "전체 120";`],
  ["카드가 구간 바탕과 같은 색이 아니다",
   /* ⚠️ 바탕만 같게 하면 안 잡힙니다 — **테두리가 있으면 카드로
      읽힌다**고 봐 주기 때문입니다. 그림자로만 보이는 상태를
      만들려면 테두리도 같이 없애야 합니다. */
   `const a = document.querySelectorAll(".mi-g a")[0];
    a.style.border = "none";
    a.style.background = getComputedStyle(a.closest("section")).backgroundColor;`]
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

  /* 글자가 바탕에 묻힘 — **기준이 1.6 이었습니다.** 그때는 13px 설명글이
     대비 3.4 로 사이트 전체에 앉아 있어도 통과했습니다. 그 상태를
     되돌려 놓고 지금 기준(AA)이 잡는지 봅니다. */
  for(const u of ["/", "/about"]){
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
