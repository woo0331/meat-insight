/* ════════════════════════════════════════════════════════════════════
   프리미엄 메인 — 첫 화면 · 지표 · 업종 줄 · 서비스 카드

   겉모습을 갈아입히면서 기존 기능이 딸려 나가지 않았는지 봅니다.
   특히 히어로는 id 와 onclick 을 그대로 옮겨 온 것이라, 하나라도
   빠지면 검색·지역·알림이 조용히 죽습니다.

   확인하는 것
     1. 헤더 메뉴 6개가 전부 있는 화면으로 이어지는지
     2. 히어로 — 검색이 예전 heroGo() 로 그대로 붙어 있는지
     3. 인기검색어 9개가 전부 분야를 찾아내는지 (빈 요청서로 안 새는지)
     4. 업종 12칸 + 전체보기, 그림이 전부 다른지, 목적지가 유효한지
     5. 지표 — 없는 숫자를 지어내지 않는지
     6. 서비스 카드 6장이 있는 화면으로만 가는지
     7. 데스크톱·태블릿·모바일 가로 스크롤 없음 · 12px/40px 규칙
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
const URL='file:///home/user/meat-insight/index.html';

async function open(b,w,h,init){
  const p=await b.newPage({viewport:{width:w,height:h}});
  await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify(init||{})+")");
  p._errs=[]; p.on('pageerror',e=>p._errs.push(e.message)); p.on('dialog',d=>d.accept());
  await p.goto(URL,{waitUntil:'load'});
  await p.waitForTimeout(2600);
  return p;
}

(async()=>{
  const b=await chromium.launch(); const log=[], errs=[];
  const chk=(n,g,w)=>{const ok=String(g)===String(w);
    log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w)); if(!ok)errs.push(n);};

  const p=await open(b,1440,950);

  log.push('1. 헤더');
  chk('메뉴 6개', await p.evaluate(()=>
    [...document.querySelectorAll('.hdr-nav a')].map(a=>a.textContent.trim()).join('|')),
    '업체 찾기|견적 요청|축산 시세|구인구직|뉴스|커뮤니티');
  chk('전부 있는 화면으로', await p.evaluate(()=>{
    const want=['suppliers','rw','market','jobs','news','community'];
    return want.every(k=>PGS.indexOf(k)>=0 && !!document.getElementById('pg-'+k));
  }), 'true');
  chk('로그인·회원가입·전체메뉴', await p.evaluate(()=>
    !!document.querySelector('.hdr-actions .ha-login') &&
    !!document.querySelector('[onclick*="signup"]') &&
    !!document.querySelector('.hd-all')), 'true');
  chk('검색 아이콘이 검색창으로', await p.evaluate(async()=>{
    document.querySelector('.hd-search').click();
    await new Promise(r=>setTimeout(r,400));
    return document.activeElement && document.activeElement.id==='hs-input';
  }), 'true');

  log.push('2. 히어로 — 옮겨 온 기능이 살아 있는지');
  chk('검색 입력 id 그대로', await p.evaluate(()=>!!document.querySelector('.gh.ph #hs-input')), 'true');
  chk('검색 버튼 → heroGo', await p.evaluate(()=>
    (document.querySelector('.gh.ph .gh-s-btn').getAttribute('onclick')||'').indexOf('heroGo')>=0), 'true');
  chk('엔터도 heroGo', await p.evaluate(()=>
    (document.getElementById('hs-input').getAttribute('onkeydown')||'').indexOf('heroGo')>=0), 'true');
  chk('지역 선택 살아 있음', await p.evaluate(()=>
    (document.getElementById('gh-region').getAttribute('onclick')||'').indexOf('gPickRegion')>=0), 'true');
  chk('알림 살아 있음', await p.evaluate(()=>
    !!document.querySelector('.gh.ph [onclick*="gHeroBell"]') && !!document.getElementById('gh-bell-dot')), 'true');
  chk('gh-stat 자리 유지', await p.evaluate(()=>!!document.getElementById('gh-stat')), 'true');
  chk('메인 카피', await p.evaluate(()=>document.querySelector('.ph-h1').textContent.replace(/\s+/g,' ').trim()),
    '축산업의 모든 연결, 고리');
  chk('"고리"만 브랜드색', await p.evaluate(()=>{
    const em=document.querySelector('.ph-h1 em');
    return em.textContent.trim()==='고리' &&
      getComputedStyle(em).color!==getComputedStyle(document.querySelector('.ph-h1')).color;
  }), 'true');
  chk('밸류체인 6단계', await p.evaluate(()=>
    [...document.querySelectorAll('.pc-node .pc-nm')].map(e=>e.textContent.trim()).join('→')),
    '사육→도축·경매→가공→물류→포장·장비→정육점·식당');
  chk('실제 검색이 동작', await p.evaluate(async()=>{
    const i=document.getElementById('hs-input'); i.value='돼지고기'; heroGo();
    await new Promise(r=>setTimeout(r,500));
    return !document.getElementById('pg-h').classList.contains('on');
  }), 'true');
  await p.evaluate(()=>go('h')); await p.waitForTimeout(400);

  log.push('3. 인기검색어');
  chk('9개', await p.evaluate(()=>document.querySelectorAll('#hero-chips .hchip').length), 9);
  chk('전부 분야를 찾아냄', await p.evaluate(()=>
    HERO_CHIPS.filter(t=>!guessCat8(t)).join(',')), '');
  chk('전부 heroPick 으로', await p.evaluate(()=>
    [...document.querySelectorAll('#hero-chips .hchip')]
      .every(b=>(b.getAttribute('onclick')||'').indexOf('heroPick')>=0)), 'true');

  log.push('4. 업종 바로가기');
  chk('12칸 + 전체보기', await p.evaluate(()=>document.querySelectorAll('#cat8-grid .cs-item').length), 13);
  chk('그림이 전부 다름', await p.evaluate(()=>{
    const d=[...document.querySelectorAll('#cat8-grid .cs-ic svg')].map(s=>s.innerHTML);
    return new Set(d).size;
  }), 13);
  chk('목적지가 전부 유효', await p.evaluate(()=>{
    /* pickSub 의 t 는 그 분야 legacy 에 있어야 곧장 해당 요청서로 갑니다 */
    return window.GORI.CS_ITEMS.filter(it=>{
      const c=cat8Of(it.k); return !c || (it.t && c.legacy.indexOf(it.t)<0);
    }).map(it=>it.nm).join(',');
  }), '');
  chk('전체보기는 홈으로 안 튕김', await p.evaluate(async()=>{
    document.querySelector('#cat8-grid .cs-all').click();
    await new Promise(r=>setTimeout(r,450));
    return !document.getElementById('pg-h').classList.contains('on');
  }), 'true');
  await p.evaluate(()=>go('h')); await p.waitForTimeout(400);

  log.push('5. 지표 — 지어내지 않는다');
  chk('숫자칸 4개', await p.evaluate(()=>document.querySelectorAll('#pf-stats .pstat-c').length), 4);
  chk('없는 값은 준비 중', await p.evaluate(()=>{
    /* 실데이터가 없는 칸에 0 이나 임의의 수가 걸리면 안 됩니다 */
    const cells=[...document.querySelectorAll('#pf-stats .pstat-c')];
    return cells.every(c=>{
      const v=c.querySelector('.pstat-v');
      if(v.classList.contains('wait')) return /준비 중|등록 전/.test(v.textContent);
      return /[1-9]/.test(v.textContent);        /* 숫자를 쓸 거면 0 이 아니어야 합니다 */
    });
  }), 'true');
  chk('예시 데이터를 실적으로 안 올림', await p.evaluate(()=>{
    if(!(typeof dmEnabled==='function' && dmEnabled())) return 'demo-off';
    const t=document.getElementById('pf-stats').textContent;
    return /예시/.test(t) ? 'demo-off' : 'FAIL';
  }), 'demo-off');

  log.push('6. 서비스 카드');
  chk('6장', await p.evaluate(()=>document.querySelectorAll('.svc-cards .svc-card').length), 6);
  chk('제목', await p.evaluate(()=>
    [...document.querySelectorAll('.svc-cards .svc-t')].map(e=>e.textContent.trim()).join('|')),
    '업체 찾기|견적 요청|축산 시세|구인구직|뉴스|커뮤니티');
  chk('전부 있는 화면으로', await p.evaluate(()=>
    [...document.querySelectorAll('.svc-cards .svc-card')].map(c=>{
      const m=(c.getAttribute('onclick')||'').match(/go\(&?q?u?o?t?;?"?([a-z]+)/);
      return m?m[1]:'?';
    }).filter(k=>PGS.indexOf(k)<0).join(',')), '');
  chk('ABOUTMEAT 제목', await p.evaluate(()=>
    document.querySelector('.svc-eye').textContent.trim()), 'ABOUTMEAT');

  log.push('8. 위계 · 신뢰 구간 · 미완성 흔적');
  chk('구간 순서', await p.evaluate(()=>{
    const want=['gh ph','pstat-sec','sec sec-cat8','svc-sec','sec sec-mkt','sec sec-alt','sec why'];
    const got=[...document.querySelectorAll('#pg-h > *')]
      .filter(e=>!e.hidden && e.getBoundingClientRect().height>0)
      /* .rv/.on 은 페이드용이라 순서와 무관합니다 */
      .map(e=>e.className.replace(/\s*\brv\b|\s*\bon\b/g,'').trim()).slice(0,7);
    return got.join(' | ');
  }), 'gh ph | pstat-sec | sec sec-cat8 | svc-sec | sec sec-mkt | sec sec-alt | sec why');
  chk('신뢰 구간은 하나만', await p.evaluate(()=>{
    const band=document.getElementById('why-band');
    const bar=document.querySelector('.trust-bar');
    return !!band && band.getBoundingClientRect().height>0 &&
           (!bar || bar.getBoundingClientRect().height===0);
  }), 'true');
  chk('신뢰 항목 4개', await p.evaluate(()=>
    [...document.querySelectorAll('#why-band .why-t')].map(e=>e.textContent.trim()).join('|')),
    '사업자 인증|HACCP 확인|조건 매칭|견적 비교');
  chk('제목 위계 (히어로 > 서비스 > 신뢰 > 업종)', await p.evaluate(()=>{
    const sz=q=>parseFloat(getComputedStyle(document.querySelector(q)).fontSize);
    const h1=sz('.ph-h1'), svc=sz('.svc-h2'), why=sz('#why-band .sec-h2'), cs=sz('.cshort-t');
    return h1>svc && svc>why && why>cs;
  }), 'true');
  /* 미완성처럼 보이는 흔적이 화면에 남으면 안 됩니다 */
  chk('"샘플" 이 안 보임', await p.evaluate(()=>/샘플/.test(document.body.innerText)), false);
  chk('준비 중 기능은 앞세우지 않음', await p.evaluate(()=>{
    const pay=document.querySelector('.gpay');
    if(!pay) return 'true';
    const r=pay.getBoundingClientRect();
    if(r.height===0) return 'true';                     /* 아예 안 보이면 통과 */
    const svc=document.querySelector('.svc-sec').getBoundingClientRect();
    return (r.top+scrollY) > (svc.top+scrollY) ? 'true' : '주요 서비스보다 위에 있음';
  }), 'true');

  log.push('9. 브랜드 색 절제');
  chk('딥레드는 CTA 에만', await p.evaluate(()=>{
    const cta=getComputedStyle(document.documentElement).getPropertyValue('--cta').trim();
    const hit=[];
    document.querySelectorAll('#pg-h *').forEach(e=>{
      const r=e.getBoundingClientRect(); if(r.height===0) return;
      const bg=getComputedStyle(e).backgroundColor;
      if(bg!=='rgb(180, 35, 44)') return;               /* --cta 를 배경으로 쓴 것만 */
      if(e.matches('button,a,.gbtn,.ha-reg,.bplus')) return;
      hit.push(e.className||e.tagName);
    });
    return hit.join(',');
  }), '');
  chk('히어로에서 브랜드색은 "고리" 한 곳', await p.evaluate(()=>
    document.querySelectorAll('.ph-h1 em').length), 1);

  log.push('7. 읽기·누르기·가로 스크롤');
  const small=pg=>pg.evaluate(()=>{
    const bad=[], scope='.hdr,.gh.ph,#pf-stats-sec,.sec-cat8,.svc-sec';
    document.querySelectorAll(scope.split(',').map(s=>s+' *').join(',')).forEach(e=>{
      if(!e.offsetParent) return;
      if(!e.textContent.trim() || e.children.length) return;
      const f=parseFloat(getComputedStyle(e).fontSize);
      if(f<12) bad.push((e.className||e.tagName)+':'+f);
    });
    return bad.join(',');
  });
  const tap=pg=>pg.evaluate(()=>{
    const bad=[];
    document.querySelectorAll('.hdr button,.gh.ph button,.sec-cat8 button,.svc-sec button').forEach(e=>{
      const r=e.getBoundingClientRect();
      if(r.height>0 && r.height<40) bad.push((e.textContent||'').trim().slice(0,8)+':'+Math.round(r.height));
    });
    return bad.join(',');
  });
  chk('데스크톱 12px 미만 없음', await small(p), '');
  chk('데스크톱 40px 미만 없음', await tap(p), '');
  chk('데스크톱 가로 스크롤 없음', await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1), 'true');
  chk('히어로가 충분히 큼', await p.evaluate(()=>document.querySelector('.gh.ph').getBoundingClientRect().height>=560), 'true');

  const t=await open(b,820,1000);
  chk('태블릿 가로 스크롤 없음', await t.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1), 'true');
  chk('태블릿 12px 미만 없음', await small(t), '');

  const m=await open(b,390,844);
  chk('모바일 가로 스크롤 없음', await m.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1), 'true');
  chk('모바일 12px 미만 없음', await small(m), '');
  chk('모바일 40px 미만 없음', await tap(m), '');
  chk('모바일에서도 헤더가 보임', await m.evaluate(()=>
    getComputedStyle(document.querySelector('.hdr')).display!=='none'), 'true');
  chk('히어로 첫줄이 헤더에 안 가림', await m.evaluate(()=>{
    const h=document.querySelector('.hdr').getBoundingClientRect().bottom;
    return document.querySelector('.ph-util').getBoundingClientRect().top >= h-1;
  }), 'true');
  chk('모바일 검색창이 화면 안에', await m.evaluate(()=>{
    const r=document.querySelector('.gsx').getBoundingClientRect();
    return r.left>=-1 && r.right<=window.innerWidth+1;
  }), 'true');

  const allErrs=[].concat(p._errs,t._errs,m._errs);
  console.log(log.join('\n'));
  if(allErrs.length){ console.log('  ❌ 페이지 에러: '+allErrs.join(' / ')); errs.push('pageerror'); }
  else console.log('  ✅ 페이지 에러 없음');
  console.log(errs.length ? '❌ '+errs.length+'건 실패: '+errs.join(', ') : '✅ 전체 통과');
  await b.close();
  process.exit(errs.length?1:0);
})();
