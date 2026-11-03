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

   ⚠️ **공개 키(anon)로 읽습니다.** RLS 의 provider_public 정책이
   `listed = true` 인 줄만 내줍니다 — service key 를 쓸 까닭이 없습니다.

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
const COLS = "id,name,intro,regions,gu,subs,since,consult_hours,verified,brands,scale";

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
    "/rest/v1/provider?select=" + COLS + "&listed=eq.true&order=id.asc",
    { headers: { apikey: key, authorization: "Bearer " + key } });
  if(!r.ok){
    console.error("❌ DB 에서 못 읽었습니다 — HTTP " + r.status +
                  "\n   ⚠️ 지금 파일을 그대로 둡니다 (0곳으로 덮어쓰지 않습니다).");
    process.exit(1);
  }
  const rows = await r.json();
  if(!Array.isArray(rows)){
    console.error("❌ 돌아온 것이 목록이 아닙니다 — 파일을 그대로 둡니다.");
    process.exit(1);
  }
  /* ⚠️ 비어 있는 칸은 **빼고** 적습니다 — null 이 파일에 쌓이면 화면이
     "(미기재)" 를 찍고 싶어집니다 (절대 규칙 2). */
  const clean = rows.map(function(p){
    const o = { id: p.id, name: p.name };
    ["intro", "since", "consult_hours", "scale"].forEach(function(k){
      if(p[k] !== null && p[k] !== undefined && String(p[k]).trim() !== "") o[k] = p[k];
    });
    ["regions", "gu", "subs", "brands"].forEach(function(k){
      if(Array.isArray(p[k]) && p[k].length) o[k] = p[k];
    });
    if(p.verified && typeof p.verified === "object" && Object.keys(p.verified).length)
      o.verified = p.verified;
    return o;
  });
  const now = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";
  write(clean, now);
  console.log("업체 " + clean.length + "곳을 가져왔습니다 — " + now);
})().catch(function(e){
  console.error("❌ " + e.message + "\n   ⚠️ 지금 파일을 그대로 둡니다.");
  process.exit(1);
});
