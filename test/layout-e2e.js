/* ════════════════════════════════════════════════════════════════════
   넓은 화면 레이아웃 · 마감 다듬기

   확인하는 것
     1. 1100px 이상에서 요청 상세·업체 상세·거래관리가 두 칸으로 담기는지
     2. 1100px 미만에서는 한 줄로 되돌아가는지 (모바일이 그대로인지)
     3. 견적 카드가 좁아진 칸에 맞춰 세 장 → 두 장으로 줄어드는지
        (#q-list 를 격자로 만들면 안내문이 카드를 덮던 문제)
     4. 거래관리 탭 12개가 두 줄로 접히지 않고 세로 목록이 되는지
     5. 내가 올린 요청에 "견적 보내기" 가 뜨지 않고, 같은 줄의
        정렬 선택은 살아 있는지
     6. 수정·마감 버튼이 한 칸에 모이는지 (떠도는 .ed-own 이 없는지)
     7. 불러오는 동안 뼈대가 보이는지
     8. 두 폭 모두에서 가로 스크롤이 생기지 않는지
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
const BUYER={id:'u1',user_metadata:{name:'김철수',role:'buyer'}};
const SUP  ={id:'u9',user_metadata:{name:'합신식',role:'supplier'}};

async function open(b,user,w,h){
  const p=await b.newPage({viewport:{width:w,height:h||900}});
  await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify({user})+");");
  p._errs=[]; p.on('pageerror',e=>p._errs.push(e.message)); p.on('dialog',d=>d.accept());
  await p.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});
  await p.waitForTimeout(1900);
  return p;
}
const cols = (p,sel)=>p.evaluate(s=>{
  const el=document.querySelector(s); if(!el) return '(없음)';
  return getComputedStyle(el).gridTemplateColumns.split(' ').length;
}, sel);

(async()=>{
  const b=await chromium.launch(); const log=[], errs=[];
  const chk=(n,g,w)=>{const ok=String(g)===String(w);
    log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w)); if(!ok)errs.push(n);};

  log.push('1. 데스크톱(1440) — 요청 상세 두 칸');
  const d=await open(b,BUYER,1440,1000);
  await d.evaluate(()=>gOpenRequest('r1')); await d.waitForTimeout(1400);
  chk('#reqd-body 두 칸', await d.evaluate(()=>{
    const e=document.getElementById('reqd-body');
    return !!(e && e.classList.contains('lay2') && e.querySelector(':scope > .lay-side') && e.querySelector(':scope > .lay-main'));
  }), 'true');
  chk('요약은 왼쪽', await d.evaluate(()=>!!document.querySelector('#reqd-body > .lay-side .gsum')), 'true');
  chk('통계도 왼쪽', await d.evaluate(()=>!!document.querySelector('#reqd-body > .lay-side .qbar')), 'true');
  chk('견적은 오른쪽', await d.evaluate(()=>!!document.querySelector('#reqd-body > .lay-main #q-list')), 'true');
  chk('견적 카드 두 장씩', await cols(d,'#reqd-body .qcmp'), 2);
  chk('#q-list 는 격자 아님', await d.evaluate(()=>getComputedStyle(document.getElementById('q-list')).display), 'block');

  log.push('2. 내 요청 — 견적 보내기는 감추고 정렬은 살린다');
  chk('견적 보내기 없음', await d.evaluate(()=>
    [...document.querySelectorAll('#pg-reqd button')].some(e=>e.textContent.trim()==='견적 보내기' && !e.hidden)), 'false');
  chk('정렬 선택 보임', await d.evaluate(()=>{
    const s=document.getElementById('q-sort');
    return !!(s && s.offsetParent!==null && s.getBoundingClientRect().width>40);
  }), 'true');

  log.push('3. 내 요청 액션 한 칸');
  chk('.own-acts 하나', await d.evaluate(()=>document.querySelectorAll('#reqd-body .own-acts').length), 1);
  chk('떠도는 .ed-own 없음', await d.evaluate(()=>document.querySelectorAll('#reqd-body .ed-own').length), 0);
  chk('버튼 순서', await d.evaluate(()=>
    [...document.querySelectorAll('#reqd-body .own-acts-r > button')].map(e=>e.textContent.trim()).join('|')),
    '요청 수정|이 요청 마감하기');
  chk('버튼 한 줄', await d.evaluate(()=>{
    const bs=[...document.querySelectorAll('#reqd-body .own-acts-r > button')];
    return bs.length>1 && Math.abs(bs[0].getBoundingClientRect().top-bs[1].getBoundingClientRect().top)<2;
  }), 'true');

  log.push('4. 거래관리 — 탭이 왼쪽 세로 목록');
  await d.evaluate(()=>go('my')); await d.waitForTimeout(1500);
  chk('#my-body 두 칸', await d.evaluate(()=>{
    const e=document.getElementById('my-body');
    return !!(e && e.classList.contains('lay2'));
  }), 'true');
  chk('탭이 왼쪽', await d.evaluate(()=>!!document.querySelector('#my-body > .lay-side .my-tabs')), 'true');
  chk('머리글은 전체 폭', await d.evaluate(()=>{
    const h=document.querySelector('#my-body > .my-hd');
    return !!(h && h.classList.contains('lay-full'));
  }), 'true');
  chk('탭 두 줄 안 됨', await d.evaluate(()=>{
    const bs=[...document.querySelectorAll('#my-body .my-tab')];
    if(bs.length<6) return '(탭 '+bs.length+'개)';
    const l=bs[0].getBoundingClientRect().left;
    return bs.every(e=>Math.abs(e.getBoundingClientRect().left-l)<2);
  }), 'true');
  chk('탭 12개 그대로', await d.evaluate(()=>document.querySelectorAll('#my-body .my-tab').length), 12);

  log.push('5. 업체 상세 — 행동 버튼이 오른쪽');
  await d.evaluate(()=>{ curSID='s1'; go('sp'); }); await d.waitForTimeout(1500);
  chk('두 칸', await d.evaluate(()=>{
    const e=document.querySelector('#sp-body .gp');
    return !!(e && e.classList.contains('lay2') && e.classList.contains('gp-wide'));
  }), 'true');
  chk('.sd-cta 오른쪽', await d.evaluate(()=>!!document.querySelector('#sp-body .lay-side .sd-cta')), 'true');

  log.push('6. 목록 — 넓은 화면에서 두 장씩');
  await d.evaluate(()=>go('reqs')); await d.waitForTimeout(1200);
  chk('요청 목록 2열', await cols(d,'#rq-list-full .rc-list'), 2);
  await d.evaluate(()=>go('suppliers')); await d.waitForTimeout(1200);
  chk('업체 목록 2열', await cols(d,'#sup-full'), 2);

  log.push('7. 좁은 화면(1000) — 한 줄 그대로');
  const n=await open(b,BUYER,1000,900);
  await n.evaluate(()=>gOpenRequest('r1')); await n.waitForTimeout(1400);
  chk('요약·견적이 세로로', await n.evaluate(()=>{
    const s=document.querySelector('#reqd-body > .lay-side'), m=document.querySelector('#reqd-body > .lay-main');
    if(!s||!m) return '(안 담김)';
    return m.getBoundingClientRect().top >= s.getBoundingClientRect().top;
  }), 'true');
  chk('두 칸 폭이 같다(=한 줄)', await n.evaluate(()=>{
    const s=document.querySelector('#reqd-body > .lay-side'), m=document.querySelector('#reqd-body > .lay-main');
    return Math.abs(s.getBoundingClientRect().width-m.getBoundingClientRect().width)<2;
  }), 'true');
  chk('견적 카드 세 장씩', await cols(n,'#reqd-body .qcmp'), 3);

  log.push('8. 모바일(390) — 그대로');
  const m=await open(b,BUYER,390,844);
  await m.evaluate(()=>gOpenRequest('r1')); await m.waitForTimeout(1400);
  chk('견적 카드 한 장씩', await cols(m,'#reqd-body .qcmp'), 1);
  chk('가로 스크롤 없음', await m.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1), 'true');
  await m.evaluate(()=>go('my')); await m.waitForTimeout(1400);
  chk('거래관리 가로 스크롤 없음', await m.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1), 'true');
  await m.evaluate(()=>go('reqs')); await m.waitForTimeout(1200);
  chk('요청 목록 한 장씩', await m.evaluate(()=>{
    const e=document.querySelector('#rq-list-full .rc-list');
    return e ? getComputedStyle(e).display : '(없음)';
  }), 'flex');
  chk('요청 목록 가로 스크롤 없음', await m.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1), 'true');
  chk('데스크톱 가로 스크롤 없음', await d.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1), 'true');

  log.push('9. 불러오는 동안 뼈대');
  chk('뼈대 함수', await d.evaluate(()=>typeof GORI.skelPanel==='function'), 'true');
  const s2=await open(b,SUP,1440,1000);
  chk('요청 상세 뼈대', await s2.evaluate(()=>{
    gOpenRequest('r2');
    const e=document.getElementById('reqd-body');
    return !!e.querySelector('.skel') && e.getAttribute('aria-busy')===null;
  }), 'true');
  await s2.waitForTimeout(1400);
  chk('뼈대는 사라짐', await s2.evaluate(()=>!!document.querySelector('#reqd-body .skel')), 'false');
  chk('예전 문구 없음', await s2.evaluate(()=>/불러오는 중…/.test(document.getElementById('reqd-body').textContent)), 'false');

  log.push('10. 정렬 선택 모양');
  await s2.evaluate(()=>gOpenRequest('r1')); await s2.waitForTimeout(1400);
  chk('OS 화살표 제거', await s2.evaluate(()=>getComputedStyle(document.getElementById('q-sort')).appearance), 'none');
  chk('버튼과 높이 비슷', await s2.evaluate(()=>{
    const s=document.getElementById('q-sort');
    const b=[...document.querySelectorAll('#reqd-body .gbtn-sm')][0];
    if(!s||!b) return '(없음)';
    return Math.abs(s.getBoundingClientRect().height-b.getBoundingClientRect().height)<=3;
  }), 'true');
  chk('안내문이 카드 아래', await s2.evaluate(()=>{
    const g=document.querySelector('#q-list > .ghint'), c=document.querySelector('#q-list > .qcmp');
    if(!g||!c) return '(없음)';
    return g.getBoundingClientRect().top >= c.getBoundingClientRect().bottom - 1;
  }), 'true');
  chk('정렬 동작', await s2.evaluate(async()=>{
    const s=document.getElementById('q-sort'); s.value='rating'; s.dispatchEvent(new Event('change'));
    await new Promise(r=>setTimeout(r,300));
    return document.querySelectorAll('#q-list .qc').length;
  }), 2);

  const allErrs=[].concat(d._errs,n._errs,m._errs,s2._errs);
  console.log(log.join('\n'));
  if(allErrs.length){ console.log('  ❌ 페이지 에러: '+allErrs.join(' / ')); errs.push('pageerror'); }
  else console.log('  ✅ 페이지 에러 없음');
  console.log(errs.length ? '❌ '+errs.length+'건 실패: '+errs.join(', ') : '✅ 전체 통과');
  await b.close();
  process.exit(errs.length?1:0);
})();
