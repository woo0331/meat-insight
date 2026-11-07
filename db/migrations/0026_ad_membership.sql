-- ════════════════════════════════════════════════════════════════════
-- 0026 — 업체 광고(C) · 유료 멤버십(D)  (지시서 5번)
-- ════════════════════════════════════════════════════════════════════
-- 지시서 5번의 네 모델 중 A(고객 연결 수수료)와 B(거래 · 예약 수수료)는
-- 이미 있습니다 — assignment · fee_policy · deal · settlement.
-- 여기서는 남은 둘을 올립니다.
--
-- ⚠️⚠️ **요금을 한 줄도 심지 않습니다.** 지시서 5번이 "수수료와 요금은
--   관리자에서 변경 가능하도록 설계한다" 고 했습니다. 여기에 값을 심으면
--   관리자에서 바꿔도 이 줄만 옛날 값으로 남습니다. 그래서 멤버십 요금제는
--   **빈 표**로 시작합니다 — 관리자가 넣기 전에는 화면이 "요금제가 없습니다"
--   라고 말합니다 (절대 규칙 1 · 2).
--
-- ⚠️⚠️ **광고는 화면에서 "광고" 라고 표시해야 합니다** (표시 · 광고의
--   공정화에 관한 법률). 표시는 화면이 하는 일이지만, 표시를 빠뜨리기
--   쉬워서 보기(v_ad_live)가 label 칸을 **반드시 들고 나오게** 했습니다.
--   화면은 그 칸을 그대로 찍으면 됩니다.
--
-- ⚠️ 기간은 **시작일과 종료일을 둘 다 포함**합니다 (하루짜리 광고는
--   starts_on = ends_on). 사는 쪽이 "3일치" 라고 말하는 셈법과 같습니다.
-- ════════════════════════════════════════════════════════════════════
begin;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'ad_place') then
    create type ad_place as enum (
      'main_hero',   -- 메인 맨 위 띠
      'main_band',   -- 메인 가운데 띠
      'cat_top',     -- 분류 화면 맨 위 (cat_key 가 어느 분류인지 말합니다)
      'region'       -- 지역 거르개 결과 맨 위 (region 이 어디인지 말합니다)
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'ad_state') then
    create type ad_state as enum ('draft', 'live', 'done', 'stopped');
  end if;
end $$;

-- ── 광고 집행 ────────────────────────────────────────────────────
create table if not exists ad_run (
  id          uuid primary key default gen_random_uuid(),
  provider_id text        not null references provider(id) on delete cascade,
  place       ad_place    not null,
  cat_key     text,                          -- place='cat_top' 일 때
  region      text,                          -- place='region' 일 때
  starts_on   date        not null,
  ends_on     date        not null,
  price       bigint      not null,          -- 원 — 관리자가 넣습니다
  state       ad_state    not null default 'draft',
  note        text,
  by_user     uuid references auth.users(id) on delete set null,
  at          timestamptz not null default now(),
  constraint ad_run_period check (ends_on >= starts_on),
  -- ⚠️ 0 원도 됩니다 (무상 노출). 음수만 막습니다.
  constraint ad_run_price  check (price >= 0),
  -- ⚠️⚠️ 자리마다 **무엇을 더 적어야 하는지**가 다릅니다. 안 막으면
  --   cat_key 없는 분류 광고가 들어와 아무 분류에도 안 걸립니다
  --   (에러 없이 조용히 안 보입니다).
  constraint ad_run_where check (
    (place = 'cat_top' and cat_key is not null and btrim(cat_key) <> '')
    or (place = 'region' and region is not null and btrim(region) <> '')
    or place in ('main_hero','main_band')
  )
);
create index if not exists ad_run_live_idx on ad_run (state, starts_on, ends_on);
create index if not exists ad_run_prov_idx on ad_run (provider_id);

-- ── 유료 멤버십 ──────────────────────────────────────────────────
-- ⚠️⚠️ **빈 표로 시작합니다.** 요금제를 지어내지 않습니다.
create table if not exists membership_plan (
  id       text primary key,                 -- 'basic' · 'pro' … 관리자가 정합니다
  name     text    not null,
  monthly  bigint  not null,                 -- 원/월 — 0 이면 무료
  perks    jsonb   not null default '{}'::jsonb,
  listed   boolean not null default true,
  ord      int     not null default 0,
  constraint membership_plan_price check (monthly >= 0),
  constraint membership_plan_name  check (btrim(name) <> '')
);

create table if not exists provider_membership (
  provider_id text primary key references provider(id) on delete cascade,
  plan_id     text not null references membership_plan(id),
  starts_on   date not null,
  ends_on     date,                          -- null 이면 해지 전까지
  by_user     uuid references auth.users(id) on delete set null,
  at          timestamptz not null default now(),
  constraint provider_membership_period check (ends_on is null or ends_on >= starts_on)
);

-- ── RLS ──────────────────────────────────────────────────────────
alter table ad_run              enable row level security;
alter table membership_plan     enable row level security;
alter table provider_membership enable row level security;

drop policy if exists ad_public on ad_run;
drop policy if exists ad_mine   on ad_run;
drop policy if exists ad_admin  on ad_run;
-- 지금 돌고 있는 광고는 누구나 봅니다 (화면에 나가야 하니까).
create policy ad_public on ad_run for select
  using (state = 'live' and current_date between starts_on and ends_on);
