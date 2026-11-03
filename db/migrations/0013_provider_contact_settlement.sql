-- ════════════════════════════════════════════════════════════════════
-- 0013 — 업체 담당자 + 기간별 정산 (2026-10-22 전수검사 P1-13 · P1-14)
--
-- 두 가지를 합니다.
--   ⑬ 업체 **담당자** (이름 · 직통 · 메일)   provider_contact 표 + 문 하나
--   ⑭ **기간별 정산**                      settlement 표를 쓰는 문 둘
--
-- ⚠️⚠️ **왜 담당자를 `provider` 에 안 넣었나** — 0001 의 GRANT 가
--   `grant select on provider to authenticated` 로 **표째**입니다.
--   `provider_public` 정책이 `listed = true` 인 줄을 누구나 읽게
--   열어 두었으니, 거기에 직통 번호를 넣으면 **로그인한 손님 전부가
--   업체 담당자 휴대폰을 봅니다.** RLS 는 줄은 막아도 **칸은 못
--   막습니다** — 이 저장소가 `api/me.js` 의 `PICK` 을 역할마다 손으로
--   적어 둔 까닭 그대로입니다. 그래서 **표를 갈랐습니다.**
--
-- ⚠️⚠️ **`settlement.state` 를 손으로 'paid' 로 만드는 문을 두지
--   않았습니다.** 입금의 진실은 건별 `mark_paid()` 이고, 여기서 또
--   두면 §13 이 금지한 "가짜 정산" 의 길이 하나 더 생깁니다 —
--   `build_settlement()` 이 **세어서** 정합니다.
--
-- ⚠️ 두 번 돌려도 안전합니다 (if not exists · create or replace ·
--   on conflict). 돌린 파일(0001 · 0007)은 **고치지 않았습니다.**
-- ════════════════════════════════════════════════════════════════════

begin;

-- ════════════════════════════════════════════════════════════════════
-- ⑬ 업체 담당자 — 배정하고 **전화할 사람**
--
-- 지금은 배정해도 걸 곳이 업체 대표번호뿐입니다. 대표번호는 낮에
-- 사무실이 받고, 현장에 있는 담당자에게 닿는 데 하루가 갑니다.
-- ⚠️ 손님에게는 **한 글자도 안 나갑니다** (아래 RLS).
-- ════════════════════════════════════════════════════════════════════
create table if not exists provider_contact (
  provider_id text primary key references provider(id) on delete cascade,
  name        text,                      -- 담당자 이름
  tel         text,                      -- 직통 · 휴대폰
  email       text,
  memo        text,                      -- 언제 연락이 되는지 같은 것
  updated_by  uuid references auth.users(id) on delete set null,
  updated_at  timestamptz not null default now()
);

alter table provider_contact enable row level security;

-- ⚠️⚠️ 손님(customer)은 **정책이 없어서 한 줄도 못 봅니다.**
drop policy if exists provider_contact_staff on provider_contact;
create policy provider_contact_staff on provider_contact for select
  using (my_role() in ('staff','admin'));

-- 업체는 **자기 것만** 봅니다 (자기가 적어 준 담당자입니다)
drop policy if exists provider_contact_self on provider_contact;
create policy provider_contact_self on provider_contact for select
  using (provider_id = my_provider());

-- ⚠️⚠️ **읽기만 줍니다.** 쓰기를 주면 기록 없이 지나가는 길이 하나
--   생깁니다 (§8) — 0007 · 0008 과 같은 규칙입니다.
grant select on provider_contact to authenticated;

