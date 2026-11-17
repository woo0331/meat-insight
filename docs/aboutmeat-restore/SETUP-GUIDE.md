# ABOUTMEAT 독립 환경 — 대표자 화면별 절차 (2026-11-17)

> 화면 이름은 2026-11 기준입니다. 메뉴 위치가 조금 다르면 같은 이름의 단추를 찾아 주세요.
> **골프올인원 Vercel 프로젝트 · Supabase 프로젝트 화면에서는 ①의 SQL 실행과 ⑤의 도메인 두 줄 말고는 아무것도 누르지 않습니다.**

## ① 옛 MEAT INSIGHT 표 잠그기 (A안) — 승인하실 때만

1. https://supabase.com/dashboard → 프로젝트 `igignylgzjphtnyxhhsd` (골프올인원과 같은 프로젝트)
2. 왼쪽 **SQL Editor** → **New query**
3. 먼저 **실행 전 기준값**을 적어 둡니다. 아래를 붙여 넣고 **Run**:
   ```sql
   select (select count(*) from information_schema.role_table_grants where grantee in ('anon','authenticated') and table_schema='public' and table_name not in ('business_members','businesses','closure_requests','community_comments','community_posts','consult_requests','jobs','listings','members','orders','partner_requests','products','purchase_requests','subsidy_requests','suppliers','supply_requests')) golf_grants,
          (select count(*) from pg_policies where schemaname='public' and tablename not in ('business_members','businesses','closure_requests','community_comments','community_posts','consult_requests','jobs','listings','members','orders','partner_requests','products','purchase_requests','subsidy_requests','suppliers','supply_requests')) golf_policies;
   ```
   2026-11-17 값: **golf_grants 91 · golf_policies 99**
4. `docs/aboutmeat-restore/backup-before.sql` 내용을 메모장 등에 **따로 보관**(되돌릴 때 씁니다)
5. 새 쿼리에 `docs/aboutmeat-restore/rls-minimal.sql` 전체를 붙여 넣고 **Run** → "Success" 확인
6. 3번 쿼리를 다시 Run → **91 · 99 그대로**여야 합니다(골프 쪽 변화 없음)
7. `https://storeway.co.kr` 메인 · 로그인 · 부킹 화면이 평소처럼 열리는지 확인
- 이상하면: 4번에 보관한 `backup-before.sql` 을 붙여 넣고 Run → 실행 전 상태로 돌아갑니다.
- 이 세션에 "실행해" 라고 승인해 주시면 같은 순서(기준값 → 실행 → 재확인)로 세션이 대신 돌립니다.

## ② GitHub — `aboutmeat` Private 저장소

1. https://github.com/new
2. **Owner** `woo0331` · **Repository name** `aboutmeat`
3. **Private** 선택
4. "Add a README" · ".gitignore" · "license" **전부 끔** (빈 저장소여야 합니다)
5. **Create repository**
6. https://github.com/apps/claude/installations/select_target → `woo0331` → **Configure**
   → Repository access 에서 **Only select repositories** 에 `aboutmeat` 추가 → **Save**
   (meat-insight 는 이미 들어 있습니다. 두 저장소는 서로 다른 저장소로 완전히 따로 움직입니다)
7. 이 세션에 "aboutmeat 만들었다" 고 알려 주세요 → 세션이 테스트판(noindex · DB 연결 차단 · 결제 차단) 커밋을 `main` 에 올립니다.

## ③ Vercel — 새 프로젝트 `aboutmeat`

1. https://vercel.com/dashboard → 오른쪽 위 **Add New…** → **Project**
2. **Import Git Repository** 목록에서 `aboutmeat` → **Import**
   - 목록에 없으면 "Adjust GitHub App Permissions" 에서 `aboutmeat` 허용
   - ⚠️ `meat-insight` 를 고르지 마세요(그것이 골프올인원입니다)
3. **Configure Project**
   - Project Name: `aboutmeat`
   - Framework Preset: **Other**
   - Root Directory: `./` 그대로
   - Build and Output Settings: Build Command · Output Directory **비움**(Override 끔)
   - Environment Variables: **아무것도 넣지 않음**
