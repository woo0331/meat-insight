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
