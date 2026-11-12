# 운영에 올리는 차례 — 마이그레이션 전체 · 순서 · 검사한 커밋

날짜 2026-11-12 · 가지 `claude/git-branch-workflow-j74dol`

⚠️⚠️⚠️ **아직 아무것도 적용하지 않았습니다.** 운영 DB 도 · 배포도
건드리지 않았습니다. 이 글은 **순서표**입니다.

⚠️ 지금은 `SITE_LIVE = false` 입니다 — 모든 화면에 noindex 가 붙고
robots 가 전부 막습니다. 아래를 다 하셔도 **검색에는 안 올라갑니다.**

---

## 검사한 최종 커밋

```
커밋   436bc93
가지   claude/git-branch-workflow-j74dol
검사   node tools/ship.js  (전수)
결과   ✅ 전부 초록 (918.1초)
```

묶음별로는 이렇습니다 — 이 가지를 그대로 돌린 값입니다.

| 묶음 | 결과 |
|---|---|
| `check-nofake` (지어낸 자료) | 18 / 18 |
| `check-authenv` (빈 환경변수 이름) | 8 / 8 |
| `check-safe` (키 · 헤더 · CSP · esc) | 24 / 24 |
| `check-a11y` (접근성) | 30 / 30 |
| `test-join` (입점 신청) | 26 / 26 |
| `test-match` (매칭 요청) | 115 / 115 |
| `test-help` (고객센터 문의) | 29 / 29 |
| `test-admin` (관리자 화면) | 26 / 26 |
| `test-journey` (손님이 한 바퀴) | 222 / 222 |
| **`test-desk`** (로그인해야 나오는 자리 전부) | **1580 / 1580** |
| **`test-providers`** (업체가 있을 때) | **274 / 274** |
| `test-course` (골프장이 있을 때) | 18 / 18 |
| `test-photos` (사진) | 19 / 19 |
| **`test-sql`** (임시 Postgres 로 DB 를 눌러 봄) | **2008 / 2008** |
| `test-upgrade` (올렸을 때 기존 자료) | 41 / 41 |
| 빌드 결과가 커밋과 같은가 | ✅ |

⚠️ 나머지 묶음(`build.js` · `check-comments` · `check-globals` ·
`check-deal` · `check-doors` · `check-chains` · `check-keys` ·
`check-docs` · `check-routes` · `check-links` · `check-photos` ·
`check-screens`)은 **건수를 안 찍고** 막으면 멈춥니다 — 멈추지
않았으므로 통과입니다.

⚠️⚠️ **「검사가 초록」과 「운영에 올려도 된다」는 다릅니다.** 위는
**이 작업 가지의 코드**가 스스로 세운 규칙을 다 지킨다는 뜻이지,
운영 DB·환경변수·버킷이 준비되었다는 뜻이 아닙니다. 그 준비는
아래 1~5번이고, **아직 아무것도 안 했습니다.**

⚠️ `main` 은 **안 움직였습니다** — 이 커밋은 작업 가지에만 있습니다
(`origin/claude/git-branch-workflow-j74dol` 에 올라가 있습니다).

---

## 운영 DB 에 들어갈 마이그레이션 — **전체**

붙여넣기 파일 하나(`db/apply-from-0008.sql`)에 **0008 ~ 0076 · 69개**가
번호 차례로 들어 있습니다. 그 가운데 **이번 차수에 새로 생긴 다섯**이
아래입니다. 나머지 예순넷은 전에 이미 들어 있던 것이고, 다시 붙여 넣어도
괜찮게 만들어 두었습니다(`test-upgrade` 가 두 번 붙여 넣어 봅니다).

| 판 | 무엇 | 화면이 다 붙었나 | 없으면 어떻게 되나 |
|---|---|---|---|
| **0072** | 구인 · 구직 직무 · 고용형태 · 급여 · 갈래 「시설 · 장비 거래」 | **예** (`/cat/career` 양식 · 목록) | 그 칸을 부르는 질의가 **통째로 거절**되어 목록이 빕니다 |
| **0073** | 여행 상품(`trip` · `tripphoto`) · 수정본 따로 심사 | **예** (2026-11-12 저녁 — 손님 `/cat/travel` · 여행사 `/desk` · 운영자 `/admin`) | 여행사가 상품을 올릴 길이 없습니다 |
| **0074** | 연습장 시설 속성 · 이용 시간 | **예** (`/desk` 입력 · `/pro`·카드 표시) | `/desk` 에서 저장할 때 그 칸이 **지워집니다** |
| **0075** | 게시판 글 **썸네일**(`v_cq_public.thumb`) | **예** (`/cat/community`) | 커뮤니티 목록이 **통째로** 「불러오지 못했습니다」가 됩니다 |
| **0076** | 피팅 · 수리 **이용 방식**(`provider.fit_ways`) | **예** (`/desk` 입력 · `/cat/fitting` 거르개) | `/desk` 에서 저장할 때 그 칸이 **지워지고**, 피팅 거르개가 아무것도 못 모읍니다 |

