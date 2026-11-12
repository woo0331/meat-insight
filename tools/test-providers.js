#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   업체가 **있을 때**를 눌러 봅니다

   ⚠️⚠️ **이 검사가 있는 까닭.** 지금 업체가 0곳이라, 화면의 "있을 때"
   자리는 **아무도 본 적이 없습니다.** 앞 서비스에서 "0건" 안내만 만들고
   있을 때 그리는 자리를 안 만든 적이 있습니다 — 승인해도 손님에게
   보일 곳이 없었고, 에러도 안 났습니다.

   그래서 **씨앗을 넣고 실제로 찍어 봅니다.** 자료 파일을 잠깐 바꿔
   빌드를 돌리고, 끝나면 **미리 뜬 사본으로 되돌립니다.**
   ⚠️⚠️ 되돌리기는 git 이 아니라 **사본**으로 합니다 —
   `git checkout -- <파일>` 은 그 파일의 작업분 전체를 지웁니다.

   돌리기   node tools/test-providers.js
   ════════════════════════════════════════════════════════════════════ */
const { spawnSync } = require("child_process");
const fs = require("fs"), path = require("path"), os = require("os");
const { chromium } = require("playwright");
const { serve, watch } = require("./_serve.js");

const ROOT = path.join(__dirname, "..");
const GEN  = path.join(ROOT, "js", "data", "providers.generated.js");
const RGEN = path.join(ROOT, "js", "data", "reviews.generated.js");
const TMP  = fs.mkdtempSync(path.join(os.tmpdir(), "pv-"));
const BAK  = path.join(TMP, "providers.keep.js");
const RBAK = path.join(TMP, "reviews.keep.js");

let bad = 0, ran = 0;
function ok(name, cond, got){
  ran++;
  if(cond) console.log("  ✅ " + name);
  else { bad++; console.log("  ❌ " + name + (got !== undefined ? "  →  " + String(got).slice(0, 220) : "")); }
}
/* ⚠️⚠️ **사진 자리 밖의 그림만 셉니다.** 손님 · 업체가 적은 글이
   `esc()` 를 거치는지 보려면 "그 글 때문에 그림이 생겼는가" 를 세야
   하는데, 0051 뒤로는 업체가 올린 시설 사진(`.pvsh`)과 카드의 사진
   자리(`.pv-th`)가 **참 그림**을 냅니다. 그것까지 세면 사진을 한 장
   올리시는 날 멀쩡한 화면을 실패로 잡습니다 (갯수를 박아 두어 멀쩡한
   화면을 떨어뜨린 자리가 이미 여럿입니다).
   ⚠️ 그 둘을 덮어 주는 것이 아니라 **그 밖에 그림이 있는가**를 셉니다 —
   날것 태그로 생긴 그림은 어느 쪽에도 안 담기므로 그대로 잡힙니다. */
async function strayImg(pg){
  return await pg.evaluate(function(){
    return Array.prototype.filter.call(
      document.querySelectorAll("main img"),
      function(i){ return !i.closest(".pvsh") && !i.closest(".pv-th"); }).length;
  });
}
function build(){
  return spawnSync(process.execPath, ["build.js"], { cwd: ROOT, stdio:["ignore","pipe","pipe"] });
}
function routes(){
  return JSON.parse(fs.readFileSync(path.join(__dirname, "routes.json"), "utf8")).routes;
}
function seed(rows, at){
  fs.writeFileSync(GEN,
    "/* 검사용 씨앗 — tools/test-providers.js 가 잠깐 바꿔 둔 것입니다. */\n" +
    "window.AM_PROVIDERS_AT = " + JSON.stringify(at || "검사용 씨앗") + ";\n" +
    "window.AM_PROVIDERS = " + JSON.stringify(rows, null, 2) + ";\n");
}

/* ⚠️ 업체가 적은 글에 태그를 넣어 둡니다 — 그대로 나가면 사고입니다 */
/* ⚠️ 하위 키는 js/data/catalog.js 에 있는 **진짜 키**여야 합니다.
   2차 지시서로 하위를 바꿨을 때 여기 ls-pro 가 남아 빌드 가드가
   막았습니다 — 가드가 제 일을 한 것이고, 틀린 것은 **씨앗**입니다. */
const SEED = [
  { id:"green-pt", name:"성남 그린골프연습장",
    intro:"실내 타석 열두 개와 스크린 네 대를 둡니다.",
    regions:["gyeonggi"], subs:["rg-in","rg-sim","ls-solo"],
    /* ⚠️⚠️ 0074 의 연습장 시설(`range_opts`) — **실외는 일부러 비워
       둡니다.** 다 채우면 「안 고르신 연습장은 그 조건으로 좁히면
       빠진다」 갈래를 아무도 안 보게 됩니다(피팅에서 값을 채웠다가
       멀쩡한 검사 둘을 떨어뜨린 그 자리의 거꾸로). */
    range_opts:["indoor","screen","parking"],
    open_hours:"평일 06:00~23:00 · 주말 07:00~21:00",
    since:2019, consult_hours:"평일 09:00~22:00",
    verified:{ brn:true, tel:true }, scale:"mid", brands:["타이틀리스트","캘러웨이"],
    /* ⚠️ 가격은 **업체가 등록한 것**입니다 (0042). 싼 순서로 가져옵니다
       (tools/pull-providers.js 가 amount 로 줄 세웁니다).
       ⚠️⚠️ 하위 키는 그 업체의 subs 에 있는 것이어야 합니다 — DB 의
       트리거가 그것을 봅니다 (여기도 같아야 검사가 거짓이 안 됩니다). */
    prices:[{ sub:"rg-in", label:"타석 1시간", amount:12000, unit:"1시간" },
            { sub:"ls-solo", label:"주 1회 · 8회권", amount:400000, unit:"8회",
              note:"타석 이용료 별도" }],
    /* ⚠️⚠️ **업체가 스스로 올린 시설 사진**입니다 (0051). 공개 보기가
       사진만 내므로 **증빙서류는 여기 한 장도 안 옵니다** — 자료
       파일에 서류가 섞이면 그 순간 사업자등록증이 정적 HTML 에
       찍힙니다. 검사가 그것을 아래에서 눌러 봅니다. */
    photos:[{ url:"https://sb-test.supabase.co/storage/v1/object/public/pv/a.jpg",
              caption:"실내 타석" },
            { url:"https://sb-test.supabase.co/storage/v1/object/public/pv/b.jpg" }],
    /* ⚠️⚠️ 0057 — 사업자 신원정보(전자상거래법 제20조 제2항 · 시행령
       제25조). 중개자는 입점업체가 사업자일 때 그 대표자 · 주소 · 전화 ·
       이메일 · 사업자등록번호를 손님이 볼 수 있게 해야 합니다.
       ⚠️ **주소에 일부러 태그를 넣어 둡니다** — 업체가 적은 글이고
       `esc()` 를 지나야 합니다 (절대 규칙 4). 다른 칸은 값이 그대로
       보이는지 재는 자리라 멀쩡한 글자로 둡니다. */
    ceo:"박대표", addr:"<b>경기</b> 성남시 분당구 1", tel:"031-111-2222",
    email:"pt@green.test", brn:"123-45-67890" },
  /* ⚠️⚠️ 이 업체는 신원정보를 **비워 둡니다** — "아직 등록되지 않았습니다"
     갈래가 손님에게 보이는 글이라 그것도 눌러 봐야 합니다. 다 채우면
     그 갈래를 아무도 안 보게 됩니다. */
  { id:"xss-test", name:"<img src=x onerror=alert(1)>",
    intro:"<script>alert(2)</script> 소개글",
    regions:["seoul"], subs:["ft-mend","ft-grip"], scale:"small",
    /* ⚠️ 0076 — 피팅 이용 방식. **업체 수를 안 늘립니다** —
       알맞은 씨앗을 하나 더 넣으면 「업체 N곳」을 재는 검사 여럿이
       같이 떨어집니다(갯수를 박은 자리가 아니라 **씨앗이 바뀐** 꼴).
       ⚠️⚠️ **방문만** 고릅니다 — 택배로 좁히면 빠져야 거르개가
       일을 하는 것입니다(둘 다 고르면 무엇을 걸러도 같은 줄이 남아
       **엉뚱한 까닭으로 통과**합니다).
       ⚠️⚠️⚠️ **값은 한 줄도 안 넣습니다** — 이 업체는 「가격을 **안
       올린** 업체」 자리를 맡고 있습니다(그 줄이 **줄째 빠지는지**를
       재는 검사가 둘 있습니다). 한 번 넣어 봤다가 그 둘이 바로
       떨어졌습니다 — **검사가 맞고 씨앗이 틀렸습니다**. */
    fit_ways:["visit"] }
];

/* 후기 씨앗 — ⚠️ 자료 파일을 잠깐 바꿉니다. 되돌리기는 **사본**으로
   합니다 (git checkout 은 그 파일의 작업분 전체를 지웁니다). */
function rseed(rows){
  fs.writeFileSync(RGEN,
    "/* 검사용 씨앗 — tools/test-providers.js 가 잠깐 바꿔 둔 것입니다. */\n" +
    "window.AM_REVIEWS_AT = \"검사용 씨앗\";\n" +
    "window.AM_REVIEWS = " + JSON.stringify(rows, null, 2) + ";\n");
}

/* ⚠️⚠️ **별점을 손으로 세어 적습니다.** 5 · 4 · 4 의 평균은 13 나누기
   3 = 4.333… 이고 소수 한 자리로 **4.3** 입니다. 코드와 같은 식으로
   적으면 식을 바꿔도 답이 같아서 아무것도 안 잡습니다.
   ⚠️ 가까운 정수는 4 라 별이 넷 차야 합니다 (★★★★☆).
   ⚠️ 다른 업체의 1점이 섞이면 평균이 3.5 가 됩니다 — 그 1점을 일부러
   넣어 둡니다 (섞이면 이 검사가 떨어집니다). */
const RSEED = [
  { id:"rv-1", provider_id:"green-pt", rating:5, who:"김**",
    body:"타석이 넓고 사장님이 꼼꼼히 봐 주셨습니다.",
    created_at:"2026-10-30T01:00:00Z" },
  { id:"rv-2", provider_id:"green-pt", rating:4, who:"이**",
    body:"<script>alert(3)</script> 글을 넣어 봅니다",
    created_at:"2026-10-29T01:00:00Z",
    reply:"<b>고맙습니다</b> 또 오세요", reply_at:"2026-10-29T05:00:00Z" },
  { id:"rv-3", provider_id:"green-pt", rating:4, who:"박**",
    body:"주차가 조금 좁지만 시설은 좋았습니다.",
    created_at:"2026-10-28T01:00:00Z", edited:true },
  { id:"rv-4", provider_id:"xss-test", rating:1, who:"최**",
    body:"다른 업체의 후기입니다. 섞이면 안 됩니다.",
    created_at:"2026-10-27T01:00:00Z" }
];

function nowServe(){ return serve(0); }

