#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   업체 자료를 DB 에서 가져와 **화면이 읽는 파일**로 찍습니다

   ⚠️⚠️ **업체의 참은 DB 한 곳입니다.** 앞 서비스는 화면용 데이터 파일과
   DB 가 **따로** 있어서, 한쪽만 고치면 에러 없이 조용히 어긋났습니다.
   여기서는 파일이 **DB 에서 나온 것**이고 손으로 고치지 않습니다 —
   `db/apply-from-0008.sql` 과 같은 종류의 파일입니다.

   ⚠️⚠️ **왜 화면에서 바로 안 읽는가.** 네이버 · 빙 · LLM 봇은
   자바스크립트를 안 돌립니다. 업체 목록을 화면에서 받아 그리면
   크롤러는 **빈 분류 화면**을 봅니다 — 분류 화면이 존재하는 까닭이
   통째로 사라집니다. 그래서 빌드가 찍어 HTML 에 넣습니다.
   ⚠️ 대신 **새 업체는 다시 빌드해 올려야 보입니다.** 승인한 날
   `node tools/pull-providers.js && node tools/ship.js --merge` 입니다.

   ⚠️⚠️ **공개 키(anon)로 공개 보기(`v_provider_card`)를 읽습니다.**
   `provider` **표**를 읽으려 했는데, 0001 의 GRANT 가 anon 에게
   select 를 한 줄도 주지 않아 `permission denied for table provider`
   였습니다 — RLS 정책만 보고 "공개 목록은 읽힌다" 고 읽은 것이고,
   **GRANT 가 먼저** 막습니다. 업체가 0곳인 동안은 돌릴 까닭이 없어
   몰랐고, **첫 업체를 승인하신 날** 터질 참이었습니다 (0032 가 그
   보기를 열었습니다). ⚠️ service key 를 쓸 까닭은 없습니다 — 공개
   화면에 실릴 자료입니다.

   돌리기   SUPABASE_URL=… SUPABASE_ANON_KEY=… node tools/pull-providers.js
   ⚠️ 키가 없으면 **지금 파일을 그대로 두고** 알리기만 합니다 —
      없는 환경에서 업체 목록을 0곳으로 덮어쓰면 화면에서 업체가
      통째로 사라집니다.
   ════════════════════════════════════════════════════════════════════ */
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const OUT  = path.join(ROOT, "js", "data", "providers.generated.js");

/* 화면이 쓰는 칸만 가져옵니다 — ⚠️ 연락처 · 담당자는 **안 가져옵니다**
   (손님 화면에 갈 까닭이 없고, 저장소는 공개입니다). */
/* ⚠️ 보기(0032)가 이미 칸을 골라 담았습니다 — 여기서 또 적는 까닭은
   **화면이 쓰는 칸만** 받아 적기 위해서입니다 (보기에 칸이 늘어도
   파일이 저절로 커지지 않게). */
const VIEW = "v_provider_card";
const COLS = "id,name,intro,regions,gu,subs,since,consult_hours,verified,brands,scale,contact_ways,is_test";

/* ⚠️⚠️ **검사용 업체를 두 겹으로 거릅니다** (0030 · 2차 지시서 §8).
   ① RLS 의 provider_public 이 anon 에게 `is_test = true` 를 안 내줍니다
   ② 그래도 여기서 다시 거릅니다 — 정책을 누가 되돌리는 날(0001 을 다시
      붙여 넣으면 조용히 내려갑니다) 이 줄 하나가 남습니다.
   ⚠️ 자물쇠를 **다른 자리에** 두는 까닭입니다. 같은 자리에 두 번 적으면
      둘이 같이 내려갑니다.
   ⚠️⚠️ 질의에도 적어서, 칸이 없으면(0030 을 안 올린 DB) HTTP 400 으로
      **멈춥니다.** 칸 없이 통째로 가져오면 검사용 업체가 손님 화면에
      나갑니다 — 조용히 지나가는 것보다 멈추는 것이 맞습니다.
   ③ 보기 자체가 `listed = true and is_test = false` 로 좁힙니다 (0032). */
const NOT_TEST = "&is_test=eq.false";

/* ⚠️⚠️ **가격은 다른 보기에서 옵니다** (0042 의 v_provider_price_public).
   그 보기가 공개 · 승인 · 검사용 아님 · 내리지 않음 넷을 전부 봅니다 —
   보기는 RLS 를 지나지 않으므로 **그 where 절이 자물쇠**입니다.
   ⚠️ 업체와 **같은 번에** 가져옵니다. 따로 가져오면 한쪽만 새것이 되어
   가격이 없는 업체 · 업체가 없는 가격이 생기고, 그때 가격은 **아무
   화면에도 안 뜨면서 아무 에러도 안 납니다** (후기에서 겪은 자리). */
