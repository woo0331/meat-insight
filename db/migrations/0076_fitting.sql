-- ════════════════════════════════════════════════════════════════════
-- 0076 — 피팅 · 수리 서비스 방식 (2026-11-12 · 확정 시안 ⑦)
--
-- 시안의 왼쪽 레일이 거르개 셋을 요구합니다 — 지역 · **서비스 방식** ·
-- 가격. 지역과 가격은 이미 있는 것으로 거릅니다(`provider.regions` ·
-- `provider_price`). 없는 것은 **서비스 방식** 하나입니다.
--
-- ⚠️⚠️⚠️ **새 표를 만들지 않습니다.** 피팅 업체 = 분류가 fitting 인
--   **업체**(provider)입니다. 심사 · 승인 · 정지 · 사진 · 가격 ·
--   사업자 신원정보가 거기서 이미 돕니다 (0071 이 프로를 · 0074 가
--   연습장을 새 표로 안 만든 그 까닭). 칸 하나만 더합니다.
--
-- ⚠️⚠️⚠️ **`contact_ways`(0044)를 빌려 쓰지 않습니다.** 그 칸은
--   전화 · 방문 · 온라인 · 매장 네 가지 **상담 방식**이고, 시안이
--   말하는 것은 **이용 방식**(매장에 가져가나 · 택배로 보내나)입니다.
--   빌려 쓰면 「택배」가 갈 자리가 없어 그 칸이 반쪽 거르개가 됩니다
--   (골라도 안 걸러 주는 칸 · 절대 규칙 5).
--
-- ⚠️⚠️ **가격은 칸을 안 만듭니다** — provider_price(0042)가 이미
--   "그립 교체 공임 · 10,000원" 을 label · unit · amount 로 담습니다.
--   칸을 또 만들면 같은 값이 두 곳이 되고 한쪽만 고치는 날 카드와
--   상세가 다른 값을 말합니다 (0074 와 같은 판단).
--
-- ⚠️⚠️ **「부품비 별도」를 칸으로도 글로도 안 박습니다** — 시안의
--   그 줄은 우리가 모르는 거래 조건입니다. 업체마다 다르고 확인할
--   길이 없어, 우리가 적으면 지어낸 약속이 됩니다 (절대 규칙 1 · 5).
--   화면은 **업체가 등록한 값의 이름(label)** 을 그대로 냅니다.
--
-- ⚠️ 되돌아갔는지 보는 법:
--     select column_name from information_schema.columns
--      where table_name='provider' and column_name = 'fit_ways';
--     select count(*) from information_schema.columns
--      where table_name='v_provider_card' and column_name = 'fit_ways';
-- ════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════
-- ① 칸 하나 — 선택이고 기본값이 있어 **기존 업체는 한 줄도 안 깨집니다**
--
--   fit_ways  이용 방식 — 방문(매장에 가져가기) · 택배(클럽 발송)
--
--   ⚠️⚠️ **키 묶음을 DB 가 모릅니다** — 목록은 js/data/providers.js
--     한 곳(AM_FIT_WAY)이고 여기서는 **갯수와 길이만** 막습니다.
--     박아 두면 늘어나는 날 두 곳이 어긋나고, 그때 화면은 보내는데
--     DB 가 거절합니다 (0056 이 listing.sub 를 안 박은 그 까닭).
-- ════════════════════════════════════════════════════════════════════
alter table provider add column if not exists fit_ways text[] not null default '{}';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'provider_fit_ways_ck') then
    alter table provider add constraint provider_fit_ways_ck
      check (array_length(fit_ways, 1) is null or array_length(fit_ways, 1) <= 6);
  end if;
end $$;

-- ════════════════════════════════════════════════════════════════════
-- ② 공개 카드에 그 칸을 냅니다
--   ⚠️⚠️ **create or replace view 는 칸을 못 늘립니다** — drop + create
--     이고 GRANT 를 **바로 다시** 줍니다 (지우면 같이 날아갑니다).
--   ⚠️ 체인: v_provider_card 0032 → 0038 → 0044 → 0057 → 0071 → 0074 → **0076**
-- ════════════════════════════════════════════════════════════════════
drop view if exists v_provider_card;
create view v_provider_card as
  select p.id, p.name, p.intro, p.regions, p.gu, p.subs, p.since,
         p.consult_hours, p.verified, p.brands, p.scale, p.contact_ways,
         p.ceo, p.addr, p.tel, p.email, p.brn,
         p.kind, p.place_name, p.lesson_goals,
         p.range_opts, p.open_hours,
         -- ⚠️ 0076 이 더한 것 — 피팅 거르개가 읽습니다
         p.fit_ways,
         p.is_test
    from provider p
   where p.listed = true
     and p.is_test = false
     and p.state = 'approved';
grant select on v_provider_card to anon, authenticated;

-- ====================================================================
-- ③ 문 — 업체가 제 정보를 고칩니다
--     (0014 → 0023 → 0044 → 0057 → 0071 → 0074 → **0076**)
--   ⚠️⚠️⚠️ **보낸 것으로 통째로 덮습니다.** 그래서 js/deskme.js 가
--     새 칸을 **읽고 또 보내야** 합니다 — 안 하면 업체가 저장할 때마다
--     그 칸이 비워집니다 (`industries` 로 겪은 자리).
--   ⚠️ 화면에 그 칸을 안 그리는 업체(피팅을 안 하시는 분)는 **읽은 값을
--     그대로 돌려보냅니다** — 0074 의 `optsVal()` 과 같은 자리입니다.
-- ====================================================================
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

insert into schema_version (n, name) values (76, '0076_fitting')
  on conflict (n) do nothing;
