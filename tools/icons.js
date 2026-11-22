#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   파비콘 · 웹앱 아이콘을 만듭니다 — brand.js 의 악수형 심볼에서

     node tools/icons.js

   만드는 것 (저장소 맨 위):
     favicon.ico (16 · 32 · 48)   favicon-16.png   favicon-32.png
     apple-touch-icon.png (180)   icon-192.png   icon-512.png   icon-maskable.png (512)

   ⚠️ 바탕은 월넛(#6A4B3B) · 심볼은 크림(#FFFCF7) 한 색입니다. 그라디언트는 탭 크기에서 뭉개집니다.
   ⚠️ 16 · 32 · 48px 은 선을 굵게 메운 단순형(markS)을 씁니다 — 손가락 사이 틈이 그 크기에서는 얼룩입니다.
   ⚠️ maskable 은 심볼을 안전 영역(가운데 80%) 안에 작게 둡니다 (안드로이드가 둥글게 잘라 냅니다).
   ⚠️ 파일 이름을 바꾸지 않고 내용만 바꿉니다 — 캐시는 build-pages.js 가 ?v= 로 끊습니다.
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const fs = require("fs"), path = require("path");
const ROOT = process.cwd();
const sb = { window:{} }; new Function("window", fs.readFileSync(path.join(ROOT,"js/data/brand.js"),"utf8"))(sb.window);
const B = sb.window.AM_BRAND || {};
if(!B.mark || !B.markS) throw new Error("brand.js 에 mark · markS 가 없습니다");
const WAL = "#6A4B3B", CRM = "#FFFCF7";
function svg(size, d, o){
  const r = o.round ? size * 0.22 : 0, pad = size * o.pad;
  return '<svg xmlns="http://www.w3.org/2000/svg" width="'+size+'" height="'+size+'" viewBox="0 0 '+size+' '+size+'">'+
    '<rect width="'+size+'" height="'+size+'" rx="'+r+'" fill="'+WAL+'"/>'+
    '<svg x="'+pad+'" y="'+pad+'" width="'+(size-2*pad)+'" height="'+(size-2*pad)+'" viewBox="'+B.markBox+'">'+
    '<path fill="'+CRM+'" fill-rule="evenodd" d="'+d+'"/></svg></svg>';
}
const JOBS = [
  ["favicon-16.png", 16, B.markS, { round:true, pad:.08 }],
  ["favicon-32.png", 32, B.markS, { round:true, pad:.10 }],
  ["favicon-48.png", 48, B.markS, { round:true, pad:.12 }],
  ["apple-touch-icon.png", 180, B.mark, { round:false, pad:.16 }],
  ["icon-192.png", 192, B.mark, { round:true, pad:.16 }],
  ["icon-512.png", 512, B.mark, { round:true, pad:.16 }],
  ["icon-maskable.png", 512, B.mark, { round:false, pad:.24 }]
];
/* ICO — PNG 를 그대로 담는 꼴 (Vista 이후 모든 브라우저가 읽습니다) */
function ico(pngs){
  const head = Buffer.alloc(6); head.writeUInt16LE(0,0); head.writeUInt16LE(1,2); head.writeUInt16LE(pngs.length,4);
  let off = 6 + 16 * pngs.length; const dir = [];
  for(const [s, buf] of pngs){
    const e = Buffer.alloc(16); e.writeUInt8(s >= 256 ? 0 : s,0); e.writeUInt8(s >= 256 ? 0 : s,1);
    e.writeUInt16LE(1,4); e.writeUInt16LE(32,6); e.writeUInt32LE(buf.length,8); e.writeUInt32LE(off,12);
    dir.push(e); off += buf.length;
  }
  return Buffer.concat([head, ...dir, ...pngs.map(p => p[1])]);
}
(async () => {
  const br = await chromium.launch(); const pg = await br.newPage();
  const out = {};
  for(const [name, size, d, o] of JOBS){
    await pg.setViewportSize({ width:size, height:size });
    await pg.setContent('<style>html,body{margin:0;background:transparent}</style>' + svg(size, d, o));
    const buf = await pg.screenshot({ type:"png", omitBackground:true, clip:{ x:0, y:0, width:size, height:size } });
    out[name] = buf;
    if(name !== "favicon-48.png") fs.writeFileSync(path.join(ROOT, name), buf);
    console.log("✅ " + name + " " + size + "×" + size + " · " + Math.round(buf.length/1024*10)/10 + "KB");
  }
  fs.writeFileSync(path.join(ROOT, "favicon.ico"), ico([[16,out["favicon-16.png"]],[32,out["favicon-32.png"]],[48,out["favicon-48.png"]]]));
  console.log("✅ favicon.ico (16 · 32 · 48)");
  await br.close();
})();
