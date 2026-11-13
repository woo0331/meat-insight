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

/* 설정 · 상태 — `/api/session` 에 **한 번만** 묻고 들고 있습니다
   ⚠️⚠️ `flying` 은 **돌고 있는 물음**입니다. `asked` 만으로는 모자랍니다 —
   그 깃발은 답이 온 뒤(`.then`)에 켜지는데, 부르는 쪽이 셋(헤더
   `chrome.js` · 메모장 `state.js` · `/my`)이라 **같은 틱에 셋이 다
   그물을 빠져나갑니다.** 재 보니 화면마다 2번(`/my` 는 3번) 나가고
   있었습니다 — 지금은 돌고 있는 것을 그대로 돌려줍니다. */
/* ⚠️⚠️ role 과 hats 는 **다른 것**입니다. role 은 권한(customer ·
   provider · staff · admin), hats 는 능력(seller · pro · biz) 입니다.
   화면이 둘을 한 칸에 담으면 "프로로 등록" 이 권한을 올리는 길처럼
   보이게 됩니다 (db/migrations/0025_account_hat.sql 머리말). */
var AM_AUTH = { asked:false, on:false, signedIn:false, role:"", name:"",
                hats:[], provider:null, conf:null };
var AM_AUTH_FLY = null;

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
  /* WARN 꼴이 아니면 **없는 것으로** 봅니다. 토큰은 JWT 라
     `A-Za-z0-9._-` 뿐인데, 저장된 값이 망가져 한글 · 공백 같은 것이
     섞이면 `Authorization` 머리를 만드는 자리에서 **fetch 가
     던집니다** — HTTP 머리는 ASCII 만 담습니다. 그러면 `/my` 의
     `.my-db` 와 `/admin` 의 `#rq` 가 **구간째 안 그려지고** 에러도
     화면에 안 납니다 (실제로 눌러 보고 알았습니다 — `#rq` 가 통째로
     빈 칸이었습니다). 없는 것으로 보면 로그인 칸이 다시 서서 손님이
     빠져나올 수 있습니다.
     ⚠️ `realm` 에 한글을 넣으면 응답이 터지는 것과 같은 자리입니다
     (앞 서비스의 `middleware.js` — 지금은 없습니다). */
  var tk = String(t.access_token);
  if(!/^[A-Za-z0-9._-]+$/.test(tk)) return "";
  return tk;
}

/* ── 내 계정 uuid (화면에 보여 주기만) ─────────────────────────────
   ⚠️⚠️ **권한을 가르는 데 쓰지 마세요.** 누구인지와 무슨 역할인지는
   언제나 **서버가 토큰을 Supabase 에 물어서** 알아냅니다
   (`api/_auth.js` — 요청이 보낸 값을 안 믿습니다). 이 함수는 첫
   관리자 SQL 한 줄에 **사장님 자신의 id** 를 그대로 적어 드리기
   위한 것이고, 그러지 않으면 Supabase → Authentication → Users 에서
   찾아 손으로 옮겨 적어야 합니다 (옮겨 적다 틀리면 그 SQL 은 아무
   줄도 안 고치고 조용히 "0 rows" 입니다).

   ⚠️ 새로 보이는 것이 없습니다 — 이 브라우저가 **이미 들고 있는 제
   토큰** 안의 값이고, 남의 id 는 어디에도 없습니다.
   ⚠️ 꼴이 uuid 가 아니면 **빈 문자열**을 돌려줍니다 — 화면은 그때
   예전처럼 "<내 user id>" 를 적습니다 (틀린 값을 적어 드리는 것이
   제일 나쁩니다). */
