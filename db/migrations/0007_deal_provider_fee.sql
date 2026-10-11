-- ════════════════════════════════════════════════════════════════════
-- 0007 — 2차 "수익을 기록한다" (전면 감사 §6 의 5 · 6 · 7)
--
-- ⚠️⚠️ **왜 이 파일이 생겼나 — 0003 이 만든 문에 길이 없었습니다.**
--   `confirm_fee(p_deal …)` 는 `deal` 한 줄을 받아야 하는데, **그 줄을
--   만드는 길이 어디에도 없었습니다.** 0004 의 move_state 는
--   `nego → signed` 에서 계약금액을 **감사 기록에만** 적고 지나갑니다.
--   그래서 상태는 "계약 완료" 인데 `deal` 표는 비어 있고, 관리자가
--   수수료를 확정하려 해도 **확정할 대상이 없었습니다.**
--   1차에서 "`api/deal.js` 를 아무 화면도 안 불렀다" 로 겪은 것과
--   같은 자리이고, 이번에는 **DB 안쪽**이었습니다.
--
-- ⚠️⚠️ **등록 · 승인 · 정책도 길이 없었습니다.** 0001 의 GRANT 는
--   `authenticated` 에게 **insert 를 한 줄도 주지 않습니다** (읽기는
--   select, 쓰기는 정해진 칸의 update 뿐). RLS 에 `provider_admin` ·
--   `fee_admin` 이 `for all` 로 있어도 **GRANT 가 없으면 아무것도 안
--   됩니다** — 이 저장소가 "GRANT 와 RLS 는 다른 자물쇠" 로 적어 둔
--   그대로입니다. 그래서 여기서도 **표를 열지 않고 문을 만듭니다.**
--
--   ① deal 줄 만들기      move_state 안에서 (계약 · 완료 시각)
--   ② 업체 등록 · 수정    save_provider()     직원 · 관리자
--   ③ 업체 공개 · 확인    approve_provider()  ⚠️ 관리자만
--   ④ 수수료 정책 등록    save_fee_policy()   ⚠️ 관리자만
--   ⑤ 정책 끄기           set_fee_policy_active()  ⚠️ 관리자만
--
-- ⚠️ 두 번 돌려도 안전합니다 (create or replace · on conflict).
-- ⚠️⚠️ 0004 를 **고치지 않았습니다** — 돌린 파일은 그대로 두고 여기서
--   `create or replace` 합니다 (db/README.md 의 규칙).
-- ════════════════════════════════════════════════════════════════════

begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 계약(deal) 줄은 **상태가 계약 완료로 갈 때** 생깁니다
--
-- ⚠️⚠️ **따로 만드는 함수를 두지 않았습니다.** 두면 "상태는 signed 인데
--   deal 이 없는" 또는 "deal 은 있는데 상태가 nego 인" 짝이 생깁니다 —
--   §8 이 막으라고 한 것이 바로 그런 어긋남입니다. 한 트랜잭션 안에서
--   같이 움직이게 둡니다.
-- ⚠️ 어느 업체와의 계약인가 — **수락한 업체**입니다. 여러 곳에 보냈어도
--   계약은 한 곳과 합니다. 못 고르면 **지어내지 않고 거절**합니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function move_state(
  p_request uuid,
  p_to      deal_state,
  p_ctx     jsonb default '{}'::jsonb
) returns deal_state
  language plpgsql security definer set search_path = public as $$
declare
  v_from  deal_state;
  v_role  app_role := my_role();
  v_me    uuid      := auth.uid();
  v_needs text[];
  v_miss  text[]    := '{}';
  v_k     text;
  v_why   text      := nullif(btrim(coalesce(p_ctx->>'why','')), '');
  v_money boolean;
  v_pv    text;
  v_n     int;
