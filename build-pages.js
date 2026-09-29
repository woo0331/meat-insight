#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   주소마다 진짜 HTML 파일을 만듭니다 (검색엔진용)

     node build-pages.js

   왜 필요한가:
   이 사이트는 화면을 브라우저에서 그립니다. 구글은 JS 를 돌리기는
   하지만 늦고 자주 건너뜁니다. 그래서 **제목·설명만이라도 HTML 에
   미리 박아 둡니다.** 크롤러는 JS 없이 바로 읽고, 손님 브라우저는
   평소처럼 앱이 그립니다.

   ⚠️ 이 스크립트는 브라우저 없이 돕니다. js/data/*.js 와 app.js 의
   routeInfo() 를 그대로 읽어 씁니다 — 주소 규칙이 한 곳에만 있어야
   화면과 정적 파일이 어긋나지 않습니다.
   ════════════════════════════════════════════════════════════════════ */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = __dirname;
const ORIGIN = "https://aboutmeat.co.kr";

/* ── 데이터와 routeInfo 를 가짜 window 에 올려 그대로 씁니다 ───── */
function loadApp(){
  const sb = { window:{}, document:null, console,
               location:{pathname:"/",search:""}, history:{},
               localStorage:null, setTimeout, clearTimeout };
  sb.window = sb;
  vm.createContext(sb);

  /* ⚠️ **순서가 곧 의존 순서입니다** — 뒤의 파일이 앞의 것을 씁니다.
     guides.js 는 problems.js 의 key 를 그대로 쓰므로 그 뒤여야 합니다. */
  const DATA = ["js/data/korean.js","js/data/brand.js","js/data/site.js",
                "js/data/regions.js","js/data/industries.js","js/data/catalog.js",
                "js/data/franchise.js","js/data/providers.js","js/data/market.js",
                "js/data/support.js","js/data/content.js","js/data/photos.js",
                "js/data/legal-terms.js","js/data/legal-privacy.js",
                "js/data/faq.js","js/data/tools.js"];

  /* ⚠️ 여기는 **glob 이 아니라 손으로 적은 목록**입니다. 새 데이터
     파일을 만들고 여기에 안 넣으면, 그 데이터를 쓰는 주소가 **에러
     없이 통째로 안 만들어집니다.** guides.js 에서 실제로 그랬습니다 —
     "페이지 33개" 만 보고 넘어갈 뻔했습니다. 그래서 셉니다. */
  const onDisk = fs.readdirSync(path.join(ROOT,"js/data"))
    .filter(f => f.endsWith(".js")).map(f => "js/data/"+f).sort();
  const missing = onDisk.filter(f => !DATA.includes(f));
  if(missing.length)
    throw new Error("js/data 에 있는데 build-pages 가 안 읽는 파일: " +
      missing.join(", ") + "\n   → 위의 DATA 목록에 **의존 순서에 맞게** 넣으세요.");

  for(const f of DATA)
    vm.runInContext(fs.readFileSync(path.join(ROOT,f),"utf8"), sb, {filename:f});

  /* app.js 는 통째로 돌리면 document 를 건드립니다. 필요한 조각만
     떼어 냅니다 — META · NOINDEX · SOON · routeInfo 뿐입니다. */
  const app = fs.readFileSync(path.join(ROOT,"js/app.js"),"utf8");
  const from = app.indexOf("var META = {");
  const to   = app.indexOf("/* ── 화면 옮기기");
  if(from < 0 || to < 0)
    throw new Error("app.js 에서 META~routeInfo 를 못 찾았습니다 — 주석을 바꾸셨나요?");
  vm.runInContext(app.slice(from, to), sb, {filename:"js/app.js"});
  return sb;
}

/* ── 만들 주소 ───────────────────────────────────────────────────
   ⚠️ 화면을 새로 만들면 여기에도 넣어야 HTML 파일이 생깁니다.
   안 넣으면 열리기는 하지만 검색에 안 잡힙니다. */
function allRoutes(W){
  const fixed = ["/", "/startup", "/closure", "/providers", "/franchise",
                 "/stores", "/assets", "/support", "/content",
                 "/quote", "/join", "/my", "/search",
                 "/tools", "/tools/cost", "/tools/fixed", "/tools/bep",
                 "/tools/labor", "/tools/vs", "/tools/close",
                 "/faq", "/about", "/terms", "/privacy"];
  /* 업종별 창업 · 폐업 — **검색에서 들어오는 제일 큰 문**입니다
     ("카페 창업" · "음식점 폐업"). 반드시 진짜 HTML 파일이어야 합니다. */
  const inds  = (W.AM_INDUSTRIES || []).map(i => i.key);
  const flows = inds.map(k => "/startup/" + k).concat(inds.map(k => "/closure/" + k));
  /* 업체를 찾는 분류 — /providers/interior 처럼 (§46) */
  const pcats = (W.AM_CATS || []).filter(c => c.kind === "provider")
                  .map(c => "/providers/" + c.key);
  /* 정보 · 매물 성격의 분류 — ⚠️ `to` 가 따로 있는 것은 그 주소가
     진짜 화면이므로 여기서 또 만들지 않습니다 (주소 두 개가 같은
     내용을 내면 구글이 둘 다 무시합니다). */
  const icats = (W.AM_CATS || []).filter(c => c.kind !== "provider" && !c.to)
                  .map(c => "/c/" + c.key);
  const fcats = (W.AM_FRANCHISE_CATS || []).map(c => "/franchise/" + c.key);
  /* 업체 · 브랜드 · 글은 **등록된 것만** 주소가 됩니다. 지금 0 건이라
     0 개가 만들어집니다 — 없는 것을 만들지 않습니다. */
  const pvs = (W.AM_PROVIDERS || []).map(p => "/p/" + p.id);
  const frs = (W.AM_FRANCHISES || []).map(f => "/f/" + f.slug);
  const cts = (W.AM_CONTENTS  || []).map(c => "/content/" + c.slug);
  return fixed.concat(flows, pcats, icats, fcats, pvs, frs, cts);
}

