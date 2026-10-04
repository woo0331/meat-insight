#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   넣은 사진이 규격에 맞는가 — tools/check-photos.js

     node tools/check-photos.js

   ⚠️ **사진은 조용히 어긋납니다.** 파일 이름을 한 글자 틀리면 그냥
   안 나오고, 6MB 짜리를 넣으면 첫 화면이 느려지는데 에러는 안 납니다.
   비율이 안 맞으면 주인공이 잘려 나가는데 그것도 에러가 아닙니다.
   그래서 **파일을 직접 열어 보고** 봅니다 —

     · `WOW_PHOTOS` 의 키가 `WOW_PHOTO_SLOTS` 에 있는 이름인가
     · 파일이 실제로 있는가 · 경로가 `/` 로 시작하는가
     · 진짜 그림인가 (머리글을 읽어 가로 · 세로를 잽니다)
     · 최소 크기 · 비율 · 용량
     · `alt` 가 비어 있지 않은가
     · `img/` 에 **아무도 안 쓰는 파일**이 굴러다니지 않는가

   ⚠️ 규격은 `js/data/photos.js` 의 `WOW_PHOTO_SLOTS` **한 곳**에만
   있습니다. 자리를 늘리면 거기만 고치세요.

   ⚠️ 이건 **규격 검사**이지 "보기 좋은가" 를 보는 것이 아닙니다.
   업종이 드러나는지 · 폐업 쪽이 처연한지는 사람이 봐야 합니다.
   `node tools/shot.js "/|1440|home"` 으로 찍어서 눈으로 보세요.
   ════════════════════════════════════════════════════════════════════ */
const fs = require("fs"), path = require("path");
const ROOT = process.cwd();

/* ── 데이터 읽기 ─────────────────────────────────────────────── */
function load(){
  const w = {};
  const src = fs.readFileSync(path.join(ROOT, "js/data/photos.js"), "utf8");
  new Function("window", src)(w);
  return w;
}

/* ── 그림 머리글에서 가로 · 세로 ─────────────────────────────────
   ⚠️ 이 저장소에는 package.json 이 없습니다. 크기 재자고 라이브러리를
   들이지 않고, 머리글 몇 바이트만 직접 읽습니다. */
function size(buf){
  /* PNG */
  if(buf.length > 24 && buf.toString("hex", 0, 8) === "89504e470d0a1a0a")
    return { type:"png", w:buf.readUInt32BE(16), h:buf.readUInt32BE(20) };
  /* GIF */
  if(buf.length > 10 && (buf.toString("ascii", 0, 6) === "GIF87a" || buf.toString("ascii", 0, 6) === "GIF89a"))
    return { type:"gif", w:buf.readUInt16LE(6), h:buf.readUInt16LE(8) };
  /* WebP */
  if(buf.length > 30 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP"){
    const c = buf.toString("ascii", 12, 16);
    if(c === "VP8 ") return { type:"webp", w:buf.readUInt16LE(26) & 0x3fff, h:buf.readUInt16LE(28) & 0x3fff };
    if(c === "VP8L"){
      const b = buf.readUInt32LE(21);
      return { type:"webp", w:(b & 0x3fff) + 1, h:((b >> 14) & 0x3fff) + 1 };
    }
    if(c === "VP8X") return { type:"webp",
      w:(buf.readUIntLE(24, 3) & 0xffffff) + 1, h:(buf.readUIntLE(27, 3) & 0xffffff) + 1 };
    return { type:"webp", w:0, h:0 };
  }
  /* JPEG — SOFn 표시를 찾아 걸어갑니다 */
  if(buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8){
    let i = 2;
    while(i < buf.length - 9){
      if(buf[i] !== 0xff){ i++; continue; }
      const m = buf[i + 1];
      /* SOF0~SOF15 중 DHT(c4) · JPG(c8) · DAC(cc) 는 크기가 없습니다 */
      if(m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc)
        return { type:"jpeg", h:buf.readUInt16BE(i + 5), w:buf.readUInt16BE(i + 7) };
      i += 2 + buf.readUInt16BE(i + 2);
    }
    return { type:"jpeg", w:0, h:0 };
  }
  return null;
}

/* ── 검사 ───────────────────────────────────────────────────────── */
const W = load();
const SLOTS = W.WOW_PHOTO_SLOTS || [];
const PHOTOS = W.WOW_PHOTOS || {};
const bySlot = {};
SLOTS.forEach(s => { bySlot[s.key] = s; });

const bad = [], warn = [];
const used = new Set();
let ok = 0;

