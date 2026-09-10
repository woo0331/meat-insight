/* ════════════════════════════════════════════════════════════════════
   홈 접기

   홈에 구간이 12개 쌓여 있어 어디부터 봐야 할지 알 수 없었습니다.
   부차적인 두 구간(이용 프로세스 · 소식·정보)을 접습니다.

   확인하는 것
     1. 두 구간이 접힌 채로 시작하고, 홈이 짧아지는지
     2. 접어도 안의 내용이 사라지지 않는지 (숨겨졌을 뿐인지)
     3. 펼치면 원래대로 보이고, 이 기기에 기억되는지
     4. 주요 구간(검색·분야·실시간 요청·시세)은 접히지 않는지
     5. 접기 버튼이 손가락에 맞는지
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');

async function open(b,w,h){
  const p=await b.newPage({viewport:{width:w,height:h}});
  await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT({})");
  p._errs=[]; p.on('pageerror',e=>p._errs.push(e.message)); p.on('dialog',d=>d.accept());
  await p.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});
  await p.waitForTimeout(2200);
  return p;
}

(async()=>{
  const b=await chromium.launch(); const log=[], errs=[];
  const chk=(n,g,w)=>{const ok=String(g)===String(w);
    log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w)); if(!ok)errs.push(n);};

  /* 2026 정리: 접는 구간은 GORI INSIGHT 하나뿐입니다.
     이용 프로세스는 일곱 단계를 네 걸음으로 줄여서 접을 이유가 없어졌고,
     INSIGHT 는 읽을 거리가 실제로 있을 때만 열립니다. */
  log.push('1. 이용 방법은 접지 않는다');
  const p=await open(b,1440,1000);
  chk('네 걸음', await p.evaluate(()=>document.querySelectorAll('#proc-grid .proc-step').length), 4);
  chk('바로 보임', await p.evaluate(()=>document.getElementById('proc-grid').offsetHeight>0), 'true');
  chk('접는 상자 안에 없음', await p.evaluate(()=>
    !document.getElementById('proc-grid').closest('.hm-fold')), 'true');

  log.push('2. GORI INSIGHT — 읽을 거리가 있을 때만');
  chk('콘텐츠 없으면 안 보임', await p.evaluate(()=>{
    const el=document.getElementById('news-widget'); const sec=el&&el.closest('section');
    return sec ? sec.hidden : '(없음)';
  }), 'true');
  chk('위젯은 그대로 있음', await p.evaluate(()=>!!document.getElementById('news-widget')), 'true');
  const shortH=await p.evaluate(()=>document.body.scrollHeight);

  log.push('3. 콘텐츠가 들어오면 열리고, 접힌 채로 시작한다');
  await p.evaluate(async()=>{
    window.GORI_CONTENT.news=[{title:"테스트 기사",url:"https://example.com/x",date:"2026-01-01"}];
    if(window.GORI.ctApply) window.GORI.ctApply();
    await new Promise(r=>setTimeout(r,500));
  });
  await p.waitForTimeout(600);
  chk('구간이 열림', await p.evaluate(()=>{
    const sec=document.getElementById('news-widget').closest('section'); return sec.hidden;
  }), 'false');
  chk('접힌 채 시작', await p.evaluate(()=>{
    const f=document.querySelector('.hm-fold[data-k="info"]');
    return f ? f.classList.contains('open') : '(접기 없음)';
  }), 'false');
  chk('펼치면 내용 보임', await p.evaluate(async()=>{
    gHomeFold('info'); await new Promise(r=>setTimeout(r,400));
    return document.getElementById('news-widget').offsetHeight>0;
  }), 'true');
  chk('페이지가 길어짐', await p.evaluate(()=>document.body.scrollHeight) > shortH, 'true');
  chk('aria-expanded', await p.evaluate(()=>
    document.querySelector('.hm-fold[data-k="info"] .hm-fold-btn').getAttribute('aria-expanded')), 'true');
  chk('되접기', await p.evaluate(async()=>{
    gHomeFold('info'); await new Promise(r=>setTimeout(r,300));
    return document.querySelector('.hm-fold[data-k="info"]').classList.contains('open');
  }), 'false');

  log.push('4. 주요 구간은 그대로');
  for(const [nm,sel] of [['검색','.gh-search'],['업종 바로가기','#cat8-grid .cs-item'],
                         ['오늘의 축산 정보','#mkt-strip'],['핵심 서비스','.svc-cards .svc-card'],
                         ['이용 방법','#proc-grid .proc-step'],['신뢰','#why-band .why-c']]){
    chk('  '+nm, await p.evaluate(s=>{
      const e=document.querySelector(s); return !!(e && e.offsetHeight>0);
    }, sel), 'true');
  }
  chk('주요 구간은 안 접힘', await p.evaluate(()=>
    !!document.querySelector('#cat8-grid')?.closest('.hm-fold')), 'false');

  log.push('5. 손가락에 맞는 버튼 · 가로 스크롤');
  chk('버튼 44px 이상', await p.evaluate(()=>
    [...document.querySelectorAll('.hm-fold-btn')].filter(e=>e.offsetParent)
      .every(e=>e.getBoundingClientRect().height>=44)), 'true');
  chk('데스크톱 가로 스크롤 없음', await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1), 'true');
  const m=await open(b,390,844);
  chk('모바일도 접힌 채', await m.evaluate(()=>document.querySelectorAll('.hm-fold.open').length), 0);
  chk('모바일 가로 스크롤 없음', await m.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1), 'true');
  chk('모바일 버튼 44px 이상', await m.evaluate(()=>
    [...document.querySelectorAll('.hm-fold-btn')].filter(e=>e.offsetParent)
      .every(e=>e.getBoundingClientRect().height>=44)), 'true');

  const allErrs=[].concat(p._errs,m._errs);
  console.log(log.join('\n'));
  if(allErrs.length){ console.log('  ❌ 페이지 에러: '+allErrs.join(' / ')); errs.push('pageerror'); }
  else console.log('  ✅ 페이지 에러 없음');
  console.log(errs.length ? '❌ '+errs.length+'건 실패: '+errs.join(', ') : '✅ 전체 통과');
  await b.close();
  process.exit(errs.length?1:0);
})();
