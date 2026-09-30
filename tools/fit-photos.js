#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   원본 사진을 자리 규격에 맞춰 줍니다 (playwright 필요)

     원본을 img/raw/ 에 자리 이름으로 넣고 —
       img/raw/hero-start.jpg
       img/raw/brand-scene.png
     그 다음에

     node tools/fit-photos.js          # 맞춰서 img/ 에 jpg 로 냅니다
     node tools/fit-photos.js --write  # photos.js 의 WOW_PHOTOS 까지 적어 줍니다
     node tools/fit-photos.js --webp   # webp 로 (더 곱지만 옛 브라우저에서 안 뜹니다)

   ⚠️ **왜 필요한가** — 자리마다 최소 크기 · 비율 범위 · 용량 상한이
   따로 있고 자리가 열넷입니다. 손으로 맞추면 하나씩 어긋나고, 어긋난
   것은 `tools/check-photos.js` 가 잡아 주지만 다시 만들어야 합니다.

   ⚠️ **원본을 덮어쓰지 않습니다.** `img/raw/` 는 그대로 두고 `img/` 에
   새로 냅니다. 마음에 안 들면 원본을 바꿔서 다시 돌리시면 됩니다.
   ⚠️ `img/raw/` 는 화면이 읽지 않습니다 — 올리지 않으셔도 됩니다.

   하는 일 —
     ① 비율이 범위 밖이면 **제일 조금** 잘라서 범위 안으로 넣습니다.
        `anchor`(left · right · center)를 보고 남길 쪽을 고릅니다.
     ② 최소 크기를 넘기되 너무 크지 않게 줄입니다. **원본보다 키우지
        않습니다** — 키우면 뿌옇게 되고, 그건 규격을 맞춘 것이 아닙니다.
     ③ webp 품질을 오르내리며 **용량 상한 아래**로 넣습니다.

   ⚠️ 이 도구는 **규격만** 맞춥니다. 업종이 드러나는지 · 폐업 쪽이
   처연한지 · 저작권이 깨끗한지는 사람이 봐야 합니다.
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const http = require("http"), fs = require("fs"), path = require("path");

const ROOT = process.cwd();
const RAW  = path.join(ROOT, "img", "raw");
const OUT  = path.join(ROOT, "img");
const WRITE = process.argv.includes("--write");
/* ⚠️ **기본은 JPEG 입니다.** 화면은 `<img src>` 하나라 `<picture>` 분기가
   없어서, WebP 를 못 읽는 브라우저(옛 사파리 등)에서는 **사진이 그냥 안
   나옵니다.** `tools/check-photos.js` 도 그래서 JPEG 를 권합니다.
   같은 용량에 더 곱게 넣고 싶으시면 `--webp` 를 붙이세요. */
const WEBP  = process.argv.includes("--webp");
const TYPE  = WEBP ? "image/webp" : "image/jpeg";
const EXTO  = WEBP ? ".webp" : ".jpg";

/* 자리 목록은 js/data/photos.js 한 곳에서 옵니다 — 여기에 옮겨 적지
   않습니다. 자리를 늘리면 거기만 고치면 이 도구가 따라옵니다. */
const W = {};
(function(){
  const src = fs.readFileSync(path.join(ROOT, "js/data/photos.js"), "utf8");
  const fn = new Function("window", src);
  fn(W);
})();
const SLOTS = W.WOW_PHOTO_SLOTS || [];
if(!SLOTS.length){ console.error("자리 목록을 못 읽었습니다."); process.exit(1); }

const EXT = [".jpg", ".jpeg", ".png", ".webp"];
const MIME = { ".html":"text/html;charset=utf-8", ".jpg":"image/jpeg",
  ".jpeg":"image/jpeg", ".png":"image/png", ".webp":"image/webp" };

