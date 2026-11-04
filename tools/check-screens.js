#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   전수 점검 — 화면마다 네 폭에서 **잽니다**

   재는 것
     ① 가로 스크롤          문서가 화면보다 넓은가
     ② 12px 미만 글자        (작업 기억: 12px 미만 금지)
     ③ 누르는 것 40px 미만   (a · button · onclick 을 단 것 전부)
     ④ 글자 대비 WCAG AA     보통 4.5 · 큰 글자 3.0
                            ⚠️ 큰 글자는 24px 이상, 또는 18.66px 이상이며
                            굵은 것입니다. **17px 굵은 글씨는 아닙니다.**
     ⑤ 낱말 잘림            칸보다 글이 넓은가
     ⑥ 어두운 면            그라디언트만 적어 backgroundColor 가 투명이면
                            재는 쪽이 검정으로 읽습니다 — 실제로 칠해진
                            색을 조상까지 거슬러 찾습니다

   ⚠️⚠️ **색 · 이름 · 개수를 박아 두지 않았습니다.** 뜻만 잽니다 —
   디자인이 바뀌는 날 멀쩡한 화면을 실패로 잡지 않게 하려는 것입니다.

   돌리기   node tools/check-screens.js            (기본 주소 전부)
            node tools/check-screens.js / /c/lesson
            node tools/check-screens.js --prove    (일부러 깨뜨려 봅니다)
   ════════════════════════════════════════════════════════════════════ */
var { chromium } = require("playwright");
var { ratio } = require("./contrast.js");
var http = require("http"), fs = require("fs"), path = require("path");

var ROOT = path.join(__dirname, "..");
/* ⚠️⚠️ **폰 폭 셋을 다 잽니다** (4차 지시서 §7 · UX 검수 §10) —
   360(갤럭시 작은 쪽) · 390(아이폰) · 430(큰 쪽). 414 하나로 뭉뚱그리면
   그 사이에서 깨지는 것을 못 봅니다 — 실제로 **360 에서만** 화면이
   가로로 밀린 자리가 있었습니다 (가로로 도는 상자 안의 .sr).
   ⚠️ 768 은 태블릿, 1440 은 PC 입니다. */
var WIDTHS = [360, 390, 430, 768, 1440];
var MIN_FONT = 12, MIN_TAP = 40;

/* 서버는 tools/_serve.js 한 곳에 있습니다 — 운영과 같은 헤더를 보냅니다 */
const { serve, watch } = require("./_serve.js");


/* 화면 안에서 재는 글 — ⚠️ 여기서 돌아오는 값만 믿습니다.
   보이지 않는 칸(offsetParent 가 없는 것)은 건너뜁니다. */
