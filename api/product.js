/* ════════════════════════════════════════════════════════════════════
   /api/product — 회원 상품 올리기 (2026-11-27 대표 지시 · 세 화면 시안의 셋째)

     GET                     올릴 수 있는 상태인가 + (로그인했으면) 내 상품 목록
     GET  ?id=<상품 id>       내 상품 하나 + 사진 보기 주소
     POST {op:"save", p}      만들기 · 고치기         → save_product
     POST {op:"slot", id, mime, bytes}  사진 자리 하나  → claim_product_photo_slot + 서명된 올리기 주소
     POST {op:"drop", photo}  사진 빼기               → drop_product_photo

   ⚠️⚠️ **주인은 언제나 토큰의 계정입니다.** 요청이 보낸 owner 를 읽지 않습니다 —
   DB 의 문(save_product 등)이 auth.uid() 로 정하고, 남의 상품이면 거절합니다.
   그래서 여기서는 **그 사람의 토큰으로** 부릅니다 (dbRpc · dbSelectAs).
   ⚠️⚠️ **올린 사람은 공개하지 못합니다** — 올리면 '검수 대기' 이고 공개는 운영자 문
   (set_product_state) 입니다. 이 주소에는 그 길이 없습니다.
   ⚠️ 표가 아직 없는 DB(운영 — 초안 0087 을 안 돌렸습니다)에서는 ready:false 이고
   화면은 적기 전에 "지금은 올릴 수 없습니다" 를 냅니다 (닫힘을 먼저 말합니다).
   ⚠️ 사진 파일은 이 주소를 지나가지 않습니다 — 서명된 주소로 화면이 바로 올립니다
   (api/upload.js 와 같은 방식 · 같은 비공개 버킷의 product/ 앞머리).
   ════════════════════════════════════════════════════════════════════ */

const { authReady, bearer, session } = require("./_auth.js");
const { dbReady, dbSelect, dbSelectAs, dbRpc, dbWhy, DB_TIMEOUT } = require("./_db.js");
const up = require("./upload.js");

const OK_MIME = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = up.MAX_BYTES;
const CATS = ["kitchen", "supply", "furniture", "device", "etc"];

function origin(){ return String(process.env.SUPABASE_URL || "").trim().replace(/\/+$/, ""); }

/* 서명된 주소 — upload.js 의 것과 같은 규칙 (service key 는 내려가지 않습니다) */
async function signed(kind, p){
  const ctl = new AbortController();
  const timer = setTimeout(function(){ ctl.abort(); }, DB_TIMEOUT);
  try{
    const url = origin() + "/storage/v1/object/" +
      (kind === "upload" ? "upload/sign/" : (kind === "del" ? "" : "sign/")) + up.bucket() + "/" + p;
    const r = await fetch(url, {
      method: kind === "del" ? "DELETE" : "POST",
      signal: ctl.signal,
      headers:{ "content-type":"application/json",
                "authorization":"Bearer " + String(process.env.SUPABASE_SERVICE_KEY).trim() },
      body: kind === "del" ? undefined : JSON.stringify(kind === "upload" ? {} : { expiresIn: 600 })
    });
    const text = await r.text().catch(function(){ return ""; });
    if(!r.ok) return { ok:false, status:r.status, why:"storage " + r.status + " " + text.slice(0, 200) };
    if(kind === "del") return { ok:true };
    let d = null; try{ d = JSON.parse(text); }catch(e){}
    const rel = d && (d.url || d.signedURL || d.signedUrl);
    if(!rel) return { ok:false, why:"storage 가 주소를 안 돌려줬습니다" };
    return { ok:true, url: origin() + "/storage/v1" + (String(rel).charAt(0) === "/" ? "" : "/") + rel };
  }catch(e){
    const aborted = e && e.name === "AbortError";
    return { ok:false, timeout:aborted, why: aborted ? "storage timeout" : "storage " + (e && e.message) };
  }finally{ clearTimeout(timer); }
}

/* 표가 있는가 — 없으면(초안을 안 돌린 DB) 올리는 길 자체가 없습니다 */
async function tableReady(){
  if(!dbReady() || !authReady() || !up.bucket()) return false;
  const q = await dbSelect("product", "?select=id&limit=0");
  return !!q.ok;
}

function msgOf(why){
  const m = String(why || "").match(/"message"\s*:\s*"([^"]{1,200})"/);
  return m ? m[1] : "";
}
const isId = function(x){ return /^[0-9a-fA-F-]{36}$/.test(String(x || "")); };

