# 운영 DB 적용 진행 보고서 (2026-11-14)

> 다른 AI(ChatGPT 등)나 다른 작업자에게 넘기기 위한 보고서입니다.
> 저장소: `woo0331/meat-insight` · 작업 브랜치: `claude/git-branch-workflow-j74dol`
> 운영 Supabase 프로젝트 ref: `igignylgzjphtnyxhhsd` (ap-northeast-2 · Postgres 17)

---

## 1. 한 줄 요약

운영 DB에 골프올인원 마이그레이션 **0001~0081** 가운데 **0067까지는 적용됐습니다.**
**0068~0081(14개)**, **권한 복원(post-apply)**, **최종 검증**은 아직 하지 않았습니다.
기존 서비스의 16개 테이블은 **한 글자도 안 바뀌었고**, 백업도 남아 있습니다.

| 항목 | 상태 |
|---|---|
| 적용된 판 | **67** (`schema_version` 67줄) |
| 남은 판 | 0068 ~ 0081 (14개) |
| 기본 권한 | **pre-apply 상태 그대로** — 아직 복원 안 됨 (아래 4-3) |
| 기존 16개 테이블 | 적용 전과 **완전히 같음** (지문 일치) |
| 백업 | `golf_backup_20261114` 스키마 · 표 17개(16개 + `_ddl`) · 지우지 말 것 |

---

## 2. 배경 — 왜 이렇게 조심스럽게 했나

- 운영 Supabase 프로젝트의 `public` 스키마에는 **다른 서비스(정육·창업 상담)** 의
  표 16개가 실데이터와 함께 살고 있습니다:
  `business_members · businesses · closure_requests · community_comments ·
  community_posts · consult_requests · jobs · listings · members · orders ·
  partner_requests · products · purchase_requests · subsidy_requests ·
  suppliers · supply_requests`
- 우리 마이그레이션의 표·보기·함수·타입과 **이름이 겹치는 것은 0건**입니다
  (`listing` ↔ `listings` 처럼 비슷하지만 다릅니다).
- Supabase 기본값인 `alter default privileges ... grant all ... to anon, authenticated`
  때문에, 그대로 올리면 우리 쪽 내부 함수 31개와 연락처 칸들이 anon에게 열립니다.
  그래서 **pre-apply(기본 권한 좁히기) → 마이그레이션 → post-apply(원래대로
  복원)** 순서로 합니다. 기존 16개 표의 권한·정책·데이터는 이 과정에서 안 바뀝니다
  (default privileges 는 새로 만들어지는 객체에만 걸립니다).
- 사장님(사용자) 지시:
  - 기존 데이터·권한에 예상 밖 변화가 생기면 **멈추고 보고**
  - 백업 삭제 금지 · 인증/환경변수/기존 서비스 권한 변경 금지
  - RLS가 꺼진 기존 8개 표(아래 6장)는 **건드리지 말고 보고만**

---

## 3. 지금까지 한 일 (차례대로)

1. **연결 확인** — Supabase MCP 도구로 프로젝트·테이블 목록을 직접 조회했습니다.
2. **조사 SQL 오류 수정**
   - `42725` (`text || "char"`): `defaclobjtype::text`, `polcmd::text` 로 형변환
   - `42809` (`has_sequence_privilege` 를 시퀀스 아닌 것에 호출): relacl 직접 읽기로 교체
3. **백업 확보 · 검증** — `golf_backup_20261114` 스키마에 16개 표 사본 + `_ddl`(287줄).
   데이터·구조가 원본과 같은지 지문으로 확인했고, anon 은 그 스키마를 못 씁니다.
4. **지문(fingerprint) 기준값 저장** — `db/fingerprint.sql`
   - 구조·권한·정책 포함 지문 `fp = fea1f0a0fde78ae70128ae80c587d659`
   - 데이터 지문 `data_fp = 290e637f0bb923d8a1c5b514da28e1fd`
   - 적용 전 기본 권한 지문 `defacl = 4b42f19c2243a8010c8b86654cb4c753`
5. **리허설** — 임시 Postgres에 운영과 같은 기본 권한을 재현하고, 실제와 같은 방식
   (파일 하나씩 · 파일 사이 `commit;`)으로 0001~0081 + post-apply + verify + list-check
   를 돌렸습니다. 결과: 판 81 · post-apply ❌ 0 · verify ✅ 14 · list-check ✅ 8 ·
   기존 16표 지문 동일.
