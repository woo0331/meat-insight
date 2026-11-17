/* ════════════════════════════════════════════════════════════════════
   마이페이지 · 회원 계정 저장 — 로그인한 채로 눌러 봅니다

   ⚠️⚠️ **여기까지는 아무 검사도 안 닿고 있었습니다.** 전수 점검
   (check.js)이 /my 에서 보는 것은 "로그인이 설정되기 전에는 아무것도
   안 낸다" 하나입니다 — 그건 auth:false 쪽 절반이고, **auth:true 일
   때 무엇이 보이는가**는 브라우저로 한 번도 안 돌아 봤습니다.
   js/state.js 도 "fetch 0건" 만 재고 있었습니다.

   그래서 이 저장소가 여러 번 겪은 "데이터가 0 이면 그 기능은 아무
   검사도 안 받습니다" 가 그대로입니다 — api/me.js 가 고객 칸에서
   id 를 빠뜨려 견적 구간이 통째로 안 그려졌던 것도 같은 자리입니다.

     node tools/test-my.js

   ⚠️ 가짜 서버는 tools/test-admin.js 와 **같은 방식**입니다 (playwright
   route). ⚠️⚠️ **씨앗을 실제보다 후하게 만들지 않습니다** — 아래 칸
   목록은 api/me.js 의 PICK · 견적 질의를 글자까지 본뜬 것입니다.
   후하게 만들면 찍어 봐도 멀쩡하고 운영에서만 터집니다 (고객 칸의
   id 를 그렇게 놓쳤습니다).

   ⚠️ 저장소에는 아무것도 안 씁니다 — 가짜 신청 · 가짜 업체는 테스트
   브라우저 안에서만 살고 끝나면 사라집니다 (절대 규칙 1).
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..");

const srv = http.createServer((q, r) => {
  let f = decodeURIComponent(q.url.split("?")[0]);
  let p = path.join(ROOT, f);
  try { if (fs.statSync(p).isDirectory()) p = path.join(p, "index.html"); }
  catch (e) { p = path.join(ROOT, "404.html"); }
  try {
    const b = fs.readFileSync(p);
    const t = p.endsWith(".css") ? "text/css"
            : p.endsWith(".js") ? "text/javascript"
            : p.endsWith(".jpg") ? "image/jpeg"
            : p.endsWith(".webp") ? "image/webp" : "text/html";
    r.writeHead(200, { "content-type": t + "; charset=utf-8" }); r.end(b);
  } catch (e) { r.writeHead(404); r.end("x"); }
});

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ✅ " + name); }
  else { fail++; console.log("  ❌ " + name + (extra ? " — " + extra : "")); }
}

/* ── 씨앗 ──────────────────────────────────────────────────────────
   ⚠️ 접수번호 꼴은 api/_intake.js 의 A32 그대로입니다 (I · L · O · U 를
   뺀 Crockford base32) — 꼴이 다른 번호를 씨앗으로 쓰면 화면이 멀쩡해
   보이는데 실제 번호에서만 깨지는 자리가 생깁니다. */
const RQ_A = "11111111-1111-4111-8111-111111111111";
const RQ_B = "22222222-2222-4222-8222-222222222222";
const RQ_C = "33333333-3333-4333-8333-333333333333";
const PV_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const PV_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

/* 고객 — api/me.js 의 PICK.customer 칸만 */
const CUST_RQ = [
  { id:RQ_A, no:"SW-AB12-CD34", side:"start", cat:"interior",
    industry:"cafe", region:"gyeonggi", gu:"안양시", state:"quoted",
    want_at:null, created_at:"2026-10-18T02:00:00Z",
    assignment:[{ state:"accepted", created_at:"2026-10-18T03:00:00Z",
                  provider:{ id:PV_A, name:"가나다 인테리어" } },
                { state:"accepted", created_at:"2026-10-18T03:10:00Z",
                  provider:{ id:PV_B, name:"라마바 시공" } }],
    request_item:[{ id:"i1", service_id:"interior", state:"quoted" }],
    request_photo:[] },
  /* 배정 전 — ⚠️ 업체 상호가 나오면 안 되는 줄입니다 (제17조 제2항) */
  { id:RQ_B, no:"SW-EF56-GH78", side:"close", cat:"demolish",
    industry:"restaurant", region:"seoul", gu:"강남구", state:"check",
    want_at:null, created_at:"2026-10-19T02:00:00Z",
    assignment:[], request_item:[], request_photo:[] }
];
/* 견적 — api/me.js 의 qp + provider(id,name) */
const CUST_Q = [
  { id:"q1", request_id:RQ_A, provider_id:PV_A, amount:4200000, vat:"excl",
    scope:"철거 · 바닥 · 전기 · 도장", excludes:"간판 · 주방기기",
    days:12, start_on:"2026-11-03", warranty:"시공 후 1년",
    valid_to:"2026-11-20", note:"", state:"open",
    chosen_at:null, created_at:"2026-10-18T05:00:00Z",
    updated_at:"2026-10-18T05:00:00Z", provider:{ id:PV_A, name:"가나다 인테리어" } },
  { id:"q2", request_id:RQ_A, provider_id:PV_B, amount:3800000, vat:"incl",
    scope:"철거 · 바닥 · 도장", excludes:"전기 · 간판",
    days:9, start_on:"2026-11-10", warranty:"6개월",
    valid_to:"2026-11-15", note:"", state:"open",
    chosen_at:null, created_at:"2026-10-18T06:00:00Z",
    updated_at:"2026-10-18T06:00:00Z", provider:{ id:PV_B, name:"라마바 시공" } }
];

/* 업체 — PICK.provider (성함 · 연락처가 옵니다. 그게 배정입니다) */
const PV_RQ = [
  { id:RQ_A, no:"SW-AB12-CD34", side:"start", cat:"interior",
    industry:"cafe", region:"gyeonggi", gu:"안양시", state:"consult",
    want_at:null, body:"18평 카페 전체 시공을 생각하고 있습니다.",
    detail:{}, created_at:"2026-10-18T02:00:00Z",
    name:"김사장", tel:"010-1234-5678", email:"a@b.c",
    assignment:[{ state:"accepted", why:null, created_at:"2026-10-18T03:00:00Z" }],
    request_item:[{ id:"i1", service_id:"interior", state:"consult" }],
    request_photo:[] },
  /* 배정만 받고 아직 수락 안 한 줄 — ⚠️ 견적 내기 단추가 없어야 합니다 */
  { id:RQ_C, no:"SW-JK90-MN12", side:"start", cat:"equip",
    industry:"cafe", region:"gyeonggi", gu:"군포시", state:"assigned",
    want_at:null, body:"", detail:{}, created_at:"2026-10-19T02:00:00Z",
    name:"이사장", tel:"031-000-0000", email:"",
    assignment:[{ state:"sent", why:null, created_at:"2026-10-19T03:00:00Z" }],
    request_item:[], request_photo:[] }
];
const PV_Q = [
  { id:"q1", request_id:RQ_A, provider_id:PV_A, amount:4200000, vat:"excl",
    scope:"철거 · 바닥 · 전기 · 도장", excludes:"간판", days:12,
    start_on:"2026-11-03", warranty:"시공 후 1년", valid_to:"2026-11-20",
    note:"", state:"open", chosen_at:null,
    created_at:"2026-10-18T05:00:00Z", updated_at:"2026-10-18T05:00:00Z" }
];
const PV_DEAL = [
  { id:"d1", request_id:RQ_A, provider_id:PV_A, amount:4200000,
    fee:126000, fee_vat:12600, fee_total:138600, paid:100000,
    paid_at:"2026-10-20T01:00:00Z", signed_at:"2026-10-19T01:00:00Z",
    done_at:"2026-10-19T09:00:00Z", fee_at:"2026-10-19T10:00:00Z",
    fee_snap:{ type:"rate", rate:3 }, created_at:"2026-10-19T01:00:00Z",
    request:{ no:"SW-AB12-CD34", side:"start", cat:"interior",
              industry:"cafe", region:"gyeonggi", gu:"안양시", state:"fee_wait" } }
];

/* 직원 · 관리자 — PICK.staff (⚠️ 성함 · 연락처가 **없습니다**) */
function deskRq(states){
  return states.map(function(s, i){
    return { id:"r" + i, no:"SW-ZZ" + i + "0-ZZ" + i + "0", side: i % 2 ? "close" : "start",
      cat:"interior", industry:"cafe", region:"seoul", gu:"강남구",
      state:s, created_at:"2026-10-1" + (i % 9) + "T02:00:00Z",
      assignment:[], request_item:[], request_photo:[] };
  });
}
/* 관리자 — 계약 둘. ⚠️ 하나는 **수수료 확정 전**입니다 (미수금에 그
   계약금액이 섞이면 받을 돈이 열 배로 부풀려집니다 · §10) */
