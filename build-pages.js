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
                "js/data/regions.js","js/data/industries.js",
                /* ⚠️ indgroups 는 업종 열넷 key 를 그대로 쓰므로 **그 뒤**입니다
                   (2026-10-09 지시서 PART 3 — 대분류 아홉 + 세부 업종) */
                "js/data/indgroups.js",
                "js/data/catalog.js",
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
                "js/data/sales.js",
                /* ⚠️⚠️ deal · fee 는 2차(데이터 모델)에서 들어온 것입니다.
                   **아직 화면이 읽지 않습니다** — 3차에서 신청·배정·계약
                   화면이 붙습니다. 그런데도 여기 넣어 둔 까닭은, 빌드가
                   checkDeal() · checkFee() · checkDealSql() 로 **지금부터**
                   맞춰 보기 때문입니다. 이 저장소가 "만들어 놓고 안 쓰는
                   칸" 으로 여러 번 겪은 것(gu · amStore() · withEquip ·
                   푸터의 stages)과 다른 점은, 이 둘은 **검사가 보고
                   있다**는 것입니다.
                   ⚠️ fee 는 deal 의 상태를 가리키지 않고 거꾸로도
                   아니어서 차례는 상관없습니다 */
                "js/data/deal.js", "js/data/fee.js",
                /* ⚠️ offers 는 catalog 의 분류 · 하위 key 와 fee 의
                   수익모델 key 를 그대로 쓰므로 **그 뒤**입니다 */
                "js/data/offers.js",
                /* ⚠️ reqforms 는 catalog 의 분류 key 를 씁니다 */
                "js/data/reqforms.js",
                /* ⚠️ opsvc 는 catalog 의 분류 · 하위 key 와 industries 의
                   업종 key 를 가리킵니다 — 둘 다 위에 있습니다 */
                "js/data/opsvc.js",
                /* ⚠️ packages 는 offers 의 상품 id 를 가리킵니다 */
                "js/data/packages.js",
                /* ⚠️ halls 는 catalog 의 분류 · 하위 key 를 가리킵니다
                   (2026-10-11 UI/UX 지시서 §2 · §4 — 전문관 넷) */
                "js/data/halls.js",
                /* ⚠️ svcpick 은 halls 의 칸과 reqforms 의 분류 key 를
                   읽습니다 — 둘 다 위에 있습니다 (2026-10-17 §12) */
                "js/data/svcpick.js",
                "js/data/svcpage.js",
                /* ⚠️ opscheck 은 svcpick 의 id · tools 의 key · content 의
                   slug 를 가리킵니다 — 셋 다 위에 있습니다 (2026-10-18 §9) */
                "js/data/opscheck.js",
                /* 이용 절차 넷 — 메인 05 구간과 크롤러 본문이 같이 읽습니다 */
                "js/data/steps.js"];

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

  /* ⚠️⚠️ **메인만 웜 아이보리입니다** (2026-10-17 §3-2). `index.html`
     의 `<html class="ivh">` 는 **메인 자신**의 것이고, 하위 화면은
     이 파일을 본으로 뜨기 때문에 **떼어 내야** 합니다 — 안 떼면
     160개 속화면이 메인 바탕을 쓰게 되고, 구간 리듬(ΔE 2.5)이 그
     값에 맞춰져 있지 않아 한꺼번에 어긋납니다.
     ⚠️ 클래스로 거는 까닭 — 화면이 그려지기 **전에** 정해져야 다른
     바탕이 번쩍이지 않습니다. 런타임 이동은 `js/app.js` 가 토글합니다. */
  h = h.replace(/<html([^>]*?)\s+class="ivh"/, "<html$1");
  if(/class="ivh"/.test(h))
    throw new Error(route+" 화면에서 ivh 를 못 떼어 냈습니다 — index.html 의 html 태그를 보세요");

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
     `js/pages/home.js` 의 `PageMain()` 구간 차례를 그대로 따라갑니다 —
     2026-10-11 로 **열**입니다 (HEADER · FOOTER 는 `#view` 밖).

       01 HERO   02 핵심 서비스 여덟   03 패키지   04 업종
       05 계산도구 + 최신 정보   06 매장 · 시설 · 장비
       07 인수 ↔ 인계   08 이미 운영 중이시라면   09 파트너   10 마지막 CTA

     ⚠️⚠️ **차례도 같아야 합니다.** 2026-10-09 에 화면이 다시 짜이면서
     여기는 2026-10-08 의 일곱 차례로 남아 있었습니다 — 브랜드 연결이
     02 에 앉아 있고 패키지 · 업종 · 운영 **세 구간이 아예 없었습니다.**
     크롤러가 읽는 차례가 화면과 다르면 검색 결과의 발췌가 화면에 없는
     순서로 나갑니다. `check.js` 의 "메인 구간 차례" 가 화면만 보기
     때문에 **여기는 사람이 맞춰야 합니다.**
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
    const nInd = (W.AM_INDUSTRIES||[]).length;
    const nCat = (W.AM_CATS||[]).length;
    const nSub = (W.AM_CATS||[]).reduce((n,c) => n + ((c.items||[]).length), 0);
    const byH = {}; (W.AM_HALLS||[]).forEach(h => { byH[h.key] = h; });

    /* ══ 2026-10-17 "메인페이지 최종 디자인 리뉴얼" §4 — 열한 덩이 ══
       ⚠️⚠️ **화면과 같은 차례 · 같은 말이어야 합니다.** 이 저장소는
       크롤러 본문이 화면과 어긋난 사고를 **아홉 번** 겪었습니다
       (MainPrice · MainReviews · 프랜차이즈 토막 · 분류 여덟 ·
       패키지 · 도움 줄의 계산도구 · 전문관 넷 · 계산도구 머리말 ·
       다크 아홉 영역). `check.js` 는 **그려진 화면만** 보기 때문에
       여기는 영원히 통과합니다 — 메인의 h2 만 checkMainH2() 가
       글자로 봅니다 (브랜드 이름이 든 머리말은 이름 앞뒤 토막으로).
       ⚠️ 구간을 바꾸시면 `js/pages/home.js` 의 PageMain() 과 **같은
       커밋에서** 여기도 고치세요.
       ⚠️⚠️ **히어로가 없습니다** (§4 — "기존의 큰 브랜드 히어로 배너는
       삭제한다"). 그래서 첫 문단이 범위 숫자를 들고 있습니다. */

    /* ── 첫 문단 (화면에는 ② 머리말과 범위 숫자 띠가 그 일을 합니다)
       ⚠️⚠️ **조사를 손으로 적지 마세요** — "인수인계이" 가 그대로
       크롤러 본문에 나간 적이 있습니다 (푸터 중개자 고지와 같은 자리). */
    p("매장을 열고 · 운영하고 · 넘기고 · 정리하는 데 필요한 서비스를 " +
      "한곳에서 찾고, 비교하고, 연결해 드립니다. " +
      W.koWith(B.name, "이가") + " 다루는 범위는 업종 " + nInd +
      " · 서비스 분야 " + nCat + " · 세부 서비스 " + nSub + "개입니다. " +
      "이 숫자는 서비스 분류 기준이며 등록된 업체 수가 아닙니다.");

    /* ── ② 창업 · 운영 · 폐업 진입 카드 셋 (§6) ──────────────────
       ⚠️⚠️ **화면의 머리말과 글자까지 같아야 합니다** (HomeEnter).
       ⚠️ 넷이 아니라 **셋**입니다 — 매장 양도양수는 ③ 이 받습니다. */
    h2("필요한 서비스를 한곳에서 찾으세요.");
    p("창업 준비 · 매장 운영 · 폐업 정리 — 단계를 고르시면 그 단계에 " +
      "필요한 서비스만 모아서 보여 드립니다.");
    for(const k of ["startup","operation","closure"]){
      const h = byH[k]; if(!h) continue;
      p(h.name + " — " + h.lead);
      ul((h.items||[]).map(it => it.n));
    }

    /* ── ③ 매장 양도양수 가로형 배너 (§7) ────────────────────────
       ⚠️⚠️ **매물이 0건입니다** — "몇 건" 처럼 말하지 않습니다. */
    const hp = byH["transfer"];
    if(hp){
      h2("한 사장님의 마지막이 다른 사장님의 시작이 됩니다.");
      p("권리금 · 시설 · 임대차를 함께 놓고 봅니다. 넘기시는 분과 " +
        "받으시는 분이 같은 화면을 보십니다. " + hp.name + " 바로가기 · " +
        "매장 인수 알아보기.");
      ul((hp.items||[]).map(it => it.n));
    }

    /* ── ④ 선택받는 이유 넷 + ⑤ 견적 신청 안내 (§8 · §9) ─────────
       ⚠️⚠️ **"검증된 업체" 라고 쓰지 마세요.** 검증 기능이 없습니다 —
       시안 그림에 그 글자가 있지만 적는 순간 표시 · 광고의 공정화에
       관한 법률 제3조입니다 (화면에도 안 적혀 있습니다).
       ⚠️ 넷은 `js/pages/home.js` 의 HOME_WHY 와 같은 말입니다. */
    h2("이곳에서 찾으시면 되는 까닭");
    ul(["전문 서비스 연결 — 창업 · 운영 · 양도양수 · 폐업에 필요한 분야를 " +
        "한 줄로 이어 두었습니다. 단계마다 무엇이 필요한지부터 보여 드립니다.",
        "간편한 견적 신청 — 업종 · 지역 · 조건을 한 번 적어 보내시면 " +
        "됩니다. 가입도 필요 없고 신청은 무료입니다.",
        "맞춤형 업체 연결 — 적어 주신 분야 · 지역 · 업종으로 그 일을 하는 " +
        "업체를 찾아 전달합니다. 저희는 중개자이고 거래 당사자가 아닙니다.",
        "견적 비교 안내 — 받으신 견적을 내 기록에서 나란히 놓고 보실 수 " +
        "있습니다. 업체는 등록된 차례로 내고 광고로 위에 올린 자리가 없습니다."]);
    /* ⑤ 견적 신청 안내 카드 — ⚠️ 셋째 줄의 **제3자 제공 재동의**를
       지우지 마세요 (개인정보보호법 제17조 제2항). */
    p("무료 견적 신청 — 어떤 서비스가 필요하신지 적어 보내시면, 그 분야 " +
      "업체를 찾아 연결해 드립니다. 업종 · 지역 · 조건을 한 번만 적으시면 " +
      "되고, 가입 없이 신청하실 수 있고 신청은 무료입니다. 업체에 연락처를 " +
      "전달하기 전에 동의를 다시 받습니다. 업체 회신 시점은 업체가 " +
      "정합니다 — 저희가 보장하지 않습니다.");

    /* ── ⑥ 이용 방법 다섯 걸음 (§10) ────────────────────────────
       ⚠️⚠️ **화면의 h2 와 글자까지 같아야 합니다** (HomeSteps).
       ⚠️ 걸음은 `js/data/steps.js` 한 곳입니다 — 손으로 적지 마세요. */
    const steps = (W.AM_STEPS || []);
    if(steps.length){
      h2("이용 방법은 간단합니다.");
      p("신청은 무료이고 가입이 필요 없습니다. 저희는 중개자이고 거래 " +
        "당사자가 아닙니다. 업체 회신 시점은 업체가 정합니다 — 저희가 " +
        "보장하지 않습니다.");
      ul(steps.map(x => x.n + " — " + x.d));
    }

    /* ── ⑦ 서비스 배너 둘 (§11) ─────────────────────────────────
       ⚠️⚠️ **광고주가 0곳이라 광고 배너가 아닙니다** — 자리와 짜임새는
       §11 대로 둘이고, 안에는 실제로 열리는 저희 분야 화면이 들어
       있습니다. "추천" · "인기" · "광고" 라고 적지 마세요. */
    p("매장을 만드는 일 — 인테리어 · 시공. 도면 · 철거 · 전기 · 간판까지 " +
      "한 분야에서 보고 비교하실 수 있습니다.");
    p("매장을 돌아가게 하는 일 — POS · CCTV · 매장시스템. 결제 · 주문 · " +
      "보안 · 네트워크를 한 분야에서 보고 비교하실 수 있습니다.");

    /* ── ⑧ 사장님을 위한 계산도구 넷 (§12) ──────────────────────
       ⚠️⚠️ **화면의 h2 와 글자까지 같아야 합니다** (HomeCalc).
       ⚠️ 이름 · 한 줄은 `js/data/tools.js` 한 곳입니다. */
    const byT = {}; (W.AM_TOOLS||[]).forEach(t => { byT[t.key] = t; });
    const cal = ["cost","bep","premium","closecost"].map(k => byT[k]).filter(Boolean);
    if(cal.length){
      h2("사업에 필요한 계산도구를 이용해 보세요.");
      p("창업 · 운영 · 양도양수 · 폐업에 필요한 비용을 미리 계산해 " +
        "보세요. 적으신 숫자는 이 브라우저에만 남습니다. 적으신 조건으로 " +
        "계산한 참고용 값이며 실제 금액은 지역 · 평수 · 업종에 따라 " +
        "달라집니다.");
      ul(cal.map(t => t.name + (t.out ? " — " + t.out : "")));
    }

    /* ── ⑨ 이용 가이드 (§13) ────────────────────────────────────
       ⚠️⚠️ **화면의 h2 와 글자까지 같아야 합니다** (HomeGuide).
       ⚠️ 글 편수는 **세는 값**입니다 — 손으로 적지 마세요. */
    const reads = (W.AM_CONTENTS || []);
    if(reads.length){
      h2("사장님께 필요한 이용 가이드");
      p("창업 · 운영 · 양도양수 · 폐업에서 자주 막히는 자리를 " +
        "정리했습니다. 지금 " + reads.length + "편이고 근거를 댈 수 있는 " +
        "것만 적습니다.");
      ul(reads.slice()
           .sort((x,y) => String(y.at||"").localeCompare(String(x.at||"")))
           .slice(0,3).map(c => c.title));
    }

    /* ── ⑩ 하단 견적 신청 CTA (§14) ─────────────────────────────
       ⚠️⚠️ **화면의 h2 · 단추와 같아야 합니다** (HomeCta). 이름은
       brand.js 에서 오고 조사는 koWith() 가 고릅니다 — checkMainH2()
       가 **이름 앞뒤 토막**으로 맞춰 봅니다. */
    h2("지금, " + W.koWith(B.name, "와과") + " 함께 시작하세요.");
    p("업종 · 지역 · 조건을 한 번만 적어 보내시면, 그 분야 업체를 찾아 " +
      "연결해 드립니다. 신청은 무료이고 가입이 필요 없습니다. " +
      "무료 견적 신청 · 자주 묻는 질문.");
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
      /* §6 의 네 구간 — ⚠⚠ **화면에 나오는 분류에만** 올립니다.
         화면에 없는 것을 크롤러에게만 보여 주면 그게 구글에
         나가는 거짓말입니다 (이 지장소가 다섯 번 겪은 자리). */
      const sp = (W.AM_SVCPAGE || {})[key];
      if(sp){
        if((sp.when||[]).length){ h2(c.name + " 업체를 이런 때 찾으십니다"); ul(sp.when); }
        if((sp.flow||[]).length){ h2("어떻게 진행되나요");
          ul(sp.flow.map(x => x.n + " — " + x.d)); }
        if((sp.cost||[]).length){ h2("비용은 무엇으로 갈리나요");
          ul(sp.cost.map(x => x.n + " — " + x.d)); }
        if((sp.faq||[]).length){ h2("자주 묻는 것");
          sp.faq.forEach(x => { L.push("<h3>"+esc(x.q)+"</h3>"); p(x.a); }); }
      }
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
/* 쓰기 전에 **실제로 그 형식인지** 봅니다 — 이름만 믿지 않습니다.
   크로미움은 못 만드는 형식을 시키면 **에러 없이 PNG** 를 돌려줍니다
   (`tools/fit-photos.js` 의 같은 함수). */
