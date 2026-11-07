-- 되돌리기 — ⚠️⚠️ **이 묶음으로 들어온 줄만** 지웁니다.
-- ⚠️ 운영자가 손으로 고친 줄 · 다른 출처로도 확인된 줄은 남깁니다
--   (course_source 가 둘 이상이면 그 골프장은 다른 출처에도 있습니다).
begin;
delete from course_source s
 where s.source_id in ();
delete from course c
 where not exists (select 1 from course_source s where s.course_id = c.id)
   and not exists (select 1 from teetime t where t.course_id = c.id)
   and not exists (select 1 from course_alias a where a.course_id = c.id);
commit;