# 운영 준비 — 사장님이 하실 일 (2026-11-17)

⚠️ 이 문서의 SQL · 설정은 **아직 하나도 실행하지 않았습니다.** 승인하신 뒤 차례대로 하시면 됩니다.
⚠️ 비밀키 · 토큰 값은 여기에 적지 않았습니다(어디에 넣는지만 적었습니다).

## 1. 운영자 계정 지정

### 1-1. 내 계정 찾기 (읽기만)

지금 운영 계정은 **둘**이고 둘 다 손님(`customer`)입니다 (2026-11-17 읽기 전용 확인):

| 로그인 수단 | 메일 (가림) | 만든 날 | 마지막 로그인 |
|---|---|---|---|
| 메일 매직링크 | `gi***@gmail.com` | 2026-11-15 | 2026-11-15 |
| 카카오 | (카카오는 메일을 안 줍니다) | 2026-11-15 | 2026-11-16 |

어느 쪽이 사장님 계정인지 **사장님이** 정하셔야 합니다. 확인하는 법:
1. Supabase → **Authentication → Users** — 줄마다 Provider(email · kakao)와 UID 가 보입니다.
2. 또는 SQL Editor 에서 (읽기만 · 메일은 앞 두 글자만):

```sql
select u.id as uid, a.role as 지금역할,
       coalesce(string_agg(distinct i.provider, ','), '-') as 로그인수단,
       case when u.email is null then '-' else left(u.email,2) || '***@' || split_part(u.email,'@',2) end as 메일,
       u.last_sign_in_at as 마지막로그인
  from auth.users u
  join account a on a.id = u.id
  left join auth.identities i on i.user_id = u.id
 group by u.id, a.role, u.email, u.last_sign_in_at
 order by u.last_sign_in_at desc nulls last;
```

⚠️ **카카오로 쓰실 거면 카카오 계정을 관리자로** 하십시오. 메일 계정을 관리자로 하면 카카오로
들어오셨을 때 `/admin` 이 안 열립니다(두 계정은 서로 다른 UID 입니다 · `db/README.md` §1-4c).

### 1-2. 지정 SQL (승인 뒤에만)

```sql
begin;
-- 바꾸기 전 — 이 줄이 하나 나와야 합니다 (역할 customer · 업체 연결 없음)
select id, role, provider_id from account where id = '<위에서 고른 UID>';

update account set role = 'admin'
 where id = '<위에서 고른 UID>' and role = 'customer' and provider_id is null;
-- ⚠️ 「UPDATE 1」 이 아니면 commit 하지 말고 rollback 하세요 (UID 가 틀렸거나 이미 바뀐 것)

-- 바꾼 뒤 — role 이 admin 이어야 합니다
select id, role from account where id = '<위에서 고른 UID>';
commit;
```

- 업체에 이어진 계정은 관리자가 될 수 없습니다(0021 의 자물쇠) — 그래서 `provider_id is null` 을 같이 봅니다.
- **확인**: 그 계정으로 로그인 → `https://storeway.co.kr/admin` 이 열리고 「입점 신청 · 배정」 칸이 보이면 끝.
- **되돌리기**: `update account set role = 'customer' where id = '<UID>';`

## 2. 사진 업로드 (버킷 둘 · 환경변수 셋)

### 2-1. 버킷

| 이름 (권장) | 공개 | 용도 | 허용 형식 · 크기 (버킷 설정에 같이) |
|---|---|---|---|
| `golf-private` | **비공개** | 손님이 요청에 붙이는 사진 · 업체 **증빙서류**(사업자등록증 등) | jpg · png · webp · **pdf** · 8MB |
| `golf-public` | **공개** | 업체 시설 사진 · 중고 매물 사진 · 게시판 글 사진 · 여행 상품 사진 · 광고 소재 | jpg · png · webp · 8MB |

- 접근 정책: **storage.objects 에 정책을 따로 만들지 않습니다.** 올리기는 서버(`/api/upload`)가 서비스 키로
  만든 **한 번 쓰는 서명 주소**로만 됩니다. 비공개 버킷은 서명된 보기 주소(10분)로만 열리고, 공개 버킷은
  주소를 아는 누구나 봅니다(그래서 서류는 절대 공개 버킷에 안 갑니다 — 서버가 경로를 보고 고릅니다).
- ⚠️ 이름은 바꾸셔도 됩니다 — 아래 환경변수에 **같은 이름**을 적으시면 됩니다.

### 2-2. 환경변수 (Vercel → Project → Settings → Environment Variables · **Production**)

