#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   저장소 안 링크가 실제로 열리는지 — 빌드에서 멈춥니다

   재는 것
     ① 찍힌 화면의 모든 href 가 **파일로 존재하는가**
     ② 그 주소가 vercel.json 규칙에 **잡아먹히지 않는가** (410 함정)
     ③ 찍었는데 아무도 안 거는 화면이 있는가 (외톨이)

   ⚠️ 바깥 주소(http · mailto · tel)와 닻(#)은 건너뜁니다.
   ⚠️⚠️ **링크 검사가 통과해도 거르개가 도는지는 모릅니다.** 앞
   서비스에서 화면이 ?m=apple 을 보내고 받는 쪽은 mk 를 읽어서
   **아무것도 안 걸렀는데** 링크 검사도 흐름 검사도 통과했습니다.
   눌러 봐야 압니다.

   돌리기   node tools/check-links.js
            node tools/check-links.js --prove
   ════════════════════════════════════════════════════════════════════ */
var fs = require("fs"), path = require("path");
var ROOT = path.join(__dirname, "..");
var routeGuard = require("./check-routes.js");

function pageFile(route){
  return path.join(ROOT, route === "/" ? "index.html" : route.replace(/^\//, "") + "/index.html");
}
function exists(route){
  var r = route.split("?")[0].split("#")[0];
  if(r !== "/" && r.slice(-1) === "/") r = r.slice(0, -1);
  if(fs.existsSync(pageFile(r))) return true;
  if(fs.existsSync(path.join(ROOT, r.replace(/^\//, "")))) return true;   /* 파일 그대로 */
  return false;
}

var routes = JSON.parse(fs.readFileSync(path.join(__dirname, "routes.json"), "utf8"));
var linked = {}, bad = [], blocked = [];

routes.forEach(function(r){
  var html = fs.readFileSync(pageFile(r), "utf8");
  var m, re = /href="([^"]+)"/g;
  while((m = re.exec(html))){
    var h = m[1];
    if(/^(https?:|mailto:|tel:|#|data:)/.test(h)) continue;
    if(h.indexOf(".css") >= 0 || h.indexOf(".js") >= 0) continue;
    var target = h.split("?")[0].split("#")[0];
    linked[target] = true;
    var eaten = routeGuard.swallows(target);
    if(eaten) blocked.push(r + "  ->  " + h + "   (vercel '" + eaten.s + "' 가 " + eaten.d + " 로 보냅니다)");
    else if(!exists(target)) bad.push(r + "  ->  " + h);
  }
});

/* 찍었는데 아무도 안 거는 화면 — 손님이 닿을 길이 없습니다 */
var orphan = routes.filter(function(r){ return r !== "/" && !linked[r]; });

function uniq(a){ return a.filter(function(v,i){ return a.indexOf(v) === i; }); }
bad = uniq(bad); blocked = uniq(blocked);

bad.forEach(function(x){ console.error("❌ 없는 곳으로 겁니다   " + x); });
blocked.forEach(function(x){ console.error("❌ 410 으로 갑니다     " + x); });
orphan.forEach(function(x){ console.error("⚠️ 아무도 안 거는 화면  " + x); });

if(process.argv.indexOf("--prove") >= 0){
  console.log("\n되돌려 보기");
  var fake = "/이런주소는없습니다";
  console.log("  없는 주소를 넣으면 잡히나: " + (exists(fake) ? "❌ 못 잡습니다" : "O"));
  console.log("  410 주소를 넣으면 잡히나: " + (routeGuard.swallows("/c/lesson") ? "O" : "❌ 못 잡습니다"));
  if(exists(fake) || !routeGuard.swallows("/c/lesson")) process.exit(1);
}

console.log("\n화면 " + routes.length + "장 · 건 링크 " + Object.keys(linked).length +
            "곳 · 끊긴 곳 " + bad.length + " · 410 " + blocked.length + " · 외톨이 " + orphan.length);
process.exit(bad.length || blocked.length ? 1 : 0);
