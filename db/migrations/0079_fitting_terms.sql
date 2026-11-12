-- ════════════════════════════════════════════════════════════════════
-- 0079 — 피팅 **거래 조건**(부품비 포함 여부 등)을 업체가 적습니다
--        (확정 시안 ⑦ · save_provider_self 0076→0079 · v_provider_card 0076→0079)
--
-- ⚠️⚠️⚠️ **시안의 「부품비 별도 · 최종 견적 상담」을 우리가 적지
--   않습니다.** 업체마다 다르고 우리가 확인할 길이 없습니다 — 우리가
--   적으면 **우리가 한 약속**이 되고, 그 조건이 다른 업체에 가서 분쟁이
--   납니다(절대 규칙 1 · 5). 지시가 「거래 조건은 업체 입력값으로
--   표시한다」이므로 **업체가 적는 칸**을 만듭니다.
-- ⚠️ 비우면 화면에서 **줄째 빠집니다**(절대 규칙 2) — 「협의」를 지어
--   적지 않습니다.
--
-- ⚠️⚠️ **`created_at` 도 같이 내보냅니다.** 지시가 「근거 없는 추천순은
--   최신 등록순 등으로 대체한다」인데, 공개 카드 보기에 **등록 시각이
--   없어서** 최신순으로 세울 수가 없었습니다. 「추천순」은 여전히 안
--   냅니다 — 무엇이 추천인지 세어 본 적이 없습니다.
--
-- ⚠️⚠️⚠️ **보기를 지우고 다시 만듭니다** — `create or replace view` 는
--   칸을 못 늘립니다(0044 가 붙여넣기 두 번째에서 멈춘 그 자리).
--   지우면 GRANT 도 같이 날아가니 **바로 다시 줍니다.**
-- ⚠️⚠️ **`save_provider_self` 는 보낸 것으로 통째로 덮습니다** — 그래서
--   `js/deskme.js` 가 새 칸을 **읽고 또 보내야** 합니다. 안 하면 업체가
--   저장할 때마다 그 칸이 비워집니다(`industries` 로 겪은 자리).
--
-- 되돌아갔는지 보는 법:
--   select column_name from information_schema.columns
--    where table_name = 'v_provider_card' and column_name = 'fit_terms';
-- ════════════════════════════════════════════════════════════════════
begin;

alter table provider add column if not exists fit_terms text;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'provider_fit_terms_ck') then
    alter table provider add constraint provider_fit_terms_ck
      check (fit_terms is null or char_length(fit_terms) <= 120);
  end if;
end $$;

drop view if exists v_provider_card;
create view v_provider_card as
  select p.id, p.name, p.intro, p.regions, p.gu, p.subs, p.since,
         p.consult_hours, p.verified, p.brands, p.scale, p.contact_ways,
         p.ceo, p.addr, p.tel, p.email, p.brn,
         p.kind, p.place_name, p.lesson_goals,
         p.range_opts, p.open_hours,
         p.fit_ways,
         -- ⚠️ 0079 — 업체가 적는 거래 조건 (비면 화면에서 줄째 빠집니다)
         p.fit_terms,
         -- ⚠️ 0079 — 「최신 등록순」으로 세우려면 이 값이 있어야 합니다
         p.created_at,
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
  -- ⚠️ 0076 — 피팅 이용 방식
  v_fw    text[]  := coalesce((select array_agg(btrim(x))
    from jsonb_array_elements_text(
      case when jsonb_typeof(p_data->'fitWays') = 'array'
           then p_data->'fitWays' else '[]'::jsonb end) x
    where btrim(x) <> ''), '{}');
  -- ⚠️ 0079 — 피팅 거래 조건 (부품비 포함 여부 등). **업체가 적는
  --   값**이고 우리가 지어내지 않습니다 — 비면 화면에서 줄째 빠집니다.
  v_fterms text := nullif(btrim(coalesce(p_data->>'fitTerms','')), '');
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
  if v_fterms is not null and char_length(v_fterms) > 120 then
    raise exception '거래 조건은 120자까지 적을 수 있습니다';
  end if;
  if v_hours is not null and char_length(v_hours) > 60 then
    raise exception '이용 시간이 너무 깁니다 (60자)';
  end if;
  if coalesce(array_length(v_opts, 1), 0) > 12 then
    raise exception '시설 항목은 열둘까지입니다';
  end if;
  if exists (select 1 from unnest(v_opts) u where char_length(u) > 40) then
    raise exception '시설 항목 값이 올바르지 않습니다';
  end if;
  -- ⚠️ 0076 — 이용 방식. 표의 check 와 **다른 말**로 거절합니다
  --   (같은 말로 거절하면 어느 자물쇠가 막았는지 알 수 없습니다).
  if coalesce(array_length(v_fw, 1), 0) > 6 then
    raise exception '이용 방식은 여섯 가지까지입니다';
  end if;
  if exists (select 1 from unnest(v_fw) u where char_length(u) > 40) then
    raise exception '이용 방식 값이 올바르지 않습니다';
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
    fit_ways = v_fw,
    fit_terms = v_fterms,
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
insert into schema_version (n, name) values (79, '0079_fitting_terms')
on conflict (n) do nothing;

commit;
