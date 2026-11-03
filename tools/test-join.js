#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   입점 신청 양식을 **눌러 봅니다**

   ⚠️⚠️ **링크 검사가 통과해도 보낸 것이 맞는지는 모릅니다.** 앞
   서비스에서 화면이 한 열쇠로 보내고 받는 쪽은 다른 열쇠를 읽어서
   **거르개가 아무것도 안 걸렀는데** 검사는 전부 통과했습니다.
   그래서 여기서는 진짜로 눌러 보고 **보낸 꾸러미를 뜯어 봅니다.**

   재는 것
     ① 설정이 없으면 양식이 **안 열린다** (죽은 단추 금지)
     ② 설정이 있으면 양식이 열리고, 고르는 값이 **실제 하위 키**다
     ③ 보내는 꾸러미의 열쇠가 DB 문(make_apply)의 칸과 **같다**
     ④ 동의 시각은 **누른 순간**이다 (화면을 연 시각이 아니라)
     ⑤ DB 가 돌려준 신청번호를 **그대로** 보여 준다
     ⑥ DB 가 거절하면 그 말을 그대로 보여 준다

   돌리기   node tools/test-join.js
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path"), http = require("http");
const ROOT = path.join(__dirname, "..");

let bad = 0, ran = 0;
function ok(name, cond, got){
  ran++;
  if(cond) console.log("  ✅ " + name);
  else { bad++; console.log("  ❌ " + name + (got !== undefined ? "  →  " + String(got).slice(0, 200) : "")); }
}

/* 서버는 tools/_serve.js 한 곳에 있습니다 — 운영과 같은 헤더를 보냅니다 */
const { serve, watch } = require("./_serve.js");


