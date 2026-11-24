# Preview 준비표 — 시험 DB 가 생기면 바로 돌립니다 (2026-11-24)

> 이 문서가 `docs/PREVIEW_SETUP_ONESHOT-2026-11-23.md` 를 대신합니다. 그 문서는 `claude/qa-functional` 기준이었고,
> 지금 기준은 **`claude/contract-photo-review` 의 `da2914a1d`** (로컬 검수 완료본 · 게이트 22/22 · 로컬 E2E 88/88 · 핵심 70/70)입니다.

## 0. 지금 상태 (바꾸지 않은 것)

| 무엇 | 상태 |
|---|---|
| 운영 DB | 기록상 `igignylgzjphtnyxhhsd` · **지금 배포에 연결된 곳은 미확정** (`SUPABASE_URL` 이 Vercel Secret 이라 못 읽음) |
| 확정 방법 | **보류** — 운영 로그인 스위치를 켜거나 `SUPABASE_URL` 을 다시 저장하는 방법은 쓰지 않음. 스키마 판 번호만으로 정하지 않음 |
| 기존 Supabase 두 곳 | 그대로 (중지 · 삭제 안 함) |
| main · 운영 배포 · 운영 DB · 운영 환경변수 · 접수 | 안 건드림 (main = `4cfe56618`) |
| 사업자 정보 · 운영 로그인 · 카카오 | 마지막 단계 그대로 |

## 1. 적용할 브랜치

| 브랜치 | 커밋 | 쓰임 |
|---|---|---|
| `claude/contract-photo-review` | `da2914a1d` | **로컬 검수 완료본 — 보관만.** 더 올리지 않음 |
| `claude/preview-ready` | `da2914a1d` + 도구 · 이 문서 | **Preview 를 붙일 브랜치.** 화면 · API 코드는 `da2914a1d` 와 **한 글자도 같음** (더한 것은 `tools/` 의 검수 스크립트 · `docs/` 문서뿐이고, 화면 · `api/` 함수는 그대로라 Preview 동작은 `da2914a1d` 와 같음) |

Vercel Preview 주소는 대략 `meat-insight-git-claude-preview-ready-<팀>.vercel.app` 꼴입니다 — **Vercel 이 보여 주는 실제 주소**를 씁니다.

## 2. 시험 DB 확인 기준 — 넷 다 맞아야 씁니다

1. **새로 만든 Supabase 프로젝트**일 것. `gxjzlkvdbafzfjuunvyx`(aboutmeat) · `igignylgzjphtnyxhhsd` 는 **어느 쪽도 안 됩니다** (도구가 거절).
2. 그 프로젝트에 **신청 · 업체 데이터가 없을 것** — `db/test/preview-seed.sql` 이 다른 데이터가 있으면 멈춥니다.
3. **Preview 가 물린 ref 가 그 프로젝트**일 것 — 판정은 서버에게 묻습니다 (`/api/session` 의 주소 ref). 판 번호로 판정하지 않습니다.
4. 마이그레이션 0001~0084 를 다 돌렸을 것 — `db/verify.sql` 열세 줄 ✅ · `/api/admin-health` 남은 파일 0.

## 3. Preview 전용 환경변수 (이름 · 넣는 곳만 — 값은 채팅에 붙이지 않습니다)

넣는 곳: **Vercel → meat-insight → Settings → Environment Variables → Add**
→ **Environments: Preview 만** 체크 → **Preview Branch: `claude/preview-ready`**.
⚠️ Production · Development 는 체크하지 않습니다.

| 이름 | 값을 어디서 | 유형 |
|---|---|---|
| `SUPABASE_URL` | 시험 프로젝트 → Settings → API → Project URL | Plain |
| `SUPABASE_ANON_KEY` | 같은 화면 → anon / publishable | Plain |
| `SUPABASE_SERVICE_KEY` | 같은 화면 → service_role | **Secret** |
| `STOREWAY_ACCOUNTS_OPEN` | `1` | Plain |
| `STOREWAY_INTAKE_OPEN` | `quote` (매장 정리 상담까지 보시려면 `quote,close`) | Plain |
| `ADMIN_PASSWORD` | **시험용으로 새로 정한 값** — 운영 비밀번호 재사용 금지 | Secret |

