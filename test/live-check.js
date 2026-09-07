#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   실제 Supabase 점검 — 가짜 클라이언트가 아니라 진짜 DB에 물어봅니다.

   회귀 테스트 27종은 test/fake-sb.js(가짜)로 돌기 때문에, 실제 DB의
   표·컬럼·RLS 가 코드와 맞는지는 확인되지 않습니다. 이 스크립트가
   그 간극을 메웁니다.

     node test/live-check.js                     # 읽기만 (안전)
     node test/live-check.js --write             # 쓰기·삭제까지 시도
     node test/live-check.js --url ... --key ... # 다른 프로젝트로

   기본값은 index.html 에 박혀 있는 프로젝트 URL·anon 키입니다.
   환경변수 SUPABASE_URL · SUPABASE_ANON_KEY 로도 넘길 수 있습니다.

   ── 이 스크립트가 하는 일
     1. 연결      REST 엔드포인트가 응답하는가
     2. 표        코드가 쓰는 표 18개가 실제로 있는가
     3. 컬럼      코드가 읽고 쓰는 컬럼이 다 있는가 (없으면 이름을 찍습니다)
     4. RLS       anon 키로 무엇까지 되는가 — 읽기 / (--write) 쓰기 / 삭제
     5. 저장소    supplier-photos 버킷이 있는가
     6. 실시간    발행 목록은 REST 로 볼 수 없어 안내만 합니다

   ── 하지 않는 일
     표를 만들지 않습니다. db/phase*.sql 은 Supabase SQL Editor 에서
     사람이 직접 실행해야 합니다 (anon 키로는 DDL 이 불가능합니다).
     --write 를 주지 않으면 아무것도 쓰지 않습니다.
   ════════════════════════════════════════════════════════════════════ */

const fs = require("fs");
const path = require("path");

/* ── 설정 ── */
const argv = process.argv.slice(2);
const argOf = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const DO_WRITE = argv.includes("--write");

function fromIndexHtml() {
  try {
    const s = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
    const u = s.match(/var SU="([^"]+)"/);
    const k = s.match(/var SK="([^"]+)"/);
    return { url: u && u[1], key: k && k[1] };
  } catch (e) { return {}; }
}
const fallback = fromIndexHtml();
const URL_ = (argOf("--url") || process.env.SUPABASE_URL || fallback.url || "").replace(/\/+$/, "");
const KEY = argOf("--key") || process.env.SUPABASE_ANON_KEY || fallback.key || "";

if (!URL_ || !KEY) {
  console.error("Supabase URL 과 anon 키를 찾지 못했습니다.\n" +
    "  node test/live-check.js --url https://xxx.supabase.co --key eyJ...");
  process.exit(2);
}

/* ── 코드가 기대하는 표와 컬럼 ──
   phase2~7 SQL 과 src/ 의 insert 페이로드에서 뽑았습니다.
   "필수" 는 없으면 화면이 실제로 깨지는 것, "선택" 은 없어도
   insertSafe 가 그 컬럼만 빼고 넘어가는 것입니다. */
