# 계약 기능 — 운영 반영 전 확인 (2026-11-23)

- **로컬 검수 완료 후보**: `claude/contract-review` **126ac8401** (운영 main 14c19e983 + 계약 통합 dcd0d80e7)
  - 전체 검사 22/22 · 로컬 E2E 88/88 × 2(폭 맞바꿈) · 360px 서비스 고르기 · 신청 링크 전달 통과
  - 이후 커밋은 문서 · 로컬 시험 도구(tools/local-stack.js · tools/test-local-notify.js)만 더합니다 — 후보의 사이트 코드는 126ac8401 그대로입니다.
- 모든 확인은 **읽기 전용**: DB · 마이그레이션 · 환경변수 · 인증 · 접수 · 배포 변경 없음.

## 1. 운영 Supabase 프로젝트 — 현재 배포값은 **미확정**, 기록상 근거는 `igignylgzjphtnyxhhsd`

⚠️ Vercel Production 의 `SUPABASE_URL` 은 **Secret** 이라 편집창에서 기존 값을 볼 수 없습니다 (대표 확인).
그래서 "편집창에서 ref 확인" 은 확인 경로가 아닙니다 — 아래 기록 · 응답만 근거로 씁니다.

| 근거 | 내용 | 날짜 |
|---|---|---|
| `docs/report-db-apply-2026-11-14.md` (복원 커밋 8f0b762 에서 지운 문서 · git 이력에 있음) | "운영 Supabase 프로젝트 ref: `igignylgzjphtnyxhhsd`" — 그 DB 에 골프 마이그레이션 적용 보고 | 2026-11-14 |
| `docs/storeway/W00-existing-audit.md` (main) | **[확인]** "DB 는 하나: 운영 Supabase 프로젝트 `igignylgzjphtnyxhhsd` … `schema_version` 최댓값 81" | 2026-11-18 |
| `aboutmeat`(`gxjzlkvdbafzfjuunvyx`) | 2026-11-17 에 **별도 Vercel 프로젝트(aboutmeat.co.kr)** 용으로 만든 새 프로젝트(ABOUTMEAT 7차 실행서) — storeway 운영 기록에는 안 나옴 | 2026-11-17 |

| 지금 확인할 수 없는 것 | 까닭 |
|---|---|
| 11-18 이후 Production 환경변수가 바뀌었는지 | Secret 이라 값을 못 봄 · 이 환경에 Vercel 접근 수단 없음 |
| 운영이 지금 어느 DB 를 부르는지 | 운영 `/api/session` 이 `restoration:true` (주소를 안 냄) · 운영 화면은 `*.supabase.co` 에 접속 안 함 · 두 프로젝트 API 게이트웨이 기록 최근 24시간 0건 |

→ **보고: 기록상 운영 ref = `igignylgzjphtnyxhhsd`. 현재 배포값과의 일치는 미확정**으로 둡니다.
두 프로젝트 모두 그대로입니다.

**확정하는 길 (값을 보지 않고)** — 오픈 순서 ①에서 합니다:
- 접수를 닫은 채 `STOREWAY_ACCOUNTS_OPEN=1` 만 Preview 가 아닌 **운영**에 잠깐 켜고 `/admin` 1번 칸(DB 판 번호 · 남은 마이그레이션)을 보면
  판 81 → igig, 판 84 → aboutmeat 로 갈립니다. ⚠️ 별도 승인 · 확인 뒤 즉시 끔.
- 또는 Vercel Production 의 `SUPABASE_URL` 을 **알고 있는 값으로 다시 저장**(덮어쓰기)하고 재배포 — 그때부터 그 값이 운영 ref 입니다(대표 · 별도 승인).

## 2. 0082~0084 대조 (조건부 · 읽기 전용 카탈로그 조회)

| 항목 (저장소 0082~0084) | aboutmeat `gxjzlkvdbafzfjuunvyx` | `igignylgzjphtnyxhhsd` |
|---|---|---|
| 판 번호 | 84 (82 · 83 · 84 있음) | 81 (다른 줄의 20~81) |
| 표 consent_record · notify_job · lookup_challenge · lookup_session · request_note | 다섯 모두 있음 | 없음 |
| 뷰 intake_funnel · vendor_response | 있음 | 없음 |
| 함수 submit_intake · submit_apply · due_notify · mark_notify · lookup_* 셋 · add_request_note · admin_inbox_flags · request_rollup · set_next_due · note_intake_meta · set_outcome · staff_record_quote | 열네 모두 있음 | 없음 |
| 계약 흐름 함수 move_state · assign_item · approve_provider · choose_quote · submit_quote | 있음 | 있음 |
| request 칸 form · listing_state · next_due · channel · outcome_on · outcome_why · settle · src | 여덟 모두 있음 | 없음 |
| quote 칸 extra · restore · src · waste | 있음 | 없음 |
| 상태 길(deal_move) | 78 (0084 뒤 값) | 70 (0084 전) |
| RLS 꺼진 표 | 0 | 0 |
| request 줄 수 | 2 (시험 데이터 — PROD_TARGET_CHECK 3장) | 0 |

