-- ════════════════════════════════════════════════════════════════════
-- 0004 — 상태를 바꾸는 **문 하나** (§8)
--
-- ⚠️⚠️ **왜 이 파일이 생겼나** — 0003 이 돈 쪽(confirm_fee · mark_paid ·
--   clawback_fee)에 문을 하나씩 만들어 기록을 강제했는데, **나머지 열
--   상태는 그대로 뚫려 있었습니다.** `request` 에 로그인 사용자 쓰기
--   권한이 없으니 서버(service key)만 바꿀 수 있고, 그 길에는
--   **감사 기록을 남기라는 강제가 없습니다.** §8 은 "모든 중요한 상태
--   변경" 이라고 적었지 "돈 관련 변경" 이라고 적지 않았습니다.
--
-- ⚠️⚠️ **길을 plpgsql 에 손으로 적지 않았습니다.** `js/data/deal.js` 의
--   AM_DEAL_MOVE 를 **표로 옮겨** 두고 함수가 그 표를 읽습니다. 그리고
--   `build-pages.js` 의 checkDealSql() 이 **표의 줄과 화면의 길을
--   하나씩 맞춰 봅니다** — 한쪽만 고치면 빌드가 멈춥니다. 이 저장소가
--   "같은 규칙을 두 곳에 적어 어긋난" 사고를 여러 번 겪은 자리입니다
--   (amCatTo/catTo · 랜딩 아이콘 · 도구 아이콘 표).
--
-- ⚠️ 돈이 걸린 상태로는 이 문으로 **못 갑니다** — 0003 의 함수들이
--   증빙 · 정책 사본 · 입금액을 더 받아야 하기 때문입니다. 여기서
--   막고 어느 함수로 가라고 말해 줍니다.
-- ════════════════════════════════════════════════════════════════════

-- ── 갈 수 있는 길 (js/data/deal.js 의 AM_DEAL_MOVE 그대로) ───────────
-- ⚠️ 이 표를 손으로 고치지 마세요. deal.js 를 고치고 빌드를 돌리면
--    checkDealSql() 이 어긋난 줄을 이름까지 적어 멈춥니다.
create table deal_move (
  from_state deal_state not null,
  to_state   deal_state not null,
  role       app_role   not null,
  needs      text[]     not null default '{}',
  primary key (from_state, to_state, role)
);
alter table deal_move enable row level security;
-- 길은 비밀이 아닙니다 — 로그인한 사람은 자기가 무엇을 할 수 있는지
-- 알아야 화면에 단추를 낼 수 있습니다.
create policy move_read on deal_move for select to authenticated using (true);
grant select on deal_move to authenticated;

insert into deal_move (from_state, to_state, role, needs) values
  ('new','check','staff','{}'::text[]),
  ('new','check','admin','{}'::text[]),
  ('new','lost','staff',array['why']::text[]),
  ('new','lost','admin',array['why']::text[]),
  ('new','lost','customer',array['why']::text[]),
  ('check','assigned','staff',array['providerId','agree3rd']::text[]),
  ('check','assigned','admin',array['providerId','agree3rd']::text[]),
  ('check','lost','staff',array['why']::text[]),
  ('check','lost','admin',array['why']::text[]),
  ('check','lost','customer',array['why']::text[]),
  ('assigned','accepted','provider','{}'::text[]),
  ('assigned','check','provider',array['why']::text[]),
  ('assigned','check','staff',array['why']::text[]),
  ('assigned','check','admin',array['why']::text[]),
  ('assigned','lost','staff',array['why']::text[]),
  ('assigned','lost','admin',array['why']::text[]),
  ('assigned','lost','customer',array['why']::text[]),
  ('accepted','consult','provider','{}'::text[]),
  ('accepted','lost','staff',array['why']::text[]),
  ('accepted','lost','admin',array['why']::text[]),
  ('accepted','lost','customer',array['why']::text[]),
  ('consult','quoted','provider','{}'::text[]),
  ('consult','lost','staff',array['why']::text[]),
  ('consult','lost','admin',array['why']::text[]),
  ('consult','lost','customer',array['why']::text[]),
  ('quoted','nego','provider','{}'::text[]),
  ('quoted','nego','customer','{}'::text[]),
  ('quoted','lost','staff',array['why']::text[]),
  ('quoted','lost','admin',array['why']::text[]),
  ('quoted','lost','customer',array['why']::text[]),
  ('nego','signed','provider',array['amount']::text[]),
  ('nego','signed','staff',array['amount']::text[]),
  ('nego','signed','admin',array['amount']::text[]),
  ('nego','lost','staff',array['why']::text[]),
  ('nego','lost','admin',array['why']::text[]),
  ('nego','lost','customer',array['why']::text[]),
  ('signed','done','provider','{}'::text[]),
  ('signed','done','staff','{}'::text[]),
  ('signed','done','admin','{}'::text[]),
  ('signed','lost','admin',array['why']::text[]),
  ('done','fee_wait','admin',array['proof','feeId']::text[]),
  ('done','lost','admin',array['why']::text[]),
  ('fee_wait','fee_done','admin',array['paid']::text[]),
  ('fee_wait','lost','admin',array['why']::text[]);

-- ── 문 ───────────────────────────────────────────────────────────────
-- ctx 에 담는 것 : {"why":"…","providerId":"pv-one","agree3rd":true}
--
-- ⚠️⚠️ **감사 기록과 상태 변경이 한 트랜잭션입니다** — 기록이 실패하면
-- 상태도 안 바뀝니다. 기록 없이 지나갈 길이 없습니다 (§8).
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

  update request set state = p_to where id = p_request;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, v_role, 'request', p_request::text, v_from, p_to, v_why,
          p_ctx - 'why');

  return p_to;
end $$;

-- ⚠️ 업체가 자기 배정을 수락 · 거절하는 자리입니다. 상태는 move_state
-- 가 바꾸고, 여기서는 **자기 것인지**만 더 봅니다.
create or replace function answer_assignment(
  p_request uuid, p_yes boolean, p_why text default null
) returns deal_state
  language plpgsql security definer set search_path = public as $$
declare v_pv text := my_provider();
begin
  if my_role() <> 'provider' or v_pv is null then
    raise exception '배정받은 업체만 답할 수 있습니다';
  end if;
  if not exists (select 1 from assignment
                  where request_id = p_request and provider_id = v_pv) then
    raise exception '이 업체에 배정된 신청이 아닙니다';
  end if;

  update assignment set state = case when p_yes then 'accepted' else 'declined' end,
                        why = p_why
   where request_id = p_request and provider_id = v_pv;

  -- ⚠️ 거절은 **실패가 아니라 다시 확인**입니다 — 손님 쪽에서 보면
  -- 아직 진행 중인 건입니다 (deal.js 의 길과 같습니다).
  return move_state(p_request,
    case when p_yes then 'accepted'::deal_state else 'check'::deal_state end,
    jsonb_build_object('why', coalesce(p_why, case when p_yes then '' else '업체 거절' end)));
end $$;

revoke all on function move_state(uuid, deal_state, jsonb)      from public;
revoke all on function answer_assignment(uuid, boolean, text)   from public;
grant execute on function move_state(uuid, deal_state, jsonb)    to authenticated;
grant execute on function answer_assignment(uuid, boolean, text) to authenticated;

insert into schema_version (n, name) values (4, '0004_move_state')
on conflict (n) do nothing;
