const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
async function open(b,user,hash){const p=await b.newPage({viewport:{width:1440,height:1000}});
 await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify({user:user||null})+");");
 p._errs=[];p.on('pageerror',e=>p._errs.push(e.message));
 await p.goto('file:///home/user/meat-insight/index.html'+(hash||''),{waitUntil:'load'});await p.waitForTimeout(1900);return p;}
(async()=>{const b=await chromium.launch();const log=[],errs=[];
 const chk=(n,g,w)=>{const ok=String(g)===String(w);log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w));if(!ok)errs.push(n);};
 let p=await open(b,null);

 log.push('1. 비로그인 거래관리 진입점');
 await p.evaluate(()=>go('my')); await p.waitForTimeout(800);
 chk('찾기 카드', await p.evaluate(()=>/로그인 없이 올린 요청 찾기/.test(document.getElementById('my-body').textContent)), 'true');
 await p.evaluate(()=>document.querySelector('.fd-entry button').click()); await p.waitForTimeout(700);
 chk('찾기 화면', await p.evaluate(()=>(document.querySelector('.pg.on')||{}).id), 'pg-findreq');
 chk('URL', await p.evaluate(()=>location.hash), '#/findreq');

 log.push('2. 입력 검증');
 await p.evaluate(()=>gFindMyReqs()); await p.waitForTimeout(300);
 chk('이름 필수', await p.evaluate(()=>document.getElementById('fd-msg').textContent), '이름을 입력해주세요.');
 await p.evaluate(()=>{document.getElementById('fd-name').value='김철수';gFindMyReqs();}); await p.waitForTimeout(300);
 chk('번호 필수', await p.evaluate(()=>document.getElementById('fd-msg').textContent), '전화번호를 정확히 입력해주세요.');

 log.push('3. 전화번호 자동 하이픈');
 chk('11자리', await p.evaluate(()=>{const e=document.getElementById('fd-phone');e.value='01011112222';gPhoneFmt(e);return e.value;}), '010-1111-2222');
 chk('입력 중', await p.evaluate(()=>{const e=document.getElementById('fd-phone');e.value='01011';gPhoneFmt(e);return e.value;}), '010-11');

 log.push('4. 조회');
 await p.evaluate(()=>{document.getElementById('fd-name').value='김철수';document.getElementById('fd-phone').value='010-1111-2222';gFindMyReqs();});
 await p.waitForTimeout(900);
 const rows = await p.evaluate(()=>[...document.querySelectorAll('#findreq-body .ritem')].map(e=>e.textContent.replace(/\s+/g,' ').trim()));
 log.push('  결과 '+rows.length+'건:'); rows.forEach(r=>log.push('    · '+r));
 chk('내 요청만', rows.length, 1);
 chk('견적 건수 표기', await p.evaluate(()=>/견적 2건 도착/.test(document.getElementById('findreq-body').textContent)), 'true');
 chk('회원가입 유도', await p.evaluate(()=>/회원가입하면 견적 도착 알림/.test(document.getElementById('findreq-body').textContent)), 'true');

 log.push('5. 하이픈 없이 입력해도 찾아짐');
 await p.evaluate(()=>{document.getElementById('fd-phone').value='01011112222';gFindMyReqs();}); await p.waitForTimeout(800);
 chk('동일 결과', await p.evaluate(()=>document.querySelectorAll('#findreq-body .ritem').length), 1);

 log.push('6. 클릭 → 요청 상세');
 await p.evaluate(()=>document.querySelector('#findreq-body .ritem').click()); await p.waitForTimeout(1100);
 chk('상세 이동', await p.evaluate(()=>(document.querySelector('.pg.on')||{}).id), 'pg-reqd');
 chk('URL', await p.evaluate(()=>location.hash), '#/req/r1');

 log.push('7. 이름 불일치 시 안 나옴');
 await p.evaluate(()=>gOpenFindReq()); await p.waitForTimeout(600);
 await p.evaluate(()=>{document.getElementById('fd-name').value='남의이름';document.getElementById('fd-phone').value='010-1111-2222';gFindMyReqs();});
 await p.waitForTimeout(800);
 chk('결과 없음', await p.evaluate(()=>/해당하는 요청이 없습니다/.test(document.getElementById('findreq-body').textContent)), 'true');

 log.push('8. 이 기기에 번호 기억');
 chk('저장됨', await p.evaluate(()=>{try{return JSON.parse(localStorage.getItem('gori.guest')).phone}catch(e){return '(없음)'}}), '010-1111-2222');
 await p.reload({waitUntil:'load'}); await p.waitForTimeout(1900);
 await p.evaluate(()=>go('my')); await p.waitForTimeout(800);
 chk('재방문 안내', await p.evaluate(()=>/010-1111-2222/.test(document.getElementById('my-body').textContent)), 'true');
 chk('버튼 문구', await p.evaluate(()=>document.querySelector('.fd-entry button').textContent), '내 요청 바로 보기');
 await p.evaluate(()=>document.querySelector('.fd-entry button').click()); await p.waitForTimeout(1200);
 chk('바로 조회됨', await p.evaluate(()=>document.querySelectorAll('#findreq-body .ritem').length), 1);
 await p.screenshot({path:'fd-page.png',fullPage:false});
 await p.evaluate(()=>gForgetGuest()); await p.waitForTimeout(400);
 chk('지우기', await p.evaluate(()=>localStorage.getItem('gori.guest')), 'null');

 log.push('9. 공유 링크로 바로 진입');
 let p2=await open(b,null,'#/findreq'); await p2.waitForTimeout(700);
 chk('복원', await p2.evaluate(()=>(document.querySelector('.pg.on')||{}).id), 'pg-findreq');

 log.push('10. 로그인 상태에서는 진입점 없음');
 let p3=await open(b,{id:'u1',user_metadata:{name:'김철수',role:'buyer'}});
 await p3.evaluate(()=>gOpenMy()); await p3.waitForTimeout(1000);
 chk('카드 없음', await p3.evaluate(()=>document.querySelectorAll('.fd-entry').length), 0);

 [p,p2,p3].forEach((x,i)=>errs.push(...x._errs.map(e=>'p'+i+': '+e)));
 console.log(log.join('\n'));
 console.log('\n오류: '+(errs.length?'\n  '+errs.join('\n  '):'없음'));
 console.log(errs.length?'\n❌ 실패 '+errs.length+'건':'\n✅ 전체 통과');
 await b.close();})();
