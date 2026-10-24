/* ══════════════════════════════════════════════════════════════════
   컬러 아이콘 서른셋의 **크기를 맞춥니다** (2026-10-24)

   사장님이 메인 "직접 찾기 여덟" 을 보시고 **"아이콘 크기들을
   일치하게 만들어놔"** 라고 하셔서 재 보니, 48 칸 안에 그려진 그림의
   **제일 긴 변이 37 ~ 43** 으로 제각각이었고 가운데도 (22.5, 23.5) ~
   (26.5, 26) 로 떠 있었습니다. 같은 44px 타일에 넣어도 어떤 것은 크고
   어떤 것은 작아 보이는 까닭입니다.

   이 도구가 아이콘마다 **실제로 그려진 자리**를 브라우저로 재서,
   `iconArt()` 가 쓸 보정표(`IA_FIT`)를 `js/components/base.js` 에
   적어 넣습니다.

       제일 긴 변 → 40 · 가운데 → (24, 24) · 비율은 그대로

   ⚠️⚠️ **아이콘 path 를 고치면 이 도구를 다시 돌리세요.** 안 돌리면
   보정값이 옛 그림 기준이라 그 하나만 조용히 어긋납니다 — 그래서
   `check.js` 의 "컬러 아이콘이 모두 같은 크기로 그려진다" 가 **화면에
   그려진 것을 다시 재서** 봅니다 (표를 믿지 않습니다).

   ⚠️ **선(stroke)까지 포함해서 잽니다.** 선을 쓰는 아이콘이 서른셋 중
   열셋이고, 그 선 굵기(2.8 · 2.6)가 보이는 크기에 들어갑니다 — 기하
   bbox(`getBBox`)만 재면 선 있는 쪽이 그만큼 작게 맞춰집니다.
   ⚠️ 선도 같이 줄고 늘기 때문에 **한 번만 재면 됩니다** (보이는 크기가
   배율에 정비례합니다 — 되풀이해 재 볼 필요가 없습니다).

       node tools/fit-icons.js          재 보기만 (표를 안 고칩니다)
       node tools/fit-icons.js --write  base.js 의 보정표를 다시 씁니다
   ══════════════════════════════════════════════════════════════════ */
var fs = require("fs");
var path = require("path");
var ROOT = path.join(__dirname, "..");
var SRC  = path.join(ROOT, "js/components/base.js");

var TARGET = 40;   /* 제일 긴 변 (48 칸 안) — 사방 4 여백 */
var CENTER = 24;
var ZOOM   = 10;   /* 크게 그려서 재야 소수점이 안 뭉갭니다 */

var chromium;
try { chromium = require("/opt/node22/lib/node_modules/playwright").chromium; }
catch(e){ try { chromium = require("playwright").chromium; } catch(e2){} }
if(!chromium){
  console.error("playwright 가 없습니다 — 재지 못했습니다 (통과로 치지 않습니다).");
  process.exit(2);
}

/* base.js 를 그대로 읽어 IA 와 iconArt 를 얻습니다 (두 벌로 적지
   않습니다 — 아이콘이 늘면 저절로 따라옵니다). */
global.window = global;
var SRCTXT = fs.readFileSync(SRC, "utf8");
eval(SRCTXT);

/* 쓰는 쪽 CSS 그대로 — 선 굵기가 보이는 크기에 들어갑니다 */
var CSS = ".ia .a1{fill:#806047}.ia .a2{fill:#EDE0CF}.ia .aw{fill:#fff}" +
  ".ia .a1o{fill:none;stroke:#806047;stroke-width:2.8}" +
  ".ia .awo{fill:none;stroke:#fff;stroke-width:2.6}";

