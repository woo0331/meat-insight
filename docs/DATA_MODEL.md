# 데이터 모델 — 지시서 PART 11 25 의 표 열여섯 ↔ 지금 스키마

> **PART 11 25** — *"테이블명은 실제 기존 스키마에 맞춰 조정한다.
> 중복 테이블을 만들지 않는다."* 그대로 따랐습니다. 아래가 그 대조표입니다.

---

## 1. 대조표 — 지시서 이름 → 실제

| 지시서 (PART 11 25) | 지금 | 상태 |
|---|---|---|
| `industry_categories` | `js/data/industries.js` + **새 `AM_IND_GROUPS`** | 🟡 **코드 안의 데이터**입니다. DB 표가 아닙니다 — 아래 2 |
| `industry_service_mappings` | `industries.js` 의 `startup`/`closure`/`equip` + `amCatsFor()` · `amCatItems()` | ✅ 이미 그 역할 |
| `roadmap_templates` | `js/data/journey.js` 의 `AM_PROCESS` (5종 55걸음) | ✅ 이미 그 역할 |
| `user_roadmap_progress` | ❌ 없습니다 | DB 가 서야 생깁니다 (P2) |
| `service_products` | `offer` 표 + `js/data/offers.js` | ✅ 둘 다 있습니다 |
| `partner_service_areas` | `provider.regions` · `provider.gu` · `provider.industries` · `provider.subs` | ✅ 칸으로 들고 있습니다 |
| `service_requests` | **`request`** | ✅ |
| `request_items` | ❌ 없습니다 | ⚠️ **PART 10 시나리오 C 가 요구합니다** — 아래 3 |
| `request_assignments` | **`assignment`** | ✅ |
| `request_status_history` | **`audit_log`** (obj=`request`) | ✅ 같은 일을 합니다 |
| `partner_contracts` | **`deal`** | ✅ |
| `commission_policies` | **`fee_policy`** | ✅ |
| `commission_records` | `deal.fee` · `fee_vat` · `fee_total` · `paid` · `fee_snap` | ✅ 계약 줄 안에 |
| `settlements` | **`settlement`** | ✅ |
| `settlement_adjustments` | ❌ 없습니다 | ⚠️ **부분 입금 · 환수를 줄로 남기려면 필요합니다** — 아래 3 |
| `audit_logs` | **`audit_log`** | ✅ |

**결론 — 열여섯 중 열하나가 이미 있고, 둘은 코드 안의 데이터이고,
셋이 없습니다** (`user_roadmap_progress` · `request_items` ·
`settlement_adjustments`).

---

## 2. ⚠️⚠️ 업종 · 분류를 **DB 표로 옮기지 않았습니다** (일부러)

지시서 PART 3 은 *"업종 데이터는 관리자에서 추가·수정·비활성화할 수
있어야 한다"* 고 적었습니다. 그런데 지금 이 저장소에서 업종 · 분류
key 는 —

```
업체 subs · 매물 sub · 글 cat · 업종의 startup/closure · 상품 cat ·
영업 카테고리 · 사업 단계 여섯 · 여정 넷 · 로드맵 55걸음의 cat/sub/tool/read
```

가 **전부 가리키는 값**이고, 빌드가 그 짝을 **일곱 가지 검사**로 맞춰
봅니다. 또 주소 161개가 그 key 로 만들어집니다 (`/c/:cat` ·
`/providers/:cat` · `/g/:stage` · `/startup/:industry` …).

DB 로 옮기면 —

| 잃는 것 | 까닭 |
|---|---|
| **빌드 때 짝 검사** | 데이터가 DB 에 있으면 빌드가 못 봅니다. 지금은 key 를 한 글자 틀리면 빌드가 멈춥니다 |
| **미리 만든 HTML 161개** | 주소가 DB 에 따라 바뀌면 빌드 시점에 주소 목록을 못 만듭니다 — 크롤러 본문이 통째로 사라집니다 |
| **주소 보존 검사** | `checkKeepUrls()` 가 "사라진 주소" 를 못 잡습니다 |

⚠️ 그래서 **지금 단계에서는 코드 안의 데이터로 둡니다.** 관리자에서
고치는 것은 **업체 · 매물 · 상품 · 신청**처럼 **운영 중에 늘어나는
것**부터이고, 업종 · 분류는 **사업의 뼈대**라 바뀌는 빈도가 다릅니다.

🟡 **추정** — 업종을 DB 로 옮기려면 빌드가 **DB 를 읽어** 주소를
만드는 구조(ISR/재빌드 훅)가 먼저 필요합니다. 그건 PART 12 의 P0~P3
밖이고, 바꾸기 전에 사장님 승인이 필요한 종류입니다.

---

## 3. ⚠️ 없는 표 셋 — 왜 필요하고 언제 만드나

### 3-1. `request_items` — **한 신청에 서비스 여럿** (PART 10 시나리오 C)

