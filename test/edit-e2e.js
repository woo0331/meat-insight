const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
const BUYER={id:'u1',email:'kim@test.com',user_metadata:{name:'김철수',role:'buyer'}};
const OTHER={id:'u5',email:'x@test.com',user_metadata:{name:'남',role:'buyer'}};
const SUP  ={id:'u9',email:'sup@test.com',user_metadata:{name:'합신식',role:'supplier'}};
async function open(b,user,vp){const p=await b.newPage({viewport:vp||{width:1440,height:1000}});
 await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify({user})+");");
 p._errs=[];p.on('pageerror',e=>p._errs.push(e.message));
 p.on('dialog',d=>d.accept());
 await p.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});await p.waitForTimeout(1700);return p;}
(async()=>{const b=await chromium.launch();const log=[],errs=[];
 const chk=(n,g,w)=>{const ok=String(g)===String(w);log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w));if(!ok)errs.push(n);};

 log.push('1. 본인 요청에만 수정 버튼');
 let p=await open(b,BUYER);
 await p.evaluate(()=>gOpenRequest('r1')); await p.waitForTimeout(1000);
 chk('수정 버튼', await p.evaluate(()=>[...document.querySelectorAll('#pg-reqd button')].some(e=>e.textContent==='요청 수정')), 'true');
 chk('삭제 버튼 숨김(견적 2건)', await p.evaluate(()=>[...document.querySelectorAll('#pg-reqd button')].some(e=>e.textContent==='요청 삭제')), 'false');
 let o=await open(b,OTHER);
 await o.evaluate(()=>gOpenRequest('r1')); await o.waitForTimeout(1000);
 chk('남의 요청엔 없음', await o.evaluate(()=>[...document.querySelectorAll('#pg-reqd button')].some(e=>e.textContent==='요청 수정')), 'false');

 log.push('2. 수정 폼');
 await p.evaluate(()=>gEditRequest('r1')); await p.waitForTimeout(700);
 chk('수정 화면', await p.evaluate(()=>(document.querySelector('.pg.on')||{}).id), 'pg-reqedit');
 chk('URL', await p.evaluate(()=>location.hash), '#/reqedit');
 chk('제목 채워짐', await p.evaluate(()=>document.getElementById('re-title').value), '한우 등심 300kg 요청');
 chk('기존 값 복원(부위)', await p.evaluate(()=>document.getElementById('e-part').value), '등심');
 chk('기존 값 복원(수량)', await p.evaluate(()=>document.getElementById('e-qty').value), '300');
 chk('칩 복원(축종 한우)', await p.evaluate(()=>[...document.querySelectorAll('#e-species .gpick-i.on')].map(e=>e.textContent).join(',')), '한우');
 chk('칩 복원(냉장)', await p.evaluate(()=>[...document.querySelectorAll('#e-temp .gpick-i.on')].map(e=>e.textContent).join(',')), '냉장');
 chk('지역 복원', await p.evaluate(()=>document.getElementById('e-region').value), '경기');
 chk('납품일 복원(컬럼값)', await p.evaluate(()=>document.getElementById('e-deadline').value), '2026-09-20');
 chk('견적 도착 안내', await p.evaluate(()=>/견적 2건이 도착/.test(document.getElementById('reqedit-body').textContent)), 'true');
 chk('마법사 입력칸과 충돌 없음', await p.evaluate(()=>document.querySelectorAll('[id^="e-"]').length>5), 'true');

 log.push('3. 필수 항목 검증');
 await p.evaluate(()=>{document.getElementById('e-part').value='';gSaveRequestEdit();}); await p.waitForTimeout(400);
 chk('빈 필수값 차단', await p.evaluate(()=>document.getElementById('re-msg').textContent), '필수 항목을 입력해주세요 — 부위 / 품목');
 chk('저장 안 됨', await p.evaluate(()=>window.__DB.purchase_requests[0].title), '한우 등심 300kg 요청');

 log.push('4. 저장');
 await p.evaluate(()=>{
   document.getElementById('e-part').value='삼겹살';
   document.getElementById('e-qty').value='500';
   document.getElementById('e-price').value='22,000';
   document.getElementById('e-region').value='서울';
   document.getElementById('re-title').value='';
   [...document.querySelectorAll('#e-temp .gpick-i')].find(e=>e.textContent==='냉동').click();
   gSaveRequestEdit();
 }); await p.waitForTimeout(1200);
 const saved = await p.evaluate(()=>{const r=window.__DB.purchase_requests.find(x=>x.id==='r1');
   return {t:r.title,region:r.region,budget:r.budget_text,part:r.detail.part,qty:r.detail.qty,temp:r.detail.temp,desc:r.desc||r.description};});
 log.push('  저장값: '+JSON.stringify(saved));
 chk('제목 자동 생성', saved.t, '삼겹살 500kg 요청');
 chk('지역 반영', saved.region, '서울');
 chk('상세 반영', saved.part+'/'+saved.qty+'/'+saved.temp.join(','), '삼겹살/500/냉동');
 chk('희망단가 반영', saved.budget, '22,000');
 chk('납품일 유지', await p.evaluate(()=>window.__DB.purchase_requests.find(x=>x.id==='r1').deadline), '2026-09-20');
 chk('요청 상세로 복귀', await p.evaluate(()=>(document.querySelector('.pg.on')||{}).id), 'pg-reqd');
 chk('견적 보낸 업체에 알림', await p.evaluate(()=>window.__DB.notifications.filter(n=>/조건이 수정/.test(n.title)).length), 1);

 log.push('5. 견적 철회 (업체 계정)');
 let s=await open(b,SUP);
 await s.evaluate(()=>gOpenMy()); await s.waitForTimeout(900);
 await s.evaluate(()=>gMyTab('out')); await s.waitForTimeout(600);
 chk('보낸 견적 목록', await s.evaluate(()=>document.querySelectorAll('#my-panel .ritem').length>0), 'true');
 chk('철회 버튼 노출', await s.evaluate(()=>[...document.querySelectorAll('#my-panel button')].filter(e=>e.textContent==='견적 철회').length), 2);
 await s.evaluate(()=>gWithdrawQuote('q1')); await s.waitForTimeout(1200);
 chk('견적 상태', await s.evaluate(()=>window.__DB.quotes.find(q=>q.id==='q1').status), '철회');
 chk('요청 견적수 감소', await s.evaluate(()=>window.__DB.purchase_requests.find(r=>r.id==='r1').quote_count), 1);
 chk('요청자에게 알림', await s.evaluate(()=>window.__DB.notifications.filter(n=>/철회/.test(n.title)).length), 1);
 chk('철회 후 버튼 사라짐', await s.evaluate(()=>[...document.querySelectorAll('#my-panel button')].filter(e=>e.textContent==='견적 철회').length), 1);

 log.push('6. 철회 견적은 비교에서 제외 (같은 세션에서 확인)');
 let p2=s;
 await p2.evaluate(()=>gOpenRequest('r1')); await p2.waitForTimeout(1200);
 const qn = await p2.evaluate(()=>document.querySelectorAll('#q-list .qc').length);
 log.push('  견적 카드 '+qn+'개 / 요약바 받은견적 '+await p2.evaluate(()=>document.querySelector('.qbar-v')?.textContent));
 chk('철회 건 제외', qn, 1);
 chk('요약바도 1건', await p2.evaluate(()=>document.querySelector('.qbar-v')?.textContent), '1');

 log.push('7. 선택된 견적은 철회 불가');
 await s.evaluate(async()=>{ await GORI.updateSafe('quotes',{status:'선택됨'},'id','q2'); });
 await s.evaluate(()=>gOpenMy()); await s.waitForTimeout(800);
 await s.evaluate(()=>gMyTab('out')); await s.waitForTimeout(500);
 chk('선택된 견적 버튼 없음', await s.evaluate(()=>[...document.querySelectorAll('#my-panel button')].filter(e=>e.textContent==='견적 철회').length), 0);
 await s.evaluate(()=>gWithdrawQuote('q2')); await s.waitForTimeout(600);
 chk('강제 호출도 차단', await s.evaluate(()=>window.__DB.quotes.find(q=>q.id==='q2').status), '선택됨');

 log.push('8. 견적 없는 요청 삭제');
 let p3=await open(b,{id:'u2',email:'p@t.com',user_metadata:{name:'박영희',role:'buyer'}});
 await p3.evaluate(()=>gOpenRequest('r2')); await p3.waitForTimeout(1000);
 chk('삭제 버튼 노출', await p3.evaluate(()=>[...document.querySelectorAll('#pg-reqd button')].some(e=>e.textContent==='요청 삭제')), 'true');
 await p3.evaluate(()=>gDeleteRequest('r2')); await p3.waitForTimeout(1000);
 chk('DB에서 삭제', await p3.evaluate(()=>window.__DB.purchase_requests.filter(r=>r.id==='r2').length), 0);
 chk('목록으로 이동', await p3.evaluate(()=>(document.querySelector('.pg.on')||{}).id), 'pg-reqs');

 await p.screenshot({path:'ed-detail.png',fullPage:false});
 await p.evaluate(()=>gEditRequest('r1')); await p.waitForTimeout(700);
 await p.screenshot({path:'ed-form.png',fullPage:true});

 [p,o,s,p3].forEach((x,i)=>errs.push(...x._errs.map(e=>'p'+i+': '+e)));
 console.log(log.join('\n'));
 console.log('\n오류: '+(errs.length?'\n  '+errs.join('\n  '):'없음'));
 console.log(errs.length?'\n❌ 실패 '+errs.length+'건':'\n✅ 전체 통과');
 await b.close();})();