const ADM_DEAL = [
  { id:"d1", request_id:RQ_A, provider_id:PV_A, amount:10000000,
    fee:300000, fee_vat:30000, fee_total:330000, paid:165000,
    paid_at:"2026-10-20T01:00:00Z", signed_at:"2026-10-19T01:00:00Z",
    done_at:"2026-10-19T09:00:00Z", fee_at:"2026-10-19T10:00:00Z",
    fee_snap:{ type:"rate", rate:3 }, created_at:"2026-10-19T01:00:00Z",
    request:{ no:"SW-AB12-CD34", side:"start", cat:"interior",
              industry:"cafe", region:"seoul", gu:"강남구", state:"fee_wait" } },
  { id:"d2", request_id:RQ_B, provider_id:PV_B, amount:50000000,
    fee:null, fee_vat:null, fee_total:null, paid:null, paid_at:null,
    signed_at:"2026-10-20T01:00:00Z", done_at:null, fee_at:null,
    fee_snap:null, created_at:"2026-10-20T01:00:00Z",
    request:{ no:"SW-EF56-GH78", side:"close", cat:"demolish",
              industry:"restaurant", region:"seoul", gu:"강남구", state:"signed" } }
];

(async () => {
  await new Promise(r => srv.listen(0, r));
  const base = "http://127.0.0.1:" + srv.address().port;
  const br = await chromium.launch();

  /* 한 역할로 /my 를 엽니다. me 는 /api/me 가 돌려줄 몸통입니다. */
  async function openMy(sess, me, opt) {
    opt = opt || {};
    const ctx = await br.newContext({ viewport: opt.viewport ||
      { width:1440, height:900 } });
    const pg = await ctx.newPage();
    const errs = [], sent = [];
    pg.on("pageerror", e => errs.push(String(e)));
    pg.on("console", m => {
      if (m.type() !== "error") return;
      const t = m.text() + " " + (((m.location() || {}).url) || "");
      if (/\/api\//.test(t)) return;   /* 로컬 정적 서버에는 Vercel 함수가 없습니다 */
      if (/fonts|jsdelivr|Failed to load resource/.test(t)) return;
      errs.push("console: " + t);
    });
    /* ⚠️⚠️ **질의문자가 붙는 주소를 빠뜨리지 마세요.** /api/me 는
       ?s=1(메모장) · ?r=(이력)이 붙습니다 — 별표 둘 없이 적으면
       그 둘이 가짜 서버를 안 지나고, 가짜 서버가 대답을 안 해서
       **엉뚱한 자리의 타임아웃**으로 터집니다 (/admin 에서 겪은 자리). */
    await pg.route("**/api/session", r => {
      sent.push("session");
      r.fulfill({ status:200, contentType:"application/json",
        body: JSON.stringify(sess) });
    });
    await pg.route("**/api/me**", r => {
      sent.push("me:" + (r.request().url().split("/api/me")[1] || ""));
      r.fulfill({ status:200, contentType:"application/json",
        body: JSON.stringify(me) });
    });
    await pg.route("**/api/deal", r => {
      let b = {}; try { b = JSON.parse(r.request().postData() || "{}"); } catch (e) {}
      sent.push("deal:" + (b.fn || "?") + ":" + JSON.stringify(b.args || {}));
      r.fulfill({ status:200, contentType:"application/json",
        body: JSON.stringify({ ok:true }) });
    });
    if (opt.before) await pg.addInitScript(opt.before);
    await pg.goto(base + (opt.path || "/my"), { waitUntil:"networkidle" });
    await pg.waitForTimeout(420);
    return { ctx, pg, errs, sent };
  }

  const dbTxt = pg => pg.evaluate(() => {
    const b = document.getElementById("my-db");
    return b ? (b.hidden ? "" : b.textContent) : null;
  });
  const n = (pg, sel) => pg.evaluate(s => document.querySelectorAll(s).length, sel);

  /* ══ ① 로그인이 꺼져 있으면 한 픽셀도 안 그립니다 ══════════════ */
  console.log("\n① 로그인이 꺼져 있으면 (auth:false)");
  {
    const { ctx, pg, errs, sent } = await openMy(
      { auth:false, signedIn:false }, { auth:false, signedIn:false });
    const h = await pg.evaluate(() => {
      const b = document.getElementById("my-db");
      return b ? { hid:b.hidden, html:b.innerHTML, hh:b.getBoundingClientRect().height } : null;
    });
    ok("#my-db 가 hidden 이고 비어 있다", h && h.hid && h.html === "",
        h && JSON.stringify(h).slice(0, 90));
    ok("높이가 0 이다", h && h.hh === 0, h && String(h.hh));
    ok("'로그인' 이라는 글자가 화면에 없다",
        !(await pg.evaluate(() => document.getElementById("view").textContent)).includes("로그인"));
    /* ⚠️⚠️ state.js 가 /api/me?s=1 을 **한 번도 안 보내야** 합니다 —
       보내기 시작하면 화면마다 왕복이 하나 늘고 손님은 아무것도 못
       얻은 채 그만큼 느려집니다.
       ⚠️ /my 자신은 질의문자 없이 /api/me 를 한 번 부릅니다 (myLoadDb) —
       그건 이 화면이 원래 하는 일이고 state.js 가 아닙니다. 처음에
       그 하나를 state.js 것으로 잡아 멀쩡한 코드를 실패로 냈습니다. */
    ok("state.js 가 /api/me?s=1 을 안 부른다",
        !sent.some(x => x.indexOf("me:?s=1") >= 0), sent.join(" | "));
    /* ⚠️⚠️ 세션 묻기는 **화면마다 한 번**입니다. 부르는 쪽이 셋
       (헤더 chrome.js · 메모장 state.js · 이 화면 my.js)인데
       `amAuthAsk()` 의 `asked` 깃발이 답이 온 뒤에 켜져서, 같은 틱에
       셋이 다 빠져나가고 있었습니다 — 재 보니 2~3번이었습니다.
       DB 를 켜시면 그만큼이 그대로 Supabase 호출이 됩니다. */
    ok("/api/session 을 한 번만 부른다",
        sent.filter(x => x === "session").length === 1,
        sent.filter(x => x === "session").length + "번 · " + sent.join(" | "));
    ok("JS 에러 0", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ══ ② 설정은 됐는데 아직 안 들어오셨으면 ══════════════════════ */
  console.log("\n② 설정은 됐고 아직 안 들어오셨으면 (signedIn:false)");
  {
    const { ctx, pg, errs } = await openMy(
      { auth:true, signedIn:false, conf:{ url:"https://x.supabase.co", anon:"k" } },
      { auth:true, signedIn:false });
    const t = await dbTxt(pg);
    ok("로그인 칸이 나온다", !!t && t.includes("로그인"), String(t).slice(0, 60));
    ok("메일 칸과 단추가 있다", (await n(pg, "#my-em")) === 1 &&
        (await n(pg, ".my-in button[type=submit]")) === 1);
    /* ⚠️ 비밀번호를 받지 않습니다 — 받는 순간 저장 · 재설정 · 유출
       대비가 전부 따라옵니다 */
    ok("비밀번호 칸이 없다", (await n(pg, "input[type=password]")) === 0);
    ok("JS 에러 0", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ══ ③ 고객 ══════════════════════════════════════════════════════ */
  console.log("\n③ 고객 — 내 신청 · 받은 견적 · ⚠️ 수수료는 안 보입니다");
  {
    const { ctx, pg, errs } = await openMy(
      { auth:true, signedIn:true, role:"customer" },
      { auth:true, signedIn:true, role:"customer",
        requests:CUST_RQ, quotes:CUST_Q, state:null });
    const t = await dbTxt(pg);
    ok("신청 두 줄이 그려진다", (await n(pg, ".myq-l > .myq")) === 2);
    ok("접수번호가 보인다", !!t && t.includes("SW-AB12-CD34"));
    ok("상태 딱지가 이름으로 나온다 (영어가 아님)",
        !!t && t.includes("견적 전달") && !t.includes("quoted"));
    /* ⚠️⚠️ 배정된 줄에만 업체 상호 — 정해지기 전에 적으면 정해지지도
       않은 곳을 알려 주는 것입니다 (제17조 제2항) */
    ok("배정된 줄에 업체 상호가 보인다", (await n(pg, ".myq-pv")) === 1,
        "줄 둘 중 하나여야 합니다");
    ok("배정 전인 줄에는 상호가 없다", (await pg.evaluate(() =>
        document.querySelectorAll(".myq-l > .myq")[1].querySelectorAll(".myq-pv").length)) === 0);
    /* 견적 비교 */
    ok("받은 견적 둘이 나란히 놓인다", (await n(pg, ".myqt-c")) === 2);
    ok("업체 상호 · 금액 · 범위가 보인다",
        !!t && t.includes("가나다 인테리어") && t.includes("4,200,000") &&
        t.includes("철거 · 바닥 · 전기 · 도장"));
    ok("고르는 단추가 견적마다 있다",
        (await n(pg, ".myqt-c button[onclick^='myqPick']")) === 2);
    /* ⚠️⚠️ 금액순으로 줄 세우지 않습니다 — 줄을 세우면 그 순서가 곧
       추천이 됩니다 (약관 제6조 제4항 · "최저가" 는 금지 문구) */
    ok("등록된 차례로 냅니다 (싼 것이 위로 올라오지 않았다)",
        (await pg.evaluate(() => [].map.call(
          document.querySelectorAll(".myqt-pv"), e => e.textContent).join(">")))
          === "가나다 인테리어>라마바 시공");
    ok("금액순으로 줄 세우지 않는다는 줄이 있다",
        !!t && t.includes("금액순으로 줄 세우지 않습니다"));
    ok("'가장 저렴한' · '최저가' 딱지가 없다",
        !!t && !t.includes("가장 저렴") && !t.includes("최저가"));
    /* ⚠️⚠️ **핵심** — 우리와 업체 사이의 돈이 고객 화면에 보이면
       자기가 내는 돈으로 읽힙니다. api/me.js 가 묻지도 않습니다. */
    ok("수수료 · 정산 · 계약 구간이 아예 없다",
        !!t && !t.includes("수수료") && !t.includes("정산") &&
        !t.includes("내 계약"),
        (t || "").slice(0, 0) + "보이면 안 되는 말이 있습니다");
    ok("나가는 길(나가기)이 같이 있다",
        (await n(pg, ".my-out button[onclick='mySignOut()']")) === 1);
    ok("JS 에러 0", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ══ ③-3 로그인 전에 넣은 신청 가져오기 (2026-10-22 P1 ⑩) ═══════
     ⚠️⚠️ 서버 · DB 는 2026-10-08 에 완성됐고 **화면이 0** 이었습니다 —
     로그인 전에 넣은 신청을 영영 못 보는 상태였습니다. */
  console.log("\n③-3 고객 — 로그인 전에 넣은 신청 가져오기 (P1 ⑩)");
  {
    const { ctx, pg, errs, sent } = await openMy(
      { auth:true, signedIn:true, role:"customer" },
      { auth:true, signedIn:true, role:"customer",
        requests:CUST_RQ, quotes:CUST_Q, state:null });
    ok("가져오기 칸이 있다", (await n(pg, ".my-claim")) === 1);
    /* ⚠️ 접힌 채로 섭니다 — 모든 손님의 일이 아니고, 펼치지 않으면
       신청 목록이 그만큼 위로 올라옵니다 */
    ok("접힌 채로 선다",
        (await pg.evaluate(() => !document.querySelector(".my-claim").open)) === true);
    const sum = await pg.locator(".my-claim > summary");
    const sb = await sum.boundingBox();
    ok("여는 단추가 48px 이상이다", sb && sb.height >= 48, sb && sb.height);
    await sum.click();
    await pg.waitForTimeout(160);
    /* ⚠️⚠️ **둘 다** 받습니다 — 번호만으로는 남의 신청이 열립니다 */
    ok("신청번호와 연락처 둘을 받는다",
        (await n(pg, "#my-cno")) === 1 && (await n(pg, "#my-ctel")) === 1);
    ok("번호 칸이 required 다",
        (await pg.getAttribute("#my-cno", "required")) !== null &&
        (await pg.getAttribute("#my-ctel", "required")) !== null);
    /* ⚠️ 폰에서 숫자 자판이 뜨게 */
    ok("연락처 칸이 tel 이다",
        (await pg.getAttribute("#my-ctel", "type")) === "tel" &&
        (await pg.getAttribute("#my-ctel", "autocomplete")) === "tel");
    const ct = await pg.locator(".my-claim").textContent();
    ok("둘이 다 맞아야 한다고 적는다", ct.includes("둘이 다 맞아야"), ct.slice(0, 220));

    /* 비워 두고 누르면 **보내지 않습니다** (required 를 지나쳐도) */
    const before = sent.filter(x => x.indexOf("deal:") === 0).length;
    await pg.evaluate(() => window.myClaim({ preventDefault(){}, target:
      document.querySelector(".my-claim form") }));
    await pg.waitForTimeout(200);
    ok("비워 두고 부르면 보내지 않는다",
        sent.filter(x => x.indexOf("deal:") === 0).length === before,
        sent.filter(x => x.indexOf("deal:") === 0).join(" | "));
    ok("무엇이 모자란지 그 자리에서 말한다",
        (await pg.textContent("#my-cn")).indexOf("둘 다") >= 0,
        await pg.textContent("#my-cn"));

    /* 적고 누르면 `claim_request` 로 갑니다 */
    await pg.fill("#my-cno", "sw ab12 cd34");
    await pg.fill("#my-ctel", "010-7777-0000");
    await pg.locator(".my-claim form button[type=submit]").click();
    await pg.waitForTimeout(320);
    const call = sent.filter(x => x.indexOf("deal:claim_request:") === 0)[0];
    ok("claim_request 로 간다", !!call, sent.join(" | "));
    /* ⚠️ 번호는 `SW` 머리까지 그대로 보냅니다 — 줄표 · 띄어쓰기 ·
       소문자는 서버(`reqNoClean()`)와 DB 가 알아봅니다 */
    ok("적으신 그대로 보낸다 (씻는 일은 서버가 합니다)",
        !!call && call.indexOf("sw ab12 cd34") > 0 &&
        call.indexOf("010-7777-0000") > 0, call);
    ok("가져온 뒤 다시 묻는다",
        sent.filter(x => x.indexOf("me:") === 0).length >= 2,
        sent.filter(x => x.indexOf("me:") === 0).join(" | "));
    ok("JS 에러 0", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ⚠️⚠️ **틀린 까닭을 갈라서 말하지 않습니다** — "그런 번호는 없습니다"
     와 "연락처가 다릅니다" 를 갈라 주면 번호가 있는지를 확인해 가며
     긁을 수 있습니다. DB 가 한 가지 말로만 거절하고(0005), 화면은
     **그 말을 그대로** 냅니다 (운영자 글을 섞지 않습니다 · 절대 규칙 3). */
  console.log("\n③-4 가져오기가 거절당하면");
  {
    const ctx = await br.newContext({ viewport:{ width:1440, height:900 } });
    const pg = await ctx.newPage();
    const errs = [];
    pg.on("pageerror", e => errs.push(String(e)));
    await pg.route("**/api/session", r => r.fulfill({ status:200,
      contentType:"application/json", body: JSON.stringify(
        { auth:true, signedIn:true, role:"customer" }) }));
    await pg.route("**/api/me**", r => r.fulfill({ status:200,
      contentType:"application/json", body: JSON.stringify(
        { auth:true, signedIn:true, role:"customer", requests:[], quotes:[],
          state:null }) }));
    await pg.route("**/api/deal", r => r.fulfill({ status:400,
      contentType:"application/json", body: JSON.stringify(
        { error:"신청번호와 연락처가 맞지 않습니다" }) }));
    await pg.goto(base + "/my", { waitUntil:"networkidle" });
    await pg.waitForTimeout(420);
    await pg.locator(".my-claim > summary").click();
    await pg.fill("#my-cno", "SW-ZZZZ-ZZZZ");
    await pg.fill("#my-ctel", "010-0000-0000");
    await pg.locator(".my-claim form button[type=submit]").click();
    await pg.waitForTimeout(320);
    const note = await pg.textContent("#my-cn");
    ok("DB 가 거절한 그 말을 그대로 낸다",
        note.indexOf("신청번호와 연락처가 맞지 않습니다") >= 0, note);
    /* ⚠️⚠️ **어느 쪽이 틀렸는지 알려 주지 않습니다** */
    ok("번호가 있는지 없는지를 갈라 말하지 않는다",
        note.indexOf("없는 번호") < 0 && note.indexOf("연락처가 다") < 0, note);
    ok("단추가 다시 눌릴 수 있게 돌아온다",
        (await pg.getAttribute(".my-claim form button[type=submit]", "disabled")) === null);
    ok("적으신 것이 날아가지 않는다",
        (await pg.inputValue("#my-cno")) === "SW-ZZZZ-ZZZZ");
    ok("JS 에러 0", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* 이미 고른 뒤 — ⚠️ 누를 때마다 거절당하는 단추를 만들지 않습니다 */
  console.log("\n③-2 고객 — 이미 고른 뒤");
  {
    const q = JSON.parse(JSON.stringify(CUST_Q));
    q[0].state = "chosen"; q[0].chosen_at = "2026-10-19T01:00:00Z";
    q[1].state = "passed";
    const { ctx, pg, errs } = await openMy(
      { auth:true, signedIn:true, role:"customer" },
      { auth:true, signedIn:true, role:"customer",
        requests:CUST_RQ, quotes:q, state:null });
    const t = await dbTxt(pg);
    ok("고르는 단추가 하나도 없다",
        (await n(pg, "button[onclick^='myqPick']")) === 0);
    ok("고른 견적과 고르지 않은 견적을 갈라서 말한다",
        !!t && t.includes("고른 견적") && t.includes("고르지 않음"));
    /* ⚠️ passed(고객이 다른 곳을 골랐다)와 withdrawn(업체가 거뒀다)을
       한 가지로 묶지 마세요 — "왜 없어졌나" 를 아무도 못 댑니다 */
    ok("'업체가 거둠' 과 섞이지 않았다", !!t && !t.includes("업체가 거둠"));
    ok("JS 에러 0", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ══ ④ 업체 ══════════════════════════════════════════════════════ */
  console.log("\n④ 업체 — 배정받은 신청 · 견적 내기 · 내 계약");
  {
    const { ctx, pg, errs } = await openMy(
      { auth:true, signedIn:true, role:"provider" },
      { auth:true, signedIn:true, role:"provider",
        requests:PV_RQ, quotes:PV_Q, deals:PV_DEAL, state:null });
    const t = await dbTxt(pg);
    ok("배정받은 신청 둘", (await n(pg, "#my-db > .w > .myq-l > .myq")) === 2);
    /* ⚠️ 배정이 곧 제3자 제공이고 동의 시각이 assignment 에 남습니다 —
       그래서 여기 성함 · 연락처가 있는 것이 맞습니다 */
    ok("성함과 연락처가 보인다", !!t && t.includes("김사장") && t.includes("010-1234-5678"));
    ok("전화가 실제로 걸린다 (숫자만 남긴 tel:)",
        (await pg.getAttribute(".myq-tel", "href")) === "tel:01012345678");
    ok("적어 주신 내용이 보인다", !!t && t.includes("18평 카페"));
    /* 견적 — 상담 중인 줄에만 단추 */
    ok("내가 낸 견적이 보인다", !!t && t.includes("내가 낸 견적") && t.includes("4,200,000"));
    ok("견적 고치기 · 거두기 단추가 있다",
        (await n(pg, "button[onclick^='myqOpen']")) >= 1 &&
        (await n(pg, "button[onclick^='myqDrop']")) >= 1);
    /* ⚠️⚠️ 배정만 받고 수락 전인 줄 — DB 가 거절하는 길에 단추를
       내면 누를 때마다 실패합니다 */
    /* ⚠️ 신청 목록과 **계약 목록이 같은 .myq-l** 입니다 — 통째로
       집으면 마지막 줄이 계약이라 엉뚱한 자리를 재게 됩니다 (처음에
       그렇게 적어 멀쩡한 화면을 실패로 냈습니다).
       ⚠️⚠️ :first-of-type 으로는 안 갈립니다 — **부모마다 따로** 세기
       때문에 계약 목록도 자기 부모 안에서는 첫 ul 입니다. 신청 목록은
       .w 의 바로 아래 자식이고 계약 목록은 .my-next 안이라, 자리로
       갈라야 맞습니다. */
    ok("수락 전인 줄에는 단추 대신 까닭이 있다", await pg.evaluate(() => {
      const li = document.querySelectorAll("#my-db > .w > .myq-l > .myq");
      const last = li[li.length - 1];
      return last.querySelectorAll("button[onclick^='myqOpen']").length === 0 &&
             /배정을 수락하시면/.test(last.textContent);
    }));
    ok("내 계약 · 수수료가 보인다", !!t && t.includes("내 계약") && t.includes("수수료 확정"));
    ok("정산 대기 · 남은 금액을 센다", !!t && t.includes("남은 금액") && t.includes("38,600"));
    ok("수수료 정책이 사본으로 남는다는 줄이 있다",
        !!t && t.includes("그 계약을 맺을 때의"));
    ok("JS 에러 0", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ══ ④-3 업체가 스스로 고치는 화면 (2026-10-22 P2 ⑳) ═══════════ */
  console.log("\n④-3 업체 — 내 업체 정보를 스스로 고칩니다");
  {
    const MINE = { id:"ganada-interior", name:"가나다 인테리어",
      intro:"안양에서 12년 했습니다",
      regions:["gyeonggi"], gu:["안양시","군포시"], industries:["cafe"],
      subs:["interior","design"], since:2014, consult_hours:"평일 09~18",
      verified:{ biz:true }, listed:true, assignable:true };
    const CON = { provider_id:"ganada-interior", name:"박실장",
      tel:"010-2222-3333", email:"park@test.invalid", memo:"오전에 연락" };
    const { ctx, pg, errs, sent } = await openMy(
      { auth:true, signedIn:true, role:"provider" },
      { auth:true, signedIn:true, role:"provider",
        requests:PV_RQ, quotes:[], deals:[], mine:MINE, myContact:CON });
    /* ⚠️ `sent` 는 **글자 배열**입니다 (`deal:<fn>:<args json>`) —
       함수로 부르면 터지고 어느 검사가 틀렸는지도 안 나옵니다. */
    const lastDeal = function(){
      const L = sent.filter(function(x){ return x.indexOf("deal:") === 0; });
      if(!L.length) return null;
      const x = L[L.length - 1], i = x.indexOf(":", 5);
      try{ return { fn:x.slice(5, i), args:JSON.parse(x.slice(i + 1)) }; }
      catch(e){ return { fn:x.slice(5, i), args:{} }; }
    };
    const t = await dbTxt(pg);
    ok("내 업체 정보 구간이 있다", (await n(pg, ".my-pv")) === 1);
    /* ⚠️⚠️ 지금 적힌 값을 **되읽어야** 합니다 — 모르면 소개를 고치려는
       분이 처음부터 다시 적습니다. */
    ok("지금 적힌 소개가 칸에 들어 있다",
        (await pg.inputValue("#pvs-intro")) === "안양에서 12년 했습니다");
    ok("시군구가 쉼표로 들어 있다",
        (await pg.inputValue("#pvs-gu")) === "안양시, 군포시");
    ok("문 연 해 · 상담 시간이 들어 있다",
        (await pg.inputValue("#pvs-since")) === "2014" &&
        (await pg.inputValue("#pvs-hrs")) === "평일 09~18");
    ok("고른 지역 · 업종이 켜져 있다", await pg.evaluate(() => {
      const r = [].filter.call(document.getElementById("pvs-reg").options,
                               o => o.selected).map(o => o.value);
      const i = [].filter.call(document.getElementById("pvs-ind").options,
                               o => o.selected).map(o => o.value);
      return r.join() === "gyeonggi" && i.join() === "cafe";
    }));
    /* ⚠️⚠️ **못 고치는 넷** — 적는 칸이 아예 없어야 합니다 (있으면
       눌러 보고 "왜 안 되나" 가 됩니다). */
    /* ⚠️ `.my-pv input[id*=name]` 로 집으면 **담당자 성함 칸**(#pvc-name)
       까지 걸립니다 — 멀쩡한 화면을 실패로 잡았습니다 (검사가 틀린
       자리). 업체 정보 **폼 안**만 봅니다. */
    ok("상호 · 하는 일 · 공개 · 확인은 보여만 준다",
        (await n(pg, ".my-pv-fix dt")) === 4 &&
        (await n(pg, ".my-pv form:nth-of-type(1) [id*=name]")) === 0 &&
        (await n(pg, ".my-pv form:nth-of-type(1) [id*=subs]")) === 0 &&
        (await n(pg, ".my-pv form:nth-of-type(1) [id*=listed]")) === 0);
    ok("그 넷이 왜 회색인지 적는다",
        !!t && t.includes("위 넷은 여기서 못 고칩니다"));
    ok("확인된 것을 보여 준다", !!t && t.includes("사업자"), t && t.slice(0, 80));
    /* ⚠️⚠️ 담당자는 **손님에게 안 보인다**고 그 자리에서 말합니다 */
    ok("담당자 칸에 지금 값이 들어 있다",
        (await pg.inputValue("#pvc-name")) === "박실장" &&
        (await pg.inputValue("#pvc-tel")) === "010-2222-3333");
    ok("담당자가 손님에게 안 보인다고 적는다",
        !!t && t.includes("손님에게는 보이지 않습니다"));

    /* ── 저장 — 보내는 몸통을 잽니다 ─────────────────────────── */
    await pg.fill("#pvs-intro", "열두 해 했습니다");
    await pg.fill("#pvs-gu", " 안양시 ,, 수원시 ");
    await pg.click(".my-pv form:nth-of-type(1) button");
    await pg.waitForTimeout(400);
    let b = lastDeal();
    ok("save_provider_self 로 간다", !!b && b.fn === "save_provider_self", b);
    /* ⚠️⚠️ **업체 id 를 안 보냅니다** — 토큰으로 본 my_provider() 하나만
       고칩니다 (보낸 id 를 믿으면 남의 업체를 덮습니다). */
    ok("업체 id 를 안 보낸다",
        !!b && b.args.p_id === undefined && b.args.p_provider === undefined, b);
    ok("고친 소개가 실린다",
        !!b && b.args.p_data.intro === "열두 해 했습니다", b && b.args);
    /* ⚠️ 쉼표의 **빈 토막**을 버립니다 — 빈 문자열이 들어가면 거르개에서
       아무것도 안 걸리는 값이 하나 섞입니다. */
    ok("시군구의 빈 토막을 버린다",
        !!b && b.args.p_data.gu.join("|") === "안양시|수원시", b && b.args.p_data.gu);
    /* ⚠️⚠️ **여럿 고르는 칸은 `.value` 가 첫 하나뿐**입니다 — 그대로
       쓰면 지역이 늘 한 곳이 됩니다. */
    await pg.selectOption("#pvs-reg", ["gyeonggi", "seoul"]);
    await pg.click(".my-pv form:nth-of-type(1) button");
    await pg.waitForTimeout(400);
    b = lastDeal();
    ok("여럿 고른 지역이 다 실린다",
        !!b && b.args.p_data.regions.length === 2, b && b.args.p_data.regions);
    /* ⚠️⚠️ 승인 대상 칸을 **보내지 않습니다** */
    ok("상호 · 하는 일 · 공개를 안 보낸다", !!b &&
        b.args.p_data.name === undefined && b.args.p_data.subs === undefined &&
        b.args.p_data.listed === undefined &&
        b.args.p_data.verified === undefined &&
        b.args.p_data.assignable === undefined, b && b.args.p_data);

    /* 담당자 — ⚠️ 업체 id 를 보내지만 DB 가 my_provider() 와 맞춰 봅니다 */
    await pg.fill("#pvc-name", "최실장");
    await pg.click(".my-pv form:nth-of-type(2) button");
    await pg.waitForTimeout(400);
    b = lastDeal();
    ok("담당자는 save_provider_contact 로 간다",
        !!b && b.fn === "save_provider_contact" &&
        b.args.p_provider === "ganada-interior", b);
    ok("고친 담당자 성함이 실린다",
        !!b && b.args.p_data.name === "최실장", b && b.args.p_data);
    /* ⚠️⚠️ 메일 꼴을 **화면에서도** 봅니다. `type="email"` 은 폼 제출을
       막아 주지만 **함수를 직접 부르면 그냥 지나갑니다** — 이 저장소의
       접수 폼과 같은 규칙입니다. 그래서 단추를 누르는 것이 아니라
       그 길로 들어가 봅니다 (단추는 브라우저가 먼저 막습니다). */
    await pg.fill("#pvc-mail", "abc");
    const before = sent.length;
    await pg.evaluate(() => window.myPvCon({ preventDefault:function(){},
                                             target:document.querySelector(".my-pv form:nth-of-type(2)") }));
    await pg.waitForTimeout(300);
    ok("메일 꼴이 이상하면 안 보낸다",
        /메일 주소를 확인/.test(await pg.textContent("#pvc-n")) &&
        sent.length === before,
        await pg.textContent("#pvc-n"));
    ok("JS 에러 0", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ⚠️⚠️ 업체 줄이 안 오면 **구간째 뺍니다** (절대 규칙 2) */
  console.log("\n④-4 업체 — 내 업체 줄이 안 오면 구간째 뺍니다");
  {
    const { ctx, pg, errs } = await openMy(
      { auth:true, signedIn:true, role:"provider" },
      { auth:true, signedIn:true, role:"provider",
        requests:[], quotes:[], deals:[], mine:null });
    ok("내 업체 정보 구간이 아예 없다", (await n(pg, ".my-pv")) === 0);
    const t = await dbTxt(pg);
    ok("자리표시자를 안 찍는다", !!t && !/내 업체 정보/.test(t), t && t.slice(0, 80));
    ok("JS 에러 0", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* 고객이 고른 견적 — ⚠️ 조용히 말을 바꾸는 일을 막습니다 */
  console.log("\n④-2 업체 — 고객이 고른 견적은 못 고칩니다");
  {
    const q = JSON.parse(JSON.stringify(PV_Q)); q[0].state = "chosen";
    const { ctx, pg, errs } = await openMy(
      { auth:true, signedIn:true, role:"provider" },
      { auth:true, signedIn:true, role:"provider",
        requests:PV_RQ, quotes:q, deals:[], state:null });
    const t = await dbTxt(pg);
    ok("고치기 · 거두기 단추가 없다",
        (await n(pg, "button[onclick^='myqOpen']")) === 0 &&
        (await n(pg, "button[onclick^='myqDrop']")) === 0);
    ok("담당자에게 알리라고 적는다", !!t && t.includes("담당자에게"));
    ok("JS 에러 0", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ══ ⑤ 직원 — 돈은 안 보입니다 ══════════════════════════════════ */
  console.log("\n⑤ 직원 — 퍼널 · 쪽별 · 전환율 (⚠️ 돈은 안 보입니다)");
  {
    /* 신청 여덟 — 계약 둘(signed · done) · 취소 하나 · 보류 하나 */
    const L = deskRq(["new","check","assigned","consult",
                      "signed","done","lost","hold"]);
    const { ctx, pg, errs } = await openMy(
      { auth:true, signedIn:true, role:"staff" },
      { auth:true, signedIn:true, role:"staff",
        requests:L, quotes:[], providers:[], state:null });
    const t = await dbTxt(pg);
    ok("접수 현황이라고 적는다 (관리자 작업대가 아님)",
        !!t && t.includes("접수 현황") && !t.includes("관리자 작업대"));
    ok("퍼널 칸이 그려진다", (await n(pg, ".myk-g > .myk")) >= 8);
    /* ⚠️⚠️ **전환율이 보류 · 취소를 계약으로 세면 안 됩니다.**
       여덟 중 계약 이후는 signed · done 둘이라 25% 입니다 — 번호로
       자르면 lost(10) · hold(11)까지 걸려 50% 가 됩니다. */
    ok("계약까지 간 비율이 25% 다 (보류 · 취소가 안 섞였다)",
        !!t && t.includes("25%"), (t || "").match(/\d+%/g));
    ok("창업 넷 · 폐업 넷을 센다", !!t && /창업 쪽/.test(t) && /4건/.test(t));
    /* ⚠️ 돈은 관리자만입니다 (api/me.js 가 직원에게는 묻지도 않습니다) */
    ok("수수료 · 정산 구간이 없다",
        !!t && !t.includes("수수료 · 정산") && !t.includes("미수금"));
    ok("최근 n건에서 센 값이라고 밝힌다",
        !!t && t.includes("최근 접수 8건") && t.includes("전체 누적이 아닙니다"));
    ok("JS 에러 0", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ══ ⑥ 관리자 ════════════════════════════════════════════════════ */
  console.log("\n⑥ 관리자 — 수수료 · 정산 · 미수금 · 환수");
  {
    const L = deskRq(["new","signed","done"]);
    const { ctx, pg, errs } = await openMy(
      { auth:true, signedIn:true, role:"admin" },
      { auth:true, signedIn:true, role:"admin",
        requests:L, quotes:[], deals:ADM_DEAL, audits:[], fees:[],
        providers:[], state:null });
    const t = await dbTxt(pg);
    ok("관리자 작업대라고 적는다", !!t && t.includes("관리자 작업대"));
    ok("수수료 · 정산 구간이 있다", !!t && t.includes("수수료 · 정산"));
    ok("확정 건수를 센다 (둘 중 하나)", !!t && t.includes("수수료 확정 1건"));
    /* ⚠️⚠️ **미수금은 확정된 것 중 안 들어온 것**입니다. 확정 전인
       계약(5,000만원)을 계약금액으로 섞으면 열 배로 부풀려집니다. */
    ok("미수금이 165,000원 이다 (확정 전인 건이 안 섞였다)", await pg.evaluate(() => {
      const d = [].filter.call(document.querySelectorAll("#my-db dt"),
        e => e.textContent.trim() === "미수금")[0];
      return !!d && d.nextElementSibling.textContent.trim() === "165,000원";
    }), "확정 전인 계약금액이 섞이면 5,000만원대가 됩니다");
    /* ⚠️ 환수가 0 이면 줄째 뺍니다 — 없던 일을 0원으로 적어 두면
       기록이 있는 것처럼 읽힙니다 (절대 규칙 2) */
    ok("환수가 없으면 그 줄이 없다", !!t && !t.includes("환수"));
    ok("JS 에러 0", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  console.log("\n⑥-2 관리자 — 환수가 있으면 (감사 기록에서 옵니다)");
  {
    const { ctx, pg, errs } = await openMy(
      { auth:true, signedIn:true, role:"admin" },
      { auth:true, signedIn:true, role:"admin",
        requests:deskRq(["signed"]), quotes:[], deals:ADM_DEAL,
        /* ⚠️ deal 에는 안 남습니다 — 확정했던 액을 갈아 치우지 않으려고
           차액을 감사 기록에 적습니다 (0003 clawback_fee) */
        audits:[{ at:"2026-10-20T05:00:00Z", obj_id:"d1", data:{ back:50000 } },
                { at:"2026-10-20T06:00:00Z", obj_id:"d1", data:{ back:-10000 } }],
        fees:[], providers:[], state:null });
    const t = await dbTxt(pg);
    ok("환수 줄이 생긴다", !!t && t.includes("환수 · 부분환불"));
    /* ⚠️ 차액이 음수인 줄(올려 잡은 경우)은 환수가 아니라 더하지 않습니다 */
    ok("음수 차액을 환수로 더하지 않는다 (50,000원)",
        !!t && t.includes("50,000원"), (t || "").match(/[\d,]+원/g));
    ok("JS 에러 0", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ══ ⑦ 회원 계정 저장 — 합치기 규칙 (js/state.js) ═══════════════
     ⚠️⚠️ **규칙은 하나입니다 — 보고 계신 화면이 이깁니다.** 합집합으로
     섞으면 폰에서 지운 것이 PC 에서 되살아납니다. */
  console.log("\n⑦ 회원 계정 저장 — 이 브라우저가 비어 있으면 서버 것을 잇습니다");
  {
    const { ctx, pg, errs, sent } = await openMy(
      { auth:true, signedIn:true, role:"customer" },
      { auth:true, signedIn:true, role:"customer", requests:[], quotes:[],
        state:{ pick:["interior","repair/aircon-fix"],
                draft:{ "q-ind":"cafe", "q-reg":"seoul" }, checks:["tax-file"],
                updated_at:"2026-10-20T01:00:00Z" } },
      { path:"/startup" });
    ok("/api/me?s=1 로 메모장만 묻는다 (신청 쉰 건을 안 끌고 온다)",
        sent.some(x => x === "me:?s=1"), sent.join(" | "));
    const got = await pg.evaluate(() => amPickGet());
    ok("서버에 있던 둘이 바구니에 들어온다",
        got.length === 2 && got.indexOf("repair/aircon-fix") >= 0, JSON.stringify(got));
    ok("적어 두신 조건도 이 브라우저에 적힌다", await pg.evaluate(() => {
      try { return (JSON.parse(localStorage.getItem("am.draft.v1")).f["q-ind"]) === "cafe"; }
      catch (e) { return false; }
    }));
    /* ⚠️ 내려받는 중에 또 올리면 왕복이 끝나지 않습니다 (AM_ST.pulled) */
    ok("내려받으면서 되올리지 않는다",
        !sent.some(x => x.indexOf("deal:save_user_state") === 0), sent.join(" | "));
    ok("JS 에러 0", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  console.log("\n⑦-2 이 브라우저에 뭔가 있으면 — 그대로 두고 올립니다");
  {
    const { ctx, pg, errs, sent } = await openMy(
      { auth:true, signedIn:true, role:"customer" },
      { auth:true, signedIn:true, role:"customer", requests:[], quotes:[],
        state:{ pick:["demolish"], draft:{}, checks:[],
                updated_at:"2026-10-20T01:00:00Z" } },
      { path:"/startup",
        before:"try{localStorage.setItem('am.pick.v1'," +
               "JSON.stringify({ids:['interior'],at:Date.now()}))}catch(e){}" });
    const got = await pg.evaluate(() => amPickGet());
    /* ⚠️⚠️ 합집합이면 둘이 됩니다 — 그러면 폰에서 지운 demolish 가
       PC 에서 되살아나고, 사장님은 자기가 지운 줄을 의심합니다 */
    ok("보고 계신 화면이 이긴다 (서버 것이 섞이지 않는다)",
        got.length === 1 && got[0] === "interior", JSON.stringify(got));
    const push = sent.filter(x => x.indexOf("deal:save_user_state") === 0);
    ok("서버에 올린다", push.length >= 1, sent.join(" | "));
    /* ⚠️⚠️ **성함 · 연락처는 한 글자도 안 올립니다.** 보내는 칸은
       셋뿐이고, 담을 수 있는 칸은 0010 의 트리거가 한 번 더 막습니다. */
    ok("보내는 칸이 pick · draft · checks 셋뿐이다", push.length >= 1 &&
        Object.keys(JSON.parse(push[0].slice("deal:save_user_state:".length)))
          .every(k => k === "p_pick" || k === "p_draft" || k === "p_checks"),
        push[0]);
    ok("올린 것이 이 브라우저 것이다", push.length >= 1 &&
        JSON.stringify(JSON.parse(push[0].slice("deal:save_user_state:".length)).p_pick)
          === JSON.stringify(["interior"]), push[0]);
    ok("JS 에러 0", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  console.log("\n⑦-3 한 칸만 비웁니다 (셋이 다 비었을 때만 줄째)");
  {
    const { ctx, pg, errs, sent } = await openMy(
      { auth:true, signedIn:true, role:"customer" },
      { auth:true, signedIn:true, role:"customer", requests:[], quotes:[],
        state:{ pick:[], draft:{}, checks:[], updated_at:null } },
      { path:"/startup",
        before:"try{localStorage.setItem('am.pick.v1'," +
               "JSON.stringify({ids:['interior'],at:Date.now()}));" +
               "localStorage.setItem('am.opsck.v1'," +
               "JSON.stringify({done:['tax-file'],at:Date.now()}))}catch(e){}" });
    /* 조건만 비웁니다 — ⚠️ 고르신 서비스까지 날아가면 안 됩니다 */
    await pg.evaluate(() => { amStateDrop("draft"); });
    await pg.waitForTimeout(1500);
    const a = sent.filter(x => x.indexOf("deal:") === 0);
    ok("줄째 지우지 않는다 (남은 것이 있습니다)",
        !a.some(x => x.indexOf("deal:clear_user_state") === 0), a.join(" | "));
    ok("그 칸만 올린다", a.some(x => x.indexOf("deal:save_user_state") === 0 &&
        x.indexOf("p_draft") >= 0 && x.indexOf("p_pick") < 0), a.join(" | "));
    /* 전부 비운 뒤 — 그때만 줄째 */
    await pg.evaluate(() => {
      try { localStorage.removeItem("am.pick.v1");
            localStorage.removeItem("am.opsck.v1");
            localStorage.removeItem("am.draft.v1"); } catch (e) {}
      amStateDrop("pick");
    });
    await pg.waitForTimeout(400);
    ok("셋이 다 비면 줄째 지운다 (빈 줄을 안 남깁니다)",
        sent.some(x => x.indexOf("deal:clear_user_state") === 0), sent.join(" | "));
    ok("JS 에러 0", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  console.log("\n⑦-4 못 올렸으면 올렸다고 말하지 않습니다 (§15)");
  {
    const ctx = await br.newContext({ viewport:{ width:1440, height:900 } });
    const pg = await ctx.newPage();
    const errs = []; pg.on("pageerror", e => errs.push(String(e)));
    await pg.route("**/api/session", r => r.fulfill({ status:200,
      contentType:"application/json",
      body: JSON.stringify({ auth:true, signedIn:true, role:"customer" }) }));
    await pg.route("**/api/me**", r => r.fulfill({ status:200,
      contentType:"application/json",
      body: JSON.stringify({ auth:true, signedIn:true, role:"customer",
        requests:[], quotes:[], state:{ pick:[], draft:{}, checks:[] } }) }));
    /* 저장이 거절당합니다 */
    await pg.route("**/api/deal", r => r.fulfill({ status:200,
      contentType:"application/json",
      body: JSON.stringify({ ok:false, error:"거절" }) }));
    await pg.addInitScript("try{localStorage.setItem('am.pick.v1'," +
      "JSON.stringify({ids:['interior'],at:Date.now()}))}catch(e){}");
    await pg.goto(base + "/startup", { waitUntil:"networkidle" });
    await pg.waitForTimeout(900);
    ok("amStateOn() 이 거짓이다 (서버에도 저장됨 표시를 안 켭니다)",
        (await pg.evaluate(() => amStateOn())) === false);
    ok("고르신 것은 그대로 남아 있다",
        (await pg.evaluate(() => amPickGet())).length === 1);
    ok("JS 에러 0", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ══ ⑧ 사진 · 서류 붙이기 — **켜진 쪽** (2026-10-18 §7-3) ═══════
     ⚠️⚠️ 전수 점검은 **꺼진 쪽만** 봅니다 ("버킷이 설정되기 전에는 사진
     칸이 안 나온다"). 켜진 쪽은 한 번도 안 그려 봤습니다 — 이 환경에서
     Supabase Storage 를 세울 수 없어서인데, 그렇다고 상한 셋과 파일
     이름 규칙이 검사 밖에 있어도 되는 것은 아닙니다. 가짜 서명 주소로
     거기까지 눌러 봅니다. */
  console.log("\n⑧ 사진 · 서류 붙이기 — 켜진 쪽 (버킷이 있을 때)");
  {
    const ctx = await br.newContext({ viewport:{ width:1440, height:900 } });
    const pg = await ctx.newPage();
    const errs = [], slot = [], put = [];
    pg.on("pageerror", e => errs.push(String(e)));
    /* 자리를 내주는 주소 — ⚠️ 몸통을 그대로 받아 둡니다 (아래에서
       **원래 파일 이름이 섞이지 않았는지** 봅니다) */
    await pg.route("**/api/upload", r => {
      if (r.request().method() === "GET")
        return r.fulfill({ status:200, contentType:"application/json",
          body: JSON.stringify({ up:true }) });
      let b = {}; try { b = JSON.parse(r.request().postData() || "{}"); } catch (e) {}
      slot.push(b);
      r.fulfill({ status:200, contentType:"application/json",
        body: JSON.stringify({ url:"https://zz.example/sign/" + slot.length,
                               id:"p" + slot.length }) });
    });
    /* ⚠️⚠️ **파일이 우리 서버 함수를 지나가지 않습니다** — 서명된
       주소로 바로 갑니다 (api/upload.js 머리말). 그걸 여기서 봅니다. */
    await pg.route("https://zz.example/**", r => {
      put.push({ m:r.request().method(),
                 ct:(r.request().headers()["content-type"] || "") });
      r.fulfill({ status:200, body:"" });
    });
    await pg.goto(base + "/quote?side=ops", { waitUntil:"networkidle" });
    /* 접수 완료 안내 안에 붙는 칸이라, 그 자리를 그대로 만들어 붙입니다 */
    await pg.evaluate(() => {
      const box = document.createElement("div");
      box.id = "zz-ph";
      document.querySelector("#view").appendChild(box);
      amPhotoAfter(box, "SW-AAAA-0001", "010-1111-2222");
    });
    await pg.waitForTimeout(500);
    ok("버킷이 있으면 사진 칸이 그려진다", (await n(pg, "#zz-ph .phup")) === 1);
    ok("고르개가 받는 형식을 accept 에도 적는다",
        (await pg.getAttribute("#phup-f", "accept")) ===
          "image/jpeg,image/png,image/webp,application/pdf");
    ok("무엇이 어디로 가는지 적는다 (배정된 업체와 담당자만)",
        (await pg.evaluate(() => document.querySelector("#zz-ph .note").textContent))
          .includes("배정된 업체와 저희 담당자만"));

    /* 한 장 올립니다 — ⚠️ 이름에 성함이 들어간 흔한 꼴로 */
    await pg.setInputFiles("#phup-f", {
      name:"김사장_주방.jpg", mimeType:"image/jpeg",
      buffer: Buffer.from("zz") });
    await pg.waitForTimeout(600);
    ok("올라간 뒤에만 '올렸습니다' 라고 말한다",
        (await n(pg, "#phup-l li.is-ok")) === 1,
        await pg.evaluate(() => (document.querySelector("#phup-l li") || {}).textContent));
    ok("파일이 서명된 주소로 바로 간다 (우리 함수를 안 지납니다)",
        put.length === 1 && put[0].m === "PUT" && put[0].ct === "image/jpeg",
        JSON.stringify(put));
    /* ⚠️⚠️ **원래 파일 이름을 서버에 보내지 않습니다** — "김사장_주방.jpg"
       처럼 성함 · 상호가 들어 있는 경우가 흔합니다 (0011 머리말). */
    ok("원래 파일 이름을 서버에 보내지 않는다",
        slot.length === 1 && !JSON.stringify(slot[0]).includes("김사장") &&
        Object.keys(slot[0]).sort().join(",") === "bytes,mime,no,tel",
        JSON.stringify(slot[0]));
    ok("고르신 이름은 화면에만 보인다 (esc 를 지나서)",
        (await pg.evaluate(() => document.querySelector(".phup-n").textContent))
          === "김사장_주방.jpg");

    /* 상한 셋 — ⚠️ 서버에 보내기 전에 화면이 먼저 막습니다 */
    const before = slot.length;
    await pg.setInputFiles("#phup-f", {
      name:"x.txt", mimeType:"text/plain", buffer: Buffer.from("zz") });
    await pg.waitForTimeout(300);
    ok("형식이 아닌 것은 화면이 먼저 막는다",
        (await pg.evaluate(() => [].some.call(
          document.querySelectorAll("#phup-l li.is-bad"),
          e => /이 형식은 올릴 수 없습니다/.test(e.textContent)))) &&
        slot.length === before);
    await pg.setInputFiles("#phup-f", {
      name:"big.jpg", mimeType:"image/jpeg",
      buffer: Buffer.alloc(8388609) });
    await pg.waitForTimeout(300);
    ok("8MB 를 넘으면 화면이 먼저 막는다",
        (await pg.evaluate(() => [].some.call(
          document.querySelectorAll("#phup-l li.is-bad"),
          e => /8MB 를 넘습니다/.test(e.textContent)))) &&
        slot.length === before);
    /* 다섯 장 — ⚠️ 상한이 없으면 접수 하나로 버킷을 채웁니다 */
    await pg.setInputFiles("#phup-f", [1,2,3,4,5].map(i => ({
      name:"a" + i + ".jpg", mimeType:"image/jpeg", buffer: Buffer.from("zz") })));
    await pg.waitForTimeout(1200);
    ok("다섯 장까지만 올라간다",
        (await n(pg, "#phup-l li.is-ok")) === 5,
        "올라간 장수: " + (await n(pg, "#phup-l li.is-ok")));
    ok("여섯째부터 까닭을 적는다",
        (await pg.evaluate(() => [].some.call(
          document.querySelectorAll("#phup-l li.is-bad"),
          e => /다섯 장까지입니다/.test(e.textContent)))));
    ok("JS 에러 0", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  console.log("\n⑧-2 올리다 거절당하면 — 성공했다고 말하지 않습니다");
  {
    const ctx = await br.newContext({ viewport:{ width:1440, height:900 } });
    const pg = await ctx.newPage();
    const errs = []; pg.on("pageerror", e => errs.push(String(e)));
    await pg.route("**/api/upload", r => {
      if (r.request().method() === "GET")
        return r.fulfill({ status:200, contentType:"application/json",
          body: JSON.stringify({ up:true }) });
      r.fulfill({ status:400, contentType:"application/json",
        body: JSON.stringify({ error:"접수번호와 연락처를 확인해 주세요" }) });
    });
    await pg.goto(base + "/quote?side=ops", { waitUntil:"networkidle" });
    await pg.evaluate(() => {
      const box = document.createElement("div"); box.id = "zz-ph";
      document.querySelector("#view").appendChild(box);
      amPhotoAfter(box, "SW-AAAA-0001", "010-9999-9999");
    });
    await pg.waitForTimeout(500);
    await pg.setInputFiles("#phup-f", {
      name:"a.jpg", mimeType:"image/jpeg", buffer: Buffer.from("zz") });
    await pg.waitForTimeout(600);
    ok("'올렸습니다' 가 안 뜬다", (await n(pg, "#phup-l li.is-ok")) === 0);
    /* ⚠️ 서버가 돌려준 까닭을 그대로 보여 줍니다 — 손님이 무엇을
       하셔야 하는지가 "지금 안 됩니다" 와 다릅니다 */
    ok("서버가 돌려준 까닭을 그대로 적는다",
        (await pg.evaluate(() => document.querySelector("#phup-l li").textContent))
          .includes("접수번호와 연락처를 확인해 주세요"));
    ok("JS 에러 0", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ══ ⑨ 폰 ════════════════════════════════════════════════════════ */
  console.log("\n⑨ 폰 390px — 고객 화면이 가로로 안 넘칩니다");
  {
    const { ctx, pg, errs } = await openMy(
      { auth:true, signedIn:true, role:"customer" },
      { auth:true, signedIn:true, role:"customer",
        requests:CUST_RQ, quotes:CUST_Q, state:null },
      { viewport:{ width:390, height:844 } });
    const w = await pg.evaluate(() => ({
      doc:document.documentElement.scrollWidth, win:window.innerWidth }));
    ok("가로 스크롤이 없다", w.doc <= w.win + 1, JSON.stringify(w));
    ok("견적 둘이 그대로 그려진다", (await n(pg, ".myqt-c")) === 2);
    /* 누름 40px 이상 — 전수 점검이 /my 를 보지만 로그인 뒤 구간은
       거기까지 안 닿습니다 */
    const small = await pg.evaluate(() => [].filter.call(
      document.querySelectorAll("#my-db button, #my-db a"),
      e => { const r = e.getBoundingClientRect();
             return r.height > 0 && r.height < 40; }).map(e => e.textContent.trim()));
    ok("누르는 것이 전부 40px 이상이다", small.length === 0, small.join(" | "));
    ok("JS 에러 0", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  /* ══ ⑩ 매직링크 — 화면 쪽 (js/auth.js) ═══════════════════════════
     ⚠️⚠️ **여기도 검사가 0건이었습니다.** tools/test-auth.js(189)는
     서버층(api/_auth.js · session · me · deal)을 보고, 브라우저 쪽은
     아무도 안 보고 있었습니다 — 토큰이 주소창에 남는가 · 메일이
     있는지 없는지를 갈라서 말하는가 · 만료되면 새로 받는가가 전부
     그 안입니다. */
  console.log("\n⑩ 매직링크 — 토큰이 주소창에 남지 않습니다");
  {
    const ctx = await br.newContext({ viewport:{ width:1440, height:900 } });
    const pg = await ctx.newPage();
    const errs = [], hit = [];
    pg.on("pageerror", e => errs.push(String(e)));
    await pg.route("**/api/session", r => r.fulfill({ status:200,
      contentType:"application/json",
      body: JSON.stringify({ auth:true, signedIn:true, role:"customer",
        conf:{ url:"https://zz.supabase.co", anonKey:"ZZ-ANON" } }) }));
    await pg.route("**/api/me**", r => r.fulfill({ status:200,
      contentType:"application/json",
      body: JSON.stringify({ auth:true, signedIn:true, role:"customer",
        requests:[], quotes:[], state:null }) }));
    await pg.route("https://zz.supabase.co/**", r => {
      hit.push({ u:r.request().url(), h:r.request().headers() });
      r.fulfill({ status:200, contentType:"application/json", body:"{}" });
    });
    /* 매직링크가 돌아온 꼴 그대로 */
    await pg.goto(base + "/my#access_token=ZZTOKEN&refresh_token=ZZREF" +
      "&expires_in=3600&token_type=bearer", { waitUntil:"networkidle" });
    await pg.waitForTimeout(500);
    /* ⚠️⚠️ 안 지우면 주소창에 토큰이 남아 어깨너머로 보이고,
       공유하면 그대로 넘어갑니다 */
    const loc = await pg.evaluate(() => ({ h:location.hash, p:location.pathname }));
    ok("해시를 바로 지운다 (주소창에 토큰이 안 남는다)",
        loc.h === "" && loc.p === "/my", JSON.stringify(loc));
    ok("토큰을 이 브라우저에 담았다", await pg.evaluate(() => {
      try { return JSON.parse(localStorage.getItem("am.auth.v1")).access_token === "ZZTOKEN"; }
      catch (e) { return false; } }));
    /* 유효기간을 **시각**으로 바꿔 둡니다 — 숫자로 들고 있으면
       새로고침할 때마다 다시 세야 합니다 */
    ok("유효기간을 시각으로 바꿔 둔다", await pg.evaluate(() => {
      try { const t = JSON.parse(localStorage.getItem("am.auth.v1"));
            return t.at > Date.now() + 3000000; } catch (e) { return false; } }));
    ok("보낼 때 토큰을 머리에 붙인다", await pg.evaluate(() =>
      (amAuthHeaders().authorization || "") === "Bearer ZZTOKEN"));
    /* 나가기 — ⚠️ 서버에 알리는 것이 실패해도 이 브라우저에서는 지웁니다 */
    await pg.evaluate(() => amAuthOut());
    await pg.waitForTimeout(300);
    ok("나가면 이 브라우저에서 반드시 지운다",
        (await pg.evaluate(() => localStorage.getItem("am.auth.v1"))) === null);
    ok("JS 에러 0", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  console.log("\n⑩-2 만료된 토큰은 조용히 새로 받습니다 · 로그아웃도 서버에");
  {
    const ctx = await br.newContext({ viewport:{ width:1440, height:900 } });
    const pg = await ctx.newPage();
    const errs = [], hit = [];
    pg.on("pageerror", e => errs.push(String(e)));
    let first = true;
    await pg.route("**/api/session", r => {
      /* 처음 한 번은 "들어와 있지 않다" 로 — 화면이 새로 받아 다시 묻습니다 */
      const body = first
        ? { auth:true, signedIn:false,
            conf:{ url:"https://zz.supabase.co", anonKey:"ZZ-ANON" } }
        : { auth:true, signedIn:true, role:"customer",
            conf:{ url:"https://zz.supabase.co", anonKey:"ZZ-ANON" } };
      first = false;
      r.fulfill({ status:200, contentType:"application/json",
        body: JSON.stringify(body) });
    });
    await pg.route("**/api/me**", r => r.fulfill({ status:200,
      contentType:"application/json",
      body: JSON.stringify({ auth:true, signedIn:true, role:"customer",
        requests:[], quotes:[], state:null }) }));
    await pg.route("https://zz.supabase.co/**", r => {
      hit.push({ u:r.request().url(), h:r.request().headers(),
                 b:r.request().postData() || "" });
      r.fulfill({ status:200, contentType:"application/json",
        body: JSON.stringify({ access_token:"NEW", refresh_token:"NEWREF",
          expires_in:3600 }) });
    });
    /* 만료된 토큰을 들고 들어옵니다 */
    await pg.addInitScript("try{localStorage.setItem('am.auth.v1'," +
      "JSON.stringify({access_token:'OLD',refresh_token:'ZZREF'," +
      "at:Date.now()-1000}))}catch(e){}");
    await pg.goto(base + "/my", { waitUntil:"networkidle" });
    await pg.waitForTimeout(600);
    const ref = hit.filter(x => x.u.indexOf("grant_type=refresh_token") >= 0);
    ok("만료되면 새로 받는다", ref.length === 1, JSON.stringify(hit.map(x => x.u)));
    /* ⚠️⚠️ **화면에 내려가는 것은 주소와 공개 키 둘뿐입니다** — service
       key 는 RLS 를 통째로 지나갑니다 (api/_auth.js 의 publicConf). */
    ok("공개 키를 apikey 로 보낸다 (service key 가 아님)",
        ref.length === 1 && ref[0].h.apikey === "ZZ-ANON", JSON.stringify(ref[0] && ref[0].h));
    ok("새 토큰으로 갈아 끼운다", await pg.evaluate(() => {
      try { return JSON.parse(localStorage.getItem("am.auth.v1")).access_token === "NEW"; }
      catch (e) { return false; } }));
    ok("JS 에러 0", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  console.log("\n⑩-3 메일이 있는지 없는지를 갈라서 말하지 않습니다");
  {
    const ctx = await br.newContext({ viewport:{ width:1440, height:900 } });
    const pg = await ctx.newPage();
    const errs = [], otp = [];
    pg.on("pageerror", e => errs.push(String(e)));
    await pg.route("**/api/session", r => r.fulfill({ status:200,
      contentType:"application/json",
      body: JSON.stringify({ auth:true, signedIn:false,
        conf:{ url:"https://zz.supabase.co", anonKey:"ZZ-ANON" } }) }));
    await pg.route("**/api/me**", r => r.fulfill({ status:200,
      contentType:"application/json",
      body: JSON.stringify({ auth:true, signedIn:false }) }));
    await pg.route("https://zz.supabase.co/**", r => {
      otp.push({ u:r.request().url(), b:r.request().postData() || "" });
      r.fulfill({ status:200, contentType:"application/json", body:"{}" });
    });
    await pg.goto(base + "/my", { waitUntil:"networkidle" });
    await pg.waitForTimeout(400);
    /* 가입된 메일 · 없는 메일 — 둘 다 **같은 말**이라야 합니다. 갈라
       주면 어느 메일이 가입돼 있는지 확인해 가며 긁을 수 있습니다
       (claim_request 가 틀린 까닭을 안 가르는 것과 같은 규칙). */
    const say = async (em) => {
      await pg.fill("#my-em", em);
      await pg.click(".my-in button[type=submit]");
      await pg.waitForTimeout(400);
      return pg.evaluate(() => document.getElementById("my-in-n").textContent);
    };
    const a = await say("there@example.com");
    const b = await say("nobody@example.com");
    ok("보냈다고 말한다", a.includes("보냈습니다"), a);
    ok("가입 여부를 갈라서 말하지 않는다", a === b, a + " / " + b);
    /* ⚠️ 못 보냈으면 보냈다고 말하지 않습니다 (절대 규칙 5) */
    ok("메일 꼴이 아니면 보내지 않는다", await (async () => {
      const n0 = otp.length;
      const s = await pg.evaluate(() => {
        document.getElementById("my-em").removeAttribute("type");
        document.getElementById("my-em").value = "zzz";
        return null; });
      await pg.click(".my-in button[type=submit]");
      await pg.waitForTimeout(300);
      const t = await pg.evaluate(() =>
        document.getElementById("my-in-n").textContent);
      return otp.length === n0 && t.includes("확인해 주세요");
    })());
    /* ⚠️⚠️ 돌아올 자리를 같이 보냅니다 — Supabase 쪽 Redirect URLs 에
       그 주소가 없으면 링크가 기본 주소로 갑니다 */
    ok("돌아올 자리를 같이 보낸다",
        otp.length >= 1 && otp[0].b.indexOf("email_redirect_to") >= 0,
        otp[0] && otp[0].b);
    ok("JS 에러 0", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  await br.close(); srv.close();
  console.log("\n" + (fail ? "❌" : "✅") + " 통과 " + pass + " · 실패 " + fail);
  process.exit(fail ? 1 : 0);
})();
