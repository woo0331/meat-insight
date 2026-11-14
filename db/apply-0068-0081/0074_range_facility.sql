-- 0074_range_facility · 운영 DB 판이 73 일 때만 실행합니다
alter table provider add column if not exists range_opts text[] not null default '{}';
alter table provider add column if not exists open_hours text;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'provider_range_opts_ck') then
    alter table provider add constraint provider_range_opts_ck
      check (array_length(range_opts, 1) is null or array_length(range_opts, 1) <= 12);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'provider_open_hours_ck') then
    alter table provider add constraint provider_open_hours_ck
      check (open_hours is null or char_length(btrim(open_hours)) between 1 and 60);
  end if;
end $$;
drop view if exists v_provider_card;
create view v_provider_card as
  select p.id, p.name, p.intro, p.regions, p.gu, p.subs, p.since,
         p.consult_hours, p.verified, p.brands, p.scale, p.contact_ways,
         p.ceo, p.addr, p.tel, p.email, p.brn,
         p.kind, p.place_name, p.lesson_goals,
         p.range_opts, p.open_hours,
         p.is_test
    from provider p
   where p.listed = true
     and p.is_test = false
     and p.state = 'approved';
grant select on v_provider_card to anon, authenticated;
create or replace function save_provider_self(
  p_data jsonb default '{}'::jsonb,
  p_why  text  default null
) returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_pv   text     := my_provider();
  v_scale text    := nullif(btrim(coalesce(p_data->>'scale','')), '');
  v_email text    := nullif(btrim(coalesce(p_data->>'email','')), '');
  v_place text    := nullif(btrim(coalesce(p_data->>'placeName','')), '');
  -- ⚠️ 0074 — 연습장 시설 정보 둘
  v_hours text    := nullif(btrim(coalesce(p_data->>'openHours','')), '');
  v_opts  text[]  := coalesce((select array_agg(btrim(x))
    from jsonb_array_elements_text(
      case when jsonb_typeof(p_data->'rangeOpts') = 'array'
           then p_data->'rangeOpts' else '[]'::jsonb end) x
    where btrim(x) <> ''), '{}');
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if v_role <> 'provider' or v_pv is null then
    raise exception '업체 계정으로 로그인하셔야 합니다';
  end if;
  if not exists (select 1 from provider where id = v_pv) then
    raise exception '연결된 업체를 찾을 수 없습니다';
  end if;
  if v_scale is not null and v_scale not in ('small','mid','large') then
    raise exception '거래 규모는 small · mid · large 중 하나입니다 — %', v_scale;
  end if;
  -- ⚠️ 0074 — 이용 시간과 시설 속성. **키 묶음은 화면이 들고 있고**
  --   여기서는 갯수와 길이만 봅니다 (박아 두면 느는 날 어긋납니다).
  if v_hours is not null and char_length(v_hours) > 60 then
    raise exception '이용 시간이 너무 깁니다 (60자)';
  end if;
  if coalesce(array_length(v_opts, 1), 0) > 12 then
    raise exception '시설 항목은 열둘까지입니다';
  end if;
  if exists (select 1 from unnest(v_opts) u where char_length(u) > 40) then
    raise exception '시설 항목 값이 올바르지 않습니다';
  end if;
  if exists (
    select 1 from jsonb_array_elements_text(
      case when jsonb_typeof(p_data->'contactWays') = 'array'
           then p_data->'contactWays' else '[]'::jsonb end) as t(x)
     where btrim(x) not in ('phone','visit','online','shop'))
  then
    raise exception '상담 방식은 전화 · 방문 · 온라인 · 매장 중에서 고르셔야 합니다';
  end if;
  -- ⚠️ 적으셨으면 꼴을 봅니다 (비우는 것은 됩니다 — 지어내지 않습니다).
  --   ⚠️⚠️ **다른 말로 거절합니다** — check 와 같은 말로 거절하면 어느
  --   자물쇠가 막았는지 알 수 없습니다 (검사가 둘을 갈라 셉니다).
  if v_email is not null and v_email not like '%@%.%' then
    raise exception '이메일 꼴이 아닙니다 — %', v_email;
  end if;
  -- ⚠️ 0071 — 레슨 장소. 표의 check 와 **다른 말**로 거절합니다.
  if v_place is not null and length(v_place) > 80 then
    raise exception '레슨 장소 이름이 너무 깁니다 (여든 자까지)';
  end if;
  -- ⚠️⚠️ 레슨 목적은 **키를 안 봅니다**(DB 가 키 묶음을 모릅니다) — 갯수와
  --   길이만 막습니다. 모르는 키가 들어오면 화면이 **그 글자를 그대로**
  --   보여 줍니다(이름을 지어내지 않습니다).
  if (select count(*) from jsonb_array_elements_text(
        case when jsonb_typeof(p_data->'lessonGoals') = 'array'
             then p_data->'lessonGoals' else '[]'::jsonb end)) > 12 then
    raise exception '레슨 목적은 열두 개까지 고르실 수 있습니다';
  end if;
  update provider set
    intro = nullif(btrim(coalesce(p_data->>'intro','')), ''),
    regions = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'regions','[]'::jsonb)) x), '{}'),
    gu = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'gu','[]'::jsonb)) x), '{}'),
    industries = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'industries','[]'::jsonb)) x), '{}'),
    since = nullif(p_data->>'since','')::int,
    consult_hours = nullif(btrim(coalesce(p_data->>'consultHours','')), ''),
    brands = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'brands','[]'::jsonb)) x), '{}'),
    scale = v_scale,
    ceo = nullif(btrim(coalesce(p_data->>'ceo','')), ''),
    addr = nullif(btrim(coalesce(p_data->>'addr','')), ''),
    tel = nullif(btrim(coalesce(p_data->>'tel','')), ''),
    email = v_email,
    contact_ways = coalesce((select array_agg(btrim(x))
      from jsonb_array_elements_text(
        case when jsonb_typeof(p_data->'contactWays') = 'array'
             then p_data->'contactWays' else '[]'::jsonb end) x), '{}'),
    range_opts = v_opts,
    open_hours = v_hours,
    place_name = v_place,
    lesson_goals = coalesce((select array_agg(btrim(x))
      from jsonb_array_elements_text(
        case when jsonb_typeof(p_data->'lessonGoals') = 'array'
             then p_data->'lessonGoals' else '[]'::jsonb end) x
      where btrim(x) <> ''), '{}')
  where id = v_pv;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'provider', v_pv, 'self-updated', p_why, p_data);
  return v_pv;
end $$;
revoke all on function save_provider_self(jsonb, text) from public;
grant execute on function save_provider_self(jsonb, text) to authenticated;
insert into schema_version (n, name) values (74, '0074_range_facility')
  on conflict (n) do nothing;
commit;
select max(n) as ver from schema_version;
