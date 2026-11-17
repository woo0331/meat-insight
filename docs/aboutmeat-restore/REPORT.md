# 골프올인원 · ABOUTMEAT 도메인 분리 — 조사 보고와 변경 계획 (2026-11-17)

> 이 문서는 **조사와 준비**까지입니다. Vercel · DNS · 운영 DB 는 **한 글자도
> 바꾸지 않았습니다.** 운영 도메인 변경은 대표자 승인 뒤에 합니다.

## 1. 원인 — 한 저장소 · 한 Vercel 프로젝트를 두 사이트가 이어 썼습니다

`woo0331/meat-insight` 저장소는 **원래 ABOUTMEAT 저장소**입니다. 이력이 이렇습니다.

| 시기 | 이 저장소의 사이트 | 근거 커밋 |
|---|---|---|
| 2026-03-15 ~ 05-05 | **MEAT INSIGHT** (정육·고깃집 사장님 플랫폼 · `meat_insight_main.html`) | 첫 커밋 `1de8c92f4` ~ `df1fd2a14` |
| 06-17 | 이름을 AboutMeat 로 | `939a1d5ba` |
| 06-17 ~ 09-21 | 「고리 — 축산업 통합 플랫폼」(요청·견적 매칭) | `3b834f0fe` · `374bab99d` |
| 09-22 | ABOUTMEAT 부산물몰 | `295476079` |
| 09-25 | 새 ABOUTMEAT — 고기 사업자 문제해결 | `cd0893bcd` |
| 09-29 | 창업·폐업 버티컬 | `406ba2f63` |
| **10-04** | **도메인 전환 — aboutmeat.co.kr → storeway.co.kr** | **`bae68ef9a`** |
| 10-31 | PHONEWAY(중고폰) | `69e7fafbd` |
| 11-03 ~ | 골프올인원 | `b3d72e29b` 이후 |

`bae68ef9a` 는 코드 안의 주소(canonical · sitemap · robots)만 storeway 로 바꿨고,
메시지에 "코드에 도메인 리다이렉트를 만들지 않았습니다 — Vercel 설정과 겹치면 루프"
라고 적었습니다. 즉 **aboutmeat.co.kr 은 같은 Vercel 프로젝트에 그대로 붙어 있고**,
그 프로젝트가 `main` 을 배포할 때마다 aboutmeat.co.kr 도 **그 순간의 사이트**
(지금은 골프올인원)를 보여 줍니다.

### 코드 쪽 확인 결과
- 골프올인원 코드(`build.js` · `js/` · `pages/` · `api/` · `vercel.json`)에
  **aboutmeat 를 가리키는 줄은 0곳**입니다. 걸리는 것은 저장소 **이름**(`meat-insight`)이
  적힌 문서 몇 줄뿐입니다. → 코드를 고쳐서 풀 문제가 아니라 **Vercel 도메인 설정** 문제입니다.
- `js/data/site.js` 의 `site` 와 canonical 은 `https://www.storeway.co.kr` 입니다.
  그래서 지금 aboutmeat.co.kr 로 열리는 골프 화면도 **canonical 은 storeway** 이고,
  `SITE_LIVE = false` 라 noindex 입니다(검색 색인 피해는 아직 없습니다).

### 이 세션에서 확인하지 못한 것 (대표자 확인 필요)
- 이 세션은 **Vercel 계정에 접근할 길이 없고**, 네트워크 정책이 `aboutmeat.co.kr` ·
  `www.storeway.co.kr` 로 나가는 것을 막습니다(403). `storeway.co.kr` 만 열려
  `server: Vercel` · 제목 「골프올인원」을 확인했습니다.