var PROBE = function(cfg){
  var MIN_FONT = cfg.font, MIN_TAP = cfg.tap;
  function seen(el){
    if(el.offsetParent === null && getComputedStyle(el).position !== "fixed") return false;
    var cs = getComputedStyle(el);
    /* 화면 낭독기 전용 칸은 재지 않습니다 — 1px 로 접어 둔 것이라
       글이 칸보다 넓은 것이 **맞습니다.** 안 걸러내면 잘림으로 잡힙니다. */
    if(cs.clipPath && cs.clipPath.indexOf("inset(50%") >= 0) return false;
    var r = el.getBoundingClientRect();
    if(r.width <= 2 || r.height <= 2) return false;
    return true;
  }
  /* ⚠️ 그라디언트만 적힌 칸은 backgroundColor 가 투명입니다 —
     조상을 거슬러 실제로 칠해진 색을 찾습니다. 안 그러면 검정으로
     읽혀서 멀쩡한 글자가 대비 미달로 잡힙니다. */
  /* ⚠️⚠️ **그라디언트는 끝이 둘입니다.** 처음에는 background-color 만
     보고 **가장 어두운 끝**으로만 쟀는데, 밝은 끝에서 4.45 로 떨어지는
     글자를 놓쳤습니다 (히어로 · 이용 방법 카드). 지금은 그라디언트에
     적힌 **색 조각을 전부** 꺼내 **가장 나쁜 쪽**으로 잽니다.
     ⚠️ 사진이 깔린 칸은 여전히 못 잽니다 — 그 자리는 눈으로 봅니다. */
  function bgOf(el){
    for(var n = el; n && n !== document.documentElement; n = n.parentElement){
      var cs2 = getComputedStyle(n), out = [];
      var bi = cs2.backgroundImage;
      if(bi && bi !== "none"){
        if(bi.indexOf("url(") >= 0) return null;        /* 사진 — 못 잽니다 */
        var g = bi.match(/rgba?\([^)]+\)/g) || [];
        g.forEach(function(x){
          var q = x.match(/rgba?\(([^)]+)\)/)[1].split(",").map(Number);
          if(q.length < 4 || q[3] > .5) out.push([q[0], q[1], q[2]]);
        });
      }
      var c = cs2.backgroundColor, m = c && c.match(/rgba?\(([^)]+)\)/);
      if(m){
        var p = m[1].split(",").map(Number);
        if(p.length < 4 || p[3] > .5) out.push([p[0], p[1], p[2]]);
      }
      if(out.length) return out;
      if(bi && bi !== "none") return null;
    }
    return [[255,255,255]];
  }
  var small = [], taps = [], cut = [], text = [], nobg = [];
  document.querySelectorAll("body *").forEach(function(el){
    if(!seen(el)) return;
    var cs = getComputedStyle(el), fs2 = parseFloat(cs.fontSize);
    var own = [].slice.call(el.childNodes)
      .filter(function(n){ return n.nodeType === 3 && n.textContent.trim(); })
      .map(function(n){ return n.textContent.trim(); }).join(" ");
    var tag = el.tagName.toLowerCase() + (el.className && typeof el.className === "string"
      ? "." + el.className.trim().split(/\s+/)[0] : "");

    if(own && fs2 < MIN_FONT) small.push(tag + " " + fs2 + "px  " + own.slice(0,24));

    var click = el.tagName === "A" || el.tagName === "BUTTON" ||
                el.tagName === "INPUT" || el.hasAttribute("onclick");
    if(click){
      var r = el.getBoundingClientRect();
      if(r.height < MIN_TAP - 0.5)
        taps.push(tag + " " + Math.round(r.height) + "px  " + (el.textContent||"").trim().slice(0,20));
    }
    if(own && el.scrollWidth > el.clientWidth + 1)
      cut.push(tag + "  " + own.slice(0,28));

    if(own){
      var bg = bgOf(el);
      if(!bg){ nobg.push(tag); return; }
      var fg = cs.color.match(/rgba?\(([^)]+)\)/);
      if(!fg) return;
      var f = fg[1].split(",").map(Number);
      var big = fs2 >= 24 || (fs2 >= 18.66 && parseInt(cs.fontWeight,10) >= 700);
      text.push({ tag: tag, fg: [f[0],f[1],f[2]], bg: bg, size: fs2, big: big,
                  t: own.slice(0,24) });
    }
  });
  return { small: small, taps: taps, cut: cut, text: text, nobg: nobg,
           wide: document.documentElement.scrollWidth > window.innerWidth + 1,
           sw: document.documentElement.scrollWidth, vw: window.innerWidth };
};

function hex(a){ return "#" + a.map(function(n){ return ("0"+Math.round(n).toString(16)).slice(-2); }).join(""); }

