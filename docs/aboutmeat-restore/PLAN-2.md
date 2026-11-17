# ABOUTMEAT 분리 2차 — 권한 점검 · 테스트 사이트 · DB 이전 · 도메인 순서 (2026-11-17)

> 운영 DB · Vercel · DNS · storeway.co.kr 은 **바꾸지 않았습니다.** 아래 SQL 은 **제안**이고
> 로컬 Postgres 에서만 돌려 봤습니다.

## 1. 옛 MEAT INSIGHT 표 16개 — 권한 점검 (운영 DB 읽기만)

**결론: 16개 전부가 사실상 누구에게나 열려 있습니다.** 골프 사이트가 화면에 싣는 공개 키
(anon)로 같은 일을 할 수 있습니다.

| 상태 | 표 |
|---|---|
| RLS 꺼짐 + anon 에게 전 권한 | businesses · closure_requests · listings · members · partner_requests · subsidy_requests |
| RLS 꺼짐 + anon 읽기 · 쓰기 | consult_requests · supply_requests |
| RLS 켜짐이지만 정책이 `using (true)` | business_members · community_* · orders · products · jobs · purchase_requests · suppliers |
| **anon 에게 TRUNCATE** | 위 16개 가운데 14개 — **RLS 가 막지 못하는 권한입니다.** 누구나 표를 통째로 비울 수 있습니다 |

개인정보가 실제로 들어 있는 줄: `consult_requests` 4줄(성함 · 전화 · 이메일),
`purchase_requests` 2줄(구매자 성함 · 전화), `partner_requests` · `supply_requests` ·
`suppliers` 각 1줄(성함 · 전화 · 사업자번호), `listings` 1줄(연락처 — 공개 매물).
골프 화면 코드는 이 16개를 **한 곳도** 부르지 않습니다(검색으로 확인).

### 최소 변경안 — `rls-minimal.sql` (승인 전 실행 금지)
1. 16개 표에서 anon · 로그인 회원의 권한을 **전부** 거둡니다(쓰기 · 지우기 · TRUNCATE 포함).
2. RLS 꺼진 8개를 켭니다.
3. 테스트 사이트가 읽는 5개(상품 · 커뮤니티 글 · 댓글 · 노출 중인 매물 · 업체)만 anon 읽기를 다시 줍니다.
- 로컬 Postgres 에서 똑같은 권한 상태를 만들어 돌려 봤습니다: 상담 신청 읽기 **거절** ·
  상품 읽기 **됨** · 숨긴 매물 **안 보임** · 상품 쓰기 **거절** · TRUNCATE **거절** ·
  골프 쪽을 흉내 낸 표 권한은 **그대로**.
- 되돌리기 SQL 은 같은 파일 아래에 있습니다.

## 2. 테스트 사이트 — 준비 상태

- 원본 `df1fd2a14`, `make-site.sh` 로 꺼냄. 쓰기 차단 · 결제 차단 · noindex 유지.
- **실제 데이터 조회:** 운영 DB 에서 **anon 권한으로** 화면이 읽는 질의를 그대로 돌려 봤습니다 —
  노출 중인 매물 1 · 업체 0 · 커뮤니티 글 90 · 댓글 99 · 판매 중인 상품 14건이 읽힙니다.
  그 값을 화면에 넣어 PC 1280 · iPhone 13 에서 띄우니 상품(우설 · 92,000원) · 매물 ·
  커뮤니티 글이 그대로 그려지고 가로 밀림 0 · 오류 0 · 쓰기 요청 0건입니다.
- ⚠️ **배포는 아직입니다.** 이 세션은 GitHub 새 저장소를 만들 수 없고 Vercel 에 접근할
  길이 없습니다 → 아래 3-1.
- ⚠️ **커뮤니티 글 90개는 전부 같은 시각(2026-04-24 16:50:52)에 들어간 글**이고 조회수 ·
  공감수가 박혀 있으며, 일부는 특정 거래처(협신식품)를 칭찬합니다. 실제 회원 글이 아니라
  **심어 둔 예시 글**로 보입니다. 그대로 공개하면 표시광고법상 문제가 될 수 있어,
  공개 운영 전 정리 여부를 결정해 주셔야 합니다(테스트 단계에서는 noindex 라 노출 없음).
- 메인 TODAY PRICE 고정 숫자 · 「52년 도축장」 문구 · 폰 머리말 메뉴 꺾임은 1차 보고와 같습니다.

### 3-1. 저장소 · Vercel 프로젝트 — 대표자가 하실 일 (5분)
1. GitHub → New repository → 이름 `aboutmeat` · **Private 권장** · README 없이 **빈 채로**.
2. https://github.com/apps/claude/installations/select_target 에서 그 저장소에 Claude 앱 허용.
3. 알려 주시면 이 세션이 준비된 커밋(원본 + 쓰기·결제 차단)을 그 저장소 `main` 에 올립니다.
4. Vercel → Add New → Project → `aboutmeat` 가져오기 → Framework **Other** · Build Command 비움
   · 환경변수 없음 → Deploy. **골프 프로젝트 화면에서는 아무것도 누르지 않습니다.**