- 따라서 아래는 **추정이 아니라 확인할 자리**입니다:
  1. Vercel → (골프올인원 프로젝트) → Settings → **Domains** 에 `aboutmeat.co.kr` ·
     `www.aboutmeat.co.kr` 이 있는가, 있다면 **"Redirect to storeway.co.kr"** 인가
     **그냥 연결**인가
  2. 같은 화면에서 storeway 쪽 두 주소가 어느 쪽이 기본(redirect 대상)인가
  3. 가비아 등 등록기관 DNS: aboutmeat.co.kr 의 A(`76.76.21.21`) · www 의 CNAME
     (`cname.vercel-dns.com`) — **지금 값을 캡처만** 해 두세요(바꾸지 마세요)

## 2. Supabase — 같은 프로젝트 하나에 두 서비스가 같이 있습니다 (읽기만 했습니다)

프로젝트 `igignylgzjphtnyxhhsd` **하나뿐**입니다. 골프올인원 표(`account` · `provider`
· `course` 등)와 옛 MEAT INSIGHT 표 16개가 **같은 `public`** 에 있습니다.

| 옛 MEAT INSIGHT 표 | 줄 수 | 비고 |
|---|---|---|
| community_posts / community_comments | 90 / 99 | 커뮤니티 글 · 댓글 |
| products | 14 | 마켓 상품 |
| consult_requests | 4 | ⚠️ 성함 · 전화 · 이메일 · **RLS 꺼짐** |
| purchase_requests / suppliers / supply_requests / partner_requests / listings | 2 / 1 / 1 / 1 / 1 | |
| businesses · members · orders · jobs · closure_requests · subsidy_requests · business_members | 0 | |

- 옛 사이트는 **Supabase 로그인을 안 씁니다**(`auth.` 호출 0곳). 그래서 복구해도
  골프올인원 회원(`auth.users` 2명)과 **섞이지 않습니다.**
- ⚠️⚠️ **보안 — 지금 이미 열려 있는 것:** 옛 표 가운데 8개가 RLS 꺼짐이고, 옛 관리자
  화면은 비밀번호를 **화면 코드에** 박아 두었습니다(공개 저장소 이력에 남아 있습니다).
  같은 anon 키로 `consult_requests` 의 연락처를 누구나 읽을 수 있는 상태입니다.
  → 옛 관리자 화면은 **복구 대상에서 뺐습니다.** 표 권한은 대표자 승인 없이는
  안 건드립니다(아래 4-③).
- 백업: 이 세션에서는 Supabase 백업 목록을 볼 도구가 없습니다. Dashboard →
  Database → **Backups** 에서 있는지 확인해 주세요.

## 3. ABOUTMEAT 복구 테스트 사이트 — 준비 완료 (배포는 대표자 쪽)

**복원 대상: 커밋 `df1fd2a14`(2026-05-05) — MEAT INSIGHT 의 마지막 판.**
고른 까닭: 지금 Supabase 에 남은 자료(커뮤니티 · 상품 · 매물 · 상담)를 **실제로
읽고 쓰던 판**이 이것입니다. 다른 시기 판이 "기존 ABOUTMEAT" 이라면 위 표의 커밋으로
바꿔 꺼낼 수 있습니다(대표자 결정 사항).

- 다시 꺼내는 법: `bash docs/aboutmeat-restore/make-site.sh <폴더>`
  - 화면 8장: `meat_insight_main.html`(→ `/`) · `index.html` · apply · calculator ·
    cases · diagnosis · partner · report — **원본 그대로**에 두 줄만 끼웁니다
  - 끼우는 것: `noindex` · `test-guard.js`(Supabase 로 가는 **등록·수정·삭제를 보내지
    않고 거절** · 결제창 안 열기 · 화면 아래 "테스트 사이트" 띠)
  - 뺀 것: `meat_insight_admin.html`(위 보안 문제)
  - `vercel.json`(noindex 헤더) · `robots.txt`(전부 막음)
- 로컬 확인(PC 1280 · iPhone 13): 화면 9장 모두 **JS 에러 0 · 가로 밀림 0**,
  등록 시도 시 **Supabase 로 나간 쓰기 요청 0건**(403 으로 거절됨).
  ⚠️ 이 세션은 CDN · Supabase 로 못 나가 **실제 자료가 그려지는지는 못 봤습니다** —
  임시 Vercel 주소에서 확인해야 합니다.

