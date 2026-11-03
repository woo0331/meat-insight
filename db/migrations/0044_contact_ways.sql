-- ════════════════════════════════════════════════════════════════════
-- 0044 — 업체가 **스스로 고치는 것**에 상담 방식을 더합니다
--        [4차 지시서 §2-4 · §2-6 · §2-7 · §3]
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️ **상담 방식이 없었습니다.** `consult_hours`(언제)는 있는데
--   **어떻게**(전화 · 방문 · 온라인 · 매장)가 없었습니다. 손님이
--   "방문해야 하나" 를 모른 채 요청을 넣고, 업체는 전화로 그것부터
--   묻습니다.
--   ⚠️ 글자로 받지 않고 **정해진 넷**으로 받습니다 — 자유 입력이면
--   "전화"· "전화상담" · "유선" 이 섞여서 나중에 거르개를 달 수가
--   없습니다 (지역을 글자로 받아 겪은 자리).
--
-- ⚠️⚠️ **`save_provider_self` 를 덮어씁니다** — 체인이 길어집니다:
--     save_provider_self  0014 → 0023 → **0044**
--   0014 나 0023 을 다시 붙여 넣으면 상담 방식이 **조용히 안 저장
--   됩니다** (에러는 안 납니다). 내려갔는지 보는 법:
--     select pg_get_functiondef('save_provider_self(jsonb,text)'::regprocedure)
--            like '%contact_ways%';     -- false 면 옛 판입니다
--
-- ⚠️⚠️⚠️ **이 문은 보낸 것으로 통째로 덮어씁니다** (coalesce 로 지키지
--   않습니다). 화면이 칸 하나를 빠뜨리고 보내면 그 칸이 **빈 값으로
--   지워집니다** — 지역을 안 보내면 그 업체가 지역 거르개에서 통째로
--   사라집니다. 화면은 **읽은 값을 전부 다시 담아** 보내야 합니다.
--   (고치지 않는 까닭: 비우는 길도 있어야 합니다. "안 보냄" 과
--   "비움" 을 가르려면 칸마다 보냈는지를 봐야 하는데, 그러면 이 문이
--   두 배로 길어지고 틀리기 쉬운 자리가 늘어납니다.)
--
-- ⚠️ 업체가 **여전히 못 건드리는 것**은 그대로입니다 — 상호 · 하는
--   일(subs) · 확인 배지 · 공개 · 배정 가능 · 주소(id) · 상태.
--   하는 일을 스스로 넓히면 수거만 하는 곳이 수리 화면에 앉습니다.
-- ════════════════════════════════════════════════════════════════════
begin;

alter table provider add column if not exists contact_ways text[] not null default '{}';

-- ⚠️ 정해진 넷만 — 모르는 값을 조용히 넣지 않습니다
do $$ begin
  alter table provider add constraint provider_contact_ways_ck
    check (contact_ways <@ array['phone','visit','online','shop']::text[]);
exception when duplicate_object then null; end $$;

comment on column provider.contact_ways is
  '상담 방식 — phone(전화) · visit(방문) · online(온라인) · shop(매장 방문). 말은 js/data/providers.js 한 곳';

create or replace function save_provider_self(
  p_data jsonb default '{}'::jsonb,   -- intro · regions · gu · industries · since · consultHours · brands · scale
  p_why  text  default null
) returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_pv   text     := my_provider();
  v_scale text    := nullif(btrim(coalesce(p_data->>'scale','')), '');
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  -- ⚠️⚠️ 역할을 요청에서 읽지 않습니다 — 토큰으로 `account` 를 보고
  --   거기 적힌 `provider_id` 만 고칩니다. 남의 업체는 애초에 못 집습니다.
  if v_role <> 'provider' or v_pv is null then
    raise exception '업체 계정으로 로그인하셔야 합니다';
  end if;
  if not exists (select 1 from provider where id = v_pv) then
    raise exception '연결된 업체를 찾을 수 없습니다';
  end if;
  if v_scale is not null and v_scale not in ('small','mid','large') then
    raise exception '거래 규모는 small · mid · large 중 하나입니다 — %', v_scale;
  end if;
  -- ⚠️⚠️ **상담 방식 (0044)** — 정해진 넷만 받습니다. 모르는 값이
  --   오면 **조용히 버리지 않고** 거절합니다 (조용히 버리면 업체는
  --   저장된 줄 알고, 손님 화면에는 안 나옵니다).
  if exists (
    select 1 from jsonb_array_elements_text(
      case when jsonb_typeof(p_data->'contactWays') = 'array'
           then p_data->'contactWays' else '[]'::jsonb end) as t(x)
     where btrim(x) not in ('phone','visit','online','shop'))
  then
    raise exception '상담 방식은 전화 · 방문 · 온라인 · 매장 중에서 고르셔야 합니다';
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
    -- ⚠️ 보낸 것으로 **덮어씁니다** — 화면이 안 보내면 비워집니다
    contact_ways = coalesce((select array_agg(btrim(x))
      from jsonb_array_elements_text(
        case when jsonb_typeof(p_data->'contactWays') = 'array'
             then p_data->'contactWays' else '[]'::jsonb end) x), '{}')
  where id = v_pv;

  -- ⚠️ 같은 트랜잭션입니다 — 기록이 실패하면 수정도 안 됩니다 (§8).
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'provider', v_pv, 'self-updated', p_why, p_data);

  return v_pv;
end $$;
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **공개 보기에도 칸을 더합니다** — 안 더하면 업체가 고른
--   상담 방식이 **손님 화면에 영원히 안 나옵니다** (아무 에러도 없이).
--   `v_provider_card` 체인: 0032 → 0038 → **0044**.
--   내려갔는지 보는 법:
--     select count(*) from information_schema.columns
--      where table_name = 'v_provider_card' and column_name = 'contact_ways';
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️ **칸을 더할 때는 `create or replace` 가 안 됩니다** — Postgres 가
--   "cannot change number of columns" 으로 거절합니다. 지우고 다시
--   만듭니다. ⚠️ 지우면 **GRANT 도 같이 날아갑니다** — 아래에서 다시
--   줍니다 (안 주면 anon 이 못 읽어서 `pull-providers` 가 그날부터
--   `permission denied` 입니다).
drop view if exists v_provider_card;
create view v_provider_card as
  select p.id, p.name, p.intro, p.regions, p.gu, p.subs, p.since,
         p.consult_hours, p.verified, p.brands, p.scale, p.contact_ways,
         p.is_test
    from provider p
   where p.listed = true
     and p.is_test = false
     and p.state = 'approved';

grant select on v_provider_card to anon, authenticated;

revoke all on function save_provider_self(jsonb, text) from public;
grant execute on function save_provider_self(jsonb, text) to authenticated;

insert into schema_version (n, name) values (44, '0044_contact_ways')
on conflict (n) do nothing;

commit;