5. 나온 `*.vercel.app` 주소를 알려 주시면, 이 세션의 네트워크 허용 목록에 그 주소를 더해
   실제 배포본을 PC · 폰으로 다시 검증합니다.

## 4. ABOUTMEAT 전용 Supabase 로 이전하는 계획

| 차례 | 할 일 | 누가 |
|---|---|---|
| ① | 새 Supabase 프로젝트 `aboutmeat`(서울 리전) 생성 | 대표자 |
| ② | 16개 표의 정의만 옮김(칼럼 · 기본값). 옛 `using (true)` 정책은 **옮기지 않음** | 세션 (승인 후) |
| ③ | 처음부터 잠근 권한: anon 은 공개 5개 표 **읽기만**. 신청 · 주문 · 상담은 anon 이 **넣기만** 하고 읽지 못함(RLS insert 전용 정책 + 칸 검사). TRUNCATE · DELETE 는 아무에게도 안 줌 | 세션 |
| ④ | 데이터 이전: 실제 줄이 있는 표 9개(213줄)를 SQL 로 복사 → 줄 수 · 지문 대조 | 세션 |
| ⑤ | 개인정보: 상담 4 · 구매 2 · 파트너 · 공급 각 1줄은 **보유 목적이 끝났는지** 먼저 결정 → 필요 없으면 옮기지 않고 파기 기록만 남김(개인정보보호법 제21조) | 대표자 결정 |
| ⑥ | 관리자: 옛 방식(화면 코드에 비밀번호 · anon 키로 수정 · 삭제)은 **쓰지 않음**. Supabase Auth 계정 + `is_admin` 확인 정책, 또는 Vercel 서버 함수에서만 service key 사용. 옛 비밀번호 `meatinsight2024` 는 공개 저장소에 남아 있으므로 **재사용 금지** | 세션 (승인 후) |
| ⑦ | 사이트의 Supabase 주소 · anon 키를 새 프로젝트로 바꾸고 테스트 주소에서 재검증 | 세션 |
| ⑧ | 안정 확인 뒤, 옛 공용 프로젝트의 16개 표는 **백업 후** 지움 — 골프 표 · 회원은 손대지 않음 | 승인 후 |

- 이전 중에도 1번 최소 변경안이 먼저 들어가 있으면 노출 창이 바로 닫힙니다(권장 차례: 1 → 4).
- 골프올인원 회원(`auth.users`)은 옛 사이트와 무관하므로 옮기지 않습니다.

## 5. aboutmeat.co.kr 만 옮기는 정확한 순서 (테스트 완료 · 승인 뒤)

**사전 확인 (바꾸지 않고 보기만)**
1. Vercel → **골프 프로젝트** → Settings → Domains 화면을 캡처. 줄 넷(storeway · www.storeway ·
   aboutmeat · www.aboutmeat)과 각 줄의 Redirect 여부를 기록.
2. 도메인 등록기관(DNS) 화면에서 aboutmeat.co.kr 의 A · CNAME 값을 캡처.
3. `aboutmeat` Vercel 프로젝트의 테스트 주소가 정상인지 마지막으로 확인.

**옮기기 (몇 분 · storeway 는 계속 정상)**
4. 골프 프로젝트 → Domains → `www.aboutmeat.co.kr` → Remove, 이어서 `aboutmeat.co.kr` → Remove.
   ⚠️ storeway 두 줄은 누르지 않습니다. 이 순간부터 ABOUTMEAT 연결 전까지 aboutmeat 주소는
   잠시 Vercel 404 가 됩니다(storeway 무관).
5. aboutmeat 프로젝트 → Domains → `aboutmeat.co.kr` Add → 이어서 `www.aboutmeat.co.kr` Add →
   www 줄을 **Redirect to aboutmeat.co.kr (308)** 로.
6. 두 줄이 **Valid Configuration** 이면 DNS 는 손대지 않습니다. "Invalid Configuration" 이면
   그 화면이 보여 주는 값으로만 바꿉니다(일반값: apex A `76.76.21.21` · www CNAME
   `cname.vercel-dns.com`).
7. 인증서 발급 대기(보통 수 분) → `https://aboutmeat.co.kr` · `https://www.aboutmeat.co.kr`
   둘 다 자물쇠 확인.

**확인**
8. aboutmeat.co.kr → MEAT INSIGHT 화면 · 아래 테스트 띠 · `/robots.txt` 가 `Disallow: /`.
9. storeway.co.kr · www.storeway.co.kr → 골프올인원 그대로 · `/api/session` 응답 그대로.
10. aboutmeat.co.kr/api/session → **404** 여야 합니다(골프 서버 함수가 더 이상 안 붙음).

**되돌리기:** 5번까지 문제가 생기면 aboutmeat 프로젝트에서 두 줄을 빼고 골프 프로젝트에
다시 Add 하면 1번 캡처 상태로 돌아갑니다(DNS 를 안 바꿨다면 수 분).

**색인:** 골프는 canonical · sitemap 이 이미 storeway 만 가리켜 바꿀 것이 없습니다.
ABOUTMEAT 는 공개 결정 전까지 noindex 를 유지하고, 결정하는 날 Search Console 에 따로 등록합니다.
