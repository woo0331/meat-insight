#!/usr/bin/env bash
# ABOUTMEAT(MEAT INSIGHT) 복구 테스트 사이트를 git 이력에서 다시 꺼냅니다.
# 쓰는 법:  bash docs/aboutmeat-restore/make-site.sh <나올 폴더>
# 원본: 커밋 df1fd2a14 (2026-05-05 · MEAT INSIGHT 마지막 판 · 지금 Supabase 에 남은 표들을 쓰던 판)
# 바꾸는 것: 관리자 화면(meat_insight_admin.html)은 빼고, 모든 화면에 noindex 와 test-guard.js 를 끼웁니다.
set -euo pipefail
OUT="${1:?나올 폴더를 적어 주세요}"
SRC=df1fd2a14
mkdir -p "$OUT"
git cat-file -e "$SRC^{commit}" 2>/dev/null || { echo "커밋 $SRC 이 없습니다 — git fetch --unshallow origin 을 먼저"; exit 1; }
for f in index.html meat_insight_apply.html meat_insight_calculator.html meat_insight_cases.html meat_insight_diagnosis.html meat_insight_main.html meat_insight_partner.html meat_insight_report.html; do
  git show "$SRC:$f" > "$OUT/$f"
  perl -0pi -e 's/(<meta charset="?UTF-8"?\s*\/?>)/$1\n<meta name="robots" content="noindex,nofollow"\/>\n<script src="\/test-guard.js"><\/script>/i' "$OUT/$f"
  grep -q test-guard "$OUT/$f" || { echo "끼우지 못했습니다: $f"; exit 1; }
done
# 테스트 사이트 전용 화면 수정 (커뮤니티 예시 글 · 고정 시세 숨김 · 폰 머리말)
node "$(dirname "$0")/patch-test.js" "$OUT/meat_insight_main.html"
cat > "$OUT/test-guard.js" <<'GUARD'
/* ABOUTMEAT 복구 테스트 사이트 전용 — 운영 데이터에 아무것도 쓰지 않게 막습니다.
   1) Supabase 로 가는 요청을 읽기 · 쓰기 모두 보내지 않고 거절합니다 (옛 DB 와 완전히 끊음).
   2) 결제창(TossPayments)을 열지 않습니다.
   3) 화면 위에 "테스트 사이트" 띠를 붙입니다. */
(function(){
  var MSG = "테스트 사이트입니다 — 등록·신청·결제는 접수하지 않습니다.";
  var of = window.fetch;
  if (of) {
    window.fetch = function(input, init){
      var url = typeof input === "string" ? input : (input && input.url) || "";
      var m = ((init && init.method) || (input && input.method) || "GET").toUpperCase();
      // 2026-11-17 대표자 결정: 기존 상품 · 매물도 자동 공개하지 않습니다 → 읽기까지 전부 막습니다
      if (url.indexOf("supabase.co") >= 0) {
        console.warn("[test-guard] 막음:", m, url);
        return Promise.resolve(new Response(JSON.stringify({ message: MSG, code: "TEST_SITE" }),
          { status: 403, headers: { "content-type": "application/json" } }));
      }
      return of.apply(this, arguments);
    };
  }
  var _toss;
  try {
    Object.defineProperty(window, "TossPayments", {
      configurable: true,
      get: function(){ return _toss; },
      set: function(v){ _toss = function(){ var t = v.apply(this, arguments);
        t.requestPayment = function(){ alert(MSG); return Promise.reject(new Error(MSG)); }; return t; }; }
    });
  } catch(e) {}
  document.addEventListener("DOMContentLoaded", function(){
    var b = document.createElement("div");
    b.textContent = "ABOUTMEAT 복구 테스트 · " + MSG;
    b.setAttribute("role", "status");
    b.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:2147483647;background:#7a1020;color:#fff;font:600 13px/1.4 sans-serif;padding:8px 12px;text-align:center";
    document.body.appendChild(b);
    // 폰 아래 탭(.bottom-nav)이 있으면 그 위에 띄웁니다 — 탭을 덮지 않게
    function place(){
      var t = document.querySelector(".bottom-nav"), h = 0;
      if (t && getComputedStyle(t).display !== "none") h = t.getBoundingClientRect().height;
      b.style.bottom = h + "px";
      document.body.style.paddingBottom = (h + b.offsetHeight) + "px";
    }
    place(); window.addEventListener("resize", place);
  });
})();
GUARD
cat > "$OUT/vercel.json" <<'VJ'
{
  "cleanUrls": false,
  "rewrites": [ { "source": "/", "destination": "/meat_insight_main.html" } ],
  "headers": [
    { "source": "/(.*)", "headers": [
      { "key": "X-Robots-Tag", "value": "noindex, nofollow" },
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
      { "key": "X-Frame-Options", "value": "SAMEORIGIN" }
    ] }
  ]
}
VJ
printf 'User-agent: *\nDisallow: /\n' > "$OUT/robots.txt"
echo "만들었습니다: $OUT"
