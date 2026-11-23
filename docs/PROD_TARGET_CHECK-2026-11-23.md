# 운영 대상 확인 (읽기 전용) — 2026-11-23

이번 범위는 확인과 보고까지입니다. 어느 DB 도 고치지 않았고(select 만), 계정 · 접수 · 웹훅 · cron · 배포는 건드리지 않았습니다.

## ⚠️ 지난 보고 정정

`CORE_FLOW_VERIFY-2026-11-23.md` 가 `aboutmeat`(gxjzlkvdbafzfjuunvyx)를 **"운영 DB"** 라고 적었습니다.
대표님 말씀대로 그 프로젝트는 **시험용으로 지정한 것**이고, 운영이 그 프로젝트인지는 **확인되지 않았습니다**.
그 보고의 숫자(판 84 · RLS · 함수 · 가드 · 시험 데이터)는 **aboutmeat 의 값**입니다.

## 1. Vercel Production 의 SUPABASE_URL — **미확인**

이 환경에 Vercel CLI · 토큰 · Vercel 도구가 없어 Production 설정을 열람할 수 없습니다.
운영 `/api/session` 은 `restoration:true` 라(계정 기능 꺼짐) 주소를 내보내지 않습니다 — 밖에서 알아낼 길도 없습니다.

Supabase 계정에 보이는 프로젝트는 둘입니다.

| ref | 이름 | 판 번호 | 신청 · 업체 | 비고 |
|---|---|---|---|---|
| `gxjzlkvdbafzfjuunvyx` | aboutmeat (2026-11-17 생성) | **84** (1~19 · 82~84) | 2 · 2 (전부 시험) | 시험용으로 지정 · 지난 보고에서 검사한 곳 |
| `igignylgzjphtnyxhhsd` | (개인 계정 이름) (2026-03-14 생성) | 1~**81** (82~84 없음) | 0 · 0 | 다른 줄의 스키마(골프 · 구인 · 매물 등 표가 섞임) · 이 저장소의 82~84 가 없음 |

→ **확인 방법**: Vercel → 프로젝트 → Settings → Environment Variables → Production 의 `SUPABASE_URL` 에서 `https://<ref>.supabase.co` 의 `<ref>` 만 보시면 됩니다.
- `gxjzlkvdbafzfjuunvyx` 이면 → 시험용이 운영에 물려 있는 것이라 **분리가 먼저**입니다.
- `igignylgzjphtnyxhhsd` 이면 → 82~84 가 없어 **지금 코드와 맞지 않습니다** (접수 저장 `submit_intake` 등이 없음).
- 둘 다 아니면 → 이 계정에서 안 보이는 프로젝트라 그 프로젝트를 따로 확인해야 합니다.

## 2. aboutmeat 의 시험 데이터 (읽기 전용 · 지금 값)

| 대상 | 상태 |
|---|---|
| 판 번호 | 84 |
| 업체 `e2e-pv-a` | listed=true · assignable=true · 계정 1 연결 |
| 업체 `e2e-pv-b` | listed=true · assignable=true · 계정 1 연결 |
| 신청 `SW-DCKG-R4CR` | signed · 매장 정리 상담 · 2026-11-19 · 배정(e2e-pv-a) · 견적 open · 계약 줄(수수료 없음) |
| 신청 `SW-WTYB-YT6C` | lost · 매장 정리 상담 · 2026-11-19 · 배정(e2e-pv-a) · 견적 open |
| 알림 `ops_new` × 2 | **pending · 0회** · 보낼 시각 2026-11-19 (이미 지남) |

### 운영 공개 목록에 보이는가 — **안 보입니다**
- 공개 업체 목록은 DB 가 아니라 `js/data/providers.js`(지금 0곳)로 빌드한 정적 HTML 입니다.
- 운영 `/providers` · `/providers/demolish` · `sitemap.xml` 에 `e2e-pv` 0건, `/p/e2e-pv-a` · `/p/e2e-pv-b` 는 404.
- DB 의 `provider` 표는 **로그인한 직원 · 관리자의 배정 고르개**와 업체 자기 줄에서만 읽힙니다 → 이 DB 를 운영에 물리고 계정을 켜면 **배정 고르개에는 둘이 뜹니다.**

## 3. 기록을 보존하며 막는 방법 (제안 · 실행 안 함)

### 적용 대상
`gxjzlkvdbafzfjuunvyx` 가 Production 에 물려 있다고 확인된 경우에만. 업체 2 · 알림 2. **신청 · 배정 · 견적 · 계약 줄은 지우지 않습니다.**

