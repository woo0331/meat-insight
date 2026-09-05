const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http=require('http'), fs=require('fs'), path=require('path');
const ROOT='/home/user/meat-insight';
const FAKE=fs.readFileSync('./fake-sb.js','utf8');
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
 '.json':'application/json; charset=utf-8','.png':'image/png','.xml':'application/xml','.txt':'text/plain; charset=utf-8'};
const srv=http.createServer((rq,rs)=>{
  let u=decodeURIComponent(rq.url.split('?')[0]);
  if(u==='/') u='/index.html';
  const f=path.join(ROOT,u);
  if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){rs.writeHead(404);rs.end('nope');return;}
  rs.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});
  rs.end(fs.readFileSync(f));
});
const PORT=8731;
(async()=>{
 await new Promise(r=>srv.listen(PORT,r));
 const BASE='http://localhost:'+PORT+'/';
 const b=await chromium.launch();
 const log=[],errs=[];
 const chk=(n,g,w)=>{const ok=String(g)===String(w);log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w));if(!ok)errs.push(n);};

 const ctx=await b.newContext({viewport:{width:390,height:844}});
 const p=await ctx.newPage();
 await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify({user:null,realtime:true})+");");
 p.on('pageerror',e=>errs.push('page: '+e.message));
 await p.goto(BASE,{waitUntil:'load'}); await p.waitForTimeout(2600);

 log.push('1. 설치 요건');
 chk('manifest 링크', await p.evaluate(()=>!!document.querySelector('link[rel=manifest]')), 'true');
 const mf = await p.evaluate(async()=>{const r=await fetch('/manifest.json');return await r.json();});
 chk('앱 이름', mf.short_name, '고리');
 chk('display', mf.display, 'standalone');
 chk('아이콘 3종', mf.icons.length, 3);
 chk('maskable 포함', mf.icons.some(i=>i.purpose==='maskable'), 'true');
 chk('바로가기 4개', mf.shortcuts.length, 4);
 chk('바로가기 URL 해시 라우팅', mf.shortcuts.map(s=>s.url).join(','), '/#/rw,/#/suppliers,/#/daily,/#/my');
 chk('theme-color 하나만', await p.evaluate(()=>document.querySelectorAll('meta[name=theme-color]').length), 1);
 chk('theme-color 값', await p.evaluate(()=>document.querySelector('meta[name=theme-color]').content), '#FFFFFF');
 chk('apple-touch-icon', await p.evaluate(()=>!!document.querySelector('link[rel=apple-touch-icon]')), 'true');
 for(const i of mf.icons.concat([{src:'/apple-touch-icon.png'}])){
   const st=await p.evaluate(async u=>{const r=await fetch(u);return r.status;}, i.src);
   chk('  아이콘 '+i.src, st, 200);
 }

 log.push('2. 서비스 워커');
 await p.waitForTimeout(1500);
 chk('등록됨', await p.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();return !!r;}), 'true');
 chk('활성화', await p.evaluate(async()=>{const r=await navigator.serviceWorker.ready;return !!r.active;}), 'true');

 log.push('3. 네트워크 우선 — 새 파일이 캐시에 막히지 않아야');
 const before = await p.evaluate(async()=>{const r=await fetch('/site-info.js');return (await r.text()).length;});
 fs.appendFileSync(ROOT+'/site-info.js', "\n/* __PWA_TEST__ */\n");
 await p.reload({waitUntil:'load'}); await p.waitForTimeout(1800);
 const after = await p.evaluate(async()=>{const r=await fetch('/site-info.js');return (await r.text()).includes('__PWA_TEST__');});
 chk('바뀐 파일이 바로 반영', after, 'true');
 fs.writeFileSync(ROOT+'/site-info.js', fs.readFileSync(ROOT+'/site-info.js','utf8').replace("\n/* __PWA_TEST__ */\n",""));

 log.push('4. 오프라인 — 캐시로 열려야');
 await ctx.setOffline(true);
 const off=await p.evaluate(async()=>{try{const r=await fetch('/index.html');return r.status;}catch(e){return 'throw';}});
 chk('오프라인에서도 응답', off, 200);
 await ctx.setOffline(false);

 log.push('5. 홈 화면 추가 안내');
 await p.evaluate(()=>{
   var ev=new Event('beforeinstallprompt');
   ev.prompt=function(){ window.__PROMPTED=true; };
   ev.userChoice=Promise.resolve({outcome:'accepted'});
   window.dispatchEvent(ev);
 });
 await p.waitForTimeout(1800);
 chk('배너 표시', await p.evaluate(()=>!!document.getElementById('a2hs')), 'true');
 chk('문구', await p.evaluate(()=>document.querySelector('.a2hs-tx b').textContent), '고리를 홈 화면에 추가하세요');
 chk('가로 넘침 없음', await p.evaluate(()=>document.documentElement.scrollWidth>390), 'false');
 chk('하단 네비 안 가림', await p.evaluate(()=>{
   const a=document.getElementById('a2hs').getBoundingClientRect();
   const n=document.querySelector('.bnav').getBoundingClientRect();
   return a.bottom<=n.top+1; }), 'true');
 await p.screenshot({path:'pwa-banner.png'});
 await p.evaluate(()=>gA2HSInstall()); await p.waitForTimeout(600);
 chk('설치 프롬프트 호출', await p.evaluate(()=>!!window.__PROMPTED), 'true');
 chk('배너 사라짐', await p.evaluate(()=>!document.getElementById('a2hs')), 'true');
 chk('30일 스누즈 저장', await p.evaluate(()=>!!localStorage.getItem('gori.a2hs')), 'true');

 log.push('6. 닫은 뒤에는 다시 안 뜸');
 await p.reload({waitUntil:'load'}); await p.waitForTimeout(2400);
 await p.evaluate(()=>{var ev=new Event('beforeinstallprompt');ev.prompt=function(){};ev.userChoice=Promise.resolve({outcome:'dismissed'});window.dispatchEvent(ev);});
 await p.waitForTimeout(1800);
 chk('배너 없음', await p.evaluate(()=>!document.getElementById('a2hs')), 'true');

 log.push('7. robots / sitemap');
 for(const [u,must] of [['/robots.txt','Sitemap: https://aboutmeat.co.kr/sitemap.xml'],['/sitemap.xml','<loc>https://aboutmeat.co.kr/</loc>']]){
   const t=await p.evaluate(async x=>{const r=await fetch(x);return r.ok?await r.text():'ERR';},u);
   chk(u, t.includes(must), 'true');
 }
 chk('robots 관리자 차단', await p.evaluate(async()=>{const r=await fetch('/robots.txt');return (await r.text()).includes('Disallow: /admin.html');}), 'true');

 log.push('8. 사이트 기본 동작 유지');
 chk('홈 렌더', await p.evaluate(()=>(document.querySelector('.pg.on')||{}).id), 'pg-h');
 await p.evaluate(()=>go('suppliers')); await p.waitForTimeout(600);
 chk('라우팅', await p.evaluate(()=>location.hash), '#/suppliers');

 console.log(log.join('\n'));
 console.log('\n오류: '+(errs.length?'\n  '+errs.join('\n  '):'없음'));
 console.log(errs.length?'\n❌ 실패 '+errs.length+'건':'\n✅ 전체 통과');
 await b.close(); srv.close();
})();
