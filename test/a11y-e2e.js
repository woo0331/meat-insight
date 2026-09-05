const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
const U={id:'u1',user_metadata:{name:'김철수',role:'buyer'}};
async function open(b,vp){const p=await b.newPage({viewport:vp||{width:1280,height:900},deviceScaleFactor:2});
 await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify({user:U,realtime:true})+");");
 p._errs=[];p.on('pageerror',e=>p._errs.push(e.message));
 await p.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});await p.waitForTimeout(2600);return p;}
(async()=>{const b=await chromium.launch();const log=[],errs=[];
 const chk=(n,g,w)=>{const ok=String(g)===String(w);log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w));if(!ok)errs.push(n);};
 const p=await open(b);

 log.push('1. 본문 바로가기');
 await p.keyboard.press('Tab'); await p.waitForTimeout(250);
 chk('첫 Tab 이 건너뛰기 링크', await p.evaluate(()=>document.activeElement.id), 'skip-main');
 chk('포커스 시 화면에 나타남', await p.evaluate(()=>document.getElementById('skip-main').getBoundingClientRect().top>=0), 'true');
 await p.screenshot({path:'ay-skip.png',clip:{x:0,y:0,width:640,height:180}});
 await p.keyboard.press('Enter'); await p.waitForTimeout(400);
 chk('본문으로 포커스 이동', await p.evaluate(()=>document.activeElement.classList.contains('pg')), 'true');

 log.push('2. 키보드로 카테고리 타일 사용');
 const moved = await p.evaluate(async()=>{
   const tile=[...document.querySelectorAll('[role=button]')].find(e=>/원육 구매/.test(e.textContent)&&e.getBoundingClientRect().height>0);
   if(!tile) return 'no-tile';
   tile.focus();
   const before=(document.querySelector('.pg.on')||{}).id;
   tile.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
   await new Promise(r=>setTimeout(r,700));
   return before+' → '+((document.querySelector('.pg.on')||{}).id);
 });
 log.push('  '+moved);
 chk('Enter 로 화면 이동', /pg-h → pg-(cat8|cat-|rw|reqs|suppliers)/.test(moved)||moved.split(' → ')[0]!==moved.split(' → ')[1], 'true');
 chk('tabindex 부여됨', await p.evaluate(()=>[...document.querySelectorAll('[onclick]')].filter(e=>e.getBoundingClientRect().height>0&&!/^(BUTTON|A|INPUT|SELECT|TEXTAREA|LABEL)$/.test(e.tagName)&&e.tabIndex<0).length), 0);

 log.push('3. 화면 전환 알림');
 await p.evaluate(()=>go('suppliers')); await p.waitForTimeout(500);
 chk('aria-live 갱신', await p.evaluate(()=>document.getElementById('a11y-live').textContent), '업체 찾기 화면');
 chk('main 랜드마크 하나만', await p.evaluate(()=>document.querySelectorAll('[role=main]').length), 1);
 chk('main 이 활성 화면', await p.evaluate(()=>document.querySelector('[role=main]').id), 'pg-suppliers');
 chk('h1 존재', await p.evaluate(()=>{const h=document.querySelector('.pg.on h1');return h?h.textContent:'(없음)';}), '업체 찾기');

 log.push('4. 새로 그려진 카드도 키보드 대상');
 await p.evaluate(()=>go('reqs')); await p.waitForTimeout(1200);
 chk('요청 카드 tabindex', await p.evaluate(()=>{
   const c=document.querySelector('#rq-list-full [onclick]');
   return c?c.tabIndex:'(카드없음)'; }), 0);
 await p.evaluate(()=>{const e=document.getElementById('flt-req-q');e.value='한우';e.dispatchEvent(new Event('input'));});
 await p.waitForTimeout(600);
 chk('검색 후 카드도 대상', await p.evaluate(()=>[...document.querySelectorAll('#rq-list-full [onclick]')].every(e=>e.tabIndex===0)), 'true');

 log.push('5. 포커스 링이 보여야 (실제 Tab 이동)');
 const q=await open(b);
 for(let i=0;i<6;i++){ await q.keyboard.press('Tab'); await q.waitForTimeout(120); }
 const ring = await q.evaluate(()=>{
   const e=document.activeElement;
   const s=getComputedStyle(e);
   return {w:s.outlineWidth, st:s.outlineStyle, c:s.outlineColor,
           el:e.tagName+'.'+String(e.className||'').split(' ')[0]};
 });
 // outline:none 이 걸려 있던 입력칸들도 링이 보여야 합니다 (보이는 요소만)
 const ringOf=(pg,sel)=>pg.evaluate(x=>{
   const e=[...document.querySelectorAll(x)].find(n=>n.getBoundingClientRect().height>0);
   if(!e) return '(없음)';
   e.focus(); const s=getComputedStyle(e);
   return s.outlineStyle+' '+s.outlineWidth+' '+s.outlineColor;}, sel);
 chk('  히어로 검색창 링', await ringOf(q,'.gh-s-in, .hs-input'), 'solid 3px rgb(217, 31, 58)');
 chk('  카테고리 버튼 링', await ringOf(q,'.hc-item'), 'solid 3px rgb(217, 31, 58)');
 await q.evaluate(()=>go('reqs')); await q.waitForTimeout(1100);
 chk('  목록 검색창 링', await ringOf(q,'#flt-req-q'), 'solid 3px rgb(217, 31, 58)');
 chk('  정렬 선택 링', await ringOf(q,'#flt-req-sort'), 'solid 3px rgb(217, 31, 58)');
 await q.evaluate(()=>go('h')); await q.waitForTimeout(600);
 log.push('  포커스 대상: '+ring.el);
 await q.screenshot({path:'ay-focus.png'});
 errs.push(...q._errs.map(e=>'q: '+e));
 log.push('  outline: '+ring.st+' '+ring.w+' '+ring.c);
 // Tab 이 어디에 멈추든 링은 실선이고 2px 이상이어야 합니다
 // (크림슨 버튼 위에서는 크롬이 대비를 위해 색·두께를 자동 보정합니다)
 chk('링 두께 2px 이상', parseFloat(ring.w)>=2, 'true');
 chk('링 실선', ring.st, 'solid');

 log.push('6. 화면 깨짐 없음');
 chk('가로 넘침 없음', await p.evaluate(()=>document.documentElement.scrollWidth>1280), 'false');
 const m=await open(b,{width:390,height:844});
 chk('모바일 가로 넘침 없음', await m.evaluate(()=>document.documentElement.scrollWidth>390), 'false');
 chk('건너뛰기 링크가 평소엔 안 보임', await m.evaluate(()=>document.getElementById('skip-main').getBoundingClientRect().bottom<0), 'true');
 await m.screenshot({path:'ay-mobile.png'});

 errs.push(...p._errs.map(e=>'p: '+e),...m._errs.map(e=>'m: '+e));
 console.log(log.join('\n'));
 console.log('\n오류: '+(errs.length?'\n  '+errs.join('\n  '):'없음'));
 console.log(errs.length?'\n❌ 실패 '+errs.length+'건':'\n✅ 전체 통과');
 await b.close();})();
