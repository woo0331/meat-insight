/* /api/auth-kakao — 카카오 OpenID Connect 콜백 (이메일을 요청하지 않는 길 · api/_kakao.js 머리말).

   카카오가 ?code=…&state=… (또는 ?error=…) 로 돌려보냅니다. 여기서 —
     1. state 쿠키를 **먼저 지웁니다** (어떤 결과든 한 번만 — 다시 오면 쿠키가 없어 거절)
     2. 쿠키를 열어 만료 · state 를 맞춰 봅니다
     3. 코드를 카카오 토큰으로 바꿉니다 (client_secret 은 서버에만)
     4. id_token 의 nonce 를 맞춰 보고, Supabase id_token 로그인으로 세션을 받습니다
     5. 세션을 한 번만 읽히는 httpOnly 쿠키에 담고 **토큰 없는 주소**로 돌려보냅니다

   ⚠️⚠️ 토큰 · 코드 · 키를 console 에 찍지 않습니다. 실패는 까닭의 **종류**만 남깁니다.
   ⚠️ 실패하면 원래 화면에 ?error=… 만 붙여 돌려보냅니다 — 화면(js/auth.js amAuthTakeError)이
      "취소하셨습니다" · "로그인하지 못했습니다" 로 알리고 주소를 치웁니다. */
const K = require("./_kakao.js");
const { authReady } = require("./_auth.js");
const { accountsOpen, closed } = require("./_open.js");

const TIMEOUT = 8000;

async function post(url, headers, body){
  const ctl = new AbortController();
  const t = setTimeout(function(){ ctl.abort(); }, TIMEOUT);
  try{
    const r = await fetch(url, { method:"POST", headers:headers, body:body, signal:ctl.signal });
    const text = await r.text().catch(function(){ return ""; });
    let data = null; if(text){ try{ data = JSON.parse(text); }catch(e){} }
    return { ok:r.ok, status:r.status, data:data };
  }catch(e){ return { ok:false, status:0, data:null }; }
  finally{ clearTimeout(t); }
}

function go(res, to, cookies){
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Set-Cookie", cookies);
  res.setHeader("Location", to);
  res.status(303);
  return res.end ? res.end() : res.json({});
}

module.exports = async function handler(req, res){
  if(req.method !== "GET"){ res.setHeader("Allow", "GET"); return res.status(405).json({ error:"GET 만 받습니다" }); }
  if(!accountsOpen()) return closed(res);
  const drop = K.clearCookie(K.C_STATE, K.CB_PATH, true);     /* ⚠️ 어떤 결과든 state 는 한 번만 */
  const q = req.query || {};
  const box = K.open(K.cookies(req)[K.C_STATE]);
  const back = (box && box.o ? box.o : "") + (box && box.p ? box.p : "/my");
  function fail(code, why){
    console.warn("[auth-kakao] 로그인 실패 — " + why);         /* ⚠️ 종류만 · 값은 안 찍음 */
    /* 2026-11-28 — 어디서 끊겼는지를 **꼬리표 하나**로 화면에 (토큰 · 코드 · 키 없음).
       화면이 "(확인 코드: …)" 로 보여 주고 주소에서 치웁니다. */
    const tag = /설정/.test(why) ? "off" : /state/.test(why) ? "state" : /취소|거절/.test(why) ? "kakao"
      : /코드 꼴/.test(why) ? "code" : /토큰 교환/.test(why) ? ("token" + ((why.match(/KOE[0-9]{3}/) || [""])[0].toLowerCase()))
      : /nonce/.test(why) ? "nonce" : /Supabase/.test(why) ? "supabase" : "etc";
    const sep = back.indexOf("?") >= 0 ? "&" : "?";
    return go(res, back + sep + "error=" + encodeURIComponent(code) + "&kk_why=" + tag, [drop]);
  }
  if(!K.oidcReady() || !authReady()) return fail("server_error", "설정이 꺼져 있음");
  if(!box) return fail("server_error", "state 쿠키 없음 · 위조 · 재사용");
  if(!(box.x > Date.now())) return fail("server_error", "state 만료");
  if(!K.same(q.state, box.s)) return fail("server_error", "state 불일치");
  if(q.error) return fail(String(q.error) === "access_denied" ? "access_denied" : "server_error", "카카오 거절 · 취소");
  const code = String(q.code || "");
  if(!/^[A-Za-z0-9_-]{8,512}$/.test(code)) return fail("server_error", "코드 꼴이 아님");

  /* 3. 코드 → 카카오 토큰 */
  const k = K.kakaoKeys();
  const tk = await post(K.KAUTH + "/oauth/token",
    { "content-type":"application/x-www-form-urlencoded;charset=utf-8" },
    new URLSearchParams({ grant_type:"authorization_code", client_id:k.id, client_secret:k.secret,
      redirect_uri:box.r, code:code }).toString());
  if(!tk.ok || !tk.data || !tk.data.id_token){
    const errorCode = tk.data && tk.data.error_code;
    const detail = typeof errorCode === "string" && /^KOE[0-9]{3}$/.test(errorCode)
      ? ", " + errorCode : "";
    return fail("server_error", "카카오 토큰 교환 실패(" + tk.status + detail + ")");
  }

  /* 4. nonce 를 먼저 맞춰 봅니다 (서명 확인은 Supabase 가 합니다) */
  const pl = K.jwtPayload(tk.data.id_token);
  if(!pl || !K.same(pl.nonce, K.sha256hex(box.n))) return fail("server_error", "nonce 불일치");

  const base = K.env("SUPABASE_URL").replace(/\/+$/, "");
  const sb = await post(base + "/auth/v1/token?grant_type=id_token",
    { "content-type":"application/json", apikey:K.env("SUPABASE_ANON_KEY") },
    JSON.stringify({ provider:"kakao", id_token:tk.data.id_token,
      access_token:tk.data.access_token || undefined, nonce:box.n }));
  if(!sb.ok || !sb.data || !sb.data.access_token){
    const errorCode = sb.data && (sb.data.error_code || sb.data.code || sb.data.error);
    const detail = typeof errorCode === "string" && /^[a-z][a-z0-9_]{1,63}$/.test(errorCode)
      ? ", " + errorCode : "";
    return fail("server_error", "Supabase id_token 로그인 실패(" + sb.status + detail + ")");
  }

  /* 5. 세션은 한 번만 읽히는 쿠키로 — 주소에는 아무것도 안 붙입니다 */
  const sess = K.seal({ a:sb.data.access_token, r:sb.data.refresh_token || "",
    e:sb.data.expires_in || 3600, x:Date.now() + K.TAKE_TTL });
  const age = Math.floor(K.TAKE_TTL / 1000);
  return go(res, back, [drop,
    K.setCookie(K.C_SESS, sess, { path:"/api/auth", age:age, http:true }),
    K.setCookie(K.C_FLAG, "1", { path:"/", age:age, http:false })]);
};
