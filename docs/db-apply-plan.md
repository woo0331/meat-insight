# 운영 DB 적용 계획 — 백업 · 정확한 범위 · 부분 실패 복구

> 2026-11-12 · **아직 적용하지 않았습니다.** 사장님 승인 전에는 한 줄도
> 돌리지 않습니다.

---

## 0. 먼저 — `max(n)` 하나로 판정하지 않습니다

`schema_version` 은 마이그레이션 파일이 **스스로 적는** 줄입니다.
그래서 이 셋이 **똑같이 보입니다** —

* 끝까지 제대로 돌아간 DB
* 중간에서 멈췄는데 앞쪽 `insert` 는 이미 들어간 DB
* 번호만 손으로 넣어 둔 DB

실제로 눌러 봤습니다. **0075 만 건너뛰고** 나머지를 전부 올린 DB 는
`select max(n) from schema_version` 이 **79** 를 돌려줍니다 — 겉으로는
완료입니다. `db/audit.sql` 은 그 자리에서 `① 빠진 번호 | 75 | ❌` 를
냅니다.

---

## 1. `db/audit.sql` — 지금 운영 DB 가 어디까지 올라갔는지

Supabase → **SQL Editor** → `db/audit.sql` 을 통째로 붙여 넣고 **Run**.

| 묻는 것 | 왜 |
|---|---|
| ① 판 번호 · **빠진 번호** | 중간을 건너뛴 DB 를 잡습니다 |
| ② 빠진 **표** | 표가 실제로 있는가 (판 번호와 따로 봅니다) |
| ③ 빠진 **보기** | 공개로 나가는 길이 실제로 있는가 |
| ④ 빠진 **문** · 부를 권한 | 문이 있어도 EXECUTE 가 없으면 못 씁니다 |
| ⑤ **anon 에게 열린 표** | RLS 는 줄은 막아도 **칸은 못 막습니다** |

**❌ 가 한 줄도 없어야 올라간 것입니다.**

이 파일은 `node tools/make-audit.js` 가 마이그레이션에서 **읽어서**
만듭니다 — 표 · 보기 · 문 이름을 손으로 적지 않습니다(손으로 적은
목록은 반드시 썩습니다).

### 되돌려 보기로 확인한 것

| 만든 상태 | `max(n)` | audit.sql |
|---|---|---|
| 0001~0079 전부 | 79 | **7/7 ✅** |
| 0001~0071 까지만 | 71 | ❌ 넷 — 빠진 번호 8개 · 표 4개 · 보기 8개 · 문 13개를 **이름으로** |
| 0075 만 건너뜀 | **79** | ❌ 하나 — `빠진 번호 \| 75` |

---

## 2. 정확한 적용 범위

`db/audit.sql` ①이 돌려주는 값에 따라 정해집니다. 운영 DB 에 **직접
접속할 수 없어서**(이 세션은 밖으로 못 나갑니다) 지금 몇 판인지는
**제가 확인하지 못했습니다** — 사장님이 ①을 돌려 주셔야 갈립니다.

| ① 의 값 | 붙여 넣을 것 |
|---|---|
| `0` 또는 `7` | `db/apply-from-0008.sql` **통째로** (0008 ~ 0079 · 72개) |
| `N` (8 ≤ N < 79) | `db/migrations/` 에서 **N+1 번부터 0079 까지** 차례대로 |
| 빠진 번호가 있음 | **그 번호만** 따로, 그다음 위 줄대로 |
| `79` 이고 ❌ 0건 | 할 것 없습니다 |

⚠️ **번호를 건너뛰지 마세요.** 뒤 번호가 앞 번호의 함수·보기를
`create or replace` 로 덮는 짝이 **38개**입니다(`node tools/check-chains.js`).
순서가 바뀌면 **앞 번호의 옛 판이 뒤에 와서 이깁니다** — 에러가 안 나고
조용히 안전장치가 내려갑니다.

### 이번에 새로 올라가는 것 (0077 · 0078 · 0079)

