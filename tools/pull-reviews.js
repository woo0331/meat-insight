#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   후기를 DB 에서 가져와 **화면이 읽는 파일**로 찍습니다

   ⚠️⚠️ **왜 화면에서 바로 안 읽는가.** 네이버 · 빙 · LLM 봇은
   자바스크립트를 안 돌립니다. 후기를 화면에서 받아 그리면 크롤러는
   **후기가 없는 업체 화면**을 봅니다 — 그리고 그려진 화면만 보는
   검사는 영원히 통과합니다 (작업 기억의 "화면과 크롤러 본문이 다른
   말을 하면 그게 구글에 나가는 거짓말" 줄).
   ⚠️ 대신 **새 후기는 다시 빌드해 올려야 보입니다.**

   ⚠️⚠️ **평균 · 건수를 여기서 찍지 않습니다.** 줄만 가져오고, 세는 것은
   화면이 js/data/review.js 의 amRating() **한 함수**로 합니다
   (절대 규칙 1). 집계를 파일에 적어 두면 어느 날 줄과 어긋나고, 그때
   어느 쪽이 참인지 알 수 없습니다.

   ⚠️⚠️ **공개 키(anon)로 공개 보기(v_review_public)를 읽습니다.**
   review **표**는 anon 에게 열려 있지 않습니다 (0037 의 GRANT 는
   authenticated 에게만 줍니다) — GRANT 와 RLS 는 **따로** 걸립니다
   (0032 에서 겪은 자리). 보기가 가린 후기 · 검사용 업체 · 공개 안 한
   업체를 거릅니다.

   돌리기   SUPABASE_URL=… SUPABASE_ANON_KEY=… node tools/pull-reviews.js
   ⚠️ 키가 없으면 **지금 파일을 그대로 두고** 알리기만 합니다 — 없는
      환경에서 0건으로 덮어쓰면 업체 화면에서 후기가 통째로 사라집니다.
   ════════════════════════════════════════════════════════════════════ */
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const OUT  = path.join(ROOT, "js", "data", "reviews.generated.js");

const VIEW = "v_review_public";
/* ⚠️ 보기가 이미 칸을 골라 담았습니다 — 여기서 또 적는 까닭은 **화면이
   쓰는 칸만** 받아 적기 위해서입니다 (보기에 칸이 늘어도 파일이 저절로
   커지지 않게). ⚠️ by_user · request_id 는 보기에 **없습니다**. */
const COLS = "id,provider_id,rating,body,created_at,updated_at,reply,reply_at,who";

function write(rows, note){
  const body =
'/* ════════════════════════════════════════════════════════════════════\n' +
'   후기 — ⚠️⚠️ **손으로 고치지 마세요.**\n' +
'\n' +
'   이 파일은 tools/pull-reviews.js 가 DB 에서 가져와 찍습니다.\n' +
'   후기의 참은 DB(review 표) 한 곳입니다. 여기서 고치면 다음에\n' +
'   가져올 때 통째로 덮어씌워지고, 그 사이에는 화면과 DB 가 다른 말을\n' +
'   합니다.\n' +
'\n' +
'   ⚠️⚠️ **평균 · 건수가 이 파일에 없습니다.** 세는 것은\n' +
'   js/data/review.js 의 amRating() 한 함수입니다 (절대 규칙 1).\n' +
'   여기에 숫자를 적어 두지 마세요 — 그 칸에 4.9 를 적는 날이 옵니다.\n' +
'\n' +
'   ⚠️ 가린 후기 · 검사용 업체 · 공개 안 한 업체의 후기는 **안 들어\n' +
'   옵니다** (0037 의 보기 where 절).\n' +
'   ⚠️ 작성자는 **마스킹한 값**만 들어옵니다 (성 한 글자 + 별표).\n' +
'\n' +
'   가져온 때   ' + note + '\n' +
'   후기        ' + rows.length + '건\n' +
'   ════════════════════════════════════════════════════════════════════ */\n' +
'window.AM_REVIEWS_AT = ' + JSON.stringify(note) + ';\n' +
'window.AM_REVIEWS = ' + JSON.stringify(rows, null, 2) + ';\n';
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
    "/rest/v1/" + VIEW + "?select=" + COLS + "&order=created_at.desc&limit=2000",
    { headers: { apikey: key, authorization: "Bearer " + key } });
  if(!r.ok){
    const why = await r.text().catch(function(){ return ""; });
    console.error("❌ DB 에서 못 읽었습니다 — HTTP " + r.status +
                  "\n   ⚠️ 지금 파일을 그대로 둡니다 (0건으로 덮어쓰지 않습니다).");
    if(why.indexOf(VIEW) >= 0 || r.status === 404)
      console.error("   ⚠️⚠️ 공개 보기(" + VIEW + ")가 없습니다 — " +
                    "db/migrations/0037 을 아직 올리지 않으셨습니다.\n" +
                    "      review 표는 anon 에게 열려 있지 않습니다 " +
                    "(0037 의 GRANT). 0037 을 먼저 올리세요.");
    else if(why) console.error("   " + why.slice(0, 200));
    process.exit(1);
  }
  const rows = await r.json();
  if(!Array.isArray(rows)){
    console.error("❌ 돌아온 것이 목록이 아닙니다 — 파일을 그대로 둡니다.");
    process.exit(1);
  }

  /* ⚠️⚠️ **둘째 자물쇠** — 보기의 where 가 느슨해지는 날 여기서
     멈춥니다 (0037 을 다시 붙여 넣으면 조용히 옛 판으로 돌아갑니다).
     조용히 거르지 않고 **몇 건을 걸렀는지 말합니다**. */
  const bad = rows.filter(function(v){
    return !(Number(v.rating) >= 1 && Number(v.rating) <= 5);
  });
  if(bad.length){
    console.error("❌ 별점이 1~5 밖인 후기 " + bad.length + "건이 넘어왔습니다 — " +
                  bad.map(function(v){ return v.id; }).join(" · "));
    console.error("   ⚠️ 0037 의 check 제약이 내려갔습니다. 지금 파일은 그대로 둡니다.");
    process.exit(1);
  }
  /* ⚠️ 작성자 칸이 마스킹 안 된 채 오면 멈춥니다 — 보기가 바뀐 것입니다.
     별표가 하나도 없고 두 글자 이상이면 본이름일 수 있습니다. */
  const leak = rows.filter(function(v){
    const w = String(v.who || "");
    return w.length > 1 && w !== "회원" && w.indexOf("*") < 0;
  });
  if(leak.length){
    console.error("❌ 작성자 이름이 마스킹되지 않은 후기 " + leak.length + "건이 " +
                  "넘어왔습니다 — " + leak.map(function(v){ return v.id; }).join(" · "));
    console.error("   ⚠️⚠️ 0037 의 보기가 본이름을 내보내고 있습니다 " +
                  "(개인정보 보호법). 지금 파일은 그대로 둡니다.");
    process.exit(1);
  }

  /* ⚠️ 비어 있는 칸은 **빼고** 적습니다 — null 이 파일에 쌓이면 화면이
     "(미기재)" 를 찍고 싶어집니다 (절대 규칙 2). */
  const clean = rows.map(function(v){
    const o = { id: v.id, provider_id: v.provider_id,
                rating: Number(v.rating), body: v.body,
                created_at: v.created_at, who: v.who || "회원" };
    if(v.reply && String(v.reply).trim() !== ""){
      o.reply = v.reply;
      if(v.reply_at) o.reply_at = v.reply_at;
    }
    /* ⚠️ 고친 후기에는 **고쳤다고 적습니다.** 처음 적은 날만 보이면
       나중에 고친 글이 그날 쓴 글처럼 보입니다 (하지 않은 말을 했다고
       하는 것과 같은 자리입니다).
       ⚠️ 1분을 둡니다 — 넣을 때 updated_at 이 몇 밀리초 늦습니다. */
    const t0 = Date.parse(v.created_at || ""), t1 = Date.parse(v.updated_at || "");
    if(t0 && t1 && t1 - t0 > 60000) o.edited = true;
    return o;
  });

  const now = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";
  write(clean, now);
  console.log("후기 " + clean.length + "건을 가져왔습니다 — " + now);
})().catch(function(e){
  console.error("❌ " + e.message + "\n   ⚠️ 지금 파일을 그대로 둡니다.");
  process.exit(1);
});
