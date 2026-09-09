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

  log.push('1. 접힌 채로 시작');
  const p=await open(b,1440,1000);
  chk('접는 구간 2개', await p.evaluate(()=>[...document.querySelectorAll('.hm-fold')].map(e=>e.dataset.k).join(',')), 'proc,info');
  chk('처음엔 다 접힘', await p.evaluate(()=>document.querySelectorAll('.hm-fold.open').length), 0);
  chk('제목은 보임', await p.evaluate(()=>{
    const t=[...document.querySelectorAll('.hm-fold .sec-h2')].map(e=>e.textContent.trim());
    return t.length===2 && t.every(x=>x.length>0);
  }), 'true');
  const shortH=await p.evaluate(()=>document.body.scrollHeight);

  log.push('2. 접어도 내용은 남아 있다');
  chk('프로세스 7단계 그대로', await p.evaluate(()=>document.querySelectorAll('#proc-grid .proc-step').length>=7), 'true');
  chk('소식 위젯 그대로', await p.evaluate(()=>!!document.getElementById('sup-rank-widget') || !!document.getElementById('news-widget')), 'true');
  chk('화면에선 숨겨짐', await p.evaluate(()=>{
    const g=document.getElementById('proc-grid');
    return g ? g.offsetHeight : '(없음)';
  }), 0);

  log.push('3. 펼치기 · 기억');
  await p.evaluate(()=>gHomeFold('proc')); await p.waitForTimeout(400);
  chk('펼쳐짐', await p.evaluate(()=>document.querySelector('.hm-fold[data-k="proc"]').classList.contains('open')), 'true');
  chk('내용 보임', await p.evaluate(()=>document.getElementById('proc-grid').offsetHeight>0), 'true');
  chk('버튼 문구', await p.evaluate(()=>document.querySelector('.hm-fold[data-k="proc"] .hm-fold-l').textContent.trim()), '접기');
  chk('aria-expanded', await p.evaluate(()=>document.querySelector('.hm-fold[data-k="proc"] .hm-fold-btn').getAttribute('aria-expanded')), 'true');
  chk('페이지가 길어짐', await p.evaluate(()=>document.body.scrollHeight) > shortH, 'true');
  await p.reload({waitUntil:'load'}); await p.waitForTimeout(2200);
  chk('다시 열어도 펼친 채', await p.evaluate(()=>document.querySelector('.hm-fold[data-k="proc"]').classList.contains('open')), 'true');
  chk('안 건드린 건 접힌 채', await p.evaluate(()=>document.querySelector('.hm-fold[data-k="info"]').classList.contains('open')), 'false');
  await p.evaluate(()=>gHomeFold('proc')); await p.waitForTimeout(300);
  chk('되접기', await p.evaluate(()=>document.querySelector('.hm-fold[data-k="proc"]').classList.contains('open')), 'false');

  log.push('4. 주요 구간은 그대로');
  for(const [nm,sel] of [['검색','.gh-search'],['업종 바로가기','#cat8-grid .cs-item'],
                         ['실시간 요청','#rq-widget'],['오늘 시세','#mkt-strip'],['등록 업체','#sup-home']]){
    chk('  '+nm, await p.evaluate(s=>{
      const e=document.querySelector(s); return !!(e && e.offsetHeight>0);
    }, sel), 'true');
  }
  chk('주요 구간은 안 접힘', await p.evaluate(()=>
    !!document.querySelector('#cat8-grid')?.closest('.hm-fold')), 'false');

  log.push('5. 손가락에 맞는 버튼 · 가로 스크롤');
  chk('버튼 44px 이상', await p.evaluate(()=>
    [...document.querySelectorAll('.hm-fold-btn')].every(e=>e.getBoundingClientRect().height>=44)), 'true');
  chk('데스크톱 가로 스크롤 없음', await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1), 'true');
  const m=await open(b,390,844);
  chk('모바일도 접힘', await m.evaluate(()=>document.querySelectorAll('.hm-fold.open').length), 0);
  chk('모바일 가로 스크롤 없음', await m.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1), 'true');
  chk('모바일 버튼 44px 이상', await m.evaluate(()=>
    [...document.querySelectorAll('.hm-fold-btn')].every(e=>e.getBoundingClientRect().height>=44)), 'true');

  const allErrs=[].concat(p._errs,m._errs);
  console.log(log.join('\n'));
  if(allErrs.length){ console.log('  ❌ 페이지 에러: '+allErrs.join(' / ')); errs.push('pageerror'); }
  else console.log('  ✅ 페이지 에러 없음');
  console.log(errs.length ? '❌ '+errs.length+'건 실패: '+errs.join(', ') : '✅ 전체 통과');
  await b.close();
  process.exit(errs.length?1:0);
})();
