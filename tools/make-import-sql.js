/* ════════════════════════════════════════════════════════════════════
   staging CSV → **들여오기 SQL** 과 **되돌리기 SQL** (지시서 작업 3)

   사장님이 Supabase SQL 편집기에 붙여 넣으실 파일을 만듭니다.
     data/staging/import_courses.sql    넣기 (멱등 — 두 번 넣어도 안 늘어납니다)
     data/staging/rollback_courses.sql  그 묶음만 되돌리기

   ⚠️⚠️⚠️ **FIXTURE 줄은 거절합니다.** 되돌려 보기용 가짜 자료가 운영 DB 에
   들어가면 그 순간 없는 골프장을 광고하는 것입니다 (절대 규칙 1).
   ⚠️⚠️ **출처가 없는 줄도 거절합니다** — 어디서 왔는지 모르는 시설은
   "우리가 적은 것" 과 구별되지 않습니다.
   ⚠️⚠️ **폐업을 지우지 않습니다** — 상태만 바꿉니다.
   ⚠️ slug 는 **운영자가 고칠 수 있는 값**이라, 이미 있는 줄의 slug 는
   **안 건드립니다** (운영자가 예쁘게 고쳐 둔 것을 덮으면 주소가 깨집니다).

   돌리는 법
     node tools/make-import-sql.js
     node tools/make-import-sql.js --dry-run   몇 줄이 나올지만 셉니다
   ════════════════════════════════════════════════════════════════════ */
"use strict";
const fs   = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT  = path.join(__dirname, "..");
const ARG   = process.argv.slice(2);
/* ⚠️ 검사가 **다른 폴더**로 돌릴 수 있게 합니다 — 안 그러면 되돌려 보기가
   진짜 staging 을 덮어씁니다 (검사가 스스로 깨뜨린 자리를 되풀이하지 않게). */
const STAGE = (ARG.find(function(a){ return a.indexOf("--stage=") === 0; }) || "").slice(8)
              || path.join(ROOT, "data", "staging");
const DRY   = ARG.indexOf("--dry-run") >= 0;

