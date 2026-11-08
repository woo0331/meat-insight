#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   견적 · 매칭 요청 양식을 **눌러 봅니다** (2차 지시서 §5)

   재는 것
     ① 설정이 없으면 양식이 **안 열린다**
     ② 고르는 값이 **업체가 고를 수 있는 하위**와 한 글자도 안 다르다
        (회원끼리 쓰는 자리에 요청을 보내면 받을 업체가 없습니다)
     ③ 동의 자리에 수집 항목 · 이용 목적 · 보유 기간이 같이 있고,
        **제3자 제공은 여기서 안 받는다**고 분명히 말한다
     ④ 보내는 꾸러미의 열쇠가 DB 문(make_request)의 칸과 같다
     ⑤ 두 번 눌러도 **같은 idem** 으로 간다
     ⑥ 업체가 0곳이면 "제안이 바로 오지 않는다" 고 **말한다**
     ⑦ DB 가 거절하면 그 말을 그대로 보여 준다
     ⑧ 열린 양식을 잽니다 (전수 점검이 못 보는 자리)
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require("playwright");
const path = require("path");
const { serve, watch } = require("./_serve.js");

let bad = 0, ran = 0;
/* ⚠️⚠️⚠️ **묶음이 접혀 있으면 먼저 펼치고 고릅니다** (2026-11-08).
   전에는 `p.check('input[value="ls-solo"]')` 로 바로 눌렀는데, 시안에
   맞춰 `AM_CATS` 의 차례를 바꾸자 첫 묶음이 **골프장 부킹**이 되었고
   레슨 칸은 접힌 묶음 안이라 **보이지 않아** 검사가 30초 기다리다
   터졌습니다 — 멀쩡한 화면을 고장이라고 한 자리입니다.
   ⚠️ 손님이 하는 길 그대로입니다: 접혀 있으면 그 묶음을 펼치고 고릅니다. */
async function pick(pg, v){
  const box = pg.locator('input[name="svc"][value="' + v + '"]');
  if(!(await box.isVisible()))
    await pg.locator('fieldset.svc:has(input[name="svc"][value="' + v +
                     '"]) button.svc-x').click();
  await box.check();
}

function ok(name, cond, got){
  ran++;
  if(cond) console.log("  ✅ " + name);
  else { bad++; console.log("  ❌ " + name + (got !== undefined ? "  →  " + String(got).slice(0, 220) : "")); }
}

const FAKE = "https://sb-test.supabase.co";

