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
  const DATA = ["js/data/korean.js","js/data/site.js","js/data/situations.js",
                "js/data/problems.js","js/data/services.js","js/data/startup.js",
                "js/data/photos.js","js/data/check.js","js/data/regions.js","js/data/reqforms.js",
                "js/data/legal-terms.js","js/data/legal-privacy.js",
                "js/data/posts.js","js/data/guides.js","js/data/faq.js"];

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
  const fixed = ["/", "/sos", "/start", "/start/cost", "/check", "/partners",
                 "/request", "/lab", "/partner", "/partner/apply",
                 "/my", "/quotes", "/search",
                 "/tools", "/tools/yield", "/tools/bep", "/tools/labor", "/problems", "/login", "/signup", "/about", "/terms", "/privacy"];
  /* 연구소 글은 하나하나가 주소입니다 — 검색에서 들어오는 문이라
     반드시 진짜 HTML 파일이 있어야 합니다. */
  const posts = (W.WOW_POSTS || []).map(p => "/lab/" + p.slug);
  /* 문제별 해결 가이드 — 흐름의 가운데 두 칸이자 **검색에서 들어오는
     제일 큰 문**입니다. "덕트 냄새 민원" 으로 검색해 들어오시는 분이
     제일 먼저 만나는 화면이므로 반드시 진짜 HTML 파일이어야 합니다. */
  const guides = (W.WOW_GUIDES || []).map(g => "/problem/" + g.key);
  return fixed.concat(posts).concat(guides);
}

