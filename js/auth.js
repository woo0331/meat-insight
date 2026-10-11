/* ════════════════════════════════════════════════════════════════════
   로그인 (Supabase Auth · 매직링크)

   ⚠️⚠️ **로그인이 설정되기 전에는 화면에 아무것도 내지 않습니다.**
   `/api/session` 이 `auth:false` 면 단추도 · 안내도 · "준비 중" 도
   안 그립니다 (§30-7 "클릭해도 작동하지 않는 버튼" · 절대 규칙 2).
   CLAUDE.md 가 헤더에서 "로그인" 을 뺀 까닭 그대로입니다.

   ⚠️⚠️ **비밀번호를 받지 않습니다.** 매직링크(한 번 쓰는 주소)만
   씁니다 — 비밀번호를 받으면 그 순간 저장 · 재설정 · 유출 대비가
   전부 따라옵니다. 손님이 40~60대 사장님이라 "메일로 온 링크를
   누르면 끝" 이 제일 적게 막힙니다.

   ⚠️⚠️ **공개 키만 씁니다.** `/api/session` 이 내려주는 `conf` 에는
   주소와 `SUPABASE_ANON_KEY` 둘뿐입니다. 그 키는 새도 괜찮게 설계된
   것이고 무엇을 볼 수 있는지는 전부 RLS 가 정합니다 —
   **`SUPABASE_SERVICE_KEY` 는 화면에 내려오지 않습니다.**

   ⚠️ **토큰은 이 브라우저에만** 남습니다 (`am.auth.v1`). 성함 ·
   연락처는 안 담습니다 — 가게 컴퓨터는 여러 사람이 씁니다.
   나가기를 누르면 바로 지웁니다.

   ⚠️⚠️ **`nowPath()` 를 건드리지 않습니다.** 이 저장소는 주소가 진짜
   경로이고 `location.hash` 를 안 읽습니다. 매직링크가 돌아올 때만
   해시에 토큰이 실려 오는데, **딱 한 번 읽고 바로 지웁니다**
   (`history.replaceState`). 그 뒤로는 라우터가 보던 주소 그대로입니다.
   ════════════════════════════════════════════════════════════════════ */

var AM_AUTH_KEY = "am.auth.v1";

/* 설정 · 상태 — `/api/session` 에 **한 번만** 묻고 들고 있습니다 */
var AM_AUTH = { asked:false, on:false, signedIn:false, role:"", name:"",
                provider:null, conf:null };

/* ── 저장 ────────────────────────────────────────────────────────
   ⚠️ 사파리 비공개 모드 등에서 localStorage 가 **던집니다.** 감싸지
   않으면 화면이 통째로 안 그려집니다.
   ⚠️⚠️ **`amGet`/`amSet` 을 쓰지 않고 제 것을 들고 있습니다.** 그 셋은
   `js/components/ui.js` 에 있는데 **`admin.html` 은 ui.js 를 안
   읽습니다** — 거기서는 `typeof amSet === "function"` 이 거짓이 되어
   토큰이 **에러 없이 조용히 저장 안 되는** 꼴이 됩니다. 이 저장소가
   "있는 줄 알았는데 안 불리는 칸" 으로 여러 번 겪은 자리라, 여기는
   의존을 끊습니다. */
function amAuthSave(t){
  try{ localStorage.setItem(AM_AUTH_KEY, JSON.stringify(t)); }catch(e){}
}
function amAuthLoad(){
  var t = null;
  try{ var v = localStorage.getItem(AM_AUTH_KEY); t = v ? JSON.parse(v) : null; }
  catch(e){ return null; }
  if(!t || !t.access_token) return null;
  return t;
}
function amAuthClear(){
  try{ localStorage.removeItem(AM_AUTH_KEY); }catch(e){}
}

/* ── 매직링크가 돌아왔을 때 ───────────────────────────────────────
   ⚠️⚠️ **해시를 한 번만 읽고 바로 지웁니다.** 안 지우면 주소창에
   토큰이 남아 어깨너머로 보이고, 공유하면 그대로 넘어갑니다. */
function amAuthTakeHash(){
  var h = "";
  try{ h = String(window.location.hash || ""); }catch(e){ return false; }
  if(h.indexOf("access_token=") < 0) return false;
  var q = {}, i;
  h.replace(/^#/, "").split("&").forEach(function(kv){
    i = kv.indexOf("=");
    if(i > 0) q[decodeURIComponent(kv.slice(0,i))] = decodeURIComponent(kv.slice(i+1));
  });
  if(!q.access_token) return false;
  amAuthSave({
    access_token:  q.access_token,
    refresh_token: q.refresh_token || "",
    /* 서버가 준 유효기간을 시각으로 바꿔 둡니다 — 숫자로 들고 있으면
       새로고침할 때마다 다시 세야 합니다 */
    at: Date.now() + (parseInt(q.expires_in, 10) || 3600) * 1000
  });
  try{
    window.history.replaceState({}, "",
      window.location.pathname + window.location.search);
  }catch(e){}
  return true;
}

/* ── 지금 토큰 (만료되었으면 조용히 새로 받습니다) ──────────────── */
function amAuthToken(){
  var t = amAuthLoad();
  if(!t) return "";
  /* 60초 여유 — 딱 맞춰 두면 네트워크가 느릴 때 만료된 채로 나갑니다 */
  if(t.at && Date.now() > t.at - 60000) return "";
  return t.access_token;
}

/* 보낼 때 붙이는 머리 — 토큰이 없으면 **빈 객체**입니다.
   ⚠️ 빈 문자열로 `Authorization: Bearer ` 를 보내면 서버가 쓰레기를
   파싱하게 됩니다 (`bearer()` 가 거르긴 합니다). */
