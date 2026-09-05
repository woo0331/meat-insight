const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
const ALL=['purchase_requests','suppliers','jobs','quotes','reviews','day_jobs','market_prices','notifications'];
const FAKES=['ASF 방역','관세 인하','농식품부','도투두수','한우 유망','곱창 생산 업체는','정육점 창업이 어렵진','20,500','5,180'];
async function open(b,opts,vp){const p=await b.newPage({viewport:vp||{width:1280,height:900},deviceScaleFactor:2});
 await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify(Object.assign({user:null,realtime:true},opts||{}))+");");
 p._errs=[];p.on('pageerror',e=>p._errs.push(e.message));
 await p.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});await p.waitForTimeout(2700);return p;}
(async()=>{const b=await chromium.launch();const log=[],errs=[];
 const chk=(n,g,w)=>{const ok=String(g)===String(w);log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w));if(!ok)errs.push(n);};

 log.push('1. 콜드 스타트 (모든 테이블 비어 있음)');
 let e0=await open(b,{emptyTables:ALL});
 const txt=await e0.evaluate(()=>document.body.innerText);
 FAKES.forEach(f=>chk('  지어낸 내용 없음 — '+f, txt.includes(f), 'false'));
 chk('고리페이 숨김', await e0.evaluate(()=>{const g=document.querySelector('.gpay');const s=g&&g.closest('section');return s?s.hidden:'(없음)';}), 'true');
 chk('소식·정보 섹션 접힘', await e0.evaluate(()=>{const h=document.getElementById('prop-widget');return h.closest('section').hidden;}), 'true');
 chk('샘플 딱지 0개', await e0.evaluate(()=>document.querySelectorAll('.sample-tag').length), 0);
 chk('시세 스트립 숨김', await e0.evaluate(()=>{const s=document.getElementById('sec-mkt');return !s||s.hidden;}), 'true');
 chk('요청 CTA 살아있음', await e0.evaluate(()=>/첫 요청 올리기/.test(document.body.innerText)), 'true');
 chk('업체 CTA 살아있음', await e0.evaluate(()=>/업체 등록하기/.test(document.body.innerText)), 'true');
 await e0.screenshot({path:'ct2-cold.png',fullPage:true});

 log.push('2. 뉴스·커뮤니티 화면');
 await e0.evaluate(()=>go('news')); await e0.waitForTimeout(900);
 chk('뉴스 빈 안내', await e0.evaluate(()=>/아직 등록된 소식이 없습니다/.test(document.getElementById('news-full').textContent)), 'true');
 await e0.evaluate(()=>go('community')); await e0.waitForTimeout(900);
 chk('커뮤니티 빈 안내', await e0.evaluate(()=>/커뮤니티는 준비 중입니다/.test(document.getElementById('comm-list-full').textContent)), 'true');

 log.push('3. 운영자가 내용을 넣으면 표시');
 let p=await open(b,{emptyTables:ALL});
 await p.evaluate(()=>{
   window.GORI_CONTENT.news=[{title:"한우 도매가 3주 연속 상승",url:"https://example.com/a",date:"2026-09-01",source:"농민신문"}];
   window.GORI_CONTENT.community=[{title:"발골 인력 구할 때 팁",url:"/index.html",count:3}];
   window.GORI_CONTENT.props=[{name:"한돈 지육 500kg",info:"경기 안성 · 직접 문의"}];
   renderNewsWidget(); renderCommWidget(); renderPropWidget();
 });
 await p.waitForTimeout(700);
 chk('뉴스 표시', await p.evaluate(()=>/한우 도매가 3주 연속 상승/.test(document.getElementById('news-widget').textContent)), 'true');
 chk('출처·날짜 표기', await p.evaluate(()=>/농민신문 · 2026-09-01/.test(document.getElementById('news-widget').textContent)), 'true');
 chk('매물 표시', await p.evaluate(()=>/한돈 지육 500kg/.test(document.getElementById('prop-widget').textContent)), 'true');
 chk('커뮤니티 표시', await p.evaluate(()=>/발골 인력 구할 때 팁/.test(document.getElementById('comm-widget').textContent)), 'true');
 chk('섹션 다시 펼쳐짐', await p.evaluate(()=>document.getElementById('prop-widget').closest('section').hidden), 'false');
 await p.evaluate(()=>go('news')); await p.waitForTimeout(800);
 chk('뉴스 화면에도 반영', await p.evaluate(()=>/한우 도매가/.test(document.getElementById('news-full').textContent)), 'true');
 chk('외부 링크 새 창', await p.evaluate(()=>{
   let opened=null; const o=window.open; window.open=(u)=>{opened=u;return null;};
   gCtOpen('https://example.com/a'); window.open=o; return opened; }), 'https://example.com/a');
 chk('javascript: 링크 차단', await p.evaluate(()=>{
   const before=location.href; gCtOpen('javascript:alert(1)'); return location.href===before; }), 'true');

 log.push('4. 데이터가 있으면 섹션 정상 노출');
 let d=await open(b,{});
 chk('업체 랭킹 있음', await d.evaluate(()=>document.getElementById('rank-widget').children.length>0), 'true');
 chk('섹션 보임', await d.evaluate(()=>document.getElementById('prop-widget').closest('section').hidden), 'false');
 await d.screenshot({path:'ct2-data.png',fullPage:true});

 log.push('5. 기능 스위치');
 let f=await open(b,{});
 await f.evaluate(()=>{ window.GORI_FEATURES.pay=true; });
 chk('pay=true 로 바꾸면 다시 보임(재적용 시)', await f.evaluate(()=>{
   const g=document.querySelector('.gpay').closest('section');
   g.hidden=false; return g.hidden; }), 'false');

 [e0,p,d,f].forEach((x,i)=>errs.push(...x._errs.map(e=>'p'+i+': '+e)));
 console.log(log.join('\n'));
 console.log('\n오류: '+(errs.length?'\n  '+errs.join('\n  '):'없음'));
 console.log(errs.length?'\n❌ 실패 '+errs.length+'건':'\n✅ 전체 통과');
 await b.close();})();
