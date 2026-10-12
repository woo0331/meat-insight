-- ════════════════════════════════════════════════════════════════════
-- 0008 — 업체 견적 제출 · 수정 · 철회 + 고객의 견적 비교
--        (최종 통합 지시서 §4 · §6 · docs/PHASE1_SYSTEM_AUDIT.md §3 의 ⑤)
--
-- ⚠️⚠️ **왜 이 파일이 생겼나 — 이름이 겹쳐서 "이미 있다" 로 읽혔습니다.**
--   지금 `/compare` 는 **업체**를 나란히 놓는 화면입니다 (분야 · 지역 ·
--   배지). 지시서 §6 이 적은 것은 **제출된 견적**을 나란히 놓는
--   화면입니다 (금액 · 범위 · 기간 · A/S) — 둘은 다른 화면이고,
--   뒤엣것은 담을 표가 없어서 **아예 없었습니다.**
--
--   상태 열셋에는 `quoted`(견적 전달)가 처음부터 있었고 길도
--   `consult → quoted`(업체)로 열려 있었습니다. 그러니까 **"견적을
--   냈다" 는 사실만 적히고 견적 내용은 아무 데도 안 남는** 꼴이었고,
--   고객은 전화로 들은 금액을 기억해야 했습니다.
--
-- ⚠️⚠️ **표를 열지 않고 문을 만듭니다** (0007 과 같은 규칙).
--   0001 의 GRANT 는 `authenticated` 에게 insert 를 한 줄도 주지
--   않습니다 — 표를 열면 기록 없이 지나가는 길이 하나 생깁니다 (§8
--   "모든 중요한 상태 변경에는 변경자, 변경일시, 사유를 기록한다").
--
--     ① submit_quote    업체가 견적을 냅니다 · 고칩니다  ⚠️ 업체만
--     ② withdraw_quote  업체가 거둡니다                  ⚠️ 업체만
--     ③ choose_quote    고객이 고릅니다                  고객 · 직원 · 관리자
--
-- ⚠️ 두 번 돌려도 안전합니다 (if not exists · create or replace).
-- ⚠️⚠️ 돌린 파일(0001 · 0004 · 0007)을 **고치지 않았습니다** —
--   db/README.md 의 규칙대로 다음 번호로 새로 만듭니다.
-- ════════════════════════════════════════════════════════════════════

begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 견적 (quote)
--
-- ⚠️⚠️ **한 신청 × 한 업체 = 한 줄입니다.** 고치면 그 줄을 덮어씁니다 —
--   새 줄을 쌓으면 "어느 것이 지금 견적인가" 가 갈리고, 고객 화면은
--   같은 업체가 금액만 다르게 셋 보입니다.
-- ⚠️ 그 대신 **고친 기록은 남습니다** (audit_log · 문이 하나라서).
--
-- ⚠️⚠️ **금액 칸은 업체만 적습니다.** 고객에게는 select 권한만 있고
--   (아래 GRANT), 그마저도 RLS 가 자기 신청의 것으로 좁힙니다.
-- ⚠️ `0` 은 값입니다 — "무상 · 서비스" 를 0 으로 적을 수 있습니다
--   (권리금 "무권리" 에서 겪은 자리). **안 적은 것**은 거절합니다.
-- ⚠️⚠️ 평점 · 응답속도 · 순위를 적는 칸이 **없습니다.** 재는 장치가
--   없는 값으로 줄을 세우면 그 순간 지어낸 기준입니다 (절대 규칙 1).
-- ════════════════════════════════════════════════════════════════════
create table if not exists quote (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references request(id) on delete cascade,
  provider_id text not null references provider(id) on delete cascade,

  -- 돈은 원 단위 정수입니다 (fee 쪽과 같은 규칙)
  amount      bigint not null check (amount >= 0),
  -- 부가세 처리 — ⚠️ 0001 의 `fee_vat` 를 **그대로** 씁니다 (별도 ·
  -- 포함 · 면세). 새 enum 을 만들면 화면이 둘을 따로 알아야 합니다.
  vat         fee_vat not null default 'add',

  -- 무엇이 포함되는가 — ⚠️⚠️ **범위 없는 견적은 금액만 적힌 종이입니다.**
  -- 고객이 둘을 견주려면 "이 금액에 무엇이 들어 있나" 가 있어야 합니다.
  scope       text not null,
  excludes    text,                       -- 포함되지 않는 것 (별도 비용)
  days        int check (days is null or days > 0),   -- 예상 소요일
  start_on    date,                       -- 시작 가능일
  warranty    text,                       -- A/S · 보증 (§6 비교 칸)
  valid_to    date,                       -- 이 견적이 유효한 날까지
  note        text,

  -- ⚠️ 상태는 네 가지입니다 — js/data/deal.js 의 AM_QUOTE_ST 와 같아야
  -- 하고 `build-pages.js` 의 checkQuoteSql() 이 빌드마다 맞춰 봅니다.
  --   state text -- open | withdrawn | chosen | passed
  state       text not null default 'open'
              check (state in ('open','withdrawn','chosen','passed')),
  chosen_at   timestamptz,
  by_user     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (request_id, provider_id)
);