4. **Deploy** → 끝나면 나오는 `https://aboutmeat-xxxx.vercel.app` 주소를 이 세션에 알려 주세요
5. (선택) 테스트 동안 외부인이 못 보게: 새 프로젝트 → **Settings → Deployment Protection**
   → Vercel Authentication **Enabled** (대표자 계정으로 로그인해야 보임)
6. 새 프로젝트 → **Settings → Git** → Production Branch 가 `main` 인지 확인
- 이 세션은 Vercel 에 직접 들어갈 수 없습니다. 주소를 받으면 네트워크 허용을 요청해 그 배포본을 PC · 폰으로 검증합니다.

## ④ Supabase — 새 프로젝트 `aboutmeat`

1. https://supabase.com/dashboard → **New project**
2. Organization: 지금 쓰시는 조직 · **Name** `aboutmeat`
3. **Database Password**: 새로 생성(▶ Generate) 후 비밀번호 관리 도구에 저장
   ⚠️ 옛 관리자 비밀번호 · 골프올인원 비밀번호를 쓰지 마세요
4. **Region**: Northeast Asia (Seoul)
5. **Create new project** → 준비 완료까지 대기
6. 왼쪽 **SQL Editor** → New query → `docs/aboutmeat-restore/new-project-baseline.sql` 붙여 넣기 → **Run**
   (표는 만들지 않습니다. 앞으로 만들 표 · 함수가 공개 키로 저절로 열리지 않게 잠그는 것만 합니다)
7. 아직 Vercel 에 Supabase 주소 · 키를 넣지 않습니다(테스트판은 DB 를 쓰지 않습니다).
   새 사업모델 설계가 확정되면 그때 표를 만들고 연결합니다.
- 새 프로젝트를 이 세션의 Supabase 연결에서 보이게 하시면(같은 조직이면 자동), 세션이 6번 실행과 확인을 대신할 수 있습니다.

## ⑤ 도메인 — 테스트 완료 뒤 **별도 승인** 때만

**미리 볼 것 (바꾸지 않음)**
1. Vercel → **골프올인원 프로젝트** → Settings → **Domains** 화면 캡처
   (storeway.co.kr · www.storeway.co.kr · aboutmeat.co.kr · www.aboutmeat.co.kr 의 연결 · Redirect 표시)
2. 도메인 등록기관(가비아 등) → aboutmeat.co.kr → DNS 관리 화면 캡처

**옮기기**
3. 골프올인원 프로젝트 → Domains → `www.aboutmeat.co.kr` 줄 **⋯ → Remove**, 이어서 `aboutmeat.co.kr` **Remove**
   ⚠️ storeway 두 줄은 누르지 않습니다
4. aboutmeat 프로젝트 → Settings → Domains → **Add** → `aboutmeat.co.kr` → 이어서 `www.aboutmeat.co.kr` Add
   → www 줄을 **Redirect to aboutmeat.co.kr (308)** 로
5. 두 줄이 **Valid Configuration** 이면 DNS 는 손대지 않습니다.
   "Invalid Configuration" 이면 그 화면이 보여 주는 값으로만 등록기관 DNS 를 바꿉니다
   (보통 apex A `76.76.21.21` · www CNAME `cname.vercel-dns.com` — 화면 값이 우선)
6. 인증서 자동 발급(보통 수 분) 대기

**확인**
7. `https://aboutmeat.co.kr` → ABOUTMEAT 테스트판 · `/robots.txt` 가 `Disallow: /`
8. `https://storeway.co.kr` · `https://www.storeway.co.kr` → 골프올인원 그대로
9. `https://aboutmeat.co.kr/api/session` → **404** (골프 서버 함수가 더 이상 붙지 않음)

**되돌리기:** aboutmeat 프로젝트에서 두 줄 Remove → 골프올인원 프로젝트에 다시 Add → 1번 캡처 상태.

**색인:** storeway 는 canonical · sitemap 이 이미 storeway 만 가리킵니다. aboutmeat 는 새 사이트 공개 결정 전까지 noindex · robots 전부 막음을 유지합니다.
