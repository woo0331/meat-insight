/* ==================================================================
   0025 ~ 0045 를 한 번에 —
   Supabase SQL 편집기에 **이 파일을 통째로** 붙여 넣고 Run 하세요.
   ==================================================================
   WARN 빌드가 만드는 파일입니다 — 손으로 고치지 마세요.
   db/migrations 의 21개를 번호 차례로 이어 붙인 것이고
   한 글자도 바꾸지 않았습니다. (node tools/make-apply.js)

   조각 파일입니다 — 바로 앞 조각까지 끝낸 DB 에만 쓰세요.
   어디까지 됐는지는 db/resume.sql 이 말해 줍니다
   (select max(n) from schema_version).

   돌린 뒤에는 db/verify.sql 을 붙여 넣어 보세요. 중간에서 멈추면 그
   파일 하나만 따로 돌리고 그 다음부터 이어 가시면 됩니다 — 번호를
   다시 쓰지 않습니다.

   WARN 통째로 begin/commit 으로 감싸지 마세요 — 파일마다 제
   트랜잭션이 있고 0015 는 일부러 감싸지 않았습니다. */

/* ---------------------------- 0025_account_hat.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0025 — 한 계정이 여러 역할을 갖습니다 (지시서 6번)
-- ════════════════════════════════════════════════════════════════════
-- 지시서 6번은 회원 유형을 다섯으로 적었습니다 — 일반 회원 · 개인
-- 판매자 · 골프 프로 · 사업자 회원 · 관리자. 그리고 "하나의 계정이
-- 여러 역할을 가질 수 있도록" 하라고 했습니다.
--
-- ⚠️⚠️ **권한과 능력을 같은 칸에 담지 않습니다.** 이 둘은 성격이
--   완전히 다릅니다.
--
--     account.role (app_role)   **권한** — customer · provider · staff · admin
--                               플랫폼이 정합니다. 손님이 못 바꿉니다.
--                               0021 의 account_role_guard() 가 지킵니다.
--     account_hat (member_hat)  **능력** — seller · pro · biz
--                               무엇을 할 수 있는가. 여러 개 가집니다.
--
--   한 칸에 섞으면 "프로로 등록" 같은 평범한 길이 **권한을 올리는 길**과
--   같은 문을 쓰게 됩니다. 그런 구조에서 권한 상승 사고가 납니다.
--   ⚠️⚠️ **member_hat 에 admin 이 없습니다. 앞으로도 더하지 마세요.**
--   역할 올리기는 SQL 로만 합니다 — 화면에서 관리자를 만들 수 없습니다.
--
--   seller  개인 판매자 — 중고 골프장터에 매물을 올립니다. 스스로 켭니다.
--   pro     골프 프로 — 레슨 상품과 일정을 올립니다. 스스로 켭니다.
--           ⚠️ 켰다고 "검증된 프로" 가 아닙니다. 확인 배지는 따로입니다
--              (provider.verified 와 같은 선 — 서류를 본 뒤에만).
--   biz     사업자 회원 — ⚠️⚠️ **스스로 못 켭니다.** 입점 신청
--           (provider_apply) 이 승인될 때만 붙습니다. 스스로 켜지게 두면
--           아무나 업체 화면을 열게 됩니다.
-- ════════════════════════════════════════════════════════════════════
begin;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'member_hat') then
    create type member_hat as enum ('seller', 'pro', 'biz');
  end if;
end $$;

create table if not exists account_hat (
  account_id uuid        not null references account(id) on delete cascade,
  hat        member_hat  not null,
  at         timestamptz not null default now(),
  by_user    uuid references auth.users(id) on delete set null,
  primary key (account_id, hat)
);
create index if not exists account_hat_hat_idx on account_hat (hat);

alter table account_hat enable row level security;

-- 자기 것만 봅니다. 관리자는 전부 봅니다.
drop policy if exists hat_self  on account_hat;
drop policy if exists hat_admin on account_hat;
create policy hat_self  on account_hat for select using (account_id = auth.uid());
create policy hat_admin on account_hat for all
  using (my_role() in ('staff','admin')) with check (my_role() = 'admin');

-- ⚠️⚠️ **쓰기 권한을 한 줄도 주지 않습니다.** 바꾸는 길은 아래 문 셋뿐
--   입니다. insert 를 열어 두면 아무나 자기에게 biz 를 붙입니다.
revoke all on account_hat from public, anon, authenticated;
grant select on account_hat to authenticated;

-- ── 읽는 함수 ─────────────────────────────────────────────────────
-- ⚠️ 규칙은 **한 함수**에 두고 모두가 그것을 부릅니다. 화면마다 따로
--    세면 한쪽만 고쳐서 조용히 어긋납니다.
create or replace function my_hats() returns member_hat[]
  language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(hat order by hat), '{}'::member_hat[])
    from account_hat where account_id = auth.uid();
$$;

create or replace function has_hat(p_hat member_hat) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from account_hat
                  where account_id = auth.uid() and hat = p_hat);
$$;

-- ── 스스로 켜는 문 ────────────────────────────────────────────────
create or replace function add_my_hat(p_hat member_hat, p_why text default null)
  returns member_hat[] language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid();
begin
  if v_me is null then
    raise exception '로그인이 필요합니다';
  end if;
  -- ⚠️⚠️ 자물쇠마다 **다른 말**로 거절합니다. 같은 말로 거절하면
  --    하나를 빼 봐도 다른 것이 먼저 막아서 검사가 엉뚱한 까닭으로
  --    통과합니다 (앞 서비스에서 겪었습니다).
  if p_hat = 'biz' then
    raise exception '사업자 회원은 스스로 켤 수 없습니다 — 입점 신청이 승인되면 붙습니다';
  end if;
  if not exists (select 1 from account where id = v_me) then
    raise exception '계정이 아직 없습니다';
  end if;

  insert into account_hat (account_id, hat, by_user)
  values (v_me, p_hat, v_me)
  on conflict (account_id, hat) do nothing;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why)
  values (v_me, my_role(), 'account_hat', v_me::text, p_hat::text,
          coalesce(p_why, '본인이 켬'));

  return my_hats();
end $$;

create or replace function drop_my_hat(p_hat member_hat, p_why text default null)
  returns member_hat[] language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid();
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  -- ⚠️ biz 를 스스로 떼지 못합니다. 떼면 업체 자료의 주인이 사라져
  --    상담 기록이 고아가 됩니다. 입점 해지는 관리자가 합니다.
  if p_hat = 'biz' then
    raise exception '사업자 회원은 스스로 뗄 수 없습니다 — 고객센터로 알려 주세요';
  end if;
  delete from account_hat where account_id = v_me and hat = p_hat;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, why)
  values (v_me, my_role(), 'account_hat', v_me::text, p_hat::text,
          coalesce(p_why, '본인이 끔'));
  return my_hats();
end $$;

-- ── 관리자가 붙이는 문 (biz 를 붙이는 유일한 길) ───────────────────
create or replace function grant_hat(p_user uuid, p_hat member_hat, p_why text)
  returns member_hat[] language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid();
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if my_role() not in ('staff','admin') then
    raise exception '회원의 역할은 운영자만 바꿉니다';
  end if;
  if p_why is null or btrim(p_why) = '' then
    raise exception '까닭을 적어야 합니다 — 감사 기록에 남습니다';
  end if;
  if not exists (select 1 from account where id = p_user) then
    raise exception '그런 회원이 없습니다';
  end if;

  insert into account_hat (account_id, hat, by_user)
  values (p_user, p_hat, v_me)
  on conflict (account_id, hat) do nothing;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why)
  values (v_me, my_role(), 'account_hat', p_user::text, p_hat::text, p_why);

  return (select coalesce(array_agg(hat order by hat), '{}'::member_hat[])
            from account_hat where account_id = p_user);
end $$;

revoke all on function my_hats()                           from public;
revoke all on function has_hat(member_hat)                 from public;
revoke all on function add_my_hat(member_hat, text)        from public;
revoke all on function drop_my_hat(member_hat, text)       from public;
revoke all on function grant_hat(uuid, member_hat, text)   from public;
grant execute on function my_hats()                        to authenticated;
grant execute on function has_hat(member_hat)              to authenticated;
grant execute on function add_my_hat(member_hat, text)     to authenticated;
grant execute on function drop_my_hat(member_hat, text)    to authenticated;
grant execute on function grant_hat(uuid, member_hat, text) to authenticated;

insert into schema_version (n, name) values (25, '0025_account_hat')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0026_ad_membership.sql ---------------------------- */
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

