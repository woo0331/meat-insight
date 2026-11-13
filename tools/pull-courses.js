/* ════════════════════════════════════════════════════════════════════
   DB → js/data/courses.generated.js  (전국 골프장 · 연습장 · 0066)

   ⚠️⚠️ **공개 키(anon)로 공개 보기(`v_course_public`)를 읽습니다.**
   `course` **표**에는 GRANT 가 한 줄도 없습니다 — 표를 읽으려 하면
   `permission denied` 입니다. 그게 맞는 동작이고, 공개로 읽는 길은
   보기 하나입니다 (`pull-providers` 가 0032 에서 밟은 자리).
   ⚠️ service key 를 쓸 까닭이 없습니다 — 공개 화면에 실릴 자료입니다.

   ⚠️⚠️⚠️ **키가 없으면 지금 파일을 그대로 둡니다.** 0곳으로 덮어쓰면
   골프장이 화면에서 통째로 사라지고, 그건 받은 적 없는 자료를 "없다"
   고 말하는 것과 다릅니다.

   돌리기  SUPABASE_URL=… SUPABASE_ANON_KEY=… node tools/pull-courses.js
   ════════════════════════════════════════════════════════════════════ */
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const OUT  = path.join(ROOT, "js", "data", "courses.generated.js");

/* 화면이 쓰는 칸만 — ⚠️ 보기에 칸이 늘어도 이 파일이 저절로 커지지 않게 */
const VIEW = "v_course_public";
const COLS = "id,slug,kind,name,region,gu,addr,addr_road,tel,holes,biz_kind," +
             "site_url,lat,lng,state,source_id,as_of,photo";

/* ⚠️⚠️ **사진은 경로만 담겨 있습니다**(0081 의 `course.photo`) — 주소를
   짓는 것은 공개 버킷 이름을 아는 쪽입니다. `PROVIDER_BUCKET` 이 없으면
   **사진 없이** 가져옵니다 — 주소를 지어내면 카드가 깨진 그림이 됩니다
   (0068 이 매물 사진에서 세운 규칙과 같습니다).
   ⚠️ 사진이 없으면 화면이 **아이콘 타일**로 돌아갑니다. 남의 사진이나
   분류 사진을 깔지 않습니다 (표시 · 광고의 공정화에 관한 법률 제3조). */
function pubBucket(){
  return String(process.env.PROVIDER_BUCKET || "").trim()
      || String(process.env.SUPABASE_PUBLIC_BUCKET || "").trim();
}

function write(rows, at){
  var head =
    "/* ⚠️⚠️ **도구가 만드는 파일입니다 — 손으로 고치지 마세요.**\n" +
    "   `node tools/pull-courses.js` 가 DB(보기 " + VIEW + ")에서 찍습니다.\n" +
    "   ⚠️ 손으로 적은 줄은 **출처가 없는 시설**이고, 출처 없는 시설은\n" +
    "   지어낸 것과 구별되지 않습니다 (절대 규칙 1 · 표시광고법 제3조).\n" +
    "   가져온 때: " + at + " */\n";
  fs.writeFileSync(OUT,
    head + "window.AM_COURSES = " + JSON.stringify(rows, null, 1) + ";\n" +
    "window.AM_COURSES_AT = " + JSON.stringify(at) + ";\n", "utf8");
}