-- 고객 화면이 "내 신청의 견적 전부" 를 한 번에 가져옵니다
create index if not exists quote_request_idx  on quote (request_id, created_at desc);
create index if not exists quote_provider_idx on quote (provider_id, created_at desc);

alter table quote enable row level security;

-- ── 누가 어느 줄을 보는가 ────────────────────────────────────────────
-- ⚠️⚠️ **정책 안에서 `request` 를 바로 읽으면 무한 재귀입니다.**
--   `request_assigned` 가 `assignment` 를 읽고, 거기서 다시 `request` 를
--   읽으면 Postgres 가 *"infinite recursion detected in policy"* 로
--   멈춥니다 — 0005 에서 **실제로 돌려 보고** 알았습니다. 그래서
--   `is_my_request()`(security definer)로 끊습니다.
drop policy if exists quote_mine on quote;
create policy quote_mine on quote for select
  using (provider_id = my_provider());

-- ⚠️⚠️ **거둔 견적은 고객에게 안 보입니다.** 업체가 거둔 금액이 비교
--   화면에 남아 있으면 고객은 그 금액으로 기대를 하고, 그건 업체가
--   하지 않은 약속입니다 (절대 규칙 5). 고른 뒤의 `passed` 는
--   보입니다 — "무엇을 고르지 않았나" 가 기록이기 때문입니다.
drop policy if exists quote_requester on quote;
create policy quote_requester on quote for select
  using (is_my_request(request_id) and state <> 'withdrawn');

drop policy if exists quote_staff on quote;
create policy quote_staff on quote for select
  using (my_role() in ('staff','admin'));

-- ⚠️⚠️ **insert · update · delete 정책을 일부러 만들지 않았습니다.**
--   RLS 는 정책이 없으면 막습니다. 쓰는 길은 아래 문 셋뿐입니다.


-- ════════════════════════════════════════════════════════════════════
-- ② 업체가 견적을 냅니다 · 고칩니다 (§4)
--
-- ⚠️⚠️ **상태는 여기서 손으로 바꾸지 않습니다.** 상태의 문은
--   `move_state()` 하나이고(0004 · §8), 여기서 또 적으면 감사 기록이
--   한쪽에만 남습니다. 상담 중이면 `move_state(…, 'quoted')` 를
--   **불러서** 넘깁니다 — 한 트랜잭션이라 견적과 상태가 같이 움직이고,
--   기록도 move_state 가 남깁니다.
-- ⚠️ 그래서 `consult → quoted` 길이 없어지면 여기도 같이 막힙니다
--   (그게 맞습니다 — 길 표가 하나뿐인 까닭입니다).
-- ════════════════════════════════════════════════════════════════════
create or replace function submit_quote(
  p_request uuid,
  p_data    jsonb default '{}'::jsonb,
  p_why     text default null
) returns uuid
  language plpgsql security definer set search_path = public as $$
