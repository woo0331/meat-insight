# 접근 환경 — 지금 되는 것 · 안 되는 것 · 한 번만 해 주셔야 하는 것

**2026-11-11 · 도구를 실제로 실행한 결과입니다.** 코드도 DB 도 배포도 고치지
않았습니다. 바꾼 것은 **이 세션 환경의 네트워크 허용 호스트 열 개**뿐이고,
그것도 사장님이 승인 창에서 두 번 눌러 주셔서 된 것입니다.

---

## 0. 먼저 — 제가 단정하지 않는 것

사장님 지적이 맞습니다. **공개 OpenAPI 에 표·함수가 안 보인다는 것만으로
「DB 에 없다」 거나 「다른 프로젝트」 라고 단정하지 않습니다.** anon 권한이
없으면 표가 있어도 그 목록에 안 뜹니다.

지금까지 **잰 것**과 **아직 모르는 것**을 갈라 적습니다.

| 잰 것 (증거) | 값 |
|---|---|
| PostgREST 가 이름을 푸는 스키마 | 오류 글이 `public.v_cq_public` · `public.account` 로 **public 을 붙여서** 돌아왔습니다 → 노출 스키마에 `public` 이 들어 있습니다 |
| anon 에게 노출된 표·보기 | **0개** |
| anon 에게 노출된 함수 | **0개** |
| 이름 제안 | `listing` 을 물으면 `public.listings`, `provider_contact` 를 물으면 `public.products` 를 제안했습니다 |

**이것으로 좁혀지는 것** — 0059 는 `v_cq_public`, 0064 는 `v_ad_live`,
0032 는 `v_provider_card` 를 **anon 에게 select 로 열어 둡니다.** 그 셋이
마이그레이션에 적힌 대로 올라갔다면 anon 목록에 **떠야 합니다.** 안 떴으니
① 마이그레이션이 이 프로젝트에 안 올라갔거나 ② 올라갔지만 그 GRANT 가
없거나 ③ 다른 프로젝트입니다. **셋 중 무엇인지는 아직 모릅니다.**

가리는 길은 아래 3절의 조회 둘 중 하나입니다.

---

## 1. 요청하는 인증 도구와 공식 연결 주소

### ① Supabase Management API  (요청합니다)

| 무엇 | 값 |
|---|---|
| 호스트 | `api.supabase.com` (오늘 이 환경 허용 목록에 넣었습니다) |
| 토큰 발급 화면 | Supabase 대시보드 → 계정 → Access Tokens |
| 전달 방법 | 이 대화의 **보안 입력 창** (`request_credential`). 값은 환경의 network secrets 에 저장되고 프록시가 `Authorization: Bearer` 로 끼워 넣습니다 |
| 제가 값을 보나 | **못 봅니다.** 채팅 · Git · 프런트 코드에 한 글자도 안 들어갑니다 |

### ② Vercel 토큰  (요청하지 않습니다)

필요했던 두 질문이 **이미 다른 증거로 답이 났습니다** —

- 「Production 이 `main` 을 보고 있나」 → 운영 홈 HTML 이 `main:index.html` 과
  **바이트까지 같습니다**(37,344B). 보고 있습니다.
- 「환경변수가 들어갔나」 → `/api/session` 이 `auth:true` 이고 `need` 가
  비어 있습니다. 둘 다 들어가 있습니다.
- 「버킷이 켜졌나」 → `/api/upload` 가 여섯 개 전부 `false` 입니다. 안 켜졌습니다.

그래서 **토큰을 안 받는 쪽이 맞습니다.**

### ③ 브라우저 조작 도구  (이 환경에 없습니다)

| 재 본 것 | 결과 |
|---|---|
| 브라우저 MCP 도구 | 검색해도 `WebFetch` 와 GitHub 도구만 나옵니다 — **없습니다** |
| Remote Control 폴더 | `{"folders":[],"cannot_be_used":[]}` — **0개** |
| Playwright | 설치는 되어 있지만 바깥 호스트가 막혀 **쓸 수 없습니다** |