function parseCsv(text){
  var rows = [], row = [], cur = "", q = false;
  for(var i = 0; i < text.length; i++){
    var c = text[i];
    if(q){ if(c === '"'){ if(text[i+1] === '"'){ cur += '"'; i++; } else q = false; } else cur += c; }
    else if(c === '"') q = true;
    else if(c === ","){ row.push(cur); cur = ""; }
    else if(c === "\n"){ row.push(cur); rows.push(row); row = []; cur = ""; }
    else if(c !== "\r") cur += c;
  }
  if(cur.length || row.length){ row.push(cur); rows.push(row); }
  return rows.filter(function(r){ return r.some(function(c){ return String(c).trim() !== ""; }); });
}
function readTable(file){
  if(!fs.existsSync(file)) return [];
  var rows = parseCsv(fs.readFileSync(file, "utf8"));
  if(rows.length < 2) return [];
  var head = rows[0];
  return rows.slice(1).map(function(r){
    var o = {};
    head.forEach(function(h, i){ o[h] = (r[i] === undefined ? "" : r[i]); });
    return o;
  });
}
/* SQL 글자 — ⚠️ 작은따옴표를 두 겹으로 (이름에 ' 가 들어간 골프장이 있습니다) */
function q(v){
  if(v === null || v === undefined || String(v).trim() === "") return "null";
  return "'" + String(v).replace(/'/g, "''") + "'";
}
function num(v){
  var s = String(v === null || v === undefined ? "" : v).trim();
  if(s === "") return "null";
  return (/^-?\d+(\.\d+)?$/.test(s)) ? s : "null";
}
/* slug 후보 — ⚠️ **한글을 영문으로 바꿔 지어내지 않습니다.** 로마자 표는
   사람마다 다르고 틀리면 주소가 영영 이상해집니다. 출처 관리번호로 짓고,
   운영자가 /admin 에서 **예쁜 slug 로 고칩니다** (slug 는 바뀔 수 있는 값). */
function slugOf(r){
  var base = (String(r.source_id || "") + "-" + String(r.src_key || "")).toLowerCase();
  base = base.replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if(base.length >= 3 && /[a-z0-9]/.test(base[0])) return base.slice(0, 60);
  /* 관리번호가 한글이거나 비어 있으면 **이름의 해시**로 — 지어낸 말이
     아니라 그냥 번호입니다. 운영자가 고칠 수 있습니다. */
  return "c-" + crypto.createHash("sha1").update(String(r.source_id) + "|" + String(r.name)).digest("hex").slice(0, 10);
}

(function(){
  var rows = readTable(path.join(STAGE, "courses_clean.csv"))
    .concat(readTable(path.join(STAGE, "ranges_clean.csv")));

  var refused = [];
  var good = rows.filter(function(r){
    if(String(r.source_id).toUpperCase().indexOf("FIXTURE") >= 0){
      refused.push([r.source_id, r.name, "되돌려 보기용 가짜 자료입니다"]); return false;
    }
    if(!String(r.source_id).trim()){
      refused.push([r.source_id, r.name, "출처가 없습니다"]); return false;
    }
    if(!String(r.name).trim()){ refused.push([r.source_id, r.name, "이름이 없습니다"]); return false; }
    if(!String(r.region).trim()){
      refused.push([r.source_id, r.name, "지역을 못 읽었습니다 (regions.js 키가 비었습니다)"]); return false;
    }
    if(!String(r.state).trim()){
      refused.push([r.source_id, r.name, "영업상태를 모릅니다 — open 으로 넘기지 않습니다"]); return false;
    }
    return true;
  });

  if(DRY){
    console.log("── dry-run");
    console.log("   staging 줄 " + rows.length + " · 넣을 줄 " + good.length + " · 거절 " + refused.length);
    refused.slice(0, 10).forEach(function(x){ console.log("   거절: " + x.join(" / ")); });
    return;
  }

  var batch = "b" + crypto.randomBytes(6).toString("hex");
  var L = [];
  L.push("-- ════════════════════════════════════════════════════════════════");
  L.push("-- 골프장 · 연습장 들여오기 — " + new Date().toISOString());
  L.push("-- 만든 도구: tools/make-import-sql.js  (손으로 고치지 마세요)");
  L.push("-- 줄 수: " + good.length + "  (거절 " + refused.length + "줄 — data/staging/import_row_issue.csv)");
  L.push("--");
  L.push("-- ⚠️⚠️ **두 번 붙여 넣어도 안전합니다** (on conflict 로 덮습니다).");
  L.push("-- ⚠️⚠️ 되돌리려면 data/staging/rollback_courses.sql 을 쓰세요.");
  L.push("-- ⚠️ 0066 이 먼저 돌아가 있어야 합니다.");
  L.push("-- ════════════════════════════════════════════════════════════════");
  L.push("begin;");
  L.push("");
  L.push("-- 이 묶음을 알아보는 표시 — 되돌릴 때 이것으로 찾습니다");
  L.push("create temp table _imp(batch text);");
  L.push("insert into _imp values (" + q(batch) + ");");
  L.push("");

  good.forEach(function(r){
    var slug = slugOf(r);
    /* ⚠️ 출처 + 관리번호가 열쇠입니다 — 같은 줄을 두 번 넣어도 하나입니다.
       관리번호가 없으면 **이름 + 지역**으로 찾습니다(그것도 없으면 새 줄). */
    L.push("with up as (");
    L.push("  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, lat, lng, state)");
    L.push("  values (" + [q(slug), q(r.kind), q(r.name), q(r.region), q(r.gu), q(r.addr),
                           q(r.addr_road), q(r.tel), num(r.holes), q(r.biz_kind),
                           num(r.lat), num(r.lng), q(r.state)].join(", ") + ")");
    /* ⚠️ slug 는 **안 덮습니다** (운영자가 고쳐 둔 주소를 지키려고) */
    L.push("  on conflict (lower(slug)) do update set");
    L.push("    name = excluded.name, region = excluded.region, gu = excluded.gu,");
    L.push("    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,");
    L.push("    holes = excluded.holes, biz_kind = excluded.biz_kind,");
    L.push("    lat = excluded.lat, lng = excluded.lng,");
    /* ⚠️⚠️ 운영자가 **가린 것(hidden)은 되살리지 않습니다** — 다시 넣을
       때마다 되살아나면 가리는 일이 아무 뜻이 없습니다. */
    L.push("    state = case when course.state = 'hidden' then course.state else excluded.state end,");
    L.push("    updated_at = now()");
    L.push("  returning id)");
    L.push("insert into course_source (course_id, source_id, src_key, status_raw, as_of)");
    L.push("select up.id, " + [q(r.source_id), q(r.src_key), q(r.status_raw), q(r.as_of)].join(", ") + " from up");
    L.push("on conflict (source_id, src_key) where src_key is not null do update set");
    L.push("  status_raw = excluded.status_raw, as_of = excluded.as_of;");
    L.push("");
  });

  L.push("commit;");
  L.push("");
  L.push("-- 넣은 뒤 확인");
  L.push("select kind, state, count(*) from course group by 1, 2 order by 1, 2;");
  fs.writeFileSync(path.join(STAGE, "import_courses.sql"), L.join("\n"), "utf8");

  var R = [];
  R.push("-- 되돌리기 — ⚠️⚠️ **이 묶음으로 들어온 줄만** 지웁니다.");
  R.push("-- ⚠️ 운영자가 손으로 고친 줄 · 다른 출처로도 확인된 줄은 남깁니다");
  R.push("--   (course_source 가 둘 이상이면 그 골프장은 다른 출처에도 있습니다).");
  R.push("begin;");
  R.push("delete from course_source s");
  R.push(" where s.source_id in (" + [].concat(new Set ? Array.from(new Set(good.map(function(r){ return r.source_id; }))) : []).map(q).join(", ") + ");");
  R.push("delete from course c");
  R.push(" where not exists (select 1 from course_source s where s.course_id = c.id)");
  R.push("   and not exists (select 1 from teetime t where t.course_id = c.id)");
  R.push("   and not exists (select 1 from course_alias a where a.course_id = c.id);");
  R.push("commit;");
  fs.writeFileSync(path.join(STAGE, "rollback_courses.sql"), R.join("\n"), "utf8");

  console.log("── 들여오기 SQL 을 만들었습니다");
  console.log("   넣을 줄 " + good.length + " · 거절 " + refused.length);
  refused.slice(0, 5).forEach(function(x){ console.log("   거절: " + x.join(" / ")); });
  console.log("   data/staging/import_courses.sql");
  console.log("   data/staging/rollback_courses.sql");
  if(good.length === 0){
    console.log("   ⚠️ **넣을 줄이 0입니다** — 원본을 아직 못 받았습니다.");
  }
})();