/* ---------------------------- 0027_apply_door.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0027 — 입점 신청을 **넣는 문** (지시서 5번 A · 11번 5단계)
-- ════════════════════════════════════════════════════════════════════
-- 0016 이 provider_apply 표와 **상태를 바꾸는 문**은 만들어 두었는데
-- **넣는 문이 없습니다.** 앞 서비스는 서버가 service key 로 넣었습니다 —
-- 그 키는 RLS 를 통째로 지나가므로 쓰지 않습니다. 대신 검사를 다 거치는
-- 문 하나를 열고, 그 문으로만 들어오게 합니다.
--
-- ⚠️⚠️ **인자를 jsonb 하나로 받습니다.** 칸이 늘 때마다 인자를 더하면
--   부르는 쪽과 받는 쪽의 **자리**가 어긋나고, 그 어긋남은 "인자 개수가
--   다릅니다" 가 아니라 **엉뚱한 값이 엉뚱한 칸에 들어가는** 꼴로
--   납니다. 앞 서비스에서 그렇게 겪었습니다.
--
-- ⚠️⚠️ **로그인 없이 부를 수 있습니다** (anon). 입점하려는 사장님에게
--   먼저 회원가입을 시키면 그 자리에서 절반이 떠납니다. 대신 ——
--     · 넣기만 됩니다. 읽기는 운영자만입니다 (0016 의 RLS).
--     · 같은 번호로 10분 안에 또 넣으면 막습니다 (지시서 5번 A
--       "중복 · 허위 신청 방지").
--     · 빈 칸 · 말이 안 되는 번호 · 미래의 동의 시각을 막습니다.
--   ⚠️ 그래도 **스팸을 완전히 막지는 못합니다.** 초당 횟수 제한은 DB 가
--   아니라 앞단(Vercel · Cloudflare)에서 걸어야 합니다. 열어 둔 문이라는
--   것을 잊지 마세요.
--
-- ⚠️⚠️ **서비스 키(하위 분류)를 DB 가 검사하지 않습니다.** 그 목록은
--   js/data/catalog.js 에 있고, 두 곳에 적으면 한쪽만 고쳐서 조용히
--   어긋납니다. 대신 **빌드 가드**(tools/check-form.js)가 화면이 내는
--   값이 실제 하위 키인지 봅니다.
--
-- ⚠️ 신청번호는 **서울 날짜 + 일련번호**입니다. Supabase 는 UTC 라
--   그냥 now() 를 쓰면 밤 9시 이후 신청이 **다음 날 번호**를 답니다.
-- ════════════════════════════════════════════════════════════════════
begin;

create sequence if not exists apply_no_seq;

create or replace function make_apply(p jsonb)
  returns text language plpgsql security definer set search_path = public as $$
declare
  v_company  text := btrim(coalesce(p->>'company', ''));
  v_name     text := btrim(coalesce(p->>'name', ''));
  v_tel      text := btrim(coalesce(p->>'tel', ''));
  v_email    text := nullif(btrim(coalesce(p->>'email', '')), '');
  v_brn      text := nullif(btrim(coalesce(p->>'brn', '')), '');
  v_region   text := nullif(btrim(coalesce(p->>'region', '')), '');
  v_note     text := nullif(btrim(coalesce(p->>'note', '')), '');
  v_svc      text[] := coalesce(
                 (select array_agg(btrim(x)) from jsonb_array_elements_text(
                    case when jsonb_typeof(p->'services') = 'array'
                         then p->'services' else '[]'::jsonb end) as t(x)
                  where btrim(x) <> ''), '{}'::text[]);
  v_digits   text;
  v_no       text;
begin
  -- ⚠️ 자물쇠마다 **다른 말**로 거절합니다. 같은 말이면 하나를 빼 봐도
  --    다른 것이 먼저 막아 엉뚱한 까닭으로 통과합니다.
  if v_company = '' then raise exception '상호를 적어 주세요'; end if;
  if v_name    = '' then raise exception '담당자 성함을 적어 주세요'; end if;
  if v_tel     = '' then raise exception '연락처를 적어 주세요'; end if;

  if length(v_company) > 80  then raise exception '상호가 너무 깁니다'; end if;
  if length(v_name)    > 40  then raise exception '성함이 너무 깁니다'; end if;
  if v_note is not null and length(v_note) > 2000 then
    raise exception '남기신 말씀이 너무 깁니다';
  end if;

  v_digits := regexp_replace(v_tel, '[^0-9]', '', 'g');
  -- ⚠️ 경계값: 9자리(02-xxx-xxxx)부터 11자리(010-xxxx-xxxx)까지입니다.
  if length(v_digits) < 9 or length(v_digits) > 11 then
    raise exception '연락처를 다시 봐 주세요 — 숫자 아홉에서 열한 자리입니다';
  end if;

  if array_length(v_svc, 1) is null then
    raise exception '하시는 일을 하나 이상 골라 주세요';
  end if;
  if array_length(v_svc, 1) > 20 then
    raise exception '고르신 항목이 너무 많습니다';
  end if;

  -- ⚠️⚠️ 동의 시각은 **화면이 보낸 값**입니다. 미래이거나 너무 오래된
  --    것은 믿지 않습니다 (개인정보보호법 제15조 — 그 자리에서 받은
  --    동의여야 합니다).
  if (p->>'agree_at') is null then
    raise exception '수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes' then
    raise exception '동의 시각이 미래입니다';
  end if;
  if (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의가 오래되었습니다 — 다시 한 번 눌러 주세요';
  end if;

  -- 중복 · 허위 신청 막기 (지시서 5번 A)
  if exists (
    select 1 from provider_apply
     where regexp_replace(tel, '[^0-9]', '', 'g') = v_digits
       and state = 'new'
       and created_at > now() - interval '10 minutes')
  then
    raise exception '방금 같은 번호로 신청이 들어왔습니다 — 잠시 뒤에 다시 해 주세요';
  end if;

  v_no := 'GA' || to_char(now() at time zone 'Asia/Seoul', 'YYMMDD')
               || '-' || lpad(nextval('apply_no_seq')::text, 4, '0');

  insert into provider_apply
    (no, company, brn, name, tel, email, region, services, note, agree_at)
  values
    (v_no, v_company, v_brn, v_name, v_tel, v_email, v_region, v_svc, v_note,
     (p->>'agree_at')::timestamptz);

  -- ⚠️ 감사 기록에 **성함 · 연락처를 넣지 않습니다.** audit_log 는 오래
  --    남고 보는 사람도 넓습니다. 신청번호로 찾아가면 됩니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (auth.uid(), my_role(), 'provider_apply', v_no, 'new', '입점 신청 접수',
          jsonb_build_object('services', v_svc, 'region', v_region));

  return v_no;
end $$;

revoke all on function make_apply(jsonb) from public;
grant execute on function make_apply(jsonb) to anon, authenticated;

insert into schema_version (n, name) values (27, '0027_apply_door')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0028_biz_hat_sync.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0028 — 업체 계정에 **사업자 회원 모자**가 저절로 따라옵니다
-- ════════════════════════════════════════════════════════════════════
-- 0025 가 member_hat('biz') 를 만들면서 "입점 신청이 승인되면 붙습니다"
-- 라고 적었습니다. 그런데 승인은 두 걸음입니다 —
--   ① set_apply_state(..., 'done', '업체주소')   신청을 업체에 잇고
--   ② update account set role='provider', provider_id='업체주소'
--      (0018 머리말 · db/README.md — **화면이 아니라 SQL 로만** 합니다)
-- 여기에 "그리고 biz 모자를 붙인다" 를 **세 번째 걸음**으로 두면,
-- 빠뜨리는 날 업체 사장님이 로그인은 되는데 업체 화면만 안 열립니다.
-- 에러도 안 납니다 — 조용히 어긋납니다.
--
-- ⚠️⚠️ 그래서 **모자를 손으로 붙이지 않습니다.** account 의 role 과
--   provider_id 가 **하나의 참**이고, 모자는 거기서 따라옵니다.
--   규칙은 한 곳(이 트리거)에 두고 모두가 그것을 부릅니다.
--
-- ⚠️ 거꾸로도 돕니다 — 업체 계정을 풀면 모자가 떨어집니다.
--   안 그러면 그만둔 업체가 업체 화면을 계속 봅니다.
--
-- ⚠️ 모자를 **직접** 붙이고 떼는 문(grant_hat)은 그대로 둡니다.
--   예외를 손으로 처리해야 하는 날이 옵니다.
-- ════════════════════════════════════════════════════════════════════
begin;

create or replace function account_biz_hat() returns trigger
  language plpgsql security definer set search_path = public as $$
declare v_is boolean;
begin
  v_is := (new.role = 'provider' and new.provider_id is not null);

  if v_is then
    insert into account_hat (account_id, hat, by_user)
    values (new.id, 'biz', auth.uid())
    on conflict (account_id, hat) do nothing;
    if not found then
      -- 이미 있던 경우에는 기록을 남기지 않습니다 (같은 줄이 쌓입니다)
      return new;
    end if;
    insert into audit_log (by_user, by_role, obj, obj_id, to_state, why)
    values (auth.uid(), my_role(), 'account_hat', new.id::text, 'biz',
            '업체 계정이 이어져 자동으로 붙음 (' || new.provider_id || ')');
  else
    delete from account_hat where account_id = new.id and hat = 'biz';
    if found then
      insert into audit_log (by_user, by_role, obj, obj_id, from_state, why)
      values (auth.uid(), my_role(), 'account_hat', new.id::text, 'biz',
              '업체 계정이 풀려 자동으로 떨어짐');
    end if;
  end if;
  return new;
end $$;

drop trigger if exists account_biz_hat_sync on account;
create trigger account_biz_hat_sync
  after insert or update of role, provider_id on account
  for each row execute function account_biz_hat();

-- ⚠️ 이미 이어져 있는 계정에도 지금 한 번 붙입니다 (따라잡기).
--    트리거는 **앞으로** 바뀌는 줄만 봅니다.
insert into account_hat (account_id, hat)
  select id, 'biz' from account
   where role = 'provider' and provider_id is not null
on conflict (account_id, hat) do nothing;

insert into schema_version (n, name) values (28, '0028_biz_hat_sync')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0029_match_door.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0029 — 통합 매칭 요청을 **넣는 문** (2차 지시서 §5)
-- ════════════════════════════════════════════════════════════════════
-- 0001 이 `request` 표를, 0009 가 `request_item`(한 신청에 서비스 여럿)을
-- 만들어 두었는데 **넣는 문이 없습니다.** 앞 서비스는 서버가 service key
-- 로 넣었습니다 — 그 키는 RLS 를 통째로 지나갑니다. 검사를 다 거치는
-- 문 하나를 열고 그 문으로만 들어오게 합니다 (0027 과 같은 규칙).
--
-- ⚠️⚠️ **제3자 제공 동의를 여기서 받지 않습니다.**
--   2차 지시서 §5 의 5번은 "개인정보 처리 및 업체 제공 동의" 를 요청하는
--   자리에서 같이 받으라고 적었습니다. 그런데 그 시점에는 **어느 업체에
--   줄지 정해지지 않았습니다.** 개인정보보호법 제17조 제2항은 제공받는
--   자를 알리고 동의를 받으라고 하므로, 누구에게 줄지 모르는 상태의
--   뭉뚱그린 동의는 위반입니다.
--   그래서 여기서는 **수집 · 이용 동의(agree_at)만** 받고,
--   **제3자 제공 동의(agree3rd_at)는 배정하는 순간** 상호를 알리고
--   따로 받습니다. 그 문은 배정 화면을 세우는 날 만듭니다.
--   ⚠️ 그때까지 `agree3rd_at` 이 비어 있는 신청은 **업체에 넘기면 안
--   됩니다.** 배정 문이 그것을 막아야 합니다.
--
-- ⚠️⚠️ **신청번호는 0005 의 꼴(SW-XXXX-XXXX)을 그대로 씁니다.**
--   비회원이 번호와 연락처로 자기 신청을 찾는 문(`claim_request`)이
--   그 꼴만 받습니다. 머리글자를 바꾸면 그 함수도 같이 고쳐야 하고,
--   그러면 **0005 를 다시 붙여 넣는 날 조용히 되돌아갑니다**
--   (작업 기억의 "뒤 번호가 앞 번호를 덮는" 자리). 안 건드립니다.
--   ⚠️ SW 는 도메인(storeway)에서 온 머리입니다 — 브랜드 이름이 아닙니다.
--
-- ⚠️ 글자는 읽기 쉬운 것만 씁니다 (I · L · O · U 를 뺍니다) — 0005 의
--   정규식과 **같은 묶음**이어야 합니다.
-- ════════════════════════════════════════════════════════════════════
begin;

create or replace function make_request(p jsonb)
  returns text language plpgsql security definer set search_path = public as $$
declare
  v_name  text := btrim(coalesce(p->>'name', ''));
  v_tel   text := btrim(coalesce(p->>'tel', ''));
  v_email text := nullif(btrim(coalesce(p->>'email', '')), '');
  v_region text := nullif(btrim(coalesce(p->>'region', '')), '');
  v_gu    text := nullif(btrim(coalesce(p->>'gu', '')), '');
  v_want  text := nullif(btrim(coalesce(p->>'want_at', '')), '');
  v_body  text := nullif(btrim(coalesce(p->>'body', '')), '');
  v_idem  text := nullif(btrim(coalesce(p->>'idem', '')), '');
  v_bmin  bigint := nullif(p->>'budget_min', '')::bigint;
  v_bmax  bigint := nullif(p->>'budget_max', '')::bigint;
  v_svc   text[] := coalesce(
             (select array_agg(distinct btrim(x)) from jsonb_array_elements_text(
                case when jsonb_typeof(p->'services') = 'array'
                     then p->'services' else '[]'::jsonb end) as t(x)
              where btrim(x) <> ''), '{}'::text[]);
  v_digits text;
  v_no     text;
  v_id     uuid;
  v_try    int := 0;
  v_abc    text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  v_raw    text;
  k        text;
begin
  -- ⚠️ 자물쇠마다 **다른 말**로 거절합니다.
  if v_name = '' then raise exception '성함을 적어 주세요'; end if;
  if v_tel  = '' then raise exception '연락처를 적어 주세요'; end if;
  if length(v_name) > 40 then raise exception '성함이 너무 깁니다'; end if;
  if v_body is not null and length(v_body) > 2000 then
    raise exception '남기신 말씀이 너무 깁니다';
  end if;

  v_digits := regexp_replace(v_tel, '[^0-9]', '', 'g');
  -- ⚠️ 경계값: 9자리(02-xxx-xxxx)부터 11자리(010-xxxx-xxxx)까지입니다.
  if length(v_digits) < 9 or length(v_digits) > 11 then
    raise exception '연락처를 다시 봐 주세요 — 숫자 아홉에서 열한 자리입니다';
  end if;

  if array_length(v_svc, 1) is null then
    raise exception '원하시는 서비스를 하나 이상 골라 주세요';
  end if;
  if array_length(v_svc, 1) > 10 then
    raise exception '고르신 서비스가 너무 많습니다 — 열 개까지입니다';
  end if;

  -- ⚠️ 예산은 **0 도 값입니다** (무료 상담). 음수와 뒤집힌 것만 막습니다.
  if v_bmin is not null and v_bmin < 0 then raise exception '예산은 0 보다 작을 수 없습니다'; end if;
  if v_bmax is not null and v_bmax < 0 then raise exception '예산은 0 보다 작을 수 없습니다'; end if;
  if v_bmin is not null and v_bmax is not null and v_bmin > v_bmax then
    raise exception '예산의 아래가 위보다 큽니다';
  end if;

  if (p->>'agree_at') is null then
    raise exception '수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes' then
    raise exception '동의 시각이 미래입니다';
  end if;
  if (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의가 오래되었습니다 — 다시 한 번 눌러 주세요';
  end if;

  -- ⚠️⚠️ **같은 요청을 두 번 넣는 것을 두 겹으로 막습니다.**
  --   ① idem — 화면이 한 번 연 동안 하나입니다 (두 번 눌러도 하나)
  --   ② 같은 번호로 10분 안 (지시서 §6 의 "유효 상담" · "중복 방지")
  if v_idem is not null then
    select id, no into v_id, v_no from request where idem = v_idem;
    if v_id is not null then return v_no; end if;   -- 이미 들어간 것입니다
  end if;
  if exists (
    select 1 from request
     where regexp_replace(tel, '[^0-9]', '', 'g') = v_digits
       and created_at > now() - interval '10 minutes')
  then
    raise exception '방금 같은 번호로 요청이 들어왔습니다 — 잠시 뒤에 다시 해 주세요';
  end if;

  -- 번호 — 겹치면 다시 뽑습니다 (스무 번까지)
  loop
    v_try := v_try + 1;
    v_raw := '';
    for i in 1..8 loop
      v_raw := v_raw || substr(v_abc, 1 + floor(random() * length(v_abc))::int, 1);
    end loop;
    v_no := 'SW-' || substring(v_raw from 1 for 4) || '-' || substring(v_raw from 5 for 4);
    exit when not exists (select 1 from request where no = v_no);
    if v_try > 20 then raise exception '신청번호를 만들지 못했습니다'; end if;
  end loop;

  insert into request (no, user_id, side, cat, region, gu,
                       budget_min, budget_max, want_at, body,
                       name, tel, email, agree_at, idem)
  values (v_no, auth.uid(), 'golf',
          -- ⚠️ 분류는 **첫 서비스가 속한 분류**를 화면이 적어 보냅니다.
          --    DB 는 분류 목록을 모릅니다 (그 목록은 js/data/catalog.js
          --    한 곳에 있고, 두 곳에 적으면 조용히 어긋납니다).
          nullif(btrim(coalesce(p->>'cat', '')), ''),
          v_region, v_gu, v_bmin, v_bmax, v_want, v_body,
          v_name, v_tel, v_email, (p->>'agree_at')::timestamptz, v_idem)
  returning id into v_id;

  foreach k in array v_svc loop
    insert into request_item (request_id, service_id)
    values (v_id, k)
    on conflict (request_id, service_id) do nothing;
  end loop;

  -- ⚠️ 감사 기록에 **성함 · 연락처를 넣지 않습니다.** 신청번호로 찾아갑니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (auth.uid(), my_role(), 'request', v_no, 'new', '매칭 요청 접수',
          jsonb_build_object('services', v_svc, 'region', v_region,
                             'cat', nullif(btrim(coalesce(p->>'cat', '')), '')));

  return v_no;
end $$;

revoke all on function make_request(jsonb) from public;
grant execute on function make_request(jsonb) to anon, authenticated;

insert into schema_version (n, name) values (29, '0029_match_door')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0030_test_provider.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0030 — **검사용 업체**를 참 업체와 갈라 둡니다 (2차 지시서 §8)
-- ════════════════════════════════════════════════════════════════════
-- 지시서 §8 이 "실제 데이터와 테스트 데이터를 구분한다" 고 적었고,
-- §1 과 절대 규칙 1 이 **없는 업체를 손님에게 보이는 것**을 금지합니다
-- (표시 · 광고의 공정화에 관한 법률 제3조). 그런데 지금 `provider` 표에는
-- 그 둘을 가를 칸이 **없습니다.**
--
-- ⚠️⚠️ **왜 지금 필요한가.** 상담 → 배정 → 견적 → 고르기 흐름은
--   업체가 있어야 눌러 볼 수 있습니다. 참 업체가 0곳인 동안 그 자리를
--   한 번도 안 눌러 보고 두면, 첫 업체가 들어온 날 **그때 처음** 깨진
--   것을 알게 됩니다. 그래서 검사용 업체를 넣어 눌러 보는데 —
--   **그 줄이 손님 화면으로 새면 그 순간 없는 회사를 광고하는 것**입니다.
--   칸 하나로 그 길을 끊습니다.
--
-- ⚠️⚠️ **`listed` 와 다른 칸입니다.** 셋이 하는 일이 다릅니다 —
--     listed      공개 목록에 낼 것인가           (관리자가 정합니다)
--     assignable  신청을 넘겨도 되는가             (계약 · 계정 연결)
--     is_test     **참 업체가 아닙니다**           (지우기 전까지 영원히)
--   `listed = false` 로만 숨기면 누군가 공개를 켜는 날 조용히 손님에게
--   나갑니다. `is_test` 는 **공개 정책 자체가** 걸러서, 켜도 안 나갑니다.
--
-- ⚠️⚠️ **앞으로 세는 자리는 전부 `is_test = false` 로 좁혀야 합니다.**
--   매각 지표(2차 지시서 §9 — MAU · 유효 상담 비율 · 거래액)에 검사용
--   줄이 섞이면 그건 **투자자에게 하는 거짓말**입니다. 지금 세는 곳은
--   `js/account.js` 의 관리자 현황 하나이고, 거기서는 검사용을 **따로**
--   셉니다 (섞지 않고 갈라 보여 줍니다).
--
-- ⚠️ 돌려도 참 자료가 바뀌지 않습니다 — default false 라 기존 줄은
--   전부 참 업체로 남습니다 (not null 을 default 와 **같이** 적는
--   까닭입니다. default 없이 not null 을 붙이면 줄이 있는 표에서
--   그 자리에서 터집니다).
--
-- ⚠️⚠️ **`provider_guard()` 를 네 번째로 다시 씁니다**
--   (0001 → 0021 → 0024 → 0030). 앞 번호를 다시 붙여 넣으면 이 파일이
--   한 일이 **조용히 내려갑니다** — 에러가 안 납니다. 내려갔는지는
--   이렇게 봅니다:
--     select prosrc like '%is_test%' from pg_proc where proname='provider_guard';
--   false 면 앞 판입니다. 이 파일을 다시 올리세요.
--
-- ⚠️ 씨앗은 여기 넣지 않습니다 — `db/seed/test-providers.sql` 입니다.
--   마이그레이션에 넣으면 운영 DB 를 올리는 날 **검사용 업체가 같이**
--   올라갑니다.
-- ════════════════════════════════════════════════════════════════════
begin;

-- ── ① 칸 ────────────────────────────────────────────────────────────
alter table provider
  add column if not exists is_test boolean not null default false;

comment on column provider.is_test is
  '참 업체가 아닙니다 (검사용). 공개 정책이 걸러 손님 화면에 안 나갑니다. '
  '세는 자리는 전부 is_test = false 로 좁혀야 합니다 — 2차 지시서 §8.';

-- ⚠️ 공개 목록을 꺼낼 때마다 보는 칸이라 인덱스를 같이 둡니다.
create index if not exists provider_live_idx
  on provider (listed) where is_test = false;


-- ── ② 공개 정책 — 검사용은 **anon 에게 한 줄도** 안 갑니다 ──────────
-- ⚠️⚠️ 0001 의 정책을 **덮어씁니다.** 0001 을 다시 붙여 넣으면 이것이
--   내려가고 검사용 업체가 공개됩니다 — 위 머리말의 확인 질의와 같은
--   자리입니다.
-- ⚠️ 운영자와 **그 업체 자신**은 그대로 봅니다. 안 보이면 눌러 볼
--   수가 없고, 배정 화면에서 고를 수도 없습니다.
drop policy if exists provider_public on provider;
create policy provider_public on provider for select
  using ((listed = true and is_test = false)
         or my_role() in ('staff','admin')
         or id = my_provider());


-- ── ③ 업체가 스스로 끌 수 없게 ─────────────────────────────────────
-- ⚠️⚠️ **업체가 `is_test` 를 끄면 그 자리에서 공개됩니다.** `listed` ·
--   `verified` 와 같은 종류의 칸이라 같은 자물쇠에 넣습니다.
-- ⚠️ 거절하는 말을 **다른 말로** 둡니다 — 자물쇠가 겹치면 어느 것이
--   막았는지 알 수 없고, 검사가 엉뚱한 까닭으로 통과합니다.
create or replace function provider_guard() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if my_role() = 'admin' then return new; end if;
  if new.verified is distinct from old.verified then
    raise exception '확인 배지는 플랫폼이 서류를 확인한 뒤에만 켜집니다';
  end if;
  if new.listed is distinct from old.listed then
    raise exception '공개 여부는 관리자가 정합니다';
  end if;
  if new.id is distinct from old.id then
    raise exception '업체 주소(id)는 바꿀 수 없습니다 — 이미 색인된 주소입니다';
  end if;
  if new.is_test is distinct from old.is_test then
    raise exception '검사용 표시는 관리자만 바꿀 수 있습니다';
  end if;
  return new;
end $$;


-- ── ④ 검사용 줄이 섞이지 않게 세는 손잡이 ──────────────────────────
-- ⚠️⚠️ **왜 함수인가.** 관리자 화면은 PostgREST 로 `provider` 를 세는데,
--   운영자에게는 검사용 줄도 보입니다 (② 의 정책). 그래서 화면이 센
--   값은 **검사용이 섞인 값**이고, 그것을 "업체 수" 라고 찍으면 그
--   화면부터 이미 틀린 숫자입니다.
--   PostgREST 로 `is_test=eq.false` 를 붙일 수도 있지만, 그러면 **화면이
--   그 조건을 기억해야** 하고 새 화면을 만드는 날 빠집니다 (같은 규칙을
--   두 곳에 적는 자리입니다). 세는 규칙을 DB 에 한 번 둡니다.
-- ⚠️ 돌려주는 것은 **숫자 둘**입니다 — 사람 정보가 아닙니다.
-- ⚠️⚠️ **0 을 null 로 섞지 않습니다.** 못 읽은 것과 0건은 다릅니다 —
--   읽을 수 없으면 거절(exception)하고, 0건이면 0 을 돌려줍니다.
create or replace function provider_counts() returns jsonb
  language plpgsql stable security definer set search_path = public as $$
declare v_live int; v_test int;
begin
  if my_role() not in ('staff','admin') then
    raise exception '업체 수는 직원 · 관리자만 볼 수 있습니다';
  end if;
  select count(*) into v_live from provider where is_test = false;
  select count(*) into v_test from provider where is_test = true;
  return jsonb_build_object('real', v_live, 'test', v_test);
end $$;

revoke all on function provider_counts() from public;
grant execute on function provider_counts() to authenticated;

insert into schema_version (n, name) values (30, '0030_test_provider')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0031_quote_provider_name.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0031 — 손님이 **자기에게 배정된 업체의 상호**를 볼 수 있게
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️ **조용히 깨져 있던 자리입니다.** 견적 비교 화면을 세우면서
--   알았습니다 —
--
--   손님 화면은 견적을 이렇게 꺼냅니다 (PostgREST 의 묶음 읽기):
--     quote?select=...,provider:provider_id(id,name)
--   그런데 묶여 나오는 `provider` 줄에도 RLS 가 걸립니다. 0001 의
--   `provider_public` 은 `listed = true` 인 줄만 열어 주므로, **공개
--   목록에 없는 업체가 낸 견적은 상호가 `null` 로** 나옵니다.
--   금액만 있고 **누가 냈는지가 없는 견적**입니다.
--
--   에러가 안 납니다. 화면은 멀쩡히 그려지고 그 칸만 빕니다 —
--   `listed = true` 인 업체로만 눌러 보면 **영원히 안 보이는** 고장입니다.
--
-- ⚠️⚠️ **이것은 가려야 할 것을 더 여는 일이 아닙니다.** 배정하는 순간
--   그 업체의 **상호를 손님에게 알리고** 제3자 제공 동의를 받았습니다
--   (개인정보보호법 제17조 제2항 · 0004 의 move_state). 이미 알려 드린
--   상호를 그 손님에게 보여 주는 것입니다. 모르는 업체가 아닙니다.
--
-- ⚠️ 여는 범위를 **그 손님 · 그 업체**로 좁힙니다 — 배정된 적이 없는
--   업체는 전과 똑같이 안 보입니다.
--
-- ⚠️⚠️ **정책 안에서 `assignment` 를 바로 읽으면 무한 재귀입니다.**
--   `assignment` 의 정책이 `request` 를 보고, `request` 의
--   `request_assigned` 가 다시 `assignment` 를 봅니다 — Postgres 가
--   *"infinite recursion detected in policy"* 로 멈춥니다 (0005 · 0008
--   에서 실제로 겪은 자리). 그래서 `security definer` 함수로 끊습니다.
--
-- ⚠️ 검사용 업체(0030)도 여기서는 보입니다. **그것이 맞습니다** —
--   배정이 실제로 있었다는 뜻이고, 그 상호는 이미 알려 드린 것입니다.
--   공개 목록 · 분류 화면 · 사이트맵은 0030 의 정책이 그대로 막습니다
--   (그 길은 `listed = true and is_test = false` 를 지나야 합니다).
-- ════════════════════════════════════════════════════════════════════
begin;

-- ⚠️ `stable` 입니다 — 한 질의 안에서 줄마다 다시 돌지 않게.
create or replace function provider_told_to_me(p_id text) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1
      from assignment a
      join request r on r.id = a.request_id
     where a.provider_id = p_id
       and r.user_id = auth.uid()
  )
$$;
revoke all on function provider_told_to_me(text) from public;
grant execute on function provider_told_to_me(text) to authenticated;

-- ⚠️⚠️ **0030 의 정책을 건드리지 않고 정책을 하나 더 답니다.**
--   RLS 의 select 정책 여럿은 **or 로** 묶입니다 — 0030 을 고쳐
--   조건을 늘리면 "공개 목록" 규칙과 "내 업체" 규칙이 한 덩어리가 되고,
--   한쪽을 고칠 때 다른 쪽이 같이 움직입니다. 따로 둡니다.
drop policy if exists provider_told on provider;
create policy provider_told on provider for select
  using (provider_told_to_me(id));

insert into schema_version (n, name) values (31, '0031_quote_provider_name')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0032_provider_card_view.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0032 — 업체 목록을 **가져올 길**을 엽니다 (그리고 광고 보기의 구멍 하나)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **`tools/pull-providers.js` 는 지금까지 한 번도 돌 수 없었습니다.**
--   그 도구는 공개 키(anon)로 `provider` 표를 읽습니다. 그런데 0001 의
--   GRANT 는 **anon 에게 select 를 한 줄도 주지 않습니다** (452~456행 —
--   "anon 에게는 아무 권한도 주지 않습니다"). RLS 의 `provider_public`
--   정책만 보고 "공개 목록은 읽힌다" 고 읽었는데, **GRANT 가 먼저**
--   막습니다 — `permission denied for table provider` 입니다.
--
--   업체가 0곳인 동안은 아무도 그 도구를 돌릴 까닭이 없어서 몰랐습니다.
--   **첫 업체를 승인하신 날** 그때 처음 터질 참이었고, 그날은 손님에게
--   업체를 보여 드리려는 날입니다. 0030 의 검사를 쓰면서 anon 으로
--   눌러 보다 알았습니다 (자물쇠가 **겹쳐 있어** 정책만 보고 통과로
--   읽은 자리 — 작업 기억의 "GRANT 와 RLS 를 따로 눌러 보세요").
--
-- ⚠️⚠️ **표를 anon 에게 열지 않습니다.** `grant select on provider to anon`
--   한 줄로 끝낼 수도 있지만, 그러면 **칸 전부**가 열립니다 —
--   `assignable`(제휴 계약이 되어 있는가) · `listed` · `is_test` 까지
--   누구나 읽습니다. 그건 손님 화면에 쓰지 않는 운영 정보입니다.
--   그래서 **칸을 골라 담은 보기(view)** 하나만 엽니다.
--
-- ⚠️⚠️ **보기는 RLS 를 지나지 않습니다** (security_invoker 를 안 켰으니
--   임자 권한으로 돕니다). 그러니 **보기의 where 절이 자물쇠 그 자체**
--   입니다 — 0030 의 정책과 **다른 자리에 있는 둘째 자물쇠**이고,
--   한쪽이 내려가도 다른 쪽이 남습니다. 칸을 더하실 때 이 줄을 꼭
--   다시 읽으세요.
--
-- ⚠️ `is_test` 를 **일부러 담았습니다.** 보기의 where 가 늘 false 로
--   좁히니 쓸모없어 보이지만, `tools/pull-providers.js` 가 그 값을
--   다시 봅니다 — where 가 느슨해지는 날 도구가 멈춥니다.
--
-- ⚠️⚠️ **광고 보기(v_ad_live)에 구멍이 하나 있었습니다.** 그 보기는
--   `provider` 를 join 해서 상호를 내보내고 anon 에게 열려 있는데,
--   보기는 RLS 를 지나지 않으므로 **검사용 업체의 상호가 광고로 나갈**
--   수 있었습니다 (0030 의 정책이 그 길은 못 막습니다). 같이 좁힙니다.
-- ════════════════════════════════════════════════════════════════════
begin;

-- ── ① 공개용 업체 보기 ──────────────────────────────────────────────
-- ⚠️⚠️ **연락처 · 담당자 칸이 여기 없습니다** (그 자료는 0013 의
--   `provider_contact` 에 따로 있고, 운영자만 봅니다). 이 보기에
--   사람 정보를 담지 마세요 — anon 에게 열린 자리입니다.
-- ⚠️ `assignable` 도 담지 않습니다 — 어느 업체와 계약이 되어 있는지는
--   손님 화면에 쓸 일이 없습니다.
-- ⚠️⚠️⚠️ **보기는 `create or replace` 로 칸을 못 늘립니다.** 뒤 번호가
--   이 보기에 칸을 하나 더하면(0044 가 `contact_ways` 를 더했습니다),
--   사장님이 붙여넣기 파일을 **두 번째로** 붙여 넣는 날 이 줄에서
--   `cannot drop columns from view` 로 멈춥니다 — 앞쪽 파일이 옛 칸
--   목록으로 다시 만들려 하기 때문입니다.
--   ⚠️ 그래서 **지우고 다시 만듭니다.** 지우면 GRANT 도 같이 날아가므로
--   바로 아래에서 다시 줍니다 (안 주면 anon 이 못 읽어 그날부터
--   `tools/pull-providers.js` 가 permission denied 입니다).
--   ⚠️⚠️ 이 줄을 고친 까닭 — 운영 DB 는 아직 0007 까지만 올라가 있어
--   **이 파일이 운영에서 한 번도 돈 적이 없습니다.** 이미 돌린 파일이면
--   고치지 않고 새 번호로 갔을 것입니다 (작업 기억의 그 규칙).
--   `tools/test-upgrade.js` 의 ⑧ 이 "두 번 붙여 넣어도 끝까지 도는가" 를
--   실제로 돌려 봅니다.
drop view if exists v_provider_card;
create view v_provider_card as
  select p.id, p.name, p.intro, p.regions, p.gu, p.subs, p.since,
         p.consult_hours, p.verified, p.brands, p.scale,
         p.is_test       -- ⚠️ 늘 false 입니다 (아래 where) — 도구가 다시 봅니다
    from provider p
   where p.listed = true
     and p.is_test = false;

comment on view v_provider_card is
  '손님 화면 · tools/pull-providers.js 가 읽는 공개 업체 목록. '
  'RLS 를 지나지 않으므로 where 절이 자물쇠입니다 (0032).';

grant select on v_provider_card to anon, authenticated;


-- ── ② 광고 보기에서도 검사용을 거릅니다 ────────────────────────────
-- ⚠️⚠️ 0026 의 보기를 **덮어씁니다.** 0026 을 다시 붙여 넣으면 이것이
--   내려가고 검사용 업체의 상호가 광고로 나갈 수 있습니다. 내려갔는지는
--   이렇게 봅니다:
--     select definition like '%is_test%' from pg_views where viewname='v_ad_live';
--   false 면 0026 판입니다. 이 파일을 다시 올리세요.
-- ⚠️ 칸 목록과 차례는 0026 것 **그대로**입니다 — 이 파일은 `is_test`
--   한 줄만 더합니다. 칸을 늘리는 것은 0064 이고, 그 때문에 아래가
--   `drop view` + `create view` 로 바뀌었습니다 (바로 아래 머리말).
-- ⚠️⚠️ `label` 을 **그대로 둡니다.** 광고를 광고라고 적지 않으면
--   표시 · 광고의 공정화에 관한 법률 제3조입니다.
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
     and current_date between a.starts_on and a.ends_on
     and p.is_test = false;

-- ⚠️ 지우면 권한도 같이 날아갑니다 — 바로 다시 줍니다
--   (안 주면 그날부터 손님 화면에 광고가 한 줄도 안 나옵니다).
grant select on v_ad_live to anon, authenticated;

insert into schema_version (n, name) values (32, '0032_provider_card_view')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0033_biz_metrics.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0033 — 매각 지표 (2차 지시서 §9)
-- ════════════════════════════════════════════════════════════════════
-- 지시서 §9 가 적은 것은 셋입니다 — **MAU · 유효 상담 비율 ·
-- 거래액과 순매출의 분리.** 이 파일은 그것을 **세는 식 한 곳**입니다.
--
-- ⚠️⚠️⚠️ **이 숫자는 사업의 값을 매기는 데 쓰입니다.** 틀리면 손님이
--   불편한 것이 아니라 **투자자에게 거짓을 말한 것**이 됩니다. 그래서
--   이 파일은 다른 어떤 파일보다 **덜 세는 쪽으로** 기웁니다 —
--   애매하면 빼고, 뺀 것을 **따로 세어 같이 내놓습니다.**
--
-- ⚠️⚠️ **검사용 업체를 뺍니다** (0030 의 `is_test`). 섞이면 그 순간
--   없는 거래가 지표에 들어갑니다. 업체가 붙는 숫자는 전부 걸렀고,
--   `request` 에는 검사용 표시가 없어서 **검사용 업체에만 넘어간
--   요청**을 빼고 그 수를 `req_test` 로 따로 냅니다 (조용히 빼지
--   않습니다 — 빠진 것이 보여야 합니다).
--
-- ⚠️⚠️ **거래액과 순매출을 한 칸에 담지 않습니다.** 거래액은 손님이
--   업체에 낸 돈이고 **우리 돈이 아닙니다.** 두 값을 더해 "매출" 로
--   적는 순간 그건 과장입니다 (§9 가 "분리" 라고 적은 까닭).
--   ⚠️ 그리고 **플랫폼이 버는 돈 안에서도** 다시 가릅니다 —
--     · `fee_paid`  실제 입금 기록이 있는 유일한 돈 (`deal.paid`)
--     · `fee_set`   확정만 된 것 (`deal.fee_total`)
--     · `ad` · `mship`  **청구 · 입금 장치가 아직 없습니다.** 금액이
--       적혀 있을 뿐입니다. 합쳐서 "매출" 로 내면 받은 적 없는 돈을
--       받았다고 하는 것입니다 (절대 규칙 5 · 지시서 §13 가짜 정산 금지).
--   그래서 **하나로 더한 값을 일부러 내놓지 않습니다.** 더하는 것은
--   보는 사람이 뜻을 알고 할 일입니다.
--
-- ⚠️⚠️ **MAU 를 낼 수 없습니다.** 방문자를 세는 장치가 없습니다
--   (분석 도구를 안 붙였습니다). 없는 것을 추정해서 내면 그게 지어낸
--   숫자입니다 — 대신 **로그인해서 실제로 뭔가를 한 회원 수**를 내고
--   이름도 `users`(활동 회원)로 둡니다. 화면이 "방문자가 아니다" 라고
--   같이 적습니다.
--   ⚠️ 방문자 MAU 를 재시려면 분석 도구를 붙이셔야 하고, **붙이는 날
--   개인정보 처리방침에 수탁자를 같은 날 적어야 합니다** (개인정보
--   보호법 제26조 · 미국 회사면 국가도 — 제28조의8).
--
-- ⚠️⚠️ **달은 한국 시각으로 가릅니다.** Supabase 는 UTC 입니다 —
--   그냥 자르면 한국 시각 12월 1일 0시 30분에 들어온 요청이 **11월**로
--   잡힙니다. 날짜로 번호를 만들 때 겪은 것과 같은 자리입니다.
--
-- ⚠️⚠️⚠️ **앞 사업(중고폰)의 자료를 섞지 않습니다.** 1차 지시서가
--   "기존 창업 · 폐업 관련 데이터를 새로운 사업에 활용하지 않는다" 고
--   적었고, 섞으면 **골프올인원이 하지 않은 거래가 골프올인원의 실적**이
--   됩니다 — 사는 쪽에서 보면 그게 가장 큰 거짓말입니다.
--   같은 표(`request` · `deal` · `quote`)에 옛 자료가 **그대로 남아
--   있습니다** (지우지 않는 것이 맞습니다 — 손님 기록입니다). 그래서
--   세는 자리마다 `request.side = 'golf'` 로 좁힙니다.
--   ⚠️ 활동 회원도 같습니다 — **골프 요청을 한 적이 있는 회원**만 셉니다.
--     앞 사업만 쓰신 분이 골프의 MAU 로 잡히면 안 됩니다.
--
-- ⚠️ 운영자만 부릅니다. 지표에는 손님 성함 · 연락처가 없지만, 거래액과
--   수수료는 **밖에 나가면 안 되는 숫자**입니다.
-- ════════════════════════════════════════════════════════════════════
begin;

-- ⚠️ 달 경계를 **한 함수**에 둡니다 — 여기저기 적으면 한쪽만 고쳐서
--   어떤 지표는 UTC 로, 어떤 지표는 KST 로 잘리는 날이 옵니다.
create or replace function kst_month(t timestamptz) returns text
  language sql immutable set search_path = public as $$
  select to_char(date_trunc('month', t at time zone 'Asia/Seoul'), 'YYYY-MM')
$$;

create or replace function kst_month(d date) returns text
  language sql immutable set search_path = public as $$
  select to_char(date_trunc('month', d::timestamp), 'YYYY-MM')
$$;

-- ════════════════════════════════════════════════════════════════════
-- 지표 — 달마다 한 줄
--
-- 인자는 `jsonb` 하나입니다 (⚠️ 자리가 어긋나면 엉뚱한 값이 엉뚱한
-- 칸에 들어갑니다 — 0027 · 0029 와 같은 규칙).
--     { "from": "2026-01", "to": "2026-12" }
-- 안 주시면 **이달까지 열두 달**입니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function biz_metrics(p jsonb default '{}'::jsonb)
  returns jsonb language plpgsql stable security definer
  set search_path = public as $$
declare
  v_to    text := nullif(btrim(coalesce(p->>'to', '')), '');
  v_from  text := nullif(btrim(coalesce(p->>'from', '')), '');
  d_to    date;
  d_from  date;
  v_rows  jsonb;
begin
  if my_role() not in ('staff','admin') then
    raise exception '지표는 직원 · 관리자만 볼 수 있습니다';
  end if;

  -- ⚠️ 오늘도 **한국 시각**입니다.
  d_to := date_trunc('month',
            coalesce(to_date(v_to, 'YYYY-MM'),
                     (now() at time zone 'Asia/Seoul')::date))::date;
  d_from := date_trunc('month',
              coalesce(to_date(v_from, 'YYYY-MM'),
                       d_to - interval '11 months'))::date;
  if d_from > d_to then
    raise exception '시작 달이 끝 달보다 뒤입니다';
  end if;
  -- ⚠️ 너무 넓게 열어 두면 한 번에 수십 년을 셉니다 — 다섯 해까지.
  if d_to > d_from + interval '5 years' then
    raise exception '한 번에 다섯 해까지만 셀 수 있습니다';
  end if;

  with
  months as (
    select to_char(m, 'YYYY-MM') as ym
      from generate_series(d_from, d_to, interval '1 month') as g(m)
  ),
  -- 검사용 업체에만 넘어간 요청 — ⚠️ **빼되 세어 둡니다**
  req_test as (
    select r.id
      from request r
     where exists (select 1 from assignment a join provider p on p.id = a.provider_id
                    where a.request_id = r.id and p.is_test)
       and not exists (select 1 from assignment a join provider p on p.id = a.provider_id
                        where a.request_id = r.id and not p.is_test)
  ),
  req as (
    select kst_month(r.created_at) as ym,
           count(*) filter (where t.id is null) as req,
           count(*) filter (where t.id is not null) as req_test
      from request r left join req_test t on t.id = r.id
     where r.side = 'golf'
     group by 1
  ),
  -- ⚠️ 배정 · 수락은 **배정 줄**이 아니라 **요청** 단위로 셉니다.
  --   한 요청을 업체 셋에 넘겼다고 유효 상담이 셋이 되면 안 됩니다.
  asg as (
    select kst_month(r.created_at) as ym,
           count(distinct a.request_id) as assigned,
           count(distinct a.request_id) filter (where a.state = 'accepted') as accepted
      from assignment a
      join provider p on p.id = a.provider_id and not p.is_test
      join request  r on r.id = a.request_id and r.side = 'golf'
     group by 1
  ),
  -- ⚠️ 거둔 견적도 셉니다 — "업체가 금액을 적어 냈다" 는 사실은 남습니다.
  qt as (
    select kst_month(r.created_at) as ym,
           count(distinct q.request_id) as quoted
      from quote q
      join provider p on p.id = q.provider_id and not p.is_test
      join request  r on r.id = q.request_id and r.side = 'golf'
     group by 1
  ),
  -- 계약 — ⚠️ **계약일 기준**입니다 (요청이 들어온 달이 아닙니다).
  --   ⚠️ 금액이 빈 계약은 거래액에 0 으로 더하지 않고 **따로 셉니다.**
  dl as (
    select kst_month(d.signed_at) as ym,
           count(*) as deals,
           coalesce(sum(d.amount), 0) as gmv,
           count(*) filter (where d.amount is null) as gmv_missing
      from deal d
      join provider p on p.id = d.provider_id and not p.is_test
      join request  r on r.id = d.request_id and r.side = 'golf'
     where d.signed_at is not null
     group by 1
  ),
  fee_set as (
    select kst_month(d.fee_at) as ym, coalesce(sum(d.fee_total), 0) as fee_set
      from deal d
      join provider p on p.id = d.provider_id and not p.is_test
      join request  r on r.id = d.request_id and r.side = 'golf'
     where d.fee_at is not null
     group by 1
  ),
  fee_paid as (
    select kst_month(d.paid_at) as ym, coalesce(sum(d.paid), 0) as fee_paid
      from deal d
      join provider p on p.id = d.provider_id and not p.is_test
      join request  r on r.id = d.request_id and r.side = 'golf'
     where d.paid_at is not null
     group by 1
  ),
  -- 광고 — ⚠️ **집행 시작 달**로 잡습니다. 기간이 여러 달에 걸쳐도
  --   쪼개지 않습니다 (쪼개면 받은 적 없는 돈을 달마다 나눠 적는 셈).
  --   ⚠️ `draft` 는 뺍니다 — 아직 집행이 아닙니다.
  ad as (
    select kst_month(a.starts_on) as ym, coalesce(sum(a.price), 0) as ad
      from ad_run a
      join provider p on p.id = a.provider_id and not p.is_test
     where a.state <> 'draft'
     group by 1
  ),
  -- 멤버십 — 그달에 **살아 있던** 것의 월정액 합
  mship as (
    select m.ym, coalesce(sum(pl.monthly), 0) as mship
      from months m
      join provider_membership pm on true
      join provider p  on p.id = pm.provider_id and not p.is_test
      join membership_plan pl on pl.id = pm.plan_id
     where kst_month(pm.starts_on) <= m.ym
       and (pm.ends_on is null or kst_month(pm.ends_on) >= m.ym)
     group by m.ym
  ),
  -- 활동 회원 — ⚠️⚠️ **일반 회원만** 셉니다.
  --   운영자를 넣으면 **우리가 누른 것이 MAU 가 됩니다.** 업체를 넣으면
  --   손님 수와 업체 수가 한 칸에 섞여, 손님이 늘지 않아도 업체를
  --   모집하면 숫자가 오릅니다 — 둘은 다른 뜻입니다.
  --   ⚠️ `not in ('staff','admin')` 이 아니라 `= 'customer'` 입니다.
  --     역할이 하나 더 생기는 날 조용히 섞이지 않게.
  --   ⚠️⚠️ 그리고 **골프 요청을 한 적이 있는 회원**만입니다 — 앞 사업만
  --     쓰신 분의 기록이 골프의 MAU 로 잡히면 안 됩니다 (머리말 참고).
  golf_user as (
    select distinct user_id from request
     where side = 'golf' and user_id is not null
  ),
  usr as (
    select kst_month(l.at) as ym, count(distinct l.by_user) as users
      from audit_log l
      join account ac on ac.id = l.by_user
      join golf_user g on g.user_id = l.by_user
     where l.by_user is not null
       and ac.role = 'customer'
     group by 1
  )
  select jsonb_agg(x order by x->>'month')
    into v_rows
    from (
      select jsonb_build_object(
        'month',       m.ym,
        'req',         coalesce(req.req, 0),
        'req_test',    coalesce(req.req_test, 0),
        'assigned',    coalesce(asg.assigned, 0),
        'accepted',    coalesce(asg.accepted, 0),
        -- ⚠️⚠️ **분모가 0 이면 비율을 내지 않습니다** ("0%" 는 비율이
        --   아닙니다). null 로 내고 화면이 "—" 를 찍습니다.
        'rate_valid',  case when coalesce(req.req, 0) = 0 then null
                            else round(coalesce(asg.accepted, 0) * 100.0
                                       / req.req, 1) end,
        'quoted',      coalesce(qt.quoted, 0),
        'deals',       coalesce(dl.deals, 0),
        'gmv',         coalesce(dl.gmv, 0),
        'gmv_missing', coalesce(dl.gmv_missing, 0),
        'fee_paid',    coalesce(fee_paid.fee_paid, 0),
        'fee_set',     coalesce(fee_set.fee_set, 0),
        -- ⚠️ 음수가 나올 수 있습니다 (지난달 확정분이 이달에 입금).
        --   0 으로 깎지 않습니다 — 깎으면 그 돈이 어디로 갔는지 사라집니다.
        'fee_due',     coalesce(fee_set.fee_set, 0) - coalesce(fee_paid.fee_paid, 0),
        'ad',          coalesce(ad.ad, 0),
        'mship',       coalesce(mship.mship, 0),
        'users',       coalesce(usr.users, 0)
      ) as x
      from months m
      left join req      on req.ym      = m.ym
      left join asg      on asg.ym      = m.ym
      left join qt       on qt.ym       = m.ym
      left join dl       on dl.ym       = m.ym
      left join fee_set  on fee_set.ym  = m.ym
      left join fee_paid on fee_paid.ym = m.ym
      left join ad       on ad.ym       = m.ym
      left join mship    on mship.ym    = m.ym
      left join usr      on usr.ym      = m.ym
    ) t;

  return jsonb_build_object(
    'from',   to_char(d_from, 'YYYY-MM'),
    'to',     to_char(d_to,   'YYYY-MM'),
    'months', coalesce(v_rows, '[]'::jsonb),
    -- ⚠️⚠️ **못 재는 것을 같이 내놓습니다.** 화면이 이것을 그대로
    --   찍어서, 숫자를 보는 사람이 **무엇이 빠졌는지** 같이 읽습니다.
    'cannot', jsonb_build_array(
      '방문자 기준 MAU — 방문을 세는 장치가 없습니다. ' ||
      '붙이시는 날 개인정보 처리방침에 수탁자를 같은 날 적어야 합니다.',
      '광고 · 멤버십의 입금 — 청구 · 입금 기록을 두는 표가 아직 없습니다. ' ||
      '금액은 적어 둔 값이고 받은 돈이 아닙니다.',
      '재방문 · 이탈 — 같은 사람이 다시 왔는지 알 길이 없습니다 (로그인 전 접수).'
    )
  );
end $$;

revoke all on function biz_metrics(jsonb) from public;
grant execute on function biz_metrics(jsonb) to authenticated;

insert into schema_version (n, name) values (33, '0033_biz_metrics')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0034_appointment.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0034 — 상담 예약 · 일정 (2차 지시서 §7)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️ **왜 필요한가.** 지금은 업체가 수락하고 "상담 중" 으로 넘기면
--   그 뒤가 **전화기 안에만** 있습니다. 손님은 언제 만나기로 했는지
--   화면에서 볼 길이 없고, 운영자는 그 건이 살아 있는지 모릅니다.
--
-- ⚠️⚠️ **알림을 보내지 않습니다.** 문자 · 카톡을 붙이지 않았으므로
--   "예약하면 알려 드립니다" 라고 **말하지 않습니다** (절대 규칙 5).
--   여기가 하는 일은 **적어 두고 서로 같은 것을 보는 것**까지입니다.
--   ⚠️ 알림을 붙이시는 날은 정보통신망법 제50조입니다 — (광고) 표기가
--   아니라 거래 안내라도 **보내는 사람 · 수신거부**는 적어야 하고,
--   발송사를 쓰면 방침에 수탁자를 **같은 날** 적어야 합니다 (제26조).
--
-- ⚠️⚠️ **잡는 사람은 업체입니다** (손님이 아니라). 업체의 일정은
--   업체가 압니다 — 손님이 아무 때나 잡게 두면 업체가 못 가는 시각이
--   잡히고, 그건 플랫폼이 한 약속이 됩니다. 손님은 **보고 · 거절**
--   합니다 (거절은 상태로 남습니다).
--
-- ⚠️ 한 요청에 **업체마다 하나**입니다. 여러 줄을 쌓으면 "어느 것이
--   지금 약속인가" 가 갈립니다 — 바꾸면 그 줄을 덮어쓰고, 바꾼 기록은
--   `audit_log` 에 남습니다 (문이 하나라서).
--
-- ⚠️⚠️ **시각은 timestamptz 입니다.** 날짜만 적으면 "11월 5일 몇 시" 가
--   사라집니다. ⚠️ 보여 줄 때는 **한국 시각**으로 봅니다 — Supabase 는
--   UTC 라 그냥 찍으면 아홉 시간 어긋납니다.
-- ════════════════════════════════════════════════════════════════════
begin;

create table if not exists appointment (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references request(id) on delete cascade,
  provider_id text not null references provider(id) on delete cascade,
  at          timestamptz not null,
  -- 어디서 만나나 — ⚠️ 글자가 아니라 **정해진 셋**입니다
  --   js/data/deal.js 의 AM_APPT_KIND 와 같아야 하고, 빌드가 맞춰 봅니다.
  kind        text not null default 'visit'
              check (kind in ('visit','call','online')),
  place       text,                       -- 매장 주소 · 연습장 이름 등
  note        text,
  -- set 잡힘 · done 만났음 · cancel 취소
  state       text not null default 'set'
              check (state in ('set','done','cancel')),
  why         text,                       -- 취소 · 변경 사유
  by_user     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (request_id, provider_id),
  constraint appt_place_len check (place is null or length(place) <= 200),
  constraint appt_note_len  check (note  is null or length(note)  <= 1000)
);
create index if not exists appt_at_idx on appointment (at desc);

alter table appointment enable row level security;

-- ── 누가 보는가 ─────────────────────────────────────────────────────
-- ⚠️⚠️ 정책 안에서 `request` 를 바로 읽으면 무한 재귀입니다 (0005 ·
--   0008 · 0011 에서 겪은 자리) — `is_my_request()` 로 끊습니다.
drop policy if exists appt_mine on appointment;
create policy appt_mine on appointment for select
  using (is_my_request(request_id));

drop policy if exists appt_provider on appointment;
create policy appt_provider on appointment for select
  using (provider_id = my_provider());

drop policy if exists appt_staff on appointment;
create policy appt_staff on appointment for select
  using (my_role() in ('staff','admin'));

-- ⚠️⚠️ **쓰기 정책을 일부러 만들지 않았습니다.** RLS 는 정책이 없으면
--   막습니다 — 쓰는 길은 아래 문 둘뿐입니다 (0008 과 같은 규칙).
grant select on appointment to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ① 업체가 일정을 잡습니다 · 고칩니다
--
-- ⚠️⚠️ **배정을 수락한 업체만**입니다. `submit_quote`(0008)와 **같은
--   말로** 거절하면 어느 자물쇠인지 알 수 없으니, 거절하는 글을
--   그 자리에 맞게 적습니다.
-- ⚠️ 상태를 여기서 바꾸지 않습니다 — 상태의 문은 `move_state()` 하나
--   입니다 (0004). 일정은 상담의 **부속**이지 상태가 아닙니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function set_appointment(p jsonb)
  returns uuid language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_pv   text := my_provider();
  v_req  uuid;
  v_as   text;
  v_st   deal_state;
  v_at   timestamptz;
  v_kind text := coalesce(nullif(btrim(p->>'kind'), ''), 'visit');
  v_id   uuid;
  v_was  text;
begin
  if v_me is null then
    raise exception '변경자를 알 수 없습니다 — 로그인한 세션에서만 됩니다';
  end if;
  if my_role() <> 'provider' or v_pv is null then
    raise exception '일정은 배정받은 업체가 잡습니다';
  end if;

  v_req := nullif(btrim(coalesce(p->>'request', '')), '')::uuid;
  if v_req is null then raise exception '어느 요청인지 적어 주세요'; end if;

  select state into v_st from request where id = v_req;
  if v_st is null then raise exception '없는 신청입니다'; end if;

  select state into v_as from assignment
   where request_id = v_req and provider_id = v_pv;
  if v_as is null then raise exception '이 신청에 배정되지 않았습니다'; end if;
  if v_as <> 'accepted' then raise exception '배정을 먼저 수락해 주세요'; end if;

  -- ⚠️⚠️ 끝난 건에는 안 잡습니다. 진행 안 함 · 보류에 일정이 붙으면
  --   손님 화면에 **살아 있는 약속**처럼 보입니다.
  if v_st in ('lost','hold') then
    raise exception '지금 상태(%)에서는 일정을 잡을 수 없습니다', v_st;
  end if;

  begin
    v_at := (p->>'at')::timestamptz;
  exception when others then
    raise exception '만나실 때를 다시 확인해 주세요';
  end;
  if v_at is null then raise exception '언제 만나실지 적어 주세요'; end if;
  -- ⚠️⚠️ **경계값.** 어제로 잡는 것은 오타입니다 (2025년으로 찍히는
  --   사고가 여기서 납니다). 하루 전까지는 봐줍니다 — 어젯밤 통화로
  --   정한 오늘 아침 약속을 오늘 적는 일이 있습니다.
  if v_at < now() - interval '1 day' then
    raise exception '지난 때로는 잡을 수 없습니다 — 날짜를 다시 봐 주세요';
  end if;
  -- ⚠️ 너무 넓게 막는 것도 고장입니다. 두 해 뒤까지는 둡니다.
  if v_at > now() + interval '2 years' then
    raise exception '너무 먼 때입니다 — 날짜를 다시 봐 주세요';
  end if;
  if v_kind not in ('visit','call','online') then
    raise exception '만나는 방법을 방문 · 통화 · 비대면 중에서 골라 주세요';
  end if;

  select state into v_was from appointment
   where request_id = v_req and provider_id = v_pv;

  insert into appointment (request_id, provider_id, at, kind, place, note,
                           state, by_user, updated_at)
  values (v_req, v_pv, v_at, v_kind,
          nullif(btrim(coalesce(p->>'place', '')), ''),
          nullif(btrim(coalesce(p->>'note', '')), ''),
          'set', v_me, now())
  on conflict (request_id, provider_id) do update
    set at = excluded.at, kind = excluded.kind, place = excluded.place,
        note = excluded.note, state = 'set', why = null,
        by_user = v_me, updated_at = now()
  returning id into v_id;

  -- ⚠️ 감사 기록에 **성함 · 연락처를 넣지 않습니다** — 요청 id 로
  --   찾아갑니다. ⚠️ `place` 도 안 넣습니다 (가게 주소입니다).
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, data)
  values (v_me, 'provider', 'appointment', v_id::text,
          coalesce(v_was, 'none'), 'set',
          jsonb_build_object('kind', v_kind, 'request_id', v_req));
  return v_id;
end $$;


-- ════════════════════════════════════════════════════════════════════
-- ② 취소 · 만났음
--
-- ⚠️⚠️ **손님도 취소할 수 있습니다.** 못 가게 된 것을 말할 길이 없으면
--   업체가 헛걸음합니다. 다만 "만났음" 은 **업체만** 적습니다 —
--   만난 사실은 업체가 압니다.
-- ⚠️ 지우지 않습니다. 잡았다가 취소한 것도 기록입니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function move_appointment(p jsonb)
  returns void language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_pv   text := my_provider();
  v_role app_role := my_role();
  v_id   uuid;
  v_to   text := nullif(btrim(coalesce(p->>'to', '')), '');
  v_why  text := nullif(btrim(coalesce(p->>'why', '')), '');
  r      appointment%rowtype;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  v_id := nullif(btrim(coalesce(p->>'id', '')), '')::uuid;
  if v_id is null then raise exception '어느 일정인지 적어 주세요'; end if;
  if v_to not in ('done','cancel') then
    raise exception '일정은 만났음 · 취소로만 옮깁니다';
  end if;

  select * into r from appointment where id = v_id;
  if not found then raise exception '그런 일정이 없습니다'; end if;

  -- ⚠️⚠️ **누가 무엇을 할 수 있나** — 자물쇠마다 **다른 말**로 거절합니다.
  if v_to = 'done' then
    if r.provider_id is distinct from v_pv then
      raise exception '만났음은 그 업체만 적을 수 있습니다';
    end if;
  else
    -- ⚠️⚠️⚠️ **`coalesce` 를 빼면 자물쇠가 통째로 열립니다.** SQL 은
    --   참 · 거짓 말고 **NULL** 이 있습니다. 업체가 아닌 사람은
    --   `my_provider()` 가 NULL 이라 `r.provider_id = v_pv` 가 **NULL**
    --   이고, `not (NULL or false or false)` 는 NULL 입니다 —
    --   `if NULL then` 은 **안 걸립니다.** 즉 남의 일정을 id 만 알면
    --   누구나 취소할 수 있었습니다 (검사가 잡았습니다).
    --   ⚠️ 비교가 NULL 을 낼 수 있는 자리는 **전부** coalesce 로 땅에
    --   내려놓으세요.
    if not (coalesce(r.provider_id = v_pv, false)
            or coalesce(is_my_request(r.request_id), false)
            or coalesce(v_role in ('staff','admin'), false)) then
      raise exception '이 일정을 취소할 수 없습니다';
    end if;
    -- ⚠️ 취소에는 **까닭을 받습니다** — 헛걸음한 쪽이 알아야 합니다.
    if v_why is null then raise exception '취소하시는 까닭을 적어 주세요'; end if;
  end if;

  if r.state = v_to then
    raise exception '이미 %입니다', case when v_to = 'done' then '만났음' else '취소' end;
  end if;

  update appointment set state = v_to, why = v_why, by_user = v_me, updated_at = now()
   where id = v_id;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, v_role, 'appointment', v_id::text, r.state, v_to, v_why,
          jsonb_build_object('request_id', r.request_id));
end $$;

revoke all on function set_appointment(jsonb)  from public;
revoke all on function move_appointment(jsonb) from public;
grant execute on function set_appointment(jsonb)  to authenticated;
grant execute on function move_appointment(jsonb) to authenticated;

insert into schema_version (n, name) values (34, '0034_appointment')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0035_want_provider.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0035 — 업체 화면에서 **상담으로 가는 길** (2차 지시서 §5)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️ **업체 상세 화면에 길이 없었습니다.** 손님이 업체를 보고
--   "여기 맡기고 싶다" 고 생각해도 누를 것이 없어서, 화면이 "아직
--   상담 연결을 받지 못합니다" 라고만 말하고 있었습니다 (단추를 미리
--   두지 않은 것은 맞습니다 — 절대 규칙 5). 이제 견적 흐름이 섰으니
--   그 길을 엽니다.
--
-- ⚠️⚠️⚠️ **"이 업체에 바로 간다" 고 말하면 안 됩니다.** 배정은 운영자가
--   하고, 넘기는 순간 **상호를 알리고 제3자 제공 동의를 다시** 받습니다
--   (개인정보보호법 제17조 제2항 · 0004 · 0029). 손님이 적어 주시는
--   것은 **바람**이고, 그 바람을 운영자가 봅니다. 화면도 그렇게 적습니다 —
--   "이 업체를 보고 요청하십니다. 운영자가 확인한 뒤 전달합니다."
--
-- ⚠️ 그래서 칸 이름이 `want_provider` 입니다 (`provider_id` 가 아니라).
--   이름이 곧 뜻입니다 — `assigned_provider` 로 지으면 다음 사람이
--   배정된 것으로 읽습니다.
--
-- ⚠️⚠️ **`make_request()` 를 다시 씁니다** (0029 → **0035**).
--   0029 를 다시 붙여 넣으면 이 파일이 한 일이 **조용히 내려갑니다** —
--   에러가 안 납니다. 내려갔는지는 이렇게 봅니다:
--     select prosrc like '%want_provider%' from pg_proc where proname='make_request';
--   false 면 0029 판입니다. 이 파일을 다시 올리세요.
--
-- ⚠️ 없는 업체 id 가 와도 **요청을 거절하지 않습니다.** 링크가 묵었거나
--   업체가 빠졌을 수 있는데, 그 때문에 손님의 요청이 통째로 막히면
--   안 됩니다 — 칸을 비우고 **비웠다는 사실을 감사 기록에** 남깁니다
--   (조용히 사라지지 않게).
-- ════════════════════════════════════════════════════════════════════
begin;

alter table request
  add column if not exists want_provider text references provider(id) on delete set null;

comment on column request.want_provider is
  '손님이 업체 화면에서 보고 적어 주신 **바람**입니다. 배정이 아닙니다 — '
  '배정은 운영자가 하고 그때 제3자 제공 동의를 다시 받습니다 (0035).';

create index if not exists request_want_idx
  on request (want_provider) where want_provider is not null;

-- ⚠️ 운영자가 배정 화면에서 봅니다 (0001 의 request_staff 가 이미 읽기를
--   허락하므로 정책은 그대로입니다).

create or replace function make_request(p jsonb)
  returns text language plpgsql security definer set search_path = public as $$
declare
  v_name  text := btrim(coalesce(p->>'name', ''));
  v_tel   text := btrim(coalesce(p->>'tel', ''));
  v_email text := nullif(btrim(coalesce(p->>'email', '')), '');
  v_region text := nullif(btrim(coalesce(p->>'region', '')), '');
  v_gu    text := nullif(btrim(coalesce(p->>'gu', '')), '');
  v_want  text := nullif(btrim(coalesce(p->>'want_at', '')), '');
  v_body  text := nullif(btrim(coalesce(p->>'body', '')), '');
  v_idem  text := nullif(btrim(coalesce(p->>'idem', '')), '');
  v_bmin  bigint := nullif(p->>'budget_min', '')::bigint;
  v_bmax  bigint := nullif(p->>'budget_max', '')::bigint;
  -- ⚠️ 0035 — 손님이 보고 오신 업체 (바람이지 배정이 아닙니다)
  v_wpv   text := nullif(btrim(coalesce(p->>'wantProvider', '')), '');
  v_wpv_ok text;
  v_svc   text[] := coalesce(
             (select array_agg(distinct btrim(x)) from jsonb_array_elements_text(
                case when jsonb_typeof(p->'services') = 'array'
                     then p->'services' else '[]'::jsonb end) as t(x)
              where btrim(x) <> ''), '{}'::text[]);
  v_digits text;
  v_no     text;
  v_id     uuid;
  v_try    int := 0;
  v_abc    text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  v_raw    text;
  k        text;
begin
  -- ⚠️ 자물쇠마다 **다른 말**로 거절합니다.
  if v_name = '' then raise exception '성함을 적어 주세요'; end if;
  if v_tel  = '' then raise exception '연락처를 적어 주세요'; end if;
  if length(v_name) > 40 then raise exception '성함이 너무 깁니다'; end if;
  if v_body is not null and length(v_body) > 2000 then
    raise exception '남기신 말씀이 너무 깁니다';
  end if;

  v_digits := regexp_replace(v_tel, '[^0-9]', '', 'g');
  -- ⚠️ 경계값: 9자리(02-xxx-xxxx)부터 11자리(010-xxxx-xxxx)까지입니다.
  if length(v_digits) < 9 or length(v_digits) > 11 then
    raise exception '연락처를 다시 봐 주세요 — 숫자 아홉에서 열한 자리입니다';
  end if;

  if array_length(v_svc, 1) is null then
    raise exception '원하시는 서비스를 하나 이상 골라 주세요';
  end if;
  if array_length(v_svc, 1) > 10 then
    raise exception '고르신 서비스가 너무 많습니다 — 열 개까지입니다';
  end if;

  -- ⚠️ 예산은 **0 도 값입니다** (무료 상담). 음수와 뒤집힌 것만 막습니다.
  if v_bmin is not null and v_bmin < 0 then raise exception '예산은 0 보다 작을 수 없습니다'; end if;
  if v_bmax is not null and v_bmax < 0 then raise exception '예산은 0 보다 작을 수 없습니다'; end if;
  if v_bmin is not null and v_bmax is not null and v_bmin > v_bmax then
    raise exception '예산의 아래가 위보다 큽니다';
  end if;

  if (p->>'agree_at') is null then
    raise exception '수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes' then
    raise exception '동의 시각이 미래입니다';
  end if;
  if (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의가 오래되었습니다 — 다시 한 번 눌러 주세요';
  end if;

  -- ⚠️⚠️ **같은 요청을 두 번 넣는 것을 두 겹으로 막습니다.**
  --   ① idem — 화면이 한 번 연 동안 하나입니다 (두 번 눌러도 하나)
  --   ② 같은 번호로 10분 안
  if v_idem is not null then
    select id, no into v_id, v_no from request where idem = v_idem;
    if v_id is not null then return v_no; end if;   -- 이미 들어간 것입니다
  end if;
  if exists (
    select 1 from request
     where regexp_replace(tel, '[^0-9]', '', 'g') = v_digits
       and created_at > now() - interval '10 minutes')
  then
    raise exception '방금 같은 번호로 요청이 들어왔습니다 — 잠시 뒤에 다시 해 주세요';
  end if;

  -- ⚠️⚠️ **바라시는 업체가 실제로 있는가.** 없으면 **비우고 넘어갑니다** —
  --   묵은 링크 때문에 손님의 요청이 통째로 막히면 안 됩니다.
  --   ⚠️ 검사용 업체는 안 받습니다 (손님 화면에 나간 적이 없는 업체입니다).
  if v_wpv is not null then
    select id into v_wpv_ok from provider
     where id = v_wpv and listed = true and is_test = false;
  end if;

  -- 번호 — 겹치면 다시 뽑습니다 (스무 번까지)
  loop
    v_try := v_try + 1;
    v_raw := '';
    for i in 1..8 loop
      v_raw := v_raw || substr(v_abc, 1 + floor(random() * length(v_abc))::int, 1);
    end loop;
    v_no := 'SW-' || substring(v_raw from 1 for 4) || '-' || substring(v_raw from 5 for 4);
    exit when not exists (select 1 from request where no = v_no);
    if v_try > 20 then raise exception '신청번호를 만들지 못했습니다'; end if;
  end loop;

  insert into request (no, user_id, side, cat, region, gu,
                       budget_min, budget_max, want_at, body,
                       name, tel, email, agree_at, idem, want_provider)
  values (v_no, auth.uid(), 'golf',
          -- ⚠️ 분류는 **첫 서비스가 속한 분류**를 화면이 적어 보냅니다.
          nullif(btrim(coalesce(p->>'cat', '')), ''),
          v_region, v_gu, v_bmin, v_bmax, v_want, v_body,
          v_name, v_tel, v_email, (p->>'agree_at')::timestamptz, v_idem, v_wpv_ok)
  returning id into v_id;

  foreach k in array v_svc loop
    insert into request_item (request_id, service_id)
    values (v_id, k)
    on conflict (request_id, service_id) do nothing;
  end loop;

  -- ⚠️ 감사 기록에 **성함 · 연락처를 넣지 않습니다.** 신청번호로 찾아갑니다.
  -- ⚠️⚠️ 바라시는 업체를 **비운 경우 그 사실을 남깁니다** — 조용히
  --   사라지면 "왜 그 업체로 안 갔나" 를 아무도 못 댑니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (auth.uid(), my_role(), 'request', v_no, 'new', '매칭 요청 접수',
          jsonb_build_object('services', v_svc, 'region', v_region,
                             'cat', nullif(btrim(coalesce(p->>'cat', '')), ''),
                             'wantProvider', v_wpv_ok,
                             'wantProviderDropped',
                             (v_wpv is not null and v_wpv_ok is null)));

  return v_no;
end $$;

revoke all on function make_request(jsonb) from public;
grant execute on function make_request(jsonb) to anon, authenticated;

insert into schema_version (n, name) values (35, '0035_want_provider')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0036_ad_membership_doors.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0036 — 광고 집행과 업체 멤버십을 **넣는 문** (2차 지시서 §7)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️ **문이 없어서 관리 화면을 세울 수 없었습니다.** 0026 이 표
--   셋(`ad_run` · `membership_plan` · `provider_membership`)을 만들고
--   문을 **둘만** 열었습니다 —
--     set_ad_state  이미 있는 광고의 상태를 바꿉니다
--     save_plan     요금제를 만들고 고칩니다
--   **광고를 처음 넣는 문**과 **업체에 요금제를 다는 문**이 없습니다.
--   표는 `revoke all` 이라 화면에서 아무것도 못 넣습니다 (그게 맞습니다 —
--   표를 열면 기록 없이 지나가는 길이 하나 생깁니다).
--
-- ⚠️ 그래서 쓰는 길을 **문으로** 엽니다 (0007 · 0026 과 같은 규칙) —
--   관리자만 · 까닭을 받고 · 감사 기록과 **한 트랜잭션**입니다.
--
-- ⚠️⚠️ **돈이 오갔다고 말하지 않습니다.** `ad_run.price` 와 요금제의
--   `monthly` 는 **적어 둔 금액**이고 청구 · 입금 기록이 아닙니다
--   (0033 의 매각 지표가 그렇게 갈라 놓았습니다). 이 문도 입금을
--   만들지 않습니다 — 만들면 받은 적 없는 돈이 장부에 생깁니다.
--
-- ⚠️ 검사용 업체(0030)에도 광고 · 멤버십을 달 수 있습니다. 눌러 봐야
--   하기 때문입니다 — 대신 **보기(view)가 걸러서** 손님에게는 안
--   나갑니다 (0032 의 v_ad_live) 그리고 지표도 뺍니다 (0033).
-- ════════════════════════════════════════════════════════════════════
begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 광고 집행을 넣습니다 · 고칩니다
--
-- ⚠️ 자리마다 **무엇을 더 적어야 하는지**가 다릅니다 — 그 규칙은
--   0026 의 `ad_run_where` 가 들고 있습니다. 여기서 또 적지 않습니다
--   (두 곳에 적으면 어긋나는 날이 옵니다).
-- ⚠️⚠️ **상태를 여기서 바꾸지 않습니다.** 상태의 문은 `set_ad_state`
--   하나입니다 (0026) — 새로 넣는 것은 늘 `draft` 입니다.
--   그래야 "넣자마자 손님 화면에 떴다" 가 없습니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function save_ad(p jsonb)
  returns uuid language plpgsql security definer
  set search_path = public as $$
declare
  v_me  uuid := auth.uid();
  v_id  uuid := nullif(btrim(coalesce(p->>'id', '')), '')::uuid;
  v_pv  text := nullif(btrim(coalesce(p->>'provider', '')), '');
  v_pl  text := nullif(btrim(coalesce(p->>'place', '')), '');
  v_why text := nullif(btrim(coalesce(p->>'why', '')), '');
  v_price bigint;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if my_role() <> 'admin' then
    raise exception '광고 집행은 관리자만 넣습니다';
  end if;
  if v_why is null then
    raise exception '까닭을 적어야 합니다 — 감사 기록에 남습니다';
  end if;
  if v_pv is null then raise exception '어느 업체인지 골라 주세요'; end if;
  if not exists (select 1 from provider where id = v_pv) then
    raise exception '없는 업체입니다 — %', v_pv;
  end if;
  if v_pl is null then raise exception '어느 자리인지 골라 주세요'; end if;

  -- ⚠️⚠️ **사람 말로 거절합니다.** 그냥 형변환에 맡기면
  --   `invalid input value for enum ad_place: "x"` 가 그대로 화면에
  --   갑니다 (0008 에서 겪은 자리).
  if v_pl not in ('main_hero','main_band','cat_top','region') then
    raise exception '광고 자리를 메인 히어로 · 메인 띠 · 분류 상단 · 지역 중에서 골라 주세요';
  end if;
  begin
    v_price := (p->>'price')::bigint;
  exception when others then
    raise exception '광고 금액을 숫자로 적어 주세요';
  end;
  -- ⚠️ 0 원도 됩니다 (무상 노출) — 안 적은 것만 막습니다.
  if p->'price' is null or jsonb_typeof(p->'price') = 'null' then
    raise exception '광고 금액을 적어 주세요 (무상이면 0)';
  end if;

  if v_id is null then
    insert into ad_run (provider_id, place, cat_key, region,
                        starts_on, ends_on, price, state, note, by_user)
    values (v_pv, v_pl::ad_place,
            nullif(btrim(coalesce(p->>'cat_key', '')), ''),
            nullif(btrim(coalesce(p->>'region', '')), ''),
            (p->>'starts_on')::date, (p->>'ends_on')::date,
            v_price, 'draft', nullif(btrim(coalesce(p->>'note', '')), ''), v_me)
    returning id into v_id;
  else
    -- ⚠️⚠️ **상태는 안 건드립니다** (set_ad_state 가 그 문입니다).
    update ad_run set provider_id = v_pv, place = v_pl::ad_place,
           cat_key = nullif(btrim(coalesce(p->>'cat_key', '')), ''),
           region  = nullif(btrim(coalesce(p->>'region', '')), ''),
           starts_on = (p->>'starts_on')::date,
           ends_on   = (p->>'ends_on')::date,
           price = v_price,
           note = nullif(btrim(coalesce(p->>'note', '')), ''),
           by_user = v_me
     where id = v_id;
    if not found then raise exception '그런 광고가 없습니다'; end if;
  end if;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, 'admin', 'ad_run', v_id::text, 'draft', v_why,
          jsonb_build_object('provider_id', v_pv, 'place', v_pl, 'price', v_price));
  return v_id;
end $$;


-- ════════════════════════════════════════════════════════════════════
-- ② 업체에 요금제를 답니다 · 뗍니다
--
-- ⚠️⚠️ **청구가 생기지 않습니다.** 요금제를 달아도 돈이 오가는 기록은
--   아무 데도 안 생깁니다 — 매각 지표가 `mship` 을 "청구 기록 없음"
--   으로 내놓는 까닭입니다 (0033). 청구를 만드는 날은 표를 하나 더
--   만들어야 하고, 그때까지 **받은 돈이라고 말하지 않습니다.**
-- ⚠️ 떼는 것은 지우는 것이 아니라 **끝나는 날을 적는 것**입니다 —
--   지우면 "그때 얼마짜리였나" 가 사라집니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function set_membership(p jsonb)
  returns void language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_pv   text := nullif(btrim(coalesce(p->>'provider', '')), '');
  v_plan text := nullif(btrim(coalesce(p->>'plan', '')), '');
  v_from date;
  v_to   date;
  v_why  text := nullif(btrim(coalesce(p->>'why', '')), '');
  v_had  text;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if my_role() <> 'admin' then
    raise exception '멤버십은 관리자만 답니다';
  end if;
  if v_why is null then
    raise exception '까닭을 적어야 합니다 — 감사 기록에 남습니다';
  end if;
  if v_pv is null then raise exception '어느 업체인지 골라 주세요'; end if;
  if not exists (select 1 from provider where id = v_pv) then
    raise exception '없는 업체입니다 — %', v_pv;
  end if;

  begin
    v_from := coalesce(nullif(btrim(coalesce(p->>'starts_on', '')), '')::date,
                       (now() at time zone 'Asia/Seoul')::date);
    v_to   := nullif(btrim(coalesce(p->>'ends_on', '')), '')::date;
  exception when others then
    raise exception '날짜를 다시 확인해 주세요';
  end;
  if v_to is not null and v_to < v_from then
    raise exception '끝나는 날이 시작하는 날보다 빠릅니다';
  end if;

  select plan_id into v_had from provider_membership where provider_id = v_pv;

  -- ⚠️ 떼는 것 — 요금제를 비워 보내면 **끝나는 날**을 적습니다.
  if v_plan is null then
    if v_had is null then raise exception '달려 있는 멤버십이 없습니다'; end if;
    update provider_membership
       set ends_on = coalesce(v_to, (now() at time zone 'Asia/Seoul')::date),
           by_user = v_me, at = now()
     where provider_id = v_pv;
  else
    if not exists (select 1 from membership_plan where id = v_plan) then
      raise exception '없는 요금제입니다 — %', v_plan;
    end if;
    insert into provider_membership (provider_id, plan_id, starts_on, ends_on, by_user)
    values (v_pv, v_plan, v_from, v_to, v_me)
    on conflict (provider_id) do update
      set plan_id = excluded.plan_id, starts_on = excluded.starts_on,
          ends_on = excluded.ends_on, by_user = v_me, at = now();
  end if;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, 'admin', 'provider_membership', v_pv,
          coalesce(v_had, 'none'), coalesce(v_plan, '뗌'), v_why,
          jsonb_build_object('starts_on', v_from, 'ends_on', v_to));
end $$;

revoke all on function save_ad(jsonb)        from public;
revoke all on function set_membership(jsonb) from public;
grant execute on function save_ad(jsonb)        to authenticated;
grant execute on function set_membership(jsonb) to authenticated;

insert into schema_version (n, name) values (36, '0036_ad_membership_doors')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0037_review.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0037 — 후기 · 평점
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **평점을 칸에 저장하지 않습니다.** provider 표에 평점 칸이
--   없는 것은 0001 머리말이 일부러 적어 둔 것입니다 — 칸으로 두면
--   누군가 거기에 4.9 를 적어 넣고, 그 순간 지어낸 신뢰입니다
--   (절대 규칙 1 · 표시광고법 제3조). 평균과 건수는 **후기 줄에서
--   그때그때 셉니다.** 이 파일에도 집계 칸 · 집계 표가 없습니다.
--
-- ⚠️⚠️ **아무나 쓰면 후기가 아닙니다.** 상호만 알면 쓸 수 있게 두면
--   경쟁사가 별 하나를 깔고, 업체가 제 식구로 별 다섯을 깝니다. 그래서
--   **우리 DB 로 확인되는 두 가지** 중 하나가 있어야 엽니다 —
--     ① 그 업체의 견적을 **고르셨다** (quote.state = chosen)
--     ② 그 업체와 **만나셨다** (appointment.state = done)
--   둘 다 손님이 혼자 만들 수 없는 값입니다.
--   ⚠️ "상담만 받았는데 별로였다" 도 참말이지만, 우리는 그것을 확인할
--   길이 없습니다. 확인 못 하는 것을 받아 공개하면 그 글의 책임이
--   플랫폼으로 옵니다.
--
-- ⚠️⚠️ **한 요청 × 한 업체 = 한 줄입니다.** 여러 줄을 쌓게 두면 같은
--   분이 별 다섯을 열 번 적어 평균을 만듭니다. 고치는 것은 됩니다
--   (덮어씁니다) — 고친 기록은 audit_log 에 남습니다.
--
-- ⚠️⚠️ **작성자 성함을 공개 보기에 담지 않습니다.** 성 한 글자와
--   별표로 **그 자리에서 계산**합니다 (개인정보 보호법 제3조 제6항 —
--   익명 처리). 마스킹한 값을 칸에 저장하지 않습니다: 저장하면
--   원본과 어긋나는 날이 오고, 어느 쪽이 참인지 알 수 없습니다.
--
-- ⚠️⚠️ **지우는 길이 없습니다.** 운영자는 **가립니다**(hidden_at) —
--   지우면 업체가 "없는 말을 지웠다" 고 다툴 때 아무 기록이 없습니다.
--   가린 까닭은 반드시 받습니다.
--
-- ⚠️⚠️ **보기(view)는 RLS 를 지나지 않습니다** (0032 에서 겪은 자리).
--   그러니 v_review_public 의 where 절이 **자물쇠 그 자체**입니다 —
--   가린 후기 · 검사용 업체 · 공개 안 한 업체를 거기서 거릅니다.
--
-- ⚠️ 알림을 보내지 않습니다 — "후기가 달리면 알려 드립니다" 라고
--   **말하지 않습니다** (절대 규칙 5). 업체는 자기 작업실에서 봅니다.
-- ════════════════════════════════════════════════════════════════════
begin;

create table if not exists review (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references request(id) on delete cascade,
  provider_id text not null references provider(id) on delete cascade,
  -- ⚠️ 1~5 입니다. 0 과 6 을 막는 것은 check 가 하고, 사람 말로 거절하는
  --   것은 문(write_review)이 합니다 — enum 오류가 손님 화면에 나가면
  --   무엇이 틀렸는지 모릅니다.
  rating      smallint not null check (rating between 1 and 5),
  body        text not null,
  -- 누가 썼나 — ⚠️ 공개 보기에는 **안 나갑니다** (마스킹한 값만).
  --   임자를 가리는 데는 안 씁니다: is_my_request() 가 참입니다
  --   (계정이 지워져도 후기는 그 요청의 것입니다).
  by_user     uuid references auth.users(id) on delete set null,
  -- 업체의 답변 — 한 줄만 둡니다 (주고받는 자리가 아닙니다)
  reply       text,
  reply_at    timestamptz,
  -- 운영자가 가린 것 — ⚠️ 지우지 않습니다
  hidden_at   timestamptz,
  hidden_why  text,
  hidden_by   uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (request_id, provider_id),
  -- ⚠️ 열 글자 미만은 후기가 아닙니다 ("좋아요" 는 아홉 글자가 안 됩니다
  --   — 그래도 열 글자를 받는 까닭은, 한 글자 후기가 평균을 움직이는
  --   것을 막기 위해서입니다). 위는 천 글자입니다.
  constraint rv_body_len  check (char_length(btrim(body)) between 10 and 1000),
  constraint rv_reply_len check (reply is null or char_length(btrim(reply)) between 1 and 1000),
  -- ⚠️⚠️ 가렸으면 까닭이 **반드시** 있습니다. 문에서도 받고 여기서도
  --   봅니다 — 문이 내려가는 날 이 줄이 남습니다.
  constraint rv_hidden_why check (hidden_at is null or btrim(coalesce(hidden_why,'')) <> '')
);
create index if not exists rv_provider_idx on review (provider_id, created_at desc);

alter table review enable row level security;

-- ── 누가 보는가 ─────────────────────────────────────────────────────
-- ⚠️⚠️ 정책 안에서 request 를 바로 읽으면 무한 재귀입니다 (0005 · 0008 ·
--   0011 · 0034 에서 겪은 자리) — is_my_request() 로 끊습니다.
drop policy if exists rv_mine on review;
create policy rv_mine on review for select
  using (is_my_request(request_id));

-- 그 업체는 자기 후기를 봅니다 (가린 것까지 — 답변할 권리가 있습니다)
drop policy if exists rv_provider on review;
create policy rv_provider on review for select
  using (provider_id = my_provider());

drop policy if exists rv_staff on review;
create policy rv_staff on review for select
  using (my_role() in ('staff','admin'));

-- ⚠️⚠️⚠️ **"로그인한 아무나 가리지 않은 후기를 읽는다" 정책을 두지
--   않습니다.** 처음에 그렇게 썼는데, 그러면 로그인한 누구나 **표를
--   바로** 읽을 수 있고 표에는 보기에 없는 칸이 둘 있습니다 —
--   `by_user`(누가 썼는가)와 `request_id`(어느 신청인가). 후기 글은
--   공개지만 **누가 썼는지는 공개가 아닙니다** (개인정보 보호법).
--   공개로 읽는 길은 **아래 보기 하나**이고, 그 보기는 이름을
--   마스킹하고 그 두 칸을 아예 담지 않습니다.
--   ⚠️ 표를 읽는 사람은 셋뿐입니다: 쓴 사람 · 그 업체 · 운영자.

-- ⚠️⚠️ **쓰기 정책을 일부러 만들지 않았습니다.** RLS 는 정책이 없으면
--   막습니다 — 쓰는 길은 아래 문 셋뿐입니다 (0008 · 0034 와 같은 규칙).
grant select on review to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- 공개 보기 — 손님 화면 · tools/pull-reviews.js 가 읽습니다
--
-- ⚠️⚠️⚠️ **이 where 절이 자물쇠입니다.** 보기는 RLS 를 지나지 않습니다
--   (security_invoker 를 안 켰으니 임자 권한으로 돕니다). 0032 의
--   v_ad_live 가 바로 이 자리에서 검사용 업체의 상호를 내보내고
--   있었습니다.
-- ⚠️ request_id 를 담지 않습니다 — 후기와 신청번호를 이어 주면 누가
--   썼는지 좁혀집니다.
-- ⚠️ by_user 를 담지 않습니다. 이름은 **마스킹해서 계산**합니다.
-- ════════════════════════════════════════════════════════════════════
create or replace view v_review_public as
  select r.id, r.provider_id, r.rating, r.body,
         r.created_at, r.updated_at, r.reply, r.reply_at,
         -- 작성자 — 성 한 글자 + 별표. ⚠️ 저장하지 않고 **셉니다**.
         --   이름이 비어 있으면 "회원" 입니다 (별표만 찍으면 고장처럼
         --   보입니다).
         case
           when btrim(coalesce(a.name, '')) = '' then '회원'
           else left(btrim(a.name), 1) ||
                repeat('*', greatest(char_length(btrim(a.name)) - 1, 1))
         end as who
    from review r
    join provider p on p.id = r.provider_id
    left join account a on a.id = r.by_user
   where r.hidden_at is null
     and p.listed = true
     and p.is_test = false;

comment on view v_review_public is
  '손님 화면 · tools/pull-reviews.js 가 읽는 공개 후기. '
  'RLS 를 지나지 않으므로 where 절이 자물쇠입니다 (0037). '
  '평점 평균 · 건수는 담지 않습니다 — 줄에서 계산합니다.';

grant select on v_review_public to anon, authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ① 손님이 후기를 씁니다 · 고칩니다
--
-- ⚠️⚠️ 거절하는 말을 **자물쇠마다 다르게** 적습니다. 같은 말로 거절하면
--   어느 자물쇠가 막았는지 알 수 없고, 검사가 엉뚱한 까닭으로 통과합니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function write_review(p jsonb)
  returns uuid language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_pv   text := my_provider();
  v_req  uuid;
  v_pid  text := nullif(btrim(coalesce(p->>'provider', '')), '');
  v_rate int;
  v_body text := btrim(coalesce(p->>'body', ''));
  v_hid  timestamptz;
  v_was  smallint;
  v_id   uuid;
  v_ok   boolean;
begin
  if v_me is null then
    raise exception '후기는 로그인한 뒤에 쓰실 수 있습니다';
  end if;

  v_req := nullif(btrim(coalesce(p->>'request', '')), '')::uuid;
  if v_req is null then raise exception '어느 요청인지 적어 주세요'; end if;
  if v_pid is null then raise exception '어느 업체인지 적어 주세요'; end if;

  -- ⚠️⚠️ **내 요청인가.** coalesce 로 땅에 내려놓습니다 — NULL 이면
  --   if 가 안 걸려 자물쇠가 통째로 열립니다 (0034 에서 겪은 자리).
  if not coalesce(is_my_request(v_req), false) then
    raise exception '내 요청의 후기만 쓰실 수 있습니다';
  end if;

  -- ⚠️⚠️ **자기 업체에는 못 씁니다.** 업체 계정도 손님으로 요청을 넣을
  --   수 있으니 이 줄이 필요합니다 — 없으면 제 업체에 별 다섯입니다.
  if coalesce(v_pv = v_pid, false) then
    raise exception '자기 업체에는 후기를 쓸 수 없습니다';
  end if;

  -- ⚠️⚠️ **거래가 있었는가** — 우리 DB 로 확인되는 둘 중 하나입니다.
  select exists (select 1 from quote
                  where request_id = v_req and provider_id = v_pid
                    and state = 'chosen')
      or exists (select 1 from appointment
                  where request_id = v_req and provider_id = v_pid
                    and state = 'done')
    into v_ok;
  if not coalesce(v_ok, false) then
    raise exception '그 업체의 견적을 고르시거나 만나신 뒤에 후기가 열립니다';
  end if;

  -- ⚠️ 별점을 사람 말로 거절합니다. 숫자가 아닌 것이 오면 check 제약이
  --   아니라 여기서 멈춰야 합니다 (손님은 'violates check constraint'
  --   를 읽을 까닭이 없습니다).
  begin
    v_rate := (p->>'rating')::int;
  exception when others then
    v_rate := null;
  end;
  if v_rate is null or v_rate < 1 or v_rate > 5 then
    raise exception '별점을 1에서 5 사이로 골라 주세요';
  end if;

  if char_length(v_body) < 10 then
    raise exception '어떠셨는지 열 글자 이상 적어 주세요';
  end if;
  if char_length(v_body) > 1000 then
    raise exception '후기는 천 글자까지입니다';
  end if;

  -- ⚠️⚠️ **가린 후기는 고쳐서 되살릴 수 없습니다.** 고치면 가림이
  --   풀리게 두면 운영자가 가린 글이 다시 올라옵니다.
  select hidden_at, rating into v_hid, v_was from review
   where request_id = v_req and provider_id = v_pid;
  if v_hid is not null then
    raise exception '운영자가 가린 후기입니다 — 고객센터로 문의해 주세요';
  end if;

  insert into review (request_id, provider_id, rating, body, by_user, updated_at)
  values (v_req, v_pid, v_rate, v_body, v_me, now())
  on conflict (request_id, provider_id) do update
    -- ⚠️ 업체의 답변을 지우지 않습니다 — 후기를 고쳐도 답변은 그 업체의
    --   말이고, 지우는 것은 우리가 할 일이 아닙니다.
    set rating = excluded.rating, body = excluded.body,
        by_user = v_me, updated_at = now()
  returning id into v_id;

  -- ⚠️⚠️ 감사 기록에 **후기 본문 · 성함을 넣지 않습니다** — audit_log 는
  --   오래 남고 보는 사람도 넓습니다. 별점과 요청 id 로 찾아갑니다.
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, data)
  values (v_me, my_role(), 'review', v_id::text,
          coalesce(v_was::text, 'none'), v_rate::text,
          jsonb_build_object('request_id', v_req, 'provider_id', v_pid));
  return v_id;
end $$;

revoke all on function write_review(jsonb) from public;
grant execute on function write_review(jsonb) to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ② 업체가 답변합니다
--
-- ⚠️ 한 줄만 둡니다. 주고받게 두면 공개된 자리에서 다툼이 길어지고,
--   그 글의 책임은 플랫폼으로 옵니다.
-- ⚠️ 별점을 바꿀 길은 없습니다 (업체가 손댈 수 있으면 후기가 아닙니다).
-- ════════════════════════════════════════════════════════════════════
create or replace function reply_review(p jsonb)
  returns void language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_pv   text := my_provider();
  v_id   uuid;
  v_body text := btrim(coalesce(p->>'reply', ''));
  r      review%rowtype;
begin
  if v_me is null then raise exception '답변은 로그인한 뒤에 쓰실 수 있습니다'; end if;
  if my_role() <> 'provider' or v_pv is null then
    raise exception '후기 답변은 그 업체가 씁니다';
  end if;
  v_id := nullif(btrim(coalesce(p->>'id', '')), '')::uuid;
  if v_id is null then raise exception '어느 후기인지 적어 주세요'; end if;

  select * into r from review where id = v_id;
  if not found then raise exception '그런 후기가 없습니다'; end if;
  -- ⚠️⚠️ coalesce 가 없으면 NULL 로 빠져 자물쇠가 열립니다
  if not coalesce(r.provider_id = v_pv, false) then
    raise exception '우리 업체의 후기가 아닙니다';
  end if;
  if r.hidden_at is not null then
    raise exception '가려진 후기에는 답변할 수 없습니다';
  end if;
  if v_body = '' then raise exception '답변을 적어 주세요'; end if;
  if char_length(v_body) > 1000 then raise exception '답변은 천 글자까지입니다'; end if;

  update review set reply = v_body, reply_at = now(), updated_at = now()
   where id = v_id;

  -- ⚠️ 답변 본문을 감사 기록에 넣지 않습니다 (공개 자리에 이미 있습니다)
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, data)
  values (v_me, 'provider', 'review', v_id::text,
          case when r.reply is null then 'none' else 'reply' end, 'reply',
          jsonb_build_object('provider_id', v_pv));
end $$;

revoke all on function reply_review(jsonb) from public;
grant execute on function reply_review(jsonb) to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ③ 운영자가 가립니다 · 다시 냅니다
--
-- ⚠️⚠️ **가리는 까닭을 받습니다.** 까닭 없이 가릴 수 있으면 업체가
--   불평할 때마다 지워 주는 자리가 되고, 그러면 후기가 광고입니다.
-- ⚠️ 지우지 않습니다 — 되돌릴 수 있어야 다툼을 가릴 수 있습니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function hide_review(p jsonb)
  returns void language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_role app_role := my_role();
  v_id   uuid;
  v_to   text := nullif(btrim(coalesce(p->>'to', '')), '');
  v_why  text := nullif(btrim(coalesce(p->>'why', '')), '');
  r      review%rowtype;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if not coalesce(v_role in ('staff','admin'), false) then
    raise exception '후기를 가리는 것은 운영자만 할 수 있습니다';
  end if;
  v_id := nullif(btrim(coalesce(p->>'id', '')), '')::uuid;
  if v_id is null then raise exception '어느 후기인지 적어 주세요'; end if;
  if v_to not in ('hide','show') then
    raise exception '후기는 가리기 · 다시 내기로만 옮깁니다';
  end if;

  select * into r from review where id = v_id;
  if not found then raise exception '그런 후기가 없습니다'; end if;

  if v_to = 'hide' then
    if r.hidden_at is not null then raise exception '이미 가려진 후기입니다'; end if;
    if v_why is null then raise exception '가리시는 까닭을 적어 주세요'; end if;
    update review set hidden_at = now(), hidden_why = v_why, hidden_by = v_me,
                      updated_at = now()
     where id = v_id;
  else
    if r.hidden_at is null then raise exception '가려진 후기가 아닙니다'; end if;
    update review set hidden_at = null, hidden_why = null, hidden_by = null,
                      updated_at = now()
     where id = v_id;
  end if;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, v_role, 'review', v_id::text,
          case when r.hidden_at is null then 'shown' else 'hidden' end,
          case when v_to = 'hide' then 'hidden' else 'shown' end,
          v_why, jsonb_build_object('provider_id', r.provider_id));
end $$;

revoke all on function hide_review(jsonb) from public;
grant execute on function hide_review(jsonb) to authenticated;

insert into schema_version (n, name) values (37, '0037_review')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0038_provider_state.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0038 — 업체 생애주기 상태 · 정지(suspend)  [3차 지시서 §2 · §11-3 · §11-7]
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **"정지" 를 말할 수 없었습니다.** 지금까지 업체에 있는 것은
--   `listed`(공개하나)와 `assignable`(배정해도 되나) **불리언 둘**
--   뿐입니다. 그래서 문제가 생긴 업체를 내릴 때 할 수 있는 일이
--   `listed = false` 하나였고, 그건 **"아직 공개 안 함" 과 글자 그대로
--   같은 상태**입니다 — 기록에도 그렇게 남습니다. 왜 내렸는지, 누가
--   내렸는지, 다시 올려도 되는지가 **어디에도 없습니다.**
--
-- ⚠️⚠️ **정지가 뜻하는 것을 셋으로 못 박습니다.**
--     ① 공개 목록 · 검색에서 **빠진다**
--     ② **새 배정을 못 받는다**
--     ③ **새 견적을 못 낸다**
--   셋을 **각각 다른 자물쇠**로 둡니다. 하나가 내려가도 나머지가
--   남습니다 (0032 에서 겪은 자리 — 정책 하나만 믿으면 안 됩니다).
--
-- ⚠️⚠️ **일부러 안 막은 것 둘 — 까닭이 있습니다.**
--   · 정지된 업체가 **제 소개글을 고치는 것**은 막지 않습니다. 정지된
--     까닭이 소개글이면 고칠 길이 있어야 합니다.
--   · 손님이 **이미 받은 견적을 고르는 것**도 막지 않습니다. 업체가
--     정지됐다고 손님이 받아 둔 견적이 사라지면, 손님이 아무 잘못
--     없이 손해를 봅니다. 막는 것은 **새로** 내는 것뿐입니다.
--
-- ⚠️ 상태 여섯 가운데 draft · submitted · under_review 는 **오늘은
--   쓰이지 않습니다.** `provider` 에 줄이 생기는 길은 `save_provider`
--   하나뿐이고 그것은 **직원 · 관리자만** 부릅니다 (0023) — 즉 줄이
--   있다는 것 자체가 이미 심사를 지났다는 뜻이라 기본값이
--   `approved` 입니다. 신청 깔때기는 `provider_apply` · `apply_state`
--   에 따로 있습니다. 업체가 **스스로 등록하는 길**을 여는 날 그 셋이
--   살아납니다 — 그때 이 머리말을 다시 읽으세요.
--
-- ⚠️⚠️ **덮어쓰는 것 둘** — 앞 번호를 다시 붙여 넣으면 조용히 내려갑니다:
--     assignment_assignable()  0018 → **0038**
--     v_provider_card 보기      0032 → **0038**
--   내려갔는지 보는 법:
--     select definition like '%suspended%' from pg_views
--      where viewname = 'v_provider_card';   -- false 면 0032 판입니다
-- ════════════════════════════════════════════════════════════════════
begin;

alter table provider add column if not exists state text not null default 'approved';
alter table provider add column if not exists state_why text;
alter table provider add column if not exists state_at timestamptz;
alter table provider add column if not exists state_by uuid references auth.users(id) on delete set null;

do $$ begin
  alter table provider add constraint provider_state_ck
    check (state in ('draft','submitted','under_review','approved','rejected','suspended'));
exception when duplicate_object then null; end $$;

create index if not exists provider_state_idx on provider (state);

-- ⚠️ 정지 · 거절에는 **까닭이 반드시** 있습니다. 문에서도 받고 여기서도
--   봅니다 — 문이 내려가는 날 이 줄이 남습니다.
do $$ begin
  alter table provider add constraint provider_state_why_ck
    check (state not in ('rejected','suspended')
           or btrim(coalesce(state_why,'')) <> '');
exception when duplicate_object then null; end $$;


-- ════════════════════════════════════════════════════════════════════
-- ① 자물쇠 — 트리거
--
-- ⚠️⚠️ **칸 단위 GRANT 가 첫 번째 자물쇠입니다.** 0001 의
--   `grant update (name, intro, …) on provider to authenticated` 에
--   `state` 가 **없습니다** — 업체는 애초에 제 상태를 못 만집니다.
--   아래 트리거는 **둘째** 자물쇠입니다 (GRANT 를 누가 넓히는 날).
-- ⚠️ `provider_guard()`(0030)를 덮어쓰지 않고 **따로** 답니다 — 같은
--   자리에 두 번 적으면 둘이 같이 내려갑니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function provider_state_guard() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if my_role() = 'admin' then
    -- ⚠️⚠️ 관리자라도 **정지된 업체를 공개로 켤 수는 없습니다.**
    --   먼저 정지를 풀어야 합니다 — 그래야 "왜 다시 열었나" 가 기록에
    --   남습니다 (listed 만 켜면 그 까닭이 어디에도 안 남습니다).
    if new.listed and new.state = 'suspended' then
      raise exception '정지된 업체는 공개로 켤 수 없습니다 — 먼저 정지를 풀어 주세요';
    end if;
    return new;
  end if;
  if new.state is distinct from old.state then
    raise exception '업체 상태는 관리자만 바꿀 수 있습니다';
  end if;
  if new.state_why is distinct from old.state_why
     or new.state_at is distinct from old.state_at
     or new.state_by is distinct from old.state_by then
    raise exception '업체 상태 기록은 관리자만 바꿀 수 있습니다';
  end if;
  return new;
end $$;

drop trigger if exists provider_state_guard_t on provider;
create trigger provider_state_guard_t before update on provider
  for each row execute function provider_state_guard();


-- ════════════════════════════════════════════════════════════════════
-- ② 자물쇠 — 배정 (0018 의 트리거를 덮어씁니다)
--
-- ⚠️ 0018 이 보던 것(등록된 업체인가 · 배정 가능인가 · 계정이 이어졌나)
--   을 **그대로 두고** 상태 하나를 더 봅니다. 거절하는 말은 자물쇠마다
--   다릅니다 — 같은 말이면 어느 것이 막았는지 알 수 없습니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function assignment_assignable() returns trigger
  language plpgsql security definer set search_path = public as $$
declare ok boolean; st text; linked boolean;
begin
  select assignable, state into ok, st from provider where id = new.provider_id;
  if not found then
    raise exception '등록된 업체가 아닙니다 — %', new.provider_id;
  end if;
  -- ⚠️⚠️ 상태를 **먼저** 봅니다. 정지된 업체는 그 뒤를 볼 까닭이 없고,
  --   "배정 가능이 꺼져 있습니다" 로 거절하면 운영자가 엉뚱한 곳을
  --   고칩니다.
  if st <> 'approved' then
    raise exception '지금 배정할 수 없는 업체입니다 — % (상태: %)', new.provider_id, st;
  end if;
  if not coalesce(ok, false) then
    raise exception '아직 배정할 수 없는 업체입니다 — % (제휴 계약을 확인하고 /admin 에서 배정 가능으로 켜 주세요)',
      new.provider_id;
  end if;
  select provider_linked(new.provider_id) into linked;
  if not coalesce(linked, false) then
    raise exception '업체 계정이 이어져 있지 않습니다 — % (배정해도 업체가 못 봅니다)',
      new.provider_id;
  end if;
  return new;
end $$;


-- ════════════════════════════════════════════════════════════════════
-- ③ 자물쇠 — 새 견적
--
-- ⚠️ `submit_quote`(0008)를 **고치지 않습니다.** 그 함수를 덮어쓰면
--   0008 을 다시 붙여 넣는 날 이 자물쇠가 조용히 내려갑니다 — 긴
--   함수일수록 그렇습니다. 표에 트리거를 답니다.
-- ⚠️⚠️ **넣을 때만** 봅니다. 손님이 고르는 것(update)까지 막으면,
--   업체가 정지됐다고 손님이 받아 둔 견적이 사라집니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function quote_provider_live() returns trigger
  language plpgsql security definer set search_path = public as $$
declare st text;
begin
  select state into st from provider where id = new.provider_id;
  if st is distinct from 'approved' then
    raise exception '지금 견적을 낼 수 없는 업체입니다 (상태: %)', coalesce(st, '없음');
  end if;
  return new;
end $$;

drop trigger if exists quote_provider_live_t on quote;
create trigger quote_provider_live_t before insert on quote
  for each row execute function quote_provider_live();


-- ════════════════════════════════════════════════════════════════════
-- ④ 자물쇠 — 공개 목록 (0032 의 보기를 덮어씁니다)
--
-- ⚠️⚠️ **보기는 RLS 를 지나지 않습니다** — 이 where 절이 자물쇠
--   그 자체입니다. 0032 의 두 줄(listed · is_test)을 **그대로 두고**
--   상태를 더합니다. 칸 목록과 차례는 0032 것 그대로입니다 —
--   바꾸면 `create or replace view` 가 거절합니다 (그게 맞습니다).
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **보기는 `create or replace` 로 칸을 못 늘립니다.** 뒤 번호가
--   이 보기에 칸을 하나 더하면(0044 가 `contact_ways` 를 더했습니다),
--   사장님이 붙여넣기 파일을 **두 번째로** 붙여 넣는 날 이 줄에서
--   `cannot drop columns from view` 로 멈춥니다 — 앞쪽 파일이 옛 칸
--   목록으로 다시 만들려 하기 때문입니다.
--   ⚠️ 그래서 **지우고 다시 만듭니다.** 지우면 GRANT 도 같이 날아가므로
--   바로 아래에서 다시 줍니다 (안 주면 anon 이 못 읽어 그날부터
--   `tools/pull-providers.js` 가 permission denied 입니다).
--   ⚠️⚠️ 이 줄을 고친 까닭 — 운영 DB 는 아직 0007 까지만 올라가 있어
--   **이 파일이 운영에서 한 번도 돈 적이 없습니다.** 이미 돌린 파일이면
--   고치지 않고 새 번호로 갔을 것입니다 (작업 기억의 그 규칙).
--   `tools/test-upgrade.js` 의 ⑧ 이 "두 번 붙여 넣어도 끝까지 도는가" 를
--   실제로 돌려 봅니다.
drop view if exists v_provider_card;
create view v_provider_card as
  select p.id, p.name, p.intro, p.regions, p.gu, p.subs, p.since,
         p.consult_hours, p.verified, p.brands, p.scale,
         p.is_test
    from provider p
   where p.listed = true
     and p.is_test = false
     and p.state = 'approved';

grant select on v_provider_card to anon, authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ⑤ 문 — 상태를 옮깁니다
--
-- ⚠️⚠️ **정지 · 거절에는 까닭을 받습니다.** 까닭 없이 내릴 수 있으면
--   누가 불평할 때마다 내려 주는 자리가 되고, 그러면 공개 목록이
--   광고입니다 (후기에서 겪은 자리와 같습니다 — 0037).
-- ⚠️ 지우지 않습니다. 정지도 **기록**입니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function set_provider_state(p jsonb)
  returns void language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_role app_role := my_role();
  v_id   text := nullif(btrim(coalesce(p->>'id', '')), '');
  v_to   text := nullif(btrim(coalesce(p->>'to', '')), '');
  v_why  text := nullif(btrim(coalesce(p->>'why', '')), '');
  r      provider%rowtype;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  -- ⚠️ 직원이 아니라 **관리자만**입니다. 업체를 내리는 것은 그 업체의
  --   영업을 멈추는 일입니다 (0030 의 공개 여부와 같은 무게입니다).
  if not coalesce(v_role = 'admin', false) then
    raise exception '업체 상태는 관리자만 바꿀 수 있습니다';
  end if;
  if v_id is null then raise exception '어느 업체인지 적어 주세요'; end if;
  if v_to not in ('draft','submitted','under_review','approved','rejected','suspended') then
    raise exception '그런 상태가 없습니다 — %', coalesce(v_to, '(없음)');
  end if;

  select * into r from provider where id = v_id;
  if not found then raise exception '없는 업체입니다 — %', v_id; end if;
  if r.state = v_to then raise exception '이미 %입니다', v_to; end if;

  if v_to in ('rejected','suspended') and v_why is null then
    raise exception '%하시는 까닭을 적어 주세요',
      case when v_to = 'suspended' then '정지' else '거절' end;
  end if;

  -- ⚠️⚠️ **내리면 공개도 같이 끕니다.** 상태만 바꾸고 listed 를 켜 둔
  --   채로 두면, 보기의 where 가 거르더라도 **다른 자리(광고 보기 ·
  --   앞으로 만들 화면)가 listed 만 보고 내보낼 수 있습니다.**
  update provider set
    state     = v_to,
    state_why = case when v_to in ('rejected','suspended') then v_why else null end,
    state_at  = now(),
    state_by  = v_me,
    listed    = case when v_to <> 'approved' then false else listed end
   where id = v_id;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why)
  values (v_me, v_role, 'provider', v_id, r.state, v_to, v_why);
end $$;

revoke all on function set_provider_state(jsonb) from public;
grant execute on function set_provider_state(jsonb) to authenticated;

insert into schema_version (n, name) values (38, '0038_provider_state')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0039_consent_revoke.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0039 — 요청 취소 · 제3자 제공 동의 **철회**
--        [3차 지시서 §5 · 개인정보 보호법 제37조 · 제17조 제2항]
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **철회할 길이 없었습니다.** 0029 가 "배정하는 순간 상호를
--   알리고 동의를 다시 받는다" 까지는 제대로 했는데, 그 뒤가 없습니다.
--   `assignment.agree3rd_at` 은 **언제 동의했나**만 적혀 있고
--   **아무 자물쇠도 그 칸을 보지 않습니다.**
--
--   업체가 손님 정보를 보는 길이 셋인데 전부 "배정 줄이 있는가" 만
--   봅니다 —
--     request_assigned  정책 (0001)  성함 · 연락처
--     is_my_item()      함수 (0009)  무엇을 요청했나
--     photo_provider    정책 (0011)  올린 사진 · 서류
--   즉 손님이 "그 업체에는 주지 마세요" 라고 할 방법이 없었고, 말해도
--   **업체는 계속 다 봤습니다.** 제37조(처리정지 요구권)가 걸리는
--   자리입니다.
--
-- ⚠️⚠️ **배정 줄을 지우지 않습니다.** 지우면 "준 적 없다" 가 되어
--   **넘어간 적이 있다는 기록 자체가 사라집니다.** 제공 이력은 손님이
--   확인할 수 있어야 하는 것이고(§5), 업체 쪽에도 왜 끊겼는지가
--   남아야 합니다. 그래서 **표시**합니다.
--
-- ⚠️⚠️ **일부러 안 끊는 것 둘 — 까닭이 있습니다.**
--   · 업체가 **이미 낸 견적**은 남습니다. 철회는 "앞으로 못 본다" 이지
--     "없던 일" 이 아닙니다. 손님도 받아 둔 견적을 계속 봅니다.
--   · **수수료 · 정산 기록**도 남습니다 (회계 · 세무 기록입니다).
--
-- ⚠️⚠️ **덮어쓰는 것 셋** — 앞 번호를 다시 붙여 넣으면 조용히 내려갑니다:
--     request_assigned 정책   0001 → **0039**
--     is_my_item()            0009 → **0039**
--     photo_provider 정책     0011 → **0039**
--   내려갔는지 보는 법:
--     select pg_get_functiondef('is_my_item(uuid)'::regprocedure)
--            like '%revoked_at%';     -- false 면 0009 판입니다
-- ════════════════════════════════════════════════════════════════════
begin;

alter table assignment add column if not exists revoked_at  timestamptz;
alter table assignment add column if not exists revoked_why text;

create index if not exists assign_revoked_idx on assignment (request_id, revoked_at);

-- ⚠️ 철회에는 **까닭을 받습니다** — 업체가 왜 끊겼는지 알아야 하고,
--   나중에 다툼이 생기면 그 글이 기록입니다.
do $$ begin
  alter table assignment add constraint assign_revoked_why_ck
    check (revoked_at is null or btrim(coalesce(revoked_why,'')) <> '');
exception when duplicate_object then null; end $$;


-- ════════════════════════════════════════════════════════════════════
-- ① 업체가 보는 길 셋을 **전부** 좁힙니다
--
-- ⚠️⚠️ 셋을 **각각** 고칩니다. 하나만 고치면 나머지 둘로 계속 봅니다 —
--   성함을 못 봐도 사진으로 알 수 있고, 사진을 못 봐도 요청 내용으로
--   알 수 있습니다. 끊으려면 다 끊어야 합니다.
-- ════════════════════════════════════════════════════════════════════
drop policy if exists request_assigned on request;
create policy request_assigned on request for select using (
  exists (select 1 from assignment a
          where a.request_id = request.id
            and a.provider_id = my_provider()
            and a.revoked_at is null)
);

create or replace function is_my_item(iid uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from assignment a
                  where a.item_id = iid
                    and a.provider_id = my_provider()
                    and a.revoked_at is null)
$$;
revoke all on function is_my_item(uuid) from public;
grant execute on function is_my_item(uuid) to authenticated;

drop policy if exists photo_provider on request_photo;
create policy photo_provider on request_photo for select
  using (my_provider() is not null and exists (
    select 1 from assignment a
     where a.request_id = request_photo.request_id
       and a.provider_id = my_provider()
       and a.revoked_at is null));


-- ════════════════════════════════════════════════════════════════════
-- ② 철회한 업체는 **새 견적 · 새 일정도 못 냅니다**
--
-- ⚠️ `submit_quote`(0008) · `set_appointment`(0034)를 고치지 않습니다 —
--   긴 함수를 덮어쓰면 앞 번호를 다시 붙여 넣는 날 이 자물쇠가 조용히
--   내려갑니다 (0038 에서 쓴 방식 그대로). 표에 트리거를 답니다.
-- ⚠️⚠️ **넣을 때만** 봅니다. 손님이 이미 받은 견적을 고르는 것(update)
--   까지 막으면, 철회했다고 손님이 받아 둔 견적이 잠깁니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function assign_not_revoked() returns trigger
  language plpgsql security definer set search_path = public as $$
declare rv timestamptz;
begin
  select revoked_at into rv from assignment
   where request_id = new.request_id and provider_id = new.provider_id;
  if rv is not null then
    raise exception '손님이 이 업체로의 정보 제공을 철회했습니다 — 더 진행할 수 없습니다';
  end if;
  return new;
end $$;

drop trigger if exists quote_not_revoked_t on quote;
create trigger quote_not_revoked_t before insert on quote
  for each row execute function assign_not_revoked();

drop trigger if exists appt_not_revoked_t on appointment;
create trigger appt_not_revoked_t before insert on appointment
  for each row execute function assign_not_revoked();


-- ════════════════════════════════════════════════════════════════════
-- ③ 문 — 손님이 **철회**합니다
--
-- ⚠️⚠️ 손님만입니다. 운영자가 대신 철회하면 "손님이 원해서" 인지
--   "운영자가 치워서" 인지 기록에서 갈리지 않습니다.
-- ⚠️ 이미 철회한 것을 또 철회하면 **다른 말로** 거절합니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function revoke_third_party(p jsonb)
  returns void language plpgsql security definer
  set search_path = public as $$
declare
  v_me  uuid := auth.uid();
  v_id  uuid := nullif(btrim(coalesce(p->>'assignment', '')), '')::uuid;
  v_why text := nullif(btrim(coalesce(p->>'why', '')), '');
  r     assignment%rowtype;
begin
  if v_me is null then raise exception '철회는 로그인한 뒤에 하실 수 있습니다'; end if;
  if v_id is null then raise exception '어느 업체로의 제공을 철회하실지 적어 주세요'; end if;

  select * into r from assignment where id = v_id;
  if not found then raise exception '그런 제공 기록이 없습니다'; end if;
  -- ⚠️⚠️ coalesce 로 땅에 내려놓습니다 — NULL 이면 if 가 안 걸려
  --   자물쇠가 통째로 열립니다 (0034 에서 겪은 자리).
  if not coalesce(is_my_request(r.request_id), false) then
    raise exception '내 요청의 제공만 철회할 수 있습니다';
  end if;
  if r.revoked_at is not null then
    raise exception '이미 철회하셨습니다';
  end if;
  if v_why is null then
    raise exception '철회하시는 까닭을 적어 주세요 (업체가 왜 끊겼는지 알아야 합니다)';
  end if;

  update assignment set revoked_at = now(), revoked_why = v_why where id = v_id;

  -- ⚠️ 감사 기록에 **성함 · 연락처를 안 넣습니다** — 요청 id 로 찾아갑니다.
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, my_role(), 'assignment', v_id::text, r.state, 'revoked', v_why,
          jsonb_build_object('request_id', r.request_id, 'provider_id', r.provider_id));
end $$;

revoke all on function revoke_third_party(jsonb) from public;
grant execute on function revoke_third_party(jsonb) to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ④ 문 — 손님이 **요청을 취소**합니다
--
-- ⚠️⚠️ **이미 계약 단계면 막습니다.** 업체가 일을 시작했을 수 있고,
--   그때 손님이 혼자 취소하면 그 다툼을 플랫폼이 떠안습니다 —
--   담당자를 거치게 합니다. 화면도 그렇게 말합니다.
-- ⚠️ 취소는 `move_state`(0004→0007)의 길을 쓰지 않습니다. 그 문은
--   **운영자용**이고 전이표(deal_move)를 따릅니다 — 손님이 쓰는 길은
--   따로 두는 것이 맞습니다 (권한이 다릅니다).
-- ⚠️⚠️ 취소해도 **배정 · 견적을 지우지 않습니다.** 기록입니다.
--   다만 취소하면 **제공도 전부 철회**됩니다 — 요청을 거둔 손님의
--   연락처를 업체가 계속 볼 까닭이 없습니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function cancel_request(p jsonb)
  returns void language plpgsql security definer
  set search_path = public as $$
declare
  v_me  uuid := auth.uid();
  v_id  uuid := nullif(btrim(coalesce(p->>'request', '')), '')::uuid;
  v_why text := nullif(btrim(coalesce(p->>'why', '')), '');
  r     request%rowtype;
  n     int;
begin
  if v_me is null then raise exception '취소는 로그인한 뒤에 하실 수 있습니다'; end if;
  if v_id is null then raise exception '어느 요청인지 적어 주세요'; end if;

  select * into r from request where id = v_id;
  if not found then raise exception '그런 요청이 없습니다'; end if;
  if not coalesce(is_my_request(v_id), false) then
    raise exception '내 요청만 취소할 수 있습니다';
  end if;
  if r.state = 'lost' then raise exception '이미 취소된 요청입니다'; end if;
  -- ⚠️⚠️ 계약 뒤에는 혼자 못 거둡니다 — 거절하는 말이 **무엇을 하라고**
  --   말해 줍니다 (막다른 길로 두지 않습니다).
  if r.state in ('signed','done','fee_wait','fee_done') then
    raise exception '이미 진행 중인 건이라 혼자 취소할 수 없습니다 — 고객센터로 알려 주세요';
  end if;
  if v_why is null then
    raise exception '취소하시는 까닭을 적어 주세요';
  end if;

  update request set state = 'lost' where id = v_id;

  -- ⚠️ 넘어가 있던 제공을 **전부** 거둡니다 (이미 철회한 것은 그대로).
  update assignment
     set revoked_at = now(),
         revoked_why = '손님이 요청을 취소했습니다'
   where request_id = v_id and revoked_at is null;
  get diagnostics n = row_count;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, my_role(), 'request', v_id::text, r.state::text, 'lost', v_why,
          jsonb_build_object('revoked', n));
end $$;

revoke all on function cancel_request(jsonb) from public;
grant execute on function cancel_request(jsonb) to authenticated;

insert into schema_version (n, name) values (39, '0039_consent_revoke')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0040_report.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0040 — 신고 · 분쟁  [3차 지시서 §6 · §8 · §9 abuse_reports]
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **`deal_state` enum 에 'disputed' 를 더하지 않았습니다 —
--   일부러입니다.** 까닭 둘:
--
--   ① **터집니다.** `alter type ... add value` 로 더한 값은 **같은
--      트랜잭션에서 쓸 수 없습니다.** 우리 마이그레이션은 전부
--      `begin; … commit;` 으로 감싸여 있어서, 그 안에서 더하고 바로
--      쓰면 `unsafe use of new value` 로 멈춥니다. 임시 Postgres 에
--      실제로 돌려 보고 확인했습니다. 트랜잭션 밖으로 빼면 되지만,
--      사장님은 `db/apply-from-0008.sql` 을 **통째로** 붙여 넣으시고
--      그 편집기가 전체를 한 트랜잭션으로 감싸는지 저희는 모릅니다.
--      **모르는 것에 기대지 않습니다.**
--
--   ② **더 중요한 까닭 — 분쟁은 단계가 아닙니다.** 상태로 만들면
--      `signed` 였는지 `done` 이었는지가 **덮여서 사라집니다.** 분쟁은
--      어느 단계에서든 열릴 수 있고, 풀리면 원래 단계로 돌아가야
--      합니다. 그래서 **따로 적습니다** (3차 지시서 §6 은 상태로
--      적었지만, 우리 deal_state 가 그보다 자세해서 그렇습니다 —
--      AUDIT.md 에 적어 두었습니다).
--
-- ⚠️⚠️ **신고와 분쟁을 한 표에 둡니다.** 둘 다 "누가 · 무엇을 ·
--   왜 · 어떻게 끝났나" 이고, 관리자는 한 자리에서 봅니다 (§8).
--   `kind` 로 가릅니다.
--
-- ⚠️ **지우지 않습니다.** 신고를 지우면 "신고한 적 없다" 가 됩니다.
--   끝난 것은 state 로 표시합니다.
-- ════════════════════════════════════════════════════════════════════
begin;

create table if not exists report (
  id          uuid primary key default gen_random_uuid(),
  -- abuse  신고 (욕설 · 허위 · 광고 등)
  -- dispute 분쟁 (거래가 틀어졌습니다)
  kind        text not null check (kind in ('abuse','dispute')),
  -- ⚠️ 무엇에 대한 것인가 — 셋 가운데 **적어도 하나**는 있어야 합니다.
  --   셋 다 비면 무엇을 신고한 것인지 알 수 없습니다.
  request_id  uuid references request(id)  on delete cascade,
  provider_id text references provider(id) on delete cascade,
  review_id   uuid references review(id)   on delete cascade,
  by_user     uuid references auth.users(id) on delete set null,
  body        text not null,
  state       text not null default 'open'
              check (state in ('open','reviewing','resolved','rejected')),
  -- 어떻게 끝났나 — ⚠️ 끝낼 때는 반드시 적습니다
  resolution  text,
  closed_at   timestamptz,
  closed_by   uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint report_target_ck check (
    request_id is not null or provider_id is not null or review_id is not null),
  constraint report_body_ck check (char_length(btrim(body)) between 5 and 2000),
  -- ⚠️⚠️ 끝난 것에는 **까닭이 반드시** 있습니다. 문에서도 받고 여기서도
  --   봅니다 — 문이 내려가는 날 이 줄이 남습니다.
  constraint report_resolution_ck check (
    state not in ('resolved','rejected')
    or btrim(coalesce(resolution,'')) <> '')
);
create index if not exists report_state_idx on report (state, created_at desc);
create index if not exists report_target_idx on report (provider_id, request_id);

alter table report enable row level security;

-- ── 누가 보는가 ─────────────────────────────────────────────────────
-- ⚠️⚠️ **신고한 사람은 제 신고만 봅니다.** 남의 신고가 보이면 누가
--   누구를 신고했는지 드러납니다 — 그 자체가 분쟁의 씨앗입니다.
drop policy if exists report_mine on report;
create policy report_mine on report for select
  using (by_user = auth.uid());

drop policy if exists report_staff on report;
create policy report_staff on report for select
  using (my_role() in ('staff','admin'));

-- ⚠️⚠️ **업체는 제게 들어온 신고를 못 봅니다.** 보면 신고한 손님을
--   찾아갑니다. 운영자가 걸러서 전합니다 — 그게 중개자가 할 일입니다.
-- ⚠️ 쓰기 정책을 일부러 안 만들었습니다 — 문 둘만 엽니다.
grant select on report to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ① 문 — 신고 · 분쟁을 엽니다
--
-- ⚠️ 로그인한 사람만입니다. 익명 신고를 받으면 경쟁사가 하루에 백 건을
--   넣습니다 — 받을 수는 있어도 **누가 넣었는지는 알아야** 합니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function open_report(p jsonb)
  returns uuid language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_kind text := coalesce(nullif(btrim(p->>'kind'), ''), 'abuse');
  v_req  uuid := nullif(btrim(coalesce(p->>'request', '')), '')::uuid;
  v_pv   text := nullif(btrim(coalesce(p->>'provider', '')), '');
  v_rv   uuid := nullif(btrim(coalesce(p->>'review', '')), '')::uuid;
  v_body text := btrim(coalesce(p->>'body', ''));
  v_id   uuid;
  v_dup  int;
begin
  if v_me is null then raise exception '신고는 로그인한 뒤에 하실 수 있습니다'; end if;
  if v_kind not in ('abuse','dispute') then
    raise exception '신고 · 분쟁 중 하나로 적어 주세요';
  end if;
  if v_req is null and v_pv is null and v_rv is null then
    raise exception '무엇에 대한 것인지 적어 주세요 (요청 · 업체 · 후기 가운데 하나)';
  end if;
  if char_length(v_body) < 5 then
    raise exception '무슨 일이 있었는지 다섯 글자 이상 적어 주세요';
  end if;
  if char_length(v_body) > 2000 then
    raise exception '신고 내용은 이천 글자까지입니다';
  end if;

  -- ⚠️⚠️ **분쟁은 그 요청의 당사자만** 엽니다. 아무나 "저 거래가
  --   이상합니다" 라고 열 수 있으면 분쟁이 아니라 신고입니다.
  if v_kind = 'dispute' then
    if v_req is null then raise exception '분쟁은 어느 요청인지 적어야 합니다'; end if;
    if not (coalesce(is_my_request(v_req), false)
            or coalesce(exists (select 1 from assignment a
                                 where a.request_id = v_req
                                   and a.provider_id = my_provider()), false)
            or coalesce(my_role() in ('staff','admin'), false)) then
      raise exception '그 거래의 당사자만 분쟁을 열 수 있습니다';
    end if;
  end if;

  -- ⚠️⚠️ **같은 것을 두 번 열지 않습니다.** 누르는 손이 미끄러지면
  --   같은 신고가 둘이 되고, 운영자는 그것을 두 번 읽습니다.
  select count(*) into v_dup from report
   where by_user = v_me and kind = v_kind and state in ('open','reviewing')
     and request_id is not distinct from v_req
     and provider_id is not distinct from v_pv
     and review_id is not distinct from v_rv;
  if v_dup > 0 then
    raise exception '같은 건으로 이미 접수된 것이 있습니다 — 운영자가 보고 있습니다';
  end if;

  insert into report (kind, request_id, provider_id, review_id, by_user, body)
  values (v_kind, v_req, v_pv, v_rv, v_me, v_body)
  returning id into v_id;

  -- ⚠️ 감사 기록에 **신고 본문을 넣지 않습니다** — audit_log 는 오래
  --   남고 보는 사람도 넓습니다. 번호로 찾아갑니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'report', v_id::text, 'open',
          jsonb_build_object('kind', v_kind));
  return v_id;
end $$;

revoke all on function open_report(jsonb) from public;
grant execute on function open_report(jsonb) to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ② 문 — 운영자가 처리합니다
--
-- ⚠️⚠️ **끝낼 때는 어떻게 끝났는지 반드시 적습니다** (§8 의 "승인 ·
--   거절 사유 필수"). 까닭 없이 닫을 수 있으면, 신고함은 쌓이기만
--   하는 자리가 됩니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function move_report(p jsonb)
  returns void language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_role app_role := my_role();
  v_id   uuid := nullif(btrim(coalesce(p->>'id', '')), '')::uuid;
  v_to   text := nullif(btrim(coalesce(p->>'to', '')), '');
  v_res  text := nullif(btrim(coalesce(p->>'resolution', '')), '');
  r      report%rowtype;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if not coalesce(v_role in ('staff','admin'), false) then
    raise exception '신고 처리는 운영자만 할 수 있습니다';
  end if;
  if v_id is null then raise exception '어느 신고인지 적어 주세요'; end if;
  if v_to not in ('reviewing','resolved','rejected') then
    raise exception '신고는 확인 중 · 처리됨 · 반려로만 옮깁니다';
  end if;

  select * into r from report where id = v_id;
  if not found then raise exception '그런 신고가 없습니다'; end if;
  if r.state = v_to then raise exception '이미 %입니다', v_to; end if;
  if r.state in ('resolved','rejected') then
    raise exception '이미 끝난 신고입니다';
  end if;
  if v_to in ('resolved','rejected') and v_res is null then
    raise exception '어떻게 처리하셨는지 적어 주세요';
  end if;

  update report set
    state      = v_to,
    resolution = case when v_to in ('resolved','rejected') then v_res else resolution end,
    closed_at  = case when v_to in ('resolved','rejected') then now() else null end,
    closed_by  = case when v_to in ('resolved','rejected') then v_me else null end,
    updated_at = now()
   where id = v_id;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why)
  values (v_me, v_role, 'report', v_id::text, r.state, v_to, v_res);
end $$;

revoke all on function move_report(jsonb) from public;
grant execute on function move_report(jsonb) to authenticated;

insert into schema_version (n, name) values (40, '0040_report')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0041_rate_limit.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0041 — 쏟아붓기 막기 · **하루 한도**  [3차 지시서 §5 · §10]
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **처음에 적은 "10분에 다섯 건" 은 거짓이었습니다 — 지웠습니다.**
--   0029 가 이미 **같은 번호로 10분에 한 건**만 받습니다
--   ("방금 같은 번호로 요청이 들어왔습니다"). 그 위에 "10분에 다섯"
--   을 얹으면 **영원히 안 걸리는 자물쇠**입니다 — 검사는 초록이고
--   다음 차수는 그것을 자물쇠로 읽습니다 (작업 기억의 "만들어 놓고
--   안 쓰는 칸" 그 자리입니다).
--   ⚠️ **남은 틈은 "하루"** 였습니다: 10분에 한 건이면 **하루에
--   144건**이고, 아무것도 그것을 안 막았습니다. 여기서 막는 것은
--   그 하나입니다 — **하루 20건**.
--
-- ⚠️⚠️ **무엇으로 세는가.** 로그인 없이 들어오므로 user_id 가 비어
--   있습니다. 그래서 **연락처의 숫자만** 으로 셉니다 (`v_digits`) —
--   `tel` 날것으로 세면 `010-1111-2222` 와 `01011112222` 가 **다른
--   사람**이 되어 한도가 조용히 두 배가 됩니다.
--   ⚠️ IP 로 세지 않습니다: 우리는 IP 를 **받지도 저장하지도** 않고,
--   받기 시작하면 그날부터 개인정보 처리 항목이 하나 늘어 방침을
--   같이 고쳐야 합니다 (제15조 제2항). 막자고 더 받는 것은 거꾸로입니다.
--   ⚠️⚠️ **그래서 번호를 바꿔 가며 넣는 것은 못 막습니다.** 막는 척
--   하지 않습니다 — 그 자리는 운영자가 신고(0040)로 봅니다.
--
-- ⚠️⚠️ **경계값을 넉넉히 둡니다.** 레슨 · 피팅 · 부킹을 잇따라 넣는
--   것은 **정상**입니다 (너무 좁게 막는 것도 고장입니다). 10분에 한
--   건씩이면 하루 20건은 **세 시간 반**을 꼬박 넣은 것입니다.
--
-- ⚠️⚠️ **`make_request` 를 덮어씁니다** — 체인이 길어집니다:
--     make_request  0029 → 0035 → **0041**
--   0029 나 0035 를 다시 붙여 넣으면 이 자물쇠가 **조용히 내려갑니다.**
--   내려갔는지 보는 법:
--     select pg_get_functiondef('make_request(jsonb)'::regprocedure)
--            like '%하루에 보내실%';     -- false 면 옛 판입니다
--
-- ⚠️ 함수 본문은 0035 것을 **그대로 떠서** 블록 하나만 끼웠습니다
--   (손으로 옮겨 적으면 다음 함수를 통째로 삼킵니다).
-- ════════════════════════════════════════════════════════════════════
begin;

-- ⚠️ 세는 식(`숫자만`)과 **똑같은 꼴**로 색인을 만듭니다 — 날것 tel 에
--   걸면 이 질의도 · 0029 의 겹침 검사도 못 씁니다.
create index if not exists request_digits_time_idx
  on request (regexp_replace(tel, '[^0-9]', '', 'g'), created_at desc);

create or replace function make_request(p jsonb)
  returns text language plpgsql security definer set search_path = public as $$
declare
  v_name  text := btrim(coalesce(p->>'name', ''));
  v_tel   text := btrim(coalesce(p->>'tel', ''));
  v_email text := nullif(btrim(coalesce(p->>'email', '')), '');
  v_region text := nullif(btrim(coalesce(p->>'region', '')), '');
  v_gu    text := nullif(btrim(coalesce(p->>'gu', '')), '');
  v_want  text := nullif(btrim(coalesce(p->>'want_at', '')), '');
  v_body  text := nullif(btrim(coalesce(p->>'body', '')), '');
  v_idem  text := nullif(btrim(coalesce(p->>'idem', '')), '');
  v_bmin  bigint := nullif(p->>'budget_min', '')::bigint;
  v_bmax  bigint := nullif(p->>'budget_max', '')::bigint;
  -- ⚠️ 0035 — 손님이 보고 오신 업체 (바람이지 배정이 아닙니다)
  v_wpv   text := nullif(btrim(coalesce(p->>'wantProvider', '')), '');
  v_wpv_ok text;
  v_svc   text[] := coalesce(
             (select array_agg(distinct btrim(x)) from jsonb_array_elements_text(
                case when jsonb_typeof(p->'services') = 'array'
                     then p->'services' else '[]'::jsonb end) as t(x)
              where btrim(x) <> ''), '{}'::text[]);
  v_digits text;
  v_no     text;
  v_id     uuid;
  v_try    int := 0;
  v_abc    text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  v_raw    text;
  k        text;
begin
  -- ⚠️ 자물쇠마다 **다른 말**로 거절합니다.
  if v_name = '' then raise exception '성함을 적어 주세요'; end if;
  if v_tel  = '' then raise exception '연락처를 적어 주세요'; end if;
  if length(v_name) > 40 then raise exception '성함이 너무 깁니다'; end if;
  if v_body is not null and length(v_body) > 2000 then
    raise exception '남기신 말씀이 너무 깁니다';
  end if;

  v_digits := regexp_replace(v_tel, '[^0-9]', '', 'g');
  -- ⚠️ 경계값: 9자리(02-xxx-xxxx)부터 11자리(010-xxxx-xxxx)까지입니다.
  if length(v_digits) < 9 or length(v_digits) > 11 then
    raise exception '연락처를 다시 봐 주세요 — 숫자 아홉에서 열한 자리입니다';
  end if;

  if array_length(v_svc, 1) is null then
    raise exception '원하시는 서비스를 하나 이상 골라 주세요';
  end if;
  if array_length(v_svc, 1) > 10 then
    raise exception '고르신 서비스가 너무 많습니다 — 열 개까지입니다';
  end if;

  -- ⚠️ 예산은 **0 도 값입니다** (무료 상담). 음수와 뒤집힌 것만 막습니다.
  if v_bmin is not null and v_bmin < 0 then raise exception '예산은 0 보다 작을 수 없습니다'; end if;
  if v_bmax is not null and v_bmax < 0 then raise exception '예산은 0 보다 작을 수 없습니다'; end if;
  if v_bmin is not null and v_bmax is not null and v_bmin > v_bmax then
    raise exception '예산의 아래가 위보다 큽니다';
  end if;

  if (p->>'agree_at') is null then
    raise exception '수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes' then
    raise exception '동의 시각이 미래입니다';
  end if;
  if (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의가 오래되었습니다 — 다시 한 번 눌러 주세요';
  end if;

  -- ⚠️⚠️ **같은 요청을 두 번 넣는 것을 두 겹으로 막습니다.**
  --   ① idem — 화면이 한 번 연 동안 하나입니다 (두 번 눌러도 하나)
  --   ② 같은 번호로 10분 안
  if v_idem is not null then
    select id, no into v_id, v_no from request where idem = v_idem;
    if v_id is not null then return v_no; end if;   -- 이미 들어간 것입니다
  end if;
  if exists (
    select 1 from request
     where regexp_replace(tel, '[^0-9]', '', 'g') = v_digits
       and created_at > now() - interval '10 minutes')
  then
    raise exception '방금 같은 번호로 요청이 들어왔습니다 — 잠시 뒤에 다시 해 주세요';
  end if;

  -- ⚠️⚠️ **하루 한도 (0041).** 위가 10분을 막고, 여기가 하루를 막습니다.
  --   ⚠️ 표에 트리거로 달아 봤다가 되돌렸습니다 — 이 함수가 SECURITY
  --   DEFINER 라 트리거 안에서는 **씨앗을 넣는 운영자와 손님이 똑같이
  --   보입니다.** 가를 수가 없어 멀쩡한 지표 검사가 깨졌습니다.
  --   그리고 `request` 표에는 insert 정책도 GRANT 도 **없습니다** —
  --   손님이 넣는 길은 이 문 하나뿐이라, 자물쇠도 여기 있어야 합니다.
  --   ⚠️ 거절하는 말이 **어디로 가라**고 말해 줍니다 (막다른 길 금지).
  if (select count(*) from request
       where regexp_replace(tel, '[^0-9]', '', 'g') = v_digits
         and created_at > now() - interval '24 hours') >= 20 then
    raise exception '하루에 보내실 수 있는 요청 수를 넘었습니다 — 고객센터로 알려 주세요';
  end if;

  -- ⚠️⚠️ **바라시는 업체가 실제로 있는가.** 없으면 **비우고 넘어갑니다** —
  --   묵은 링크 때문에 손님의 요청이 통째로 막히면 안 됩니다.
  --   ⚠️ 검사용 업체는 안 받습니다 (손님 화면에 나간 적이 없는 업체입니다).
  if v_wpv is not null then
    select id into v_wpv_ok from provider
     where id = v_wpv and listed = true and is_test = false;
  end if;

  -- 번호 — 겹치면 다시 뽑습니다 (스무 번까지)
  loop
    v_try := v_try + 1;
    v_raw := '';
    for i in 1..8 loop
      v_raw := v_raw || substr(v_abc, 1 + floor(random() * length(v_abc))::int, 1);
    end loop;
    v_no := 'SW-' || substring(v_raw from 1 for 4) || '-' || substring(v_raw from 5 for 4);
    exit when not exists (select 1 from request where no = v_no);
    if v_try > 20 then raise exception '신청번호를 만들지 못했습니다'; end if;
  end loop;

  insert into request (no, user_id, side, cat, region, gu,
                       budget_min, budget_max, want_at, body,
                       name, tel, email, agree_at, idem, want_provider)
  values (v_no, auth.uid(), 'golf',
          -- ⚠️ 분류는 **첫 서비스가 속한 분류**를 화면이 적어 보냅니다.
          nullif(btrim(coalesce(p->>'cat', '')), ''),
          v_region, v_gu, v_bmin, v_bmax, v_want, v_body,
          v_name, v_tel, v_email, (p->>'agree_at')::timestamptz, v_idem, v_wpv_ok)
  returning id into v_id;

  foreach k in array v_svc loop
    insert into request_item (request_id, service_id)
    values (v_id, k)
    on conflict (request_id, service_id) do nothing;
  end loop;

  -- ⚠️ 감사 기록에 **성함 · 연락처를 넣지 않습니다.** 신청번호로 찾아갑니다.
  -- ⚠️⚠️ 바라시는 업체를 **비운 경우 그 사실을 남깁니다** — 조용히
  --   사라지면 "왜 그 업체로 안 갔나" 를 아무도 못 댑니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (auth.uid(), my_role(), 'request', v_no, 'new', '매칭 요청 접수',
          jsonb_build_object('services', v_svc, 'region', v_region,
                             'cat', nullif(btrim(coalesce(p->>'cat', '')), ''),
                             'wantProvider', v_wpv_ok,
                             'wantProviderDropped',
                             (v_wpv is not null and v_wpv_ok is null)));

  return v_no;
end $$;
revoke all on function make_request(jsonb) from public;
grant execute on function make_request(jsonb) to anon, authenticated;

insert into schema_version (n, name) values (41, '0041_rate_limit')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0042_provider_price.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0042 — 업체가 **등록하는 가격**  [업체찾기 개선 지시서 7번 · 9번]
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **가격을 담을 자리가 없었습니다.** 업체 카드에 "실제 등록
--   가격" 을 내라는 지시인데, `provider` 표에도 어디에도 가격 칸이
--   없었습니다. 금액이 있는 자리는 `quote`(요청마다 내는 견적) ·
--   `ad` · `mship`(우리가 받는 돈)뿐이고, 그 셋은 **손님에게 보여 줄
--   값이 아닙니다.**
--   ⚠️ 그래서 화면에 "상담 후 견적" 같은 말을 적어 채우지 **않았습니다** —
--   그건 우리가 지어낸 약속입니다 (절대 규칙 5). 대신 업체가 **스스로
--   등록하는** 자리를 만듭니다. 등록이 0건이면 카드에서 그 줄이
--   **줄째 빠집니다** (절대 규칙 2).
--
-- ⚠️⚠️ **가격은 "서비스마다" 입니다.** 업체 하나에 금액 하나를 두면
--   레슨 10회권과 그립 교체가 같은 칸에 들어갑니다. 그래서 하위 분야
--   (`sub` — catalog.js 의 하위 키)마다 줄을 둡니다.
--   ⚠️⚠️ **그 업체가 하지 않는 일에는 가격을 못 답니다** — 아래 트리거가
--   `provider.subs` 에 있는 하위인지 봅니다. 없으면 그 가격은 어느
--   화면에도 안 뜨면서 아무 에러도 안 납니다 (만들어 놓고 안 쓰는 칸).
--
-- ⚠️⚠️ **단위를 반드시 받습니다.** "90만원" 만 적으면 한 번인지 한 달
--   인지 알 수 없고, 그건 손님이 오해하는 자리입니다 (표시광고법).
--   ⚠️ 단위는 거르개로 쓰지 않으므로 글자로 받습니다 (지역처럼 키로
--   견주는 값이 아닙니다 — 섞여도 거르개가 어긋날 자리가 없습니다).
--
-- ⚠️⚠️ **지우지 않고 내립니다** (`active = false`). 지우면 "그때 얼마를
--   걸어 두었나" 가 사라져서, 손님과 다툼이 생길 때 아무 기록이 없습니다.
--
-- ⚠️⚠️ **공개로 읽는 길은 보기(view) 하나입니다.** 보기는 RLS 를 지나지
--   않으므로 **그 `where` 절이 자물쇠 그 자체**입니다 (0026 의 v_ad_live
--   가 검사용 업체의 상호를 anon 에게 내보내던 자리). 그래서
--   `v_provider_price_public` 이 업체를 join 해서 **공개 · 승인 · 검사용
--   아님**을 전부 봅니다.
-- ════════════════════════════════════════════════════════════════════
begin;

create table if not exists provider_price (
  id          uuid primary key default gen_random_uuid(),
  provider_id text not null references provider(id) on delete cascade,
  -- ⚠️ catalog.js 의 **하위** 키입니다 (분류 키를 적으면 아무 데도 안 뜹니다)
  sub         text not null,
  label       text not null,          -- "주 1회 · 8회권"
  amount      bigint not null,        -- 원
  unit        text not null,          -- "8회" · "1개월" · "1회"
  note        text,                   -- "타석 이용료 별도"
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- ⚠️⚠️ 경계값: **0 원도 값입니다** (무료 체험). 음수만 막습니다.
  --   위는 1억을 넘기면 사람이 자릿수를 잘못 적은 것입니다 (99.99% 에서
  --   85조원이 화면에 나간 그 자리 — 작업 기억).
  constraint pprice_amount_ck check (amount >= 0 and amount <= 100000000),
  constraint pprice_label_ck  check (char_length(btrim(label)) between 2 and 60),
  constraint pprice_unit_ck   check (char_length(btrim(unit)) between 1 and 20),
  constraint pprice_note_ck   check (note is null or char_length(note) <= 200)
);
create index if not exists pprice_pv_idx on provider_price (provider_id, active);

alter table provider_price enable row level security;

-- ── 누가 보는가 ─────────────────────────────────────────────────────
-- ⚠️⚠️ 업체는 **제 줄만** 봅니다 (내린 것까지). 남의 가격표를 보면
--   베끼고, 그건 우리가 만들어 준 자리입니다.
drop policy if exists pprice_self on provider_price;
create policy pprice_self on provider_price for select
  using (provider_id = my_provider());

drop policy if exists pprice_staff on provider_price;
create policy pprice_staff on provider_price for select
  using (my_role() in ('staff','admin'));

-- ⚠️ 쓰기 정책을 일부러 안 만들었습니다 — 문 둘만 엽니다.
grant select on provider_price to authenticated;

-- ⚠️⚠️ **그 업체가 하는 일에만** 가격을 답니다. 트리거로 막는 까닭은
--   문(함수)이 내려가는 날에도 이 줄이 남기 때문입니다.
create or replace function pprice_sub_guard() returns trigger
  language plpgsql security definer set search_path = public as $$
declare subs text[];
begin
  select p.subs into subs from provider p where p.id = new.provider_id;
  if subs is null then
    raise exception '그런 업체가 없습니다';
  end if;
  -- ⚠️ coalesce 로 땅에 내려놓습니다 — NULL 이면 if 가 안 걸려 자물쇠가
  --   통째로 열립니다 (0034 에서 겪은 자리).
  if not coalesce(new.sub = any(subs), false) then
    raise exception '그 업체가 하지 않는 일입니다 — 하는 일에 먼저 넣어 주세요 (%)', new.sub;
  end if;
  return new;
end $$;

drop trigger if exists pprice_sub_guard_t on provider_price;
create trigger pprice_sub_guard_t before insert or update on provider_price
  for each row execute function pprice_sub_guard();


-- ════════════════════════════════════════════════════════════════════
-- ① 공개 보기 — ⚠️⚠️ **이 where 절이 자물쇠입니다** (보기는 RLS 를
--    지나지 않습니다). 승인 · 공개 · 검사용 아님 · 내리지 않음 넷을
--    전부 여기서 봅니다.
-- ════════════════════════════════════════════════════════════════════
create or replace view v_provider_price_public as
  select r.id, r.provider_id, r.sub, r.label, r.amount, r.unit, r.note
    from provider_price r
    join provider p on p.id = r.provider_id
   where r.active = true
     and p.listed = true
     and p.is_test = false
     and p.state = 'approved';

grant select on v_provider_price_public to anon, authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ② 문 — 업체가 제 가격을 올리고 고칩니다
--
-- ⚠️⚠️ 업체 **자신**과 운영자만입니다. `my_provider()` 가 NULL 인
--    사람(손님)은 첫 비교가 NULL 이 되므로 coalesce 로 내려놓습니다.
-- ⚠️ 운영자가 대신 올릴 수 있게 둔 까닭: 전화로 받은 가격을 담당자가
--    넣어야 하는 날이 있습니다. 누가 넣었는지는 감사 기록에 남습니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function save_provider_price(p jsonb)
  returns uuid language plpgsql security definer
  set search_path = public as $$
declare
  v_me    uuid := auth.uid();
  v_role  app_role := my_role();
  v_mine  text := my_provider();
  v_id    uuid := nullif(btrim(coalesce(p->>'id', '')), '')::uuid;
  v_pv    text := nullif(btrim(coalesce(p->>'provider', '')), '');
  v_sub   text := nullif(btrim(coalesce(p->>'sub', '')), '');
  v_lab   text := nullif(btrim(coalesce(p->>'label', '')), '');
  v_unit  text := nullif(btrim(coalesce(p->>'unit', '')), '');
  v_note  text := nullif(btrim(coalesce(p->>'note', '')), '');
  v_amt   bigint;
  v_old   provider_price%rowtype;
begin
  if v_me is null then raise exception '가격 등록은 로그인한 뒤에 하실 수 있습니다'; end if;

  -- 고치는 것이면 그 줄의 업체를 씁니다 (업체를 바꿔 옮길 수는 없습니다)
  if v_id is not null then
    select * into v_old from provider_price where id = v_id;
    if not found then raise exception '그런 가격 줄이 없습니다'; end if;
    v_pv := v_old.provider_id;
  end if;

  if v_pv is null then v_pv := v_mine; end if;
  if v_pv is null then raise exception '어느 업체의 가격인지 알 수 없습니다'; end if;
  if not (coalesce(v_pv = v_mine, false)
          or coalesce(v_role in ('staff','admin'), false)) then
    raise exception '내 업체의 가격만 등록할 수 있습니다';
  end if;

  if v_sub is null and v_id is null then
    raise exception '어느 서비스의 가격인지 골라 주세요';
  end if;
  if v_lab is null and v_id is null then
    raise exception '무엇의 가격인지 적어 주세요 (보기: 주 1회 · 8회권)';
  end if;
  if v_unit is null and v_id is null then
    -- ⚠️⚠️ 단위를 안 받으면 "90만원" 이 한 번인지 한 달인지 모릅니다
    raise exception '단위를 적어 주세요 (보기: 8회 · 1개월 · 1회)';
  end if;

  if (p ? 'amount') then
    begin
      v_amt := (p->>'amount')::bigint;
    exception when others then
      raise exception '금액은 숫자로 적어 주세요';
    end;
  elsif v_id is null then
    raise exception '금액을 적어 주세요 (무료면 0 을 적으세요)';
  end if;

  if v_id is null then
    insert into provider_price (provider_id, sub, label, amount, unit, note)
    values (v_pv, v_sub, v_lab, v_amt, v_unit, v_note)
    returning id into v_id;
  else
    update provider_price set
      sub    = coalesce(v_sub, sub),
      label  = coalesce(v_lab, label),
      amount = coalesce(v_amt, amount),
      unit   = coalesce(v_unit, unit),
      -- ⚠️ 덧말은 **지울 수 있어야** 합니다 — coalesce 로 덮으면 한 번
      --   적은 글을 영원히 못 지웁니다. 보낸 꾸러미에 칸이 있으면 그대로.
      note   = case when (p ? 'note') then v_note else note end,
      active = true,
      updated_at = now()
     where id = v_id;
  end if;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, v_role, 'provider_price', v_id::text, 'saved',
          jsonb_build_object('provider', v_pv, 'sub', coalesce(v_sub, v_old.sub)));
  return v_id;
end $$;

revoke all on function save_provider_price(jsonb) from public;
grant execute on function save_provider_price(jsonb) to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ③ 문 — 내립니다 (⚠️ 지우지 않습니다)
-- ════════════════════════════════════════════════════════════════════
create or replace function drop_provider_price(p jsonb)
  returns void language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_role app_role := my_role();
  v_mine text := my_provider();
  v_id   uuid := nullif(btrim(coalesce(p->>'id', '')), '')::uuid;
  r      provider_price%rowtype;
begin
  if v_me is null then raise exception '내리는 것은 로그인한 뒤에 하실 수 있습니다'; end if;
  if v_id is null then raise exception '어느 가격 줄인지 적어 주세요'; end if;
  select * into r from provider_price where id = v_id;
  if not found then raise exception '그런 가격 줄이 없습니다'; end if;
  if not (coalesce(r.provider_id = v_mine, false)
          or coalesce(v_role in ('staff','admin'), false)) then
    raise exception '내 업체의 가격만 내릴 수 있습니다';
  end if;
  if r.active = false then raise exception '이미 내린 가격입니다'; end if;

  update provider_price set active = false, updated_at = now() where id = v_id;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, data)
  values (v_me, v_role, 'provider_price', v_id::text, 'active', 'down',
          jsonb_build_object('provider', r.provider_id, 'sub', r.sub));
end $$;

revoke all on function drop_provider_price(jsonb) from public;
grant execute on function drop_provider_price(jsonb) to authenticated;

insert into schema_version (n, name) values (42, '0042_provider_price')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0043_provider_invite.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0043 — 업체 담당자 **초대** (계정을 업체에 잇는 길)
--        [4차 지시서 §2-1 · §2-7 · §3]
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **여기가 가장 조심해야 하는 자리입니다 — 역할을 올리는
--   길입니다.** 0018 이 그 연결을 **일부러 화면 없이** 두었습니다:
--   "화면에서 역할을 올릴 수 있으면 그게 가장 큰 구멍입니다."
--   그 말은 지금도 맞습니다. 그래서 **아무나 누르는 단추를 만들지
--   않았습니다** — 운영자가 그 업체 앞으로 **한 번 쓰는 초대 코드**를
--   내고, 담당자가 그 코드를 넣어야 이어집니다.
--
--   즉 올리는 것은 여전히 **운영자가 정합니다.** 달라지는 것은
--   사장님이 Supabase SQL 편집기를 열지 않아도 된다는 것뿐입니다.
--
-- ⚠️⚠️ **코드는 가진 사람이 쓰는 열쇠입니다** (bearer). 그래서 —
--     · 한 번만 씁니다 (`used_at`)
--     · 기한이 있습니다 (기본 14일)
--     · 운영자가 거둘 수 있습니다 (`void_at`)
--     · 새로 내면 그 업체의 **안 쓴 옛 코드는 자동으로 거둡니다**
--       (살아 있는 열쇠가 여러 개면 어느 것이 샜는지 모릅니다)
--     · 표에 **읽기 GRANT 를 아무에게도 주지 않습니다** — 운영자도
--       보기(`v_provider_invite_admin`)로만 봅니다
--
-- ⚠️⚠️ **운영자 계정은 이 코드로 업체가 될 수 없습니다** (0021 §10).
--   입찰을 내는 쪽과 입찰을 다 보는 쪽은 같은 계정일 수 없습니다 —
--   그 트리거가 막지만, 문에서 **먼저 사람 말로** 거절합니다.
--
-- ⚠️ 이미 다른 업체에 이어진 계정도 거절합니다. 옮기는 일은 운영자가
--   먼저 끊어야 합니다 (조용히 옮기면 앞 업체의 요청이 통째로
--   남의 눈에 들어갑니다).
-- ════════════════════════════════════════════════════════════════════
begin;

create table if not exists provider_invite (
  code        text primary key,
  provider_id text not null references provider(id) on delete cascade,
  made_by     uuid references auth.users(id) on delete set null,
  made_at     timestamptz not null default now(),
  expires_at  timestamptz not null,
  used_by     uuid references auth.users(id) on delete set null,
  used_at     timestamptz,
  void_at     timestamptz,
  void_why    text,
  constraint pinv_code_ck check (code ~ '^[2-9A-HJ-NP-Z]{10}$')
);
create index if not exists pinv_pv_idx on provider_invite (provider_id, used_at);

alter table provider_invite enable row level security;

-- ⚠️⚠️ **정책을 하나도 만들지 않습니다.** 이 표는 아무도 직접 읽거나
--   쓰지 못합니다 (GRANT 도 없습니다). 운영자가 보는 길은 아래 보기
--   하나이고, 쓰는 길은 문 셋뿐입니다.
--   ⚠️ 보기는 RLS 를 지나지 않으므로 **그 where 절이 자물쇠**입니다 —
--   `my_role()` 을 그 안에서 봅니다.
create or replace view v_provider_invite_admin as
  select i.code, i.provider_id, p.name as provider_name,
         i.made_at, i.expires_at, i.used_at, i.void_at, i.void_why,
         (i.used_at is null and i.void_at is null and i.expires_at > now()) as live
    from provider_invite i
    join provider p on p.id = i.provider_id
   where coalesce(my_role() in ('staff','admin'), false);

grant select on v_provider_invite_admin to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ① 문 — 운영자가 초대 코드를 냅니다
--
-- ⚠️ 글자는 **헷갈리지 않는 것만** 씁니다 (0/O · 1/I/L 을 뺍니다).
--   전화로 불러 주는 자리라 그렇습니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function make_provider_invite(p jsonb)
  returns text language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_role app_role := my_role();
  v_pv   text := nullif(btrim(coalesce(p->>'provider', '')), '');
  v_days int  := greatest(1, least(60, coalesce(nullif(p->>'days','')::int, 14)));
  v_st   text;
  v_code text;
  v_try  int := 0;
  v_abc  text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
begin
  if v_me is null then raise exception '초대는 로그인한 뒤에 하실 수 있습니다'; end if;
  if not coalesce(v_role in ('staff','admin'), false) then
    raise exception '업체 담당자 초대는 직원 · 관리자만 할 수 있습니다';
  end if;
  if v_pv is null then raise exception '어느 업체의 담당자인지 적어 주세요'; end if;

  select state into v_st from provider where id = v_pv;
  if v_st is null then raise exception '그런 업체가 없습니다'; end if;
  -- ⚠️⚠️ 정지된 업체에는 담당자를 새로 들이지 않습니다 — 들어오면
  --   그 사람이 멈춰 있는 업체의 요청을 보게 됩니다.
  if v_st = 'suspended' then
    raise exception '정지된 업체입니다 — 먼저 정지를 풀어 주세요';
  end if;

  -- ⚠️ 살아 있는 옛 코드를 **거둡니다** (열쇠가 여럿이면 어느 것이
  --   샜는지 모릅니다). 쓴 것은 그대로 둡니다 — 기록입니다.
  update provider_invite
     set void_at = now(), void_why = '새 코드를 내면서 거두었습니다'
   where provider_id = v_pv and used_at is null and void_at is null;

  loop
    v_try := v_try + 1;
    v_code := '';
    for i in 1..10 loop
      v_code := v_code || substr(v_abc, 1 + floor(random() * length(v_abc))::int, 1);
    end loop;
    exit when not exists (select 1 from provider_invite where code = v_code);
    if v_try > 20 then raise exception '초대 코드를 만들지 못했습니다'; end if;
  end loop;

  insert into provider_invite (code, provider_id, made_by, expires_at)
  values (v_code, v_pv, v_me, now() + make_interval(days => v_days));

  -- ⚠️ 감사 기록에 **코드를 적지 않습니다** — audit_log 는 오래 남고
  --   보는 사람도 넓습니다. 코드가 거기 있으면 기록이 곧 열쇠입니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, v_role, 'provider_invite', v_pv, 'made',
          jsonb_build_object('days', v_days));
  return v_code;
end $$;

revoke all on function make_provider_invite(jsonb) from public;
grant execute on function make_provider_invite(jsonb) to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ② 문 — 담당자가 코드를 넣어 **이어집니다**
--
-- ⚠️⚠️⚠️ 여기가 역할을 올리는 유일한 길입니다. 막는 것이 넷입니다 —
--     ① 로그인했는가            ② 코드가 살아 있는가 (한 번 · 기한 · 거둠)
--     ③ 운영자가 아닌가 (§10)   ④ 이미 다른 업체에 이어져 있지 않은가
--   넷을 **다른 말로** 거절합니다 (어느 자물쇠가 걸렸는지 알아야 합니다).
-- ════════════════════════════════════════════════════════════════════
create or replace function redeem_provider_invite(p jsonb)
  returns text language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_role app_role := my_role();
  v_mine text := my_provider();
  v_code text := upper(nullif(btrim(coalesce(p->>'code', '')), ''));
  r      provider_invite%rowtype;
  v_name text;
begin
  if v_me is null then raise exception '초대 코드는 로그인한 뒤에 넣으실 수 있습니다'; end if;
  if v_code is null then raise exception '초대 코드를 적어 주세요'; end if;

  -- ⚠️⚠️ **운영자는 업체가 될 수 없습니다** (0021 §10) — 트리거도
  --   막지만 여기서 **먼저 사람 말로** 거절합니다.
  if coalesce(v_role in ('staff','admin'), false) then
    raise exception '운영자 계정은 업체 담당자가 될 수 없습니다 (입찰을 내는 쪽과 보는 쪽은 같은 계정일 수 없습니다)';
  end if;

  select * into r from provider_invite where code = v_code;
  -- ⚠️ **왜 안 되는지 단계마다 다른 말**로 — 같은 말이면 코드를 찍어
  --   보는 사람에게 "있긴 있다" 를 알려 주게 됩니다. 그래서 없는
  --   코드와 끝난 코드는 **같은 말**로 거절합니다 (여기만 일부러 같습니다).
  if not found or r.void_at is not null then
    raise exception '쓸 수 없는 초대 코드입니다 — 운영자에게 새 코드를 받아 주세요';
  end if;
  if r.used_at is not null then
    raise exception '이미 쓰인 초대 코드입니다 — 운영자에게 새 코드를 받아 주세요';
  end if;
  if r.expires_at <= now() then
    raise exception '기한이 지난 초대 코드입니다 — 운영자에게 새 코드를 받아 주세요';
  end if;

  if v_mine is not null then
    if v_mine = r.provider_id then
      raise exception '이미 그 업체의 담당자이십니다';
    end if;
    raise exception '이미 다른 업체에 이어진 계정입니다 — 운영자에게 알려 주세요';
  end if;

  select name into v_name from provider where id = r.provider_id;

  update provider_invite set used_at = now(), used_by = v_me where code = v_code;
  -- ⚠️ account 줄이 없을 수도 있습니다 (0005 의 트리거가 만들지만,
  --   없을 때 조용히 0줄이 바뀌면 "됐다" 고 거짓말하게 됩니다).
  insert into account (id, role, provider_id)
  values (v_me, 'provider', r.provider_id)
  on conflict (id) do update set role = 'provider', provider_id = excluded.provider_id;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, data)
  values (v_me, 'provider', 'account', v_me::text, coalesce(v_role::text, 'none'),
          'provider', jsonb_build_object('provider', r.provider_id));
  return v_name;
end $$;

revoke all on function redeem_provider_invite(jsonb) from public;
grant execute on function redeem_provider_invite(jsonb) to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ③ 문 — 운영자가 코드를 거둡니다
-- ════════════════════════════════════════════════════════════════════
create or replace function void_provider_invite(p jsonb)
  returns void language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_role app_role := my_role();
  v_code text := upper(nullif(btrim(coalesce(p->>'code', '')), ''));
  v_why  text := nullif(btrim(coalesce(p->>'why', '')), '');
  r      provider_invite%rowtype;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if not coalesce(v_role in ('staff','admin'), false) then
    raise exception '초대 코드를 거두는 것은 직원 · 관리자만 할 수 있습니다';
  end if;
  if v_code is null then raise exception '어느 코드인지 적어 주세요'; end if;
  select * into r from provider_invite where code = v_code;
  if not found then raise exception '그런 초대 코드가 없습니다'; end if;
  if r.used_at is not null then raise exception '이미 쓰인 코드는 거둘 수 없습니다'; end if;
  if r.void_at is not null then raise exception '이미 거둔 코드입니다'; end if;
  if v_why is null then raise exception '거두시는 까닭을 적어 주세요'; end if;

  update provider_invite set void_at = now(), void_why = v_why where code = v_code;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'provider_invite', r.provider_id, 'void', v_why, '{}'::jsonb);
end $$;

revoke all on function void_provider_invite(jsonb) from public;
grant execute on function void_provider_invite(jsonb) to authenticated;

insert into schema_version (n, name) values (43, '0043_provider_invite')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0044_contact_ways.sql ---------------------------- */
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

