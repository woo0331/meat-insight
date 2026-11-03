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