(async function(){
  var routes = process.argv.slice(2).filter(function(a){ return a[0] !== "-"; });
  if(!routes.length){
    /* 인자가 없으면 빌드가 적어 둔 주소 **전부** 를 돕니다 */
    var rf = path.join(__dirname, "routes.json");
    routes = fs.existsSync(rf) ? JSON.parse(fs.readFileSync(rf, "utf8")).routes : ["/"];
  }
  var prove = process.argv.indexOf("--prove") >= 0;
  var port = 8731 + (process.pid % 90);
  var srv = (await serve(port)).srv;
  var b = await chromium.launch();
  var bad = 0, measured = 0;

  for(var i=0;i<routes.length;i++){
    for(var j=0;j<WIDTHS.length;j++){
      var w = WIDTHS[j];
      var p = await b.newPage({ viewport:{ width:w, height:900 } });
      var res = await p.goto("http://127.0.0.1:" + port + routes[i], { waitUntil:"networkidle" });
      if(!res || res.status() >= 400){
        console.error("❌ " + routes[i] + " " + (res ? res.status() : "응답 없음"));
        bad++; await p.close(); continue;
      }
      var r = await p.evaluate(PROBE, { font: MIN_FONT, tap: MIN_TAP });
      await p.close();

      var low = r.text.filter(function(t){
        var v = Math.min.apply(null, t.bg.map(function(b){ return ratio(hex(t.fg), hex(b)); }));
        t.r = v; return v < (t.big ? 3 : 4.5);
      });
      measured += r.text.length;
      var head = routes[i] + "  " + w + "px";
      var probs = [];
      if(r.wide) probs.push("가로 스크롤 " + r.sw + ">" + r.vw);
      if(r.small.length) probs.push(MIN_FONT + "px 미만 " + r.small.length + "건: " + r.small[0]);
      if(r.taps.length)  probs.push("누름 " + MIN_TAP + "px 미만 " + r.taps.length + "건:\n       " +
                                    r.taps.slice(0,6).join("\n       "));
      if(r.cut.length)   probs.push("글자 잘림 " + r.cut.length + "건:\n       " +
                                    r.cut.slice(0,6).join("\n       "));
      if(low.length)     probs.push("대비 미달 " + low.length + "건: " + low[0].tag + " " +
                                    low[0].r.toFixed(2) + " (" + low[0].t + ")");
      if(probs.length){ bad += probs.length; console.error("❌ " + head + "\n     " + probs.join("\n     ")); }
      else console.log("✅ " + head + "  글자 " + r.text.length + "칸 잼" +
                       (r.nobg.length ? "  (그라디언트라 못 잰 칸 " + r.nobg.length + ")" : ""));
    }
  }
  await b.close(); srv.close();

  /* ⚠️⚠️ **되돌려 보기** — 통과만 하고 아무것도 안 잡는 검사를 여러 번
     만들었습니다. 일부러 깨뜨려서 이 검사가 실패로 바뀌는지 봅니다. */
  if(prove){
    console.log("\n되돌려 보기 — 일부러 깨뜨립니다");
    var css = path.join(ROOT, "css/app.css"), keep = fs.readFileSync(css, "utf8");
    fs.writeFileSync(css, keep + "\n.cat-l{font-size:9px}\n.btn{min-height:22px;padding:0 10px}\n");
    var b2 = await chromium.launch(); var srv2 = (await serve(port + 1)).srv;
    var p2 = await b2.newPage({ viewport:{ width:1440, height:900 } });
    await p2.goto("http://127.0.0.1:" + (port+1) + "/", { waitUntil:"networkidle" });
    var r2 = await p2.evaluate(PROBE, { font: MIN_FONT, tap: MIN_TAP });
    await b2.close(); srv2.close();
    fs.writeFileSync(css, keep);
    console.log("  9px 글자를 넣으니 " + r2.small.length + "건 잡힘  " +
                (r2.small.length ? "O" : "❌ 아무것도 안 잡습니다"));
    console.log("  22px 단추를 넣으니 " + r2.taps.length + "건 잡힘  " +
                (r2.taps.length ? "O" : "❌ 아무것도 안 잡습니다"));
    console.log("  (css/app.css 는 되돌렸습니다)");
    if(!r2.small.length || !r2.taps.length) process.exit(1);
  }

  console.log("\n잰 글자 칸 " + measured + "개 · 문제 " + bad + "건");
  process.exit(bad ? 1 : 0);
})();
