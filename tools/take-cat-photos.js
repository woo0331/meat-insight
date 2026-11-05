#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   분류 사진 열 장을 **받아서 자리에 넣습니다** — tools/take-cat-photos.js

     node tools/take-cat-photos.js <받은 폴더>
     node tools/take-cat-photos.js <받은 폴더> --go     실제로 넣습니다

   ⚠️ `--go` 없이 돌리면 **재기만** 합니다 (아무것도 안 건드립니다).

   왜 이 도구가 있는가
   ───────────────────────────────────────────────────────────────────
   사진을 만들어 주는 쪽은 `golf-lesson` 처럼 **제 이름**으로 줍니다.
   우리 자리 이름은 `cat-lesson` 이고 짝이 하나도 안 맞는 것이 셋
   있습니다 —

       golf-equipment   → cat-market      (골프용품 마켓)
       used-golf-market → cat-used        (중고 골프장터)
       golf-practice    → cat-range       (골프 연습장)
       golf-join        → cat-matchup     (골프 조인)
       golf-business    → cat-career      (골프 인력 · 비즈니스)

   손으로 옮기면 **엉뚱한 사진이 엉뚱한 카드에** 앉습니다. 에러는 안
   납니다 — 골프 사진이 골프 카드에 있으니까요. 그래서 짝을 코드에
   적어 두고 도구가 옮깁니다.

   ⚠️⚠️⚠️ **이 도구가 못 보는 것 둘** — 사람이 봐야 합니다.
     ① **상표 · 글자** (2026-11-04 에 받은 열 장 가운데 **둘**에서
        나왔습니다 — 모자 앞판의 Titleist · 골프백의 같은 글씨).
        만든 쪽 프롬프트에 `no logo` 가 분명히 적혀 있었는데도 그랬습니다.
        ⚠️ **카드 크기(112~168px)에서는 안 읽힙니다.** 원본을 100% 로
        열어서 보셔야 합니다. 이 도구가 끝에 그 명령을 찍어 줍니다.
     ② **골프로 읽히는가 · 얼굴이 알아볼 만한가.**
   그래서 이 도구는 `img/raw/` 까지만 넣고 **멈춥니다** — 사람이 보고
   나서 `fit-photos` 를 돌리십니다.
   ════════════════════════════════════════════════════════════════════ */
"use strict";
const fs = require("fs"), path = require("path");
const { execFileSync } = require("child_process");
const ROOT = path.join(__dirname, "..");

/* ⚠️⚠️ **짝은 여기 한 곳**입니다. `AM_CATS` 의 key 에서 자리 이름을
   지으므로(`cat-<key>`), 받는 쪽 이름만 적습니다. */
const PAIR = {
  "golf-lesson":         "lesson",
  "used-golf-market":    "used",
  "golf-booking":        "booking",
  "golf-join":           "matchup",
  "golf-practice":       "range",
  "golf-equipment":      "market",
  "golf-fitting-repair": "fitting",
  "golf-travel":         "travel",
  "golf-business":       "career",
  "golf-community":      "community"
};

/* ── 자리 규격은 `js/data/photos.js` 한 곳에서 읽습니다 ──────────────
   ⚠️ 여기 다시 적으면 한쪽만 고치는 날 조용히 어긋납니다. */
const W = { esc: function(x){ return String(x); } };
new Function("window", fs.readFileSync(path.join(ROOT, "js/data/photos.js"), "utf8"))(W);
const SLOT = {};
(W.AM_PHOTO_SLOTS || []).forEach(function(s){ SLOT[s.key] = s; });

/* ── 카드 액자 비율 — ⚠️⚠️ **CSS 한 곳**에서 읽습니다 ───────────────
   사진이 액자와 같은 비율이 아니면 `object-fit:cover` 가 넘치는 쪽을
   잘라냅니다. 그 "얼마나 잘리는가" 를 말해 주려면 액자 비율이
   필요한데, 그 값은 `css/app.css` 의 `.cat-ph` 에 있습니다.
   ⚠️ 여기 숫자를 베껴 적으면 디자인을 바꾸는 날 **조용히 어긋납니다** —
   이 도구만 옛 비율로 재면서 "안 잘립니다" 라고 합니다. 그래서 읽고,
   못 읽으면 **멈춥니다** (어림짐작으로 재지 않습니다). */
