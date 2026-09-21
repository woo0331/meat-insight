/* ════════════════════════════════════════════════════════════════════
   거래관리 — 한눈에 보기

   확인하는 것
     1. 처음 열면 요약이 먼저 보이는지 (탭은 하나도 없어지지 않았는지)
     2. "지금 할 일" 숫자가 실제 데이터와 맞는지 — 지어내지 않는지
     3. 할 일·"전체 ›"·목록 줄을 누르면 원래 화면으로 가는지
     4. 탭 13개가 전부 여전히 내용을 그리는지
     5. 넓은 화면에서만 묶음 소제목이 보이는지
     6. 데이터가 없으면 0 과 빈 안내가 나오는지 (숫자를 만들지 않는지)
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
const BUYER={id:'u1',user_metadata:{name:'김철수',role:'buyer'}};
const NEW  ={id:'u77',user_metadata:{name:'신규',role:'buyer'}};

async function open(b,user,w,h){
  const p=await b.newPage({viewport:{width:w||1440,height:h||1000}});
  await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify({user,realtime:true})+");");
  p._errs=[]; p.on('pageerror',e=>p._errs.push(e.message)); p.on('dialog',d=>d.accept());
  await p.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});
  await p.waitForTimeout(1900);
  return p;
}
const openMy = async p => { await p.evaluate(()=>go('my')); await p.waitForTimeout(1700); };

(async()=>{
  const b=await chromium.launch(); const log=[], errs=[];
  const chk=(n,g,w)=>{const ok=String(g)===String(w);
    log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w)); if(!ok)errs.push(n);};

  log.push('1. 처음 열면 요약');
  const p=await open(b,BUYER); await openMy(p);
  chk('요약 탭 선택됨', await p.evaluate(()=>{
    const on=document.querySelector('#my-body .my-tab.on'); return on?on.textContent.trim().replace(/\s+/g,''):'(없음)';
  }), '한눈에보기');
  chk('요약 화면', await p.evaluate(()=>!!document.querySelector('#my-panel .hub-grid')), 'true');
  chk('탭 13개', await p.evaluate(()=>document.querySelectorAll('#my-body .my-tab').length), 13);
  chk('원래 탭 그대로', await p.evaluate(()=>
    ['reqs','in','out','ing','done','chat','order','daily','fav','rv','noti','me']
      .every(k=>[...document.querySelectorAll('#my-body .my-tab')]
        .some(e=>(e.getAttribute('onclick')||'').indexOf("'"+k+"'")>=0))), 'true');

  log.push('2. 지금 할 일 — 실제 숫자와 맞는지');
  /* NOTIFS 는 IIFE 안의 지역 변수라 밖에서 못 읽습니다.
     알림 탭 배지(counts() 가 따로 센 값)와 맞는지로 교차 확인합니다. */
  const truth = await p.evaluate(()=>{
    const MY=GORI.MY;
    /* ⚠️ 35_hub 의 hubQn 과 같은 셈법이어야 합니다. 불러온 quotes 줄만
       세면, quotes 를 못 읽었을 때 목록에선 "견적 2 개" 인 요청이
       여기선 "0건" 이 됩니다 — 실제로 그랬습니다. DB 가 세어 둔
       quote_count 와 큰 쪽을 씁니다. */
    const qn=r=>Math.max(
      MY.quotesIn.filter(q=>String(q.request_id)===String(r.id)&&q.status!=='철회').length,
      Math.max(0, Number(r.quote_count)||0));
    const badge=[...document.querySelectorAll('#my-body .my-tab')]
      .find(e=>(e.getAttribute('onclick')||'').indexOf("'noti'")>=0);
    const c=badge&&badge.querySelector('.cnt');
    return {
      newQ: MY.reqs.filter(r=>String(r.status||'견적대기')==='견적대기'&&qn(r)>0).length,
      unread: c?Number(c.textContent.trim()):0,
      reqs: MY.reqs.length, in: MY.quotesIn.length
    };
  });
  const shown = await p.evaluate(()=>[...document.querySelectorAll('.hub-td')]
    .map(e=>e.querySelector('.hub-td-l').textContent.trim()+'='+e.querySelector('.hub-td-n').textContent.trim()).join(','));
  chk('견적 도착 건수', /견적이 도착한 요청=(\d+)/.exec(shown)?.[1], truth.newQ);
  chk('안 읽은 알림 수', /안 읽은 알림=(\d+)/.exec(shown)?.[1], truth.unread);
  chk('내 요청 카드 수', await p.evaluate(()=>{
    const c=[...document.querySelectorAll('.hub-card')].find(e=>/내 요청/.test(e.textContent));
    return c?c.querySelector('.hub-t b').textContent.trim():'(없음)';
  }), truth.reqs);
  chk('받은 견적 카드 수', await p.evaluate(()=>{
    const c=[...document.querySelectorAll('.hub-card')].find(e=>/받은 견적/.test(e.textContent));
    return c?c.querySelector('.hub-t b').textContent.trim():'(없음)';
  }), truth.in);

  log.push('3. 눌러서 이동');
  await p.evaluate(()=>{ [...document.querySelectorAll('.hub-td')].find(e=>/견적이 도착한/.test(e.textContent)).click(); });
  await p.waitForTimeout(600);
  chk('할 일 → 받은 견적 탭', await p.evaluate(()=>GORI.MY.tab), 'in');
  await p.evaluate(()=>gMyTab('hub')); await p.waitForTimeout(500);
  await p.evaluate(()=>{
    const c=[...document.querySelectorAll('.hub-card')].find(e=>/내 요청/.test(e.textContent));
    c.querySelector('.hub-all').click();
  });
  await p.waitForTimeout(600);
  chk('전체 › → 내 요청 탭', await p.evaluate(()=>GORI.MY.tab), 'reqs');
  chk('내 요청 목록 보임', await p.evaluate(()=>document.querySelectorAll('#my-panel .ritem').length>0), 'true');
  await p.evaluate(()=>gMyTab('hub')); await p.waitForTimeout(500);
  await p.evaluate(()=>{
    const c=[...document.querySelectorAll('.hub-card')].find(e=>/내 요청/.test(e.textContent));
    c.querySelector('.hub-row').click();
  });
  await p.waitForTimeout(1300);
  chk('줄 클릭 → 요청 상세', await p.evaluate(()=>(document.querySelector('.pg.on')||{}).id), 'pg-reqd');

  log.push('4. 탭 13개 전부 그려지는지');
  await p.evaluate(()=>go('my')); await p.waitForTimeout(1600);
  const keys=['hub','reqs','in','out','ing','done','chat','order','daily','fav','rv','noti','me'];
  for(const k of keys){
    await p.evaluate(x=>gMyTab(x), k); await p.waitForTimeout(260);
    const n=await p.evaluate(()=>document.getElementById('my-panel').innerHTML.length);
    chk('  '+k, n>60, 'true');
  }

  log.push('5. 묶음 소제목은 넓은 화면에서만');
  await p.evaluate(()=>gMyTab('hub')); await p.waitForTimeout(400);
  chk('소제목 4개', await p.evaluate(()=>[...document.querySelectorAll('#my-body .my-grp')].map(e=>e.textContent.trim()).join('/')),
    '요청·견적/거래/소통/그 밖');
  chk('데스크톱에선 보임', await p.evaluate(()=>
    getComputedStyle(document.querySelector('#my-body .my-grp')).display), 'block');
  const m=await open(b,BUYER,390,844); await openMy(m);
  chk('모바일에선 숨김', await m.evaluate(()=>
    getComputedStyle(document.querySelector('#my-body .my-grp')).display), 'none');
  chk('모바일 가로 스크롤 없음', await m.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1), 'true');
  chk('모바일 요약 한 줄', await m.evaluate(()=>
    getComputedStyle(document.querySelector('.hub-grid')).gridTemplateColumns.split(' ').length), 1);

  log.push('6. 데이터가 없으면 0 — 지어내지 않는다');
  const n2=await open(b,NEW); await openMy(n2);
  chk('할 일 없음 안내', await n2.evaluate(()=>!!document.querySelector('.hub-clear')), 'true');
  chk('할 일 칩 없음', await n2.evaluate(()=>document.querySelectorAll('.hub-td').length), 0);
  chk('모든 카드 0', await n2.evaluate(()=>
    [...document.querySelectorAll('.hub-card .hub-t b')].every(e=>e.textContent.trim()==='0')), 'true');
  chk('빈 안내 문구', await n2.evaluate(()=>document.querySelectorAll('.hub-none').length), 6);
  chk('없는데 전체 › 안 보임', await n2.evaluate(()=>document.querySelectorAll('.hub-all').length), 0);

  log.push('7. 같은 요청의 견적 수가 화면마다 같은가');
  /* 예전에는 요청 목록이 purchase_requests.quote_count 를 읽고,
     내활동 "한눈에 보기" 만 불러온 quotes 를 셌습니다. **quotes 를 못
     읽으면**(RLS 가 막았거나 표가 아직 없으면) 목록에서 "견적 2 개"
     이던 요청이 내활동에서는 "견적 0건" 이 됐습니다 — 세어 본 손님에게
     둘 중 하나는 거짓말입니다. 0 은 "아직 아무도 안 보냈다" 는,
     확인되지 않은 사실입니다 (규칙 3).
     그 상황을 그대로 만듭니다 — quotes 만 42501 로 막습니다. */
  const q0=await b.newPage({viewport:{width:1440,height:1000}});
  await q0.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify({
    user:BUYER, realtime:true,
    errorTables:{quotes:{code:'42501',message:'permission denied for table quotes'}}
  })+");");
  q0._errs=[]; q0.on('pageerror',e=>q0._errs.push(e.message)); q0.on('dialog',d=>d.accept());
  await q0.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});
  await q0.waitForTimeout(1900);
  await openMy(q0);
  await q0.evaluate(()=>gMyTab('hub')); await q0.waitForTimeout(600);

  const cnt=await q0.evaluate(()=>{
    const want={};
    (GORI.MY.reqs||[]).forEach(r=>{ want[String(r.id)]=Math.max(0,Number(r.quote_count)||0); });
    const got={};
    [...document.querySelectorAll('.hub-card')].filter(e=>/내 요청/.test(e.textContent))
      .forEach(card=>[...card.querySelectorAll('.hub-row')].forEach(row=>{
        const id=(/gOpenRequest\('([^']+)'\)/.exec(row.getAttribute('onclick')||'')||[])[1];
        const m=/견적\s*(\d+)\s*건/.exec(row.textContent||'');
        if(id&&m) got[id]=Number(m[1]);
      }));
    return {want:want, got:got, loaded:(GORI.MY.quotesIn||[]).length};
  });
  chk('quotes 를 못 읽은 상태', cnt.loaded, 0);
  const ids=Object.keys(cnt.got);
  chk('한눈에 보기에 요청 줄이 있음', ids.length>0, 'true');
  chk('DB 가 센 수보다 적게 적힌 줄',
    ids.filter(k=>cnt.got[k]<(cnt.want[k]||0)).map(k=>k+' '+cnt.got[k]+'건≠'+cnt.want[k]+'건').join(', ') || '없음', '없음');
  chk('실제로 0 이 아닌 요청이 있었음', Object.keys(cnt.want).some(k=>cnt.want[k]>0), 'true');

  const allErrs=[].concat(p._errs,m._errs,n2._errs,q0._errs);
  console.log(log.join('\n'));
  if(allErrs.length){ console.log('  ❌ 페이지 에러: '+allErrs.join(' / ')); errs.push('pageerror'); }
  else console.log('  ✅ 페이지 에러 없음');
  console.log(errs.length ? '❌ '+errs.length+'건 실패: '+errs.join(', ') : '✅ 전체 통과');
  await b.close();
  process.exit(errs.length?1:0);
})();
