#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   주소마다 진짜 HTML 파일을 만듭니다 (검색엔진용)

     node build-pages.js

   왜 필요한가:
   이 사이트는 화면을 브라우저에서 그립니다. 구글은 JS 를 돌리기는
   하지만 늦고 자주 건너뜁니다. 그래서 **제목·설명·상품정보만이라도
   HTML 에 미리 박아 둡니다.** 크롤러는 JS 없이 바로 읽고, 손님
   브라우저는 평소처럼 앱이 그립니다.

   만드는 것:
     /c/beef/index.html            /p/b-gopchang/index.html
     /enc/beef/gopchang/index.html  … 주소마다 하나씩
     sitemap.xml                    위에서 만든 주소 전부

   ⚠️ **상품을 바꾸면 다시 돌려야 합니다.** 안 돌려도 화면은 정상입니다
   (vercel.json 의 rewrite 가 index.html 로 보냅니다) — 다만 그 상품만
   검색용 메타가 기본값이 됩니다.

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
  const sandbox = { window:{}, document:null, location:{pathname:"/",search:""},
                    console, history:{}, localStorage:null, setTimeout, clearTimeout };
  sandbox.window = sandbox;
  vm.createContext(sandbox);

  const files = [
    "js/data/site.js", "js/data/categories.js", "js/data/products.js",
    "js/data/filters.js", "js/data/encyclopedia.js"
  ];
  for(const f of files) vm.runInContext(fs.readFileSync(path.join(ROOT,f),"utf8"), sandbox, {filename:f});

  /* app.js 는 통째로 돌리면 document 를 건드립니다. 필요한 조각만
     떼어 냅니다 — META 와 routeInfo 와 isSoldOut·wowWon 뿐입니다. */
  const app = fs.readFileSync(path.join(ROOT,"js/app.js"),"utf8");
  const from = app.indexOf("var META = {");
  const to   = app.indexOf("/* 메타 태그를 실제로 갈아 끼웁니다");
  if(from<0 || to<0) throw new Error("app.js 에서 META~routeInfo 를 못 찾았습니다 — 주석을 바꾸셨나요?");
  /* 이 조각 안에 META · NOINDEX · routeInfo 가 다 들어 있어야 합니다 */
  vm.runInContext("window.isSoldOut=function(p){return !!(p&&p.soldOut);};", sandbox);
  vm.runInContext(app.slice(from,to), sandbox, {filename:"js/app.js"});

  /* ldFor 도 같이 (구조화 데이터) */
  const lf = app.indexOf("window.ldFor = function(r){");
  const le = app.indexOf("function render(){");
  vm.runInContext("var ORIGIN="+JSON.stringify(ORIGIN)+";", sandbox);
  vm.runInContext(app.slice(lf,le), sandbox, {filename:"js/app.js#ldFor"});
  /* listQuery 도 같이 — 화면과 같은 셈법을 써야 합니다 */
  const qf = app.indexOf("window.listQuery = function(kind){");
  const qe = app.indexOf("function render(){", qf);
  vm.runInContext(app.slice(qf,qe), sandbox, {filename:"js/app.js#listQuery"});
  return sandbox;
}

/* ── 만들 주소를 모읍니다 ─────────────────────────────────────── */
function allRoutes(W){
  const out = ["/", "/products", "/enc", "/b2b", "/b2b/quote",
               "/about", "/terms", "/privacy",
               "/cart", "/login", "/signup", "/my", "/search"];
  /* 오늘입고·손질상품·특가는 **내용이 있을 때만** 만듭니다.
     빈 페이지를 검색엔진에 올리면 "내용 없음" 으로 평가가 깎이고,
     들어온 손님도 빈 화면을 봅니다. */
  for(const kind of ["today","trim","sale"]){
    if(W.wowFind(W.listQuery(kind)).length) out.push("/products/"+kind);
    else console.log("  · /products/"+kind+" 는 해당 상품이 없어 안 만듭니다");
  }
  for(const sp of W.WOW_SPECIES){
    out.push("/c/"+sp.slug);
    for(const c of W.WOW_CATS[sp.slug]){
      /* 상품이 하나도 없는 분류는 안 만듭니다 — 빈 페이지를 검색엔진에
         올리면 "내용 없음" 으로 평가가 깎입니다. */
      if(!W.wowFind({sp:sp.slug, cat:c.slug}).length) continue;
      out.push("/c/"+sp.slug+"/"+c.slug);
      for(const it of c.items){
        if(!W.wowFind({sp:sp.slug, cat:c.slug, item:it.slug}).length) continue;
        out.push("/c/"+sp.slug+"/"+c.slug+"/"+it.slug);
      }
    }
    out.push("/enc/"+sp.slug);
    for(const e of (W.WOW_ENC[sp.slug]||[])) out.push("/enc/"+sp.slug+"/"+e.slug);
  }
  for(const p of W.WOW_PRODUCTS) out.push("/p/"+p.id);
  return [...new Set(out)];
}

/* ── 껍데기 ───────────────────────────────────────────────────
   index.html 을 그대로 쓰되 <head> 의 메타만 갈아 끼웁니다.
   스크립트·CSS 는 절대 경로라 어느 깊이에서 열어도 같습니다. */