**알림을 실제로 받아 볼 때만** (격리된 수신처일 때만 — 아니면 비워 둡니다):

| 이름 | 값을 어디서 | 받는 곳 |
|---|---|---|
| `INTAKE_WEBHOOK_URL` · `DEAL_WEBHOOK_URL` | 슬랙 → **새 시험 채널** 전용 워크플로 웹훅 | 시험 채널만 (운영 채널 웹훅 재사용 금지) |
| `RESEND_API_KEY` | Resend → API Keys → 시험용 키 새로 만들기 | Secret |
| `CUSTOMER_EMAIL_FROM` · `PARTNER_EMAIL_FROM` | Resend 기본 보내는 주소 또는 시험용 확인 도메인 | 시험 메일함만 |
| `CRON_SECRET` | 시험용으로 새로 정한 값 | 알림 재시도 검수 |

⚠️ 같은 이름이 **Preview(모든 브랜치)** 에 이미 들어 있으면 시험 신청 알림이 그쪽으로 나갈 수 있습니다 — 목록에 보이면 알려 주세요.
넣은 뒤 Preview 는 **브랜치에 커밋을 올려 새로 빌드**해야 값이 들어갑니다 (운영 영향 없음).

## 4. Redirect URL (매직링크가 Preview 로 돌아오게)

**시험 프로젝트** → Authentication → **URL Configuration**
- Site URL: Preview 주소 (`https://<preview 주소>`)
- Redirect URLs: `https://<preview 주소>/**`
⚠️ 운영 프로젝트의 URL Configuration 은 건드리지 않습니다.

## 5. 시험 계정 · 수신처

| 계정 | 역할 | 만드는 법 | 메일 |
|---|---|---|---|
| `e2e-cust1@example.com` · `e2e-cust2@example.com` | 고객 둘 | `SETUP_USERS=1 node tools/preview-e2e.js` | 안 나감 (관리 API 로 만듦) |
| `e2e-pva@example.com` · `e2e-pvb@example.com` | 시험 업체 A · B | 같음 → `db/test/preview-seed.sql` 이 업체 연결 · 배정 가능 | 안 나감 |
| `e2e-staff@example.com` · `e2e-admin@example.com` | 직원 · 관리자 | 같음 | 안 나감 |
| **대표님 시험 메일함 하나** | 실제 메일 링크 로그인 · 메일 알림 도착 확인 | Preview `/my` 에서 그 메일로 로그인 | **실제로 옴** — 운영 메일함과 다른 주소 권장 |

수신처: 시험 슬랙 채널 하나 · 위 시험 메일함 하나. 운영 채널 · 운영 메일함은 쓰지 않습니다.

## 6. 검수 차례 (시험 DB 가 생긴 뒤)