(async function(){
  const PORT = 8740 + (process.pid % 50);
  const srv = (await serve(PORT)).srv;
  const b = await chromium.launch();

  /* ── ① 설정이 없을 때 ───────────────────────────────────────── */
  console.log("\n── 설정이 없으면 양식을 열지 않습니다");
  let p = await b.newPage({ viewport:{ width:1280, height:900 } });
  await p.route("**/api/session", function(r){
    return r.fulfill({ status:200, contentType:"application/json",
      body: JSON.stringify({ auth:false, signedIn:false }) });
  });
  await p.goto("http://127.0.0.1:" + PORT + "/join", { waitUntil:"networkidle" });
  await p.waitForTimeout(250);
  const formsOff = await p.locator("#jf").count();
  ok("양식이 없다", formsOff === 0, formsOff);
  ok("안내만 보인다", /받지 못합니다/.test((await p.textContent("#joinbox")) || ""));
  /* ⚠️ 머리말의 검색 단추는 늘 있습니다 — 본문만 셉니다.
     처음에 화면 전체를 세다가 멀쩡한 검색 단추를 "죽은 단추" 로
     잡았습니다. 화면이 아니라 **검사가 틀린** 자리였습니다. */
  const dead = await p.locator("main button").count();
  ok("본문에 누를 단추가 하나도 없다", dead === 0, dead);
  await p.close();

  /* ── ②~⑥ 설정이 있을 때 ────────────────────────────────────── */
  console.log("\n── 설정이 있으면 양식이 열리고 실제로 보냅니다");
  p = await b.newPage({ viewport:{ width:1280, height:900 } });
  /* ⚠️ 운영 CSP(connect-src)가 허락하는 꼴이어야 합니다 — 좁히면
   이 검사가 같이 떨어집니다. 그게 맞습니다. */
const FAKE = "https://sb-test.supabase.co";
  await p.route("**/api/session", function(r){
    return r.fulfill({ status:200, contentType:"application/json",
      body: JSON.stringify({ auth:true, signedIn:false,
                             conf:{ url:FAKE, anonKey:"anon-test-key" } }) });
  });

  let sent = null, mode = "ok";
  await p.route(FAKE + "/rest/v1/rpc/make_apply", function(r){
    sent = JSON.parse(r.request().postData() || "{}");
    if(mode === "ok")
      return r.fulfill({ status:200, contentType:"application/json", body:'"GA261103-0007"' });
    return r.fulfill({ status:400, contentType:"application/json",
      body: JSON.stringify({ message:"연락처를 다시 봐 주세요 — 숫자 아홉에서 열한 자리입니다" }) });
  });

  /* ⚠️⚠️ CSP 거절을 **따로** 셉니다. 안 세면 "보내지 못했습니다" 라는
     같은 증상으로만 보여서, 설정 탓인지 CSP 탓인지 못 가립니다. */
  const csp = watch(p);
  await p.goto("http://127.0.0.1:" + PORT + "/join", { waitUntil:"networkidle" });
  await p.waitForTimeout(250);
  ok("양식이 열린다", (await p.locator("#jf").count()) === 1);

  /* ⚠️⚠️ 고르는 값이 **실제 하위 키**인가 — 손으로 적었으면 여기서 갈립니다 */
  const vals = await p.evaluate(function(){
    return Array.prototype.map.call(
      document.querySelectorAll('input[name="svc"]'), function(e){ return e.value; });
  });
  const real = await p.evaluate(function(){
    return (window.amCatsForProvider() || []).reduce(function(a, c){
      return a.concat(window.amCatItemsForProvider(c).map(function(i){ return i.key; }));
    }, []);
  });
  ok("고르는 값이 catalog 의 하위 키와 **한 글자도 안 다르다**",
     vals.length > 0 && vals.join(",") === real.join(","),
     vals.length + "개 vs " + real.length + "개");
  /* ⚠️⚠️ **분류째로 빼면 안 됩니다.** 중고 골프장터는 둘이 섞입니다 —
     드라이버 직거래는 회원끼리, 매입 견적 · 위탁판매는 업체입니다.
     2차 지시서 §3-2 가 그 둘을 같은 분류에 두었습니다. */
  ok("중고 직거래 하위는 안 들어 있다",
     vals.indexOf("us-driver") < 0 && vals.indexOf("us-iron") < 0, vals.join(","));
  ok("업체가 하는 중고 하위(매입 견적 · 위탁판매)는 들어 있다",
     vals.indexOf("us-buyquote") >= 0 && vals.indexOf("us-consign") >= 0);
  ok("조인 · 커뮤니티 하위는 안 들어 있다",
     vals.every(function(v){ return !/^(jo|cm)-/.test(v); }));

  /* 동의 자리에 셋이 같이 있는가 (개인정보보호법 제15조 제2항) */
  const agree = (await p.textContent(".agree")) || "";
  ok("수집 항목 · 이용 목적 · 보유 기간이 같은 자리에 있다",
     /수집 항목/.test(agree) && /이용 목적/.test(agree) && /보유 기간/.test(agree));
  ok("보유 기간이 빈 칸이 아니다", /보유 기간[\s\S]{0,40}\d/.test(agree), agree.slice(0, 80));

  /* 적고 누릅니다 */
  const opened = Date.now();
  await p.fill("#j-company", "성남 그린골프연습장");
  await p.fill("#j-name", "홍길동");
  await p.fill("#j-tel", "010-1234-5678");
  /* ⚠️ 이제 고르는 칸입니다 — fill 이 아니라 selectOption 입니다 */
  await p.selectOption("#j-region", "경기");
  await p.check('input[name="svc"][value="rg-in"]');
  await p.check('input[name="svc"][value="rg-sim"]');
  await p.check("#j-agree");
  await p.waitForTimeout(1100);              /* 연 시각과 누른 시각을 벌립니다 */
  await p.click('#jf button[type="submit"]');
  await p.waitForTimeout(400);

  ok("보냈다", !!sent, sent);
  const pl = (sent || {}).p || {};
  ok("문의 칸 이름과 **같은 열쇠**로 보낸다",
     ["company","name","tel","brn","email","region","note","services","agree_at"]
       .every(function(k){ return k in pl; }), Object.keys(pl).join(","));
  ok("고른 것만 보낸다", (pl.services || []).join(",") === "rg-in,rg-sim", pl.services);
  /* ⚠️ 보내는 값이 목록의 **키와 같은 글자**인지 — 자유 입력이던 시절에
     경기 · gyeonggi · 경기도 가 섞여 거르개가 조용히 어긋났습니다. */
  ok("지역을 목록에 있는 글자 그대로 보낸다", pl.region === "경기", pl.region);
  ok("동의 시각이 **누른 순간**이다 (화면을 연 시각이 아니다)",
     new Date(pl.agree_at).getTime() - opened > 900,
     (new Date(pl.agree_at).getTime() - opened) + "ms");
  ok("운영 CSP 가 Supabase 로 가는 길을 막지 않는다 (거절 0건)",
     csp.length === 0, csp.join(" | "));
  ok("DB 가 돌려준 신청번호를 그대로 보여 준다",
     /GA261103-0007/.test((await p.textContent("#joinbox")) || ""));

  /* ── 열린 양식을 **잽니다** ──────────────────────────────────
     ⚠️⚠️ 전수 점검(tools/check-screens.js)은 이 양식을 **영원히 못
     봅니다** — 설정이 있어야 열리기 때문입니다. 그래서 여기서 같이
     잽니다. 안 재면 양식만 대비 · 누름 크기 검사를 빠져나갑니다. */
  console.log("\n── 열린 양식을 잽니다 (전수 점검이 못 보는 자리)");
  await p.goto("http://127.0.0.1:" + PORT + "/join", { waitUntil:"networkidle" });
  await p.waitForTimeout(300);
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
    document.querySelectorAll("#jf *").forEach(function(el){
      var cs = getComputedStyle(el), fs = parseFloat(cs.fontSize);
      var r = el.getBoundingClientRect();
      if(r.width <= 2 || r.height <= 2) return;
      var own = [].slice.call(el.childNodes)
        .filter(function(n){ return n.nodeType === 3 && n.textContent.trim(); })
        .map(function(n){ return n.textContent.trim(); }).join(" ");
      var tag = el.tagName.toLowerCase() + (el.className && typeof el.className === "string"
        ? "." + el.className.trim().split(/\s+/)[0] : "");
      if(own && fs < 12) small.push(tag + " " + fs + "px");
      /* ⚠️ 무엇이 "누르는 것" 인가를 분명히 합니다.
         · 적는 칸 · 단추 · 체크박스를 **감싼** label 은 누르는 것입니다.
         · 칸 **위에 붙은 이름표**(label for=...)는 누르는 것이 아니라
           글입니다 — 눌러도 되지만 그러라고 둔 것이 아닙니다. 이것까지
           40px 로 올리면 양식이 쓸데없이 길어집니다.
         체크박스 자체는 20px 이고, 그것을 감싼 .chk 가 40px 입니다. */
      var isTap = /^(input|button|textarea|select)$/.test(el.tagName.toLowerCase())
                    ? el.type !== "checkbox"
                    : (el.tagName.toLowerCase() === "label" && el.querySelector("input,button,select,textarea"));
      if(isTap && r.height < 39.5)
        taps.push(tag + " " + Math.round(r.height) + "px");
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
    return { small:small, taps:taps, low:low,
             fields: document.querySelectorAll("#jf input, #jf textarea").length };
  });
  ok("양식의 칸을 실제로 쟀다 (0개면 아무것도 안 잰 것입니다)", m.fields > 10, m.fields);

  /* ⚠️⚠️ **select 안의 글자는 낱말 잘림 검사에도 가로 스크롤 검사에도
     안 걸립니다** — 앞 서비스에서 세 번 당했습니다. 글자 폭을 직접 재서
     칸 안쪽과 견줍니다. 폰 폭에서 봅니다. */
  await p.setViewportSize({ width: 360, height: 900 });
  await p.waitForTimeout(200);
  const sel = await p.evaluate(function(){
    const s = document.getElementById("j-region");
    if(!s) return { n:0 };
    const cs = getComputedStyle(s);
    const inner = s.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const cv = document.createElement("canvas").getContext("2d");
    cv.font = cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
    let worst = null, wide = 0;
    Array.prototype.forEach.call(s.options, function(o){
      const w = cv.measureText(o.textContent).width;
      if(w > wide){ wide = w; worst = o.textContent; }
    });
    return { n: s.options.length, inner: Math.round(inner), wide: Math.round(wide), worst: worst };
  });
  ok("고르는 칸에 실제로 지역이 들어 있다", sel.n > 10, sel.n + "개");
  ok("가장 긴 지역 이름이 칸 안에 들어간다 (폰 360px)",
     sel.wide <= sel.inner, "가장 긴 것 " + sel.worst + " " + sel.wide + "px · 칸 안쪽 " + sel.inner + "px");
  await p.setViewportSize({ width: 1280, height: 900 });
  ok("12px 미만 글자가 없다", m.small.length === 0, m.small.join(" / "));
  ok("적는 칸 · 단추가 전부 40px 이상이다", m.taps.length === 0, m.taps.join(" / "));
  ok("글자 대비가 전부 AA 다", m.low.length === 0, m.low.join(" / "));

  /* ⑥ DB 가 거절했을 때 */
  console.log("\n── DB 가 거절하면 그 말을 그대로 보여 줍니다");
  mode = "no";
  await p.goto("http://127.0.0.1:" + PORT + "/join", { waitUntil:"networkidle" });
  await p.waitForTimeout(250);
  await p.fill("#j-company", "가");
  await p.fill("#j-name", "나");
  await p.fill("#j-tel", "123");
  await p.check('input[name="svc"][value="rg-in"]');
  await p.check("#j-agree");
  await p.click('#jf button[type="submit"]');
  await p.waitForTimeout(400);
  ok("거절한 까닭이 화면에 그대로 나온다",
     /숫자 아홉에서 열한 자리/.test((await p.textContent("#jmsg")) || ""),
     await p.textContent("#jmsg"));
  ok("다시 누를 수 있다 (단추가 잠긴 채 남지 않는다)",
     !(await p.getAttribute('#jf button[type="submit"]', "disabled")));

  await b.close(); srv.close();
  console.log("\n" + ran + "건 중 " + (ran - bad) + "건 통과 · " + bad + "건 실패");
  process.exit(bad ? 1 : 0);
})();
