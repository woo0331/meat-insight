const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
const BUYER={id:'u1',user_metadata:{name:'김철수',role:'buyer'}};
const SUP  ={id:'u9',user_metadata:{name:'합신식',role:'supplier'}};
const OTHER={id:'u5',user_metadata:{name:'남',role:'buyer'}};
async function open(b,user){const p=await b.newPage({viewport:{width:1400,height:1000}});
 await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify({user,realtime:true})+");");
 p._errs=[];p.on('pageerror',e=>p._errs.push(e.message)); p.on('dialog',d=>d.accept());
 await p.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});await p.waitForTimeout(1900);return p;}
const btns=p=>p.evaluate(()=>[...document.querySelectorAll('#pg-reqd button')].map(e=>e.textContent.trim()));
(async()=>{const b=await chromium.launch();const log=[],errs=[];
 const chk=(n,g,w)=>{const ok=String(g)===String(w);log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w));if(!ok)errs.push(n);};

 log.push('1. 전화번호 형식 검증');
 let p=await open(b,BUYER);
 const cases=[['010-1234-5678',true],['02-123-4567',true],['031-123-4567',true],['0507-123-4567',true],['1588-0000',true],['070-1234-5678',true],
              ['123',false],['00000000000',false],['9991234567',false],['010-12',false],['abcd',false]];
 for(const [v,exp] of cases) chk('  '+v, await p.evaluate(x=>GORI.validPhone(x),v), exp);

 log.push('2. 마감된 요청 — 견적 차단');
 let s=await open(b,SUP);
 await s.evaluate(async()=>{ await GORI.updateSafe('purchase_requests',{status:'마감'},'id','r2'); });
 await s.evaluate(()=>gOpenRequest('r2')); await s.waitForTimeout(1200);
 chk('마감 안내', await s.evaluate(()=>/더 이상 견적을 받지 않습니다/.test(document.getElementById('reqd-body').textContent)), 'true');
 chk('버튼 문구', await s.evaluate(()=>[...document.querySelectorAll('#pg-reqd button')].some(e=>e.textContent==='마감된 요청')), 'true');
 chk('버튼 비활성', await s.evaluate(()=>{const b=[...document.querySelectorAll('#pg-reqd button')].find(e=>e.textContent==='마감된 요청');return b?b.disabled:'(버튼 없음)';}), 'true');
 await s.evaluate(()=>gOpenQuoteForm()); await s.waitForTimeout(500);
 chk('폼 진입 차단', await s.evaluate(()=>(document.querySelector('.pg.on')||{}).id), 'pg-reqd');
 const n0=await s.evaluate(()=>window.__DB.quotes.length);
 await s.evaluate(async()=>{ await gSubmitQuote(); }); await s.waitForTimeout(500);
 chk('직접 전송도 차단', await s.evaluate(()=>window.__DB.quotes.length), n0);

 log.push('3. 중복 견적 방지');
 await s.evaluate(()=>gOpenRequest('r1')); await s.waitForTimeout(1300);
 chk('이미 보냄 표시', await s.evaluate(()=>[...document.querySelectorAll('#pg-reqd button')].some(e=>e.textContent==='내 견적 보냄')), 'true');
 await s.evaluate(()=>gOpenQuoteForm()); await s.waitForTimeout(600);
 chk('폼 안 열림', await s.evaluate(()=>(document.querySelector('.pg.on')||{}).id), 'pg-reqd');
 chk('안내 토스트', await s.evaluate(()=>/이미 이 요청에 견적을 보냈습니다/.test(document.body.textContent)), 'true');

 log.push('4. 철회 후에는 다시 보낼 수 있어야');
 await s.evaluate(async()=>{ await GORI.updateSafe('quotes',{status:'철회'},'id','q1');
   await GORI.updateSafe('quotes',{status:'철회'},'id','q2'); await gOpenRequest('r1'); });
 await s.waitForTimeout(1400);
 chk('견적 보내기 복구', await s.evaluate(()=>[...document.querySelectorAll('#pg-reqd button')].some(e=>e.textContent==='견적 보내기')), 'true');

 log.push('5. 본인 요청에는 견적 불가');
 await p.evaluate(()=>gOpenRequest('r1')); await p.waitForTimeout(1300);
 await p.evaluate(()=>gOpenQuoteForm()); await p.waitForTimeout(500);
 chk('차단됨', await p.evaluate(()=>(document.querySelector('.pg.on')||{}).id), 'pg-reqd');
 chk('안내', await p.evaluate(()=>/본인이 올린 요청에는/.test(document.body.textContent)), 'true');

 log.push('6. 남의 요청 견적 선택 / 완료 처리 차단');
 let o=await open(b,OTHER);
 await o.evaluate(()=>gOpenRequest('r1')); await o.waitForTimeout(1300);
 chk('선택 버튼 없음', await o.evaluate(()=>[...document.querySelectorAll('#pg-reqd button')].some(e=>e.textContent==='이 견적 선택')), 'false');
 await o.evaluate(()=>gSelectQuote('q2')); await o.waitForTimeout(600);
 chk('직접 호출 차단', await o.evaluate(()=>window.__DB.quotes.find(q=>q.id==='q2').status), '대기');
 chk('차단 안내', await o.evaluate(()=>/본인이 등록한 요청만/.test(document.body.textContent)), 'true');
 await o.evaluate(()=>gCloseRequest()); await o.waitForTimeout(600);
 chk('마감도 차단', await o.evaluate(()=>window.__DB.purchase_requests.find(r=>r.id==='r1').status), '견적대기');

 log.push('7. "거래 완료 처리"가 남에게 안 보여야');
 await p.evaluate(()=>gSelectQuote('q2')); await p.waitForTimeout(1400);
 chk('요청자에겐 보임', await p.evaluate(()=>[...document.querySelectorAll('#pg-reqd button')].some(e=>e.textContent==='거래 완료 처리')), 'true');
 let o2=await open(b,OTHER);
 await o2.evaluate(async()=>{ await GORI.updateSafe('quotes',{status:'선택됨'},'id','q2'); await gOpenRequest('r1'); });
 await o2.waitForTimeout(1500);
 chk('남에겐 안 보임', await o2.evaluate(()=>[...document.querySelectorAll('#pg-reqd button')].some(e=>e.textContent==='거래 완료 처리')), 'false');
 chk('연락처 보기로 대체', await o2.evaluate(()=>[...document.querySelectorAll('#pg-reqd .qc-act button')].some(e=>e.textContent==='연락처 보기')), 'true');
 await o2.evaluate(()=>gCompleteDeal('q2')); await o2.waitForTimeout(600);
 chk('직접 호출 차단(완료 안 됨)', await o2.evaluate(()=>window.__DB.purchase_requests.find(r=>r.id==='r1').status!=='완료'), 'true');

 log.push('8. 요청 등록 연락처 검증');
 let n=await open(b,null);
 await n.evaluate(()=>{ goReq&&0; go('rw'); }); await n.waitForTimeout(700);
 await n.evaluate(()=>{ gPickCat('meat'); }); await n.waitForTimeout(600);
 await n.evaluate(()=>{ gStep2&&gStep2(); }); await n.waitForTimeout(700);
 await n.evaluate(()=>{
   const set=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v;};
   [...document.querySelectorAll('#w-species .gpick-i')].find(e=>e.textContent==='한우')?.click();
   [...document.querySelectorAll('#w-temp .gpick-i')].find(e=>e.textContent==='냉장')?.click();
   set('w-part','삼겹살'); set('w-qty','100'); set('w-name','홍길동'); set('w-phone','123');
 });
 await n.evaluate(()=>gStep3()); await n.waitForTimeout(600);
 chk('잘못된 번호 차단', await n.evaluate(()=>/연락처를 다시 확인해주세요/.test(document.body.textContent)), 'true');
 chk('3단계로 안 넘어감', await n.evaluate(()=>GORI.W.step), 2);
 await n.evaluate(()=>{document.getElementById('w-phone').value='010-1234-5678';gStep3();}); await n.waitForTimeout(700);
 chk('정상 번호 통과', await n.evaluate(()=>GORI.W.step), 3);

 [p,s,o,o2,n].forEach((x,i)=>errs.push(...x._errs.map(e=>'p'+i+': '+e)));
 console.log(log.join('\n'));
 console.log('\n오류: '+(errs.length?'\n  '+errs.join('\n  '):'없음'));
 console.log(errs.length?'\n❌ 실패 '+errs.length+'건':'\n✅ 전체 통과');
 await b.close();})();