window.amAuthHeaders = function(){
  var tk = amAuthToken();
  return tk ? { authorization: "Bearer " + tk } : {};
};

/* ── 만료된 토큰 새로 받기 ──────────────────────────────────────── */
function amAuthRefresh(){
  var t = amAuthLoad(), c = AM_AUTH.conf;
  if(!t || !t.refresh_token || !c) return Promise.resolve(false);
  return fetch(c.url + "/auth/v1/token?grant_type=refresh_token", {
    method:"POST",
    headers:{ "content-type":"application/json", apikey:c.anonKey },
    body: JSON.stringify({ refresh_token: t.refresh_token })
  }).then(function(r){ return r.ok ? r.json() : null; })
    .then(function(d){
      if(!d || !d.access_token){ amAuthClear(); return false; }
      amAuthSave({ access_token:d.access_token,
                   refresh_token:d.refresh_token || t.refresh_token,
                   at: Date.now() + (d.expires_in || 3600) * 1000 });
      return true;
    })
    .catch(function(){ return false; });
}

/* ── 지금 누구인가 ───────────────────────────────────────────────
   `/api/session` 한 번. ⚠️ 역할은 **서버가 토큰으로 DB 에서** 읽은
   값입니다 — 화면이 고르는 것이 아닙니다 (`api/_auth.js` 머리말). */
window.amAuthAsk = function(force){
  if(AM_AUTH.asked && !force) return Promise.resolve(AM_AUTH);
  amAuthTakeHash();
  function ask(){
    return fetch("/api/session", { headers: Object.assign(
      { accept:"application/json" }, window.amAuthHeaders()) })
      .then(function(r){ return r.ok ? r.json() : null; });
  }
  return ask().then(function(d){
    /* 토큰이 만료되어 떨어졌으면 한 번만 새로 받아 다시 묻습니다 */
    if(d && d.auth && !d.signedIn && amAuthLoad()){
      AM_AUTH.conf = d.conf || null;
      return amAuthRefresh().then(function(ok){ return ok ? ask() : d; });
    }
    return d;
  }).then(function(d){
    AM_AUTH.asked = true;
    if(!d){ AM_AUTH.on = false; return AM_AUTH; }
    AM_AUTH.on       = !!d.auth;
    AM_AUTH.signedIn = !!d.signedIn;
    AM_AUTH.role     = d.role || "";
    AM_AUTH.name     = d.name || "";
    AM_AUTH.provider = d.provider || null;
    AM_AUTH.conf     = d.conf || AM_AUTH.conf;
    return AM_AUTH;
  }).catch(function(e){
    /* ⚠️ 운영자에게만 남깁니다 — 손님은 아무 잘못도 안 했습니다
       (절대 규칙 3). */
    try{ console.warn("[auth] /api/session — " + e); }catch(_){}
    AM_AUTH.asked = true; AM_AUTH.on = false;
    return AM_AUTH;
  });
};

window.amAuthNow = function(){ return AM_AUTH; };

/* ── 매직링크 보내기 ─────────────────────────────────────────────
   ⚠️⚠️ **"보냈습니다" 는 실제로 보낸 뒤에만** 말합니다 (절대 규칙 5).
   ⚠️ 메일이 있는지 없는지를 **갈라서 말하지 않습니다** — 갈라 주면
   어느 메일이 가입돼 있는지 확인해 가며 긁을 수 있습니다
   (`claim_request` 가 틀린 까닭을 안 가르는 것과 같은 규칙). */
window.amAuthSend = function(email){
  var c = AM_AUTH.conf;
  if(!c) return Promise.resolve({ ok:false, say:"지금은 로그인할 수 없습니다" });
  var to = String(email || "").trim();
  if(!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(to))
    return Promise.resolve({ ok:false, say:"메일 주소를 확인해 주세요" });
  return fetch(c.url + "/auth/v1/otp", {
    method:"POST",
    headers:{ "content-type":"application/json", apikey:c.anonKey },
    body: JSON.stringify({
      email: to,
      /* ⚠️ 돌아올 자리입니다. Supabase 쪽 **Redirect URLs** 에 이 주소가
         들어 있어야 합니다 — 안 넣으면 링크가 기본 주소로 갑니다. */
      options: { email_redirect_to: window.location.origin + window.location.pathname }
    })
  }).then(function(r){
    if(r.ok) return { ok:true, say:"메일로 로그인 링크를 보냈습니다. 받은 편지함을 확인해 주세요." };
    /* 너무 자주 누르면 Supabase 가 429 를 돌려줍니다 — 그건 알려
       드려야 손님이 계속 누르지 않습니다 */
    if(r.status === 429)
      return { ok:false, say:"조금 뒤에 다시 눌러 주세요." };
    return { ok:false, say:"지금 보내지 못했습니다. 잠시 뒤 다시 눌러 주세요." };
  }).catch(function(){
    return { ok:false, say:"연결이 끊겼습니다. 잠시 뒤 다시 눌러 주세요." };
  });
};

/* ── 나가기 ──────────────────────────────────────────────────────
   ⚠️ 서버에 알리는 것이 실패해도 **이 브라우저에서는 지웁니다** —
   지우지 않으면 "나갔다" 고 해 놓고 토큰이 남습니다 (절대 규칙 5). */
window.amAuthOut = function(){
  var c = AM_AUTH.conf, tk = amAuthToken();
  var done = function(){
    amAuthClear();
    AM_AUTH.signedIn = false; AM_AUTH.role = ""; AM_AUTH.name = "";
    AM_AUTH.provider = null;
  };
  if(!c || !tk){ done(); return Promise.resolve(); }
  return fetch(c.url + "/auth/v1/logout", {
    method:"POST",
    headers:{ apikey:c.anonKey, authorization:"Bearer " + tk }
  }).catch(function(){}).then(done);
};