6. **운영 적용**
   - pre-apply 실행 완료 (기본 권한 지문이 `a3691f6c…` 로 바뀜 — 의도된 변화)
   - 0001 → 0067 까지 MCP `execute_sql` 로 순서대로 적용, 매번 `max(n)` 확인
   - 0006 은 enum 값 추가 제약(55P04) 때문에 21번째 줄에서 둘로 나눠 실행
7. **저장소에 남긴 것** (모두 작업 브랜치에 push 됨)
   - `db/fingerprint.sql`, `docs/backup-2026-11-14.md`, `db/README.md` 의 백업 기준
   - `.claude/settings.json` — Supabase 조회·실행 도구 4개만 반복 허용
   - `CLAUDE.md` — 대화 언어를 한국어로 고정
   - `db/apply-from-0068.sql` — 0068~0081 한 파일 (약 16만 자)
   - `db/apply-0068-0081/` — 0068~0081 을 **판마다 한 파일**(14개)

---

## 4. 무엇이 문제였나 (오류·막힘 전체)

### 4-1. 도구 쪽에서 해결한 오류 (이미 끝남)
| 오류 | 원인 | 처리 |
|---|---|---|
| 42725 | `"char"` 과 text 를 바로 이음 | `::text` 형변환 |
| 42809 | 시퀀스 권한 함수를 표에도 호출 | relacl 직접 읽기 |
| 55P04 | `alter type ... add value` 한 값을 같은 트랜잭션에서 씀 | 0006 을 둘로 나눔 · 파일 사이 `commit;` |
| 0042 일부가 0040 뒤에 붙어 감 | 묶음 실수 | `rollback` 으로 끝나 남은 것 없음 확인 → 0041, 0042~0044 순서대로 다시 |
| 0009 호출이 권한 창 때문에 중단 | 앱 승인 창 | 상태 조회(8판 그대로) 후 다시 보냄 |
| `initdb` 권한 오류 (리허설) | 스크래치 폴더 권한 | `/tmp/pgreh.XXXX` 사용 |

### 4-2. 지금 막혀 있는 것 ① — AI 도구로 0068 이후를 보낼 수 없음
- 0068~0070 묶음(약 4만 자)을 `execute_sql` 로 보내던 응답이 **AI 쪽 안전 필터에
  막혀** 그 호출은 **실행되지 않았습니다** (DB 조회로 확인: 판 67 · `listing.brand` 칸 0개).
- 같은 내용을 다시 생성하지 말라는 제한이 걸려, **이 세션의 AI는 남은 마이그레이션
  SQL을 다시 보낼 수 없습니다.** 그래서 사용자가 Supabase SQL 편집기에 붙여 넣는
  방식으로 바꿨습니다.

### 4-3. 지금 막혀 있는 것 ② — SQL 편집기 실행이 DB에 닿지 않음
사용자가 SQL 편집기에서 실행했다고 네 번 알려 주셨고, 한때 결과 창에 `81` 이
보였다고 했지만, 매번 DB를 직접 조회하면:

- `select max(n) from schema_version` → **67**
- `listingphoto`, `trip` 표 → **어느 스키마에도 없음**
- `schema_version` 표는 `public` 에 **하나뿐**
- 이 계정에 보이는 Supabase 프로젝트는 **하나뿐**, 개발 브랜치 **없음**
- 사용자가 새 탭에서 확인 쿼리를 돌린 결과도 **ver 67 · lp null · trip null** 로 같음

**결정적 단서 — Postgres 로그:** 이 DB는 DDL 문장을 성공·실패·되돌림과 상관없이
`statement:` 로그에 남깁니다. 그런데 **05:47 UTC (AI가 보낸 0064~0067 묶음) 이후
DDL 기록이 한 줄도 없습니다.** 즉 편집기에서 실행한 0068 문장은
"실행된 뒤 되돌려진 것"이 아니라 **이 DB까지 오지 않은 것**으로 보입니다.

가능한 원인 (아직 확정 못 함):
1. 편집기가 다른 DB/프로젝트에 붙어 있음 (이름이 같아 보여도 ref 가 다를 수 있음)
2. 붙여 넣은 내용이 실제로 실행되지 않았음 (실행 단추 대신 다른 동작, 이전 결과 창이 남아 있었음 등)
3. 편집기의 "destructive operation" 경고 창에서 취소됨 (`drop view` 등이 있음)

