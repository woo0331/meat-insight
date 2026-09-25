#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   /img/*.svg 를 다시 그립니다

     node tools/make-img.js

   ⚠️ img 폴더의 SVG 를 **손으로 고치지 마세요.** 여기서 만들어집니다.
   그림을 바꾸려면 tools/img-scenes.js 를, 조각(사람·쇼케이스·후드 등)을
   바꾸려면 tools/img-lib.js 를 고치고 이 스크립트를 다시 돌리세요.

   ⚠️ 지금 들어 있는 것은 **사진이 아니라 그림**입니다. 실제 고깃집 ·
   정육점 · 주방 사진이 생기면 img 폴더에 넣고 js/data/photos.js 의
   경로만 바꾸면 됩니다 — 그러면 이 그림들은 더 이상 쓰이지 않습니다.

   og.jpg 는 tools/og.html 을 브라우저로 띄워 찍습니다 (README 참고).
   PIL 로 만들지 마세요 — 서버에 한글 글꼴이 없어 전부 네모가 됩니다.
   ════════════════════════════════════════════════════════════════════ */
const fs = require("fs"), path = require("path");
const S = require("./img-scenes.js");
const OUT = path.join(__dirname, "..", "img");

fs.mkdirSync(OUT, { recursive:true });
const made = [];
for(const key of Object.keys(S)){
  fs.writeFileSync(path.join(OUT, key + ".svg"), S[key]());
  made.push(key);
}

/* 그린 것과 화면이 찾는 것이 어긋나면 사진 자리가 조용히 빕니다 */
const photos = fs.readFileSync(path.join(__dirname,"..","js","data","photos.js"), "utf8");
const want = [...photos.matchAll(/src:"\/img\/([^"]+)\.svg"/g)].map(m => m[1]);
const missing = want.filter(k => !made.includes(k));
const unused  = made.filter(k => !want.includes(k));
if(missing.length) console.error("  ! photos.js 가 찾는데 안 그린 것: " + missing.join(", "));
if(unused.length)  console.log ("  · 그렸지만 photos.js 가 안 쓰는 것: " + unused.join(", "));

console.log("그림 " + made.length + "장 · js/data/photos.js 가 쓰는 것 " + want.length + "장");
if(missing.length) process.exit(1);
