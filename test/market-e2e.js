const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
const U={id:'u1',user_metadata:{name:'김철수',role:'buyer'}};
async function open(b,opts,vp){const p=await b.newPage({viewport:vp||{width:1440,height:1000}});
 await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify(Object.assign({user:U},opts||{}))+");");
 p._errs=[];p.on('pageerror',e=>p._errs.push(e.message));
 await p.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});await p.waitForTimeout(1900);return p;}
(async()=>{const b=await chromium.launch();const log=[],errs=[];
 const chk=(n,g,w)=>{const ok=String(g)===String(w);log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w));if(!ok)errs.push(n);};

 log.push('1. 실제 시세로 탭 구성');
 let p=await open(b);
 await p.evaluate(()=>go('market')); await p.waitForTimeout(700);
 chk('탭 목록', await p.evaluate(()=>[...document.querySelectorAll('#mkt-tabs .tab')].map(e=>e.textContent).join(',')), '전체,한우·소,돼지');
 chk('하드코딩 탭 사라짐', await p.evaluate(()=>/국산 곱창/.test(document.getElementById('market-full').textContent)), 'false');
 const rows = await p.evaluate(()=>[...document.querySelectorAll('#mkt-table .price-row')].map(e=>e.textContent.replace(/\s+/g,' ').trim()));
 log.push('  전체: '+rows.join(' | '));
 chk('행 개수 = DB 건수', rows.length, 3);
 chk('등급 중복 없음', await p.evaluate(()=>!/1등급 1등급/.test(document.getElementById('mkt-table').textContent)), 'true');
 chk('기준일 표기', await p.evaluate(()=>document.querySelector('.mk-foot')?.textContent.trim()), '2026-09-02 기준');
 chk('코드 예시가격 없음', await p.evaluate(()=>!/5,180|9,850|18,500/.test(document.getElementById('market-full').textContent)), 'true');

 log.push('2. 분류 탭 전환');
 await p.evaluate(()=>[...document.querySelectorAll('#mkt-tabs .tab')].find(e=>e.textContent==='돼지').click());
 await p.waitForTimeout(400);
 chk('돼지 행', await p.evaluate(()=>[...document.querySelectorAll('#mkt-table .price-row .price-item')].map(e=>e.textContent).join(',')), '돼지 삼겹살');
 await p.evaluate(()=>[...document.querySelectorAll('#mkt-tabs .tab')].find(e=>e.textContent==='한우·소').click());
 await p.waitForTimeout(400);
 chk('한우 행 2개', await p.evaluate(()=>document.querySelectorAll('#mkt-table .price-row').length), 2);
 chk('등락 표시', await p.evaluate(()=>[...document.querySelectorAll('#mkt-table .price-chg')].map(e=>e.textContent.trim()).join(' / ')), '▲ 500 / ▼ 800');
 chk('상승/하락 색상 클래스', await p.evaluate(()=>[...document.querySelectorAll('#mkt-table .price-chg')].map(e=>e.className.replace('price-chg ','')).join(',')), 'p-up,p-dn');
 await p.screenshot({path:'mk-page.png',fullPage:false});

 log.push('3. 시세가 하나도 없을 때');
 let e0=await open(b,{emptyTables:['market_prices']});
 await e0.evaluate(()=>go('market')); await e0.waitForTimeout(900);
 const t0 = await e0.evaluate(()=>document.getElementById('market-full').textContent.replace(/\s+/g,' ').trim());
 log.push('  화면: '+t0.slice(0,90));
 chk('가짜 숫자 없음', await e0.evaluate(()=>!/20,500|22,000|15,000/.test(document.getElementById('market-full').textContent)), 'true');
 chk('안내 문구', /등록된 시세가 없습니다/.test(t0), 'true');
 chk('홈 시세 스트립 숨김', await e0.evaluate(()=>{const s=document.getElementById('sec-mkt');return !s||s.hidden;}), 'true');

 log.push('4. 테이블 자체가 없을 때');
 let m0=await open(b,{missingTables:['market_prices']});
 await m0.evaluate(()=>go('market')); await m0.waitForTimeout(900);
 const t1 = await m0.evaluate(()=>document.getElementById('market-full').textContent.replace(/\s+/g,' ').trim());
 log.push('  화면: '+t1.slice(0,100));
 chk('설치 안내', /phase3_schema/.test(t1), 'true');
 chk('가짜 숫자 없음', await m0.evaluate(()=>!/20,500|5,180/.test(document.getElementById('market-full').textContent)), 'true');

 [p,e0,m0].forEach((x,i)=>errs.push(...x._errs.map(e=>'p'+i+': '+e)));
 console.log(log.join('\n'));
 console.log('\n오류: '+(errs.length?'\n  '+errs.join('\n  '):'없음'));
 console.log(errs.length?'\n❌ 실패 '+errs.length+'건':'\n✅ 전체 통과');
 await b.close();})();
