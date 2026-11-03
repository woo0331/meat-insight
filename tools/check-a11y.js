#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   접근성 전수 점검 (지시서 11번 8단계)

   재는 것 — 전부 **도구가 잴 수 있는 것만** 둡니다. "읽기 쉬운가" 는
   도구가 영원히 못 잽니다 (그건 찍어 보고 사람이 봅니다).

     ① 문서에 lang 이 있는가 (낭독기가 한국어로 읽습니다)
     ② 제목이 h1 하나로 시작하고 **단계를 건너뛰지 않는가**
     ③ 그림마다 alt 가 있는가 (장식이면 alt="" 로 **비워서** 있어야)
     ④ 적는 칸마다 이름표가 이어져 있는가
     ⑤ id 가 겹치지 않는가 (겹치면 label for 가 엉뚱한 칸을 가리킵니다)
     ⑥ 링크 · 단추에 읽을 글자가 있는가 (아이콘만 있으면 낭독기가 침묵)
     ⑦ 본문으로 건너뛰는 길이 있는가
     ⑧ 키보드 초점이 **보이는가** (outline 을 지우지 않았는가)
     ⑨ 자동 다크 모드 선언이 메타와 CSS **둘 다** 있는가
     ⑩ 가로 확대(200%)에서 가로로 밀리지 않는가

   ⚠️ ⑨가 중요한 까닭 — 안드로이드 크롬 · 삼성 인터넷의 자동 다크
   모드가 선언 없는 사이트를 알고리즘으로 반전시켜 브랜드색이 빨강이
   됩니다. **데스크톱 헤드리스에서는 재현이 안 됩니다** — 그래서
   화면을 보는 대신 **선언이 있는지**를 셉니다.

   돌리기   node tools/check-a11y.js
            node tools/check-a11y.js --prove
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const { serve, watch } = require("./_serve.js");

let bad = 0, ran = 0;
function ok(name, cond, got){
  ran++;
  if(cond) console.log("  ✅ " + name);
  else { bad++; console.log("  ❌ " + name + (got !== undefined ? "  →  " + String(got).slice(0, 220) : "")); }
}

const PROBE = function(){
  function text(el){
    const t = (el.textContent || "").trim();
    return t || el.getAttribute("aria-label") || el.getAttribute("title") || "";
  }
  const out = { lang: document.documentElement.getAttribute("lang") || "" };

  /* 제목 단계 */
  const hs = Array.prototype.map.call(document.querySelectorAll("h1,h2,h3,h4,h5,h6"),
    function(h){ return { n: Number(h.tagName[1]), t: (h.textContent || "").trim().slice(0, 30) }; });
  out.h1 = hs.filter(function(h){ return h.n === 1; }).length;
  out.jump = [];
  let prev = 0;
  hs.forEach(function(h){
    if(prev && h.n > prev + 1) out.jump.push("h" + prev + " 다음에 h" + h.n + " (" + h.t + ")");
    prev = h.n;
  });

  /* 그림 · 적는 칸 · id · 링크 */
  out.noAlt = Array.prototype.filter.call(document.querySelectorAll("img"),
    function(i){ return i.getAttribute("alt") === null; }).length;

  out.noLabel = Array.prototype.filter.call(
    document.querySelectorAll("input,select,textarea"), function(f){
      if(f.type === "hidden") return false;
      if(f.getAttribute("aria-label") || f.getAttribute("aria-labelledby")) return false;
      if(f.closest("label")) return false;
      return !(f.id && document.querySelector('label[for="' + CSS.escape(f.id) + '"]'));
    }).map(function(f){ return f.name || f.type; });

  const ids = {}; out.dupIds = [];
  Array.prototype.forEach.call(document.querySelectorAll("[id]"), function(e){
    if(ids[e.id]) out.dupIds.push(e.id); else ids[e.id] = 1;
  });

  out.mute = Array.prototype.filter.call(document.querySelectorAll("a,button"),
    function(e){ return e.offsetParent !== null && !text(e); })
    .map(function(e){ return e.outerHTML.slice(0, 50); });

  out.skip = !!document.querySelector('a[href^="#"]');

  /* 초점이 보이는가 — outline:none 만 걸고 대신 주지 않은 자리를 셉니다 */
  out.noFocus = [];
  Array.prototype.forEach.call(document.querySelectorAll("a,button,input,textarea,select"),
    function(e){
      if(e.offsetParent === null) return;
      const cs = getComputedStyle(e, ":focus-visible");
      const o = getComputedStyle(e).outlineStyle;
      if(o === "none" && !/inset|0 0/.test(getComputedStyle(e).boxShadow || ""))
        { /* 기본값이 none 인 브라우저가 있어 여기서는 선언만 봅니다 */ }
    });

  out.meta = !!document.querySelector('meta[name="color-scheme"]');
  out.viewport = !!document.querySelector('meta[name="viewport"]');
  out.title = (document.title || "").trim();
  out.main = !!document.querySelector("main");
  out.landmarks = {
    header: !!document.querySelector("header"),
    nav: !!document.querySelector("nav"),
    footer: !!document.querySelector("footer")
  };
  return out;
};

