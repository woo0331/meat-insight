const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
const U={id:'u1',user_metadata:{name:'김철수',role:'buyer'}};
async function open(b,opts,vp){const p=await b.newPage({viewport:vp||{width:1440,height:1000}});
 await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify(Object.assign({user:U},opts||{}))+");");
 p._errs=[];p.on('pageerror',e=>p._errs.push(e.message));
 await p.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});await p.waitForTimeout(1900);return p;}
(async()=>{const b=await chromium.launch();const log=[],errs=[];
 const chk=(n,g,w)=>{const ok=String(g)===String(w);log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w));if(!ok)errs.push(n);};
 let p=await open(b);
 log.push('1. 두 출처 합치기');
 await p.evaluate(()=>go('jobs')); await p.waitForTimeout(1100);
 const cards = await p.evaluate(()=>[...document.querySelectorAll('#job-list2 .job-card')].map(e=>e.textContent.replace(/\s+/g,' ').trim()));
 log.push('  카드 '+cards.length+'개:');
 cards.forEach(c=>log.push('    · '+c));
 chk('jobs + 요청 합계', cards.length, 3);
 chk('마법사 공고 노출', await p.evaluate(()=>/발골사 2명 채용|발골사/.test(document.getElementById('job-list2').textContent)), 'true');
 chk('"고리 요청" 배지', await p.evaluate(()=>document.querySelectorAll('#job-list2 .job-src').length), 1);
 chk('통계 정규직', await p.evaluate(()=>/정규직 1건/.test(document.querySelector('.job-stats-bar').textContent)), 'true');
 chk('통계 구직', await p.evaluate(()=>/구직 1건/.test(document.querySelector('.job-stats-bar').textContent)), 'true');
 chk('통계 계약직', await p.evaluate(()=>/계약직 1건/.test(document.querySelector('.job-stats-bar').textContent)), 'true');

 log.push('2. 지원 동선');
 chk('버튼 문구', await p.evaluate(()=>[...document.querySelectorAll('#job-list2 .job-apply-btn')].map(e=>e.textContent).join(',')), '공고 보기,전화 지원,전화 연락');
 chk('구직 배지', await p.evaluate(()=>[...document.querySelectorAll('#job-list2 .job-emp-badge')].map(e=>e.textContent).join(',')), '계약직,정규직,구직');
 await p.evaluate(()=>[...document.querySelectorAll('#job-list2 .job-apply-btn')].find(e=>e.textContent==='공고 보기').click());
 await p.waitForTimeout(1100);
 chk('요청 상세로 이동', await p.evaluate(()=>(document.querySelector('.pg.on')||{}).id), 'pg-reqd');
 chk('해당 공고 URL', await p.evaluate(()=>location.hash), '#/req/r3');
 chk('제목 표시', await p.evaluate(()=>/발골사/.test(document.getElementById('reqd-body').textContent)), 'true');

 log.push('3. 레거시 공고 상세 펼치기');
 await p.evaluate(()=>go('jobs')); await p.waitForTimeout(1000);
 await p.evaluate(()=>{const c=[...document.querySelectorAll('#job-list2 .job-card')].find(e=>/안양 정육공장/.test(e.textContent)); c.click();});
 await p.waitForTimeout(500);
 const det = await p.evaluate(()=>{const d=document.querySelector('#job-list2 .job-det'); return d?d.textContent.replace(/\s+/g,' ').trim():'(없음)';});
 log.push('  상세: '+det);
 chk('연락처 노출', /010-5555-6666/.test(det), 'true');

 await p.evaluate(()=>{const c=[...document.querySelectorAll('#job-list2 .job-card')].find(e=>/안양 정육공장/.test(e.textContent)); c.click();});
 await p.waitForTimeout(400);
 await p.evaluate(()=>{const c=[...document.querySelectorAll('#job-list2 .job-card')].find(e=>/이구직/.test(e.textContent)); c.click();});
 await p.waitForTimeout(400);
 chk('구직 경력 노출', await p.evaluate(()=>/경력 5년|5년/.test([...document.querySelectorAll('#job-list2 .job-det')].map(e=>e.textContent).join(''))), 'true');
 await p.evaluate(()=>{const c=[...document.querySelectorAll('#job-list2 .job-card')].find(e=>/이구직/.test(e.textContent)); c.click();});
 await p.waitForTimeout(400);
 chk('다시 접힘', await p.evaluate(()=>document.querySelectorAll('#job-list2 .job-det').length), 0);

 log.push('4. 필터');
 await p.evaluate(()=>gJobFilter('contract')); await p.waitForTimeout(400);
 chk('계약직만', await p.evaluate(()=>document.querySelectorAll('#job-list2 .job-card').length), 1);
 chk('필터 활성', await p.evaluate(()=>document.querySelector('.job-filter-btn.on').textContent), '계약직');
 await p.evaluate(()=>gJobFilter('part')); await p.waitForTimeout(400);
 chk('알바 0건 안내', await p.evaluate(()=>/해당 공고가 없습니다/.test(document.getElementById('job-list2').textContent)), 'true');
 await p.evaluate(()=>gJobFilter('all')); await p.waitForTimeout(400);

 log.push('5. 등록 경로');
 chk('구인 공고 올리기 → 마법사', await p.evaluate(()=>{goUX('prof');return (document.querySelector('.pg.on')||{}).id;}), 'pg-rw');
 chk('구인구직 분야 선택됨', await p.evaluate(()=>GORI.W.cat), 'job');
 await p.evaluate(()=>go('jobs')); await p.waitForTimeout(900);
 await p.evaluate(()=>[...document.querySelectorAll('.jobs-split2 button')].find(e=>e.textContent==='구직 프로필 등록').click());
 await p.waitForTimeout(700);
 chk('구직 프로필 화면', await p.evaluate(()=>(document.querySelector('.pg.on')||{}).id), 'pg-wprof');

 log.push('6. 공고가 하나도 없을 때');
 let e0=await open(b,{emptyTables:['jobs']});
 await e0.evaluate(()=>{window.__DB.purchase_requests=window.__DB.purchase_requests.filter(r=>r.category_main!=='job');});
 await e0.evaluate(()=>go('jobs')); await e0.waitForTimeout(1100);
 chk('빈 상태 안내', await e0.evaluate(()=>/등록된 공고가 아직 없습니다/.test(document.getElementById('job-full').textContent)), 'true');
 chk('올리기 버튼', await e0.evaluate(()=>/구인 공고 올리기/.test(document.getElementById('job-full').textContent)), 'true');

 await p.evaluate(()=>go('jobs')); await p.waitForTimeout(900);
 await p.screenshot({path:'jb-page.png',fullPage:false});
 const m=await open(b,null,{width:390,height:844});
 await m.evaluate(()=>go('jobs')); await m.waitForTimeout(1100);
 chk('모바일 가로 넘침 없음', await m.evaluate(()=>document.documentElement.scrollWidth>390), 'false');
 await m.screenshot({path:'jb-mobile.png',fullPage:false});

 [p,e0,m].forEach((x,i)=>errs.push(...x._errs.map(e=>'p'+i+': '+e)));
 console.log(log.join('\n'));
 console.log('\n오류: '+(errs.length?'\n  '+errs.join('\n  '):'없음'));
 console.log(errs.length?'\n❌ 실패 '+errs.length+'건':'\n✅ 전체 통과');
 await b.close();})();
