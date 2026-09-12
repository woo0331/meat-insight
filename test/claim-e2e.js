/* ════════════════════════════════════════════════════════════════════
   업체 연결 (#/claim/<열쇠>) — 운영자가 대신 등록한 업체를 사장님이 가져감

   사이트의 진짜 병목은 디자인이 아니라 **등록된 업체가 0곳**인 것입니다.
   사장님께 "가입하세요" 하면 안 합니다. 운영자가 명함 보고 대신 넣고
   초대 문자를 보냅니다. 이 화면이 그 문자를 받는 곳입니다.

   여기서 지키는 것
     1. 링크를 열면 자기 업체가 보인다 (주소도 그대로 남는다)
     2. **눌러야 할 것이 하단 네비에 가리지 않는다** — 실제로 가렸습니다
     3. 남의 업체를 가져갈 수 없다 (열쇠는 한 번만)
     4. 업체명에 스크립트를 넣어도 안 터진다
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
const URL='file:///home/user/meat-insight/index.html';
const TOKEN='aaaabbbbccccddddeeeeffff';
const U={id:'u-new',user_metadata:{name:'박사장',role:'supplier'}};

/* 대신 등록해 둔 업체는 **이 테스트에서만** 넣습니다.
   fake-sb.js 의 suppliers 를 늘리면 업체 개수를 세는 회귀가 줄줄이
   깨집니다 (admin-find · demo · filter). 한 번 그렇게 깨뜨렸습니다. */
const GUEST={ id:'s4', name:'포천한우작업장', region:'경기 포천시',
  categories:['원육 구매','가공·OEM'], category_mains:['meat','process'],
  rating:0, is_verified:false, deal_count:0, contact:'010-5555-7777',
  user_id:null, notify_on:true, claim_token:TOKEN,
  added_by:'admin@aboutmeat.co.kr' };

async function open(b,hash,opts,w,h){
  const p=await b.newPage({viewport:{width:w||390,height:h||844}});
  await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify(opts||{})+");"+
    "\n(function(){var d=window.__DB; if(d&&d.suppliers) d.suppliers.push("+JSON.stringify(GUEST)+");})();");
  p._errs=[]; p.on('pageerror',e=>p._errs.push(e.message)); p.on('dialog',d=>d.accept());
  await p.goto(URL+(hash||''),{waitUntil:'load'});
  await p.waitForTimeout(4000);
  return p;
}

