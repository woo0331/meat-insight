# W03 — 관리자 접수함 · 고객 본인 조회

작성 2026-11-18 · 표기 **[확인]** 실행해서 본 것 · **[미검증]** 못 본 것

브랜치 `claude/sharp-mccarthy-stiipn` · 커밋 넷 (W03-1 ~ W03-4) · main · 운영 DB · 운영 환경변수 · 배포 변경 없음.

## 1. 기존 기능 — 재사용 · 수정 · 신규

| 지시서 항목 | 있던 것 | 이번에 한 것 |
|---|---|---|
| 로그인 · 세션 · 역할 | `api/session.js` · `_auth.js` · `js/auth.js` (매직링크) — 2026-11-17 복구 때 **503 점검본으로 통째로 교체**돼 있었음 | **재사용** — 점검본을 스위치(`STOREWAY_ACCOUNTS_OPEN=1`)로 바꿈. 기본은 그대로 닫힘 |
| 매직링크가 운영에서 안 됨 (W00 발견) | 브라우저 → Supabase 직접 호출 · CSP `connect-src 'self'` 에 막힘 | **수정** — 같은 출처 `/api/auth` 대리 호출 (otp · refresh · logout 셋만) |
| 관리자 목록 | `/admin` 접수 · 배정 칸 (`js/intake.js`) · 접수번호 · 상태 · 담당자 · 접수일 · 상태 변경 · 항목별 배정 · 이력 | **재사용 + 신규 칸** — 신청 종류 · 가린 연락처 · 서비스 ID · 모은 상태 · 다음 행동 기한 · 중복 후보 · 알림 실패 |
| 연락처 열람 감사 | `note_request_open` (0012) — "연락처 보기" 를 눌러야 원문 · 기록 남음 | 재사용 (그대로) |
| 담당자 배정 · 상태 변경 · 이력 | `set_owner` · `move_state` · `audit_log` | 재사용 (그대로) |
| 상담 · 연락 시도 · 내부 메모 · 고객 공개 안내 | 없음 | **신규** `request_note` (memo · contact · public) + `add_request_note()` |
| 다음 행동 기한 | 없음 | **신규** `request.next_due` + `set_next_due()` |
| 부모 상태 = 하위 상태 반영 (T09) | 없음 (항목 상태는 있음) | **신규** `request_rollup()` |
| 고객 본인 조회 (로그인 회원) | `/my` + `claim_request` (번호+연락처로 계정에 잇기 · 로그인 필요) | 재사용 (그대로) |
| 고객 본인 조회 (비회원) | 없음 | **신규** 인증번호 조회 `/api/lookup` + `lookup_*` (0083) |
| `/my` 두 영역 구분 | 브라우저 기록 · 로그인 시 신청 내역 | **수정** — "본인 확인 후 조회하는 신청 내역" · "이 브라우저에 저장한 준비 기록" 제목으로 가름 |
| 내보내기 · 권한 변경 감사 | 내보내기 기능 없음 · 역할 변경은 SQL 로만 (화면 없음) | 해당 없음 — 만들지 않음 |

## 2. 데이터 구조 — `db/migrations/0083_storeway_inbox_lookup.sql` (운영 미적용)

| 지시서 논리 구조 | 실제 |
|---|---|
| ① 요청의 담당자 · 다음 행동 기한 | `request.owner_id`(0012 · 있음) · **`request.next_due`** |
| ⑤ 처리 이력의 내부/고객 공개 구분 | 상태 변경은 `audit_log`(있음) · 메모는 **`request_note.kind`** (memo · contact · public) |
| ⑦ 조회 인증 | **`lookup_challenge`** (인증번호 HMAC · 10분 · 사용 시각 · 실패 횟수) · **`lookup_session`** (토큰 해시 · 30분) |
| ⑧ 감사기록 | `audit_log` — 메모 본문 · 연락처 · 인증번호 · 토큰을 싣지 않음 |

함수: `set_next_due` · `add_request_note` (직원 · 관리자 · 감사 기록 같은 트랜잭션) · `admin_inbox_flags` (직원 · 관리자 · 목록 표시) · `request_rollup` · `lookup_start` · `lookup_verify` · `lookup_read` (service_role 전용).

- 표마다 RLS · 쓰기 권한 없음 · 운영 Supabase 기본 권한을 명시적으로 거둠.
- 메모는 고치거나 지울 수 없음 (기록) [확인].
- 번호가 0083 인 까닭 — 0082 와 같음 (운영 `schema_version` 의 골프 판 20~81).

### 기존 데이터 영향 · 백필 · 되돌리기

- 칸 추가(`next_due`)는 null 기본값이라 기존 줄이 안 바뀝니다. 새 표 셋은 비어서 시작합니다. 백필 없음.
- 되돌리기 (SQL 편집기 · 메모 · 조회 기록이 없을 때만 안전):
  ```sql
  begin;
  drop function if exists set_next_due(uuid, timestamptz, text), add_request_note(uuid, text, text, uuid, text),
    request_rollup(uuid), admin_inbox_flags(uuid[]), lookup_start(text, text, text),
    lookup_verify(uuid, text, text), lookup_read(text);
  drop table if exists lookup_session, lookup_challenge, request_note;
  alter table request drop column if exists next_due;
  delete from schema_version where n = 83;
  commit;
  ```
- ⚠️ 0082 다음에 돌립니다. `db/apply-from-0008.sql` 을 운영에 다시 붙여 넣지 않습니다.

## 3. 사용자 흐름 — 변경 전후

