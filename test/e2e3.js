const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const FAKE = fs.readFileSync('./fake-sb.js','utf8');
const BUYER = { id:'u1', email:'kim@test.com', user_metadata:{ name:'김철수', role:'buyer' } };
const SUP   = { id:'u9', email:'sup@test.com', user_metadata:{ name:'합신식', role:'supplier' } };

async function open(b, user, vp){
  const p = await b.newPage({ viewport: vp||{width:1440,height:1000}, deviceScaleFactor:2 });
  await p.addInitScript(FAKE + "\nwindow.__FAKE_INIT(" + JSON.stringify({user}) + ");");
  p._errs=[]; p.on('pageerror', e => p._errs.push(e.message));
  await p.goto('file:///home/user/meat-insight/index.html',{waitUntil:'load'});
  await p.waitForTimeout(1400);   // init3 는 +300ms
  return p;
}
(async () => {
  const b = await chromium.launch(); const log=[], errs=[];

  // ── 1. 스키마 감지 ──
  let p = await open(b, BUYER);
  log.push("1. PHASE3 테이블 감지: " + await p.evaluate(()=>JSON.stringify(
    ['chat_rooms','chat_messages','supplier_prefs','verifications','orders','market_prices']
      .reduce((a,t)=>(a[t]=GORI.SCHEMA[t],a),{}))));
  log.push("   시세 로딩: " + await p.evaluate(()=>GORI.MARKET.rows.length) + "건");

  // ── 2. 견적 카드 보강 (시세 대비 · 응답률 · 채팅) ──
  await p.evaluate(()=>gOpenRequest('r1')); await p.waitForTimeout(900);
  log.push("2. 시세 대비 배지: " + await p.evaluate(()=>[...document.querySelectorAll('.qc-x .gbadge')].map(e=>e.textContent).join(' | ')||'(없음)'));
  log.push("   응답 지표 행: " + await p.evaluate(()=>[...document.querySelectorAll('.qc-sr.qc-x')].map(e=>e.textContent.replace(/\s+/g,' ')).join(' | ')||'(없음)'));
  log.push("   채팅 버튼: " + await p.evaluate(()=>document.querySelectorAll('.qc-chat').length) + "개");
  await p.screenshot({path:'p3-compare.png', fullPage:true});

  // ── 3. 채팅 ──
  await p.evaluate(()=>document.querySelector('.qc-chat').click()); await p.waitForTimeout(900);
  log.push("3. 채팅방 진입: " + await p.evaluate(()=>document.querySelector('.pg.on').id) +
           " / 방 생성: " + await p.evaluate(()=>window.__DB.chat_rooms.length) + "개");
  await p.evaluate(()=>{ document.getElementById('chat-input').value='한우 등심 300kg 냉장으로 가능할까요? 납기 2일이면 좋겠습니다.'; gSendChat(); });
  await p.waitForTimeout(800);
  log.push("   메시지 전송: " + await p.evaluate(()=>window.__DB.chat_messages.length) + "건 / 말풍선 " +
           await p.evaluate(()=>document.querySelectorAll('.chat-bub').length) + "개");
  log.push("   상대에게 알림: " + await p.evaluate(()=>window.__DB.notifications.filter(n=>n.type==='chat').length) + "건");
  await p.screenshot({path:'p3-chat.png', fullPage:true});

  // ── 4. 견적 선택 → 거래 생성 ──
  await p.evaluate(()=>{ window.confirm=()=>true; });
  await p.evaluate(()=>gOpenRequest('r1')); await p.waitForTimeout(800);
  await p.evaluate(()=>gSelectQuote('q1')); await p.waitForTimeout(1000);
  log.push("4. 거래 생성: " + await p.evaluate(()=>JSON.stringify(window.__DB.orders.map(o=>({s:o.status,a:o.amount,sup:o.supplier_name})))));

  // ── 5. 거래 진행 단계 ──
  const oid = await p.evaluate(()=>window.__DB.orders[0].id);
  await p.evaluate(id=>gOpenOrder(id), oid); await p.waitForTimeout(700);
  log.push("5. 거래 화면 단계: " + await p.evaluate(()=>[...document.querySelectorAll('.ord-lb')].map(e=>e.textContent).join(' → ')));
  await p.evaluate(()=>gAdvanceOrder(window.__DB.orders[0].id)); await p.waitForTimeout(800);
  await p.evaluate(()=>gAdvanceOrder(window.__DB.orders[0].id)); await p.waitForTimeout(800);
  await p.evaluate(()=>gAdvanceOrder(window.__DB.orders[0].id)); await p.waitForTimeout(900);
  log.push("   3단계 진행 후: " + await p.evaluate(()=>window.__DB.orders[0].status) +
           " / 요청 상태 " + await p.evaluate(()=>window.__DB.purchase_requests.find(r=>r.id==='r1').status) +
           " / 거래실적 " + await p.evaluate(()=>window.__DB.suppliers.find(s=>s.id==='s1').deal_count));
  await p.screenshot({path:'p3-order.png', fullPage:true});
  errs.push(...p._errs.map(e=>"[buyer] "+e)); await p.close();

  // ── 6. 업체 계정: 알림설정 · 인증 · 구조화 견적 ──
  p = await open(b, SUP);
  await p.evaluate(()=>gOpenPrefs()); await p.waitForTimeout(900);
  log.push("6. 알림설정 화면 — 분야칩 " + await p.evaluate(()=>document.querySelectorAll('#pf-cats .gpick-i').length) +
           "개 / 선택됨 " + await p.evaluate(()=>[...document.querySelectorAll('#pf-cats .gpick-i.on')].map(e=>e.textContent).join(',')));
  await p.evaluate(()=>{ document.querySelectorAll('#pf-cats .gpick-i')[2].click(); gSavePrefs('s1'); }); await p.waitForTimeout(800);
  log.push("   저장 결과: " + await p.evaluate(()=>JSON.stringify(window.__DB.supplier_prefs.find(x=>x.supplier_id==='s1').category_mains)));
  await p.screenshot({path:'p3-prefs.png', fullPage:true});

  await p.evaluate(()=>gOpenVerify()); await p.waitForTimeout(800);
  log.push("7. 인증센터 항목: " + await p.evaluate(()=>[...document.querySelectorAll('#verify-body .gcard-t')].map(e=>e.textContent.trim().replace(/\s+/g,' ')).slice(0,4).join(' | ')));
  const brnBad = await p.evaluate(()=>{ const e=document.getElementById('vf-brn'); if(!e) return 'no-field'; e.value='123-45-67890'; gSubmitVerify('s1','brn'); return document.getElementById('vf-msg').textContent; });
  await p.waitForTimeout(400);
  log.push("   잘못된 사업자번호 차단: " + (await p.evaluate(()=>document.getElementById('vf-msg').textContent) || '(통과됨 - 문제)'));
  await p.evaluate(()=>{ const e=document.getElementById('vf-brn'); if(e){e.value='220-81-62517'; gSubmitVerify('s1','brn');} }); await p.waitForTimeout(900);
  log.push("   유효 번호 신청: " + await p.evaluate(()=>window.__DB.verifications.length) + "건 등록");
  await p.screenshot({path:'p3-verify.png', fullPage:true});

  // 구조화 견적
  await p.evaluate(()=>gOpenRequest('r2')); await p.waitForTimeout(800);
  await p.evaluate(()=>gOpenQuoteForm()); await p.waitForTimeout(700);
  log.push("8. 구조화 견적 입력칸: " + await p.evaluate(()=>['q-unitprice','q-qty','q-qtyunit'].filter(i=>document.getElementById(i)).join(', ')));
  await p.evaluate(()=>{ document.getElementById('q-unitprice').value='120,000'; document.getElementById('q-qty').value='5'; gCalcTotal(); });
  await p.waitForTimeout(300);
  log.push("   자동 총액: " + await p.evaluate(()=>document.getElementById('q-calc').textContent) +
           " / 금액칸 " + await p.evaluate(()=>document.getElementById('q-price').value));
  await p.evaluate(()=>{ document.getElementById('q-name').value='전국냉장물류'; document.getElementById('q-contact').value='031-111-1111'; gSubmitQuote(); });
  await p.waitForTimeout(1000);
  const nq = await p.evaluate(()=>{ const q=window.__DB.quotes.slice(-1)[0]; return {sup:q.supplier_name,unit:q.unit_price,qty:q.qty,total:q.total_amount}; });
  log.push("   저장된 구조화 값: " + JSON.stringify(nq));

  // ── 9. 매칭 알림 (트리거 없는 환경 → 클라이언트 폴백) ──
  await p.evaluate(()=>go('rw')); await p.waitForTimeout(400);
  await p.evaluate(()=>{ gPickCat('process'); gStep2(); }); await p.waitForTimeout(500);
  await p.evaluate(()=>{
    document.querySelectorAll('#w-work .gpick-i')[0].click();
    document.getElementById('w-item').value='한우 지육 발골';
    document.getElementById('w-qty').value='20';
    document.getElementById('w-name').value='박사장';
    document.getElementById('w-phone').value='010-2222-3333';
    gStep3();
  }); await p.waitForTimeout(400);
  const before = await p.evaluate(()=>window.__DB.notifications.length);
  await p.evaluate(()=>gSubmitRequest()); await p.waitForTimeout(2200);
  log.push("9. 요청 등록 → 매칭 알림: " + (await p.evaluate(()=>window.__DB.notifications.filter(n=>n.type==='request').length)) + "건 발송");
  log.push("   바로견적 추천 화면: " + await p.evaluate(()=>document.querySelector('.pg.on').id) +
           " / 추천 업체 " + await p.evaluate(()=>document.querySelectorAll('#instant-body .ritem').length) + "곳");
  await p.screenshot({path:'p3-instant.png', fullPage:true});

  // ── 10. 거래관리 새 탭 ──
  await p.evaluate(()=>go('my')); await p.waitForTimeout(1200);
  log.push("10. 거래관리 탭: " + await p.evaluate(()=>[...document.querySelectorAll('.my-tab')].map(e=>e.textContent.trim()).join(' / ')));
  for (const t of ['chat','order','me']) {
    await p.evaluate(x=>gMyTab(x), t); await p.waitForTimeout(300);
    const n = await p.evaluate(()=>document.getElementById('my-panel').innerHTML.length);
    if (n < 40) errs.push("탭 "+t+" 비어있음");
  }
  log.push("   신규 탭 렌더 확인 완료 / 업체 운영 블록: " + await p.evaluate(()=>!!document.getElementById('my-p3')));
  await p.screenshot({path:'p3-my.png', fullPage:true});

  errs.push(...p._errs.map(e=>"[supplier] "+e)); await p.close();
  console.log(log.join("\n"));
  console.log(errs.length ? "\n⚠️ " + [...new Set(errs)].join("\n") : "\n✅ 페이지 에러 없음");
  await b.close();
})();
