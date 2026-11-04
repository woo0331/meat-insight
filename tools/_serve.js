/* ════════════════════════════════════════════════════════════════════
   검사용 정적 서버 — **운영과 같은 헤더를 보냅니다**

   ⚠️⚠️ **이것이 있는 까닭.** 처음에는 헤더 없이 섬겼습니다. 그래서
   vercel.json 의 CSP 가 connect-src 'self' 인 것을 **아무 검사도 못
   잡았습니다** — 배포하면 브라우저가 Supabase 로 가는 요청을 전부
   막아 로그인 · 입점 신청 · 관리자가 통째로 죽는데, 로컬에서는 영원히
   초록입니다. 검사 서버가 운영과 **다른 환경**이면 그런 고장은 배포
   뒤에야 보입니다.

   ⚠️ cleanUrls:true 와 같게 — 폴더면 그 안의 index.html 을 섬깁니다.
   ⚠️⚠️ **가로채기(route)는 CSP 를 피하지 못합니다.** 제가 처음에 그렇게
      적었는데 틀렸습니다 — CSP 는 요청이 네트워크로 나가기 **전에**
      브라우저가 막습니다. 그래서 검사의 가짜 Supabase 주소도 운영
      CSP 가 **허락하는 꼴**이어야 합니다 (https://*.supabase.co).
      이것이 오히려 맞습니다: CSP 를 좁히면 검사가 같이 떨어집니다.
   ════════════════════════════════════════════════════════════════════ */
const fs = require("fs"), path = require("path"), http = require("http");
const ROOT = path.join(__dirname, "..");

const TYPE = {
  ".html":"text/html;charset=utf-8", ".css":"text/css;charset=utf-8",
  ".js":"text/javascript;charset=utf-8", ".json":"application/json;charset=utf-8",
  ".svg":"image/svg+xml", ".png":"image/png", ".ico":"image/x-icon",
  ".xml":"application/xml;charset=utf-8", ".txt":"text/plain;charset=utf-8",
  /* ⚠️⚠️⚠️ **사진 종류가 빠져 있었습니다** (2026-11-04 에 찾았습니다).
     여기 없는 확장자는 `application/octet-stream` 으로 나갑니다 —
     브라우저가 내용을 보고 알아서 그려 주므로 **눈으로는 멀쩡**하고,
     그래서 지금까지 아무 검사도 안 잡았습니다. 그런데 운영(Vercel)은
     `image/jpeg` · `image/webp` 를 제대로 보냅니다.
     ⚠️ `<picture>` 의 `<source type="image/webp">` 는 **그 헤더로**
     갈리는 자리입니다 — 검사 서버가 다른 말을 하면, 여기서는
     "webp 를 받았다" 가 나와도 운영에서는 다를 수 있습니다 (그 반대도).
     작업 기억의 "검사 서버가 운영과 같은 헤더를 보내야 합니다" 가
     바로 이 자리입니다. */
  ".jpg":"image/jpeg", ".jpeg":"image/jpeg",
  ".webp":"image/webp", ".avif":"image/avif"
};

/* vercel.json 의 headers 를 그대로 읽습니다 — 두 곳에 적지 않습니다 */
function rules(){
  const v = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8"));
  return (v.headers || []).map(function(h){
    let re;
    try{ re = new RegExp("^" + h.source + "$"); }
    catch(e){ re = { test: function(){ return false; } }; }
    return { re: re, list: h.headers || [] };
  });
}
const RULES = rules();

function apply(res, urlPath){
  RULES.forEach(function(r){
    if(r.re.test(urlPath))
      r.list.forEach(function(h){ res.setHeader(h.key, h.value); });
  });
}

/* port 를 주면 그 포트, 안 주면 비어 있는 포트를 고릅니다 */
function serve(port){
  const s = http.createServer(function(q, r){
    const u = decodeURIComponent(q.url.split("?")[0]);
    let f = path.join(ROOT, u === "/" ? "index.html" : u);
    if(!fs.existsSync(f) && fs.existsSync(f + ".html")) f = f + ".html";
    if(fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
    apply(r, u);
    if(!fs.existsSync(f) || fs.statSync(f).isDirectory()){
      r.writeHead(404, { "Content-Type":"text/html;charset=utf-8" });
      return r.end("404");
    }
    r.setHeader("Content-Type", TYPE[path.extname(f)] || "application/octet-stream");
    r.writeHead(200);
    r.end(fs.readFileSync(f));
  });
  return new Promise(function(done){
    s.listen(port || 0, function(){ done({ srv: s, port: s.address().port }); });
  });
}

/* 화면에서 난 CSP 거절 · 에러를 모읍니다 — 부르는 쪽이 끝에 셉니다 */
function watch(page){
  const hits = [];
  page.on("console", function(m){
    const t = m.text();
    if(/Content Security Policy|CSP/i.test(t)) hits.push("CSP: " + t.slice(0, 160));
  });
  page.on("pageerror", function(e){ hits.push("에러: " + String(e).slice(0, 160)); });
  return hits;
}

module.exports = { serve: serve, watch: watch, ROOT: ROOT };
