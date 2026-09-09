/* ════════════════════════════════════════════════════════════════════
   왜 고리인가 (홈) · 고리 소개 (#/about)

   사이트를 처음 연 사람이 "여기가 뭘 해주는 곳인가" 를 알 수 없었습니다.
   답이 화면 맨 밑 푸터 바로 위에 있었기 때문입니다.

   확인하는 것
     1. "왜 고리를 쓰나요" 띠가 홈 위쪽(분야 바로 아래)에 있는지
     2. 소개 페이지가 열리고, 주소로도 열리는지
     3. 사업자 정보를 GORI_BIZ 에서 가져오는지 (지어내지 않는지)
     4. 없는 기능을 광고하지 않는지 (고리페이 = 준비 중)
     5. 글씨 12px 이상 · 누르는 것 40px 이상 · 가로 스크롤 없음
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
const URL='file:///home/user/meat-insight/index.html';

async function open(b,w,h,hash){
  const p=await b.newPage({viewport:{width:w,height:h}});
  await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT({})");
  p._errs=[]; p.on('pageerror',e=>p._errs.push(e.message)); p.on('dialog',d=>d.accept());
  await p.goto(URL+(hash||''),{waitUntil:'load'});
  await p.waitForTimeout(2200);
  return p;
}

(async()=>{
  const b=await chromium.launch(); const log=[], errs=[];
  const chk=(n,g,w)=>{const ok=String(g)===String(w);
    log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w)); if(!ok)errs.push(n);};

  log.push('1. 홈 — 왜 고리를 쓰나요');
  const p=await open(b,1440,1000);
  chk('띠가 있다', await p.evaluate(()=>!!document.getElementById('why-band')), 'true');
  chk('분야 바로 아래', await p.evaluate(()=>{
    const c=document.querySelector('#pg-h .sec-cat8');
    return c && c.nextElementSibling && c.nextElementSibling.id==='why-band';
  }), 'true');
  chk('이유 카드 4장', await p.evaluate(()=>document.querySelectorAll('#why-band .why-c').length), 4);
  chk('지금까지 → 고리에서는', await p.evaluate(()=>
    document.querySelectorAll('#why-band .why-side').length), 2);
  /* 접히는 구간(38_home)에 딸려 들어가면 안 됩니다 */
  chk('접히지 않는다', await p.evaluate(()=>
    !!document.getElementById('why-band').closest('.hm-fold')), 'false');
  chk('첫 화면 근처에 있다', await p.evaluate(()=>{
    const y=document.getElementById('why-band').getBoundingClientRect().top+window.scrollY;
    return y < document.body.scrollHeight*0.4;
  }), 'true');

  log.push('2. 소개 페이지');
  await p.evaluate(()=>gOpenAbout()); await p.waitForTimeout(600);
  chk('열린다', await p.evaluate(()=>document.getElementById('pg-about').classList.contains('on')), 'true');
  chk('주소가 남는다', await p.evaluate(()=>location.hash), '#/about');
  chk('제목', await p.evaluate(()=>document.querySelector('#pg-about .gp-title').textContent.trim()), '고리 소개');
  chk('하는 일 4가지', await p.evaluate(()=>{
    const c=[...document.querySelectorAll('#pg-about .gcard')]
      .find(x=>x.querySelector('.gcard-t').textContent.trim()==='고리가 하는 일');
    return c ? c.querySelectorAll('.ab-it').length : '(칸 없음)';
  }), 4);
  chk('하지 않는 일 칸이 있다', await p.evaluate(()=>
    !!document.querySelector('#pg-about .ab-warn')), 'true');
  chk('중개자임을 밝힌다', await p.evaluate(()=>
    /통신판매의 당사자가 아닙니다/.test(document.getElementById('pg-about').textContent)), 'true');
  chk('푸터에 소개 링크', await p.evaluate(()=>!!document.querySelector('.footer .ab-ft')), 'true');

  log.push('3. 지어내지 않는다');
  const txt=await p.evaluate(()=>document.getElementById('pg-about').textContent);
  chk('사업자 정보는 GORI_BIZ 에서', await p.evaluate(()=>{
    const B=window.GORI_BIZ, dds=[...document.querySelectorAll('#pg-about .ab-biz dd')];
    /* 비어 있는 항목은 반드시 (미기재) 로 나와야 합니다 */
    const keys=['service','company','ceo','brn','mailOrder','address','phone','email','privacyOfficer'];
    return keys.every((k,i)=>{
      const want=(k==='service'?(B.service||'고리'):(B[k]||'')).trim();
      const got=dds[i].textContent.trim();
      return want ? got===want : got==='(미기재)';
    });
  }), 'true');
  chk('누적 거래액·설립연도 없음', /누적|설립|창립|년 만에|고객사 [0-9]/.test(txt), false);
  chk('고리페이는 준비 중이라고만', await p.evaluate(()=>
    /아직 만들어지지 않았/.test(document.getElementById('pg-about').textContent)), 'true');

  log.push('4. 주소로 바로 열기');
  const d=await open(b,1440,1000,'#/about');
  chk('새로고침해도 소개', await d.evaluate(()=>document.getElementById('pg-about').classList.contains('on')), 'true');
  chk('내용이 그려져 있다', await d.evaluate(()=>
    document.getElementById('about-body').children.length>3), 'true');

  log.push('5. 읽기·누르기·가로 스크롤');
  const small=async(pg)=>pg.evaluate(()=>{
    const bad=[];
    document.querySelectorAll('#why-band *,#pg-about *').forEach(e=>{
      if(!e.offsetParent && e.tagName!=='BODY') return;
      if(!e.textContent.trim() || e.children.length) return;
      const s=getComputedStyle(e), f=parseFloat(s.fontSize);
      if(f<12) bad.push(e.className+':'+f);
    });
    return bad.join(',');
  });
  const tap=async(pg)=>pg.evaluate(()=>{
    const bad=[];
    document.querySelectorAll('#why-band button,#pg-about button').forEach(e=>{
      const r=e.getBoundingClientRect();
      if(r.height>0 && r.height<40) bad.push((e.textContent||'').trim().slice(0,10)+':'+Math.round(r.height));
    });
    return bad.join(',');
  });
  chk('데스크톱 12px 미만 없음', await small(p), '');
  chk('데스크톱 40px 미만 없음', await tap(p), '');
  chk('데스크톱 가로 스크롤 없음', await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1), 'true');

  const m=await open(b,390,844);
  chk('모바일에도 띠가 있다', await m.evaluate(()=>!!document.getElementById('why-band')), 'true');
  await m.evaluate(()=>gOpenAbout()); await m.waitForTimeout(600);
  chk('모바일 12px 미만 없음', await small(m), '');
  chk('모바일 40px 미만 없음', await tap(m), '');
  chk('모바일 가로 스크롤 없음', await m.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1), 'true');

  const allErrs=[].concat(p._errs,d._errs,m._errs);
  console.log(log.join('\n'));
  if(allErrs.length){ console.log('  ❌ 페이지 에러: '+allErrs.join(' / ')); errs.push('pageerror'); }
  else console.log('  ✅ 페이지 에러 없음');
  console.log(errs.length ? '❌ '+errs.length+'건 실패: '+errs.join(', ') : '✅ 전체 통과');
  await b.close();
  process.exit(errs.length?1:0);
})();
