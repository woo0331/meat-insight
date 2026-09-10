/* ════════════════════════════════════════════════════════════════════
   요청서 2단계 — 필수 먼저, 선택은 접기

   "한우" 를 눌러 들어가면 한 화면에 열다섯 칸이 쏟아졌습니다. 그중 정말
   필요한 건 일곱뿐인데 별표 유무 말고는 구분이 없어서, 전부 채워야 할
   것처럼 보였습니다. 게다가 "한우" 가 축종 칩에도 있고 "부위 / 품목"
   칸에도 박혀 있어서 같은 말이 두 번 나왔습니다.

   확인하는 것
     1. 처음에는 필수 칸만 보인다
     2. 접힌 것은 사라진 게 아니라 한 번 눌러 펼쳐진다
     3. 선택 칸에는 "선택" 이라고 적혀 있다
     4. 히어로에서 넘어온 말이 칩에 있으면 칩을 켠다 (칸에 안 박는다)
     5. 접어 둔 채로도 끝까지 등록된다 · 펼쳐서 쓴 값도 살아남는다
     6. 글씨 12px 이상 · 누르는 것 40px 이상 · 가로 스크롤 없음
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
const URL='file:///home/user/meat-insight/index.html';

/* W 는 IIFE 안의 지역 변수라 밖에서 못 봅니다 — 단계 표시로 읽습니다 */
const STEP="()=>{const i=[...document.querySelectorAll('#rw-wizard .gstep-i')].findIndex(e=>e.classList.contains('on'));return i+1;}";

async function open(b,w,h){
  const p=await b.newPage({viewport:{width:w,height:h}});
  await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT({})");
  p._errs=[]; p.on('pageerror',e=>p._errs.push(e.message)); p.on('dialog',d=>d.accept());
  await p.goto(URL,{waitUntil:'load'});
  await p.waitForTimeout(3000);
  return p;
}
/* 히어로 인기검색어를 눌러 2단계까지 들어갑니다 */
async function viaHero(p,word){
  await p.evaluate(w=>{
    const c=[...document.querySelectorAll('#hero-chips .hchip')].find(e=>e.textContent.trim()===w);
    if(c) c.click();
  },word);
  await p.waitForTimeout(1500);
}

