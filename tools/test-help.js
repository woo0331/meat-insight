#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   고객센터 문의 접수를 **눌러 봅니다** (4차 지시서 §11 · DB 는 0045)

   ⚠️⚠️⚠️ 지시서 §11 — "문의 접수가 실제 저장되는지 확인한다.
   관리자가 확인할 수 없는 문의 접수 기능은 완료로 처리하지 않는다."
   그래서 여기서는 **보낸 꾸러미를 뜯어 보고**, 운영자 화면이 그것을
   읽는 자리를 갖고 있는지까지 봅니다.

   재는 것
     ① 설정이 없으면 양식이 **안 열린다** (죽은 단추 금지)
     ② 보유 기간(inquiryKeep)이 비면 **안 열린다** (제15조 제2항)
     ③ 열리면 갈래 값이 DB 의 check 제약과 **한 글자도 안 다르다**
     ④ 동의 자리에 수집 항목 · 이용 목적 · 보유 기간이 **같이** 있다
     ⑤ 비로그인인데 연락처도 메일도 없으면 **안 보낸다** (문과 같은 말로)
     ⑥ 보내는 꾸러미의 열쇠가 DB 문(open_inquiry)의 칸과 **같다**
     ⑦ 동의 시각은 **누른 순간**이다
     ⑧ 접수번호는 DB 가 돌려준 값을 **그대로** 찍는다
     ⑨ DB 가 거절하면 그 말을 그대로 보여 준다
     ⑩ 로그인하셨으면 연락처가 선택이라고 **말한다**
     ⑪ 운영자가 아니면 문의함이 **한 줄도 안 보인다**

   돌리기   node tools/test-help.js
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require("playwright");
const { serve, watch } = require("./_serve.js");

let bad = 0, ran = 0;
function ok(name, cond, got){
  ran++;
  if(cond) console.log("  ✅ " + name);
  else { bad++; console.log("  ❌ " + name +
    (got !== undefined ? "  →  " + String(got).slice(0, 200) : "")); }
}

/* ⚠️ 운영 CSP(connect-src)가 허락하는 꼴이어야 합니다 — 좁히면 이 검사가
   같이 떨어집니다. 그게 맞습니다 (가로채기는 CSP 를 피하지 못합니다). */
const FAKE = "https://sb-test.supabase.co";

