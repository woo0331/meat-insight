const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
const BUYER={id:'u1',email:'k@t.com',user_metadata:{name:'김철수',role:'buyer'}};
async function open(b,vp){const p=await b.newPage({viewport:vp||{width:1440,height:1000}});
 await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify({user:BUYER})+");");
 p._errs=[];p.on('pageerror',e=>p._errs.push(e.message));
 await p.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});await p.waitForTimeout(1700);return p;}
(async()=>{const b=await chromium.launch();const log=[],errs=[];
 const chk=(n,g,w)=>{const ok=String(g)===String(w);log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w));if(!ok)errs.push(n);};
 const p=await open(b);

 log.push('1. 요청 목록 검색');
 await p.evaluate(()=>go('reqs')); await p.waitForTimeout(500);
 chk('검색바 존재', await p.evaluate(()=>!!document.getElementById('flt-req-q')), 'true');
 const total = await p.evaluate(()=>document.querySelectorAll('#rq-list-full .rc-list > *').length);
 log.push('  (전체 요청 카드 '+total+'개)');
 chk('건수 표시', await p.evaluate(()=>document.getElementById('flt-req-n').textContent), '전체 '+total+'건');
 const titles = await p.evaluate(()=>[...document.querySelectorAll('#rq-list-full .rc-list > *')].map(e=>e.textContent.replace(/\s+/g,' ').slice(0,50)));
 log.push('  카드: '+titles.join(' // '));

 // 실제 데이터에서 검색어 하나 뽑아 검색
 await p.evaluate(()=>{const e=document.getElementById('flt-req-q');e.value='한우';e.dispatchEvent(new Event('input'));});
 await p.waitForTimeout(400);
 const hit = await p.evaluate(()=>document.querySelectorAll('#rq-list-full .rc-list > *').length);
 log.push('  "한우" 검색 결과: '+hit+'개 / 안내: '+await p.evaluate(()=>document.getElementById('flt-req-n').textContent));
 chk('검색이 좁혀짐', hit<=total, true);
 chk('지우기 버튼 노출', await p.evaluate(()=>!document.getElementById('flt-req-x').hidden), 'true');

 await p.evaluate(()=>{const e=document.getElementById('flt-req-q');e.value='존재하지않는단어zzz';e.dispatchEvent(new Event('input'));});
 await p.waitForTimeout(400);
 chk('결과 없음 안내', await p.evaluate(()=>/에 맞는 요청이 없습니다/.test(document.getElementById('rq-list-full').textContent)), 'true');
 await p.evaluate(()=>gFltReset('req')); await p.waitForTimeout(400);
 chk('초기화 후 복구', await p.evaluate(()=>document.querySelectorAll('#rq-list-full .rc-list > *').length), total);
 chk('입력칸 비워짐', await p.evaluate(()=>document.getElementById('flt-req-q').value), '');

 log.push('2. 요청 정렬');
 await p.evaluate(()=>{const s=document.getElementById('flt-req-sort');s.value='quote';s.dispatchEvent(new Event('change'));});
 await p.waitForTimeout(400);
 const q1 = await p.evaluate(()=>[...document.querySelectorAll('#rq-list-full .rc-list > *')].map(e=>{const m=e.textContent.match(/(\d+)건/);return m?+m[1]:0;}));
 log.push('  견적 많은순 건수 배열: ['+q1.join(', ')+']');
 chk('내림차순 정렬', JSON.stringify(q1)===JSON.stringify(q1.slice().sort((a,b)=>b-a)), 'true');
 await p.evaluate(()=>{const s=document.getElementById('flt-req-sort');s.value='few';s.dispatchEvent(new Event('change'));});
 await p.waitForTimeout(400);
 const q2 = await p.evaluate(()=>[...document.querySelectorAll('#rq-list-full .rc-list > *')].map(e=>{const m=e.textContent.match(/(\d+)건/);return m?+m[1]:0;}));
 chk('견적 적은순', JSON.stringify(q2)===JSON.stringify(q2.slice().sort((a,b)=>a-b)), 'true');
 await p.evaluate(()=>{const s=document.getElementById('flt-req-sort');s.value='new';s.dispatchEvent(new Event('change'));}); await p.waitForTimeout(300);

 log.push('3. 업체 목록 검색·정렬');
 await p.evaluate(()=>go('suppliers')); await p.waitForTimeout(600);
 const st = await p.evaluate(()=>document.querySelectorAll('#sup-full .sc2').length);
 log.push('  (전체 업체 카드 '+st+'개)');
 chk('검색바 존재', await p.evaluate(()=>!!document.getElementById('flt-sup-q')), 'true');
 chk('건수 표시', await p.evaluate(()=>document.getElementById('flt-sup-n').textContent), '전체 '+st+'건');
 const names = await p.evaluate(()=>[...document.querySelectorAll('#sup-full .sc2')].map(e=>e.textContent.replace(/\s+/g,' ').slice(0,40)));
 log.push('  업체: '+names.join(' // '));
 await p.evaluate(()=>{const e=document.getElementById('flt-sup-q');e.value='물류';e.dispatchEvent(new Event('input'));});
 await p.waitForTimeout(400);
 log.push('  "물류" 검색: '+await p.evaluate(()=>[...document.querySelectorAll('#sup-full .sc2')].map(e=>e.textContent.replace(/\s+/g,' ').slice(0,26)).join(' // ')));
 chk('건수 안내 갱신', await p.evaluate(()=>/전체 \d+건 중/.test(document.getElementById('flt-sup-n').textContent)), 'true');
 await p.evaluate(()=>gFltReset('sup')); await p.waitForTimeout(400);

 await p.evaluate(()=>{const s=document.getElementById('flt-sup-sort');s.value='rate';s.dispatchEvent(new Event('change'));});
 await p.waitForTimeout(400);
 const rs = await p.evaluate(()=>[...document.querySelectorAll('#sup-full .sc2')].map(e=>{const m=e.textContent.match(/★\s*([\d.]+)/);return m?+m[1]:0;}));
 log.push('  평점순: ['+rs.join(', ')+']');
 chk('평점 내림차순', JSON.stringify(rs)===JSON.stringify(rs.slice().sort((a,b)=>b-a)), 'true');

 log.push('4. 인증업체만');
 await p.evaluate(()=>{const c=document.getElementById('flt-sup-vf');c.checked=true;c.dispatchEvent(new Event('change'));});
 await p.waitForTimeout(400);
 const vfn = await p.evaluate(()=>document.querySelectorAll('#sup-full .sc2').length);
 const vfAll = await p.evaluate(()=>GORI?0:0);
 log.push('  인증만: '+vfn+'개 / 안내: '+await p.evaluate(()=>document.getElementById('flt-sup-n').textContent));
 chk('인증 배지 전부 보유', await p.evaluate(()=>[...document.querySelectorAll('#sup-full .sc2')].every(e=>/인증|✓/.test(e.textContent))), 'true');
 await p.evaluate(()=>gFltReset('sup')); await p.waitForTimeout(400);
 chk('초기화 후 복구', await p.evaluate(()=>document.querySelectorAll('#sup-full .sc2').length), st);

 log.push('5. 분야 필터와 함께');
 await p.evaluate(()=>fS('meat')); await p.waitForTimeout(400);
 const catN = await p.evaluate(()=>document.querySelectorAll('#sup-full .sc2').length);
 log.push('  원육 분야: '+catN+'개 / 안내: '+await p.evaluate(()=>document.getElementById('flt-sup-n').textContent));
 chk('분야 필터 유지', await p.evaluate(()=>!!document.getElementById('flt-sup-q')), 'true');

 log.push('6. 모바일 레이아웃');
 const m=await open(b,{width:390,height:844});
 await m.evaluate(()=>go('reqs')); await m.waitForTimeout(600);
 const box = await m.evaluate(()=>{const e=document.getElementById('flt-req');const r=e.getBoundingClientRect();
   const inp=document.getElementById('flt-req-q').getBoundingClientRect();
   const sel=document.getElementById('flt-req-sort').getBoundingClientRect();
   return {w:Math.round(r.width),inpW:Math.round(inp.width),selW:Math.round(sel.width),overflow:document.documentElement.scrollWidth>390};});
 log.push('  바 폭 '+box.w+' / 입력 '+box.inpW+' / 정렬 '+box.selW);
 chk('가로 넘침 없음', box.overflow, false);
 chk('입력칸 한 줄 차지', box.inpW>200, 'true');
 await m.screenshot({path:'flt-mobile.png',fullPage:false});
 await p.evaluate(()=>go('suppliers'));await p.waitForTimeout(500);
 await p.screenshot({path:'flt-sup.png',fullPage:false});
 await p.evaluate(()=>go('reqs'));await p.waitForTimeout(500);
 await p.screenshot({path:'flt-req.png',fullPage:false});

 errs.push(...p._errs.map(e=>'main: '+e),...m._errs.map(e=>'mob: '+e));
 console.log(log.join('\n'));
 console.log('\n오류: '+(errs.length?'\n  '+errs.join('\n  '):'없음'));
 console.log(errs.length?'\n❌ 실패 '+errs.length+'건':'\n✅ 전체 통과');
 await b.close();})();