⚠️⚠️ **0073 은 2026-11-12 저녁에 화면이 섰습니다** — 이제 통째로
올리셔도 됩니다. `tools/check-doors.js` 의 「화면이 아직 없는 문」 목록에서
그 아홉 줄을 **같이 뺐습니다**(안 빼면 검사가 「목록이 썩었다」로 멈춥니다).
⚠️⚠️ 그러면서 0073 에 **보기 하나를 더했습니다** — `v_trip_photo_mine`.
`drop_trip_photo` · `order_trip_photo` 는 **사진 id** 를 받는데 공개
보기는 승인된 상품의 live 사진만 내서, 여행사가 **심사 중인 사진의 id 를
알 길이 없었습니다**(문만 서 있고 읽는 자리가 없던 자리). 0073 은 아직
어디에도 안 돌렸으므로 **새 번호를 만들지 않고 그 파일을 고쳤습니다**
(「번호를 다시 쓰지 않는다」 는 **이미 돌린** 파일의 규칙입니다).

### 돌린 뒤 확인

```sql
-- ① 판
select max(n) from schema_version;                    -- 76
-- ② 새 칸이 실제로 있나
select column_name from information_schema.columns
 where table_name='v_cq_public' and column_name='thumb';
select column_name from information_schema.columns
 where table_name='provider' and column_name in ('range_opts','open_hours');
select column_name from information_schema.columns
 where table_name='jobpost' and column_name in ('role','emp_type','pay_type','pay_min');
select column_name from information_schema.columns
 where table_name='provider' and column_name='fit_ways';
select table_name from information_schema.views where table_name='v_trip_photo_mine';
select table_name from information_schema.tables where table_name='trip';
```

그리고 `db/verify.sql` 을 통째로 돌리시면 열세 줄이 ✅ 여야 합니다.

### 되돌리기

⚠️⚠️ **마이그레이션은 되돌리는 SQL 을 안 씁니다** — 돌린 판을 고치지
않고 **다음 번호**에 적는 것이 이 저장소의 규칙입니다.
⚠️ 다섯 다 **더하기만** 합니다(칸 추가 · 표 추가 · 보기 다시 만들기).
지우는 것이 없으므로 **기존 자료는 그대로**입니다.
⚠️ 보기(`v_cq_public` · `v_provider_card` · `v_job_open`)는
`drop view` + `create view` + **GRANT 다시**입니다 (0076 이 `v_provider_card` 를 한 번 더 다시 만듭니다) — 중간에 멈추면
그 보기만 권한이 빈 채로 남으니, 멈추면 **그 파일만 다시** 돌리세요.

---

## 0. 지금 운영이 어디까지 올라가 있나 — 먼저 세어 보세요

Supabase → SQL Editor 에서 한 줄입니다.

```sql
select max(n) as 판, count(*) as 줄 from schema_version;
```

- **76 이 나오면** 아래 1번은 건너뛰십니다.
- 그보다 작으면 1번을 하셔야 합니다.
- ⚠️ `schema_version` 표 자체가 없다고 나오면 아주 옛 DB 입니다 —
  그때는 `db/README.md` 의 처음부터입니다.

⚠️⚠️ **이 세션은 운영 DB 를 못 봅니다**(접근 권한이 없습니다). 그래서
위 값을 제가 대신 적지 않습니다 — **세어 보신 값**이 참입니다.

---

## 1. 마이그레이션 — 붙여넣기 한 번

**무엇을** `db/apply-from-0008.sql` (0008 ~ **0076** · 69개)
**어디에** Supabase → SQL Editor → New query → 통째로 붙여넣기 → Run
**얼마나** 한 번에 끝납니다. 여러 번 붙여 넣어도 괜찮습니다.

---

## 2. 저장소(Storage) 버킷 — 커뮤니티 썸네일이 보이려면

| 버킷 | 공개 | 환경변수 | 쓰는 자리 |
|---|---|---|---|
| 비공개 | **아니요** | `INTAKE_BUCKET` | 손님 사진 · 업체 **증빙서류** |
| 공개 | **예** | `PROVIDER_BUCKET` | 업체 시설 사진 · 매물 사진 · **게시판 글 사진** · 광고 소재 · **여행 상품 사진** |

