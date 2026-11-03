#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   분류 키가 지난 두 사업의 키와 겹치는지 — 빌드에서 멈춥니다

   ⚠️⚠️ **왜 멈춰야 하는가.** request_item.service_id 는 분류 키를
   **글자 그대로** 저장합니다. 지난 두 사업에서 손님이 넣은 신청이
   운영 DB 에 그대로 남아 있고, 거기에는 옛 키가 적혀 있습니다.
   골프에서 같은 글자를 **다른 뜻으로** 다시 쓰면, 옛 기록을 읽는
   화면이 그 신청을 **골프 분류로 보여 줍니다.** 에러가 안 납니다 —
   숫자와 글자가 조용히 틀립니다.

   ⚠️ 여기 모은 옛 키는 **손으로 적은 표가 아닙니다** — 4563539 의
   js/data/catalog.js 에서 뽑고, 그 파일 머리말이 적어 둔 창업 ·
   폐업 분류를 더해 겹침을 없앤 값입니다. 갯수는 검사가 찍습니다 —
   되살려 세어 보시려면 git show 4563539:js/data/catalog.js 입니다.

   돌리기   node tools/check-keys.js
   돌아오는 값   겹치면 1 · 괜찮으면 0
   ════════════════════════════════════════════════════════════════════ */

/* 지난 중고폰 분류 · 하위 (4563539) */
var PHONE = ("access asset-val auction back-bad batt-bad battery board broken " +
  "buds-buy buds-sell bulk buyer buyin camera case charge charger container " +
  "corp customs data export fix func grade imei inspect lcd lcd-bad lease lot " +
  "nb-buy nb-sell office pack part-bad part-lot ph-buy ph-sell pickup post " +
  "pwr-bad self-buy shipping shop sound stand store tab-buy tab-sell unlock " +
  "visit watch-buy watch-sell wet-bad wet-fix wholesale wipe wipe-cert wrap").split(" ");

/* 그 앞 창업 · 폐업 분류 스물여섯 */
var SHOPS = ("item store area interior equip furniture it supply repair admin " +
  "staff marketing clean fund process transfer asset stock demolish restore " +
  "waste tax labor contract law support").split(" ");

var TAKEN = {};
PHONE.concat(SHOPS).forEach(function(k){ TAKEN[k] = true; });

global.window = {};
require("../js/data/catalog.js");
var CATS = global.window.AM_CATS || [];

var bad = [], seen = {}, dup = [];
function look(key, where){
  if(TAKEN[key]) bad.push(where + " 키 " + key + " 는 지난 사업이 쓰던 키입니다");
  if(seen[key])  dup.push(where + " 키 " + key + " 가 두 번 나옵니다 (" + seen[key] + ")");
  seen[key] = where;
}
CATS.forEach(function(c){
  look(c.key, "분류 " + c.name);
  (c.items || []).forEach(function(it){ look(it.key, "하위 " + c.name + " / " + it.name); });
});

var subs = CATS.reduce(function(n,c){ return n + (c.items||[]).length; }, 0);
console.log("분류 " + CATS.length + " · 하위 " + subs + " · 겹치면 안 되는 옛 키 " +
            Object.keys(TAKEN).length + "개와 대조했습니다");

/* ⚠️ 이 검사가 **실제로 잡는지** 여기서 같이 증명합니다 — 통과만 하고
   아무것도 안 잡는 검사를 여러 번 만들었습니다 (작업 기억). */
if(!TAKEN["fix"] || !TAKEN["repair"])
  { console.error("❌ 대조표 자체가 비었습니다 — 검사가 아무것도 안 잡습니다"); process.exit(1); }
if(process.argv.indexOf("--prove") >= 0){
  var probe = TAKEN["lcd"] ? "lcd" : null;
  console.log(probe
    ? "되돌려 보기: 분류 키를 " + probe + " 로 바꾸면 이 검사가 잡습니다 (대조표에 있습니다)"
    : "되돌려 보기: 대조표에 표본이 없습니다");
}

bad.concat(dup).forEach(function(m){ console.error("❌ " + m); });
if(bad.length || dup.length) process.exit(1);
console.log("✅ 겹침 0건 · 중복 0건");
