/* ════════════════════════════════════════════════════════════════════
   전 화면 훑기 — 화면 12개 × 두 폭(1440 · 390)

   화면마다 따로 확인하다 보면 한 곳을 고치고 다른 곳이 깨진 걸 놓칩니다.
   여기서는 모든 화면을 한 번에 돌면서 네 가지만 봅니다.

     · 가로 스크롤 (모바일에서 제일 흔한 사고)
     · 12px 미만 글씨 (연세 있는 이용자)
     · 40px 미만 버튼 (손가락)
     · 정말로 잘려서 못 보는 글

   실제로 이 검사가 잡아낸 것들
     · 요청 쓰기 — "STEP3. 확인 후 등록" 이 390px 에서 32px 삐져나감
     · 업체 상세 — 아래 버튼 4개가 한 줄에 안 들어가 106px 넘침
     · 구인구직 — 거르기 칩 34px, 지원 버튼 30px
     · 당일알바 — 고르는 칩 38px

   빼는 것: .sr-only(낭독기용 1px), 가로 스크롤러와 흐르는 띠
   — 넘치는 게 정상이고 손으로 밀어서 볼 수 있습니다.
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
const BUYER={id:'u1',user_metadata:{name:'김철수',role:'buyer'}};
const SUP  ={id:'u9',user_metadata:{name:'합신식',role:'supplier'}};

const SCREENS=[
  ['홈',        p=>p.evaluate(()=>go('h'))],
  ['요청 목록',  p=>p.evaluate(()=>go('reqs'))],
  ['요청 쓰기',  p=>p.evaluate(()=>go('rw'))],
  ['요청 상세',  p=>p.evaluate(()=>gOpenRequest('r1'))],
  ['업체 찾기',  p=>p.evaluate(()=>go('suppliers'))],
  ['업체 상세',  p=>p.evaluate(()=>{curSID='s1';go('sp');})],
  ['업체 등록',  p=>p.evaluate(()=>go('sj'))],
  ['거래관리',   p=>p.evaluate(()=>go('my'))],
  ['구인구직',   p=>p.evaluate(()=>go('jobs'))],
  ['시세',      p=>p.evaluate(()=>go('market'))],
  ['이용 가이드', p=>p.evaluate(()=>gOpenGuide())],
  ['당일알바',   p=>p.evaluate(()=>gOpenDaily())],
];

async function mk(b,w,h,user){
  const p=await b.newPage({viewport:{width:w,height:h}});
  await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify({user,realtime:true})+");");
  p._errs=[]; p.on('pageerror',e=>p._errs.push(e.message)); p.on('dialog',d=>d.accept());
  await p.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});
  await p.waitForTimeout(2300); return p;
}
const audit = p => p.evaluate(()=>{
  const tiny=[], small=[], clipped=[];
  document.querySelectorAll('body *').forEach(e=>{
    if(e.offsetParent===null) return;
    const cs=getComputedStyle(e), r=e.getBoundingClientRect();
    if(!e.children.length && e.textContent.trim()){
      const fs=parseFloat(cs.fontSize);
      if(fs && fs<12) tiny.push((e.className||e.tagName)+' '+fs);
    }
    if(/^(BUTTON|SELECT)$/.test(e.tagName) && r.width>0 && r.height>0 && r.height<40)
      small.push((e.className||e.tagName)+':'+Math.round(r.height));
    /* 정말로 잘려서 못 보는 글만 잡습니다.
       빼는 것: .sr-only(낭독기용 1px) · 안에 가로 스크롤러나 흐르는 띠를
       품은 칸(그건 넘치는 게 정상이고 손으로 밀어서 볼 수 있습니다). */
    if(!String(e.className).includes('sr-only') && !e.closest('.sr-only') &&
       e.scrollWidth > e.clientWidth + 2 && cs.overflowX==='hidden' && e.clientWidth > 20 &&
       !e.querySelector('.live-slide') &&
       ![...e.querySelectorAll('*')].some(k=>/auto|scroll/.test(getComputedStyle(k).overflowX)))
      clipped.push((e.className||e.tagName)+' '+e.scrollWidth+'>'+e.clientWidth);
  });
  return {tiny:[...new Set(tiny)].slice(0,4), small:[...new Set(small)].slice(0,4),
    clipped:[...new Set(clipped)].slice(0,3),
    hscroll:document.documentElement.scrollWidth-window.innerWidth};
});

(async()=>{
  const b=await chromium.launch(); let bad=0;
  for(const [w,h,tag,user] of [[1440,1000,'데스크톱',BUYER],[390,844,'모바일',SUP]]){
    const p=await mk(b,w,h,user);
    console.log('\n═══ '+tag+' ═══');
    for(const [nm,go] of SCREENS){
      try{ await go(p); }catch(e){ console.log('  ❌ '+nm+' 이동 실패: '+e.message); bad++; continue; }
      await p.waitForTimeout(1200);
      const a=await audit(p);
      const probs=[];
      if(a.hscroll>1) probs.push('가로스크롤 '+a.hscroll+'px');
      if(a.tiny.length) probs.push('작은글씨 '+a.tiny.join(','));
      if(a.small.length) probs.push('작은버튼 '+a.small.join(','));
      if(a.clipped.length) probs.push('잘림 '+a.clipped.join(','));
      if(probs.length){ console.log('  ❌ '+nm+' — '+probs.join(' | ')); bad++; }
      else console.log('  ✅ '+nm);
    }
    if(p._errs.length){ console.log('  ❌ 페이지 에러: '+[...new Set(p._errs)].join(' / ')); bad++; }
    await p.close();
  }
  console.log('\n'+(bad?'❌ '+bad+'건 실패':'✅ 전체 통과'));
  await b.close(); process.exit(bad?1:0);
})();
