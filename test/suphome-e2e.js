/* 업체 유치 화면(#/sj 설득 구간) + 내 업체에 맞는 요청 피드 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
const OWNER={id:'u9',email:'sup@test.com',user_metadata:{name:'합신식',role:'supplier'}};
const BUYER={id:'u1',email:'kim@test.com',user_metadata:{name:'김철수',role:'buyer'}};
async function open(b,opt){const p=await b.newPage({viewport:{width:1440,height:1000}});
 await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify(opt)+");");
 p._errs=[];p.on('pageerror',e=>p._errs.push(e.message));
 p.on('dialog',d=>d.accept());
 await p.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});await p.waitForTimeout(2000);return p;}

(async()=>{const b=await chromium.launch();const log=[],errs=[];
 const chk=(n,g,w)=>{const ok=String(g)===String(w);log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w));if(!ok)errs.push(n);};

 log.push('1. 비로그인 — 업체 등록 화면에 설득 구간');
 const g=await open(b,{user:null});
 await g.evaluate(()=>go('sj')); await g.waitForTimeout(1200);
 chk('설득 구간', await g.evaluate(()=>!!document.getElementById('sj-pitch')), 'true');
 chk('입력 폼보다 위', await g.evaluate(()=>{
   const b=document.getElementById('ob-body');
   return b.firstElementChild && b.firstElementChild.id==='sj-pitch';}), 'true');
 chk('실제 요청 건수 표시', await g.evaluate(()=>/지금 답을 기다리는 요청/.test(document.getElementById('sj-pitch').textContent)), 'true');
 chk('요청 카드', await g.evaluate(()=>document.querySelectorAll('#sj-pitch .ritem').length>0), 'true');
 chk('수수료 안내', await g.evaluate(()=>/베타 기간에는 등록도 견적 발송도 무료/.test(document.getElementById('sj-pitch').textContent)), 'true');
 chk('등록 폼 그대로', await g.evaluate(()=>!!document.getElementById('ob-name')), 'true');

 log.push('2. 2단계로 가면 설득 구간은 사라짐');
 await g.evaluate(()=>{document.getElementById('ob-name').value='테스트축산';
   document.getElementById('ob-tel').value='010-1111-2222';gObNext(1);}); await g.waitForTimeout(600);
 chk('사라짐', await g.evaluate(()=>!!document.getElementById('sj-pitch')), 'false');
 await g.evaluate(()=>gObBack()); await g.waitForTimeout(600);
 chk('1단계 복귀 시 다시 보임', await g.evaluate(()=>!!document.getElementById('sj-pitch')), 'true');

 log.push('3. 요청이 하나도 없으면 지어내지 않음');
 const e=await open(b,{user:null,emptyTables:['purchase_requests']});
 await e.evaluate(()=>go('sj')); await e.waitForTimeout(1400);
 chk('빈 상태 문구', await e.evaluate(()=>/아직 올라온 요청이 없습니다/.test(document.getElementById('sj-pitch').textContent)), 'true');
 chk('가짜 건수 없음', await e.evaluate(()=>/지금 답을 기다리는 요청/.test(document.getElementById('sj-pitch').textContent)), 'false');

 log.push('4. 업체 회원 홈 — 내 업체에 맞는 요청');
 const s=await open(b,{user:OWNER});
 await s.evaluate(()=>go('h')); await s.waitForTimeout(1400);
 chk('섹션 보임', await s.evaluate(()=>{const el=document.getElementById('sec-supreq');return !!el&&!el.hidden;}), 'true');
 chk('카테고리 다음에 위치', await s.evaluate(()=>{
   const c=document.querySelector('.sec-cat8');return c&&c.nextElementSibling&&c.nextElementSibling.id==='sec-supreq';}), 'true');
 chk('내 업체 이름 표시', await s.evaluate(()=>/합신식 도축장/.test(document.getElementById('supreq-sub').textContent)), 'true');
 // s1=가공·OEM/경기, s2=냉장물류/전국 → 원육(meat) 요청은 안 맞고 물류 요청은 맞아야 합니다
 const cats=await s.evaluate(()=>[...document.querySelectorAll('#supreq-list .ritem .gb-or')].map(e=>e.textContent));
 chk('물류 요청 포함', String(cats.includes('물류·운송')), 'true');
 chk('내 분야 아닌 요청 제외', String(cats.every(c=>['가공·OEM','물류·운송'].includes(c))), 'true');

 log.push('5. 일반 회원에겐 안 보임');
 const u=await open(b,{user:BUYER});
 await u.evaluate(()=>go('h')); await u.waitForTimeout(1400);
 chk('섹션 숨김', await u.evaluate(()=>{const el=document.getElementById('sec-supreq');return !el||el.hidden;}), 'true');
 chk('비로그인도 숨김', await g.evaluate(()=>{const el=document.getElementById('sec-supreq');return !el||el.hidden;}), 'true');

 log.push('6. 이미 견적을 보낸 요청은 빠짐');
 // u9 는 r1(원육)에 이미 견적을 보냈습니다 — 분야가 안 맞아 어차피 제외되지만
 // 견적 보낸 요청이 목록에 남지 않는지 확인합니다
 chk('r1 없음', await s.evaluate(()=>[...document.querySelectorAll('#supreq-list .ritem')]
   .some(e=>/한우 등심 300kg/.test(e.textContent))), 'false');

 errs.push(...g._errs.map(x=>'guest: '+x), ...s._errs.map(x=>'sup: '+x),
           ...u._errs.map(x=>'buyer: '+x), ...e._errs.map(x=>'empty: '+x));
 console.log(log.join('\n'));
 console.log(errs.length? ('\n❌ 실패 '+errs.length+'건\n  '+errs.join('\n  ')) : '\n✅ 전체 통과');
 await b.close(); process.exit(errs.length?1:0);
})();