const FRAME = (function(){
  const css = fs.readFileSync(path.join(ROOT, "css/app.css"), "utf8");
  const at  = css.indexOf(".cat-ph{");
  if(at < 0) return null;
  const blk = css.slice(at, css.indexOf("}", at));
  const k   = blk.indexOf("aspect-ratio:");
  if(k < 0) return null;
  const nums = blk.slice(k, blk.indexOf(";", k)).match(/[0-9]+(?:\.[0-9]+)?/g);
  if(!nums || !nums.length) return null;
  return nums.length >= 2 ? (parseFloat(nums[0]) / parseFloat(nums[1]))
                          : parseFloat(nums[0]);
})();
if(!FRAME || !isFinite(FRAME)){
  console.log("❌ css/app.css 의 .cat-ph 에서 액자 비율(aspect-ratio)을 못 읽었습니다.");
  console.log("   그 값이 있어야 '카드에서 몇 %가 잘리는지' 를 말할 수 있습니다 —");
  console.log("   어림짐작으로 재지 않고 여기서 멈춥니다.");
  process.exit(2);
}

/* 그림 머리글에서 가로 · 세로 — jpg · png · webp 셋 (라이브러리 없이) */
function size(buf){
  if(buf[0] === 0xFF && buf[1] === 0xD8){            /* jpg */
    let i = 2;
    while(i < buf.length){
      if(buf[i] !== 0xFF){ i++; continue; }
      const m = buf[i+1];
      if(m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC)
        return { w: buf.readUInt16BE(i+7), h: buf.readUInt16BE(i+5) };
      i += 2 + buf.readUInt16BE(i+2);
    }
    return null;
  }
  if(buf.slice(0,8).toString("hex") === "89504e470d0a1a0a")  /* png */
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  if(buf.slice(0,4).toString() === "RIFF" && buf.slice(8,12).toString() === "WEBP"){
    const t = buf.slice(12,16).toString();
    if(t === "VP8X") return { w: buf.readUIntLE(24,3) + 1, h: buf.readUIntLE(27,3) + 1 };
    if(t === "VP8 ") return { w: buf.readUInt16LE(26) & 0x3FFF,
                              h: buf.readUInt16LE(28) & 0x3FFF };
    if(t === "VP8L"){
      const b = buf.readUInt32LE(21);
      return { w: (b & 0x3FFF) + 1, h: ((b >> 14) & 0x3FFF) + 1 };
    }
  }
  return null;
}

/* 또렷함 — ⚠️⚠️ **실제로 그려지는 폭으로 줄인 뒤** 잽니다. 원본에서
   재면 "픽셀이 큰 것" 과 "또렷한 것" 을 구별하지 못합니다 (늘려 놓은
   파일이 늘 이깁니다 — 2026-11-04 에 그래서 한 번 속았습니다). */
function sharp(file, atW){
  try{
    const v = execFileSync("convert", [file,
      "-resize", String(atW) + "x", "-colorspace", "Gray",
      "-define", "convolve:scale=!", "-morphology", "Convolve", "Laplacian:0",
      "-format", "%[fx:standard_deviation*255]", "info:"], { encoding: "utf8" });
    return Math.round(parseFloat(v) * 100) / 100;
  }catch(e){ return null; }
}

/* 밝기와 색 치우침 — 의뢰 기준 §4 의 "지나치게 어두운 사진 금지" ·
   "과도한 녹색 필터 금지" · "사진마다 밝기와 색온도를 통일" 을 **재는**
   자리입니다. 눈으로만 보면 열 장을 나란히 놓고 봐야 알 수 있고,
   한 장씩 받으면 영영 안 드러납니다.
   ⚠️ 작게 줄여서 잽니다 — 카드에서 보이는 것은 뭉친 색이지 점 하나가
   아닙니다. */