function sniffImg(buf){
  if(buf.length > 3 && buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return "jpg";
  if(buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF"
                     && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  if(buf.length > 12 && buf.toString("ascii", 4, 8) === "ftyp"
                     && buf.toString("ascii", 8, 12).indexOf("avi") === 0) return "avif";
  if(buf.length > 8 && buf[0] === 0x89 && buf.toString("ascii", 1, 4) === "PNG") return "png";
  return "?";
}

/* ⚠️⚠️ **사진은 "조용히 안 나오는" 쪽으로만 고장납니다.** 키를 한 글자
   틀려도 · 파일이 없어도 · 형식이 달라도 에러도 404 도 안 나고 화면만
   비어 보입니다. 그래서 빌드가 봅니다.

   ⚠️⚠️ 2026-10-10 로 **내용 값(`?v=`)이 필수**가 됐습니다.
   `vercel.json` 이 그림에 1년 `immutable` 을 주기 때문입니다 — 주소가
   안 바뀌면 사진을 갈아도 **손님 브라우저는 영영 옛 사진**입니다.
   사장님이 CSS 에서 **두 번** 물으셨던 그 사고입니다. 둘은 늘 같이
   움직입니다: 캐시 규칙을 빼면 이 검사도 같이 빼야 합니다. */
function checkPhotos(W){
  const SL = W.WOW_PHOTO_SLOTS || [];
  const slots = new Set(SL.map(s => s.key));
  const bad = [];
  const seen = new Map();          /* 파일 → 먼저 쓴 자리 (§3 중복 금지) */

  /* "/img/a.jpg?v=1234abcd 800w, /img/b.jpg?v=… 1600w" 를 낱낱이 */
  const urls = (v) => String(v || "").split(",").map(x => x.trim().split(/\s+/)[0])
                        .filter(Boolean);

  const one = (k, u, what, want) => {
    if(u[0] !== "/"){
      bad.push('"' + k + '" 의 ' + what + ' 경로가 / 로 시작하지 않습니다 — ' +
        '깊은 주소에서 404 가 납니다: ' + u);
      return;
    }
    const [file, q] = u.split("?");
    const abs = path.join(ROOT, file.replace(/^\//, ""));
    if(!fs.existsSync(abs)){ bad.push('"' + k + '" — 파일이 없습니다: ' + u); return; }

    const buf = fs.readFileSync(abs);
    const got = sniffImg(buf);
    if(want && got !== want)
      bad.push('"' + k + '" — ' + file + ' 는 이름이 ' + want + ' 인데 안은 ' + got +
        ' 입니다 (브라우저가 못 만드는 형식을 시키면 조용히 다른 것을 돌려줍니다)');

    const v = /(?:^|&)v=([0-9a-f]{8})$/.exec(q || "");
    if(!v){
      bad.push('"' + k + '" — ' + file + ' 에 내용 값(?v=)이 없습니다. ' +
        'vercel.json 이 그림을 1년 immutable 로 주고 있어서, 값이 없으면 ' +
        '사진을 바꿔도 손님 화면은 영영 옛날입니다 (node tools/fit-photos.js --write)');
    }else{
      const real = crypto.createHash("sha1").update(buf).digest("hex").slice(0, 8);
      if(v[1] !== real)
        bad.push('"' + k + '" — ' + file + ' 의 내용 값이 안 맞습니다 (' + v[1] +
          ' → ' + real + '). 파일만 바꾸고 다시 안 적으면 옛 사진이 그대로 보입니다');
    }

    /* §3 "같은 이미지를 불필요하게 반복하지 않는다" — 한 파일이 두
       자리에 쓰이면 화면 두 곳이 같은 그림입니다. 큰 카드 셋에서
       이미 한 번 적어 둔 걱정입니다. */
    const prev = seen.get(file);
    if(prev && prev !== k)
      bad.push('"' + k + '" 와 "' + prev + '" 가 **같은 파일**을 씁니다: ' + file +
        ' — 한 화면에 같은 그림이 두 번 나옵니다 (지시서 §3)');
    else if(!prev) seen.set(file, k);
  };

  for(const [k, p] of Object.entries(W.WOW_PHOTOS || {})){
    if(!slots.has(k))
      bad.push('"' + k + '" 는 없는 자리입니다 (js/data/photos.js 의 WOW_PHOTO_SLOTS)');
    if(!p || !p.src){ bad.push('"' + k + '" 에 src 가 없습니다'); continue; }

    one(k, p.src, "src", "jpg");
    urls(p.jpg).forEach(u => one(k, u, "jpg srcset", "jpg"));
    urls(p.webp).forEach(u => one(k, u, "webp srcset", "webp"));
    urls(p.avif).forEach(u => one(k, u, "avif srcset", "avif"));

    /* ⚠️ 비율을 안 적으면 사진이 뜨는 순간 아래 글이 밀려 내려갑니다 */
    if(!p.w || !p.h)
      bad.push('"' + k + '" 에 w · h 가 없습니다 — 사진이 뜰 때 아래 글이 밀립니다');

    /* ⚠️ 대체 형식을 적어 두고 `sizes` 가 없으면 브라우저가 **화면 전체
       폭**으로 보고 제일 큰 파일을 받습니다 — 폰에서 그게 제일 아픕니다. */
    const sl = SL.filter(x => x.key === k)[0] || {};
    if((p.jpg || p.webp || p.avif) && !(p.sizes || sl.sizes))
      bad.push('"' + k + '" 자리에 sizes 가 없습니다 — 폰도 제일 큰 판을 받습니다 ' +
        '(js/data/photos.js 의 WOW_PHOTO_SLOTS)');

    if(!String(p.alt || "").trim())
      bad.push('"' + k + '" 에 alt 가 비었습니다 — 읽어 주는 프로그램과 검색엔진이 보는 글입니다');
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
    /* ⚠️ 걸음의 주소에는 **질의문자가 붙을 수 있습니다**
       (`/sell?t=asset`). 통째로 견주면 멀쩡한 주소가 "없는 주소" 로
       걸립니다 — 경로만 떼어 봅니다. */
    [o.to, o.to2].forEach(t => {
      if(t && !routes.has(String(t).split("?")[0]))
        bad.push(where + " — 없는 주소 " + t); });
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

/* ════════════════════════════════════════════════════════════════════
   checkKeepUrls — **있던 주소가 사라지지 않았는가**

   2026-10-08 사장님 지시 — "기존 ... API 및 기존 URL은 절대 임의로
   삭제하거나 변경하지 마세요."

   말로 지키지 않고 **빌드가 막습니다.** tools/urls.json 에 그때그때의
   주소를 적어 두고, 빌드마다 지금 만들어지는 주소와 맞춰 봅니다.

   ⚠️ 왜 필요한가 — 주소가 사라지는 것은 **화면으로 표가 안 납니다.**
   이 저장소가 겪은 것 그대로입니다: 랜딩을 없애자 `/home` 을 가리키던
   헤더 CTA · 푸터 · 밖으로 퍼진 링크가 전부 404 가 될 뻔했고,
   리뉴얼로 구간이 내려올 때마다 `/g/:stage` 여섯이 길을 잃을 뻔했습니다.
   156개 주소가 이미 색인되어 있어서, 하나가 조용히 빠지면 그 자리에서
   들어오던 손님이 404 를 봅니다.

   ── 규칙 ──────────────────────────────────────────────
   · 적어 둔 주소가 **없어지면 멈춥니다**
   · 적어 둔 리다이렉트가 **없어지거나 가는 곳이 바뀌면 멈춥니다**
   · **늘어난 주소는 멈추지 않습니다** — 세어서 알려 주고, 적어 두라고
     합니다 (늘리는 것은 지시 위반이 아닙니다)

   ── 일부러 늘렸을 때 ──────────────────────────────────
       node build-pages.js --keep-urls      ← 지금 주소로 다시 적습니다

   ⚠️⚠️ **주소를 일부러 없애실 때는 적힌 줄을 지우기 전에
   vercel.json 에 redirect 를 먼저 넣으세요.** 308 로 보내면 주소는
   그대로 열리고 색인이 안 깨집니다 — `/closing` · `/companies` ·
   `/guides` · `/partners` 가 그렇게 살아 있습니다.
   ════════════════════════════════════════════════════════════════════ */
function checkKeepUrls(routes, vj){
  const file = path.join(ROOT, "tools", "urls.json");
  const now  = Array.from(new Set(routes)).sort();
  const reds = (vj.redirects || [])
                 .map(r => [String(r.source), String(r.destination)])
                 .sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);

  /* 다시 적어 달라고 하셨을 때 */
  if(process.argv.includes("--keep-urls")){
    fs.writeFileSync(file, JSON.stringify({
      note: "있던 주소가 사라지지 않았는지 빌드가 맞춰 보는 목록입니다. 손으로 지우지 마세요 — build-pages.js 의 checkKeepUrls() 주석을 보세요.",
      at: new Date().toISOString().slice(0, 10),
      routes: now,
      redirects: reds
    }, null, 2) + "\n");
    console.log("  ✎ tools/urls.json 을 다시 적었습니다 — 주소 " +
                now.length + "개 · 리다이렉트 " + reds.length + "개");
    return;
  }

  if(!fs.existsSync(file)){
    throw new Error("tools/urls.json 이 없습니다 — " +
      "node build-pages.js --keep-urls 로 한 번 만들어 주세요");
  }

  let kept;
  try{ kept = JSON.parse(fs.readFileSync(file, "utf8")); }
  catch(e){ throw new Error("tools/urls.json 을 읽지 못했습니다 — " + e.message); }

  const have = new Set(now);
  const gone = (kept.routes || []).filter(r => !have.has(r));
  if(gone.length)
    throw new Error("있던 주소 " + gone.length + "개가 사라졌습니다 — " +
      gone.slice(0, 12).join(" · ") + (gone.length > 12 ? " …" : "") +
      "\n  이미 색인된 주소입니다. 정말 없애시려면 vercel.json 에 redirect 를 " +
      "먼저 넣고, 그 다음에 tools/urls.json 에서 그 줄을 지우세요 " +
      "(allRoutes() 또는 데이터에서 빠진 것일 수도 있습니다)");

  const nowRed = new Map(reds);
  const badRed = [];
  for(const [src, dst] of (kept.redirects || [])){
    if(!nowRed.has(src))            badRed.push(src + " (없어짐)");
    else if(nowRed.get(src) !== dst) badRed.push(src + " → " + nowRed.get(src) + " (전에는 " + dst + ")");
  }
  if(badRed.length)
    throw new Error("옛 주소를 보내 주던 redirect 가 바뀌었습니다 — " +
      badRed.join(" · ") + "\n  밖으로 퍼진 링크가 그 주소를 들고 있습니다 " +
      "(vercel.json)");

  const added = now.filter(r => !(kept.routes || []).includes(r));
  if(added.length)
    console.log("  ✎ 주소가 " + added.length + "개 늘었습니다 (" +
      added.slice(0, 6).join(" · ") + (added.length > 6 ? " …" : "") +
      ") — 적어 두시려면: node build-pages.js --keep-urls");
}

/* ════════════════════════════════════════════════════════════════════
   checkDeal — 신청 상태 열둘이 말이 되는가 (지시서 §8 · §13)

   ⚠️⚠️ **이 검사가 막는 것은 디자인이 아니라 돈입니다.** 돈이 걸린
   상태(fee_wait · fee_done)로 들어가는 길에 관리자 말고 누구든
   끼어 있으면 **빌드가 멈춥니다.** 업체가 "계약했습니다" 를 누르면
   수수료가 확정되는 길이 생기는 것을 영구히 막습니다 (§8 마지막
   문장 · §13 "가짜 결제·정산 완료 상태 생성 금지").
   ════════════════════════════════════════════════════════════════════ */
function checkDeal(W){
  const ST = W.AM_DEAL_ST || [], MV = W.AM_DEAL_MOVE || [], RO = W.AM_ROLES || [];
  /* ⚠️⚠️ 2026-10-09 최종 통합 지시서 §8-3 으로 **열셋**이 됐습니다 —
     "취소 · 실패 · **보류** 상태를 별도로 관리한다." */
  if(ST.length !== 13)
    throw new Error("신청 상태가 " + ST.length + "개입니다 — 지시서 §8-3 은 열셋입니다");
  /* ⚠️⚠️ **보류는 끝이 아닙니다** — `end:true` 가 붙으면 돌아올 길이
     막히고, 그런 보류는 이름만 다른 취소입니다. */
  {
    const h = ST.filter(x => x.key === "hold")[0];
    if(!h) throw new Error("보류(hold) 상태가 없습니다 (§8-3)");
    if(h.end) throw new Error("보류에 end:true 가 붙어 있습니다 — 다시 진행할 수 없는 보류는 취소입니다");
    if(h.money) throw new Error("보류가 돈 상태로 잡혀 있습니다");
    /* ⚠️⚠️ 계약 뒤로는 보류가 없습니다 — 돈이 얽히면 멈추는 것이
       아니라 취소 · 환수입니다 (§10-3). */
    for(const m of MV)
      if(m[1] === "hold" && ["signed","done","fee_wait","fee_done"].includes(m[0]))
        throw new Error("계약 뒤에 보류로 가는 길이 있습니다 — " + m[0] +
          " → hold (돈이 얽힌 뒤는 취소 · 환수입니다 · §10-3)");
    /* 보류에서 나가는 길이 없으면 거기서 건이 죽습니다 */
    if(!MV.some(m => m[0] === "hold"))
      throw new Error("보류에서 나가는 길이 없습니다 — 들어가면 못 나오는 상태입니다");
  }
  const keys = ST.map(x => x.key), roles = RO.map(x => x.key);
  if(new Set(keys).size !== keys.length)
    throw new Error("신청 상태 key 가 겹칩니다");

  for(const m of MV){
    if(!keys.includes(m[0])) throw new Error("없는 상태에서 출발하는 길: " + m[0]);
    if(!keys.includes(m[1])) throw new Error("없는 상태로 가는 길: " + m[1]);
    for(const r of m[2])
      if(!roles.includes(r)) throw new Error("없는 역할이 길에 적혀 있습니다: " + r);
  }
  for(const s of ST)
    for(const r of s.who)
      if(!roles.includes(r)) throw new Error("없는 역할이 상태 " + s.key + " 에: " + r);

  /* 접수에서 모든 상태에 닿는가 — 닿지 않는 상태는 영원히 안 쓰이는
     칸입니다 (푸터의 stages 가 그렇게 죽어 있었습니다) */
  const seen = new Set(["new"]);
  for(let grew = true; grew; ){
    grew = false;
    for(const m of MV) if(seen.has(m[0]) && !seen.has(m[1])){ seen.add(m[1]); grew = true; }
  }
  const un = keys.filter(k => !seen.has(k));
  if(un.length)
    throw new Error("접수에서 닿을 수 없는 상태: " + un.join(" · ") +
      " — 아무 데서도 못 쓰는 상태입니다");

  /* ⚠️⚠️ 돈 상태로 들어가는 길은 관리자 전용 */
  const money = new Set(ST.filter(x => x.money).map(x => x.key));
  if(!money.size) throw new Error("돈이 걸린 상태(money:true)가 하나도 없습니다 — §8 의 정산 둘이 빠졌습니다");
  for(const m of MV){
    if(!money.has(m[1])) continue;
    if(m[2].length !== 1 || m[2][0] !== "admin")
      throw new Error("수수료가 확정되는 길(" + m[0] + " → " + m[1] +
        ")에 " + m[2].join(" · ") + " 가 끼어 있습니다 — 관리자 전용이어야 합니다 (§8 · §13)");
  }
  /* 계약 완료에서 정산으로 **바로 가는 길**이 없어야 합니다 */
  for(const m of MV)
    if(m[0] === "signed" && money.has(m[1]))
      throw new Error("계약 완료에서 정산으로 바로 가는 길이 있습니다 — " +
        "업체의 계약 완료 신고가 수수료를 확정하면 안 됩니다 (§8 마지막 문장)");
  /* 돈 상태를 고객이 볼 수 있으면 안 됩니다 */
  for(const s of ST)
    if(s.money && s.who.includes("customer"))
      throw new Error("고객이 정산 상태(" + s.key + ")를 봅니다 — 우리와 업체 사이의 일입니다");
}

/* ════════════════════════════════════════════════════════════════════
   checkFee — 수수료 틀이 §9 를 다 들고 있는가
   ════════════════════════════════════════════════════════════════════ */
function checkFee(W){
  if((W.AM_FEE_TYPE || []).length !== 6)
    throw new Error("수익모델이 " + (W.AM_FEE_TYPE || []).length +
      "개입니다 — 지시서 §9 는 여섯입니다");
  for(const g of [["AM_FEE_TYPE", 6], ["AM_FEE_VAT", 3], ["AM_FEE_WHEN", 4], ["AM_FEE_CYCLE", 3]]){
    const L = W[g[0]] || [], k = L.map(x => x.key);
    if(new Set(k).size !== k.length) throw new Error(g[0] + " 의 key 가 겹칩니다");
    for(const x of L) if(!x.key || !x.name) throw new Error(g[0] + " 에 이름 없는 항목이 있습니다");
  }
  /* ⚠️ 쓸 만한 정책이 실제로 통과하는지 — 너무 넓게 막는 것도 고장입니다 */
  const snap = W.amFeeSnap({ type:"rate", rate:3, vat:"add", when:"done", cycle:"monthly" });
  const r = W.amFeeCalc(snap, { amount:10000000 });
  if(!r.ok || r.fee !== 300000)
    throw new Error("1,000만원 · 3% 가 30만원이 안 나옵니다 — " + (r.why || r.fee));
  /* ⚠️⚠️ 계약금액이 없으면 **0 이 아니라 거절**이어야 합니다 */
  if(W.amFeeCalc(snap, {}).ok)
    throw new Error("계약금액 없이 수수료가 계산됩니다 — 0 원이 정산서에 올라갑니다 (§9)");
  /* ⚠️⚠️ 사본이 아닌 정책으로 계산되면 §9 의 정책 유지가 깨집니다 */
  if(W.amFeeCalc({ type:"rate", rate:3, vat:"add", when:"done", cycle:"monthly" },
                 { amount:1000000 }).ok)
    throw new Error("정책 사본이 아닌데 계산됩니다 — 요율을 고치면 지난 계약이 같이 바뀝니다 (§9)");
}

/* ════════════════════════════════════════════════════════════════════
   checkDealSql — **DB 의 값과 화면의 key 가 같은가**

   ⚠️⚠️ 이 저장소가 가장 많이 겪은 종류의 사고를 막습니다 — 한쪽만
   고치면 **에러 없이 조용히** 어긋나고, DB 가 화면이 보낸 상태를
   거절하거나 (더 나쁘게) 화면이 DB 의 상태를 못 읽습니다.
   업체 `subs` · 사진 키 · 도구 묶음에서 겪은 그 자리입니다.
   ════════════════════════════════════════════════════════════════════ */
function checkDealSql(W){
  const f = path.join(ROOT, "db", "migrations", "0001_init.sql");
  if(!fs.existsSync(f))
    throw new Error("db/migrations/0001_init.sql 이 없습니다 — 상태값을 맞춰 볼 데가 없습니다");
  const sql = fs.readFileSync(f, "utf8");

  /* create type <이름> as enum ( '...' , '...' ) 안의 값들을 꺼냅니다 */
  function enumOf(name){
    const re = new RegExp("create\\s+type\\s+" + name + "\\s+as\\s+enum\\s*\\(([^)]*)\\)", "i");
    const m = sql.match(re);
    if(!m) throw new Error("0001_init.sql 에 " + name + " enum 이 없습니다");
    return (m[1].match(/'([^']+)'/g) || []).map(x => x.slice(1, -1));
  }
  function same(what, a, b){
    if(a.length !== b.length || a.some((x, i) => x !== b[i]))
      /* ⚠️ 조사를 손으로 적지 않습니다 — what 이 "열둘" · "넷" · "여섯" ·
         "기준" 으로 바뀌어서 '가/이' 가 둘 다 나옵니다. 줄표로 받습니다
         (이 저장소가 "인수인계은" 으로 겪은 그 자리입니다) */
      throw new Error(what + " — 화면과 DB 에서 다릅니다\n" +
        "   화면: " + a.join(" · ") + "\n   DB  : " + b.join(" · ") +
        "\n   → 한쪽만 고치면 에러 없이 조용히 어긋납니다. 둘을 같이 고치세요");
  }
  same("신청 상태 열셋",   (W.AM_DEAL_ST  || []).map(x => x.key), enumOf("deal_state"));
  same("역할 넷",          (W.AM_ROLES    || []).map(x => x.key), enumOf("app_role"));
  same("수익모델 여섯",     (W.AM_FEE_TYPE || []).map(x => x.key), enumOf("fee_type"));
  same("부가세 처리 기준",  (W.AM_FEE_VAT  || []).map(x => x.key), enumOf("fee_vat"));
  same("수수료 확정 조건",  (W.AM_FEE_WHEN || []).map(x => x.key), enumOf("fee_when"));
  same("정산 주기",        (W.AM_FEE_CYCLE|| []).map(x => x.key), enumOf("fee_cycle"));

  /* ⚠️⚠️ **배정 상태 셋**은 enum 이 아니라 `assignment.state` 의 text
     입니다 — 그래서 SQL 이 **실제로 넣는 값**을 긁어서 맞춰 봅니다.
     화면이 모르는 값이 오면 `amAssignName()` 이 빈 문자열을 돌려주고
     그 줄이 **조용히 사라집니다** (이 저장소가 `gyeonggi` · `espresso`
     로 겪은 자리). */
  {
    const mv = path.join(ROOT, "db", "migrations", "0004_move_state.sql");
    const all = sql + (fs.existsSync(mv) ? fs.readFileSync(mv, "utf8") : "");
    /* ⚠️⚠️ **`state = 'x'` 만 찾으면 모자랍니다.** 0004 의
       `answer_assignment()` 는 `state = case when p_yes then 'accepted'
       else 'declined' end` 꼴이라 **거기서 안 걸립니다** — 처음에 그렇게
       적어 두고 되돌려 보니 **검사가 통과했습니다**(검사가 틀린 자리).
       그래서 `assignment` 가 나온 **뒤 300자 안**의 `state =` 식을
       통째로 잡고, 그 안의 따옴표 값을 전부 꺼냅니다. */
    const used = new Set();
    const re = /assignment[\s\S]{0,300}?\bstate\s*=\s*(case[\s\S]{0,200}?end|'[a-z_]+')/gi;
    let m;
    while((m = re.exec(all)) !== null)
      (m[1].match(/'([a-z_]+)'/g) || []).forEach(function(x){ used.add(x.slice(1, -1)); });
    /* 칸 선언에 적어 둔 것도 같이 봅니다 — `state text ... -- a | b | c` */
    const dec = all.match(/\bstate\s+text[^\n]*--([^\n]*)/);
    if(dec) (dec[1].match(/[a-z_]+/g) || []).forEach(function(x){ used.add(x); });
    if(used.size < 2)
      throw new Error("SQL 에서 배정 상태(assignment.state)를 " + used.size +
        "개밖에 못 찾았습니다 — 찾는 꼴이 바뀌었는지 보세요");
    const known = new Set((W.AM_ASSIGN_ST || []).map(x => x.key));
    for(const v of used)
      if(!known.has(v))
        throw new Error("배정 상태 '" + v + "' 를 화면이 모릅니다 — " +
          "js/data/deal.js 의 AM_ASSIGN_ST 에 넣으세요. " +
          "모르면 그 줄이 에러 없이 조용히 사라집니다");
  }

  /* ⚠️⚠️ RLS 를 켜지 않은 표가 있으면 **누구나 남의 신청과 계약금액을
     읽습니다.** Supabase 는 RLS 를 켜지 않은 표를 그대로 열어 줍니다. */
  const tables = (sql.match(/create table (?:if not exists )?([a-z_]+)/g) || [])
                   .map(x => x.replace(/.* /, ""));
  for(const t of tables)
    if(!new RegExp("alter table " + t + "\\s+enable row level security").test(sql))
      throw new Error("표 " + t + " 에 RLS 가 안 켜져 있습니다 — " +
        "켜지 않으면 누구나 읽습니다 (§8 권한 분리)");

  /* ⚠️⚠️ **상태를 바꾸는 길이 화면과 DB 에서 같은가** (0004_move_state.sql)
     0004 는 `js/data/deal.js` 의 AM_DEAL_MOVE 를 **표로** 들고 있고
     `move_state()` 가 그 표를 읽습니다. 한쪽만 고치면 화면은 "할 수
     있다" 고 단추를 내는데 DB 가 거절하거나, 더 나쁘게 **화면이 안 내는
     길로 DB 가 통과시킵니다.** 이 저장소가 "같은 규칙을 두 곳에 적어
     어긋난" 사고를 여러 번 겪은 자리입니다. */
  const mv = path.join(ROOT, "db", "migrations", "0004_move_state.sql");
  if(!fs.existsSync(mv))
    throw new Error("db/migrations/0004_move_state.sql 이 없습니다 — 상태 변경 문이 사라졌습니다");
  const msql = fs.readFileSync(mv, "utf8");
  {
    /* insert … values ( … ) ; 안의 줄을 꺼냅니다 */
    const seg = msql.split("insert into deal_move (from_state, to_state, role, needs) values")[1];
    if(!seg) throw new Error("0004 에 deal_move 를 채우는 insert 가 없습니다");
    const body = seg.split(/;\s*$|;\n/)[0];
    const got = new Set();
    const re = /\(\s*'([a-z_]+)'\s*,\s*'([a-z_]+)'\s*,\s*'([a-z_]+)'\s*,\s*([^)]*)\)/g;
    let m;
    while((m = re.exec(body))){
      /* ⚠️ '{}' 는 **빈 배열**이라 값이 아닙니다 — 처음에 그것까지
         값으로 읽어서 멀쩡한 표를 "다르다" 고 잡았습니다 (검사가 틀린 자리) */
      const needs = (m[4].match(/'([^']+)'/g) || []).map(x => x.slice(1, -1))
                      .filter(x => x !== "{}").join("+");
      got.add(m[1] + ">" + m[2] + ">" + m[3] + ">" + needs);
    }
    const want = new Set();
    for(const mo of (W.AM_DEAL_MOVE || [])){
      const needs = (mo[3] || []).join("+");
      for(const r of mo[2]) want.add(mo[0] + ">" + mo[1] + ">" + r + ">" + needs);
    }
    const miss = [...want].filter(x => !got.has(x));
    const extra = [...got].filter(x => !want.has(x));
    if(miss.length || extra.length)
      throw new Error("상태를 바꾸는 길이 화면과 DB 에서 다릅니다" +
        (miss.length  ? "\n   DB 에 없는 길: " + miss.slice(0, 6).join(" · ")  : "") +
        (extra.length ? "\n   화면에 없는 길: " + extra.slice(0, 6).join(" · ") : "") +
        "\n   → js/data/deal.js 를 고쳤으면 0004_move_state.sql 의 insert 도 같이 고치세요" +
        " (손으로 적지 말고 AM_DEAL_MOVE 에서 뽑으세요)");
  }
  /* ⚠️ 돈이 걸린 상태로 이 문이 통과시키면 안 됩니다 (§9 가 증빙을
     더 받으라고 적었습니다) */
  if(!/fee_wait['",\s)]*.*fee_done|'fee_wait','fee_done'/.test(msql) ||
     !/confirm_fee\(\) · mark_paid\(\) 로만/.test(msql))
    throw new Error("0004 가 수수료·정산 상태를 막는 줄이 없습니다 (§9)");

  /* ⚠️⚠️ 감사 기록은 고치거나 지울 수 없어야 합니다 (§8) */
  if(/create policy[^;]*on audit_log for (all|update|delete)/i.test(sql))
    throw new Error("audit_log 에 고치거나 지울 수 있는 정책이 있습니다 — " +
      "고칠 수 있는 기록은 기록이 아닙니다 (§8)");
}

/* ════════════════════════════════════════════════════════════════════
   checkOffers — 수익상품이 가리키는 것이 **실제로 있는가** (§5)

   ⚠️⚠️ **이 검사의 핵심은 마지막 줄입니다** — §5 가 "실제 제휴사가
   확보되지 않은 상품은 신청 가능 상품처럼 오인시키지 말라" 고 적었고,
   그것을 **손으로 지키지 않습니다.** 업체가 0곳인데 `status:"live"` 인
   상품이 있으면 **빌드가 멈춥니다.**
   ⚠️ 업체가 등록되면 그때 켜면 됩니다 — 그 전에는 켤 수가 없습니다.
   ════════════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════════
   운영 서비스관 여섯 묶음 (2026-10-09 최종 통합 지시서 §5-2 · §5-4)
   ══════════════════════════════════════════════════════════════════
   ⚠️⚠️ 묶음이 가리키는 분류 · 하위 key 가 하나라도 틀리면 그 서비스가
   **에러 없이 조용히 빠집니다** — 업체 `subs` · 사진 키 · 도구 묶음에서
   겪은 그 자리입니다. 그래서 빌드가 멈춥니다. */
/* ⚠️⚠️ **아이콘 이름은 `icon()` 이 아는 것만** 쓸 수 있습니다.
   모르는 이름을 적으면 `icon()` 이 **빈 문자열**을 돌려주고 타일이
   덧그러니 빅니다 — 에러도 404 도 없었고 전수 점검도 통과했던 자리입니다
   (`fridge` 로 겪었습니다). 빌드가 base.js 의 아이콘 목록을 읽어 넣습니다.
   ⚠️ base.js 는 샌드박스에 안 실려서(화면 코드입니다) **글자로** 읽습니다.
   ⚠️ 중쾄호 짝을 센다음 잔락니다 — 정규식으로 자르다가 다음 함수를 통째
   삼킨 사고가 이 저장소에 있습니다. */
const IC_NAMES = (() => {
  const src = fs.readFileSync(path.join(ROOT, "js/components/base.js"), "utf8");
  const i = src.indexOf("var IC = {");
  if(i < 0) throw new Error("base.js 에서 아이콘 목록을 못 찾았습니다");
  let d = 0, j = i + "var IC = ".length;
  for(; j < src.length; j++){
    if(src[j] === "{") d++;
    else if(src[j] === "}"){ d--; if(!d){ j++; break; } }
  }
  const body = src.slice(i, j);
  const out = new Set();
  const re = new RegExp("(?:^|[{,\\s])[\"']?([a-z][a-z0-9-]*)[\"']?\\s*:\\s*[\"'`]", "g");
  let m;
  while((m = re.exec(body))) out.add(m[1]);
  if(out.size < 40) throw new Error("아이콘 이름을 " + out.size + "개밖에 못 읽었습니다");
  return out;
})();

/* ⚠️ 컬러 아이콘(`iconArt`) 이름도 같은 방식으로 셉니다 — 없는 이름을
   적으면 타일이 덩그러니 빕니다 (iconArt 가 빈 문자열을 돌려줍니다).
   ⚠️ 선형 아이콘(IC)과 **다른 목록**입니다. 섞지 마세요. */
const IA_NAMES = (() => {
  const src = fs.readFileSync(path.join(ROOT, "js/components/base.js"), "utf8");
  const i = src.indexOf("var IA = {");
  if(i < 0) throw new Error("base.js 에서 컬러 아이콘 목록을 못 찾았습니다");
  let d = 0, j = i + "var IA = ".length;
  for(; j < src.length; j++){
    if(src[j] === "{") d++;
    else if(src[j] === "}"){ d--; if(!d){ j++; break; } }
  }
  const out = new Set();
  const re = new RegExp("(?:^|[{,\\s])[\"']?([a-z][a-z0-9-]*)[\"']?\\s*:\\s*[\"'`]", "g");
  let m; const body = src.slice(i, j);
  while((m = re.exec(body))) out.add(m[1]);
  if(out.size < 10) throw new Error("컬러 아이콘 이름을 " + out.size + "개밖에 못 읽었습니다");
  return out;
})();

/* ⚠️ 틴트 이름(`tn-*`)도 CSS 에서 읽어 셉니다 — 없는 이름을 적으면
   아이콘 타일이 **색 없이** 섭니다 (규칙이 아예 없으니 `--ic-ink` 가
   물려받은 값으로 남습니다). 에러도 안 나고 화면도 멀쩡해 보입니다. */
const TONE_NAMES = (() => {
  const src = fs.readFileSync(path.join(ROOT, "css/pages.css"), "utf8");
  const out = new Set();
  const re = new RegExp("^\\.tn-([a-z0-9]+)", "gm");
  let m;
  while((m = re.exec(src))) out.add(m[1]);
  if(out.size < 14) throw new Error("틴트 이름을 " + out.size + "개밖에 못 읽었습니다");
  return out;
})();

/* ── 전문관 넷 (2026-10-11 UI/UX 지시서 §2 · §4 · §5) ───────────────
   ⚠️⚠️ 막는 것 일곱 —
     ① 없는 분류 · ② 없는 하위 · ③ 하위를 적을 수 없는 분류에 하위
     ④ 없는 주소 · ⑤ 없는 컬러 아이콘
     ⑥ **한 전문관 안에서 아이콘이 겹침** (열두 칸에 같은 그림 둘)
     ⑦ **한 전문관 안에서 가는 곳이 겹침** (§5 중복 방지 —
        손님은 둘이 다른 것인 줄 압니다)
   전부 일부러 틀리게 해 보고 멈추는 것을 확인했습니다. */
function checkHalls(W){
  const H = W.AM_HALLS || [];
  if(!H.length) throw new Error("js/data/halls.js 의 AM_HALLS 가 비었습니다 (§2)");
  if(H.length !== 4)
    throw new Error("전문관이 " + H.length + "개입니다 — 지시서 §2 는 넷입니다");

  const cats  = new Map((W.AM_CATS || []).map(c => [c.key, c]));
  const paths = new Set(allRoutes(W));
  const seenKey = new Set(), seenTone = new Set();

  /* 질의문자가 붙은 주소(`/assets?c=stock`)는 경로만 떼어 봅니다 —
     checkProcess() 가 멀쩡한 주소를 "없는 주소" 로 잡았던 자리입니다 */
  const okRoute = (u) => paths.has(String(u).split("?")[0].split("#")[0]);

  for(const h of H){
    if(!h.key || seenKey.has(h.key))
      throw new Error("전문관 key 가 비었거나 겹칩니다 — " + h.key);
    seenKey.add(h.key);
    if(!h.name || !h.lead)
      throw new Error("전문관에 이름이나 한 줄이 없습니다 — " + h.key);
    if(!h.tone || seenTone.has(h.tone))
      throw new Error("전문관 색이 비었거나 겹칩니다 — " + h.key + " · " + h.tone);
    seenTone.add(h.tone);
    if(!h.to || !okRoute(h.to))
      throw new Error("전문관이 없는 주소를 가리킵니다 — " + h.key + " · " + h.to);
    if(!h.ic || !IC_NAMES.has(h.ic))
      throw new Error("전문관 아이콘이 없는 이름입니다 — " + h.key + " · " + h.ic);

    const items = h.items || [];
    if(!items.length) throw new Error("전문관이 비었습니다 — " + h.key);
    const ias = new Set(), tos = new Set();

    for(const it of items){
      const at = "전문관 " + h.key + " 의 \"" + (it.n || "(이름 없음)") + "\"";
      if(!it.n) throw new Error(at + " — 이름이 없습니다");
      if(!it.ia || !IA_NAMES.has(it.ia))
        throw new Error(at + " 가 없는 컬러 아이콘을 가리킵니다 — " + it.ia);
      if(ias.has(it.ia))
        throw new Error(at + " 의 아이콘이 같은 전문관 안에서 겹칩니다 — " + it.ia);
      ias.add(it.ia);

      let dest = it.to;
      if(!dest){
        const c = cats.get(it.cat);
        if(!c) throw new Error(at + " 가 없는 분류를 가리킵니다 — " + it.cat);
        if(it.sub){
          if(c.byIndustry)
            throw new Error(at + " — " + it.cat + " 는 하위가 업종에서 와서 하위를 적을 수 없습니다");
          const subs = new Set((c.items || []).map(x => x.key));
          if(!subs.has(it.sub))
            throw new Error(at + " 가 없는 하위를 가리킵니다 — " + it.cat + " / " + it.sub);
        }
        const base = c.to ? c.to
          : ((c.kind === "provider") ? "/providers/" + c.key : "/c/" + c.key);
        dest = it.sub ? (base + (base.indexOf("?") < 0 ? "?" : "&") + "s=" + it.sub) : base;
      }
      if(!okRoute(dest))
        throw new Error(at + " 가 없는 주소로 갑니다 — " + dest);
      if(tos.has(dest))
        throw new Error(at + " 가 같은 전문관 안의 다른 칸과 **같은 데로** 갑니다 — " + dest +
          "\n   → 손님은 둘이 다른 것인 줄 압니다. 하나를 빼거나 하위(?s=)로 가르세요 (§5)");
      tos.add(dest);
    }
  }
}

/* ── §12 고를 수 있는 서비스 (2026-10-17 창업 준비 전문관) ─────────
   ⚠️⚠️ **대표 여섯이 실제로 고를 수 있는 서비스인지** 봅니다. 없는 id 를
   적으면 그 칸이 **조용히 빠지고** 대표가 다섯이 됩니다 — 화면으로는
   "원래 다섯인가" 로 보여서 아무도 모릅니다 (halls 의 아이콘 · 업체
   subs · 사진 키로 겪은 그 자리).
   ⚠️ 쉬운 이름(§9-3)도 **없는 id 에 적어 두면** 영영 안 쓰입니다. */
function checkSvcPick(W){
  const TOP  = W.AM_PICK_TOP  || {};
  const EASY = W.AM_PICK_EASY || {};
  if(!Object.keys(TOP).length)
    throw new Error("js/data/svcpick.js 의 AM_PICK_TOP 이 비었습니다 (§2-B)");

  /* ⚠️⚠️ **지시서가 적은 대표 개수는 전문관마다 다릅니다.**
     창업 준비는 여섯(2026-10-17 §2-B), 매장 운영은 여덟(2026-10-18
     §4-2)입니다. 여기 하나로 박아 두었다가 운영 쪽을 붙이자 **멀쩡한
     여덟이 "여섯이 아닙니다" 로** 빌드를 멈췄습니다 — 전문관을 더하면
     지시서를 먼저 고치고 이 줄을 같이 고치세요. */
  const TOP_N = { startup: 6 };

  /* 전문관마다 고를 수 있는 서비스를 모아 둡니다.
     ⚠⚠ **하위까지 모읍니다.** 2026-10-18 운영 §4-4 로 고르는 단위가
     `분류/하위`(`repair/aircon-fix`)까지 내려왔습니다 — 분류만 모으면
     그 쉬운 이름들이 전부 "고를 수 없는 서비스" 로 잡혀 멀쩡한 줄이
     빌드를 멈춥니다.
     ⚠️ 운영 쪽은 `AM_PICK_SIDE` 에 없어서 `amPickAll()` 이 빈 배열을
     돌려줍니다 — `amPickHallCats()` 가 그 자리입니다. */
  const ok = new Set();
  const addCat = (s) => {
    if(!s || !s.id) return;
    ok.add(s.id);
    if(s.sub) return;                        /* 하위는 더 내려갈 것이 없습니다 */
    for(const sub of W.amPickSubs(s.id)) ok.add(sub.id);
  };
  for(const h of (W.AM_HALLS || [])){
    for(const s of W.amPickAll(h.key)) addCat(s);
    for(const s of W.amPickHallCats(h.key)) addCat(s);
  }

  for(const hall of Object.keys(TOP)){
    const ids = TOP[hall] || [];
    const want = TOP_N[hall];
    if(!want)
      throw new Error("\"" + hall + "\" 전문관의 대표 개수가 지시서에 없습니다" +
        "\n   → build-pages.js 의 TOP_N 에 적으세요 (지시서를 먼저 고치고)");
    if(ids.length !== want)
      throw new Error("대표 서비스가 " + ids.length + "개입니다 (" + hall +
        ") — 지시서는 " + want + "입니다");
    const seen = new Set();
    for(const id of ids){
      if(seen.has(id))
        throw new Error("대표 서비스가 겹칩니다 — " + hall + " · " + id);
      seen.add(id);
      if(!W.amPickAll(hall).some(s => s.id === id))
        throw new Error("대표 서비스 \"" + id + "\" 를 " + hall +
          " 전문관에서 고를 수 없습니다" +
          "\n   → js/data/halls.js 의 그 전문관 칸에 분류(cat)로 있어야 합니다");
    }
  }

  for(const id of Object.keys(EASY)){
    if(!EASY[id])
      throw new Error("쉬운 이름이 비었습니다 — " + id +
        "\n   → 적을 말이 없으면 칸째 빼세요 (원래 이름이 그대로 나옵니다)");
    if(!ok.has(id))
      throw new Error("쉬운 이름이 고를 수 없는 서비스를 가리킵니다 — " + id +
        "\n   → 영영 안 쓰이는 줄입니다 (AM_PICK_EASY)");
  }
}

/* ── §4 운영 대표 여덟 + 세부 펼침 (2026-10-18 매장 운영 2차) ──────
   > §4-4 — "대표 카테고리 선택과 실제 서비스 선택을 혼동하지 않도록 한다."

   ⚠️⚠️ 막는 것 아홉 —
     ① 묶음 개수가 지시서와 다름 · ② 묶음 key 가 비었거나 겹침
     ③ 없는 컬러 아이콘 · ④ **한 전문관 안에서 아이콘이 겹침**
        (여덟 칸에 같은 그림 둘이면 손님이 가를 수가 없습니다)
     ⑤ 없는 틴트 이름 · ⑥ 틴트 겹침
     ⑦ **없는 id**(`any` · `subs`) — 그냥 두면 `amPickGroups()` 가
        조용히 빼서 "원래 일곱인가" 로 보입니다
     ⑧ **세부가 두 묶음에 들어감** 또는 `any` 가 겹침 — 같은 서비스를
        두 자리에서 고르게 되고, 그게 §2 가 없애려는 그 혼동입니다
     ⑨ **내려놓은 서비스**(`AM_PICK_OFF`)를 아직 가리킴 — 고르개에
        안 나와야 하는 것을 대표로 내는 꼴입니다
   ⚠️ `subs` 는 **전부 `분류/하위` 꼴**이라야 합니다. 분류를 섞으면
   "에어컨 수리" 자리에 "수리 · 유지보수 전체" 가 끼어서, 고르신 것과
   접수에 실리는 것이 달라집니다.
   ──────────────────────────────────────────────────────────────── */
function checkPickGroup(W){
  const G = W.AM_PICK_GROUP || {};
  /* 지시서가 적은 묶음 개수 — ⚠️ 바꾸시려면 지시서를 먼저 고치세요 */
  /* 2026-10-18 §4-2 (운영) · 전체 점검 지시서 §3 · §12 · §13 (나머지)
     ⚠️⚠️ **창업은 여기 없습니다** — 그쪽은 묶음이 아니라 `AM_PICK_TOP`
     의 대표 여섯이고 `checkSvcPick()` 이 셉니다 (고르는 단위가
     분류라서입니다). 묶음을 안 쓰는 전문관을 WANT 에 적으면 빌드가
     "AM_PICK_GROUP 에 startup 이 없습니다" 로 멈춥니다.
     ⚠️ 양도양수가 **여섯**인 까닭 — §4 가 "실제 서비스가 부족한
     경우 억지로 채우지 않는다" 고 적었습니다. 늘리시려면 지시서를
     먼저 고치세요. */
  const WANT = { operation: 8, closure: 8, transfer: 6 };
  const OFF  = new Set(W.AM_PICK_OFF || []);

  for(const hall of Object.keys(WANT))
    if(!(G[hall] || []).length)
      throw new Error("js/data/svcpick.js 의 AM_PICK_GROUP 에 \"" + hall +
        "\" 가 없습니다 (§4-2)");

  for(const hall of Object.keys(G)){
    const gs   = G[hall] || [];
    const want = WANT[hall];
    if(!want)
      throw new Error("\"" + hall + "\" 묶음 개수가 지시서에 없습니다" +
        "\n   → build-pages.js 의 WANT 에 적으세요 (지시서를 먼저 고치고)");
    if(gs.length !== want)
      throw new Error("대표 묶음이 " + gs.length + "개입니다 (" + hall +
        ") — 지시서는 " + want + "입니다");

    /* 전체 서비스 보기가 들고 있는 분류 — 묶음이 가리키는 분류가
       여기 빠지면 "대표로는 고르는데 전체 목록에는 없는" 꼴입니다 */
    const hallCats = new Set(W.amPickHallCats(hall).map(s => s.id));
    const keys = new Set(), ias = new Set(), tones = new Set();
    const anys = new Set(), subs = new Map();

    for(const g of gs){
      const at = "운영 대표 \"" + (g.name || g.key || "(이름 없음)") + "\"";
      if(!g.key || keys.has(g.key))
        throw new Error(at + " 의 key 가 비었거나 겹칩니다 — " + g.key);
      keys.add(g.key);
      if(!g.name || !g.lead)
        throw new Error(at + " 에 쉬운 이름이나 한 줄이 없습니다 (§4-4)");
      if(!g.ia || !IA_NAMES.has(g.ia))
        throw new Error(at + " 의 컬러 아이콘이 없는 이름입니다 — " + g.ia +
          "\n   → js/components/base.js 의 IA 에 있어야 합니다");
      if(ias.has(g.ia))
        throw new Error(at + " 의 아이콘이 같은 전문관의 다른 묶음과 겹칩니다 — " +
          g.ia + "\n   → 여덟 칸에 같은 그림이 둘이면 손님이 가를 수 없습니다");
      ias.add(g.ia);
      if(!g.tone || !TONE_NAMES.has(g.tone))
        throw new Error(at + " 의 틴트가 없는 이름입니다 — " + g.tone +
          "\n   → css/pages.css 의 .tn-* 에 있어야 합니다");
      if(tones.has(g.tone))
        throw new Error(at + " 의 틴트가 다른 묶음과 겹칩니다 — " + g.tone);
      tones.add(g.tone);

      /* ⚠️ "모르겠어요" 가 담는 것 — 없으면 그 단추가 아무 일도 안 합니다 */
      const any = W.amPickOne(g.any);
      if(!any)
        throw new Error(at + " 의 any 가 없는 서비스입니다 — " + g.any +
          "\n   → js/data/catalog.js 의 분류 또는 `분류/하위` 여야 합니다");
      if(OFF.has(g.any))
        throw new Error(at + " 의 any 가 내려놓은 서비스입니다 — " + g.any +
          "\n   → AM_PICK_OFF 에 있는 것은 고르개에 안 나와야 합니다 (§12)");
      if(anys.has(g.any))
        throw new Error(at + " 의 any 가 다른 묶음과 겹칩니다 — " + g.any +
          "\n   → 여덟 중 둘이 같은 칸이 됩니다 (§4-4 혼동 방지)");
      anys.add(g.any);
      if(!hallCats.has(any.sub ? W.amPickSplit(g.any).cat : any.id))
        throw new Error(at + " 의 any 가 전체 서비스 목록에 없는 분류입니다 — " +
          g.any + "\n   → amPickHallCats(\"" + hall + "\") 가 받아야 합니다");

      const list = g.subs || [];
      if(!list.length)
        throw new Error(at + " 에 세부 선택지가 없습니다 (§4-4)");
      for(const id of list){
        const where = at + " 의 세부 \"" + id + "\"";
        if(String(id).indexOf("/") < 0)
          throw new Error(where + " 가 분류입니다 — `분류/하위` 꼴이어야 합니다" +
            "\n   → 분류를 섞으면 고르신 것과 접수에 실리는 것이 달라집니다");
        if(!W.amPickOne(id))
          throw new Error(where + " 는 없는 서비스입니다" +
            "\n   → js/data/catalog.js 의 그 분류 하위(items)에 있어야 합니다");
        if(OFF.has(id))
          throw new Error(where + " 는 내려놓은 서비스입니다 (AM_PICK_OFF · §12)");
        if(subs.has(id))
          throw new Error(where + " 가 \"" + subs.get(id) + "\" 묶음에도 있습니다" +
            "\n   → 같은 서비스를 두 자리에서 고르게 됩니다 (§2 선택 영역은 하나)");
        subs.set(id, g.name || g.key);
        const cat = W.amPickSplit(id).cat;
        if(!hallCats.has(cat))
          throw new Error(where + " 의 분류가 전체 서비스 목록에 없습니다 — " + cat);
      }
    }

    /* ⚠️⚠️ **내려온 구간이 가리키던 분류를 빠짐없이 받는가** (§0 · §2).
       §2 가 선택 영역을 하나로 줄이라고 적었는데, 그러면 내려온 구간
       (운영 서비스관 여섯 · 운영 과제 스물넷)이 가리키던 분류가 갈 곳이
       없어집니다 — 그건 §0 의 "기존 서비스 데이터" 보존을 어기는 것입니다.
       ⚠️ `amPickHallCats()` 가 그 둘에서 모으기 때문에 보통은 저절로
       맞지만, **없는 key 를 적거나 내려놓은 분류를 아직 가리키면**
       조용히 빠집니다 — 그것을 여기서 잡습니다. */
    if(hall === "operation"){
      const need = new Map();
      for(const g of (W.AM_OPSVC || []))
        for(const o of (g.items || [])) need.set(o.cat, "운영 서비스관 " + g.name);
      /* ⚠️ 분류가 없는 과제가 하나 있습니다 — "원가 · 매출 관리" 는
         분류가 아니라 `/tools` 로 바로 갑니다. 거기까지 세면 멀쩡한
         데이터를 "분류 undefined" 로 잡습니다 (제 검사가 그랬습니다). */
      for(const o of (W.AM_OPS || []))
        if(o.cat) need.set(o.cat, "운영 과제 \"" + o.name + "\"");
      for(const [cat, from] of need)
        if(!hallCats.has(cat))
          throw new Error(from + " 가 가리키는 분류 \"" + cat +
            "\" 를 운영 전체 서비스 목록이 못 받습니다" +
            "\n   → 내려온 구간이 가리키던 분류는 빠짐없이 받아야 합니다 (§0 · §2)");
    }
  }
}

/* ── §9 운영 체크리스트 (2026-10-18 매장 운영 2차) ────────────────
   ⚠️⚠️ 막는 것 일곱 —
     ① 대표가 여섯이 아님 (지시서 §9) · ② key 가 비었거나 겹침
     ③ 이름 · 설명이 없음
     ④ **없는 서비스 id** — 맡길 곳 단추가 아무 데도 안 갑니다
     ⑤ **없는 계산도구 key** (§11 "없는 계산도구를 클릭 가능한 가짜
        카드로 표시하지 않는다")
     ⑥ **없는 글 slug** — 가짜 링크입니다 (절대 규칙 5)
     ⑦ **기한 숫자 · 요율** — 과세 유형과 업종에 따라 갈려서 적어 두면
        틀린 날부터 거짓말입니다 (손익분기 85조원과 같은 자리)
   ──────────────────────────────────────────────────────────────── */
function checkOpsCheck(W){
  const L = W.AM_OPS_CHECK || [];
  if(!L.length) throw new Error("js/data/opscheck.js 의 AM_OPS_CHECK 가 비었습니다 (§9)");
  const top = L.filter(o => o.top).length;
  if(top !== 6)
    throw new Error("운영 체크리스트 대표가 " + top + "개입니다 — 지시서 §9 는 여섯입니다");

  const tools = new Set((W.AM_TOOLS || []).map(t => t.key));
  const slugs = new Set((W.AM_CONTENTS || []).map(c => c.slug));
  /* 기한 · 요율 — 숫자 뒤에 날 · 개월 · 퍼센트가 붙은 것 */
  const WHEN = /[0-9][0-9,.]*\s*(일\s*(안|내|까지)|개월|퍼센트|%)/;
  const seen = new Set();

  for(const o of L){
    const at = "운영 체크리스트 \"" + (o.name || o.key || "(이름 없음)") + "\"";
    if(!o.key || seen.has(o.key))
      throw new Error(at + " 의 key 가 비었거나 겹칩니다 — " + o.key);
    seen.add(o.key);
    if(!o.name || !o.lead)
      throw new Error(at + " 에 이름이나 설명이 없습니다");
    if(WHEN.test(o.lead))
      throw new Error(at + " 의 설명에 기한이나 요율이 적혀 있습니다" +
        "\n   → 과세 유형 · 업종 · 사업장 규모에 따라 갈립니다. 적는 것은" +
        " **무엇을 확인해야 하는가**와 **어디서 확인하나**까지입니다");
    if(o.cat && !W.amPickOne(o.cat))
      throw new Error(at + " 가 없는 서비스를 가리킵니다 — " + o.cat +
        "\n   → svcpick 의 id(`분류` 또는 `분류/하위`)여야 합니다");
    if(o.tool && !tools.has(o.tool))
      throw new Error(at + " 가 없는 계산도구를 가리킵니다 — " + o.tool +
        "\n   → §11 이 금지한 **가짜 카드**가 됩니다 (js/data/tools.js)");
    if(o.read && !slugs.has(o.read))
      throw new Error(at + " 가 없는 글을 가리킵니다 — " + o.read);
  }
}

/* ── §6 서비스 상세의 공통 네 구간 (2026-10-11 간소화 지시서) ──────
   ⚠️⚠️ **금액을 적을 수 없게 막습니다.** ④ 의 이름이 "예상 비용
   **또는** 비용 결정 요인" 인 까닭이고, 프랜차이즈 창업비를
   정보공개서 값으로만 내는 것과 같은 규칙입니다 — 사장님이 그
   숫자를 보고 수천만 원을 빌리러 가십니다.
   ⚠️ 빈 배열도 막습니다. 칸을 열어 놓고 비우면 그게 자리표시자이고,
   §6 이 "실제 정보가 없는 영역을 억지로 채우지 않는다" 라고 적은
   것은 **구간째 빼라**는 말입니다 (절대 규칙 2).
   ──────────────────────────────────────────────────────────────── */
function checkSvcPage(W){
  const P = W.AM_SVCPAGE || {};
  const keys = Object.keys(P);
  if(!keys.length)
    throw new Error("js/data/svcpage.js 의 AM_SVCPAGE 가 비었습니다 (§6)");

  const cats  = new Map((W.AM_CATS || []).map(c => [c.key, c]));
  const paths = new Set(allRoutes(W));
  /* 금액 · 요율 — 숫자 뒤에 돈 단위나 퍼센트가 붙은 것 */
  const MONEY = /[0-9][0-9,.]*\s*(억|천만|백만|만\s*원|원|%)/;
  /* 지킬 수 없는 약속 — check.js 의 `/join` 검사와 같은 목록입니다 */
  const SAY = [[/보장/, "보장"], [/최저가/, "최저가"], [/무조건/, "무조건"],
               [/[0-9]\s*시간\s*(안|내)/, "n시간 안에"],
               [/당일\s*(연락|배정|시공)/, "당일"],
               [/평균/, "평균"], [/시세/, "시세"]];

  for(const k of keys){
    const c = cats.get(k);
    if(!c) throw new Error("js/data/svcpage.js 가 없는 분류를 가리킵니다 — " + k +
      "\n   → js/data/catalog.js 의 분류 key 를 적으세요");
    const dest = c.to ? c.to
      : ((c.kind === "provider") ? "/providers/" + c.key : "/c/" + c.key);
    if(!paths.has(String(dest).split("?")[0]))
      throw new Error("\"" + k + "\" 는 화면이 없는 분류입니다 — " + dest);

    const d = P[k] || {};
    const got = ["when","flow","cost","faq"].filter(f => f in d);
    if(!got.length)
      throw new Error("\"" + k + "\" 에 네 구간(when · flow · cost · faq)이 하나도 없습니다");

    for(const f of got){
      const L = d[f];
      if(!Array.isArray(L) || !L.length)
        throw new Error("\"" + k + "\" 의 " + f + " 가 비었습니다 — " +
          "칸을 열어 놓고 비우면 자리표시자입니다. 쓸 것이 없으면 그 칸을 **빼세요** (§6)");

      L.forEach((x, i) => {
        const at = "\"" + k + "\" 의 " + f + " " + (i + 1) + "번";
        let txt;
        if(f === "when"){
          if(typeof x !== "string" || !x.trim())
            throw new Error(at + " 이 비었습니다");
          txt = x;
        }else if(f === "faq"){
          if(!x || !x.q || !x.a) throw new Error(at + " 에 질문이나 답이 없습니다");
          /* ⚠️ 이 칸은 esc() 만 거쳐서 별표가 **글자로** 찍힙니다 */
          if(/\*\*/.test(x.q + x.a))
            throw new Error(at + " 에 별표(**)가 있습니다 — 이 칸은 mark() 를 안 거쳐서 " +
              "별표가 글자로 찍힙니다");
          txt = x.q + " " + x.a;
        }else{
          if(!x || !x.n || !x.d) throw new Error(at + " 에 이름이나 설명이 없습니다");
          txt = x.n + " " + x.d;
        }
        if(MONEY.test(txt))
          throw new Error(at + " 에 금액이나 요율이 있습니다 — " +
            (txt.match(MONEY) || [""])[0].trim() +
            "\n   → 지역 · 평수 · 업종에 따라 몇 배로 갈립니다. 적는 것은 " +
            "**무엇이 비용을 가르는가**까지입니다 (절대 규칙 1)");
        for(const q of SAY)
          if(q[0].test(txt))
            throw new Error(at + " 에 \"" + q[1] + "\" 가 있습니다 — " +
              "지킬 수 없는 약속이거나 재 본 적 없는 값입니다 (약관 제8조)");
      });
    }
  }
}

/* ══════════════════════════════════════════════════════════════════
   서비스 이용 절차 넷 (2026-10-11 최종 디자인 지시서 §7)
   ══════════════════════════════════════════════════════════════════
   ⚠️⚠️ 메인 05 구간과 **크롤러 본문**이 `js/data/steps.js` 한 곳을
   같이 읽습니다. 그 파일이 비거나 아이콘 이름이 틀리면 한쪽이 조용히
   빠지므로 빌드가 멈춥니다. */
function checkSteps(W){
  const L = W.AM_STEPS;
  if(!Array.isArray(L) || !L.length)
    throw new Error("js/data/steps.js 의 AM_STEPS 가 비었습니다 (§7)");
  /* ⚠️ 넷입니다. 늘리시려면 지시서를 먼저 고치고 check.js 도 같이 */
  /* ⚠️⚠️ **2026-10-16 §3-6 으로 다섯입니다** (전에는 넷).
     개수를 두 곳에 적지 않으려면 여기 하나만 고치세요 — 화면은
     `AM_STEPS` 를 세어서 그립니다. */
  if(L.length !== 5)
    throw new Error("이용 절차는 다섯입니다 — 지금 " + L.length + "개 " +
      "(§7. 늘리시려면 지시서와 check.js 를 같이 고치세요)");
  /* ⚠️ 지킬 수 없는 약속 — 약관 제8조가 "회신 시점을 보장하지 않습니다"
     라고 적고 있어 두 곳이 어긋나면 그때부터 채무입니다. */
  const SAY = [/보장/, /최저가/, /무조건/, /[0-9]\s*시간\s*(안|내)/,
               /당일\s*(연락|배정)/, /반드시\s*연결/];
  L.forEach((x, i) => {
    const at = "이용 절차 " + (i + 1) + "번";
    if(!x || !x.n || !x.d)
      throw new Error(at + " 에 이름이나 설명이 없습니다");
    if(!x.ic || !IC_NAMES.has(x.ic))
      throw new Error(at + " 의 아이콘 \"" + (x.ic || "") + "\" 를 " +
        "icon() 이 모릅니다 — 자리가 덩그러니 빕니다");
    for(const re of SAY)
      if(re.test(x.n + " " + x.d))
        throw new Error(at + " 에 지킬 수 없는 약속이 있습니다 — " + x.d);
  });
  /* ⚠️⚠️ ③ 의 제3자 제공 재동의 한 줄을 지우지 마세요 (제17조 제2항).
     방침 제4조 제3항 · AgreeBox() · amDealMove() 가 같은 말을 합니다. */
  if(!L.some(x => /동의/.test(x.d)))
    throw new Error("이용 절차에 연락처 전달 동의를 다시 받는다는 줄이 " +
      "없습니다 — 개인정보보호법 제17조 제2항 (방침 제4조 제3항과 같은 말)");
}

function checkOpsvc(W){
  const G = W.AM_OPSVC || [];
  if(!G.length) throw new Error("js/data/opsvc.js 의 AM_OPSVC 가 비었습니다 (§5-2)");
  if(G.length !== 6)
    throw new Error("운영 서비스 묶음이 " + G.length + "개입니다 — §5-2 는 여섯(A~F)입니다");

  const cats = new Map((W.AM_CATS || []).map(c => [c.key, c]));
  const inds = new Set((W.AM_INDUSTRIES || []).map(x => x.key));
  const keys = new Set(), tones = new Set(), nos = new Set();

  const oneBad = (it, where) => {
    if(!it || !it.cat) return where + " 에 분류가 빠진 칸이 있습니다";
    const c = cats.get(it.cat);
    if(!c) return where + " 가 없는 분류를 가리킵니다 — " + it.cat;
    const subs = new Set((c.items || []).map(x => x.key));
    if(!it.sub) return where + " 에 하위 서비스가 없습니다 — " + it.cat;
    if(!subs.has(it.sub))
      return where + " 가 없는 하위를 가리킵니다 — " + it.cat + " / " + it.sub;
    return "";
  };

  for(const g of G){
    if(!g.key || keys.has(g.key)) throw new Error("운영 묶음 key 가 비었거나 겹칩니다 — " + g.key);
    keys.add(g.key);
    if(!g.no || nos.has(g.no)) throw new Error("운영 묶음 번호가 비었거나 겹칩니다 — " + g.key);
    nos.add(g.no);
    if(!g.name || !g.lead) throw new Error("운영 묶음에 이름이나 한 줄이 없습니다 — " + g.key);
    /* ⚠️ 여섯이 같은 색이면 무엇이 무엇인지 흐려집니다 */
    if(g.tone){
      if(tones.has(g.tone)) throw new Error("운영 묶음 색이 겹칩니다 — " + g.key + " · " + g.tone);
      tones.add(g.tone);
    }
    /* ⚠️ 아이콘 이름이 틀리면 타일이 덩그러니 빕니다 (icon() 이 빈 문자열) */
    if(!g.icon || !IC_NAMES.has(g.icon))
      throw new Error("운영 묶음 아이콘이 없는 이름입니다 — " + g.key + " · " + g.icon);
    if(!(g.items || []).length) throw new Error("운영 묶음이 비었습니다 — " + g.key);
    for(const it of g.items){
      const bad = oneBad(it, "운영 묶음 " + g.key);
      if(bad) throw new Error(bad);
    }
  }

  /* §5-4 업종별 차례 — 업종 key 와 하위 key 를 둘 다 봅니다 */
  const BY = W.AM_OPSVC_BY_IND || {};
  for(const ind of Object.keys(BY)){
    if(!inds.has(ind))
      throw new Error("운영 업종별 차례가 없는 업종을 가리킵니다 — " + ind);
    for(const it of (BY[ind] || [])){
      const bad = oneBad(it, "운영 업종별 차례(" + ind + ")");
      if(bad) throw new Error(bad);
    }
  }
  console.log("   운영 서비스 묶음 6개 · 업종별 차례 " +
    Object.keys(BY).length + "개 업종이 실제 분류를 가리킵니다");
}

/* ══════════════════════════════════════════════════════════════════
   패키지 (§4-4 · §6-4)
   ══════════════════════════════════════════════════════════════════
   ⚠️⚠️ **금액 칸을 만들지 마세요** — 상품마다 조건으로 몇 배씩 갈리고,
   제휴사가 0곳이라 깎아 드릴 주체가 없습니다 (프랜차이즈 창업비와
   같은 까닭 · 절대 규칙 1).
   ⚠️⚠️ **"인기" 를 쓰지 마세요** — 신청 데이터를 모으지 않습니다. */
function checkPackages(W){
  const P = W.AM_PACKAGES || [];
  if(!P.length) throw new Error("js/data/packages.js 의 AM_PACKAGES 가 비었습니다");
  const offers = new Map((W.AM_OFFERS || []).map(o => [o.id, o]));
  const keys = new Set();
  const MONEY = ["price", "from", "cost", "amount", "discount", "sale"];
  for(const p of P){
    if(!p.key || keys.has(p.key)) throw new Error("패키지 key 가 비었거나 겹칩니다 — " + p.key);
    keys.add(p.key);
    if(!p.name || !p.lead) throw new Error("패키지에 이름이나 한 줄이 없습니다 — " + p.key);
    if(["start", "close", "both"].indexOf(p.side) < 0)
      throw new Error("패키지 side 가 start · close · both 가 아닙니다 — " + p.key);
    if(!p.icon || !IC_NAMES.has(p.icon))
      throw new Error("패키지 아이콘이 없는 이름입니다 — " + p.key + " · " + p.icon);
    for(const m of MONEY)
      if(p[m] != null) throw new Error("패키지에 금액 칸이 있습니다 — " + p.key + " · " + m);
    if((p.items || []).length < 2)
      throw new Error("패키지가 상품 둘 미만입니다 — " + p.key + " (묶을 것이 없습니다)");
    const seen = new Set();
    for(const id of p.items){
      if(!offers.has(id)) throw new Error("패키지가 없는 상품을 가리킵니다 — " + p.key + " / " + id);
      if(seen.has(id)) throw new Error("패키지 안에 같은 상품이 두 번 — " + p.key + " / " + id);
      seen.add(id);
    }
    const bad = (p.name + " " + p.lead + " " + (p.desc || ""))
      .match(/인기|추천|BEST|TOP|많이 찾는|할인|최저가/);
    if(bad) throw new Error("패키지 글에 쓰면 안 되는 말이 있습니다 — " + p.key + " · " + bad[0]);
  }
  console.log("   패키지 " + P.length + "개가 실제 상품만 가리킵니다");
}

function checkOffers(W){
  const L = W.AM_OFFERS || [];
  if(!L.length) throw new Error("수익상품이 하나도 없습니다 (§5)");

  const cats  = new Map((W.AM_CATS || []).map(c => [c.key, c]));
  const inds  = new Set((W.AM_INDUSTRIES || []).map(x => x.key));
  const regs  = new Set((W.AM_REGIONS || []).map(x => x.key));
  const fees  = new Set((W.AM_FEE_TYPE || []).map(x => x.key));
  const apply = new Set((W.AM_OFFER_APPLY || []).map(x => x.key));
  const cost  = new Set((W.AM_OFFER_COST || []).map(x => x.key));
  const stat  = new Set((W.AM_OFFER_STATUS || []).map(x => x.key));
  const routes = new Set(allRoutes(W));
  const seen = new Set();

  for(const x of L){
    const at = "수익상품 " + (x.id || "(id 없음)");
    if(!x.id || !x.name) throw new Error(at + " 에 id 나 이름이 없습니다");
    if(seen.has(x.id)) throw new Error("수익상품 id 가 겹칩니다 — " + x.id);
    seen.add(x.id);

    const c = cats.get(x.cat);
    if(!c) throw new Error(at + " 가 없는 분류를 가리킵니다 — " + x.cat);
    /* ⚠️⚠️ 하위 key 는 **그 분류의 items** 안에 있어야 합니다. 업체
       `subs` 에서 겪은 그 자리입니다 — 틀리면 에러 없이 조용히 안 걸립니다.
       ⚠️ `equip` 처럼 하위가 **업종에서 오는** 분류는 items 가 비어
       있어서, 그때는 sub 을 적지 않는 것이 맞습니다. */
    if(x.sub){
      const items = (c.items || []).map(i => i.key);
      if(!items.length)
        throw new Error(at + " 는 하위를 적을 수 없는 분류입니다 (하위가 업종에서 옵니다) — " + x.cat);
      if(items.indexOf(x.sub) < 0)
        throw new Error(at + " 의 하위 key 가 " + x.cat + " 에 없습니다 — " + x.sub +
          "\n   있는 것: " + items.join(" · "));
    }
    for(const k of (x.industries || []))
      if(!inds.has(k)) throw new Error(at + " 가 없는 업종을 가리킵니다 — " + k);
    for(const k of (x.regions || []))
      if(!regs.has(k)) throw new Error(at + " 가 없는 지역을 가리킵니다 — " + k);
    if(!apply.has(x.apply)) throw new Error(at + " 의 신청 유형이 없습니다 — " + x.apply);
    if(!cost.has(x.costWay)) throw new Error(at + " 의 비용 안내 방식이 없습니다 — " + x.costWay);
    if(!stat.has(x.status)) throw new Error(at + " 의 노출 상태가 없습니다 — " + x.status);
    /* ⚠️ 수익모델은 fee.js 의 key 라야 합니다 — 어긋나면 4차에서
       수수료를 계산할 수가 없습니다 */
    if(!fees.has(x.fee)) throw new Error(at + " 의 수익모델이 fee.js 에 없습니다 — " + x.fee);
    if(!x.feeNote) throw new Error(at + " 에 정산 기준이 없습니다 (§9)");
    /* ⚠️⚠️ `to` 는 **이미 있는 화면**이라야 합니다. 새 주소를 만들면
       같은 내용이 두 주소로 나갑니다 (§22) — 가짜 링크는 절대 규칙 5 입니다. */
    if(!x.to || !routes.has(String(x.to).split("?")[0]))
      throw new Error(at + " 가 없는 주소를 가리킵니다 — " + x.to);
    /* ⚠️ 금액을 적는 칸을 만들지 마세요 (프랜차이즈 창업비와 같은 까닭) */
    for(const k of ["price", "from", "cost", "amount"])
      if(x[k] != null)
        throw new Error(at + " 에 금액 칸(" + k + ")이 있습니다 — 금액은 적지 않습니다 (§5)");
  }

  /* ⚠️⚠️ **§5 를 기계로 지키는 줄입니다.** 업체가 없는 분야의 상품을
     "신청 받는 중" 으로 켜면, 손님이 다 적고 눌렀는데 배정할 곳이
     없습니다 — 받아 두고 못 하는 것이 절대 규칙 5 입니다. */
  const live = L.filter(x => x.status === "live");
  for(const x of live){
    const n = W.amProvidersInCat ? W.amProvidersInCat(x.cat) : 0;
    if(!n)
      throw new Error("수익상품 " + x.id + " 가 '신청 받는 중' 인데 " +
        x.cat + " 분야에 등록된 업체가 0곳입니다 — 손님이 다 적고 눌렀을 때 " +
        "배정할 곳이 없습니다 (§5 · 절대 규칙 5). 업체를 등록한 뒤 켜세요");
  }
}

/* ════════════════════════════════════════════════════════════════════
   checkReqForms — 서비스별 질문이 **조용히 사라지지 않는가** (§6)

   ⚠️⚠️ `api/quote.js` 의 `detail` 은 **스물까지**입니다. 공통 칸이
   여섯을 쓰므로 서비스별 칸은 **열넷**까지이고, 넘으면 뒤쪽이
   **에러 없이 접수에서 빠집니다** — `/sell` 의 매장 항목이 예전 상한
   12 에 닿아 있던 그 자리입니다.
   ════════════════════════════════════════════════════════════════════ */
function checkReqForms(W){
  const F = W.AM_REQ_FORMS || {};
  const cats = new Map((W.AM_CATS || []).map(c => [c.key, c]));
  const T = new Set(["text", "num", "date", "sel", "chk"]);
  /* 공통 칸 (js/pages/quote.js 의 detail)
     ⚠️⚠️ 2026-10-09 §4-4 로 **일곱**이 됐습니다 — 복수 상품을 묶어
     신청하실 때 "신청 상품" 한 줄이 같이 나갑니다. 그만큼
     서비스별 상한이 열넷 → **열셋**으로 줄었습니다.
     ⚠️ 넘으면 `api/quote.js` 가 뒤쪽 칸을 **에러 없이** 버립니다. */
  const COMMON = 7, MAX = 20;

  for(const k of Object.keys(F)){
    if(!cats.has(k))
      throw new Error("서비스별 질문이 없는 분류를 가리킵니다 — " + k);
    const L = F[k];
    if(!Array.isArray(L) || !L.length)
      throw new Error("서비스별 질문이 비어 있습니다 — " + k + " (빈 묶음은 지우세요)");
    if(COMMON + L.length > MAX)
      throw new Error("서비스별 질문이 너무 많습니다 — " + k + " 가 " + L.length +
        "칸입니다. 공통 " + COMMON + "칸과 합쳐 " + MAX + "칸을 넘으면 " +
        "api/quote.js 에서 **뒤쪽 칸이 조용히 사라집니다** (최대 " +
        (MAX - COMMON) + "칸)");
    const seen = new Set();
    for(const f of L){
      if(!f.k) throw new Error(k + " 에 딱지 없는 칸이 있습니다");
      /* ⚠️ 딱지가 그대로 `detail` 의 열쇠입니다 — 겹치면 하나가 덮습니다 */
      if(seen.has(f.k)) throw new Error(k + " 에 같은 딱지가 둘입니다 — " + f.k);
      seen.add(f.k);
      if(!T.has(f.t)) throw new Error(k + " · " + f.k + " 의 종류가 이상합니다 — " + f.t);
      if((f.t === "sel" || f.t === "chk") && !(f.opts || []).length)
        throw new Error(k + " · " + f.k + " 에 보기가 없습니다");
      /* ⚠️⚠️ 공통 칸과 **같은 것을 또 묻지 않습니다** — 같은 것을 두 번
         묻는 폼은 거기서 닫힙니다 */
      for(const dup of ["업종", "지역", "시군구", "평수", "예산", "면적"])
        if(String(f.k).replace(/\s/g, "") === dup)
          throw new Error(k + " 가 공통 칸(" + dup + ")을 또 묻습니다 (§6)");
      /* ⚠️ 금액을 묻지 마세요 — 예산은 공통 칸에 있습니다 */
      if(/금액|가격|비용|얼마/.test(f.k) && f.t === "num")
        throw new Error(k + " · " + f.k + " — 금액을 묻지 않습니다 (예산은 공통 칸입니다)");
    }
  }
}


/* ════════════════════════════════════════════════════════════════════
   checkClaimSql — **접수번호 글자가 서버와 DB 에서 같은가** (0005 · §10)

   접수번호를 만드는 쪽은 `api/_intake.js` 의 A32 이고, 받아서 찾는
   쪽은 `db/migrations/0005_account_claim.sql` 의 정규식입니다. 둘이
   어긋나면 **멀쩡한 번호를 "없는 번호" 로 거절합니다** — 손님은 자기
   번호를 잘못 적은 줄 알고 포기합니다.

   ⚠️ 글자를 하나 더하거나 빼실 때 **두 곳을 같이** 고쳐야 합니다.
   `deal.js` ↔ `deal_move` 표를 맞춰 보는 것과 같은 까닭입니다.
   ════════════════════════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════════════════════════
   checkQuoteSql — **견적 표가 화면과 같은 말을 하는가** (0008 · §4 · §6)

   ⚠️⚠️ 이 저장소가 **같은 규칙을 두 곳에 적어** 겪은 사고의 목록이
   깁니다 (업체 `subs` · 사진 키 · 도구 묶음 · `deal_move` · 접수번호
   글자 · `OK_ARG` 인자 이름). 견적도 그 자리입니다 — 상태 이름이
   어긋나면 딱지가 **빈 칸**이 되거나, 화면이 내는 값을 DB 가
   거절하는데 둘 다 **에러 없이** 일어납니다.

   그리고 이 표는 **돈이 적히는 표**라 둘을 더 봅니다 —
     ① RLS 가 켜져 있는가 (안 켜면 Supabase 가 그대로 열어 줍니다)
     ② 쓰기 권한(insert · update · delete)을 주지 않았는가
        (주면 기록 없이 지나가는 길이 하나 생깁니다 — §8)
   ════════════════════════════════════════════════════════════════════ */
function checkQuoteSql(W){
  const f = path.join(ROOT, "db", "migrations", "0008_quote.sql");
  if(!fs.existsSync(f))
    throw new Error("db/migrations/0008_quote.sql 이 없습니다 — " +
      "견적 상태를 맞춰 볼 데가 없습니다");
  const sql = fs.readFileSync(f, "utf8");

  /* ① 상태 넷 — check 제약의 값과 AM_QUOTE_ST 가 같아야 합니다.
     ⚠️ 주석을 먼저 걷어냅니다 — 규칙을 설명하는 주석에 걸려 멀쩡한
     코드를 실패로 잡은 적이 있습니다 (틀린 것은 검사였습니다). */
  const bare = sql.replace(/--[^\n]*/g, " ");
  const m = bare.match(/state\s+in\s*\(([^)]*)\)/i);
  if(!m)
    throw new Error("0008_quote.sql 에서 견적 상태 check 를 못 찾았습니다 — " +
      "찾는 꼴이 바뀌었는지 보세요");
  const db = (m[1].match(/'([a-z_]+)'/g) || []).map(x => x.slice(1, -1)).sort();
  const js = (W.AM_QUOTE_ST || []).map(x => x.key).slice().sort();
  if(db.length !== js.length || db.some((x, i) => x !== js[i]))
    throw new Error("견적 상태 — 화면과 DB 에서 다릅니다\n" +
      "   화면: " + js.join(" · ") + "\n   DB  : " + db.join(" · ") +
      "\n   → 한쪽만 고치면 딱지가 빈 칸이 되거나 DB 가 거절합니다 " +
      "(둘 다 에러 없이 일어납니다)");

  /* ② RLS — ⚠️⚠️ checkDealSql 의 표 훑기는 **0001 만** 읽습니다.
     새 표를 다른 판에 만들면 그 검사에 안 걸립니다 — 여기서 봅니다. */
  if(!/alter\s+table\s+quote\s+enable\s+row\s+level\s+security/i.test(bare))
    throw new Error("표 quote 에 RLS 가 안 켜져 있습니다 — " +
      "켜지 않으면 누구나 남의 견적 금액을 읽습니다 (§8 권한 분리)");

  /* ③ 쓰기 권한 — ⚠️⚠️ **문만 엽니다.** `grant insert`·`update`·`delete`
     가 있으면 기록 없이 견적을 바꾸는 길이 하나 생깁니다. */
  const w = bare.match(/grant\s+(insert|update|delete)[^;]*\bon\s+quote\b/i);
  if(w)
    throw new Error("quote 표에 쓰기 권한(" + w[1] + ")을 줬습니다 — " +
      "문(submit_quote · withdraw_quote · choose_quote)만 열어야 합니다. " +
      "표를 열면 감사 기록 없이 지나가는 길이 생깁니다 (§8)");

  /* ④ 금액을 안 적었을 때 **0원으로 넘기지 않는가** — 이 저장소가
     손익분기 85조원 · 권리금 25,000년에서 배운 자리입니다. 견적은
     화면이 아니라 **고객이 보고 돈을 내는 숫자**라 더 그렇습니다. */
  if(!/견적 금액을 적어 주세요/.test(sql))
    throw new Error("submit_quote 가 금액 없이 넘어갈 수 있습니다 — " +
      "0원을 적어 두지 않고 거절해야 합니다 (절대 규칙 5)");

  /* ⑤ 상태는 **move_state 로만** — ⚠️⚠️ `submit_quote` 가 `request` 의
     state 를 직접 쓰면 감사 기록이 한쪽에만 남습니다 (§8). 문이 하나인
     까닭이고, 이 저장소가 "겹겹이 막아 둔 것이 검사를 속인다" 로
     겪은 자리라 **글자로** 봅니다. */
  if(/update\s+request\s+set[^;]*\bstate\b/i.test(bare))
    throw new Error("0008 이 request.state 를 직접 씁니다 — " +
      "상태의 문은 move_state() 하나입니다 (§8 기록). " +
      "perform move_state(…) 로 부르세요");
}


function checkClaimSql(){
  const intake = path.join(ROOT, "api", "_intake.js");
  const claim  = path.join(ROOT, "db", "migrations", "0005_account_claim.sql");
  if(!fs.existsSync(claim)) return;          /* 아직 안 만드셨으면 넘어갑니다 */
  const a32m = fs.readFileSync(intake, "utf8").match(/A32\s*=\s*"([^"]+)"/);
  if(!a32m) throw new Error("api/_intake.js 에서 A32 를 못 찾았습니다 — 접수번호 글자를 맞춰 볼 데가 없습니다");
  const A32 = a32m[1];

  const sql = fs.readFileSync(claim, "utf8");
  const clm = sql.match(/\^SW(\[[^\]]+\])\{8\}\$/);
  if(!clm) throw new Error("0005_account_claim.sql 에서 접수번호 정규식을 못 찾았습니다");
  const cls = new RegExp("^" + clm[1] + "$");

  const missing = A32.split("").filter(c => !cls.test(c));
  if(missing.length)
    throw new Error("접수번호 글자 — 서버는 쓰는데 DB 가 안 받습니다: " + missing.join(" ") +
      "\n   api/_intake.js 의 A32 와 0005_account_claim.sql 의 정규식을 같이 고치세요" +
      "\n   → 그대로 두면 멀쩡한 번호를 \"없는 번호\" 로 거절합니다");

  /* ⚠️⚠️ 반대도 봅니다 — 전화로 읽어 주는 번호라 I·L·O·U 를 일부러
     뺐습니다. DB 가 그것을 받아 주면 0/O 를 헷갈려 적은 번호가 **남의
     번호에 맞을** 수 있습니다. */
  const extra = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("")
    .filter(c => cls.test(c) && A32.indexOf(c) < 0);
  if(extra.length)
    throw new Error("접수번호 글자 — DB 가 더 받아 줍니다: " + extra.join(" ") +
      "\n   전화로 읽어 주는 번호라 I·L·O·U 를 뺐습니다 (0/O · 1/I/L 혼동)" +
      "\n   → 더 받아 주면 헷갈려 적은 번호가 남의 번호에 맞을 수 있습니다");
}


/* ════════════════════════════════════════════════════════════════════
   checkRpcArgs — **api/deal.js 의 인자 이름이 SQL 의 함수와 같은가**

   ⚠️⚠️ 이 검사가 생긴 까닭 — `OK_ARG` 를 눈대중으로 적어 두었습니다
   (`p_amount` · `p_paid_at` · `p_delta` · `p_reason`). 실제 함수는
   `p_fee` · `p_vat` · `p_total` · `p_snap` · `p_new_fee` 입니다.
   그대로 두면 수수료 확정이 **인자 없이** 불려서 거절당하고, 화면은
   "처리하지 못했습니다" 만 냅니다 — 에러도 안 나고 빌드도 통과합니다.
   업체 `subs` · 사진 키 · 도구 묶음 · `deal_move` 표에서 겪은 그
   자리입니다.
   ════════════════════════════════════════════════════════════════════ */
function checkRpcArgs(){
  const dealApi = path.join(ROOT, "api", "deal.js");
  if(!fs.existsSync(dealApi)) return;
  const src = fs.readFileSync(dealApi, "utf8");

  function listOf(name){
    const m = src.match(new RegExp("const\\s+" + name + "\\s*=\\s*\\{([\\s\\S]*?)\\n\\};"));
    if(!m) throw new Error("api/deal.js 에서 " + name + " 을 못 찾았습니다");
    /* ⚠️ 주석을 먼저 걷어냅니다 — 규칙을 설명하는 주석에 걸려 멀쩡한
       코드를 실패로 잡은 적이 있습니다 (틀린 것은 검사였습니다) */
    const body = m[1].replace(/\/\*[\s\S]*?\*\//g, " ");
    return (body.match(/([A-Za-z_][A-Za-z0-9_]*)\s*:\s*1/g) || [])
      .map(x => x.split(":")[0].trim());
  }
  const fns  = listOf("OK_FN");
  const args = listOf("OK_ARG");

  /* SQL 쪽 — 마이그레이션 전부에서 함수 정의를 모읍니다 */
  const dir = path.join(ROOT, "db", "migrations");
  if(!fs.existsSync(dir)) return;
  const sql = fs.readdirSync(dir).filter(f => /\.sql$/.test(f) && !/_down\./.test(f))
    .sort().map(f => fs.readFileSync(path.join(dir, f), "utf8")).join("\n");

  const want = {};
  fns.forEach(function(f){
    const m = sql.match(new RegExp(
      "create\\s+or\\s+replace\\s+function\\s+" + f + "\\s*\\(([\\s\\S]*?)\\)\\s*returns", "i"));
    if(!m)
      throw new Error("api/deal.js 가 허용한 " + f + " 가 db/migrations 에 없습니다\n" +
        "   → 화면이 부르는데 DB 에 없으면 손님에게 \"처리하지 못했습니다\" 만 나갑니다");
    /* 인자 이름만 (기본값 · 형은 버립니다) */
    m[1].replace(/\/\*[\s\S]*?\*\//g, " ").split(",").forEach(function(part){
      const n = part.trim().match(/^(p_[a-z0-9_]+)\b/);
      if(n) want[n[1]] = f;
    });
  });

  const missing = Object.keys(want).filter(k => args.indexOf(k) < 0);
  if(missing.length)
    throw new Error("api/deal.js 의 OK_ARG 에 빠진 인자가 있습니다: " +
      missing.map(k => k + "(" + want[k] + ")").join(" · ") +
      "\n   → 빠진 인자는 **조용히 안 넘어갑니다.** 함수가 인자 없이 불려 거절당하고," +
      "\n     화면에는 \"처리하지 못했습니다\" 만 나갑니다 (에러도 안 납니다)");

  const extra = args.filter(k => !want[k]);
  if(extra.length)
    throw new Error("api/deal.js 의 OK_ARG 에 **없는 함수의 인자**가 있습니다: " + extra.join(" · ") +
      "\n   → 쓰지 않는 이름을 열어 두면, 나중에 같은 이름의 칸이 생길 때 그대로 넘어갑니다" +
      "\n     (변경자는 토큰에서만 와야 합니다 — p_by 를 열어 두면 남의 이름으로 기록이 남습니다)");
}


/* ════════════════════════════════════════════════════════════════════
   checkIndGroups — **업종 대분류가 업종 열넷을 빠짐없이 나눠 가지는가**
                    (2026-10-09 지시서 PART 3)

   `lifecycle.js`(단계 여섯 ↔ 분류 25) · `sales.js`(영업 카테고리 열넷
   ↔ 분류 25)와 **같은 검사**입니다. 한 업종이 두 대분류에 들어가거나
   어느 대분류에도 없으면, 화면에서는 **조용히 빠집니다** — 그 업종
   사장님에게는 자기 자리가 아예 없는 것이 됩니다.

   세부 업종도 같이 봅니다 —
   ⚠️⚠️ **짧은 줄(`lead`)에 적은 말이 세부 목록에 없으면** 화면에는
   보이는데 검색에서는 안 나옵니다. 실제로 `반려동물` 의 `미용` ·
   `호텔` · `유치원` 셋이 그랬고, 그 셋은 이 사이트에서 **미용 · 헤어** ·
   **숙박** · **학원**을 뜻하는 말이라 검색이 엉뚱한 데로 보낼
   자리였습니다.
   ════════════════════════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════════════════════════
   내려온 구간을 **살아 있는 쪽이 부르지 않는가** (3차 · §9 의 11)

   `js/pages/home-retired.js` 는 `index.html` 에 **안 실립니다** —
   메인에서 내려온 구간 서른일곱 덩이(75KB 원본 · 23KB gzip)가 161개
   화면 전부에 실리고 있어서 떼어 둔 것입니다.

   ⚠️⚠️ **살아 있는 쪽이 거기 것을 부르면 그 순간 화면이 깨집니다** —
   안 실리는 파일이라 `is not defined` 이고, 빌드도 전수 점검도
   "메인은 멀쩡" 으로 통과할 수 있습니다 (그 구간을 되살릴 때만
   불리는 길이면 평소에는 안 터집니다). 그래서 **글자로** 봅니다.
   ⚠️ 거꾸로(내려온 쪽이 살아 있는 쪽을 부르는 것)는 정상입니다.
   ════════════════════════════════════════════════════════════════════ */
function checkRetired(){
  const ret = path.join(ROOT, "js", "pages", "home-retired.js");
  if(!fs.existsSync(ret)) return;          /* 되살려서 합치셨으면 넘어갑니다 */

  /* ⚠️ 주석을 먼저 걷어냅니다 — 이 저장소가 "검사가 자기 설명 주석에
     걸려 멀쩡한 코드를 실패로 잡았다" 로 겪은 자리입니다. */
  const bare = s => s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");

  const src   = bare(fs.readFileSync(ret, "utf8"));
  const names = [];
  const re = /(?:^|\n)(?:function ([A-Za-z0-9_]+)\(|(?:var|const|let) ([A-Za-z0-9_]+)\s*=)/g;
  let m; while((m = re.exec(src))) names.push(m[1] || m[2]);
  if(!names.length) throw new Error("home-retired.js 에서 덩이를 하나도 못 찾았습니다 — 검사가 틀렸습니다");

  /* `index.html` 이 싣는 것만 봅니다 — 안 싣는 파일끼리는 서로 불러도 됩니다 */
  const tplSrc = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const shipped = (tplSrc.match(/src="\/(js\/[^"?]+)/g) || [])
    .map(x => x.slice(6)).filter(f => f !== "js/pages/home-retired.js");

  const bad = [];
  shipped.forEach(function(f){
    const full = path.join(ROOT, f);
    if(!fs.existsSync(full)) return;
    const t = bare(fs.readFileSync(full, "utf8"));
    names.forEach(function(n){
      if(new RegExp("\\b" + n + "\\b").test(t)) bad.push(f + " → " + n);
    });
  });
  if(bad.length)
    throw new Error("손님이 받는 코드가 **안 실리는** home-retired.js 의 것을 "+
      "부릅니다 — 그대로 두면 화면이 is not defined 로 깨집니다:\n  " +
      bad.join("\n  "));

  /* ⚠️ 싣고 있으면 떼어 둔 뜻이 없어집니다 — 되살리셨다면 일부러인지 알려만 줍니다 */
  if(/home-retired\.js/.test(tplSrc))
    console.log("   ⚠️ home-retired.js 를 index.html 이 싣고 있습니다 — "+
      "되살리신 것이면 맞습니다 (받는 양이 23KB gzip 늘어납니다)");
  else
    console.log("   내려온 구간 " + names.length + "덩이가 손님에게 안 나갑니다");
}

/* ════════════════════════════════════════════════════════════════════
   checkMigDocs() — 돌려야 하는 마이그레이션이 **세 곳에서 같은가**

   ⚠️⚠️ **이 검사가 생긴 까닭 — db/README.md 가 낡아 있었습니다.**
   0006 · 0007 을 만들고 README 의 "세우는 차례" 를 안 고쳐서, 목록이
   0005 까지였고 확인 질의도 "판 번호가 5 까지" · "상태값이 열둘" 이었습니다.
   그 문서를 그대로 따라 돌리시면 **0007 이 빠집니다** — 0003 이 만든
   수수료 확정 문이 고칠 `deal` 줄을 만드는 길이 바로 0007 이라, 상태는
   "계약 완료" 인데 확정할 대상이 없습니다. 에러도 안 나고 빌드도
   통과했습니다. 세우는 것은 **사장님이 손으로** 하시는 일이라 이 문서가
   유일한 길잡이입니다.

   ⚠️ 보는 것은 셋입니다 — 파일 · README 목록 · test-sql.js 의 MIGS.
   같은 목록을 세 곳에 적는 꼴이라, 이 저장소가 amCatTo/catTo ·
   deal.js↔deal_move 로 겪은 그 자리입니다.
   ════════════════════════════════════════════════════════════════════ */
function checkMigDocs(W){
  const dir = path.join(ROOT, "db", "migrations");
  if(!fs.existsSync(dir)) return;

  /* _down 은 되돌리기용이라 돌리는 목록이 아닙니다 */
  const migs = fs.readdirSync(dir)
    .filter(f => /^[0-9]{4}_.+\.sql$/.test(f) && !/_down\.sql$/.test(f)).sort();
  if(!migs.length) throw new Error("db/migrations 에 마이그레이션이 없습니다 — 검사가 틀렸습니다");

  const rd = path.join(ROOT, "db", "README.md");
  if(!fs.existsSync(rd)) throw new Error("db/README.md 가 없습니다 — 세우는 차례가 사라졌습니다");
  const doc = fs.readFileSync(rd, "utf8");

  const ts = path.join(ROOT, "tools", "test-sql.js");
  const tsq = fs.existsSync(ts) ? fs.readFileSync(ts, "utf8") : "";

  const bad = [];
  migs.forEach(function(f){
    if(doc.indexOf(f) < 0)
      bad.push(f + " → db/README.md 의 세우는 차례에 없습니다 (사장님이 그 문서만 보고 돌리십니다)");
    if(tsq && tsq.indexOf(f) < 0)
      bad.push(f + " → tools/test-sql.js 의 MIGS 에 없습니다 (실제 Postgres 로 한 번도 안 돌려 봤습니다)");
  });

  /* ⚠️ 판 번호는 **파일이 스스로 적는 값**을 읽습니다 — 세어서 짐작하지 않습니다 */
  let top = 0;
  migs.forEach(function(f){
    const m = fs.readFileSync(path.join(dir, f), "utf8")
      .match(/insert\s+into\s+schema_version[\s\S]{0,200}?values\s*\(\s*([0-9]+)/i);
    if(m) top = Math.max(top, Number(m[1]));
  });
  if(top && doc.indexOf("**" + top + "까지**") < 0)
    bad.push("db/README.md 의 확인 질의 \u2460 가 '판 번호가 **" + top + "까지**' 가 아닙니다 " +
      "— 돌리고도 빠진 것을 못 알아차립니다");

  /* ⚠️ 상태 수는 deal.js 에서 셉니다 (checkDealSql 이 SQL 과 맞춰 둔 값) */
  const n = (W.AM_DEAL_ST || []).length;
  const KO = {12:"열둘", 13:"열셋", 14:"열넷", 15:"열다섯"};
  if(n && KO[n] && doc.indexOf("**" + KO[n] + "**") < 0)
    bad.push("db/README.md 의 확인 질의 \u2462 가 '상태값이 **" + KO[n] + "**' 가 아닙니다 " +
      "— deal.js 는 " + n + "개입니다");

  if(bad.length)
    throw new Error("세우는 차례(db/README.md)가 실제 마이그레이션과 어긋납니다:\n  " +
      bad.join("\n  ") + "\n   → 세우는 것은 사장님이 손으로 하시는 일이라 그 문서가 유일한 길잡이입니다");

  /* ⚠️⚠️ db/verify.sql 의 기대값도 같이 봅니다 — 사장님이 돌린 DB 가
     저장소와 같은지 재는 유일한 길이고, 기대값이 낡으면 **멀쩡한 DB 를
     "고쳐야 합니다" 로** 잡거나 **깨진 DB 를 통과**시킵니다.

     ⚠️ 처음에 정규식으로 `'7' want` 를 찾다가 파일의 **공백이 둘**이라
     멀쩡한 파일을 실패로 잡았습니다 (검사가 틀린 자리). 지금은 그
     묶음(`from v_xxx`)이 적힌 **줄**에 그 숫자가 있는지만 봅니다. */
  const vf = path.join(ROOT, "db", "verify.sql");
  /* ⚠️⚠️ 없으면 **멈춥니다.** 처음에 "있으면 본다" 로 적었다가
     파일을 지워 보니 조용히 통과했습니다 — README 가 "이것을 붙여
     넣으세요" 라고 가리키고 있는데 파일이 없으면 그게 깨진 안내입니다. */
  if(doc.indexOf("verify.sql") >= 0 && !fs.existsSync(vf))
    throw new Error("db/README.md 가 db/verify.sql 을 가리키는데 그 파일이 없습니다 — "+
      "사장님이 돌린 DB 를 확인할 길이 사라집니다");
  if(fs.existsSync(vf)){
    const vs  = fs.readFileSync(vf, "utf8");
    const nSt = (W.AM_DEAL_ST || []).length;
    let nMv = 0; (W.AM_DEAL_MOVE || []).forEach(m => { nMv += (m[2] || []).length; });
    const vbad = [];
    const rowWant = src => {              /* 'from v_xxx' 가 있는 줄의 기대값 */
      /* ⚠️ "select 가 같은 줄에 있는지" 로 걸렀다가 틀렸습니다 — 딱지를
         여러 줄로 쓰는 행이 있어서 기대값과 select 가 다른 줄입니다. */
      const line = vs.split("\n").filter(l => l.indexOf("from " + src) >= 0)[0];
      if(!line) return null;
      const m = line.match(/'([0-9]+)'[^']*$/);
      return m ? Number(m[1]) : null;
    };
    const want = (label, src, n) => {
      if(!n) return;
      const got = rowWant(src);
      if(got === null) vbad.push("db/verify.sql 에 " + src + " 줄이 없습니다 (" + label + ")");
      else if(got !== n) vbad.push("db/verify.sql " + label + " 기대값이 " + got + "입니다 — " + n + "이라야 합니다");
    };
    want("\u2460 판 번호", "v_ver",  top);
    want("\u2463 상태",    "v_st",   nSt);
    want("\u2465 길",      "v_move", nMv);

    /* ⚠️⚠️ **목록과 기대값이 같은지 봅니다** (2026-10-18).
       `v_tab` 이 표 **열둘**을 세면서 기대값만 13 이었습니다 — 0009 로
       `request_item` 이 늘었는데 목록에 안 넣고 숫자만 올려서,
       **제대로 돌린 DB 가 12/13 ❌** 로 나왔습니다. 멀쩡한 DB 를
       "고쳐야 합니다" 로 잡는 쪽이라, 사장님이 돌린 DB 를 재는 유일한
       길에서 제일 나쁜 종류입니다. 세는 쪽과 기대하는 쪽이 **같은
       파일 안**에 있으니 여기서 맞춰 봅니다. */
    const blockOf = (name, end) => {
      const i = vs.indexOf(name + " as (");
      if(i < 0) return "";
      const j = vs.indexOf(end, i);
      return j < 0 ? "" : vs.slice(i, j);
    };
    const selfWant = (label, src, end, re) => {
      const blk = blockOf(src, end);
      if(!blk) return;
      /* 주석을 먼저 걷어냅니다 — 규칙을 설명하는 글에 걸려 멀쩡한
         파일을 실패로 잡은 적이 있습니다 (검사가 틀린 자리) */
      const n = (blk.replace(/\/\*[\s\S]*?\*\//g, " ").match(re) || []).length;
      const got = rowWant(src);
      if(!n) return;
      if(got !== n)
        vbad.push("db/verify.sql " + label + " 가 " + n + "개를 세면서 기대값은 " +
          got + "입니다 — 세는 목록과 기대값이 어긋나면 **멀쩡한 DB 를 ❌ 로** 잡습니다");
    };
    /* 표 — `table_name in ('a','b',…)` 안의 이름만 셉니다 */
    (() => {
      const blk = blockOf("v_tab", "\n),");
      if(!blk) return;
      const m = blk.match(/table_name\s+in\s*\(([\s\S]*?)\)/);
      if(!m) return;
      const n = (m[1].match(/'[a-z_]+'/g) || []).length;
      const got = rowWant("v_tab");
      if(n && got !== n)
        vbad.push("db/verify.sql \u2461 표 가 " + n + "개를 세면서 기대값은 " + got +
          "입니다 — 0009 의 request_item 이 그렇게 빠져 있었습니다");
    })();
    /* 문(함수) — `('name')` 꼴만 셉니다 */
    selfWant("\u2466 문(함수)", "v_fn", ") w(f)", /\('[a-z_]+'\)/g);
    /* ⚠️ 있는 것을 세야 합니다 — 기대 목록을 세면 전부 없어도 통과합니다
       (실제로 그렇게 적었다가 되돌려 보고 알았습니다). */
    if(/v_fn as \(\s*select count\(\*\)::int n/.test(vs))
      vbad.push("db/verify.sql \u2466 이 기대 목록을 세고 있습니다 — "+
        "함수가 전부 없어도 통과합니다 (count(*) filter (where exists …) 로)");
    if(vbad.length)
      throw new Error("세우고 확인하는 검사(db/verify.sql)가 저장소와 어긋납니다:\n  " +
        vbad.join("\n  "));
    if(doc.indexOf("verify.sql") < 0)
      console.log("   \u26a0\ufe0f db/README.md 가 verify.sql 을 가리키지 않습니다");
  }

  console.log("   마이그레이션 " + migs.length + "개가 README \u00b7 test-sql \u00b7 verify 와 같습니다 (판 " + top + ")");
}

function checkIndGroups(W){
  const G = W.AM_IND_GROUPS || [], S = W.AM_IND_SUBS || {};
  const inds = (W.AM_INDUSTRIES || []).map(i => i.key);
  if(!G.length) throw new Error("js/data/indgroups.js 의 AM_IND_GROUPS 가 비었습니다");

  const used = [];
  G.forEach(function(g){
    if(!g.key || !g.name) throw new Error("업종 대분류에 key 나 이름이 없습니다");
    if(!(g.inds || []).length)
      throw new Error("업종 대분류 '" + g.name + "' 에 업종이 하나도 없습니다\n" +
        "   → 빈 대분류는 자리표시자입니다 (절대 규칙 2). 받을 업종이 실제로 있을 때만 만드세요");
    (g.inds || []).forEach(k => used.push(k));
  });

  const missing = inds.filter(k => used.indexOf(k) < 0);
  if(missing.length)
    throw new Error("업종 대분류에 안 들어간 업종이 있습니다: " + missing.join(" · ") +
      "\n   → 그 업종 사장님에게는 화면에서 자기 자리가 조용히 사라집니다");

  const dup = used.filter((k, i) => used.indexOf(k) !== i);
  if(dup.length)
    throw new Error("업종이 두 대분류에 들어 있습니다: " + dup.join(" · ") +
      "\n   → 한 업종을 두 곳에 넣고 싶어지면, 그건 그 업종을 쪼갤 때입니다");

  const ghost = used.filter(k => inds.indexOf(k) < 0);
  if(ghost.length)
    throw new Error("없는 업종 key 를 가리킵니다: " + ghost.join(" · ") +
      "\n   → js/data/industries.js 의 key 와 맞추세요");

  /* 세부 업종 — 업종마다 있어야 합니다 */
  const noSub = inds.filter(k => !(S[k] || []).length);
  if(noSub.length)
    throw new Error("세부 업종이 비어 있는 업종이 있습니다: " + noSub.join(" · ") +
      "\n   → 검색이 그 업종을 자기 이름으로만 찾습니다 (사장님이 쓰는 말로는 0건)");

  /* ⚠️ 짧은 줄의 말이 세부 목록에 **반드시** 들어 있어야 합니다 */
  const drift = [];
  (W.AM_INDUSTRIES || []).forEach(function(i){
    if(i.key === "etc") return;          /* 기타는 짧은 줄이 안내문입니다 */
    String(i.lead || "").split("·").map(x => x.trim()).filter(Boolean).forEach(function(w){
      if((S[i.key] || []).indexOf(w) < 0) drift.push(i.key + " → " + w);
    });
  });
  if(drift.length)
    throw new Error("짧은 줄(lead)에 있는데 세부 업종에 없는 말: " + drift.join(" · ") +
      "\n   → 화면에는 보이는데 **검색에서는 0건**이 됩니다. 둘을 같이 고치세요");
}

/* ── 실행 ─────────────────────────────────────────────────────── */
checkCssVars();
checkColorSchemeCss();
checkVercel();
const W = loadApp();
checkIndGroups(W);

/* ⚠️⚠️ **창업 진단의 걸음 번호가 로드맵과 맞는가** (2026-10-09 PART 4)
   `AM_START_STAGE` 의 `at` 은 **그 로드맵에서 몇 번째 걸음인가**(1부터)
   입니다. 걸음이 늘거나 줄면 어긋나는데 **에러도 안 나고 화면도
   멀쩡합니다** — 엉뚱한 걸음부터 "지금부터 할 일" 이라고 말할 뿐입니다.
   그래서 빌드가 매번 두 로드맵에 그 걸음이 실제로 있는지 봅니다. */
function checkStartAsk(W){
  const S = W.AM_START_STAGE || [];
  if(!S.length) throw new Error("js/data/journey.js 의 AM_START_STAGE 가 비었습니다");
  const seen = {};
  S.forEach(function(x){
    if(!x.k || !x.n) throw new Error("창업 진단 단계에 key 나 이름이 없습니다");
    if(seen[x.k]) throw new Error("창업 진단 단계 key 가 겹칩니다 — " + x.k);
    seen[x.k] = 1;
    ["startup", "acq-in"].forEach(function(rk){
      const L = (W.AM_PROCESS || {})[rk] || [];
      const at = (x.at || {})[rk];
      if(!at) throw new Error("창업 진단 '" + x.n + "' 에 " + rk + " 걸음 번호가 없습니다");
      if(!(at >= 1 && at <= L.length))
        throw new Error("창업 진단 '" + x.n + "' 의 " + rk + " 걸음 번호가 " + at +
          " 인데 그 로드맵은 " + L.length + "걸음입니다\n" +
          "   → 로드맵을 고치셨으면 AM_START_STAGE 의 at 도 같이 고치세요");
    });
  });
  ["AM_START_BUD", "AM_START_WHEN"].forEach(function(n){
    const L = W[n] || [];
    if(!L.length) throw new Error("js/data/journey.js 의 " + n + " 가 비었습니다");
    L.forEach(function(x){
      if(!x.k || !x.n) throw new Error(n + " 에 key 나 이름이 없습니다");
      /* ⚠️ 금액 구간은 사장님이 **스스로 고르시는 범위**입니다 — 저희가
         재 본 값처럼 "평균" · "보통" 이라고 적지 마세요 (절대 규칙 1). */
      if(/평균|보통|대부분/.test(x.n))
        throw new Error(n + " 에 재 본 적 없는 말이 있습니다 — " + x.n);
    });
  });
  console.log("   창업 진단 단계 " + S.length + "개가 두 로드맵과 맞습니다");
}
checkStartAsk(W);
checkProcess(W);
checkSales(W);
checkDeal(W);
checkFee(W);
checkDealSql(W);
checkClaimSql();
checkQuoteSql(W);
checkRpcArgs();
checkRetired();

/* ════════════════════════════════════════════════════════════════════
   checkHallFrame() — **전문관 넷의 공통 검사가 글자까지 같은가**
                      (2026-10-18 전체 점검 §3)

   ⚠️⚠️ `check.js` 의 "전문관 공통 여덟" 은 **넷을 글자로 적어 둡니다.**
   반복문으로 이름을 만들면 `tools/prove-checks.js` 가 검사를
   `await f("이름", "주소", 백틱)` 글자로 찾기 때문에 **못 찾고**,
   그러면 검사는 도는데 **되돌려 보는 쪽이 닿지 못해** "통과만 하고
   아무것도 안 잡는 검사" 와 같아집니다 (실제로 그렇게 적었다가
   ship 이 막았습니다).

   ⚠️⚠️ 글자로 넷을 적으면 이번에는 **한쪽만 고치는** 사고가 납니다 —
   이 저장소가 `amCatTo`/`catTo` · 랜딩 아이콘 표 · `deal.js`↔`deal_move`
   로 여러 번 겪은 자리입니다. 그래서 넷의 본문이 **첫 줄(WANT_SIDE)을
   빼고 글자까지 같은지** 빌드가 셉니다. */
function checkHallFrame(){
  const src = fs.readFileSync("check.js", "utf8");
  const got = [];
  const re = /await f\("전문관 공통 여덟 — ([^"]+)", "([^"]*)", `([\s\S]*?)`\);/g;
  let m;
  while((m = re.exec(src))) got.push({ name:m[1], url:m[2], body:m[3] });

  if(got.length !== 4)
    die("전문관 공통 검사가 넷이 아닙니다 — " + got.length +
        "개 (check.js · 반복문으로 만들면 prove-checks 가 못 찾습니다)");

  const want = ["/startup", "/operation", "/transfer", "/closure"];
  want.forEach(function(u){
    if(!got.some(function(g){ return g.url === u; }))
      die("전문관 공통 검사에 " + u + " 가 빠졌습니다 (check.js)");
  });

  /* 첫 줄이 WANT_SIDE 하나이고, 그 아래가 넷 다 같은가 */
  const sides = {};
  const rest = got.map(function(g){
    const L = g.body.replace(/^\n/, "").split("\n");
    const first = L[0].trim();
    const sm = first.match(/^const WANT_SIDE = "([a-z]+)";$/);
    if(!sm) die("전문관 공통 검사 " + g.url + " 의 첫 줄이 WANT_SIDE 가 아닙니다 — " + first);
    if(sides[sm[1]]) die("전문관 공통 검사에 같은 쪽이 둘입니다 — " + sm[1]);
    sides[sm[1]] = 1;
    if(g.url !== g.name) die("전문관 공통 검사의 이름과 주소가 다릅니다 — " + g.name + " / " + g.url);
    return L.slice(1).join("\n");
  });
  /* ⚠️ 화면이 받는 값 넷과 같아야 합니다 (0001 — start | ops | transfer | close) */
  ["start", "ops", "transfer", "close"].forEach(function(k){
    if(!sides[k]) die("전문관 공통 검사에 쪽 " + k + " 가 빠졌습니다");
  });
  rest.forEach(function(b, i){
    if(b !== rest[0])
      die("전문관 공통 검사 " + got[i].url + " 의 본문이 " + got[0].url +
          " 과 다릅니다 — 넷은 WANT_SIDE 말고는 글자까지 같아야 합니다");
  });
  console.log("   전문관 공통 검사 4개가 글자까지 같습니다 (" +
    Object.keys(sides).join(" · ") + ")");
}
checkHallFrame();
/* ════════════════════════════════════════════════════════════════════
   checkPhotoSql() — **받는 형식과 크기가 서버와 DB 에서 같은가**
                     (2026-10-18 §7-3 · §15)

   ⚠️⚠️ 한쪽만 고치면 **에러 없이 조용히** 어긋납니다 — 서버가 받아
   놓고 DB 가 거절하면 손님에게는 "지금 올리지 못했습니다" 만 나가고,
   거꾸로면 DB 가 받아 버립니다. 이 저장소가 접수번호 글자(`A32` ↔
   0005 의 정규식) · 상태 key(`deal.js` ↔ enum) · RPC 인자 이름으로
   **세 번** 겪은 자리입니다.
   ════════════════════════════════════════════════════════════════════ */
function checkPhotoSql(){
  const api = path.join(ROOT, "api", "upload.js");
  const sql = path.join(ROOT, "db", "migrations", "0011_request_photo.sql");
  if(!fs.existsSync(api) || !fs.existsSync(sql)) return;
  /* ⚠️ 주석을 먼저 걷어냅니다 — 규칙을 설명하는 글에 걸려 멀쩡한
     코드를 실패로 잡은 적이 있습니다 (틀린 것은 검사였습니다) */
  const js = fs.readFileSync(api, "utf8").replace(/\/\*[\s\S]*?\*\//g, " ");
  const sq = fs.readFileSync(sql, "utf8").replace(/^\s*--.*$/gm, " ");

  const jsMime = (js.match(/const\s+OK_MIME\s*=\s*\[([^\]]*)\]/) || [])[1] || "";
  const api1 = (jsMime.match(/'[^']+'|"[^"]+"/g) || []).map(x => x.slice(1, -1)).sort();
  const sqMime = (sq.match(/constraint\s+photo_mime_ok[\s\S]*?\(([\s\S]*?)\)\s*,/) || [])[1] || "";
  const db1 = (sqMime.match(/'[^']+'/g) || []).map(x => x.slice(1, -1)).sort();
  if(!api1.length || !db1.length)
    throw new Error("사진 형식 목록을 못 읽었습니다 — 검사가 틀렸습니다 " +
      "(api/upload.js 의 OK_MIME · 0011 의 photo_mime_ok)");
  if(api1.join("|") !== db1.join("|"))
    throw new Error("받는 사진 형식이 서버와 DB 에서 다릅니다:\n" +
      "   api/upload.js → " + api1.join(" · ") + "\n" +
      "   0011 (DB)     → " + db1.join(" · ") +
      "\n   → 한쪽만 고치면 **에러 없이 조용히** 어긋납니다 (서버가 받고 DB 가 거절)");

  const jsMax = Number((js.match(/MAX_BYTES\s*=\s*([0-9]+)/) || [])[1] || 0);
  const dbMax = Number((sq.match(/bytes\s*<=\s*([0-9]+)/) || [])[1] || 0);
  if(!jsMax || !dbMax) throw new Error("사진 크기 상한을 못 읽었습니다 — 검사가 틀렸습니다");
  if(jsMax !== dbMax)
    throw new Error("사진 크기 상한이 서버(" + jsMax + ")와 DB(" + dbMax + ")에서 다릅니다");
  /* ⚠️⚠️ 함수 안의 상한도 같아야 합니다 — CHECK 만 맞춰 두고 함수에서
     다른 수를 쓰면, 거절하는 **말**이 틀린 수를 적습니다. */
  const fnMax = (sq.match(/p_bytes\s*>\s*([0-9]+)/) || [])[1];
  if(fnMax && Number(fnMax) !== dbMax)
    throw new Error("0011 의 함수 상한(" + fnMax + ")이 CHECK(" + dbMax + ")와 다릅니다");

  /* ⚠️⚠️ **service key 가 화면으로 내려가지 않는가** — 이 주소가
     돌려주는 것은 그 경로 하나에만 쓰는 서명된 주소까지입니다. */
  if(/SERVICE_KEY[\s\S]{0,120}res\.status/.test(js) ||
     /json\([^)]*SERVICE_KEY/.test(js))
    throw new Error("api/upload.js 가 service key 를 답에 실을 수 있습니다 — " +
      "그 키는 RLS 를 통째로 지나갑니다");

  console.log("   사진 형식 " + api1.length + "가지 \u00b7 상한 " +
    Math.round(dbMax / 1048576) + "MB 가 서버와 DB 에서 같습니다");
}
checkMigDocs(W);
checkPhotoSql();
checkOffers(W);
checkOpsvc(W);
checkHalls(W);
checkSvcPick(W);
checkPickGroup(W);
checkOpsCheck(W);
for(const hall of Object.keys(W.AM_PICK_GROUP || {})){
  const gs = W.amPickGroups(hall);
  console.log("   " + hall + " 대표 " + gs.length + "묶음 · 세부 " +
    gs.reduce((n, g) => n + g.subs.length, 0) + "개가 실제 서비스를 가리킵니다");
}
writeSvcList(W);

/* ⚠️⚠️ **서버가 "없는 서비스" 를 걸러낼 수 있게 목록을 내려놓습니다**
   (2026-10-17 창업 준비 §8 "잘못된 서비스 ID 차단").

   `api/quote.js` 는 브라우저가 아니라 Vercel 함수라 `catalog.js` 를
   읽을 수가 없습니다 (`window` 가 없고, 런타임에 파일을 읽으면
   번들에 안 들어갈 수 있습니다). 그래서 **빌드가 적어 줍니다.**

   ⚠️ 손으로 고치지 마세요 — 빌드가 돌 때마다 다시 씁니다. 분류를
   늘리면 저절로 따라오고, 고친 것을 커밋 안 하면 `ship.js --ci` 의
   "빌드 결과가 커밋과 같은가" 가 잡습니다.
   ⚠️⚠️ **내려놓는 것은 key 뿐입니다** — 이름 · 설명을 같이 쓰면 이름을
   바꿀 때마다 이 파일이 바뀌고, 서버는 이름을 쓸 일이 없습니다. */
function writeSvcList(W){
  const cats = (W.AM_CATS || []).map(c => c.key).filter(Boolean);
  if(!cats.length) throw new Error("AM_CATS 가 비어 서비스 목록을 못 만듭니다");
  /* ⚠️⚠️ **2026-10-18 운영 §4-4 로 하위 쌍까지 적습니다.** 운영 쪽은
     "에어컨 수리" 처럼 **하위**를 고르셔서 id 가 `repair/aircon-fix`
     꼴로 옵니다 — 분류만 적어 두면 서버가 그 전부를 "없는 서비스" 로
     버리고, 손님 화면에는 접수 성공이 뜨는데 **항목이 하나도 안
     저장됩니다** (§15 "서비스 ID 유효성 검증").
     ⚠️ `byIndustry` 분류(시설 · 장비)는 하위가 업종에서 와서
     `amAllSubs()` 가 모든 업종 것을 합쳐 돌려줍니다. */
  const keys = cats.slice();
  (W.AM_CATS || []).forEach(c => {
    const subs = (typeof W.amAllSubs === "function") ? W.amAllSubs(c) : (c.items || []);
    (subs || []).forEach(s => {
      if(!s || !s.key) return;
      /* ⚠️ key 에 `/` 가 섞이면 `amPickSplit()` 의 꼴이 깨집니다 */
      if(String(c.key).indexOf("/") >= 0 || String(s.key).indexOf("/") >= 0)
        throw new Error("분류 · 하위 key 에 '/' 를 쓰지 마세요 — " + c.key + " / " + s.key);
      keys.push(c.key + "/" + s.key);
    });
  });
  const uniq = [...new Set(keys)].sort();
  const out =
    "/* ⚠️⚠️ **빌드가 만드는 파일입니다 — 손으로 고치지 마세요.**\n" +
    "   `node build-pages.js` 가 `js/data/catalog.js` 의 분류 key 와\n" +
    "   **하위 쌍**(`분류/하위`)을 그대로 적습니다 (2026-10-17 창업 준비\n" +
    "   §8 \"잘못된 서비스 ID 차단\" · 2026-10-18 운영 §4-4 하위 선택).\n" +
    "   `api/quote.js` 가 신청 항목의 id 를 이 목록으로 거릅니다. */\n" +
    "module.exports = " + JSON.stringify(uniq) + ";\n";
  const at = path.join(ROOT, "api/_services.js");
  const was = fs.existsSync(at) ? fs.readFileSync(at, "utf8") : "";
  if(was !== out){ fs.writeFileSync(at, out); console.log("   서비스 목록을 다시 적었습니다 — api/_services.js (" + uniq.length + ")"); }
}
checkSvcPage(W);
checkSteps(W);
checkPackages(W);
checkReqForms(W);
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
checkKeepUrls(routes, JSON.parse(fs.readFileSync(path.join(ROOT,"vercel.json"),"utf8")));

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

/* ════════════════════════════════════════════════════════════════════
   checkOgPalette() — 공유 미리보기가 **지금 팔레트**를 쓰고 있는가

   ⚠️⚠️ **2026-10-16 — 또 어긋나 있었습니다.** 10-15 시안 1:1 로
   글자색 셋(`--ink` · `--ink2` · `--ink3`)을 바꿨는데 `tools/og.html` 은
   그 전 값(`#675E55`)을 들고 있었습니다 — 거기는 `css/tokens.css` 를
   **못 읽는 자리**라 사람이 같이 고쳐야 하고, 이 저장소가 404 · manifest ·
   middleware · 관리자 글로 **여러 번** 격은 그 자리입니다.

   ⚠️ 공유 미리보기는 **화면으로 표가 안 납니다** — 카카오톡에 붙여
   봐야 알고, 한 번 퍼지면 캐시에 한참 남습니다.

   ⚠️ **주석을 먼저 걷어냅니다.** og.html 은 올바른 값을 설명하려고
   주석에 **예날 색**(`#D5AA55`)을 적어 두었습니다 — 그대로 찾으면 멀줦한
   파일을 실패로 잡습니다 (이 저장소가 `select=*` 로 겪은 자리).
   ═══════════════════════════════════════════════════════════════════ */
function checkOgPalette(){
  const f = path.join(ROOT, "tools", "og.html");
  if(!fs.existsSync(f)) throw new Error("tools/og.html 이 없습니다 — 공유 미리보기를 다시 찍을 길이 없어집니다");
  const bare = fs.readFileSync(f, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  const tok = fs.readFileSync(path.join(ROOT, "css", "tokens.css"), "utf8").toUpperCase();
  const hex = [...new Set((bare.match(/#[0-9A-Fa-f]{6}/g) || []).map(x => x.toUpperCase()))];
  if(!hex.length) throw new Error("tools/og.html 에서 색을 하나도 못 찾았습니다 — 검사가 틀렸습니다");
  const bad = hex.filter(h => tok.indexOf(h) < 0);
  if(bad.length)
    throw new Error("공유 미리보기(tools/og.html)가 **토큰에 없는 색**을 씁니다 — "+
      "팔레트를 바꾸셨으면 거기도 같이 고치고 `node tools/og.js` 로 "+
      "다시 찍으세요:\n  " + bad.join("\n  "));
  console.log("   공유 미리보기 색 " + hex.length + "가지가 전부 토큰에 있습니다");
}
checkOgPalette();

/* ════════════════════════════════════════════════════════════════════
   checkMainH2() — 메인 크롤러 본문의 머리말이 **화면과 같은가**

   ⚠️⚠️ **2026-10-16 — 둘이 어긋나 있었습니다.** 화면은
   "사업에 필요한 계산도구를 이용해 보세요." · "이용 방법은
   간단합니다." 인데 크롤러에게만 예날 머리말을 보내고 있었습니다 —
   이 저장소가 같은 결로 **여덟 번** 겪은 자리입니다.

   ⚠️⚠️ **`check.js` 는 이것을 영원히 못 잡습니다** — 전수 점검은
   브라우저가 그린 화면만 보는데, 크롤러 본문은 자바스크립트가 돌면
   덮입니다. 그래서 빌드가 **글자로** 봅니다 (`checkRetired()` 와 같은 방식).

   ⚠️ 보는 것은 **메인 하나**입니다. 업종 · 도구 화면의 크롤러
   머리말("적는 항목" · "음식점 창업에 필요한 장비" …)은 **요약하는
   제목**이고 그 아래 내용은 전부 실제 데이터라 거짓이 아니라 줄임입니다.
   글자까지 맞추기로 한 것은 메인뿐입니다.
   ═══════════════════════════════════════════════════════════════════ */
function checkMainH2(){
  const src = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const a = src.indexOf("<!-- crawl:start -->"), b = src.indexOf("<!-- crawl:end -->");
  if(a < 0 || b < 0) throw new Error("index.html 에서 crawl 표시를 못 찾았습니다");
  const body = src.slice(a, b);
  const hs = [...body.matchAll(/<h2>([\s\S]*?)<\/h2>/g)]
               .map(m => m[1].replace(/<[^>]*>/g, "").trim()).filter(Boolean);
  if(hs.length < 3)
    throw new Error("메인 크롤러 본문에서 h2 를 "+hs.length+"개밖에 못 찾았습니다 — 검사가 틀렸거나 구간이 빠졌습니다");
  const home = fs.readFileSync(path.join(ROOT, "js", "pages", "home.js"), "utf8");
  /* ⚠️⚠️ **브랜드 이름이 든 머리말은 통째로 못 견줍니다.** 화면은
     "지금, " + koWith(이름,"와과") + " 함께 시작하세요." 로 **조각**
     이고 조사는 런타임에 붙습니다 — 통째로 찾으면 멀쩡한 머리말이
     "화면에 없습니다" 로 걸립니다 (이름을 손으로 적게 되면 그때부터
     "인수인계은" 사고가 돌아옵니다).
     그래서 **이름(+조사 한 글자)에서 잘라** 앞뒤 토막이 화면 소스에
     있는지 봅니다. 이름이 없는 머리말은 전과 똑같이 통째로 봅니다. */
  const bsrc = fs.readFileSync(path.join(ROOT, "js", "data", "brand.js"), "utf8");
  const bnm = ((bsrc.match(/name\s*:\s*"([^"]+)"/) || [])[1] || "").trim();
  const frag = t => {
    if(!bnm || t.indexOf(bnm) < 0) return [t];
    const esc1 = bnm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return t.split(new RegExp(esc1 + "[가이와과은는을를]?", "g"))
            .filter(x => x.length);
  };
  const bad = hs.filter(t => frag(t).some(f => home.indexOf(f) < 0));
  if(bad.length)
    throw new Error("메인 크롤러 본문의 머리말이 화면에 없습니다 — "+
      "크롤러에게만 다른 제목을 보내면 그게 구글에 나가는 거짓말입니다 "+
      "(js/pages/home.js 에 그 글자가 없습니다):\n  " +
      bad.map(t => t + "   [못 찾은 토막] " +
        frag(t).filter(f => home.indexOf(f) < 0).join(" | ")).join("\n  "));
  console.log("   메인 크롤러 머리말 " + hs.length + "개가 화면과 글자까지 같습니다");
}
checkMainH2();

/* ── sitemap ──────────────────────────────────────────────────── */
/* ⚠️⚠️ **빌드한 날을 여기 적지 마세요** (2026-10-20 에 겪었습니다).
   전에는 `lastmod` 와 머리 주석에 **오늘 날짜**를 넣었습니다. 그러면
   두 가지가 같이 깨집니다 —

     ① 구글에게 **163개 주소가 전부 오늘 바뀌었다**고 말합니다. 빌드할
        때마다 그렇습니다 — 글 한 편을 고쳐도 163개가 다 바뀐 것으로
        나가니, 구글은 믿을 수 없는 `lastmod` 를 **그냥 무시합니다.**
        "n일 전" 같은 상대 표기를 쓰지 않는 것과 같은 까닭입니다.
     ② **빌드가 날마다 다른 결과를 냅니다.** 그래서 `tools/ship.js --ci`
        의 "빌드 결과가 커밋과 같은가" 가 **자정을 넘긴 밀기마다**
        떨어집니다 — 코드는 멀쩡한데 CI 만 빨갛고, 로그에 까닭이
        안 남습니다 (`sitemap.xml` 한 줄 차이라 화면으로는 표가 안
        납니다). 실제로 그 바람에 배포가 한 번 막혔습니다.

   그래서 **적을 수 있는 날짜가 있는 곳에만** 적습니다 — 글
   예순여섯 편의 `at`(실제로 올린 날)입니다. 나머지 주소는
   `lastmod` 를 **아예 안 냅니다** (sitemaps.org 에서 선택 항목이고,
   없는 것이 틀린 것보다 낫습니다).

   ⚠️ 날짜를 다시 넣고 싶어지면 **빌드가 날마다 같은 결과를 내는지**
   먼저 보세요. HEAD 커밋 날짜도 안 됩니다 — 빌드하고 커밋하면
   커밋 날짜가 바뀌어서, 그 커밋을 다시 빌드하면 또 달라집니다. */
const ctAt = {};
(W.AM_CONTENTS || []).forEach(function(c){
  if(c && c.slug && /^\d{4}-\d{2}-\d{2}$/.test(String(c.at || "")))
    ctAt["/content/" + c.slug] = c.at;
});
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
'<!-- build-pages.js 가 만듭니다. 손으로 고치지 마세요. -->\n'+
'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+
sitemap.map(r=>'  <url><loc>'+ORIGIN+r+'</loc>'+
  (ctAt[r] ? '<lastmod>'+ctAt[r]+'</lastmod>' : '')+
  '<priority>'+prio(r)+'</priority></url>').join("\n")+
'\n</urlset>\n');

/* ⚠️⚠️ **sitemap 에 "오늘" 이 다시 끼어들면 빌드를 멈춥니다**
   (2026-10-20 — 그 바람에 배포가 한 번 막혔습니다).
   `lastmod` 에 적힐 수 있는 것은 **글의 실제 `at`** 뿐입니다. 빌드한
   날을 넣으면 ① 구글에게 163개가 다 오늘 바뀌었다고 말하고 ② 빌드가
   날마다 다른 결과를 내서 `ship.js --ci` 가 자정을 넘긴 밀기마다
   떨어집니다 — 화면으로는 표가 안 나고 CI 로그에도 까닭이 안 남습니다. */
function checkSitemapDates(){
  const xml = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
  const ok  = new Set(Object.keys(ctAt).map(k => ctAt[k]));
  const bad = [];
  let m, re = /<lastmod>([^<]*)<\/lastmod>/g;
  while((m = re.exec(xml))) if(!ok.has(m[1])) bad.push(m[1]);
  if(bad.length)
    throw new Error("sitemap 의 lastmod 에 글의 실제 날짜가 아닌 것이 "+
      "있습니다 — 빌드한 날을 넣으면 빌드가 날마다 다른 결과를 내고 "+
      "`ship.js --ci` 가 자정을 넘긴 밀기마다 떨어집니다:\n  " +
      [...new Set(bad)].join(" , "));
  const n = (xml.match(/<lastmod>/g) || []).length;
  console.log("   sitemap 의 lastmod " + n + "개가 전부 글의 실제 올린 날입니다");
}
checkSitemapDates();

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
