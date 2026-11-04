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
let made = 0, kept = 0, bad = 0, heavy = 0;
const heavyList = [];
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

  /* ⚠️⚠️ **webp 는 원본 폭까지** 찍습니다 (`img/mock/` 에는 jpg 만
     있으므로, 원본 폭이 빠지면 큰 화면이 작은 변형을 늘려 써서
     jpg 쪽보다 뿌옇습니다 — 고르는 쪽은 브라우저이고 에러는 없습니다).
     `js/data/photos.js` 의 `amPhotoSrcset(key,"webp")` 가 같은 규칙으로
     주소를 짓습니다 — 두 곳이 어긋나면 404 입니다. */
  const sp = W.amPhotoSpec ? W.amPhotoSpec(key) : null;
  const small = widths.filter(function(w){ return w < d.w; });
  let plan = small.map(function(w){ return { w: w, ext: "jpg" }; });
  /* ⚠️ `noWebp` 인 자리는 **아예 안 찍습니다** — photos.js 의
     `amPhotoSrcset(key,"webp")` 도 같은 칸을 보고 `<source>` 를 안
     답니다 (두 곳이 어긋나면 404 이거나, 적어 두고 안 만든 파일입니다). */
  if(!(sp && sp.noWebp))
    plan = plan.concat(small.concat([d.w])
      .map(function(w){ return { w: w, ext: "webp" }; }));

  plan.forEach(function(job){
    const w = job.w, ext = job.ext;
    /* ⚠️ 이름은 **원본 파일 이름**에서 뽑습니다 (photos.js 의
       amPhotoSizeSrc 와 같은 규칙입니다 — 두 곳이 어긋나면 srcset 이
       없는 파일을 가리킵니다). */
    const dst = path.join(ROOT, W.amPhotoSizeSrc(p.src, w, ext).replace(/^\//, ""));
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
    let budget = Math.min(
      srcKB,                                  /* 원본보다 무겁지 않게 */
      Math.round(srcKB * Math.pow(w / d.w, 1.8)) + 4);
    /* ⚠️⚠️⚠️ **webp 의 예산은 같은 폭 jpg 가 나온 용량**입니다.
       webp 를 내려보내는 까닭은 "같은 눈높이를 더 적은 용량으로" 이고,
       그러려면 짝이 되는 jpg 보다 **반드시 가벼워야** 합니다 — 무거운
       쪽을 내려보내면 손님은 더 많이 받고 화질은 그대로입니다.
       ⚠️ 원본 폭(변형이 아닌 자리)의 짝은 **원본 jpg 그 자신**입니다. */
    let twinKB = 0;
    if(ext === "webp"){
      const twin = (w >= d.w) ? src
        : path.join(ROOT, W.amPhotoSizeSrc(p.src, w, "jpg").replace(/^\//, ""));
      if(fs.existsSync(twin)){
        twinKB = fs.statSync(twin).size / 1024;
        budget = Math.min(budget, twinKB);
      }
    }
    /* ⚠️ webp 는 같은 숫자에서 jpg 보다 덜 뭉갭니다 — 그래서 **같은
       용량 예산 안에서 품질 숫자를 더 높게** 가져갈 수 있습니다.
       바닥을 낮게 둔 것은 webp 바닥(q48)이 jpg 바닥(q62)보다 눈에
       덜 띠기 때문입니다. */
    const q0 = (ext === "webp") ? 86 : 90;
    const qF = (ext === "webp") ? 48 : 62;
    let q = q0, kb = 0;
    for(let i = 0; i < 12; i++){
      const args = [src, "-colorspace", "sRGB", "-filter", "Lanczos"];
      /* ⚠️ 원본 폭이면 **크기를 건드리지 않습니다** (줄일 것이 없습니다
         — 넣으면 Lanczos 와 unsharp 가 괜히 한 번 더 돕니다). */
      if(w < d.w) args.push("-resize", String(w) + "x",
                            "-unsharp", "0x0.75+0.55+0.008");
      args.push("-strip");
      if(ext === "jpg") args.push("-sampling-factor", "4:2:0", "-interlace", "JPEG");
      args.push("-quality", String(q), dst);
      execFileSync("convert", args);
      kb = fs.statSync(dst).size / 1024;
      if(kb <= budget || q <= qF) break;
      q -= 4;
    }
    /* ⚠️⚠️⚠️ **예산을 넘은 것과 규칙을 어긴 것은 다릅니다.**
       위의 `budget` 은 품질 숫자를 고르기 위한 **목표**이고 (원본의
       점당 용량에서 어림한 값입니다), 반드시 지켜야 하는 **규칙**은
       둘뿐입니다 —
         ① 변형이 **원본보다 무겁지 않다**
         ② webp 가 **같은 폭 jpg 보다 무겁지 않다** (그래야 바꿀 뜻이
            있습니다)
       목표로 재면 **멀쩡한 줄을 고장이라고** 합니다: 히어로 원본이
       품질 45 로 저장돼 있어 점당 용량이 아주 낮고, 그래서 어림값이
       품질 62 로도 못 닿는 값을 냅니다 — 그런데 900 · 1200 · 1400 ·
       1900 이 81 · 139 · 181 · 294KB 로 **차례도 맞고 원본(307KB)보다
       가볍습니다.** 멀쩡합니다.
       ⚠️ 작업 기억의 "검사가 멀쩡한 것을 고장이라고 한 자리" 입니다. */
    const limit = (ext === "webp" && twinKB) ? twinKB : srcKB;
    const over = kb > limit + 0.5;
    console.log("   " + (over ? "⚠️ " : "   ") + path.basename(dst).padEnd(28) +
      Math.round(kb) + "KB (목표 " + Math.round(budget) + "KB · 품질 " + q +
      (over ? " · ⚠️ 한도 " + Math.round(limit) + "KB 를 넘었습니다" : "") + ")");
    if(over){ heavy++; heavyList.push(path.basename(dst)); }
    made++;
  });
});

if(check){
  console.log("\n── 크기별 사진 " + kept + "장 확인 · 없는 것 " + bad + "건");
  process.exit(bad ? 1 : 0);
}
console.log("\n── 크기별 사진 " + made + "장을 만들었습니다 (img/sizes/)");
if(heavy){
  console.log("   ⚠️⚠️ " + heavy + "장이 한도를 넘었습니다: " + heavyList.join(" · "));
  console.log("      webp 가 짝 jpg 보다 무겁다면 그 자리는 `noWebp:true` 로 " +
              "꺼 두세요 (`js/data/photos.js` 의 AM_PHOTO_SIZES) — 까닭을 " +
              "**잰 값과 함께** 적어 두셔야 다음 차수가 다시 켭니다.");
  process.exit(1);
}
console.log("   ⚠️ js/data/photos.js 의 jpg 줄과 맞는지는 " +
            "node tools/check-photos.js 가 봅니다.");