Object.keys(PHOTOS).forEach(key => {
  const p = PHOTOS[key] || {};
  const slot = bySlot[key];
  const tag = '"' + key + '"';

  /* ⚠️ 제일 조용한 실수 — 이름을 한 글자 틀리면 그냥 안 나옵니다 */
  if(!slot){
    bad.push(tag + " 는 없는 자리입니다. 쓸 수 있는 이름: " +
      SLOTS.map(s => s.key).join(" · "));
    return;
  }
  if(!p.src){ bad.push(tag + " 에 src 가 없습니다"); return; }

  /* 자산 경로는 반드시 절대 경로여야 합니다 — 깊은 주소에서 404 가 납니다 */
  if(p.src[0] !== "/")
    bad.push(tag + " 의 경로가 / 로 시작하지 않습니다 (" + p.src + ")");

  const file = path.join(ROOT, p.src.replace(/^\//, ""));
  if(!fs.existsSync(file)){ bad.push(tag + " — 파일이 없습니다: " + p.src); return; }
  used.add(path.relative(ROOT, file));

  const buf = fs.readFileSync(file);
  const kb = Math.round(buf.length / 1024);
  const d = size(buf);

  if(!d){ bad.push(tag + " — 그림 파일이 아닌 것 같습니다 (" + p.src + ")"); return; }
  if(!d.w || !d.h){ bad.push(tag + " — 크기를 못 읽었습니다 (" + d.type + ")"); return; }

  /* ⚠️⚠️ **`temp:true` 는 규격을 낮추는 것이 아닙니다.** 자리에 적힌
     최소 크기는 그대로 두고, **지금 임시 그림이 들어가 있다**는 사실을
     돌릴 때마다 말하게 하는 표시입니다 — 실패로 멈추지는 않지만
     ⚠️ 줄에 계속 뜹니다. 원본이 들어오면 `temp` 를 지우세요.
     ⚠️ 검사를 통과시키려고 `min` 을 내리지 마세요. 그 순간 이 자리의
     품질 기준이 영영 사라집니다. */
  const [mw, mh] = slot.min || [0, 0];
  if(d.w < mw || d.h < mh){
    const msg = tag + " — " + d.w + "×" + d.h + "입니다. 최소 " + mw + "×" + mh +
      " (" + slot.where + ")";
    if(slot.temp) warn.push(msg + "  ← 임시 그림입니다. 원본으로 바꾸세요");
    else bad.push(msg);
  }

  const r = d.w / d.h, [r1, r2] = slot.ratio || [0, 99];
  if(r < r1 || r > r2)
    bad.push(tag + " — 비율 " + r.toFixed(2) + "입니다 (" + r1 + "~" + r2 +
      " 사이라야 덜 잘립니다 · " + slot.where + ")");

  if(kb > (slot.maxKB || 9999))
    bad.push(tag + " — " + kb + "KB 입니다. " + slot.maxKB + "KB 이하로 줄이세요");

  /* ⚠️ 화면이 `<img src>` 하나라 `<picture>` 분기가 없습니다 */
  if(d.type === "webp")
    warn.push(tag + " — WebP 입니다. 되도록 JPEG 로 주세요 (대체 그림 자리가 없습니다)");
  if(d.type === "png" && kb > 100)
    warn.push(tag + " — 사진인데 PNG 입니다 (" + kb + "KB). JPEG 가 훨씬 작습니다");

  /* ⚠️ alt 는 읽어 주는 프로그램과 검색엔진이 봅니다 */
  if(!p.alt || !String(p.alt).trim())
    bad.push(tag + " — alt 가 비어 있습니다");
  else if(String(p.alt).trim().length < 6)
    warn.push(tag + " — alt 가 너무 짧습니다 (" + p.alt + ")");

  ok++;
});

/* 아무도 안 쓰는 파일 — 용량만 차지하고 배포에 같이 올라갑니다 */
const IMG = path.join(ROOT, "img");
if(fs.existsSync(IMG)){
  fs.readdirSync(IMG).forEach(f => {
    if(f[0] === ".") return;
    /* ⚠️ **폴더는 파일이 아닙니다.** img/raw/ (원본 두는 곳)를
       "안 쓰는 파일" 로 잡아서 경고가 났습니다 — 원본은 화면이
       읽지 않는 것이 맞습니다. */
    if(fs.statSync(path.join(IMG, f)).isDirectory()) return;
    const rel = path.join("img", f);
    if(!used.has(rel))
      warn.push(rel + " — WOW_PHOTOS 에 없는 파일입니다 (안 쓰입니다)");
  });
}

/* ── 결과 ───────────────────────────────────────────────────────── */
const n = Object.keys(PHOTOS).length;
console.log("\n── 사진 " + n + "장 · 자리 " + SLOTS.length + "곳");
if(!n){
  console.log("  아직 한 장도 없습니다 — 화면은 글 · 아이콘 짜임새로 갑니다.");
  console.log("  넣는 법은 js/data/photos.js 맨 위에 적어 두었습니다.");
}
SLOTS.forEach(s => {
  if(!PHOTOS[s.key]) console.log("  · " + s.key.padEnd(15) + "비어 있음 — " + s.where);
});
if(warn.length){ console.log("\n⚠️  " + warn.length + "건"); warn.forEach(x => console.log("   " + x)); }
if(bad.length){
  console.log("\n❌ " + bad.length + "건");
  bad.forEach(x => console.log("   " + x));
  console.log("");
  process.exit(1);
}
console.log("\n✅ " + ok + "장 전부 규격에 맞습니다" +
  (warn.length ? " (⚠️ " + warn.length + "건은 봐 주세요)" : ""));
console.log("   ⚠️ 이건 규격 검사입니다. 업종이 드러나는지 · 폐업 쪽이");
console.log("      처연한지는 사람이 봐야 합니다 — tools/shot.js 로 찍어 보세요.\n");
