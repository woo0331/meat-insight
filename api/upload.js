/* ════════════════════════════════════════════════════════════════════
   /api/upload — 신청에 붙이는 사진 · 서류
                 2026-10-18 "매장 운영 전문관 2차" §7-3 · §15

     GET                   올릴 수 있는 상태인가 (설정 여부만)
     GET  ?p=<사진 id>     볼 수 있는 사람에게 **서명된 보기 주소**
     POST {no,tel,mime,bytes}  **서명된 올리기 주소** 하나

   ⚠️⚠️ **파일이 이 주소를 지나가지 않습니다.** 서명된 주소를 하나
   내주고, 화면이 **그 주소로 바로 올립니다** — 서버리스 함수에 몇
   메가짜리 본문을 통과시키면 시간 제한에 걸리고, 그 바이트가 로그에
   남을 수도 있습니다.

   ⚠️⚠️ **사진은 접수한 뒤에 올립니다** (0011 머리말). 접수 전에
   올리게 하면 **아무나 올리는 길**이 하나 생깁니다 — 올리시려면
   접수번호와 연락처가 맞아야 하고, 둘 다 맞아야만 자리를 내줍니다
   (`claim_photo_slot`). 그래서 악용에는 **실제 접수가 먼저** 필요하고,
   접수는 이미 중복 · 스팸 판정을 거칩니다 (`api/_intake.js`).

   ⚠️⚠️ **버킷이 설정되기 전에는 아무것도 하지 않습니다.**
   `INTAKE_BUCKET` 이 없으면 GET 이 `{ up:false }` 를 돌려주고 화면은
   그 칸을 **아예 안 그립니다** — 단추도 · 안내도 · "준비 중" 도
   없습니다 (§30-7 · 절대 규칙 2 · 로그인과 같은 방식).

   ⚠️⚠️ **버킷은 비공개라야 하고, 크기 상한과 허용 형식을 버킷에도
   걸어야 합니다.** 서명된 올리기 주소는 그 자체로 크기와 형식을 막지
   않습니다 — 여기서 받는 `bytes` · `mime` 은 **적어 보낸 값**이고,
   실제로 막는 것은 버킷 설정입니다 (db/README.md 에 적어 두었습니다).
   자물쇠가 셋입니다 — ① 여기 ② 0011 의 CHECK · 함수 ③ 버킷 설정.

   ⚠️ `SUPABASE_SERVICE_KEY` 는 **한 글자도 내려가지 않습니다.**
   내려가는 것은 그 경로 하나에만 쓰는 서명된 주소입니다.
   ════════════════════════════════════════════════════════════════════ */

const { authReady, bearer, session } = require("./_auth.js");
const { dbReady, dbCallService, dbSelectAs, dbWhy, DB_TIMEOUT } = require("./_db.js");

/* ⚠️ DB 의 `photo_mime_ok` 와 **같은 목록**이어야 합니다. 한쪽만
   고치면 화면이 받아 놓고 DB 가 거절합니다 (빌드가 맞춰 봅니다). */
const OK_MIME = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
/* ⚠️ DB 의 `photo_bytes_ok` 와 같은 값 */
const MAX_BYTES = 8388608;      /* 8MB */