| # | 무엇 | 누가 · 어떻게 | 통과 기준 |
|---|---|---|---|
| 1 | 시험 프로젝트 마이그레이션 0001~0084 · `db/verify.sql` | 제가 (Supabase 연결) 또는 SQL 편집기 | 열세 줄 ✅ |
| 2 | **사전 점검** `node tools/preview-preflight.js` (새 도구 · 읽기만) | 제가 | 운영 주소 아님 · 기존 두 곳 아님 · Preview ref = 시험 ref · 접수 열림 · 판 다 돌림 · 알림 수신처 있다/없다 |
| 3 | 시험 계정 여섯 + `preview-seed.sql` | 제가 | 역할 다섯 · 업체 둘 연결 |
| 4 | **실제 메일 링크 로그인** — Preview `/my` 에서 대표님 시험 메일 입력 → 메일 도착 → 링크 클릭 → Preview `/my` 로 돌아와 로그인됨 | 대표님이 누르고 저는 화면으로 확인 | 메일이 옴 · 링크가 **Preview** 로 돌아옴(운영 아님) · 로그인 상태 |
| 5 | 그 계정을 시험 관리자로 올리고 `/admin` 접수함 확인 | 제가 (시험 DB 에만 SQL) | 접수함 · 1번 칸이 preview · 남은 마이그레이션 0 |
| 6 | 흐름 `node tools/preview-e2e.js` (+ `E2E_SWAP=1`) | 제가 | 신청 → 배정 · 수락 → 견적 · 선택 → 계약금액 저장 · 재조회 → 완료 / 취소 · 다른 고객 · 미배정 업체 차단 |
| 7 | **알림 도착** — 6의 신청 · 배정 · 선택마다 시험 채널 · 시험 메일함 도착 | 대표님이 보이는 것 알려 주시기 (또는 캡처) | 한 건당 한 번 · 성함 · 연락처 · 메일 없음 |
| 8 | 알림 재시도 — `CRON_SECRET` 없이 401 · 있으면 밀린 것 한 번만 | 제가 | 401 · 한 번만 도착 |
| 9 | 결과를 **실제 화면 / 서버 호출만 / 미검증** 셋으로 보고 | 제가 | — |

로컬에서 미리 같은 4~8을 흉내 내는 도구: `LOCAL_NOTIFY=1 node tools/local-stack.js` + `node tools/test-local-notify.js` — 알림이 컨테이너 안 시험 수신처(127.0.0.1:8972)로만 갑니다.

## 7. 대표님이 대시보드에서 직접 하실 것 (이것만)

1. **시험 전용 Supabase 프로젝트 하나 확보** — 무료 계정은 켜진 프로젝트 2개가 한도라 지금 두 곳으로 꽉 찼습니다.
   기존 두 곳은 중지 · 삭제하지 않기로 했으므로 → **Pro 로 올리기**(Organization → Billing) 또는 **다른 Supabase 계정/조직**에서 서울 리전으로 새로 만들기.
2. 그 프로젝트의 **service_role 키**는 채팅이 아니라 제가 띄우는 **자격 증명 카드**에 붙여 넣기 (Settings → API Keys 에서 복사).
3. Vercel Preview 환경변수 (§3) — `claude/preview-ready` 브랜치에만.
4. 시험 프로젝트 Redirect URL (§4).
5. (알림까지 보실 때) 시험 슬랙 채널 + 웹훅 · Resend 시험 키 · 시험 메일함.
6. Preview 가 로그인 보호로 막혀 있으면 Vercel → Deployment Protection → **Protection Bypass for Automation** 값을 이 작업 환경 변수 `VERCEL_BYPASS` 에 (세션 → 환경 → Environment variables). 시험 관리자 비밀번호도 같은 곳 `PREVIEW_ADMIN_PASSWORD`.

## 8. 실제 검수 결과 — 2026-11-24 **막혔습니다**

| 항목 | 결과 | 까닭 |
|---|---|---|
| 실제 메일 링크 로그인 | **미실행** | 운영과 분리된 시험 Supabase 가 없습니다 (켜진 두 곳이 한도 · 둘 다 쓸 수 없음 — 하나는 운영 기록, 하나는 기존 시험 데이터 · 도구가 둘 다 거절) |
| 시험 수신처 알림 도착 | **미실행** | 같은 까닭 + Preview 환경변수를 넣을 Vercel 접근이 이 작업 환경에 없습니다 |
| 로컬 대체 검수 | 이미 통과 (`da2914a1d`: 로컬 E2E 88/88 · 너비 바꿔 88/88 · 핵심 70/70) | 로컬 Supabase 흉내 + 로컬 수신처 — **실제 메일 · 실제 Vercel 아님** |
| 사전 점검 도구 | 만들고 거절 경로 확인 (아래) | 실제 Preview 는 없어 통과 경로는 흉내 응답으로만 확인 |

