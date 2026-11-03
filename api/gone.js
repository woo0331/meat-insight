/* ════════════════════════════════════════════════════════════════════
   끝난 서비스의 주소 — 410 Gone

   vercel.json 의 rewrite 서른셋이 앞 서비스 주소 157개를 여기로
   보냅니다. 받을 화면이 있는 둘(/home → / · /partners → /join)만
   308 이고 나머지는 전부 여기입니다.

   ⚠️ **404 가 아니라 410 인 까닭** — 404 는 "지금 없다"(오타일 수도
   있다), 410 은 "있었고 영구히 없앴다" 입니다. 우리는 뒤엣것을 압니다.
   ⚠️ **308 로 메인에 보내지 않는 까닭** — 그러면 다른 것을 찾아온
   분이 엉뚱한 화면을 보고, 검색엔진은 그 주소가 살아 있다고 읽습니다.
   ⚠️ `noindex` 를 같이 답니다 — 410 을 못 읽는 수집기까지 막습니다.

   ⚠️⚠️ **2026-11-03 — 이 글에서 브랜드 이름을 걷어냈습니다.** 전에는
   "지금 이곳은 … 입니다" 와 홈으로 보내는 단추가 적혀 있었는데,
   서비스를 비우면서 **손님에게 나가는 글에 남은 마지막 이름**이었습니다.
   ⚠️ 새 서비스를 세우면 여기 이름을 **손으로 적지 말고** 그때 만드실
   이름 한 곳(브랜드 데이터)에서 읽어 오세요 — 이 저장소는 이름이
   여섯 번 바뀌는 동안 손으로 적어 둔 자리를 다섯 번 뒤늦게 찾았습니다.
   ⚠️ 홈으로 보내는 단추도 **일부러 뺐습니다** — 지금 홈은 준비 중인
   빈 화면이라, 보내 드려도 아무것도 없습니다.
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
    '<title>끝난 서비스입니다</title>' +
    '<style>' +
    ':root{color-scheme:only light}' +
    '*{box-sizing:border-box}' +
    'html,body{margin:0;background:#FFFFFF;color:#231F20;' +
    'font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo",' +
    '"Malgun Gothic","Noto Sans KR",sans-serif;' +
    '-webkit-text-size-adjust:100%}' +
    'main{max-width:640px;margin:0 auto;padding:18vh 20px 12vh;' +
    'word-break:keep-all;overflow-wrap:anywhere}' +
    'h1{margin:0 0 14px;font-size:clamp(22px,5vw,30px);line-height:1.35}' +
    'p{margin:0;font-size:16px;line-height:1.7;color:#444444}' +
    '</style></head><body><main>' +
    '<h1>찾으시던 서비스는 끝났습니다.</h1>' +
    '<p>이 주소에 있던 서비스는 종료되었고, 다시 열리지 않습니다.</p>' +
    '</main></body></html>'
  );
};