const PVIEW = "v_provider_price_public";
const PCOLS = "id,provider_id,sub,label,amount,unit,note";

/* ⚠️⚠️⚠️ **시설 사진도 같은 번에 가져옵니다** (0051 의
   `v_provider_photo_public`). 그 보기가 사진만 · 승인 · 공개 · 검사용
   아님 넷을 전부 봅니다 — **증빙서류는 그 보기에 줄이 아예 없습니다.**
   ⚠️ 따로 가져오면 한쪽만 새것이 되어 사진이 없는 업체 · 업체가 없는
   사진이 생기고, 그때 사진은 **아무 화면에도 안 뜨면서 아무 에러도
   안 납니다** (후기 · 가격에서 겪은 자리).
   ⚠️⚠️ **주소는 공개 버킷 주소입니다.** 그 사진은 정적 HTML 에
   `<img>` 로 찍히므로 10분짜리 서명 주소를 쓸 수가 없습니다. 버킷
   이름은 `PROVIDER_BUCKET` 에서 읽습니다 — 없으면 사진 없이 갑니다
   (지어낸 주소를 찍지 않습니다). */
const FVIEW = "v_provider_photo_public";
const FCOLS = "id,provider_id,path,mime,caption";
function pvBucket(){
  return String(process.env.PROVIDER_BUCKET || "").trim()
    .replace(/[^A-Za-z0-9_.-]/g, "").slice(0, 60);
}

function write(rows, note){
  const body =
'/* ════════════════════════════════════════════════════════════════════\n' +
'   입점 업체 — ⚠️⚠️ **손으로 고치지 마세요.**\n' +
'\n' +
'   이 파일은 `tools/pull-providers.js` 가 DB 에서 가져와 찍습니다.\n' +
'   업체의 참은 DB(`provider` 표) 한 곳입니다. 여기서 고치면 다음에\n' +
'   가져올 때 통째로 덮어씌워지고, 그 사이에는 화면과 DB 가 다른 말을\n' +
'   합니다.\n' +
'\n' +
'   ⚠️ 새 업체를 승인하신 날 —\n' +
'       node tools/pull-providers.js && node tools/ship.js --merge\n' +
'\n' +
'   ⚠️ `listed = true` 인 업체만 들어옵니다 (RLS 의 provider_public).\n' +
'   ⚠️ 연락처 · 담당자는 **안 들어옵니다** — 저장소는 공개입니다.\n' +
'   ⚠️⚠️ 평점 · 후기 수를 여기 넣지 마세요. 실제 후기에서 **계산**합니다.\n' +
'   ⚠️ 가격(`prices`)은 업체가 **스스로 등록한 것**입니다 (0042).\n' +
'      등록이 0건이면 그 칸이 아예 없고, 카드에서 가격 줄이 빠집니다.\n' +
'   ⚠️⚠️ 사진(`photos`)은 업체가 **스스로 올린 시설 사진**입니다 (0051).\n' +
'      증빙서류는 **한 장도 안 들어옵니다** — 공개 보기에 줄이 없습니다.\n' +
'      0건이면 칸이 아예 없고, 카드가 분류 아이콘 타일로 돌아갑니다.\n' +
'\n' +
'   가져온 때   ' + note + '\n' +
'   업체        ' + rows.length + '곳\n' +
'   ════════════════════════════════════════════════════════════════════ */\n' +
'window.AM_PROVIDERS_AT = ' + JSON.stringify(note) + ';\n' +
'window.AM_PROVIDERS = ' + JSON.stringify(rows, null, 2) + ';\n';
  fs.writeFileSync(OUT, body);
}

const url = process.env.SUPABASE_URL || "";
const key = process.env.SUPABASE_ANON_KEY || "";

if(!url || !key){
  const had = fs.existsSync(OUT);
  console.warn("⚠️ SUPABASE_URL · SUPABASE_ANON_KEY 가 없어 가져오지 못했습니다.");
  console.warn("   " + (had ? "지금 파일을 그대로 둡니다 (덮어쓰지 않습니다)."
                            : "빈 목록으로 하나 만들어 둡니다."));
  if(!had) write([], "아직 가져온 적 없음");
  process.exit(0);
}

