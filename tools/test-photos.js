#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   사진이 **들어왔을 때**를 눌러 봅니다

   ⚠️⚠️ **이 검사가 있는 까닭.** 지금 사진이 0장이라, 사진이 들어가는
   자리는 **아무도 본 적이 없습니다.** 앞 서비스에서 "0장일 때" 만
   만들고 있을 때 그리는 자리를 안 만든 적이 있습니다 — 사진을 넣는
   날 처음 깨진 것을 알게 됩니다.

   ⚠️⚠️⚠️ **제일 무서운 것은 대비입니다.** 히어로는 흰 글자이고, 그
   뒤에 **밝은 사진**이 깔리면 글자가 안 읽힙니다 — 그런데 사진은
   사장님이 넣으시는 것이라 우리가 고를 수 없습니다. 그래서 막이
   책임지게 해 두었고, 여기서 **일부러 가장 밝은 사진**(흰색에 가까운)
   을 넣어 흰 글자가 그래도 AA 를 넘는지 잽니다.
   ⚠️ 통과시키려고 막을 옅게 만들지 마세요 — 그 순간 이 자리의 기준이
   영영 사라집니다.

   ⚠️ 씨앗 그림은 **그때그때 만들고** 끝나면 지웁니다. 저장소에 검사용
   그림을 남기면 `check-photos` 가 "안 쓰는 파일" 로 잡고, 더 나쁘게는
   그게 배포에 섞입니다.

   돌리기   node tools/test-photos.js
   ════════════════════════════════════════════════════════════════════ */
const { spawnSync } = require("child_process");
const fs = require("fs"), path = require("path"), os = require("os");
const { chromium } = require("playwright");
const { serve, watch } = require("./_serve.js");

const ROOT = path.join(__dirname, "..");
const DATA = path.join(ROOT, "js", "data", "photos.js");
/* ⚠️⚠️ 되돌리기는 git 이 아니라 **사본**으로 합니다 —
   `git checkout -- <파일>` 은 그 파일의 작업분 전체를 지웁니다. */
const BAK = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ph-")), "photos.keep.js");
const IMGDIR = path.join(ROOT, "img");

let bad = 0, ran = 0;
function ok(name, cond, got){
  ran++;
  if(cond) console.log("  ✅ " + name);
  else { bad++; console.log("  ❌ " + name + (got !== undefined ? "  →  " + String(got).slice(0, 220) : "")); }
}
function build(){
  return spawnSync(process.execPath, ["build.js"], { cwd: ROOT, stdio:["ignore","pipe","pipe"] });
}

/* 가장 밝은 사진을 하나 만듭니다 — ⚠️ 흰색에 가까워야 뜻이 있습니다
   (어두운 사진은 막이 없어도 통과합니다). */
async function makeBright(b, file, w, h){
  const p = await b.newPage({ viewport:{ width:w, height:h } });
  await p.setContent('<body style="margin:0">' +
    '<div style="width:100vw;height:100vh;background:' +
    'linear-gradient(135deg,#ffffff 0%,#fffbe6 50%,#f2fff4 100%)"></div></body>');
  await p.screenshot({ path:file, type:"jpeg", quality:88 });
  await p.close();
}

