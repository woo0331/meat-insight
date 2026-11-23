# Preview 실제 검수 준비 (2026-11-23)

## 기록 — 운영 Supabase 프로젝트: **미확정**
- Vercel Production 의 `SUPABASE_URL` 은 **Secret 유형**이라 화면에서 값을 다시 볼 수 없습니다 (추가일 11-10).
- 참고 정황: aboutmeat(`gxjzlkvdbafzfjuunvyx`) 생성일은 11-17 이라 11-10 에 넣은 주소와 맞지 않습니다 — 그 뒤 수정이 없었다면 운영은 aboutmeat 이 아닙니다. **확정 근거는 아닙니다.**
- Production 목록에 보인 것: `SUPABASE_ANON_KEY` · `SUPABASE_URL` · `ADMIN_PASSWORD`. `SUPABASE_SERVICE_KEY` 가 **Project 탭에는 없습니다** — Shared 탭은 이 환경에서 읽을 수 없어 **미확인**입니다.
- 운영 DB 확인은 **보류**합니다 (근거 없음).

## 준비한 것 — `tools/preview-e2e.js`
Preview(실제 Vercel 함수) + 시험 Supabase(실제 DB)로 한 번에 돕니다.

| 단계 | 확인 |
|---|---|
| 안전장치 | 운영 주소면 멈춤 · `TEST_REF` 와 Preview 가 실제로 물린 Supabase ref 가 다르면 멈춤 (Preview 의 `/api/session` 에 직접 물어봄) |
| 로그인 | 시험 계정 다섯을 관리 API 로 로그인 — **메일을 보내지 않습니다** · 역할 확인 |
| ① 견적 신청 | 접수번호 · 같은 신청서 재전송은 같은 번호 |
| 배정 전 | 고객 본인만 봄 · 다른 고객 · 업체 A · B 안 보임 · 직원 목록에는 보임 |
| ② 관리자 | 확인 → 동의 없이 배정 거절 → 업체 A 배정 → A 만 보임 |
| ③ 업체 | B 수락 거절 · A 수락 → 상담 → 견적 |
| ④ 고객 | 상태 quoted · 수수료 칸 없음 · 다른 고객 선택 거절 · 본인 선택 |
| ⑤ 완료 | 협의 → 계약 → 완료 → 고객 화면 done |
| ⑥ 취소 | 다른 고객 취소 거절 · 본인 취소 |
| 캡처 | 고객 · 업체 A · 업체 B 의 `/my` (390px) |

⚠️ 관리자 화면(`/admin`)은 비밀번호(기본 인증)로 막혀 있어, 관리자 단계는 **같은 서버 주소(`/api/deal`)를 직원 계정으로** 부릅니다 — 화면 캡처는 빠집니다.
⚠️ 실제 알림: Preview 의 웹훅 · 메일 변수가 **격리된 시험 수신처**일 때만 의미가 있습니다. 아니면 Preview 에서 그 변수들을 비워 두세요 (모의 검증과 섞지 않기 위해).

## 막힌 것 — 필요한 항목만
| # | 항목 | 누가 |
|---|---|---|
| 1 | 이 작업 환경의 네트워크에서 `*.vercel.app` 이 **막혀 있습니다** (프록시 403) → Preview 주소 하나를 허용 목록에 추가 | 대표 승인 (환경 설정) |
| 2 | Preview 주소 · 보호가 켜져 있으면 **Protection Bypass for Automation** 값 | 대표 |
| 3 | Preview 환경변수(Production 과 분리): 시험 `SUPABASE_URL` · `SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_KEY` · `STOREWAY_ACCOUNTS_OPEN=1` · `STOREWAY_INTAKE_OPEN`(quote) | 대표 |
| 4 | 시험 Supabase 의 **service_role 키**를 이 검사에 넘길 길 (작업 환경 자격 증명으로 — 채팅에 붙이지 마세요) | 대표 |
| 5 | 시험 계정 다섯 (고객 둘 · 업체 둘 · 직원) — 시험 DB 에서 역할 · 업체 연결 · 업체 A 배정 가능 | 시험 DB 작업 (승인 후 제가 SQL 준비) |
| 6 | 시험 DB 가 aboutmeat 이라면 — 그 DB 가 **운영이 아니라는 확인**이 먼저 (위 "미확정") | 대표 |

---

## 쉽게 찾는 법

### A. `SUPABASE_SERVICE_KEY` 가 Production 에 들어가 있나 (Shared 탭)
1. Vercel → **meat-insight** → **Settings** → **Environments** → **Production** (지금 보시던 화면)
2. 아래 **Environment Variables** 에서 **Shared** 글자를 누릅니다 (Project 옆)
3. 목록에 **`SUPABASE_SERVICE_KEY`** 가 있는지 **이름만** 보세요
   - 있다 → 그 줄 오른쪽에 **Production** 이 적혀 있는지 확인
   - 없다 → Production 에는 서비스 키가 없는 것 (접수 저장이 안 되는 상태)
4. ⚠️ 값을 열거나 고치지 마세요 · 연필 · Save 는 누르지 마세요

### B. 운영 Supabase 가 어느 프로젝트인지 (값이 숨겨져 있을 때)
값은 다시 볼 수 없으니 **Supabase 쪽에서** 찾습니다.
1. supabase.com 로그인 → 왼쪽 위 **조직 이름**을 눌러 조직이 여러 개인지 봅니다
2. 각 조직의 프로젝트 목록을 봅니다 — 제가 아는 것은 `aboutmeat` 과 이름 없는 프로젝트(`igignylgzjphtnyxhhsd`) 둘뿐입니다
3. 다른 프로젝트가 있으면 그 프로젝트의 **Settings → General → Reference ID** 를 알려 주세요
4. 11월 10일 무렵에 연 프로젝트가 기억나시면 그것이 가장 유력합니다

### C. 그래도 모르겠으면 (확실하지만 변경이 필요한 방법)
`SUPABASE_URL` 을 **Plain(일반) 유형으로 다시 넣는 것** — 주소는 비밀이 아니라 그래도 됩니다. 다만 **운영 설정 변경 + 재배포**라 별도 승인 사항입니다. 승인하시면 순서를 따로 적어 드리겠습니다.