begin
  if v_me is null then
    raise exception '변경자를 알 수 없습니다 — 로그인한 세션에서만 됩니다';
  end if;
  if v_role is null then
    raise exception '역할이 없습니다';
  end if;

  select state into v_from from request where id = p_request;
  if v_from is null then raise exception '없는 신청입니다'; end if;
  if v_from = p_to  then raise exception '같은 상태입니다'; end if;

  -- ⚠️⚠️ 돈이 걸린 상태는 이 문으로 안 갑니다 (§9 가 증빙과 정책
  -- 사본을 더 받으라고 적었습니다)
  select money into v_money from (
    select true as money where p_to in ('fee_wait','fee_done')
  ) t;
  if coalesce(v_money, false) then
    raise exception '수수료·정산 상태는 confirm_fee() · mark_paid() 로만 바꿉니다';
  end if;

  -- 갈 수 있는 길인가 · 이 역할이 갈 수 있는가
  select needs into v_needs from deal_move
   where from_state = v_from and to_state = p_to and role = v_role;
  if not found then
    -- 길 자체가 없는 것과 역할이 모자란 것을 갈라서 말해 줍니다
    if exists (select 1 from deal_move where from_state = v_from and to_state = p_to) then
      raise exception '이 변경은 %(으)로는 할 수 없습니다', v_role;
    end if;
    raise exception '갈 수 없는 길입니다 — % → %', v_from, p_to;
  end if;

  -- 같이 적어야 하는 것
  -- ⚠️ `0` 과 `false` 는 값입니다 — 있는지만 봅니다 (키가 있고 null 이
  --    아니면 적은 것). 권리금 "무권리" 에서 겪은 자리입니다.
  foreach v_k in array v_needs loop
    if p_ctx->v_k is null or jsonb_typeof(p_ctx->v_k) = 'null'
       or (jsonb_typeof(p_ctx->v_k) = 'string' and btrim(p_ctx->>v_k) = '')
    then v_miss := v_miss || v_k; end if;
  end loop;
  if array_length(v_miss, 1) is not null then
    raise exception '같이 적어야 하는 것이 빠졌습니다 — %', array_to_string(v_miss, ' · ');
  end if;

  -- ⚠️⚠️ 배정은 **제3자 제공**입니다 (개인정보보호법 제17조 제2항).
  -- 접수 단계의 동의에는 포함되지 않습니다 — 방침 제4조 제3항.
  if p_to = 'assigned' then
    if (p_ctx->>'agree3rd') is distinct from 'true' then
      raise exception '업체에 연락처를 전달하는 별도 동의를 받지 못했습니다';
    end if;
    if not exists (select 1 from provider where id = p_ctx->>'providerId') then
      raise exception '없는 업체입니다 — %', p_ctx->>'providerId';
    end if;
    -- 배정 줄을 같이 만듭니다. ⚠️ agree3rd_at 이 not null 이라
    -- 동의 시각 없이는 여기서 막힙니다 (한 번 더).
    insert into assignment (request_id, provider_id, agree3rd_at, by_user, why)
    values (p_request, p_ctx->>'providerId', now(), v_me, v_why)
    on conflict (request_id, provider_id) do update
      set state = 'sent', agree3rd_at = now(), by_user = v_me;
    -- 제3자 제공 시각을 신청에도 남깁니다 (언제 동의받았나)
    update request set agree3rd_at = now() where id = p_request;
  end if;

  -- ══ 2026-10-11 2차 — 계약(deal) 줄 ════════════════════════════════
  -- ⚠️⚠️ 여기가 없어서 `confirm_fee()` 가 **확정할 대상이 없었습니다.**
  if p_to = 'signed' then
    -- 어느 업체와의 계약인가 — ① ctx 에 적어 주셨으면 그것,
    -- ② 아니면 **수락한 업체**, ③ 그것도 없으면 배정이 하나뿐일 때 그곳.
    -- ⚠️⚠️ 못 고르면 **지어내지 않고 거절**합니다 (절대 규칙 1).
    v_pv := nullif(btrim(coalesce(p_ctx->>'providerId','')), '');
    if v_pv is not null then
      if not exists (select 1 from assignment
                      where request_id = p_request and provider_id = v_pv) then
        raise exception '이 신청에 배정되지 않은 업체입니다 — %', v_pv;
      end if;
    else
      select count(*) into v_n from assignment
       where request_id = p_request and state = 'accepted';
      if v_n = 1 then
        select provider_id into v_pv from assignment
         where request_id = p_request and state = 'accepted';
      else
        select count(*) into v_n from assignment where request_id = p_request;
        if v_n = 1 then
          select provider_id into v_pv from assignment where request_id = p_request;
        elsif v_n = 0 then
          raise exception '배정된 업체가 없어 계약을 만들 수 없습니다';
        else
          raise exception '어느 업체와의 계약인지 골라 주세요 (배정 %건)', v_n;
        end if;
      end if;
    end if;

    -- ⚠️ `amount` 는 길 표가 이미 받아 두었습니다 (needs = {amount}).
    -- ⚠️⚠️ 한 신청에 계약은 하나입니다 — 두 번 눌러도 덮어씁니다
    --    (새 줄을 만들면 수수료를 어느 줄에 확정할지 갈립니다).
    insert into deal (request_id, provider_id, amount, signed_at)
    values (p_request, v_pv, (p_ctx->>'amount')::bigint, now())
    on conflict (request_id) do update
      set provider_id = excluded.provider_id,
          amount      = excluded.amount,
          signed_at   = now();
  end if;

  -- 서비스 완료 시각 — ⚠️ 수수료 확정이 "done 에서만" 되므로 이 시각이
  -- 곧 청구가 열린 날입니다 (§9 정산 주기의 기준).
  if p_to = 'done' then
    update deal set done_at = now() where request_id = p_request;
  end if;

  update request set state = p_to where id = p_request;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, v_role, 'request', p_request::text, v_from, p_to, v_why,
          p_ctx - 'why');

  return p_to;