const EXPECT = [
  { t: "purchase_requests", phase: "기존 + phase2",
    must: ["id", "created_at", "status", "region", "description"],
    want: ["user_id", "title", "category", "category_main", "subcategory", "detail",
           "deadline", "priority", "visibility", "quote_count", "selected_quote_id",
           "closed_at", "buyer_name", "buyer_phone", "request_number"] },
  { t: "suppliers", phase: "기존 + phase2",
    must: ["id", "created_at", "name", "region"],
    want: ["user_id", "categories", "category_mains", "services", "items", "haccp",
           "brn", "brn_verified", "is_verified", "images", "intro", "description",
           "deal_count", "review_count", "address", "contact", "rep_name",
           "min_qty", "lead_time", "rating", "regions", "instant_quote",
           "instant_note", "notify_on", "response_rate", "avg_response_min"] },
  { t: "jobs", phase: "기존 + phase2",
    must: ["id", "created_at", "status"],
    want: ["user_id", "kind", "job_role", "employment", "pay", "location",
           "company", "contact", "detail", "is_urgent", "benefits",
           "applicant_name", "experience"] },
  { t: "quotes", phase: "phase2",
    must: ["id", "created_at", "request_id", "status"],
    want: ["supplier_id", "supplier_name", "user_id", "unit_price", "qty", "total",
           "lead_time", "note", "valid_until"] },
  { t: "reviews", phase: "phase2",
    must: ["id", "created_at", "target_type", "target_id", "rating"],
    want: ["author_name", "user_id", "content", "request_id", "deal_summary"] },
  { t: "day_jobs", phase: "phase2",
    must: ["id", "created_at", "status"],
    want: ["user_id", "work", "work_date", "pay_type", "pay", "region", "headcount", "contact"] },
  { t: "day_job_applications", phase: "phase2",
    must: ["id", "created_at", "day_job_id", "status"],
    want: ["user_id", "applicant_name", "contact", "experience"] },
  { t: "worker_profiles", phase: "phase2",
    must: ["id", "created_at"],
    want: ["user_id", "name", "contact", "region", "skills", "experience", "rating", "job_count"] },
  { t: "favorites", phase: "phase2",
    must: ["id", "created_at", "user_id", "target_type", "target_id"], want: [] },
  { t: "notifications", phase: "phase2",
    must: ["id", "created_at", "user_id", "type", "title", "is_read"],
    want: ["body", "link"] },
  { t: "supplier_prefs", phase: "phase3",
    must: ["id", "supplier_id"],
    want: ["user_id", "category_mains", "regions", "notify_on", "min_amount"] },
  { t: "verifications", phase: "phase3",
    must: ["id", "created_at", "target_type", "target_id", "kind", "status"],
    want: ["user_id", "number", "holder", "reviewed_at", "admin_memo"] },
  { t: "chat_rooms", phase: "phase3",
    must: ["id", "created_at"],
    want: ["request_id", "quote_id", "buyer_id", "supplier_id", "supplier_name", "last_message_at"] },
  { t: "chat_messages", phase: "phase3",
    must: ["id", "created_at", "room_id", "sender_id", "body"],
    want: ["is_read", "sender_name"] },
  { t: "orders", phase: "phase3",
    must: ["id", "created_at", "status"],
    want: ["request_id", "quote_id", "buyer_id", "supplier_id", "supplier_name", "total", "memo"] },
  { t: "market_prices", phase: "phase3",
    must: ["id", "category", "item", "price", "price_date"],
    want: ["grade", "unit", "source", "change"] },
  { t: "admins", phase: "phase4", adminOnly: true,
    must: ["user_id"], want: ["email", "created_at"] },
  { t: "reports", phase: "phase7 (선택)", optional: true,
    must: ["id", "created_at", "target_type", "target_id", "reason", "status"],
    want: ["target_name", "detail", "reporter_id", "reporter_name", "reporter_phone", "admin_memo"] },
  { t: "inquiries", phase: "phase7 (선택)", optional: true,
    must: ["id", "created_at", "kind", "name", "content", "status"],
    want: ["phone", "email", "user_id", "answer"] },
];

/* ── HTTP ── */
async function rest(pathname, opt) {
  opt = opt || {};
  const res = await fetch(URL_ + pathname, {
    method: opt.method || "GET",
    headers: Object.assign({
      apikey: KEY,
      Authorization: "Bearer " + KEY,
      "Content-Type": "application/json",
      Prefer: opt.prefer || "count=exact",
    }, opt.headers || {}),
    body: opt.body ? JSON.stringify(opt.body) : undefined,
  });
  let json = null, text = "";
  try { text = await res.text(); json = text ? JSON.parse(text) : null; } catch (e) {}
  return { status: res.status, ok: res.ok, json, text, headers: res.headers };
}

const C = { ok: "✅", no: "❌", warn: "⚠️ ", dot: "·" };
let problems = 0, warns = 0;
const line = (s) => console.log(s);

/* ── 1. 연결 ── */
async function checkConnect() {
  line("\n1. 연결");
  line("   " + URL_);
  try {
    const r = await rest("/rest/v1/");
    if (r.status === 0) throw new Error("응답 없음");
    line(`   ${C.ok} REST 응답 (HTTP ${r.status})`);
    return true;
  } catch (e) {
    problems++;
    line(`   ${C.no} 연결 실패: ${e.message}`);
    line("      · 주소·키가 맞는지, 이 컴퓨터에서 supabase.co 로 나갈 수 있는지 확인하세요.");
    return false;
  }
}