window.amAuthUid = function(){
  try{
    var tk = amAuthToken();
    if(!tk) return "";
    var part = String(tk).split(".")[1];
    if(!part) return "";
    /* base64url → base64 (= 를 채워야 atob 가 받습니다) */
    var b = part.replace(/-/g, "+").replace(/_/g, "/");
    while(b.length % 4) b += "=";
    var o = JSON.parse(decodeURIComponent(escape(atob(b))));
    var id = o && o.sub ? String(o.sub) : "";
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      .test(id) ? id : "";
  }catch(e){ return ""; }
};

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
/* ════════════════════════════════════════════════════════════════════
   로그인한 뒤 **원래 보시던 자리로** 돌아갑니다

   ⚠️⚠️⚠️ 전에는 돌아올 자리를 아무 데도 안 적었습니다. `/my` 에서
   "로그인하기" 를 누르면 `/login` 으로 갔다가, 메일 링크를 눌러도
   **`/login` 에 그대로** 남았습니다 — 손님이 내 정보를 다시 찾아
   들어가야 했습니다. 화면도 · 문도 · 검사도 전부 멀쩡했습니다.

   ⚠️⚠️⚠️ **`next` 를 그대로 믿으면 안 됩니다** (열린 전달 · open
   redirect). 남이 `?next=https://가짜.example` 을 적은 링크를 뿌리면
   우리 주소로 들어와서 남의 사이트로 튕겨 나갑니다 — 피싱의 고전적인
   길입니다. 그래서 **우리 사이트 안의 길만** 받습니다:
     · `/` 로 시작할 것
     · 둘째 글자가 `/` 나 역슬래시가 **아닐 것** (`//남의집` 은 프로토콜
       상대 주소라 브라우저가 **남의 사이트로 읽습니다**)
     · 허락한 글자만 있을 것 (`:` 이 못 들어오므로 scheme 을 못 만듭니다)
   맞지 않으면 **조용히 버리고** 홈으로 둡니다.
   ⚠️ `tools/test-desk.js` 가 실제로 나쁜 값을 넣어 봅니다.
   ════════════════════════════════════════════════════════════════════ */
