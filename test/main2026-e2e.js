/* ════════════════════════════════════════════════════════════════════
   메인 2026 — 지역 찾기 · 브리핑 · 찾아보세요 · 브랜드 선언 · 마지막 행동
                빈 구간 자동 숨김 · 업체 카드 · 미완성 흔적

   이번 개편에서 가장 깨지기 쉬운 것은 "없는 것을 안 보여준다" 는 약속입니다.
   숫자를 지어내거나, 예시를 진짜 요청처럼 보이게 하거나, (미기재)·샘플이
   손님 눈에 남으면 그 순간 사이트 신뢰가 무너집니다.
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
const URL='file:///home/user/meat-insight/index.html';

async function open(b,w,h,opt){
  const p=await b.newPage({viewport:{width:w,height:h}});
  let init=FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify(opt&&opt.fake||{})+");";
  if(opt&&opt.noDemo) init+="\nwindow.addEventListener('DOMContentLoaded',function(){try{window.GORI_FEATURES.demo=false;}catch(e){}});";
  await p.addInitScript(init);
  p._errs=[]; p.on('pageerror',e=>p._errs.push(e.message)); p.on('dialog',d=>d.accept());
  await p.goto(URL,{waitUntil:'load'});
  await p.waitForTimeout(4200);
  return p;
}

(async()=>{
  const b=await chromium.launch(); const log=[], errs=[];
  const chk=(n,g,w)=>{const ok=String(g)===String(w);
    log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w)); if(!ok)errs.push(n);};

  const p=await open(b,1440,950);

  log.push('1. 구간 순서 (히어로 → 업종 → 브리핑 → 찾아보세요 → 서비스)');
  chk('앞 다섯 구간', await p.evaluate(()=>
    [...document.querySelectorAll('#pg-h > *')]
      .filter(e=>!e.hidden && e.getBoundingClientRect().height>0)
      .map(e=>e.id||e.className.replace(/\s*\b(rv|on)\b/g,'').trim()).slice(0,4).join(' | ')),
    'gh ph | sec sec-cat8 | sec-mkt | svc-sec');
  chk('브랜드 선언 → 마지막 행동 → 푸터', await p.evaluate(()=>{
    const y=s=>{const e=document.querySelector(s); return e?e.getBoundingClientRect().top+scrollY:-1;};
    return y('#brand-sec')>0 && y('#brand-sec')<y('#final-sec') && y('#final-sec')<y('.footer');
  }), 'true');

  log.push('2. 지역으로 업체 찾기 (홈이 아니라 업체 찾기 화면)');
  chk('홈에는 없음', await p.evaluate(()=>!document.querySelector('#pg-h .rgx')), 'true');
  await p.evaluate(()=>go('suppliers')); await p.waitForTimeout(700);
  chk('16개 시·도 + 전국', await p.evaluate(()=>document.querySelectorAll('#pg-suppliers .rgx-chip').length), 17);
  chk('진짜 필터로 붙음', await p.evaluate(async()=>{
    gPickSupRegion('경기'); await new Promise(r=>setTimeout(r,700));
    return document.getElementById('pg-suppliers').classList.contains('on');
  }), 'true');
  chk('고른 지역이 표시됨', await p.evaluate(()=>{
    const n=document.getElementById('rgx-now');
    return !!n && /경기/.test(n.textContent);
  }), 'true');
  chk('되돌리기', await p.evaluate(async()=>{
    gPickSupRegion('all'); await new Promise(r=>setTimeout(r,500));
    return (document.getElementById('rgx-now')||{}).textContent==='';
  }), 'true');
  await p.evaluate(()=>go('h')); await p.waitForTimeout(500);

  log.push('3. 오늘의 축산 정보 — 지어내지 않는다');
  chk('제목', await p.evaluate(()=>{
    const h=document.querySelector('#sec-mkt .sec-h2'); return h?h.textContent.trim():'(없음)';
  }), '오늘의 축산 정보');
  chk('시세는 등록된 것만', await p.evaluate(()=>{
    const rows=(window.GORI&&window.GORI.MARKET&&window.GORI.MARKET.rows)||[];
    const shown=document.querySelectorAll('#mkt-strip .mkt-c,#mkt-strip > *').length;
    return rows.length===0 ? document.getElementById('sec-mkt').hidden : shown>0;
  }), 'true');
  chk('뉴스 없으면 이슈 칸도 없음', await p.evaluate(()=>{
    const news=(window.GORI_CONTENT&&window.GORI_CONTENT.news)||[];
    const side=document.querySelector('#sec-mkt .brf-side');
    return news.length ? !!side : !side;
  }), 'true');

  log.push('4. 최종 구조에 없는 구간은 메인에서 내린다');
  /* 코드와 라우트는 남기고 노출만 끕니다 — 되살릴 때 한 줄이면 됩니다 */
  chk('찾아보세요 · 지표 줄 · 사람이 필요할 때 · 업체 유치 배너', await p.evaluate(()=>
    ['#case-sec','#pf-stats-sec','#sec-labor','.recruit-banner']
      .map(q=>{const e=document.querySelector(q); return e? (e.hidden?'':q+' 보임') : q+' 없음';})
      .filter(Boolean).join(',')), '');
  chk('이용 방법은 네 걸음', await p.evaluate(()=>
    document.querySelectorAll('#proc-grid .proc-step').length), 4);
  chk('이용 방법은 접혀 있지 않음', await p.evaluate(()=>
    !document.querySelector('#proc-grid').closest('.hm-fold')), 'true');

  log.push('5. 브랜드 선언 · 마지막 행동');
  chk('원육에서 식탁까지', await p.evaluate(()=>
    /원육에서 식탁까지/.test(document.getElementById('brand-sec').textContent)), 'true');
  chk('마지막 행동은 두 개만', await p.evaluate(()=>
    document.querySelectorAll('#final-sec button').length), 2);
  chk('두 곳 다 있는 화면', await p.evaluate(()=>
    [...document.querySelectorAll('#final-sec button')].map(x=>{
      const m=(x.getAttribute('onclick')||'').match(/go\(&?q?u?o?t?;?"?([a-z]+)/); return m?m[1]:'?';
    }).filter(k=>PGS.indexOf(k)<0).join(',')), '');

  log.push('5-1. 푸터는 모든 화면에');
  /* 예전에는 #pg-h 안에 있어서 홈에서만 보였습니다. 나머지 서른세 화면에는
     이용약관·개인정보처리방침·사업자 정보로 가는 길이 아예 없었습니다. */
  chk('#pg-h 밖에 있다', await p.evaluate(()=>{
    const f=document.querySelector('.footer');
    return !!f && !f.closest('#pg-h');
  }), 'true');
  chk('전 화면에서 보인다', await p.evaluate(async()=>{
    const bad=[];
    for(const k of PGS){
      if(k==='cat8') goCat8('meat'); else go(k);
      await new Promise(r=>setTimeout(r,60));
      const f=document.querySelector('.footer');
      if(!f || f.getBoundingClientRect().height===0) bad.push(k);
    }
    go('h'); return bad.join(',');
  }), '');
  chk('약관·방침 링크가 산다', await p.evaluate(()=>
    ['terms.html','privacy.html'].every(h=>
      [...document.querySelectorAll('.footer [onclick]')].some(e=>
        (e.getAttribute('onclick')||'').indexOf(h)>=0))), 'true');

  log.push('6. 미완성 흔적이 손님에게 안 보인다');
  const body=await p.evaluate(()=>document.body.innerText);
  chk('샘플/미기재/TEST 없음', /샘플|미기재|TEST|정보없음|미등록/.test(body), false);
  /* 색은 칸마다가 아니라 묶음마다입니다 — 열두 칸에 열두 색이면 앱 서랍처럼
     보이고, 한 색이면 무엇이 같은 갈래인지 안 보입니다. CATS8 의 대분류를
     따라 셋씩 넷 (원육 · 생산 · 물류·장비 · 사업). */
  chk('업종 색은 네 묶음', await p.evaluate(()=>{
    const st=[...document.querySelectorAll('#cat8-grid .cs-item:not(.cs-all)')]
      .map(e=>getComputedStyle(e.querySelector('.cs-ic')).backgroundColor);
    return new Set(st).size;
  }), 4);
  chk('묶음 안에서는 한 색', await p.evaluate(()=>{
    const bad=[];
    for(const g of [1,2,3,4]){
      const st=[...document.querySelectorAll('#cat8-grid .cs-g'+g)]
        .map(e=>getComputedStyle(e.querySelector('.cs-ic')).backgroundColor);
      if(!st.length) bad.push('g'+g+' 없음');
      else if(new Set(st).size!==1) bad.push('g'+g+' '+new Set(st).size+'색');
      else if(st.length!==3) bad.push('g'+g+' '+st.length+'칸');
    }
    return bad.join(', ');
  }), '');
  /* 딥레드(--cta)는 누르는 것 전용입니다 — 업종 타일까지 빨강을 넓히면
     "요청 올리기" 가 안 보입니다. 붉은 계열이 하나도 없어야 합니다. */
  chk('업종 타일에 빨강 없음', await p.evaluate(()=>{
    /* 색상환으로 봅니다. 브랜드 주황 #C24A0C 는 20°, 딥레드 #B4232C 는 356° —
       "빨갛다" 로 뭉뚱그리면 주황까지 걸립니다. 15° 아래만 빨강으로 봅니다. */
    const hue=(r,g,b)=>{
      const mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn;
      if(!d) return 0;
      let h = mx===r ? ((g-b)/d)%6 : mx===g ? (b-r)/d+2 : (r-g)/d+4;
      h*=60; return h<0 ? h+360 : h;
    };
    const red=[];
    document.querySelectorAll('#cat8-grid .cs-item:not(.cs-all) .cs-ic').forEach(e=>{
      const bg=getComputedStyle(e).backgroundColor;
      const m=bg.match(/\d+/g); if(!m) return;
      const [r,g,b]=m.map(Number);
      const h=hue(r,g,b);
      if(r>120 && (h<15 || h>345)) red.push(bg+' ('+Math.round(h)+'°)');
    });
    return [...new Set(red)].join(',');
  }), '');
  /* 흰 선화가 타일 위에서 읽혀야 합니다 (WCAG 그래픽 3:1, 여유를 두고 4.5) */
  chk('흰 아이콘 대비 4.5:1 이상', await p.evaluate(()=>{
    const L=c=>{const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);};
      return .2126*f(c[0])+.7152*f(c[1])+.0722*f(c[2]);};
    const bad=[];
    document.querySelectorAll('#cat8-grid .cs-item:not(.cs-all) .cs-ic').forEach(e=>{
      const m=getComputedStyle(e).backgroundColor.match(/\d+/g); if(!m) return;
      const r=(1.05)/(L(m.map(Number))+.05);
      if(r<4.5) bad.push(getComputedStyle(e).backgroundColor+':'+r.toFixed(2));
    });
    return [...new Set(bad)].join(', ');
  }), '');

  /* 운영자에게 할 말이 손님 화면에 찍혀 있었습니다 — 문의 화면에
     "고객센터 연락처가 아직 등록되지 않았습니다", 접수 실패 때
     "db/phase7_report.sql 실행 필요". 둘 다 콘솔로 내렸습니다. */
  const seen=async(key)=>{ await p.evaluate(k=>{location.hash='#/'+k;},key);
    await p.waitForTimeout(1300);
    return await p.evaluate(k=>(document.getElementById('pg-'+k).innerText||''),key); };
  const ct=await seen('contact');
  chk('문의에 운영자용 안내 없음', /등록되지 않았|phase\d|\.sql|미기재/i.test(ct), false);
  const rp=await seen('report');
  chk('신고에 운영자용 안내 없음', /등록되지 않았|phase\d|\.sql|미기재/i.test(rp), false);

  /* 옆칸에 "카테고리" 제목만 남은 빈 상자가 있었습니다 */
  await p.evaluate(()=>{location.hash='#/community';}); await p.waitForTimeout(1300);
  chk('커뮤니티 빈 옆칸 안 보임', await p.evaluate(()=>{
    const ec=document.getElementById('comm-cats');
    if(!ec) return '칸없음';
    const empty=!(ec.children.length||(ec.textContent||'').trim());
    const side=ec.parentNode;
    return (empty && side && side.offsetParent) ? '빈 상자가 보임' : '';
  }), '');

  /* "5건" 이라고 쓰고 넷만 보여 주면 세어 본 사람에게는 틀린 숫자입니다 */
  await p.evaluate(()=>{location.hash='#/sj';}); await p.waitForTimeout(1800);
  chk('업체 등록 요청 수가 목록과 맞는다', await p.evaluate(()=>{
    const t=document.getElementById('pg-sj').innerText||'';
    const m=t.match(/기다리는 요청 (\d+)건/); if(!m) return '';
    const n=parseInt(m[1],10);
    const rows=document.querySelectorAll('#pg-sj .ritem').length;
    if(n<=rows) return '';
    return /나머지 \d+건 보기/.test(t) ? '' : n+'건이라 쓰고 '+rows+'장만 보임';
  }), '');
  await p.evaluate(()=>{location.hash='#/';}); await p.waitForTimeout(900);

  log.push('7. 데이터가 없으면 메인에서 내린다 (예시 데이터 끔)');
  const c=await open(b,1440,950,{noDemo:true, fake:{emptyTables:["purchase_requests","suppliers","market_prices","jobs"]}});
  chk('실시간 요청 숨김', await c.evaluate(()=>{
    const w=document.getElementById('rq-widget'); const s=w&&w.closest('section');
    return s?s.hidden:'(없음)';
  }), 'true');
  /* 등록 업체를 감싸는 상자는 <section> 이 아니라 .sec-sups 입니다 */
  chk('등록 업체 숨김', await c.evaluate(()=>{
    const w=document.getElementById('sup-home'); const s=w&&w.closest('.sec-sups');
    return s?s.hidden:'(없음)';
  }), 'true');
  chk('지표 줄도 숨김', await c.evaluate(()=>{
    const s=document.getElementById('pf-stats-sec'); return s.hidden;
  }), 'true');
  chk('"준비 중" 칸이 안 보임', await c.evaluate(()=>
    document.querySelectorAll('#pf-stats .pstat-v.wait').length===0 ||
    document.getElementById('pf-stats-sec').hidden), 'true');
  /* 화면과 기능은 그대로 있어야 합니다 — 메인 노출만 조건부입니다 */
  chk('요청 목록 화면은 그대로', await c.evaluate(async()=>{
    go('reqs'); await new Promise(r=>setTimeout(r,600));
    const ok=document.getElementById('pg-reqs').classList.contains('on');
    go('h'); await new Promise(r=>setTimeout(r,400)); return ok;
  }), 'true');
  chk('업체 찾기 화면은 그대로', await c.evaluate(async()=>{
    go('suppliers'); await new Promise(r=>setTimeout(r,600));
    const ok=document.getElementById('pg-suppliers').classList.contains('on');
    go('h'); await new Promise(r=>setTimeout(r,400)); return ok;
  }), 'true');
  chk('브랜드·마지막 행동은 그대로', await c.evaluate(()=>
    !!document.getElementById('brand-sec') && !!document.getElementById('final-sec')), 'true');

  log.push('8. 업체 카드 — 있는 것만');
  chk('빈 업체에 자리표시자 없음', await c.evaluate(async()=>{
    go('suppliers'); await new Promise(r=>setTimeout(r,500));
    SUPS=[{id:"s1",name:"합신식 도축장",region:"경기 포천시",categories:["도축장"],
           items:["한우 지육"],regions:["경기","서울"],rating:4.9,review_count:23,
           lead_time:"2일",haccp:true,brn_verified:true,livestock_permit:true,deal_count:41},
          {id:"s2",name:"대성기계",categories:["장비"]}].map(mapSup);
    renderSups("all");
    await new Promise(r=>setTimeout(r,400));
    const cards=document.querySelectorAll('#sup-full .sc2');
    if(cards.length!==2) return '카드 '+cards.length+'개';
    const bare=cards[1].innerText;
    return /미등록|지역미정|정보없음|—/.test(bare) ? '자리표시자: '+bare : 'ok';
  }), 'ok');
  chk('채워진 업체는 다 보여줌', await c.evaluate(()=>{
    const t=document.querySelectorAll('#sup-full .sc2')[0].innerText;
    return ['사업자 확인','HACCP','축산물 허가','경기 포천시','배송','거래 41건','납기 2일']
      .filter(x=>t.indexOf(x)<0).join(',');
  }), '');
  chk('인증 배지는 값이 있을 때만', await c.evaluate(()=>
    /HACCP|축산물 허가|사업자 확인/.test(document.querySelectorAll('#sup-full .sc2')[1].innerText)), false);

  log.push('9. 반응형 · 읽기');
  for(const [w,h,nm] of [[1440,950,'데스크톱'],[820,1000,'태블릿'],[390,844,'모바일']]){
    const v=(w===1440)?p:await open(b,w,h);
    chk(nm+' 가로 스크롤 없음', await v.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1), 'true');
    chk(nm+' 12px 미만 없음', await v.evaluate(()=>{
      const bad=[];
      document.querySelectorAll('#case-sec *,#brand-sec *,#final-sec *,.rgx *').forEach(e=>{
        if(!e.offsetParent||!e.textContent.trim()||e.children.length) return;
        const f=parseFloat(getComputedStyle(e).fontSize);
        if(f<12) bad.push((e.className||e.tagName)+':'+f);
      });
      return bad.join(',');
    }), '');
    chk(nm+' 40px 미만 없음', await v.evaluate(()=>{
      const bad=[];
      document.querySelectorAll('#case-sec button,#brand-sec button,#final-sec button,.rgx button').forEach(e=>{
        const r=e.getBoundingClientRect();
        if(r.height>0&&r.height<40) bad.push((e.textContent||'').trim().slice(0,8)+':'+Math.round(r.height));
      });
      return bad.join(',');
    }), '');
    if(v!==p){ p._errs=p._errs.concat(v._errs); await v.close(); }
  }

  const allErrs=[].concat(p._errs,c._errs);
  console.log(log.join('\n'));
  if(allErrs.length){ console.log('  ❌ 페이지 에러: '+allErrs.join(' / ')); errs.push('pageerror'); }
  else console.log('  ✅ 페이지 에러 없음');
  console.log(errs.length ? '❌ '+errs.length+'건 실패: '+errs.join(', ') : '✅ 전체 통과');
  await b.close();
  process.exit(errs.length?1:0);
})();
