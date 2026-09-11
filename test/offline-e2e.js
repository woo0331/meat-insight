const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
const U={id:'u1',user_metadata:{name:'김철수',role:'buyer'}};
(async()=>{const b=await chromium.launch();const log=[],errs=[];
 const chk=(n,g,w)=>{const ok=String(g)===String(w);log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w));if(!ok)errs.push(n);};

 /* ⚠️ 예전에는 이 검사가 "환경에서 jsdelivr 이 막혀 있다" 에 기대고 있었습니다.
    라이브러리를 vendor/ 로 옮긴 뒤로는 그냥 열면 멀쩡히 뜨므로, 못 받는 상황을
    **직접 막아서** 만들어야 합니다 — vendor 와 예비 CDN 을 둘 다 끊습니다.
    이게 실제로 일어나면(파일이 안 올라갔다든가) 사이트 전체가 멈추므로,
    그때 무엇이 보이는지가 이 검사의 핵심입니다. */
 log.push('1. Supabase 자체가 안 뜰 때 (라이브러리 로드 실패)');
 const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
 p.on('pageerror',e=>errs.push('cdn: '+e.message.slice(0,60)));
 p._warns=[]; p.on('console',m=>{ if(m.type()==='warning') p._warns.push(m.text()); });
 await p.route('**/vendor/supabase-js*.js',r=>r.abort());
 await p.route('**/cdn.jsdelivr.net/npm/@supabase/**',r=>r.abort());
 await p.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});
 await p.waitForTimeout(3200);
 chk('라이브러리가 정말 안 떴다', await p.evaluate(()=>typeof window.supabase==='undefined'), 'true');
 chk('운영자에게 원인을 말해준다',
   p._warns.some(t=>/라이브러리가 안 떴습니다/.test(t)), 'true');
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

 /* ── 목록이 보이는데 "연결 안 됨" 이라고 하면 안 된다 ──────────────────
    실제로 그랬습니다. 실시간 띠에 진짜 요청이 흐르고 있는데 화면 아래에는
    "서버에 연결할 수 없습니다" 가 붙어 있었습니다. 조회 **하나만** 실패해도
    사이트 전체에 띠를 붙이는 구조였기 때문입니다 — 알림·후기 같은 보조 표가
    없거나 RLS 로 막혀 있으면 요청·업체 목록은 멀쩡한데 띠가 떴습니다. */
 log.push('8. 보조 표가 막혀도 목록이 있으면 띠를 안 띄운다');
 const openW=async(inj)=>{
   const z=await b.newPage({viewport:{width:1440,height:950}});
   z._w=[]; z.on('console',m=>{ if(m.type()==='warning') z._w.push(m.text()); });
   z.on('dialog',d=>d.accept());
   await z.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+inj+")");
   await z.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});
   await z.waitForTimeout(4500);
   return z;
 };
 /* notifications · chat_rooms 는 로그인해야 조회됩니다 */
 const withUser=o=>o.replace(/^\{/,"{user:{id:'u1',email:'a@b.c'},");
 const state=z=>z.evaluate(()=>({
   req:(typeof REQS!=='undefined'?REQS.length:-1),
   sup:(typeof SUPS!=='undefined'?SUPS.length:-1),
   job:(typeof JOBS!=='undefined'?JOBS.length:-1),
   bar:!!document.getElementById('net-bar')
 }));
 const z3=await openW(withUser("{errorTables:{notifications:{code:'42501',message:'permission denied'},reviews:{code:'42501',message:'permission denied'},chat_rooms:{code:'42501',message:'permission denied'}}}"));
 const s3=await state(z3);
 chk('요청·업체 목록은 그대로', (s3.req>0 && s3.sup>0), 'true');
 chk('띠가 안 뜬다', s3.bar, 'false');
 /* 이 표들은 거래관리에 들어가야 조회됩니다 — 거기서도 띠가 안 떠야 합니다 */
 await z3.evaluate(()=>go('my')); await z3.waitForTimeout(2500);
 chk('거래관리에서도 띠 없음', await z3.evaluate(()=>!!document.getElementById('net-bar')), 'false');
 chk('어느 표가 실패했는지는 콘솔에',
   z3._w.some(t=>/조회가 실패했습니다/.test(t)), 'true');
 await z3.close();

 /* ── 오래된 스키마: 정렬 칸이 없어 400 이 나는 경우 ───────────────────
    index.html 의 loadFromDB 는 세 표를 .order("created_at") 로 가져옵니다.
    오래 전에 만든 표에 그 칸이 없으면 PostgREST 가 400 을 돌려주고 목록이
    통째로 비면서 "서버에 연결할 수 없습니다" 가 떴습니다 — 표는 멀쩡한데도.
    이제는 정렬 없이 다시 가져옵니다. 순서만 잃고 목록은 보입니다. */
 log.push('9. 정렬 칸이 없는 오래된 표도 목록은 보인다');
 for(const [nm,inj] of [
   ['업체 표만',  "{noSortTables:['suppliers']}"],
   ['세 표 모두', "{noSortTables:['purchase_requests','suppliers','jobs']}"],
 ]){
   const z=await openW(inj);
   const st=await state(z);
   chk(nm+' — 요청 보임', st.req>0, 'true');
   chk(nm+' — 업체 보임', st.sup>0, 'true');
   chk(nm+' — 구인 보임', st.job>0, 'true');
   chk(nm+' — 띠 없음', st.bar, 'false');
   await z.close();
 }
 /* 진짜로 아무것도 못 받으면 그때는 띠가 떠야 합니다 */
 const z4=await openW("{errorAll:{message:'Failed to fetch'}}");
 const s4=await state(z4);
 chk('정말 비었을 때는 띠가 뜬다', s4.bar, 'true');
 /* ⚠️ 예시 데이터가 켜져 있으면 배열은 차 있습니다. 그걸 "내용이 있다" 로
    세면 서버가 죽은 것을 "원래 잘 되고 있다" 로 보이게 만듭니다 —
    손님에게는 활발해 보이고 운영자는 장애를 못 봅니다. */
 chk('예시 데이터는 진짜로 안 센다', await z4.evaluate(()=>
   (typeof REQS!=='undefined'?REQS:[]).every(r=>String(r.id||'').indexOf('demo-')===0)), 'true');
 await z4.close();

 /* ── 라이브러리는 우리 도메인에서 나온다 ────────────────────────────
    예전에는 jsdelivr 한 줄이었습니다. 그게 막히거나 느리면 window.supabase 가
    안 생기고 sb=null 이 되어 **사이트 전체가** "서버에 연결할 수 없습니다" 가
    됩니다 — 로그인·요청·견적·업체 목록이 한꺼번에 죽는데 원인은 우리 서버도
    DB 도 아닙니다. 같은 도메인에서 내보내면 그 고리가 사라집니다. */
 log.push('7. Supabase 라이브러리는 우리 도메인에서');
 const fsx=require('fs');
 chk('vendor 파일이 있다', fsx.existsSync('/home/user/meat-insight/vendor/supabase-js-2.116.0.min.js'), 'true');
 const HTMLS=['index.html','meat_insight_main.html','admin.html','dashboard.html',
              'jobs.html','meat_insight_apply.html','purchase_request.html','suppliers.html'];
 chk('CDN 을 먼저 부르는 파일 없음', HTMLS.filter(f=>{
   const t=fsx.readFileSync('/home/user/meat-insight/'+f,'utf8');
   const v=t.indexOf('vendor/supabase-js'), c=t.indexOf('cdn.jsdelivr.net/npm/@supabase');
   return v<0 || (c>=0 && c<v);      /* vendor 가 없거나 CDN 이 먼저면 탈락 */
 }).join(','), '');
 /* 둘 다 "아직 없을 때만" 부릅니다 — 이미 있는 클라이언트를 덮어쓰지 않습니다.
    (덮어쓰면 테스트가 끼워 넣은 가짜가 죽습니다. 실제로 한 번 그랬습니다) */
 chk('있으면 안 덮어쓴다', HTMLS.filter(f=>{
   const t=fsx.readFileSync('/home/user/meat-insight/'+f,'utf8');
   const m=t.match(/window\.supabase\|\|document\.write/g)||[];
   return m.length<2;               /* vendor · CDN 둘 다 가드가 있어야 합니다 */
 }).join(','), '');
 const v1=await b.newPage({viewport:{width:1440,height:900}});
 v1._fail=[]; v1.on('requestfailed',r=>v1._fail.push(r.url()));
 await v1.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});
 await v1.waitForTimeout(2500);
 chk('라이브러리가 실제로 뜬다', await v1.evaluate(()=>
   typeof window.supabase!=='undefined' && typeof window.supabase.createClient==='function'), 'true');
 chk('클라이언트가 만들어진다', await v1.evaluate(()=>!!(typeof sb!=='undefined'&&sb)), 'true');
 chk('CDN 을 아예 안 부른다', v1._fail.concat([]).some(u=>/@supabase/.test(u)), 'false');
 /* 글꼴 CDN 이 막혀도 한글이 generic sans-serif 로 떨어지면 안 됩니다 */
 chk('글꼴 사슬에 시스템 한글 있음', await v1.evaluate(()=>{
   const f=getComputedStyle(document.documentElement).getPropertyValue('--font');
   return /Malgun Gothic|맑은 고딕/.test(f) && /Apple SD Gothic Neo/.test(f);
 }), 'true');
 chk('버튼·입력칸도 같은 사슬', await v1.evaluate(()=>{
   const btn=getComputedStyle(document.querySelector('.gbtn')||document.body).fontFamily;
   return /Pretendard/.test(btn);
 }), 'true');
 await v1.close();

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

 /* ⚠️ 진짜 원인은 **페이지에 <form> 이 하나도 없다는 것** 이었습니다.
    비밀번호칸 둘이 폼 밖에 떠 있으니 크롬이 문서 전체를 로그인 폼으로 보고,
    화면에 보이는 첫 글자칸(= 히어로 검색창)을 아이디 칸으로 골랐습니다.
    type="search" 로도 안 막혔습니다. 폼으로 감싸야 범위가 잡힙니다. */
 chk('비밀번호칸이 폼 안에 있다', await s1.evaluate(()=>{
   const bad=[...document.querySelectorAll('input[type=password]')]
     .filter(e=>!e.form).map(e=>e.id);
   return bad.join(',');
 }), '');
 chk('검색창은 그 폼 밖', await s1.evaluate(()=>
   !document.getElementById('hs-input').form), 'true');
 chk('아이디·비번 칸을 명시한다', await s1.evaluate(()=>
   (document.getElementById('l-email')||{}).getAttribute('autocomplete')+'|'+
   (document.getElementById('l-pw')||{}).getAttribute('autocomplete')), 'username|current-password');
 /* 자동완성이 걸리면 검색창만 비웁니다 — 사람이 친 글자는 안 건드립니다 */
 chk('자동완성 감지 장치', await s1.evaluate(()=>{
   const css=[...document.styleSheets].some(sh=>{
     try{ return [...sh.cssRules].some(r=>/gAutofillSeen/.test(r.cssText)); }catch(e){ return false; }
   });
   return css && !!document.getElementById('hs-input').__afGuard;
 }), 'true');

 /* 폼으로 감싸면서 제출 경로가 바뀌었습니다 — 로그인·가입이 그대로 되는지 */
 log.push('6-1. 로그인·가입은 그대로 (엔터로도)');
 chk('버튼으로 로그인', await s1.evaluate(async()=>{
   openModal('login'); await new Promise(r=>setTimeout(r,400));
   document.getElementById('l-email').value='a@b.c';
   document.getElementById('l-pw').value='pw123456';
   document.querySelector('#l-form button[type=submit]').click();
   await new Promise(r=>setTimeout(r,900));
   return !!document.querySelector('.hdr-user');
 }), 'true');
 await s1.close();

 const s2=await b.newPage({viewport:{width:1440,height:900}});
 await s2.addInitScript(FAKE+"\nwindow.__FAKE_INIT({})");
 await s2.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});
 await s2.waitForTimeout(3000);
 await s2.evaluate(async()=>{
   openModal('login'); await new Promise(r=>setTimeout(r,400));
   document.getElementById('l-email').value='a@b.c';
   const pw=document.getElementById('l-pw'); pw.value='pw123456'; pw.focus();
 });
 await s2.keyboard.press('Enter'); await s2.waitForTimeout(1000);
 chk('엔터로도 로그인', await s2.evaluate(()=>!!document.querySelector('.hdr-user')), 'true');
 chk('폼 제출로 새로고침 안 됨', await s2.evaluate(()=>!!document.getElementById('hs-input')), 'true');
 await s2.close();

 console.log(log.join('\n'));
 console.log('\n오류: '+(errs.length?'\n  '+errs.join('\n  '):'없음'));
 console.log(errs.length?'\n❌ 실패 '+errs.length+'건':'\n✅ 전체 통과');
 await b.close();})();
