/* ════════════════════════════════════════════════════════════════════
   손님 화면에 운영자 말이 섞이지 않는가 — 전 화면 전수

   실제로 이런 일이 있었습니다. DB 를 아직 안 켠 상태에서 시세를 누르면
   손님이 이 글을 봤습니다:

     "시세 기능을 쓰려면 DB 준비가 필요합니다.
      Supabase 대시보드 → SQL Editor 에서 db/phase3_schema.sql 을 실행해 주세요."

   정육점 사장님한테 저 문장은 "이 사이트 아직 안 만들어졌구나" 입니다.
   setupNote() 한 함수를 **열여섯 곳**이 쓰고 있었으니 열여섯 곳이 다 그랬고,
   market-e2e 의 한 줄은 오히려 그게 보이는 걸 **요구하고** 있었습니다.

   손님에게는 "아직 준비 중" 까지만, 무엇을 해야 하는지는 console.warn 으로.
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
const URL='file:///home/user/meat-insight/index.html';

/* 손님 눈에 절대 보이면 안 되는 말 */
const BAD=/Supabase|SQL Editor|대시보드|phase\d|\.sql\b|service_role|anon 키|RLS|console\.|localStorage|undefined|NaN|\[object/;
/* DB 를 하나도 안 켠 상태 = 문 열기 전 진짜 손님이 보는 것 */
const NONE=['quotes','reviews','day_jobs','day_job_applications','worker_profiles','favorites',
            'notifications','chat_rooms','chat_messages','supplier_prefs','verifications',
            'orders','market_prices','reports','inquiries','notify_outbox'];

(async()=>{
  const b=await chromium.launch(); const log=[], errs=[];
  const chk=(n,g,w)=>{const ok=String(g)===String(w);
    log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w)); if(!ok)errs.push(n);};

  for(const [w,h,tag,user] of [[390,844,'모바일',{id:'u1',user_metadata:{name:'김철수'}}],
                               [1280,900,'데스크톱',null]]){
    const p=await b.newPage({viewport:{width:w,height:h}});
    p._errs=[]; p.on('pageerror',e=>p._errs.push(e.message)); p.on('dialog',d=>d.accept());
    const warns=[]; p.on('console',m=>{ if(m.type()==='warning' && /고리/.test(m.text())) warns.push(m.text()); });
    await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify({user,missingTables:NONE})+")");
    await p.goto(URL,{waitUntil:'load'});
    await p.waitForTimeout(4200);

    log.push((tag==='모바일'?'1':'2')+'. '+tag+' — DB 를 하나도 안 켠 상태');
    const pages=await p.evaluate(()=>PGS.slice());
    const hits=[];
    for(const k of pages){
      const t=await p.evaluate(async(key)=>{
        if(key==='cat8') goCat8('meat'); else go(key);
        await new Promise(r=>setTimeout(r,380));
        const el=document.getElementById('pg-'+key);
        return (el && !el.hidden) ? (el.innerText||'').replace(/\s+/g,' ') : '';
      },k);
      if(BAD.test(t)) hits.push(k+':"'+t.slice(Math.max(0,t.search(BAD)-20), t.search(BAD)+45)+'"');
    }
    chk(tag+' '+pages.length+'개 화면 — 운영자 문구 없음', hits.join(' / '), '');

    /* 떠 있는 칸(알림 패널)도 손님이 봅니다 */
    const np=await p.evaluate(async()=>{
      if(typeof gToggleNotif!=='function') return '';
      gToggleNotif(); await new Promise(r=>setTimeout(r,400));
      const e=document.getElementById('notif-panel');
      return (e && e.classList.contains('on')) ? (e.innerText||'').replace(/\s+/g,' ') : '';
    });
    chk(tag+' 알림 패널도 깨끗', BAD.test(np), 'false');

    if(tag==='모바일'){
      /* 안 보이게만 하고 끝이면 운영자가 영영 모릅니다 — 콘솔에는 남아야 합니다 */
      chk('운영자에게는 콘솔로 알림', warns.some(x=>/SQL Editor/.test(x)), 'true');
      chk('어느 파일인지도 말해 줌',  warns.some(x=>/phase\d.*\.sql/.test(x)), 'true');
      /* 막힌 화면도 손님이 갈 곳이 있어야 합니다 */
      const way=await p.evaluate(async()=>{
        go('market'); await new Promise(r=>setTimeout(r,600));
        const el=document.getElementById('pg-market');
        return [...el.querySelectorAll('button,[onclick]')].some(e=>e.offsetParent && /요청|홈|둘러/.test(e.textContent));
      });
      chk('막힌 화면에도 갈 길이 있음', way, 'true');
    }
    errs.push(...p._errs.map(e=>tag+': '+e));
    await p.close();
  }

  console.log(log.join('\n'));
  console.log(errs.length ? '❌ '+errs.length+'건 실패: '+errs.join(', ') : '✅ 전체 통과');
  await b.close();
  process.exit(errs.length?1:0);
})();