function tone(file){
  try{
    const v = execFileSync("convert", [file,
      "-colorspace", "sRGB", "-resize", "200x",
      "-format", "%[fx:mean*255] %[fx:mean.r*255] %[fx:mean.g*255] %[fx:mean.b*255]",
      "info:"], { encoding: "utf8" }).trim().split(/\s+/).map(Number);
    if(v.length < 4 || v.some(isNaN)) return null;
    return {
      mean: v[0], r: v[1], g: v[2], b: v[3],
      /* 녹색 치우침 — 초록이 빨강 · 파랑의 가운데보다 얼마나 높은가.
         ⚠️ 골프는 잔디라 **양수가 정상**입니다. 문제는 "필터를 건 것처럼"
         높은 경우뿐입니다. */
      cast: v[2] - (v[1] + v[3]) / 2
    };
  }catch(e){ return null; }
}

/* ⚠️⚠️ **오늘 받은 사진에 맞춰 숫자를 정하지 않습니다.** 그러면 다음에
   오는 사진을 재는 것이 아니라 오늘 것을 설명하는 숫자가 됩니다.
   아래 둘은 **뜻에서 나온 값**입니다 —
     DARK  255 의 4분의 1. 그보다 어두우면 108px 카드에서 형체가 아니라
           **검은 덩이**로 보입니다.
     CAST  잔디가 많은 사진도 +25 안쪽입니다 (지금 열 장: +2.5 ~ +23.2).
           그보다 높으면 피사체가 아니라 **필터**가 만든 초록입니다.
   ⚠️ 통일은 **절대값으로 잴 수 없습니다** (낮 사진과 실내 사진은 원래
   다릅니다). 그래서 한 장씩 잡지 않고 **열 장의 폭**을 봅니다. */
const DARK   = 64;
const CAST   = 35;
const SPREAD = 60;

const dir = process.argv[2];
const go  = process.argv.indexOf("--go") >= 0;
if(!dir){
  console.log("쓰는 법: node tools/take-cat-photos.js <받은 폴더> [--go]");
  process.exit(2);
}
if(!fs.existsSync(dir)){
  console.log("❌ 그런 폴더가 없습니다: " + dir);
  process.exit(2);
}

const have = fs.readdirSync(dir);
let ok = 0, miss = 0, bad = 0;
const took = [];
const tones = [];

console.log("받은 폴더: " + dir + (go ? "   (실제로 넣습니다)" : "   (재기만 합니다)"));
console.log("");