create policy ad_mine on ad_run for select using (provider_id = my_provider());
create policy ad_admin on ad_run for all
  using (my_role() in ('staff','admin')) with check (my_role() = 'admin');

drop policy if exists plan_public on membership_plan;
drop policy if exists plan_admin  on membership_plan;
create policy plan_public on membership_plan for select using (listed);
create policy plan_admin  on membership_plan for all
  using (my_role() in ('staff','admin')) with check (my_role() = 'admin');

drop policy if exists pm_mine  on provider_membership;
drop policy if exists pm_admin on provider_membership;
create policy pm_mine  on provider_membership for select using (provider_id = my_provider());
create policy pm_admin on provider_membership for all
  using (my_role() in ('staff','admin')) with check (my_role() = 'admin');

-- ⚠️⚠️ **쓰기 권한을 한 줄도 주지 않습니다.** 바꾸는 길은 아래 문뿐입니다.
revoke all on ad_run, membership_plan, provider_membership
  from public, anon, authenticated;
grant select on ad_run, membership_plan, provider_membership to authenticated;
grant select on ad_run, membership_plan to anon;

-- ── 지금 나가는 광고 ──────────────────────────────────────────────
-- ⚠️⚠️ label 을 **보기가 들고 나옵니다.** 화면이 이 칸을 그대로 찍으면
--   "광고" 표시를 빠뜨릴 수 없습니다. 지우지 마세요.
-- ⚠️⚠️⚠️ **`create or replace view` 가 아니라 지우고 다시 만듭니다.**
--   0064 가 이 보기에 칸 다섯(소재 · 클릭 주소 · 광고주)을 더했는데,
--   여기가 `create or replace` 이면 사장님이 붙여넣기 파일을 **두 번째로**
--   붙여 넣는 날 이 줄에서 `cannot drop columns from view` 로 **멈춥니다**
--   — 앞쪽 파일이 **옛 칸 목록**으로 다시 만들려 하기 때문입니다.
--   0044 가 `v_provider_card` 에서 겪은 그 자리이고, `test-upgrade` 의
--   ⑧("두 번 붙여 넣어도 끝까지 도는가")이 잡았습니다.
--   ⚠️ 지우면 **GRANT 도 같이 날아가므로** 바로 아래에서 다시 줍니다
--   (안 주면 그날부터 손님 화면에 광고가 한 줄도 안 나옵니다).
--   ⚠️⚠️ 이 줄을 고친 까닭 — 운영 DB 는 아직 **0007 까지만** 올라가 있어
--   이 파일이 운영에서 한 번도 돈 적이 없습니다. 이미 돌린 파일이면
--   고치지 않고 새 번호로 갔을 것입니다 (작업 기억의 그 규칙).
drop view if exists v_ad_live;
create view v_ad_live as
  select a.id, a.provider_id, p.name as provider_name,
         a.place, a.cat_key, a.region, a.starts_on, a.ends_on,
         '광고'::text as label
    from ad_run a join provider p on p.id = a.provider_id
   where a.state = 'live'
     and current_date between a.starts_on and a.ends_on;
grant select on v_ad_live to anon, authenticated;

-- ── 문 ───────────────────────────────────────────────────────────
create or replace function set_ad_state(p_ad uuid, p_to ad_state, p_why text)
  returns ad_state language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_from ad_state;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if my_role() not in ('staff','admin') then
    raise exception '광고 집행은 운영자만 바꿉니다';
  end if;
  if p_why is null or btrim(p_why) = '' then
    raise exception '까닭을 적어야 합니다 — 감사 기록에 남습니다';
  end if;
  select state into v_from from ad_run where id = p_ad;
  if v_from is null then raise exception '그런 광고가 없습니다'; end if;

  update ad_run set state = p_to where id = p_ad;
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why)
  values (v_me, my_role(), 'ad_run', p_ad::text, v_from::text, p_to::text, p_why);
  return p_to;
end $$;

create or replace function save_plan(
  p_id text, p_name text, p_monthly bigint,
  p_perks jsonb default '{}'::jsonb, p_listed boolean default true,
  p_ord int default 0, p_why text default null)
  returns text language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_had boolean;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if my_role() <> 'admin' then
    raise exception '요금제는 관리자만 바꿉니다';
  end if;
  if p_monthly < 0 then raise exception '요금은 0 보다 작을 수 없습니다'; end if;

  select true into v_had from membership_plan where id = p_id;
  insert into membership_plan (id, name, monthly, perks, listed, ord)
  values (p_id, p_name, p_monthly, p_perks, p_listed, p_ord)
  on conflict (id) do update set
    name = excluded.name, monthly = excluded.monthly, perks = excluded.perks,
    listed = excluded.listed, ord = excluded.ord;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, my_role(), 'membership_plan', p_id,
          case when v_had then '있음' else null end, '저장',
          coalesce(p_why, '요금제 저장'),
          jsonb_build_object('monthly', p_monthly, 'listed', p_listed));
  return p_id;
end $$;

revoke all on function set_ad_state(uuid, ad_state, text) from public;
revoke all on function save_plan(text, text, bigint, jsonb, boolean, int, text) from public;
grant execute on function set_ad_state(uuid, ad_state, text) to authenticated;
grant execute on function save_plan(text, text, bigint, jsonb, boolean, int, text) to authenticated;

insert into schema_version (n, name) values (26, '0026_ad_membership')
on conflict (n) do nothing;

commit;
