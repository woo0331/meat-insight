#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   색 대비를 **재는** 자리 — 눈으로 고르지 않습니다 (WCAG 2.1)

   ⚠️⚠️ 작업 기억: "밝은 브랜드색을 작은 글씨에 쓰다가 다섯 번
   걸렸습니다. 새 팔레트를 만들 때마다 **밝은 쪽(면 전용)과 짙은
   쪽(글자)을 갈라** 두세요."  그래서 토큰을 정하기 전에 여기서
   재고, 잰 값을 토큰 주석에 적어 둡니다.

   기준   보통 글자 4.5 · 큰 글자 3.0 (24px 이상, 또는 18.66px 이상이며 굵은 것)
          ⚠️ 17px 굵은 글씨는 큰 글자가 **아닙니다**.
          면 · 테두리 · 아이콘은 3.0 (비문자 대비)

   돌리기   node tools/contrast.js '#1B5E3A' '#FFFFFF' ...  (짝으로)
            node tools/contrast.js --table                  (팔레트 전수)
   ════════════════════════════════════════════════════════════════════ */
function lin(c){ c/=255; return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); }
function lum(hex){
  var h = String(hex).replace("#","").trim();
  if(h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  var r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
  if([r,g,b].some(isNaN)) throw new Error("색을 못 읽었습니다: " + hex);
  return 0.2126*lin(r) + 0.7152*lin(g) + 0.0722*lin(b);
}
function ratio(a,b){
  var x = lum(a), y = lum(b), hi = Math.max(x,y), lo = Math.min(x,y);
  return (hi + 0.05) / (lo + 0.05);
}
module.exports = { ratio: ratio, lum: lum };

if(require.main === module){
  var a = process.argv.slice(2);
  if(a[0] === "--table"){ require("./contrast-table.js"); }
  else {
    for(var i=0;i<a.length;i+=2){
      var r = ratio(a[i], a[i+1]);
      console.log(a[i] + " 위 " + a[i+1] + "  " + r.toFixed(2) +
        "   보통글자 " + (r>=4.5?"O":"X") + " · 큰글자 " + (r>=3?"O":"X"));
    }
  }
}