function bucket(){
  /* ⚠️ 공백만 있는 값은 **없는 것**으로 봅니다 (Vercel 에 빈 칸을
     저장하면 "넣었다" 고 착각하게 됩니다 — `dbReady()` 와 같은 규칙).
     ⚠️⚠️ 버킷 이름이 **주소에 들어갑니다** — 손님이 보낸 값이 아니고
     환경변수지만, 그래도 쓸 수 있는 글자만 남깁니다. */
  return String(process.env.INTAKE_BUCKET || "").trim()
    .replace(/[^A-Za-z0-9_.-]/g, "").slice(0, 60);
}
function origin(){
  return String(process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
}
function upReady(){ return !!(dbReady() && bucket()); }

/* 서명된 주소를 Supabase Storage 에 청합니다.
   ⚠️ service key 로 부르고 **그 결과만** 내려보냅니다. */
async function signed(kind, p){
  const ctl = new AbortController();
  const timer = setTimeout(function(){ ctl.abort(); }, DB_TIMEOUT);
  try{
    /* upload → 올리기 · sign → 보기 */
    const url = origin() + "/storage/v1/object/" +
      (kind === "upload" ? "upload/sign/" : "sign/") + bucket() + "/" + p;
    const r = await fetch(url, {
      method:"POST",
      signal: ctl.signal,
      headers:{ "content-type":"application/json",
                "authorization":"Bearer " + String(process.env.SUPABASE_SERVICE_KEY).trim() },
      body: JSON.stringify(kind === "upload" ? {} : { expiresIn: 600 })
    });
    const text = await r.text().catch(function(){ return ""; });
    if(!r.ok) return { ok:false, status:r.status, why:"storage " + r.status + " " + text.slice(0,300) };
    let d = null; try{ d = JSON.parse(text); }catch(e){}
    /* Supabase 는 `/object/...` 꼴의 **상대 주소**를 돌려줍니다 */
    const rel = d && (d.url || d.signedURL || d.signedUrl);
    if(!rel) return { ok:false, why:"storage 가 주소를 안 돌려줬습니다" };
    return { ok:true, url: origin() + "/storage/v1" +
      (String(rel).charAt(0) === "/" ? "" : "/") + rel };
  }catch(e){
    const aborted = e && e.name === "AbortError";
    return { ok:false, timeout:aborted,
             why: aborted ? "storage timeout" : "storage " + (e && e.message) };
  }finally{ clearTimeout(timer); }
}

module.exports = async function handler(req, res){
  res.setHeader("cache-control", "no-store");

  /* ── 올릴 수 있는 상태인가 · 보기 주소 ──────────────────────────── */
  if(req.method === "GET"){
    const pid = String((req.query && req.query.p) || "").trim();
    if(!pid)
      /* ⚠️ 설정 여부만입니다 — 버킷 이름도 · 주소도 안 돌려줍니다
         (`api/admin-health.js` 가 "있는지" 만 알려 주는 방식). */
      return res.status(200).json({ up: upReady() });

    if(!upReady())      return res.status(200).json({ up:false });
    if(!authReady())    return res.status(200).json({ up:false });
    if(!/^[0-9a-fA-F-]{36}$/.test(pid))
      return res.status(400).json({ error:"사진을 찾을 수 없습니다" });
    if(!bearer(req))    return res.status(401).json({ error:"로그인이 필요합니다" });

    const s = await session(req);
    if(!s.ok){
      if(s.timeout) return res.status(504).json({ error:"시간이 초과되었습니다. 다시 눌러 주세요" });
      return res.status(401).json({ error:"로그인이 필요합니다" });
    }
    /* ⚠️⚠️ **볼 수 있는지는 RLS 가 정합니다.** 그 사람의 토큰으로
       읽고, 안 보이면 거기서 끝입니다 — 여기서 역할을 또 판단하면
       두 곳이 어긋나고, 어긋나면 화면이 안 내는 길로 서버가
       통과시킵니다. */
    const q = await dbSelectAs(s.token, "request_photo",
      "?select=" + encodeURIComponent("id,path,mime,bytes") +
      "&id=eq." + encodeURIComponent(pid) + "&limit=1");
    if(!q.ok){
      if(q.timeout) return res.status(504).json({ error:"시간이 초과되었습니다. 다시 눌러 주세요" });
      console.warn("[upload] " + dbWhy(q.why));
      return res.status(502).json({ error:"지금 불러오지 못했습니다" });
    }
    const row = q.rows[0];
    /* ⚠️ 안 보이는 것과 없는 것을 **갈라서 말하지 않습니다** — 갈라
       주면 id 를 넣어 가며 있는지 확인할 수 있습니다. */
    if(!row) return res.status(404).json({ error:"사진을 찾을 수 없습니다" });

    const sg = await signed("sign", row.path);
    if(!sg.ok){
      console.warn("[upload] " + sg.why);
      return res.status(502).json({ error:"지금 불러오지 못했습니다" });
    }
    return res.status(200).json({ ok:true, url:sg.url, mime:row.mime, bytes:row.bytes });
  }

  if(req.method !== "POST"){
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error:"GET 또는 POST 로 보내 주세요" });
  }

  /* ── 올릴 자리 하나 ─────────────────────────────────────────────── */
  if(!upReady()){
    /* 운영자에게만 까닭을 적습니다 (절대 규칙 3) */
    console.warn("[upload] INTAKE_BUCKET 또는 SUPABASE_* 가 없습니다");
    return res.status(503).json({ error:"지금은 사진을 올릴 수 없습니다" });
  }

  let b = req.body;
  if(typeof b === "string"){ try{ b = JSON.parse(b); }catch(e){ b = null; } }
  if(!b || typeof b !== "object")
    return res.status(400).json({ error:"내용을 읽을 수 없습니다" });

  const no   = String(b.no   || "").trim();
  const tel  = String(b.tel  || "").trim();
  const mime = String(b.mime || "").trim().toLowerCase();
  const bytes = Number(b.bytes);

  /* ⚠️ 못 쓸 값으로 DB 를 두드리지 않습니다 — 먼저 거릅니다
     (`api/me.js` 가 주소의 글자를 묻기 전에 거르는 것과 같은 까닭). */
  if(!no || !tel)
    return res.status(400).json({ error:"신청번호와 연락처를 확인해 주세요" });
  if(OK_MIME.indexOf(mime) < 0)
    return res.status(400).json({ error:"사진은 JPG · PNG · WEBP, 서류는 PDF 만 올리실 수 있습니다" });
  if(!(bytes > 0) || bytes > MAX_BYTES)
    return res.status(400).json({ error:"한 장에 8MB 까지 올리실 수 있습니다" });

  /* ⚠️⚠️ **service key 로 부릅니다.** 올리시는 분은 로그인하지 않은
     상태라 누구의 토큰도 없습니다 — 그래서 0011 의 함수가
     `authenticated` 에게 권한을 주지 않고, 번호 + 연락처를 스스로
     확인합니다 (`claim_request` 와 같은 규칙). */
  const r = await dbCallService("claim_photo_slot", {
    p_no:no, p_tel:tel, p_mime:mime, p_bytes:bytes });
  if(!r.ok){
    if(r.timeout) return res.status(504).json({ error:"시간이 초과되었습니다. 다시 눌러 주세요" });
    console.warn("[upload] claim — " + dbWhy(r.why));
    /* ⚠️⚠️ DB 가 거절한 **그 말**을 그대로 보여 줍니다 — 무엇을 하면
       되는지가 거기 적혀 있습니다 (`api/deal.js` 와 같은 규칙).
       ⚠️ 운영자 글(주소 · 상태코드)은 섞지 않습니다. */
    const m = String(r.why || "").match(/"message"\s*:\s*"([^"]{1,200})"/);
    return res.status(400).json({ error: m ? m[1] : "지금 올리지 못했습니다" });
  }
  const got = r.data && (Array.isArray(r.data) ? r.data[0] : r.data);
  const p = got && got.path;
  if(!p){
    console.warn("[upload] claim 이 경로를 안 돌려줬습니다");
    return res.status(502).json({ error:"지금 올리지 못했습니다" });
  }

  const sg = await signed("upload", p);
  if(!sg.ok){
    if(sg.timeout) return res.status(504).json({ error:"시간이 초과되었습니다. 다시 눌러 주세요" });
    console.warn("[upload] " + sg.why);
    /* ⚠️ 자리는 이미 적혔습니다. 줄만 남고 파일이 없으면 **안 열리는
       사진**이 보이니, 손님이 다시 누르면 새 자리를 하나 더 받습니다 —
       다섯까지라 쌓이지 않고, 운영자가 빈 줄을 뺄 수 있습니다. */
    return res.status(502).json({ error:"지금 올리지 못했습니다. 잠시 뒤 다시 눌러 주세요" });
  }
  /* ⚠️⚠️ 돌려주는 것은 **그 경로 하나에만 쓰는 서명된 주소**입니다 —
     service key 도 · 버킷 설정도 내려가지 않습니다. */
  return res.status(200).json({ ok:true, url:sg.url });
};
