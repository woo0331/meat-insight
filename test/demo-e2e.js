/* ════════════════════════════════════════════════════════════════════
   예시 데이터

   DB 가 비면 "아직 없습니다" 만 늘어서서 사이트가 휑합니다. 그렇다고
   가짜를 진짜처럼 넣으면 안 됩니다. 그래서 세 가지를 반드시 지켜야 합니다.

     1. 진짜 데이터가 하나라도 있으면 예시는 절대 안 나온다
     2. 예시일 때는 카드마다 배지 + 화면 위 안내 띠가 반드시 보인다
     3. 끄면 정직한 빈 상태로 돌아간다

   그리고 시세·뉴스에는 넣지 않습니다 — 돈을 걸고 판단하는 숫자와
   없는 기사 제목은 예시라도 보여주면 안 됩니다.

   DB 에 쓰지 않는 것도 확인합니다.
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');

async function open(b, empty, w, h){
  const p=await b.newPage({viewport:{width:w||1440,height:h||1000}});
  await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT({});"+(empty?
    "\n(function(){var d=window.__DB;if(d){d.purchase_requests=[];d.suppliers=[];d.jobs=[];}})();":""));
  p._errs=[]; p.on('pageerror',e=>p._errs.push(e.message)); p.on('dialog',d=>d.accept());
  await p.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});
  await p.waitForTimeout(3200);
  return p;
}

(async()=>{
  const b=await chromium.launch(); const log=[], errs=[];
  const chk=(n,g,w)=>{const ok=String(g)===String(w);
    log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w)); if(!ok)errs.push(n);};

  log.push('1. DB 가 비면 예시가 나온다');
  const e=await open(b,true);
  chk('안내 띠', await e.evaluate(()=>!!document.getElementById('dm-bar')), 'true');
  chk('안내 문구', await e.evaluate(()=>/예시/.test((document.getElementById('dm-bar')||{}).textContent||'')), 'true');
  chk('요청 카드', await e.evaluate(()=>document.querySelectorAll('#rq-widget .rc').length>0), 'true');
  chk('업체 카드', await e.evaluate(()=>document.querySelectorAll('#sup-home .sc2').length>0), 'true');

  log.push('2. 카드마다 배지가 보인다');
  chk('요청 카드 전부', await e.evaluate(()=>{
    const cs=[...document.querySelectorAll('#rq-widget .rc')];
    return cs.length>0 && cs.every(c=>{
      const t=c.querySelector('.dm-tag'); if(!t) return false;
      const r=t.getBoundingClientRect(); return r.width>0 && r.height>0;
    });
  }), 'true');
  chk('업체 카드 전부', await e.evaluate(()=>{
    const cs=[...document.querySelectorAll('#sup-home .sc2')];
    return cs.length>0 && cs.every(c=>!!c.querySelector('.dm-tag'));
  }), 'true');
  chk('배지가 폭을 안 먹음', await e.evaluate(()=>{
    const t=document.querySelector('#rq-widget .rc .dm-tag');
    return t ? t.getBoundingClientRect().width < 90 : '(없음)';
  }), 'true');

  log.push('3. 다시 그려도 배지가 남는다');
  await e.evaluate(()=>{ if(typeof renderReqs==='function') renderReqs(); });
  await e.waitForTimeout(500);
  chk('거르기 후에도', await e.evaluate(()=>{
    const cs=[...document.querySelectorAll('#rq-widget .rc, #rq-list-full .rc')];
    return cs.length>0 && cs.every(c=>!!c.querySelector('.dm-tag'));
  }), 'true');

  log.push('4. 시세·뉴스에는 넣지 않는다');
  chk('시세에 예시 없음', await e.evaluate(()=>
    !document.querySelector('#mkt-strip .dm-tag, #sec-mkt .dm-tag')), 'true');
  chk('뉴스에 예시 없음', await e.evaluate(()=>
    !document.querySelector('#news-widget .dm-tag')), 'true');

  log.push('5. DB 에는 쓰지 않는다');
  chk('요청 표 그대로 0건', await e.evaluate(()=>window.__DB.purchase_requests.length), 0);
  chk('업체 표 그대로 0건', await e.evaluate(()=>window.__DB.suppliers.length), 0);

  log.push('6. 진짜 데이터가 있으면 예시는 안 나온다');
  const r=await open(b,false);
  chk('안내 띠 없음', await r.evaluate(()=>!!document.getElementById('dm-bar')), 'false');
  chk('배지 0개', await r.evaluate(()=>document.querySelectorAll('.dm-tag').length), 0);
  chk('진짜 요청이 보임', await r.evaluate(()=>document.querySelectorAll('#rq-widget .rc').length>0), 'true');

  /* ── 진짜에는 절대 "예시" 를 붙이지 않는다 ─────────────────────────
     예전에는 예시 기능이 켜져 있기만 하면 그려진 카드를 전부 훑어
     배지를 달았습니다. 요청만 비고 업체·공고는 진짜인 사이트에서
     **진짜 업체와 진짜 공고에 "예시" 가 붙었습니다.**
     첫 손님이 올린 진짜 요청에 붙으면 더 나쁩니다. */
  log.push('6-1. 한쪽만 비었을 때 — 그쪽만 예시');
  const mix=await b.newPage({viewport:{width:1440,height:1000}});
  await mix.addInitScript(FAKE+"\nwindow.__FAKE_INIT({});"+
    "\n(function(){var d=window.__DB;if(d){d.purchase_requests=[];}})();");
  mix._errs=[]; mix.on('pageerror',e=>mix._errs.push(e.message)); mix.on('dialog',d=>d.accept());
  await mix.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});
  await mix.waitForTimeout(3200);
  const zone=async(key,sel)=>{ await mix.evaluate(k=>go(k),key); await mix.waitForTimeout(1100);
    return await mix.evaluate(s=>{const c=[...document.querySelectorAll(s)];
      return c.length+'/'+c.filter(x=>x.querySelector('.dm-tag')).length;}, sel); };
  chk('요청은 예시(전부 배지)', await zone('reqs','#rq-list-full .rc'), '6/6');
  chk('업체는 진짜(배지 0)',   await zone('suppliers','#sup-full .sc2'), '3/0');
  chk('공고는 진짜(배지 0)',   await zone('jobs','#job-full .job-card'), '2/0');  /* 요청 표를 비웠으니 구인 요청 한 건은 빠집니다 */
  errs.push(...mix._errs.map(e=>'mix: '+e));

  log.push('7. 끄면 정직한 빈 상태');
  await e.evaluate(()=>{ try{ localStorage.setItem('gori.demoOff','1'); }catch(x){} });
  await e.reload({waitUntil:'load'}); await e.waitForTimeout(3200);
  chk('안내 띠 없음', await e.evaluate(()=>!!document.getElementById('dm-bar')), 'false');
  chk('배지 0개', await e.evaluate(()=>document.querySelectorAll('.dm-tag').length), 0);
  chk('빈 안내가 나옴', await e.evaluate(()=>
    /아직 없습니다|등록된 공급업체가/.test(document.body.textContent)), 'true');

  log.push('8. 스위치로 통째로 끈다');
  const off=await b.newPage({viewport:{width:1440,height:1000}});
  await off.addInitScript(FAKE+"\nwindow.__FAKE_INIT({});"+
    "\n(function(){var d=window.__DB;if(d){d.purchase_requests=[];d.suppliers=[];d.jobs=[];}})();"+
    "\nwindow.addEventListener('DOMContentLoaded',function(){window.GORI_FEATURES=window.GORI_FEATURES||{};window.GORI_FEATURES.demo=false;});");
  await off.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});
  await off.waitForTimeout(3200);
  chk('demo:false 면 안 나옴', await off.evaluate(()=>document.querySelectorAll('.dm-tag').length), 0);

  const allErrs=[].concat(e._errs,r._errs);
  console.log(log.join('\n'));
  if(allErrs.length){ console.log('  ❌ 페이지 에러: '+[...new Set(allErrs)].join(' / ')); errs.push('pageerror'); }
  else console.log('  ✅ 페이지 에러 없음');
  console.log(errs.length ? '❌ '+errs.length+'건 실패: '+errs.join(', ') : '✅ 전체 통과');
  await b.close();
  process.exit(errs.length?1:0);
})();
