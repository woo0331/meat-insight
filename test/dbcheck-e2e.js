/* db-check.html — 브라우저 점검 페이지.
   test/mock-postgrest.js 를 띄워 놓고 실제로 버튼을 눌러 봅니다. */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { spawn } = require('child_process');
const path = require('path');
const MOCK = path.join(__dirname, 'mock-postgrest.js');
const PORT = 8911;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function withMock(scenario, fn){
  const m = spawn('node',[MOCK,scenario,String(PORT)],{stdio:['ignore','ignore','ignore']});
  await sleep(700);
  try { return await fn(); } finally { m.kill(); await sleep(150); }
}

(async()=>{ const b=await chromium.launch(); const log=[],errs=[];
 const chk=(n,g,w)=>{const ok=String(g)===String(w);
   log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w));if(!ok)errs.push(n);};

 async function open(){
   const p=await b.newPage({viewport:{width:1100,height:1000}});
   p._errs=[]; p.on('pageerror',e=>p._errs.push(e.message));
   await p.goto('file:///home/user/meat-insight/db-check.html',{waitUntil:'load'});
   await p.waitForTimeout(500);
   await p.fill('#u','http://127.0.0.1:'+PORT);
   await p.fill('#k','demo');
   return p;
 }
 async function runAndRead(p, write){
   if(write) await p.check('#wr');
   await p.click('#go');
   await p.waitForFunction(()=>document.getElementById('go').textContent==='다시 점검',null,{timeout:25000});
   return p.evaluate(()=>document.getElementById('out').textContent);
 }

 log.push('1. 화면');
 {
   const p=await open();
   chk('색인 제외', await p.evaluate(()=>document.querySelector('meta[name=robots]').content), 'noindex,nofollow');
   chk('기대 스키마 로드', await p.evaluate(()=>(window.GORI_DB_EXPECT||[]).length), '19');
   chk('시작 버튼', await p.evaluate(()=>!!document.getElementById('go')), 'true');
   chk('가로 넘침 없음', await p.evaluate(()=>document.documentElement.scrollWidth>1100), 'false');
   // file:// 로 열면 자동 채우기가 막힙니다 — 조용히 비워 두지 말고 알려 줘야 합니다
   chk('자동 채우기 실패를 알림',
     await p.evaluate(()=>/자동으로 채워지지 않았습니다/.test(document.getElementById('hint').textContent)), 'true');
   chk('붙여넣을 곳 안내',
     await p.evaluate(()=>/anon public/.test(document.getElementById('hint').textContent)), 'true');
   errs.push(...p._errs.map(e=>'view: '+e)); await p.close();
 }

 log.push('2. 정상일 때');
 await withMock('ok', async()=>{
   const p=await open(); const t=await runAndRead(p,false);
   chk('연결 확인', /✅ REST 응답/.test(t), 'true');
   chk('표 확인', /purchase_requests.*컬럼 20개 모두 확인/.test(t), 'true');
   chk('RLS 차단 인식', /읽기 차단됨:.*notifications/.test(t), 'true');
   chk('저장소', /supplier-photos 버킷 있음/.test(t), 'true');
   chk('문제 없음', await p.evaluate(()=>!document.querySelector('#sum .pill.r')), 'true');
   errs.push(...p._errs.map(e=>'ok: '+e)); await p.close();
 });

 log.push('3. phase2·3 미실행');
 await withMock('phase2-missing', async()=>{
   const p=await open(); const t=await runAndRead(p,false);
   chk('없는 표를 phase 로 안내', /❌ quotes\s+없음 — phase2 를 실행하세요/.test(t), 'true');
   chk('빠진 컬럼 이름', /purchase_requests.*선택 컬럼 없음:.*category_main/.test(t), 'true');
   chk('문제 배지', await p.evaluate(()=>!!document.querySelector('#sum .pill.r')), 'true');
   errs.push(...p._errs.map(e=>'p2: '+e)); await p.close();
 });

 log.push('4. RLS 미적용 — 체크박스로 삭제까지 확인');
 await withMock('rls-off', async()=>{
   const p=await open(); const t=await runAndRead(p,true);
   chk('읽기 유출 지목', /개인 정보가 담긴 표를 누구나 읽습니다/.test(t), 'true');
   chk('삭제 가능 지목', /purchase_requests.*공개 키로 행을 지울 수 있습니다/.test(t), 'true');
   chk('phase4 안내', /phase4_admin\.sql 5번 블록/.test(t), 'true');
   errs.push(...p._errs.map(e=>'rls: '+e)); await p.close();
 });

 log.push('5. 프록시가 가로챌 때 — 초록불이 뜨면 안 됩니다');
 await withMock('intercepted', async()=>{
   const p=await open(); const t=await runAndRead(p,false);
   chk('Supabase 아님을 알림', /Supabase 가 아닌 응답 \(HTTP 403\)/.test(t), 'true');
   chk('받은 내용 노출', /Host not in allowlist/.test(t), 'true');
   chk('표를 있다고 하지 않음', /있음 \(공개 키 읽기 차단/.test(t), 'false');
   errs.push(...p._errs.map(e=>'int: '+e)); await p.close();
 });

 log.push('6. 연결 자체가 안 될 때');
 {
   const p=await b.newPage({viewport:{width:1100,height:1000}});
   p.on('pageerror',e=>errs.push('down: '+e.message));
   await p.goto('file:///home/user/meat-insight/db-check.html',{waitUntil:'load'});
   await p.waitForTimeout(400);
   await p.fill('#u','http://127.0.0.1:1'); await p.fill('#k','demo');
   await p.click('#go');
   await p.waitForFunction(()=>document.getElementById('go').textContent==='다시 점검',null,{timeout:25000});
   const t=await p.evaluate(()=>document.getElementById('out').textContent);
   chk('연결 실패 안내', /연결 실패/.test(t), 'true');
   await p.close();
 }

 log.push('7. 모바일');
 {
   const p=await b.newPage({viewport:{width:390,height:844}});
   await p.goto('file:///home/user/meat-insight/db-check.html',{waitUntil:'load'});
   await p.waitForTimeout(400);
   chk('가로 넘침 없음', await p.evaluate(()=>document.documentElement.scrollWidth>390), 'false');
   chk('버튼 44px 이상', await p.evaluate(()=>[...document.querySelectorAll('button')]
     .every(e=>e.getBoundingClientRect().height>=44)), 'true');
   await p.close();
 }

 console.log(log.join('\n'));
 console.log(errs.length? ('\n❌ 실패 '+errs.length+'건\n  '+errs.join('\n  ')) : '\n✅ 전체 통과');
 await b.close(); process.exit(errs.length?1:0);
})();
