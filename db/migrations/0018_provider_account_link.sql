-- ════════════════════════════════════════════════════════════════════
-- 0018 — 업체 **계정 연결**이 없으면 배정 가능으로 켜지지 않습니다
--        (2026-10-25 최종 지시서 §5)
--
-- ⚠️⚠️ **왜 필요한가 — 첫 고객의 건이 `배정` 에서 멈추는 자리입니다.**
-- 길 표(`deal_move`)에서 **네 걸음이 업체(provider) 전용**입니다 —
--
--     assigned → accepted    provider
--     accepted → consult     provider
--     consult  → quoted      provider
--     quoted   → nego        provider / customer
--
-- 직원도 관리자도 그 길로 못 갑니다 (일부러 그렇습니다 — 업체가
-- 수락했다는 기록을 직원이 대신 적으면 그 기록의 뜻이 달라집니다).
-- 그래서 **업체 계정이 그 업체에 이어져 있지 않으면** 배정해 놓고
-- 아무도 다음 걸음을 못 밟습니다. 그 연결은 SQL 한 줄이고 화면이
-- 없어서(일부러 — 화면에서 역할을 올릴 수 있으면 그게 가장 큰
-- 구멍입니다) **빠뜨리기 쉬운 자리**입니다.
--
--     update account set role = 'provider', provider_id = '<업체 id>'
--      where id = '<그 담당자의 User UID>';
--
-- 그래서 **배정 가능(`assignable`)을 켜는 자리에서 막습니다.** 켜지지
-- 않으면 배정도 안 되므로(0012 의 `assignment_assignable_guard`),
-- "배정은 됐는데 진행이 안 되는" 건이 생길 수가 없습니다.
--
-- ⚠️ 자물쇠가 **셋**입니다 —
--     ① `approve_provider()`      관리자가 켜는 **문** (사람 말로 거절)
--     ② `provider_link_guard`     표를 직접 고치는 길 (service key 포함)
--     ③ `assignment_assignable()` 배정하는 순간 (연결이 **풀린** 경우)
--   ②는 ①을 지나지 않는 길을 막고, ③은 켜 둔 뒤에 연결이 끊긴
--   경우를 막습니다. 셋이 **다른 말로** 거절합니다 — 같은 말로 거절하면
--   어느 자물쇠가 걸렸는지 모릅니다 (이 저장소가 0003 에서 겪은 자리).
--
-- ⚠️⚠️ **운영 DB 에 자동으로 돌리지 않습니다.** 대표님이 Supabase SQL
-- Editor 에 붙여 넣으십니다.
-- ════════════════════════════════════════════════════════════════════

begin;

-- ── ① 그 업체에 이어진 계정이 있는가 ────────────────────────────────
-- ⚠️ security definer 입니다 — `account` 는 RLS 가 자기 줄만 열어 주는
-- 표라, 관리자가 아닌 사람이 부르면 늘 "없다" 가 됩니다 (그러면 이
-- 자물쇠가 엉뚱하게 걸립니다). `my_role()` 과 같은 방식입니다.
create or replace function provider_linked(p_id text) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from account
     where provider_id = p_id and role = 'provider'
  )
$$;
revoke all on function provider_linked(text) from public;
grant execute on function provider_linked(text) to authenticated;

-- ── ② 표를 직접 고치는 길 ───────────────────────────────────────────
-- ⚠️⚠️ **insert 에도 걸립니다.** `/admin` 9번 칸이 만드는 줄에는
-- `assignable` 이 없어서(기본 꺼짐) 지금 코드로는 안 걸리지만, 손으로
-- SQL 을 쓰실 때 `assignable` 을 같이 넣으면 ①을 지나지 않습니다.
create or replace function provider_link_check() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if new.assignable
     and (tg_op = 'INSERT' or coalesce(old.assignable, false) = false)
     and not provider_linked(new.id) then
    raise exception
      '업체 계정이 이어져 있지 않습니다 — 배정 가능으로 켤 수 없습니다 (%). '
      '그 업체 담당자가 먼저 로그인하신 뒤 '
      'update account set role=''provider'', provider_id=''%'' where id=''<User UID>''; '
      '를 돌려 주세요 (db/README.md)', new.id, new.id;
  end if;
  return new;
end $$;

drop trigger if exists provider_link_guard on provider;
create trigger provider_link_guard
  before insert or update of assignable on provider
  for each row execute function provider_link_check();

