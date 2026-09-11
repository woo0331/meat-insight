/* ════════════════════════════════════════════════════════════════════
   새로고침·뒤로가기로 들어와도 빈 화면이 안 나오는가 · 구직 프로필

   상세·폼 화면은 gOpenX() 안에서 본문을 그립니다. 그래서 주소창에
   #/chats 를 직접 치거나 뒤로가기로 돌아오면 라우터가 go() 만 부르고
   본문은 빈 칸으로 남았습니다 — 흰 화면 열다섯 개.
   "구직 프로필 등록" 버튼은 아예 만들지 않은 화면으로 갔습니다.

   확인하는 것
     1. 열다섯 화면 모두 주소로 들어가도 글이 보인다
     2. id 가 필요한 화면은 돌아갈 버튼이 있는 빈 상태를 보여준다
     3. 구직 프로필 등록이 진짜 폼이다 (필수값 검증 포함)
     4. 화면 이름이 빠진 다섯 곳에 이름이 붙었다 (제목·스크린리더)
     5. 글씨 12px 이상 · 누르는 것 40px 이상 · 가로 스크롤 없음
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
const URL='file:///home/user/meat-insight/index.html';

/* 본문이 비어 있으면 안 되는 화면 */
const PAGES=['sp','reqd','quote','djnew','review','wprof','chats','chat',
             'prefs','verify','order','instant','reqedit','findreq','report'];
/* id 가 있어야 열리는 화면 — 돌아갈 버튼이 있어야 합니다 */
const LOST=['sp','reqd','quote','review','order','reqedit','chat','instant','report'];

async function open(b,w,h,init){
  const p=await b.newPage({viewport:{width:w,height:h}});
  await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+(init||'{}')+")");
  p._errs=[]; p.on('pageerror',e=>p._errs.push(e.message)); p.on('dialog',d=>d.accept());
  await p.goto(URL,{waitUntil:'load'});
  await p.waitForTimeout(2600);
  return p;
}
const nav=async(p,k)=>{ await p.evaluate(key=>{location.hash='#/'+key;},k); await p.waitForTimeout(1700); };

