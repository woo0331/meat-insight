-- 되돌리기 — ⚠️⚠️ **이 묶음(batch_id)이 넣은 골프장만** 지웁니다.
-- 묶음: chungbuk-golf=3dc76a7f-0c2c-4834-af97-f1733dc4f833 · mcst-golf-nationwide=3fcbc983-2422-4589-a1be-ea2f67cdfdb6
-- ⚠️ 그 가운데 하나라도 다른 출처 · 티타임 · 별칭과 이어졌거나 운영자가 고쳤으면
--    **아무것도 안 지우고 멈춥니다**(에러 글에 목록이 나옵니다).
begin;
create temp table _rb on commit drop as
  select distinct course_id from course_source where batch_id in ('3dc76a7f-0c2c-4834-af97-f1733dc4f833'::uuid, '3fcbc983-2422-4589-a1be-ea2f67cdfdb6'::uuid);
do $$
declare v text; n int; t0 timestamptz;
begin
  select min(at) into t0 from import_batch where id in ('3dc76a7f-0c2c-4834-af97-f1733dc4f833'::uuid, '3fcbc983-2422-4589-a1be-ea2f67cdfdb6'::uuid);
  select count(*), string_agg(c.name || ' [' || c.slug || '] ' || w, '; ') into n, v from (
    select c.*, concat_ws(' · ',
      case when exists (select 1 from course_source s where s.course_id = c.id and (s.batch_id is null or s.batch_id not in ('3dc76a7f-0c2c-4834-af97-f1733dc4f833'::uuid, '3fcbc983-2422-4589-a1be-ea2f67cdfdb6'::uuid))) then '다른 출처 연결' end,
      case when exists (select 1 from teetime t where t.course_id = c.id) then '티타임 연결' end,
      case when exists (select 1 from course_alias a where a.course_id = c.id) then '별칭 연결' end,
      case when c.updated_at > t0 + interval '1 minute' or c.state_by is not null or c.photo is not null or c.state <> 'open'
           then '운영자 수정' end) as w
      from course c join _rb on _rb.course_id = c.id) c
   where c.w <> '';
  if n > 0 then raise exception '되돌리기를 멈춥니다 — 충돌 %건: %', n, v; end if;
end $$;
delete from course_source where batch_id in ('3dc76a7f-0c2c-4834-af97-f1733dc4f833'::uuid, '3fcbc983-2422-4589-a1be-ea2f67cdfdb6'::uuid);
delete from course c using _rb where c.id = _rb.course_id;
delete from import_batch where id in ('3dc76a7f-0c2c-4834-af97-f1733dc4f833'::uuid, '3fcbc983-2422-4589-a1be-ea2f67cdfdb6'::uuid);   -- 검수 기록(import_row_issue)은 cascade 로 같이 빠집니다
commit;