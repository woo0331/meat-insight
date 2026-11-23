# 계약 기능 — 운영 반영 전 확인 (2026-11-23)

- **로컬 검수 완료 후보**: `claude/contract-review` **126ac8401** (운영 main 14c19e983 + 계약 통합 dcd0d80e7)
  - 전체 검사 22/22 · 로컬 E2E 88/88 × 2(폭 맞바꿈) · 360px 서비스 고르기 · 신청 링크 전달 통과
  - 이 문서 커밋은 문서만 더합니다 — 후보 코드는 126ac8401 그대로입니다.
- 모든 확인은 **읽기 전용**: DB · 마이그레이션 · 환경변수 · 인증 · 접수 · 배포 변경 없음.

## 1. 운영 Supabase 프로젝트 — **미확정**

| 근거 찾기 | 결과 |
|---|---|
| 운영 `/api/session` | `restoration:true` · `auth:false` · 접수 넷 모두 닫힘 — 프로젝트 주소를 내지 않음 |
| 운영 `/api/me` · `/api/admin-health` | 503 점검본 · 401(기본 인증) |
| 운영 화면이 접속하는 곳 | `storeway.co.kr` · `cdn.jsdelivr.net` 뿐 — `*.supabase.co` 접속 0 |
| 두 프로젝트 API 게이트웨이 기록(최근 24시간) | 둘 다 0건 — 운영이 지금 DB 를 아예 부르지 않는 상태와 맞고, 어느 쪽인지는 가려 주지 않음 |
| Vercel Production 환경변수 | 이 환경에서 볼 수 없음 (Vercel 접근 수단 없음) |

→ **미확정으로 기록하고 두 프로젝트 모두 그대로 둡니다.**
확정 방법: Vercel → 프로젝트 → Settings → Environment Variables → **Production** 의 `SUPABASE_URL` 에서
`https://<ref>.supabase.co` 의 `<ref>` 만 확인 (값 전체 · 키는 채팅에 올리지 않음).
⚠️ 환경변수를 바꾼 뒤 다시 배포하지 않았다면 화면 값과 현재 배포 값이 다를 수 있습니다.

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

### 조건 — 실제 접수 오픈
1. 운영 Supabase ref 확정(1장) → 0082~0084 적용 여부 확정(2장) · 필요하면 리허설 · 적용 · `db/verify.sql` ✅
2. 시험 데이터 정리(aboutmeat 이면) — 별도 승인
3. Vercel Production 환경변수: `SUPABASE_URL` · `SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_KEY`(운영 ref) ·
   알림(`INTAKE_WEBHOOK_URL` 또는 `RESEND_API_KEY` + `INTAKE_EMAIL_TO`/`_FROM`) · `CRON_SECRET` · 필요 시 `INTAKE_BUCKET`
4. 개인정보처리방침 수탁자(알림 · 메일 회사)를 같은 날 반영
5. `STOREWAY_ACCOUNTS_OPEN=1` (로그인 · 관리자) 과 `STOREWAY_INTAKE_OPEN=<양식>` (접수) — **따로** 승인 · 다시 배포
6. Supabase Auth → Redirect URLs 에 `https://storeway.co.kr` · 첫 관리자 계정 SQL
7. 운영에서 시험 접수 1건 → 접수번호 · 알림 수신 · 관리자 접수함 확인 → 정리
8. 마지막: 사업자 정보 · 운영 로그인 · 카카오

## 4. 실제 메일 로그인 · 알림 — 격리 Preview 준비 항목

1. 시험 Supabase 프로젝트 (운영과 다른 것 · 1장 확정 뒤 고름) — 0001~0084 적용 · `db/verify.sql` ✅
2. Vercel **Preview** 환경변수만(Production 과 분리): `SUPABASE_*`(시험 ref) · `STOREWAY_ACCOUNTS_OPEN=1` ·
   `STOREWAY_INTAKE_OPEN=quote,close`(시험) · `LOOKUP_OTP_ADAPTER=test` · `CRON_SECRET`(시험값)
3. 시험 수신처: 시험 전용 슬랙 웹훅(`INTAKE_WEBHOOK_URL`) 또는 시험 메일함(`INTAKE_EMAIL_TO`) — 실제 고객 · 업체에게 안 가는 곳
4. 시험 Supabase Auth → Redirect URLs 에 Preview 주소 · 매직링크 받을 시험 메일 셋(고객 · 업체 · 관리자)
5. Preview 보호가 켜져 있으면 우회 토큰 또는 열람 권한
6. 확인할 것: 매직링크 로그인 → `/my` · `/admin` · 신청 저장 · 접수번호 · 알림 수신 · 배정 → 견적 → 선택 → 계약금액 → 완료 · 취소
   (로컬에서 통과한 `tools/preview-e2e.js` 를 Preview 주소로 그대로 돌릴 수 있습니다 — 운영 주소면 스스로 멈춤)

## 5. 남은 항목

- 운영 Supabase ref 확정 (대표 · Vercel)
- 격리 Preview 에서 실제 메일 로그인 · 알림 확인
- **실기기 검수** (아이폰 · 갤럭시, 360급 포함) — 지금까지 Chromium 폭 조절로만 확인
- 후속 기능: 계약 후 금액 정정 · 직원 금액 열람 정책 · 서버 오류 문구
- 보류: main 병합 · 운영 배포 · DB · 환경변수 · 접수 활성화 · 사업자 정보 · 운영 로그인 · 카카오
