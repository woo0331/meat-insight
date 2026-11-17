# 골프올인원 · ABOUTMEAT 운영 분리 — 최종 실행서 (2026-11-17)

> 이 문서의 어떤 단계도 아직 실행하지 않았습니다. 운영 DB 변경과 도메인 이전은 대표자 승인 뒤에 합니다.

## 1. A안 (옛 MEAT INSIGHT 16개 표 잠금) — 최종 재확인 결과

| 확인 | 결과 (운영 DB · 2026-11-17 읽기만) |
|---|---|
| 지금 권한 상태 = `backup-before.sql` 이 되돌리는 상태 | **일치** — 14개 anon·authenticated 전 권한, consult_requests · supply_requests 는 anon 넣기·읽기 + authenticated 전 권한, 칸 단위 권한 0, RLS 꺼진 8개 동일, 정책 20개 |
| 16개 표를 쓰는 함수 · 보기 · 트리거 | 0 · 0 · 0 |
| 골프 쪽 기준값 (실행 뒤에도 같아야 함) | 공개 권한 91 · 정책 99 · 회원 2 |
| SQL 이 다루는 대상 | 위 16개 이름뿐 · 골프 표 · auth · 함수 이름 없음 |
| 로컬 재현 검증 | 적용 → 옛 표 읽기·쓰기·TRUNCATE 거절 · 골프 흉내 표 변화 없음 → `backup-before.sql` 로 원상태 |

**실행 순서 (승인 시 세션이 대신하거나 대표자가 SQL Editor 에서)**
1. Supabase → 프로젝트 → **Database → Backups** 에 오늘자 자동 백업이 있는지 확인 (없으면 그대로 진행해도 됩니다 — A안은 자료를 바꾸지 않고 권한만 바꿉니다)
2. 기준값 쿼리(SETUP-GUIDE ① 3번) → 91 · 99 확인
3. `rls-minimal.sql` 실행
4. 확인 쿼리 셋(파일 아래쪽) → 옛 표는 permission denied
5. 기준값 쿼리 다시 → 91 · 99 그대로
6. storeway.co.kr 메인 · 로그인 · 부킹 열림 확인
- **되돌리기:** `backup-before.sql` 실행 → 실행 전 권한 · RLS 로 복귀 (자료는 처음부터 바뀌지 않음)

## 2. new-project-baseline.sql — 최종 확인 결과

- 운영 프로젝트에서 읽은 **Supabase 실제 기본 권한**(postgres · supabase_admin 이 anon · authenticated · service_role 에 전부 줌)을 그대로 재현한 Postgres 에서 실행:
  - 새로 만든 표 · 보기 · 함수 · 시퀀스 → anon · authenticated **거절**
  - service_role(서버 전용) → **그대로 사용 가능**
  - 두 번 실행해도 오류 없음 · 자료를 만들거나 지우지 않음
- 표를 하나도 만들지 않으며 옛 자료를 옮기지 않습니다.
- 확인 쿼리를 postgres 기본 권한만 보도록 고쳤습니다(supabase_admin 줄은 바꿀 수 없고 우리 표와 무관).
- ⚠️ 새 프로젝트의 SQL Editor 에서만 실행 — 화면 왼쪽 위 프로젝트 이름이 `aboutmeat` 인지 먼저 확인.

## 3. 지금 도메인 연결 상태 — 세션이 실제로 확인한 것

`domain-before-2026-11-17.txt` (세션이 응답을 읽어 기록 · 아무것도 안 바꿈):

| 주소 | 지금 동작 |
|---|---|
| `storeway.co.kr` | **200 골프올인원** (기본 주소) |
| `www.storeway.co.kr` | 308 → storeway.co.kr |
| `aboutmeat.co.kr` | **308 → storeway.co.kr** (골프 프로젝트의 Redirect 설정으로 보임) |
| `www.aboutmeat.co.kr` | **200 골프올인원을 그대로 서빙** — 로그인 서버 기능(`/api/session`)까지 붙어 있음 |

모두 `server: Vercel` 입니다. 즉 aboutmeat 두 주소는 **골프 프로젝트의 Domains 에 붙어 있고**, 하나는 넘겨주기 · 하나는 직접 연결입니다.

### 대표자가 볼 화면 (확인만 · 아무것도 누르지 않음)
1. https://vercel.com/dashboard → **골프올인원 프로젝트**(저장소 `woo0331/meat-insight` 와 연결된 것)
2. **Settings → Domains**
3. 다음을 캡처해 주세요:
   - 줄 목록 — 위 넷이 보일 것입니다
   - `aboutmeat.co.kr` 줄: "Redirect to storeway.co.kr" 표시 여부 · 상태(Valid Configuration)
   - `www.aboutmeat.co.kr` 줄: 연결된 **Git Branch**(비어 있거나 Production) · 상태
   - `storeway.co.kr` · `www.storeway.co.kr` 줄: 어느 쪽이 Redirect 인지 · 상태
4. **Settings → Git** → Connected Git Repository 가 `woo0331/meat-insight` 인지
5. 새 **aboutmeat 프로젝트** → Settings → Domains → 지금은 `aboutmeat.vercel.app` 만 있어야 합니다

## 4. storeway.co.kr 유지 검증 계획 (도메인 이전 때)

**원칙:** 이전 작업은 골프 프로젝트에서 **aboutmeat 두 줄을 Remove 하는 것뿐**이고, storeway 두 줄 · Git · 환경변수 · 배포는 건드리지 않습니다.

| 시점 | 확인 | 누가 |
|---|---|---|
| 이전 직전 | `domain-check.sh` → before 저장 (2026-11-17 판은 이미 저장됨) · Vercel Domains 캡처 | 세션 · 대표자 |
| aboutmeat 두 줄 Remove 직후 | Domains 화면에 storeway 두 줄이 **그대로 Valid** 인지 | 대표자 |
| 직후 1분 | `domain-check.sh` → storeway 8줄이 before 와 **글자 하나까지 같은지**(diff) | 세션 |
| 새 프로젝트에 붙인 뒤 | aboutmeat.co.kr → ABOUTMEAT 테스트판 · www → 308 · `/api/session` 404 | 세션 |
| 브라우저 | storeway.co.kr 자물쇠 · 카카오 로그인 · 부킹 화면 · 폰에서 한 번 | 대표자 |

**storeway 판정 기준 (전후 같아야 함):** `storeway.co.kr/` 200 + 제목 「골프올인원」 · `/api/session` `"auth":true` · `robots.txt` · `sitemap.xml` 주소 528개 · `www.storeway.co.kr` → 308 storeway.co.kr

**하나라도 다르면:** 즉시 중단 → aboutmeat 프로젝트에서 두 줄 Remove → 골프 프로젝트에 원래대로 Add(1번 캡처대로) → 다시 확인.

**참고:** www.aboutmeat.co.kr 로 골프에 로그인해 쓰던 분이 있다면 이전 뒤 그 주소에서는 골프가 열리지 않습니다(storeway.co.kr 로는 그대로). 골프 Supabase 의 로그인 허용 주소(Redirect URLs)에 aboutmeat 주소가 있어도 storeway 동작에는 영향이 없습니다 — 정리는 나중에 해도 됩니다.

## 5. 이전 뒤 정리할 것 (각각 별도 승인)
- 골프 Supabase Auth → URL Configuration 의 Redirect URLs 에서 aboutmeat 주소 제거(있다면)
- 카카오 개발자 콘솔의 골프 앱에 aboutmeat 주소가 등록돼 있다면 제거
