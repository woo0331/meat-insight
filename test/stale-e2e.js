const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
const U={id:'u1',user_metadata:{name:'김철수',role:'buyer'}};
async function open(b,user){const p=await b.newPage({viewport:{width:1280,height:900},deviceScaleFactor:2});
 await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify({user:user===undefined?U:user,realtime:true})+");");
 p._errs=[];p.on('pageerror',e=>p._errs.push(e.message));p.on('dialog',d=>d.accept());
 await p.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});await p.waitForTimeout(2700);return p;}
(async()=>{const b=await chromium.launch();const log=[],errs=[];
 const chk=(n,g,w)=>{const ok=String(g)===String(w);log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w));if(!ok)errs.push(n);};
 const p=await open(b);

 log.push('1. 목록 — 아주 오래된 요청은 접힘');
 await p.evaluate(()=>go('reqs')); await p.waitForTimeout(1200);
 const titles=await p.evaluate(()=>[...document.querySelectorAll('#rq-list-full .rc-list > *')].map(e=>e.textContent.replace(/\s+/g,' ').slice(0,40)));
 log.push('  보이는 카드 '+titles.length+'개');
 chk('200일 된 요청 숨김', await p.evaluate(()=>/아주 오래됨/.test(document.getElementById('rq-list-full').textContent)), 'false');
 chk('45일 된 요청은 보임', await p.evaluate(()=>/오래된 요청/.test(document.getElementById('rq-list-full').textContent)), 'true');
 chk('접힘 안내', await p.evaluate(()=>{const e=document.getElementById('stl-more');return e?/90일이 지난 요청 1건은 접어두었습니다/.test(e.textContent):'(없음)';}), 'true');
 chk('경과 뱃지', await p.evaluate(()=>[...document.querySelectorAll('#rq-list-full .stl-tag')].map(e=>e.textContent).join(',')), '45일 지남');

 log.push('2. 모두 보기 토글');
 await p.evaluate(()=>gStlToggle()); await p.waitForTimeout(900);
 chk('200일 요청 노출', await p.evaluate(()=>/아주 오래됨/.test(document.getElementById('rq-list-full').textContent)), 'true');
 chk('되돌리기 안내', await p.evaluate(()=>/최근 것만 보기/.test(document.getElementById('stl-more').textContent)), 'true');
 chk('뱃지 2개', await p.evaluate(()=>document.querySelectorAll('#rq-list-full .stl-tag').length), 2);
 chk('홈 위젯도 같은 기준', await p.evaluate(()=>{go('h');return 1;}), 1);
 await p.waitForTimeout(900);
 chk('홈에서도 200일 요청 노출(토글 켬)', await p.evaluate(()=>/아주 오래됨/.test(document.getElementById('rq-widget').textContent)), 'true');
 await p.evaluate(()=>{gStlToggle();go('h');}); await p.waitForTimeout(900);
 chk('홈에서 200일 요청 접힘', await p.evaluate(()=>/아주 오래됨/.test(document.getElementById('rq-widget').textContent)), 'false');
 // showOld=false 인 상태에서 목록으로 돌아와 개수를 확인합니다
 await p.evaluate(()=>go('reqs')); await p.waitForTimeout(1000);
 chk('다시 접힘', await p.evaluate(()=>document.querySelectorAll('#rq-list-full .rc-list > *').length), titles.length);
 chk('토글 상태', await p.evaluate(()=>GORI.STL?GORI.STL.showOld:'(미노출)'), 'false');

 log.push('3. 상세 — 업체에게 보이는 안내');
 await p.evaluate(()=>gOpenRequest('r-old')); await p.waitForTimeout(1300);
 chk('오래됨 안내', await p.evaluate(()=>{const e=document.querySelector('.stl-note');return e?/^45일 전에 올라온 요청입니다/.test(e.textContent.replace(/\s+/g,' ').trim()):'(없음)';}), 'true');
 chk('확인 권유 문구', await p.evaluate(()=>/아직 필요한지 확인/.test(document.querySelector('.stl-note').textContent)), 'true');

 log.push('4. 상세 — 본인 요청이면 마감 권유');
 const own=await open(b,{id:'u3',user_metadata:{name:'옛구매',role:'buyer'}});
 await own.evaluate(()=>gOpenRequest('r-old')); await own.waitForTimeout(1300);
 chk('마감 권유', await own.evaluate(()=>/마감해 주세요/.test((document.querySelector('.stl-note')||{}).textContent||'')), 'true');
 chk('마감 버튼 있음', await own.evaluate(()=>[...document.querySelectorAll('#pg-reqd button')].some(e=>/마감하기/.test(e.textContent))), 'true');
 await own.screenshot({path:'stl-detail.png'});

 log.push('5. 최근 요청에는 아무 표시 없어야');
 await p.evaluate(()=>gOpenRequest('r1')); await p.waitForTimeout(1300);
 chk('안내 없음', await p.evaluate(()=>!document.querySelector('.stl-note')), 'true');

 log.push('6. 마감된 오래된 요청은 접지 않음(상태가 이미 명확)');
 const c=await open(b);
 await c.evaluate(async()=>{ await GORI.updateSafe('purchase_requests',{status:'마감'},'id','r-ancient'); });
 await c.evaluate(()=>{ if(typeof loadFromDB==='function') loadFromDB(); }); await c.waitForTimeout(1400);
 await c.evaluate(()=>go('reqs')); await c.waitForTimeout(1100);
 chk('마감된 오래된 요청 노출', await c.evaluate(()=>/아주 오래됨/.test(document.getElementById('rq-list-full').textContent)), 'true');

 [p,own,c].forEach((x,i)=>errs.push(...x._errs.map(e=>'p'+i+': '+e)));
 console.log(log.join('\n'));
 console.log('\n오류: '+(errs.length?'\n  '+errs.join('\n  '):'없음'));
 console.log(errs.length?'\n❌ 실패 '+errs.length+'건':'\n✅ 전체 통과');
 await b.close();})();