(async function(){
  fs.copyFileSync(GEN, BAK);
  fs.copyFileSync(RGEN, RBAK);
  let b = null, h = null, startedWith = 0;
  try{
    /* ⚠️⚠️ **"0장" 을 박아 두지 않습니다.** 업체가 생기는 날 멀쩡한
       저장소를 실패로 잡습니다. 지금 몇 장인지 **세어 두고**, 씨앗을
       넣은 뒤 **늘어난 값**만 봅니다 (작업 기억의 "전을 재고 늘어난
       값만 보세요"). */
    console.log("\n── ① 지금 상태를 먼저 세어 둡니다");
    build();
    const before = routes();
    const was = before.filter(r => r.indexOf("/pro/") === 0).length;
    startedWith = was;
    console.log("   지금 업체 화면 " + was + "장 · 전체 " + before.length + "장");

    /* ══════════════════════════════════════════════════════════════
       ⚠️⚠️⚠️ **업체가 0곳일 때 막다른 길이 아닌가** (지시서 §7)

       0곳은 지금 **운영의 실제 상태**입니다. 전에는 0곳 상자가
       "업체가 등록되면 보입니다" 로 끝나서, 손님이 할 수 있는 일이
       **기다리는 것뿐**인 것처럼 보였습니다 — 그런데 업체가 0곳이어도
       **회원끼리 되는 것**이 셋 있습니다 (조인 · 커뮤니티 · 구인구직).
       ⚠️ 갯수를 박지 않습니다 — `amOpenNow()` 가 내는 만큼 셉니다.
       ⚠️⚠️ **빌드와 브라우저가 같은 말을 하는지**까지 봅니다. 이 상자를
       둘이 그리므로(`pages/search.js` · `js/search.js`), 글을 두 벌로
       적으면 손님이 거르개를 누르는 순간 안내가 조용히 달라지고
       **그려진 화면만 보는 검사는 영원히 통과**합니다.
       ══════════════════════════════════════════════════════════════ */
    console.log("\n── ①-2 업체가 0곳일 때 (지금 운영의 실제 상태)");
    {
      const h0 = await nowServe();
      const b0 = await chromium.launch();
      const p0 = await b0.newPage({ viewport:{ width:1280, height:900 } });
      /* `amOpenNow()` 가 내는 줄을 **그 화면에서 읽어** 씁니다 */
      await p0.goto("http://127.0.0.1:" + h0.port + "/search",
                    { waitUntil:"networkidle" });
      const want = await p0.evaluate(function(){
        return (window.amOpenNow ? window.amOpenNow() : []).map(function(x){
          return { href:x.href, label:x.label }; });
      });
      ok("⚠️ 잴 것이 0개면 실패입니다 (지금 되는 것을 읽기는 했는가)",
         want.length > 0, JSON.stringify(want));

      const zeroTxt = (await p0.textContent("#sres")) || "";
      ok("업체찾기가 0곳이라고 말한다",
         /아직 등록된 업체가 없습니다/.test(zeroTxt), zeroTxt.slice(0, 120));
      ok("⚠️⚠️ **빌드가 찍은 0곳 상자**에 지금 되는 것이 전부 있다",
         want.every(function(x){ return zeroTxt.indexOf(x.label) >= 0; }),
         zeroTxt.slice(0, 300));
      ok("  그 길이 **링크**로 있다 (글이 아닙니다)",
         (await p0.evaluate(function(L){
           return L.every(function(x){
             return !!document.querySelector('#sres a[href="' + x.href + '"]'); });
         }, want)) === true, JSON.stringify(want));
      /* ⚠️ 매칭 요청과 **갈라서** 적었는지 */
      ok("  업체를 기다리는 길과 **갈라서** 적는다",
         zeroTxt.indexOf("업체를 기다리지 않고") >= 0, zeroTxt.slice(0, 300));

      /* ⚠️⚠️⚠️ **브라우저가 다시 그려도 같은 말인가** */
      await p0.click('a[data-sf="cat"][data-v="fitting"]');
      await p0.waitForTimeout(300);
      const redrawn = (await p0.textContent("#sres")) || "";
      ok("⚠️⚠️⚠️ 거르개를 눌러 **다시 그려도 같은 말**을 한다 (빌드와 " +
         "브라우저가 두 벌로 적히지 않았는가)",
         want.every(function(x){ return redrawn.indexOf(x.label) >= 0; }) &&
         redrawn.indexOf("업체를 기다리지 않고") >= 0,
         redrawn.slice(0, 300));

      /* 메인의 0곳 상자도 같은 줄을 읽는가 */
      await p0.goto("http://127.0.0.1:" + h0.port + "/", { waitUntil:"networkidle" });
      const homeTxt = (await p0.textContent("main")) || "";
      ok("메인의 0곳 상자에도 지금 되는 것이 전부 있다",
         want.every(function(x){ return homeTxt.indexOf(x.label) >= 0; }),
         homeTxt.slice(0, 200));
      /* ⚠️ 이 구간을 읽는 사람은 **업체를 찾는 손님**입니다 — 입점
         권유를 여기 두면 자리가 어긋납니다 (같은 단추가 두 번). */
      const zeroBox = await p0.evaluate(function(){
        const b2 = document.querySelectorAll(".none");
        for(const x of b2)
          if((x.textContent || "").indexOf("아직 입점한 업체가 없습니다") >= 0)
            return x.innerHTML;
        return "";
      });
      ok("⚠️ 메인 0곳 상자 **안에는 입점 단추를 안 둔다** (바로 아래 띠가 " +
         "같은 말을 합니다)", zeroBox.indexOf('href="/join"') < 0,
         zeroBox.slice(0, 200));
      /* ⚠️⚠️⚠️ **2026-11-07 — 메인의 분류 열 장 격자가 빠졌습니다.**
         최종 작업지시서 A-3 은 "10개 카테고리 **아이콘**(기존 유지)" 이고,
         A 는 "기존 10개 **이미지** 카테고리 반복 영역은 서비스 카드 /
         실제 콘텐츠로 대체하여 중복 축소" 라고 적었습니다. 그래서 메인은
         **아이콘 띠(`.qnav-in`)** 하나만 남고 사진 격자(`.cat-grid`)는
         `/categories` 로 갑니다.
         ⚠️ 그런데 이 검사는 `.cat-grid` 를 메인에서 찾고 있어서
         **칸 0개**로 떨어졌습니다 — 코드가 아니라 **검사가 낡은** 것입니다
         (오늘만 다섯 번째입니다). 아이콘 띠는 바로 아래에서 따로 잽니다.
         ⚠️⚠️ 격자가 사는 자리(`/categories`)에서 **같은 뜻**을 잽니다 —
         "열 장이 칸 수로 고르게 나뉘는가"(빈 칸이 안 생기게). */
      const pc2 = await b0.newPage({ viewport:{ width:1440, height:900 } });
      await pc2.goto("http://127.0.0.1:" + h0.port + "/categories", { waitUntil:"networkidle" });
      await pc2.waitForTimeout(200);
      const grid = await pc2.evaluate(function(){
        const g = document.querySelector(".calist");
        if(!g) return { col:0, n:0 };
        return { col: getComputedStyle(g).gridTemplateColumns
                        .split(/\s+/).filter(Boolean).length,
                 n: document.querySelectorAll(".calist > .ca").length };
      });
      await pc2.close();
      ok("⚠️ /categories 의 분류 목록이 **여러 칸**이다 (PC 에서 한 줄 세우지 않습니다)",
         grid.col >= 2, "칸 " + grid.col + "개");
      ok("  분류 카드를 **실제로 찾았다** (0장이면 이 검사가 고장입니다)",
         grid.n > 0, "분류 " + grid.n + "장");

      /* ⚠️⚠️ **분류로 바로 가는 띠** (2026-11-07 · 시안의 히어로 바로 아래)
         — 칸 수를 박지 않고 **분류 수가 고르게 나뉘는지**를 봅니다.
         ⚠️ 안 나뉘면 마지막 줄에 한 장만 덩그러니 남습니다. */
      const qn = await p0.evaluate(function(){
        const g = document.querySelector(".qnav-in");
        if(!g) return { on:false };
        return { on:true,
          col: getComputedStyle(g).gridTemplateColumns.split(/\s+/).filter(Boolean).length,
          n: g.querySelectorAll("a.qn").length,
          /* ⚠️ 전부 분류 주소로 가야 합니다 — 하나라도 빠지면 그 분류는
             첫 화면에서 가는 길이 없습니다 */
          hrefs: Array.prototype.map.call(g.querySelectorAll("a.qn"),
            function(a){ return a.getAttribute("href"); }) };
      });
      ok("⚠️ 히어로 아래 **분류로 바로 가는 띠**가 있다", qn.on,
         JSON.stringify(qn).slice(0, 140));
      /* ⚠️⚠️ **분류 수를 `AM_CATS` 에서 읽어 맞춥니다** — 전에는 메인의
         `.cat-grid` 에서 셌는데, 그 격자가 메인에서 빠지자 **0 과 비교**
         하게 되어 멀쩡한 띠를 실패로 잡았습니다.
         ⚠️ 갯수를 박지 않고 **자료에서** 읽습니다 (분류가 늘면 띠도 같이
         늘어야 합니다 — 그것이 재려는 뜻입니다). */
      const catsN = await p0.evaluate(function(){
        return (window.AM_CATS || []).length; });
      ok("  ⚠️ 잴 분류 수를 읽었다 (0개면 이 검사가 고장입니다)",
         catsN > 0, String(catsN));
      ok("  띠의 칸이 **분류 수와 같다**",
         qn.on && qn.n === catsN && catsN > 0, "띠 " + qn.n + " · 분류 " + catsN);
      ok("  분류 수가 띠의 칸 수로 **나누어떨어진다** (빈 칸이 안 생깁니다)",
         qn.on && qn.col > 0 && qn.n % qn.col === 0,
         "띠 " + qn.n + "개 · 칸 " + qn.col + "개");
      ok("  ⚠️ 전부 **분류 주소**로 간다 (빠진 분류가 없습니다)",
         qn.on && qn.hrefs.length > 0 &&
         qn.hrefs.every(function(h){ return /^\/cat\//.test(String(h)); }),
         (qn.hrefs || []).join(" "));

      /* ⚠️⚠️⚠️ **제목만 있고 알맹이가 없는 띠를 손님에게 보이지 않습니다**
         (2026-11-07 · 절대 규칙 2). 설정이 꺼진 상태(이 자리가 그 상태입니다)
         에서는 현황표가 안 그려지는데, 감싼 구간에는 빌드가 찍어 둔 제목과
         설명이 남아 "원하는 날짜와 지역의 자리 찾기" 라는 **제목만 덩그러니**
         보였습니다. 사장님이 화면을 보내 주셔서 알았습니다.
         ⚠️ `.sec:has(> .wrap > [hidden]:only-child)` 는 못 잡습니다 — 그
         구간에는 제목 상자가 같이 들어 있어 `:only-child` 가 아닙니다.
         ⚠️ 구간 이름을 박지 않고 **빈 띠를 세어서** 봅니다 — 다음에 다른
         구간이 같은 꼴이 되어도 같이 잡힙니다. */
      const empty = await p0.evaluate(function(){
        const out = [];
        Array.prototype.forEach.call(document.querySelectorAll("section"),
          function(s){
            if(s.hidden || !s.offsetParent) return;
            const h2 = s.querySelector("h2");
            if(!h2) return;
            const hd = s.querySelector(".sec-hd");
            let rest = "";
            Array.prototype.forEach.call(s.querySelectorAll("*"), function(e){
              if(hd && hd.contains(e)) return;
              if(!e.offsetParent || e.children.length) return;
              rest += (e.textContent || "").trim();
            });
            if(rest.replace(/\s+/g, "").length < 3)
              out.push((h2.textContent || "").trim().slice(0, 40));
          });
        return out;
      });
      ok("⚠️⚠️ 설정이 꺼져도 **제목만 있는 빈 띠가 없다** (절대 규칙 2)",
         empty.length === 0, empty.join(" | "));

      await p0.close(); await b0.close(); h0.srv.close();
    }

    console.log("\n── ② 씨앗을 넣고 다시 찍습니다");
    seed(SEED);
    const r1 = build();
    ok("빌드가 돈다", r1.status === 0,
       (r1.stderr || "").toString().trim().split("\n").slice(-3).join(" | "));
    const after = routes();
    const pros = after.filter(r => r.indexOf("/pro/") === 0);
    ok("씨앗 두 곳만 남는다 (전 것은 덮어씁니다)", pros.length === 2, pros.join(" "));
    ok("주소가 /pro/<id> 다", pros.indexOf("/pro/green-pt") >= 0, pros.join(" "));
    ok("화면 수가 **업체 수만큼만** 달라진다",
       after.length === before.length - was + 2,
       before.length + "(업체 " + was + ") → " + after.length);

    h = await nowServe();
    b = await chromium.launch();
    const p = await b.newPage({ viewport:{ width:1280, height:900 } });
    const hits = watch(p);

    /* 분류 화면 — 업체가 뜨는가 */
    await p.goto("http://127.0.0.1:" + h.port + "/cat/range", { waitUntil:"networkidle" });
    let t = (await p.textContent("main")) || "";
    /* ⚠️⚠️ 연습장(시안 ⑤) · 피팅(시안 ⑦) · 레슨은 카드 이름이
       다릅니다(`.rng-c` · `.fit-c` · `.lsn-c`). **재려는 뜻은 「그
       분류에 그 업체가 뜨는가」** 하나이므로 둘 다 셉니다 — 클래스를
       하나만 박으면 모양을 바꾸는 날 **멀쩡한 화면을 실패로** 잡습니다. */
    const PVC = ".pv, .rng-c, .fit-c, .lsn-c";
    ok("연습장 분류에 업체가 뜬다", (await p.locator(PVC).count()) === 1,
       await p.locator(PVC).count());
    ok("0곳 안내가 사라진다", t.indexOf("아직 등록된 업체가 없습니다") < 0);
    /* ⚠️ 시안 ⑤ 는 「연습장 N곳」이라고 적습니다 — 글자를 박지 말고
       **세어 말하는가**를 봅니다(분류마다 부르는 말이 다릅니다). */
    ok("몇 곳인지 말한다", /(업체|연습장) 1곳/.test(t), t.slice(0, 60));
    ok("중개자임을 그 자리에서 다시 말한다", /통신판매중개자/.test(t));

    /* 한 업체가 여러 분류에 걸치면 그 분류마다 떠야 합니다
       ⚠️⚠️ **레슨만 카드가 다릅니다**(2026-11-10 · `.lsn-c`) — 시안이
       1:1 정사각 사진 카드를 요구해 `amLessonCard()` 로 갈랐습니다.
       재려는 뜻은 "그 분류에 그 업체가 뜨는가" 하나이므로 **둘 다**
       셉니다 — 클래스 이름을 하나만 박으면 모양을 바꾸는 날 멀쩡한
       화면을 실패로 잡습니다(작업 기억의 그 줄). */
    await p.goto("http://127.0.0.1:" + h.port + "/cat/lesson", { waitUntil:"networkidle" });
    ok("레슨 분류에도 같은 업체가 뜬다 (subs 가 걸쳐 있습니다)",
       (await p.locator(".pv, .lsn-c").count()) === 1,
       await p.locator(".pv, .lsn-c").count());
    await p.goto("http://127.0.0.1:" + h.port + "/cat/fitting", { waitUntil:"networkidle" });
    ok("피팅 분류에는 다른 업체가 뜬다", (await p.locator(PVC).count()) === 1,
       await p.locator(PVC).count());
    await p.goto("http://127.0.0.1:" + h.port + "/cat/travel", { waitUntil:"networkidle" });
    ok("업체가 없는 분류는 그대로 0곳이라고 말한다",
       /아직 등록된 업체가 없습니다/.test((await p.textContent("main")) || ""));

    /* ══ 골프 레슨 거르개 · 정렬 (2026-11-10 · 레슨 지시서 §4 · §6) ══
       ⚠️⚠️⚠️ **거르개는 "눌러 봐야" 압니다.** 빌드가 찍은 목록만 보면
       거르개를 통째로 떼어도 영원히 초록입니다(조인 · 중고에서 두 번
       겪은 자리). 여기는 씨앗으로 업체를 넣어 둔 뒤라 **실제로 좁혀지는지**
       셀 수 있는 유일한 자리입니다.
       ⚠️ 씨앗 `green-pt` 는 경기 · `ls-solo` · 레슨 가격 400,000원입니다 —
       그 값에서 **걸리는 조건과 안 걸리는 조건**을 짝으로 눌러 봅니다
       (한쪽만 재면 "아무것도 안 거르는 거르개" 가 초록으로 지나갑니다). */
    console.log("\n── 골프 레슨 거르개 · 정렬");
    async function lsn(q){
      await p.goto("http://127.0.0.1:" + h.port + "/cat/lesson" + q,
                   { waitUntil:"networkidle" });
      await p.waitForTimeout(250);
      return { n: await p.locator("#lsnlist .lsn-c").count(),
               t: (await p.textContent("#lsnlist")) || "" };
    }
    const lsAll = await lsn("");
    ok("⚠️ 잴 것이 0개면 실패입니다 (레슨 목록에 카드가 그려지기는 했는가)",
       lsAll.n === 1, JSON.stringify(lsAll.n));
    const lsYes = await lsn("?sub=ls-solo");
    ok("하위로 좁히면 **그 레슨을 하는 프로만** 남는다", lsYes.n === 1, lsYes.n);
    const lsNo = await lsn("?sub=ls-field");
    ok("  안 하는 레슨으로 좁히면 **0건**이 된다", lsNo.n === 0, lsNo.n);
    ok("  0건을 **조건 때문**이라고 말한다 (「등록된 프로가 없습니다」가 아닙니다)",
       lsNo.t.indexOf("고르신 조건에 맞는") >= 0, lsNo.t.slice(0, 60));
    ok("  조건을 지우는 길을 그 자리에서 낸다 (막다른 길이 아닙니다)",
       lsNo.t.indexOf("조건 모두 지우기") >= 0, lsNo.t.slice(0, 80));
    ok("지역으로 좁힌다 — 맞는 지역", (await lsn("?rg=gyeonggi")).n === 1);
    ok("  다른 지역이면 0건", (await lsn("?rg=seoul")).n === 0);
    /* ⚠️ 가격대 경계 — 씨앗이 400,000원이라 「20만원 이상」에 걸리고
       「5만원 미만」에는 안 걸립니다. 둘을 짝으로 봅니다. */
    ok("가격대로 좁힌다 — 맞는 칸", (await lsn("?p=p5")).n === 1);
    ok("  안 맞는 칸이면 0건", (await lsn("?p=p1")).n === 0);
    ok("찾는 말로 좁힌다 — 이름의 한 조각",
       (await lsn("?q=" + encodeURIComponent("그린골프"))).n === 1);
    ok("  **지역 이름**으로도 찾아진다 (키가 아니라 사람이 읽는 이름)",
       (await lsn("?q=" + encodeURIComponent("경기"))).n === 1);
    ok("  없는 말이면 0건",
       (await lsn("?q=" + encodeURIComponent("없는말123"))).n === 0);
    /* ⚠️⚠️ **고르개가 지금 조건에 맞춰져 있는가** — 안 맞추면 주소로
       들어오신 분께 "전체" 라고 적힌 칸 아래 좁혀진 목록이 나옵니다
       (무엇으로 좁혔는지 알 수 없는 자리). */
    await p.goto("http://127.0.0.1:" + h.port + "/cat/lesson?sub=ls-solo&rg=gyeonggi",
                 { waitUntil:"networkidle" });
    await p.waitForTimeout(250);
    ok("고르개가 **지금 조건**을 보여 준다",
       (await p.inputValue("#lsn-sub")) === "ls-solo" &&
       (await p.inputValue("#lsn-rg")) === "gyeonggi",
       (await p.inputValue("#lsn-sub")) + " · " + (await p.inputValue("#lsn-rg")));

    /* ⚠️⚠️⚠️ **카테고리 카드를 실제로 눌러 봅니다** (§5 — "각 카드를
       누르면 해당 카테고리로 필터링된 프로 목록을 표시한다").
       주소만 맞고 안 걸리면 아무 뜻이 없습니다. 그리고 **새로고침 없이**
       바뀌어야 합니다 — 다시 읽으면 걸어 둔 표시가 날아갑니다. */
    await p.goto("http://127.0.0.1:" + h.port + "/cat/lesson", { waitUntil:"networkidle" });
    await p.evaluate(function(){ window.__lsnKept = "있습니다"; });
    await p.click('.lsn-cat[href="/cat/lesson?sub=ls-field"]');
    await p.waitForTimeout(350);
    ok("⚠️⚠️ 카테고리 카드를 누르면 **새로고침 없이** 좁혀진다",
       (await p.evaluate(function(){ return window.__lsnKept; })) === "있습니다" &&
       (await p.locator("#lsnlist .lsn-c").count()) === 0,
       await p.evaluate(function(){ return location.search; }));
    ok("  주소도 같이 바뀐다 (복사해 보내도 같은 화면)",
       (await p.evaluate(function(){ return location.search; })).indexOf("sub=ls-field") >= 0,
       await p.evaluate(function(){ return location.search; }));
    /* ⚠️ 뒤로 가기 — `pushState` 로 바꿨으니 받는 줄이 없으면 주소만
       바뀌고 **목록이 그대로** 있습니다. */
    await p.goBack();
    await p.waitForTimeout(350);
    ok("  뒤로 가면 **목록도 같이** 돌아온다",
       (await p.locator("#lsnlist .lsn-c").count()) === 1,
       await p.locator("#lsnlist .lsn-c").count());

    /* 카드를 누르면 그 프로의 상세로 — ⚠️ 지시서 §6 이 "사진 또는 카드
       클릭 시 반드시 상세 페이지로 이동한다" 고 적었습니다. */
    ok("카드가 **그 프로의 상세 주소**를 가리킨다",
       (await p.locator("#lsnlist .lsn-c").first().getAttribute("href")) ===
       "/pro/green-pt",
       await p.locator("#lsnlist .lsn-c").first().getAttribute("href"));
    /* ⚠️⚠️ 지어낸 것이 한 줄도 없는가 — 시안의 평점 · 후기 수 · 인증
       배지는 전부 예시입니다(지시서 §2 · §13). */
    ok("⚠️⚠️ 후기가 0건이면 **별도 숫자도 안 찍는다** (절대 규칙 1)",
       (await p.locator("#lsnlist .lsn-r").count()) === 0,
       await p.locator("#lsnlist .lsn-r").count());
    ok("  등록된 레슨 가격은 **그 값 그대로** 나온다",
       ((await p.textContent("#lsnlist")) || "").indexOf("400,000원") >= 0,
       ((await p.textContent("#lsnlist")) || "").slice(0, 120));

    /* 업체 화면 */
    const res = await p.goto("http://127.0.0.1:" + h.port + "/pro/green-pt",
                             { waitUntil:"networkidle" });
    ok("업체 화면이 열린다 (410 에 안 걸린다)", res.status() === 200, res.status());
    t = (await p.textContent("main")) || "";
    ok("이름 · 소개가 나온다", /성남 그린골프연습장/.test(t) && /실내 타석/.test(t));
    ok("영업 지역이 **키가 아니라 이름**으로 나온다",
       /경기/.test(t) && t.indexOf("gyeonggi") < 0);
    ok("거래 규모가 사람 말로 나온다", /중간 규모/.test(t));
    ok("취급 브랜드가 나온다", /타이틀리스트/.test(t));
    ok("확인 배지가 나온다", /사업자등록 확인/.test(t));
    /* ⚠️⚠️ **후기가 0건일 때.** 처음에 여기 적어 둔 검사는
       `a && b || !c` 꼴이라 괄호가 없어 **거의 늘 참**이었습니다 —
       아무것도 안 잡는 검사였습니다 (작업 기억의 그 줄). 이제
       **0건일 때 무엇이 보이고 무엇이 안 보이는가**를 따로 봅니다. */
    ok("⚠️ 후기가 0건이면 **숫자를 안 찍는다**",
       !/[0-9]\.[0-9]\s*점/.test(t), (t.match(/[0-9]\.[0-9]\s*점/) || [""])[0]);
    ok("⚠️ 0건이면 **0 이라고 말한다** (지어내지 않습니다)",
       /아직 후기가 없습니다/.test(t));
    ok("⚠️ 0건이어도 막다른 길로 두지 않는다 (쓸 수 있는 조건을 적습니다)",
       /고르시거나 만나신 뒤/.test(t));
    ok("⚠️ 0건일 때 별 글자를 안 그린다",
       (await p.locator("main .stars").count()) === 0,
       await p.locator("main .stars").count());
    ok("⚠️ 연락처를 화면에 두지 않는다", !/01[0-9]-?[0-9]{3,4}-?[0-9]{4}/.test(t));
    const html = await p.content();
    ok("⚠️ 구조화 데이터에 aggregateRating 이 없다", html.indexOf("aggregateRating") < 0);
    /* ⚠️⚠️ 상담 길 (0035) — 이제 단추가 있습니다. 재는 것은 **단추가
       있는가**와 **지키지 못할 약속을 하지 않는가** 둘입니다. */
    /* ⚠️ 갯수를 박지 않습니다 — 후기가 0건일 때 그 자리에서도 같은
       단추를 하나 더 냅니다 (막다른 길로 두지 않으려고). 갯수를 1 로
       박아 두었더니 그 단추를 더한 날 **멀쩡한 화면이 실패**했습니다. */
    const pvBtns = p.locator('main a.btn[href^="/match?pv="]');
    ok("이 업체로 요청하는 단추가 있다", (await pvBtns.count()) >= 1,
       await pvBtns.count());
    /* ⚠️⚠️ **하나만 보지 않습니다** — 둘 가운데 하나에 id 가 빠지면
       그 단추는 업체를 안 고르고 /match 로 갑니다 (조용히). */
    const hrefs = await pvBtns.evaluateAll(
      function(ns){ return ns.map(function(n){ return n.getAttribute("href"); }); });
    ok("  그 주소에 업체 id 가 **빠짐없이** 실린다",
       hrefs.length > 0 && hrefs.every(function(x){ return x === "/match?pv=green-pt"; }),
       hrefs.join(" "));
    /* ⚠️⚠️⚠️ **"바로 이 업체로 간다" 고 말하면 거짓말입니다** — 배정은
       운영자가 하고, 넘기는 순간 상호를 알리고 제3자 제공 동의를 다시
       받습니다 (제17조 제2항). 화면이 그것을 적는지 봅니다. */
    ok("⚠️ 바로 간다는 약속을 **하지 않는다**",
       /약속은 아닙니다/.test(t), t.slice(0, 400));
    ok("⚠️ 넘기기 전에 다시 여쭙는다고 적는다",
       /연락처 전달 동의를 다시/.test(t), t.slice(0, 400));
    ok("대신 갈 곳도 같이 준다", (await p.locator("main .none a.btn").count()) >= 2);

    /* 업체가 적은 글이 esc 를 거치는가 */
    /* ── 업체 화면의 가격표 (0042) ────────────────────────────────
       ⚠️⚠️ 카드에는 **가장 싼 것 하나**만, 업체 화면에는 **올린 것
       전부**를 냅니다. 둘이 어긋나면 손님이 카드를 누른 뒤에 다른
       숫자를 봅니다. */
    ok("업체 화면에 올린 가격이 **전부** 나온다",
       (await p.locator(".doc-t table").nth(1).locator("tbody tr").count()) === 2,
       await p.locator(".doc-t table").nth(1).locator("tbody tr").count());
    t = (await p.textContent("main")) || "";
    ok("  금액과 단위가 같이 나온다",
       t.indexOf("400,000원") >= 0 && t.indexOf("8회") >= 0, t.slice(0, 300));
    ok("  덧말도 나온다 (타석 이용료 별도)", t.indexOf("타석 이용료 별도") >= 0);
    /* ⚠️ 가격을 냈다고 **우리가 보증하는 것처럼** 적지 않습니다 */
    ok("  ⚠️ 거래 당사자가 아니라고 그 자리에서 말한다",
       /거래 당사자가 아/.test(t));
    ok("  ⚠️ 조건에 따라 달라질 수 있다고 말한다", /달라질 수 있/.test(t));

    /* ── 사업자 정보 (0057 · 제20조 제2항) ────────────────────────
       ⚠️⚠️⚠️ 2026-11-06 까지 이 화면은 `사업자등록 확인` **배지만**
       냈습니다 — 번호도 · 대표자도 · 주소도 없었습니다. 공정위가
       당근마켓에 시정명령 · 과태료를 부과한 조항이 이것입니다.
       ⚠️ 배지와 **번호는 다른 것**입니다 — 배지는 "서류를 봤다" 이고
       번호는 법이 보이라고 한 값입니다. 배지만 보고 "있다" 로 읽은 것이
       이 고장의 까닭입니다. */
    ok("⚠️⚠️ 사업자 정보가 **실제로 그려진다** (제20조 제2항)",
       (await p.locator("dl.pvid").count()) === 1,
       await p.locator("dl.pvid").count());
    const idt = (await p.textContent("dl.pvid")) || "";
    ok("  대표자 · 사업자등록번호 · 전화 · 이메일이 나온다",
       /박대표/.test(idt) && /123-45-67890/.test(idt) &&
       /031-111-2222/.test(idt) && /pt@green\.test/.test(idt), idt);
    ok("  칸 이름이 사람 말이다 (영문 키가 아니다)",
       /대표자/.test(idt) && /사업자등록번호/.test(idt) &&
       idt.indexOf("brn") < 0 && idt.indexOf("ceo") < 0, idt);
    /* ⚠️ 업체가 적은 글입니다 — 태그가 날것으로 들어가면 안 됩니다 */
    const idh = await p.innerHTML("dl.pvid");
    ok("  ⚠️ 업체가 적은 태그가 날것으로 안 들어간다",
       idh.indexOf("<b>경기</b>") < 0 && idh.indexOf("&lt;b&gt;경기") >= 0, idh);
    /* ⚠️⚠️ **상호를 줄로 또 내지 않습니다** — 제목이 이미 그것이고,
       같은 글자를 두 자리에 찍으면 한쪽만 고치는 날 둘이 달라집니다. */
    ok("  ⚠️ 상호는 줄로 또 내지 않는다 (제목이 이미 그것입니다)",
       idt.indexOf("상호") < 0, idt);


    await p.goto("http://127.0.0.1:" + h.port + "/pro/xss-test", { waitUntil:"networkidle" });
    const h2 = await p.innerHTML("main");
    ok("⚠️ 업체가 적은 태그가 날것으로 안 들어간다",
       h2.indexOf("<img src=x") < 0 && h2.indexOf("<script>alert(2)") < 0 &&
       h2.indexOf("&lt;img") >= 0);
    /* ⚠️⚠️ 0057 — **비어 있을 때.** 값을 지어내지 않고(절대 규칙 1),
       빈 자리를 막다른 길로 두지도 않습니다(절대 규칙 2) — 고객센터로
       가는 길을 같이 냅니다. 그리고 무엇이 비었는지는 손님에게 적지
       않고 console 로 운영자에게만 말합니다(절대 규칙 3). */
    const t0 = (await p.textContent("main")) || "";
    ok("⚠️ 신원정보가 비면 **표를 안 그린다** (빈 칸을 안 찍습니다)",
       (await p.locator("dl.pvid").count()) === 0);
    ok("  ⚠️ 아직 등록되지 않았다고 **그 자리에서** 말한다",
       /아직 등록되지/.test(t0), t0.slice(0, 400));
    ok("  ⚠️⚠️ 막다른 길로 두지 않는다 (고객센터로 가는 길을 낸다)",
       (await p.locator('main a[href="/help"]').count()) >= 1,
       await p.locator('main a[href="/help"]').count());
    ok("  ⚠️ 운영자에게 할 말을 손님 화면에 안 찍는다",
       t0.indexOf("/admin") < 0 && t0.indexOf("운영자가 적") < 0, t0.slice(0, 400));
    /* ⚠️⚠️ 재는 것은 "업체가 적은 글 때문에" 그림이 생기는가 입니다.
       0051 뒤로는 업체가 올린 시설 사진(`.pvsh`) · 카드의 사진 자리
       (`.pv-th`) 가 제자리에 그림을 냅니다 — 그것까지 세다가 사진을
       한 장 올리시는 날 멀쩡한 화면을 실패로 잡습니다. 그 둘을 덮어
       주지 않고 **그 밖에 그림이 없는가**만 잽니다. */
    ok("⚠️ 그 글 때문에 그림 · 스크립트가 생기지 않는다",
       (await strayImg(p)) === 0, await strayImg(p));

    /* 메인 */
    await p.goto("http://127.0.0.1:" + h.port + "/", { waitUntil:"networkidle" });
    t = (await p.textContent("main")) || "";
    ok("메인에 입점업체 구간이 생긴다", (await p.locator(".pv").count()) === 2);
    ok("메인이 '아직 입점한 업체가 없습니다' 를 더 안 말한다",
       t.indexOf("아직 입점한 업체가 없습니다") < 0);

    /* ══ 업체찾기 (/search) — 개선 지시서 ═══════════════════════════
       ⚠️⚠️ **눌러 봐야 압니다.** 보내는 열쇠(q · cat · rg)와 받는 쪽이
       어긋나면 **거르개가 아무것도 안 걸렀는데 화면은 열립니다** — 앞
       서비스에서 ?m=apple 을 보내고 mk 를 읽어 링크 검사 · 흐름 검사가
       전부 통과했습니다.
       ⚠️⚠️⚠️ **빌드가 찍은 HTML 과 거르개가 다시 그린 HTML 이 같아야
       합니다.** 다르면 손님이 거르개를 누르는 순간 카드가 조용히
       달라지고, 크롤러가 읽는 글과도 어긋납니다 (앞 서비스에서 열세 번). */
    console.log("\n── /search 업체찾기 — 찍힌 것부터");
    await p.goto("http://127.0.0.1:" + h.port + "/search", { waitUntil:"networkidle" });
    await p.waitForTimeout(250);
    t = (await p.textContent("main")) || "";
    ok("거르개 없이 들어가면 업체가 **전부** 보인다",
       (await p.locator("#sres .pv").count()) === 2,
       await p.locator("#sres .pv").count());
    ok("몇 곳인지 말한다", /업체 2곳/.test(t), t.slice(0, 120));
    ok("중개자임을 그 자리에서 말한다", /통신판매중개자/.test(t));
    /* ⚠️⚠️ **자바스크립트 전의 HTML 에 업체가 있어야** 네이버 · 빙 ·
       LLM 봇이 읽습니다. 그려진 화면만 보는 검사는 영원히 통과합니다 —
       그래서 **찍힌 파일**을 직접 읽습니다. */
    const shtml = fs.readFileSync(path.join(ROOT, "search", "index.html"), "utf8");
    ok("⚠️ 자바스크립트 전의 HTML 에도 업체가 들어 있다 (크롤러가 읽습니다)",
       shtml.indexOf("성남 그린골프연습장") >= 0);
    ok("  그 HTML 에 상담 요청 단추도 들어 있다",
       shtml.indexOf('href="/match?pv=green-pt"') >= 0);
    /* ⚠️ 승인 · 공개된 업체만 — 자료가 **보기**에서 나오는지 봅니다.
       화면이 또 좁히면 두 곳에서 좁히는 것이 되어 어긋납니다. */
    const pull = fs.readFileSync(path.join(ROOT, "tools", "pull-providers.js"), "utf8");
    ok("⚠️ 자료를 `provider` 표가 아니라 **공개 보기**에서 가져온다 " +
       "(승인 · 공개 · 검사용 거르기가 그 보기에 있습니다)",
       pull.indexOf('VIEW = "v_provider_card"') >= 0);

    console.log("\n── /search 카드에 들어 있는 것 (지시서 7번)");
    const c1 = await p.locator('#sres .pv[data-pv="green-pt"]');
    ok("상호가 있다", ((await c1.textContent()) || "").indexOf("성남 그린골프연습장") >= 0);
    ok("지역이 있다", ((await c1.textContent()) || "").indexOf("경기") >= 0);
    ok("하는 일(분류)이 있다",
       (await c1.locator(".pv-c li").count()) >= 1, await c1.locator(".pv-c li").count());
    /* ⚠️⚠️ 사진 자리는 **한 장**이고, 업체가 올린 사진이 있으면 그
       사진 · 없으면 분류 아이콘 타일입니다 (0051 구간이 둘 다 눌러
       봅니다). ⚠️ 여기서 재는 것은 **그 자리 밖에는 그림이 없는가** —
       남의 사진 · 지어낸 그림을 카드 어디에도 깔지 않습니다. */
    ok("⚠️ 사진 자리는 **한 장**이고 그 밖에는 그림이 없다 " +
       "(남의 사진을 깔지 않습니다)",
       (await c1.locator(".pv-th").count()) === 1 &&
       (await c1.locator("img").count()) ===
         (await c1.locator(".pv-th img").count()),
       (await c1.locator("img").count()) + " / " +
         (await c1.locator(".pv-th img").count()));
    ok("상담 요청 단추가 그 업체로 간다",
       ((await c1.locator('a[href^="/match?pv="]').first().getAttribute("href")) || "")
         === "/match?pv=green-pt");
    ok("자세히 보기가 업체 화면으로 간다",
       (await c1.locator('a[href="/pro/green-pt"]').count()) >= 1);
    /* ── 등록된 가격 (0042 · 지시서 7번의 "실제 등록 가격") ──────────
       ⚠️⚠️ **지어낸 값이 아닙니다.** 업체가 /desk 에서 올린 줄을
       그대로 냅니다 (`tools/sql/price.js` 가 DB 쪽을 누릅니다).
       ⚠️ 카드에는 **가장 싼 것**을 냅니다 — 센 값입니다 (저장하지
       않습니다 · 절대 규칙 1). */
    const t1 = (await c1.textContent()) || "";
    ok("등록된 가격이 카드에 나온다", (await c1.locator(".pv-p").count()) === 1);
    ok("  **가장 싼 것**이 나온다 (12,000원)", t1.indexOf("12,000원") >= 0, t1);
    /* ⚠️⚠️ 단위가 빠지면 한 번 값인지 한 달 값인지 모릅니다 */
    ok("  ⚠️ 단위가 **같이** 나온다", t1.indexOf("1시간") >= 0, t1);
    ok("  그 밖에 몇 가지가 더 있는지 말한다", /그 밖 1가지/.test(t1), t1);
    /* ⚠️⚠️ 가격을 **안 올린** 업체는 그 줄이 아예 없어야 합니다 —
       "상담 후 견적" 같은 말을 우리가 지어 넣지 않습니다 (절대 규칙 5). */
    const c2 = await p.locator('#sres .pv[data-pv="xss-test"]');
    ok("⚠️ 가격을 안 올린 업체는 가격 줄이 **아예 없다**",
       (await c2.locator(".pv-p").count()) === 0);
    const tx = (await c2.textContent()) || "";
    ok("  그 자리에 **지어낸 말**이 없다",
       tx.indexOf("상담 후") < 0 && tx.indexOf("문의") < 0 && tx.indexOf("0원") < 0, tx);

    console.log("\n── /search 거르개 — ⚠️ 새로고침하지 않습니다");
    /* ⚠️ 새로고침하면 이 표시가 날아갑니다 — 그것으로 잽니다 */
    await p.evaluate(function(){ window.__kept = "여기 있습니다"; });
    await p.click('a[data-sf="cat"][data-v="fitting"]');
    await p.waitForTimeout(250);
    ok("⚠️ 분류를 누르면 **새로고침되지 않는다**",
       (await p.evaluate(function(){ return window.__kept; })) === "여기 있습니다");
    ok("  주소에 조건이 담긴다 (복사해 보낼 수 있고 뒤로 가기도 됩니다)",
       (await p.evaluate(function(){ return location.search; })) === "?cat=fitting",
       await p.evaluate(function(){ return location.search; }));
    ok("  그 분류의 업체만 남는다", (await p.locator("#sres .pv").count()) === 1,
       await p.locator("#sres .pv").count());
    ok("  남은 것이 맞는 업체다",
       (await p.locator("#sres .pv").first().getAttribute("data-pv")) === "xss-test");
    ok("  지금 조건을 **글로** 말한다",
       /피팅/.test((await p.textContent("#sfnow")) || ""), await p.textContent("#sfnow"));
    ok("  눌린 칸이 화면 읽는 기계에도 눌린 것으로 보인다",
       (await p.getAttribute('a[data-sf="cat"][data-v="fitting"]', "aria-pressed")) === "true");

    /* ⚠️⚠️ 조건을 **겹쳐도** 지켜지나 — 분류를 고른 뒤 지역을 누르면
       분류가 조용히 풀리면 안 됩니다 (링크 주소를 다시 지어야 합니다). */
    await p.click('a[data-sf="rg"][data-v="seoul"]');
    await p.waitForTimeout(250);
    ok("분류 + 지역이 **같이** 걸린다",
       (await p.evaluate(function(){ return location.search; })).indexOf("cat=fitting") >= 0 &&
       (await p.evaluate(function(){ return location.search; })).indexOf("rg=seoul") >= 0,
       await p.evaluate(function(){ return location.search; }));
    ok("  둘 다 맞는 업체가 남는다", (await p.locator("#sres .pv").count()) === 1);
    /* 맞는 것이 없는 조합 — ⚠️ "업체 0곳" 과 다른 말을 해야 합니다 */
    await p.click('a[data-sf="rg"][data-v="busan"]');
    await p.waitForTimeout(250);
    t = (await p.textContent("#sres")) || "";
    ok("조건에 맞는 업체가 없으면 **그렇게** 말한다",
       /조건에 맞는 업체가 없습니다/.test(t), t.slice(0, 160));
    ok("  ⚠️ '등록된 업체가 없습니다' 라고 **말하지 않는다** (다른 상황입니다)",
       t.indexOf("아직 등록된 업체가 없습니다") < 0, t.slice(0, 200));
    ok("  막다른 길로 두지 않는다 (매칭 요청 단추를 낸다)",
       (await p.locator('#sres a[href="/match"]').count()) === 1);
    ok("  조건을 지우는 길도 낸다",
       (await p.locator('#sres a[href="/search"]').count()) === 1);
    ok("  지킬 수 없는 약속을 하지 않는다",
       !/시간 안에|며칠|곧 등록/.test(t), t.slice(0, 200));

    /* 뒤로 가기 */
    await p.goBack();
    await p.waitForTimeout(250);
    ok("⚠️ 뒤로 가기가 **전 조건으로** 돌아간다",
       (await p.locator("#sres .pv").count()) === 1 &&
       (await p.evaluate(function(){ return location.search; })).indexOf("rg=seoul") >= 0,
       await p.evaluate(function(){ return location.search; }));

    /* ══════════════════════════════════════════════════════════════
       하위분류로 좁혀 가는 길 (지시서 §4 · `?sub=`)

       ⚠️⚠️⚠️ **전에는 하위 예순둘이 분류 화면에 글로만 있었습니다.**
       "화면이 있다" 와 "거기까지 가는 길이 있다" 는 다릅니다 —
       `/login` · `/my` 가 아무 데서도 안 이어져 있던 자리와 같습니다.
       ⚠️ 열쇠 이름이 보내는 쪽과 **글자까지** 같은지는 **눌러 봐야**
       압니다 (`?m=apple` 을 보내고 `mk` 를 읽어 거르개가 아무것도
       안 걸렀는데 링크 검사도 흐름 검사도 통과한 적이 있습니다).
       ══════════════════════════════════════════════════════════════ */
    /* ══════════════════════════════════════════════════════════════
       업체가 올린 시설 사진 (0051)

       ⚠️⚠️⚠️ **가장 조심할 것은 증빙서류입니다.** 자료 파일에 서류가
       한 줄이라도 섞이면 그 순간 사업자등록증이 **정적 HTML 에**
       찍힙니다 — 공개 보기가 `kind='photo'` 만 내므로 그럴 일이
       없지만, 그 사실을 **화면에서** 한 번 더 봅니다.
       ⚠️ 사진이 0장인 업체는 **분류 아이콘 타일**로 돌아가야 합니다
       (빈 액자를 두면 미완성으로 읽힙니다).
       ══════════════════════════════════════════════════════════════ */
    console.log("\n── 업체가 올린 시설 사진 (0051)");
    await p.goto("http://127.0.0.1:" + h.port + "/pro/green-pt",
                 { waitUntil:"networkidle" });
    await p.waitForTimeout(200);
    const shot = await p.evaluate(function(){
      const imgs = Array.prototype.map.call(
        document.querySelectorAll(".pvsh img"),
        function(i){ return { src:i.getAttribute("src"), alt:i.getAttribute("alt"),
                              lazy:i.getAttribute("loading") }; });
      return { n: imgs.length, imgs: imgs,
               cap: (document.querySelector(".pvsh p") || {}).textContent || "",
               head: (document.querySelector(".pvsh") &&
                      document.querySelector(".pvsh").closest("section")
                        .querySelector("h2").textContent) || "",
               body: document.body.innerText };
    });
    ok("업체 화면에 그 업체가 올린 사진이 나온다", shot.n === 2,
       JSON.stringify(shot).slice(0, 200));
    ok("  ⚠️ **우리가 고른 사진이 아니라고** 말한다",
       shot.body.indexOf("업체가 직접 올린 시설 사진") >= 0, shot.body.slice(0, 300));
    ok("  ⚠️ alt 에 **상호**가 들어간다 (소리로 듣는 분께)",
       shot.imgs.every(function(i){ return (i.alt || "").indexOf("성남") >= 0; }),
       JSON.stringify(shot.imgs));
    ok("  첫 화면 아래라 lazy 를 단다",
       shot.imgs.every(function(i){ return i.lazy === "lazy"; }),
       JSON.stringify(shot.imgs));
    ok("  설명이 있으면 적고, 없으면 그 줄이 **줄째 빠진다**",
       shot.cap === "실내 타석" &&
       (shot.body.match(/실내 타석/g) || []).length >= 1, shot.cap);
    /* ⚠️⚠️⚠️ **증빙서류가 한 장도 안 새는가** */
    ok("⚠️⚠️⚠️ 서류 경로(`/doc/`)가 화면 어디에도 **없다**",
       (await p.content()).indexOf("/doc/") < 0, "");

    /* 카드 — ⚠️ 사진이 있으면 그 사진, 없으면 아이콘 타일 */
    await p.goto("http://127.0.0.1:" + h.port + "/search", { waitUntil:"networkidle" });
    await p.waitForTimeout(250);
    const th = await p.evaluate(function(){
      const out = [];
      Array.prototype.forEach.call(document.querySelectorAll("#sres .pv"), function(c){
        const t = c.querySelector(".pv-th");
        out.push({ pv: c.getAttribute("data-pv"),
                   photo: !!(t && t.querySelector("img")),
                   icon: !!(t && t.querySelector("svg")),
                   hidden: t ? t.getAttribute("aria-hidden") : null });
      });
      return out;
    });
    ok("⚠️ 잴 것이 0개면 실패입니다 (카드를 찾기는 했는가)", th.length > 0,
       JSON.stringify(th));
    const withPh = th.filter(function(x){ return x.photo; });
    const withIc = th.filter(function(x){ return x.icon; });
    ok("⚠️⚠️ 사진이 있는 업체 카드에는 **그 사진**이 들어간다",
       withPh.length === 1 && withPh[0].pv === "green-pt", JSON.stringify(th));
    ok("⚠️ 사진이 0장인 업체는 **아이콘 타일로 돌아간다** (빈 액자를 안 둡니다)",
       withIc.length === 1 && withIc[0].pv === "xss-test", JSON.stringify(th));
    /* ⚠️ 아이콘 타일은 **장식**이라 소리로 듣는 분께 안 읽힙니다 —
       사진은 읽혀야 하므로 그 표시가 달라야 합니다. */
    ok("  아이콘 타일만 `aria-hidden` 이다 (사진은 읽혀야 합니다)",
       withIc[0].hidden === "true" && withPh[0].hidden === null,
       JSON.stringify(th));

    console.log("\n── /search 하위분류로 좁히기 (?sub=)");
    /* green-pt 는 rg-in · rg-sim · ls-solo 를 합니다 · xss-test 는 ft-* */
    await p.goto("http://127.0.0.1:" + h.port + "/search?cat=range&sub=rg-sim",
                 { waitUntil:"networkidle" });
    await p.waitForTimeout(250);
    ok("⚠️⚠️ 하위분류로 좁혀진다 (열쇠 이름이 실제로 맞습니다)",
       (await p.locator("#sres .pv").count()) === 1,
       await p.locator("#sres .pv").count());
    ok("  남은 것이 그 일을 하는 업체다",
       (await p.locator("#sres .pv").first().getAttribute("data-pv")) === "green-pt");
    ok("  지금 조건에 **하위 이름**이 글로 나온다 (칸이 없는 조건입니다)",
       /스크린/.test((await p.textContent("#sfnow")) || ""),
       await p.textContent("#sfnow"));

    /* ⚠️ 그 업체가 **안 하는** 하위로 좁히면 0건이어야 합니다 */
    await p.goto("http://127.0.0.1:" + h.port + "/search?cat=fitting&sub=ft-grip",
                 { waitUntil:"networkidle" });
    await p.waitForTimeout(250);
    ok("다른 하위로 좁히면 **다른 업체**가 남는다",
       (await p.locator("#sres .pv").count()) === 1 &&
       (await p.locator("#sres .pv").first().getAttribute("data-pv")) === "xss-test",
       await p.locator("#sres .pv").count());

    await p.goto("http://127.0.0.1:" + h.port + "/search?cat=range&sub=rg-out",
                 { waitUntil:"networkidle" });
    await p.waitForTimeout(250);
    t = (await p.textContent("#sres")) || "";
    ok("⚠️ 아무도 안 하는 하위면 **조건에 맞는 업체가 없다**고 말한다",
       /조건에 맞는 업체가 없습니다/.test(t), t.slice(0, 160));
    ok("  ⚠️ '등록된 업체가 없습니다' 라고 **말하지 않는다** (다른 상황입니다)",
       t.indexOf("아직 등록된 업체가 없습니다") < 0, t.slice(0, 200));
    ok("  막다른 길로 두지 않는다 (매칭 요청 · 조건 지우기)",
       (await p.locator('#sres a[href="/match"]').count()) === 1 &&
       (await p.locator('#sres a[href="/search"]').count()) === 1);

    /* ⚠️⚠️⚠️ **분류를 바꾸면 하위를 같이 풀어야** 합니다. 안 풀면
       "연습장의 하위" 를 들고 "피팅" 으로 옮겨 가서 **영원히 0건**이
       되고, 손님은 그 분류에 업체가 없는 줄 압니다. */
    await p.goto("http://127.0.0.1:" + h.port + "/search?cat=range&sub=rg-sim",
                 { waitUntil:"networkidle" });
    await p.waitForTimeout(250);
    await p.click('a[data-sf="cat"][data-v="fitting"]');
    await p.waitForTimeout(250);
    const moved = await p.evaluate(function(){ return location.search; });
    ok("⚠️⚠️ 분류를 바꾸면 **하위가 같이 풀린다**",
       moved.indexOf("cat=fitting") >= 0 && moved.indexOf("sub=") < 0, moved);
    ok("  그래서 0건이 되지 않는다", (await p.locator("#sres .pv").count()) === 1,
       await p.locator("#sres .pv").count());
    /* ⚠️ 지역을 눌러도 하위는 지켜져야 합니다 (같은 분류 안입니다) */
    await p.goto("http://127.0.0.1:" + h.port + "/search?cat=range&sub=rg-sim",
                 { waitUntil:"networkidle" });
    await p.waitForTimeout(250);
    await p.click('a[data-sf="rg"][data-v="gyeonggi"]');
    await p.waitForTimeout(250);
    const kept = await p.evaluate(function(){ return location.search; });
    ok("⚠️ 지역을 눌러도 하위는 **지켜진다** (같은 분류 안입니다)",
       kept.indexOf("sub=rg-sim") >= 0 && kept.indexOf("rg=gyeonggi") >= 0, kept);

    /* ⚠️ 모르는 하위 키로 와도 **이름을 지어내지 않습니다** */
    await p.goto("http://127.0.0.1:" + h.port + "/search?sub=이런하위는없습니다",
                 { waitUntil:"networkidle" });
    await p.waitForTimeout(250);
    ok("모르는 하위 키면 0건이고 키를 그대로 적는다 (이름을 지어내지 않습니다)",
       (await p.locator("#sres .pv").count()) === 0 &&
       /이런하위는없습니다/.test((await p.textContent("#sres")) || ""),
       (await p.textContent("#sres")) || "");

    /* ══ 하위 칩이 **갈 자리가 있는 것만** 링크인가 ════════════════
       ⚠️⚠️⚠️ 2026-11-08 — 전까지 이 검사는 `/cat/used` 에서
       "글로 둔 칩이 하나라도 있는가"(`text > 0`)를 재고 있었습니다.
       그런데 0068 이 매물 목록에 `?s=` 거르개를 냈고 0059 가 게시판에
       `?s=` 를 냈으므로, 중고 일곱과 게시판 열둘은 **이제 갈 자리가
       있습니다** — 그 열아홉을 글로 두면 거꾸로 "되는 것을 안 되는
       것처럼" 적는 꼴입니다 (절대 규칙 5 의 뒤집힌 판).
       ⚠️ 재려는 뜻은 처음부터 하나입니다: **갈 자리가 있으면 링크 ·
       없으면 글.** 갈래를 정하는 자리는 `amSubGoes()` 한 곳이고,
       여기서는 그 결과를 주소 꼴로 확인합니다. 갯수는 안 박습니다. */

    /* ══════════════════════════════════════════════════════════════
       피팅 · 수리 (확정 시안 ⑦ · 2026-11-12)
       ⚠️⚠️ 흉내가 아니라 **빌드가 찍은 화면**을 누릅니다 — 거르개가
         주소만 바꾸고 안 걸러 주면 줄 수로는 안 드러납니다.
       ══════════════════════════════════════════════════════════════ */
    /* ══════════════════════════════════════════════════════════════
       연습장 (확정 시안 ⑤ · 2026-11-12)
       ⚠️⚠️⚠️ **2026-11-12 까지 이 묶음이 0건이었습니다.** `js/range.js`
         의 거르개 여섯(지역 · 실내외 · 스크린 · 주차 · 가격 · 찾는 말)을
         아무도 눌러 본 적이 없었습니다 — 피팅은 19건인데 연습장은
         위에서 **카드 수만** 세고 있었습니다. 거르개가 주소만 바꾸고
         안 걸러 주면 **어떤 검사도 안 잡는** 자리였습니다
         (0071 이 낸 단추 셋에 화면 검사가 0건이던 그 자리).
       ⚠️ 흉내가 아니라 **빌드가 찍은 화면**을 누릅니다 — 연습장은
         `AM_PROVIDERS`(빌드가 실어 준 것)로 거르므로 설정이 없어도
         그대로 돕니다.
       ══════════════════════════════════════════════════════════════ */
    console.log("\n── 연습장 (시안 ⑤)");
    await p.goto("http://127.0.0.1:" + h.port + "/cat/range", { waitUntil:"networkidle" });
    await p.waitForTimeout(200);
    ok("⚠️ 잴 것이 0개면 실패입니다 (연습장이 씨앗에 있는가)",
       (await p.locator(".rng-c").count()) === 1,
       await p.locator(".rng-c").count());
    /* ⚠️⚠️ **단추가 아니라 양식(form)입니다** — 자바스크립트가 꺼진
       분에게도 GET 으로 그대로 돕니다(절대 규칙 5). */
    ok("⚠️⚠️ 거르개가 **양식**이고 GET 으로 돈다 (자바스크립트가 꺼져도)",
       ((await p.getAttribute("#rngform", "method")) || "").toLowerCase() === "get" &&
       ((await p.getAttribute("#rngform", "action")) || "").indexOf("/cat/range") === 0,
       (await p.getAttribute("#rngform", "method")) + " " +
       (await p.getAttribute("#rngform", "action")));
    ok("  고르개 다섯 (지역 · 실내외 · 스크린 · 주차 · 가격)",
       (await p.locator("#rngform select").count()) === 5,
       await p.locator("#rngform select").count());
    ok("  찾는 칸이 있다 (시안의 「지역, 연습장 이름으로 검색」)",
       (await p.locator("#rng-q").count()) === 1);
    /* 카드 — ⚠️⚠️ **연습장 값만** 찍혀야 합니다. `amPriceLow()` 를
       그대로 썼으면 같은 업체의 레슨 8회권(400,000원)이 타석 값인 것처럼
       찍힙니다(2026-11-10 에 레슨 화면에서 실제로 겪은 자리). */
    const rngCard = (await p.textContent(".rng-c")) || "";
    ok("⚠️⚠️⚠️ 카드에 **연습장 값**이 찍힌다 (레슨 회차권이 안 샙니다)",
       rngCard.indexOf("12,000") >= 0 && rngCard.indexOf("400,000") < 0,
       rngCard.replace(/\s+/g, " ").trim().slice(0, 160));
    ok("  카드가 /pro/<id> 로 간다",
       ((await p.getAttribute(".rng-n a", "href")) || "") === "/pro/green-pt",
       await p.getAttribute(".rng-n a", "href"));
    ok("  업체가 고른 시설만 칩으로 나온다 (실외는 안 골랐습니다)",
       rngCard.indexOf("실내") >= 0 && rngCard.indexOf("스크린") >= 0 &&
       rngCard.indexOf("실외") < 0,
       rngCard.replace(/\s+/g, " ").trim().slice(0, 160));

    /* ── 거르개를 **실제로** 눌러 봅니다 ──────────────────────────
       ⚠️ 주소만 맞고 안 걸리면 아무 뜻이 없습니다 — 카드 수를 셉니다. */
    async function rngGo(q){
      await p.goto("http://127.0.0.1:" + h.port + "/cat/range" + q,
                   { waitUntil:"networkidle" });
      await p.waitForTimeout(300);
      return await p.locator(".rng-c").count();
    }
    ok("지역 — 맞는 지역이면 남는다", (await rngGo("?rg=gyeonggi")) === 1);
    ok("  다른 지역이면 빠진다", (await rngGo("?rg=seoul")) === 0);
    ok("실내 · 실외 — 고른 시설이면 남는다", (await rngGo("?io=indoor")) === 1);
    /* ⚠️⚠️ **안 고른 시설로 좁히면 빠집니다** — 모르는 것을 아무 칸에나
       넣으면 그게 지어낸 값입니다(절대 규칙 1). 화면이 그 사실을 0건
       안내에서 말하는지도 아래에서 같이 봅니다. */
    ok("⚠️⚠️ 안 고른 시설로 좁히면 **빠진다** (지어내지 않습니다)",
       (await rngGo("?io=outdoor")) === 0);
    ok("스크린 — 있는 곳만 남는다", (await rngGo("?sc=1")) === 1);
    ok("주차 — 있는 곳만 남는다", (await rngGo("?pk=1")) === 1);
    /* 가격대 — ⚠️ 경계는 **아래를 열고 위를 닫습니다**(gte · lt).
       씨앗의 타석 값이 **12,000원**이므로 r2(1만~2만)에만 걸립니다. */
    ok("가격대 — 1만 ~ 2만원에 걸린다 (타석 12,000원)",
       (await rngGo("?p=r2")) === 1);
    ok("  1만원 미만에는 안 걸린다 (경계 gte 10000)",
       (await rngGo("?p=r1")) === 0);
    ok("  2만원 이상에도 안 걸린다 (경계 lt 20000)",
       (await rngGo("?p=r3")) === 0);
    /* 찾는 말 — ⚠️ 시안이 「지역, 연습장 이름으로 검색」이라고 적었으므로
       **사람이 읽는 이름**으로 찾습니다(손님은 `gyeonggi` 를 치지 않습니다). */
    ok("찾는 말 — 연습장 이름으로 걸린다",
       (await rngGo("?q=" + encodeURIComponent("그린골프"))) === 1);
    ok("  **지역 이름**으로도 걸린다 (키가 아니라 사람 말입니다)",
       (await rngGo("?q=" + encodeURIComponent("경기"))) === 1);
    ok("  시설 이름으로도 걸린다",
       (await rngGo("?q=" + encodeURIComponent("스크린"))) === 1);
    ok("  없는 말이면 0건", (await rngGo("?q=" + encodeURIComponent("없는말"))) === 0);

    /* ── 0건 안내가 **두 가지로 갈리는가** ───────────────────────
       ⚠️⚠️ 아직 아무도 안 들어온 것과 조건에 맞는 곳이 없는 것은
       다릅니다(절대 규칙 2). 씨앗에 한 곳이 있으므로 여기서는 「조건」
       갈래를 봅니다 — 「아예 0곳」 갈래는 씨앗 없는 빌드에서 위에서
       이미 재집니다(`/cat/travel` 줄). */
    await rngGo("?io=outdoor");
    const rngNone = (await p.textContent("#rnglist")) || "";
    ok("⚠️⚠️ 0건을 **조건 때문**이라고 말한다 (「등록된 연습장이 없습니다」가 아닙니다)",
       rngNone.indexOf("고르신 조건에 맞는") >= 0 &&
       rngNone.indexOf("등록된 연습장이 없습니다") < 0,
       rngNone.replace(/\s+/g, " ").trim().slice(0, 160));
    ok("  **안 올리신 곳은 빠진다**는 사실을 그 자리에서 말한다",
       /안 올리신/.test(rngNone), rngNone.replace(/\s+/g, " ").trim().slice(0, 200));
    ok("  막다른 길이 아니다 (조건 지우기 · 요청하기)",
       (await p.locator('#rnglist a[href="/cat/range"]').count()) === 1 &&
       (await p.locator('#rnglist a[href="/match?cat=range"]').count()) === 1);
    /* 「조건 모두 지우기」를 눌러 봅니다 — ⚠️ 주소가 **깨끗해져야** 합니다 */
    await p.click('#rnglist a[href="/cat/range"]');
    await p.waitForTimeout(300);
    ok("⚠️⚠️ 조건 지우기를 누르면 **주소까지** 깨끗해진다",
       (await p.evaluate(function(){ return location.search; })) === "" &&
       (await p.locator(".rng-c").count()) === 1,
       await p.evaluate(function(){ return location.search; }));

    /* ── 고르개를 바꾸면 **새로고침 없이** 좁혀지는가 ────────────── */
    await p.selectOption("#rng-io", "outdoor");
    await p.waitForTimeout(350);
    ok("고르개를 바꾸면 새로고침 없이 좁혀지고 주소도 바뀐다",
       (await p.locator(".rng-c").count()) === 0 &&
       (await p.evaluate(function(){ return location.search; }))
         .indexOf("io=outdoor") >= 0,
       await p.evaluate(function(){ return location.search; }));
    /* ⚠️⚠️ 고르개가 **지금 조건에 맞춰져** 있어야 합니다 — 안 맞추면
       주소로 들어오신 분께 「전체」라고 적힌 칸 아래 좁혀진 목록이
       나옵니다. */
    ok("  고르개가 지금 조건을 보여 준다",
       (await p.inputValue("#rng-io")) === "outdoor");
    /* ⚠️⚠️ 뒤로 가기를 받습니다 — `pushState` 로 주소만 바꾸므로 이
       줄이 없으면 주소만 바뀌고 **목록이 그대로** 있습니다. */
    await p.goBack();
    await p.waitForTimeout(350);
    ok("⚠️⚠️ 뒤로 가기를 받는다 (주소만 바뀌고 목록이 그대로 있지 않다)",
       (await p.locator(".rng-c").count()) === 1,
       await p.locator(".rng-c").count());
    /* 찾는 칸은 **글자를 칠 때마다 다시 그리지 않습니다** — 그러면
       커서가 튕겨 나갑니다(0068 의 그 자리). 보내는 것은 양식 제출뿐. */
    await p.fill("#rng-q", "없는말");
    await p.waitForTimeout(350);
    ok("⚠️ 찾는 칸은 글자를 칠 때 다시 안 그린다 (커서가 튕기지 않습니다)",
       (await p.locator(".rng-c").count()) === 1,
       await p.locator(".rng-c").count());
    await p.press("#rng-q", "Enter");
    await p.waitForTimeout(350);
    ok("  Enter 로 보내면 좁혀진다",
       (await p.locator(".rng-c").count()) === 0 &&
       (await p.evaluate(function(){ return location.search; }))
         .indexOf("q=") >= 0,
       await p.evaluate(function(){ return location.search; }));
    ok("연습장 화면에서 에러 · CSP 거절이 0건이다", hits.length === 0, hits.join(" | "));

    console.log("\n── 피팅 · 수리 (시안 ⑦)");
    await p.goto("http://127.0.0.1:" + h.port + "/cat/fitting", { waitUntil:"networkidle" });
    await p.waitForTimeout(200);
    ok("⚠️ 잴 것이 0개면 실패입니다 (피팅 업체가 씨앗에 있는가)",
       (await p.locator(".fit-c").count()) === 1,
       await p.locator(".fit-c").count());
    /* ⚠️⚠️⚠️ **묶음 탭과 하위 칩이 둘 다 섭니다**(2026-11-12 · 시안 ⑦).
       시안은 「클럽 피팅」 하나로 묶었는데 우리 하위는 **둘**(드라이버 ·
       아이언)이라, 묶음만 내면 그 둘로 바로 가는 길이 없어집니다.
       ⚠️ 갯수를 박지 않습니다 — `AM_FIT_GROUP` 과 `amCatItems()` 에서
       **읽어서** 셉니다(묶음이 느는 날 썩지 않게). */
    const fitG = await p.evaluate(function(){
      return (window.AM_FIT_GROUP || []).length; });
    const fitI = await p.evaluate(function(){
      var c = window.amCat ? window.amCat("fitting") : null;
      return (c && window.amCatItems) ? window.amCatItems(c).length : 0; });
    ok("⚠️ 잴 것이 0개면 실패입니다 (묶음 · 하위 목록을 읽기는 했는가)",
       fitG > 0 && fitI > 0, fitG + " / " + fitI);
    ok("  시안의 **묶음 탭**이 선다 (아이콘 카드)",
       (await p.locator(".fitsv-a").count()) === fitG,
       await p.locator(".fitsv-a").count() + " / " + fitG);
    ok("  ⚠️⚠️ **하위 키가 하나도 안 줄었다** (묶어도 제 길이 그대로)",
       (await p.locator(".chips-sub li").count()) === fitI,
       await p.locator(".chips-sub li").count() + " / " + fitI);
    ok("  ⚠️ 묶음 카드에 **빈 아이콘 자리가 없다**",
       (await p.evaluate(function(){
         return Array.prototype.filter.call(
           document.querySelectorAll(".fitsv-i"),
           function(e){ return !e.querySelector("svg"); }).length;
       })) === 0);
    /* ⚠️⚠️⚠️ **시안 ⑦ 의 레일은 고르개가 아니라 네모 칸입니다**
       (지시 5번 — 「단일 선택이어도 시안 형태 선택 UI」). 전에는
       `<select>` 셋이었고 그때 이 줄도 셋을 세고 있었습니다 — 바꾸는
       날 **그 검사도 같이** 뒤집지 않으면 멀쩡한 코드가 실패로 잡히고,
       안 뒤집으면 **옛 모양을 지키는 검사**가 됩니다.
       ⚠️ 갯수를 박지 않습니다 — 지역 수는 `AM_REGIONS` 에서 읽습니다. */
    const fitRg = await p.evaluate(function(){
      return (window.AM_REGIONS || []).length; });
    ok("⚠️ 잴 것이 0개면 실패입니다 (지역 목록을 읽기는 했는가)", fitRg > 0, fitRg);
    ok("  왼쪽 레일이 **묶음 셋**이다 (지역 · 서비스 방식 · 가격)",
       (await p.locator(".fit-rail .fit-rail-g").count()) === 3,
       await p.locator(".fit-rail .fit-rail-g").count());
    ok("  ⚠️ 고르개(`select`)가 레일에 **한 개도 없다** (시안 형태로 바꿨습니다)",
       (await p.locator(".fit-rail select").count()) === 0,
       await p.locator(".fit-rail select").count());
    ok("  ⚠️⚠️ 지역 칸이 **열일곱 + 전체** 다 있다 (묶어서 줄이지 않습니다)",
       (await p.locator('.fit-rail input[name="rg"]').count()) === fitRg + 1,
       await p.locator('.fit-rail input[name="rg"]').count() + " / " + (fitRg + 1));
    ok("  ⚠️ 묶음마다 **하나만** 켜져 있고 처음엔 「전체」다",
       (await p.evaluate(function(){
         return ["rg", "w", "p"].map(function(k){
           var L = document.querySelectorAll('#fitform input[name="' + k + '"]:checked');
           return L.length === 1 && L[0].value === "" ? 1 : 0;
         }).join("");
       })) === "111");
    /* ⚠️⚠️ **눌러서** 좁혀지는지 봅니다 — 그려졌는지만 보면 「골라도
       아무 일이 안 나는 칸」을 못 잡습니다(절대 규칙 5). */
    await p.click("#fit-w-ship");
    await p.waitForTimeout(250);
    ok("  ⚠️⚠️ 네모 칸을 누르면 **새로고침 없이** 좁혀지고 주소에 남는다",
       (await p.locator(".fit-c").count()) === 0 &&
       (await p.evaluate(function(){ return location.search; })).indexOf("w=ship") >= 0,
       await p.evaluate(function(){ return location.search; }));
    await p.click("#fit-w-all");
    await p.waitForTimeout(250);
    ok("  「전체」로 되돌리면 다시 다 보인다 (막다른 길로 두지 않습니다)",
       (await p.locator(".fit-c").count()) > 0 &&
       (await p.evaluate(function(){ return location.search; })).indexOf("w=") < 0,
       await p.evaluate(function(){ return location.search; }));
    /* ⚠️⚠️⚠️ 시안의 「추천순」은 **안 냅니다** — 무엇이 추천인지 세어 본
       적이 없습니다(절대 규칙 1). 생기는 날 이 줄이 먼저 빨개집니다. */
    const fitSrt = (await p.textContent("#fit-o")) || "";
    ok("⚠️⚠️ 차례에 「추천순」이 **없다** (세어 본 적이 없습니다)",
       fitSrt.indexOf("추천") < 0, fitSrt.replace(/\s+/g, " ").trim());
    /* ⚠️⚠️⚠️ **거래 조건은 업체가 적는 값입니다**(0079 · 2026-11-12).
       시안 카드의 「부품비 별도 · 최종 견적 상담」이 그 줄인데, 저희가
       지어 적으면 그 순간 **업체가 하지 않은 약속**이 손님 화면에
       나갑니다(절대 규칙 1 · 5). 씨앗 업체는 그 칸을 **안 적었으므로**
       그 줄이 **줄째 빠져야** 합니다.
       ⚠️ 적으신 업체에 그 글자가 그대로 나가는지는 `/desk` 쪽에서
       봅니다(`test-desk` 가 문이 덮어쓰는 칸을 읽어 세는 자리). */
    const fitCard = (await p.textContent(".fit-c")) || "";
    ok("⚠️⚠️ 안 적으신 업체는 거래 조건 줄이 **줄째 빠진다**",
       fitCard.indexOf("부품비") < 0 &&
       (await p.locator(".fit-c .fit-t").count()) === 0,
       fitCard.replace(/\s+/g, " ").slice(0, 160));
    /* ⚠️⚠️ 값을 **안 올리신** 업체는 그 줄이 아예 없어야 합니다 —
       "상담 후 견적" 같은 말을 우리가 지어 넣지 않습니다(절대 규칙 5). */
    ok("⚠️ 공임을 안 올린 업체는 **등록 전이라는 사실**만 적는다",
       fitCard.indexOf("등록된 공임이 아직 없습니다") >= 0 &&
       fitCard.indexOf("상담 후") < 0 && fitCard.indexOf("협의") < 0,
       fitCard.replace(/\s+/g, " ").slice(0, 200));
    /* ⚠️ 업체가 적은 글은 esc() 를 지나야 합니다 (절대 규칙 4) */
    ok("⚠️ 업체 이름의 태그가 날것으로 안 나간다",
       (await p.locator(".fit-c img[src='x']").count()) === 0);

    /* 탭 — ⚠️ **새로고침 없이** 좁혀지는지 눌러 봅니다 */
    await p.click('.fit-tab-a[data-sub="ft-grip"]');
    await p.waitForTimeout(250);
    ok("탭을 누르면 그 일을 하는 업체만 남는다",
       (await p.locator(".fit-c").count()) === 1 &&
       (await p.evaluate(function(){ return location.search; }))
         .indexOf("sub=ft-grip") >= 0,
       await p.evaluate(function(){ return location.search; }));
    /* ⚠️⚠️⚠️ **묶음 탭은 쉼표로 둘을 보냅니다** — 길만 내고 받는 쪽을
       안 고치면 눌러도 **아무것도 안 걸립니다**(에러 0줄 · 2026-11-09 에
       머리말 「골프 정보 · 후기」가 모아보기로 떨어진 그 자리). 그래서
       **주소와 걸린 결과를 같이** 봅니다. */
    await p.click('.fitsv-a[data-sub="ft-driver,ft-iron"]');
    await p.waitForTimeout(250);
    const fitQ = await p.evaluate(function(){ return location.search; });
    ok("⚠️⚠️ 묶음 탭이 **쉼표로 둘**을 보낸다",
       fitQ.indexOf("sub=ft-driver%2Cft-iron") >= 0 ||
       fitQ.indexOf("sub=ft-driver,ft-iron") >= 0, fitQ);
    ok("  ⚠️⚠️⚠️ 받는 쪽이 쉼표를 **갈라서 거른다** (둘 중 하나라도 하면 남습니다)",
       (await p.locator(".fit-c").count()) === 0,
       await p.locator(".fit-c").count());
    ok("  그 묶음 카드가 **켜진 채**로 보인다",
       ((await p.textContent(".fitsv-a.on")) || "").indexOf("클럽 피팅") >= 0,
       (await p.textContent(".fitsv-a.on")) || "");
    await p.click('.fit-tab-a[data-sub="ft-driver"]');
    await p.waitForTimeout(250);
    ok("  ⚠️⚠️ 하위 칩을 고르면 **그것을 담은 묶음**이 켜진다",
       ((await p.textContent(".fitsv-a.on")) || "").indexOf("클럽 피팅") >= 0,
       (await p.textContent(".fitsv-a.on")) || "");
    ok("  안 하는 하위를 누르면 0건이고 **다른 말**을 한다",
       (await p.locator(".fit-c").count()) === 0 &&
       ((await p.textContent("#fitlist")) || "")
         .indexOf("고르신 조건에 맞는 업체가 없습니다") >= 0,
       ((await p.textContent("#fitlist")) || "").replace(/\s+/g, " ").slice(0, 120));
    ok("  ⚠️ 「등록된 피팅 · 수리 업체가 없습니다」 라고 **말하지 않는다**",
       ((await p.textContent("#fitlist")) || "").indexOf("등록된 피팅") < 0);

    /* `/pro` — ⚠️⚠️⚠️ **거래 조건은 업체가 적는 값입니다**(0079). 씨앗
       업체는 그 칸을 안 적었으므로 **줄째 빠져야** 합니다. 저희가
       「부품비 별도」를 지어 적으면 그 순간 업체가 하지 않은 약속이
       손님 화면에 나갑니다(절대 규칙 1 · 5).
       ⚠️ 카드와 **같은 값**을 내야 합니다 — 두 곳이 다른 말을 하면
       카드를 보고 들어온 분이 상세에서 다른 조건을 읽습니다. */
    /* ⚠️⚠️⚠️ **`/pro/t-fit` 을 열고 있었습니다 — 그 화면은 빌드에
       없습니다.** `t-fit` 은 `db/seed/test-providers.sql`(DB 씨앗)의
       id 이고, 이 검사가 심는 씨앗(`SEED`)은 `green-pt` · `xss-test`
       둘뿐입니다. 그래서 404 가 떠 `main` 을 30초 기다리다 **검사가
       통째로 터졌고**, 그 뒤 줄이 하나도 안 돌았습니다(2026-11-12 에
       이 줄을 쓰면서 한 번도 안 돌려 본 자리입니다).
       ⚠️ 피팅을 하는 씨앗은 `xss-test` 입니다(subs 에 ft-mend · ft-grip). */
    await p.goto("http://127.0.0.1:" + h.port + "/pro/xss-test",
                 { waitUntil:"domcontentloaded" });
    const proTxt = (await p.textContent("main")) || "";
    /* ⚠️⚠️⚠️ **화면 전체에서 「거래 조건」을 찾으면 안 됩니다** — `/pro`
       의 중개 고지가 「거래 조건과 이행에 관한 책임은 이 업체에
       있습니다」라고 적습니다. 처음에 `main` 전체를 뒤져 **멀쩡한
       화면을 실패로** 잡았습니다(0052 에서 `#pvstadm` 전체를 뒤져
       엉뚱한 칸을 집은 그 자리). 재려는 뜻은 「**업체 정보 표에 그
       줄이 섰는가**」이므로 그 표의 줄머리만 봅니다. */
    const proRows = await p.evaluate(function(){
      return Array.prototype.map.call(
        document.querySelectorAll("main .doc-t th"),
        function(e){ return (e.textContent || "").trim(); });
    });
    ok("⚠️ 잴 것이 0개면 실패입니다 (업체 정보 표를 읽기는 했는가)",
       proRows.length > 0, proRows.length);
    ok("⚠️⚠️ `/pro` 가 안 적으신 거래 조건을 **지어 적지 않는다**",
       proRows.indexOf("거래 조건") < 0 && proTxt.indexOf("부품비") < 0,
       proRows.join(" · "));
    ok("  ⚠️ 그래도 업체 정보 표는 선다 (빈 자리로 두지 않습니다)",
       proTxt.indexOf("하는 일") >= 0 && proTxt.indexOf("영업 지역") >= 0,
       proTxt.replace(/\s+/g, " ").slice(0, 200));
    await p.goto("http://127.0.0.1:" + h.port + "/cat/fitting",
                 { waitUntil:"networkidle" });
    await p.waitForTimeout(200);

    /* 서비스 방식 — ⚠️⚠️ **안 고르신 업체는 빠집니다**(지어내지 않습니다) */
    await p.goto("http://127.0.0.1:" + h.port + "/cat/fitting?w=visit",
                 { waitUntil:"networkidle" });
    await p.waitForTimeout(250);
    ok("서비스 방식 — 방문으로 좁히면 남는다",
       (await p.locator(".fit-c").count()) === 1);
    await p.goto("http://127.0.0.1:" + h.port + "/cat/fitting?w=ship",
                 { waitUntil:"networkidle" });
    await p.waitForTimeout(250);
    ok("  ⚠️⚠️ 택배를 **안 고르신 업체는 빠진다** (모르는 것을 넣지 않습니다)",
       (await p.locator(".fit-c").count()) === 0);

    /* 가격대 — ⚠️⚠️ **값을 안 올리신 업체는 빠집니다**(모르는 것을 아무
       칸에나 넣으면 지어낸 값입니다 · 절대 규칙 1). 화면이 그 사실을
       0건 안내에서 말합니다. */
    await p.goto("http://127.0.0.1:" + h.port + "/cat/fitting?p=f2",
                 { waitUntil:"networkidle" });
    await p.waitForTimeout(250);
    ok("가격대로 좁히면 **값을 안 올린 업체는 빠진다**",
       (await p.locator(".fit-c").count()) === 0);
    ok("  그 사실을 그 자리에서 말한다 (손님이 「없다」로 읽지 않게)",
       ((await p.textContent("#fitlist")) || "").indexOf("공임을 아직 안 올리신") >= 0,
       ((await p.textContent("#fitlist")) || "").replace(/\s+/g, " ").slice(0, 200));
    /* ⚠️⚠️ 경계는 **아래를 열고 위를 닫습니다**(gte · lt) — 둘 다 닫으면
       10,000원이 두 칸에 다 걸립니다. 자료로 재세요(화면에는 그 업체가
       없어서 못 잽니다 · 다른 자물쇠입니다). */
    const band = await p.evaluate(function(){
      var L = (window.AM_FIT_PRICE || []).map(function(x){
        return { k:x.key, gte:x.gte, lt:x.lt }; });
      return L;
    });
    ok("⚠️⚠️ 가격대가 **겹치지도 비지도 않는다** (아래를 열고 위를 닫습니다)",
       band.length >= 2 && band.every(function(x, i){
         return i === 0 ? x.gte === null : x.gte === band[i - 1].lt;
       }) && band[band.length - 1].lt === null,
       JSON.stringify(band));
    /* 찾는 말 — ⚠️ 키가 아니라 **사람이 읽는 이름**으로 찾습니다 */
    await p.goto("http://127.0.0.1:" + h.port + "/cat/fitting?q=" +
                 encodeURIComponent("그립 교체"), { waitUntil:"networkidle" });
    await p.waitForTimeout(250);
    ok("찾는 말 — 하는 일 이름으로 찾힌다 (ft-grip 이 아니라 「그립 교체」)",
       (await p.locator(".fit-c").count()) === 1);

    /* 뒤로 가기 — ⚠️ pushState 로 주소를 바꾸므로 받는 줄이 없으면
       주소만 바뀌고 목록이 그대로 있습니다 */
    await p.goto("http://127.0.0.1:" + h.port + "/cat/fitting", { waitUntil:"networkidle" });
    await p.waitForTimeout(200);
    await p.click('.fit-tab-a[data-sub="ft-driver"]');
    await p.waitForTimeout(250);
    await p.goBack();
    await p.waitForTimeout(300);
    ok("⚠️⚠️ 뒤로 가기를 받는다 (주소만 바뀌고 목록이 그대로 있지 않다)",
       (await p.locator(".fit-c").count()) === 1,
       await p.locator(".fit-c").count());

    /* ⚠️⚠️⚠️ 머리의 단추 — `INTAKE_BUCKET` 이 꺼져 있으면 `/match` 에
       사진 칸이 **아예 안 그려지므로**(js/photo.js) 「클럽 사진으로」
       라고 적으면 없는 것을 있다고 말하는 꼴입니다(절대 규칙 5). */
    const fitCta = (await p.textContent("#fit-cta")) || "";
    ok("⚠️⚠️ 버킷이 꺼져 있으면 단추가 「사진」을 약속하지 않는다",
       fitCta.indexOf("사진") < 0, fitCta.replace(/\s+/g, " ").trim());
    ok("  그래도 상담 요청으로 가는 길은 있다 (막다른 길이 아닙니다)",
       ((await p.getAttribute("#fit-cta", "href")) || "").indexOf("/match?cat=fitting") === 0,
       await p.getAttribute("#fit-cta", "href"));

    console.log("\n── 하위 칩 — 갈 자리가 있는 것만 링크인가");
    async function subChips(route){
      await p.goto("http://127.0.0.1:" + h.port + route, { waitUntil:"networkidle" });
      await p.waitForTimeout(200);
      return await p.evaluate(function(){
        var out = { link:[], text:[] };
        Array.prototype.forEach.call(document.querySelectorAll(".chips-sub li"), function(li){
          var a = li.querySelector("a");
          if(a) out.link.push(a.getAttribute("href"));
          else out.text.push((li.textContent || "").trim());
        });
        return out;
      });
    }

    const usedSub = await subChips("/cat/used");
    ok("⚠️ 잴 것이 0개면 실패입니다 (/cat/used 의 하위 칩을 찾기는 했는가)",
       usedSub.link.length + usedSub.text.length > 0, JSON.stringify(usedSub));
    ok("⚠️⚠️ 중고 — 물건 종류는 **매물 목록 거르개**로 간다 (0068 의 ?s=)",
       usedSub.link.filter(function(u){
         return u.indexOf("/cat/used?s=us-") === 0; }).length > 0,
       usedSub.link.join(" "));
    ok("⚠️⚠️ 중고 — 업체가 하는 둘(매입 견적 · 위탁판매)은 **업체찾기**로 간다",
       usedSub.link.filter(function(u){
         return u.indexOf("/search?cat=used&sub=") === 0; }).length > 0,
       usedSub.link.join(" "));
    ok("  중고는 갈 자리 없는 칩이 **하나도 없다** (아홉 다 눌립니다)",
       usedSub.text.length === 0, JSON.stringify(usedSub.text));

    const cqSub = await subChips("/cat/community");
    ok("⚠️⚠️ 게시판 — 하위가 **그 게시판 글만** 모아 보여 주는 주소로 간다 (0059 의 ?s=)",
       cqSub.link.length > 0 && cqSub.link.every(function(u){
         return u.indexOf("/cat/community?s=cm-") === 0; }),
       cqSub.link.join(" "));
    ok("  게시판도 갈 자리 없는 칩이 **하나도 없다**",
       cqSub.text.length === 0, JSON.stringify(cqSub.text));

    /* ⚠️⚠️ 반대쪽도 같이 봅니다 — **좁힐 자료가 없는** 하위는 글로 둡니다.
       조인(`joinroom`)에는 하위 칸이 아예 없어서 거를 수가 없습니다.
       링크로 내면 영원히 0건인 자리로 보내는 것이고, 그건 눌러도 아무
       일이 안 나는 칸과 같습니다 (절대 규칙 5). */
    const mtSub = await subChips("/cat/matchup");
    ok("⚠️⚠️⚠️ 조인 — 좁힐 자료가 없는 하위는 **글로** 둔다 (0건 자리로 안 보냅니다)",
       mtSub.text.length > 0 && mtSub.link.length === 0, JSON.stringify(mtSub));

    const rgSub = await subChips("/cat/range");
    ok("연습장 — 하위가 **그 거르개 주소**를 가리킨다 (amSubUrl 한 함수)",
       rgSub.link.length > 0 && rgSub.link.every(function(u){
         return /^\/search\?cat=range&sub=rg-/.test(u); }),
       rgSub.link.join(" "));
    /* 실제로 눌러 봅니다 — 주소만 맞고 안 걸리면 아무 뜻이 없습니다 */
    await p.click('.chips-sub a[href="/search?cat=range&sub=rg-sim"]');
    await p.waitForTimeout(400);
    ok("⚠️⚠️⚠️ 눌러 보니 **실제로 좁혀진다** (주소만 맞는 것이 아닙니다)",
       (await p.locator("#sres .pv").count()) === 1 &&
       (await p.evaluate(function(){ return location.search; }))
         .indexOf("sub=rg-sim") >= 0,
       await p.evaluate(function(){ return location.search; }));

    /* ⚠️⚠️⚠️ **하위가 한 개도 안 빠졌는가 — 열 장 전부** ════════════
       2026-11-08 부터 칩을 **둘로 가릅니다**(업체찾기로 가는 것은 업체
       구간 안에, 제 목록을 좁히는 것은 그 목록 위에). 그런데 제 목록
       구간은 **네 분류에만** 있습니다(중고 · 조인 · 게시판 · 인력) —
       업체만 받는 분류에 `pv` 가 아닌 하위가 하나 생기는 날 그 칩은
       **놓을 자리가 없어 조용히 사라집니다**(에러 0줄 · 가로로 밀리지도
       않고 글자가 작지도 않아 어떤 검사도 안 잡습니다).
       ⚠️ 그래서 화면에서 **세어** 봅니다 — `amCatItems()` 가 내놓는 수와
       그 화면의 칩 수가 같아야 합니다. **갯수를 박지 않습니다.** */
    console.log("\n── 하위 칩이 열 장에서 한 개도 안 빠지나");
    const catList = await p.evaluate(function(){
      return (window.AM_CATS || []).map(function(c){
        return { key: c.key, url: window.amCatUrl(c),
                 n: (window.amCatItems(c) || []).length };
      });
    });
    ok("⚠️ 잴 것이 0개면 실패입니다 (분류 목록을 읽기는 했는가)",
       catList.length > 0, catList.length);
    for(const c of catList){
      await p.goto("http://127.0.0.1:" + h.port + c.url, { waitUntil:"networkidle" });
      await p.waitForTimeout(120);
      const got = await p.locator(".chips-sub li").count();
      ok("  " + c.key + " — 하위 " + c.n + "개가 화면에 다 있다", got === c.n,
         "화면 " + got + "개 · 자료 " + c.n + "개");
    }

    console.log("\n── /search 검색어 (머리말 검색창)");
    await p.goto("http://127.0.0.1:" + h.port + "/search?q=" + encodeURIComponent("연습장"),
                 { waitUntil:"networkidle" });
    await p.waitForTimeout(250);
    ok("검색어로 좁혀진다", (await p.locator("#sres .pv").count()) === 1,
       await p.locator("#sres .pv").count());
    ok("  맞는 업체가 남는다",
       (await p.locator("#sres .pv").first().getAttribute("data-pv")) === "green-pt");
    ok("  검색창에 친 글이 **남아 있다** (다시 치게 하지 않습니다)",
       (await p.inputValue("#q")) === "연습장");
    await p.goto("http://127.0.0.1:" + h.port + "/search?q=" + encodeURIComponent("경기"),
                 { waitUntil:"networkidle" });
    await p.waitForTimeout(250);
    ok("지역 이름으로도 찾아진다", (await p.locator("#sres .pv").count()) === 1);
    /* ⚠️ 검색창에서 보낼 때도 새로고침하지 않습니다 */
    await p.evaluate(function(){ window.__kept2 = "있습니다"; });
    await p.fill("#q", "피팅");
    await p.press("#q", "Enter");
    await p.waitForTimeout(300);
    ok("⚠️ 검색창에서 보내도 **새로고침되지 않는다**",
       (await p.evaluate(function(){ return window.__kept2; })) === "있습니다");
    ok("  주소에 검색어가 담긴다",
       (await p.evaluate(function(){ return location.search; })).indexOf("q=") >= 0,
       await p.evaluate(function(){ return location.search; }));

    console.log("\n── /search 업체 비교 (지시서 9번)");
    await p.goto("http://127.0.0.1:" + h.port + "/search", { waitUntil:"networkidle" });
    await p.waitForTimeout(250);
    /* ⚠️⚠️ **고르기 전에는 비교표가 없습니다** — 빈 표를 미리 그려 두면
       가짜 비교 자료가 들어오는 문이 됩니다 (절대 규칙 1). */
    ok("⚠️ 고르기 전에는 비교표가 **안 보인다**",
       (await p.locator("#scmp .cmp-t").count()) === 0);
    await p.locator("#sres .cmp-x").nth(0).check();
    await p.waitForTimeout(150);
    ok("하나만 고르면 아직 비교가 아니다 (표를 안 그린다)",
       (await p.locator("#scmp .cmp-t").count()) === 0);
    await p.locator("#sres .cmp-x").nth(1).check();
    await p.waitForTimeout(200);
    ok("둘을 고르면 비교표가 나온다", (await p.locator("#scmp .cmp-t").count()) === 1);
    t = (await p.textContent("#scmp")) || "";
    ok("  고른 업체가 둘 다 들어간다",
       t.indexOf("성남 그린골프연습장") >= 0 &&
       (await p.locator("#scmp thead th").count()) === 3, t.slice(0, 120));
    ok("  견주는 줄이 있다 (지역 · 하는 일 · 가격 · 후기 …)",
       (await p.locator("#scmp tbody tr").count()) >= 5,
       await p.locator("#scmp tbody tr").count());
    ok("  등록된 가격이 비교표에 들어간다", t.indexOf("12,000원") >= 0, t.slice(0, 400));
    ok("  ⚠️ 가격을 안 올린 업체의 칸은 **지어내지 않는다**",
       t.indexOf("상담 후") < 0 && t.indexOf("문의") < 0, t.slice(0, 300));
    ok("  비교표에서도 상담 요청을 할 수 있다",
       (await p.locator('#scmp a[href^="/match?pv="]').count()) === 2);
    /* ⚠️ 업체가 적은 글이 비교표 머리에도 들어갑니다 — esc() 를 지나야 합니다 */
    ok("  ⚠️ 업체가 쓴 글이 날것으로 안 나간다",
       (await p.locator("#scmp img").count()) === 0 &&
       (await p.locator("#scmp script").count()) === 0);
    await p.click('#scmp button[data-cmp="off"]');
    await p.waitForTimeout(200);
    ok("비교를 지우면 표가 사라진다", (await p.locator("#scmp .cmp-t").count()) === 0);
    ok("  체크도 같이 풀린다",
       (await p.locator("#sres .cmp-x:checked").count()) === 0);

    /* ⚠️⚠️ **세 폭에서 잽니다** (4차 지시서 §7) — 360 · 390 · 430.
       한 폭만 재면 그 사이에서 깨지는 것을 못 봅니다. */
    for(const W of [360, 390, 430]){
      console.log("\n── ⚠️ /search 폰 폭 " + W + "px (전수 점검이 못 보는 자리)");
      const ph = await b.newPage({ viewport:{ width:W, height:900 } });
      await ph.goto("http://127.0.0.1:" + h.port + "/search", { waitUntil:"networkidle" });
      await ph.waitForTimeout(300);
      /* ⚠️⚠️ **미끄러지는 상자가 화면을 밀지 않는지** — 격자 칸의 기본
         min-width:auto 때문에 폰에서 390px 이 688px 이 된 적이 있습니다. */
      let m = await ph.evaluate(function(){
        return { doc: document.documentElement.scrollWidth, win: window.innerWidth };
      });
      ok("거르개가 있어도 화면이 **가로로 안 밀린다**", m.doc <= m.win + 1,
         "문서 " + m.doc + "px · 화면 " + m.win + "px");
      /* ⚠️⚠️⚠️ 2026-11-11 — 이 줄은 **뒤집었습니다.** 전에는
         「거르개는 제 상자 안에서 가로로 미끄러진다」를 요구했는데,
         그건 **그날 고른 방법**이지 재려는 뜻이 아닙니다. 뜻은 바로
         위 줄("화면이 가로로 안 밀린다")과 **칩이 전부 손에 닿는가**
         둘입니다.
         재 보니 390px 에서 분류 줄이 1,506px · 지역 줄이 1,234px 인데
         보이는 폭이 310px 라, 분류 열하나 중 둘 · 지역 열여덟 중 셋만
         보이고 **스물넷이 밀어야** 나왔습니다. 머리말 메뉴가 폰에서
         넷째 칸을 숨기던 그 자리입니다 — **밀면 보이는 것은 보이는
         것이 아닙니다.** 지금은 폰에서 접습니다.
         ⚠️ 그대로 뒀으면 이 검사가 **고장을 지키고** 있었을 것입니다
         (같은 날 아침 #lsbox 에서 `boxHtml === ""` 를 요구하던 그 자리). */
      const sfc = await ph.evaluate(function(){
        return [].slice.call(document.querySelectorAll(".sf-c")).map(function(c){
          /* 상자 밖으로 밀려난 칩을 셉니다 — 그려진 것만 봅니다
             (안 그려진 칸은 사각형이 전부 0 이라 늘 밖으로 읽힙니다). */
          const box = c.getBoundingClientRect();
          let out = 0, n = 0;
          [].slice.call(c.children).forEach(function(e){
            if(!e.getClientRects().length) return;
            n++;
            const r = e.getBoundingClientRect();
            if(r.right > box.right + 1 || r.left < box.left - 1) out++;
          });
          return { n: n, out: out, hid: c.scrollWidth - c.clientWidth };
        });
      });
      ok("  거르개 칸이 **하나도 상자 밖에 숨지 않는다**",
         sfc.length > 0 && sfc.every(function(x){ return x.out === 0 && x.hid <= 1; }),
         JSON.stringify(sfc));
      ok("  잴 거르개 줄을 찾기는 했다 (0줄이면 이 검사가 고장입니다)",
         sfc.length > 0 && sfc.every(function(x){ return x.n > 1; }),
         JSON.stringify(sfc));
      /* 폰에서도 거르개가 돌아야 합니다 */
      await ph.click('a[data-sf="cat"][data-v="fitting"]');
      await ph.waitForTimeout(250);
      ok("  폰에서도 거르개가 돈다", (await ph.locator("#sres .pv").count()) === 1);
      await ph.goto("http://127.0.0.1:" + h.port + "/search", { waitUntil:"networkidle" });
      await ph.locator("#sres .cmp-x").nth(0).check();
      await ph.locator("#sres .cmp-x").nth(1).check();
      await ph.waitForTimeout(250);
      m = await ph.evaluate(function(){
        return { doc: document.documentElement.scrollWidth, win: window.innerWidth };
      });
      ok("비교표를 펴도 화면이 **가로로 안 밀린다**", m.doc <= m.win + 1,
         "문서 " + m.doc + "px · 화면 " + m.win + "px");
      const small = await ph.evaluate(function(){
        const out = [];
        Array.prototype.forEach.call(document.querySelectorAll("main *"), function(e){
          if(!e.firstChild || e.firstChild.nodeType !== 3) return;
          if(!(e.textContent || "").trim()) return;
          const fs2 = parseFloat(getComputedStyle(e).fontSize);
          if(fs2 < 12) out.push(e.className + " " + fs2 + "px");
        });
        return out.slice(0, 5);
      });
      ok("12px 미만 글자가 없다", small.length === 0, small.join(" · "));
      const tap = await ph.evaluate(function(){
        return Array.prototype.filter.call(
          document.querySelectorAll("main a, main button, main label"),
          function(e){
            /* ⚠️⚠️⚠️ **화면 읽는 기계용 글(`.sr`)은 누르는 것이 아닙니다**
               (2026-11-08). 그것은 1px 상자라 늘 40px 미만이고, 손님에게는
               보이지도 않습니다. `/search` 안으로 검색 칸이 들어오면서 그
               `<label class="sr">` 이 `main` 안에 처음 들어왔고, 멀쩡한
               화면이 세 폭에서 떨어졌습니다 — 전에는 그 이름표가 머리말에
               있어 `main` 밖이었습니다.
               ⚠️ 또 밟은 "검사가 멀쩡한 것을 고장이라고 한 자리" 입니다. */
            if(e.classList.contains("sr") || e.closest(".sr")) return false;
            return e.getBoundingClientRect().height < 39.5;
          }).length;
      });
      ok("누르는 것이 40px 이상이다", tap === 0, tap + "개");
      await ph.close();
    }

    ok("화면 에러 · CSP 거절이 0건이다", hits.length === 0, hits.join(" | "));

    /* 사람이 볼 그림 — 도구가 "보기 흉한가" 는 영원히 못 잽니다 */
    if(process.argv.indexOf("--shot") >= 0){
      const dir = process.argv[process.argv.indexOf("--shot") + 1] || ".";
      /* ⚠️⚠️ **"보기 흉한가" 는 도구가 영원히 못 잽니다** — 디자인을
         바꿨으면 찍어 보세요. 업체찾기는 **폰도** 찍습니다 (거르개가
         가로로 미끄러지는 자리라 눈으로 봐야 압니다). */
      for(const [u, f, w] of [["/cat/range", "pv-cat", 1280],
                              ["/pro/green-pt", "pv-one", 1280],
                              ["/search", "pv-search", 1280],
                              ["/search", "pv-search-phone", 390]]){
        const sp = await b.newPage({ viewport:{ width:w, height:900 }, deviceScaleFactor:2 });
        await sp.goto("http://127.0.0.1:" + h.port + u, { waitUntil:"networkidle" });
        await sp.waitForTimeout(400);
        /* 비교표도 펴서 찍습니다 — 안 펴면 그 자리는 아무도 안 봅니다 */
        if(f.indexOf("pv-search") === 0){
          await sp.locator("#sres .cmp-x").nth(0).check().catch(function(){});
          await sp.locator("#sres .cmp-x").nth(1).check().catch(function(){});
          await sp.waitForTimeout(300);
        }
        await sp.screenshot({ path: path.join(dir, f + ".png"), fullPage:true });
        await sp.close();
      }
      console.log("   그림을 " + dir + " 에 찍었습니다");
    }
    await p.close();

    /* 사이트맵 · 링크 */
    const sm = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
    ok("사이트맵에 업체 화면이 들어간다", sm.indexOf("/pro/green-pt") >= 0);
    const lk = spawnSync(process.execPath, ["tools/check-links.js"],
      { cwd: ROOT, stdio:["ignore","pipe","pipe"] });
    ok("끊긴 링크 · 410 으로 가는 링크가 0건이다", lk.status === 0,
       (lk.stdout || "").toString().trim().split("\n").slice(-4).join(" | "));

    console.log("\n── ②-b 후기가 **있을 때** (0037)");
    /* ⚠️⚠️ 후기 자리도 지금까지 **아무도 본 적이 없습니다** — 0건이라
       그리는 쪽만 돌았습니다. 씨앗을 넣고 실제로 찍어 봅니다. */
    rseed(RSEED);
    const r4 = build();
    ok("후기를 넣어도 빌드가 돈다", r4.status === 0,
       (r4.stderr || "").toString().trim().split("\n").slice(-3).join(" | "));

    const p2 = await b.newPage({ viewport:{ width:1280, height:900 } });
    const hits2 = watch(p2);
    await p2.goto("http://127.0.0.1:" + h.port + "/pro/green-pt", { waitUntil:"networkidle" });
    let t2 = (await p2.textContent("main")) || "";
    ok("후기 건수가 나온다 (3건)", /후기 3건/.test(t2), t2.slice(0, 300));
    /* ⚠️⚠️ **손으로 센 값**입니다 — 5 · 4 · 4 → 13/3 = 4.3 */
    ok("⚠️ 평균이 **센 값**으로 나온다 (5·4·4 → 4.3)",
       t2.indexOf("4.3") >= 0, (t2.match(/[0-9]\.[0-9]/g) || []).join(" "));
    ok("⚠️ 다른 업체의 1점이 **안 섞인다** (섞이면 3.5 입니다)",
       t2.indexOf("3.5") < 0);
    ok("별 글자가 그려진다", (await p2.locator("main .stars").count()) >= 4,
       await p2.locator("main .stars").count());
    /* ⚠️ 별 글자는 소리로 읽을 것이 없습니다 — 같은 뜻을 글로 한 번 */
    ok("⚠️ 소리로 듣는 분께 점수를 **글로** 적는다",
       /5점 만점에 4점/.test(t2), t2.slice(0, 300));
    ok("작성자가 마스킹된 채로 나온다", /김\*\*/.test(t2));
    ok("⚠️ 본이름이 나올 자리가 없다 (성함 칸을 안 받습니다)",
       t2.indexOf("김후기") < 0 && t2.indexOf("by_user") < 0);
    ok("고친 후기에 **고쳤다고** 적는다", /고침/.test(t2));
    ok("업체 답변이 나온다", /또 오세요/.test(t2));
    ok("  답변이 누구 말인지 적는다", /성남 그린골프연습장 답변/.test(t2));
    /* ⚠️⚠️ 손님 · 업체가 적은 글은 전부 esc() 입니다 (절대 규칙 4) */
    const rh = await p2.innerHTML("main");
    ok("⚠️ 후기에 넣은 태그가 날것으로 안 들어간다",
       rh.indexOf("<script>alert(3)") < 0 && rh.indexOf("&lt;script") >= 0);
    ok("⚠️ 업체 답변에 넣은 태그도 날것으로 안 들어간다",
       rh.indexOf("<b>고맙습니다</b>") < 0 && rh.indexOf("&lt;b&gt;") >= 0);
    ok("⚠️ 그 글 때문에 그림 · 스크립트가 생기지 않는다",
       (await strayImg(p2)) === 0, await strayImg(p2));
    /* ⚠️⚠️⚠️ **후기가 생겨도 aggregateRating 을 안 넣습니다** — 우리가
       별점을 검증할 길이 없고, 적발되면 리치 결과가 통째로 막힙니다. */
    ok("⚠️⚠️ 후기가 생겨도 구조화 데이터에 aggregateRating 이 **없다**",
       (await p2.content()).indexOf("aggregateRating") < 0);
    ok("0건 안내가 사라진다", t2.indexOf("아직 후기가 없습니다") < 0);

    /* ⚠️⚠️ **크롤러가 보는 것과 같은가.** 자바스크립트 전의 HTML 에
       후기가 들어 있어야 네이버 · 빙 · LLM 봇이 봅니다 (그려진 화면만
       보는 검사는 영원히 통과합니다). */
    const raw = fs.readFileSync(path.join(ROOT, "pro", "green-pt", "index.html"), "utf8");
    ok("⚠️⚠️ 자바스크립트 전의 HTML 에 후기가 **이미** 들어 있다",
       raw.indexOf("후기 3건") >= 0 && raw.indexOf("4.3") >= 0);
    ok("  거기에도 본이름이 없다", raw.indexOf("김후기") < 0);

    /* 카드 — 분류 화면에서도 센 값이 나오는가 */
    await p2.goto("http://127.0.0.1:" + h.port + "/cat/range", { waitUntil:"networkidle" });
    const ct = (await p2.textContent("main")) || "";
    ok("분류 카드에도 평균 · 건수가 나온다",
       /후기 3건/.test(ct) && ct.indexOf("4.3") >= 0, ct.slice(0, 300));
    /* ⚠️⚠️ 후기 0건인 업체 카드에 "후기 0건" 을 찍으면 새로 입점한
       업체가 전부 나쁜 업체로 보입니다 — 우리가 만든 평가입니다. */
    /* ⚠️ 레슨 카드는 `.lsn-c` 이고 평점 줄은 `.lsn-r` 입니다 — 모양만
       다르고 **규칙은 같습니다**(0건이면 줄째 없음). 잴 것이 0개면
       실패로 두어 "카드를 못 찾고 통과" 하지 않게 합니다. */
    await p2.goto("http://127.0.0.1:" + h.port + "/cat/lesson", { waitUntil:"networkidle" });
    const lsnN = await p2.locator(".pv, .lsn-c").count();
    const lsnR = await p2.locator(".pv .pv-r, .lsn-c .lsn-r").count();
    ok("⚠️ 잴 것이 0개면 실패입니다 (레슨 카드를 찾기는 했는가)",
       lsnN > 0, "카드 " + lsnN + "장");
    /* ⚠️ 이 씨앗에서 레슨 화면에 서는 카드는 **한 장**이고 그분께는
       후기가 3건 있습니다 — 그래서 평점 줄이 딱 하나입니다. 0건인
       카드가 그 줄을 안 내는지는 위 `/cat/range` 에서 같이 재집니다. */
    ok("⚠️ 후기가 0건인 카드에는 그 줄이 **아예 없다**",
       lsnR === 1, "카드 " + lsnN + "장 · 평점 줄 " + lsnR + "개");
    ok("후기 화면에서도 에러 · CSP 거절이 0건이다", hits2.length === 0, hits2.join(" | "));
    await p2.close();

    console.log("\n── ②-c 되돌려 보기: 어긋난 후기를 넣으면 빌드가 멈추는가");
    /* ⚠️⚠️ 두 자료 파일은 DB 에서 **따로** 나옵니다 — 한쪽만 다시
       가져오면 그 후기는 아무 화면에도 안 뜨면서 아무 에러도 안 납니다. */
    rseed([{ id:"rv-x", provider_id:"이런업체는없습니다", rating:5,
             who:"김**", body:"없는 업체에 붙은 후기입니다.",
             created_at:"2026-10-30T01:00:00Z" }]);
    const r5 = build();
    ok("없는 업체를 가리키는 후기를 넣으면 **빌드가 멈춘다**", r5.status !== 0,
       "exit=" + r5.status);
    ok("  무엇을 돌려야 하는지 말해 준다",
       /pull-reviews/.test((r5.stderr || "").toString() + (r5.stdout || "").toString()));
    rseed([{ id:"rv-y", provider_id:"green-pt", rating:9, who:"김**",
             body:"별점이 범위를 벗어난 후기입니다.",
             created_at:"2026-10-30T01:00:00Z" }]);
    const r6 = build();
    ok("별점이 1~5 밖이면 **빌드가 멈춘다**", r6.status !== 0, "exit=" + r6.status);
    rseed([]);

    console.log("\n── ③ 되돌려 보기: 가짜 하위 키를 넣으면 빌드가 멈추는가");
    seed([{ id:"bad-one", name:"가짜", subs:["이런하위는없습니다"] }]);
    const r2 = build();
    ok("없는 하위 키를 넣으면 **빌드가 멈춘다**", r2.status !== 0, "exit=" + r2.status);
    ok("무엇이 틀렸는지 말해 준다",
       /그런 하위가 없습니다/.test((r2.stderr || "").toString() + (r2.stdout || "").toString()));
    seed([{ id:"empty-subs", name:"하는 일 없음", subs:[] }]);
    const r3 = build();
    ok("subs 가 비면 **빌드가 멈춘다** (아무 분류에도 안 뜹니다)", r3.status !== 0,
       "exit=" + r3.status);

  }catch(e){
    bad++; ran++;
    console.log("\n❌ 검사가 터졌습니다: " + String(e && e.message || e).slice(0, 300));
  }finally{
    if(b) await b.close();
    if(h) h.srv.close();
    /* ⚠️⚠️ **사본으로 되돌립니다.** 여기를 빠뜨리면 검사용 씨앗이
       저장소에 남아 **없는 업체를 광고하게** 됩니다 (절대 규칙 1). */
    fs.copyFileSync(BAK, GEN);
    fs.copyFileSync(RBAK, RGEN);
    const r = build();
    const back = routes().filter(x => x.indexOf("/pro/") === 0).length;
    ran++;
    /* ⚠️ 후기 씨앗도 같이 되돌렸는지 봅니다 — 남으면 **없는 사람의
       후기**가 저장소에 남고, 그건 지어낸 신뢰입니다 (절대 규칙 1). */
    const rleft = fs.readFileSync(RGEN, "utf8").indexOf("검사용 씨앗") >= 0;
    if(r.status === 0 && back === startedWith && !rleft)
      console.log("  ✅ 씨앗을 되돌렸습니다 (업체 화면 " + back + "장 · 후기 파일도 " +
                  "돌리기 전과 같습니다)");
    else { bad++; console.log("  ❌ 되돌리지 못했습니다 — " +
      "js/data/providers.generated.js · js/data/reviews.generated.js 를 보세요"); }

    /* ⚠️⚠️⚠️ **routes.json 만 보면 안 됩니다.** 2026-11-03 에 여기까지는
       초록이었는데 **찍힌 HTML 두 장이 저장소에 그대로 남아** 커밋까지
       들어갔습니다 (`/pro/green-pt` · `/pro/xss-test`). 사이트맵에도
       routes.json 에도 없어서 링크 검사 · 주소 검사가 전부 지나갔지만,
       Vercel 은 **저장소의 파일을 그대로 섬깁니다** — 올렸으면 없는
       회사를 광고하고 있었을 것입니다. **파일이 실제로 없는지** 봅니다. */
    ran++;
    const left = fs.existsSync(path.join(ROOT, "pro"))
      ? fs.readdirSync(path.join(ROOT, "pro")) : [];
    if(!left.length)
      console.log("  ✅ 찍힌 업체 화면이 저장소에 **한 장도 안 남았습니다**");
    else {
      bad++;
      console.log("  ❌ 검사용 업체 화면이 남았습니다 — pro/" + left.join(" · ") +
                  "  (지우고 다시 빌드하세요. 그대로 올리면 없는 회사를 광고합니다.)");
    }
  }
  console.log("\n" + ran + "건 중 " + (ran - bad) + "건 통과 · " + bad + "건 실패");
  process.exit(bad ? 1 : 0);
})();
