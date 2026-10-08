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
const crypto = require("crypto");

const ROOT = __dirname;
const ORIGIN = "https://storeway.co.kr";   /* ⚠️ 공식 주소 한 곳 — 2026-10-04 전환 */

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
                /* ⚠️ lifecycle 은 catalog 의 key 를 그대로 쓰므로 **그 뒤**입니다 */
                "js/data/lifecycle.js",
                /* ⚠️ journey 는 lifecycle 의 단계 key 와 catalog 의 분류 key 를
                   그대로 쓰므로 **그 뒤**입니다 (2026-10-05 V2 §1) */
                "js/data/journey.js",
                "js/data/franchise.js","js/data/providers.js","js/data/market.js",
                "js/data/support.js","js/data/content.js",
                /* ⚠️ sample 은 providers 의 계산 함수를 쓰므로 **그 뒤**입니다.
                   AM_PROVIDERS 에는 **안 들어갑니다** (§19) */
                "js/data/sample.js","js/data/photos.js",
                "js/data/legal-terms.js","js/data/legal-privacy.js",
                "js/data/faq.js","js/data/tools.js","js/data/join.js",
                /* ⚠️ sales 는 catalog 의 분류 · 하위 key 를 **묶어 보는 틀**이라
                   그 뒤입니다. 손님 화면은 안 읽습니다 — /admin 전용이지만
                   분류 25 를 빠짐없이 나눠 가지는지 빌드가 봅니다 */
                "js/data/sales.js"];

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
  /* ⚠️⚠️ **`/home` 이 여기 없는 것은 실수가 아닙니다** (2026-10-01).
     랜딩을 없애면서 그 화면이 `/` 가 됐습니다. 옛 주소는
     `vercel.json` 의 redirects 가 308 로 `/` 에 보냅니다 — 여기에
     다시 넣으면 **같은 내용이 두 주소로 나가고 구글이 둘 다 무시**합니다. */
  const fixed = ["/", "/startup", "/operation", "/transfer", "/closure",
                 "/providers", "/franchise",
                 "/stores", "/assets", "/support", "/content",
                 "/quote", "/sell", "/join", "/my", "/search", "/compare",
                 /* ⚠️ `/sample` 은 NOINDEX 라 sitemap 에 안 들어갑니다 —
                    HTML 은 만들어야 주소를 열 수 있어서 여기에 둡니다 */
                 "/sample",
                 "/tools",
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
  /* 사업 단계 여섯 — 2026-10-04 구조 개편. ⚠️ 새 분류가 아니라
     `catalog.js` 의 분류를 묶어 보는 화면이라, 분류 주소는 그대로
     따로 만들어집니다 (여기는 묶음이고 거기는 낱개입니다). */
  const stgs  = (W.AM_STAGES || []).map(s2 => "/g/" + s2.key);
  /* ⚠️ 도구 주소는 `AM_TOOLS` 에서 가져옵니다 — 손으로 적어 두면
     도구를 늘릴 때마다 여기를 잊어 **주소가 조용히 안 만들어집니다.** */
  const tls = (W.AM_TOOLS || []).map(t => t.to);
  /* 업체 · 브랜드 · 글은 **등록된 것만** 주소가 됩니다. 지금 0 건이라
     0 개가 만들어집니다 — 없는 것을 만들지 않습니다. */
  const pvs = (W.AM_PROVIDERS || []).map(p => "/p/" + p.id);
  const frs = (W.AM_FRANCHISES || []).map(f => "/f/" + f.slug);
  const cts = (W.AM_CONTENTS  || []).map(c => "/content/" + c.slug);
  /* 매물도 등록된 것만 주소가 됩니다 — 지금 0건이라 0개가 만들어집니다 */
  const sts = (W.AM_STORES || []).map(x => "/s/" + x.id);
  const ass = (W.AM_ASSETS || []).map(x => "/a/" + x.id);
  return fixed.concat(tls, flows, stgs, pcats, icats, fcats, pvs, frs, cts, sts, ass);
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
      /* ⚠️ alternateName 은 영문 브랜드(STOREWAY)입니다 — 검색엔진에게
         "인수인계와 STOREWAY 는 같은 곳" 이라고 알려 주는 표준 칸입니다.
         화면에서 이름처럼 쓰지는 않습니다 (지시서 §3). */
      name:B.name, alternateName:B.en, url:ORIGIN, inLanguage:"ko", description:B.desc,
      potentialAction:{ "@type":"SearchAction",
        target:{ "@type":"EntryPoint", urlTemplate: ORIGIN+"/search?q={q}" },
        "query-input":"required name=q" }
    });
    out.push({
      "@context":"https://schema.org","@type":"Organization",
      name:B.name, alternateName:B.en, url:ORIGIN,
      logo:ORIGIN+"/icon-512.png", description:B.desc
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
  /* 상세 네 갈래의 빵부스러기 — 검색 결과에 "매장 인수 › 안양 평촌
     18평 카페 양도" 로 나옵니다. 네 화면 다 없었습니다.

     ⚠️⚠️ **`Product` · `Offer` 를 붙이지 마세요.** 값이 붙으면 "우리가
     파는 물건" 이 되는데 저희는 거래 당사자가 아닌 중개자입니다
     (전자상거래법 제20조 제1항). 게다가 그 금액은 올리신 사장님이
     적으신 값이라 저희가 보증할 수 없습니다 — 구조화 데이터로 내보내는
     순간 보증하는 셈입니다.
     ⚠️⚠️ **`aggregateRating` 을 붙이지 마세요.** 없는 별을 구글에까지
     내보내는 것이고, 적발되면 리치 결과가 통째로 막힙니다. */
  const mdp = /^\/p\/([a-zA-Z0-9-]+)$/.exec(route);
  if(mdp){
    const x = (W.AM_PROVIDERS||[]).filter(v => v.id === mdp[1])[0];
    if(x) out.push(crumb([["업체찾기","/providers"], [x.name, route]]));
    return out;
  }
  const mdf = /^\/f\/([a-zA-Z0-9-]+)$/.exec(route);
  if(mdf){
    const x = (W.AM_FRANCHISES||[]).filter(v => v.slug === mdf[1])[0];
    if(x) out.push(crumb([["프랜차이즈","/franchise"], [x.name, route]]));
    return out;
  }
  const mds = /^\/s\/([a-zA-Z0-9-]+)$/.exec(route);
  if(mds){
    const x = (W.AM_STORES||[]).filter(v => v.id === mds[1])[0];
    if(x) out.push(crumb([["매장 인수","/stores"], [x.title, route]]));
    return out;
  }
  const mda = /^\/a\/([a-zA-Z0-9-]+)$/.exec(route);
  if(mda){
    const x = (W.AM_ASSETS||[]).filter(v => v.id === mda[1])[0];
    if(x) out.push(crumb([["시설 · 집기","/assets"], [x.title, route]]));
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


/* 머리말 여섯 — ⚠️⚠️ **`shell()` 안에만 두지 마세요.** 메인(`/`)은
   `index.html` **자체**라 `shell()` 을 안 거칩니다. 그래서 브랜드 이름을
   바꿨을 때 하위 141개는 새 이름으로 나가는데 **제일 많이 공유되는
   메인만 옛 이름**으로 남았습니다 (제목 · og:title · og:site_name ·
   og:image:alt 넷). 화면으로는 표가 안 나고 **공유해 봐야** 압니다 —
   같은 자리에서 두 번째 사고입니다. 두 곳이 이 함수 하나를 부릅니다. */
function metaTags(h, r, route){
  const B = (globalThis.__W && globalThis.__W.AM_BRAND) || {};
  const site = (B.name || "") + " · " + (B.sub || "");
  /* ⚠️ 제목 규칙은 js/data/brand.js 의 amTitle() 한 곳입니다 —
     app.js 의 paintMeta() 도 같은 것을 부릅니다. 한쪽에만 적으면
     메인만 제목이 달라집니다 (실제로 그랬습니다). */
  const title = globalThis.__W.amTitle(r.title || "", r.canon || route);
  const canon = ORIGIN + (r.canon || route);
  h = h.replace(/<title>[\s\S]*?<\/title>/, "<title>"+esc(title)+"</title>");
  h = h.replace(/<meta name="description"[^>]*>/,
        '<meta name="description" content="'+esc(r.desc||"")+'">');
  h = h.replace(/<meta property="og:title"[^>]*>/,
        '<meta property="og:title" content="'+esc(title)+'">');
  h = h.replace(/<meta property="og:description"[^>]*>/,
        '<meta property="og:description" content="'+esc(r.desc||"")+'">');
  h = h.replace(/<meta property="og:url"[^>]*>/,
        '<meta property="og:url" content="'+esc(canon)+'">');
  h = h.replace(/<meta property="og:site_name"[^>]*>/,
        '<meta property="og:site_name" content="'+esc(B.name||"")+'">');
  h = h.replace(/<meta property="og:image:alt"[^>]*>/,
        '<meta property="og:image:alt" content="'+esc(site)+'">');
  /* ⚠️⚠️ **트위터 태그도 같이 갈아 끼웁니다** (2026-10-06 §11).
     `twitter:card` 만 있고 제목 · 설명 · 그림이 없으면 플랫폼이
     `og:*` 로 **돌아가 주기는 하지만**, 그건 플랫폼이 정하는 것이지
     우리가 정한 것이 아닙니다 — 이름이 바뀌었을 때 어디가 옛 이름으로
     나가는지 알 수 없어집니다. 명시해 둡니다. */
  const tw = [["twitter:title", title], ["twitter:description", r.desc||""],
              ["twitter:image", ORIGIN + "/og.jpg"]];
  for(const [k, v] of tw){
    const re = new RegExp('<meta name="' + k + '"[^>]*>');
    const tag = '<meta name="' + k + '" content="' + esc(v) + '">';
    h = re.test(h) ? h.replace(re, tag)
                   : h.replace('<meta name="twitter:card"',
                               tag + '\n<meta name="twitter:card"');
  }
  return h;
}

function shell(tpl, r, route, noscript, ld){
  let h = metaTags(tpl, r, route);
  const canon = ORIGIN + (r.canon || route);
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
  /* 내용이 바뀌면 주소가 바뀌도록 — 안 붙이면 손님은 옛 CSS 를 계속 씁니다 */
  h = stampAssets(h);
  checkStamped(h, route);
  checkColorScheme(h, route);
  checkDefer(h, route);
  checkAlive(h, route, WANT_SCRIPTS);
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

  /* ── 메인 (/) ────────────────────────────────────────────────
     > **2026-10-01 — 랜딩을 없앴습니다.** 전에는 여기에 랜딩용 본문이
     > 있었고, 그 안에 **"지금 상태"** 네 줄(입점 파트너 모집중 ·
     > 브랜드 등록 준비중 · 매물 등록 시작 · 접수 준비중)이 들어
     > 있었습니다. 화면에는 안 보이는데 **크롤러 본문에는 거의 맨 위**라,
     > 자바스크립트가 돌기 전에 들어온 분과 검색엔진에게 "아직 준비
     > 중인 플랫폼" 으로 읽혔습니다. 지시서 §12 로 **뺐습니다.**
     >
     > ⚠️ 0 을 숨긴 것이 아닙니다 — 업체 · 브랜드 · 매물이 0 이라는
     > 말은 아래 각 구간에 그대로 있고, 거기가 **화면과 같은 자리**입니다.

     ⚠️ **화면과 같은 말이어야 합니다.** 크롤러가 읽는 것과 손님이
     보는 것이 다르면 그게 구글에 나가는 거짓말입니다. 아래는
     `js/pages/home.js` 의 `PageMain()` 구간 차례(2026-10-06 마무리
     지시서 §1 의 **열넷**)를 그대로 따라갑니다.
     ⚠️ 숫자는 전부 **세는 값**입니다. 손으로 적을 자리가 없습니다.

     ⚠️⚠️ **화면에 없는 구간을 여기 적지 마세요.** 전에 `MainPrice`
     ("다른 사장님들은 얼마에 하셨을까?")와 `MainReviews`("실제
     사장님들의 경험") 두 토막이 **화면에는 없는데 크롤러 본문에만**
     남아 있었습니다. 2026-10-06 에 차례가 열넷으로 바뀌면서 메인에서
     내려온 구간 일곱(큰 카드 셋 · 프랜차이즈 · 창업 분야 · 운영 ·
     폐업 가이드 · 폐업 분야 · 범위 숫자)도 같은 자리입니다 — 범위
     숫자와 가치 넷 · 왜 셋은 **브랜드 스토리(13)로 옮겼고**, 분야 두
     목록은 **맞춤 로드맵(04)** 이 그 격자를 내는 자리라 거기 있습니다.
     프랜차이즈 토막은 화면에서 내려왔으니 여기서도 뺐습니다. */
  if(route === "/"){
    const nPv = (W.AM_PROVIDERS||[]).length;
    const nSt = (W.AM_STORES||[]).length;
    const nAs = (W.AM_ASSETS||[]).length;
    const byCat = {}; (W.AM_CATS||[]).forEach(c => { byCat[c.key] = c; });
    const nSub = (W.AM_CATS||[]).reduce((n,c) => n + ((c.items||[]).length), 0);

    /* ── 01 HERO ──────────────────────────────────────────────── */
    p("사장님의 시작과 마지막을 연결합니다. 창업을 준비하는 순간부터, " +
      "사업을 정리하고 다음 사장님에게 넘기는 순간까지 " +
      W.koWith(B.name, "이가") + " 함께합니다.");
    p("창업 — 업종에 맞는 준비 순서부터 필요한 업체와 정보까지 한 번에 " +
      "찾아보세요. 폐업 · 정리 — 넘길 수 있는 것부터, 폐업 절차와 " +
      "철거 · 원상복구까지 필요한 순서대로 안내합니다.");

    /* ── 02 브랜드 연결 ───────────────────────────────────────── */
    h2("한 사장님의 끝이 다른 사장님의 시작이 됩니다");
    p(W.koWith(B.name, "은는") + " 정리하는 사장님과 시작하는 사장님을 " +
      "이어 사장님의 다음을 함께하는 플랫폼입니다. 버리는 것은 줄이고, " +
      "다음 사장님의 시작으로.");
    ul(["transfer","asset","stock","labor","contract"]
       .map(k => byCat[k]).filter(Boolean)
       .map(c => "정리하는 사장님 — " + c.name));
    ul(["매장 인수 — 상권을 처음부터 다시 찾지 않아도 됩니다",
        "기존 시설 활용 — 쓸 수 있는 것은 새로 사지 않아도 됩니다",
        "중고 장비 구매 — 같은 장비를 새것 값에 사지 않아도 됩니다",
        "초기비용 절감 — 신규와 인수를 나란히 놓고 따져 보세요",
        "빠른 창업 준비 — 공사 기간이 줄어 문을 빨리 엽니다"]);

    /* ── 03 핵심 서비스 여덟 ──────────────────────────────────────
       ⚠️⚠️ **"검증된 업체" 라고 쓰지 마세요.** 검증 기능이 없습니다 —
       시안 그림에 그 글자가 있지만 적는 순간 표시 · 광고의 공정화에
       관한 법률 제3조입니다 (화면에도 안 적혀 있습니다).
       ⚠️ 여덟은 화면과 **같은 차례 · 같은 분류**입니다. */
    h2("사장님에게 필요한 모든 서비스를 한 곳에서");
    p("창업, 운영, 인수 · 양도, 폐업까지. 필요한 서비스와 정보를 " +
      B.name + "에서 확인하세요. 지금 다루는 세부 서비스는 " + nSub + "개입니다.");
    ul(["store","interior","equip","it","admin","marketing","demolish","clean"]
       .map(k => byCat[k]).filter(Boolean)
       .map(c => c.name + " — " + (c.lead || subNames(c).slice(0,4).join(" · "))));

    /* ── 04 계산도구 + 최신 정보 ────────────────────────────────
       ⚠️ 글의 **작성일 · 글쓴이를 적지 마세요** — 그런 칸이 없습니다
       (시안의 날짜와 전문가 이름은 디자인 예시입니다). */
    const byT = {}; (W.AM_TOOLS||[]).forEach(t => { byT[t.key] = t; });
    const calc = ["cost","premium","rent","closecost"].map(k => byT[k]).filter(Boolean);
    if(calc.length){
      h2("사장님을 위한 계산도구");
      p("창업과 폐업에 필요한 다양한 비용을 간편하게 계산해보세요. " +
        "적으신 숫자는 이 브라우저에만 남고 서버로 보내지 않습니다.");
      ul(calc.map(t => t.name + " — " + t.lead));
    }
    const reads = (W.AM_CONTENTS||[]);
    if(reads.length){
      h2("사장님을 위한 최신 정보");
      p("창업, 운영, 폐업에 꼭 필요한 정보와 가이드를 확인해보세요. 지금 " +
        reads.length + "편이고 근거를 댈 수 있는 것만 적습니다.");
      ul(reads.slice(0,3).map(c =>
        c.title + " — " + ((byCat[c.cat]||{}).name || "")));
    }

    /* ── 05 매장 · 시설 · 장비 ──────────────────────────────────
       ⚠️⚠️ **매물이 0건이면 머리말까지 화면과 같이 바뀝니다** — 시안의
       "지금 이런 매장이 기다리고 있어요" 를 0건에 걸면 그게 거짓입니다. */
    if(nSt){
      h2("지금 이런 매장이 새로운 사장님을 기다리고 있어요");
    } else {
      h2("사업의 자산도 다음 사장님에게 이어질 수 있습니다.");
    }
    p("정리하는 사장님의 매장과 시설, 장비가 새로운 사장님의 시작이 " +
      "될 수 있습니다.");
    if(nSt + nAs){
      p("매장 " + nSt + "건 · 시설 " + nAs + "건이 올라와 있습니다.");
    } else {
      p("매장을 인수하기 전 확인해야 할 정보부터 살펴보세요.");
      ul(((W.AM_PROCESS||{})["acq-in"]||[]).slice(0,5)
         .map(st => st.name + " — " + st.lead));
      p("인수 가능한 매장 정보를 준비하고 있습니다.");
    }

    /* ── 06 파트너 입점 ────────────────────────────────────────
       ⚠️⚠️ **"월 n건의 요청" 을 적지 마세요** — 지금 0 입니다. 혜택은
       `AM_JOIN_WHY`(약관에 근거가 있는 약속)와 같은 말이라야 합니다. */
    h2(B.name + " 파트너가 되어주세요.");
    p("창업과 폐업을 준비하는 사장님들에게 전문 서비스를 소개할 파트너 " +
      "업체를 모집합니다. 기본 입점은 무료이고, 광고비로 검색 순서를 " +
      "바꾸지 않습니다. 조건이 맞는 요청만 보냅니다.");
    ul((W.AM_CATS||[]).filter(c => c.kind === "provider").map(c => c.name));
    if(!nPv) p("지금 등록된 업체는 0곳입니다. 첫 번째 파트너가 되실 수 있습니다.");

    /* ── 07 마지막 CTA ─────────────────────────────────────────── */
    h2("어디서부터 시작해야 할지 모르겠다면?");
    p("지금 상황을 선택하면 필요한 순서부터 안내해 드립니다. 창업 " +
      "준비하기 · 폐업 · 정리 준비하기 · 업체 찾기 · 체크리스트 · " +
      "계산도구. 가입이 필요 없습니다. 업체 회신 시점은 업체가 정합니다 — " +
      "저희가 보장하지 않습니다.");
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
      /* 2026-10-05 V2 §16 로 더한 일곱 — ⚠️ 목록을 손으로 또 적지
         않습니다. 데이터 배열 이름만 도구 key 에 맞춰 둡니다. */
      const MORE = { target:"AM_TARGET", premium:"AM_PREMIUM", rent:"AM_RENT",
                     hire:"AM_HIRE", delivery:"AM_DELIVERY", margin:"AM_MARGIN" };
      if(MORE[t.key]){
        h2("적는 항목");
        ul((W[MORE[t.key]]||[]).map(r =>
          r.name + (r.unit ? " (" + r.unit + ")" : "") + (r.hint ? " — " + r.hint : "")));
      }
      if(t.key === "closecost"){
        h2("나가는 돈");
        ul((W.AM_CLOSE_OUT||[]).map(r => r.name + (r.hint ? " — " + r.hint : "")));
        h2("돌아오는 돈");
        ul((W.AM_CLOSE_IN||[]).map(r => r.name + (r.hint ? " — " + r.hint : "")));
        p("나가는 돈만 세면 반쪽입니다. 보증금과 시설 매각은 돌아오는 쪽이라, " +
          "둘을 같이 놓아야 실제로 얼마가 드는지가 나옵니다.");
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

  /* 사업 단계 — /g/build (2026-10-04 구조 개편)
     ⚠️ 화면과 **같은 것**을 냅니다 — 그 단계의 분류와 하위 서비스.
     크롤러에게만 더 보여 주면 화면과 다른 것을 내보내는 셈입니다. */
  if(/^\/g\//.test(route)){
    const st = r.stage;
    if(st){
      const cs = (W.amStageCats ? W.amStageCats(st) : []);
      h2(st.name + " 단계에 필요한 분야");
      cs.forEach(c => {
        L.push("<h3>"+esc(c.name)+"</h3>"); p(c.desc);
        ul((W.amCatItems ? W.amCatItems(c, "") : (c.items||[])).map(i => i.name));
      });
      (st.extra || []).forEach(x => { L.push("<h3>"+esc(x.name)+"</h3>"); p(x.lead); });
      const L2 = (W.AM_STAGES || []);
      h2("사업 단계 여섯");
      ul(L2.map(x => x.no + " " + x.name + " — " + x.lead + " " + x.sub));
    }
    return L.join("");
  }

  /* 여정 넷 — 운영 · 인수/양도 (2026-10-05 V2 §6 · §7)
     ⚠️ **화면과 같은 것**을 냅니다. 크롤러에게만 더 보여 주면 화면과
     다른 것을 내보내는 셈입니다. */
  if(route === "/operation"){
    h2("운영하면서 막히는 자리");
    ul((W.AM_OPS||[]).map(o => o.name));
    h2("업종마다 쓰는 것이 다릅니다");
    ul((W.AM_INDUSTRIES||[]).map(i => i.name + " — " + i.lead));
    h2("운영에 필요한 분야");
    const opc = {};
    (W.AM_OPS||[]).forEach(o => { if(o.cat) opc[o.cat] = 1; });
    (W.AM_CATS||[]).filter(c => opc[c.key]).forEach(c => {
      L.push("<h3>"+esc(c.name)+"</h3>"); p(c.desc); ul(subNames(c));
    });
    return L.join("");
  }
  if(route === "/transfer"){
    const nSt2 = (W.AM_STORES||[]).length, nAs2 = (W.AM_ASSETS||[]).length;
    h2("받을 때는 이 순서입니다");
    ul((W.AM_PROCESS||{})["acq-in"].map((x,i) => (i+1) + ". " + x.name + " — " + x.lead));
    h2("넘길 때는 이 순서입니다");
    ul((W.AM_PROCESS||{})["acq-out"].map((x,i) => (i+1) + ". " + x.name + " — " + x.lead));
    h2("지금 올라온 것");
    /* ⚠️ 0 이면 0 이라고 적습니다 (절대 규칙 1) */
    p("매장 매물 " + nSt2 + "건 · 시설 · 장비 " + nAs2 + "건. " +
      (nSt2 || nAs2 ? "등록된 차례로 냅니다. 광고로 위에 올린 자리는 없습니다."
                    : "아직 올라온 매물이 없습니다. 없는 매물을 지어내지 않습니다."));
    p("매물에 적힌 평수 · 보증금 · 월세 · 권리금 · 매출은 올리신 사장님이 " +
      "적으신 값이고, 저희가 확인하거나 보증하는 값이 아닙니다.");
    return L.join("");
  }

  if(route === "/startup" || route === "/closure"){
    const start = route === "/startup";
    /* 준비 과정 — 2026-10-05 V2 §4(창업 12걸음) · §8(폐업 13걸음) */
    const pr = (W.AM_PROCESS||{})[start ? "startup" : "closing"] || [];
    if(pr.length){
      h2(start ? "창업 준비, 무엇부터 하나요?" : "폐업, 무엇부터 하나요?");
      ul(pr.map((x,i) => (i+1) + ". " + x.name + " — " + x.lead));
    }
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
  /* ⚠️ 화면(PageSell)과 **같은 말**이어야 합니다. 여기에만 더 적으면
     그게 구글에 나가는 거짓말입니다 — 특히 "바로 올라갑니다" 처럼
     하지 않는 일을 적지 마세요 (절대 규칙 5). */
  if(route === "/sell"){
    h2("매장 · 점포를 내놓으실 때 적는 것");
    ul(["거래 방식 — 매장 양도 · 임대", "업종", "지역 (시 · 군 · 구까지)",
        "평수", "보증금", "월세", "권리금 (무권리면 0)", "시설 인수비",
        "시설을 그대로 두고 가시는지", "문 연 해", "넘기고 싶은 시점",
        "월 매출 (적어 주시면 사장님이 적으신 값이라고 밝혀서 올립니다)"]);
    h2("시설 · 장비를 내놓으실 때 적는 것");
    ul(["무엇을 내놓으시는지", "거래 단위 — 낱개 · 묶음 · 시설 전체",
        "업종", "지역 (시 · 군 · 구까지)", "제조사", "연식", "수량",
        "희망가", "상태"]);
    h2("올리기 전에 한 번 연락드립니다");
    p("적어 주신 내용은 바로 올라가지 않습니다. 저희가 보고 빠진 것을 여쭌 "+
      "다음에 올립니다. 연락처 · 상호 · 번지 주소는 매물에 나가지 않습니다 — "+
      "지역은 시 · 군 · 구까지만 올리고, 보시려는 분께 연락처를 전하는 것은 "+
      "사장님이 그때 다시 동의하셔야 합니다 (개인정보보호법 제17조).");
    p("저희는 통신판매중개자이고 거래 당사자가 아닙니다. 적어 주신 값을 "+
      "확인하거나 보증하지 않습니다 — 계약은 두 사장님이 직접 하십니다.");
    return L.join("");
  }
  if(route === "/support"){
    h2("자금 · 정부지원");
    ul(["창업자금","정책자금","정부지원사업","보증제도",
        "폐업지원","철거비 지원","재취업","재창업"]);
    p("공고 원문을 확인한 것만 올립니다. 지원사업은 해마다 바뀌고 예산이 "+
      "소진되면 중간에 닫힙니다.");
    /* ⚠️ 화면(SupportWhere)과 **같은 말**이어야 합니다. 공고를
       지어내지 않는 대신 어디를 봐야 하는지는 냅니다 — 개별 사업
       이름은 여기에도 적지 마세요. 해마다 바뀝니다. */
    h2("공고는 여기에 올라옵니다");
    ul((W.AM_SUPPORT_WHERE||[]).map(x => x.org + " — " + x.what));
    p("여기 적힌 것은 기관까지입니다. 개별 공고가 아닙니다 — 대상 · 금액 · "+
      "기한은 그 기관의 공고에서 직접 확인하셔야 하고, 신청과 심사도 "+
      "그쪽에서 합니다.");
    return L.join("");
  }
  if(route === "/join"){
    /* ⚠️ 화면(PageJoin)과 **같은 말**이어야 합니다. 글은
       js/data/join.js 한 곳에 있습니다.
       ⚠️ 여기에만 성과를 적지 마세요 — "월 n건" · "n곳이 함께합니다"
       는 지금 0 이고, 크롤러에게만 적으면 그게 구글에 나가는
       거짓말입니다. */
    const nPv = (W.AM_PROVIDERS||[]).length;
    h2("지금 상태");
    p(nPv
      ? "지금 " + nPv + "곳이 등록돼 있습니다."
      : "아직 아무도 등록하지 않았습니다. 부풀려 말씀드리지 않겠습니다 — " +
        "지금 등록된 업체는 0곳이고, 그래서 지금 들어오시면 그 분야의 첫 번째입니다.");

    h2("요청은 이런 칸으로 옵니다");
    ul((W.AM_JOIN_FIELDS||[]).map(f => f[0] + " — " + f[1]));
    p("성함과 연락처는 여기 들어 있지 않습니다. 업체가 정해지면 사장님께 " +
      "어느 업체인지 알려 드리고, 그때 다시 동의를 받은 뒤에 전달합니다 " +
      "(개인정보보호법 제17조).");

    h2("업체에 이렇게 하겠습니다");
    ul((W.AM_JOIN_WHY||[]).map(x => x.t + " — " + x.d));

    h2("어떻게 진행되나");
    ul((W.AM_JOIN_STEPS||[]).map(x => x.t + " — " + x.d));

    h2("입점 분야");
    (W.AM_CATS||[]).filter(c => c.kind === "provider").forEach(c => {
      L.push("<h3>"+esc(c.name)+"</h3>"); ul(subNames(c));
    });

    const jf = (W.AM_JOIN_FAQ || []);
    if(jf.length){
      h2("업체가 자주 묻는 것");
      jf.forEach(x => { L.push("<h3>"+esc(x.q)+"</h3>"); p(x.a); });
    }
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
  /* ⚠️⚠️ **업체 · 브랜드 상세에는 크롤러 본문이 없었습니다.** 23자짜리
     로 나가고 있었고, 설명(description)도 소개 한 줄이라 너무 짧았습니다.
     데이터가 0이라 그 주소 자체가 안 만들어져서 몇 달째 아무도 못 봤고,
     **첫 업체를 등록하는 날** 그 화면이 그대로 구글에 갔을 것입니다 —
     정작 "안양 카페 인테리어 업체" 로 잡혀야 할 화면입니다.

     ⚠️ 여기 적는 것은 **전부 등록된 값**입니다. 업체 수 · 실적 · 평점을
     지어내지 않습니다 (절대 규칙 1). 후기가 없으면 그 줄이 아예 빠집니다. */
  const mpv = /^\/p\/([a-z0-9-]+)$/.exec(route);
  if(mpv){
    const pv = (W.AM_PROVIDERS||[]).filter(x => x.id === mpv[1])[0];
    if(pv){
      const regs = (pv.regions||[]).map(k => W.amRegionName ? W.amRegionName(k) : k);
      const gus  = pv.gu || [];
      const inds = (pv.industries||[]).map(k => W.amIndustryName ? W.amIndustryName(k) : k);
      const subs = (pv.subs||[]).map(k => W.amSubName ? W.amSubName(k) : k);
      h2("하는 일");
      ul(subs);
      if(regs.length || gus.length){
        h2("일하는 지역");
        ul(regs.concat(gus));
      }
      if(inds.length){ h2("전문 업종"); ul(inds); }
      /* ⚠️⚠️ **평균을 말하지 않고 후기 그 자체를 냅니다.** 처음에 "평균
         만족도 4.5점" 이라고 적었다가 전수 점검에 걸렸습니다 — 계산된
         값이긴 하지만 "만족도" 는 지어낸 신뢰의 전형적인 말이고,
         CLAUDE.md 도 "만족도를 붙이지 마세요" 라고 적어 두었습니다.
         **검사가 맞았습니다.**

         그리고 검색에 쓸모 있는 것도 평균이 아니라 **사장님이 쓰신 글**
         입니다. 이름은 화면과 똑같이 `amMaskName()` 으로 가립니다. */
      const rv = (pv.reviews||[]).filter(function(x){ return x.text; });
      if(rv.length){
        h2("후기");
        ul(rv.slice(0, 5).map(function(x){
          const who = x.by && W.amMaskName ? W.amMaskName(x.by) + " 사장님" : "사장님";
          const what = [x.industry && W.amIndustryName ? W.amIndustryName(x.industry) : "",
                        x.sub && W.amSubName ? W.amSubName(x.sub) : ""].filter(Boolean).join(" · ");
          return who + (what ? " · " + what : "") + " — " + x.text;
        }));
        p("플랫폼을 통해 상담 · 계약하신 분이 쓰신 것만 올립니다. "
          + "저희가 대신 적지 않습니다.");
      }
      const bd = W.amProviderBadges ? W.amProviderBadges(pv) : [];
      if(bd.length){ h2("확인한 것"); ul(bd); }
      if(pv.since) p(pv.since + "년부터 일하고 있습니다.");
      p("연락처를 바로 드리지 않습니다. 필요한 내용을 적어 주시면 그대로 "
        + "전달하고, 업체 연락처는 사장님이 동의하신 뒤에만 오갑니다. "
        + "견적은 무료이고, 저희는 거래 당사자가 아닌 통신판매중개자입니다.");
    }
    return L.join("");
  }
  const mfr = /^\/f\/([a-z0-9-]+)$/.exec(route);
  if(mfr){
    const fr = (W.AM_FRANCHISES||[]).filter(x => x.slug === mfr[1])[0];
    if(fr){
      const fc = (W.AM_FRANCHISE_CATS||[]).filter(c => c.key === fr.cat)[0];
      if(fc) p(fc.name + " 프랜차이즈입니다.");
      ul(fr.features || []);
      /* ⚠️ 금액은 **출처와 기준일이 있는 것만** 냅니다 (가맹사업법).
         화면이 숨기는 값을 크롤러에게만 주면 그게 더 나쁩니다. */
      const c = W.amFranchiseCost ? W.amFranchiseCost(fr) : null;
      if(c){
        h2("창업비");
        const rows = [["total","총 예상 창업비"],["join","가맹비"],["edu","교육비"],
                      ["deposit","보증금"],["interior","인테리어"],["equip","장비"],["etc","기타"]];
        ul(rows.filter(x => c[x[0]]).map(x => x[1] + " " + c[x[0]] + (c.unit||"만원")));
        if(c.pyeong) p("권장 평수는 " + c.pyeong + "평입니다.");
        p("출처 " + c.source + " · 기준일 " + c.asOf
          + ". 점포 비용과 지역에 따라 달라집니다. 실제 금액은 정보공개서와 본사 상담으로 확인하세요.");
      } else {
        p("본사가 금액을 등록하지 않았습니다. 상담으로 확인하세요.");
      }
      if((fr.support||[]).length){ h2("본사 지원"); ul(fr.support); }
      if((fr.regions||[]).length){
        h2("모집 지역");
        ul(fr.regions.map(k => W.amRegionName ? W.amRegionName(k) : k));
      }
      if(fr.disclosure && fr.disclosure.has && fr.disclosure.no)
        p("정보공개서 등록번호 " + fr.disclosure.no
          + (fr.disclosure.at ? " · 등록일 " + fr.disclosure.at : "") + ".");
      p("저희는 가맹본부가 아니라 통신판매중개자입니다. 계약은 본사와 직접 하십니다.");
    }
    return L.join("");
  }

  /* 매물 상세 — ⚠️⚠️ **매출은 크롤러 본문에도 넣지 않습니다.** 확인할
     방법이 없는 숫자이고, 검색 결과는 우리 손을 떠나 한참 돌아다닙니다.
     ⚠️ 연락처 · 상호 · 번지 주소는 스키마에 없고, 여기에도 없습니다 —
     매물 하나가 곧 올리신 사장님의 개인정보가 되면 안 됩니다. */
  const mst = /^\/s\/([a-zA-Z0-9-]+)$/.exec(route);
  if(mst){
    const st = (W.AM_STORES||[]).filter(x => x.id === mst[1])[0];
    if(st){
      const where = W.amRegionName ? W.amRegionName(st.region, st.gu) : st.region;
      const ind   = W.amIndustryName ? W.amIndustryName(st.industry) : st.industry;
      p([where, ind].filter(Boolean).join(" ") + " 매장입니다"
        + (st.kind === "lease" ? " (임대)" : st.kind === "transfer" ? " (양도)" : "") + ".");
      h2("조건");
      ul([
        st.pyeong    != null ? "면적 " + st.pyeong + "평" : "",
        st.deposit   != null ? "보증금 " + st.deposit + "만원" : "",
        st.rent      != null ? "월세 " + st.rent + "만원" : "",
        st.premium   != null ? "권리금 " + st.premium + "만원" : "",
        st.equipCost != null ? "시설 인수비 " + st.equipCost + "만원" : "",
        st.since ? "운영 " + st.since + "년부터" : (st.months ? "운영 " + st.months + "개월" : ""),
        st.wantAt ? "넘기고 싶은 시점 " + st.wantAt : "",
        st.withEquip ? "시설을 그대로 인수하실 수 있습니다" : "",
        st.fc ? "프랜차이즈 매장입니다" : ""
      ].filter(Boolean));
      if(st.text){ h2("사장님 설명"); p(st.text); }
      p("적힌 값은 올리신 사장님이 적으신 것이고 저희가 확인하거나 보증하는 "
        + "값이 아닙니다. 계약 전에 등기부 · 임대차계약서 · 관리비 · 원상복구 "
        + "범위를 직접 확인하세요. 저희는 거래 당사자가 아닌 통신판매중개자이고, "
        + "연락처는 두 사장님이 동의하신 뒤에만 오갑니다.");
    }
    return L.join("");
  }
  const mas = /^\/a\/([a-zA-Z0-9-]+)$/.exec(route);
  if(mas){
    const as = (W.AM_ASSETS||[]).filter(x => x.id === mas[1])[0];
    if(as){
      const where = W.amRegionName ? W.amRegionName(as.region, as.gu) : as.region;
      const ind   = W.amIndustryName ? W.amIndustryName(as.industry) : as.industry;
      /* ⚠️ `as.sub` 는 key 입니다 — 이름으로 바꿔서 냅니다 */
      const kind  = W.amEquipName ? W.amEquipName(as.sub) : "";
      p([where, ind, kind].filter(Boolean).join(" ")
        + (as.cat === "stock" ? " 재고입니다." : "입니다."));
      h2("조건");
      const d = (W.AM_DEAL_KINDS||[]).filter(x => x.key === as.deal)[0];
      ul([
        as.price != null ? "가격 " + as.price + "만원" + (as.nego ? " (협의 가능)" : "") : "가격 협의",
        as.brand ? "제조사 " + as.brand : "",
        as.year  ? as.year + "년식" : "",
        as.count ? "수량 " + as.count + "개" : "",
        as.state ? "상태 " + as.state : "",
        d ? d.name : ""
      ].filter(Boolean));
      if(as.text){ h2("사장님 설명"); p(as.text); }
      p("사업을 정리하면서 나온 것입니다. 적힌 값은 올리신 사장님이 적으신 "
        + "것이고 저희가 확인하거나 보증하는 값이 아닙니다. 보시려는 날짜를 "
        + "적으시면 그대로 전달하고, 연락처는 두 사장님이 동의하신 뒤에만 "
        + "오갑니다 — 저희는 거래 당사자가 아닌 통신판매중개자입니다.");
    }
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
    /* ⚠️ 이 화면이 **진행 방법 · 범위 · 자주 묻는 것**을 갖고 있습니다
       (2026-09-30 §23 으로 랜딩에서 옮겨 왔습니다). 화면(PageAbout)과
       같은 개수 · 같은 글이어야 합니다. */
    h2("하는 일");
    ul(["필요한 업체 · 전문가 · 프랜차이즈를 분류와 지역으로 찾아 드립니다.",
        "한 번 적으신 내용을 조건이 맞는 여러 곳에 같이 전달합니다.",
        "정리하시는 사장님의 점포 · 시설 · 집기를 시작하시는 사장님께 이어 드립니다."]);
    h2("하지 않는 일");
    ul(["직접 인테리어 · 철거 · 세무 · 마케팅을 하지 않습니다.",
        "광고비를 받고 업체 순서를 바꾸지 않습니다.",
        "등록된 적 없는 업체 · 브랜드 · 매물을 화면에 만들지 않습니다.",
        "거래 당사자가 아닙니다."]);
    h2("우리가 다루는 범위");
    p("업종 " + (W.AM_INDUSTRIES||[]).length +
      " · 창업 " + (W.AM_START_CATS||[]).length +
      "분야 · 폐업 " + (W.AM_CLOSE_CATS||[]).length +
      "분야 · 세부 서비스 " + (W.AM_CATS||[]).reduce(function(a2,c){
        return a2 + ((c.items||[]).length); }, 0) +
      ". 이 숫자는 다루는 분야의 수이고, 등록된 업체 수나 거래 실적이 아닙니다.");
    h2("어떻게 진행되나");
    ul(["조건을 고릅니다 — 업종 · 지역 · 필요한 서비스. 가입하지 않으셔도 됩니다.",
        "한 번만 적어 보냅니다 — 같은 내용을 업체마다 다시 적지 않으셔도 됩니다.",
        "받으신 제안을 나란히 놓습니다 — 무엇이 포함됐는지가 같아야 비교가 뜻을 가집니다."]);
    /* ⚠️ 화면(FaqBand)이 여섯만 내므로 여기도 여섯입니다. 크롤러에게만
       더 보여 주면 화면과 다른 것을 내보내는 셈입니다. 전체는 /faq 에
       있고 그 주소가 sitemap 에 들어 있습니다. */
    const fq3 = (W.AM_FAQ || []).slice(0, 6);
    if(fq3.length){
      h2("자주 묻는 것");
      fq3.forEach(x => { L.push("<h3>"+esc(x.q)+"</h3>"); p(x.a); });
    }
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

/* ⚠️ 사진 키를 **한 글자 틀리면 조용히 안 나옵니다.** 에러도 안 나고
   화면도 멀쩡합니다 (`hero_start` 처럼). 없는 파일을 적어 두면 배포된
   화면에서 404 가 나는데 그것도 조용합니다. 빌드할 때마다 막습니다.
   ⚠️ 크기 · 비율 · 용량까지는 `node tools/check-photos.js` 가 봅니다 —
   여기서는 파일을 열지 않습니다(빌드가 느려집니다). */
function checkPhotos(W){
  const slots = new Set((W.WOW_PHOTO_SLOTS || []).map(s => s.key));
  const bad = [];
  for(const [k, p] of Object.entries(W.WOW_PHOTOS || {})){
    if(!slots.has(k))
      bad.push('"' + k + '" 는 없는 자리입니다 (js/data/photos.js 의 WOW_PHOTO_SLOTS)');
    if(!p || !p.src){ bad.push('"' + k + '" 에 src 가 없습니다'); continue; }
    if(p.src[0] !== "/")
      bad.push('"' + k + '" 의 경로가 / 로 시작하지 않습니다 — 깊은 주소에서 404 가 납니다');
    else if(!fs.existsSync(path.join(ROOT, p.src.replace(/^\//, ""))))
      bad.push('"' + k + '" — 파일이 없습니다: ' + p.src);
  }
  if(bad.length)
    throw new Error("사진 자리가 어긋났습니다 (그 사진은 **조용히 안 나옵니다**):\n   " +
      bad.join("\n   "));
}

/* ⚠️⚠️ **업체를 등록했는데 아무 데도 안 나오는 것**을 막습니다.
   `subs` 에 적는 것은 **하위 분류**(`catalog.js` 의 `items[].key`)이지
   분류 key 가 아닙니다 — `"interior"` 처럼 **둘 다 있는 이름**이 섞여
   있어서 헷갈리기 딱 좋습니다. 틀리면 에러도 안 나고 화면도 멀쩡하고,
   그 업체만 **조용히 어느 분야에도 안 뜹니다.**

   영업 나가서 받아 온 첫 업체가 그렇게 되면 제일 나쁩니다 — 업체에는
   "올려 드렸습니다" 라고 말해 둔 뒤이기 때문입니다. */
function checkProviders(W){
  const cats = W.AM_CATS || [];
  const subKeys = new Set();
  cats.forEach(c => (c.items || []).forEach(i => subKeys.add(i.key)));
  const catKeys = new Set(cats.map(c => c.key));
  const regions = new Set((W.AM_REGIONS || []).map(r => r.key));
  const inds    = new Set((W.AM_INDUSTRIES || []).map(i => i.key));
  const bad = [];
  (W.AM_PROVIDERS || []).forEach(p => {
    const who = p.id || p.name || "(이름 없는 업체)";
    if(!p.id)   bad.push(who + ": id 가 없습니다 — /p/:id 화면이 안 생깁니다");
    if(!p.name) bad.push(who + ": name 이 없습니다");
    const subs = p.subs || [];
    if(!subs.length)
      bad.push(who + ": subs 가 비었습니다 — 어느 분야 화면에도 안 나옵니다");
    subs.forEach(k => {
      if(subKeys.has(k)) return;
      bad.push(who + ": subs 의 \"" + k + "\" 는 하위 분류가 아닙니다"
        + (catKeys.has(k) ? " (그건 분류 key 입니다 — 그 분류의 items 에서 고르세요)" : ""));
    });
    (p.regions   || []).forEach(k => { if(!regions.has(k)) bad.push(who + ": 없는 지역 " + k); });
    (p.industries|| []).forEach(k => { if(!inds.has(k))    bad.push(who + ": 없는 업종 " + k); });
  });
  const ids = (W.AM_PROVIDERS || []).map(p => p.id).filter(Boolean);
  ids.forEach((id, n) => { if(ids.indexOf(id) !== n) bad.push("id 가 겹칩니다: " + id); });
  if(bad.length)
    throw new Error("업체 등록이 어긋났습니다 (그 업체는 **조용히 안 나옵니다**):\n   "
      + bad.join("\n   "));
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
  for(const r of (vj.redirects||[]))
    for(const k of Object.keys(r))
      if(!["source","destination","permanent","statusCode","has","missing"].includes(k))
        throw new Error("vercel.json redirects 에 알 수 없는 키: "+k);

  /* ⚠️⚠️ **옛 주소가 끊기지 않게 지킵니다** (2026-10-01).
     랜딩을 없애면서 `/home` 이 `/` 가 됐습니다. 그 주소는 헤더 CTA ·
     랜딩 CTA · 푸터가 몇 주 동안 가리키고 있었고 밖으로도 퍼졌습니다.
     이 줄이 없으면 그 링크가 전부 404 입니다 — **화면으로는 표가 안
     나서** 아무도 모릅니다. 그래서 빌드가 멈춥니다.
     ⚠️ JSON 이라 주석을 못 답니다. 여기가 그 주석입니다. */
  const back = (vj.redirects||[]).some(r =>
    r.source === "/home" && r.destination === "/");
  if(!back)
    throw new Error("vercel.json 에 /home → / 리다이렉트가 없습니다 — " +
      "랜딩을 없애면서 /home 이 / 가 됐습니다. 빼면 밖에서 퍼간 링크가 404 입니다.");
}


/* ── 캐시 깨기 — 내용이 바뀌면 주소가 바뀝니다 ──────────────────────
   ⚠️⚠️ **색을 다 바꿔 놓고도 손님 화면이 안 바뀌었습니다.**
   `/css/tokens.css` 라는 이름이 한 번도 안 바뀌어서, 브라우저가 전에
   받아 둔 파일을 계속 썼습니다. 코드도 배포도 멀쩡했고 전수 점검도
   통과했습니다 — 검사는 **로컬 서버**를 보니까요.

   그래서 파일 내용으로 짧은 값을 만들어 주소 뒤에 붙입니다.
   내용이 그대로면 값도 그대로라 **괜히 다시 받지 않고**, 한 글자라도
   바뀌면 주소가 달라져 **반드시 새로 받습니다.**

   ⚠️ 이미 붙어 있는 `?v=` 는 **먼저 떼고** 다시 붙입니다. index.html 은
   빌드가 제자리에서 고치는 파일이라, 안 떼면 두 번 붙습니다.
   ⚠️ 파일을 그냥 열어도(`file://`) 질의만 붙은 것이라 그대로 열립니다. */
const ASSET_V = {};
function assetVer(p){
  if(ASSET_V[p] !== undefined) return ASSET_V[p];
  const f = path.join(ROOT, p.replace(/^\//, ""));
  let v = "";
  try {
    v = crypto.createHash("sha1").update(fs.readFileSync(f)).digest("hex").slice(0, 8);
  } catch(e){
    throw new Error("캐시 값을 만들 파일이 없습니다: " + p + " — 주소를 잘못 적으셨나요?");
  }
  return (ASSET_V[p] = v);
}
function stampAssets(html){
  return html.replace(
    /((?:href|src)=")(\/(?:css|js)\/[^"?]+\.(?:css|js))(?:\?v=[0-9a-f]+)?(")/g,
    function(_, a, p, b){ return a + p + "?v=" + assetVer(p) + b; });
}
/* ⚠️ 붙이고 나서 **빠진 것이 없는지 셉니다.** 새 CSS 나 JS 를 넣고
   여기 정규식에 안 걸리면 그 파일만 조용히 캐시에 묶입니다. */
function checkStamped(html, where){
  const bare = (html.match(/(?:href|src)="\/(?:css|js)\/[^"]+\.(?:css|js)"/g) || []);
  if(bare.length)
    throw new Error(where + " 에 캐시 값이 안 붙은 자산이 있습니다: " + bare.join(" "));
}

/* ⚠️⚠️ **브라우저가 색을 뒤집는 것을 막는 한 줄이 살아 있는지 봅니다.**
   안드로이드 크롬 · 삼성 인터넷의 "자동 다크 모드" 는 `color-scheme` 을
   선언하지 않은 사이트를 **알고리즘으로 반전**시킵니다. 실제로 사장님
   폰에서 바탕이 검정이 되고 **폐업 주황이 빨강**으로 보였습니다 — 그
   빨강은 저희 토큰 어디에도 없는 색이고, CLAUDE.md 가 "폐업이 빨강으로
   흘러가지 않을 것" 이라고 못박아 둔 바로 그 사고입니다.

   ⚠️ **전수 점검(`check.js`)은 이것을 영원히 못 잡습니다.** 데스크톱
   크로미움은 자동 다크 모드가 꺼져 있어서 로컬에서는 늘 멀쩡합니다.
   그래서 빌드가 봅니다 — 화면마다 메타 태그가 있는지, 토큰에 CSS
   선언이 있는지 둘 다입니다 (CSS 가 늦게 와도 메타가 먼저 막습니다). */
/* ⚠️⚠️ **`defer` 가 빠지면 화면이 빈 채로 몇 초 있습니다.** 스크립트
   서른둘이 미리 그려 둔 본문보다 **앞**에 있어서, 동기로 두면 그 서른둘을
   다 받을 때까지 HTML 파싱이 멈춥니다 — 느린 3G 에서 6.3초였고, 보여 줄
   글은 이미 HTML 안에 있었습니다. `async` 는 차례가 섞여서 안 됩니다
   (이 저장소는 스크립트 순서가 곧 의존 순서입니다). */
/* ⚠️⚠️⚠️ **빌드가 죽은 화면 142개를 만들고도 "✅" 라고 했습니다.**
   `index.html` 의 주석에 `<main id="view">` 라는 **글자**를 적었더니,
   크롤러 본문을 끼워 넣는 코드가 그 표시를 문자열로 찾다가 **주석 쪽을
   먼저 맞혀서** 스크립트 서른둘을 통째로 삼켰습니다. 문법도 멀쩡하고
   빌드도 성공이고 화면만 아무것도 안 하는 상태였습니다.

   이 저장소에서 **세 번째** 같은 사고입니다 (`if(route === "/"){` 로
   칸 갈아 끼우다 `shell()` 을 삼킨 것이 둘). 그래서 이제 **결과물을
   세어 봅니다** — 끼워 넣는 코드를 아무리 고쳐도, 스크립트가 사라지면
   여기서 멈춥니다.

   ⚠️ 표시(`<main id="view">` · `crawl:start`)를 **글자로 적지 마세요.**
   꼭 적어야 하면 띄어 쓰거나 다른 말로 풀어 쓰세요. */
function checkAlive(html, where, want){
  const n = (html.match(/<script[^>]+src="\/js\//g) || []).length;
  if(n !== want)
    throw new Error(where + " 에 스크립트가 " + n + "개입니다 (본보기는 " + want + "개) — "
      + "끼워 넣는 코드가 삼켰을 수 있습니다. 화면은 아무것도 안 합니다");
  if(html.indexOf('id="view"') < 0)
    throw new Error(where + " 에 본문 자리가 없습니다");
}

function checkDefer(html, where){
  const bare = (html.match(/<script src="\/js\/[^"]+"><\/script>/g) || []);
  if(bare.length)
    throw new Error(where + " 에 defer 없는 스크립트가 " + bare.length + "개 있습니다 — "
      + "미리 그려 둔 본문이 그만큼 늦게 보입니다: " + bare.slice(0,3).join(" "));
  const async_ = (html.match(/<script[^>]*\basync\b[^>]*src="\/js\//g) || []);
  if(async_.length)
    throw new Error(where + " 에 async 스크립트가 있습니다 — 차례가 섞여서 "
      + "의존 순서가 깨집니다. defer 를 쓰세요");
}

const CS_META = /<meta\s+name="color-scheme"\s+content="only light">/;
function checkColorScheme(html, where){
  if(!CS_META.test(html))
    throw new Error(where + ' 에 color-scheme 메타가 없습니다 — 안드로이드 '
      + '브라우저가 바탕을 검정으로, 폐업 주황을 빨강으로 뒤집습니다');
}
function checkColorSchemeCss(){
  const css = fs.readFileSync(path.join(ROOT, "css/tokens.css"), "utf8");
  if(!/color-scheme:\s*only light/.test(css))
    throw new Error("css/tokens.css 의 :root 에 color-scheme: only light 가 "
      + "없습니다 — 자동 다크 모드가 색을 뒤집습니다");
}

/* ⚠️⚠️ **등록했는데 조용히 안 나오는 것**을 막습니다 — 업체(`checkProviders`)
   와 같은 까닭입니다. 브랜드 · 매물 · 자산 · 공고는 전부 **거르개를
   통과해야만** 화면에 나오는데, 한 칸만 틀려도 에러 없이 빠집니다.
   영업에서 받아 온 것을 올린 날 그러면 제일 나쁩니다. */
/* ── 준비 과정 · 운영 과제가 가리키는 것이 **실제로 있는가**
   (2026-10-05 V2 §4 · §6 · §8) ──────────────────────────────────
   ⚠️⚠️ 걸음에 적은 `cat` · `sub` · `read` · `tool` · `to` 가 하나라도
   없으면 **가짜 링크**입니다 (절대 규칙 5). 화면에서는 그냥 404 로
   열리고 에러도 안 나서, 손님이 눌러 봐야 압니다 — 여기서 멈춥니다. */
/* ⚠️⚠️ 영업 카테고리 열넷이 **분류 스물다섯을 빠짐없이 한 번씩** 나눠
   가지는지 (지시서 §6 — "중복 데이터를 만들지 않는다"). 빠지면 그 분류의
   업체를 직원이 영업 카테고리로 **고를 수가 없고**, 겹치면 카테고리별
   성과가 두 번 세어집니다. 둘 다 에러 없이 조용히 틀립니다.
   ⚠️ 14 기타는 남은 것을 세는 값이라 여기서는 **셈에만** 들어갑니다. */
function checkSales(W){
  const G = W.AM_SALES_GROUPS || [];
  if(!G.length) throw new Error("AM_SALES_GROUPS 가 비었습니다 — js/data/sales.js");

  const cats = {};
  (W.AM_CATS||[]).forEach(c => { cats[c.key] = c; });
  const bad = [], cnt = {};

  G.forEach(g => {
    if(!g.key || !g.name || !g.no) bad.push("묶음에 key · name · no 가 있어야 합니다");
    W.amSalesCats(g).forEach(k => {
      cnt[k] = (cnt[k] || 0) + 1;
      if(!cats[k]) bad.push(g.key + " — 없는 분류 " + k);
    });
    (g.subs||[]).forEach(p => {
      const c = cats[p[0]];
      if(!c) bad.push(g.key + " — 없는 분류 " + p[0]);
      else if(!(c.items||[]).some(i => i.key === p[1]))
        bad.push(g.key + " — " + p[0] + " 에 없는 하위 " + p[1]);
    });
  });

  Object.keys(cats).forEach(k => {
    if(!cnt[k]) bad.push("분류 " + k + " 가 어느 영업 카테고리에도 없습니다");
    else if(cnt[k] > 1) bad.push("분류 " + k + " 가 " + cnt[k] + "곳에 들어 있습니다");
  });

  /* 상태 key 는 **직원 브라우저에 쌓인 기록**이 쓰는 값입니다 */
  const need = ["new","recall","warm","sent","doc","review","done","no","bad"];
  const has = new Set((W.AM_SALES_ST||[]).map(s => s.key));
  need.forEach(k => { if(!has.has(k)) bad.push("AM_SALES_ST 에 " + k + " 가 없습니다"); });
  (W.AM_SALES_RESULT||[]).forEach(r => {
    if(!has.has(r.st)) bad.push("통화 결과 " + r.key + " 가 없는 상태 " + r.st + " 를 가리킵니다");
  });

  if(bad.length)
    throw new Error("영업 카테고리(js/data/sales.js)가 분류와 어긋납니다:\n   · " +
      bad.join("\n   · "));
  console.log("   영업 카테고리 " + G.length + "개가 분류 " +
    Object.keys(cats).length + "개를 빠짐없이 나눠 가집니다");
}

function checkProcess(W){
  const cats = {};
  (W.AM_CATS||[]).forEach(c => { cats[c.key] = c; });
  const slugs = new Set((W.AM_CONTENTS||[]).map(c => c.slug));
  const tools = new Set((W.AM_TOOLS||[]).map(t => t.key));
  const routes = new Set(allRoutes(W));
  const bad = [];
  const chk = (where, o) => {
    if(o.cat && !cats[o.cat]) bad.push(where + " — 없는 분류 " + o.cat);
    if(o.sub && o.cat && cats[o.cat] &&
       !(cats[o.cat].items||[]).some(i => i.key === o.sub))
      bad.push(where + " — " + o.cat + " 에 없는 하위 " + o.sub);
    if(o.read && !slugs.has(o.read)) bad.push(where + " — 없는 글 " + o.read);
    if(o.tool && !tools.has(o.tool)) bad.push(where + " — 없는 도구 " + o.tool);
    [o.to, o.to2].forEach(t => {
      if(t && !routes.has(t)) bad.push(where + " — 없는 주소 " + t); });
  };
  Object.keys(W.AM_PROCESS||{}).forEach(k =>
    (W.AM_PROCESS[k]||[]).forEach((st, i) => chk("AM_PROCESS."+k+"["+i+"] "+st.name, st)));
  (W.AM_OPS||[]).forEach((o, i) => chk("AM_OPS["+i+"] "+o.name, o));
  /* 계산 결과에서 업체로 가는 길 (V2 §17) */
  (W.AM_TOOLS||[]).forEach(t => (t.rel||[]).forEach((o, i) =>
    chk("AM_TOOLS."+t.key+".rel["+i+"]", o)));
  /* ⚠️⚠️ 도구의 묶음 이름이 `AM_TOOL_GROUPS` 에 없으면 그 도구가
     **목록에서 조용히 빠집니다** — 주소는 살아 있어서 아무도 모릅니다. */
  const tg = W.AM_TOOL_GROUPS || [];
  (W.AM_TOOLS||[]).forEach(t => {
    if(!t.grp) bad.push("AM_TOOLS." + t.key + " — 묶음(grp)이 없습니다");
    else if(tg.indexOf(t.grp) < 0)
      bad.push("AM_TOOLS." + t.key + " — AM_TOOL_GROUPS 에 없는 묶음 " + t.grp);
  });
  /* 여정 넷이 단계 여섯을 빠짐없이 한 번씩 나눠 가지는가 */
  const stages = (W.AM_STAGES||[]).map(x => x.key);
  const used = [];
  (W.AM_JOURNEYS||[]).forEach(j => (j.stages||[]).forEach(k => {
    if(stages.indexOf(k) < 0) bad.push("AM_JOURNEYS." + j.key + " — 없는 단계 " + k);
    used.push(k);
  }));
  stages.forEach(k => {
    const n = used.filter(x => x === k).length;
    if(n !== 1) bad.push("단계 " + k + " 가 여정 " + n + "곳에 들어 있습니다 (하나여야 합니다)");
  });
  (W.AM_JOURNEYS||[]).forEach(j => {
    if(!routes.has(j.to)) bad.push("AM_JOURNEYS." + j.key + " — 없는 주소 " + j.to); });
  if(bad.length)
    throw new Error("준비 과정 · 운영 과제가 없는 것을 가리킵니다 —\n   " +
      bad.join("\n   ") + "\n   → 가짜 링크는 절대 규칙 5 입니다. 있는 것만 적으세요.");
}

function checkMarketData(W){
  const bad = [];
  const regions = new Set((W.AM_REGIONS || []).map(r => r.key));
  const inds    = new Set((W.AM_INDUSTRIES || []).map(i => i.key));
  const dupe = (list, key, what) => {
    const seen = new Set();
    list.forEach(x => {
      const v = x[key];
      if(!v) return bad.push(what + ": " + key + " 가 없습니다");
      if(seen.has(v)) bad.push(what + ": " + key + " 가 겹칩니다 — " + v);
      seen.add(v);
    });
  };

  /* ── 프랜차이즈 ── */
  const fcats = new Set((W.AM_FRANCHISE_CATS || []).map(c => c.key));
  const FR = W.AM_FRANCHISES || [];
  dupe(FR, "slug", "브랜드");
  FR.forEach(f => {
    const who = f.slug || f.name || "(이름 없는 브랜드)";
    if(!f.name) bad.push(who + ": name 이 없습니다");
    if(!fcats.has(f.cat)) bad.push(who + ": 없는 프랜차이즈 분류 " + f.cat);
    (f.regions || []).forEach(k => { if(!regions.has(k)) bad.push(who + ": 없는 지역 " + k); });
    const c = f.cost || {};
    /* ⚠️ 가맹사업법 — 출처와 기준일 없는 금액은 화면에 **안 나옵니다.**
       적어 놓고 안 나오면 "왜 금액이 안 보이지" 로 한참 헤맵니다. */
    const hasMoney = ["total","join","edu","deposit","interior","equip","etc"]
      .some(k => c[k]);
    if(hasMoney && !(c.source && c.asOf))
      bad.push(who + ": 금액을 적었는데 cost.source / cost.asOf 가 없습니다"
        + " — 화면에 **안 나옵니다** (가맹사업법: 정보공개서 출처와 기준일)");
    if(f.stores === 0)
      bad.push(who + ": 가맹점 수가 0 입니다 — 모르면 null 입니다 (0 은 '한 곳도 없다' 는 숫자)");
    if(f.disclosure && f.disclosure.has && !f.disclosure.no)
      bad.push(who + ": 정보공개서가 있다는데 등록번호가 없습니다");
  });

  /* ── 매물 · 자산 ── */
  const ST = W.AM_STORES || [], AS = W.AM_ASSETS || [];
  dupe(ST, "id", "매물"); dupe(AS, "id", "자산");
  ST.forEach(x => {
    const who = x.id || "(id 없는 매물)";
    if(!x.title) bad.push(who + ": title 이 없습니다");
    if(["transfer","lease"].indexOf(x.kind) < 0) bad.push(who + ": kind 는 transfer 또는 lease 입니다 — " + x.kind);
    if(x.industry && !inds.has(x.industry)) bad.push(who + ": 없는 업종 " + x.industry);
    if(x.region   && !regions.has(x.region)) bad.push(who + ": 없는 지역 " + x.region);
    if(!x.industry || !x.region)
      bad.push(who + ": 업종 · 지역이 없으면 거르개에서 **빠집니다**");
  });
  const storeIds = new Set(ST.map(x => x.id));
  AS.forEach(x => {
    const who = x.id || "(id 없는 자산)";
    if(!x.title) bad.push(who + ": title 이 없습니다");
    if(["asset","stock"].indexOf(x.cat) < 0) bad.push(who + ": cat 은 asset 또는 stock 입니다 — " + x.cat);
    if(x.deal && ["single","bulk","all"].indexOf(x.deal) < 0) bad.push(who + ": 없는 deal " + x.deal);
    if(x.industry && !inds.has(x.industry)) bad.push(who + ": 없는 업종 " + x.industry);
    if(x.region   && !regions.has(x.region)) bad.push(who + ": 없는 지역 " + x.region);
    if(x.storeId && !storeIds.has(x.storeId))
      bad.push(who + ": storeId \"" + x.storeId + "\" 인 매물이 없습니다 (끊어진 연결)");
    /* ⚠️⚠️ `sub`(장비 종류)가 틀리거나 비면 **조용히 안 나옵니다.**
       `/assets` 는 업종의 장비 칩으로 거르는데 거기에 안 걸리고, 상세
       화면의 종류 딱지도 사라집니다 — 업체 `subs` 가 그랬던 것과 같은
       자리입니다. 장비 key 는 `industries.js` 의 `equip` 에 있습니다. */
    if(!x.sub)
      bad.push(who + ": sub(장비 종류)가 없습니다 — 장비 칩으로 **못 찾습니다**");
    else if(!W.amEquipName)
      bad.push("amEquipName() 이 없습니다 — 장비 key 를 이름으로 못 바꿉니다 "
        + "(쓰는 쪽에 typeof 방어가 걸려 있어 **딱지만 조용히 사라집니다**)");
    else if(!W.amEquipName(x.sub))
      bad.push(who + ": 없는 장비 종류 \"" + x.sub + "\" — industries.js 의 equip key 여야 합니다"
        + " (틀리면 에러 없이 **조용히 안 나옵니다**)");
  });

  /* ── 지원사업 공고 ── */
  const SP = W.AM_SUPPORTS || [];
  dupe(SP, "key", "공고");
  SP.forEach(x => {
    const who = x.key || x.name || "(이름 없는 공고)";
    if(!x.name) bad.push(who + ": name 이 없습니다");
    if(["start","close","both"].indexOf(x.side) < 0)
      bad.push(who + ": side 는 start · close · both 입니다 — " + x.side);
    /* ⚠️ `amSupports()` 가 link 없는 것을 **아예 안 냅니다.** 적어 두고
       안 나오면 "왜 안 뜨지" 로 헤매니, 빌드가 먼저 말합니다. */
    if(!x.link)
      bad.push(who + ": link(공고 원문)가 없습니다 — 화면에 **안 나옵니다**");
    if(!x.asOf)
      bad.push(who + ": asOf(확인한 날)가 없습니다 — 열어 보지 않고 적으면 그 자체가 거짓말입니다");
  });

  /* ── 가격 데이터 ── */
  (W.AM_QUOTE_STATS || []).forEach((q, n) => {
    const who = "가격 " + (q.cat || n);
    if(!q.range) bad.push(who + ": range 가 없습니다");
    if(!q.asOf)  bad.push(who + ": asOf 가 없습니다 — 화면에 안 나옵니다");
    if((q.n || 0) < 10)
      bad.push(who + ": 건수가 " + (q.n || 0) + "건입니다 — 10건 아래는 화면에 **안 나옵니다**"
        + " (적은 표본으로 시세를 말하지 않습니다)");
  });

  if(bad.length)
    throw new Error("등록한 데이터가 어긋났습니다 (그 항목은 **조용히 안 나옵니다**):\n   "
      + bad.join("\n   "));
}

/* ── 라우터 밖 파일에 브랜드 이름 넣기 ──────────────────────────────
   ⚠️⚠️ `404.html` 과 `admin.html` 은 **라우터 밖에서 혼자 뜨는** 파일이라
   `js/data/brand.js` 를 안 읽습니다. 그래서 이름을 바꿨을 때 **거기만
   옛 이름이 남았습니다** — 404 화면과 관리자 작업대가 몇 달째 "시작과
   정리" 를 달고 있었고, 아무 검사도 그걸 안 봤습니다.

   이제 `<!--brand-->…<!--/brand-->` 사이를 빌드할 때마다 갈아 끼웁니다.
   파일을 그냥 열어도 안에 적힌 이름이 그대로 보이므로 화면이 깨지지
   않고, 빌드하면 늘 `AM_BRAND.name` 과 같아집니다.

   ⚠️ 표가 하나도 없으면 **멈춥니다.** 누가 지우면 그 파일이 조용히
   옛 이름으로 굳기 때문입니다. */
function brandStatics(W){
  const name = (W.AM_BRAND || {}).name || "";
  if(!name) throw new Error("AM_BRAND.name 이 비었습니다");
  for(const f of ["404.html", "admin.html"]){
    const p = path.join(ROOT, f);
    const src = fs.readFileSync(p, "utf8");
    const re = /<!--brand-->[\s\S]*?<!--\/brand-->/g;
    const n = (src.match(re) || []).length;
    if(!n) throw new Error(f + " 에 <!--brand--> 표가 없습니다 — "
      + "브랜드 이름을 손으로 적어 두면 이름을 바꿔도 거기만 안 바뀝니다");
    let out = src.replace(re, "<!--brand-->" + esc(name) + "<!--/brand-->");
    /* 관리자 작업대도 같은 CSS 를 씁니다 — 여기만 빠지면 운영자 화면이
       옛 색으로 남습니다. 404.html 은 인라인 style 이라 자산이 없습니다. */
    out = stampAssets(out);
    checkStamped(out, f);
    checkColorScheme(out, f);
    if(out !== src){ fs.writeFileSync(p, out); console.log("  " + f + " 갱신"); }
  }

  /* ⚠️⚠️ **`brand.js` 를 못 읽는 자리가 둘 더 있습니다.**
     `manifest.json` 은 JSON 이고, `middleware.js` 는 Edge 런타임이라
     화면 스크립트를 못 씁니다. 손으로 적어 둔 값이라 이름을 바꾸면
     **거기만 옛 이름으로 남습니다** — 이 저장소에서 브랜드 이름이 세
     번 바뀌었고 그때마다 뒤늦게 찾았습니다 (관리자 회신 글 · `adVendor()` ·
     404 · 관리자 작업대 · `WOW_BIZ.service`). 그래서 **셉니다.**
     ⚠️ 고치는 것이 아니라 멈춥니다 — 저 둘은 사람이 보고 바꿔야 하는
     자리입니다 (realm 처럼 한글을 넣으면 안 되는 칸이 섞여 있습니다). */
  for(const [f, why] of [["manifest.json", "홈 화면에 추가하면 여기 이름이 뜹니다"],
                         ["middleware.js", "관리자 차단 화면에 이 이름이 뜹니다"]]){
    const src = fs.readFileSync(path.join(ROOT, f), "utf8");
    if(src.indexOf(name) < 0)
      throw new Error(f + " 에 브랜드 이름(" + name + ")이 없습니다 — " + why
        + ". 이 파일은 brand.js 를 못 읽어서 손으로 고쳐야 합니다");
  }
}

/* ── 실행 ─────────────────────────────────────────────────────── */
checkCssVars();
checkColorSchemeCss();
checkVercel();
const W = loadApp();
checkProcess(W);
checkSales(W);
checkProviders(W);
checkMarketData(W);
checkPhotos(W);
brandStatics(W);
globalThis.__W = W;   /* shell() 이 브랜드 이름을 읽습니다 */
const tpl = fs.readFileSync(path.join(ROOT,"index.html"),"utf8");
/* 본보기(index.html)가 들고 있는 스크립트 수 — 만들어진 화면도 같아야 합니다 */
const WANT_SCRIPTS = (tpl.match(/<script[^>]+src="\/js\//g) || []).length;
if(WANT_SCRIPTS < 10)
  throw new Error("index.html 의 스크립트가 " + WANT_SCRIPTS + "개뿐입니다 — 본보기가 이미 깨졌습니다");
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
    /* ⚠️⚠️ **머리말도 여기서 갈아 끼웁니다.** 메인은 `shell()` 을 안
       거쳐서, 안 하면 브랜드 이름을 바꿨을 때 **메인만 옛 이름**으로
       남습니다 — 제일 많이 공유되는 화면입니다. */
    src = metaTags(src, r, route);
    /* ⚠️ index.html 은 빌드가 **제자리에서** 고치는 파일이라, 이미
       붙어 있는 값을 떼고 다시 붙입니다 (stampAssets 가 그렇게 합니다). */
    src = stampAssets(src);
    checkStamped(src, "index.html");
    checkColorScheme(src, "index.html");
    checkDefer(src, "index.html");
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
/* ⚠️⚠️ **데이터가 비면 그 뿌리가 목록에서 빠져서, 안을 아예 안
   들여다봅니다.** 업체 한 곳을 등록했다가 내리면 `/p/:id` 화면이
   서버에 **영영 남습니다** — 사이트맵에서는 빠지는데 주소는 살아
   있어서, 입점을 그만둔 업체의 소개가 계속 떠 있고 검색에도 남습니다.
   실제로 `p/` 안에 지워졌어야 할 화면이 남아 있는 것을 보았습니다.

   그래서 **데이터로 만들어지는 뿌리는 늘 훑습니다** — 지금 주소가
   하나도 없어도 들어가서 비웁니다. */
const DATA_ROOTS = ["p", "f", "s", "a", "c", "content", "startup", "closure", "providers", "franchise"];
const roots = new Set(
  routes.filter(r => r !== "/").map(r => r.split("/")[1]).concat(DATA_ROOTS));
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
/* ⚠️ **앞 서비스에서 남은 줄이었습니다** — `/sos` · `/check` · `/start` ·
   `/lab` 은 지금 하나도 없는 주소라, 메인 말고는 전부 0.6 으로 나가고
   있었습니다 (`robots.txt` 에서 겪은 것과 같은 꼴입니다).

   지금 얼개로 다시 적습니다. 손님이 처음 닿아야 하는 쪽이 높습니다 —
   창업 · 폐업 진입(0.9) → 업종별 · 분야별(0.8) → 목록 화면(0.7) →
   나머지(0.6) → 약관 · 방침(0.3, 있어야 하지만 찾아 들어오는 글은
   아닙니다). */
const prio = r => {
  if(r === "/") return "1.0";
  /* 여정 넷 (2026-10-05 V2 §1) — 메인 다음으로 손님이 처음 닿는 자리 */
  if(/^\/(startup|operation|acquisition|closure)$/.test(r)) return "0.9";
  /* 사업 단계 여섯 — 메인 다음으로 **손님이 처음 닿는 자리**입니다
     (2026-10-04 구조 개편). 창업 · 폐업 진입과 같은 층입니다. */
  if(/^\/g\/[^/]+$/.test(r)) return "0.9";
  if(/^\/(startup|closure)\/[^/]+$/.test(r)) return "0.8";
  if(/^\/(providers|franchise|c)\/[^/]+$/.test(r)) return "0.8";
  if(/^\/(providers|franchise|stores|assets|support|content|tools|join)$/.test(r)) return "0.7";
  if(/^\/(terms|privacy)$/.test(r)) return "0.3";
  return "0.6";
};
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

/* ── 영업 나가기 전에 확인할 것 (2026-10-07) ────────────────────────
   ⚠️⚠️ **빌드를 멈추지는 않습니다.** 사업자 정보 없이도 지금 사이트는
   정상적으로 서고, 멈추면 손도 못 대게 됩니다. 대신 빌드할 때마다
   **무엇이 비어 있는지** 적어 둡니다 — 업체를 받으러 나가시기 전에
   이 줄이 비어 있어야 합니다.

   왜 이 둘인가 —
   ① 사업자 정보: 전자상거래법 제10조 제1항이 표시하도록 정한
      항목입니다. 그리고 업체 사장님이 제일 먼저 하는 일이 푸터를
      보는 것이라, 비어 있으면 그 자리에서 영업이 끝납니다.
      ⚠️ 비면 화면은 **그 줄을 통째로 뺍니다** (절대 규칙 2) — 그래서
      에러도 안 나고 화면도 멀쩡해 보입니다. 그게 이 경고가 필요한
      까닭입니다.
   ② sosReady 가 켜져 있는데 접수처가 없으면: 손님이 다 적고 눌렀을
      때 503 입니다. site.js 가 "설정 전에 켜 두면 손님이 다 적고
      눌렀는데 실패합니다" 라고 적어 둔 그 자리입니다.
      ⚠️ 환경변수는 **Vercel 에만** 있어서 여기서는 못 봅니다 —
      켜져 있다는 사실만 짚어 드립니다.
   ⚠️ 이 경고를 없애려고 sosReady 를 끄지 마세요. 끄면 접수가 아예
      안 되고, 그건 더 나쁩니다. */
(function salesReady(){
  var B = W.WOW_BIZ || {};
  var need = [
    ["company","상호"], ["ceo","대표자"], ["brn","사업자등록번호"],
    ["mailOrder","통신판매업 신고번호"], ["address","사업장 주소"],
    ["phone","전화"], ["email","이메일"],
    ["privacyOfficer","개인정보 보호책임자"]
  ].filter(function(x){ return !String(B[x[0]] || "").trim(); });

  if(!need.length && !B.sosReady) return;      /* 둘 다 괜찮으면 조용히 */

  var out = [];
  if(need.length)
    out.push("사업자 정보 " + need.length + "칸이 비어 있습니다 — " +
             need.map(function(x){ return x[1]; }).join(" · ") +
             "  (js/data/site.js · 전자상거래법 제10조)");
  if(B.sosReady)
    out.push("접수(sosReady)가 켜져 있습니다 — Vercel 환경변수가 " +
             "실제로 들어가 있는지 확인하세요. 없으면 손님이 다 적고 " +
             "눌렀을 때 503 입니다 (INTAKE_WEBHOOK_URL 또는 " +
             "RESEND_API_KEY + INTAKE_EMAIL_TO · Production 체크)");
  if(need.length && B.sosReady)
    out.push("둘이 겹쳐 있습니다 — 지금 영업을 나가시면 업체가 " +
             "신청을 누르고 실패하거나, 누구인지 모르는 회사로 보입니다.");

  console.log("\n── 영업 나가기 전에");
  out.forEach(function(t){ console.log("  ⚠️ " + t); });
})();