`tools/preview-preflight.js` 확인 — 값 없음 · 운영 주소 · 기존 ref 둘 · *.vercel.app 아닌 주소 → 전부 보내기 전에 멈춤(종료 2).
흉내 응답으로: 정상 → 통과 · 웹훅 있음 → ⚠️ · 마이그레이션 남음 → ❌ · Preview 가 다른 ref(운영 포함) → 멈춤.

## 9. 따로 남긴 일

- 운영자 알림의 "서비스" 줄에 서비스 key(`demolish/full`)가 그대로 보임 — 이름으로 바꾸는 별도 작업.
- `/api/admin-health` 는 `DEAL_WEBHOOK_URL` · `*_EMAIL_FROM` · `CRON_SECRET` 이 있는지 알려 주지 않음 — Vercel 목록에서 눈으로 확인.

## 10. 시험 대상 바뀜 · 대기 기록 (2026-11-24)

- **시험 대상 커밋: `claude/notify-service-name` 의 `e142ff43f`** (로컬 검수 완료본 · 전체 검사 22/22 · 로컬 알림 18/18).
  §1 의 `claude/preview-ready` 대신 이 브랜치에 Vercel Preview 환경변수를 겁니다 (Preview Branch: `claude/notify-service-name`).
  `0db6d5b57` 위에 운영자 알림 서비스명 한글화만 더한 것입니다.
- **확인할 것 셋** (시험 환경이 생기면 §6 차례로):
  1. 실제 메일 링크로 로그인 → 시험 DB 에서 관리자로 올린 계정으로 `/admin` 접수함 진입
  2. 시험 견적 제출 → 지정한 시험 수신처(시험 슬랙 채널 · 시험 메일함)에 알림 도착
  3. 알림의 "서비스" 줄이 한글 이름이고, 성함 · 연락처 · 메일 · 상담 내용이 없음
- **지금 상태: 대기.** Supabase 계정에 켜진 프로젝트가 여전히 둘(`gxjzlkvdbafzfjuunvyx` aboutmeat ·
  `igignylgzjphtnyxhhsd`)뿐이고 둘 다 시험용으로 쓸 수 없습니다 (도구가 거절). Preview 에 걸린 시험 환경변수도 없습니다.
  두 프로젝트는 중지 · 삭제하지 않았습니다.
- 대표님이 하실 일은 §7 그대로입니다 (시험 Supabase 확보 · service_role 키는 자격 증명 카드 · Vercel Preview 환경변수 ·
  Redirect URL · 시험 수신처).

## 11. 대기 확정 (2026-11-24 · 대표 확인)

- 대표 확인: **Supabase 무료 프로젝트 2개 한도로 새 시험 DB 를 만들지 못했습니다.**
- 그래서 **실제 메일 링크 로그인 · 관리자 접수함 진입 · 시험 견적 · 시험 수신처 알림 도착 · 알림 한글 서비스명 · 개인정보 미포함**의
  Preview 검수는 **시험 DB 를 확보할 때까지 대기**입니다 (전부 미검증).
- 기존 두 프로젝트(`gxjzlkvdbafzfjuunvyx` · `igignylgzjphtnyxhhsd`)와 운영 설정은 그대로 둡니다 — 중지 · 삭제 · 변경 없음.
- 시험 대상은 그대로 `claude/notify-service-name` 의 `e142ff43f` (로컬 검수 완료본 · 전체 검사 22/22 · 로컬 알림 18/18).
- 다시 시작하는 조건: 운영과 분리된 **새 시험 Supabase** (Pro 로 올리기 · 다른 계정 · 기존 하나를 비우는 결정 중 하나는 대표 판단)
  → 그 프로젝트 ID 를 주시면 §6 차례로 이어 갑니다.

## 12. 운영 SUPABASE_URL 수정일 대조 (2026-11-24 · 읽기 전용)

- 대표 확인: Vercel → All Projects → Environment Variables 에서 meat-insight 의 **Production `SUPABASE_URL` 은 Secret · Last Updated Nov 10**.
  (첨부 화면은 이 대화에 도착하지 않아 대표님이 적어 주신 값으로 대조했습니다.)