(async()=>{
  const b=await chromium.launch(); const log=[], errs=[];
  const chk=(n,g,w)=>{const ok=String(g)===String(w);
    log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w)); if(!ok)errs.push(n);};

  log.push('1. 초대 링크를 열면 자기 업체가 보인다');
  const p=await open(b,'#/claim/'+TOKEN);
  chk('업체 연결 화면', await p.evaluate(()=>(document.querySelector('.pg.on')||{}).id), 'pg-claim');
  chk('주소가 그대로', await p.evaluate(()=>location.hash), '#/claim/'+TOKEN);
  const txt=await p.evaluate(()=>document.getElementById('claim-body').innerText.replace(/\s+/g,' '));
  chk('업체명', /포천한우작업장/.test(txt), 'true');
  chk('지역',   /경기 포천시/.test(txt), 'true');
  chk('연락처', /010-5555-7777/.test(txt), 'true');
  chk('문서 제목', await p.evaluate(()=>document.title), '업체 연결 · 고리');

  log.push('2. 눌러야 할 것이 하단 네비에 안 가린다');
  /* 예전에는 설득 카드를 먼저 놓고 버튼을 맨 밑에 뒀더니, 390px 에서
     그 자리를 누르면 하단 네비가 받았습니다 (elementFromPoint → bni-t). */
  const hit=await p.evaluate(()=>{
    const btns=[...document.querySelectorAll('#pg-claim button')].filter(e=>e.offsetParent);
    return btns.map(e=>{
      const r=e.getBoundingClientRect();
      const at=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2);
      return (e.textContent||'').trim().slice(0,8)+':'+(e.contains(at)||e===at ? 'ok' : '가림');
    }).join(', ');
  });
  chk('첫 화면 버튼이 전부 눌린다', /가림/.test(hit), 'false');
  log.push('    '+hit);
  chk('가로 스크롤 없음', await p.evaluate(()=>document.documentElement.scrollWidth>390), 'false');

  log.push('3. 비로그인이면 로그인부터 안내한다');
  chk('로그인 안내', /먼저 로그인해 주세요/.test(txt), 'true');
  chk('가져가기 버튼은 아직 없음', await p.evaluate(()=>!!document.getElementById('cl-go')), 'false');
  chk('아직 주인 없음', await p.evaluate(()=>
    String(window.__DB.suppliers.find(s=>s.id==='s4').user_id)), 'null');

  log.push('4. 로그인하면 가져갈 수 있다');
  const q=await open(b,'#/claim/'+TOKEN,{user:U});
  chk('가져가기 버튼', await q.evaluate(()=>!!document.getElementById('cl-go')), 'true');
  await q.evaluate(()=>document.getElementById('cl-go').click());
  await q.waitForTimeout(1200);
  chk('내 계정에 붙음', await q.evaluate(()=>
    window.__DB.suppliers.find(s=>s.id==='s4').user_id), 'u-new');
  chk('열쇠는 지워짐', await q.evaluate(()=>
    String(window.__DB.suppliers.find(s=>s.id==='s4').claim_token)), 'null');
  chk('완료 화면', await q.evaluate(()=>
    /연결되었습니다/.test(document.getElementById('claim-body').innerText)), 'true');
  chk('다음 할 일을 준다', await q.evaluate(()=>
    /요청 보기|업체 정보/.test(document.getElementById('claim-body').innerText)), 'true');

  log.push('5. 남의 업체를 가져갈 수 없다');
  /* 이미 연결된 업체 · 없는 열쇠 · 너무 짧은 열쇠 */
  const r2=await open(b,'#/claim/'+TOKEN,{user:{id:'u-other'}});
  await r2.evaluate(()=>{ const s=window.__DB.suppliers.find(x=>x.id==='s4');
                          s.user_id='u-first'; s.claim_token=null; });
  await r2.evaluate(()=>gOpenClaim('aaaabbbbccccddddeeeeffff'));
  await r2.waitForTimeout(900);
  chk('이미 연결된 업체는 못 가져감', await r2.evaluate(()=>
    /올바르지 않습니다/.test(document.getElementById('claim-body').innerText)), 'true');
  chk('주인이 안 바뀜', await r2.evaluate(()=>
    window.__DB.suppliers.find(s=>s.id==='s4').user_id), 'u-first');

  const r3=await open(b,'#/claim/zzzzzzzzzzzzzzzzzzzzzzzz',{user:U});
  chk('없는 열쇠는 거부', await r3.evaluate(()=>
    /올바르지 않습니다/.test(document.getElementById('claim-body').innerText)), 'true');
  chk('돌아갈 길을 준다', await r3.evaluate(()=>
    /업체 등록하기/.test(document.getElementById('claim-body').innerText)), 'true');

  const r4=await open(b,'#/claim/abc',{user:U});
  chk('짧은 열쇠는 화면을 안 염', await r4.evaluate(()=>
    (document.querySelector('.pg.on')||{}).id), 'pg-h');

  log.push('6. 업체명에 스크립트를 넣어도 안 터진다');
  const x=await open(b,'',{user:U});
  await x.evaluate(()=>{
    const s=window.__DB.suppliers.find(y=>y.id==='s4');
    s.user_id=null; s.claim_token='xssxssxssxssxssxssxssxss';
    s.name='<img src=x onerror="window.__pwned=1">폭탄축산';
    s.region='<script>window.__pwned=1</script>경기';
  });
  await x.evaluate(()=>gOpenClaim('xssxssxssxssxssxssxssxss'));
  await x.waitForTimeout(900);
  chk('스크립트가 안 돌아감', await x.evaluate(()=>!!window.__pwned), 'false');
  chk('글자로만 보임', await x.evaluate(()=>
    /폭탄축산/.test(document.getElementById('claim-body').innerText)), 'true');
  chk('img 태그가 안 생김', await x.evaluate(()=>
    document.querySelectorAll('#claim-body img').length), 0);

  log.push('7. 읽기 · 누르기 (연세 있는 분이 많습니다)');
  const bad=await q.evaluate(()=>{
    const out=[];
    document.querySelectorAll('#pg-claim *').forEach(e=>{
      if(!e.offsetParent) return;
      const t=(e.textContent||'').trim();
      if(t && !e.children.length && parseFloat(getComputedStyle(e).fontSize)<12)
        out.push('작은글씨 '+t.slice(0,10));
    });
    document.querySelectorAll('#pg-claim button,#pg-claim [onclick],#pg-claim a[href]').forEach(e=>{
      const r=e.getBoundingClientRect();
      if(r.height>0 && r.height<40) out.push('작은버튼 '+(e.textContent||'').trim().slice(0,10)+':'+Math.round(r.height));
    });
    return [...new Set(out)].join(', ');
  });
  chk('12px 미만 · 40px 미만 없음', bad, '');

  log.push('8. 데스크톱');
  const d=await open(b,'#/claim/'+TOKEN,{},1440,950);
  chk('데스크톱도 열림', await d.evaluate(()=>(document.querySelector('.pg.on')||{}).id), 'pg-claim');
  chk('데스크톱 가로 스크롤 없음', await d.evaluate(()=>document.documentElement.scrollWidth>1440), 'false');

  const all=[].concat(p._errs,q._errs,r2._errs,r3._errs,r4._errs,x._errs,d._errs);
  console.log(log.join('\n'));
  if(all.length){ console.log('  ❌ 페이지 에러: '+[...new Set(all)].join(' / ')); errs.push('pageerror'); }
  else console.log('  ✅ 페이지 에러 없음');
  console.log(errs.length ? '❌ '+errs.length+'건 실패: '+errs.join(', ') : '✅ 전체 통과');
  await b.close();
  process.exit(errs.length?1:0);
})();