(async function(){
  var keys = Object.keys(IA);
  /* 보정 없이(`raw`) 그려서 재야 원래 자리가 나옵니다 */
  var html = '<!doctype html><meta charset=utf-8><style>body{margin:0}' + CSS +
    '</style><body>' + keys.map(function(k){
      return '<div id="w-' + k + '">' +
        iconArt(k, 48 * ZOOM, { raw:true }) + '</div>';
    }).join("");

  var b = await chromium.launch();
  var p = await b.newPage();
  await p.setContent(html);
  var rows = await p.evaluate(function(a){
    var keys = a[0], Z = a[1];
    return keys.map(function(k){
      var svg = document.querySelector("#w-" + k + " svg");
      var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      while(svg.firstChild) g.appendChild(svg.firstChild);
      svg.appendChild(g);
      /* ⚠️ getBBox() 는 선을 안 셉니다 — 화면에 보이는 네모를 잽니다 */
      var r = g.getBoundingClientRect(), o = svg.getBoundingClientRect();
      return { k:k,
        x:(r.left - o.left) / Z, y:(r.top - o.top) / Z,
        w:r.width / Z, h:r.height / Z };
    });
  }, [keys, ZOOM]);
  await b.close();

  var fit = {}, worst = 0;
  rows.forEach(function(r){
    var big = Math.max(r.w, r.h);
    var s = TARGET / big;
    var tx = CENTER - s * (r.x + r.w / 2);
    var ty = CENTER - s * (r.y + r.h / 2);
    fit[r.k] = [+s.toFixed(4), +tx.toFixed(3), +ty.toFixed(3)];
    if(Math.abs(big - TARGET) > worst) worst = Math.abs(big - TARGET);
  });

  console.log("키           이제까지 그려진 자리         배율    옮김");
  rows.forEach(function(r){
    var f = fit[r.k];
    console.log(r.k.padEnd(12) +
      (r.w.toFixed(1) + " × " + r.h.toFixed(1)).padStart(13) +
      ("  가운데 " + (r.x + r.w / 2).toFixed(1) + ", " +
        (r.y + r.h / 2).toFixed(1)).padEnd(20) +
      String(f[0]).padStart(7) + "  " +
      (f[1] >= 0 ? "+" : "") + f[1] + ", " + (f[2] >= 0 ? "+" : "") + f[2]);
  });
  /* ⚠️ 변수 뒤에 조사를 **띄어 붙이지 마세요** — tools/check-korean.js
     가 "에서" 를 낱말에서 떨어진 조사로 잡습니다 (실제로 걸렸습니다). */
  console.log("\n아이콘 " + rows.length + "개 · 제일 긴 변이 " + TARGET +
    "에서 최대 " + worst.toFixed(1) + "만큼 벌어져 있었습니다.");

  if(process.argv.indexOf("--write") < 0){
    console.log("⚠️ 표는 안 고쳤습니다 — 고치시려면 --write 를 붙이세요.");
    return;
  }

  var body = keys.map(function(k){
    var f = fit[k];
    return "  " + k + ":[" + f[0] + "," + f[1] + "," + f[2] + "]";
  }).join(",\n");
  var block = "var IA_FIT = {\n" + body + "\n};";
  var re = /var IA_FIT = \{[\s\S]*?\n\};/;
  if(!re.test(SRCTXT)){
    console.error("base.js 에서 IA_FIT 자리를 못 찾았습니다.");
    process.exit(1);
  }
  var out = SRCTXT.replace(re, block);
  fs.writeFileSync(SRC, out);
  /* ⚠️ 쓴 뒤에는 되읽어 확인합니다 — 이 저장소가 인덱스로 칸을 갈아
     끼우다 함수를 통째로 삼킨 적이 다섯 번 있습니다. */
  var back = fs.readFileSync(SRC, "utf8");
  try { new Function(back); }
  catch(e){ console.error("고친 base.js 가 깨졌습니다 — " + e.message); process.exit(1); }
  var got = re.exec(back);
  if(!got || got[0] !== block){
    console.error("되읽어 보니 표가 제대로 안 들어갔습니다."); process.exit(1);
  }
  console.log("✅ js/components/base.js 의 IA_FIT 을 다시 적었습니다 (" +
    keys.length + "개).");
})();
