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
 await q.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify({user:U,realtime:true})+");"
   /* 이 검사는 "비었다"와 "못 불러왔다"를 구분합니다 —
      예시 데이터(39_demo)가 빈 자리를 채우면 구분이 안 되므로 끕니다.
      예시 데이터는 test/demo-e2e.js 가 따로 검사합니다. */
   +"\nwindow.GORI_FEATURES=Object.assign({},window.GORI_FEATURES,{demo:false});"
   +"\nwindow.addEventListener('DOMContentLoaded',function(){window.GORI_FEATURES.demo=false;});");
 await q.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});
 await q.waitForTimeout(3200);
 chk('안내 띠 없음', await q.evaluate(()=>!document.getElementById('net-bar')), 'true');
 await q.evaluate(()=>go('reqs')); await q.waitForTimeout(900);
 chk('요청 정상 표시', await q.evaluate(()=>document.querySelectorAll('#rq-list-full .rc-list > *').length>0), 'true');

 log.push('3. 데이터가 진짜 0건이면 "비었다"가 맞아야');
 const e0=await b.newPage({viewport:{width:390,height:844}});
 e0.on('pageerror',e=>errs.push('empty: '+e.message.slice(0,60)));
 await e0.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify({user:null,realtime:true,emptyTables:['purchase_requests','suppliers','jobs']})+");"
   /* 이 검사는 "비었다"와 "못 불러왔다"를 구분합니다 —
      예시 데이터(39_demo)가 빈 자리를 채우면 구분이 안 되므로 끕니다.
      예시 데이터는 test/demo-e2e.js 가 따로 검사합니다. */
   +"\nwindow.GORI_FEATURES=Object.assign({},window.GORI_FEATURES,{demo:false});"
   +"\nwindow.addEventListener('DOMContentLoaded',function(){window.GORI_FEATURES.demo=false;});");
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

 /* ── 서버에 붙긴 했는데 읽을 권한이 없을 때 ──────────────────────────
    RLS 가 anon 의 select 를 막거나 anon 키가 틀리면 42501 · PGRST301 ·
    401 이 옵니다. 예전에는 이걸 "서버에 연결할 수 없습니다" 로 뭉뚱그려서
    두 가지가 잘못됐습니다 — 서버는 멀쩡한데 못 붙었다고 거짓말을 했고,
    "다시 시도" 를 눌러도 영영 안 되는데 버튼을 줬습니다.
    무엇을 고쳐야 하는지는 운영자에게만 콘솔로 말합니다. */
 log.push('5. 권한·키 문제는 "연결 실패" 와 다르게 말한다');
 const openErr=async(inject)=>{
   const z=await b.newPage({viewport:{width:1440,height:900}});
   z._warns=[]; z.on('console',m=>{ if(m.type()==='warning') z._warns.push(m.text()); });
   await z.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+inject+")");
   await z.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});
   await z.waitForTimeout(4200);
   return z;
 };
 for(const [nm,inject] of [
   ['RLS 차단',  "{errorAll:{code:'42501',message:'permission denied for table purchase_requests'}}"],
   ['키 오류',   "{errorAll:{message:'Invalid API key'}}"],
 ]){
   const z=await openErr(inject);
   chk(nm+' — 띠는 뜬다', await z.evaluate(()=>!!document.getElementById('net-bar')), 'true');
   chk(nm+' — "연결할 수 없다"고 안 한다', await z.evaluate(()=>
     /연결할 수 없습니다/.test((document.querySelector('#net-bar span')||{}).textContent||'')), 'false');
   chk(nm+' — 소용없는 "다시 시도" 없음', await z.evaluate(()=>
     !!document.querySelector('.net-retry')), 'false');
   chk(nm+' — 운영자에게는 콘솔로', z._warns.some(t=>/권한이 없습니다/.test(t)), 'true');
   chk(nm+' — 손님에게 SQL·RLS 안 보임', await z.evaluate(()=>
     /RLS|\.sql|anon|42501/i.test(document.body.innerText)), 'false');
   await z.close();
 }
 /* 진짜 연결 실패는 예전 그대로 — 다시 시도 버튼이 있어야 합니다 */
 const z2=await openErr("{errorAll:{message:'Failed to fetch'}}");
 chk('연결 실패는 예전대로', await z2.evaluate(()=>{
   const bar=document.getElementById('net-bar');
   return !!bar && /연결할 수 없습니다/.test(bar.textContent) && !!bar.querySelector('.net-retry');
 }), 'true');
 await z2.close();

 /* ── 검색칸이 아이디 칸으로 안 보이는가 ──────────────────────────────
    이 페이지에는 로그인 창(type=password)이 DOM 에 함께 있어서, 크롬
    비밀번호 관리자가 그 앞의 첫 글자칸을 아이디 칸으로 보고 저장해 둔 값을
    넣었습니다 — 실제로 히어로 검색창에 "admin" 이 채워져 있었습니다.
    autocomplete="off" 만으로는 안 막힙니다. */
 log.push('6. 검색칸에 저장된 아이디가 안 들어가게');
 const s1=await b.newPage({viewport:{width:1440,height:900}});
 await s1.addInitScript(FAKE+"\nwindow.__FAKE_INIT({})");
 await s1.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});
 await s1.waitForTimeout(3200);
 chk('히어로 검색칸', await s1.evaluate(()=>{
   const i=document.getElementById('hs-input');
   return i.type+'|'+(i.name?'name있음':'name없음')+'|'+i.getAttribute('autocomplete');
 }), 'search|name있음|off');
 chk('목록 거르기 칸도', await s1.evaluate(async()=>{
   go('suppliers'); await new Promise(r=>setTimeout(r,900));
   const i=document.querySelector('.gflt-in');
   return i ? (i.type+'|'+(i.name?'name있음':'name없음')) : '(칸 없음)';
 }), 'search|name있음');
 chk('검색은 그대로 동작', await s1.evaluate(async()=>{
   go('h'); await new Promise(r=>setTimeout(r,400));
   const i=document.getElementById('hs-input'); i.value='돼지고기'; heroGo();
   await new Promise(r=>setTimeout(r,600));
   return !document.getElementById('pg-h').classList.contains('on');
 }), 'true');
 await s1.close();

 console.log(log.join('\n'));
 console.log('\n오류: '+(errs.length?'\n  '+errs.join('\n  '):'없음'));
 console.log(errs.length?'\n❌ 실패 '+errs.length+'건':'\n✅ 전체 통과');
 await b.close();})();
