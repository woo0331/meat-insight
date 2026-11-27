-- ⚠️⚠️ 초안입니다 — db/migrations 가 아니라 docs 에 둡니다 (적용 전 대표 승인 필요 · 2026-11-26).
-- 넣는 날 같이 고칠 것: tools/test-sql.js 941줄(견적 없이 quoted 로 넘기는 검사) · db/verify.sql 기대값 · api/_migrations.js(빌드).
-- 로컬 임시 Postgres(0001~0084 + 이 파일)에서 7가지 확인: 견적 없이 quoted 거절(직원 · 업체) · 저장 실패 시 상태 그대로 · 저장 시 견적 1 + quoted · 재시도에 중복 없음 · 기존 건 보존.
-- 초안 (적용 전) — 견적 줄 없이 '견적 전달'(quoted) 로 넘어가지 못하게 합니다.
-- 새 상태로 들어가는 그 한 걸음만 봅니다 — 이미 quoted 이후인 건(SW-EX79-WR8H 등)은 건드리지 않습니다.
create or replace function request_quoted_guard() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.state = 'quoted' and old.state is distinct from 'quoted'
     and not exists (select 1 from quote q where q.request_id = new.id and q.state <> 'withdrawn') then
    raise exception '견적이 기록되지 않아 견적 전달로 넘길 수 없습니다 — 받은 견적 적기로 먼저 기록해 주세요';
  end if;
  return new;
end $$;
drop trigger if exists request_quoted_guard on request;
create trigger request_quoted_guard before update of state on request
  for each row execute function request_quoted_guard();
