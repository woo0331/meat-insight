const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
const BUYER={id:'u1',email:'kim@t.com',user_metadata:{name:'김철수',role:'buyer'}};
async function open(b,user,rt){const p=await b.newPage({viewport:{width:1440,height:1000}});
 await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify({user:user,realtime:rt!==false})+");");
 p._errs=[];p.on('pageerror',e=>p._errs.push(e.message));
 await p.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});await p.waitForTimeout(1900);return p;}
(async()=>{const b=await chromium.launch();const log=[],errs=[];
 const chk=(n,g,w)=>{const ok=String(g)===String(w);log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w));if(!ok)errs.push(n);};

 log.push('1. 구독 등록');
 let p=await open(b,BUYER);
 chk('알림 구독', await p.evaluate(()=>window.__RT.some(c=>c.subs.some(s=>s.opt.table==='notifications'))), 'true');
 chk('구독 연결됨', await p.evaluate(()=>GORI.LIVE.connected), 'true');

 log.push('2. 새 알림이 즉시 반영');
 const before = await p.evaluate(()=>window.__DB.notifications.filter(n=>n.user_id==='u1').length);
 await p.evaluate(async()=>{ await GORI.pushNotif('u1','quote','새 견적이 도착했습니다','합신식이 견적을 보냈습니다','req:r1'); });
 await p.waitForTimeout(600);
 chk('알림 목록 증가', await p.evaluate(()=>{gToggleNotif();return document.querySelectorAll('#notif-panel .nt').length;}), before+1);
 chk('종 배지 표시', await p.evaluate(()=>{const d=document.getElementById('gh-bell-dot');return d?!d.hidden:'(없음)';}), 'true');
 chk('토스트', await p.evaluate(()=>/새 견적이 도착했습니다/.test(document.body.textContent)), 'true');
 chk('남의 알림은 무시', await p.evaluate(async()=>{
   const n0=document.querySelectorAll('#notif-panel .nt').length;
   await GORI.pushNotif('u9','quote','남의 알림','x','req:r1');
   await new Promise(r=>setTimeout(r,400));
   gToggleNotif();gToggleNotif();
   return document.querySelectorAll('#notif-panel .nt').length===n0;}), 'true');

 log.push('3. 알림 클릭 → 해당 화면 (location.hash 직접 조작 제거)');
 await p.evaluate(()=>{const p2=document.getElementById('notif-panel');if(!p2.classList.contains('on'))gToggleNotif();});
 await p.waitForTimeout(200);
 await p.evaluate(()=>document.querySelector('#notif-panel .nt').click());
 await p.waitForTimeout(1200);
 chk('요청 상세로', await p.evaluate(()=>(document.querySelector('.pg.on')||{}).id), 'pg-reqd');
 chk('URL 정상', await p.evaluate(()=>location.hash), '#/req/r1');

 log.push('4. 보고 있는 요청에 새 견적 도착');
 const q0 = await p.evaluate(()=>document.querySelectorAll('#q-list .qc').length);
 await p.evaluate(async()=>{ await GORI.insertSafe('quotes',{request_id:'r1',supplier_id:'s3',supplier_name:'대성기계',
   user_id:'u7',price:18800000,price_unit:'총액',lead_time:'3일',contact:'053-222-2222',status:'대기'}); });
 await p.waitForTimeout(900);
 const q1 = await p.evaluate(()=>document.querySelectorAll('#q-list .qc').length);
 log.push('  견적 카드 '+q0+' → '+q1);
 chk('새 견적 즉시 반영', q1, q0+1);
 chk('새 업체 표시', await p.evaluate(()=>/대성기계/.test(document.getElementById('q-list').textContent)), 'true');
 chk('요약바 갱신', await p.evaluate(()=>document.querySelector('.qbar-v').textContent), String(q0+1));

 log.push('5. 다른 화면으로 나가면 구독 해제');
 await p.evaluate(()=>go('suppliers')); await p.waitForTimeout(500);
 chk('견적 구독 해제', await p.evaluate(()=>window.__RT.some(c=>c.subs.some(s=>s.opt.table==='quotes'))), 'false');
 chk('알림 구독 유지', await p.evaluate(()=>window.__RT.some(c=>c.subs.some(s=>s.opt.table==='notifications'))), 'true');

 log.push('6. 채팅 새 메시지');
 await p.evaluate(()=>gOpenRequest('r1')); await p.waitForTimeout(1100);
 await p.evaluate(()=>{const c=document.querySelector('.qc-chat'); if(c) c.click();}); await p.waitForTimeout(1200);
 chk('채팅 화면', await p.evaluate(()=>(document.querySelector('.pg.on')||{}).id), 'pg-chat');
 chk('채팅 구독', await p.evaluate(()=>window.__RT.some(c=>c.subs.some(s=>s.opt.table==='chat_messages'))), 'true');
 const m0 = await p.evaluate(()=>document.querySelectorAll('.chat-bub').length);
 await p.evaluate(async()=>{ await GORI.insertSafe('chat_messages',{room_id:GORI.CHAT.cur.id,sender_id:'u9',
   sender_name:'합신식 도축장',body:'네, 300kg 냉장 가능합니다.',kind:'text'}); });
 await p.waitForTimeout(1000);
 chk('상대 메시지 즉시 표시', await p.evaluate(()=>document.querySelectorAll('.chat-bub').length), m0+1);
 chk('내용 표시', await p.evaluate(()=>/300kg 냉장 가능합니다/.test(document.getElementById('chat-body').textContent)), 'true');
 await p.evaluate(()=>{gCloseChat();go('h');}); await p.waitForTimeout(400);
 chk('채팅 구독 해제', await p.evaluate(()=>window.__RT.some(c=>c.subs.some(s=>s.opt.table==='chat_messages'))), 'false');

 log.push('7. Realtime 을 켜지 않은 환경 (SQL 미실행)');
 let n=await open(b,BUYER,false);
 await n.evaluate(()=>gOpenRequest('r1')); await n.waitForTimeout(1100);
 const nq0=await n.evaluate(()=>document.querySelectorAll('#q-list .qc').length);
 await n.evaluate(async()=>{ await GORI.insertSafe('quotes',{request_id:'r1',supplier_name:'무반응테스트',
   user_id:'u7',price:1,price_unit:'총액',status:'대기'}); });
 await n.waitForTimeout(800);
 chk('실시간 반영 없음(정상)', await n.evaluate(()=>document.querySelectorAll('#q-list .qc').length), nq0);
 chk('오류 없이 동작', n._errs.length, 0);
 await n.evaluate(()=>gOpenRequest('r1')); await n.waitForTimeout(1100);
 chk('다시 열면 보임', await n.evaluate(()=>/무반응테스트/.test(document.getElementById('q-list').textContent)), 'true');

 [p,n].forEach((x,i)=>errs.push(...x._errs.map(e=>'p'+i+': '+e)));
 console.log(log.join('\n'));
 console.log('\n오류: '+(errs.length?'\n  '+errs.join('\n  '):'없음'));
 console.log(errs.length?'\n❌ 실패 '+errs.length+'건':'\n✅ 전체 통과');
 await b.close();})();