end $$;

-- ⚠️⚠️ 한 신청에 계약 하나 — 위 `on conflict (request_id)` 가 기댈
-- 제약입니다. 없으면 `on conflict` 자체가 터집니다.
-- ⚠️ 이미 두 줄이 있는 DB 에서는 유일 제약이 안 걸립니다 — 그때는
--    사람이 보고 지워야 합니다 (조용히 지우지 않습니다).
create unique index if not exists deal_request_uniq on deal (request_id);


-- ════════════════════════════════════════════════════════════════════
-- ② 업체 등록 · 수정 (§6 "제휴업체 등록")
--
-- ⚠️⚠️ **`verified` 와 `listed` 를 받지 않습니다.** 확인 배지는 저희가
--   서류를 실제로 본 것만 켜고, 공개 여부는 관리자가 따로 켭니다 —
--   등록 화면에서 같이 받으면 "등록하면 저절로 다 켜지는구나" 가 되고
--   그건 지어낸 신뢰입니다 (절대 규칙 1). ③ 이 그 문입니다.
-- ⚠️ 평점 · 후기 수 · 작업 수를 받는 칸이 **없습니다** — 배열에서
--   셉니다 (값으로 저장하면 누가 4.9 를 적어 넣습니다).
-- ════════════════════════════════════════════════════════════════════
create or replace function save_provider(
  p_id    text,
  p_name  text,
  p_data  jsonb default '{}'::jsonb,   -- intro · regions · gu · industries · subs · since · consultHours
  p_why   text default null
) returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_role app_role := my_role();
  v_new  boolean;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if v_role not in ('staff','admin') then
    raise exception '업체 등록은 직원 · 관리자만 할 수 있습니다';
  end if;

  -- ⚠️⚠️ id 는 **주소가 됩니다** (`/p/<id>`). 한글을 넣으면 주소가
  -- 퍼센트 인코딩으로 길어지고 공유할 때 깨집니다.
  if p_id is null or p_id !~ '^[a-z0-9][a-z0-9-]*$' then
    raise exception '주소가 될 값은 영문 소문자 · 숫자 · 붙임표만 됩니다 — %', coalesce(p_id,'(없음)');
  end if;
  if p_name is null or btrim(p_name) = '' then
    raise exception '업체명이 없습니다';
  end if;
  -- ⚠️⚠️ `subs`(하는 일)가 비면 **아무 분류에도 안 걸립니다.** 지역과
  -- 업종은 안 적으면 "전국 · 전업종" 으로 읽는 게 말이 되지만, 하는
  -- 일을 안 적은 것을 "전부 다 합니다" 로 읽으면 인테리어 업체가
  -- 세무 화면에 앉습니다.
  if coalesce(jsonb_array_length(coalesce(p_data->'subs','[]'::jsonb)), 0) = 0 then
    raise exception '하는 일(하위 분야)이 비어 있습니다 — 비면 아무 분류에도 안 걸립니다';
  end if;

  v_new := not exists (select 1 from provider where id = p_id);

  insert into provider (id, name, intro, regions, gu, industries, subs,
                        since, consult_hours)
  values (
    p_id,
    btrim(p_name),
    nullif(btrim(coalesce(p_data->>'intro','')), ''),
    coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'regions','[]'::jsonb)) x), '{}'),
    coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'gu','[]'::jsonb)) x), '{}'),
    coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'industries','[]'::jsonb)) x), '{}'),
    coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'subs','[]'::jsonb)) x), '{}'),
    nullif(p_data->>'since','')::int,
    nullif(btrim(coalesce(p_data->>'consultHours','')), '')
  )
  on conflict (id) do update set
    name = excluded.name, intro = excluded.intro,
    regions = excluded.regions, gu = excluded.gu,
    industries = excluded.industries, subs = excluded.subs,
    since = excluded.since, consult_hours = excluded.consult_hours;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'provider', p_id,
          case when v_new then 'created' else 'updated' end, p_why, p_data);

  return p_id;