(async function(){
  fs.copyFileSync(DATA, BAK);
  const made = [];
  let b = null, h = null;
  try{
    b = await chromium.launch();
    fs.mkdirSync(IMGDIR, { recursive: true });

    console.log("\n── ① 가장 밝은 사진을 넣어 봅니다 (일부러 제일 나쁜 경우)");
    const hero = path.join(IMGDIR, "__t-hero.jpg");
    const zone = path.join(IMGDIR, "__t-zone.jpg");
    await makeBright(b, hero, 2400, 1200);
    await makeBright(b, zone, 1200, 600);
    made.push(hero, zone);

    /* ⚠️ 영역 키를 손으로 적지 않습니다 — catalog.js 에서 꺼냅니다
       (두 곳에 적으면 영역을 고치는 날 조용히 어긋납니다). */
    const w2 = {};
    new Function("window", fs.readFileSync(
      path.join(ROOT, "js/components/base.js"), "utf8"))(w2);
    new Function("window", fs.readFileSync(
      path.join(ROOT, "js/data/catalog.js"), "utf8"))(w2);
    const zones = (w2.AM_ZONES || []).map(z => z.key);
    ok("영역을 읽었다 (잰 것이 0개가 아니다)", zones.length > 0, zones.length);

    const seed = { hero: { src:"/img/__t-hero.jpg", alt:"해 질 녘 페어웨이" } };
    zones.forEach(function(z){
      seed["zone-" + z] = { src:"/img/__t-zone.jpg", alt:z + " 장면" };
    });
    fs.writeFileSync(DATA,
      fs.readFileSync(BAK, "utf8").replace("window.AM_PHOTOS = {};",
        "window.AM_PHOTOS = " + JSON.stringify(seed, null, 2) + ";"));

    const r1 = build();
    ok("빌드가 돈다", r1.status === 0,
       (r1.stderr || "").toString().trim().split("\n").slice(-3).join(" | "));

    const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
    ok("히어로에 사진이 실린다", html.indexOf("/img/__t-hero.jpg") >= 0);
    ok("영역 카드마다 사진이 실린다",
       (html.match(/__t-zone\.jpg/g) || []).length === zones.length,
       (html.match(/__t-zone\.jpg/g) || []).length + " / " + zones.length);
    /* ⚠️⚠️ 배경 장식은 소리로 읽을 것이 없습니다 — alt 를 비우고
       aria-hidden 을 답니다. 비운 alt 를 안 달면 접근성 검사가 멈춥니다. */
    ok("배경 사진은 aria-hidden 이고 alt 가 비어 있다",
       html.indexOf('class="hero-bg" src="/img/__t-hero.jpg" alt="" aria-hidden="true"') >= 0,
       html.slice(html.indexOf("hero-bg") - 20, html.indexOf("hero-bg") + 160));
    /* ⚠️ 첫 화면 그림은 미리, 아래 그림은 늦게 */
    ok("히어로는 fetchpriority, 영역 카드는 lazy 다",
       html.indexOf('fetchpriority="high"') >= 0 && html.indexOf('loading="lazy"') >= 0);

    console.log("\n── ② ⚠️ 가장 밝은 사진 위에서도 흰 글자가 읽히는가");
    h = await serve(0);
    const p = await b.newPage({ viewport:{ width:1440, height:900 } });
    const errs = watch(p);
    await p.goto("http://127.0.0.1:" + h.port + "/", { waitUntil:"networkidle" });
    await p.waitForTimeout(300);
    ok("화면 에러 · CSP 거절이 0건이다", errs.length === 0, errs.join(" | "));

    /* 막이 실제로 덮었는가 — 글자 뒤의 **그려진 색**을 집습니다.
       ⚠️⚠️ `getComputedStyle` 의 backgroundColor 는 막을 안 봅니다
       (::after 입니다). 그래서 **화면을 찍어 픽셀을 읽습니다.**

       ⚠️⚠️⚠️ **글자를 숨기고 바탕만 잽니다.** 처음에는 글자가 있는
       채로 찍고 "거의 흰 점은 글자니까 빼자" 로 걸렀는데, 매끄럽게
       그린 글자의 **테두리 점**(240,243,242)이 그 체에 안 걸려
       **글자를 바탕으로** 읽었습니다 — 대비가 1.12 로 떨어져서
       **멀쩡한 막을 고장이라고** 했습니다 (같은 자리의 참 바탕은
       8,55,41 이고 13.2 입니다). 밝은 점을 빼는 체는 안 씁니다 —
       글자를 `visibility:hidden` 으로 숨기면 그 자리에 남는 것은
       **전부 바탕**입니다 (자리는 그대로 차지합니다). */
    /* ⚠️⚠️ **글이 놓인 자리를 글에게 물어봅니다** — 액자나 속을 담은
       상자를 재면 안 됩니다. 히어로 아래쪽은 흰 카드(`.cats-in`)가
       42px **겹쳐 올라오고**, `.hero-in` 은 위아래 여백까지 포함해
       히어로 높이 전부를 차지합니다 — 그 상자를 재니 바닥 모서리의
       **흰 카드 한 점**(255,255,255)이 잡혀 대비가 1.00 이었습니다.
       그래서 **글 덩이들의 바깥 테두리**만 모읍니다. */
    const boxes = await p.evaluate(function(){
      function union(outer, nodes){
        const a = outer.getBoundingClientRect();
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, n = 0;
        nodes.forEach(function(el){
          const r = el.getBoundingClientRect();
          if(r.width < 2 || r.height < 2) return;
          n++;
          x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y);
          x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom);
        });
        if(!n) return { n: 0, x: 0, y: 0, w: 0, h: 0 };
        return { n: n, x: Math.round(x0 - a.x), y: Math.round(y0 - a.y),
                 w: Math.round(x1 - x0), h: Math.round(y1 - y0) };
      }
      const hero = document.querySelector(".hero");
      const out = {
        hero: union(hero, [].slice.call(hero.querySelectorAll(".hero-in > *"))),
        feat: [] };
      document.querySelectorAll(".feat-ph").forEach(function(c){
        out.feat.push(union(c, [].slice.call(c.children)
          .filter(function(el){ return !el.classList.contains("feat-bg"); })));
      });
      return out;
    });
    ok("히어로의 글 덩이를 찾았다 (잴 자리가 0개가 아니다)",
       boxes.hero.n >= 3 && boxes.hero.w > 100 && boxes.hero.h > 50,
       JSON.stringify(boxes.hero));
    const hide = await p.addStyleTag({ content:
      ".hero-in, .feat-ph > *:not(.feat-bg){ visibility:hidden !important }" });

    /* 한 자리의 **가장 밝은 바탕**을 돌려줍니다 — ⚠️ 평균이 아닙니다.
       평균은 어두운 쪽에 끌려가서 "괜찮다" 고 말합니다. */
    async function worstBg(loc, box){
      const shot = await loc.screenshot();
      return await p.evaluate(async function(a){
        const img = new Image();
        await new Promise(function(res, rej){
          img.onload = res; img.onerror = rej;
          img.src = "data:image/png;base64," + a.b64;
        });
        const c = document.createElement("canvas");
        c.width = img.width; c.height = img.height;
        const g = c.getContext("2d");
        g.drawImage(img, 0, 0);
        const bx = Math.max(0, a.box.x), by = Math.max(0, a.box.y);
        const bw = Math.min(a.box.w, img.width - bx), bh = Math.min(a.box.h, img.height - by);
        if(bw < 4 || bh < 4) return { n: 0, L: 1 };
        const d = g.getImageData(bx, by, bw, bh).data;
        function ch(v){ v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
        let L = 0, n = 0;
        for(let i = 0; i < d.length; i += 4){
          n++;
          const l = 0.2126 * ch(d[i]) + 0.7152 * ch(d[i+1]) + 0.0722 * ch(d[i+2]);
          if(l > L) L = l;
        }
        return { n: n, L: L };
      }, { b64: shot.toString("base64"), box: box });
    }
    /* 흰 글자(L=1) 대비 = 1.05 / (L + 0.05) */
    const ratioOf = x => 1.05 / (x.L + 0.05);

    const H = await worstBg(p.locator(".hero"), boxes.hero);
    /* ⚠️⚠️ **잰 것이 0개면 실패입니다** — 아무것도 안 재고 초록인
       검사를 여러 번 만들었습니다. */
    ok("히어로에서 잰 점이 0개가 아니다", H.n > 10000, H.n + "점");
    /* ⚠️ 히어로의 큰 글자는 3.0 이면 되지만 `hero-sub` 는 보통 글자라
       **4.5** 를 봅니다 — 낮은 쪽에 맞춥니다. */
    ok("⚠️ 가장 밝은 사진 위에서도 흰 글자 대비가 4.5 이상이다",
       ratioOf(H) >= 4.5, "대비 " + ratioOf(H).toFixed(2));

    /* ⚠️⚠️ 영역 카드도 흰 글자입니다 — 히어로만 재고 끝내면 카드 넉 장이
       아무도 안 재는 자리가 됩니다. */
    ok("영역 카드를 찾았다 (잰 것이 0장이 아니다)",
       boxes.feat.length === zones.length, boxes.feat.length + " / " + zones.length);
    let fWorst = 99, fAt = -1, fPts = 0;
    for(let i = 0; i < boxes.feat.length; i++){
      const F = await worstBg(p.locator(".feat-ph").nth(i), boxes.feat[i]);
      fPts += F.n;
      if(ratioOf(F) < fWorst){ fWorst = ratioOf(F); fAt = i; }
    }
    ok("영역 카드에서 잰 점이 0개가 아니다", fPts > 10000, fPts + "점");
    ok("⚠️ 영역 카드 " + boxes.feat.length + "장도 흰 글자 대비가 4.5 이상이다",
       fWorst >= 4.5, "제일 나쁜 칸 " + (fAt + 1) + "번 · 대비 " + fWorst.toFixed(2));

    /* ⚠️⚠️ **되돌려 봅니다** — 막을 옅게 하면 이 검사가 실제로
       떨어지는지. 안 떨어지면 재는 자리가 틀린 것이고, 그때는
       "통과" 가 아무 뜻도 없습니다. */
    const thin = await p.addStyleTag({ content:
      ".hero-ph::after{ background-color: rgba(6,59,43,.08) !important;" +
      " background-image: none !important }" });
    const T = await worstBg(p.locator(".hero"), boxes.hero);
    ok("막을 옅게 하면 이 검사가 **떨어진다** (재는 자리가 맞습니다)",
       ratioOf(T) < 4.5, "대비 " + ratioOf(T).toFixed(2));
    await thin.evaluate(function(e){ e.remove(); });
    await hide.evaluate(function(e){ e.remove(); });
    await p.close();

    console.log("\n── ③ 규격 검사가 실제로 잡는가 (일부러 작은 그림)");
    const small = path.join(IMGDIR, "__t-small.jpg");
    await makeBright(b, small, 400, 200);
    made.push(small);
    fs.writeFileSync(DATA,
      fs.readFileSync(BAK, "utf8").replace("window.AM_PHOTOS = {};",
        'window.AM_PHOTOS = { "hero": { src:"/img/__t-small.jpg", alt:"작은 그림" } };'));
    const c1 = spawnSync(process.execPath, ["tools/check-photos.js"],
      { cwd: ROOT, stdio:["ignore","pipe","pipe"] });
    ok("최소 크기에 못 미치면 **멈춘다**", c1.status !== 0,
       (c1.stdout || "").toString().trim().split("\n").slice(-2).join(" | "));

    console.log("\n── ④ alt 를 안 적으면");
    fs.writeFileSync(DATA,
      fs.readFileSync(BAK, "utf8").replace("window.AM_PHOTOS = {};",
        'window.AM_PHOTOS = { "hero": { src:"/img/__t-hero.jpg" } };'));
    const r2 = build();
    ok("빌드는 돈다 (화면이 안 깨집니다)", r2.status === 0);
    /* ⚠️⚠️ alt 가 없으면 **안 내보냅니다** — 내보내면 접근성 검사가
       빌드를 멈추고, 그때 사진을 지우는 것보다 여기서 빠지는 편이
       낫습니다 (어느 자리가 빠졌는지는 check-photos 가 말합니다). */
    ok("⚠️ alt 가 없는 사진은 **화면에 안 나간다**",
       fs.readFileSync(path.join(ROOT, "index.html"), "utf8")
         .indexOf("__t-hero.jpg") < 0);

  }catch(e){
    bad++; ran++;
    console.log("\n❌ 검사가 터졌습니다: " +
      String(e && e.message).split("\n").slice(0, 3).join(" "));
  }finally{
    if(b) await b.close();
    if(h) h.srv.close();
    /* ⚠️⚠️ **사본으로 되돌리고 씨앗 그림을 지웁니다.** 남으면
       check-photos 가 "안 쓰는 파일" 로 잡고, 더 나쁘게는 배포에
       섞입니다. */
    fs.copyFileSync(BAK, DATA);
    made.forEach(function(f){ try{ fs.unlinkSync(f); }catch(_){} });
    try{
      if(fs.existsSync(IMGDIR) && !fs.readdirSync(IMGDIR).length) fs.rmdirSync(IMGDIR);
    }catch(_){}
    const r3 = build();
    ran++;
    const left = fs.existsSync(IMGDIR) ? fs.readdirSync(IMGDIR)
      .filter(f => f.indexOf("__t-") === 0) : [];
    if(r3.status === 0 && !left.length &&
       fs.readFileSync(DATA, "utf8").indexOf("__t-") < 0)
      console.log("\n  ✅ 씨앗을 되돌렸습니다 (검사용 그림이 한 장도 안 남았습니다)");
    else {
      bad++;
      console.log("\n  ❌ 되돌리지 못했습니다 — js/data/photos.js 와 img/ 를 보세요: " +
                  left.join(" "));
    }
  }
  console.log("\n" + ran + "건 중 " + (ran - bad) + "건 통과 · " + bad + "건 실패");
  process.exit(bad ? 1 : 0);
})();
