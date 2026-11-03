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
