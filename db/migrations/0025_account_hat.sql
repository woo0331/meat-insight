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
