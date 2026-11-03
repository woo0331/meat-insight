#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   원본 사진을 **자리 규격에 맞춰** 줍니다

   ⚠️⚠️ **앞 서비스(중고폰) 것을 버리고 다시 썼습니다.** 그 판은
   `WOW_PHOTO_SLOTS` 를 읽고 한 자리에 네 파일(`<picture>` 용)을
   냈는데, 지금 화면은 `<img src>` 하나만 읽습니다 — 그대로 돌리면
   **아무 일도 안 일어납니다.** (작업 기억의 "아직 안 한 것" 에 적혀
   있던 자리입니다.)

   하는 일 —
     ① 비율이 자리의 범위 밖이면 **제일 조금** 잘라 범위 안으로 넣습니다
        (가운데를 남깁니다 — 주인공이 가운데 3분의 1에 있다는 전제).
     ② 자리의 최소 크기를 넘기되 **쓸데없이 크게 만들지 않습니다.**
     ③ JPEG 품질을 이분탐색으로 내려 **용량 상한 아래**로 넣습니다.

   ⚠️ 이 도구는 **규격만** 맞춥니다. 골프로 읽히는지 · 글자나 상표가
   들어갔는지 · 얼굴이 알아볼 만한지는 **사람이** 봐야 합니다
   (tools/shot.js 로 찍어 보세요).

   ⚠️⚠️ **원본을 덮어쓰지 않습니다.** `img/raw/` 는 그대로 두고
   나오는 곳에 새로 씁니다. 마음에 안 들면 원본을 바꿔 다시 돌리세요.

   돌리기
     node tools/fit-photos.js                    img/raw/*.jpg → img/
     node tools/fit-photos.js --out img/mock     나오는 곳을 바꿉니다
     node tools/fit-photos.js --inset 14         가장자리를 먼저 깎습니다
     node tools/fit-photos.js --only cat-        이름이 그렇게 시작하는 것만

   ⚠️ `--inset` 은 **시안에서 뽑은 그림**을 위한 것입니다. 카드 모양으로
   잘린 그림은 둥근 모서리와 흰 테두리가 같이 딸려 오는데, 그대로 쓰면
   화면에 **네모 안의 둥근 네모**가 보입니다.
   ════════════════════════════════════════════════════════════════════ */
const fs = require("fs"), path = require("path");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..");
const RAW  = path.join(ROOT, "img", "raw");

function arg(name, dflt){
  const i = process.argv.indexOf(name);
  return (i >= 0 && process.argv[i+1]) ? process.argv[i+1] : dflt;
}
const OUT   = path.join(ROOT, arg("--out", "img"));
const INSET = Number(arg("--inset", "0")) || 0;
const ONLY  = arg("--only", "");

/* 자리 규격은 js/data/photos.js **한 곳**입니다 — 여기 다시 적지 않습니다 */
const w0 = {};
new Function("window", fs.readFileSync(
  path.join(ROOT, "js/components/base.js"), "utf8"))(w0);
new Function("window", fs.readFileSync(
  path.join(ROOT, "js/data/photos.js"), "utf8"))(w0);
const SLOTS = {};
(w0.AM_PHOTO_SLOTS || []).forEach(function(s){ SLOTS[s.key] = s; });

if(!fs.existsSync(RAW)){
  console.error("❌ " + path.relative(ROOT, RAW) + " 가 없습니다 — " +
                "원본을 자리 이름으로 거기에 넣어 주세요 (보기: hero.jpg).");
  process.exit(1);
}
const files = fs.readdirSync(RAW)
  .filter(function(f){ return /\.(jpe?g|png|webp)$/i.test(f); })
  .filter(function(f){ return !ONLY || f.indexOf(ONLY) === 0; })
  .sort();

if(!files.length){
  /* ⚠️ "잴 것이 없다" 고 0 으로 끝나는 도구를 만들지 않습니다 */
  console.error("❌ 맞출 그림이 한 장도 없습니다 — " +
                path.relative(ROOT, RAW) + " 를 보세요" +
                (ONLY ? " (--only " + ONLY + ")" : ""));
  process.exit(1);
}

