/* ════════════════════════════════════════════════════════════════════
   /admin.html 을 서버에서 막습니다 (Vercel Edge Middleware)

   js/admin-gate.js 의 잠금은 브라우저에서 확인하므로 소스를 보면
   우회됩니다. 이 파일은 **Vercel 서버에서** 확인하므로 실제로 막힙니다.
   비밀번호가 맞지 않으면 admin.html 이 아예 전송되지 않습니다.

   ── 켜는 방법 ──────────────────────────────────────────
   1) Vercel → 프로젝트 → Settings → Environment Variables
   2) Name  : ADMIN_PASSWORD
      Value : (쓰실 비밀번호)
      Environment : Production · Preview · Development 모두 체크
   3) Save → Deployments 에서 Redeploy

   ⚠️ **비밀번호는 여기 적지 않습니다.** 이 저장소는 공개라 적는 순간
   GitHub 에 올라갑니다. 값은 Vercel 환경변수에만 둡니다.

   ⚠️ 환경변수를 안 넣으면 **열리지 않습니다(503).** 일부러 그렇게
   했습니다 — 안 넣었는데 그냥 열리면 "막았다" 고 착각하게 됩니다.

   ── 되돌리려면 ─────────────────────────────────────────
   이 파일을 지우면 됩니다. 그러면 브라우저 쪽 잠금만 남습니다.
   ════════════════════════════════════════════════════════════════════ */

export const config = {
  /* 관리자 화면과 **그 화면이 부르는 주소**에만 겁니다.
     손님 화면은 하나도 안 거칩니다.
     ⚠️ `/api/admin-health` 를 여기서 빼지 마세요. 값은 안 돌려주지만
     "이 회사가 슬랙을 쓰는가 · 메일을 쓰는가" 는 알려 줍니다. */
  matcher: ["/admin.html", "/admin", "/api/admin-health"]
};

/* 글자 수가 달라도 같은 시간이 걸리게 비교합니다.
   (네트워크 너머라 큰 의미는 없지만, 맞는 방법으로 해 둡니다) */
function sameSecret(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const enc = new TextEncoder();
  const x = enc.encode(a), y = enc.encode(b);
  let diff = x.length ^ y.length;
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

function page(title, body, status) {
  return new Response(
    '<!doctype html><html lang="ko"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="robots" content="noindex"><title>' + title + '</title>' +
    '<style>body{margin:0;min-height:100vh;display:grid;place-items:center;' +
    'background:#123D32;color:#fff;font-family:system-ui,-apple-system,"Malgun Gothic",sans-serif;' +
    'padding:24px}div{max-width:420px;text-align:center;line-height:1.8}' +
    'b{display:block;font-size:19px;letter-spacing:.05em;margin-bottom:12px}' +
    'p{color:rgba(255,255,255,.78);font-size:14px;margin:0}' +
    'code{background:rgba(255,255,255,.14);padding:2px 6px;border-radius:4px}' +
    'a{color:#fff;font-size:14px;display:inline-block;margin-top:20px}</style>' +
    '</head><body><div><b>ABOUTMEAT</b>' + body +
    '<a href="/">← 사이트로 돌아가기</a></div></body></html>',
    { status: status, headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

export default function middleware(request) {
  const expected = process.env.ADMIN_PASSWORD;

  /* 설정 전에는 열지 않습니다 — 안 막혔는데 막혔다고 믿는 것이
     제일 위험합니다. */
  if (!expected) {
    return page("설정이 필요합니다",
      "<p>관리자 비밀번호가 아직 설정되지 않았습니다.<br><br>" +
      "Vercel → Settings → Environment Variables 에서<br>" +
      "<code>ADMIN_PASSWORD</code> 를 추가하고 다시 배포해 주세요.</p>", 503);
  }

  const auth = request.headers.get("authorization") || "";
  if (auth.startsWith("Basic ")) {
    let pw = "";
    try {
      const decoded = atob(auth.slice(6));
      const i = decoded.indexOf(":");
      pw = i >= 0 ? decoded.slice(i + 1) : "";
    } catch (e) { pw = ""; }
    /* 맞으면 아무것도 돌려주지 않습니다 — 원래 파일이 그대로 전달됩니다 */
    if (sameSecret(pw, expected)) return;
  }

  return new Response("Authentication required", {
    status: 401,
    headers: {
      /* 이 헤더가 있어야 브라우저가 비밀번호 창을 띄웁니다.
         아이디는 아무거나 넣어도 됩니다 — 비밀번호만 봅니다.
         ⚠️ realm 에 한글을 쓰지 마세요. HTTP 헤더는 ASCII(latin-1)만
         담을 수 있어서, 한글을 넣으면 응답을 만들 때 통째로 터집니다.
         실제로 "상품 관리" 라고 썼다가 터졌습니다. */
      "WWW-Authenticate": 'Basic realm="ABOUTMEAT Admin", charset="UTF-8"',
      "content-type": "text/plain; charset=utf-8"
    }
  });
}
