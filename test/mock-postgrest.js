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

/* service_role 처럼 굴게 합니다 — tools/market-sync.js 는 이 키로 돌기
   때문에 RLS 를 지나갑니다. 넣은 내용을 기억해 두었다가 /__posted 로
   돌려주므로, 무엇이 저장됐는지 시험에서 확인할 수 있습니다. */
let POSTED = [];
let DELETED = [];
if (SCENARIO === "service") {
  ["market_prices"].forEach(t => { ANON_INSERT.add(t); ANON_DELETE.add(t); });
}
/* 어제 값 — 전일 대비(change) 계산이 맞는지 보려고 미리 넣어 둡니다 */
const PREV_ROWS = [
  { item:"한우 지육", grade:"1++",   price:24000, price_date:"2026-09-10" },
  { item:"한우 지육", grade:"1등급", price:20500, price_date:"2026-09-10" },
  { item:"돼지 지육", grade:"1등급", price:5820,  price_date:"2026-09-10" },
];

if (SCENARIO === "no-sort-column") {
  /* 오래 전에 만든 표 — 내용은 있는데 created_at 이 없습니다.
     맨몸 select 는 되고, .order("created_at") 만 400 이 납니다. */
  ["purchase_requests","suppliers","jobs"].forEach(t => {
    SCHEMA[t] = SCHEMA[t].filter(c => c !== "created_at");
  });
}

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

/* 프록시·방화벽이 가로채고 403 을 주는 상황.
   PostgREST 가 아닌 평문을 돌려주므로 점검 도구가 속으면 안 됩니다. */
const INTERCEPT = SCENARIO === "intercepted";

/* 실제 Supabase 처럼 CORS 를 허용합니다 (브라우저에서 db-check.html 이 부릅니다) */
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey,authorization,content-type,prefer,x-client-info",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Expose-Headers": "content-range",
};

function send(res, code, body, extra) {
  res.writeHead(code, Object.assign({ "Content-Type": "application/json" }, CORS, extra || {}));
  res.end(body == null ? "" : JSON.stringify(body));
}

http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  const p = u.pathname;

  if (req.method === "OPTIONS") { res.writeHead(204, CORS); return res.end(); }

  if (INTERCEPT) {
    res.writeHead(403, Object.assign({ "Content-Type": "text/plain" }, CORS));
    return res.end("Host not in allowlist: example.supabase.co. Add this host to your network egress settings to allow access.");
  }

  if (p === "/__posted") return send(res, 200, { posted: POSTED, deleted: DELETED });
  if (p === "/rest/v1/" ) return send(res, 200, { swagger:"2.0", info:{title:"standard public schema"}, paths:{} });
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

  /* 있는 표인데 **정렬용 칸이 없으면** PostgREST 는 400 을 돌려줍니다.
     표는 "있음" 으로 나오는데 사이트 화면에서는 목록이 텅 비고
     "서버에 연결할 수 없습니다" 가 뜨던 경우입니다. */
  const ord = u.searchParams.get("order");
  if (ord) {
    const col = String(ord).split(".")[0];
    if (col && SCHEMA[table].indexOf(col) < 0) {
      return send(res, 400, { code: "42703",
        message: `column ${table}.${col} does not exist` });
    }
  }

  if (req.method === "POST") {
    if (!ANON_INSERT.has(table)) return send(res, 401, { message: "new row violates row-level security policy" });
    if (SCENARIO === "service" && table === "market_prices") {
      let body = "";
      req.on("data", c => body += c);
      req.on("end", () => {
        try { const j = JSON.parse(body || "[]"); POSTED = POSTED.concat(Array.isArray(j) ? j : [j]); } catch(e){}
        send(res, 201, []);
      });
      return;
    }
    return send(res, 201, [{ id: "probe-1" }]);
  }
  if (req.method === "DELETE") {
    if (!ANON_DELETE.has(table)) return send(res, 401, { message: "row-level security" });
    if (SCENARIO === "service") DELETED.push(p + "?" + u.searchParams.toString());
    return send(res, 204, null);
  }

  if (SCENARIO === "service" && table === "market_prices" && u.searchParams.has("price_date")) {
    /* price_date=lt.YYYY-MM-DD — 어제 값을 돌려줍니다 */
    return send(res, 200, PREV_ROWS);
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
