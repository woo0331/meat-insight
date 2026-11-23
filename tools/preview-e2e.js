/* Preview + 시험 Supabase 에서 핵심 흐름을 **실제 서버 · 실제 DB** 로 눌러 봅니다.
   견적 신청 → 관리자 확인 · 배정 → 업체 수락 · 상담 · 견적 → 고객 조회 · 선택 → 계약 → 완료 / 다른 건 취소
   + 미배정 업체 · 다른 고객이 그 신청을 못 보는지 (실제 /api/me)
   + 화면 캡처 (고객 /my · 업체 /my)

   ⚠️⚠️ **운영에서 돌지 않습니다.** 아래 셋 중 하나라도 어긋나면 아무것도 보내지 않고 멈춥니다.
     ① PREVIEW_URL 이 storeway.co.kr · meat-insight.vercel.app 이면 멈춤
     ② TEST_REF 가 주어져야 하고, TEST_SB_URL 이 그 ref 라야 함
     ③ Preview 자신의 /api/session 이 알려 주는 Supabase 주소의 ref 가 TEST_REF 와 같아야 함
        (= 그 Preview 가 정말 시험 DB 에 물려 있는지 서버에게 직접 물어봄)
   ⚠️ 키 값은 출력하지 않습니다 (환경변수로만 받습니다).
   ⚠️ 실제 알림은 Preview 의 웹훅 · 메일 설정을 따릅니다 — 격리된 시험 수신처가 아니면
      Preview 환경변수에서 INTAKE_WEBHOOK_URL · DEAL_WEBHOOK_URL · *_EMAIL_FROM 을 비워 두세요.

   필요한 환경변수
     PREVIEW_URL            https://<preview>.vercel.app
     VERCEL_BYPASS          (보호가 켜져 있으면) Protection Bypass for Automation 값
     TEST_REF               시험 프로젝트 ref (예: gxjzlkvdbafzfjuunvyx)
     TEST_SB_URL            https://<TEST_REF>.supabase.co
     TEST_SB_SERVICE_KEY    시험 프로젝트 service_role 키 — 시험 계정 로그인 링크를 만들 때만 씀
                            ⚠️ 비우고 SB_KEY_VIA_PROXY=1 이면 키를 이 스크립트가 들고 있지 않고,
                               작업 환경의 Network secret 이 그 호스트 요청에 Authorization 을 넣어 줍니다
     TEST_SB_ANON_KEY       시험 프로젝트 공개(anon) 키 — 프록시 모드에서 apikey 머리에 씀 (비밀 아님)
     PREVIEW_ADMIN_PASSWORD (선택) Preview 전용 시험 관리자 비밀번호 — 있으면 /admin 화면까지 검수, 없으면 미검증
     E_CUST E_CUST2 E_PVA E_PVB E_STAFF   시험 계정 메일 다섯 (역할 · 업체 연결이 시험 DB 에 되어 있어야 함)
     PVA_ID                 업체 A 의 id (배정 가능 · 계정 연결된 시험 업체)
     SERVICE                신청 서비스 id (기본 demolish/full)
   돌리기:  node tools/preview-e2e.js      (결과 · 캡처는 out/preview-e2e/) */
const fs = require("fs"), path = require("path");
const E = k => (process.env[k] || "").trim();
const OUT = path.join(__dirname, "..", "out", "preview-e2e");
let pass = 0, bad = 0;
const ok = (c, n, got) => { if(c){ pass++; console.log("  ✅ " + n); } else { bad++; console.log("  ❌ " + n + (got !== undefined ? "  →  " + String(typeof got === "string" ? got : JSON.stringify(got)).slice(0, 240) : "")); } };
const die = m => { console.log("⛔ " + m); process.exit(2); };

const BASE = E("PREVIEW_URL").replace(/\/+$/, ""), REF = E("TEST_REF"), SB = E("TEST_SB_URL").replace(/\/+$/, "");
const VIA = E("SB_KEY_VIA_PROXY") === "1";
const SK = E("TEST_SB_SERVICE_KEY") || (VIA ? "proxy-injected" : "");   /* 프록시 모드에서는 자리표시 값 — 진짜 키는 프록시가 넣습니다 */
const AK = VIA ? E("TEST_SB_ANON_KEY") : SK;
const adm = () => ({ "content-type":"application/json", apikey:AK, authorization:"Bearer " + SK });
const PVA = E("PVA_ID"), SVC = E("SERVICE") || "demolish/full";
const MAIL = { cust:E("E_CUST"), cust2:E("E_CUST2"), pva:E("E_PVA"), pvb:E("E_PVB"), staff:E("E_STAFF") };

