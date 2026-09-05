const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
const U={id:'u1',user_metadata:{name:'김철수',role:'buyer'}};
(async()=>{const b=await chromium.launch();const log=[],errs=[];
 const chk=(n,g,w)=>{const ok=String(g)===String(w);log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w));if(!ok)errs.push(n);};

 log.push('1. Supabase 자체가 안 뜰 때 (CDN 실패)');
 const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
 p.on('pageerror',e=>errs.push('cdn: '+e.message.slice(0,60)));
 await p.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});
 await p.waitForTimeout(3200);
 chk('안내 띠 표시', await p.evaluate(()=>!!document.getElementById('net-bar')), 'true');
 chk('안내 문구', await p.evaluate(()=>document.querySelector('#net-bar span').textContent), '서버에 연결할 수 없습니다. 목록이 비어 보일 수 있습니다.');
 chk('다시 시도 버튼', await p.evaluate(()=>!!document.querySelector('.net-retry')), 'true');
 chk('하단 네비 안 가림', await p.evaluate(()=>{
   const n=document.getElementById('net-bar').getBoundingClientRect();
   const v=document.querySelector('.bnav').getBoundingClientRect();
   return n.bottom<=v.top+1; }), 'true');
 await p.evaluate(()=>go('reqs')); await p.waitForTimeout(900);
 const t1=await p.evaluate(()=>document.getElementById('rq-list-full').textContent.replace(/\s+/g,' ').trim());
 log.push('  요청 목록: '+t1.slice(0,50));
 chk('"비었다"가 아니라 "못 불러왔다"', /불러오지 못했습니다/.test(t1), 'true');
 chk('빈 목록 문구 안 나옴', /아직 요청이 없어요/.test(t1), 'false');
 await p.evaluate(()=>go('suppliers')); await p.waitForTimeout(900);
 chk('업체 목록도 동일', await p.evaluate(()=>/불러오지 못했습니다/.test(document.getElementById('sup-full').textContent)), 'true');
 await p.evaluate(()=>go('jobs')); await p.waitForTimeout(1100);
 chk('구인구직도 동일', await p.evaluate(()=>/불러오지 못했습니다/.test(document.getElementById('job-full').textContent)), 'true');
 await p.evaluate(()=>go('h')); await p.waitForTimeout(900);
 await p.screenshot({path:'off-bar.png'});
 await p.close();

 log.push('2. 정상 연결이면 안내가 안 떠야');
 const q=await b.newPage({viewport:{width:390,height:844}});
 q.on('pageerror',e=>errs.push('ok: '+e.message.slice(0,60)));
 await q.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify({user:U,realtime:true})+");");
 await q.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});
 await q.waitForTimeout(3200);
 chk('안내 띠 없음', await q.evaluate(()=>!document.getElementById('net-bar')), 'true');
 await q.evaluate(()=>go('reqs')); await q.waitForTimeout(900);
 chk('요청 정상 표시', await q.evaluate(()=>document.querySelectorAll('#rq-list-full .rc-list > *').length>0), 'true');

 log.push('3. 데이터가 진짜 0건이면 "비었다"가 맞아야');
 const e0=await b.newPage({viewport:{width:390,height:844}});
 e0.on('pageerror',e=>errs.push('empty: '+e.message.slice(0,60)));
 await e0.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify({user:null,realtime:true,emptyTables:['purchase_requests','suppliers','jobs']})+");");
 await e0.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});
 await e0.waitForTimeout(3200);
 chk('안내 띠 없음', await e0.evaluate(()=>!document.getElementById('net-bar')), 'true');
 await e0.evaluate(()=>go('reqs')); await e0.waitForTimeout(900);
 const t3=await e0.evaluate(()=>document.getElementById('rq-list-full').textContent);
 chk('빈 상태 문구 유지', /아직 요청이 없어요|등록된 요청이 없/.test(t3), 'true');
 chk('연결 실패 문구 안 나옴', /불러오지 못했습니다/.test(t3), 'false');

 log.push('4. 오프라인 전환');
 const ctx=q.context();
 await ctx.setOffline(true);
 await q.evaluate(()=>window.dispatchEvent(new Event('offline'))); await q.waitForTimeout(600);
 chk('오프라인 안내', await q.evaluate(()=>{const e=document.querySelector('#net-bar span');return e?e.textContent:'(없음)';}), '인터넷이 끊겼습니다. 연결을 확인해주세요.');
 await ctx.setOffline(false);
 await q.evaluate(()=>window.dispatchEvent(new Event('online'))); await q.waitForTimeout(1600);
 chk('복구되면 사라짐', await q.evaluate(()=>!document.getElementById('net-bar')), 'true');

 log.push('5. 카카오 로그인');
 chk('준비중 alert 제거', await q.evaluate(()=>!/준비 중입니다/.test(String(window.authKakao))), 'true');
 chk('Supabase OAuth 호출', await q.evaluate(()=>/signInWithOAuth/.test(String(window.authKakao))), 'true');
 const kk = await q.evaluate(async()=>{
   let called=null;
   const c=GORI.client&&GORI.client();
   const sb=window.__sbForTest||null;
   // 가짜 클라이언트에 signInWithOAuth 를 심어 호출 여부를 확인합니다
   const real=window.supabase.createClient;
   window.supabase.createClient=function(){ const o=real.apply(this,arguments);
     o.auth.signInWithOAuth=function(a){ called=a; return Promise.resolve({error:null}); }; return o; };
   return 'stub-ready';
 });
 chk('설정 안 됐을 때 안내', await q.evaluate(async()=>{
   const c=GORI.client();
   const orig=c.auth.signInWithOAuth;
   c.auth.signInWithOAuth=()=>Promise.resolve({error:{message:'Unsupported provider: provider is not enabled'}});
   openModal('login'); await new Promise(r=>setTimeout(r,200));
   await authKakao(); await new Promise(r=>setTimeout(r,300));
   const m=document.getElementById('login-msg').textContent;
   c.auth.signInWithOAuth=orig; return m;
 }), '카카오 로그인이 아직 켜져 있지 않습니다. 이메일로 로그인해주세요.');
 chk('리다이렉트 주소', await q.evaluate(async()=>{
   const c=GORI.client(); let opts=null;
   const orig=c.auth.signInWithOAuth;
   c.auth.signInWithOAuth=(a)=>{opts=a;return Promise.resolve({error:null});};
   await authKakao(); c.auth.signInWithOAuth=orig;
   return opts && opts.provider+'|'+/index\.html/.test(opts.options.redirectTo);
 }), 'kakao|true');

 console.log(log.join('\n'));
 console.log('\n오류: '+(errs.length?'\n  '+errs.join('\n  '):'없음'));
 console.log(errs.length?'\n❌ 실패 '+errs.length+'건':'\n✅ 전체 통과');
 await b.close();})();
