/* ════════════════════════════════════════════════════════════════════
   XSS — 남이 쓴 글이 내 브라우저에서 실행되지 않는가

   실제로 뚫려 있었습니다. gori-app.js 의 esc() 는 IIFE 안에 갇혀 있어
   index.html 의 렌더러들이 쓸 수 없었고, 그래서 원문을 그대로 붙이고
   있었습니다. 업체명에 <img src=x onerror=...> 를 넣으면 그 업체를
   보는 모든 사람의 브라우저에서 스크립트가 돌았습니다.
   (처음 재 봤을 때: 태그 39개 주입, 77회 실행)

   막은 방법: index.html 에 자체 esc() 를 두고, 사용자 입력을 화면에
   찍는 자리 16곳을 전부 통과시킵니다.

   이 검사는 두 가지를 봅니다.
     1. 필드마다 다른 표식을 심어 "어느 필드가 새는지" 를 집어냅니다
     2. 진짜 실행되는 페이로드로 실행 횟수가 0인지 확인합니다
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
const BUYER={id:'u1',user_metadata:{name:'김철수',role:'buyer'}};

const FIELDS=['req_title','req_desc','req_buyer','req_region','req_num','req_part',
  'sup_name','sup_intro','sup_desc','sup_addr','sup_contact','sup_cats','sup_items','sup_services',
  'q_supname','q_note','q_cond','q_lead','rv_content','rv_author','rv_deal',
  'job_role','job_company','job_loc','job_detail','nt_title','nt_body','cm_body','cm_sender'];

const SEED = (mode) => `
 (function(){ var d=window.__DB; if(!d) return;
   var P = ${mode==='probe'
     ? 'function(k){ return \'<i data-x="\'+k+\'"></i>\'; }'
     : 'function(k){ return \'<img src=x onerror="window.__XSS=(window.__XSS||0)+1">XSSPROBE\'; }'};
   (d.purchase_requests||[]).forEach(function(r){
     r.title=P('req_title'); r.description=P('req_desc'); r.buyer_name=P('req_buyer');
     r.region=P('req_region'); r.request_number=P('req_num');
     if(r.detail) r.detail.part=P('req_part'); });
   (d.suppliers||[]).forEach(function(s){
     s.name=P('sup_name'); s.intro=P('sup_intro'); s.description=P('sup_desc');
     s.address=P('sup_addr'); s.contact=P('sup_contact');
     s.categories=[P('sup_cats')]; s.items=[P('sup_items')]; s.services=[P('sup_services')]; });
   (d.quotes||[]).forEach(function(q){ q.supplier_name=P('q_supname'); q.note=P('q_note');
     q.conditions=P('q_cond'); q.lead_time=P('q_lead'); });
   (d.reviews||[]).forEach(function(v){ v.content=P('rv_content'); v.author_name=P('rv_author'); v.deal_summary=P('rv_deal'); });
   (d.jobs||[]).forEach(function(j){ j.job_role=P('job_role'); j.company=P('job_company');
     j.location=P('job_loc'); j.detail=P('job_detail'); });
   (d.notifications||[]).forEach(function(n){ n.title=P('nt_title'); n.body=P('nt_body'); });
   (d.chat_messages||[]).forEach(function(m){ m.body=P('cm_body'); m.sender_name=P('cm_sender'); });
 })();`;

async function open(b, mode){
  const p=await b.newPage({viewport:{width:1440,height:1000}});
  p._errs=[]; p.on('pageerror',e=>p._errs.push(e.message)); p.on('dialog',d=>d.accept());
  await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify({user:BUYER,realtime:true})+");"+SEED(mode));
  await p.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});
  await p.waitForTimeout(2600);
  return p;
}
const SCREENS=[()=>go('h'),()=>go('reqs'),()=>gOpenRequest('r1'),()=>go('suppliers'),
  ()=>{curSID='s1';go('sp');},()=>go('jobs'),()=>go('my')];
const TABS=['reqs','in','out','ing','done','chat','order','daily','fav','rv','noti','me'];

(async()=>{
  const b=await chromium.launch(); const log=[], errs=[];
  const chk=(n,g,w)=>{const ok=String(g)===String(w);
    log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w)); if(!ok)errs.push(n);};

  log.push('1. 어느 필드가 새는가 (필드마다 다른 표식)');
  const a=await open(b,'probe');
  const leaked=new Set();
  const scan=async()=>{ (await a.evaluate(()=>[...document.querySelectorAll('i[data-x]')].map(e=>e.dataset.x)))
    .forEach(k=>leaked.add(k)); };
  for(const nav of SCREENS){ await a.evaluate(nav).catch(()=>{}); await a.waitForTimeout(1200); await scan(); }
  await a.evaluate(()=>go('my')); await a.waitForTimeout(1200);
  for(const t of TABS){ await a.evaluate(x=>gMyTab(x),t).catch(()=>{}); await a.waitForTimeout(240); await scan(); }
  chk('새는 필드 없음', leaked.size ? [...leaked].join(', ') : 0, 0);
  chk('검사한 필드 수', FIELDS.length, 29);

  log.push('2. 진짜 실행되는 페이로드');
  const c=await open(b,'live');
  for(const nav of SCREENS){
    await c.evaluate(nav).catch(()=>{}); await c.waitForTimeout(1200);
  }
  await c.evaluate(()=>go('my')); await c.waitForTimeout(1200);
  for(const t of TABS){ await c.evaluate(x=>gMyTab(x),t).catch(()=>{}); await c.waitForTimeout(240); }
  const r=await c.evaluate(()=>({
    inj:document.querySelectorAll('img[onerror], img[src="x"]').length,
    fired:window.__XSS||0,
    asText:document.body.innerText.includes('XSSPROBE')
  }));
  chk('주입된 태그 0개', r.inj, 0);
  chk('실행 0회', r.fired, 0);
  chk('글자로는 보임 (지워버린 게 아님)', r.asText, 'true');

  const all=[].concat(a._errs,c._errs);
  console.log(log.join('\n'));
  if(all.length){ console.log('  ❌ 페이지 에러: '+[...new Set(all)].slice(0,3).join(' | ')); errs.push('pageerror'); }
  else console.log('  ✅ 페이지 에러 없음');
  console.log(errs.length ? '❌ '+errs.length+'건 실패: '+errs.join(', ') : '✅ 전체 통과');
  await b.close();
  process.exit(errs.length?1:0);
})();
