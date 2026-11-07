/* ════════════════════════════════════════════════════════════════════
   받은 원본을 **정제합니다** — 골프장 · 연습장 (데이터 지시서 작업 2)

   원본(data/raw/…)  →  staging CSV(data/staging/…)
     courses_clean.csv      골프장
     ranges_clean.csv       연습장
     duplicate_review.csv   **합치지 않고** 사람이 볼 중복 후보
     import_row_issue.csv   버린 줄 · 못 읽은 칸 · 보류한 좌표

   ⚠️⚠️⚠️ **같은 이름만으로 합치지 않습니다.** 관리번호 · 주소 · 좌표를
   모아 "후보" 만 만들고 판단은 사람이 합니다 (지시서 작업 2).
   ⚠️⚠️⚠️ **폐업 · 휴업을 지우지 않습니다.** 상태와 기준일을 그대로 둡니다 —
   지우면 "원래 없던 곳" 이 되어 나중에 되살릴 근거가 사라집니다.
   ⚠️⚠️⚠️ **좌표를 추측해 변환하지 않습니다.** 공공 인허가 자료의 좌표는
   EPSG:5174 · 2097 처럼 원본 좌표계가 섞여 있습니다. 좌표계를 확인하기
   전에는 **비워 두고** issue 에 적습니다 — 틀린 좌표로 지도에 찍으면
   손님을 엉뚱한 골프장으로 보냅니다 (지시서: 좌표 불명은 임의 표시 금지).
   ⚠️⚠️ **공란은 NULL 입니다.** 추정치를 넣지 않습니다 (절대 규칙 1).
   ⚠️⚠️ **칸 이름을 못 찾으면 그 출처를 건너뜁니다.** 원본을 본 적이
   없는 상태에서 칸을 짐작해 매기면 엉뚱한 값이 이름 자리에 들어갑니다.

   돌리는 법
     node tools/clean-courses.js           data/raw 를 정제합니다
     node tools/clean-courses.js --prove   가짜 자료로 규칙이 도는지 봅니다
                                           (⚠️ staging 에 안 씁니다)
   ════════════════════════════════════════════════════════════════════ */
"use strict";
const fs   = require("fs");
const path = require("path");

const ROOT  = path.join(__dirname, "..");
const RAW   = path.join(ROOT, "data", "raw");
const STAGE = path.join(ROOT, "data", "staging");
const PROVE = process.argv.indexOf("--prove") >= 0;

global.window = global.window || {};
require(path.join(ROOT, "js", "data", "regions.js"));
const REGIONS = global.window.AM_REGIONS || [];

/* ── 칸 이름 후보 ───────────────────────────────────────────────
   ⚠️ 이것은 **후보**입니다. 원본을 아직 못 봤으므로(바깥 길이 막혀 있습니다)
   맞는 이름이 하나도 없으면 **짐작하지 않고 그 출처를 건너뜁니다.** */
const COL = {
  src_key:  ["관리번호", "인허가번호", "개방서비스아이디", "번호", "id"],
  name:     ["사업장명", "업소명", "영업소명칭", "시설명", "골프장명", "업체명", "명칭", "name"],
  addr:     ["소재지전체주소", "지번주소", "소재지주소", "소재지", "주소"],
  addr_road:["도로명전체주소", "도로명주소", "도로명"],
  tel:      ["소재지전화", "전화번호", "연락처", "대표전화"],
  status:   ["영업상태명", "영업상태구분명", "상태", "영업상태"],
  status2:  ["상세영업상태명", "상세영업상태"],
  holes:    ["홀수", "홀", "홀수(홀)"],
  biz_kind: ["구분", "업태구분명", "종류", "시설구분"],
  lat:      ["위도", "WGS84위도", "y좌표(위도)"],
  lng:      ["경도", "WGS84경도", "x좌표(경도)"],
  x:        ["좌표정보(X)", "좌표정보(x)", "X좌표", "좌표정보x(epsg5174)"],
  y:        ["좌표정보(Y)", "좌표정보(y)", "Y좌표", "좌표정보y(epsg5174)"],
  as_of:    ["데이터기준일자", "기준일자", "최종수정시점", "인허가일자"]
};

