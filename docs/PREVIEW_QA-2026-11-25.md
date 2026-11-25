# 고객 접수 사전 검수 — Preview 준비 (2026-11-25)

운영 기준 커밋 `fe8608860`. 이 문서는 **준비**까지입니다 — 아래 0단계가 끝나기 전에는 Preview 를 시험 DB 에 잇지 않습니다.

## 0. 먼저 — 운영 DB 와 시험 DB 가 갈렸는가 (관리자 진단)

| 항목 | 값 |
|---|---|
| 진단 브랜치 | `claude/admin-dbref-2` (운영 기준 `fe8608860` 바로 위) |
| 확인 주소 (운영 배포 뒤) | `https://storeway.co.kr/api/admin-health?ref=1` |
| 로그인 | 브라우저가 비밀번호 창을 띄웁니다 — 아이디는 아무거나, 비밀번호는 Vercel 의 `ADMIN_PASSWORD` |
| 돌려주는 것 | `projectId`(주소 앞 토막) · 두 키가 가리키는 ID · 역할 이름 · 셋이 같은지(`sameProject`) |
| 돌려주지 않는 것 | 주소 전체 · 키 · 비밀번호 · 길이 (로그에도 안 남깁니다) |

**판정** — `projectId` 가 `gxjzlkvdbafzfjuunvyx`(aboutmeat) **가 아니면** 분리 확인입니다. 같으면 멈추고 보고합니다.

**진단 제거** — 확인이 끝나면 그 커밋을 되돌린 커밋을 올리고 배포합니다.
```
git revert <진단 커밋>   # api/admin-health.js 의 ?ref=1 갈래와 검사만 빠집니다
```
남겨 둬도 관리자 비밀번호 없이는 401 이지만, 쓰지 않는 길은 닫는 쪽이 낫습니다.

## 1. Preview 에 넣을 환경변수 (사장님이 Vercel 에서 직접 · Environment = **Preview 만**)

> Vercel → storeway → Settings → Environment Variables → 각 항목 Add → Environment 에서 **Preview 만** 체크
> (가능하면 "Preview Branch" 에 시험 브랜치 이름을 적어 그 브랜치에만 걸리게). 키 값은 채팅에 보내지 마세요.

| 이름 | 값 | 무엇 |
|---|---|---|
| `SUPABASE_URL` | 시험 프로젝트 주소 | Supabase → 시험 프로젝트 → Project Settings → API |
| `SUPABASE_ANON_KEY` | 공개 키 | 같은 화면 |
| `SUPABASE_SERVICE_KEY` | service role 키 | 같은 화면 (⚠️ 화면에 내려가지 않음) |
| `ADMIN_PASSWORD` | 시험용 관리자 비밀번호 | Preview 의 `/admin` 잠금 |
| `STOREWAY_ACCOUNTS_OPEN` | `1` | 로그인 · 관리자 경로를 엶 |
| `STOREWAY_INTAKE_OPEN` | `quote` | 일반 견적만 엶 (쉼표로 늘릴 수 있음) |
| `INTAKE_WEBHOOK_URL` | **시험용** 슬랙 주소 | 운영자 알림 — 운영 채널 주소를 넣지 마세요 |
| (메일까지 볼 때) `RESEND_API_KEY` · `CUSTOMER_EMAIL_FROM` · `PARTNER_EMAIL_FROM` | 시험 발신 주소 | 손님 · 업체 안내 메일 |

⚠️ 이 변수들이 **Production 에 체크되어 있으면 안 됩니다.** 체크되면 운영이 시험 DB 를 보게 됩니다.

## 2. 시험 프로젝트 쪽 설정 (사장님이 Supabase 에서 직접)

- Authentication → URL Configuration → **Redirect URLs** 에 Preview 주소 추가 — `https://<preview 주소>/**`
  (안 넣으면 메일 로그인 링크가 다른 곳으로 돌아갑니다)
- 첫 로그인 뒤 그 계정을 관리자로 올리는 SQL 한 줄 — Preview `/admin` 화면이 **내 계정 id 를 넣은 SQL** 을 그대로 보여 줍니다 (시험 DB 변경이라 별도 승인 후).

## 3. 시험 브랜치 (Claude 가 준비 · 승인 후 푸시)