⚠️ 그래서 **카카오 개발자 콘솔은 사장님만 보실 수 있습니다.** 카카오는
동의항목 설정을 읽는 공개 API 가 없고, 콘솔은 로그인해야 들어가는 화면입니다.

---

## 2. 토큰에 필요한 권한과 접근 범위

공식 문서를 읽었습니다 (Management API 소개 페이지 · 원문) —

> A **scoped PAT** can only reach the organizations, projects, and permissions
> you choose when creating it. A **classic PAT**, shown as Legacy in the
> dashboard, carries the same privileges as your user account.
> **Prefer scoped PATs**, and keep every token secret.

그래서 **Scoped PAT** 로 만들어 주십시오 —

| 칸 | 주실 값 |
|---|---|
| 조직 | 이 프로젝트가 든 **조직 하나만** |
| 프로젝트 | `igignylgzjphtnyxhhsd` — ⚠️ 다만 「다른 프로젝트에 올라갔나」를 확인하려면 **프로젝트 목록 읽기**가 필요하므로 그 조사까지 원하시면 **조직 범위**로 주셔야 합니다 |
| 권한 | **읽기만.** 쓰기 · 삭제는 주지 마십시오 |
| 만료 | 짧게 (하루 ~ 이틀) |

⚠️ **Legacy(classic) PAT 는 계정 전체 권한입니다 — 주지 마십시오.**

⚠️ 그 발급 화면에 권한 칸이 정확히 어떤 이름으로 나오는지는 **제가 못
봤습니다**(콘솔을 못 엽니다). 「read」 쪽만 고르시면 됩니다. — **미검증**

---

## 3. 읽기 전용 조사에 사용할 정확한 작업

### 길 ㄱ — 토큰을 주시는 경우: **GET 만** 부릅니다

| 부를 주소 | 무엇을 확인 |
|---|---|
| `GET /v1/projects` | 계정의 프로젝트 목록 — 우리 스키마가 올라간 **다른 프로젝트**가 있는지 |
| `GET /v1/projects/{ref}/config/auth` | 공급자 켜짐 · Site URL · **Redirect URLs** · 가입 허용 |
| `GET /v1/projects/{ref}/postgrest` | **노출 스키마**(사장님이 지적하신 그 항목) |

**안 하겠다고 약속하는 것** —

- `POST /v1/projects/{ref}/database/query` (운영 SQL 실행) → **안 부릅니다**
- PATCH · POST · PUT · DELETE → **하나도 안 부릅니다**
- `api-keys` 처럼 비밀을 돌려주는 주소 → **안 부릅니다**
- 마이그레이션 · 데이터 · 설정 변경 → **안 합니다**

⚠️ 위 세 주소의 정확한 경로는 제가 **아직 눌러 보지 못했습니다**(토큰이
없어서). 이름이 다르면 그 자리에서 고치고 **무엇을 불렀는지 그대로**
보고하겠습니다. — **미검증**

### 길 ㄴ — 토큰을 안 주시는 경우: 아래를 **사장님이** 돌려 결과만 주십시오

Supabase 대시보드 → SQL Editor. **전부 읽기(select)뿐이고 아무것도 바꾸지
않습니다.** 0절의 「셋 중 무엇인지」가 이것으로 갈립니다.

```sql
-- ① 우리 표가 실제로 있는가 (이름만 셉니다)
select table_schema, table_name
  from information_schema.tables
 where table_name in ('account','provider','listing','inquiry','cq',
                      'teetime','wanted','jobpost','listings','products')
 order by 1,2;

-- ② anon · authenticated 에게 준 권한 (0059 · 0064 · 0032 가 준 것)
select table_schema, table_name, grantee, privilege_type
  from information_schema.role_table_grants
 where grantee in ('anon','authenticated')
 order by 1,2,3;

-- ③ PostgREST 가 노출하는 스키마
select rolname, rolconfig
  from pg_roles
 where rolname in ('authenticator','anon','authenticated');

-- ④ 우리 문과 트리거 함수가 있는가
select n.nspname, p.proname
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where p.proname in ('make_apply','make_request','open_inquiry',
                     'my_role','handle_new_user')
 order by 1,2;

-- ⑤ 회원 · 문의가 몇 줄인가 (내용은 안 봅니다)
select (select count(*) from auth.users) as auth_users;

-- ⑥ 관리자 계정이 살아 있는가 (UID 는 안 찍습니다)
--    ①에서 account 표가 있을 때만 돌리십시오
-- select role, count(*) from public.account group by role order by 1;
```