function esc(s){
  return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

/* ── 구조화 데이터 (JSON-LD) ──────────────────────────────────
   구글이 제목·설명 말고 **이 화면이 무엇인지**를 읽는 자리입니다.

   ⚠️⚠️ **`aggregateRating` 을 넣지 마세요.** 검색 결과에 별이 뜨는데,
   그 별은 실제 후기가 있어야 붙이는 것입니다. 없는 별을 붙이면 지어낸
   숫자를 구글에까지 내보내는 셈이고, 적발되면 리치 결과가 통째로
   막힙니다.
   ⚠️ **화면에 없는 것을 여기에만 적지 마세요.** 구글은 "구조화 데이터가
   화면 내용과 같아야 한다" 고 못 박아 두었습니다. */
/* ⚠️ `jsonLd()` 는 **객체 배열**을 돌려줍니다. 화면에 넣을 때는 반드시
   이 함수를 거치세요 — 그냥 문자열로 이으면 `[object Object]` 가
   화면 맨 위에 찍힙니다. 실제로 한 번 그렇게 나갔습니다. */
function ldTags(arr){
  if(!arr || !arr.length) return "";
  return arr.map(o =>
    '<script type="application/ld+json">' +
    JSON.stringify(o).replace(/</g,"\\u003c") +
    '</' + 'script>').join("\n");
}

function jsonLd(W, r, route){
  const B = W.AM_BRAND || {};
  const out = [];
  const crumb = (items) => ({
    "@context":"https://schema.org","@type":"BreadcrumbList",
    itemListElement: items.map((it,i) => ({
      "@type":"ListItem", position:i+1, name:it[0],
      item: ORIGIN + it[1]
    }))
  });

  if(route === "/"){
    out.push({
      "@context":"https://schema.org","@type":"WebSite",
      name:B.name, url:ORIGIN, inLanguage:"ko", description:B.desc,
      potentialAction:{ "@type":"SearchAction",
        target:{ "@type":"EntryPoint", urlTemplate: ORIGIN+"/search?q={q}" },
        "query-input":"required name=q" }
    });
    out.push({
      "@context":"https://schema.org","@type":"Organization",
      name:B.name, url:ORIGIN, logo:ORIGIN+"/icon-512.png", description:B.desc
    });
    /* ⚠️ FAQPage 는 **여기 말고 `/faq`** 에 답니다. 메인은 여섯만
       발췌로 내는데, 발췌에 FAQPage 를 달면 화면에 없는 질문이
       구조화 데이터로 나가거나 같은 FAQ 가 두 주소로 중복됩니다. */
    return out;
  }

  if(route === "/faq"){
    const fq = W.AM_FAQ || [];
    /* ⚠️ 비면 안 넣습니다 — 빈 FAQPage 는 오류로 잡힙니다.
       ⚠️ 화면(PageFaq)과 **같은 파일**(js/data/faq.js)을 읽습니다.
       한쪽만 고치면 구조화 데이터와 화면이 어긋나고, 적발되면
       리치 결과가 통째로 막힙니다.
       ⚠️ 메인에는 달지 않습니다 — 거기는 여섯만 발췌로 냅니다. */
    if(fq.length) out.push({
      "@context":"https://schema.org","@type":"FAQPage",
      mainEntity: fq.map(x => ({
        "@type":"Question", name:x.q,
        acceptedAnswer:{ "@type":"Answer", text:x.a }
      }))
    });
    out.push(crumb([["홈","/"],["자주 묻는 것","/faq"]]));
    return out;
  }

  const mi = /^\/(startup|closure)\/([a-z0-9-]+)$/.exec(route);
  if(mi){
    const side = mi[1] === "startup" ? "창업" : "폐업";
    const ind = (W.AM_INDUSTRIES||[]).filter(x => x.key === mi[2])[0];
    if(ind){
      out.push(crumb([[side, "/"+mi[1]], [ind.name+" "+side, route]]));
      /* 이 화면이 하는 일은 **필요한 것을 목록으로 보여 주는 것**입니다 */
      const cats = (W.AM_CATS||[]).filter(c =>
        ((mi[1]==="startup" ? ind.startup : ind.closure)||[]).indexOf(c.key) >= 0);
      if(cats.length) out.push({
        "@context":"https://schema.org","@type":"ItemList",
        name: ind.name+" "+side+"에 필요한 것",
        itemListElement: cats.map((c,i) => ({
          "@type":"ListItem", position:i+1, name:c.name }))
      });
    }
    return out;
  }
  const mp = /^\/providers\/([a-z0-9-]+)$/.exec(route);
  if(mp){
    const c = (W.AM_CATS||[]).filter(x => x.key === mp[1])[0];
    if(c){
      out.push(crumb([["업체찾기","/providers"], [c.name, route]]));
      out.push({
        "@context":"https://schema.org","@type":"ItemList",
        name: c.name, itemListElement:(c.items||[]).map((it,i) => ({
          "@type":"ListItem", position:i+1, name:it.name }))
      });
    }
    return out;
  }
  const mf = /^\/franchise\/([a-z0-9-]+)$/.exec(route);
  if(mf){
    const c = (W.AM_FRANCHISE_CATS||[]).filter(x => x.key === mf[1])[0];
    if(c) out.push(crumb([["프랜차이즈","/franchise"], [c.name, route]]));
    return out;
  }
  const mc = /^\/content\/([a-z0-9-]+)$/.exec(route);
  if(mc){
    const ct = (W.AM_CONTENTS||[]).filter(x => x.slug === mc[1])[0];
    if(ct){
      out.push(crumb([["정보","/content"], [ct.title, route]]));
      out.push({
        "@context":"https://schema.org","@type":"Article",
        headline:ct.title, description:ct.lead, inLanguage:"ko",
        datePublished:ct.at, author:{ "@type":"Organization", name:B.name }
      });
    }
    return out;
  }
  const mcc = /^\/c\/([a-z0-9-]+)$/.exec(route);
  if(mcc){
    const c = (W.AM_CATS||[]).filter(x => x.key === mcc[1])[0];
    if(c){
      const side = ((W.AM_START_CATS||[]).some(x=>x.key===c.key)) ? "창업" : "폐업";
      out.push(crumb([[side, side==="창업"?"/startup":"/closure"], [c.name, route]]));
    }
    return out;
  }
  return out;
}

function shell(tpl, r, route, noscript, ld){
  const B = (globalThis.__W && globalThis.__W.AM_BRAND) || {};
  const site = (B.name || "") + " · " + (B.sub || "");
  const title = (r.title ? r.title+" · " : "") + site;
  const canon = ORIGIN + (r.canon || route);
  let h = tpl;
  h = h.replace(/<title>[\s\S]*?<\/title>/, "<title>"+esc(title)+"</title>");
  h = h.replace(/<meta name="description"[^>]*>/,
        '<meta name="description" content="'+esc(r.desc||"")+'">');
  h = h.replace(/<meta property="og:title"[^>]*>/,
        '<meta property="og:title" content="'+esc(title)+'">');
  h = h.replace(/<meta property="og:description"[^>]*>/,
        '<meta property="og:description" content="'+esc(r.desc||"")+'">');
  h = h.replace(/<meta property="og:url"[^>]*>/,
        '<meta property="og:url" content="'+esc(canon)+'">');
  /* ⚠️ index.html 에 canonical 이 **손으로 박혀 있습니다**(메인은
     build-pages 가 덮어쓰지 않는 파일이라 그렇게 두었습니다). 여기서
     canonical 을 덧붙이면 화면마다 canonical 이 **둘**이 됩니다.
     구글은 서로 다른 canonical 이 둘이면 **둘 다 무시**하고, 먼저 오는
     것만 읽는 크롤러에게는 모든 화면이 메인의 복제본으로 읽힙니다.
     ⚠️ 그래서 덧붙이지 않고 **갈아 끼웁니다.** 화면은 JS 가 다시
     고쳐 주기 때문에 브라우저로 봐서는 표가 안 납니다 — 실제로 그렇게
     한동안 두 개가 나가고 있었습니다. */
  if(!/<link rel="canonical"[^>]*>/.test(h))
    throw new Error("index.html 에 canonical 이 없습니다 — 갈아 끼울 자리가 없습니다");
  h = h.replace(/<link rel="canonical"[^>]*>/,
        '<link rel="canonical" href="'+esc(canon)+'">');

  /* ⚠️⚠️ **템플릿의 ld 표시 구간을 반드시 비웁니다.** 하위 화면은
     `index.html` 을 본으로 뜨는데, 거기에는 **메인의** 구조화 데이터가
     이미 들어 있습니다. 비우지 않고 뒤에 덧붙이면 화면마다 메인 것이
     같이 나가고, 앞선 빌드가 남긴 낡은 글까지 그대로 따라갑니다 —
     실제로 `[object Object]` 가 모든 하위 화면 맨 위에 찍혀 나갔습니다.
     메인(`/`)은 이 함수를 타지 않고 표시 구간에 직접 씁니다. */
  const la = h.indexOf("<!-- ld:start -->"), lb = h.indexOf("<!-- ld:end -->");
  if(la < 0 || lb < 0)
    throw new Error("index.html 에서 ld:start / ld:end 표시를 못 찾았습니다 — 지우셨나요?");
  h = h.slice(0, la) + "<!-- ld:start -->\n<!-- ld:end -->" +
      h.slice(lb + "<!-- ld:end -->".length);

  const head =
    (r.noindex ? '<meta name="robots" content="noindex, follow">\n' : '')+
    (r.noindex ? '' : (ld ? ld+'\n' : ''));
  if(head) h = h.replace("</head>", head+"</head>");

  /* 만든 것을 바로 세어 봅니다 — 위를 고치다 다시 둘이 되는 일을 막습니다 */
  const n = (h.match(/<link rel="canonical"/g) || []).length;
  if(n !== 1) throw new Error(route+" 의 canonical 이 "+n+"개입니다 (하나여야 합니다)");
  /* ⚠️ **크롤러 본문을 `<noscript>` 안에 두지 마세요.** 구글은 읽긴
     하지만 뒤로 미루고, 네이버·빙·카카오·LLM 봇은 대개 **통째로
     무시**합니다. 실제로 www.aboutmeat.co.kr 을 밖에서 열어 보니
     본문이 "본문 바로가기" 한 줄로만 잡혔습니다.
     그래서 진짜 `<main id="view">` **안에** 넣습니다. 화면을 그릴 때
     app.js 의 render() 가 innerHTML 로 갈아 끼우므로 손님 눈에는
     아무 차이가 없고, 첫 그림이 오히려 빨라집니다. */
  const mainTag = '<main id="view">';
  const mi = h.indexOf(mainTag);
  if(mi < 0) throw new Error(route+' 에 <main id="view"> 가 없습니다');
  const me = h.indexOf("</main>", mi);
  if(me < 0) throw new Error(route+" 에 </main> 가 없습니다");
  h = h.slice(0, mi + mainTag.length) +
      '<div class="pre w">' + noscript + '</div>' +
      h.slice(me);
  return h;
}

/* ── 크롤러가 읽는 본문 ────────────────────────────────────────
   **검색엔진에게는 이 글이 사이트 전부입니다.** 자바스크립트를 돌리기
   전의 HTML 에 본문이 없으면, 네이버 · 빙 · 카카오 · LLM 봇은 빈
   화면을 봅니다.

   ⚠️ **`<noscript>` 안에 넣지 마세요.** 진짜 `<main id="view">` 안에
   써 넣습니다. 화면을 그릴 때 `render()` 가 갈아 끼우므로 손님 눈에는
   차이가 없고, 첫 그림은 오히려 빨라집니다.
   ⚠️⚠️ **지어낸 것을 여기에 적지 마세요.** 화면에 없는 업체 수 · 후기 ·
   실적을 여기에만 적으면 그게 구글에까지 나가는 거짓말입니다. 전부
   `js/data` 에서 그대로 가져옵니다.
   ⚠️ 데이터를 새로 만들면 여기에도 넣으세요. */
function noscriptFor(W, r, route){
  const B = W.AM_BRAND || {};
  const L = [];
  const h1 = t => L.push("<h1>"+esc(t)+"</h1>");
  const h2 = t => L.push("<h2>"+esc(t)+"</h2>");
  const p  = t => L.push("<p>"+esc(t)+"</p>");
  const ul = xs => { if(xs.length) L.push("<ul>"+xs.map(x=>"<li>"+esc(x)+"</li>").join("")+"</ul>"); };
  const catNames = cs => cs.map(c => c.name + " — " + c.lead);
  const subNames = c => (c.items||[]).map(i => i.name);

  h1(r.title || B.name);
  p(r.desc || B.desc);

  if(route === "/"){
    /* ⚠️ 화면의 Split Hero 와 **같은 말**이어야 합니다. 크롤러가
       읽는 것과 손님이 보는 것이 다르면 그게 구글에 나가는 거짓말
       입니다. 화면의 두 낱말과 두 문장을 그대로 옮겨 둡니다. */
    h2("창업 — 처음부터 제대로.");
    p("점포부터 인테리어, 장비, 프랜차이즈, 세무, 마케팅까지.");
    h2("폐업 — 끝까지 제대로.");
    p("매장양도부터 집기처분, 철거, 원상복구, 세무까지.");
    /* ⚠️ 화면의 "우리가 다루는 범위" 와 같은 값이어야 합니다. 여기서만
       크게 적으면 그게 구글에 나가는 거짓말입니다 — 그래서 화면과
       똑같이 **그 자리에서 셉니다.** */
    h2("우리가 다루는 범위");
    p("업종 " + (W.AM_INDUSTRIES||[]).length +
      " · 창업 " + (W.AM_START_CATS||[]).length +
      "분야 · 폐업 " + (W.AM_CLOSE_CATS||[]).length +
      "분야 · 세부 서비스 " + (W.AM_CATS||[]).reduce(function(a,c){
        return a + ((c.items||[]).length); }, 0) +
      ". 이 숫자는 다루는 분야의 수이고, 등록된 업체 수나 거래 실적이 아닙니다.");
    h2("창업 — 사업을 시작하는 데 필요한 모든 것");
    ul(catNames(W.AM_START_CATS||[]));
    h2("폐업 — 사업을 정리하는 데 필요한 모든 것");
    ul(catNames(W.AM_CLOSE_CATS||[]));
    h2("업종");
    ul((W.AM_INDUSTRIES||[]).map(i => i.name + " — " + i.lead));
    h2("어떻게 진행되나");
    ul(["조건을 고릅니다 — 업종 · 지역 · 필요한 서비스. 가입하지 않으셔도 됩니다.",
        "한 번만 적어 보냅니다 — 같은 내용을 업체마다 다시 적지 않으셔도 됩니다.",
        "받으신 제안을 나란히 놓습니다 — 무엇이 포함됐는지가 같아야 비교가 뜻을 가집니다."]);
    h2("한 사장님의 끝이 다른 사장님의 시작이 됩니다");
    p("정리하시는 사장님이 내놓은 점포 · 시설 · 집기 · 재고를, 같은 업종을 "+
      "준비하는 사장님이 찾습니다.");
    /* ⚠️ 화면(FaqBand)이 여섯만 내므로 여기도 여섯입니다. 크롤러에게만
       더 보여 주면 화면과 다른 것을 내보내는 셈입니다. 전체는 /faq 에
       있고 그 주소가 sitemap 에 들어 있습니다. */
    const fq2 = (W.AM_FAQ || []).slice(0, 6);
    if(fq2.length){
      h2("자주 묻는 것");
      fq2.forEach(x => { L.push("<h3>"+esc(x.q)+"</h3>"); p(x.a); });
    }
    return L.join("");
  }

  if(route === "/faq"){
    (W.AM_FAQ||[]).forEach(x => { L.push("<h2>"+esc(x.q)+"</h2>"); p(x.a); });
    return L.join("");
  }
  if(route === "/tools"){
    h2("무료로 쓰실 수 있는 계산기");
    (W.AM_TOOLS||[]).forEach(t => {
      L.push("<h3>"+esc(t.name)+"</h3>");
      p(t.lead + " — " + t.ask + " 를 적으시면 " + t.out + " 이 나옵니다.");
    });
    /* ⚠️ 여기에 기준값을 적지 마세요 — "인건비율 25%면 정상" 같은 것은
       업종 · 지역마다 달라서 근거를 댈 수 없습니다. */
    p("전부 사장님이 적으신 숫자를 나누는 것까지입니다. 기준값을 만들어 " +
      "좋다 나쁘다 판정하지 않습니다. 적으신 숫자는 이 브라우저에만 남고 " +
      "서버로 보내지 않습니다.");
    return L.join("");
  }
  const mtl = /^\/tools\/([a-z]+)$/.exec(route);
  if(mtl){
    const t = (W.AM_TOOLS||[]).filter(x => x.key === mtl[1])[0];
    if(t){
      h2(t.name);
      p(t.lead + ".");
      p(t.ask + " 를 적으시면 " + t.out + " 이 나옵니다. 안 적으신 칸은 " +
        "계산에서 빠지고, 업계 평균으로 메우지 않습니다.");
      if(t.key === "cost"){
        h2("적는 항목");
        (W.AM_COST_GROUPS||[]).forEach(g => {
          L.push("<h3>"+esc(g.h)+"</h3>");
          ul(g.items.map(i => i.name));
        });
      }
      if(t.key === "close"){
        h2("짚어 볼 것");
        (W.AM_CLOSE_CHECK||[]).forEach(g => {
          L.push("<h3>"+esc(g.h)+"</h3>");
          ul(g.items.map(i => i.t + (i.due ? " (기한 있음)" : "")));
        });
      }
      if(t.key === "bep" || t.key === "fixed"){
        h2("적는 항목");
        ul((W.AM_FIXED||[]).map(r => r.name + " — " + r.hint));
      }
      if(t.key === "labor"){
        h2("적는 항목");
        ul((W.AM_LABOR||[]).map(r => r.name + " — " + r.hint));
      }
      if(t.key === "vs"){
        h2("나란히 놓는 것");
        ul((W.AM_VS||[]).map(r => (r.side === "new" ? "새로 만들 때 · " : "가게를 받을 때 · ") + r.name));
      }
    }
    return L.join("");
  }

  const mi = /^\/(startup|closure)\/([a-z0-9-]+)$/.exec(route);
  if(mi){
    const ind = (W.AM_INDUSTRIES||[]).filter(x => x.key === mi[2])[0];
    if(ind){
      const start = mi[1] === "startup";
      const order = (start ? ind.startup : ind.closure) || [];
      const all = start ? (W.AM_START_CATS||[]) : (W.AM_CLOSE_CATS||[]);
      const cats = order.map(k => all.filter(c => c.key === k)[0]).filter(Boolean);
      if(ind.equip && ind.equip.length){
        h2(ind.name + (start ? " 창업에 필요한 장비" : " 정리할 시설 · 장비"));
        ul(ind.equip.map(e => e.name));
      }
      h2(ind.name + (start ? " 창업에 필요한 모든 것" : " 폐업에 필요한 모든 것"));
      cats.forEach(c => { L.push("<h3>"+esc(c.name)+"</h3>"); p(c.desc); ul(subNames(c)); });
      if(!start && (ind.stock||[]).length){ h2("재고 처분"); ul(ind.stock); }
    }
    return L.join("");
  }

  const mp = /^\/providers\/([a-z0-9-]+)$/.exec(route);
  const mc = /^\/c\/([a-z0-9-]+)$/.exec(route);
  if(mp || mc){
    const key = (mp||mc)[1];
    const c = (W.AM_CATS||[]).filter(x => x.key === key)[0];
    if(c){
      h2(c.name + " — " + c.lead);
      ul(subNames(c));
      h2("업종별로 찾기");
      ul((W.AM_INDUSTRIES||[]).map(i => i.name));
      h2("지역별로 찾기");
      ul((W.AM_REGIONS||[]).map(x => x.name));
    }
    return L.join("");
  }

  if(route === "/startup" || route === "/closure"){
    const start = route === "/startup";
    h2("업종");
    ul((W.AM_INDUSTRIES||[]).map(i => i.name + " — " + i.lead));
    h2(start ? "창업에 필요한 모든 것" : "폐업에 필요한 모든 것");
    (start ? (W.AM_START_CATS||[]) : (W.AM_CLOSE_CATS||[])).forEach(c => {
      L.push("<h3>"+esc(c.name)+"</h3>"); p(c.desc); ul(subNames(c));
    });
    return L.join("");
  }

  if(route === "/providers"){
    (W.AM_CATS||[]).filter(c => c.kind === "provider").forEach(c => {
      L.push("<h3>"+esc(c.name)+"</h3>"); p(c.desc); ul(subNames(c));
    });
    h2("지역");
    ul((W.AM_REGIONS||[]).map(x => x.name));
    return L.join("");
  }

  if(route === "/franchise" || /^\/franchise\//.test(route)){
    h2("프랜차이즈 분류");
    ul((W.AM_FRANCHISE_CATS||[]).map(c => c.name));
    h2("브랜드마다 확인하실 것");
    ul(["총 예상 창업비","가맹비","교육비","보증금","인테리어비","설비비",
        "권장 평수","가맹점 수","본사 지원","모집지역","정보공개서"]);
    p("본사가 직접 등록하고 정보공개서로 확인한 값만 올립니다.");
    return L.join("");
  }

  if(route === "/stores"){
    h2("이런 조건으로 찾습니다");
    ul(["지역","업종","평수","보증금","월세","권리금","시설 인수 가능 여부"]);
    h2("업종");  ul((W.AM_INDUSTRIES||[]).map(i => i.name));
    h2("지역");  ul((W.AM_REGIONS||[]).map(x => x.name));
    return L.join("");
  }
  if(route === "/assets"){
    h2("업종별로 나오는 시설 · 장비");
    (W.AM_INDUSTRIES||[]).filter(i => (i.equip||[]).length).forEach(i => {
      L.push("<h3>"+esc(i.name)+"</h3>");
      ul(i.equip.map(e => e.name).concat(i.stock||[]));
    });
    return L.join("");
  }
  if(route === "/support"){
    h2("자금 · 정부지원");
    ul(["창업자금","정책자금","정부지원사업","보증제도",
        "폐업지원","철거비 지원","재취업","재창업"]);
    p("공고 원문을 확인한 것만 올립니다. 지원사업은 해마다 바뀌고 예산이 "+
      "소진되면 중간에 닫힙니다.");
    return L.join("");
  }
  if(route === "/join"){
    h2("입점 분야");
    (W.AM_CATS||[]).filter(c => c.kind === "provider").forEach(c => {
      L.push("<h3>"+esc(c.name)+"</h3>"); ul(subNames(c));
    });
    return L.join("");
  }
  if(route === "/content"){
    h2("창업 · 폐업 정보");
    ul((W.AM_CONTENTS||[]).map(c => c.title));
    /* ⚠️ 글이 아직 없어도 **무엇을 다루는 자리인지**는 적습니다.
       크롤러에게 빈 화면을 주면 이 주소는 없는 것과 같습니다.
       ⚠️ 여기에 금액을 적지 마세요 — 근거를 댈 수 없으면 "무엇이
       금액을 가르는가" 를 적습니다 (§45). */
    h2("창업에서 막히는 것");
    ul(["업종별 창업비용은 무엇이 가르는가 — 평수 · 지역 · 철거 유무 · 시설 인수 여부",
        "권리금은 무엇에 대한 값인가",
        "사업자등록과 업종별 인허가 순서",
        "상가 임대차계약에서 확인할 것",
        "정책자금과 정부지원사업 신청 조건"]);
    h2("폐업에서 막히는 것");
    ul(["폐업 절차와 기한이 있는 신고",
        "원상복구 범위는 계약서의 어디를 보는가",
        "철거비는 무엇이 가르는가 — 평수 · 층수 · 폐기물 종류 · 반출 조건",
        "시설과 집기를 버리지 않고 넘기는 방법",
        "직원 퇴직금과 4대보험 정리 순서",
        "인터넷 · POS · 렌탈 계약 해지와 위약금"]);
    p("근거를 댈 수 있는 것만 씁니다. 법령과 제도는 바뀌므로 확인하는 곳을 " +
      "같이 적습니다 (관할 구청 · 세무서 · 고용노동부).");
    return L.join("");
  }
  const mct = /^\/content\/([a-z0-9-]+)$/.exec(route);
  if(mct){
    const ct = (W.AM_CONTENTS||[]).filter(x => x.slug === mct[1])[0];
    /* ⚠️ 별표를 **떼고** 내보냅니다. 화면은 `mark()` 가 `**굵게**` 를
       `<b>` 로 살리지만, 여기는 `esc()` 라 별표가 글자로 남습니다 —
       크롤러와 LLM 봇이 읽는 것이 그 글입니다. */
    const plain = t => String(t||"").replace(/\*\*/g, "");
    if(ct) (ct.body||[]).forEach(b => {
      if(b.h) h2(plain(b.h));
      (b.p||[]).forEach(t => p(plain(t)));
      ul((b.ul||[]).map(plain));
    });
    /* 법령은 바뀝니다 — 확인하는 곳을 크롤러에게도 냅니다 */
    if(ct && (ct.source||[]).length){
      h2("확인하는 곳");
      ul(ct.source.map(x => x.name + " — " + x.where));
    }
    return L.join("");
  }
  /* 약관 · 방침 — ⚠️ 본문이 데이터에 있으므로 조문 제목이라도 냅니다.
     크롤러에게 빈 화면을 주면 이 주소는 없는 것과 같습니다. */
  if(route === "/terms" || route === "/privacy"){
    const D = route === "/terms" ? (W.WOW_TERMS||{}) : (W.WOW_PRIVACY||{});
    if(D.intro) p(D.intro);
    (D.articles || D.sections || []).forEach(a => {
      const t = a.title || a.h || "";
      if(t) h2(t);
      const items = a.items || a.body || a.lines || [];
      ul(items.filter(x => typeof x === "string"));
    });
    return L.join("");
  }
  if(route === "/about"){
    h2("하는 일");
    ul(["필요한 업체 · 전문가 · 프랜차이즈를 분류와 지역으로 찾아 드립니다.",
        "한 번 적으신 내용을 조건이 맞는 여러 곳에 같이 전달합니다.",
        "정리하시는 사장님의 점포 · 시설 · 집기를 시작하시는 사장님께 이어 드립니다."]);
    h2("하지 않는 일");
    ul(["직접 인테리어 · 철거 · 세무 · 마케팅을 하지 않습니다.",
        "광고비를 받고 업체 순서를 바꾸지 않습니다.",
        "등록된 적 없는 업체 · 브랜드 · 매물을 화면에 만들지 않습니다.",
        "거래 당사자가 아닙니다."]);
    return L.join("");
  }
  return L.join("");
}

function checkCssVars(){
  const files = ["css/tokens.css","css/app.css","css/pages.css"];
  const src = files.map(f => fs.readFileSync(path.join(ROOT,f),"utf8"));
  const all = src.join("\n");
  const defined = new Set();
  for(const m of all.matchAll(/(--[a-z0-9-]+)\s*:/g)) defined.add(m[1]);

  const bad = [];
  files.forEach((f,i) => {
    src[i].split("\n").forEach((line, n) => {
      /* 되돌림 값이 있으면 `var(--x, …)` — 쉼표가 있는 것은 건너뜁니다 */
      for(const m of line.matchAll(/var\(\s*(--[a-z0-9-]+)\s*\)/g))
        if(!defined.has(m[1])) bad.push(f+":"+(n+1)+"  "+m[1]);
    });
  });
  if(bad.length)
    throw new Error("정의되지 않은 CSS 변수를 쓰고 있습니다 (그 줄은 " +
      "**조용히 무시됩니다**):\n   " + bad.join("\n   "));
}

function checkVercel(){
  const vj = JSON.parse(fs.readFileSync(path.join(ROOT,"vercel.json"),"utf8"));
  for(const g of (vj.headers||[])){
    for(const k of Object.keys(g))
      if(!["source","headers","has","missing"].includes(k))
        throw new Error("vercel.json headers 에 알 수 없는 키: "+k);
    for(const h of (g.headers||[]))
      for(const k of Object.keys(h))
        if(!["key","value"].includes(k))
          throw new Error("vercel.json 헤더 항목에 알 수 없는 키: "+k+" (key·value 만 됩니다)");
  }
  for(const r of (vj.rewrites||[]))
    for(const k of Object.keys(r))
      if(!["source","destination","has","missing"].includes(k))
        throw new Error("vercel.json rewrites 에 알 수 없는 키: "+k);
}

/* ── 실행 ─────────────────────────────────────────────────────── */
checkCssVars();
checkVercel();
const W = loadApp();
globalThis.__W = W;   /* shell() 이 브랜드 이름을 읽습니다 */
const tpl = fs.readFileSync(path.join(ROOT,"index.html"),"utf8");
const routes = allRoutes(W);

let made = 0, skipped = 0;
const sitemap = [];
const wrote = new Set();
const seenTitle = new Map(), seenDesc = new Map();

for(const route of routes){
  const r = W.routeInfo(route, {});
  if(!r.ok){ console.error("  ! 알 수 없는 주소: "+route); skipped++; continue; }
  const html = shell(tpl, r, route, noscriptFor(W, r, route), ldTags(jsonLd(W, r, route)));

  if(route !== "/"){
    const dir = path.join(ROOT, route.replace(/^\//,""));
    fs.mkdirSync(dir, {recursive:true});
    fs.writeFileSync(path.join(dir,"index.html"), html);
    wrote.add(path.join(dir,"index.html"));
    made++;
  }
  /* "/" 는 index.html 자체라 덮어쓰지 않습니다 — 원본이 틀어집니다.
     다만 구조화 데이터만은 **표시한 줄 사이에** 써 넣습니다.
     안 그러면 메인에만 JSON-LD 가 없게 됩니다. */
  if(route === "/"){
    const ld = ldTags(jsonLd(W, r, route));
    const tplPath = path.join(ROOT, "index.html");
    let src = fs.readFileSync(tplPath, "utf8");
    const a = src.indexOf("<!-- ld:start -->"), b = src.indexOf("<!-- ld:end -->");
    if(a < 0 || b < 0)
      throw new Error("index.html 에서 ld:start / ld:end 표시를 못 찾았습니다 — 지우셨나요?");
    src = src.slice(0, a) + "<!-- ld:start -->\n" + ld + "\n" +
          src.slice(b);
    /* ⚠️ **메인에는 크롤러 본문이 통째로 없었습니다.** index.html 은
       원본이라 shell() 이 손대지 않는데, 그래서 `<main id="view">` 가
       빈 칸인 채로 나갔습니다 — 밖에서 확인하니 본문이 "본문 바로가기"
       한 줄뿐이었습니다. 제일 중요한 화면이 제일 비어 있었습니다.
       여기도 표시한 줄 사이에 써 넣습니다. */
    const c1 = "<!-- crawl:start -->", c2 = "<!-- crawl:end -->";
    const ca = src.indexOf(c1), cb = src.indexOf(c2);
    if(ca < 0 || cb < 0)
      throw new Error("index.html 에서 crawl:start / crawl:end 표시를 못 찾았습니다 — 지우셨나요?");
    src = src.slice(0, ca) + c1 + '<div class="pre w">' +
          noscriptFor(W, r, route) + "</div>" + src.slice(cb);
    fs.writeFileSync(tplPath, src);
  }

  if(!r.noindex){
    sitemap.push(route);
    const T = (r.title||"")+"", D = (r.desc||"")+"";
    (seenTitle.get(T) || seenTitle.set(T,[]).get(T)).push(route);
    (seenDesc.get(D)  || seenDesc.set(D,[]).get(D)).push(route);
  }
}

/* ⚠️ 제목·설명이 겹치면 구글 서치콘솔이 "중복" 으로 표시하고,
   검색 결과 두 줄이 같은 말을 합니다. */
const dups = (map, what) => {
  const bad = [...map.entries()].filter(([,v]) => v.length > 1);
  if(bad.length){
    for(const [txt,rs] of bad.slice(0,5))
      console.error("  ! "+what+"이 겹칩니다: "+rs.join(" · ")+"  →  "+txt.slice(0,50));
    throw new Error(what+"이 겹치는 곳이 "+bad.length+"군데 있습니다");
  }
};
dups(seenTitle,"제목"); dups(seenDesc,"설명");

/* ── 없어진 주소의 파일을 치웁니다 ─────────────────────────────
   화면을 지우면 그 폴더가 그대로 남습니다. 남으면 sitemap 에는 없는데
   주소는 살아 있어, 예전에 색인된 손님과 크롤러가 계속 그 화면을 봅니다.
   ⚠️ 이번에 만든 주소의 **맨 윗 칸**만 훑습니다 — css·js·img 는
   건드리지 않습니다. */
const roots = new Set(routes.filter(r => r !== "/").map(r => r.split("/")[1]));
let removed = 0;
function sweep(dir){
  let left = 0;
  for(const ent of fs.readdirSync(dir, {withFileTypes:true})){
    const full = path.join(dir, ent.name);
    if(ent.isDirectory()){ if(sweep(full)) left++; else fs.rmdirSync(full); }
    else if(ent.name === "index.html" && !wrote.has(full)){
      fs.unlinkSync(full);
      console.log("  · 없어진 주소를 치웁니다: /"+path.relative(ROOT,dir));
      removed++;
    }
    else left++;
  }
  return left;
}
for(const root of roots){
  const d = path.join(ROOT, root);
  if(fs.existsSync(d) && fs.statSync(d).isDirectory()) sweep(d);
}

/* ── sitemap ──────────────────────────────────────────────────── */
const today = new Date().toISOString().slice(0,10);
const prio = r => r === "/" ? "1.0" : /^\/(sos|check|start|lab)$/.test(r) ? "0.8"
                : r.indexOf("/lab/") === 0 ? "0.7" : "0.6";
fs.writeFileSync(path.join(ROOT,"sitemap.xml"),
'<?xml version="1.0" encoding="UTF-8"?>\n'+
'<!-- build-pages.js 가 만듭니다 ('+today+'). 손으로 고치지 마세요. -->\n'+
'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+
sitemap.map(r=>'  <url><loc>'+ORIGIN+r+'</loc><lastmod>'+today+
  '</lastmod><priority>'+prio(r)+'</priority></url>').join("\n")+
'\n</urlset>\n');

console.log("페이지 "+made+"개"+(skipped?" (건너뜀 "+skipped+")":"")+
            (removed?" · 치운 주소 "+removed+"개":"")+
            " · sitemap "+sitemap.length+"개 주소");
