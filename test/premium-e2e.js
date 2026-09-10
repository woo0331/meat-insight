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
  /* 여섯이면 1200px 컨테이너 안에 안 들어갑니다 — 로그인하면 오른쪽 덩이만
     453px 이 되어 "전체메뉴" 와 "요청 올리기" 가 잘려 나갔습니다.
     뉴스·커뮤니티는 전체메뉴 · 푸터(모든 화면) · 홈 INSIGHT 에 있습니다. */
  chk('메뉴 4개', await p.evaluate(()=>
    [...document.querySelectorAll('.hdr-nav a')].map(a=>a.textContent.trim()).join('|')),
    '업체 찾기|견적 요청|축산 시세|구인구직');
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
  /* 히어로에서 헤더·전체메뉴로 옮겼습니다. onclick 은 그대로 따라가야 합니다. */
  chk('지역 선택 살아 있음', await p.evaluate(()=>
    (document.getElementById('gh-region').getAttribute('onclick')||'').indexOf('gPickRegion')>=0), 'true');
  chk('알림 살아 있음', await p.evaluate(()=>
    !!document.querySelector('[onclick*="gHeroBell"]') && !!document.getElementById('gh-bell-dot')), 'true');
  chk('gh-stat 자리 유지', await p.evaluate(()=>!!document.getElementById('gh-stat')), 'true');
  /* ── 히어로는 밝은 것이 기본입니다 ────────────────────────────────
     예전에는 첫 화면이 통째로 검정이었습니다. 사진 여섯 장을 깔 자리였는데
     GORI_HERO 가 비어 있어 가느다란 선화만 떠 있었고, 손님 눈에는 축산업
     사이트가 아니라 미완성 화면으로 읽혔습니다.
     이제 제목은 우리 소개가 아니라 손님에게 거는 말입니다. */
  chk('질문형 제목', await p.evaluate(()=>document.querySelector('.ph-h1').textContent.replace(/\s+/g,' ').trim()),
    '전국에서 어떤 축산 업체를 찾으세요?');
  chk('브랜드 한 줄은 눈썹글에', await p.evaluate(()=>
    (document.querySelector('.ph-eye').textContent||'').replace(/\s+/g,' ').trim()),
    '고리 · 축산업의 모든 연결');
  chk('강조는 한 곳', await p.evaluate(()=>{
    const em=document.querySelector('.ph-h1 em');
    return em.textContent.trim()==='축산 업체' &&
      getComputedStyle(em).color!==getComputedStyle(document.querySelector('.ph-h1')).color;
  }), 'true');
  chk('지역이 제목 안에', await p.evaluate(()=>{
    const rg=document.querySelector('.ph-h1 #gh-region');
    return !!rg && (rg.getAttribute('onclick')||'').indexOf('gPickRegion')>=0;
  }), 'true');
  /* 밝은 히어로는 배경이 흰색이어야 합니다 (검정이면 예전 것이 살아난 것) */
  chk('히어로가 밝다', await p.evaluate(()=>{
    const L=c=>{const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);};
      return .2126*f(c[0])+.7152*f(c[1])+.0722*f(c[2]);};
    const m=getComputedStyle(document.querySelector('.gh.ph')).backgroundColor.match(/\d+/g);
    return L(m.map(Number))>0.7;
  }), 'true');
  /* 사진이 없으면 빈 칸을 두지 않습니다 — 선화만 뜬 여섯 칸이 문제였습니다 */
  chk('사진 없으면 띠도 없다', await p.evaluate(()=>
    !document.querySelector('.gh.ph').classList.contains('has-photo') &&
    document.querySelectorAll('#ph-strip .ph-p').length===0), 'true');
  chk('사진 자리는 GORI_HERO 에서', await p.evaluate(()=>
    Array.isArray(window.GORI_HERO) && window.GORI_HERO.length===6 &&
    window.GORI_HERO.every(x=>'img' in x)), 'true');
  /* 사진을 채우면 예전의 어두운 사진 히어로가 그대로 돌아와야 합니다.
     두 벌이 다 살아 있어야지, 한쪽이 죽은 코드가 되면 안 됩니다. */
  chk('사진을 넣으면 사진 히어로로', await p.evaluate(async()=>{
    const px='data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
    window.GORI_HERO.forEach(x=>{x.img=px;});
    window.GORI.hsRender();
    await new Promise(r=>setTimeout(r,120));
    const hero=document.querySelector('.gh.ph');
    const caps=[...document.querySelectorAll('#ph-strip .ph-p-t')].map(e=>e.textContent.trim());
    const arts=new Set([...document.querySelectorAll('#ph-strip .ph-p-art')].map(e=>e.innerHTML)).size;
    const imgs=document.querySelectorAll('#ph-strip .ph-p-img').length;
    const out=[];
    if(!hero.classList.contains('has-photo')) out.push('어두운 판으로 안 바뀜');
    if(caps.join('→')!=='사육→도축·경매→가공→물류→포장·장비→정육점·식당') out.push('칸 이름 '+caps.join('→'));
    if(arts!==6) out.push('그림이 '+arts+'가지');
    if(imgs!==6) out.push('사진 '+imgs+'장');
    /* 되돌려 놓습니다 — 뒤 검사가 밝은 히어로를 봅니다 */
    window.GORI_HERO.forEach(x=>{x.img='';});
    window.GORI.hsRender();
    return out.join(', ');
  }), '');
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
  /* 2026: "준비 중" 칸은 화면에서 내리고, 진짜 값이 두 칸도 안 되면 줄째로
     숨깁니다 — 빈 칸이 늘어선 지표는 규모가 아니라 미완성으로 읽힙니다. */
  chk('보이는 칸은 전부 실제 값', await p.evaluate(()=>{
    const sec=document.getElementById('pf-stats-sec');
    if(sec.hidden) return 'hidden';
    const cells=[...document.querySelectorAll('#pf-stats .pstat-c')];
    return cells.length>=2 && cells.every(c=>!c.querySelector('.pstat-v.wait')) ? 'hidden' : '남은 준비중 칸 있음';
  }), 'hidden');
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
  /* 2026 정리: 메인 핵심 서비스는 넷. 뉴스·커뮤니티는 아래 콘텐츠 구간에서
     이어집니다 — 모든 기능을 같은 크기로 늘어놓지 않습니다. */
  chk('4장', await p.evaluate(()=>document.querySelectorAll('.svc-cards .svc-card').length), 4);
  chk('제목', await p.evaluate(()=>
    [...document.querySelectorAll('.svc-cards .svc-t')].map(e=>e.textContent.trim()).join('|')),
    '업체 찾기|견적 요청|축산 시세|구인구직');
  /* 헤더에서 뺐으니 전체메뉴와 푸터에는 반드시 남아 있어야 합니다 */
  chk('뉴스·커뮤니티로 갈 길이 있다', await p.evaluate(()=>
    ['news','community'].every(k=>
      !!document.querySelector('#mobile-menu [onclick*="'+k+'"]') &&
      !!document.querySelector('.footer [onclick*="'+k+'"]'))), 'true');
  chk('전부 있는 화면으로', await p.evaluate(()=>
    [...document.querySelectorAll('.svc-cards .svc-card')].map(c=>{
      const m=(c.getAttribute('onclick')||'').match(/go\(&?q?u?o?t?;?"?([a-z]+)/);
      return m?m[1]:'?';
    }).filter(k=>PGS.indexOf(k)<0).join(',')), '');
  /* 히어로가 이미 "고리가 무엇인지" 를 말합니다 — 큰 브랜드 카피를 한 번 더
     반복하지 않습니다. 구간 제목 하나면 충분합니다. */
  chk('큰 브랜드 카피 중복 없음', await p.evaluate(()=>
    !document.querySelector('.svc-h2') && !document.querySelector('.svc-eye')), 'true');

  log.push('8. 위계 · 신뢰 구간 · 미완성 흔적');
  chk('구간 순서', await p.evaluate(()=>{
    const got=[...document.querySelectorAll('#pg-h > *')]
      .filter(e=>!e.hidden && e.getBoundingClientRect().height>0)
      /* .rv/.on 은 페이드용이라 순서와 무관합니다 */
      .map(e=>e.id||e.className.replace(/\s*\brv\b|\s*\bon\b/g,'').trim()).slice(0,4);
    return got.join(' | ');
  }), 'gh ph | sec sec-cat8 | sec-mkt | svc-sec');
  chk('신뢰 구간은 하나만', await p.evaluate(()=>{
    const band=document.getElementById('why-band');
    const bar=document.querySelector('.trust-bar');
    return !!band && band.getBoundingClientRect().height>0 &&
           (!bar || bar.getBoundingClientRect().height===0);
  }), 'true');
  chk('신뢰 항목 4개', await p.evaluate(()=>
    [...document.querySelectorAll('#why-band .why-t')].map(e=>e.textContent.trim()).join('|')),
    '사업자 인증|HACCP 확인|조건 매칭|견적 비교');
  /* 카드가 아니라 아이콘 줄 — 페이지가 카드의 연속처럼 보이지 않게 */
  chk('신뢰는 카드가 아님', await p.evaluate(()=>{
    const c=document.querySelector('#why-band .why-c'), st=getComputedStyle(c);
    return st.borderTopWidth==='0px' && st.backgroundColor==='rgba(0, 0, 0, 0)';
  }), 'true');
  /* 히어로 제목이 홈에서 가장 크고, 구간 제목은 한 크기로 통일.
     예전에는 1.8배를 요구했습니다 — 브랜드 카피가 71px 이던 시절입니다.
     질문형으로 바뀌면서 제목이 작아졌지만, 여전히 가장 커야 합니다. */
  chk('제목 위계', await p.evaluate(()=>{
    const sz=q=>parseFloat(getComputedStyle(document.querySelector(q)).fontSize);
    const h1=sz('.ph-h1'), sec=[...document.querySelectorAll('#pg-h .sec-h2,#pg-h .cshort-t')]
      .filter(e=>e.offsetParent && !e.closest('.hm-fold')).map(e=>parseFloat(getComputedStyle(e).fontSize));
    return h1 > Math.max(...sec) && new Set(sec).size===1;
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
  /* ⚠️ 예전에는 "히어로가 560px 이상" 을 요구했습니다. 사진 여섯 장을 세워
     두려던 높이인데, 사진이 없으니 그만큼이 전부 빈 검정이었고 정작 손님이
     눌러야 할 업종 칸은 스크롤 뒤로 밀렸습니다.
     이제 반대로 잽니다 — **업종 첫 줄이 첫 화면 안에 보여야 합니다.** */
  chk('업종 칸이 첫 화면에', await p.evaluate(()=>{
    const t=document.querySelector('#cat8-grid .cs-item');
    if(!t) return '업종 칸 없음';
    const r=t.getBoundingClientRect();
    return r.top < window.innerHeight ? '' : '접힘선 아래 '+Math.round(r.top-window.innerHeight)+'px';
  }), '');

  const t=await open(b,820,1000);
  chk('태블릿 가로 스크롤 없음', await t.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1), 'true');
  chk('태블릿 12px 미만 없음', await small(t), '');

  const m=await open(b,390,844);
  chk('모바일 가로 스크롤 없음', await m.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1), 'true');
  chk('모바일 12px 미만 없음', await small(m), '');
  chk('모바일 40px 미만 없음', await tap(m), '');
  chk('모바일에서도 헤더가 보임', await m.evaluate(()=>
    getComputedStyle(document.querySelector('.hdr')).display!=='none'), 'true');
  /* 히어로 첫 줄은 브랜드 눈썹글입니다. 그것이 헤더 밑에서 시작하는지 봅니다. */
  chk('히어로 첫줄이 헤더에 안 가림', await m.evaluate(()=>{
    const h=document.querySelector('.hdr').getBoundingClientRect().bottom;
    return document.querySelector('.ph-eye').getBoundingClientRect().top >= h-1;
  }), 'true');
  /* 알림은 헤더로, 지역은 제목 안으로. 히어로에 떠 있던 도구 줄은 없습니다. */
  chk('알림은 헤더로', await m.evaluate(()=>
    !document.querySelector('#pg-h .ph-util .gh-bell') &&
    !!document.querySelector('.hdr-tools .gh-bell')), 'true');
  chk('지역은 제목 안에서 눌린다', await m.evaluate(()=>{
    const rg=document.querySelector('.ph-h1 #gh-region');
    if(!rg) return '제목 안에 없음';
    const r=rg.getBoundingClientRect();
    if(r.height<40) return '높이 '+Math.round(r.height);
    if(r.left<-1 || r.right>window.innerWidth+1) return '화면 밖';
    return '';
  }), '');
  chk('모바일 검색창이 화면 안에', await m.evaluate(()=>{
    const r=document.querySelector('.gsx').getBoundingClientRect();
    return r.left>=-1 && r.right<=window.innerWidth+1;
  }), 'true');

  /* ── 헤더가 1200px 컨테이너를 넘지 않는가 ──────────────────────────
     실제로 잘려 있었습니다: 1440px 로그인 상태에서 "전체메뉴" 가 화면
     오른쪽 밖(R1580)에 있었습니다. document.scrollWidth 로는 안 잡혀서
     지금까지 회귀를 통과했습니다 — 헤더 안쪽을 직접 잽니다. */
  log.push('10. 헤더 폭 (로그인·비로그인)');
  const hdrFit=async(w,init)=>{
    const q=await b.newPage({viewport:{width:w,height:900}});
    await q.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+init+")");
    await q.goto(URL,{waitUntil:'load'}); await q.waitForTimeout(2600);
    const r=await q.evaluate(()=>{
      const row=document.querySelector('.hdr-main .hdr-main-w')||document.querySelector('.hdr-main').firstElementChild;
      const rb=row.getBoundingClientRect(); const out=[];
      [...row.children].forEach(e=>{
        const b=e.getBoundingClientRect();
        if(b.width>0 && (b.right>rb.right+1 || b.left<rb.left-1))
          out.push((e.className||e.tagName).split(' ')[0]+' R'+Math.round(b.right)+'>'+Math.round(rb.right));
      });
      if(row.scrollWidth>Math.ceil(rb.width)+1) out.push('넘침 '+row.scrollWidth+'>'+Math.round(rb.width));
      return out.join(', ');
    });
    await q.close(); return r;
  };
  chk('1440 비로그인', await hdrFit(1440,'{}'), '');
  chk('1440 로그인',   await hdrFit(1440,"{user:{id:'u1',email:'a@b.c'}}"), '');
  chk('1280 로그인',   await hdrFit(1280,"{user:{id:'u1',email:'a@b.c'}}"), '');
  chk('1200 로그인',   await hdrFit(1200,"{user:{id:'u1',email:'a@b.c'}}"), '');

  /* 알림 종이 둘이었습니다 — 히어로에서 옮긴 것과 renderHeaderUser 의 것 */
  const bells=async(init)=>{
    const q=await b.newPage({viewport:{width:1440,height:900}});
    await q.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+init+")");
    await q.goto(URL,{waitUntil:'load'}); await q.waitForTimeout(2600);
    const n=await q.evaluate(()=>[...document.querySelectorAll('.hdr .gh-bell,.hdr .hu-bell')]
      .filter(e=>e.offsetParent && !e.classList.contains('hu-chat')).length);
    await q.close(); return n;
  };
  chk('로그인하면 알림 종 하나', await bells("{user:{id:'u1',email:'a@b.c'}}"), 1);
  chk('비로그인도 알림 종 하나', await bells('{}'), 1);

  /* 헤더에서 뺀 것은 갈 길이 남아 있어야 합니다 */
  const away=await b.newPage({viewport:{width:1440,height:900}});
  await away.addInitScript(FAKE+"\nwindow.__FAKE_INIT({user:{id:'u1',email:'a@b.c'}})");
  await away.goto(URL,{waitUntil:'load'}); await away.waitForTimeout(2600);
  chk('로그아웃은 전체메뉴에', await away.evaluate(()=>
    !!document.querySelector('#mobile-menu [onclick*="gLogout"]')), 'true');
  chk('업체 등록은 전체메뉴에', await away.evaluate(()=>
    !!document.querySelector('#mobile-menu [onclick*="sj"]')), 'true');
  await away.close();

  const allErrs=[].concat(p._errs,t._errs,m._errs);
  console.log(log.join('\n'));
  if(allErrs.length){ console.log('  ❌ 페이지 에러: '+allErrs.join(' / ')); errs.push('pageerror'); }
  else console.log('  ✅ 페이지 에러 없음');
  console.log(errs.length ? '❌ '+errs.length+'건 실패: '+errs.join(', ') : '✅ 전체 통과');
  await b.close();
  process.exit(errs.length?1:0);
})();
