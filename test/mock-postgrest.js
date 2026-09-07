/* live-check.js 의 판정 로직을 검증하기 위한 최소 PostgREST 흉내 */
const http = require("http");

const SCENARIO = process.argv[2] || "ok";
const PORT = Number(process.argv[3] || 8899);

/* 시나리오별 스키마 */
const FULL = {
  purchase_requests: ["id","created_at","status","region","description","user_id","title","category","category_main","subcategory","detail","deadline","priority","visibility","quote_count","selected_quote_id","closed_at","buyer_name","buyer_phone","request_number"],
  suppliers: ["id","created_at","name","region","user_id","categories","category_mains","services","items","haccp","brn","brn_verified","is_verified","images","intro","description","deal_count","review_count","address","contact","rep_name","min_qty","lead_time","rating","regions","instant_quote","instant_note","notify_on","response_rate","avg_response_min"],
  jobs: ["id","created_at","status","user_id","kind","job_role","employment","pay","location","company","contact","detail","is_urgent","benefits","applicant_name","experience"],
  quotes: ["id","created_at","request_id","status","supplier_id","supplier_name","user_id","unit_price","qty","total","lead_time","note","valid_until"],
  reviews: ["id","created_at","target_type","target_id","rating","author_name","user_id","content","request_id","deal_summary"],
  day_jobs: ["id","created_at","status","user_id","work","work_date","pay_type","pay","region","headcount","contact"],
  day_job_applications: ["id","created_at","day_job_id","status","user_id","applicant_name","contact","experience"],
  worker_profiles: ["id","created_at","user_id","name","contact","region","skills","experience","rating","job_count"],
  favorites: ["id","created_at","user_id","target_type","target_id"],
  notifications: ["id","created_at","user_id","type","title","is_read","body","link"],
  supplier_prefs: ["id","supplier_id","user_id","category_mains","regions","notify_on","min_amount"],
  verifications: ["id","created_at","target_type","target_id","kind","status","user_id","number","holder","reviewed_at","admin_memo"],
  chat_rooms: ["id","created_at","request_id","quote_id","buyer_id","supplier_id","supplier_name","last_message_at"],
  chat_messages: ["id","created_at","room_id","sender_id","body","is_read","sender_name"],
  orders: ["id","created_at","status","request_id","quote_id","buyer_id","supplier_id","supplier_name","total","memo"],
  market_prices: ["id","category","item","price","price_date","grade","unit","source","change"],
  admins: ["user_id","email","created_at"],
  reports: ["id","created_at","target_type","target_id","reason","status","target_name","detail","reporter_id","reporter_name","reporter_phone","admin_memo"],
  inquiries: ["id","created_at","kind","name","content","status","phone","email","user_id","answer"],
};

let SCHEMA = JSON.parse(JSON.stringify(FULL));
/* anon 이 읽을 수 있는 표 (RLS select 정책이 열려 있는 것) */
let READABLE = new Set(["purchase_requests","suppliers","jobs","market_prices"]);
let ANON_INSERT = new Set(["purchase_requests"]);
let ANON_DELETE = new Set();

if (SCENARIO === "phase2-missing") {
  /* phase2·3 미실행 — 새 표가 없고 기존 표에 컬럼도 없음 */
  ["quotes","reviews","day_jobs","day_job_applications","worker_profiles","favorites",
   "notifications","supplier_prefs","verifications","chat_rooms","chat_messages",
   "orders","market_prices","admins","reports","inquiries"].forEach(t => delete SCHEMA[t]);
  SCHEMA.purchase_requests = ["id","created_at","status","region","description","buyer_name","buyer_phone","quote_count","category","request_number"];
  SCHEMA.suppliers = ["id","created_at","name","region","categories","contact","rating","is_verified"];
  SCHEMA.jobs = ["id","created_at","status","kind","job_role","pay","location","company","contact"];
  READABLE = new Set(["purchase_requests","suppliers","jobs"]);
}
if (SCENARIO === "rls-off") {
  /* RLS 를 안 켠 상태 — 전부 읽히고, anon 이 지울 수도 있음 */
  READABLE = new Set(Object.keys(SCHEMA));
  ANON_INSERT = new Set(["purchase_requests","suppliers"]);
  ANON_DELETE = new Set(["purchase_requests","suppliers"]);
}
if (SCENARIO === "no-phase7") {
  delete SCHEMA.reports; delete SCHEMA.inquiries;
  READABLE.delete("reports"); READABLE.delete("inquiries");
}

function send(res, code, body, extra) {
  res.writeHead(code, Object.assign({ "Content-Type": "application/json" }, extra || {}));
  res.end(body == null ? "" : JSON.stringify(body));
}

http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  const p = u.pathname;

  if (p === "/rest/v1/" ) return send(res, 200, {});
  if (p.startsWith("/storage/v1/object/list/")) {
    const bucket = p.split("/").pop();
    return bucket === "supplier-photos" ? send(res, 200, []) : send(res, 400, { message: "Bucket not found" });
  }

  const m = p.match(/^\/rest\/v1\/([a-z_]+)$/);
  if (!m) return send(res, 404, { message: "no route" });
  const table = m[1];

  if (!SCHEMA[table]) {
    return send(res, 404, { code: "PGRST205",
      message: `Could not find the table 'public.${table}' in the schema cache` });
  }

  if (req.method === "POST") {
    if (!ANON_INSERT.has(table)) return send(res, 401, { message: "new row violates row-level security policy" });
    return send(res, 201, [{ id: "probe-1" }]);
  }
  if (req.method === "DELETE") {
    if (!ANON_DELETE.has(table)) return send(res, 401, { message: "row-level security" });
    return send(res, 204, null);
  }

  if (!READABLE.has(table)) return send(res, 401, { message: "permission denied" });

  const sel = u.searchParams.get("select") || "*";
  if (sel !== "*") {
    const cols = sel.split(",");
    const bad = cols.find(c => SCHEMA[table].indexOf(c) < 0);
    if (bad) return send(res, 400, { code: "42703",
      message: `column ${table}.${bad} does not exist` });
  }
  send(res, 200, [], { "Content-Range": "0-0/3" });
}).listen(PORT, () => console.log("mock postgrest :" + PORT + "  시나리오=" + SCENARIO));