declare
  v_me    uuid   := auth.uid();
  v_pv    text   := my_provider();
  v_role  app_role := my_role();
  v_st    deal_state;
  v_as    text;
  v_was   text;
  v_id    uuid;
  v_amt   bigint;
  v_scope text   := nullif(btrim(coalesce(p_data->>'scope','')), '');
  v_vat   text   := coalesce(nullif(p_data->>'vat',''), 'add');
  v_days  int;
  v_start date;
  v_valid date;
begin
  if v_me is null then
    raise exception '변경자를 알 수 없습니다 — 로그인한 세션에서만 됩니다';
  end if;
  -- ⚠️ 업체만입니다. 직원이 대신 넣어 주면 "업체가 적은 금액" 이
  -- 아니게 되고, 그 금액으로 계약이 되면 누가 적었는지가 사라집니다.
  if v_role <> 'provider' or v_pv is null then
    raise exception '견적은 배정받은 업체만 낼 수 있습니다';
  end if;

  select state into v_st from request where id = p_request;
  if v_st is null then raise exception '없는 신청입니다'; end if;

  -- 배정을 받고 **수락한** 곳만입니다 (거절한 곳 · 안 받은 곳은 아예
  -- 그 신청을 볼 수도 없습니다 — request_assigned 정책)
  select state into v_as from assignment
   where request_id = p_request and provider_id = v_pv;
  if v_as is null then
    raise exception '이 신청에 배정되지 않았습니다';
  end if;
  if v_as <> 'accepted' then
    raise exception '배정을 먼저 수락해 주세요';
  end if;

  -- ⚠️⚠️ 계약 뒤에는 못 냅니다. 계약금액이 이미 기록에 적혔는데
  -- 견적을 고치면 "무엇을 보고 계약했나" 가 어긋납니다 (§9).
  if v_st not in ('accepted','consult','quoted','nego') then
    raise exception '지금 상태(%)에서는 견적을 낼 수 없습니다', v_st;
  end if;
  -- ⚠️ 상담 전이면 상담으로 먼저 넘겨야 합니다 (길 표가 그 차례입니다)
  if v_st = 'accepted' then
    raise exception '상담을 시작한 뒤에 견적을 내 주세요';
  end if;

  -- ⚠️⚠️ **금액이 없으면 0원을 적어 두지 않고 거절합니다.** 0 은 값이고
  -- (무상 · 서비스), 안 적은 것은 견적이 아닙니다 — 이 저장소가 손익분기
  -- 85조원 · 권리금 25,000년에서 배운 자리입니다.
  if p_data->'amount' is null or jsonb_typeof(p_data->'amount') = 'null' then
    raise exception '견적 금액을 적어 주세요';
  end if;
  begin
    v_amt := (p_data->>'amount')::bigint;
  exception when others then
    raise exception '견적 금액을 숫자로 적어 주세요';
  end;
  if v_amt < 0 then raise exception '견적 금액이 음수입니다'; end if;
  if v_scope is null then
    raise exception '이 금액에 무엇이 포함되는지 적어 주세요';
  end if;

  /* ⚠️⚠️ **거절하는 말이 사람 말이라야 합니다.** 그냥 형변환에 맡기면
     `invalid input value for enum fee_vat: "x"` 가 **그대로 손님에게**
     갑니다 (`api/deal.js` 가 DB 의 거절 글을 그대로 보여 주기 때문에
     그렇게 설계한 것인데, 그 글이 사람 말일 때만 맞는 설계입니다).
     ⚠️ 날짜 · 소요일도 같은 까닭으로 감쌉니다. */
  if v_vat not in ('add','incl','free') then
    raise exception '부가세 처리를 별도 · 포함 · 면세 중에서 골라 주세요';
  end if;
  begin
    v_days  := nullif(p_data->>'days','')::int;
    v_start := nullif(p_data->>'startOn','')::date;
    v_valid := nullif(p_data->>'validTo','')::date;
  exception when others then
    raise exception '소요일과 날짜를 다시 확인해 주세요';
  end;
  if v_days is not null and v_days <= 0 then
    raise exception '예상 소요일은 하루 이상으로 적어 주세요';
  end if;

  -- ⚠️⚠️ 고객이 고른 견적은 못 고칩니다. 고치면 고객이 고른 것과 다른
  -- 금액이 되고, 그건 조용히 말을 바꾸는 일입니다 — 바꿀 일이 있으면
  -- 사람이 보고 보류 · 취소로 넘깁니다.
  select state into v_was from quote
   where request_id = p_request and provider_id = v_pv;
  if v_was = 'chosen' then
    raise exception '고객이 고른 견적은 고칠 수 없습니다 — 담당자에게 알려 주세요';
  end if;

  insert into quote (request_id, provider_id, amount, vat, scope, excludes,
                     days, start_on, warranty, valid_to, note, state, by_user)
  values (p_request, v_pv, v_amt, v_vat::fee_vat, v_scope,
          nullif(btrim(coalesce(p_data->>'excludes','')), ''),
          v_days, v_start,
          nullif(btrim(coalesce(p_data->>'warranty','')), ''),
          v_valid,
          nullif(btrim(coalesce(p_data->>'note','')), ''),
          'open', v_me)
  on conflict (request_id, provider_id) do update
    set amount = excluded.amount, vat = excluded.vat, scope = excluded.scope,
        excludes = excluded.excludes, days = excluded.days,
        start_on = excluded.start_on, warranty = excluded.warranty,
        valid_to = excluded.valid_to, note = excluded.note,
        /* 거둔 뒤 다시 내면 되살아납니다 — 그게 "다시 냈다" 입니다 */
        state = 'open', chosen_at = null, by_user = v_me, updated_at = now()
  returning id into v_id;

  -- 상담 중이었으면 **상태의 문**으로 넘깁니다 (여기서 직접 안 씁니다)
  if v_st = 'consult' then
    perform move_state(p_request, 'quoted'::deal_state,
                       jsonb_build_object('quoteId', v_id::text));
  end if;

  -- ⚠️⚠️ 금액을 기록에 싣지 않습니다. `audit_log` 는 관리자와 그 업체가
  -- 보는 자리이고(0001 audit_read), 금액은 `quote` 한 곳에만 둡니다 —
  -- 두 곳에 두면 고친 뒤 어느 쪽이 맞는지 아무도 모릅니다.
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why)
  values (v_me, v_role, 'quote', v_id::text,
          coalesce(v_was, 'none'), 'open', p_why);
  return v_id;