- 기존 기록과 같음: `PREVIEW_E2E_READY-2026-11-23.md` 도 추가일 11-10 으로 적었습니다.
- 대조:
  - `gxjzlkvdbafzfjuunvyx`(aboutmeat) 생성 2026-11-17. Supabase ref 는 만들 때 정해지므로 11-10 에 저장된 값이 그 ref 를 담을 수 없습니다.
  - Vercel 은 환경변수를 **배포할 때** 읽습니다. 지금 운영 배포(`4cfe56618`, 11-24)는 11-10 뒤라 11-10 값을 그대로 씁니다 — 그 뒤 수정이 없으므로 다른 값일 수 없습니다.
  - → 운영 배포가 aboutmeat 에 연결되어 있지 않다는 **정황** (§13 에서 확정에서 정황으로 낮춤).
- 남은 것 하나 — **다른 서비스**: 같은 목록(Last Updated 정렬)에서 **Nov 17 이후** 수정된 Supabase 관련 변수가 다른 프로젝트에 있는지.
  없으면 aboutmeat 을 쓰는 배포가 없다는 근거가 됩니다. 지난 24시간 aboutmeat 앱 요청도 0건(관리 도구 상태 확인뿐)입니다.
- 두 DB · 운영 설정은 그대로입니다.

### 12-1. 시각까지 대조 (같은 날)

- 대표 확인: Production `SUPABASE_URL` 행 **2026-11-10 18:50:02 KST** (캡처는 이번에도 대화에 도착하지 않아 적어 주신 값으로 대조).
- 그 시각이 Last Updated 정렬 화면의 값이라 **마지막 수정 시각**으로 읽습니다 — 그 뒤 수정이 있으면 그 행의 시각이 바뀝니다.
- 현재 운영 배포: `4cfe56618` 을 2026-11-24 에 main 으로 올려 **새로 빌드된 배포**이고, 운영 화면에서 그 커밋의 사진형 카드가 실제로 보이는 것까지 확인했습니다
  (기존 배포를 다시 띄운 것이 아님) → 11-10 18:50 이후 빌드라 그 설정을 읽었습니다.
- aboutmeat 생성 2026-11-17 04:13 UTC (= 13:13 KST) > 11-10 18:50 KST → 운영 배포가 aboutmeat 이 아니라는 **정황** (§13 에서 확정에서 정황으로 낮춤).
- 재사용은 **아직 미확정** — 다른 Vercel 프로젝트가 aboutmeat 을 쓰는지(11-17 이후 수정된 Supabase 관련 변수 유무)를 아직 못 봤습니다.

## 13. aboutmeat 재사용 검토 (2026-11-24 · 읽기 전용) — **조건부 · 미확정 하나**

> 대표 지시: Vercel 캡처의 11-10 은 **정황**으로만 적고, Last Updated 정렬로 행 날짜의 뜻이나 운영 DB 연결을 확정하지 않습니다.
> §12 · §12-1 의 "확정" 을 정황으로 낮췄습니다.

### 운영이 aboutmeat 을 쓰지 않는다는 쪽 (전부 정황)
| # | 근거 | 무엇을 봤나 |
|---|---|---|
| 1 | Production `SUPABASE_URL` 행 2026-11-10 18:50:02 KST · aboutmeat 생성 11-17 13:13 KST | 대표 확인 · Supabase 목록 — **행 날짜의 뜻은 미확정** |
| 2 | 운영이 지금 DB 를 부르지 않음 | `storeway.co.kr/api/session` = auth:false · restoration:true · 접수 넷 다 닫힘 |
| 3 | aboutmeat 에 앱 요청 없음 | 지난 24시간 edge_logs 3건 = Supabase 관리 도구 상태 확인뿐 (무료 요금제 로그 보관 1일 — 그 앞은 못 봄) |
| 4 | 데이터가 전부 시험용 | 판 84 · 업체 2(e2e-pv-a · b) · 신청 2(11-19) · 계정 4(전부 e2e-…@test.invalid · 로그인 기록 없음) |
| 5 | 대표가 시험용으로 지정 | `PROD_TARGET_CHECK-2026-11-23.md` |