(async()=>{
  const b=await chromium.launch(); const log=[], errs=[];
  const chk=(n,g,w)=>{const ok=String(g)===String(w);
    log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w)); if(!ok)errs.push(n);};

  const p=await open(b,1440,1000);

  log.push('1. 주소로 곧장 들어가도 빈 화면이 아니다');
  const blank=[];
  for(const k of PAGES){
    await nav(p,k);
    const n=await p.evaluate(key=>{
      const el=document.getElementById(key+'-body');
      return el ? (el.innerText||'').trim().length : -1;
    },k);
    if(n<20) blank.push(k+':'+n);
  }
  chk('빈 화면 없음', blank.join(','), '');

  log.push('2. id 가 없으면 돌아갈 길을 준다');
  const noway=[];
  for(const k of LOST){
    await nav(p,k);
    const ok=await p.evaluate(key=>{
      const el=document.getElementById(key+'-body');
      return !!(el && el.querySelector('.gempty-t') && el.querySelector('.gempty button,.gempty .gbtn'));
    },k);
    if(!ok) noway.push(k);
  }
  chk('돌아갈 버튼 있음', noway.join(','), '');

  log.push('3. 구직 프로필 등록 — 진짜 폼');
  await nav(p,'wprof');
  chk('직무 고르는 칸', await p.evaluate(()=>document.querySelectorAll('#wp-role .gpick-i').length>=8), 'true');
  chk('이름·연락처·지역 칸', await p.evaluate(()=>
    !!(document.getElementById('wp-name')&&document.getElementById('wp-contact')&&document.getElementById('wp-region'))), 'true');
  chk('필수값 없으면 막는다', await p.evaluate(async()=>{
    await window.gSubmitWProf(); await new Promise(r=>setTimeout(r,300));
    const m=document.getElementById('wp-msg');
    return !!(m && /필수/.test(m.textContent||''));
  }), 'true');
  /* 구직 프로필은 구인구직에서 들어오는 화면입니다 — 하단 네비도 구인구직과 같아야
     합니다 (전에는 "내활동" 이 켜졌습니다). 구인구직은 하단 네비에 칸이 없어서
     둘 다 아무것도 안 켜지는 것이 맞습니다. */
  const bnOf=async(pg,k)=>{ await nav(pg,k);
    return await pg.evaluate(()=>{const on=document.querySelector('.bnav .bni.on'); return on?on.id:'(없음)';}); };
  chk('하단 네비가 구인구직과 같다', await bnOf(p,'wprof'), await bnOf(p,'jobs'));
  chk('구인구직으로 돌아가는 버튼', await p.evaluate(()=>
    !!document.querySelector('#wprof-body .back-btn')), 'true');

  log.push('4. 이름 없던 다섯 화면');
  const t={};
  for(const k of ['sj','guide','report','contact','about']){
    await nav(p,k);
    t[k]=await p.evaluate(()=>document.title);
  }
  chk('업체 등록', /업체 등록/.test(t.sj), 'true');
  chk('이용 가이드', /이용 가이드/.test(t.guide), 'true');
  chk('신고하기',   /신고하기/.test(t.report), 'true');
  chk('문의하기',   /문의하기/.test(t.contact), 'true');
  chk('고리 소개',  /고리 소개/.test(t.about), 'true');

  log.push('5. 글씨 · 누르는 것 · 가로 스크롤');
  const audit=async(pg)=>{
    await nav(pg,'wprof');
    return await pg.evaluate(()=>{
      const el=document.getElementById('pg-wprof'); const bad=[];
      el.querySelectorAll('*').forEach(e=>{
        if(!e.offsetParent||!e.textContent.trim()||e.children.length) return;
        const f=parseFloat(getComputedStyle(e).fontSize);
        if(f<12) bad.push('작은글씨 '+(e.className||e.tagName)+':'+f);
      });
      el.querySelectorAll('button,select,input,textarea,a[href],[onclick],[role=button]').forEach(e=>{
        if(e.parentElement && e.parentElement.closest('button,a[href],[onclick],[role=button]')) return;
        const r=e.getBoundingClientRect();
        if(r.height>0 && r.height<40) bad.push('작은버튼 '+(e.textContent||e.id||'').trim().slice(0,10)+':'+Math.round(r.height));
      });
      return bad.join(', ');
    });
  };
  chk('데스크톱 규칙 위반 없음', await audit(p), '');
  chk('데스크톱 가로 스크롤 없음', await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1), 'true');

  const m=await open(b,390,844);
  chk('모바일 규칙 위반 없음', await audit(m), '');
  chk('모바일 가로 스크롤 없음', await m.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1), 'true');

  log.push('6. 정상 동선은 그대로 (덮어쓰지 않는다)');
  await m.evaluate(()=>go('h')); await m.waitForTimeout(400);
  chk('요청 상세는 뼈대부터', await m.evaluate(async()=>{
    window.gOpenRequest('r1'); await new Promise(r=>setTimeout(r,120));
    const el=document.getElementById('reqd-body');
    return (el.innerHTML||'').length>50;    /* skelPanel 이 즉시 들어와야 합니다 */
  }), 'true');

  log.push('7. 푸터는 언제나 맨 밑');
  /* 푸터를 홈에서 꺼내 .bnav 앞에 두었더니, 나중에 JS 로 만들어지는 여섯
     화면(요청 상세·견적·당일알바·일감 등록·후기·구직 프로필)이 그 뒤에
     끼어들어 그 화면들만 푸터가 맨 위에 찍혔습니다. */
  chk('푸터가 모든 .pg 뒤', await p.evaluate(()=>{
    const ft=document.querySelector('.footer'); if(!ft) return '푸터없음';
    const bad=[];
    document.querySelectorAll('.pg').forEach(pg=>{
      if(ft.compareDocumentPosition(pg) & Node.DOCUMENT_POSITION_FOLLOWING) bad.push(pg.id);
    });
    return bad.join(',');
  }), '');
  /* ── 주소로 곧바로 들어왔을 때 ────────────────────────────────────
     라우터는 초기 진입에서 RT_RESTORE 에 없는 화면을 홈으로 보냅니다.
     그런데 인자 없이도 다 열리는 화면 여섯이 목록에서 빠져 있어서,
     #/sj 를 공유하면 주소는 #/sj 인데 화면은 홈이었습니다.
     열 수 없는 주소는 홈으로 보내되 주소도 같이 되돌려야 합니다 —
     안 그러면 새로고침해도 영영 안 열리고 링크 복사가 그 주소를 퍼뜨립니다. */
  log.push('7. 주소로 곧바로 들어오기');
  const enter=async(hash)=>{
    const q=await b.newPage({viewport:{width:1280,height:900}});
    await q.addInitScript(FAKE+"\nwindow.__FAKE_INIT({})");
    q.on('dialog',d=>d.accept());
    await q.goto(URL+hash,{waitUntil:'load'});
    await q.waitForTimeout(4200);
    const r=await q.evaluate(()=>{
      const v=[...document.querySelectorAll('.pg')].filter(e=>!e.hidden&&e.offsetParent!==null);
      return {pg:v[0]?v[0].id:'없음', hash:location.hash,
              len:v[0]?(v[0].innerText||'').trim().length:0};
    });
    await q.close(); return r;
  };
  for(const k of ['sj','contact','prefs','verify','djnew','wprof']){
    const r=await enter('#/'+k);
    chk('#/'+k+' 그대로 열림', r.pg+'|'+r.hash+'|'+(r.len>40), 'pg-'+k+'|#/'+k+'|true');
  }
  for(const k of ['reqd','sp','chat','order','quote','review','reqedit','report']){
    const r=await enter('#/'+k);
    chk('#/'+k+' 홈 + 주소 정리', r.pg+'|'+r.hash, 'pg-h|#/');
  }
  const sup=await enter('#/sup/s1');
  chk('#/sup/s1 업체 상세', sup.pg+'|'+sup.hash, 'pg-sp|#/sup/s1');
  const rq=await enter('#/req/r1');
  chk('#/req/r1 요청 상세', rq.pg+'|'+rq.hash, 'pg-reqd|#/req/r1');
  const nf=await enter('#/zzzz');
  chk('모르는 주소는 홈 + 주소 정리', nf.pg+'|'+nf.hash, 'pg-h|#/');

  /* ── 빠르게 연달아 옮겨 다녀도 ──────────────────────────────────
     RS.busy 가 참/거짓 하나뿐일 때는 **다른 화면의 검사까지** 막았습니다.
     뒤로가기를 연달아 누르면 그 사이에 낀 화면이 빈 칸으로 남았습니다. */
  log.push('8. 빠르게 연달아 옮겨 다녀도 빈 화면이 없다');
  const fresh=await open(b,1280,900);          /* 앞 절에서 이미 채워 둔 화면으로는 못 잡습니다 */
  const rapid=await fresh.evaluate(async(keys)=>{
    const bad=[];
    for(const k of keys){
      go(k);
      await new Promise(r=>setTimeout(r,450));   /* 사람이 뒤로가기를 누르는 속도 */
      const el=document.getElementById('pg-'+k);
      const t=el?(el.innerText||'').trim():'';
      if(t.length<30) bad.push(k+'('+t.length+'자)');
    }
    return bad.join(', ');
  }, ['review','wprof','chat','prefs','order','instant','report','verify','chats']);
  chk('아홉 화면 모두 글이 있다', rapid, '');
  errs.push(...fresh._errs.map(e=>'rapid: '+e));

  const order=async(pg,k)=>{ await nav(pg,k);
    return await pg.evaluate(key=>{
      const el=document.getElementById(key+'-body'), ft=document.querySelector('.footer');
      if(!el||!ft) return 'x';
      const a=el.getBoundingClientRect().top+scrollY, b=ft.getBoundingClientRect().top+scrollY;
      return a<b ? 'ok' : '푸터가 위';
    },k); };
  for(const k of ['reqd','quote','daily','djnew','review','wprof'])
    chk(k+' 본문이 푸터보다 위', await order(p,k), 'ok');

  const allErrs=[].concat(p._errs,m._errs);
  console.log(log.join('\n'));
  if(allErrs.length){ console.log('  ❌ 페이지 에러: '+allErrs.join(' / ')); errs.push('pageerror'); }
  else console.log('  ✅ 페이지 에러 없음');
  console.log(errs.length ? '❌ '+errs.length+'건 실패: '+errs.join(', ') : '✅ 전체 통과');
  await b.close();
  process.exit(errs.length?1:0);
})();