### aboutmeat 가 운영이라면
- **적용할 마이그레이션 없음** — 0082~0084 가 이미 들어가 있고 계약 흐름 객체가 다 있습니다.
- 남는 것: 시험 데이터 2건 정리안(PROD_TARGET_CHECK 3장 · 별도 승인), 권한 세부(GRANT · 정책 본문)는
  `db/verify.sql` 을 그 프로젝트 SQL 편집기에서 **읽기만** 돌려 확인.

### igignylgzjphtnyxhhsd 가 운영이라면
- 0082~0084 를 **그대로 올리면 안 됩니다** — 판 20~81 이 다른 줄(다른 서비스)의 마이그레이션이라
  `request` · `provider` 칸 구성이 저장소와 다릅니다. 0082 의 `alter table request add column …` 은 통과해도
  함수 본문이 기대하는 칸(0001~0019 쪽)이 없으면 호출 때 터집니다.
- 영향: 접수 저장 · 조회 인증 · 관리자 접수함 · 견적 기록 · 결과 기록이 전부 안 됩니다.
- 필요한 것: 그 DB 의 **구조 사본**(스키마만)을 격리 Postgres 에 떠서 0082~0084 리허설 → 충돌 칸 · 함수 목록 → 적용 계획.

### 검증 · 복구 절차 (어느 쪽이든 적용이 필요해지면)
1. 적용 전: Supabase → Database → Backups 에서 직전 백업 시각 확인(또는 PITR) · `db/verify.sql` 결과 저장.
2. 리허설: 구조 사본 → 격리 Postgres → `0082 → 0083 → 0084` 순서 · `tools/test-sql.js` · `db/verify.sql` 전부 ✅.
3. 적용: 운영 SQL 편집기에서 번호 차례로, 파일마다 따로. ⚠️ 통째로 begin/commit 으로 감싸지 않음.
4. 적용 후: `db/verify.sql` · `/admin` 1번 칸(남은 마이그레이션 0) · 접수 닫힌 채 화면 확인.
5. 복구: 마이그레이션은 칸 · 표를 **더하는** 쪽이라 되돌리기 대신 ① 접수 · 계정 스위치를 닫아 두고
   ② 문제가 된 함수만 이전 정의로 다시 적용, 데이터 손상이 있으면 ③ 백업/PITR 복원(별도 승인).

## 3. 접수가 닫힌 채 계약 코드를 먼저 배포할 수 있는가 — **예 (코드 · 빌드 기준)**

- 후보 변경(14c19e983 → 126ac8401)은 **화면 코드 · CSS · 시험 도구 · 문서**뿐입니다.
  `api/` · `middleware.js` · `vercel.json` · `db/migrations` · `js/data/` 변경 **0**.
- 서버는 이미 운영에 있는 스위치로 닫혀 있습니다 (코드가 바뀌어도 그대로):
  - `STOREWAY_ACCOUNTS_OPEN ≠ 1` → `/api/session` · `me` · `deal` · `admin-health` 점검본(503) — DB 를 부르지 않음
  - `STOREWAY_INTAKE_OPEN` 비어 있음 → 접수 넷 모두 닫힘 (서버 게이트)
- 닫힌 상태 그대로 화면 확인(운영과 같은 `/api/session` 응답으로, 360 · 1440):
  `/my` 계약 동작 단추 0 · `/quote` 닫힘 안내 · `/join` 닫힘 안내가 머리 아래 · `/startup` `/closure` 열림 단추 0 ·
  접수 POST 0 · JS 에러 0.
- 바뀌는 것: `/join` 머리 아래 "지금은 입점 신청을 받지 않고 있습니다" 한 줄, `/admin` 로고 색 · 계약 화면(로그인 전엔 안 그려짐).

### 조건 — 코드 배포
1. 대표 승인 · `claude/contract-review` 를 최신 main 과 다시 대조(새 변경 있으면 전체 검사 22개 재실행)
2. main fast-forward → 운영 CSS 버전 반영 확인 → 닫힌 상태 화면 확인(위 목록)
3. 환경변수 · DB 손대지 않음

