#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   손으로 **확인한** 골프장 한 줄을 검토 묶음에 더합니다 (2026-11-13)

     node tools/add-course.js \
       --name "OO컨트리클럽" --kind golf --region gyeonggi --gu 용인시 \
       --addr "경기 용인시 처인구 ..." --site https://... \
       --holes 18 --biz 대중제 \
       --source https://www.data.go.kr/data/.../fileData.do \
       --checked 2026-11-13

     node tools/add-course.js --list      지금 몇 줄인지
     node tools/add-course.js --check     묶음 전체를 다시 봅니다

   ⚠️⚠️⚠️ **왜 손으로 받나** — 이 세션은 공공데이터 포털로 **못 나갑니다**
   (환경의 네트워크 정책이 CONNECT 에 403 · `data/staging/blocked_sources.csv`).
   `tools/fetch-courses.js` 는 받은 줄이 **0건**이고, 그 사실을 바꾸려면
   환경에서 그 호스트를 열어 주셔야 합니다. 그 전까지 **실제 골프장을
   한 곳이라도 올리는 길은 이것 하나**입니다.

   ⚠️⚠️⚠️ **지어낸 줄을 막는 것이 이 도구의 전부입니다.**
     · `--source` 가 없으면 **거절**합니다 (출처 없는 시설은 지어낸 것과
       구별되지 않습니다 · 절대 규칙 1)
     · `--checked` 가 없거나 **앞날이면 거절**합니다
     · 「제휴」 · 「예약 가능」 · 「추천」 · 「공식 파트너」 같은 말이 어느
       칸에든 들어 있으면 **거절**합니다 (저희가 맺은 것이 없습니다)
     · 같은 이름 · 같은 지역이 이미 있으면 **거절**하고, 비슷한 이름은
       **후보로만** 알려 줍니다 (합치는 판단은 사람이 합니다)
     · 좌표는 **받지 않습니다** — 공공 인허가 자료의 좌표계가 섞여 있어
       확인 전에는 비웁니다(0066). 지도는 주소로 엽니다.

   ⚠️⚠️ **사진은 여기서 안 받습니다** — 권리를 확인한 파일만 운영자가
   `/admin` 에서 경로로 답니다(0081). 바깥 사진을 핫링크하거나 베끼지
   않습니다.

   결과: data/review/courses_review.csv
     → `node tools/make-import-sql.js` 가 그 줄까지 같이 넣습니다
   ════════════════════════════════════════════════════════════════════ */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DIR  = path.join(ROOT, "data", "review");
const FILE = path.join(DIR, "courses_review.csv");

/* 같은 머리를 씁니다 — ⚠️ `make-import-sql.js` 가 `courses_clean.csv` 와
   **같은 칸 이름**으로 읽습니다. 두 벌로 적으면 한쪽만 고치는 날 그 칸이
   조용히 빠집니다. 뒤 셋이 이 묶음에만 있는 칸입니다. */
const HEAD = ["source_id","src_key","kind","name","name_norm","region","gu",
              "addr","addr_road","tel","holes","biz_kind","lat","lng",
              "state","status_raw","as_of","site_url","source_url","checked_at"];

/* ⚠️⚠️⚠️ **저희가 맺은 것이 없는 말**입니다 — 어느 칸에든 들어오면
   거절합니다 (`tools/test-course.js` 가 화면에서 찾는 그 말들입니다). */
const BAN = ["제휴", "예약 가능", "예약가능", "추천", "공식 파트너",
             "공식파트너", "독점", "최저가", "보장"];

