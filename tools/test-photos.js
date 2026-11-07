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

/* 씨앗을 **덧붙입니다** — ⚠️⚠️ 처음에는 `window.AM_PHOTOS = {};` 라는
   글자를 찾아 갈아 끼웠는데, 사장님이 사진을 넣으시자 그 글자가 사라져
   **바꿔치기가 조용히 아무 일도 안 했습니다.** 검사는 씨앗이 들어간 줄
   알고 참 사진을 재며 네 건을 실패로 찍었습니다 (코드가 아니라 검사가
   틀린 자리입니다).
   ⚠️ 같은 이름을 뒤에 다시 적으면 **나중 것이 이깁니다** — 파일 내용이
   어떻든 씨앗이 확실히 이깁니다. 되돌리기는 사본으로 합니다. */
function seedPhotos(seed){
  fs.writeFileSync(DATA, fs.readFileSync(BAK, "utf8") +
    "\n/* 검사용 씨앗 — tools/test-photos.js 가 잠깐 덧붙인 것입니다. */\n" +
    "window.AM_PHOTOS = " + JSON.stringify(seed, null, 2) + ";\n");
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
    seedPhotos(seed);

    const r1 = build();
    ok("빌드가 돈다", r1.status === 0,
       (r1.stderr || "").toString().trim().split("\n").slice(-3).join(" | "));

    const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
    ok("히어로에 사진이 실린다", html.indexOf("/img/__t-hero.jpg") >= 0);
    /* ⚠️⚠️⚠️ **2026-11-07 — 묶음 사진이 `/categories` 로 옮겨졌습니다.**
       최종 작업지시서 A 가 메인의 네 묶음 카드를 서비스 카드로 바꾸라고
       해서, `zone-*` 사진을 그리는 자리가 메인에서 **0곳**이 됐습니다.
       그대로 두면 사진 파일만 저장소에 남고 **아무 데도 안 나오는**
       자리가 되므로, 뜻이 맞는 자리(`/categories` 의 묶음 머리)로
       옮겼습니다. 그래서 **여기서 읽는 화면도 같이** 바뀝니다 —
       ⚠️ 안 고치면 "0 / 4" 로 **멀쩡한 화면을 고장이라고** 합니다. */
    const catsHtml = fs.readFileSync(
      path.join(ROOT, "categories/index.html"), "utf8");
    ok("묶음마다 사진이 실린다 (/categories)",
       (catsHtml.match(/__t-zone\.jpg/g) || []).length === zones.length,
       (catsHtml.match(/__t-zone\.jpg/g) || []).length + " / " + zones.length);
    /* ⚠️⚠️ 배경 장식은 소리로 읽을 것이 없습니다 — alt 를 비우고
       aria-hidden 을 답니다. 비운 alt 를 안 달면 접근성 검사가 멈춥니다. */
    /* ⚠️⚠️⚠️ **글자를 통째로 박아 두면 안 됩니다 — 또 밟았습니다.**
       처음에는 `class="hero-bg" src="/img/__t-hero.jpg" alt="" aria-hidden="true"`
       를 그대로 찾았는데, 2026-11-04 에 사진 주소에 **내용 값**(`?v=`)을
       붙이자 **멀쩡한 화면이 실패**했습니다 (주소가 길어졌을 뿐입니다).
       재려는 뜻은 "배경 장식에 alt 가 비어 있고 aria-hidden 이 달렸는가"
       이지 속성이 어떤 차례로 적혔는가가 아닙니다.
       ⚠️ 그래서 그 `<img>` 하나를 **잘라내서** 그 안을 봅니다 —
       차례가 바뀌어도 · 속성이 늘어도 돕니다. */
    function tagOf(src, cls){
      const at = src.indexOf('<img class="' + cls + '"');
      if(at < 0) return "";
      const end = src.indexOf(">", at);
      return end < 0 ? "" : src.slice(at, end + 1);
    }
    const heroTag = tagOf(html, "hero-bg");
    ok("배경 사진은 aria-hidden 이고 alt 가 비어 있다",
       heroTag.indexOf('alt=""') >= 0 && heroTag.indexOf('aria-hidden="true"') >= 0,
       heroTag || "(hero-bg 를 못 찾았습니다)");
    /* ⚠️ 첫 화면 그림은 미리, 아래 그림은 늦게 */
    ok("히어로는 fetchpriority 다 (첫 화면은 미리 받습니다)",
       html.indexOf('fetchpriority="high"') >= 0);
    ok("  아래 사진은 lazy 다 (지금은 /categories 의 묶음 사진입니다)",
       catsHtml.indexOf('loading="lazy"') >= 0);

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
    /* ⚠️⚠️⚠️ **덩이마다 따로 잽니다 — 하나로 묶지 마세요.** 처음에는
       글 덩이들의 바깥 테두리를 하나로 묶어 쟀는데, 그 네모에는 글이
       없는 빈 자리가 잔뜩 들어갑니다. 막을 왼쪽만 짙게 바꾸자 그
       네모의 **오른쪽 위 빈 구석**(사진이 그대로 보이는 곳)이 잡혀
       대비 1.26 으로 떨어졌습니다 — 거기에는 글자가 한 자도 없습니다.
       멀쩡한 화면을 고장이라고 한 것입니다 (이 파일에서 세 번째입니다).
       ⚠️ 재야 하는 것은 **글자가 실제로 깔고 앉은 자리**뿐입니다. */
    const boxes = await p.evaluate(function(){
      /* ⚠️⚠️ **고를 자리를 손으로 적지 않습니다.** 클래스 이름을 적어
         두면 화면을 고치는 날 그 자리가 조용히 안 재는 곳이 됩니다.
         대신 **뜻으로** 고릅니다 — 막 위에 바로 앉은 밝은 글자:
           ① 제 글자를 직접 품고 있고 (자식 상자가 아니라)
           ② 제 바탕이 없고 (단추처럼 제 면을 깔면 그 면이 책임집니다)
           ③ 글자색이 밝다 (어두운 글자는 이 막의 일이 아닙니다)
         ⚠️ 그래서 단추(제 면이 있음)와 빈 상자(글자가 없음)는 빠집니다 —
         처음에 그 둘을 넣어 **빈 구석의 사진**을 재고 1.26 으로
         떨어뜨렸습니다. */
      function lightText(outer){
        const a = outer.getBoundingClientRect();
        const out = [];
        Array.prototype.forEach.call(outer.querySelectorAll("*"), function(el){
          let has = false;
          for(let i = 0; i < el.childNodes.length; i++){
            const n = el.childNodes[i];
            if(n.nodeType === 3 && (n.textContent || "").trim()){ has = true; break; }
          }
          if(!has) return;
          const cs = getComputedStyle(el);
          const bg = cs.backgroundColor || "";
          const m = bg.match(/rgba?\(([^)]+)\)/);
          /* 제 바탕이 있으면 그 면이 대비를 책임집니다 (알파 0 이 아니면 빼기) */
          if(m){
            const v = m[1].split(",").map(function(x){ return parseFloat(x); });
            if(v.length < 4 || v[3] > 0.05) return;
          }
          const cm = (cs.color || "").match(/rgba?\(([^)]+)\)/);
          if(!cm) return;
          const c = cm[1].split(",").map(function(x){ return parseFloat(x); });
          /* 밝은 글자만 — 어두운 글자는 이 막이 지키는 대상이 아닙니다 */
          if((c[0] + c[1] + c[2]) / 3 < 150) return;
          const r = el.getBoundingClientRect();
          if(r.width < 2 || r.height < 2) return;
          out.push({ el: el, x: Math.round(r.x - a.x), y: Math.round(r.y - a.y),
                     w: Math.round(r.width), h: Math.round(r.height) });
        });
        /* ⚠️⚠️⚠️ **찾은 그 자리를 바로 숨깁니다.** 숨기는 것을 CSS
           선택자로 따로 적어 두었더니, 믿음 줄을 `.hero-in` 밖으로
           옮기는 날 그 줄만 **안 숨겨진 채** 재서 글자 알갱이를
           바탕으로 읽었습니다 (대비 1.26 — 멀쩡한 막을 고장이라고
           했습니다. 이 파일에서 네 번째입니다).
           ⚠️ 재는 자리와 숨기는 자리를 **한 곳에서** 정하면 둘이
           어긋날 길이 없습니다. */
        out.forEach(function(o){ o.el.style.visibility = "hidden"; });
        return out;
      }
      const hero = document.querySelector(".hero");
      /* ⚠️⚠️ **히어로 **전체**에서 찾습니다** (`.hero-in` 안이 아니라).
         글 덩이가 상자 바깥에 놓이는 날에도 빠뜨리지 않으려고 그렇게
         둡니다 — 막이 왼쪽에서 짙고 오른쪽에서 옅으므로, 오른쪽 끝이
         재는 자리에 안 들어가면 거기만 아무도 안 재는 곳이 됩니다.
         (2026-11-03 까지는 '믿음 줄' 넷이 그 자리에 있었습니다. UX
         검수로 뺐지만, 재는 방식은 그대로 두는 것이 맞습니다.) */
      const out = {
        hero: lightText(hero), feat: [] };
      document.querySelectorAll(".feat-ph").forEach(function(c){
        out.feat.push(lightText(c));
      });
      /* 돌려줄 때는 상자만 (DOM 조각은 못 건너옵니다) */
      const strip = function(L){ return L.map(function(o){
        return { x:o.x, y:o.y, w:o.w, h:o.h }; }); };
      window.__amPhShown = false;
      return { hero: strip(out.hero), feat: out.feat.map(strip) };
    });
    /* ⚠️⚠️⚠️ **갯수를 박지 않습니다.** 여기 `>= 5` 를 박아 두었다가,
       UX 검수로 히어로의 믿음 줄 넷을 빼자 **멀쩡한 화면이 실패**로
       잡혔습니다 (작업 기억의 그 줄을 이 파일이 다시 밟았습니다).
       재려는 뜻은 "잴 자리를 **찾기는 했는가**" 이지 "몇 개인가" 가
       아닙니다 — 0개면 아무것도 안 재고 초록이 되는 자리입니다. */
    ok("히어로의 글 덩이를 찾았다 (잴 자리가 0개가 아니다)",
       boxes.hero.length >= 1, boxes.hero.length + "덩이");

    /* 한 자리의 **가장 밝은 바탕**을 돌려줍니다 — ⚠️ 평균이 아닙니다.
       평균은 어두운 쪽에 끌려가서 "괜찮다" 고 말합니다. */
    async function worstBg(loc, boxList){
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
        function ch(v){ v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
        let L = 0, n = 0;
        a.boxes.forEach(function(box){
          const bx = Math.max(0, box.x), by = Math.max(0, box.y);
          const bw = Math.min(box.w, img.width - bx), bh = Math.min(box.h, img.height - by);
          if(bw < 4 || bh < 4) return;
          const d = g.getImageData(bx, by, bw, bh).data;
          for(let i = 0; i < d.length; i += 4){
            n++;
            const l = 0.2126 * ch(d[i]) + 0.7152 * ch(d[i+1]) + 0.0722 * ch(d[i+2]);
            if(l > L) L = l;
          }
        });
        return { n: n, L: L };
      }, { b64: shot.toString("base64"), boxes: boxList });
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
    /* ⚠️⚠️⚠️ **2026-11-07 — 여기가 재던 것이 없어졌습니다.**
       전에는 메인의 네 묶음 카드가 **사진 위에 흰 글자**를 얹었고, 그
       대비를 점을 찍어 쟀습니다. 지금 묶음 사진은 `/categories` 의
       **띠**이고 제목은 그 **아래**에 있습니다 — 사진 위에 글자가
       없으므로 잴 대비도 없습니다.
       ⚠️ 그렇다고 이 자리를 **그냥 지우면** 다음에 누가 그 띠에 흰
       글자를 얹는 날 아무도 안 재는 자리가 됩니다. 그래서 재는 것을
       **뜻으로 바꿉니다** — "띠가 넷 다 있는가" 와 "띠 **안에** 글자가
       들어오지 않았는가". 글자가 들어오면 이 검사가 그 자리에서
       멈추고, 그때 대비를 재는 코드를 다시 넣어야 합니다. */
    const pz = await b.newPage({ viewport:{ width:1440, height:900 } });
    const ez = watch(pz);
    await pz.goto("http://127.0.0.1:" + h.port + "/categories",
                  { waitUntil:"networkidle" });
    await pz.waitForTimeout(250);
    ok("/categories 에 화면 에러 · CSP 거절이 0건이다", ez.length === 0,
       ez.join(" | "));
    const zb = await pz.evaluate(function(){
      const L = document.querySelectorAll(".zph");
      let text = 0, shown = 0;
      Array.prototype.forEach.call(L, function(x){
        const r = x.getBoundingClientRect();
        if(r.width > 10 && r.height > 10) shown++;
        /* 띠 안에 **보이는 글자**가 있는가 (그림 말고) */
        if((x.innerText || "").trim().length > 0) text++;
      });
      return { n:L.length, shown:shown, text:text };
    });
    ok("묶음 띠가 **실제로 그려진다** (잰 것이 0장이 아닙니다)",
       zb.n === zones.length && zb.shown === zones.length,
       JSON.stringify(zb));
    ok("⚠️⚠️ 띠 **안에 글자가 없다** (있으면 대비를 재야 합니다)",
       zb.text === 0, JSON.stringify(zb));
    await pz.close();

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
    await p.close();

    console.log("\n── ③ 규격 검사가 실제로 잡는가 (일부러 작은 그림)");
    const small = path.join(IMGDIR, "__t-small.jpg");
    await makeBright(b, small, 400, 200);
    made.push(small);
    seedPhotos({ hero: { src:"/img/__t-small.jpg", alt:"작은 그림" } });
    const c1 = spawnSync(process.execPath, ["tools/check-photos.js"],
      { cwd: ROOT, stdio:["ignore","pipe","pipe"] });
    ok("최소 크기에 못 미치면 **멈춘다**", c1.status !== 0,
       (c1.stdout || "").toString().trim().split("\n").slice(-2).join(" | "));

    console.log("\n── ④ alt 를 안 적으면");
    seedPhotos({ hero: { src:"/img/__t-hero.jpg" } });
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
