-- ════════════════════════════════════════════════════════════════════
--  고리 (aboutmeat.co.kr) — PHASE 6 : 실시간 갱신 (Supabase Realtime)
--
--  왜 필요한가
--    새 견적·새 메시지·새 알림이 지금은 화면을 다시 열어야 보입니다.
--    채팅만 6초마다 서버에 다시 물어보고 있어서, 요청자와 업체가
--    동시에 보고 있어도 반응이 늦습니다.
--
--  무엇을 바꾸는가
--    테이블·컬럼·데이터는 하나도 건드리지 않습니다.
--    이미 있는 세 테이블을 Supabase 의 실시간 발행 목록
--    (supabase_realtime publication) 에 추가하기만 합니다.
--    RLS 정책이 그대로 적용되므로, 각자 볼 수 있는 행만 전달됩니다.
--
--  되돌리는 방법
--    맨 아래 주석 처리된 ALTER ... DROP TABLE 세 줄을 실행하면
--    실시간만 꺼지고 나머지는 그대로입니다.
--
--  실행하지 않아도 됩니다
--    실행 전에는 화면이 지금까지처럼(폴링·수동 새로고침) 동작합니다.
--    실행하면 그 위에 실시간 갱신이 얹힙니다.
-- ════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────
-- 1. 실시간 발행 대상에 추가 (이미 들어 있으면 조용히 넘어갑니다)
-- ────────────────────────────────────────────────────────────
do $$
declare
  t text;
begin
  foreach t in array array['notifications','chat_messages','quotes'] loop
    if to_regclass('public.'||t) is null then
      raise notice '건너뜀: public.% 테이블이 없습니다. phase2/phase3 스키마를 먼저 실행해 주세요.', t;
      continue;
    end if;
    if exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      raise notice '이미 등록됨: public.%', t;
      continue;
    end if;
    execute format('alter publication supabase_realtime add table public.%I', t);
    raise notice '추가함: public.%', t;
  end loop;
exception
  when undefined_object then
    raise notice 'supabase_realtime publication 이 없습니다. Supabase 대시보드 → Database → Replication 에서 켜 주세요.';
end $$;

-- ────────────────────────────────────────────────────────────
-- 2. UPDATE/DELETE 이벤트까지 정확히 받으려면 (선택)
--    기본값(REPLICA IDENTITY DEFAULT)은 기본키만 실어 보냅니다.
--    지금 화면은 INSERT 만 사용하므로 켜지 않아도 됩니다.
--    견적 수정·철회까지 실시간으로 반영하고 싶을 때만 켜세요.
-- ────────────────────────────────────────────────────────────
-- alter table public.quotes replica identity full;
-- alter table public.chat_messages replica identity full;

-- ────────────────────────────────────────────────────────────
-- 3. 되돌리기 (필요할 때만)
-- ────────────────────────────────────────────────────────────
-- alter publication supabase_realtime drop table public.notifications;
-- alter publication supabase_realtime drop table public.chat_messages;
-- alter publication supabase_realtime drop table public.quotes;

-- 확인용: 현재 실시간 발행 중인 테이블 목록
-- select tablename from pg_publication_tables where pubname='supabase_realtime' order by 1;
