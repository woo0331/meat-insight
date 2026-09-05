const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs');
const STUB=(rows)=>`window.supabase={createClient:function(){return {
  auth:{ getSession:()=>Promise.resolve({data:{session:{user:{email:"a@x.com"}}}}),
         signInWithPassword:()=>Promise.resolve({data:{user:{email:"a@x.com"}},error:null}),
         signOut:()=>Promise.resolve({}) },
  from:function(t){
    var api={ select:()=>api, eq:()=>api, order:()=>api, limit:()=>api,
      then:function(res){ return Promise.resolve({data:(${JSON.stringify(rows)})[t]||[],error:null}).then(res); } };
    return api; }
};}};`;
const ROWS={
  suppliers:[
    {id:'s1',name:'합신식 도축장',region:'경기 포천시',categories:['도축장'],rating:4.9,is_verified:true,contact:'031-000-0000',created_at:'2026-08-01'},
    {id:'s2',name:'전국냉장물류',region:'경기 화성시',categories:['냉장물류'],rating:4.6,is_verified:true,contact:'031-111-1111',created_at:'2026-08-02'},
    {id:'s3',name:'대성기계',region:'대구 북구',categories:['기자재·장비'],rating:0,is_verified:false,contact:'053-222-2222',created_at:'2026-08-03'}],
  purchase_requests:[],quotes:[],orders:[],verifications:[],day_jobs:[],reviews:[],market_prices:[],admins:[{email:'a@x.com'}]
};
(async()=>{const b=await chromium.launch();const log=[],errs=[];
 const chk=(n,g,w)=>{const ok=String(g)===String(w);log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w));if(!ok)errs.push(n);};
 const p=await b.newPage({viewport:{width:1280,height:900},deviceScaleFactor:2});
 p.on('pageerror',e=>errs.push(e.message.slice(0,70)));
 await p.addInitScript(STUB(ROWS));
 await p.goto('file:///home/user/meat-insight/admin.html',{waitUntil:'load'});
 await p.waitForTimeout(1800);
 chk('관리자 세션으로 진입', await p.evaluate(()=>document.getElementById('app').style.display), 'block');
 await p.evaluate(()=>go('sup')); await p.waitForTimeout(900);
 chk('검색칸 생김', await p.evaluate(()=>!!document.querySelector('.tfind')), 'true');
 chk('전체 건수 표시(초기)', await p.evaluate(()=>document.querySelectorAll('#view tbody tr').length), 3);
 await p.evaluate(()=>{const e=document.querySelector('.tfind');e.value='물류';e.dispatchEvent(new Event('input'));});
 await p.waitForTimeout(300);
 chk('검색 결과', await p.evaluate(()=>{const v=[...document.querySelectorAll('#view tbody tr')].filter(r=>r.style.display!=='none');
   return v.length===1 && /전국냉장물류/.test(v[0].textContent);}), 'true');
 chk('건수 안내', await p.evaluate(()=>document.querySelector('.tcount').textContent), '1 / 3건');
 await p.evaluate(()=>{const e=document.querySelector('.tfind');e.value='포천 도축';e.dispatchEvent(new Event('input'));});
 await p.waitForTimeout(300);
 chk('여러 단어 AND', await p.evaluate(()=>[...document.querySelectorAll('#view tbody tr')].filter(r=>r.style.display!=='none').length), 1);
 await p.evaluate(()=>{const e=document.querySelector('.tfind');e.value='zzz';e.dispatchEvent(new Event('input'));});
 await p.waitForTimeout(300);
 chk('결과 없음 안내', await p.evaluate(()=>!!document.querySelector('.tnone')), 'true');
 await p.evaluate(()=>{const e=document.querySelector('.tfind');e.value='';e.dispatchEvent(new Event('input'));});
 await p.waitForTimeout(300);
 chk('지우면 복구', await p.evaluate(()=>[...document.querySelectorAll('#view tbody tr')].filter(r=>r.style.display!=='none').length), 3);
 chk('안내 사라짐', await p.evaluate(()=>!document.querySelector('.tnone')), 'true');
 await p.screenshot({path:'adm-find.png'});
 console.log(log.join('\n'));
 console.log('\n오류: '+(errs.length?'\n  '+errs.join('\n  '):'없음'));
 console.log(errs.length?'\n❌ 실패 '+errs.length+'건':'\n✅ 전체 통과');
 await b.close();})();
