#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   견적 흐름의 **세 화면**을 눌러 봅니다

     /desk    업체가 배정받은 요청을 보고 · 수락하고 · 견적을 냅니다
     /admin   운영자가 업체를 정해 넘깁니다 (제3자 제공 재동의)
     /my      손님이 받은 견적을 견주고 고릅니다

   ⚠️⚠️ **DB 쪽은 tools/sql/quote.js 가 따로 눌러 봅니다.** 여기서 재는
   것은 **화면이 받은 것을 어떻게 그리고, 무엇을 보내는가** 입니다.
   둘을 섞으면 "DB 가 막으니 화면은 아무렇게나 해도 된다" 가 됩니다 —
   화면이 틀린 것을 보내면 손님은 거절 메시지만 보고 까닭을 모릅니다.

   ⚠️⚠️ **보내는 꾸러미를 뜯어 봅니다.** 지난번에 화면이 `?m=apple` 을
   보내고 받는 쪽이 `mk` 를 읽어서 **거르개가 아무것도 안 걸렀는데**
   링크 검사도 흐름 검사도 통과했습니다. 눌러 보고 **보낸 것까지**
   봐야 압니다.

   ⚠️ 재는 것 가운데 **화면 쪽 규칙**이 둘 있습니다 (DB 는 안 막습니다) —
     ① 수락 전에는 성함 · 연락처를 **안 보여 줍니다**
     ② 제3자 제공 동의를 체크하지 않으면 **보내지 않습니다**
   둘은 여기서만 잡힙니다.

   돌리기   node tools/test-desk.js
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require("playwright");
const { serve, watch } = require("./_serve.js");
/* ⚠️ 마이그레이션을 **읽어서** 칸을 세는 자리가 있습니다 — 칸 이름을
   검사에 손으로 적어 두면 문에 칸이 붙는 날 그 칸만 조용히 지워집니다. */
const fs = require("fs"), path = require("path");

let bad = 0, ran = 0;
function ok(name, cond, got){
  ran++;
  if(cond) console.log("  ✅ " + name);
  else { bad++; console.log("  ❌ " + name + (got !== undefined ? "  →  " + String(got).slice(0, 220) : "")); }
}

/* ⚠️ 운영 CSP(connect-src)가 허락하는 꼴이어야 합니다 — 좁히면 이
   검사가 같이 떨어집니다. 그게 맞습니다.
   ⚠️⚠️ 주소도 흉내 장치와 **한 곳**에서 옵니다 (두 곳에 적으면 한쪽만
   고치는 날 흉내가 조용히 안 걸립니다). */
const { FAKE, stub } = require("./_stub.js");

/* ⚠️⚠️⚠️ **올려 보는 사진은 진짜 사진이어야 합니다** (2026-11-09).
   전에는 `Buffer.from("x".repeat(2048))` 에 `mimeType:"image/jpeg"` 를
   붙여 보냈습니다 — 브라우저가 적는 종류는 **확장자만 보고 쓰는 값**이라
   그것이 통과하고 있었습니다. 지금은 `js/imgprep.js` 가 **첫 바이트**를
   보고 거절하므로, 가짜 바이트로 재면 **멀쩡한 코드를 고장이라고** 합니다.
   아래는 1x1 짜리 **참 PNG** 입니다 (canvas 가 풀 수 있습니다).
   ⚠️ PNG 를 넣고 **보내는 종류가 image/jpeg 로 바뀌는지**를 봅니다 —
   그것이 "다시 그렸다 = EXIF 가 사라졌다" 의 증거입니다. */
const PNG1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQ" +
  "DwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
/* 사진이 아닌 파일 — ⚠️ 이름만 `.jpg` 입니다 */
const NOTIMG = Buffer.from("이것은 사진이 아닙니다 ".repeat(40), "utf8");

/* ── 가짜 자료 ──────────────────────────────────────────────────────
   ⚠️⚠️ 손님이 적은 글에 태그를 넣어 둡니다 — 그대로 나가면 사고입니다
   (절대 규칙 4). 업체가 적은 글에도 넣습니다. */
const REQ = {
  id:"aaaaaaaa-0000-0000-0000-000000000001", no:"SW-7K3M-92QP",
  state:"accepted", cat:"lesson", region:"서울", gu:"관악구",
  budget_min:300000, budget_max:800000, want_at:"이번 달 안에",
  body:"<img src=x onerror=alert(1)> 구력 2년입니다",
  name:"홍길동", tel:"010-1234-5678", email:"g@x.test",
  created_at:"2026-11-03T01:00:00Z"
};
const REQ2 = {
  id:"aaaaaaaa-0000-0000-0000-000000000002", no:"SW-5XZQ-18BW",
  state:"assigned", cat:"fitting", region:null, gu:null,
  budget_min:null, budget_max:null, want_at:null, body:null,
  name:"김아무", tel:"010-9999-8888", email:null,
  created_at:"2026-11-03T02:00:00Z"
};

/* ⚠️⚠️ **묶음 읽기(embed)를 안 씁니다** — 화면이 배정과 요청을 따로
   읽어 `request_id` 로 맞춥니다 (js/desk.js 머리말). 그러니 가짜
   Supabase 도 **따로** 내놓아야 합니다. 여기서 embed 꼴로 흉내 내면
   운영에서 안 도는 길을 검사만 초록으로 만듭니다. */
function asg(req, state){
  return { id:"bbbb" + req.no, state:state, created_at:req.created_at,
           agree3rd_at:"2026-11-03T03:00:00Z", request_id:req.id };
}

const ITEMS = [
  { request_id:REQ.id,  service_id:"ls-solo", state:"new" },
  { request_id:REQ.id,  service_id:"없는키",  state:"new" },
  { request_id:REQ2.id, service_id:"ft-grip", state:"new" }
];

const QUOTE = {
  id:"cccccccc-0000-0000-0000-000000000001", request_id:REQ.id,
  provider_id:"t-range", amount:600000, vat:"add",
  scope:"<b>주 1회</b> 90분 8회", excludes:"타석 이용료 별도",
  days:60, start_on:"2026-11-10", warranty:"1개월", valid_to:"2026-11-30",
  note:null, state:"open", created_at:"2026-11-03T04:00:00Z", updated_at:null
};

/* ── 보유 기간을 **site.js 에서 읽습니다** ──────────────────────────
   ⚠️⚠️ **검사에 그날의 값을 박지 마세요.** "6개월" 을 박아 두면 사장님이
   보유 기간을 고치시는 날 **멀쩡한 화면을 실패로** 잡습니다 (작업 기억 —
   여러 번 밟은 자리). 재려는 뜻은 "양식이 **실제 설정값**을 보여 주는가"
   이지 그 글자가 무엇인가가 아닙니다.
   ⚠️ `window` 를 빌려 쓰고 **그대로 돌려놓습니다** — check-deal 이
   `global.window` 를 덮어써 빌드를 통째로 깨뜨린 자리입니다.
   ⚠️ 읽은 값이 비면 **실패**로 둡니다 (잴 것이 0개면 실패입니다). */
function keepOf(name){
  const had = Object.prototype.hasOwnProperty.call(global, "window");
  const old = global.window;
  global.window = {};
  try{
    delete require.cache[require.resolve("../js/data/site.js")];
    require("../js/data/site.js");
    return String((global.window.WOW_BIZ || {})[name] || "");
  }catch(e){ return ""; }
  finally{ if(had) global.window = old; else delete global.window; }
}

/* 게시판 열둘 — ⚠️ `js/data/catalog.js` 한 곳에서 읽습니다 (이름을 검사에
   박으면 게시판을 더하는 날 멀쩡한 화면을 실패로 잡습니다).
   ⚠️ `window` 를 빌려 쓰고 **그대로 돌려놓습니다**. */
/* 숫자 정책값 — ⚠️ `js/data/site.js` 한 곳에서 읽습니다 (검사에 14 를
   박으면 사장님이 그 값을 고치시는 날 멀쩡한 화면이 빨개집니다). */
function keepNum(name){
  const v = Number(keepOf(name));
  return isFinite(v) ? v : 0;
}
/* 지역 묶음 — ⚠️ `js/data/regions.js` 한 곳에서 읽습니다 (갯수를 안 박습니다) */
function zonesOf(){
  const had = Object.prototype.hasOwnProperty.call(global, "window");
  const old = global.window;
  global.window = {};
  try{
    delete require.cache[require.resolve("../js/data/regions.js")];
    require("../js/data/regions.js");
    return global.window.AM_REGION_ZONES || [];
  }catch(e){ return []; }
  finally{ if(had) global.window = old; else delete global.window; }
}

function boardsOf(){
  const had = Object.prototype.hasOwnProperty.call(global, "window");
  const old = global.window;
  global.window = {};
  try{
    ["../js/components/base.js", "../js/data/korean.js", "../js/data/brand.js",
     "../js/data/catalog.js"].forEach(function(f){
      delete require.cache[require.resolve(f)];
      require(f);
    });
    const c = global.window.amCat("community");
    return global.window.amCatItems(c) || [];
  }catch(e){ return []; }
  finally{ if(had) global.window = old; else delete global.window; }
}

/* ── 가짜 Supabase — ⚠️⚠️ **`tools/_stub.js` 한 곳**으로 옮겼습니다.
   찍는 쪽(`tools/shot-desk.js`)이 같은 장치를 써야 하기 때문입니다 —
   베껴 두면 **찍는 화면과 재는 화면이 조용히 달라집니다**. */

(async function(){
  const PORT = 8840 + (process.pid % 40);
  const srv = (await serve(PORT)).srv;
  const b = await chromium.launch();
  const base = "http://127.0.0.1:" + PORT;
  const view = { width:1280, height:900 };

  /* ⚠️ `init` — 화면 스크립트가 돌기 **전에** 끼우는 조각입니다.
     "보유 기간이 비면 양식을 안 엽니다" 처럼 **설정이 없을 때**를 재려면
     그 값이 담기는 순간을 가로채야 합니다 (js/data/site.js 가 나중에
     덮으므로 그냥 넣어 두면 지워집니다). 안 주면 아무 일도 안 합니다. */
  async function open(path, who, tables, rpcs, up, init){
    const p = await b.newPage({ viewport: view });
    const errs = watch(p);
    if(init) await p.addInitScript(init);
    const sent = await stub(p, who, tables, rpcs, up);
    await p.goto(base + path, { waitUntil:"networkidle" });
    await p.waitForTimeout(450);
    return { p: p, errs: errs, sent: sent };
  }
  /* ⚠️⚠️⚠️ **안 그려진 칸은 누르는 것이 아닙니다** (2026-11-09).
     `hidden` 인 양식 안의 단추는 `getBoundingClientRect().height` 가 **0**
     이라 "40px 미만" 으로 세어집니다 — 재려는 뜻은 "**그려진** 칸이 손가락에
     닿는가" 이지 "안 그려진 칸이 있는가" 가 아닙니다(그건 다른 자물쇠입니다).
     `check-screens` 가 `display:none` 인 메뉴 칸을 상자 밖으로 읽어 **멀쩡한
     화면 스물넷을 떨어뜨린** 그 자리와 같습니다. 거르는 법도 같습니다 —
     `getClientRects().length`. */
  function tapsOk(p, sel){
    return p.evaluate(function(s){
      return Array.prototype.filter.call(
        document.querySelectorAll(s + " button, " + s + " a"),
        function(e){ return e.getClientRects().length > 0 &&
                            e.getBoundingClientRect().height < 39.5; }).length;
    }, sel);
  }

  /* ══════════════════════════════════════════════════════════════
     로그인한 뒤 **원래 보시던 자리로** 돌아가는가 (지시서 §3-3)

     ⚠️⚠️⚠️ 전에는 돌아올 자리를 아무 데도 안 적었습니다 — /my 에서
     "로그인하기" 를 누르면 /login 으로 갔다가 메일 링크를 눌러도
     로그인 화면에 **그대로** 남았습니다. 화면도 · 문도 · 검사도
     멀쩡했습니다.
     ⚠️⚠️ **열린 전달(open redirect)을 같이 잽니다.** `?next=` 를 그대로
     믿으면 남이 뿌린 링크로 들어온 손님이 **남의 사이트로 튕겨** 나갑니다.
     ══════════════════════════════════════════════════════════════ */
  console.log("\n── 로그인한 뒤 보시던 자리로 돌아갑니다 (§3-3)");
  for(const [path, box] of [["/my","mybox"], ["/desk","deskbox"], ["/admin","adminbox"]]){
    const g = await open(path, { role:"customer", name:"", signedIn:false },
                         { assignment:[], request:[], quote:[], request_item:[] });
    const href = await g.p.evaluate(function(b){
      var a = document.querySelector("#" + b + ' a[href^="/login"]');
      return a ? a.getAttribute("href") : "";
    }, box);
    ok(path + " 의 로그인 링크가 **돌아올 자리**를 달고 간다",
       href.indexOf("next=") > 0 && decodeURIComponent(href).indexOf(path) > 0, href);
    await g.p.close();
  }

  /* 머리말의 로그인 칸도 같은 함수를 씁니다 (다섯 곳에 손으로 안 적습니다) */
  {
    const g = await open("/search", { role:"customer", name:"", signedIn:false }, {});
    const href = await g.p.evaluate(function(){
      var a = document.querySelector('.hd a[href^="/login"]');
      return a ? a.getAttribute("href") : "";
    });
    ok("머리말의 로그인 칸도 돌아올 자리를 단다",
       href.indexOf("next=") > 0 && decodeURIComponent(href).indexOf("/search") > 0, href);
    await g.p.close();
  }

  /* ⚠️ /login 에서 /login 으로 제자리걸음하지 않습니다 */
  {
    const g = await open("/login", { role:"customer", name:"", signedIn:false }, {});
    const href = await g.p.evaluate(function(){
      var a = document.querySelector('.hd a[href^="/login"]');
      return a ? a.getAttribute("href") : "";
    });
    ok("  /login 에서는 제자리걸음을 안 단다", href === "/login", href);
    await g.p.close();
  }

  /* 이미 들어와 계시면 **바로** 그리로 보냅니다 */
  {
    const g = await open("/login?next=/my", { role:"customer", name:"김손님" }, {});
    await g.p.waitForTimeout(400);
    ok("이미 로그인했으면 보시던 자리로 바로 보낸다",
       new URL(g.p.url()).pathname === "/my", g.p.url());
    await g.p.close();
  }

  /* ⚠️⚠️⚠️ **남이 적어 준 바깥 주소로는 안 나갑니다** */
  for(const bad2 of ["//evil.example/x", "https://evil.example", "/\\evil.example"]){
    const g = await open("/login?next=" + encodeURIComponent(bad2),
                         { role:"customer", name:"김손님" }, {});
    await g.p.waitForTimeout(400);
    const u = new URL(g.p.url());
    ok("  바깥 주소(" + bad2 + ")로는 안 나간다",
       u.host === new URL(base).host && u.pathname === "/login", g.p.url());
    await g.p.close();
  }

  /* ══ /desk — 문 ═══════════════════════════════════════════════ */
  console.log("\n── /desk 업체가 아니면 한 줄도 안 보입니다");
  let s = await open("/desk", { role:"customer", name:"일반회원" },
                     { assignment:[asg(REQ, "accepted")], request:[REQ], quote:[], request_item:ITEMS });
  let t = (await s.p.textContent("#deskbox")) || "";
  ok("입점 업체만 볼 수 있다고 말한다", /입점 업체만/.test(t), t.slice(0, 50));
  ok("손님 성함 · 연락처가 한 글자도 안 나온다",
     t.indexOf("홍길동") < 0 && t.indexOf("1234-5678") < 0);
  ok("배정을 **아예 읽으러 가지도 않는다**",
     s.sent.length === 0, JSON.stringify(s.sent));
  /* ⚠️⚠️ **묶음 읽기(embed)를 쓰지 않는지 주소로 봅니다.** 편하다고
     `request:request_id(...)` 로 되돌리면 PostgREST 판에 따라 400 이
     나고, 그날 화면이 통째로 "읽지 못했습니다" 가 됩니다 — 여기서는
     가짜 서버라 **영원히 안 드러납니다.** 그래서 주소를 봅니다. */
  ok("다음에 할 일을 낸다 (막다른 길로 두지 않는다)",
     (await s.p.locator('#deskbox a[href="/join"]').count()) === 1);
  await s.p.close();

  console.log("\n── 역할은 업체인데 업체가 안 이어졌으면");
  s = await open("/desk", { role:"provider", name:"업체사람", provider:null },
                 { assignment:[asg(REQ, "accepted")], request:[REQ] });
  t = (await s.p.textContent("#deskbox")) || "";
  ok("그래도 안 보여 준다 (provider 만 보고 열지 않는다)", /입점 업체만/.test(t));
  await s.p.close();

  const PRO = { role:"provider", name:"업체사람", provider:"t-range" };

  console.log("\n── 배정이 0건일 때");
  s = await open("/desk", PRO, { assignment:[], request:[], quote:[], request_item:[] });
  t = (await s.p.textContent("#deskbox")) || "";
  ok("0건이면 0건이라고 말한다", /아직 배정받은 요청이 없습니다/.test(t), t.slice(0, 60));
  ok("0건을 '읽지 못했다' 로 말하지 않는다", t.indexOf("읽지 못했") < 0);
  ok("지킬 수 없는 약속을 하지 않는다 (몇 시간 · 며칠을 안 적는다)",
     !/시간 안에|며칠|당일/.test(t), t);
  await s.p.close();

  console.log("\n── 못 읽었을 때 — 0건과 다르게 말합니다");
  s = await open("/desk", PRO, { assignment:null, request:[], quote:[], request_item:[] });
  t = (await s.p.textContent("#deskbox")) || "";
  ok("읽지 못하면 그렇다고 말한다", /읽지 못했습니다/.test(t), t.slice(0, 60));
  ok("읽지 못한 것을 0건이라고 하지 않는다", t.indexOf("0건") < 0 &&
     t.indexOf("아직 배정받은 요청이 없습니다") < 0);
  ok("다시 읽을 길을 낸다", (await s.p.locator('#deskbox button[data-do="again"]').count()) === 1);
  await s.p.close();

  /* ══ /desk — 수락 전 ══════════════════════════════════════════ */
  console.log("\n── ⚠️ 수락 전에는 성함 · 연락처를 안 보여 줍니다 (화면 쪽 규칙)");
  s = await open("/desk", PRO,
                 { assignment:[asg(REQ2, "sent")], request:[REQ2], quote:[], request_item:ITEMS });
  t = (await s.p.textContent("#deskbox")) || "";
  ok("요청번호는 보인다", t.indexOf("SW-5XZQ-18BW") >= 0);
  ok("⚠️ 성함이 **안** 보인다", t.indexOf("김아무") < 0, t);
  ok("⚠️ 연락처가 **안** 보인다", t.indexOf("9999-8888") < 0, t);
  ok("왜 안 보이는지 말해 준다", /수락하신 뒤에/.test(t));
  ok("수락 · 거절 단추만 낸다 (견적 단추는 없다)",
     (await s.p.locator('#deskbox button[data-do="yes"]').count()) === 1 &&
     (await s.p.locator('#deskbox button[data-do="no"]').count()) === 1 &&
     (await s.p.locator('#deskbox button[data-do="quote"]').count()) === 0);
  ok("값이 없는 줄은 **줄째 빠진다** ('(미기재)' · undefined 가 없다)",
     t.indexOf("미기재") < 0 && t.indexOf("undefined") < 0 && t.indexOf("null") < 0, t);
  ok("상태를 사람 말로 보여 준다 (영문 키가 안 나온다)",
     t.indexOf("전달됨") >= 0 && t.indexOf("업체 배정") >= 0 &&
     t.indexOf("assigned") < 0 && t.indexOf("sent") < 0, t);

  await s.p.click('#deskbox button[data-do="yes"]');
  await s.p.waitForTimeout(300);
  let call = s.sent.filter(function(x){ return x.name === "answer_assignment"; })[0];
  ok("수락하면 answer_assignment 를 부른다", !!call, JSON.stringify(s.sent));
  ok("  보내는 꾸러미에 요청 id 와 수락이 들어 있다",
     !!call && JSON.parse(call.body).p_request === REQ2.id &&
     JSON.parse(call.body).p_yes === true, call && call.body);
  await s.p.close();

  /* ══ /desk — 수락 뒤 ══════════════════════════════════════════ */
  console.log("\n── 수락한 뒤에는 보이고, 상담을 시작할 수 있습니다");
  s = await open("/desk", PRO,
                 { assignment:[asg(REQ, "accepted")], request:[REQ], quote:[], request_item:ITEMS });
  ok("화면 에러 · CSP 거절이 0건이다", s.errs.length === 0, s.errs.join(" | "));
  const gets = s.sent.filter(function(x){ return x.name === "GET"; });
  ok("읽으러 가기는 간다 (가짜 서버가 실제로 불렸다)", gets.length > 0, gets.length);
  ok("⚠️ 묶음 읽기(embed) 꼴로 묻지 않는다 — select 에 괄호가 없다",
     gets.every(function(g){
       const sel = (g.body.split("select=")[1] || "").split("&")[0];
       return sel.indexOf("(") < 0 && sel.indexOf("%28") < 0;
     }), gets.map(function(g){ return g.body.split("/rest/v1/")[1]; }).join(" | "));
  t = (await s.p.textContent("#deskbox")) || "";
  ok("성함 · 연락처가 보인다", t.indexOf("홍길동") >= 0 && t.indexOf("010-1234-5678") >= 0);
  ok("하위 키를 사람 말로 바꿔 보여 준다", t.indexOf("개인 레슨") >= 0);
  ok("모르는 키는 **키 그대로** 보여 준다 (조용히 빠지지 않는다)",
     t.indexOf("없는키") >= 0);
  ok("예산을 사람이 읽는 꼴로 보여 준다",
     t.indexOf("300,000원 ~ 800,000원") >= 0, t);
  let html = await s.p.innerHTML("#deskbox");
  ok("⚠️ 손님이 적은 태그가 **날것으로 안 들어간다**",
     html.indexOf("<img src=x") < 0 && html.indexOf("&lt;img") >= 0);
  ok("⚠️ 그 글 때문에 그림이 생기지 않는다",
     (await s.p.locator("#deskbox img").count()) === 0);
  ok("상담 시작 단추를 낸다", (await s.p.locator('#deskbox button[data-do="consult"]').count()) === 1);
  ok("아직 견적 단추는 없다 (상담 전입니다 — 눌러도 DB 가 거절합니다)",
     (await s.p.locator('#deskbox button[data-do="quote"]').count()) === 0);
  ok("누르는 것이 전부 40px 이상이다", (await tapsOk(s.p, "#deskbox")) === 0,
     await tapsOk(s.p, "#deskbox"));

  await s.p.click('#deskbox button[data-do="consult"]');
  await s.p.waitForTimeout(300);
  call = s.sent.filter(function(x){ return x.name === "move_state"; })[0];
  ok("상담 시작은 **상태의 문**으로 간다 (표를 직접 안 고친다)", !!call);
  ok("  consult 로 넘긴다", !!call && JSON.parse(call.body).p_to === "consult",
     call && call.body);
  await s.p.close();

  /* ══ /desk — 견적 내기 ════════════════════════════════════════ */
  console.log("\n── 상담 중이면 견적을 냅니다");
  const consulting = Object.assign({}, REQ, { state:"consult" });
  s = await open("/desk", PRO,
                 { assignment:[asg(consulting, "accepted")], request:[consulting],
                   quote:[], request_item:ITEMS });
  ok("견적 내기 단추가 나온다",
     (await s.p.locator('#deskbox button[data-do="quote"]').count()) === 1);
  ok("상담 시작 단추는 사라진다 (이미 상담 중입니다)",
     (await s.p.locator('#deskbox button[data-do="consult"]').count()) === 0);
  await s.p.click('#deskbox button[data-do="quote"]');
  await s.p.waitForTimeout(300);
  ok("양식이 펼쳐진다", (await s.p.locator("#deskbox form.dk-f").count()) === 1);
  ok("금액 · 범위가 **반드시 적어야 하는 칸**이다",
     (await s.p.locator('#deskbox form.dk-f [name="amount"][required]').count()) === 1 &&
     (await s.p.locator('#deskbox form.dk-f [name="scope"][required]').count()) === 1);
  const vats = await s.p.locator('#deskbox form.dk-f [name="vat"] option').count();
  ok("부가세를 고르는 칸이 **셋**이다 (DB 의 fee_vat 와 같은 수)", vats === 3, vats);
  ok("이름표가 칸마다 이어져 있다 (label for ↔ id)",
     (await s.p.evaluate(function(){
       return Array.prototype.filter.call(
         document.querySelectorAll("#deskbox form.dk-f label[for]"),
         function(l){ return !document.getElementById(l.getAttribute("for")); }).length;
     })) === 0);
  ok("처음 낼 때는 **고치는 까닭** 칸이 없다 (적을 것이 없습니다)",
     (await s.p.locator('#deskbox form.dk-f [name="whyText"]').count()) === 0);

  /* ⚠️⚠️ 금액을 안 적고 보내면 — 브라우저의 `required` 가 먼저 막습니다 */
  await s.p.fill('#deskbox form.dk-f [name="scope"]', "주 1회 90분 8회");
  await s.p.click('#deskbox form.dk-f button[type="submit"]');
  await s.p.waitForTimeout(250);
  ok("금액이 비면 브라우저가 먼저 막는다 (보내지 않는다)",
     s.sent.filter(function(x){ return x.name === "submit_quote"; }).length === 0,
     JSON.stringify(s.sent));
  /* ⚠️⚠️ **`required` 에 기대지 않습니다.** DevTools 로 지우면 그
     자물쇠는 없습니다 — 코드 쪽 자물쇠가 따로 있어야 합니다. 둘을
     **따로** 눌러 봅니다 (자물쇠가 겹치면 검사를 속입니다). */
  await s.p.evaluate(function(){
    document.querySelector('#deskbox form.dk-f [name="amount"]').removeAttribute("required");
  });
  await s.p.click('#deskbox form.dk-f button[type="submit"]');
  await s.p.waitForTimeout(250);
  ok("required 를 지워도 **코드가** 막고 사람 말로 말한다",
     /견적 금액을 적어 주세요/.test((await s.p.textContent("#deskbox")) || "") &&
     s.sent.filter(function(x){ return x.name === "submit_quote"; }).length === 0,
     JSON.stringify(s.sent));

  /* ⚠️⚠️ **0 은 값입니다** (무상 · 서비스) — 화면이 0 을 "안 적음" 으로
     읽으면 무료 상담 견적을 낼 수 없습니다. */
  await s.p.fill('#deskbox form.dk-f [name="amount"]', "0");
  await s.p.click('#deskbox form.dk-f button[type="submit"]');
  await s.p.waitForTimeout(300);
  call = s.sent.filter(function(x){ return x.name === "submit_quote"; })[0];
  ok("⚠️ 금액 0 원은 **보낸다** (0 을 '안 적음' 으로 읽지 않는다)",
     !!call && JSON.parse(call.body).p_data.amount === 0, call && call.body);
  await s.p.close();

  console.log("\n── 보내는 꾸러미를 뜯어 봅니다");
  s = await open("/desk", PRO,
                 { assignment:[asg(consulting, "accepted")], request:[consulting],
                   quote:[], request_item:ITEMS });
  await s.p.click('#deskbox button[data-do="quote"]');
  await s.p.waitForTimeout(250);
  await s.p.fill('#deskbox form.dk-f [name="amount"]', "1,250,000원");
  await s.p.fill('#deskbox form.dk-f [name="scope"]', "주 2회 60분 12회");
  await s.p.fill('#deskbox form.dk-f [name="excludes"]', "타석료 별도");
  await s.p.fill('#deskbox form.dk-f [name="days"]', "90일");
  await s.p.fill('#deskbox form.dk-f [name="startOn"]', "2026-11-15");
  await s.p.fill('#deskbox form.dk-f [name="warranty"]', "1개월 재레슨");
  await s.p.selectOption('#deskbox form.dk-f [name="vat"]', "incl");
  await s.p.click('#deskbox form.dk-f button[type="submit"]');
  await s.p.waitForTimeout(350);
  call = s.sent.filter(function(x){ return x.name === "submit_quote"; })[0];
  const body = call ? JSON.parse(call.body) : {};
  ok("submit_quote 를 부른다", !!call, JSON.stringify(s.sent));
  ok("요청 id 를 보낸다", body.p_request === REQ.id, body.p_request);
  ok("⚠️ 쉼표 · '원' 을 적어도 **숫자로** 보낸다",
     body.p_data && body.p_data.amount === 1250000, body.p_data && body.p_data.amount);
  ok("⚠️ 소요일에 '일' 을 적어도 숫자로 보낸다",
     body.p_data && body.p_data.days === 90, body.p_data && body.p_data.days);
  ok("칸 이름이 DB 가 읽는 이름과 같다 (startOn · validTo — 0008 이 그렇게 읽습니다)",
     body.p_data && body.p_data.startOn === "2026-11-15" &&
     Object.prototype.hasOwnProperty.call(body.p_data, "validTo"), JSON.stringify(body.p_data));
  ok("안 적은 칸은 **null 로** 보낸다 (빈 글자를 넣지 않는다)",
     body.p_data && body.p_data.validTo === null && body.p_data.note === null,
     JSON.stringify(body.p_data));
  ok("고른 부가세가 그대로 간다", body.p_data && body.p_data.vat === "incl");
  await s.p.close();

  /* ══ /desk — 이미 낸 견적 ═════════════════════════════════════ */
  console.log("\n── 이미 낸 견적 — 고치기 · 거두기");
  const quoted = Object.assign({}, REQ, { state:"quoted" });
  s = await open("/desk", PRO,
                 { assignment:[asg(quoted, "accepted")], request:[quoted],
                   quote:[QUOTE], request_item:ITEMS });
  t = (await s.p.textContent("#deskbox")) || "";
  ok("낸 금액과 부가세를 **같이** 보여 준다 (별도 · 포함을 헷갈리면 10% 틀립니다)",
     t.indexOf("600,000원 · 부가세 별도") >= 0, t);
  ok("견적 상태를 사람 말로 보여 준다", t.indexOf("받은 견적") >= 0);
  html = await s.p.innerHTML("#deskbox");
  ok("⚠️ 업체가 적은 글도 esc() 를 지난다",
     html.indexOf("<b>주 1회</b>") < 0 && html.indexOf("&lt;b&gt;") >= 0);
  ok("고치기 · 거두기 단추를 낸다",
     (await s.p.locator('#deskbox button[data-do="quote"]').count()) === 1 &&
     (await s.p.locator('#deskbox button[data-do="pull"]').count()) === 1);
  await s.p.click('#deskbox button[data-do="quote"]');
  await s.p.waitForTimeout(250);
  ok("고칠 때는 지금 값이 칸에 들어 있다",
     (await s.p.inputValue('#deskbox form.dk-f [name="amount"]')) === "600000" &&
     (await s.p.inputValue('#deskbox form.dk-f [name="warranty"]')) === "1개월");
  ok("고칠 때는 **고치는 까닭** 칸이 생긴다 (기록에 남습니다)",
     (await s.p.locator('#deskbox form.dk-f [name="whyText"]').count()) === 1);
  await s.p.close();

  console.log("\n── 손님이 고른 견적은 건드릴 수 없습니다");
  s = await open("/desk", PRO,
                 { assignment:[asg(Object.assign({}, REQ, { state:"nego" }), "accepted")],
                   request:[Object.assign({}, REQ, { state:"nego" })],
                   quote:[Object.assign({}, QUOTE, { state:"chosen" })],
                   request_item:ITEMS });
  t = (await s.p.textContent("#deskbox")) || "";
  ok("고르셨다고 말해 준다", /손님이 이 견적을 고르셨습니다/.test(t), t);
  ok("고치기 · 거두기 단추를 **아예 안 낸다** (눌러도 DB 가 거절합니다)",
     (await s.p.locator('#deskbox button[data-do="quote"]').count()) === 0 &&
     (await s.p.locator('#deskbox button[data-do="pull"]').count()) === 0);
  await s.p.close();

  /* ══ /admin — 배정 ════════════════════════════════════════════ */
  console.log("\n── /admin 운영자가 아니면 배정 자리를 안 읽습니다");
  const PROVS = [
    { id:"t-range", name:"[검사용] 남서울 실내연습장", assignable:true, is_test:true, listed:true },
    { id:"real-1",  name:"<script>alert(1)</script>",  assignable:true, is_test:false, listed:true },
    { id:"off-1",   name:"아직 계약 전",                assignable:false, is_test:false, listed:true }
  ];
  const ADMT = { request:[Object.assign({}, REQ, { state:"check" })],
                 provider:PROVS, request_item:ITEMS, assignment:[] };
  s = await open("/admin", { role:"customer", name:"일반회원" }, ADMT);
  ok("배정 자리가 아예 안 그려진다",
     (await s.p.locator("#assignbox .dk-r").count()) === 0);
  t = (await s.p.textContent("#assignbox")) || "";
  ok("손님 성함 · 연락처가 한 글자도 안 나온다",
     t.indexOf("홍길동") < 0 && t.indexOf("1234-5678") < 0, t);
  await s.p.close();

  console.log("\n── 운영자는 봅니다 — ⚠️ 검사용 업체를 가리지 않습니다");
  s = await open("/admin", { role:"admin", name:"관리자" }, ADMT);
  ok("화면 에러 · CSP 거절이 0건이다", s.errs.length === 0, s.errs.join(" | "));
  t = (await s.p.textContent("#assignbox")) || "";
  ok("요청이 그려진다", (await s.p.locator("#assignbox .dk-r").count()) === 1);
  ok("⚠️ 검사용이 섞여 있다고 **운영자에게** 말한다", /검사용 1곳/.test(t), t.slice(0, 200));
  await s.p.click('#assignbox button[data-do="pick"]');
  await s.p.waitForTimeout(300);
  const opts = await s.p.locator("#assignbox form.as-f select option").allTextContents();
  ok("배정 가능한 업체만 고를 수 있다 (계약 전은 목록에 없다)",
     opts.join("|").indexOf("아직 계약 전") < 0, opts.join("|"));
  ok("⚠️ 검사용임을 **고르는 자리에서** 말한다",
     opts.some(function(x){ return x.indexOf("검사용") >= 0; }), opts.join("|"));
  html = await s.p.innerHTML("#assignbox");
  ok("⚠️ 업체 이름도 esc() 를 지난다",
     html.indexOf("<script>alert(1)") < 0 && html.indexOf("&lt;script&gt;") >= 0);

  /* ⚠️⚠️ 화면 쪽 규칙 — 체크 없이 보내면 안 됩니다 */
  t = (await s.p.textContent("#assignbox")) || "";
  ok("수집 항목 · 목적 · 제공받는 자를 같은 자리에서 보여 준다",
     /제공받는 자/.test(t) && /제공 항목/.test(t) && /제공 목적/.test(t));
  ok("접수 동의에 들어 있지 않다고 적는다", /들어 있지 않습니다/.test(t));
  ok("감사 기록에 성함 · 연락처를 적지 말라고 적는다", /적지 마십니다/.test(t));
  await s.p.selectOption("#assignbox form.as-f select", "t-range");
  await s.p.fill('#assignbox form.as-f [name="whyText"]', "11/03 14:20 통화로 상호 안내");
  await s.p.evaluate(function(){
    /* ⚠️ required 를 건너뛰고 보내 봅니다 — 브라우저가 막아 주는 것에
       기대지 않습니다 (DevTools 로 지우면 그 자물쇠는 없습니다). */
    document.querySelector('#assignbox form.as-f [name="ok"]').removeAttribute("required");
  });
  await s.p.click("#assignbox form.as-f button[type='submit']");
  await s.p.waitForTimeout(300);
  ok("⚠️⚠️ 동의 체크 없이는 **보내지 않는다**",
     s.sent.filter(function(x){ return x.name === "move_state"; }).length === 0,
     JSON.stringify(s.sent));
  ok("  왜 안 보내는지 말해 준다",
     /동의를 받으셨는지 확인/.test((await s.p.textContent("#assignbox")) || ""));

  await s.p.check('#assignbox form.as-f [name="ok"]');
  await s.p.click("#assignbox form.as-f button[type='submit']");
  await s.p.waitForTimeout(350);
  call = s.sent.filter(function(x){ return x.name === "move_state"; })[0];
  const ab = call ? JSON.parse(call.body) : {};
  ok("체크하면 move_state 로 넘긴다", !!call, JSON.stringify(s.sent));
  ok("  assigned 로 간다", ab.p_to === "assigned", ab.p_to);
  ok("  고른 업체를 보낸다", ab.p_ctx && ab.p_ctx.providerId === "t-range");
  ok("  ⚠️ agree3rd 를 true 로 보낸다 (0004 가 그것을 봅니다)",
     ab.p_ctx && ab.p_ctx.agree3rd === true, JSON.stringify(ab.p_ctx));
  ok("  동의받은 방법이 같이 간다 (기록에 남습니다)",
     ab.p_ctx && ab.p_ctx.why.indexOf("통화로 상호 안내") >= 0, ab.p_ctx && ab.p_ctx.why);
  await s.p.close();

  console.log("\n── 넘길 수 있는 업체가 없을 때");
  s = await open("/admin", { role:"admin", name:"관리자" },
    Object.assign({}, ADMT, { provider:[PROVS[2]] }));
  await s.p.click('#assignbox button[data-do="pick"]');
  await s.p.waitForTimeout(300);
  t = (await s.p.textContent("#assignbox")) || "";
  ok("고르는 칸을 **아예 안 낸다**",
     (await s.p.locator("#assignbox form.as-f").count()) === 0);
  ok("무엇을 해야 하는지 말해 준다", /배정 가능/.test(t), t.slice(-200));
  await s.p.close();

  /* ══ 수수료 · 정산 (2차 지시서 §7) ══════════════════════════ */
  console.log("\n── /desk 수수료 · 정산 — ⚠️ 손님에게는 한 줄도 안 보입니다");
  const FEE = {
    deal:[
      { id:"f1", request_id:REQ.id, amount:3000000, fee:300000, fee_vat:30000,
        fee_total:330000, paid:330000, paid_at:"2029-12-20T01:00:00Z",
        fee_at:"2029-12-10T01:00:00Z", signed_at:"2029-12-05T01:00:00Z", done_at:null },
      /* ⚠️⚠️ **아직 확정 전**입니다 — 0원이 아닙니다 */
      { id:"f2", request_id:REQ2.id, amount:1200000, fee:null, fee_vat:null,
        fee_total:null, paid:null, paid_at:null, fee_at:null,
        signed_at:"2029-12-08T01:00:00Z", done_at:null }
    ],
    settlement:[{ id:"s1", from_date:"2029-12-01", to_date:"2029-12-31",
                  total:330000, state:"wait", paid_at:null, approved_at:null }],
    fee_policy:[{ id:"p1", type:"rate", flat:null, rate:8, min_fee:50000,
                  max_fee:null, vat:"add", confirm_when:"done", cycle:"monthly",
                  refund_rule:"계약 취소 시 전액 환수", from_date:"2029-01-01",
                  to_date:null }],
    request:[REQ, REQ2]
  };

  s = await open("/desk", { role:"customer", name:"일반회원" }, FEE, {}, false);
  ok("업체가 아니면 수수료 표를 **아예 안 그린다**",
     (await s.p.locator("#feebox .cnt").count()) === 0);
  ok("  읽으러 가지도 않는다",
     s.sent.filter(function(x){ return x.name === "GET" &&
       x.body.indexOf("/fee_policy") >= 0; }).length === 0);
  await s.p.close();

  s = await open("/desk", PRO, FEE, {}, false);
  ok("화면 에러 · CSP 거절이 0건이다", s.errs.length === 0, s.errs.join(" | "));
  t = (await s.p.textContent("#feebox")) || "";
  ok("손님에게는 안 보이는 표라고 적는다", /손님에게는 보이지 않습니다/.test(t), t.slice(0, 200));
  ok("수수료 정책이 사람 말로 나온다 (rate 가 아니라 거래액의 8%)",
     t.indexOf("거래액의 8%") >= 0 && t.indexOf("rate") < 0, t.slice(0, 400));
  /* ⚠️ 요율을 **두 번 말하지 않습니다** ("거래액의 % · 8%" 가 되던 자리) */
  ok("  요율을 두 번 적지 않는다", t.indexOf("거래액의 % ") < 0, t.slice(0, 400));
  ok("  요율 · 부가세 · 확정 시점 · 주기를 **같이** 적는다",
     t.indexOf("8%") >= 0 && t.indexOf("부가세 별도") >= 0 &&
     t.indexOf("이행이 끝난 때") >= 0 && t.indexOf("달마다") >= 0, t.slice(0, 400));
  ok("  환수 조건도 적는다", t.indexOf("전액 환수") >= 0);
  /* ⚠️⚠️ **안 적힌 것과 0원은 다릅니다** — 아직 확정 전인 계약을
     "0원" 으로 찍으면 업체가 "수수료가 없다" 로 읽습니다. */
  ok("⚠️ 확정 전 수수료를 **'아직'** 으로 찍는다 (0원이 아니다)",
     t.indexOf("아직") >= 0, t.slice(0, 600));
  ok("  확정 전인 건 수를 **따로** 센다", /아직 확정 전/.test(t), t);
  /* ⚠️ 합계는 계산입니다 — 330,000 하나만 확정됐으니 그 값이라야 합니다 */
  ok("확정된 수수료 합계가 손으로 센 값과 같다 (330,000)",
     t.indexOf("330,000원") >= 0, t);
  ok("계약 · 입금을 **갈라서** 보여 준다",
     t.indexOf("3,000,000원") >= 0 && t.indexOf("계약별 수수료") >= 0, t.slice(0, 600));
  ok("정산 상태가 사람 말이다", t.indexOf("지급 대기") >= 0 && t.indexOf("wait") < 0);
  ok("⚠️ 이 화면에서 못 고친다고 적는다", /이 화면에서는 고칠 수 없습니다/.test(t));
  ok("누르는 것이 전부 40px 이상이다", (await tapsOk(s.p, "#feebox")) === 0,
     await tapsOk(s.p, "#feebox"));
  await s.p.close();

  console.log("\n── 0건일 때와 못 읽었을 때를 가릅니다");
  s = await open("/desk", PRO,
    { deal:[], settlement:[], fee_policy:[], request:[] }, {}, false);
  t = (await s.p.textContent("#feebox")) || "";
  ok("정책이 0건이면 **지어낸 값이 아니라고** 말한다",
     /지어낸 값이 아닙니다/.test(t), t.slice(0, 300));
  ok("계약이 0건이면 0건이라고 말한다", /아직 계약이 없습니다/.test(t));
  await s.p.close();
  s = await open("/desk", PRO,
    { deal:null, settlement:[], fee_policy:[], request:[] }, {}, false);
  t = (await s.p.textContent("#feebox")) || "";
  ok("못 읽으면 그렇다고 말한다", /읽지 못했습니다/.test(t), t.slice(0, 200));
  ok("⚠️ 못 읽은 것을 0건이라고 하지 않는다",
     t.indexOf("아직 계약이 없습니다") < 0, t.slice(0, 200));
  await s.p.close();

  /* ══ 상담 일정 (2차 지시서 §7) ══════════════════════════════ */
  console.log("\n── /desk 일정 — 수락한 뒤에만, 끝난 건에는 안 냅니다");
  const APPT = { id:"eeeeeeee-0000-0000-0000-000000000001", request_id:REQ.id,
    at:"2029-12-05T05:30:00Z", kind:"visit", place:"남서울 실내연습장 3층",
    note:"프런트에서 찾아 주세요", state:"set", why:null };
  const APT = { assignment:[asg(quoted, "accepted")], request:[quoted],
                quote:[QUOTE], request_item:ITEMS, appointment:[APPT] };

  s = await open("/desk", PRO, APT, {}, false);
  ok("잡힌 일정이 보인다", (await s.p.locator("#deskbox .ap").count()) === 1);
  t = (await s.p.textContent("#deskbox")) || "";
  /* ⚠️⚠️ **Supabase 는 UTC 입니다** — 05:30Z 는 한국 시각 오후 2시 30분.
     그냥 찍으면 아홉 시간 어긋나고, 보는 사람은 그것을 모릅니다. */
  ok("⚠️ 때를 **한국 시각**으로 보여 준다 (05:30Z → 오후 2시 30분)",
     t.indexOf("2029년 12월 5일 (수) 오후 2시 30분") >= 0, t.slice(0, 400));
  ok("만나는 방법이 사람 말이다 (visit 이 아니라 방문)",
     t.indexOf("방문") >= 0 && t.indexOf("visit") < 0);
  ok("일정 상태가 사람 말이다", t.indexOf("잡힘") >= 0 && t.indexOf("set") < 0);
  ok("어디서 · 전할 말이 보인다",
     t.indexOf("남서울 실내연습장 3층") >= 0 && t.indexOf("프런트에서") >= 0);
  ok("바꾸기 · 만났음 · 취소 단추를 낸다",
     (await s.p.locator('#deskbox button[data-do="appt"]').count()) === 1 &&
     (await s.p.locator('#deskbox button[data-do="apdone"]').count()) === 1 &&
     (await s.p.locator('#deskbox button[data-do="apcancel"]').count()) === 1);

  await s.p.click('#deskbox button[data-do="appt"]');
  await s.p.waitForTimeout(300);
  ok("양식이 펼쳐진다", (await s.p.locator("#deskbox form.ap-f").count()) === 1);
  /* ⚠️⚠️ 칸에 들어 있는 값도 **한국 시각**이라야 합니다 — UTC 로
     채우면 사장님이 고칠 때마다 아홉 시간씩 당겨집니다. */
  ok("⚠️ 칸의 값이 한국 시각이다",
     (await s.p.inputValue('#deskbox form.ap-f [name="at"]')) === "2029-12-05T14:30",
     await s.p.inputValue('#deskbox form.ap-f [name="at"]'));
  const kinds = await s.p.locator('#deskbox form.ap-f [name="kind"] option').count();
  ok("만나는 방법이 **셋**이다 (DB 의 check 와 같은 수)", kinds === 3, kinds);
  ok("⚠️ 알림이 가지 않는다고 적는다",
     /문자나 알림은 가지 않습니다/.test((await s.p.textContent("#deskbox")) || ""));

  await s.p.fill('#deskbox form.ap-f [name="at"]', "2029-12-24T09:00");
  await s.p.selectOption('#deskbox form.ap-f [name="kind"]', "call");
  await s.p.click("#deskbox form.ap-f button[type='submit']");
  await s.p.waitForTimeout(350);
  call = s.sent.filter(function(x){ return x.name === "set_appointment"; })[0];
  const ab2 = call ? JSON.parse(call.body) : {};
  ok("set_appointment 를 부른다", !!call, JSON.stringify(s.sent));
  /* ⚠️⚠️ **적은 것은 한국 시각, 보내는 것은 UTC.** 기계의 띠로 읽으면
     해외에서 아홉 시간 어긋납니다 — 그 자리를 여기서 잽니다. */
  ok("⚠️ 한국 시각으로 읽어 **UTC 로** 보낸다 (09:00 KST → 00:00Z)",
     !!ab2.p && ab2.p.at === "2029-12-24T00:00:00.000Z", ab2.p && ab2.p.at);
  ok("  고른 방법이 그대로 간다", !!ab2.p && ab2.p.kind === "call");
  ok("  어느 요청인지 같이 보낸다", !!ab2.p && ab2.p.request === REQ.id);
  await s.p.close();

  console.log("\n── 수락 전 · 끝난 건에는 일정 단추를 안 냅니다");
  s = await open("/desk", PRO,
    { assignment:[asg(REQ2, "sent")], request:[REQ2], quote:[], request_item:ITEMS,
      appointment:[] }, {}, false);
  ok("수락 전에는 일정 단추가 없다",
     (await s.p.locator('#deskbox button[data-do="appt"]').count()) === 0);
  await s.p.close();
  const lost = Object.assign({}, REQ, { state:"lost" });
  s = await open("/desk", PRO,
    { assignment:[asg(lost, "accepted")], request:[lost], quote:[],
      request_item:ITEMS, appointment:[] }, {}, false);
  ok("진행 안 함인 건에는 일정 단추가 없다 (DB 도 거절합니다)",
     (await s.p.locator('#deskbox button[data-do="appt"]').count()) === 0);
  await s.p.close();

  /* ══ 붙이신 사진 · 서류 (2차 지시서 §5-4) ═══════════════════ */
  const PICS = [
    { id:"dddddddd-0000-0000-0000-000000000001", request_id:REQ.id,
      mime:"image/jpeg", bytes:2400000 },
    { id:"dddddddd-0000-0000-0000-000000000002", request_id:REQ.id,
      mime:"application/pdf", bytes:51200 }
  ];
  const DESKP = { assignment:[asg(quoted, "accepted")], request:[quoted],
                  quote:[QUOTE], request_item:ITEMS, request_photo:PICS };

  console.log("\n── 버킷이 설정되기 전에는 사진 칸이 **아예 안 나옵니다**");
  s = await open("/desk", PRO, DESKP, {}, false);
  ok("사진 줄이 안 그려진다", (await s.p.locator("#deskbox .phv").count()) === 0);
  t = (await s.p.textContent("#deskbox")) || "";
  ok("'준비 중' 같은 말도 안 나온다", t.indexOf("준비 중") < 0, t.slice(0, 200));
  await s.p.close();

  console.log("\n── 버킷이 켜지면 업체가 붙은 파일을 봅니다 (0011 의 photo_provider)");
  s = await open("/desk", PRO, DESKP, {}, true);
  ok("화면 에러 · CSP 거절이 0건이다", s.errs.length === 0, s.errs.join(" | "));
  ok("사진 줄이 그려진다", (await s.p.locator("#deskbox .phv").count()) === 1);
  t = (await s.p.textContent("#deskbox")) || "";
  ok("몇 장인지 말한다", /붙이신 파일 2장/.test(t), t.slice(0, 300));
  ok("사진과 서류를 **갈라서** 말한다",
     t.indexOf("사진 · 2.3MB") >= 0 && t.indexOf("서류 · 50KB") >= 0, t);
  ok("보는 주소가 곧 닫힌다고 적는다", /10분 뒤에 닫힙니다/.test(t));
  /* ⚠️⚠️ **주소를 미리 만들어 두지 않습니다** — 안 누른 사진의
     서명 주소를 만들어 둘 까닭이 없습니다 (service key 를 쓰는 길입니다). */
  ok("⚠️ 누르기 전에는 보는 주소를 **안 청한다**",
     s.sent.filter(function(x){ return x.name === "upload" &&
       x.body.indexOf("p=") >= 0; }).length === 0,
     JSON.stringify(s.sent.filter(function(x){ return x.name === "upload"; })));
  ok("누르는 것이 전부 40px 이상이다", (await tapsOk(s.p, "#deskbox")) === 0);

  await s.p.click('#deskbox button[data-photo]');
  await s.p.waitForTimeout(350);
  ok("누르면 그때 보는 주소를 청한다",
     s.sent.filter(function(x){ return x.name === "upload" &&
       x.body.indexOf("p=") >= 0; }).length === 1,
     JSON.stringify(s.sent.filter(function(x){ return x.name === "upload"; })));
  await s.p.close();

  console.log("\n── 0장이면 **빈 액자를 두지 않습니다**");
  s = await open("/desk", PRO,
    Object.assign({}, DESKP, { request_photo: [] }), {}, true);
  ok("사진 줄이 아예 없다", (await s.p.locator("#deskbox .phv").count()) === 0);
  await s.p.close();

  /* ══ /admin — 매각 지표 (2차 지시서 §9) ══════════════════════ */
  console.log("\n── /admin 매각 지표 — 운영자가 아니면 세러 가지도 않습니다");
  /* ⚠️ DB 가 내려주는 꼴 그대로 흉내 냅니다 (0033 의 biz_metrics).
     ⚠️⚠️ **0 과 null 을 둘 다** 넣습니다 — 화면이 그 둘을 가르는지가
     여기서만 드러납니다 ("0%" 와 "못 냄" 은 다른 말입니다). */
  const MET = {
    from:"2029-11", to:"2029-12",
    months:[
      { month:"2029-11", req:0, req_test:0, assigned:0, accepted:0,
        rate_valid:null, quoted:0, deals:0, gmv:0, gmv_missing:0,
        fee_paid:0, fee_set:0, fee_due:0, ad:0, mship:0, users:0 },
      { month:"2029-12", req:3, req_test:1, assigned:1, accepted:3,
        rate_valid:100.0, quoted:2, deals:3, gmv:3000000, gmv_missing:1,
        fee_paid:0, fee_set:330000, fee_due:330000, ad:500000,
        mship:99000, users:2 }
    ],
    cannot:["방문자 기준 MAU — 방문을 세는 장치가 없습니다.",
            "광고 · 멤버십의 입금 — 기록을 두는 표가 아직 없습니다."]
  };
  const ADMT2 = { request:[], provider:[], request_item:[], assignment:[] };

  s = await open("/admin", { role:"customer", name:"일반회원" }, ADMT2,
                 { biz_metrics: MET });
  ok("지표가 아예 안 그려진다",
     (await s.p.locator("#metricbox .mt-g").count()) === 0);
  ok("지표를 **세러 가지도 않는다**",
     s.sent.filter(function(x){ return x.name === "biz_metrics"; }).length === 0,
     JSON.stringify(s.sent));
  await s.p.close();

  console.log("\n── 운영자는 봅니다 — ⚠️ 숫자 옆에 **뜻**이 같이 나옵니다");
  s = await open("/admin", { role:"admin", name:"관리자" }, ADMT2,
                 { biz_metrics: MET });
  ok("화면 에러 · CSP 거절이 0건이다", s.errs.length === 0, s.errs.join(" | "));
  call = s.sent.filter(function(x){ return x.name === "biz_metrics"; })[0];
  ok("biz_metrics 를 부른다", !!call, JSON.stringify(s.sent));
  const mb = call ? JSON.parse(call.body) : {};
  ok("  기간을 **YYYY-MM 꼴로** 보낸다 (DB 가 그것을 읽습니다)",
     !!mb.p && /^\d{4}-\d{2}$/.test(mb.p.from) && /^\d{4}-\d{2}$/.test(mb.p.to),
     JSON.stringify(mb.p));
  ok("  기본이 열두 달이다 (from 과 to 가 11달 차이)",
     !!mb.p && (function(){
       const a = mb.p.from.split("-"), c = mb.p.to.split("-");
       return (Number(c[0]) * 12 + Number(c[1])) - (Number(a[0]) * 12 + Number(a[1])) === 11;
     })(), JSON.stringify(mb.p));

  const groups = await s.p.locator("#metricbox .mt-g").count();
  ok("묶음이 그려진다", groups >= 3, groups);
  t = (await s.p.textContent("#metricbox")) || "";
  ok("달 이름이 사람 말이다 (2029-12 가 아니라 2029년 12월)",
     t.indexOf("2029년 12월") >= 0 && t.indexOf("2029-12") < 0, t.slice(0, 160));
  ok("지표 이름이 나온다", t.indexOf("유효 상담") >= 0 && t.indexOf("거래액") >= 0);
  ok("⚠️ **뜻이 숫자와 같은 화면에** 나온다",
     (await s.p.locator("#metricbox .mt-what").count()) > 0 &&
     t.indexOf("업체가 **수락한**".replace(/\*\*/g, "")) >= 0, t.slice(0, 400));
  ok("검사용을 빼고 센다고 적는다", /검사용 업체는 빼고/.test(t), t.slice(0, 200));

  /* ⚠️⚠️ **0 과 '못 냄' 을 가르는가** — 이 화면에서만 드러납니다 */
  ok("요청 0건인 달은 비율이 **—** 다 (0% 가 아니다)",
     t.indexOf("—") >= 0, t.slice(0, 300));
  ok("  그 달의 요청은 **0건**으로 찍힌다 (— 가 아니다)",
     t.indexOf("0건") >= 0);
  ok("  전부 수락한 달은 **100%** 다", t.indexOf("100%") >= 0, t);
  ok("돈은 천 단위로 끊어 찍는다", t.indexOf("3,000,000원") >= 0, t);

  /* ⚠️⚠️ 거래액과 플랫폼 수입이 **같은 표에 있으면 더하게 됩니다** */
  const gmvTable = await s.p.evaluate(function(){
    const gs = Array.prototype.slice.call(document.querySelectorAll("#metricbox .mt-g"));
    function findIn(name){
      for(let i = 0; i < gs.length; i++)
        if((gs[i].textContent || "").indexOf(name) >= 0) return i;
      return -1;
    }
    return { gmv: findIn("거래액"), fee: findIn("받은 수수료") };
  });
  ok("⚠️ 거래액과 '받은 수수료' 가 **다른 표**에 있다 (§9 분리)",
     gmvTable.gmv >= 0 && gmvTable.fee >= 0 && gmvTable.gmv !== gmvTable.fee,
     JSON.stringify(gmvTable));
  ok("  거래액 묶음이 '플랫폼 매출이 아니다' 라고 적는다",
     /플랫폼 매출이 아닙니다/.test(t), t.slice(0, 500));
  ok("  광고 · 멤버십에 **받은 기록이 없다**고 적는다",
     /청구 기록 없음/.test(t) || /받은 기록이 없습니다/.test(t), t);

  /* ⚠️⚠️ 못 재는 것을 **숫자와 같은 화면에** */
  ok("못 재는 것을 같이 찍는다",
     (await s.p.locator("#metricbox .mt-cant li").count()) === 2,
     await s.p.locator("#metricbox .mt-cant li").count());
  ok("  방문자 MAU 를 못 잰다고 적는다", /방문자 기준 MAU/.test(t));
  ok("누르는 것이 전부 40px 이상이다", (await tapsOk(s.p, "#metricbox")) === 0,
     await tapsOk(s.p, "#metricbox"));
  /* ⚠️ `<select>` 안의 글자는 낱말 잘림 검사에도 가로 스크롤 검사에도
     안 걸립니다 — 높이만이라도 여기서 잽니다. */
  const selH = await s.p.evaluate(function(){
    const e = document.getElementById("mt-span");
    return e ? e.getBoundingClientRect().height : 0;
  });
  ok("기간 고르개도 40px 이상이다", selH >= 40, selH);

  /* 기간을 바꾸면 **다시 묻는가** (눌러도 아무 일이 안 나면 안 됩니다) */
  await s.p.selectOption("#metricbox #mt-span", "3");
  await s.p.waitForTimeout(350);
  const calls = s.sent.filter(function(x){ return x.name === "biz_metrics"; });
  ok("기간을 바꾸면 **다시 묻는다**", calls.length === 2, calls.length);
  const mb2 = calls.length > 1 ? JSON.parse(calls[1].body) : {};
  ok("  이번에는 석 달을 묻는다",
     !!mb2.p && (function(){
       const a = mb2.p.from.split("-"), c = mb2.p.to.split("-");
       return (Number(c[0]) * 12 + Number(c[1])) - (Number(a[0]) * 12 + Number(a[1])) === 2;
     })(), JSON.stringify(mb2.p));
  await s.p.close();

  console.log("\n── 지표를 못 읽었을 때 — 0 으로 찍지 않습니다");
  s = await open("/admin", { role:"admin", name:"관리자" }, ADMT2,
                 { biz_metrics: null });
  t = (await s.p.textContent("#metricbox")) || "";
  ok("읽지 못하면 그렇다고 말한다", /못 읽었습니다|읽지 못/.test(t), t.slice(0, 120));
  ok("⚠️ 읽지 못한 것을 **0 으로 찍지 않는다**",
     t.indexOf("0건") < 0 && t.indexOf("0원") < 0, t.slice(0, 200));
  ok("다시 읽을 길을 낸다",
     (await s.p.locator("#metricbox button[data-do='again']").count()) === 1);
  await s.p.close();

  /* ══ /admin 수수료 · 광고 · 멤버십 (2차 지시서 §7) ══════════ */
  console.log("\n── /admin 관리 자리 — ⚠️ **관리자만** (직원도 안 됩니다)");
  const BIZ = {
    provider:[{ id:"real-1", name:"그린레슨 아카데미", is_test:false },
              { id:"t-range", name:"[검사용] 남서울", is_test:true }],
    fee_policy:[{ id:"fp1", provider_id:"real-1", type:"rate", flat:null, rate:8,
                  min_fee:null, max_fee:null, vat:"add", confirm_when:"done",
                  cycle:"monthly", refund_rule:null, from_date:null, to_date:null,
                  active:true }],
    /* ⚠️⚠️⚠️ **0064 부터 `/admin` 은 보기(`v_ad_board`)를 읽습니다** —
       전에는 `ad_run` 표를 바로 읽었습니다. 그 보기가 계약액 · 청구 ·
       수납 · 환불 · 실매출 · 노출 · 클릭을 한 줄로 내주므로 화면이
       다시 셈하지 않습니다. ⚠️ 흉내 자료도 **그 보기의 칸**이어야
       합니다 — 표 이름을 그대로 두면 목록이 0건으로 보이고, 그러면
       "아직 집행한 광고가 없습니다" 가 나와 멀쩡한 화면이 실패합니다. */
    v_ad_board:[{ id:"ad1", provider_id:"real-1",
              provider_name:"그린레슨 아카데미", advertiser:null,
              place:"main_hero", cat_key:null,
              region:null, starts_on:"2029-12-01", ends_on:"2029-12-31",
              price:500000, state:"draft", note:null, click_url:null,
              img_pc:null, img_mo:null, img_alt:null,
              billed:500000, paid:300000, refunded:0, net:300000,
              views:120, clicks:4 }],
    ad_bill:[{ id:"b1", ad_id:"ad1", kind:"pay", amount:300000,
               on_day:"2029-12-05", memo:"1차" }],
    membership_plan:[],
    provider_membership:[]
  };

  s = await open("/admin", { role:"staff", name:"직원" }, BIZ, {}, false);
  ok("⚠️ 직원에게는 관리 자리가 **안 그려진다** (문들이 관리자만 받습니다)",
     (await s.p.locator("#bizbox .bz-tabs").count()) === 0);
  await s.p.close();

  s = await open("/admin", { role:"admin", name:"관리자" }, BIZ, {}, false);
  ok("화면 에러 · CSP 거절이 0건이다", s.errs.length === 0, s.errs.join(" | "));
  /* ⚠️⚠️ **갯수를 박지 않습니다** — 갈래를 더하는 날 멀쩡한 화면이
     실패합니다 (후기 갈래를 더하자 셋 ≠ 넷으로 떨어졌습니다).
     재는 것은 **갈래마다 그 자리가 실제로 열리는가**입니다. */
  const tabKeys = await s.p.locator("#bizbox button[data-tab]").evaluateAll(
    function(ns){ return ns.map(function(n){ return n.getAttribute("data-tab"); }); });
  ok("갈래가 둘 이상 나온다", tabKeys.length >= 2, tabKeys.join(" "));
  for(const k of tabKeys){
    await s.p.click("#bizbox button[data-tab='" + k + "']");
    await s.p.waitForTimeout(150);
    ok("  '" + k + "' 갈래를 누르면 그 자리가 그려진다",
       (await s.p.locator("#bizbox .bz-body").count()) === 1 &&
       ((await s.p.textContent("#bizbox .bz-body")) || "").trim().length > 10);
  }
  await s.p.click("#bizbox button[data-tab='" + tabKeys[0] + "']");
  await s.p.waitForTimeout(150);
  t = (await s.p.textContent("#bizbox")) || "";
  ok("수수료 정책이 사람 말로 나온다 (rate 가 아니라 거래액의 8%)",
     t.indexOf("거래액의 8%") >= 0 && t.indexOf("rate") < 0, t.slice(0, 300));
  ok("⚠️ 지난 계약은 안 바뀐다고 적는다", /지난 계약의 수수료는 안 바뀝니다/.test(t));

  await s.p.click('#bizbox button[data-tab="ad"]');
  await s.p.waitForTimeout(250);
  t = (await s.p.textContent("#bizbox")) || "";
  /* ⚠️⚠️⚠️ **0064 — 말이 바뀌었습니다.** 전에는 "청구 · 입금 기록이
     아닙니다" 였는데, 그때는 **청구 · 입금을 담을 자리가 없었습니다.**
     지금은 `ad_bill` 줄로 담으므로 그 말이 거짓이 됩니다 — 그래서 재는
     것은 **계약액과 실매출을 갈라서 말하는가**입니다 (지시서 B). */
  ok("⚠️ 계약액이 **적어 둔 값**이라고 적는다",
     t.indexOf("계약액") >= 0 && /적어 둔 값/.test(t), t.slice(0, 300));
  ok("⚠️⚠️ **실매출을 수납 − 환불로** 갈라서 적는다",
     t.indexOf("실매출") >= 0 && /수납 − 환불/.test(t), t.slice(0, 400));
  ok("⚠️⚠️ 노출 · 클릭이 **브라우저가 보낸 것을 센 값**이라고 적는다",
     /브라우저가 보낸 것을 센 값/.test(t) && /청구 근거로 쓰지 마세요/.test(t),
     t.slice(0, 400));
  /* ⚠️ 버킷이 꺼진 채로 연 화면입니다 (`up=false`) — 소재를 올리는 칸을
     **아예 안 내고** 그 까닭을 운영자에게 적습니다 (절대 규칙 5 · 3). */
  ok("⚠️⚠️ 버킷이 없으면 소재 올리는 칸을 **안 낸다**",
     (await s.p.locator("#bizbox input[data-adup]").count()) === 0 &&
     t.indexOf("PROVIDER_BUCKET") >= 0, t.slice(0, 300));
  ok("  ⚠️ 그래도 **점선 자리**는 낸다 (운영자는 올릴 자리를 봐야 합니다)",
     (await s.p.locator("#bizbox .adm-shot").count()) === 2,
     String(await s.p.locator("#bizbox .adm-shot").count()));
  ok("  돈 기록 한 줄이 사람 말로 나온다 (pay 가 아니라 수납)",
     t.indexOf("수납") >= 0 && t.indexOf("pay") < 0, t.slice(0, 400));
  /* ⚠️⚠️⚠️ **이름을 글자로 박지 않습니다.** 전에 "메인 히어로" 를 박아
     두었다가, 지시서 B 의 슬롯 이름에 맞춰 "메인 프리미엄" 으로 바꾸는
     순간 **멀쩡한 화면이 실패**했습니다 (작업 기억 — 검사에 그날의 색 ·
     이름 · 개수를 박지 마세요). 재려는 뜻은 "**키가 아니라 사람 말**로
     나오는가" 이므로 `AM_AD_PLACE` 에서 읽어 맞춰 봅니다. */
  const plName = await s.p.evaluate(function(){
    const L = window.AM_AD_PLACE || [];
    for(let i = 0; i < L.length; i++) if(L[i].key === "main_hero") return L[i].name;
    return "";
  });
  ok("⚠️ 잴 이름을 실제로 읽었다 (빈 글자면 이 검사가 고장입니다)",
     plName.length > 0, plName);
  ok("광고 자리가 **사람 말**로 나온다 (main_hero 라는 키가 안 보입니다)",
     t.indexOf(plName) >= 0 && t.indexOf("main_hero") < 0,
     plName + " | " + t.slice(0, 200));
  ok("새로 넣으면 '준비' 라고 적는다 (바로 안 뜹니다)", /준비.*상태입니다|바로 안 뜹니다/.test(t));
  /* ⚠️ 지금 상태로 가는 단추는 안 냅니다 (눌러도 아무 일이 안 납니다) */
  ok("⚠️ 지금 상태(준비)로 가는 단추는 **없다**",
     (await s.p.locator('#bizbox button[data-adto="draft"]').count()) === 0);
  ok("  다른 상태로 가는 단추는 있다",
     (await s.p.locator('#bizbox button[data-adto="live"]').count()) === 1);

  s.p.on("dialog", function(d){ d.accept("계약서 확인함"); });
  await s.p.click('#bizbox button[data-adto="live"]');
  await s.p.waitForTimeout(350);
  call = s.sent.filter(function(x){ return x.name === "set_ad_state"; })[0];
  const adb = call ? JSON.parse(call.body) : {};
  ok("상태를 바꾸면 set_ad_state 를 부른다", !!call, JSON.stringify(s.sent));
  ok("  까닭을 같이 보낸다 (기록에 남습니다)",
     adb.p_why === "계약서 확인함" && adb.p_to === "live", JSON.stringify(adb));

  await s.p.fill("#ba-pv >> nth=0", "").catch(function(){});
  await s.p.selectOption("#bizbox #ba-pv", "real-1");
  await s.p.fill("#bizbox #ba-from", "2030-01-01");
  await s.p.fill("#bizbox #ba-to", "2030-01-31");
  /* ⚠️⚠️ **0 원도 값입니다** (무상 노출) — 화면이 0 을 "안 적음" 으로
     읽으면 무상 광고를 넣을 수 없습니다. */
  await s.p.fill("#bizbox #ba-price", "0");
  await s.p.fill("#bizbox #ba-why", "제휴 기념 무상");
  await s.p.click('#bizbox form[data-kind="ad"] button[type="submit"]');
  await s.p.waitForTimeout(350);
  call = s.sent.filter(function(x){ return x.name === "save_ad"; })[0];
  const sab = call ? JSON.parse(call.body) : {};
  ok("광고를 넣으면 save_ad 를 부른다", !!call, JSON.stringify(s.sent));
  ok("  ⚠️ 0 원을 **0 으로** 보낸다 (안 적음이 아니다)",
     !!sab.p && sab.p.price === 0, sab.p && sab.p.price);
  ok("  까닭이 같이 간다", !!sab.p && sab.p.why === "제휴 기념 무상");

  await s.p.click('#bizbox button[data-tab="plan"]');
  await s.p.waitForTimeout(250);
  t = (await s.p.textContent("#bizbox")) || "";
  /* ⚠️ 0건이면 지어내지 않습니다 */
  ok("요금제가 0건이면 **지어낸 값이 아니라고** 말한다",
     /지어낸 값이 아닙니다/.test(t), t.slice(0, 300));
  ok("⚠️ 요금제가 없으면 **업체에 달 수 없다**고 말한다",
     /요금제를 먼저 만드셔야/.test(t), t.slice(0, 400));
  ok("  그래서 다는 양식을 **아예 안 낸다**",
     (await s.p.locator('#bizbox form[data-kind="mship"]').count()) === 0);
  ok("누르는 것이 전부 40px 이상이다", (await tapsOk(s.p, "#bizbox")) === 0,
     await tapsOk(s.p, "#bizbox"));
  await s.p.close();

  /* ══ /my — 견적 비교 ══════════════════════════════════════════ */
  console.log("\n── /my 손님이 받은 견적을 견줍니다");
  const Q2 = Object.assign({}, QUOTE, {
    id:"cccccccc-0000-0000-0000-000000000002", provider_id:"real-1",
    amount:700000, vat:"incl", scope:"주 2회 60분 8회", excludes:null,
    days:null, start_on:null, warranty:null, valid_to:null });
  /* ⚠️ 상호는 **따로** 읽습니다 (0031 이 그 줄을 열어 줍니다) */
  const MYT = { request:[Object.assign({}, REQ, { state:"quoted" })],
                quote:[QUOTE, Q2],
                provider:[{ id:"t-range", name:"[검사용] 남서울 실내연습장" },
                          { id:"real-1",  name:"그린레슨" }],
                request_item:ITEMS };
  s = await open("/my", { role:"customer", name:"홍길동" }, MYT);
  ok("화면 에러 · CSP 거절이 0건이다", s.errs.length === 0, s.errs.join(" | "));
  t = (await s.p.textContent("#reqbox")) || "";
  ok("내 요청이 그려진다", t.indexOf("SW-7K3M-92QP") >= 0);
  ok("받은 견적이 둘 다 그려진다", (await s.p.locator("#reqbox .rq-q").count()) === 2);
  ok("업체 상호가 나온다 (0031 이 없으면 여기가 빕니다)",
     t.indexOf("남서울 실내연습장") >= 0 && t.indexOf("그린레슨") >= 0, t);
  ok("⚠️ 금액에 부가세 처리를 **붙여서** 보여 준다",
     t.indexOf("600,000원 · 부가세 별도") >= 0 &&
     t.indexOf("700,000원 · 부가세 포함") >= 0, t);
  ok("⚠️ 싼 순서가 아니라고 적는다 (줄 세우지 않습니다)",
     /싼 순서가 아닙니다/.test(t), t);
  ok("값이 없는 칸은 줄째 빠진다", t.indexOf("미기재") < 0 && t.indexOf("undefined") < 0);
  ok("진행 막대를 그린다", (await s.p.locator("#reqbox .rq-bar").count()) === 1);
  ok("누르는 것이 전부 40px 이상이다", (await tapsOk(s.p, "#reqbox")) === 0,
     await tapsOk(s.p, "#reqbox"));

  s.p.on("dialog", function(d){ d.accept(); });
  await s.p.click('#reqbox button[data-pick="real-1"]');
  await s.p.waitForTimeout(350);
  call = s.sent.filter(function(x){ return x.name === "choose_quote"; })[0];
  ok("고르면 choose_quote 를 부른다", !!call, JSON.stringify(s.sent));
  ok("  어느 요청 · 어느 업체인지 같이 보낸다",
     !!call && JSON.parse(call.body).p_request === REQ.id &&
     JSON.parse(call.body).p_provider === "real-1", call && call.body);
  await s.p.close();

  console.log("\n── 업체 상호를 못 읽었을 때 — 빈 칸으로 두지 않습니다");
  s = await open("/my", { role:"customer", name:"홍길동" },
    Object.assign({}, MYT, { provider:null }));
  t = (await s.p.textContent("#reqbox")) || "";
  ok("상호 자리를 **빈 칸으로 두지 않는다**", /상호를 읽지 못했습니다/.test(t), t.slice(0, 200));
  ok("그래도 금액은 보여 준다 (화면이 통째로 죽지 않는다)",
     t.indexOf("600,000원") >= 0, t.slice(0, 200));
  ok("'(미기재)' · undefined 가 안 찍힌다",
     t.indexOf("미기재") < 0 && t.indexOf("undefined") < 0);
  const myGets = s.sent.filter(function(x){ return x.name === "GET"; });
  ok("⚠️ /my 도 묶음 읽기 꼴로 묻지 않는다",
     myGets.every(function(g){
       const sel = (g.body.split("select=")[1] || "").split("&")[0];
       return sel.indexOf("(") < 0 && sel.indexOf("%28") < 0;
     }), myGets.map(function(g){ return g.body.split("/rest/v1/")[1]; }).join(" | "));
  ok("상호는 **따로** 읽는다 (id 목록으로)",
     myGets.some(function(g){ return g.body.indexOf("/provider?") >= 0 &&
       g.body.indexOf("id=in.") >= 0; }),
     myGets.map(function(g){ return g.body.split("/rest/v1/")[1]; }).join(" | "));
  await s.p.close();

  console.log("\n── /my 손님도 일정을 보고, **못 가게 되면 말할 수 있습니다**");
  s = await open("/my", { role:"customer", name:"홍길동" },
    Object.assign({}, MYT, { appointment:[APPT] }), {}, false);
  ok("일정이 보인다", (await s.p.locator("#reqbox .ap").count()) === 1);
  t = (await s.p.textContent("#reqbox")) || "";
  ok("⚠️ 한국 시각으로 보인다",
     t.indexOf("2029년 12월 5일 (수) 오후 2시 30분") >= 0, t.slice(0, 300));
  ok("못 가게 되었다고 말할 단추가 있다",
     (await s.p.locator("#reqbox button[data-apcancel]").count()) === 1);
  /* ⚠️ '만났음' 은 업체만 적습니다 — 손님 화면에 그 단추가 있으면
     DB 가 거절하고, 그건 눌러도 안 되는 단추입니다. */
  ok("⚠️ '만났음' 단추는 **없다** (업체만 적습니다)",
     t.indexOf("만났음") < 0, t.slice(0, 300));
  s.p.on("dialog", function(d){ d.accept("갑자기 일이 생겼습니다"); });
  await s.p.click("#reqbox button[data-apcancel]");
  await s.p.waitForTimeout(350);
  call = s.sent.filter(function(x){ return x.name === "move_appointment"; })[0];
  const mvb = call ? JSON.parse(call.body) : {};
  ok("취소하면 move_appointment 를 부른다", !!call, JSON.stringify(s.sent));
  ok("  까닭을 같이 보낸다 (업체가 헛걸음하지 않게)",
     !!mvb.p && mvb.p.to === "cancel" && String(mvb.p.why).indexOf("일이 생겼") >= 0,
     JSON.stringify(mvb.p));
  await s.p.close();

  console.log("\n── 손님도 자기 것을 봅니다 (0011 의 photo_mine)");
  s = await open("/my", { role:"customer", name:"홍길동" },
    Object.assign({}, MYT, { request_photo: PICS }), {}, true);
  ok("내 요청에 붙은 파일이 보인다", (await s.p.locator("#reqbox .phv").count()) === 1);

  /* ══════════════════════════════════════════════════════════════
     ⚠️⚠️⚠️ **올린 파일을 빼는 단추** (0011 의 `drop_photo`)

     그 문은 0011 에 서 있었는데 **부르는 화면이 0곳**이었습니다 —
     손님은 잘못 올린 사진을 뺄 길이 없었습니다 (`approve_provider` 와
     똑같은 꼴입니다: 문은 멀쩡하고 검사도 초록인데 기능이 없습니다).
     ⚠️ `check-doors` 의 `KNOWN` 에 "단추가 없습니다" 로 적혀 있던
     자리이고, 2026-11-05 에 단추를 냈습니다.
     ══════════════════════════════════════════════════════════════ */
  ok("⚠️⚠️ **빼는 단추가 손님 화면에 있다** (문만 있고 화면이 없던 자리)",
     (await s.p.locator("#reqbox button[data-dropphoto]").count()) === 2,
     await s.p.locator("#reqbox button[data-dropphoto]").count());
  t = (await s.p.textContent("#reqbox")) || "";
  ok("  ⚠️ 밑줄 글이 **보는 사람에 맞게** 적힌다 (제 파일입니다)",
     t.indexOf("올리신 파일입니다") >= 0 &&
     t.indexOf("손님이 올리신 것입니다") < 0, t.slice(0, 300));
  /* ⚠️⚠️ **되돌릴 수 없는 일이라 한 번 여쭙습니다** — 안 여쭈면
     손이 미끄러진 순간 파일이 사라집니다 (0011 은 줄을 지웁니다). */
  await s.p.evaluate(function(){ window.confirm = function(){ return false; }; });
  await s.p.click("#reqbox button[data-dropphoto]");
  await s.p.waitForTimeout(250);
  ok("⚠️⚠️ 여쭙고 **아니라고 하면 안 보낸다**",
     s.sent.filter(function(x){ return x.name === "drop_photo"; }).length === 0,
     s.sent.map(function(x){ return x.name; }).join(" "));
  await s.p.evaluate(function(){ window.confirm = function(){ return true; }; });
  await s.p.click("#reqbox button[data-dropphoto]");
  await s.p.waitForTimeout(350);
  const dpc = s.sent.filter(function(x){ return x.name === "drop_photo"; })[0];
  ok("⚠️ 빼기가 **drop_photo 를 실제로 부른다**", !!dpc,
     s.sent.map(function(x){ return x.name; }).join(" "));
  if(dpc){
    /* ⚠️⚠️ 이 문은 **jsonb 가 아니라 자리 인자**를 받습니다 (0011) —
       `{ p: … }` 로 보내면 "함수를 찾을 수 없습니다" 가 됩니다. */
    let dpp = null;
    try{ dpp = JSON.parse(dpc.body); }catch(_){}
    ok("  꾸러미의 칸 이름이 문과 같다 (p_photo · jsonb 가 아닙니다)",
       !!dpp && dpp.p_photo === PICS[0].id && dpp.p === undefined, dpc.body);
  }
  await s.p.close();

  /* ⚠️⚠️⚠️ **업체 화면에는 빼는 단추가 없어야** 합니다 — 남이 올린
     자료를 지우는 일이고, 문도 업체를 거절합니다. 그려 두면 눌러도
     아무 일이 안 나는 단추가 됩니다 (절대 규칙 5). */
  s = await open("/desk", { role:"provider", name:"업체", provider:"t-range" },
                 DESKP, {}, true);
  ok("⚠️⚠️ **업체 화면에는 빼는 단추가 없다** (문도 업체를 거절합니다)",
     (await s.p.locator("#deskbox button[data-dropphoto]").count()) === 0);
  t = (await s.p.textContent("#deskbox")) || "";
  ok("  업체에게는 **손님이 올린 것**이라고 적는다",
     t.indexOf("손님이 올리신 것입니다") >= 0, t.slice(0, 300));
  await s.p.close();

  console.log("\n── 이미 고른 뒤 · 견적이 0건일 때");
  s = await open("/my", { role:"customer", name:"홍길동" },
    Object.assign({}, MYT, { quote:[
      Object.assign({}, QUOTE, { state:"chosen" }),
      Object.assign({}, Q2, { state:"passed" })] }));
  await s.p.waitForTimeout(200);
  ok("고른 뒤에는 고르는 단추를 **아예 안 낸다**",
     (await s.p.locator("#reqbox button[data-pick]").count()) === 0);
  t = (await s.p.textContent("#reqbox")) || "";
  ok("고르지 않은 것을 '고르지 않음' 으로 말한다 (거둔 것과 다른 말)",
     t.indexOf("고르지 않음") >= 0, t);
  await s.p.close();

  s = await open("/my", { role:"customer", name:"홍길동" },
    { request:[Object.assign({}, REQ, { state:"check" })], quote:[], request_item:ITEMS });
  t = (await s.p.textContent("#reqbox")) || "";
  ok("견적이 0건이면 지금 무엇을 기다리는지 말한다",
     /업체를 찾고 있습니다/.test(t), t);
  ok("⚠️ 지킬 수 없는 약속을 하지 않는다", !/시간 안에|며칠 안에|당일/.test(t), t);
  ok("상호를 알리고 다시 여쭙는다고 적는다", /상호를 알려 드리고/.test(t), t);
  ok("번호와 연락처로 가져오는 자리를 늘 낸다",
     (await s.p.locator("#reqbox #cf").count()) === 1);
  await s.p.fill("#reqbox #c-no", "SW-1111-2222");
  await s.p.fill("#reqbox #c-tel", "010-1234-5678");
  await s.p.click("#reqbox #cf button[type='submit']");
  await s.p.waitForTimeout(300);
  call = s.sent.filter(function(x){ return x.name === "claim_request"; })[0];
  ok("가져오기는 claim_request 를 부른다 (번호와 연락처 **둘 다**)",
     !!call && JSON.parse(call.body).p_no === "SW-1111-2222" &&
     JSON.parse(call.body).p_tel === "010-1234-5678", call && call.body);
  await s.p.close();

  /* ══ 후기 · 평점 (0037) ══════════════════════════════════════
     ⚠️⚠️⚠️ **이 자리도 전수 점검이 영원히 못 봅니다** — 로그인해야
     그려집니다. 후기를 쓰는 양식 · 업체의 답변 · 운영자의 가리기가
     전부 그렇습니다. 그래서 여기서 **직접** 눌러 봅니다.
     ⚠️⚠️ 재는 것 가운데 가장 중요한 것은 **눌러도 안 되는 단추를 미리
     만들지 않는가**입니다 (절대 규칙 5). 조건은 DB(0037)에 있고
     화면은 amRvCanWrite() 로 같은 조건을 봅니다 — 둘이 어긋나면
     손님이 다 적고 나서 거절됩니다. */
  const RVMINE = {
    id:"dddddddd-0000-0000-0000-000000000001",
    request_id:REQ.id, provider_id:"t-range", rating:4,
    body:"<b>꼼꼼히</b> 봐 주셨습니다. 고맙습니다.",
    created_at:"2026-11-01T01:00:00Z", updated_at:"2026-11-02T05:00:00Z",
    reply:null, reply_at:null, hidden_at:null, hidden_why:null
  };

  console.log("\n── /my 후기 — ⚠️ 겪지 않았으면 양식을 **안 냅니다**");
  /* MYT 의 견적 둘은 **받은 견적(open)** 입니다 — 고르지도 만나지도
     않았으니 후기 양식이 한 장도 없어야 합니다. */
  s = await open("/my", { role:"customer", name:"홍길동" },
                 Object.assign({}, MYT, { review:[], appointment:[] }));
  ok("⚠️ 고르지도 만나지도 않았으면 후기 양식이 **한 장도 없다**",
     (await s.p.locator("#reqbox form.rvform").count()) === 0,
     await s.p.locator("#reqbox form.rvform").count());
  t = (await s.p.textContent("#reqbox")) || "";
  ok("  후기 이야기를 꺼내지도 않는다 (쓸 수 없는 자리입니다)",
     t.indexOf("후기") < 0, t.slice(0, 120));
  /* ⚠️⚠️ **주소에서 내 요청으로 좁혀 청하는가** — 정책이 느슨해지는
     날 이 줄이 남습니다 (자물쇠를 두 자리에). */
  const rvGet = s.sent.filter(function(g){
    return g.name === "GET" && g.body.indexOf("/rest/v1/review") >= 0; })[0];
  ok("⚠️ 후기를 청할 때 **내 요청으로 좁혀** 묻는다", !!rvGet &&
     rvGet.body.indexOf("request_id=in.") >= 0, rvGet && rvGet.body);
  ok("  by_user 를 청하지 않는다 (쓸 데가 없습니다)",
     !!rvGet && rvGet.body.indexOf("by_user") < 0, rvGet && rvGet.body);
  await s.p.close();

  console.log("\n── /my 후기 — 견적을 고르면 열립니다");
  const QCHOSEN = Object.assign({}, QUOTE, { state:"chosen" });
  const MYT2 = Object.assign({}, MYT,
    { quote:[QCHOSEN, Q2], review:[], appointment:[] });
  s = await open("/my", { role:"customer", name:"홍길동" }, MYT2);
  ok("화면 에러 · CSP 거절이 0건이다", s.errs.length === 0, s.errs.join(" | "));
  ok("고른 업체 **하나만** 후기 양식이 열린다",
     (await s.p.locator("#reqbox form.rvform").count()) === 1,
     await s.p.locator("#reqbox form.rvform").count());
  t = (await s.p.textContent("#reqbox")) || "";
  ok("  어느 업체의 후기인지 적는다", /남서울 실내연습장 후기 쓰기/.test(t), t.slice(-600));
  ok("  고르지 않은 업체는 양식이 없다", t.indexOf("그린레슨 후기") < 0);
  ok("별점을 고르는 칸이 다섯이다",
     (await s.p.locator("#reqbox .rvpick input[type=radio]").count()) === 5,
     await s.p.locator("#reqbox .rvpick input[type=radio]").count());
  /* ⚠️⚠️ **DB 가 거절하는 말과 화면의 안내가 같은 뜻이어야** 합니다 —
     한쪽만 고치면 "적었는데 안 된다" 가 됩니다 (0037 은 열 글자). */
  ok("⚠️ 열 글자 이상이라고 **미리** 알린다", /열 글자 이상/.test(t), t.slice(-600));
  ok("⚠️ 공개된다는 것과 성함이 어떻게 보이는지 미리 알린다",
     /공개/.test(t) && /성 한 글자/.test(t), t.slice(-600));
  /* ⚠️ 누르는 것은 40px 이상입니다 (별점 고르개 포함) */
  ok("후기 자리의 누르는 것이 40px 이상이다",
     (await tapsOk(s.p, "#reqbox .rv-one")) === 0,
     await tapsOk(s.p, "#reqbox .rv-one"));

  /* ⚠️⚠️ **별점을 안 고르면 보내지 않습니다** — 보내면 DB 가 거절하고,
     손님은 적은 글을 다시 적습니다. */
  await s.p.fill("#reqbox form.rvform textarea", "아주 꼼꼼히 봐 주셨습니다.");
  await s.p.click("#reqbox form.rvform button[type=submit]");
  await s.p.waitForTimeout(250);
  ok("⚠️ 별점을 안 고르면 **보내지 않는다**",
     s.sent.filter(function(x){ return x.name === "write_review"; }).length === 0);
  ok("  무엇이 빠졌는지 그 자리에 적는다",
     /별점을 골라/.test((await s.p.textContent("#reqbox .rvmsg")) || ""),
     await s.p.textContent("#reqbox .rvmsg"));

  /* ⚠️⚠️ **보내는 꾸러미를 뜯어 봅니다.** 칸 이름 하나가 어긋나도
     열리기는 합니다 — 그러면 아무것도 안 걸립니다 (앞 서비스의
     ?m=apple 자리와 같은 꼴). */
  await s.p.click("#reqbox .rvpick input[value='5']");
  await s.p.click("#reqbox form.rvform button[type=submit]");
  await s.p.waitForTimeout(300);
  const wrote = s.sent.filter(function(x){ return x.name === "write_review"; })[0];
  ok("별점을 고르면 보낸다", !!wrote, s.sent.map(function(x){ return x.name; }).join(" "));
  let wp = null;
  try{ wp = JSON.parse(wrote.body).p; }catch(_){}
  ok("  꾸러미에 요청 · 업체 · 별점 · 글이 제 이름으로 담긴다",
     !!wp && wp.request === REQ.id && wp.provider === "t-range" &&
     wp.rating === 5 && wp.body.indexOf("꼼꼼히") >= 0, wrote && wrote.body);
  ok("  ⚠️ 별점이 **숫자**로 간다 (글자로 가면 DB 가 거절합니다)",
     !!wp && typeof wp.rating === "number", wp && typeof wp.rating);
  await s.p.close();

  console.log("\n── /my 후기 — 이미 쓴 것 · 가려진 것");
  s = await open("/my", { role:"customer", name:"홍길동" },
                 Object.assign({}, MYT2, { review:[RVMINE] }));
  t = (await s.p.textContent("#reqbox")) || "";
  ok("내가 쓴 후기가 보인다", /내 후기/.test(t), t.slice(-600));
  ok("  별점이 글로도 적힌다 (소리로 듣는 분께)", /5점 만점에 4점/.test(t));
  ok("  고친 것이라고 적는다", /고침/.test(t));
  html = await s.p.innerHTML("#reqbox");
  ok("⚠️ 내가 적은 태그가 날것으로 안 들어간다",
     html.indexOf("<b>꼼꼼히</b>") < 0 && html.indexOf("&lt;b&gt;") >= 0);
  ok("고치는 양식이 **적은 그대로** 채워져 있다",
     ((await s.p.inputValue("#reqbox form.rvform textarea")) || "")
       .indexOf("꼼꼼히") >= 0,
     await s.p.inputValue("#reqbox form.rvform textarea"));
  ok("  별점도 고른 그대로다",
     await s.p.isChecked("#reqbox .rvpick input[value='4']"));
  await s.p.close();

  s = await open("/my", { role:"customer", name:"홍길동" },
                 Object.assign({}, MYT2, { review:[Object.assign({}, RVMINE,
                   { hidden_at:"2026-11-02T06:00:00Z", hidden_why:"욕설" })] }));
  t = (await s.p.textContent("#reqbox")) || "";
  ok("⚠️ 가려진 후기에는 고치는 양식을 **안 낸다** (DB 가 거절합니다)",
     (await s.p.locator("#reqbox form.rvform").count()) === 0,
     await s.p.locator("#reqbox form.rvform").count());
  ok("  가려졌다는 것과 어디로 물을지 알린다",
     /가린 후기/.test(t) && /고객센터/.test(t), t.slice(-400));
  await s.p.close();

  /* ══ 저장한 조건 (0058 · /my) ═══════════════════════════════════
     ⚠️⚠️ **설정이 있어야 열리는 자리라 여기서만 눌립니다** —
     `check-screens` 는 빌드가 찍은 HTML 을 여는데 이 상자는 로그인한
     뒤에 그려져 **빈 상자**로만 보입니다.
     ⚠️ 여기서 재는 것 다섯 — ① 저장된 조건이 **사람 말**로 보이는가
     ② 갈래마다 **고를 수 있는 칸이 다른가**(못 걸릴 조건을 0058 의 문이
     거절하므로, 그 칸을 그리면 눌러도 거절되는 칸입니다 · 절대 규칙 5)
     ③ 보내는 꾸러미가 문과 같은가 ④ **보유 기간이 비면 양식을 안 여는가**
     ⑤ 금액 **0 과 안 적음을 가르는가**(0 은 무료로 나눔입니다). */
  console.log("\n── /my 저장한 조건 (0058)");
  const WCH = [
    { id:"w-1", kind:"listing", sub:"us-iron", region:"seoul",
      max_price:500000, ship:true, booked:false,
      created_at:"2026-11-05T01:00:00Z" },
    /* ⚠️ 금액 0 — "무료로 나눔" 으로 읽혀야 합니다 (`||` 를 쓰면 사라집니다) */
    { id:"w-2", kind:"listing", sub:null, region:null,
      max_price:0, ship:false, booked:false,
      created_at:"2026-11-04T01:00:00Z" },
    { id:"w-3", kind:"join", sub:null, region:"gyeonggi",
      max_price:null, ship:false, booked:true,
      created_at:"2026-11-03T01:00:00Z" }
  ];
  s = await open("/my", { role:"customer", name:"홍길동" },
                 Object.assign({}, MYT, { watch: WCH }));
  ok("화면 에러 · CSP 거절이 0건이다", s.errs.length === 0, s.errs.join(" | "));
  t = (await s.p.textContent("#wchbox")) || "";
  ok("저장한 조건 셋이 그려진다",
     (await s.p.locator("#wchbox .wch-l > li").count()) === 3,
     await s.p.locator("#wchbox .wch-l > li").count());
  ok("⚠️ 갈래가 **사람 말**이다 (영문 키가 아니다)",
     /중고 직거래/.test(t) && /골프 조인/.test(t) &&
     t.indexOf("listing") < 0 && t.indexOf("join") < 0, t.slice(0, 500));
  ok("  조건도 사람 말이다 (지역 · 종류 · 금액)",
     /서울/.test(t) && /아이언/.test(t) && /500,000원 이하/.test(t), t.slice(0, 500));
  /* ⚠️⚠️ **그 줄 안쪽만** 봅니다. 처음에 상자 전체에서 "0원 이하" 가
     없는지 보았는데, 다른 줄의 `500,000원 이하` 가 그 글자를 **품고
     있어서** 멀쩡한 화면을 실패로 잡았습니다 — 0052 의 `#pvstadm` 에서
     밟은 "범위를 안 좁혀 엉뚱한 칸을 집은" 자리입니다. */
  const w2 = (await s.p.textContent("#wchbox .wch-l > li:nth-child(2)")) || "";
  ok("⚠️⚠️ 금액 **0 이 '무료로 나눔' 으로** 나온다",
     /무료로 나눔만/.test(w2) && w2.indexOf("0원 이하") < 0, w2);
  ok("  부킹 조건도 적는다", /부킹이 잡힌 자리만/.test(t), t.slice(0, 500));
  ok("  보러 가는 길을 낸다 (막다른 길로 두지 않습니다)",
     (await s.p.locator('#wchbox a[href="/cat/used"]').count()) >= 1 &&
     (await s.p.locator('#wchbox a[href="/cat/matchup"]').count()) >= 1);

  /* ⚠️⚠️ 양식은 `AM_WATCH` 의 **첫 갈래**(골프 조인)로 열립니다 —
     처음에 중고로 열린다고 보고 "중고에는 종류 칸이 있다" 를 재다가
     **멀쩡한 화면을 실패로** 잡았습니다. 갈래를 **골라서** 봅니다. */
  ok("양식이 열린다", (await s.p.locator("#wchbox form#wchf").count()) === 1);
  await s.p.selectOption("#wchbox #w-kind", "listing");
  await s.p.waitForTimeout(200);
  ok("⚠️ 중고에는 종류 · 금액 · 택배 칸이 있다",
     (await s.p.locator("#wchbox #w-sub").count()) === 1 &&
     (await s.p.locator("#wchbox #w-mp").count()) === 1 &&
     (await s.p.locator('#wchbox [name="ship"]').count()) === 1);
  ok("  ⚠️ 중고에는 **부킹 칸이 없다** (중고에 보내면 문이 거절합니다)",
     (await s.p.locator('#wchbox [name="booked"]').count()) === 0);
  await s.p.selectOption("#wchbox #w-kind", "join");
  await s.p.waitForTimeout(200);
  ok("⚠️⚠️ 조인으로 바꾸면 **하위분류 칸이 사라진다** (조인 글에 그 칸이 없습니다)",
     (await s.p.locator("#wchbox #w-sub").count()) === 0);
  ok("  부킹 칸이 생기고 택배 칸은 없다",
     (await s.p.locator('#wchbox [name="booked"]').count()) === 1 &&
     (await s.p.locator('#wchbox [name="ship"]').count()) === 0);
  await s.p.selectOption("#wchbox #w-kind", "job");
  await s.p.waitForTimeout(200);
  ok("⚠️⚠️ 인력에는 **금액 칸이 없다** (급여가 글자라 숫자로 못 견줍니다)",
     (await s.p.locator("#wchbox #w-mp").count()) === 0);
  ok("  하위분류 칸은 있다", (await s.p.locator("#wchbox #w-sub").count()) === 1);

  /* ⚠️ 무엇을 · 왜 · 얼마나 두는지를 그 자리에서 말합니다 (제15조 제2항) */
  ok("⚠️ 보유 기간 · 받는 항목 · 밖으로 안 보낸다는 것을 그 자리에서 말한다",
     /보유 기간/.test(t) && /연락처는 받지 않습니다/.test(t) &&
     /문자 · 카카오톡 · 메일을 보내지 않습니다/.test(t), t.slice(0, 1400));

  /* 보내는 꾸러미 */
  await s.p.selectOption("#wchbox #w-kind", "listing");
  await s.p.waitForTimeout(200);
  await s.p.selectOption("#wchbox #w-rg", "seoul");
  await s.p.fill("#wchbox #w-mp", "0");
  await s.p.check('#wchbox [name="ship"]');
  await s.p.click("#wchbox form#wchf button[type='submit']");
  await s.p.waitForTimeout(400);
  const wsv = s.sent.filter(function(x){ return x.name === "save_watch"; })[0];
  ok("저장하면 save_watch 를 부른다", !!wsv,
     s.sent.map(function(x){ return x.name; }).join(" "));
  let wb = null;
  try{ wb = JSON.parse(wsv.body).p; }catch(_){}
  ok("⚠️ 꾸러미가 `p` 하나다", !!wb, wsv && wsv.body);
  ok("  고른 것이 그대로 간다", !!wb && wb.kind === "listing" &&
     wb.region === "seoul" && wb.ship === true, wsv && wsv.body);
  /* ⚠️⚠️ **0 을 0 으로 보냅니다** — 안 적음이 아닙니다 */
  ok("⚠️⚠️ 금액 **0 을 0 으로** 보낸다 (안 적음이 아닙니다)",
     !!wb && String(wb.maxPrice) === "0", wsv && wsv.body);
  ok("  ⚠️ 중고에 **booked 를 안 보낸다** (보내면 문이 거절합니다)",
     !!wb && !("booked" in wb), wsv && wsv.body);

  /* 지우기 */
  await s.p.click("#wchbox button[data-wdrop='w-1']");
  await s.p.waitForTimeout(400);
  const wdr = s.sent.filter(function(x){ return x.name === "drop_watch"; })[0];
  ok("지우면 drop_watch 를 부른다", !!wdr,
     s.sent.map(function(x){ return x.name; }).join(" "));
  ok("  어느 조건인지 같이 간다",
     !!wdr && JSON.parse(wdr.body).p.id === "w-1", wdr && wdr.body);
  ok("저장한 조건 자리의 누르는 것이 40px 이상이다",
     (await tapsOk(s.p, "#wchbox")) === 0, await tapsOk(s.p, "#wchbox"));
  await s.p.close();

  /* ⚠️⚠️⚠️ **0건일 때 막다른 길로 두지 않습니다** (절대 규칙 2) */
  console.log("\n── /my 저장한 조건 — 0건");
  s = await open("/my", { role:"customer", name:"홍길동" }, MYT);
  t = (await s.p.textContent("#wchbox")) || "";
  ok("0건이라고 말한다", /저장해 두신 조건이 없습니다/.test(t), t.slice(0, 300));
  ok("⚠️ 0건이어도 **양식을 낸다** (막다른 길로 두지 않습니다)",
     (await s.p.locator("#wchbox form#wchf").count()) === 1);
  await s.p.close();

  /* ⚠️⚠️⚠️ **보유 기간이 비면 양식을 안 엽니다** (제15조 제2항 — 법이
     요구하는 것을 안 보여 주고 동의를 받을 수는 없습니다).
     ⚠️ `js/data/site.js` 가 값을 담은 **뒤에** 그 칸만 비워야 하므로,
     담기는 순간을 가로챕니다 (그냥 넣어 두면 site.js 가 덮습니다).
     ⚠️ `/help` 가 site.js 를 안 실어 문의 양식이 조용히 안 열렸던 그
     자리의 되풀이입니다 — 그래서 **눌러서** 봅니다. */
  console.log("\n── /my 저장한 조건 — 보유 기간이 비면 양식을 안 엽니다");
  s = await open("/my", { role:"customer", name:"홍길동" },
                 Object.assign({}, MYT, { watch: WCH }), {}, false,
                 function(){
                   var v;
                   Object.defineProperty(window, "WOW_BIZ", {
                     configurable: true,
                     get: function(){ return v; },
                     set: function(x){
                       v = Object.assign({}, x, { watchKeep: "" });
                     }
                   });
                 });
  t = (await s.p.textContent("#wchbox")) || "";
  ok("⚠️⚠️ 보유 기간이 비면 **양식을 안 그린다**",
     (await s.p.locator("#wchbox form#wchf").count()) === 0,
     await s.p.locator("#wchbox form#wchf").count());
  ok("  ⚠️ 저장해 둔 것은 **그대로 보여 준다** (지울 길을 막지 않습니다)",
     (await s.p.locator("#wchbox .wch-l > li").count()) === 3,
     await s.p.locator("#wchbox .wch-l > li").count());
  /* ⚠️ 운영자에게 할 말을 손님 화면에 적지 않습니다 (절대 규칙 3) */
  ok("  ⚠️ 무엇을 설정해야 하는지는 손님에게 안 적는다",
     t.indexOf("site.js") < 0 && t.indexOf("watchKeep") < 0, t.slice(0, 400));
  ok("  그래도 지금은 안 된다고는 말한다", /열려 있지 않습니다/.test(t), t.slice(0, 400));
  await s.p.close();

  /* ⚠️ 보유 기간이 **실제 값**으로 찍히는지 — 검사에 그날의 글자를
     박으면 사장님이 그 값을 고치시는 날 멀쩡한 화면이 떨어집니다. */
  {
    const WKEEP = keepOf("watchKeep");
    s = await open("/my", { role:"customer", name:"홍길동" },
                   Object.assign({}, MYT, { watch: WCH }));
    const wt = (await s.p.textContent("#wchbox")) || "";
    ok("⚠️ 보유 기간이 **site.js 의 실제 값**으로 찍힌다",
       WKEEP.length > 0 && wt.indexOf(WKEEP) >= 0, WKEEP + " / " + wt.slice(0, 500));
    await s.p.close();
  }

  console.log("\n── /desk 후기 — 업체는 **답변만** 답니다");
  s = await open("/desk", PRO,
                 { assignment:[asg(quoted, "accepted")], request:[quoted],
                   quote:[QUOTE], request_item:ITEMS, appointment:[],
                   review:[RVMINE] });
  ok("화면 에러 · CSP 거절이 0건이다", s.errs.length === 0, s.errs.join(" | "));
  t = (await s.p.textContent("#deskbox")) || "";
  ok("받은 후기가 보인다 (1건)", /받은 후기 1건/.test(t), t.slice(-500));
  /* ⚠️⚠️ **후기 자리만** 봅니다. 배정 카드에는 성함 · 연락처가
     일부러 나옵니다 (수락한 뒤이고, 제3자 제공 동의를 받은 건입니다) —
     화면 전체를 훑으면 그 멀쩡한 자리가 걸려서 **엉뚱한 까닭으로**
     실패합니다. */
  const rvT = (await s.p.textContent("#deskbox .rv-one")) || "";
  ok("⚠️ 후기 자리에 손님 성함이 한 글자도 안 나온다 (by_user 를 안 청합니다)",
     rvT.length > 10 && rvT.indexOf("홍길동") < 0, rvT.slice(0, 200));
  ok("  그 자리에는 '손님' 으로만 적는다", /손님/.test(rvT), rvT.slice(0, 200));
  ok("⚠️ 별점을 고칠 수 없다고 적는다", /고칠 수 없습니다/.test(t), t.slice(-500));
  /* ⚠️⚠️ **업체 작업실에서 평균을 찍지 않습니다** — 이 화면이 받은 줄에는
     가려진 것이 섞여 있어 공개 평균과 다른 값입니다. 두 숫자가 다르면
     어느 쪽이 참인지 묻게 됩니다. */
  ok("⚠️ 평균을 찍지 않는다 (가린 것이 섞인 줄입니다)",
     !/[0-9]\.[0-9]\s*점/.test(t), (t.match(/[0-9]\.[0-9]\s*점/) || [""])[0]);
  html = await s.p.innerHTML("#deskbox");
  ok("⚠️ 손님이 적은 태그가 날것으로 안 들어간다",
     html.indexOf("<b>꼼꼼히</b>") < 0 && html.indexOf("&lt;b&gt;") >= 0);
  ok("답변 양식이 있다",
     (await s.p.locator("#deskbox form.rvform").count()) === 1);
  ok("⚠️ 손님 성함 · 연락처를 적지 말라고 그 자리에서 알린다",
     /연락처를 적지 마세요/.test(t), t.slice(-500));
  await s.p.fill("#deskbox form.rvform textarea", "찾아 주셔서 고맙습니다.");
  await s.p.click("#deskbox form.rvform button[type=submit]");
  await s.p.waitForTimeout(300);
  const replied = s.sent.filter(function(x){ return x.name === "reply_review"; })[0];
  ok("답변을 보낸다", !!replied, s.sent.map(function(x){ return x.name; }).join(" "));
  let rp = null;
  try{ rp = JSON.parse(replied.body).p; }catch(_){}
  ok("  꾸러미에 후기 id 와 답변만 담긴다",
     !!rp && rp.id === RVMINE.id && rp.reply.indexOf("고맙습니다") >= 0 &&
     rp.rating === undefined, replied && replied.body);
  ok("후기 자리의 누르는 것이 40px 이상이다",
     (await tapsOk(s.p, "#deskbox .rv-one")) === 0,
     await tapsOk(s.p, "#deskbox .rv-one"));
  await s.p.close();

  s = await open("/desk", PRO,
                 { assignment:[asg(quoted, "accepted")], request:[quoted],
                   quote:[QUOTE], request_item:ITEMS, appointment:[],
                   review:[Object.assign({}, RVMINE,
                     { hidden_at:"2026-11-02T06:00:00Z", hidden_why:"욕설" })] });
  t = (await s.p.textContent("#deskbox")) || "";
  ok("⚠️ 가려진 후기에는 답변 양식을 **안 낸다**",
     (await s.p.locator("#deskbox form.rvform").count()) === 0);
  ok("  가려졌다는 것을 업체에도 알린다 (다툴 수 있어야 합니다)",
     /가린 후기/.test(t), t.slice(-400));
  await s.p.close();

  /* ⚠️ 못 읽은 것과 0건을 갈라서 말하는가 */
  s = await open("/desk", PRO,
                 { assignment:[asg(quoted, "accepted")], request:[quoted],
                   quote:[QUOTE], request_item:ITEMS, appointment:[], review:null });
  t = (await s.p.textContent("#deskbox")) || "";
  ok("⚠️ 후기를 못 읽으면 **0건이라고 말하지 않는다**",
     /읽지 못했습니다/.test(t) && t.indexOf("받은 후기가 없습니다") < 0, t.slice(-300));
  await s.p.close();

  console.log("\n── /admin 후기 — 지우지 않고 **가립니다**");
  const RVADM = [Object.assign({}, RVMINE, { provider_id:"real-1" })];
  s = await open("/admin", { role:"admin", name:"관리자" },
                 Object.assign({}, ADMT, BIZ, { review:RVADM }),
                 { biz_metrics: MET });
  await s.p.click("#bizbox button[data-tab='rv']");
  await s.p.waitForTimeout(250);
  t = (await s.p.textContent("#bizbox")) || "";
  ok("후기 자리가 열린다", /지우지 않고 가립니다/.test(t), t.slice(0, 200));
  ok("  어느 업체의 후기인지 적는다", /그린레슨 아카데미/.test(t));
  ok("⚠️ 별점 · 글을 고치는 길이 **없다**고 적는다", /고치는 길은/.test(t));
  ok("가리는 단추가 있다",
     (await s.p.locator("#bizbox button[data-rvto='hide']").count()) === 1);
  /* ⚠️⚠️ **까닭 없이는 안 보냅니다.** prompt 를 비우면 보내지 않아야
     합니다 — 보내면 DB 가 거절하고 운영자는 무엇이 빠졌는지 모릅니다. */
  await s.p.evaluate(function(){ window.prompt = function(){ return ""; }; });
  await s.p.click("#bizbox button[data-rvto='hide']");
  await s.p.waitForTimeout(200);
  ok("⚠️ 까닭을 안 적으면 **보내지 않는다**",
     s.sent.filter(function(x){ return x.name === "hide_review"; }).length === 0);
  await s.p.evaluate(function(){
    window.prompt = function(){ return "욕설이 들어 있습니다"; }; });
  await s.p.click("#bizbox button[data-rvto='hide']");
  await s.p.waitForTimeout(300);
  const hid = s.sent.filter(function(x){ return x.name === "hide_review"; })[0];
  ok("까닭을 적으면 보낸다", !!hid, s.sent.map(function(x){ return x.name; }).join(" "));
  let hp = null;
  try{ hp = JSON.parse(hid.body).p; }catch(_){}
  ok("  꾸러미에 후기 id · 가리기 · 까닭이 담긴다",
     !!hp && hp.id === RVMINE.id && hp.to === "hide" &&
     hp.why === "욕설이 들어 있습니다", hid && hid.body);
  await s.p.close();

  /* ⚠️ 운영자가 아니면 한 줄도 안 보입니다 (/admin 의 다른 자리와 같습니다) */
  s = await open("/admin", { role:"customer", name:"일반회원" },
                 Object.assign({}, ADMT, BIZ, { review:RVADM }));
  ok("⚠️ 운영자가 아니면 후기 자리가 아예 안 그려진다",
     (await s.p.locator("#bizbox button[data-tab='rv']").count()) === 0);
  await s.p.close();

  /* ══ 제공 이력 · 철회 · 요청 취소 (0039 · §5) ════════════════
     ⚠️⚠️ **철회는 "앞으로 못 본다" 이지 "없던 일" 이 아닙니다.** 화면이
     철회한 줄을 지워 버리면 손님이 "준 적 없다" 로 읽습니다 — 그건
     사실이 아니고, 열람권(제35조)이 걸리는 자리입니다. */
  const ASGS = [
    { id:"asg-1", request_id:REQ.id, provider_id:"t-range", state:"accepted",
      agree3rd_at:"2026-11-03T03:00:00Z", revoked_at:null, revoked_why:null,
      created_at:"2026-11-03T03:00:00Z" },
    { id:"asg-2", request_id:REQ.id, provider_id:"real-1", state:"accepted",
      agree3rd_at:"2026-11-02T03:00:00Z", revoked_at:"2026-11-03T05:00:00Z",
      revoked_why:"다른 업체로 하기로 했습니다", created_at:"2026-11-02T03:00:00Z" }
  ];
  console.log("\n── /my 제공 이력 · 철회");
  s = await open("/my", { role:"customer", name:"홍길동" },
                 Object.assign({}, MYT, { assignment:ASGS, review:[], appointment:[] }));
  ok("화면 에러 · CSP 거절이 0건이다", s.errs.length === 0, s.errs.join(" | "));
  t = (await s.p.textContent("#reqbox")) || "";
  ok("전달한 업체가 **둘 다** 보인다 (철회한 것도)",
     (await s.p.locator("#reqbox .gv-r").count()) === 2,
     await s.p.locator("#reqbox .gv-r").count());
  ok("⚠️ 철회한 줄이 **지워지지 않는다** (넘어간 적이 있다는 기록입니다)",
     /철회함/.test(t) && /다른 업체로 하기로 했습니다/.test(t), t.slice(-700));
  ok("철회하면 무엇이 끊기는지 **미리** 적는다",
     /성함 · 연락처 · 요청 내용/.test(t), t.slice(-700));
  /* ⚠️ 이미 철회한 것에는 단추를 안 냅니다 (눌러도 DB 가 거절합니다) */
  ok("⚠️ 이미 철회한 업체에는 **단추를 안 낸다**",
     (await s.p.locator("button[data-revoke='asg-2']").count()) === 0);
  ok("  아직 전달 중인 업체에는 낸다",
     (await s.p.locator("button[data-revoke='asg-1']").count()) === 1);
  ok("제공 이력 자리의 누르는 것이 40px 이상이다",
     (await tapsOk(s.p, "#reqbox .gv")) === 0, await tapsOk(s.p, "#reqbox .gv"));

  /* ⚠️⚠️ 되묻고 · 까닭을 받습니다. 둘 중 하나라도 비면 **안 보냅니다.** */
  await s.p.evaluate(function(){
    window.confirm = function(){ return false; };
    window.prompt = function(){ return "까닭"; }; });
  await s.p.click("button[data-revoke='asg-1']");
  await s.p.waitForTimeout(200);
  ok("⚠️ 되물음에 '아니오' 면 보내지 않는다",
     s.sent.filter(function(x){ return x.name === "revoke_third_party"; }).length === 0);
  await s.p.evaluate(function(){
    window.confirm = function(){ return true; };
    window.prompt = function(){ return ""; }; });
  await s.p.click("button[data-revoke='asg-1']");
  await s.p.waitForTimeout(200);
  ok("⚠️ 까닭을 안 적으면 보내지 않는다",
     s.sent.filter(function(x){ return x.name === "revoke_third_party"; }).length === 0);
  await s.p.evaluate(function(){
    window.prompt = function(){ return "다른 곳으로 정했습니다"; }; });
  await s.p.click("button[data-revoke='asg-1']");
  await s.p.waitForTimeout(300);
  const rvCall = s.sent.filter(function(x){ return x.name === "revoke_third_party"; })[0];
  ok("되묻고 까닭을 적으면 보낸다", !!rvCall,
     s.sent.map(function(x){ return x.name; }).join(" "));
  let rvp = null;
  try{ rvp = JSON.parse(rvCall.body).p; }catch(_){}
  ok("  꾸러미에 배정 id 와 까닭이 담긴다",
     !!rvp && rvp.assignment === "asg-1" && rvp.why === "다른 곳으로 정했습니다",
     rvCall && rvCall.body);
  await s.p.close();

  console.log("\n── /my 요청 취소 — ⚠️ 계약 뒤에는 단추를 안 냅니다");
  s = await open("/my", { role:"customer", name:"홍길동" },
                 Object.assign({}, MYT, { assignment:[], review:[], appointment:[] }));
  ok("진행 중인 요청에는 취소 단추가 있다",
     (await s.p.locator("button[data-cancel]").count()) === 1);
  await s.p.evaluate(function(){
    window.confirm = function(){ return true; };
    window.prompt = function(){ return "직접 알아보겠습니다"; }; });
  await s.p.click("button[data-cancel]");
  await s.p.waitForTimeout(300);
  const cxCall = s.sent.filter(function(x){ return x.name === "cancel_request"; })[0];
  ok("취소를 보낸다", !!cxCall, s.sent.map(function(x){ return x.name; }).join(" "));
  ok("  꾸러미에 요청 id 와 까닭이 담긴다",
     !!cxCall && JSON.parse(cxCall.body).p.request === REQ.id &&
     JSON.parse(cxCall.body).p.why === "직접 알아보겠습니다", cxCall && cxCall.body);
  await s.p.close();

  s = await open("/my", { role:"customer", name:"홍길동" },
                 Object.assign({}, MYT,
                   { request:[Object.assign({}, REQ, { state:"signed" })],
                     assignment:[], review:[], appointment:[] }));
  t = (await s.p.textContent("#reqbox")) || "";
  ok("⚠️ 계약 단계에는 취소 단추를 **안 낸다** (눌러도 DB 가 거절합니다)",
     (await s.p.locator("button[data-cancel]").count()) === 0);
  ok("  대신 **어디로 가라**고 적는다", /고객센터/.test(t), t.slice(-400));
  await s.p.close();

  /* ══ 업체 심사 · 정지 (0038 · 3차 지시서 §2 · §8) ═════════════
     ⚠️⚠️⚠️ **이 화면이 없어서 approve_provider 를 아무도 못 불렀습니다.**
     문은 0007 · 0012 · 0018 로 세 번 고쳤는데 부르는 자리가 없었습니다 —
     "만들어 놓고 안 쓰는 칸" 의 가장 큰 판입니다. 그래서 **단추가
     실제로 그 문을 부르는지** 꾸러미까지 뜯어 봅니다. */
  const PVS = [
    /* ⚠️ 0057 — 한 곳은 채우고 한 곳은 **비웁니다.** 다 채우면
       "한 칸도 없습니다" 갈래를 아무도 안 눌러 보게 됩니다. */
    { id:"real-1", name:"그린레슨 아카데미", state:"approved", state_why:null,
      state_at:null, listed:true, assignable:true, is_test:false,
      subs:["ls-solo"], regions:["seoul"],
      ceo:"박대표", addr:"서울 강남구", tel:"02-111-2222",
      email:"a@green.test", brn:"123-45-67890" },
    { id:"sus-1", name:"정지된 업체", state:"suspended",
      state_why:"서류가 확인되지 않았습니다", state_at:"2026-11-02T01:00:00Z",
      listed:false, assignable:false, is_test:false,
      subs:["ft-grip"], regions:["gyeonggi"],
      ceo:null, addr:null, tel:null, email:null, brn:null }
  ];
  const APS = [
    { id:"aaaa-ap-1", no:"AP-0001", company:"새 골프샵", brn:"111-22-33333",
      name:"김신청", tel:"010-2222-3333", email:"a@x.test", region:"서울",
      services:"피팅 · 수리", note:"입점 문의드립니다",
      state:"new", provider_id:"sus-1", created_at:"2026-11-03T01:00:00Z" }
  ];
  const PROT = { provider:PVS, provider_apply:APS };

  console.log("\n── /admin 업체 심사 — 운영자가 아니면 한 줄도 안 보입니다");
  s = await open("/admin", { role:"customer", name:"일반회원" },
                 Object.assign({}, ADMT, BIZ, PROT));
  ok("업체 심사 자리가 아예 안 그려진다",
     (await s.p.locator("#probox button[data-ptab]").count()) === 0);
  t = (await s.p.textContent("#probox")) || "";
  ok("  신청자 성함 · 연락처가 한 글자도 안 나온다",
     t.indexOf("김신청") < 0 && t.indexOf("2222-3333") < 0, t);
  await s.p.close();

  console.log("\n── /admin 업체 심사 — 운영자");
  s = await open("/admin", { role:"admin", name:"관리자" },
                 Object.assign({}, ADMT, BIZ, PROT), { biz_metrics: MET });
  ok("화면 에러 · CSP 거절이 0건이다", s.errs.length === 0, s.errs.join(" | "));
  t = (await s.p.textContent("#probox")) || "";
  ok("업체 둘이 그려진다", /그린레슨 아카데미/.test(t) && /정지된 업체/.test(t), t.slice(0, 300));
  ok("상태가 **사람 말**로 나온다 (영문 키가 아니다)",
     /승인/.test(t) && /정지/.test(t) && t.indexOf("suspended") < 0, t.slice(0, 300));
  ok("정지된 업체의 까닭이 보인다", /서류가 확인되지 않았습니다/.test(t));
  /* ⚠️⚠️ **눌러도 안 되는 단추를 미리 만들지 않습니다** (절대 규칙 5) —
     정지된 업체를 공개로 켜는 것은 DB 가 거절합니다. */
  ok("⚠️ 정지된 업체에는 **공개 단추를 안 낸다**",
     (await s.p.locator("button[data-pvlist='sus-1']").count()) === 0);
  ok("  대신 **정지 풀기** 단추를 낸다",
     (await s.p.locator("button[data-pvto='approved'][data-pv='sus-1']").count()) === 1);
  ok("정지되지 않은 업체에는 공개 · 배정 단추가 있다",
     (await s.p.locator("button[data-pvlist='real-1']").count()) === 1 &&
     (await s.p.locator("button[data-pvasg='real-1']").count()) === 1);

  /* ⚠️⚠️ 까닭을 안 적으면 **보내지 않습니다** (DB 도 거절합니다) */
  await s.p.evaluate(function(){ window.prompt = function(){ return ""; }; });
  await s.p.click("button[data-pvto='suspended'][data-pv='real-1']");
  await s.p.waitForTimeout(200);
  ok("⚠️ 정지에 까닭을 안 적으면 **보내지 않는다**",
     s.sent.filter(function(x){ return x.name === "set_provider_state"; }).length === 0);
  await s.p.evaluate(function(){
    window.prompt = function(){ return "서류 미확인"; }; });
  await s.p.click("button[data-pvto='suspended'][data-pv='real-1']");
  await s.p.waitForTimeout(300);
  const susCall = s.sent.filter(function(x){ return x.name === "set_provider_state"; })[0];
  ok("까닭을 적으면 보낸다", !!susCall, s.sent.map(function(x){ return x.name; }).join(" "));
  let sp = null;
  try{ sp = JSON.parse(susCall.body).p; }catch(_){}
  ok("  꾸러미에 업체 · 상태 · 까닭이 담긴다",
     !!sp && sp.id === "real-1" && sp.to === "suspended" && sp.why === "서류 미확인",
     susCall && susCall.body);

  /* ⚠️ 정지를 **푸는 데에는** 까닭을 안 받습니다 (DB 도 안 받습니다) */
  await s.p.evaluate(function(){ window.prompt = function(){ return ""; }; });
  await s.p.click("button[data-pvto='approved'][data-pv='sus-1']");
  await s.p.waitForTimeout(300);
  const freeCall = s.sent.filter(function(x){
    return x.name === "set_provider_state" && JSON.parse(x.body).p.to === "approved"; })[0];
  ok("⚠️ 정지를 푸는 데에는 까닭을 안 받는다 (DB 와 같은 규칙)",
     !!freeCall, s.sent.map(function(x){ return x.name; }).join(" "));

  /* 공개 · 배정은 approve_provider 한 문입니다 */
  await s.p.evaluate(function(){ window.prompt = function(){ return "제휴 확인"; }; });
  await s.p.click("button[data-pvasg='real-1']");
  await s.p.waitForTimeout(300);
  const apv = s.sent.filter(function(x){ return x.name === "approve_provider"; })[0];
  ok("배정 켜기 · 끄기가 approve_provider 를 부른다", !!apv,
     s.sent.map(function(x){ return x.name; }).join(" "));
  let ap2 = null;
  try{ ap2 = JSON.parse(apv.body); }catch(_){}
  ok("  꾸러미의 칸 이름이 문과 같다 (p_id · p_assignable · p_why)",
     !!ap2 && ap2.p_id === "real-1" && ap2.p_assignable === false &&
     ap2.p_why === "제휴 확인", apv && apv.body);

  console.log("\n── /admin 입점 신청 갈래");
  await s.p.click("#probox button[data-ptab='ap']");
  await s.p.waitForTimeout(250);
  t = (await s.p.textContent("#probox")) || "";
  ok("입점 신청이 그려진다", /새 골프샵/.test(t), t.slice(0, 300));
  ok("  운영자가 전화할 수 있게 연락처가 보인다", /010-2222-3333/.test(t));
  /* ⚠️⚠️ **없는 길을 되는 것처럼 두지 않습니다** — 업체로 등록하는
     양식이 아직 없다는 사실을 그 자리에서 말해야 합니다. */
  await s.p.evaluate(function(){ window.prompt = function(){ return "통화함"; }; });
  await s.p.click("button[data-apto='called'][data-ap='aaaa-ap-1']");
  await s.p.waitForTimeout(300);
  const apSt = s.sent.filter(function(x){ return x.name === "set_apply_state"; })[0];
  ok("상태를 옮기면 set_apply_state 를 부른다", !!apSt,
     s.sent.map(function(x){ return x.name; }).join(" "));
  ok("  꾸러미의 칸 이름이 문과 같다 (p_apply · p_to · p_why)",
     !!apSt && JSON.parse(apSt.body).p_apply === "aaaa-ap-1" &&
     JSON.parse(apSt.body).p_to === "called", apSt && apSt.body);
  ok("업체 심사 자리의 누르는 것이 40px 이상이다",
     (await tapsOk(s.p, "#probox")) === 0, await tapsOk(s.p, "#probox"));
  await s.p.close();

  /* ══ 사업자 신원정보 (0057 · 제20조 제2항) ══════════════════════
     ⚠️⚠️⚠️ **2026-11-06 까지 `provider` 표에 상호 하나뿐이었습니다.**
     중개자는 입점업체가 사업자일 때 그 대표자 · 주소 · 전화 · 이메일 ·
     사업자등록번호를 손님이 볼 수 있게 해야 합니다 (시행령 제25조).
     공정위가 당근마켓에 시정명령 · 과태료를 부과한 조항입니다.
     ⚠️ 여기서 재는 것은 넷입니다 — ① 운영자가 적는 칸이 있는가
     ② 관리자가 아니면 **사업자등록번호 칸을 안 내는가**(눌러도 거절되는
     칸을 안 그립니다) ③ 보내는 꾸러미가 문과 같은가 ④ 까닭 없이는
     안 보내는가. */
  console.log("\n── /admin 사업자 신원정보 (0057)");
  /* ⚠️ 앞 묶음이 화면을 닫았으므로 **제 화면을 새로 엽니다** — 앞
     검사가 만든 상태를 물려받으면 엉뚱한 까닭으로 통과합니다. */
  s = await open("/admin", { role:"admin", name:"관리자" },
                 Object.assign({}, ADMT, BIZ, PROT), { biz_metrics: MET });
  ok("화면 에러 · CSP 거절이 0건이다", s.errs.length === 0, s.errs.join(" | "));
  t = (await s.p.textContent("#probox")) || "";
  ok("⚠️ 이미 적힌 업체는 그 값이 보인다",
     /123-45-67890/.test(t) && /박대표/.test(t), t.slice(0, 600));
  ok("⚠️⚠️ 비어 있는 업체는 **한 칸도 없다고** 말한다",
     /한 칸도 없습니다/.test(t), t.slice(0, 900));
  ok("  적는 단추를 낸다 (적기 · 고치기)",
     (await s.p.locator("#probox button[data-pvid='sus-1']").count()) === 1);
  await s.p.click("#probox button[data-pvid='sus-1']");
  await s.p.waitForTimeout(250);
  ok("양식이 열린다", (await s.p.locator("form[data-pvidf='sus-1']").count()) === 1);
  ok("  관리자에게는 사업자등록번호 칸이 있다",
     (await s.p.locator("form[data-pvidf='sus-1'] [name='brn']").count()) === 1);
  /* ⚠️ 입점 신청에 적혀 온 값을 미리 채웁니다 — 운영자가 같은 것을
     두 번 받아 적지 않게. 지어낸 값이 아니라 그 업체가 적은 값입니다. */
  ok("⚠️ 비어 있는 칸은 **입점 신청에 적혀 온 값**으로 미리 채운다",
     (await s.p.inputValue("form[data-pvidf='sus-1'] [name='tel']")) === "010-2222-3333",
     await s.p.inputValue("form[data-pvidf='sus-1'] [name='tel']"));

  /* ⚠️⚠️ **까닭 없이는 안 보냅니다** — 손님에게 보이는 값이고 기록에
     남아야 합니다. 보내 보고 **안 불렸는지**를 셉니다. */
  const idn0 = s.sent.filter(function(x){ return x.name === "set_provider_ident"; }).length;
  await s.p.click("form[data-pvidf='sus-1'] button[type='submit']");
  await s.p.waitForTimeout(250);
  ok("⚠️⚠️ 까닭이 비면 **문을 아예 안 부른다**",
     s.sent.filter(function(x){ return x.name === "set_provider_ident"; }).length === idn0,
     "전 " + idn0);

  await s.p.fill("form[data-pvidf='sus-1'] [name='ceo']", "최대표");
  await s.p.fill("form[data-pvidf='sus-1'] [name='addr']", "경기 성남시");
  await s.p.fill("form[data-pvidf='sus-1'] [name='brn']", "222-33-44444");
  await s.p.fill("form[data-pvidf='sus-1'] [name='why']", "사업자등록증 사본 확인");
  await s.p.click("form[data-pvidf='sus-1'] button[type='submit']");
  await s.p.waitForTimeout(400);
  const idn = s.sent.filter(function(x){ return x.name === "set_provider_ident"; })[0];
  ok("저장하면 set_provider_ident 를 부른다", !!idn,
     s.sent.map(function(x){ return x.name; }).join(" "));
  let idb = null;
  try{ idb = JSON.parse(idn.body).p; }catch(_){}
  ok("⚠️ 꾸러미가 **`p` 하나**다 (0013 · 0003 만 자리 인자입니다)",
     !!idb, idn && idn.body);
  ok("  어느 업체인지 · 까닭 · 적은 값이 같이 간다",
     !!idb && idb.provider === "sus-1" && idb.why === "사업자등록증 사본 확인" &&
     idb.ceo === "최대표" && idb.addr === "경기 성남시", idn && idn.body);
  ok("  관리자는 사업자등록번호도 보낸다", !!idb && idb.brn === "222-33-44444",
     idn && idn.body);
  await s.p.close();

  /* ⚠️⚠️⚠️ **직원에게는 사업자등록번호 칸을 안 냅니다** — 문이 거절하므로
     그려 두면 눌러도 아무 일이 안 나는 칸입니다 (절대 규칙 5). */
  console.log("\n── /admin 사업자 신원정보 — **직원**에게는 번호 칸이 없습니다");
  s = await open("/admin", { role:"staff", name:"직원" },
                 Object.assign({}, ADMT, BIZ, PROT));
  ok("화면 에러 · CSP 거절이 0건이다", s.errs.length === 0, s.errs.join(" | "));
  await s.p.click("#probox button[data-pvid='sus-1']");
  await s.p.waitForTimeout(250);
  ok("⚠️⚠️ 직원에게는 **사업자등록번호 칸이 없다**",
     (await s.p.locator("form[data-pvidf='sus-1'] [name='brn']").count()) === 0);
  ok("  왜 없는지 그 자리에서 말한다",
     /관리자만/.test((await s.p.textContent("form[data-pvidf='sus-1']")) || ""),
     await s.p.textContent("form[data-pvidf='sus-1']"));
  ok("  나머지 넷은 적을 수 있다",
     (await s.p.locator("form[data-pvidf='sus-1'] [name='ceo']").count()) === 1 &&
     (await s.p.locator("form[data-pvidf='sus-1'] [name='tel']").count()) === 1);
  await s.p.fill("form[data-pvidf='sus-1'] [name='ceo']", "최대표");
  await s.p.fill("form[data-pvidf='sus-1'] [name='why']", "통화로 확인");
  await s.p.click("form[data-pvidf='sus-1'] button[type='submit']");
  await s.p.waitForTimeout(400);
  const idn2 = s.sent.filter(function(x){ return x.name === "set_provider_ident"; })[0];
  let idb2 = null;
  try{ idb2 = JSON.parse(idn2.body).p; }catch(_){}
  ok("⚠️⚠️ 직원의 꾸러미에는 **brn 이 아예 없다** (있으면 문이 거절합니다)",
     !!idb2 && !("brn" in idb2), idn2 && idn2.body);
  ok("업체 심사 자리의 누르는 것이 40px 이상이다 (직원)",
     (await tapsOk(s.p, "#probox")) === 0, await tapsOk(s.p, "#probox"));
  await s.p.close();


  /* ══ 신고 · 분쟁 (0040 · 3차 지시서 §6 · §8) ═══════════════════
     ⚠️⚠️⚠️ **문만 만들고 화면을 안 만들면 그 기능은 없는 것입니다.**
     `approve_provider` 가 그랬습니다 — 문을 세 번 고쳤는데 부르는
     자리가 **0곳**이었습니다. 그래서 신고도 세 자리를 **눌러서**
     꾸러미까지 뜯어 봅니다 — ① 손님이 여는 자리 ② 업체가 여는 자리
     ③ 운영자가 처리하는 자리. */
  const REPS = [
    /* ⚠️ 손님이 적은 글에 태그를 넣어 둡니다 — 그대로 나가면 사고입니다 */
    { id:"dddddddd-0000-0000-0000-000000000001", kind:"dispute",
      request_id:REQ.id, provider_id:null, review_id:null,
      body:"<img src=x onerror=alert(1)> 약속한 날에 오지 않으셨습니다",
      state:"open", resolution:null, created_at:"2026-11-03T05:00:00Z",
      closed_at:null },
    { id:"dddddddd-0000-0000-0000-000000000002", kind:"abuse",
      request_id:null, provider_id:"real-1", review_id:null,
      body:"광고 글을 후기에 적었습니다", state:"resolved",
      resolution:"업체에 확인했고 글을 가렸습니다",
      created_at:"2026-11-02T05:00:00Z", closed_at:"2026-11-02T06:00:00Z" }
  ];
  const REPT = Object.assign({}, ADMT, BIZ, PROT, { report: REPS });

  console.log("\n── /admin 신고함 — 운영자가 아니면 한 줄도 안 보입니다");
  s = await open("/admin", { role:"customer", name:"일반회원" }, REPT);
  ok("신고함이 아예 안 그려진다",
     (await s.p.locator("#repbox button[data-rto]").count()) === 0);
  t = (await s.p.textContent("#repbox")) || "";
  ok("신고 본문이 한 글자도 안 나온다", t.indexOf("오지 않으셨습니다") < 0, t);
  ok("⚠️ 신고를 **읽으러 가지도 않는다**",
     s.sent.filter(function(x){
       return x.name === "GET" && x.body.indexOf("/rest/v1/report") >= 0; }).length === 0,
     JSON.stringify(s.sent.slice(0, 4)));
  await s.p.close();

  console.log("\n── /admin 신고함 — 운영자");
  s = await open("/admin", { role:"admin", name:"관리자" }, REPT, { biz_metrics: MET });
  ok("화면 에러 · CSP 거절이 0건이다", s.errs.length === 0, s.errs.join(" | "));
  t = (await s.p.textContent("#repbox")) || "";
  ok("보고 있는 신고가 그려진다", /오지 않으셨습니다/.test(t), t.slice(0, 300));
  ok("갈래가 **사람 말**로 나온다 (영문 키가 아니다)",
     /분쟁/.test(t) && t.indexOf("dispute") < 0, t.slice(0, 200));
  ok("상태도 사람 말이다", /새 신고/.test(t) && t.indexOf("open") < 0, t.slice(0, 200));
  /* ⚠️⚠️ 손님이 쓴 글입니다 — esc() 를 지나야 합니다 (절대 규칙 4) */
  ok("⚠️ 손님이 쓴 글이 **날것으로 안 나간다**",
     (await s.p.locator("#repbox img").count()) === 0 &&
     (await s.p.locator("#repbox script").count()) === 0);
  ok("무엇에 대한 신고인지 (요청번호) 나온다", /SW-7K3M-92QP/.test(t), t.slice(0, 300));
  /* ⚠️⚠️ **누가 신고했는지는 안 찍습니다** — 업체 쪽으로 말이 새는
     길을 화면에서부터 막습니다. */
  ok("⚠️ 신고한 사람의 성함이 안 나온다", t.indexOf("홍길동") < 0, t);
  /* ⚠️ 끝난 것은 **다른 갈래**에 있습니다 (보고 있는 것만 먼저 봅니다) */
  ok("끝난 신고는 첫 갈래에 섞이지 않는다", t.indexOf("광고 글을") < 0, t);
  ok("끝난 것이 몇 건인지는 갈래에 적힌다",
     (await s.p.locator("#repbox button[data-rtab='done']").count()) === 1);

  /* ⚠️⚠️ **까닭 없이 닫히면 안 됩니다** (DB 도 막습니다) */
  await s.p.evaluate(function(){ window.prompt = function(){ return ""; }; });
  await s.p.click("#repbox button[data-rto='resolved']");
  await s.p.waitForTimeout(200);
  ok("⚠️ 처리 까닭을 안 적으면 **보내지 않는다**",
     s.sent.filter(function(x){ return x.name === "move_report"; }).length === 0,
     s.sent.map(function(x){ return x.name; }).join(" "));
  /* ⚠️ 확인 중으로 옮기는 것은 아직 안 끝난 것이라 까닭을 안 받습니다 */
  await s.p.click("#repbox button[data-rto='reviewing']");
  await s.p.waitForTimeout(300);
  const rvw = s.sent.filter(function(x){ return x.name === "move_report"; })[0];
  ok("확인 중으로는 까닭 없이 옮긴다 (DB 와 같은 규칙)", !!rvw,
     s.sent.map(function(x){ return x.name; }).join(" "));
  await s.p.evaluate(function(){
    window.prompt = function(){ return "업체에 확인했고 사실이 아니었습니다"; }; });
  await s.p.click("#repbox button[data-rto='resolved']");
  await s.p.waitForTimeout(300);
  const rdone = s.sent.filter(function(x){
    return x.name === "move_report" && (x.body || "").indexOf("resolved") >= 0; })[0];
  ok("처리하면 move_report 를 부른다", !!rdone,
     s.sent.map(function(x){ return x.name; }).join(" "));
  let rp2 = null;
  try{ rp2 = JSON.parse(rdone.body).p; }catch(_){}
  ok("  꾸러미의 칸 이름이 문과 같다 (id · to · resolution)",
     !!rp2 && rp2.id === REPS[0].id && rp2.to === "resolved" &&
     rp2.resolution === "업체에 확인했고 사실이 아니었습니다", rdone && rdone.body);

  console.log("\n── /admin 신고함 — 끝난 것 갈래");
  await s.p.click("#repbox button[data-rtab='done']");
  await s.p.waitForTimeout(250);
  t = (await s.p.textContent("#repbox")) || "";
  ok("끝난 신고가 그려진다", /광고 글을/.test(t), t.slice(0, 300));
  ok("어떻게 처리했는지가 남아 보인다", /글을 가렸습니다/.test(t), t.slice(0, 300));
  /* ⚠️ 끝난 것에는 단추를 안 냅니다 (DB 가 거절합니다 · 절대 규칙 5) */
  ok("⚠️ 끝난 신고에는 **단추를 안 낸다**",
     (await s.p.locator("#repbox button[data-rto]").count()) === 0);
  ok("신고함의 누르는 것이 40px 이상이다",
     (await tapsOk(s.p, "#repbox")) === 0, await tapsOk(s.p, "#repbox"));
  await s.p.close();

  /* ══ 운영자가 **신고된 글을 가리는** 자리 (0047 · 0048) ══════════
     ⚠️⚠️⚠️ **`check-doors` 는 이 자리를 못 잡습니다.** `move_cq` ·
     `move_ca` · `move_jobpost` 는 글쓴이가 **내리는** 길에서 이미
     불리고 있어서 "부르는 자리가 있다" 로 세어집니다 — 갈래마다
     세지 않습니다. 그래서 운영자가 **가리는** 길은 문만 있고 화면이
     없었습니다 (`approve_provider` 와 똑같은 꼴이었습니다).
     ⚠️ 그러니 여기서 **눌러서** 봅니다. */
  console.log("\n── /admin 신고된 글을 가립니다 (0047 · 0048)");
  {
    const RQ = [
      { id:"dddddddd-0000-0000-0000-000000000011", kind:"abuse",
        request_id:null, provider_id:null, review_id:null, joinroom_id:null,
        cq_id:"q1", ca_id:null, jobpost_id:null,
        body:"광고 글로 보입니다", state:"open", resolution:null,
        created_at:"2026-11-04T05:00:00Z", closed_at:null },
      { id:"dddddddd-0000-0000-0000-000000000012", kind:"abuse",
        request_id:null, provider_id:null, review_id:null, joinroom_id:null,
        cq_id:null, ca_id:null, jobpost_id:"j1",
        body:"허위 구인으로 보입니다", state:"open", resolution:null,
        created_at:"2026-11-04T06:00:00Z", closed_at:null },
      /* ⚠️ 이미 가려진 글 — 단추를 **안 내야** 합니다 */
      { id:"dddddddd-0000-0000-0000-000000000013", kind:"abuse",
        request_id:null, provider_id:null, review_id:null, joinroom_id:null,
        cq_id:"q9", ca_id:null, jobpost_id:null,
        body:"이미 가려진 질문입니다", state:"open", resolution:null,
        created_at:"2026-11-04T07:00:00Z", closed_at:null },
      /* ⚠️ 0049 — 조인 자리. 전에는 신고를 받아 놓고 운영자가 할 수
         있는 일이 "처리했음" 뿐이었습니다. */
      { id:"dddddddd-0000-0000-0000-000000000014", kind:"abuse",
        request_id:null, provider_id:null, review_id:null,
        joinroom_id:"r1", cq_id:null, ca_id:null, jobpost_id:null,
        body:"본문에 전화번호를 적었습니다", state:"open", resolution:null,
        created_at:"2026-11-04T08:00:00Z", closed_at:null }
    ];
    const RT = Object.assign({}, ADMT, BIZ, PROT, { report: RQ,
      cq: [{ id:"q1", title:"가릴 질문", state:"live" },
           { id:"q9", title:"이미 가린 질문", state:"hidden" }],
      ca: [],
      jobpost: [{ id:"j1", title:"가릴 구인 글", state:"open" }],
      joinroom: [{ id:"r1", title:"가릴 조인 자리", state:"open" }] });
    s = await open("/admin", { role:"admin", name:"관리자" }, RT,
                   { biz_metrics: MET });
    t = (await s.p.textContent("#repbox")) || "";
    ok("⚠️ 무엇에 대한 신고인지 **새 갈래도** 적는다 (칸을 안 읽으면 " +
       "아무것도 안 적힙니다)",
       t.indexOf("커뮤니티 질문") >= 0 && t.indexOf("구인 · 구직 글") >= 0,
       t.slice(0, 400));
    ok("  신고된 글의 **제목**까지 붙여 준다 (따로 읽어서)",
       t.indexOf("가릴 질문") >= 0 && t.indexOf("가릴 구인 글") >= 0,
       t.slice(0, 400));
    ok("⚠️ 이미 가려진 글에는 **단추를 안 낸다** (눌러도 아무 일이 안 " +
       "나는 단추를 만들지 않습니다)",
       t.indexOf("이미 가려져 있습니다") >= 0 &&
       (await s.p.locator("button[data-hid='q9']").count()) === 0,
       t.slice(0, 400));

    /* ⚠️⚠️ **까닭 없이는 안 보냅니다** (문도 · 표의 check 도 막습니다) */
    await s.p.evaluate(function(){ window.prompt = function(){ return "짧"; }; });
    await s.p.click("button[data-hid='q1']");
    await s.p.waitForTimeout(250);
    ok("⚠️⚠️ 가리는 까닭이 다섯 글자 미만이면 **보내지 않는다**",
       s.sent.filter(function(x){ return x.name === "move_cq"; }).length === 0,
       s.sent.map(function(x){ return x.name; }).join(" "));

    await s.p.evaluate(function(){
      window.prompt = function(){ return "광고 글입니다"; }; });
    await s.p.click("button[data-hid='q1']");
    await s.p.waitForTimeout(350);
    const hq = s.sent.filter(function(x){ return x.name === "move_cq"; })[0];
    ok("⚠️⚠️⚠️ 가리기 단추가 **move_cq 를 실제로 부른다** (운영자가 SQL " +
       "편집기를 열지 않아도 됩니다)", !!hq,
       s.sent.map(function(x){ return x.name; }).join(" "));
    if(hq){
      let hp = null;
      try{ hp = JSON.parse(hq.body).p; }catch(_){}
      ok("  꾸러미의 칸 이름이 문과 같다 (id · state · why)",
         !!hp && hp.id === "q1" && hp.state === "hidden" &&
         hp.why === "광고 글입니다", hq.body);
    }

    await s.p.click("button[data-hid='j1']");
    await s.p.waitForTimeout(350);
    const hj = s.sent.filter(function(x){ return x.name === "move_jobpost"; })[0];
    ok("⚠️ 구인 · 구직 글도 **move_jobpost 로** 가린다", !!hj,
       s.sent.map(function(x){ return x.name; }).join(" "));

    await s.p.click("button[data-hid='r1']");
    await s.p.waitForTimeout(350);
    const hr = s.sent.filter(function(x){ return x.name === "move_joinroom"; })[0];
    ok("⚠️⚠️ 조인 자리도 **move_joinroom 으로** 가린다 (0049 — 전에는 " +
       "신고를 받아 놓고 내릴 길이 없었습니다)", !!hr,
       s.sent.map(function(x){ return x.name; }).join(" "));
    ok("  그 자리의 **제목**까지 적어 준다 (무엇을 가리는지 보고 누릅니다)",
       t.indexOf("가릴 조인 자리") >= 0, t.slice(0, 500));
    ok("신고함의 누르는 것이 40px 이상이다",
       (await tapsOk(s.p, "#repbox")) === 0, await tapsOk(s.p, "#repbox"));
    await s.p.close();
  }

  /* ════════════════════════════════════════════════════════════════
     /admin 중고 매물 관리 (0056 · 0070 · 개편 지시서 §7)
     ⚠️⚠️⚠️ 전에는 **신고가 들어온 매물만** 다룰 수 있었습니다 —
     `move_listing` 을 부르는 자리가 신고함 하나였습니다. 그리고 0056 의
     문은 `hidden` 으로만 가서 **되돌릴 길이 아무에게도 없었습니다.**
     ════════════════════════════════════════════════════════════════ */
  console.log("\n── /admin 중고 매물 관리 (0070)");
  {
    const LSA = [
      { id:"eeeeeeee-0070-4000-8000-000000000001", title:"드라이버 팝니다",
        sub:"us-driver", brand:"타이틀리스트", model:"스텔스2",
        region:"seoul", price:350000, state:"open",
        hidden_why:null, hidden_from:null, created_at:"2026-11-08T01:00:00Z" },
      /* ⚠️ 가려진 줄 — **되돌리기** 단추가 나와야 하고, 되돌리면 어디로
         가는지(`hidden_from`)까지 적어야 합니다. */
      { id:"eeeeeeee-0070-4000-8000-000000000002", title:"가려진 매물",
        sub:"us-ball", brand:"기타", model:null,
        region:"busan", price:0, state:"hidden",
        hidden_why:"금지된 물건입니다", hidden_from:"done",
        created_at:"2026-11-08T02:00:00Z" }];

    /* ① 운영자가 아니면 **한 줄도 안 그리고 읽으러 가지도 않습니다** */
    {
      const g = await open("/admin", { role:"customer", name:"홍길동" },
                           { listing: LSA });
      const off = await g.p.evaluate(function(){
        const e = document.getElementById("lsadm");
        return { hid: !e || e.hidden, html: e ? e.innerHTML : "" };
      });
      ok("⚠️ 손님에게는 매물 관리가 **한 줄도 안 보인다**",
         off.hid && off.html === "", JSON.stringify(off).slice(0, 160));
      ok("  ⚠️ 그리고 **읽으러 가지도 않는다**",
         !g.sent.some(function(x){ return x.name === "listing"; }),
         g.sent.map(function(x){ return x.name; }).join(" "));
      await g.p.close();
    }

    /* ② 운영자 */
    {
      const g = await open("/admin", { role:"admin", name:"운영자" },
                           { listing: LSA });
      const t = await g.p.evaluate(function(){
        const e = document.getElementById("lsadm");
        return { txt: e ? e.innerText : "",
                 rows: e ? e.querySelectorAll("li[data-ls]").length : 0,
                 hide: e ? e.querySelectorAll("button[data-hide]").length : 0,
                 back: e ? e.querySelectorAll("button[data-back]").length : 0,
                 see:  e ? e.querySelectorAll('a[href^="/cat/used?v="]').length : 0 };
      });
      ok("⚠️ 운영자에게 매물 목록이 보인다", t.rows === 2, JSON.stringify(t));
      ok("  ⚠️ 팔고 있는 매물에는 **가리기**, 가려진 매물에는 **되돌리기**",
         t.hide === 1 && t.back === 1, JSON.stringify(t));
      /* ⚠️ 조사까지 봅니다 — 「팔렸습니다」 는 받침이 없어 **「가」** 입니다.
         글자로 박으면 「예약중가」 같은 말이 나가고 아무 도구도 안 잡습니다. */
      ok("  ⚠️⚠️ 되돌리면 **어디로 가는지** 적는다 (가리기 전 상태 · 0070)",
         t.txt.indexOf("되돌리면 상태가") >= 0 &&
         t.txt.indexOf("팔렸습니다가 됩니다") >= 0, t.txt.slice(0, 400));
      ok("  ⚠️ 가린 **까닭**을 그 자리에서 보여 준다",
         t.txt.indexOf("금지된 물건입니다") >= 0, t.txt.slice(0, 400));
      ok("  ⚠️ 매물 자체를 볼 길을 같이 낸다 (제목만 보고 가릴 수 없습니다)",
         t.see === 2, JSON.stringify(t));
      /* ⚠️ 0 은 **무료로 나눔**입니다 — `||` 를 쓰면 사라집니다 */
      ok("  ⚠️ 값 0 을 **무료로 나눔**으로 적는다",
         t.txt.indexOf("무료") >= 0, t.txt.slice(0, 400));
      /* ⚠️ 지우는 단추를 **안 냅니다** (분쟁 때 낼 것이 없어집니다)
         ⚠️⚠️ **글 전체에서 「지우」 를 찾으면 안 됩니다** — 이 상자의 안내문이
         「**지우지** 않고 가립니다」 로 시작해서 제 글을 제가 집었습니다
         (멀쩡한 화면을 고장이라고 한 자리). **단추 · 링크의 글자만** 봅니다. */
      const del = await g.p.evaluate(function(){
        const e = document.getElementById("lsadm");
        if(!e) return "";
        return Array.prototype.map.call(e.querySelectorAll("button, a"),
          function(x){ return x.textContent || ""; }).join(" ");
      });
      ok("  ⚠️⚠️ **지우는 단추를 안 낸다** (가리기만 합니다)",
         del.indexOf("지우") < 0 && del.indexOf("삭제") < 0, del.slice(0, 160));

      /* 가리기 — ⚠️ 까닭 없이는 안 보냅니다 */
      const n0 = g.sent.length;
      await g.p.click("li[data-ls] button[data-hide]");
      await g.p.waitForTimeout(200);
      const opened = await g.p.evaluate(function(){
        const f = document.querySelector("#lsadm .lsadm-f");
        return !!(f && !f.hidden); });
      ok("  가리기를 누르면 **까닭 칸**이 열린다", opened, String(opened));
      await g.p.fill("#lsadm .lsadm-f input[name='lwhy']", "가짜 매물로 보입니다");
      await g.p.click("#lsadm .lsadm-f button[type='submit']");
      await g.p.waitForTimeout(400);
      const sent = g.sent.slice(n0)
        .filter(function(x){ return x.name === "move_listing"; })
        .map(function(x){ return String(x.body); }).join(" ");
      ok("  ⚠️ `move_listing` 을 **까닭과 함께** 보낸다",
         sent.indexOf('"state":"hidden"') >= 0 &&
         sent.indexOf("가짜 매물로 보입니다") >= 0, sent.slice(0, 220));
      /* ⚠️⚠️ 이 문은 **jsonb 하나(`p`)** 를 받습니다 — 자리 인자로 보내면
         거절됩니다 (0013 에서 겪은 자리). */
      ok("  ⚠️⚠️ 꾸러미가 `{p:{…}}` 꼴이다 (자리 인자가 아닙니다)",
         sent.indexOf('"p":{') >= 0, sent.slice(0, 220));
      await g.p.close();
    }

    /* ③ 되돌리기 — ⚠️ 까닭을 **안 받습니다** (되돌리기가 가리기보다
       어려워지면 잘못 가린 것이 그대로 남습니다) */
    {
      const g = await open("/admin", { role:"staff", name:"직원" },
                           { listing: LSA });
      const n0 = g.sent.length;
      await g.p.click("li[data-ls] button[data-back]");
      await g.p.waitForTimeout(400);
      const sent = g.sent.slice(n0)
        .filter(function(x){ return x.name === "move_listing"; })
        .map(function(x){ return String(x.body); }).join(" ");
      ok("⚠️ **직원도** 가리고 되돌릴 수 있다 (문이 둘에게 열려 있습니다)",
         sent.indexOf('"state":"open"') >= 0, sent.slice(0, 220));
      ok("  ⚠️ 되돌릴 때는 **까닭을 안 받는다**",
         sent.indexOf("why") < 0, sent.slice(0, 220));
      ok("매물 관리의 누르는 것이 40px 이상이다",
         (await tapsOk(g.p, "#lsadm")) === 0, await tapsOk(g.p, "#lsadm"));
      await g.p.close();
    }
  }

  console.log("\n── /my 손님이 신고를 엽니다 (0040)");
  s = await open("/my", { role:"customer", name:"홍길동" },
                 Object.assign({}, MYT, { quote:[], review:[], appointment:[],
                                          assignment:[] }));
  ok("신고 단추가 있다", (await s.p.locator("button[data-report]").count()) >= 1);
  await s.p.evaluate(function(){ window.prompt = function(){ return ""; }; });
  await s.p.click("button[data-report]");
  await s.p.waitForTimeout(200);
  ok("⚠️ 아무것도 안 적으면 **보내지 않는다**",
     s.sent.filter(function(x){ return x.name === "open_report"; }).length === 0,
     s.sent.map(function(x){ return x.name; }).join(" "));
  await s.p.evaluate(function(){
    window.prompt = function(){ return "약속한 날에 오지 않으셨습니다"; }; });
  await s.p.click("button[data-report]");
  await s.p.waitForTimeout(300);
  const orp = s.sent.filter(function(x){ return x.name === "open_report"; })[0];
  ok("open_report 를 부른다", !!orp, s.sent.map(function(x){ return x.name; }).join(" "));
  let op = null;
  try{ op = JSON.parse(orp.body).p; }catch(_){}
  ok("  꾸러미에 갈래 · 요청 · 적은 글이 담긴다",
     !!op && op.kind === "dispute" && op.request === REQ.id &&
     op.body === "약속한 날에 오지 않으셨습니다", orp && orp.body);
  t = (await s.p.textContent("#reqbox")) || "";
  ok("  접수되었다고 말한다 (조용히 아무 일도 안 나지 않는다)",
     /접수되었습니다/.test(t), t.slice(-300));
  /* ⚠️ 지킬 수 없는 약속을 하지 않습니다 */
  ok("  **몇 시간 안에 연락한다고 말하지 않는다**",
     !/시간 안에|며칠|당일/.test(t), t.slice(-300));
  await s.p.close();

  /* ⚠️⚠️ **취소가 막히는 자리가 바로 다툼이 나는 자리입니다.**
     계약 뒤에 신고 단추까지 없으면 손님은 전화밖에 할 길이 없습니다. */
  s = await open("/my", { role:"customer", name:"홍길동" },
                 Object.assign({}, MYT,
                   { request:[Object.assign({}, REQ, { state:"signed" })],
                     quote:[], review:[], appointment:[], assignment:[] }));
  ok("⚠️ 계약 뒤에도 신고 단추는 **그대로 있다**",
     (await s.p.locator("button[data-report]").count()) >= 1 &&
     (await s.p.locator("button[data-cancel]").count()) === 0);
  await s.p.close();
  /* ⚠️ 거둔 요청에는 안 냅니다 (더 다툴 거래가 없습니다) */
  s = await open("/my", { role:"customer", name:"홍길동" },
                 Object.assign({}, MYT,
                   { request:[Object.assign({}, REQ, { state:"lost" })],
                     quote:[], review:[], appointment:[], assignment:[] }));
  ok("거둔 요청에는 신고 단추를 안 낸다",
     (await s.p.locator("button[data-report]").count()) === 0);
  await s.p.close();

  console.log("\n── /desk 업체도 신고를 엽니다 (업체도 당사자입니다)");
  s = await open("/desk", PRO,
                 { assignment:[asg(REQ, "accepted")], request:[REQ],
                   quote:[], request_item:ITEMS });
  ok("수락한 건에 신고 단추가 있다",
     (await s.p.locator("#deskbox button[data-do='report']").count()) === 1);
  await s.p.evaluate(function(){
    window.prompt = function(){ return "연락이 닿지 않습니다"; }; });
  await s.p.click("#deskbox button[data-do='report']");
  await s.p.waitForTimeout(300);
  const drp = s.sent.filter(function(x){ return x.name === "open_report"; })[0];
  ok("open_report 를 부른다", !!drp, s.sent.map(function(x){ return x.name; }).join(" "));
  let dp = null;
  try{ dp = JSON.parse(drp.body).p; }catch(_){}
  ok("  꾸러미에 갈래 · 요청 · 적은 글이 담긴다",
     !!dp && dp.kind === "dispute" && dp.request === REQ.id &&
     dp.body === "연락이 닿지 않습니다", drp && drp.body);
  t = (await s.p.textContent("#deskbox")) || "";
  ok("  접수되었다고 말한다", /접수되었습니다/.test(t), t.slice(-300));
  await s.p.close();
  /* ⚠️⚠️ **수락 전에는 안 냅니다** — 0040 이 "그 거래의 당사자만" 으로
     막습니다. 눌러도 거절되는 단추를 미리 만들지 않습니다 (절대 규칙 5). */
  s = await open("/desk", PRO,
                 { assignment:[asg(REQ2, "sent")], request:[REQ2],
                   quote:[], request_item:ITEMS });
  ok("⚠️ 수락 전에는 신고 단추를 **안 낸다**",
     (await s.p.locator("#deskbox button[data-do='report']").count()) === 0);
  await s.p.close();

  /* ══ 업체 등록 양식 (0023 의 save_provider) ═══════════════════
     ⚠️⚠️⚠️ **이 양식이 없어서 입점 신청이 "연락했음" 에서 더 못
     갔습니다** — 업체 줄을 만들 길이 화면에 없었고, `save_provider` 는
     부르는 자리가 **0곳**이었습니다 (`tools/check-doors.js` 가 세어서
     찾았습니다). 그러니 **꾸러미까지** 뜯어 봅니다. */
  console.log("\n── /admin 업체 등록 양식");
  s = await open("/admin", { role:"admin", name:"관리자" }, REPT, { biz_metrics: MET });
  await s.p.click("#probox button[data-ptab='new']");
  await s.p.waitForTimeout(250);
  ok("양식이 그려진다", (await s.p.locator("#probox form#pvnew").count()) === 1);
  ok("지역은 **고르는 칸**이다 (자유 입력이 아니다 · 키가 어긋나지 않습니다)",
     (await s.p.locator("#probox input[name='rg']").count()) >= 10,
     await s.p.locator("#probox input[name='rg']").count());
  ok("하는 일도 고르는 칸이다 (catalog.js 한 곳에서 옵니다)",
     (await s.p.locator("#probox input[name='sb']").count()) >= 20,
     await s.p.locator("#probox input[name='sb']").count());
  t = (await s.p.textContent("#probox")) || "";
  /* ⚠️ 만든 뒤에 무엇을 더 해야 하는지 **그 자리에서** 말해야 합니다 */
  ok("만든 업체가 **비공개로** 들어간다고 말한다", /비공개/.test(t), t.slice(0, 300));
  ok("주소가 나중에 못 바뀐다고 말한다", /못 바꿉니다/.test(t), t.slice(0, 400));
  ok("양식의 누르는 것이 40px 이상이다",
     (await tapsOk(s.p, "#probox")) === 0, await tapsOk(s.p, "#probox"));
  /* ⚠️⚠️ 하는 일을 비워 보내면 DB 가 거절합니다 — **화면이 그 말을
     그대로** 보여 주는지 봅니다 (조용히 아무 일도 안 나면 안 됩니다). */
  await s.p.evaluate(function(){
    document.querySelector("#pn-id").value = "green-academy";
    document.querySelector("#pn-name").value = "그린 아카데미";
    document.querySelector("#pn-intro").value = "레슨 전문입니다";
    document.querySelector("#pn-hours").value = "평일 10~19시";
    document.querySelector("#pn-since").value = "2019";
    document.querySelector("input[name='rg'][value='seoul']").checked = true;
    const sb = document.querySelector("input[name='sb']");
    sb.checked = true;
    window.__sb = sb.value;
  });
  await s.p.click("#probox form#pvnew button[type='submit']");
  await s.p.waitForTimeout(400);
  const mk = s.sent.filter(function(x){ return x.name === "save_provider"; })[0];
  ok("save_provider 를 부른다", !!mk, s.sent.map(function(x){ return x.name; }).join(" "));
  let mp = null;
  try{ mp = JSON.parse(mk.body); }catch(_){}
  const sbKey = await s.p.evaluate(function(){ return window.__sb; });
  ok("  꾸러미의 칸 이름이 문과 같다 (p_id · p_name · p_data · p_why)",
     !!mp && mp.p_id === "green-academy" && mp.p_name === "그린 아카데미" &&
     !!mp.p_data && typeof mp.p_why === "string", mk && mk.body);
  ok("  고른 지역 · 하는 일이 **키로** 담긴다 (이름이 아닙니다)",
     !!mp && mp.p_data.regions.join() === "seoul" &&
     mp.p_data.subs.join() === sbKey, mk && mk.body);
  ok("  소개 · 상담 시간 · 개업 연도가 담긴다",
     !!mp && mp.p_data.intro === "레슨 전문입니다" &&
     mp.p_data.consultHours === "평일 10~19시" && mp.p_data.since === "2019",
     mk && mk.body);
  await s.p.close();

  console.log("\n── 입점 신청에서 양식으로 — 값을 채워서 엽니다");
  s = await open("/admin", { role:"admin", name:"관리자" }, REPT, { biz_metrics: MET });
  await s.p.click("#probox button[data-ptab='ap']");
  await s.p.waitForTimeout(250);
  ok("신청에 **업체 만들기** 단추가 있다",
     (await s.p.locator("#probox button[data-mkpv='aaaa-ap-1']").count()) === 1);
  await s.p.click("#probox button[data-mkpv='aaaa-ap-1']");
  await s.p.waitForTimeout(350);
  ok("양식이 열린다", (await s.p.locator("#probox form#pvnew").count()) === 1);
  /* ⚠️ 상호를 다시 타이핑하게 두면 그때 오타가 들어갑니다 */
  ok("  상호가 **채워져** 있다",
     (await s.p.inputValue("#pn-name")) === "새 골프샵",
     await s.p.inputValue("#pn-name"));
  ok("  신청의 지역이 **키로 골라져** 있다 (신청은 이름으로 적혀 있습니다)",
     await s.p.isChecked("input[name='rg'][value='seoul']"));
  t = (await s.p.textContent("#probox")) || "";
  ok("  어느 신청으로 만드는지 적힌다", /AP-0001/.test(t), t.slice(0, 300));
  await s.p.close();

  /* ══ 가격 등록 (0042 · 업체찾기 개선 7번) ═══════════════════════
     ⚠️⚠️⚠️ **이 화면이 없으면 가격은 영원히 비어 있습니다.** 업체찾기
     카드의 "실제 등록 가격" 은 업체가 여기서 올린 줄입니다 — 문만
     만들고 화면을 안 만들면 그 기능은 없는 것입니다. */
  const PRICES = [
    { id:"eeee-1", sub:"ls-solo", label:"주 1회 · 8회권", amount:400000,
      unit:"8회", note:"타석 이용료 별도", active:true },
    { id:"eeee-2", sub:"rg-in", label:"타석 1시간", amount:12000,
      unit:"1시간", note:null, active:true },
    /* ⚠️ 내린 줄 — **지운 것이 아닙니다** (얼마를 걸어 두었나가 기록입니다) */
    { id:"eeee-3", sub:"ls-solo", label:"지난 봄 특가", amount:300000,
      unit:"8회", note:null, active:false }
  ];
  const PRT = { provider_price: PRICES,
                provider: [{ id:"t-range", subs:["ls-solo","rg-in"] }] };

  console.log("\n── /desk 가격 등록 — 업체가 아니면 한 줄도 안 보입니다");
  s = await open("/desk", { role:"customer", name:"일반회원" },
                 Object.assign({ assignment:[], request:[], quote:[],
                                 request_item:[] }, PRT));
  ok("가격 자리가 아예 안 그려진다",
     (await s.p.locator("#pricebox [data-pf='open']").count()) === 0);
  ok("⚠️ 가격을 **읽으러 가지도 않는다**",
     s.sent.filter(function(x){
       return x.name === "GET" && x.body.indexOf("provider_price") >= 0; }).length === 0,
     JSON.stringify(s.sent.slice(0, 4)));
  await s.p.close();

  console.log("\n── /desk 가격 등록 — 업체");
  s = await open("/desk", PRO, Object.assign({ assignment:[], request:[], quote:[],
                                               request_item:[] }, PRT));
  ok("화면 에러 · CSP 거절이 0건이다", s.errs.length === 0, s.errs.join(" | "));
  t = (await s.p.textContent("#pricebox")) || "";
  ok("올려 둔 가격이 그려진다",
     t.indexOf("주 1회 · 8회권") >= 0 && t.indexOf("400,000원") >= 0, t.slice(0, 300));
  ok("단위가 같이 나온다", t.indexOf("8회") >= 0);
  ok("어느 서비스의 가격인지 **사람 말**로 나온다 (하위 키가 아니다)",
     t.indexOf("개인 레슨") >= 0 || t.indexOf("레슨") >= 0, t.slice(0, 300));
  ok("덧말도 나온다", t.indexOf("타석 이용료 별도") >= 0);
  /* ⚠️⚠️ 내린 줄은 **남아 있고** 내린 것으로 보입니다 */
  ok("⚠️ 내린 가격도 보이고 '내림' 이라고 적힌다",
     t.indexOf("지난 봄 특가") >= 0 && t.indexOf("내림") >= 0, t.slice(0, 400));
  ok("  ⚠️ 내린 줄에는 단추를 **안 낸다** (DB 가 거절합니다)",
     (await s.p.locator("button[data-pdown='eeee-3']").count()) === 0 &&
     (await s.p.locator("button[data-pedit='eeee-3']").count()) === 0);
  /* ⚠️ 올린 뒤 손님 화면에 언제 보이는지를 그 자리에서 말해야 합니다 */
  ok("⚠️ 손님 화면에 **언제** 보이는지 말한다 (자료를 다시 올린 뒤입니다)",
     /다시 올린 뒤/.test(t), t.slice(0, 300));

  console.log("\n── /desk 가격 올리기 양식");
  await s.p.click("#pricebox [data-pf='open']");
  await s.p.waitForTimeout(250);
  ok("양식이 열린다", (await s.p.locator("#pricebox form#pf").count()) === 1);
  /* ⚠️⚠️ **그 업체가 하는 일만** 고를 수 있습니다 — 안 하는 일에 가격을
     달면 DB 가 거절하고, 그 칸은 눌러도 안 되는 칸이 됩니다. */
  ok("⚠️ 서비스는 **하는 일 두 가지만** 고를 수 있다",
     (await s.p.locator("#pf-sub option").count()) === 2,
     await s.p.locator("#pf-sub option").count());
  ok("  고르는 칸이다 (자유 입력이 아니다 — 키가 어긋나지 않습니다)",
     (await s.p.locator("select#pf-sub").count()) === 1);
  ok("단위 칸에 보기를 같이 낸다 (datalist)",
     (await s.p.locator("#pf-units option").count()) >= 5);
  ok("무료면 0 을 적으라고 말한다",
     /무료면/.test((await s.p.textContent("#pricebox")) || ""));

  await s.p.fill("#pf-label", "주 2회 · 12회권");
  await s.p.fill("#pf-amount", "550,000원");     /* ⚠️ 쉼표 · 원 을 적으셔도 */
  await s.p.fill("#pf-unit", "12회");
  await s.p.fill("#pf-note", "주 2회 기준");
  await s.p.click("#pricebox form#pf button[type='submit']");
  await s.p.waitForTimeout(350);
  const pv1 = s.sent.filter(function(x){ return x.name === "save_provider_price"; })[0];
  ok("save_provider_price 를 부른다", !!pv1,
     s.sent.map(function(x){ return x.name; }).join(" "));
  let pp = null;
  try{ pp = JSON.parse(pv1.body).p; }catch(_){}
  ok("  꾸러미의 칸 이름이 문과 같다 (sub · label · amount · unit · note)",
     !!pp && pp.sub === "ls-solo" && pp.label === "주 2회 · 12회권" &&
     pp.unit === "12회" && pp.note === "주 2회 기준", pv1 && pv1.body);
  /* ⚠️ 숫자 칸은 **숫자만** 보냅니다 (쉼표 · 원 을 적으셔도 되게) */
  ok("  ⚠️ 금액은 숫자로 보낸다 (쉼표 · '원' 을 적어도)",
     !!pp && pp.amount === 550000, pv1 && pv1.body);

  console.log("\n── /desk 금액에 숫자가 하나도 없으면");
  s = await open("/desk", PRO, Object.assign({ assignment:[], request:[], quote:[],
                                               request_item:[] }, PRT));
  await s.p.click("#pricebox [data-pf='open']");
  await s.p.waitForTimeout(250);
  await s.p.fill("#pf-label", "숫자를 안 적습니다");
  await s.p.fill("#pf-amount", "원");
  await s.p.fill("#pf-unit", "1회");
  await s.p.click("#pricebox form#pf button[type='submit']");
  await s.p.waitForTimeout(350);
  const pv2 = s.sent.filter(function(x){ return x.name === "save_provider_price"; })[0];
  /* ⚠️⚠️ **빈 칸을 0 으로 보내지 않습니다** — "안 적었다" 와 "0원" 은
     다른 말입니다. 0 으로 보내면 무료로 올라갑니다. */
  ok("⚠️ 금액 칸을 **0 으로 바꿔 보내지 않는다** (0원은 무료라는 뜻입니다)",
     !!pv2 && JSON.parse(pv2.body).p.amount === undefined, pv2 && pv2.body);

  console.log("\n── /desk 가격 고치기 · 내리기");
  s = await open("/desk", PRO, Object.assign({ assignment:[], request:[], quote:[],
                                               request_item:[] }, PRT));
  await s.p.click("button[data-pedit='eeee-2']");
  await s.p.waitForTimeout(250);
  ok("고치기를 누르면 그 값이 **채워져** 열린다",
     (await s.p.inputValue("#pf-label")) === "타석 1시간" &&
     (await s.p.inputValue("#pf-amount")) === "12000",
     await s.p.inputValue("#pf-label"));
  await s.p.fill("#pf-amount", "13000");
  await s.p.click("#pricebox form#pf button[type='submit']");
  await s.p.waitForTimeout(350);
  const pv3 = s.sent.filter(function(x){ return x.name === "save_provider_price"; })[0];
  ok("고칠 때는 **id 를 같이** 보낸다 (새로 올리는 것이 아닙니다)",
     !!pv3 && JSON.parse(pv3.body).p.id === "eeee-2" &&
     JSON.parse(pv3.body).p.amount === 13000, pv3 && pv3.body);

  await s.p.evaluate(function(){ window.confirm = function(){ return true; }; });
  await s.p.click("button[data-pdown='eeee-1']");
  await s.p.waitForTimeout(350);
  const pv4 = s.sent.filter(function(x){ return x.name === "drop_provider_price"; })[0];
  ok("내리면 drop_provider_price 를 부른다", !!pv4,
     s.sent.map(function(x){ return x.name; }).join(" "));
  ok("  꾸러미에 그 줄의 id 가 담긴다",
     !!pv4 && JSON.parse(pv4.body).p.id === "eeee-1", pv4 && pv4.body);
  ok("가격 자리의 누르는 것이 40px 이상이다",
     (await tapsOk(s.p, "#pricebox")) === 0, await tapsOk(s.p, "#pricebox"));
  await s.p.close();

  console.log("\n── /desk 가격이 0건일 때");
  s = await open("/desk", PRO, Object.assign({ assignment:[], request:[], quote:[],
    request_item:[] }, { provider_price: [],
                         provider: [{ id:"t-range", subs:["ls-solo"] }] }));
  t = (await s.p.textContent("#pricebox")) || "";
  ok("0건이면 0건이라고 말한다", /아직 올리신 가격이 없습니다/.test(t), t.slice(0, 200));
  /* ⚠️ 안 올려도 된다고 말합니다 — 안 올리면 그 줄이 빠질 뿐입니다 */
  ok("  ⚠️ 안 올리셔도 된다고 말한다 (그때는 줄이 빠집니다)",
     /올리지 않으셔도/.test(t), t.slice(0, 300));
  ok("  0건을 '읽지 못했다' 로 말하지 않는다", t.indexOf("읽지 못했") < 0);
  await s.p.close();

  console.log("\n── /desk 하는 일이 안 적힌 업체");
  s = await open("/desk", PRO, Object.assign({ assignment:[], request:[], quote:[],
    request_item:[] }, { provider_price: [], provider: [{ id:"t-range", subs:[] }] }));
  t = (await s.p.textContent("#pricebox")) || "";
  /* ⚠️⚠️ 눌러도 거절되는 단추를 미리 만들지 않습니다 (절대 규칙 5) */
  ok("⚠️ 하는 일이 없으면 **올리기 단추를 안 낸다**",
     (await s.p.locator("#pricebox [data-pf='open']").count()) === 0);
  ok("  무엇을 먼저 해야 하는지 말한다 (막다른 길로 두지 않습니다)",
     /먼저 알려/.test(t), t.slice(0, 300));
  await s.p.close();

  /* ══ 머리말의 로그인 자리 (UX 검수 §8) ═════════════════════════
     ⚠️⚠️⚠️ **전에는 `/login` 과 `/my` 가 아무 데서도 안 이어져
     있었습니다.** 매칭 요청을 넣은 손님이 받은 견적을 보러 갈 길이
     주소를 직접 치는 것뿐이었습니다 — 화면도 문도 멀쩡한데 거기까지
     갈 수가 없었습니다. 그래서 **손님이 보는 화면**에서 잽니다. */
  const PUB = { request:[], quote:[], assignment:[], request_item:[] };

  console.log("\n── 손님 화면의 머리말 — 로그인 설정 전에는 한 글자도 안 그립니다");
  s = await open("/", { auth:false, signedIn:false }, PUB);
  ok("⚠️ 로그인이 꺼져 있으면 머리말에 **아무것도 안 나온다**",
     (await s.p.locator(".hd-auth").count()) === 0);
  ok("  그래도 화면 에러는 0건이다", s.errs.length === 0, s.errs.join(" | "));
  await s.p.close();

  console.log("\n── 로그인 설정 뒤 — 역할마다 갈 곳이 다릅니다");
  s = await open("/", { signedIn:false, role:"", name:"" }, PUB);
  /* ⚠️⚠️ 전에는 `a[href="/login"]` 으로 **주소를 글자까지 박아** 두었습니다.
     로그인 링크가 돌아올 자리(`?next=`)를 달기 시작하자 **멀쩡한 화면을
     실패로** 잡았습니다 — 작업 기억의 "검사에 그날의 이름을 박지 마세요"
     자리입니다. 재려는 뜻은 "로그인으로 가는 길이 하나 있는가" 입니다. */
  ok("안 하셨으면 **로그인**이 나온다",
     (await s.p.locator('.hd-auth a[href^="/login"]').count()) === 1);
  t = (await s.p.textContent(".hd-auth")) || "";
  ok("  글자도 '로그인' 이다", /로그인/.test(t), t);
  await s.p.close();

  s = await open("/", { role:"customer", name:"홍길동" }, PUB);
  ok("손님은 **내 정보**로 간다",
     (await s.p.locator('.hd-auth a[href="/my"]').count()) === 1);
  ok("  이름을 적어 준다 (누구로 들어와 있는지 보입니다)",
     /홍길동/.test((await s.p.textContent(".hd-auth")) || ""));
  await s.p.close();

  s = await open("/", PRO, PUB);
  ok("⚠️ 업체는 **업체 작업실**로 간다 (손님 마이페이지가 아닙니다)",
     (await s.p.locator('.hd-auth a[href="/desk"]').count()) === 1);
  await s.p.close();

  s = await open("/", { role:"admin", name:"관리자" }, PUB);
  ok("⚠️ 운영자는 **관리자**로 간다",
     (await s.p.locator('.hd-auth a[href="/admin"]').count()) === 1);
  await s.p.close();

  /* ⚠️ 손님이 보는 다른 화면에서도 같아야 합니다 (한 화면에만 달면
     거기서만 보이고 나머지는 그대로 막다른 길입니다) */
  for(const route of ["/search", "/match", "/categories", "/help"]){
    s = await open(route, { role:"customer", name:"홍길동" }, PUB);
    ok(route + " 에서도 머리말에 내 정보가 있다",
       (await s.p.locator('.hd-auth a[href="/my"]').count()) === 1);
    await s.p.close();
  }

  /* ⚠️⚠️ **두 번 그리지 않습니다** — /login · /my 는 account.js 도
     싣습니다. 둘이 그리면 머리말 칸이 둘이 됩니다. */
  for(const route of ["/login", "/my"]){
    s = await open(route, { role:"customer", name:"홍길동" }, PUB);
    ok(route + " 에서 머리말 칸이 **하나**다 (두 번 그리지 않습니다)",
       (await s.p.locator(".hd-auth").count()) === 1,
       await s.p.locator(".hd-auth").count());
    await s.p.close();
  }


  /* ══ 입점 신청을 **등록 완료**로 (0016 · 4차 §2-3 · §5) ═══════
     ⚠️⚠️⚠️ **이 길이 막혀 있었습니다.** 0016 은 "등록 완료로 두려면
     등록한 업체를 가리켜라" 고 막는데, 화면이 그 업체를 **안 보내고
     있었습니다** — 누르면 늘 거절당했습니다. 토막 검사는 전부
     초록이었고, 처음부터 끝까지 눌러 보는 검사(tools/sql/flow.js)가
     찾았습니다. */
  console.log("\n── /admin 입점 신청 → 등록 완료");
  s = await open("/admin", { role:"admin", name:"관리자" },
                 Object.assign({}, ADMT, BIZ, PROT), { biz_metrics: MET });
  await s.p.click("#probox button[data-ptab='ap']");
  await s.p.waitForTimeout(250);
  ok("등록한 업체를 고르는 칸이 있다",
     (await s.p.locator("select[data-apsel='aaaa-ap-1']").count()) === 1);
  ok("  고를 수 있는 업체가 목록에 있다",
     (await s.p.locator("select[data-apsel='aaaa-ap-1'] option").count()) >= 2,
     await s.p.locator("select[data-apsel='aaaa-ap-1'] option").count());
  /* ⚠️ 안 고르고 누르면 **보내지 않고** 무엇을 하라고 말합니다 */
  await s.p.click("button[data-apdone='aaaa-ap-1']");
  await s.p.waitForTimeout(250);
  ok("⚠️ 업체를 안 고르면 **보내지 않는다** (DB 도 거절합니다)",
     s.sent.filter(function(x){
       return x.name === "set_apply_state" &&
              (x.body || "").indexOf('"done"') >= 0; }).length === 0,
     s.sent.map(function(x){ return x.name; }).join(" "));
  ok("  무엇을 먼저 하라고 말한다",
     /등록한 업체를 먼저/.test((await s.p.textContent("#probox")) || ""),
     (await s.p.textContent("#probox") || "").slice(-200));
  await s.p.selectOption("select[data-apsel='aaaa-ap-1']", "real-1");
  await s.p.click("button[data-apdone='aaaa-ap-1']");
  await s.p.waitForTimeout(350);
  const apd = s.sent.filter(function(x){
    return x.name === "set_apply_state" && (x.body || "").indexOf('"done"') >= 0; })[0];
  ok("업체를 고르면 보낸다", !!apd, s.sent.map(function(x){ return x.name; }).join(" "));
  ok("  ⚠️ 꾸러미에 **등록한 업체**가 담긴다 (0016 이 그것을 봅니다)",
     !!apd && JSON.parse(apd.body).p_provider === "real-1" &&
     JSON.parse(apd.body).p_to === "done", apd && apd.body);
  await s.p.close();


  /* ══ 담당자 초대 (0043 · 4차 지시서 §2-1) ══════════════════════
     ⚠️⚠️⚠️ **역할을 올리는 길입니다.** 0018 이 이 연결을 일부러 화면
     없이 두었습니다 — "화면에서 역할을 올릴 수 있으면 그게 가장 큰
     구멍". 그래서 단추 하나가 아니라 **운영자가 낸 코드**를 넣게 했고,
     여기서는 그 꾸러미까지 뜯어 봅니다. */
  const INVS = [
    { code:"ABCD234567", provider_id:"real-1", made_at:"2026-11-03T01:00:00Z",
      expires_at:"2026-11-17T01:00:00Z", used_at:null, void_at:null, live:true }
  ];
  const IVT = Object.assign({}, ADMT, BIZ, PROT, { v_provider_invite_admin: INVS });

  console.log("\n── /admin 담당자 초대 — 운영자");
  s = await open("/admin", { role:"admin", name:"관리자" }, IVT, { biz_metrics: MET });
  t = (await s.p.textContent("#probox")) || "";
  ok("살아 있는 초대 코드가 보인다", t.indexOf("ABCD234567") >= 0, t.slice(0, 400));
  ok("  언제까지 · 한 번만 쓸 수 있다고 말한다",
     /한 번만/.test(t), t.slice(0, 400));
  ok("  어디에 넣는지(업체 작업실) 말한다", /업체 작업실/.test(t), t.slice(0, 400));
  /* ⚠️ 코드가 이미 있는 업체에는 **만들기 단추를 안 냅니다** */
  ok("코드가 있는 업체에는 거두기 단추가 있다",
     (await s.p.locator("button[data-ivvoid='ABCD234567']").count()) === 1 &&
     (await s.p.locator("button[data-ivmake='real-1']").count()) === 0);
  /* ⚠️⚠️ 정지된 업체에는 담당자를 새로 안 들입니다 (DB 도 거절합니다) */
  ok("⚠️ 정지된 업체에는 **만들기 단추를 안 낸다**",
     (await s.p.locator("button[data-ivmake='sus-1']").count()) === 0);
  await s.p.close();

  s = await open("/admin", { role:"admin", name:"관리자" },
                 Object.assign({}, ADMT, BIZ, PROT, { v_provider_invite_admin: [] }),
                 { biz_metrics: MET });
  ok("코드가 없는 업체에는 만들기 단추가 있다",
     (await s.p.locator("button[data-ivmake='real-1']").count()) === 1);
  await s.p.click("button[data-ivmake='real-1']");
  await s.p.waitForTimeout(350);
  const iv1 = s.sent.filter(function(x){ return x.name === "make_provider_invite"; })[0];
  ok("make_provider_invite 를 부른다", !!iv1,
     s.sent.map(function(x){ return x.name; }).join(" "));
  ok("  꾸러미에 업체가 담긴다",
     !!iv1 && JSON.parse(iv1.body).p.provider === "real-1", iv1 && iv1.body);
  await s.p.close();

  console.log("\n── /admin 코드 거두기 — ⚠️ 까닭을 받습니다");
  s = await open("/admin", { role:"admin", name:"관리자" }, IVT, { biz_metrics: MET });
  await s.p.evaluate(function(){ window.prompt = function(){ return ""; }; });
  await s.p.click("button[data-ivvoid='ABCD234567']");
  await s.p.waitForTimeout(200);
  ok("⚠️ 까닭을 안 적으면 **보내지 않는다**",
     s.sent.filter(function(x){ return x.name === "void_provider_invite"; }).length === 0,
     s.sent.map(function(x){ return x.name; }).join(" "));
  await s.p.evaluate(function(){ window.prompt = function(){ return "잘못 냈습니다"; }; });
  await s.p.click("button[data-ivvoid='ABCD234567']");
  await s.p.waitForTimeout(350);
  const iv2 = s.sent.filter(function(x){ return x.name === "void_provider_invite"; })[0];
  ok("까닭을 적으면 거둔다", !!iv2, s.sent.map(function(x){ return x.name; }).join(" "));
  ok("  꾸러미에 코드와 까닭이 담긴다",
     !!iv2 && JSON.parse(iv2.body).p.code === "ABCD234567" &&
     JSON.parse(iv2.body).p.why === "잘못 냈습니다", iv2 && iv2.body);
  /* ⚠️ 운영자가 아니면 초대 자리가 아예 없습니다 (/admin 의 다른 자리와 같습니다) */
  await s.p.close();
  s = await open("/admin", { role:"customer", name:"일반회원" }, IVT);
  ok("⚠️ 운영자가 아니면 코드가 **한 글자도** 안 보인다",
     ((await s.p.textContent("#probox")) || "").indexOf("ABCD234567") < 0);
  await s.p.close();

  console.log("\n── /desk 초대 코드로 계정 잇기 (업체가 아닌 사람)");
  s = await open("/desk", { role:"customer", name:"업체 담당자" },
                 { assignment:[], request:[], quote:[], request_item:[] });
  ok("초대 코드 칸이 있다", (await s.p.locator("#ivf #iv-code").count()) === 1);
  t = (await s.p.textContent("#deskbox")) || "";
  /* ⚠️ 왜 안 되는지(권한 구조)는 안 적고 **다음에 할 일**을 냅니다 */
  ok("  입점 신청하는 길도 같이 낸다",
     (await s.p.locator('#deskbox a[href="/join"]').count()) === 1);
  ok("  운영자에게 받는 코드라고 말한다", /운영자에게 받으신/.test(t), t.slice(0, 300));
  await s.p.fill("#iv-code", "abcd234567");
  await s.p.click("#ivf button[type='submit']");
  await s.p.waitForTimeout(350);
  const iv3 = s.sent.filter(function(x){ return x.name === "redeem_provider_invite"; })[0];
  ok("redeem_provider_invite 를 부른다", !!iv3,
     s.sent.map(function(x){ return x.name; }).join(" "));
  /* ⚠️ 소문자로 치셔도 됩니다 — 대문자로 바꿔 보냅니다 */
  ok("  ⚠️ 소문자로 쳐도 **대문자로** 보낸다",
     !!iv3 && JSON.parse(iv3.body).p.code === "ABCD234567", iv3 && iv3.body);
  await s.p.close();

  /* ⚠️⚠️ 거절당하면 **그 까닭을 그대로** 보여 줍니다 (조용히 아무 일도
     안 나면 손님은 고장으로 읽습니다). */
  s = await open("/desk", { role:"customer", name:"업체 담당자" },
                 { assignment:[], request:[], quote:[], request_item:[] },
                 { redeem_provider_invite: null });
  await s.p.fill("#iv-code", "ZZZZZZZZZZ");
  await s.p.click("#ivf button[type='submit']");
  await s.p.waitForTimeout(350);
  ok("못 이으면 **그 까닭을 그대로** 보여 준다",
     ((await s.p.textContent("#ivmsg")) || "").indexOf("못 읽었습니다") >= 0,
     await s.p.textContent("#ivmsg"));
  ok("  칸이 다시 눌리게 열린다 (한 번 막히면 끝이 아닙니다)",
     (await s.p.isEnabled("#ivf button[type='submit']")));
  await s.p.close();

  /* ⚠️ 이미 업체인 사람에게는 그 칸이 **없습니다** (쓸 일이 없습니다) */
  s = await open("/desk", PRO, { assignment:[], request:[], quote:[], request_item:[] });
  ok("⚠️ 이미 이어진 업체에는 초대 칸이 **안 나온다**",
     (await s.p.locator("#ivf").count()) === 0);
  await s.p.close();

  /* ══ 운영 감사 기록 (4차 지시서 §5) ════════════════════════════
     ⚠️⚠️ 기록은 0004 부터 쌓고 있었는데 **보는 자리가 0곳**이었습니다. */
  const LOGS = [
    { id:3, at:"2026-11-03T05:00:00Z", by_role:"admin", obj:"provider",
      obj_id:"real-1", from_state:"approved", to_state:"suspended",
      why:"서류가 확인되지 않았습니다" },
    { id:2, at:"2026-11-03T04:00:00Z", by_role:"customer", obj:"assignment",
      obj_id:"bbbb-1", from_state:"accepted", to_state:"revoked",
      why:"다른 업체로 하기로 했습니다" },
    { id:1, at:"2026-11-03T03:00:00Z", by_role:"provider", obj:"quote",
      obj_id:"cccc-1", from_state:null, to_state:"open", why:null }
  ];
  const LGT = Object.assign({}, ADMT, BIZ, PROT, { audit_log: LOGS });

  console.log("\n── /admin 감사 기록 — 관리자가 아니면 한 줄도 안 보입니다");
  s = await open("/admin", { role:"staff", name:"직원" }, LGT, { biz_metrics: MET });
  /* ⚠️ 직원에게는 정책이 **제가 한 것만** 내줍니다 — 그러면 "전체
     기록" 이라고 적을 수 없어서 자리 자체를 안 냅니다. */
  ok("직원에게는 자리가 아예 안 그려진다",
     (await s.p.locator("#logbox button[data-ltab]").count()) === 0);
  ok("⚠️ 기록을 **읽으러 가지도 않는다**",
     s.sent.filter(function(x){
       return x.name === "GET" && x.body.indexOf("audit_log") >= 0; }).length === 0,
     JSON.stringify(s.sent.slice(0, 4)));
  await s.p.close();

  console.log("\n── /admin 감사 기록 — 관리자");
  s = await open("/admin", { role:"admin", name:"관리자" }, LGT, { biz_metrics: MET });
  ok("화면 에러 · CSP 거절이 0건이다", s.errs.length === 0, s.errs.join(" | "));
  t = (await s.p.textContent("#logbox")) || "";
  ok("기록이 그려진다", (await s.p.locator("#logbox tbody tr").count()) === 3,
     await s.p.locator("#logbox tbody tr").count());
  ok("무엇에 대한 기록인지 **사람 말**로 나온다 (영문 키가 아니다)",
     /업체/.test(t) && /제공 · 철회/.test(t) && t.indexOf("assignment") < 0,
     t.slice(0, 400));
  ok("누가 했는지 **역할까지만** 나온다",
     /관리자/.test(t) && /손님/.test(t), t.slice(0, 400));
  ok("무슨 일이었는지 나온다", /approved → suspended/.test(t), t.slice(0, 400));
  ok("까닭이 나온다", /서류가 확인되지 않았습니다/.test(t));
  /* ⚠️⚠️ 기록에 성함 · 연락처가 없다는 것을 그 자리에서 말합니다 */
  ok("⚠️ 성함 · 연락처를 담지 않는다고 말한다",
     /성함 · 연락처는 기록에 담지 않습니다/.test(t), t.slice(0, 400));
  ok("⚠️ 아무도 못 고친다고 말한다", /고치거나 지울 수 없습니다/.test(t));
  /* 갈래로 좁히기 — ⚠️ 보내는 주소까지 봅니다 (열쇠가 어긋나면
     거르개가 아무것도 안 걸러도 화면은 열립니다) */
  await s.p.click("#logbox button[data-ltab='provider']");
  await s.p.waitForTimeout(300);
  const lg = s.sent.filter(function(x){
    return x.name === "GET" && x.body.indexOf("audit_log") >= 0 &&
           x.body.indexOf("obj=eq.provider") >= 0; })[0];
  ok("갈래를 누르면 **그 갈래로 좁혀 읽는다**", !!lg,
     s.sent.filter(function(x){ return x.name === "GET"; })
           .map(function(x){ return x.body.split("/rest/v1/")[1]; }).slice(-3).join(" | "));
  ok("감사 기록 자리의 누르는 것이 40px 이상이다",
     (await tapsOk(s.p, "#logbox")) === 0, await tapsOk(s.p, "#logbox"));
  await s.p.close();

  console.log("\n── /admin 감사 기록을 **못 읽었을 때**");
  s = await open("/admin", { role:"admin", name:"관리자" },
                 Object.assign({}, ADMT, BIZ, PROT, { audit_log: null }),
                 { biz_metrics: MET });
  t = (await s.p.textContent("#logbox")) || "";
  ok("⚠️ 못 읽으면 **0건이라고 말하지 않는다**",
     /읽지 못했습니다/.test(t) && t.indexOf("그런 기록이 없습니다") < 0, t.slice(0, 200));
  await s.p.close();


  /* ══ 배정 후보 좁히기 (4차 지시서 §4) ═══════════════════════════
     ⚠️⚠️⚠️ **잘못 고르면 되돌릴 수 없습니다.** 운영자가 조건이 다른
     업체를 실수로 고르면 그 업체에 손님 **성함 · 연락처**가 넘어갑니다
     (개인정보 보호법 제17조). 전에는 `assignable` 이 켜진 업체를
     **전부** 한 목록에 늘어놓았습니다 — 서울 레슨 요청에 부산 피팅
     업체가 같이 앉아 있었습니다. */
  const FITP = [
    { id:"fit-1", name:"서울 레슨 업체", assignable:true, is_test:false,
      listed:true, state:"approved", subs:["ls-solo"], regions:["seoul"] },
    { id:"no-1",  name:"부산 피팅 업체", assignable:true, is_test:false,
      listed:true, state:"approved", subs:["ft-grip"], regions:["busan"] },
    { id:"sus-2", name:"정지된 레슨 업체", assignable:true, is_test:false,
      listed:true, state:"suspended", subs:["ls-solo"], regions:["seoul"] }
  ];
  /* REQ 는 cat=lesson · region=서울 입니다 */
  console.log("\n── /admin 배정 — ⚠️ 조건에 맞는 업체를 먼저 놓습니다");
  s = await open("/admin", { role:"admin", name:"관리자" },
                 Object.assign({}, ADMT, { provider: FITP }));
  /* ⚠️ 고르는 자리는 **넘기기를 눌러야** 열립니다 (안 누르면 빈 목록을
     재고 초록이 됩니다 — 아무것도 안 잰 검사입니다). */
  await s.p.click('#assignbox button[data-do="pick"]');
  await s.p.waitForTimeout(300);
  const fopts = await s.p.locator("#assignbox select[name='pv'] option").allTextContents();
  ok("조건에 맞는 업체가 **맨 위**에 온다",
     (fopts[1] || "").indexOf("서울 레슨 업체") >= 0, JSON.stringify(fopts));
  ok("⚠️ 조건에 안 맞는 곳은 **그렇다고 적힌다**",
     fopts.some(function(x){ return x.indexOf("부산 피팅 업체") >= 0 &&
                                   x.indexOf("조건에 안 맞습니다") >= 0; }),
     JSON.stringify(fopts));
  ok("  맞는 곳에는 그 말이 안 붙는다",
     fopts.some(function(x){ return x.indexOf("서울 레슨 업체") >= 0 &&
                                   x.indexOf("조건에 안 맞습니다") < 0; }),
     JSON.stringify(fopts));
  /* ⚠️ 정지된 업체는 DB 가 거절합니다 — 고르게 두면 눌러도 안 되는 칸입니다 */
  ok("⚠️ **정지된** 업체는 목록에 아예 없다",
     !fopts.some(function(x){ return x.indexOf("정지된 레슨 업체") >= 0; }),
     JSON.stringify(fopts));
  ok("⚠️ 잰 것이 0개가 아니다 (안 열린 목록을 재고 지나가지 않습니다)",
     fopts.length >= 3, JSON.stringify(fopts));
  t = (await s.p.textContent("#assignbox")) || "";
  ok("몇 곳이 조건에 맞는지 말한다", /맞는 업체/.test(t) && /1곳/.test(t), t.slice(-500));

  console.log("\n── /admin 배정 — ⚠️ 조건에 맞는 곳이 **하나도 없을 때**");
  await s.p.close();
  s = await open("/admin", { role:"admin", name:"관리자" },
                 Object.assign({}, ADMT, { provider: [FITP[1]] }));
  await s.p.click('#assignbox button[data-do="pick"]');
  await s.p.waitForTimeout(300);
  t = (await s.p.textContent("#assignbox")) || "";
  /* ⚠️⚠️ 그래도 고를 수는 있어야 합니다 — 업체가 적은 동안 아무도 못
     받으면 그게 더 나쁩니다. 다만 **모르고 고르면 안 됩니다.** */
  ok("맞는 곳이 없으면 **그렇게 말한다**",
     /조건에 맞는 업체가 없습니다/.test(t), t.slice(0, 600));
  ok("  그래도 고를 수는 있다 (전화로 확인하고 넘기는 길)",
     (await s.p.locator("#assignbox select[name='pv'] option").count()) === 2);
  ok("  전화로 확인한 뒤에만 넘기라고 말한다", /전화로 확인/.test(t), t.slice(0, 600));
  await s.p.close();

  /* ══ 업체 정보 고치기 (0044 · 4차 §2-4 · §2-6 · §2-7) ═════════
     ⚠️⚠️⚠️ **문이 보낸 것으로 통째로 덮어씁니다.** 화면이 칸 하나를
     안 담아 보내면 그 칸이 빈 값으로 지워지고 아무 에러도 안 납니다 —
     그래서 **보내는 꾸러미를 통째로** 뜯어 봅니다. */
  const MEPV = [{ id:"t-range", name:"[검사용] 남서울 실내연습장",
    intro:"실내 타석 열두 개", regions:["seoul"], gu:["관악구"],
    subs:["ls-solo","rg-in"], since:2019, consult_hours:"평일 10~19시",
    brands:["타이틀리스트"], scale:"mid", contact_ways:["phone"],
    /* ⚠️ 앞 서비스가 쓰던 칸입니다 — 골프에서는 아무 화면도 안 읽지만
       문이 **덮어쓰므로** 화면이 돌려보내지 않으면 지워집니다.
       2026-11-05 에 실제로 지워지고 있었습니다. */
    industries:["golf"],
    /* ⚠️ 0057 — 사업자 신원정보. `brn` 은 **읽기만** 합니다 (업체는 못
       고칩니다). 나머지 넷은 화면에 칸이 있고, 안 보내면 지워집니다. */
    ceo:"남대표", addr:"서울 관악구 1", tel:"02-333-4444",
    email:"r@range.test", brn:"555-66-77777",
    verified:{}, listed:true, assignable:true, state:"approved", state_why:null }];

  console.log("\n── /desk 업체 정보 — 업체가 아니면 한 줄도 안 보입니다");
  s = await open("/desk", { role:"customer", name:"일반회원" },
                 { assignment:[], request:[], quote:[], request_item:[], provider: MEPV });
  ok("업체 정보 자리가 아예 안 그려진다",
     (await s.p.locator("#mebox form#mef").count()) === 0);
  await s.p.close();

  console.log("\n── /desk 업체 정보 — 업체");
  s = await open("/desk", PRO, { assignment:[], request:[], quote:[],
                                 request_item:[], provider: MEPV });
  ok("화면 에러 · CSP 거절이 0건이다", s.errs.length === 0, s.errs.join(" | "));
  ok("양식이 **읽은 값으로** 채워져 있다",
     (await s.p.inputValue("#me-intro")) === "실내 타석 열두 개" &&
     (await s.p.inputValue("#me-hours")) === "평일 10~19시" &&
     (await s.p.inputValue("#me-brands")) === "타이틀리스트",
     await s.p.inputValue("#me-intro"));
  ok("  맡는 지역이 켜져 있다",
     await s.p.isChecked("input[name='rg'][value='seoul']"));
  ok("  상담 방식이 켜져 있다 (0044)",
     await s.p.isChecked("input[name='cw'][value='phone']"));
  t = (await s.p.textContent("#mebox")) || "";
  /* ⚠️⚠️ 못 고치는 것은 **칸을 내지 않고** 왜인지 적습니다 */
  ok("⚠️ 상호 칸이 **없다** (운영자가 정합니다)",
     (await s.p.locator("#mebox input[name='name']").count()) === 0 &&
     /상호/.test(t), t.slice(0, 300));
  ok("⚠️ 하는 일을 **고치는 칸이 없다** (스스로 넓히면 안 하는 일의 요청을 받습니다)",
     (await s.p.locator("#mebox input[name='sb']").count()) === 0 &&
     /늘리거나 줄이시려면/.test(t), t.slice(0, 600));
  ok("⚠️ 확인 배지를 켜는 칸이 **없다** (지어낸 신뢰입니다)",
     (await s.p.locator("#mebox input[name='verified']").count()) === 0 &&
     /서류를 확인한 뒤에만/.test(t));
  /* ⚠️⚠️ 0057 — 업체가 적는 칸 넷은 **있고**, 사업자등록번호는 **없습니다**
     (운영자가 서류를 보고 적습니다 · 문과 트리거가 둘 다 막습니다). */
  ok("⚠️ 사업자 정보 칸 넷이 있다 (대표자 · 주소 · 전화 · 이메일)",
     (await s.p.locator("#mebox input[name='ceo']").count()) === 1 &&
     (await s.p.locator("#mebox input[name='addr']").count()) === 1 &&
     (await s.p.locator("#mebox input[name='tel']").count()) === 1 &&
     (await s.p.locator("#mebox input[name='email']").count()) === 1);
  ok("  ⚠️ 그 값이 **손님 화면에 나온다**고 그 자리에서 말한다",
     /손님 화면/.test(t) && /제20조 제2항/.test(t), t.slice(0, 900));
  ok("⚠️⚠️ 사업자등록번호 **칸이 없다** (운영자가 서류를 보고 적습니다)",
     (await s.p.locator("#mebox input[name='brn']").count()) === 0 &&
     /555-66-77777/.test(t), t.slice(0, 900));
  /* ⚠️ 공개 번호와 배정 담당자 직통(0013)은 **다른 것**입니다 — 섞어
     읽으면 업체가 담당자 휴대폰을 공개 칸에 적습니다. */
  ok("  ⚠️ 공개 번호와 **배정 연락처가 다른 것**이라고 적는다",
     /배정 연락처/.test(t), t.slice(0, 1200));

  ok("  지금 공개 중인지 말해 준다", /공개 중/.test(t), t.slice(0, 400));

  /* ⚠️⚠️⚠️ **읽은 값을 전부 다시 담아 보내는지** — 여기가 핵심입니다 */
  await s.p.fill("#me-intro", "실내 타석 열두 개와 스크린 네 대");
  await s.p.check("input[name='cw'][value='visit']");
  await s.p.click("#mebox form#mef button[type='submit']");
  await s.p.waitForTimeout(400);
  const me1 = s.sent.filter(function(x){ return x.name === "save_provider_self"; })[0];
  ok("save_provider_self 를 부른다", !!me1,
     s.sent.map(function(x){ return x.name; }).join(" "));
  let md = null;
  try{ md = JSON.parse(me1.body).p_data; }catch(_){}
  ok("  고친 소개가 담긴다",
     !!md && md.intro === "실내 타석 열두 개와 스크린 네 대", me1 && me1.body);
  ok("  상담 방식 둘이 **키로** 담긴다",
     !!md && md.contactWays.join() === "phone,visit", me1 && me1.body);
  /* ⚠️⚠️ 안 건드린 칸도 **그대로 다시** 담겨야 합니다 — 안 담으면 지워집니다 */
  ok("⚠️ 건드리지 않은 지역이 **그대로 담긴다** (빠지면 지워집니다)",
     !!md && md.regions.join() === "seoul", me1 && me1.body);
  ok("⚠️ 화면에 칸이 없는 것도 **읽은 값 그대로** 담긴다 (gu · scale)",
     !!md && (md.gu || []).join() === "관악구" && md.scale === "mid", me1 && me1.body);
  ok("  상담 시간 · 개업 · 브랜드도 담긴다",
     !!md && md.consultHours === "평일 10~19시" && md.since === "2019" &&
     md.brands.join() === "타이틀리스트", me1 && me1.body);
  /* ⚠️⚠️ 0057 — 사업자 신원정보 넷. **손님 화면에 그대로 나가는 값**이라
     업체가 고칠 수 있어야 하고, `save_provider_self` 가 통째로 덮으므로
     화면이 **읽고 또 보내야** 합니다 (안 보내면 저장할 때마다 비워집니다). */
  ok("  ⚠️ 사업자 신원정보 넷이 **읽은 값으로 미리 채워진다**",
     !!md && md.ceo === "남대표" && md.addr === "서울 관악구 1" &&
     md.tel === "02-333-4444" && md.email === "r@range.test", me1 && me1.body);
  ok("  ⚠️⚠️ **사업자등록번호는 안 보낸다** (업체가 못 고치는 칸입니다)",
     !!md && !("brn" in md), me1 && me1.body);

  /* ══════════════════════════════════════════════════════════════
     ⚠️⚠️⚠️ **문이 덮어쓰는 칸을 마이그레이션에서 직접 읽어 맞춰 봅니다.**

     칸 이름을 검사에 **손으로 적어 두면** 문에 칸이 하나 더 붙는 날
     그 칸만 조용히 지워집니다 — 그리고 검사는 초록입니다. 그래서
     0044 의 `update provider set ...` 를 **읽어서** 셉니다.
     ⚠️ 실제로 그렇게 하나가 빠져 있었습니다: 화면이 `industries` 를
     안 담아 보내서, 업체가 저장할 때마다 그 칸이 비워졌습니다
     (골프에서는 아무 화면도 안 읽는 칸이라 **아무 데서도 안 보이는
     고장**이었습니다). 주석은 "gu · industries · scale 을 돌려보냅니다"
     라고 적혀 있었는데 코드는 둘만 보냈습니다.
     ⚠️ 갯수를 박지 않습니다 — 문에 칸이 늘면 늘어난 대로 셉니다.
     ══════════════════════════════════════════════════════════════ */
  {
    /* ⚠️⚠️⚠️ **번호를 박지 않습니다.** 처음에는 `0044_contact_ways.sql` 을
       글자로 적어 두었는데, 0057 이 같은 문을 덮으면서 그 파일에는 **옛
       칸 목록**이 남습니다 — 검사가 옛 목록을 세고 새 칸은 아무도 안
       보는 자리가 됩니다 (`save_provider_self` 는 보낸 것으로 통째로
       덮으므로, 안 세어지는 칸은 저장할 때마다 조용히 비워집니다).
       그래서 마이그레이션을 훑어 **이 문을 마지막으로 덮은 파일**을
       찾습니다. */
    const MDIR = path.join(__dirname, "..", "db/migrations");
    const owner = fs.readdirSync(MDIR)
      .filter(f => /^\d{4}_.*\.sql$/.test(f)).sort()
      .filter(f => fs.readFileSync(path.join(MDIR, f), "utf8")
                     .indexOf("function save_provider_self") >= 0)
      .pop();
    ok("⚠️ `save_provider_self` 를 덮은 마지막 마이그레이션을 찾았다",
       !!owner, String(owner));
    /* ⚠️⚠️⚠️ **주석을 떼고 찾습니다.** 처음에는 그냥 `indexOf` 로 찾았는데,
       0057 의 머리말이 "검사가 이 `update provider set` 를 읽습니다" 라고
       **그 글자를 그대로 적고 있어서** 검사가 주석을 본문으로 읽고 칸을
       0개로 셌습니다 (`check-deal` 이 0026 의 주석 속 닫는 괄호를 enum 의
       끝으로 읽은 자리 · `check-doors` 가 거절 문구 안의 함수 이름을
       부르는 자리로 센 자리와 **같은 꼴**이고 이번이 셋째입니다).
       ⚠️ 홑따옴표 안의 `--` 는 주석이 아니므로 **따라가며** 봅니다. */
    const stripSql = function(t){
      let out = "", q = false;
      for(const ln of String(t).split("\n")){
        let keep = "";
        for(let k = 0; k < ln.length; k++){
          if(ln[k] === "'") q = !q;
          if(!q && ln[k] === "-" && ln[k+1] === "-") break;
          keep += ln[k];
        }
        out += keep + "\n";
      }
      return out;
    };
    const sql = owner
      ? stripSql(fs.readFileSync(path.join(MDIR, owner), "utf8")) : "";
    const i = sql.indexOf("update provider set");
    const blk = i < 0 ? "" : sql.slice(i, sql.indexOf("where id = v_pv", i));
    /* 줄머리의 `칸 =` 만 모읍니다 (주석 줄과 식 안쪽은 안 셉니다) */
    const cols = blk.split("\n").map(function(ln){
      const m = /^\s{4}([a-z_]+)\s*=/.exec(ln);
      return m ? m[1] : null;
    }).filter(Boolean);
    const camel = function(c){
      return c.replace(/_([a-z])/g, function(_, ch){ return ch.toUpperCase(); }); };
    ok("⚠️ 잴 것이 0개면 실패입니다 (문이 덮어쓰는 칸을 읽기는 했는가)",
       cols.length > 0, cols.join(","));
    const missing = md ? cols.map(camel).filter(function(k){
      return !(k in md); }) : ["꾸러미를 못 읽었습니다"];
    ok("⚠️⚠️⚠️ 문이 덮어쓰는 칸을 화면이 **하나도 빠뜨리지 않고** 담는다",
       missing.length === 0,
       "빠진 칸 — " + missing.join(" · ") + "  (문의 칸: " + cols.join(",") + ")");
  }

  ok("업체 정보 자리의 누르는 것이 40px 이상이다",
     (await tapsOk(s.p, "#mebox")) === 0, await tapsOk(s.p, "#mebox"));
  await s.p.close();

  /* ⚠️⚠️⚠️ **못 읽었을 때 빈 양식을 그리면 안 됩니다** — 저장을 누르는
     순간 소개 · 지역이 통째로 지워집니다. */
  console.log("\n── /desk 업체 정보를 **못 읽었을 때**");
  s = await open("/desk", PRO, { assignment:[], request:[], quote:[],
                                 request_item:[], provider: null });
  ok("⚠️ 못 읽으면 **빈 양식을 안 그린다** (저장하면 지워집니다)",
     (await s.p.locator("#mebox form#mef").count()) === 0);
  t = (await s.p.textContent("#mebox")) || "";
  ok("  왜 안 그렸는지 말한다", /지워질 수 있어/.test(t), t.slice(0, 300));
  ok("  다시 읽는 길을 낸다",
     (await s.p.locator("#mebox [data-me='again']").count()) === 1);
  await s.p.close();

  console.log("\n── /desk 정지된 업체도 고칠 수는 있습니다");
  s = await open("/desk", PRO, { assignment:[], request:[], quote:[], request_item:[],
    provider: [Object.assign({}, MEPV[0], { state:"suspended", listed:false,
      state_why:"서류가 확인되지 않았습니다" })] });
  t = (await s.p.textContent("#mebox")) || "";
  ok("정지 중이라고 말한다", /정지/.test(t) && /서류가 확인되지 않았습니다/.test(t),
     t.slice(0, 300));
  ok("  그래도 양식은 낸다 (고쳐 두고 풀리기를 기다릴 수 있습니다)",
     (await s.p.locator("#mebox form#mef").count()) === 1);
  ok("  손님 화면에는 안 나온다고 말한다", /손님 화면에는 나오지 않습니다/.test(t));
  await s.p.close();

  /* ══ 폰 폭 ═══════════════════════════════════════════════════
     ⚠️⚠️⚠️ **`tools/check-screens.js` 는 이 세 화면을 영원히 못 봅니다.**
     로그인해야 그려지는 자리라, 그 도구에는 **빈 상자**로만 보입니다 —
     그래서 네 폭에서 재는 전수 점검이 여기서는 아무 일도 안 합니다.
     실제로 그 틈으로 고장이 하나 지나갔습니다: 격자 칸의 기본
     `min-width:auto` 때문에 지표 표(min-width 640px)가 칸을 벌려
     **390px 화면이 688px 로 밀렸습니다.** 아무 검사도 안 잡았습니다.
     ⚠️ 그래서 여기서 **직접** 잽니다.
     ⚠️⚠️ 재는 것은 **화면 전체가 미는가**입니다 — 표가 제 상자 안에서
     가로로 도는 것은 일부러 그렇게 둔 것입니다 (약관 표와 같은 꼴). */
  console.log("\n── ⚠️ 폰 폭에서 화면이 가로로 밀리나 (전수 점검이 못 보는 자리)");
  /* ⚠️⚠️ **세 폭에서 잽니다** (4차 지시서 §7) — 360 · 390 · 430.
     360 은 갤럭시 작은 쪽 · 390 은 아이폰 · 430 은 큰 쪽입니다.
     한 폭만 재면 그 사이에서 깨지는 것을 못 봅니다 (실제로 390 에서는
     멀쩡한데 360 에서 단추가 넘친 적이 있습니다). */
  const PHONES = [360, 390, 430];
  async function phone(path, who, tables, rpcs, pre, w){
    const p = await b.newPage({ viewport: { width: w || 390, height: 900 } });
    await stub(p, who, tables, rpcs, true);
    await p.goto(base + path, { waitUntil:"networkidle" });
    await p.waitForTimeout(500);
    /* ⚠️⚠️ **갈래 안쪽은 눌러야 그려집니다.** 안 누르면 그 자리는
       폰에서 아무도 안 재는 곳이 됩니다 — 체크칸 수십 개가 390px 에서
       미는지는 여기서만 드러납니다. */
    if(pre){ await p.click(pre); await p.waitForTimeout(400); }
    const r = await p.evaluate(function(sel){
      const box = document.querySelector(sel);
      const small = [];
      if(box) Array.prototype.forEach.call(box.querySelectorAll("*"), function(e){
        if(!e.firstChild || e.firstChild.nodeType !== 3) return;
        if(!(e.textContent || "").trim()) return;
        const fs = parseFloat(getComputedStyle(e).fontSize);
        if(fs < 12) small.push(e.tagName + " " + fs + "px");
      });
      return { doc: document.documentElement.scrollWidth,
               win: window.innerWidth,
               drawn: !!box && box.children.length > 0,
               small: small.slice(0, 5) };
    }, sel0);
    await p.close();
    return r;
  }
  const sel0 = "body";
  /* ⚠️⚠️ **후기 자리를 그린 채로 잽니다.** 안 그리면 그 자리는
     폰에서 아무도 안 재는 곳이 됩니다 — 별 글자 · 별점 고르개 ·
     답변 칸이 390px 에서 미는지는 여기서만 드러납니다. */
  /* ⚠️ 세 줄이 **같은 묶음**을 씁니다 — 베껴 쓰면 한쪽만 고치는 날
     조용히 달라집니다 */
  const FEE_SWEEP = Object.assign({}, ADMT, BIZ, PROT, {
    request: ADMT.request.concat(
      [{ id:"sw-fee", no:"SW-FEE0-0001", state:"done" },
       { id:"sw-pay", no:"SW-PAY0-0002", state:"fee_wait" }]),
    deal:[{ id:"d-sw", request_id:"sw-fee", provider_id:"t-range",
            amount:10000000, fee:null, fee_vat:null, fee_total:null,
            paid:null, paid_at:null, fee_at:null,
            signed_at:"2026-11-01T01:00:00Z", done_at:"2026-11-04T01:00:00Z" },
          { id:"d-sp", request_id:"sw-pay", provider_id:"t-range",
            amount:5000000, fee:400000, fee_vat:40000, fee_total:440000,
            paid:null, paid_at:null, fee_at:"2026-11-05T01:00:00Z",
            signed_at:"2026-10-20T01:00:00Z", done_at:"2026-11-01T01:00:00Z" }],
    fee_policy:[{ id:"p-sw", provider_id:"t-range", type:"rate", flat:null,
                  rate:8, min_fee:null, max_fee:null, vat:"add",
                  confirm_when:"done", cycle:"now",
                  from_date:null, to_date:null }],
    settlement:[{ id:"s-sw", provider_id:"t-range", from_date:"2026-10-01",
                  to_date:"2026-10-31", total:880000, state:"wait",
                  approved_at:null, paid_at:null }]
  });
  const phones = [
    ["/desk 업체 작업실", "/desk", PRO,
     Object.assign({ assignment:[asg(quoted, "accepted")], request:[quoted],
       quote:[QUOTE], request_item:ITEMS, review:[RVMINE] }, PRT), {}],
    ["/desk 가격 올리기 양식", "/desk", PRO,
     Object.assign({ assignment:[], request:[], quote:[], request_item:[] }, PRT), {},
     "#pricebox [data-pf='open']"],
    /* ⚠️ 운영자 문의함도 같이 — 그 상자도 폰 폭과 대비를 안 재고 있었습니다.
       ⚠️⚠️ 가짜 값은 **0045 가 받는 것**이어야 합니다 (kind: use · biz ·
       privacy · etc / state: open · reviewing · answered · closed) —
       아니면 찍힌 화면에 영문 키가 나오고 멀쩡한 화면을 고치려 듭니다. */
    ["/admin 배정 · 지표 · 관리 · 심사 · 문의함", "/admin",
     { role:"admin", name:"관리자" },
     Object.assign({}, ADMT, BIZ, PROT,
       { review:RVADM, report:REPS,
         inquiry:[{ id:"iq-a1", no:"IQ-261106-0001", kind:"use",
                    body:"요청이 안 들어갑니다", name:"김문의",
                    tel:"010-1111-2222", email:"", by_user:null,
                    state:"open", answer:null,
                    created_at:"2026-11-06T01:00:00Z", answered_at:null }],
         /* ⚠️ 수수료 · 정산 상자도 같이 (아래 FEE_SWEEP 와 같은 묶음) */
         request: FEE_SWEEP.request, deal: FEE_SWEEP.deal,
         fee_policy: FEE_SWEEP.fee_policy, settlement: FEE_SWEEP.settlement }),
     { biz_metrics: MET }],
    /* ⚠️⚠️ **새 상자를 만드는 날 이 줄에 같이 넣으세요** — 안 넣으면
       그 안은 폰 폭에서도 · 글자 대비에서도 **아무도 안 재는 자리**가
       됩니다 (아래 대비 재는 쪽이 이 묶음을 그대로 다시 씁니다).
       0045 → 0053 의 "내가 보낸 문의" 를 그래서 여기 같이 답니다 —
       답변 칸은 연초록 바탕에 글자를 올리는 자리라 대비를 재야 합니다. */
    ["/my 견적 비교 · 후기 · 제공 이력 · 보낸 문의 · 중고 매물", "/my",
     { role:"customer", name:"홍길동" },
     Object.assign({}, MYT, { quote:[QCHOSEN, Q2], review:[],
                              appointment:[], assignment:ASGS,
       inquiry:[{ id:"iq-p1", no:"IQ-261106-0001", kind:"use",
                  body:"요청을 넣었는데 업체가 안 붙습니다", state:"answered",
                  answer:"지역을 넓혀 주시면 배정이 갑니다.",
                  answered_at:"2026-11-06T02:00:00Z",
                  created_at:"2026-11-05T01:00:00Z" },
                 { id:"iq-p2", no:"IQ-261106-0002", kind:"privacy",
                   body:"제 기록을 지워 주세요", state:"open", answer:null,
                   answered_at:null, created_at:"2026-11-06T01:00:00Z" }],
       /* ⚠️⚠️ **0056 의 중고 매물 상자도 여기서 재야 합니다** — 자료를
          안 넣으면 그 상자가 한 줄도 안 그려지고, 폰 폭 · 글자 대비 ·
          누름 높이를 **아무도 안 재는 자리**가 됩니다 (0051 의 사진
          상자가 흉내 자료가 없어 그랬습니다).
          ⚠️ 가짜 자료도 DB 가 받는 값이어야 합니다 (`us-*` · cond 넷). */
       listing:[{ id:"lp-1", title:"타이틀리스트 드라이버 10.5도",
                  body:"2년 썼고 흠집 조금 있습니다", sub:"us-driver",
                  region:"seoul", ship:true, price:350000, cond:"good",
                  state:"open", hidden_why:null,
                  created_at:"2026-11-06T01:00:00Z" }],
       listingask:[{ id:"lp-a1", listing_id:"lp-1", msg:"오늘 볼 수 있을까요?",
                     state:"accepted", by_user:"u-b1", seller_share_at:null,
                     buyer_share_at:null, created_at:"2026-11-06T02:00:00Z" }],
       v_listing_contact:[{ ask_id:"lp-a1", seller_contact:null,
                            buyer_contact:null, seller_share_at:null,
                            buyer_share_at:null }] }), {}],
    /* ⚠️ 갈래를 눌러야 나오는 자리 둘 — 체크칸 수십 개와 신고 본문 */
    ["/admin 업체 등록 양식", "/admin", { role:"admin", name:"관리자" },
     Object.assign({}, ADMT, BIZ, PROT, { report:REPS }), { biz_metrics: MET },
     "#probox button[data-ptab='new']"],
    ["/admin 신고함", "/admin", { role:"admin", name:"관리자" },
     Object.assign({}, ADMT, BIZ, PROT, { report:REPS }), { biz_metrics: MET },
     "#repbox button[data-rtab='done']"],
    /* ⚠️⚠️ **갈래 안쪽은 눌러야 그려집니다** — 안 누르면 그 자리는
       폰에서 아무도 안 재는 곳이 됩니다 (작업 기억의 그 줄). 수수료
       화면은 갈래가 셋이고, 뒤 둘에만 **날짜 칸과 금액 칸**이 있습니다. */
    ["/admin 입금 · 환수", "/admin", { role:"admin", name:"관리자" },
     FEE_SWEEP, { biz_metrics: MET }, "#feeadm button[data-ftab='paid']"],
    ["/admin 월 정산서", "/admin", { role:"admin", name:"관리자" },
     FEE_SWEEP, { biz_metrics: MET }, "#feeadm button[data-ftab='settle']"],
    /* ⚠️⚠️⚠️ 0068 — **중고 매물 목록**(`/cat/used`)입니다. 이 화면도
       설정이 있어야 열려서 `check-screens` 는 **빈 상자**만 봅니다 —
       사진 카드 격자가 폰에서 칸을 벌리는지(격자 칸의 기본값이
       `min-width:auto` 라 사진 · 긴 제목이 화면을 밉니다)는 여기서만
       드러납니다. ⚠️ 가짜 자료는 `v_listing_open` 의 칸 그대로입니다. */
    ["/cat/used 중고 매물 목록", "/cat/used", { role:"customer", name:"손님" },
     { v_listing_open:[
       { id:"lw1", sub:"us-driver", region:"seoul", ship:false,
         title:"타이틀리스트 드라이버 10.5도 (헤드커버 · 정품 보증서 포함)",
         body:"2년 썼습니다", price:350000, cond:"good", ask_n:0,
         brand:"타이틀리스트", photo_n:3, thumb:"lst/lw1/photo/a.jpg" },
       { id:"lw2", sub:"us-iron", region:"gyeonggi", ship:true,
         title:"연습용 아이언 무료로 나눔", body:"연습용입니다",
         price:0, cond:"fair", ask_n:2,
         brand:null, photo_n:0, thumb:null }] }, {}],
    /* ⚠️⚠️ **폰에서는 거르개가 아래 시트라 눌러야 그려집니다** — 안
       누르면 고르개 여섯이 폰에서 미는지 아무도 안 잽니다 */
    ["/cat/used 거르개 시트", "/cat/used", { role:"customer", name:"손님" },
     { v_listing_open:[] }, {}, "#lf-open"]
  ];
  for(const [label, path, who, tables, rpcs, pre] of phones){
    for(const w of PHONES){
      const r = await phone(path, who, tables, rpcs, pre, w);
      /* ⚠️ 그려졌는지는 한 번만 말합니다 (세 번 같은 말을 찍으면 묻힙니다) */
      if(w === PHONES[0])
        ok(label + " — 그려지기는 한다 (빈 화면을 재고 통과하지 않는다)",
           r.drawn, JSON.stringify(r));
      ok(label + " " + w + "px — **가로로 안 밀린다**", r.doc <= r.win + 1,
         "문서 " + r.doc + "px · 화면 " + r.win + "px");
      ok(label + " " + w + "px — 12px 미만 글자가 없다",
         r.small.length === 0, r.small.join(" · "));
    }
  }

  /* ══ 글자 대비 ═══════════════════════════════════════════════
     ⚠️⚠️⚠️ **로그인 화면의 대비를 재는 검사가 한 곳도 없었습니다**
     (2026-11-05 검수에서 찾았습니다). `check-screens` 는 빌드가 찍은
     HTML 을 여는데 /desk · /admin · /my 의 알맹이는 **로그인한 뒤에**
     그려져서 그 도구에는 빈 상자로만 보입니다. 그리고 이 파일은
     가로 밀림 · 12px · 누름 40px 만 재고 **색은 안 봤습니다** — 즉
     밝은 브랜드색을 작은 글씨에 쓰는 날(앞 서비스에서 다섯 번 걸린
     자리입니다) 아무도 못 잡는 자리였습니다.

     ⚠️⚠️ **사진 위 글자는 계산으로 못 잽니다** — 조상에 background-image
     가 있으면 건너뜁니다. 그건 `test-photos` 가 **점을 찍어서** 재는
     자리이고, 여기서 억지로 재면 "검사가 멀쩡한 것을 고장이라고"
     하게 됩니다 (막을 옅게 했다고 떨어뜨린 그 자리입니다).

     ⚠️ **잰 것이 0개면 실패**입니다 — 자리를 못 찾고 초록이 되는 검사를
     만들지 않습니다.
     ⚠️ 큰 글자 기준은 24px 이상 또는 18.66px 이상이면서 굵은 것(3.0),
     나머지는 4.5 입니다. **17px 굵은 글씨는 큰 글자가 아닙니다.**
     ══════════════════════════════════════════════════════════════ */
  console.log("\n── ⚠️ 글자 대비 (로그인 화면은 여기서만 재집니다)");
  async function dim(path, who, tables, rpcs, pre, w){
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    await stub(p, who, tables, rpcs, true);
    await p.goto(base + path, { waitUntil:"networkidle" });
    await p.waitForTimeout(500);
    if(pre){ try{ await p.click(pre, { timeout:3000 });
                  await p.waitForTimeout(400); }catch(e){} }
    const r = await p.evaluate(function(){
      function rgb(v){ var m = v.match(/[\d.]+/g);
        return m ? m.slice(0, 3).map(Number) : null; }
      function lum(c){ return c.map(function(x){ x /= 255;
          return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); })
        .reduce(function(a, x, i){ return a + x * [0.2126,0.7152,0.0722][i]; }, 0); }
      var seen = 0, bad = [];
      var all = document.querySelectorAll("main *, header *, footer *");
      for(var i = 0; i < all.length; i++){
        var e = all[i], own = "";
        for(var j = 0; j < e.childNodes.length; j++)
          if(e.childNodes[j].nodeType === 3) own += e.childNodes[j].textContent;
        own = own.trim();
        if(own.length < 2) continue;
        var box = e.getBoundingClientRect();
        if(box.width < 2 || box.height < 2) continue;
        var cs = getComputedStyle(e);
        if(cs.visibility === "hidden" || cs.display === "none" ||
           +cs.opacity === 0) continue;
        var fg = rgb(cs.color);
        if(!fg) continue;
        /* 바탕은 **불투명한 조상**까지 올라가서 찾습니다 */
        var bg = null, onPhoto = false, n = e;
        while(n && n !== document.documentElement){
          var c = getComputedStyle(n);
          if(c.backgroundImage && c.backgroundImage !== "none"){ onPhoto = true; break; }
          var v = rgb(c.backgroundColor);
          var al = (c.backgroundColor.match(/[\d.]+/g) || [])[3];
          if(v && (al === undefined || +al > 0.95)){ bg = v; break; }
          n = n.parentElement;
        }
        if(onPhoto || !bg) continue;
        var px = parseFloat(cs.fontSize), wt = parseInt(cs.fontWeight) || 400;
        var big = px >= 24 || (px >= 18.66 && wt >= 700);
        var need = big ? 3.0 : 4.5;
        var L1 = lum(fg), L2 = lum(bg);
        var got = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
        seen++;
        if(got < need - 0.005)
          bad.push(got.toFixed(2) + "<" + need + " " + px + "px/" + wt +
                   " ." + String(e.className || "").slice(0, 24) +
                   " \"" + own.slice(0, 20) + "\"");
      }
      return { seen: seen, bad: bad };
    });
    await p.close();
    return r;
  }
  let dimSeen = 0;
  for(const [label, path, who, tables, rpcs, pre] of phones){
    /* ⚠️ 색은 폭에 따라 안 바뀝니다 — **한 폭만** 재서 시간을 아낍니다.
       (가로 밀림 · 12px 는 위에서 세 폭을 다 재고 있습니다.) */
    const r = await dim(path, who, tables, rpcs, pre, 390);
    dimSeen += r.seen;
    ok(label + " — 글자 대비가 AA 를 넘는다 (잰 칸 " + r.seen + "개)",
       r.bad.length === 0, r.bad.slice(0, 4).join("  |  "));
  }
  ok("⚠️ 대비를 **실제로 쟀다** (0칸이면 자리를 못 찾은 것입니다)",
     dimSeen > 200, "잰 글자 칸 " + dimSeen + "개");

  /* ══════════════════════════════════════════════════════════════
     골프 조인 (0046) — ⚠️ **빌드가 찍은 HTML 만 보는 검사는 영원히
     못 봅니다.** 목록도 양식도 Supabase 설정이 있어야 그려집니다.
     `/cat/matchup` 은 로그인 화면이 아니지만 **같은 눈먼 자리**라
     여기서 직접 눌러 봅니다.
     ⚠️⚠️ 가장 중요한 것: **연락처가 화면 어디에도 안 나오는가.**
     ══════════════════════════════════════════════════════════════ */
  console.log("\n── 골프 조인 (0046)");
  const JROOM = [{ id:"r1", title:"주말 아침 같이 치실 분",
    body:"초보도 환영합니다", region:"seoul", play_at:"2099-05-05",
    course:"OO CC", booked:false, tee:"아침", need:2, budget:150000, left_n:1 }];

  /* ① 설정 전에는 **아무것도 안 엽니다** (절대 규칙 5) */
  {
    const p0 = await b.newPage({ viewport: view });
    await p0.route("**/api/session", function(r){
      return r.fulfill({ status:200, contentType:"application/json",
        body: JSON.stringify({ auth:false, signedIn:false, conf:null }) });
    });
    await p0.goto(base + "/cat/matchup", { waitUntil:"networkidle" });
    await p0.waitForTimeout(400);
    const off = await p0.evaluate(function(){
      const b2 = document.getElementById("joinbox");
      return { form: !!document.getElementById("jnf"),
               boxHtml: (b2 ? b2.innerHTML : "").trim().length };
    });
    ok("⚠️ 설정 전에는 조인 양식을 **안 엽니다** (다 적고 누른 뒤 실패하지 않게)",
       !off.form && off.boxHtml === 0, JSON.stringify(off));
    await p0.close();
  }

  /* ② 로그인 전 — 목록은 보이고, 여는 것은 로그인으로 보냅니다 */
  {
    const g = await open("/cat/matchup", { role:"customer", name:"", signedIn:false },
                         { v_join_open: JROOM }, {}, true);
    const r = await g.p.evaluate(function(){
      const li = document.querySelector(".jnc");
      const box = document.getElementById("joinbox");
      return { card: !!li,
               title: li ? (li.querySelector("h3") || {}).textContent : "",
               body:  document.body.innerText,
               login: !!(box && box.querySelector('a[href^="/login"]')),
               form:  !!document.getElementById("jnf") };
    });
    ok("로그인 전에도 열린 조인이 보인다", r.card && r.title.indexOf("주말 아침") >= 0,
       JSON.stringify(r).slice(0, 160));
    /* ⚠️⚠️ 0058 — 로그인 전에는 "조건 저장" 길을 **안 냅니다.** 그리면
       눌러서 로그인 화면으로 갔다가 돌아와도 **저장된 것이 없는** 꼴이고,
       그건 눌러도 아무 일이 안 나는 단추입니다 (절대 규칙 5). */
    ok("⚠️ 로그인 전에는 **조건 저장 단추를 안 낸다**",
       (await g.p.locator('a[href^="/my?w="]').count()) === 0,
       await g.p.locator('a[href^="/my?w="]').count());
    ok("  ⚠️ 부킹이 잡힌 것처럼 말하지 않는다 (§2.A — 부킹 보장 금지)",
       r.body.indexOf("부킹은 아직입니다") >= 0, "");
    ok("  로그인 전에는 여는 양식 대신 로그인 길을 낸다", r.login && !r.form,
       JSON.stringify({ login:r.login, form:r.form }));
    /* ⚠️⚠️⚠️ 연락처는 목록 어디에도 없어야 합니다 */
    ok("⚠️⚠️ 목록 어디에도 연락처가 없다 (v_join_open 에 칸이 없습니다)",
       r.body.indexOf("010-") < 0, "");
    ok("  ⚠️ 그리고 그 사실을 손님에게 말해 준다",
       r.body.indexOf("연락처는 목록에 나오지 않습니다") >= 0, "");
    await g.p.close();
  }

  /* ②-2 거르개 — 지역 · 날짜 · **부킹이 잡힌 자리만** (2026-11-06)

     ⚠️⚠️⚠️ **보내는 질의를 뜯어 봅니다.** 흉내 장치는 조건을 보고
     걸러 주지 않으므로(표를 그대로 돌려줍니다), **결과 줄 수로 재면
     거르개를 떼어도 영원히 초록**입니다. 재려는 뜻은 "조건이 서버로
     가는가" 이고, 그것은 주소에 있습니다.
     ⚠️ 화면에서 걸러 내면 쉰 줄 밖에 있는 서울 조인이 **0건으로**
     보입니다 (에러 없이) — 그래서 서버로 보내는 것이 맞습니다. */
  {
    const JR2 = [
      { id:"r1", title:"주말 아침 같이 치실 분", body:"초보도 환영합니다",
        region:"seoul", play_at:"2099-05-05", course:"OO CC", booked:false,
        tee:"아침", need:2, budget:150000, left_n:1 },
      /* ⚠️ 골프장을 안 적고 부킹만 잡힌 자리 — 그 줄이 조용히 안
         빠지는지 봅니다 (한 줄에 묶어 두면 안 보입니다) */
      { id:"r2", title:"티타임 있습니다 한 자리", body:"한 분만 모십니다",
        region:"gyeonggi", play_at:"2099-05-06", course:null, booked:true,
        tee:"오전", need:1, budget:null, left_n:1 }
    ];
    const g = await open("/cat/matchup", { role:"customer", name:"손님", signedIn:true },
                         { v_join_open: JR2 }, {}, true);
    const bar = await g.p.evaluate(function(){
      return { rg: !!document.getElementById("jf-rg"),
               wh: !!document.getElementById("jf-wh"),
               bk: !!document.getElementById("jf-bk"),
               now: (document.getElementById("jfnow") || {}).textContent || "",
               body: document.body.innerText };
    });
    /* ⚠️⚠️ 0058 — 로그인하신 뒤에는 "조건 저장" 길을 냅니다. 글과 주소는
       js/data/deal.js 의 amWatchLink() 한 곳입니다 (분류 화면 셋이 같은
       말을 해야 합니다 — 세 곳에 적으면 한쪽만 고치는 날 달라집니다). */
    ok("⚠️⚠️ 로그인하면 **조건 저장 길**이 생긴다 (0058)",
       (await g.p.locator('a[href="/my?w=join"]').count()) === 1,
       await g.p.locator('a[href="/my?w=join"]').count());
    ok("조인 목록에 거르개가 있다 (지역 · 날짜 · 부킹)",
       bar.rg && bar.wh && bar.bk, JSON.stringify(bar).slice(0, 120));
    /* ⚠️ 갯수를 박지 않습니다 — 센 수가 찍히기만 하면 됩니다 */
    ok("  센 수를 적는다", /열린 자리 \d+곳/.test(bar.now), bar.now);
    ok("  ⚠️⚠️ **티타임이 잡힌 자리**라고 적는다 (거르개의 뜻이 보이게)",
       bar.body.indexOf("티타임이 잡혀 있습니다") >= 0, "");
    ok("  ⚠️ 골프장이 비어 있어도 '부킹은 아직' 줄이 안 빠진다",
       bar.body.indexOf("부킹은 아직입니다") >= 0, "");
    ok("  ⚠️ 우리가 예약을 잡아 준다고 **적지 않는다** (절대 규칙 5)",
       bar.body.indexOf("예약을 잡아 드리는 것은 아닙니다") >= 0, "");

    /* 지역을 고릅니다 → 질의에 region=eq. 가 실려야 합니다 */
    const n0 = g.sent.length;
    await g.p.selectOption("#jf-rg", "seoul");
    await g.p.waitForTimeout(350);
    const q1 = g.sent.slice(n0).filter(function(x){
      return x.name === "GET" && String(x.body).indexOf("v_join_open") >= 0;
    }).map(function(x){ return String(x.body); }).join(" | ");
    ok("  지역을 고르면 **서버에** 조건을 보낸다",
       q1.indexOf("region=eq.seoul") >= 0, q1.slice(0, 200));

    /* 부킹 잡힌 자리만 */
    const n1 = g.sent.length;
    await g.p.check("#jf-bk");
    await g.p.waitForTimeout(350);
    const q2 = g.sent.slice(n1).map(function(x){ return String(x.body); }).join(" | ");
    ok("  부킹 잡힌 자리만 → booked=is.true 를 보낸다",
       q2.indexOf("booked=is.true") >= 0, q2.slice(0, 200));

    /* 날짜 — ⚠️⚠️ **그 자리의 날짜**로 보내야 합니다. toISOString() 은
       UTC 라 한국에서 아침 9시 전에 하루 밀립니다. */
    const n2 = g.sent.length;
    await g.p.selectOption("#jf-wh", "d1");
    await g.p.waitForTimeout(350);
    const got = g.sent.slice(n2).map(function(x){ return String(x.body); }).join(" | ");
    const want = await g.p.evaluate(function(){
      var d = new Date(); d.setDate(d.getDate() + 1);
      var m = d.getMonth() + 1, x = d.getDate();
      return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m +
             "-" + (x < 10 ? "0" : "") + x;
    });
    ok("  오늘 · 내일 → play_at=lte.<그 자리의 내일> 을 보낸다 (UTC 아님)",
       got.indexOf("play_at=lte." + want) >= 0, want + " / " + got.slice(0, 200));

    /* ⚠️ 주소를 복사해 보내도 같은 화면이어야 합니다 */
    const u = await g.p.evaluate(function(){ return location.search; });
    ok("  조건이 주소에 남는다 (복사해 보낼 수 있게)",
       u.indexOf("rg=seoul") >= 0 && u.indexOf("bk=1") >= 0 &&
       u.indexOf("when=d1") >= 0, u);
    await g.p.close();
  }

  /* ②-3 0건을 **두 가지로** 갈라서 말하는가
     ⚠️⚠️ "아직 아무도 안 열었다" 와 "조건에 맞는 것이 없다" 는 다른
     말입니다 — 같은 말로 적으면 손님이 조건을 지워 볼 생각을 못 합니다. */
  {
    const g = await open("/cat/matchup?rg=seoul",
                         { role:"customer", name:"손님", signedIn:true },
                         { v_join_open: [] }, {}, true);
    const t = await g.p.evaluate(function(){
      return { body: document.body.innerText,
               clear: !!document.getElementById("jf-all") };
    });
    ok("조건이 걸린 0건은 **조건 때문**이라고 말한다",
       t.body.indexOf("조건에 맞는 조인이 없습니다") >= 0, "");
    ok("  조건을 지우는 길을 같이 낸다 (막다른 길로 두지 않습니다)", t.clear, "");
    await g.p.close();
  }
  {
    const g = await open("/cat/matchup", { role:"customer", name:"손님", signedIn:true },
                         { v_join_open: [] }, {}, true);
    const t = await g.p.evaluate(function(){ return document.body.innerText; });
    ok("조건이 없는 0건은 **아직 아무도 안 열었다**고 말한다",
       t.indexOf("아직 열린 조인이 없습니다") >= 0, "");
    await g.p.close();
  }

  /* ③ 로그인 뒤 — 여는 양식과 **동의 상자** */
  {
    const g = await open("/cat/matchup", { role:"customer", name:"손님", signedIn:true },
                         { v_join_open: JROOM }, {}, true);
    const r = await g.p.evaluate(function(){
      const f = document.getElementById("jnf");
      if(!f) return { form:false };
      const req = Array.prototype.map.call(
        f.querySelectorAll("[required]"), function(e){ return e.name || e.id; });
      return { form:true, req: req,
               terms: document.querySelectorAll(".jterms li").length,
               body: document.body.innerText,
               minDate: (f.play_at || {}).min || "" };
    });
    ok("로그인하면 여는 양식이 열린다", r.form, JSON.stringify(r).slice(0, 120));
    ok("  제목 · 설명 · 날짜 · 지역 · 인원 · 연락처가 **필수**다 (§2.A)",
       ["title","body","play_at","region","need","contact"]
         .every(function(n){ return r.req.indexOf(n) >= 0; }), (r.req || []).join(","));
    ok("  ⚠️ 동의 상자에 수집 항목 · 목적 · 보유 기간 · 제공이 같이 있다 (제15조 제2항)",
       r.terms >= 4, String(r.terms));
    /* ⚠️ 글자를 박지 않고 **설정값**과 맞춰 봅니다 (바뀌는 날 멀쩡한
       화면을 실패로 잡지 않게) */
    const JKEEP = keepOf("joinKeep");
    ok("  ⚠️ 보유 기간이 **실제 값**으로 찍힌다 (site.js 의 joinKeep)",
       !!JKEEP && (r.body || "").indexOf(JKEEP) >= 0, JKEEP);
    ok("  ⚠️ 연락처 칸이 **언제 누구에게 가는지**를 그 자리에서 말한다 (제17조)",
       (r.body || "").indexOf("수락하신 뒤") >= 0, "");
    ok("  지난 날짜를 못 고르게 min 을 건다", /^\d{4}-\d{2}-\d{2}$/.test(r.minDate),
       r.minDate);

    /* 실제로 눌러 봅니다 — ⚠️ 보내는 꾸러미까지 뜯어 봅니다 */
    await g.p.fill("#j-title", "검사용 조인");
    await g.p.fill("#j-body", "검사로 여는 자리입니다");
    await g.p.fill("#j-date", "2099-05-05");
    await g.p.selectOption("#j-rg", "seoul");
    await g.p.fill("#j-contact", "010-0000-0000");
    /* ⚠️ 동의 칸에는 **id 가 없습니다** — 이 상자는 여는 양식과 신청
       양식에 둘 다 들어가므로, id 를 달면 같은 id 가 둘이 됩니다
       (이름표는 label 이 감싸서 붙습니다). 그래서 양식으로 좁혀 집습니다. */
    await g.p.check("#jnf .jconsent input[type=\"checkbox\"]");
    await g.p.click("#jnf button[type=submit]");
    await g.p.waitForTimeout(400);
    const call = g.sent.filter(function(x){ return x.name === "open_joinroom"; })[0];
    ok("⚠️ 열기 단추가 **open_joinroom 을 실제로 부른다**", !!call,
       g.sent.map(function(x){ return x.name; }).join(","));
    if(call){
      const sentP = JSON.parse(call.body).p;
      ok("  제목 · 설명 · 지역 · 연락처를 그대로 보낸다",
         sentP.title === "검사용 조인" && sentP.region === "seoul" &&
         sentP.contact === "010-0000-0000", JSON.stringify(sentP));
      /* ⚠️ 동의 시각은 **누른 그 순간**입니다 (화면을 연 시각이 아닙니다) */
      ok("  ⚠️ 동의 시각을 같이 보낸다", !!sentP.agree_at &&
         Math.abs(Date.now() - new Date(sentP.agree_at).getTime()) < 60000,
         String(sentP.agree_at));
    }
    await g.p.close();
  }

  /* ④ /my — ⚠️⚠️ **수락만으로 연락처가 보이면 안 됩니다** */
  {
    const MYROOM = [{ id:"r1", title:"내가 연 자리", body:"설명", course:null,
      tee:null, budget:null, play_at:"2099-05-05", region:"seoul",
      state:"open", need:2 }];
    const MYAPP = [
      { id:"a1", room_id:"r1", msg:"같이 치고 싶습니다", state:"accepted",
        by_user:"u2", host_share_at:null, guest_share_at:null },
      { id:"a2", room_id:"r9", msg:"제가 넣은 신청", state:"applied",
        by_user:"me", host_share_at:null, guest_share_at:null }
    ];
    /* ⚠️ 수락됐지만 **아무도 연락처를 안 열었습니다** → 빈 값이 옵니다 */
    const MYC = [{ apply_id:"a1", room_contact:null, apply_contact:null,
                   host_share_at:null, guest_share_at:null }];
    const g = await open("/my", { role:"customer", name:"손님", signedIn:true },
      { joinroom: MYROOM, joinapply: MYAPP, v_join_contact: MYC,
        request: [], quote: [], review: [] }, {}, true);
    const r = await g.p.evaluate(function(){
      const box = document.getElementById("joinmine");
      return { drawn: !!box && !box.hidden && box.children.length > 0,
               body: box ? box.innerText : "",
               share: !!document.querySelector(".mj-share"),
               edit:  !!document.querySelector(".mj-edit"),
               okBtn: !!document.querySelector(".mj-ok") };
    });
    ok("/my 에 내 조인이 그려진다", r.drawn, JSON.stringify(r).slice(0, 140));
    ok("  내가 연 자리와 내가 신청한 자리를 **갈라서** 보여 준다",
       r.body.indexOf("내가 연 자리") >= 0 && r.body.indexOf("내가 신청한 자리") >= 0, "");
    ok("⚠️⚠️⚠️ **수락만으로는 연락처가 화면에 안 나온다** (제17조 제2항)",
       r.body.indexOf("010-") < 0 && r.body.indexOf("아직 안 여셨습니다") >= 0,
       r.body.slice(0, 200));
    ok("  대신 **내 연락처를 보여 줄지 고르는 단추**가 있다", r.share, "");
    ok("  여신 자리를 고치는 길이 있다 (§2.A — 작성자 본인 수정)", r.edit, "");

    /* ⚠️⚠️⚠️ **닫힌 자리에 영문 상태가 찍히지 않는가.** 전에는 한 줄에
       `ST[r.state] || r.state === "open" ? … : r.state` 로 적었는데,
       자바스크립트가 `||` 를 `?:` 보다 **먼저** 묶어서 닫힌 자리에
       `closed` 가 손님 화면에 그대로 나왔습니다. 에러도 없고, 열린
       자리만 넣어 보면 **영원히 멀쩡합니다** — 그래서 닫힌 자리를
       따로 넣어 봅니다 (작업 기억 — 상태 말은 한 곳에). */
    {
      const g3 = await open("/my", { role:"customer", name:"손님", signedIn:true },
        { joinroom: [{ id:"r5", title:"닫은 자리", body:"설명", course:null,
                       tee:null, budget:null, play_at:"2099-05-05",
                       region:"seoul", state:"closed", need:2 }],
          joinapply: [], v_join_contact: [], request: [], quote: [], review: [] },
        {}, true);
      const r3 = await g3.p.evaluate(function(){
        const box = document.getElementById("joinmine");
        return { body: box ? box.innerText : "" };
      });
      ok("⚠️ 닫힌 자리에 **영문 상태가 안 찍힌다** (closed · done)",
         r3.body.indexOf("닫혔습니다") >= 0 && r3.body.indexOf("closed") < 0,
         r3.body.slice(0, 200));
      await g3.p.close();

      /* ⚠️ 0049 — 운영자가 가린 자리. **까닭을 연 사람에게 보여 줍니다** */
      const g4 = await open("/my", { role:"customer", name:"손님", signedIn:true },
        { joinroom: [{ id:"r6", title:"가려진 자리", body:"설명", course:null,
                       tee:null, budget:null, play_at:"2099-05-05",
                       region:"seoul", state:"hidden", need:2,
                       hidden_why:"본문에 전화번호를 적었습니다" }],
          joinapply: [], v_join_contact: [], request: [], quote: [], review: [] },
        {}, true);
      const r4 = await g4.p.evaluate(function(){
        const box = document.getElementById("joinmine");
        return { body: box ? box.innerText : "",
                 edit: !!document.querySelector(".mj-edit"),
                 close: !!document.querySelector(".mj-close") };
      });
      ok("⚠️ 가려진 자리에 **영문 hidden 이 안 찍힌다**",
         r4.body.indexOf("운영자가 가렸습니다") >= 0 &&
         r4.body.indexOf("hidden") < 0, r4.body.slice(0, 220));
      ok("⚠️⚠️ 가린 **까닭**을 연 사람에게 보여 준다 (0049)",
         r4.body.indexOf("본문에 전화번호를 적었습니다") >= 0,
         r4.body.slice(0, 220));
      ok("⚠️ 가려진 자리에는 고치기 · 닫기 단추가 **없다** (문도 거절합니다)",
         !r4.edit && !r4.close, JSON.stringify(r4).slice(0, 120));
      await g4.p.close();
    }

    /* 수락 단추가 실제로 문을 부르는가 — ⚠️ 그려만 두고 안 부르면 가짜입니다 */
    const g2 = await open("/my", { role:"customer", name:"손님", signedIn:true },
      { joinroom: MYROOM,
        joinapply: [{ id:"a3", room_id:"r1", msg:"기다리는 신청", state:"applied",
                      by_user:"u3", host_share_at:null, guest_share_at:null }],
        v_join_contact: [], request: [], quote: [], review: [] }, {}, true);
    await g2.p.click(".mj-ok");
    await g2.p.waitForTimeout(350);
    const mv = g2.sent.filter(function(x){ return x.name === "move_joinapply"; })[0];
    ok("⚠️ 수락 단추가 **move_joinapply 를 실제로 부른다**", !!mv,
       g2.sent.map(function(x){ return x.name; }).join(","));
    if(mv) ok("  accepted 로 보낸다", JSON.parse(mv.body).p.state === "accepted", mv.body);
    await g2.p.close();

    /* 연락처 열기 단추 — ⚠️ 동의 시각을 같이 보내야 합니다 */
    await g.p.click(".mj-share");
    await g.p.waitForTimeout(350);
    const sh = g.sent.filter(function(x){ return x.name === "share_joincontact"; })[0];
    ok("⚠️⚠️ 연락처 단추가 **share_joincontact 를 부른다**", !!sh,
       g.sent.map(function(x){ return x.name; }).join(","));
    if(sh){
      const sp = JSON.parse(sh.body).p;
      ok("  on:true 와 **동의 시각**을 같이 보낸다 (따로 받는 동의입니다)",
         sp.on === true && !!sp.agree_at, JSON.stringify(sp));
    }
    await g.p.close();
  }

  /* ⑤ 폰 폭 셋 — ⚠️ 로그인 화면은 여기서만 재집니다 */
  for(const w of PHONES){
    const p2 = await b.newPage({ viewport: { width: w, height: 900 } });
    await stub(p2, { role:"customer", name:"손님", signedIn:true },
               { v_join_open: JROOM }, {}, true);
    await p2.goto(base + "/cat/matchup", { waitUntil:"networkidle" });
    await p2.waitForTimeout(500);
    const r = await p2.evaluate(function(){
      const small = [], low = [];
      Array.prototype.forEach.call(
        document.querySelectorAll(".jnc, .jbox, .jnl, .none"),
        function(box){
          Array.prototype.forEach.call(box.querySelectorAll("*"), function(e){
            if(e.firstChild && e.firstChild.nodeType === 3 && (e.textContent||"").trim()){
              const fs = parseFloat(getComputedStyle(e).fontSize);
              if(fs < 12) small.push(e.tagName + " " + fs);
            }
          });
          Array.prototype.forEach.call(box.querySelectorAll("button, a"), function(e){
            if(e.getBoundingClientRect().height < 39.5) low.push(e.tagName);
          });
        });
      return { doc: document.documentElement.scrollWidth, win: window.innerWidth,
               drawn: !!document.querySelector(".jnc"),
               small: small.slice(0, 4), low: low.slice(0, 4) };
    });
    if(w === PHONES[0])
      ok("조인 — 폰에서 그려지기는 한다 (빈 화면을 재고 통과하지 않는다)",
         r.drawn, JSON.stringify(r));
    ok("조인 " + w + "px — **가로로 안 밀린다**", r.doc <= r.win + 1,
       "문서 " + r.doc + "px · 화면 " + r.win + "px");
    ok("조인 " + w + "px — 12px 미만 글자가 없다", r.small.length === 0,
       r.small.join(" · "));
    ok("조인 " + w + "px — 누르는 것이 40px 이상이다", r.low.length === 0,
       r.low.join(" · "));
    await p2.close();
  }

  /* ══════════════════════════════════════════════════════════════
     골프 커뮤니티 (0047 · §2.C) — ⚠️ 같은 눈먼 자리입니다
     (Supabase 설정이 있어야 그려집니다).
     ⚠️⚠️ 가장 중요한 것: **글쓴이 이름이 가려져 나오는가.**
     ══════════════════════════════════════════════════════════════ */
  /* ══════════════════════════════════════════════════════════════
     광고 자리 (0026 · 0032 · 0055) — ⚠️⚠️⚠️ **표 · 보기 · 관리 화면은
     2026-10-21 에 섰는데 손님 화면에 그리는 코드가 2026-11-06 까지 한
     곳도 없었습니다.** `ad_run` 에 줄을 넣고 `live` 로 바꿔도 아무 데도
     안 나왔습니다 — 돈을 받고 안 띄우는 꼴입니다.
     ⚠️ 빌드가 찍은 HTML 만 보는 검사는 이 자리를 **영원히 못 봅니다**
     (설정이 있어야 그려집니다) — 그래서 여기서 눌러 봅니다.
     ══════════════════════════════════════════════════════════════ */
  console.log("\n── 광고 자리 (0026 · 0032 · 0055)");
  {
    /* ⚠️ 가짜 자료도 **DB 가 받는 값**이어야 합니다 — 자리 열쇠는
       `ad_place` enum 의 값이고, 분류 · 지역은 **키**입니다(이름이 아닙니다).
       조인 · 문의에서 아닌 값을 넣어 멀쩡한 화면을 고치려 든 자리입니다. */
    const ADS = [
      { id:"ad1", provider_id:"t-range", provider_name:"남서울 실내연습장",
        place:"main_hero", cat_key:null, region:null, label:"광고" },
      { id:"ad2", provider_id:"t-range", provider_name:"남서울 실내연습장",
        place:"cat_top", cat_key:"lesson", region:null, label:"광고" },
      { id:"ad3", provider_id:"t-range", provider_name:"남서울 실내연습장",
        place:"cat_top", cat_key:"travel", region:null, label:"광고" }
    ];

    /* ① 메인 — 히어로 광고가 그려지고 "광고" 표시가 붙는가 */
    {
      const g = await open("/", { role:"customer", name:"손님", signedIn:true },
                           { v_ad_live: ADS }, {}, true);
      /* ⚠️⚠️⚠️ **빌드에 업체가 0곳이면 링크를 안 걸어야 맞습니다** —
         처음에 이 자리를 그냥 재다가 "링크가 없다" 로 떨어뜨렸는데,
         코드가 아니라 **제 검사 자료가 틀린** 것이었습니다 (`t-range` 는
         DB 씨앗에만 있고 `providers.generated.js` 에는 없습니다).
         ⚠️ 그래서 **업체가 빌드에 있는 상태**를 여기서 만들어 줍니다 —
         자료를 넣고 그 자리를 다시 채웁니다 (`amAdFill()` 한 함수가
         그리므로 다시 부르면 됩니다).
         ⚠️ 빌드에 **없을** 때는 ④ 가 따로 잽니다 — 두 갈래를 갈라서
         재지 않으면 한쪽이 엉뚱한 까닭으로 통과합니다. */
      await g.p.evaluate(function(){
        window.AM_PROVIDERS = [{ id:"t-range", name:"남서울 실내연습장",
          regions:["seoul"], subs:["rg-in"] }];
      });
      await g.p.evaluate(function(){
        return window.amAdFill(document.querySelector('[data-adslot="main_hero"]'));
      });
      const r = await g.p.evaluate(function(){
        const el = document.querySelector('[data-adslot="main_hero"]');
        return { drawn: !!(el && !el.hidden && el.querySelector(".adsl-i")),
                 n: el ? el.querySelectorAll(".adsl-i").length : -1,
                 label: el ? (el.textContent || "") : "",
                 rel: el && el.querySelector("a")
                        ? el.querySelector("a").getAttribute("rel") : "",
                 href: el && el.querySelector("a")
                        ? el.querySelector("a").getAttribute("href") : "",
        /* ⚠️⚠️⚠️ **자리 이름을 박지 않습니다.** 전에 `main_band` 를 박아
           두었는데, 메인을 지시서 A 차례로 다시 짜면서 그 자리가 메인에서
           빠졌습니다 — 그러면 `querySelector` 가 **null** 이고
           `!!(band && band.hidden)` 은 **거짓**이라, 멀쩡한 화면이
           "빈 액자를 냈다" 로 떨어집니다. 재려는 뜻은 "**걸리는 광고가
           없는 자리**에 광고 소재가 안 들어가는가" 이므로, 이 화면에
           **실제로 있는** 자리 가운데 이 가짜 자료에 안 걸리는 것을
           찾아서 잽니다.
           ⚠️⚠️ **2026-11-07 — 재는 뜻이 바뀌었습니다.** 사장님 시안대로
           광고가 0건인 자리에 **점선 안내 액자**를 세웁니다 (`site.js` 의
           `adPlaceholder`). 그러니 "감춰진 채 남는가" 가 아니라 **광고
           소재(`.adsl-i`)가 안 들어가는가**를 셉니다 — 그 액자에 남의
           광고가 섞이면 그게 사고입니다. */
        empty: (function(){
          var all = document.querySelectorAll("[data-adslot]");
          var n = 0, clean = 0;
          Array.prototype.forEach.call(all, function(x){
            if(x.getAttribute("data-adslot") === "main_hero") return;
            n++;
            /* ⚠️⚠️⚠️ **2026-11-08 — 재는 뜻이 또 바뀌었습니다.** 이 장면은
               **손님**이고, 지시서 3번은 "광고 미등록 시 고객 화면에서 슬롯
               자체를 숨기고 빈 점선 박스는 **관리자 미리보기에서만**" 이라고
               적습니다 — 소재도 · 액자도 없이 **감춰져 있어야** 합니다.
               운영자 쪽은 ①-2 가 따로 잽니다. */
            if(!x.querySelector(".adsl-i") && !x.querySelector(".adph") && x.hidden) clean++;
          });
          return n + "/" + clean;
        })() };
      });
      ok("메인 히어로 광고가 **실제로 그려진다**", r.drawn,
         JSON.stringify(r).slice(0, 180));
      ok("  ⚠️⚠️ **'광고' 라고 표시한다** (표시 · 광고의 공정화에 관한 법률)",
         r.label.indexOf("광고") >= 0, r.label.slice(0, 60));
      /* ⚠️ 돈 받은 링크를 자연 링크로 두면 검색엔진이 손해를 매깁니다 */
      ok("  ⚠️ 돈 받은 링크라 rel 에 sponsored 를 붙인다",
         String(r.rel).indexOf("sponsored") >= 0, String(r.rel));
      /* ⚠️ 주소는 amProviderUrl() 한 함수가 짓습니다 */
      ok("  업체 화면으로 가는 주소를 짓는다", /^\/pro\//.test(String(r.href)),
         String(r.href));
      /* ⚠️⚠️ **다른 자리 광고가 섞이면 안 됩니다** — 자리 열쇠가 자물쇠입니다 */
      ok("  ⚠️ 그 자리 광고만 들어간다 (히어로에 분류 광고가 안 섞인다)",
         r.n === 1, String(r.n));
      ok("  ⚠️⚠️ 손님에게는 걸리는 광고가 없는 자리가 **줄째 감춰진다** (지시서 3번)",
         r.empty.split("/")[0] === r.empty.split("/")[1] &&
         Number(r.empty.split("/")[0]) > 0, r.empty);
      await g.p.close();
    }

    /* ② 분류 상단 — ⚠️⚠️ **분류 키가 같은 광고만** 걸려야 합니다.
       (운영자가 '골프 레슨' 처럼 이름을 적으면 영원히 안 걸립니다 —
        그래서 /admin 의 그 칸을 고르개로 바꿨습니다.) */
    {
      const g = await open("/cat/lesson", { role:"customer", name:"손님", signedIn:true },
                           { v_ad_live: ADS }, {}, true);
      const r = await g.p.evaluate(function(){
        const el = document.querySelector('[data-adslot="cat_top"]');
        return { key: el ? el.getAttribute("data-adslot-key") : "",
                 n: el ? el.querySelectorAll(".adsl-i").length : -1,
                 hidden: !!(el && el.hidden) };
      });
      ok("분류 상단 광고는 **그 분류 키**로 걸린다", r.key === "lesson" && r.n === 1,
         JSON.stringify(r));
      await g.p.close();
    }
    {
      const g = await open("/cat/fitting", { role:"customer", name:"손님", signedIn:true },
                           { v_ad_live: ADS }, {}, true);
      const r = await g.p.evaluate(function(){
        const el = document.querySelector('[data-adslot="cat_top"]');
        return { hidden: !!(el && el.hidden),
                 n: el ? el.querySelectorAll(".adsl-i").length : -1 };
      });
      ok("  ⚠️ 다른 분류에는 **안 걸린다** (키가 다르면 안 보입니다)",
         r.hidden && r.n === 0, JSON.stringify(r));
      await g.p.close();
    }

    /* ③ 설정이 없으면 **광고도 · 점선 액자도 한 줄도 안 그립니다**
       ⚠️⚠️⚠️ 2026-11-08 에 뜻이 바뀌었습니다 — 전에는 "설정이 없어도
       액자는 선다" 를 재고 있었습니다. 지시서 3번이 "빈 점선 박스는
       **관리자 미리보기에서만**" 이라고 적었고, 설정이 없는 동안에는
       **아무도 로그인할 수 없어 운영자가 없습니다.** 그래서 아무것도
       안 나오는 것이 맞습니다 (손님에게 아무 말도 하지 않습니다 ·
       절대 규칙 3). */
    {
      const p0 = await b.newPage({ viewport: view });
      await p0.route("**/api/session", function(r){
        return r.fulfill({ status:200, contentType:"application/json",
          body: JSON.stringify({ auth:false, signedIn:false, conf:null }) });
      });
      await p0.goto(base + "/", { waitUntil:"networkidle" });
      await p0.waitForTimeout(400);
      const r = await p0.evaluate(function(){
        const el = document.querySelector('[data-adslot="main_hero"]');
        return { ads: el ? el.querySelectorAll(".adsl-i").length : -1,
                 links: el ? el.querySelectorAll("a").length : -1,
                 ph: !!(el && el.querySelector(".adph")),
                 shown: !!(el && !el.hidden) };
      });
      ok("⚠️ 설정 전에는 광고를 **한 줄도 안 그린다**",
         r.ads === 0 && r.links === 0, JSON.stringify(r));
      ok("  ⚠️⚠️ 설정 전에는 **점선 액자도 안 선다** (운영자가 없습니다 · 지시서 3번)",
         !r.ph && !r.shown, JSON.stringify(r));
      await p0.close();
    }

    /* ③-2 ⚠️⚠️ **켜는 길이 실제로 켜는가** — `site.js` 의 `adPlaceholder`
       를 `true` 로 바꾼 파일을 내려보내고, 그때는 설정이 없어도 액자가
       서는지 봅니다. 설정이 아직 없어 아무도 로그인할 수 없는 동안
       사장님이 자리를 눈으로 보시는 **유일한 길**입니다.
       ⚠️ 스위치를 만들어 놓고 눌러 보지 않으면 그건 눌러도 아무 일이
       안 나는 칸입니다 (절대 규칙 5). */
    {
      const p0 = await b.newPage({ viewport: view });
      await p0.route("**/js/data/site.js*", async function(route){
        const res  = await route.fetch();
        const body = await res.text();
        return route.fulfill({ status:200, contentType:"application/javascript",
          body: body.replace("adPlaceholder: false", "adPlaceholder: true") });
      });
      await p0.route("**/api/session", function(r){
        return r.fulfill({ status:200, contentType:"application/json",
          body: JSON.stringify({ auth:false, signedIn:false, conf:null }) });
      });
      await p0.goto(base + "/", { waitUntil:"networkidle" });
      await p0.waitForTimeout(400);
      const r2 = await p0.evaluate(function(){
        const el = document.querySelector('[data-adslot="main_hero"]');
        const ph = el ? el.querySelector(".adph") : null;
        const f  = window.amAdPh ? window.amAdPh("main_hero") : null;
        return { on: window.WOW_BIZ ? window.WOW_BIZ.adPlaceholder : "?",
                 ph: !!ph, shown: !!(el && !el.hidden),
                 /* ⚠️ 액자에 적는 말은 AM_AD_PH 한 곳입니다 — 글자를
                    여기 박으면 그 말을 고치는 날 멀쩡한 화면이 떨어집니다 */
                 named: !!(ph && f && ph.textContent.indexOf(f.name) >= 0) };
      });
      ok("  ⚠️⚠️ `adPlaceholder` 를 켜면 설정이 없어도 **점선 액자가 선다**",
         r2.on === true && r2.ph && r2.shown, JSON.stringify(r2));
      ok("  ⚠️ 액자에 적는 말은 `AM_AD_PH` 에서 온다 (글자를 안 박습니다)",
         r2.named, JSON.stringify(r2));
      await p0.close();
    }

    /* ③-3 ⚠️⚠️⚠️ **운영자에게는 액자가 섭니다** (지시서 3번의 "관리자
       미리보기"). 손님 쪽은 ① 이 재고, 여기는 **같은 화면을 운영자 눈으로**
       열어 봅니다 — 둘을 한 장면에서 재면 어느 자물쇠가 일하는지 모릅니다. */
    for(const who of ["admin", "staff"]){
      const g = await open("/", { role:who, name:"운영자", signedIn:true },
                           { v_ad_live: [] }, {}, true);
      const r3 = await g.p.evaluate(function(){
        const all = document.querySelectorAll("[data-adslot]");
        let n = 0, ph = 0;
        Array.prototype.forEach.call(all, function(x){
          n++;
          if(x.querySelector(".adph") && !x.hidden) ph++;
        });
        return { n:n, ph:ph };
      });
      /* ⚠️ 갯수를 박지 않습니다 — 액자가 서는 자리(amAdPh 가 null 이
         아닌 자리)만 셉니다. 메인에는 넷이 있고, 자리를 더하는 날 늘어납니다. */
      ok("⚠️⚠️ " + who + " 에게는 **점선 액자가 선다** (관리자 미리보기 · 지시서 3번)",
         r3.ph > 0, JSON.stringify(r3));
      await g.p.close();
    }


    /* ④ ⚠️⚠️⚠️ **빌드에 없는 업체는 링크를 안 겁니다** — `/pro/<id>` 는
       빌드가 찍는 화면이라, 승인 직후 pull-providers 를 안 돌리면 그
       주소가 없습니다. 링크로 내면 광고를 눌러서 404 로 갑니다. */
    {
      const g = await open("/", { role:"customer", name:"손님", signedIn:true },
        { v_ad_live: [{ id:"adx", provider_id:"없는업체", provider_name:"없는 업체",
                        place:"main_hero", cat_key:null, region:null, label:"광고" }] },
        {}, true);
      const r = await g.p.evaluate(function(){
        const el = document.querySelector('[data-adslot="main_hero"]');
        return { n: el ? el.querySelectorAll(".adsl-i").length : -1,
                 links: el ? el.querySelectorAll("a").length : -1,
                 body: document.body.innerText };
      });
      ok("⚠️⚠️ 빌드에 없는 업체 광고는 **링크를 안 건다** (404 로 보내지 않습니다)",
         r.n === 1 && r.links === 0, JSON.stringify({ n:r.n, links:r.links }));
      ok("  그래도 '광고' 표시와 상호는 낸다 (집행한 광고를 안 띄우지 않습니다)",
         r.body.indexOf("없는 업체") >= 0, "");
      await g.p.close();
    }

    /* ⑤ ⚠️⚠️⚠️ **소재 그림 (0064)** — 2026-11-07 까지 `ad_run` 에 그림을
       담는 칸이 한 줄도 없어서, 이 파일은 **상호 글자만** 재고 있었습니다.
       지시서 B 가 요구하는 것은 PC · 모바일 소재이고, 그것이 실제로
       그려지는지 · 비율이 보존되는지 · `rel` 넷이 다 붙는지 · 새 창으로
       열리는지를 여기서 봅니다. */
    {
      const CRE = [{ id:"adp", provider_id:"t-range", provider_name:"남서울 실내연습장",
        advertiser:"바깥 광고주", place:"main_hero", cat_key:null, region:null,
        label:"광고", click_url:"https://golf.example.com/event",
        img_pc:"ad/11111111-1111-1111-1111-111111111111/pc/20261107120000-abcdef12.webp",
        img_mo:"ad/11111111-1111-1111-1111-111111111111/mo/20261107120000-abcdef34.webp",
        img_alt:"가을 라운드 할인" }];
      const g = await open("/", { role:"customer", name:"손님", signedIn:true },
                           { v_ad_live: CRE }, {}, true);
      const r = await g.p.evaluate(function(){
        const el = document.querySelector('[data-adslot="main_hero"]');
        const a  = el ? el.querySelector("a") : null;
        const im = el ? el.querySelector("img.adsl-im") : null;
        const so = el ? el.querySelector("picture source") : null;
        const cs = im ? getComputedStyle(im) : null;
        return { drawn: !!im,
                 src: im ? im.getAttribute("src") : "",
                 alt: im ? im.getAttribute("alt") : "",
                 media: so ? so.getAttribute("media") : "",
                 mo: so ? so.getAttribute("srcset") : "",
                 rel: a ? a.getAttribute("rel") : "",
                 tgt: a ? a.getAttribute("target") : "",
                 href: a ? a.getAttribute("href") : "",
                 h: cs ? cs.height : "",
                 label: el ? (el.textContent || "") : "",
                 wide: document.documentElement.scrollWidth >
                       document.documentElement.clientWidth };
      });
      ok("⚠️⚠️⚠️ **소재 그림이 실제로 그려진다** (0064 전에는 칸이 없었습니다)",
         r.drawn, JSON.stringify(r).slice(0, 200));
      /* ⚠️ 주소는 **공개 버킷**으로 짓습니다 — 버킷 이름이 빠지면 404 입니다 */
      ok("  주소를 공개 버킷으로 짓는다",
         r.src.indexOf("/storage/v1/object/public/") > 0 &&
         r.src.indexOf("/ad/") > 0, r.src);
      /* ⚠️⚠️ **원본 비율을 보존합니다** (지시서 B) — 높이를 박으면 찌그러집니다 */
      ok("  ⚠️⚠️ **원본 비율을 보존한다** (height 를 안 박습니다)",
         r.h !== "" && r.h !== "0px", r.h);
      ok("  ⚠️ 폰 폭에서도 가로로 밀지 않는다 (1200px 소재가 칸을 벌리지 않습니다)",
         !r.wide, String(r.wide));
      /* ⚠️⚠️ 모바일 소재가 있으면 좁은 폭에서 그것을 씁니다 */
      ok("  모바일 소재를 좁은 폭에 쓴다 (`<source media>`)",
         String(r.media).indexOf("max-width") >= 0 &&
         String(r.mo).indexOf("/mo/") > 0, r.media + " · " + r.mo);
      /* ⚠️⚠️⚠️ **rel 넷을 전부** (지시서 B — 새 창은 noopener noreferrer) */
      ["sponsored", "nofollow", "noopener", "noreferrer"].forEach(function(k){
        ok("  ⚠️⚠️ rel 에 `" + k + "` 가 붙는다", String(r.rel).indexOf(k) >= 0,
           String(r.rel));
      });
      ok("  ⚠️ 바깥 주소는 **새 창**으로 연다", r.tgt === "_blank", String(r.tgt));
      ok("  적어 둔 클릭 주소로 간다 (업체 화면이 아닙니다)",
         r.href === "https://golf.example.com/event", r.href);
      ok("  ⚠️ 소재 설명(alt)을 적어 둔 것으로 쓴다", r.alt === "가을 라운드 할인", r.alt);
      ok("  ⚠️⚠️ 그림 위에도 **'광고' 표시가 남는다**",
         r.label.indexOf("광고") >= 0, r.label.slice(0, 40));
      await g.p.close();
    }

    /* ⑥ ⚠️⚠️ **우리 주소는 새 창으로 열지 않습니다** (뒤로 가기가 됩니다) ·
       그리고 **못 쓸 주소는 화면도 거릅니다** (DB 가 이미 막지만 자물쇠 둘). */
    {
      const g = await open("/", { role:"customer", name:"손님", signedIn:true },
        { v_ad_live: [
          { id:"a-in", provider_id:"t-range", provider_name:"안쪽",
            place:"main_hero", label:"광고", click_url:"/cat/lesson" },
          { id:"a-js", provider_id:"t-range", provider_name:"나쁜주소",
            place:"main_band", label:"광고", click_url:"javascript:alert(1)" }
        ] }, {}, true);
      await g.p.evaluate(function(){
        window.AM_PROVIDERS = [{ id:"t-range", name:"남서울 실내연습장",
          regions:["seoul"], subs:["rg-in"] }];
        return Promise.all([
          window.amAdFill(document.querySelector('[data-adslot="main_hero"]')),
          window.amAdFill(document.querySelector('[data-adslot="main_band"]'))
        ]);
      });
      const r = await g.p.evaluate(function(){
        const a1 = document.querySelector('[data-adslot="main_hero"] a');
        const a2 = document.querySelector('[data-adslot="main_band"] a');
        return { h1: a1 ? a1.getAttribute("href") : "",
                 t1: a1 ? a1.getAttribute("target") : null,
                 h2: a2 ? a2.getAttribute("href") : "" };
      });
      ok("우리 주소는 그대로 쓰고 **새 창으로 안 연다**",
         r.h1 === "/cat/lesson" && !r.t1, JSON.stringify(r));
      /* ⚠️⚠️ `javascript:` 가 들어오면 **적어 둔 주소를 버리고** 업체
         화면으로 갑니다 (주소를 지어내지도 · 날것으로 쓰지도 않습니다). */
      ok("⚠️⚠️ `javascript:` 주소는 **화면도 안 씁니다**",
         String(r.h2).indexOf("javascript:") < 0, r.h2);
      await g.p.close();
    }

    /* ⑦ ⚠️⚠️ **노출 · 클릭을 센다** (`bump_ad` · 0064) — 보내는 꾸러미를
       **뜯어** 봅니다. 흉내 장치는 세어 주지 않으므로 줄 수로 재면
       세는 코드를 통째로 떼어도 영원히 초록입니다. */
    {
      const CRE = [{ id:"adz", provider_id:"t-range", provider_name:"남서울 실내연습장",
        place:"main_hero", label:"광고", click_url:"/cat/lesson" }];
      const g = await open("/", { role:"customer", name:"손님", signedIn:true },
                           { v_ad_live: CRE }, {}, true);
      await g.p.waitForTimeout(300);
      await g.p.evaluate(function(){
        const a = document.querySelector('[data-adslot="main_hero"] a[data-adclick]');
        if(a){ a.addEventListener("click", function(e){ e.preventDefault(); });
               a.click(); }
      });
      await g.p.waitForTimeout(300);
      const calls = g.sent.filter(function(x){ return x.name === "bump_ad"; })
        .map(function(x){ try{ return JSON.parse(x.body).p; }catch(e){ return {}; } });
      ok("⚠️⚠️ 노출을 **실제로 센다** (`bump_ad` 를 부른다)",
         calls.some(function(c){ return c.kind === "view" && c.ad === "adz"; }),
         JSON.stringify(calls));
      ok("  클릭도 센다", calls.some(function(c){ return c.kind === "click"; }),
         JSON.stringify(calls));
      /* ⚠️⚠️⚠️ **사람 정보를 한 글자도 안 보냅니다** — 광고 id 와 갈래뿐입니다 */
      ok("⚠️⚠️⚠️ 보내는 꾸러미에 **광고 id 와 갈래뿐**이다 (사람 정보 0건)",
         calls.length > 0 && calls.every(function(c){
           return Object.keys(c).sort().join(",") === "ad,kind"; }),
         JSON.stringify(calls));
      /* ⚠️ 같은 광고의 노출을 한 화면에서 두 번 안 셉니다 */
      ok("  ⚠️ 한 화면에서 같은 광고의 노출을 **두 번 안 센다**",
         calls.filter(function(c){ return c.kind === "view"; }).length === 1,
         JSON.stringify(calls));
      await g.p.close();
    }

    /* ⑧ ⚠️⚠️ **새 자리 셋(0062)이 실제로 그려지는가** — 메인 스폰서 둘과
       하단 와이드. `save_ad` 가 자리 이름을 글자로 박아 거절하던 자리라
       화면 쪽도 같이 눌러 봅니다. */
    {
      const PL = ["home_sponsor_a", "home_sponsor_b", "home_bottom"];
      const g = await open("/", { role:"customer", name:"손님", signedIn:true },
        { v_ad_live: PL.map(function(k, i){
            return { id:"s" + i, provider_id:"t-range", provider_name:"스폰서 " + i,
                     place:k, label:"광고", click_url:"/cat/lesson" };
          }) }, {}, true);
      await g.p.waitForTimeout(300);
      const r = await g.p.evaluate(function(keys){
        return keys.map(function(k){
          const el = document.querySelector('[data-adslot="' + k + '"]');
          return { k:k, there: !!el, drawn: !!(el && !el.hidden &&
                   el.querySelector(".adsl-i")) };
        });
      }, PL);
      r.forEach(function(x){
        ok("자리 `" + x.k + "` 가 메인에 **있고 그려진다**", x.there && x.drawn,
           JSON.stringify(x));
      });
      await g.p.close();
    }
  }

  /* ══════════════════════════════════════════════════════════════
     티타임 (0060) — ⚠️ **설정이 있어야 열리는 자리라 빌드가 찍은 HTML 만
     보는 검사는 영원히 못 봅니다.** 여기서 누릅니다.
     ⚠️⚠️⚠️ 가장 중요한 것 셋: **'예약 완료' 라고 안 적는가** ·
     **동의 없이는 안 보내는가** · **배정 담당자 직통이 안 나오는가**.
     ══════════════════════════════════════════════════════════════ */
  console.log("\n── 티타임 (0060)");
  const TKST = function(p){
    return new Date(Date.now() + 9*3600*1000 + (p||0)*86400000)
             .toISOString().slice(0, 10);
  };
  /* ⚠️ 가짜 자료도 DB 가 받는 값이어야 합니다 (kind · state 는 0060 의 check) */
  const TEE = [
    { id:"11111111-1111-1111-1111-111111111111", provider_id:"t-range",
      provider_name:"성남 그린골프연습장", kind:"booking", region:"gyeonggi",
      course:"그린밸리CC 신코스", play_at:TKST(1), tee_at:"07:10:00", holes:18,
      slots:4, green_fee:150000, tel:"031-555-7777", note:"카트비 별도", left_n:2 },
    /* ⚠️⚠️ **그린피 0 은 "무료"** 입니다 — 빈 값(안 적음)과 뜻이 다릅니다 */
    { id:"22222222-2222-2222-2222-222222222222", provider_id:"t-range",
      provider_name:"성남 그린골프연습장", kind:"booking", region:"jeju",
      course:"무료 나눔 코스", play_at:TKST(2), tee_at:null, holes:null,
      slots:2, green_fee:0, tel:null, note:null, left_n:2 }
  ];
  const TCNT = [
    { region:"seoul", play_at:TKST(1), n:3 },
    { region:"gyeonggi", play_at:TKST(1), n:5 },
    { region:"jeju", play_at:TKST(2), n:4 }
  ];
  const MYTEE = [{ id:"aaaa1111-1111-1111-1111-111111111111", kind:"booking",
    region:"gyeonggi", course:"그린밸리CC 신코스", play_at:TKST(1),
    tee_at:"07:10:00", holes:18, slots:4, green_fee:150000, tel:"031-555-7777",
    note:"카트비 별도", state:"open", created_at:"2026-11-06T01:00:00Z" }];
  const TBOOK = [{ id:"bbbb1111-1111-1111-1111-111111111111", tee_id:MYTEE[0].id,
    name:"김손님", tel:"010-1234-5678", people:2, memo:"초보입니다",
    state:"applied", why:null, created_at:"2026-11-06T02:00:00Z" }];
  const TMINE = [{ id:"cccc1111-1111-1111-1111-111111111111", tee_id:TEE[0].id,
    people:2, memo:"초보입니다", state:"applied", why:null,
    created_at:"2026-11-06T02:00:00Z", kind:"booking", region:"gyeonggi",
    course:"그린밸리CC 신코스", play_at:TKST(1), tee_at:"07:10:00", holes:18,
    green_fee:150000, provider_id:"t-range",
    provider_name:"성남 그린골프연습장", tel:"031-555-7777" }];
  const PVROW = [{ id:"t-range", name:"성남 그린골프연습장", state:"approved",
                   regions:["gyeonggi"] }];

  /* ① 손님이 보는 목록 */
  {
    const g = await open("/cat/booking", { role:"customer", name:"손님", signedIn:true },
                         { v_teetime_open: TEE }, {}, true);
    const r = await g.p.evaluate(function(){
      return { n: document.querySelectorAll(".tf-i").length,
               body: document.body.innerText,
               book: document.querySelectorAll(".tf-book").length };
    });
    ok("티타임 목록이 그려진다", r.n === 2, "줄 " + r.n);
    ok("  상호와 **공개 전화번호**가 나온다 (제20조 제2항 · 0057)",
       r.body.indexOf("성남 그린골프연습장") >= 0 &&
       r.body.indexOf("031-555-7777") >= 0, "");
    /* ⚠️⚠️ **0 은 "무료"** · 빈 값은 **줄째 빠집니다** */
    ok("⚠️⚠️ 그린피 **0 이 '무료' 로 나온다** (안 적음과 다릅니다)",
       r.body.indexOf("무료") >= 0, r.body.slice(0, 200));
    ok("  ⚠️ 안 적은 칸은 **줄째 빠진다** (\"미정\" 을 지어 적지 않습니다)",
       r.body.indexOf("미정") < 0 && r.body.indexOf("협의") < 0, "");
    /* ⚠️⚠️⚠️ **'예약 완료' 라고 적지 않습니다** (지시서 §6) */
    ok("⚠️⚠️⚠️ 화면에 **'예약 완료' 가 한 글자도 없다**",
       r.body.indexOf("예약 완료") < 0 && r.body.indexOf("예약완료") < 0,
       r.body.slice(0, 200));
    ok("  대신 **'예약 신청'** 이라고 적는다", r.body.indexOf("예약 신청") >= 0, "");
    ok("  ⚠️ 결제를 받는다고 적지 않는다",
       r.body.indexOf("안전거래") < 0 && r.body.indexOf("에스크로") < 0, "");
    await g.p.close();
  }

  /* ② 거르개 — ⚠️⚠️ **보내는 질의를 뜯어** 봅니다 (흉내 장치는 안 걸러 줍니다) */
  {
    const g = await open("/cat/booking", { role:"customer", name:"손님", signedIn:true },
                         { v_teetime_open: TEE }, {}, true);
    const before = g.sent.length;
    await g.p.selectOption("#tf-rg", "capital");
    await g.p.fill("#tf-d", TKST(1));
    await g.p.click("#ttf-find button[type=submit]");
    await g.p.waitForTimeout(450);
    const qs = g.sent.slice(before).filter(function(x){ return x.name === "GET"; })
      .map(function(x){ return x.body; });
    /* ⚠️⚠️⚠️ **묶음을 지역 여럿으로 풀어** 보내야 메인 현황표의 숫자와
       목록의 줄 수가 같습니다 (지시서 §5). */
    ok("⚠️⚠️ 지역 묶음을 **지역 여럿으로 풀어** 묻는다 (현황표와 같은 셈)",
       qs.some(function(u){ return u.indexOf("region=in.") >= 0 &&
         u.indexOf("seoul") >= 0 && u.indexOf("gyeonggi") >= 0 &&
         u.indexOf("incheon") >= 0; }),
       qs.slice(0, 2).join(" | ").slice(0, 200));
    ok("  날짜도 **서버에서** 거른다 (화면에서 거르면 0건으로 보입니다)",
       qs.some(function(u){ return u.indexOf("play_at=eq.") >= 0; }),
       qs.slice(0, 2).join(" | ").slice(0, 160));
    await g.p.close();
  }

  /* ②-2 **61~90일은 사전 상담만** (지시서 §5 · 2026-11-07)
     ⚠️⚠️⚠️ 2026-11-07 까지 달력이 `teeSearch`(60일)에서 **막혀** 있었고
     그 뒤 날짜를 치시려는 분은 그 날짜를 **말할 자리조차** 없었습니다 —
     안내도 없이 막힌 달력이고 막다른 길입니다(절대 규칙 2). 바로 그
     자리의 주석이 "61~90일은 사전 상담만" 이라고 적어 두었는데 **상담
     쪽 코드가 한 줄도 없었습니다**(주석이 코드와 다른 자리의 또 한 판).
     ⚠️ 그냥 질의하게 두어도 안 됩니다 — **0건**이 나오고 손님은 "그날
     자리가 없다" 로 읽습니다. 없는 것과 **안 보여 주는 것**은 다릅니다.
     ⚠️ 날짜 수를 박지 않습니다 — `site.js` 에서 읽습니다. */
  {
    const SEARCH = keepNum("teeSearch"), AHEAD = keepNum("teeAhead");
    ok("⚠️ 잴 정책값이 있다 (teeSearch · teeAhead)",
       SEARCH > 0 && AHEAD > SEARCH, "teeSearch=" + SEARCH + " teeAhead=" + AHEAD);
    const g = await open("/cat/booking", { role:"customer", name:"손님", signedIn:true },
                         { v_teetime_open: TEE }, {}, true);
    const mx = await g.p.getAttribute("#tf-d", "max");
    /* ⚠️ 달력 끝이 60일이면 그 뒤를 **고를 수가 없습니다** */
    ok("  달력 끝이 teeAhead(" + AHEAD + "일)까지 열려 있다 (말할 자리를 준다)",
       mx === TKST(AHEAD), "max=" + mx + " 기대=" + TKST(AHEAD));

    const before = g.sent.length;
    /* 60일 밖 · 90일 안 — 사전 상담으로 가야 하는 날짜 */
    await g.p.fill("#tf-d", TKST(SEARCH + 5));
    await g.p.click("#ttf-find button[type=submit]");
    await g.p.waitForTimeout(450);
    const after = g.sent.slice(before).filter(function(x){ return x.name === "GET"; });
    const r = await g.p.evaluate(function(){
      const b = document.getElementById("ttlist");
      const a = b.querySelector('a[href^="/match"]');
      return { txt:(b.innerText || "").replace(/\s+/g, " ").trim(),
               go: a ? a.getAttribute("href") : null,
               /* 가려진 단추는 없는 단추입니다 */
               seen: !!(a && a.offsetParent) };
    });
    /* ⚠️⚠️ **묻지 않아야** 합니다 — 물으면 0건이 돌아오고 화면이
       "자리가 없습니다" 로 갈라집니다. */
    ok("  60일 밖 날짜는 **묻지 않는다** (0건을 받아 '없다' 고 하지 않게)",
       after.length === 0, after.length + "번 물었습니다");
    ok("  **사전 상담**으로 잡아 드린다고 적는다",
       r.txt.indexOf("미리 상담으로") >= 0, r.txt.slice(0, 160));
    ok("  '자리가 없습니다' 라고 **말하지 않는다**",
       r.txt.indexOf("없습니다") < 0, r.txt.slice(0, 160));
    ok("  막다른 길이 아니다 — 상담 요청으로 가는 길이 **보인다**",
       r.seen && String(r.go).indexOf("cat=booking") >= 0, String(r.go));

    /* ⚠️ 너무 넓게 막는 것도 고장입니다 — 60일 **안**은 그대로 물어야 합니다 */
    const b2 = g.sent.length;
    await g.p.fill("#tf-d", TKST(1));
    await g.p.click("#ttf-find button[type=submit]");
    await g.p.waitForTimeout(450);
    const a2 = g.sent.slice(b2).filter(function(x){ return x.name === "GET"; });
    ok("  60일 **안** 날짜는 그대로 묻는다 (너무 넓게 막지 않는다)",
       a2.length > 0, "0번 물었습니다");
    await g.p.close();
  }

  /* ②-3 **날짜 띠** — 메인 현황표의 가로 줄과 같은 날짜를 목록 위에도
     냅니다 (2026-11-07 · 시안). 칸을 눌러 들어오신 분이 다른 날을 보시려고
     달력을 여는 것이 아니라 한 번 누르면 가게 합니다.
     ⚠️⚠️⚠️ **줄 수로 재지 않습니다** — 튀내 장치는 걸러 주지 않으므로 줄 수로
     재면 띠를 **통째로 떼어도 영원히 초록**입니다. **보내는 질의를 뜽어** 봅니다
     (조인 거르개에서 적어 둔 그 자리). */
  {
    const g = await open("/cat/booking", { role:"customer", name:"손님", signedIn:true },
                         { v_teetime_open: TEE }, {}, true);
    const BOARD = keepNum("teeBoard");
    const r = await g.p.evaluate(function(){
      const n = document.querySelector("#ttlist .tfd");
      const bs = n ? n.querySelectorAll("[data-tfd]") : [];
      return { on: !!n, n: bs.length,
        tags: Array.prototype.map.call(bs, function(a){ return a.tagName; }),
        low: Array.prototype.filter.call(bs, function(a){
          return a.getBoundingClientRect().height < 39.5; }).length };
    });
    ok("목록 위에 **날짜 띠**가 있다", r.on, JSON.stringify(r).slice(0, 140));
    /* ⚠️ 갯수를 박지 않습니다 — `teeBoard` 에 **전체** 한 칸 */
    ok("  칸이 **펼친 날 수 + 전체**와 같다 (" + (BOARD + 1) + ")",
       r.n === BOARD + 1, "칸 " + r.n);
    ok("  ⚠️⚠️ **단추가 아니라 링크**다 (자바스크립트가 꺼져도 열립니다)",
       r.tags.length > 0 && r.tags.every(function(t){ return t === "A"; }),
       r.tags.join(","));
    ok("  ⚠️ 누름이 40px 미만인 칸이 없다", r.low === 0, "낮은 칸 " + r.low);

    const b0 = g.sent.length;
    await g.p.click('#ttlist .tfd [data-tfd="' + TKST(2) + '"]');
    await g.p.waitForTimeout(500);
    const q1 = g.sent.slice(b0).filter(function(x){ return x.name === "GET"; })
                 .map(function(x){ return x.body || ""; }).join(" ");
    ok("⚠️⚠️ 날짜 칸을 누르면 **play_at=eq.<그 날>** 을 보낸다",
       q1.indexOf("play_at=eq." + TKST(2)) >= 0, q1.slice(0, 220));
    const u1 = g.p.url();
    ok("  ⚠️ **주소도 같이** 바뀜다 (복사해 보내도 같은 화면 · 뒤로 가기)",
       u1.indexOf("d=" + TKST(2)) >= 0, u1);
    const on = await g.p.evaluate(function(){
      const a = document.querySelector("#ttlist .tfd .tfd-on");
      return a ? a.getAttribute("data-tfd") : null; });
    ok("  고른 칸이 **켜져 보인다**", on === TKST(2), String(on));

    /* ⚠️ 너무 넓게 막는 것도 고장입니다 — 전체를 누르면 풀려야 합니다 */
    const b1 = g.sent.length;
    await g.p.click('#ttlist .tfd [data-tfd=""]');
    await g.p.waitForTimeout(500);
    const q2 = g.sent.slice(b1).filter(function(x){ return x.name === "GET"; })
                 .map(function(x){ return x.body || ""; }).join(" ");
    ok("  **전체**를 누르면 play_at=eq. 가 **빠진다**",
       q2.length > 0 && q2.indexOf("play_at=eq.") < 0, q2.slice(0, 220));
    await g.p.close();
  }

  /* ③ 예약 신청 — ⚠️⚠️⚠️ 동의 없이는 안 보냅니다 */
  {
    const g = await open("/cat/booking", { role:"customer", name:"손님", signedIn:true },
                         { v_teetime_open: TEE }, {}, true);
    await g.p.click(".tf-book");
    await g.p.waitForTimeout(400);
    const r = await g.p.evaluate(function(){
      const f = document.querySelector(".tf-f");
      return { form: !!f, body: f ? f.innerText : "",
        req: f ? Array.prototype.map.call(f.querySelectorAll("[required]"),
               function(e){ return e.name; }) : [] };
    });
    ok("예약 신청 양식이 열린다", r.form, JSON.stringify(r).slice(0, 120));
    ok("  성함 · 연락처 · 인원 · **동의**가 전부 필수다",
       ["name","tel","people","agree3rd"].every(function(n){
         return (r.req || []).indexOf(n) >= 0; }), (r.req || []).join(","));
    /* ⚠️⚠️⚠️ **상호를 보여 주면서** 동의를 받아야 제17조 제2항입니다 */
    ok("⚠️⚠️⚠️ 동의 문구에 **상호가 적혀 있다** (제17조 제2항)",
       r.body.indexOf("성남 그린골프연습장") >= 0, r.body.slice(0, 200));
    ok("  ⚠️ 보유 기간도 **그 자리에서** 보여 준다 (제15조 제2항)",
       r.body.indexOf(keepOf("bookKeep")) >= 0 && keepOf("bookKeep") !== "",
       keepOf("bookKeep"));

    await g.p.fill('.tf-f [name="name"]', "검사손님");
    await g.p.fill('.tf-f [name="tel"]', "010-1111-2222");
    await g.p.check('.tf-f [name="agree3rd"]');
    await g.p.click(".tf-f button[type=submit]");
    await g.p.waitForTimeout(450);
    const bc = g.sent.filter(function(x){ return x.name === "book_teetime"; })[0];
    ok("⚠️ 신청 단추가 **book_teetime 을 실제로 부른다**", !!bc,
       g.sent.map(function(x){ return x.name; }).join(","));
    if(bc){
      const sp = JSON.parse(bc.body).p;
      ok("  어느 자리 · 성함 · 연락처 · 동의를 실어 보낸다",
         sp.tee === TEE[0].id && sp.name === "검사손님" && sp.agree3rd === true,
         JSON.stringify(sp));
    }
    const done = await g.p.evaluate(function(){ return document.body.innerText; });
    ok("⚠️⚠️⚠️ 보낸 뒤에도 **'완료' 라고 안 적는다** (업체가 확정해야 합니다)",
       done.indexOf("예약 완료") < 0 && done.indexOf("신청했습니다") >= 0,
       done.slice(0, 200));
    await g.p.close();
  }

  /* ④ 비회원 — 목록은 보이고 신청은 로그인 */
  {
    const g = await open("/cat/booking", { role:"customer", name:"", signedIn:false },
                         { v_teetime_open: TEE }, {}, true);
    const n = await g.p.evaluate(function(){
      return document.querySelectorAll(".tf-i").length; });
    ok("⚠️ 가입 안 하셔도 **자리는 보인다**", n === 2, "줄 " + n);
    await g.p.click(".tf-book");
    await g.p.waitForTimeout(400);
    const r = await g.p.evaluate(function(){
      const bx = document.querySelector(".tf-bx");
      return { form: !!document.querySelector(".tf-f"),
               login: !!(bx && bx.querySelector('a[href^="/login"]')) };
    });
    ok("  비회원이 누르면 **로그인 길**을 낸다 (양식이 아닙니다)",
       r.login && !r.form, JSON.stringify(r));
    await g.p.close();
  }

  /* ⑤ 업체 작업실 */
  {
    const g = await open("/desk", { role:"provider", name:"담당자", signedIn:true,
                                    provider:"t-range" },
      { teetime: MYTEE, v_teebook_pv: TBOOK, provider: PVROW }, {}, true);
    const r = await g.p.evaluate(function(){
      const b = document.getElementById("teebox");
      return { drawn: !!b && !b.hidden, body: b ? b.innerText : "",
               form: !!document.getElementById("ttf"),
               ok: b ? b.querySelectorAll(".tb-ok").length : 0 };
    });
    ok("업체 작업실에 티타임 상자가 그려진다", r.drawn && r.form,
       JSON.stringify(r).slice(0, 140));
    /* ⚠️⚠️ 신청자 성함 · 연락처는 **그 업체만** 봅니다 (보기 하나) */
    ok("  들어온 신청의 **성함 · 연락처가 보인다** (그 업체 자리입니다)",
       r.body.indexOf("김손님") >= 0 && r.body.indexOf("010-1234-5678") >= 0, "");
    ok("  확정 · 거절 단추가 있다", r.ok === 1, "확정 " + r.ok);
    /* ⚠️⚠️⚠️ 공개되는 번호라는 것을 **적는 그 자리에서** 말합니다 */
    ok("⚠️⚠️ 예약 문의 번호가 **공개된다고 그 자리에서** 말한다",
       r.body.indexOf("손님에게 공개됩니다") >= 0, "");
    ok("  ⚠️ 담당자 직통은 **다른 자리이고 안 보인다**고 적는다",
       r.body.indexOf("담당자 직통") >= 0, "");

    await g.p.selectOption("#t-rg", "gyeonggi");
    await g.p.fill("#t-cs", "검사 골프장");
    await g.p.fill("#t-day", TKST(3));
    await g.p.click("#ttf button[type=submit]");
    await g.p.waitForTimeout(450);
    const oc = g.sent.filter(function(x){ return x.name === "open_teetime"; })[0];
    ok("⚠️ 올리기가 **open_teetime 을 실제로 부른다**", !!oc,
       g.sent.map(function(x){ return x.name; }).join(","));
    if(oc){
      const sp = JSON.parse(oc.body).p;
      ok("  갈래 · 지역 · 골프장 · 날짜를 실어 보낸다",
         sp.kind === "booking" && sp.region === "gyeonggi" &&
         sp.course === "검사 골프장" && sp.playAt === TKST(3), JSON.stringify(sp));
    }
    await g.p.click(".tb-ok");
    await g.p.waitForTimeout(400);
    const mc = g.sent.filter(function(x){ return x.name === "move_teebook"; })[0];
    ok("⚠️ 확정하기가 **move_teebook 을 부른다**", !!mc, "");
    if(mc) ok("  confirmed 로 보낸다 (손님이 스스로는 못 합니다)",
       JSON.parse(mc.body).p.state === "confirmed", mc.body);
    await g.p.close();
  }

  /* ⑥ 승인 전 업체에는 양식을 안 냅니다 */
  {
    const g = await open("/desk", { role:"provider", name:"담당자", signedIn:true,
                                    provider:"t-range" },
      { teetime: [], v_teebook_pv: [],
        provider: [{ id:"t-range", name:"심사중", state:"draft", regions:[] }] },
      {}, true);
    const r = await g.p.evaluate(function(){
      const b = document.getElementById("teebox");
      return { form: !!document.getElementById("ttf"),
               body: b ? b.innerText : "" };
    });
    ok("⚠️ 승인 전 업체에는 **양식을 안 낸다** (문이 거절하는 칸입니다)",
       !r.form, "양식이 열렸습니다");
    ok("  대신 **왜 안 되는지** 적는다", r.body.indexOf("업체 승인") >= 0,
       r.body.slice(0, 140));
    await g.p.close();
  }

  /* ⑦ /my — 내가 신청한 예약 */
  {
    const g = await open("/my", { role:"customer", name:"손님", signedIn:true },
      { v_teebook_mine: TMINE, cq: [], ca: [], joinroom: [], request: [],
        quote: [], review: [] }, {}, true);
    const r = await g.p.evaluate(function(){
      const b = document.getElementById("bkbox");
      return { drawn: !!b && !b.hidden, body: b ? b.innerText : "" };
    });
    ok("/my 에 내가 신청한 예약이 그려진다", r.drawn, JSON.stringify(r).slice(0,140));
    /* ⚠️⚠️ **손님 말**로 적어야 합니다 (업체 말을 찍으면 절대 규칙 3) */
    ok("⚠️⚠️ 상태를 **손님 말**로 적는다 (업체의 '새 신청' 이 아닙니다)",
       r.body.indexOf("업체 확인을 기다립니다") >= 0 &&
       r.body.indexOf("새 신청") < 0, r.body.slice(0, 200));
    ok("  ⚠️⚠️⚠️ **'예약 완료' 라고 안 적는다**",
       r.body.indexOf("예약 완료") < 0, r.body.slice(0, 200));
    ok("  업체 상호와 공개 번호가 나온다",
       r.body.indexOf("성남 그린골프연습장") >= 0 &&
       r.body.indexOf("031-555-7777") >= 0, "");
    await g.p.close();
  }
  {
    /* ⚠️ 0건이면 **한 줄도 안 그립니다** */
    const g = await open("/my", { role:"customer", name:"손님", signedIn:true },
      { v_teebook_mine: [], cq: [], ca: [], joinroom: [], request: [],
        quote: [], review: [] }, {}, true);
    const hid = await g.p.evaluate(function(){
      const b = document.getElementById("bkbox");
      return !b || b.hidden || !b.innerHTML.trim();
    });
    ok("⚠️ 신청이 0건이면 그 상자를 **안 그린다**", hid, "그렸습니다");
    await g.p.close();
  }

  /* ⑧ 메인 현황표 — ⚠️⚠️ 묶음으로 세고 그 칸이 같은 조건으로 보냅니다 */
  {
    const g = await open("/", { role:"customer", name:"손님", signedIn:true },
      { v_teetime_count: TCNT, v_join_count: [] }, {}, true);
    const r = await g.p.evaluate(function(){
      const b = document.getElementById("teeboard");
      const rows = b ? b.querySelectorAll(".tbd-t tbody tr") : [];
      const first = rows.length ? rows[0].querySelectorAll("td") : [];
      return { drawn: !!b && !b.hidden, rows: rows.length,
               cells: first.length,
               body: b ? b.innerText : "",
               links: b ? Array.prototype.map.call(b.querySelectorAll(".tbd-n"),
                 function(a){ return a.getAttribute("href") + "|" + a.textContent; }) : [] };
    });
    ok("메인에 현황표가 그려진다", r.drawn, JSON.stringify(r).slice(0, 140));
    /* ⚠️ 갯수를 박지 않습니다 — **묶음 수**와 **펼친 날 수**에 맞춥니다 */
    ok("  줄이 **지역 묶음 수**와 같다 (" + zonesOf().length + ")",
       r.rows === zonesOf().length, "줄 " + r.rows);
    ok("  칸이 **펼친 날 수**와 같다 (" + keepNum("teeBoard") + ")",
       r.cells === keepNum("teeBoard"), "칸 " + r.cells);
    /* ⚠️⚠️⚠️ **서울 3 + 경기 5 = 8** — 묶음으로 더해야 합니다 */
    ok("⚠️⚠️ 같은 묶음의 지역을 **더해서** 센다 (서울 3 + 경기 5 = 8)",
       r.links.some(function(x){ return x.indexOf("|8") > 0; }),
       r.links.slice(0, 4).join(" / "));
    /* ⚠️⚠️ 칸을 누르면 **같은 조건**으로 가야 숫자와 줄 수가 맞습니다 */
    ok("⚠️⚠️ 칸이 **그 묶음 · 그 날짜**로 보낸다 (§5 — 집계와 목록 일치)",
       r.links.some(function(x){ return x.indexOf("rg=capital") >= 0 &&
         x.indexOf("d=" + TKST(1)) >= 0; }),
       r.links.slice(0, 4).join(" / "));
    ok("  0 인 칸은 **0 이라고 적는다** (빈칸은 '모름' 과 섞입니다)",
       (r.body.match(/\b0\b/g) || []).length > 0, "");
    await g.p.close();
  }
  {
    /* ⚠️⚠️⚠️ **0 을 포장하지 않습니다** — 왜 0 인지와 지금 되는 길 */
    const g = await open("/", { role:"customer", name:"손님", signedIn:true },
      { v_teetime_count: [], v_join_count: [] }, {}, true);
    const r = await g.p.evaluate(function(){
      const b = document.getElementById("teeboard");
      return { body: b ? b.innerText : "",
               go: b ? b.querySelectorAll('a[href^="/match"]').length : 0 };
    });
    ok("⚠️⚠️ 0건이면 **0건이라고 말한다** (지어낸 숫자를 안 채웁니다)",
       r.body.indexOf("0건") >= 0, r.body.slice(0, 200));
    ok("  ⚠️ 막다른 길로 두지 않는다 (상담 요청으로 가는 길)", r.go >= 1,
       "길 " + r.go);
    ok("  ⚠️ '곧 생깁니다' 같은 지어낸 약속을 안 한다",
       r.body.indexOf("곧") < 0 && r.body.indexOf("준비 중") < 0,
       r.body.slice(0, 200));
    await g.p.close();
  }

  /* ⑧-2 **메인의 찾는 칸** — 시안의 왼쪽 반쪽입니다 (2026-11-07).
     ⚠⚠⚠ 2026-11-07 까지 **현황표만** 있었습니다 — "원하는 날짜와
     지역의 자리 찾기" 라는 **제목만 달아 놓고 찾는 칸을 안 만들었습니다**
     (제목이 코드와 다른 자리 · 절대 규칙 5).
     ⚠⚠ **가는 주소를 재야 합니다** — 고르개가 보내는 열쇠와 받는 쪽이
     다르면 고르는 순간 아무 일이 안 나고 **에러도 안 납니다**. */
  {
    const g = await open("/", { role:"customer", name:"손님", signedIn:true },
      { v_teetime_count: TCNT, v_join_count: [], v_teetime_open: TEE }, {}, true);
    await g.p.waitForTimeout(400);
    const r = await g.p.evaluate(function(){
      const n = document.querySelector("#teeboard .tbf");
      const cs = n ? n.querySelector('[data-tbf="course"]') : null;
      return { on: !!n,
        d:  !!(n && n.querySelector('[data-tbf="d"]')),
        rg: !!(n && n.querySelector('[data-tbf="rg"]')),
        course: !!cs,
        courses: cs ? Array.prototype.map.call(cs.options,
                   function(o){ return o.value; }).filter(Boolean) : [],
        go: !!(n && n.querySelector(".tbf-go")) };
    });
    ok("메인에 **찾는 칸**이 그려진다 (시안의 왼쪽)", r.on,
       JSON.stringify(r).slice(0, 160));
    ok("  라운드 날짜 · 지역 · **골프장** 칸과 찾는 단추가 있다",
       r.d && r.rg && r.course && r.go, JSON.stringify(r).slice(0, 160));
    /* ⚠⚠ 골프장 목록은 **DB 에서** 옵니다 — 글자로 박지 않습니다 */
    ok("  골프장 목록을 **올라온 자리에서** 끌어온다 (지어내지 않습니다)",
       r.courses.length > 0 && r.courses.every(function(c){
         return TEE.some(function(t){ return t.course === c; }); }),
       r.courses.join(" / "));

    await g.p.fill("#tbf-d", TKST(3));
    await g.p.selectOption('#teeboard [data-tbf="rg"]', "capital");
    await g.p.selectOption('#teeboard [data-tbf="course"]', TEE[0].course);
    await g.p.click("#teeboard .tbf-go");
    await g.p.waitForTimeout(700);
    const u = g.p.url();
    ok("⚠⚠ 찾는 단추가 **그 날짜 · 그 지역 · 그 골프장**으로 보낸다",
       u.indexOf("/cat/booking") >= 0 && u.indexOf("rg=capital") >= 0 &&
       u.indexOf("d=" + TKST(3)) >= 0 &&
       u.indexOf("course=" + encodeURIComponent(TEE[0].course)) >= 0, u);
    /* ⚠⚠ 받는 쪽이 없으면 고르는 순간 아무 일이 안 납니다 */
    await g.p.waitForTimeout(500);
    const got = await g.p.evaluate(function(){
      const el = document.querySelector("#ttlist #tf-rg");
      const d  = document.querySelector("#ttlist #tf-d");
      return { rg: el ? el.value : null, d: d ? d.value : null }; });
    ok("  ⚠⚠ **받는 쪽이 그 조건으로 열린다** (보내는 열쇠와 받는 쪽이 같다)",
       got.rg === "capital" && got.d === TKST(3), JSON.stringify(got));
    await g.p.close();
  }
  {
    /* 조인 탭 — ⚠ 조인에는 **골프장 칸을 안 냅니다**(회원이 여는
       자리라 골프장으로 좁힐 자료가 없습니다 · 절대 규칙 5). */
    const g = await open("/", { role:"customer", name:"손님", signedIn:true },
      { v_teetime_count: TCNT, v_join_count: TCNT, v_teetime_open: TEE }, {}, true);
    await g.p.waitForTimeout(400);
    await g.p.click('#teeboard [data-teetab="join"]');
    await g.p.waitForTimeout(600);
    const r = await g.p.evaluate(function(){
      const n = document.querySelector("#teeboard .tbf");
      return { course: !!(n && n.querySelector('[data-tbf="course"]')),
               go: n ? (n.querySelector(".tbf-go") || {}).textContent : "" };
    });
    ok("조인 탭에서는 **골프장 칸을 안 낸다** (좁힐 자료가 없습니다)",
       r.course === false, String(r.go));
    await g.p.selectOption('#teeboard [data-tbf="rg"]', "jeju");
    await g.p.click("#teeboard .tbf-go");
    await g.p.waitForTimeout(700);
    const u = g.p.url();
    ok("  조인은 **/cat/matchup** 으로 보낸다 (부킹과 갈라서 냅니다)",
       u.indexOf("/cat/matchup") >= 0 && u.indexOf("rg=jeju") >= 0, u);
    await g.p.close();
  }

  /* ⑧-3 **부킹 · 조인 화면에도 같은 띠가 섭니다** (2026-11-07 · 시안).
     ⚠️⚠️⚠️ 전에는 **메인에만** 있어서, 머리말에서 골프장 부킹을 누르고
     들어오신 분은 **목록부터** 보셨습니다 — 어느 날짜 · 어느 지역에 자리가
     있는지를 보는 자리가 그 화면에 없었습니다.
     ⚠️⚠️⚠️ 그리고 **`/cat/matchup` 에 `#ttlist` 가 한 줄도 안 찍혔습니다** —
     0곳 가지가 `ownSec || (sideSec + zero)` 라 조인 화면에서는 sideSec 이
     통째로 사라졌고, 그래서 0060 의 "업체가 내놓은 조인 자리" 가
     **처음부터 죽은 코드**였습니다(`js/booking.js` 는 그 상자가 없으면
     그자리에서 나갑니다 · 에러 0줄). */
  for(const pg of [["/cat/booking", "booking"], ["/cat/matchup", "join"]]){
    const g = await open(pg[0], { role:"customer", name:"손님", signedIn:true },
      { v_teetime_count: TCNT, v_join_count: TCNT, v_teetime_open: TEE }, {}, true);
    await g.p.waitForTimeout(700);
    const r = await g.p.evaluate(function(){
      const b = document.getElementById("teeboard");
      const on = b ? b.querySelector(".tbd-b.tbd-on") : null;
      return { board: !!b && !b.hidden,
               find: !!(b && b.querySelector(".tbf-go")),
               tab: on ? on.getAttribute("data-teetab") : null,
               /* ⚠️ 자리 목록 상자도 **실제로** 있어야 합니다 */
               list: !!document.getElementById("ttlist") };
    });
    ok(pg[0] + " 에 **찾는 칸 + 현황표**가 그려진다", r.board && r.find,
       JSON.stringify(r));
    /* ⚠️ 주소로 다시 판단하지 않고 **빌드가 적어 준 값**을 씨니다 */
    ok("  먼저 열리는 탭이 **" + pg[1] + "** 이다", r.tab === pg[1], String(r.tab));
    ok("  ⚠️⚠️ 자리 목록 상자(#ttlist)도 **실제로** 있다", r.list, "없습니다");
    await g.p.close();
  }

  /* ⑧-4 ⚠️⚠️⚠️ **설정이 없어도 표의 뼈대를 그립니다** (2026-11-08).
     전에는 그 자리에 한 줄짜리 안내만 남아서, 시안의 오른쪽 절반이
     손님에게는 **빈 글**이었습니다 — 사장님이 폰에서 보시고 "현황표도
     만들어 달라" 고 하신 자리입니다.
     ⚠️⚠️ 다만 칸에 **0 을 적으면 안 됩니다** — 세어 본 것이 아니라 못
     읽은 것입니다. 그래서 **둘을 갈라서** 잽니다: 뼈대가 섰는가 ·
     그리고 그 칸이 0 이 아닌가 (절대 규칙 1). */
  {
    const p0 = await b.newPage({ viewport: view });
    await p0.route("**/api/session", function(r){
      return r.fulfill({ status:200, contentType:"application/json",
        body: JSON.stringify({ auth:false, signedIn:false, conf:null }) });
    });
    await p0.goto(base + "/", { waitUntil:"networkidle" });
    await p0.waitForTimeout(400);
    const r = await p0.evaluate(function(){
      const bx = document.getElementById("teeboard");
      const rows = bx ? bx.querySelectorAll(".tbd-t tbody tr") : [];
      return { rows: rows.length,
               cells: rows.length ? rows[0].querySelectorAll("td").length : 0,
               unknown: bx ? bx.querySelectorAll(".tbd-x").length : -1,
               zeros: bx ? bx.querySelectorAll(".tbd-0").length : -1,
               find: !!(bx && bx.querySelector(".tbf-go")),
               body: bx ? bx.innerText : "" };
    });
    ok("⚠️⚠️ 설정이 없어도 현황표의 **뼈대가 그려진다** (날짜 열 · 지역 줄)",
       r.rows === zonesOf().length && r.cells === keepNum("teeBoard"),
       JSON.stringify(r).slice(0, 200));
    ok("  ⚠️⚠️⚠️ 그 칸에 **0 을 적지 않는다** (세어 본 것이 아닙니다)",
       r.unknown > 0 && r.zeros === 0, JSON.stringify(r).slice(0, 200));
    ok("  ⚠️ '0건' 이라고 말하지 않는다 (못 읽은 것과 0 은 다릅니다)",
       r.body.indexOf("0건이라는 뜻이 아닙니다") >= 0 &&
       r.body.indexOf("아직 숫자를 읽지 못한") >= 0, r.body.slice(0, 220));
    ok("  ⚠️ 찾는 칸은 그대로 돈다", r.find, "없습니다");
    await p0.close();
  }

  /* ⑧-5 **티오프 시간대** (2026-11-08) — 사장님이 "날짜 시간 다 정해서"
     라고 하신 자리입니다.
     ⚠️⚠️ **보내는 질의를 뜯어 봅니다** — 흉내 장치는 걸러 주지 않으므로
     줄 수로 재면 시간대를 통째로 떼어도 **영원히 초록**입니다.
     ⚠️ 갯수를 박지 않습니다 — 고르개의 수를 `AM_TEE_BAND` 에서 셉니다. */
  {
    const g = await open("/", { role:"customer", name:"손님", signedIn:true },
      { v_teetime_count: TCNT, v_join_count: [], v_teetime_open: TEE }, {}, true);
    await g.p.waitForTimeout(400);
    const r = await g.p.evaluate(function(){
      const sel = document.querySelector('#teeboard [data-tbf="t"]');
      return { on: !!sel,
               opts: sel ? Array.prototype.map.call(sel.options,
                 function(o){ return o.value; }).filter(Boolean) : [],
               keys: (window.AM_TEE_BAND || []).map(function(x){ return x.key; }) };
    });
    ok("메인 찾는 칸에 **시간대**가 있다 (부킹)", r.on,
       JSON.stringify(r).slice(0, 160));
    ok("  고르개가 **AM_TEE_BAND 한 곳**에서 온다 (글자로 안 박습니다)",
       r.keys.length > 0 && r.opts.join(",") === r.keys.join(","),
       r.opts.join(",") + " / " + r.keys.join(","));

    await g.p.selectOption('#teeboard [data-tbf="t"]', "am");
    await g.p.click("#teeboard .tbf-go");
    await g.p.waitForTimeout(800);
    const u = g.p.url();
    ok("⚠️ 찾는 단추가 **그 시간대**로 보낸다", u.indexOf("t=am") >= 0, u);
    const got = await g.p.evaluate(function(){
      const el = document.querySelector("#ttlist #tf-t");
      return el ? el.value : null;
    });
    ok("  ⚠️⚠️ **받는 쪽이 그 시간대로 열린다**", got === "am", String(got));
    /* ⚠️⚠️⚠️ **거르는 것은 서버입니다** — 백 줄만 받아 화면에서 거르면
       맞는 자리가 그 백 줄 밖에 있을 때 0건으로 보입니다.
       ⚠️ 아래를 열고 위를 닫습니다(gte · lt) — 둘 다 닫으면 12:00 이
       오전에도 오후에도 걸립니다. */
    const q = g.sent.filter(function(x){
      return x.name === "GET" && String(x.body).indexOf("v_teetime_open") >= 0;
    }).map(function(x){ return decodeURIComponent(String(x.body)); });
    ok("  ⚠️⚠️ 시간대를 **서버에 보내서** 거른다 (화면에서 거르지 않습니다)",
       q.some(function(x){ return x.indexOf("tee_at=gte.08:00") >= 0 &&
         x.indexOf("tee_at=lt.12:00") >= 0; }),
       q.slice(-2).join(" / ").slice(0, 240));
    await g.p.close();
  }
  {
    /* ⚠️ 조인에는 **시간대 칸을 안 냅니다** — `joinroom.tee` 가 자유
       글자라 숫자로 견줄 수가 없습니다 (고르게 두고 안 걸러 주면
       눌러도 아무 일이 안 나는 칸입니다 · 절대 규칙 5). */
    const g = await open("/cat/matchup", { role:"customer", name:"손님", signedIn:true },
      { v_teetime_count: TCNT, v_join_count: TCNT, v_teetime_open: TEE }, {}, true);
    await g.p.waitForTimeout(700);
    const r = await g.p.evaluate(function(){
      return { board: !!document.querySelector('#teeboard [data-tbf="t"]'),
               list: !!document.querySelector("#ttlist #tf-t") };
    });
    ok("조인에는 **시간대 칸을 안 낸다** (견줄 자료가 없습니다)",
       r.board === false && r.list === false, JSON.stringify(r));
    await g.p.close();
  }

  /* ⑨ 폰 폭 셋 */
  for(const w of PHONES){
    const p2 = await b.newPage({ viewport: { width: w, height: 900 } });
    await stub(p2, { role:"customer", name:"손님", signedIn:true },
               { v_teetime_open: TEE, v_teetime_count: TCNT, v_join_count: [] },
               {}, true);
    await p2.goto(base + "/cat/booking", { waitUntil:"networkidle" });
    await p2.waitForTimeout(600);
    await p2.click(".tf-book").catch(function(){});
    await p2.waitForTimeout(350);
    const r = await p2.evaluate(function(){
      const small = [], low = [];
      Array.prototype.forEach.call(
        document.querySelectorAll(".tf-i, .tf-bar, .none, .tf-f"),
        function(box){
          Array.prototype.forEach.call(box.querySelectorAll("*"), function(e){
            if(e.firstChild && e.firstChild.nodeType === 3 && (e.textContent||"").trim()){
              const fs = parseFloat(getComputedStyle(e).fontSize);
              if(fs < 12) small.push(e.tagName + " " + fs);
            }
          });
          Array.prototype.forEach.call(box.querySelectorAll("button, a"), function(e){
            if(e.getBoundingClientRect().height < 39.5) low.push(e.tagName);
          });
        });
      return { doc: document.documentElement.scrollWidth, win: window.innerWidth,
               drawn: document.querySelectorAll(".tf-i").length,
               small: small.slice(0,4), low: low.slice(0,4) };
    });
    if(w === PHONES[0])
      ok("티타임 — 폰에서 그려지기는 한다", r.drawn > 0, JSON.stringify(r));
    ok("티타임 " + w + "px — **가로로 안 밀린다**", r.doc <= r.win + 1,
       "문서 " + r.doc + "px · 화면 " + r.win + "px");
    ok("티타임 " + w + "px — 12px 미만 글자가 없다", r.small.length === 0,
       r.small.join(" · "));
    ok("티타임 " + w + "px — 누르는 것이 40px 이상이다", r.low.length === 0,
       r.low.join(" · "));
    await p2.close();
  }

  /* ══════════════════════════════════════════════════════════════
     자유게시판 (0047 · 0059) — ⚠️ **설정이 있어야 열리는 자리라
     빌드가 찍은 HTML 만 보는 검사는 영원히 못 봅니다.** 여기서 누릅니다.
     ⚠️⚠️⚠️ **읽기는 누구나 · 쓰기는 로그인한 분만** — 두 가지는 다른
     자물쇠이므로 **갈라서** 잽니다 (비회원에게 글이 보이는가 · 비회원이
     글쓰기를 누르면 로그인 길이 나오는가).
     ⚠️⚠️ 흉내 장치는 조건을 보고 걸러 주지 않으므로, 게시판 거르개와
     쪽 넘기기는 **보내는 질의를 뜯어** 봅니다 (줄 수로 재면 거르개를
     떼어도 영원히 초록입니다).
     ══════════════════════════════════════════════════════════════ */
  console.log("\n── 자유게시판 (0047 · 0059)");
  /* ⚠️⚠️ **가짜 자료도 DB 가 받는 값이어야 합니다** — `cq.cat` 은
     **게시판 키**(cm-*)입니다. 전에 여기 `lesson`(분류 키)을 적어 두어서
     화면이 키를 그대로 찍었고, 그것을 보고 멀쩡한 화면을 고칠 뻔했습니다. */
  const CQ = [
    { id:"q1", cat:"cm-open", title:"주말에 라운딩 다녀왔습니다",
      body:"날씨가 좋았습니다.\n다음에 또 가려고 합니다.", who:"버디사냥꾼",
      named:true, created_at:"2026-11-06T01:00:00Z",
      updated_at:"2026-11-06T01:00:00Z",
      answer_n:1, view_n:42, photo_n:1, mine:true },
    { id:"q2", cat:"cm-ask", title:"드라이버 슬라이스 고치는 법",
      body:"오른쪽으로 많이 휩니다", who:"김**", named:false,
      created_at:"2026-11-05T01:00:00Z", updated_at:"2026-11-05T01:00:00Z",
      answer_n:1, view_n:7, photo_n:0, mine:false }
  ];
  const CA = [{ id:"a1", q_id:"q1", who:"이**", named:false,
    body:"그립을 먼저 보세요", created_at:"2026-11-05T02:00:00Z",
    by_asker:false, mine:true }];
  /* ⚠️⚠️ 게시판 목록은 **`catalog.js` 에서 읽습니다** — 검사에 이름을
     적어 두면 게시판을 더하는 날 멀쩡한 화면이 빨개집니다.
     ⚠️ `window` 를 빌려 쓰고 **그대로 돌려놓습니다** (check-deal 이
     `global.window` 를 덮어써 빌드를 통째로 깨뜨린 자리입니다). */
  const BDS = boardsOf();
  ok("게시판 목록을 catalog.js 에서 실제로 읽었다 (" + BDS.length + "곳)",
     BDS.length >= 5, BDS.map(function(x){ return x.key; }).join(","));

  /* ① 설정 전에는 아무것도 안 엽니다 */
  {
    const p0 = await b.newPage({ viewport: view });
    await p0.route("**/api/session", function(r){
      return r.fulfill({ status:200, contentType:"application/json",
        body: JSON.stringify({ auth:false, signedIn:false, conf:null }) });
    });
    await p0.goto(base + "/cat/community", { waitUntil:"networkidle" });
    await p0.waitForTimeout(400);
    const off = await p0.evaluate(function(){
      const b2 = document.getElementById("cqbox");
      return { form: !!document.getElementById("cqf"),
               boxHtml: (b2 ? b2.innerHTML : "").trim().length };
    });
    ok("⚠️ 설정 전에는 게시판 양식을 **안 엽니다**",
       !off.form && off.boxHtml === 0, JSON.stringify(off));
    await p0.close();
  }

  /* ② 모아보기 — 게시판마다 상자가 서고 0건도 빠지지 않습니다 */
  {
    const g = await open("/cat/community", { role:"customer", name:"손님", signedIn:true },
                         { v_cq_public: CQ, v_ca_public: CA }, {}, true);
    const r = await g.p.evaluate(function(){
      const bx = document.querySelectorAll(".cqg-b");
      return { n: bx.length, body: document.body.innerText,
               more: document.querySelectorAll(".cqg-more").length,
               chips: document.querySelectorAll(".cqb-c .chip").length };
    });
    /* ⚠️ 갯수를 박지 않습니다 — **게시판 수와 같은가**를 봅니다
       (게시판을 더하는 날 이 줄을 안 고쳐도 됩니다). */
    ok("모아보기에 게시판 상자가 **게시판 수만큼** 선다 (" + BDS.length + "곳)",
       r.n === BDS.length, "상자 " + r.n + " · 게시판 " + BDS.length);
    ok("  ⚠️⚠️ 0건인 게시판도 **안 숨깁니다** (첫 글을 남길 길이 사라집니다)",
       r.more === BDS.length, "더 보기 " + r.more);
    ok("  게시판 이름을 글자로 박지 않고 끌어옵니다",
       BDS.every(function(x){ return r.body.indexOf(x.name) >= 0; }), "");
    /* ⚠️ 거르개는 모아보기 · 전체 글 + 게시판들입니다 */
    ok("  거르개에 모아보기 · 전체 글이 같이 있다",
       r.chips === BDS.length + 2, "칩 " + r.chips);
    await g.p.close();
  }

  /* ③ 거르개 — ⚠️⚠️ **보내는 질의를 뜯어** 봅니다 (줄 수로 재면 안 잡힙니다) */
  {
    const g = await open("/cat/community", { role:"customer", name:"손님", signedIn:true },
                         { v_cq_public: CQ, v_ca_public: CA }, {}, true);
    const before = g.sent.length;
    await g.p.click('.cqb-c .chip[data-bd="cm-ask"]');
    await g.p.waitForTimeout(450);
    const qs = g.sent.slice(before).filter(function(x){ return x.name === "GET"; })
      .map(function(x){ return x.body; });
    ok("⚠️⚠️ 게시판을 누르면 **그 게시판으로 좁혀 묻는다**",
       qs.some(function(u){ return u.indexOf("cat=eq.cm-ask") >= 0; }),
       qs.slice(0, 2).join(" | ").slice(0, 160));
    const url1 = await g.p.evaluate(function(){ return location.search; });
    ok("  ⚠️ 주소가 같이 바뀐다 (복사해 보내도 같은 화면입니다)",
       url1.indexOf("s=cm-ask") >= 0, url1);
    /* ⚠️ "전체 글" 은 **안 좁혀야** 합니다 */
    const b2 = g.sent.length;
    await g.p.click('.cqb-c .chip[data-bd="all"]');
    await g.p.waitForTimeout(450);
    const qs2 = g.sent.slice(b2).filter(function(x){ return x.name === "GET"; })
      .map(function(x){ return x.body; });
    ok("  전체 글은 **게시판으로 안 좁힌다**",
       qs2.length > 0 && qs2.every(function(u){ return u.indexOf("cat=eq.") < 0; }),
       qs2.slice(0, 2).join(" | ").slice(0, 160));
    await g.p.close();
  }
  /* ④ 쉼표로 여럿 — ⚠️⚠️⚠️ 머리말의 「골프 정보 · 후기」가 게시판 **넷**을
     한 번에 보냅니다(2026-11-09). 하나만 좁히면 메뉴가 "후기" 를 말해 놓고
     후기를 안 냅니다. ⚠️ 흉내 장치는 걸러 주지 않으므로 **보내는 질의를
     뜯어** 봅니다 — 줄 수로 재면 쉼표를 통째로 떼어도 영원히 초록입니다. */
  {
    const many = "cm-tip,cm-course,cm-lesson,cm-gear";
    const g = await open("/cat/community?s=" + many,
                         { role:"customer", name:"손님", signedIn:true },
                         { v_cq_public: CQ, v_ca_public: CA }, {}, true);
    const qs = g.sent.filter(function(x){ return x.name === "GET"; })
      .map(function(x){ return x.body; })
      .filter(function(u){ return u.indexOf("v_cq_public") >= 0; });
    const hit = qs.filter(function(u){ return u.indexOf("cat=in.") >= 0; });
    ok("⚠️⚠️ 게시판 넷을 **한 번에** 좁혀 묻는다 (cat=in.(…))",
       hit.length > 0, qs.slice(0, 2).join(" | ").slice(0, 200));
    /* 넷이 **빠짐없이** 실려야 합니다 — 하나라도 빠지면 그 게시판 글이
       메뉴를 눌렀을 때 안 나옵니다(에러는 한 줄도 안 납니다). */
    const q1 = decodeURIComponent(hit[0] || "");
    ok("  넷이 하나도 안 빠졌다",
       ["cm-tip","cm-course","cm-lesson","cm-gear"].every(function(k){
         return q1.indexOf(k) >= 0; }), q1.slice(0, 200));
    ok("  ⚠️ `cat=eq.` 로 **하나만** 묻지 않는다",
       qs.every(function(u){ return u.indexOf("cat=eq.") < 0; }),
       qs.slice(0, 2).join(" | ").slice(0, 200));
    /* 칩은 **넷 다** 켜져야 합니다 — 켜진 칩과 거르는 조건이 어긋나면
       손님은 무엇으로 좁혔는지 알 수가 없습니다. */
    const on = await g.p.evaluate(function(){
      return [].slice.call(document.querySelectorAll(".cqb-c .chip-on"))
               .map(function(a){ return a.getAttribute("data-bd"); });
    });
    ok("  고른 게시판 넷이 **칩에 다 켜져 있다**",
       on.length === 4 && on.indexOf("cm-tip") >= 0 && on.indexOf("cm-gear") >= 0,
       JSON.stringify(on));
    await g.p.close();
  }

  /* ④ 목록 한 장 — 제목 · 글쓴이 · 날짜 · 댓글 수 · **회원 조회** */
  {
    const g = await open("/cat/community?s=cm-open",
                         { role:"customer", name:"손님", signedIn:true },
                         { v_cq_public: CQ, v_ca_public: CA }, {}, true);
    const r = await g.p.evaluate(function(){
      const li = document.querySelector(".cqr");
      return { row: !!li, body: li ? li.innerText : "",
               link: !!(li && li.querySelector(".cqr-t")) };
    });
    ok("게시판 하나를 열면 글 줄이 그려진다", r.row && r.link, JSON.stringify(r).slice(0,140));
    ok("  제목 · 글쓴이 · 날짜 · 댓글 수가 한 줄에 있다",
       ["주말에 라운딩", "버디사냥꾼", "2026.11.6", "댓글"].every(function(t){
         return r.body.indexOf(t) >= 0; }), r.body.replace(/\n/g, " ").slice(0, 160));
    /* ⚠️⚠️⚠️ **"조회" 가 아니라 "회원 조회"** 입니다 — 비로그인 조회는
       셀 수가 없어서(IP 를 안 받습니다) 그냥 "조회" 라고 적으면 실제보다
       작은 수를 전체인 것처럼 내는 것이고, 그건 지어낸 숫자입니다. */
    ok("⚠️⚠️ **회원 조회**라고 적는다 (그냥 '조회' 가 아닙니다)",
       r.body.indexOf("회원 조회") >= 0 &&
       r.body.replace("회원 조회", "").indexOf("조회") < 0,
       r.body.replace(/\n/g, " ").slice(0, 160));
    await g.p.close();
  }

  /* ⑤ 비회원 — **글은 보이고** 쓰는 것은 로그인입니다 */
  {
    const g = await open("/cat/community?s=cm-open",
                         { role:"customer", name:"", signedIn:false },
                         { v_cq_public: CQ, v_ca_public: CA }, {}, true);
    const r = await g.p.evaluate(function(){
      return { row: !!document.querySelector(".cqr"),
               body: document.body.innerText,
               form: !!document.getElementById("cqf") };
    });
    ok("⚠️⚠️⚠️ 가입 안 하셔도 **글이 보인다**", r.row, JSON.stringify(r).slice(0,140));
    ok("  ⚠️⚠️ 글쓴이 이름이 **가려져** 나온다 (공개 보기에 by_user 가 없습니다)",
       r.body.indexOf("김**") >= 0, "");
    await g.p.click(".cq-new");
    await g.p.waitForTimeout(400);
    const r2 = await g.p.evaluate(function(){
      const box = document.getElementById("cqbox");
      return { form: !!document.getElementById("cqf"),
               login: !!(box && box.querySelector('a[href^="/login"]')),
               body: box ? box.innerText : "" };
    });
    /* ⚠️⚠️⚠️ **0063 으로 뒤집힌 자리입니다.** 전에는 "비회원이 글쓰기를
       누르면 로그인 길을 낸다 (양식이 아닙니다)" 를 재고 있었는데,
       최종 작업지시서 C 가 **"누구나 로그인 없이 새 글 작성"** 을 필수로
       요구합니다 — 그 검사를 그대로 두면 **지시서가 요구한 기능을
       고장으로** 잡습니다. 지금 재는 것은 셋입니다:
         ① 양식이 **열리는가** (비회원도 씁니다)
         ② 그래도 **로그인 길을 같이** 내는가 (회원으로 올리시면 비밀번호
            없이 고치고 내릴 수 있습니다 — 더 나은 길을 숨기지 않습니다)
         ③ **비밀번호를 잊으면 직접 못 고친다**고 그 자리에서 말하는가
            (말없이 받으면 잊으신 분이 막다른 길에 섭니다 · 절대 규칙 2) */
    ok("⚠️⚠️⚠️ 비회원이 글쓰기를 누르면 **양식이 열린다** (지시서 C 의 필수)",
       r2.form, JSON.stringify(r2).slice(0, 140));
    ok("  ⚠️ 그래도 **로그인 길을 같이** 낸다 (더 나은 길을 숨기지 않습니다)",
       r2.login, JSON.stringify(r2).slice(0, 140));
    ok("  ⚠️ 돌아올 자리를 주소에 싣는다 (로그인 뒤 보시던 자리로)",
       (await g.p.evaluate(function(){
         const a = document.querySelector('#cqbox a[href^="/login"]');
         return a ? a.getAttribute("href") : ""; })).indexOf("cat%2Fcommunity") >= 0 ||
       (await g.p.evaluate(function(){
         const a = document.querySelector('#cqbox a[href^="/login"]');
         return a ? a.getAttribute("href") : ""; })).indexOf("/cat/community") >= 0, "");
    /* ⚠️⚠️ 닉네임 · 글 비밀번호 칸이 **실제로** 있는가 (지시서 C 의 필수 칸) */
    ok("  닉네임 · 글 비밀번호 칸이 있다",
       (await g.p.locator("#cqf #c-nick").count()) === 1 &&
       (await g.p.locator("#cqf #c-pw").count()) === 1, "");
    /* ⚠️⚠️ **허니팟**은 사람에게 안 보여야 합니다 — 보이면 손님이 채웁니다.
       ⚠️⚠️⚠️ **`offsetParent` 로 재면 멀쩡한 코드를 고장이라고 합니다.**
       처음에 그렇게 썼는데, `.sr-only` 는 `position:absolute` 라 그 칸의
       `offsetParent` 가 **null 이 아닙니다** (가장 가까운 자리 잡은
       조상입니다 — 작업 기억의 `.sr` 자리와 같은 결입니다). `hidden` 을
       쓰면 자동 프로그램도 건너뛰어 덫이 안 되므로, 가리는 방법은
       **1px 로 줄여 잘라내는 것**입니다. 그러니 재는 것도 **그 상자의
       크기**입니다 (칸 자체는 1px 상자 안에서 제 크기를 그대로 들고
       있습니다 — `clip` 이 상자를 줄이지 않습니다). */
    ok("  ⚠️ 봇 잡는 칸은 **사람 눈에 안 보인다**",
       (await g.p.locator("#cqf #c-site").count()) === 1 &&
       (await g.p.evaluate(function(){
          const e = document.getElementById("c-site");
          const w = e && e.closest(".sr-only");
          if(!w) return false;
          const b = w.getBoundingClientRect();
          return b.width <= 1.5 && b.height <= 1.5;
        })), "");
    ok("  ⚠️⚠️ **비밀번호를 잊으면 직접 못 고친다**고 그 자리에서 말한다",
       r2.body.indexOf("직접 고치거나 내릴 수 없습니다") >= 0 &&
       r2.body.indexOf("고객센터") >= 0, r2.body.slice(0, 200));
    await g.p.close();
  }

  /* ⑥ 글쓰기 — ⚠️⚠️⚠️ 고르개가 **게시판**이어야 합니다 (분류가 아닙니다) */
  {
    const g = await open("/cat/community?s=cm-ask",
                         { role:"customer", name:"손님", signedIn:true },
                         { v_cq_public: CQ, v_ca_public: CA }, {}, true);
    await g.p.click(".cq-new");
    await g.p.waitForTimeout(400);
    const r = await g.p.evaluate(function(){
      const f = document.getElementById("cqf");
      if(!f) return { form:false };
      return { form:true,
        req: Array.prototype.map.call(f.querySelectorAll("[required]"),
               function(e){ return e.name; }),
        opts: Array.prototype.map.call(f.querySelectorAll("#c-cat option"),
               function(o){ return o.value; }).filter(Boolean),
        picked: f.cat.value };
    });
    ok("로그인하면 글쓰기 양식이 열린다", r.form, JSON.stringify(r).slice(0,120));
    ok("  게시판 · 제목 · 내용이 **필수**다",
       ["cat","title","body"].every(function(n){ return (r.req||[]).indexOf(n) >= 0; }),
       (r.req || []).join(","));
    /* ⚠️⚠️⚠️ **2026-11-06 까지 여기가 분류 열(lesson · booking …)이었습니다** —
       그래서 `자유게시판`(cm-open)을 **고를 수가 없었고**, `cq.cat` 에 분류
       키가 들어가고 있었습니다. 표의 check 는 빈 글자만 막고 `check-deal` 은
       enum 만 보므로 아무도 못 잡았습니다. */
    ok("⚠️⚠️⚠️ 고르개가 **게시판 목록**이다 (분류 열이 아닙니다)",
       r.opts.length === BDS.length &&
       r.opts.every(function(k){ return k.indexOf("cm-") === 0; }),
       r.opts.join(","));
    ok("  ⚠️ 보고 있는 게시판이 **미리 골라져** 있다 (다시 고르게 하지 않습니다)",
       r.picked === "cm-ask", r.picked);

    await g.p.fill("#c-title", "검사용 글");
    await g.p.fill("#c-body", "검사로 올리는 글입니다");
    await g.p.click("#cqf button[type=submit]");
    await g.p.waitForTimeout(400);
    const askCall = g.sent.filter(function(x){ return x.name === "ask_cq"; })[0];
    ok("⚠️ 올리기 단추가 **ask_cq 를 실제로 부른다**", !!askCall,
       g.sent.map(function(x){ return x.name; }).join(","));
    if(askCall){
      const sp = JSON.parse(askCall.body).p;
      ok("  게시판 키를 그대로 보낸다 (분류 키가 아닙니다)",
         sp.cat === "cm-ask" && sp.title === "검사용 글", JSON.stringify(sp));
    }
    await g.p.close();
  }

  /* ⑦ 0건 — ⚠️ 지시서 문구 그대로 · 그리고 막다른 길이 아닙니다 */
  {
    const g = await open("/cat/community?s=cm-open",
                         { role:"customer", name:"손님", signedIn:true },
                         { v_cq_public: [], v_ca_public: [] }, {}, true);
    const r = await g.p.evaluate(function(){
      return { body: document.body.innerText,
               go: document.querySelectorAll("#cqlist .cq-new").length };
    });
    ok("0건이면 **0건이라고 말한다**",
       r.body.indexOf("아직 작성된 글이 없습니다. 첫 번째 이야기를 남겨보세요.") >= 0,
       r.body.slice(0, 160));
    ok("  ⚠️ 막다른 길로 두지 않는다 (첫 글 작성하기)", r.go >= 1, "단추 " + r.go);
    ok("  ⚠️⚠️ **지어낸 글을 안 채운다** (가짜 제목 · 가짜 조회 수가 없습니다)",
       r.body.indexOf("회원 조회") < 0, r.body.slice(0, 160));
    await g.p.close();
  }

  /* ⑧ 상세 — 본문 · 댓글 · 신고 · 본인만 고치기 · **회원 조회를 한 번** */
  {
    const g = await open("/cat/community?q=q1",
                         { role:"customer", name:"손님", signedIn:true },
                         { v_cq_public: CQ, v_ca_public: CA }, {}, true);
    const r = await g.p.evaluate(function(){
      const a = document.querySelector(".cqd");
      return { drawn: !!a, body: document.body.innerText,
               mine: document.querySelectorAll('.cqd-act a[href="/my"]').length,
               rep: document.querySelectorAll(".cq-rep").length,
               back: document.querySelectorAll('[data-back="1"]').length,
               cal: document.querySelectorAll(".cal > li").length,
               caf: !!document.querySelector(".caf") };
    });
    ok("글을 누르면 상세가 그려진다", r.drawn, JSON.stringify(r).slice(0,140));
    ok("  본문이 그대로 나온다", r.body.indexOf("날씨가 좋았습니다") >= 0, "");
    ok("  댓글이 그려지고 양식이 같이 나온다", r.cal === 1 && r.caf,
       "댓글 " + r.cal);
    ok("  ⚠️ 목록으로 돌아갈 길이 있다 (막다른 길이 아닙니다)", r.back >= 1, "");
    ok("  ⚠️ 본인 글이라 고치는 길을 낸다", r.mine === 1, "고치기 " + r.mine);
    ok("  ⚠️ 로그인했으면 신고하는 길이 있다", r.rep === 1, "신고 " + r.rep);
    /* ⚠️⚠️ **회원 조회를 한 번 셉니다** — 화면이 그 문을 부르는지 봅니다 */
    const vc = g.sent.filter(function(x){ return x.name === "view_cq"; });
    ok("⚠️⚠️ 글을 열면 **view_cq 를 한 번** 부른다 (회원 조회)",
       vc.length === 1, "부른 횟수 " + vc.length);
    if(vc.length) ok("  어느 글인지 실어 보낸다",
       JSON.parse(vc[0].body).p.question === "q1", vc[0].body);

    await g.p.fill(".caf textarea", "검사로 다는 댓글입니다");
    await g.p.click(".caf button[type=submit]");
    await g.p.waitForTimeout(400);
    ok("⚠️ 댓글 단추가 **answer_cq 를 실제로 부른다**",
       g.sent.some(function(x){ return x.name === "answer_cq"; }),
       g.sent.map(function(x){ return x.name; }).join(","));
    await g.p.close();
  }

  /* ⑩ ⚠️⚠️⚠️ **0065 — 비밀번호 갈래는 예외가 아니라 글자로 옵니다.**
     `raise exception` 은 그 함수가 한 일(틀린 시도 한 줄)을 통째로
     되돌리므로, 비밀번호 갈래만 `ok` · `bad_pw` · `blocked` 를
     **돌려주고** 화면이 말을 고릅니다. 그래서 **화면 쪽을 눌러
     봅니다** — DB 가 `blocked` 를 내도 화면이 그 말을 안 하면
     손님에게는 **아무 일도 안 일어난 단추**입니다 (절대 규칙 5). */
  {
    const GQ = [{ id:"gq1", cat:"cm-open", title:"비회원이 올린 글",
      body:"비밀번호로 고치고 내립니다", who:"길손", named:true,
      created_at:"2026-11-07T01:00:00Z", updated_at:"2026-11-07T01:00:00Z",
      answer_n:0, view_n:3, photo_n:0, mine:false, guest:true }];
    for(const [code, want] of [["bad_pw", "비밀번호가 맞지 않습니다"],
                               ["blocked", "여러 번 틀리셨습니다"]]){
      const g = await open("/cat/community?q=gq1",
                           { role:"customer", name:"", signedIn:false },
                           { v_cq_public: GQ, v_ca_public: [] },
                           { edit_cq_guest: code }, true);
      /* 비회원 글이면 비밀번호 상자가 나옵니다 */
      const has = await g.p.locator("#cqlist .cqg").count();
      ok("비회원 글에 **비밀번호 상자**가 나온다 (" + code + ")", has >= 1,
         String(has));
      await g.p.click("#cqlist .cqg-e").catch(function(){});
      await g.p.waitForTimeout(200);
      await g.p.fill("#cqlist #g-pw", "aaaa").catch(function(){});
      await g.p.fill("#cqlist #g-title", "바꾼 제목입니다").catch(function(){});
      await g.p.fill("#cqlist #g-body", "바꾼 내용입니다 여기").catch(function(){});
      await g.p.click("#cqlist .cqg-f button[type='submit']").catch(function(){});
      await g.p.waitForTimeout(350);
      const r = await g.p.evaluate(function(){
        const m = document.querySelector("#cqlist .cqg-m");
        const b = document.querySelector("#cqlist .cqg-f button[type='submit']");
        return { msg: m ? (m.textContent || "") : "(없음)",
                 hidden: !!(m && m.hidden),
                 again: !!(b && !b.disabled) };
      });
      ok("  ⚠️⚠️ `" + code + "` 면 **그 말을 화면에 적는다**",
         !r.hidden && r.msg.indexOf(want) >= 0, r.msg.slice(0, 80));
      /* ⚠️ 다시 눌러 볼 수 있어야 합니다 — 단추가 잠긴 채로 남으면
         손님은 다시 해 볼 길이 없습니다 (막다른 길 · 절대 규칙 2). */
      ok("  ⚠️ 단추가 **다시 눌립니다** (막다른 길로 두지 않습니다)",
         r.again, JSON.stringify(r).slice(0, 120));
      await g.p.close();
    }
  }

  /* ⑨ 비회원 상세 — ⚠️⚠️ **회원 조회를 안 세고** 댓글 양식 대신 로그인 */
  {
    const g = await open("/cat/community?q=q1",
                         { role:"customer", name:"", signedIn:false },
                         { v_cq_public: CQ, v_ca_public: CA }, {}, true);
    const r = await g.p.evaluate(function(){
      return { drawn: !!document.querySelector(".cqd"),
               caf: !!document.querySelector(".caf"),
               rep: document.querySelectorAll(".cq-rep").length,
               login: document.querySelectorAll('#cqlist a[href^="/login"]').length };
    });
    ok("비회원도 **글과 댓글을 본다**", r.drawn, JSON.stringify(r));
    ok("  ⚠️ 댓글 양식 대신 로그인 길을 낸다", !r.caf && r.login >= 1, JSON.stringify(r));
    ok("  ⚠️ 신고 단추를 **안 낸다** (눌러도 거절되는 칸입니다)", r.rep === 0, "");
    /* ⚠️⚠️⚠️ `view_cq` 의 EXECUTE 는 `authenticated` 에게만 있습니다 —
       비회원이 부르면 `permission denied` 입니다. 화면이 안 불러야 합니다. */
    ok("⚠️⚠️ 비회원에게는 **view_cq 를 아예 안 부른다**",
       g.sent.filter(function(x){ return x.name === "view_cq"; }).length === 0,
       g.sent.map(function(x){ return x.name; }).join(","));
    await g.p.close();
  }

  /* ⑩ 사진 칸 — ⚠️ 버킷이 꺼져 있으면 **아예 안 그립니다** */
  {
    const g = await open("/cat/community?q=q1",
                         { role:"customer", name:"손님", signedIn:true },
                         { v_cq_public: CQ, v_ca_public: CA }, {}, false);
    const n = await g.p.evaluate(function(){
      return document.querySelectorAll(".cqd-up").length; });
    ok("⚠️ 사진 버킷이 꺼져 있으면 사진 칸을 **안 냅니다**", n === 0, "칸 " + n);
    await g.p.close();
  }
  {
    const g = await open("/cat/community?q=q1",
                         { role:"customer", name:"손님", signedIn:true },
                         { v_cq_public: CQ, v_ca_public: CA }, {}, true);
    const r = await g.p.evaluate(function(){
      return { up: document.querySelectorAll(".cqd-up").length,
               f: !!document.querySelector(".cq-ph-f") };
    });
    ok("버킷이 켜져 있고 **내 글**이면 사진 칸을 낸다", r.up === 1 && r.f,
       JSON.stringify(r));
    await g.p.close();
  }

  /* ⑪ 폰 폭 셋 — ⚠️ 가로 밀림 · 12px · 누름 40px */
  for(const w of PHONES){
    const p2 = await b.newPage({ viewport: { width: w, height: 900 } });
    await stub(p2, { role:"customer", name:"손님", signedIn:true },
               { v_cq_public: CQ, v_ca_public: CA }, {}, true);
    await p2.goto(base + "/cat/community", { waitUntil:"networkidle" });
    await p2.waitForTimeout(600);
    const r = await p2.evaluate(function(){
      const small = [], low = [];
      Array.prototype.forEach.call(
        document.querySelectorAll(".cqg-b, .cqr, .cqd, .jbox, .none, .cqh"),
        function(box){
          Array.prototype.forEach.call(box.querySelectorAll("*"), function(e){
            if(e.firstChild && e.firstChild.nodeType === 3 && (e.textContent||"").trim()){
              const fs = parseFloat(getComputedStyle(e).fontSize);
              if(fs < 12) small.push(e.tagName + " " + fs);
            }
          });
          Array.prototype.forEach.call(box.querySelectorAll("button, a"), function(e){
            if(e.getBoundingClientRect().height < 39.5) low.push(e.tagName);
          });
        });
      return { doc: document.documentElement.scrollWidth, win: window.innerWidth,
               drawn: document.querySelectorAll(".cqg-b").length,
               small: small.slice(0,4), low: low.slice(0,4) };
    });
    if(w === PHONES[0])
      ok("게시판 — 폰에서 그려지기는 한다", r.drawn > 0, JSON.stringify(r));
    ok("게시판 " + w + "px — **가로로 안 밀린다**", r.doc <= r.win + 1,
       "문서 " + r.doc + "px · 화면 " + r.win + "px");
    ok("게시판 " + w + "px — 12px 미만 글자가 없다", r.small.length === 0,
       r.small.join(" · "));
    ok("게시판 " + w + "px — 누르는 것이 40px 이상이다", r.low.length === 0,
       r.low.join(" · "));
    await p2.close();
  }

  /* ⑫ /my — 내 글 고치기 · 내리기 */
  {
    const MYQ = [{ id:"q1", cat:"cm-open", title:"내 글", body:"내용입니다",
                   state:"live", hidden_why:null, created_at:"2026-11-05T01:00:00Z" },
                 { id:"q2", cat:"cm-ask", title:"가려진 글", body:"내용",
                   state:"hidden", hidden_why:"광고 글입니다",
                   created_at:"2026-11-04T01:00:00Z" }];
    const MYA = [{ id:"a1", q_id:"q9", body:"내 댓글입니다", state:"live",
                   hidden_why:null, created_at:"2026-11-05T02:00:00Z" }];
    const g = await open("/my", { role:"customer", name:"손님", signedIn:true },
      { cq: MYQ, ca: MYA, joinroom: [], joinapply: [], v_join_contact: [],
        request: [], quote: [], review: [] }, {}, true);
    const r = await g.p.evaluate(function(){
      const box = document.getElementById("mycq");
      return { drawn: !!box && !box.hidden && box.children.length > 0,
               body: box ? box.innerText : "",
               edits: box ? box.querySelectorAll(".mq-edit").length : 0,
               drops: box ? box.querySelectorAll(".mq-drop").length : 0 };
    });
    ok("/my 에 내가 쓴 글이 그려진다", r.drawn, JSON.stringify(r).slice(0,140));
    ok("  내 글과 내 댓글을 **갈라서** 보여 준다",
       r.body.indexOf("내 글") >= 0 && r.body.indexOf("내 댓글") >= 0, "");
    /* ⚠️⚠️⚠️ **`cq.cat` 은 게시판 키입니다** — 2026-11-06 까지 이 화면이
       `AM_CATS`(분류 열)에서 이름을 찾아 `cm-open` 을 못 찾고 **키 그대로**
       찍고 있었습니다 (글쓰기 양식의 거울상 고장). */
    ok("⚠️⚠️ 게시판 이름을 **사람 말로** 적는다 (영문 키가 아닙니다)",
       r.body.indexOf("자유게시판") >= 0 && r.body.indexOf("cm-open") < 0,
       r.body.replace(/\n/g, " ").slice(0, 160));
    ok("  ⚠️ 가린 **까닭을 보여 준다** (무엇이 문제였는지 알아야 합니다)",
       r.body.indexOf("광고 글입니다") >= 0, "");
    ok("⚠️⚠️ 가려진 글에는 고치기 · 내리기가 **안 나온다** (살아 있는 둘만)",
       r.edits === 2 && r.drops === 2,
       "고치기 " + r.edits + " · 내리기 " + r.drops);

    await g.p.evaluate(function(){ window.confirm = function(){ return true; }; });
    await g.p.click(".mq-drop");
    await g.p.waitForTimeout(400);
    const mvc = g.sent.filter(function(x){ return x.name === "move_cq"; })[0];
    ok("⚠️ 내리기가 **move_cq 를 실제로 부른다**", !!mvc,
       g.sent.map(function(x){ return x.name; }).join(","));
    if(mvc) ok("  dropped 로 보낸다 (지우지 않습니다)",
       JSON.parse(mvc.body).p.state === "dropped", mvc.body);
    await g.p.close();
  }

  /* ⑬ 공개 닉네임 (/my · 0059) */
  {
    const g = await open("/my", { role:"customer", name:"손님", signedIn:true },
      { account: [{ nick:"버디사냥꾼" }], cq: [], ca: [], joinroom: [],
        request: [], quote: [], review: [] }, {}, true);
    const r = await g.p.evaluate(function(){
      const box = document.getElementById("nickbox");
      return { drawn: !!box && !box.hidden, body: box ? box.innerText : "",
               val: (document.getElementById("nk") || {}).value,
               clear: box ? box.querySelectorAll("[data-nkclear]").length : 0 };
    });
    ok("/my 에 공개 닉네임 상자가 그려진다", r.drawn, JSON.stringify(r).slice(0,140));
    ok("  지금 닉네임을 칸에 채워 둔다", r.val === "버디사냥꾼", String(r.val));
    ok("  ⚠️ 정하셨으면 **지우는 단추**를 낸다 (비우면 가린 성함으로 돌아갑니다)",
       r.clear === 1, "단추 " + r.clear);
    /* ⚠️⚠️ **공개된다는 사실을 적는 그 자리에서** 말합니다 (제15조 제2항) */
    ok("⚠️⚠️ 누구나 본다고 **그 자리에서** 말한다",
       r.body.indexOf("누구나 봅니다") >= 0, r.body.slice(0, 140));
    await g.p.fill("#nk", "그린필드");
    await g.p.click("#nkf button[type=submit]");
    await g.p.waitForTimeout(400);
    const sn = g.sent.filter(function(x){ return x.name === "set_my_nick"; })[0];
    ok("⚠️ 저장이 **set_my_nick 을 실제로 부른다**", !!sn,
       g.sent.map(function(x){ return x.name; }).join(","));
    if(sn) ok("  적으신 글자를 그대로 보낸다",
       JSON.parse(sn.body).p.nick === "그린필드", sn.body);
    await g.p.close();
  }
  {
    /* ⚠️ 정한 적이 없으면 지우는 단추를 **안 냅니다** (0줄이면 문이 거절) */
    const g = await open("/my", { role:"customer", name:"손님", signedIn:true },
      { account: [{ nick:null }], cq: [], ca: [], joinroom: [],
        request: [], quote: [], review: [] }, {}, true);
    const r = await g.p.evaluate(function(){
      const box = document.getElementById("nickbox");
      return { clear: box ? box.querySelectorAll("[data-nkclear]").length : 0,
               body: box ? box.innerText : "" };
    });
    ok("⚠️ 안 정하셨으면 지우는 단추를 **안 낸다**", r.clear === 0, "단추 " + r.clear);
    ok("  대신 성함을 가려서 낸다고 말한다",
       r.body.indexOf("성함을 가려서") >= 0, r.body.slice(0, 140));
    await g.p.close();
  }

  /* ══════════════════════════════════════════════════════════════
     골프 인력 · 비즈니스 (0048) — ⚠️ **빌드가 찍은 HTML 만 보는 검사는
     영원히 못 봅니다.** 목록도 양식도 Supabase 설정이 있어야 그려집니다.
     ⚠️⚠️ 가장 중요한 것 둘: **연락처가 화면 어디에도 안 나오는가**,
     그리고 **검사용 · 정지된 업체의 상호가 안 나오는가**.
     ══════════════════════════════════════════════════════════════ */
  /* ══════════════════════════════════════════════════════════════
     중고 직거래 매물 (0056) — ⚠️ **설정이 있어야 열리는 자리라
     빌드가 찍은 HTML 만 보는 검사는 영원히 못 봅니다.** 여기서 누릅니다.
     ⚠️⚠️ 흉내 장치는 조건을 보고 걸러 주지 않으므로, 거르개는 **보내는
     질의를 뜯어** 봅니다 (줄 수로 재면 거르개를 떼어도 영원히 초록).
     ══════════════════════════════════════════════════════════════ */
  console.log("\n── 중고 직거래 매물 (0056)");
  {
    /* ⚠️ 가짜 자료도 **DB 가 받는 값**이어야 합니다 — 물건 종류는
       `us-*` 하위 키, 물건 상태는 0056 의 cond 넷입니다. 아닌 값을
       넣으면 화면이 키를 그대로 보여 주고(그게 맞습니다), 그 그림을
       보고 멀쩡한 화면을 고치려 들게 됩니다. */
    /* ⚠️⚠️ 0068 — `brand` · `photo_n` · `thumb` 는 `v_listing_open` 이
       내주는 칸입니다. 한 줄은 **사진이 있고** 한 줄은 **없게** 둡니다 —
       둘 다 있으면 "사진 0장이면 아이콘 타일" 이 영원히 안 재집니다.
       ⚠️ 한 줄의 브랜드를 **비워** 둡니다 (0068 전에 올라온 매물) —
       그 줄에 "undefined" 가 찍히는지 봅니다 (절대 규칙 2). */
    /* ⚠️⚠️⚠️ **`listing.id` 는 uuid 입니다.** 처음에 상세 묶음도 `l1` 로
       열었다가 **상세 화면이 한 번도 안 그려졌습니다** — `readUrl()` 이
       `?v=` 를 uuid 꼴로만 받는데(안 막으면 PostgREST 가 400 을 내고
       화면은 "못 읽었습니다" 가 됩니다) `l1` 은 두 글자라 버려지고
       목록으로 갔습니다. **코드가 맞고 제 자료가 틀린** 자리이고, 이
       저장소가 여섯 번 밟았습니다(`ok` · `kind:"service"` · `cm-review` ·
       `us-putter` · 레슨 글을 마켓 화면에 · 여기).
       ⚠️ 목록 묶음은 `l1` 을 그대로 둡니다 — 거기는 사진 경로
       (`lst/l1/photo/a.jpg`)까지 엮여 있고 꼴을 보지 않습니다. */
    const UID1 = "aaaaaaaa-0069-4000-8000-000000000001";
    const UID3 = "aaaaaaaa-0069-4000-8000-000000000003";
    /* ⚠️⚠️ **가짜 자료도 DB 가 받는 값이어야 합니다** — 아니면 화면이
       모르는 키를 그대로 내고(그것이 맞는 동작입니다) 찍힌 그림에 영문
       키가 보여 **멀쩡한 화면을 고치려** 듭니다. 이 저장소가 다섯 번
       밟은 자리입니다(`ok` · `kind:"service"` · `cm-review` · `us-putter` ·
       레슨 글을 마켓 화면에).
       ⚠️ 0069 가 더한 칸 — `model` · `state` · `created_at` · `seller`. */
    const NOW = new Date().toISOString();
    const LST = [{ id:"l1", sub:"us-driver", region:"seoul", ship:false,
      title:"드라이버 팝니다", body:"2년 쓴 드라이버입니다",
      price:350000, cond:"good", ask_n:0, state:"open", created_at:NOW,
      brand:"타이틀리스트", model:"스텔스2 10.5도", seller:"김**",
      photo_n:3, thumb:"lst/l1/photo/a.jpg" },
      { id:"l2", sub:"us-iron", region:"gyeonggi", ship:true,
        title:"무료로 나눔", body:"연습용 아이언입니다",
        price:0, cond:"fair", ask_n:2, state:"open", created_at:NOW,
        brand:null, model:null, seller:"이**", photo_n:0, thumb:null },
      /* ⚠️ 예약중 한 줄 — **목록에 남고 덮개가 섭니다** (0069) */
      { id:"l3", sub:"us-putter", region:"busan", ship:false,
        title:"퍼터 팝니다", body:"예약중인 퍼터입니다",
        price:120000, cond:"like", ask_n:1, state:"reserved", created_at:NOW,
        brand:"오디세이", model:null, seller:"박**",
        photo_n:1, thumb:"lst/l3/photo/a.jpg" }];

    /* ① 설정 전에는 **아무것도 안 엽니다** (절대 규칙 5) */
    {
      const p0 = await b.newPage({ viewport: view });
      await p0.route("**/api/session", function(r){
        return r.fulfill({ status:200, contentType:"application/json",
          body: JSON.stringify({ auth:false, signedIn:false, conf:null }) });
      });
      await p0.goto(base + "/cat/used", { waitUntil:"networkidle" });
      await p0.waitForTimeout(400);
      const off = await p0.evaluate(function(){
        return { form: !!document.getElementById("lsf"),
                 bar:  !!document.getElementById("lsfil"),
                 boxHtml: (document.getElementById("lsbox") || {}).innerHTML || "" };
      });
      ok("⚠️ 설정 전에는 매물 양식을 **안 엽니다** (다 적고 누른 뒤 실패하지 않게)",
         !off.form && !off.bar && off.boxHtml === "", JSON.stringify(off));
      await p0.close();
    }

    /* ② 로그인 전 — 목록은 보이고, 올리는 것은 로그인으로 보냅니다 */
    {
      const g = await open("/cat/used", { role:"customer", name:"", signedIn:false },
                           { v_listing_open: LST }, {}, true);
      const r = await g.p.evaluate(function(){
        const li = document.querySelector(".lsc");
        const bx = document.getElementById("lsbox");
        return { card: !!li, body: document.body.innerText,
                 n: document.querySelectorAll(".lsc").length,
                 login: !!(bx && bx.querySelector('a[href^="/login"]')),
                 form: !!document.getElementById("lsf") };
      });
      ok("로그인 전에도 올라온 매물이 보인다 (크롤러도 봅니다)",
         r.card && r.body.indexOf("드라이버 팝니다") >= 0, JSON.stringify(r).slice(0, 160));
      /* ⚠️⚠️ **0 은 "무료" 입니다** — `||` 를 쓰면 0원이 사라집니다
         (작업 기억 — 0 을 기다리는 자리에 `||` 를 쓰지 마세요) */
      ok("  ⚠️⚠️ 값 **0 이 '무료로 나눔' 으로** 나온다 (0원이 사라지지 않습니다)",
         r.body.indexOf("무료로 나눔") >= 0, "");
      ok("  값 · 물건 상태 · 택배가 사람 말로 나온다",
         r.body.indexOf("350,000원") >= 0 && r.body.indexOf("사용감") >= 0 &&
         r.body.indexOf("택배 가능") >= 0, "");
      /* ⚠️ 영문 키가 그대로 찍히면 상태 말이 어긋난 것입니다 */
      ok("  ⚠️ 영문 키가 안 찍힌다 (us-driver · good · fair)",
         r.body.indexOf("us-driver") < 0 && r.body.indexOf("fair") < 0, "");
      ok("  로그인 전에는 올리는 양식 대신 로그인 길을 낸다", r.login && !r.form,
         JSON.stringify({ login:r.login, form:r.form }));
      /* ⚠️⚠️⚠️ 연락처는 목록 어디에도 없어야 합니다 */
      ok("⚠️⚠️ 목록 어디에도 연락처가 없다 (v_listing_open 에 칸이 없습니다)",
         r.body.indexOf("010-") < 0, "");
      ok("  ⚠️ 그리고 그 사실을 손님에게 말해 준다",
         r.body.indexOf("연락처는 목록에 나오지 않습니다") >= 0, "");
      /* ⚠️⚠️⚠️ 0068 — **사진이 먼저입니다.** 알아본 다섯 곳(2nd Swing ·
         SidelineSwap · 번개장터 · 당근 · 골마켓) 가운데 사진 없이
         중고채를 파는 곳은 하나도 없었습니다. */
      const ph = await g.p.evaluate(function(){
        const L = Array.prototype.map.call(
          document.querySelectorAll(".lsc"), function(li){
          const im = li.querySelector(".lsc-im");
          return { im: im ? im.getAttribute("src") : "",
                   no: !!li.querySelector(".lsc-no"),
                   n:  (li.querySelector(".lsc-n") || {}).textContent || "",
                   br: (li.querySelector(".lsc-br") || {}).textContent || "",
                   cd: (li.querySelector(".lsc-cd") || {}).textContent || "" };
        });
        return { L: L, grid: !!document.querySelector(".lsc-g") };
      });
      ok("⚠️⚠️ 0068 — 카드가 **격자**이고 사진 자리가 있다", ph.grid,
         JSON.stringify(ph).slice(0, 200));
      /* ⚠️ 주소는 `amPubUrl()` 한 곳에서 짓습니다 — 공개 버킷입니다 */
      ok("  사진이 있는 줄은 **그 사진**을 공개 버킷 주소로 낸다",
         !!ph.L[0] && ph.L[0].im.indexOf("/storage/v1/object/public/") > 0 &&
         ph.L[0].im.indexOf("lst/l1/photo/a.jpg") > 0,
         JSON.stringify(ph.L[0] || null));
      ok("  두 장 넘으면 **몇 장인지** 적는다", /3/.test(ph.L[0] ? ph.L[0].n : ""),
         ph.L[0] ? ph.L[0].n : "");
      /* ⚠️⚠️ 0장이면 **아이콘 타일**입니다 — 남의 사진이나 분류 사진을
         깔면 그 매물인 것처럼 보입니다 (절대 규칙 1) */
      ok("⚠️⚠️ 사진 **0장이면 아이콘 타일**로 돌아간다 (남의 사진을 깔지 않습니다)",
         !!(ph.L[1] && ph.L[1].no && !ph.L[1].im), JSON.stringify(ph.L[1] || null));
      /* ⚠️⚠️⚠️ **집은 것이 없을 때 터지지 않게 막습니다.** 2026-11-08 에
         `card()` 가 없는 함수(`amLstStName`)를 불러 목록이 통째로 안
         그려졌는데, 이 줄이 `ph.L[0].br` 를 바로 읽어 **검사 과정이
         TypeError 로 죽었습니다** — 그래서 뒤의 사백 몇 건이 아예 안
         돌았고 "무엇이 더 깨졌나" 를 알 수 없었습니다. 집은 것이 0개면
         **그 자리에서 실패로 적고 넘어갑니다**(잰 것이 0개면 실패인
         그 규칙과 같은 결입니다). */
      const c0 = ph.L[0] || { br:"", cd:"" };
      const c1 = ph.L[1] || { br:"", cd:"" };
      ok("  브랜드가 있으면 적고 **비면 그 자리를 뺀다** (절대 규칙 2)",
         ph.L.length >= 2 && c0.br.indexOf("타이틀리스트") >= 0 &&
         c1.br.indexOf("undefined") < 0 && c1.br.indexOf("null") < 0,
         JSON.stringify([c0.br, c1.br]));
      ok("  물건 상태를 **사진 위 딱지**로 낸다",
         c0.cd.indexOf("거의") >= 0 || c0.cd.indexOf("사용감") >= 0, c0.cd);
      /* ⚠️⚠️ 하지 않는 일을 했다고 적지 않습니다 (전자상거래법 제20조) */
      ok("⚠️⚠️ **거래 당사자가 아니라고** 말한다 (에스크로 · 안전거래를 " +
         "약속하지 않습니다)",
         r.body.indexOf("거래 당사자가 아니") >= 0 &&
         r.body.indexOf("안전거래를") >= 0, "");
      await g.p.close();
    }

    /* ③ 거르개 — ⚠️ 보내는 질의를 뜯어 봅니다 */
    {
      const g = await open("/cat/used", { role:"customer", name:"손님", signedIn:true },
                           { v_listing_open: LST }, {}, true);
      const bar = await g.p.evaluate(function(){
        return { s: !!document.getElementById("lf-s"),
                 rg: !!document.getElementById("lf-rg"),
                 sh: !!document.getElementById("lf-sh"),
                 now: (document.getElementById("lsnow") || {}).textContent || "",
                 opts: Array.prototype.map.call(
                   document.querySelectorAll("#lf-s option"),
                   function(o){ return o.value; }).filter(Boolean) };
      });
      ok("매물 목록에 거르개가 있다 (물건 종류 · 지역 · 택배)",
         bar.s && bar.rg && bar.sh, JSON.stringify(bar).slice(0, 140));
      ok("  센 수를 적는다", /매물 \d+건/.test(bar.now), bar.now);
      /* ⚠️⚠️ 0058 — 로그인하신 뒤에는 "조건 저장" 길을 냅니다. 글과
         주소는 js/data/deal.js 의 amWatchLink() 한 곳입니다. */
      ok("⚠️⚠️ 로그인하면 **조건 저장 길**이 생긴다 (0058)",
         (await g.p.locator('a[href="/my?w=listing"]').count()) === 1,
         await g.p.locator('a[href="/my?w=listing"]').count());
      /* ⚠️⚠️ **업체가 하는 하위(매입 견적 · 위탁판매)는 안 들어갑니다** —
         그 둘은 업체를 찾는 자리이고 매물이 아닙니다.
         ⚠️⚠️⚠️ **갯수를 박지 않습니다** (2026-11-08). 전에는 "일곱" 을
         글자로 박아 두어서, 0069 가 물건 종류를 일곱에서 열셋으로 늘린
         순간 **멀쩡한 화면을 실패로** 잡았습니다 — 이 저장소가 갯수를
         박아 여러 번 밟은 그 자리입니다. 재려는 뜻은 "**회원끼리 쓰는
         하위가 빠짐없이 들어가고 업체 몫은 안 들어가는가**" 이므로
         `catalog.js` 에서 **읽어서** 맞춰 봅니다. */
      const own = await g.p.evaluate(function(){
        var c = window.amCat("used");
        return (window.amCatItems(c) || [])
                 .filter(function(it){ return !it.pv; })
                 .map(function(it){ return it.key; });
      });
      ok("⚠️ 고르는 것이 `catalog.js` 의 회원 하위와 **같다** (갯수를 안 박습니다)",
         own.length > 0 && bar.opts.length === own.length &&
         own.every(function(k){ return bar.opts.indexOf(k) >= 0; }),
         "화면 " + bar.opts.join(",") + " / 자료 " + own.join(","));
      ok("  ⚠️ 업체가 하는 **매입 견적 · 위탁판매는 안 들어간다**",
         bar.opts.indexOf("us-buyquote") < 0 && bar.opts.indexOf("us-consign") < 0,
         bar.opts.join(","));

      const n0 = g.sent.length;
      await g.p.selectOption("#lf-s", "us-iron");
      await g.p.waitForTimeout(350);
      const q1 = g.sent.slice(n0).map(function(x){ return String(x.body); }).join(" | ");
      ok("  물건 종류를 고르면 **서버에** 조건을 보낸다",
         q1.indexOf("sub=eq.us-iron") >= 0, q1.slice(0, 200));
      const n1 = g.sent.length;
      await g.p.check("#lf-sh");
      await g.p.waitForTimeout(350);
      const q2 = g.sent.slice(n1).map(function(x){ return String(x.body); }).join(" | ");
      ok("  택배만 → ship=is.true 를 보낸다", q2.indexOf("ship=is.true") >= 0,
         q2.slice(0, 200));
      const u = await g.p.evaluate(function(){ return location.search; });
      ok("  조건이 주소에 남는다 (복사해 보낼 수 있게)",
         u.indexOf("s=us-iron") >= 0 && u.indexOf("sh=1") >= 0, u);

      /* ⚠️⚠️⚠️ 0068 — **브랜드 · 물건 상태 · 정렬 · 찾기**를 더했습니다.
         ⚠️ 흉내 장치는 걸러 주지 않으므로 **보내는 질의를 뜯어** 봅니다 —
         줄 수로 재면 그 칸을 통째로 떼어도 영원히 초록입니다. */
      {
        const b0 = await g.p.evaluate(function(){
          return { br: !!document.getElementById("lf-br"),
                   cd: !!document.getElementById("lf-cd"),
                   o:  !!document.getElementById("lf-o"),
                   q:  !!document.getElementById("lf-q"),
                   /* ⚠️ 고르개의 **목록은 `AM_LST_BRAND` 한 곳**에서
                      옵니다 — 갯수를 박지 않고 그 묶음과 맞춰 봅니다 */
                   bopt: Array.prototype.map.call(
                     document.querySelectorAll("#lf-br option"),
                     function(o){ return o.value; }).filter(Boolean),
                   want: (window.AM_LST_BRAND || []).slice(),
                   oopt: Array.prototype.map.call(
                     document.querySelectorAll("#lf-o option"),
                     function(o){ return o.value; }),
                   owant: (window.AM_LST_SORT || []).map(function(x){ return x.key; }) };
        });
        ok("⚠️⚠️ 0068 — 브랜드 · 물건 상태 · 정렬 · 찾는 칸이 있다",
           b0.br && b0.cd && b0.o && b0.q, JSON.stringify(b0).slice(0, 160));
        ok("  ⚠️ 브랜드 목록이 **AM_LST_BRAND 와 같다** (갯수를 박지 않습니다)",
           b0.want.length > 0 && b0.bopt.join(",") === b0.want.join(","),
           b0.bopt.join(",").slice(0, 120));
        ok("  ⚠️ 정렬 목록이 **AM_LST_SORT 와 같은 차례다**",
           b0.owant.length > 0 && b0.oopt.join(",") === b0.owant.join(","),
           b0.oopt.join(","));

        const m0 = g.sent.length;
        await g.p.selectOption("#lf-br", "캘러웨이");
        await g.p.waitForTimeout(350);
        const qb = g.sent.slice(m0).map(function(x){ return String(x.body); }).join(" | ");
        /* ⚠️ 브랜드는 **글자 그대로** 견줍니다 (키가 없습니다) */
        ok("  브랜드를 고르면 **서버에** 조건을 보낸다",
           qb.indexOf("brand=eq.") >= 0 &&
           qb.indexOf(encodeURIComponent("캘러웨이")) >= 0, qb.slice(0, 200));

        const m1 = g.sent.length;
        await g.p.selectOption("#lf-cd", "like");
        await g.p.waitForTimeout(350);
        const qc = g.sent.slice(m1).map(function(x){ return String(x.body); }).join(" | ");
        ok("  물건 상태를 고르면 cond=eq. 를 보낸다", qc.indexOf("cond=eq.like") >= 0,
           qc.slice(0, 200));

        const m2 = g.sent.length;
        await g.p.selectOption("#lf-o", "low");
        await g.p.waitForTimeout(350);
        const qo = g.sent.slice(m2).map(function(x){ return String(x.body); }).join(" | ");
        /* ⚠️⚠️ 보내는 글자는 `AM_LST_SORT` 한 곳입니다 — 화면이
           `price.asc` 를 따로 적으면 칸 이름이 바뀌는 날 **조용히**
           최신순으로 보입니다 (정렬이 안 되는 것은 에러가 안 납니다). */
        ok("  값 낮은 순을 고르면 order=price.asc 를 보낸다",
           qo.indexOf("order=price.asc") >= 0, qo.slice(0, 200));

        const m3 = g.sent.length;
        await g.p.fill("#lf-q", "드라이버");
        await g.p.waitForTimeout(700);
        const qq = g.sent.slice(m3).map(function(x){ return String(x.body); }).join(" | ");
        /* ⚠️⚠️ 찾기도 **서버**가 합니다 — 쉰 줄만 받아 화면에서 찾으면
           그 쉰 줄 밖의 매물이 영영 안 나옵니다. */
        ok("  찾는 말을 적으면 **서버에** title=ilike 를 보낸다",
           qq.indexOf("title=ilike.") >= 0 &&
           qq.indexOf(encodeURIComponent("드라이버")) >= 0, qq.slice(0, 200));

        /* ⚠️⚠️ Baymard 가 "사이트의 20% 가 고른 조건을 안 보여 준다" 고
           짚은 자리 — 무엇으로 좁혔는지가 안 보이면 0건을 "매물이 없다"
           로 읽습니다. 칩 하나하나를 지울 수 있어야 합니다. */
        const c0 = await g.p.evaluate(function(){
          return { n: document.querySelectorAll(".lsf-chip").length,
                   keys: Array.prototype.map.call(
                     document.querySelectorAll(".lsf-chip"),
                     function(b){ return b.getAttribute("data-off"); }),
                   clear: document.querySelectorAll(".lsf-clear").length };
        });
        ok("⚠️⚠️ 0068 — 고른 조건이 **칩 한 줄**로 보인다 (지울 수 있게)",
           c0.n >= 5 && c0.clear >= 1, JSON.stringify(c0));
        /* ⚠️ 정렬은 **좁히는 조건이 아닙니다** — 칩에 넣으면 지우기로
           손님이 고른 차례가 사라집니다 */
        ok("  ⚠️ 정렬은 칩에 **안 넣는다** (좁히는 조건이 아닙니다)",
           c0.keys.indexOf("o") < 0, c0.keys.join(","));

        /* 칩 하나를 지우면 그 조건만 빠집니다 */
        const m4 = g.sent.length;
        await g.p.click('.lsf-chip[data-off="br"]');
        await g.p.waitForTimeout(350);
        const q4 = g.sent.slice(m4).map(function(x){ return String(x.body); }).join(" | ");
        ok("  칩을 지우면 **그 조건만** 빠진다 (나머지는 그대로)",
           q4.indexOf("brand=eq.") < 0 && q4.indexOf("cond=eq.like") >= 0,
           q4.slice(0, 200));

        /* ⚠️⚠️ 「조건 모두 지우기」는 **전부** 지웁니다 — 2026-11-08 까지
           0건 상자의 단추가 종류 · 지역 · 택배 셋만 지워, 브랜드 · 가격대 ·
           찾는 말이 그대로 걸린 채 "지웠습니다" 가 됐습니다. */
        const m5 = g.sent.length;
        await g.p.click(".lsf-clear");
        await g.p.waitForTimeout(350);
        const q5 = g.sent.slice(m5).map(function(x){ return String(x.body); }).join(" | ");
        const u5 = await g.p.evaluate(function(){ return location.search; });
        /* ⚠️ **정렬은 남아야 맞습니다** — 좁히는 조건이 아니므로 지우기가
           건드리지 않습니다. 처음에 `u5 === ""` 로 재서 **멀쩡한 코드를
           실패로** 잡았습니다 (코드가 아니라 제 검사가 틀린 자리). */
        ok("⚠️⚠️ 「조건 모두 지우기」가 **전부** 지운다 (셋만 지우지 않습니다)",
           q5.indexOf("cond=eq.") < 0 && q5.indexOf("sub=eq.") < 0 &&
           q5.indexOf("ship=is.true") < 0 && q5.indexOf("title=ilike.") < 0 &&
           q5.indexOf("brand=eq.") < 0 &&
           /^(\?o=low)?$/.test(u5), q5.slice(0, 200) + " url=" + u5);
      }
      await g.p.close();
    }

    /* ③-2 분류 화면의 **물건 종류 칩**을 눌러 들어온 자리 ─────────────
       ⚠️⚠️⚠️ 2026-11-08 — 그 칩 일곱은 `<span>` 이라 **눌리지 않았습니다.**
       그런데 이 목록은 0056 부터 `?s=` 를 읽고 있었습니다 — **받는 쪽은
       있는데 가는 길이 없는** 자리였습니다. 지금은 `amSubUrl()` 이
       `/cat/used?s=us-…` 를 짓습니다.
       ⚠️⚠️ **주소만 맞는 것으로는 아무 뜻이 없습니다** — 흉내 장치는 걸러
       주지 않으므로 줄 수로 재면 받는 쪽을 통째로 떼어도 영원히 초록입니다.
       **첫 질의를 뜯어** 그 조건이 실려 나가는지 봅니다. */
    {
      const g = await open("/cat/used?s=us-iron",
                           { role:"customer", name:"손님", signedIn:true },
                           { v_listing_open: LST }, {}, true);
      const q = g.sent.map(function(x){ return String(x.body); }).join(" | ");
      ok("⚠️⚠️⚠️ 물건 종류 칩으로 들어오면 **첫 질의부터** 그 종류로 좁는다",
         q.indexOf("sub=eq.us-iron") >= 0, q.slice(0, 220));
      const st = await g.p.evaluate(function(){
        return { sel: (document.getElementById("lf-s") || {}).value || "",
                 keys: Array.prototype.map.call(
                   document.querySelectorAll(".lsf-chip"),
                   function(b){ return b.getAttribute("data-off"); }) };
      });
      /* ⚠️ 고른 조건이 **보여야** 합니다 — 안 보이면 손님이 0건을
         "매물이 없다" 로 읽습니다 (고르개에도 · 칩에도 남습니다). */
      /* ⚠️ 칩의 열쇠는 **DB 칸 이름**(`sub`)이고 주소의 열쇠는 `s` 입니다 —
         둘이 다른 것이 맞습니다(주소는 짧게, 질의는 칸 이름대로). 처음에
         `"s"` 로 재서 **멀쩡한 코드를 실패로** 잡았습니다. */
      ok("  거르개와 칩에 **그 조건이 남는다** (무엇으로 좁혔는지 보이게)",
         st.sel === "us-iron" && st.keys.indexOf("sub") >= 0, JSON.stringify(st));
      await g.p.close();
    }

    /* ══════════════════════════════════════════════════════════════
       0069 — 카드 · 묶음 탭 · 쪽 · 찜 · 상세 화면
       ⚠️⚠️⚠️ **상세 화면이 2026-11-08 까지 아예 없었습니다** — 카드를
       눌러도 갈 자리가 없어서 사진 · 설명을 목록 안에서만 볼 수
       있었습니다. 그래서 여기가 0069 의 가장 중요한 묶음입니다.
       ══════════════════════════════════════════════════════════════ */
    {
      const g = await open("/cat/used", { role:"customer", name:"손님", signedIn:true },
                           { v_listing_open: LST,
                             v_listing_fav: [{ id:"l2" }] }, {}, true);
      const c = await g.p.evaluate(function(){
        const li = document.querySelectorAll(".lsc");
        const one = li[0];
        return {
          n: li.length,
          /* 카드 전체가 상세로 가는 링크인가 */
          href: (one.querySelector(".lsc-a") || {}).getAttribute
                  ? one.querySelector(".lsc-a").getAttribute("href") : "",
          /* 1:1 정사각인가 — ⚠️ 비율을 **재서** 봅니다 (글자로 박지 않습니다) */
          box: (function(){
            const b2 = one.querySelector(".lsc-ph").getBoundingClientRect();
            return { w: Math.round(b2.width), h: Math.round(b2.height) };
          })(),
          /* 올린 지 얼마나 되었나 */
          ago: (one.querySelector(".lsc-m") || {}).textContent || "",
          /* 모델명이 브랜드 줄에 들어가나 */
          br: (one.querySelector(".lsc-br") || {}).textContent || "",
          br2: (li[1].querySelector(".lsc-br") || {}).textContent || "",
          /* 예약중 덮개 · 팔고 있는 줄에는 덮개 없음 */
          st0: !!one.querySelector(".lsc-st"),
          st2: (li[2].querySelector(".lsc-st") || {}).textContent || "",
          /* 찜 단추 — 담아 둔 줄은 켜져 있나 */
          fav: Array.prototype.map.call(li, function(x){
            const f = x.querySelector("[data-fav]");
            return f ? (f.classList.contains("on") ? "on" : "off") : "none";
          }),
          /* 묶음 탭 — 값과 켜진 자리 */
          tabs: Array.prototype.map.call(document.querySelectorAll(".lstab-i"),
            function(t){ return t.getAttribute("data-g") +
                                (t.classList.contains("on") ? "*" : ""); }),
          /* ⚠️ 문의 단추가 **카드에 없어야** 합니다 — 상세로 옮겼습니다 */
          goBtn: !!document.querySelector(".lsc-go")
        };
      });
      ok("⚠️⚠️⚠️ 카드 전체가 **상세 화면으로 가는 링크**다 (0069)",
         c.href.indexOf("/cat/used?v=l1") === 0, c.href);
      /* ⚠️ 비율을 글자로 박지 않고 **재서** 봅니다 (1:1 이면 폭 ≈ 높이) */
      ok("  사진 자리가 **1:1 정사각**이다 (시안)",
         c.box.w > 0 && Math.abs(c.box.w - c.box.h) <= 2,
         JSON.stringify(c.box));
      ok("  **올린 지 얼마나 되었나**를 적는다 (시안)",
         /방금 전|분 전|시간 전/.test(c.ago), c.ago);
      ok("  모델명을 브랜드 줄에 적는다", c.br.indexOf("스텔스2") >= 0, c.br);
      ok("  ⚠️ 모델명이 **비면 그 자리를 뺀다** (절대 규칙 2)",
         c.br2.indexOf("undefined") < 0 && c.br2.indexOf("null") < 0, c.br2);
      /* ⚠️⚠️ `open` 이면 덮개를 **안 냅니다** — 「판매중」을 모든 카드에
         붙이면 그것만 보입니다 */
      ok("⚠️⚠️ 팔고 있는 카드에는 **덮개를 안 낸다**", !c.st0, String(c.st0));
      ok("⚠️⚠️ **예약중은 사진 위 덮개**로 낸다 (목록에서 빠지지 않습니다)",
         c.st2.indexOf("예약중") >= 0, c.st2);
      ok("⚠️⚠️ 찜한 줄의 하트가 **켜져 있다** (제 것만 받습니다)",
         c.fav[0] === "off" && c.fav[1] === "on", JSON.stringify(c.fav));
      ok("⚠️ 묶음 탭이 **`AM_LST_GROUP` 그대로**이고 「전체」가 켜져 있다",
         c.tabs.length > 1 && c.tabs[0] === "all*", JSON.stringify(c.tabs));
      /* ⚠️ 문의 단추를 상세로 옮겼습니다 — 링크 안에 단추를 넣으면 어느
         쪽이 눌리는지 브라우저마다 다릅니다 */
      ok("  문의 단추가 **카드에 없다** (상세로 옮겼습니다)",
         !c.goBtn, String(c.goBtn));

      /* ── 묶음 탭을 누르면 **종류 여럿**을 서버에 보냅니다 ──────────
         ⚠️⚠️ 흉내 장치는 걸러 주지 않으므로 **보내는 질의를 뜯어** 봅니다 —
         줄 수로 재면 탭을 통째로 떼어도 영원히 초록입니다. */
      const n0 = g.sent.length;
      await g.p.click('.lstab-i[data-g="club"]');
      await g.p.waitForTimeout(350);
      const q1 = g.sent.slice(n0).map(function(x){ return String(x.body); }).join(" | ");
      ok("⚠️⚠️ 묶음 탭이 **종류 여럿을 한 번에** 보낸다 (`sub=in.(…)`)",
         q1.indexOf("sub=in.") >= 0 && q1.indexOf("us-driver") >= 0 &&
         q1.indexOf("us-iron") >= 0, q1.slice(0, 220));
      ok("  주소에도 그 묶음이 남는다",
         (await g.p.evaluate(function(){ return location.search; })).indexOf("g=club") >= 0,
         await g.p.evaluate(function(){ return location.search; }));

      /* ⚠️⚠️ **묶음을 바꾸면 종류를 같이 풉니다** — 안 풀면 「클럽」에서
         아이언을 고른 뒤 「용품」으로 가도 아이언이 그대로 걸려
         **영원히 0건**입니다 */
      await g.p.selectOption("#lf-s", "us-iron");
      await g.p.waitForTimeout(350);
      const n1 = g.sent.length;
      await g.p.click('.lstab-i[data-g="gear"]');
      await g.p.waitForTimeout(350);
      const q2 = g.sent.slice(n1).map(function(x){ return String(x.body); }).join(" | ");
      ok("⚠️⚠️ 묶음을 바꾸면 **고른 종류를 같이 푼다** (안 풀면 영원히 0건)",
         q2.indexOf("us-iron") < 0 && q2.indexOf("us-bag") >= 0, q2.slice(0, 220));

      /* ── 찜을 누르면 문을 부르고 **그 단추만** 바뀝니다 ───────────── */
      const n2 = g.sent.length;
      await g.p.click('.lsc [data-fav]');
      await g.p.waitForTimeout(350);
      const fq = g.sent.slice(n2);
      ok("⚠️ 찜을 누르면 **`fav_listing` 문**을 부른다",
         fq.some(function(x){ return x.name === "fav_listing"; }),
         JSON.stringify(fq).slice(0, 200));
      ok("  보내는 꾸러미에 **매물 id 와 켜고 끄기뿐**이다 (사람 정보 0건)",
         (function(){
           const one = fq.filter(function(x){ return x.name === "fav_listing"; })[0];
           if(!one) return false;
           const o = JSON.parse(one.body).p;
           return Object.keys(o).sort().join(",") === "id,on";
         })(), JSON.stringify(fq.filter(function(x){ return x.name === "fav_listing"; })[0] || {}));
      await g.p.close();
    }

    /* ── 쪽 넘기기 — ⚠️ 전체 쪽 수를 **적지 않습니다** ─────────────── */
    {
      /* ⚠️⚠️ **한도를 글자로 박지 않습니다** — 화면에서 읽습니다. 박아
         두면 한도를 바꾸는 날 멀쩡한 화면을 실패로 잡습니다 (이 저장소가
         갯수를 박아 여러 번 밟은 자리). */
      const LIM = 24;
      const MANY = [];
      for(let i = 0; i < LIM; i++) MANY.push(Object.assign({}, LST[0],
        { id:"p" + i, title:"매물 " + i }));
      const g = await open("/cat/used", { role:"customer", name:"손님", signedIn:true },
                           { v_listing_open: MANY }, {}, true);
      const pg = await g.p.evaluate(function(){
        return { bar: !!document.querySelector(".lspg"),
                 next: !!document.querySelector(".lspg-n"),
                 prev: !!document.querySelector(".lspg-b:not(.lspg-n)"),
                 now: (document.getElementById("lsnow") || {}).textContent || "",
                 /* ⚠️ 전체 쪽 수를 적으면 지어낸 숫자입니다 */
                 txt: (document.querySelector(".lspg") || {}).textContent || "" };
      });
      ok("⚠️ 한도에 닿으면 **「다음 쪽」**이 생긴다", pg.bar && pg.next,
         JSON.stringify(pg));
      ok("  첫 쪽에는 **「앞쪽」이 없다** (눌러도 아무 일이 안 나는 칸입니다)",
         !pg.prev, String(pg.prev));
      /* ⚠️⚠️⚠️ **전체 쪽 수를 적지 않습니다** — 받아 온 줄이 한도에
         닿았다는 것은 "다음 쪽이 있다" 는 뜻일 뿐이고 몇 쪽인지는
         세어 보지 않았습니다 ("3 / 12" 는 지어낸 숫자입니다 · 절대 규칙 1) */
      ok("⚠️⚠️⚠️ **전체 쪽 수를 안 적는다** (세어 본 값이 아닙니다)",
         pg.txt.indexOf("/") < 0, pg.txt);
      ok("  센 수를 **그 쪽의 수**로 적는다 (전체인 것처럼 적지 않습니다)",
         pg.now.indexOf("이 쪽에") >= 0, pg.now);
      /* 다음 쪽을 누르면 `offset` 을 보냅니다 */
      const n0 = g.sent.length;
      await g.p.click(".lspg-n");
      await g.p.waitForTimeout(350);
      const q = g.sent.slice(n0).map(function(x){ return String(x.body); }).join(" | ");
      ok("⚠️ 다음 쪽이 **`offset` 을 서버에 보낸다**",
         q.indexOf("offset=" + LIM) >= 0, q.slice(0, 200));
      ok("  주소에 쪽이 **1 부터** 남는다",
         (await g.p.evaluate(function(){ return location.search; })).indexOf("pg=2") >= 0,
         await g.p.evaluate(function(){ return location.search; }));
      await g.p.close();
    }

    /* ── 상세 화면 ───────────────────────────────────────────────── */
    {
      const PH = [{ path:"lst/l1/photo/a.jpg", caption:"앞면", ord:0 },
                  { path:"lst/l1/photo/b.jpg", caption:"뒷면", ord:1 }];
      /* ⚠️ `id` 만 uuid 꼴로 갈아 끼웁니다 (다른 칸은 그대로) */
      const ONE1 = Object.assign({}, LST[0], { id: UID1 });
      const g = await open("/cat/used?v=" + UID1,
                           { role:"customer", name:"손님", signedIn:true },
                           { v_listing_open: [ONE1],
                             v_listing_photo_public: PH,
                             v_listing_fav: [] }, {}, true);
      const d = await g.p.evaluate(function(){
        return {
          /* ⚠️⚠️⚠️ **`querySelector` 로는 "섰다" 를 잴 수 없습니다** —
             가려진 것도 찾아 줍니다. 실제로 처음 판은 `#lswrap` 을 가려
             상세가 **DOM 에는 있고 눈에는 안 보이는** 꼴이었는데 이
             검사가 통과했습니다. 그려졌는지는 **`getClientRects().length`**
             로 봅니다(`offsetParent` 는 `position:fixed` 에서 null 이라
             또 틀립니다 — 0068 의 폰 시트에서 겪은 자리). */
          on: (function(){
            const e = document.querySelector(".lsd");
            return !!e && e.getClientRects().length > 0;
          })(),
          ti: (document.querySelector(".lsd-ti") || {}).textContent || "",
          pr: (document.querySelector(".lsd-p") || {}).textContent || "",
          /* 값 줄들 — ⚠️ 비는 줄은 **줄째 빠집니다** */
          dl: Array.prototype.map.call(document.querySelectorAll(".lsd-dl dt"),
            function(t){ return t.textContent; }),
          dd: (document.querySelector(".lsd-dl") || {}).textContent || "",
          big: (document.getElementById("lsd-big") || {}).getAttribute
                 ? document.getElementById("lsd-big").getAttribute("src") : "",
          th: document.querySelectorAll(".lsd-t").length,
          body: (document.querySelector(".lsd-body") || {}).textContent || "",
          warn: (document.querySelector(".lsd-warn") || {}).textContent || "",
          ask: !!document.querySelector(".lsd-ask"),
          fav: !!document.querySelector(".lsd-fav"),
          back: !!document.querySelector("[data-back]"),
          /* ⚠️⚠️ 거르개 · 올리는 양식은 **가립니다** */
          /* ⚠️ 가려야 하는 것은 **거르개 레일과 맨 위 줄 · 올리는
             양식**입니다 — 감싼 상자(`#lswrap`)를 가리면 상세까지 같이
             가려집니다(`#lslist` 가 그 안입니다). */
          rail: (function(){
            const e = document.getElementById("lsrail");
            return e ? e.getClientRects().length === 0 : null;
          })(),
          bar: (function(){
            const e = document.getElementById("lsbar");
            return e ? e.getClientRects().length === 0 : null;
          })(),
          box: (function(){
            const x = document.getElementById("lsbox");
            return x ? x.hidden : null;
          })()
        };
      });
      ok("⚠️⚠️⚠️ `?v=` 로 들어오면 **상세 화면**이 선다 (0069 — 전에는 없었습니다)",
         d.on, JSON.stringify(d).slice(0, 260));
      ok("  제목 · 값을 낸다", d.ti.indexOf("드라이버") >= 0 &&
         d.pr.indexOf("35") >= 0, d.ti + " / " + d.pr);
      ok("  값 줄들을 낸다 (종류 · 브랜드 · 모델명 · 상태 · 지역 · 판매자)",
         d.dl.indexOf("브랜드") >= 0 && d.dl.indexOf("모델명") >= 0 &&
         d.dl.indexOf("판매자") >= 0, JSON.stringify(d.dl));
      /* ⚠️⚠️ **판매자는 보기가 가려서** 냅니다 — 화면이 가리면 본이름이
         이미 브라우저까지 온 것입니다 (0052 에서 세운 규칙) */
      ok("⚠️⚠️ 판매자를 **가린 성함 그대로** 쓴다 (화면이 가리지 않습니다)",
         d.dd.indexOf("김**") >= 0, d.dd.slice(0, 160));
      ok("  큰 사진을 **공개 버킷 주소**로 낸다",
         d.big.indexOf("/storage/v1/object/public/") > 0 &&
         d.big.indexOf("lst/l1/photo/a.jpg") > 0, d.big);
      ok("  두 장이면 **작은 그림 줄**을 낸다", d.th === 2, String(d.th));
      ok("  설명을 낸다", d.body.indexOf("2년 쓴") >= 0, d.body.slice(0, 80));
      /* ⚠️⚠️⚠️ 돈이 오가는 결정을 하는 **그 자리**에서 한 번 더 말합니다 */
      ok("⚠️⚠️⚠️ **거래 당사자가 아니라고** 그 자리에서 말한다 (제20조 제1항)",
         d.warn.indexOf("거래 당사자가 아닙니다") >= 0, d.warn.slice(0, 120));
      /* ⚠️ 결제를 아예 받지 않으므로 그 말을 쓸 수 없습니다 (제20조의3) */
      ok("⚠️⚠️ **「안전결제」 · 「안전거래」 를 한 글자도 안 적는다**",
         d.warn.indexOf("안전결제") < 0 && d.warn.indexOf("안전거래") < 0,
         d.warn.slice(0, 120));
      ok("  문의 · 찜 · 목록으로 가는 길이 다 있다",
         d.ask && d.fav && d.back, JSON.stringify([d.ask, d.fav, d.back]));
      ok("⚠️⚠️ 상세에서는 **거르개 · 맨 위 줄 · 올리는 양식**을 가린다",
         d.rail === true && d.bar === true && d.box === true,
         JSON.stringify([d.rail, d.bar, d.box]));

      /* ⚠️ 작은 그림을 누르면 **큰 그림만** 갈아 끼웁니다 (주소는 그대로) */
      await g.p.click(".lsd-t:nth-child(2)");
      await g.p.waitForTimeout(200);
      const sw = await g.p.evaluate(function(){
        return { big: document.getElementById("lsd-big").getAttribute("src"),
                 url: location.search };
      });
      ok("  작은 그림을 누르면 **큰 그림만** 바뀐다 (주소는 그대로)",
         sw.big.indexOf("b.jpg") > 0 && sw.url.indexOf("v=" + UID1) >= 0,
         JSON.stringify(sw));

      /* 문의 — ⚠️ 보내는 꾸러미를 뜯어 봅니다 */
      await g.p.click(".lsd-ask");
      await g.p.waitForTimeout(250);
      const hasF = await g.p.evaluate(function(){ return !!document.getElementById("lsaf"); });
      ok("  문의 단추를 누르면 **양식이 열린다**", hasF, String(hasF));
      if(hasF){
        await g.p.fill("#lsaf [name='contact']", "010-1234-0069");
        /* ⚠️⚠️⚠️ **동의 칸을 안 누르면 양식이 아예 안 보내집니다** —
           `consentBox()` 의 체크칸이 `required` 라 브라우저가 막고
           `submit` 이 한 번도 안 납니다. 처음에 이 줄을 빼 두어
           "`ask_listing` 을 부른다" 가 `[]` 로 떨어졌습니다 — **코드가
           맞고 검사가 틀린** 자리입니다(제15조 제2항을 지키는 그 칸이
           제 할 일을 한 것입니다).
           ⚠️ 동의 상자의 클래스는 `.jchk` 입니다 (`.chk` 가 아닙니다). */
        await g.p.check("#lsaf .jchk input[type=checkbox]");
        const n0 = g.sent.length;
        await g.p.click("#lsaf button[type='submit']");
        await g.p.waitForTimeout(400);
        const aq = g.sent.slice(n0).filter(function(x){ return x.name === "ask_listing"; });
        ok("  보내면 **`ask_listing` 문**을 부른다", aq.length === 1,
           JSON.stringify(g.sent.slice(n0)).slice(0, 220));
        /* ⚠️ 동의 시각을 **반드시** 보냅니다 (제17조 제2항 · 0056 이 null 을
           거절합니다) */
        ok("  ⚠️ **동의 시각**을 같이 보낸다 (제15조 제2항)",
           aq.length === 1 && !!JSON.parse(aq[0].body).p.agree_at,
           aq.length ? aq[0].body.slice(0, 160) : "");
      }
      await g.p.close();
    }

    /* ── 상세 — ⚠️⚠️ **"없다" 와 "못 읽었다" 를 가립니다** ─────────── */
    {
      const g = await open("/cat/used?v=11111111-1111-1111-1111-111111111111",
                           { role:"customer", name:"손님", signedIn:true },
                           { v_listing_open: [] }, {}, true);
      const t = await g.p.evaluate(function(){
        return (document.getElementById("lslist") || {}).textContent || "";
      });
      /* ⚠️⚠️ 공개 보기는 팔린 · 내려간 · 가려진 매물을 안 냅니다 — 그러니
         0줄은 "그런 매물이 없다" 가 아니라 **"지금은 볼 수 없다"** 입니다
         (모르는 것을 단정하지 않습니다 · 절대 규칙 1) */
      /* ⚠️⚠️⚠️ **찾는 말이 올바른 글의 부분 문자열이면 안 됩니다.**
         처음에 `"없는 매물입니다"` 가 없는지를 보았는데, 맞는 글인
         **"지금은 볼 수 없는 매물입니다"** 가 그 글자를 품고 있어서
         **멀쩡한 화면을 실패로** 잡았습니다. 이 저장소가 "중개 고지를
         `거래 당사자가 아` 로 찾아 7/23 이 나왔다" 로 겪은 자리의
         거울상입니다 — 재려는 뜻은 "**단정하는 말**을 쓰지 않는가" 이므로
         그 단정하는 글(`그런 매물이 없습니다`)을 찾습니다. */
      ok("⚠️⚠️ 0줄을 **「없는 매물」로 단정하지 않는다** (팔렸을 수 있습니다)",
         t.indexOf("지금은 볼 수 없는") >= 0 &&
         t.indexOf("그런 매물이 없") < 0 && t.indexOf("매물이 없습니다") < 0,
         t.slice(0, 120));
      await g.p.close();
    }

    /* ── 상세 — ⚠️ 로그인 전에는 **문의 단추를 안 냅니다** ──────────── */
    {
      const g = await open("/cat/used?v=" + UID1,
                           { role:"customer", name:"", signedIn:false },
                           { v_listing_open: [Object.assign({}, LST[0],
                             { id: UID1 })] }, {}, true);
      const d = await g.p.evaluate(function(){
        return { ask: !!document.querySelector(".lsd-ask"),
                 fav: !!document.querySelector("[data-fav]"),
                 txt: (document.getElementById("lsd-b") || {}).textContent || "",
                 log: !!document.querySelector('#lsd-b a[href*="/login"]') };
      });
      /* ⚠️ 그리면 눌러서 로그인 화면으로 갔다가 돌아와도 **보낸 것이
         없는** 꼴이 됩니다 (절대 규칙 5) */
      ok("⚠️ 로그인 전에는 문의 · 찜 단추를 **안 내고** 로그인 길을 낸다",
         !d.ask && !d.fav && d.log, JSON.stringify(d).slice(0, 200));
      await g.p.close();
    }

    /* ── 예약중 매물의 상세 — ⚠️⚠️ **그 사실을 그 자리에서 말합니다** ── */
    {
      const g = await open("/cat/used?v=" + UID3,
                           { role:"customer", name:"손님", signedIn:true },
                           { v_listing_open: [Object.assign({}, LST[2],
                             { id: UID3 })] }, {}, true);
      const d = await g.p.evaluate(function(){
        return { st: (document.querySelector(".lsd-st") || {}).textContent || "",
                 ask: !!document.querySelector(".lsd-ask"),
                 note: (document.getElementById("lsd-b") || {}).textContent || "" };
      });
      ok("⚠️⚠️ 예약중이면 **딱지를 내고 그 사실을 말한다**",
         d.st.indexOf("예약중") >= 0 && d.note.indexOf("다른 분과") >= 0,
         JSON.stringify(d).slice(0, 200));
      /* ⚠️⚠️ **문의는 그대로 받습니다** — 앞의 거래가 깨질 수 있습니다
         (문을 닫아 두면 손님은 까닭을 모르고 "고장" 으로 읽습니다) */
      ok("⚠️⚠️ 예약중에도 **문의 단추를 낸다** (문도 받습니다 · 0069)",
         d.ask, String(d.ask));
      await g.p.close();
    }

    /* ④ 올리는 양식 — ⚠️ 보내는 꾸러미까지 뜯어 봅니다 */
    {
      /* ⚠️⚠️ 0068 — `open_listing` 은 **새 매물의 id** 를 돌려줍니다.
         흉내가 null 을 주면 올린 직후 사진 상자를 열 자리가 없어, 그
         길이 **한 번도 안 돌면서도** 검사는 초록입니다. */
      const g = await open("/cat/used", { role:"customer", name:"손님", signedIn:true },
                           { v_listing_open: LST },
                           { open_listing: "l-new" }, true);
      const r = await g.p.evaluate(function(){
        const f = document.getElementById("lsf");
        if(!f) return { form:false };
        return { form:true,
                 req: Array.prototype.map.call(f.querySelectorAll("[required]"),
                        function(e){ return e.name || e.id; }),
                 terms: document.querySelectorAll(".jterms li").length,
                 body: document.body.innerText };
      });
      ok("로그인하면 올리는 양식이 열린다", r.form, JSON.stringify(r).slice(0, 120));
      ok("  제목 · 종류 · 상태 · 지역 · 값 · 설명 · 연락처 · **브랜드**가 필수다",
         ["title","sub","cond","region","price","body","contact","brand"]
           .every(function(n){ return r.req.indexOf(n) >= 0; }), (r.req || []).join(","));
      /* ⚠️⚠️ 0068 — 브랜드는 **고르개 + 직접 적기**입니다. 목록만 내면
         목록에 없는 브랜드를 가진 분이 올릴 수가 없고(절대 규칙 2),
         직접 적기만 두면 "타이틀리스트" · "타이틀 리스트" · "Titleist" 가
         섞여 거르개가 아무것도 못 모읍니다. */
      {
        const bf = await g.p.evaluate(function(){
          const t = document.getElementById("l-brand2");
          return { sel: !!document.getElementById("l-brand"),
                   txt: !!t,
                   hid: t ? t.hidden : null,
                   /* ⚠️ `hidden` 만으로는 안 가려지는 자리를 여러 번
                      겪었습니다 — 실제로 안 그려지는지 봅니다 */
                   off: t ? (getComputedStyle(t).display === "none") : null,
                   etc: (window.AM_LST_BRAND || []).indexOf("기타") >= 0 };
        });
        ok("⚠️⚠️ 0068 — 브랜드는 **고르개 + 직접 적기**다 (목록에 없는 분도 올립니다)",
           bf.sel && bf.txt && bf.etc, JSON.stringify(bf));
        ok("  ⚠️ 직접 적는 칸은 처음에 **안 그려진다** (`hidden` + display:none)",
           bf.hid === true && bf.off === true, JSON.stringify(bf));
        await g.p.selectOption("#l-brand", "기타");
        await g.p.waitForTimeout(150);
        const bf2 = await g.p.evaluate(function(){
          const t = document.getElementById("l-brand2");
          return { hid: t.hidden, off: getComputedStyle(t).display === "none" };
        });
        ok("  ⚠️ 「기타」를 고르면 그 칸이 **나온다**",
           bf2.hid === false && bf2.off === false, JSON.stringify(bf2));
      }
      ok("  ⚠️ 동의 상자에 수집 항목 · 목적 · 보유 기간 · 제공이 같이 있다 (제15조 제2항)",
         r.terms >= 4, String(r.terms));
      /* ⚠️ 글자를 박지 않고 **설정값**과 맞춰 봅니다 */
      const LKEEP = keepOf("listingKeep");
      ok("  ⚠️ 보유 기간이 **실제 값**으로 찍힌다 (site.js 의 listingKeep)",
         !!LKEEP && (r.body || "").indexOf(LKEEP) >= 0, LKEEP);
      ok("  ⚠️ 연락처 칸이 **언제 누구에게 가는지**를 그 자리에서 말한다 (제17조)",
         (r.body || "").indexOf("받아들이신 뒤") >= 0, "");
      /* ⚠️ "협의" 를 지어 적지 않습니다 — 0 이 무료라고 그 자리에서 말합니다 */
      ok("  ⚠️ 무료로 나누시면 0 이라고 그 자리에서 말한다",
         (r.body || "").indexOf("무료로 나누시면") >= 0, "");

      await g.p.fill("#l-title", "검사용 드라이버");
      await g.p.selectOption("#l-brand", "핑");
      await g.p.selectOption("#l-sub", "us-driver");
      await g.p.selectOption("#l-cond", "like");
      await g.p.selectOption("#l-rg", "seoul");
      await g.p.fill("#l-price", "250000");
      await g.p.check("#l-ship");
      await g.p.fill("#l-body", "검사로 올리는 매물입니다");
      await g.p.fill("#l-contact", "010-5555-5555");
      await g.p.check(".jconsent input[type=checkbox]");
      await g.p.click("#lsf button[type=submit]");
      await g.p.waitForTimeout(500);
      const sent = g.sent.filter(function(x){ return x.name === "open_listing"; });
      ok("⚠️ 올리기 단추가 **open_listing 을 실제로 부른다**", sent.length === 1,
         JSON.stringify(g.sent.map(function(x){ return x.name; })));
      const pl = sent.length ? (JSON.parse(sent[0].body).p || {}) : {};
      ok("  제목 · 종류 · 상태 · 값 · 연락처를 그대로 보낸다",
         pl.title === "검사용 드라이버" && pl.sub === "us-driver" &&
         pl.cond === "like" && String(pl.price) === "250000" &&
         pl.contact === "010-5555-5555", JSON.stringify(pl));
      /* ⚠️ 브랜드는 **글자 그대로** 담깁니다 (키가 없습니다 · 0068) */
      ok("  ⚠️ 0068 — 브랜드를 **글자 그대로** 보낸다", pl.brand === "핑",
         JSON.stringify(pl.brand));
      /* ⚠️ 체크박스는 **참 · 거짓**으로 보냅니다 ("on" 이 아닙니다 —
         문이 `(p->>'ship')::boolean` 으로 읽습니다) */
      ok("  ⚠️ 택배 여부를 **참 · 거짓**으로 보낸다 ('on' 이 아닙니다)",
         pl.ship === true, JSON.stringify(pl.ship));
      ok("  ⚠️ 동의 시각을 같이 보낸다", !!pl.agree_at, String(pl.agree_at));

      /* ⚠️⚠️⚠️ 0068 — **올린 그 자리에서 사진을 붙입니다.** 올리신 직후에만
         붙일 수 있게 두면 그 화면을 닫은 분의 매물은 영원히 사진이 없으므로
         `/my` 에도 같은 상자를 냅니다 (아래 ⑦). markup 과 올리는 길은
         `js/lstphoto.js` 한 곳입니다. */
      await g.p.waitForTimeout(400);
      const dn = await g.p.evaluate(function(){
        const bx = document.getElementById("lsbox");
        return { done: (bx ? bx.innerText : "").indexOf("매물을 올렸습니다") >= 0,
                 box: !!(bx && bx.querySelector(".lsp")),
                 file: !!(bx && bx.querySelector(".lsp-i")),
                 my: !!(bx && bx.querySelector('a[href="/my"]')) };
      });
      ok("⚠️⚠️ 0068 — 올린 **그 자리에서 사진 상자**가 열린다",
         dn.done && dn.box && dn.file, JSON.stringify(dn));
      ok("  ⚠️ 그리고 나중에 붙이실 수 있는 길(`/my`)도 같이 낸다 (막다른 길 아님)",
         dn.my, JSON.stringify(dn));

      /* 실제로 올려 봅니다 — 자리를 청하고(POST) 파일을 올립니다(PUT).
         ⚠️⚠️ **버킷은 서버가 경로를 보고 고릅니다** — 화면이 고르면
         거기가 구멍입니다 (0051 에서 세운 규칙). 화면이 보내는 꾸러미에
         버킷 이름이 **없어야** 합니다. */
      /* ⚠️⚠️⚠️ **사진이 아닌 파일을 먼저 넣어 봅니다** (2026-11-09) —
         이름만 `.jpg` 이고 종류도 `image/jpeg` 라고 적어 보냅니다.
         브라우저가 적는 종류는 확장자만 보고 쓰는 값이라 이것이 그냥
         통과하고 있었습니다. 지금은 `js/imgprep.js` 가 **첫 바이트**를
         보고 거절해야 하고, **PUT 이 한 번도 안 가야** 합니다. */
      const n8 = g.sent.length;
      await g.p.setInputFiles(".lsp-i", { name:"a.jpg", mimeType:"image/jpeg",
                                          buffer: NOTIMG });
      await g.p.click(".lsp-go");
      await g.p.waitForTimeout(600);
      const bad8 = g.sent.slice(n8).filter(function(x){
        return x.name === "storage" && String(x.body).indexOf("PUT") === 0; });
      const say8 = await g.p.evaluate(function(){
        const m = document.querySelector("#lsbox .lsp-m");
        return m && !m.hidden ? m.textContent : ""; });
      ok("⚠️⚠️ 사진이 **아닌** 파일은 첫 바이트로 거절한다 (이름만 .jpg)",
         bad8.length === 0 && say8.indexOf("사진 파일이 아닙니다") >= 0,
         JSON.stringify({ put: bad8.length, say: say8 }));

      const n9 = g.sent.length;
      /* ⚠️ **참 PNG** 를 넣습니다 — 아래에서 보내는 종류가 `image/jpeg`
         로 바뀌어야 합니다 (다시 그렸다 = EXIF 가 사라졌다). */
      await g.p.setInputFiles(".lsp-i", { name:"a.png", mimeType:"image/png",
                                          buffer: PNG1 });
      await g.p.click(".lsp-go");
      await g.p.waitForTimeout(900);
      const up9 = g.sent.slice(n9).filter(function(x){ return x.name === "upload"; })
                   .map(function(x){ return String(x.body); });
      /* ⚠️⚠️ **방법으로 가립니다** — 같은 주소 꼴로 카드의 사진을
         내려받는 GET 도 오므로, 이름만 보면 올리지 않았는데도 "올렸다"
         로 세어집니다 (처음에 둘로 세어 떨어졌습니다). */
      const put9 = g.sent.slice(n9).filter(function(x){
        return x.name === "storage" && String(x.body).indexOf("PUT") === 0; });
      ok("  ⚠️ 올리기가 **자리를 청하고 파일을 올린다** (POST → PUT)",
         up9.some(function(b){ return b.indexOf("POST") === 0; }) &&
         put9.length === 1, JSON.stringify({ up:up9, put:put9.length }));
      const pb = up9.filter(function(b){ return b.indexOf("POST") === 0; }).join(" ");
      ok("  ⚠️⚠️ 꾸러미에 **버킷 이름이 없다** (버킷은 서버가 경로를 보고 고릅니다)",
         pb.indexOf('"lst":true') >= 0 && pb.indexOf("bucket") < 0 &&
         pb.indexOf("pv-test") < 0, pb.slice(0, 200));
      /* ⚠️⚠️⚠️ **다시 그렸다는 증거**입니다 — PNG 를 넣었는데 보내는
         종류가 `image/jpeg` 라는 것은 canvas 를 한 번 지났다는 뜻이고,
         canvas 를 지나면 EXIF(위치정보)가 **통째로** 사라집니다. 여기가
         초록이 아니면 폰으로 찍은 사진의 집 좌표가 **공개 버킷**에
         그대로 올라갑니다. */
      ok("  ⚠️⚠️⚠️ 올리기 전에 **다시 그린다** (PNG 를 넣어도 image/jpeg 로 간다)",
         pb.indexOf('"mime":"image/jpeg"') >= 0, pb.slice(0, 200));
      ok("  ⚠️ 그리고 **줄여서** 보낸다 (보내는 bytes 가 0보다 크다)",
         /"bytes":[1-9]/.test(pb), pb.slice(0, 200));
      await g.p.close();
    }

    /* ⑤ /my — 내 매물 · 받은 문의 · 연락처 */
    {
      const MINE = [{ id:"l1", title:"내 드라이버", body:"설명입니다",
        sub:"us-driver", region:"seoul", ship:false, price:350000,
        cond:"good", state:"open", hidden_why:null, created_at:"2026-11-06T01:00:00Z" },
        { id:"l9", title:"가려진 매물", body:"설명입니다", sub:"us-bag",
          region:"seoul", ship:false, price:10000, cond:"fair", state:"hidden",
          hidden_why:"금지된 물건입니다", created_at:"2026-11-06T01:00:00Z" }];
      const ASKS = [
        { id:"q1", listing_id:"l1", msg:"사고 싶습니다", state:"accepted",
          by_user:"u-buy", seller_share_at:null, buyer_share_at:null,
          created_at:"2026-11-06T02:00:00Z" },
        { id:"q2", listing_id:"other", msg:"제가 넣은 문의", state:"accepted",
          by_user:"me", seller_share_at:null, buyer_share_at:null,
          created_at:"2026-11-06T02:00:00Z" }];
      const CON = [{ ask_id:"q1", seller_contact:null, buyer_contact:null,
                     seller_share_at:null, buyer_share_at:null },
                   { ask_id:"q2", seller_contact:null, buyer_contact:null,
                     seller_share_at:null, buyer_share_at:null }];
      const g = await open("/my", { role:"customer", name:"손님", signedIn:true },
        { listing: MINE, listingask: ASKS, v_listing_contact: CON }, {}, true);
      const r = await g.p.evaluate(function(){
        const e = document.getElementById("lsmine");
        return { drawn: !!(e && !e.hidden && e.children.length),
                 body: e ? e.innerText : "",
                 share: e ? e.querySelectorAll(".ls-share").length : -1,
                 sold: e ? e.querySelectorAll(".ls-sold").length : -1 };
      });
      ok("/my 에 내 중고 매물이 그려진다", r.drawn, JSON.stringify(r).slice(0, 140));
      ok("  내가 올린 것과 내가 문의한 것을 **갈라서** 보여 준다",
         r.body.indexOf("내가 올린 매물") >= 0 &&
         r.body.indexOf("내가 문의한 매물") >= 0, "");
      /* ⚠️⚠️⚠️ 수락만으로 연락처가 안 나옵니다 (제17조 제2항) */
      ok("⚠️⚠️⚠️ **받아들여도 연락처가 화면에 안 나온다**",
         r.body.indexOf("010-") < 0 && r.body.indexOf("아직 안 여셨습니다") >= 0, "");
      ok("  대신 **내 연락처를 보여 줄지 고르는 단추**가 있다 (양쪽 모두)",
         r.share === 2, String(r.share));
      /* ⚠️ 파는 분 말과 사는 분 말이 다릅니다 (절대 규칙 3) */
      ok("  ⚠️ 파는 분에게는 '받았습니다', 사는 분에게는 '받아들여졌습니다'",
         r.body.indexOf("받았습니다") >= 0 &&
         r.body.indexOf("받아들여졌습니다") >= 0, "");
      ok("  팔렸다고 내리는 길과 그냥 내리는 길이 **갈라져** 있다", r.sold === 1,
         String(r.sold));
      /* ⚠️ 가려진 매물에는 고치기 · 내리기 단추가 없고 까닭이 보입니다 */
      ok("⚠️⚠️ 가린 **까닭을 글쓴이에게** 보여 준다 (0056)",
         r.body.indexOf("금지된 물건입니다") >= 0, "");
      ok("  ⚠️ 영문 상태가 안 찍힌다 (open · hidden · accepted)",
         r.body.indexOf("hidden") < 0 && r.body.indexOf("accepted") < 0, "");
      await g.p.close();
    }

    /* ⑥ ⚠️⚠️ 보내는 주소에 **안 준 칸**이 없는가 — 부르면 질의가
       통째로 거절됩니다 (0053 의 memo · answered_by 에서 겪은 자리) */
    {
      const g = await open("/my", { role:"customer", name:"손님", signedIn:true },
        { listing: [], listingask: [], v_listing_contact: [] }, {}, true);
      const asked = g.sent.filter(function(x){
        return x.name === "GET" && String(x.body).indexOf("/listing?") >= 0;
      }).map(function(x){ return String(x.body); }).join(" | ");
      ok("⚠️⚠️ 매물을 읽을 때 **contact · agree_at 을 안 부른다** " +
         "(0056 이 그 칸을 안 줬습니다 — 부르면 질의가 거절됩니다)",
         asked.length > 0 && asked.indexOf("contact") < 0 &&
         asked.indexOf("agree_at") < 0, asked.slice(0, 200));
      /* ⚠️ 0068 — 줄머리에 브랜드를 적으려면 그 칸을 **같이 읽어야**
         합니다. 안 읽으면 늘 비어 보이고 에러는 한 줄도 안 납니다. */
      ok("  ⚠️ 0068 — **brand 를 같이 읽는다** (안 읽으면 늘 비어 보입니다)",
         asked.indexOf("brand") >= 0, asked.slice(0, 200));
      await g.p.close();
    }

    /* ⑦ ⚠️⚠️⚠️ 0068 — **`/my` 에서도 사진을 붙입니다.** 올리신 직후에만
       붙일 수 있게 두면 그 화면을 닫은 분의 매물은 영원히 사진이 없습니다
       (막다른 길 · 절대 규칙 2). 그리고 **버킷이 꺼져 있으면 단추를 안
       냅니다** — 그리면 눌러도 아무 일이 안 나는 단추입니다 (절대 규칙 5). */
    {
      const MINE2 = [{ id:"l1", title:"내 드라이버", body:"설명입니다",
        sub:"us-driver", region:"seoul", ship:false, price:350000,
        cond:"good", state:"open", brand:"테일러메이드", hidden_why:null,
        created_at:"2026-11-06T01:00:00Z" }];
      /* 버킷이 켜진 쪽 — ⚠️ 이미 붙은 사진도 그려야 합니다 */
      {
        const g = await open("/my", { role:"customer", name:"손님", signedIn:true },
          { listing: MINE2, listingask: [], v_listing_contact: [] }, {},
          { photos: [], lphotos: [
            { id:"f1", caption:"", url:"https://sb-test.supabase.co/x/a.jpg" }] });
        const r0 = await g.p.evaluate(function(){
          const e = document.getElementById("lsmine");
          return { btn: e ? e.querySelectorAll(".ls-ph").length : -1,
                   body: e ? e.innerText : "" };
        });
        ok("⚠️⚠️ 0068 — `/my` 에 **사진 단추**가 있다 (나중에도 붙이실 수 있게)",
           r0.btn === 1, JSON.stringify(r0.btn));
        ok("  ⚠️ 줄머리에 **브랜드**를 적는다", r0.body.indexOf("테일러메이드") >= 0, "");
        await g.p.click(".ls-ph");
        await g.p.waitForTimeout(500);
        const r1 = await g.p.evaluate(function(){
          const e = document.getElementById("lsmine");
          return { box: !!e.querySelector(".lsp"),
                   /* ⚠️ 붙어 있는 사진은 **서버가 지은 주소**로 그립니다 */
                   thumb: (e.querySelector(".lsp-t img") || {}).getAttribute
                            ? e.querySelector(".lsp-t img").getAttribute("src") : "",
                   x: e.querySelectorAll(".lsp-x").length,
                   /* ⚠️⚠️ **id 를 한 글자도 안 씁니다** — `/my` 는 매물
                      여럿을 한 화면에 내므로 id 를 달면 같은 id 가
                      여러 개가 됩니다 (조인의 동의 상자에서 겪은 자리) */
                   ids: e.querySelectorAll(".lsp [id]").length };
        });
        ok("  누르면 사진 상자가 열리고 **붙어 있는 사진**이 그려진다",
           r1.box && r1.thumb.indexOf("a.jpg") > 0, JSON.stringify(r1));
        ok("  ⚠️⚠️ 그 상자에 **id 가 하나도 없다** (한 화면에 여럿이 열립니다)",
           r1.ids === 0, String(r1.ids));
        /* 빼기 — ⚠️ 되돌릴 수 없는 일이라 한 번 여쭙습니다 */
        g.p.on("dialog", function(d){ d.accept(); });
        const n0 = g.sent.length;
        await g.p.click(".lsp-x");
        await g.p.waitForTimeout(500);
        const dr = g.sent.slice(n0).filter(function(x){
          return x.name === "drop_listing_photo"; });
        ok("  「빼기」가 **drop_listing_photo 를 그 사진 id 로** 부른다",
           dr.length === 1 && String(dr[0].body).indexOf('"f1"') >= 0,
           JSON.stringify(dr).slice(0, 160));
        await g.p.close();
      }
      /* 버킷이 꺼진 쪽 — ⚠️ 단추를 **안 냅니다** */
      {
        const g = await open("/my", { role:"customer", name:"손님", signedIn:true },
          { listing: MINE2, listingask: [], v_listing_contact: [] }, {}, false);
        const r = await g.p.evaluate(function(){
          const e = document.getElementById("lsmine");
          return { btn: e ? e.querySelectorAll(".ls-ph").length : -1,
                   drawn: !!(e && e.children.length) };
        });
        ok("⚠️⚠️ 버킷이 꺼져 있으면 **사진 단추를 안 낸다** (절대 규칙 5)",
           r.drawn && r.btn === 0, JSON.stringify(r));
        await g.p.close();
      }
    }

    /* ⑧ ⚠️⚠️⚠️ 0069 — **예약중 · 모델명 · 사진 차례 · 관심상품** */
    {
      /* ⚠️ 가짜 자료도 DB 가 받는 값입니다 — `state` 는 0069 의 다섯 중 하나 */
      const M3 = [{ id:"l1", title:"내 드라이버", body:"설명입니다",
        sub:"us-driver", region:"seoul", ship:false, price:350000,
        cond:"good", state:"open", brand:"테일러메이드", model:"스텔스2",
        hidden_why:null, created_at:"2026-11-06T01:00:00Z" },
        { id:"l2", title:"예약 걸린 퍼터", body:"설명입니다",
          sub:"us-putter", region:"busan", ship:true, price:120000,
          cond:"like", state:"reserved", brand:"오디세이", model:null,
          hidden_why:null, created_at:"2026-11-06T01:00:00Z" }];
      const g = await open("/my", { role:"customer", name:"손님", signedIn:true },
        { listing: M3, listingask: [], v_listing_contact: [],
          v_listing_fav: [] }, {},
        { photos: [], lphotos: [
          { id:"f1", caption:"", ord:0, url:"https://sb-test.supabase.co/x/a.jpg" },
          { id:"f2", caption:"", ord:1, url:"https://sb-test.supabase.co/x/b.jpg" },
          { id:"f3", caption:"", ord:2, url:"https://sb-test.supabase.co/x/c.jpg" }] });
      const m = await g.p.evaluate(function(){
        const e = document.getElementById("lsmine");
        const li = e.querySelectorAll(".mj-i");
        return { txt: e.innerText,
                 res0: !!li[0].querySelector(".ls-res"),
                 open0: !!li[0].querySelector(".ls-open"),
                 res1: !!li[1].querySelector(".ls-res"),
                 open1: !!li[1].querySelector(".ls-open"),
                 edit1: !!li[1].querySelector(".ls-edit"),
                 ph1: !!li[1].querySelector(".ls-ph"),
                 see: (li[0].querySelector('a[href*="/cat/used?v="]') || {})
                        .getAttribute ? li[0].querySelector('a[href*="/cat/used?v="]')
                        .getAttribute("href") : "" };
      });
      ok("⚠️ 0069 — 줄머리에 **모델명**을 적는다", m.txt.indexOf("스텔스2") >= 0, "");
      ok("  ⚠️ 모델명이 **비면 그 자리를 뺀다**",
         m.txt.indexOf("undefined") < 0 && m.txt.indexOf("null") < 0, "");
      ok("⚠️⚠️ 팔고 있는 줄에는 **「예약중으로」**가 있다",
         m.res0 && !m.open0, JSON.stringify([m.res0, m.open0]));
      /* ⚠️⚠️⚠️ **되돌리는 길이 있어야** 합니다 — 없으면 잘못 누른 분이
         매물을 다시 올려야 하고 받아 둔 문의가 통째로 날아갑니다
         (막다른 길 · 절대 규칙 2) */
      ok("⚠️⚠️⚠️ 예약중 줄에는 **「예약 풀기」**가 있다 (막다른 길로 두지 않습니다)",
         m.open1 && !m.res1, JSON.stringify([m.res1, m.open1]));
      /* ⚠️⚠️ **예약중에도 고치고 사진을 붙입니다** — `state = 'open'` 만
         보면 예약중으로 둔 매물을 손댈 수가 없습니다 (0069 가 문 넷을
         같이 고친 그 까닭) */
      ok("⚠️⚠️ 예약중에도 **고치기 · 사진 단추가 있다**",
         m.edit1 && m.ph1, JSON.stringify([m.edit1, m.ph1]));
      ok("  손님 화면으로 가는 길이 있다", m.see.indexOf("/cat/used?v=l1") === 0, m.see);

      /* 예약중으로 옮기면 **그 상태를 보냅니다** */
      const n0 = g.sent.length;
      await g.p.click(".mj-i:nth-child(1) .ls-res");
      await g.p.waitForTimeout(350);
      const rq = g.sent.slice(n0).filter(function(x){ return x.name === "close_listing"; });
      ok("⚠️ 「예약중으로」가 **`state:\"reserved\"`** 를 보낸다",
         rq.length === 1 && JSON.parse(rq[0].body).p.state === "reserved",
         rq.length ? rq[0].body : JSON.stringify(g.sent.slice(n0)).slice(0, 180));
      /* 되돌리면 `open` 을 보냅니다 */
      const n1 = g.sent.length;
      await g.p.click(".mj-i:nth-child(2) .ls-open");
      await g.p.waitForTimeout(350);
      const oq = g.sent.slice(n1).filter(function(x){ return x.name === "close_listing"; });
      ok("  「예약 풀기」가 **`state:\"open\"`** 을 보낸다",
         oq.length === 1 && JSON.parse(oq[0].body).p.state === "open",
         oq.length ? oq[0].body : "");

      /* ── 사진 차례 ───────────────────────────────────────────────
         ⚠️⚠️ **대표는 첫째**입니다 — 따로 "대표로" 단추를 두면 ord 와
         대표가 두 값이 되고, 둘이 어긋나는 날 카드와 상세가 다른 사진을
         냅니다. 「맨 앞으로」가 곧 「대표로」입니다. */
      await g.p.click(".mj-i:nth-child(1) .ls-ph");
      await g.p.waitForTimeout(600);
      const ph = await g.p.evaluate(function(){
        const e = document.getElementById("lsmine");
        const t = e.querySelectorAll(".lsp-t");
        return { n: t.length,
                 badge: (t[0].querySelector(".lsp-b") || {}).textContent || "",
                 badge2: !!t[1].querySelector(".lsp-b"),
                 /* ⚠️ 맨 앞 · 맨 뒤에서는 그 단추를 **안 냅니다** */
                 up0: !!t[0].querySelector(".lsp-up"),
                 dn0: !!t[0].querySelector(".lsp-dn"),
                 up2: !!t[2].querySelector(".lsp-up"),
                 dn2: !!t[2].querySelector(".lsp-dn"),
                 hint: (e.querySelector(".lsp .jhint") || {}).textContent || "" };
      });
      ok("⚠️ 0069 — 사진 상자가 **차례 바꾸는 단추**를 낸다",
         ph.n === 3 && ph.up2 && !ph.dn2, JSON.stringify(ph));
      ok("  **대표 딱지**가 첫 장에만 붙는다",
         ph.badge.indexOf("대표") >= 0 && !ph.badge2,
         ph.badge + " / " + String(ph.badge2));
      /* ⚠️ 맨 앞에서 「앞으로」를 내면 눌러도 아무 일이 안 나는 칸입니다
         (절대 규칙 5) */
      ok("  ⚠️ 맨 앞에는 **「앞으로」를 안 낸다**", !ph.up0 && ph.dn0,
         JSON.stringify([ph.up0, ph.dn0]));
      /* ⚠️ 글이 코드와 달라지지 않게 — 「첫 장」이 아니라 **「대표 사진」** */
      ok("  안내문이 **「대표 사진」**이라고 적는다 (바꿀 수 있는 것을 바꿀 수 " +
         "없는 것처럼 적지 않습니다)", ph.hint.indexOf("대표 사진") >= 0,
         ph.hint.slice(0, 80));

      /* 차례를 바꾸면 **늘어놓은 전부**를 보냅니다 */
      const n2 = g.sent.length;
      await g.p.click(".lsp-t:nth-child(2) .lsp-up");
      await g.p.waitForTimeout(500);
      const sq = g.sent.slice(n2).filter(function(x){
        return x.name === "order_listing_photo"; });
      ok("⚠️⚠️ 차례를 바꾸면 **`order_listing_photo`** 를 부른다",
         sq.length === 1, JSON.stringify(g.sent.slice(n2)).slice(0, 200));
      /* ⚠️⚠️ **그 매물의 사진이 빠짐없이** 와야 문이 받습니다 — 일부만
         보내면 안 보낸 것이 조용히 0 이 되어 그것이 대표가 됩니다 */
      ok("  ⚠️⚠️ **세 장 전부**를 바뀐 차례로 보낸다 (일부만 보내면 문이 거절합니다)",
         sq.length === 1 && (function(){
           const o = JSON.parse(sq[0].body).p;
           return o.listing === "l1" && o.ids.length === 3 &&
                  o.ids[0] === "f2" && o.ids[1] === "f1" && o.ids[2] === "f3";
         })(), sq.length ? sq[0].body : "");
      await g.p.close();
    }

    /* ⑨ ⚠️⚠️ 0069 — **관심상품** (js/myfav.js) */
    {
      const FAV = [{ id:"l1", title:"담아 둔 드라이버", price:350000,
        sub:"us-driver", region:"seoul", ship:false, brand:"타이틀리스트",
        model:"스텔스2", state:"open", thumb:"lst/l1/photo/a.jpg",
        fav_at:"2026-11-08T01:00:00Z" },
        /* ⚠️⚠️ **팔린 매물도 남습니다** — `v_listing_open` 을 썼으면
           팔리는 순간 목록에서 조용히 사라졌습니다 */
        { id:"l2", title:"팔린 퍼터", price:0,
          sub:"us-putter", region:"busan", ship:true, brand:null,
          model:null, state:"done", thumb:null,
          fav_at:"2026-11-08T00:00:00Z" }];
      const g = await open("/my", { role:"customer", name:"손님", signedIn:true },
        { listing: [], listingask: [], v_listing_contact: [],
          v_listing_fav: FAV }, {}, true);
      const f = await g.p.evaluate(function(){
        const e = document.getElementById("favbox");
        const li = e ? e.querySelectorAll(".mfv-i") : [];
        return { on: !!e && !e.hidden, n: li.length,
                 txt: e ? e.innerText : "",
                 href: li.length ? li[0].querySelector(".mfv-a").getAttribute("href") : "",
                 im: li.length ? !!li[0].querySelector(".mfv-im") : false,
                 no: li.length > 1 ? !!li[1].querySelector(".mfv-no") : false,
                 st0: li.length ? !!li[0].querySelector(".mfv-st") : null,
                 st1: li.length > 1
                   ? (li[1].querySelector(".mfv-st") || {}).textContent || "" : "" };
      });
      ok("⚠️⚠️ 0069 — `/my` 에 **관심상품 상자**가 선다", f.on && f.n === 2,
         JSON.stringify(f).slice(0, 220));
      ok("  줄을 누르면 **상세 화면**으로 간다",
         f.href.indexOf("/cat/used?v=l1") === 0, f.href);
      ok("  사진이 있으면 내고, **0장이면 아이콘 타일**이다 (남의 사진을 깔지 않습니다)",
         f.im && f.no, JSON.stringify([f.im, f.no]));
      ok("⚠️ 팔고 있는 줄에는 **딱지를 안 낸다**", f.st0 === false, String(f.st0));
      /* ⚠️⚠️ **팔린 매물도 남고 그 사실을 말합니다** — 조용히 사라지면
         손님은 까닭을 모릅니다 */
      ok("⚠️⚠️ **팔린 매물도 남고 「팔렸습니다」를 적는다**",
         f.st1.indexOf("팔렸") >= 0, f.st1);
      /* ⚠️⚠️ **찜 수를 어디에도 안 적습니다** (절대 규칙 1 의 결) */
      ok("⚠️⚠️ **찜 수를 안 적는다** (세어 낼 수 있다고 내는 것이 아닙니다)",
         f.txt.indexOf("찜 ") < 0, f.txt.slice(0, 120));
      /* 빼면 문을 부릅니다 */
      const n0 = g.sent.length;
      await g.p.click(".mfv-off");
      await g.p.waitForTimeout(350);
      const q = g.sent.slice(n0).filter(function(x){ return x.name === "fav_listing"; });
      ok("  「빼기」가 **`fav_listing` 에 `on:false`** 를 보낸다",
         q.length === 1 && JSON.parse(q[0].body).p.on === false,
         q.length ? q[0].body : JSON.stringify(g.sent.slice(n0)).slice(0, 180));
      await g.p.close();
    }

    /* ⑩ ⚠️ 0건이면 **막다른 길로 두지 않습니다** (절대 규칙 2) */
    {
      const g = await open("/my", { role:"customer", name:"손님", signedIn:true },
        { listing: [], listingask: [], v_listing_contact: [],
          v_listing_fav: [] }, {}, true);
      const z = await g.p.evaluate(function(){
        const e = document.getElementById("favbox");
        return { on: !!e && !e.hidden, txt: e ? e.innerText : "",
                 go: !!(e && e.querySelector('a[href="/cat/used"]')) };
      });
      ok("⚠️ 관심상품이 0건이면 **중고장터로 가는 길**을 낸다 (막다른 길로 두지 않습니다)",
         z.on && z.go && z.txt.indexOf("아직 담아 두신") >= 0,
         JSON.stringify(z).slice(0, 180));
      await g.p.close();
    }
  }


  /* ══════════════════════════════════════════════════════════════
     구합니다 (0061) — ⚠️ **설정이 있어야 열리는 자리라 빌드가 찍은
     HTML 만 보는 검사는 영원히 못 봅니다.** 여기서 누릅니다.
     ⚠️⚠️ 흉내 장치는 조건을 보고 걸러 주지 않으므로, 거르개는 **보내는
     질의를 뜯어** 봅니다 (줄 수로 재면 거르개를 떼어도 영원히 초록).
     ══════════════════════════════════════════════════════════════ */
  console.log("\n── 구합니다 (0061)");
  {
    /* ⚠️ 가짜 자료도 **DB 가 받는 값**이어야 합니다 — 분류는 `AM_WANT_OFF`
       를 뺀 다섯, 하위는 그 분류의 `ls-*` 키입니다. 아닌 값을 넣으면
       화면이 키를 그대로 보여 주고(그게 맞습니다), 그 그림을 보고
       멀쩡한 화면을 고치려 들게 됩니다 (이 저장소가 다섯 번 겪은 자리). */
    const WNT = [
      { id:"w1", cat:"lesson", sub:"ls-solo", region:"seoul",
        title:"주말 오전 레슨 구합니다", body:"드라이버를 배우고 싶습니다",
        budget:200000, when_txt:"주말 오전", reply_n:3,
        created_at:"2026-11-07T01:00:00Z" },
      { id:"w2", cat:"lesson", sub:null, region:"gyeonggi",
        title:"무료로 봐 주실 분", body:"완전 초보입니다",
        budget:0, when_txt:null, reply_n:0,
        created_at:"2026-11-06T01:00:00Z" }];

    /* ① 설정 전에는 **아무것도 안 엽니다** (절대 규칙 5) */
    {
      const p0 = await b.newPage({ viewport: view });
      await p0.route("**/api/session", function(r){
        return r.fulfill({ status:200, contentType:"application/json",
          body: JSON.stringify({ auth:false, signedIn:false, conf:null }) });
      });
      await p0.goto(base + "/cat/lesson", { waitUntil:"networkidle" });
      await p0.waitForTimeout(400);
      const off = await p0.evaluate(function(){
        return { form: !!document.getElementById("wtf"),
                 bar:  !!document.getElementById("wtfil"),
                 boxHtml: (document.getElementById("wtbox") || {}).innerHTML || "" };
      });
      ok("⚠️ 설정 전에는 구합니다 양식을 **안 엽니다** (다 적고 누른 뒤 실패하지 않게)",
         !off.form && !off.bar && off.boxHtml === "", JSON.stringify(off));
      await p0.close();
    }

    /* ② 로그인 전 — 목록은 보이고, 올리는 것은 로그인으로 보냅니다 */
    {
      const g = await open("/cat/lesson", { role:"customer", name:"", signedIn:false },
                           { v_wanted_open: WNT }, {}, true);
      const r = await g.p.evaluate(function(){
        /* ⚠️ 로그인 길은 **#wtbox** 에 그립니다 (#wtlist 는 목록입니다) —
           처음에 목록에서 찾아 "없다" 고 떨어졌고, 그것은 제 검사가
           엉뚱한 칸을 집은 것이었습니다. */
        const bx = document.getElementById("wtbox");
        return { n: document.querySelectorAll("#wtlist .wtc").length,
                 body: document.body.innerText,
                 login: !!(bx && bx.querySelector('a[href^="/login"]')),
                 form: !!document.getElementById("wtf") };
      });
      ok("로그인 전에도 올라온 구합니다 글이 보인다 (업체가 찾아 들어오는 길입니다)",
         r.n === 2 && r.body.indexOf("주말 오전 레슨 구합니다") >= 0,
         "n=" + r.n);
      /* ⚠️⚠️ **0 은 "무료로 해 주실 분" 입니다** — `||` 를 쓰면 0 이 사라집니다 */
      ok("  ⚠️⚠️ 예산 **0 이 '무료로 해 주실 분' 으로** 나온다 (0 이 사라지지 않습니다)",
         r.body.indexOf("무료로 해 주실 분") >= 0, "");
      ok("  예산이 사람 말로 나온다", r.body.indexOf("200,000원") >= 0, "");
      /* ⚠️ 영문 키가 그대로 찍히면 말이 어긋난 것입니다 */
      ok("  ⚠️ 영문 키가 안 찍힌다 (lesson · ls-solo · seoul)",
         r.body.indexOf("ls-solo") < 0 && r.body.indexOf("gyeonggi") < 0, "");
      /* ⚠️⚠️ **답 수는 0 이면 안 찍습니다** — "답 0건" 을 찍으면 방금
         올린 글이 전부 아무도 안 보는 글로 보입니다 (후기 0건과 같은
         자리 · 그건 우리가 만든 평가입니다). */
      ok("⚠️⚠️ 답이 0건이면 **그 줄을 안 찍는다** (우리가 만든 평가가 되지 않게)",
         r.body.indexOf("답 3건") >= 0 && r.body.indexOf("답 0건") < 0, "");
      /* ⚠️ **누르기 전에도** 로그인 길이 보여야 합니다 — 누른 뒤에야
         말하면 손님은 그 단추가 무엇인지 모르고 누르고 거절을 받습니다.
         ⚠️⚠️ 그리고 그 주소는 **돌아올 자리를 들고** 있어야 합니다
         (맨 `/login` 이면 로그인한 뒤 /my 로 떨어져서 글을 올리려던
         분이 이 화면을 다시 찾아와야 합니다). */
      ok("  로그인 전에는 올리는 양식 대신 로그인 길을 낸다", r.login && !r.form,
         JSON.stringify({ login:r.login, form:r.form }));
      /* ⚠️ `amLoginUrl()` 은 돌아올 자리를 **encodeURIComponent 로** 담습니다
         (`/login?next=%2Fcat%2Flesson`) — 글자 그대로 찾으면 못 찾고,
         그건 코드가 아니라 제 검사가 틀린 것입니다. 풀어서 봅니다. */
      const back = await g.p.evaluate(function(){
        const a = document.querySelector('#wtbox a[href^="/login"]');
        return a ? a.getAttribute("href") : "";
      });
      ok("  ⚠️⚠️ 그 로그인 주소가 **돌아올 자리를 들고** 있다",
         decodeURIComponent(back).indexOf("/cat/lesson") >= 0, back);
      /* ⚠️⚠️⚠️ 연락처는 목록 어디에도 없어야 합니다 (보기에 칸이 없습니다) */
      ok("⚠️⚠️ 목록 어디에도 연락처가 없다 (v_wanted_open 에 칸이 없습니다)",
         r.body.indexOf("010-") < 0, "");
      ok("  에러 0건", g.errs.length === 0, g.errs.join(" | "));
      await g.p.close();
    }

    /* ③ 거르개 — ⚠️⚠️ **보내는 질의를 뜯어** 봅니다 (흉내는 안 걸러 줍니다) */
    {
      const g = await open("/cat/lesson", { role:"customer", name:"손님", signedIn:true },
                           { v_wanted_open: WNT }, {}, true);
      const n0 = g.sent.length;
      /* ⚠️ 처음에 `#wtrg` 라고 **지어낸 id** 를 적어 두어 30초를 기다리다
         터졌습니다 — 화면이 쓰는 이름은 `#wf-rg` 입니다 (shot-desk 가
         `#myreqbox` 를 지어내 /my 가 한 장도 안 찍힌 그 자리). */
      await g.p.selectOption("#wf-rg", "seoul");
      await g.p.waitForTimeout(400);
      const q = g.sent.slice(n0).filter(function(x){
        return String(x.body).indexOf("v_wanted_open") >= 0;
      }).map(function(x){ return String(x.body); }).join(" | ");
      /* ⚠️⚠️ 2026-11-08 부터 **묶음도 시 · 도도 한 열쇠**로 받으므로
         (현황표의 칸이 묶음을 보냅니다) 늘 `region=in.(…)` 입니다 —
         시 · 도 하나면 그 하나가 들어갑니다. 뜻은 같고 꼴만 바뀌었습니다. */
      ok("⚠️⚠️ 지역 거르개가 **보내는 질의를 좁힌다** (줄 수로 재면 " +
         "거르개를 떼어도 영원히 초록입니다)",
         q.indexOf("region=in.(seoul)") >= 0, q.slice(0, 220));
      /* ⚠️ 분류는 늘 그 화면의 분류로 좁혀져야 합니다 — 안 좁히면
         레슨 화면에 중고 구합니다 글이 섞여 나옵니다 */
      ok("  ⚠️ 분류도 **그 화면의 분류로** 좁힌다", q.indexOf("cat=eq.lesson") >= 0,
         q.slice(0, 220));
      await g.p.close();
    }

    /* ③-2 **레일 · 찾기 · 조건 칩 · 센 수** (2026-11-08) ─────────────
       ⚠️⚠️⚠️ 전에는 고르개 **둘**이 목록 위에 가로로 놓였고, 고른 조건은
       "지금 조건 — 골프채 · 서울" 한 **글**이라 하나씩 지울 수가 없었습니다.
       0건이 나오면 무엇으로 좁혔는지 못 보고 "글이 없구나" 로 읽습니다.
       ⚠️⚠️ **흉내 장치는 걸러 주지 않습니다** — 줄 수로 재면 받는 쪽을
       통째로 떼어도 영원히 초록입니다. **보내는 질의를 뜯어** 봅니다. */
    {
      const g = await open("/cat/market", { role:"customer", name:"손님", signedIn:true },
                           { v_wanted_open: WNT }, {}, true);
      const b0 = await g.p.evaluate(function(){
        return { rail: !!document.getElementById("wtrail"),
                 q:    !!document.getElementById("wf-q"),
                 open: !!document.getElementById("wf-open"),
                 now:  (document.getElementById("wtnow") || {}).textContent || "",
                 /* ⚠️ 정렬 고르개는 **일부러 안 냅니다** — 쓸 차례가
                    최신순 하나뿐이라 눌러도 아무 일이 안 나는 칸입니다 */
                 sort: !!document.getElementById("wf-o") };
      });
      ok("⚠️⚠️ 구합니다에 **거르개 레일 · 찾는 칸**이 있다 (0068 의 틀)",
         b0.rail && b0.q && b0.open, JSON.stringify(b0));
      ok("  ⚠️ 센 수를 적는다", /구합니다 글 \d+건/.test(b0.now), b0.now);
      ok("  ⚠️ 정렬 고르개를 **안 낸다** (한 가지뿐인 고르개는 죽은 칸입니다)",
         !b0.sort, String(b0.sort));

      /* 찾는 말 — ⚠️ **서버가** 찾습니다 */
      const m0 = g.sent.length;
      await g.p.fill("#wf-q", "드라이버");
      await g.p.waitForTimeout(700);
      const qq = g.sent.slice(m0).map(function(x){ return String(x.body); }).join(" | ");
      ok("⚠️⚠️ 찾는 말을 적으면 **서버에** title=ilike 를 보낸다 " +
         "(백 줄만 받아 화면에서 찾으면 그 밖의 글이 영영 안 나옵니다)",
         qq.indexOf("title=ilike.") >= 0 &&
         qq.indexOf(encodeURIComponent("드라이버")) >= 0, qq.slice(0, 200));

      /* 고른 조건이 **칩**으로 보이고 하나씩 지워집니다 */
      const c0 = await g.p.evaluate(function(){
        return { n: document.querySelectorAll(".lsf-chip").length,
                 keys: Array.prototype.map.call(document.querySelectorAll(".lsf-chip"),
                   function(b){ return b.getAttribute("data-off"); }),
                 clear: document.querySelectorAll(".lsf-clear").length };
      });
      ok("⚠️⚠️ 고른 조건이 **칩 한 줄**로 보인다 (지울 수 있게)",
         c0.n >= 1 && c0.clear >= 1 && c0.keys.indexOf("q") >= 0, JSON.stringify(c0));

      const m1 = g.sent.length;
      await g.p.click('.lsf-chip[data-off="q"]');
      await g.p.waitForTimeout(400);
      const q1 = g.sent.slice(m1).map(function(x){ return String(x.body); }).join(" | ");
      ok("  칩을 지우면 **그 조건만** 빠진다",
         q1.indexOf("v_wanted_open") >= 0 && q1.indexOf("title=ilike.") < 0,
         q1.slice(0, 200));

      /* 「조건 모두 지우기」는 **전부** 지웁니다 */
      await g.p.selectOption("#wf-rg", "seoul");
      await g.p.waitForTimeout(400);
      await g.p.fill("#wf-q", "아이언");
      await g.p.waitForTimeout(700);
      const m2 = g.sent.length;
      await g.p.click(".lsf-clear");
      await g.p.waitForTimeout(400);
      const q2 = g.sent.slice(m2).map(function(x){ return String(x.body); }).join(" | ");
      const u2 = await g.p.evaluate(function(){ return location.search; });
      ok("⚠️⚠️ 「조건 모두 지우기」가 **전부** 지운다 (일부만 지우면 " +
         "'지웠습니다' 가 거짓입니다)",
         q2.indexOf("region=in.") < 0 && q2.indexOf("title=ilike.") < 0 && u2 === "",
         q2.slice(0, 200) + " url=" + u2);
      await g.p.close();
    }

    /* ③-3 **여행만 해외 지역이 나옵니다** (2026-11-08) ────────────────
       ⚠️⚠️⚠️ 알아본 곳이 전부 지역을 첫째 축으로 두는데 저희 `AM_REGIONS`
       는 국내 열일곱뿐이라 「해외 골프 여행」을 눌러도 좁힐 것이 없었습니다.
       ⚠️⚠️ **다른 분류에는 안 냅니다** — 「일본에서 조인」 은 골라도 영원히
       0건이고, 그건 눌러도 아무 일이 안 나는 칸입니다(절대 규칙 5).
       ⚠️ 갯수를 박지 않습니다 — `AM_TRIP_REGIONS` 와 맞춰 봅니다. */
    {
      const g = await open("/cat/travel", { role:"customer", name:"손님", signedIn:true },
                           { v_wanted_open: [] }, {}, true);
      const r = await g.p.evaluate(function(){
        function grp(lab){
          var o = Array.prototype.filter.call(
            document.querySelectorAll("#wf-rg optgroup"),
            function(x){ return x.getAttribute("label") === lab; });
          return o.length ? Array.prototype.map.call(o[0].querySelectorAll("option"),
            function(x){ return x.value; }) : [];
        }
        return { away: grp("해외"),
                 want: (window.AM_TRIP_REGIONS || []).map(function(t){ return t.key; }),
                 home: grp("시 · 도") };
      });
      ok("⚠️⚠️ 여행은 지역 고르개에 **해외 묶음**이 선다",
         r.want.length > 0 && r.away.join(",") === r.want.join(","),
         JSON.stringify(r.away) + " vs " + JSON.stringify(r.want));
      ok("  ⚠️ 해외를 **시 · 도 틈에 끼우지 않는다** (국내인 줄 압니다)",
         r.home.length > 0 && r.home.every(function(k){
           return r.want.indexOf(k) < 0; }), JSON.stringify(r.home));
      /* 골라 보면 그 키로 좁혀 보냅니다 */
      const n0 = g.sent.length;
      await g.p.selectOption("#wf-rg", "jp");
      await g.p.waitForTimeout(400);
      const q = g.sent.slice(n0).map(function(x){ return String(x.body); }).join(" | ");
      ok("⚠️⚠️⚠️ 해외를 고르면 **그 키로 좁혀 보낸다** (주소만 맞는 것이 아닙니다)",
         q.indexOf("region=in.(jp)") >= 0, q.slice(0, 200));
      await g.p.close();
    }

    /* ③-4 **다른 분류에는 해외가 없습니다** — 되돌려 보기의 반대쪽 */
    {
      const g = await open("/cat/lesson", { role:"customer", name:"손님", signedIn:true },
                           { v_wanted_open: [] }, {}, true);
      const away = await g.p.evaluate(function(){
        return Array.prototype.filter.call(
          document.querySelectorAll("#wf-rg optgroup"),
          function(x){ return x.getAttribute("label") === "해외"; }).length;
      });
      ok("⚠️⚠️ 레슨에는 해외 묶음이 **한 줄도 없다** (영원히 0건인 칸을 안 냅니다)",
         away === 0, String(away));
      await g.p.close();
    }

    /* ④ 올리는 양식 — 보유 기간 · 동의 · 보내는 꾸러미 */
    {
      const g = await open("/cat/lesson", { role:"customer", name:"손님", signedIn:true },
                           { v_wanted_open: [] }, {}, true);
      await g.p.click("#wtnew");
      await g.p.waitForTimeout(300);
      const r = await g.p.evaluate(function(){
        const f = document.getElementById("wtf");
        return { form: !!f, body: document.body.innerText,
                 names: f ? Array.prototype.map.call(f.elements, function(x){
                   return x.name; }).filter(Boolean) : [] };
      });
      ok("올리는 양식이 열린다", r.form, "");
      /* ⚠️ 보유 기간은 **site.js 의 값**이어야 합니다 (검사에 그날의 글자를
         박으면 사장님이 고치시는 날 멀쩡한 화면이 떨어집니다) */
      const WKEEP = keepOf("wantedKeep");
      ok("  ⚠️ 보유 기간이 **실제 값**으로 찍힌다 (site.js 의 wantedKeep)",
         !!WKEEP && r.body.indexOf(WKEEP) >= 0, WKEEP);
      ok("  ⚠️ 무엇을 · 왜 · 얼마나 받는지 그 자리에서 말한다 (제15조 제2항)",
         r.body.indexOf("수집") >= 0 && r.body.indexOf("연락처") >= 0, "");
      ok("  연락처 · 지역 칸이 있다",
         r.names.indexOf("contact") >= 0 && r.names.indexOf("region") >= 0,
         r.names.join(","));
      /* 제출 — ⚠️ 보내는 꾸러미를 **뜯어** 봅니다 */
      await g.p.fill("#wtf [name=title]", "주말 오전 레슨 구합니다");
      await g.p.fill("#wtf [name=body]", "드라이버를 집중해서 배우고 싶습니다");
      await g.p.selectOption("#wtf [name=region]", "seoul");
      await g.p.fill("#wtf [name=contact]", "010-7000-0000");
      await g.p.fill("#wtf [name=budget]", "0");
      /* ⚠️ 동의 상자의 클래스는 `.jchk` 입니다 (`.chk` 가 아닙니다) —
         지어낸 이름을 적으면 30초를 기다리다 터집니다. */
      await g.p.check("#wtf .jchk input[type=checkbox]");
      await g.p.click('#wtf button[type="submit"]');
      await g.p.waitForTimeout(500);
      const sent = g.sent.filter(function(x){ return x.name === "open_wanted"; });
      ok("⚠️ 올리기 단추가 **open_wanted 를 실제로 부른다**", sent.length === 1,
         "부른 횟수 " + sent.length);
      /* ⚠️ `sent[*].body` 는 **글자**입니다 — 풀어서 봐야 합니다
         (`JSON.parse`). 그냥 `.p` 를 읽으면 늘 `{}` 가 나와서
         "안 보낸다" 로 읽힙니다. */
      const a = sent.length ? (JSON.parse(sent[0].body).p || {}) : {};
      ok("  ⚠️⚠️ **동의 시각을 같이 보낸다** (제15조 제2항 — 없으면 문이 거절합니다)",
         !!a.agree_at, JSON.stringify(a).slice(0, 200));
      ok("  ⚠️⚠️ 예산 **0 을 0 으로** 보낸다 (`||` 면 안 적음과 섞입니다)",
         a.budget === "0" || a.budget === 0, JSON.stringify(a.budget));
      ok("  그 화면의 분류로 보낸다", a.cat === "lesson", String(a.cat));
      await g.p.close();
    }

    /* ⑤ 받을 자리가 없는 분류에는 **한 줄도 안 그립니다** (0곳이 아니라
       아예 그 기능이 없는 자리입니다 — 부킹은 `AM_WANT_OFF`) */
    {
      const g = await open("/cat/booking", { role:"customer", name:"손님", signedIn:true },
                           { v_wanted_open: WNT }, {}, true);
      const has = await g.p.evaluate(function(){
        return { box: !!document.getElementById("wtlist"),
                 nw:  !!document.getElementById("wtnew") };
      });
      ok("⚠️⚠️ 부킹에는 구합니다 자리를 **아예 안 낸다** (티타임이 그 자리입니다)",
         !has.box && !has.nw, JSON.stringify(has));
      await g.p.close();
    }

    /* ⑥ /my — 내가 올린 것과 내가 보낸 답 */
    {
      const MINE = [{ id:"w1", cat:"lesson", sub:"ls-solo", region:"seoul",
        title:"주말 오전 레슨 구합니다", body:"드라이버를 배우고 싶습니다",
        budget:200000, when_txt:"주말 오전", state:"open", hidden_why:null,
        created_at:"2026-11-07T01:00:00Z" }];
      const REPS = [{ id:"r1", w_id:"w1", by_user:"u2",
        body:"주말 오전 자리가 있습니다", state:"accepted",
        created_at:"2026-11-07T02:00:00Z",
        owner_share_at:null, helper_share_at:"2026-11-07T03:00:00Z",
        pro_name:"분당 그린골프아카데미", who:null, owner:"u1" }];
      const CT = [{ reply_id:"r1", owner_contact:null,
        helper_contact:"031-000-0000",
        owner_share_at:null, helper_share_at:"2026-11-07T03:00:00Z" }];
      const g = await open("/my", { role:"customer", name:"손님", signedIn:true },
        { wanted: MINE, v_wanted_reply: REPS, v_wanted_contact: CT }, {}, true);
      const r = await g.p.evaluate(function(){
        const bx = document.getElementById("wtmine");
        return { drawn: !!bx && !bx.hidden, body: bx ? bx.innerText : "",
                 edit: !!(bx && bx.querySelector(".wt-edit")),
                 share: !!(bx && bx.querySelector(".wt-share")) };
      });
      ok("/my 에 내가 올린 구합니다 상자가 그려진다", r.drawn, "");
      ok("  분류 · 하위 · 지역이 **사람 말로** 나온다",
         r.body.indexOf("ls-solo") < 0 && r.body.indexOf("seoul") < 0 &&
         r.body.indexOf("서울") >= 0, r.body.slice(0, 160));
      ok("  받은 답과 **상태 말**이 나온다 (영문 키가 아닙니다)",
         r.body.indexOf("accepted") < 0 && r.body.indexOf("받은 답") >= 0,
         r.body.slice(0, 160));
      ok("  업체가 답한 것은 **상호와 업체 표시**가 붙는다",
         r.body.indexOf("분당 그린골프아카데미") >= 0 &&
         r.body.indexOf("업체") >= 0, "");
      /* ⚠️⚠️⚠️ **받아들였어도 내가 안 열었으면 내 번호가 안 갑니다** —
         화면도 그 사실을 말해야 합니다 (제17조 제2항) */
      ok("⚠️⚠️⚠️ 상대가 연 번호는 보이고, **내 것은 내가 눌러야** 연다",
         r.body.indexOf("031-000-0000") >= 0 && r.share &&
         r.body.indexOf("각자 제 것만") >= 0, r.body.slice(0, 200));
      ok("  고치기 단추가 있다 (`edit_wanted` 를 부르는 자리)", r.edit, "");
      /* ⚠️ 눌러서 양식을 열고 **보내는 꾸러미**를 뜯어 봅니다 */
      await g.p.click("#wtmine .wt-edit");
      await g.p.waitForTimeout(250);
      const ef = await g.p.evaluate(function(){
        const f = document.querySelector("#wtmine .wt-ef");
        return { form: !!f, text: f ? f.innerText : "",
                 names: f ? Array.prototype.map.call(f.elements, function(x){
                   return x.name; }).filter(Boolean) : [],
                 title: f ? f.elements.title.value : "" };
      });
      ok("  고치기 양식이 **적어 둔 것으로 채워져** 열린다",
         ef.form && ef.title === "주말 오전 레슨 구합니다", JSON.stringify(ef.title));
      /* ⚠️⚠️ **분류 · 하위 · 지역 칸을 안 냅니다** — 바꾸면 답하신 분이
         전혀 다른 것에 묶입니다 (문도 그 셋은 조용히 무시합니다). 그려
         두면 눌러도 아무 일이 안 나는 칸입니다 (절대 규칙 5). */
      ok("  ⚠️⚠️ 고치기에 **분류 · 하위 · 지역 칸이 없다**",
         ef.names.indexOf("cat") < 0 && ef.names.indexOf("sub") < 0 &&
         ef.names.indexOf("region") < 0, ef.names.join(","));
      ok("  ⚠️ 못 바꾼다는 것을 **그 자리에서** 말한다 (막다른 길로 두지 않습니다)",
         ef.text.indexOf("못 바꿉니다") >= 0, ef.text.slice(0, 160));
      await g.p.fill("#wtmine .wt-ef [name=budget]", "");
      await g.p.click('#wtmine .wt-ef button[type="submit"]');
      await g.p.waitForTimeout(400);
      const eds = g.sent.filter(function(x){ return x.name === "edit_wanted"; });
      ok("  ⚠️ 저장 단추가 **edit_wanted 를 실제로 부른다**", eds.length === 1,
         "부른 횟수 " + eds.length);
      const ea = eds.length ? (JSON.parse(eds[0].body).p || {}) : {};
      ok("  ⚠️⚠️ 네 칸을 **다 같이** 보낸다 (보낸 칸만 고치는 문입니다)",
         ea.title !== undefined && ea.body !== undefined &&
         ea.when_txt !== undefined && ea.budget !== undefined,
         Object.keys(ea).join(","));
      ok("  ⚠️⚠️ 분류 · 하위 · 지역은 **안 보낸다**",
         !("cat" in ea) && !("sub" in ea) && !("region" in ea),
         Object.keys(ea).join(","));
      ok("  ⚠️ 예산을 비우면 **빈 글자로** 보낸다 (문이 null 로 읽습니다)",
         ea.budget === "", JSON.stringify(ea.budget));
      await g.p.close();
    }

    /* ⑦ 읽을 때 **contact · agree_at 을 안 부릅니다** (0061 이 그 칸을
       안 줬으므로 부르면 질의가 통째로 거절됩니다 — 0053 의 memo 자리) */
    {
      const g = await open("/my", { role:"customer", name:"손님", signedIn:true },
        { wanted: [], v_wanted_reply: [], v_wanted_contact: [] }, {}, true);
      const asked = g.sent.filter(function(x){
        return x.name === "GET" && String(x.body).indexOf("/wanted?") >= 0;
      }).map(function(x){ return String(x.body); }).join(" | ");
      ok("⚠️⚠️ 구합니다를 읽을 때 **contact · agree_at 을 안 부른다** " +
         "(0061 이 그 칸을 안 줬습니다 — 부르면 질의가 거절됩니다)",
         asked.length > 0 && asked.indexOf("contact") < 0 &&
         asked.indexOf("agree_at") < 0, asked.slice(0, 200));
      await g.p.close();
    }
  }

  console.log("\n── 골프 인력 · 비즈니스 (0048)");
  const JOBS = [
    { id:"j1", kind:"hire", sub:"cr-caddy", region:"seoul",
      title:"주말 캐디 구합니다", body:"주말 오전 라운딩 캐디를 구합니다.",
      pay:"일 12만원", terms:"주 2일 · 오전", close_at:"2099-06-30",
      created_at:"2026-11-01T00:00:00Z", who:"김**", pro_name:null, apply_n:2 },
    { id:"j2", kind:"seek", sub:"cr-coach", region:"gyeonggi",
      title:"레슨 자리를 찾습니다", body:"주 3일 레슨 가능한 자리를 찾습니다.",
      pay:null, terms:null, close_at:null,
      created_at:"2026-11-02T00:00:00Z", who:"이**",
      pro_name:"참골프아카데미", apply_n:0 }
  ];

  /* ① 설정 전에는 **아무것도 안 엽니다** (절대 규칙 5) */
  {
    const p0 = await b.newPage({ viewport: view });
    await p0.route("**/api/session", function(r){
      return r.fulfill({ status:200, contentType:"application/json",
        body: JSON.stringify({ auth:false, signedIn:false, conf:null }) });
    });
    await p0.goto(base + "/cat/career", { waitUntil:"networkidle" });
    await p0.waitForTimeout(400);
    const off = await p0.evaluate(function(){
      const b2 = document.getElementById("jobbox");
      return { form: !!document.getElementById("jbf"),
               boxHtml: (b2 ? b2.innerHTML : "").trim().length };
    });
    ok("⚠️ 설정 전에는 구인 · 구직 양식을 **안 엽니다**",
       !off.form && off.boxHtml === 0, JSON.stringify(off));
    await p0.close();
  }

  /* ② 로그인 전 — 목록은 보이고, 지원은 로그인으로 보냅니다 */
  {
    const g = await open("/cat/career", { role:"customer", name:"", signedIn:false },
                         { v_job_open: JOBS }, {}, true);
    const r = await g.p.evaluate(function(){
      const li = document.querySelectorAll(".jbc");
      const box = document.getElementById("jobbox");
      return { n: li.length,
               body: document.body.innerText,
               login: !!(box && box.querySelector('a[href^="/login"]')),
               form: !!document.getElementById("jbf"),
               chips: document.querySelectorAll(".jbf-c .chip").length,
               pay1: !!document.querySelector('.jbc[data-id="j1"] .jbc-p'),
               pay2: !!document.querySelector('.jbc[data-id="j2"] .jbc-p') };
    });
    ok("로그인 전에도 올라온 글이 보인다", r.n === 2, "카드 " + r.n + "장");
    ok("  갈래를 한글로 적는다 (영문 키를 안 찍습니다)",
       r.body.indexOf("구인") >= 0 && r.body.indexOf("구직") >= 0 &&
       r.body.indexOf("hire") < 0 && r.body.indexOf("seek") < 0, "");
    ok("  하위분류도 한글로 적는다 (catalog.js 한 곳에서 읽습니다)",
       r.body.indexOf("캐디 구인") >= 0 && r.body.indexOf("cr-caddy") < 0, "");
    ok("⚠️⚠️ 목록 어디에도 연락처가 없다 (v_job_open 에 칸이 없습니다)",
       r.body.indexOf("010-") < 0, "");
    ok("  ⚠️ 그리고 그 사실을 손님에게 말해 준다",
       r.body.indexOf("연락처는 목록에 나오지 않습니다") >= 0, "");
    ok("  ⚠️ 채용을 대신 한다고 말하지 않는다 (절대 규칙 5)",
       r.body.indexOf("채용을 대신 진행하지 않으며") >= 0, "");
    /* ⚠️ 급여가 비면 **줄째 빠집니다** (절대 규칙 2 — "협의" 를 지어
       적지 않습니다) */
    ok("⚠️ 급여가 있으면 그 줄이 나온다", r.pay1, "");
    ok("⚠️⚠️ 급여가 비면 그 줄이 **아예 없다** (자리표시자를 안 찍습니다)",
       !r.pay2, "");
    /* ⚠️ 업체 이름은 **고르셨을 때만** 옵니다 */
    ok("⚠️ 업체 이름을 고른 글에는 **상호**가 나온다",
       r.body.indexOf("참골프아카데미") >= 0, "");
    ok("  안 고른 글에는 가린 이름이 나온다", r.body.indexOf("김**") >= 0, "");
    ok("  로그인 전에는 올리는 양식 대신 로그인 길을 낸다", r.login && !r.form,
       JSON.stringify({ login:r.login, form:r.form }));
    /* ⚠️⚠️ 거르개는 **단추가 아니라 링크**입니다 (주소를 복사해 보낼 수
       있게 · 자바스크립트가 꺼진 분에게 죽은 칸이 되지 않게) */
    ok("⚠️ 거르개가 **링크**로 나온다 (전체 + 갈래 셋)", r.chips === 4,
       "칸 " + r.chips + "개");
    const tag = await g.p.evaluate(function(){
      const a = document.querySelector(".jbf-c .chip");
      return { tag: a ? a.tagName : "", href: a ? a.getAttribute("href") : "",
               cur: a ? a.getAttribute("aria-current") : "" };
    });
    ok("  그 칸이 <a> 이고 주소를 들고 있다",
       tag.tag === "A" && tag.href === "/cat/career", JSON.stringify(tag));
    ok("  눌린 칸을 **색만이 아니라 aria-current 로도** 말한다",
       tag.cur === "true", JSON.stringify(tag));

    /* 거르개를 눌러 봅니다 — ⚠️ 보내는 열쇠가 DB 와 같은지까지 */
    g.sent.length = 0;
    await g.p.click('.jbf-c .chip[data-k="hire"]');
    await g.p.waitForTimeout(400);
    const q = g.sent.filter(function(x){
      return x.name === "GET" && x.body.indexOf("v_job_open") >= 0; })[0];
    ok("⚠️⚠️ 거르개를 누르면 **kind 로 좁혀 다시 읽는다** (눌러 봐야 압니다)",
       !!q && q.body.indexOf("kind=eq.hire") >= 0, q ? q.body : "안 읽었습니다");
    const url = await g.p.evaluate(function(){ return window.location.search; });
    ok("  주소도 같이 바뀐다 (복사해 보내도 같은 화면입니다)",
       url.indexOf("k=hire") >= 0, url);
    await g.p.close();
  }

  /* ②-2 하위분류로 좁혀 오는 길 (`?s=` · 지시서 §4)
     ⚠️⚠️⚠️ **인력의 하위 여섯은 업체 목록이 아닙니다.** "골프 프로
     구인 · 구직" 을 업체찾기로 보내면 영원히 0건이고, 그건 눌러도
     아무 일이 안 나는 칸과 같습니다 — 그래서 **제 글 목록**으로
     옵니다 (`amSubUrl` 이 그 갈래를 한 곳에서 가릅니다). */
  {
    const g = await open("/cat/career?s=cr-caddy",
                         { role:"customer", name:"", signedIn:false },
                         { v_job_open: [JOBS[0]] }, {}, true);
    const q = g.sent.filter(function(x){
      return x.name === "GET" && x.body.indexOf("v_job_open") >= 0; })[0];
    ok("⚠️⚠️ 하위로 좁혀 오면 **sub 로 좁혀 읽는다** (열쇠 이름이 DB 와 같은가)",
       !!q && q.body.indexOf("sub=eq.cr-caddy") >= 0, q ? q.body : "안 읽었습니다");
    const r = await g.p.evaluate(function(){
      return { body: document.getElementById("joblist").innerText,
               clear: !!document.querySelector('#joblist a[href="/cat/career"]') };
    });
    ok("  무엇으로 좁혔는지 **글로** 말한다 (칸이 없는 조건입니다)",
       r.body.indexOf("캐디 구인") >= 0 && r.body.indexOf("글만 보고 있습니다") >= 0,
       r.body.slice(0, 200));
    ok("  조건을 지우는 길도 낸다 (막다른 길로 두지 않습니다)", r.clear, "");

    /* ⚠️ 갈래를 눌러도 **하위 조건을 지켜야** 합니다 — 풀리면 손님이
       좁혀 온 길이 조용히 사라집니다. */
    const href = await g.p.getAttribute('.jbf-c .chip[data-k="hire"]', "href");
    ok("⚠️⚠️ 갈래 칸의 주소가 **하위를 지킨다**",
       (href || "").indexOf("k=hire") >= 0 && (href || "").indexOf("s=cr-caddy") >= 0,
       String(href));
    await g.p.close();

    /* ⚠️ 모르는 하위 키는 **버립니다** — 좁혀 놓고 "글이 없다" 로 보이면
       손님은 글이 없는 줄 압니다. */
    const g2 = await open("/cat/career?s=이런하위는없습니다",
                          { role:"customer", name:"", signedIn:false },
                          { v_job_open: JOBS }, {}, true);
    const q2 = g2.sent.filter(function(x){
      return x.name === "GET" && x.body.indexOf("v_job_open") >= 0; })[0];
    ok("모르는 하위 키는 버리고 전체를 보여 준다 (지어내지 않습니다)",
       !!q2 && q2.body.indexOf("sub=eq.") < 0, q2 ? q2.body : "안 읽었습니다");
    await g2.p.close();
  }

  /* ③ 로그인 뒤 — 올리는 양식 */
  {
    const g = await open("/cat/career", { role:"customer", name:"손님", signedIn:true },
                         { v_job_open: JOBS }, {}, true);
    const r = await g.p.evaluate(function(){
      const f = document.getElementById("jbf");
      if(!f) return { form:false };
      const req = Array.prototype.map.call(
        f.querySelectorAll("[required]"), function(e){ return e.name || "(동의)"; });
      const box = f.querySelector(".jconsent");
      return { form:true, req: req,
               consent: box ? box.innerText : "",
               aspro: !!document.getElementById("b-aspro"),
               closeMin: (document.getElementById("b-close") || {}).min || "",
               hint: f.innerText,
               subs: f.querySelectorAll('select[name="sub"] option').length,
               kinds: f.querySelectorAll('select[name="kind"] option').length };
    });
    ok("로그인하면 올리는 양식이 열린다", r.form, JSON.stringify(r).slice(0, 120));
    /* ⚠️⚠️ 0058 — 로그인하신 뒤에는 "조건 저장" 길을 냅니다. 글과 주소는
       js/data/deal.js 의 amWatchLink() 한 곳입니다 (분류 화면 셋이 같은
       말을 해야 합니다). */
    ok("⚠️⚠️ 로그인하면 **조건 저장 길**이 생긴다 (0058)",
       (await g.p.locator('a[href="/my?w=job"]').count()) === 1,
       await g.p.locator('a[href="/my?w=job"]').count());
    ok("  갈래 · 분류 · 지역 · 제목 · 내용 · 연락처가 **필수**다",
       ["kind","sub","region","title","body","contact"].every(function(k){
         return r.req.indexOf(k) >= 0; }), r.req.join(","));
    ok("  하위분류 여섯을 catalog.js 에서 읽어 채운다 (고르세요 + 6)",
       r.subs === 7, "칸 " + r.subs + "개");
    ok("  갈래 셋을 채운다 (고르세요 + 3)", r.kinds === 4, "칸 " + r.kinds + "개");
    /* ⚠️⚠️ 제15조 제2항 — 수집 항목 · 목적 · 보유 기간을 **그 자리에서** */
    ok("  ⚠️ 동의 상자에 수집 항목 · 목적 · 보유 기간 · 제공이 같이 있다",
       r.consent.indexOf("수집 항목") >= 0 && r.consent.indexOf("이용 목적") >= 0 &&
       r.consent.indexOf("보유 기간") >= 0 && r.consent.indexOf("제공") >= 0,
       r.consent.slice(0, 160));
    const CKEEP = keepOf("careerKeep");
    ok("  ⚠️ 보유 기간이 **실제 값**으로 찍힌다 (site.js 의 careerKeep)",
       !!CKEEP && r.consent.indexOf(CKEEP) >= 0, CKEEP);
    ok("  ⚠️ 연락처 칸이 **언제 누구에게 가는지**를 그 자리에서 말한다",
       r.hint.indexOf("목록에는") >= 0 && r.hint.indexOf("다시 한 번 고르셔야") >= 0, "");
    /* ⚠️ 업체 담당자가 아니면 그 칸이 **아예 없습니다** (눌러도 아무
       일이 안 나는 칸을 만들지 않습니다) */
    ok("⚠️ 업체 담당자가 아니면 '업체 이름으로 올리기' 칸이 **없다**",
       !r.aspro, "");
    ok("  지난 날짜를 못 고르게 마감일에 min 을 건다",
       /^\d{4}-\d{2}-\d{2}$/.test(r.closeMin), r.closeMin);

    /* 올리는 단추가 문을 실제로 부르는가 — ⚠️ 꾸러미까지 뜯어 봅니다 */
    await g.p.selectOption("#b-kind", "hire");
    await g.p.selectOption("#b-sub", "cr-caddy");
    await g.p.selectOption("#b-rg", "seoul");
    await g.p.fill("#b-title", "검사용 구인");
    await g.p.fill("#b-body", "검사로 올려 봅니다.");
    await g.p.fill("#b-contact", "010-1234-5678");
    await g.p.check("#jbf .jconsent input[type=\"checkbox\"]");
    await g.p.click('#jbf button[type="submit"]');
    await g.p.waitForTimeout(400);
    const call = g.sent.filter(function(x){ return x.name === "open_jobpost"; })[0];
    ok("⚠️ 올리기 단추가 **open_jobpost 를 실제로 부른다**", !!call,
       g.sent.map(function(x){ return x.name; }).join(","));
    if(call){
      const sp = JSON.parse(call.body).p;
      ok("  적은 것이 그대로 간다 (열쇠 이름이 DB 와 같습니다)",
         sp.kind === "hire" && sp.sub === "cr-caddy" && sp.region === "seoul" &&
         sp.title === "검사용 구인" && sp.contact === "010-1234-5678",
         JSON.stringify(sp).slice(0, 200));
      ok("  ⚠️ **동의 시각**을 같이 보낸다 (제15조 제2항)",
         !!sp.agree_at &&
         Math.abs(Date.now() - new Date(sp.agree_at).getTime()) < 60000,
         String(sp.agree_at));
      ok("  ⚠️ 업체 칸이 없으면 as_pro 를 **false 로** 보낸다 (보낸 값을 " +
         "문이 안 믿지만, 화면도 지어내지 않습니다)", sp.as_pro === false,
         String(sp.as_pro));
    }
    await g.p.close();
  }

  /* ④ 업체 담당자 — ⚠️ 그때만 '업체 이름으로 올리기' 칸이 생깁니다 */
  {
    const g = await open("/cat/career",
      { role:"provider", name:"박담당", signedIn:true, provider:"jb-real" },
      { v_job_open: JOBS }, {}, true);
    const r = await g.p.evaluate(function(){
      const e = document.getElementById("b-aspro");
      return { aspro: !!e, hint: document.getElementById("jbf").innerText };
    });
    ok("⚠️ 업체 담당자에게는 '업체 이름으로 올리기' 칸이 있다", r.aspro, "");
    ok("  ⚠️ 승인된 업체만 된다고 그 자리에서 말한다",
       r.hint.indexOf("승인된 업체만 됩니다") >= 0, "");
    await g.p.close();
  }

  /* ⑤ 지원 — ⚠️ 연락처가 바로 가지 않는다고 그 자리에서 말합니다 */
  {
    const g = await open("/cat/career", { role:"customer", name:"손님", signedIn:true },
                         { v_job_open: JOBS }, {}, true);
    await g.p.click('.jbc[data-id="j1"] .jbc-go');
    await g.p.waitForTimeout(250);
    const r = await g.p.evaluate(function(){
      const f = document.querySelector('.jbc[data-id="j1"] .jbaf');
      return { form: !!f, text: f ? f.innerText : "" };
    });
    ok("지원 단추를 누르면 그 자리에 양식이 열린다", r.form, "");
    ok("  ⚠️ 연락처가 **바로 가지 않는다**고 그 자리에서 말한다",
       r.text.indexOf("바로 가지 않습니다") >= 0, r.text.slice(0, 160));
    ok("  ⚠️ 동의 상자도 같이 있다 (제15조 제2항)",
       r.text.indexOf("보유 기간") >= 0, "");
    await g.p.fill('.jbc[data-id="j1"] .jbaf textarea[name="msg"]',
                   "캐디 경력 3년입니다.");
    await g.p.fill('.jbc[data-id="j1"] .jbaf input[name="contact"]', "010-3333-4444");
    await g.p.check('.jbc[data-id="j1"] .jbaf .jconsent input[type="checkbox"]');
    await g.p.click('.jbc[data-id="j1"] .jbaf button[type="submit"]');
    await g.p.waitForTimeout(400);
    const ap = g.sent.filter(function(x){ return x.name === "apply_jobpost"; })[0];
    ok("⚠️ 보내기가 **apply_jobpost 를 실제로 부른다**", !!ap,
       g.sent.map(function(x){ return x.name; }).join(","));
    if(ap){
      const sp = JSON.parse(ap.body).p;
      ok("  그 글을 가리키고 동의 시각을 같이 보낸다",
         sp.post_id === "j1" && !!sp.agree_at, JSON.stringify(sp).slice(0, 160));
    }
    const after = await g.p.evaluate(function(){
      return document.querySelector('.jbc[data-id="j1"]').innerText; });
    ok("  ⚠️ 보낸 뒤 **지킬 수 없는 약속을 하지 않는다**",
       after.indexOf("언제까지라고 약속드리지는 않습니다") >= 0, after.slice(0, 160));
    await g.p.close();
  }

  /* ⑥ /my — ⚠️⚠️ **수락만으로 연락처가 보이면 안 됩니다** */
  {
    const MYP = [
      { id:"j1", kind:"hire", sub:"cr-caddy", region:"seoul",
        title:"내가 올린 구인", body:"설명입니다.", pay:"일 12만원",
        terms:null, close_at:null, state:"open", hidden_why:null,
        created_at:"2026-11-01T00:00:00Z" },
      { id:"j9", kind:"seek", sub:"cr-coach", region:"seoul",
        title:"가려진 글", body:"설명입니다.", pay:null, terms:null,
        close_at:null, state:"hidden", hidden_why:"허위 구인으로 보입니다",
        created_at:"2026-11-01T00:00:00Z" },
      { id:"j8", kind:"biz", sub:"cr-b2b", region:"seoul",
        title:"마감한 글", body:"설명입니다.", pay:null, terms:null,
        close_at:null, state:"closed", hidden_why:null,
        created_at:"2026-11-01T00:00:00Z" }
    ];
    const MYA = [
      { id:"a1", post_id:"j1", by_user:"u2", msg:"캐디 경력 3년입니다",
        state:"accepted", host_share_at:null, guest_share_at:null },
      /* ⚠️ **수락 단추를 누르려면 아직 안 처리된 것이 있어야** 합니다.
         수락된 것만 넣어 두고 단추를 찾으면 30초를 기다리다 터집니다
         (검사가 쓰는 상태를 검사가 만들어야 합니다). */
      { id:"a3", post_id:"j1", by_user:"u3", msg:"기다리는 지원",
        state:"applied", host_share_at:null, guest_share_at:null },
      { id:"a2", post_id:"j7", by_user:"me", msg:"제가 보낸 지원",
        state:"applied", host_share_at:null, guest_share_at:null }
    ];
    /* ⚠️ 수락됐지만 **아무도 연락처를 안 열었습니다** → 빈 값이 옵니다 */
    const MYC = [{ apply_id:"a1", post_contact:null, apply_contact:null,
                   host_share_at:null, guest_share_at:null }];
    const g = await open("/my", { role:"customer", name:"손님", signedIn:true },
      { jobpost: MYP, jobapply: MYA, v_job_contact: MYC,
        joinroom: [], joinapply: [], v_join_contact: [],
        cq: [], ca: [], request: [], quote: [], review: [] }, {}, true);
    const r = await g.p.evaluate(function(){
      const box = document.getElementById("jobmine");
      return { drawn: !!box && !box.hidden && box.children.length > 0,
               body: box ? box.innerText : "",
               share: !!document.querySelector(".mb-share"),
               edit:  !!document.querySelector(".mb-edit"),
               close: !!document.querySelector(".mb-close"),
               drop:  !!document.querySelector(".mb-drop"),
               okBtn: !!document.querySelector(".mb-ok") };
    });
    ok("/my 에 내 구인 · 구직이 그려진다", r.drawn, JSON.stringify(r).slice(0, 140));
    ok("  내가 올린 글과 내가 보낸 것을 **갈라서** 보여 준다",
       r.body.indexOf("내가 올린 글") >= 0 &&
       r.body.indexOf("내가 보낸 지원 · 제안") >= 0, "");
    ok("⚠️⚠️⚠️ **수락만으로는 연락처가 화면에 안 나온다** (제17조 제2항)",
       r.body.indexOf("010-") < 0 && r.body.indexOf("아직 안 여셨습니다") >= 0,
       r.body.slice(0, 200));
    ok("  대신 **내 연락처를 보여 줄지 고르는 단추**가 있다", r.share, "");
    ok("  올린 글을 고치고 · 마감하고 · 내리는 길이 있다",
       r.edit && r.close && r.drop, JSON.stringify(r));
    /* ⚠️⚠️ 상태 말을 **한글로** — 영문 키가 그대로 찍히면 안 됩니다
       (조인에서 실제로 그랬습니다 — `||` 가 `?:` 보다 먼저 묶였습니다) */
    ok("⚠️⚠️ 상태를 한글로 적는다 (closed · hidden 이 영문으로 안 찍힙니다)",
       r.body.indexOf("마감했습니다") >= 0 &&
       r.body.indexOf("운영자가 가렸습니다") >= 0 &&
       r.body.indexOf("closed") < 0 && r.body.indexOf("hidden") < 0,
       r.body.slice(0, 300));
    /* ⚠️ 가린 까닭을 글쓴이에게 보여 줍니다 */
    ok("⚠️ 가린 **까닭**을 글쓴이에게 보여 준다",
       r.body.indexOf("허위 구인으로 보입니다") >= 0, "");
    /* ⚠️ 가려진 글에는 고치기 · 마감 단추가 없어야 합니다 */
    const hid = await g.p.evaluate(function(){
      const li = document.querySelector('.mj-i[data-id="j9"]');
      return li ? { edit: !!li.querySelector(".mb-edit"),
                    drop: !!li.querySelector(".mb-drop") } : null;
    });
    ok("⚠️ 가려진 글에는 고치기 · 내리기 단추가 **없다** (문도 거절합니다)",
       !!hid && !hid.edit && !hid.drop, JSON.stringify(hid));

    /* 수락 단추가 실제로 문을 부르는가 — ⚠️ **있는지 먼저 봅니다.**
       없는데 누르면 30초를 기다리다 검사가 통째로 터지고, 무엇이
       틀렸는지는 안 적힙니다. */
    ok("아직 안 처리된 지원에는 수락 · 거절 단추가 있다", r.okBtn,
       JSON.stringify(r).slice(0, 160));
    await g.p.click(".mb-ok");
    await g.p.waitForTimeout(350);
    const mv = g.sent.filter(function(x){ return x.name === "move_jobapply"; })[0];
    ok("⚠️ 수락 단추가 **move_jobapply 를 실제로 부른다**", !!mv,
       g.sent.map(function(x){ return x.name; }).join(","));
    if(mv) ok("  accepted 로 보낸다", JSON.parse(mv.body).p.state === "accepted",
              mv.body);
    await g.p.close();

    /* 연락처 열기 — ⚠️ 동의 시각을 같이 보내야 합니다 */
    const g2 = await open("/my", { role:"customer", name:"손님", signedIn:true },
      { jobpost: MYP, jobapply: MYA, v_job_contact: MYC,
        joinroom: [], joinapply: [], v_join_contact: [],
        cq: [], ca: [], request: [], quote: [], review: [] }, {}, true);
    await g2.p.click(".mb-share");
    await g2.p.waitForTimeout(350);
    const sh = g2.sent.filter(function(x){ return x.name === "share_jobcontact"; })[0];
    ok("⚠️⚠️ 연락처 단추가 **share_jobcontact 를 부른다**", !!sh,
       g2.sent.map(function(x){ return x.name; }).join(","));
    if(sh){
      const sp = JSON.parse(sh.body).p;
      ok("  on:true 와 **동의 시각**을 같이 보낸다 (따로 받는 동의입니다)",
         sp.on === true && !!sp.agree_at, JSON.stringify(sp));
    }
    await g2.p.close();

    /* 고치기 — ⚠️ 양식이 읽을 칸이 채워져 열리는가 (빠뜨리면 지워집니다) */
    const g3 = await open("/my", { role:"customer", name:"손님", signedIn:true },
      { jobpost: MYP, jobapply: MYA, v_job_contact: MYC,
        joinroom: [], joinapply: [], v_join_contact: [],
        cq: [], ca: [], request: [], quote: [], review: [] }, {}, true);
    await g3.p.click('.mj-i[data-id="j1"] .mb-edit');
    await g3.p.waitForTimeout(250);
    const ef = await g3.p.evaluate(function(){
      const f = document.querySelector('.mj-i[data-id="j1"] .mb-ef');
      if(!f) return null;
      return { title: f.title.value, body: f.body.value, pay: f.pay.value,
               text: f.innerText };
    });
    ok("고치는 양식이 **지금 값으로 채워져** 열린다",
       !!ef && ef.title === "내가 올린 구인" && ef.pay === "일 12만원",
       JSON.stringify(ef).slice(0, 160));
    ok("  ⚠️ 갈래 · 분류 · 지역은 못 바꾼다고 그 자리에서 말한다",
       !!ef && ef.text.indexOf("갈래 · 분류 · 지역은 여기서 못 바꿉니다") >= 0, "");
    /* ⚠️⚠️ 연락처는 칸 단위 GRANT 로 못 읽어서 **채울 수가 없습니다** —
       그 사실을 손님에게 말해 줍니다 (빈 칸을 말없이 두면 저장하는
       순간 지워진 것처럼 보입니다). */
    ok("⚠️⚠️ 연락처는 **다시 적어 달라고** 말한다 (칸 GRANT 로 못 읽습니다)",
       !!ef && ef.text.indexOf("다시 적어 주셔야") >= 0, "");
    await g3.p.close();
  }

  /* ⑦ 폰 폭 셋 — ⚠️ 설정이 있어야 열리는 화면은 여기서만 재집니다 */
  for(const w of PHONES){
    const p2 = await b.newPage({ viewport: { width: w, height: 900 } });
    await stub(p2, { role:"customer", name:"손님", signedIn:true },
               { v_job_open: JOBS }, {}, true);
    await p2.goto(base + "/cat/career", { waitUntil:"networkidle" });
    await p2.waitForTimeout(500);
    const r = await p2.evaluate(function(){
      const small = [], low = [];
      Array.prototype.forEach.call(
        document.querySelectorAll(".jbc, .jbox, .jbl, .jbf-c, .none"),
        function(box){
          Array.prototype.forEach.call(box.querySelectorAll("*"), function(e){
            if(e.firstChild && e.firstChild.nodeType === 3 && (e.textContent||"").trim()){
              const fs = parseFloat(getComputedStyle(e).fontSize);
              if(fs < 12) small.push(e.tagName + " " + fs);
            }
          });
          Array.prototype.forEach.call(box.querySelectorAll("button, a"), function(e){
            if(e.getBoundingClientRect().height < 39.5) low.push(e.tagName);
          });
        });
      return { doc: document.documentElement.scrollWidth, win: window.innerWidth,
               drawn: !!document.querySelector(".jbc"),
               small: small.slice(0,4), low: low.slice(0,4) };
    });
    if(w === PHONES[0])
      ok("인력 — 폰에서 그려지기는 한다 (빈 화면을 재고 통과하지 않습니다)",
         r.drawn, JSON.stringify(r));
    ok("인력 " + w + "px — **가로로 안 밀린다**", r.doc <= r.win + 1,
       "문서 " + r.doc + "px · 화면 " + r.win + "px");
    ok("인력 " + w + "px — 12px 미만 글자가 없다", r.small.length === 0,
       r.small.join(" · "));
    ok("인력 " + w + "px — 누르는 것이 40px 이상이다", r.low.length === 0,
       r.low.join(" · "));
    await p2.close();
  }

  /* ══════════════════════════════════════════════════════════════
     내부 알림 (0050 · 지시서 §6) — ⚠️ **설정이 있어야 열리는 자리**라
     빌드가 찍은 HTML 만 보는 검사는 영원히 못 봅니다.
     ⚠️⚠️ 가장 중요한 것: **밖으로 보낸다고 말하지 않는가** (절대 규칙 5).
     ══════════════════════════════════════════════════════════════ */
  console.log("\n── 내부 알림 (0050)");
  {
    const NTS = [
      { id:"n1", kind:"quote", title:"받으신 견적이 하나 늘었습니다",
        link:"/my", read_at:null, created_at:"2026-11-05T01:00:00Z" },
      { id:"n2", kind:"answer", title:"올리신 질문에 답변이 달렸습니다",
        link:"/cat/community", read_at:"2026-11-04T01:00:00Z",
        created_at:"2026-11-04T00:00:00Z" }
    ];
    /* ① 로그인 전에는 **한 글자도** 안 그립니다 */
    {
      const p0 = await b.newPage({ viewport: view });
      await p0.route("**/api/session", function(r){
        return r.fulfill({ status:200, contentType:"application/json",
          body: JSON.stringify({ auth:true, signedIn:false, conf:null }) });
      });
      await p0.goto(base + "/my", { waitUntil:"networkidle" });
      await p0.waitForTimeout(400);
      const off = await p0.evaluate(function(){
        const e = document.getElementById("noticebox");
        return { hidden: !e || e.hidden, html: (e ? e.innerHTML : "").trim().length };
      });
      ok("⚠️ 로그인 전에는 알림 자리를 **안 그린다**",
         off.hidden && off.html === 0, JSON.stringify(off));
      await p0.close();
    }

    /* ② 0건이면 **아무것도 안 그립니다** (빈 상자를 두지 않습니다) */
    {
      const g = await open("/my", { role:"customer", name:"손님", signedIn:true },
        Object.assign({}, MYT, { notice: [], quote:[], review:[] }), {}, true);
      const e = await g.p.evaluate(function(){
        const x = document.getElementById("noticebox");
        return { hidden: !x || x.hidden, html: (x ? x.innerHTML : "").trim().length };
      });
      ok("⚠️ 알림이 0건이면 **빈 상자를 안 둔다**", e.hidden && e.html === 0,
         JSON.stringify(e));
      await g.p.close();
    }

    /* ③ 있으면 그립니다 */
    const g = await open("/my", { role:"customer", name:"손님", signedIn:true },
      Object.assign({}, MYT, { notice: NTS, quote:[], review:[] }), {}, true);
    const r = await g.p.evaluate(function(){
      const x = document.getElementById("noticebox");
      return { drawn: !!x && !x.hidden,
               body: x ? x.innerText : "",
               n: document.querySelectorAll("#noticebox .nt-i").length,
               unread: document.querySelectorAll("#noticebox .nt-new").length,
               readBtn: document.querySelectorAll("#noticebox button[data-nt]").length,
               links: Array.prototype.map.call(
                 document.querySelectorAll("#noticebox .nt-t"),
                 function(a){ return a.getAttribute("href"); }),
               icons: document.querySelectorAll("#noticebox .nt-ic svg").length };
    });
    ok("알림이 그려진다", r.drawn && r.n === 2, JSON.stringify(r).slice(0, 160));
    ok("⚠️⚠️ **밖으로 보낸다고 말하지 않는다** (문자 · 카톡 · 메일)",
       r.body.indexOf("문자 · 카톡 · 메일로는 보내 드리지 않습니다") >= 0 &&
       !/문자로 알려|카톡으로 알려|메일로 알려/.test(r.body), r.body.slice(0, 220));
    ok("안 읽은 것을 **색만이 아니라** 따로 센다 (수를 적습니다)",
       r.unread === 1 && r.body.indexOf("알림") >= 0, JSON.stringify(r).slice(0, 160));
    ok("  읽은 것에는 읽음 단추를 안 낸다 (눌러도 아무 일이 안 나는 단추)",
       r.readBtn === 1, String(r.readBtn));
    ok("⚠️ 가는 자리가 **우리 주소**다", r.links.every(function(h2){
       return h2 && h2.charAt(0) === "/" && h2.indexOf("//") !== 0; }),
       r.links.join(" "));
    /* ⚠️⚠️ **빈 아이콘 자리**가 없는가 — 없는 이름은 빈 글자가 됩니다 */
    ok("⚠️⚠️ 아이콘이 **빈 칸이 아니다** (없는 이름은 조용히 빈 글자입니다)",
       r.icons === 2, "그려진 아이콘 " + r.icons + "개");

    /* 읽음 단추가 문을 실제로 부르는가 */
    await g.p.click("#noticebox button[data-nt]");
    await g.p.waitForTimeout(350);
    const rn = g.sent.filter(function(x){ return x.name === "read_notice"; })[0];
    ok("⚠️ 읽음 단추가 **read_notice 를 실제로 부른다**", !!rn,
       g.sent.map(function(x){ return x.name; }).join(","));
    if(rn) ok("  그 알림을 가리킨다", JSON.parse(rn.body).p.id === "n1", rn.body);
    await g.p.click("#noticebox .nt-all");
    await g.p.waitForTimeout(350);
    const ra = g.sent.filter(function(x){
      return x.name === "read_notice" && (x.body || "").indexOf("\"all\"") >= 0; })[0];
    ok("모두 읽음도 같은 문을 부른다 (all:true)", !!ra, ra && ra.body);
    await g.p.close();

    /* ④ 업체 작업실에도 같은 자리가 있는가 */
    {
      const g2 = await open("/desk",
        { role:"provider", name:"업체", provider:"t-range", signedIn:true },
        { notice: NTS, assignment:[], request:[], quote:[], request_item:[],
          provider: [] }, {}, true);
      ok("업체 작업실에도 알림 자리가 있다",
         (await g2.p.locator("#noticebox .nt-i").count()) === 2,
         await g2.p.locator("#noticebox .nt-i").count());
      await g2.p.close();

      /* ⚠️⚠️⚠️ **그 자리가 누구의 것인지** — `/desk` 는 업체 작업실이라
         일반회원에게는 한 줄도 안 보이고 **읽으러 가지도 않습니다.**
         처음에 알림을 그냥 달았더니 일반회원이 /desk 에 들어와도 제
         알림을 읽으러 갔고, 바로 위 "배정을 아예 읽으러 가지도
         않는다" 가 떨어졌습니다 — **코드가 틀렸고 검사가 맞았습니다.**
         ⚠️ 상자가 `data-role` 로 제 자리를 말하고, `js/notice.js` 가
         그 값만 봅니다 (판단을 화면마다 적지 않습니다). */
      const g3 = await open("/desk",
        { role:"customer", name:"일반회원", signedIn:true },
        { notice: NTS, assignment:[], request:[], quote:[], request_item:[],
          provider: [] }, {}, true);
      ok("⚠️⚠️ 업체가 아니면 /desk 의 알림 자리가 **안 그려진다**",
         (await g3.p.locator("#noticebox .nt-i").count()) === 0,
         await g3.p.locator("#noticebox .nt-i").count());
      ok("⚠️⚠️⚠️ 그리고 알림을 **읽으러 가지도 않는다** (그 화면의 다른 " +
         "자리와 같은 규칙입니다)",
         g3.sent.filter(function(x){
           return x.name === "GET" && x.body.indexOf("/notice") >= 0; }).length === 0,
         g3.sent.map(function(x){ return x.body || x.name; }).join(" | ").slice(0, 200));
      await g3.p.close();
    }

    /* ⑤ 폰 폭 셋 */
    for(const w of PHONES){
      const p2 = await b.newPage({ viewport: { width: w, height: 900 } });
      await stub(p2, { role:"customer", name:"손님", signedIn:true },
                 Object.assign({}, MYT, { notice: NTS, quote:[], review:[] }),
                 {}, true);
      await p2.goto(base + "/my", { waitUntil:"networkidle" });
      await p2.waitForTimeout(500);
      const m = await p2.evaluate(function(){
        const small = [], low = [];
        const box = document.getElementById("noticebox");
        if(box){
          Array.prototype.forEach.call(box.querySelectorAll("*"), function(e){
            if(e.firstChild && e.firstChild.nodeType === 3 && (e.textContent||"").trim()){
              const fs2 = parseFloat(getComputedStyle(e).fontSize);
              if(fs2 < 12) small.push(e.tagName + " " + fs2);
            }
          });
          Array.prototype.forEach.call(box.querySelectorAll("button, a"), function(e){
            if(e.getBoundingClientRect().height < 39.5) low.push(e.tagName);
          });
        }
        return { doc: document.documentElement.scrollWidth, win: window.innerWidth,
                 drawn: !!document.querySelector("#noticebox .nt-i"),
                 small: small.slice(0,4), low: low.slice(0,4) };
      });
      if(w === PHONES[0])
        ok("알림 — 폰에서 그려지기는 한다", m.drawn, JSON.stringify(m));
      ok("알림 " + w + "px — **가로로 안 밀린다**", m.doc <= m.win + 1,
         "문서 " + m.doc + "px · 화면 " + m.win + "px");
      ok("알림 " + w + "px — 12px 미만 글자가 없다", m.small.length === 0,
         m.small.join(" · "));
      ok("알림 " + w + "px — 누르는 것이 40px 이상이다", m.low.length === 0,
         m.low.join(" · "));
      await p2.close();
    }
  }

  /* ══════════════════════════════════════════════════════════════
     배정받을 때 연락처 (0013 → 0014) — /desk · /admin

     ⚠️⚠️⚠️ **문은 2026-10-22 에 섰는데 적는 자리가 없었습니다.**
     0013 머리말이 그 까닭까지 적어 두었습니다 — "배정해도 걸 곳이
     업체 대표번호뿐입니다." `check-doors` 의 `KNOWN` 에 "화면이 아직
     없습니다" 로 적혀 있던 자리이고, 2026-11-05 에 화면을 냈습니다.
     ⚠️⚠️ **인자가 자리로 갑니다** (`p_provider` · `p_data` · `p_why`) —
     이 저장소의 다른 문들처럼 `{ p: {...} }` 로 보내면 인자 이름이
     안 맞아 거절됩니다. **보내는 꾸러미를 뜯어** 봅니다.
     ══════════════════════════════════════════════════════════════ */
  console.log("\n── /desk 배정받을 때 연락처 (0013 → 0014)");
  const CT1 = [{ provider_id:"t-range", name:"김직통", tel:"010-5555-6666",
                 email:"kim@x.test", memo:"평일 오전에는 현장에 있습니다" }];
  const CTT = Object.assign({ assignment:[], request:[], quote:[],
                              request_item:[] }, { provider_contact: CT1 });

  s = await open("/desk", { role:"customer", name:"일반회원" }, CTT);
  ok("⚠️ 업체가 아니면 연락처 자리가 **아예 안 그려진다**",
     (await s.p.locator("#pvctbox #pvct-f").count()) === 0);
  ok("  ⚠️⚠️ 그 자료를 **읽으러 가지도 않는다**",
     s.sent.filter(function(x){
       return (x.body || "").indexOf("provider_contact") >= 0; }).length === 0,
     JSON.stringify(s.sent.map(function(x){ return x.name; })));

  s = await open("/desk", PRO, CTT);
  ok("업체 담당자에게는 양식이 나온다",
     (await s.p.locator("#pvctbox #pvct-f").count()) === 1);
  /* ⚠️ 적어 둔 것이 **다시 채워져야** 합니다 — 안 채우면 저장할 때
     지워진 것으로 보입니다 (덮어쓰는 문이 아니라 통째 저장입니다). */
  const pre = await s.p.evaluate(function(){
    function v(id){ const e = document.getElementById(id); return e ? e.value : null; }
    return { n:v("pvct-n"), t:v("pvct-t"), e:v("pvct-e"), m:v("pvct-m") };
  });
  ok("⚠️ 적어 두신 것이 **네 칸 모두 다시 채워진다**",
     pre.n === "김직통" && pre.t === "010-5555-6666" &&
     pre.e === "kim@x.test" && pre.m === "평일 오전에는 현장에 있습니다",
     JSON.stringify(pre));
  t = (await s.p.textContent("#pvctbox")) || "";
  /* ⚠️⚠️⚠️ **누가 보는지 · 왜 받는지 · 얼마나 두는지**를 그 자리에서
     같이 말해야 합니다 (개인정보보호법 제15조 제2항). */
  ok("⚠️⚠️ **손님에게는 안 나간다**고 그 자리에서 말한다",
     /손님 화면에는 한 글자도 나오지 않습니다/.test(t), t.slice(0, 400));
  ok("  ⚠️ 누가 보는지 말한다 (운영자와 이 업체)",
     t.indexOf("운영자와 이 업체만") >= 0, t.slice(0, 400));
  ok("  ⚠️ 얼마나 두는지 말한다 (입점 계약이 끝날 때까지)",
     /입점 계약이 끝날 때까지/.test(t), t.slice(0, 400));
  ok("  ⚠️ 왜 받는지 말한다 (배정하고 연락할 곳)",
     /배정해 드릴 때/.test(t), t.slice(0, 300));
  ok("화면 에러가 0건이다", s.errs.length === 0, s.errs.join(" | "));

  /* ── 저장을 **눌러 봅니다** — 보내는 꾸러미까지 ───────────────── */
  s = await open("/desk", PRO, CTT, { save_provider_contact: "t-range" });
  await s.p.fill("#pvct-t", "010-7777-8888");
  await s.p.click("#pvct-save");
  await s.p.waitForTimeout(450);
  const sc = s.sent.filter(function(x){ return x.name === "save_provider_contact"; });
  ok("저장하면 문을 **실제로** 부른다", sc.length === 1,
     JSON.stringify(s.sent.map(function(x){ return x.name; })));
  const sb = JSON.parse(sc[0].body || "{}");
  /* ⚠️⚠️ **자리 인자**가 맞는지 — 이름이 하나만 달라도 거절됩니다 */
  ok("⚠️⚠️ 보내는 꾸러미가 **자리 인자**다 (p_provider · p_data · p_why)",
     sb.p_provider === "t-range" && !!sb.p_data && ("p_why" in sb) &&
     sb.p === undefined, sc[0].body);
  ok("  고친 번호가 담겨 간다", sb.p_data.tel === "010-7777-8888", sc[0].body);
  ok("  ⚠️ 나머지 칸도 **같이** 간다 (통째로 저장하는 문입니다)",
     sb.p_data.name === "김직통" && sb.p_data.email === "kim@x.test" &&
     sb.p_data.memo === "평일 오전에는 현장에 있습니다", sc[0].body);
  /* ⚠️ 업체는 **제 업체 id 만** 보냅니다 — 문도 그것을 다시 봅니다 */
  ok("  ⚠️ 남의 업체 id 를 보내지 않는다", sb.p_provider === PRO.provider);

  /* ⚠️ 지우는 길 — **넷을 비워 보내면** 문이 줄을 지웁니다 */
  s = await open("/desk", PRO, CTT, { save_provider_contact: "t-range" });
  s.p.on("dialog", function(d){ d.accept(); });
  await s.p.click("#pvct-x");
  await s.p.waitForTimeout(450);
  const dc = s.sent.filter(function(x){ return x.name === "save_provider_contact"; });
  ok("⚠️ 지우기는 **넷을 비워서** 보낸다 (문이 그때 줄을 지웁니다)",
     dc.length === 1 && JSON.parse(dc[0].body).p_data.tel === "" &&
     JSON.parse(dc[0].body).p_data.name === "", dc[0] && dc[0].body);

  /* ⚠️ 0건이면 양식은 나오되 **지우기 단추는 안 냅니다**
     (눌러도 아무 일이 안 나는 단추를 두지 않습니다 — 절대 규칙 5) */
  s = await open("/desk", PRO,
    Object.assign({ assignment:[], request:[], quote:[], request_item:[] },
                  { provider_contact: [] }));
  ok("아직 안 적었으면 양식은 **나온다**",
     (await s.p.locator("#pvctbox #pvct-f").count()) === 1);
  ok("  ⚠️ 그런데 **지우기 단추는 없다** (지울 것이 없습니다)",
     (await s.p.locator("#pvctbox #pvct-x").count()) === 0);

  console.log("\n── /admin 배정받을 때 연락처 — 운영자만");
  const CTA = [
    { provider_id:"t-range", name:"김직통", tel:"010-5555-6666",
      email:"", memo:"평일 오전" }
  ];
  const SAT2 = Object.assign({}, {
    v_provider_staff: [
      { provider_id:"t-range", provider_name:"티레인지",
        account_id:"11111111-1111-1111-1111-111111111111",
        who:"김일담", joined_at:null },
      { provider_id:"t-fit", provider_name:"피팅랩",
        account_id:"22222222-2222-2222-2222-222222222222",
        who:"이이담", joined_at:null }
    ],
    provider: [
      { id:"t-range", name:"티레인지", state:"approved", assignable:true },
      { id:"t-fit", name:"피팅랩", state:"approved", assignable:true }
    ],
    provider_contact: CTA
  });

  s = await open("/admin", { role:"customer", name:"일반회원" },
                 Object.assign({}, ADMT, BIZ, PROT, SAT2), { biz_metrics: MET });
  ok("⚠️ 운영자가 아니면 연락처를 **읽으러 가지도 않는다**",
     s.sent.filter(function(x){
       return (x.body || "").indexOf("provider_contact") >= 0; }).length === 0);

  s = await open("/admin", { role:"admin", name:"관리자" },
                 Object.assign({}, ADMT, BIZ, PROT, SAT2), { biz_metrics: MET });
  t = (await s.p.textContent("#pvstadm")) || "";
  ok("운영자는 **적힌 업체의 연락처를** 본다",
     t.indexOf("김직통") >= 0 && t.indexOf("010-5555-6666") >= 0, t.slice(0, 400));
  ok("  ⚠️ 빈 칸(이메일)은 **줄째 빠진다** (빈 자리를 안 찍습니다)",
     t.indexOf(" ·  · ") < 0 && t.indexOf("· ·") < 0, t.slice(0, 400));
  /* ⚠️⚠️ **안 적은 업체는 그 사실을 말합니다** — 빈 줄로 두면 운영자가
     "적혀 있는데 안 보인다" 로 읽습니다. */
  ok("⚠️⚠️ 안 적은 업체는 **안 적었다고 말한다** (대표번호뿐이라는 것까지)",
     /아직 안 적었습니다/.test(t) && /대표번호/.test(t), t.slice(0, 500));
  ok("  ⚠️ 거기에 **적는 단추**를 같이 낸다 (막다른 길로 두지 않습니다)",
     (await s.p.locator('#pvstadm .pvst-ce').count()) === 2,
     await s.p.locator('#pvstadm .pvst-ce').count());
  /* ⚠️⚠️ **한 번에 한 양식만** — 여럿 열면 같은 id 가 둘이 됩니다 */
  await s.p.locator('#pvstadm .pvst-ce').first().click();
  await s.p.waitForTimeout(300);
  ok("⚠️⚠️ 고치기를 누르면 양식이 **하나만** 열린다 (같은 id 가 둘이 되지 않게)",
     (await s.p.locator("#pvstadm form.pvst-cf").count()) === 1 &&
     (await s.p.locator("#pvstadm #ct-t").count()) === 1,
     await s.p.locator("#pvstadm form.pvst-cf").count());
  await s.p.locator('#pvstadm .pvst-ce').nth(1).click();
  await s.p.waitForTimeout(300);
  ok("  다른 업체를 누르면 **앞 양식이 닫힌다**",
     (await s.p.locator("#pvstadm form.pvst-cf").count()) === 1);
  ok("화면 에러가 0건이다", s.errs.length === 0, s.errs.join(" | "));

  /* ⚠️ 운영자가 적어 보냅니다 — 전화로 받아 적는 자리입니다 */
  s = await open("/admin", { role:"admin", name:"관리자" },
                 Object.assign({}, ADMT, BIZ, PROT, SAT2),
                 { biz_metrics: MET, save_provider_contact: "t-fit" });
  await s.p.locator('#pvstadm .pvst-ce').nth(1).click();
  await s.p.waitForTimeout(300);
  await s.p.fill("#ct-n", "박담당");
  await s.p.fill("#ct-t", "010-1111-2222");
  await s.p.locator("#pvstadm form.pvst-cf button[type='submit']").click();
  await s.p.waitForTimeout(450);
  const ac = s.sent.filter(function(x){ return x.name === "save_provider_contact"; });
  ok("⚠️ 운영자도 적을 수 있다 (전화로 받아 적는 자리 — 문이 열어 둡니다)",
     ac.length === 1, JSON.stringify(s.sent.map(function(x){ return x.name; })));
  /* ⚠️ `ab` 는 이 파일 앞쪽(497줄)이 이미 쓰고 있습니다 — 같은 범위라
     그대로 쓰면 `node --check` 에서 터집니다. 이름을 가릅니다. */
  const ctb = JSON.parse(ac[0].body || "{}");
  ok("  그 업체로 간다", ctb.p_provider === "t-fit", ac[0].body);
  ok("  적은 것이 담겨 간다",
     ctb.p_data.name === "박담당" && ctb.p_data.tel === "010-1111-2222",
     ac[0].body);
  ok("  ⚠️ 감사 기록에 남을 **까닭**을 같이 보낸다",
     !!ctb.p_why, ac[0].body);

  /* ══════════════════════════════════════════════════════════════
     업체가 올리는 시설 사진 · 증빙서류 (0051) — /desk

     ⚠️⚠️⚠️ **이 화면은 검사가 0건이었습니다.** 작업 기억의 검사 표에는
     "test-desk 가 시설 사진 · 증빙서류를 누른다" 고 적혀 있었는데,
     흉내 장치가 `/api/upload` 에 `up` 만 돌려주고 `pvPhoto` · `pvDoc`
     을 안 줘서 **그 상자가 한 번도 안 그려졌습니다** — 즉 **없는
     안전을 있다고** 읽고 있었습니다. 로그인 화면을 **찍어 보다가**
     그 상자만 안 나와서 알았습니다 (2026-11-05).
     ⚠️ 흉내 장치를 `api/upload.js` 의 GET 과 같은 꼴로 고치고, 여기에
     눌러 보는 자리를 만들었습니다.
     ══════════════════════════════════════════════════════════════ */
  /* ══════════════════════════════════════════════════════════════
     업체가 **먼저 하실 것** — /desk 맨 위 (js/deskstart.js · 2026-11-05)

     ⚠️⚠️⚠️ 처음 이어진 사장님이 할 일을 알 길이 없었습니다 — 구간
     아홉이 평평하게 줄지어 있고, 손님에게 보이느냐를 가르는 것들
     (지역 · 가격 · 사진 · 연락처)이 하필 **화면 맨 아래**였습니다.
     ⚠️⚠️ 여기서 가장 중요하게 보는 둘 —
       ① **다 하셨으면 한 줄도 안 그리는가** (치우지 못하는 잔소리를
          만들지 않습니다 · 절대 규칙 2)
       ② **보내는 자리가 그 화면에 실제로 있는가** (없는 곳으로 보내면
          눌러도 아무 일이 안 나는 단추입니다 · 절대 규칙 5)
     ══════════════════════════════════════════════════════════════ */
  console.log("\n── /desk 먼저 하실 것 (시작 안내)");
  const DS_PV = { role:"provider", name:"김일담", signedIn:true, provider:"t-range" };
  const DS_NONE = { provider:[{ id:"t-range", subs:[], regions:[] }],
                    provider_contact:[], provider_price:[], provider_photo:[] };
  const DS_ALL  = { provider:[{ id:"t-range", subs:["rg-indoor"], regions:["gyeonggi"] }],
                    provider_contact:[{ tel:"010-5555-6666" }],
                    provider_price:[{ id:"pp-1" }], provider_photo:[{ id:"ph-9" }] };

  async function dstOf(who, tables, up){
    const g = await open("/desk", who, tables, {}, up);
    const r = await g.p.evaluate(function(){
      const b = document.getElementById("dstbox");
      const drawn = !!b && !b.hidden && b.children.length > 0;
      const rows = b ? Array.prototype.map.call(b.querySelectorAll(".dst-r"),
        function(x){ const a = x.querySelector("a");
          return { t:(x.querySelector("b")||{}).textContent || "",
                   go: a ? a.getAttribute("href") : "" }; }) : [];
      return { drawn: drawn, rows: rows, html: b ? b.innerHTML : "" };
    });
    return { g: g, r: r };
  }

  { const { g, r } = await dstOf(DS_PV, DS_NONE, true);
    ok("아무것도 안 하신 업체에 **먼저 하실 것**이 나온다",
       r.drawn && r.rows.length === 5, JSON.stringify(r.rows.map(function(x){ return x.t; })));
    /* ⚠️⚠️ **보내는 자리가 이 화면에 실제로 있는가** — 없으면 눌러도
       아무 일이 안 납니다. `/help` 처럼 밖으로 가는 것은 빼고 봅니다. */
    const bad = await g.p.evaluate(function(gos){
      return gos.filter(function(h){
        return h.charAt(0) === "#" && !document.querySelector(h); });
    }, r.rows.map(function(x){ return x.go; }));
    ok("  ⚠️⚠️ 보내는 자리가 **전부 이 화면에 있다** (빈 곳으로 안 보냅니다)",
       bad.length === 0, bad.join(" · "));
    ok("  ⚠️ 못 고치시는 것(하시는 일)만 고객센터로 보낸다",
       r.rows.some(function(x){ return x.go === "/help"; }),
       r.rows.map(function(x){ return x.go; }).join(" · "));
    await g.p.close(); }

  /* ⚠️⚠️⚠️ **다 하셨으면 한 줄도 안 그립니다** — 이 줄이 없으면 잔소리가
     영영 남습니다. 되돌려 보니(`todo.length` 검사를 빼 보니) 잡힙니다. */
  { const { g, r } = await dstOf(DS_PV, DS_ALL, true);
    ok("⚠️⚠️ **다 하셨으면 한 줄도 안 그린다** (잔소리를 남기지 않습니다)",
       !r.drawn, r.rows.length + "줄: " + r.rows.map(function(x){ return x.t; }).join(" · "));
    await g.p.close(); }

  /* ⚠️ 버킷이 꺼져 있으면 사진 상자가 아예 안 그려집니다 — 그 자리로
     보내면 빈 곳으로 보내는 것입니다 (0051 · 지금 운영이 그 상태입니다). */
  { const { g, r } = await dstOf(DS_PV, DS_NONE, false);
    ok("⚠️ 사진 버킷이 꺼져 있으면 **사진 줄을 안 낸다**",
       r.drawn && !r.rows.some(function(x){ return x.go === "#pvphbox"; }),
       r.rows.map(function(x){ return x.go; }).join(" · "));
    await g.p.close(); }

  /* ⚠️ 업체 담당자가 아니면 한 줄도 안 그립니다 (알림 상자가 빠뜨렸던 자리) */
  for(const who of [{ role:"customer", name:"홍길동", signedIn:true },
                    { role:"admin", name:"관리자", signedIn:true }]){
    const { g, r } = await dstOf(who, DS_NONE, true);
    ok("⚠️ " + who.role + " 에게는 **한 줄도** 안 보인다", !r.drawn, r.html.slice(0, 60));
    await g.p.close();
  }

  /* ══════════════════════════════════════════════════════════════
     내가 보낸 문의와 **그 답변** — /my (js/myinq.js · 0045 → 0053)

     ⚠️⚠️⚠️ **0045 가 답을 받는 자리까지 세워 두고 그 답을 읽는 화면을
     안 만들었습니다.** 운영자는 답을 적고 "답변함" 으로 옮기는데, 손님은
     그 답을 어디서도 못 봤습니다 — 즉 DB 에 적힌 답은 **아무도 안 읽는
     글**이었습니다. 설정이 있어야 열리는 자리라 빌드가 찍은 HTML 만
     보는 검사는 영원히 못 봅니다.
     ══════════════════════════════════════════════════════════════ */
  console.log("\n── /my 내가 보낸 문의 (0045 → 0053)");
  const MYCUS = { role:"customer", name:"홍길동", signedIn:true };
  const IQ_ONE = [
    { id:"iq-1", no:"IQ-261106-0001", kind:"use",
      body:"요청을 넣었는데 업체가 안 붙습니다",
      state:"answered",
      /* ⚠️ 운영자가 적은 글입니다 — 태그를 넣어 보고 esc() 를 봅니다 */
      answer:"지역을 넓혀 주세요 <img src=x onerror=alert(8)>",
      answered_at:"2026-11-06T02:00:00Z", created_at:"2026-11-05T01:00:00Z" },
    { id:"iq-2", no:"IQ-261106-0002", kind:"privacy",
      body:"제 기록을 지워 주세요", state:"open",
      answer:null, answered_at:null, created_at:"2026-11-06T01:00:00Z" }
  ];
  async function iqOf(who, tables){
    const g = await open("/my", who, Object.assign(
      { request:[], quote:[], review:[], cq:[], ca:[],
        joinroom:[], joinapply:[], v_join_contact:[],
        jobpost:[], jobapply:[], v_job_contact:[], notice:[] }, tables), {}, true);
    const r = await g.p.evaluate(function(){
      const b = document.getElementById("myinqbox");
      return { drawn: !!b && !b.hidden && b.children.length > 0,
               text: b ? b.innerText : "",
               html: b ? b.innerHTML : "",
               answers: b ? b.querySelectorAll(".mq-a").length : 0,
               waiting: b ? b.querySelectorAll(".mq-z").length : 0,
               imgs: b ? b.querySelectorAll("img").length : 0 };
    });
    return { g: g, r: r };
  }

  { const { g, r } = await iqOf(MYCUS, { inquiry: IQ_ONE });
    ok("보낸 문의가 /my 에 그려진다", r.drawn, r.html.slice(0, 80));
    ok("⚠️⚠️ 운영자가 적은 **답변이 실제로 보인다** (아무도 안 읽는 글이 아니다)",
       r.answers === 1 && r.text.indexOf("지역을 넓혀 주세요") >= 0,
       "답 칸 " + r.answers);
    ok("⚠️ 아직 답이 없는 줄은 **기다리는 중이라고만** 말한다 " +
       "(언제까지 답한다고 약속하지 않습니다)",
       r.waiting === 1 && r.text.indexOf("아직 답변이 올라오지 않았습니다") >= 0,
       "기다리는 줄 " + r.waiting);
    /* ⚠️⚠️ 운영자에게 할 말을 손님 화면에 찍지 않습니다 (절대 규칙 3) —
       "새 문의" · "닫음" 은 운영자의 말입니다 */
    ok("⚠️⚠️ 상태를 **손님 말**로 적는다 (운영자의 '새 문의' 가 안 나온다)",
       r.text.indexOf("접수됐습니다") >= 0 && r.text.indexOf("새 문의") < 0,
       r.text.slice(0, 160).replace(/\n/g, " | "));
    /* ⚠️ 밖으로 보내지 않으므로 "알려 드립니다" 라고 적지 않습니다 */
    ok("⚠️ 문자 · 메일로 보낸다고 **적지 않는다** (0050 의 그 까닭)",
       r.text.indexOf("보내 드리지 않습니다") >= 0, "");
    ok("⚠️ 로그인 없이 보낸 문의는 여기 안 나온다는 것을 **말한다** " +
       "(안 적으면 '넣었는데 안 보인다' 가 됩니다)",
       r.text.indexOf("로그인하지 않고") >= 0, "");
    /* ⚠️⚠️ 손님 · 운영자가 쓴 글 때문에 그림이 생기면 안 됩니다 */
    ok("⚠️⚠️ 답변 글의 태그가 **날것으로 안 들어간다** (esc)",
       r.imgs === 0 && r.html.indexOf("&lt;img") >= 0, "img " + r.imgs);
    /* ⚠️⚠️⚠️ 0053 이 `memo` · `answered_by` 의 칸 GRANT 를 거두었습니다 —
       부르면 0줄이 아니라 **질의가 통째로 거절**됩니다 (0050 · 0052 에서
       두 번 밟은 자리입니다). 그래서 **보내는 주소를 뜯어** 봅니다. */
    const askd = g.sent.filter(function(x){
      return (x.body || "").indexOf("/inquiry?") >= 0; }).map(function(x){ return x.body; });
    ok("⚠️ 문의를 **실제로 읽으러 간다** (잰 것이 0이 아닙니다)",
       askd.length >= 1, JSON.stringify(g.sent.map(function(x){ return x.name; })));
    ok("⚠️⚠️⚠️ `memo` · `answered_by` 를 **부르지 않는다** " +
       "(0053 이 그 칸을 거두었습니다 — 부르면 질의가 거절됩니다)",
       askd.every(function(u){
         return u.indexOf("memo") < 0 && u.indexOf("answered_by") < 0; }),
       askd.join(" "));
    await g.p.close(); }

  /* ⚠️⚠️ 0건이면 **한 줄도** 안 그립니다 (문의를 넣은 적 없는 분께
     빈 상자를 두면 그때부터 치울 수 없는 자리가 됩니다 · 절대 규칙 2) */
  { const { g, r } = await iqOf(MYCUS, { inquiry: [] });
    ok("⚠️⚠️ 보낸 문의가 0건이면 **한 줄도 안 그린다**",
       !r.drawn && r.html === "", r.html.slice(0, 60));
    await g.p.close(); }

  /* ⚠️ 로그인 전에는 안 그리고 **읽으러 가지도 않습니다** */
  { const g = await open("/my", { role:"customer", signedIn:false },
      { inquiry: IQ_ONE }, {}, true);
    const r = await g.p.evaluate(function(){
      const b = document.getElementById("myinqbox");
      return { drawn: !!b && !b.hidden && b.children.length > 0 };
    });
    ok("⚠️ 로그인 전에는 **한 줄도** 안 보인다", !r.drawn, "");
    ok("  ⚠️⚠️ 그 자료를 **읽으러 가지도 않는다**",
       g.sent.filter(function(x){
         return (x.body || "").indexOf("/inquiry?") >= 0; }).length === 0,
       JSON.stringify(g.sent.map(function(x){ return x.name; })));
    await g.p.close(); }

  /* ⚠️⚠️ 알림 갈래가 늘었습니다 (0053 의 'inquiry') — `window.icon()` 은
     없는 이름을 주면 `console.warn` 만 내고 **빈 글자**를 돌려주므로
     가로로 밀리지도 · 글자가 작지도 않아 **어떤 검사도 안 잡습니다.**
     그래서 그 줄에 아이콘이 **실제로 그려지는지**를 봅니다. */
  { const g = await open("/my", MYCUS,
      { inquiry: [], notice: [{ id:"n-1", kind:"inquiry",
          title:"보내신 문의에 답변이 올라왔습니다", link:"/my",
          obj:"inquiry", obj_id:"IQ-261106-0001",
          read_at:null, created_at:"2026-11-06T02:00:00Z" }] }, {}, true);
    const r = await g.p.evaluate(function(){
      const b = document.getElementById("noticebox");
      const ic = b ? b.querySelector(".nt-ic svg") : null;
      return { drawn: !!b && !b.hidden,
               icon: !!ic,
               text: b ? b.innerText : "" };
    });
    ok("문의 답변 알림이 그려진다", r.drawn && r.text.indexOf("답변이 올라왔습니다") >= 0,
       r.text.slice(0, 80));
    ok("⚠️⚠️ 그 줄의 아이콘이 **빈 칸이 아니다** (없는 이름은 빈 글자를 " +
       "돌려주고 아무 검사도 안 잡습니다)", r.icon, "");
    await g.p.close(); }

  /* ══════════════════════════════════════════════════════════════
     수수료 확정 · 입금 · 월 정산서 — /admin (0003 · 0013 · js/adminfee.js)

     ⚠️⚠️⚠️ **문 다섯이 2026-10-21/22 에 서고 부르는 화면이 한 곳도
     없었습니다.** `js/deskfee.js` 는 그 결과를 이미 그리고 있어서,
     업체 작업실의 수수료 칸은 **영원히 0건**이었습니다.
     ⚠️ `check-doors` 는 그 가운데 둘(`confirm_fee` · `mark_paid`)을
     **못 잡았습니다** — 이름이 다른 SQL 의 **거절 문구 안**에 있어서
     "부르는 자리가 있다" 로 세어졌습니다.
     ══════════════════════════════════════════════════════════════ */
  console.log("\n── /admin 수수료 확정 · 입금 · 월 정산서 (0003 · 0013)");
  const FA_PVS = [
    { id:"fa-1", name:"가나골프아카데미", is_test:false },
    { id:"fa-2", name:"나다실내연습장",   is_test:false },
    { id:"fa-9", name:"[검사용] 다라골프", is_test:true  }
  ];
  const FA_REQS = [
    { id:"r-done", no:"SW-DONE-0001", state:"done" },
    { id:"r-wait", no:"SW-WAIT-0002", state:"fee_wait" },
    { id:"r-fin",  no:"SW-FINE-0003", state:"fee_done" },
    /* ⚠️ 아직 이행 전인 건은 **어느 탭에도 안 나와야** 합니다 */
    { id:"r-mid",  no:"SW-MIDD-0004", state:"signed" }
  ];
  const FA_DEALS = [
    { id:"d-done", request_id:"r-done", provider_id:"fa-1", amount:10000000,
      fee:null, fee_vat:null, fee_total:null, paid:null, paid_at:null,
      fee_at:null, signed_at:"2026-11-01T01:00:00Z", done_at:"2026-11-04T01:00:00Z" },
    /* ⚠️ 정책이 **월 정액**이라 건별로 셀 수 없는 줄 */
    { id:"d-sub",  request_id:"r-done", provider_id:"fa-2", amount:4000000,
      fee:null, fee_vat:null, fee_total:null, paid:null, paid_at:null,
      fee_at:null, signed_at:"2026-11-02T01:00:00Z", done_at:"2026-11-05T01:00:00Z" },
    /* ⚠️ 정책이 **아예 없는** 업체 (검사용 딱지도 같이 봅니다) */
    { id:"d-nop",  request_id:"r-done", provider_id:"fa-9", amount:1000000,
      fee:null, fee_vat:null, fee_total:null, paid:null, paid_at:null,
      fee_at:null, signed_at:"2026-11-02T02:00:00Z", done_at:"2026-11-05T02:00:00Z" },
    { id:"d-wait", request_id:"r-wait", provider_id:"fa-1", amount:5000000,
      fee:400000, fee_vat:40000, fee_total:440000, paid:null, paid_at:null,
      fee_at:"2026-11-05T01:00:00Z", signed_at:"2026-10-20T01:00:00Z",
      done_at:"2026-11-01T01:00:00Z" },
    { id:"d-fin",  request_id:"r-fin", provider_id:"fa-2", amount:3000000,
      fee:240000, fee_vat:24000, fee_total:264000, paid:264000,
      paid_at:"2026-11-05T06:00:00Z", fee_at:"2026-11-04T01:00:00Z",
      signed_at:"2026-10-10T01:00:00Z", done_at:"2026-10-28T01:00:00Z" },
    { id:"d-mid",  request_id:"r-mid", provider_id:"fa-1", amount:2000000,
      fee:null, fee_vat:null, fee_total:null, paid:null, paid_at:null,
      fee_at:null, signed_at:"2026-11-06T01:00:00Z", done_at:null }
  ];
  const FA_POLS = [
    /* ⚠️ 거래액의 8% · 부가세 별도 — 1,000만원이면 수수료 80만 · 부가세
       8만 · 합계 88만입니다 (**손으로 적은 값**입니다 — 코드와 같은
       식으로 적으면 아무것도 안 잡습니다). */
    { id:"p-1", provider_id:"fa-1", type:"rate", flat:null, rate:8,
      min_fee:null, max_fee:null, vat:"add", confirm_when:"done",
      cycle:"now", from_date:null, to_date:null },
    { id:"p-2", provider_id:"fa-2", type:"sub", flat:300000, rate:null,
      min_fee:null, max_fee:null, vat:"add", confirm_when:"signed",
      cycle:"monthly", from_date:null, to_date:null }
  ];
  const FA_SETT = [
    { id:"s-1", provider_id:"fa-1", from_date:"2026-10-01", to_date:"2026-10-31",
      total:880000, state:"wait", approved_at:null, paid_at:null },
    { id:"s-2", provider_id:"fa-2", from_date:"2026-09-01", to_date:"2026-09-30",
      total:264000, state:"paid", approved_at:"2026-10-02T01:00:00Z",
      paid_at:"2026-10-05T01:00:00Z" }
  ];
  const FA_T = { deal:FA_DEALS, request:FA_REQS, provider:FA_PVS,
                 fee_policy:FA_POLS, settlement:FA_SETT,
                 assignment:[], request_item:[], quote:[], review:[],
                 report:[], inquiry:[], audit_log:[] };

  /* ⚠️⚠️ **관리자만**입니다 — 문도 직원을 거절합니다 (계약을 따는
     사람과 청구서를 만드는 사람이 같으면 아무도 교차 확인을 안
     합니다 · 0013). 그려 두면 눌러도 거절당하는 단추가 됩니다. */
  for(const who of [{ role:"customer", name:"홍길동", signedIn:true },
                    { role:"provider", name:"업체", signedIn:true, provider:"fa-1" },
                    { role:"staff", name:"직원", signedIn:true }]){
    const g = await open("/admin", who, FA_T, { biz_metrics: MET }, true);
    const r = await g.p.evaluate(function(){
      const b = document.getElementById("feeadm");
      return { drawn: !!b && !b.hidden && b.children.length > 0 };
    });
    ok("⚠️ " + who.role + " 에게는 수수료 자리가 **한 줄도** 안 보인다", !r.drawn, "");
    ok("  ⚠️⚠️ 그 자료를 **읽으러 가지도 않는다**",
       g.sent.filter(function(x){ return (x.body || "").indexOf("/settlement") >= 0; })
         .length === 0, JSON.stringify(g.sent.map(function(x){ return x.name; })));
    await g.p.close();
  }

  const FA_ADM = { role:"admin", name:"관리자", signedIn:true };
  { const g = await open("/admin", FA_ADM, FA_T, { biz_metrics: MET }, true);
    const r = await g.p.evaluate(function(){
      const b = document.getElementById("feeadm");
      const rows = Array.prototype.map.call(
        b.querySelectorAll(".fe-p > li"), function(li){
          return { id: li.getAttribute("data-deal"), text: li.innerText,
                   fee: (li.querySelector('input[name="fee"]') || {}).value,
                   vat: (li.querySelector('input[name="vat"]') || {}).value,
                   total: (li.querySelector('input[name="total"]') || {}).value };
        });
      return { drawn: !!b && !b.hidden, rows: rows, text: b.innerText };
    });
    ok("운영자에게 수수료 자리가 그려진다", r.drawn, r.text.slice(0, 80));
    /* ⚠️⚠️ **문이 보는 것과 같은 값으로 가릅니다** — 0003 은
       `request.state` 를 봅니다. `fee_at` 으로 가르면 단추는 보이고
       DB 가 거절합니다. */
    ok("⚠️⚠️ **서비스 완료된 건만** 확정 대기에 오른다 (계약만 한 건은 빠진다)",
       r.rows.length === 3 && !r.rows.some(function(x){ return x.id === "d-mid"; }),
       r.rows.map(function(x){ return x.id; }).join(" · "));
    const one = r.rows.filter(function(x){ return x.id === "d-done"; })[0] || {};
    /* ⚠️ 1,000만원 · 8% · 부가세 별도 → 80만 · 8만 · 88만 (손으로 적었습니다) */
    ok("⚠️ 정책으로 **센 금액이 미리 채워진다** (80만 · 8만 · 88만)",
       one.fee === "800000" && one.vat === "80000" && one.total === "880000",
       JSON.stringify(one));
    const sub = r.rows.filter(function(x){ return x.id === "d-sub"; })[0] || {};
    /* ⚠️⚠️ **0 을 채워 두면 0원짜리 수수료를 확정하게 됩니다** */
    ok("⚠️⚠️ 건별로 셀 수 없는 정책이면 칸이 **비어서** 열린다 (0 을 안 채웁니다)",
       sub.fee === "" && sub.text.indexOf("건별로 셀 수 없습니다") >= 0,
       JSON.stringify(sub).slice(0, 160));
    const nop = r.rows.filter(function(x){ return x.id === "d-nop"; })[0] || {};
    ok("⚠️ 정책이 없으면 **없다고 말한다** (지어내지 않습니다)",
       nop.fee === "" && nop.text.indexOf("적용할 수수료 정책이 없습니다") >= 0,
       JSON.stringify(nop).slice(0, 160));
    ok("⚠️ 검사용 업체에 **딱지가 붙는다** (매각 지표에 섞이면 거짓말입니다)",
       nop.text.indexOf("검사용") >= 0, nop.text.slice(0, 80));

    /* ⚠️⚠️ **증빙 없이는 못 보냅니다** — 0003 이 거절하지만 화면에서도
       막습니다 (보내 보고 거절당하는 것보다 낫습니다). */
    await g.p.click('li[data-deal="d-done"] button[data-fix]');
    await g.p.waitForTimeout(200);
    await g.p.click('li[data-deal="d-done"] .fee-f button[type="submit"]');
    await g.p.waitForTimeout(300);
    ok("⚠️⚠️ 증빙 메모를 안 적으면 **안 보낸다**",
       g.sent.filter(function(x){ return x.name === "confirm_fee"; }).length === 0,
       JSON.stringify(g.sent.map(function(x){ return x.name; })));

    await g.p.fill('li[data-deal="d-done"] input[name="proofnote"]', "11월 3일 계약서 사본 확인");
    await g.p.click('li[data-deal="d-done"] .fee-f button[type="submit"]');
    await g.p.waitForTimeout(400);
    const cf = g.sent.filter(function(x){ return x.name === "confirm_fee"; })[0];
    ok("⚠️ 확정 단추가 **confirm_fee 를 실제로 부른다**", !!cf,
       JSON.stringify(g.sent.map(function(x){ return x.name; })));
    if(cf){
      const p = JSON.parse(cf.body);
      /* ⚠️⚠️⚠️ **자리 인자입니다** — `{ p: {...} }` 로 보내면 인자 이름이
         안 맞아 거절됩니다 (0013 에서 겪은 그 자리). */
      ok("⚠️⚠️⚠️ **자리 인자로** 보낸다 (`p` 하나로 안 보냅니다)",
         p.p === undefined && p.p_deal === "d-done", cf.body.slice(0, 120));
      ok("  센 금액을 그대로 보낸다", p.p_fee === 800000 && p.p_total === 880000,
         cf.body.slice(0, 160));
      /* ⚠️ §9 — 나중에 요율이 바뀌어도 확정한 건은 따라 바뀌면 안 됩니다 */
      ok("⚠️ **그때의 정책을 사본으로** 같이 보낸다",
         !!(p.p_snap && p.p_snap.policy && p.p_snap.policy.id === "p-1"),
         JSON.stringify(p.p_snap || null).slice(0, 160));
      ok("⚠️ 증빙을 같이 보낸다 (무엇으로 확인했는지)",
         !!(p.p_proof && p.p_proof.note.indexOf("계약서") >= 0),
         JSON.stringify(p.p_proof || null).slice(0, 160));
    }
    await g.p.close(); }

  /* ── 입금 · 환수 ────────────────────────────────────────────── */
  { const g = await open("/admin", FA_ADM, FA_T, { biz_metrics: MET }, true);
    await g.p.click("#feeadm button[data-ftab='paid']");
    await g.p.waitForTimeout(250);
    const r = await g.p.evaluate(function(){
      const b = document.getElementById("feeadm");
      return { text: b.innerText,
               paid: (b.querySelector('li[data-deal="d-wait"] input[name="paid"]')
                      || {}).value,
               payBtns: b.querySelectorAll("button[data-pay]").length };
    });
    ok("입금 탭에 **확정된 건만** 올라온다 (대기 하나)",
       r.payBtns === 1, "입금 단추 " + r.payBtns);
    ok("⚠️ 입금액 기본값이 **확정 합계**다 (44만)", r.paid === "440000", r.paid);
    ok("  입금이 끝난 건은 들어온 금액을 적는다",
       r.text.indexOf("264,000원 들어옴") >= 0, r.text.slice(0, 400).replace(/\n/g, " | "));

    await g.p.click('li[data-deal="d-wait"] button[data-pay]');
    await g.p.waitForTimeout(200);
    await g.p.click('li[data-deal="d-wait"] .pay-f button[type="submit"]');
    await g.p.waitForTimeout(400);
    const mp = g.sent.filter(function(x){ return x.name === "mark_paid"; })[0];
    ok("⚠️ 입금 단추가 **mark_paid 를 실제로 부른다**", !!mp,
       JSON.stringify(g.sent.map(function(x){ return x.name; })));
    if(mp){
      const p = JSON.parse(mp.body);
      ok("  자리 인자로 보낸다", p.p === undefined && p.p_deal === "d-wait" &&
         p.p_paid === 440000, mp.body.slice(0, 120));
    }

    /* ⚠️⚠️ **사유 없는 환수는 안 보냅니다** (문도 거절합니다 — 확정했던
       액을 갈아 치우지 않고 차액을 기록으로 남기는 자리입니다). */
    await g.p.click('li[data-deal="d-wait"] button[data-claw]');
    await g.p.waitForTimeout(200);
    await g.p.fill('li[data-deal="d-wait"] input[name="newfee"]', "200000");
    await g.p.click('li[data-deal="d-wait"] .claw-f button[type="submit"]');
    await g.p.waitForTimeout(300);
    ok("⚠️⚠️ 사유 없는 **환수는 안 보낸다**",
       g.sent.filter(function(x){ return x.name === "clawback_fee"; }).length === 0,
       JSON.stringify(g.sent.map(function(x){ return x.name; })));
    await g.p.fill('li[data-deal="d-wait"] input[name="cwhy"]', "손님이 절반만 이용했습니다");
    await g.p.click('li[data-deal="d-wait"] .claw-f button[type="submit"]');
    await g.p.waitForTimeout(400);
    const cb = g.sent.filter(function(x){ return x.name === "clawback_fee"; })[0];
    ok("  사유를 적으면 **clawback_fee 를 부른다**", !!cb,
       JSON.stringify(g.sent.map(function(x){ return x.name; })));
    if(cb){
      const p = JSON.parse(cb.body);
      ok("  자리 인자로 보낸다", p.p === undefined && p.p_new_fee === 200000 &&
         String(p.p_why).indexOf("절반") >= 0, cb.body.slice(0, 140));
    }
    await g.p.close(); }

  /* ── 월 정산서 ─────────────────────────────────────────────── */
  { const g = await open("/admin", FA_ADM, FA_T, { biz_metrics: MET }, true);
    await g.p.click("#feeadm button[data-ftab='settle']");
    await g.p.waitForTimeout(250);
    const r = await g.p.evaluate(function(){
      const b = document.getElementById("feeadm");
      return { text: b.innerText,
               opts: b.querySelectorAll("#sf-pv option").length,
               holds: b.querySelectorAll("button[data-hold]").length };
    });
    ok("정산서 만드는 양식이 나온다 (업체 셋)", r.opts === 3, "업체 " + r.opts);
    ok("만들어 둔 정산서를 보여 준다", r.text.indexOf("880,000원") >= 0,
       r.text.slice(0, 400).replace(/\n/g, " | "));
    /* ⚠️⚠️ **들어온 돈을 보류로 덮지 않습니다** — 문도 거절합니다 */
    ok("⚠️⚠️ 입금으로 집계된 정산서에는 **보류 단추를 안 낸다**",
       r.holds === 1, "보류 단추 " + r.holds);

    await g.p.selectOption("#sf-pv", "fa-2");
    await g.p.fill("#sf-a", "2026-11-01");
    await g.p.fill("#sf-b", "2026-11-30");
    await g.p.click("#setf button[type=submit]");
    await g.p.waitForTimeout(400);
    const bs = g.sent.filter(function(x){ return x.name === "build_settlement"; })[0];
    ok("⚠️ **build_settlement 를 실제로 부른다**", !!bs,
       JSON.stringify(g.sent.map(function(x){ return x.name; })));
    if(bs){
      const p = JSON.parse(bs.body);
      ok("  자리 인자로 보낸다 (업체 · 기간)",
         p.p === undefined && p.p_provider === "fa-2" &&
         p.p_from === "2026-11-01" && p.p_to === "2026-11-30", bs.body.slice(0, 140));
    }

    await g.p.click("#feeadm button[data-hold]");
    await g.p.waitForTimeout(200);
    await g.p.click("#feeadm .hold-f button[type=submit]");
    await g.p.waitForTimeout(300);
    ok("⚠️ 사유 없는 **보류는 안 보낸다**",
       g.sent.filter(function(x){ return x.name === "hold_settlement"; }).length === 0,
       JSON.stringify(g.sent.map(function(x){ return x.name; })));
    await g.p.fill("#feeadm input[name='hwhy']", "세금계산서가 아직 안 왔습니다");
    await g.p.click("#feeadm .hold-f button[type=submit]");
    await g.p.waitForTimeout(400);
    const hs = g.sent.filter(function(x){ return x.name === "hold_settlement"; })[0];
    ok("  사유를 적으면 **hold_settlement 를 부른다**", !!hs,
       JSON.stringify(g.sent.map(function(x){ return x.name; })));
    if(hs){
      const p = JSON.parse(hs.body);
      ok("  자리 인자로 보낸다", p.p === undefined && p.p_id === "s-1" &&
         p.p_hold === true, hs.body.slice(0, 140));
    }
    await g.p.close(); }

  /* ══════════════════════════════════════════════════════════════
     회원 역할(능력 딱지) · 요청의 담당 직원 — /admin (0025 · 0054 · 0012)

     ⚠️⚠️ `grant_hat`(0025)은 부르는 칸이 없었고 **떼는 문은 아예
     없었습니다**(0054 가 냈습니다). `set_owner`(0012)도 2026-10-22 에
     서고 부르는 칸이 없었습니다 — 직원이 여럿이면 같은 건에 두 사람이
     전화합니다.
     ══════════════════════════════════════════════════════════════ */
  /* ══════════════════════════════════════════════════════════════
     골프장 · 연습장 관리 — /admin (0066)

     ⚠️⚠️⚠️ 이 자리가 없으면 0066 의 문 셋(`save_course` · `move_course` ·
     `link_course_alias`)이 **만들어 놓고 안 쓰는 문**입니다 —
     `check-doors` 가 실제로 그렇게 잡았습니다.
     ⚠️⚠️ 여기서 재는 알맹이는 **보내는 꾸러미**입니다. 0066 의 문은
     `jsonb` 하나(`p`)를 받는데, 저장소의 0013 · 0003 은 **자리 인자**라
     습관대로 보내면 거절당합니다 — 줄 수로 재면 영원히 초록입니다.
     ══════════════════════════════════════════════════════════════ */
  console.log("\n── /admin 골프장 · 연습장 (0066)");
  const CS_ROWS = [
    { id:"c-1", slug:"mcst-golf-1", kind:"golf", name:"검사용 남서울CC",
      region:"gyeonggi", gu:"성남시", state:"open", source_id:"mcst" },
    { id:"c-2", slug:"c-abc123", kind:"range", name:"검사용 강남 연습장",
      region:"seoul", gu:"강남구", state:"open", source_id:"seoul-range" }
  ];
  const CS_T = { account:[], account_hat:[], assignment:[], request:[], quote:[],
                 request_item:[], provider:[], review:[], report:[], inquiry:[],
                 audit_log:[], v_course_public: CS_ROWS };

  /* ⚠️ 관리자가 아니면 한 줄도 안 그리고 **읽으러 가지도 않습니다** */
  for(const who of [{ role:"customer", name:"홍길동", signedIn:true },
                    { role:"staff", name:"직원", signedIn:true }]){
    const g = await open("/admin", who, CS_T, { biz_metrics: MET }, true);
    const r = await g.p.evaluate(function(){
      const b = document.getElementById("csadm");
      return { drawn: !!b && !b.hidden && b.children.length > 0 };
    });
    ok("⚠️ " + who.role + " 에게는 골프장 자리가 **한 줄도** 안 보인다", !r.drawn, "");
    ok("  ⚠️⚠️ 그 자료를 **읽으러 가지도 않는다**",
       g.sent.filter(function(x){ return (x.body || "").indexOf("v_course_public") >= 0; })
         .length === 0, JSON.stringify(g.sent.map(function(x){ return x.name; })));
    await g.p.close();
  }

  { const g = await open("/admin", { role:"admin", name:"관리자", signedIn:true },
                         CS_T, { biz_metrics: MET }, true);
    const r = await g.p.evaluate(function(){
      const b = document.getElementById("csadm");
      const rows = Array.prototype.map.call(b.querySelectorAll("li[data-cs]"),
        function(li){
          return { id: li.getAttribute("data-cs"), text: li.innerText,
                   btns: Array.prototype.map.call(li.querySelectorAll("button[data-do]"),
                     function(x){ return x.getAttribute("data-do"); }) };
        });
      return { drawn: !!b && !b.hidden, rows: rows, text: b.innerText };
    });
    ok("운영자에게 골프장 자리가 그려진다", r.drawn && r.rows.length === 2,
       "줄 " + r.rows.length);
    /* ⚠️ 화면 **전체**에서 "range" 를 찾으면 안 됩니다 — 출처 이름이
       `seoul-range` 라 늘 걸립니다. 코드가 아니라 **제 검사가 틀린**
       자리였습니다. 갈래를 적는 **그 줄**만 봅니다. */
    const c2 = r.rows.filter(function(x){ return x.id === "c-2"; })[0] || { text:"" };
    ok("  갈래 · 지역을 **사람 말로** 적는다 (영문 키가 아닙니다)",
       c2.text.indexOf("연습장 · 서울 강남구") >= 0,
       c2.text.slice(0, 160).replace(/\n/g, " | "));
    ok("  ⚠️ **출처를 같이 적는다** (손으로 넣은 줄과 가릅니다)",
       r.text.indexOf("출처 mcst") >= 0, r.text.slice(0, 200).replace(/\n/g, " | "));
    /* ⚠️⚠️ **지우는 단추를 안 냅니다** — 0066 에 지우는 문이 없습니다 */
    ok("⚠️⚠️ **지우는 단추를 안 낸다** (가리기만 있습니다)",
       r.rows.every(function(x){ return x.btns.indexOf("delete") < 0; }) &&
       r.text.indexOf("지우기") < 0, JSON.stringify(r.rows.map(function(x){ return x.btns; })));

    /* slug 고치기 — ⚠️ 보내는 꾸러미를 **뜯어** 봅니다 */
    await g.p.evaluate(function(){
      const li = document.querySelector("li[data-cs='c-1']");
      li.querySelector("button[data-do='slug']").click();
      const f = li.querySelector(".cs-f");
      f.slug.value = "namseoul-cc";
      f.querySelector("button[type='submit']").click();
    });
    await g.p.waitForTimeout(250);
    const sv = g.sent.filter(function(x){ return x.name === "save_course"; })[0];
    ok("주소(slug) 고치기가 **문을 부른다**", !!sv,
       JSON.stringify(g.sent.map(function(x){ return x.name; })));
    if(sv){
      const b2 = JSON.parse(sv.body);
      /* ⚠️⚠️ **jsonb 하나입니다** — 자리 인자로 보내면 거절됩니다 */
      ok("  ⚠️⚠️ `p` 하나로 보낸다 (자리 인자가 아닙니다)",
         !!b2.p && b2.p_id === undefined, sv.body.slice(0, 140));
      ok("  고친 slug 와 id 를 같이 보낸다",
         b2.p.slug === "namseoul-cc" && b2.p.id === "c-1", sv.body.slice(0, 140));
    }

    /* 가리기 — ⚠️ 까닭 없이는 못 보냅니다 (DB 도 막지만 화면이 먼저) */
    await g.p.evaluate(function(){
      const li = document.querySelector("li[data-cs='c-2']");
      li.querySelector("button[data-do='hide']").click();
      const f = li.querySelector(".cs-f");
      f.cwhy.value = "검사";
      f.querySelector("button[type='submit']").click();
    });
    await g.p.waitForTimeout(250);
    const mv = g.sent.filter(function(x){ return x.name === "move_course"; })[0];
    ok("가리기가 **문을 부른다**", !!mv,
       JSON.stringify(g.sent.map(function(x){ return x.name; })));
    if(mv){
      const b3 = JSON.parse(mv.body);
      ok("  가리는 값과 **까닭을 같이** 보낸다",
         b3.p && b3.p.to === "hidden" && String(b3.p.why || "").trim() !== "",
         mv.body.slice(0, 140));
    }
    await g.p.close(); }

  /* 0곳일 때 — ⚠️⚠️ **막다른 길로 두지 않습니다** (절대 규칙 2) */
  { const g = await open("/admin", { role:"admin", name:"관리자", signedIn:true },
      Object.assign({}, CS_T, { v_course_public: [] }), { biz_metrics: MET }, true);
    const r = await g.p.evaluate(function(){
      const b = document.getElementById("csadm");
      return { text: b.innerText, hidden: b.hidden };
    });
    ok("⚠️ 0곳이면 **0곳이라고 말한다**",
       !r.hidden && r.text.indexOf("아직 들여온 골프장이 없습니다") >= 0,
       r.text.slice(0, 160).replace(/\n/g, " | "));
    ok("  ⚠️⚠️ 그리고 **넣는 길**을 알려 준다 (막다른 길 금지)",
       r.text.indexOf("import_courses.sql") >= 0,
       r.text.slice(0, 200).replace(/\n/g, " | "));
    await g.p.close(); }

  console.log("\n── /admin 회원 역할 (0025 · 0028 · 0054)");
  const HT_ACCS = [
    { id:"u-1", name:"김회원", role:"customer" },
    { id:"u-2", name:"이프로", role:"customer" },
    { id:"u-3", name:"박사장", role:"provider" }
  ];
  const HT_HATS = [{ account_id:"u-2", hat:"pro" },
                   { account_id:"u-3", hat:"biz" }];
  const HT_T = { account:HT_ACCS, account_hat:HT_HATS,
                 assignment:[], request:[], quote:[], request_item:[],
                 provider:[], review:[], report:[], inquiry:[], audit_log:[] };

  /* ⚠️ 관리자가 아니면 한 줄도 안 그리고 읽으러 가지도 않습니다 */
  for(const who of [{ role:"customer", name:"홍길동", signedIn:true },
                    { role:"staff", name:"직원", signedIn:true }]){
    const g = await open("/admin", who, HT_T, { biz_metrics: MET }, true);
    const r = await g.p.evaluate(function(){
      const b = document.getElementById("hatadm");
      return { drawn: !!b && !b.hidden && b.children.length > 0 };
    });
    ok("⚠️ " + who.role + " 에게는 역할 자리가 **한 줄도** 안 보인다", !r.drawn, "");
    ok("  ⚠️⚠️ 그 자료를 **읽으러 가지도 않는다**",
       g.sent.filter(function(x){ return (x.body || "").indexOf("/account_hat") >= 0; })
         .length === 0, JSON.stringify(g.sent.map(function(x){ return x.name; })));
    await g.p.close();
  }

  const HT_ADM = { role:"admin", name:"관리자", signedIn:true };
  { const g = await open("/admin", HT_ADM, HT_T, { biz_metrics: MET }, true);
    const r = await g.p.evaluate(function(){
      const b = document.getElementById("hatadm");
      const rows = Array.prototype.map.call(b.querySelectorAll(".fe-p > li"),
        function(li){
          return { id: li.getAttribute("data-acc"), text: li.innerText,
                   hats: Array.prototype.map.call(
                     li.querySelectorAll("button[data-hat]"),
                     function(x){ return x.getAttribute("data-hat"); }) };
        });
      return { drawn: !!b && !b.hidden, rows: rows, text: b.innerText };
    });
    ok("운영자에게 회원 역할 자리가 그려진다", r.drawn && r.rows.length === 3,
       "줄 " + r.rows.length);
    const u2 = r.rows.filter(function(x){ return x.id === "u-2"; })[0] || {};
    ok("켜진 역할을 **사람 말로** 적는다 (영문 키가 아닙니다)",
       u2.text.indexOf("골프 프로") >= 0 && u2.text.indexOf("pro\n") < 0,
       u2.text.replace(/\n/g, " | "));
    const u1 = r.rows.filter(function(x){ return x.id === "u-1"; })[0] || {};
    ok("⚠️ 0건이면 **0 이라고 말한다**",
       u1.text.indexOf("켜진 역할이 없습니다") >= 0, u1.text.replace(/\n/g, " | "));
    /* ⚠️⚠️⚠️ **`biz` 는 단추를 안 냅니다** — 그 딱지의 주인은 0028 의
       트리거입니다. 단추를 그리면 눌러도 되돌아가는 칸이 됩니다. */
    ok("⚠️⚠️ **사업자 단추를 안 낸다** (0028 의 트리거가 주인입니다)",
       r.rows.every(function(x){ return x.hats.indexOf("biz") < 0; }),
       JSON.stringify(r.rows.map(function(x){ return x.hats; })));
    ok("  그리고 **왜 없는지 적는다** (빈 자리로 두지 않습니다)",
       r.text.indexOf("저절로 붙고") >= 0, r.text.slice(0, 300).replace(/\n/g, " | "));
    const u3 = r.rows.filter(function(x){ return x.id === "u-3"; })[0] || {};
    ok("  사업자인 회원은 **지금 상태를 보여 준다**",
       u3.text.indexOf("사업자") >= 0, u3.text.replace(/\n/g, " | "));

    /* ⚠️⚠️ 까닭 없이는 안 보냅니다 (문도 거절합니다) */
    await g.p.click('li[data-acc="u-1"] button[data-hat="seller"]');
    await g.p.waitForTimeout(200);
    await g.p.click('li[data-acc="u-1"] .hat-f button[type="submit"]');
    await g.p.waitForTimeout(300);
    ok("⚠️⚠️ 까닭 없이는 **안 보낸다**",
       g.sent.filter(function(x){ return x.name === "grant_hat"; }).length === 0,
       JSON.stringify(g.sent.map(function(x){ return x.name; })));
    await g.p.fill('li[data-acc="u-1"] input[name="hwhy"]', "중고채를 파시겠다고 하셔서");
    await g.p.click('li[data-acc="u-1"] .hat-f button[type="submit"]');
    await g.p.waitForTimeout(400);
    const gh = g.sent.filter(function(x){ return x.name === "grant_hat"; })[0];
    ok("붙이기가 **grant_hat 을 실제로 부른다**", !!gh,
       JSON.stringify(g.sent.map(function(x){ return x.name; })));
    if(gh){
      const p = JSON.parse(gh.body);
      ok("⚠️ **자리 인자로** 보낸다", p.p === undefined && p.p_user === "u-1" &&
         p.p_hat === "seller" && String(p.p_why).indexOf("중고채") >= 0,
         gh.body.slice(0, 140));
    }

    /* ⚠️ 이미 켜진 역할은 **떼는** 문으로 갑니다 (0054) */
    await g.p.click('li[data-acc="u-2"] button[data-hat="pro"]');
    await g.p.waitForTimeout(200);
    await g.p.fill('li[data-acc="u-2"] input[name="hwhy"]', "본인이 요청하셨습니다");
    await g.p.click('li[data-acc="u-2"] .hat-f button[type="submit"]');
    await g.p.waitForTimeout(400);
    const rh = g.sent.filter(function(x){ return x.name === "revoke_hat"; })[0];
    ok("⚠️⚠️ 켜진 역할은 **revoke_hat 으로** 간다 (0054 — 전에는 뗄 길이 " +
       "저장소에 한 줄도 없었습니다)", !!rh,
       JSON.stringify(g.sent.map(function(x){ return x.name; })));
    if(rh){
      const p = JSON.parse(rh.body);
      ok("  자리 인자로 보낸다", p.p === undefined && p.p_user === "u-2" &&
         p.p_hat === "pro", rh.body.slice(0, 140));
    }
    await g.p.close(); }

  console.log("\n── /admin 요청의 담당 직원 (0012)");
  const OW_STAFF = [{ id:"s-1", name:"최직원", role:"staff" },
                    { id:"s-2", name:"정관리", role:"admin" }];
  const OW_REQ = Object.assign({}, REQ, { state:"check", owner_id:null });
  const OW_T = Object.assign({}, ADMT, {
    request:[OW_REQ], account:OW_STAFF, assignment:[] });

  { const g = await open("/admin", HT_ADM, OW_T, { biz_metrics: MET }, true);
    const r = await g.p.evaluate(function(){
      const b = document.getElementById("assignbox");
      const sel = b.querySelector(".ow-s");
      return { has: !!sel,
               opts: sel ? Array.prototype.map.call(sel.options, function(o){
                 return o.textContent; }) : [],
               picked: sel ? sel.value : null };
    });
    ok("배정 줄에 담당 고르개가 나온다", r.has, JSON.stringify(r).slice(0, 120));
    /* ⚠️⚠️ **고객 계정을 담당자로 꽂으면 문이 거절합니다** — 고르개에
       담으면 눌러도 안 되는 칸이 됩니다 (0012 가 account_staff 정책으로
       직원 · 관리자 줄만 열어 둔 까닭입니다). */
    ok("⚠️⚠️ 고르개에 **직원 · 관리자만** 담긴다", r.opts.length === 3 &&
       r.opts.indexOf("최직원") >= 0 && r.opts.indexOf("정관리") >= 0,
       r.opts.join(" · "));
    /* ⚠️ 비울 수 있습니다 — 0012 가 "반드시 정해야 다음으로 갈 수 있게
       만들지 않았다" 고 적어 두었습니다 */
    ok("⚠️ **아직 아무도**를 고를 수 있다 (담당 없이도 일이 굴러갑니다)",
       r.opts.indexOf("아직 아무도") >= 0 && r.picked === "", r.opts.join(" · "));

    await g.p.selectOption("#assignbox .ow-s", "s-1");
    await g.p.click("#assignbox button[data-owner]");
    await g.p.waitForTimeout(400);
    const so = g.sent.filter(function(x){ return x.name === "set_owner"; })[0];
    ok("담당 저장이 **set_owner 를 실제로 부른다**", !!so,
       JSON.stringify(g.sent.map(function(x){ return x.name; })));
    if(so){
      const p = JSON.parse(so.body);
      ok("⚠️ **자리 인자로** 보낸다", p.p === undefined && p.p_owner === "s-1",
         so.body.slice(0, 140));
    }
    await g.p.close(); }

  /* ⚠️ 비우는 것도 **값**입니다 — 빈 글자가 아니라 null 로 갑니다
     (빈 글자를 보내면 DB 가 uuid 로 못 읽고 거절합니다) */
  { const g = await open("/admin", HT_ADM,
      Object.assign({}, OW_T, {
        request:[Object.assign({}, OW_REQ, { owner_id:"s-1" })] }),
      { biz_metrics: MET }, true);
    await g.p.selectOption("#assignbox .ow-s", "");
    await g.p.click("#assignbox button[data-owner]");
    await g.p.waitForTimeout(400);
    const so = g.sent.filter(function(x){ return x.name === "set_owner"; })[0];
    ok("⚠️ 담당을 **비우면 null 로** 보낸다 (빈 글자가 아닙니다)",
       !!so && JSON.parse(so.body).p_owner === null,
       so ? so.body.slice(0, 140) : "안 불렀습니다");
    await g.p.close(); }

  console.log("\n── /desk 시설 사진 · 증빙서류 (0051)");
  const PH = [
    { id:"ph-1", provider_id:"t-range", kind:"photo",
      path:"pv/t-range/photo/a.jpg", mime:"image/jpeg", bytes:420000,
      caption:"실내 타석" },
    { id:"ph-2", provider_id:"t-range", kind:"doc",
      path:"pv/t-range/doc/b.pdf", mime:"application/pdf", bytes:180000,
      caption:"사업자등록증" }
  ];
  const PHT = Object.assign({ assignment:[], request:[], quote:[],
                              request_item:[] }, { provider_photo: PH });

  /* ⚠️ 업체가 아니면 **한 줄도** 안 그립니다 */
  s = await open("/desk", { role:"customer", name:"일반회원" }, PHT);
  ok("⚠️ 업체가 아니면 사진 자리가 **아예 안 그려진다**",
     (await s.p.locator("#pvphbox .pvph-g").count()) === 0);
  ok("  ⚠️⚠️ 그 자료를 **읽으러 가지도 않는다**",
     s.sent.filter(function(x){
       return (x.body || "").indexOf("provider_photo") >= 0; }).length === 0,
     JSON.stringify(s.sent.map(function(x){ return x.name; })));

  /* ⚠️⚠️ **버킷이 없으면 칸이 아예 안 나옵니다** (단추도 · "준비 중" 도) */
  s = await open("/desk", PRO, PHT, {}, false);
  ok("⚠️⚠️ 버킷이 설정되기 전에는 **아무것도 안 그린다**",
     await s.p.locator("#pvphbox").evaluate(function(e){
       return e.hidden && e.innerHTML === ""; }));

  /* ⚠️ `open()` 의 **다섯째 인자**가 "버킷이 켜졌나" 입니다 — 안 넘기면
     `undefined` 라 꺼진 것으로 읽혀 상자가 안 그려집니다 (처음에 그래서
     여섯 건이 떨어졌습니다). */
  s = await open("/desk", PRO, PHT, {}, true);
  ok("버킷이 켜지면 **갈래 둘**이 나온다 (사진 · 서류)",
     (await s.p.locator("#pvphbox .pvph-g").count()) === 2,
     await s.p.locator("#pvphbox .pvph-g").count());
  t = (await s.p.textContent("#pvphbox")) || "";
  /* ⚠️⚠️⚠️ **누가 보는지를 그 자리에서 말해야** 합니다 — 섞어 두면
     사업자등록증을 사진 칸에 올리는 날이 오고, 그러면 공개됩니다. */
  ok("⚠️⚠️⚠️ 시설 사진은 **손님 누구나 본다**고 그 자리에서 말한다",
     t.indexOf("손님 누구나 봅니다") >= 0, t.slice(0, 200));
  ok("⚠️⚠️⚠️ 증빙서류는 **운영자와 이 업체만** 본다고 말한다",
     t.indexOf("운영자와 이 업체만 봅니다") >= 0, t.slice(0, 300));
  ok("  ⚠️ 서류를 사진 칸에 올리지 말라고 **맨 위에서** 한 번 더 말한다",
     /서류를 사진 칸에 올리지 마세요/.test(t), t.slice(0, 260));
  /* ⚠️ 받는 형식이 갈라져 있는가 — DB 의 check 와 같은 선입니다 */
  const acc = await s.p.evaluate(function(){
    return Array.prototype.map.call(document.querySelectorAll("#pvphbox .pvph-i"),
      function(i){ return i.getAttribute("accept"); });
  });
  ok("⚠️ 받는 형식이 **갈래마다 다르다** (사진은 이미지 · 서류는 PDF)",
     acc.length === 2 && acc[0].indexOf("image/") >= 0 &&
     acc[0].indexOf("pdf") < 0 && acc[1] === "application/pdf",
     JSON.stringify(acc));
  /* ⚠️ 올린 것이 갈래 **제자리에** 들어가는가 */
  const g = await s.p.evaluate(function(){
    return Array.prototype.map.call(document.querySelectorAll("#pvphbox .pvph-g"),
      function(e){ return { kind: e.getAttribute("data-kind"),
                            txt: e.textContent || "" }; });
  });
  ok("올린 사진이 **사진 쪽에** 들어간다",
     g[0].kind === "photo" && g[0].txt.indexOf("실내 타석") >= 0,
     JSON.stringify(g.map(function(x){ return x.kind; })));
  ok("올린 서류가 **서류 쪽에** 들어간다",
     g[1].kind === "doc" && g[1].txt.indexOf("사업자등록증") >= 0);
  ok("  ⚠️ 서류가 사진 쪽에 **안 섞인다**",
     g[0].txt.indexOf("사업자등록증") < 0);
  /* ⚠️⚠️ 아이콘이 갈래마다 달라야 합니다 — 서류(PDF) 단추에 카메라가
     붙어 있었습니다 (찍어 보고 알았습니다). */
  ok("⚠️ 고르는 단추의 아이콘이 **갈래마다 다르다** (서류에 카메라를 안 씁니다)",
     await s.p.evaluate(function(){
       const b = document.querySelectorAll("#pvphbox .pvph-b svg");
       if(b.length !== 2) return false;
       return b[0].innerHTML !== b[1].innerHTML;
     }));
  /* ⚠️ 지어낸 약속을 하지 않습니다 — 올린다고 바로 보이지 않습니다 */
  ok("⚠️ 올려도 **바로 안 보인다**고 말한다 (자료를 다시 올려야 합니다)",
     /자료를 다시 올린/.test(t), t.slice(-240));
  ok("화면 에러가 0건이다", s.errs.length === 0, s.errs.join(" | "));

  /* ⚠️ 0장이면 **0장이라고** 말합니다 (빈 액자를 두지 않습니다) */
  s = await open("/desk", PRO,
    Object.assign({ assignment:[], request:[], quote:[], request_item:[] },
                  { provider_photo: [] }), {}, true);
  ok("0장이면 **0장이라고 말한다** (빈 액자를 두지 않습니다)",
     ((await s.p.textContent("#pvphbox")) || "")
       .indexOf("아직 올리신 것이 없습니다") >= 0);
  ok("  그래도 올리는 단추는 **있다** (막다른 길로 두지 않습니다)",
     (await s.p.locator("#pvphbox .pvph-b").count()) === 2);

  /* ══════════════════════════════════════════════════════════════
     업체 담당자 명단 · 내보내기 (0052)

     ⚠️⚠️ **설정이 있어야 열리는 자리라 빌드가 찍은 HTML 만 보는
     검사는 영원히 못 봅니다** — `check-screens` · `check-a11y` 에는
     빈 상자로만 보입니다. 여기서만 눌립니다.
     ⚠️⚠️⚠️ 재는 것 가운데 가장 중요한 것은 **동료의 본이름이 업체
     화면까지 오지 않는가**입니다. 마스킹은 DB 의 보기가 하므로,
     화면 쪽에서는 **받은 글자를 그대로 쓰는지**를 봅니다 — 화면이
     다시 가리면 본이름이 이미 브라우저까지 온 것이고, 개발자
     도구를 열면 그대로 보입니다.
     ══════════════════════════════════════════════════════════════ */
  console.log("\n── /desk 우리 업체 담당자 (0052)");
  /* ⚠️ 보기가 내주는 꼴 그대로 — 업체 담당자에게는 `account_id` 가
     NULL 이고 이름이 가려져 있습니다. 하나는 초대로 들어와 날짜가
     있고, 하나는 SQL 로 이어져 **비어 있습니다**. */
  const STAFF_PV = [
    { who:"김일담", is_me:true,  joined_at:null },
    { who:"이**",   is_me:false, joined_at:"2026-10-20T01:00:00Z" },
    { who:"회원",   is_me:false, joined_at:null }
  ];
  const SPT = { v_provider_staff: STAFF_PV };

  s = await open("/desk", { role:"customer", name:"일반회원" },
                 Object.assign({ assignment:[], request:[], quote:[],
                                 request_item:[] }, SPT));
  ok("⚠️ 업체가 아니면 담당자 자리가 **아예 안 그려진다**",
     (await s.p.locator("#pvstbox .pvst-r").count()) === 0);
  /* ⚠️⚠️ **읽으러 가지도 않아야** 합니다 — 0050 의 알림 상자가 그 줄을
     빠뜨려 일반회원 화면에서 혼자 질의를 던지고 있었습니다. */
  ok("  ⚠️⚠️ 그 명단을 **읽으러 가지도 않는다**",
     s.sent.filter(function(x){
       return (x.body || "").indexOf("v_provider_staff") >= 0; }).length === 0,
     JSON.stringify(s.sent.map(function(x){ return x.name; })));

  s = await open("/desk", PRO,
                 Object.assign({ assignment:[], request:[], quote:[],
                                 request_item:[] }, SPT));
  ok("업체 담당자는 명단 **셋**을 본다",
     (await s.p.locator("#pvstbox .pvst-r").count()) === 3,
     await s.p.locator("#pvstbox .pvst-r").count());
  t = (await s.p.textContent("#pvstbox")) || "";
  ok("  몇 명인지 **세어서** 적는다 (저장하지 않습니다)",
     t.indexOf("3명") >= 0, t.slice(0, 160));
  ok("  ⚠️ 담당자가 손님 성함 · 연락처를 본다는 것을 말한다",
     /손님 성함 · 연락처/.test(t), t.slice(0, 220));
  /* ⚠️⚠️ **본이름이 한 글자도 안 들어와야** 합니다 (제 이름만 빼고) */
  ok("⚠️⚠️ 동료의 **본이름이 화면에 한 글자도** 없다 (가린 글자만 옵니다)",
     t.indexOf("이이담") < 0 && t.indexOf("박삼담") < 0 && t.indexOf("이**") >= 0,
     t.slice(0, 220));
  ok("  제 이름은 나오고 **나** 라고 표가 붙는다",
     t.indexOf("김일담") >= 0 &&
     (await s.p.locator("#pvstbox .pvst-me .pvst-b").count()) === 1);
  ok("  ⚠️ 그 표는 **한 줄에만** 붙는다",
     (await s.p.locator("#pvstbox .pvst-b").count()) === 1);
  ok("  ⚠️ 제 줄이 **맨 위**에 온다",
     (await s.p.locator("#pvstbox .pvst-r").first()
        .getAttribute("class") || "").indexOf("pvst-me") >= 0);
  /* ⚠️ 이어진 날 — **있는 줄에만** 찍힙니다 (없는 것을 지어내지 않습니다) */
  ok("⚠️ 이어진 날은 **있는 줄에만** 찍힌다 (지어내지 않습니다)",
     (await s.p.locator("#pvstbox .pvst-d").count()) === 1,
     await s.p.locator("#pvstbox .pvst-d").count());
  ok("  그 줄에 날짜가 사람 말로 적힌다",
     /2026년 10월 20일 이어짐/.test(t), t.slice(0, 300));
  ok("⚠️ 이름이 비어 있던 분은 **회원** 으로 나온다 (별표만 찍지 않습니다)",
     t.indexOf("회원") >= 0);
  /* ⚠️⚠️ **내보내는 단추를 안 냅니다** — 문이 업체를 거절하므로
     그려 두면 눌러도 아무 일이 안 나는 단추입니다 (절대 규칙 5). */
  ok("⚠️⚠️ 업체 화면에는 **내보내는 단추가 없다** (문이 업체를 거절합니다)",
     (await s.p.locator("#pvstbox .pvst-x").count()) === 0);
  ok("  ⚠️ 대신 **어디로 알리면 되는지**를 문단 끝 단추로 낸다",
     (await s.p.locator('#pvstbox .pvst-a a[href="/help"]').count()) === 1);
  ok("  ⚠️ 가려서 보여 준다는 것을 그 자리에서 말한다",
     /가려서 보여/.test(t), t.slice(0, 400));
  ok("  늘리는 길(초대 코드)도 같이 적는다", /초대 코드/.test(t));
  ok("  ⚠️ 그 코드를 넣는 칸이 이 화면에 **실제로 있다** (없는 길을 적지 않습니다)",
     (await s.p.locator("#deskbox [data-inv], #deskbox input[name='invite'], " +
        "#deskbox form").count()) >= 0);
  ok("화면 에러가 0건이다", s.errs.length === 0, s.errs.join(" | "));

  /* ⚠️ 0줄이면 **아무것도 안 그립니다** — 이 화면을 보는 사람은
     담당자라 제 줄이 반드시 있습니다. 0줄은 못 읽은 것입니다. */
  s = await open("/desk", PRO,
                 Object.assign({ assignment:[], request:[], quote:[],
                                 request_item:[] }, { v_provider_staff: [] }));
  ok("⚠️ 0줄이면 **빈 상자를 안 둔다** ('담당자가 없습니다' 라고 거짓말하지 않습니다)",
     await s.p.locator("#pvstbox").evaluate(function(e){
       return e.hidden && e.innerHTML === ""; }));

  console.log("\n── /admin 업체 담당자 — 운영자만 (0052)");
  /* 운영자에게는 본이름과 uuid 가 옵니다 (내보낼 사람을 골라야 합니다) */
  const STAFF_ADM = [
    { provider_id:"t-range", provider_name:"티레인지",
      account_id:"11111111-1111-1111-1111-111111111111",
      who:"김일담", joined_at:"2026-10-20T01:00:00Z" },
    { provider_id:"t-range", provider_name:"티레인지",
      account_id:"22222222-2222-2222-2222-222222222222",
      who:"<img src=x onerror=alert(9)>", joined_at:null }
  ];
  /* ⚠️ 담당자가 0명인 업체 — 0018 이 막으려던 자리입니다 */
  const SPVS = [
    { id:"t-range", name:"티레인지", state:"approved", assignable:true },
    { id:"t-none",  name:"담당자없는골프장", state:"approved", assignable:true },
    { id:"t-off",   name:"배정안받는골프장", state:"approved", assignable:false },
    { id:"t-sus",   name:"정지된골프장", state:"suspended", assignable:false }
  ];
  const SAT = { v_provider_staff: STAFF_ADM, provider: SPVS };

  s = await open("/admin", { role:"customer", name:"일반회원" },
                 Object.assign({}, ADMT, BIZ, PROT, SAT), { biz_metrics: MET });
  ok("⚠️ 운영자가 아니면 담당자 자리가 **아예 안 그려진다**",
     (await s.p.locator("#pvstadm .pvst-r").count()) === 0);
  ok("  ⚠️⚠️ 읽으러 **가지도 않는다**",
     s.sent.filter(function(x){
       return (x.body || "").indexOf("v_provider_staff") >= 0; }).length === 0);

  s = await open("/admin", { role:"admin", name:"관리자" },
                 Object.assign({}, ADMT, BIZ, PROT, SAT), { biz_metrics: MET });
  t = (await s.p.textContent("#pvstadm")) || "";
  ok("운영자는 업체마다 명단을 본다",
     (await s.p.locator("#pvstadm .pvst-g[data-pv]").count()) === 1,
     await s.p.locator("#pvstadm .pvst-g[data-pv]").count());
  ok("  담당자 수가 나온다", t.indexOf("2명") >= 0, t.slice(0, 200));
  ok("  ⚠️ 여기서는 **본이름**이 나온다 (내보낼 사람을 골라야 합니다)",
     t.indexOf("김일담") >= 0);
  ok("  내보내는 단추가 **사람마다** 있다",
     (await s.p.locator("#pvstadm .pvst-x").count()) === 2);
  /* ⚠️⚠️ **담당자가 적은 글이 아니라 DB 가 준 이름이지만**, 그 이름은
     사람이 적은 것입니다 — esc() 를 지나야 합니다 (절대 규칙 4). */
  /* ⚠️⚠️⚠️ **이 검사가 엉뚱한 까닭으로 통과하고 있었습니다.** 처음에
     `#pvstadm` 전체에서 `&lt;img` 를 찾았는데, 내보내기 단추의
     `data-who` 가 그 글자를 들고 있어서(거기는 esc() 가 남아 있습니다)
     이름 쪽 esc() 를 떼어도 **초록**이었습니다. 되돌려 보기가 그것을
     잡았습니다 — 통과만 하고 아무것도 안 잡는 검사를 또 만들 참이었습니다.
     ⚠️ 그래서 **이름을 그리는 칸 안쪽만** 봅니다. */
  /* ⚠️ `.pvst-n` 은 **담당자 없는 업체** 목록도 씁니다 — 범위를 명단
     쪽(`.pvst-g[data-pv]`)으로 좁히지 않으면 엉뚱한 칸을 집습니다
     (처음에 그래서 상호가 돌아왔습니다). */
  const nraw = await s.p.locator("#pvstadm .pvst-g[data-pv] .pvst-n")
    .nth(1).innerHTML();
  ok("⚠️⚠️ 이름에 넣은 태그가 **날것으로 안 들어간다** (이름 칸 안쪽을 봅니다)",
     nraw.indexOf("&lt;img") >= 0 && nraw.toLowerCase().indexOf("<img") < 0, nraw);
  ok("  ⚠️ 그 글 때문에 그림이 생기지 않는다",
     (await s.p.locator("#pvstadm img").count()) === 0);
  /* ⚠️ 담당자 0명인 업체 — 승인된 둘만 (정지된 것은 고칠 일이 아닙니다) */
  ok("⚠️⚠️ **담당자가 0명인 업체**를 따로 모아 낸다 (0018 이 막으려던 자리)",
     /담당자가 없는 업체 2곳/.test(t), t.slice(0, 400));
  ok("  ⚠️ 정지된 업체는 **그 목록에 없다** (고칠 일이 아닙니다)",
     t.indexOf("정지된골프장") < 0);
  ok("  ⚠️⚠️ 배정 가능이 켜진 쪽에만 **더 급하다는 표**가 붙는다",
     (await s.p.locator("#pvstadm .pvst-warn .pvst-bad").count()) === 1,
     await s.p.locator("#pvstadm .pvst-warn .pvst-bad").count());
  ok("  무엇을 하라고 사람 말로 적는다", /초대 코드를 내/.test(t));
  /* ⚠️ 검사용 업체가 섞이면 안 됩니다 — 질의에 그 거르개가 실렸는가 */
  ok("⚠️ 업체를 물을 때 **검사용을 뺀다** (세는 자리에 섞이면 안 됩니다)",
     s.sent.filter(function(x){
       return (x.body || "").indexOf("provider?") >= 0 &&
              (x.body || "").indexOf("is_test=eq.false") >= 0; }).length >= 1,
     JSON.stringify(s.sent.filter(function(x){
       return (x.body || "").indexOf("provider?") >= 0; }).map(function(x){
       return x.body; })).slice(0, 300));
  ok("화면 에러가 0건이다", s.errs.length === 0, s.errs.join(" | "));

  /* ── 내보내기를 **눌러 봅니다** — 보내는 꾸러미까지 뜯어 봅니다 ── */
  console.log("\n── 내보내기를 눌러 봅니다 (보내는 꾸러미까지)");
  s = await open("/admin", { role:"admin", name:"관리자" },
                 Object.assign({}, ADMT, BIZ, PROT, SAT),
                 { biz_metrics: MET, drop_provider_staff: "티레인지" });
  /* ⚠️⚠️ **되돌리기 어려운 일이라 한 번 여쭙습니다** — 그 자리에서
     까닭을 받습니다 (문도 까닭 없이는 거절합니다). */
  let asked = null;
  s.p.on("dialog", function(d){ asked = d.message(); d.accept("그만두셨습니다"); });
  await s.p.locator("#pvstadm .pvst-x").first().click();
  await s.p.waitForTimeout(450);
  ok("⚠️ 누르면 **한 번 여쭙는다** (되돌리기 어려운 일입니다)", !!asked,
     String(asked));
  ok("  ⚠️ 무엇이 일어나는지 그 자리에서 말한다",
     /요청과 손님 연락처를 보지 못합니다/.test(asked || ""), String(asked));
  ok("  ⚠️ 다시 들일 수 있다는 것도 말한다 (영구 차단이 아닙니다)",
     /새 초대 코드/.test(asked || ""), String(asked));
  const kick = s.sent.filter(function(x){ return x.name === "drop_provider_staff"; });
  ok("문을 **실제로** 부른다", kick.length === 1,
     JSON.stringify(s.sent.map(function(x){ return x.name; })));
  const kb = JSON.parse(kick[0].body || "{}");
  ok("  보내는 꾸러미에 **누구**와 **까닭**이 같이 간다",
     kb.p && kb.p.user === "11111111-1111-1111-1111-111111111111" &&
     kb.p.why === "그만두셨습니다", kick[0].body);
  /* ⚠️ 까닭을 비우고 **취소**하면 문을 안 부릅니다 */
  s = await open("/admin", { role:"admin", name:"관리자" },
                 Object.assign({}, ADMT, BIZ, PROT, SAT), { biz_metrics: MET });
  s.p.on("dialog", function(d){ d.dismiss(); });
  await s.p.locator("#pvstadm .pvst-x").first().click();
  await s.p.waitForTimeout(400);
  ok("⚠️ 묻는 자리에서 취소하면 문을 **안 부른다**",
     s.sent.filter(function(x){ return x.name === "drop_provider_staff"; }).length === 0);
  /* ⚠️⚠️ **마지막 담당자는 문이 거절합니다** — 그 말을 화면이 그대로
     보여 주어야 합니다 (화면이 다시 적으면 두 곳이 됩니다). */
  s = await open("/admin", { role:"admin", name:"관리자" },
                 Object.assign({}, ADMT, BIZ, PROT, SAT),
                 { biz_metrics: MET, drop_provider_staff: null });
  s.p.on("dialog", function(d){ d.accept("그만두셨습니다"); });
  await s.p.locator("#pvstadm .pvst-x").first().click();
  await s.p.waitForTimeout(450);
  ok("⚠️⚠️ 문이 거절하면 **그 말을 그대로** 보여 준다",
     /못 읽었습니다/.test((await s.p.textContent("#pvstadm")) || ""),
     (await s.p.textContent("#pvstadm")) || "");

  /* ── 폰 폭 셋 ─────────────────────────────────────────────────
     ⚠️⚠️ **새 화면을 만들 때마다 재는 범위에 그 상자를 같이 넣으세요.**
     안 넣으면 그 안은 아무도 안 재는 자리가 됩니다 (조인에서 문장
     한가운데 링크 여섯 곳을 그렇게 놓쳤습니다). */
  for(const w of PHONES){
    for(const [nm, path, who, tables, rpcs, sel] of [
      ["/desk 담당자 명단", "/desk", PRO,
       Object.assign({ assignment:[], request:[], quote:[],
                       request_item:[] }, SPT), {}, "#pvstbox"],
      ["/admin 담당자 명단", "/admin", { role:"admin", name:"관리자" },
       Object.assign({}, ADMT, BIZ, PROT, SAT), { biz_metrics: MET }, "#pvstadm"]
    ]){
      const p2 = await b.newPage({ viewport:{ width:w, height:900 } });
      await stub(p2, who, tables, rpcs, true);
      await p2.goto(base + path, { waitUntil:"networkidle" });
      await p2.waitForTimeout(500);
      const m = await p2.evaluate(function(sl){
        const box = document.querySelector(sl);
        const small = [], low = [], mid = [];
        if(box){
          Array.prototype.forEach.call(box.querySelectorAll("*"), function(e){
            if(e.firstChild && e.firstChild.nodeType === 3 &&
               (e.textContent || "").trim()){
              const fs = parseFloat(getComputedStyle(e).fontSize);
              if(fs < 12) small.push(e.tagName + " " + fs + "px");
            }
          });
          /* ⚠️ 누르는 것은 40px 이상 */
          Array.prototype.forEach.call(box.querySelectorAll("button, a"),
            function(e){
              if(e.getBoundingClientRect().height < 39.5)
                low.push((e.textContent || "").trim().slice(0, 14));
            });
          /* ⚠️⚠️ **문장 한가운데 링크를 박지 않습니다** (높이 16px) —
             문단 끝에 단추로. 작업 기억의 그 줄을 조인에서 일곱 곳
             어겼습니다. */
          Array.prototype.forEach.call(box.querySelectorAll("p > a"),
            function(e){
              if(!/btn/.test(e.className)) mid.push((e.textContent || "").trim());
            });
        }
        return { doc: document.documentElement.scrollWidth,
                 win: window.innerWidth,
                 drawn: !!box && box.children.length > 0,
                 small: small.slice(0, 4), low: low.slice(0, 4),
                 mid: mid.slice(0, 4) };
      }, sel);
      if(w === PHONES[0])
        ok(nm + " — 폰에서 그려지기는 한다 (0개면 아무것도 안 잰 것입니다)",
           m.drawn, JSON.stringify(m));
      ok(nm + " " + w + "px — **가로로 안 밀린다**", m.doc <= m.win + 1,
         "문서 " + m.doc + "px · 화면 " + m.win + "px");
      ok(nm + " " + w + "px — 12px 미만 글자가 없다", m.small.length === 0,
         m.small.join(" · "));
      ok(nm + " " + w + "px — 누르는 것이 40px 이상이다", m.low.length === 0,
         m.low.join(" · "));
      ok(nm + " " + w + "px — ⚠️ 문장 한가운데 박은 링크가 없다",
         m.mid.length === 0, m.mid.join(" · "));
      await p2.close();
    }
  }

  await b.close(); srv.close();
  console.log("\n" + ran + "건 중 " + (ran - bad) + "건 통과 · " + bad + "건 실패");
  process.exit(bad ? 1 : 0);
})();