function hdr(extra){ const h = Object.assign({ "content-type":"application/json" }, extra || {}); if(E("VERCEL_BYPASS")) h["x-vercel-protection-bypass"] = E("VERCEL_BYPASS"); return h; }
async function api(p, opt){ const r = await fetch(BASE + p, opt); let j = null; try{ j = await r.json(); }catch(e){} return { s:r.status, j }; }
const refOf = u => { const m = /^https:\/\/([a-z0-9]{20})\.supabase\.co/.exec(String(u || "")); return m ? m[1] : ""; };

async function guard(){
  console.log("\n▶ 안전장치");
  if(!BASE || !REF || !SB || !SK || !AK || !PVA || Object.values(MAIL).some(v => !v)) die("필요한 환경변수가 비었습니다 (파일 맨 위 목록)");
  const host = new URL(BASE).host;
  if(/(^|\.)storeway\.co\.kr$/.test(host) || host === "meat-insight.vercel.app") die("운영 주소입니다 — 멈춥니다");
  if(refOf(SB) !== REF) die("TEST_SB_URL 의 ref 가 TEST_REF 와 다릅니다");
  const s = await api("/api/session", { headers:hdr() });
  if(s.s !== 200 || !s.j) die("Preview /api/session 응답이 없습니다 (" + s.s + ") — 주소 · 보호 우회 확인");
  if(!s.j.auth || !s.j.conf) die("Preview 의 계정 기능이 꺼져 있습니다 (STOREWAY_ACCOUNTS_OPEN · SUPABASE_*)");
  if(refOf(s.j.conf.url) !== REF) die("Preview 가 다른 Supabase 에 물려 있습니다 — 시험 DB 가 아니면 진행하지 않습니다");
  ok(true, "Preview 가 시험 DB(" + REF + ")에 물려 있음 · 운영 주소 아님");
  ok(s.j.intake && s.j.intake.quote === true, "Preview 견적 접수 열림 (STOREWAY_INTAKE_OPEN)", s.j.intake);
}

/* 시험 계정 만들기 — 있으면 그대로 (메일 확인을 건너뛰고 만들어서 메일이 나가지 않습니다) */
async function ensureUser(email){
  const r = await fetch(SB + "/auth/v1/admin/users", { method:"POST", headers:adm(), body:JSON.stringify({ email, email_confirm:true }) });
  if(r.ok) return "new";
  const j = await r.json().catch(() => ({}));
  if(r.status === 422 || /already|registered|exists/i.test(JSON.stringify(j))) return "had";
  throw new Error("시험 계정을 못 만들었습니다 (" + r.status + ")");
}
/* 시험 계정 로그인 — 매직링크를 메일로 보내지 않고 관리 API 로 만들어 바로 검증 */
async function tokenFor(email){
  const g = await fetch(SB + "/auth/v1/admin/generate_link", { method:"POST",
    headers:adm(), body:JSON.stringify({ type:"magiclink", email }) });
  const gj = await g.json().catch(() => ({}));
  const th = gj.hashed_token || (gj.properties && gj.properties.hashed_token);
  if(!th) throw new Error("로그인 링크를 못 만들었습니다 — " + email.replace(/(.).+@/, "$1***@") + " (" + g.status + ")");
  const v = await fetch(SB + "/auth/v1/verify", { method:"POST", headers:{ "content-type":"application/json", apikey:AK },
    body:JSON.stringify({ type:"magiclink", token_hash:th }) });
  const vj = await v.json().catch(() => ({}));
  if(!vj.access_token) throw new Error("로그인 검증 실패 (" + v.status + ")");
  return vj;
}
const as = t => hdr({ authorization:"Bearer " + t.access_token });
const deal = (t, fn, args) => api("/api/deal", { method:"POST", headers:as(t), body:JSON.stringify({ fn, args }) });
const me = (t, q) => api("/api/me" + (q || ""), { headers:as(t) });
const find = (j, no) => [].concat((j && j.requests) || [], (j && j.assigned) || []).find(r => r && r.no === no);

async function shot(browser, t, p, name){
  const ctx = await browser.newContext({ viewport:{ width:390, height:844 }, extraHTTPHeaders:E("VERCEL_BYPASS") ? { "x-vercel-protection-bypass":E("VERCEL_BYPASS") } : {} });
  await ctx.addInitScript(v => { try{ localStorage.setItem("am.auth.v1", v); }catch(e){} }, JSON.stringify(t));
  const pg = await ctx.newPage(); await pg.goto(BASE + p, { waitUntil:"networkidle" }); await pg.waitForTimeout(800);
  await pg.screenshot({ path:path.join(OUT, name + ".png"), fullPage:true }); await ctx.close();
}