(async function(){
  const h = await serve(0);
  const b = await chromium.launch();
  const URL = "http://127.0.0.1:" + h.port + "/help";

  /* ── ① 설정이 없을 때 ─────────────────────────────────────── */
  console.log("\n── 설정이 없으면 문의 양식을 열지 않습니다");
  let p = await b.newPage({ viewport:{ width:1280, height:900 } });
  await p.route("**/api/session", r => r.fulfill({ status:200,
    contentType:"application/json",
    body: JSON.stringify({ auth:false, signedIn:false }) }));
  await p.goto(URL, { waitUntil:"networkidle" });
  await p.waitForTimeout(260);
  ok("양식이 없다", (await p.locator("#iqf").count()) === 0);
  ok("받지 못한다고 말한다", /받지 못합니다/.test((await p.textContent("#inqbox")) || ""));
  /* ⚠️ 막다른 길로 두지 않습니다 — 네 갈래는 그대로 있어야 합니다 */
  ok("그래도 갈래 카드는 그대로 있다 (막다른 길이 아니다)",
     (await p.locator(".lane").count()) >= 3);
  await p.close();

  /* ── ② 보유 기간이 비면 ──────────────────────────────────── */
  console.log("\n── 보유 기간이 비면 열지 않습니다 (제15조 제2항)");
  p = await b.newPage({ viewport:{ width:1280, height:900 } });
  await p.route("**/api/session", r => r.fulfill({ status:200,
    contentType:"application/json",
    body: JSON.stringify({ auth:true, signedIn:false,
                           conf:{ url:FAKE, anonKey:"anon-test-key" } }) }));
  /* 자료가 오는 길 그대로 바꿉니다 — 뒤에 실리는 파일이 덮어쓰지 않게 */
  await p.route("**/js/data/site.js*", r => r.fulfill({ status:200,
    contentType:"text/javascript;charset=utf-8",
    body: 'window.WOW_BIZ = { applyKeep:"12개월", inquiryKeep:"" };\n' +
          'window.bizVal = function(k){ return (window.WOW_BIZ || {})[k] || ""; };\n' }));
  await p.goto(URL, { waitUntil:"networkidle" });
  await p.waitForTimeout(260);
  ok("⚠️ 보유 기간이 비면 양식을 안 연다", (await p.locator("#iqf").count()) === 0);
  await p.close();

  /* ── ③~⑨ 설정이 있을 때 ─────────────────────────────────── */
  console.log("\n── 설정이 있으면 양식이 열리고 실제로 보냅니다");
  p = await b.newPage({ viewport:{ width:1280, height:900 } });
  await p.route("**/api/session", r => r.fulfill({ status:200,
    contentType:"application/json",
    body: JSON.stringify({ auth:true, signedIn:false,
                           conf:{ url:FAKE, anonKey:"anon-test-key" } }) }));
  let sent = null, mode = "ok";
  await p.route(FAKE + "/rest/v1/rpc/open_inquiry", function(r){
    sent = JSON.parse(r.request().postData() || "{}");
    if(mode === "ok")
      return r.fulfill({ status:200, contentType:"application/json",
                         body:'"IQ-261104-A1B2"' });
    return r.fulfill({ status:400, contentType:"application/json",
      body: JSON.stringify({ message:"무엇이 궁금하신지 다섯 글자 이상 적어 주세요" }) });
  });
  const csp = watch(p);
  await p.goto(URL, { waitUntil:"networkidle" });
  await p.waitForTimeout(260);
  ok("양식이 열린다", (await p.locator("#iqf").count()) === 1);

  /* ⚠️⚠️ 고르는 값이 **DB 의 check 제약과 같은 글자**인가.
     다르면 DB 가 "문의 종류를 골라 주세요" 로 거절하고, 손님은 골랐는데
     왜 안 되는지 모릅니다 (지난번 ?m=apple 자리와 같습니다). */
  const kinds = await p.evaluate(() => Array.prototype.map.call(
    document.querySelectorAll('#i-kind option'), e => e.value));
  ok("갈래 값이 DB 가 받는 넷과 같다",
     kinds.slice().sort().join(",") === "biz,etc,privacy,use", kinds.join(","));

  const agree = (await p.textContent(".agree")) || "";
  ok("수집 항목 · 이용 목적 · 보유 기간이 **같은 자리**에 있다",
     /수집 항목/.test(agree) && /이용 목적/.test(agree) && /보유 기간/.test(agree));
  ok("  보유 기간이 빈 칸이 아니다", /보유 기간[\s\S]{0,40}\d/.test(agree), agree.slice(0, 90));

  /* ⑤ 답을 보낼 길이 없으면 — ⚠️ 문과 **같은 말**로 막습니다 */
  console.log("\n── 답을 보낼 길이 없으면 보내지 않습니다");
  await p.fill("#i-body", "이용 중 막히는 곳이 있어 여쭙니다");
  await p.check("#i-agree");
  await p.click('#iqf button[type="submit"]');
  await p.waitForTimeout(260);
  ok("⚠️ 비로그인 + 연락처 없음이면 **보내지 않는다**", sent === null, JSON.stringify(sent));
  const m1 = (await p.textContent("#imsg")) || "";
  ok("  문이 거절하는 말과 **같은 말**로 막는다",
     m1.indexOf("메일 주소를 적어") >= 0, m1);

  /* ⑥~⑧ 제대로 적고 보냅니다 */
  console.log("\n── 적고 누르면 보냅니다");
  const opened = Date.now();
  await p.selectOption("#i-kind", "privacy");
  await p.fill("#i-name", "김손님");
  await p.fill("#i-tel", "010-1234-5678");
  await p.waitForTimeout(1100);             /* 연 시각과 누른 시각을 벌립니다 */
  await p.click('#iqf button[type="submit"]');
  await p.waitForTimeout(400);

  ok("보냈다", !!sent, sent);
  const pl = (sent || {}).p || {};
  ok("문의 칸 이름과 **같은 열쇠**로 보낸다",
     ["kind","body","name","tel","email","agree_at"]
       .every(k => k in pl), Object.keys(pl).join(","));
  ok("고른 갈래를 그대로 보낸다", pl.kind === "privacy", pl.kind);
  ok("적은 글을 그대로 보낸다",
     pl.body === "이용 중 막히는 곳이 있어 여쭙니다", pl.body);
  ok("⚠️ 동의 시각이 **누른 순간**이다 (화면을 연 시각이 아니다)",
     new Date(pl.agree_at).getTime() - opened > 900,
     (new Date(pl.agree_at).getTime() - opened) + "ms");

  /* ⑧ 접수번호 — ⚠️ 화면이 지어내지 않습니다 */
  const done = (await p.textContent("#inqbox")) || "";
  ok("접수했다고 말한다", /접수했습니다/.test(done), done.slice(0, 80));
  ok("⚠️ DB 가 돌려준 접수번호를 **그대로** 찍는다",
     done.indexOf("IQ-261104-A1B2") >= 0, done.slice(0, 160));
  /* ⚠️ 지킬 수 없는 약속을 하지 않습니다 (절대 규칙 5) */
  ok("⚠️ 언제까지 답한다고 **약속하지 않는다**",
     !/시간 안에|며칠|당일|영업일/.test(done), done);
  ok("CSP 거절 · 화면 에러가 0건이다", csp.length === 0, csp.join(" | "));
  await p.close();

  /* ⑨ DB 가 거절하면 */
  console.log("\n── DB 가 거절하면 그 말을 그대로 보여 줍니다");
  p = await b.newPage({ viewport:{ width:1280, height:900 } });
  await p.route("**/api/session", r => r.fulfill({ status:200,
    contentType:"application/json",
    body: JSON.stringify({ auth:true, signedIn:false,
                           conf:{ url:FAKE, anonKey:"anon-test-key" } }) }));
  await p.route(FAKE + "/rest/v1/rpc/open_inquiry", r => r.fulfill({
    status:400, contentType:"application/json",
    body: JSON.stringify({ message:"하루에 보내실 수 있는 문의 수를 넘었습니다" }) }));
  await p.goto(URL, { waitUntil:"networkidle" });
  await p.waitForTimeout(260);
  await p.fill("#i-body", "거절당하는 문의를 넣어 봅니다");
  await p.fill("#i-tel", "010-1234-5678");
  await p.check("#i-agree");
  await p.click('#iqf button[type="submit"]');
  await p.waitForTimeout(400);
  const m2 = (await p.textContent("#imsg")) || "";
  ok("DB 가 거절한 말을 **고쳐 쓰지 않고** 그대로 보여 준다",
     m2.indexOf("하루에 보내실 수 있는") >= 0, m2);
  ok("  다시 누를 수 있다 (단추가 잠긴 채 남지 않는다)",
     (await p.locator('#iqf button[type="submit"]:disabled').count()) === 0);
  await p.close();

  /* ⑩ 로그인하셨을 때 */
  console.log("\n── 로그인하셨으면 연락처가 선택입니다 — 그 사실을 말합니다");
  p = await b.newPage({ viewport:{ width:1280, height:900 } });
  await p.route("**/api/session", r => r.fulfill({ status:200,
    contentType:"application/json",
    body: JSON.stringify({ auth:true, signedIn:true, role:"customer", name:"김손님",
                           conf:{ url:FAKE, anonKey:"anon-test-key" } }) }));
  let sent2 = null;
  await p.route(FAKE + "/rest/v1/rpc/open_inquiry", function(r){
    sent2 = JSON.parse(r.request().postData() || "{}");
    return r.fulfill({ status:200, contentType:"application/json", body:'"IQ-261104-C3D4"' });
  });
  await p.goto(URL, { waitUntil:"networkidle" });
  await p.waitForTimeout(260);
  const reach = (await p.textContent(".iq-reach")) || "";
  ok("로그인하면 연락처가 선택이라고 **말한다**",
     /안 적으셔도 됩니다/.test(reach), reach);
  await p.fill("#i-body", "로그인하고 묻습니다");
  await p.check("#i-agree");
  await p.click('#iqf button[type="submit"]');
  await p.waitForTimeout(400);
  ok("⚠️ 로그인했으면 연락처 없이도 **보낸다**", !!sent2, sent2);
  await p.close();

  /* ⑪ 운영자 문의함 */
  console.log("\n── 문의함은 운영자만 봅니다");
  for(const who of [{ role:"customer", name:"손님" }, { role:"provider", name:"업체" }]){
    p = await b.newPage({ viewport:{ width:1280, height:900 } });
    await p.route("**/api/session", r => r.fulfill({ status:200,
      contentType:"application/json",
      body: JSON.stringify(Object.assign({ auth:true, signedIn:true,
        conf:{ url:FAKE, anonKey:"anon-test-key" } }, who)) }));
    await p.goto("http://127.0.0.1:" + h.port + "/admin", { waitUntil:"networkidle" });
    await p.waitForTimeout(350);
    const t = (await p.textContent("#inqadm")) || "";
    ok(who.role + " 에게는 문의함이 **한 줄도 안 보인다**", t.trim() === "", t.slice(0, 80));
    await p.close();
  }
  p = await b.newPage({ viewport:{ width:1280, height:900 } });
  await p.route("**/api/session", r => r.fulfill({ status:200,
    contentType:"application/json",
    body: JSON.stringify({ auth:true, signedIn:true, role:"admin", name:"운영자",
                           conf:{ url:FAKE, anonKey:"anon-test-key" } }) }));
  await p.route(FAKE + "/rest/v1/inquiry*", r => r.fulfill({ status:200,
    contentType:"application/json",
    body: JSON.stringify([{ id:"11111111-1111-1111-1111-111111111111",
      no:"IQ-261104-A1B2", kind:"privacy",
      body:"<script>alert(1)</script> 내 정보를 지워 주세요",
      name:"김손님", tel:"010-1234-5678", email:null, by_user:null,
      state:"open", answer:null, created_at:"2026-11-04T01:00:00Z" }]) }));
  await p.goto("http://127.0.0.1:" + h.port + "/admin", { waitUntil:"networkidle" });
  await p.waitForTimeout(450);
  const at = (await p.textContent("#inqadm")) || "";
  ok("운영자는 문의를 본다", /IQ-261104-A1B2/.test(at), at.slice(0, 120));
  ok("  답을 보낼 곳을 같이 보여 준다", /010-1234-5678/.test(at), at.slice(0, 160));
  /* ⚠️⚠️ 손님이 쓴 글은 **날것으로 나가면 안 됩니다** (절대 규칙 4) */
  const raw = await p.evaluate(() =>
    (document.getElementById("inqadm") || {}).innerHTML || "");
  ok("⚠️⚠️ 손님이 쓴 글이 **esc() 를 지난다** (script 가 살아나지 않는다)",
     raw.indexOf("<script>") < 0 && at.indexOf("<script>alert(1)</script>") >= 0,
     raw.slice(0, 160));
  ok("  답변함 단추가 있다",
     (await p.locator('#inqadm button[data-qto="answered"]').count()) === 1);
  await p.close();

  await b.close(); h.srv.close();
  console.log("\n" + ran + "건 중 " + (ran - bad) + "건 통과 · " + bad + "건 실패");
  process.exit(bad ? 1 : 0);
})();
