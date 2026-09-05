const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'); const FAKE=fs.readFileSync('./fake-sb.js','utf8');
const USER={id:'u-new',email:'new@test.com',user_metadata:{name:'박사장',role:'supplier'}};

// 테스트용 이미지 (2000px 짜리 큰 PNG 를 만들어 리사이즈 동작 확인)
const BIG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==','base64');

(async()=>{
  const b=await chromium.launch(); const log=[], errs=[];
  const p=await b.newPage({viewport:{width:390,height:1400},deviceScaleFactor:2});
  await p.addInitScript(FAKE+"\nwindow.__FAKE_INIT("+JSON.stringify({user:USER})+");");
  p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});
  await p.waitForTimeout(2200);

  await p.evaluate(()=>go('sj')); await p.waitForTimeout(600);
  log.push("1. STEP1 진입: "+await p.evaluate(()=>document.querySelectorAll('.gstep-i').length)+"단계 표시 / 현재 "+await p.evaluate(()=>GORI.OB.step));

  // 필수 누락
  await p.evaluate(()=>gObNext(1)); await p.waitForTimeout(300);
  log.push("   필수 누락 차단: "+await p.evaluate(()=>GORI.OB.step===1));

  await p.fill('#ob-name','안성한우도축'); await p.fill('#ob-tel','031-777-8888');
  await p.fill('#ob-rep','박사장');
  await p.selectOption('#ob-region','경기');
  await p.evaluate(()=>gObNext(1)); await p.waitForTimeout(500);
  log.push("2. STEP2: 분야칩 "+await p.evaluate(()=>document.querySelectorAll('#ob-cats .gpick-i').length)+"개");
  await p.evaluate(()=>gObNext(2)); await p.waitForTimeout(300);
  log.push("   분야 미선택 차단: "+await p.evaluate(()=>GORI.OB.step===2));
  await p.evaluate(()=>{ document.querySelectorAll('#ob-cats .gpick-i')[0].click();
                         document.querySelectorAll('#ob-cats .gpick-i')[1].click(); });
  await p.fill('#ob-items','한우 지육, 한돈 지육'); await p.fill('#ob-svc','도축, 발골, 정형');
  await p.fill('#ob-minq','1두~'); await p.fill('#ob-lead','당일');
  await p.evaluate(()=>gObNext(2)); await p.waitForTimeout(500);

  // STEP3 사업자번호 검증
  await p.fill('#ob-brn','123-45-67890');
  await p.evaluate(()=>gObNext(3)); await p.waitForTimeout(400);
  log.push("3. 잘못된 사업자번호 차단: "+await p.evaluate(()=>GORI.OB.step===3)
    +" / "+await p.evaluate(()=>document.getElementById('ob-msg3').textContent.slice(0,22)));
  await p.fill('#ob-brn','220-81-62517'); await p.fill('#ob-permit','경기-2026-0031');
  await p.fill('#ob-haccp','HACCP-2026-777');
  await p.evaluate(()=>gObNext(3)); await p.waitForTimeout(600);

  // STEP4 사진 업로드
  log.push("4. STEP4 진입: "+await p.evaluate(()=>GORI.OB.step===4));
  const tmp='/tmp/claude-0/-home-user-meat-insight/0248f1cb-d8bf-5134-a6d0-62471eee6602/scratchpad/t.png';
  fs.writeFileSync(tmp, BIG);
  await p.setInputFiles('#ob-file',[tmp,tmp]);
  await p.waitForTimeout(1500);
  log.push("   사진 업로드: "+await p.evaluate(()=>(window.__UPLOADS||[]).length)+"건 / 미리보기 "
    +await p.evaluate(()=>document.querySelectorAll('.ph-c').length)+"칸");
  log.push("   업로드 형식: "+await p.evaluate(()=>JSON.stringify((window.__UPLOADS||[]).map(u=>u.type))));
  await p.fill('#ob-intro','한우 도축·발골 전문. 당일 출고 가능합니다.');
  await p.fill('#ob-note','한우 지육 당일 출고 · 경기 무료배송');
  await p.screenshot({path:'ob-step4.png',fullPage:true});

  await p.evaluate(()=>gObSubmit()); await p.waitForTimeout(2000);
  const saved=await p.evaluate(()=>{const s=window.__DB.suppliers.slice(-1)[0];
    return {name:s.name,mains:s.category_mains,items:s.items,imgs:(s.images||[]).length,
            instant:s.instant_quote,brn:s.brn,region:s.region};});
  log.push("5. 저장된 업체: "+JSON.stringify(saved));
  log.push("   인증 자동 신청: "+await p.evaluate(()=>window.__DB.verifications.filter(v=>v.target_id===String(window.__DB.suppliers.slice(-1)[0].id)).map(v=>v.kind).join(', ')));
  log.push("   알림 설정 저장: "+await p.evaluate(()=>{const s=window.__DB.suppliers.slice(-1)[0];
    const p2=window.__DB.supplier_prefs.find(x=>String(x.supplier_id)===String(s.id));
    return p2?JSON.stringify({cats:p2.category_mains,regions:p2.regions}):'(없음)';}));
  log.push("   완료 화면: "+await p.evaluate(()=>!!document.querySelector('.ob-ok')));
  await p.screenshot({path:'ob-done.png',fullPage:true});

  // 버킷 없을 때
  await p.evaluate(()=>{ window.__NO_BUCKET=true; go('sj'); }); await p.waitForTimeout(500);
  await p.fill('#ob-name','테스트'); await p.fill('#ob-tel','010');
  await p.evaluate(()=>gObNext(1)); await p.waitForTimeout(300);
  await p.evaluate(()=>{ document.querySelectorAll('#ob-cats .gpick-i')[0].click(); gObNext(2); }); await p.waitForTimeout(300);
  await p.evaluate(()=>gObNext(3)); await p.waitForTimeout(400);
  await p.setInputFiles('#ob-file',[tmp]); await p.waitForTimeout(1200);
  log.push("6. 버킷 없을 때 안내: "+await p.evaluate(()=>document.getElementById('ob-msg-ph').textContent.slice(0,34))
    +" / 사진칸 "+await p.evaluate(()=>document.querySelectorAll('.ph-c').length));

  console.log(log.join("\n"));
  console.log(errs.length?"\n⚠️ "+[...new Set(errs)].join("\n"):"\n✅ 에러 없음");
  await b.close();
})();
