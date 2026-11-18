# 카카오 간편 로그인 · 가입 — 설정과 확인 방법

작성 2026-11-18 · **[확인]** 실행해서 본 것 · **[미검증]** 실제 카카오 · Supabase 에서 못 본 것

⚠️ 운영 DB · 환경변수 · Redirect URL · 배포는 **대표 승인 뒤에** 바꿉니다. 아래는 그때 할 일의 목록입니다.

## 1. 구조 — 새로 만든 것은 적고, W03 인증 구조를 그대로 씁니다

```
[/my 의 "카카오로 시작하기"]
   → POST /api/auth { op:"oauth", provider:"kakao", path:"원래 페이지" }     (서버 · api/auth.js)
   ← { url: <SUPABASE_URL>/auth/v1/authorize?provider=kakao&redirect_to=<들어온 출처 + 원래 경로> }
   → 브라우저가 그 주소로 이동 → 카카오 동의 화면 → Supabase 콜백 → 원래 페이지 #access_token=…
   → js/auth.js 의 amAuthTakeHash() 가 받습니다 (매직링크와 **같은 자리**) → /api/session 으로 역할 확인
```

| 재사용 | 무엇 |
|---|---|
| 계정 열림 스위치 | `STOREWAY_ACCOUNTS_OPEN=1` (W03-1) — 꺼져 있으면 `/api/auth` 전체가 점검본이고 로그인 칸이 안 나옵니다 |
| 세션 · 역할 | `/api/session` · `api/_auth.js` — 역할은 토큰으로 DB 에서 읽습니다 (화면이 보낸 값을 안 믿습니다) |
| 가입 시 계정 줄 | `0005` 의 `on_auth_user_created` 트리거 — **insert 때만**, `on conflict do nothing`, 역할은 `customer` 로 박습니다 |
| 토큰 받기 · 저장 · 갱신 · 로그아웃 | `js/auth.js` (`amAuthTakeHash` · `/api/auth` refresh · logout) |
| CSP | `connect-src 'self'` 그대로 — 브라우저는 Supabase 를 직접 부르지 않고 **이동**만 합니다 |

새로 더한 것: `api/auth.js` 의 `oauth` (주소만 만들어 돌려줌 · 바깥 요청 0) · `AUTH_KAKAO` 표시 ·
`/api/session` 의 `kakao: true/false` · `/my` 의 카카오 단추 · 취소/실패 알림 · `?next=` 복귀 · 헤더 "로그인" 이 원래 페이지를 들고 감.

## 2. 설정값 (이름만 · 값은 적지 않습니다)

### Vercel 환경변수
| 이름 | 값 | 비고 |
|---|---|---|
| `STOREWAY_ACCOUNTS_OPEN` | `1` | W03 계정 스위치 (이미 있는 것) |
| `SUPABASE_URL` · `SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_KEY` | — | 이미 있는 것 |
| `AUTH_KAKAO` | `1` | **Supabase 에서 Kakao 공급자를 켠 뒤에만** 넣습니다. 없으면 단추가 안 나옵니다 |

### Kakao Developers (developers.kakao.com · 내 애플리케이션)
| 항목 | 값 |
|---|---|
| 앱 키 | **REST API 키** → Supabase 의 Kakao *Client ID* |
| 보안 → Client Secret | 발급 · 사용 "ON" → Supabase 의 Kakao *Client Secret* |
| 카카오 로그인 → 활성화 | ON |
| 카카오 로그인 → **Redirect URI** | `https://<프로젝트 ref>.supabase.co/auth/v1/callback` ← **Supabase 의 콜백** (우리 사이트 주소가 아닙니다) |
| 플랫폼 → Web 사이트 도메인 | `https://storeway.co.kr` (Preview 로 시험하면 그 주소도) |
| 동의 항목 | **닉네임(profile_nickname)** 필수 · **카카오계정(이메일)(account_email)** — Supabase 의 Kakao 공급자는 기본으로 이메일을 요청합니다. 이메일 동의는 **비즈 앱 전환**이 있어야 받을 수 있습니다. 비즈 앱이 아니면 Supabase 의 Kakao 설정에서 *"Allow users without an email"* 을 켜야 로그인이 됩니다 |
| 프로필 사진(profile_image) | 받지 않아도 됩니다 (저희 화면이 쓰지 않습니다 · 최소 수집) |