### SQL (Supabase SQL Editor · 한 트랜잭션)
```sql
begin;
-- 관리자 세션으로 (가드가 로그인 없는 변경을 막습니다 — 리허설에서 확인)
select set_config('request.jwt.claims',
  json_build_object('sub', (select id from account where role='admin' limit 1), 'role','authenticated')::text, true);

-- ① 업체 둘: 비노출 · 배정 제외 (감사 기록이 같이 남음)
select approve_provider('e2e-pv-a', false, null, '시험 업체 — 비노출 · 배정 제외 (2026-11-23)', false);
select approve_provider('e2e-pv-b', false, null, '시험 업체 — 비노출 · 배정 제외 (2026-11-23)', false);

-- ② 시험 알림 둘: 보내지 않음으로 보류 (due_notify 가 pending · failed 만 꺼냄)
update notify_job set status = 'gave_up', last_error = 'test-data hold 2026-11-23', updated_at = now()
 where status = 'pending'
   and request_id in (select id from request where no in ('SW-DCKG-R4CR','SW-WTYB-YT6C'));

-- 확인
select id, listed, assignable from provider where id like 'e2e-pv-%';
select kind, status, last_error from notify_job
 where request_id in (select id from request where no in ('SW-DCKG-R4CR','SW-WTYB-YT6C'));
commit;
```

### 예상 영향
| 무엇 | 영향 |
|---|---|
| 손님 화면 | 없음 (공개 목록은 정적 HTML) |
| 관리자 배정 고르개 | 둘이 **잠긴 채** 보임 · DB 트리거가 새 배정을 거절 |
| 지난 기록 | 신청 2 · 배정 2 · 견적 2 · 계약 1 · 동의 2 · 감사 기록 그대로 |
| 알림 | 재발송(cron)을 켜도 두 건은 안 나감 · 서버가 직접 보내려 해도 `skip` |
| 감사 기록 | 업체 변경 2줄(누가 · 왜) — 알림 보류는 감사 기록이 없어 `last_error` 에 사유를 남김 |
| **남는 것** | 시험 업체 **계정 2개는 그대로 연결**되어 있어, 계정 기능을 켜면 그 계정으로 로그인해 지난 시험 신청(시험 연락처 포함)을 볼 수 있습니다 → 끊으려면 `update account set role='customer', provider_id=null where provider_id like 'e2e-pv-%';` (별도 승인 · 되돌리기는 같은 줄을 반대로) |

### 되돌리기
```sql
begin;
select set_config('request.jwt.claims',
  json_build_object('sub', (select id from account where role='admin' limit 1), 'role','authenticated')::text, true);
select approve_provider('e2e-pv-a', true, null, '시험 업체 비노출 되돌림', true);
select approve_provider('e2e-pv-b', true, null, '시험 업체 비노출 되돌림', true);
update notify_job set status = 'pending', last_error = null, next_at = now(), updated_at = now()
 where status = 'gave_up' and last_error = 'test-data hold 2026-11-23';
commit;
```
⚠️ 배정 가능 되돌리기는 **계정이 연결돼 있어야** 됩니다(0018). 위의 계정 끊기를 했다면 계정을 먼저 다시 잇습니다.

### 미리 돌려 본 결과 (격리 DB · `tools/test-core.js` ⑧)
로그인 없는 SQL 은 거절 · 관리자 세션으로 비노출 · 배정 제외 · 기록 보존 · 감사 기록 1 · 새 배정 거절 ·
보류 전 보낼 목록에 있음 → 보류 후 안 꺼냄 · 서버가 보내도 skip · 되돌리기 두 가지 복구 — **전부 통과 (70/70)**.
⚠️ 격리 DB 의 가짜 auth 는 `request.user` 로 사용자를 바꾸고, 진짜 Supabase 는 `request.jwt.claims` 를 읽습니다(운영 `auth.uid()` 정의를 읽어 확인). 그래서 SQL 의 **첫 줄만** 리허설과 다릅니다.

## 4. 시험 Supabase + Preview 로 이어 붙인 확인 — **진행 못 함**

- 시험 Supabase 는 aboutmeat 로 지정되어 있지만, **Preview 배포가 그것에 물려 있는지** 확인할 수 없습니다(Vercel 열람 불가).
- 그래서 실제 화면 → 실제 DB 를 이어 붙인 확인은 하지 않았습니다. 지금까지의 검증은 —
  - DB: 격리 Postgres (test-core 70 · test-s1 62 · test-sql)
  - 화면 · 서버: 가짜 서버 (test-admin 423 · test-my 204 · test-auth 301 · test-gate 49 · test-w02-api 39 · test-w02 45)
- **실제 알림 수신은 검증한 적이 없습니다.** 지금까지는 전부 모의(가짜 웹훅 · DB 큐 상태)입니다.
- 진행하려면: Preview 환경변수에 aboutmeat 의 `SUPABASE_*` · `STOREWAY_ACCOUNTS_OPEN=1` · 시험용 접수 열기 · `LOOKUP_OTP_ADAPTER=test` 가 들어가 있는지 확인(또는 설정 승인) + Preview 주소.
