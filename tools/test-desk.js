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
   검사가 같이 떨어집니다. 그게 맞습니다. */
const FAKE = "https://sb-test.supabase.co";

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

/* ── 가짜 Supabase ────────────────────────────────────────────────── */
function stub(p, who, tables, rpcs, up){
  const sent = [];
  return Promise.all([
    /* ⚠️⚠️ **버킷이 설정되기 전에는 `{up:false}` 입니다** — 그때는
       사진 칸이 **아예 안 그려져야** 합니다 (단추도 · "준비 중" 도
       없습니다). 지금 운영이 그 상태라, 그 길을 먼저 잽니다. */
    p.route("**/api/upload*", function(r){
      const u = r.request().url();
      sent.push({ name:"upload", body: r.request().method() + " " + u });
      if(!up) return r.fulfill({ status:200, contentType:"application/json",
                                 body: JSON.stringify({ up:false }) });
      if(u.indexOf("p=") >= 0)
        return r.fulfill({ status:200, contentType:"application/json",
          body: JSON.stringify({ ok:true, url:"https://sb-test.supabase.co/x.jpg",
                                 mime:"image/jpeg", bytes:1234 }) });
      return r.fulfill({ status:200, contentType:"application/json",
                         body: JSON.stringify({ up:true }) });
    }),
    p.route("**/api/session", function(r){
      return r.fulfill({ status:200, contentType:"application/json",
        body: JSON.stringify(Object.assign({ auth:true, signedIn:true, hats:[],
          conf:{ url:FAKE, anonKey:"k" } }, who)) });
    }),
    p.route(FAKE + "/rest/v1/**", function(r){
      const u = r.request().url();
      if(u.indexOf("/rpc/") >= 0){
        const fn = u.split("/rpc/")[1].split("?")[0];
        sent.push({ name: fn, body: r.request().postData() });
        /* ⚠️ 문이 무엇을 돌려주는지는 흉내만 냅니다 — 화면은 돌아오면
           다시 읽습니다 (그 길이 실제로 도는지도 여기서 드러납니다).
           ⚠️ 돌려줄 것이 있는 문은 `rpcs` 로 줍니다 (지표처럼 **받은
           것을 그리는** 화면은 그래야 잴 것이 생깁니다). */
        const v = (rpcs || {})[fn];
        if(v === null)
          return r.fulfill({ status:500, contentType:"application/json",
                             body: JSON.stringify({ message:"못 읽었습니다" }) });
        return r.fulfill({ status:200, contentType:"application/json",
                           body: JSON.stringify(v === undefined ? null : v) });
      }
      sent.push({ name:"GET", body:u });
      /* 어느 표를 묻는지는 주소 앞머리로 가릅니다 */
      const key = Object.keys(tables).filter(function(k){
        return u.indexOf("/rest/v1/" + k) >= 0;
      }).sort(function(a, c){ return c.length - a.length; })[0];
      if(key === undefined)
        return r.fulfill({ status:200, contentType:"application/json",
                           headers:{ "content-range":"0-0/0" }, body:"[]" });
      const v = tables[key];
      if(v === null)
        return r.fulfill({ status:500, contentType:"application/json", body:"{}" });
      return r.fulfill({ status:200, contentType:"application/json",
        headers:{ "content-range":"0-0/" + (Array.isArray(v) ? v.length : 0) },
        body: JSON.stringify(v) });
    })
  ]).then(function(){ return sent; });
}

