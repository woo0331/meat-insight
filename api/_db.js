/* ════════════════════════════════════════════════════════════════════
   DB 로 붙는 자리 (Supabase · PostgREST)

   ⚠️ 밑줄로 시작합니다 — `/api/_db` 로 열리면 안 됩니다.

   ── 환경변수 ──────────────────────────────────────────
   SUPABASE_URL           프로젝트 주소
   SUPABASE_SERVICE_KEY   ⚠️⚠️ **RLS 를 통째로 지나가는 키**

   ⚠️⚠️ **SERVICE_KEY 를 화면에 내려보내지 마세요.** 그 키 하나가 새면
   손님 연락처와 계약금액 전부가 새는 것과 같습니다. 이 파일은
   `api/` 안에서만 읽히고, **값을 돌려주는 주소를 만들지 않습니다**
   (`api/admin-health.js` 가 "있는지" 만 알려 주는 그 방식).

   ⚠️⚠️ **설정 전에는 열지 않습니다** (fail-closed). 받을 곳이 없는데
   "저장되었습니다" 라고 하면 그게 절대 규칙 5 입니다 — `api/_send.js`
   가 받을 곳이 없을 때 503 을 돌려주는 것과 **같은 규칙**입니다.

   ⚠️⚠️ **시간 제한을 둡니다.** 이 저장소는 접수 fetch 에 제한이 없어서
   신호가 약한 곳에서 영원히 "보내는 중…" 이 되는 사고를 겪었습니다.
   서버 함수도 같습니다 — 멈춰 있으면 Vercel 이 함수를 끊어 버리고
   손님은 까닭을 모릅니다.

   ⚠️ 지금 이 파일을 **아무도 부르지 않습니다.** 3차에서 접수가 붙습니다.
   ════════════════════════════════════════════════════════════════════ */

const DB_TIMEOUT = 8000;      /* 8초. 접수 화면의 20초 안에 들어와야 합니다 */

/* 설정이 되어 있는가 — ⚠️ 공백만 있는 값은 **없는 것**으로 봅니다
   (Vercel 에 실수로 빈 칸을 저장하면 "넣었다" 고 착각하게 됩니다) */
function dbReady(){
  const u = process.env.SUPABASE_URL, k = process.env.SUPABASE_SERVICE_KEY;
  return !!(typeof u === "string" && u.trim() &&
            typeof k === "string" && k.trim());
}