end $$;


-- ════════════════════════════════════════════════════════════════════
-- ③ 업체 공개 · 확인 배지 — ⚠️⚠️ **관리자만** (§7 "관리자 승인")
--
-- ⚠️⚠️ 확인 배지는 **플랫폼이 서류를 실제로 본 것만** 켭니다. 업체가
--   "확인했다" 고 말했다고 켜면 그건 지어낸 신뢰이고 표시 · 광고의
--   공정화에 관한 법률 제3조입니다. 그래서 ② 와 **다른 문**이고 역할도
--   다릅니다 — 한 사람이 등록하고 자기가 승인하면 교차 확인이 없습니다
--   (계약을 따는 사람과 수수료를 확정하는 사람을 가른 것과 같은 까닭).
-- ════════════════════════════════════════════════════════════════════
create or replace function approve_provider(
  p_id       text,
  p_listed   boolean default null,
  p_verified jsonb   default null,
  p_why      text    default null
) returns void
  language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_was boolean;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if my_role() <> 'admin' then
    raise exception '업체 공개 · 확인 배지는 관리자만 켤 수 있습니다';
  end if;
  select listed into v_was from provider where id = p_id;
  if not found then raise exception '없는 업체입니다 — %', p_id; end if;

  -- ⚠️ null 은 "안 건드림" 입니다 — false 와 갈라 봅니다 (0 과 빈 칸을
  --    가르는 것과 같은 규칙).
  update provider set
    listed   = coalesce(p_listed, listed),
    verified = coalesce(p_verified, verified)
  where id = p_id;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, 'admin', 'provider', p_id,
          case when v_was then 'listed' else 'hidden' end,
          case when coalesce(p_listed, v_was) then 'listed' else 'hidden' end,
          p_why, jsonb_build_object('verified', p_verified));
end $$;