- 운영 기준 `fe8608860` + **`js/data/site.js` 의 `sosReady:true` 한 줄** — 화면 쪽 접수 스위치입니다.
  ⚠️⚠️ **이 커밋은 `main` 에 절대 합치지 않습니다.** 합치면 운영 화면의 신청 단추가 열립니다
  (서버 쪽 `STOREWAY_INTAKE_OPEN` 이 비어 있어 접수는 막히지만, 손님은 다 적고 실패합니다).
- 브랜치를 올리면 Vercel 이 Preview 를 만듭니다. 그 주소를 받아 아래 순서로 검수합니다.

## 4. 검수 순서 (Preview 주소에서)

| # | 단계 | 누가 | 확인 |
|---|---|---|---|
| 0 | `/<preview>/api/admin-health?ref=1` | Claude | `projectId` = 시험 프로젝트 · `sameProject:true` |
| 1 | 메일 로그인 | 사장님이 받은편지함 링크를 누름 | Preview 로 돌아와 로그인됨 |
| 2 | 관리자 접수함 (`/admin`) | Claude + 사장님(역할 SQL) | 접수 목록 칸 · 연락처는 "연락처 보기"를 눌러야만 |
| 3 | 시험 견적 제출 (`/quote`) | Claude | 접수번호 · 중복 방지 · DB 저장 · 슬랙 시험 채널 |
| 4 | 시험 알림 | Claude | 서비스명이 한글 · 성함 · 연락처 · 요청 내용이 **안 실림** |

⚠️ 모든 제출은 **시험 이름 · 시험 번호**로만 합니다. 운영 주소(storeway.co.kr)에서는 아무것도 제출하지 않습니다.

## 5. 카카오 로그인 — 이메일을 요청하지 않는 OpenID Connect 길 (시험 브랜치만)

**왜** — Supabase 기본 Kakao 공급자는 scope 에 `account_email profile_image profile_nickname` 을
고정으로 넣고 `scopes` 는 덧붙기만 합니다 (supabase/auth `internal/api/provider/kakao.go`).
시험 DB(Auth v2.198.0)의 실제 요청도 그렇습니다 — 이메일 동의항목이 없는 앱은 KOE205.

**흐름**
1. `/api/auth {op:"oauth"}` — 카카오 인가 주소를 직접 만듭니다. `scope=openid profile_nickname`
   (이메일 · 프로필 사진 없음 — 사이트가 프로필 사진을 안 씁니다). state · nonce 원문 · 돌아갈 자리는
   AES-256-GCM 으로 잠근 httpOnly 쿠키(`sw_kk`, Path=/api/auth-kakao, 10분)에. 카카오에는 nonce 의 sha256 만.
2. `/api/auth-kakao` (콜백) — state 쿠키를 **먼저 지우고**(한 번만), 만료 · state 를 맞춘 뒤 코드를
   서버에서 카카오 토큰으로 바꾸고(client_secret 은 서버만), id_token 의 nonce 를 맞춰 본 뒤
   Supabase `POST /auth/v1/token?grant_type=id_token` (provider=kakao, nonce 원문)으로 세션을 받습니다.
3. 세션은 잠근 httpOnly 쿠키(`sw_ks`, Path=/api/auth, 2분)에 담고 **토큰 없는 원래 주소**로 303.
   표시 쿠키(`sw_kt=1`)만 화면이 읽습니다.
4. 화면이 `/api/auth {op:"take"}` 로 **한 번** 받아 갑니다 (응답 본문 · 두 번째는 401).

⚠️ ID · 액세스 · 리프레시 토큰과 코드는 주소창 · 로그에 안 나옵니다 (`tools/test-auth.js` 가 봅니다).
⚠️ 닉네임은 선택 동의입니다 — 거부해도 `sub` 만으로 로그인됩니다.

**환경변수 (Preview 만)** — `AUTH_KAKAO=1` · `KAKAO_REST_KEY` · `KAKAO_CLIENT_SECRET`
(쿠키 열쇠는 `AUTH_COOKIE_SECRET`, 없으면 `SUPABASE_SERVICE_KEY` 에서 뽑습니다). 하나라도 없으면 단추가 안 나옵니다.
**카카오 콘솔** — OpenID Connect 활성화 · Redirect URI `https://<preview 주소>/api/auth-kakao`.
**Supabase** — Kakao 공급자는 켠 채로 (Client ID = REST API 키 · id_token 의 aud 확인에 씁니다) · Allow users without an email.
