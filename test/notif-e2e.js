const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
const BUYER={id:'u1',user_metadata:{name:'김철수',role:'buyer'}};
async function open(b,vp){const p=await b.newPage({viewport:vp||{width:1400,height:1000}});
 await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify({user:BUYER,realtime:true})+");");
 p._errs=[];p.on('pageerror',e=>p._errs.push(e.message));
 await p.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});await p.waitForTimeout(2100);return p;}
(async()=>{const b=await chromium.launch();const log=[],errs=[];
 const chk=(n,g,w)=>{const ok=String(g)===String(w);log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w));if(!ok)errs.push(n);};

 log.push('1. 하단 네비 미읽음 표시 (모바일)');
 let m=await open(b,{width:390,height:844});
 chk('점 표시', await m.evaluate(()=>{const d=document.querySelector('#bn-my .bni-dot');return d?d.textContent:'(없음)';}), '1');
 await m.evaluate(async()=>{ for(let i=0;i<3;i++) await GORI.pushNotif('u1','quote','새 견적 '+i,'본문','req:r1'); });
 await m.waitForTimeout(900);
 chk('실시간 증가', await m.evaluate(()=>document.querySelector('#bn-my .bni-dot').textContent), '4');
 await m.evaluate(async()=>{ for(let i=0;i<8;i++) await GORI.pushNotif('u1','quote','더 '+i,'본문',''); });
 await m.waitForTimeout(1100);
 chk('9 넘으면 9+', await m.evaluate(()=>document.querySelector('#bn-my .bni-dot').textContent), '9+');
 await m.screenshot({path:'nt-nav.png'});

 log.push('2. 전체 읽음');
 let p=await open(b);
 const before=await p.evaluate(()=>window.__DB.notifications.filter(n=>n.user_id==='u1'&&!n.is_read).length);
 log.push('  읽지 않은 알림 '+before+'건');
 await p.evaluate(()=>gToggleNotif()); await p.waitForTimeout(400);
 chk('패널 열림', await p.evaluate(()=>document.getElementById('notif-panel').classList.contains('on')), 'true');
 chk('전체 읽음 버튼', await p.evaluate(()=>!!document.querySelector('.nt-all')), 'true');
 chk('안읽음 항목', await p.evaluate(()=>document.querySelectorAll('#notif-panel .nt.unread').length), before);
 await p.evaluate(()=>gReadAllNotifs()); await p.waitForTimeout(1100);
 chk('DB 반영', await p.evaluate(()=>window.__DB.notifications.filter(n=>n.user_id==='u1'&&!n.is_read).length), 0);
 chk('종 배지 사라짐(채팅 미읽음 0일 때)', await p.evaluate(()=>{
   const d=document.getElementById('gh-bell-dot');
   const cu=(typeof GORI.chatUnread==='function')?GORI.chatUnread():0;
   return cu>0 ? '채팅 '+cu+'건 남아 표시 유지' : d.hidden; }), 'true');
 chk('네비 점 사라짐', await p.evaluate(()=>!document.querySelector('#bn-my .bni-dot')), 'true');
 chk('안내 토스트', await p.evaluate(()=>/읽음으로 표시했습니다/.test(document.body.textContent)), 'true');
 await p.evaluate(()=>gReadAllNotifs()); await p.waitForTimeout(500);
 chk('없을 때 안내', await p.evaluate(()=>/읽지 않은 알림이 없습니다/.test(document.body.textContent)), 'true');

 log.push('3. 개별 클릭도 그대로 동작');
 let p2=await open(b);
 await p2.evaluate(()=>gToggleNotif()); await p2.waitForTimeout(400);
 await p2.evaluate(()=>document.querySelector('#notif-panel .nt').click()); await p2.waitForTimeout(1200);
 chk('요청 상세 이동', await p2.evaluate(()=>(document.querySelector('.pg.on')||{}).id), 'pg-reqd');
 chk('읽음 처리', await p2.evaluate(()=>window.__DB.notifications.find(n=>n.id==='n1').is_read), 'true');

 [m,p,p2].forEach((x,i)=>errs.push(...x._errs.map(e=>'p'+i+': '+e)));
 console.log(log.join('\n'));
 console.log('\n오류: '+(errs.length?'\n  '+errs.join('\n  '):'없음'));
 console.log(errs.length?'\n❌ 실패 '+errs.length+'건':'\n✅ 전체 통과');
 await b.close();})();
