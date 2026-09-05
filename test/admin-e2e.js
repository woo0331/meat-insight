const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
(async()=>{
  const b=await chromium.launch(); const log=[], errs=[];
  const p=await b.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:2});
  await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT({});");
  p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file:///home/user/meat-insight/admin.html',{waitUntil:'load'});
  await p.waitForTimeout(700);

  // 1) 비관리자 차단
  await p.fill('#lg-email','kim@test.com'); await p.fill('#lg-pw','pw');
  await p.click('#lg-btn'); await p.waitForTimeout(700);
  log.push("1. 비관리자 로그인 차단: "+ (await p.evaluate(()=>document.getElementById('app').style.display==='none'))
    +" / 메시지: "+await p.evaluate(()=>document.getElementById('lg-msg').textContent.slice(0,30)));

  // 2) 관리자 로그인
  await p.fill('#lg-email','admin@test.com'); await p.fill('#lg-pw','pw');
  await p.click('#lg-btn'); await p.waitForTimeout(900);
  log.push("2. 관리자 로그인: "+await p.evaluate(()=>document.getElementById('app').style.display==='block')
    +" / 탭 "+await p.evaluate(()=>document.querySelectorAll('.tab').length)+"개");
  log.push("   대시보드 KPI: "+await p.evaluate(()=>[...document.querySelectorAll('.kpi')].map(e=>e.textContent.trim().replace(/\s+/g,' ')).join(' | ')));
  log.push("   알림 배너: "+await p.evaluate(()=>[...document.querySelectorAll('.note b')].map(e=>e.textContent).join(' / ')||'(없음)'));
  await p.screenshot({path:'admin-dash.png',fullPage:true});

  // 3) 인증 심사 → 승인
  await p.evaluate(()=>go('verify')); await p.waitForTimeout(700);
  log.push("3. 인증 심사 목록: "+await p.evaluate(()=>document.querySelectorAll('tbody tr').length)+"건");
  await p.evaluate(()=>{ window.confirm=()=>true; });
  await p.evaluate(()=>approve('v1','brn','s2')); await p.waitForTimeout(900);
  const sup2=await p.evaluate(()=>{const s=window.__DB.suppliers.find(x=>x.id==='s2');return {brn:s.brn_verified,vf:s.is_verified}});
  log.push("   승인 후 verifications: "+await p.evaluate(()=>window.__DB.verifications.find(v=>v.id==='v1').status)
    +" / suppliers s2 → "+JSON.stringify(sup2));
  await p.screenshot({path:'admin-verify.png',fullPage:true});

  // 4) 시세 입력
  await p.evaluate(()=>go('market')); await p.waitForTimeout(700);
  await p.fill('#m-item','한우 지육'); await p.fill('#m-grade','1++');
  await p.fill('#m-price','23800'); await p.fill('#m-chg','-400');
  await p.evaluate(()=>addPrice()); await p.waitForTimeout(1000);
  const mp=await p.evaluate(()=>{const m=window.__DB.market_prices.slice(-1)[0];return {item:m.item,g:m.grade,p:m.price,c:m.change}});
  log.push("4. 시세 입력: "+JSON.stringify(mp));
  await p.screenshot({path:'admin-market.png',fullPage:true});

  // 5) 나머지 탭 렌더
  const tabs=['sup','req','quote','order','daily','review'];
  for(const t of tabs){ await p.evaluate(x=>go(x),t); await p.waitForTimeout(450);
    const n=await p.evaluate(()=>document.getElementById('view').innerHTML.length);
    if(n<120) errs.push("탭 "+t+" 비어있음 ("+n+")"); }
  log.push("5. 전체 탭 렌더 확인 완료");

  // 6) 거래 상태 변경
  await p.evaluate(()=>go('order')); await p.waitForTimeout(600);
  const hasOrder=await p.evaluate(()=>document.querySelectorAll('tbody tr select').length>0);
  log.push("6. 거래 상태 셀렉트: "+(hasOrder?"있음":"거래 없음(정상)"));

  errs.push(...(errs.length?[]:[]));
  console.log(log.join("\n"));
  console.log(errs.length?"\n⚠️ "+[...new Set(errs)].join("\n"):"\n✅ 에러 없음");
  await b.close();
})();
