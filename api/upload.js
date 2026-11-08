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
const { dbReady, dbCallService, dbSelect, dbSelectAs, dbRpc, dbWhy,
        DB_TIMEOUT } = require("./_db.js");

/* ⚠️ DB 의 `photo_mime_ok` 와 **같은 목록**이어야 합니다. 한쪽만
   고치면 화면이 받아 놓고 DB 가 거절합니다 (빌드가 맞춰 봅니다). */
const OK_MIME = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
/* ⚠️ DB 의 `photo_bytes_ok` 와 같은 값 */
const MAX_BYTES = 8388608;      /* 8MB */

function clean(v){
  /* ⚠️ 공백만 있는 값은 **없는 것**으로 봅니다 (Vercel 에 빈 칸을
     저장하면 "넣었다" 고 착각하게 됩니다 — `dbReady()` 와 같은 규칙).
     ⚠️⚠️ 버킷 이름이 **주소에 들어갑니다** — 손님이 보낸 값이 아니고
     환경변수지만, 그래도 쓸 수 있는 글자만 남깁니다. */
  return String(v || "").trim().replace(/[^A-Za-z0-9_.-]/g, "").slice(0, 60);
}
function bucket(){ return clean(process.env.INTAKE_BUCKET); }

/* ⚠️⚠️⚠️ **업체 시설 사진은 다른 버킷입니다 — 공개 버킷입니다.**
   그 사진은 **정적 HTML 에 `<img>` 로 찍힙니다** (빌드가
   `pull-providers.js` 의 자료를 읽습니다) — 10분짜리 서명 주소를 거기
   넣을 수가 없습니다. 그래서 공개라야 합니다.
   ⚠️⚠️ **증빙서류는 절대 여기 두지 않습니다.** 서류는 비공개
   버킷(INTAKE_BUCKET)입니다 — 공개 버킷에 들어가면 그건 사업자등록증이
   인터넷에 올라간 것입니다. */
function pvBucket(){ return clean(process.env.PROVIDER_BUCKET); }

/* ⚠️⚠️⚠️ **버킷을 고르는 자리는 여기 하나이고, 고르는 기준은 DB 가
   돌려준 경로입니다.** 화면이 보낸 값으로 고르면 거기가 바로 구멍입니다
   — "서류인데 photo 라고 적어 보내기" 한 줄이면 사업자등록증이 공개
   버킷으로 갑니다. 0051 이 경로를 만들고(`pv/<id>/photo/…` ·
   `pv/<id>/doc/…`) 표의 check 가 그 꼴을 봅니다. */
/* ⚠️⚠️⚠️ **버킷을 고르는 것은 여기입니다 — 화면이 아닙니다.** 화면이
   고르게 두면 업체가 꾸러미를 고쳐 **증빙서류를 공개 버킷에** 올릴 수
   있습니다 (0051 머리말). 그래서 **문이 돌려준 경로**만 보고 고릅니다.
   ⚠️ 0064 — 광고 소재(`ad/<광고>/pc|mo/…`)도 **공개 버킷**입니다.
   배너는 손님 전부에게 그려지므로 서명 주소로는 캐시가 안 되고
   손님마다 서버를 한 번 더 두드립니다. */
