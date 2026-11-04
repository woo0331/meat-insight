#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   화면 크기마다 **맞는 크기의 사진**을 만듭니다 — tools/make-sizes.js

     node tools/make-sizes.js            만듭니다
     node tools/make-sizes.js --check    지금 파일이 맞는지만 봅니다

   ⚠️⚠️⚠️ **없는 또렷함을 만들어 낼 수는 없습니다.** 이 도구가 하는
   일은 둘뿐입니다 —
     ① 원본보다 **작게** 쓰는 자리에 **미리 줄여 둔 파일**을 냅니다.
        브라우저가 800px 그림을 108px 로 욱여넣는 것보다, 미리
        250px 로 줄이면서 살짝 또렷하게 만든 것이 **더 또렷합니다.**
     ② 폰이 PC 용 큰 파일을 받지 않게 합니다 (히어로 307KB → 60KB).
   ⚠️ **원본보다 크게 만들지 않습니다.** 늘리면 용량만 커지고 뿌옇습니다
   — 더 또렷해지려면 **원본 사진**이 와야 합니다 (img/README.md).

   ⚠️⚠️ 자리 · 규격은 `js/data/photos.js` 의 `AM_PHOTO_SLOTS` **한 곳**
   입니다. 여기에 다시 적지 않습니다. 만들 폭만 여기서 정합니다.

   ⚠️ 만든 파일은 `js/data/photos.js` 의 `jpg` 줄(srcset)에 적습니다 —
   `tools/check-photos.js` 가 **그 줄과 실제 파일이 같은지** 봅니다
   (적어 두고 안 만들거나, 만들고 안 적으면 거기서 멈춥니다).
   ════════════════════════════════════════════════════════════════════ */
const fs = require("fs"), path = require("path");
const { execFileSync } = require("child_process");
const ROOT = path.join(__dirname, "..");
const OUT  = path.join(ROOT, "img", "sizes");

/* ⚠️⚠️⚠️ **만들 폭을 여기 적지 않습니다.** `js/data/photos.js` 의
   `AM_PHOTO_SIZES` 한 곳에서 읽습니다 — 두 곳에 적으면 한쪽만 고치는
   날 **srcset 이 없는 파일을 가리킵니다** (404 가 나고 브라우저는
   조용히 원본을 써서, 아무도 모르는 채로 폰이 PC 용 파일을 받습니다). */
function planFor(W, key){
  const sp = W.amPhotoSpec ? W.amPhotoSpec(key) : null;
  return sp && Array.isArray(sp.make) ? sp.make : null;
}

/* 그림 머리글에서 가로 · 세로 — ⚠️ 라이브러리를 들이지 않습니다
   (check-photos.js 와 같은 방식입니다). */
function size(buf){
  if(buf[0] === 0xFF && buf[1] === 0xD8){
    let i = 2;
    while(i < buf.length){
      if(buf[i] !== 0xFF){ i++; continue; }
      const m = buf[i+1];
      if(m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC)
        return { w: buf.readUInt16BE(i+7), h: buf.readUInt16BE(i+5) };
      i += 2 + buf.readUInt16BE(i+2);
    }
  }
  return null;
}

const W = { esc: function(x){ return String(x); } };
new Function("window", fs.readFileSync(path.join(ROOT, "js/data/photos.js"), "utf8"))(W);
const PHOTOS = W.AM_PHOTOS || {};

const check = process.argv.indexOf("--check") >= 0;
let made = 0, kept = 0, bad = 0;
if(!check && !fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

Object.keys(PHOTOS).forEach(function(key){
  const p = PHOTOS[key];
  if(!p || !p.src) return;
  const widths = planFor(W, key);
  if(!widths) return;
  const src = path.join(ROOT, p.src.split("?")[0].replace(/^\//, ""));
  if(!fs.existsSync(src)){ console.log("  ❌ " + key + " — 원본이 없습니다"); bad++; return; }
  const d = size(fs.readFileSync(src));
  if(!d){ console.log("  ❌ " + key + " — 가로 · 세로를 못 읽었습니다"); bad++; return; }
  const srcKB = fs.statSync(src).size / 1024;

  widths.forEach(function(w){
    /* ⚠️ 원본보다 크게 만들지 않습니다 (늘리면 뿌옇기만 합니다) */
    if(w >= d.w) return;
    /* ⚠️ 이름은 **원본 파일 이름**에서 뽑습니다 (photos.js 의
       amPhotoSizeSrc 와 같은 규칙입니다 — 두 곳이 어긋나면 srcset 이
       없는 파일을 가리킵니다). */
    const dst = path.join(ROOT, W.amPhotoSizeSrc(p.src, w).replace(/^\//, ""));
    if(check){
      if(!fs.existsSync(dst)){ console.log("  ❌ 없습니다: " + path.relative(ROOT, dst)); bad++; }
      else kept++;
      return;
    }
    /* ⚠️⚠️ **줄이면서 살짝 또렷하게** 합니다 (unsharp). 줄이면 반드시
       물러지므로 그만큼만 되돌립니다 — 세게 걸면 테두리에 흰 띠가
       생깁니다 (사람이 봐야 압니다 · 찍어 보세요).
       ⚠️⚠️⚠️ **용량을 원본에 맞춥니다.** 처음에 품질을 84 로 박아
       두었더니 **1900px 파일이 2400px 원본보다 무거웠습니다**
       (465KB vs 307KB) — 작은 화면이 더 많이 받는 꼴입니다.
       그래서 원본의 점당 용량에 맞춰 **예산**을 잡고, 그 안에 들어올
       때까지 품질을 낮춥니다 (`tools/fit-photos.js` 와 같은 방식). */
    const budget = Math.min(
      srcKB,                                  /* 원본보다 무겁지 않게 */
      Math.round(srcKB * Math.pow(w / d.w, 1.8)) + 4);
    let q = 90, kb = 0;
    for(let i = 0; i < 9; i++){
      execFileSync("convert", [src,
        "-colorspace", "sRGB",
        "-filter", "Lanczos", "-resize", String(w) + "x",
        "-unsharp", "0x0.75+0.55+0.008",
        "-sampling-factor", "4:2:0", "-strip",
        "-interlace", "JPEG", "-quality", String(q), dst]);
      kb = fs.statSync(dst).size / 1024;
      if(kb <= budget || q <= 62) break;
      q -= 4;
    }
    console.log("   " + path.basename(dst).padEnd(26) +
      Math.round(kb) + "KB (예산 " + budget + "KB · 품질 " + q + ")");
    made++;
  });
});

if(check){
  console.log("\n── 크기별 사진 " + kept + "장 확인 · 없는 것 " + bad + "건");
  process.exit(bad ? 1 : 0);
}
console.log("\n── 크기별 사진 " + made + "장을 만들었습니다 (img/sizes/)");
console.log("   ⚠️ js/data/photos.js 의 jpg 줄과 맞는지는 " +
            "node tools/check-photos.js 가 봅니다.");
