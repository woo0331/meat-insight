/* ════════════════════════════════════════════════════════════════════
   누가 보냈는가 (Supabase Auth)

   ⚠️ 밑줄로 시작합니다 — `/api/_auth` 로 열리면 안 됩니다.

   ── 환경변수 ──────────────────────────────────────────
   SUPABASE_URL        프로젝트 주소
   SUPABASE_ANON_KEY   화면이 로그인할 때 쓰는 공개 키 (새도 괜찮습니다)

   ⚠️⚠️ **역할을 요청에서 읽지 않습니다.** 화면이 보낸 `role` 은 손님이
   고쳐 보낼 수 있는 값이라, 그걸 믿으면 누구나 관리자가 됩니다. 역할은
   **토큰으로 DB 의 account 를 읽어서** 가져옵니다 — 그 읽기도 RLS 를
   거치기 때문에(account_self) 남의 역할은 애초에 안 보입니다.

   ⚠️⚠️ **SERVICE_KEY 를 쓰지 않습니다.** 그 키는 RLS 를 통째로
   지나가서, 여기서 쓰면 "이 사람이 볼 수 있는 것" 이 아니라 "전부" 가
   보입니다. 손님 · 업체 · 관리자 화면이 보는 자료는 **그 사람의
   토큰으로** 읽습니다 — 그러면 권한 규칙이 DB 한 곳에만 있습니다.
   (저장은 다릅니다. 로그인하지 않은 접수를 넣는 자리만 service key 를
   쓰고, 그건 `api/_db.js` 입니다.)

   ⚠️⚠️ **설정 전에는 열지 않습니다** (fail-closed). 로그인이 없는데
   "로그인하세요" 를 내면 §30-7(클릭해도 작동하지 않는 버튼)입니다 —
   화면은 `authReady` 가 꺼져 있으면 그 구간째 안 그립니다.
   ════════════════════════════════════════════════════════════════════ */

const AUTH_TIMEOUT = 8000;    /* `api/_db.js` 와 같은 8초 */

/* ⚠️ 공백만 있는 값은 **없는 것**으로 봅니다 (Vercel 에 빈 칸을
   저장하면 "넣었다" 고 착각하게 됩니다) */
function env(name){
  const v = process.env[name];
  return (typeof v === "string" && v.trim()) ? v.trim() : "";
}

/* 로그인이 설정되어 있는가 */
function authReady(){
  return !!(env("SUPABASE_URL") && env("SUPABASE_ANON_KEY"));
}

function base(){
  return env("SUPABASE_URL").replace(/\/+$/, "");
}

/* ⚠️ 헤더에서 토큰만 떼어 냅니다. 꼴이 아니면 **보내지도 않습니다** —
   남이 적어 보낸 쓰레기를 그대로 상위 서비스에 던지지 않습니다. */
function bearer(req){
  const h = (req && req.headers &&
    (req.headers.authorization || req.headers.Authorization)) || "";
  const m = String(h).match(/^Bearer\s+([A-Za-z0-9._~+/-]+=*)$/);
  if(!m) return "";
  const t = m[1];
  /* JWT 는 점 둘로 갈린 세 토막입니다 */
  return t.split(".").length === 3 ? t : "";
}

async function fetchWithTimeout(url, opt){
  const ctl = new AbortController();
  const timer = setTimeout(function(){ ctl.abort(); }, AUTH_TIMEOUT);
  try{
    const r = await fetch(url, Object.assign({}, opt, { signal: ctl.signal }));
    const text = await r.text().catch(function(){ return ""; });
    let data = null;
    if(text){ try{ data = JSON.parse(text); }catch(e){ data = null; } }
    return { status:r.status, ok:r.ok, data:data, text:text };
  }catch(e){
    const aborted = e && e.name === "AbortError";
    return { status:0, ok:false, data:null, text:"",
             timeout:aborted, err:(e && e.message) || "" };
  }finally{
    clearTimeout(timer);
  }
}

/* 이 토큰이 누구인가 — Supabase 에게 묻습니다.
   ⚠️ 비밀키로 직접 풀지 않습니다. JWT 서명 비밀을 저장소 근처에 두지
   않는 쪽이고, 로그아웃·정지된 계정도 Supabase 가 거절해 줍니다. */
async function whoami(token){
  if(!authReady()) return { ok:false, why:"nowhere" };
  if(!token)       return { ok:false, why:"no token" };

  const r = await fetchWithTimeout(base() + "/auth/v1/user", {
    method:"GET",
    headers:{ "apikey": env("SUPABASE_ANON_KEY"),
              "authorization": "Bearer " + token }
  });
  if(r.timeout) return { ok:false, timeout:true, why:"auth timeout" };
  /* ⚠️ 돌려주는 글에 토큰을 넣지 마세요. 길이도 자릅니다. */
  if(!r.ok || !r.data || !r.data.id)
    return { ok:false, status:r.status,
             why:"auth " + r.status + " " + String(r.text || "").slice(0, 200) };
  return { ok:true, sub:r.data.id, email:r.data.email || "" };
}

/* 역할 — ⚠️⚠️ **요청이 아니라 DB** 에서 읽습니다.
   읽는 것도 그 사람의 토큰이라 RLS(account_self)가 자기 줄만 내줍니다. */
async function roleOf(token, sub){
  const r = await fetchWithTimeout(
    base() + "/rest/v1/account?select=role,provider_id,name&id=eq." +
      encodeURIComponent(sub) + "&limit=1",
    { method:"GET",
      headers:{ "apikey": env("SUPABASE_ANON_KEY"),
                "authorization": "Bearer " + token } });
  if(!r.ok || !Array.isArray(r.data) || !r.data.length)
    /* 줄이 아직 없으면 **가장 낮은 역할**입니다. 없는 것을 관리자로
       읽으면 그 한 줄이 사고입니다 (fail-closed). */
    return { role:"customer", provider_id:null, name:"" };
  const a = r.data[0];
  return { role: a.role || "customer",
           provider_id: a.provider_id || null,
           name: a.name || "" };
}

/* 한 번에 — 화면이 보낸 요청에서 "누구이고 무슨 역할인가" 까지 */
async function session(req){
  if(!authReady()) return { ok:false, why:"nowhere" };
  const token = bearer(req);
  if(!token) return { ok:false, why:"no token" };
  const w = await whoami(token);
  if(!w.ok) return w;
  const a = await roleOf(token, w.sub);
  return { ok:true, token:token, sub:w.sub, email:w.email,
           role:a.role, provider_id:a.provider_id, name:a.name };
}

/* 운영자에게 할 말 (절대 규칙 3 — 손님 화면에 찍지 않습니다) */
function authWhy(reason){
  return reason === "nowhere"
    ? "로그인이 아직 설정되지 않았습니다. Vercel → Settings → Environment " +
      "Variables 에 SUPABASE_URL 과 SUPABASE_ANON_KEY 를 넣고 **다시 " +
      "배포하세요.** 세우는 차례는 db/README.md 에 있습니다."
    : "로그인을 확인하지 못했습니다. (" + reason + ")";
}

module.exports = { authReady, bearer, whoami, roleOf, session, authWhy,
                   AUTH_TIMEOUT };
