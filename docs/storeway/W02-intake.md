# W02 — 접수 복구 (저장이 먼저 · 성공은 저장 뒤에만)

작성 2026-11-18 · 표기 **[확인]** 실행해서 본 것 · **[미검증]** 못 본 것

## 1. 바뀐 흐름

```
변경 전  화면 → api/quote.js → (DB 있으면) request insert → (따로) save_request_items
                              → 저장 실패해도 슬랙으로 보내고 "접수됐습니다" (번호만 없음)
                              → 슬랙 글에 성함 · 연락처 · 적은 내용 전부
변경 후  화면 → api/quote.js → 게이트(STOREWAY_INTAKE_OPEN + DB) 닫히면 503
                              → 검증 실패 400 (동의 · 연락처 · 서비스 id · 받지 않는 종류)
                              → submit_intake() / submit_apply() 한 번 (한 트랜잭션)
                                  실패 → 503 · 번호 없음 · 알림 없음 · "다시 보내 주세요"
                                  같은 멱등 키 → 먼저 받은 번호 (알림 다시 안 보냄)
                              → 저장 뒤 알림 (접수번호 · 종류 · 서비스 · 지역만)
                                  실패 → notify_job 에 failed · 재시도 시각 · 짧은 오류 코드
                              → 200 { ok, no }
```

## 2. 데이터 구조 — `db/migrations/0082_storeway_intake.sql` (운영 미적용)

| 지시서 논리 구조 | 실제 | 비고 |
|---|---|---|
| ① 요청 | `request` 재사용 + `form`(quote·sell·sos) · `listing_state`(review·approved·rejected) | 접수번호 `no` 와 내부 `id` 분리는 0001 부터 |
| ② 고객 연락정보 | `request.name · tel · email` 재사용 | ⚠️ 별도 표로 가르지 않음 — 0001 이 칸 단위 GRANT 로 이미 가림. 분리는 W03 판단 |
| ③ 서비스별 하위 요청 | `request_item` 재사용 (상태 칸 있음) | 변경 버전 칸은 아직 없음 |
| ④ 동의 증거 | **`consent_record`** 신규 | 종류 · 고지 버전 · 항목 · 목적 · 보유기간 · 동의/철회 시각 · 후속 업체(provider_id) 자리 |
| ⑤ 처리 이력 | `audit_log` 재사용 | 개인정보 없이 `form` · 항목 수만 |
| ⑥ 알림 작업 | **`notify_job`** 신규 | 상태 · 횟수 · 다음 시각 · 중복 방지 키(unique) · 오류 코드(120자) · 개인정보 칸 없음 |
| ⑦ 조회 인증 | — | W03 |
| ⑧ 감사기록 | `audit_log` 재사용 | |

함수(전부 `service_role` 만 실행 · anon · 회원 실행 권한 없음): `submit_intake(p jsonb)` · `submit_apply(p jsonb)` · `mark_notify(job, ok, err)` · `due_notify(limit)`.

⚠️ 번호가 0082 인 까닭 — 운영 `schema_version` 이 골프 판 20~81 을 갖고 있습니다 [확인].
⚠️ 운영 DB 에 같은 이름의 표 · 함수 · 제약이 없음을 읽기 전용으로 확인했습니다 [확인].
⚠️ 운영 Supabase 의 기본 권한(새 표에 anon 전 권한)을 고려해 새 표 권한을 명시적으로 거둡니다.

## 3. 기존 데이터 영향 · 백필 · 되돌리기

- 운영 `request` · `provider_apply` 는 **0건** [확인] — 백필할 것이 없습니다.
- 칸 추가는 기본값이 있어 기존 줄을 바꾸지 않습니다(`form` 기본 quote · `listing_state` null).
- 되돌리기(승인 시 SQL 편집기 · 0건일 때만 안전):
  ```sql
  begin;
  drop function if exists submit_intake(jsonb), submit_apply(jsonb),
    mark_notify(uuid, boolean, text), due_notify(int);
  drop table if exists notify_job, consent_record;
  alter table request drop constraint if exists request_listing_ck,
                      drop constraint if exists request_form_ck,
                      drop column if exists listing_state, drop column if exists form;
  delete from schema_version where n = 82;
  commit;
  ```
  ⚠️ 접수가 한 건이라도 들어온 뒤에는 동의 증거가 함께 지워지므로 되돌리지 말고 다음 번호로 고칩니다.
- ⚠️ 운영에 `db/apply-from-0008.sql` 을 다시 붙여 넣지 않습니다(0008~0019 는 이미 적용 · 0012 상품 씨앗이 다름).

## 4. 환경변수 (이름만 · 값은 적지 않습니다)

| 이름 | 쓰임 | 없으면 |
|---|---|---|
| `STOREWAY_INTAKE_OPEN` | 여는 양식 `quote,sell,join` | 전부 닫힘(503) |
| `SUPABASE_URL` · `SUPABASE_SERVICE_KEY` | 저장 | 열려 있어도 닫힘 |
| `INTAKE_WEBHOOK_URL` 또는 `RESEND_API_KEY`+`INTAKE_EMAIL_TO` | 운영자 알림 | 알림 작업이 `nowhere` 로 실패 기록 · 접수는 유지 |
| `RESEND_API_KEY` + `CUSTOMER_EMAIL_FROM` | 고객 접수 안내 메일 | 안 보냄(작업 `off` 실패 기록) |
| `CRON_SECRET` + `vercel.json` crons | 알림 재시도 `/api/notify-retry` | 재시도 안 돎(수동 확인) |

외부 비용 항목: Resend(메일 발송량) · Slack(웹훅 무료) · Vercel Cron(플랜) — 수탁자 등재 필요(제26조 · 국외 이전 제28조의8).

## 5. 검사 결과

| 검사 | 범위 | 결과 |
|---|---|---|
| `tools/test-w02.js` | 로컬 Postgres · 0001~0019 + 0082 | 45/45 — T02 · T03 · T04(원자성) · T05 · T06 · T10 · T07 일부 · 개인정보 |
| `tools/test-w02-api.js` | api/quote.js · notify-retry.js (가짜 DB · 웹훅) | 39/39 — T02 · T03 · T04 · T05 · T06 · T10 · 동의 글자 일치 · 고객 메일 규칙 |
| `tools/test-gate.js` | T01 | 31/31 |
| `tools/test-sql.js` | 옛 DB 검사 + 0082 | 511/511 |
| 되돌려 보기 | 저장 실패를 성공으로 · 알림에 성함 싣기 · CHECK 의 NULL | 셋 다 잡힘 |

⚠️ 검사가 잡은 실제 고장 둘: ① `request_listing_ck` 의 NULL 함정(검수 상태 없는 매물이 들어감) ② sos 접수가 DB 저장 뒤 500.

## 6. 미검증 · 대기

- 실제 Supabase(REST · PostgREST)를 거친 E2E — 로컬에는 PostgREST 가 없어 함수는 Postgres 로, API 는 가짜 응답으로 나눠 쟀습니다.
- 실제 웹훅 · 메일 발송.
- 동시에 같은 키 두 요청(unique_violation 분기) — 코드는 있으나 동시성으로 재지 못했습니다.
- 보유기간 문구는 양식 기준으로 저장됩니다 — 처리방침과의 불일치(W00 7절)는 대표 결정 대기.