window.amSafeNext = function(v){
  var t = String(v == null ? "" : v);
  if(!t || t.charAt(0) !== "/") return "";
  if(t.charAt(1) === "/" || t.charAt(1) === "\\") return "";
  /* 허락한 글자만 — `:` 도 `@` 도 없으므로 다른 사이트를 못 가리킵니다 */
  if(!/^\/[A-Za-z0-9\-._~\/]*(\?[A-Za-z0-9\-._~\/=&%+]*)?(#[A-Za-z0-9\-._~]*)?$/.test(t))
    return "";
  return t;
};

/* 주소의 `?next=` 를 꺼냅니다 — 못 믿을 값이면 빈 문자열입니다 */
window.amNextPath = function(){
  try{
    return window.amSafeNext(
      new URLSearchParams(window.location.search).get("next") || "");
  }catch(e){ return ""; }
};

/* 메일 링크가 **돌아올 자리** — next 가 있으면 거기, 없으면 지금 화면 */
window.amAfterLogin = function(){
  return window.amNextPath() || window.location.pathname;
};

/* "로그인하기" 가 가리킬 주소 — ⚠️ 한 함수에서만 짓습니다.
   다섯 곳에 손으로 적으면 한 곳만 고쳐서 조용히 어긋납니다. */
window.amLoginUrl = function(here){
  var p = window.amSafeNext(
    here || (window.location.pathname + window.location.search));
  /* ⚠️ /login 에서 /login 으로 돌아오게 두지 않습니다 (제자리걸음) */
  if(!p || p === "/login" || p.indexOf("/login?") === 0) return "/login";
  return "/login?next=" + encodeURIComponent(p);
};

window.amAuthAsk = function(force){
  if(AM_AUTH.asked && !force) return Promise.resolve(AM_AUTH);
  /* ⚠️ 이미 묻고 있으면 **그 물음을 그대로** 돌려줍니다 (요청 하나) */
  if(AM_AUTH_FLY && !force) return AM_AUTH_FLY;
  amAuthTakeHash();
  function ask(){
    return fetch("/api/session", { headers: Object.assign(
      { accept:"application/json" }, window.amAuthHeaders()) })
      .then(function(r){ return r.ok ? r.json() : null; });
  }
  AM_AUTH_FLY = ask().then(function(d){
    /* 토큰이 만료되어 떨어졌으면 한 번만 새로 받아 다시 묻습니다 */
    if(d && d.auth && !d.signedIn && amAuthLoad()){
      AM_AUTH.conf = d.conf || null;
      return amAuthRefresh().then(function(ok){ return ok ? ask() : d; });
    }
    return d;
  }).then(function(d){
    AM_AUTH.asked = true;
    if(!d){ AM_AUTH.on = false; AM_AUTH.hats = []; return AM_AUTH; }
    AM_AUTH.on       = !!d.auth;
    AM_AUTH.signedIn = !!d.signedIn;
    AM_AUTH.role     = d.role || "";
    AM_AUTH.hats     = Array.isArray(d.hats) ? d.hats : [];
    AM_AUTH.name     = d.name || "";
    AM_AUTH.provider = d.provider || null;
    AM_AUTH.conf     = d.conf || AM_AUTH.conf;
    return AM_AUTH;
  }).catch(function(e){
    /* ⚠️ 운영자에게만 남깁니다 — 손님은 아무 잘못도 안 했습니다
       (절대 규칙 3). */
    try{ console.warn("[auth] /api/session — " + e); }catch(_){}
    AM_AUTH.asked = true; AM_AUTH.on = false; AM_AUTH.hats = [];
    return AM_AUTH;
  });
  /* ⚠️ 답이 오면 놓습니다 — `force` 로 다시 물을 수 있어야 합니다
     (토큰을 새로 받은 뒤 역할을 다시 읽는 길). */
  return AM_AUTH_FLY.then(function(a){ AM_AUTH_FLY = null; return a; },
                          function(e){ AM_AUTH_FLY = null; throw e; });
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
      options: { email_redirect_to: window.location.origin + window.amAfterLogin() }
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

/* ── 어떤 소셜 로그인이 **실제로 켜져 있나** ──────────────────────
   ⚠️⚠️⚠️ **Supabase 에게 물어봅니다.** 화면에 목록을 박아 두면 아직
   안 켠 공급자의 단추가 그려지고, 누르면 Supabase 가 거절합니다 —
   눌러도 아무 일이 안 나는 단추입니다 (절대 규칙 5). 참값은
   `/auth/v1/settings` 의 `external` 이고, 그것은 **공개로 열려 있는
   자리**입니다(anon 키로 읽습니다 · 비밀이 아닙니다).
   ⚠️⚠️ 그래서 **켜시는 날 단추가 저절로 섭니다** — 다시 배포할
   것도, 코드를 고칠 것도 없습니다.
   ⚠️⚠️ **못 읽으면 빈 배열입니다** — 모르는 것을 "켜져 있다" 로
   읽지 않습니다(그때는 메일 링크만 그립니다). 0건과 못 읽은 것을
   가르지 않는 까닭은, 둘 다 **그릴 수 없다**는 같은 뜻이기
   때문입니다.
   ⚠️ 차례는 `js/data/social.js` 한 곳이 정합니다 — Supabase 가 주는
   차례로 그리면 단추 자리가 날마다 바뀝니다.
   ⚠️ 한 화면에서 **한 번만** 묻습니다(`AM_SSO_FLY`) — `amAuthAsk` 가
   같은 틱에 셋이 그물을 빠져나간 그 자리와 같은 꼴입니다. */
var AM_SSO_FLY = null;
window.amAuthProviders = function(){
  if(AM_SSO_FLY) return AM_SSO_FLY;
  var c = AM_AUTH.conf;
  var keys = (window.AM_SOCIAL || []).map(function(s){ return s.key; });
  if(!c || !keys.length) return Promise.resolve([]);
  AM_SSO_FLY = fetch(c.url + "/auth/v1/settings", { headers:{ apikey: c.anonKey } })
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(d){
      var ex = d && d.external ? d.external : null;
      if(!ex) return [];
      return keys.filter(function(k){ return ex[k] === true; });
    })
    .catch(function(){ return []; });
  return AM_SSO_FLY;
};

/* ── 소셜 로그인으로 보냅니다 ─────────────────────────────────────
   ⚠️⚠️ **fetch 가 아니라 주소를 바꿉니다.** 그쪽 회사 화면에서
   로그인하고 돌아오는 길이라 화면이 통째로 넘어가야 합니다.
   ⚠️⚠️⚠️ **양식(form)으로 보내면 막힙니다** — `vercel.json` 의 CSP 가
   `form-action 'self'` 입니다. 맨 위 이동(`location.href`)은 그것도
   `connect-src` 도 아닌 다른 자물쇠라 지나갑니다.
   ⚠️⚠️ 돌아오는 자리는 매직링크와 **같은 함수**(`amAfterLogin()`)
   입니다 — 두 곳에 적으면 한쪽만 고치는 날 소셜로 들어오신 분만
   홈으로 떨어집니다. 그 주소가 Supabase 의 **Redirect URLs** 에
   들어 있어야 합니다(안 넣으면 기본 주소로 갑니다).
   ⚠️⚠️ 돌아올 때 토큰은 주소의 **해시**에 실려 옵니다 — 받는 자리는
   `amAuthTakeHash()` 하나이고 **매직링크와 같은 길**입니다. 새로 만든
   되돌아오는 화면이 없습니다.
   ⚠️ 모르는 키는 **아무 데도 안 보냅니다**(거짓을 돌려줍니다) —
   주소를 지어 보내면 Supabase 가 그 글자를 그대로 받습니다. */
window.amAuthGo = function(key){
  var c = AM_AUTH.conf;
  if(!c) return false;
  /* ⚠️ 모르는 키는 아무 데도 안 보냅니다 — 우리가 아는 공급자인지
     `AM_SOCIAL` 에서 찾아보고, 없으면 그대로 돌아갑니다. */
  var row = null;
  (window.AM_SOCIAL || []).forEach(function(s){ if(s.key === key) row = s; });
  if(!row) return false;
  try{
    /* ⚠️⚠️⚠️ **`scopes` 를 안 싣습니다** (2026-11-11 저녁 · 증거를 받고 뒤집었습니다).
       아침에는 "안 실으면 Supabase 가 제 기본값을 붙이니 우리가 싣자" 로
       `scopes=profile_nickname` 을 실었습니다. 그런데 운영에서 카카오로
       나간 **최종 요청**을 받아 보니 —
         account_email  profile_image  profile_nickname  profile_nickname
       `profile_nickname` 이 **두 번**입니다. 즉 GoTrue 는 우리가 보낸
       값으로 기본값을 **덮는 것이 아니라 뒤에 더합니다.**
       ⚠️⚠️ 그래서 **화면 코드로는 `account_email` 을 뺄 수가 없습니다.**
       실어도 안 실어도 카카오에는 `account_email` 이 갑니다 — 실으면
       거기에 중복만 하나 더 붙습니다. 그 중복을 없애려고 뗐습니다.
       ⚠️ 고치는 길은 저장소 밖입니다(카카오 앱에서 그 동의항목을 켜거나,
       Supabase Custom Provider 로 카카오를 직접 넣어 scope 를 우리가
       정하거나, api/ 에 서버 측 OAuth 를 세우거나).
       ⚠️⚠️⚠️ **다시 실으시려면 먼저 더하는지 덮는지를 재세요** — 최종
       카카오 요청의 scope 를 눈으로 보는 것 말고는 아는 길이 없습니다. */
    window.location.href = c.url + "/auth/v1/authorize?provider=" +
      encodeURIComponent(key) +
      "&redirect_to=" +
      encodeURIComponent(window.location.origin + window.amAfterLogin());
    return true;
  }catch(e){ return false; }
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

/* ── 아직 열지 않았을 때 **그 자리에 적습니다** ───────────────────
   ⚠️⚠️⚠️ 2026-11-07 — 빌드가 찍어 둔 글이 "보이지 않으면 아직 올라온
   글이 없는 것입니다" 였습니다. 로그인 · 접수가 설정되기 전에는 목록을
   **불러오지도 못하므로**, 그 글이 손님 화면에 그대로 남아 "0건" 이라고
   말하고 있었습니다 — 실제로는 **열지 않은 것**입니다 (절대 규칙 5 ·
   "못 읽었으면 0건이라고 말하지 않습니다"). 다섯 화면이 그랬습니다
   (게시판 · 부킹 · 조인 · 중고 · 인력).
   ⚠️ 무엇이 닫혔는지는 **감싼 구간의 제목**이 이미 말합니다 (올라온
   매물 · 열려 있는 조인 · 커뮤니티 게시판 …) — 그래서 여기서 이름을
   받지 않습니다. 받으면 조사(은 · 는)가 받침에 따라 갈려 이름마다
   틀린 말이 나옵니다.
   ⚠️⚠️ **막다른 길로 두지 않습니다** (절대 규칙 2) — 고객센터로 가는
   길을 같이 냅니다.
   ⚠️ 무엇을 설정해야 하는지는 **console.warn 으로만** 말합니다 (절대
   규칙 3) — 부르는 자리가 이미 그렇게 적고 있습니다. */
window.amShut = function(id){
  var box = document.getElementById(id);
  if(!box) return;
  box.innerHTML =
    /* ⚠️⚠️ **"아직 열지 않았습니다" 를 쓰지 않습니다** — 그 말은 0056
       자리에서 **기능을 아직 안 만들었다**는 뜻으로 이미 쓰고 있고
       (`test-journey` 의 /cat/used 검사가 그 글자를 봅니다), 여기는
       **기능은 있는데 설정이 안 된** 다른 자물쇠입니다. 자물쇠마다
       다른 말로 거절합니다. 세째는 `draw()` 의 "지금 불러오지
       못했습니다"(불러오다 실패)입니다 — 셋이 다 다른 말입니다. */
    '<div class="none"><h3>아직 준비가 끝나지 않았습니다.</h3>' +
    '<p>준비가 끝나면 이 자리에서 바로 보실 수 있습니다. ' +
    '먼저 물어보실 것이 있으면 고객센터로 알려 주세요.</p>' +
    '<a class="btn btn-pt" href="/help">고객센터</a></div>';
};

/* ════════════════════════════════════════════════════════════════════
   목록을 읽는 자리 — 「정상 0건」과 「조회 실패」를 가릅니다 (2026-11-13)

   ⚠️⚠️⚠️ **화면 열두 곳이 `r.ok ? r.json() : []` 로 적고 있었습니다.**
   그러면 거절당한 것도 · 보기가 없는 것도 **빈 배열**이 되어, 화면이
   "아직 올라온 것이 없습니다" 를 찍습니다. 2026-11-13 에 운영
   `/cat/used` 가 실제로 그 꼴이었습니다 — 공개 보기가 운영에 없어서
   **한 줄도 못 읽었는데** 손님에게는 "아직 올라온 매물이 없습니다" 로
   보였습니다. **0 은 세어 본 값입니다**(절대 규칙 1) — 못 읽은 것을
   0 으로 적으면 그건 지어낸 숫자입니다.

   ⚠️⚠️ 그리고 **부분 적용된 DB** 를 버팁니다. 표는 있고 **새 칸이
   없으면** PostgREST 가 400 `42703` 을 내고 그 질의가 통째로 거절되어
   **목록이 사라집니다.** 그때만 그 칸을 빼고 **한 번** 다시 묻습니다.

   ⚠️⚠️⚠️ **숨기는 범위를 좁게 못 박습니다.** 다시 묻는 것은
   **① 400 이고 ② 거절한 말이 칸 이름을 말하고 ③ 그 이름이 부르는 쪽이
   미리 적어 둔 목록에 있을 때**뿐입니다. 공개 보기가 없는 것(404 ·
   `PGRST205`) · 권한(401 · 403 · `42501`) · 인증(JWT)은 **다시 묻지
   않고 그대로 실패로 올립니다** — 그것을 재질의로 덮으면 "설정이
   안 된 것" 이 "자료가 없는 것" 으로 보이고, 그게 바로 위에서 고친
   고장입니다.

   ⚠️ 손님 화면에는 **간단한 안내와 다시 시도**까지입니다 — 까닭 ·
   칸 이름 · 코드는 `console` 에만 적습니다(절대 규칙 3).
   ════════════════════════════════════════════════════════════════════ */

/* 거절한 말에서 **없는 칸 이름**을 꺼냅니다.
   ⚠️ PostgREST 가 두 가지로 말합니다 —
     42703   : column v_listing_open.flex does not exist
     PGRST204: Could not find the 'flex' column of 'listing' in the schema cache
   ⚠️ 표가 없다는 말(`Could not find the table ...`)은 **안 걸립니다** —
   그 꼴은 칸 이름을 말하지 않으므로 여기서 빈 글자가 되고, 그래서
   재질의로 넘어가지 않습니다. */
window.amMissCol = function(msg){
  var s = String(msg || "");
  var m = /column\s+(?:[A-Za-z0-9_]+\.)?"?([A-Za-z0-9_]+)"?\s+does not exist/i.exec(s);
  if(m) return m[1];
  m = /'([A-Za-z0-9_]+)'\s+column\s+of/i.exec(s);
  return m ? m[1] : "";
};

/* 응답 하나를 `{ rows, miss }` 로 바꿉니다. 거절이면 **던집니다** —
   ⚠️ 빈 배열로 바꾸면 그 순간 「조회 실패」가 「0건」이 됩니다. */
window.amRows = function(r){
  if(r.ok) return r.json().then(function(j){
    return { rows: Array.isArray(j) ? j : [], miss: [] }; });
  return r.text().then(function(t){
    var o = {}; try{ o = JSON.parse(t) || {}; }catch(_){}
    var e = new Error(o.message || ("HTTP " + r.status));
    e.amStatus = r.status;
    e.amCode = o.code || "";
    e.amCol = window.amMissCol(o.message || t);
    throw e;
  });
};

/* `select=` 와 거르개에서 그 칸들을 빼냅니다 — **실제로 뺀 이름**을
   돌려줍니다(0개면 다시 물어볼 까닭이 없습니다).
   ⚠️ `qs` 를 **제자리에서** 고칩니다(부르는 쪽이 같은 배열로 다시
   묻습니다). ⚠️ 차례(`order`)는 손대지 않습니다 — 지금 뺄 칸 가운데
   차례로 쓰는 것이 하나도 없고, 손대면 목록이 조용히 다른 차례로
   보입니다(정렬이 안 되는 것은 에러가 안 납니다). */
window.amDropCols = function(qs, cols){
  var gone = [];
  function mark(c){ if(cols.indexOf(c) >= 0 && gone.indexOf(c) < 0) gone.push(c); }
  for(var i = 0; i < qs.length; i++){
    var p = String(qs[i]), eq = p.indexOf("=");
    if(eq < 0) continue;
    var k = p.slice(0, eq);
    if(k === "select"){
      var keep = p.slice(eq + 1).split(",").filter(function(c){
        var n = c.trim();
        if(cols.indexOf(n) < 0) return true;
        mark(n); return false;
      });
      qs[i] = "select=" + keep.join(",");
    }else if(cols.indexOf(k) >= 0){
      mark(k); qs.splice(i, 1); i--;
    }
  }
  return gone;
};

/* 다시 묻는 자리 — ⚠️ **한 곳**입니다(화면마다 적으면 한쪽만 고치는
   날 어떤 화면은 버티고 어떤 화면은 통째로 사라집니다).
   `go(qs)` 는 그 배열로 fetch 를 돌려주는 함수이고, `opt` 는 부르는
   쪽이 **미리 적어 둔** 신규 선택 칸 목록입니다.
   ⚠️ 다시 묻는 것은 **한 번**뿐입니다 — 두 번째도 실패하면 그대로
   실패로 올립니다(끝없이 묻지 않습니다). */
window.amRowsSoft = function(qs, opt, go){
  return go(qs).then(window.amRows).catch(function(e){
    /* ⚠️⚠️ 좁게 가립니다 — 400 이 아니면(404 보기 부재 · 403 권한 ·
       401 인증) **덮지 않습니다.** */
    if(!e || e.amStatus !== 400) throw e;
    var c = e.amCol;
    if(!c || opt.indexOf(c) < 0) throw e;
    /* ⚠️ 한 마이그레이션이 같이 더한 칸들이라 **묶어서** 뺍니다 —
       거절한 말은 한 칸만 말하지만, 하나가 없으면 나머지도 없습니다. */
    var gone = window.amDropCols(qs, opt);
    if(!gone.length) throw e;
    try{ console.warn("[amRowsSoft] 운영 DB 에 아직 없는 칸을 빼고 다시 " +
      "물었습니다 — " + gone.join(", ") + " (" + (e.amCode || "400") + ")"); }catch(_){}
    return go(qs).then(window.amRows).then(function(x){
      x.miss = gone; return x; });
  });
};

/* 조회 실패를 손님에게 적는 글 — ⚠️ **한 곳**입니다.
   ⚠️⚠️ 까닭을 적지 않습니다(절대 규칙 3) — 보기가 없는지 · 권한인지 ·
   그물이 끊겼는지는 `console` 에만 남깁니다. 손님에게는 **0건이 아니라는
   것**과 **다시 시도**까지입니다.
   ⚠️ `what` 은 "매물" · "티타임" 처럼 **무엇을** 못 읽었는지입니다. */
window.amFailHtml = function(what){
  var w = String(what || "목록");
  /* ⚠️⚠️ 조사를 **글자로 박지 않습니다** — 받침에 따라 갈립니다
     ("프로을" 이 나갑니다). 붙이는 자리는 js/data/korean.js 한 곳이고,
     그 파일이 안 실린 화면에서는 「…를」 없이 적습니다. */
  var jo = window.josa ? window.josa(w, "을를") : "";
  return '<div class="none"><h3>지금 ' + window.esc(w) + window.esc(jo) +
    ' 불러오지 못했습니다</h3>' +
    '<p>잠시 뒤에 다시 시도해 주세요. <b>0건이라는 뜻이 아닙니다.</b></p>' +
    '<button class="btn btn-pt" type="button" data-amretry="1">다시 시도</button></div>';
};

/* 조회 실패를 개발 기록에만 적습니다 — ⚠️ 손님 화면에 한 글자도 안
   냅니다(절대 규칙 3). `where` 는 어느 화면 · 어느 보기인지입니다. */
window.amFailLog = function(where, e){
  try{
    console.warn("[" + String(where) + "] 조회 실패 — status=" +
      ((e && e.amStatus) || "?") + " code=" + ((e && e.amCode) || "") +
      " " + ((e && e.message) || ""));
  }catch(_){}
};

/* 주소가 **글자 하나**인 자리를 위한 짝 — `/my` 의 화면들이 `get(a, path)`
   꼴로 적혀 있어 배열이 아닙니다.
   ⚠️ `select=` 에서 그 칸만 덥니다 (거르개는 손대지 않습니다 — 이 자리의
   신규 칸은 전부 **고르는 칸이 아니라 보여 주는 칸**입니다). */
window.amDropSel = function(path, col){
  return String(path).replace(/([?&]select=)([^&]*)/, function(all, pre, sel){
    var keep = sel.split(",").filter(function(c){ return c.trim() !== col; });
    return pre + keep.join(",");
  });
};

/* 주소 하나로 한 번만 다시 묻습니다 — `{ rows, miss }` 를 돌려줍니다.
   ⚠️⚠️ 다시 묻는 조건은 `amRowsSoft` 와 **같습니다** — 400 이고 · 거절한
   말이 칸 이름을 말하고 · 그 이름이 `opt` 에 있을 때만입니다. 보기
   부재(404) · 권한(403) · 인증은 **그대로 던집니다.** */
window.amPathSoft = function(path, opt, go){
  return go(path).then(window.amRows).catch(function(e){
    if(!e || e.amStatus !== 400) throw e;
    var c = e.amCol;
    if(!c || !opt || opt.indexOf(c) < 0) throw e;
    var p2 = path, gone = [];
    opt.forEach(function(k){
      var n = window.amDropSel(p2, k);
      if(n !== p2){ p2 = n; gone.push(k); }
    });
    if(!gone.length) throw e;
    try{ console.warn("[amPathSoft] 운영 DB 에 아직 없는 칸을 빼고 다시 " +
      "물었습니다 — " + gone.join(", ") + " (" + (e.amCode || "400") + ")"); }catch(_){}
    return go(p2).then(window.amRows).then(function(x){ x.miss = gone; return x; });
  });
};
