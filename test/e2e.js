const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const FAKE = fs.readFileSync('/tmp/claude-0/-home-user-meat-insight/0248f1cb-d8bf-5134-a6d0-62471eee6602/scratchpad/fake-sb.js','utf8');

async function newPage(b, vp, initOpts){
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: 2 });
  await p.addInitScript(FAKE + "\nwindow.__FAKE_INIT(" + JSON.stringify(initOpts||{}) + ");");
  p.on('pageerror', e => { p._errs = p._errs || []; p._errs.push("PAGEERROR: " + e.message); });
  await p.goto('file:///home/user/meat-insight/index.html', { waitUntil:'load' });
  await p.waitForTimeout(900);
  return p;
}
const LOGIN = { id:'u1', email:'kim@test.com', user_metadata:{ name:'김철수', role:'buyer' } };

(async () => {
  const b = await chromium.launch();
  const log = [], errs = [];
  const D = {width:1440,height:1000}, M = {width:390,height:900};

  // ── 1. 로그인 상태 · 홈 ──
  let p = await newPage(b, D, { user: LOGIN });
  log.push("1. 헤더 로그인 표시: " + await p.evaluate(()=>document.querySelector('.hu-name')?.textContent || '(없음)'));
  log.push("   알림 배지: " + await p.evaluate(()=>document.querySelector('.hu-dot')?.textContent || '(없음)'));
  log.push("   실시간 요청 카드: " + await p.evaluate(()=>document.querySelectorAll('#rq-widget .rqc').length) + "개");
  log.push("   당일알바/구인구직 섹션: " + await p.evaluate(()=>!!document.getElementById('sec-labor')));
  await p.screenshot({ path:'p2-home.png', fullPage:true });

  // ── 2. 요청서 3단계 ──
  await p.evaluate(()=>go('rw')); await p.waitForTimeout(300);
  log.push("2. STEP1 카테고리 카드: " + await p.evaluate(()=>document.querySelectorAll('#rw-wizard .gcat-c').length) + "개");
  await p.evaluate(()=>gPickCat('meat')); await p.waitForTimeout(200);
  log.push("   소분류 노출: " + await p.evaluate(()=>document.querySelectorAll('#rw-subs .gpick-i').length) + "개");
  await p.screenshot({ path:'p2-step1.png', fullPage:true });
  await p.evaluate(()=>{ gPickSub2('소고기'); gStep2(); }); await p.waitForTimeout(300);
  log.push("   STEP2 입력 항목: " + await p.evaluate(()=>document.querySelectorAll('#rw-wizard .glabel').length) + "개");
  await p.screenshot({ path:'p2-step2.png', fullPage:true });
  // 필수 누락 검증
  await p.evaluate(()=>gStep3()); await p.waitForTimeout(250);
  log.push("   필수 누락 시 STEP3 차단: " + await p.evaluate(()=>GORI.W.step===2));
  // 채우고 진행
  await p.evaluate(()=>{
    document.querySelectorAll('#w-species .gpick-i')[0].click();
    document.querySelectorAll('#w-temp .gpick-i')[0].click();
    document.getElementById('w-part').value='삼겹살';
    document.getElementById('w-qty').value='500';
    document.getElementById('w-price').value='22,000';
    document.getElementById('w-name').value='홍길동';
    document.getElementById('w-phone').value='010-1234-5678';
    gStep3();
  }); await p.waitForTimeout(300);
  log.push("   STEP3 도달: " + await p.evaluate(()=>GORI.W.step===3) +
           " / 확인행 " + await p.evaluate(()=>document.querySelectorAll('.gsum-r').length) + "개");
  await p.screenshot({ path:'p2-step3.png', fullPage:true });
  await p.evaluate(()=>gSubmitRequest()); await p.waitForTimeout(700);
  const saved = await p.evaluate(()=>{ const r=window.__DB.purchase_requests.slice(-1)[0];
    return { title:r.title, cat:r.category, main:r.category_main, detail:JSON.stringify(r.detail), region:r.region }; });
  log.push("   저장됨 → " + JSON.stringify(saved));
  log.push("   등록 후 요청 상세로 이동: " + await p.evaluate(()=>document.querySelector('.pg.on').id));

  // ── 3. 견적 비교 ──
  await p.evaluate(()=>gOpenRequest('r1')); await p.waitForTimeout(600);
  log.push("3. 견적 카드: " + await p.evaluate(()=>document.querySelectorAll('.qc').length) + "개" +
           " / 최저가 표시: " + await p.evaluate(()=>!!document.querySelector('.qc.best')));
  log.push("   요약바(건수/최저/평균/최고): " + await p.evaluate(()=>[...document.querySelectorAll('.qbar-v')].map(e=>e.textContent).join(' | ')));
  await p.screenshot({ path:'p2-compare.png', fullPage:true });
  for (const mode of ['rating','lead','deal']) {
    await p.evaluate(m=>{ document.getElementById('q-sort').value=m; gSortQuotes(); }, mode);
    await p.waitForTimeout(120);
    log.push("   정렬 " + mode + ": " + await p.evaluate(()=>[...document.querySelectorAll('.qc-nm')].map(e=>e.textContent.trim()).join(' → ')));
  }
  // 견적 선택 → 거래 진행
  await p.evaluate(()=>{ window.confirm=()=>true; }); 
  await p.evaluate(()=>gSelectQuote('q1')); await p.waitForTimeout(700);
  log.push("   견적 선택 후 요청 상태: " + await p.evaluate(()=>window.__DB.purchase_requests.find(r=>r.id==='r1').status) +
           " / 미선택 처리: " + await p.evaluate(()=>window.__DB.quotes.find(q=>q.id==='q2').status));

  // ── 4. 견적 보내기 ──
  // (r1 은 방금 견적을 선택해 '진행중' 이 되었고 내 요청이라 견적을 보낼 수 없습니다.
  //  다른 사람이 올린 열린 요청 r2 로 이동해서 보냅니다.)
  await p.evaluate(()=>gOpenRequest('r2')); await p.waitForTimeout(1000);
  await p.evaluate(()=>gOpenQuoteForm()); await p.waitForTimeout(500);
  await p.evaluate(()=>{
    document.getElementById('q-name').value='새거래처';
    document.getElementById('q-contact').value='010-0000-1111';
    document.getElementById('q-price').value='18,900,000';
    document.getElementById('q-lead').value='3일';
    gSubmitQuote();
  }); await p.waitForTimeout(700);
  log.push("4. 견적 제출됨: " + await p.evaluate(()=>window.__DB.quotes.filter(q=>q.supplier_name==='새거래처').length) + "건");

  // ── 5. 업체 상세 ──
  await p.evaluate(()=>{ curSID='s1'; go('sp'); }); await p.waitForTimeout(700);
  log.push("5. 업체 상세: " + await p.evaluate(()=>document.querySelector('.sd-nm')?.textContent) +
           " / 인증뱃지 " + await p.evaluate(()=>document.querySelectorAll('.sd-cert:not(.off)').length) + "개" +
           " / 후기 " + await p.evaluate(()=>document.querySelectorAll('.rv').length) + "건");
  await p.screenshot({ path:'p2-supplier.png', fullPage:true });
  await p.evaluate(()=>gToggleFav('supplier','s1','합신식 도축장')); await p.waitForTimeout(400);
  log.push("   관심업체 담기: " + await p.evaluate(()=>window.__DB.favorites.length) + "건");

  // ── 6. 당일알바 ──
  await p.evaluate(()=>gOpenDaily()); await p.waitForTimeout(600);
  log.push("6. 당일알바 일감: " + await p.evaluate(()=>document.querySelectorAll('.dj').length) + "개");
  await p.screenshot({ path:'p2-daily.png', fullPage:true });
  await p.evaluate(()=>gViewApps('d1')); await p.waitForTimeout(500);
  log.push("   지원자 카드: " + await p.evaluate(()=>document.querySelectorAll('.wk').length) +
           " / 경력·평점·작업횟수: " + await p.evaluate(()=>document.querySelector('.wk-st')?.textContent.replace(/\s+/g,' ').trim()));
  await p.evaluate(()=>gChooseWorker('a1','d1')); await p.waitForTimeout(500);
  log.push("   지원자 선택: " + await p.evaluate(()=>window.__DB.day_job_applications[0].status));

  // ── 7. 거래관리 ──
  await p.evaluate(()=>go('my')); await p.waitForTimeout(800);
  log.push("7. 거래관리 탭: " + await p.evaluate(()=>[...document.querySelectorAll('.my-tab')].map(e=>e.textContent.trim()).join(' / ')));
  log.push("   KPI: " + await p.evaluate(()=>[...document.querySelectorAll('.my-kv')].map(e=>e.textContent).join(' | ')));
  await p.screenshot({ path:'p2-my.png', fullPage:true });
  for (const tab of ['in','out','ing','done','daily','fav','rv','noti','me']) {
    await p.evaluate(t=>gMyTab(t), tab); await p.waitForTimeout(180);
    const n = await p.evaluate(()=>document.getElementById('my-panel').innerHTML.length);
    if (n < 40) errs.push("탭 " + tab + " 내용 비어있음");
  }
  log.push("   전체 탭 렌더 확인 완료");

  errs.push(...(p._errs||[]));
  await p.close();
  console.log(log.join("\n"));
  console.log(errs.length ? "\n⚠️ " + errs.join("\n") : "\n✅ 페이지 에러 없음");
  await b.close();
})();
