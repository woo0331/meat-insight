# W00 — 기존 구현 조사 (STOREWAY 1차 개발)

작성 2026-11-18 · 작성 Claude Code · 검수 ChatGPT Work
표기: **[확인]** 코드·운영 응답·DB 를 직접 읽은 것 · **[추정]** 근거는 있으나 실행으로 확인 못 한 것 · **[미검증]** 확인할 수 없었던 것

## 1. 저장소 · 브랜치 · 기준 커밋 [확인]

| 항목 | 값 |
|---|---|
| 저장소 | `woo0331/meat-insight` |
| 운영(`main`) | `33e9f1d` — PR #3 `restore/insugyegye-20261117` 머지 |
| 복원 원본 | `f7e677b` (PHONEWAY 전환 `36e953c` 직전 · 2026-10-27 운영판 `7564983` + 문서) |
| 복원 시 덧댄 것 | ① `api/` 6개 파일 끝에 **무조건 503 을 내는 함수로 덮어쓰기** ② `WOW_BIZ.sosReady:false` ③ 헤더 위 점검 띠 ④ 빌드 결과만 내보내는 `restore-public/` 출력 ⑤ 옛 자동배포 CI(`ship.yml`) 삭제 |
| 작업 브랜치 | `claude/sharp-mccarthy-stiipn` (= `main` 에서 시작) |
| AGENTS.md | **없음** — 규칙 원본은 `CLAUDE.md`(인수인계판) · `HANDOFF.md` · `RESTORE-INSUGYEGYE.md` |

## 2. 구조 [확인]

- 화면: 빌드 도구 없는 정적 HTML/CSS/바닐라 JS SPA (`index.html` + `js/app.js` 라우터). `node build-pages.js` 가 주소별 HTML 167장 + sitemap 163 을 찍음.
- 서버: Vercel 함수 `api/` 12개 (공개 진입 6: `quote` · `session` · `me` · `deal` · `upload` · `admin-health`).
- DB: Supabase(Postgres) · 서버는 service key 로 REST 호출(`api/_db.js`), 사람 권한이 필요한 동작은 **그 사람의 토큰으로** 함수 호출(`api/_auth.js` · `api/deal.js`).
- 인증: Supabase 메일 매직링크(`js/auth.js`) · 역할 넷(customer · provider · staff · admin) · 역할은 **요청이 아니라 DB(`my_role()`)** 에서 읽음.
- 관리자: `/admin`(`admin.html`) — `middleware.js` 가 `ADMIN_PASSWORD` 기본 인증으로 한 겹 더 막음.
- Vercel 설정: `buildCommand = node build-pages.js && node tools/make-restore-public.js`, `outputDirectory = restore-public`.

## 3. 환경 분리 [확인 + 미검증]

- **DB 는 하나**: 운영 Supabase 프로젝트 `igignylgzjphtnyxhhsd` 한 곳에 골프 표(0020~0081)와 인수인계 표(0001~0019 공통)가 같이 있고, 옛 MEAT INSIGHT 표 16개는 2026-11-17 에 공개 접근을 잠금. [확인]
- `schema_version` 최댓값 **81** · 인수인계 표 `request` · `provider` · `deal` · `offer` 는 **0건** · `account` 2명. [확인]
- **Preview 전용 DB 없음.** Vercel Preview 환경변수에 운영 키가 들어 있는지는 이 세션에서 볼 수 없음. [미검증] → 그래서 개발 검증은 **로컬 임시 Postgres**(이 세션에 Postgres 16 있음)로 함.

## 4. 접수 중단의 확인된 원인 [확인]

```
GET  https://storeway.co.kr/api/session → {"auth":false,"signedIn":false,"restoration":true}
POST https://storeway.co.kr/api/quote   → 503 {"error":"복구 점검 중으로 현재 접수하지 않습니다.","restoration":true}
```

