/* 업체 정보 수정 — 온보딩 폼 재사용, 주인만, insert 아닌 update */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
const OWNER={id:'u9',email:'sup@test.com',user_metadata:{name:'합신식',role:'supplier'}};
const OTHER={id:'u1',email:'kim@test.com',user_metadata:{name:'김철수',role:'buyer'}};
async function open(b,user){const p=await b.newPage({viewport:{width:1440,height:1000}});
 await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify({user})+");");
 p._errs=[];p.on('pageerror',e=>p._errs.push(e.message));
 p.on('dialog',d=>d.accept());
 await p.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});await p.waitForTimeout(1800);return p;}

(async()=>{const b=await chromium.launch();const log=[],errs=[];
 const chk=(n,g,w)=>{const ok=String(g)===String(w);log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w));if(!ok)errs.push(n);};

 log.push('1. 내 업체에만 수정 버튼');
 const p=await open(b,OWNER);
 await p.evaluate(()=>{curSID='s1';go('sp');}); await p.waitForTimeout(1200);
 chk('정보 수정 버튼', await p.evaluate(()=>!!document.querySelector('#sp-body .se-edit')), 'true');
 chk('견적 요청 버튼 사라짐', await p.evaluate(()=>[...document.querySelectorAll('#sp-body .sd-cta button')].some(e=>/견적 요청/.test(e.textContent))), 'false');

 const o=await open(b,OTHER);
 await o.evaluate(()=>{curSID='s1';go('sp');}); await o.waitForTimeout(1200);
 chk('남의 업체엔 없음', await o.evaluate(()=>!!document.querySelector('#sp-body .se-edit')), 'false');
 chk('남에겐 견적 요청 그대로', await o.evaluate(()=>[...document.querySelectorAll('#sp-body .sd-cta button')].some(e=>/견적 요청/.test(e.textContent))), 'true');

 log.push('2. 기존 값이 폼에 채워짐');
 await p.evaluate(()=>gEditSupplier('s1')); await p.waitForTimeout(900);
 chk('업체 등록 화면', await p.evaluate(()=>(document.querySelector('.pg.on')||{}).id), 'pg-sj');
 chk('제목', await p.evaluate(()=>(document.querySelector('#pg-sj .gp-title')||{}).textContent), '업체 정보 수정');
 chk('업체명 복원', await p.evaluate(()=>document.getElementById('ob-name').value), '합신식 도축장');
 chk('연락처 복원', await p.evaluate(()=>document.getElementById('ob-tel').value), '031-000-0000');
 // 저장된 지역이 "경기 포천시" 처럼 목록에 없는 값이어도 잃지 않아야 합니다
 chk('지역 복원(목록에 없는 값)', await p.evaluate(()=>document.getElementById('ob-region').value), '경기 포천시');

 log.push('3. 2단계 — 분야·품목 복원');
 await p.evaluate(()=>{document.getElementById('ob-name').value='합신식 도축장 본점';gObNext(1);}); await p.waitForTimeout(500);
 chk('분야 칩 복원', await p.evaluate(()=>[...document.querySelectorAll('#ob-cats .gpick-i.on')].map(e=>e.textContent).join(',')), '가공·OEM');
 chk('품목 복원', await p.evaluate(()=>document.getElementById('ob-items').value), '한우 지육, 한돈 지육');
 chk('서비스 복원', await p.evaluate(()=>document.getElementById('ob-svc').value), '도축, 발골, 정형');

 log.push('4. 저장 — insert 가 아니라 update');
 const before=await p.evaluate(()=>window.__DB.suppliers.length);
 await p.evaluate(()=>gObNext(2)); await p.waitForTimeout(400);
 await p.evaluate(()=>gObNext(3)); await p.waitForTimeout(500);
 chk('4단계 버튼 문구', await p.evaluate(()=>(document.getElementById('ob-submit')||{}).textContent), '수정 저장');
 chk('사진 복원 안 됨(없는 업체)', await p.evaluate(()=>document.querySelectorAll('#ob-photos .ph-c').length), '0');
 await p.evaluate(()=>{document.getElementById('ob-intro').value='도축·발골·정형 일괄 처리';gObSubmit();});
 await p.waitForTimeout(1200);
 chk('행이 늘지 않음', await p.evaluate(()=>window.__DB.suppliers.length), String(before));
 chk('이름 반영', await p.evaluate(()=>window.__DB.suppliers.find(s=>s.id==='s1').name), '합신식 도축장 본점');
 chk('소개 반영', await p.evaluate(()=>window.__DB.suppliers.find(s=>s.id==='s1').intro), '도축·발골·정형 일괄 처리');
 chk('지역 안 잃음', await p.evaluate(()=>window.__DB.suppliers.find(s=>s.id==='s1').region), '경기 포천시');
 chk('분야 유지', await p.evaluate(()=>window.__DB.suppliers.find(s=>s.id==='s1').category_mains.join(',')), 'process');
 chk('완료 화면', await p.evaluate(()=>/정보를 저장했습니다/.test(document.getElementById('pg-sj').textContent)), 'true');

 log.push('5. 수정 뒤 새로 등록하면 다시 insert');
 await p.evaluate(()=>go('sj')); await p.waitForTimeout(700);
 chk('등록 화면으로 복귀', await p.evaluate(()=>(document.querySelector('#pg-sj .gp-title')||{}).textContent), '업체 등록');
 chk('빈 폼', await p.evaluate(()=>document.getElementById('ob-name').value), '');

 errs.push(...p._errs.map(e=>'owner: '+e), ...o._errs.map(e=>'other: '+e));
 console.log(log.join('\n'));
 console.log(errs.length? ('\n❌ 실패 '+errs.length+'건\n  '+errs.join('\n  ')) : '\n✅ 전체 통과');
 await b.close(); process.exit(errs.length?1:0);
})();
