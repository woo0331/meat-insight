-- 0081_course_photo · 운영 DB 판이 80 일 때만 실행합니다
alter table course add column if not exists photo text;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'course_photo_ck') then
    alter table course add constraint course_photo_ck
      check (photo is null or
             (photo ~ '^course/[0-9a-f-]{36}/[A-Za-z0-9._-]{1,80}$'
              and position('..' in photo) = 0));
  end if;
end $$;
create or replace function save_course_photo(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare v_role app_role := my_role(); v_id uuid; v_photo text; v_n int;
begin
  if coalesce(v_role::text,'') not in ('staff','admin') then
    raise exception '골프장 사진은 운영자만 고칠 수 있습니다';
  end if;
  v_id := nullif(p->>'id','')::uuid;
  if v_id is null then raise exception '어느 골프장인지 알려 주세요'; end if;
  if not (p ? 'photo') then raise exception '사진 경로를 보내 주세요'; end if;
  v_photo := nullif(btrim(coalesce(p->>'photo','')), '');
  update course set photo = v_photo, updated_at = now() where id = v_id;
  get diagnostics v_n = row_count;
  -- ⚠️ 0줄이면 **거절합니다** — 조용히 끝내면 기록에 "바꿨다" 가 남는데
  --    아무 일도 안 일어난 것입니다(0054 의 그 자리).
  if v_n = 0 then raise exception '그 골프장을 찾을 수 없습니다'; end if;
  insert into audit_log (by_user, what, obj, note)
  values (auth.uid(), 'save_course_photo', v_id::text,
          case when v_photo is null then '사진을 뺐습니다' else '사진을 적었습니다' end);
end $$;
revoke all on function save_course_photo(jsonb) from public;
grant execute on function save_course_photo(jsonb) to authenticated;
create or replace view v_teetime_open as
  select t.id, t.provider_id, p.name as provider_name,
         t.kind, t.region, t.course, t.play_at, t.tee_at, t.holes,
         t.slots, t.green_fee,
         coalesce(nullif(btrim(coalesce(t.tel, '')), ''), p.tel) as tel,
         t.note, t.created_at,
         t.slots - (select coalesce(sum(b.people), 0) from teebook b
                     where b.tee_id = t.id
                       and b.state in ('applied','confirmed')) as left_n,
         (select count(*) from teebook b
           where b.tee_id = t.id and b.state = 'confirmed') as confirmed_n,
         t.course_id,
         (select c.slug from course c
           where c.id = t.course_id and c.state <> 'hidden') as course_slug,
         (select c.photo from course c
           where c.id = t.course_id and c.state <> 'hidden') as photo
    from teetime t
    join provider p on p.id = t.provider_id
   where t.state = 'open'
     and t.play_at >= kst_today()
     and p.listed = true
     and p.is_test = false
     and p.state = 'approved';
grant select on v_teetime_open to anon, authenticated;
create or replace view v_course_public as
  select c.id, c.slug, c.kind, c.name, c.region, c.gu,
         c.addr, c.addr_road, c.tel, c.holes, c.biz_kind, c.site_url,
         c.lat, c.lng, c.state, c.updated_at,
         (select s.source_id from course_source s
           where s.course_id = c.id order by s.created_at limit 1) as source_id,
         (select max(s.as_of) from course_source s where s.course_id = c.id) as as_of,
         c.photo
    from course c
   where c.state <> 'hidden';
grant select on v_course_public to anon, authenticated;
insert into schema_version (n, name) values (81, '0081_course_photo')
on conflict (n) do nothing;
commit;
select max(n) as ver from schema_version;
