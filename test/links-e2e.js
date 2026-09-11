/* ════════════════════════════════════════════════════════════════════
   가리키는 곳이 실제로 있는가 — 링크 · 사이트맵 · robots · manifest

   sitemap.xml 에 저장소에 없는 meat_insight_partner.html 이 올라가
   있었습니다. 검색엔진은 그 주소를 물고 가서 404 를 받습니다 —
   화면에서는 아무 일도 안 일어나니 눈으로는 영영 안 보입니다.

   "없는 것을 보여주지 않는다" 가 링크에도 걸립니다. 브라우저가
   필요 없는 검사라 playwright 없이 돌아갑니다.
   ════════════════════════════════════════════════════════════════════ */
const fs=require("fs"), path=require("path");
const ROOT=path.join(__dirname,"..");
const log=[], errs=[];
const chk=(n,g,w)=>{const ok=String(g)===String(w);
  log.push((ok?"  ✅ ":"  ❌ ")+n+": "+g+(ok?"":"  ← 기대 "+w)); if(!ok)errs.push(n);};

const has=(p)=>fs.existsSync(path.join(ROOT, String(p).replace(/^\//,"")));
const read=(f)=>fs.readFileSync(path.join(ROOT,f),"utf8");

log.push("1. HTML 안의 상대 링크");
const htmls=fs.readdirSync(ROOT).filter(f=>f.endsWith(".html"));
chk("HTML 파일이 있다", htmls.length>0, "true");
const dead=[];
htmls.forEach(f=>{
  const s=read(f);
  const seen=new Set();
  (s.match(/(?:href|src)\s*=\s*"[^"]+"/g)||[]).forEach(m=>{
    const u=m.replace(/^[^"]*"/,"").replace(/"$/,"");
    if(/^(https?:|\/\/|#|mailto:|tel:|data:|javascript:)/i.test(u)) return;
    const p=u.split("#")[0].split("?")[0];
    if(!p || seen.has(p)) return; seen.add(p);
    if(!has(p)) dead.push(f+" → "+u);
  });
});
chk("깨진 링크 없음", dead.join(" / "), "");

log.push("2. sitemap.xml");
const sm=read("sitemap.xml");
const locs=(sm.match(/<loc>([^<]+)<\/loc>/g)||[]).map(x=>x.replace(/<\/?loc>/g,""));
chk("주소가 하나 이상", locs.length>0, "true");
const smDead=locs.filter(u=>{
  const p=u.replace(/^https?:\/\/[^/]+\//,"");
  return p && !has(p);
});
chk("없는 파일 없음", smDead.join(" / "), "");
chk("모두 우리 도메인", locs.every(u=>/^https:\/\/aboutmeat\.co\.kr\//.test(u)), "true");
/* 색인하지 않기로 한 화면이 사이트맵에 있으면 서로 어긋납니다 */
const robots=read("robots.txt");
const blocked=(robots.match(/^Disallow:\s*(\S+)/gm)||[]).map(x=>x.replace(/^Disallow:\s*/,""));
chk("robots 와 어긋나지 않음",
  locs.filter(u=>blocked.some(b=>u.endsWith(b))).join(" / "), "");

log.push("3. robots.txt");
chk("사이트맵을 가리킴", /Sitemap:\s*https:\/\/aboutmeat\.co\.kr\/sitemap\.xml/.test(robots), "true");
/* 이미 지운 파일을 계속 막고 있으면, 목록이 낡았다는 뜻입니다 */
chk("막아 둔 파일이 실제로 있음", blocked.filter(b=>!has(b)).join(" / "), "");

log.push("4. manifest.json");
const mf=JSON.parse(read("manifest.json"));
chk("아이콘이 다 있음", (mf.icons||[]).filter(i=>!has(i.src)).map(i=>i.src).join(" / "), "");
chk("start_url 이 있음", !mf.start_url || has(mf.start_url.split("#")[0].split("?")[0]) || mf.start_url==="/", "true");

log.push("5. 공유 이미지 (og:image)");
const idx=read("index.html");
const og=(idx.match(/property="og:image"\s+content="([^"]+)"/)||[])[1]||"";
chk("og:image 주소가 있음", !!og, "true");
chk("og 이미지 파일이 있음", has(og.replace(/^https?:\/\/[^/]+\//,"")), "true");

console.log(log.join("\n"));
console.log(errs.length ? "❌ "+errs.length+"건 실패: "+errs.join(", ") : "✅ 전체 통과");
process.exit(errs.length?1:0);
