/* 404 페이지 — 링크가 실제로 살아 있는지, 꼬리말이 붙는지 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
(async()=>{const b=await chromium.launch();const log=[],errs=[];
 const chk=(n,g,w)=>{const ok=String(g)===String(w);log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w));if(!ok)errs.push(n);};

 const p=await b.newPage({viewport:{width:1280,height:900}});
 const perr=[]; p.on('pageerror',e=>perr.push(e.message));
 await p.goto('file:///home/user/meat-insight/404.html',{waitUntil:'load'});
 await p.waitForTimeout(1200);

 log.push('1. 화면');
 chk('제목', await p.evaluate(()=>document.title), '페이지를 찾을 수 없습니다 — 고리');
 chk('색인 제외', await p.evaluate(()=>document.querySelector('meta[name=robots]').content), 'noindex');
 chk('404 표시', await p.evaluate(()=>document.querySelector('.code').textContent), '404');
 chk('공통 꼬리말', await p.evaluate(()=>!!document.getElementById('lc-foot')), 'true');
 chk('가로 넘침 없음', await p.evaluate(()=>document.documentElement.scrollWidth>1280), 'false');

 log.push('2. 링크가 가리키는 화면이 실제로 있는지');
 const hrefs=await p.evaluate(()=>[...document.querySelectorAll('a[href^="index.html#"]')].map(a=>a.getAttribute('href').split('#/')[1]));
 const app=await b.newPage({viewport:{width:1280,height:900}});
 await app.addInitScript(FAKE+"\nwindow.__FAKE_INIT({\"user\":null});");
 await app.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});
 await app.waitForTimeout(2000);
 const pgs=await app.evaluate(()=>PGS.slice());
 for(const h of hrefs) chk('#/'+h+' 존재', String(pgs.includes(h)), 'true');

 log.push('3. 모바일');
 const m=await b.newPage({viewport:{width:390,height:844}});
 await m.goto('file:///home/user/meat-insight/404.html',{waitUntil:'load'});
 await m.waitForTimeout(1200);
 chk('가로 넘침 없음', await m.evaluate(()=>document.documentElement.scrollWidth>390), 'false');
 chk('버튼 터치 타깃 44px+', await m.evaluate(()=>[...document.querySelectorAll('.btn,.links a')]
   .every(e=>e.getBoundingClientRect().height>=44)), 'true');

 errs.push(...perr.map(e=>'404: '+e));
 console.log(log.join('\n'));
 console.log(errs.length? ('\n❌ 실패 '+errs.length+'건\n  '+errs.join('\n  ')) : '\n✅ 전체 통과');
 await b.close(); process.exit(errs.length?1:0);
})();