### 복구 완료로 치지 않는 것 (원본에 있던 그대로 · 자료 없음)
- 메인 "TODAY PRICE"(한우 등심 1++ 78,000원 ▲2.3% 등)는 **코드에 박힌 고정 숫자**입니다.
  시세 자료 연결이 아닙니다 — 공개 운영 전 빼거나 실제 자료로 바꿔야 합니다.
- "HYUPSHIN FOOD × MEAT INSIGHT · 52년 도축장" 문구는 대표자 확인이 필요합니다.
- 결제(TossPayments)는 **test 키**였고 테스트 사이트에서는 꺼 두었습니다.
- 폰 폭에서 머리말 메뉴 글자가 세로로 꺾입니다(원본 그대로 · 고칠지 결정 필요).
- 관리자 화면: 서버 쪽 인증으로 다시 만들어야 합니다(원본 방식은 복구하지 않음).

## 4. 도메인 분리 계획 — 대표자 승인 뒤 차례대로

**① ABOUTMEAT 전용 저장소·프로젝트 (서비스 영향 없음)**
1. GitHub 에 새 저장소(예: `woo0331/aboutmeat`)를 **비어 있는 채로** 만들어 주세요.
   → 알려 주시면 이 세션이 `make-site.sh` 결과를 거기에 올립니다.
2. Vercel → Add New Project → 그 저장소 → Framework **Other** · Build 비움.
3. 나온 `aboutmeat-xxxx.vercel.app` 주소에서 PC · 폰 확인.

**② 도메인 옮기기 (몇 분 · 골프올인원 무중단)**
1. 골프올인원 프로젝트 → Settings → Domains → `aboutmeat.co.kr` · `www.aboutmeat.co.kr`
   **Remove** (storeway 두 줄은 **건드리지 않음**).
2. ABOUTMEAT 프로젝트 → Domains → `aboutmeat.co.kr` 추가, `www.aboutmeat.co.kr` 추가 후
   한쪽을 "Redirect to" 로(기본 권장: www → apex, 308).
3. DNS 는 **이미 Vercel 을 가리키고 있다면 바꿀 것이 없습니다.** Vercel 이 다른 값을
   요구할 때만(Domains 화면이 "Invalid Configuration" 을 띄울 때) 그 화면의 값대로:
   - `aboutmeat.co.kr` → A `76.76.21.21`
   - `www.aboutmeat.co.kr` → CNAME `cname.vercel-dns.com`
   (Vercel 이 프로젝트별 고유 값을 보여 주면 **그 값이 우선**입니다.)
4. HTTPS 인증서는 Vercel 이 자동 발급합니다(보통 수 분).
5. 확인: `https://aboutmeat.co.kr` → ABOUTMEAT · `https://storeway.co.kr` → 골프올인원
   · `/api/session` 응답이 **storeway 에서만** 나오는지.

**③ 색인 분리**
- 골프올인원: canonical · sitemap 이 이미 storeway 만 가리킵니다 — 바꿀 것 없음.
  옮긴 뒤 aboutmeat 에서 골프 화면이 더 이상 안 나오므로 중복도 사라집니다.
- ABOUTMEAT: 테스트 동안 `noindex` + robots 전부 막음. 공개를 결정하시는 날
  `test-guard.js` · noindex · robots 를 걷고 sitemap · Search Console 을 따로 등록합니다.

**④ DB 분리 (나중 · 별도 승인)**
- 권장: ABOUTMEAT 용 **새 Supabase 프로젝트**를 만들고 옛 16개 표만 옮긴 뒤,
  공용 프로젝트의 옛 표는 RLS 를 켜거나 지웁니다. 골프 표 · 회원은 손대지 않습니다.
- 그 전까지 옛 표의 연락처가 anon 키로 읽히는 상태는 그대로이므로, **최소한
  `consult_requests` 등 8개 표의 RLS 를 켜는 것**을 먼저 승인해 주시길 권합니다.