Object.keys(PAIR).forEach(function(give){
  const key  = "cat-" + PAIR[give];
  const slot = SLOT[key];
  if(!slot){
    /* ⚠️ 자리가 없어진 분류를 짝에 남겨 두면, 사진을 넣었는데 아무
       화면에도 안 나오면서 아무 에러도 안 납니다. */
    console.log("  ❌ " + give + " — 우리 자리 '" + key + "' 가 없습니다 " +
                "(js/data/photos.js 의 AM_PHOTO_SLOTS 와 이 도구의 PAIR 가 어긋났습니다)");
    bad++; return;
  }

  /* 확장자는 무엇이 와도 받습니다 */
  const hit = have.filter(function(f){
    return f.replace(/\.[A-Za-z0-9]+$/, "").toLowerCase() === give;
  });
  if(!hit.length){ console.log("  ·  " + give.padEnd(20) + "— 아직 안 왔습니다"); miss++; return; }

  const src = path.join(dir, hit[0]);
  const buf = fs.readFileSync(src);
  const d   = size(buf);
  if(!d){ console.log("  ❌ " + hit[0] + " — 그림 크기를 못 읽었습니다"); bad++; return; }

  const r    = d.w / d.h;
  const [r1, r2] = slot.ratio || [0, 99];
  const kb   = Math.round(buf.length / 1024);
  /* 분류 카드가 **실제로 그려지는 폭** — 3배 화면 폰이 가장 큽니다
     (`AM_PHOTO_SIZES` 의 주석에 잰 값이 있습니다). */
  const sh   = sharp(src, 450);
  const tn   = tone(src);

  /* ⚠️⚠️ 잘려 나가는 몫 — **액자 비율은 CSS 한 곳**에서 읽습니다
     (FRAME). 여기 숫자를 다시 적으면 디자인을 바꾸는 날 조용히
     어긋나서, 멀쩡한 사진을 "잘립니다" 라고 하거나 그 반대가 됩니다. */
  const shown = (r > FRAME) ? (FRAME / r) : (r / FRAME);
  const cut   = Math.round((1 - shown) * 100);

  /* ⚠️ 두 가지를 **갈라서** 적습니다 —
       ① 자리 규격(최소 800x450 · 비율 1.4~2.0) — 넘으면 빌드가 멈춥니다
       ② 의뢰서가 요구한 것(가로 1600px 이상 · 액자와 같은 비율)
     ②만 못 지키면 빌드는 돌지만 **또렷하지 않거나 잘려 나갑니다.**
     자리 규격만 보면 "통과" 인데 의뢰한 것은 못 받은 꼴이 됩니다. */
  const notes = [];
  if(d.w < 1600) notes.push("가로 " + d.w + "px — 의뢰서는 1600px 이상입니다 (2400 권장)");
  if(cut >= 3) notes.push("비율 " + r.toFixed(2) + " — 카드에서 " + cut +
    "% 가 잘립니다 (액자가 " + FRAME.toFixed(2) + " 입니다 · 16:9 면 0%)");
  if(r < r1 || r > r2) notes.push("⚠️ 비율이 자리 규격(" + r1 + "~" + r2 +
    ") 밖입니다 — fit-photos 가 먼저 한 번 더 잘라냅니다");
  if(tn && tn.mean < DARK) notes.push("⚠️ 너무 어둡습니다 (밝기 " +
    Math.round(tn.mean) + " · " + DARK + " 아래) — 작은 카드에서 검은 덩이로 보입니다");
  if(tn && tn.cast > CAST) notes.push("⚠️ 초록이 과합니다 (치우침 +" +
    Math.round(tn.cast) + " · " + CAST + " 위) — 잔디가 아니라 필터로 보입니다");
  if(tn) tones.push({ key: key, give: give, mean: tn.mean, cast: tn.cast });

  console.log("  " + (notes.length ? "⚠️ " : "✅ ") + give.padEnd(20) +
    "→ " + key.padEnd(14) + d.w + "x" + d.h +
    "  비율 " + r.toFixed(2) + "  " + kb + "KB" +
    (sh === null ? "" : "  또렷함 " + sh) +
    (tn === null ? "" : "  밝기 " + Math.round(tn.mean) +
                        "  초록 " + (tn.cast >= 0 ? "+" : "") + Math.round(tn.cast)) +
    "  보이는 몫 " + Math.round(shown * 100) + "%");
  notes.forEach(function(n){ console.log("        " + n); });

  if(go){
    /* ⚠️⚠️ `img/raw/` 까지만 넣습니다 — 규격 맞추기(`fit-photos`)는
       **사람이 상표를 보고 나서** 돌리십니다. */
    const dst = path.join(ROOT, "img", "raw", key + path.extname(hit[0]).toLowerCase());
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    took.push(path.relative(ROOT, dst));
  }
  ok++;
});

/* ── 열 장을 **나란히 놓고** 봐야 드러나는 것 ────────────────────
   ⚠️⚠️ 의뢰 기준 §4 의 "사진마다 밝기와 색온도를 통일" 은 **한 장씩
   보면 영영 안 드러납니다.** 어느 한 장도 틀리지 않았는데 열 장을
   카드로 늘어놓으면 들쭉날쭉한 꼴이 됩니다.
   ⚠️ 그래서 절대값으로 한 장을 잡지 않고 **폭**을 봅니다 (낮 사진과
   실내 사진은 원래 다릅니다 — 다른 것이 잘못은 아닙니다). */