(async function(){
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_ANON_KEY || "";
  if(!url || !key){
    console.log("⚠️ SUPABASE_URL · SUPABASE_ANON_KEY 가 없습니다 — " +
                "지금 파일을 그대로 둡니다.");
    console.log("   (골프장을 0곳으로 덮어쓰지 않습니다)");
    process.exit(0);
  }
  /* ⚠️⚠️⚠️ **0081 이 아직 안 올라간 DB 에서는 `photo` 가 없습니다** —
     PostgREST 가 그 칸 하나 때문에 **400** 을 내고, 그러면 이 도구가
     통째로 멈춰 골프장을 **한 곳도 못 가져옵니다**. 저장소의 화면들이
     `amRowsSoft` 로 하는 것과 같게, **확인된 선택 칸만** 빼고 한 번
     다시 묻습니다(사진은 아이콘 타일로 돌아갑니다).
     ⚠️ 보기 부재(404) · 권한(403) 은 **덮지 않습니다** — 그건 0066 을
     아직 안 올리신 것이고 사진과 상관이 없습니다. */
  const BASE = url.replace(/\/+$/, "");
  const HEAD = { apikey: key, authorization: "Bearer " + key };
  const OPT  = ["photo"];
  let r = await fetch(BASE + "/rest/v1/" + VIEW + "?select=" + COLS +
                      "&order=name.asc", { headers: HEAD });
  let dropped = [];
  if(r.status === 400){
    const why0 = await r.clone().text().catch(function(){ return ""; });
    const gone = OPT.filter(function(c){ return why0.indexOf(c) >= 0; });
    if(gone.length){
      const cols2 = COLS.split(",").filter(function(c){
        return gone.indexOf(c) < 0; }).join(",");
      const r2 = await fetch(BASE + "/rest/v1/" + VIEW + "?select=" + cols2 +
                             "&order=name.asc", { headers: HEAD });
      if(r2.ok){
        r = r2; dropped = gone;
        console.warn("⚠️ 운영 DB 에 아직 없는 칸을 빼고 다시 물었습니다 — " +
                     gone.join(" · ") + "\n   (0081 을 올리시면 사진이 같이 옵니다)");
      }
    }
  }
  if(!r.ok){
    const why = await r.text().catch(function(){ return ""; });
    console.error("❌ 골프장을 못 읽었습니다 — HTTP " + r.status +
                  "\n   ⚠️ 지금 파일을 그대로 둡니다.");
    if(why.indexOf(VIEW) >= 0 || r.status === 404)
      console.error("   ⚠️⚠️ 공개 보기(" + VIEW + ")가 없습니다 — " +
                    "db/migrations/0066 을 아직 올리지 않으셨습니다.");
    else if(why) console.error("   " + why.slice(0, 200));
    process.exit(1);
  }
  const rows = await r.json();
  if(!Array.isArray(rows)){
    console.error("❌ 목록이 아닙니다 — 파일을 그대로 둡니다.");
    process.exit(1);
  }

  /* ── 사진 경로 → 공개 주소 ────────────────────────────────────────
     ⚠️⚠️ **버킷이 없으면 그 칸을 통째로 뺍니다**(빈 글자로 두면 화면이
     "사진을 안 올린 골프장" 과 "버킷이 꺼진 것" 을 구별 못 합니다).
     ⚠️ 주소를 짓는 자리는 여기 하나입니다 — 화면은 `photo_url` 만 봅니다. */
  const bk = dropped.length ? "" : pubBucket();
  let shot = 0;
  if(!bk){
    rows.forEach(function(c){ delete c.photo; });
    if(!dropped.length)
      console.warn("⚠️ PROVIDER_BUCKET 이 없어 **골프장 사진 없이** 가져왔습니다 — " +
                   "카드는 아이콘 타일로 섭니다.");
  }else{
    const pub = url.replace(/\/+$/, "") + "/storage/v1/object/public/" + bk + "/";
    rows.forEach(function(c){
      const path0 = String(c.photo || "").trim();
      delete c.photo;
      if(!path0) return;
      c.photo_url = pub + path0.split("/").map(encodeURIComponent).join("/");
      shot++;
    });
  }

  /* ⚠️⚠️ **slug 가 없거나 겹치면 멈춥니다** — 주소가 겹치면 빌드가 한
     화면을 다른 화면으로 덮어씁니다 (에러 없이 조용히). */
  const seen = {}, bad = [];
  rows.forEach(function(c){
    if(!c.slug) bad.push(c.name + " 에 slug 가 없습니다");
    else if(seen[c.slug]) bad.push("slug 가 겹칩니다 — " + c.slug);
    else seen[c.slug] = 1;
    if(!c.region) bad.push(c.name + " 에 지역이 없습니다");
  });
  if(bad.length){
    bad.slice(0, 20).forEach(function(m){ console.error("❌ " + m); });
    console.error("   ⚠️ 지금 파일을 그대로 둡니다.");
    process.exit(1);
  }

  /* 빈 칸은 **빼고** 적습니다 — null 을 들고 다니면 화면이 그것을 찍습니다 */
  const clean = rows.map(function(c){
    const o = {};
    Object.keys(c).forEach(function(k){
      const v = c[k];
      if(v === null || v === undefined) return;
      if(typeof v === "string" && v.trim() === "") return;
      o[k] = v;
    });
    return o;
  });

  const now = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";
  write(clean, now);
  const n = { golf:0, range:0 };
  clean.forEach(function(c){ n[c.kind] = (n[c.kind] || 0) + 1; });
  console.log("골프장 " + (n.golf || 0) + "곳 · 연습장 " + (n.range || 0) +
              "곳 · 사진 " + shot + "장을 가져왔습니다 — " + now);
})().catch(function(e){
  console.error("❌ " + e.message + "\n   ⚠️ 지금 파일을 그대로 둡니다.");
  process.exit(1);
});
