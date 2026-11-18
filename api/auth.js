/* /api/auth — 로그인 메일 · 토큰 갱신 · 나가기를 서버가 대신 전합니다 (W03).

   ⚠️⚠️ 왜 대신 전하나 — W00 조사에서 찾은 고장입니다. js/auth.js 가 브라우저에서
   SUPABASE_URL/auth/v1/... 로 **직접** 보내는데, vercel.json 의 CSP 가
   connect-src 'self' 라 운영에서 매직링크 · 갱신 · 나가기가 전부 거절됩니다.
   CSP 를 넓히지 않고 같은 출처의 이 주소를 지나게 합니다.

   ⚠️ 받는 일은 셋뿐입니다 (OPS). 그 밖의 경로로 넘기지 않습니다 — 아무 경로나
   넘겨 주면 이 주소가 공개 키로 Supabase 를 두드리는 열린 중계기가 됩니다.
   ⚠️ 우리 화면에서 온 요청만 받습니다 (fromOurPages).
   ⚠️ 돌아올 자리(redirect)는 **요청이 들어온 출처 + 경로**로만 만듭니다 —
   바깥 주소를 받으면 남의 사이트로 로그인 링크를 보내는 길이 열립니다.
   ⚠️ 메일 · 토큰을 로그에 남기지 않습니다. 응답에는 토큰 셋만 실립니다(갱신일 때).
   ⚠️ STOREWAY_ACCOUNTS_OPEN 이 꺼져 있으면 점검본입니다 (api/_open.js). */
const { authReady } = require("./_auth.js");
const { fromOurPages } = require("./_send.js");
const { accountsOpen, closed } = require("./_open.js");

const OPS = { otp:1, refresh:1, logout:1 };
const TIMEOUT = 8000;

function env(n){ const v = process.env[n]; return (typeof v === "string" && v.trim()) ? v.trim() : ""; }
function base(){ return env("SUPABASE_URL").replace(/\/+$/, ""); }

async function call(path, init){
  const ctl = new AbortController();
  const t = setTimeout(function(){ ctl.abort(); }, TIMEOUT);
  try{
    const r = await fetch(base() + path, Object.assign({}, init, { signal: ctl.signal }));
    const text = await r.text().catch(function(){ return ""; });
    let data = null; if(text){ try{ data = JSON.parse(text); }catch(e){} }
    return { status:r.status, ok:r.ok, data:data };
  }catch(e){ return { status:0, ok:false, data:null }; }
  finally{ clearTimeout(t); }
}

function redirectFor(req, path){
  const origin = req.headers.origin || "";
  let p = String(path || "/");
  if(p.charAt(0) !== "/" || p.charAt(1) === "/" || p.indexOf("\\") >= 0) p = "/my";
  return origin + p.split("#")[0].slice(0, 200);
}

module.exports = async function handler(req, res){
  res.setHeader("Cache-Control", "no-store");
  if(req.method !== "POST"){ res.setHeader("Allow", "POST"); return res.status(405).json({ error:"POST 로 보내 주세요" }); }
  if(!accountsOpen()) return closed(res);
  if(!fromOurPages(req)) return res.status(403).json({ error:"이 화면에서만 쓸 수 있습니다" });
  if(!authReady()) return res.status(503).json({ error:"지금은 로그인할 수 없습니다" });
  const b = (req.body && typeof req.body === "object") ? req.body : {};
  const op = String(b.op || "");
  if(!OPS[op]) return res.status(400).json({ error:"허용되지 않은 요청입니다" });
  const key = env("SUPABASE_ANON_KEY");

  if(op === "otp"){
    const to = String(b.email || "").trim();
    if(!/^[^@\s]{1,64}@[^@\s.]+(\.[^@\s]+)+$/.test(to) || to.length > 200)
      return res.status(400).json({ error:"메일 주소를 확인해 주세요" });
    const r = await call("/auth/v1/otp", { method:"POST",
      headers:{ "content-type":"application/json", apikey:key },
      body: JSON.stringify({ email:to, options:{ email_redirect_to: redirectFor(req, b.path) } }) });
    /* ⚠️ 메일이 있는지 없는지를 갈라서 말하지 않습니다 */
    if(r.ok) return res.status(200).json({ ok:true });
    if(r.status === 429) return res.status(429).json({ error:"조금 뒤에 다시 눌러 주세요." });
    return res.status(502).json({ error:"지금 보내지 못했습니다. 잠시 뒤 다시 눌러 주세요." });
  }

  if(op === "refresh"){
    const rt = String(b.refresh_token || "");
    if(!/^[A-Za-z0-9._~+/=-]{8,600}$/.test(rt)) return res.status(400).json({ error:"다시 로그인해 주세요" });
    const r = await call("/auth/v1/token?grant_type=refresh_token", { method:"POST",
      headers:{ "content-type":"application/json", apikey:key },
      body: JSON.stringify({ refresh_token: rt }) });
    if(!r.ok || !r.data || !r.data.access_token) return res.status(401).json({ error:"다시 로그인해 주세요" });
    /* 화면이 쓰는 셋만 돌려줍니다 (user 객체 등은 싣지 않습니다) */
    return res.status(200).json({ access_token:r.data.access_token,
      refresh_token:r.data.refresh_token || "", expires_in:r.data.expires_in || 3600 });
  }

  /* logout */
  const h = String(req.headers.authorization || "");
  const m = h.match(/^Bearer\s+([A-Za-z0-9._~+/-]+=*)$/);
  if(m) await call("/auth/v1/logout", { method:"POST", headers:{ apikey:key, authorization:"Bearer " + m[1] } });
  return res.status(200).json({ ok:true });
};
