/* ════════════════════════════════════════════════════════════════════
   연타 · 긴 입력 · 경쟁 상태

   제출 버튼은 눌리면 disabled 가 걸립니다. 그런데 disabled 는 클릭만
   막습니다 — 함수가 다른 경로로 다시 불리면 그대로 통과했습니다.
   실제로 재 보니 견적이 3건, 요청이 2건 중복 저장됐습니다.
   (src/40_once.js 가 함수 자체에 자물쇠를 겁니다)

   여기서 보는 것
     1. 제출 함수를 연달아 불러도 한 건만 저장되는가
     2. 실패한 뒤에는 다시 보낼 수 있는가 (자물쇠가 안 풀리면 먹통)
     3. 아주 긴 입력에 안 죽고 가로 스크롤도 안 생기는가
     4. 화면을 빠르게 오가도 (경쟁 상태) 안 깨지는가
     5. 뒤로가기를 연타해도 화면이 살아 있는가
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
const SUP={id:'u9',user_metadata:{name:'합신식',role:'supplier'}};
const BUYER={id:'u1',user_metadata:{name:'김철수',role:'buyer'}};
async function mk(b,user){
  const p=await b.newPage({viewport:{width:1440,height:1000}});
  await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify({user,realtime:true})+");");
  p._errs=[]; p.on('pageerror',e=>p._errs.push(e.message)); p.on('dialog',d=>d.accept());
  await p.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});
  await p.waitForTimeout(2400); return p;
}
const out=[]; const chk=(n,g,w)=>out.push((String(g)===String(w)?'  ✅ ':'  ❌ ')+n+': '+g+(String(g)===String(w)?'':'  ← 기대 '+w));
(async()=>{
 const b=await chromium.launch();

 out.push('1. 견적 연타 (중복 저장되나)');
 let s=await mk(b,{id:'u7',user_metadata:{name:'연타업체'}});
 await s.evaluate(()=>gOpenRequest('r3')); await s.waitForTimeout(1200);
 await s.evaluate(()=>gOpenQuoteForm()); await s.waitForTimeout(700);
 await s.evaluate(()=>{const set=(i,v)=>{const e=document.getElementById(i);if(e){e.value=v;e.dispatchEvent(new Event('input'));}};
   set('q-name','연타업체'); set('q-contact','010-7777-8888'); set('q-price','500000');});
 const n0=await s.evaluate(()=>window.__DB.quotes.length);
 await s.evaluate(()=>{ gSubmitQuote(); gSubmitQuote(); gSubmitQuote(); });
 await s.waitForTimeout(1800);
 chk('한 건만 저장', await s.evaluate(()=>window.__DB.quotes.length)-n0, 1);

 out.push('2. 요청 등록 연타');
 let q=await mk(b,BUYER);
 await q.evaluate(()=>go('rw')); await q.waitForTimeout(900);
 const m0=await q.evaluate(()=>window.__DB.purchase_requests.length);
 await q.evaluate(()=>{ try{ gSubmitRequest(); gSubmitRequest(); }catch(e){} });
 await q.waitForTimeout(1800);
 const m1=await q.evaluate(()=>window.__DB.purchase_requests.length);
 chk('연타로 2건 안 생김', m1-m0<=1, 'true');

 out.push('2-1. 실패한 뒤에는 다시 보낼 수 있어야 (자물쇠가 안 풀리면 먹통)');
 let f=await mk(b,{id:'u5',user_metadata:{name:'재시도업체'}});
 await f.evaluate(()=>gOpenRequest('r3')); await f.waitForTimeout(1200);
 await f.evaluate(()=>gOpenQuoteForm()); await f.waitForTimeout(700);
 const k0=await f.evaluate(()=>window.__DB.quotes.length);
 await f.evaluate(()=>gSubmitQuote()); await f.waitForTimeout(800);   /* 빈 폼 → 실패 */
 chk('빈 폼은 저장 안 됨', await f.evaluate(()=>window.__DB.quotes.length), k0);
 await f.evaluate(()=>{const set=(i,v)=>{const e=document.getElementById(i);if(e){e.value=v;e.dispatchEvent(new Event('input'));}};
   set('q-name','재시도업체'); set('q-contact','010-9999-0000'); set('q-price','700000');});
 await f.evaluate(()=>gSubmitQuote()); await f.waitForTimeout(1300);
 chk('고쳐서 다시 보내면 저장됨', await f.evaluate(()=>window.__DB.quotes.length)-k0, 1);

 out.push('3. 아주 긴 입력');
 let s2=await mk(b,{id:'u6',user_metadata:{name:'긴글업체'}});
 await s2.evaluate(()=>gOpenRequest('r3')); await s2.waitForTimeout(1200);
 await s2.evaluate(()=>gOpenQuoteForm()); await s2.waitForTimeout(700);
 await s2.evaluate(()=>{const L='가'.repeat(6000);
   const set=(i,v)=>{const e=document.getElementById(i);if(e){e.value=v;e.dispatchEvent(new Event('input'));}};
   set('q-name',L); set('q-contact','010-1111-2222'); set('q-price','1'); set('q-cond',L);});
 await s2.evaluate(()=>gSubmitQuote()); await s2.waitForTimeout(1300);
 chk('긴 글에도 안 죽음', s2._errs.length, 0);
 chk('가로 스크롤 안 생김', await s2.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1), 'true');

 out.push('4. 빠른 화면 전환 (경쟁 상태)');
 let r=await mk(b,BUYER);
 await r.evaluate(()=>{ for(let i=0;i<12;i++){ go('reqs'); go('my'); go('suppliers'); gOpenRequest('r1'); go('h'); } });
 await r.waitForTimeout(2200);
 chk('에러 없음', r._errs.length ? [...new Set(r._errs)].join('|') : 0, 0);
 chk('화면은 살아있음', await r.evaluate(()=>!!document.querySelector('.pg.on')), 'true');

 out.push('5. 뒤로가기 연타');
 for(let i=0;i<6;i++){ await r.goBack().catch(()=>{}); await r.waitForTimeout(160); }
 await r.waitForTimeout(900);
 chk('뒤로가기 후에도 에러 없음', r._errs.length ? [...new Set(r._errs)].join('|') : 0, 0);
 chk('화면 유지', await r.evaluate(()=>!!document.querySelector('.pg.on')), 'true');

 console.log(out.join('\n'));
 const e=[].concat(s._errs,q._errs,s2._errs,r._errs,f._errs);
 console.log(e.length?'  ❌ 에러: '+[...new Set(e)].slice(0,4).join(' | '):'  ✅ 페이지 에러 없음');
 const bad=out.filter(l=>l.startsWith('  ❌')).length;
 console.log(bad?'❌ '+bad+'건 실패':'✅ 전체 통과');
 await b.close();
 process.exit(bad?1:0);
})();
