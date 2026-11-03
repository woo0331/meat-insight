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

  await p.check('input[name="svc"][value="ls-solo"]');
  await p.check('input[name="svc"][value="rg-in"]');
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

  await p.check('input[name="svc"][value="ls-solo"]');
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
  await p.check('input[name="svc"][value="ls-solo"]');
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
  await p.check('input[name="svc"][value="ls-solo"]');
  await p.fill("#m-name", "가");
  await p.fill("#m-tel", "123");
  await p.check("#m-agree");
  await p.click('#mf button[type="submit"]');
  await p.waitForTimeout(400);
  ok("거절한 까닭이 화면에 그대로 나온다",
     /숫자 아홉에서 열한 자리/.test((await p.textContent("#mmsg")) || ""),
     await p.textContent("#mmsg"));
  ok("다시 누를 수 있다", !(await p.getAttribute('#mf button[type="submit"]', "disabled")));

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
