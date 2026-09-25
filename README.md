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
node check.js         # 19개 화면 전수 점검 (playwright 필요)
node tools/make-img.js # 그림 다시 그리기
```

`check.js` 는 Vercel 을 흉내 낸 작은 서버를 띄웁니다 — 주소가 진짜
경로라서 `file://` 로는 확인할 수 없습니다.

## 화면

| 주소 | 화면 | 상태 |
|---|---|---|
| `/` | 메인 | 됨 |
| `/sos` | 사장님 SOS | 됨 |
| `/check` | 무료 사업진단 (8항목 → 점수 → 항목별 CTA) | 됨 |
| `/start` | 창업 프로젝트 (20단계 · 체크 저장) | 됨 |
| `/start/cost` | 창업비 정리표 | 됨 |
| `/partners` | 업체 찾기 (명단이 아니라 **무엇이 필요한지 고르는 화면**) | 됨 |
| `/request` | 견적 요청 (서비스마다 묻는 칸이 다릅니다) | 됨 |
| `/partner` · `/partner/apply` | 파트너 안내 · 등록 | 됨 |
| `/about` | ABOUTMEAT 소개 | 됨 |
| `/terms` · `/privacy` | 약관 · 방침 (중개·매칭 기준) | 됨 · **초안** |
| `/lab` | 사장님 연구소 | 준비 중 |
| `/my` · `/login` · `/signup` | MY · 로그인 · 가입 | 준비 중 (백엔드) |

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

## 사진

⚠️ **실제 사진이 한 장도 없습니다.** `img/` 의 15장은 코드로 그린
벡터 그림입니다.

```bash
node tools/make-img.js   # img/*.svg 를 다시 그립니다
```

그림을 바꾸려면 `tools/img-scenes.js`(장면)와 `tools/img-lib.js`(사람 ·
쇼케이스 · 후드 같은 조각)를 고치고 다시 돌리세요. `img/` 안의 SVG 를
손으로 고치면 다음에 돌릴 때 덮어써집니다.

실제 사진이 생기면 `img/` 에 넣고 `js/data/photos.js` 의 경로만 바꾸면
됩니다. 실제 고깃집 · 정육점 · 주방 · 덕트 · 쇼케이스 · 사장 · 작업현장
사진을 씁니다 — 접시에 담긴 고기 사진이 아닙니다.

## 작업 규칙

`CLAUDE.md` 를 먼저 읽으세요. 실제로 겪은 버그와 그 이유가 전부 적혀
있습니다 — 특히 **지어낸 숫자를 화면에 내지 않는다**, **하지 않은 일을
했다고 말하지 않는다** 두 가지입니다.