```
관리자
  전  목록: 번호 · 쪽 · 분류 · 업종 · 지역 · 상태 · 담당자 · 접수일 (연락처 없음)
  후  + 신청 종류 · 010-****-1234 · 서비스 ID · "서비스 2개 · 진행 1 · 완료 1" · 기한(지남은 붉게)
      · 중복 후보 n · 알림 실패
      펼치면 + 다음 행동 기한(한국시간) · 메모 / 연락 기록(결과 필수) / 고객 공개 안내("고객에게 그대로 보입니다")

고객 (비회원)
  전  자기 신청을 볼 길이 없음 (완료 화면의 접수번호 한 번뿐)
  후  /my → 접수번호 + 전화번호 → 그 번호로 인증번호 → 6자리 → 30분 동안
      접수번호 · 접수일 · 지금 상태 · 서비스별 상태 · 고객 공개 안내
      (성함 · 연락처 · 원문 · 내부 메모 · 업체 정보 없음)
```

## 4. 환경변수 (이름만)

| 이름 | 쓰임 | 없으면 |
|---|---|---|
| `STOREWAY_ACCOUNTS_OPEN` | `1` 이면 로그인 · 관리자 · 회원 경로가 실제로 돕니다 | 점검본 (전과 같음 · 운영 DB · 메일 · 웹훅 안 부름) |
| `SUPABASE_URL` · `SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_KEY` | 로그인 · 저장 · 조회 | 꺼짐 |
| `LOOKUP_OTP_ADAPTER` | `test` 는 **Preview · 로컬에서만**. 운영에서는 켜지지 않습니다 | 비회원 조회 꺼짐 (화면은 "아직 열리지 않았습니다") |
| `LOOKUP_HMAC_KEY` | 인증번호 HMAC 키 (없으면 service key 로) | — |

외부 비용 · 계약: **문자 발송사** (비회원 조회 인증번호) — 미정. 정해지면 `api/_lookup.js` 의 `send()` 에 한 갈래를 더하고 그날 방침의 수탁자(제26조 · 국외면 제28조의8)를 같이 고칩니다. Supabase Auth 메일 발송 (매직링크).

## 5. 검사 결과

| 검사 | 범위 | 결과 |
|---|---|---|
| `tools/test-w03.js` | 로컬 Postgres · 0001~0019 + 0082 + 0083 · **API(quote · lookup) → 로컬 Postgres E2E** | 58/58 [확인] |
| `tools/test-auth.js` | 점검본 스위치 꺼짐 9 · `/api/auth` 대리 호출 9 · 기존 | 293/293 (전에 14 실패 + 중도 멈춤) [확인] |
| `tools/test-admin.js` | 접수함 표시 · 기한 · 메모 셋 | 408/408 [확인] |
| `tools/audit-admin.js` | `/admin` 7폭 × 19상태 | 통과 [확인] |
| `tools/test-my.js` | `/my` 두 영역 · 본인 조회 닫힘 / 열림 × 1440 · 390 | 178/178 [확인] |
| `tools/test-gate.js` · `test-w02*` · `test-sql.js` | 회귀 | 47 · 45 · 39 · 512 [확인] |
| 되돌려 보기 | 조회에 성함 싣기 · 5회 잠금 빼기 · 스위치 늘 켜기 | 셋 다 잡힘 [확인] |

### T01 ~ T14

| | 결과 |
|---|---|
| T01 접수 중단 | 통과 (W01 · test-gate) |
| T02 정상 신청 | 통과 — API 저장 → 부모 1 · 하위 2 → 관리자 목록 표시 → 본인 조회 (로컬 E2E) |
| T03 중복 제출 | 통과 — 같은 키 재전송 한 건 |
| T04 DB 장애 | 통과 (W02 · test-w02-api) |
| T05 알림 장애 | 통과 (W02) · 정상 시 알림 작업 `sent` 기록 (E2E) |
| T06 입력 검증 | 통과 (W02) · 조회 API 의 번호 · 인증번호 꼴 검사 |
| T07 권한 격리 | DB 함수 · RLS 수준 통과 (고객은 메모 · 목록 표시 · 조회 표 접근 불가 · 토큰은 그 신청 하나만) · **실제 Supabase 계정 둘로는 미검증** |
| T08 조회 인증 | 통과 — 만료(10분 · 30분) · 재사용 · 5회 잠금 · 시간당 3회 · 같은 모양의 답 · 운영에서 시험용 어댑터 막힘 |
| T09 상태 집계 | 통과 — 하나 완료 · 하나 진행 → 진행 중 / 남은 것이 보류 → 보류 |
| T10 매물 · 입점 | 통과 (W02) |
| T11 반응형 | `/my` 1440 · 390 · `/admin` 7폭 통과 · 실제 휴대폰은 미검증 |
| T12 기존 기능 회귀 | `ship.js --check-only` 결과는 보고서 본문 |
| T13 정책 정합성 | **미완** — 보유기간 · 수탁자(문자 발송사 미정)는 대표 결정 대기 |
| T14 기본 측정 | **미구현** — 분석 이벤트 수집이 이 저장소에 없습니다 (개인정보 없는 집계를 새로 붙이는 일은 범위 결정 필요) |

## 6. 미검증 · 대기

- 실제 Supabase(PostgREST · Auth)를 거친 흐름 — 로컬은 RPC 를 Postgres 로 직접 실행해 대신했습니다.
- 매직링크 실제 메일 · Supabase Redirect URLs 등록.
- 문자 발송사 미정 → 운영 비회원 조회는 꺼진 채.
- 사진 업로드는 1차 제외 범위이고 브라우저가 Storage 로 바로 올리는 길이라 CSP 에도 막힘 (이번에 고치지 않음).
- 운영 반영에 필요한 승인: 0082 · 0083 적용 · `STOREWAY_ACCOUNTS_OPEN` · 첫 관리자 계정 SQL · 문자 발송사 계약 · 방침 수탁자.