if(!fs.existsSync(RAW)){
  console.log("\n  img/raw/ 가 없습니다. 만들고 원본을 자리 이름으로 넣으세요 —");
  console.log("    mkdir -p img/raw");
  SLOTS.slice(0,3).forEach(s => console.log("    img/raw/" + s.key + ".jpg"));
  console.log("    …");
  console.log("\n  쓸 수 있는 이름 " + SLOTS.length + "개:");
  SLOTS.forEach(s => console.log("    " + s.key.padEnd(18) + s.where));
  process.exit(0);
}

/* 원본 찾기 — 확장자는 무엇이든 */
function findRaw(key){
  for(const e of EXT){
    const f = path.join(RAW, key + e);
    if(fs.existsSync(f)) return f;
  }
  return null;
}

/* ⚠️ 자리 이름이 아닌 파일은 **조용히 무시되면 안 됩니다.** 한 글자
   틀린 파일(hero_start.jpg)을 넣고 "왜 안 나오지" 하게 됩니다. */
const keys = new Set(SLOTS.map(s => s.key));
const strays = fs.readdirSync(RAW).filter(f => {
  const e = path.extname(f).toLowerCase();
  if(EXT.indexOf(e) < 0) return false;
  return !keys.has(path.basename(f, path.extname(f)));
});