const realHandler = async function handler(req, res){
  res.setHeader("cache-control", "no-store");
  const ready = await tableReady();

  if(req.method === "GET"){
    if(!ready) return res.status(200).json({ ready:false });
    if(!bearer(req)) return res.status(200).json({ ready:true, signedIn:false });
    const s = await session(req);
    if(!s.ok) return res.status(200).json({ ready:true, signedIn:false });
    const id = String((req.query && req.query.id) || "").trim();
    const cols = "id,name,cat,price,body,ship,state,updated_at,product_photo(id,path,mime,bytes)";
    const q = await dbSelectAs(s.token, "product",
      "?select=" + encodeURIComponent(cols) +
      "&owner_id=eq." + encodeURIComponent(s.sub || "") +
      (id ? "&id=eq." + encodeURIComponent(id) : "") + "&order=updated_at.desc&limit=50");
    if(!q.ok){
      console.warn("[product] " + dbWhy(q.why));
      return res.status(502).json({ error:"지금 불러오지 못했습니다" });
    }
    const rows = q.rows;
    if(id){
      if(!rows[0]) return res.status(404).json({ error:"상품을 찾을 수 없습니다" });
      const ph = rows[0].product_photo || [];
      for(const p of ph){
        const sg = await signed("sign", p.path);
        p.url = sg.ok ? sg.url : "";
        delete p.path;   /* ⚠️ 버킷 경로를 날것으로 내려보내지 않습니다 */
      }
    }else{
      rows.forEach(function(r){ r.photos = (r.product_photo || []).length; delete r.product_photo; });
    }
    return res.status(200).json({ ready:true, signedIn:true, products:rows });
  }

  if(req.method !== "POST"){
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error:"GET 또는 POST 로 보내 주세요" });
  }
  if(!ready) return res.status(503).json({ error:"지금은 상품을 올릴 수 없습니다" });
  if(!bearer(req)) return res.status(401).json({ error:"로그인이 필요합니다" });
  const s = await session(req);
  if(!s.ok){
    if(s.timeout) return res.status(504).json({ error:"시간이 초과되었습니다. 다시 눌러 주세요" });
    return res.status(401).json({ error:"로그인이 필요합니다" });
  }

  let b = req.body;
  if(typeof b === "string"){ try{ b = JSON.parse(b); }catch(e){ b = null; } }
  if(!b || typeof b !== "object") return res.status(400).json({ error:"내용을 읽을 수 없습니다" });

  if(b.op === "save"){
    const p = b.p || {};
    const name = String(p.name || "").trim().slice(0, 80);
    const cat  = String(p.cat || "").trim();
    const price = String(p.price == null ? "" : p.price).replace(/[^0-9]/g, "").slice(0, 10);
    /* ⚠️ 화면과 같은 규칙 — 상품명 · 카테고리 · 판매 가격(비우면 협의) */
    if(!name) return res.status(400).json({ error:"상품명을 적어 주세요" });
    if(CATS.indexOf(cat) < 0) return res.status(400).json({ error:"카테고리를 골라 주세요" });
    const arg = { name:name, cat:cat, price:price,
                  body:String(p.body || "").slice(0, 3000), ship:String(p.ship || "").slice(0, 500) };
    if(p.id){ if(!isId(p.id)) return res.status(400).json({ error:"상품을 찾을 수 없습니다" }); arg.id = p.id; }
    const r = await dbRpc(s.token, "save_product", { p:arg });
    if(!r.ok){
      if(r.timeout) return res.status(504).json({ error:"시간이 초과되었습니다. 다시 눌러 주세요" });
      console.warn("[product] save — " + dbWhy(r.why));
      return res.status(400).json({ error: msgOf(r.why) || "지금 저장하지 못했습니다" });
    }
    return res.status(200).json({ ok:true, id: r.data && r.data.id, state: r.data && r.data.state });
  }

  if(b.op === "slot"){
    const mime = String(b.mime || "").trim().toLowerCase();
    const bytes = Number(b.bytes);
    if(!isId(b.id)) return res.status(400).json({ error:"상품을 찾을 수 없습니다" });
    if(OK_MIME.indexOf(mime) < 0) return res.status(400).json({ error:"사진은 JPG · PNG · WEBP 만 올리실 수 있습니다" });
    if(!(bytes > 0) || bytes > MAX_BYTES) return res.status(400).json({ error:"한 장에 8MB 까지 올리실 수 있습니다" });
    const r = await dbRpc(s.token, "claim_product_photo_slot", { p_product:b.id, p_mime:mime, p_bytes:bytes });
    if(!r.ok){
      if(r.timeout) return res.status(504).json({ error:"시간이 초과되었습니다. 다시 눌러 주세요" });
      console.warn("[product] slot — " + dbWhy(r.why));
      return res.status(400).json({ error: msgOf(r.why) || "지금 올리지 못했습니다" });
    }
    const pth = r.data && r.data.path;
    if(!pth) return res.status(502).json({ error:"지금 올리지 못했습니다" });
    const sg = await signed("upload", pth);
    if(!sg.ok){
      console.warn("[product] " + sg.why);
      return res.status(502).json({ error:"지금 올리지 못했습니다. 잠시 뒤 다시 눌러 주세요" });
    }
    return res.status(200).json({ ok:true, url:sg.url });
  }

  if(b.op === "drop"){
    if(!isId(b.photo)) return res.status(400).json({ error:"사진을 찾을 수 없습니다" });
    const r = await dbRpc(s.token, "drop_product_photo", { p_photo:b.photo });
    if(!r.ok){
      console.warn("[product] drop — " + dbWhy(r.why));
      return res.status(400).json({ error: msgOf(r.why) || "지금 빼지 못했습니다" });
    }
    /* 줄을 먼저 지우고 파일을 그 다음에 (거꾸로 하면 안 열리는 사진이 보입니다) */
    const pth = r.data && r.data.path;
    if(pth){ const d = await signed("del", pth); if(!d.ok) console.warn("[product] 파일 지우기 — " + d.why); }
    return res.status(200).json({ ok:true });
  }

  return res.status(400).json({ error:"모르는 요청입니다" });
};

const { accountsOpen, closed } = require("./_open.js");
module.exports = function restorationGate(req, res){
  if(!accountsOpen()) return closed(res);
  return realHandler(req, res);
};
module.exports.CATS = CATS;
