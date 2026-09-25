# ABOUTMEAT

고기 사업자의 문제 해결 플랫폼. 고깃집·정육점 사장님이 장사하다 막히면
물어보는 곳입니다.

```
문제 입력 → 이해 → 해결방법 → 업체 찾기 → 견적 비교 → 상담·계약 → 관리
```

빌드 도구가 없습니다. `index.html` 을 그냥 열면 바로 돕니다.

## 돌려 보기

```bash
node build-pages.js   # 주소마다 HTML + sitemap.xml 을 만듭니다
node check.js         # 전수 점검 (playwright 필요)
```

`check.js` 는 Vercel 을 흉내 낸 작은 서버를 띄웁니다 — 주소가 진짜
경로라서 `file://` 로는 확인할 수 없습니다.

## 화면

| 주소 | 화면 | 상태 |
|---|---|---|
| `/` | 메인 | 됨 |
| `/sos` | 사장님 SOS | 됨 |
| `/start` · `/start/cost` | 창업 프로젝트 · 창업비 계산기 | 준비 중 |
| `/check` | 무료 사업진단 | 준비 중 |
| `/partners` · `/partners/:id` | 업체 찾기 · 파트너 프로필 | 준비 중 |
| `/request` · `/quotes` | 견적 요청 · 견적 비교 | 준비 중 |
| `/lab` | 사장님 연구소 | 준비 중 |
| `/partner` · `/partner/apply` | 파트너 안내 · 등록 | 준비 중 |
| `/my` | MY BUSINESS | 준비 중 |
| `/terms` · `/privacy` | 약관 · 방침 | 다시 쓰는 중 |

**준비 중** 화면은 빈 화면이 아닙니다 — 무엇을 할 곳인지 적고 지금 할
수 있는 것(SOS·전화)을 줍니다. 전부 `noindex` 입니다.

## 접수가 되게 하려면

`api/quote.js` 는 요청을 **저장하지 않습니다.** 받아서 밖으로 보내기만
합니다. Vercel → Settings → Environment Variables 에 둘 중 하나:

- `ORDER_WEBHOOK_URL` — 요청 JSON 을 그대로 POST (슬랙 워크플로 주소만
  넣어도 채널에 바로 뜹니다)
- `RESEND_API_KEY` + `ORDER_EMAIL_TO` — 이메일로 받기

넣은 뒤 `js/data/site.js` 의 `WOW_BIZ.sosReady` 를 켜세요. 그 전에는
SOS 화면 맨 위에 "지금은 이 양식으로 접수하지 못합니다" 가 뜹니다.

## 작업 규칙

`CLAUDE.md` 를 먼저 읽으세요. 실제로 겪은 버그와 그 이유가 전부 적혀
있습니다 — 특히 **지어낸 숫자를 화면에 내지 않는다**, **하지 않은 일을
했다고 말하지 않는다** 두 가지입니다.
