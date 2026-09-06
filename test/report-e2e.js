/* 신고 · 문의 — 진입점, 접수, 테이블이 없을 때의 물러남 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
const BUYER={id:'u1',email:'kim@test.com',user_metadata:{name:'김철수',role:'buyer'}};
const OWNER={id:'u9',email:'sup@test.com',user_metadata:{name:'합신식',role:'supplier'}};
async function open(b,opt){const p=await b.newPage({viewport:{width:1440,height:1000}});
 await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify(opt)+");");
 p._errs=[];p.on('pageerror',e=>p._errs.push(e.message));
 p.on('dialog',d=>d.accept());
 await p.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});await p.waitForTimeout(1900);return p;}

(async()=>{const b=await chromium.launch();const log=[],errs=[];
 const chk=(n,g,w)=>{const ok=String(g)===String(w);log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w));if(!ok)errs.push(n);};

 log.push('1. 남의 요청·업체에만 신고 링크');
 const p=await open(b,{user:BUYER});
 await p.evaluate(()=>gOpenRequest('r2')); await p.waitForTimeout(1100);   // r2 는 u2 요청
 chk('남의 요청 신고 링크', await p.evaluate(()=>!!document.getElementById('rp-req-link')), 'true');
 await p.evaluate(()=>gOpenRequest('r1')); await p.waitForTimeout(1100);   // r1 은 u1(=나) 요청
 chk('내 요청엔 없음', await p.evaluate(()=>!!document.getElementById('rp-req-link')), 'false');
 await p.evaluate(()=>{curSID='s1';go('sp');}); await p.waitForTimeout(1100);
 chk('남의 업체 신고 링크', await p.evaluate(()=>!!document.getElementById('rp-sup-link')), 'true');

 const s=await open(b,{user:OWNER});
 await s.evaluate(()=>{curSID='s1';go('sp');}); await s.waitForTimeout(1100);
 chk('내 업체엔 없음', await s.evaluate(()=>!!document.getElementById('rp-sup-link')), 'false');

 log.push('2. 신고 접수');
 await p.evaluate(()=>gOpenReport('supplier','s1','합신식 도축장')); await p.waitForTimeout(600);
 chk('신고 화면', await p.evaluate(()=>(document.querySelector('.pg.on')||{}).id), 'pg-report');
 chk('URL', await p.evaluate(()=>location.hash), '#/report');
 chk('대상 표시', await p.evaluate(()=>document.querySelector('#report-body .gp-sub').textContent), '합신식 도축장');
 chk('사유 6개', await p.evaluate(()=>document.querySelectorAll('#rp-reason .gpick-i').length), '6');

 await p.evaluate(()=>gSendReport()); await p.waitForTimeout(500);
 chk('사유 없이 접수 차단', await p.evaluate(()=>document.getElementById('rp-msg').textContent), '어떤 문제인지 골라 주세요.');
 chk('저장 안 됨', await p.evaluate(()=>(window.__DB.reports||[]).length), '0');

 await p.evaluate(()=>{
   document.querySelectorAll('#rp-reason .gpick-i')[1].click();
   document.getElementById('rp-detail').value='세 번 전화했는데 받지 않습니다';
   gSendReport();});
 await p.waitForTimeout(900);
 chk('접수됨', await p.evaluate(()=>(window.__DB.reports||[]).length), '1');
 chk('대상', await p.evaluate(()=>window.__DB.reports[0].target_type+':'+window.__DB.reports[0].target_id), 'supplier:s1');
 chk('사유', await p.evaluate(()=>window.__DB.reports[0].reason), '연락이 되지 않음');
 chk('신고자', await p.evaluate(()=>window.__DB.reports[0].reporter_id), 'u1');
 chk('상태', await p.evaluate(()=>window.__DB.reports[0].status), '접수');
 chk('완료 화면', await p.evaluate(()=>/신고가 접수되었습니다/.test(document.getElementById('report-body').textContent)), 'true');

 log.push('3. 문의');
 await p.evaluate(()=>gOpenContact()); await p.waitForTimeout(600);
 chk('문의 화면', await p.evaluate(()=>(document.querySelector('.pg.on')||{}).id), 'pg-contact');
 chk('로그인 이름 채워짐', await p.evaluate(()=>document.getElementById('iq-name').value), '김철수');
 await p.evaluate(()=>gSendInquiry()); await p.waitForTimeout(400);
 chk('내용 없이 차단', await p.evaluate(()=>document.getElementById('iq-msg').textContent), '이름과 내용을 채워 주세요.');
 await p.evaluate(()=>{document.getElementById('iq-content').value='견적이 안 옵니다';gSendInquiry();});
 await p.waitForTimeout(900);
 chk('문의 접수', await p.evaluate(()=>(window.__DB.inquiries||[]).length), '1');
 chk('분류', await p.evaluate(()=>window.__DB.inquiries[0].kind), '일반');
 chk('푸터 링크', await p.evaluate(()=>[...document.querySelectorAll('.ft-ul li')].some(e=>e.textContent==='문의하기')), 'true');

 log.push('4. 테이블이 없으면 안내로 물러남');
 const m=await open(b,{user:BUYER,missingTables:['reports','inquiries']});
 await m.evaluate(()=>gOpenReport('request','r2','한우 안심')); await m.waitForTimeout(600);
 await m.evaluate(()=>{document.querySelectorAll('#rp-reason .gpick-i')[0].click();gSendReport();});
 await m.waitForTimeout(900);
 chk('준비 안 됐다고 안내', await m.evaluate(()=>/아직 준비되지 않았습니다/.test(document.getElementById('rp-msg').textContent)), 'true');
 chk('SQL 파일 이름 안내', await m.evaluate(()=>/phase7_report\.sql/.test(document.getElementById('rp-msg').textContent)), 'true');
 chk('버튼 되살아남', await m.evaluate(()=>document.getElementById('rp-send').disabled), 'false');
 chk('화면 안 깨짐', await m.evaluate(()=>!!document.getElementById('rp-reason')), 'true');

 log.push('5. 비로그인도 신고 가능');
 const g=await open(b,{user:null});
 await g.evaluate(()=>gOpenReport('request','r1','한우 등심 300kg 요청')); await g.waitForTimeout(600);
 chk('이름·연락처 칸 노출', await g.evaluate(()=>!!document.getElementById('rp-name')), 'true');
 await g.evaluate(()=>{
   document.querySelectorAll('#rp-reason .gpick-i')[0].click();
   document.getElementById('rp-name').value='익명';
   gSendReport();});
 await g.waitForTimeout(900);
 chk('접수됨', await g.evaluate(()=>(window.__DB.reports||[]).length), '1');
 chk('신고자 없음', await g.evaluate(()=>window.__DB.reports[0].reporter_id===null), 'true');
 chk('이름 남음', await g.evaluate(()=>window.__DB.reports[0].reporter_name), '익명');

 errs.push(...p._errs.map(e=>'buyer: '+e), ...m._errs.map(e=>'missing: '+e), ...g._errs.map(e=>'guest: '+e));
 console.log(log.join('\n'));
 console.log(errs.length? ('\n❌ 실패 '+errs.length+'건\n  '+errs.join('\n  ')) : '\n✅ 전체 통과');
 await b.close(); process.exit(errs.length?1:0);
})();