> *"하나의 고객 신청에서 여러 서비스가 선택되더라도 각 상품의 계약과
> 수수료를 독립적으로 추적할 수 있어야 한다."*

지금 `request` 는 `cat` · `offer_id` 를 **하나씩** 들고 있습니다.
"매장 오픈 패키지" 로 인터넷 + POS + CCTV 를 한 번에 고르면 —

```
지금 구조로는 ─ 신청 셋을 따로 만들어야 합니다 (번호도 셋)
필요한 구조는 ─ 신청 하나(번호 하나) + 항목 셋, 항목마다 배정 · 계약 · 수수료
```

⚠️ **아직 안 만들었습니다.** 만들면 `request.cat`/`offer_id` 를 쓰는
자리가 전부 바뀌고, 이미 들어온 접수(슬랙)와 모양이 달라집니다 —
**승인이 필요한 변경**이라 `docs/RENEWAL_PLAN.md` 의 P1 에 적어
두었습니다.

🟡 **지금의 차선** — 패키지는 **신청을 여러 건 만들고** 같은 연락처로
묶입니다 (중복 검사가 *다른 상품이면 중복이 아니다* 로 이미 통과시킵니다).
번호가 여럿이라 손님 화면에서 "셋 접수되었습니다" 로 보여야 맞습니다.

### 3-2. `settlement_adjustments` — **부분 입금 · 환수를 줄로**

지금은 `deal.paid` 한 칸이라 **부분 입금을 여러 번** 적을 수가 없고,
환수는 `clawback_fee()` 가 감사 기록에만 남깁니다 (§20 이 요구한
"부분 입금 → 정산 완료" 를 금액으로 추적하려면 줄이 필요합니다).

### 3-3. `user_roadmap_progress` — **체크리스트 저장** (PART 4 8)

지금 체크는 **저장되지 않습니다** (저장하는 것처럼 보이면 절대 규칙 5).
로그인이 서면 이 표가 받습니다.

---

## 4. 지금 스키마 (0001 ~ 0005) — 요약

```
account      id(=auth.users) · role(customer|provider|staff|admin) · provider_id
provider     id(text=slug · 주소가 됩니다) · 상호 · 지역 · 시군구 · 업종 · subs
             · verified · listed      ⚠️ 평점 · 후기 수 칸이 **없습니다** (세는 값)
offer        id · cat · sub · fee_type · status(info|live|off)
             ⚠️ 금액 칸이 **없습니다** (빌드가 막습니다)
request      no(SW-XXXX-XXXX) · user_id · side · industry · cat · offer_id
             · region · gu · budget_min/max · detail(jsonb) · name · tel · email
             · agree_at · **agree3rd_at(접수 때는 null)** · state
assignment   request_id · provider_id · state · **agree3rd_at not null** · by_user
fee_policy   provider_id · offer_id · type · flat · rate · min_fee · max_fee
             · vat · confirm_when · cycle · refund_rule · from_date/to_date
deal         request_id · provider_id · amount · **fee_snap(정책 사본)**
             · fee · fee_vat · fee_total · paid · paid_at · proof
             · fee_by · fee_at      ⚠️ 제약 둘이 가짜 정산을 막습니다
settlement   provider_id · 기간 · total · state(wait|paid|hold) · approved_by
audit_log    at · by_user · by_role · obj · obj_id · from_state · to_state · why
deal_move    갈 수 있는 길 44줄 — **deal.js 에서 뽑아** 넣습니다
schema_version  판 번호
```

### 4-1. 돈은 **정수 원 단위**입니다 (PART 8 19)

```sql
amount bigint · fee bigint · fee_vat bigint · fee_total bigint · paid bigint
rate numeric(7,4)      -- 요율만 소수 (3 = 3%)
```

⚠️ 부동소수점을 쓰지 않습니다. 화면 쪽 `amFeeCalc()` 도 정수로 떨어뜨립니다.

### 4-2. 정책은 **계약에 사본으로 박습니다** (PART 8 18 "계약 당시 조건 보존")

`deal.fee_snap` 이 그 사본입니다. 정책을 가리키게만 두면 요율을 고친
날 **지난 계약의 수수료가 같이 바뀝니다** — `amFeeCalc()` 는 사본이
아니면 아예 거절합니다.

### 4-3. 상태 열둘 (PART 8 16)

```
new → check → assigned → accepted → consult → quote → talks →
signed → done → fee_wait → fee_done            + cancel
```

⚠️ **`signed`(계약 완료)에서 `fee_wait`(정산 대기)로 바로 가는 길이
없습니다.** 지시서 PART 8 17 — *"업체 신고만으로 계약 완료를 자동
확정하지 않는다"* 가 그 길의 부재입니다. 관리자가 `done`(이행 완료)을
확인한 뒤 `confirm_fee()` 로만 갑니다.
