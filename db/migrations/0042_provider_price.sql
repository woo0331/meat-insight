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