- 원인은 **의도적 점검 상태**입니다(환경변수 누락 · 배포 문제가 아님). 복원 커밋 `8f0b762` 가 6개 API 파일 맨 끝에서 `module.exports` 를 503 함수로 **다시 대입**해, 원래 핸들러는 **한 줄도 실행되지 않습니다**.
- 화면은 `WOW_BIZ.sosReady:false` 를 보고 신청 단추를 비활성화합니다 — **화면 설정일 뿐 서버 자물쇠가 아님**(복원 문서도 그렇게 적음).
- 그 아래 원래 코드가 켜졌을 때 접수가 되는지는 별개입니다 — 아래 6절의 블로커가 있습니다.

## 5. 기능 표

| 기능 | 파일·경로 | API·테이블 | 작동 근거 | 판단 | 미검증 |
|---|---|---|---|---|---|
| 견적 접수 | `/quote` · `js/pages/quote.js` · `api/quote.js` | `request` + `save_request_items()` | 옛 단위검사 `test-api` · `test-intake` 통과(가짜 fetch) · 2026-11-17 옛 판 전체검사 통과 | **재사용 + 수정** (서버 게이트 · 동의 증거 · 알림 작업 분리) | 실제 DB 저장 E2E |
| 멱등 · 중복 | `api/quote.js` ⓪① · `api/_intake.js` | `request.idem` unique(`request_idem_once`) · `tel_key` | 코드 · 0009 · 0017 | **재사용** | 동시 더블클릭 실측 |
| 다중 서비스 | `js/pick.js` · `save_request_items()` | `request_item` | 0009 · 한 트랜잭션 함수 | **재사용** — 단, 지금은 부모 저장 뒤 항목 저장이 **별도 호출**이라 부분 저장 가능 → **수정 대상** | — |
| 매물 등록 | `/sell` · `js/pages/market.js` | **저장 안 함**(알림만) | 코드 | **신규**(검수대기 저장) | — |
| 업체 입점 | `/join` · `js/pages/providers.js` | `provider_apply`(0016 · state `new`) | 코드 | **재사용** — 자동 승인 없음 확인 | — |
| 알림 | `api/_send.js` | 없음(웹훅 · Resend 즉시 호출) | 코드 | **수정** — 실패가 로그에만 남고 재시도 없음 → 알림 작업 표 신규 | 실제 발송 |
| 고객 접수 안내 메일 | `customerAck()` | — | 코드 | **유지(비활성 안내 필요)** — 수신주소는 양식의 선택 이메일 | 실제 발송 |
| 관리자 접수함 | `/admin` · `js/intake.js` · `api/me.js` | `request` · `assignment` · `deal` · `audit_log` | 옛 `test-admin` 275건 | **재사용 + 수정**(마스킹 · 알림실패 · 중복후보 · 내부메모/고객안내 구분) | 실 DB |
| 상태 변경 | `api/deal.js` → `move_state()` | `deal_move` 길 표 · `audit_log` | 0004 · 옛 `test-sql` | **재사용** | — |
| 배정 · 제3자 제공 재동의 | `assign_item()` · `move_state(assigned)` | `assignment.agree3rd_at` not null | 0004 · 0009 | **재사용**(1차 범위 밖이지만 유지) | — |
| 정산 · 수수료 | `confirm_fee` · `mark_paid` · `clawback_fee` | `deal` · `settlement` | 0003 · 0013 | **유지**(1차 제외) | — |
| 고객 본인 조회 | `/my` · `claim_request(p_no,p_tel)` | `request.user_id` 연결 | 0005 | **재사용** — 매직링크 로그인 + 번호 + 연락처 3겹. 비회원 OTP 는 없음 → **신규 설계 필요** | 로그인 자체(아래 블로커) |
| 로그인 | `js/auth.js` · `api/session.js` | Supabase Auth | 코드 | **수정 필요** — 아래 6-② | 운영 동작 |
| 브라우저 기록 | `/my` · `localStorage am.*` | — | 코드 | **유지** | — |
| 사진 첨부 | `js/photo.js` · `api/upload.js` | `request_photo` · `claim_photo_slot()` | 0011 | **유지(1차 확장 안 함)** | 버킷 |
| 검색 · 계산기 13 · 가이드 · 체크리스트 | 정적 | — | 옛 전체검사 통과 | **유지(회귀만)** | — |

## 6. 블로커 · 위험 [확인]