⚠️ **⑥은 account 표가 있을 때만** 돌리십시오 — 없으면 오류가 납니다(그
오류 자체도 답입니다).

---

## 4. 연결 해제 · 토큰 폐기

| 무엇 | 어디서 |
|---|---|
| 토큰 폐기 | Supabase 대시보드 → 계정 → Access Tokens → 그 토큰 **Revoke**. 그 순간 끝납니다 |
| 이 환경에서 지우기 | 환경 설정의 **network secrets** 에서 그 항목 삭제 (제게는 **이름만** 보입니다) |
| 오늘 제가 연 호스트 되돌리기 | 말씀만 하시면 한 번에 지웁니다 |

오늘 허용 목록에 넣은 **열 개** — 되돌리실 때 이 목록입니다:

```
storeway.co.kr              www.storeway.co.kr
kauth.kakao.com             developers.kakao.com
api.supabase.com            supabase.com
api.vercel.com              developers.naver.com
developers.google.com       igignylgzjphtnyxhhsd.supabase.co
```

---

## 5. 오늘 토큰 없이 이미 잰 것 (증거와 함께)

| 확인한 것 | 증거 |
|---|---|
| GitHub 읽기 · 쓰기 | `gh api user` → `woo0331` · `main` = `1340fae583cc` |
| 운영 배포가 GitHub 과 일치 | 운영 홈 HTML 이 `main:index.html` 과 **바이트까지 같음**(37,344B). `js/auth.js` · `js/data/social.js` · `js/account.js` 도 **같음** |
| 운영 환경변수 | `/api/session` → `auth:true`, `need` 없음 |
| 버킷 | `/api/upload` → 여섯 개 전부 `false` |
| 공개 상태 | `robots.txt` 가 `Disallow: /` · 홈에 `noindex` 있음 |
| Supabase 공급자 | `external.kakao = true` · `email = true` · `google = false` · **naver 키가 아예 없음** · `disable_signup = false` |
| GoTrue 가 카카오로 보내는 scope | `account_email profile_image profile_nickname` — **중복 없이 딱 셋** (우리 코드가 `scopes` 를 안 싣는 것이 운영에서 확인됨) |
| 카카오가 지금 거절하나 | authorize 에 바로 보내면 `302 → accounts.kakao.com/login`. ⚠️ **없는 동의항목을 일부러 넣어도 똑같이 302** 였습니다 → **카카오는 로그인 뒤에 동의항목을 봅니다.** 로그인 없는 조사로는 KOE205 를 확인할 수 없습니다 |
| 카카오 이메일 동의항목 요건 | 공식 문서: 개인정보 동의항목은 **[추가 기능 신청]** 이고 그 전제가 **「비즈 앱 전환 신청 자격 확인」 + 「비즈니스 정보 심사」** 입니다 |
| 사업자등록번호가 꼭 필요한가 | 그 페이지에 **그렇게 적혀 있지 않습니다** — **미검증**. 「자격 확인」 안쪽을 못 읽었습니다 |
| 카카오 OpenID Connect | 콘솔에 **ON/OFF 설정이 있다**고 문서에 적혀 있습니다 → Supabase Custom Provider(OIDC) 길이 열릴 수 있습니다 |

### 그래서 사장님이 **한 번만** 해 주셔야 하는 것

1. **카카오 로그인을 한 번 눌러 보기** — KOE205 가 아직 나는지. 이것만은
   로그인 뒤에 검사되므로 **다른 길이 없습니다.** 오류 화면의 글자를 그대로
   주시면 어느 동의항목인지 바로 가립니다.
2. (고르시면) **Scoped 읽기 PAT** 한 개, 또는 3절 길 ㄴ 의 SQL 결과.