create or replace function save_provider_contact(
  p_provider text,
  p_data     jsonb default '{}'::jsonb,   -- name · tel · email · memo
  p_why      text  default null
) returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_name  text := nullif(btrim(coalesce(p_data->>'name','')), '');
  v_tel   text := nullif(btrim(coalesce(p_data->>'tel','')), '');
  v_mail  text := nullif(btrim(coalesce(p_data->>'email','')), '');
  v_memo  text := nullif(btrim(coalesce(p_data->>'memo','')), '');
  v_keys  text[] := '{}';
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if v_role not in ('staff','admin') then
    raise exception '업체 담당자 등록은 직원 · 관리자만 할 수 있습니다';
  end if;
  if not exists (select 1 from provider where id = p_provider) then
    raise exception '없는 업체입니다 — %', coalesce(p_provider,'(없음)');
  end if;
  -- ⚠️ 넷이 다 비면 **줄을 만들지 않습니다** (빈 줄을 안 남깁니다 ·
  --   절대 규칙 2). 지우실 때는 넷을 비워서 보내시면 됩니다.
  if v_name is null and v_tel is null and v_mail is null and v_memo is null then
    delete from provider_contact where provider_id = p_provider;
    insert into audit_log (by_user, by_role, obj, obj_id, to_state, why)
    values (v_me, v_role, 'provider_contact', p_provider, 'cleared', p_why);
    return p_provider;
  end if;
  if v_mail is not null and position('@' in v_mail) < 2 then
    raise exception '메일 주소가 이상합니다';
  end if;

  insert into provider_contact (provider_id, name, tel, email, memo, updated_by)
  values (p_provider, v_name, v_tel, v_mail, v_memo, v_me)
  on conflict (provider_id) do update set
    name = excluded.name, tel = excluded.tel, email = excluded.email,
    memo = excluded.memo, updated_by = excluded.updated_by,
    updated_at = now();

  -- ⚠️⚠️ **감사 기록에 연락처를 싣지 않습니다.** 감사 기록은 고칠 수도
  --   지울 수도 없는 것이라, 거기에 번호를 박으면 그 자체가 또 하나의
  --   보관입니다 (`note_request_open` 과 같은 규칙). 적는 것은 **어느
  --   칸이 채워졌는가**까지입니다.
  -- ⚠️ `v_keys || 'name'` 으로 적으면 **"malformed array literal"** 입니다
  --   (plpgsql 이 오른쪽을 배열로 캐스팅하려 듭니다). 실제 Postgres 에서
  --   돌려 보고 알았습니다 — `array_append()` 를 씁니다.
  if v_name is not null then v_keys := array_append(v_keys, 'name');  end if;
  if v_tel  is not null then v_keys := array_append(v_keys, 'tel');   end if;
  if v_mail is not null then v_keys := array_append(v_keys, 'email'); end if;
  if v_memo is not null then v_keys := array_append(v_keys, 'memo');  end if;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'provider_contact', p_provider, 'saved', p_why,
          jsonb_build_object('fields', to_jsonb(v_keys)));

  return p_provider;
end $$;

revoke all on function save_provider_contact(text, jsonb, text) from public;
grant execute on function save_provider_contact(text, jsonb, text) to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ⑭ 기간별 정산 — **세는 값**입니다
--
-- `settlement` 표는 0001 부터 있었고 **아무 함수도 안 썼습니다.**
-- 업체마다 월 단위로 "이번 달 확정 수수료가 얼마고 얼마가 들어왔나"
-- 를 묶어 보는 자리입니다.
--
-- ⚠️⚠️ **`total` 은 그 시점의 사본**입니다 (정책 사본과 같은 까닭) —
--   나중에 요율이나 계약금액이 바뀌어도 이미 보낸 청구서가 따라
--   바뀌면 안 됩니다. 다시 세시려면 같은 기간으로 한 번 더 부르면
--   덮습니다.
-- ⚠️⚠️ **state 를 손으로 'paid' 로 만들 수 없습니다.** 건별
--   `mark_paid()` 가 진실이고, 이 함수는 그걸 **세어서** 정합니다.
-- ════════════════════════════════════════════════════════════════════
create unique index if not exists settlement_span_uniq
  on settlement (provider_id, from_date, to_date);

create or replace function build_settlement(
  p_provider text,
  p_from     date,
  p_to       date,
  p_why      text default null
) returns uuid
  language plpgsql security definer set search_path = public as $$
