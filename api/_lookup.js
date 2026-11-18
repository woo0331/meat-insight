/* W03 — 비회원 본인 조회: 인증번호를 보내는 어댑터 · 해시.

   ⚠️⚠️ 외부 인증 공급사(문자 발송사)가 아직 정해지지 않았습니다. 그래서 어댑터는
   **테스트용 하나뿐**이고 운영(VERCEL_ENV=production)에서는 켜지지 않습니다.
     LOOKUP_OTP_ADAPTER = test   → Preview · 로컬에서만. 보낸 번호를 응답에 실어 줍니다(시험용)
     없거나 production           → 조회 꺼짐 (화면은 "아직 열리지 않았습니다" 까지)
   발송사가 정해지면 SEND 에 한 갈래를 더하고, 그날 개인정보처리방침의 수탁자도 같은 날 고칩니다
   (제26조 · 국외면 제28조의8).
   ⚠️ 인증번호 · 조회 토큰의 원문은 DB 에 안 갑니다 — HMAC/해시만 갑니다 (0083). */
const crypto = require("crypto");
const { dbReady } = require("./_db.js");

function env(n){ const v = process.env[n]; return (typeof v === "string" && v.trim()) ? v.trim() : ""; }

function adapter(){
  const a = env("LOOKUP_OTP_ADAPTER").toLowerCase();
  if(a === "test" && env("VERCEL_ENV") !== "production") return "test";
  return "";
}
function lookupReady(){ return !!(dbReady() && adapter()); }

/* 인증번호 해시 — 접수번호에 묶습니다 (같은 번호를 다른 신청에 못 씀).
   키는 서버에만 있는 값을 씁니다 — DB 를 통째로 가져가도 6자리를 되돌려 맞히기 어렵게. */
function key(){ return env("LOOKUP_HMAC_KEY") || env("SUPABASE_SERVICE_KEY") || "local-test-only"; }
function normNo(no){ return String(no || "").replace(/\s/g, "").toUpperCase(); }
function codeHash(no, code){
  return crypto.createHmac("sha256", key()).update(normNo(no) + "|" + String(code)).digest("hex");
}
function newCode(){ return String(crypto.randomInt(0, 1000000)).padStart(6, "0"); }
function newToken(){ return crypto.randomBytes(32).toString("base64url"); }
function tokenHash(t){ return crypto.createHash("sha256").update(String(t)).digest("hex"); }

/* 보내기 — ⚠️ 테스트 어댑터는 아무 데도 보내지 않습니다. 화면에 "시험용" 이라고 밝히고 번호를 돌려줍니다. */
async function send(dest, code){
  if(adapter() === "test") return { ok:true, testCode: code };
  return { ok:false };
}

module.exports = { adapter, lookupReady, codeHash, newCode, newToken, tokenHash, normNo, send };