(async () => {
  const srv = http.createServer((rq, rs) => {
    const p = decodeURIComponent(rq.url.split("?")[0]);
    const f = path.join(ROOT, p);
    /* ⚠️ 디렉터리를 읽으려 하면 EISDIR 로 서버가 통째로 죽습니다 */
    if(!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){
      rs.statusCode = 404; return rs.end(); }
    rs.setHeader("content-type", MIME[path.extname(f).toLowerCase()] || "application/octet-stream");
    rs.end(fs.readFileSync(f));
  });
  await new Promise(r => srv.listen(8411, r));

  const b  = await chromium.launch();
  const pg = await (await b.newContext()).newPage();
  /* ⚠️ 빈 페이지에서는 상대 주소가 안 잡히므로 **같은 서버에서** 띄웁니다 */
  await pg.goto("http://localhost:8411/img/raw/", { waitUntil: "commit" }).catch(() => {});
  await pg.setContent("<!doctype html><meta charset=utf-8><title>fit</title>");

  const done = [], skip = [], fail = [];

  for(const s of SLOTS){
    const raw = findRaw(s.key);
    if(!raw){ skip.push(s); continue; }
    const url = "http://localhost:8411/img/raw/" + path.basename(raw);
    let r;
    try{
      r = await pg.evaluate(async (o) => {
        const img = await new Promise((res, rej) => {
          const i = new Image();
          i.onload = () => res(i);
          i.onerror = () => rej(new Error("그림을 못 읽었습니다"));
          i.src = o.url;
        });
        const sw = img.naturalWidth, sh = img.naturalHeight;
        if(!sw || !sh) throw new Error("크기를 못 읽었습니다");

        /* ① 비율 — 범위 안이면 **한 픽셀도 안 자릅니다** */
        const r0 = sw / sh;
        const want = Math.min(Math.max(r0, o.rMin), o.rMax);
        let cw = sw, ch = sh;
        if(r0 > want) cw = Math.round(sh * want);      /* 가로를 줄임 */
        else if(r0 < want) ch = Math.round(sw / want); /* 세로를 줄임 */

        /* 남길 쪽 — 히어로는 주인공이 바깥 가장자리에 있습니다 */
        let cx = Math.round((sw - cw) / 2), cy = Math.round((sh - ch) / 2);
        if(o.anchor === "left")  cx = 0;
        if(o.anchor === "right") cx = sw - cw;
        if(o.anchor === "top")   cy = 0;

        /* ② 크기 — 최소를 넘기되, ⚠️ 원본보다 키우지 않습니다 */
        let W2 = cw, H2 = ch;
        const need = Math.max(o.minW / cw, o.minH / ch);
        const capW = Math.round(o.minW * 1.35), capH = Math.round(o.minH * 1.35);
        const cap  = Math.min(capW / cw, capH / ch, 1);
        const k = Math.max(Math.min(cap, 1), Math.min(need, 1));
        W2 = Math.round(cw * k); H2 = Math.round(ch * k);
        const tooSmall = (W2 < o.minW || H2 < o.minH);

        /* ③ 품질 — 용량 상한 아래로. 안 되면 조금 줄여서 다시 */
        const draw = (w, h) => {
          const c = document.createElement("canvas");
          c.width = w; c.height = h;
          const g = c.getContext("2d");
          g.imageSmoothingQuality = "high";
          g.drawImage(img, cx, cy, cw, ch, 0, 0, w, h);
          return c;
        };
        const bytes = (u) => Math.round((u.length - (u.indexOf(",") + 1)) * 3 / 4);
        let w2 = W2, h2 = H2, best = null, tries = 0;
        while(tries++ < 4){
          const c = draw(w2, h2);
          let lo = 0.40, hi = 0.94, pick = null;
          for(let i = 0; i < 7; i++){
            const q = (lo + hi) / 2;
            const u = c.toDataURL(o.type, q);
            if(bytes(u) <= o.maxKB * 1024){ pick = { u, q }; lo = q; } else hi = q;
          }
          if(pick){ best = { ...pick, w: w2, h: h2 }; break; }
          /* 품질을 낮춰도 안 되면 치수를 줄입니다 — 다만 최소 아래로는
             안 내려갑니다. 그건 규격을 못 맞춘 것이라 실패로 냅니다. */
          const nw = Math.round(w2 * 0.88), nh = Math.round(h2 * 0.88);
          if(nw < o.minW || nh < o.minH) break;
          w2 = nw; h2 = nh;
        }
        if(!best) return { err: "용량 " + o.maxKB + "KB 안에 못 넣었습니다" };
        return { data: best.u.split(",")[1], w: best.w, h: best.h,
                 q: Math.round(best.q * 100), sw, sh, tooSmall,
                 cropped: (cw !== sw || ch !== sh),
                 kb: Math.round(bytes(best.u) / 1024) };
      }, { url, minW: s.min[0], minH: s.min[1], rMin: s.ratio[0], rMax: s.ratio[1],
           maxKB: s.maxKB, anchor: s.anchor || "center", type: TYPE });
    }catch(e){ fail.push([s, e.message]); continue; }

    if(r.err){ fail.push([s, r.err]); continue; }
    if(r.tooSmall){
      fail.push([s, "원본이 작습니다 " + r.sw + "×" + r.sh +
        " — 최소 " + s.min[0] + "×" + s.min[1] + " 이 필요합니다 (키우면 뿌옇습니다)"]);
      continue;
    }
    const outFile = path.join(OUT, s.key + EXTO);
    fs.writeFileSync(outFile, Buffer.from(r.data, "base64"));
    done.push([s, r]);
  }

  await b.close(); srv.close();

  /* ── 결과 ─────────────────────────────────────────────────── */
  console.log("\n── 규격 맞추기 · 자리 " + SLOTS.length + "곳");
  done.forEach(([s, r]) => {
    console.log("  ✅ " + s.key.padEnd(18) + r.w + "×" + r.h +
      "  " + String(r.kb).padStart(3) + "KB  q" + r.q +
      (r.cropped ? "  (" + r.sw + "×" + r.sh + "에서 잘랐습니다)" : "  (안 잘랐습니다)"));
  });
  fail.forEach(([s, m]) => console.log("  ❌ " + s.key.padEnd(18) + m));
  if(skip.length)
    console.log("  · 원본 없음 " + skip.length + "곳: " +
      skip.map(s => s.key).join(" · "));
  if(strays.length){
    console.log("\n  ⚠️ **자리 이름이 아닌 파일**이 img/raw/ 에 있습니다 —");
    strays.forEach(f => console.log("     " + f));
    console.log("     한 글자만 달라도 안 쓰입니다. 위 자리 이름과 맞추세요.");
  }

  /* ── photos.js 에 적기 ─────────────────────────────────────── */
  if(done.length){
    const prev = W.WOW_PHOTOS || {};
    const lines = done.map(([s]) => {
      const alt = (prev[s.key] && prev[s.key].alt) || "";
      return '  "' + s.key + '": { src:"/img/' + s.key + EXTO + '",\n' +
             '    alt:"' + String(alt).replace(/"/g, '\\"') + '" }';
    });
    const block = "window.WOW_PHOTOS = {\n" + lines.join(",\n") + "\n};";
    if(WRITE){
      const p = path.join(ROOT, "js/data/photos.js");
      let src = fs.readFileSync(p, "utf8");
      /* ⚠️⚠️ **정규식으로 이 칸을 갈아 끼우지 마세요.** 처음에
         `\{[\s\S]*?\n\};` 로 두었더니 `WOW_PHOTOS = {};` 다음에 오는
         `wowPhoto()` **함수를 통째로 삼켰습니다** — 파일은 문법상
         멀쩡했고 화면도 안 죽어서, 검사를 돌려 보고서야 알았습니다.
         여는 중괄호부터 **짝을 세어** 끝을 찾습니다. */
      const head = src.indexOf("window.WOW_PHOTOS");
      const open = head < 0 ? -1 : src.indexOf("{", head);
      let end = -1;
      if(open >= 0){
        let depth = 0;
        for(let i = open; i < src.length; i++){
          const ch = src[i];
          if(ch === "{") depth++;
          else if(ch === "}"){ depth--; if(depth === 0){ end = i; break; } }
        }
      }
      /* 세미콜론까지 같이 가져옵니다 */
      if(end >= 0 && src[end + 1] === ";") end++;
      if(end < 0){
        console.log("\n  ❌ photos.js 에서 WOW_PHOTOS 칸을 못 찾았습니다 — 손으로 넣으세요.");
      }else{
        fs.writeFileSync(p, src.slice(0, head) + block + src.slice(end + 1));
        /* ⚠️ 쓴 뒤에 **되읽어서 함수가 살아 있는지** 봅니다. 한 번
           삼켰던 자리라 그냥 믿지 않습니다. */
        const after = fs.readFileSync(p, "utf8");
        const keep = ["window.wowPhoto", "window.hasPhoto", "window.photoBox",
                      "window.WOW_PHOTO_SLOTS"];
        const lost = keep.filter(k => after.indexOf(k) < 0);
        if(lost.length){
          fs.writeFileSync(p, src);   /* 되돌립니다 */
          console.log("\n  ❌ 쓰다가 " + lost.join(" · ") + " 가 사라져서 되돌렸습니다.");
          console.log("     위 블록을 손으로 넣으세요.");
        }else{
          console.log("\n  ✅ js/data/photos.js 에 " + done.length + "줄 적었습니다.");
        }
      }
    }else{
      console.log("\n  아래를 js/data/photos.js 의 WOW_PHOTOS 에 넣으세요");
      console.log("  (또는 --write 를 붙여 다시 돌리시면 제가 적습니다)\n");
      console.log(block.split("\n").map(l => "  " + l).join("\n"));
    }
    console.log("\n  ⚠️⚠️ **alt 를 채우셔야 합니다.** 비어 있으면");
    console.log("     node tools/check-photos.js 가 실패로 잡습니다 — 읽어 주는");
    console.log("     프로그램과 검색엔진이 보는 글입니다.");
  }

  console.log("\n  다음: node tools/check-photos.js  →  node build-pages.js");
  console.log("  ⚠️ 이 도구는 **규격만** 맞춥니다. 업종이 드러나는지 ·");
  console.log("     폐업 쪽이 처연한지 · 저작권은 사람이 보셔야 합니다.\n");
  process.exit(fail.length ? 1 : 0);
})();