/* ── 2·3. 표와 컬럼 ── */
function missingColumnOf(err) {
  const m = ((err && err.message) || "") + " " + ((err && err.details) || "") + " " +
            ((err && err.hint) || "");
  const mm = m.match(/column\s+"?([A-Za-z0-9_.]+)"?\s+does not exist/i) ||
             m.match(/'([A-Za-z0-9_]+)'\s+column/);
  return mm ? String(mm[1]).split(".").pop() : null;
}

/* 한 번에 다 물어보고, 없다는 컬럼을 하나씩 빼면서 다시 물어봅니다 */
async function probeColumns(table, cols) {
  let left = cols.slice(), missing = [];
  for (let i = 0; i < cols.length + 2 && left.length; i++) {
    const r = await rest(`/rest/v1/${table}?select=${left.join(",")}&limit=1`);
    if (r.ok) return { missing, blocked: false };
    const col = missingColumnOf(r.json);
    if (col && left.indexOf(col) >= 0) { missing.push(col); left = left.filter((c) => c !== col); continue; }
    return { missing, blocked: true, err: (r.json && r.json.message) || r.text, status: r.status };
  }
  return { missing, blocked: false };
}

async function checkTables() {
  line("\n2. 표와 컬럼");
  const state = {};
  for (const e of EXPECT) {
    const head = await rest(`/rest/v1/${e.t}?select=*&limit=1`);
    const msg = (head.json && (head.json.message || head.json.hint)) || "";

    if (head.status === 404 || /PGRST205|Could not find the table|does not exist/i.test(msg + (head.json && head.json.code || ""))) {
      state[e.t] = "missing";
      if (e.optional) { warns++; line(`   ${C.warn}${e.t.padEnd(22)} 없음 — ${e.phase}`); }
      else { problems++; line(`   ${C.no} ${e.t.padEnd(22)} 없음 — ${e.phase} 를 실행하세요`); }
      continue;
    }
    if (head.status === 401 || head.status === 403) {
      state[e.t] = "blocked";
      line(`   ${C.ok} ${e.t.padEnd(22)} 있음 (anon 읽기 차단 — RLS 적용됨)`);
      continue;
    }
    if (!head.ok) {
      state[e.t] = "error";
      problems++;
      line(`   ${C.no} ${e.t.padEnd(22)} HTTP ${head.status} ${String(msg).slice(0, 70)}`);
      continue;
    }

    state[e.t] = "open";
    const rows = head.headers.get("content-range") || "";
    const total = rows.split("/")[1] || "?";
    const must = await probeColumns(e.t, e.must);
    const want = await probeColumns(e.t, e.want);

    if (must.missing.length) {
      problems++;
      line(`   ${C.no} ${e.t.padEnd(22)} 있음(${total}행) — 필수 컬럼 없음: ${must.missing.join(", ")}`);
    } else if (want.missing.length) {
      warns++;
      line(`   ${C.warn}${e.t.padEnd(22)} 있음(${total}행) — 선택 컬럼 없음: ${want.missing.join(", ")}`);
      line(`      ${C.dot} ${e.phase} 를 실행하면 채워집니다. 지금은 그 값만 빠진 채 저장됩니다.`);
    } else {
      line(`   ${C.ok} ${e.t.padEnd(22)} 있음(${total}행) — 컬럼 ${e.must.length + e.want.length}개 모두 확인`);
    }
  }
  return state;
}

/* ── 4. RLS ── */
const WRITE_PROBE = {
  purchase_requests: { title: "[고리 점검] 삭제해도 되는 행", description: "live-check", status: "견적대기" },
  suppliers:         { name: "[고리 점검] 삭제해도 되는 행", region: "서울" },
};