-- ── ③ 켜는 문 — 사람 말로 거절합니다 ────────────────────────────────
-- ⚠️⚠️ 인자와 서명은 0012 것 **그대로**입니다 (늘리지 않습니다) —
-- 자리로 부르던 쪽이 안 깨집니다.
create or replace function approve_provider(
  p_id         text,
  p_listed     boolean default null,
  p_verified   jsonb   default null,
  p_why        text    default null,
  p_assignable boolean default null
) returns void
  language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_was boolean; v_wasa boolean;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if my_role() <> 'admin' then
    raise exception '업체 공개 · 확인 배지 · 배정 가능은 관리자만 켤 수 있습니다';
  end if;
  select listed, assignable into v_was, v_wasa from provider where id = p_id;
  if not found then raise exception '없는 업체입니다 — %', p_id; end if;

  -- ⚠️⚠️ 2026-10-25 §5 — **계정 연결이 먼저입니다.** 트리거(②)도 막지만
  -- 여기서 먼저 **사람 말로** 거절해야 관리자가 무엇을 해야 하는지
  -- 압니다 (화면이 이 글을 그대로 보여 줍니다).
  if coalesce(p_assignable, false) and not coalesce(v_wasa, false)
     and not provider_linked(p_id) then
    raise exception '업체 계정이 이어져 있지 않아 배정 가능으로 켤 수 없습니다. '
      '그 업체 담당자가 먼저 로그인하신 뒤 관리자가 SQL 로 계정을 이어 주세요 '
      '(update account set role=''provider'', provider_id=''%'' where id=''<User UID>'')', p_id;
  end if;

  -- ⚠️ null 은 "안 건드림" 입니다 — false 와 갈라 봅니다
  update provider set
    listed     = coalesce(p_listed, listed),
    verified   = coalesce(p_verified, verified),
    assignable = coalesce(p_assignable, assignable)
  where id = p_id;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, 'admin', 'provider', p_id,
          case when v_was then 'listed' else 'hidden' end,
          case when coalesce(p_listed, v_was) then 'listed' else 'hidden' end,
          p_why,
          jsonb_build_object('verified', p_verified,
                             'assignable', coalesce(p_assignable, v_wasa),
                             'linked', provider_linked(p_id)));
end $$;

revoke all on function approve_provider(text, boolean, jsonb, text, boolean)    from public;
grant execute on function approve_provider(text, boolean, jsonb, text, boolean) to authenticated;

-- ── ④ 배정하는 순간 — 연결이 **풀린** 경우 ──────────────────────────
-- ⚠️ 켜 둔 뒤에 `update account set provider_id = null` 이 되면 ① ②를
-- 지나지 않습니다. 그때는 배정해도 업체가 수락할 수 없으니 여기서
-- 막습니다 — ⚠️⚠️ **다른 말로** 거절합니다 (어느 자물쇠인지 알아야
-- 합니다).
-- ⚠️⚠️ **앞의 두 거절 문구는 0012 것 글자까지 그대로입니다.** 바꾸면
-- 그 말을 기다리는 검사가 떨어지고, 더 나쁘게는 화면이 그 글을 그대로
-- 보여 주는 자리가 있어서 안내가 조용히 달라집니다. 늘린 것은 **셋째**
-- 하나입니다.
create or replace function assignment_assignable() returns trigger
  language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  select assignable into ok from provider where id = new.provider_id;
  if not found then
    raise exception '등록된 업체가 아닙니다 — %', new.provider_id;
  end if;
  if not ok then
    raise exception '아직 배정할 수 없는 업체입니다 — % (제휴 계약을 확인하고 /admin 에서 배정 가능으로 켜 주세요)',
      new.provider_id;
  end if;
  if not provider_linked(new.provider_id) then
    raise exception '업체 계정이 이어져 있지 않습니다 — % (배정해도 업체가 '
      '수락 · 상담 · 견적으로 넘길 수 없습니다. 담당자 로그인 뒤 계정을 '
      '이어 주세요)', new.provider_id;
  end if;
  return new;
end $$;

drop trigger if exists assignment_assignable_guard on assignment;
create trigger assignment_assignable_guard
  before insert on assignment
  for each row execute function assignment_assignable();

-- ── ⑤ 어느 업체에 계정이 이어져 있는가 (화면이 보여 주려고) ────────
-- ⚠️⚠️ **왜 함수인가.** 직원은 `account` 에서 **직원 · 관리자 줄만**
-- 볼 수 있습니다 (0012 의 `account_staff` — 고객 성함이 보이면 안 되니
-- 맞는 설계입니다). 그래서 업체 계정을 PostgREST 로는 못 읽습니다 —
-- 화면이 "이 업체는 계정이 안 이어졌습니다" 를 보여 줄 길이 없었습니다.
-- ⚠️ 돌려주는 것은 **업체 id 뿐**입니다 (사람 정보가 아닙니다).
-- ⚠️ 직원 · 관리자만 부를 수 있습니다.
create or replace function linked_providers() returns setof text
  language plpgsql stable security definer set search_path = public as $$
begin
  if my_role() not in ('staff','admin') then
    raise exception '업체 계정 연결 여부는 직원 · 관리자만 볼 수 있습니다';
  end if;
  return query select distinct provider_id from account
                where provider_id is not null and role = 'provider';
end $$;
revoke all on function linked_providers()    from public;
grant execute on function linked_providers() to authenticated;

-- ── ⑥ 판 번호 ──────────────────────────────────────────────────────
insert into schema_version (n, name) values (18, '0018_provider_account_link')
  on conflict (n) do nothing;

commit;