(async()=>{
  const b=await chromium.launch(); const log=[], errs=[];
  const chk=(n,g,w)=>{const ok=String(g)===String(w);
    log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w)); if(!ok)errs.push(n);};

  const p=await open(b,1440,950);
  await viaHero(p,'한우');

  log.push('1. 처음에는 필수만');
  chk('2단계까지 왔다', await p.evaluate(()=>{
    const i=[...document.querySelectorAll('#rw-wizard .gstep-i')].findIndex(e=>e.classList.contains('on'));
    return !!document.querySelector('#rw-wizard .gcard') && i===1;
  }), 'true');
  chk('보이는 칸은 필수뿐', await p.evaluate(()=>{
    const vis=[...document.querySelectorAll('#rw-wizard .rwf')].filter(e=>e.offsetParent);
    const bad=vis.filter(e=>e.classList.contains('rwf-opt'))
      .map(e=>e.getAttribute('data-f'));
    return bad.join(',');
  }), '');
  chk('접힌 칸이 있다', await p.evaluate(()=>
    document.querySelectorAll('#rw-wizard .rw-opt .rwf-opt').length>0), 'true');
  chk('필수만 채우면 된다고 알려준다', await p.evaluate(()=>
    !!document.querySelector('#rw-wizard .rw-lead')), 'true');

  log.push('2. 접힌 것은 한 번 눌러 펼친다');
  chk('펼치기 버튼', await p.evaluate(()=>{
    const btn=document.querySelector('#rw-wizard .rw-more');
    return !!btn && btn.getAttribute('aria-expanded')==='false';
  }), 'true');
  chk('누르면 펼쳐진다', await p.evaluate(async()=>{
    document.querySelector('#rw-wizard .rw-more').click();
    await new Promise(r=>setTimeout(r,200));
    const btn=document.querySelector('#rw-wizard .rw-more');
    const n=[...document.querySelectorAll('#rw-wizard .rwf-opt')].filter(e=>e.offsetParent).length;
    return btn.getAttribute('aria-expanded')==='true' && n>0;
  }), 'true');
  chk('선택 칸에 "선택" 이라고 적혀 있다', await p.evaluate(()=>{
    const opt=[...document.querySelectorAll('#rw-wizard .rwf-opt')];
    return opt.length && opt.every(e=>!!e.querySelector('.rwf-opt-tag'));
  }), 'true');
  chk('필수 칸에는 안 적혀 있다', await p.evaluate(()=>
    [...document.querySelectorAll('#rw-wizard .rwf-req')].some(e=>e.querySelector('.rwf-opt-tag'))), 'false');
  chk('연락처도 이름·연락처만', await p.evaluate(()=>{
    const vis=id=>{const e=document.getElementById(id); return !!(e&&e.offsetParent);};
    return vis('w-name') && vis('w-phone');
  }), 'true');

  log.push('3. 히어로에서 넘어온 말은 칩으로');
  chk('축종 칩이 켜졌다', await p.evaluate(()=>
    [...document.querySelectorAll('#w-species .gpick-i.on')].map(e=>e.textContent.trim()).join(',')), '한우');
  /* 한우는 부위가 아닙니다 — 바로 위 칩에 있는 말을 칸에 또 박으면
     같은 단어가 화면에 두 번 나옵니다 */
  chk('부위 칸에는 안 박힌다', await p.evaluate(()=>
    String((document.getElementById('w-part')||{}).value||'')), '');
  /* 칩에 없는 말은 예전대로 칸에 들어가야 합니다 */
  const q=await open(b,1440,950);
  await viaHero(q,'정육점 인테리어');
  chk('칩에 없는 말은 칸으로', await q.evaluate(()=>{
    const ids=['w-part','w-item','w-spec','w-biz','w-etc'];
    return ids.some(i=>{const e=document.getElementById(i); return e && /정육점/.test(e.value||'');});
  }), 'true');

  log.push('4. 접어 둔 채로도 끝까지 간다');
  chk('필수만 채우고 3단계로', await p.evaluate(async()=>{
    document.getElementById('w-part').value='등심';
    document.getElementById('w-qty').value='100';
    document.querySelector('#w-temp .gpick-i').click();
    document.getElementById('w-name').value='홍길동';
    document.getElementById('w-phone').value='010-1234-5678';
    window.gStep3(); await new Promise(r=>setTimeout(r,500));
    return [...document.querySelectorAll('#rw-wizard .gstep-i')].findIndex(e=>e.classList.contains('on'))===2;
  }), 'true');
  chk('펼쳐서 쓴 값도 살아 있다', await p.evaluate(async()=>{
    window.gStep2(); await new Promise(r=>setTimeout(r,600));
    document.querySelector('#rw-wizard .rw-more').click();
    await new Promise(r=>setTimeout(r,200));
    const g=document.getElementById('w-grade'); g.value='1++';
    window.gStep3(); await new Promise(r=>setTimeout(r,500));
    window.gStep2(); await new Promise(r=>setTimeout(r,600));
    return String((document.getElementById('w-grade')||{}).value||'');
  }), '1++');

  log.push('5. 읽기 · 누르기 · 가로 스크롤');
  const audit=async(pg)=>await pg.evaluate(()=>{
    const wz=document.getElementById('rw-wizard'); const bad=[];
    wz.querySelectorAll('*').forEach(e=>{
      if(!e.offsetParent||!e.textContent.trim()||e.children.length) return;
      const f=parseFloat(getComputedStyle(e).fontSize);
      if(f<12) bad.push('작은글씨 '+(e.className||e.tagName)+':'+f);
    });
    wz.querySelectorAll('button,select,input,textarea,[onclick],[role=button]').forEach(e=>{
      if(e.parentElement && e.parentElement.closest('button,[onclick],[role=button]')) return;
      const r=e.getBoundingClientRect();
      if(r.height>0 && r.height<40) bad.push('작은버튼 '+(e.textContent||e.id||'').trim().slice(0,12)+':'+Math.round(r.height));
    });
    return [...new Set(bad)].join(', ');
  });
  chk('데스크톱 규칙 위반 없음', await audit(p), '');
  chk('데스크톱 가로 스크롤 없음', await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1), 'true');

  const m=await open(b,390,844);
  await viaHero(m,'한우');
  chk('모바일도 필수만', await m.evaluate(()=>
    [...document.querySelectorAll('#rw-wizard .rwf')].filter(e=>e.offsetParent)
      .every(e=>e.classList.contains('rwf-req'))), 'true');
  await m.evaluate(()=>document.querySelector('#rw-wizard .rw-more').click());
  await m.waitForTimeout(250);
  chk('모바일 규칙 위반 없음', await audit(m), '');
  chk('모바일 가로 스크롤 없음', await m.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1), 'true');

  const allErrs=[].concat(p._errs,q._errs,m._errs);
  console.log(log.join('\n'));
  if(allErrs.length){ console.log('  ❌ 페이지 에러: '+allErrs.join(' / ')); errs.push('pageerror'); }
  else console.log('  ✅ 페이지 에러 없음');
  console.log(errs.length ? '❌ '+errs.length+'건 실패: '+errs.join(', ') : '✅ 전체 통과');
  await b.close();
  process.exit(errs.length?1:0);
})();