(async function(){
  const routes = JSON.parse(fs.readFileSync(path.join(__dirname, "routes.json"), "utf8")).routes;
  const css = fs.readFileSync(path.join(__dirname, "..", "css", "tokens.css"), "utf8");
  const app = fs.readFileSync(path.join(__dirname, "..", "css", "app.css"), "utf8");

  console.log("\n── CSS 쪽 선언");
  ok("CSS 에 color-scheme: only light 가 있다", /color-scheme:\s*only light/.test(css));
  ok("다크 모드 미디어 쿼리에도 한 번 더 있다",
     /prefers-color-scheme:\s*dark[\s\S]{0,120}only light/.test(css));
  ok("한글 줄바꿈 둘이 같이 있다",
     /word-break:\s*keep-all/.test(css) && /overflow-wrap:\s*anywhere/.test(css));
  /* ⚠️ 초점 테두리를 지운 자리가 없어야 합니다 — 지우면 키보드로 어디에
     있는지 알 수 없습니다. 대신 주는 선언이 같이 있으면 괜찮습니다. */
  const killed = (app.match(/outline:\s*(none|0)/g) || []).length;
  const given  = (app.match(/outline:\s*\d/g) || []).length;
  ok("키보드 초점 테두리를 지운 자리가 없다", killed === 0, killed + "곳에서 지웠습니다");
  ok("초점 테두리를 따로 주는 선언이 있다", given > 0, given + "곳");

  const h = await serve(0);
  const b = await chromium.launch();
  const titles = {};

  console.log("\n── 화면마다");
  for(const r of routes){
    const p = await b.newPage({ viewport:{ width:1280, height:900 } });
    const hits = watch(p);
    const res = await p.goto("http://127.0.0.1:" + h.port + r, { waitUntil:"networkidle" });
    if(!res || res.status() >= 400){ ok(r + " 가 열린다", false, res && res.status()); await p.close(); continue; }
    await p.waitForTimeout(150);
    const o = await p.evaluate(PROBE);

    const probs = [];
    if(o.lang !== "ko") probs.push("lang=" + (o.lang || "(없음)"));
    if(o.h1 !== 1) probs.push("h1 이 " + o.h1 + "개");
    if(o.jump.length) probs.push("제목 단계를 건너뜀: " + o.jump[0]);
    if(o.noAlt) probs.push("alt 없는 그림 " + o.noAlt + "개");
    if(o.noLabel.length) probs.push("이름표 없는 칸: " + o.noLabel.join(","));
    if(o.dupIds.length) probs.push("겹치는 id: " + o.dupIds.join(","));
    if(o.mute.length) probs.push("읽을 글자가 없는 링크 · 단추 " + o.mute.length + "개: " + o.mute[0]);
    if(!o.skip) probs.push("본문으로 건너뛰는 길이 없음");
    if(!o.meta) probs.push("color-scheme 메타 없음");
    if(!o.viewport) probs.push("viewport 메타 없음");
    if(!o.title) probs.push("제목이 빈 칸");
    if(!o.main) probs.push("main 이 없음");
    if(!o.landmarks.header || !o.landmarks.nav || !o.landmarks.footer)
      probs.push("머리말 · 메뉴 · 푸터 중 빠진 것");
    if(hits.length) probs.push("CSP 거절 · 에러: " + hits[0]);
    if(titles[o.title]) probs.push("제목이 " + titles[o.title] + " 와 겹침");
    titles[o.title] = r;

    /* ⑩ 200% 확대에서 가로로 밀리는가 — 눈이 어두운 분들이 쓰는 설정입니다 */
    await p.setViewportSize({ width: 640, height: 900 });
    const wide = await p.evaluate(function(){
      document.documentElement.style.fontSize = "32px";
      const w = document.documentElement.scrollWidth > window.innerWidth + 1;
      document.documentElement.style.fontSize = "";
      return w;
    });
    if(wide) probs.push("글자를 두 배로 키우면 가로로 밀림");

    ok(r, probs.length === 0, probs.join(" / "));
    await p.close();
  }

  if(process.argv.indexOf("--prove") >= 0){
    /* ⚠️⚠️ 일부러 깨뜨려 봅니다 — 잡지 못하면 이 검사는 아무것도 안 합니다 */
    console.log("\n되돌려 보기 — 일부러 깨뜨립니다");
    const p = await b.newPage({ viewport:{ width:1280, height:900 } });
    await p.goto("http://127.0.0.1:" + h.port + "/", { waitUntil:"networkidle" });
    const got = await p.evaluate(function(){
      document.documentElement.removeAttribute("lang");
      const i = document.createElement("img"); document.body.appendChild(i);
      const a = document.createElement("a"); a.href = "/x"; document.body.appendChild(a);
      const d = document.createElement("div"); d.id = "main"; document.body.appendChild(d);
      /* ⚠️ 한 칸 뛰는 것은 건너뜀이 아닙니다 — 처음에 h5 를 넣고
         "못 잡는다" 고 읽었습니다. 두 칸 뛰게 둡니다. */
      const hx = document.createElement("h6"); hx.textContent = "건너뜀"; document.body.appendChild(hx);
      return true;
    });
    const o = await p.evaluate(PROBE);
    const caught = [
      ["lang 을 떼면",      o.lang !== "ko"],
      ["alt 없는 그림을 넣으면", o.noAlt > 0],
      ["글자 없는 링크를 넣으면", o.mute.length > 0],
      ["id 를 겹치게 하면",  o.dupIds.length > 0],
      ["제목 단계를 건너뛰면", o.jump.length > 0]
    ];
    caught.forEach(function(c){ console.log("  " + c[0] + " 잡히나: " + (c[1] ? "O" : "❌ 못 잡습니다")); });
    await p.close();
    if(caught.some(function(c){ return !c[1]; })){ await b.close(); h.srv.close(); process.exit(1); }
  }

  await b.close(); h.srv.close();
  console.log("\n" + ran + "건 중 " + (ran - bad) + "건 통과 · " + bad + "건 실패");
  process.exit(bad ? 1 : 0);
})();
