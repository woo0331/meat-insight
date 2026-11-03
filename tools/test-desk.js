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
  const PHONE = { width: 390, height: 900 };
  async function phone(path, who, tables, rpcs, pre){
    const p = await b.newPage({ viewport: PHONE });
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
     { assignment:[asg(quoted, "accepted")], request:[quoted],
       quote:[QUOTE], request_item:ITEMS, review:[RVMINE] }, {}],
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
    const r = await phone(path, who, tables, rpcs, pre);
    ok(label + " — 그려지기는 한다 (빈 화면을 재고 통과하지 않는다)", r.drawn, JSON.stringify(r));
    ok(label + " — **가로로 안 밀린다**", r.doc <= r.win + 1,
       "문서 " + r.doc + "px · 화면 " + r.win + "px");
    ok(label + " — 12px 미만 글자가 없다", r.small.length === 0, r.small.join(" · "));
  }

  await b.close(); srv.close();
  console.log("\n" + ran + "건 중 " + (ran - bad) + "건 통과 · " + bad + "건 실패");
  process.exit(bad ? 1 : 0);
})();