(async function(){
  const r = await fetch(url.replace(/\/+$/, "") +
    "/rest/v1/" + VIEW + "?select=" + COLS + NOT_TEST + "&order=id.asc",
    { headers: { apikey: key, authorization: "Bearer " + key } });
  if(!r.ok){
    const why = await r.text().catch(function(){ return ""; });
    console.error("❌ DB 에서 못 읽었습니다 — HTTP " + r.status +
                  "\n   ⚠️ 지금 파일을 그대로 둡니다 (0곳으로 덮어쓰지 않습니다).");
    /* ⚠️ `is_test` 칸이 없으면 이 꼴로 거절합니다 — 까닭을 사람 말로
       말해 줍니다. 안 적으면 "HTTP 400" 만 보고 키를 의심합니다. */
    if(why.indexOf(VIEW) >= 0 || r.status === 404)
      console.error("   ⚠️⚠️ 공개 보기(" + VIEW + ")가 없습니다 — " +
                    "db/migrations/0032 를 아직 올리지 않으셨습니다.\n" +
                    "      `provider` 표는 anon 에게 열려 있지 않습니다 " +
                    "(0001 의 GRANT). 0030 · 0032 를 먼저 올리세요.");
    else if(why.indexOf("is_test") >= 0)
      console.error("   ⚠️⚠️ `is_test` 칸이 없습니다 — db/migrations/0030 을 " +
                    "아직 올리지 않으셨습니다.\n" +
                    "      그 칸 없이 가져오면 검사용 업체가 손님 화면에 나갑니다. " +
                    "0030 을 먼저 올리세요.");
    else if(why) console.error("   " + why.slice(0, 200));
    process.exit(1);
  }
  const rows = await r.json();
  if(!Array.isArray(rows)){
    console.error("❌ 돌아온 것이 목록이 아닙니다 — 파일을 그대로 둡니다.");
    process.exit(1);
  }
  /* ⚠️ 비어 있는 칸은 **빼고** 적습니다 — null 이 파일에 쌓이면 화면이
     "(미기재)" 를 찍고 싶어집니다 (절대 규칙 2). */
  /* ⚠️⚠️ **두 번째 자물쇠** — 정책이 내려간 날 여기서 멈춥니다. 조용히
     거르지 않고 **몇 줄을 걸렀는지 말합니다**: 여기 걸리는 줄이 있다는
     것은 RLS 가 안 거르고 있다는 뜻이고, 그건 따로 고쳐야 하는 고장입니다. */
  const test = rows.filter(function(p){ return p.is_test === true; });
  if(test.length){
    console.error("❌ 검사용 업체 " + test.length + "곳이 공개 질의로 넘어왔습니다 — " +
                  test.map(function(p){ return p.id; }).join(" · "));
    console.error("   ⚠️⚠️ 0032 의 보기가 안 거르고 있습니다 " +
                  "(0026 이나 0032 를 다시 붙여 넣으면 where 가 옛 판으로 " +
                  "돌아갑니다).\n" +
                  "      db/migrations/0032_provider_card_view.sql 을 다시 " +
                  "올리세요. 지금 파일은 그대로 둡니다.");
    process.exit(1);
  }
  const live = rows.filter(function(p){ return p.is_test !== true; });
  const clean = live.map(function(p){
    const o = { id: p.id, name: p.name };
    ["intro", "since", "consult_hours", "scale"].forEach(function(k){
      if(p[k] !== null && p[k] !== undefined && String(p[k]).trim() !== "") o[k] = p[k];
    });
    ["regions", "gu", "subs", "brands", "contact_ways"].forEach(function(k){
      if(Array.isArray(p[k]) && p[k].length) o[k] = p[k];
    });
    if(p.verified && typeof p.verified === "object" && Object.keys(p.verified).length)
      o.verified = p.verified;
    return o;
  });
  /* ── 가격 (0042) ──────────────────────────────────────────────
     ⚠️ 못 읽으면 **멈춥니다.** 가격 없이 찍으면 "가격을 안 올린 업체" 와
     "가격을 못 읽은 업체" 가 화면에서 똑같이 보입니다 — 그 둘은 다릅니다. */
  const pr = await fetch(url.replace(/\/+$/, "") +
    "/rest/v1/" + PVIEW + "?select=" + PCOLS + "&order=amount.asc",
    { headers: { apikey: key, authorization: "Bearer " + key } });
  if(!pr.ok){
    const pwhy = await pr.text().catch(function(){ return ""; });
    console.error("❌ 가격을 못 읽었습니다 — HTTP " + pr.status +
                  "\n   ⚠️ 지금 파일을 그대로 둡니다 (가격 없이 덮어쓰지 않습니다).");
    if(pwhy.indexOf(PVIEW) >= 0 || pr.status === 404)
      console.error("   ⚠️⚠️ 공개 보기(" + PVIEW + ")가 없습니다 — " +
                    "db/migrations/0042 를 아직 올리지 않으셨습니다.");
    else if(pwhy) console.error("   " + pwhy.slice(0, 200));
    process.exit(1);
  }
  const prices = await pr.json();
  if(!Array.isArray(prices)){
    console.error("❌ 가격이 목록이 아닙니다 — 파일을 그대로 둡니다.");
    process.exit(1);
  }
  /* ⚠️⚠️ **업체가 없는 가격은 버리지 않고 말합니다** — 그 가격은 어느
     화면에도 안 뜨면서 아무 에러도 안 납니다. 보기 둘이 어긋났다는
     뜻이고, 조용히 지나가면 다음 차수가 모릅니다. */
  const byId = {};
  clean.forEach(function(p){ byId[p.id] = p; });
  const lost = [];
  prices.forEach(function(x){
    const p = byId[x.provider_id];
    if(!p){ lost.push(x.provider_id); return; }
    if(!p.prices) p.prices = [];
    const o = { sub: x.sub, label: x.label, amount: Number(x.amount), unit: x.unit };
    if(x.note !== null && x.note !== undefined && String(x.note).trim() !== "")
      o.note = x.note;
    p.prices.push(o);
  });
  if(lost.length)
    console.warn("⚠️ 업체 목록에 없는 업체의 가격 " + lost.length + "건을 뺐습니다 — " +
                 Array.from(new Set(lost)).join(" · ") +
                 "\n   보기 둘이 어긋났습니다 (0032 · 0042 의 where 를 보세요).");

  /* ── 시설 사진 (0051) ────────────────────────────────────────
     ⚠️ 버킷 이름이 없으면 **사진 없이** 갑니다 — 주소를 지어내면
     깨진 그림이 손님 화면에 걸립니다 (절대 규칙 1 · 2). */
  const bk = pvBucket();
  let shots = [], lostPh = [];
  if(!bk){
    console.warn("⚠️ PROVIDER_BUCKET 이 없어 **시설 사진 없이** 가져왔습니다 — " +
                 "주소를 지어내지 않습니다 (업체가 올린 사진은 그대로 있습니다).");
  }else{
    const fr = await fetch(url.replace(/\/+$/, "") +
      "/rest/v1/" + FVIEW + "?select=" + FCOLS + "&order=created_at.asc",
      { headers: { apikey: key, authorization: "Bearer " + key } });
    if(!fr.ok){
      const fwhy = await fr.text().catch(function(){ return ""; });
      /* ⚠️ 못 읽으면 **멈춥니다** — 사진 없이 덮어쓰면 "사진을 안 올린
         업체" 와 "사진을 못 읽은 업체" 가 화면에서 똑같이 보입니다. */
      console.error("❌ 시설 사진을 못 읽었습니다 — HTTP " + fr.status +
                    "\n   ⚠️ 지금 파일을 그대로 둡니다.");
      if(fwhy.indexOf(FVIEW) >= 0 || fr.status === 404)
        console.error("   ⚠️⚠️ 공개 보기(" + FVIEW + ")가 없습니다 — " +
                      "db/migrations/0051 을 아직 올리지 않으셨습니다.");
      else if(fwhy) console.error("   " + fwhy.slice(0, 200));
      process.exit(1);
    }
    shots = await fr.json();
    if(!Array.isArray(shots)){
      console.error("❌ 시설 사진이 목록이 아닙니다 — 파일을 그대로 둡니다.");
      process.exit(1);
    }
    const pub = url.replace(/\/+$/, "") + "/storage/v1/object/public/" + bk + "/";
    shots.forEach(function(x){
      const p = byId[x.provider_id];
      /* ⚠️ 업체가 없는 사진은 **버리지 않고 말합니다** (가격과 같은 까닭) */
      if(!p){ lostPh.push(x.provider_id); return; }
      if(!p.photos) p.photos = [];
      const o2 = { url: pub + String(x.path).split("/").map(encodeURIComponent).join("/") };
      if(x.caption !== null && x.caption !== undefined &&
         String(x.caption).trim() !== "") o2.caption = x.caption;
      p.photos.push(o2);
    });
    if(lostPh.length)
      console.warn("⚠️ 업체 목록에 없는 업체의 사진 " + lostPh.length + "건을 뺐습니다 — " +
                   Array.from(new Set(lostPh)).join(" · ") +
                   "\n   보기 둘이 어긋났습니다 (0032 · 0051 의 where 를 보세요).");
  }

  const now = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";
  write(clean, now);
  console.log("업체 " + clean.length + "곳 · 가격 " +
              (prices.length - lost.length) + "건 · 시설 사진 " +
              (shots.length - lostPh.length) + "장을 가져왔습니다 — " + now);
})().catch(function(e){
  console.error("❌ " + e.message + "\n   ⚠️ 지금 파일을 그대로 둡니다.");
  process.exit(1);
});
