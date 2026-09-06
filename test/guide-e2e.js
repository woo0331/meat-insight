/* 이용 가이드 · FAQ — 라우팅, 탭, 진입 경로, 없는 기능을 광고하지 않는지 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
async function open(b,vp){const p=await b.newPage({viewport:vp||{width:1440,height:1000}});
 await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify({user:null})+");");
 p._errs=[];p.on('pageerror',e=>p._errs.push(e.message));
 await p.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});await p.waitForTimeout(1900);return p;}

(async()=>{const b=await chromium.launch();const log=[],errs=[];
 const chk=(n,g,w)=>{const ok=String(g)===String(w);log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w));if(!ok)errs.push(n);};

 log.push('1. 페이지와 주소');
 const p=await open(b);
 await p.evaluate(()=>gOpenGuide()); await p.waitForTimeout(700);
 chk('가이드 화면', await p.evaluate(()=>(document.querySelector('.pg.on')||{}).id), 'pg-guide');
 chk('URL', await p.evaluate(()=>location.hash), '#/guide');
 chk('4단계', await p.evaluate(()=>document.querySelectorAll('#guide-body .gu-step').length), '4');
 chk('FAQ 9개', await p.evaluate(()=>document.querySelectorAll('#guide-body .gu-faq').length), '9');

 log.push('2. 탭 — 요청하는 분 / 업체');
 chk('기본은 요청하는 분', await p.evaluate(()=>document.querySelector('.gu-tab.on').textContent), '요청하는 분');
 chk('구매자 1단계', await p.evaluate(()=>document.querySelector('.gu-step .gu-t').textContent), '필요한 것을 올립니다');
 await p.evaluate(()=>gGuideTab('sup')); await p.waitForTimeout(400);
 chk('업체 탭', await p.evaluate(()=>document.querySelector('.gu-tab.on').textContent), '업체로 참여하는 분');
 chk('업체 1단계', await p.evaluate(()=>document.querySelector('.gu-step .gu-t').textContent), '업체를 등록합니다');
 chk('업체 탭 CTA', await p.evaluate(()=>[...document.querySelectorAll('#guide-body .gbtn')].some(e=>e.textContent==='업체 등록하기')), 'true');

 log.push('3. 없는 기능을 광고하지 않음');
 const txt=await p.evaluate(()=>document.getElementById('guide-body').textContent);
 chk('안전결제는 준비 중이라고 말함', String(/안전결제\(고리페이\)는 아직 만들어지지 않았습니다/.test(txt)), 'true');
 chk('대금은 직접 주고받는다고 밝힘', String(/대금은 요청자와 업체가 직접 주고받습니다/.test(txt)), 'true');
 chk('시세를 지어내지 않는다고 밝힘', String(/임의로 만들어 내지 않습니다/.test(txt)), 'true');

 log.push('4. 진입 경로');
 await p.evaluate(()=>go('h')); await p.waitForTimeout(700);
 chk('홈 프로세스에 링크', await p.evaluate(()=>!!document.querySelector('.gu-more')), 'true');
 chk('상단 메뉴', await p.evaluate(()=>[...document.querySelectorAll('.hdr-nav a')].some(e=>e.textContent==='이용 가이드')), 'true');
 chk('푸터', await p.evaluate(()=>[...document.querySelectorAll('.ft-ul li')].some(e=>e.textContent==='이용 가이드')), 'true');
 chk('모바일 메뉴', await p.evaluate(()=>[...document.querySelectorAll('.mm-row a')].some(e=>e.textContent==='이용 가이드')), 'true');

 log.push('5. 새로고침해도 가이드로 복원');
 await p.goto('file:///home/user/meat-insight/index.html#/guide',{waitUntil:'load'});
 await p.waitForTimeout(2000);
 chk('복원', await p.evaluate(()=>(document.querySelector('.pg.on')||{}).id), 'pg-guide');
 chk('내용 그려짐', await p.evaluate(()=>document.querySelectorAll('#guide-body .gu-step').length>0), 'true');

 log.push('6. 모바일 가로 넘침 없음');
 const m=await b.newPage({viewport:{width:390,height:844}});
 await m.addInitScript(FAKE+"\nwindow.__FAKE_INIT({\"user\":null});");
 await m.goto('file:///home/user/meat-insight/index.html#/guide',{waitUntil:'load'});
 await m.waitForTimeout(2000);
 chk('가로 넘침', await m.evaluate(()=>document.documentElement.scrollWidth>390), 'false');

 log.push('7. 상단 메뉴가 줄바꿈되지 않음 (이용 가이드를 넣으면서 좁아졌습니다)');
 for(const w of [1440,1280,1201,1200,1100]){
   const h=await b.newPage({viewport:{width:w,height:900}});
   await h.addInitScript(FAKE+"\nwindow.__FAKE_INIT({\"user\":{\"id\":\"u9\",\"user_metadata\":{\"name\":\"합신식\",\"role\":\"supplier\"}}});");
   await h.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});
   await h.waitForTimeout(2100);
   const r=await h.evaluate(()=>{
     const twoLine=e=>{const t=[...e.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());
       if(!t) return false; const g=document.createRange(); g.selectNodeContents(t);
       return g.getClientRects().length>1;};
     return {
       nav:!!document.querySelector('.hdr-nav').offsetParent,
       burger:!!document.querySelector('.hdr-burger').offsetParent,
       wrapped:[...document.querySelectorAll('.hdr-nav a,.hdr-actions button,.hdr-actions span')]
         .filter(e=>e.offsetParent&&twoLine(e)).map(e=>e.textContent.trim()).join('|')};
   });
   chk(w+'px 줄바꿈 없음', r.wrapped||'없음', '없음');
   chk(w+'px 메뉴 또는 햄버거', String(r.nav!==r.burger), 'true');
   await h.close();
 }

 errs.push(...p._errs.map(e=>'guide: '+e));
 console.log(log.join('\n'));
 console.log(errs.length? ('\n❌ 실패 '+errs.length+'건\n  '+errs.join('\n  ')) : '\n✅ 전체 통과');
 await b.close(); process.exit(errs.length?1:0);
})();