1. **서버 자물쇠가 "전부 끔" 하나뿐** — 503 덮어쓰기를 걷으면 원래 코드가 바로 운영 DB 에 씁니다. 기능별 · 서버 강제 게이트가 필요합니다(W01).
2. **로그인이 운영에서 막힐 구조** — `js/auth.js` 가 브라우저에서 `SUPABASE_URL/auth/v1/otp` 로 **직접** 요청하는데 `vercel.json` CSP 가 `connect-src 'self'` 입니다(옛 판도 같음). 매직링크 · 토큰 갱신 · 로그아웃이 브라우저에서 거절됩니다. → `api/` 경유로 바꾸거나 CSP 에 Supabase 호스트를 더해야 함(W03).
3. **동의 증거가 시각 하나** — `request.agree_at` 만 있고 고지 버전 · 항목 · 목적 · 보유기간이 저장되지 않음.
4. **알림 실패가 로그에만** — 재시도 · 관리자 확인 경로 없음.
5. **부모 · 항목이 두 번의 호출** — 항목 저장이 실패해도 접수는 성공으로 남음(코드가 일부러 그렇게 둠). 지시서 W02-④ 와 충돌 → 한 트랜잭션 함수로.
6. **`/sell` 은 저장 자체가 없음** — 검수대기 저장 신규.
7. **마이그레이션 번호** — 저장소는 0001~0019 인데 운영 `schema_version` 은 81 → 새 파일은 **0082 이상**. `db/apply-from-0008.sql` 은 운영에 다시 붙이면 안 됨(이미 적용 · 0012 의 상품 씨앗이 다름).
8. **상품(`offer`) 0건** — `request.offer_id` FK 라, 상품 카드에서 들어온 신청은 저장 실패. (상품 씨앗을 넣거나, 서버가 없는 상품 id 를 null 로 내림.)

## 7. 개인정보 · 정책 정합성 [확인]

| 항목 | 신청 양식 | 처리방침 | 판단 |
|---|---|---|---|
| 견적 보유기간 | 접수일로부터 1년 | 요청 처리 완료 후 1년 | **불일치** |
| 입점 보유기간 | 입점 종료 후 1년 | 탈퇴 또는 등록 거절 시까지 | **불일치** |
| 매물 보유기간 | 등록을 내리신 날로부터 1년 | **항목 없음** | **불일치** |
| 수탁사 | — | Vercel · Slack · Supabase (+ Resend 예시 줄) | 실제 사용 여부 = 운영 환경변수 [미검증] |
| 사업자 정보 8칸 · 보호책임자 | — | `site.js` 전부 빈칸 | **운영 재개 전 필수** — 지어내지 않음 |
| 로컬 저장 | `am.profile.v1` · `am.quotes.v1` (성함·연락처 없음) | 방침 언급 확인 필요 | W01 에서 대조 |

## 8. 테스트 · 빌드 명령 [확인]

```
node build-pages.js                   주소별 HTML + sitemap (검사 내장 · 틀리면 멈춤)
node tools/ship.js --check-only       옛 전체 검사 18묶음 (2026-11-17 전부 통과 · 약 21분)
node tools/test-api.js / test-intake.js / test-auth.js / test-sql.js (로컬 Postgres)
```
⚠️ 옛 `ship.js` 는 `--check-only` 없이 돌리면 **커밋 · main 반영까지** 합니다. 이번 작업은 `--check-only` 만 씁니다.

## 9. 경로

- 공개: `/` · `/startup(/:업종)` · `/operation` · `/transfer` · `/closure(/:업종)` · `/providers(/:분류)` · `/stores` · `/assets` · `/franchise` · `/support` · `/content` · `/tools/*` · `/g/:단계` · `/c/:분류` · `/about` · `/faq` · `/terms` · `/privacy`
- 신청: `/quote` · `/sell` · `/join` (모두 NOINDEX 아님 — 확인 필요)
- 개인: `/my` · `/search` · `/compare` (NOINDEX)
- 관리자: `/admin` (middleware 기본 인증 + 로그인 역할)
- 레거시 308: `/home` · `/closing` · `/acquisition` · `/companies(/*)` · `/guides(/*)` · `/partners`
