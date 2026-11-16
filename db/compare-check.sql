-- db/compare-check.sql — 비교견적(0082 · 0083) 단계 확인 (2026-11-16)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️ **읽기만 합니다** — 아무것도 바꾸지 않습니다. 단계마다 Supabase SQL Editor 에
--   통째로 붙여 넣고 결과 표를 봅니다. 「지금」 칸이 그 단계의 「기대」와 같으면 다음
--   단계로 갑니다(차례는 docs/compare-0082.md).
-- ════════════════════════════════════════════════════════════════════
with
ver as (select coalesce(max(n), 0) n from schema_version),
fn  as (select count(*) n from pg_proc p join pg_namespace s on s.oid = p.pronamespace
         where s.nspname = 'public' and p.proname in
          ('make_compare_request','assign_more','answer_compare','submit_compare_quote','pick_quote')),
trg as (select count(*) n from pg_trigger where not tgisinternal and tgname in
          ('compare_door_quote_t','compare_door_assign_t','compare_state_t','compare_deal_t')),
vw  as (select count(*) n from pg_views where schemaname = 'public' and viewname = 'v_request_contact'),
col as (select count(*) n from information_schema.columns where table_schema = 'public'
          and ((table_name = 'request' and column_name = 'compare') or
               (table_name = 'assignment' and column_name = 'blind') or
               (table_name = 'quote' and column_name in ('kind','terms')))),
anon_fn as (select count(*) n from pg_proc p join pg_namespace s on s.oid = p.pronamespace
         where s.nspname = 'public' and p.proname in
          ('make_compare_request','assign_more','answer_compare','submit_compare_quote','pick_quote',
           'compare_cat_ok','compare_bag_ok','compare_door_guard','compare_state_guard','compare_deal_guard')
           and has_function_privilege('anon', p.oid, 'execute')),
cmp as (select count(*) n from information_schema.columns
         where table_schema = 'public' and table_name = 'request' and column_name = 'compare'),
rows_ as (
  select 1 i, '판 번호' t, (select n from ver)::text got,
         '0082 전 81 · 0082 뒤 82 · 0083 뒤 83' want
  union all select 2, '비교 문 다섯', (select n from fn)::text, '0082 전 0 · 뒤 5'
  union all select 3, '비교 트리거 넷', (select n from trg)::text, '0082 전 0 · 뒤 4'
  union all select 4, '연락처 보기 v_request_contact', (select n from vw)::text, '0082 전 0 · 뒤 1'
  union all select 5, '새 칸 넷 (compare · blind · kind · terms)', (select n from col)::text, '0082 전 0 · 뒤 4'
  union all select 6, '⚠️ 비로그인이 실행할 수 있는 비교 함수', (select n from anon_fn)::text, '언제나 0'
  union all select 7, '회원이 표에서 연락처(tel)를 읽을 수 있나',
         case when has_column_privilege('authenticated', 'public.request', 'tel', 'select')
              then '읽음' else '못 읽음' end, '0083 전 읽음 · 0083 뒤 못 읽음'
  union all select 8, '회원이 표에서 상태(state)를 읽을 수 있나',
         case when has_column_privilege('authenticated', 'public.request', 'state', 'select')
              then '읽음' else '못 읽음' end, '언제나 읽음'
)
select i "#", t "확인", got "지금", want "기대" from rows_ order by i;

-- 비교 요청이 들어왔나 (0082 뒤에만 의미가 있습니다 · 칸이 없으면 이 줄은 건너뛰세요)
-- select count(*) filter (where compare) "비교 요청", count(*) "전체 요청" from request;
