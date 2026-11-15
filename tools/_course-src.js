/* ════════════════════════════════════════════════════════════════════
   골프장 출처 안내 — data/sources.json + data/staging/source_manifest.csv
   → 화면이 쓰는 꼴 { <출처 id>: { name, page, license, as_of, got } }
   (2026-11-15)

   ⚠️⚠️ **출처 이름을 화면에 글자로 박지 않습니다** — 상세 화면이
   「출처 mcst-golf-nationwide」 처럼 **열쇠를 날것으로** 찍고 있었습니다.
   이름 · 원본 주소 · 이용 조건은 sources.json 한 곳, 자료 기준일 · 수집일은
   받는 도구가 manifest 에 적은 것입니다(두 곳에 다시 적지 않습니다).
   ⚠️ 받은 적이 없는 출처는 **안 냅니다**(수집일을 지어내지 않습니다).
   ════════════════════════════════════════════════════════════════════ */
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");

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
  return rows.filter(function(r){ return r.some(function(x){ return String(x).trim() !== ""; }); });
}

module.exports = function courseSources(){
  var out = {};
  var cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "sources.json"), "utf8"));
  var man = path.join(ROOT, "data", "staging", "source_manifest.csv");
  var got = {};
  if(fs.existsSync(man)){
    var t = parseCsv(fs.readFileSync(man, "utf8")), h = t[0] || [];
    t.slice(1).forEach(function(r){
      var o = {}; h.forEach(function(k, i){ o[k] = r[i]; });
      if(o.what !== "file") return;
      var g = got[o.source_id];
      if(!g || String(o.retrieved_at) > String(g.retrieved_at)) got[o.source_id] = o;
    });
  }
  cfg.sources.forEach(function(s){
    var g = got[s.id];
    if(!g) return;
    out[s.id] = {
      name:    s.name,
      page:    /^https:\/\//.test(String(s.page || "")) ? s.page : "",
      license: g.license || "",
      as_of:   g.data_as_of || "",
      got:     String(g.retrieved_at || "").slice(0, 10)
    };
  });
  return out;
};