function bucketForPath(p){
  const s2 = String(p || "");
  if(s2.indexOf("/photo/") > 0) return pvBucket();
  if(s2.indexOf("ad/") === 0 &&
     (s2.indexOf("/pc/") > 0 || s2.indexOf("/mo/") > 0)) return pvBucket();
  return bucket();
}
function origin(){
  return String(process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
}
function upReady(){ return !!(dbReady() && bucket()); }

/* 서명된 주소를 Supabase Storage 에 청합니다.
   ⚠️ service key 로 부르고 **그 결과만** 내려보냅니다. */
async function signed(kind, p, bk){
  const ctl = new AbortController();
  const timer = setTimeout(function(){ ctl.abort(); }, DB_TIMEOUT);
  try{
    /* upload → 올리기 · sign → 보기 */
    /* ⚠️ 버킷을 **받아서** 씁니다 — 부르는 자리가 경로로 고릅니다 */
    const bb = bk || bucket();
    if(!bb) return { ok:false, why:"버킷이 설정되지 않았습니다" };
    const url = origin() + "/storage/v1/object/" +
      (kind === "upload" ? "upload/sign/" : "sign/") + bb + "/" + p;
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
    const ppid = String((req.query && req.query.pp) || "").trim();
    /* 0059 — 게시판 글 하나의 사진 전부 (한 번에 묻습니다) */
    const cqq = String((req.query && req.query.cqq) || "").trim();
    /* 0068 — 매물 하나의 사진 전부 (한 번에 묻습니다) */
    const lstq = String((req.query && req.query.lstq) || "").trim();
    if(!pid && !ppid && !cqq && !lstq)
      /* ⚠️ 설정 여부만입니다 — 버킷 이름도 · 주소도 안 돌려줍니다
         (`api/admin-health.js` 가 "있는지" 만 알려 주는 방식).
         ⚠️⚠️ 업체 쪽은 **따로** 말합니다 — 공개 버킷이 없으면 시설
         사진만 안 되고 서류는 됩니다 (둘을 한 칸으로 묶으면 화면이
         둘 다 안 그리거나 둘 다 그립니다). */
      return res.status(200).json({ up: upReady(),
        pvPhoto: !!(dbReady() && pvBucket()), pvDoc: upReady(),
        /* ⚠️ 0059 — 게시판 글 사진. 값은 `pvPhoto` 와 같지만 **이름을
           따로** 둡니다 — 화면이 남의 기능 이름으로 제 칸을 가리면,
           버킷을 갈라 쓰는 날 엉뚱한 자리가 같이 꺼집니다. */
        cqPhoto: !!(dbReady() && pvBucket()),
        /* ⚠️ 0064 — 광고 소재. 값은 `pvPhoto` 와 같지만 **이름을
           따로** 둡니다 — 화면이 남의 기능 이름으로 제 칸을 가리면,
           버킷을 갈라 쓰는 날 엉뚱한 자리가 같이 꺼집니다. */
        adImg: !!(dbReady() && pvBucket()),
        /* ⚠️ 0068 — 매물 사진. 값은 `pvPhoto` 와 같지만 **이름을
           따로** 둡니다 — 화면이 남의 기능 이름으로 제 칸을 가리면,
           버킷을 갈라 쓰는 날 엉뚱한 자리가 같이 꺼집니다. */
        lstPhoto: !!(dbReady() && pvBucket()) });

    /* ── 게시판 글의 사진 주소 (0059) ────────────────────────────────
       ⚠️⚠️ **공개 보기로 읽습니다**(`v_cq_photo_public`) — 그 보기가
       `anon` 에게도 열려 있어 가입 안 하신 분도 글의 사진을 봅니다.
       `cqphoto` 표를 그 사람 토큰으로 읽으면 **제 글 사진만** 보입니다
       (0059 의 정책이 그렇습니다) — 남의 글을 열면 사진이 사라집니다.
       ⚠️⚠️ **공개 버킷이라 서명이 필요 없습니다** — 주소를 그대로 짓습니다
       (서명을 걸면 사진 다섯 장에 호출 다섯 번이 늘고, 10분 뒤에 깨집니다).
       ⚠️ 내려간 글의 사진은 보기가 걸러 냅니다. */
    if(cqq){
      if(!dbReady()) return res.status(200).json({ up:false });
      if(!/^[0-9a-fA-F-]{36}$/.test(cqq))
        return res.status(400).json({ error:"글을 찾을 수 없습니다" });
      const bkt = pvBucket();
      if(!bkt){
        console.warn("[upload] PROVIDER_BUCKET 이 없어 글 사진을 못 냅니다");
        return res.status(200).json({ ok:true, photos:[] });
      }
      const qp = await dbSelect("v_cq_photo_public",
        "?select=" + encodeURIComponent("id,path,caption") +
        "&q_id=eq." + encodeURIComponent(cqq) +
        "&order=created_at.asc&limit=5");
      if(!qp.ok){
        if(qp.timeout) return res.status(504).json({ error:"시간이 초과되었습니다. 다시 눌러 주세요" });
        console.warn("[upload] cq photos — " + dbWhy(qp.why));
        return res.status(502).json({ error:"지금 불러오지 못했습니다" });
      }
      return res.status(200).json({ ok:true, photos: qp.rows.map(function(f){
        return { id:f.id, caption:f.caption || "",
                 url: origin() + "/storage/v1/object/public/" + bkt + "/" + f.path };
      }) });
    }

    /* ── 매물에 붙은 사진 주소 (0068) ──────────────────────────────
       ⚠️⚠️ **공개 보기로 읽습니다**(`v_listing_photo_public`) — 그 보기가
       `anon` 에게도 열려 있어 가입 안 하신 분도 매물 사진을 봅니다.
       `listingphoto` 표를 그 사람 토큰으로 읽으면 **제 매물 사진만**
       보입니다(0068 의 정책이 그렇습니다) — 남의 매물을 열면 사진이
       사라집니다.
       ⚠️⚠️ **공개 버킷이라 서명이 필요 없습니다** — 주소를 그대로 짓습니다
       (서명을 걸면 사진 여덟 장에 호출 여덟 번이 늘고, 10분 뒤에 깨집니다).
       ⚠️ 내린 · 팔린 · 가려진 매물의 사진은 보기가 걸러 냅니다.
       ⚠️ 목록 카드의 **첫 장**은 이 길로 안 옵니다 — `v_listing_open` 이
       `thumb` 로 같이 내주므로 스무 장이면 호출이 스무 번 늘지 않습니다. */
    if(lstq){
      if(!dbReady()) return res.status(200).json({ up:false });
      if(!/^[0-9a-fA-F-]{36}$/.test(lstq))
        return res.status(400).json({ error:"매물을 찾을 수 없습니다" });
      const bkl = pvBucket();
      if(!bkl){
        console.warn("[upload] PROVIDER_BUCKET 이 없어 매물 사진을 못 냅니다");
        return res.status(200).json({ ok:true, photos:[] });
      }
      const ql = await dbSelect("v_listing_photo_public",
        "?select=" + encodeURIComponent("id,path,caption") +
        "&listing_id=eq." + encodeURIComponent(lstq) +
        "&order=created_at.asc&limit=8");
      if(!ql.ok){
        if(ql.timeout) return res.status(504).json({ error:"시간이 초과되었습니다. 다시 눌러 주세요" });
        console.warn("[upload] listing photos — " + dbWhy(ql.why));
        return res.status(502).json({ error:"지금 불러오지 못했습니다" });
      }
      return res.status(200).json({ ok:true, photos: ql.rows.map(function(f){
        return { id:f.id, caption:f.caption || "",
                 url: origin() + "/storage/v1/object/public/" + bkl + "/" + f.path };
      }) });
    }

    /* ── 업체가 올린 파일 하나 보기 ───────────────────────────────
       ⚠️⚠️ **볼 수 있는지는 RLS 가 정합니다** — 그 사람의 토큰으로
       읽고 안 보이면 거기서 끝입니다 (0051 은 그 업체와 운영자에게만
       줄을 보여 줍니다). 여기서 역할을 또 판단하면 두 곳이 어긋나고,
       어긋나면 화면이 안 내는 길로 서버가 통과시킵니다. */
    if(ppid){
      if(!dbReady() || !authReady()) return res.status(200).json({ up:false });
      if(!/^[0-9a-fA-F-]{36}$/.test(ppid))
        return res.status(400).json({ error:"파일을 찾을 수 없습니다" });
      if(!bearer(req)) return res.status(401).json({ error:"로그인이 필요합니다" });
      const s2 = await session(req);
      if(!s2.ok){
        if(s2.timeout) return res.status(504).json({ error:"시간이 초과되었습니다. 다시 눌러 주세요" });
        return res.status(401).json({ error:"로그인이 필요합니다" });
      }
      const q2 = await dbSelectAs(s2.token, "provider_photo",
        "?select=" + encodeURIComponent("id,path,mime,bytes,kind") +
        "&id=eq." + encodeURIComponent(ppid) + "&limit=1");
      if(!q2.ok){
        if(q2.timeout) return res.status(504).json({ error:"시간이 초과되었습니다. 다시 눌러 주세요" });
        console.warn("[upload] " + dbWhy(q2.why));
        return res.status(502).json({ error:"지금 불러오지 못했습니다" });
      }
      const row2 = q2.rows[0];
      /* ⚠️ 안 보이는 것과 없는 것을 **갈라서 말하지 않습니다** */
      if(!row2) return res.status(404).json({ error:"파일을 찾을 수 없습니다" });
      /* ⚠️⚠️ 버킷은 **경로로** 고릅니다 (화면이 보낸 값이 아닙니다) */
      const sg2 = await signed("sign", row2.path, bucketForPath(row2.path));
      if(!sg2.ok){
        console.warn("[upload] " + sg2.why);
        return res.status(502).json({ error:"지금 불러오지 못했습니다" });
      }
      return res.status(200).json({ ok:true, url:sg2.url,
        mime:row2.mime, bytes:row2.bytes });
    }

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

    const sg = await signed("sign", row.path, bucket());
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

  let b0 = req.body;
  if(typeof b0 === "string"){ try{ b0 = JSON.parse(b0); }catch(e){ b0 = null; } }

  /* ══════════════════════════════════════════════════════════════
     게시판 글에 붙이는 사진 (0059)

     ⚠️⚠️ **글쓴이가 직접 부릅니다** — 토큰으로 누구인지 알고, 제 글이
     아니면 DB 가 거절합니다(역할을 여기서 또 판단하면 두 곳이 어긋납니다).
     ⚠️⚠️ **버킷은 DB 가 돌려준 경로로 고릅니다** — 문이 경로를
     `cq/<글>/photo/…` 로 짓고, `bucketForPath()` 가 `/photo/` 를 보고
     공개 버킷을 고릅니다. 화면이 보낸 값으로 고르면 "글 사진인데 서류
     버킷" 같은 자리가 생깁니다.
     ⚠️ 게시판 사진은 **공개 글에 그려지므로 공개가 맞습니다** — 업체
     시설 사진과 같은 버킷을 씁니다(환경변수를 늘리지 않습니다).
     ══════════════════════════════════════════════════════════════ */
  if(b0 && b0.cq === true){
    if(!dbReady() || !authReady()){
      console.warn("[upload] SUPABASE_* 가 없습니다");
      return res.status(503).json({ error:"지금은 올릴 수 없습니다" });
    }
    if(!pvBucket()){
      console.warn("[upload] PROVIDER_BUCKET 이 없습니다 (글 사진)");
      return res.status(503).json({ error:"지금은 사진을 올릴 수 없습니다" });
    }
    if(!bearer(req)) return res.status(401).json({ error:"로그인이 필요합니다" });
    const sq = await session(req);
    if(!sq.ok){
      if(sq.timeout) return res.status(504).json({ error:"시간이 초과되었습니다. 다시 눌러 주세요" });
      return res.status(401).json({ error:"로그인이 필요합니다" });
    }
    const rq = await dbRpc(sq.token, "claim_cq_photo", { p: {
      question: String(b0.question || "").trim(),
      mime: String(b0.mime || "").trim().toLowerCase(),
      bytes: String(Number(b0.bytes) || 0), caption: String(b0.caption || "") } });
    if(!rq.ok){
      if(rq.timeout) return res.status(504).json({ error:"시간이 초과되었습니다. 다시 눌러 주세요" });
      console.warn("[upload] cq claim — " + dbWhy(rq.why));
      /* ⚠️ DB 가 거절한 **그 말**을 그대로 보여 줍니다 */
      const mq = String(rq.why || "").match(/"message"\s*:\s*"([^"]{1,200})"/);
      return res.status(400).json({ error: mq ? mq[1] : "지금 올리지 못했습니다" });
    }
    const gq = rq.data && (Array.isArray(rq.data) ? rq.data[0] : rq.data);
    const pq = gq && gq.path;
    if(!pq){
      console.warn("[upload] cq claim 이 경로를 안 돌려줬습니다");
      return res.status(502).json({ error:"지금 올리지 못했습니다" });
    }
    const sgq = await signed("upload", pq, bucketForPath(pq));
    if(!sgq.ok){
      if(sgq.timeout) return res.status(504).json({ error:"시간이 초과되었습니다. 다시 눌러 주세요" });
      console.warn("[upload] " + sgq.why);
      /* ⚠️ 자리는 이미 적혔습니다 — 글쓴이가 제 화면에서 뺄 수 있습니다 */
      return res.status(502).json({ error:"지금 올리지 못했습니다. 잠시 뒤 다시 눌러 주세요" });
    }
    return res.status(200).json({ ok:true, url:sgq.url, id:gq.id });
  }

  /* ══════════════════════════════════════════════════════════════
     0068 — 매물 사진 올릴 자리를 청합니다
     ⚠️⚠️ **0059(게시판 사진)와 같은 길**입니다 — 올린 분이 직접 부르고,
     제 매물이 아니면 DB 가 거절합니다(역할을 여기서 또 판단하면 두 곳이
     어긋납니다).
     ⚠️⚠️ **버킷은 DB 가 돌려준 경로로 고릅니다** — 문이 경로를
     `lst/<매물>/photo/…` 로 짓고 `bucketForPath()` 가 `/photo/` 를 보고
     공개 버킷을 고릅니다. 화면이 보낸 값으로 고르면 거기가 구멍입니다.
     ⚠️ 매물 사진은 **공개 목록에 그려지므로 공개가 맞습니다**.
     ══════════════════════════════════════════════════════════════ */
  if(b0 && b0.lst === true){
    if(!dbReady() || !authReady()){
      console.warn("[upload] SUPABASE_* 가 없습니다");
      return res.status(503).json({ error:"지금은 올릴 수 없습니다" });
    }
    if(!pvBucket()){
      console.warn("[upload] PROVIDER_BUCKET 이 없습니다 (매물 사진)");
      return res.status(503).json({ error:"지금은 사진을 올릴 수 없습니다" });
    }
    if(!bearer(req)) return res.status(401).json({ error:"로그인이 필요합니다" });
    const sl = await session(req);
    if(!sl.ok){
      if(sl.timeout) return res.status(504).json({ error:"시간이 초과되었습니다. 다시 눌러 주세요" });
      return res.status(401).json({ error:"로그인이 필요합니다" });
    }
    const rl = await dbRpc(sl.token, "claim_listing_photo", { p: {
      listing: String(b0.listing || "").trim(),
      mime: String(b0.mime || "").trim().toLowerCase(),
      bytes: String(Number(b0.bytes) || 0), caption: String(b0.caption || "") } });
    if(!rl.ok){
      if(rl.timeout) return res.status(504).json({ error:"시간이 초과되었습니다. 다시 눌러 주세요" });
      console.warn("[upload] listing claim — " + dbWhy(rl.why));
      /* ⚠️ DB 가 거절한 **그 말**을 그대로 보여 줍니다 */
      const ml = String(rl.why || "").match(/"message"\s*:\s*"([^"]{1,200})"/);
      return res.status(400).json({ error: ml ? ml[1] : "지금 올리지 못했습니다" });
    }
    const gl = rl.data && (Array.isArray(rl.data) ? rl.data[0] : rl.data);
    const pl = gl && gl.path;
    if(!pl){
      console.warn("[upload] listing claim 이 경로를 안 돌려줬습니다");
      return res.status(502).json({ error:"지금 올리지 못했습니다" });
    }
    const sgl = await signed("upload", pl, bucketForPath(pl));
    if(!sgl.ok){
      if(sgl.timeout) return res.status(504).json({ error:"시간이 초과되었습니다. 다시 눌러 주세요" });
      console.warn("[upload] " + sgl.why);
      /* ⚠️ 자리는 이미 적혔습니다 — 올린 분이 제 화면에서 뺄 수 있습니다 */
      return res.status(502).json({ error:"지금 올리지 못했습니다. 잠시 뒤 다시 눌러 주세요" });
    }
    return res.status(200).json({ ok:true, url:sgl.url, id:gl.id });
  }

  /* ══════════════════════════════════════════════════════════════
     관리자가 올리는 광고 소재 — PC · 모바일 (0064)

     ⚠️⚠️ **0051 과 같은 짜임새**입니다 — 로그인한 분의 토큰으로 문을
     부르고, 관리자가 아니면 **DB 가 거절**합니다. 역할을 여기서 또
     판단하면 두 곳이 어긋나고, 어긋나면 화면이 안 내는 길로 서버가
     통과시킵니다.
     ⚠️⚠️⚠️ **경로는 문이 짓습니다** (`ad/<광고>/pc|mo/…`) — 보낸 값으로
     짓게 두면 남의 광고 칸에 쓸 수 있습니다. 버킷도 **그 경로를 보고**
     고릅니다 (`bucketForPath()`).
     ⚠️ 광고 소재는 **공개 버킷**이라 `PROVIDER_BUCKET` 이 필요합니다.
     없으면 그 칸만 막습니다 (서류 · 손님 사진은 그대로 됩니다).
     ══════════════════════════════════════════════════════════════ */
  if(b0 && b0.ad === true){
    if(!dbReady() || !authReady()){
      console.warn("[upload] SUPABASE_* 가 없습니다");
      return res.status(503).json({ error:"지금은 올릴 수 없습니다" });
    }
    if(!pvBucket()){
      console.warn("[upload] PROVIDER_BUCKET 이 없어 광고 소재를 못 올립니다");
      return res.status(503).json({ error:"지금은 올릴 수 없습니다" });
    }
    if(!bearer(req)) return res.status(401).json({ error:"로그인이 필요합니다" });
    const sa = await session(req);
    if(!sa.ok){
      if(sa.timeout) return res.status(504).json({ error:"시간이 초과되었습니다. 다시 눌러 주세요" });
      return res.status(401).json({ error:"로그인이 필요합니다" });
    }
    const ra = await dbRpc(sa.token, "claim_ad_image", { p: {
      ad: String(b0.adId || "").trim(),
      kind: String(b0.kind || "").trim().toLowerCase(),
      mime: String(b0.mime || "").trim().toLowerCase(),
      bytes: String(Number(b0.bytes) || 0) } });
    if(!ra.ok){
      if(ra.timeout) return res.status(504).json({ error:"시간이 초과되었습니다. 다시 눌러 주세요" });
      console.warn("[upload] ad claim — " + dbWhy(ra.why));
      /* ⚠️ DB 가 거절한 **그 말**을 그대로 보여 줍니다 */
      const ma = String(ra.why || "").match(/"message"\s*:\s*"([^"]{1,200})"/);
      return res.status(400).json({ error: ma ? ma[1] : "지금 올리지 못했습니다" });
    }
    const ga = ra.data && (Array.isArray(ra.data) ? ra.data[0] : ra.data);
    const pa = ga && ga.path;
    if(!pa){
      console.warn("[upload] ad claim 이 경로를 안 돌려줬습니다");
      return res.status(502).json({ error:"지금 올리지 못했습니다" });
    }
    const sga = await signed("upload", pa, bucketForPath(pa));
    if(!sga.ok){
      if(sga.timeout) return res.status(504).json({ error:"시간이 초과되었습니다. 다시 눌러 주세요" });
      console.warn("[upload] " + sga.why);
      /* ⚠️ 경로는 이미 적혔습니다 — 운영자가 제 화면에서 뺄 수 있습니다 */
      return res.status(502).json({ error:"지금 올리지 못했습니다. 잠시 뒤 다시 눌러 주세요" });
    }
    /* ⚠️⚠️ 돌려주는 것은 **그 경로 하나에만 쓰는 서명된 올리기 주소**와
       **공개 주소**입니다 — service key 는 한 글자도 안 나갑니다. */
    return res.status(200).json({ ok:true, url:sga.url, path:pa,
      publicUrl: origin() + "/storage/v1/object/public/" + pvBucket() + "/" + pa });
  }

  /* ══════════════════════════════════════════════════════════════
     업체가 올리는 시설 사진 · 증빙서류 (0051)

     ⚠️⚠️ **로그인한 업체 담당자가 직접 부릅니다** — 0011 과 다릅니다.
     거기는 올리시는 분이 로그인하지 않은 상태라 service key 로 번호 ·
     연락처를 확인했지만, 여기는 **토큰으로 누구인지 압니다.** 그래서
     그 사람의 토큰으로 문을 부르고, 업체가 아니면 DB 가 거절합니다
     (역할을 여기서 또 판단하면 두 곳이 어긋납니다).
     ⚠️⚠️⚠️ **버킷은 DB 가 돌려준 경로로 고릅니다** — 화면이 보낸
     `kind` 로 고르면 "서류인데 photo 라고 적어 보내기" 한 줄에
     사업자등록증이 공개 버킷으로 갑니다.
     ══════════════════════════════════════════════════════════════ */
  if(b0 && b0.pv === true){
    if(!dbReady() || !authReady()){
      console.warn("[upload] SUPABASE_* 가 없습니다");
      return res.status(503).json({ error:"지금은 올릴 수 없습니다" });
    }
    const kind = String(b0.kind || "").trim();
    if(kind !== "photo" && kind !== "doc")
      return res.status(400).json({ error:"사진인지 서류인지 골라 주세요" });
    /* ⚠️ 갈래마다 **버킷이 다르고**, 없으면 그 갈래만 막습니다 */
    const want = kind === "photo" ? pvBucket() : bucket();
    if(!want){
      console.warn("[upload] " + (kind === "photo" ? "PROVIDER_BUCKET" : "INTAKE_BUCKET") +
                   " 이 없습니다");
      return res.status(503).json({ error:"지금은 올릴 수 없습니다" });
    }
    if(!bearer(req)) return res.status(401).json({ error:"로그인이 필요합니다" });
    const sp = await session(req);
    if(!sp.ok){
      if(sp.timeout) return res.status(504).json({ error:"시간이 초과되었습니다. 다시 눌러 주세요" });
      return res.status(401).json({ error:"로그인이 필요합니다" });
    }
    const rp = await dbRpc(sp.token, "claim_provider_photo", { p: {
      kind: kind, mime: String(b0.mime || "").trim().toLowerCase(),
      bytes: String(Number(b0.bytes) || 0), caption: String(b0.caption || "") } });
    if(!rp.ok){
      if(rp.timeout) return res.status(504).json({ error:"시간이 초과되었습니다. 다시 눌러 주세요" });
      console.warn("[upload] pv claim — " + dbWhy(rp.why));
      /* ⚠️ DB 가 거절한 **그 말**을 그대로 보여 줍니다 */
      const m2 = String(rp.why || "").match(/"message"\s*:\s*"([^"]{1,200})"/);
      return res.status(400).json({ error: m2 ? m2[1] : "지금 올리지 못했습니다" });
    }
    const gp = rp.data && (Array.isArray(rp.data) ? rp.data[0] : rp.data);
    const pp = gp && gp.path;
    if(!pp){
      console.warn("[upload] pv claim 이 경로를 안 돌려줬습니다");
      return res.status(502).json({ error:"지금 올리지 못했습니다" });
    }
    /* ⚠️⚠️ **경로로** 버킷을 고릅니다 (보낸 kind 가 아닙니다) */
    const sgp = await signed("upload", pp, bucketForPath(pp));
    if(!sgp.ok){
      if(sgp.timeout) return res.status(504).json({ error:"시간이 초과되었습니다. 다시 눌러 주세요" });
      console.warn("[upload] " + sgp.why);
      /* ⚠️ 자리는 이미 적혔습니다 — 업체가 제 화면에서 뺄 수 있습니다 */
      return res.status(502).json({ error:"지금 올리지 못했습니다. 잠시 뒤 다시 눌러 주세요" });
    }
    return res.status(200).json({ ok:true, url:sgp.url, id:gp.id });
  }

  /* ── 올릴 자리 하나 ─────────────────────────────────────────────── */
  if(!upReady()){
    /* 운영자에게만 까닭을 적습니다 (절대 규칙 3) */
    console.warn("[upload] INTAKE_BUCKET 또는 SUPABASE_* 가 없습니다");
    return res.status(503).json({ error:"지금은 사진을 올릴 수 없습니다" });
  }

  const b = b0;
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

  const sg = await signed("upload", p, bucket());
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

/* ⚠️⚠️ **관리자 점검이 같은 값을 읽습니다 — 두 곳에 적지 마세요.**
   `api/admin-health.js` 가 버킷 설정(크기 상한 · 허용 형식)이 여기와
   같은지 봅니다. 여기서 늘리고 버킷을 안 고치면 **마지막 자물쇠만
   헐거워지는데** 화면으로는 표가 안 납니다 (GO-LIVE §2). */
module.exports.OK_MIME   = OK_MIME;
module.exports.MAX_BYTES = MAX_BYTES;
module.exports.bucket    = bucket;
/* ⚠️ 업체 시설 사진 버킷은 **공개**입니다 — `check-open.js` 가 그것이
   설정됐는지 세고, 그 칸이 비면 시설 사진만 안 열립니다 (서류는 됩니다). */
module.exports.pvBucket  = pvBucket;
/* ⚠️⚠️ **버킷을 고르는 규칙을 검사가 직접 눌러 봅니다** — 화면이 보낸
   값이 아니라 경로로 고르는지가 여기서 갈립니다. */
module.exports.bucketForPath = bucketForPath;
