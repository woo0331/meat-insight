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
  name:     ["사업장명", "업소명", "영업소명칭", "시설명", "골프장명", "업체명", "명칭", "이름", "name"],
  /* 시도 · 시군구가 **주소와 따로** 오는 자료(문체부 현황) — 주소가
     「춘천시 …」 처럼 시도 없이 시작해 주소만으로는 지역을 못 읽습니다.
     ⚠️ 「지역」(옛 약칭)을 먼저 봅니다 — 현행 이름은 「전남광주통합특별시」
     처럼 우리 지역 열일곱과 안 맞는 꼴이 있습니다. */
  sido:     ["지역", "시도", "시도명", "행정구역_시도명(현행)"],
  sgg:      ["행정구역_시군구명", "시군구명", "시군구"],
  addr:     ["소재지전체주소", "지번주소", "소재지주소", "소재지", "주소"],
  addr_road:["도로명전체주소", "도로명주소", "소재지도로명주소", "도로명"],
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
/* 시군구 — 주소 앞머리의 시도 조각은 건너뛰고 **시 · 군 · 구로 끝나는
   첫 조각**을 씁니다. ⚠️ 전에는 둘째 조각을 그냥 썼는데, 시도 없이
   「춘천시 신동면 …」 으로 시작하는 주소에서는 「신동면」 이 나왔습니다. */
