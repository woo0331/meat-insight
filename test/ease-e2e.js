/* ════════════════════════════════════════════════════════════════════
   쓰기 편하게 — 글씨 크기 · 누르는 크기 · 움직이는 글

   축산업 쪽은 연세 있는 분들이 많이 씁니다. 예전엔 9~11px 글씨가
   62군데 있었고, 33px짜리 버튼이 널려 있었습니다.

   확인하는 것
     1. 12px 미만 글씨가 없는지 (화면마다)
     2. 누르는 것이 40px 이상인지
     3. "글자 크게" 가 켜지고, 기기에 기억되고, 가로 스크롤이 안 생기는지
     4. 데스크톱·모바일 양쪽에 버튼이 있는지
     5. 실시간 띠가 손을 올리면 멈추는지 (WCAG 2.2.2)
     6. 애니메이션을 끈 기기에서는 아예 안 움직이는지
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
const BUYER={id:'u1',user_metadata:{name:'김철수',role:'buyer'}};

async function open(b,w,h,opt){
  const p=await b.newPage(Object.assign({viewport:{width:w,height:h}},opt||{}));
  await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify({user:BUYER,realtime:true})+");");
  p._errs=[]; p.on('pageerror',e=>p._errs.push(e.message)); p.on('dialog',d=>d.accept());
  await p.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});
  await p.waitForTimeout(2000);
  return p;
}
/* 눈에 보이는, 글자를 직접 담고 있는 요소만 잽니다 */
const tiny = p => p.evaluate(()=>{
  const out=[];
  document.querySelectorAll('body *').forEach(e=>{
    if(e.children.length || !e.textContent.trim()) return;
    if(e.offsetParent===null) return;
    const fs=parseFloat(getComputedStyle(e).fontSize);
    if(fs && fs<12) out.push((e.className||e.tagName)+' '+fs+'px "'+e.textContent.trim().slice(0,12)+'"');
  });
  return out;
});
/* ⚠️ 예전에는 button·select·.chip·.my-tab·.hc-item 만 봤습니다.
   그래서 onclick 을 단 li·a·div 가 통째로 규칙 밖에 있었고, 푸터 링크
   스물아홉 개가 24px, 분야 탭이 38px, 시세 안내 링크가 16px 로 남아
   있었습니다. 실제로 눌리는 것은 전부 봅니다. */
const small = p => p.evaluate(()=>{
  const out=[];
  const sel='button:not([hidden]),select,a[href],a[onclick],[onclick],[role=button],'+
            '.chip,.my-tab,.hc-item,.tab,summary,label[for]';
  document.querySelectorAll(sel).forEach(e=>{
    /* 눌리는 것 안에 든 조각은 제외 — 부모가 이미 크면 됩니다 */
    if(e.parentElement && e.parentElement.closest('button,a[href],a[onclick],[onclick],[role=button]')) return;
    const r=e.getBoundingClientRect();
    if(r.width>0 && r.height>0 && r.height<40)
      out.push((e.className||e.tagName).toString().split(' ')[0]+
        '("'+(e.textContent||'').trim().slice(0,10)+'"):'+Math.round(r.height));
  });
  return [...new Set(out)];
});

