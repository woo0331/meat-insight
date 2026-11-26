/* 카카오 로그인 — 이메일을 요청하지 않는 OpenID Connect 길 (2026-11-25 시험 브랜치).

   ⚠️⚠️ 왜 Supabase 의 /auth/v1/authorize?provider=kakao 를 안 쓰나 —
   Supabase Auth 의 카카오 공급자는 scope 에 "account_email profile_image
   profile_nickname" 을 **고정**으로 넣고, scopes 인자는 그 뒤에 **덧붙기만**
   합니다 (supabase/auth internal/api/provider/kakao.go). 그래서 이메일
   동의항목이 없는 앱은 KOE205 로 멈춥니다. 프런트에서 scopes 를 바꿔도
   account_email 은 빠지지 않습니다 (시험 DB 의 실제 요청으로 확인).

   이 길은 —
     ① 우리 서버가 카카오 인가 주소를 직접 만듭니다 — scope 는 openid · profile_nickname 뿐
     ② 콜백(/api/auth-kakao)에서 state · nonce · 만료를 보고, 코드를 카카오 토큰으로 바꿉니다
     ③ 받은 id_token 으로 Supabase 의 id_token 로그인(grant_type=id_token, provider=kakao)
     ④ 세션 토큰은 **한 번만 읽히는 httpOnly 쿠키**에 담아 토큰 없는 주소로 돌려보내고,
        화면이 /api/auth {op:"take"} 로 한 번 받아 갑니다

   ⚠️⚠️ 토큰(ID · 액세스 · 리프레시)은 **주소창 · 로그에 안 나옵니다.** 쿠키는
   AES-256-GCM 으로 잠그고 httpOnly 이며, 주소에는 state · code(카카오가 붙임)만 지납니다.
   ⚠️ 쿠키 열쇠는 AUTH_COOKIE_SECRET, 없으면 SUPABASE_SERVICE_KEY 에서 뽑습니다 (둘 다 없으면 꺼짐).
   ⚠️ 키 값은 어디에도 내보내지 않습니다. */
const crypto = require("crypto");

const SCOPE = "openid profile_nickname";      /* ⚠️ account_email 을 넣지 마세요 */
const KAUTH = "https://kauth.kakao.com";
const STATE_TTL = 10 * 60 * 1000;             /* 카카오 동의 화면까지 10분 */
const TAKE_TTL = 2 * 60 * 1000;               /* 돌아와서 화면이 받아 가기까지 2분 */
const CB_PATH = "/api/auth-kakao";
const C_STATE = "sw_kk";                       /* state · nonce · 돌아갈 자리 (Path=/api/auth-kakao) */
const C_SESS  = "sw_ks";                       /* 세션 토큰 (Path=/api/auth · 한 번만) */
const C_FLAG  = "sw_kt";                       /* 받아 갈 것이 있다는 표시만 (값 없음 · 화면이 읽음) */

function env(n){ const v = process.env[n]; return (typeof v === "string" && v.trim()) ? v.trim() : ""; }

function kakaoKeys(){ return { id: env("KAKAO_REST_KEY"), secret: env("KAKAO_CLIENT_SECRET") }; }
function cookieKey(){
  const s = env("AUTH_COOKIE_SECRET") || env("SUPABASE_SERVICE_KEY");
  return s ? crypto.createHash("sha256").update("storeway-kakao-oidc-v1|" + s).digest() : null;
}
/* 켜졌는가 — 운영자 표시(AUTH_KAKAO=1) + 카카오 키 둘 + 쿠키 열쇠. 하나라도 없으면 단추가 안 나옵니다. */
function oidcReady(){
  const k = kakaoKeys();
  return String(process.env.AUTH_KAKAO || "").trim() === "1" && !!(k.id && k.secret && cookieKey());
}

function b64u(buf){ return Buffer.from(buf).toString("base64").replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""); }
function unb64u(s){ s = String(s).replace(/-/g,"+").replace(/_/g,"/"); while(s.length % 4) s += "="; return Buffer.from(s, "base64"); }

function seal(obj){
  const key = cookieKey(); if(!key) return "";
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([c.update(JSON.stringify(obj), "utf8"), c.final()]);
  return b64u(Buffer.concat([iv, c.getAuthTag(), ct]));
}
function open(s){
  const key = cookieKey(); if(!key || !s) return null;
  try{
    const b = unb64u(s); if(b.length < 29) return null;
    const d = crypto.createDecipheriv("aes-256-gcm", key, b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    return JSON.parse(Buffer.concat([d.update(b.subarray(28)), d.final()]).toString("utf8"));
  }catch(e){ return null; }
}

function cookies(req){
  const out = {};
  String((req.headers && req.headers.cookie) || "").split(";").forEach(function(kv){
    const i = kv.indexOf("="); if(i < 0) return;
    out[kv.slice(0, i).trim()] = kv.slice(i + 1).trim();
  });
  return out;
}
function setCookie(name, val, opt){
  return name + "=" + val + "; Path=" + opt.path + "; Max-Age=" + opt.age +
    (opt.http ? "; HttpOnly" : "") + "; Secure; SameSite=Lax";
}
function clearCookie(name, path, http){ return setCookie(name, "", { path:path, age:0, http:http }); }

function same(a, b){
  const x = Buffer.from(String(a || "")), y = Buffer.from(String(b || ""));
  return x.length > 0 && x.length === y.length && crypto.timingSafeEqual(x, y);
}
function sha256hex(s){ return crypto.createHash("sha256").update(String(s)).digest("hex"); }
/* 서명은 Supabase 가 확인합니다. 여기서는 nonce 를 먼저 한 번 더 맞춰 볼 때만 열어 봅니다. */
function jwtPayload(t){
  try{ return JSON.parse(unb64u(String(t).split(".")[1]).toString("utf8")); }catch(e){ return null; }
}
function safePath(p){
  p = String(p || "/my");
  if(p.charAt(0) !== "/" || p.charAt(1) === "/" || p.indexOf("\\") >= 0) p = "/my";
  return p.split("#")[0].slice(0, 200);
}

/* ① 인가 주소 + state 쿠키 */
function startAuth(origin, path){
  const k = kakaoKeys();
  const state = b64u(crypto.randomBytes(24));
  const nonce = b64u(crypto.randomBytes(24));          /* 원문은 Supabase 에, 해시는 카카오에 */
  const redirect = origin + CB_PATH;
  const url = KAUTH + "/oauth/authorize?response_type=code" +
    "&client_id=" + encodeURIComponent(k.id) +
    "&redirect_uri=" + encodeURIComponent(redirect) +
    "&scope=" + encodeURIComponent(SCOPE) +
    "&state=" + encodeURIComponent(state) +
    "&nonce=" + encodeURIComponent(sha256hex(nonce));
  const box = seal({ s:state, n:nonce, r:redirect, o:origin, p:safePath(path), x:Date.now() + STATE_TTL });
  return { url:url, cookie: setCookie(C_STATE, box, { path:CB_PATH, age:Math.floor(STATE_TTL/1000), http:true }) };
}

module.exports = { SCOPE, KAUTH, CB_PATH, C_STATE, C_SESS, C_FLAG, STATE_TTL, TAKE_TTL,
  env, kakaoKeys, oidcReady, seal, open, cookies, setCookie, clearCookie, same, sha256hex,
  jwtPayload, safePath, startAuth };
