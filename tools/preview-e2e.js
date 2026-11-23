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
/* ref — 원격은 https://<20자>.supabase.co 의 <20자>, 로컬 시험 스택은 "local:<호스트:포트>" (127.0.0.1 · localhost 만) */
const refOf = u => { const m = /^https:\/\/([a-z0-9]{20})\.supabase\.co/.exec(String(u || "")); if(m) return m[1];
  const l = /^http:\/\/(127\.0\.0\.1|localhost):(\d+)\/?$/.exec(String(u || "")); return l ? "local:" + l[1] + ":" + l[2] : ""; };
/* 운영으로 알려진 ref · 기존 프로젝트 둘 — 여기에는 절대 안 돌립니다 (시험 전용으로 새로 만든 곳만) */
const NEVER = ["gxjzlkvdbafzfjuunvyx", "igignylgzjphtnyxhhsd"];

async function guard(){
  console.log("\n▶ 안전장치");
  if(!BASE || !REF || !SB || !SK || !AK || !PVA || Object.values(MAIL).some(v => !v)) die("필요한 환경변수가 비었습니다 (파일 맨 위 목록)");
  const host = new URL(BASE).host;
  if(/(^|\.)storeway\.co\.kr$/.test(host) || host === "meat-insight.vercel.app") die("운영 주소입니다 — 멈춥니다");
  if(refOf(SB) !== REF) die("TEST_SB_URL 의 ref 가 TEST_REF 와 다릅니다");
  if(NEVER.indexOf(REF) >= 0) die("기존 Supabase 프로젝트입니다 (운영일 수 있음) — 멈춥니다");
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

/* ── 실제 브라우저 ─────────────────────────────────────────── */
const T = {};
const R = { ui:[], srv:[], no:[] };   /* 화면에서 통과 · 서버 호출로만 · 미검증 */
let BR = null;
async function open(t, p, opt){
  opt = opt || {};
  const ctx = await BR.newContext(Object.assign({ viewport:{ width:opt.w || 1440, height:900 } },
    opt.admin ? { httpCredentials:{ username:"admin", password:E("PREVIEW_ADMIN_PASSWORD") } } : {},
    E("VERCEL_BYPASS") ? { extraHTTPHeaders:{ "x-vercel-protection-bypass":E("VERCEL_BYPASS") } } : {}));
  if(t) await ctx.addInitScript(v => { try{ localStorage.setItem("am.auth.v1", v); }catch(e){} }, JSON.stringify(t));
  const pg = await ctx.newPage(); const errs = []; pg.on("pageerror", e => errs.push(e.message));
  await pg.goto(BASE + p, { waitUntil:"networkidle" }); await pg.waitForTimeout(700);
  return { ctx, pg, errs };
}
const snap = (pg, name) => pg.screenshot({ path:path.join(OUT, name + ".png"), fullPage:true });
const viewTxt = pg => pg.evaluate(() => (document.getElementById("view") || document.body).innerText);
const okUI = (c, n, g) => { ok(c, "[화면] " + n, g); if(c) R.ui.push(n); };
const okSV = (c, n, g) => { ok(c, "[서버 호출] " + n, g); if(c) R.srv.push(n); };

async function submitQuote(t, extra){
  const o = await open(t, "/quote?side=close&sv=" + encodeURIComponent(SVC), { w:390 });
  const pg = o.pg;
  await pg.selectOption("#q-reg", "gyeonggi");
  await pg.fill("#q-name", "시험 고객"); await pg.fill("#q-tel", extra.tel);
  await pg.fill("#q-q", "로컬 시험 신청 — 실제 고객 아님"); await pg.check("#q-ag");
  await pg.waitForTimeout(300);
  const btn = pg.locator("#view form [type=submit]").first();
  const enabled = await btn.isEnabled();
  if(enabled) await btn.click();
  await pg.waitForTimeout(2500);
  const txt = await viewTxt(pg);
  const no = (txt.match(/SW-[A-Z0-9]{4}-[A-Z0-9]{4}/) || [""])[0];
  await snap(pg, extra.shot);
  await o.ctx.close();
  return { enabled, no, errs:o.errs };
}
async function adminMove(no, to, pv, agree, shotName){
  const o = await open(T.staff, "/admin", { admin:true });
  const pg = o.pg; await pg.waitForTimeout(1200);
  const row = pg.locator("#rq .rq-s-rq .rq-r", { hasText:no }).first();
  if(!(await row.count())) { await o.ctx.close(); return { err:"목록에 신청이 없습니다" }; }
  await row.locator(".rq-hd").first().click(); await pg.waitForTimeout(400);
  const dests = await pg.locator("#rq-to option").evaluateAll(L => L.map(o => o.value));
  if(dests.indexOf(to) < 0){ await o.ctx.close(); return { err:"갈 수 있는 길에 " + to + " 없음 (" + dests.join(",") + ")" }; }
  await pg.selectOption("#rq-to", to); await pg.waitForTimeout(300);
  let toast = "";
  if(pv){
    await pg.selectOption("#rq-pv", pv);
    if(agree === "try-without"){
      await pg.locator("#rq .rq-s-rq .rq-mv button", { hasText:"이 상태로 바꾸기" }).click(); await pg.waitForTimeout(600);
      toast = await pg.locator("#toast").textContent().catch(() => "");
    }
    await pg.locator("#rq-a3").check();
  }
  await pg.locator("#rq .rq-s-rq .rq-mv button", { hasText:"이 상태로 바꾸기" }).click(); await pg.waitForTimeout(1500);
  if(shotName) await snap(pg, shotName);
  const listTxt = await pg.locator("#rq").innerText();
  await o.ctx.close();
  return { toast, listTxt, errs:o.errs };
}
/* 상태는 직원 목록으로 읽습니다 (고객이 볼 수 있는지는 화면 검사가 따로 봅니다) */
const stateOf = async (t, no) => (find((await me(T.staff)).j, no) || {}).state;

(async () => {
  await guard();
  fs.mkdirSync(OUT, { recursive:true });
  if(E("SETUP_USERS") === "1"){
    console.log("\n▶ 시험 계정 만들기 (SETUP_USERS=1)");
    for(const k of Object.keys(MAIL)) console.log("   " + k + " " + await ensureUser(MAIL[k]));
    console.log("   → 이제 db/test/preview-seed.sql 로 역할 · 업체 연결을 넣고 SETUP_USERS 없이 다시 돌리세요"); return done();
  }
  console.log("\n▶ 시험 계정 로그인 (메일 발송 없음)");
  for(const k of Object.keys(MAIL)) T[k] = await tokenFor(MAIL[k]);
  for(const [k, want] of [["staff","staff"],["pva","provider"],["pvb","provider"],["cust","customer"],["cust2","customer"]]){
    const s = await api("/api/session", { headers:as(T[k]) });
    ok(s.j && s.j.role === want, k + " 역할 " + want, s.j && s.j.role);
  }
  const { chromium } = require("playwright"); BR = await chromium.launch();

  console.log("\n▶ ① 견적 신청 — 고객이 /quote 화면에서");
  const tel = "010-0000-" + String(Date.now()).slice(-4);
  const s1 = await submitQuote(T.cust, { tel, shot:"01-고객-견적신청-완료" });
  okUI(s1.enabled, "보내기 단추가 열려 있음 (접수 열림)");
  okUI(/^SW-/.test(s1.no), "접수번호가 화면에 나옴 " + s1.no, s1);
  okUI(s1.errs.length === 0, "신청 화면 JS 에러 0", s1.errs.join("|"));
  const NO = s1.no; if(!NO){ await BR.close(); return done(); }

  console.log("\n▶ 배정 전 — 다른 고객 · 업체 화면");
  for(const [k, n] of [["cust2","다른 고객"],["pva","업체 A"],["pvb","업체 B"]]){
    const o = await open(T[k], "/my", { w:390 }); const t = await viewTxt(o.pg);
    okUI(t.indexOf(NO) < 0 && t.indexOf(tel) < 0, n + " /my 에 신청 · 연락처가 안 보임");
    if(k === "pvb") await snap(o.pg, "02-업체B-배정전-my"); await o.ctx.close();
  }
  for(const k of ["cust2","pva","pvb"]) okSV(!find((await me(T[k])).j, NO), k + " /api/me 에도 없음");
  okSV(!!find((await me(T.cust)).j, NO), "로그인한 고객의 신청이 그 계정에 이어짐 (/api/me)");
  { const o = await open(T.cust, "/my", { w:390 }); okUI((await viewTxt(o.pg)).indexOf(NO) >= 0, "고객 본인 /my 에 신청이 보임"); await snap(o.pg, "03-고객-my-접수"); await o.ctx.close(); }

  console.log("\n▶ ② 관리자 확인 · 배정 — /admin 화면에서");
  const a1 = await adminMove(NO, "check", null, null, "04-관리자-확인");
  okUI(!a1.err && (await stateOf(T.cust, NO)) === "check", "/admin 에서 확인(check)", a1.err);
  okUI(!a1.err && a1.listTxt.indexOf(tel) < 0, "/admin 목록에 연락처가 깔리지 않음");
  const a2 = await adminMove(NO, "assigned", PVA, "try-without", "05-관리자-배정");
  okUI(/제3자 제공 동의/.test(a2.toast || ""), "동의 없이 누르면 화면이 먼저 막고 까닭을 말함", a2.toast);
  okUI(!a2.err && (await stateOf(T.cust, NO)) === "assigned", "/admin 에서 업체 A 배정(동의 체크 후)", a2.err);
  { const o = await open(T.pva, "/my", { w:390 }); const t = await viewTxt(o.pg);
    okUI(t.indexOf(NO) >= 0 && t.indexOf(tel) >= 0, "업체 A /my 에 신청과 연락처가 보임"); await snap(o.pg, "06-업체A-배정후-my"); await o.ctx.close(); }
  for(const [k, n] of [["pvb","업체 B"],["cust2","다른 고객"]]){
    const o = await open(T[k], "/my", { w:390 }); const t = await viewTxt(o.pg);
    okUI(t.indexOf(NO) < 0 && t.indexOf(tel) < 0, n + " /my 에 여전히 안 보임 (배정 후)"); await o.ctx.close();
  }
  const RID = (find((await me(T.staff)).j, NO) || {}).id;

  console.log("\n▶ ③ 업체 수락 · 견적");
  { const o = await open(T.pva, "/my", { w:390 }); const t = await viewTxt(o.pg);
    const hasBtn = await o.pg.locator("button", { hasText:/수락/ }).count();
    ok(true, "[화면] 업체 /my 수락 단추 수: " + hasBtn + (hasBtn ? "" : " — 없음(화면에 '배정을 수락하시면' 안내만)")); if(!hasBtn) R.no.push("업체 수락 · 상담 시작 화면 단추 없음"); await o.ctx.close(); }
  okSV((await deal(T.pvb, "answer_assignment", { p_request:RID, p_yes:true })).s >= 400, "업체 B 는 수락 못 함");
  okSV((await deal(T.pva, "answer_assignment", { p_request:RID, p_yes:true })).s === 200, "업체 A 수락");
  okSV((await deal(T.pva, "move_state", { p_request:RID, p_to:"consult", p_ctx:{} })).s === 200, "업체 A 상담 시작");
  { const o = await open(T.pva, "/my", { w:390 }); const pg = o.pg;
    const b = pg.locator("button", { hasText:"견적 내기" }).first();
    if(await b.count()){
      await b.click(); await pg.waitForTimeout(400);
      await pg.fill("#myq-amt", "3300000"); await pg.fill("#myq-sc", "로컬 시험 견적 — 주방 · 홀 철거");
      if(await pg.locator("#myq-dy").count()) await pg.fill("#myq-dy", "3");
      await snap(pg, "07-업체A-견적작성");
      await pg.locator("button", { hasText:/견적 보내기|보내기|제출/ }).first().click(); await pg.waitForTimeout(1500);
    }
    okUI((await stateOf(T.cust, NO)) === "quoted", "업체 A 가 /my 화면에서 견적 제출 → quoted");
    await snap(pg, "08-업체A-견적제출후"); await o.ctx.close(); }

  console.log("\n▶ ④ 고객 조회 · 선택 — /my 화면");
  { const o = await open(T.cust, "/my", { w:390 }); const pg = o.pg; const t = await viewTxt(pg);
    okUI(/3,300,000/.test(t), "고객 /my 에 받은 견적 금액이 보임");
    okUI(!/수수료/.test(t), "고객 화면에 수수료가 없음");
    await snap(pg, "09-고객-견적비교");
    const pick = pg.locator("button[onclick^='myqPick']").first();
    if(await pick.count()){ pg.once("dialog", d => d.accept()); await pick.click(); await pg.waitForTimeout(1500); }
    await o.ctx.close(); }
  { const qs = ((await me(T.cust)).j || {}).quotes || [];
    okUI(qs.some(q => q.state === "chosen"), "고객이 /my 화면에서 견적 선택 → chosen", qs.map(q => q.state).join(",")); }
  okSV((await deal(T.cust2, "choose_quote", { p_request:RID, p_provider:PVA })).s >= 400, "다른 고객은 고르지 못함");

  console.log("\n▶ ⑤ 계약 → 완료 — /admin 화면");
  const a3 = await adminMove(NO, "nego", null, null, null);
  okUI(!a3.err && (await stateOf(T.cust, NO)) === "nego", "/admin 에서 협의(nego)", a3.err);
  const signed = await deal(T.staff, "move_state", { p_request:RID, p_to:"signed", p_ctx:{ amount:3300000, providerId:PVA } });
  okSV(signed.s === 200, "계약(signed) — 계약금액 입력", signed.j);
  const a4 = await adminMove(NO, "done", null, null, "10-관리자-완료");
  okUI(!a4.err && (await stateOf(T.cust, NO)) === "done", "/admin 에서 완료(done)", a4.err);
  { const o = await open(T.cust, "/my", { w:390 }); await snap(o.pg, "11-고객-완료-my"); await o.ctx.close(); }

  console.log("\n▶ ⑥ 취소 — 다른 신청 (고객 화면 신청 → 본인 취소)");
  const tel2 = "010-0001-" + String(Date.now()).slice(-4);
  const s2 = await submitQuote(T.cust, { tel:tel2, shot:"12-고객-두번째신청" });
  okUI(/^SW-/.test(s2.no), "두 번째 신청 접수 " + s2.no);
  const RID2 = (find((await me(T.staff)).j, s2.no) || {}).id;
  okSV((await deal(T.cust2, "move_state", { p_request:RID2, p_to:"lost", p_ctx:{ why:"x" } })).s >= 400, "다른 고객은 취소 못 함");
  { const o = await open(T.cust, "/my", { w:390 }); const pg = o.pg;
    const cb = pg.locator("button", { hasText:/취소/ });
    const n = await cb.count(); ok(true, "[화면] 고객 /my 취소 단추 수: " + n); if(!n) R.no.push("고객 /my 에 신청 취소 단추 없음"); await o.ctx.close(); }
  okSV((await deal(T.cust, "move_state", { p_request:RID2, p_to:"lost", p_ctx:{ why:"로컬 시험 취소" } })).s === 200, "고객 본인 취소(lost)");
  okSV((await stateOf(T.cust, s2.no)) === "lost", "고객 조회 상태 lost");

  await BR.close();
  console.log("\n   시험 접수번호: " + NO + " · " + s2.no);
  console.log("\n▶ 요약 — 화면 통과 " + R.ui.length + " · 서버 호출로만 " + R.srv.length + " · 화면 단추 없음 " + R.no.length);
  R.no.forEach(x => console.log("   ⚪ " + x));
  fs.writeFileSync(path.join(OUT, "result.json"), JSON.stringify(R, null, 1));
  done();
})().catch(async e => { bad++; console.log("  ❌ 멈춤: " + e.message); try{ if(BR) await BR.close(); }catch(x){} done(); });
function done(){ console.log("\n" + (bad ? "❌ " + bad + "건 실패" : "✅ 전부 통과") + " — " + pass + "개"); process.exitCode = bad ? 1 : 0; }