declare
  v_me    uuid     := auth.uid();
  v_role  app_role := my_role();
  v_total bigint;
  v_paid  bigint;
  v_n     int;
  v_state text;
  v_id    uuid;
  v_was   text;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  -- ⚠️⚠️ **관리자만**입니다 (§8 · 돈이 걸린 자리). 계약을 따는 사람과
  --   청구서를 만드는 사람이 같으면 아무도 교차 확인을 안 합니다.
  if v_role <> 'admin' then
    raise exception '정산은 관리자만 만들 수 있습니다';
  end if;
  if p_from is null or p_to is null then
    raise exception '기간이 없습니다';
  end if;
  if p_from > p_to then
    raise exception '기간이 거꾸로입니다 — % ~ %', p_from, p_to;
  end if;
  if not exists (select 1 from provider where id = p_provider) then
    raise exception '없는 업체입니다 — %', coalesce(p_provider,'(없음)');
  end if;

  -- ⚠️⚠️ **확정된 것만** 셉니다 (`fee_at` 이 있는 줄). 확정 전인 건을
  --   계약금액으로 섞으면 받을 돈이 열 배로 부풀려집니다 — 1,000만원
  --   계약의 수수료가 30만원인 그 자리입니다 (미수금에서 겪었습니다).
  select coalesce(sum(coalesce(d.fee_total, d.fee)), 0), count(*)
    into v_total, v_n
    from deal d
   where d.provider_id = p_provider
     and d.fee_at is not null
     and d.fee_at::date between p_from and p_to;

  -- 들어온 돈은 **입금한 날**로 셉니다 (확정한 날이 아닙니다)
  select coalesce(sum(coalesce(d.paid, 0)), 0)
    into v_paid
    from deal d
   where d.provider_id = p_provider
     and d.paid_at is not null
     and d.paid_at::date between p_from and p_to;

  -- ⚠️ 셀 것이 하나도 없으면 **줄을 만들지 않습니다** (절대 규칙 2).
  --   "0원 청구서" 는 청구서가 아닙니다.
  if v_n = 0 then
    raise exception '그 기간에 확정된 수수료가 없습니다 — % ~ %', p_from, p_to;
  end if;

  v_state := case when v_paid >= v_total then 'paid' else 'wait' end;

  -- ⚠️⚠️ **보류(hold)는 덮지 않습니다.** 사람이 세워 둔 것인데 다시
  --   세면서 풀어 버리면 왜 멈췄는지가 사라집니다.
  select id, state into v_id, v_was
    from settlement
   where provider_id = p_provider and from_date = p_from and to_date = p_to;
  if v_was = 'hold' then v_state := 'hold'; end if;

  -- ⚠️⚠️ **처음 만들 때도 입금일을 적습니다.** 전에는 `on conflict` 쪽에만
  --   적어 두어서, **첫 집계가 바로 'paid' 인 달**(확정과 입금이 같은
  --   기간에 다 끝난 달)은 상태가 입금인데 `paid_at` 이 비어 있었습니다 —
  --   화면이 "언제 들어왔나" 를 못 대는 꼴입니다. 실제 Postgres 로
  --   돌려 보고 잡았습니다.
  insert into settlement (provider_id, from_date, to_date, total, state,
                          approved_by, approved_at, paid_at)
  values (p_provider, p_from, p_to, v_total, v_state, v_me, now(),
          case when v_state = 'paid' then now() else null end)
  on conflict (provider_id, from_date, to_date) do update set
    total = excluded.total, state = excluded.state,
    approved_by = excluded.approved_by, approved_at = now(),
    paid_at = case when excluded.state = 'paid'
                   then coalesce(settlement.paid_at, now()) else null end
  returning id into v_id;

  -- ⚠️ 금액은 기록에 남겨도 됩니다 — 개인정보가 아니고, §8 이 "변경자 ·
  --   변경일시 · 사유" 와 함께 남기라고 한 바로 그 값입니다.
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, v_role, 'settlement', v_id::text, v_was, v_state, p_why,
          jsonb_build_object('provider', p_provider, 'from', p_from, 'to', p_to,
                             'total', v_total, 'paid', v_paid, 'deals', v_n));

  return v_id;
end $$;

revoke all on function build_settlement(text, date, date, text) from public;
grant execute on function build_settlement(text, date, date, text) to authenticated;


-- ⚠️⚠️ 보류 ↔ 대기만 바꿉니다. **'paid' 로 가는 길이 없습니다** —
--   입금은 건별 `mark_paid()` 가 진실이고 `build_settlement()` 이
--   세어서 정합니다 (§13 가짜 정산 금지).
create or replace function hold_settlement(
  p_id   uuid,
  p_hold boolean,
  p_why  text default null
) returns void
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_was  text;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if v_role <> 'admin' then
    raise exception '정산 보류는 관리자만 할 수 있습니다';
  end if;
  select state into v_was from settlement where id = p_id;
  if v_was is null then raise exception '없는 정산입니다'; end if;
  -- ⚠️⚠️ 들어온 돈을 보류로 덮지 않습니다 — 그건 기록을 거짓으로
  --   만드는 것입니다.
  if v_was = 'paid' then
    raise exception '이미 입금으로 집계된 정산입니다 — 보류로 바꿀 수 없습니다';
  end if;
  -- ⚠️ 사유 없는 보류는 다음 사람이 어떻게 다룰지 모릅니다 (§8)
  if p_hold and nullif(btrim(coalesce(p_why,'')), '') is null then
    raise exception '보류 사유를 적어 주세요';
  end if;

  update settlement set state = case when p_hold then 'hold' else 'wait' end
   where id = p_id;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why)
  values (v_me, v_role, 'settlement', p_id::text, v_was,
          case when p_hold then 'hold' else 'wait' end, p_why);
end $$;

revoke all on function hold_settlement(uuid, boolean, text) from public;
grant execute on function hold_settlement(uuid, boolean, text) to authenticated;


insert into schema_version (n, name) values (13, '0013_provider_contact_settlement')
  on conflict (n) do nothing;

commit;
