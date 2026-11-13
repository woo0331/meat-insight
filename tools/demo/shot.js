/* 시연 화면을 찍습니다 — `node tools/demo/shot.js <주소> <나갈 폴더>`
   ⚠️ 보는 도구입니다(통과 · 실패를 내지 않습니다) — 다만 **에러 ·
   가로 밀림은 세어서** 같이 찍어 줍니다. */
var fs = require("fs"), path = require("path");
var { chromium } = require("/opt/node22/lib/node_modules/playwright");

var BASE = process.argv[2] || "http://127.0.0.1:4180";
var OUT = process.argv[3] || "/tmp/demo-shots";
var ROWS = require("./rows.js");

var L1 = ROWS.v_listing_open[0].id;
var J1 = ROWS.v_job_open[0].id;
var T1 = ROWS.v_trip_open[0].id;
var Q1 = ROWS.v_cq_public[1].id;

var PAGES = [
  ["00-home",        "/"],
  ["01-booking",     "/cat/booking"],
  ["02-matchup",     "/cat/matchup"],
  ["03-used",        "/cat/used"],
  ["04-lesson",      "/cat/lesson"],
  ["05-range",       "/cat/range"],
  ["06-market",      "/cat/market"],
  ["07-fitting",     "/cat/fitting"],
  ["08-travel",      "/cat/travel"],
  ["09-career",      "/cat/career"],
  ["10-community",   "/cat/community"],
  /* 상세로 이어지는지 */
  ["11-used-detail",  "/cat/used?v=" + L1],
  ["12-career-detail","/cat/career?v=" + J1],
  ["13-travel-detail","/cat/travel?v=" + T1],
  ["14-community-one","/cat/community?q=" + Q1],
  ["15-pro-detail",   "/pro/dm-ls-1"],
  /* 거르개가 실제로 좁히는지 */
  ["16-used-filter",  "/cat/used?g=club&fx=s&p=u50"],
  ["17-lesson-filter","/cat/lesson?sub=ls-solo&rg=seoul"]
];

(async function(){
  fs.mkdirSync(OUT, { recursive:true });
  var b = await chromium.launch();
  var bad = 0;
  for(var i = 0; i < PAGES.length; i++){
    var name = PAGES[i][0], url = PAGES[i][1];
    for(var w = 0; w < 2; w++){
      var W = w ? 360 : 1280, tag = w ? "mo" : "pc";
      var p = await b.newPage({ viewport:{ width:W, height:900 },
                                deviceScaleFactor:2 });
      var errs = [];
      p.on("pageerror", function(e){ errs.push(String(e.message || e)); });
      p.on("console", function(m){
        var t = m.text();
        if(m.type() === "error") errs.push(t);
        /* ⚠️⚠️⚠️ **매핑 없는 키도 잡습니다.** `amKeyName()` 은
           모르는 키를 「… 미확인」으로 내고 **운영자에게만**
           `console.warn` 으로 말합니다(절대 규칙 3). 그 줄을 안 세면
           예시 자료가 틀려도 화면은 멀쒗해 보여서, 시연에서
           「목적지 미확인」이 카드마다 찍힐 뻔했습니다(실제로
           밟았고, 찍어 보고서야 알았습니다). */
        if(m.type() === "warning" && t.indexOf("[amKeyName]") >= 0) errs.push(t);
      });
      await p.goto(BASE + url, { waitUntil:"networkidle" });
      await p.waitForTimeout(900);
      /* ⚠️⚠️ **늦게 불러오는 사진(lazy)을 깨워 둡니다** — 그냥 찍으면
         첫 줄만 나오고 아래는 **빈 타일**로 찍힙니다. 찍힌 그림만 보고
         「사진이 안 나온다」고 읽으면 **멀쒗한 화면을 고치려** 들게 됩니다. */
      await p.evaluate(async function(){
        var H = document.documentElement.scrollHeight;
        for(var y = 0; y < H; y += 700){
          window.scrollTo(0, y);
          await new Promise(function(r){ setTimeout(r, 60); });
        }
        window.scrollTo(0, 0);
        await Promise.all(Array.prototype.map.call(document.images, function(im){
          if(im.complete) return null;
          return new Promise(function(r){
            im.addEventListener("load", r, { once:true });
            im.addEventListener("error", r, { once:true });
            setTimeout(r, 2500);
          });
        }));
      });
      await p.waitForTimeout(500);
      await p.screenshot({ path:path.join(OUT, name + "-" + tag + ".png"),
                           fullPage:true });
      var r = await p.evaluate(function(){
        return { h:document.documentElement.scrollHeight,
                 over:document.documentElement.scrollWidth - window.innerWidth,
                 imgs:Array.prototype.filter.call(document.images, function(im){
                   return im.getClientRects().length && !im.complete;
                 }).length,
                 broken:Array.prototype.filter.call(document.images, function(im){
                   return im.complete && im.naturalWidth === 0;
                 }).length };
      });
      if(errs.length || r.over > 1 || r.broken) bad++;
      console.log("  " + (name + "-" + tag).padEnd(20) +
        String(r.h).padStart(6) + "px" +
        (r.over > 1 ? "  ⚠️ 가로 " + r.over + "px 밀림" : "") +
        (r.broken ? "  ⚠️ 깨진 그림 " + r.broken + "장" : "") +
        (errs.length ? "  ⚠️ 에러 " + errs.length + "건: " + errs[0].slice(0, 80) : ""));
      await p.close();
    }
  }
  await b.close();
  console.log("\n" + (PAGES.length * 2) + "장 찍었습니다 — " + OUT +
              "  (말썽난 화면 " + bad + "장)");
  process.exit(0);
})();
