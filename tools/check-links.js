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

/* ⚠️⚠️ **주소를 파일로 푸는 규칙은 `tools/_serve.js` 와 같아야 합니다**
   (`cleanUrls:true` 와도). 대부분은 `<주소>/index.html` 인데 **404 만
   루트의 `404.html`** 입니다 — Vercel 이 없는 주소에 그 파일을 내기
   때문입니다(`pages/notfound.js` 머리말). 여기만 폴더를 가정하고 있어서
   404 를 더한 날 이 검사가 **통째로 터졌습니다** (2026-11-05). */
function pageFile(route){
  if(route === "/") return path.join(ROOT, "index.html");
  var bare = route.replace(/^\//, "");
  var folder = path.join(ROOT, bare + "/index.html");
  if(fs.existsSync(folder)) return folder;
  var flat = path.join(ROOT, bare + ".html");
  if(fs.existsSync(flat)) return flat;
  return folder;                       /* 없으면 전처럼 말하게 둡니다 */
}
function exists(route){
  var r = route.split("?")[0].split("#")[0];
  if(r !== "/" && r.slice(-1) === "/") r = r.slice(0, -1);
  if(fs.existsSync(pageFile(r))) return true;
  if(fs.existsSync(path.join(ROOT, r.replace(/^\//, "")))) return true;   /* 파일 그대로 */
  return false;
}

var R = JSON.parse(fs.readFileSync(path.join(__dirname, "routes.json"), "utf8"));
var routes = R.routes, skipOrphan = R.unlinked || [];
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
/* ⚠️ 일부러 안 거는 화면은 빼고 셉니다 — 안 그러면 경고가 늘 떠서
   진짜 외톨이가 묻힙니다. 다만 **빼 둔 목록은 화면이 스스로 적습니다**
   (pages/*.js 의 unlinked) — 검사 쪽에 손으로 적지 않습니다. */
var orphan = routes.filter(function(r){
  return r !== "/" && !linked[r] && skipOrphan.indexOf(r) < 0; });

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
