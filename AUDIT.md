# 현황 감사표 — 3차 지시서 §1

> 2026-11-03 · 기억이 아니라 **파일에서 뽑은 증거**입니다.
> 판정 — ✅ 실제 동작 · 🟡 부분 동작 · 🖥 UI만 있음 · ❌ 없음

⚠️⚠️ **먼저 알려 드릴 것 — "실제 동작" 의 뜻.** 아래 ✅ 는 **DB 와
화면과 검사가 다 있다**는 뜻이지, **운영에서 손님이 쓸 수 있다**는
뜻이 아닙니다. 지금 운영은 —

```
운영 Supabase    0001~0007 만 돌아가 있습니다 (0008~0037 은 안 올렸습니다)
Vercel 환경변수  SUPABASE_URL · ANON_KEY 가 없습니다
→ 그래서 손님 화면의 로그인 · 입점 신청 · 매칭 요청은 전부
  "아직 열지 않았습니다" 로 나옵니다.
```

즉 **코드는 섰고 운영은 안 켜져 있습니다.** 이 둘을 섞어 보고하지
않겠습니다.

---

## 1. 바탕

| 무엇 | 어디 | 판정 |
|---|---|---|
| 정적 화면 23장 | `build.js` 가 `pages/*.js` 에서 찍습니다 | ✅ |
| 배포 | Vercel 이 `main` 을 봅니다 · `vercel.json`(주소 · 캐시 · 보안 헤더) | ✅ |
| 서버 함수 | `api/upload.js` · `api/session.js` · `api/gone.js` | ✅ |
| 인증 | Supabase Auth 메일 링크 · `js/auth.js` · `api/session.js` | ✅ |
| RLS | 표마다 정책 · 쓰기는 **문(function)** 으로만 | ✅ |
| 스토리지 | `INTAKE_BUCKET` · `js/photo.js` · DB 0011 | 🟡 버킷 미설정이라 칸이 안 그려집니다 |
| 마이그레이션 | `db/migrations/0001~0037` · 붙여넣기용 `db/apply-from-0008.sql` | ✅ |
| 검사 | `node tools/ship.js` — 21 묶음 (SQL 455건 · 로그인 화면 262건 포함) | ✅ |

## 2. 회원 · 업체 계정 (§2)

