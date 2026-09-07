/* ════════════════════════════════════════════════════════════════════
   코드가 실제 DB 에 기대하는 표와 컬럼

   db/phase2~7 SQL 과 src/ 의 insert 페이로드에서 뽑았습니다.
   두 곳에서 같이 읽습니다 — 한 곳만 고쳐서 어긋나는 일이 없게.

     test/live-check.js   터미널 점검
     db-check.html        브라우저 점검 (버튼 하나)

   must : 없으면 화면이 실제로 깨지는 컬럼
   want : 없어도 insertSafe 가 그 컬럼만 빼고 넘어가는 컬럼
   ════════════════════════════════════════════════════════════════════ */
(function(root){
  var EXPECT = [
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
];;
  if (typeof module !== "undefined" && module.exports) module.exports = EXPECT;
  else root.GORI_DB_EXPECT = EXPECT;
})(typeof globalThis !== "undefined" ? globalThis : this);
