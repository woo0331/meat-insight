#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   새로 만든 주소가 vercel.json 규칙에 **잡아먹히는지** — 빌드에서 멈춥니다

   ⚠️⚠️ **왜 이 검사가 있는가.** 분류 주소를 /c/lesson 으로 지으려다
   vercel.json 에 /c/:p* 가 **410 으로 보내는 규칙**으로 남아 있는 것을
   봤습니다. 그대로 갔으면 저장소에는 파일이 멀쩡히 있고, 로컬에서도
   200 이 뜨고, 배포만 하면 손님에게 **410** 이 나갔을 것입니다.
   에러도 경고도 없습니다 — 실제 주소를 열어 봐야만 압니다.

   ⚠️ 그래서 분류 주소는 /cat/<key> 입니다. 한 글자짜리 c 는 영영
   못 씁니다 — 앞 서비스의 410 규칙이 그 자리에 있고, 그 규칙을
   지우면 이미 색인된 옛 주소가 410 대신 404 가 됩니다.

   돌리기   node tools/check-routes.js /cat/lesson /search ...
            node tools/check-routes.js --prove
   ════════════════════════════════════════════════════════════════════ */
var fs = require("fs"), path = require("path");
var V = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "vercel.json"), "utf8"));

/* vercel 의 source 문법을 정규식으로 — :p* 는 뒤를 통째로, :p 는 한 조각 */
function toRe(src){
  var re = src
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/:[A-Za-z_][A-Za-z0-9_]*\*/g, "___STAR___")
    .replace(/:[A-Za-z_][A-Za-z0-9_]*/g, "___ONE___")
    .replace(/\*/g, ".*")
    .replace(/___STAR___/g, ".*")
    .replace(/___ONE___/g, "[^/]+");
  return new RegExp("^" + re + "$");
}

var RULES = []
  .concat((V.rewrites  || []).map(function(r){ return { kind:"rewrite",  s:r.source, d:r.destination }; }))
  .concat((V.redirects || []).map(function(r){ return { kind:"redirect", s:r.source, d:r.destination }; }));
RULES.forEach(function(r){ r.re = toRe(r.s); });

/* 주소 하나가 어느 규칙에 걸리는지 — 안 걸리면 null */
function swallows(route){
  for(var i=0;i<RULES.length;i++) if(RULES[i].re.test(route)) return RULES[i];
  return null;
}
module.exports = { swallows: swallows, RULES: RULES };

if(require.main === module){
  var routes = process.argv.slice(2).filter(function(a){ return a[0] === "/"; });
  if(!routes.length){
    /* 인자가 없으면 빌드가 적어 둔 주소 **전부** 를 봅니다.
       ⚠️⚠️ 처음에는 인자가 없으면 "잴 주소를 안 주셨습니다" 하고
       **0 으로 끝났습니다.** 문(tools/ship.js)에서는 그게 초록으로
       보여서, 아무것도 안 재는 검사가 통과하고 있었습니다. */
    var rf = path.join(__dirname, "routes.json");
    if(fs.existsSync(rf)) routes = JSON.parse(fs.readFileSync(rf, "utf8")).routes || [];
  }
  var prove  = process.argv.indexOf("--prove") >= 0;

  if(prove){
    /* ⚠️⚠️ 되돌려 보기 — 410 으로 보내는 주소를 하나 넣어 봅니다.
       잡지 못하면 이 검사는 아무것도 안 하는 것입니다. */
    var probe = (V.rewrites || []).map(function(r){ return r.source; })
      .filter(function(s){ return s.indexOf(":") < 0; })[0];
    var star  = (V.rewrites || []).map(function(r){ return r.source; })
      .filter(function(s){ return s.indexOf(":") >= 0; })[0];
    var starTest = star ? star.replace(/\/:[A-Za-z_][A-Za-z0-9_]*\*?$/, "/aaa") : null;
    var a = probe && swallows(probe), b = starTest && swallows(starTest);
    console.log("되돌려 보기");
    console.log("  " + probe + " -> " + (a ? "잡힘 O (" + a.d + ")" : "❌ 못 잡습니다"));
    console.log("  " + starTest + " -> " + (b ? "잡힘 O (" + b.d + ")" : "❌ 못 잡습니다"));
    if(!a || !b) process.exit(1);
  }
  /* ⚠️ 잰 것이 0개면 **실패**입니다 — 통과가 아닙니다 */
  if(!routes.length){
    console.error("❌ 잰 주소가 0개입니다 — tools/routes.json 이 없거나 비었습니다 " +
                  "(node build.js 를 먼저 돌리세요).");
    process.exit(1);
  }

  var bad = 0;
  routes.forEach(function(r){
    var hit = swallows(r);
    if(hit){
      bad++;
      console.error("❌ " + r + "  은 vercel.json 의 " + hit.kind + " '" + hit.s +
                    "' 에 걸려 " + hit.d + " 로 갑니다 — 손님은 이 화면을 못 봅니다");
    }
  });
  console.log((bad ? "" : "✅ ") + "주소 " + routes.length + "개 중 잡아먹히는 것 " + bad + "건");
  process.exit(bad ? 1 : 0);
}