/* ── CSV 읽기 (따옴표 · 줄바꿈 포함) ───────────────────────────── */
function parseCsv(text){
  var rows = [], row = [], cur = "", q = false;
  for(var i = 0; i < text.length; i++){
    var c = text[i];
    if(q){
      if(c === '"'){ if(text[i+1] === '"'){ cur += '"'; i++; } else q = false; }
      else cur += c;
    }else{
      if(c === '"') q = true;
      else if(c === ","){ row.push(cur); cur = ""; }
      else if(c === "\n"){ row.push(cur); rows.push(row); row = []; cur = ""; }
      else if(c !== "\r") cur += c;
    }
  }
  if(cur.length || row.length){ row.push(cur); rows.push(row); }
  return rows.filter(function(r){ return r.some(function(c){ return String(c).trim() !== ""; }); });
}
function csvCell(v){
  var s = (v === null || v === undefined) ? "" : String(v);
  return '"' + s.replace(/"/g, '""') + '"';
}
function writeCsv(file, head, rows){
  var out = head.map(csvCell).join(",") + "\n";
  rows.forEach(function(r){ out += head.map(function(h){ return csvCell(r[h]); }).join(",") + "\n"; });
  fs.writeFileSync(file, out, "utf8");
}

/* ── 정규화 ────────────────────────────────────────────────────
   ⚠️ 정규화한 이름은 **중복 후보를 찾는 열쇠**일 뿐입니다. 이것이 같다고
   같은 시설이 아닙니다 (체인점 · 같은 이름 다른 지역). */
/* ⚠️⚠️⚠️ **규칙은 DB 의 course_norm() 한 곳입니다.** 여기 것은 staging 의
   중복 후보를 찾을 때만 쓰고, 표에 들어간 뒤의 `name_norm` 은 DB 가
   generated 칸으로 **다시 셉니다**. 그래서 두 규칙은 **글자까지 같아야**
   합니다 — 처음에 JS 만 "골프연습장→연습장" 을 하고 SQL 은 안 해서,
   들여온 값과 트리거가 세는 값이 조용히 달라질 참이었습니다.
   ⚠️ 바꾸실 때는 `db/migrations/0066_course.sql` 의 course_norm() 과
   **같이** 바꾸세요 (tools/sql/course.js 가 둘을 맞춰 봅니다). */
function normName(s){
  return String(s || "")
    .replace(/\(주\)|\(유\)|\(재\)|\(사\)|주식회사|유한회사|재단법인|사단법인/g, "")
    .replace(/컨트리클럽|컨트리 클럽/g, "cc")
    .replace(/골프클럽|골프 클럽/g, "gc")
    .replace(/[\s·.,'"()\-_]/g, "")
    .toLowerCase();
}
function normAddr(s){
  return String(s || "").replace(/\s+/g, " ").trim();
}
/* 시도 → regions.js 의 key — ⚠️ 이름을 글자로 박지 않고 regions.js 에서
   끌어옵니다. 다만 공공 주소는 "특별자치도" 같은 긴 꼴이라 앞머리로 봅니다. */
function regionOf(addr){
  var a = normAddr(addr);
  if(!a) return "";
  for(var i = 0; i < REGIONS.length; i++){
    var r = REGIONS[i];
    if(a.indexOf(r.name) === 0) return r.key;
  }
  /* 긴 행정 이름 — 앞 두 글자로 다시 봅니다 (서울특별시 · 전북특별자치도 …) */
  var head2 = a.slice(0, 2);
  for(var j = 0; j < REGIONS.length; j++){
    if(REGIONS[j].name.slice(0, 2) === head2) return REGIONS[j].key;
  }
  return "";
}
function guOf(addr){
  var p = normAddr(addr).split(" ");
  return (p.length >= 2) ? p[1] : "";
}
/* 영업 상태 — ⚠️ **모르는 값을 open 으로 넘기지 않습니다** */
function stateOf(s1, s2){
  var s = (String(s1 || "") + " " + String(s2 || "")).trim();
  if(!s) return { state:"", why:"영업상태 칸이 비어 있습니다" };
  if(/폐업|말소|취소|직권취소/.test(s))  return { state:"closed", why:"" };
  if(/휴업/.test(s))                      return { state:"closed", why:"" };
  if(/영업|정상|운영/.test(s))            return { state:"open",   why:"" };
  return { state:"", why:"모르는 영업상태입니다 — " + s };
}
function intOrNull(v){
  var s = String(v === null || v === undefined ? "" : v).replace(/[^0-9]/g, "");
  return s ? parseInt(s, 10) : null;
}

/* 머리글에서 칸 자리를 찾습니다 — 못 찾으면 -1 */
function findCol(head, names){
  var norm = head.map(function(h){ return String(h).replace(/\s|﻿/g, "").toLowerCase(); });
  for(var i = 0; i < names.length; i++){
    var want = names[i].replace(/\s/g, "").toLowerCase();
    var at = norm.indexOf(want);
    if(at >= 0) return at;
  }
  return -1;
}

function cleanOne(srcId, kind, head, body, issues){
  var ix = {};
  Object.keys(COL).forEach(function(k){ ix[k] = findCol(head, COL[k]); });

  /* ⚠️ 이름을 못 찾으면 **그 파일을 통째로 건너뜁니다** — 짐작해서
     엉뚱한 칸을 이름으로 쓰면 그 자료 전부가 거짓이 됩니다. */
  if(ix.name < 0){
    issues.push({ source_id:srcId, row_no:0, kind:"no_name_column",
      detail:"이름으로 쓸 칸을 못 찾았습니다 — 머리글: " + head.join(" | ").slice(0, 300), payload:"" });
    return [];
  }

  var out = [];
  body.forEach(function(r, n){
    var rowNo = n + 2;
    function at(k){ return ix[k] >= 0 ? String(r[ix[k]] === undefined ? "" : r[ix[k]]).trim() : ""; }

    var name = at("name");
    if(!name){
      issues.push({ source_id:srcId, row_no:rowNo, kind:"empty_name", detail:"이름이 비어 있습니다", payload:r.join("|").slice(0,200) });
      return;
    }
    var addr  = at("addr") || at("addr_road");
    var st    = stateOf(at("status"), at("status2"));
    if(!st.state){
      issues.push({ source_id:srcId, row_no:rowNo, kind:"unknown_state", detail:st.why, payload:name });
    }
    var region = regionOf(addr);
    if(!region && addr){
      issues.push({ source_id:srcId, row_no:rowNo, kind:"region_unmatched", detail:"시도를 못 읽었습니다 — " + addr.slice(0,60), payload:name });
    }

    /* 좌표 — ⚠️⚠️ **원본 좌표계를 모르면 비웁니다.** 숫자가 크면
       (수십만 단위) 경위도가 아니라 투영 좌표이고, 변환표가 없으면
       옮길 수 없습니다. 추측해서 찍지 않습니다. */
    var lat = null, lng = null;
    var rawLat = at("lat"), rawLng = at("lng");
    if(rawLat && rawLng && Math.abs(parseFloat(rawLat)) <= 90 && Math.abs(parseFloat(rawLng)) <= 180){
      lat = parseFloat(rawLat); lng = parseFloat(rawLng);
    }else if(at("x") || at("y") || rawLat || rawLng){
      issues.push({ source_id:srcId, row_no:rowNo, kind:"coord_held",
        detail:"원본 좌표계를 확인하기 전에는 비워 둡니다 (EPSG:5174 · 2097 등)", payload:name });
    }

    out.push({
      source_id: srcId,
      src_key:   at("src_key"),
      kind:      kind,
      name:      name,
      name_norm: normName(name),
      region:    region,
      gu:        guOf(addr),
      addr:      normAddr(at("addr")),
      addr_road: normAddr(at("addr_road")),
      tel:       at("tel"),
      holes:     intOrNull(at("holes")),
      biz_kind:  at("biz_kind"),
      lat:       lat,
      lng:       lng,
      state:     st.state,
      status_raw:(at("status") + (at("status2") ? " / " + at("status2") : "")).trim(),
      as_of:     at("as_of")
    });
  });
  return out;
}

/* ── 중복 후보 ────────────────────────────────────────────────
   ⚠️⚠️ **자동으로 합치지 않습니다.** 증거를 적어 사람에게 넘깁니다. */
function dupCandidates(rows){
  var out = [], byKey = {}, byName = {};
  rows.forEach(function(r, i){
    if(r.src_key){
      var k = r.src_key;
      (byKey[k] = byKey[k] || []).push(i);
    }
    var nk = r.name_norm + "|" + r.gu;
    (byName[nk] = byName[nk] || []).push(i);
  });
  function pair(a, b, evidence){
    out.push({
      evidence: evidence,
      a_source: rows[a].source_id, a_key: rows[a].src_key, a_name: rows[a].name, a_addr: rows[a].addr,
      b_source: rows[b].source_id, b_key: rows[b].src_key, b_name: rows[b].name, b_addr: rows[b].addr,
      decision: ""
    });
  }
  Object.keys(byKey).forEach(function(k){
    var g = byKey[k];
    for(var i = 1; i < g.length; i++) pair(g[0], g[i], "같은 관리번호");
  });
  Object.keys(byName).forEach(function(k){
    var g = byName[k];
    if(k.indexOf("|") === 0) return;
    for(var i = 1; i < g.length; i++){
      var a = rows[g[0]], b = rows[g[i]];
      if(a.src_key && b.src_key && a.src_key === b.src_key) continue;
      var ev = ["정규화 이름 + 시군구가 같음"];
      if(a.addr && a.addr === b.addr) ev.push("지번주소가 같음");
      if(a.tel && a.tel === b.tel)    ev.push("전화가 같음");
      if(a.lat !== null && b.lat !== null){
        var d = Math.hypot((a.lat - b.lat) * 111000, (a.lng - b.lng) * 88000);
        if(d < 50) ev.push("좌표 50m 이내");
      }
      pair(g[0], g[i], ev.join(" · "));
    }
  });
  return out;
}

/* ── 원본 파일 모으기 ─────────────────────────────────────────── */
function rawFiles(){
  var out = [];
  if(!fs.existsSync(RAW)) return out;
  fs.readdirSync(RAW).forEach(function(srcId){
    var d1 = path.join(RAW, srcId);
    if(!fs.statSync(d1).isDirectory()) return;
    fs.readdirSync(d1).forEach(function(stampDir){
      var d2 = path.join(d1, stampDir);
      if(!fs.statSync(d2).isDirectory()) return;
      fs.readdirSync(d2).forEach(function(f){
        if(/\.csv$/i.test(f)) out.push({ srcId:srcId, file:path.join(d2, f) });
      });
    });
  });
  return out;
}

(function(){
  fs.mkdirSync(STAGE, { recursive:true });
  var cfg  = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "sources.json"), "utf8"));
  var kindOf = {};
  cfg.sources.forEach(function(s){ kindOf[s.id] = s.kind; });

  var files = PROVE
    ? [{ srcId:"FIXTURE", file:path.join(__dirname, "fixtures", "sample-permit.csv") }]
    : rawFiles();

  var issues = [], all = [];
  files.forEach(function(f){
    var text = fs.readFileSync(f.file, "utf8").replace(/^﻿/, "");
    var rows = parseCsv(text);
    if(rows.length < 2){
      issues.push({ source_id:f.srcId, row_no:0, kind:"empty_file", detail:path.basename(f.file), payload:"" });
      return;
    }
    var kind = PROVE ? "range" : (kindOf[f.srcId] || "golf");
    all = all.concat(cleanOne(f.srcId, kind, rows[0], rows.slice(1), issues));
  });

  var dups = dupCandidates(all);

  if(PROVE){
    /* ⚠️⚠️ **되돌려 보기입니다 — staging 에 한 줄도 안 씁니다.**
       가짜 시설이 진짜 자료 자리에 섞이면 그 순간 절대 규칙 1 입니다. */
    console.log("── --prove (가짜 자료 · staging 에 안 씁니다)");
    console.log("   읽은 줄 " + all.length + " · 중복 후보 " + dups.length + " · issue " + issues.length);
    var want = [
      ["이름 없는 줄을 버린다",      issues.some(function(i){ return i.kind === "empty_name"; })],
      ["모르는 상태를 open 으로 안 넘긴다",
        issues.some(function(i){ return i.kind === "unknown_state"; }) &&
        all.some(function(r){ return r.status_raw.indexOf("조건부") >= 0 && r.state === ""; })],
      ["폐업을 지우지 않고 closed 로 남긴다", all.some(function(r){ return r.state === "closed"; })],
      ["좌표계를 모르면 비우고 issue 로 남긴다", issues.some(function(i){ return i.kind === "coord_held"; }) && all.every(function(r){ return r.lat === null; })],
      ["이름이 비슷하면 **합치지 않고** 후보로 남긴다", dups.length > 0],
      ["시도를 regions.js 키로 읽는다", all.some(function(r){ return r.region === "seoul"; }) && all.some(function(r){ return r.region === "jeju"; })]
    ];
    var bad = 0;
    want.forEach(function(w){
      console.log((w[1] ? "  ✅ " : "  ❌ ") + w[0]);
      if(!w[1]) bad++;
    });
    if(dups.length) console.log("   후보 보기: " + dups[0].evidence + " — " + dups[0].a_name + " ↔ " + dups[0].b_name);
    console.log(bad === 0 ? "\n규칙 6개가 전부 돕니다." : "\n❌ " + bad + "개가 안 돕니다.");
    process.exit(bad === 0 ? 0 : 1);
  }

  var courses = all.filter(function(r){ return r.kind === "golf"; });
  var ranges  = all.filter(function(r){ return r.kind === "range"; });
  var HEAD = ["source_id","src_key","kind","name","name_norm","region","gu","addr","addr_road",
              "tel","holes","biz_kind","lat","lng","state","status_raw","as_of"];

  writeCsv(path.join(STAGE, "courses_clean.csv"), HEAD, courses);
  writeCsv(path.join(STAGE, "ranges_clean.csv"),  HEAD, ranges);
  writeCsv(path.join(STAGE, "duplicate_review.csv"),
    ["evidence","a_source","a_key","a_name","a_addr","b_source","b_key","b_name","b_addr","decision"], dups);
  writeCsv(path.join(STAGE, "import_row_issue.csv"),
    ["source_id","row_no","kind","detail","payload"], issues);

  console.log("── 정제했습니다");
  console.log("   원본 파일 " + files.length + "개 · 읽은 줄 " + all.length);
  console.log("   골프장 " + courses.length + " · 연습장 " + ranges.length);
  console.log("   중복 후보 " + dups.length + " (⚠️ 합치지 않았습니다 — 사람이 봅니다)");
  console.log("   issue " + issues.length);
  if(all.length === 0){
    console.log("   ⚠️ **읽은 줄이 0입니다** — 원본을 아직 못 받았습니다 (data/staging/blocked_sources.csv).");
  }
})();
