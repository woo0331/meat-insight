/* Preview 사전 점검 — **읽기만** 합니다 (2026-11-24).
   tools/preview-e2e.js 를 돌리기 전에, 그 Preview 가 정말 운영과 떨어진 시험 DB 에 물려 있는지와
   알림이 어디로 나갈 수 있는지를 서버에게 직접 물어봅니다.

   ⚠️⚠️ 신청 · 계정 생성 · 상태 변경 · 메일 발송을 **하나도 하지 않습니다.** GET 둘(/api/session · /api/admin-health)뿐입니다.
   ⚠️ 키 값은 받지도 출력하지도 않습니다. 관리자 비밀번호는 있으면 /api/admin-health 를 읽는 데만 씁니다.
   ⚠️ 스키마 판 번호만으로 "시험 DB 다" 라고 판정하지 않습니다 — 판 번호가 같은 프로젝트는 여럿일 수 있습니다.
      판정은 ref(주소)로 하고, 판 번호는 "마이그레이션을 다 돌렸는가" 를 보는 데만 씁니다.

   필요한 값:  PREVIEW_URL · TEST_REF   (선택) VERCEL_BYPASS · PREVIEW_ADMIN_PASSWORD
   돌리기:     node tools/preview-preflight.js
   종료 코드:  0 통과 · 1 고칠 것 있음 · 2 안전장치에서 멈춤 */
const E = k => (process.env[k] || "").trim();
const BASE = E("PREVIEW_URL").replace(/\/+$/, ""), REF = E("TEST_REF");
/* 운영으로 기록된 ref · 기존 프로젝트 둘 — preview-e2e.js 의 NEVER 와 같아야 합니다 */
const NEVER = ["gxjzlkvdbafzfjuunvyx", "igignylgzjphtnyxhhsd"];
const WANT_SCHEMA = (() => { try{ const m = require("../api/_migrations.js"); return m[m.length - 1][0]; }catch(e){ return 0; } })();
let bad = 0, warn = 0;
const ok = (c, m, d) => { if(!c) bad++; console.log((c ? "  ✅ " : "  ❌ ") + m + (d !== undefined ? "  — " + d : "")); };
const note = (m) => { warn++; console.log("  ⚠️ " + m); };
const die = m => { console.log("⛔ " + m); process.exit(2); };
const refOf = u => { const m = /^https:\/\/([a-z0-9]{20})\.supabase\.co/.exec(String(u || "")); return m ? m[1] : ""; };
function hdr(extra){ const h = Object.assign({}, extra || {}); if(E("VERCEL_BYPASS")) h["x-vercel-protection-bypass"] = E("VERCEL_BYPASS"); return h; }
async function get(p, extra){ const r = await fetch(BASE + p, { headers:hdr(extra) }); let j = null; try{ j = await r.json(); }catch(e){} return { s:r.status, j }; }