(async()=>{
  const b=await chromium.launch(); const log=[], errs=[];
  const chk=(n,g,w)=>{const ok=String(g)===String(w);
    log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w)); if(!ok)errs.push(n);};

  log.push('1. 작은 글씨가 남지 않았는지');
  const p=await open(b,1440,1000);
  for(const [nm,go] of [['홈',null],['요청 목록','reqs'],['업체 찾기','suppliers'],['거래관리','my'],['이용 가이드','guide']]){
    if(go){ await p.evaluate(x=>window.go(x), go); await p.waitForTimeout(1300); }
    const t=await tiny(p);
    chk('  '+nm, t.length ? t.slice(0,2).join(' / ') : 0, 0);
  }
  await p.evaluate(()=>gOpenRequest('r1')); await p.waitForTimeout(1400);
  chk('  요청 상세', (await tiny(p)).length, 0);

  log.push('2. 누르는 것이 40px 이상');
  for(const [nm,go] of [['홈','h'],['요청 목록','reqs'],['업체 찾기','suppliers'],
                        ['시세','market'],['뉴스','news'],['커뮤니티','community'],
                        ['구인구직','jobs'],['거래관리','my'],['이용 가이드','guide'],['고리 소개','about']]){
    await p.evaluate(x=>window.go(x), go); await p.waitForTimeout(1300);
    const s=await small(p);
    chk('  '+nm, s.length ? s.slice(0,3).join(' / ') : 0, 0);
  }

  log.push('3. 글자 크게');
  await p.evaluate(()=>window.go('h')); await p.waitForTimeout(900);
  const base=await p.evaluate(()=>{
    const e=document.querySelector('.gcat-n,.cat8-nm,.hero-sub,p,div');
    return document.documentElement.classList.contains('txl');
  });
  chk('처음엔 꺼짐', base, 'false');
  await p.evaluate(()=>gToggleTextSize()); await p.waitForTimeout(600);
  chk('켜짐', await p.evaluate(()=>document.documentElement.classList.contains('txl')), 'true');
  chk('실제로 커짐', await p.evaluate(()=>{
    const z=getComputedStyle(document.body).zoom;
    return z && parseFloat(z)>1.05;
  }), 'true');
  chk('가로 스크롤 없음', await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1), 'true');
  chk('버튼 문구 바뀜', await p.evaluate(()=>document.querySelector('.ez-btn .ez-l').textContent.trim()), '글자 작게');
  chk('기기에 기억', await p.evaluate(()=>{ try{ return localStorage.getItem('gori.textLarge'); }catch(e){ return '(막힘)'; } }), '1');
  /* 새로 열어도 유지되는지 */
  await p.reload({waitUntil:'load'}); await p.waitForTimeout(2000);
  chk('다시 열어도 유지', await p.evaluate(()=>document.documentElement.classList.contains('txl')), 'true');
  await p.evaluate(()=>gToggleTextSize()); await p.waitForTimeout(500);
  chk('되돌리기', await p.evaluate(()=>document.documentElement.classList.contains('txl')), 'false');

  log.push('4. 데스크톱·모바일 양쪽에 버튼');
  chk('분야 줄에 있음', await p.evaluate(()=>{
    const e=document.querySelector('#hdr-cats .ez-btn');
    return !!(e && e.getBoundingClientRect().height>=40);
  }), 'true');
  const m=await open(b,390,844);
  /* 홈에서는 .hdr 이 숨겨지고 히어로가 머리말 노릇을 합니다 —
     서랍이 있는 화면으로 옮긴 뒤에 확인합니다. */
  await m.evaluate(()=>go('reqs')); await m.waitForTimeout(1300);
  await m.evaluate(()=>toggleMM()); await m.waitForTimeout(500);
  chk('모바일 메뉴에 있음', await m.evaluate(()=>{
    const e=document.querySelector('#mobile-menu .ez-btn');
    return !!(e && e.getBoundingClientRect().height>=48);
  }), 'true');
  chk('모바일에서도 켜짐', await m.evaluate(async()=>{
    gToggleTextSize(); await new Promise(r=>setTimeout(r,300));
    return document.documentElement.classList.contains('txl');
  }), 'true');
  chk('모바일 가로 스크롤 없음', await m.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1), 'true');

  log.push('5. 움직이는 글 — 멈출 수 있어야 (WCAG 2.2.2)');
  /* file:// 에서는 외부 CSS 의 cssRules 를 못 읽습니다 —
     규칙을 뒤지지 말고 실제로 손을 얹어 보고 판정합니다. */
  const bar=await p.$('.live-bar');
  chk('평소엔 흐름', await p.evaluate(()=>{
    const e=document.querySelector('.live-slide');
    return e ? getComputedStyle(e).animationPlayState : '(없음)';
  }), 'running');
  if(bar) await bar.hover();
  await p.waitForTimeout(250);
  chk('손 올리면 멈춤', await p.evaluate(()=>{
    const e=document.querySelector('.live-slide');
    return e ? getComputedStyle(e).animationPlayState : '(없음)';
  }), 'paused');
  chk('천천히 흐름', await p.evaluate(()=>{
    const e=document.querySelector('.live-slide');
    return e ? parseFloat(getComputedStyle(e).animationDuration)>=45 : '(없음)';
  }), 'true');

  log.push('6. 애니메이션을 끈 기기');
  const r=await open(b,1440,1000,{reducedMotion:'reduce'});
  chk('실시간 띠 정지', await r.evaluate(()=>{
    const e=document.querySelector('.live-slide');
    return e ? getComputedStyle(e).animationName : '(없음)';
  }), 'none');

  log.push('7. 단계 표시가 좁은 화면에서 어긋나지 않는가');
  /* 라벨에 줄바꿈을 허용했더니 칸마다 높이가 달라졌고, align-items:center 가
     각 칸을 세로 가운데로 맞추는 바람에 동그라미 셋이 계단처럼 어긋나
     글자가 서로 붙어 읽혔습니다. 390px 에서 실제로 그랬습니다. */
  const steps=async(pg,hash)=>{
    await pg.evaluate(h=>{location.hash=h;},hash); await pg.waitForTimeout(1600);
    return await pg.evaluate(()=>{
      const items=[...document.querySelectorAll('.pg.on .gstep-i')];
      if(!items.length) return '(단계 없음)';
      const tops=items.map(e=>Math.round(e.querySelector('.gstep-n').getBoundingClientRect().top));
      const spread=Math.max(...tops)-Math.min(...tops);
      /* 글자끼리 겹치지도 않아야 합니다 */
      const boxes=items.map(e=>e.querySelector('.gstep-l').getBoundingClientRect());
      let hit='';
      for(let i=1;i<boxes.length;i++) if(boxes[i].left < boxes[i-1].right-1) hit='글자 겹침';
      return spread>2 ? ('동그라미 '+spread+'px 어긋남') : hit;
    });
  };
  chk('요청 등록 3단계 (390px)', await steps(m,'#/rw'), '');
  chk('업체 등록 4단계 (390px)', await steps(m,'#/sj'), '');
  chk('요청 등록 3단계 (데스크톱)', await steps(p,'#/rw'), '');

  const allErrs=[].concat(p._errs,m._errs,r._errs);
  console.log(log.join('\n'));
  if(allErrs.length){ console.log('  ❌ 페이지 에러: '+allErrs.join(' / ')); errs.push('pageerror'); }
  else console.log('  ✅ 페이지 에러 없음');
  console.log(errs.length ? '❌ '+errs.length+'건 실패: '+errs.join(', ') : '✅ 전체 통과');
  await b.close();
  process.exit(errs.length?1:0);
})();