| 지시서 항목 | 지금 | 증거 | 판정 |
|---|---|---|---|
| 역할 — 고객 · 업체 · 직원 · 관리자 | `app_role` enum 넷 | `0001_init.sql` | ✅ |
| 한 계정에 **복수 역할** | 개인판매자 · 프로 · 사업자를 **모자(hat)** 로 겹쳐 답니다 | `account_hat`(0025) · `has_hat` · `add_my_hat` · `my_hats` | ✅ |
| 업체 1곳에 **복수 담당자** | `account.provider_id` 에 unique 가 없어 **여러 계정이 한 업체를 가리킬 수 있습니다** | `0001_init.sql` account | 🟡 자리는 되는데 **초대 길이 없습니다** |
| 담당자 **초대** | 관리자가 SQL 을 손으로 돌립니다 | `0018` 머리말이 그 SQL 을 안내합니다 | ❌ |
| 업체 1곳이 **여러 카테고리 · 서비스** | `provider.subs text[]` — 하위 키를 여러 개 | `0001_init.sql:91` · `amProviderCats()` | ✅ |
| 업체 프로필(상호 · 소개 · 지역 · 영업시간 · 규모 · 브랜드) | 있습니다 | `provider` + 0023 의 `scale` · `brands` | ✅ |
| 사업자 확인 상태 | `provider.verified jsonb` — **플랫폼만** 켭니다 | `provider_guard()`(0030) | ✅ |
| 프로 자격증명 검토 흐름 | 모자(`pro`)는 **스스로** 답니다 — 검토가 없습니다 | `add_my_hat` | 🟡 **미검증 프로에 배지를 안 주는 것**은 지켜집니다 |
| 등록 상태 draft→submitted→under_review→approved/rejected/**suspended** | 신청 깔때기는 `apply_state`(new·called·done·drop), 업체 자체는 `listed`·`assignable` **불리언 둘** | `0016` · `0027` · `0012` | 🟡 **under_review · suspended 가 없습니다** |
| 상태 변경의 **이유 · 담당자 · 시각** 기록 | `audit_log` 에 남습니다 | `approve_provider`(0018) | ✅ |
| 승인된 업체만 공개 노출 | 공개 보기의 where 가 자물쇠 | `v_provider_card`(0032) `listed=true and is_test=false` | ✅ |
| 업체 0곳일 때 빈 상태 + 무료 입점 안내 | 화면이 0곳이라고 말하고 `/join` 을 냅니다 | `pages/home.js` providers() | ✅ |
| 서류 원본 비공개 저장 | 비공개 버킷 · 보기 주소는 10분짜리 | `js/photo.js` · `api/upload.js` · 0011 | 🟡 버킷 미설정 |
| 주민번호 미수집 | 받는 칸 자체가 없습니다 | `request` · `provider_apply` 칸 목록 | ✅ |

## 3. 업체 대시보드 (§3)

| 항목 | 증거 | 판정 |
|---|---|---|
| 배정 받은 요청 · 수락 · 거절 | `/desk` · `js/desk.js` · `answer_assignment`(0001) | ✅ |
| 견적 제출 · 수정 · 철회 | `submit_quote` · `withdraw_quote`(0008) | ✅ |
| 상담 일정 | `appointment`(0034) · `set_appointment` · `move_appointment` | ✅ |
| 사진 · 서류 보기 | `js/photo.js` · 0011 | 🟡 버킷 미설정 |
| 수수료 · 정산 보기 | `js/deskfee.js` · `fee_policy` · `settlement` | ✅ |
| 후기 답변 | `reply_review`(0037) | ✅ |
| 다중 서비스 **등록 · 수정** | `save_provider_self`(0014→0023)가 `subs` 를 고칩니다 | ✅ |
| 수신 지역 · 카테고리 · 알림 선호 | `provider.regions` · `gu` · `subs` 로 좁힙니다 · **알림 선호는 없습니다** | 🟡 |
| 업체별 접근 통제 (남의 요청 · 견적 · 고객 못 봄) | RLS + `my_provider()` · 검사가 눌러 봅니다 | `tools/sql/quote.js` · `review.js` | ✅ |
| 활동 통계 | 업체용 통계 화면이 없습니다 (관리자용 지표만) | ❌ |

## 4. 고객 검색 · 상세 (§4)

| 항목 | 증거 | 판정 |
|---|---|---|
| 분류 10 · 하위 62 | `js/data/catalog.js` · `amCatUrl()` | ✅ |
| 지역 거르개 | `js/search.js` · `amProviderRegions()` | ✅ |
| 업체 상세 | `/pro/<id>` · `pages/provider.js` | ✅ |
| **확인된 후기만** 노출 | 0037 — 견적을 고르거나 만난 사람만 씁니다 | ✅ |
| 0건일 때 다른 길 제공 | 분류 화면 · 업체 화면이 그렇게 말합니다 | ✅ |
| 매칭 보장 안 함 | "바로 이 업체로 간다는 약속은 아닙니다" | ✅ |
| 정렬 기준 명시 | 견적은 **낸 차례대로**라고 적습니다. **업체 목록의 정렬 기준은 안 적혀 있습니다** | 🟡 |
| 스폰서에 **광고 표시** | `v_ad_live` 가 `'광고'` 라벨을 함께 냅니다 | ✅ |
| 업체 정보 **갱신일** 표기 | 없습니다 | ❌ |
| 가격 거르개 | 업체에 가격 칸이 없습니다 (견적으로 받습니다) | ❌ 설계상 없음 |

## 5. 통합 견적 · 매칭 (§5)

| 항목 | 증거 | 판정 |
|---|---|---|
| 신청 양식(분류 · 지역 · 일정 · 예산 · 설명 · 첨부 · 연락 · 동의) | `/match` · `js/matchform.js` · `make_request`(0029→0035) | ✅ |
| **접수 동의와 제3자 제공 동의를 가름** | `make_request` 가 `agree3rd_at` 을 **비운 채** 넣고, 배정할 때 상호를 알리고 다시 받습니다 | `js/assign.js` · 0029 머리말 | ✅ |
| 동의 없이 연락처 전달 금지 | 배정 문이 `agree3rd_at` 없으면 거절 | `tools/sql/match.js` 가 눌러 봅니다 | ✅ |
| 후보 0곳이면 솔직히 말함 | 화면이 그대로 말합니다 | `pages/home.js` · `/match` | ✅ |
| 파일 크기 · 확장자 검증 | `api/upload.js` OK_MIME · MAX_BYTES + DB CHECK(0011) | ✅ |
| 중복 요청 방지 | `request.idem` | ✅ |
| **rate limit · 자동화 남용 방어** | `make_request` 가 ① 같은 번호 10분에 한 건(0029) ② **하루 20건**(0041)을 막습니다 · ⚠️ 번호를 바꿔 가며 넣는 것은 **못 막습니다**(IP 를 안 받습니다 — 받으면 처리 항목이 늡니다) | 🟡 |
| 익명화 요약으로 관심 표시 | 없습니다 (배정 전에는 업체가 요청을 아예 못 봅니다) | ❌ |
| 고객이 요청 취소 · 수정 | `cancel_request`(0039) · `/my` 의 단추 · ⚠️ 계약 뒤에는 혼자 못 거둡니다(고객센터로) · **수정은 아직 없습니다** | 🟡 |
| 제공 이력 확인 | `/my` 의 **연락처를 전달한 업체** 줄 — 전달한 때 · 철회한 때 · 까닭이 남습니다(0039) | ✅ |

## 6. 제안 비교 · 상담 (§6)

| 항목 | 증거 | 판정 |
|---|---|---|
| 가격 · 범위 · 기간 · 유효기간 · 조건 제출 | `quote`(0008) — amount · vat · scope · excludes · days · start_on · warranty · valid_to | ✅ |
| 표준 항목으로 **나란히 비교** | `/my` · `js/myreq.js` | ✅ |
| 선택 | `choose_quote`(0008) | ✅ |
| 거절 · 추가 질문 | **없습니다** (고른 것 말고는 `passed` 로만 바뀝니다) | ❌ |
| 상태 전이 | `deal_state` 13개 — new·check·assigned·accepted·consult·quoted·nego·signed·done·hold·lost·fee_wait·fee_done | ✅ |
| **disputed(분쟁)** | `report`(0040) 의 `kind='dispute'` — ⚠️ **상태(enum)로 안 만들었습니다**: ① `alter type ... add value` 는 같은 트랜잭션에서 못 씁니다(임시 Postgres 에 돌려 보고 확인) ② 상태로 두면 `signed` 였는지 `done` 이었는지가 **덮여 사라집니다.** 손님은 `/my`, 업체는 `/desk` 에서 열고 운영자가 `/admin` 에서 처리합니다 | ✅ |
| 전이마다 권한 검사 · 이벤트 로그 | `move_state`(0004→0007) + `audit_log` | ✅ |
| 동시 요청 일관성 | `unique`(request_id, provider_id) · `on conflict` | ✅ |
| 플랫폼 밖 계약을 매출로 안 셈 | `biz_metrics`(0033)가 **거래액과 플랫폼 수익을 가릅니다** · 광고 · 멤버십은 "적어 둔 금액" 이라 **더하지 않습니다** | ✅ |

## 7. 중고채 매입 견적 (§7)

❌ **없습니다.** 앞 서비스(중고폰)의 `device` · `device_check` ·
`device_cost` · `device_move` · `v_device_pl` 은 **0024 가 전부
지웠습니다** (`0024_golf_reset.sql:45~52`). 지금 중고 골프채는
`/cat/used` 분류와 일반 매칭 요청으로만 받습니다. §13 에서 **P1** 입니다.

## 8. 관리자 (§8)

| 항목 | 증거 | 판정 |
|---|---|---|
| 신규 업체 심사 | ⚠️⚠️ **감사 중에 고쳤습니다.** 처음에 ✅ 로 적었다가, `approve_provider` 를 **부르는 화면이 한 곳도 없다**는 것을 `grep` 으로 확인했습니다 — 문만 있고 운영자가 쓸 자리가 없어 SQL 편집기를 열어야 했습니다. 지금은 `/admin` 의 `js/adminpro.js` 가 부릅니다 | ✅ (0038 에서 메움) |
| 고객 요청 · 배정 | `js/assign.js` | ✅ |
| 매각 지표 | `biz_metrics`(0033) · `js/metrics.js` | ✅ |
| 수수료 · 광고 · 멤버십 | `js/adminbiz.js` · 0007 · 0026 · 0036 | ✅ |
| 후기 가리기 | `hide_review`(0037) | ✅ |
| 감사 로그 | `audit_log` — ⚠️ 성함 · 연락처를 **안 넣습니다** | ✅ |
| 확정 수익 / 미확정 / GMV 가름 | `biz_metrics` 가 `cannot` 으로 **못 내는 것까지 말합니다** | ✅ |
| 관리자 역할 **세분화** | `staff` 와 `admin` 둘뿐 | 🟡 |
| 민감정보 **마스킹** | 후기 작성자만 마스킹합니다 (`v_review_public`) · 관리자 화면은 날것 | 🟡 |
| 신고 · 분쟁 | `/admin` 의 `js/adminrep.js` — `open_report` · `move_report`(0040) · ⚠️ **끝낼 때 어떻게 처리했는지를 반드시** 받습니다(문 · CHECK 둘 다) · ⚠️⚠️ **업체는 제게 들어온 신고를 못 읽습니다** | ✅ |
| 과금 · 결제 연동 | **없습니다** — 광고 · 멤버십은 "적어 둔 금액" 이라고 화면이 말합니다 | ✅ 지시서대로 꺼 둔 상태 |

## 9. 데이터 모델 (§9) — 지시서가 요구한 표와 지금

| 지시서 | 지금 | |
|---|---|---|
| users/profiles | `auth.users` + `account` | ✅ |
| account_roles | `account.role` + `account_hat` | ✅ |
| businesses | `provider` | ✅ |
| business_members | `account.provider_id` + `account_hat`(0025) — ⚠️ **초대 화면이 없습니다**(`grant_hat` · `has_hat` · `linked_providers` · `set_owner` 를 부르는 자리가 0곳 — `tools/check-doors.js` 가 셉니다) | 🟡 |
| business_verifications | `provider.verified jsonb` (이력 없음) | 🟡 |
| service_categories | `js/data/catalog.js` (코드에 있습니다 — DB 표가 아닙니다) | 🟡 |
| business_services | `provider.subs text[]` | 🟡 배열이라 서비스별 조건을 못 답니다 |
| service_areas | `provider.regions` · `gu` | 🟡 |
| customer_requests | `request` · `request_item` | ✅ |
| request_consents | `request.agree_at` · `assignment.agree3rd_at` · `revoked_at` · `revoked_why`(0039) — 칸으로 두지만 **철회 이력이 남습니다** | 🟡 |
| request_matches | `assignment` | ✅ |
| provider_proposals | `quote` | ✅ |
| conversations/messages | **없습니다** | ❌ |
| deal_events | `audit_log` + `deal_move` | ✅ |
| audit_logs | `audit_log` | ✅ |
| media_assets | `request_photo`(0011) | 🟡 요청에만 붙습니다 |
| abuse_reports | `report`(0040) — 신고와 분쟁을 `kind` 로 가릅니다 | ✅ |
| notification_events | **없습니다** | ❌ |

## 10. 보안 · 품질 (§10)

| 항목 | 증거 | 판정 |
|---|---|---|
| 고객 A 가 고객 B 를 못 봄 | `tools/sql/*.js` 가 역할마다 눌러 봅니다 | ✅ |
| 업체 A 가 업체 B 의 견적 · 고객을 못 봄 | `tools/sql/quote.js` · `review.js` | ✅ |
| GRANT 와 RLS 를 **따로** 눌러 봄 | `tools/sql/roles.js` | ✅ |
| 쓰기는 서버(문)에서만 | 표에 쓰기 정책을 **일부러 안 만들었습니다** | ✅ |
| XSS | 모든 화면이 `esc()` · `check-safe --prove` 가 되돌려 봅니다 | ✅ |
| CSP · 보안 헤더 | `vercel.json` · 검사 서버도 같은 헤더를 보냅니다 | ✅ |
| 키 노출 | `check-safe` 가 저장소를 훑습니다 · service key 는 `api/` 에서만 | ✅ |
| IDOR | 문마다 소유권을 봅니다 (`is_my_request` · `my_provider`) | ✅ |
| **rate limit** | `make_request` 안(0029 10분 · 0041 하루 20건) · `tools/sql/report.js` 가 **문을 눌러** 경계값을 잽니다 · ⚠️ 표에 직접 넣어 재면 자물쇠를 지나칩니다 | 🟡 |
| 메일 · 문자 발송 | **안 붙였습니다** — 그래서 "알려 드립니다" 라고 **말하지 않습니다** | ✅ 지시서대로 |
| 360px · 키보드 · 대비 · 빈 상태 | `check-screens` 네 폭 · `check-a11y` · `test-desk` 가 폰 폭을 직접 잽니다 | ✅ |
| 10개 분류 · 기존 주소 · SEO 유지 | `check-links` · `check-routes` · 410 규칙 | ✅ |

---

## P0 로 메울 것 — 우선순위

1. ~~업체 생애주기 상태 + 정지(suspend)~~ → **✅ 했습니다 (0038).**
   `provider.state` 여섯 · `set_provider_state()` 문 · 자물쇠 셋
   (공개 목록 · 새 배정 · 새 견적)을 **따로** 걸었습니다. 일부러
   안 막은 둘(손님이 이미 받은 견적 고르기 · 업체가 제 소개글 고치기)도
   검사가 같이 누릅니다. SQL 검사 **484건** 전부 통과.
   그리고 **업체 심사 화면**(`/admin` · `js/adminpro.js`)을 새로
   만들었습니다 — 그 화면이 없어서 `approve_provider` 를 아무도 못
   불렀습니다. 로그인 화면 검사 **282건** 전부 통과.
2. **업체 담당자 초대** — 지금은 관리자가 SQL 을 손으로 돌립니다. (§2)
3. ~~고객의 요청 취소 · 동의 철회~~ → **✅ 했습니다 (0039).**
   `revoke_third_party()` · `cancel_request()` 문과 `/my` 화면.
   ⚠️ 끊는 길이 **셋**이었습니다 (성함 · 요청 내용 · 사진) — 셋을 다
   좁혔고 검사가 **따로** 누릅니다. 철회한 업체는 새 견적 · 새 일정도
   못 냅니다. 처리방침의 권리 행사 줄도 같은 날 고쳤습니다.
   SQL 검사 **517건** · 로그인 화면 **300건** 전부 통과.
4. ~~신고(abuse_reports) · 분쟁(disputed)~~ → **✅ 했습니다 (0040).**
   `report` 표 하나에 신고와 분쟁을 `kind` 로 담고, `open_report()` ·
   `move_report()` 둘만 엽니다 (표에 쓰기 정책이 없습니다).
   ⚠️⚠️ **분쟁을 `deal_state` 에 더하지 않았습니다** — ① 같은
   트랜잭션에서 새 enum 값을 못 씁니다(실제로 돌려 보고 확인했습니다)
   ② 상태로 두면 원래 단계가 **덮여 사라집니다.**
   ⚠️⚠️ 제일 위험한 자리는 **"남의 신고가 보이는 것"** 입니다 —
   업체는 제게 들어온 신고를 **아예 못 읽습니다**(읽으면 신고한
   손님을 찾아갑니다). 화면 세 자리를 같이 만들었습니다
   (`/my` · `/desk` 에서 열고 `/admin` 의 `js/adminrep.js` 가 처리).
5. ~~rate limit~~ → **✅ 했습니다 (0041).**
   ⚠️⚠️⚠️ 처음에 적은 "10분에 다섯 건" 은 **영원히 안 걸리는
   자물쇠**였습니다 — 0029 가 이미 같은 번호로 10분에 한 건만 받고
   있었습니다. 표에 직접 insert 해서 재고 있었기 때문에 검사가
   초록이었습니다 (`request` 에는 insert 정책도 GRANT 도 없어서
   손님이 들어오는 길은 `make_request` 하나입니다 — **문으로 재야
   합니다**). 남은 틈은 "하루" 였고(10분에 한 건이면 하루 144건),
   0041 이 그 하나를 막습니다 (하루 20건).
   ⚠️ 번호를 바꿔 가며 넣는 것은 **못 막습니다** — 막는 척하지 않고
   검사에 그 사실까지 적었습니다 (IP 를 받기 시작하면 그날부터
   개인정보 처리 항목이 하나 늘어 방침을 같이 고쳐야 합니다).
6. **업체 등록 양식** → **✅ 했습니다** (문은 0023 의 `save_provider`).
   ⚠️⚠️⚠️ `tools/check-doors.js` 를 새로 만들어 "문을 부르는 화면이
   있나" 를 세어 봤더니 **스물한 개**가 0곳이었고, 그 가운데
   `save_provider` 는 **입점 신청을 업체로 만드는 유일한 길**이었습니다
   — 그게 없으면 신청이 "연락했음" 에서 더 못 갑니다 (사장님이 SQL
   편집기를 열어야 했습니다). 나머지 스물은 까닭과 함께 그 도구의
   `KNOWN` 에 적어 두었고, 검사는 **새로 생긴** 빈 문과 **그 목록이
   썩은 것**을 잡습니다.

P1 (§13): 중고채 매입 견적 · 메시지 · 알림 · 업체 통계.
P2: 결제 · 정산 · 유료 광고 — **법적 · 계약적 준비 전에는 켜지 않습니다.**