function guOf(addr){
  var p = normAddr(addr).split(" ");
  for(var i = 0; i < p.length && i < 3; i++){
    var t = p[i];
    if(/(특별시|광역시|특별자치시|특별자치도|도)$/.test(t) && i === 0 && t.length > 2) continue;
    if(REGIONS.some(function(r){ return r.name === t; }) && i === 0) continue;
    if(/(시|군|구)$/.test(t) && t.length >= 2) return t;
    return "";
  }
  return "";
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

function cleanOne(srcId, kind, head, body, issues, src){
  src = src || {};
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
    /* ⚠️⚠️ 영업상태 칸이 **아예 없는** 자료는 줄마다 짐작하지 않고
       출처가 스스로 밝힌 성격을 씁니다 — sources.json 의 listed_state ·
       listed_why(예: "운영 중 골프장 현황" 으로 공표된 목록). 그 성격을
       적어 두지 않은 출처는 지금처럼 "모름" 으로 남아 들여오지 않습니다. */
    var noStateCol = ix.status < 0 && ix.status2 < 0;
    var st = (noStateCol && src.listed_state)
      ? { state:src.listed_state, why:"" }
      : stateOf(at("status"), at("status2"));
    if(!st.state){
      issues.push({ source_id:srcId, row_no:rowNo, kind:"unknown_state", detail:st.why, payload:name });
    }
    var region = regionOf(addr) || regionOf(at("sido")) || regionOf(src.scope || "");
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

    /* 홀 수 — ⚠️ DB 는 1~72 만 받습니다(0066). 넘으면 **비우고 issue 로**
       (지어내 줄이지 않습니다). */
    var holes = intOrNull(at("holes"));
    if(holes !== null && (holes < 1 || holes > 72)){
      issues.push({ source_id:srcId, row_no:rowNo, kind:"holes_out_of_range",
        detail:"홀 수 " + holes + " — DB 가 받는 범위(1~72) 밖이라 비웁니다", payload:name });
      holes = null;
    }
    /* 열쇠 — ⚠️ 관리번호가 없는 자료(문체부 현황)는 **줄의 내용**으로
       짓습니다(이름 · 주소 · 홀 · 구분). 같은 줄을 다시 받으면 같은
       열쇠라 두 번 넣어도 하나이고, 출처가 내용을 고치면 새 줄이 됩니다
       (그 차이는 change_log 가 말합니다). */
    var key = at("src_key");
    if(!key){
      key = "h" + require("crypto").createHash("sha1")
        .update([srcId, name, addr, at("holes"), at("biz_kind")].join("|")).digest("hex").slice(0, 12);
    }
    out.push({
      source_id: srcId,
      src_key:   key,
      kind:      kind,
      name:      name,
      name_norm: normName(name),
      region:    region,
      gu:        at("sgg") || guOf(addr),
      addr:      normAddr(at("addr")),
      addr_road: normAddr(at("addr_road")),
      tel:       at("tel"),
      holes:     holes,
      biz_kind:  at("biz_kind"),
      lat:       lat,
      lng:       lng,
      state:     st.state,
      status_raw:(noStateCol && src.listed_state) ? (src.listed_why || "")
                 : (at("status") + (at("status2") ? " / " + at("status2") : "")).trim(),
      as_of:     at("as_of") || src.as_of || ""
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

/* ── 시설 단위로 묶기 ──────────────────────────────────────────
   (2026-11-15) 문체부 현황은 **등록 갈래마다 한 줄**입니다 — 한 골프장이
   회원제 18홀 · 대중제 9홀로 두 번 등록돼 있으면 두 줄입니다. 그대로
   들여오면 같은 골프장 카드가 둘 섭니다.
   ⚠️⚠️⚠️ **증거가 둘 이상일 때만 묶습니다** — 정규화한 이름이 같고
   **주소 글자까지 같을 때**(같은 출처 안이든 두 출처 사이든). 이름만
   같은 것은 묶지 않습니다:
     · 시군구가 **다르면** 같은 브랜드의 다른 지점입니다(플라자CC 용인 ·
       제주처럼) — 그대로 둘입니다.
     · 시군구가 **같은데 주소가 다르면** 사람이 봐야 합니다 — 둘 다
       **검토 대기**(hold)로 빼고 들여오지 않습니다.
   ⚠️ 두 출처 가운데 **이름도 주소도 안 맞는** 줄은 이름이 바뀌었을 수
   있으므로 역시 검토 대기입니다(더 최근 출처의 줄만 — 오래된 쪽 하나로
   카드가 둘 서지 않게). */
function addrKey(s){
  var p = normAddr(s).replace(/\([^)]*\)/g, " ").split(" ").filter(Boolean);
  while(p.length && (REGIONS.some(function(r){ return r.name === p[0]; }) ||
        /(특별시|광역시|특별자치시|특별자치도|^경기도|^충청북도|^충청남도|^전라남도|^경상북도|^경상남도|^전라북도|^강원도|^인천시)$/.test(p[0]))) p.shift();
  return p.join("").replace(/번지|일원/g, "");
}
var RANK = {};
function facilities(rows){
  var parent = rows.map(function(_, i){ return i; });
  function top(i){ while(parent[i] !== i){ parent[i] = parent[parent[i]]; i = parent[i]; } return i; }
  function join(a, b){ a = top(a); b = top(b); if(a !== b) parent[b] = a; }
  var why = {}, hold = {};
  function note(i, w){ (why[i] = why[i] || []).indexOf(w) < 0 && why[i].push(w); }

  var byNA = {};
  rows.forEach(function(r, i){
    [addrKey(r.addr), addrKey(r.addr_road)].filter(Boolean).forEach(function(ak){
      var k = r.kind + "|" + r.region + "|" + r.name_norm + "|" + ak;
      (byNA[k] = byNA[k] || []).push(i);
    });
  });
  Object.keys(byNA).forEach(function(k){
    var g = byNA[k];
    for(var j = 1; j < g.length; j++){
      join(g[0], g[j]);
      var cross = rows[g[0]].source_id !== rows[g[j]].source_id;
      [g[0], g[j]].forEach(function(i){
        note(i, cross ? "두 출처 · 같은 이름 · 같은 주소" : "같은 출처 · 같은 이름 · 같은 주소(등록 갈래가 둘)");
      });
    }
  });

  /* 두 출처가 **같은 이름 · 같은 시군구**를 각자 **하나씩만** 적었으면
     같은 곳으로 잇습니다 — 두 공식 출처가 따로 같은 말을 한 것입니다.
     ⚠️ 주소 글자는 다를 수 있습니다(출처의 오탈자 · 지번/도로명 차이) —
     그 사실을 addr_conflict 로 남기고 보고합니다(지우지 않습니다).
     ⚠️ 한 출처 안에 그 이름이 **둘 이상**이면 잇지 않습니다(어느 쪽인지
     모릅니다 — 아래에서 검토 대기로 갑니다). */
  var conflict = {};
  function city(r){ return String(r.gu || "").split(" ")[0]; }
  var byNC = {};
  rows.forEach(function(r, i){
    if(!city(r)) return;
    var k = r.kind + "|" + r.region + "|" + r.name_norm + "|" + city(r);
    var bySrc = (byNC[k] = byNC[k] || {});
    (bySrc[r.source_id] = bySrc[r.source_id] || []).push(i);
  });
  Object.keys(byNC).forEach(function(k){
    var bySrc = byNC[k], ss = Object.keys(bySrc);
    if(ss.length < 2) return;
    var one = ss.every(function(s){
      var t = bySrc[s].map(top);
      return t.every(function(x){ return x === t[0]; });
    });
    if(!one) return;
    var first = bySrc[ss[0]][0];
    ss.slice(1).forEach(function(s){
      var j = bySrc[s][0];
      if(top(first) === top(j)) return;
      join(first, j);
      conflict[top(first)] = 1;
      [first, j].forEach(function(i){ note(i, "두 출처 · 같은 이름 · 같은 시군구 (주소 글자는 서로 다름 — 확인 필요)"); });
    });
  });

  /* 이름은 같은데 묶이지 않은 것 — 시군구로 가릅니다 */
  var byName = {};
  rows.forEach(function(r, i){
    var k = r.kind + "|" + r.region + "|" + r.name_norm;
    (byName[k] = byName[k] || []).push(i);
  });
  Object.keys(byName).forEach(function(k){
    var g = byName[k];
    for(var a = 0; a < g.length; a++) for(var b = a + 1; b < g.length; b++){
      var x = g[a], y = g[b];
      if(top(x) === top(y)) continue;
      var gx = String(rows[x].gu || "").split(" ")[0], gy = String(rows[y].gu || "").split(" ")[0];
      if(gx && gx === gy){
        hold[top(x)] = hold[top(y)] = "같은 이름 · 같은 시군구인데 주소가 다릅니다 — 같은 곳인지 사람이 봅니다";
      }
    }
  });

  /* 두 출처 사이 — 더 최근 출처의 줄이 짝이 없으면 검토 대기 */
  var srcs = {}; rows.forEach(function(r){ srcs[r.source_id] = r.as_of || ""; });
  var ids = Object.keys(srcs);
  if(ids.length > 1){
    rows.forEach(function(r, i){
      var others = ids.filter(function(s){ return s !== r.source_id && srcs[s] < srcs[r.source_id]; });
      if(!others.length) return;
      var mates = rows.filter(function(o, j){ return top(j) === top(i) && o.source_id !== r.source_id; });
      var coverd = others.some(function(s){
        return rows.some(function(o){ return o.source_id === s && o.region === r.region; });
      });
      if(!mates.length && coverd){
        var sameAddr = rows.some(function(o){
          return o.source_id !== r.source_id && o.region === r.region &&
                 addrKey(o.addr || o.addr_road) && addrKey(o.addr || o.addr_road) === addrKey(r.addr || r.addr_road);
        });
        hold[top(i)] = sameAddr
          ? "주소는 다른 출처와 같은데 이름이 다릅니다 — 이름이 바뀌었는지 사람이 봅니다"
          : "더 최근 출처에만 있는 이름입니다 — 새로 생긴 곳인지 이름이 바뀐 곳인지 사람이 봅니다";
      }
    });
  }

  var groups = {};
  rows.forEach(function(r, i){ (groups[top(i)] = groups[top(i)] || []).push(i); });
  var facs = [];
  Object.keys(groups).forEach(function(t){
    var m = groups[t].map(function(i){ return rows[i]; });
    /* 대표 줄 — sources.json 의 rank 가 **가장 앞선 출처**의 첫 줄(문체부
       전국 「정비」 자료가 1 — 주소 · 이름을 한 꼴로 다듬은 자료입니다).
       rank 가 같으면 기준일이 최근인 쪽. */
    var prim = m.slice().sort(function(a, b){
      return (RANK[a.source_id] || 9) - (RANK[b.source_id] || 9) ||
             String(b.as_of).localeCompare(String(a.as_of));
    })[0];
    var same = m.filter(function(r){ return r.source_id === prim.source_id; });
    var holes = same.every(function(r){ return r.holes !== null && r.holes !== ""; })
      ? same.reduce(function(n, r){ return n + Number(r.holes); }, 0) : null;
    if(holes !== null && holes > 72) holes = null;
    var kinds = [];
    same.forEach(function(r){ if(r.biz_kind && kinds.indexOf(r.biz_kind) < 0) kinds.push(r.biz_kind); });
    var fid = prim.source_id + ":" + prim.src_key;
    m.forEach(function(r){ r.fac_id = fid; });
    facs.push({
      fac_id: fid, kind: prim.kind, name: prim.name, name_norm: prim.name_norm,
      region: prim.region, gu: prim.gu, addr: prim.addr, addr_road: prim.addr_road,
      tel: prim.tel, holes: holes, biz_kind: kinds.join(" · "),
      lat: prim.lat, lng: prim.lng, state: prim.state,
      source_id: prim.source_id, as_of: prim.as_of, members: m.length,
      sources: m.map(function(r){ return r.source_id; }).filter(function(v, i, a){ return a.indexOf(v) === i; }).join(" "),
      evidence: groups[t].reduce(function(acc, i){
        (why[i] || []).forEach(function(w){ if(acc.indexOf(w) < 0) acc.push(w); }); return acc; }, []).join(" · "),
      addr_conflict: conflict[t] ? "1" : "",
      /* ⚠️⚠️ 두 공식 출처의 주소가 **글자 그대로 같지 않으면** 이번 반영에서
         뺍니다(2026-11-15 · 운영 반영 승인 조건) — 어느 쪽이 맞는지 공식
         자료로 확인하기 전에는 한쪽 주소를 골라 싣지 않습니다. */
      hold: (hold[t] || conflict[t]) ? "1" : "",
      hold_why: hold[t] || (conflict[t] ? "두 공식 출처의 주소가 서로 다릅니다 — 공식 자료로 확인하기 전에는 넣지 않습니다" : "")
    });
  });
  facs.sort(function(a, b){ return (a.region + a.name).localeCompare(b.region + b.name, "ko"); });
  return facs;
}

/* ── 원본 파일 모으기 ─────────────────────────────────────────── */
function rawFiles(){
  var out = [];
  if(!fs.existsSync(RAW)) return out;
  fs.readdirSync(RAW).forEach(function(srcId){
    var d1 = path.join(RAW, srcId);
    if(!fs.statSync(d1).isDirectory()) return;
    /* ⚠️ **가장 최근에 받은 것 하나만** 읽습니다 — 날마다 다시 받으면
       폴더가 쌓이는데, 다 읽으면 같은 골프장이 받은 횟수만큼 늘어납니다. */
    var stamps = fs.readdirSync(d1).filter(function(d){
      return fs.statSync(path.join(d1, d)).isDirectory();
    }).sort();
    stamps.slice(-1).forEach(function(stampDir){
      var d2 = path.join(d1, stampDir);
      if(!fs.statSync(d2).isDirectory()) return;
      fs.readdirSync(d2).forEach(function(f){
        if(/\.csv$/i.test(f)) out.push({ srcId:srcId, file:path.join(d2, f), stamp:stampDir });
      });
    });
  });
  return out;
}

(function(){
  fs.mkdirSync(STAGE, { recursive:true });
  var cfg  = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "sources.json"), "utf8"));
  var kindOf = {}, srcOf = {};
  cfg.sources.forEach(function(s){ kindOf[s.id] = s.kind; srcOf[s.id] = s; RANK[s.id] = s.rank || 9; });
  /* 자료 기준일 · 이용 조건 — 받는 도구가 manifest 에 적어 둔 것(포털 메타) */
  var asOf = {}, licOf = {};
  var MAN = path.join(STAGE, "source_manifest.csv");
  if(fs.existsSync(MAN)){
    var mr = parseCsv(fs.readFileSync(MAN, "utf8"));
    var mh = mr[0] || [];
    mr.slice(1).forEach(function(r){
      var o = {}; mh.forEach(function(h, i){ o[h] = r[i]; });
      if(o.data_as_of) asOf[o.source_id] = o.data_as_of;
      if(o.license)    licOf[o.source_id] = o.license;
    });
  }

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
    var src = Object.assign({}, srcOf[f.srcId] || {}, { as_of: asOf[f.srcId] || "" });
    all = all.concat(cleanOne(f.srcId, kind, rows[0], rows.slice(1), issues, src));
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

  var facs = facilities(courses);
  HEAD = HEAD.concat(["fac_id"]);
  writeCsv(path.join(STAGE, "courses_clean.csv"), HEAD, courses);
  /* ⚠️ 들여오기는 **이 파일**을 읽습니다 — 한 시설에 한 줄 · 검토 대기는
     따로(courses_hold.csv). 줄 단위(courses_clean.csv)는 원본과 맞춰 보는
     자리이고, 시설 단위가 손님 화면에 서는 자리입니다. */
  var FHEAD = ["fac_id","kind","name","name_norm","region","gu","addr","addr_road","tel",
               "holes","biz_kind","lat","lng","state","source_id","as_of","members","sources","evidence","addr_conflict","hold","hold_why"];
  /* ── 바뀐 것 — 지난번 정제와 견줘 **더해진 · 빠진 · 바뀐** 시설을
     change_log.csv 에 덧붙입니다(지우지 않고 쌓습니다). 같은 원본으로 다시
     돌리면 0건입니다 — 그래서 "두 번 돌려도 안 늘어난다" 를 눈으로도
     확인할 수 있습니다. */
  var FFILE = path.join(STAGE, "courses_facility.csv");
  var HFILE = path.join(STAGE, "courses_hold.csv");
  function readFac(f){
    if(!fs.existsSync(f)) return [];
    var t = parseCsv(fs.readFileSync(f, "utf8")); var h = t[0] || [];
    return t.slice(1).map(function(r){ var o = {}; h.forEach(function(k, i){ o[k] = r[i]; }); return o; });
  }
  var prev = {}; readFac(FFILE).concat(readFac(HFILE)).forEach(function(o){ prev[o.fac_id] = o; });
  var WATCH = ["name","region","gu","addr","addr_road","holes","biz_kind","state","hold"];
  var runAt = new Date().toISOString(), changes = [];
  facs.forEach(function(f){
    var o = prev[f.fac_id];
    if(!o){ changes.push({ at:runAt, change:"added", fac_id:f.fac_id, name:f.name, region:f.region, fields:"", hold:f.hold }); return; }
    var d = WATCH.filter(function(k){ return String(o[k] === undefined ? "" : o[k]) !== String(f[k] === null || f[k] === undefined ? "" : f[k]); });
    if(d.length) changes.push({ at:runAt, change:"changed", fac_id:f.fac_id, name:f.name, region:f.region,
      fields:d.map(function(k){ return k + ": " + (o[k] || "") + " → " + (f[k] === null ? "" : f[k]); }).join(" | "), hold:f.hold });
    delete prev[f.fac_id];
  });
  Object.keys(prev).forEach(function(k){
    changes.push({ at:runAt, change:"removed", fac_id:k, name:prev[k].name, region:prev[k].region, fields:"", hold:prev[k].hold });
  });
  var CL = path.join(STAGE, "change_log.csv"), CH = ["at","change","fac_id","name","region","fields","hold"];
  if(!fs.existsSync(CL)) fs.writeFileSync(CL, CH.join(",") + "\n", "utf8");
  changes.forEach(function(c){ fs.appendFileSync(CL, CH.map(function(h){ return csvCell(c[h]); }).join(",") + "\n", "utf8"); });

  writeCsv(FFILE, FHEAD, facs.filter(function(f){ return !f.hold; }));
  writeCsv(HFILE, FHEAD, facs.filter(function(f){ return f.hold; }));
  console.log("   바뀐 것 " + changes.length + " (더함 " + changes.filter(function(c){ return c.change === "added"; }).length +
              " · 바뀜 " + changes.filter(function(c){ return c.change === "changed"; }).length +
              " · 빠짐 " + changes.filter(function(c){ return c.change === "removed"; }).length + ") — data/staging/change_log.csv");
  writeCsv(path.join(STAGE, "ranges_clean.csv"),  HEAD, ranges);
  writeCsv(path.join(STAGE, "duplicate_review.csv"),
    ["evidence","a_source","a_key","a_name","a_addr","b_source","b_key","b_name","b_addr","decision"], dups);
  writeCsv(path.join(STAGE, "import_row_issue.csv"),
    ["source_id","row_no","kind","detail","payload"], issues);

  console.log("── 정제했습니다");
  console.log("   원본 파일 " + files.length + "개 · 읽은 줄 " + all.length);
  console.log("   골프장 " + courses.length + "줄 → 시설 " + facs.length +
              " (들여올 것 " + facs.filter(function(f){ return !f.hold; }).length +
              " · 검토 대기 " + facs.filter(function(f){ return f.hold; }).length + ") · 연습장 " + ranges.length);
  console.log("   중복 후보 " + dups.length + " (⚠️ 합치지 않았습니다 — 사람이 봅니다)");
  console.log("   issue " + issues.length);
  if(all.length === 0){
    console.log("   ⚠️ **읽은 줄이 0입니다** — 원본을 아직 못 받았습니다 (data/staging/blocked_sources.csv).");
  }
})();
