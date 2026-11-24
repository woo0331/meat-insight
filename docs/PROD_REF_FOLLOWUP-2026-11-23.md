# 운영 DB 연결 · Preview 검수 후속 (2026-11-23)

기준 `claude/qa-functional` e654f1af0. 이번에도 읽기 전용입니다 — DB · 계정 · 환경변수 · 인증 · 접수 · 웹훅 · cron 변경 없음, main 병합 · 배포 없음.

## ① 운영 DB ref — **미확인**

| 확인하려던 것 | 결과 | 까닭 |
|---|---|---|
| 현재 Production 배포가 실제로 쓴 `SUPABASE_URL` | **미확인** | 이 환경에 Vercel CLI · 토큰 · Vercel 연동 도구가 없습니다. GitHub 도구도 배포의 환경값을 내주지 않습니다 |
| 환경변수 화면에 지금 보이는 값 | **미확인** | 같은 까닭 |
| 운영 사이트로 간접 확인 | 불가 | `/api/session` 이 `restoration:true` 라 주소를 안 냄 · 그 밖의 공개 주소는 DB 를 부르지 않음 |
| Supabase 로그로 간접 확인 | **결정 못 함** | 두 프로젝트 모두 지난 24시간 API 게이트웨이 기록(`edge_logs`)이 0건 — 운영이 지금 DB 를 아예 부르지 않는 상태와 맞지만, 어느 쪽인지는 가려 주지 않습니다 |

→ 배포 기준 확인 방법: Vercel → 프로젝트 → Deployments → 현재 Production 배포 → (배포 상세의) Environment Variables 또는 Settings → Environment Variables → Production 의 `SUPABASE_URL` 에서 `<ref>` 만.
⚠️ 환경변수를 바꾼 뒤 **다시 배포하지 않았다면** 화면 값과 배포 값이 다를 수 있습니다 — 배포 시각과 환경변수 수정 시각을 같이 보세요.

### 조건부 사전 확인 (읽기 전용 · 운영 확정 전)
**igignylgzjphtnyxhhsd 가 운영이라면** — 0082~0084 를 그대로 올릴 수 없을 가능성이 큽니다.
| 항목 | 값 |
|---|---|
| 판 번호 | 1~81 (이 저장소는 1~19 다음이 82) → **20~81 은 다른 줄의 마이그레이션** |
| `request` 칸 | 0082~0084 칸(`form` · `channel` · `src` · 결과 기록 등) 없음 · 대신 다른 줄의 칸(`archived_at` · `want_provider` 등) 있음 |
| `provider` 칸 | 다른 줄의 칸 다수(`is_test` · `state` · `kind` …) |
| 0082~0083 표(동의 기록 · 알림 큐 · 조회 인증 · 메모) | **없음** |
| 접수 저장 · 알림 · 조회 함수 | **없음** (`move_state` · `assign_item` · `approve_provider` 는 있음) |
| 상태 길 | 70 (0084 뒤에는 78) |
| RLS 꺼진 표 | 0 |
→ 적용 순서 · 선행 조건을 정하려면 **그 DB 의 스키마 사본(구조만)** 을 격리 Postgres 에 떠서 0082~0084 를 리허설해야 합니다. 이 환경에서는 그 DB 에 직접 접속할 수 없어(MCP 조회만) 사본을 뜨지 못했습니다.

**aboutmeat 이 운영이라면** — 시험 데이터 영향과 정리안은 `PROD_TARGET_CHECK-2026-11-23.md` 3장 그대로입니다.
| 별도 항목: 비노출 · 배정 제외 **뒤에도** 과거 신청이 보이는가 | 결과 (격리 리허설 · `tools/test-core.js` ⑧) |
|---|---|
| 그 업체 계정 | **보입니다** — 이미 배정된 지난 신청(연락처 포함)을 계속 봅니다. RLS 는 `assignment` 를 보고, 공개 · 배정 가능 여부는 보지 않습니다 |
| 새 배정 | 막힘 |
| 막으려면 | 계정 연결 끊기 `update account set role='customer', provider_id=null where provider_id like 'e2e-pv-%'` (별도 승인 · 되돌리기는 반대로) — 또는 시험 신청의 배정 줄 처리(기록이 바뀌므로 권하지 않음) |

## ② 실제 Preview 화면 검수 — **진행 못 함**

Preview 배포가 운영과 분리된 시험 Supabase 에 물려 있는지 확인할 수 없어 실제 브라우저 검수를 하지 않았습니다. **운영에서 대신 시험하지 않았습니다.**

| 구분 | 항목 | 상태 |
|---|---|---|
| 통과한 모의 · 격리 검사 | DB 흐름 신청→확인→배정→견적→조회·선택→계약→완료·취소 + 미배정 업체 · 다른 고객 차단 + 정리안 리허설 | ✅ `test-core` 70 · `test-s1` 62 (실제 Postgres · 가짜 auth) |
| | 화면 · 서버 (가짜 서버) | ✅ `test-admin` 423 · `test-my` 204 · `test-auth` 301 · `test-gate` 49 · `test-w02-api` 39 · `test-w02` 45 |
| | 알림 큐 · 재시도 · 중복 방지 · 개인정보 미포함 | ✅ 모의 |
| **미검증 (실제 화면)** | 고객 신청 화면에서 실제 저장 · 접수번호 | ❌ |
| | 실제 로그인(메일 링크) → `/my` · `/admin` | ❌ |
| | 관리자 배정 → 업체 화면 → 견적 → 고객 선택 → 계약 · 완료 · 취소 | ❌ |
| | 실제 브라우저에서 미배정 업체 · 다른 고객 차단 | ❌ |
| | 실제 알림 수신 | ❌ (격리된 테스트 수신처가 준비돼 있지 않음) |

### Preview 검수에 필요한 설정 · 권한만
1. Preview 배포 주소 (+ 보호가 켜져 있으면 우회 토큰 또는 열람 권한)
2. Preview 환경변수 (Production 과 분리): `SUPABASE_URL` · `SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_KEY` = 시험 프로젝트 값 · `STOREWAY_ACCOUNTS_OPEN=1` · `STOREWAY_INTAKE_OPEN`(시험용) · `LOOKUP_OTP_ADAPTER=test`
3. 시험 Supabase 의 Auth → Redirect URLs 에 Preview 주소
4. 로그인용 시험 메일 주소 셋 (고객 · 업체 · 관리자) — 매직링크를 받을 수 있어야 함
5. (선택) 알림 검증용 격리 수신처 — 시험 전용 슬랙 웹훅 또는 시험 메일함
6. 시험 프로젝트를 aboutmeat 로 쓴다면 — 그 프로젝트가 **운영에 물려 있지 않다는 확인**(①)이 먼저

## ③ 남은 차단 요인과 다음 작업
1. **운영 ref 확인** (Vercel Production — 대표 확인) → 그 결과로 아래가 갈립니다
   - aboutmeat → 시험 DB 와 운영 분리 결정 + 시험 데이터 정리안(작성됨) 승인 여부
   - igignylgzjphtnyxhhsd → 스키마 사본으로 0082~0084 리허설 → 적용 계획
2. **Preview + 시험 Supabase 연결** (위 1~5) → 실제 브라우저 검수
3. 그 뒤: 접수 · 웹훅 · cron · 계정 열기 → 사업자 정보 → 운영 로그인 · 카카오 (마지막)
4. 독립 배포 후보: `/join` 안내 — `claude/join-notice` 4f4afa8ee
