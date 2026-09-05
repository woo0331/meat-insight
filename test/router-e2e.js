const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const FAKE = fs.readFileSync('./fake-sb.js','utf8');
const BUYER = { id:'u1', email:'kim@test.com', user_metadata:{ name:'김철수', role:'buyer' } };
const BASE = 'file:///home/user/meat-insight/index.html';

async function open(b, user, vp, hash){
  const p = await b.newPage({ viewport: vp||{width:1440,height:1000} });
  await p.addInitScript(FAKE + "\nwindow.__FAKE_INIT(" + JSON.stringify({user}) + ");");
  p._errs=[]; p.on('pageerror', e => p._errs.push(e.message));
  await p.goto(BASE + (hash||''), {waitUntil:'load'});
  await p.waitForTimeout(1600);
  return p;
}
const cur = p => p.evaluate(()=> (document.querySelector('.pg.on')||{}).id || '(없음)');
const hash = p => p.evaluate(()=> location.hash || '(빈값)');
const title = p => p.evaluate(()=> document.title);

(async () => {
  const b = await chromium.launch(); const log=[], errs=[];
  const chk = (n,got,want)=>{ const ok = got===want; log.push((ok?'  ✅ ':'  ❌ ')+n+': '+got+(ok?'':'  ← 기대 '+want)); if(!ok) errs.push(n); };

  // ── 1. 화면 이동마다 주소가 바뀌는가 ──
  log.push('1. 화면 이동 → 주소');
  let p = await open(b, BUYER);
  chk('초기 화면', await cur(p), 'pg-h');
  chk('초기 해시', await hash(p), '(빈값)');
  await p.evaluate(()=>go('suppliers')); await p.waitForTimeout(350);
  chk('업체 목록 해시', await hash(p), '#/suppliers');
  chk('문서 제목', await title(p), '업체 찾기 · 고리');
  await p.evaluate(()=>go('jobs')); await p.waitForTimeout(350);
  chk('구인구직 해시', await hash(p), '#/jobs');
  await p.evaluate(()=>gOpenRequest('r1')); await p.waitForTimeout(900);
  chk('요청 상세 화면', await cur(p), 'pg-reqd');
  chk('요청 상세 해시', await hash(p), '#/req/r1');
  await p.evaluate(()=>{ curSID='s1'; go('sp'); }); await p.waitForTimeout(400);
  chk('업체 프로필 해시', await hash(p), '#/sup/s1');
  chk('히스토리 길이 ≥5', String(await p.evaluate(()=>history.length>=5)), 'true');

  // ── 2. 뒤로가기 ──
  log.push('2. 브라우저 뒤로가기');
  await p.goBack(); await p.waitForTimeout(700);
  chk('1회 뒤로 → 요청 상세', await cur(p), 'pg-reqd');
  await p.goBack(); await p.waitForTimeout(500);
  chk('2회 뒤로 → 구인구직', await cur(p), 'pg-jobs');
  await p.goBack(); await p.waitForTimeout(500);
  chk('3회 뒤로 → 업체 목록', await cur(p), 'pg-suppliers');
  await p.goBack(); await p.waitForTimeout(500);
  chk('4회 뒤로 → 홈', await cur(p), 'pg-h');
  chk('홈 제목 복원', await title(p), '고리 — 대한민국 축산업 통합 플랫폼');

  // ── 3. 앞으로가기 ──
  log.push('3. 앞으로가기');
  await p.goForward(); await p.waitForTimeout(500);
  chk('앞으로 → 업체 목록', await cur(p), 'pg-suppliers');

  // ── 4. 공유 링크(콜드 스타트) ──
  log.push('4. 공유 링크로 바로 진입');
  let p2 = await open(b, BUYER, null, '#/req/r1'); await p2.waitForTimeout(1200);
  chk('요청 상세 복원', await cur(p2), 'pg-reqd');
  chk('요청 내용 표시', String(await p2.evaluate(()=>document.getElementById('reqd-body').textContent.length>200)), 'true');
  errs.push(...p2._errs.map(e=>'deeplink-req: '+e));

  let p3 = await open(b, BUYER, null, '#/sup/s1'); await p3.waitForTimeout(1500);
  chk('업체 프로필 복원', await cur(p3), 'pg-sp');
  chk('업체명 표시', String(await p3.evaluate(()=>document.getElementById('sp-body').textContent.length>100)), 'true');
  errs.push(...p3._errs.map(e=>'deeplink-sup: '+e));

  let p4 = await open(b, BUYER, null, '#/suppliers'); await p4.waitForTimeout(900);
  chk('업체 목록 복원', await cur(p4), 'pg-suppliers');

  let p5 = await open(b, BUYER, null, '#/quote');   // 복원 불가 화면
  chk('폼 화면 딥링크 → 홈', await cur(p5), 'pg-h');
  let p6 = await open(b, BUYER, null, '#/없는페이지');
  chk('잘못된 주소 → 홈', await cur(p6), 'pg-h');

  // ── 5. 링크 복사 버튼 ──
  log.push('5. 링크 복사 버튼');
  chk('요청 상세 버튼', String(await p2.evaluate(()=>document.querySelectorAll('#pg-reqd .gshare-b').length)), '1');
  chk('업체 프로필 버튼', String(await p3.evaluate(()=>document.querySelectorAll('#pg-sp .gshare-b').length)), '1');

  // ── 6. 모바일 하단 네비 + 뒤로가기 ──
  log.push('6. 모바일');
  let m = await open(b, BUYER, {width:390,height:844});
  await m.evaluate(()=>go('reqs')); await m.waitForTimeout(400);
  await m.evaluate(()=>go('my')); await m.waitForTimeout(600);
  chk('내 활동 해시', await hash(m), '#/my');
  await m.goBack(); await m.waitForTimeout(600);
  chk('뒤로 → 요청 목록', await cur(m), 'pg-reqs');
  chk('하단 네비 활성', await m.evaluate(()=>document.querySelector('.bni.on').id), 'bn-reqs');
  chk('내부화면 헤더 노출', String(await m.evaluate(()=>!document.body.classList.contains('on-home'))), 'true');
  await m.goBack(); await m.waitForTimeout(600);
  chk('뒤로 → 홈', await cur(m), 'pg-h');
  chk('홈 플래그 복원', String(await m.evaluate(()=>document.body.classList.contains('on-home'))), 'true');

  // ── 7. 새로고침 ──
  log.push('7. 새로고침 유지');
  await p.evaluate(()=>go('market')); await p.waitForTimeout(400);
  await p.reload({waitUntil:'load'}); await p.waitForTimeout(1600);
  chk('새로고침 후 시세 유지', await cur(p), 'pg-market');

  errs.push(...p._errs.map(e=>'main: '+e));
  console.log(log.join('\n'));
  console.log('\n페이지 오류: ' + (errs.length? '\n  '+errs.join('\n  ') : '없음'));
  console.log(errs.length? '\n❌ 실패 '+errs.length+'건' : '\n✅ 전체 통과');
  await b.close();
})();
