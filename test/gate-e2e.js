const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
const PAGES=['dashboard.html','suppliers.html','purchase_request.html','jobs.html'];
(async()=>{const b=await chromium.launch();const log=[],errs=[];
 const chk=(n,g,w)=>{const ok=String(g)===String(w);log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w));if(!ok)errs.push(n);};

 log.push('1. 로그인 전에는 화면과 삭제 버튼이 안 보여야');
 for(const f of PAGES){
   const p=await b.newPage({viewport:{width:1280,height:900}});
   p.on('pageerror',e=>errs.push(f+': '+e.message));
   await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify({user:null})+");");
   await p.goto('file:///home/user/meat-insight/'+f,{waitUntil:'load'});
   await p.waitForTimeout(1600);
   const r=await p.evaluate(()=>({
     gate:!!document.getElementById('ag-gate'),
     gateVisible:(()=>{const g=document.getElementById('ag-gate');
        return !!g && g.getBoundingClientRect().height>200 && getComputedStyle(g).display!=='none';})(),
     inputs:document.querySelectorAll('#ag-gate input').length,
     locked:document.documentElement.classList.contains('ag-lock'),
     visible:[...document.body.children].filter(e=>e.id!=='ag-gate')
        .some(e=>e.getBoundingClientRect().height>0),
     del:[...document.querySelectorAll('button,a')].filter(e=>/삭제/.test(e.textContent))
        .filter(e=>e.getBoundingClientRect().height>0).length
   }));
   chk(f+' 게이트 표시', r.gate, 'true');
   chk(f+' 게이트가 실제로 보임', r.gateVisible, 'true');
   chk(f+' 로그인 입력칸', r.inputs, 2);
   chk(f+' 본문 가려짐', r.visible, 'false');
   chk(f+' 보이는 삭제 버튼', r.del, 0);
   await p.close();
 }
 const p=await b.newPage({viewport:{width:1280,height:900},deviceScaleFactor:2});
 await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify({user:null})+");");
 await p.goto('file:///home/user/meat-insight/suppliers.html',{waitUntil:'load'});
 await p.waitForTimeout(1600);
 await p.screenshot({path:'gate-locked.png'});

 
 // 케이스별로 supabase 를 초기 스크립트에서 주입합니다 (reload 로 날아가지 않도록)
 async function withStub(stub){
   const q=await b.newPage({viewport:{width:1280,height:900}});
   q.on('pageerror',e=>errs.push('stub: '+e.message));
   await q.addInitScript(stub);
   await q.goto('file:///home/user/meat-insight/suppliers.html',{waitUntil:'load'});
   await q.waitForTimeout(1500);
   return q;
 }
 const STUB=(sessionUser,loginResult,adminRows)=>`
   window.supabase={createClient:function(){return {
     auth:{
       getSession:function(){return Promise.resolve({data:{session:${sessionUser?`{user:{email:"${sessionUser}"}}`:'null'}}});},
       signInWithPassword:function(){return Promise.resolve(${loginResult});}
     },
     from:function(){return {select:function(){return {eq:function(){return {limit:function(){
       return Promise.resolve({data:${JSON.stringify(adminRows)},error:null});}};}};}};}
   };}};`;

 log.push('2. 잘못된 로그인은 통과하지 못해야');
 let p2=await withStub(STUB(null,'{error:{message:"Invalid login credentials"}}',[]));
 await p2.evaluate(()=>{document.getElementById('ag-e').value='x@x.com';document.getElementById('ag-p').value='nope';document.getElementById('ag-b').click();});
 await p2.waitForTimeout(800);
 chk('실패 안내', await p2.evaluate(()=>document.getElementById('ag-m').textContent), '로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.');
 chk('여전히 잠김', await p2.evaluate(()=>document.documentElement.classList.contains('ag-lock')), 'true');
 await p2.close();

 log.push('3. 로그인은 되지만 관리자가 아니면 거부');
 let p3=await withStub(STUB(null,'{data:{user:{email:"notadmin@x.com"}},error:null}',[]));
 await p3.evaluate(()=>{document.getElementById('ag-e').value='notadmin@x.com';document.getElementById('ag-p').value='pw';document.getElementById('ag-b').click();});
 await p3.waitForTimeout(800);
 chk('비관리자 거부', await p3.evaluate(()=>document.getElementById('ag-m').textContent), '관리자로 등록된 계정이 아닙니다.');
 chk('여전히 잠김', await p3.evaluate(()=>document.documentElement.classList.contains('ag-lock')), 'true');
 chk('본문 여전히 가려짐', await p3.evaluate(()=>[...document.body.children].filter(e=>e.id!=='ag-gate').some(e=>e.getBoundingClientRect().height>0)), 'false');
 await p3.close();

 log.push('4. 관리자로 로그인하면 열려야');
 let p4=await withStub(STUB(null,'{data:{user:{email:"admin@x.com"}},error:null}',[{email:'admin@x.com'}]));
 chk('로그인 전 잠김', await p4.evaluate(()=>document.documentElement.classList.contains('ag-lock')), 'true');
 await p4.evaluate(()=>{document.getElementById('ag-e').value='admin@x.com';document.getElementById('ag-p').value='pw';document.getElementById('ag-b').click();});
 await p4.waitForTimeout(900);
 chk('잠금 해제', await p4.evaluate(()=>!document.documentElement.classList.contains('ag-lock')), 'true');
 chk('게이트 제거', await p4.evaluate(()=>!document.getElementById('ag-gate')), 'true');
 chk('본문 보임', await p4.evaluate(()=>[...document.body.children].some(e=>e.getBoundingClientRect().height>0)), 'true');
 await p4.screenshot({path:'gate-open.png'});
 await p4.close();

 log.push('5. 이미 로그인된 관리자는 바로 통과');
 let p5=await withStub(STUB('admin@x.com','{error:null}',[{email:'admin@x.com'}]));
 chk('세션으로 자동 통과', await p5.evaluate(()=>!document.documentElement.classList.contains('ag-lock')), 'true');
 await p5.close();

 log.push('6. robots / sitemap');
 const rb=fs.readFileSync('/home/user/meat-insight/robots.txt','utf8');
 ['dashboard.html','suppliers.html','purchase_request.html','jobs.html','admin.html'].forEach(f=>
   chk('robots 차단 '+f, rb.includes('Disallow: /'+f), 'true'));
 const sm=fs.readFileSync('/home/user/meat-insight/sitemap.xml','utf8');
 chk('sitemap 에 관리 화면 없음', /suppliers\.html|jobs\.html|dashboard\.html/.test(sm), 'false');

 console.log(log.join('\n'));
 console.log('\n오류: '+(errs.length?'\n  '+errs.join('\n  '):'없음'));
 console.log(errs.length?'\n❌ 실패 '+errs.length+'건':'\n✅ 전체 통과');
 await b.close();})();
