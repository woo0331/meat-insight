#!/usr/bin/env bash
# 도메인 이전 전후 비교용 — 네 주소의 응답을 읽기만 합니다 (아무것도 바꾸지 않습니다)
# 쓰는 법: bash domain-check.sh > before.txt   (이전 전)
#          bash domain-check.sh > after.txt    (이전 후)  →  diff before.txt after.txt
# 기대: storeway 두 주소의 줄은 전후 똑같고, aboutmeat 두 주소의 줄만 바뀝니다.
# ⚠️ 인증서(자물쇠)는 이 도구로 보지 않습니다 — 작업 세션은 중간 프록시를 거쳐 나가므로 실제 인증서가 보이지 않습니다.
#    인증서는 Vercel Domains 화면의 상태와 대표자 브라우저의 자물쇠로 확인합니다.
for h in storeway.co.kr www.storeway.co.kr aboutmeat.co.kr www.aboutmeat.co.kr; do
  for path in / /api/session /robots.txt /sitemap.xml; do
    hdr=$(curl -sS -m 20 -D - -o /tmp/dc.$$ "https://$h$path" 2>&1)
    code=$(echo "$hdr" | grep -m1 '^HTTP/2' | awk '{print $2}')
    loc=$(echo "$hdr" | grep -i -m1 '^location:' | awk '{print $2}' | tr -d '\r')
    srv=$(echo "$hdr" | grep -i -m1 '^server:' | awk '{print $2}' | tr -d '\r')
    extra=""
    case "$path" in
      /) extra="$(grep -o '<title>[^<]*' /tmp/dc.$$ | head -1) $(grep -o '<link rel="canonical"[^>]*>' /tmp/dc.$$ | head -1)" ;;
      /api/session) extra=$(head -c 80 /tmp/dc.$$ | grep -o '"auth":[a-z]*') ;;
      /robots.txt) extra=$(grep -m1 -i '^disallow' /tmp/dc.$$) ;;
      /sitemap.xml) extra="loc $(grep -c '<loc>' /tmp/dc.$$)개" ;;
    esac
    echo "$h$path | ${code:-응답없음} ${loc:+→ $loc} | $srv | $extra"
  done
done
rm -f /tmp/dc.$$
