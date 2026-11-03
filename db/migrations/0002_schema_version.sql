-- ════════════════════════════════════════════════════════════════════
-- 0002 — 스키마 판 번호 (지시서 §1 "DB 변경 전 마이그레이션 계획")
--
-- ⚠️⚠️ **이것이 없으면 "지금 DB 가 몇 번째 판인가" 를 알 수 없습니다.**
-- 같은 마이그레이션을 두 번 돌리거나, 안 돌린 것을 돌렸다고 믿게
-- 됩니다 — 둘 다 조용히 깨지는 종류입니다.
--
-- ⚠️ 마이그레이션을 **손으로 돌리실 때마다** 아래 insert 를 같이
-- 돌려 주세요. db/README.md 에 차례가 적혀 있습니다.
-- ════════════════════════════════════════════════════════════════════
create table if not exists schema_version (
  n          int primary key,
  name       text not null,
  applied_at timestamptz not null default now(),
  by_note    text
);
alter table schema_version enable row level security;
create policy sv_admin on schema_version for select using (my_role() = 'admin');

insert into schema_version (n, name) values
  (1, '0001_init'),
  (2, '0002_schema_version')
on conflict (n) do nothing;