(async () => {
  await guard();
  fs.mkdirSync(OUT, { recursive:true });
  if(E("SETUP_USERS") === "1"){
    console.log("\n▶ 시험 계정 만들기 (SETUP_USERS=1)");
    for(const k of Object.keys(MAIL)) console.log("   " + k + " " + await ensureUser(MAIL[k]));
    console.log("   → 이제 db/test/preview-seed.sql 로 역할 · 업체 연결을 넣고 SETUP_USERS 없이 다시 돌리세요"); return done();
  }
  console.log("\n▶ 시험 계정 로그인 (메일 발송 없음)");
  const T = {}; for(const k of Object.keys(MAIL)) T[k] = await tokenFor(MAIL[k]);
  ok(true, "다섯 계정 세션");
  for(const [k, want] of [["staff","staff"],["pva","provider"],["pvb","provider"],["cust","customer"]]){
    const s = await api("/api/session", { headers:as(T[k]) });
    ok(s.j && s.j.role === want, k + " 역할 " + want, s.j && s.j.role);
  }

  console.log("\n▶ ① 견적 신청 (고객 · 로그인한 채로)");
  const idem = "pv-e2e-" + Date.now();
  const body = { kind:"quote", agree:true, idem, side:"close", name:"시험 고객", tel:"010-0000-" + String(Date.now()).slice(-4),
    region:"경기", gu:"안양시", industry:"restaurant", service:SVC.split("/")[0], q:"Preview 시험 신청 — 실제 고객 아님", items:[{ id:SVC }] };
  const r1 = await api("/api/quote", { method:"POST", headers:as(T.cust), body:JSON.stringify(body) });
  ok(r1.s === 200 && r1.j && /^SW-/.test(r1.j.no || ""), "저장 · 접수번호", r1);
  const NO = r1.j && r1.j.no; if(!NO) return done();
  const r1b = await api("/api/quote", { method:"POST", headers:as(T.cust), body:JSON.stringify(body) });
  ok(r1b.j && r1b.j.no === NO, "같은 신청서 다시 보내면 같은 번호");

  console.log("\n▶ 배정 전 접근 (실제 /api/me)");
  const c1 = await me(T.cust); const R = find(c1.j, NO);
  ok(!!R, "고객 본인 화면에 신청이 보임");
  ok(!find((await me(T.cust2)).j, NO), "다른 고객에게는 안 보임");
  ok(!find((await me(T.pva)).j, NO) && !find((await me(T.pvb)).j, NO), "업체 A · B 모두 배정 전에는 안 보임");
  const sf = await me(T.staff); const RS = find(sf.j, NO); const RID = RS && RS.id;
  ok(!!RID, "직원 접수 목록에 보임 (연락처 없이)", RS && Object.keys(RS));

  console.log("\n▶ ② 관리자 확인 → 배정");
  ok((await deal(T.staff, "move_state", { p_request:RID, p_to:"check", p_ctx:{} })).s === 200, "확인(check)");
  const noAgree = await deal(T.staff, "move_state", { p_request:RID, p_to:"assigned", p_ctx:{ providerId:PVA } });
  ok(noAgree.s >= 400, "제3자 제공 동의 없이는 배정 거절", noAgree.j);
  ok((await deal(T.staff, "move_state", { p_request:RID, p_to:"assigned", p_ctx:{ providerId:PVA, agree3rd:true } })).s === 200, "업체 A 배정");
  ok(!!find((await me(T.pva)).j, NO), "업체 A 화면에 보임");
  ok(!find((await me(T.pvb)).j, NO), "업체 B 는 여전히 안 보임");
  ok(!find((await me(T.cust2)).j, NO), "다른 고객은 여전히 안 보임");

  console.log("\n▶ ③ 업체 수락 · 상담 · 견적");
  ok((await deal(T.pvb, "answer_assignment", { p_request:RID, p_yes:true })).s >= 400, "업체 B 는 수락 못 함");
  ok((await deal(T.pva, "answer_assignment", { p_request:RID, p_yes:true })).s === 200, "업체 A 수락");
  ok((await deal(T.pva, "move_state", { p_request:RID, p_to:"consult", p_ctx:{} })).s === 200, "업체 A 상담");
  ok((await deal(T.pva, "submit_quote", { p_request:RID, p_data:{ amount:3300000, vat:"add", scope:"Preview 시험 견적", days:3 } })).s === 200, "업체 A 견적 제출");

  console.log("\n▶ ④ 고객 조회 · 선택");
  const c2 = await me(T.cust); const R2 = find(c2.j, NO);
  ok(R2 && R2.state === "quoted", "고객 화면 상태 quoted", R2 && R2.state);
  ok(!JSON.stringify(c2.j || {}).includes("fee"), "고객 응답에 수수료 칸 없음");
  ok((await deal(T.cust2, "choose_quote", { p_request:RID, p_provider:PVA })).s >= 400, "다른 고객은 고르지 못함");
  ok((await deal(T.cust, "choose_quote", { p_request:RID, p_provider:PVA })).s === 200, "고객이 견적 선택");

  console.log("\n▶ ⑤ 계약 → 완료");
  ok((await deal(T.staff, "move_state", { p_request:RID, p_to:"nego", p_ctx:{} })).s === 200, "협의");
  ok((await deal(T.staff, "move_state", { p_request:RID, p_to:"signed", p_ctx:{ amount:3300000, providerId:PVA } })).s === 200, "계약");
  ok((await deal(T.staff, "move_state", { p_request:RID, p_to:"done", p_ctx:{} })).s === 200, "완료");
  ok((find((await me(T.cust)).j, NO) || {}).state === "done", "고객 화면 done");

  console.log("\n▶ ⑥ 취소 — 다른 신청");
  const r2 = await api("/api/quote", { method:"POST", headers:as(T.cust), body:JSON.stringify(Object.assign({}, body, { idem:idem + "-2", tel:"010-0001-" + String(Date.now()).slice(-4) })) });
  const NO2 = r2.j && r2.j.no; const RID2 = (find((await me(T.staff)).j, NO2) || {}).id;
  ok((await deal(T.cust2, "move_state", { p_request:RID2, p_to:"lost", p_ctx:{ why:"x" } })).s >= 400, "다른 고객은 취소 못 함");
  ok((await deal(T.cust, "move_state", { p_request:RID2, p_to:"lost", p_ctx:{ why:"Preview 시험 취소" } })).s === 200, "고객 본인 취소");

  console.log("\n▶ 화면 캡처 (390px)");
  const { chromium } = require("playwright");
  const br = await chromium.launch();
  await shot(br, T.cust, "/my", "고객-my"); await shot(br, T.pva, "/my", "업체A-my"); await shot(br, T.pvb, "/my", "업체B-my");
  /* /admin 화면 — Preview 전용 시험 비밀번호가 있을 때만. 없으면 미검증으로 남깁니다 (서버 호출 검사와 섞지 않음) */
  if(E("PREVIEW_ADMIN_PASSWORD")){
    const ctx = await br.newContext({ viewport:{ width:1440, height:900 }, httpCredentials:{ username:"admin", password:E("PREVIEW_ADMIN_PASSWORD") },
      extraHTTPHeaders:E("VERCEL_BYPASS") ? { "x-vercel-protection-bypass":E("VERCEL_BYPASS") } : {} });
    await ctx.addInitScript(v => { try{ localStorage.setItem("am.auth.v1", v); }catch(e){} }, JSON.stringify(T.staff));
    const pg = await ctx.newPage(); await pg.goto(BASE + "/admin", { waitUntil:"networkidle" }); await pg.waitForTimeout(1500);
    const txt = await pg.evaluate(() => (document.getElementById("rq") || document.body).innerText);
    ok(txt.indexOf(NO) >= 0, "/admin 화면 접수 목록에 시험 신청이 보임");
    ok(!/010-0000-/.test(txt), "/admin 목록에 연락처가 깔리지 않음");
    await pg.screenshot({ path:path.join(OUT, "관리자-admin.png"), fullPage:true }); await ctx.close();
  } else console.log("  ⚪ /admin 화면 — PREVIEW_ADMIN_PASSWORD 가 없어 **미검증** (배정은 서버 호출로만 검사)");
  await br.close(); ok(true, "캡처 → out/preview-e2e/");
  console.log("\n   시험 접수번호: " + NO + " · " + NO2 + " (정리할 때 이 둘)");
  done();
})().catch(e => { bad++; console.log("  ❌ 멈춤: " + e.message); done(); });
function done(){ console.log("\n" + (bad ? "❌ " + bad + "건 실패" : "✅ 전부 통과") + " — " + pass + "개"); process.exitCode = bad ? 1 : 0; }