function base(){
  return String(process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
}

/* ⚠️ 표 이름을 손님이 보낸 값에서 받지 마세요 — 소문자와 밑줄만
   남깁니다 (`api/_send.js` 가 kind 를 환경변수 키로 쓰기 전에 거르는
   것과 같은 까닭입니다). */
function safeTable(t){
  return String(t || "").toLowerCase().replace(/[^a-z_]/g, "").slice(0, 40);
}

/* ── DB 에러 본문에서 **개인정보를 걷어냅니다** (2026-10-25 §4) ──────
   ⚠️⚠️ **왜 필요한가.** PostgREST 는 거절할 때 JSON 을 돌려주는데
   `details` 에 **어긋난 줄을 되읽어** 적습니다 —

     {"code":"23505",
      "details":"Key (tel)=(010-1234-5678) already exists.",   ← 연락처!
      "message":"duplicate key value violates unique constraint ..."}

   그걸 그대로 `console.error` 에 적으면 **Vercel 로그에 손님 연락처가
   남습니다.** 로그는 지우기 어렵고 수탁 범위도 아닙니다 — 이 저장소가
   감사 기록(`audit_log`)에 성함 · 번호를 안 싣는 것과 **같은 규칙**
   입니다 (제26조 · `note_request_open` 머리말).

   ⚠️ 담는 것은 `code` 와 `message` **둘뿐**입니다. `message` 에는
   제약 이름이 들어 있어서(`request_idem_once`) 부르는 쪽이 그걸로
   "동시에 들어온 요청" 을 갈라볼 수 있습니다 — 값은 `details` 쪽에만
   있으니 그것만 버리면 됩니다.
   ⚠️⚠️ 꼴을 모르는 본문(HTML 에러 페이지 등)은 **숫자를 지웁니다** —
   전화번호 · 사업자번호 · 금액이 섞여 들어오는 자리입니다. */
function scrubDbErr(text){
  const raw = String(text == null ? "" : text);
  try{
    const j = JSON.parse(raw);
    if(j && typeof j === "object" && !Array.isArray(j)){
      /* ⚠️⚠️ **꼴을 그대로 둡니다** (JSON). 부르는 쪽이 이 글에서
         `"message":"…"` 를 뽑아 손님에게 그대로 보여 주는 자리가
         있습니다 (`api/upload.js` — DB 가 사람 말로 거절한 것을
         운영자 글로 덮지 않으려고요). 꼴을 바꾸면 그 말이 조용히
         "지금 올리지 못했습니다" 로 뭉개집니다.
         ⚠️ 버리는 것은 `details` · `hint` 입니다 — 값이 거기 있습니다. */
      const keep = {};
      if(j.code)    keep.code = String(j.code).slice(0, 40);
      if(j.message) keep.message = String(j.message).slice(0, 200);
      return Object.keys(keep).length
        ? JSON.stringify(keep) : "(까닭을 알 수 없습니다)";
    }
  }catch(e){}
  return raw.replace(/[0-9]/g, "\u00b7").slice(0, 200);
}

async function call(method, pathAndQuery, body, prefer){
  if(!dbReady()) return { ok:false, why:"nowhere" };
  const key = String(process.env.SUPABASE_SERVICE_KEY).trim();

  const ctl = new AbortController();
  const timer = setTimeout(function(){ ctl.abort(); }, DB_TIMEOUT);
  try{
    const r = await fetch(base() + "/rest/v1" + pathAndQuery, {
      method: method,
      signal: ctl.signal,
      headers: Object.assign({
        "apikey": key,
        "authorization": "Bearer " + key,
        "content-type": "application/json"
      }, prefer ? { "prefer": prefer } : {}),
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const text = await r.text().catch(function(){ return ""; });
    if(!r.ok){
      /* ⚠️⚠️ 돌려주는 글에 **키도 개인정보도 넣지 마세요.** 에러 본문에
         요청이 그대로 들어오는 경우가 있습니다 — `scrubDbErr()` 를
         보세요 (2026-10-25 §4 "개인정보를 Slack 오류 로그나 감사
         기록에 불필요하게 남기지 않는다"). */
      return { ok:false, status:r.status,
               why:"db " + r.status + " " + scrubDbErr(text) };
    }
    let data = null;
    if(text){ try{ data = JSON.parse(text); }catch(e){ data = null; } }
    return { ok:true, data:data };
  }catch(e){
    /* ⚠️ 끊긴 것과 거절당한 것을 갈라서 알려 줍니다 — 부르는 쪽이
       손님에게 다른 말을 해야 합니다 */
    const aborted = e && (e.name === "AbortError");
    return { ok:false, timeout:aborted,
             why:aborted ? "db timeout" : "db " + (e && e.message) };
  }finally{
    clearTimeout(timer);
  }
}

/* 한 줄 넣기. 넣은 줄을 돌려받습니다 */
async function dbInsert(table, row){
  const t = safeTable(table);
  if(!t) return { ok:false, why:"표 이름이 비었습니다" };
  const r = await call("POST", "/" + t, [row], "return=representation");
  if(!r.ok) return r;
  return { ok:true, row: Array.isArray(r.data) ? r.data[0] : r.data };
}

/* service key 로 함수를 부릅니다 (로그인 없이 들어온 접수용).
   ⚠️⚠️ **읽기 · 상태 바꾸기에는 쓰지 마세요.** 그쪽은 반드시 그 사람의
   토큰(`dbRpc`)으로 가야 RLS 를 거칩니다 — service key 는 RLS 를 통째로
   지나갑니다. 여기로 가도 되는 것은 **접수가 자기 신청에 항목을 적는
   것**뿐이고, 그건 로그인 전이라 누구의 토큰도 없습니다.
   ⚠️ 함수 이름은 **부르는 쪽의 허용 목록**이 첫째 자물쇠이고 `safeFn()`
   이 둘째입니다 — 둘이 다른 말로 거절해야 어느 쪽이 걸렸는지 압니다. */
async function dbCallService(fn, args){
  const f = safeFn(fn);
  if(!f) return { ok:false, why:"함수 이름이 비었습니다" };
  return await call("POST", "/rpc/" + f, args || {});
}

/* 찾아보기 — query 는 PostgREST 질의문자입니다 (예: "?tel=eq.0101234")
   ⚠️ 손님이 보낸 값을 그대로 이어 붙이지 마세요. 부르는 쪽에서
   encodeURIComponent 를 거칩니다. */
async function dbSelect(table, query){
  const t = safeTable(table);
  if(!t) return { ok:false, why:"표 이름이 비었습니다" };
  const r = await call("GET", "/" + t + (query || ""));
  if(!r.ok) return r;
  return { ok:true, rows: Array.isArray(r.data) ? r.data : [] };
}

/* 운영자에게 할 말 (절대 규칙 3 — 손님 화면에 찍지 않습니다) */
function dbWhy(reason){
  return reason === "nowhere"
    ? "DB 가 아직 설정되지 않았습니다. Vercel → Settings → Environment " +
      "Variables 에 SUPABASE_URL 과 SUPABASE_SERVICE_KEY 를 넣고 **다시 " +
      "배포하세요.** 세우는 차례는 db/README.md 에 있습니다."
    : "DB 가 응답하지 않거나 거절했습니다. (" + reason + ")";
}


/* ════════════════════════════════════════════════════════════════════
   그 사람의 토큰으로 읽고 부르기 (RLS 를 **거쳐서**)

   ⚠️⚠️ 위의 call() 은 service key 라 RLS 를 통째로 지나갑니다 — 저장만
   그렇게 합니다 (로그인하지 않은 접수를 넣는 자리). 손님 · 업체 ·
   관리자가 **보는 것**은 전부 아래를 거칩니다. 그러면 "누가 무엇을 볼
   수 있는가" 가 DB 한 곳(RLS)에만 있고, 화면과 서버에 두 번 적어
   어긋나는 일이 없습니다.
   ════════════════════════════════════════════════════════════════════ */

/* ⚠️ 함수 이름을 손님이 보낸 값에서 받지 마세요. safeTable 과 같은
   까닭이고, 글자를 씻는 것은 **둘째 자물쇠**입니다 — 첫째는 부르는
   쪽의 허용 목록입니다 (api/deal.js). 둘이 서로 다른 말로 거절해야
   어느 자물쇠가 걸렸는지 압니다. */
function safeFn(f){
  return String(f || "").toLowerCase().replace(/[^a-z_]/g, "").slice(0, 60);
}

function anonKey(){
  const k = process.env.SUPABASE_ANON_KEY;
  return (typeof k === "string" && k.trim()) ? k.trim() : "";
}

async function callAs(token, method, pathAndQuery, body, prefer){
  /* ⚠️ 여기는 service key 가 **필요하지 않습니다** — 주소와 공개 키만
     있으면 그 사람의 토큰으로 읽습니다. dbReady() 를 보면 안 됩니다. */
  if(!base() || !anonKey()) return { ok:false, why:"nowhere" };
  if(!token)                return { ok:false, why:"no token" };

  const ctl = new AbortController();
  const timer = setTimeout(function(){ ctl.abort(); }, DB_TIMEOUT);
  try{
    const r = await fetch(base() + "/rest/v1" + pathAndQuery, {
      method: method,
      signal: ctl.signal,
      /* ⚠️⚠️ apikey 는 **공개 키**이고 authorization 은 **그 사람의
         토큰**입니다. 여기에 service key 를 쓰면 RLS 가 통째로
         꺼집니다 — 바꿔 쓰지 마세요. */
      headers: Object.assign({
        "apikey": anonKey(),
        "authorization": "Bearer " + token,
        "content-type": "application/json"
      }, prefer ? { "prefer": prefer } : {}),
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const text = await r.text().catch(function(){ return ""; });
    if(!r.ok)
      return { ok:false, status:r.status,
               why:"db " + r.status + " " + text.slice(0, 300) };
    let data = null;
    if(text){ try{ data = JSON.parse(text); }catch(e){ data = null; } }
    return { ok:true, data:data };
  }catch(e){
    const aborted = e && (e.name === "AbortError");
    return { ok:false, timeout:aborted,
             why:aborted ? "db timeout" : "db " + (e && e.message) };
  }finally{
    clearTimeout(timer);
  }
}

/* 그 사람이 볼 수 있는 줄만 (RLS 가 가립니다) */
async function dbSelectAs(token, table, query){
  const t = safeTable(table);
  if(!t) return { ok:false, why:"표 이름이 비었습니다" };
  const r = await callAs(token, "GET", "/" + t + (query || ""));
  if(!r.ok) return r;
  return { ok:true, rows: Array.isArray(r.data) ? r.data : [] };
}

/* 상태를 바꾸는 문 (0003 · 0004 의 함수들).
   ⚠️⚠️ **그 사람의 토큰으로** 불러야 auth.uid() 가 채워지고, 그래야
   감사 기록에 **누가 바꿨는지**가 남습니다 — service key 로 부르면
   auth.uid() 가 비어서 함수가 스스로 거절합니다 (0003 · 0004). */
async function dbRpc(token, fn, args){
  const f = safeFn(fn);
  if(!f) return { ok:false, why:"함수 이름이 비었습니다" };
  const r = await callAs(token, "POST", "/rpc/" + f, args || {});
  if(!r.ok) return r;
  return { ok:true, data:r.data };
}

module.exports = { dbReady, dbInsert, dbSelect, dbWhy, safeTable, DB_TIMEOUT,
                   safeFn, dbSelectAs, dbRpc, callAs, dbCallService, scrubDbErr };
