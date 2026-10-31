/* ════════════════════════════════════════════════════════════════════
   끝난 사업의 주소 — 410 Gone
   ════════════════════════════════════════════════════════════════════
   2026-10-31 지시서 §7 — "대응 페이지가 없는 경우 404 또는 410 응답
   적용 · 구사업 페이지를 무조건 메인 '/' 으로 보내는 일괄 리다이렉트
   제거."

   ⚠️⚠️ **왜 308 이 아니라 410 인가.** 바로 전까지 창업 · 폐업 주소
   스물일곱 묶음을 전부 `/` 로 308 로 보내고 있었습니다. 그건 검색
   엔진에게 "이 주소의 내용이 메인으로 옮겨갔다" 고 말하는 것인데
   **사실이 아닙니다** — 그 내용은 사라졌고 메인은 중고폰 플랫폼입니다.
   구글은 내용이 전혀 다른 곳으로 가는 리다이렉트를 **soft 404** 로
   보고, 그동안 그 주소가 색인에 남아 "인수인계 창업" 으로 검색해 들어온
   분이 중고폰 메인을 봅니다. 410 은 "영구히 없어졌다" 를 그대로 말해서
   색인에서 제일 빨리 빠집니다.

   ⚠️ **404 가 아니라 410 인 까닭** — 404 는 "지금 없다"(오타일 수도
   있다), 410 은 "있었고 영구히 없앴다" 입니다. 우리는 뒤엣것을 압니다.

   ⚠️⚠️ **대응 화면이 있는 둘만 리다이렉트로 남겼습니다** (`vercel.json`):
     /home     → /      랜딩을 없애면서 메인이 된 주소 (2026-10-01)
     /partners → /join   파트너 입점 → 지금도 업체 입점 화면입니다
   나머지는 전부 여기로 옵니다. 대응하는 PHONEWAY 화면이 **없습니다** —
   억지로 짝을 지어 보내면 그게 또 거짓말입니다.

   ⚠️ 이 함수는 주소를 **안 고칩니다** (rewrite 라 주소가 그대로입니다).
   그래야 로그에 어느 옛 주소가 아직 불리는지 남습니다.
   ⚠️ `noindex` 를 같이 답니다 — 410 을 못 읽는 수집기까지 막습니다.
   ⚠️ 인라인 스크립트가 없습니다 (CSP `script-src 'self' 'unsafe-inline'`
      이라 되기는 하지만, 쓸 까닭이 없는 자리입니다).
   ════════════════════════════════════════════════════════════════════ */

module.exports = function (req, res) {
  res.statusCode = 410;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.end(
    '<!doctype html><html lang="ko"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="robots" content="noindex,nofollow">' +
    '<meta name="color-scheme" content="only light">' +
    '<title>끝난 서비스입니다 | PHONEWAY</title>' +
    '<style>' +
    ':root{color-scheme:only light}' +
    'html,body{margin:0;background:#FCF4EA;color:#352014;' +
    'font-family:"Pretendard Variable",Pretendard,-apple-system,' +
    'BlinkMacSystemFont,system-ui,"Malgun Gothic",sans-serif;' +
    '-webkit-text-size-adjust:100%}' +
    'main{max-width:640px;margin:0 auto;padding:18vh 20px 12vh;' +
    'word-break:keep-all;overflow-wrap:anywhere}' +
    'p.k{margin:0 0 10px;font-size:13px;font-weight:800;' +
    'letter-spacing:.08em;color:#A33E06}' +
    'h1{margin:0 0 14px;font-size:clamp(24px,5vw,32px);line-height:1.35}' +
    'p.l{margin:0 0 28px;font-size:16px;line-height:1.7;color:#5A4433}' +
    'a.b{display:inline-flex;align-items:center;justify-content:center;' +
    'min-height:52px;padding:0 24px;border-radius:12px;' +
    'background:#C84F0A;color:#fff;font-size:16px;font-weight:800;' +
    'text-decoration:none}' +
    'a.b:hover{background:#A33E06}' +
    '</style></head><body><main>' +
    '<p class="k">PHONEWAY</p>' +
    '<h1>찾으시던 서비스는 끝났습니다.</h1>' +
    '<p class="l">이 주소에 있던 창업 · 폐업 중개 서비스는 종료되었습니다. ' +
    '지금 이곳은 중고폰을 팔고 사고 고치는 <b>폰웨이</b>입니다.</p>' +
    '<a class="b" href="/">폰웨이 홈으로</a>' +
    '</main></body></html>'
  );
};
