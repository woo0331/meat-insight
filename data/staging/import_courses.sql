-- ════════════════════════════════════════════════════════════════
-- 골프장 · 연습장 들여오기 — 2026-11-07T20:15:31.101Z
-- 만든 도구: tools/make-import-sql.js  (손으로 고치지 마세요)
-- 줄 수: 0  (거절 0줄 — data/staging/import_row_issue.csv)
--
-- ⚠️⚠️ **두 번 붙여 넣어도 안전합니다** (on conflict 로 덮습니다).
-- ⚠️⚠️ 되돌리려면 data/staging/rollback_courses.sql 을 쓰세요.
-- ⚠️ 0066 이 먼저 돌아가 있어야 합니다.
-- ════════════════════════════════════════════════════════════════
begin;

-- 이 묶음을 알아보는 표시 — 되돌릴 때 이것으로 찾습니다
create temp table _imp(batch text);
insert into _imp values ('b7b9937f2a081');

commit;

-- 넣은 뒤 확인
select kind, state, count(*) from course group by 1, 2 order by 1, 2;