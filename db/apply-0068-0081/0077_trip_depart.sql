-- 0077_trip_depart · 운영 DB 판이 76 일 때만 실행합니다
select max(n) from schema_version;
begin;
alter table trip add column if not exists depart_kind text not null default 'none';
alter table trip add column if not exists depart_from date;
alter table trip add column if not exists depart_to   date;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'trip_depart_kind_ck') then
    alter table trip add constraint trip_depart_kind_ck
      check (depart_kind in ('dates','range','none'));
  end if;
  -- ⚠️ `range` 면 둘 다 있어야 하고, 아니면 둘 다 없어야 합니다 —
  --   한쪽만 있으면 화면이 「12월~」처럼 **반쪽 기간**을 적게 됩니다.
  if not exists (select 1 from pg_constraint where conname = 'trip_depart_span_ck') then
    alter table trip add constraint trip_depart_span_ck
      check ((depart_kind = 'range')
             = (depart_from is not null and depart_to is not null));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'trip_depart_order_ck') then
    alter table trip add constraint trip_depart_order_ck
      check (depart_from is null or depart_to is null or depart_to >= depart_from);
  end if;
end $$;
create table if not exists tripdate (
  trip_id   uuid not null references trip(id) on delete cascade,
  depart_on date not null,
  primary key (trip_id, depart_on)
);
alter table tripdate enable row level security;
create index if not exists tripdate_ix on tripdate (trip_id, depart_on);
create or replace function trip_months(
  p_kind text, p_from date, p_to date, p_days date[])
returns text[] language sql immutable as $$
  select case
    when p_kind = 'range' and p_to >= kst_today() then (
      select array_agg(distinct to_char(m, 'YYYY-MM') order by to_char(m, 'YYYY-MM'))
        from generate_series(
               date_trunc('month', greatest(p_from, kst_today()))::date,
               date_trunc('month', p_to)::date,
               interval '1 month') m)
    when p_kind = 'dates' then (
      select array_agg(distinct to_char(d, 'YYYY-MM') order by to_char(d, 'YYYY-MM'))
        from unnest(coalesce(p_days, '{}'::date[])) d
       where d >= kst_today())
    else null end
$$;
grant execute on function trip_months(text, date, date, date[])
  to anon, authenticated;
create or replace function trip_next_depart(
  p_kind text, p_from date, p_to date, p_days date[])
returns date language sql immutable as $$
  select case
    when p_kind = 'range' and p_to >= kst_today()
      then greatest(p_from, kst_today())
    when p_kind = 'dates' then (
      select min(d) from unnest(coalesce(p_days, '{}'::date[])) d
       where d >= kst_today())
  end
$$;
grant execute on function trip_next_depart(text, date, date, date[])
  to anon, authenticated;
create or replace function set_trip_depart(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_pv   text := my_provider();
  v_id   uuid := nullif(p->>'trip','')::uuid;
  v_kind text := coalesce(nullif(btrim(p->>'kind'),''), 'none');
  v_from date := nullif(p->>'from','')::date;
  v_to   date := nullif(p->>'to',''  )::date;
  v_arr  jsonb := coalesce(p->'dates', '[]'::jsonb);
  v_st   text;
  v_n    int;
begin
  if v_pv is null then raise exception '업체 담당자만 쓸 수 있습니다'; end if;
  if v_id is null then raise exception '어느 상품인지 알 수 없습니다'; end if;
  select state into v_st from trip
   where id = v_id and provider_id = v_pv for update;
  if v_st is null then raise exception '그 상품을 찾을 수 없습니다'; end if;
  if v_st = 'hidden' then
    raise exception '가려진 상품은 고칠 수 없습니다 — 고객센터로 문의해 주세요';
  end if;
  if v_kind not in ('dates','range','none') then
    raise exception '출발 방식은 확정 출발일 · 출발 가능 기간 · 미정 셋 가운데 하나입니다';
  end if;
  if v_kind = 'range' then
    if v_from is null or v_to is null then
      raise exception '출발 가능 기간은 시작일과 마지막 날을 함께 적어 주세요';
    end if;
    if v_to < v_from then
      raise exception '마지막 날이 시작일보다 앞설 수 없습니다';
    end if;
    if v_to < kst_today() then
      raise exception '이미 지난 기간입니다 — 오늘 이후로 적어 주세요';
    end if;
    if v_to > kst_today() + 730 then
      raise exception '출발 가능 기간은 2년 안으로 적어 주세요';
    end if;
  else
    v_from := null; v_to := null;
  end if;
  -- ⚠️ 확정 출발일은 **그 상품의 전부**로 갈아 끼웁니다
  delete from tripdate where trip_id = v_id;
  if v_kind = 'dates' then
    if jsonb_typeof(v_arr) <> 'array' then
      raise exception '출발일은 목록으로 보내 주세요';
    end if;
    insert into tripdate (trip_id, depart_on)
    select v_id, (x)::date
      from jsonb_array_elements_text(v_arr) t(x)
     where btrim(x) <> ''
    on conflict do nothing;
    select count(*) into v_n from tripdate where trip_id = v_id;
    if v_n = 0 then
      raise exception '출발일을 하나 이상 적어 주세요';
    end if;
    if v_n > 60 then
      raise exception '출발일은 60개까지 적을 수 있습니다';
    end if;
    -- ⚠️⚠️ **지난 날짜는 아예 안 받습니다** — 받아 두면 여행사 화면에는
    --   남고 손님 화면에서는 빠져 **둘이 다른 말**을 합니다.
    if exists (select 1 from tripdate
                where trip_id = v_id and depart_on < kst_today()) then
      raise exception '지난 날짜는 출발일로 넣을 수 없습니다';
    end if;
    if exists (select 1 from tripdate
                where trip_id = v_id and depart_on > kst_today() + 730) then
      raise exception '출발일은 2년 안으로 적어 주세요';
    end if;
  end if;
  update trip
     set depart_kind = v_kind, depart_from = v_from, depart_to = v_to,
         updated_at = now()
   where id = v_id;
  -- ⚠️ 기록에 **날짜를 안 담습니다** — 무엇을 바꿨는지는 상품을 보면
  --   됩니다. 기록은 오래 남고 보는 사람이 넓습니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why)
  values (auth.uid(), my_role(), 'trip', v_id::text,
          'depart-' || v_kind, null);
  return jsonb_build_object('ok', true, 'kind', v_kind,
                            'n', coalesce(v_n, 0));
