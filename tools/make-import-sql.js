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
  /* ⚠️⚠️⚠️ **손으로 확인한 묶음도 같이 읽습니다** (2026-11-13) —
     이 세션은 공공데이터 포털로 못 나가므로(`blocked_sources.csv`)
     `fetch-courses` 가 받은 줄이 0건입니다. 실제 골프장을 올리는 길은
     `tools/add-course.js` 가 만드는 `data/review/courses_review.csv`
     하나이고, 그 줄도 **같은 아래 거름을 지납니다**(출처 · 이름 · 지역 ·
     상태가 없으면 거절). 두 길을 따로 거르면 한쪽만 느슨해집니다. */
  var REVIEW = (ARG.find(function(a){ return a.indexOf("--review=") === 0; }) || "").slice(9)
               || path.join(ROOT, "data", "review", "courses_review.csv");
  /* ⚠️⚠️ **시설 단위로 넣습니다** (2026-11-15) — 문체부 현황은 한 골프장이
     회원제 · 대중제로 두 번 등록돼 있으면 두 줄입니다. 정제 도구가 그것을
     courses_facility.csv 로 묶어 두었고(증거가 둘 이상일 때만), 여기서는
     **한 시설 = course 한 줄 + 출처 줄 여럿**(course_source)입니다.
     검토 대기(courses_hold.csv)는 **넣지 않습니다.**
     ⚠️ 그 파일이 없으면(검사 · 옛 꼴) 줄 하나를 시설 하나로 봅니다. */
  var clean = readTable(path.join(STAGE, "courses_clean.csv"));
  var facT  = readTable(path.join(STAGE, "courses_facility.csv"));
  var held  = readTable(path.join(STAGE, "courses_hold.csv"));
  function single(r){ r.members = [r]; return r; }
  var rows;
  if(facT.length){
    var byFac = {};
    clean.forEach(function(r){ if(r.fac_id) (byFac[r.fac_id] = byFac[r.fac_id] || []).push(r); });
    rows = facT.map(function(f){
      var m = byFac[f.fac_id] || [];
      /* 대표 줄을 맨 앞에 — 공개 보기는 **먼저 들어간 출처**를 출처로 냅니다 */
      m.sort(function(a, b){
        var pa = (a.source_id + ":" + a.src_key) === f.fac_id ? 0 : 1;
        var pb = (b.source_id + ":" + b.src_key) === f.fac_id ? 0 : 1;
        return pa - pb;
      });
      f.members = m;
      f.src_key = m.length ? m[0].src_key : "";
      f.status_raw = m.length ? m[0].status_raw : "";
      return f;
    });
  }else{
    rows = clean.map(single);
  }
  rows = rows.concat(readTable(path.join(STAGE, "ranges_clean.csv")).map(single))
             .concat(readTable(REVIEW).map(single));

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
    console.log("   시설 " + rows.length + " · 넣을 것 " + good.length + " · 거절 " + refused.length +
                " · 검토 대기(안 넣음) " + held.length + " · 출처 줄 " +
                good.reduce(function(n, r){ return n + r.members.length; }, 0));
    refused.slice(0, 10).forEach(function(x){ console.log("   거절: " + x.join(" / ")); });
    return;
  }

  /* ── 묶음(import_batch) — 출처마다 한 줄 ─────────────────────────────
     ⚠️⚠️⚠️ **이번에 넣은 줄을 정확히 집으려고** 출처 줄마다 batch_id 를
     답니다(2026-11-15 · 운영 반영 승인 조건 4). 되돌리기는 이 id 만 봅니다 —
     "출처 이름이 같은 줄 전부" 로 지우면 다음 번에 같은 출처로 들어온 줄 ·
     운영자가 손댄 줄까지 같이 지웁니다.
     ⚠️ id 는 **원본의 SHA256 에서 지어** 늘 같습니다 — 같은 원본으로 SQL 을
     다시 만들어도 같은 묶음이라, 두 번 붙여 넣어도 늘지 않습니다. */
  var man = {};
  readTable(path.join(STAGE, "source_manifest.csv")).forEach(function(m){
    if(m.what !== "file") return;
    if(!man[m.source_id] || String(m.retrieved_at) > String(man[m.source_id].retrieved_at)) man[m.source_id] = m;
  });
  function uuidOf(s){
    var h = crypto.createHash("sha256").update(s).digest("hex");
    return h.slice(0,8) + "-" + h.slice(8,12) + "-4" + h.slice(13,16) + "-a" + h.slice(17,20) + "-" + h.slice(20,32);
  }
  var bySrc = {};
  good.forEach(function(r){ r.members.forEach(function(m){ (bySrc[m.source_id] = bySrc[m.source_id] || []).push(m); }); });
  var batches = Object.keys(bySrc).sort().map(function(sid){
    var m = man[sid] || {};
    /* manifest 가 없는 출처(검사 · 손으로 확인한 묶음)는 그 줄들의 내용으로 지문을 짓습니다 */
    var sha = /^[0-9a-f]{64}$/.test(String(m.sha256 || "")) ? m.sha256
      : crypto.createHash("sha256").update(bySrc[sid].map(function(x){ return x.src_key + "|" + x.name; }).join("\n")).digest("hex");
    return { id: uuidOf(sid + "|" + sha), source_id: sid, sha: sha,
             file: path.basename(String(m.file || "")) || "(staging)",
             http: m.http_status || "", license: m.license || "", as_of: m.data_as_of || "",
             ok: bySrc[sid].length };
  });
  var BID = {}; batches.forEach(function(b){ BID[b.source_id] = b.id; });
  var BIDS = batches.map(function(b){ return q(b.id) + "::uuid"; }).join(", ");
  /* 검수 기록 — 홀 수를 비운 줄(군산CC 81홀) · 검토 대기로 뺀 시설 */
  var issues = readTable(path.join(STAGE, "import_row_issue.csv")).filter(function(i){ return BID[i.source_id]; });
  held.forEach(function(h){
    if(BID[h.source_id]) issues.push({ source_id:h.source_id, row_no:"", kind:"held",
      detail: h.name + " — " + h.hold_why });
  });

  var L = [];
  L.push("-- ════════════════════════════════════════════════════════════════");
  L.push("-- 골프장 들여오기 — " + new Date().toISOString());
  L.push("-- 만든 도구: tools/make-import-sql.js  (손으로 고치지 마세요)");
  L.push("-- 시설 수: " + good.length + "  (거절 " + refused.length + " · 검토 대기로 안 넣은 것 " + held.length + " — data/staging/courses_hold.csv)");
  L.push("-- 출처 줄 수: " + good.reduce(function(n, r){ return n + r.members.length; }, 0));
  L.push("-- 묶음: " + batches.map(function(b){ return b.source_id + "=" + b.id; }).join(" · "));
  L.push("--");
  L.push("-- ⚠️⚠️ **한 트랜잭션입니다** — 중간에 하나라도 실패하면 아무것도 안 들어갑니다.");
  L.push("-- ⚠️⚠️ **기존 줄을 고치지도 지우지도 않습니다** — 새 줄만 넣습니다(on conflict do nothing).");
  L.push("-- ⚠️⚠️ **먼저 겹침을 봅니다** — 이 묶음이 아닌 골프장과 주소(slug) · 출처 번호 ·");
  L.push("--      이름+지역이 겹치면 그 자리에서 멈춥니다(아무것도 안 들어갑니다).");
  L.push("-- ⚠️⚠️ **두 번 붙여 넣어도 안 늘어납니다** — 이 묶음의 줄은 건너뜁니다.");
  L.push("-- ⚠️ 되돌리기: data/staging/rollback_courses.sql");
  L.push("-- ════════════════════════════════════════════════════════════════");
  L.push("begin;");
  L.push("");
  /* ⚠️ 표 단위 일괄 넣기 — 줄마다 insert 를 쓰면 590KB 라 붙여 넣기가 버겁습니다.
     _f = 시설(골프장) · _s = 출처 줄. 대표 출처는 created_at 을 앞세워
     공개 보기(v_course_public 의 source_id = 가장 먼저 든 출처)가 늘 같은 것을 냅니다. */
  L.push("create temp table _f (slug text, kind text, name text, region text, gu text, addr text, addr_road text, tel text, holes int, biz_kind text, site_url text, lat numeric, lng numeric, state text) on commit drop;");
  L.push("create temp table _s (slug text, source_id text, src_key text, status_raw text, as_of date, batch_id uuid, prim boolean) on commit drop;");
  var fv = [], sv = [];
  good.forEach(function(r){
    r.slug = slugOf(r);
    fv.push("(" + [q(r.slug), q(r.kind), q(r.name), q(r.region), q(r.gu), q(r.addr), q(r.addr_road), q(r.tel),
                   num(r.holes), q(r.biz_kind), q(r.site_url), num(r.lat), num(r.lng), q(r.state)].join(",") + ")");
    r.members.forEach(function(m, k){
      sv.push("(" + [q(r.slug), q(m.source_id), q(m.src_key), q(m.status_raw), q(m.as_of) + "::date",
                     q(BID[m.source_id]) + "::uuid", k === 0 ? "true" : "false"].join(",") + ")");
    });
  });
  var vals = sv;
  for(var vi = 0; vi < fv.length; vi += 200){ L.push("insert into _f values"); L.push(fv.slice(vi, vi + 200).join(",\n") + ";"); }
  for(var vj = 0; vj < sv.length; vj += 200){ L.push("insert into _s values"); L.push(sv.slice(vj, vj + 200).join(",\n") + ";"); }
  L.push("");
  L.push("-- ① 겹침 검사 — 이 묶음이 아닌 것과 겹치면 멈춥니다");
  L.push("do $$");
  L.push("declare v text;");
  L.push("begin");
  L.push("  select string_agg(distinct c.slug || ' (' || c.name || ')', ', ') into v");
  L.push("    from course c join _f n on lower(c.slug) = lower(n.slug)");
  L.push("   where not exists (select 1 from course_source s where s.course_id = c.id and s.batch_id in (" + BIDS + "));");
  L.push("  if v is not null then raise exception '들여오기를 멈춥니다 — 이미 있는 골프장과 주소(slug)가 겹칩니다: %', v; end if;");
  L.push("  select string_agg(distinct s.source_id || ':' || s.src_key, ', ') into v");
  L.push("    from course_source s join _s n on n.source_id = s.source_id and n.src_key = s.src_key");
  L.push("   where (s.batch_id is null or s.batch_id not in (" + BIDS + "));");
  L.push("  if v is not null then raise exception '들여오기를 멈춥니다 — 다른 묶음에 이미 있는 출처 번호입니다: %', v; end if;");
  L.push("  select string_agg(distinct c.name || ' (' || c.region || ')', ', ') into v");
  L.push("    from course c join _f n on c.name_norm = course_norm(n.name) and c.region = n.region");
  L.push("   where not exists (select 1 from course_source s where s.course_id = c.id and s.batch_id in (" + BIDS + "));");
  L.push("  if v is not null then raise exception '들여오기를 멈춥니다 — 같은 이름 · 같은 지역의 골프장이 이미 있습니다(중복 의심): %', v; end if;");
  L.push("end $$;");
  L.push("");
  L.push("-- ② 묶음 기록 (출처 · 원본 지문 · 이용 조건 · 기준일)");
  batches.forEach(function(b){
    L.push("insert into import_batch (id, source_id, file_name, sha256, http_status, license, data_as_of, rows_raw, rows_ok, rows_skipped, note)");
    L.push("values (" + [q(b.id) + "::uuid", q(b.source_id), q(b.file), q(b.sha), num(b.http), q(b.license), (b.as_of ? q(b.as_of) + "::date" : "null"),
      num(b.ok), num(b.ok),
      num(issues.filter(function(i){ return i.source_id === b.source_id && i.kind === "held"; }).length),
      q("tools/make-import-sql.js")].join(", ") + ")");
    L.push("on conflict (id) do nothing;");
  });
  L.push("");
  L.push("-- ③ 골프장 — ⚠️ 이미 있으면(= 이 묶음이 넣은 줄 · ① 이 확인했습니다) 아무것도 안 고칩니다");
  L.push("insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)");
  L.push("select slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state from _f");
  L.push("on conflict (lower(slug)) do nothing;");
  L.push("-- ③-2 출처 줄 — 대표 출처가 먼저(created_at)");
  L.push("insert into course_source (course_id, source_id, src_key, status_raw, as_of, batch_id, created_at)");
  L.push("select c.id, s.source_id, s.src_key, s.status_raw, s.as_of, s.batch_id,");
  L.push("       case when s.prim then now() else now() + interval '1 second' end");
  L.push("  from _s s join course c on lower(c.slug) = lower(s.slug)");
  L.push("on conflict (source_id, src_key) where src_key is not null do nothing;");
  L.push("");
  L.push("-- ④ 검수 기록 — 비운 값 · 뺀 시설과 그 까닭 (처음 넣을 때만)");
  issues.forEach(function(i){
    L.push("insert into import_row_issue (batch_id, source_id, row_no, kind, detail)");
    L.push("select " + [q(BID[i.source_id]) + "::uuid", q(i.source_id), num(i.row_no), q(i.kind), q(i.detail + (i.payload ? " — " + i.payload : ""))].join(", "));
    L.push(" where not exists (select 1 from import_row_issue x where x.batch_id = " + q(BID[i.source_id]) + "::uuid" +
           " and x.kind = " + q(i.kind) + " and x.detail = " + q(i.detail + (i.payload ? " — " + i.payload : "")) + ");");
  });
  L.push("");
  L.push("commit;");
  L.push("");
  L.push("-- 넣은 뒤 확인 — 이 묶음의 골프장 · 출처 줄 수");
  L.push("select (select count(distinct course_id) from course_source where batch_id in (" + BIDS + ")) as courses,");
  L.push("       (select count(*) from course_source where batch_id in (" + BIDS + ")) as sources;");
  fs.writeFileSync(path.join(STAGE, "import_courses.sql"), L.join("\n"), "utf8");

  /* ── 되돌리기 ─────────────────────────────────────────────────────
     ⚠️⚠️⚠️ **이 묶음이 넣은 골프장만 · 아무도 손대지 않았을 때만** 지웁니다
     (2026-11-15 · 승인 조건 4). 하나라도 아래에 걸리면 **아무것도 안 지우고
     멈추며 그 목록을 말합니다** —
       · 다른 출처 줄이 이어졌다     · 티타임이 이어졌다
       · 별칭이 달렸다               · 운영자가 고쳤다(상태 · 사진 · 고친 시각)
     ⚠️ 손으로 만든 골프장(이 묶음의 출처 줄이 없는 곳)은 **처음부터 대상이
     아닙니다** — 전에는 「출처 줄이 하나도 없는 골프장」을 지워 그것까지
     지웠습니다. */
  var R = [];
  R.push("-- 되돌리기 — ⚠️⚠️ **이 묶음(batch_id)이 넣은 골프장만** 지웁니다.");
  R.push("-- 묶음: " + batches.map(function(b){ return b.source_id + "=" + b.id; }).join(" · "));
  R.push("-- ⚠️ 그 가운데 하나라도 다른 출처 · 티타임 · 별칭과 이어졌거나 운영자가 고쳤으면");
  R.push("--    **아무것도 안 지우고 멈춥니다**(에러 글에 목록이 나옵니다).");
  R.push("begin;");
  R.push("create temp table _rb on commit drop as");
  R.push("  select distinct course_id from course_source where batch_id in (" + BIDS + ");");
  R.push("do $$");
  R.push("declare v text; n int; t0 timestamptz;");
  R.push("begin");
  R.push("  select min(at) into t0 from import_batch where id in (" + BIDS + ");");
  R.push("  select count(*), string_agg(c.name || ' [' || c.slug || '] ' || w, '; ') into n, v from (");
  R.push("    select c.*, concat_ws(' · ',");
  R.push("      case when exists (select 1 from course_source s where s.course_id = c.id and (s.batch_id is null or s.batch_id not in (" + BIDS + "))) then '다른 출처 연결' end,");
  R.push("      case when exists (select 1 from teetime t where t.course_id = c.id) then '티타임 연결' end,");
  R.push("      case when exists (select 1 from course_alias a where a.course_id = c.id) then '별칭 연결' end,");
  R.push("      case when c.updated_at > t0 + interval '1 minute' or c.state_by is not null or c.photo is not null or c.state <> 'open'");
  R.push("           then '운영자 수정' end) as w");
  R.push("      from course c join _rb on _rb.course_id = c.id) c");
  R.push("   where c.w <> '';");
  R.push("  if n > 0 then raise exception '되돌리기를 멈춥니다 — 충돌 %건: %', n, v; end if;");
  R.push("end $$;");
  R.push("delete from course_source where batch_id in (" + BIDS + ");");
  R.push("delete from course c using _rb where c.id = _rb.course_id;");
  R.push("delete from import_batch where id in (" + BIDS + ");   -- 검수 기록(import_row_issue)은 cascade 로 같이 빠집니다");
  R.push("commit;");
  fs.writeFileSync(path.join(STAGE, "rollback_courses.sql"), R.join("\n"), "utf8");

  console.log("── 들여오기 SQL 을 만들었습니다");
  console.log("   넣을 시설 " + good.length + " · 출처 줄 " + vals.length + " · 거절 " + refused.length + " · 검토 대기(안 넣음) " + held.length);
  refused.slice(0, 5).forEach(function(x){ console.log("   거절: " + x.join(" / ")); });
  console.log("   묶음 " + batches.map(function(b){ return b.source_id + "=" + b.id; }).join(" · "));
  console.log("   data/staging/import_courses.sql");
  console.log("   data/staging/rollback_courses.sql");
  if(good.length === 0){
    console.log("   ⚠️ **넣을 줄이 0입니다** — 원본을 아직 못 받았습니다.");
  }
})();
