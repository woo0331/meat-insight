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

  for(const f of ["js/data/korean.js","js/data/site.js","js/data/situations.js",
                  "js/data/problems.js","js/data/services.js","js/data/startup.js",
                  "js/data/photos.js","js/data/check.js","js/data/reqforms.js",
                  "js/data/legal-terms.js","js/data/legal-privacy.js"])
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
function allRoutes(){
  return ["/", "/sos", "/start", "/start/cost", "/check", "/partners",
          "/request", "/lab", "/partner", "/partner/apply",
          "/my", "/login", "/signup", "/about", "/terms", "/privacy"];
}

function esc(s){
  return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

/* ── 껍데기 ───────────────────────────────────────────────────
   index.html 을 그대로 쓰되 <head> 의 메타만 갈아 끼웁니다.
   스크립트·CSS 는 절대 경로라 어느 깊이에서 열어도 같습니다. */
function shell(tpl, r, route, noscript){
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
  const head = '<link rel="canonical" href="'+esc(canon)+'">\n'+
    (r.noindex ? '<meta name="robots" content="noindex, follow">\n' : '');
  h = h.replace("</head>", head+"</head>");
  /* JS 가 안 도는 크롤러에게 최소한의 내용을 줍니다 */
  h = h.replace('<a class="skip" href="#view">본문 바로가기</a>',
    '<a class="skip" href="#view">본문 바로가기</a>\n<noscript>'+noscript+'</noscript>');
  return h;
}

function noscriptFor(W, r, route){
  const L = (u,t)=>'<li><a href="'+esc(u)+'">'+esc(t)+'</a></li>';
  let body = "<h1>"+esc(r.title || "ABOUTMEAT")+"</h1><p>"+esc(r.desc||"")+"</p>";
  if(route === "/"){
    body += "<ul>"+W.WOW_SITUATIONS.map(s =>
      L(s.to, s.name+" — "+s.line)).join("")+"</ul>";
    body += "<ul>"+L("/sos","사장님 SOS")+L("/check","무료 사업진단")+
            L("/start","창업 프로젝트")+L("/partners","업체 찾기")+"</ul>";
  }
  if(route === "/sos"){
    body += "<ul>"+W.WOW_PROBLEMS.map(p =>
      "<li>"+esc(p.name)+(p.hint?" — "+esc(p.hint):"")+"</li>").join("")+"</ul>";
  }
  if(route === "/start"){
    body += "<ol>"+W.WOW_STARTUP_STEPS.map(s =>
      "<li>"+esc(s.name)+(s.line?" — "+esc(s.line):"")+"</li>").join("")+"</ol>";
  }
  if(route === "/partners"){
    body += W.WOW_SERVICE_GROUPS.map(g =>
      "<h2>"+esc(g.name)+"</h2><ul>"+g.items.map(it =>
        "<li>"+esc(it.name)+"</li>").join("")+"</ul>").join("");
  }
  return body;
}

/* ── vercel.json 이 Vercel 이 받아들이는 모양인가 ──────────────
   ⚠️ Vercel 은 vercel.json 을 엄격하게 검사합니다. 헤더 항목에
   key·value 말고 다른 키가 하나라도 있으면 "Invalid vercel.json" 으로
   **배포가 통째로 실패합니다.** JSON 에는 주석이 없으니 설명은
   CLAUDE.md 에 적으세요. */
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
checkVercel();
const W = loadApp();
const tpl = fs.readFileSync(path.join(ROOT,"index.html"),"utf8");
const routes = allRoutes();

let made = 0, skipped = 0;
const sitemap = [];
const wrote = new Set();
const seenTitle = new Map(), seenDesc = new Map();

for(const route of routes){
  const r = W.routeInfo(route, {});
  if(!r.ok){ console.error("  ! 알 수 없는 주소: "+route); skipped++; continue; }
  const html = shell(tpl, r, route, noscriptFor(W, r, route));

  if(route !== "/"){
    const dir = path.join(ROOT, route.replace(/^\//,""));
    fs.mkdirSync(dir, {recursive:true});
    fs.writeFileSync(path.join(dir,"index.html"), html);
    wrote.add(path.join(dir,"index.html"));
    made++;
  }
  /* "/" 는 index.html 자체라 덮어쓰지 않습니다 — 원본이 틀어집니다 */

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
const prio = r => r === "/" ? "1.0" : /^\/(sos|check|start)$/.test(r) ? "0.8" : "0.6";
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