function esc(s){
  return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

/* ── 구조화 데이터 (JSON-LD) ──────────────────────────────────
   구글이 제목·설명 말고 **이 화면이 무엇인지**를 읽는 자리입니다.
   연구소 글은 Article 로, 사이트는 WebSite + 검색으로, 주소 안의
   주소는 BreadcrumbList 로 알려 줍니다.

   ⚠️ **평점·리뷰 수·업체 수를 넣지 마세요** (절대 규칙 1).
   aggregateRating 을 넣으면 검색 결과에 별이 뜨는데, 그 별은 실제
   후기가 있어야 붙일 수 있는 것입니다. 없는 별을 붙이면 지어낸
   숫자를 구글에까지 내보내는 셈이고, 적발되면 리치 결과가 통째로
   막힙니다. 예전 부산물몰에서 실제로 그랬습니다.

   ⚠️ 화면에 없는 것을 여기에만 적지 마세요. 구글은 "구조화 데이터가
   화면 내용과 같아야 한다" 고 못 박아 두었습니다. */
function jsonLd(W, r, route){
  const org = {
    "@type":"Organization", name:"ABOUTMEAT", url:ORIGIN,
    logo:ORIGIN+"/icon-512.png"
  };
  const out = [];

  if(route === "/"){
    const faq = (W.WOW_FAQ || []);
    if(faq.length)
      out.push({ "@context":"https://schema.org", "@type":"FAQPage",
        inLanguage:"ko",
        mainEntity: faq.map(f => ({ "@type":"Question", name:f.q,
          acceptedAnswer:{ "@type":"Answer", text:f.a } })) });
    out.push({ "@context":"https://schema.org", "@type":"WebSite",
      name:"ABOUTMEAT", url:ORIGIN, inLanguage:"ko",
      description:r.desc || "",
      potentialAction:{ "@type":"SearchAction",
        target:{ "@type":"EntryPoint", urlTemplate:ORIGIN+"/search?q={q}" },
        "query-input":"required name=q" } });
    out.push({ "@context":"https://schema.org", "@type":"Organization",
      name:"ABOUTMEAT", url:ORIGIN, logo:ORIGIN+"/icon-512.png",
      description:"고깃집·정육점 사장님의 문제를 정리하고, 조건에 맞는 업체를 최대 세 곳 찾아 견적을 받아 드리는 중개 서비스입니다." });
  }

  if(route.indexOf("/lab/") === 0){
    const post = (W.WOW_POSTS||[]).filter(p => "/lab/"+p.slug === route)[0];
    if(post){
      out.push({ "@context":"https://schema.org", "@type":"Article",
        headline: post.title, description: post.lead,
        inLanguage:"ko",
        datePublished: post.updated, dateModified: post.updated,
        author: org, publisher: org,
        mainEntityOfPage:{ "@type":"WebPage", "@id":ORIGIN+route },
        articleSection: (W.wowPostCatName && W.wowPostCatName(post.cat)) || undefined });
      const cat = (W.wowPostCatName && W.wowPostCatName(post.cat)) || "글";
      out.push({ "@context":"https://schema.org", "@type":"BreadcrumbList",
        itemListElement:[
          { "@type":"ListItem", position:1, name:"홈", item:ORIGIN+"/" },
          { "@type":"ListItem", position:2, name:"사장님 연구소", item:ORIGIN+"/lab" },
          { "@type":"ListItem", position:3, name:post.title }
        ]});
    }
  }

  /* 문제별 해결 가이드 — Article 로 알립니다.
     ⚠️ **FAQPage 를 쓰지 마세요.** 가이드의 "물어볼 것" 은 업체에게
     던질 질문이지 **우리가 답을 단 질문이 아닙니다.** 구글은 구조화
     데이터가 화면 내용과 같기를 요구하므로, 답이 없는 질문을 FAQ 로
     내보내면 어긋납니다. */
  if(route.indexOf("/problem/") === 0){
    const g = (W.WOW_GUIDES||[]).filter(x => "/problem/"+x.key === route)[0];
    if(g){
      const pr = (W.wowProblem && W.wowProblem(g.key)) || null;
      out.push({ "@context":"https://schema.org", "@type":"Article",
        headline: g.h1, description: g.lead, inLanguage:"ko",
        author: org, publisher: org,
        mainEntityOfPage:{ "@type":"WebPage", "@id":ORIGIN+route },
        articleSection: pr ? pr.name : undefined });
      out.push({ "@context":"https://schema.org", "@type":"BreadcrumbList",
        itemListElement:[
          { "@type":"ListItem", position:1, name:"홈", item:ORIGIN+"/" },
          { "@type":"ListItem", position:2, name:"고민별 해결방법",
            item:ORIGIN+"/problems" },
          { "@type":"ListItem", position:3, name:g.h1 }
        ]});
    }
  }

  if(route === "/problems"){
    out.push({ "@context":"https://schema.org", "@type":"CollectionPage",
      name:"고민별 해결방법", description:r.desc || "", inLanguage:"ko",
      url:ORIGIN+"/problems",
      mainEntity:{ "@type":"ItemList",
        itemListElement:(W.WOW_GUIDES||[]).map((g,i) => ({
          "@type":"ListItem", position:i+1, name:g.h1,
          url:ORIGIN+"/problem/"+g.key })) }});
  }

  if(route === "/lab"){
    out.push({ "@context":"https://schema.org", "@type":"CollectionPage",
      name:"사장님 연구소", description:r.desc || "", inLanguage:"ko",
      url:ORIGIN+"/lab",
      mainEntity:{ "@type":"ItemList",
        itemListElement:(W.WOW_POSTS||[]).map((p,i) => ({
          "@type":"ListItem", position:i+1, name:p.title, url:ORIGIN+"/lab/"+p.slug })) }});
  }

  if(route === "/start/cost" || route === "/check" || route === "/quotes" ||
     route === "/tools/yield" || route === "/tools/bep" ||
     route === "/tools/labor"){
    out.push({ "@context":"https://schema.org", "@type":"WebApplication",
      name:r.title, description:r.desc || "", url:ORIGIN+route,
      applicationCategory:"BusinessApplication",
      operatingSystem:"Web", inLanguage:"ko", publisher:org,
      /* 무료라는 것은 화면에도 적혀 있는 사실입니다 */
      offers:{ "@type":"Offer", price:"0", priceCurrency:"KRW" } });
  }

  if(!out.length) return "";
  return out.map(o =>
    '<script type="application/ld+json">'+
    JSON.stringify(o).replace(/</g,"\\u003c")+
    '</'+'script>').join("\n");
}

/* ── 껍데기 ───────────────────────────────────────────────────
   index.html 을 그대로 쓰되 <head> 의 메타만 갈아 끼웁니다.
   스크립트·CSS 는 절대 경로라 어느 깊이에서 열어도 같습니다. */
function shell(tpl, r, route, noscript, ld){
  const site = "ABOUTMEAT · 고기 사업자 문제해결";
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

/* ── 크롤러가 읽을 본문 ─────────────────────────────────────
   ⚠️ 이건 "구색" 이 아니라 **검색엔진이 보는 우리 사이트 전부**입니다.
   JS 를 안 돌리는 크롤러(네이버·빙·카카오·LLM 봇)에게는 여기 적힌
   것만 존재합니다. 화면에 있는 내용은 여기에도 있어야 합니다.

   ⚠️ **지어낸 것을 여기에 적지 마세요.** 화면에 없는 업체 수 · 후기 ·
   실적을 여기에만 적으면 그게 구글에까지 나가는 거짓말입니다
   (절대 규칙 1). 전부 js/data 에서 그대로 가져옵니다.

   ⚠️ 데이터를 새로 만들면 **여기에도 넣으세요.** check.js 의
   "크롤러가 읽을 본문이 있다" 가 글자 수로 지켜 주지만, 무엇이
   빠졌는지까지는 못 봅니다. */
function noscriptFor(W, r, route){
  const L = (u,t)=>'<li><a href="'+esc(u)+'">'+esc(t)+'</a></li>';
  const UL = (arr)=>"<ul>"+arr.join("")+"</ul>";
  const plain = (t)=>esc(String(t).replace(/\*\*/g,""));
  let body = "<h1>"+esc(r.title || "ABOUTMEAT")+"</h1><p>"+esc(r.desc||"")+"</p>";

  if(route === "/"){
    body += "<h2>지금 어떤 상황이세요?</h2>"+
      UL(W.WOW_SITUATIONS.map(s => L(s.to, s.name+" — "+s.line)));
    /* 고민 열둘은 가이드로 보냅니다 — 화면과 같은 곳으로 */
    body += "<h2>업체를 부르기 전에 확인할 것</h2>"+
      UL((W.WOW_GUIDES||[]).map(g => L("/problem/"+g.key, g.h1+" — "+g.lead)));
    body += "<h2>가입 없이 지금 해 보실 수 있는 것</h2>"+
      UL([L("/check","무료 사업진단 — 여덟 가지로 지금 무엇을 모르고 계신지 정리합니다"),
          L("/tools/yield","수율 원가 계산 — 손질 후 무게로 실제 1kg 원가를 냅니다"),
          L("/tools/bep","손익분기 계산 — 한 달에 얼마를 팔아야 본전인지 냅니다"),
          L("/tools/labor","인건비율 계산 — 4대보험과 사장님 몫까지 넣어 실제 인건비율을 냅니다"),
          L("/start/cost","창업비 정리표 — 빠뜨리기 쉬운 항목과 아직 안 받은 견적"),
          L("/quotes","견적 비교 — 받은 견적을 같은 자리에 놓고 견줍니다")]);
    body += "<h2>고기 장사에 필요한 것</h2>"+
      (W.WOW_SERVICE_GROUPS||[]).map(g =>
        "<h3>"+esc(g.name)+"</h3>"+
        UL(g.items.map(it => L("/request?s="+encodeURIComponent(it.key), it.name+
            (it.line ? " — "+it.line : ""))))).join("");
    body += "<h2>사장님 연구소</h2>"+
      UL((W.WOW_POSTS||[]).map(pp => L("/lab/"+pp.slug, pp.title+" — "+pp.lead)));
    body += "<h2>자주 묻는 것</h2>"+
      (W.WOW_FAQ||[]).map(f =>
        "<h3>"+esc(f.q)+"</h3><p>"+esc(f.a)+"</p>").join("");
    body += UL([L("/sos","사장님 SOS — 상황을 적어 주시면 정리해 드립니다"),
                L("/problems","고민별 해결방법 전부 보기"),
                L("/partners","업체 찾기"), L("/partner/apply","파트너 등록")]);
  }

  if(route === "/sos"){
    body += UL(W.WOW_PROBLEMS.map(p =>
      "<li>"+esc(p.name)+(p.hint?" — "+esc(p.hint):"")+"</li>"));
  }
  if(route === "/start"){
    body += "<ol>"+W.WOW_STARTUP_STEPS.map(s =>
      "<li>"+esc(s.name)+(s.line?" — "+esc(s.line):"")+"</li>").join("")+"</ol>";
  }
  if(route === "/check"){
    body += "<h2>여덟 가지를 봅니다</h2>"+
      UL((W.WOW_CHECK||[]).map(c =>
        "<li>"+esc(c.name)+(c.why?" — "+esc(c.why):"")+"</li>"));
    body += "<p>좋다 나쁘다를 매기지 않습니다. 업종·평수·지역마다 기준이 " +
      "달라서 우리에게 그 기준값이 없기 때문입니다. 대신 지금 무엇을 " +
      "알고 계시고 무엇을 모르시는지를 셉니다. 적으신 내용은 이 브라우저 " +
      "밖으로 나가지 않습니다.</p>";
  }
  if(route === "/tools"){
    body += UL([
      L("/check","무료 사업진단 — 여덟 가지로 지금 무엇이 비어 있는지 정리합니다"),
      L("/tools/yield","수율 원가 계산 — 매입 단가와 손질 후 무게로 실제 1kg 원가를 냅니다"),
      L("/tools/bep","손익분기 계산 — 고정비와 변동비율로 한 달에 얼마를 팔아야 본전인지 냅니다"),
      L("/tools/labor","인건비율 계산 — 급여·4대보험·사장님 몫까지 넣어 실제 인건비율과 한 사람당 매출을 냅니다"),
      L("/start/cost","창업비 정리표 — 빠뜨리기 쉬운 항목을 늘어놓고 아직 안 받은 견적을 보여 줍니다"),
      L("/quotes","견적 비교 — 받은 견적을 같은 자리에 놓고 포함 범위까지 견줍니다")]);
    body += "<p>전부 가입 없이 무료이고, 적으신 숫자는 이 브라우저 밖으로 " +
      "나가지 않습니다. 안 적으신 칸은 비워 둡니다 — 평균값으로 메우면 " +
      "그게 지어낸 숫자입니다.</p>";
  }
  /* ⚠️ 계산기 화면들도 **검색으로 들어오는 자리**입니다. 제목과
     설명만으로는 85자밖에 안 됐습니다 — 무엇을 묻고 무엇이 나오는지를
     같이 냅니다. 전부 화면에 실제로 있는 말입니다. */
  if(route === "/tools/labor"){
    body += "<h2>무엇을 적으시면 되나요</h2>"+
      UL(["<li>월 매출</li>", "<li>직원 급여 합계 (홀 · 주방 전부)</li>",
          "<li>4대보험 · 퇴직충당 (사업주 부담분)</li>",
          "<li>사장 인건비 — 직접 뛰시는 몫을 넣을지는 사장님이 고르십니다</li>",
          "<li>일하는 사람 수 · 월 영업일수</li>"])+
      "<h2>무엇이 나오나요</h2>"+
      UL(["<li>인건비 합계</li>", "<li>인건비율 (인건비 합계 \u00f7 월 매출)</li>",
          "<li>한 사람당 월 매출</li>", "<li>하루 인건비</li>"])+
      "<p>인건비율 몇 %가 적정이라고 말하지 않습니다. 홀\u00b7주방 구성, " +
      "사장님이 직접 뛰시는지, 배달 비중, 지역 시급이 전부 다릅니다. " +
      "급여만 보면 한 사람 값이 실제보다 적게 보입니다 — 4대보험과 " +
      "사장님 몫까지 넣어야 실제 비율이 나옵니다. 적으신 숫자는 이 " +
      "브라우저 밖으로 나가지 않습니다.</p>";
  }
  if(route === "/tools/yield"){
    body += "<h2>무엇을 적으시면 되나요</h2>"+
      UL(["<li>매입 단가 (원육 1kg 기준)</li>", "<li>손질 전 무게</li>",
          "<li>손질 후 무게</li>", "<li>1인분 중량 · 판매가</li>"])+
      "<h2>무엇이 나오나요</h2>"+
      UL(["<li>수율 (손질 후 \u00f7 손질 전)</li>", "<li>실제 1kg 원가</li>",
          "<li>1인분 원가와 원가율</li>"])+
      "<p>매입 단가는 원육 기준인데 파는 것은 손질 후 정육입니다. " +
      "수율 몇 %가 정상이라고 말하지 않습니다 — 부위와 손질 기준마다 " +
      "다릅니다. 안 적으신 칸은 평균값으로 메우지 않습니다.</p>";
  }
  if(route === "/tools/bep"){
    body += "<h2>무엇을 적으시면 되나요</h2>"+
      UL(["<li>매달 나가는 돈 (임차료 · 인건비 · 공과금 · 설비 등)</li>",
          "<li>팔릴 때마다 나가는 비율 (식재료비 · 수수료)</li>",
          "<li>월 영업일수 · 객단가</li>"])+
      "<h2>무엇이 나오나요</h2>"+
      UL(["<li>고정비 합계</li>", "<li>공헌이익률 (100% \u2212 변동비율)</li>",
          "<li>본전 월 매출 · 하루 필요 매출</li>"])+
      "<p>인건비를 고정비에 넣었습니다 — 월급제 기준입니다. 변동비율 " +
      "합이 100%를 넘으면 손익분기 매출이라는 것이 없습니다. 그때는 " +
      "큰 숫자를 하나 내놓는 대신 그 사실을 적습니다.</p>";
  }
  if(route === "/start/cost"){
    body += "<p>예상 금액을 알려 드리지 않습니다. 지역 · 평수 · 시공 " +
      "수준에 따라 항목마다 몇 배씩 차이 납니다. 빠뜨리기 쉬운 항목을 " +
      "전부 늘어놓고, 사장님이 실제로 받으신 견적을 적으시면 합계와 " +
      "아직 안 받은 칸을 보여 드립니다.</p>";
  }
  if(route.indexOf("/lab/") === 0){
    const post = (W.WOW_POSTS||[]).filter(p => "/lab/"+p.slug === route)[0];
    if(post) body += post.body.map(s =>
      "<h2>"+esc(s.h)+"</h2>"+
      (s.p||[]).map(t => "<p>"+plain(t)+"</p>").join("")+
      ((s.list||[]).length ? UL(s.list.map(t => "<li>"+plain(t)+"</li>")) : "")
    ).join("");
  }
  if(route === "/lab"){
    body += UL((W.WOW_POSTS||[]).map(p =>
      L("/lab/"+p.slug, p.title+" — "+p.lead)));
  }
  /* ⚠️ 가이드는 이 사이트의 핵심 자산입니다. **본문을 통째로** 냅니다 —
     검색으로 들어오는 분이 제일 많이 찾는 것이 이 내용입니다. */
  if(route.indexOf("/problem/") === 0){
    const g = (W.WOW_GUIDES||[]).filter(x => "/problem/"+x.key === route)[0];
    if(g){
      body += g.intro.map(t => "<p>"+plain(t)+"</p>").join("");
      if((g.warn||[]).length)
        body += "<h2>이런 신호가 있으면 먼저 멈추세요</h2>"+
          UL(g.warn.map(t => "<li>"+plain(t)+"</li>"));
      body += "<h2>지금 직접 확인할 것</h2>"+
        UL(g.self.map(t => "<li>"+plain(t)+"</li>"));
      body += "<h2>먼저 의심할 것</h2>"+
        UL((g.causes||[]).map(c => "<li>"+esc(c.t)+" — "+plain(c.d)+"</li>"));
      body += "<h2>업체에 미리 알려 줄 것</h2>"+
        UL((g.tell||[]).map(t => "<li>"+plain(t)+"</li>"));
      body += "<h2>견적 받을 때 물어볼 것</h2>"+
        UL(g.ask.map(t => "<li>"+plain(t)+"</li>"));
      if(g.law) body += "<h2>"+esc(g.law.t)+"</h2><p>"+plain(g.law.d)+"</p>"+
        (g.law.where ? "<p>확인하는 곳: "+esc(g.law.where)+"</p>" : "");
    }
  }
  if(route === "/problems"){
    body += UL((W.WOW_GUIDES||[]).map(g =>
      L("/problem/"+g.key, g.h1+" — "+g.lead)));
  }
  if(route === "/partners" || route === "/request"){
    body += (W.WOW_SERVICE_GROUPS||[]).map(g =>
      "<h2>"+esc(g.name)+"</h2>"+UL(g.items.map(it =>
        L("/request?s="+encodeURIComponent(it.key), it.name+
          (it.line ? " — "+it.line : ""))))).join("");
  }
  return body;
}


/* ── vercel.json 이 Vercel 이 받아들이는 모양인가 ──────────────
   ⚠️ Vercel 은 vercel.json 을 엄격하게 검사합니다. 헤더 항목에
   key·value 말고 다른 키가 하나라도 있으면 "Invalid vercel.json" 으로
   **배포가 통째로 실패합니다.** JSON 에는 주석이 없으니 설명은
   CLAUDE.md 에 적으세요. */
/* ── 없는 CSS 변수를 쓰고 있지 않은가 ─────────────────────────
   ⚠️ **없는 변수는 에러가 아니라 침묵입니다.** `var(--t-h1)` 처럼
   오타를 내면 그 줄만 통째로 무시되고, 제목이 본문 크기로 나옵니다.
   브라우저 콘솔에도 안 찍히고 전수 점검도 통과합니다 — 실제로 가이드
   화면의 h1 이 15px 로 나갔습니다.
   ⚠️ 되돌림 값이 있는 것(`var(--x, 기본)`)은 일부러 그런 것이므로
   봐줍니다. */
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
const tpl = fs.readFileSync(path.join(ROOT,"index.html"),"utf8");
const routes = allRoutes(W);

let made = 0, skipped = 0;
const sitemap = [];
const wrote = new Set();
const seenTitle = new Map(), seenDesc = new Map();

for(const route of routes){
  const r = W.routeInfo(route, {});
  if(!r.ok){ console.error("  ! 알 수 없는 주소: "+route); skipped++; continue; }
  const html = shell(tpl, r, route, noscriptFor(W, r, route), jsonLd(W, r, route));

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
    const ld = jsonLd(W, r, route);
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