end $$;
revoke all on function set_trip_depart(jsonb) from public;
grant execute on function set_trip_depart(jsonb) to authenticated;
drop view if exists v_trip_date_public;
create view v_trip_date_public as
  select d.trip_id, d.depart_on
    from tripdate d
    join trip t      on t.id = d.trip_id
    join provider pv on pv.id = t.provider_id
   where d.depart_on >= kst_today()
     and t.state = 'approved' and pv.state = 'approved' and pv.is_test = false
   order by d.trip_id, d.depart_on;
grant select on v_trip_date_public to anon, authenticated;
drop view if exists v_trip_date_mine;
create view v_trip_date_mine as
  select d.trip_id, d.depart_on
    from tripdate d
    join trip t on t.id = d.trip_id
   where t.provider_id = my_provider()
   order by d.trip_id, d.depart_on;
grant select on v_trip_date_mine to authenticated;
drop view if exists v_trip_open;
create view v_trip_open as
  select t.id, t.scope, t.dest, t.title, t.body, t.nights, t.days,
         t.price_from, t.price_note, t.incl, t.excl,
         t.created_at, t.updated_at,
         t.depart_kind, t.depart_from, t.depart_to,
         coalesce(trip_months(t.depart_kind, t.depart_from, t.depart_to, dd.days),
                  '{}'::text[]) as months,
         trip_next_depart(t.depart_kind, t.depart_from, t.depart_to, dd.days)
           as depart_next,
         pv.id   as provider_id,
         pv.name as provider_name,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and ph.live) as photo_n,
         (select ph.path from tripphoto ph
           where ph.trip_id = t.id and ph.live
           order by ph.ord, ph.created_at, ph.id limit 1) as thumb
    from trip t
    join provider pv on pv.id = t.provider_id
    left join lateral (
      select array_agg(d.depart_on order by d.depart_on) as days
        from tripdate d where d.trip_id = t.id) dd on true
   where t.state = 'approved'
     and pv.state = 'approved'
     and pv.is_test = false;
grant select on v_trip_open to anon, authenticated;
drop view if exists v_trip_mine;
create view v_trip_mine as
  select t.*,
         coalesce(trip_months(t.depart_kind, t.depart_from, t.depart_to, dd.days),
                  '{}'::text[]) as months,
         trip_next_depart(t.depart_kind, t.depart_from, t.depart_to, dd.days)
           as depart_next,
         (select count(*) from tripdate d where d.trip_id = t.id) as date_n,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and ph.live) as photo_n,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and not ph.live) as photo_draft_n,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and ph.drop_pending) as photo_drop_n
    from trip t
    left join lateral (
      select array_agg(d.depart_on order by d.depart_on) as days
        from tripdate d where d.trip_id = t.id) dd on true
   where t.provider_id = my_provider();
grant select on v_trip_mine to authenticated;
insert into schema_version (n, name) values (77, '0077_trip_depart')
on conflict (n) do nothing;
commit;
commit;
select max(n) as ver from schema_version;