| 이름 | 값 | 어디서 |
|---|---|---|
| `SUPABASE_SERVICE_KEY` | Supabase → Project Settings → API 의 **service_role** 키 | ⚠️ 서버에서만 씁니다. 화면 · 저장소 · 채팅에 붙여 넣지 마세요 |
| `INTAKE_BUCKET` | `golf-private` | 위 비공개 버킷 이름 |
| `PROVIDER_BUCKET` | `golf-public` | 위 공개 버킷 이름 |

넣은 뒤 **Deployments → 최신 배포 → Redeploy** (Vercel 은 떠 있는 함수에 값을 밀어 넣지 않습니다).

### 2-3. 확인 (버킷을 만든 것만으로 완성이 아닙니다)

1. `https://storeway.co.kr/api/upload` → `"up":true` 와 `pvPhoto` · `lstPhoto` · `cqPhoto` 등이 `true` (값 · 키는 안 나옵니다)
2. **비공개 올리기**: 로그인 → `/match` 에서 요청을 넣고 → 접수 화면의 사진 칸에 한 장 → `/my` 에서 그 사진이 보임
3. **비공개 차단**: 그 사진의 주소를 로그아웃한 창(시크릿 창)에 붙이면 **열리지 않음**
4. **공개 올리기**: `/cat/used` 에서 시험 매물을 사진과 함께 올림 → 목록 카드에 사진이 보임 → 확인 뒤 `/my` 에서 **내리기**(가짜 매물을 남기지 않습니다)
5. **서버 키 노출 없음**: 브라우저 개발자 도구 → 네트워크에서 `/api/session` 응답에 service 키가 없음(공개 키 · 공개 버킷 이름만)

## 3. 사업자 정보 (`js/data/site.js`) — ⚠️ 제가 지어 넣지 않습니다

아래를 채워 주시면 제가 넣고 검사 · 배포합니다. **SITE_LIVE 는 그대로 false** 입니다.

| 칸 (`site.js`) | 적으실 것 | 보이는 곳 |
|---|---|---|
| `company` | 상호 | 모든 화면 푸터 · 약관 본문 |
| `ceo` | 대표자 성명 | 푸터 |
| `brn` | 사업자등록번호 `000-00-00000` | 푸터 |
| `mailOrder` | 통신판매업 신고번호 `제0000-지역-0000호` | 푸터 |
| `address` | 사업장 주소 | 푸터 · 검색엔진용 회사 정보 |
| `phone` | 고객센터 전화 | 푸터 · `/help` 전화 단추 |
| `email` | 문의 이메일 | 푸터 · `/help` |
| `privacyOfficer` | 개인정보 보호책임자 (직책 · 성명) | `/privacy` 보호책임자 절 · 푸터 |
| `effective` | 약관 · 방침 시행일 `YYYY-MM-DD` | `/terms` · `/privacy` 첫 줄 |
| (선택) `hours` · `privacyEmail` · `privacyPhone` | 상담 시간 · 보호책임자 연락처 | `/help` · `/privacy` (비우면 그 줄만 빠짐) |

## 4. 비교견적 — `docs/compare-0082.md`

순서: S1 사전 검사 → S2 0082 → S3 0083 → S4 적용 후 검사 → S5 비교견적 켜기. 1번(운영자 계정)이 먼저 있어야 S6 시험 운영을 할 수 있습니다.

## 5. 사장님이 브라우저로 확인하실 것 (DB 조회로 대신하지 않습니다)

| 확인 | 주소 · 누를 것 | 정상 결과 |
|---|---|---|
| 카카오 로그인 | `https://storeway.co.kr/login` → 「카카오 로그인」 | 카카오 동의 뒤 사이트로 돌아오고 머리말에 「내 정보」 |
| 내 정보 · 로그아웃 | 머리말 「내 정보」 → 맨 위 「로그아웃」 | 메인으로 가고 머리말이 「로그인 · 회원가입」으로 |
| 로그인 후 원래 자리 | 로그아웃 상태로 `/cat/booking?rg=jeju` → 화면의 로그인 길 → 카카오 | 로그인 뒤 **같은 주소**(`rg=jeju`)로 돌아옴 |
| 메인 조건 보존 | `/` 에서 지역 · 골프장 · 시간대 고름 → 새로고침 | 고른 값이 그대로 |
| 메인 장터 · 조인 · 질문 | `/` 아래쪽 세 칸 | 「아직 판매 중인 중고 매물이 없습니다」 · 「지금 모집 중인 조인이 없습니다」 · 「아직 올라온 질문이 없습니다」와 올리는 길. ⚠️ 「불러오지 못했습니다」가 보이면 **조회 실패**입니다 — 알려 주세요 |