### 조건 — 실제 접수 오픈 → 아래 6장 순서

## 4. 실제 메일 로그인 · 알림 — 격리 Preview 준비 항목

1. 시험 Supabase 프로젝트 (운영과 다른 것 · 1장 확정 뒤 고름) — 0001~0084 적용 · `db/verify.sql` ✅
2. Vercel **Preview** 환경변수만(Production 과 분리): `SUPABASE_*`(시험 ref) · `STOREWAY_ACCOUNTS_OPEN=1` ·
   `STOREWAY_INTAKE_OPEN=quote,close`(시험) · `LOOKUP_OTP_ADAPTER=test` · `CRON_SECRET`(시험값)
3. 시험 수신처: 시험 전용 슬랙 웹훅(`INTAKE_WEBHOOK_URL`) 또는 시험 메일함(`INTAKE_EMAIL_TO`) — 실제 고객 · 업체에게 안 가는 곳
4. 시험 Supabase Auth → Redirect URLs 에 Preview 주소 · 매직링크 받을 시험 메일 셋(고객 · 업체 · 관리자)
5. Preview 보호가 켜져 있으면 우회 토큰 또는 열람 권한
6. 확인할 것: 매직링크 로그인 → `/my` · `/admin` · 신청 저장 · 접수번호 · 알림 수신 · 배정 → 견적 → 선택 → 계약금액 → 완료 · 취소
   (로컬에서 통과한 `tools/preview-e2e.js` 를 Preview 주소로 그대로 돌릴 수 있습니다 — 운영 주소면 스스로 멈춤)

## 6. 운영 접수 오픈 순서 (확정안)

| 단계 | 하는 일 | 누가 | 승인 |
|---|---|---|---|
| ① 운영 DB · 스키마 확인 | 1장의 "확정하는 길" 로 운영 ref 확정 → 그 DB 를 2장 표와 대조 · `db/verify.sql`(읽기). igig 이면 구조 사본 리허설 → 0082~0084 적용 계획 · 적용(백업 확인 뒤) | 대표 · 세션 | ref 확인 방식 · 적용 각각 |
| ② 격리 환경에서 메일 로그인 · 알림 검증 | 운영과 다른 시험 Supabase + Vercel **Preview** 환경변수 + 시험 수신처(4장) 로 매직링크 로그인 → `/my` · `/admin` · 접수 · 알림 수신 · 재시도 | 대표(설정) · 세션(검수) | Preview 환경변수 |
| ③ 오픈 직전 관리자 로그인 · 접수함 확인 | 운영에 `SUPABASE_*`(①의 ref) · `STOREWAY_ACCOUNTS_OPEN=1` · Redirect URL · 첫 관리자 계정 → **접수는 닫힌 채** 관리자 로그인 · 접수함 · `/admin` 1번 칸(남은 마이그레이션 0) 확인 | 대표 · 세션 | 계정 열기 |
| ④ 승인 후 접수 오픈 | 알림(웹훅 · 메일) · `CRON_SECRET`(+ vercel.json crons) · 개인정보처리방침 수탁자 같은 날 → `STOREWAY_INTAKE_OPEN=<양식>` → 재배포 → 운영 시험 접수 1건 → 접수번호 · 알림 · 접수함 확인 → 정리 | 대표 · 세션 | 접수 열기 |
| ⑤ 마지막 | 사업자 정보 · 운영 로그인(일반 회원) · 카카오 | 대표 | 각각 |

### 실제 접수 전에 꼭 필요한 것
- ① 운영 ref 확정 · 스키마(0082~0084) 준비 · `db/verify.sql` ✅
- 운영 `SUPABASE_URL` · `SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_KEY`
- 알림 받을 곳(`INTAKE_WEBHOOK_URL` 또는 `RESEND_API_KEY` + `INTAKE_EMAIL_TO`/`_FROM`) · 개인정보처리방침 수탁자 반영
- 관리자 계정이 로그인해 접수함을 볼 수 있음(③) — 접수가 들어와도 볼 사람이 없으면 안 됨
- 시험 데이터 정리(운영이 aboutmeat 로 확정되는 경우만)

### 접수와 따로 열 수 있는 것
- 계약 화면 코드 배포 (3장 — 닫힌 채 가능)
- `STOREWAY_ACCOUNTS_OPEN=1` (관리자 · 로그인) — 접수 스위치와 별개
- 알림 재시도 cron(`CRON_SECRET` · crons) — 저장된 접수의 알림만 다시 보냄, 새 접수를 받지 않음
- 고객 접수 안내 메일(`CUSTOMER_EMAIL_FROM`) · 업체 배정 메일(`PARTNER_EMAIL_FROM`) — 접수 오픈 뒤 따로 켜도 됨
- 사업자 정보 · 운영 일반 로그인 · 카카오 — 마지막 단계

