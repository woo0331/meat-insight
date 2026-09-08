/* ════════════════════════════════════════════════════════════════════
   키보드만으로 · 저장공간이 막힌 환경 · 느린 통신

   재 보고 고친 것들
     · 로그인 창을 열어도 초점이 뒤쪽 버튼에 남아 있었습니다 —
       키보드만 쓰는 사람은 창이 열린 줄도 몰랐습니다.
     · Tab 을 12번 누르면 창 밖으로 나가 버렸습니다 (가둠 없음).
     · 닫은 뒤 초점이 엉뚱한 곳으로 갔습니다.
     · 낭독기에 role="button" 으로 읽혔습니다 (창의 어둠막인데).
     · 초점 테두리가 0 → 3px 로 서서히 나타났습니다 (transition:all).

   저장공간(localStorage)은 사생활 보호 창에서 접근만 해도 예외를
   던집니다. 글자 크게·홈 접기·예시 끄기가 전부 거기에 기댑니다.
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
const BUYER={id:'u1',user_metadata:{name:'김철수',role:'buyer'}};
const M='#auth-modal';

const BLOCK=`(function(){
  try{ Object.defineProperty(window,'localStorage',{get:function(){throw new Error('blocked')}}); }catch(e){}
  try{ Object.defineProperty(window,'sessionStorage',{get:function(){throw new Error('blocked')}}); }catch(e){}
})();`;

async function open(b,{storage=true,slow=0}={}){
  const p=await b.newPage({viewport:{width:1440,height:1000}});
  p._errs=[]; p.on('pageerror',e=>p._errs.push(e.message)); p.on('dialog',d=>d.accept());
  let init=FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify({user:BUYER,realtime:true,delay:slow})+");";
  if(!storage) init=BLOCK+"\n"+init;
  await p.addInitScript(init);
  await p.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});
  await p.waitForTimeout(2600+slow);
  return p;
}

(async()=>{
  const b=await chromium.launch(); const log=[], errs=[];
  const chk=(n,g,w)=>{const ok=String(g)===String(w);
    log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w)); if(!ok)errs.push(n);};

  log.push('1. 로그인 창을 키보드로');
  const k=await open(b,{});
  await k.evaluate(()=>{ document.querySelector('.ha-login').focus(); openModal('login'); });
  await k.waitForTimeout(500);
  chk('창으로 읽힘 (role)', await k.evaluate(m=>document.querySelector(m).getAttribute('role'),M), 'dialog');
  chk('aria-modal', await k.evaluate(m=>document.querySelector(m).getAttribute('aria-modal'),M), 'true');
  chk('이름표 있음', await k.evaluate(m=>{const e=document.querySelector(m);
    return !!(e.getAttribute('aria-label')||e.getAttribute('aria-labelledby'));},M), 'true');
  chk('초점이 창 안으로', await k.evaluate(m=>document.querySelector(m).contains(document.activeElement),M), 'true');
  chk('바로 타이핑 가능 (입력칸)', await k.evaluate(()=>document.activeElement.tagName), 'INPUT');
  for(let i=0;i<14;i++) await k.keyboard.press('Tab');
  chk('Tab 14번에도 창 안', await k.evaluate(m=>document.querySelector(m).contains(document.activeElement),M), 'true');
  for(let i=0;i<5;i++) await k.keyboard.press('Shift+Tab');
  chk('Shift+Tab 도 창 안', await k.evaluate(m=>document.querySelector(m).contains(document.activeElement),M), 'true');
  await k.keyboard.press('Escape'); await k.waitForTimeout(400);
  chk('Escape 로 닫힘', await k.evaluate(m=>getComputedStyle(document.querySelector(m)).display,M), 'none');
  chk('초점이 열었던 버튼으로', await k.evaluate(()=>document.activeElement.className.includes('ha-login')), 'true');

  log.push('2. 초점 테두리가 즉시 보이는가');
  await k.evaluate(()=>document.body.focus());
  let ringed=0, checked=0;
  for(let i=0;i<24;i++){
    await k.keyboard.press('Tab');
    const r=await k.evaluate(()=>{
      const e=document.activeElement; if(!e||e===document.body) return null;
      const cs=getComputedStyle(e);
      return {w:parseFloat(cs.outlineWidth)||0, shadow:cs.boxShadow!=='none',
        t:(e.tagName+'.'+String(e.className)).slice(0,28)};
    });
    if(!r) continue;
    checked++;
    if(r.w>0||r.shadow) ringed++;
  }
  chk('훑은 요소 수', checked>10, 'true');
  chk('전부 테두리 보임 (지연 없이)', ringed, checked);

  log.push('3. 저장공간이 막힌 환경');
  const s=await open(b,{storage:false});
  chk('에러 없음', s._errs.length ? [...new Set(s._errs)].slice(0,2).join(' | ') : 0, 0);
  chk('화면이 그려짐', await s.evaluate(()=>!!document.querySelector('.pg.on')), 'true');
  chk('글자 크게 동작', await s.evaluate(async()=>{ gToggleTextSize();
    await new Promise(r=>setTimeout(r,300));
    return document.documentElement.classList.contains('txl'); }), 'true');
  chk('홈 접기 동작', await s.evaluate(async()=>{ go('h'); await new Promise(r=>setTimeout(r,500));
    gHomeFold('proc'); await new Promise(r=>setTimeout(r,300));
    return document.querySelector('.hm-fold[data-k="proc"]').classList.contains('open'); }), 'true');
  chk('그래도 에러 없음', s._errs.length ? [...new Set(s._errs)].slice(0,2).join(' | ') : 0, 0);

  log.push('4. 느린 통신 (2.5초 지연)');
  const w=await open(b,{slow:2500});
  chk('에러 없음', w._errs.length ? [...new Set(w._errs)].slice(0,2).join(' | ') : 0, 0);
  chk('결국 그려짐', await w.evaluate(()=>document.querySelectorAll('#rq-widget .rc').length>0), 'true');

  const all=[].concat(k._errs,s._errs,w._errs);
  console.log(log.join('\n'));
  if(all.length){ console.log('  ❌ 페이지 에러: '+[...new Set(all)].slice(0,3).join(' | ')); errs.push('pageerror'); }
  else console.log('  ✅ 페이지 에러 없음');
  console.log(errs.length ? '❌ '+errs.length+'건 실패: '+errs.join(', ') : '✅ 전체 통과');
  await b.close();
  process.exit(errs.length?1:0);
})();