/* ---------------------------- 0045_inquiry.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0045 — 고객센터 문의 접수 (4차 지시서 §11) · 입점 신청의 사업장 주소 (§9)
--
-- ⚠️⚠️ **왜 필요한가.** 고객센터에 "문의 접수" 가 없었습니다. 담을 표도
--   없고, 사업자 정보 여덟 칸이 비어 있어 전화 · 이메일도 적을 수
--   없었습니다 (전자상거래법 제10조 — 없는 연락처를 지어낼 수 없습니다).
--   신고 · 분쟁(0040)은 "어느 요청 · 어느 업체" 를 가리켜야 열리므로
--   **그냥 묻고 싶은 것**을 받을 자리가 한 곳도 없었습니다.
--
-- ⚠️⚠️⚠️ **로그인 없이도 받습니다 — 그래서 자물쇠를 더 겁니다.**
--   0040 은 "익명 신고를 받으면 경쟁사가 하루 백 건을 넣는다" 고 적고
--   로그인을 요구했습니다. 문의는 **로그인 전에 묻는 것**이 보통이라
--   그럴 수가 없습니다. 대신 ① 연락 받을 곳을 반드시 받고 ② 같은
--   연락처로 10분에 한 건 ③ 하루 열 건으로 막습니다.
--   ⚠️ 번호를 바꿔 가며 넣는 것은 **못 막습니다** (IP 를 받지 않습니다 —
--   받기 시작하면 그날부터 처리 항목이 하나 늘어 방침을 같이 고쳐야
--   합니다). 막는 척하지 않고 그 사실을 여기 적어 둡니다.
--
-- ⚠️⚠️ **개인정보보호법 제15조 제2항** — 수집 항목 · 이용 목적 · 보유
--   기간을 동의받는 그 자리에서 같이 보여 줍니다. 화면이 그것을 그리고,
--   여기서는 **동의 시각**을 받아 둡니다 (boolean 으로 두면 "언제
--   받았나" 를 못 댑니다).
--
-- ⚠️ 쓰기 정책도 GRANT 도 주지 않습니다 — 들어오는 길은 문 둘뿐입니다.
--
-- 되돌아갔는지 보는 법
--   select count(*) from information_schema.columns
--    where table_name = 'provider_apply' and column_name = 'addr';   -- 1 이어야 합니다
--   select 1 from pg_proc where proname = 'open_inquiry';            -- 있어야 합니다
-- ════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════
-- ① 입점 신청의 **사업장 주소** (§9 "업체 가입 정보" 목록)
--
-- ⚠️ 받기만 하고 쓰지 않던 칸을 만들지 않습니다 — 화면이 같은 날
--   그 칸을 냅니다 (js/applyform.js).
-- ════════════════════════════════════════════════════════════════════
alter table provider_apply add column if not exists addr text;

-- ⚠️⚠️ **make_apply 를 갈아 끼웁니다** (0027 → 0045). 0027 을 다시 붙여
--   넣으면 이 줄이 **조용히 내려갑니다** — 에러가 안 납니다.
--   내려갔는지 보는 법:
--     select pg_get_functiondef('make_apply(jsonb)'::regprocedure)
--       like '%v_addr%';   -- false 면 0027 이 덮은 것입니다
create or replace function make_apply(p jsonb)
  returns text language plpgsql security definer set search_path = public as $$
declare
  v_company  text := btrim(coalesce(p->>'company', ''));
  v_name     text := btrim(coalesce(p->>'name', ''));
  v_tel      text := btrim(coalesce(p->>'tel', ''));
  v_email    text := nullif(btrim(coalesce(p->>'email', '')), '');
  v_brn      text := nullif(btrim(coalesce(p->>'brn', '')), '');
  v_region   text := nullif(btrim(coalesce(p->>'region', '')), '');
  v_addr     text := nullif(btrim(coalesce(p->>'addr', '')), '');
  v_note     text := nullif(btrim(coalesce(p->>'note', '')), '');
  v_svc      text[] := coalesce(
                 (select array_agg(btrim(x)) from jsonb_array_elements_text(
                    case when jsonb_typeof(p->'services') = 'array'
                         then p->'services' else '[]'::jsonb end) as t(x)
                  where btrim(x) <> ''), '{}'::text[]);
  v_digits   text;
  v_no       text;
begin
  -- ⚠️ 자물쇠마다 **다른 말**로 거절합니다. 같은 말이면 하나를 빼 봐도
  --    다른 것이 먼저 막아 엉뚱한 까닭으로 통과합니다.
  if v_company = '' then raise exception '상호를 적어 주세요'; end if;
  if v_name    = '' then raise exception '담당자 성함을 적어 주세요'; end if;
  if v_tel     = '' then raise exception '연락처를 적어 주세요'; end if;

  if length(v_company) > 80  then raise exception '상호가 너무 깁니다'; end if;
  if length(v_name)    > 40  then raise exception '성함이 너무 깁니다'; end if;
  -- ⚠️ 새 칸도 길이를 막습니다 — 안 막으면 2천 자짜리 주소가 들어옵니다
  if v_addr is not null and length(v_addr) > 200 then
    raise exception '사업장 주소가 너무 깁니다';
  end if;
  if v_note is not null and length(v_note) > 2000 then
    raise exception '남기신 말씀이 너무 깁니다';
  end if;

  v_digits := regexp_replace(v_tel, '[^0-9]', '', 'g');
  -- ⚠️ 경계값: 9자리(02-xxx-xxxx)부터 11자리(010-xxxx-xxxx)까지입니다.
  if length(v_digits) < 9 or length(v_digits) > 11 then
    raise exception '연락처를 다시 봐 주세요 — 숫자 아홉에서 열한 자리입니다';
  end if;

  if array_length(v_svc, 1) is null then
    raise exception '하시는 일을 하나 이상 골라 주세요';
  end if;
  if array_length(v_svc, 1) > 20 then
    raise exception '고르신 항목이 너무 많습니다';
  end if;

  -- ⚠️⚠️ 동의 시각은 **화면이 보낸 값**입니다. 미래이거나 너무 오래된
  --    것은 믿지 않습니다 (개인정보보호법 제15조 — 그 자리에서 받은
  --    동의여야 합니다).
  if (p->>'agree_at') is null then
    raise exception '수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes' then
    raise exception '동의 시각이 미래입니다';
  end if;
  if (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의가 오래되었습니다 — 다시 한 번 눌러 주세요';
  end if;

  -- 중복 · 허위 신청 막기 (지시서 5번 A)
  if exists (
    select 1 from provider_apply
     where regexp_replace(tel, '[^0-9]', '', 'g') = v_digits
       and state = 'new'
       and created_at > now() - interval '10 minutes')
  then
    raise exception '방금 같은 번호로 신청이 들어왔습니다 — 잠시 뒤에 다시 해 주세요';
  end if;

  v_no := 'GA' || to_char(now() at time zone 'Asia/Seoul', 'YYMMDD')
               || '-' || lpad(nextval('apply_no_seq')::text, 4, '0');

  insert into provider_apply
    (no, company, brn, name, tel, email, region, addr, services, note, agree_at)
  values
    (v_no, v_company, v_brn, v_name, v_tel, v_email, v_region, v_addr, v_svc, v_note,
     (p->>'agree_at')::timestamptz);

  -- ⚠️ 감사 기록에 **성함 · 연락처를 넣지 않습니다.** audit_log 는 오래
  --    남고 보는 사람도 넓습니다. 신청번호로 찾아가면 됩니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (auth.uid(), my_role(), 'provider_apply', v_no, 'new', '입점 신청 접수',
          jsonb_build_object('services', v_svc, 'region', v_region));

  return v_no;
end $$;

revoke all on function make_apply(jsonb) from public;
grant execute on function make_apply(jsonb) to anon, authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ② 문의 — 표
-- ════════════════════════════════════════════════════════════════════
create table if not exists inquiry (
  id          uuid primary key default gen_random_uuid(),
  -- 접수번호 — ⚠️ 손님에게 돌려주는 값이라 **저장된 뒤에만** 나갑니다
  no          text not null unique,
  -- use     이용 중 막히는 곳
  -- biz     업체 · 제휴 문의
  -- privacy 개인정보 (열람 · 정정 · 삭제 · 동의 철회)
  -- etc     그 밖
  kind        text not null check (kind in ('use','biz','privacy','etc')),
  body        text not null,
  -- 연락 받을 곳 — ⚠️ 로그인 안 하셔도 넣으시므로 받습니다
  name        text,
  tel         text,
  email       text,
  by_user     uuid references auth.users(id) on delete set null,
  -- ⚠️⚠️ 동의를 **시각으로** 남깁니다 (제15조)
  agree_at    timestamptz not null,
  state       text not null default 'open'
              check (state in ('open','reviewing','answered','closed')),
  answer      text,
  answered_at timestamptz,
  answered_by uuid references auth.users(id) on delete set null,
  memo        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint inquiry_body_ck check (char_length(btrim(body)) between 5 and 2000),
  -- ⚠️⚠️ **답했다고 두려면 답이 있어야 합니다.** 문에서도 받고 여기서도
  --   봅니다 — 문이 내려가는 날 이 줄이 남습니다.
  constraint inquiry_answer_ck check (
    state <> 'answered' or btrim(coalesce(answer,'')) <> ''),
  -- ⚠️⚠️ **답을 보낼 길이 없으면 받지 않습니다.** 로그인하셨으면 계정으로,
  --   아니면 전화나 메일 가운데 하나는 있어야 합니다.
  constraint inquiry_reach_ck check (
    by_user is not null
    or btrim(coalesce(tel,'')) <> ''
    or btrim(coalesce(email,'')) <> '')
);
create index if not exists inquiry_state_idx on inquiry (state, created_at desc);
create index if not exists inquiry_tel_idx
  on inquiry (regexp_replace(coalesce(tel,''), '[^0-9]', '', 'g'), created_at desc);

alter table inquiry enable row level security;

-- ⚠️⚠️ **제 문의만 봅니다.** 남의 문의가 보이면 그 자체가 유출입니다
--   (무엇을 물었는지 · 연락처).
drop policy if exists inquiry_mine on inquiry;
create policy inquiry_mine on inquiry for select
  using (by_user = auth.uid());

drop policy if exists inquiry_staff on inquiry;
create policy inquiry_staff on inquiry for select
  using (my_role() in ('staff','admin'));

-- ⚠️ 쓰기 정책을 일부러 안 만들었습니다 — 문 둘만 엽니다.
grant select on inquiry to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ③ 문 — 문의를 넣습니다 (로그인 없이도)
-- ════════════════════════════════════════════════════════════════════
create or replace function open_inquiry(p jsonb)
  returns text language plpgsql security definer
  set search_path = public as $$
declare
  v_me    uuid := auth.uid();
  v_kind  text := coalesce(nullif(btrim(p->>'kind'), ''), 'etc');
  v_body  text := btrim(coalesce(p->>'body', ''));
  v_name  text := nullif(btrim(coalesce(p->>'name', '')), '');
  v_tel   text := nullif(btrim(coalesce(p->>'tel', '')), '');
  v_email text := nullif(btrim(coalesce(p->>'email', '')), '');
  v_dig   text;
  v_no    text;
begin
  -- ⚠️ 자물쇠마다 **다른 말**로 거절합니다 — 같은 말이면 하나를 빼 봐도
  --    다른 것이 먼저 막아 엉뚱한 까닭으로 통과합니다.
  if v_kind not in ('use','biz','privacy','etc') then
    raise exception '문의 종류를 골라 주세요';
  end if;
  if char_length(v_body) < 5 then
    raise exception '무엇이 궁금하신지 다섯 글자 이상 적어 주세요';
  end if;
  if char_length(v_body) > 2000 then
    raise exception '문의 내용은 이천 글자까지입니다';
  end if;
  if v_name is not null and length(v_name) > 40 then
    raise exception '성함이 너무 깁니다';
  end if;

  if v_tel is not null then
    v_dig := regexp_replace(v_tel, '[^0-9]', '', 'g');
    if length(v_dig) < 9 or length(v_dig) > 11 then
      raise exception '연락처를 다시 봐 주세요 — 숫자 아홉에서 열한 자리입니다';
    end if;
  end if;
  if v_email is not null and v_email !~ '^[^@[:space:]]+@[^@[:space:].]+[.][^@[:space:]]+$' then
    raise exception '메일 주소를 다시 봐 주세요';
  end if;

  -- ⚠️⚠️ **답을 보낼 길이 없으면 받지 않습니다.**
  if v_me is null and v_tel is null and v_email is null then
    raise exception '답을 보내 드릴 전화번호나 메일 주소를 적어 주세요';
  end if;

  -- ⚠️⚠️ 동의 시각 (제15조) — make_apply 와 같은 규칙입니다
  if (p->>'agree_at') is null then
    raise exception '수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes' then
    raise exception '동의 시각이 미래입니다';
  end if;
  if (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의가 오래되었습니다 — 다시 한 번 눌러 주세요';
  end if;

  -- ⚠️⚠️⚠️ **쏟아붓기 막기 — 두 겹입니다.** 로그인한 분은 계정으로,
  --   아니면 전화 숫자로 셉니다. 자물쇠마다 **다른 말**로 거절합니다.
  if v_me is not null then
    if exists (select 1 from inquiry
                where by_user = v_me and created_at > now() - interval '10 minutes') then
      raise exception '방금 문의를 넣으셨습니다 — 잠시 뒤에 해 주세요';
    end if;
    if (select count(*) from inquiry
         where by_user = v_me and created_at > now() - interval '24 hours') >= 10 then
      raise exception '하루에 보내실 수 있는 문의 수를 넘었습니다';
    end if;
  elsif v_dig is not null then
    if exists (select 1 from inquiry
                where regexp_replace(coalesce(tel,''), '[^0-9]', '', 'g') = v_dig
                  and created_at > now() - interval '10 minutes') then
      raise exception '방금 같은 번호로 문의가 들어왔습니다 — 잠시 뒤에 해 주세요';
    end if;
    if (select count(*) from inquiry
         where regexp_replace(coalesce(tel,''), '[^0-9]', '', 'g') = v_dig
           and created_at > now() - interval '24 hours') >= 10 then
      raise exception '하루에 보내실 수 있는 문의 수를 넘었습니다';
    end if;
  end if;

  v_no := 'IQ-' || to_char(now() at time zone 'Asia/Seoul', 'YYMMDD') || '-' ||
          upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 4));

  insert into inquiry (no, kind, body, name, tel, email, by_user, agree_at)
  values (v_no, v_kind, v_body, v_name, v_tel, v_email, v_me,
          (p->>'agree_at')::timestamptz);

  -- ⚠️ 감사 기록에 **성함 · 연락처 · 내용을 넣지 않습니다** — 접수번호로
  --   찾아가면 됩니다. audit_log 는 오래 남고 보는 사람도 넓습니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, my_role(), 'inquiry', v_no, 'open', '문의 접수',
          jsonb_build_object('kind', v_kind));

  return v_no;
end $$;

revoke all on function open_inquiry(jsonb) from public;
grant execute on function open_inquiry(jsonb) to anon, authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ④ 문 — 운영자가 문의를 옮깁니다
--
-- ⚠️⚠️ **답했다고 두려면 답을 같이 받습니다.** 까닭 없이 닫을 수 있으면
--   답하지 않고 닫는 자리가 되고, 그러면 접수가 있으나 마나입니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function move_inquiry(p jsonb)
  returns void language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_role app_role := my_role();
  v_id   uuid := nullif(btrim(coalesce(p->>'id', '')), '')::uuid;
  v_to   text := btrim(coalesce(p->>'to', ''));
  v_ans  text := nullif(btrim(coalesce(p->>'answer', '')), '');
  r      inquiry%rowtype;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  -- ⚠️ coalesce 로 NULL 을 땅에 내려놓습니다 — my_role() 이 NULL 이면
  --    not (NULL) 이 NULL 이라 if 가 **안 걸립니다** (0034 에서 겪었습니다).
  if not coalesce(v_role in ('staff','admin'), false) then
    raise exception '문의 처리는 운영자만 할 수 있습니다';
  end if;
  if v_id is null then raise exception '어느 문의인지 적어 주세요'; end if;
  if v_to not in ('reviewing','answered','closed') then
    raise exception '문의는 확인 중 · 답변함 · 닫음으로만 옮깁니다';
  end if;

  select * into r from inquiry where id = v_id;
  if not found then raise exception '그런 문의가 없습니다'; end if;
  if r.state = v_to then raise exception '이미 %입니다', v_to; end if;
  if r.state = 'closed' then
    raise exception '닫힌 문의는 다시 옮길 수 없습니다';
  end if;
  if v_to = 'answered' and v_ans is null then
    raise exception '무엇이라고 답하셨는지 적어 주세요';
  end if;
  if v_ans is not null and length(v_ans) > 2000 then
    raise exception '답변이 너무 깁니다';
  end if;

  update inquiry
     set state       = v_to,
         answer      = coalesce(v_ans, answer),
         answered_at = case when v_to = 'answered' then now() else answered_at end,
         answered_by = case when v_to = 'answered' then v_me else answered_by end,
         memo        = coalesce(nullif(btrim(coalesce(p->>'memo','')), ''), memo),
         updated_at  = now()
   where id = v_id;

  -- ⚠️ 답 글자는 감사 기록에 넣지 않습니다 (손님 · 운영자가 쓴 글입니다)
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'inquiry', r.no, v_to, '문의 상태 변경',
          jsonb_build_object('kind', r.kind));
end $$;

revoke all on function move_inquiry(jsonb) from public;
grant execute on function move_inquiry(jsonb) to authenticated;

insert into schema_version (n, name) values (45, '0045_inquiry')
  on conflict (n) do nothing;
