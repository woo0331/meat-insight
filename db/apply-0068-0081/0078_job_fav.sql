-- 0078_job_fav · 운영 DB 판이 77 일 때만 실행합니다
begin;
create table if not exists jobfav (
  by_user    uuid not null references auth.users(id) on delete cascade,
  post_id    uuid not null references jobpost(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (by_user, post_id)
);
create index if not exists jobfav_mine_idx on jobfav (by_user, created_at desc);
alter table jobfav enable row level security;
drop policy if exists jobfav_mine on jobfav;
create policy jobfav_mine on jobfav
  for select using (by_user = auth.uid());
grant select on jobfav to authenticated;
create or replace function fav_jobpost(p jsonb default '{}'::jsonb)
  returns boolean
  language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_j  uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_on boolean := coalesce((p->>'on')::boolean, true);
  v_st text;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_j is null then raise exception '어느 공고인지 알 수 없습니다'; end if;
  if v_on then
    select state into v_st from jobpost where id = v_j;
    if v_st is null then raise exception '그런 공고가 없습니다'; end if;
    -- ⚠️ 내려간 · 가려진 공고는 담을 수 없습니다 — 담아 두면 저장
    --   목록에 **열 수 없는 줄**이 쌓입니다.
    if v_st not in ('open','closed') then
      raise exception '지금은 저장할 수 없는 공고입니다';
    end if;
    if (select count(*) from jobfav where by_user = v_me) >= 200 then
      raise exception '저장은 200개까지입니다. 먼저 정리해 주세요';
    end if;
    insert into jobfav (by_user, post_id) values (v_me, v_j)
      on conflict (by_user, post_id) do nothing;
    return true;
  end if;
  delete from jobfav where by_user = v_me and post_id = v_j;
  return false;
end $$;
revoke all on function fav_jobpost(jsonb) from public;
grant execute on function fav_jobpost(jsonb) to authenticated;
drop view if exists v_job_fav;
create view v_job_fav as
  select f.post_id as id, f.created_at as fav_at,
         j.kind, j.sub, j.region, j.title,
         j.pay, j.terms, j.close_at, j.state,
         j.role, j.emp_type, j.pay_type, j.pay_min,
         j.created_at,
         case when pv.id is not null and pv.state = 'approved'
                   and pv.is_test = false
              then pv.name end as pro_name
    from jobfav f
    join jobpost j on j.id = f.post_id
    left join provider pv on pv.id = j.provider_id
   where f.by_user = auth.uid()
     and j.state in ('open','closed')
   order by f.created_at desc;
grant select on v_job_fav to authenticated;
insert into schema_version (n, name) values (78, '0078_job_fav')
on conflict (n) do nothing;
commit;
commit;
select max(n) as ver from schema_version;