⚠️⚠️⚠️ **버킷보다 먼저 — `SUPABASE_SERVICE_KEY` 가 있어야 합니다**
(2026-11-12 에 이 줄이 빠져 있던 것을 찾았습니다). 서명된 올릴 주소를
Supabase 에 청하는 것은 `api/upload.js` 이고, 그 청은 **service key 로만**
됩니다(`api/_db.js` 의 `dbReady()`). 이 키가 없으면 **버킷 둘을 다
만드셔도** `/api/upload` 가 전부 거짓을 돌려주고 화면이 사진 칸을
**아예 안 그립니다** — 에러도 한 줄 안 납니다. 「버킷을 만들었는데 사진
칸이 안 나온다」로만 보입니다.
⚠️⚠️ 이 키는 **RLS 를 통째로 지나갑니다** — Vercel 환경변수에만 넣고
(Production 체크) 채팅 · 코드 · 저장소에는 적지 않습니다. 손님 화면에는
한 글자도 안 내려갑니다.

Supabase → Storage → New bucket → 이름을 정하시고
Vercel → Settings → Environment Variables 에 **그 이름**을 넣습니다.

⚠️⚠️⚠️ **증빙서류 버킷을 공개로 만들지 마세요** — 사업자등록증이 주소만
알면 열립니다. 어느 버킷에 올릴지는 **서버가 경로를 보고** 고릅니다
(`api/upload.js` 의 `bucketForPath()`), 화면이 고르지 않습니다.

⚠️ 없어도 **고장이 아닙니다** — 썸네일 칸이 줄째 빠지고 글은 그대로
보입니다(주소를 지어내지 않습니다).

---

## 3. 적용 차례 — 이 순서대로

```
① schema_version 을 세어 봅니다            (위 0번)
② db/apply-from-0008.sql 붙여넣기           ← 운영 DB 변경 · 대표 승인
③ db/verify.sql 로 열세 줄 확인
④ (사진을 쓰시려면) SUPABASE_SERVICE_KEY + Storage 버킷 둘
   + 환경변수 둘                              ← Vercel 재배포가 필요합니다
⑤ GitHub → Actions → 「검사 (배포는 단추로)」
   → Run workflow → deploy ✓                ← 배포 · 대표 승인
⑥ 손님 화면에서 눌러 보기
```

⚠️⚠️ **②와 ⑤의 차례를 바꾸지 마세요.** 코드를 먼저 올리면, 0075 가
없는 동안 커뮤니티가 「불러오지 못했습니다」로 보입니다. DB 를 먼저
올리면 **옛 코드도 그대로 돕니다**(더하기만 하므로).

⚠️ ⑤가 곧 배포입니다 — `main` 이 움직이면 손님 화면이 바뀝니다.
`ship.yml` 은 push 만으로는 `main` 을 안 움직입니다.

---

## 4. ⑥에서 눌러 보실 것 — 갈라서

| 보는 곳 | 맞으면 | 틀리면 |
|---|---|---|
| `/cat/community` PC | **왼쪽에 게시판 기둥**(모아보기 · 전체 글 + 열둘) | 배포가 안 내려온 것입니다 |
| 왼쪽 메뉴를 누름 | **새로고침 없이** 그 게시판으로 | 자바스크립트가 막힌 것입니다 |
| 글이 0건인 게시판 | 「아직 작성된 글이 없습니다 … **0건**」 + 「첫 이야기 작성」 | — |
| 글이 **안 보이는데** 「다시 시도」가 뜸 | **조회 실패**입니다 — 0075 가 안 올라갔을 가능성이 가장 큽니다 | 0번으로 돌아가세요 |
| `/cat/range` PC | 왼쪽 레일에 **시설 · 이용 시간 고르개 다섯** | 0074 가 안 올라간 것입니다 |
| 연습장 카드의 값 | **타석 요금**(레슨 값이 아닙니다) | — |
| `/cat/fitting` 의 **이용 방식** 고르개 | 넷(방문 · 출장 · 택배 · 예약) 가운데 고르면 좁혀짐 | 0076 이 안 올라간 것입니다 |
| `/cat/travel` | 상품이 0건이면 **0건이라고** 말하고 입점 길을 냄 | 0073 이 안 올라갔으면 「불러오지 못했습니다」 |
| `/desk` 의 「골프 여행 상품」 | 여행 분류 업체에만 상자가 섬 · 「새 상품 올리기」 | 0073 이 안 올라간 것입니다 |
| `/admin` 의 「여행 상품 심사」 | 확인을 기다리는 수 · 승인 · 반려 · 가리기 | 0073 이 안 올라간 것입니다 |
| `/cat/career` 왼쪽 레일 | **직무 · 고용 형태 · 급여 조건** 고르개 | 0072 가 안 올라간 것입니다 |
| 공고 카드를 누름 | **새로고침 없이** 상세(일정 · 자격 · 지원) | 자바스크립트가 막힌 것입니다 |
| `/api/session` 의 `auth` | `true` | `need` 에 적힌 환경변수가 빈 것입니다 |

⚠️⚠️ **마지막 줄이 이번에 새로 생긴 길입니다.** 전에는 그 상황이
「아직 글이 없습니다」로 보여서 **DB 가 안 올라간 것인지 글이 없는
것인지 가릴 수가 없었습니다.**