(async function(){
  const PORT = 8840 + (process.pid % 40);
  const srv = (await serve(PORT)).srv;
  const b = await chromium.launch();
  const base = "http://127.0.0.1:" + PORT;
  const view = { width:1280, height:900 };

  async function open(path, who, tables, rpcs, up){
    const p = await b.newPage({ viewport: view });
    const errs = watch(p);
    const sent = await stub(p, who, tables, rpcs, up);
    await p.goto(base + path, { waitUntil:"networkidle" });
    await p.waitForTimeout(450);
    return { p: p, errs: errs, sent: sent };
  }
  function tapsOk(p, sel){
    return p.evaluate(function(s){
      return Array.prototype.filter.call(
        document.querySelectorAll(s + " button, " + s + " a"),
        function(e){ return e.getBoundingClientRect().height < 39.5; }).length;
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
    ad_run:[{ id:"ad1", provider_id:"real-1", place:"main_hero", cat_key:null,
              region:null, starts_on:"2029-12-01", ends_on:"2029-12-31",
              price:500000, state:"draft", note:null }],
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
  /* ⚠️⚠️ **받은 돈이라고 말하면 안 됩니다** — 청구 · 입금 장치가
     없습니다 (0033 의 매각 지표와 같은 말이라야 합니다). */
  ok("⚠️ 광고 금액이 **적어 둔 값**이라고 적는다",
     /청구 · 입금 기록이 아닙니다/.test(t), t.slice(0, 300));
  ok("광고 자리가 사람 말이다 (main_hero 가 아니라 메인 히어로)",
     t.indexOf("메인 히어로") >= 0 && t.indexOf("main_hero") < 0, t.slice(0, 300));
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
    { id:"real-1", name:"그린레슨 아카데미", state:"approved", state_why:null,
      state_at:null, listed:true, assignable:true, is_test:false,
      subs:["ls-solo"], regions:["seoul"] },
    { id:"sus-1", name:"정지된 업체", state:"suspended",
      state_why:"서류가 확인되지 않았습니다", state_at:"2026-11-02T01:00:00Z",
      listed:false, assignable:false, is_test:false,
      subs:["ft-grip"], regions:["gyeonggi"] }
  ];
  const APS = [
    { id:"aaaa-ap-1", no:"AP-0001", company:"새 골프샵", brn:"111-22-33333",
      name:"김신청", tel:"010-2222-3333", email:"a@x.test", region:"서울",
      services:"피팅 · 수리", note:"입점 문의드립니다",
      state:"new", created_at:"2026-11-03T01:00:00Z" }
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
    const sql = fs.readFileSync(
      path.join(__dirname, "..", "db/migrations/0044_contact_ways.sql"), "utf8");
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
  const phones = [
    ["/desk 업체 작업실", "/desk", PRO,
     Object.assign({ assignment:[asg(quoted, "accepted")], request:[quoted],
       quote:[QUOTE], request_item:ITEMS, review:[RVMINE] }, PRT), {}],
    ["/desk 가격 올리기 양식", "/desk", PRO,
     Object.assign({ assignment:[], request:[], quote:[], request_item:[] }, PRT), {},
     "#pricebox [data-pf='open']"],
    ["/admin 배정 · 지표 · 관리 · 심사", "/admin", { role:"admin", name:"관리자" },
     Object.assign({}, ADMT, BIZ, PROT,
       { review:RVADM, report:REPS }), { biz_metrics: MET }],
    ["/my 견적 비교 · 후기 · 제공 이력", "/my", { role:"customer", name:"홍길동" },
     Object.assign({}, MYT, { quote:[QCHOSEN, Q2], review:[],
                              appointment:[], assignment:ASGS }), {}],
    /* ⚠️ 갈래를 눌러야 나오는 자리 둘 — 체크칸 수십 개와 신고 본문 */
    ["/admin 업체 등록 양식", "/admin", { role:"admin", name:"관리자" },
     Object.assign({}, ADMT, BIZ, PROT, { report:REPS }), { biz_metrics: MET },
     "#probox button[data-ptab='new']"],
    ["/admin 신고함", "/admin", { role:"admin", name:"관리자" },
     Object.assign({}, ADMT, BIZ, PROT, { report:REPS }), { biz_metrics: MET },
     "#repbox button[data-rtab='done']"]
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
  console.log("\n── 골프 커뮤니티 (0047)");
  const CQ = [{ id:"q1", cat:"lesson", title:"드라이버 슬라이스 고치는 법",
    body:"오른쪽으로 많이 휩니다", who:"김**", created_at:"2026-11-05T01:00:00Z",
    answer_n:1 }];
  const CA = [{ id:"a1", q_id:"q1", who:"이**", body:"그립을 먼저 보세요",
    created_at:"2026-11-05T02:00:00Z", by_asker:false }];

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
    ok("⚠️ 설정 전에는 커뮤니티 양식을 **안 엽니다**",
       !off.form && off.boxHtml === 0, JSON.stringify(off));
    await p0.close();
  }

  /* ② 로그인 전 — 글은 보이고 쓰는 것은 로그인으로 */
  {
    const g = await open("/cat/community", { role:"customer", name:"", signedIn:false },
                         { v_cq_public: CQ, v_ca_public: CA }, {}, true);
    const r = await g.p.evaluate(function(){
      const li = document.querySelector(".cqc");
      const box = document.getElementById("cqbox");
      return { card: !!li, body: document.body.innerText,
               login: !!(box && box.querySelector('a[href^="/login"]')),
               form: !!document.getElementById("cqf") };
    });
    ok("로그인 전에도 질문이 보인다 (크롤러도 봅니다)", r.card, JSON.stringify(r).slice(0,140));
    ok("  ⚠️⚠️ 글쓴이 이름이 **가려져** 나온다 (김** — 공개 보기에 by_user 가 없습니다)",
       r.body.indexOf("김**") >= 0 && r.body.indexOf("김질문") < 0, "");
    ok("  로그인 전에는 쓰는 양식 대신 로그인 길을 낸다", r.login && !r.form,
       JSON.stringify({ login:r.login, form:r.form }));
    ok("  ⚠️ 우리가 답해 준다고 말하지 않는다 (절대 규칙 5)",
       r.body.indexOf("골프올인원이 답변을 드리지는 않으며") >= 0, "");
    ok("  ⚠️ 연락처를 적지 말라고 **그 자리에서** 말한다 (§2.C)",
       r.body.indexOf("연락처는 적지 마세요") >= 0, "");
    await g.p.close();
  }

  /* ③ 로그인 뒤 — 질문 올리기 · 답변 달기 */
  {
    const g = await open("/cat/community", { role:"customer", name:"손님", signedIn:true },
                         { v_cq_public: CQ, v_ca_public: CA }, {}, true);
    const r = await g.p.evaluate(function(){
      const f = document.getElementById("cqf");
      if(!f) return { form:false };
      return { form:true, req: Array.prototype.map.call(
        f.querySelectorAll("[required]"), function(e){ return e.name; }) };
    });
    ok("로그인하면 질문 양식이 열린다", r.form, JSON.stringify(r));
    ok("  분류 · 제목 · 내용이 **필수**다 (§2.C)",
       ["cat","title","body"].every(function(n){ return (r.req||[]).indexOf(n) >= 0; }),
       (r.req || []).join(","));

    await g.p.selectOption("#c-cat", "lesson");
    await g.p.fill("#c-title", "검사용 질문");
    await g.p.fill("#c-body", "검사로 올리는 글입니다");
    await g.p.click("#cqf button[type=submit]");
    await g.p.waitForTimeout(400);
    const askCall = g.sent.filter(function(x){ return x.name === "ask_cq"; })[0];
    ok("⚠️ 올리기 단추가 **ask_cq 를 실제로 부른다**", !!askCall,
       g.sent.map(function(x){ return x.name; }).join(","));
    if(askCall){
      const sp = JSON.parse(askCall.body).p;
      ok("  분류 · 제목 · 내용을 그대로 보낸다",
         sp.cat === "lesson" && sp.title === "검사용 질문", JSON.stringify(sp));
    }
    await g.p.close();
  }

  /* ④ 답변 펼치기 — ⚠️ 누르면 실제로 불러오는가 */
  {
    const g = await open("/cat/community", { role:"customer", name:"손님", signedIn:true },
                         { v_cq_public: CQ, v_ca_public: CA }, {}, true);
    await g.p.click(".cqc-open");
    await g.p.waitForTimeout(400);
    const r = await g.p.evaluate(function(){
      const box = document.querySelector(".cqc-a");
      return { open: !!box && !box.hidden, body: box ? box.innerText : "",
               form: !!document.querySelector(".caf") };
    });
    ok("답변 보기를 누르면 펼쳐진다", r.open, JSON.stringify(r).slice(0,120));
    ok("  답변이 그려지고 이름이 가려져 있다",
       r.body.indexOf("그립을 먼저 보세요") >= 0 && r.body.indexOf("이**") >= 0, r.body.slice(0,120));
    ok("  로그인했으면 답변 양식이 같이 나온다", r.form, "");

    await g.p.fill(".caf textarea", "검사로 다는 답변입니다");
    await g.p.click(".caf button[type=submit]");
    await g.p.waitForTimeout(400);
    const ansCall = g.sent.filter(function(x){ return x.name === "answer_cq"; })[0];
    ok("⚠️ 답변 단추가 **answer_cq 를 실제로 부른다**", !!ansCall,
       g.sent.map(function(x){ return x.name; }).join(","));
    await g.p.close();
  }

  /* ⑤ /my — 내 글 고치기 · 내리기 */
  {
    const MYQ = [{ id:"q1", cat:"lesson", title:"내 질문", body:"내용입니다",
                   state:"live", hidden_why:null, created_at:"2026-11-05T01:00:00Z" },
                 { id:"q2", cat:"lesson", title:"가려진 질문", body:"내용",
                   state:"hidden", hidden_why:"광고 글입니다",
                   created_at:"2026-11-04T01:00:00Z" }];
    const MYA = [{ id:"a1", q_id:"q9", body:"내 답변입니다", state:"live",
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
    ok("  내 질문과 내 답변을 **갈라서** 보여 준다",
       r.body.indexOf("내 질문") >= 0 && r.body.indexOf("내 답변") >= 0, "");
    ok("  ⚠️ 가린 **까닭을 보여 준다** (무엇이 문제였는지 알아야 합니다)",
       r.body.indexOf("광고 글입니다") >= 0, "");
    /* ⚠️⚠️ 가려진 글에는 고치기 · 내리기가 **없어야** 합니다 */
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

  /* ⑥ 폰 폭 셋 */
  for(const w of PHONES){
    const p2 = await b.newPage({ viewport: { width: w, height: 900 } });
    await stub(p2, { role:"customer", name:"손님", signedIn:true },
               { v_cq_public: CQ, v_ca_public: CA }, {}, true);
    await p2.goto(base + "/cat/community", { waitUntil:"networkidle" });
    await p2.waitForTimeout(500);
    await p2.click(".cqc-open").catch(function(){});
    await p2.waitForTimeout(350);
    const r = await p2.evaluate(function(){
      const small = [], low = [];
      Array.prototype.forEach.call(
        document.querySelectorAll(".cqc, .jbox, .none"),
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
               drawn: !!document.querySelector(".cqc"),
               small: small.slice(0,4), low: low.slice(0,4) };
    });
    if(w === PHONES[0])
      ok("커뮤니티 — 폰에서 그려지기는 한다", r.drawn, JSON.stringify(r));
    ok("커뮤니티 " + w + "px — **가로로 안 밀린다**", r.doc <= r.win + 1,
       "문서 " + r.doc + "px · 화면 " + r.win + "px");
    ok("커뮤니티 " + w + "px — 12px 미만 글자가 없다", r.small.length === 0,
       r.small.join(" · "));
    ok("커뮤니티 " + w + "px — 누르는 것이 40px 이상이다", r.low.length === 0,
       r.low.join(" · "));
    await p2.close();
  }

  /* ══════════════════════════════════════════════════════════════
     골프 인력 · 비즈니스 (0048) — ⚠️ **빌드가 찍은 HTML 만 보는 검사는
     영원히 못 봅니다.** 목록도 양식도 Supabase 설정이 있어야 그려집니다.
     ⚠️⚠️ 가장 중요한 것 둘: **연락처가 화면 어디에도 안 나오는가**,
     그리고 **검사용 · 정지된 업체의 상호가 안 나오는가**.
     ══════════════════════════════════════════════════════════════ */
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

  await b.close(); srv.close();
  console.log("\n" + ran + "건 중 " + (ran - bad) + "건 통과 · " + bad + "건 실패");
  process.exit(bad ? 1 : 0);
})();