(async function(){
  const h = await serve(0);
  const b = await chromium.launch();
  const URL = "http://127.0.0.1:" + h.port + "/match";

  console.log("\n── 설정이 없으면 양식을 열지 않습니다");
  let p = await b.newPage({ viewport:{ width:1280, height:900 } });
  await p.route("**/api/session", function(r){
    return r.fulfill({ status:200, contentType:"application/json",
      body: JSON.stringify({ auth:false, signedIn:false }) });
  });
  await p.goto(URL, { waitUntil:"networkidle" });
  await p.waitForTimeout(250);
  ok("양식이 없다", (await p.locator("#mf").count()) === 0);
  ok("받지 못한다고 말한다", /받지 못합니다/.test((await p.textContent("#matchbox")) || ""));
  ok("본문에 누를 단추가 없다", (await p.locator("main button").count()) === 0);
  await p.close();

  console.log("\n── 설정이 있으면 양식이 열리고 실제로 보냅니다");
  p = await b.newPage({ viewport:{ width:1280, height:900 } });
  const csp = watch(p);
  await p.route("**/api/session", function(r){
    return r.fulfill({ status:200, contentType:"application/json",
      body: JSON.stringify({ auth:true, signedIn:false,
                             conf:{ url:FAKE, anonKey:"anon-test-key" } }) });
  });
  let sent = [], mode = "ok";
  await p.route(FAKE + "/rest/v1/rpc/make_request", function(r){
    sent.push(JSON.parse(r.request().postData() || "{}"));
    if(mode === "ok")
      return r.fulfill({ status:200, contentType:"application/json", body:'"SW-A1B2-C3D4"' });
    return r.fulfill({ status:400, contentType:"application/json",
      body: JSON.stringify({ message:"연락처를 다시 봐 주세요 — 숫자 아홉에서 열한 자리입니다" }) });
  });

  await p.goto(URL, { waitUntil:"networkidle" });
  await p.waitForTimeout(250);
  ok("양식이 열린다", (await p.locator("#mf").count()) === 1);

  const vals = await p.evaluate(function(){
    return Array.prototype.map.call(
      document.querySelectorAll('input[name="svc"]'), function(e){ return e.value; });
  });
  const real = await p.evaluate(function(){
    return (window.amCatsForProvider() || []).reduce(function(a, c){
      return a.concat(window.amCatItemsForProvider(c).map(function(i){ return i.key; }));
    }, []);
  });
  ok("고르는 값이 **업체가 고를 수 있는 하위**와 한 글자도 안 다르다",
     vals.length > 0 && vals.join(",") === real.join(","),
     vals.length + "개 vs " + real.length + "개");
  /* ⚠️ 중고 직거래 · 조인 · 커뮤니티는 받을 업체가 없습니다 */
  ok("중고 직거래 하위가 안 들어 있다",
     vals.indexOf("us-driver") < 0 && vals.indexOf("us-iron") < 0, vals.join(","));
  ok("업체가 하는 중고 하위(매입 견적 · 위탁판매)는 들어 있다",
     vals.indexOf("us-buyquote") >= 0 && vals.indexOf("us-consign") >= 0);
  ok("조인 · 커뮤니티 하위가 안 들어 있다",
     vals.every(function(v){ return !/^(jo|cm)-/.test(v); }));

  const agree = (await p.textContent(".agree")) || "";
  ok("수집 항목 · 이용 목적 · 보유 기간이 같은 자리에 있다",
     /수집 항목/.test(agree) && /이용 목적/.test(agree) && /보유 기간/.test(agree));
  ok("⚠️ 업체 전달 동의는 **여기서 안 받는다**고 말한다",
     /여기서 받지 않습니다/.test(agree), agree.slice(0, 90));

  /* ⚠️⚠️⚠️ **묶음은 접혀 있습니다** (2026-11-06). 전에는 여덟 묶음
     마흔셋이 다 펼쳐져 폰 360px 에서 양식이 3,538px 였습니다. 지금은
     고른 묶음만 펼치므로, **다른 분류를 같이 고르려면 펼쳐야** 합니다 —
     손님이 실제로 하는 일과 같은 길로 눌러 봅니다.
     ⚠️ 접혔다는 것을 **세어서** 봅니다 (갯수를 박지 않습니다 — 접힌 것이
     하나라도 있고, 펼치면 늘어나면 됩니다). */
  const seen0 = await p.locator('input[name="svc"]:visible').count();
  const all0  = await p.locator('input[name="svc"]').count();
  ok("고르는 칸이 **다 펼쳐져 있지 않다**", seen0 < all0, seen0 + "/" + all0);
  ok("  그래도 고를 칸이 한 개는 보인다", seen0 > 0, seen0);

  await pick(p, "ls-solo");
  /* 연습장 묶음을 펼칩니다 — 그 묶음의 단추를 누릅니다 */
  await p.locator('fieldset.svc:has(input[name="svc"][value="rg-in"]) button.svc-x')
         .click();
  const seen1 = await p.locator('input[name="svc"]:visible').count();
  ok("  펼치면 그 묶음의 칸이 보인다", seen1 > seen0, seen0 + " → " + seen1);
  await pick(p, "rg-in");

  /* ⚠️⚠️ **고른 것이 있는 묶음을 접어도 그 사실이 화면에 남아야 합니다** —
     처음에는 못 접게 막았는데 그러면 눌러도 아무 일이 안 나는 단추가
     됩니다 (절대 규칙 5). 접히고, 단추가 몇 개 고른지 말합니다. */
  const rgBtn = p.locator('fieldset.svc:has(input[name="svc"][value="rg-in"]) button.svc-x');
  await rgBtn.click();
  ok("  고른 묶음도 접히고, 단추가 **몇 개 고른지** 말한다",
     (await p.locator('input[name="svc"][value="rg-in"]').isVisible()) === false &&
     /1개 고름/.test((await rgBtn.textContent()) || ""),
     (await rgBtn.textContent()) || "");
  /* ⚠️ 접힌 칸도 **보내집니다** — 아래 꾸러미에서 rg-in 이 그대로 갑니다 */

  await p.selectOption("#m-region", "경기");
  await p.fill("#m-want", "이번 달 안에");
  await p.fill("#m-bmin", "100,000");
  await p.fill("#m-bmax", "300000원");
  await p.fill("#m-body", "구력 1년입니다.");
  await p.fill("#m-name", "김손님");
  await p.fill("#m-tel", "010-5555-1111");
  await p.check("#m-agree");
  const opened = Date.now();
  await p.waitForTimeout(1100);
  await p.click('#mf button[type="submit"]');
  await p.waitForTimeout(400);

  ok("보냈다", sent.length === 1, sent.length);
  const pl = (sent[0] || {}).p || {};
  ok("문의 칸 이름과 **같은 열쇠**로 보낸다",
     ["name","tel","email","region","want_at","body","budget_min","budget_max",
      "services","cat","idem","agree_at"].every(function(k){ return k in pl; }),
     Object.keys(pl).join(","));
  ok("고른 것만 보낸다", (pl.services || []).join(",") === "ls-solo,rg-in", pl.services);
  ok("분류는 **처음 고른 것**의 분류다", pl.cat === "lesson", pl.cat);
  ok("예산에서 쉼표 · 글자를 걷어 낸다",
     pl.budget_min === "100000" && pl.budget_max === "300000",
     pl.budget_min + " / " + pl.budget_max);
  ok("지역을 목록의 글자 그대로 보낸다", pl.region === "경기", pl.region);
  ok("동의 시각이 **누른 순간**이다",
     new Date(pl.agree_at).getTime() - opened > 900,
     (new Date(pl.agree_at).getTime() - opened) + "ms");
  ok("idem 을 같이 보낸다", typeof pl.idem === "string" && pl.idem.length > 8, pl.idem);
  ok("⚠️ 제3자 제공 동의를 **안 보낸다**",
     !("agree3rd_at" in pl) && !("agree3rd" in pl), Object.keys(pl).join(","));

  const done = (await p.textContent("#matchbox")) || "";
  ok("DB 가 돌려준 요청번호를 그대로 보여 준다", /SW-A1B2-C3D4/.test(done));
  /* ⚠️⚠️ 업체가 0곳이면 지킬 수 없는 약속을 하지 않습니다 */
  ok("업체가 0곳이라 제안이 바로 오지 않는다고 **말한다**",
     /제안이 바로 오지는 않습니다/.test(done), done.slice(0, 120));
  ok("CSP 거절 · 화면 에러가 0건이다", csp.length === 0, csp.join(" | "));

  /* ⚠️⚠️ **버킷이 설정되기 전에는 사진 칸이 아예 안 나옵니다**
     (2차 지시서 §5-4 · 절대 규칙 2 · 5). 지금 운영이 그 상태입니다 —
     단추도 · 안내도 · "준비 중" 도 없어야 합니다. */
  ok("⚠️ 버킷이 없으니 사진 칸이 **한 글자도** 안 나온다",
     (await p.locator("#matchbox .phup").count()) === 0 &&
     done.indexOf("사진") < 0, done.slice(0, 200));
  await p.close();

  console.log("\n── 업체 화면에서 온 요청 (0035 · /match?pv=)");
  await p.close();
  p = await b.newPage({ viewport:{ width:1280, height:900 } });
  await p.route("**/api/session", function(r){
    return r.fulfill({ status:200, contentType:"application/json",
      body: JSON.stringify({ auth:true, signedIn:false,
                             conf:{ url:FAKE, anonKey:"anon-test-key" } }) });
  });
  let pvSent = [];
  await p.route(FAKE + "/rest/v1/rpc/make_request", function(r){
    pvSent.push(JSON.parse(r.request().postData() || "{}"));
    return r.fulfill({ status:200, contentType:"application/json", body:'"SW-P1P2-P3P4"' });
  });
  /* ⚠️ 업체가 0곳이라 `amProvider()` 가 못 찾습니다 — **빌드가 찍는
     그 파일을 갈아 끼워서** 흉내 냅니다.
     ⚠️⚠️ `addInitScript` 로 window 에 미리 넣으면 **안 됩니다** —
     `providers.generated.js` 가 그 뒤에 실려 빈 배열로 **덮어씁니다**
     (실제로 그렇게 떨어졌습니다). 자료가 오는 길 그대로 바꿉니다. */
  await p.route("**/js/data/providers.generated.js*", function(r){
    return r.fulfill({ status:200, contentType:"text/javascript;charset=utf-8",
      body: 'window.AM_PROVIDERS_AT="검사";\n' +
            'window.AM_PROVIDERS=[{"id":"pv-one","name":"남서울 실내연습장",' +
            '"subs":["ls-solo","rg-sim"]}];\n' });
  });
  await p.goto(URL + "?pv=pv-one", { waitUntil:"networkidle" });
  await p.waitForTimeout(300);
  const pre = await p.evaluate(function(){
    return Array.prototype.filter.call(
      document.querySelectorAll('input[name="svc"]'), function(e){ return e.checked; })
      .map(function(e){ return e.value; }).sort();
  });
  ok("그 업체가 하는 것을 **미리 골라 둔다**",
     pre.join(",") === "ls-solo,rg-sim", pre.join(","));
  /* ⚠️ 잠그지 않습니다 — 손님이 다른 것도 같이 요청하실 수 있어야 합니다 */
  ok("  잠그지는 않는다 (다른 것도 고를 수 있다)",
     (await p.locator('input[name="svc"]:disabled').count()) === 0);
  let wt = (await p.textContent("#matchbox")) || "";
  ok("어느 업체를 보고 왔는지 말해 준다", wt.indexOf("남서울 실내연습장") >= 0, wt.slice(0, 300));
  /* ⚠️⚠️⚠️ 지키지 못할 약속을 하지 않습니다 (제17조 제2항) */
  ok("⚠️ 바로 그 업체로 간다는 **약속을 안 한다**",
     /약속은 아닙니다/.test(wt), wt.slice(0, 400));
  ok("⚠️ 넘기기 전에 다시 여쭙는다고 적는다", /다시 여쭙습니다/.test(wt), wt.slice(0, 400));

  await p.fill("#m-name", "최손님");
  await p.fill("#m-tel", "010-2222-3333");
  await p.check("#m-agree");
  await p.click('#mf button[type="submit"]');
  await p.waitForTimeout(400);
  ok("보내는 꾸러미에 wantProvider 가 들어간다",
     pvSent.length === 1 && pvSent[0].p.wantProvider === "pv-one",
     JSON.stringify(pvSent[0] && pvSent[0].p && pvSent[0].p.wantProvider));
  /* ⚠️⚠️ 열쇠 이름이 DB 가 읽는 것과 **글자까지** 같아야 합니다 —
     다르면 아무것도 안 걸렀는데 통과합니다 (`?m=apple` 자리). */
  ok("  열쇠 이름이 DB 가 읽는 것과 같다 (wantProvider)",
     pvSent.length === 1 && Object.prototype.hasOwnProperty.call(pvSent[0].p, "wantProvider"));

  /* ══════════════════════════════════════════════════════════════
     분류 화면에서 넘어온 길 (4차 지시서 §6 · /match?cat=)

     ⚠️⚠️⚠️ **여기가 "적어 놓고 안 여쭙는" 것을 잡는 자리입니다.**
     /cat/<key> 화면이 "이 분류 요청에는 이것을 적습니다" 라고 적어
     놓고, 양식에 그 칸이 없거나 길잡이가 안 바뀌면 그건 **지키지 못할
     말**입니다 (절대 규칙 5). 목록(AM_ASK)과 양식을 **맞춰 봅니다.**
     ⚠️ 갯수를 박지 않습니다 — 분류가 늘면 늘어난 대로 돕니다.
     ══════════════════════════════════════════════════════════════ */
  console.log("\n── 분류 화면에서 넘어온 길 (/match?cat=)");
  await p.goto(URL + "?cat=lesson", { waitUntil:"networkidle" });
  await p.waitForTimeout(300);

  const first = (await p.locator("fieldset.svc legend").first().textContent()) || "";
  ok("그 분류 묶음이 **맨 앞**에 온다", first.indexOf("골프 레슨") >= 0, first);
  ok("  다른 분류도 그대로 있다 (빼지 않습니다)",
     (await p.locator("fieldset.svc").count()) > 1);
  /* ⚠️ 미리 골라 두지 **않습니다** — 안 원하시는 것까지 업체에 넘어갑니다 */
  ok("  하위를 미리 고르지는 않는다",
     (await p.locator('input[name="svc"]:checked').count()) === 0);

  /* ⚠️⚠️ **온 분류만 펼칩니다** — 분류 화면에서 누르고 들어온 분이
     마흔셋을 밀어 내려가지 않게. 그 묶음의 칸은 보이고, 나머지는
     접혀 있어야 합니다. */
  ok("  온 분류의 칸은 보인다",
     await p.locator('input[name="svc"][value="ls-solo"]').isVisible());
  ok("  다른 분류의 칸은 접혀 있다",
     (await p.locator('input[name="svc"][value="tr-home"]').isVisible()) === false);
  ok("  접힌 묶음의 단추가 **몇 가지인지** 말한다",
     /가지 보기/.test((await p.locator(
       'fieldset.svc:has(input[name="svc"][value="tr-home"]) button.svc-x')
       .textContent()) || ""));

  /* 목록과 양식을 맞춰 봅니다 — AM_ASK 를 **그 화면에서 읽어** 씁니다 */
  const askChk = await p.evaluate(function(){
    var a = (window.AM_ASK || {}).lesson || [];
    var ph = (document.getElementById("m-body") || {}).placeholder || "";
    var out = { n:a.length, miss:[], ph:ph };
    var FIELD = { region:"#m-region", want:"#m-want",
                  budget:"#m-bmin", svc:'input[name="svc"]' };
    a.forEach(function(x){
      if(x[1] === "body"){
        if(ph.indexOf(x[0]) < 0) out.miss.push(x[0] + " (길잡이에 없음)");
      }else if(!document.querySelector(FIELD[x[1]])){
        out.miss.push(x[0] + " (" + x[1] + " 칸이 없음)");
      }
    });
    return out;
  });
  ok("⚠️ 잴 것이 0개면 실패입니다 (목록을 읽기는 했는가)", askChk.n > 0, askChk.n);
  ok("⚠️⚠️ **적어 놓은 것을 전부 실제로 여쭙는다**",
     askChk.miss.length === 0, askChk.miss.join(" / "));

  /* ══════════════════════════════════════════════════════════════
     ⚠️⚠️⚠️ **"필수라고 적어 놓고 안 받는" 것을 잡는 자리** (지시서 §3)

     전에는 분류 화면이 "지역 · 날짜를 여쭙습니다" 라고 적어 놓고 양식
     에서는 **전부 선택**이었습니다 — 부킹 요청에 날짜가 없어도 들어왔고,
     지역이 빈 요청은 `js/assign.js` 가 후보를 고를 수가 없었습니다.
     지금은 셋째 칸(`true`)이 **한 곳**에서 둘을 모두 정합니다.
     ⚠️ 갯수를 박지 않습니다 — 분류가 늘면 늘어난 대로 돕니다.
     ══════════════════════════════════════════════════════════════ */
  for(const cat of ["lesson","booking","range","market","fitting","travel","used"]){
    await p.goto(URL + "?cat=" + cat, { waitUntil:"networkidle" });
    await p.waitForTimeout(250);
    const r = await p.evaluate(function(k){
      var req = window.amAskReq ? window.amAskReq(k) : null;
      if(!req) return { none:true };
      var FIELD = { region:"#m-region", want:"#m-want", body:"#m-body" };
      var bad = [], n = 0;
      Object.keys(FIELD).forEach(function(kind){
        var e = document.querySelector(FIELD[kind]);
        if(!e){ bad.push(kind + " 칸이 없음"); return; }
        n++;
        var has = e.hasAttribute("required");
        if(req[kind] && !has) bad.push(kind + " — 필수라고 적어 놓고 안 받음");
        if(!req[kind] && has) bad.push(kind + " — 선택인데 required 가 걸림");
      });
      /* ⚠️ 필수 칸에는 **왜 필요한지**를 그 자리에서 말해 줍니다 */
      var starN = document.querySelectorAll("#mf .jrow label b").length;
      return { bad: bad, n: n, reqN: Object.keys(req).length, stars: starN,
               bodyMin: (document.getElementById("m-body") || {})
                          .getAttribute ? (document.getElementById("m-body")
                            .getAttribute("minlength") || "") : "" };
    }, cat);
    ok(cat + " — 잴 칸을 찾기는 했다 (0개면 실패입니다)",
       !r.none && r.n === 3, JSON.stringify(r));
    ok(cat + " — ⚠️⚠️ **적어 놓은 필수를 양식이 그대로 받는다**",
       !r.none && r.bad.length === 0, (r.bad || []).join(" / "));
    /* ⚠️⚠️ **이름표도 그 줄을 읽는가** (2026-11-08) — 전에는 지역 칸의
       이름표를 「지역」으로 **글자로 박아** 두어서, 여행처럼 `AM_ASK` 가
       「출발 지역」이라고 적은 분류는 **분류 화면과 양식이 다른 말**을
       했습니다. 키로만 맞춰 보면 영원히 초록인 자리입니다. */
    const lb = await p.evaluate(function(k){
      var a = window.amAskOf ? window.amAskOf(window.amCat(k)) : null;
      var want = "";
      if(a) a.forEach(function(x){ if(x[1] === "region") want = x[0]; });
      var el = document.querySelector('label[for="m-region"]');
      return { want: want, got: el ? el.textContent.replace("*","").trim() : null };
    }, cat);
    ok(cat + " — ⚠️⚠️ 지역 칸의 **이름표가 AM_ASK 와 같다** (글자로 안 박습니다)",
       !!lb.want && lb.got === lb.want, JSON.stringify(lb));
    ok(cat + " — 필수가 하나라도 있다 (목록이 썩지 않았는가)",
       !r.none && r.reqN > 0, String(r.reqN));
    ok(cat + " — 별표가 찍힌다 (화면에 보이는 표시입니다)",
       !r.none && r.stars > 0, String(r.stars));
  }

  /* ⚠️⚠️ 내용이 필수인 분류는 **다섯 글자 이상**을 받습니다 — required
     만 걸면 빈칸 하나로도 지나갑니다. */
  await p.goto(URL + "?cat=booking", { waitUntil:"networkidle" });
  await p.waitForTimeout(250);
  const bmin = await p.evaluate(function(){
    return (document.getElementById("m-body") || {}).getAttribute("minlength") || ""; });
  ok("⚠️ 내용이 필수면 minlength 도 같이 걸린다 (빈칸 하나를 막습니다)",
     bmin === "5", bmin);

  /* ⚠️⚠️⚠️ **분류를 모르면 아무것도 더 안 걸립니다.** 모르는데 필수를
     걸면 손님이 양식을 통째로 못 보냅니다. */
  await p.goto(URL, { waitUntil:"networkidle" });
  await p.waitForTimeout(250);
  const bare = await p.evaluate(function(){
    return ["#m-region","#m-want","#m-body"].filter(function(sel){
      var e = document.querySelector(sel);
      return e && e.hasAttribute("required");
    });
  });
  ok("⚠️⚠️ `?cat=` 없이 오면 **지역 · 일정 · 내용에 required 가 안 걸린다**",
     bare.length === 0, bare.join(","));
  /* ⚠️ 그래도 성함 · 연락처 · 동의는 언제나 필수입니다 */
  const always = await p.evaluate(function(){
    return ["#m-name","#m-tel","#m-agree"].filter(function(sel){
      var e = document.querySelector(sel);
      return !(e && e.hasAttribute("required"));
    });
  });
  ok("  그래도 성함 · 연락처 · 동의는 **언제나** 필수다", always.length === 0,
     always.join(","));

  /* ⚠️ 받을 자리가 없는 분류로 와도 아무것도 안 걸립니다 */
  await p.goto(URL + "?cat=matchup", { waitUntil:"networkidle" });
  await p.waitForTimeout(250);
  const noneReq = await p.evaluate(function(){
    return ["#m-region","#m-want","#m-body"].filter(function(sel){
      var e = document.querySelector(sel);
      return e && e.hasAttribute("required");
    });
  });
  ok("받을 자리가 없는 분류로 와도 required 가 안 걸린다",
     noneReq.length === 0, noneReq.join(","));

  await p.goto(URL + "?cat=lesson", { waitUntil:"networkidle" });
  await p.waitForTimeout(250);

  /* ⚠️ 분류마다 **다른** 길잡이여야 합니다 — 같으면 안 바뀐 것입니다 */
  const phLesson = askChk.ph;
  await p.goto(URL + "?cat=travel", { waitUntil:"networkidle" });
  await p.waitForTimeout(300);
  const phTravel = await p.evaluate(function(){
    return (document.getElementById("m-body") || {}).placeholder || ""; });
  ok("길잡이가 분류마다 다르다", phLesson && phTravel && phLesson !== phTravel,
     phLesson + "  ||  " + phTravel);

  /* ⚠️ 요청할 수 없는 분류(회원끼리 쓰는 자리)로는 보내지 않습니다 */
  await p.goto(URL + "?cat=matchup", { waitUntil:"networkidle" });
  await p.waitForTimeout(300);
  const phNone = await p.evaluate(function(){
    return { ph:(document.getElementById("m-body") || {}).placeholder || "",
             ask: !!(window.amAskOf && window.amAskOf("matchup")) }; });
  ok("받을 자리가 없는 분류는 목록이 비어 있다", phNone.ask === false);
  ok("  그런 분류로 와도 기본 길잡이로 돈다 (빈 칸이 아닙니다)",
     phNone.ph.length > 0 && phNone.ph !== phLesson, phNone.ph);

  await p.goto(URL + "?cat=없는분류", { waitUntil:"networkidle" });
  await p.waitForTimeout(300);
  ok("모르는 분류면 아무 묶음도 앞으로 안 온다",
     (await p.locator("fieldset.svc-on").count()) === 0);

  console.log("\n── 모르는 업체 id 는 **안 씁니다**");
  await p.goto(URL + "?pv=없는업체", { waitUntil:"networkidle" });
  await p.waitForTimeout(300);
  wt = (await p.textContent("#matchbox")) || "";
  ok("모르는 id 면 그 안내를 안 그린다", wt.indexOf("보고 오셨습니다") < 0, wt.slice(0, 200));
  ok("  미리 고른 것도 없다",
     (await p.locator('input[name="svc"]:checked').count()) === 0);
  pvSent = [];
  await pick(p, "ls-solo");
  await p.fill("#m-name", "최손님");
  await p.fill("#m-tel", "010-2222-4444");
  await p.check("#m-agree");
  await p.click('#mf button[type="submit"]');
  await p.waitForTimeout(400);
  ok("  보낼 때도 null 로 보낸다 (주소의 글자를 그대로 믿지 않습니다)",
     pvSent.length === 1 && pvSent[0].p.wantProvider === null,
     JSON.stringify(pvSent[0] && pvSent[0].p && pvSent[0].p.wantProvider));
  await p.close();
  p = await b.newPage({ viewport:{ width:1280, height:900 } });
  await p.route("**/api/session", function(r){
    return r.fulfill({ status:200, contentType:"application/json",
      body: JSON.stringify({ auth:true, signedIn:false,
                             conf:{ url:FAKE, anonKey:"anon-test-key" } }) });
  });
  await p.route(FAKE + "/rest/v1/rpc/make_request", function(r){
    sent.push(JSON.parse(r.request().postData() || "{}"));
    if(mode === "ok")
      return r.fulfill({ status:200, contentType:"application/json", body:'"SW-A1B2-C3D4"' });
    return r.fulfill({ status:400, contentType:"application/json",
      body: JSON.stringify({ message:"연락처를 다시 봐 주세요 — 숫자 아홉에서 열한 자리입니다" }) });
  });

  console.log("\n── 버킷이 켜지면 **접수한 뒤에** 사진 칸이 나옵니다 (§5-4)");
  p = await b.newPage({ viewport:{ width:1280, height:900 } });
  const csp2 = watch(p);
  let ups = [];
  await p.route("**/api/upload*", function(r){
    ups.push(r.request().method() + " " + r.request().url());
    if(r.request().method() === "POST")
      return r.fulfill({ status:200, contentType:"application/json",
        body: JSON.stringify({ ok:true, url:"https://sb-test.supabase.co/put" }) });
    return r.fulfill({ status:200, contentType:"application/json",
                       body: JSON.stringify({ up:true }) });
  });
  await p.route("**/api/session", function(r){
    return r.fulfill({ status:200, contentType:"application/json",
      body: JSON.stringify({ auth:true, signedIn:false,
                             conf:{ url:FAKE, anonKey:"anon-test-key" } }) });
  });
  await p.route(FAKE + "/rest/v1/rpc/make_request", function(r){
    return r.fulfill({ status:200, contentType:"application/json", body:'"SW-A1B2-C3D4"' });
  });
  await p.goto(URL, { waitUntil:"networkidle" });
  await p.waitForTimeout(250);
  /* ⚠️ **접수 전에는** 사진 칸이 없어야 합니다 — 접수 전에 올리게 하면
     아무나 올리는 길이 하나 생깁니다 (0011 머리말). */
  ok("⚠️ 접수 **전에는** 사진 칸이 없다",
     (await p.locator("#matchbox .phup").count()) === 0);

  await pick(p, "ls-solo");
  await p.fill("#m-name", "박손님");
  await p.fill("#m-tel", "010-7777-8888");
  await p.check("#m-agree");
  await p.click('#mf button[type="submit"]');
  await p.waitForTimeout(600);
  ok("접수한 **뒤에** 사진 칸이 나온다",
     (await p.locator("#matchbox .phup").count()) === 1);
  const ph = (await p.textContent("#matchbox .phup")) || "";
  ok("  한 장 8MB · 다섯 장까지라고 적는다", /8MB/.test(ph) && /다섯 장/.test(ph), ph.slice(0, 200));
  ok("  누가 보는지 적는다 (배정된 업체와 담당자만)",
     /배정된 업체와 저희 담당자만/.test(ph), ph.slice(0, 300));
  ok("  얼굴 · 주민등록번호를 가리라고 적는다", /주민등록번호/.test(ph));
  ok("  없으면 안 올려도 된다고 적는다", /없으시면/.test(ph), ph.slice(0, 200));
  /* ⚠️⚠️ **누르는 것은 label 입니다** — 파일 칸의 기본 단추는 폰에서
     20px 로 서기도 합니다. 높이를 직접 잽니다. */
  const lab = await p.evaluate(function(){
    const e = document.querySelector(".phup-b");
    return e ? e.getBoundingClientRect().height : 0;
  });
  ok("  고르는 것이 40px 이상이다", lab >= 40, lab);
  ok("  파일 칸 자체는 숨어 있다 (브라우저 기본 단추를 안 씁니다)",
     (await p.evaluate(function(){
       const e = document.getElementById("phup-f");
       return e ? e.getBoundingClientRect().width : 999;
     })) <= 2);
  ok("CSP 거절 · 화면 에러가 0건이다", csp2.length === 0, csp2.join(" | "));
  await p.close();
  p = await b.newPage({ viewport:{ width:1280, height:900 } });
  await p.route("**/api/session", function(r){
    return r.fulfill({ status:200, contentType:"application/json",
      body: JSON.stringify({ auth:true, signedIn:false,
                             conf:{ url:FAKE, anonKey:"anon-test-key" } }) });
  });
  await p.route(FAKE + "/rest/v1/rpc/make_request", function(r){
    sent.push(JSON.parse(r.request().postData() || "{}"));
    if(mode === "ok")
      return r.fulfill({ status:200, contentType:"application/json", body:'"SW-A1B2-C3D4"' });
    return r.fulfill({ status:400, contentType:"application/json",
      body: JSON.stringify({ message:"연락처를 다시 봐 주세요 — 숫자 아홉에서 열한 자리입니다" }) });
  });

  console.log("\n── 두 번 눌러도 하나입니다");
  await p.goto(URL, { waitUntil:"networkidle" });
  await p.waitForTimeout(250);
  sent = [];
  await pick(p, "ls-solo");
  await p.fill("#m-name", "김손님");
  await p.fill("#m-tel", "010-5555-2222");
  await p.check("#m-agree");
  await p.click('#mf button[type="submit"]');
  await p.waitForTimeout(300);
  ok("한 번 보낸 뒤 단추가 사라진다 (양식이 결과로 바뀝니다)",
     (await p.locator("#mf").count()) === 0);
  ok("보낸 것이 하나다", sent.length === 1, sent.length);

  console.log("\n── 열린 양식을 잽니다 (전수 점검이 못 보는 자리)");
  await p.goto(URL, { waitUntil:"networkidle" });
  await p.waitForTimeout(300);
  await p.setViewportSize({ width: 360, height: 900 });
  await p.waitForTimeout(200);
  const m = await p.evaluate(function(){
    function lin(c){ c /= 255; return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); }
    function lum(p){ return 0.2126*lin(p[0]) + 0.7152*lin(p[1]) + 0.0722*lin(p[2]); }
    function rgb(s){ var x = s.match(/rgba?\(([^)]+)\)/); return x ? x[1].split(",").map(Number) : null; }
    function bgOf(el){
      for(var n = el; n && n !== document.documentElement; n = n.parentElement){
        var c = rgb(getComputedStyle(n).backgroundColor);
        if(c && (c.length < 4 || c[3] > .5)) return c;
      }
      return [255,255,255];
    }
    var small = [], taps = [], low = [];
    document.querySelectorAll("#mf *").forEach(function(el){
      var cs = getComputedStyle(el), fs = parseFloat(cs.fontSize);
      var r = el.getBoundingClientRect();
      if(r.width <= 2 || r.height <= 2) return;
      var own = [].slice.call(el.childNodes)
        .filter(function(n){ return n.nodeType === 3 && n.textContent.trim(); })
        .map(function(n){ return n.textContent.trim(); }).join(" ");
      var tag = el.tagName.toLowerCase() + (el.className && typeof el.className === "string"
        ? "." + el.className.trim().split(/\s+/)[0] : "");
      if(own && fs < 12) small.push(tag + " " + fs + "px");
      var isTap = /^(input|button|textarea|select)$/.test(el.tagName.toLowerCase())
                    ? el.type !== "checkbox"
                    : (el.tagName.toLowerCase() === "label" && el.querySelector("input,button,select,textarea"));
      if(isTap && r.height < 39.5) taps.push(tag + " " + Math.round(r.height) + "px");
      if(own){
        var f = rgb(cs.color), g = bgOf(el);
        if(f){
          var a = lum(f), b2 = lum(g);
          var v = (Math.max(a,b2) + .05) / (Math.min(a,b2) + .05);
          var big = fs >= 24 || (fs >= 18.66 && parseInt(cs.fontWeight,10) >= 700);
          if(v < (big ? 3 : 4.5)) low.push(tag + " " + v.toFixed(2) + " " + own.slice(0,16));
        }
      }
    });
    var s = document.getElementById("m-region"), sel = { n:0 };
    if(s){
      var cs2 = getComputedStyle(s);
      var inner = s.clientWidth - parseFloat(cs2.paddingLeft) - parseFloat(cs2.paddingRight);
      var cv = document.createElement("canvas").getContext("2d");
      cv.font = cs2.fontWeight + " " + cs2.fontSize + " " + cs2.fontFamily;
      var wide = 0, worst = null;
      Array.prototype.forEach.call(s.options, function(o){
        var w = cv.measureText(o.textContent).width;
        if(w > wide){ wide = w; worst = o.textContent; }
      });
      sel = { n:s.options.length, inner:Math.round(inner), wide:Math.round(wide), worst:worst };
    }
    return { small:small, taps:taps, low:low, sel:sel,
             fields: document.querySelectorAll("#mf input, #mf textarea, #mf select").length };
  });
  ok("양식의 칸을 실제로 쟀다", m.fields > 10, m.fields);
  ok("12px 미만 글자가 없다", m.small.length === 0, m.small.join(" / "));
  ok("적는 칸 · 단추가 전부 40px 이상이다", m.taps.length === 0, m.taps.join(" / "));
  ok("글자 대비가 전부 AA 다", m.low.length === 0, m.low.join(" / "));
  ok("가장 긴 지역 이름이 칸 안에 들어간다 (폰 360px)",
     m.sel.wide <= m.sel.inner,
     "가장 긴 것 " + m.sel.worst + " " + m.sel.wide + "px · 칸 안쪽 " + m.sel.inner + "px");
  await p.setViewportSize({ width: 1280, height: 900 });

  console.log("\n── DB 가 거절하면 그 말을 그대로 보여 줍니다");
  mode = "no";
  await p.goto(URL, { waitUntil:"networkidle" });
  await p.waitForTimeout(250);
  await pick(p, "ls-solo");
  await p.fill("#m-name", "가");
  await p.fill("#m-tel", "123");
  await p.check("#m-agree");
  await p.click('#mf button[type="submit"]');
  await p.waitForTimeout(400);
  ok("거절한 까닭이 화면에 그대로 나온다",
     /숫자 아홉에서 열한 자리/.test((await p.textContent("#mmsg")) || ""),
     await p.textContent("#mmsg"));
  ok("다시 누를 수 있다", !(await p.getAttribute('#mf button[type="submit"]', "disabled")));

  /* ══════════════════════════════════════════════════════════════
     접수한 뒤 **다음 걸음을 말하는가** (2026-11-06)

     ⚠️⚠️⚠️ 전에는 "이 번호와 연락처로 진행 상황을 확인하실 수
     있습니다" 한 줄과 `/categories` 단추뿐이라, **어디서** 확인하는지를
     아무 데서도 안 알려 주었습니다. 그 길은 `/my` 안의 `claim_request`
     (요청번호 + 그때 적은 연락처)입니다.
     ⚠️⚠️ 그리고 `make_request` 는 anon 에게도 열려 있어 로그인 없이
     넣으면 `request.user_id` 가 비고, 그러면 `/my` 에서 영영 안 보이고
     알림도 안 붙습니다 — 그 자리에 "알려 드립니다" 는 **참이 아닙니다**.
     ══════════════════════════════════════════════════════════════ */
  /* ⚠️ 이름을 길게 둡니다 — 이 파일 앞쪽이 이미 `done` 을 쓰고 있어
     `node --check` 에서 터졌습니다 (작업 기억의 그 줄입니다). */
  async function doneScreen(signedIn){
    const q = await b.newPage({ viewport:{ width:1280, height:900 } });
    await q.route("**/api/session", function(r){
      return r.fulfill({ status:200, contentType:"application/json",
        body: JSON.stringify({ auth:true, signedIn: signedIn,
          role: signedIn ? "customer" : "", name: signedIn ? "홍길동" : "",
          conf:{ url:FAKE, anonKey:"anon-test-key" } }) });
    });
    await q.route(FAKE + "/rest/v1/rpc/make_request", function(r){
      return r.fulfill({ status:200, contentType:"application/json",
                         body:'"SW-9Z8Y-7X6W"' });
    });
    await q.goto(URL, { waitUntil:"networkidle" });
    await q.waitForTimeout(250);
    await pick(q, "ls-solo");
    await q.fill("#m-name", "박손님");
    await q.fill("#m-tel", "010-7777-8888");
    await q.check("#m-agree");
    await q.click('#mf button[type="submit"]');
    await q.waitForTimeout(600);
    const r = await q.evaluate(function(){
      const box = document.getElementById("matchbox");
      return { text: box ? box.innerText : "",
               hrefs: Array.prototype.map.call(
                 box ? box.querySelectorAll("a.btn") : [],
                 function(e){ return e.getAttribute("href"); }) };
    });
    await q.close();
    return r;
  }

  console.log("\n── 접수한 뒤 **어디서 견적을 보는지** 말합니다");
  {
    const r = await doneScreen(true);
    ok("요청번호를 그대로 보여 준다", r.text.indexOf("SW-9Z8Y-7X6W") >= 0,
       r.text.slice(0, 120).replace(/\n/g, " | "));
    ok("로그인하셨으면 **내 정보로 가는 단추**를 낸다",
       r.hrefs.indexOf("/my") >= 0, r.hrefs.join(" · "));
    ok("  거기서 견적을 나란히 보고 고른다고 적는다",
       r.text.indexOf("나란히") >= 0, r.text.slice(0, 400).replace(/\n/g, " | "));
    /* ⚠️⚠️ 밖으로 안 보냅니다 (0050) — 그 사실을 적습니다 */
    ok("⚠️ 문자 · 카톡 · 메일로 보낸다고 **적지 않는다**",
       r.text.indexOf("보내 드리지 않습니다") >= 0 &&
       r.text.indexOf("문자로 알려") < 0, r.text.slice(0, 400));
  }
  {
    const r = await doneScreen(false);
    /* ⚠️⚠️⚠️ **여기가 막다른 길이었습니다** — 비로그인 요청은 /my 에서
       영영 안 보이는데 가져오는 길을 한 글자도 안 적었습니다. */
    ok("⚠️⚠️ 로그인 안 하셨으면 **가져오는 길**을 말한다",
       r.text.indexOf("요청번호와 방금 적으신 연락처") >= 0,
       r.text.slice(0, 500).replace(/\n/g, " | "));
    ok("  어느 계정에도 매여 있지 않다는 것을 말한다",
       r.text.indexOf("어느 계정에도") >= 0, "");
    ok("  로그인으로 가는 단추를 낸다 (돌아올 자리까지)",
       r.hrefs.some(function(h){ return h && h.indexOf("/login") === 0 &&
                                        h.indexOf("next=/my") >= 0; }),
       r.hrefs.join(" · "));
    /* ⚠️⚠️ 비로그인에게 "알려 드립니다" 는 참이 아닙니다 — 알림이
       붙을 곳(`request.user_id`)이 비어 있습니다 (notify_one 이
       조용히 끝냅니다). */
    ok("⚠️⚠️ 비로그인에게 **알려 드린다고 적지 않는다** " +
       "(알림이 붙을 곳이 없습니다)",
       r.text.indexOf("알림이 붙습니다") < 0, r.text.slice(0, 500));
    ok("  막다른 길로 두지 않는다 (둘러볼 길도 같이 낸다)",
       r.hrefs.indexOf("/categories") >= 0, r.hrefs.join(" · "));
  }

  if(process.argv.indexOf("--shot") >= 0){
    const dir = process.argv[process.argv.indexOf("--shot") + 1] || ".";
    mode = "ok";
    const sp = await b.newPage({ viewport:{ width:1280, height:900 }, deviceScaleFactor:2 });
    await sp.route("**/api/session", function(r){
      return r.fulfill({ status:200, contentType:"application/json",
        body: JSON.stringify({ auth:true, signedIn:false,
                               conf:{ url:FAKE, anonKey:"k" } }) });
    });
    await sp.goto(URL, { waitUntil:"networkidle" });
    await sp.waitForTimeout(350);
    await sp.screenshot({ path: path.join(dir, "match-form.png"), fullPage:true });
    await sp.close();
    console.log("   그림을 " + dir + " 에 찍었습니다");
  }

  await b.close(); h.srv.close();
  console.log("\n" + ran + "건 중 " + (ran - bad) + "건 통과 · " + bad + "건 실패");
  process.exit(bad ? 1 : 0);
})();