end $$;


-- ════════════════════════════════════════════════════════════════════
-- ③ 업체가 견적을 거둡니다
--
-- ⚠️ **지우지 않습니다.** 냈던 사실과 금액은 기록이고, 지우면 "그때
--   무엇을 냈는가" 가 사라집니다 (정책을 끄되 지우지 않는 것과 같은
--   까닭 · 0007 ⑤).
-- ⚠️⚠️ **상태를 되돌리지 않습니다.** 신청이 `quoted` 인데 견적이 하나도
--   없게 될 수 있는데, 그걸 여기서 `consult` 로 되돌리면 길 표에 없는
--   길을 이 문이 몰래 내는 셈입니다 — 사람이 보고 보류 · 취소로
--   넘깁니다 (화면이 그 줄을 냅니다).
-- ════════════════════════════════════════════════════════════════════
create or replace function withdraw_quote(
  p_request uuid,
  p_why     text default null
) returns void
  language plpgsql security definer set search_path = public as $$
declare
  v_me  uuid := auth.uid();
  v_pv  text := my_provider();
  v_was text;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if my_role() <> 'provider' or v_pv is null then
    raise exception '견적은 낸 업체만 거둘 수 있습니다';
  end if;
  select state into v_was from quote
   where request_id = p_request and provider_id = v_pv;
  if v_was is null then raise exception '낸 견적이 없습니다'; end if;
  if v_was = 'chosen' then
    raise exception '고객이 고른 견적은 거둘 수 없습니다 — 담당자에게 알려 주세요';
  end if;
  if v_was = 'withdrawn' then raise exception '이미 거둔 견적입니다'; end if;

  update quote set state = 'withdrawn', updated_at = now(), by_user = v_me
   where request_id = p_request and provider_id = v_pv;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why)
  select v_me, 'provider', 'quote', q.id::text, v_was, 'withdrawn', p_why
    from quote q where q.request_id = p_request and q.provider_id = v_pv;