| 판 | 하는 일 | 새 표 | 새 문 | 덮는 것 |
|---|---|---|---|---|
| 0077 | 여행 출발일 · 출발 가능 기간 | `tripdate` | `set_trip_depart` · `trip_months` · `trip_next_depart` | `v_trip_open` · `v_trip_mine` (0073→0077) |
| 0078 | 인력 공고 북마크 | `jobfav` | `fav_jobpost` | — (`v_job_fav` 는 새 보기) |
| 0079 | 피팅 거래 조건 | — | — | `save_provider_self` · `v_provider_card` (0076→0079) |

세 판 모두 **더하기만** 합니다 — 칸을 지우거나 이름을 바꾸는 줄이
한 줄도 없습니다. 기존 레코드는 새 칸이 `null`(또는 `'none'`)로
들어가고, 화면은 그 상태를 **그대로 말합니다**(「출발일 미등록」 ·
딱지 없음). 지어낸 값으로 채우지 않습니다.

---

## 3. 백업 — 돌리기 **전에**

### 3-1. Supabase 가 떠 주는 것 (먼저 확인)

Supabase → **Database → Backups**. 거기에 무엇이 있는지는 요금제마다
다릅니다 — **제가 확인하지 못했습니다.** 사장님이 그 화면에서
보시는 것이 참입니다.

* **Daily backups** — 무료 · Pro 요금제에 있습니다(보관 기간이 다릅니다)
* **Point-in-Time Recovery (PITR)** — 별도 추가 기능입니다

⚠️ **「백업이 있을 것이다」로 시작하지 마세요.** 그 화면에 **오늘
날짜의 줄이 실제로 보이는지**를 눈으로 보고 시작합니다.

### 3-2. 우리가 직접 뜨는 것 (권장 — 이것만으로도 충분합니다)

Supabase → **Project Settings → Database → Connection string → URI**
를 복사하신 뒤, 사장님 PC 에서:

```
pg_dump "<복사한 URI>" --schema-only  -f golf-schema-2026-11-12.sql
pg_dump "<복사한 URI>" --data-only --disable-triggers -f golf-data-2026-11-12.sql
```

⚠️ **그 URI 에는 비밀번호가 들어 있습니다** — 채팅 · 저장소 · 메일에
붙여 넣지 마세요. 파일로만 두시고 다 쓰시면 지우십시오.

⚠️ 스키마와 자료를 **갈라서** 뜹니다 — 되돌릴 때 스키마만 되돌리는
경우가 대부분이고, 자료까지 덮으면 그 사이에 들어온 손님 글이
사라집니다.

---

## 4. 돌리는 차례

1. `db/audit.sql` 을 돌려 **지금 상태**를 적어 둡니다(①~⑤ 값 그대로).
2. 백업(3-1 확인 + 3-2 실행).
3. **한 판씩** 붙여 넣습니다. 통째로 붙여 넣으면 어디서 멈췄는지
   찾기 어렵습니다. 한 판이 끝날 때마다
   `select max(n) from schema_version;` 로 번호가 올라갔는지 봅니다.
4. 전부 끝나면 **`db/audit.sql` 과 `db/verify.sql` 둘 다** 돌립니다.
   * `audit.sql` — 있어야 할 것이 **있는가** (❌ 0건)
   * `verify.sql` — 수가 **맞는가** (판 79 · 표 59 · 13줄 전부 ✅)
5. 그다음에 배포(`DEPLOY.md`).

⚠️ **4 번을 건너뛰지 마세요.** 3 번이 조용히 반만 돌아간 경우를 잡는
자리가 거기뿐입니다.

---

## 5. 부분 실패 — 어디서 멈췄을 때 무엇을 하나

### 5-1. 마이그레이션 파일은 **대부분 다시 돌려도 됩니다**

* `create table if not exists` · `create or replace function` ·
  `drop view … ; create view …` · `insert … on conflict (n) do nothing`
* 그래서 **멈춘 그 판부터 다시** 붙여 넣는 것이 기본 대응입니다.

### 5-2. 다시 돌리면 안 되는 자리 — **앞 번호**