function shell(tpl, r, route, noscript, ld){
  const site = "ABOUTMEAT 축산 부산물 전문마켓";
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
  /* canonical + robots 를 </head> 앞에 */
  const head = '<link rel="canonical" href="'+esc(canon)+'">\n'+
    (r.noindex ? '<meta name="robots" content="noindex, follow">\n' : '')+
    (ld ? '<script type="application/ld+json" id="ld">'+
          JSON.stringify(ld).replace(/</g,"\\u003c")+'</script>\n' : '');
  h = h.replace("</head>", head+"</head>");
  /* JS 가 안 도는 크롤러·브라우저에게 최소한의 내용을 줍니다 */
  h = h.replace('<a class="skip" href="#view">본문 바로가기</a>',
    '<a class="skip" href="#view">본문 바로가기</a>\n<noscript>'+noscript+'</noscript>');
  return h;
}
function esc(s){
  return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

/* noscript 에 넣을 내용 — 크롤러가 JS 를 안 돌려도 무엇을 파는지
   알 수 있어야 합니다. 링크를 줘야 크롤러가 다음 페이지로 갑니다. */
function noscriptFor(W, r, route){
  const L = (u,t)=>'<li><a href="'+esc(u)+'">'+esc(t)+'</a></li>';
  let body = "<h1>"+esc(r.title || "ABOUTMEAT")+"</h1><p>"+esc(r.desc||"")+"</p>";

  if(r.view==="detail" && r.product){
    const p = r.product;
    body += "<ul>"+
      "<li>가격 "+W.wowWon(p.price)+"원/kg</li>"+
      "<li>원산지 "+esc(p.origin||"")+"</li>"+
      "<li>보관 "+esc(W.WOW_TEMP[p.temp]||"")+"</li>"+
      "<li>손질 "+esc(W.WOW_TRIM[p.trim]||"")+"</li>"+
      (p.soldOut?"<li>현재 품절</li>":"")+
      ((p.uses||[]).length?"<li>용도 "+esc(p.uses.join(", "))+"</li>":"")+
    "</ul>";
  }
  let list = [];
  if(r.view==="cat")  list = W.wowFind({sp:r.sp, cat:r.cat, item:r.item});
  if(r.view==="list") list = W.wowFind(W.listQuery(r.kind));
  if(route==="/")     list = W.WOW_PRODUCTS.slice(0,12);
  if(list.length){
    body += "<ul>"+list.map(p=>L("/p/"+p.id, p.name+" "+W.wowWon(p.price)+"원/kg")).join("")+"</ul>";
  }
  if(route==="/" || route==="/products"){
    body += "<ul>"+W.WOW_SPECIES.map(s=>L("/c/"+s.slug, s.name)).join("")+
            L("/enc","부산물 도감")+L("/b2b","업소용 · 대량구매")+"</ul>";
  }
  if(r.view==="enc" && !r.slug){
    const sps = r.sp ? [r.sp] : W.WOW_SPECIES.map(s=>s.slug);
    body += "<ul>"+sps.flatMap(sp=>(W.WOW_ENC[sp]||[])
      .map(e=>L("/enc/"+sp+"/"+e.slug, e.name))).join("")+"</ul>";
  }
  return body;
}

/* ── 실행 ─────────────────────────────────────────────────────── */
const W = loadApp();
const tpl = fs.readFileSync(path.join(ROOT,"index.html"),"utf8");
const routes = allRoutes(W);

let made = 0, skipped = 0;
const sitemap = [];
for(const route of routes){
  const r = W.routeInfo(route, {});
  if(!r.ok){ console.error("  ! 알 수 없는 주소: "+route); skipped++; continue; }
  const ld = W.ldFor ? W.ldFor(r) : null;
  const html = shell(tpl, r, route, noscriptFor(W, r, route), ld);

  const dir = route==="/" ? ROOT : path.join(ROOT, route.replace(/^\//,""));
  if(route!=="/"){
    fs.mkdirSync(dir, {recursive:true});
    fs.writeFileSync(path.join(dir,"index.html"), html);
    made++;
  }
  /* "/" 는 index.html 자체라 덮어쓰지 않습니다 — 원본이 틀어집니다 */
  if(!r.noindex) sitemap.push(route);
}

/* ── sitemap ──────────────────────────────────────────────────── */
const today = new Date().toISOString().slice(0,10);
const prio = r => r==="/" ? "1.0" : /^\/p\//.test(r) ? "0.8"
             : /^\/c\//.test(r) ? "0.7" : /^\/enc\//.test(r) ? "0.6" : "0.5";
fs.writeFileSync(path.join(ROOT,"sitemap.xml"),
'<?xml version="1.0" encoding="UTF-8"?>\n'+
'<!-- build-pages.js 가 만듭니다 ('+today+'). 손으로 고치지 마세요 —\n'+
'     상품을 바꾸고 `node build-pages.js` 를 돌리면 다시 만들어집니다.\n'+
'     여기 올라간 주소는 전부 실제 HTML 파일이 있습니다. -->\n'+
'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+
sitemap.map(r=>'  <url><loc>'+ORIGIN+r+'</loc><lastmod>'+today+
  '</lastmod><priority>'+prio(r)+'</priority></url>').join("\n")+
'\n</urlset>\n');

console.log("페이지 "+made+"개"+(skipped?" (건너뜀 "+skipped+")":"")+
            " · sitemap "+sitemap.length+"개 주소");