end $$;


-- ════════════════════════════════════════════════════════════════════
-- ④ 고객이 견적을 고릅니다 (§6)
--
-- ⚠️⚠️ **고르는 것과 계약하는 것은 다릅니다.** 여기서 상태를 `nego` 로
--   넘기지 않습니다 — 조건을 더 맞춰 봐야 하는 일이고, 상태는
--   `move_state()` 가 길 표를 보고 넘깁니다 (화면이 그 단추를 따로
--   냅니다). 여기가 하는 일은 **골랐다는 사실을 남기는 것**까지입니다.
-- ⚠️ 직원 · 관리자도 고를 수 있습니다 — 전화로 들은 선택을 대신 적는
--   자리입니다. **누가 골랐는지가 기록에 남습니다** (by_role).
-- ════════════════════════════════════════════════════════════════════
create or replace function choose_quote(
  p_request  uuid,
  p_provider text,
  p_why      text default null
) returns uuid
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_id   uuid;
  v_st   text;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if v_role is null then raise exception '역할이 없습니다'; end if;
  -- 내 신청이거나, 직원 · 관리자여야 합니다
  if not (is_my_request(p_request) or v_role in ('staff','admin')) then
    raise exception '이 신청의 견적을 고를 수 없습니다';
  end if;
  if p_provider is null or btrim(p_provider) = '' then
    raise exception '어느 업체의 견적인지 골라 주세요';
  end if;

  select id, state into v_id, v_st from quote
   where request_id = p_request and provider_id = p_provider;
  if v_id is null then raise exception '그 업체의 견적이 없습니다'; end if;
  if v_st = 'withdrawn' then raise exception '업체가 거둔 견적입니다'; end if;
  if v_st = 'chosen' then return v_id; end if;   -- 두 번 눌러도 터지지 않습니다

  -- ⚠️ 고른 것 하나만 `chosen`, 나머지 **살아 있는 것**은 `passed`.
  -- 거둔 것(withdrawn)은 그대로 둡니다 — 고객이 고르지 않은 것이
  -- 아니라 업체가 거둔 것이라, 둘을 같은 말로 덮으면 기록이 틀립니다.
  update quote set state = 'passed', updated_at = now()
   where request_id = p_request and provider_id <> p_provider and state = 'open';
  update quote set state = 'chosen', chosen_at = now(), updated_at = now()
   where id = v_id;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why)
  values (v_me, v_role, 'quote', v_id::text, v_st, 'chosen', p_why);
  return v_id;
end $$;


-- 읽기는 RLS 가 줄 단위로 좁힙니다. ⚠️⚠️ **쓰기 권한은 주지 않습니다** —
-- 문 셋만 엽니다 (0001 · 0007 과 같은 규칙).
grant select on quote to authenticated;

revoke all on function submit_quote(uuid, jsonb, text)   from public;
revoke all on function withdraw_quote(uuid, text)        from public;
revoke all on function choose_quote(uuid, text, text)    from public;
grant execute on function submit_quote(uuid, jsonb, text) to authenticated;
grant execute on function withdraw_quote(uuid, text)      to authenticated;
grant execute on function choose_quote(uuid, text, text)   to authenticated;

-- 판 번호 (db/README.md) — ⚠️ 칸 이름은 0002 의 것입니다 (n · name)
insert into schema_version (n, name) values (8, '0008_quote')
on conflict (n) do nothing;

commit;