async function checkRLS(state) {
  line("\n3. RLS — anon 키(공개 키)로 무엇까지 되는가");
  const readable = EXPECT.filter((e) => state[e.t] === "open").map((e) => e.t);
  const blocked  = EXPECT.filter((e) => state[e.t] === "blocked").map((e) => e.t);

  if (blocked.length) line(`   ${C.ok} 읽기 차단됨: ${blocked.join(", ")}`);
  if (readable.length) {
    line(`   ${C.dot} 누구나 읽을 수 있는 표: ${readable.join(", ")}`);
    line("      요청·업체·구인구직·시세는 원래 공개라 정상입니다.");
    const leak = readable.filter((t) =>
      ["notifications", "chat_messages", "chat_rooms", "orders", "quotes",
       "verifications", "admins", "reports", "inquiries", "worker_profiles"].indexOf(t) >= 0);
    if (leak.length) {
      problems++;
      line(`   ${C.no} 개인 정보가 담긴 표를 누구나 읽습니다: ${leak.join(", ")}`);
      line("      db/phase2_schema.sql · phase4_admin.sql 의 RLS 블록을 실행하세요.");
    }
  }

  if (!DO_WRITE) {
    line(`   ${C.warn}쓰기·삭제 권한은 확인하지 않았습니다 (--write 를 주면 실제로 시도합니다).`);
    warns++;
    return;
  }

  line("   --write : 표시용 행을 넣고 바로 지웁니다");
  for (const t of Object.keys(WRITE_PROBE)) {
    if (state[t] !== "open") continue;
    const ins = await rest(`/rest/v1/${t}`, { method: "POST", body: WRITE_PROBE[t], prefer: "return=representation" });
    if (!ins.ok) { line(`   ${C.ok} ${t.padEnd(22)} anon 쓰기 차단 (HTTP ${ins.status})`); continue; }
    const row = (ins.json && ins.json[0]) || null;
    const id = row && row.id;
    line(`   ${C.warn}${t.padEnd(22)} anon 이 행을 넣을 수 있습니다 (로그인 없이 등록을 허용한다면 정상)`);
    warns++;
    if (!id) continue;
    const del = await rest(`/rest/v1/${t}?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
    if (del.ok) {
      problems++;
      line(`   ${C.no} ${t.padEnd(22)} anon 이 행을 지울 수 있습니다 — 남의 데이터도 지울 수 있다는 뜻입니다`);
      line("      db/phase4_admin.sql 5번 블록(RLS)을 지금 실행하세요.");
    } else {
      line(`   ${C.ok} ${t.padEnd(22)} anon 삭제 차단 (HTTP ${del.status}) — 넣은 점검용 행은 남아 있으니 직접 지워주세요`);
    }
  }
}

/* ── 5. 저장소 ── */
async function checkStorage() {
  line("\n4. 저장소 (업체 사진)");
  const r = await rest("/storage/v1/object/list/supplier-photos", {
    method: "POST", body: { prefix: "", limit: 1 } });
  if (r.ok) { line(`   ${C.ok} supplier-photos 버킷 있음`); return; }
  if (r.status === 400 || r.status === 404) {
    warns++;
    line(`   ${C.warn}supplier-photos 버킷을 찾지 못했습니다 (HTTP ${r.status})`);
    line("      db/phase5_storage.sql 을 실행하거나 Supabase → Storage 에서 만드세요.");
    line("      없어도 사진만 못 올리고 업체 등록은 됩니다.");
    return;
  }
  line(`   ${C.dot} 확인 불가 (HTTP ${r.status}) — 버킷이 비공개면 이렇게 나옵니다`);
}

/* ── 6. 실시간 ── */
function noteRealtime() {
  line("\n5. 실시간 갱신");
  line(`   ${C.dot} 발행 목록(supabase_realtime)은 REST 로 확인할 수 없습니다.`);
  line("      Supabase → Database → Replication 에서 notifications · chat_messages ·");
  line("      quotes 가 켜져 있는지 보세요. 안 켜도 폴링으로 동작합니다 (db/phase6_realtime.sql).");
}

/* ── 실행 ── */
(async () => {
  line("═".repeat(66));
  line("  고리 — 실제 Supabase 점검" + (DO_WRITE ? "  [--write: 쓰기까지 시도]" : "  [읽기 전용]"));
  line("═".repeat(66));

  if (!(await checkConnect())) { summary(); return; }
  const state = await checkTables();
  await checkRLS(state);
  await checkStorage();
  noteRealtime();
  summary();

  function summary() {
    line("\n" + "═".repeat(66));
    if (!problems && !warns) line(`  ${C.ok} 전부 정상 — 실제 DB 가 코드와 맞습니다`);
    else line(`  문제 ${problems}건 · 확인 필요 ${warns}건`);
    line("═".repeat(66));
    process.exit(problems ? 1 : 0);
  }
})().catch((e) => {
  console.error("\n" + C.no + " 점검 중 오류: " + (e && e.message));
  console.error("   supabase.co 로 나가는 네트워크가 막혀 있으면 이렇게 됩니다.");
  process.exit(2);
});