function csvCell(v){
  const s = (v === null || v === undefined) ? "" : String(v);
  return '"' + s.replace(/"/g, '""') + '"';
}
function parseCsv(text){
  const rows = []; let row = [], cur = "", q = false;
  for(let i = 0; i < text.length; i++){
    const c = text[i];
    if(q){ if(c === '"'){ if(text[i+1] === '"'){ cur += '"'; i++; } else q = false; } else cur += c; }
    else if(c === '"') q = true;
    else if(c === ","){ row.push(cur); cur = ""; }
    else if(c === "\n"){ row.push(cur); rows.push(row); row = []; cur = ""; }
    else if(c !== "\r") cur += c;
  }
  if(cur !== "" || row.length){ row.push(cur); rows.push(row); }
  return rows.filter(r => r.length > 1 || String(r[0] || "").trim() !== "");
}
function read(){
  if(!fs.existsSync(FILE)) return [];
  const rows = parseCsv(fs.readFileSync(FILE, "utf8"));
  if(!rows.length) return [];
  const h = rows[0].map(x => String(x).trim());
  return rows.slice(1).map(function(r){
    const o = {}; h.forEach(function(k, i){ o[k] = r[i] === undefined ? "" : r[i]; });
    return o;
  });
}
function write(rows){
  fs.mkdirSync(DIR, { recursive:true });
  fs.writeFileSync(FILE,
    HEAD.map(csvCell).join(",") + "\n" +
    rows.map(r => HEAD.map(k => csvCell(r[k])).join(",")).join("\n") +
    (rows.length ? "\n" : ""), "utf8");
}

/* 이름 고르기 — ⚠️⚠️ **`js/data/courses.js` 와 같은 규칙이어야** 합니다.
   SQL 의 `course_norm()` 이 참이고(0066 · generated 칸), 여기서는 겹침을
   **미리** 잡기만 합니다. 두 식이 달라도 DB 가 다시 봅니다. */
function norm(s){
  return String(s || "").toLowerCase()
    .replace(/컨트리클럽|컨트리 클럽/g, "cc")
    .replace(/골프클럽|골프 클럽/g, "gc")
    .replace(/[\s·.()\-_]/g, "");
}
/* 두 글자 묶음이 얼마나 겹치나 — ⚠️ **합치지 않습니다**. 후보만 냅니다
   (같은 이름만으로 합치면 다른 골프장이 하나가 됩니다 · 2026-11-07). */
function near(a, b){
  const A = norm(a), B = norm(b);
  if(!A || !B) return 0;
  if(A === B) return 1;
  const g = s => { const o = {}; for(let i = 0; i < s.length - 1; i++) o[s.slice(i, i+2)] = 1; return o; };
  const ga = g(A), gb = g(B);
  const ka = Object.keys(ga), kb = Object.keys(gb);
  if(!ka.length || !kb.length) return 0;
  let hit = 0; ka.forEach(k => { if(gb[k]) hit++; });
  return (2 * hit) / (ka.length + kb.length);
}

function regionKeys(){
  /* ⚠️⚠️ **지역 키를 여기 적지 않습니다** — `js/data/regions.js` 한 곳에서
     읽습니다 (두 곳에 적으면 지역을 더하는 날 어긋납니다). */
  const W = { window:{} };
  const src = fs.readFileSync(path.join(ROOT, "js", "data", "regions.js"), "utf8");
  const sandbox = { window: W.window };
  try{ new Function("window", src)(sandbox.window); }catch(e){
    console.error("❌ regions.js 를 읽지 못했습니다 — " + e.message);
    process.exit(1);
  }
  const L = sandbox.window.AM_REGIONS || [];
  if(!L.length){ console.error("❌ 지역 목록이 0개입니다 (regions.js 를 보세요)"); process.exit(1); }
  return L.map(r => r.key);
}

function arg(k){
  const i = process.argv.indexOf("--" + k);
  return (i > 0 && process.argv[i+1] && process.argv[i+1].indexOf("--") !== 0)
    ? String(process.argv[i+1]) : "";
}
function has(k){ return process.argv.indexOf("--" + k) > 0; }

/* ── 한 줄을 봅니다 (더할 때도 · --check 에서도 같은 함수) ──────────── */
function judge(r, others, REG){
  const bad = [];
  const name = String(r.name || "").trim();
  if(name.length < 2 || name.length > 80) bad.push("이름은 2~80자입니다");
  if(["golf","range"].indexOf(String(r.kind)) < 0) bad.push("kind 는 golf · range 둘뿐입니다");
  if(REG.indexOf(String(r.region)) < 0)
    bad.push("region 이 regions.js 에 없는 키입니다 — " + r.region);
  if(!String(r.addr || r.addr_road || "").trim())
    bad.push("주소가 없습니다 (공식 자료에 적힌 그대로 넣으세요)");
  if(["open","closed"].indexOf(String(r.state)) < 0)
    bad.push("state 는 open · closed 둘뿐입니다 (모르면 넣지 마세요)");
  /* ⚠️⚠️⚠️ **출처와 확인 날짜가 없으면 거절**합니다 */
  if(!/^https:\/\/[^\s"<>]+$/.test(String(r.source_url || "")))
    bad.push("--source 가 https:// 로 시작하는 주소여야 합니다");
  const ck = String(r.checked_at || "");
  if(!/^\d{4}-\d{2}-\d{2}$/.test(ck)) bad.push("--checked 는 YYYY-MM-DD 입니다");
  else{
    /* ⚠️ 한국 날짜로 봅니다 (UTC 로 보면 새벽에 하루 밀립니다) */
    const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
    if(ck > today) bad.push("확인 날짜가 앞날입니다 — " + ck + " (오늘 " + today + ")");
  }
  if(String(r.site_url || "") && !/^https?:\/\/[^\s"<>]+$/.test(String(r.site_url)))
    bad.push("--site 는 http(s):// 로 시작해야 합니다");
  if(String(r.holes || "") && !/^\d{1,2}$/.test(String(r.holes)))
    bad.push("--holes 는 숫자입니다");
  /* ⚠️⚠️⚠️ **좌표는 조용히 버리지 않고 거절합니다** — 처음에는 `lat:""` 로
     박아 두어 `--lat` 을 **아무 말 없이 버렸고**, 이 가드는 한 번도 걸릴 수
     없는 죽은 코드였습니다(되돌려 보기가 잡았습니다). 조용히 버리면 넣으신
     분은 "좌표까지 넣었다" 고 알고 계십니다. */
  if(String(r._lat || "") || String(r._lng || ""))
    bad.push("좌표는 받지 않습니다 — 공공 자료의 좌표계가 섞여 있어 확인 전에는 비웁니다(0066). 지도는 주소로 엽니다");
  /* ⚠️⚠️ 저희가 맺은 것이 없는 말 */
  HEAD.forEach(function(k){
    const v = String(r[k] || "");
    BAN.forEach(function(w){
      if(v.indexOf(w) >= 0) bad.push("「" + w + "」 는 적을 수 없습니다 (" + k + ")");
    });
  });
  /* ⚠️⚠️ 같은 이름 · 같은 지역은 거절 · 비슷한 것은 후보로만 */
  const dupes = [], maybes = [];
  others.forEach(function(o){
    const s = near(o.name, name);
    if(s === 1 && String(o.region) === String(r.region)) dupes.push(o.name);
    else if(s >= 0.6) maybes.push(o.name + " (" + Math.round(s * 100) + "%)");
  });
  if(dupes.length) bad.push("이미 있습니다 — " + dupes.join(" · "));
  return { bad: bad, maybes: maybes };
}

(function(){
  const REG = regionKeys();
  const rows = read();

  if(has("list") || process.argv.length <= 2){
    const n = { golf:0, range:0 };
    rows.forEach(r => { n[r.kind] = (n[r.kind] || 0) + 1; });
    const byReg = {};
    rows.forEach(r => { byReg[r.region] = (byReg[r.region] || 0) + 1; });
    console.log("검토 묶음: " + FILE);
    console.log("  골프장 " + (n.golf || 0) + "곳 · 연습장 " + (n.range || 0) + "곳");
    Object.keys(byReg).sort().forEach(k => console.log("    " + k + " " + byReg[k]));
    if(!rows.length){
      console.log("\n⚠️ 0줄입니다 — **지어내서 채우지 않습니다.**");
      console.log("   공식 · 공공 출처에서 확인한 줄만 `--source` · `--checked` 와");
      console.log("   함께 더하세요. 쓰는 법은 이 파일 머리말에 있습니다.");
    }
    return;
  }

  if(has("check")){
    let bad = 0;
    rows.forEach(function(r, i){
      const others = rows.filter((_, j) => j !== i);
      const v = judge(r, others, REG);
      if(v.bad.length){ bad++; console.log("❌ " + r.name); v.bad.forEach(b => console.log("   " + b)); }
    });
    console.log((bad ? "❌ " : "✅ ") + rows.length + "줄 가운데 " + bad + "줄이 어긋납니다");
    process.exit(bad ? 1 : 0);
  }

  const r = {
    source_id: arg("source-id") || "manual-review",
    src_key:   "",
    kind:      arg("kind") || "golf",
    name:      arg("name"),
    name_norm: norm(arg("name")),
    region:    arg("region"),
    gu:        arg("gu"),
    addr:      arg("addr"),
    addr_road: arg("addr-road"),
    tel:       arg("tel"),
    holes:     arg("holes"),
    biz_kind:  arg("biz"),
    lat:"", lng:"",
    /* ⚠️ 받기는 하고 **거절하려고** 들고 있습니다 (위 가드) — 묶음에는
       `lat` · `lng` 빈 칸으로만 들어갑니다. */
    _lat: arg("lat"), _lng: arg("lng"),
    state:     arg("state") || "open",
    status_raw: arg("status-raw"),
    as_of:     arg("as-of") || arg("checked"),
    site_url:  arg("site"),
    source_url: arg("source"),
    checked_at: arg("checked")
  };
  const v = judge(r, rows, REG);
  if(v.maybes.length){
    console.log("⚠️ 비슷한 이름이 있습니다 — **합치지 않았습니다.** 사람이 보세요:");
    v.maybes.forEach(m => console.log("   " + m));
  }
  if(v.bad.length){
    console.error("❌ 더하지 않았습니다 —");
    v.bad.forEach(b => console.error("   " + b));
    process.exit(1);
  }
  rows.push(r);
  write(rows);
  console.log("✅ 더했습니다 — " + r.name + " (" + r.region + ")  지금 " + rows.length + "줄");
  console.log("   다음: node tools/make-import-sql.js");
})();
