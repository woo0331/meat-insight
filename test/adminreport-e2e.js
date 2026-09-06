/* 관리자 콘솔 — 신고·문의 탭 (테이블이 있을 때 / 없을 때) */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
async function admin(b,opt){
  const p=await b.newPage({viewport:{width:1440,height:1100}});
  await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify(opt||{})+");");
  p._errs=[]; p.on('pageerror',e=>p._errs.push(e.message));
  p.on('dialog',d=>d.accept());
  await p.goto('file:///home/user/meat-insight/admin.html',{waitUntil:'load'});
  await p.waitForTimeout(700);
  await p.fill('#lg-email','admin@test.com'); await p.fill('#lg-pw','pw');
  await p.click('#lg-btn'); await p.waitForTimeout(1000);
  return p;
}
(async()=>{const b=await chromium.launch();const log=[],errs=[];
 const chk=(n,g,w)=>{const ok=String(g)===String(w);log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w));if(!ok)errs.push(n);};

 log.push('1. 탭이 생겼는지');
 const p=await admin(b,{seed:{
   reports:[{id:'rp1',target_type:'supplier',target_id:'s1',target_name:'합신식 도축장',
             reason:'연락이 되지 않음',detail:'세 번 전화했는데 받지 않습니다',
             reporter_name:'김철수',reporter_phone:'010-1111-2222',status:'접수',
             created_at:new Date().toISOString()}],
   inquiries:[{id:'iq1',kind:'요청·견적',name:'박문의',phone:'010-3333-4444',
               content:'견적이 안 옵니다',status:'접수',created_at:new Date().toISOString()}]}});
 chk('신고 탭', await p.evaluate(()=>!!document.getElementById('tb-report')), 'true');
 chk('문의 탭', await p.evaluate(()=>!!document.getElementById('tb-inquiry')), 'true');

 log.push('2. 신고 목록·상태 변경');
 await p.evaluate(()=>go('report')); await p.waitForTimeout(800);
 chk('행 1건', await p.evaluate(()=>document.querySelectorAll('tbody tr').length), '1');
 chk('대상 표시', await p.evaluate(()=>/합신식 도축장/.test(document.getElementById('view').textContent)), 'true');
 chk('미확인 배너', await p.evaluate(()=>/확인하지 않은 신고 1건/.test(document.getElementById('view').textContent)), 'true');
 await p.evaluate(()=>setReport('rp1','처리완료')); await p.waitForTimeout(900);
 chk('상태 저장', await p.evaluate(()=>window.__DB.reports[0].status), '처리완료');
 chk('배너 사라짐', await p.evaluate(()=>/확인하지 않은 신고/.test(document.getElementById('view').textContent)), 'false');

 log.push('3. 문의 목록·답변완료');
 await p.evaluate(()=>go('inquiry')); await p.waitForTimeout(800);
 chk('행 1건', await p.evaluate(()=>document.querySelectorAll('tbody tr').length), '1');
 chk('연락처 표시', await p.evaluate(()=>/010-3333-4444/.test(document.getElementById('view').textContent)), 'true');
 await p.evaluate(()=>setInquiry('iq1','답변완료')); await p.waitForTimeout(900);
 chk('상태 저장', await p.evaluate(()=>window.__DB.inquiries[0].status), '답변완료');

 log.push('4. 표가 없으면 실행 안내');
 const m=await admin(b,{missingTables:['reports','inquiries']});
 await m.evaluate(()=>go('report')); await m.waitForTimeout(800);
 chk('신고 안내', await m.evaluate(()=>/phase7_report\.sql/.test(document.getElementById('view').textContent)), 'true');
 await m.evaluate(()=>go('inquiry')); await m.waitForTimeout(800);
 chk('문의 안내', await m.evaluate(()=>/phase7_report\.sql/.test(document.getElementById('view').textContent)), 'true');
 chk('화면 안 깨짐', await m.evaluate(()=>document.getElementById('app').style.display), 'block');

 errs.push(...p._errs.map(e=>'admin: '+e), ...m._errs.map(e=>'missing: '+e));
 console.log(log.join('\n'));
 console.log(errs.length? ('\n❌ 실패 '+errs.length+'건\n  '+errs.join('\n  ')) : '\n✅ 전체 통과');
 await b.close(); process.exit(errs.length?1:0);
})();