let spreadBad = 0;
if(tones.length >= 2){
  const ms = tones.map(function(t){ return t.mean; });
  const lo = Math.min.apply(null, ms), hi = Math.max.apply(null, ms);
  const spread = hi - lo;
  const dark = tones.slice().sort(function(a, b){ return a.mean - b.mean; })[0];
  const lite = tones.slice().sort(function(a, b){ return b.mean - a.mean; })[0];
  console.log("");
  console.log("── 열 장을 나란히 놓고 (의뢰 기준 §4 — 밝기 · 색온도 통일)");
  console.log("   밝기 폭 " + Math.round(spread) +
    "   가장 어두운 " + dark.give + " " + Math.round(dark.mean) +
    " · 가장 밝은 " + lite.give + " " + Math.round(lite.mean));
  if(spread > SPREAD){
    spreadBad = 1;
    console.log("   ⚠️⚠️ 폭이 " + SPREAD + " 을 넘습니다 — 카드 열 장이 제각각으로 보입니다.");
    console.log("      ⚠️ 한 장씩은 다 멀쩡합니다. **늘어놓아야** 보이는 자리입니다 —");
    console.log("         어두운 쪽을 다시 만들거나 밝기를 맞춰 달라고 하세요.");
  }else{
    console.log("   ✅ 고르게 들어왔습니다");
  }
}

console.log("");
console.log("── 짝이 맞은 것 " + ok + "장 · 아직 안 온 것 " + miss + " · 못 읽은 것 " + bad);

if(!ok && !miss && !bad){
  /* ⚠️ "잴 것이 없으면 0 으로 끝나는 검사" 를 만들지 않습니다 */
  console.log("❌ 아무것도 안 봤습니다 — PAIR 가 비었습니까?");
  process.exit(1);
}

if(go && took.length){
  console.log("\n   넣었습니다: img/raw/ " + took.length + "장");
  console.log("\n⚠️⚠️⚠️ **여기서 멈추십니다. 사람이 볼 차례입니다.**");
  console.log("   도구가 재는 것은 크기 · 비율 · 또렷함 · 밝기까지입니다.");
  console.log("   아래 셋은 **사람만** 볼 수 있습니다 (의뢰 기준 §5).");
  console.log("");
  console.log("   ① 상표 · 글자 — 원본 100% 로 보세요. 카드 크기에서는 안 읽힙니다:");
  took.forEach(function(f){ console.log("        display " + f); });
  console.log("      ⚠️ 특히 모자 앞판 · 상의 가슴 · 골프백 · 클럽 헤드 ·");
  console.log("         진열대 · 노트북 · 실내 스크린 (지난번에 모자와 백에서 나왔습니다)");
  console.log("   ② 골프로 읽히는가 · 얼굴 · 손 · 장비 모양이 자연스러운가");
  console.log("   ③ 상업적 이용 권리 — 생성 도구명 · 날짜 · 약관 근거를");
  console.log("      **img/CREDITS.md 에 적어 두세요** (생성형이라고 권리가");
  console.log("      자동으로 보장되지 않습니다).");
  console.log("");
  console.log("   보고 나서:");
  console.log("        node tools/fit-photos.js --out img/mock --only cat-");
  console.log("        node tools/make-sizes.js");
  console.log("        node tools/ship.js");
  console.log("   ⚠️⚠️ 2400x1350 이 들어오면 규격을 맞춘 결과가 **1760x990** 입니다.");
  console.log("      js/data/photos.js 의 AM_PHOTO_SIZES[cat-*] 를 w:1760 h:990 으로");
  console.log("      고치고 make 에 중간 폭을 하나 더 넣으셔야 합니다 — 안 고치면");
  console.log("      큰 화면이 560px 다음으로 **원본을 통째로** 받습니다.");
}else if(!go && ok){
  console.log("\n   넣으시려면: node tools/take-cat-photos.js " + dir + " --go");
}
process.exit((bad || spreadBad) ? 1 : 0);