-- ════════════════════════════════════════════════════════════════════
-- ④ 수수료 정책 등록 (§6 "수수료 정책 등록" · §9)
--
-- ⚠️⚠️ **정책을 고쳐도 지난 계약은 안 바뀝니다.** 계약에는 `fee_snap`
--   으로 **사본**이 박히기 때문입니다 (0001 의 주석). 그래서 여기서는
--   마음 놓고 고칠 수 있고, 그것이 §9 가 요구한 것입니다.
-- ⚠️ 제약(요율 0 초과 100 이하 · 최소 ≤ 최대 · 날짜 순서)은 0001 의
--   `fee_rate_range` 들이 이미 들고 있습니다 — 여기서 또 적지 않습니다.
--   두 곳에 적으면 어긋나는 날이 옵니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function save_fee_policy(
  p_provider text,
  p_data     jsonb,
  p_id       uuid default null,
  p_why      text default null
) returns uuid
  language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_id uuid;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if my_role() <> 'admin' then
    raise exception '수수료 정책은 관리자만 등록할 수 있습니다';
  end if;
  if not exists (select 1 from provider where id = p_provider) then
    raise exception '없는 업체입니다 — %', p_provider;
  end if;
  if p_data->>'type' is null then raise exception '수익모델이 없습니다'; end if;

  if p_id is null then
    insert into fee_policy (provider_id, offer_id, type, flat, rate,
                            min_fee, max_fee, vat, confirm_when, cycle,
                            refund_rule, from_date, to_date)
    values (p_provider,
            nullif(btrim(coalesce(p_data->>'offerId','')), ''),
            (p_data->>'type')::fee_type,
            nullif(p_data->>'flat','')::bigint,
            nullif(p_data->>'rate','')::numeric,
            nullif(p_data->>'minFee','')::bigint,
            nullif(p_data->>'maxFee','')::bigint,
            coalesce(nullif(p_data->>'vat','')::fee_vat, 'add'),
            coalesce(nullif(p_data->>'confirmWhen','')::fee_when, 'done'),
            coalesce(nullif(p_data->>'cycle','')::fee_cycle, 'monthly'),
            nullif(btrim(coalesce(p_data->>'refundRule','')), ''),
            nullif(p_data->>'fromDate','')::date,
            nullif(p_data->>'toDate','')::date)
    returning id into v_id;
  else
    update fee_policy set
      offer_id     = nullif(btrim(coalesce(p_data->>'offerId','')), ''),
      type         = (p_data->>'type')::fee_type,
      flat         = nullif(p_data->>'flat','')::bigint,
      rate         = nullif(p_data->>'rate','')::numeric,
      min_fee      = nullif(p_data->>'minFee','')::bigint,
      max_fee      = nullif(p_data->>'maxFee','')::bigint,
      vat          = coalesce(nullif(p_data->>'vat','')::fee_vat, 'add'),
      confirm_when = coalesce(nullif(p_data->>'confirmWhen','')::fee_when, 'done'),
      cycle        = coalesce(nullif(p_data->>'cycle','')::fee_cycle, 'monthly'),
      refund_rule  = nullif(btrim(coalesce(p_data->>'refundRule','')), ''),
      from_date    = nullif(p_data->>'fromDate','')::date,
      to_date      = nullif(p_data->>'toDate','')::date
    where id = p_id and provider_id = p_provider
    returning id into v_id;
    if v_id is null then raise exception '없는 정책입니다'; end if;
  end if;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, 'admin', 'fee_policy', v_id::text,
          case when p_id is null then 'created' else 'updated' end, p_why, p_data);
  return v_id;
end $$;

-- 정책 끄기 · 켜기 — ⚠️ **지우지 않습니다.** 지난 계약이 그 정책의
-- 사본을 들고 있고, 기록에서 "그때 무엇을 썼는가" 가 사라지면 안 됩니다.
create or replace function set_fee_policy_active(
  p_id uuid, p_active boolean, p_why text default null
) returns void
  language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_was boolean;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if my_role() <> 'admin' then
    raise exception '수수료 정책은 관리자만 바꿀 수 있습니다';
  end if;
  if p_active is null then raise exception '켤지 끌지가 없습니다'; end if;
  select active into v_was from fee_policy where id = p_id;
  if not found then raise exception '없는 정책입니다'; end if;

  update fee_policy set active = p_active where id = p_id;
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why)
  values (v_me, 'admin', 'fee_policy', p_id::text,
          case when v_was then 'active' else 'off' end,
          case when p_active then 'active' else 'off' end, p_why);
end $$;


-- ⚠️⚠️ **문만 엽니다.** 표에 insert 권한을 주지 않습니다 — 주면
-- 기록 없이 지나가는 길이 하나 생깁니다 (§8).
revoke all on function move_state(uuid, deal_state, jsonb)          from public;
revoke all on function save_provider(text, text, jsonb, text)       from public;
revoke all on function approve_provider(text, boolean, jsonb, text) from public;
revoke all on function save_fee_policy(text, jsonb, uuid, text)     from public;
revoke all on function set_fee_policy_active(uuid, boolean, text)   from public;
grant execute on function move_state(uuid, deal_state, jsonb)          to authenticated;
grant execute on function save_provider(text, text, jsonb, text)       to authenticated;
grant execute on function approve_provider(text, boolean, jsonb, text) to authenticated;
grant execute on function save_fee_policy(text, jsonb, uuid, text)     to authenticated;
grant execute on function set_fee_policy_active(uuid, boolean, text)   to authenticated;

-- 판 번호 (db/README.md) — ⚠️ 칸 이름은 0002 의 것입니다 (n · name)
insert into schema_version (n, name) values (7, '0007_deal_provider_fee')
on conflict (n) do nothing;

commit;
