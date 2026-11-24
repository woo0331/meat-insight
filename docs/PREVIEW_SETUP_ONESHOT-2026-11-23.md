# Preview 실제 검수 — 한 번에 할 일 (2026-11-23)

> ⚠️ 2026-11-24 — 이 문서는 `docs/PREVIEW_READY-2026-11-24.md` 로 바뀌었습니다 (브랜치 `claude/preview-ready` · 기준 `da2914a1d`).

새 **시험 전용 Supabase** + Vercel Preview 의 **`claude/qa-functional` 브랜치에만** 연결합니다.
운영 DB · 운영 환경변수 · 접수 · 배포는 건드리지 않습니다. 비밀키는 채팅에 붙이지 않습니다.

## 제가 끝낸 것
| 무엇 | 파일 | 확인 |
|---|---|---|
| 실제 Preview + 시험 DB 검수 스크립트 | `tools/preview-e2e.js` | 운영 주소 거절 · Preview 가 물린 DB 가 시험 DB 가 아니면 거절 (둘 다 실행해 확인) |
| 시험 계정 다섯 자동 생성 (메일 안 나감) | 같은 파일 `SETUP_USERS=1` | — |
| 시험 DB 씨앗 (역할 · 시험 업체 둘 · 연결 · 배정 가능) | `db/test/preview-seed.sql` | 격리 Postgres 에서: 계정 없으면 거절 · 다섯 역할 · 업체 둘 · 두 번 돌려도 안전 · 다른 업체가 있으면 거절 |
| `/admin` 화면 검수 | 같은 스크립트 | 시험 관리자 비밀번호가 있을 때만 · 없으면 **미검증**으로 따로 적음 |

## 막힌 것 — 새 Supabase 를 못 만들었습니다
무료 계정은 **활성 프로젝트 2개**가 한도이고, 지금 `aboutmeat` · `igignylgzjphtnyxhhsd` 두 개가 켜져 있어 만들기가 거절됐습니다.
⚠️ 둘 중 하나가 운영일 수 있어서(운영 미확정) 제가 멈추거나 지우지 않았습니다.

---

## 대표님이 하실 일 (차례대로)

### ① Supabase — 자리 하나 만들기 (셋 중 하나)
- **가) 운영이 아닌 게 확실한 쪽을 일시정지** — Supabase → 그 프로젝트 → Settings → General → **Pause project**. 데이터는 남고 나중에 다시 켤 수 있습니다.
- **나) 유료 플랜(Pro)으로 올리기** — Organization → Billing.
- **다) 새로 만들지 않고 aboutmeat 을 시험용으로 쓰기** — 이 경우 "aboutmeat 은 운영이 아니다" 를 대표님이 확인해 주셔야 합니다 (11-19 시험 데이터가 들어 있어 씨앗이 거절합니다 — 정리 SQL 을 따로 드립니다).
→ 끝나면 "자리 만들었어" 라고만 알려 주세요. **제가** 새 프로젝트(서울)를 만들고 마이그레이션 0001~0084 와 씨앗을 넣습니다.

### ② 제가 띄우는 승인 창 둘 (채팅 아님)
- **자격 증명 카드**: 새 프로젝트의 `service_role` 키를 그 카드에 붙여 넣기
  - 어디서 복사: Supabase → 새 프로젝트 → **Settings → API Keys** → `service_role` (secret)
  - 그 키는 이 작업 환경에만 저장되고, 그 Supabase 주소로 가는 요청에만 붙습니다
- **네트워크 허용 창**: Preview 주소(`meat-insight-git-claude-qa-functional-woo0331s-projects.vercel.app`) 허용

### ③ Vercel — Preview 환경변수 (이 브랜치에만)
Vercel → meat-insight → **Settings → Environment Variables → Add Environment Variable**
- **Environments: Preview 만** 체크 → **Preview Branch: `claude/qa-functional`** 선택 (⚠️ Production · Development 체크 금지)

| Key | Value 를 어디서 | 유형 |
|---|---|---|
| `SUPABASE_URL` | 새 프로젝트 → Settings → API → Project URL | Plain 이어도 됨 |
| `SUPABASE_ANON_KEY` | 같은 화면 → `anon` / publishable | Plain 이어도 됨 |
| `SUPABASE_SERVICE_KEY` | 같은 화면 → `service_role` | **Secret** |
| `STOREWAY_ACCOUNTS_OPEN` | `1` | Plain |
| `STOREWAY_INTAKE_OPEN` | `quote` | Plain |
| `ADMIN_PASSWORD` | **시험용으로 새로 정한 값** (운영 비밀번호 재사용 금지) | Secret |

- ⚠️ 같은 이름이 **Preview(모든 브랜치)** 에 이미 있으면 이 브랜치용이 그것보다 우선합니다. 그래도 Preview 목록에서 `INTAKE_WEBHOOK_URL` · `DEAL_WEBHOOK_URL` · `CUSTOMER_EMAIL_FROM` · `PARTNER_EMAIL_FROM` · `RESEND_API_KEY` · `CRON_SECRET` 이 **보이면 알려 주세요** — 시험 신청 알림이 실제 채널로 나갈 수 있습니다.
- 다시 배포는 **제가** 그 브랜치에 커밋을 올려서 합니다 (Preview 만 새로 만들어짐 · 운영 영향 없음).

### ④ 이 작업 환경에 넣을 값 둘 (세션 제목줄 → 클라우드 환경 메뉴 → Edit → Environment variables)
| 이름 | 값 | 까닭 |
|---|---|---|
| `PREVIEW_ADMIN_PASSWORD` | ③ 에서 정한 **시험용** 관리자 비밀번호 | `/admin` 화면 검수 (없으면 미검증으로 남김) |
| `VERCEL_BYPASS` | Vercel → Settings → **Deployment Protection** → **Protection Bypass for Automation** → Add (생성된 값) | Preview 가 로그인 보호로 막혀 있을 때만 |
→ 넣은 뒤 **새 세션**에서 이어서 하면 읽힙니다.

### ⑤ 하지 마실 것
Production 환경변수 · 운영 Supabase · 접수 설정 · 운영 배포는 그대로 둡니다.

---

## 연결 뒤 제가 하는 것
1. 새 프로젝트에 마이그레이션 0001~0084 → 판 84 확인
2. `SETUP_USERS=1` 로 시험 계정 다섯 → `db/test/preview-seed.sql`
3. 브랜치에 커밋 → Preview 새로 빌드
4. `node tools/preview-e2e.js` — 견적 신청 → 배정 → 업체 견적 → 고객 선택 → 완료 / 취소 · 다른 고객 · 미배정 업체 차단 · 고객 · 업체 화면 캡처 · (비밀번호가 있으면) `/admin` 화면
5. 결과를 **실제 화면 검수 / 서버 호출만 / 미검증** 셋으로 나눠 보고
