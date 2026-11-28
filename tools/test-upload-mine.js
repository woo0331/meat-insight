/* 2026-11-28 — /api/upload 의 op:"mine" (내 기록에서 사진 다시 첨부) 서버 검사 · 가짜 바깥
   주인 확인 · 파일 없는 자리 재사용 · 이미 저장된 건 거절 · 연락처는 응답에 안 실림 · 파일 없음(missing) 갈라 말하기 */
const path = require("path"); const ROOT = path.resolve(__dirname, "..");
let pass = 0, bad = 0;
function ok(c, n, got){ if(c){ pass++; console.log("  ✅ " + n); } else { bad++; console.log("  ❌ " + n + (got !== undefined ? "  →  " + JSON.stringify(got).slice(0, 300) : "")); } }
const ME = "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa", RID = "rrrrrrrr-1111-4111-8111-rrrrrrrrrrrr", PID = "pppppppp-1111-4111-8111-pppppppppppp".replace(/[rp]/g, "b");
const PIDOK = "bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb";
function load(){
  Object.assign(process.env, { STOREWAY_ACCOUNTS_OPEN:"1", SUPABASE_URL:"https://db.invalid", SUPABASE_SERVICE_KEY:"svc-never", SUPABASE_ANON_KEY:"anon-x", INTAKE_BUCKET:"request-photos" });
  Object.keys(require.cache).forEach(k => { if(k.indexOf(path.join(ROOT, "api") + path.sep) === 0) delete require.cache[k]; });
  return require(path.join(ROOT, "api", "upload.js"));
}
function world(o){
  const w = { calls:[] };
  global.fetch = async function(url, init){
    const u = String(url), body = init && init.body ? JSON.parse(init.body) : null; w.calls.push({ u, body, h:(init && init.headers) || {} });
    const resp = (s, d) => ({ ok:s < 400, status:s, headers:{ get(){ return ""; } }, text: async () => d === undefined ? "" : JSON.stringify(d), json: async () => d });
    if(/\/auth\/v1\/user/.test(u)) return o.bad ? resp(401, {}) : resp(200, { id: ME });
    if(/\/rest\/v1\/account/.test(u)) return resp(200, [{ role:"customer" }]);
    if(/\/rest\/v1\/request\?select=id,no,user_id/.test(u)) return resp(200, o.notMine ? [{ id:RID, no:"SW-ZNF3-7W8E", user_id:"someone-else" }] : [{ id:RID, no:"SW-ZNF3-7W8E", user_id:ME }]);
    if(/\/rest\/v1\/request\?select=tel/.test(u)) return resp(200, [{ tel:"010-0000-2904" }]);
    if(/\/rest\/v1\/request_photo/.test(u)) return resp(200, [{ id:PIDOK, path:"req/x/old.jpg", mime:"image/jpeg", request_id: o.otherReq ? "zzz" : RID }]);
    if(/\/rest\/v1\/rpc\/claim_photo_slot/.test(u)) return resp(200, { path:"req/x/new.jpg", n:2 });
    if(/\/rest\/v1\/rpc\/drop_photo/.test(u)) return resp(204);
    if(/\/storage\/v1\/object\/sign\//.test(u)) return o.has ? resp(200, { signedURL:"/object/sign/x?token=t" }) : resp(400, { statusCode:"404", error:"not_found", message:"Object not found" });
    if(/\/storage\/v1\/object\/upload\/sign\//.test(u)) return resp(200, { url:"/object/upload/sign/" + u.split("/upload/sign/")[1] + "?token=t" });
    return resp(404, {});
  };
  return w;
}
const req = (b, auth, q) => ({ method: q ? "GET" : "POST", body:b, query: q || {}, headers: Object.assign({ origin:"https://storeway.co.kr", host:"storeway.co.kr" }, auth ? { authorization:"Bearer tok.a.b" } : {}) });
function res(){ const r = { code:0, body:null }; r.status = c => (r.code = c, r); r.json = b => (r.body = b, r); r.setHeader = () => {}; return r; }
const B = { op:"mine", no:"SW-ZNF3-7W8E", mime:"image/jpeg", bytes:1518333 };
(async function(){
  { const h = load(); world({}); const r = res(); await h(req(B, false), r); ok(r.code === 401, "로그인 없이는 거절", r); }
  { const h = load(); world({ bad:true }); const r = res(); await h(req(B, true), r); ok(r.code === 401 && r.body.relogin, "풀린 토큰은 401 relogin", r.body); }
  { const h = load(); const w = world({ notMine:true }); const r = res(); await h(req(B, true), r);
    ok(r.code === 404 && !w.calls.some(c => /claim_photo_slot/.test(c.u)), "⚠️⚠️ 남의 신청이면 404 · 자리를 안 줌", r.body); }
  { const h = load(); const w = world({}); const r = res(); await h(req(Object.assign({ photo:PIDOK }, B), true), r);
    ok(r.code === 200 && r.body.reuse === true && /old\.jpg/.test(r.body.url) && !w.calls.some(c => /claim_photo_slot/.test(c.u)), "파일 없는 자리는 같은 경로를 다시 씀 (새 기록 없음)", r.body); }
  { const h = load(); world({ has:true }); const r = res(); await h(req(Object.assign({ photo:PIDOK }, B), true), r);
    ok(r.code === 409 && r.body.saved, "이미 저장된 사진이면 409 (덮어쓰지 않음)", r.body); }
  { const h = load(); world({ otherReq:true }); const r = res(); await h(req(Object.assign({ photo:PIDOK }, B), true), r);
    ok(r.code === 404, "다른 신청의 사진 id 는 거절", r.body); }
  { const h = load(); const w = world({}); const r = res(); await h(req(Object.assign({ photo:PIDOK }, B, { mime:"image/png" }), true), r);
    ok(r.code === 200 && /new\.jpg/.test(r.body.url) && w.calls.some(c => /drop_photo/.test(c.u)), "형식이 다르면 빈 자리를 빼고 새 자리", r.body); }
  { const h = load(); const w = world({}); const r = res(); await h(req(B, true), r);
    const c = w.calls.filter(x => /claim_photo_slot/.test(x.u))[0];
    ok(r.code === 200 && c && c.body.p_tel === "010-0000-2904" && c.h.authorization === "Bearer svc-never", "새 자리 — 연락처는 서버 안에서 읽어 service key 로", c && c.body);
    ok(JSON.stringify(r.body).indexOf("010") < 0 && JSON.stringify(r.body).indexOf("svc-never") < 0, "응답에 연락처 · 키를 싣지 않음", r.body); }
  { const h = load(); world({}); const r = res(); await h(req(null, true, { p:PIDOK }), r);
    ok(r.code === 200 && r.body.missing === true && !r.body.url, "보기(GET) — 파일 없으면 missing 으로 갈라 말함", r.body); }
  console.log("\n" + (pass + bad) + "건 중 " + pass + "건 통과 · " + bad + "건 실패");
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log("❌ 멈춤 — " + e.stack); process.exit(1); });