확인 방법 (사용자에게 요청해 둔 것): SQL 편집기 새 탭에서
```sql
select inet_server_addr() as addr, current_database() as db,
       (select count(*) from pg_class where relname = 'listings') as legacy_listings;
```
AI 쪽에서 보이는 값: `addr = 2406:da12:557:f802:9546:5e28:30fd:a12a/128`,
`db = postgres`, `legacy_listings = 1`. 같으면 같은 DB, 다르면 편집기가 다른 DB.

### 4-4. 지금 남아 있는 위험
- **기본 권한이 좁혀진 채로 남아 있습니다.** 이 상태에서 기존 서비스가 `public`에
  새 표·함수를 만들면 anon·authenticated 권한 없이 생깁니다(기존 표에는 영향 없음).
  오래 두면 안 되며, 0068~0081 을 끝내거나 아니면 `db/post-apply.sql` 만이라도
  먼저 돌려 복원해야 합니다(그 경우 나중에 0068 전에 `db/pre-apply.sql` 다시).
- 0071~0077, 0080, 0081 은 **begin/commit 으로 감싸지 않은 파일**입니다
  (`alter type ... add value` 때문). 중간에 오류가 나면 **앞부분이 적용된 채 남으므로**
  같은 파일을 그냥 다시 돌리지 말고, `db/resume.sql` 로 상태를 본 뒤 이어야 합니다.

---

## 5. 앞으로 필요한 것 (할 일 순서)

1. **편집기와 DB가 같은지 확정** — 4-3 의 쿼리 결과 비교.
2. **0068 ~ 0081 적용** — `db/apply-0068-0081/` 의 파일을 번호 순서대로 하나씩.
   각 파일 끝의 `select max(n)` 이 그 번호인지 보고, **다른 새 탭**에서 다시 확인.
   (대안: 이 세션이 아닌 다른 도구/세션에서 MCP 또는 psql 로 같은 파일을 실행.
   DB 비밀번호·연결 문자열은 저장소에 적지 말 것.)
3. **post-apply** — `db/post-apply.sql`. 끝난 뒤 기본 권한 지문이 적용 전 값
   `4b42f19c2243a8010c8b86654cb4c753` 과 같아야 합니다.
4. **최종 검증**
   - `db/verify.sql` (리허설 기준 ✅ 14 · ❌ 0)
   - `db/list-check.sql` (리허설 기준 ✅ 8)
   - `db/fingerprint.sql` 계열 지문: `fp = fea1f0a0…`, `data_fp = 290e637f…` 그대로인지
   - 백업 스키마 `golf_backup_20261114` 가 남아 있는지 (지우지 않음)
5. **최종 보고** — 적용 판 번호 · 16개 테이블 보존 결과 · 권한 검사 · 목록 조회 결과.

---

## 6. 손대지 않고 보고만 하는 것 (사용자 승인 필요)

기존 서비스 16개 표 가운데 **8개가 RLS가 꺼진 채 anon에게 열려 있습니다.**
`consult_requests`(이름·전화·이메일 포함) · `closure_requests` · `partner_requests` ·
`supply_requests` · `members`(kakao_id·이메일) · `businesses` · `listings` ·
`subsidy_requests`. 같은 anon 키로 읽히므로 골프 사이트 쪽에서도 읽힙니다.
우리가 올리기 **전부터** 그런 상태이며, 승인 없이는 바꾸지 않았습니다.

---

## 7. 참고 파일

| 파일 | 용도 |
|---|---|
| `db/pre-apply.sql` | 기본 권한 좁히기 (이미 실행됨) |
| `db/apply-0068-0081/*.sql` | 남은 14개 판, 하나씩 실행 |
| `db/apply-from-0068.sql` | 같은 내용 한 파일 (편집기에서 반영 안 됐던 것) |
| `db/post-apply.sql` | 기본 권한 복원 + 점검 |
| `db/verify.sql` · `db/list-check.sql` | 최종 검증 |
| `db/fingerprint.sql` | 기존 16표 지문 |
| `db/resume.sql` | 중간에 멈췄을 때 어디까지 됐는지 보는 조회 |
| `docs/backup-2026-11-14.md` | 백업 기록과 실행 계획 |
