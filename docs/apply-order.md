# 운영에 올리는 차례 — 마이그레이션 · 저장소 설정

날짜 2026-11-12 · 가지 `claude/git-branch-workflow-j74dol`

⚠️⚠️⚠️ **아직 아무것도 적용하지 않았습니다.** 운영 DB 도 · 배포도
건드리지 않았습니다. 이 글은 **순서표**입니다.

⚠️ 지금은 `SITE_LIVE = false` 입니다 — 모든 화면에 noindex 가 붙고
robots 가 전부 막습니다. 아래를 다 하셔도 **검색에는 안 올라갑니다.**

---

## 0. 지금 운영이 어디까지 올라가 있나 — 먼저 세어 보세요

Supabase → SQL Editor 에서 한 줄입니다.

```sql
select max(n) as 판, count(*) as 줄 from schema_version;
```

- **75 가 나오면** 1번은 건너뛰십니다.
- **그보다 작으면** 1번을 하셔야 합니다.
- ⚠️ `schema_version` 표 자체가 없다고 나오면 아주 옛 DB 입니다 —
  그때는 `db/README.md` 의 처음부터입니다.

⚠️⚠️ **이 세션은 운영 DB 를 못 봅니다**(접근 권한이 없습니다). 그래서
위 값을 제가 대신 적지 않습니다 — **세어 보신 값**이 참입니다.

---

## 1. 마이그레이션 — 붙여넣기 한 번

**무엇을** `db/apply-from-0008.sql` (0008 ~ **0075**)
**어디에** Supabase → SQL Editor → New query → 통째로 붙여넣기 → Run
**얼마나** 한 번에 끝납니다. 여러 번 붙여 넣어도 괜찮습니다(그렇게
만들어 두었고 `test-upgrade` 가 그것을 재 봅니다).

이번 차수에서 **새로 들어가는 넷**입니다.

| 판 | 무엇 | 없으면 어떻게 되나 |
|---|---|---|
| **0072** | 구인 · 구직에 직무 · 고용형태 · 급여 칸, 갈래에 「시설 · 장비 거래」 | `/cat/career` 의 그 칸이 **질의째 거절**되어 목록이 빈 채로 남습니다 |
| **0073** | 여행 상품(`trip` · `tripphoto`) · 수정본 따로 심사 | `/cat/travel` 의 상품 등록 · 목록이 **안 열립니다** |
| **0074** | 연습장 시설 속성 · 이용 시간(`provider.range_opts` · `open_hours`) | `/desk` 에서 저장할 때 그 칸이 **지워집니다**, `/cat/range` 거르개가 0건 |
| **0075** | 게시판 글 **썸네일**(`v_cq_public.thumb`) | 커뮤니티 목록이 **통째로 빈 채로** 남습니다(안 준 칸을 부르면 질의가 거절됩니다) |

⚠️⚠️⚠️ **0075 를 안 올리시면 커뮤니티가 안 보입니다.** 화면이 `thumb`
칸을 함께 부르는데, Postgres 는 **없는 칸을 부르면 0줄이 아니라 질의를
통째로 거절**합니다. 그리고 지금은 그 실패가 **「불러오지 못했습니다 ·
다시 시도」**로 보입니다(전에는 「아직 글이 없습니다」로 보였습니다).

### 돌린 뒤 확인

```sql
-- ① 판
select max(n) from schema_version;                    -- 75
-- ② 새 칸 넷이 실제로 있나
select column_name from information_schema.columns
 where table_name='v_cq_public' and column_name='thumb';
select column_name from information_schema.columns
 where table_name='provider' and column_name in ('range_opts','open_hours');
select column_name from information_schema.columns
 where table_name='jobpost' and column_name in ('role','emp_type','pay_type','pay_min');
select table_name from information_schema.tables where table_name='trip';
```

그리고 `db/verify.sql` 을 통째로 돌리시면 열세 줄이 ✅ 여야 합니다.

### 되돌리기

⚠️⚠️ **마이그레이션은 되돌리는 SQL 을 안 씁니다** — 돌린 판을 고치지
않고 **다음 번호**에 적는 것이 이 저장소의 규칙입니다. 문제가 생기면
그 판을 지우는 것이 아니라 **0076 을 새로 만들어** 되돌립니다.
⚠️ 넷 다 **더하기만** 합니다(칸 추가 · 표 추가 · 보기 다시 만들기).
지우는 것이 없으므로 **기존 자료는 그대로**입니다.
⚠️ 보기(`v_cq_public` · `v_provider_card` · `v_job_open`)는
`drop view` + `create view` + **GRANT 다시**입니다 — 중간에 멈추면
그 보기만 권한이 빈 채로 남으니, 멈추면 **그 파일만 다시** 돌리세요.

---

## 2. 저장소(Storage) 버킷 — 커뮤니티 썸네일이 보이려면

| 버킷 | 공개 | 환경변수 | 쓰는 자리 |
|---|---|---|---|
| 비공개 | **아니요** | `INTAKE_BUCKET` | 손님 사진 · 업체 **증빙서류** |
| 공개 | **예** | `PROVIDER_BUCKET` | 업체 시설 사진 · 매물 사진 · **게시판 글 사진** · 광고 소재 |

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
④ (하실 거면) Storage 버킷 둘 + 환경변수 둘  ← Vercel 재배포가 필요합니다
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
| `/api/session` 의 `auth` | `true` | `need` 에 적힌 환경변수가 빈 것입니다 |

⚠️⚠️ **마지막 줄이 이번에 새로 생긴 길입니다.** 전에는 그 상황이
「아직 글이 없습니다」로 보여서 **DB 가 안 올라간 것인지 글이 없는
것인지 가릴 수가 없었습니다.**