(async () => {
  console.log("\n▶ 안전장치 (보내기 전)");
  if(!BASE || !REF) die("PREVIEW_URL · TEST_REF 가 필요합니다");
  let host = ""; try{ host = new URL(BASE).host; }catch(e){ die("PREVIEW_URL 꼴이 아닙니다"); }
  if(/(^|\.)storeway\.co\.kr$/.test(host) || host === "meat-insight.vercel.app") die("운영 주소입니다 — 멈춥니다");
  if(!/\.vercel\.app$/.test(host)) die("Vercel Preview 주소(*.vercel.app)가 아닙니다 — 멈춥니다");
  if(!/^[a-z0-9]{20}$/.test(REF)) die("TEST_REF 꼴이 아닙니다 (20자)");
  if(NEVER.indexOf(REF) >= 0) die("기존 Supabase 프로젝트입니다 (운영일 수 있음) — 시험 전용으로 새로 만든 곳만 씁니다");
  ok(true, "운영 주소 아님 · 기존 두 프로젝트 아님");

  console.log("\n▶ Preview 가 물린 DB (/api/session)");
  const s = await get("/api/session");
  if(s.s === 401 || s.s === 403) die("Preview 보호에 막혔습니다 (" + s.s + ") — VERCEL_BYPASS 를 넣으세요");
  if(s.s !== 200 || !s.j) die("/api/session 응답이 없습니다 (" + s.s + ")");
  ok(!!s.j.auth && !!s.j.conf, "계정 기능 켜짐 (STOREWAY_ACCOUNTS_OPEN=1 · SUPABASE_URL · SUPABASE_ANON_KEY)", JSON.stringify({ auth:!!s.j.auth }));
  const got = s.j.conf ? refOf(s.j.conf.url) : "";
  if(got && got !== REF) die("Preview 가 다른 Supabase(" + got + ")에 물려 있습니다 — 시험 DB 가 아니면 진행하지 않습니다");
  if(NEVER.indexOf(got) >= 0) die("Preview 가 기존 프로젝트(" + got + ")에 물려 있습니다 — 멈춥니다");
  ok(got === REF, "Preview 의 Supabase ref = TEST_REF", got || "(못 읽음)");
  ok(!!(s.j.intake && s.j.intake.quote), "견적 접수 열림 (STOREWAY_INTAKE_OPEN=quote) — Preview 에서만", JSON.stringify(s.j.intake || {}));

  console.log("\n▶ 관리자 점검 (/api/admin-health · 값 없이 있다/없다만)");
  if(!E("PREVIEW_ADMIN_PASSWORD")){ note("PREVIEW_ADMIN_PASSWORD 가 없어 건너뜀 — 판 번호 · 알림 수신처 설정은 미확인"); }
  else {
    const auth = "Basic " + Buffer.from("admin:" + E("PREVIEW_ADMIN_PASSWORD")).toString("base64");
    const h = await get("/api/admin-health", { authorization:auth });
    if(h.s !== 200 || !h.j){ ok(false, "/api/admin-health 읽기", h.s); }
    else {
      ok(h.j.env === "preview", "도는 환경이 preview", h.j.env);
      ok(h.j.db && h.j.db.store && h.j.db.auth, "저장(service key) · 로그인(anon key) 둘 다", JSON.stringify({ store:h.j.db && h.j.db.store, auth:h.j.db && h.j.db.auth }));
      const mig = h.j.db && h.j.db.mig;
      if(mig && mig.known) ok(mig.left && mig.left.length === 0, "마이그레이션 다 돌림 (판 " + mig.at + " / 저장소 " + WANT_SCHEMA + ")", (mig.left || []).join(", "));
      else note("판 번호를 못 읽음 — 시험 DB 에서 db/verify.sql 로 확인");
      const c = h.j.common || {};
      if(c.webhook) note("INTAKE_WEBHOOK_URL 이 있습니다 — **격리된 시험 수신처**인지 대표님이 확인하셔야 합니다 (운영 슬랙이면 지우세요)");
      if(c.resend) note("RESEND_API_KEY 가 있습니다 — CUSTOMER_EMAIL_FROM · PARTNER_EMAIL_FROM 이 있으면 시험 메일이 실제로 나갑니다 (시험 계정 메일만 쓰세요)");
      if(!c.webhook && !c.resend) console.log("  ℹ️ 접수 알림 수신처 없음 — 알림 도착 검수는 못 합니다 (로그인 · 흐름 검수는 됩니다)");
      console.log("  ℹ️ DEAL_WEBHOOK_URL · *_EMAIL_FROM · CRON_SECRET 은 이 주소가 알려 주지 않습니다 — Vercel 목록에서 눈으로 확인");
    }
  }
  console.log("\n" + (bad ? "❌ 고칠 것 " + bad : "✅ 통과") + (warn ? " · ⚠️ " + warn : "") + "  → 통과면 tools/preview-e2e.js 로 넘어갑니다");
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log("⛔ " + e.message); process.exit(2); });