⚠️⚠️ **앞 번호 파일을 다시 붙여 넣지 마세요.** 뒤 번호가 덮어 둔
함수 · 보기 · 정책이 **앞 번호의 옛 판으로 되돌아갑니다**(38개 짝).
에러가 한 줄도 안 납니다.

예) 0053 이 좁혀 둔 문의 메모 칸 GRANT 는 0045 를 다시 붙여 넣으면
조용히 풀립니다 — 손님이 제 문의 줄의 **운영자 메모**를 읽게 됩니다.

👉 꼭 다시 돌려야 하면 **`db/apply-from-0008.sql` 을 통째로** 쓰십시오.
그 파일은 번호순이라 뒤 번호가 마지막에 와서 다시 덮습니다.

### 5-3. 멈춘 자리별 대응

| 증상 | 무엇이 일어난 것 | 무엇을 하나 |
|---|---|---|
| `ERROR` 가 나고 SQL Editor 가 멈춤 | 그 판이 **통째로 안 들어갔습니다**(Supabase 는 한 번에 보낸 것을 한 트랜잭션으로 돕니다) | 에러 줄을 그대로 보내 주세요. 고친 뒤 **그 판부터** 다시 |
| `max(n)` 은 올랐는데 `audit.sql` 에 ❌ | 그 판이 **반만** 들어갔을 수 있습니다 | **그 판을 다시** 붙여 넣습니다(대부분 다시 돌아갑니다) |
| 빠진 번호가 있음 | 그 번호를 건너뛰었습니다 | **그 번호만** 따로, 그다음 뒷번호를 차례대로 다시 |
| `cannot drop view … because other objects depend on it` | 보기 위에 보기를 얹은 자리 | 그 줄을 보내 주세요 — 번호를 고치지 않고 **다음 번호**에 적습니다 |
| 되돌려야 함 | — | 3-2 의 `golf-schema-*.sql` 로 스키마를 되돌립니다. ⚠️ **자료는 덮지 마세요** |

### 5-4. 운영 자료를 지우는 길은 **한 줄도 없습니다**

0077 · 0078 · 0079 에 `drop table` · `drop column` · `delete from` ·
`truncate` 가 **한 줄도 없습니다**. 되돌리실 일이 생겨도 새로 만든
표(`tripdate` · `jobfav`)와 칸만 지우면 되고, 그 전부터 있던 자료는
건드리지 않습니다.

```
-- 0077 · 0078 · 0079 만 되돌리기 (필요할 때만)
drop view if exists v_job_fav;
drop function if exists fav_jobpost(jsonb);
drop table if exists jobfav;
-- 0077 은 v_trip_open · v_trip_mine 을 덮었으므로
-- **0073 을 다시 붙여 넣어** 그 두 보기를 되돌립니다
drop view if exists v_trip_date_mine;
drop view if exists v_trip_date_public;
drop table if exists tripdate;
drop function if exists set_trip_depart(jsonb);
drop function if exists trip_months(text, date, date, date[]);
drop function if exists trip_next_depart(text, date, date, date[]);
alter table trip drop column if exists depart_kind;
alter table trip drop column if exists depart_from;
alter table trip drop column if exists depart_to;
-- 0079 는 save_provider_self · v_provider_card 를 덮었으므로
-- **0076 을 다시 붙여 넣어** 그 둘을 되돌립니다
alter table provider drop column if exists fit_terms;
delete from schema_version where n in (77, 78, 79);
```

⚠️ 되돌리시면 **화면도 같이 되돌려야 합니다**(`git revert`) — 안 그러면
화면이 없는 칸을 부르고 그 상자가 **빈 채로** 남습니다.

---

## 6. 제가 확인하지 못한 것

* **운영 DB 가 지금 몇 판인지** — 이 세션은 밖으로 못 나갑니다.
  `db/audit.sql` ①을 돌려 주셔야 갈립니다.
* **Supabase 백업 화면에 무엇이 있는지** — 요금제마다 다릅니다.
* 위 표의 대응은 전부 **임시 Postgres 에서** 눌러 본 것입니다
  (0001~0079 전부 · 0071 까지만 · 0075 만 건너뜀 — 셋).
  **운영에서 돌려 본 것이 아닙니다.**