## 7. 격리 환경 검수 결과 (로컬 시험 스택 · 2026-11-23)

> 알림은 **이 컨테이너 안 시험 수신처(127.0.0.1:8972)** 로만 보냈습니다 — 슬랙 · 메일 · 운영 · 두 Supabase 에 아무것도 안 나감.
> 켜는 법: `LOCAL_NOTIFY=1 node tools/local-stack.js` → `node tools/test-local-notify.js`

| 검수 | 결과 |
|---|---|
| E2E (견적 → 배정 → 수락 · 견적 → 선택 → 계약금액 → 완료 · 취소 · 비회원) | 88/88 |
| 그 흐름에서 나간 알림 | 13건 (접수 3 · 상태 변경 10) — 전부 시험 수신처 도착 |
| 알림 내용 | 접수번호 · 종류 · 서비스 · 지역 · 바꾼 역할 · 상태뿐 — **성함 · 연락처 · 메일 · 금액 0건** |
| 알림 작업 기록 | 접수 알림(ops_new) 3건 `sent` |
| 수신처 실패(500) | 접수는 그대로 성공 · 알림 작업 `failed` · 오류 코드 `webhook_500`(내용 안 남김) |
| 비밀값 없이 재시도 | 401 |
| 재시도(`CRON_SECRET`) | `sent` 로 바뀜 · 한 번만 도착 · 다시 불러도 또 안 보냄 |

- ⚠️ 처음 재시도는 실패했습니다 — 로컬 스택이 Supabase 의 기본 권한(service_role 이 public 표 전부를 읽음)을
  안 만들어서였습니다. 두 Supabase 프로젝트에서 `has_table_privilege` 로 그 권한이 있는 것을 읽기만 해서 확인했고,
  **로컬 스택에서만** 같은 권한을 주도록 고쳤습니다(코드 · 마이그레이션 변경 없음).
- 발견(후속 · 운영 영향 없음): 운영자 알림의 "서비스" 줄이 이름이 아니라 key(`demolish/full`)로 나갑니다 — 읽기 불편.

### 격리 환경으로 못 한 것 — 필요한 설정 · 담당
| 막힌 검수 | 필요한 것 | 담당 |
|---|---|---|
| 실제 메일 매직링크 로그인 | 시험 Supabase(운영과 다른 것) 의 Auth 메일 발송 · Redirect URLs 에 Preview 주소 · 받을 시험 메일 셋 | 대표 |
| Preview 주소에서 실제 화면 | Vercel **Preview** 환경변수만: `SUPABASE_*`(시험 ref) · `STOREWAY_ACCOUNTS_OPEN=1` · `STOREWAY_INTAKE_OPEN=quote,close` · `LOOKUP_OTP_ADAPTER=test` · `CRON_SECRET`(시험값) · 보호 우회 토큰 | 대표 |
| 실제 알림 수신(슬랙 · 메일) | 시험 전용 슬랙 웹훅 또는 시험 메일함(`INTAKE_WEBHOOK_URL` 또는 `RESEND_API_KEY` + `INTAKE_EMAIL_TO`) — Preview 에만 | 대표 |
| 고객 · 업체 안내 메일 | `RESEND_API_KEY` + `CUSTOMER_EMAIL_FROM` · `PARTNER_EMAIL_FROM`(발신 도메인 인증) — Preview 에만 | 대표 |
→ 설정이 되면 `tools/preview-e2e.js` 를 Preview 주소로 그대로 돌립니다 (운영 주소면 스스로 멈춤).

## 8. 남은 항목

- 운영 Supabase ref 확정 — 기록상 igignylgzjphtnyxhhsd · 현재 배포값 미확정 (6장 ①)
- 격리 Preview 에서 실제 메일 로그인 · 실제 알림 수신 확인 (7장 표의 설정 필요)
- 후속: 운영자 알림의 서비스 줄을 key 대신 이름으로
- **실기기 검수** (아이폰 · 갤럭시, 360급 포함) — 지금까지 Chromium 폭 조절로만 확인
- 후속 기능: 계약 후 금액 정정 · 직원 금액 열람 정책 · 서버 오류 문구
- 보류: main 병합 · 운영 배포 · DB · 환경변수 · 접수 활성화 · 사업자 정보 · 운영 로그인 · 카카오