### Supabase (Dashboard)
| 자리 | 할 일 |
|---|---|
| Authentication → Sign In / Providers → **Kakao** | Enabled · Client ID(REST API 키) · Client Secret |
| Authentication → URL Configuration → **Redirect URLs** | `https://storeway.co.kr/**` (원래 페이지로 돌아오려면 경로 와일드카드가 필요합니다). Preview 로 시험하면 그 출처도 |
| Site URL | `https://storeway.co.kr` |

## 3. 같은 카카오 계정의 중복 가입 · 기존 회원 연결

- **중복 가입 없음** — Supabase 는 (kakao · 카카오 회원번호) 로 사용자 한 명을 들고, 재방문은 그 사람으로 로그인합니다.
  저희 쪽 계정 줄은 `0005` 트리거가 **가입(insert) 때만** 한 번 만들고 `on conflict do nothing` 입니다.
  로컬 Postgres 로 확인: 첫 로그인 계정 1줄 · 재방문(메타데이터 갱신) 뒤에도 1줄 · 보낸 `role:"admin"` 무시 [확인 · tools/test-w03.js].
  실제 Supabase 의 신원 묶기는 [미검증].
- **기존 회원(메일 링크로 가입)과의 연결** — 저희 코드는 **아무것도 잇지 않습니다** (이메일로 계정을 합치는 함수가 DB 에 없음 [확인]).
  Supabase 는 **공급자가 검증한 같은 이메일**일 때만 자동으로 묶습니다. 카카오 이메일이 검증되지 않으면 별개 계정이 됩니다.
  ⚠️ 카카오 쪽에서 "카카오계정(이메일)" 을 받더라도 *검증된 이메일*인지는 카카오 응답의 `is_email_verified` 에 달려 있습니다 — 실제 앱에서 확인해야 합니다 [미검증].
  수동 연결 화면은 만들지 않았습니다 (본인 확인 방식이 정해지면 그때).

## 4. 로그인이 필요 없는 곳 (의무를 더하지 않았습니다)
서비스 검색 · 가이드 열람 · 비회원 견적 접수 · 비회원 본인 조회는 로그인 없이 그대로입니다 [확인 · test-my].

## 5. 확인 방법 (승인 뒤 · Preview 에서 먼저)

1. Preview 배포에 `STOREWAY_ACCOUNTS_OPEN=1` · `AUTH_KAKAO=1` 을 넣고, Supabase Redirect URLs 에 Preview 출처를 더합니다.
2. `/startup` 에서 헤더 **로그인** → `/my?next=/startup` → **카카오로 시작하기** → 동의 → `/startup` 으로 돌아오고 헤더가 **내 계정**.
3. Supabase → Authentication → Users 에 사용자 1명 (provider kakao) · SQL `select count(*) from account where id='<그 id>'` = 1 · role = customer.
4. 로그아웃 → 다시 카카오로 로그인 → Users 가 **늘지 않는지** · account 1줄 그대로.
5. 동의 화면에서 **취소** → 원래 페이지로 돌아와 "카카오 로그인을 취소하셨습니다." · 주소창에 오류 글이 남지 않음.
6. `/quote` · `/content` · `/search` 가 로그인 없이 그대로 쓰이는지.
7. 끝나면 Preview 의 시험 계정은 Supabase 에서 지웁니다 (운영 DB 에 시험 계정을 남기지 않습니다).

⚠️ 로그아웃은 저희 사이트(Supabase 세션)에서 나가는 것입니다 — 카카오 자체 로그인은 카카오 쪽에 남습니다 (일반적인 동작).