(async function(){
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{ width: 400, height: 300 } });
  fs.mkdirSync(OUT, { recursive: true });
  let bad = 0, done = 0;

  for(const f of files){
    const key = f.replace(/\.(jpe?g|png|webp)$/i, "");
    const slot = SLOTS[key];
    if(!slot){
      console.log("  ⚠️ " + f + " — 그런 자리가 없습니다 (건너뜁니다). " +
                  "쓸 수 있는 이름: " + Object.keys(SLOTS).join(" · "));
      continue;
    }
    const src = "data:image/jpeg;base64," +
      fs.readFileSync(path.join(RAW, f)).toString("base64");

    const r = await p.evaluate(async function(a){
      const img = new Image();
      await new Promise(function(res, rej){
        img.onload = res; img.onerror = rej; img.src = a.src;
      });
      /* ① 가장자리 깎기 — 시안에서 뽑은 그림의 둥근 모서리 · 흰 테두리 */
      let sx = a.inset, sy = a.inset;
      let sw = img.width - a.inset * 2, sh = img.height - a.inset * 2;
      if(sw < 8 || sh < 8){ sx = sy = 0; sw = img.width; sh = img.height; }

      /* ② 비율을 범위 안으로 — **제일 조금** 자릅니다 */
      const cur = sw / sh;
      let want = cur;
      if(cur < a.rmin) want = a.rmin;
      if(cur > a.rmax) want = a.rmax;
      if(want > cur){            /* 더 넓게 → 위아래를 자릅니다 */
        const nh = Math.round(sw / want);
        sy += Math.round((sh - nh) / 2); sh = nh;
      }else if(want < cur){      /* 더 좁게 → 좌우를 자릅니다 */
        const nw = Math.round(sh * want);
        sx += Math.round((sw - nw) / 2); sw = nw;
      }

      /* ③ 최소 크기를 넘기되 쓸데없이 크게 만들지 않습니다 */
      let k = Math.max(a.minW / sw, a.minH / sh, 1);
      /* 이미 충분히 크면 그대로 두되, 너무 크면 조금 줄입니다 */
      if(k === 1 && sw > a.minW * 2.2) k = (a.minW * 2.2) / sw;
      const dw = Math.max(a.minW, Math.round(sw * k));
      const dh = Math.max(a.minH, Math.round(sh * k));

      const c = document.createElement("canvas");
      c.width = dw; c.height = dh;
      const g = c.getContext("2d");
      g.imageSmoothingQuality = "high";
      g.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);

      /* ④ 용량 상한 아래로 — 품질을 이분탐색합니다 */
      const bytes = function(q){
        const u = c.toDataURL("image/jpeg", q);
        return { n: Math.floor((u.length - u.indexOf(",") - 1) * 3 / 4), u: u };
      };
      let lo = 0.40, hi = 0.95, best = bytes(hi);
      if(best.n > a.maxB){
        for(let i = 0; i < 9; i++){
          const mid = (lo + hi) / 2, t = bytes(mid);
          if(t.n > a.maxB) hi = mid; else { lo = mid; best = t; }
        }
        if(best.n > a.maxB) best = bytes(lo);
      }
      return { w: dw, h: dh, srcW: img.width, srcH: img.height,
               up: +(k).toFixed(2), bytes: best.n,
               data: best.u.slice(best.u.indexOf(",") + 1) };
    }, { src: src, inset: INSET,
         rmin: slot.ratio[0], rmax: slot.ratio[1],
         minW: slot.min[0], minH: slot.min[1],
         maxB: slot.maxKB * 1024 });

    const outF = path.join(OUT, key + ".jpg");
    fs.writeFileSync(outF, Buffer.from(r.data, "base64"));
    const kb = Math.round(r.bytes / 1024);
    const over = r.bytes > slot.maxKB * 1024;
    if(over) bad++;
    done++;
    console.log("  " + (over ? "❌" : "✅") + " " + key.padEnd(16) +
      r.srcW + "x" + r.srcH + " → " + r.w + "x" + r.h +
      "  비율 " + (r.w / r.h).toFixed(2) +
      "  " + kb + "KB" + (over ? " (상한 " + slot.maxKB + "KB 를 넘습니다)" : "") +
      /* ⚠️⚠️ **늘린 것은 늘렸다고 말합니다.** 조용히 늘리면 뿌연 그림이
         규격만 맞춘 채로 배포됩니다 — 그게 제일 나쁜 꼴입니다. */
      (r.up > 1.05 ? "  ⚠️ 원본보다 " + r.up + "배 늘렸습니다 (뿌옇습니다)" : ""));
  }

  await p.close(); await b.close();
  console.log("\n" + done + "장을 " + path.relative(ROOT, OUT) + " 에 냈습니다" +
              (bad ? " · ❌ " + bad + "장이 용량 상한을 넘습니다" : ""));
  console.log("   다음: node tools/check-photos.js  →  node tools/test-photos.js");
  process.exit(bad ? 1 : 0);
})().catch(function(e){
  console.error("❌ " + e.message);
  process.exit(1);
});