### 다른 서비스 연결 (읽기 전용)
| 대상 | 결과 |
|---|---|
| `aboutmeat.vercel.app` (옛 MEAT INSIGHT 복구 테스트) | 페이지의 `SUPA_URL` = `https://aboutmeat-disconnected.supabase.co`(가짜 주소) · `test-guard.js` 가 Supabase 요청을 읽기 · 쓰기 모두 막음 → **aboutmeat DB 를 안 씀** |
| `aboutmeat.co.kr` · `www.*` | Vercel 이 storeway.co.kr 로 308 (CLAUDE.md 기록) — 따로 DB 를 부르는 사이트가 아님 |
| 이 저장소 코드 · 설정 | `gxjzlkvdbafzfjuunvyx` 는 시험 도구의 **차단 목록**에만 있음 |

### 미확인
1. **Production 이 실제로 담은 Supabase ref** — `SUPABASE_URL` 이 Secret 이라 값을 못 봄. (판정이 가장 확실한 길: 아래 ①)
2. Vercel 의 **다른 프로젝트** 환경변수 · Vercel 밖 서비스가 aboutmeat 키를 들고 있는지 — 이 작업 환경에서 볼 수 없음.
3. 하루보다 앞선 aboutmeat 접속 기록 (로그 보관 1일).

### ① 남은 판정 — 값을 바꾸지 않고 대표님이 보실 것
- Vercel → meat-insight → Settings → Environment Variables → Production **`SUPABASE_ANON_KEY`** 가 Secret 이 아니면 값이 보입니다.
  Supabase → aboutmeat → Settings → API Keys 의 **anon (legacy) 키 끝 6글자**와 같은지만 비교 (채팅에 붙이지 않음).
  - **다르면** Production 이 aboutmeat 에 물려 있지 않다는 근거가 됩니다 (anon 키는 프로젝트마다 다름).
  - 같으면 운영이 aboutmeat → 재사용 불가. Secret 이라 안 보이면 미확정 그대로.
- 다른 Vercel 프로젝트 목록에 `SUPABASE_*` 가 있는 프로젝트가 meat-insight 말고 있는지.

### ①이 통과하면 — Preview 전용 설정 순서 (각 단계 승인 뒤)
1. **[승인] 시험 데이터 정리** — aboutmeat 의 e2e 업체 · 신청 · 계정 정리안을 먼저 보여 드리고 승인 뒤 실행 (`preview-seed.sql` 이 기존 업체가 있으면 멈춤).
2. **[승인] 시험 도구 차단 목록 변경** — `tools/preview-e2e.js` · `tools/preview-preflight.js` 의 차단 목록에서 `gxjzlkvdbafzfjuunvyx` 를 빼는 커밋 (`igignylgzjphtnyxhhsd` 는 그대로).
3. 대표: Vercel 환경변수 **Preview 만 · 브랜치 `claude/notify-service-name`** — `SUPABASE_URL` · `SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_KEY`(aboutmeat 것) · `STOREWAY_ACCOUNTS_OPEN=1` · `STOREWAY_INTAKE_OPEN=quote` · 시험용 `ADMIN_PASSWORD` · 시험 채널 `INTAKE_WEBHOOK_URL` · `DEAL_WEBHOOK_URL`.
4. 대표: aboutmeat → Authentication → URL Configuration — Site URL · Redirect URLs 에 Preview 주소.
5. 대표: aboutmeat service_role 키는 자격 증명 카드에 · `VERCEL_BYPASS` · `PREVIEW_ADMIN_PASSWORD` 는 세션 환경 변수에.
6. 제가: Preview 빌드 → `tools/preview-preflight.js` (Preview 가 aboutmeat 에만 물렸는지) → §6 차례 (실제 메일 로그인 → /admin → 시험 견적 → 시험 수신처 알림 · 한글 서비스명 · 개인정보 없음).

두 프로젝트 · 운영 설정 · 차단 목록 · 시험 데이터는 그대로입니다.
