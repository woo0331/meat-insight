/* ==================================================================
   0008 ~ 0050 를 한 번에 —
   Supabase SQL 편집기에 **이 파일을 통째로** 붙여 넣고 Run 하세요.
   ==================================================================
   WARN 빌드가 만드는 파일입니다 — 손으로 고치지 마세요.
   db/migrations 의 43개를 번호 차례로 이어 붙인 것이고
   한 글자도 바꾸지 않았습니다. (node tools/make-apply.js)

   이미 0007 까지 돌려 두신 DB 에 쓰는 것입니다.
   그보다 앞선 판이면 db/README.md 의 차례대로 먼저 올리세요 —
   이 파일은 건너뛴 번호를 메워 주지 않습니다.

   돌린 뒤에는 db/verify.sql 을 붙여 넣어 보세요. 중간에서 멈추면 그
   파일 하나만 따로 돌리고 그 다음부터 이어 가시면 됩니다 — 번호를
   다시 쓰지 않습니다.

   WARN 통째로 begin/commit 으로 감싸지 마세요 — 파일마다 제
   트랜잭션이 있고 0015 는 일부러 감싸지 않았습니다. */

/* ---------------------------- 0008_quote.sql ---------------------------- */
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

/* ---------------------------- 0009_request_item.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0009 — 신청 하나에 서비스 여러 개 (QuoteRequest ↔ QuoteRequestItem)
--        2026-10-17 "창업 준비 전문관" 지시서 §6 · §7
--
-- ⚠️⚠️ **왜 이 파일이 생겼나 — 서비스별 배정이 불가능했습니다.**
--   `request` 는 `cat` 한 칸 · `offer_id` 한 칸이고 `assignment` 는
--   **신청 단위**입니다. 그래서 "인테리어 → A업체 · 주방설비 → B업체"
--   를 적을 자리가 아예 없었습니다. 화면에서는 2026-10-09 부터 상품을
--   여러 개 고를 수 있었는데, 접수에는 **이름이 이어 붙은 한 줄**로만
--   들어와서 기계가 항목으로 다루지 못했습니다.
--
-- ⚠️⚠️ **기존 칸을 지우지 않았습니다** (지시서 §1 "기존 회원정보,
--   서비스, 신청 내역, 업체 데이터, 관리자 기능은 보존한다").
--   `request.cat` · `request.offer_id` 는 그대로 있고, 항목이 있는
--   신청에서는 `cat` 이 **첫 항목**을 가리킵니다 — 옛 화면 · 옛 질의가
--   그대로 돕니다.
--
-- ⚠️⚠️ **백필이 없습니다.** 손님 데이터가 아직 0건입니다 (DB 는 섰고
--   Vercel 환경변수 대기). 그래서 표를 더하는 것이 안전합니다 —
--   쌓인 뒤였다면 `cat` 하나를 항목 한 줄로 옮기는 백필이 먼저입니다.
--
--     ① request_item      신청의 서비스 항목 (항목마다 제 상태)
--     ② assignment.item_id 배정이 **항목 하나**를 가리킵니다 (null 허용)
--     ③ save_request_items 접수가 항목을 통째로 적습니다 (트랜잭션)
--     ④ assign_item       항목 하나를 업체에 배정 (제17조 재동의 필수)
--     ⑤ move_item_state   항목 하나의 상태 (길 표를 그대로 봅니다)
--
-- ⚠️ 두 번 돌려도 안전합니다 (if not exists · create or replace).
-- ⚠️⚠️ 돌린 파일(0001 · 0004 · 0007 · 0008)을 **고치지 않았습니다** —
--   db/README.md 의 규칙대로 다음 번호로 새로 만듭니다.
-- ════════════════════════════════════════════════════════════════════

begin;

-- ════════════════════════════════════════════════════════════════════
-- ⓪ 멱등 열쇠 (§8 "재시도 요청의 중복 접수를 방지")
--
-- ⚠️⚠️ **화면이 신청서 하나에 열쇠 하나**를 만들어 보냅니다. 끊겨서
--   다시 누르시면 같은 열쇠가 오고, 서버가 그걸 보고 "새 신청이
--   아니라 재시도" 로 알아봅니다 — 전에는 **같은 분류 · 10분 안**으로만
--   봐서, 서비스를 여러 개 고르셨거나 10분이 지난 재시도는 **두 번
--   접수**됐습니다.
-- ⚠️ `null` 을 허용합니다 — 옛 화면과 `/sell` · `/closure` 는 아직
--   열쇠를 안 보냅니다. 그쪽은 전과 똑같이 분류 · 시각으로 봅니다.
-- ⚠️⚠️ **부분 unique 입니다** (null 은 안 걸립니다). 두 번째 요청이
--   틈새로 지나가도 여기서 멈춥니다 — 조회로 거르는 것이 첫째이고
--   이것이 **둘째 자물쇠**입니다.
alter table request add column if not exists idem text;
create unique index if not exists request_idem_once
  on request (idem) where idem is not null;


-- ════════════════════════════════════════════════════════════════════
-- ① 신청 서비스 항목
--
-- ⚠️⚠️ **`service_id` 는 `js/data/catalog.js` 의 분류 key 입니다**
--   (`interior` · `equip` · `admin` …). 지시서 §6 이 "서비스 ID는 기존
--   서비스 데이터의 고유 ID를 사용한다 · 서비스명을 문자열로만 저장하여
--   이름 변경 시 데이터 관계가 깨지는 설계는 피한다" 고 직접 적은
--   자리입니다 — 이름은 화면이 그때그때 읽습니다.
-- ⚠️ `text` 인 까닭은 업체 id · 상품 id 와 같습니다 — 그 key 들이
--   이미 주소(`/providers/interior`)로 색인되어 있어 uuid 로 바꿀 수가
--   없습니다.
-- ⚠️⚠️ **분류가 내려가도 지난 항목은 남습니다** (§12 "서비스가
--   비활성화되어도 과거 신청 기록은 보존한다"). 그래서 외래키를 걸지
--   않습니다 — 분류는 DB 가 아니라 코드에 있는 목록입니다.
-- ⚠️ `state` 가 항목마다 따로입니다 (§7 "상태를 하나의 신청서 전체에만
--   적용하지 말고 필요한 경우 서비스 항목별 상태를 관리한다").
create table if not exists request_item (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references request(id) on delete cascade,
  service_id  text not null,
  -- §5-3 그 서비스에서만 묻는 답 (공통 칸은 request.detail 입니다)
  detail      jsonb not null default '{}',
  state       deal_state not null default 'new',
  created_at  timestamptz not null default now(),
  -- ⚠️⚠️ **같은 서비스를 두 번 담지 않습니다** (§3-2 중복 선택 방지).
  --   화면에서도 막지만, 두 번 눌린 요청이 들어오면 여기서 멈춥니다.
  constraint request_item_once unique (request_id, service_id),
  constraint request_item_svc check (service_id <> '' and length(service_id) <= 60)
);
create index if not exists request_item_req_idx on request_item (request_id);
create index if not exists request_item_state_idx on request_item (state, created_at desc);

alter table request_item enable row level security;

-- ⚠️⚠️ **이 블록이 정책보다 먼저여야 합니다.** 아래 `is_my_item()` 이
--   `assignment.item_id` 를 읽는데, 칸을 나중에 더하면
--   *"column a.item_id does not exist"* 로 **파일이 통째로 멈춥니다** —
--   실제 Postgres 에서 돌려 보고 알았습니다 (SQL 만 읽어서는 멀쩡해
--   보입니다). 이 저장소가 0001 을 414줄 써 놓고 한 번도 안 돌려 봤다가
--   둘이 깨져 있던 그 자리입니다.

-- ════════════════════════════════════════════════════════════════════
-- ② 배정이 **항목 하나**를 가리킵니다 (§7)
--
-- ⚠️⚠️ **null 을 허용합니다.** 지금까지의 배정은 신청 전체를 가리키고
--   있고, not null 로 두면 그 줄들이 전부 깨집니다 (지금은 0건이지만
--   규칙이 그렇습니다). 항목이 있는 신청은 항목을 가리키고, 없는
--   신청은 전과 똑같이 신청 전체를 가리킵니다.
alter table assignment add column if not exists item_id uuid
  references request_item(id) on delete cascade;
create index if not exists assign_item_idx on assignment (item_id);

-- ⚠️⚠️ **한 항목 × 한 업체 = 한 줄입니다.** 같은 업체를 같은 항목에
--   두 번 배정하면 안내가 두 번 가고 수수료가 두 번 잡힙니다.
--   ⚠️ 부분 인덱스입니다 — `item_id` 가 null 인 옛 줄은 안 걸립니다
--   (0001 의 `unique (request_id, provider_id)` 가 그쪽을 지킵니다).
create unique index if not exists assign_item_once
  on assignment (item_id, provider_id) where item_id is not null;


-- 볼 수 있는 사람은 **그 신청을 볼 수 있는 사람**과 같습니다.
-- ⚠️⚠️ 정책 안에서 `request` 를 바로 읽으면 **무한 재귀**입니다
--   (`request_assigned` 가 `assignment` 를 읽고 그쪽이 다시 request 를
--   읽습니다 — 0005 에서 실제로 겪었습니다). security definer 함수로
--   끊습니다.
drop policy if exists item_mine on request_item;
create policy item_mine on request_item for select
  using (is_my_request(request_id));

drop policy if exists item_staff on request_item;
create policy item_staff on request_item for select
  using (my_role() in ('staff','admin'));

-- 업체는 **자기에게 배정된 항목만** 봅니다.
-- ⚠️⚠️ 배정되지 않은 항목까지 보이면, 한 신청서에 같이 담긴 다른
--   서비스의 내용을 그 업체가 읽습니다 — 배정이 곧 제3자 제공이라
--   배정된 것만입니다 (제17조).
create or replace function is_my_item(iid uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from assignment a
                  where a.item_id = iid and a.provider_id = my_provider())
$$;
revoke all on function is_my_item(uuid) from public;
grant execute on function is_my_item(uuid) to authenticated;

drop policy if exists item_provider on request_item;
create policy item_provider on request_item for select
  using (my_provider() is not null and is_my_item(id));

-- ⚠️⚠️ **읽기만 줍니다.** 쓰기를 주면 기록 없이 지나가는 길이 하나
--   생깁니다 (§8) — 아래 문 셋으로만 바뀝니다.
-- ⚠️ `anon`(로그인 안 한 사람)에게는 아무 권한도 주지 않습니다.
grant select on request_item to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ③ 접수가 항목을 적습니다 — 한 트랜잭션 (§8)
--
-- ⚠️⚠️ **신청서와 항목이 같이 적히거나 같이 안 적힙니다.** §8 이
--   "신청서 저장과 서비스 항목 저장이 중간에 실패하여 불완전한 신청이
--   생성되지 않도록 트랜잭션을 적용한다" 고 적은 자리입니다 — 함수
--   하나가 둘을 다 적으면 plpgsql 이 알아서 한 트랜잭션입니다.
-- ⚠️ 서버(service key)가 부릅니다. 로그인 없이 들어오는 접수라
--   `auth.uid()` 가 비어 있고, 그래서 **상태를 바꾸지 않습니다** —
--   새로 만들기만 합니다 (기록이 필요한 변경이 아닙니다).
-- ⚠️⚠️ 같은 신청에 두 번 불려도 **줄이 안 늘어납니다**
--   (`on conflict do nothing`) — 멱등입니다 (§8).
create or replace function save_request_items(p_request uuid, p_items jsonb)
  returns int
  language plpgsql security definer set search_path = public as $$
declare
  n int := 0;
  it jsonb;
  sid text;
begin
  if p_request is null then
    raise exception '신청을 찾을 수 없습니다';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    return 0;
  end if;

  for it in select * from jsonb_array_elements(p_items) loop
    sid := nullif(btrim(coalesce(it->>'id', '')), '');
    -- ⚠️ 빈 id 는 **조용히 건너뜁니다**. 여기서 터뜨리면 멀쩡한 나머지
    --    항목까지 같이 잃습니다 — 접수를 잃는 쪽이 더 나쁩니다.
    continue when sid is null;
    insert into request_item (request_id, service_id, detail)
    values (p_request, sid,
            coalesce(case when jsonb_typeof(it->'detail') = 'object'
                          then it->'detail' else null end, '{}'::jsonb))
    on conflict (request_id, service_id) do nothing;
    if found then n := n + 1; end if;
  end loop;
  return n;
end $$;
revoke all on function save_request_items(uuid, jsonb) from public;


-- ════════════════════════════════════════════════════════════════════
-- ④ 항목 하나를 업체에 배정 (§7)
--
-- ⚠️⚠️ **배정이 곧 제3자 제공입니다** (개인정보보호법 제17조 제2항).
--   `p_agree3rd` 가 true 가 아니면 거절합니다 — 0004 의 `move_state()`
--   와 **같은 규칙**이고, 방침 제4조 제3항이 "접수 단계의 동의에는
--   제3자 제공이 포함되지 않습니다" 라고 적고 있습니다.
-- ⚠️ 동의를 **시각으로** 남깁니다. boolean 으로 두면 "언제 받았나" 를
--   못 대고, 그게 분쟁에서 받지 않은 것과 같아집니다.
create or replace function assign_item(
  p_item uuid, p_provider text, p_agree3rd boolean, p_why text default null)
  returns void
  language plpgsql security definer set search_path = public as $$
declare
  r   request_item%rowtype;
  rol app_role := my_role();
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception '변경자를 알 수 없습니다 — 로그인 후 다시 시도해 주세요';
  end if;
  if rol not in ('staff','admin') then
    raise exception '배정은 직원 · 관리자만 할 수 있습니다';
  end if;

  select * into r from request_item where id = p_item;
  if not found then raise exception '항목을 찾을 수 없습니다'; end if;

  if p_agree3rd is not true then
    raise exception '제3자 제공 동의를 먼저 받아야 합니다 (개인정보보호법 제17조 제2항)';
  end if;
  if not exists (select 1 from provider where id = p_provider) then
    raise exception '등록된 업체가 아닙니다 — %', p_provider;
  end if;

  insert into assignment (request_id, provider_id, item_id, state,
                          agree3rd_at, by_user, why)
  values (r.request_id, p_provider, p_item, 'sent', now(), uid, p_why)
  -- ⚠️⚠️ **부분 인덱스라 `where` 를 같이 적어야 합니다.** 안 적으면
  --   Postgres 가 *"there is no unique or exclusion constraint matching
  --   the ON CONFLICT specification"* 로 거절합니다 — 실제로 돌려 보고
  --   알았습니다 (SQL 만 읽어서는 멀쩡해 보입니다).
  on conflict (item_id, provider_id) where item_id is not null do nothing;

  -- ⚠️ 신청 쪽 동의 시각도 같이 남깁니다 — 둘 중 하나만 있으면
  --    "언제 받았나" 를 한쪽에서만 댈 수 있습니다.
  update request set agree3rd_at = coalesce(agree3rd_at, now())
   where id = r.request_id;

  update request_item set state = 'assigned' where id = p_item;

  -- ⚠️⚠️ 기록과 변경이 **한 트랜잭션**입니다 — 기록이 실패하면
  --    배정도 안 됩니다. 기록 없이 지나갈 길이 없습니다 (§8).
  insert into audit_log (by_user, by_role, obj, obj_id,
                         from_state, to_state, why, data)
  values (uid, rol, 'request_item', p_item::text,
          r.state::text, 'assigned', p_why,
          jsonb_build_object('provider_id', p_provider,
                             'service_id',  r.service_id,
                             'request_id',  r.request_id));
end $$;
revoke all on function assign_item(uuid, text, boolean, text) from public;
grant execute on function assign_item(uuid, text, boolean, text) to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ⑤ 항목 하나의 상태 (§7)
--
-- ⚠️⚠️ **길 표(`deal_move`)를 그대로 봅니다.** 0004 가 만든 그 표이고,
--   `js/data/deal.js` 의 `AM_DEAL_MOVE` 에서 나온 것입니다 — 항목용
--   길을 따로 적으면 두 곳이 어긋나고, 화면이 안 내는 길로 DB 가
--   통과시키는 날이 옵니다.
-- ⚠️⚠️ **돈이 걸린 상태로는 여기서 못 갑니다.** 수수료는 계약(`deal`)
--   단위이고 `confirm_fee()` · `mark_paid()` 로만 갑니다 (§13 가짜
--   정산 금지) — 0004 와 같은 규칙입니다.
-- ⚠️ 배정은 ④ 로 갑니다 — 제17조 동의를 받는 자리가 거기 하나라야
--   합니다.
create or replace function move_item_state(
  p_item uuid, p_to deal_state, p_why text default null)
  returns void
  language plpgsql security definer set search_path = public as $$
declare
  r   request_item%rowtype;
  rol app_role := my_role();
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception '변경자를 알 수 없습니다 — 로그인 후 다시 시도해 주세요';
  end if;

  select * into r from request_item where id = p_item;
  if not found then raise exception '항목을 찾을 수 없습니다'; end if;

  if p_to in ('fee_wait','fee_done') then
    raise exception '수수료는 계약에서 확정합니다 — confirm_fee() · mark_paid() 로 가세요';
  end if;
  if p_to = 'assigned' then
    raise exception '배정은 assign_item() 으로 하세요 (제3자 제공 동의가 필요합니다)';
  end if;

  -- ⚠️ 갈 수 없는 길인지와 역할이 모자란지를 **갈라서** 말해 줍니다 —
  --    화면이 다른 안내를 해야 합니다 (0004 와 같은 규칙).
  if not exists (select 1 from deal_move m
                  where m.from_state = r.state and m.to_state = p_to) then
    raise exception '갈 수 없는 길입니다 — % → %', r.state, p_to;
  end if;
  if not exists (select 1 from deal_move m
                  where m.from_state = r.state and m.to_state = p_to
                    and m.role = rol) then
    raise exception '이 상태로 바꿀 권한이 없습니다 — %', rol;
  end if;

  update request_item set state = p_to where id = p_item;

  insert into audit_log (by_user, by_role, obj, obj_id,
                         from_state, to_state, why, data)
  values (uid, rol, 'request_item', p_item::text,
          r.state::text, p_to::text, p_why,
          jsonb_build_object('service_id', r.service_id,
                             'request_id', r.request_id));
end $$;
revoke all on function move_item_state(uuid, deal_state, text) from public;
grant execute on function move_item_state(uuid, deal_state, text) to authenticated;


-- 판 번호 (db/README.md) — ⚠️ 칸 이름은 0002 의 것입니다 (n · name)
insert into schema_version (n, name) values (9, '0009_request_item')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0010_user_state.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0010 — 회원 계정에 남는 임시저장 · 체크리스트
--        2026-10-18 "매장 운영 전문관 2차" §6-2 · §9
--
-- ⚠️⚠️ **왜 이 파일이 생겼나 — 저장이 브라우저 안에만 있었습니다.**
--   §6-2 는 "회원이면 서버에 임시저장한다", §9 는 "로그인한 회원은
--   체크 상태를 계정에 저장한다" 였는데, 둘 다 `localStorage` 뿐이라
--   ① 폰에서 고르고 PC 에서 이으실 수가 없고 ② 가게 컴퓨터를 바꾸면
--   사라지고 ③ 사파리 비공개 모드에서는 애초에 안 남았습니다.
--
-- ⚠️⚠️ **브라우저 저장을 없앤 것이 아닙니다.** 로그인하지 않은 분이
--   여전히 더 많고(지금은 전부), 로그인이 꺼져 있는 동안 화면은
--   **오늘과 글자 하나 다르지 않게** 돕니다. 이 표는 **로그인한
--   분에게만** 한 겹 더 붙는 것이고, 어느 쪽이 이기는지는
--   `js/state.js` 머리말에 적혀 있습니다.
--
-- ⚠️⚠️ **새 표가 하나입니다** (§8 "기존 스키마가 있으면 새 테이블을
--   중복 생성하지 않는다"). 담는 것 셋이 전부 **그 사람의 메모장**이고
--   줄 수명이 같아서, 셋을 따로 두면 표 셋에 같은 열쇠를 세 번 적는
--   꼴입니다.
--
-- ⚠️⚠️ **감사 기록(audit_log)을 남기지 않습니다.** §8 의 "모든 중요한
--   상태 변경" 은 신청 · 계약 · 돈의 상태를 말합니다. 여기는 그 사람이
--   자기 메모를 고치는 일이고 자동저장이라, 기록을 남기면 체크 한 번에
--   줄 하나씩 쌓여 **정작 돈 기록이 그 더미에 묻힙니다.**
--
--     ① user_state        계정 하나에 한 줄 (고른 서비스 · 조건 · 체크)
--     ② user_state_guard  ⚠️ 담을 수 있는 칸을 **DB 가** 정합니다
--     ③ save_user_state   저장하는 유일한 길 (표에는 쓰기 권한이 없습니다)
--     ④ clear_user_state   지우는 길 — 되돌릴 수 없으므로 화면이 한 번 묻습니다
--
-- ⚠️ 두 번 돌려도 안전합니다 (if not exists · create or replace).
-- ⚠️⚠️ 돌린 파일(0001~0009)을 **고치지 않았습니다**.
-- ════════════════════════════════════════════════════════════════════

begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 계정 하나에 한 줄
--
-- ⚠️⚠️ **성함 · 연락처를 담는 칸이 없습니다.** 담는 것은 §6-1 이
--   정한 조건 여덟 칸(상황 · 필요한 일 · 업종 · 지역 · 시군구 · 평수 ·
--   예산 · 일정)과 고르신 서비스 id · 체크해 두신 항목 key 까지입니다 —
--   성함과 연락처는 이미 `auth.users` 와 접수 줄에 있고, 메모장에 또
--   두면 그 순간 지우기 어려운 사본이 하나 늘어납니다 (최소 수집).
-- ⚠️ `account_id` 가 곧 기본키입니다 — 한 사람에 한 줄이라 쌓이지
--   않습니다. 계정이 지워지면 같이 지워집니다 (on delete cascade).
-- ⚠️⚠️ **값의 꼴과 개수를 여기서도 봅니다.** 문(③)이 먼저 거르지만,
--   표에 자물쇠가 없으면 나중에 다른 길이 하나 생기는 날 아무도
--   모릅니다 (이 저장소가 GRANT 와 RLS 를 **둘 다** 거는 까닭).
--   ⚠️ 칸 이름 허용 목록은 CHECK 에 못 담습니다 (하위 질의가 됩니다) —
--   그건 ② 트리거가 봅니다.
create table if not exists user_state (
  account_id  uuid primary key references account(id) on delete cascade,
  -- 고르신 서비스 id — `catalog.js` 의 분류 key 또는 `분류/하위`
  pick        jsonb not null default '[]',
  -- 적어 두신 조건 여덟 칸 (§6-1)
  draft       jsonb not null default '{}',
  -- 체크해 두신 운영 항목 key (`opscheck.js`)
  checks      jsonb not null default '[]',
  updated_at  timestamptz not null default now(),
  constraint user_state_pick_arr   check (jsonb_typeof(pick)   = 'array'),
  constraint user_state_checks_arr check (jsonb_typeof(checks) = 'array'),
  constraint user_state_draft_obj  check (jsonb_typeof(draft)  = 'object'),
  -- ⚠️ 상한이 있는 까닭 — 이 줄은 **자동저장**으로 들어옵니다. 상한이
  --    없으면 한 계정이 메가바이트짜리 jsonb 를 밀어 넣을 수 있습니다
  --    (§15 "악용 방어").
  constraint user_state_pick_cap   check (jsonb_array_length(pick)   <= 60),
  constraint user_state_checks_cap check (jsonb_array_length(checks) <= 100)
);

alter table user_state enable row level security;

-- ⚠️⚠️ **자기 줄만 읽습니다.** 직원 · 관리자에게도 열지 않았습니다 —
--   남의 메모장을 보는 것은 운영에 필요한 일이 아니고, 열어 두면
--   목록 하나가 곧 "이 사람이 무엇을 알아보고 있는가" 입니다.
drop policy if exists state_mine on user_state;
create policy state_mine on user_state for select
  using (account_id = auth.uid());

-- ⚠️⚠️ **읽기만 줍니다.** insert · update · delete 를 주면 아래 문을
--   거치지 않는 길이 하나 생기고, 그러면 ② 트리거만 남습니다 (§8).
-- ⚠️ `anon`(로그인 안 한 사람)에게는 아무 권한도 주지 않습니다.
grant select on user_state to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ② ⚠️⚠️ 담을 수 있는 칸을 **DB 가** 정합니다
--
-- 화면이 보내는 것만 담기면 될 일이지만, **화면을 믿지 않습니다** —
-- 이 저장소의 규칙 그대로입니다 (역할을 요청에서 안 읽는 것과 같은
-- 까닭). 여기서 막으면 나중에 화면 버그로 성함 · 연락처가 섞여
-- 들어와도 **표에 안 들어갑니다.**
--
-- ⚠️⚠️ **조용히 걷어내지 않고 거절합니다.** 걷어내면 그 버그를
--   아무도 모르는 채 몇 달이 갑니다. 거절하면 §15 대로 화면이
--   "저장하지 못했습니다" 를 그대로 말합니다 (성공 메시지 금지).
-- ⚠️ 거절하는 말에 **값을 싣지 않습니다** — 성함이 섞여 들어온
--   경우에 그 성함이 에러 글과 로그에 남으면 안 됩니다. 칸 이름까지만.
create or replace function user_state_guard() returns trigger
  language plpgsql as $$
declare
  k text;
  v jsonb;
begin
  -- 조건 여덟 칸 (§6-1) — 이 목록 밖은 못 담습니다
  for k in select jsonb_object_keys(new.draft) loop
    if k not in ('q-side','q-what','q-ind','q-reg','q-gu',
                 'q-py','q-bud','q-when') then
      raise exception '저장할 수 없는 칸입니다 — %', k;
    end if;
    if jsonb_typeof(new.draft->k) <> 'string' then
      raise exception '저장할 수 없는 값입니다 — %', k;
    end if;
    if length(new.draft->>k) > 120 then
      raise exception '값이 너무 깁니다 — %', k;
    end if;
  end loop;

  -- 고른 서비스 · 체크 항목은 **글자 배열**입니다
  for v in select * from jsonb_array_elements(new.pick) loop
    if jsonb_typeof(v) <> 'string' or length(v #>> '{}') > 60
       or btrim(v #>> '{}') = '' then
      raise exception '서비스 id 를 읽을 수 없습니다';
    end if;
  end loop;
  for v in select * from jsonb_array_elements(new.checks) loop
    if jsonb_typeof(v) <> 'string' or length(v #>> '{}') > 60
       or btrim(v #>> '{}') = '' then
      raise exception '체크 항목을 읽을 수 없습니다';
    end if;
  end loop;

  new.updated_at := now();
  return new;
end $$;

drop trigger if exists user_state_guard_t on user_state;
create trigger user_state_guard_t before insert or update on user_state
  for each row execute function user_state_guard();


-- ════════════════════════════════════════════════════════════════════
-- ③ 저장하는 유일한 길
--
-- ⚠️⚠️ **`auth.uid()` 에만 씁니다.** 인자로 계정을 받지 않습니다 —
--   받으면 로그인한 누구나 남의 메모장을 덮어씁니다. 이 저장소가
--   "변경자는 토큰에서만 옵니다" 로 못박아 둔 그 선입니다.
-- ⚠️ `null` 로 보낸 칸은 **그대로 둡니다** (coalesce). 화면이 셋 중
--   하나만 바뀌었을 때 나머지를 지우지 않으려고요 — 전부 보내게
--   하면 한쪽 화면의 자동저장이 다른 쪽을 쓸어 버립니다.
--   ⚠️⚠️ **비우는 것은 `[]` · `{}` 로 보냅니다** (null 과 다릅니다).
create or replace function save_user_state(
    p_pick jsonb default null, p_draft jsonb default null,
    p_checks jsonb default null)
  returns timestamptz
  language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  t   timestamptz;
begin
  if uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  -- ⚠️ 계정 줄이 없으면 저장할 데가 없습니다 (가입 트리거가 만듭니다).
  --    없는데 만들어 주면 역할이 없는 유령 계정이 생깁니다.
  if not exists (select 1 from account where id = uid) then
    raise exception '계정을 찾을 수 없습니다';
  end if;

  insert into user_state (account_id, pick, draft, checks)
  values (uid, coalesce(p_pick, '[]'::jsonb),
               coalesce(p_draft, '{}'::jsonb),
               coalesce(p_checks, '[]'::jsonb))
  on conflict (account_id) do update
     set pick   = coalesce(p_pick,   user_state.pick),
         draft  = coalesce(p_draft,  user_state.draft),
         checks = coalesce(p_checks, user_state.checks)
  returning updated_at into t;
  return t;
end $$;
revoke all on function save_user_state(jsonb, jsonb, jsonb) from public;
grant execute on function save_user_state(jsonb, jsonb, jsonb) to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ④ 지우는 길
--
-- ⚠️ 이 저장소는 저장하는 자리마다 **지우는 단추를 같이** 냅니다 —
--   되돌릴 수 없으므로 화면이 한 번 묻습니다 (브라우저 저장과 같은 선).
create or replace function clear_user_state() returns void
  language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  delete from user_state where account_id = uid;
end $$;
revoke all on function clear_user_state() from public;
grant execute on function clear_user_state() to authenticated;


-- 판 번호 (db/README.md) — ⚠️ 칸 이름은 0002 의 것입니다 (n · name)
insert into schema_version (n, name) values (10, '0010_user_state')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0011_request_photo.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0011 — 신청에 붙는 사진 · 서류
--        2026-10-18 "매장 운영 전문관 2차" §7-3 · §15
--
-- ⚠️⚠️ **왜 이 파일이 생겼나 — 올릴 데가 없었습니다.**
--   §7-3 은 "사진 첨부" 를 적었는데 받아 둘 저장소가 없어서, 지금까지는
--   **사진 주소를 적는 칸**으로 대신했습니다 (링크를 가진 분만 쓸 수
--   있는 길입니다). 냉장고가 어떻게 고장났는지 · 어느 벽을 뜯는지는
--   글로 적기 어려워서, 업체가 그것 없이 낸 금액은 현장에서 또 바뀝니다.
--
-- ⚠️⚠️ **사진은 접수한 뒤에 올립니다.** 접수 전에 올리게 하면
--   **아무나 올리는 길**이 하나 생깁니다 (로그인 없이 들어오는
--   접수라 변경자를 모릅니다) — §15 가 "악용 방어" 를 적은 자리입니다.
--   지금 길은 이렇습니다 —
--
--     ① 접수한다            → 접수번호(SW-XXXX-XXXX)를 받습니다
--     ② 번호 + 연락처로 확인 → 자리 하나를 내줍니다 (아래 문)
--     ③ 그 자리에만 올린다   → 버킷의 정해진 경로 하나
--
--   그래서 사진을 올리려면 **먼저 실제 접수가 있어야** 하고, 접수는
--   이미 중복 · 스팸 판정을 거칩니다 (`api/_intake.js`).
--
-- ⚠️⚠️ **파일 자체는 여기 안 들어옵니다.** Postgres 에 바이트를 담으면
--   덤프가 몇 기가가 되고, 이 저장소는 덤프를 다루지 않는 것이 규칙
--   입니다. 담는 것은 **버킷 안의 경로**까지입니다.
--
-- ⚠️⚠️ **버킷은 비공개라야 합니다.** 올리신 사진은 사장님 것이고,
--   공개 버킷이면 경로를 아는 누구나 봅니다. 보는 길은 아래 RLS 를
--   거치는 `/api/upload` 하나입니다 (서명된 주소를 그때그때 만듭니다).
-- ⚠️⚠️ **버킷을 만드실 때 크기 상한과 허용 형식을 거기서도 걸어
--   주세요.** 서명된 올리기 주소는 그 자체로 크기와 형식을 막지
--   않습니다 — 여기서 받는 값은 "적어 보낸 값" 이고, 실제로 막는 것은
--   **버킷 설정**입니다 (db/README.md 에 적어 두었습니다).
--
--     ① request_photo      신청에 붙는 사진 한 줄 (경로 · 형식 · 크기)
--     ② claim_photo_slot   번호 + 연락처로 자리 하나 (service key 전용)
--     ③ drop_photo         올리신 분 · 직원 · 관리자가 뺍니다
--
-- ⚠️ 두 번 돌려도 안전합니다 (if not exists · create or replace).
-- ════════════════════════════════════════════════════════════════════

begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 신청에 붙는 사진
--
-- ⚠️ `path` 가 유일합니다 — 같은 경로를 두 줄로 두면 하나를 빼도
--   다른 줄이 남아 지워진 파일을 가리킵니다.
-- ⚠️⚠️ **원래 파일 이름을 담지 않습니다.** 손님이 올리시는 파일 이름에
--   성함 · 가게 이름이 들어 있는 경우가 흔합니다 ("김사장_주방.jpg") —
--   담으면 그게 또 하나의 개인정보 사본입니다. 담는 것은 경로 ·
--   형식 · 크기까지입니다 (최소 수집).
create table if not exists request_photo (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references request(id) on delete cascade,
  -- 버킷 안의 경로 (파일 자체는 Supabase Storage 에 있습니다)
  path        text not null unique,
  mime        text not null,
  bytes       bigint not null,
  created_at  timestamptz not null default now(),
  constraint photo_path_ok check (path <> '' and length(path) <= 300),
  -- ⚠️⚠️ 받는 형식을 **DB 가** 정합니다. 화면과 서버가 먼저 거르지만,
  --   둘 다 지나간 뒤 마지막으로 여기서 막습니다 (자물쇠 셋).
  constraint photo_mime_ok check (mime in
    ('image/jpeg','image/png','image/webp','application/pdf')),
  -- ⚠️ 8MB. 폰으로 찍은 사진이 보통 2~5MB 입니다.
  constraint photo_bytes_ok check (bytes > 0 and bytes <= 8388608)
);
create index if not exists photo_req_idx on request_photo (request_id);

alter table request_photo enable row level security;

-- 볼 수 있는 사람은 **그 신청을 볼 수 있는 사람**과 같습니다.
-- ⚠️⚠️ 정책 안에서 `request` 를 바로 읽으면 무한 재귀입니다 — 0005 ·
--   0009 에서 겪은 자리라 security definer 함수로 끊습니다.
drop policy if exists photo_mine on request_photo;
create policy photo_mine on request_photo for select
  using (is_my_request(request_id));

drop policy if exists photo_staff on request_photo;
create policy photo_staff on request_photo for select
  using (my_role() in ('staff','admin'));

-- ⚠️⚠️ **업체는 배정된 건의 사진만 봅니다** (제17조). 배정되지 않은
--   건의 사진이 보이면, 그건 남의 가게 내부 사진입니다.
drop policy if exists photo_provider on request_photo;
create policy photo_provider on request_photo for select
  using (my_provider() is not null and exists (
    select 1 from assignment a
     where a.request_id = request_photo.request_id
       and a.provider_id = my_provider()));

-- ⚠️⚠️ **읽기만 줍니다.** 쓰기를 주면 기록 없이 지나가는 길이 하나
--   생깁니다 (§8) — 아래 문 둘로만 바뀝니다.
grant select on request_photo to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ② 번호 + 연락처로 자리 하나
--
-- ⚠️⚠️ **번호만으로는 안 됩니다.** 번호를 손에 넣은 사람이 남의 신청에
--   사진을 꽂아 넣을 수 있습니다 — `claim_request` 와 **같은 규칙**이고,
--   **틀린 까닭을 갈라서 말하지 않습니다** (갈라 주면 번호가 있는지를
--   확인해 가며 긁을 수 있습니다).
-- ⚠️⚠️ **service key 로만 부릅니다.** 올리시는 분은 로그인하지 않은
--   상태라 `auth.uid()` 가 비어 있습니다 — 그래서 `authenticated` 에게
--   권한을 주지 않습니다 (주면 로그인한 누구나 남의 신청에 꽂습니다).
-- ⚠️ 경로를 **여기서** 만듭니다. 화면이 보낸 이름을 쓰면 `../` 같은
--   것이 섞여 들어오고, 원래 파일 이름에는 성함이 들어 있기도 합니다.
create or replace function claim_photo_slot(
    p_no text, p_tel text, p_mime text, p_bytes bigint)
  returns jsonb
  language plpgsql security definer set search_path = public as $$
declare
  r      record;
  n      int;
  ext    text;
  newp   text;
begin
  if p_no is null or p_tel is null then
    raise exception '신청번호와 연락처를 확인해 주세요';
  end if;
  -- ⚠️ 숫자만 남겨 견줍니다 (031-000-0000 과 0310000000 은 같은 번호)
  select * into r from request
   where no = upper(btrim(p_no))
     and regexp_replace(coalesce(tel,''), '[^0-9]', '', 'g')
       = regexp_replace(p_tel, '[^0-9]', '', 'g');
  -- ⚠️⚠️ **한 가지 말로만 거절합니다** (claim_request 와 같은 규칙)
  if not found then
    raise exception '신청번호와 연락처를 확인해 주세요';
  end if;

  -- ⚠️ 다섯까지입니다. 상한이 없으면 접수 하나로 버킷을 채웁니다 (§15).
  select count(*) into n from request_photo where request_id = r.id;
  if n >= 5 then
    raise exception '사진은 다섯 장까지 올리실 수 있습니다';
  end if;

  ext := case p_mime
           when 'image/jpeg' then 'jpg'
           when 'image/png'  then 'png'
           when 'image/webp' then 'webp'
           when 'application/pdf' then 'pdf'
           else null end;
  if ext is null then
    raise exception '사진은 JPG · PNG · WEBP, 서류는 PDF 만 올리실 수 있습니다';
  end if;
  if p_bytes is null or p_bytes <= 0 or p_bytes > 8388608 then
    raise exception '한 장에 8MB 까지 올리실 수 있습니다';
  end if;

  -- ⚠️⚠️ 경로에 **번호 · 연락처를 넣지 않습니다.** 경로가 새면 그
  --   글자도 같이 새고, 버킷 목록에 그대로 보입니다.
  -- ⚠️⚠️ **`gen_random_bytes()` 를 쓰지 마세요** — pgcrypto 확장에만
  --   있습니다. Supabase 가 그걸 켜 두는 것에 **조용히 기대면** 확장을
  --   끄거나 다른 Postgres 에 세우는 날 이 함수가 통째로 터집니다
  --   (0001 이 GRANT 를 Supabase 기본값에 기대고 있었던 그 자리).
  --   `gen_random_uuid()` 는 **Postgres 13 부터 기본**입니다.
  newp := 'req/' || r.id::text || '/' ||
          replace(gen_random_uuid()::text, '-', '') || '.' || ext;

  insert into request_photo (request_id, path, mime, bytes)
  values (r.id, newp, p_mime, p_bytes);

  -- §8 — 신청 내용이 바뀌는 일이라 기록을 남깁니다 (한 트랜잭션).
  -- ⚠️ 번호 · 연락처 · 경로를 기록에 싣지 않습니다 — 형식과 크기까지.
  insert into audit_log (by_role, obj, obj_id, why, data)
  values ('customer', 'request', r.id::text, '사진을 올렸습니다',
          jsonb_build_object('mime', p_mime, 'bytes', p_bytes, 'n', n + 1));

  return jsonb_build_object('path', newp, 'request', r.id);
end $$;
revoke all on function claim_photo_slot(text, text, text, bigint) from public;


-- ════════════════════════════════════════════════════════════════════
-- ③ 빼기
--
-- ⚠️ 잘못 올리신 사진을 뺄 길이 없으면, 그 사진은 영영 남습니다.
-- ⚠️⚠️ **파일은 서버가 지웁니다.** 이 문은 줄만 지웁니다 — 둘을 한
--   트랜잭션에 묶을 수가 없어서(버킷은 다른 서비스입니다), 줄을 먼저
--   지우고 파일을 그 다음에 지웁니다. 거꾸로 하면 파일은 없는데 줄이
--   남아 **안 열리는 사진**이 보입니다.
create or replace function drop_photo(p_photo uuid) returns void
  language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  rol app_role := my_role();
  p   record;
begin
  if uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  select * into p from request_photo where id = p_photo;
  if not found then raise exception '사진을 찾을 수 없습니다'; end if;
  -- ⚠️⚠️ 올리신 분(계정에 이어 둔 경우) · 직원 · 관리자까지입니다.
  --   **업체는 뺄 수 없습니다** — 남이 올린 자료를 지우는 일입니다.
  if not (is_my_request(p.request_id) or rol in ('staff','admin')) then
    raise exception '이 사진을 뺄 권한이 없습니다';
  end if;

  delete from request_photo where id = p_photo;

  insert into audit_log (by_user, by_role, obj, obj_id, why, data)
  values (uid, rol, 'request', p.request_id::text, '사진을 뺐습니다',
          jsonb_build_object('mime', p.mime, 'bytes', p.bytes));
end $$;
revoke all on function drop_photo(uuid) from public;
grant execute on function drop_photo(uuid) to authenticated;


-- 판 번호 (db/README.md) — ⚠️ 칸 이름은 0002 의 것입니다 (n · name)
insert into schema_version (n, name) values (11, '0011_request_photo')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0012_owner_assignable_offer.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
--  0012 — 담당자 · 배정 가능 여부 · 열람 이력 · 수익상품
--  2026-10-22 "오픈 전 기능 전수검사" 보고서의 P0 ③④⑤⑦
--
--  ⚠️⚠️ **돌린 파일을 고치지 않았습니다.** 0001~0011 은 사장님이 이미
--  돌리셨으므로 그대로 두고, 바뀌는 것을 여기에 덧붙입니다
--  (db/README.md — 번호를 다시 쓰지 않습니다).
--
--  ① request.owner_id  — 이 건을 **누가 맡았는가** (지시서 §1 담당자 배정)
--  ② provider.assignable — **배정해도 되는 업체인가** (listed 와 다릅니다)
--  ③ note_request_open() — 관리자가 **연락처를 열어 본 이력**
--  ④ offer 27줄        — 수익상품이 DB 에 없어서 상품별 수수료 정책을
--                        못 만들고 있었습니다
--
--  ⚠️ 두 번 돌려도 안전합니다 (add column if not exists ·
--  on conflict do nothing · create or replace).
-- ════════════════════════════════════════════════════════════════════
begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 담당자 — 이 건은 누구 것인가
--
-- ⚠️⚠️ **`audit_log.by_user` 와 다른 것입니다.** 그쪽은 "누가 바꿨나"
--   (지난 일의 기록)이고, 이것은 "지금 누가 맡고 있나" 입니다. 둘을
--   하나로 쓰면 직원이 둘이 되는 날 **같은 건에 두 사람이 전화**합니다.
-- ⚠️ 비울 수 있습니다 (null = 아직 아무도) — 담당자를 **반드시** 정해야
--   다음 걸음으로 갈 수 있게 만들지 않았습니다. 급한 건을 먼저 받고
--   담당을 나중에 정하는 것이 실제 일하는 차례입니다.
-- ════════════════════════════════════════════════════════════════════
alter table request
  add column if not exists owner_id uuid references auth.users(id) on delete set null;

-- ⚠️⚠️ **직원이 직원 목록을 볼 수 없었습니다.** `account` 의 정책이
--   `account_self`(내 줄)와 `account_admin`(관리자 전부) 둘뿐이라,
--   직원은 담당자 고르개에 **아무것도 못 채웁니다** (uuid 만 보입니다).
-- ⚠️ 그래서 **직원 · 관리자 줄만** 엽니다 — 고객 계정의 성함은 그대로
--   안 보입니다 (role 조건이 그 자리입니다).
drop policy if exists account_staff on account;
create policy account_staff on account for select
  using (my_role() in ('staff','admin') and role in ('staff','admin'));

-- ⚠️⚠️ **표에 update 권한을 주지 않습니다** — 문으로만 바꿉니다 (§8).
--   권한을 주면 기록 없이 지나가는 길이 하나 생깁니다.
create or replace function set_owner(
  p_request uuid, p_owner uuid default null, p_why text default null)
  returns void
  language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  rol app_role := my_role();
  was uuid;
  nm  text;
begin
  if uid is null then
    raise exception '변경자를 알 수 없습니다 — 로그인 후 다시 시도해 주세요';
  end if;
  if rol not in ('staff','admin') then
    raise exception '담당자 배정은 직원 · 관리자만 할 수 있습니다';
  end if;

  select owner_id into was from request where id = p_request;
  if not found then raise exception '신청을 찾을 수 없습니다'; end if;

  -- ⚠️⚠️ **아무 계정이나 담당자로 둘 수 없습니다.** 고객 계정을 담당자로
  --   꽂으면 그 사람이 "내 건" 으로 세어지고, 더 나쁘게는 그걸 보고
  --   연락처를 열어도 되는 사람으로 읽힙니다.
  if p_owner is not null then
    select name into nm from account where id = p_owner and role in ('staff','admin');
    if not found then raise exception '직원 · 관리자 계정이 아닙니다'; end if;
  end if;

  update request set owner_id = p_owner where id = p_request;

  -- ⚠️ 기록과 변경이 **한 트랜잭션**입니다 (§8)
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (uid, rol, 'request', p_request::text,
          case when was is null then 'owner:none' else 'owner:set' end,
          case when p_owner is null then 'owner:none' else 'owner:set' end,
          p_why,
          -- ⚠️ 담당자 **성함은 안 적습니다** — 기록은 못 지우는 것이라
          --    이름이 박히면 영영 남습니다. id 로 충분합니다.
          jsonb_build_object('owner_id', p_owner, 'was', was));
end $$;

-- ════════════════════════════════════════════════════════════════════
-- ② 배정해도 되는 업체인가 — ⚠️⚠️ `listed` 와 **다른 것**입니다
--
--   listed      공개 목록(/providers)에 낼 것인가 — 손님에게 보이는가
--   assignable  신청을 **넘겨도 되는가** — 계약이 되어 있는가
--
-- ⚠️⚠️ **구두 제휴 합의 단계에서 이게 없으면 위험합니다.** 계약서를 쓰기
--   전에 배정되면 그 순간 손님의 성함 · 연락처가 그 업체로 넘어갑니다
--   (개인정보보호법 제17조 제3자 제공). `assign_item()` 과
--   `move_state()` 는 **업체가 있는지만** 보고 있었습니다.
-- ⚠️ 기본값은 **false** 입니다 — 등록해도 켜기 전에는 배정되지 않습니다
--   (fail-closed). 켜는 것은 관리자만입니다.
-- ════════════════════════════════════════════════════════════════════
alter table provider
  add column if not exists assignable boolean not null default false;

-- ⚠️⚠️ **트리거로 막습니다 — 함수마다 적지 않습니다.** 지금 배정이
--   생기는 길이 둘이고(`move_state` 의 배정 · `assign_item`), 앞으로
--   길이 하나 늘 때마다 같은 확인을 또 적으면 **한 곳을 잊는 날**이
--   옵니다. 줄이 만들어지는 자리가 하나라 여기서 봅니다.
-- ⚠️ 관리자도 예외가 아닙니다 — 그게 이 플래그의 뜻입니다.
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
  return new;
end $$;

drop trigger if exists assignment_assignable_guard on assignment;
create trigger assignment_assignable_guard
  before insert on assignment
  for each row execute function assignment_assignable();

-- 공개 · 확인 배지 · **배정 가능**을 켜는 문 (0007 의 것을 늘립니다)
-- ⚠️⚠️ **인자를 늘리면 덮어쓰기가 아니라 겹치기(overload)입니다.** 옛
--   서명을 먼저 지워야 같은 이름의 함수가 둘이 되지 않습니다 — 둘이
--   되면 어느 쪽이 불리는지가 인자 수에 따라 갈려 조용히 엉뚱한 쪽이
--   돕니다.
drop function if exists approve_provider(text, boolean, jsonb, text);
-- ⚠️⚠️ **새 인자를 맨 뒤에 둡니다.** 가운데 끼우면 자리로 부르던 쪽
--   (SQL 에서 approve_provider(id, listed, verified, why) 로 쓰던 자리)이
--   네 번째를 boolean 으로 읽어 **"invalid input syntax for type boolean"**
--   으로 터집니다 — tools/test-sql.js 에서 실제로 넷이 걸렸습니다.
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
                             'assignable_was', v_wasa));
end $$;

-- ════════════════════════════════════════════════════════════════════
-- ③ 연락처를 열어 본 이력 (개인정보보호법 제29조 — 접속기록)
--
-- ⚠️⚠️ **목록에는 성함 · 연락처가 없습니다** (api/me.js 의 PICK.staff).
--   그런데 **여는 길도 없어서** 관리자가 슬랙을 보고 전화하고 있었습니다.
--   이제 건 하나를 열면 가져오고, **열어 본 것을 기록합니다** — 기록이
--   남으면 "필요할 때만 여는" 것이 지켜집니다.
-- ⚠️ `audit_log` 에 insert 권한을 주지 않았으므로(0001) 문이 필요합니다.
-- ⚠️⚠️ **성함도 번호도 기록에 안 적습니다** — 기록은 못 지우는 것이라,
--   열어 본 이력에 연락처를 박으면 그 자체가 또 하나의 보관입니다.
--   남기는 것은 "누가 · 언제 · 어느 건을" 까지입니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function note_request_open(
  p_request uuid, p_why text default null)
  returns void
  language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); rol app_role := my_role();
begin
  if uid is null then
    raise exception '변경자를 알 수 없습니다 — 로그인 후 다시 시도해 주세요';
  end if;
  if rol not in ('staff','admin') then
    raise exception '연락처 열람 기록은 직원 · 관리자만 남깁니다';
  end if;
  if not exists (select 1 from request where id = p_request) then
    raise exception '신청을 찾을 수 없습니다';
  end if;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why)
  values (uid, rol, 'request', p_request::text, 'contact:open', p_why);
end $$;

-- ⚠️⚠️ **문만 엽니다** — 표 권한은 안 줍니다 (0007 과 같은 선)
revoke all on function set_owner(uuid, uuid, text)                              from public;
revoke all on function note_request_open(uuid, text)                            from public;
revoke all on function approve_provider(text, boolean, jsonb, text, boolean)    from public;
grant execute on function set_owner(uuid, uuid, text)                           to authenticated;
grant execute on function note_request_open(uuid, text)                         to authenticated;
grant execute on function approve_provider(text, boolean, jsonb, text, boolean) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ④ 수익상품 — ⚠️⚠️ `offer` 표가 **비어 있었습니다**
--
--   js/data/offers.js 에 상품이 있는데 DB 에는 한 줄도 넣는 코드가
--   없었습니다. 그래서 —
--     · `fee_policy.offer_id` 가 offer(id) 를 가리켜서 **상품별 요율을
--       못 걸고** 업체 전체 정책만 걸렸습니다.
--     · `request.offer_id` 도 같은 FK 라, 화면이 offerId 를 보내기
--       시작하는 날 **그 접수의 저장이 통째로 실패**합니다 (접수번호가
--       안 나오고 슬랙으로만 갑니다).
--
-- ⚠️⚠️ **손으로 적은 줄이 아닙니다.** js/data/offers.js 에서 뽑았고,
--   `build-pages.js` 의 `checkOfferSql()` 이 **양쪽을 맞춰 봅니다** —
--   한쪽만 고치면 빌드가 멈춥니다 (이 저장소가 `deal.js` ↔ `deal_move`
--   로 지키는 것과 같은 방식).
-- ⚠️ `status` 는 **전부 `info`** 입니다 — 제휴사가 0곳인데 `live` 로
--   두면 "신청 가능" 으로 읽힙니다 (절대 규칙 5 · checkOffers 가 막습니다).
-- ⚠️ 업종 · 지역을 비워 둡니다 — `{}` 는 "전업종 · 전국" 입니다.
--
-- ⚠️⚠️ **2026-11-01 — 창업 · 폐업 상품 스물일곱을 중고폰 열일곱으로
--   갈았습니다.** 이 파일은 운영 DB 에 **아직 안 돌아갔습니다**
--   (`APPLY_FROM = 8` · 사장님이 0007 까지 돌리셨습니다) — 그래서
--   새 번호를 만들지 않고 여기를 고쳤습니다 (0006 의 enum 과 같은
--   판단입니다). ⚠️ **이미 돌리신 뒤라면 이 파일을 고치지 말고 다음
--   번호로 새로 만드세요.**
-- ⚠️ `apply_type` 도 중고폰 꼴 넷입니다 — sell · quote · buy · bulk
--   (`install` · `rental` 은 창업 · 폐업 것이었습니다). 표의 그 칸은
--   제약 없는 text 라 값만 바뀌면 됩니다.
-- ════════════════════════════════════════════════════════════════════
insert into offer (id, name, lead, cats, industries, regions,
                   apply_type, needs_consult, cost_note, status) values
  ('ph-buyin', '스마트폰 직접 매입', '등급과 용량이 값을 가릅니다. 기준가가 없으면 예상 금액을 내지 않습니다.', array['buyin'], '{}', '{}', 'sell', false, 'quote', 'info'::offer_status),
  ('tab-buyin', '태블릿 · 워치 · 이어폰 매입', '스마트폰보다 기종이 적어 등급표가 단순합니다.', array['buyin'], '{}', '{}', 'sell', false, 'quote', 'info'::offer_status),
  ('self-buyin', '자급제 · 공기계 매입', '약정이 없는 기기라 명의와 잠금만 확인하면 됩니다.', array['buyin'], '{}', '{}', 'sell', false, 'quote', 'info'::offer_status),
  ('bid-match', '매입업체 경쟁입찰 중개', '저희가 사는 것이 아니라 제휴 매입업체가 입찰합니다 — 중개입니다.', array['buyin'], '{}', '{}', 'quote', false, 'quote', 'info'::offer_status),
  ('broken-buyin', '고장 · 파손폰 매입', '켜지지 않아도 값이 붙습니다. 무엇이 고장인지만 적으시면 됩니다.', array['broken'], '{}', '{}', 'sell', false, 'quote', 'info'::offer_status),
  ('part-lot', '부품용 단말기 매입', '살릴 수 없는 기기도 모듈 단위로는 거래됩니다.', array['broken'], '{}', '{}', 'sell', false, 'quote', 'info'::offer_status),
  ('fix-match', '수리 업체 연결', '기종과 증상으로 갈립니다. 부품을 구할 수 있는지가 먼저입니다.', array['fix'], '{}', '{}', 'quote', false, 'quote', 'info'::offer_status),
  ('fix-data', '데이터 복구 연결', '침수 · 액정 고장과 다른 일입니다. 복구율을 약속하지 않습니다.', array['fix'], '{}', '{}', 'quote', true, 'quote', 'info'::offer_status),
  ('shop-sale', '검수 중고폰 판매', '검수를 마친 기기만 올립니다. 등급과 배터리 상태를 같이 냅니다.', array['shop'], '{}', '{}', 'buy', false, 'quote', 'info'::offer_status),
  ('lot-whole', '등급별 벌크 도매', '대수와 등급 구성으로 값이 갈립니다. 한 대씩 보는 거래가 아닙니다.', array['wholesale'], '{}', '{}', 'bulk', true, 'quote', 'info'::offer_status),
  ('auction-fee', 'B2B 경매 중개', '참여 업체끼리 값을 냅니다 — 저희는 자리를 열고 중개합니다.', array['wholesale'], '{}', '{}', 'bulk', true, 'quote', 'info'::offer_status),
  ('corp-buyin', '기업 · 법인 대량 매입', '자산 목록과 반출 절차가 먼저입니다. 대수가 많으면 사람이 갑니다.', array['corp'], '{}', '{}', 'bulk', true, 'quote', 'info'::offer_status),
  ('wipe-cert', '데이터 완전 삭제 증명', '업무용 단말기는 삭제를 증명해야 반출이 끝납니다.', array['corp'], '{}', '{}', 'bulk', true, 'quote', 'info'::offer_status),
  ('export-buyer', '해외 바이어 연결', '나라마다 받는 등급과 기종이 다릅니다. 통관이 따라옵니다.', array['export'], '{}', '{}', 'bulk', true, 'quote', 'info'::offer_status),
  ('inspect-fee', '검수 · 등급 판정', '외관과 기능을 갈라서 봅니다. 등급은 사람이 정하고 기준을 밝힙니다.', array['inspect'], '{}', '{}', 'quote', false, 'quote', 'info'::offer_status),
  ('pickup-post', '택배 · 방문 수거', '포장이 반입니다. 깨진 액정은 따로 싸야 더 깨지지 않습니다.', array['pickup'], '{}', '{}', 'sell', false, 'quote', 'info'::offer_status),
  ('access-sale', '액세서리 · 부자재', '기기와 같이 나가는 것들입니다. 케이스 · 충전기 · 포장재.', array['access'], '{}', '{}', 'buy', false, 'quote', 'info'::offer_status)
on conflict (id) do update set
  name = excluded.name, lead = excluded.lead, cats = excluded.cats,
  apply_type = excluded.apply_type, needs_consult = excluded.needs_consult,
  cost_note = excluded.cost_note;
-- ⚠️⚠️ `status` 를 덮어쓰지 않습니다 — 사장님이 제휴 계약을 하고
--   `live` 로 켜 두셨는데 다시 돌리면 `info` 로 **되돌아갑니다.**
--   (verified · listed 를 save_provider 가 안 건드리는 것과 같은 까닭.)

insert into schema_version (n, name) values (12, '0012_owner_assignable_offer')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0013_provider_contact_settlement.sql ---------------------------- */
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

/* ---------------------------- 0014_provider_self_notify.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0014 — 업체가 스스로 고치는 길 + 고객 진행 안내 받기
--
-- 2026-10-22 오픈 전 전수검사 **P2 ⑳ ⑱** (docs/PRELAUNCH_AUDIT-2026-10-22.md §5)
--
--   ⑳ 업체가 **스스로 등록 · 수정**하는 화면
--      → 지금은 직원이 /admin 9번 칸에서 적습니다. 업체가 늘면
--        소개 한 줄을 고치는 일에도 직원을 거쳐야 합니다.
--   ⑱ 고객에게 **상태 변경 알림**
--      → 접수번호를 화면에서 한 번 보고 끝입니다. 배정 · 견적 도착을
--        알 길이 없습니다.
--
-- 두 문                                누가
--   save_provider_self()               업체 **자기 줄만**
--   save_provider_contact()            직원 · 관리자 + **업체 자기 줄** (넓힙니다)
-- 칸 둘
--   request.notify_ok / notify_at      진행 안내를 받으시겠다는 **선택** 동의
--
-- ⚠️⚠️ **돌린 파일(0001 ~ 0013)을 고치지 않았습니다.** 0013 의 함수는
--   `create or replace` 로 갈아 끼웁니다 (같은 인자 · 같은 이름).
-- ⚠️ 두 번 돌려도 안전합니다 (`if not exists` · `create or replace`).
-- ════════════════════════════════════════════════════════════════════

begin;

-- ════════════════════════════════════════════════════════════════════
-- ⑳-1 업체가 스스로 고치는 길 — ⚠️⚠️ **표를 닫고 문으로만** 받습니다
--
-- 0001 이 `grant update (name, intro, regions, gu, industries, subs,
-- since, consult_hours) on provider to authenticated` 로 **칸 단위
-- 쓰기**를 열어 두었습니다. 그런데 —
--
--   ① **감사 기록이 안 남습니다.** PostgREST 로 바로 PATCH 하면
--      누가 언제 무엇을 고쳤는지가 어디에도 없습니다 (§8).
--   ② **`name` 과 `subs` 까지 열려 있었습니다.** 상호는 제휴 계약의
--      이름이고, `subs`(하는 일)는 **어느 분야 화면에 나오는가**를
--      정합니다 — 업체가 스스로 넓히면 철거만 하는 곳이 세무 화면에
--      앉습니다. 그건 `approve_provider()` 가 보는 일입니다.
--   ③ 그 권한을 **쓰는 코드가 한 줄도 없었습니다** — `api/_db.js` 에
--      update 를 보내는 함수 자체가 없습니다 (select · insert · rpc 뿐).
--
-- 그래서 권한을 걷고 **문 하나**로 모읍니다. 0003 이 돈 쪽에,
-- 0004 가 상태 쪽에 한 것과 같습니다 — **기록 없이 지나갈 길이
-- 없습니다.**
-- ════════════════════════════════════════════════════════════════════
revoke update on provider from authenticated;

-- ⚠️⚠️ **업체가 못 건드리는 것** — 상호 · 하는 일 · 확인 배지 · 공개 ·
--   배정 가능 · 주소(id). 앞의 둘은 여기서, 뒤의 넷은 애초에 이
--   함수가 안 씁니다 (+ `provider_guard()` 트리거가 한 번 더).
create or replace function save_provider_self(
  p_data jsonb default '{}'::jsonb,   -- intro · regions · gu · industries · since · consultHours
  p_why  text  default null
) returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_pv   text     := my_provider();
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  -- ⚠️⚠️ 역할을 요청에서 읽지 않습니다 — 토큰으로 `account` 를 보고
  --   거기 적힌 `provider_id` 만 고칩니다. 남의 업체는 애초에 못 집습니다.
  if v_role <> 'provider' or v_pv is null then
    raise exception '업체 계정으로 로그인하셔야 합니다';
  end if;
  if not exists (select 1 from provider where id = v_pv) then
    raise exception '연결된 업체를 찾을 수 없습니다';
  end if;

  update provider set
    intro = nullif(btrim(coalesce(p_data->>'intro','')), ''),
    regions = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'regions','[]'::jsonb)) x), '{}'),
    gu = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'gu','[]'::jsonb)) x), '{}'),
    industries = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'industries','[]'::jsonb)) x), '{}'),
    since = nullif(p_data->>'since','')::int,
    consult_hours = nullif(btrim(coalesce(p_data->>'consultHours','')), '')
  where id = v_pv;

  -- ⚠️ 같은 트랜잭션입니다 — 기록이 실패하면 수정도 안 됩니다 (§8).
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'provider', v_pv, 'self-updated', p_why, p_data);

  return v_pv;
end $$;

revoke all on function save_provider_self(jsonb, text) from public;
grant execute on function save_provider_self(jsonb, text) to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ⑳-2 담당자도 업체가 적을 수 있게 — ⚠️ **자기 줄만**
--
-- 0013 이 직원 · 관리자만으로 열어 두었습니다. 그런데 담당자 이름 ·
-- 직통은 **업체가 제일 잘 압니다** (사람이 바뀌면 그 자리에서 고칠
-- 수 있어야 합니다). 읽기는 0013 의 `provider_contact_self` 로 이미
-- 열려 있어서, 쓰기만 넓힙니다.
--
-- ⚠️⚠️ `p_provider` 를 **그대로 믿지 않습니다** — 업체 계정이면
--   `my_provider()` 와 같은지 보고 다르면 거절합니다. 안 보면 업체가
--   남의 업체 담당자를 덮어쓸 수 있습니다.
-- ⚠️⚠️ 이 문은 **`FN_SAY` 에 없습니다** (api/deal.js) — 알림에 담당자
--   이름 · 번호가 실리면 그 순간 새 수탁 범위입니다 (제26조).
-- ════════════════════════════════════════════════════════════════════
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
  if v_role = 'provider' then
    -- ⚠️ 업체는 **자기 줄만** — 요청이 보낸 id 를 믿지 않습니다
    if my_provider() is null or p_provider is distinct from my_provider() then
      raise exception '내 업체의 담당자만 적을 수 있습니다';
    end if;
  elsif v_role not in ('staff','admin') then
    raise exception '업체 담당자 등록은 업체 · 직원 · 관리자만 할 수 있습니다';
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

  -- ⚠️⚠️ **감사 기록에 연락처를 싣지 않습니다** (0013 과 같은 까닭).
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
-- ⑱ 고객 진행 안내 — ⚠️⚠️ **선택**이고 기본은 꺼짐입니다
--
-- 배정 · 견적 도착은 **거래 정보**라 정보통신망법 제50조의 광고성
-- 정보와 다른 건입니다 (접수 완료 안내를 동의 없이 보내는 것과 같은
-- 결). 그래도 **받으시겠다고 하신 분에게만** 보냅니다 —
--
--   ① 광고가 섞이기 쉬운 자리입니다. 한 줄만 권유를 넣으면 그때부터
--      광고이고 사전동의가 먼저입니다 — 동의를 먼저 받아 두면 그
--      선을 넘을 일이 줄어듭니다.
--   ② 끄는 길이 없는 채로 보내면 받기 싫은 분이 막을 수가 없습니다
--      (로그인 없이 들어오는 접수라 수신거부 토큰도 없습니다).
--
-- ⚠️⚠️ **boolean 하나로 두지 않습니다.** `notify_at`(언제 받았나)이
--   같이 있어야 분쟁에서 "받았다" 를 댈 수 있습니다 — `agree_at` ·
--   `agree3rd_at` 과 같은 규칙입니다.
-- ⚠️ 기본값 **false** 입니다 (fail-closed). 안 고르신 것을 "받겠다"
--   로 읽으면 그게 동의 없이 보내는 것입니다.
-- ════════════════════════════════════════════════════════════════════
alter table request add column if not exists notify_ok boolean not null default false;
alter table request add column if not exists notify_at timestamptz;

-- ⚠️⚠️ **동의했다면 시각이 있어야 합니다.** 화면 버그로 true 만 들어오면
--   "언제 받았나" 를 못 대고, 그건 받지 않은 것과 같습니다.
alter table request drop constraint if exists request_notify_at_ok;
alter table request add constraint request_notify_at_ok
  check (notify_ok = false or notify_at is not null);

-- ⚠️ 쓰기 권한을 주지 않습니다 — 접수는 service key 가 넣고(RLS·GRANT
--   를 지나갑니다), 끄는 것은 **메일의 안내대로 회신**입니다. 화면에
--   끄는 단추를 두려면 문을 하나 더 내야 하고(로그인이 필요합니다),
--   지금은 로그인한 고객이 0명이라 그게 작동하지 않는 버튼입니다.

insert into schema_version (n, name) values (14, '0014_provider_self_notify')
  on conflict (n) do nothing;

commit;

/* ---------------------------- 0015_retain_fee.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
--  0015 — 유지 수수료 (2026-10-25 진단 P1-6)
-- ════════════════════════════════════════════════════════════════════
--  통신 · 렌탈처럼 **유지되는 동안** 받는 구조를 담습니다.
--
--  왜 `sub` 로 안 되는가 —
--    `sub`      회차마다 **정액**        (월 5만원 집과 15만원 집이 같아집니다)
--    `mrr_rate` 월 **요금의 일정 비율**  × 회차
--
--  그리고 유지분은 **계약한 날이 아니라 유지된 것을 확인한 날** 확정
--  됩니다. `done`(이행 완료)으로 두면 설치한 날 전부를 확정하게 되고,
--  그건 아직 받지도 않은 달까지 청구하는 것입니다 — 그래서 확정 조건에
--  `kept`(약정 유지 확인 후)를 같이 늘립니다.
--
--  ⚠️⚠️ **트랜잭션으로 감싸지 마세요.** `alter type … add value` 로 더한
--  값은 같은 트랜잭션 안에서 쓸 수 없습니다 — psql 기본(문장마다 자동
--  커밋)으로 돌리세요. 0006 과 같은 까닭입니다.
--
--  ⚠️ **두 번 돌려도 안전합니다** (add value if not exists ·
--  on conflict do nothing).
--
--  ⚠️⚠️ **0001 을 고치지 않았습니다.** 그 파일은 이미 돌아갔고,
--  마이그레이션은 번호를 다시 쓰지 않습니다. 그래서 값을 늘리는 길은
--  이 `alter type` 뿐이고, `build-pages.js` 의 `checkDealSql()` 이
--  **0001 의 create type 과 뒤의 alter type 을 합쳐서** 화면의 key 와
--  맞춰 봅니다 (한쪽만 고치면 빌드가 멈춥니다).
-- ════════════════════════════════════════════════════════════════════

-- ── 수익모델 둘 (js/data/fee.js 의 AM_FEE_TYPE) ──────────────────────
alter type fee_type add value if not exists 'mrr_rate' after 'sub';
alter type fee_type add value if not exists 'retain'   after 'mrr_rate';

-- ── 확정 조건 하나 (js/data/fee.js 의 AM_FEE_WHEN) ───────────────────
alter type fee_when add value if not exists 'kept' after 'paid';

-- ⚠️ 표는 한 칸도 안 늘렸습니다. 월 요금 · 회차는 관리자 화면이
--    적어서 계산하고, 확정된 금액만 `deal.fee` 로 들어갑니다 —
--    `deal.amount` 에는 그 기간에 손님이 낸 요금 합(base)이 들어가서
--    "수수료가 계약금액보다 크다" 는 자물쇠가 그대로 돕니다.
-- ⚠️⚠️ `fee_rate_range` 제약(0 < rate ≤ 100)이 유지분에도 그대로
--    걸립니다 — 월 요금의 100% 를 넘게 받는 정책은 없습니다.

insert into schema_version (n, name) values (15, '0015_retain_fee')
  on conflict (n) do nothing;

/* ---------------------------- 0016_provider_apply.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
--  0016 — 업체 입점 신청을 담습니다 (2026-10-25 진단 P1-7)
-- ════════════════════════════════════════════════════════════════════
--  `/join` 으로 들어온 입점 신청이 **슬랙으로만** 가고 있었습니다.
--  채널 글이 묻히면 그 업체는 사라지고, 직원은 전화하려고 그 글을
--  찾아 **업체명 · 번호 · 하는 일을 다시 손으로 칩니다** — 그러다
--  하나라도 틀리면 `/admin` 9번 칸이 만드는 등록 줄이 어긋납니다.
--
--  ⚠️⚠️ **`provider` 에 바로 넣지 않습니다.** 신청은 아직 **업체가
--  아닙니다** — 통화도 안 해 봤고 계약도 없습니다. `provider` 에
--  꽂으면 배정 고르개에 바로 뜨고, 거기 배정되면 그 순간 손님 성함 ·
--  연락처가 **아무 합의도 없는 회사로** 넘어갑니다 (개인정보보호법
--  제17조 제2항 · 0012 의 `assignable` 을 둔 까닭 그대로).
--  통화해서 합의가 되면 **`/admin` 9번 칸**이 `provider` 줄을 만들고,
--  그때 이 신청의 `provider_id` 가 그 업체를 가리킵니다.
--
--  ⚠️⚠️ **손님에게는 한 글자도 안 나갑니다.** 아래 RLS 에 고객 정책이
--  **아예 없습니다** — 업체 담당자 표(0013)와 같은 선입니다.
--
--  ⚠️ 두 번 돌려도 안전합니다 (if not exists · create or replace ·
--  on conflict). 돌린 파일(0001)은 **고치지 않았습니다.**
-- ════════════════════════════════════════════════════════════════════

begin;

-- ── 신청 상태 넷 (js/data/deal.js 의 AM_APPLY_ST) ────────────────────
--  ⚠️⚠️ **화면의 key 와 여기가 같아야 합니다.** 어긋나면 화면이 모르는
--  값이 와서 딱지가 **조용히 빈 칸**이 됩니다 (이 저장소가 `gyeonggi` ·
--  `espresso` 로 겪은 자리) — `build-pages.js` 의 `checkDealSql()` 이
--  빌드마다 맞춰 봅니다.
--  ⚠️ `done` 은 "등록까지 끝" 이고 `drop` 은 "진행 안 함" 입니다.
--  돌아올 수 없는 것이 아니라, 다시 `called` 로 되돌릴 수 있습니다 —
--  "다음 달에 다시 연락 주세요" 를 실패로 닫지 않는 것과 같은 까닭
--  (보류에 `end:true` 를 안 붙인 그 자리).
do $$ begin
  if not exists (select 1 from pg_type where typname = 'apply_state') then
    create type apply_state as enum ('new', 'called', 'done', 'drop');
  end if;
end $$;

create table if not exists provider_apply (
  id          uuid primary key default gen_random_uuid(),
  -- 접수번호 — ⚠️ 손님(업체)에게 돌려주는 값이라 **저장된 뒤에만** 나갑니다
  no          text not null unique,
  company     text not null,
  brn         text,                        -- 사업자등록번호 (적으시면)
  name        text not null,               -- 담당자 성함
  tel         text not null,
  email       text,
  region      text,                        -- 시 · 도 이름 (화면이 보낸 글 그대로)
  industry    text,                        -- 주로 하시는 업종
  -- ⚠️ 하시는 일은 **이름 글자**입니다 (분류 key 가 아닙니다). `/join` 의
  --   칸이 자유 입력이라 key 로 바꿀 수가 없고, 바꿔 적으면 틀립니다 —
  --   등록 줄은 사람이 `/admin` 9번 칸에서 **골라서** 만듭니다.
  services    text[] not null default '{}',
  note        text,                        -- 더 하신 말씀
  -- ⚠️⚠️ 동의를 **시각으로** 남깁니다 (제15조). boolean 으로 두면
  --   "언제 받았나" 를 못 대고, 그게 분쟁에서 받지 않은 것과 같아집니다.
  agree_at    timestamptz not null,
  state       apply_state not null default 'new',
  -- 등록까지 끝난 신청이 가리키는 업체 — ⚠️ 업체를 내려도 신청은 남습니다
  provider_id text references provider(id) on delete set null,
  memo        text,                        -- 마지막으로 적은 사유 (통화 결과 등)
  moved_by    uuid references auth.users(id) on delete set null,
  moved_at    timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists provider_apply_new_idx
  on provider_apply (state, created_at desc);

alter table provider_apply enable row level security;

-- ⚠️⚠️ **고객 · 업체 정책이 없습니다 — 한 줄도 못 봅니다.** 다른 회사의
--   입점 신청이 보이면 그 자체가 유출입니다 (상호 · 담당자 · 번호).
drop policy if exists provider_apply_staff on provider_apply;
create policy provider_apply_staff on provider_apply for select
  using (my_role() in ('staff','admin'));

-- ⚠️⚠️ **읽기만 줍니다.** 쓰기를 주면 기록 없이 지나가는 길이 하나
--   생깁니다 (§8) — 0007 · 0008 · 0013 과 같은 규칙입니다. 넣는 것은
--   접수(service key)가, 상태를 바꾸는 것은 아래 문이 합니다.
-- ⚠️ `anon`(로그인 안 한 사람)에게는 아무 권한도 주지 않습니다.
grant select on provider_apply to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- 상태를 바꾸는 문 하나 (§8 "변경자 · 변경일시 · 사유를 기록한다")
-- ════════════════════════════════════════════════════════════════════
create or replace function set_apply_state(
  p_apply    uuid,
  p_to       text,                       -- new | called | done | drop
  p_provider text default null,          -- 'done' 일 때 등록된 업체
  p_why      text default null
) returns uuid
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_was  apply_state;
  v_to   apply_state;
  v_pv   text;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if v_role not in ('staff','admin') then
    raise exception '입점 신청 처리는 직원 · 관리자만 할 수 있습니다';
  end if;

  select state, provider_id into v_was, v_pv
    from provider_apply where id = p_apply;
  if v_was is null then raise exception '없는 입점 신청입니다'; end if;

  -- ⚠️⚠️ **형변환에 맡기지 마세요.** 그대로 두면 손님 화면에
  --   `invalid input value for enum apply_state: "x"` 가 그대로 나갑니다 —
  --   0008 에서 겪은 자리입니다. 사람 말로 거절합니다.
  if p_to is null or p_to not in ('new','called','done','drop') then
    raise exception '바꿀 상태를 골라 주세요 (새 신청 · 통화함 · 등록 완료 · 진행 안 함)';
  end if;
  v_to := p_to::apply_state;

  -- ⚠️⚠️ **등록 완료는 그 업체를 가리켜야 합니다.** 안 가리키면
  --   "등록했다" 는 말만 남고 어느 업체인지가 사라져서, 나중에 이
  --   신청과 그 업체를 이을 길이 없습니다 (절대 규칙 5).
  if v_to = 'done' then
    v_pv := coalesce(nullif(btrim(coalesce(p_provider,'')), ''), v_pv);
    if v_pv is null then
      raise exception '등록 완료로 두려면 등록한 업체를 골라 주세요';
    end if;
    if not exists (select 1 from provider where id = v_pv) then
      raise exception '없는 업체입니다 — % (먼저 관리자 설정 9번 칸에서 등록하세요)', v_pv;
    end if;
  end if;

  -- ⚠️ 진행 안 함은 **사유를 받습니다** (§8). 왜 안 하기로 했는지가
  --   안 남으면 다음 사람이 그 업체에 또 전화합니다.
  if v_to = 'drop' and nullif(btrim(coalesce(p_why,'')), '') is null then
    raise exception '진행하지 않는 까닭을 적어 주세요';
  end if;

  update provider_apply
     set state = v_to,
         provider_id = case when v_to = 'done' then v_pv else provider_id end,
         -- ⚠️ 적어 주신 사유를 줄에도 남깁니다 — 목록에서 "통화했는데
         --   다음 주에 다시" 를 보려면 감사 기록을 또 묻지 않아야 합니다
         memo = coalesce(nullif(btrim(coalesce(p_why,'')), ''), memo),
         moved_by = v_me, moved_at = now()
   where id = p_apply;

  -- ⚠️⚠️ **기록과 상태 변경이 한 트랜잭션입니다** — 기록이 실패하면
  --   상태도 안 바뀝니다. 기록 없이 지나갈 길이 없습니다 (§8).
  -- ⚠️⚠️ **상호 · 성함 · 번호를 기록에 싣지 않습니다.** 감사 기록은
  --   고칠 수도 지울 수도 없는 것이라, 거기 연락처를 박으면 그 자체가
  --   또 하나의 보관입니다 (`save_provider_contact` 와 같은 규칙).
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, v_role, 'provider_apply', p_apply::text,
          v_was::text, v_to::text, p_why,
          case when v_to = 'done'
               then jsonb_build_object('provider', v_pv) else '{}'::jsonb end);

  return p_apply;
end $$;

revoke all on function set_apply_state(uuid, text, text, text) from public;
grant execute on function set_apply_state(uuid, text, text, text) to authenticated;


insert into schema_version (n, name) values (16, '0016_provider_apply')
  on conflict (n) do nothing;

commit;

/* ---------------------------- 0017_tel_key.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0017 — 전화번호를 **숫자만 남긴 칸** (2026-10-25 P0 · 지시서 §3)
--
-- ⚠️⚠️ **왜 필요한가 — 중복 검사가 통째로 무효였습니다.**
-- `api/quote.js` 가 최근 신청을 찾을 때 `?tel=eq.<숫자만>` 으로
-- 물었는데, 표에는 손님이 적으신 그대로 들어갑니다 —
--
--     저장되는 값   request.tel = '010-1234-5678'
--     찾는 질의     ?tel=eq.01012345678
--                 → 한 줄도 안 걸립니다
--
-- 그 조회가 0건이면 **그 안에서 하는 멱등 비교와 스팸 판정도 같이
-- 안 돕니다.** 유실은 `0009` 의 `request_idem_once` 가 막았지만,
-- 슬랙에 2건이 가고 다시 누른 손님은 접수번호를 못 받았습니다.
--
-- ⚠️ 고치는 길이 둘이었습니다 —
--   ① 두 꼴을 `or` 로 묻기            → 질의가 길어지고 인덱스를 못 씁니다
--   ② **숫자만 남긴 칸을 두고 거기에 인덱스** ← 이쪽입니다
--
-- ⚠️⚠️ **생성 칸(generated)입니다 — 손으로 넣지 않습니다.** 코드가 두
-- 곳에서 각자 정규화하면 어긋나는 날이 옵니다 (이 저장소가 같은 규칙을
-- 두 곳에 적어 여러 번 겪은 자리입니다). DB 가 `tel` 에서 만듭니다.
--
-- ⚠️ 새 개인정보가 아닙니다 — `tel` 과 **같은 값**이고, 0001 이 이미
-- `grant select on request to authenticated` 를 표째로 주고 RLS 가 줄을
-- 좁힙니다. 볼 수 있는 사람이 늘지 않습니다.
--
-- ⚠️⚠️ **운영 DB 에 자동으로 돌리지 않습니다.** 대표님이 Supabase SQL
-- Editor 에 붙여 넣으십니다 (db/README.md · docs/GO-LIVE.md).
-- ⚠️ `request` 가 비어 있지 않아도 안전합니다 — 생성 칸이라 있는 줄도
-- 그 자리에서 채워집니다 (표를 한 번 훑습니다).
-- ════════════════════════════════════════════════════════════════════

begin;

-- ── ① 숫자만 남긴 칸 ────────────────────────────────────────────────
-- ⚠️ `stored` 입니다 — `virtual` 은 PG17 부터이고 인덱스를 못 겁니다.
alter table request
  add column if not exists tel_key text
  generated always as (regexp_replace(coalesce(tel, ''), '[^0-9]', '', 'g')) stored;

-- ⚠️⚠️ 인덱스가 없으면 신청이 쌓일수록 접수마다 표를 통째로 훑습니다
-- (접수는 손님이 기다리는 자리입니다 · 화면 제한 20초).
create index if not exists request_tel_key_at
  on request (tel_key, created_at desc);

-- ── ② 멱등 열쇠로 바로 찾는 길 ──────────────────────────────────────
-- ⚠️ `0009` 의 `request_idem_once` 는 **unique 이지만 부분**입니다
-- (`where idem is not null`). 조회에도 그 인덱스가 쓰이는데, 질의에
-- `idem=eq.…` 만 있으면 플래너가 부분 조건을 못 알아보는 경우가 있어
-- 명시적으로 한 줄 더 두지 않습니다 — unique 인덱스로 충분합니다.
-- 이 주석은 "왜 인덱스를 또 안 만들었나" 에 대한 답입니다.

-- ── ③ 판 번호 ──────────────────────────────────────────────────────
insert into schema_version (n, name) values (17, '0017_tel_key')
  on conflict (n) do nothing;

commit;

/* ---------------------------- 0018_provider_account_link.sql ---------------------------- */
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

/* ---------------------------- 0019_request_scope.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0019 — **남의 건을 밀 수 없습니다** (2026-10-25 최종 지시서 §6 · §7)
--
-- ⚠️⚠️ **무엇이 뚫려 있었나.** `move_state()` 는 길 표(`deal_move`)에서
-- **역할만** 봅니다 — "이 상태에서 이 상태로, provider 가 갈 수 있는가".
-- 그런데 **어느 업체의 건인가**를 아무 데서도 안 봤습니다. 그래서 —
--
--     pv-two 계정으로 로그인해서
--     select move_state('<pv-one 에게 배정된 신청>','accepted','{}')
--
-- 가 **그대로 통과했습니다.** 길 표의 업체 전용 네 걸음
-- (assigned→accepted · accepted→consult · consult→quoted · quoted→nego)
-- 과 nego→signed · signed→done 이 전부 그랬습니다.
--
-- ⚠️ RLS 는 안 뚫립니다 — 그 업체는 그 신청을 **읽지는** 못합니다
-- (`request_assigned`). 하지만 `move_state` 는 security definer 라
-- RLS 를 지나가고, **쓰는 것**은 막히지 않았습니다. "읽기만 막아 두면
-- 된다" 가 아닌 자리입니다.
--
-- 무엇이 나빠지나 —
--   · 감사 기록에 **남이 수락한 것**으로 남습니다 (§8 의 뜻이 사라집니다).
--   · 경쟁 업체가 남의 건을 협의 · 계약까지 밀 수 있습니다.
--   · 고객 쪽도 같습니다 — 고객 역할은 `lost`(취소) · `hold`(보류)를
--     갈 수 있는데 **자기 신청인지**를 안 봐서, 남의 접수를 취소할 수
--     있었습니다.
--
-- ⚠️⚠️ **함수를 다시 쓰지 않았습니다.** `move_state` 는 0004 에서
-- 만들고 0007 이 다시 썼습니다 (signed 토막). 또 베껴 쓰면 **세 벌**이
-- 되고, 이 저장소는 같은 규칙을 두 곳에 적어 어긋난 사고를 여러 번
-- 겪었습니다. 그래서 **트리거**로 얹습니다 — 0018 의
-- `provider_link_guard` 와 같은 방식이고, 함수를 어떻게 고치든
-- 그 길로는 못 지나갑니다.
--
-- ⚠️ service key 로 부르는 길(접수)은 그대로 지납니다 — 그때는
-- `auth.uid()` 가 비어서 `my_role()` 이 null 이고, 이 트리거는
-- **역할이 있는 사람만** 봅니다 (접수는 로그인 없이 들어오는 것이
-- 맞습니다).
--
-- ⚠️⚠️ **운영 DB 에 자동으로 돌리지 않습니다.** 대표님이 Supabase SQL
-- Editor 에 붙여 넣으십니다.
-- ════════════════════════════════════════════════════════════════════

begin;

create or replace function request_scope_check() returns trigger
  language plpgsql security definer set search_path = public as $$
declare v_role app_role := my_role(); v_pv text;
begin
  -- 상태가 안 바뀌면 볼 것이 없습니다 (담당자 · 메모만 고친 경우)
  if new.state is not distinct from old.state then return new; end if;

  -- ⚠️ 역할이 없으면 서버(service key)입니다 — 접수가 그 길입니다
  if v_role is null then return new; end if;
  -- 직원 · 관리자는 전부 봅니다 (그게 일입니다)
  if v_role in ('staff','admin') then return new; end if;

  if v_role = 'provider' then
    v_pv := my_provider();
    if v_pv is null then
      raise exception '업체 계정에 업체가 이어져 있지 않습니다 — 관리자에게 알려 주세요';
    end if;
    -- ⚠️⚠️ **배정된 업체만**입니다. 남의 건을 수락 · 상담 · 견적 ·
    --   협의로 밀면 그 기록이 거짓이 됩니다 (§8).
    if not exists (select 1 from assignment
                    where request_id = new.id and provider_id = v_pv) then
      raise exception '이 신청에 배정된 업체가 아닙니다 — 남의 건은 진행할 수 없습니다';
    end if;
    return new;
  end if;

  if v_role = 'customer' then
    -- ⚠️⚠️ **자기 신청만**입니다. 고객 역할이 갈 수 있는 길은 취소와
    --   보류뿐인데, 남의 접수를 취소할 수 있으면 그것만으로 사고입니다.
    -- ⚠️ 아직 아무에게도 안 붙은 접수(user_id null)는 고객 역할로
    --   건드릴 수 없습니다 — 번호 + 연락처로 가져가신 뒤입니다
    --   (`claim_request`).
    if new.user_id is null or new.user_id <> auth.uid() then
      raise exception '내 신청이 아닙니다 — 신청번호와 연락처로 먼저 가져와 주세요';
    end if;
    return new;
  end if;

  raise exception '이 신청을 바꿀 수 있는 역할이 아닙니다';
end $$;

drop trigger if exists request_scope_guard on request;
create trigger request_scope_guard
  before update of state on request
  for each row execute function request_scope_check();

-- ── 판 번호 ──────────────────────────────────────────────────────────
insert into schema_version (n, name) values (19, '0019_request_scope')
  on conflict (n) do nothing;

commit;

/* ---------------------------- 0020_device.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0020 · 직접 매입 재고 — 검수 · 원가 · 판매가 · 비용 · 수익
--   2026-10-29 ⑥
--
-- ⚠️⚠️ **중개 장부(deal)와 섞지 않습니다.** 그쪽은 "업체가 계약하고
-- 저희가 수수료를 받는" 기록이고, 이쪽은 "저희가 기기를 사서 파는"
-- 기록입니다. 한 표에 합치면 수수료 수익과 판매 마진이 한 숫자로
-- 섞여 **어느 쪽이 남는 장사인지** 영영 모릅니다.
--
-- ⚠️⚠️ **수익을 칸으로 두지 않습니다.** 원가 · 비용 · 판매가에서 셉니다
-- (뷰 v_device_pl). 숫자로 들고 있으면 누군가 손으로 고칠 수 있고
-- 원장과 어긋나기 시작합니다 — 업체 평점을 값으로 저장하지 않는 것과
-- 같은 까닭입니다.
--
-- ⚠️⚠️ **표에 쓰기 권한을 주지 않습니다.** 문 넷으로만 바뀌고, 문마다
-- 감사 기록을 **같은 트랜잭션에서** 남깁니다 (§8 — 기록 없이 지나갈
-- 길이 없습니다). 0003 · 0004 · 0007 과 같은 규칙입니다.
--
-- ⚠️ 고객은 **자기가 보낸 기기**만 봅니다. 업체는 **한 줄도** 못 봅니다 —
-- 직접 매입은 업체와 무관하고, 재고 · 원가가 보이면 그것이 곧 경쟁
-- 정보입니다 (지시서 §10 inhouse 분리와 같은 결입니다).
-- ════════════════════════════════════════════════════════════════════
begin;

-- ── 상태 아홉 ──────────────────────────────────────────────────────
-- ⚠️ js/data/stock.js 의 AM_DEV_ST 와 **같아야 합니다**
--    (checkStockSql() 이 빌드마다 맞춰 봅니다)
do $$ begin
  create type device_state as enum (
    'waiting','arrived','checking','regrade','checked',
    'listed','sold','returning','scrapped');
exception when duplicate_object then null; end $$;

do $$ begin
  create type device_cost_kind as enum (
    'inbound','repair','clean','outbound','fee','etc');
exception when duplicate_object then null; end $$;

-- ── 기기 한 대 ─────────────────────────────────────────────────────
create table if not exists device (
  id          uuid primary key default gen_random_uuid(),
  -- ⚠️ 접수에서 온 기기는 그 신청을 가리킵니다. 직접 사들인 기기는
  --    null 입니다 — 도매로 들여오는 길이 생겨도 이 표가 그대로 받습니다.
  request_id  uuid references request(id) on delete set null,
  state       device_state not null default 'waiting',

  -- 적어 주신 것 (접수 때) — ⚠️ **검수 결과와 갈라 둡니다.**
  -- 합치면 "무엇이 달랐나" 가 기록에서 사라지고, 재협의의 근거가
  -- 없어집니다 (중고폰 분쟁의 1번 원인).
  said_model  text not null,
  said_cap    int,
  said_grade  text,

  -- 검수 결과 — 확정된 것
  model       text,
  cap         int,
  grade       text,
  color       text,
  batt        int,
  imei_tail   text,              -- ⚠️ **뒤 네 자리만** (아래 제약)

  -- 돈 — ⚠️⚠️ 원 단위 정수. 문으로만 채워집니다.
  cost        bigint,            -- 매입원가 (고객에게 드린 금액)
  price       bigint,            -- 판매 희망가
  sold_price  bigint,            -- 실제 판매가
  sold_at     timestamptz,
  listed_at   timestamptz,
  checked_at  timestamptz,
  checked_by  uuid references auth.users(id) on delete set null,
  note        text,
  created_at  timestamptz not null default now(),

  constraint device_cost_sign  check (cost       is null or cost       >= 0),
  constraint device_price_sign check (price      is null or price      >= 0),
  constraint device_sold_sign  check (sold_price is null or sold_price >= 0),
  constraint device_batt_ok    check (batt is null or (batt > 0 and batt <= 100)),
  -- ⚠️⚠️ **IMEI 를 통째로 담지 마세요.** 기기 하나를 특정하는 값이라
  -- 그 자체가 개인정보에 가깝고, 새면 분실 신고 · 명의와 엮입니다.
  -- 같은 기종이 여러 대일 때 **가르는 데만** 쓰므로 뒤 네 자리면 됩니다.
  constraint device_imei_tail  check (imei_tail is null or imei_tail ~ '^[0-9]{4}$'),
  -- ⚠️⚠️ **검수 전에 원가가 적히면 안 됩니다** (§13 가짜 정산과 같은 결).
  constraint device_cost_needs_check
    check (cost is null or (checked_by is not null and checked_at is not null)),
  -- ⚠️⚠️ **판매 완료인데 판매가가 없으면 안 됩니다.**
  constraint device_sold_needs_price
    check (state <> 'sold' or (sold_price is not null and sold_at is not null))
);
create index if not exists device_state_idx on device(state);
create index if not exists device_req_idx   on device(request_id);

-- ── 검수 기록 ──────────────────────────────────────────────────────
-- ⚠️ 항목마다 한 줄입니다. 한 칸에 몰아 적으면 "무엇을 확인했는지" 가
--    글이 되어 기계가 못 셉니다 — 상품 상세의 "검수한 것" 이 이것입니다.
create table if not exists device_check (
  id        uuid primary key default gen_random_uuid(),
  device_id uuid not null references device(id) on delete cascade,
  item      text not null,                 -- 전원 · 액정 · 배터리 …
  result    text not null,                 -- ok | bad | na
  memo      text,
  by_user   uuid references auth.users(id) on delete set null,
  at        timestamptz not null default now(),
  constraint device_check_result check (result in ('ok','bad','na'))
);
create index if not exists device_check_dev_idx on device_check(device_id);

-- ── 비용 ───────────────────────────────────────────────────────────
-- ⚠️⚠️ **매입원가는 여기 없습니다** (device.cost 한 칸). 섞으면 줄
--    하나를 잘못 지울 때 원가가 바뀝니다.
create table if not exists device_cost (
  id        uuid primary key default gen_random_uuid(),
  device_id uuid not null references device(id) on delete cascade,
  kind      device_cost_kind not null,
  amount    bigint not null,
  memo      text,
  by_user   uuid references auth.users(id) on delete set null,
  at        timestamptz not null default now(),
  -- ⚠️ 음수를 허용합니다 — 환불 · 취소된 비용을 **지우지 않고** 차액으로
  --    적습니다 (환수를 갈아 치우지 않는 것과 같은 규칙).
  constraint device_cost_amount check (amount <> 0)
);
create index if not exists device_cost_dev_idx on device_cost(device_id);

-- ── 갈 수 있는 길 ──────────────────────────────────────────────────
-- ⚠️⚠️ plpgsql 에 손으로 적지 않습니다 — 표로 두고 함수가 읽습니다
--    (0004 의 deal_move 와 같은 방식). checkStockSql() 이 화면의
--    AM_DEV_MOVE 와 맞춰 봅니다.
create table if not exists device_move (
  from_st device_state not null,
  to_st   device_state not null,
  role    app_role    not null,
  primary key (from_st, to_st, role)
);
insert into device_move (from_st, to_st, role) values
  ('waiting','arrived','staff'),   ('waiting','arrived','admin'),
  ('waiting','returning','staff'), ('waiting','returning','admin'),
  ('arrived','checking','staff'),  ('arrived','checking','admin'),
  ('arrived','returning','staff'), ('arrived','returning','admin'),
  ('checking','checked','staff'),  ('checking','checked','admin'),
  ('checking','regrade','staff'),  ('checking','regrade','admin'),
  ('checking','returning','staff'),('checking','returning','admin'),
  ('regrade','checked','staff'),   ('regrade','checked','admin'),
  ('regrade','returning','staff'), ('regrade','returning','admin'),
  ('checked','listed','staff'),    ('checked','listed','admin'),
  ('checked','scrapped','admin'),
  ('listed','sold','staff'),       ('listed','sold','admin'),
  ('listed','checked','staff'),    ('listed','checked','admin'),
  ('listed','scrapped','admin')
on conflict do nothing;

-- ── 손익 — ⚠️⚠️ **세는 값입니다 (칸이 아닙니다)** ──────────────────
create or replace view v_device_pl as
select d.id, d.state, d.model, d.grade,
       coalesce(d.cost, 0)                                   as cost,
       coalesce((select sum(c.amount) from device_cost c
                  where c.device_id = d.id), 0)              as extra,
       coalesce(d.cost, 0) +
       coalesce((select sum(c.amount) from device_cost c
                  where c.device_id = d.id), 0)              as spent,
       d.price, d.sold_price,
       -- 예상 — ⚠️ 판매가를 정해 둔 기기에만
       case when d.price is null then null
            else d.price - (coalesce(d.cost,0) +
                 coalesce((select sum(c.amount) from device_cost c
                            where c.device_id = d.id),0)) end as est_profit,
       -- 실제 — ⚠️⚠️ **팔린 기기에만.** 안 팔린 기기의 예상을 실제에
       -- 섞으면 장부가 거짓말이 됩니다.
       case when d.state <> 'sold' or d.sold_price is null then null
            else d.sold_price - (coalesce(d.cost,0) +
                 coalesce((select sum(c.amount) from device_cost c
                            where c.device_id = d.id),0)) end as real_profit
  from device d;

-- ── RLS ────────────────────────────────────────────────────────────
alter table device       enable row level security;
alter table device_check enable row level security;
alter table device_cost  enable row level security;
alter table device_move  enable row level security;

-- ⚠️⚠️ 고객은 **자기가 보낸 기기**만, 그리고 **돈 칸은 안 줍니다**
--    (아래 GRANT 가 칸을 가릅니다 — RLS 는 줄은 막아도 칸은 못 막습니다).
create policy device_mine on device for select to authenticated
  using (request_id is not null and is_my_request(request_id));
create policy device_staff on device for select to authenticated
  using (my_role() in ('staff','admin'));
create policy device_check_staff on device_check for select to authenticated
  using (my_role() in ('staff','admin'));
-- ⚠️ 검수 결과는 고객도 봅니다 — "무엇을 확인했는지" 를 못 보면
--    재협의 금액을 받아들일 근거가 없습니다.
create policy device_check_mine on device_check for select to authenticated
  using (exists (select 1 from device d
                  where d.id = device_check.device_id
                    and d.request_id is not null
                    and is_my_request(d.request_id)));
-- ⚠️⚠️ **비용은 직원 · 관리자만.** 고객에게 보이면 "원가가 이만큼인데
--    왜 이 값에 샀나" 가 되고, 업체에게 보이면 경쟁 정보입니다.
create policy device_cost_staff on device_cost for select to authenticated
  using (my_role() in ('staff','admin'));
create policy device_move_read on device_move for select to authenticated
  using (true);

-- ── GRANT — ⚠️⚠️ 읽기만. 쓰기는 문으로만 ──────────────────────────
-- ⚠️ anon 에게는 아무것도 주지 않습니다.
grant select (id, request_id, state, said_model, said_cap, said_grade,
              model, cap, grade, color, batt, checked_at, note, created_at,
              price, sold_at, listed_at)
  on device to authenticated;
-- ⚠️⚠️ `cost` · `sold_price` · `imei_tail` · `checked_by` 는 **안 줍니다** —
--    고객에게 원가가 보이면 안 되고, 직원 화면은 아래 함수로 받습니다.
grant select on device_check to authenticated;
grant select on device_cost  to authenticated;
grant select on device_move  to authenticated;

-- ════════ 문 넷 — 기록 없이 지나갈 길이 없습니다 ═══════════════════

-- ① 상태 옮기기
create or replace function move_device(
  p_device uuid, p_to device_state, p_data jsonb default '{}'::jsonb)
returns device language plpgsql security definer set search_path = public as $$
declare v_d device; v_role app_role; v_need text[]; v_k text;
        v_from device_state;
begin
  v_role := my_role();
  -- ⚠️⚠️ 변경자를 못 적는 기록은 기록이 아닙니다 (§8)
  if auth.uid() is null then raise exception '누가 바꾸는지 알 수 없습니다'; end if;
  if v_role not in ('staff','admin') then raise exception '권한이 없습니다'; end if;

  select * into v_d from device where id = p_device for update;
  if not found then raise exception '없는 기기입니다'; end if;
  v_from := v_d.state;

  -- ⚠️ 길 표에 없으면 거절 — 역할이 모자란 것과 **갈라서** 말합니다
  --    (화면이 다른 안내를 해야 합니다 · 0004 와 같은 규칙).
  if not exists (select 1 from device_move
                  where from_st = v_d.state and to_st = p_to) then
    raise exception '갈 수 없는 길입니다 — % → %', v_d.state, p_to;
  end if;
  if not exists (select 1 from device_move
                  where from_st = v_d.state and to_st = p_to and role = v_role) then
    raise exception '그 상태로 옮길 권한이 없습니다 — %', p_to;
  end if;

  -- ⚠️ 같이 적어야 하는 것 — `0` 과 `false` 는 값입니다 (있는지만 봅니다)
  v_need := case p_to
    when 'checked'   then array['grade','cost']
    when 'regrade'   then array['why']
    when 'listed'    then array['price']
    when 'sold'      then array['soldPrice']
    when 'returning' then array['why']
    when 'scrapped'  then array['why']
    else array[]::text[] end;
  foreach v_k in array v_need loop
    if p_data->v_k is null or p_data->>v_k = '' then
      raise exception '%', v_k;
    end if;
  end loop;

  if p_to = 'checked' then
    update device set state = p_to,
      grade = p_data->>'grade',
      model = coalesce(p_data->>'model', model),
      cap   = coalesce((p_data->>'cap')::int, cap),
      color = coalesce(p_data->>'color', color),
      batt  = coalesce((p_data->>'batt')::int, batt),
      imei_tail = coalesce(p_data->>'imeiTail', imei_tail),
      cost  = (p_data->>'cost')::bigint,
      checked_by = auth.uid(), checked_at = now()
     where id = p_device returning * into v_d;
  elsif p_to = 'listed' then
    update device set state = p_to, price = (p_data->>'price')::bigint,
      listed_at = now() where id = p_device returning * into v_d;
  elsif p_to = 'sold' then
    update device set state = p_to, sold_price = (p_data->>'soldPrice')::bigint,
      sold_at = now() where id = p_device returning * into v_d;
  else
    update device set state = p_to,
      note = coalesce(p_data->>'why', note)
     where id = p_device returning * into v_d;
  end if;

  -- ⚠️⚠️ 기록과 상태 변경이 **한 트랜잭션**입니다 — 기록이 실패하면
  --    상태도 안 바뀝니다.
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why)
  values (auth.uid(), v_role, 'device', p_device::text,
          v_from::text, p_to::text, nullif(p_data->>'why',''));
  return v_d;
end $$;

-- ② 검수 항목 적기
create or replace function add_device_check(
  p_device uuid, p_item text, p_result text, p_memo text default null)
returns device_check language plpgsql security definer set search_path = public as $$
declare v_r device_check; v_role app_role;
begin
  v_role := my_role();
  if auth.uid() is null then raise exception '누가 적는지 알 수 없습니다'; end if;
  if v_role not in ('staff','admin') then raise exception '권한이 없습니다'; end if;
  if coalesce(trim(p_item),'') = '' then raise exception '검수 항목이 비었습니다'; end if;
  if p_result not in ('ok','bad','na') then raise exception '검수 결과를 확인해 주세요'; end if;
  insert into device_check (device_id, item, result, memo, by_user)
  values (p_device, trim(p_item), p_result, nullif(trim(coalesce(p_memo,'')),''), auth.uid())
  returning * into v_r;
  return v_r;
end $$;

-- ③ 비용 적기
create or replace function add_device_cost(
  p_device uuid, p_kind device_cost_kind, p_amount bigint, p_memo text default null)
returns device_cost language plpgsql security definer set search_path = public as $$
declare v_r device_cost; v_role app_role;
begin
  v_role := my_role();
  if auth.uid() is null then raise exception '누가 적는지 알 수 없습니다'; end if;
  if v_role not in ('staff','admin') then raise exception '권한이 없습니다'; end if;
  -- ⚠️⚠️ **0 원 비용을 적지 않습니다** — 0 은 비용이 아니라 "없음" 이고,
  --    줄이 쌓이면 원장을 읽기만 어려워집니다.
  if p_amount is null or p_amount = 0 then raise exception '비용이 0 원입니다'; end if;
  insert into device_cost (device_id, kind, amount, memo, by_user)
  values (p_device, p_kind, p_amount, nullif(trim(coalesce(p_memo,'')),''), auth.uid())
  returning * into v_r;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why)
  values (auth.uid(), v_role, 'device_cost', p_device::text,
          p_kind::text, nullif(trim(coalesce(p_memo,'')),''));
  return v_r;
end $$;

-- ④ 기기 만들기 (접수에서 또는 직접)
create or replace function make_device(
  p_request uuid, p_model text, p_cap int default null, p_grade text default null)
returns device language plpgsql security definer set search_path = public as $$
declare v_d device; v_role app_role;
begin
  v_role := my_role();
  if auth.uid() is null then raise exception '누가 만드는지 알 수 없습니다'; end if;
  if v_role not in ('staff','admin') then raise exception '권한이 없습니다'; end if;
  if coalesce(trim(p_model),'') = '' then raise exception '기종이 비었습니다'; end if;
  insert into device (request_id, said_model, said_cap, said_grade)
  values (p_request, trim(p_model), p_cap, nullif(trim(coalesce(p_grade,'')),''))
  returning * into v_d;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state)
  values (auth.uid(), v_role, 'device', v_d.id::text, 'waiting');
  return v_d;
end $$;

revoke all on function move_device(uuid, device_state, jsonb) from public;
revoke all on function add_device_check(uuid, text, text, text) from public;
revoke all on function add_device_cost(uuid, device_cost_kind, bigint, text) from public;
revoke all on function make_device(uuid, text, int, text) from public;
grant execute on function move_device(uuid, device_state, jsonb) to authenticated;
grant execute on function add_device_check(uuid, text, text, text) to authenticated;
grant execute on function add_device_cost(uuid, device_cost_kind, bigint, text) to authenticated;
grant execute on function make_device(uuid, text, int, text) to authenticated;

insert into schema_version (n, name) values (20, '0020_device')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0021_inhouse.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0021 · 자체 매입 부서를 **경쟁 입찰에서 갈라 둡니다** (PHONEWAY §10)
--   2026-10-30 ⑤ 경쟁입찰
--
-- > §10 — "폰웨이 자체 매입 부서가 경쟁업체의 **비공개 입찰정보를
-- >        이용해** 부당하게 유리한 견적을 제시하지 못하도록"
--
-- ⚠️⚠️ **봉인은 이미 되어 있었습니다 — 구멍은 한 자리였습니다.**
--   재 보니 0008 의 정책이 이미 봉인 입찰입니다 —
--     · `quote_mine`   업체는 **자기 입찰만** 봅니다
--     · `assign_mine`  업체는 **자기 배정 줄만** 봅니다
--       (그래서 **누가 같이 입찰하는지도** 모릅니다)
--     · `quote_staff`  직원 · 관리자는 **전부** 봅니다 (운영자니까요)
--
--   그런데 `account` 는 `role` 과 `provider_id` 를 **둘 다** 들 수
--   있습니다. `update account set role='staff', provider_id='폰웨이'`
--   **한 줄**이면 같은 계정이
--     ① `quote_staff` 로 **경쟁 업체의 금액을 전부 보고**
--     ② `my_provider()` 로 **자기 입찰을 냅니다**
--   §10 이 막으라고 한 것이 정확히 그것이고, 오늘 **실제로 됩니다.**
--
-- ⚠️⚠️ **역할을 하나 더 만들지 않았습니다.** `inhouse` 를 app_role 에
--   더하면 `my_role()` 을 보는 자리가 **스물 몇 군데** 전부 그 값을
--   알아야 하고(길 표 · RLS · api/me.js 의 PICK · 화면), 한 곳만
--   놓치면 거기서 **아무 권한도 없는 유령**이 됩니다. 자체 매입
--   부서는 **업체 계정 그대로**입니다 — 남과 똑같이 자기 것만 봅니다.
--   달라지는 것은 **딱지 하나**(`provider.inhouse`)이고, 그건 권한이
--   아니라 **손님에게 누구인지 밝히는 표시**입니다.
--
--     ① provider.inhouse        폰웨이 자신의 매입 부서인가 (표시)
--     ② account_role_guard      업체에 이어진 계정은 직원 · 관리자가
--                               될 수 없습니다  ← **§10 의 자물쇠**
--     ③ set_provider_inhouse    그 딱지를 켜고 끄는 문 (관리자만)
--
-- ⚠️ 두 번 돌려도 안전합니다 (if not exists · create or replace).
-- ⚠️⚠️ 돌린 파일을 **고치지 않았습니다** — 다음 번호로 새로 만듭니다.
-- ════════════════════════════════════════════════════════════════════

begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 자체 매입 딱지
--
-- ⚠️⚠️ **권한이 아니라 표시입니다.** 이 칸이 참이어도 보는 것 · 내는
--   것이 한 글자도 안 달라집니다 — 달라지는 것은 **손님 화면**입니다.
--   입찰을 나란히 놓을 때 "폰웨이 직접 매입" 과 "제휴 매입업체" 가
--   구분이 없으면, 손님은 누구와 거래하는지 모르는 채로 고릅니다.
--   그 자체가 §10 이 막으려는 오인입니다 (전자상거래법 제20조 제1항의
--   중개자 고지와 같은 결입니다 — 어느 건에서 우리가 **당사자**인지).
-- ⚠️ 기본값은 거짓입니다. 모르는 것을 "우리 것" 으로 두면 안 됩니다.
-- ════════════════════════════════════════════════════════════════════
alter table provider add column if not exists inhouse boolean not null default false;

comment on column provider.inhouse is
  '폰웨이 자신의 매입 부서인가 — 권한이 아니라 손님에게 밝히는 표시 (§10)';

-- 손님 화면이 "제휴 매입업체" 만 따로 세는 자리가 생깁니다
create index if not exists provider_inhouse_idx on provider (inhouse) where inhouse;


-- ════════════════════════════════════════════════════════════════════
-- ② ⚠️⚠️ **§10 의 자물쇠** — 업체에 이어진 계정은 운영자가 될 수 없습니다
--
--   입찰을 **내는 사람**과 입찰을 **다 보는 사람**이 같은 계정일 수
--   없게 합니다. 이 한 줄이 §10 입니다.
--
-- ⚠️⚠️ **반대쪽도 막습니다** — 직원 · 관리자 계정에 `provider_id` 를
--   나중에 붙이는 길도 같은 줄이 막습니다 (둘 다 update 입니다).
--
-- ⚠️ **거절하는 말이 사람 말이라야 합니다** — `api/deal.js` 가 DB 의
--   거절 글을 그대로 보여 줍니다 (0008 에서 겪은 자리).
--
-- ⚠️⚠️ **이 트리거가 막지 못하는 것** — 운영자가 **다른 메일로** 업체
--   계정을 따로 만들어 두고, 운영자 계정으로 본 금액을 그쪽에 옮겨
--   적는 것. 그건 코드가 아니라 사람의 일입니다. 여기서 하는 일은
--   **한 계정이 둘 다 할 수 없게** 하는 것까지이고, 누가 무엇을
--   바꿨는지는 `audit_log` 가 들고 있습니다 (§8).
-- ════════════════════════════════════════════════════════════════════
create or replace function account_role_guard() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if new.provider_id is not null and new.role in ('staff','admin') then
    raise exception
      '업체에 이어진 계정은 직원 · 관리자가 될 수 없습니다 — 입찰을 내는 쪽과 입찰을 다 보는 쪽은 같은 계정일 수 없습니다 (§10)';
  end if;
  return new;
end $$;

drop trigger if exists account_role_guard_t on account;
create trigger account_role_guard_t before insert or update on account
  for each row execute function account_role_guard();

-- ⚠️⚠️ **이미 그런 줄이 있으면 여기서 멈춥니다.** 트리거는 앞으로만
--   막습니다 — 이미 있는 줄은 그대로 §10 구멍이고, 조용히 두면
--   "막았습니다" 가 거짓이 됩니다. 멈추고 어느 계정인지 말합니다.
do $$
declare v_n int; v_who text;
begin
  select count(*), coalesce(string_agg(id::text, ', '), '')
    into v_n, v_who
    from account where provider_id is not null and role in ('staff','admin');
  if v_n > 0 then
    raise exception
      '업체에 이어진 계정이 직원 · 관리자입니다 (%건: %) — 역할을 provider 로 내리거나 provider_id 를 비운 뒤 다시 돌려 주세요 (§10)',
      v_n, v_who;
  end if;
end $$;


-- ════════════════════════════════════════════════════════════════════
-- ③ 자체 매입 딱지를 켜고 끄는 문 — **관리자만**
--
-- ⚠️⚠️ **업체가 스스로 못 켭니다.** `provider_guard()` 가 한 번 더
--   막습니다 (아래) — 확인 배지 · 공개 여부와 같은 규칙입니다.
--   누가 "폰웨이 직접 매입" 딱지를 달 수 있으면 그 순간 손님이
--   누구와 거래하는지가 거짓이 됩니다 (절대 규칙 1).
-- ⚠️ `approve_provider` 에 인자를 더하지 않았습니다 — 그러면 그
--   함수의 **세 번째 사본**이 생깁니다 (0007 · 0012). 한 가지 일을
--   하는 작은 문이 낫습니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function set_provider_inhouse(
  p_id  text,
  p_on  boolean,
  p_why text default null
) returns provider
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_pv   provider;
begin
  if v_me is null then
    raise exception '변경자를 알 수 없습니다 — 로그인한 세션에서만 됩니다';
  end if;
  if v_role <> 'admin' then
    raise exception '자체 매입 표시는 관리자만 켜고 끌 수 있습니다';
  end if;

  update provider set inhouse = coalesce(p_on, false)
   where id = p_id
   returning * into v_pv;
  if v_pv.id is null then raise exception '없는 업체입니다'; end if;

  -- ⚠️ 같은 트랜잭션입니다 — 기록이 실패하면 딱지도 안 바뀝니다 (§8)
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why)
  values (v_me, v_role, 'provider', p_id,
          case when coalesce(p_on,false) then 'inhouse:on' else 'inhouse:off' end,
          nullif(btrim(coalesce(p_why,'')), ''));
  return v_pv;
end $$;


-- ════════════════════════════════════════════════════════════════════
-- ④ 업체가 스스로 못 건드리는 칸에 `inhouse` 를 더합니다
--
-- ⚠️⚠️ 0001 의 `provider_guard()` 를 **다시 씁니다** — 트리거는 그대로
--   두고 함수 본문만 갈아 끼웁니다 (0007 이 `move_state` 를 그렇게
--   했습니다). 새 트리거를 하나 더 달면 같은 규칙이 두 곳에 적힙니다.
-- ⚠️ 0001 의 세 줄(verified · listed · id)을 **글자까지 그대로** 둡니다 —
--   화면이 그 거절 글을 그대로 보여 줍니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function provider_guard() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if my_role() = 'admin' then return new; end if;
  if new.verified is distinct from old.verified then
    raise exception '확인 배지는 플랫폼이 서류를 확인한 뒤에만 켜집니다';
  end if;
  if new.listed is distinct from old.listed then
    raise exception '공개 여부는 관리자가 정합니다';
  end if;
  if new.id is distinct from old.id then
    raise exception '업체 주소(id)는 바꿀 수 없습니다 — 이미 색인된 주소입니다';
  end if;
  if new.inhouse is distinct from old.inhouse then
    raise exception '자체 매입 표시는 관리자가 정합니다';
  end if;
  return new;
end $$;


revoke all on function set_provider_inhouse(text, boolean, text) from public;
grant execute on function set_provider_inhouse(text, boolean, text) to authenticated;

-- ⚠️⚠️ `inhouse` 에 **쓰기 권한을 주지 않습니다.** 0001 의 GRANT 가
--   칸 단위라, 안 더하면 그대로 닫혀 있습니다 — 바꾸는 길은 위 문
--   하나뿐입니다 (`verified` · `listed` 와 같은 선).

insert into schema_version (n, name) values (21, '0021_inhouse')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0022_legacy_archive.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0022 · 앞 서비스(창업 · 폐업) 접수를 **보관 표시**로 내려놓습니다
--   2026-11-02 · 전환 지시서 §6 — "삭제 작업은 가능한 경우 복구 가능한
--   마이그레이션으로 관리한다"
--
-- 지우는 것이 **한 줄도 없습니다.** 칸도 · 줄도 · 기록도 그대로 두고,
-- `request` 에 표시 두 칸을 더해 **목록에서만 내려놓습니다.**
--
-- ⚠️⚠️ **왜 "보관 표로 옮기기" 가 아닌가 — 재서 바꿨습니다.**
--   처음 적어 둔 계획은 옛 접수를 보관 표로 **옮기는** 것이었습니다.
--   그런데 `request(id)` 를 가리키는 외래키가 **여섯**이고 다섯이
--   `on delete cascade` 입니다 —
--
--     assignment · deal · quote · request_item · request_photo  (cascade)
--     device                                                   (set null)
--
--   줄을 옮긴다는 것은 `request` 에서 지운다는 뜻이고, 그러면 그 건의
--   **배정 · 계약 · 수수료 · 입찰 · 사진이 같이 사라집니다.** §8 이
--   "모든 중요한 상태 변경을 기록한다" 고 적어 둔 그 기록이 통째로
--   없어지는 것이라, 복구 가능한 마이그레이션이 아니라 **제일 비싼
--   파괴**였습니다. 그래서 **옮기지 않고 표시합니다.**
--
-- ⚠️⚠️ **스냅샷 보관 표도 만들지 않았습니다.** 옛 줄을 통째로 베껴
--   두면 성함 · 연락처가 **두 번 보관**됩니다 — 이 저장소가 감사 기록과
--   `note_request_open` 에서 "기록은 못 지우는 것이라 그 자체가 또
--   하나의 보관입니다" 로 두 번 적어 둔 자리입니다. 원본 줄이 그대로
--   남아 있으니 베낄 까닭도 없습니다.
--
-- ⚠️⚠️ **`request.industry` 는 한 글자도 안 건드립니다.** 그 칸은
--   버려진 것이 아니라 **뜻이 바뀐** 칸입니다 — 2026-10-31 로 중고폰
--   **기기 종류**를 담고 `api/me.js` 의 역할 넷이 전부 가져갑니다
--   (`/my` 의 `myCond()` · `/admin` 의 거르개 · 업체 칸의 "취급 기기").
--   지우면 PostgREST 가 없는 칸을 달라고 해서 `/my` 와 `/admin` 접수
--   목록이 **통째로 안 그려집니다.**
--
-- 되돌리는 법 ───────────────────────────────────────────────────────
--   한 건      select restore_legacy_request('SW-XXXX-XXXX', '까닭');
--   전부       update request set archived_at = null, archived_why = null;
--   칸까지     alter table request drop column archived_at, drop column archived_why;
--
-- ⚠️ 두 번 돌려도 안전합니다 (add column if not exists · create or replace).
-- ⚠️⚠️ 돌린 파일을 **고치지 않았습니다** — 다음 번호로 새로 만듭니다.
-- ════════════════════════════════════════════════════════════════════

begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 보관 표시 두 칸
--
-- ⚠️⚠️ **사유 없는 보관은 기록이 아닙니다** (§8). 시각만 찍히고 왜
--   내려놓았는지가 없으면, 반 년 뒤에 그 건을 보는 사람이 "이게 왜
--   목록에 없지" 를 아무 데서도 못 읽습니다 — 0014 의
--   `request_notify_at_ok`(동의했다면 시각이 있어야 한다)와 같은 선입니다.
-- ════════════════════════════════════════════════════════════════════
alter table request add column if not exists archived_at  timestamptz;
alter table request add column if not exists archived_why text;

alter table request drop constraint if exists request_archived_why_ok;
alter table request add constraint request_archived_why_ok
  check (archived_at is null or btrim(coalesce(archived_why, '')) <> '');

-- ⚠️⚠️ **쓰기 권한을 주지 않습니다.** 0001 의 GRANT 가 칸 단위라, 안
--   더하면 그대로 닫혀 있습니다 — 바꾸는 길은 아래 문 둘뿐입니다
--   (`verified` · `listed` · `inhouse` 와 같은 선).


-- ════════════════════════════════════════════════════════════════════
-- ② 보관하는 문 — 관리자만 (`archive_legacy_side`)
--
-- 앞 서비스의 `side` 넷(start · ops · transfer · close)을 가진 접수를
-- 한 번에 내려놓습니다. 중고폰 쪽 값(buyin · bid · export · repair)은
-- **건드리지 않습니다.**
--
-- ⚠️⚠️ **돈이 안 끝난 건은 두고 갑니다.** 수수료를 확정해 두고 아직
--   입금이 안 된 건을 목록에서 내리면 **미수금이 화면에서 사라집니다** —
--   이 저장소가 "미수금은 확정된 건만 센다" 로 겪은 자리의 반대쪽이고,
--   §13 이 금지한 가짜 정산과 결이 같습니다. 그런 건은 세어서
--   돌려주고 사람이 먼저 정산하게 둡니다.
-- ⚠️ 돌려주는 값이 **둘**입니다 — 내려놓은 수와 **두고 온 수**. 두고 온
--   것을 안 세면 "다 됐다" 로 읽히고, 남은 건은 아무도 안 봅니다.
-- ⚠️⚠️ 기록과 표시가 **한 트랜잭션**입니다 — 기록이 실패하면 표시도
--   안 붙습니다 (§8 · 0003 · 0004 와 같은 규칙).
-- ════════════════════════════════════════════════════════════════════
create or replace function archive_legacy_side(p_why text)
  returns jsonb
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_why  text     := nullif(btrim(coalesce(p_why, '')), '');
  v_done int      := 0;
  v_kept int      := 0;
begin
  if v_me is null then
    raise exception '변경자를 알 수 없습니다 — 로그인한 세션에서만 됩니다';
  end if;
  if v_role <> 'admin' then
    raise exception '보관은 관리자만 할 수 있습니다';
  end if;
  if v_why is null then
    raise exception '보관 사유를 적어 주세요 — 사유 없는 보관은 기록이 아닙니다';
  end if;

  /* 돈이 안 끝난 건 — 세어만 두고 지나갑니다 */
  select count(*) into v_kept
    from request r
   where r.side in ('start', 'ops', 'transfer', 'close')
     and r.archived_at is null
     and exists (select 1 from deal d
                  where d.request_id = r.id
                    and d.fee_at is not null
                    and d.paid_at is null);

  with moved as (
    update request r
       set archived_at = now(), archived_why = v_why
     where r.side in ('start', 'ops', 'transfer', 'close')
       and r.archived_at is null
       and not exists (select 1 from deal d
                        where d.request_id = r.id
                          and d.fee_at is not null
                          and d.paid_at is null)
    returning r.id, r.state
  ), logged as (
    /* ⚠️ 기록에 성함 · 연락처를 안 적습니다 — 감사 기록은 못 지우는
       것이라 거기 번호를 박으면 그 자체가 또 하나의 보관입니다
       (`note_request_open` · `save_provider_contact` 와 같은 규칙). */
    insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why)
    select v_me, v_role, 'request', m.id::text, m.state::text, 'archived', v_why
      from moved m
    returning 1
  )
  select count(*)::int into v_done from logged;

  return jsonb_build_object('archived', v_done, 'kept', v_kept);
end $$;


-- ════════════════════════════════════════════════════════════════════
-- ③ 되돌리는 문 — 관리자만 (`restore_legacy_request`)
--
-- ⚠️⚠️ **한 건씩입니다.** 통째로 되돌리는 문을 만들면 잘못 누른 날
--   손볼 자리가 없습니다 — 전부 되돌리시려면 머리말의 `update` 한 줄을
--   쓰시면 되고, 그건 사람이 한 번 더 생각하고 치는 길입니다.
-- ⚠️ 신청번호(`no`)로 받습니다 — 관리자가 손에 들고 있는 값은 uuid 가
--   아니라 접수번호입니다 (`claim_request` 와 같은 선).
-- ════════════════════════════════════════════════════════════════════
create or replace function restore_legacy_request(p_no text, p_why text)
  returns request
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_why  text     := nullif(btrim(coalesce(p_why, '')), '');
  v_rq   request;
begin
  if v_me is null then
    raise exception '변경자를 알 수 없습니다 — 로그인한 세션에서만 됩니다';
  end if;
  if v_role <> 'admin' then
    raise exception '보관을 되돌리는 것은 관리자만 할 수 있습니다';
  end if;
  if v_why is null then
    raise exception '되돌리는 사유를 적어 주세요';
  end if;

  update request
     set archived_at = null, archived_why = null
   where no = btrim(coalesce(p_no, ''))
     and archived_at is not null
   returning * into v_rq;

  /* ⚠️ 없는 번호와 **이미 안 보관된 번호**를 가르지 않습니다 — 한 가지
     말로만 거절합니다 (0005 의 `claim_request` 와 같은 까닭: 갈라 주면
     번호가 있는지를 확인해 가며 긁을 수 있습니다). */
  if v_rq.id is null then
    raise exception '보관된 신청을 찾지 못했습니다 — 신청번호를 확인해 주세요';
  end if;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why)
  values (v_me, v_role, 'request', v_rq.id::text, 'archived', v_rq.state::text, v_why);

  return v_rq;
end $$;


revoke all on function archive_legacy_side(text) from public;
revoke all on function restore_legacy_request(text, text) from public;
grant execute on function archive_legacy_side(text) to authenticated;
grant execute on function restore_legacy_request(text, text) to authenticated;


insert into schema_version (n, name) values (22, '0022_legacy_archive')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0023_provider_axes.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0023 · 업체 분류 축 — **취급 브랜드 · 거래 규모** 두 칸
--   2026-11-02 · 더하기만 합니다 (지우는 것도 · 고치는 것도 없습니다)
--
-- ⚠️⚠️ **셋을 받아 둘만 칸으로 만들었습니다.**
--   "수리 가능 여부" 는 `provider.subs` 가 **이미** 답합니다 —
--   `catalog.js` 의 `fix`(수리 서비스) 분류에 든 하위를 하나라도 적었으면
--   수리하는 곳입니다. 거기에 boolean 을 더하면 **같은 규칙이 두 곳**이
--   되고, 이 저장소는 그렇게 어긋난 사고를 여러 번 겪었습니다
--   (`amCatTo`/`catTo` · 손으로 적어 둔 아이콘 표 둘 · `deal.js` ↔
--   `deal_move`). 화면은 `amProviderCanFix()` 로 **셉니다** — 평점과
--   포트폴리오 건수를 값으로 저장하지 않는 것과 같은 까닭입니다.
--
--     brands text[]   취급 브랜드   amShopMakers() 의 일곱 key
--     scale  text     거래 규모     small · mid · large  ⚠️ 한 칸
--
-- ⚠️⚠️ **`scale` 은 업체가 적은 값입니다** — 우리가 재 본 적이 없습니다
--   (`as` · `faq` 와 같은 결). 화면이 그 줄을 같이 냅니다. 재 본 값인
--   것처럼 쓰면 그게 지어낸 신뢰입니다 (절대 규칙 1).
-- ⚠️⚠️ **안 적은 것을 "안 한다" 로 읽지 않습니다.** 빈 `brands` 는
--   "전 브랜드" 이고 빈 `scale` 은 "모름" 입니다 — 지역 · 취급 기기를
--   그렇게 읽는 것과 같은 규칙입니다 (`subs` 만 예외: 하는 일을 안 적은
--   것을 "전부 다 합니다" 로 읽으면 안 됩니다).
--
-- ⚠️ 쓰기 권한을 **표에 주지 않습니다** — 0014 가 `revoke update on
--   provider from authenticated` 로 닫아 두었고, 바꾸는 길은 아래 문
--   둘뿐입니다 (`save_provider` · `save_provider_self`). 그래야 감사
--   기록 없이 지나갈 길이 안 생깁니다 (§8).
-- ⚠️⚠️ 승인 칸이 아닙니다 — `verified` · `listed` · `assignable` ·
--   `inhouse` 와 달리 **업체가 스스로 적는** 값이라 `provider_guard()`
--   를 안 건드립니다 (거기 넣으면 업체가 못 고칩니다).
--
-- 되돌리는 법 ───────────────────────────────────────────────────────
--   alter table provider drop column brands, drop column scale;
--   (문 둘은 0007(save_provider) · 0014(save_provider_self) 의 정의를
--    다시 돌리면 그대로 돌아옵니다 — ⚠️ 0013 이 아닙니다. 그 번호는
--    담당자 표(save_provider_contact)입니다)
--
-- ⚠️ 두 번 돌려도 안전합니다 (add column if not exists · create or replace).
-- ════════════════════════════════════════════════════════════════════

begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 칸 둘
-- ════════════════════════════════════════════════════════════════════
alter table provider add column if not exists brands text[] not null default '{}';
alter table provider add column if not exists scale  text;

-- ⚠️⚠️ **값을 못박아 둡니다.** 화면의 `AM_PROVIDER_SCALE` 과 어긋나면
--   화면이 "중형" 으로 보내는데 DB 가 거절하거나, 더 나쁘게 **화면이
--   모르는 값이 DB 에 들어가** 그 업체만 규모 줄이 빕니다.
--   `build-pages.js` 의 `checkProviderAxes()` 가 **양쪽을 맞춰 봅니다** —
--   한쪽만 고치면 빌드가 멈춥니다 (`deal.js` ↔ `deal_move` 와 같은 선).
-- ⚠️ enum 을 안 쓴 까닭 — 값을 늘릴 때 `alter type` 이 필요하고 그건
--   0006 · 0015 에서 트랜잭션 때문에 걸린 자리입니다. check 제약은
--   그냥 다시 적으면 됩니다.
alter table provider drop constraint if exists provider_scale_ok;
alter table provider add constraint provider_scale_ok
  check (scale is null or scale in ('small', 'mid', 'large'));


-- ════════════════════════════════════════════════════════════════════
-- ② 직원 · 관리자가 적는 문 (0007 의 `save_provider` 를 다시 씁니다)
--
-- ⚠️⚠️ **인자를 안 늘렸습니다** — 둘 다 `p_data` 안으로 들어갑니다.
--   `approve_provider` 에 인자를 **가운데** 끼웠다가 자리로 부르던
--   쪽이 네 번째를 boolean 으로 읽어 터진 적이 있습니다 (0012).
--   `p_data` 로 받으면 `OK_ARG`(api/deal.js)도 안 바뀝니다.
-- ⚠️ 나머지 본문은 0007 그대로입니다 — 거절하는 글자까지 같습니다
--   (화면이 그 글을 그대로 보여 줍니다).
-- ════════════════════════════════════════════════════════════════════
create or replace function save_provider(
  p_id    text,
  p_name  text,
  p_data  jsonb default '{}'::jsonb,   -- intro · regions · gu · industries · subs · since · consultHours · brands · scale
  p_why   text default null
) returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_role app_role := my_role();
  v_new  boolean;
  v_scale text := nullif(btrim(coalesce(p_data->>'scale','')), '');
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
  -- 취급 기기는 안 적으면 "전국 · 전기종" 으로 읽는 게 말이 되지만, 하는
  -- 일을 안 적은 것을 "전부 다 합니다" 로 읽으면 수거만 하는 곳이
  -- 수리 화면에 앉습니다.
  if coalesce(jsonb_array_length(coalesce(p_data->'subs','[]'::jsonb)), 0) = 0 then
    raise exception '하는 일(하위 분야)이 비어 있습니다 — 비면 아무 분류에도 안 걸립니다';
  end if;
  -- ⚠️ 모르는 규모를 **조용히 비우지 않습니다** — 화면이 오타를 보내면
  --   그 업체만 규모 줄이 빈 채로 몇 주 갑니다.
  if v_scale is not null and v_scale not in ('small','mid','large') then
    raise exception '거래 규모는 small · mid · large 중 하나입니다 — %', v_scale;
  end if;

  v_new := not exists (select 1 from provider where id = p_id);

  insert into provider (id, name, intro, regions, gu, industries, subs,
                        since, consult_hours, brands, scale)
  values (
    p_id,
    btrim(p_name),
    nullif(btrim(coalesce(p_data->>'intro','')), ''),
    coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'regions','[]'::jsonb)) x), '{}'),
    coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'gu','[]'::jsonb)) x), '{}'),
    coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'industries','[]'::jsonb)) x), '{}'),
    coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'subs','[]'::jsonb)) x), '{}'),
    nullif(p_data->>'since','')::int,
    nullif(btrim(coalesce(p_data->>'consultHours','')), ''),
    coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'brands','[]'::jsonb)) x), '{}'),
    v_scale
  )
  on conflict (id) do update set
    name = excluded.name, intro = excluded.intro,
    regions = excluded.regions, gu = excluded.gu,
    industries = excluded.industries, subs = excluded.subs,
    since = excluded.since, consult_hours = excluded.consult_hours,
    brands = excluded.brands, scale = excluded.scale;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'provider', p_id,
          case when v_new then 'created' else 'updated' end, p_why, p_data);

  return p_id;
end $$;

revoke all on function save_provider(text, text, jsonb, text) from public;
grant execute on function save_provider(text, text, jsonb, text) to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ③ 업체가 **자기 줄만** 고치는 문 (0014 의 `save_provider_self`)
--
-- ⚠️⚠️ 업체가 못 건드리는 것은 그대로입니다 — 상호 · 하는 일(`subs`) ·
--   확인 배지 · 공개 · 배정 가능 · 자체 매입 · 주소(id). 하는 일을 스스로
--   넓히면 수거만 하는 곳이 수리 화면에 앉습니다.
-- ⚠️ **취급 브랜드와 거래 규모는 업체가 적습니다** — 사람이 바뀌거나
--   물량이 달라지면 그 자리에서 고칠 수 있어야 하고, 둘 다 우리가
--   확인해 주는 값이 아니라 **업체가 말하는 값**입니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function save_provider_self(
  p_data jsonb default '{}'::jsonb,   -- intro · regions · gu · industries · since · consultHours · brands · scale
  p_why  text  default null
) returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_pv   text     := my_provider();
  v_scale text    := nullif(btrim(coalesce(p_data->>'scale','')), '');
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  -- ⚠️⚠️ 역할을 요청에서 읽지 않습니다 — 토큰으로 `account` 를 보고
  --   거기 적힌 `provider_id` 만 고칩니다. 남의 업체는 애초에 못 집습니다.
  if v_role <> 'provider' or v_pv is null then
    raise exception '업체 계정으로 로그인하셔야 합니다';
  end if;
  if not exists (select 1 from provider where id = v_pv) then
    raise exception '연결된 업체를 찾을 수 없습니다';
  end if;
  if v_scale is not null and v_scale not in ('small','mid','large') then
    raise exception '거래 규모는 small · mid · large 중 하나입니다 — %', v_scale;
  end if;

  update provider set
    intro = nullif(btrim(coalesce(p_data->>'intro','')), ''),
    regions = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'regions','[]'::jsonb)) x), '{}'),
    gu = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'gu','[]'::jsonb)) x), '{}'),
    industries = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'industries','[]'::jsonb)) x), '{}'),
    since = nullif(p_data->>'since','')::int,
    consult_hours = nullif(btrim(coalesce(p_data->>'consultHours','')), ''),
    brands = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'brands','[]'::jsonb)) x), '{}'),
    scale = v_scale
  where id = v_pv;

  -- ⚠️ 같은 트랜잭션입니다 — 기록이 실패하면 수정도 안 됩니다 (§8).
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'provider', v_pv, 'self-updated', p_why, p_data);

  return v_pv;
end $$;

revoke all on function save_provider_self(jsonb, text) from public;
grant execute on function save_provider_self(jsonb, text) to authenticated;


insert into schema_version (n, name) values (23, '0023_provider_axes')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0024_golf_reset.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0024 — 중고폰 찌꺼기를 걷어냅니다 (골프올인원 전환)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️ **운영 DB 에는 돌릴 것이 거의 없습니다.** 운영에는 0001~0007 만
--   돌아가 있고, 여기서 지우는 것들(0012 의 수익상품 씨앗 · 0020 의 기기
--   재고 · 0021 의 자체 매입 표시)은 **운영에서 한 번도 안 돈 파일**이
--   만든 것입니다. 그래서 전부 if exists 로 적었습니다 — 없으면 조용히
--   지나갑니다.
--
-- ⚠️⚠️ **번호를 다시 쓰지 않습니다.** 0012 · 0020 · 0021 파일은 그대로
--   둡니다 (돌린 기록입니다). 지우는 일은 여기 새 번호로 적습니다.
--
-- ⚠️⚠️ **provider_guard() 를 여기서 다시 씁니다.** 0021 판이 new.inhouse
--   를 보는데 그 칸을 지우기 때문입니다. 그래서 **0021 을 다시 붙여
--   넣으면 이 파일이 한 일이 통째로 되돌아갑니다** (칸도 함수도 돌아
--   옵니다). create or replace 는 에러를 안 냅니다 — 조용히 내려갑니다.
--   되돌아갔는지는 이렇게 봅니다:
--     select prosrc like '%inhouse%' from pg_proc where proname='provider_guard';
--   true 면 0021 판입니다. 이 파일을 다시 올리세요.
--
-- 지우는 것
--   ① 0012 가 심은 중고폰 수익상품 열일곱 줄 (offer)
--   ② 0020 의 기기 재고 — device · device_check · device_cost · device_move
--      와 그 문 넷, 종류 둘
--   ③ 0021 의 provider.inhouse 와 set_provider_inhouse()
-- 남기는 것 (업종과 무관합니다 — 지우면 안 됩니다)
--   · account_role_guard()  역할 올리기를 막는 자물쇠 (0021)
--   · provider_guard()      확인 배지 · 공개 여부 · 주소를 지키는 자물쇠
-- ════════════════════════════════════════════════════════════════════
begin;

-- ① 중고폰 수익상품 ------------------------------------------------
-- ⚠️ id 를 적어서 지웁니다. cats 로 지우면 나중에 같은 이름의 골프
--    분류가 생겼을 때 엉뚱한 줄이 같이 사라집니다.
delete from offer where id in (
  'ph-buyin','tab-buyin','self-buyin','bid-match','broken-buyin','part-lot',
  'fix-match','fix-data','shop-sale','lot-whole','auction-fee','corp-buyin',
  'wipe-cert','export-buyer','inspect-fee','pickup-post','access-sale'
);

-- ② 기기 재고 ------------------------------------------------------
-- ⚠️ 인자를 적지 않습니다. 손으로 적으면 **한 글자만 달라도 조용히
--    안 지워집니다** (여기서 int 와 bigint 를 틀려 겪었습니다).
--    이름이 하나뿐이라 Postgres 10 이상에서는 이름만으로 됩니다.
drop function if exists make_device;
drop function if exists add_device_cost;
drop function if exists add_device_check;
drop function if exists move_device;
-- ⚠️ 보기(view)를 먼저 지웁니다 — 표를 보고 있어서 cascade 없이는
--    안 지워집니다. cascade 를 쓰면 딸려 나가는 것이 더 있어도 조용히
--    같이 사라져서, 무엇이 지워졌는지 알 수 없습니다.
drop view if exists v_device_pl;
drop table if exists device_cost;
drop table if exists device_check;
drop table if exists device_move;
drop table if exists device;
drop type if exists device_cost_kind;
drop type if exists device_state;

-- ③ 자체 매입 표시 --------------------------------------------------
drop function if exists set_provider_inhouse;

-- ⚠️ 칸을 지우기 전에 그 칸을 보는 자물쇠를 먼저 다시 씁니다.
--    순서를 바꾸면 트리거가 없는 칸을 보고 업체 수정이 통째로 막힙니다.
create or replace function provider_guard() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if my_role() = 'admin' then return new; end if;
  if new.verified is distinct from old.verified then
    raise exception '확인 배지는 플랫폼이 서류를 확인한 뒤에만 켜집니다';
  end if;
  if new.listed is distinct from old.listed then
    raise exception '공개 여부는 관리자가 정합니다';
  end if;
  if new.id is distinct from old.id then
    raise exception '업체 주소(id)는 바꿀 수 없습니다 — 이미 색인된 주소입니다';
  end if;
  return new;
end $$;

drop index if exists provider_inhouse_idx;
alter table provider drop column if exists inhouse;

insert into schema_version (n, name) values (24, '0024_golf_reset')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0025_account_hat.sql ---------------------------- */
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

/* ---------------------------- 0026_ad_membership.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0026 — 업체 광고(C) · 유료 멤버십(D)  (지시서 5번)
-- ════════════════════════════════════════════════════════════════════
-- 지시서 5번의 네 모델 중 A(고객 연결 수수료)와 B(거래 · 예약 수수료)는
-- 이미 있습니다 — assignment · fee_policy · deal · settlement.
-- 여기서는 남은 둘을 올립니다.
--
-- ⚠️⚠️ **요금을 한 줄도 심지 않습니다.** 지시서 5번이 "수수료와 요금은
--   관리자에서 변경 가능하도록 설계한다" 고 했습니다. 여기에 값을 심으면
--   관리자에서 바꿔도 이 줄만 옛날 값으로 남습니다. 그래서 멤버십 요금제는
--   **빈 표**로 시작합니다 — 관리자가 넣기 전에는 화면이 "요금제가 없습니다"
--   라고 말합니다 (절대 규칙 1 · 2).
--
-- ⚠️⚠️ **광고는 화면에서 "광고" 라고 표시해야 합니다** (표시 · 광고의
--   공정화에 관한 법률). 표시는 화면이 하는 일이지만, 표시를 빠뜨리기
--   쉬워서 보기(v_ad_live)가 label 칸을 **반드시 들고 나오게** 했습니다.
--   화면은 그 칸을 그대로 찍으면 됩니다.
--
-- ⚠️ 기간은 **시작일과 종료일을 둘 다 포함**합니다 (하루짜리 광고는
--   starts_on = ends_on). 사는 쪽이 "3일치" 라고 말하는 셈법과 같습니다.
-- ════════════════════════════════════════════════════════════════════
begin;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'ad_place') then
    create type ad_place as enum (
      'main_hero',   -- 메인 맨 위 띠
      'main_band',   -- 메인 가운데 띠
      'cat_top',     -- 분류 화면 맨 위 (cat_key 가 어느 분류인지 말합니다)
      'region'       -- 지역 거르개 결과 맨 위 (region 이 어디인지 말합니다)
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'ad_state') then
    create type ad_state as enum ('draft', 'live', 'done', 'stopped');
  end if;
end $$;

-- ── 광고 집행 ────────────────────────────────────────────────────
create table if not exists ad_run (
  id          uuid primary key default gen_random_uuid(),
  provider_id text        not null references provider(id) on delete cascade,
  place       ad_place    not null,
  cat_key     text,                          -- place='cat_top' 일 때
  region      text,                          -- place='region' 일 때
  starts_on   date        not null,
  ends_on     date        not null,
  price       bigint      not null,          -- 원 — 관리자가 넣습니다
  state       ad_state    not null default 'draft',
  note        text,
  by_user     uuid references auth.users(id) on delete set null,
  at          timestamptz not null default now(),
  constraint ad_run_period check (ends_on >= starts_on),
  -- ⚠️ 0 원도 됩니다 (무상 노출). 음수만 막습니다.
  constraint ad_run_price  check (price >= 0),
  -- ⚠️⚠️ 자리마다 **무엇을 더 적어야 하는지**가 다릅니다. 안 막으면
  --   cat_key 없는 분류 광고가 들어와 아무 분류에도 안 걸립니다
  --   (에러 없이 조용히 안 보입니다).
  constraint ad_run_where check (
    (place = 'cat_top' and cat_key is not null and btrim(cat_key) <> '')
    or (place = 'region' and region is not null and btrim(region) <> '')
    or place in ('main_hero','main_band')
  )
);
create index if not exists ad_run_live_idx on ad_run (state, starts_on, ends_on);
create index if not exists ad_run_prov_idx on ad_run (provider_id);

-- ── 유료 멤버십 ──────────────────────────────────────────────────
-- ⚠️⚠️ **빈 표로 시작합니다.** 요금제를 지어내지 않습니다.
create table if not exists membership_plan (
  id       text primary key,                 -- 'basic' · 'pro' … 관리자가 정합니다
  name     text    not null,
  monthly  bigint  not null,                 -- 원/월 — 0 이면 무료
  perks    jsonb   not null default '{}'::jsonb,
  listed   boolean not null default true,
  ord      int     not null default 0,
  constraint membership_plan_price check (monthly >= 0),
  constraint membership_plan_name  check (btrim(name) <> '')
);

create table if not exists provider_membership (
  provider_id text primary key references provider(id) on delete cascade,
  plan_id     text not null references membership_plan(id),
  starts_on   date not null,
  ends_on     date,                          -- null 이면 해지 전까지
  by_user     uuid references auth.users(id) on delete set null,
  at          timestamptz not null default now(),
  constraint provider_membership_period check (ends_on is null or ends_on >= starts_on)
);

-- ── RLS ──────────────────────────────────────────────────────────
alter table ad_run              enable row level security;
alter table membership_plan     enable row level security;
alter table provider_membership enable row level security;

drop policy if exists ad_public on ad_run;
drop policy if exists ad_mine   on ad_run;
drop policy if exists ad_admin  on ad_run;
-- 지금 돌고 있는 광고는 누구나 봅니다 (화면에 나가야 하니까).
create policy ad_public on ad_run for select
  using (state = 'live' and current_date between starts_on and ends_on);
create policy ad_mine on ad_run for select using (provider_id = my_provider());
create policy ad_admin on ad_run for all
  using (my_role() in ('staff','admin')) with check (my_role() = 'admin');

drop policy if exists plan_public on membership_plan;
drop policy if exists plan_admin  on membership_plan;
create policy plan_public on membership_plan for select using (listed);
create policy plan_admin  on membership_plan for all
  using (my_role() in ('staff','admin')) with check (my_role() = 'admin');

drop policy if exists pm_mine  on provider_membership;
drop policy if exists pm_admin on provider_membership;
create policy pm_mine  on provider_membership for select using (provider_id = my_provider());
create policy pm_admin on provider_membership for all
  using (my_role() in ('staff','admin')) with check (my_role() = 'admin');

-- ⚠️⚠️ **쓰기 권한을 한 줄도 주지 않습니다.** 바꾸는 길은 아래 문뿐입니다.
revoke all on ad_run, membership_plan, provider_membership
  from public, anon, authenticated;
grant select on ad_run, membership_plan, provider_membership to authenticated;
grant select on ad_run, membership_plan to anon;

-- ── 지금 나가는 광고 ──────────────────────────────────────────────
-- ⚠️⚠️ label 을 **보기가 들고 나옵니다.** 화면이 이 칸을 그대로 찍으면
--   "광고" 표시를 빠뜨릴 수 없습니다. 지우지 마세요.
create or replace view v_ad_live as
  select a.id, a.provider_id, p.name as provider_name,
         a.place, a.cat_key, a.region, a.starts_on, a.ends_on,
         '광고'::text as label
    from ad_run a join provider p on p.id = a.provider_id
   where a.state = 'live'
     and current_date between a.starts_on and a.ends_on;
grant select on v_ad_live to anon, authenticated;

-- ── 문 ───────────────────────────────────────────────────────────
create or replace function set_ad_state(p_ad uuid, p_to ad_state, p_why text)
  returns ad_state language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_from ad_state;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if my_role() not in ('staff','admin') then
    raise exception '광고 집행은 운영자만 바꿉니다';
  end if;
  if p_why is null or btrim(p_why) = '' then
    raise exception '까닭을 적어야 합니다 — 감사 기록에 남습니다';
  end if;
  select state into v_from from ad_run where id = p_ad;
  if v_from is null then raise exception '그런 광고가 없습니다'; end if;

  update ad_run set state = p_to where id = p_ad;
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why)
  values (v_me, my_role(), 'ad_run', p_ad::text, v_from::text, p_to::text, p_why);
  return p_to;
end $$;

create or replace function save_plan(
  p_id text, p_name text, p_monthly bigint,
  p_perks jsonb default '{}'::jsonb, p_listed boolean default true,
  p_ord int default 0, p_why text default null)
  returns text language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_had boolean;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if my_role() <> 'admin' then
    raise exception '요금제는 관리자만 바꿉니다';
  end if;
  if p_monthly < 0 then raise exception '요금은 0 보다 작을 수 없습니다'; end if;

  select true into v_had from membership_plan where id = p_id;
  insert into membership_plan (id, name, monthly, perks, listed, ord)
  values (p_id, p_name, p_monthly, p_perks, p_listed, p_ord)
  on conflict (id) do update set
    name = excluded.name, monthly = excluded.monthly, perks = excluded.perks,
    listed = excluded.listed, ord = excluded.ord;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, my_role(), 'membership_plan', p_id,
          case when v_had then '있음' else null end, '저장',
          coalesce(p_why, '요금제 저장'),
          jsonb_build_object('monthly', p_monthly, 'listed', p_listed));
  return p_id;
end $$;

revoke all on function set_ad_state(uuid, ad_state, text) from public;
revoke all on function save_plan(text, text, bigint, jsonb, boolean, int, text) from public;
grant execute on function set_ad_state(uuid, ad_state, text) to authenticated;
grant execute on function save_plan(text, text, bigint, jsonb, boolean, int, text) to authenticated;

insert into schema_version (n, name) values (26, '0026_ad_membership')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0027_apply_door.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0027 — 입점 신청을 **넣는 문** (지시서 5번 A · 11번 5단계)
-- ════════════════════════════════════════════════════════════════════
-- 0016 이 provider_apply 표와 **상태를 바꾸는 문**은 만들어 두었는데
-- **넣는 문이 없습니다.** 앞 서비스는 서버가 service key 로 넣었습니다 —
-- 그 키는 RLS 를 통째로 지나가므로 쓰지 않습니다. 대신 검사를 다 거치는
-- 문 하나를 열고, 그 문으로만 들어오게 합니다.
--
-- ⚠️⚠️ **인자를 jsonb 하나로 받습니다.** 칸이 늘 때마다 인자를 더하면
--   부르는 쪽과 받는 쪽의 **자리**가 어긋나고, 그 어긋남은 "인자 개수가
--   다릅니다" 가 아니라 **엉뚱한 값이 엉뚱한 칸에 들어가는** 꼴로
--   납니다. 앞 서비스에서 그렇게 겪었습니다.
--
-- ⚠️⚠️ **로그인 없이 부를 수 있습니다** (anon). 입점하려는 사장님에게
--   먼저 회원가입을 시키면 그 자리에서 절반이 떠납니다. 대신 ——
--     · 넣기만 됩니다. 읽기는 운영자만입니다 (0016 의 RLS).
--     · 같은 번호로 10분 안에 또 넣으면 막습니다 (지시서 5번 A
--       "중복 · 허위 신청 방지").
--     · 빈 칸 · 말이 안 되는 번호 · 미래의 동의 시각을 막습니다.
--   ⚠️ 그래도 **스팸을 완전히 막지는 못합니다.** 초당 횟수 제한은 DB 가
--   아니라 앞단(Vercel · Cloudflare)에서 걸어야 합니다. 열어 둔 문이라는
--   것을 잊지 마세요.
--
-- ⚠️⚠️ **서비스 키(하위 분류)를 DB 가 검사하지 않습니다.** 그 목록은
--   js/data/catalog.js 에 있고, 두 곳에 적으면 한쪽만 고쳐서 조용히
--   어긋납니다. 대신 **빌드 가드**(tools/check-form.js)가 화면이 내는
--   값이 실제 하위 키인지 봅니다.
--
-- ⚠️ 신청번호는 **서울 날짜 + 일련번호**입니다. Supabase 는 UTC 라
--   그냥 now() 를 쓰면 밤 9시 이후 신청이 **다음 날 번호**를 답니다.
-- ════════════════════════════════════════════════════════════════════
begin;

create sequence if not exists apply_no_seq;

create or replace function make_apply(p jsonb)
  returns text language plpgsql security definer set search_path = public as $$
declare
  v_company  text := btrim(coalesce(p->>'company', ''));
  v_name     text := btrim(coalesce(p->>'name', ''));
  v_tel      text := btrim(coalesce(p->>'tel', ''));
  v_email    text := nullif(btrim(coalesce(p->>'email', '')), '');
  v_brn      text := nullif(btrim(coalesce(p->>'brn', '')), '');
  v_region   text := nullif(btrim(coalesce(p->>'region', '')), '');
  v_note     text := nullif(btrim(coalesce(p->>'note', '')), '');
  v_svc      text[] := coalesce(
                 (select array_agg(btrim(x)) from jsonb_array_elements_text(
                    case when jsonb_typeof(p->'services') = 'array'
                         then p->'services' else '[]'::jsonb end) as t(x)
                  where btrim(x) <> ''), '{}'::text[]);
  v_digits   text;
  v_no       text;
begin
  -- ⚠️ 자물쇠마다 **다른 말**로 거절합니다. 같은 말이면 하나를 빼 봐도
  --    다른 것이 먼저 막아 엉뚱한 까닭으로 통과합니다.
  if v_company = '' then raise exception '상호를 적어 주세요'; end if;
  if v_name    = '' then raise exception '담당자 성함을 적어 주세요'; end if;
  if v_tel     = '' then raise exception '연락처를 적어 주세요'; end if;

  if length(v_company) > 80  then raise exception '상호가 너무 깁니다'; end if;
  if length(v_name)    > 40  then raise exception '성함이 너무 깁니다'; end if;
  if v_note is not null and length(v_note) > 2000 then
    raise exception '남기신 말씀이 너무 깁니다';
  end if;

  v_digits := regexp_replace(v_tel, '[^0-9]', '', 'g');
  -- ⚠️ 경계값: 9자리(02-xxx-xxxx)부터 11자리(010-xxxx-xxxx)까지입니다.
  if length(v_digits) < 9 or length(v_digits) > 11 then
    raise exception '연락처를 다시 봐 주세요 — 숫자 아홉에서 열한 자리입니다';
  end if;

  if array_length(v_svc, 1) is null then
    raise exception '하시는 일을 하나 이상 골라 주세요';
  end if;
  if array_length(v_svc, 1) > 20 then
    raise exception '고르신 항목이 너무 많습니다';
  end if;

  -- ⚠️⚠️ 동의 시각은 **화면이 보낸 값**입니다. 미래이거나 너무 오래된
  --    것은 믿지 않습니다 (개인정보보호법 제15조 — 그 자리에서 받은
  --    동의여야 합니다).
  if (p->>'agree_at') is null then
    raise exception '수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes' then
    raise exception '동의 시각이 미래입니다';
  end if;
  if (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의가 오래되었습니다 — 다시 한 번 눌러 주세요';
  end if;

  -- 중복 · 허위 신청 막기 (지시서 5번 A)
  if exists (
    select 1 from provider_apply
     where regexp_replace(tel, '[^0-9]', '', 'g') = v_digits
       and state = 'new'
       and created_at > now() - interval '10 minutes')
  then
    raise exception '방금 같은 번호로 신청이 들어왔습니다 — 잠시 뒤에 다시 해 주세요';
  end if;

  v_no := 'GA' || to_char(now() at time zone 'Asia/Seoul', 'YYMMDD')
               || '-' || lpad(nextval('apply_no_seq')::text, 4, '0');

  insert into provider_apply
    (no, company, brn, name, tel, email, region, services, note, agree_at)
  values
    (v_no, v_company, v_brn, v_name, v_tel, v_email, v_region, v_svc, v_note,
     (p->>'agree_at')::timestamptz);

  -- ⚠️ 감사 기록에 **성함 · 연락처를 넣지 않습니다.** audit_log 는 오래
  --    남고 보는 사람도 넓습니다. 신청번호로 찾아가면 됩니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (auth.uid(), my_role(), 'provider_apply', v_no, 'new', '입점 신청 접수',
          jsonb_build_object('services', v_svc, 'region', v_region));

  return v_no;
end $$;

revoke all on function make_apply(jsonb) from public;
grant execute on function make_apply(jsonb) to anon, authenticated;

insert into schema_version (n, name) values (27, '0027_apply_door')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0028_biz_hat_sync.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0028 — 업체 계정에 **사업자 회원 모자**가 저절로 따라옵니다
-- ════════════════════════════════════════════════════════════════════
-- 0025 가 member_hat('biz') 를 만들면서 "입점 신청이 승인되면 붙습니다"
-- 라고 적었습니다. 그런데 승인은 두 걸음입니다 —
--   ① set_apply_state(..., 'done', '업체주소')   신청을 업체에 잇고
--   ② update account set role='provider', provider_id='업체주소'
--      (0018 머리말 · db/README.md — **화면이 아니라 SQL 로만** 합니다)
-- 여기에 "그리고 biz 모자를 붙인다" 를 **세 번째 걸음**으로 두면,
-- 빠뜨리는 날 업체 사장님이 로그인은 되는데 업체 화면만 안 열립니다.
-- 에러도 안 납니다 — 조용히 어긋납니다.
--
-- ⚠️⚠️ 그래서 **모자를 손으로 붙이지 않습니다.** account 의 role 과
--   provider_id 가 **하나의 참**이고, 모자는 거기서 따라옵니다.
--   규칙은 한 곳(이 트리거)에 두고 모두가 그것을 부릅니다.
--
-- ⚠️ 거꾸로도 돕니다 — 업체 계정을 풀면 모자가 떨어집니다.
--   안 그러면 그만둔 업체가 업체 화면을 계속 봅니다.
--
-- ⚠️ 모자를 **직접** 붙이고 떼는 문(grant_hat)은 그대로 둡니다.
--   예외를 손으로 처리해야 하는 날이 옵니다.
-- ════════════════════════════════════════════════════════════════════
begin;

create or replace function account_biz_hat() returns trigger
  language plpgsql security definer set search_path = public as $$
declare v_is boolean;
begin
  v_is := (new.role = 'provider' and new.provider_id is not null);

  if v_is then
    insert into account_hat (account_id, hat, by_user)
    values (new.id, 'biz', auth.uid())
    on conflict (account_id, hat) do nothing;
    if not found then
      -- 이미 있던 경우에는 기록을 남기지 않습니다 (같은 줄이 쌓입니다)
      return new;
    end if;
    insert into audit_log (by_user, by_role, obj, obj_id, to_state, why)
    values (auth.uid(), my_role(), 'account_hat', new.id::text, 'biz',
            '업체 계정이 이어져 자동으로 붙음 (' || new.provider_id || ')');
  else
    delete from account_hat where account_id = new.id and hat = 'biz';
    if found then
      insert into audit_log (by_user, by_role, obj, obj_id, from_state, why)
      values (auth.uid(), my_role(), 'account_hat', new.id::text, 'biz',
              '업체 계정이 풀려 자동으로 떨어짐');
    end if;
  end if;
  return new;
end $$;

drop trigger if exists account_biz_hat_sync on account;
create trigger account_biz_hat_sync
  after insert or update of role, provider_id on account
  for each row execute function account_biz_hat();

-- ⚠️ 이미 이어져 있는 계정에도 지금 한 번 붙입니다 (따라잡기).
--    트리거는 **앞으로** 바뀌는 줄만 봅니다.
insert into account_hat (account_id, hat)
  select id, 'biz' from account
   where role = 'provider' and provider_id is not null
on conflict (account_id, hat) do nothing;

insert into schema_version (n, name) values (28, '0028_biz_hat_sync')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0029_match_door.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0029 — 통합 매칭 요청을 **넣는 문** (2차 지시서 §5)
-- ════════════════════════════════════════════════════════════════════
-- 0001 이 `request` 표를, 0009 가 `request_item`(한 신청에 서비스 여럿)을
-- 만들어 두었는데 **넣는 문이 없습니다.** 앞 서비스는 서버가 service key
-- 로 넣었습니다 — 그 키는 RLS 를 통째로 지나갑니다. 검사를 다 거치는
-- 문 하나를 열고 그 문으로만 들어오게 합니다 (0027 과 같은 규칙).
--
-- ⚠️⚠️ **제3자 제공 동의를 여기서 받지 않습니다.**
--   2차 지시서 §5 의 5번은 "개인정보 처리 및 업체 제공 동의" 를 요청하는
--   자리에서 같이 받으라고 적었습니다. 그런데 그 시점에는 **어느 업체에
--   줄지 정해지지 않았습니다.** 개인정보보호법 제17조 제2항은 제공받는
--   자를 알리고 동의를 받으라고 하므로, 누구에게 줄지 모르는 상태의
--   뭉뚱그린 동의는 위반입니다.
--   그래서 여기서는 **수집 · 이용 동의(agree_at)만** 받고,
--   **제3자 제공 동의(agree3rd_at)는 배정하는 순간** 상호를 알리고
--   따로 받습니다. 그 문은 배정 화면을 세우는 날 만듭니다.
--   ⚠️ 그때까지 `agree3rd_at` 이 비어 있는 신청은 **업체에 넘기면 안
--   됩니다.** 배정 문이 그것을 막아야 합니다.
--
-- ⚠️⚠️ **신청번호는 0005 의 꼴(SW-XXXX-XXXX)을 그대로 씁니다.**
--   비회원이 번호와 연락처로 자기 신청을 찾는 문(`claim_request`)이
--   그 꼴만 받습니다. 머리글자를 바꾸면 그 함수도 같이 고쳐야 하고,
--   그러면 **0005 를 다시 붙여 넣는 날 조용히 되돌아갑니다**
--   (작업 기억의 "뒤 번호가 앞 번호를 덮는" 자리). 안 건드립니다.
--   ⚠️ SW 는 도메인(storeway)에서 온 머리입니다 — 브랜드 이름이 아닙니다.
--
-- ⚠️ 글자는 읽기 쉬운 것만 씁니다 (I · L · O · U 를 뺍니다) — 0005 의
--   정규식과 **같은 묶음**이어야 합니다.
-- ════════════════════════════════════════════════════════════════════
begin;

create or replace function make_request(p jsonb)
  returns text language plpgsql security definer set search_path = public as $$
declare
  v_name  text := btrim(coalesce(p->>'name', ''));
  v_tel   text := btrim(coalesce(p->>'tel', ''));
  v_email text := nullif(btrim(coalesce(p->>'email', '')), '');
  v_region text := nullif(btrim(coalesce(p->>'region', '')), '');
  v_gu    text := nullif(btrim(coalesce(p->>'gu', '')), '');
  v_want  text := nullif(btrim(coalesce(p->>'want_at', '')), '');
  v_body  text := nullif(btrim(coalesce(p->>'body', '')), '');
  v_idem  text := nullif(btrim(coalesce(p->>'idem', '')), '');
  v_bmin  bigint := nullif(p->>'budget_min', '')::bigint;
  v_bmax  bigint := nullif(p->>'budget_max', '')::bigint;
  v_svc   text[] := coalesce(
             (select array_agg(distinct btrim(x)) from jsonb_array_elements_text(
                case when jsonb_typeof(p->'services') = 'array'
                     then p->'services' else '[]'::jsonb end) as t(x)
              where btrim(x) <> ''), '{}'::text[]);
  v_digits text;
  v_no     text;
  v_id     uuid;
  v_try    int := 0;
  v_abc    text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  v_raw    text;
  k        text;
begin
  -- ⚠️ 자물쇠마다 **다른 말**로 거절합니다.
  if v_name = '' then raise exception '성함을 적어 주세요'; end if;
  if v_tel  = '' then raise exception '연락처를 적어 주세요'; end if;
  if length(v_name) > 40 then raise exception '성함이 너무 깁니다'; end if;
  if v_body is not null and length(v_body) > 2000 then
    raise exception '남기신 말씀이 너무 깁니다';
  end if;

  v_digits := regexp_replace(v_tel, '[^0-9]', '', 'g');
  -- ⚠️ 경계값: 9자리(02-xxx-xxxx)부터 11자리(010-xxxx-xxxx)까지입니다.
  if length(v_digits) < 9 or length(v_digits) > 11 then
    raise exception '연락처를 다시 봐 주세요 — 숫자 아홉에서 열한 자리입니다';
  end if;

  if array_length(v_svc, 1) is null then
    raise exception '원하시는 서비스를 하나 이상 골라 주세요';
  end if;
  if array_length(v_svc, 1) > 10 then
    raise exception '고르신 서비스가 너무 많습니다 — 열 개까지입니다';
  end if;

  -- ⚠️ 예산은 **0 도 값입니다** (무료 상담). 음수와 뒤집힌 것만 막습니다.
  if v_bmin is not null and v_bmin < 0 then raise exception '예산은 0 보다 작을 수 없습니다'; end if;
  if v_bmax is not null and v_bmax < 0 then raise exception '예산은 0 보다 작을 수 없습니다'; end if;
  if v_bmin is not null and v_bmax is not null and v_bmin > v_bmax then
    raise exception '예산의 아래가 위보다 큽니다';
  end if;

  if (p->>'agree_at') is null then
    raise exception '수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes' then
    raise exception '동의 시각이 미래입니다';
  end if;
  if (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의가 오래되었습니다 — 다시 한 번 눌러 주세요';
  end if;

  -- ⚠️⚠️ **같은 요청을 두 번 넣는 것을 두 겹으로 막습니다.**
  --   ① idem — 화면이 한 번 연 동안 하나입니다 (두 번 눌러도 하나)
  --   ② 같은 번호로 10분 안 (지시서 §6 의 "유효 상담" · "중복 방지")
  if v_idem is not null then
    select id, no into v_id, v_no from request where idem = v_idem;
    if v_id is not null then return v_no; end if;   -- 이미 들어간 것입니다
  end if;
  if exists (
    select 1 from request
     where regexp_replace(tel, '[^0-9]', '', 'g') = v_digits
       and created_at > now() - interval '10 minutes')
  then
    raise exception '방금 같은 번호로 요청이 들어왔습니다 — 잠시 뒤에 다시 해 주세요';
  end if;

  -- 번호 — 겹치면 다시 뽑습니다 (스무 번까지)
  loop
    v_try := v_try + 1;
    v_raw := '';
    for i in 1..8 loop
      v_raw := v_raw || substr(v_abc, 1 + floor(random() * length(v_abc))::int, 1);
    end loop;
    v_no := 'SW-' || substring(v_raw from 1 for 4) || '-' || substring(v_raw from 5 for 4);
    exit when not exists (select 1 from request where no = v_no);
    if v_try > 20 then raise exception '신청번호를 만들지 못했습니다'; end if;
  end loop;

  insert into request (no, user_id, side, cat, region, gu,
                       budget_min, budget_max, want_at, body,
                       name, tel, email, agree_at, idem)
  values (v_no, auth.uid(), 'golf',
          -- ⚠️ 분류는 **첫 서비스가 속한 분류**를 화면이 적어 보냅니다.
          --    DB 는 분류 목록을 모릅니다 (그 목록은 js/data/catalog.js
          --    한 곳에 있고, 두 곳에 적으면 조용히 어긋납니다).
          nullif(btrim(coalesce(p->>'cat', '')), ''),
          v_region, v_gu, v_bmin, v_bmax, v_want, v_body,
          v_name, v_tel, v_email, (p->>'agree_at')::timestamptz, v_idem)
  returning id into v_id;

  foreach k in array v_svc loop
    insert into request_item (request_id, service_id)
    values (v_id, k)
    on conflict (request_id, service_id) do nothing;
  end loop;

  -- ⚠️ 감사 기록에 **성함 · 연락처를 넣지 않습니다.** 신청번호로 찾아갑니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (auth.uid(), my_role(), 'request', v_no, 'new', '매칭 요청 접수',
          jsonb_build_object('services', v_svc, 'region', v_region,
                             'cat', nullif(btrim(coalesce(p->>'cat', '')), '')));

  return v_no;
end $$;

revoke all on function make_request(jsonb) from public;
grant execute on function make_request(jsonb) to anon, authenticated;

insert into schema_version (n, name) values (29, '0029_match_door')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0030_test_provider.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0030 — **검사용 업체**를 참 업체와 갈라 둡니다 (2차 지시서 §8)
-- ════════════════════════════════════════════════════════════════════
-- 지시서 §8 이 "실제 데이터와 테스트 데이터를 구분한다" 고 적었고,
-- §1 과 절대 규칙 1 이 **없는 업체를 손님에게 보이는 것**을 금지합니다
-- (표시 · 광고의 공정화에 관한 법률 제3조). 그런데 지금 `provider` 표에는
-- 그 둘을 가를 칸이 **없습니다.**
--
-- ⚠️⚠️ **왜 지금 필요한가.** 상담 → 배정 → 견적 → 고르기 흐름은
--   업체가 있어야 눌러 볼 수 있습니다. 참 업체가 0곳인 동안 그 자리를
--   한 번도 안 눌러 보고 두면, 첫 업체가 들어온 날 **그때 처음** 깨진
--   것을 알게 됩니다. 그래서 검사용 업체를 넣어 눌러 보는데 —
--   **그 줄이 손님 화면으로 새면 그 순간 없는 회사를 광고하는 것**입니다.
--   칸 하나로 그 길을 끊습니다.
--
-- ⚠️⚠️ **`listed` 와 다른 칸입니다.** 셋이 하는 일이 다릅니다 —
--     listed      공개 목록에 낼 것인가           (관리자가 정합니다)
--     assignable  신청을 넘겨도 되는가             (계약 · 계정 연결)
--     is_test     **참 업체가 아닙니다**           (지우기 전까지 영원히)
--   `listed = false` 로만 숨기면 누군가 공개를 켜는 날 조용히 손님에게
--   나갑니다. `is_test` 는 **공개 정책 자체가** 걸러서, 켜도 안 나갑니다.
--
-- ⚠️⚠️ **앞으로 세는 자리는 전부 `is_test = false` 로 좁혀야 합니다.**
--   매각 지표(2차 지시서 §9 — MAU · 유효 상담 비율 · 거래액)에 검사용
--   줄이 섞이면 그건 **투자자에게 하는 거짓말**입니다. 지금 세는 곳은
--   `js/account.js` 의 관리자 현황 하나이고, 거기서는 검사용을 **따로**
--   셉니다 (섞지 않고 갈라 보여 줍니다).
--
-- ⚠️ 돌려도 참 자료가 바뀌지 않습니다 — default false 라 기존 줄은
--   전부 참 업체로 남습니다 (not null 을 default 와 **같이** 적는
--   까닭입니다. default 없이 not null 을 붙이면 줄이 있는 표에서
--   그 자리에서 터집니다).
--
-- ⚠️⚠️ **`provider_guard()` 를 네 번째로 다시 씁니다**
--   (0001 → 0021 → 0024 → 0030). 앞 번호를 다시 붙여 넣으면 이 파일이
--   한 일이 **조용히 내려갑니다** — 에러가 안 납니다. 내려갔는지는
--   이렇게 봅니다:
--     select prosrc like '%is_test%' from pg_proc where proname='provider_guard';
--   false 면 앞 판입니다. 이 파일을 다시 올리세요.
--
-- ⚠️ 씨앗은 여기 넣지 않습니다 — `db/seed/test-providers.sql` 입니다.
--   마이그레이션에 넣으면 운영 DB 를 올리는 날 **검사용 업체가 같이**
--   올라갑니다.
-- ════════════════════════════════════════════════════════════════════
begin;

-- ── ① 칸 ────────────────────────────────────────────────────────────
alter table provider
  add column if not exists is_test boolean not null default false;

comment on column provider.is_test is
  '참 업체가 아닙니다 (검사용). 공개 정책이 걸러 손님 화면에 안 나갑니다. '
  '세는 자리는 전부 is_test = false 로 좁혀야 합니다 — 2차 지시서 §8.';

-- ⚠️ 공개 목록을 꺼낼 때마다 보는 칸이라 인덱스를 같이 둡니다.
create index if not exists provider_live_idx
  on provider (listed) where is_test = false;


-- ── ② 공개 정책 — 검사용은 **anon 에게 한 줄도** 안 갑니다 ──────────
-- ⚠️⚠️ 0001 의 정책을 **덮어씁니다.** 0001 을 다시 붙여 넣으면 이것이
--   내려가고 검사용 업체가 공개됩니다 — 위 머리말의 확인 질의와 같은
--   자리입니다.
-- ⚠️ 운영자와 **그 업체 자신**은 그대로 봅니다. 안 보이면 눌러 볼
--   수가 없고, 배정 화면에서 고를 수도 없습니다.
drop policy if exists provider_public on provider;
create policy provider_public on provider for select
  using ((listed = true and is_test = false)
         or my_role() in ('staff','admin')
         or id = my_provider());


-- ── ③ 업체가 스스로 끌 수 없게 ─────────────────────────────────────
-- ⚠️⚠️ **업체가 `is_test` 를 끄면 그 자리에서 공개됩니다.** `listed` ·
--   `verified` 와 같은 종류의 칸이라 같은 자물쇠에 넣습니다.
-- ⚠️ 거절하는 말을 **다른 말로** 둡니다 — 자물쇠가 겹치면 어느 것이
--   막았는지 알 수 없고, 검사가 엉뚱한 까닭으로 통과합니다.
create or replace function provider_guard() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if my_role() = 'admin' then return new; end if;
  if new.verified is distinct from old.verified then
    raise exception '확인 배지는 플랫폼이 서류를 확인한 뒤에만 켜집니다';
  end if;
  if new.listed is distinct from old.listed then
    raise exception '공개 여부는 관리자가 정합니다';
  end if;
  if new.id is distinct from old.id then
    raise exception '업체 주소(id)는 바꿀 수 없습니다 — 이미 색인된 주소입니다';
  end if;
  if new.is_test is distinct from old.is_test then
    raise exception '검사용 표시는 관리자만 바꿀 수 있습니다';
  end if;
  return new;
end $$;


-- ── ④ 검사용 줄이 섞이지 않게 세는 손잡이 ──────────────────────────
-- ⚠️⚠️ **왜 함수인가.** 관리자 화면은 PostgREST 로 `provider` 를 세는데,
--   운영자에게는 검사용 줄도 보입니다 (② 의 정책). 그래서 화면이 센
--   값은 **검사용이 섞인 값**이고, 그것을 "업체 수" 라고 찍으면 그
--   화면부터 이미 틀린 숫자입니다.
--   PostgREST 로 `is_test=eq.false` 를 붙일 수도 있지만, 그러면 **화면이
--   그 조건을 기억해야** 하고 새 화면을 만드는 날 빠집니다 (같은 규칙을
--   두 곳에 적는 자리입니다). 세는 규칙을 DB 에 한 번 둡니다.
-- ⚠️ 돌려주는 것은 **숫자 둘**입니다 — 사람 정보가 아닙니다.
-- ⚠️⚠️ **0 을 null 로 섞지 않습니다.** 못 읽은 것과 0건은 다릅니다 —
--   읽을 수 없으면 거절(exception)하고, 0건이면 0 을 돌려줍니다.
create or replace function provider_counts() returns jsonb
  language plpgsql stable security definer set search_path = public as $$
declare v_live int; v_test int;
begin
  if my_role() not in ('staff','admin') then
    raise exception '업체 수는 직원 · 관리자만 볼 수 있습니다';
  end if;
  select count(*) into v_live from provider where is_test = false;
  select count(*) into v_test from provider where is_test = true;
  return jsonb_build_object('real', v_live, 'test', v_test);
end $$;

revoke all on function provider_counts() from public;
grant execute on function provider_counts() to authenticated;

insert into schema_version (n, name) values (30, '0030_test_provider')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0031_quote_provider_name.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0031 — 손님이 **자기에게 배정된 업체의 상호**를 볼 수 있게
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️ **조용히 깨져 있던 자리입니다.** 견적 비교 화면을 세우면서
--   알았습니다 —
--
--   손님 화면은 견적을 이렇게 꺼냅니다 (PostgREST 의 묶음 읽기):
--     quote?select=...,provider:provider_id(id,name)
--   그런데 묶여 나오는 `provider` 줄에도 RLS 가 걸립니다. 0001 의
--   `provider_public` 은 `listed = true` 인 줄만 열어 주므로, **공개
--   목록에 없는 업체가 낸 견적은 상호가 `null` 로** 나옵니다.
--   금액만 있고 **누가 냈는지가 없는 견적**입니다.
--
--   에러가 안 납니다. 화면은 멀쩡히 그려지고 그 칸만 빕니다 —
--   `listed = true` 인 업체로만 눌러 보면 **영원히 안 보이는** 고장입니다.
--
-- ⚠️⚠️ **이것은 가려야 할 것을 더 여는 일이 아닙니다.** 배정하는 순간
--   그 업체의 **상호를 손님에게 알리고** 제3자 제공 동의를 받았습니다
--   (개인정보보호법 제17조 제2항 · 0004 의 move_state). 이미 알려 드린
--   상호를 그 손님에게 보여 주는 것입니다. 모르는 업체가 아닙니다.
--
-- ⚠️ 여는 범위를 **그 손님 · 그 업체**로 좁힙니다 — 배정된 적이 없는
--   업체는 전과 똑같이 안 보입니다.
--
-- ⚠️⚠️ **정책 안에서 `assignment` 를 바로 읽으면 무한 재귀입니다.**
--   `assignment` 의 정책이 `request` 를 보고, `request` 의
--   `request_assigned` 가 다시 `assignment` 를 봅니다 — Postgres 가
--   *"infinite recursion detected in policy"* 로 멈춥니다 (0005 · 0008
--   에서 실제로 겪은 자리). 그래서 `security definer` 함수로 끊습니다.
--
-- ⚠️ 검사용 업체(0030)도 여기서는 보입니다. **그것이 맞습니다** —
--   배정이 실제로 있었다는 뜻이고, 그 상호는 이미 알려 드린 것입니다.
--   공개 목록 · 분류 화면 · 사이트맵은 0030 의 정책이 그대로 막습니다
--   (그 길은 `listed = true and is_test = false` 를 지나야 합니다).
-- ════════════════════════════════════════════════════════════════════
begin;

-- ⚠️ `stable` 입니다 — 한 질의 안에서 줄마다 다시 돌지 않게.
create or replace function provider_told_to_me(p_id text) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1
      from assignment a
      join request r on r.id = a.request_id
     where a.provider_id = p_id
       and r.user_id = auth.uid()
  )
$$;
revoke all on function provider_told_to_me(text) from public;
grant execute on function provider_told_to_me(text) to authenticated;

-- ⚠️⚠️ **0030 의 정책을 건드리지 않고 정책을 하나 더 답니다.**
--   RLS 의 select 정책 여럿은 **or 로** 묶입니다 — 0030 을 고쳐
--   조건을 늘리면 "공개 목록" 규칙과 "내 업체" 규칙이 한 덩어리가 되고,
--   한쪽을 고칠 때 다른 쪽이 같이 움직입니다. 따로 둡니다.
drop policy if exists provider_told on provider;
create policy provider_told on provider for select
  using (provider_told_to_me(id));

insert into schema_version (n, name) values (31, '0031_quote_provider_name')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0032_provider_card_view.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0032 — 업체 목록을 **가져올 길**을 엽니다 (그리고 광고 보기의 구멍 하나)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **`tools/pull-providers.js` 는 지금까지 한 번도 돌 수 없었습니다.**
--   그 도구는 공개 키(anon)로 `provider` 표를 읽습니다. 그런데 0001 의
--   GRANT 는 **anon 에게 select 를 한 줄도 주지 않습니다** (452~456행 —
--   "anon 에게는 아무 권한도 주지 않습니다"). RLS 의 `provider_public`
--   정책만 보고 "공개 목록은 읽힌다" 고 읽었는데, **GRANT 가 먼저**
--   막습니다 — `permission denied for table provider` 입니다.
--
--   업체가 0곳인 동안은 아무도 그 도구를 돌릴 까닭이 없어서 몰랐습니다.
--   **첫 업체를 승인하신 날** 그때 처음 터질 참이었고, 그날은 손님에게
--   업체를 보여 드리려는 날입니다. 0030 의 검사를 쓰면서 anon 으로
--   눌러 보다 알았습니다 (자물쇠가 **겹쳐 있어** 정책만 보고 통과로
--   읽은 자리 — 작업 기억의 "GRANT 와 RLS 를 따로 눌러 보세요").
--
-- ⚠️⚠️ **표를 anon 에게 열지 않습니다.** `grant select on provider to anon`
--   한 줄로 끝낼 수도 있지만, 그러면 **칸 전부**가 열립니다 —
--   `assignable`(제휴 계약이 되어 있는가) · `listed` · `is_test` 까지
--   누구나 읽습니다. 그건 손님 화면에 쓰지 않는 운영 정보입니다.
--   그래서 **칸을 골라 담은 보기(view)** 하나만 엽니다.
--
-- ⚠️⚠️ **보기는 RLS 를 지나지 않습니다** (security_invoker 를 안 켰으니
--   임자 권한으로 돕니다). 그러니 **보기의 where 절이 자물쇠 그 자체**
--   입니다 — 0030 의 정책과 **다른 자리에 있는 둘째 자물쇠**이고,
--   한쪽이 내려가도 다른 쪽이 남습니다. 칸을 더하실 때 이 줄을 꼭
--   다시 읽으세요.
--
-- ⚠️ `is_test` 를 **일부러 담았습니다.** 보기의 where 가 늘 false 로
--   좁히니 쓸모없어 보이지만, `tools/pull-providers.js` 가 그 값을
--   다시 봅니다 — where 가 느슨해지는 날 도구가 멈춥니다.
--
-- ⚠️⚠️ **광고 보기(v_ad_live)에 구멍이 하나 있었습니다.** 그 보기는
--   `provider` 를 join 해서 상호를 내보내고 anon 에게 열려 있는데,
--   보기는 RLS 를 지나지 않으므로 **검사용 업체의 상호가 광고로 나갈**
--   수 있었습니다 (0030 의 정책이 그 길은 못 막습니다). 같이 좁힙니다.
-- ════════════════════════════════════════════════════════════════════
begin;

-- ── ① 공개용 업체 보기 ──────────────────────────────────────────────
-- ⚠️⚠️ **연락처 · 담당자 칸이 여기 없습니다** (그 자료는 0013 의
--   `provider_contact` 에 따로 있고, 운영자만 봅니다). 이 보기에
--   사람 정보를 담지 마세요 — anon 에게 열린 자리입니다.
-- ⚠️ `assignable` 도 담지 않습니다 — 어느 업체와 계약이 되어 있는지는
--   손님 화면에 쓸 일이 없습니다.
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
         p.is_test       -- ⚠️ 늘 false 입니다 (아래 where) — 도구가 다시 봅니다
    from provider p
   where p.listed = true
     and p.is_test = false;

comment on view v_provider_card is
  '손님 화면 · tools/pull-providers.js 가 읽는 공개 업체 목록. '
  'RLS 를 지나지 않으므로 where 절이 자물쇠입니다 (0032).';

grant select on v_provider_card to anon, authenticated;


-- ── ② 광고 보기에서도 검사용을 거릅니다 ────────────────────────────
-- ⚠️⚠️ 0026 의 보기를 **덮어씁니다.** 0026 을 다시 붙여 넣으면 이것이
--   내려가고 검사용 업체의 상호가 광고로 나갈 수 있습니다. 내려갔는지는
--   이렇게 봅니다:
--     select definition like '%is_test%' from pg_views where viewname='v_ad_live';
--   false 면 0026 판입니다. 이 파일을 다시 올리세요.
-- ⚠️ 칸 목록과 차례는 0026 것 **그대로**입니다 — 보기의 칸이 바뀌면
--   `create or replace view` 가 거절합니다 (그게 맞습니다).
-- ⚠️⚠️ `label` 을 **그대로 둡니다.** 광고를 광고라고 적지 않으면
--   표시 · 광고의 공정화에 관한 법률 제3조입니다.
create or replace view v_ad_live as
  select a.id, a.provider_id, p.name as provider_name,
         a.place, a.cat_key, a.region, a.starts_on, a.ends_on,
         '광고'::text as label
    from ad_run a join provider p on p.id = a.provider_id
   where a.state = 'live'
     and current_date between a.starts_on and a.ends_on
     and p.is_test = false;

insert into schema_version (n, name) values (32, '0032_provider_card_view')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0033_biz_metrics.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0033 — 매각 지표 (2차 지시서 §9)
-- ════════════════════════════════════════════════════════════════════
-- 지시서 §9 가 적은 것은 셋입니다 — **MAU · 유효 상담 비율 ·
-- 거래액과 순매출의 분리.** 이 파일은 그것을 **세는 식 한 곳**입니다.
--
-- ⚠️⚠️⚠️ **이 숫자는 사업의 값을 매기는 데 쓰입니다.** 틀리면 손님이
--   불편한 것이 아니라 **투자자에게 거짓을 말한 것**이 됩니다. 그래서
--   이 파일은 다른 어떤 파일보다 **덜 세는 쪽으로** 기웁니다 —
--   애매하면 빼고, 뺀 것을 **따로 세어 같이 내놓습니다.**
--
-- ⚠️⚠️ **검사용 업체를 뺍니다** (0030 의 `is_test`). 섞이면 그 순간
--   없는 거래가 지표에 들어갑니다. 업체가 붙는 숫자는 전부 걸렀고,
--   `request` 에는 검사용 표시가 없어서 **검사용 업체에만 넘어간
--   요청**을 빼고 그 수를 `req_test` 로 따로 냅니다 (조용히 빼지
--   않습니다 — 빠진 것이 보여야 합니다).
--
-- ⚠️⚠️ **거래액과 순매출을 한 칸에 담지 않습니다.** 거래액은 손님이
--   업체에 낸 돈이고 **우리 돈이 아닙니다.** 두 값을 더해 "매출" 로
--   적는 순간 그건 과장입니다 (§9 가 "분리" 라고 적은 까닭).
--   ⚠️ 그리고 **플랫폼이 버는 돈 안에서도** 다시 가릅니다 —
--     · `fee_paid`  실제 입금 기록이 있는 유일한 돈 (`deal.paid`)
--     · `fee_set`   확정만 된 것 (`deal.fee_total`)
--     · `ad` · `mship`  **청구 · 입금 장치가 아직 없습니다.** 금액이
--       적혀 있을 뿐입니다. 합쳐서 "매출" 로 내면 받은 적 없는 돈을
--       받았다고 하는 것입니다 (절대 규칙 5 · 지시서 §13 가짜 정산 금지).
--   그래서 **하나로 더한 값을 일부러 내놓지 않습니다.** 더하는 것은
--   보는 사람이 뜻을 알고 할 일입니다.
--
-- ⚠️⚠️ **MAU 를 낼 수 없습니다.** 방문자를 세는 장치가 없습니다
--   (분석 도구를 안 붙였습니다). 없는 것을 추정해서 내면 그게 지어낸
--   숫자입니다 — 대신 **로그인해서 실제로 뭔가를 한 회원 수**를 내고
--   이름도 `users`(활동 회원)로 둡니다. 화면이 "방문자가 아니다" 라고
--   같이 적습니다.
--   ⚠️ 방문자 MAU 를 재시려면 분석 도구를 붙이셔야 하고, **붙이는 날
--   개인정보 처리방침에 수탁자를 같은 날 적어야 합니다** (개인정보
--   보호법 제26조 · 미국 회사면 국가도 — 제28조의8).
--
-- ⚠️⚠️ **달은 한국 시각으로 가릅니다.** Supabase 는 UTC 입니다 —
--   그냥 자르면 한국 시각 12월 1일 0시 30분에 들어온 요청이 **11월**로
--   잡힙니다. 날짜로 번호를 만들 때 겪은 것과 같은 자리입니다.
--
-- ⚠️⚠️⚠️ **앞 사업(중고폰)의 자료를 섞지 않습니다.** 1차 지시서가
--   "기존 창업 · 폐업 관련 데이터를 새로운 사업에 활용하지 않는다" 고
--   적었고, 섞으면 **골프올인원이 하지 않은 거래가 골프올인원의 실적**이
--   됩니다 — 사는 쪽에서 보면 그게 가장 큰 거짓말입니다.
--   같은 표(`request` · `deal` · `quote`)에 옛 자료가 **그대로 남아
--   있습니다** (지우지 않는 것이 맞습니다 — 손님 기록입니다). 그래서
--   세는 자리마다 `request.side = 'golf'` 로 좁힙니다.
--   ⚠️ 활동 회원도 같습니다 — **골프 요청을 한 적이 있는 회원**만 셉니다.
--     앞 사업만 쓰신 분이 골프의 MAU 로 잡히면 안 됩니다.
--
-- ⚠️ 운영자만 부릅니다. 지표에는 손님 성함 · 연락처가 없지만, 거래액과
--   수수료는 **밖에 나가면 안 되는 숫자**입니다.
-- ════════════════════════════════════════════════════════════════════
begin;

-- ⚠️ 달 경계를 **한 함수**에 둡니다 — 여기저기 적으면 한쪽만 고쳐서
--   어떤 지표는 UTC 로, 어떤 지표는 KST 로 잘리는 날이 옵니다.
create or replace function kst_month(t timestamptz) returns text
  language sql immutable set search_path = public as $$
  select to_char(date_trunc('month', t at time zone 'Asia/Seoul'), 'YYYY-MM')
$$;

create or replace function kst_month(d date) returns text
  language sql immutable set search_path = public as $$
  select to_char(date_trunc('month', d::timestamp), 'YYYY-MM')
$$;

-- ════════════════════════════════════════════════════════════════════
-- 지표 — 달마다 한 줄
--
-- 인자는 `jsonb` 하나입니다 (⚠️ 자리가 어긋나면 엉뚱한 값이 엉뚱한
-- 칸에 들어갑니다 — 0027 · 0029 와 같은 규칙).
--     { "from": "2026-01", "to": "2026-12" }
-- 안 주시면 **이달까지 열두 달**입니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function biz_metrics(p jsonb default '{}'::jsonb)
  returns jsonb language plpgsql stable security definer
  set search_path = public as $$
declare
  v_to    text := nullif(btrim(coalesce(p->>'to', '')), '');
  v_from  text := nullif(btrim(coalesce(p->>'from', '')), '');
  d_to    date;
  d_from  date;
  v_rows  jsonb;
begin
  if my_role() not in ('staff','admin') then
    raise exception '지표는 직원 · 관리자만 볼 수 있습니다';
  end if;

  -- ⚠️ 오늘도 **한국 시각**입니다.
  d_to := date_trunc('month',
            coalesce(to_date(v_to, 'YYYY-MM'),
                     (now() at time zone 'Asia/Seoul')::date))::date;
  d_from := date_trunc('month',
              coalesce(to_date(v_from, 'YYYY-MM'),
                       d_to - interval '11 months'))::date;
  if d_from > d_to then
    raise exception '시작 달이 끝 달보다 뒤입니다';
  end if;
  -- ⚠️ 너무 넓게 열어 두면 한 번에 수십 년을 셉니다 — 다섯 해까지.
  if d_to > d_from + interval '5 years' then
    raise exception '한 번에 다섯 해까지만 셀 수 있습니다';
  end if;

  with
  months as (
    select to_char(m, 'YYYY-MM') as ym
      from generate_series(d_from, d_to, interval '1 month') as g(m)
  ),
  -- 검사용 업체에만 넘어간 요청 — ⚠️ **빼되 세어 둡니다**
  req_test as (
    select r.id
      from request r
     where exists (select 1 from assignment a join provider p on p.id = a.provider_id
                    where a.request_id = r.id and p.is_test)
       and not exists (select 1 from assignment a join provider p on p.id = a.provider_id
                        where a.request_id = r.id and not p.is_test)
  ),
  req as (
    select kst_month(r.created_at) as ym,
           count(*) filter (where t.id is null) as req,
           count(*) filter (where t.id is not null) as req_test
      from request r left join req_test t on t.id = r.id
     where r.side = 'golf'
     group by 1
  ),
  -- ⚠️ 배정 · 수락은 **배정 줄**이 아니라 **요청** 단위로 셉니다.
  --   한 요청을 업체 셋에 넘겼다고 유효 상담이 셋이 되면 안 됩니다.
  asg as (
    select kst_month(r.created_at) as ym,
           count(distinct a.request_id) as assigned,
           count(distinct a.request_id) filter (where a.state = 'accepted') as accepted
      from assignment a
      join provider p on p.id = a.provider_id and not p.is_test
      join request  r on r.id = a.request_id and r.side = 'golf'
     group by 1
  ),
  -- ⚠️ 거둔 견적도 셉니다 — "업체가 금액을 적어 냈다" 는 사실은 남습니다.
  qt as (
    select kst_month(r.created_at) as ym,
           count(distinct q.request_id) as quoted
      from quote q
      join provider p on p.id = q.provider_id and not p.is_test
      join request  r on r.id = q.request_id and r.side = 'golf'
     group by 1
  ),
  -- 계약 — ⚠️ **계약일 기준**입니다 (요청이 들어온 달이 아닙니다).
  --   ⚠️ 금액이 빈 계약은 거래액에 0 으로 더하지 않고 **따로 셉니다.**
  dl as (
    select kst_month(d.signed_at) as ym,
           count(*) as deals,
           coalesce(sum(d.amount), 0) as gmv,
           count(*) filter (where d.amount is null) as gmv_missing
      from deal d
      join provider p on p.id = d.provider_id and not p.is_test
      join request  r on r.id = d.request_id and r.side = 'golf'
     where d.signed_at is not null
     group by 1
  ),
  fee_set as (
    select kst_month(d.fee_at) as ym, coalesce(sum(d.fee_total), 0) as fee_set
      from deal d
      join provider p on p.id = d.provider_id and not p.is_test
      join request  r on r.id = d.request_id and r.side = 'golf'
     where d.fee_at is not null
     group by 1
  ),
  fee_paid as (
    select kst_month(d.paid_at) as ym, coalesce(sum(d.paid), 0) as fee_paid
      from deal d
      join provider p on p.id = d.provider_id and not p.is_test
      join request  r on r.id = d.request_id and r.side = 'golf'
     where d.paid_at is not null
     group by 1
  ),
  -- 광고 — ⚠️ **집행 시작 달**로 잡습니다. 기간이 여러 달에 걸쳐도
  --   쪼개지 않습니다 (쪼개면 받은 적 없는 돈을 달마다 나눠 적는 셈).
  --   ⚠️ `draft` 는 뺍니다 — 아직 집행이 아닙니다.
  ad as (
    select kst_month(a.starts_on) as ym, coalesce(sum(a.price), 0) as ad
      from ad_run a
      join provider p on p.id = a.provider_id and not p.is_test
     where a.state <> 'draft'
     group by 1
  ),
  -- 멤버십 — 그달에 **살아 있던** 것의 월정액 합
  mship as (
    select m.ym, coalesce(sum(pl.monthly), 0) as mship
      from months m
      join provider_membership pm on true
      join provider p  on p.id = pm.provider_id and not p.is_test
      join membership_plan pl on pl.id = pm.plan_id
     where kst_month(pm.starts_on) <= m.ym
       and (pm.ends_on is null or kst_month(pm.ends_on) >= m.ym)
     group by m.ym
  ),
  -- 활동 회원 — ⚠️⚠️ **일반 회원만** 셉니다.
  --   운영자를 넣으면 **우리가 누른 것이 MAU 가 됩니다.** 업체를 넣으면
  --   손님 수와 업체 수가 한 칸에 섞여, 손님이 늘지 않아도 업체를
  --   모집하면 숫자가 오릅니다 — 둘은 다른 뜻입니다.
  --   ⚠️ `not in ('staff','admin')` 이 아니라 `= 'customer'` 입니다.
  --     역할이 하나 더 생기는 날 조용히 섞이지 않게.
  --   ⚠️⚠️ 그리고 **골프 요청을 한 적이 있는 회원**만입니다 — 앞 사업만
  --     쓰신 분의 기록이 골프의 MAU 로 잡히면 안 됩니다 (머리말 참고).
  golf_user as (
    select distinct user_id from request
     where side = 'golf' and user_id is not null
  ),
  usr as (
    select kst_month(l.at) as ym, count(distinct l.by_user) as users
      from audit_log l
      join account ac on ac.id = l.by_user
      join golf_user g on g.user_id = l.by_user
     where l.by_user is not null
       and ac.role = 'customer'
     group by 1
  )
  select jsonb_agg(x order by x->>'month')
    into v_rows
    from (
      select jsonb_build_object(
        'month',       m.ym,
        'req',         coalesce(req.req, 0),
        'req_test',    coalesce(req.req_test, 0),
        'assigned',    coalesce(asg.assigned, 0),
        'accepted',    coalesce(asg.accepted, 0),
        -- ⚠️⚠️ **분모가 0 이면 비율을 내지 않습니다** ("0%" 는 비율이
        --   아닙니다). null 로 내고 화면이 "—" 를 찍습니다.
        'rate_valid',  case when coalesce(req.req, 0) = 0 then null
                            else round(coalesce(asg.accepted, 0) * 100.0
                                       / req.req, 1) end,
        'quoted',      coalesce(qt.quoted, 0),
        'deals',       coalesce(dl.deals, 0),
        'gmv',         coalesce(dl.gmv, 0),
        'gmv_missing', coalesce(dl.gmv_missing, 0),
        'fee_paid',    coalesce(fee_paid.fee_paid, 0),
        'fee_set',     coalesce(fee_set.fee_set, 0),
        -- ⚠️ 음수가 나올 수 있습니다 (지난달 확정분이 이달에 입금).
        --   0 으로 깎지 않습니다 — 깎으면 그 돈이 어디로 갔는지 사라집니다.
        'fee_due',     coalesce(fee_set.fee_set, 0) - coalesce(fee_paid.fee_paid, 0),
        'ad',          coalesce(ad.ad, 0),
        'mship',       coalesce(mship.mship, 0),
        'users',       coalesce(usr.users, 0)
      ) as x
      from months m
      left join req      on req.ym      = m.ym
      left join asg      on asg.ym      = m.ym
      left join qt       on qt.ym       = m.ym
      left join dl       on dl.ym       = m.ym
      left join fee_set  on fee_set.ym  = m.ym
      left join fee_paid on fee_paid.ym = m.ym
      left join ad       on ad.ym       = m.ym
      left join mship    on mship.ym    = m.ym
      left join usr      on usr.ym      = m.ym
    ) t;

  return jsonb_build_object(
    'from',   to_char(d_from, 'YYYY-MM'),
    'to',     to_char(d_to,   'YYYY-MM'),
    'months', coalesce(v_rows, '[]'::jsonb),
    -- ⚠️⚠️ **못 재는 것을 같이 내놓습니다.** 화면이 이것을 그대로
    --   찍어서, 숫자를 보는 사람이 **무엇이 빠졌는지** 같이 읽습니다.
    'cannot', jsonb_build_array(
      '방문자 기준 MAU — 방문을 세는 장치가 없습니다. ' ||
      '붙이시는 날 개인정보 처리방침에 수탁자를 같은 날 적어야 합니다.',
      '광고 · 멤버십의 입금 — 청구 · 입금 기록을 두는 표가 아직 없습니다. ' ||
      '금액은 적어 둔 값이고 받은 돈이 아닙니다.',
      '재방문 · 이탈 — 같은 사람이 다시 왔는지 알 길이 없습니다 (로그인 전 접수).'
    )
  );
end $$;

revoke all on function biz_metrics(jsonb) from public;
grant execute on function biz_metrics(jsonb) to authenticated;

insert into schema_version (n, name) values (33, '0033_biz_metrics')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0034_appointment.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0034 — 상담 예약 · 일정 (2차 지시서 §7)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️ **왜 필요한가.** 지금은 업체가 수락하고 "상담 중" 으로 넘기면
--   그 뒤가 **전화기 안에만** 있습니다. 손님은 언제 만나기로 했는지
--   화면에서 볼 길이 없고, 운영자는 그 건이 살아 있는지 모릅니다.
--
-- ⚠️⚠️ **알림을 보내지 않습니다.** 문자 · 카톡을 붙이지 않았으므로
--   "예약하면 알려 드립니다" 라고 **말하지 않습니다** (절대 규칙 5).
--   여기가 하는 일은 **적어 두고 서로 같은 것을 보는 것**까지입니다.
--   ⚠️ 알림을 붙이시는 날은 정보통신망법 제50조입니다 — (광고) 표기가
--   아니라 거래 안내라도 **보내는 사람 · 수신거부**는 적어야 하고,
--   발송사를 쓰면 방침에 수탁자를 **같은 날** 적어야 합니다 (제26조).
--
-- ⚠️⚠️ **잡는 사람은 업체입니다** (손님이 아니라). 업체의 일정은
--   업체가 압니다 — 손님이 아무 때나 잡게 두면 업체가 못 가는 시각이
--   잡히고, 그건 플랫폼이 한 약속이 됩니다. 손님은 **보고 · 거절**
--   합니다 (거절은 상태로 남습니다).
--
-- ⚠️ 한 요청에 **업체마다 하나**입니다. 여러 줄을 쌓으면 "어느 것이
--   지금 약속인가" 가 갈립니다 — 바꾸면 그 줄을 덮어쓰고, 바꾼 기록은
--   `audit_log` 에 남습니다 (문이 하나라서).
--
-- ⚠️⚠️ **시각은 timestamptz 입니다.** 날짜만 적으면 "11월 5일 몇 시" 가
--   사라집니다. ⚠️ 보여 줄 때는 **한국 시각**으로 봅니다 — Supabase 는
--   UTC 라 그냥 찍으면 아홉 시간 어긋납니다.
-- ════════════════════════════════════════════════════════════════════
begin;

create table if not exists appointment (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references request(id) on delete cascade,
  provider_id text not null references provider(id) on delete cascade,
  at          timestamptz not null,
  -- 어디서 만나나 — ⚠️ 글자가 아니라 **정해진 셋**입니다
  --   js/data/deal.js 의 AM_APPT_KIND 와 같아야 하고, 빌드가 맞춰 봅니다.
  kind        text not null default 'visit'
              check (kind in ('visit','call','online')),
  place       text,                       -- 매장 주소 · 연습장 이름 등
  note        text,
  -- set 잡힘 · done 만났음 · cancel 취소
  state       text not null default 'set'
              check (state in ('set','done','cancel')),
  why         text,                       -- 취소 · 변경 사유
  by_user     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (request_id, provider_id),
  constraint appt_place_len check (place is null or length(place) <= 200),
  constraint appt_note_len  check (note  is null or length(note)  <= 1000)
);
create index if not exists appt_at_idx on appointment (at desc);

alter table appointment enable row level security;

-- ── 누가 보는가 ─────────────────────────────────────────────────────
-- ⚠️⚠️ 정책 안에서 `request` 를 바로 읽으면 무한 재귀입니다 (0005 ·
--   0008 · 0011 에서 겪은 자리) — `is_my_request()` 로 끊습니다.
drop policy if exists appt_mine on appointment;
create policy appt_mine on appointment for select
  using (is_my_request(request_id));

drop policy if exists appt_provider on appointment;
create policy appt_provider on appointment for select
  using (provider_id = my_provider());

drop policy if exists appt_staff on appointment;
create policy appt_staff on appointment for select
  using (my_role() in ('staff','admin'));

-- ⚠️⚠️ **쓰기 정책을 일부러 만들지 않았습니다.** RLS 는 정책이 없으면
--   막습니다 — 쓰는 길은 아래 문 둘뿐입니다 (0008 과 같은 규칙).
grant select on appointment to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ① 업체가 일정을 잡습니다 · 고칩니다
--
-- ⚠️⚠️ **배정을 수락한 업체만**입니다. `submit_quote`(0008)와 **같은
--   말로** 거절하면 어느 자물쇠인지 알 수 없으니, 거절하는 글을
--   그 자리에 맞게 적습니다.
-- ⚠️ 상태를 여기서 바꾸지 않습니다 — 상태의 문은 `move_state()` 하나
--   입니다 (0004). 일정은 상담의 **부속**이지 상태가 아닙니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function set_appointment(p jsonb)
  returns uuid language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_pv   text := my_provider();
  v_req  uuid;
  v_as   text;
  v_st   deal_state;
  v_at   timestamptz;
  v_kind text := coalesce(nullif(btrim(p->>'kind'), ''), 'visit');
  v_id   uuid;
  v_was  text;
begin
  if v_me is null then
    raise exception '변경자를 알 수 없습니다 — 로그인한 세션에서만 됩니다';
  end if;
  if my_role() <> 'provider' or v_pv is null then
    raise exception '일정은 배정받은 업체가 잡습니다';
  end if;

  v_req := nullif(btrim(coalesce(p->>'request', '')), '')::uuid;
  if v_req is null then raise exception '어느 요청인지 적어 주세요'; end if;

  select state into v_st from request where id = v_req;
  if v_st is null then raise exception '없는 신청입니다'; end if;

  select state into v_as from assignment
   where request_id = v_req and provider_id = v_pv;
  if v_as is null then raise exception '이 신청에 배정되지 않았습니다'; end if;
  if v_as <> 'accepted' then raise exception '배정을 먼저 수락해 주세요'; end if;

  -- ⚠️⚠️ 끝난 건에는 안 잡습니다. 진행 안 함 · 보류에 일정이 붙으면
  --   손님 화면에 **살아 있는 약속**처럼 보입니다.
  if v_st in ('lost','hold') then
    raise exception '지금 상태(%)에서는 일정을 잡을 수 없습니다', v_st;
  end if;

  begin
    v_at := (p->>'at')::timestamptz;
  exception when others then
    raise exception '만나실 때를 다시 확인해 주세요';
  end;
  if v_at is null then raise exception '언제 만나실지 적어 주세요'; end if;
  -- ⚠️⚠️ **경계값.** 어제로 잡는 것은 오타입니다 (2025년으로 찍히는
  --   사고가 여기서 납니다). 하루 전까지는 봐줍니다 — 어젯밤 통화로
  --   정한 오늘 아침 약속을 오늘 적는 일이 있습니다.
  if v_at < now() - interval '1 day' then
    raise exception '지난 때로는 잡을 수 없습니다 — 날짜를 다시 봐 주세요';
  end if;
  -- ⚠️ 너무 넓게 막는 것도 고장입니다. 두 해 뒤까지는 둡니다.
  if v_at > now() + interval '2 years' then
    raise exception '너무 먼 때입니다 — 날짜를 다시 봐 주세요';
  end if;
  if v_kind not in ('visit','call','online') then
    raise exception '만나는 방법을 방문 · 통화 · 비대면 중에서 골라 주세요';
  end if;

  select state into v_was from appointment
   where request_id = v_req and provider_id = v_pv;

  insert into appointment (request_id, provider_id, at, kind, place, note,
                           state, by_user, updated_at)
  values (v_req, v_pv, v_at, v_kind,
          nullif(btrim(coalesce(p->>'place', '')), ''),
          nullif(btrim(coalesce(p->>'note', '')), ''),
          'set', v_me, now())
  on conflict (request_id, provider_id) do update
    set at = excluded.at, kind = excluded.kind, place = excluded.place,
        note = excluded.note, state = 'set', why = null,
        by_user = v_me, updated_at = now()
  returning id into v_id;

  -- ⚠️ 감사 기록에 **성함 · 연락처를 넣지 않습니다** — 요청 id 로
  --   찾아갑니다. ⚠️ `place` 도 안 넣습니다 (가게 주소입니다).
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, data)
  values (v_me, 'provider', 'appointment', v_id::text,
          coalesce(v_was, 'none'), 'set',
          jsonb_build_object('kind', v_kind, 'request_id', v_req));
  return v_id;
end $$;


-- ════════════════════════════════════════════════════════════════════
-- ② 취소 · 만났음
--
-- ⚠️⚠️ **손님도 취소할 수 있습니다.** 못 가게 된 것을 말할 길이 없으면
--   업체가 헛걸음합니다. 다만 "만났음" 은 **업체만** 적습니다 —
--   만난 사실은 업체가 압니다.
-- ⚠️ 지우지 않습니다. 잡았다가 취소한 것도 기록입니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function move_appointment(p jsonb)
  returns void language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_pv   text := my_provider();
  v_role app_role := my_role();
  v_id   uuid;
  v_to   text := nullif(btrim(coalesce(p->>'to', '')), '');
  v_why  text := nullif(btrim(coalesce(p->>'why', '')), '');
  r      appointment%rowtype;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  v_id := nullif(btrim(coalesce(p->>'id', '')), '')::uuid;
  if v_id is null then raise exception '어느 일정인지 적어 주세요'; end if;
  if v_to not in ('done','cancel') then
    raise exception '일정은 만났음 · 취소로만 옮깁니다';
  end if;

  select * into r from appointment where id = v_id;
  if not found then raise exception '그런 일정이 없습니다'; end if;

  -- ⚠️⚠️ **누가 무엇을 할 수 있나** — 자물쇠마다 **다른 말**로 거절합니다.
  if v_to = 'done' then
    if r.provider_id is distinct from v_pv then
      raise exception '만났음은 그 업체만 적을 수 있습니다';
    end if;
  else
    -- ⚠️⚠️⚠️ **`coalesce` 를 빼면 자물쇠가 통째로 열립니다.** SQL 은
    --   참 · 거짓 말고 **NULL** 이 있습니다. 업체가 아닌 사람은
    --   `my_provider()` 가 NULL 이라 `r.provider_id = v_pv` 가 **NULL**
    --   이고, `not (NULL or false or false)` 는 NULL 입니다 —
    --   `if NULL then` 은 **안 걸립니다.** 즉 남의 일정을 id 만 알면
    --   누구나 취소할 수 있었습니다 (검사가 잡았습니다).
    --   ⚠️ 비교가 NULL 을 낼 수 있는 자리는 **전부** coalesce 로 땅에
    --   내려놓으세요.
    if not (coalesce(r.provider_id = v_pv, false)
            or coalesce(is_my_request(r.request_id), false)
            or coalesce(v_role in ('staff','admin'), false)) then
      raise exception '이 일정을 취소할 수 없습니다';
    end if;
    -- ⚠️ 취소에는 **까닭을 받습니다** — 헛걸음한 쪽이 알아야 합니다.
    if v_why is null then raise exception '취소하시는 까닭을 적어 주세요'; end if;
  end if;

  if r.state = v_to then
    raise exception '이미 %입니다', case when v_to = 'done' then '만났음' else '취소' end;
  end if;

  update appointment set state = v_to, why = v_why, by_user = v_me, updated_at = now()
   where id = v_id;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, v_role, 'appointment', v_id::text, r.state, v_to, v_why,
          jsonb_build_object('request_id', r.request_id));
end $$;

revoke all on function set_appointment(jsonb)  from public;
revoke all on function move_appointment(jsonb) from public;
grant execute on function set_appointment(jsonb)  to authenticated;
grant execute on function move_appointment(jsonb) to authenticated;

insert into schema_version (n, name) values (34, '0034_appointment')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0035_want_provider.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0035 — 업체 화면에서 **상담으로 가는 길** (2차 지시서 §5)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️ **업체 상세 화면에 길이 없었습니다.** 손님이 업체를 보고
--   "여기 맡기고 싶다" 고 생각해도 누를 것이 없어서, 화면이 "아직
--   상담 연결을 받지 못합니다" 라고만 말하고 있었습니다 (단추를 미리
--   두지 않은 것은 맞습니다 — 절대 규칙 5). 이제 견적 흐름이 섰으니
--   그 길을 엽니다.
--
-- ⚠️⚠️⚠️ **"이 업체에 바로 간다" 고 말하면 안 됩니다.** 배정은 운영자가
--   하고, 넘기는 순간 **상호를 알리고 제3자 제공 동의를 다시** 받습니다
--   (개인정보보호법 제17조 제2항 · 0004 · 0029). 손님이 적어 주시는
--   것은 **바람**이고, 그 바람을 운영자가 봅니다. 화면도 그렇게 적습니다 —
--   "이 업체를 보고 요청하십니다. 운영자가 확인한 뒤 전달합니다."
--
-- ⚠️ 그래서 칸 이름이 `want_provider` 입니다 (`provider_id` 가 아니라).
--   이름이 곧 뜻입니다 — `assigned_provider` 로 지으면 다음 사람이
--   배정된 것으로 읽습니다.
--
-- ⚠️⚠️ **`make_request()` 를 다시 씁니다** (0029 → **0035**).
--   0029 를 다시 붙여 넣으면 이 파일이 한 일이 **조용히 내려갑니다** —
--   에러가 안 납니다. 내려갔는지는 이렇게 봅니다:
--     select prosrc like '%want_provider%' from pg_proc where proname='make_request';
--   false 면 0029 판입니다. 이 파일을 다시 올리세요.
--
-- ⚠️ 없는 업체 id 가 와도 **요청을 거절하지 않습니다.** 링크가 묵었거나
--   업체가 빠졌을 수 있는데, 그 때문에 손님의 요청이 통째로 막히면
--   안 됩니다 — 칸을 비우고 **비웠다는 사실을 감사 기록에** 남깁니다
--   (조용히 사라지지 않게).
-- ════════════════════════════════════════════════════════════════════
begin;

alter table request
  add column if not exists want_provider text references provider(id) on delete set null;

comment on column request.want_provider is
  '손님이 업체 화면에서 보고 적어 주신 **바람**입니다. 배정이 아닙니다 — '
  '배정은 운영자가 하고 그때 제3자 제공 동의를 다시 받습니다 (0035).';

create index if not exists request_want_idx
  on request (want_provider) where want_provider is not null;

-- ⚠️ 운영자가 배정 화면에서 봅니다 (0001 의 request_staff 가 이미 읽기를
--   허락하므로 정책은 그대로입니다).

create or replace function make_request(p jsonb)
  returns text language plpgsql security definer set search_path = public as $$
declare
  v_name  text := btrim(coalesce(p->>'name', ''));
  v_tel   text := btrim(coalesce(p->>'tel', ''));
  v_email text := nullif(btrim(coalesce(p->>'email', '')), '');
  v_region text := nullif(btrim(coalesce(p->>'region', '')), '');
  v_gu    text := nullif(btrim(coalesce(p->>'gu', '')), '');
  v_want  text := nullif(btrim(coalesce(p->>'want_at', '')), '');
  v_body  text := nullif(btrim(coalesce(p->>'body', '')), '');
  v_idem  text := nullif(btrim(coalesce(p->>'idem', '')), '');
  v_bmin  bigint := nullif(p->>'budget_min', '')::bigint;
  v_bmax  bigint := nullif(p->>'budget_max', '')::bigint;
  -- ⚠️ 0035 — 손님이 보고 오신 업체 (바람이지 배정이 아닙니다)
  v_wpv   text := nullif(btrim(coalesce(p->>'wantProvider', '')), '');
  v_wpv_ok text;
  v_svc   text[] := coalesce(
             (select array_agg(distinct btrim(x)) from jsonb_array_elements_text(
                case when jsonb_typeof(p->'services') = 'array'
                     then p->'services' else '[]'::jsonb end) as t(x)
              where btrim(x) <> ''), '{}'::text[]);
  v_digits text;
  v_no     text;
  v_id     uuid;
  v_try    int := 0;
  v_abc    text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  v_raw    text;
  k        text;
begin
  -- ⚠️ 자물쇠마다 **다른 말**로 거절합니다.
  if v_name = '' then raise exception '성함을 적어 주세요'; end if;
  if v_tel  = '' then raise exception '연락처를 적어 주세요'; end if;
  if length(v_name) > 40 then raise exception '성함이 너무 깁니다'; end if;
  if v_body is not null and length(v_body) > 2000 then
    raise exception '남기신 말씀이 너무 깁니다';
  end if;

  v_digits := regexp_replace(v_tel, '[^0-9]', '', 'g');
  -- ⚠️ 경계값: 9자리(02-xxx-xxxx)부터 11자리(010-xxxx-xxxx)까지입니다.
  if length(v_digits) < 9 or length(v_digits) > 11 then
    raise exception '연락처를 다시 봐 주세요 — 숫자 아홉에서 열한 자리입니다';
  end if;

  if array_length(v_svc, 1) is null then
    raise exception '원하시는 서비스를 하나 이상 골라 주세요';
  end if;
  if array_length(v_svc, 1) > 10 then
    raise exception '고르신 서비스가 너무 많습니다 — 열 개까지입니다';
  end if;

  -- ⚠️ 예산은 **0 도 값입니다** (무료 상담). 음수와 뒤집힌 것만 막습니다.
  if v_bmin is not null and v_bmin < 0 then raise exception '예산은 0 보다 작을 수 없습니다'; end if;
  if v_bmax is not null and v_bmax < 0 then raise exception '예산은 0 보다 작을 수 없습니다'; end if;
  if v_bmin is not null and v_bmax is not null and v_bmin > v_bmax then
    raise exception '예산의 아래가 위보다 큽니다';
  end if;

  if (p->>'agree_at') is null then
    raise exception '수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes' then
    raise exception '동의 시각이 미래입니다';
  end if;
  if (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의가 오래되었습니다 — 다시 한 번 눌러 주세요';
  end if;

  -- ⚠️⚠️ **같은 요청을 두 번 넣는 것을 두 겹으로 막습니다.**
  --   ① idem — 화면이 한 번 연 동안 하나입니다 (두 번 눌러도 하나)
  --   ② 같은 번호로 10분 안
  if v_idem is not null then
    select id, no into v_id, v_no from request where idem = v_idem;
    if v_id is not null then return v_no; end if;   -- 이미 들어간 것입니다
  end if;
  if exists (
    select 1 from request
     where regexp_replace(tel, '[^0-9]', '', 'g') = v_digits
       and created_at > now() - interval '10 minutes')
  then
    raise exception '방금 같은 번호로 요청이 들어왔습니다 — 잠시 뒤에 다시 해 주세요';
  end if;

  -- ⚠️⚠️ **바라시는 업체가 실제로 있는가.** 없으면 **비우고 넘어갑니다** —
  --   묵은 링크 때문에 손님의 요청이 통째로 막히면 안 됩니다.
  --   ⚠️ 검사용 업체는 안 받습니다 (손님 화면에 나간 적이 없는 업체입니다).
  if v_wpv is not null then
    select id into v_wpv_ok from provider
     where id = v_wpv and listed = true and is_test = false;
  end if;

  -- 번호 — 겹치면 다시 뽑습니다 (스무 번까지)
  loop
    v_try := v_try + 1;
    v_raw := '';
    for i in 1..8 loop
      v_raw := v_raw || substr(v_abc, 1 + floor(random() * length(v_abc))::int, 1);
    end loop;
    v_no := 'SW-' || substring(v_raw from 1 for 4) || '-' || substring(v_raw from 5 for 4);
    exit when not exists (select 1 from request where no = v_no);
    if v_try > 20 then raise exception '신청번호를 만들지 못했습니다'; end if;
  end loop;

  insert into request (no, user_id, side, cat, region, gu,
                       budget_min, budget_max, want_at, body,
                       name, tel, email, agree_at, idem, want_provider)
  values (v_no, auth.uid(), 'golf',
          -- ⚠️ 분류는 **첫 서비스가 속한 분류**를 화면이 적어 보냅니다.
          nullif(btrim(coalesce(p->>'cat', '')), ''),
          v_region, v_gu, v_bmin, v_bmax, v_want, v_body,
          v_name, v_tel, v_email, (p->>'agree_at')::timestamptz, v_idem, v_wpv_ok)
  returning id into v_id;

  foreach k in array v_svc loop
    insert into request_item (request_id, service_id)
    values (v_id, k)
    on conflict (request_id, service_id) do nothing;
  end loop;

  -- ⚠️ 감사 기록에 **성함 · 연락처를 넣지 않습니다.** 신청번호로 찾아갑니다.
  -- ⚠️⚠️ 바라시는 업체를 **비운 경우 그 사실을 남깁니다** — 조용히
  --   사라지면 "왜 그 업체로 안 갔나" 를 아무도 못 댑니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (auth.uid(), my_role(), 'request', v_no, 'new', '매칭 요청 접수',
          jsonb_build_object('services', v_svc, 'region', v_region,
                             'cat', nullif(btrim(coalesce(p->>'cat', '')), ''),
                             'wantProvider', v_wpv_ok,
                             'wantProviderDropped',
                             (v_wpv is not null and v_wpv_ok is null)));

  return v_no;
end $$;

revoke all on function make_request(jsonb) from public;
grant execute on function make_request(jsonb) to anon, authenticated;

insert into schema_version (n, name) values (35, '0035_want_provider')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0036_ad_membership_doors.sql ---------------------------- */
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

/* ---------------------------- 0037_review.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0037 — 후기 · 평점
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **평점을 칸에 저장하지 않습니다.** provider 표에 평점 칸이
--   없는 것은 0001 머리말이 일부러 적어 둔 것입니다 — 칸으로 두면
--   누군가 거기에 4.9 를 적어 넣고, 그 순간 지어낸 신뢰입니다
--   (절대 규칙 1 · 표시광고법 제3조). 평균과 건수는 **후기 줄에서
--   그때그때 셉니다.** 이 파일에도 집계 칸 · 집계 표가 없습니다.
--
-- ⚠️⚠️ **아무나 쓰면 후기가 아닙니다.** 상호만 알면 쓸 수 있게 두면
--   경쟁사가 별 하나를 깔고, 업체가 제 식구로 별 다섯을 깝니다. 그래서
--   **우리 DB 로 확인되는 두 가지** 중 하나가 있어야 엽니다 —
--     ① 그 업체의 견적을 **고르셨다** (quote.state = chosen)
--     ② 그 업체와 **만나셨다** (appointment.state = done)
--   둘 다 손님이 혼자 만들 수 없는 값입니다.
--   ⚠️ "상담만 받았는데 별로였다" 도 참말이지만, 우리는 그것을 확인할
--   길이 없습니다. 확인 못 하는 것을 받아 공개하면 그 글의 책임이
--   플랫폼으로 옵니다.
--
-- ⚠️⚠️ **한 요청 × 한 업체 = 한 줄입니다.** 여러 줄을 쌓게 두면 같은
--   분이 별 다섯을 열 번 적어 평균을 만듭니다. 고치는 것은 됩니다
--   (덮어씁니다) — 고친 기록은 audit_log 에 남습니다.
--
-- ⚠️⚠️ **작성자 성함을 공개 보기에 담지 않습니다.** 성 한 글자와
--   별표로 **그 자리에서 계산**합니다 (개인정보 보호법 제3조 제6항 —
--   익명 처리). 마스킹한 값을 칸에 저장하지 않습니다: 저장하면
--   원본과 어긋나는 날이 오고, 어느 쪽이 참인지 알 수 없습니다.
--
-- ⚠️⚠️ **지우는 길이 없습니다.** 운영자는 **가립니다**(hidden_at) —
--   지우면 업체가 "없는 말을 지웠다" 고 다툴 때 아무 기록이 없습니다.
--   가린 까닭은 반드시 받습니다.
--
-- ⚠️⚠️ **보기(view)는 RLS 를 지나지 않습니다** (0032 에서 겪은 자리).
--   그러니 v_review_public 의 where 절이 **자물쇠 그 자체**입니다 —
--   가린 후기 · 검사용 업체 · 공개 안 한 업체를 거기서 거릅니다.
--
-- ⚠️ 알림을 보내지 않습니다 — "후기가 달리면 알려 드립니다" 라고
--   **말하지 않습니다** (절대 규칙 5). 업체는 자기 작업실에서 봅니다.
-- ════════════════════════════════════════════════════════════════════
begin;

create table if not exists review (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references request(id) on delete cascade,
  provider_id text not null references provider(id) on delete cascade,
  -- ⚠️ 1~5 입니다. 0 과 6 을 막는 것은 check 가 하고, 사람 말로 거절하는
  --   것은 문(write_review)이 합니다 — enum 오류가 손님 화면에 나가면
  --   무엇이 틀렸는지 모릅니다.
  rating      smallint not null check (rating between 1 and 5),
  body        text not null,
  -- 누가 썼나 — ⚠️ 공개 보기에는 **안 나갑니다** (마스킹한 값만).
  --   임자를 가리는 데는 안 씁니다: is_my_request() 가 참입니다
  --   (계정이 지워져도 후기는 그 요청의 것입니다).
  by_user     uuid references auth.users(id) on delete set null,
  -- 업체의 답변 — 한 줄만 둡니다 (주고받는 자리가 아닙니다)
  reply       text,
  reply_at    timestamptz,
  -- 운영자가 가린 것 — ⚠️ 지우지 않습니다
  hidden_at   timestamptz,
  hidden_why  text,
  hidden_by   uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (request_id, provider_id),
  -- ⚠️ 열 글자 미만은 후기가 아닙니다 ("좋아요" 는 아홉 글자가 안 됩니다
  --   — 그래도 열 글자를 받는 까닭은, 한 글자 후기가 평균을 움직이는
  --   것을 막기 위해서입니다). 위는 천 글자입니다.
  constraint rv_body_len  check (char_length(btrim(body)) between 10 and 1000),
  constraint rv_reply_len check (reply is null or char_length(btrim(reply)) between 1 and 1000),
  -- ⚠️⚠️ 가렸으면 까닭이 **반드시** 있습니다. 문에서도 받고 여기서도
  --   봅니다 — 문이 내려가는 날 이 줄이 남습니다.
  constraint rv_hidden_why check (hidden_at is null or btrim(coalesce(hidden_why,'')) <> '')
);
create index if not exists rv_provider_idx on review (provider_id, created_at desc);

alter table review enable row level security;

-- ── 누가 보는가 ─────────────────────────────────────────────────────
-- ⚠️⚠️ 정책 안에서 request 를 바로 읽으면 무한 재귀입니다 (0005 · 0008 ·
--   0011 · 0034 에서 겪은 자리) — is_my_request() 로 끊습니다.
drop policy if exists rv_mine on review;
create policy rv_mine on review for select
  using (is_my_request(request_id));

-- 그 업체는 자기 후기를 봅니다 (가린 것까지 — 답변할 권리가 있습니다)
drop policy if exists rv_provider on review;
create policy rv_provider on review for select
  using (provider_id = my_provider());

drop policy if exists rv_staff on review;
create policy rv_staff on review for select
  using (my_role() in ('staff','admin'));

-- ⚠️⚠️⚠️ **"로그인한 아무나 가리지 않은 후기를 읽는다" 정책을 두지
--   않습니다.** 처음에 그렇게 썼는데, 그러면 로그인한 누구나 **표를
--   바로** 읽을 수 있고 표에는 보기에 없는 칸이 둘 있습니다 —
--   `by_user`(누가 썼는가)와 `request_id`(어느 신청인가). 후기 글은
--   공개지만 **누가 썼는지는 공개가 아닙니다** (개인정보 보호법).
--   공개로 읽는 길은 **아래 보기 하나**이고, 그 보기는 이름을
--   마스킹하고 그 두 칸을 아예 담지 않습니다.
--   ⚠️ 표를 읽는 사람은 셋뿐입니다: 쓴 사람 · 그 업체 · 운영자.

-- ⚠️⚠️ **쓰기 정책을 일부러 만들지 않았습니다.** RLS 는 정책이 없으면
--   막습니다 — 쓰는 길은 아래 문 셋뿐입니다 (0008 · 0034 와 같은 규칙).
grant select on review to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- 공개 보기 — 손님 화면 · tools/pull-reviews.js 가 읽습니다
--
-- ⚠️⚠️⚠️ **이 where 절이 자물쇠입니다.** 보기는 RLS 를 지나지 않습니다
--   (security_invoker 를 안 켰으니 임자 권한으로 돕니다). 0032 의
--   v_ad_live 가 바로 이 자리에서 검사용 업체의 상호를 내보내고
--   있었습니다.
-- ⚠️ request_id 를 담지 않습니다 — 후기와 신청번호를 이어 주면 누가
--   썼는지 좁혀집니다.
-- ⚠️ by_user 를 담지 않습니다. 이름은 **마스킹해서 계산**합니다.
-- ════════════════════════════════════════════════════════════════════
create or replace view v_review_public as
  select r.id, r.provider_id, r.rating, r.body,
         r.created_at, r.updated_at, r.reply, r.reply_at,
         -- 작성자 — 성 한 글자 + 별표. ⚠️ 저장하지 않고 **셉니다**.
         --   이름이 비어 있으면 "회원" 입니다 (별표만 찍으면 고장처럼
         --   보입니다).
         case
           when btrim(coalesce(a.name, '')) = '' then '회원'
           else left(btrim(a.name), 1) ||
                repeat('*', greatest(char_length(btrim(a.name)) - 1, 1))
         end as who
    from review r
    join provider p on p.id = r.provider_id
    left join account a on a.id = r.by_user
   where r.hidden_at is null
     and p.listed = true
     and p.is_test = false;

comment on view v_review_public is
  '손님 화면 · tools/pull-reviews.js 가 읽는 공개 후기. '
  'RLS 를 지나지 않으므로 where 절이 자물쇠입니다 (0037). '
  '평점 평균 · 건수는 담지 않습니다 — 줄에서 계산합니다.';

grant select on v_review_public to anon, authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ① 손님이 후기를 씁니다 · 고칩니다
--
-- ⚠️⚠️ 거절하는 말을 **자물쇠마다 다르게** 적습니다. 같은 말로 거절하면
--   어느 자물쇠가 막았는지 알 수 없고, 검사가 엉뚱한 까닭으로 통과합니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function write_review(p jsonb)
  returns uuid language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_pv   text := my_provider();
  v_req  uuid;
  v_pid  text := nullif(btrim(coalesce(p->>'provider', '')), '');
  v_rate int;
  v_body text := btrim(coalesce(p->>'body', ''));
  v_hid  timestamptz;
  v_was  smallint;
  v_id   uuid;
  v_ok   boolean;
begin
  if v_me is null then
    raise exception '후기는 로그인한 뒤에 쓰실 수 있습니다';
  end if;

  v_req := nullif(btrim(coalesce(p->>'request', '')), '')::uuid;
  if v_req is null then raise exception '어느 요청인지 적어 주세요'; end if;
  if v_pid is null then raise exception '어느 업체인지 적어 주세요'; end if;

  -- ⚠️⚠️ **내 요청인가.** coalesce 로 땅에 내려놓습니다 — NULL 이면
  --   if 가 안 걸려 자물쇠가 통째로 열립니다 (0034 에서 겪은 자리).
  if not coalesce(is_my_request(v_req), false) then
    raise exception '내 요청의 후기만 쓰실 수 있습니다';
  end if;

  -- ⚠️⚠️ **자기 업체에는 못 씁니다.** 업체 계정도 손님으로 요청을 넣을
  --   수 있으니 이 줄이 필요합니다 — 없으면 제 업체에 별 다섯입니다.
  if coalesce(v_pv = v_pid, false) then
    raise exception '자기 업체에는 후기를 쓸 수 없습니다';
  end if;

  -- ⚠️⚠️ **거래가 있었는가** — 우리 DB 로 확인되는 둘 중 하나입니다.
  select exists (select 1 from quote
                  where request_id = v_req and provider_id = v_pid
                    and state = 'chosen')
      or exists (select 1 from appointment
                  where request_id = v_req and provider_id = v_pid
                    and state = 'done')
    into v_ok;
  if not coalesce(v_ok, false) then
    raise exception '그 업체의 견적을 고르시거나 만나신 뒤에 후기가 열립니다';
  end if;

  -- ⚠️ 별점을 사람 말로 거절합니다. 숫자가 아닌 것이 오면 check 제약이
  --   아니라 여기서 멈춰야 합니다 (손님은 'violates check constraint'
  --   를 읽을 까닭이 없습니다).
  begin
    v_rate := (p->>'rating')::int;
  exception when others then
    v_rate := null;
  end;
  if v_rate is null or v_rate < 1 or v_rate > 5 then
    raise exception '별점을 1에서 5 사이로 골라 주세요';
  end if;

  if char_length(v_body) < 10 then
    raise exception '어떠셨는지 열 글자 이상 적어 주세요';
  end if;
  if char_length(v_body) > 1000 then
    raise exception '후기는 천 글자까지입니다';
  end if;

  -- ⚠️⚠️ **가린 후기는 고쳐서 되살릴 수 없습니다.** 고치면 가림이
  --   풀리게 두면 운영자가 가린 글이 다시 올라옵니다.
  select hidden_at, rating into v_hid, v_was from review
   where request_id = v_req and provider_id = v_pid;
  if v_hid is not null then
    raise exception '운영자가 가린 후기입니다 — 고객센터로 문의해 주세요';
  end if;

  insert into review (request_id, provider_id, rating, body, by_user, updated_at)
  values (v_req, v_pid, v_rate, v_body, v_me, now())
  on conflict (request_id, provider_id) do update
    -- ⚠️ 업체의 답변을 지우지 않습니다 — 후기를 고쳐도 답변은 그 업체의
    --   말이고, 지우는 것은 우리가 할 일이 아닙니다.
    set rating = excluded.rating, body = excluded.body,
        by_user = v_me, updated_at = now()
  returning id into v_id;

  -- ⚠️⚠️ 감사 기록에 **후기 본문 · 성함을 넣지 않습니다** — audit_log 는
  --   오래 남고 보는 사람도 넓습니다. 별점과 요청 id 로 찾아갑니다.
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, data)
  values (v_me, my_role(), 'review', v_id::text,
          coalesce(v_was::text, 'none'), v_rate::text,
          jsonb_build_object('request_id', v_req, 'provider_id', v_pid));
  return v_id;
end $$;

revoke all on function write_review(jsonb) from public;
grant execute on function write_review(jsonb) to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ② 업체가 답변합니다
--
-- ⚠️ 한 줄만 둡니다. 주고받게 두면 공개된 자리에서 다툼이 길어지고,
--   그 글의 책임은 플랫폼으로 옵니다.
-- ⚠️ 별점을 바꿀 길은 없습니다 (업체가 손댈 수 있으면 후기가 아닙니다).
-- ════════════════════════════════════════════════════════════════════
create or replace function reply_review(p jsonb)
  returns void language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_pv   text := my_provider();
  v_id   uuid;
  v_body text := btrim(coalesce(p->>'reply', ''));
  r      review%rowtype;
begin
  if v_me is null then raise exception '답변은 로그인한 뒤에 쓰실 수 있습니다'; end if;
  if my_role() <> 'provider' or v_pv is null then
    raise exception '후기 답변은 그 업체가 씁니다';
  end if;
  v_id := nullif(btrim(coalesce(p->>'id', '')), '')::uuid;
  if v_id is null then raise exception '어느 후기인지 적어 주세요'; end if;

  select * into r from review where id = v_id;
  if not found then raise exception '그런 후기가 없습니다'; end if;
  -- ⚠️⚠️ coalesce 가 없으면 NULL 로 빠져 자물쇠가 열립니다
  if not coalesce(r.provider_id = v_pv, false) then
    raise exception '우리 업체의 후기가 아닙니다';
  end if;
  if r.hidden_at is not null then
    raise exception '가려진 후기에는 답변할 수 없습니다';
  end if;
  if v_body = '' then raise exception '답변을 적어 주세요'; end if;
  if char_length(v_body) > 1000 then raise exception '답변은 천 글자까지입니다'; end if;

  update review set reply = v_body, reply_at = now(), updated_at = now()
   where id = v_id;

  -- ⚠️ 답변 본문을 감사 기록에 넣지 않습니다 (공개 자리에 이미 있습니다)
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, data)
  values (v_me, 'provider', 'review', v_id::text,
          case when r.reply is null then 'none' else 'reply' end, 'reply',
          jsonb_build_object('provider_id', v_pv));
end $$;

revoke all on function reply_review(jsonb) from public;
grant execute on function reply_review(jsonb) to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ③ 운영자가 가립니다 · 다시 냅니다
--
-- ⚠️⚠️ **가리는 까닭을 받습니다.** 까닭 없이 가릴 수 있으면 업체가
--   불평할 때마다 지워 주는 자리가 되고, 그러면 후기가 광고입니다.
-- ⚠️ 지우지 않습니다 — 되돌릴 수 있어야 다툼을 가릴 수 있습니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function hide_review(p jsonb)
  returns void language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_role app_role := my_role();
  v_id   uuid;
  v_to   text := nullif(btrim(coalesce(p->>'to', '')), '');
  v_why  text := nullif(btrim(coalesce(p->>'why', '')), '');
  r      review%rowtype;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if not coalesce(v_role in ('staff','admin'), false) then
    raise exception '후기를 가리는 것은 운영자만 할 수 있습니다';
  end if;
  v_id := nullif(btrim(coalesce(p->>'id', '')), '')::uuid;
  if v_id is null then raise exception '어느 후기인지 적어 주세요'; end if;
  if v_to not in ('hide','show') then
    raise exception '후기는 가리기 · 다시 내기로만 옮깁니다';
  end if;

  select * into r from review where id = v_id;
  if not found then raise exception '그런 후기가 없습니다'; end if;

  if v_to = 'hide' then
    if r.hidden_at is not null then raise exception '이미 가려진 후기입니다'; end if;
    if v_why is null then raise exception '가리시는 까닭을 적어 주세요'; end if;
    update review set hidden_at = now(), hidden_why = v_why, hidden_by = v_me,
                      updated_at = now()
     where id = v_id;
  else
    if r.hidden_at is null then raise exception '가려진 후기가 아닙니다'; end if;
    update review set hidden_at = null, hidden_why = null, hidden_by = null,
                      updated_at = now()
     where id = v_id;
  end if;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, v_role, 'review', v_id::text,
          case when r.hidden_at is null then 'shown' else 'hidden' end,
          case when v_to = 'hide' then 'hidden' else 'shown' end,
          v_why, jsonb_build_object('provider_id', r.provider_id));
end $$;

revoke all on function hide_review(jsonb) from public;
grant execute on function hide_review(jsonb) to authenticated;

insert into schema_version (n, name) values (37, '0037_review')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0038_provider_state.sql ---------------------------- */
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

/* ---------------------------- 0039_consent_revoke.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0039 — 요청 취소 · 제3자 제공 동의 **철회**
--        [3차 지시서 §5 · 개인정보 보호법 제37조 · 제17조 제2항]
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **철회할 길이 없었습니다.** 0029 가 "배정하는 순간 상호를
--   알리고 동의를 다시 받는다" 까지는 제대로 했는데, 그 뒤가 없습니다.
--   `assignment.agree3rd_at` 은 **언제 동의했나**만 적혀 있고
--   **아무 자물쇠도 그 칸을 보지 않습니다.**
--
--   업체가 손님 정보를 보는 길이 셋인데 전부 "배정 줄이 있는가" 만
--   봅니다 —
--     request_assigned  정책 (0001)  성함 · 연락처
--     is_my_item()      함수 (0009)  무엇을 요청했나
--     photo_provider    정책 (0011)  올린 사진 · 서류
--   즉 손님이 "그 업체에는 주지 마세요" 라고 할 방법이 없었고, 말해도
--   **업체는 계속 다 봤습니다.** 제37조(처리정지 요구권)가 걸리는
--   자리입니다.
--
-- ⚠️⚠️ **배정 줄을 지우지 않습니다.** 지우면 "준 적 없다" 가 되어
--   **넘어간 적이 있다는 기록 자체가 사라집니다.** 제공 이력은 손님이
--   확인할 수 있어야 하는 것이고(§5), 업체 쪽에도 왜 끊겼는지가
--   남아야 합니다. 그래서 **표시**합니다.
--
-- ⚠️⚠️ **일부러 안 끊는 것 둘 — 까닭이 있습니다.**
--   · 업체가 **이미 낸 견적**은 남습니다. 철회는 "앞으로 못 본다" 이지
--     "없던 일" 이 아닙니다. 손님도 받아 둔 견적을 계속 봅니다.
--   · **수수료 · 정산 기록**도 남습니다 (회계 · 세무 기록입니다).
--
-- ⚠️⚠️ **덮어쓰는 것 셋** — 앞 번호를 다시 붙여 넣으면 조용히 내려갑니다:
--     request_assigned 정책   0001 → **0039**
--     is_my_item()            0009 → **0039**
--     photo_provider 정책     0011 → **0039**
--   내려갔는지 보는 법:
--     select pg_get_functiondef('is_my_item(uuid)'::regprocedure)
--            like '%revoked_at%';     -- false 면 0009 판입니다
-- ════════════════════════════════════════════════════════════════════
begin;

alter table assignment add column if not exists revoked_at  timestamptz;
alter table assignment add column if not exists revoked_why text;

create index if not exists assign_revoked_idx on assignment (request_id, revoked_at);

-- ⚠️ 철회에는 **까닭을 받습니다** — 업체가 왜 끊겼는지 알아야 하고,
--   나중에 다툼이 생기면 그 글이 기록입니다.
do $$ begin
  alter table assignment add constraint assign_revoked_why_ck
    check (revoked_at is null or btrim(coalesce(revoked_why,'')) <> '');
exception when duplicate_object then null; end $$;


-- ════════════════════════════════════════════════════════════════════
-- ① 업체가 보는 길 셋을 **전부** 좁힙니다
--
-- ⚠️⚠️ 셋을 **각각** 고칩니다. 하나만 고치면 나머지 둘로 계속 봅니다 —
--   성함을 못 봐도 사진으로 알 수 있고, 사진을 못 봐도 요청 내용으로
--   알 수 있습니다. 끊으려면 다 끊어야 합니다.
-- ════════════════════════════════════════════════════════════════════
drop policy if exists request_assigned on request;
create policy request_assigned on request for select using (
  exists (select 1 from assignment a
          where a.request_id = request.id
            and a.provider_id = my_provider()
            and a.revoked_at is null)
);

create or replace function is_my_item(iid uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from assignment a
                  where a.item_id = iid
                    and a.provider_id = my_provider()
                    and a.revoked_at is null)
$$;
revoke all on function is_my_item(uuid) from public;
grant execute on function is_my_item(uuid) to authenticated;

drop policy if exists photo_provider on request_photo;
create policy photo_provider on request_photo for select
  using (my_provider() is not null and exists (
    select 1 from assignment a
     where a.request_id = request_photo.request_id
       and a.provider_id = my_provider()
       and a.revoked_at is null));


-- ════════════════════════════════════════════════════════════════════
-- ② 철회한 업체는 **새 견적 · 새 일정도 못 냅니다**
--
-- ⚠️ `submit_quote`(0008) · `set_appointment`(0034)를 고치지 않습니다 —
--   긴 함수를 덮어쓰면 앞 번호를 다시 붙여 넣는 날 이 자물쇠가 조용히
--   내려갑니다 (0038 에서 쓴 방식 그대로). 표에 트리거를 답니다.
-- ⚠️⚠️ **넣을 때만** 봅니다. 손님이 이미 받은 견적을 고르는 것(update)
--   까지 막으면, 철회했다고 손님이 받아 둔 견적이 잠깁니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function assign_not_revoked() returns trigger
  language plpgsql security definer set search_path = public as $$
declare rv timestamptz;
begin
  select revoked_at into rv from assignment
   where request_id = new.request_id and provider_id = new.provider_id;
  if rv is not null then
    raise exception '손님이 이 업체로의 정보 제공을 철회했습니다 — 더 진행할 수 없습니다';
  end if;
  return new;
end $$;

drop trigger if exists quote_not_revoked_t on quote;
create trigger quote_not_revoked_t before insert on quote
  for each row execute function assign_not_revoked();

drop trigger if exists appt_not_revoked_t on appointment;
create trigger appt_not_revoked_t before insert on appointment
  for each row execute function assign_not_revoked();


-- ════════════════════════════════════════════════════════════════════
-- ③ 문 — 손님이 **철회**합니다
--
-- ⚠️⚠️ 손님만입니다. 운영자가 대신 철회하면 "손님이 원해서" 인지
--   "운영자가 치워서" 인지 기록에서 갈리지 않습니다.
-- ⚠️ 이미 철회한 것을 또 철회하면 **다른 말로** 거절합니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function revoke_third_party(p jsonb)
  returns void language plpgsql security definer
  set search_path = public as $$
declare
  v_me  uuid := auth.uid();
  v_id  uuid := nullif(btrim(coalesce(p->>'assignment', '')), '')::uuid;
  v_why text := nullif(btrim(coalesce(p->>'why', '')), '');
  r     assignment%rowtype;
begin
  if v_me is null then raise exception '철회는 로그인한 뒤에 하실 수 있습니다'; end if;
  if v_id is null then raise exception '어느 업체로의 제공을 철회하실지 적어 주세요'; end if;

  select * into r from assignment where id = v_id;
  if not found then raise exception '그런 제공 기록이 없습니다'; end if;
  -- ⚠️⚠️ coalesce 로 땅에 내려놓습니다 — NULL 이면 if 가 안 걸려
  --   자물쇠가 통째로 열립니다 (0034 에서 겪은 자리).
  if not coalesce(is_my_request(r.request_id), false) then
    raise exception '내 요청의 제공만 철회할 수 있습니다';
  end if;
  if r.revoked_at is not null then
    raise exception '이미 철회하셨습니다';
  end if;
  if v_why is null then
    raise exception '철회하시는 까닭을 적어 주세요 (업체가 왜 끊겼는지 알아야 합니다)';
  end if;

  update assignment set revoked_at = now(), revoked_why = v_why where id = v_id;

  -- ⚠️ 감사 기록에 **성함 · 연락처를 안 넣습니다** — 요청 id 로 찾아갑니다.
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, my_role(), 'assignment', v_id::text, r.state, 'revoked', v_why,
          jsonb_build_object('request_id', r.request_id, 'provider_id', r.provider_id));
end $$;

revoke all on function revoke_third_party(jsonb) from public;
grant execute on function revoke_third_party(jsonb) to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ④ 문 — 손님이 **요청을 취소**합니다
--
-- ⚠️⚠️ **이미 계약 단계면 막습니다.** 업체가 일을 시작했을 수 있고,
--   그때 손님이 혼자 취소하면 그 다툼을 플랫폼이 떠안습니다 —
--   담당자를 거치게 합니다. 화면도 그렇게 말합니다.
-- ⚠️ 취소는 `move_state`(0004→0007)의 길을 쓰지 않습니다. 그 문은
--   **운영자용**이고 전이표(deal_move)를 따릅니다 — 손님이 쓰는 길은
--   따로 두는 것이 맞습니다 (권한이 다릅니다).
-- ⚠️⚠️ 취소해도 **배정 · 견적을 지우지 않습니다.** 기록입니다.
--   다만 취소하면 **제공도 전부 철회**됩니다 — 요청을 거둔 손님의
--   연락처를 업체가 계속 볼 까닭이 없습니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function cancel_request(p jsonb)
  returns void language plpgsql security definer
  set search_path = public as $$
declare
  v_me  uuid := auth.uid();
  v_id  uuid := nullif(btrim(coalesce(p->>'request', '')), '')::uuid;
  v_why text := nullif(btrim(coalesce(p->>'why', '')), '');
  r     request%rowtype;
  n     int;
begin
  if v_me is null then raise exception '취소는 로그인한 뒤에 하실 수 있습니다'; end if;
  if v_id is null then raise exception '어느 요청인지 적어 주세요'; end if;

  select * into r from request where id = v_id;
  if not found then raise exception '그런 요청이 없습니다'; end if;
  if not coalesce(is_my_request(v_id), false) then
    raise exception '내 요청만 취소할 수 있습니다';
  end if;
  if r.state = 'lost' then raise exception '이미 취소된 요청입니다'; end if;
  -- ⚠️⚠️ 계약 뒤에는 혼자 못 거둡니다 — 거절하는 말이 **무엇을 하라고**
  --   말해 줍니다 (막다른 길로 두지 않습니다).
  if r.state in ('signed','done','fee_wait','fee_done') then
    raise exception '이미 진행 중인 건이라 혼자 취소할 수 없습니다 — 고객센터로 알려 주세요';
  end if;
  if v_why is null then
    raise exception '취소하시는 까닭을 적어 주세요';
  end if;

  update request set state = 'lost' where id = v_id;

  -- ⚠️ 넘어가 있던 제공을 **전부** 거둡니다 (이미 철회한 것은 그대로).
  update assignment
     set revoked_at = now(),
         revoked_why = '손님이 요청을 취소했습니다'
   where request_id = v_id and revoked_at is null;
  get diagnostics n = row_count;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, my_role(), 'request', v_id::text, r.state::text, 'lost', v_why,
          jsonb_build_object('revoked', n));
end $$;

revoke all on function cancel_request(jsonb) from public;
grant execute on function cancel_request(jsonb) to authenticated;

insert into schema_version (n, name) values (39, '0039_consent_revoke')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0040_report.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0040 — 신고 · 분쟁  [3차 지시서 §6 · §8 · §9 abuse_reports]
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **`deal_state` enum 에 'disputed' 를 더하지 않았습니다 —
--   일부러입니다.** 까닭 둘:
--
--   ① **터집니다.** `alter type ... add value` 로 더한 값은 **같은
--      트랜잭션에서 쓸 수 없습니다.** 우리 마이그레이션은 전부
--      `begin; … commit;` 으로 감싸여 있어서, 그 안에서 더하고 바로
--      쓰면 `unsafe use of new value` 로 멈춥니다. 임시 Postgres 에
--      실제로 돌려 보고 확인했습니다. 트랜잭션 밖으로 빼면 되지만,
--      사장님은 `db/apply-from-0008.sql` 을 **통째로** 붙여 넣으시고
--      그 편집기가 전체를 한 트랜잭션으로 감싸는지 저희는 모릅니다.
--      **모르는 것에 기대지 않습니다.**
--
--   ② **더 중요한 까닭 — 분쟁은 단계가 아닙니다.** 상태로 만들면
--      `signed` 였는지 `done` 이었는지가 **덮여서 사라집니다.** 분쟁은
--      어느 단계에서든 열릴 수 있고, 풀리면 원래 단계로 돌아가야
--      합니다. 그래서 **따로 적습니다** (3차 지시서 §6 은 상태로
--      적었지만, 우리 deal_state 가 그보다 자세해서 그렇습니다 —
--      AUDIT.md 에 적어 두었습니다).
--
-- ⚠️⚠️ **신고와 분쟁을 한 표에 둡니다.** 둘 다 "누가 · 무엇을 ·
--   왜 · 어떻게 끝났나" 이고, 관리자는 한 자리에서 봅니다 (§8).
--   `kind` 로 가릅니다.
--
-- ⚠️ **지우지 않습니다.** 신고를 지우면 "신고한 적 없다" 가 됩니다.
--   끝난 것은 state 로 표시합니다.
-- ════════════════════════════════════════════════════════════════════
begin;

create table if not exists report (
  id          uuid primary key default gen_random_uuid(),
  -- abuse  신고 (욕설 · 허위 · 광고 등)
  -- dispute 분쟁 (거래가 틀어졌습니다)
  kind        text not null check (kind in ('abuse','dispute')),
  -- ⚠️ 무엇에 대한 것인가 — 셋 가운데 **적어도 하나**는 있어야 합니다.
  --   셋 다 비면 무엇을 신고한 것인지 알 수 없습니다.
  request_id  uuid references request(id)  on delete cascade,
  provider_id text references provider(id) on delete cascade,
  review_id   uuid references review(id)   on delete cascade,
  by_user     uuid references auth.users(id) on delete set null,
  body        text not null,
  state       text not null default 'open'
              check (state in ('open','reviewing','resolved','rejected')),
  -- 어떻게 끝났나 — ⚠️ 끝낼 때는 반드시 적습니다
  resolution  text,
  closed_at   timestamptz,
  closed_by   uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint report_target_ck check (
    request_id is not null or provider_id is not null or review_id is not null),
  constraint report_body_ck check (char_length(btrim(body)) between 5 and 2000),
  -- ⚠️⚠️ 끝난 것에는 **까닭이 반드시** 있습니다. 문에서도 받고 여기서도
  --   봅니다 — 문이 내려가는 날 이 줄이 남습니다.
  constraint report_resolution_ck check (
    state not in ('resolved','rejected')
    or btrim(coalesce(resolution,'')) <> '')
);
create index if not exists report_state_idx on report (state, created_at desc);
create index if not exists report_target_idx on report (provider_id, request_id);

alter table report enable row level security;

-- ── 누가 보는가 ─────────────────────────────────────────────────────
-- ⚠️⚠️ **신고한 사람은 제 신고만 봅니다.** 남의 신고가 보이면 누가
--   누구를 신고했는지 드러납니다 — 그 자체가 분쟁의 씨앗입니다.
drop policy if exists report_mine on report;
create policy report_mine on report for select
  using (by_user = auth.uid());

drop policy if exists report_staff on report;
create policy report_staff on report for select
  using (my_role() in ('staff','admin'));

-- ⚠️⚠️ **업체는 제게 들어온 신고를 못 봅니다.** 보면 신고한 손님을
--   찾아갑니다. 운영자가 걸러서 전합니다 — 그게 중개자가 할 일입니다.
-- ⚠️ 쓰기 정책을 일부러 안 만들었습니다 — 문 둘만 엽니다.
grant select on report to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ① 문 — 신고 · 분쟁을 엽니다
--
-- ⚠️ 로그인한 사람만입니다. 익명 신고를 받으면 경쟁사가 하루에 백 건을
--   넣습니다 — 받을 수는 있어도 **누가 넣었는지는 알아야** 합니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function open_report(p jsonb)
  returns uuid language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_kind text := coalesce(nullif(btrim(p->>'kind'), ''), 'abuse');
  v_req  uuid := nullif(btrim(coalesce(p->>'request', '')), '')::uuid;
  v_pv   text := nullif(btrim(coalesce(p->>'provider', '')), '');
  v_rv   uuid := nullif(btrim(coalesce(p->>'review', '')), '')::uuid;
  v_body text := btrim(coalesce(p->>'body', ''));
  v_id   uuid;
  v_dup  int;
begin
  if v_me is null then raise exception '신고는 로그인한 뒤에 하실 수 있습니다'; end if;
  if v_kind not in ('abuse','dispute') then
    raise exception '신고 · 분쟁 중 하나로 적어 주세요';
  end if;
  if v_req is null and v_pv is null and v_rv is null then
    raise exception '무엇에 대한 것인지 적어 주세요 (요청 · 업체 · 후기 가운데 하나)';
  end if;
  if char_length(v_body) < 5 then
    raise exception '무슨 일이 있었는지 다섯 글자 이상 적어 주세요';
  end if;
  if char_length(v_body) > 2000 then
    raise exception '신고 내용은 이천 글자까지입니다';
  end if;

  -- ⚠️⚠️ **분쟁은 그 요청의 당사자만** 엽니다. 아무나 "저 거래가
  --   이상합니다" 라고 열 수 있으면 분쟁이 아니라 신고입니다.
  if v_kind = 'dispute' then
    if v_req is null then raise exception '분쟁은 어느 요청인지 적어야 합니다'; end if;
    if not (coalesce(is_my_request(v_req), false)
            or coalesce(exists (select 1 from assignment a
                                 where a.request_id = v_req
                                   and a.provider_id = my_provider()), false)
            or coalesce(my_role() in ('staff','admin'), false)) then
      raise exception '그 거래의 당사자만 분쟁을 열 수 있습니다';
    end if;
  end if;

  -- ⚠️⚠️ **같은 것을 두 번 열지 않습니다.** 누르는 손이 미끄러지면
  --   같은 신고가 둘이 되고, 운영자는 그것을 두 번 읽습니다.
  select count(*) into v_dup from report
   where by_user = v_me and kind = v_kind and state in ('open','reviewing')
     and request_id is not distinct from v_req
     and provider_id is not distinct from v_pv
     and review_id is not distinct from v_rv;
  if v_dup > 0 then
    raise exception '같은 건으로 이미 접수된 것이 있습니다 — 운영자가 보고 있습니다';
  end if;

  insert into report (kind, request_id, provider_id, review_id, by_user, body)
  values (v_kind, v_req, v_pv, v_rv, v_me, v_body)
  returning id into v_id;

  -- ⚠️ 감사 기록에 **신고 본문을 넣지 않습니다** — audit_log 는 오래
  --   남고 보는 사람도 넓습니다. 번호로 찾아갑니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'report', v_id::text, 'open',
          jsonb_build_object('kind', v_kind));
  return v_id;
end $$;

revoke all on function open_report(jsonb) from public;
grant execute on function open_report(jsonb) to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ② 문 — 운영자가 처리합니다
--
-- ⚠️⚠️ **끝낼 때는 어떻게 끝났는지 반드시 적습니다** (§8 의 "승인 ·
--   거절 사유 필수"). 까닭 없이 닫을 수 있으면, 신고함은 쌓이기만
--   하는 자리가 됩니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function move_report(p jsonb)
  returns void language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_role app_role := my_role();
  v_id   uuid := nullif(btrim(coalesce(p->>'id', '')), '')::uuid;
  v_to   text := nullif(btrim(coalesce(p->>'to', '')), '');
  v_res  text := nullif(btrim(coalesce(p->>'resolution', '')), '');
  r      report%rowtype;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if not coalesce(v_role in ('staff','admin'), false) then
    raise exception '신고 처리는 운영자만 할 수 있습니다';
  end if;
  if v_id is null then raise exception '어느 신고인지 적어 주세요'; end if;
  if v_to not in ('reviewing','resolved','rejected') then
    raise exception '신고는 확인 중 · 처리됨 · 반려로만 옮깁니다';
  end if;

  select * into r from report where id = v_id;
  if not found then raise exception '그런 신고가 없습니다'; end if;
  if r.state = v_to then raise exception '이미 %입니다', v_to; end if;
  if r.state in ('resolved','rejected') then
    raise exception '이미 끝난 신고입니다';
  end if;
  if v_to in ('resolved','rejected') and v_res is null then
    raise exception '어떻게 처리하셨는지 적어 주세요';
  end if;

  update report set
    state      = v_to,
    resolution = case when v_to in ('resolved','rejected') then v_res else resolution end,
    closed_at  = case when v_to in ('resolved','rejected') then now() else null end,
    closed_by  = case when v_to in ('resolved','rejected') then v_me else null end,
    updated_at = now()
   where id = v_id;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why)
  values (v_me, v_role, 'report', v_id::text, r.state, v_to, v_res);
end $$;

revoke all on function move_report(jsonb) from public;
grant execute on function move_report(jsonb) to authenticated;

insert into schema_version (n, name) values (40, '0040_report')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0041_rate_limit.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0041 — 쏟아붓기 막기 · **하루 한도**  [3차 지시서 §5 · §10]
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **처음에 적은 "10분에 다섯 건" 은 거짓이었습니다 — 지웠습니다.**
--   0029 가 이미 **같은 번호로 10분에 한 건**만 받습니다
--   ("방금 같은 번호로 요청이 들어왔습니다"). 그 위에 "10분에 다섯"
--   을 얹으면 **영원히 안 걸리는 자물쇠**입니다 — 검사는 초록이고
--   다음 차수는 그것을 자물쇠로 읽습니다 (작업 기억의 "만들어 놓고
--   안 쓰는 칸" 그 자리입니다).
--   ⚠️ **남은 틈은 "하루"** 였습니다: 10분에 한 건이면 **하루에
--   144건**이고, 아무것도 그것을 안 막았습니다. 여기서 막는 것은
--   그 하나입니다 — **하루 20건**.
--
-- ⚠️⚠️ **무엇으로 세는가.** 로그인 없이 들어오므로 user_id 가 비어
--   있습니다. 그래서 **연락처의 숫자만** 으로 셉니다 (`v_digits`) —
--   `tel` 날것으로 세면 `010-1111-2222` 와 `01011112222` 가 **다른
--   사람**이 되어 한도가 조용히 두 배가 됩니다.
--   ⚠️ IP 로 세지 않습니다: 우리는 IP 를 **받지도 저장하지도** 않고,
--   받기 시작하면 그날부터 개인정보 처리 항목이 하나 늘어 방침을
--   같이 고쳐야 합니다 (제15조 제2항). 막자고 더 받는 것은 거꾸로입니다.
--   ⚠️⚠️ **그래서 번호를 바꿔 가며 넣는 것은 못 막습니다.** 막는 척
--   하지 않습니다 — 그 자리는 운영자가 신고(0040)로 봅니다.
--
-- ⚠️⚠️ **경계값을 넉넉히 둡니다.** 레슨 · 피팅 · 부킹을 잇따라 넣는
--   것은 **정상**입니다 (너무 좁게 막는 것도 고장입니다). 10분에 한
--   건씩이면 하루 20건은 **세 시간 반**을 꼬박 넣은 것입니다.
--
-- ⚠️⚠️ **`make_request` 를 덮어씁니다** — 체인이 길어집니다:
--     make_request  0029 → 0035 → **0041**
--   0029 나 0035 를 다시 붙여 넣으면 이 자물쇠가 **조용히 내려갑니다.**
--   내려갔는지 보는 법:
--     select pg_get_functiondef('make_request(jsonb)'::regprocedure)
--            like '%하루에 보내실%';     -- false 면 옛 판입니다
--
-- ⚠️ 함수 본문은 0035 것을 **그대로 떠서** 블록 하나만 끼웠습니다
--   (손으로 옮겨 적으면 다음 함수를 통째로 삼킵니다).
-- ════════════════════════════════════════════════════════════════════
begin;

-- ⚠️ 세는 식(`숫자만`)과 **똑같은 꼴**로 색인을 만듭니다 — 날것 tel 에
--   걸면 이 질의도 · 0029 의 겹침 검사도 못 씁니다.
create index if not exists request_digits_time_idx
  on request (regexp_replace(tel, '[^0-9]', '', 'g'), created_at desc);

create or replace function make_request(p jsonb)
  returns text language plpgsql security definer set search_path = public as $$
declare
  v_name  text := btrim(coalesce(p->>'name', ''));
  v_tel   text := btrim(coalesce(p->>'tel', ''));
  v_email text := nullif(btrim(coalesce(p->>'email', '')), '');
  v_region text := nullif(btrim(coalesce(p->>'region', '')), '');
  v_gu    text := nullif(btrim(coalesce(p->>'gu', '')), '');
  v_want  text := nullif(btrim(coalesce(p->>'want_at', '')), '');
  v_body  text := nullif(btrim(coalesce(p->>'body', '')), '');
  v_idem  text := nullif(btrim(coalesce(p->>'idem', '')), '');
  v_bmin  bigint := nullif(p->>'budget_min', '')::bigint;
  v_bmax  bigint := nullif(p->>'budget_max', '')::bigint;
  -- ⚠️ 0035 — 손님이 보고 오신 업체 (바람이지 배정이 아닙니다)
  v_wpv   text := nullif(btrim(coalesce(p->>'wantProvider', '')), '');
  v_wpv_ok text;
  v_svc   text[] := coalesce(
             (select array_agg(distinct btrim(x)) from jsonb_array_elements_text(
                case when jsonb_typeof(p->'services') = 'array'
                     then p->'services' else '[]'::jsonb end) as t(x)
              where btrim(x) <> ''), '{}'::text[]);
  v_digits text;
  v_no     text;
  v_id     uuid;
  v_try    int := 0;
  v_abc    text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  v_raw    text;
  k        text;
begin
  -- ⚠️ 자물쇠마다 **다른 말**로 거절합니다.
  if v_name = '' then raise exception '성함을 적어 주세요'; end if;
  if v_tel  = '' then raise exception '연락처를 적어 주세요'; end if;
  if length(v_name) > 40 then raise exception '성함이 너무 깁니다'; end if;
  if v_body is not null and length(v_body) > 2000 then
    raise exception '남기신 말씀이 너무 깁니다';
  end if;

  v_digits := regexp_replace(v_tel, '[^0-9]', '', 'g');
  -- ⚠️ 경계값: 9자리(02-xxx-xxxx)부터 11자리(010-xxxx-xxxx)까지입니다.
  if length(v_digits) < 9 or length(v_digits) > 11 then
    raise exception '연락처를 다시 봐 주세요 — 숫자 아홉에서 열한 자리입니다';
  end if;

  if array_length(v_svc, 1) is null then
    raise exception '원하시는 서비스를 하나 이상 골라 주세요';
  end if;
  if array_length(v_svc, 1) > 10 then
    raise exception '고르신 서비스가 너무 많습니다 — 열 개까지입니다';
  end if;

  -- ⚠️ 예산은 **0 도 값입니다** (무료 상담). 음수와 뒤집힌 것만 막습니다.
  if v_bmin is not null and v_bmin < 0 then raise exception '예산은 0 보다 작을 수 없습니다'; end if;
  if v_bmax is not null and v_bmax < 0 then raise exception '예산은 0 보다 작을 수 없습니다'; end if;
  if v_bmin is not null and v_bmax is not null and v_bmin > v_bmax then
    raise exception '예산의 아래가 위보다 큽니다';
  end if;

  if (p->>'agree_at') is null then
    raise exception '수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes' then
    raise exception '동의 시각이 미래입니다';
  end if;
  if (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의가 오래되었습니다 — 다시 한 번 눌러 주세요';
  end if;

  -- ⚠️⚠️ **같은 요청을 두 번 넣는 것을 두 겹으로 막습니다.**
  --   ① idem — 화면이 한 번 연 동안 하나입니다 (두 번 눌러도 하나)
  --   ② 같은 번호로 10분 안
  if v_idem is not null then
    select id, no into v_id, v_no from request where idem = v_idem;
    if v_id is not null then return v_no; end if;   -- 이미 들어간 것입니다
  end if;
  if exists (
    select 1 from request
     where regexp_replace(tel, '[^0-9]', '', 'g') = v_digits
       and created_at > now() - interval '10 minutes')
  then
    raise exception '방금 같은 번호로 요청이 들어왔습니다 — 잠시 뒤에 다시 해 주세요';
  end if;

  -- ⚠️⚠️ **하루 한도 (0041).** 위가 10분을 막고, 여기가 하루를 막습니다.
  --   ⚠️ 표에 트리거로 달아 봤다가 되돌렸습니다 — 이 함수가 SECURITY
  --   DEFINER 라 트리거 안에서는 **씨앗을 넣는 운영자와 손님이 똑같이
  --   보입니다.** 가를 수가 없어 멀쩡한 지표 검사가 깨졌습니다.
  --   그리고 `request` 표에는 insert 정책도 GRANT 도 **없습니다** —
  --   손님이 넣는 길은 이 문 하나뿐이라, 자물쇠도 여기 있어야 합니다.
  --   ⚠️ 거절하는 말이 **어디로 가라**고 말해 줍니다 (막다른 길 금지).
  if (select count(*) from request
       where regexp_replace(tel, '[^0-9]', '', 'g') = v_digits
         and created_at > now() - interval '24 hours') >= 20 then
    raise exception '하루에 보내실 수 있는 요청 수를 넘었습니다 — 고객센터로 알려 주세요';
  end if;

  -- ⚠️⚠️ **바라시는 업체가 실제로 있는가.** 없으면 **비우고 넘어갑니다** —
  --   묵은 링크 때문에 손님의 요청이 통째로 막히면 안 됩니다.
  --   ⚠️ 검사용 업체는 안 받습니다 (손님 화면에 나간 적이 없는 업체입니다).
  if v_wpv is not null then
    select id into v_wpv_ok from provider
     where id = v_wpv and listed = true and is_test = false;
  end if;

  -- 번호 — 겹치면 다시 뽑습니다 (스무 번까지)
  loop
    v_try := v_try + 1;
    v_raw := '';
    for i in 1..8 loop
      v_raw := v_raw || substr(v_abc, 1 + floor(random() * length(v_abc))::int, 1);
    end loop;
    v_no := 'SW-' || substring(v_raw from 1 for 4) || '-' || substring(v_raw from 5 for 4);
    exit when not exists (select 1 from request where no = v_no);
    if v_try > 20 then raise exception '신청번호를 만들지 못했습니다'; end if;
  end loop;

  insert into request (no, user_id, side, cat, region, gu,
                       budget_min, budget_max, want_at, body,
                       name, tel, email, agree_at, idem, want_provider)
  values (v_no, auth.uid(), 'golf',
          -- ⚠️ 분류는 **첫 서비스가 속한 분류**를 화면이 적어 보냅니다.
          nullif(btrim(coalesce(p->>'cat', '')), ''),
          v_region, v_gu, v_bmin, v_bmax, v_want, v_body,
          v_name, v_tel, v_email, (p->>'agree_at')::timestamptz, v_idem, v_wpv_ok)
  returning id into v_id;

  foreach k in array v_svc loop
    insert into request_item (request_id, service_id)
    values (v_id, k)
    on conflict (request_id, service_id) do nothing;
  end loop;

  -- ⚠️ 감사 기록에 **성함 · 연락처를 넣지 않습니다.** 신청번호로 찾아갑니다.
  -- ⚠️⚠️ 바라시는 업체를 **비운 경우 그 사실을 남깁니다** — 조용히
  --   사라지면 "왜 그 업체로 안 갔나" 를 아무도 못 댑니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (auth.uid(), my_role(), 'request', v_no, 'new', '매칭 요청 접수',
          jsonb_build_object('services', v_svc, 'region', v_region,
                             'cat', nullif(btrim(coalesce(p->>'cat', '')), ''),
                             'wantProvider', v_wpv_ok,
                             'wantProviderDropped',
                             (v_wpv is not null and v_wpv_ok is null)));

  return v_no;
end $$;
revoke all on function make_request(jsonb) from public;
grant execute on function make_request(jsonb) to anon, authenticated;

insert into schema_version (n, name) values (41, '0041_rate_limit')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0042_provider_price.sql ---------------------------- */
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

/* ---------------------------- 0043_provider_invite.sql ---------------------------- */
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

/* ---------------------------- 0044_contact_ways.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0044 — 업체가 **스스로 고치는 것**에 상담 방식을 더합니다
--        [4차 지시서 §2-4 · §2-6 · §2-7 · §3]
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️ **상담 방식이 없었습니다.** `consult_hours`(언제)는 있는데
--   **어떻게**(전화 · 방문 · 온라인 · 매장)가 없었습니다. 손님이
--   "방문해야 하나" 를 모른 채 요청을 넣고, 업체는 전화로 그것부터
--   묻습니다.
--   ⚠️ 글자로 받지 않고 **정해진 넷**으로 받습니다 — 자유 입력이면
--   "전화"· "전화상담" · "유선" 이 섞여서 나중에 거르개를 달 수가
--   없습니다 (지역을 글자로 받아 겪은 자리).
--
-- ⚠️⚠️ **`save_provider_self` 를 덮어씁니다** — 체인이 길어집니다:
--     save_provider_self  0014 → 0023 → **0044**
--   0014 나 0023 을 다시 붙여 넣으면 상담 방식이 **조용히 안 저장
--   됩니다** (에러는 안 납니다). 내려갔는지 보는 법:
--     select pg_get_functiondef('save_provider_self(jsonb,text)'::regprocedure)
--            like '%contact_ways%';     -- false 면 옛 판입니다
--
-- ⚠️⚠️⚠️ **이 문은 보낸 것으로 통째로 덮어씁니다** (coalesce 로 지키지
--   않습니다). 화면이 칸 하나를 빠뜨리고 보내면 그 칸이 **빈 값으로
--   지워집니다** — 지역을 안 보내면 그 업체가 지역 거르개에서 통째로
--   사라집니다. 화면은 **읽은 값을 전부 다시 담아** 보내야 합니다.
--   (고치지 않는 까닭: 비우는 길도 있어야 합니다. "안 보냄" 과
--   "비움" 을 가르려면 칸마다 보냈는지를 봐야 하는데, 그러면 이 문이
--   두 배로 길어지고 틀리기 쉬운 자리가 늘어납니다.)
--
-- ⚠️ 업체가 **여전히 못 건드리는 것**은 그대로입니다 — 상호 · 하는
--   일(subs) · 확인 배지 · 공개 · 배정 가능 · 주소(id) · 상태.
--   하는 일을 스스로 넓히면 수거만 하는 곳이 수리 화면에 앉습니다.
-- ════════════════════════════════════════════════════════════════════
begin;

alter table provider add column if not exists contact_ways text[] not null default '{}';

-- ⚠️ 정해진 넷만 — 모르는 값을 조용히 넣지 않습니다
do $$ begin
  alter table provider add constraint provider_contact_ways_ck
    check (contact_ways <@ array['phone','visit','online','shop']::text[]);
exception when duplicate_object then null; end $$;

comment on column provider.contact_ways is
  '상담 방식 — phone(전화) · visit(방문) · online(온라인) · shop(매장 방문). 말은 js/data/providers.js 한 곳';

create or replace function save_provider_self(
  p_data jsonb default '{}'::jsonb,   -- intro · regions · gu · industries · since · consultHours · brands · scale
  p_why  text  default null
) returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_pv   text     := my_provider();
  v_scale text    := nullif(btrim(coalesce(p_data->>'scale','')), '');
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  -- ⚠️⚠️ 역할을 요청에서 읽지 않습니다 — 토큰으로 `account` 를 보고
  --   거기 적힌 `provider_id` 만 고칩니다. 남의 업체는 애초에 못 집습니다.
  if v_role <> 'provider' or v_pv is null then
    raise exception '업체 계정으로 로그인하셔야 합니다';
  end if;
  if not exists (select 1 from provider where id = v_pv) then
    raise exception '연결된 업체를 찾을 수 없습니다';
  end if;
  if v_scale is not null and v_scale not in ('small','mid','large') then
    raise exception '거래 규모는 small · mid · large 중 하나입니다 — %', v_scale;
  end if;
  -- ⚠️⚠️ **상담 방식 (0044)** — 정해진 넷만 받습니다. 모르는 값이
  --   오면 **조용히 버리지 않고** 거절합니다 (조용히 버리면 업체는
  --   저장된 줄 알고, 손님 화면에는 안 나옵니다).
  if exists (
    select 1 from jsonb_array_elements_text(
      case when jsonb_typeof(p_data->'contactWays') = 'array'
           then p_data->'contactWays' else '[]'::jsonb end) as t(x)
     where btrim(x) not in ('phone','visit','online','shop'))
  then
    raise exception '상담 방식은 전화 · 방문 · 온라인 · 매장 중에서 고르셔야 합니다';
  end if;

  update provider set
    intro = nullif(btrim(coalesce(p_data->>'intro','')), ''),
    regions = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'regions','[]'::jsonb)) x), '{}'),
    gu = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'gu','[]'::jsonb)) x), '{}'),
    industries = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'industries','[]'::jsonb)) x), '{}'),
    since = nullif(p_data->>'since','')::int,
    consult_hours = nullif(btrim(coalesce(p_data->>'consultHours','')), ''),
    brands = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'brands','[]'::jsonb)) x), '{}'),
    scale = v_scale,
    -- ⚠️ 보낸 것으로 **덮어씁니다** — 화면이 안 보내면 비워집니다
    contact_ways = coalesce((select array_agg(btrim(x))
      from jsonb_array_elements_text(
        case when jsonb_typeof(p_data->'contactWays') = 'array'
             then p_data->'contactWays' else '[]'::jsonb end) x), '{}')
  where id = v_pv;

  -- ⚠️ 같은 트랜잭션입니다 — 기록이 실패하면 수정도 안 됩니다 (§8).
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'provider', v_pv, 'self-updated', p_why, p_data);

  return v_pv;
end $$;
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **공개 보기에도 칸을 더합니다** — 안 더하면 업체가 고른
--   상담 방식이 **손님 화면에 영원히 안 나옵니다** (아무 에러도 없이).
--   `v_provider_card` 체인: 0032 → 0038 → **0044**.
--   내려갔는지 보는 법:
--     select count(*) from information_schema.columns
--      where table_name = 'v_provider_card' and column_name = 'contact_ways';
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️ **칸을 더할 때는 `create or replace` 가 안 됩니다** — Postgres 가
--   "cannot change number of columns" 으로 거절합니다. 지우고 다시
--   만듭니다. ⚠️ 지우면 **GRANT 도 같이 날아갑니다** — 아래에서 다시
--   줍니다 (안 주면 anon 이 못 읽어서 `pull-providers` 가 그날부터
--   `permission denied` 입니다).
drop view if exists v_provider_card;
create view v_provider_card as
  select p.id, p.name, p.intro, p.regions, p.gu, p.subs, p.since,
         p.consult_hours, p.verified, p.brands, p.scale, p.contact_ways,
         p.is_test
    from provider p
   where p.listed = true
     and p.is_test = false
     and p.state = 'approved';

grant select on v_provider_card to anon, authenticated;

revoke all on function save_provider_self(jsonb, text) from public;
grant execute on function save_provider_self(jsonb, text) to authenticated;

insert into schema_version (n, name) values (44, '0044_contact_ways')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0045_inquiry.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0045 — 고객센터 문의 접수 (4차 지시서 §11) · 입점 신청의 사업장 주소 (§9)
--
-- ⚠️⚠️ **왜 필요한가.** 고객센터에 "문의 접수" 가 없었습니다. 담을 표도
--   없고, 사업자 정보 여덟 칸이 비어 있어 전화 · 이메일도 적을 수
--   없었습니다 (전자상거래법 제10조 — 없는 연락처를 지어낼 수 없습니다).
--   신고 · 분쟁(0040)은 "어느 요청 · 어느 업체" 를 가리켜야 열리므로
--   **그냥 묻고 싶은 것**을 받을 자리가 한 곳도 없었습니다.
--
-- ⚠️⚠️⚠️ **로그인 없이도 받습니다 — 그래서 자물쇠를 더 겁니다.**
--   0040 은 "익명 신고를 받으면 경쟁사가 하루 백 건을 넣는다" 고 적고
--   로그인을 요구했습니다. 문의는 **로그인 전에 묻는 것**이 보통이라
--   그럴 수가 없습니다. 대신 ① 연락 받을 곳을 반드시 받고 ② 같은
--   연락처로 10분에 한 건 ③ 하루 열 건으로 막습니다.
--   ⚠️ 번호를 바꿔 가며 넣는 것은 **못 막습니다** (IP 를 받지 않습니다 —
--   받기 시작하면 그날부터 처리 항목이 하나 늘어 방침을 같이 고쳐야
--   합니다). 막는 척하지 않고 그 사실을 여기 적어 둡니다.
--
-- ⚠️⚠️ **개인정보보호법 제15조 제2항** — 수집 항목 · 이용 목적 · 보유
--   기간을 동의받는 그 자리에서 같이 보여 줍니다. 화면이 그것을 그리고,
--   여기서는 **동의 시각**을 받아 둡니다 (boolean 으로 두면 "언제
--   받았나" 를 못 댑니다).
--
-- ⚠️ 쓰기 정책도 GRANT 도 주지 않습니다 — 들어오는 길은 문 둘뿐입니다.
--
-- 되돌아갔는지 보는 법
--   select count(*) from information_schema.columns
--    where table_name = 'provider_apply' and column_name = 'addr';   -- 1 이어야 합니다
--   select 1 from pg_proc where proname = 'open_inquiry';            -- 있어야 합니다
-- ════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════
-- ① 입점 신청의 **사업장 주소** (§9 "업체 가입 정보" 목록)
--
-- ⚠️ 받기만 하고 쓰지 않던 칸을 만들지 않습니다 — 화면이 같은 날
--   그 칸을 냅니다 (js/applyform.js).
-- ════════════════════════════════════════════════════════════════════
alter table provider_apply add column if not exists addr text;

-- ⚠️⚠️ **make_apply 를 갈아 끼웁니다** (0027 → 0045). 0027 을 다시 붙여
--   넣으면 이 줄이 **조용히 내려갑니다** — 에러가 안 납니다.
--   내려갔는지 보는 법:
--     select pg_get_functiondef('make_apply(jsonb)'::regprocedure)
--       like '%v_addr%';   -- false 면 0027 이 덮은 것입니다
create or replace function make_apply(p jsonb)
  returns text language plpgsql security definer set search_path = public as $$
declare
  v_company  text := btrim(coalesce(p->>'company', ''));
  v_name     text := btrim(coalesce(p->>'name', ''));
  v_tel      text := btrim(coalesce(p->>'tel', ''));
  v_email    text := nullif(btrim(coalesce(p->>'email', '')), '');
  v_brn      text := nullif(btrim(coalesce(p->>'brn', '')), '');
  v_region   text := nullif(btrim(coalesce(p->>'region', '')), '');
  v_addr     text := nullif(btrim(coalesce(p->>'addr', '')), '');
  v_note     text := nullif(btrim(coalesce(p->>'note', '')), '');
  v_svc      text[] := coalesce(
                 (select array_agg(btrim(x)) from jsonb_array_elements_text(
                    case when jsonb_typeof(p->'services') = 'array'
                         then p->'services' else '[]'::jsonb end) as t(x)
                  where btrim(x) <> ''), '{}'::text[]);
  v_digits   text;
  v_no       text;
begin
  -- ⚠️ 자물쇠마다 **다른 말**로 거절합니다. 같은 말이면 하나를 빼 봐도
  --    다른 것이 먼저 막아 엉뚱한 까닭으로 통과합니다.
  if v_company = '' then raise exception '상호를 적어 주세요'; end if;
  if v_name    = '' then raise exception '담당자 성함을 적어 주세요'; end if;
  if v_tel     = '' then raise exception '연락처를 적어 주세요'; end if;

  if length(v_company) > 80  then raise exception '상호가 너무 깁니다'; end if;
  if length(v_name)    > 40  then raise exception '성함이 너무 깁니다'; end if;
  -- ⚠️ 새 칸도 길이를 막습니다 — 안 막으면 2천 자짜리 주소가 들어옵니다
  if v_addr is not null and length(v_addr) > 200 then
    raise exception '사업장 주소가 너무 깁니다';
  end if;
  if v_note is not null and length(v_note) > 2000 then
    raise exception '남기신 말씀이 너무 깁니다';
  end if;

  v_digits := regexp_replace(v_tel, '[^0-9]', '', 'g');
  -- ⚠️ 경계값: 9자리(02-xxx-xxxx)부터 11자리(010-xxxx-xxxx)까지입니다.
  if length(v_digits) < 9 or length(v_digits) > 11 then
    raise exception '연락처를 다시 봐 주세요 — 숫자 아홉에서 열한 자리입니다';
  end if;

  if array_length(v_svc, 1) is null then
    raise exception '하시는 일을 하나 이상 골라 주세요';
  end if;
  if array_length(v_svc, 1) > 20 then
    raise exception '고르신 항목이 너무 많습니다';
  end if;

  -- ⚠️⚠️ 동의 시각은 **화면이 보낸 값**입니다. 미래이거나 너무 오래된
  --    것은 믿지 않습니다 (개인정보보호법 제15조 — 그 자리에서 받은
  --    동의여야 합니다).
  if (p->>'agree_at') is null then
    raise exception '수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes' then
    raise exception '동의 시각이 미래입니다';
  end if;
  if (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의가 오래되었습니다 — 다시 한 번 눌러 주세요';
  end if;

  -- 중복 · 허위 신청 막기 (지시서 5번 A)
  if exists (
    select 1 from provider_apply
     where regexp_replace(tel, '[^0-9]', '', 'g') = v_digits
       and state = 'new'
       and created_at > now() - interval '10 minutes')
  then
    raise exception '방금 같은 번호로 신청이 들어왔습니다 — 잠시 뒤에 다시 해 주세요';
  end if;

  v_no := 'GA' || to_char(now() at time zone 'Asia/Seoul', 'YYMMDD')
               || '-' || lpad(nextval('apply_no_seq')::text, 4, '0');

  insert into provider_apply
    (no, company, brn, name, tel, email, region, addr, services, note, agree_at)
  values
    (v_no, v_company, v_brn, v_name, v_tel, v_email, v_region, v_addr, v_svc, v_note,
     (p->>'agree_at')::timestamptz);

  -- ⚠️ 감사 기록에 **성함 · 연락처를 넣지 않습니다.** audit_log 는 오래
  --    남고 보는 사람도 넓습니다. 신청번호로 찾아가면 됩니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (auth.uid(), my_role(), 'provider_apply', v_no, 'new', '입점 신청 접수',
          jsonb_build_object('services', v_svc, 'region', v_region));

  return v_no;
end $$;

revoke all on function make_apply(jsonb) from public;
grant execute on function make_apply(jsonb) to anon, authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ② 문의 — 표
-- ════════════════════════════════════════════════════════════════════
create table if not exists inquiry (
  id          uuid primary key default gen_random_uuid(),
  -- 접수번호 — ⚠️ 손님에게 돌려주는 값이라 **저장된 뒤에만** 나갑니다
  no          text not null unique,
  -- use     이용 중 막히는 곳
  -- biz     업체 · 제휴 문의
  -- privacy 개인정보 (열람 · 정정 · 삭제 · 동의 철회)
  -- etc     그 밖
  kind        text not null check (kind in ('use','biz','privacy','etc')),
  body        text not null,
  -- 연락 받을 곳 — ⚠️ 로그인 안 하셔도 넣으시므로 받습니다
  name        text,
  tel         text,
  email       text,
  by_user     uuid references auth.users(id) on delete set null,
  -- ⚠️⚠️ 동의를 **시각으로** 남깁니다 (제15조)
  agree_at    timestamptz not null,
  state       text not null default 'open'
              check (state in ('open','reviewing','answered','closed')),
  answer      text,
  answered_at timestamptz,
  answered_by uuid references auth.users(id) on delete set null,
  memo        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint inquiry_body_ck check (char_length(btrim(body)) between 5 and 2000),
  -- ⚠️⚠️ **답했다고 두려면 답이 있어야 합니다.** 문에서도 받고 여기서도
  --   봅니다 — 문이 내려가는 날 이 줄이 남습니다.
  constraint inquiry_answer_ck check (
    state <> 'answered' or btrim(coalesce(answer,'')) <> ''),
  -- ⚠️⚠️ **답을 보낼 길이 없으면 받지 않습니다.** 로그인하셨으면 계정으로,
  --   아니면 전화나 메일 가운데 하나는 있어야 합니다.
  constraint inquiry_reach_ck check (
    by_user is not null
    or btrim(coalesce(tel,'')) <> ''
    or btrim(coalesce(email,'')) <> '')
);
create index if not exists inquiry_state_idx on inquiry (state, created_at desc);
create index if not exists inquiry_tel_idx
  on inquiry (regexp_replace(coalesce(tel,''), '[^0-9]', '', 'g'), created_at desc);

alter table inquiry enable row level security;

-- ⚠️⚠️ **제 문의만 봅니다.** 남의 문의가 보이면 그 자체가 유출입니다
--   (무엇을 물었는지 · 연락처).
drop policy if exists inquiry_mine on inquiry;
create policy inquiry_mine on inquiry for select
  using (by_user = auth.uid());

drop policy if exists inquiry_staff on inquiry;
create policy inquiry_staff on inquiry for select
  using (my_role() in ('staff','admin'));

-- ⚠️ 쓰기 정책을 일부러 안 만들었습니다 — 문 둘만 엽니다.
grant select on inquiry to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ③ 문 — 문의를 넣습니다 (로그인 없이도)
-- ════════════════════════════════════════════════════════════════════
create or replace function open_inquiry(p jsonb)
  returns text language plpgsql security definer
  set search_path = public as $$
declare
  v_me    uuid := auth.uid();
  v_kind  text := coalesce(nullif(btrim(p->>'kind'), ''), 'etc');
  v_body  text := btrim(coalesce(p->>'body', ''));
  v_name  text := nullif(btrim(coalesce(p->>'name', '')), '');
  v_tel   text := nullif(btrim(coalesce(p->>'tel', '')), '');
  v_email text := nullif(btrim(coalesce(p->>'email', '')), '');
  v_dig   text;
  v_no    text;
begin
  -- ⚠️ 자물쇠마다 **다른 말**로 거절합니다 — 같은 말이면 하나를 빼 봐도
  --    다른 것이 먼저 막아 엉뚱한 까닭으로 통과합니다.
  if v_kind not in ('use','biz','privacy','etc') then
    raise exception '문의 종류를 골라 주세요';
  end if;
  if char_length(v_body) < 5 then
    raise exception '무엇이 궁금하신지 다섯 글자 이상 적어 주세요';
  end if;
  if char_length(v_body) > 2000 then
    raise exception '문의 내용은 이천 글자까지입니다';
  end if;
  if v_name is not null and length(v_name) > 40 then
    raise exception '성함이 너무 깁니다';
  end if;

  if v_tel is not null then
    v_dig := regexp_replace(v_tel, '[^0-9]', '', 'g');
    if length(v_dig) < 9 or length(v_dig) > 11 then
      raise exception '연락처를 다시 봐 주세요 — 숫자 아홉에서 열한 자리입니다';
    end if;
  end if;
  if v_email is not null and v_email !~ '^[^@[:space:]]+@[^@[:space:].]+[.][^@[:space:]]+$' then
    raise exception '메일 주소를 다시 봐 주세요';
  end if;

  -- ⚠️⚠️ **답을 보낼 길이 없으면 받지 않습니다.**
  if v_me is null and v_tel is null and v_email is null then
    raise exception '답을 보내 드릴 전화번호나 메일 주소를 적어 주세요';
  end if;

  -- ⚠️⚠️ 동의 시각 (제15조) — make_apply 와 같은 규칙입니다
  if (p->>'agree_at') is null then
    raise exception '수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes' then
    raise exception '동의 시각이 미래입니다';
  end if;
  if (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의가 오래되었습니다 — 다시 한 번 눌러 주세요';
  end if;

  -- ⚠️⚠️⚠️ **쏟아붓기 막기 — 두 겹입니다.** 로그인한 분은 계정으로,
  --   아니면 전화 숫자로 셉니다. 자물쇠마다 **다른 말**로 거절합니다.
  if v_me is not null then
    if exists (select 1 from inquiry
                where by_user = v_me and created_at > now() - interval '10 minutes') then
      raise exception '방금 문의를 넣으셨습니다 — 잠시 뒤에 해 주세요';
    end if;
    if (select count(*) from inquiry
         where by_user = v_me and created_at > now() - interval '24 hours') >= 10 then
      raise exception '하루에 보내실 수 있는 문의 수를 넘었습니다';
    end if;
  elsif v_dig is not null then
    if exists (select 1 from inquiry
                where regexp_replace(coalesce(tel,''), '[^0-9]', '', 'g') = v_dig
                  and created_at > now() - interval '10 minutes') then
      raise exception '방금 같은 번호로 문의가 들어왔습니다 — 잠시 뒤에 해 주세요';
    end if;
    if (select count(*) from inquiry
         where regexp_replace(coalesce(tel,''), '[^0-9]', '', 'g') = v_dig
           and created_at > now() - interval '24 hours') >= 10 then
      raise exception '하루에 보내실 수 있는 문의 수를 넘었습니다';
    end if;
  end if;

  v_no := 'IQ-' || to_char(now() at time zone 'Asia/Seoul', 'YYMMDD') || '-' ||
          upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 4));

  insert into inquiry (no, kind, body, name, tel, email, by_user, agree_at)
  values (v_no, v_kind, v_body, v_name, v_tel, v_email, v_me,
          (p->>'agree_at')::timestamptz);

  -- ⚠️ 감사 기록에 **성함 · 연락처 · 내용을 넣지 않습니다** — 접수번호로
  --   찾아가면 됩니다. audit_log 는 오래 남고 보는 사람도 넓습니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, my_role(), 'inquiry', v_no, 'open', '문의 접수',
          jsonb_build_object('kind', v_kind));

  return v_no;
end $$;

revoke all on function open_inquiry(jsonb) from public;
grant execute on function open_inquiry(jsonb) to anon, authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ④ 문 — 운영자가 문의를 옮깁니다
--
-- ⚠️⚠️ **답했다고 두려면 답을 같이 받습니다.** 까닭 없이 닫을 수 있으면
--   답하지 않고 닫는 자리가 되고, 그러면 접수가 있으나 마나입니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function move_inquiry(p jsonb)
  returns void language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_role app_role := my_role();
  v_id   uuid := nullif(btrim(coalesce(p->>'id', '')), '')::uuid;
  v_to   text := btrim(coalesce(p->>'to', ''));
  v_ans  text := nullif(btrim(coalesce(p->>'answer', '')), '');
  r      inquiry%rowtype;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  -- ⚠️ coalesce 로 NULL 을 땅에 내려놓습니다 — my_role() 이 NULL 이면
  --    not (NULL) 이 NULL 이라 if 가 **안 걸립니다** (0034 에서 겪었습니다).
  if not coalesce(v_role in ('staff','admin'), false) then
    raise exception '문의 처리는 운영자만 할 수 있습니다';
  end if;
  if v_id is null then raise exception '어느 문의인지 적어 주세요'; end if;
  if v_to not in ('reviewing','answered','closed') then
    raise exception '문의는 확인 중 · 답변함 · 닫음으로만 옮깁니다';
  end if;

  select * into r from inquiry where id = v_id;
  if not found then raise exception '그런 문의가 없습니다'; end if;
  if r.state = v_to then raise exception '이미 %입니다', v_to; end if;
  if r.state = 'closed' then
    raise exception '닫힌 문의는 다시 옮길 수 없습니다';
  end if;
  if v_to = 'answered' and v_ans is null then
    raise exception '무엇이라고 답하셨는지 적어 주세요';
  end if;
  if v_ans is not null and length(v_ans) > 2000 then
    raise exception '답변이 너무 깁니다';
  end if;

  update inquiry
     set state       = v_to,
         answer      = coalesce(v_ans, answer),
         answered_at = case when v_to = 'answered' then now() else answered_at end,
         answered_by = case when v_to = 'answered' then v_me else answered_by end,
         memo        = coalesce(nullif(btrim(coalesce(p->>'memo','')), ''), memo),
         updated_at  = now()
   where id = v_id;

  -- ⚠️ 답 글자는 감사 기록에 넣지 않습니다 (손님 · 운영자가 쓴 글입니다)
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'inquiry', r.no, v_to, '문의 상태 변경',
          jsonb_build_object('kind', r.kind));
end $$;

revoke all on function move_inquiry(jsonb) from public;
grant execute on function move_inquiry(jsonb) to authenticated;

insert into schema_version (n, name) values (45, '0045_inquiry')
  on conflict (n) do nothing;

/* ---------------------------- 0046_join.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0046 — 골프 조인 (함께 라운딩할 사람 찾기)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **왜 지금 만드는가** — `/cat/matchup` 이 막다른 길이었습니다.
--   메인에서 "골프 조인" 을 누르면 "아직 열린 조인이 없습니다" 만 보고
--   끝이었습니다. 단추도 없고 다른 데로 가는 길도 없었습니다.
--   절대 규칙 2 가 "**막다른 길로 두지 않습니다** — 0 인 자리에는 지금
--   실제로 되는 것을 같이 냅니다" 인데, 열 분류 가운데 **셋**이 그
--   규칙을 어기고 있었습니다 (조인 · 인력 · 커뮤니티).
--
-- ⚠️⚠️⚠️ **여기서 가장 조심할 것은 연락처입니다** (개인정보보호법
--   제17조). 조인은 **회원끼리** 만나는 자리라, 연락처가 오가야 실제로
--   만날 수 있습니다. 그런데 —
--     · 목록에 연락처를 같이 내면 **아무나 긁어 갑니다**
--     · "신청하면 바로 보이게" 로 두면 신청만 하고 **긁어 갑니다**
--   그래서 **수락된 짝에게만** 서로 보입니다. 누구에게 줄지 정해진 뒤에
--   주는 것 — 제17조 제2항이 요구하는 그대로입니다.
--
-- ⚠️⚠️ **연락처는 표에서 읽을 수 없습니다.** 칸 단위 GRANT 로 빼 두고
--   (아래 ④), 오가는 길은 보기 `v_join_contact` **하나**입니다. 그
--   보기의 where 절이 자물쇠 그 자체입니다 (보기는 RLS 를 지나지
--   않습니다 — 임자 권한으로 돕니다).
--   ⚠️ 정책만 보고 "막혔다" 고 결론 내지 마세요. `tools/sql/join.js`
--   가 **그 역할로 실제로 질의해** 봅니다.
--
-- ⚠️ **지우지 않습니다.** 조인을 지우면 "그런 약속 한 적 없다" 가
--   됩니다. 끝난 것은 state 로 표시합니다 (`closed` · `done`).
--
-- 되돌아갔는지 보는 법
--   select 1 from pg_proc where proname = 'open_joinroom';   -- 있어야 합니다
--   select count(*) from information_schema.columns
--    where table_name = 'joinroom';                          -- 12 여야 합니다
-- ════════════════════════════════════════════════════════════════════
begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 조인 한 자리
-- ════════════════════════════════════════════════════════════════════
create table if not exists joinroom (
  id         uuid primary key default gen_random_uuid(),
  by_user    uuid not null references auth.users(id) on delete cascade,
  -- ⚠️ 지역 키는 js/data/regions.js 의 AM_REGIONS 와 **같은 글자**입니다.
  --   여기 목록을 박지 않습니다 — 박으면 지역이 느는 날 두 곳이
  --   어긋나고, 그때 화면은 보내는데 DB 가 거절합니다.
  region     text not null check (btrim(region) <> ''),
  play_at    date not null,
  -- ⚠️ 제목 · 설명은 **필수**입니다 (지시서 §2.A). 없으면 목록이
  --   "서울 11월 12일" 만 스무 줄이라 고를 수가 없습니다.
  title      text not null check (char_length(btrim(title)) between 2 and 60),
  body       text not null check (char_length(btrim(body)) between 5 and 1000),
  -- 골프장 — 선택입니다. ⚠️⚠️ 적혀 있어도 **부킹이 잡혔다는 뜻이
  --   아닙니다** (지시서 §2.A — 부킹 보장 금지). 화면이 그 사실을
  --   같이 적고, booked 가 그것을 가릅니다.
  course     text check (course is null or char_length(btrim(course)) <= 60),
  booked     boolean not null default false,
  tee        text,                       -- 희망 티타임 (아침 · 오전 …)
  -- 더 필요한 사람 수 — ⚠️ 4인 한 팀이라 셋을 넘을 수 없습니다
  need       int  not null check (need between 1 and 3),
  budget     int  check (budget is null or budget between 0 and 10000000),
  note       text check (note is null or length(note) <= 500),
  -- open   받는 중
  -- closed 연 사람이 닫음 (사람이 다 찼거나 그만둠)
  -- done   날짜가 지났습니다
  state      text not null default 'open'
             check (state in ('open','closed','done')),
  -- ⚠️⚠️ **연락처는 여기 있지만 아무도 표에서 못 읽습니다** (④의 GRANT).
  --   오가는 길은 v_join_contact 하나입니다.
  contact    text not null check (btrim(contact) <> ''),
  -- ⚠️ 동의 **시각**을 받습니다. boolean 으로 두면 "언제 받았나" 를
  --   못 댑니다 (제15조 제2항을 따질 때 그것이 전부입니다).
  agree_at   timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists joinroom_open_idx
  on joinroom (state, play_at) where state = 'open';
create index if not exists joinroom_mine_idx on joinroom (by_user, created_at desc);

-- ════════════════════════════════════════════════════════════════════
-- ② 신청 한 건
-- ════════════════════════════════════════════════════════════════════
create table if not exists joinapply (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references joinroom(id) on delete cascade,
  by_user    uuid not null references auth.users(id) on delete cascade,
  msg        text check (msg is null or length(msg) <= 300),
  contact    text not null check (btrim(contact) <> ''),
  -- applied  보냈습니다
  -- accepted 연 사람이 받았습니다  ← 이때부터 연락처가 서로 보입니다
  -- rejected 연 사람이 거절했습니다
  -- canceled 신청한 사람이 거뒀습니다
  state      text not null default 'applied'
             check (state in ('applied','accepted','rejected','canceled')),
  agree_at   timestamptz not null,
  -- ⚠️⚠️⚠️ **수락만으로 연락처가 오가지 않습니다** (지시서 §2.A).
  --   처음에는 "수락하면 서로 보이게" 로 지었는데, 그것은 제17조가
  --   말하는 "**별도** 동의" 가 아닙니다 — 수락은 "같이 치자" 이지
  --   "내 번호를 줘도 좋다" 가 아닙니다. 둘은 다른 결정입니다.
  --   그래서 **각자 제 연락처에 대해 따로** 누릅니다:
  --     host_share_at   연 사람이 **제** 번호를 이 신청자에게 보여 줌
  --     guest_share_at  신청자가 **제** 번호를 연 사람에게 보여 줌
  --   ⚠️ 한쪽만 눌러도 그쪽 것만 갑니다 (맞바꾸기를 강요하지 않습니다).
  host_share_at  timestamptz,
  guest_share_at timestamptz,
  created_at timestamptz not null default now(),
  -- ⚠️ 한 자리에 한 번만 — 안 막으면 한 사람이 같은 방에 백 번 넣습니다
  unique (room_id, by_user)
);
create index if not exists joinapply_room_idx on joinapply (room_id, created_at desc);
create index if not exists joinapply_mine_idx on joinapply (by_user, created_at desc);

-- ════════════════════════════════════════════════════════════════════
-- ③ 공개 목록 — ⚠️ **보기의 where 절이 자물쇠 그 자체입니다**
--   보기는 RLS 를 지나지 않습니다 (임자 권한으로 돕니다). 그래서
--   여기 담지 않은 칸은 **어떤 정책으로도 새어 나가지 않습니다.**
--   ⚠️⚠️ `contact` 와 `by_user` 를 **담지 않습니다** — 글은 공개지만
--   누가 열었는지와 연락처는 공개가 아닙니다 (후기 보기와 같은 꼴).
-- ════════════════════════════════════════════════════════════════════
drop view if exists v_join_open;
create view v_join_open as
  select r.id, r.region, r.play_at, r.title, r.body, r.course, r.booked,
         r.tee, r.need, r.budget, r.note, r.created_at,
         -- ⚠️ 칸에 저장하지 않고 **셉니다** (절대 규칙 1 — 숫자로
         --   들고 있으면 누가 그 칸에 고쳐 적습니다)
         (select count(*) from joinapply a
           where a.room_id = r.id and a.state = 'accepted') as taken_n,
         r.need - (select count(*) from joinapply a
                    where a.room_id = r.id and a.state = 'accepted') as left_n,
         (select count(*) from joinapply a
           where a.room_id = r.id and a.state = 'applied') as waiting_n
    from joinroom r
   where r.state = 'open'
     and r.play_at >= current_date;
grant select on v_join_open to anon, authenticated;

-- ⚠️⚠️⚠️ **연락처가 오가는 단 하나의 길입니다.**
--   ① 수락된 신청이어야 하고 ② 보는 사람이 그 둘 중 하나여야 합니다.
--   둘 다 where 절에 있으므로 정책을 어떻게 쓰든 이 조건을 못 피합니다.
drop view if exists v_join_contact;
create view v_join_contact as
  select a.id as apply_id, a.room_id,
         r.by_user as room_owner, a.by_user as applicant,
         a.host_share_at, a.guest_share_at,
         -- ⚠️⚠️⚠️ **각자 제 것만 엽니다.** 연 사람 번호는 연 사람이
         --   눌렀을 때만, 신청자 번호는 신청자가 눌렀을 때만 나옵니다.
         --   수락만으로는 **둘 다 null** 입니다 — 수락은 "같이 치자"
         --   이지 "내 번호를 줘도 좋다" 가 아닙니다 (제17조 제2항).
         case when a.host_share_at  is not null then r.contact end as room_contact,
         case when a.guest_share_at is not null then a.contact end as apply_contact
    from joinapply a
    join joinroom  r on r.id = a.room_id
   where a.state = 'accepted'
     and (auth.uid() = r.by_user or auth.uid() = a.by_user);
grant select on v_join_contact to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ④ 자물쇠 — RLS 로 **줄**을, GRANT 로 **칸**을 막습니다
--   ⚠️⚠️ 둘을 따로 둡니다. 하나만 보고 "막혔다" 고 읽으면 다른 하나가
--   장식인지 알 수 없습니다 (작업 기억 — GRANT 와 RLS 를 따로 눌러
--   보세요).
-- ════════════════════════════════════════════════════════════════════
alter table joinroom  enable row level security;
alter table joinapply enable row level security;

-- 내가 연 자리
drop policy if exists joinroom_mine on joinroom;
create policy joinroom_mine on joinroom for select
  using (by_user = auth.uid());
-- 운영자
drop policy if exists joinroom_staff on joinroom;
create policy joinroom_staff on joinroom for select
  using (my_role() in ('staff','admin'));

-- 내가 넣은 신청
drop policy if exists joinapply_mine on joinapply;
create policy joinapply_mine on joinapply for select
  using (by_user = auth.uid());
-- 내 자리에 들어온 신청 — ⚠️ 연락처 칸은 아래 GRANT 가 막습니다
drop policy if exists joinapply_owner on joinapply;
create policy joinapply_owner on joinapply for select
  using (exists (select 1 from joinroom r
                  where r.id = joinapply.room_id and r.by_user = auth.uid()));
drop policy if exists joinapply_staff on joinapply;
create policy joinapply_staff on joinapply for select
  using (my_role() in ('staff','admin'));

-- ⚠️⚠️⚠️ **칸 단위 GRANT — `contact` 와 `agree_at` 을 빼고 줍니다.**
--   정책이 줄을 보여 줘도 이 칸들은 **읽히지 않습니다.** 연락처가
--   나가는 길은 v_join_contact 하나뿐이라는 뜻입니다.
--   ⚠️ 쓰기(insert · update · delete)는 **한 줄도 주지 않습니다** —
--   들어오는 길은 아래 문 넷뿐입니다.
grant select (id, by_user, region, play_at, title, body, course, booked,
              tee, need, budget, note, state, created_at, updated_at)
                                   on joinroom  to authenticated;
grant select (id, room_id, by_user, msg, state, created_at,
              host_share_at, guest_share_at)
                                   on joinapply to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑤ 문 — 자리를 엽니다
-- ════════════════════════════════════════════════════════════════════
create or replace function open_joinroom(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_region  text := nullif(btrim(coalesce(p->>'region','')), '');
  v_tee     text := nullif(btrim(coalesce(p->>'tee','')), '');
  v_note    text := nullif(btrim(coalesce(p->>'note','')), '');
  v_contact text := nullif(btrim(coalesce(p->>'contact','')), '');
  v_title   text := nullif(btrim(coalesce(p->>'title','')), '');
  v_body    text := nullif(btrim(coalesce(p->>'body','')), '');
  v_course  text := nullif(btrim(coalesce(p->>'course','')), '');
  v_play    date;
  v_need    int;
  v_budget  int;
  v_id      uuid;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  if v_region is null then
    raise exception '지역을 골라 주세요';
  end if;
  -- ⚠️ 제목 · 설명은 필수입니다 (지시서 §2.A)
  if v_title is null or char_length(v_title) < 2 then
    raise exception '제목을 두 글자 이상 적어 주세요';
  end if;
  if char_length(v_title) > 60 then
    raise exception '제목이 너무 깁니다 (60자)';
  end if;
  if v_body is null or char_length(v_body) < 5 then
    raise exception '설명을 다섯 글자 이상 적어 주세요';
  end if;
  if char_length(v_body) > 1000 then
    raise exception '설명이 너무 깁니다 (1000자)';
  end if;
  if v_course is not null and char_length(v_course) > 60 then
    raise exception '골프장 이름이 너무 깁니다';
  end if;
  if v_contact is null then
    raise exception '연락처를 적어 주세요';
  end if;
  if length(v_contact) > 100 then
    raise exception '연락처가 너무 깁니다';
  end if;

  -- ⚠️ 동의 시각 — 미래이거나 하루 넘게 지난 것은 받지 않습니다
  --   (화면을 열어 두고 하루 뒤에 보내는 것을 막습니다)
  if p->>'agree_at' is null then
    raise exception '개인정보 수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes'
     or (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의 시각이 올바르지 않습니다';
  end if;

  begin
    v_play := (p->>'play_at')::date;
  exception when others then
    raise exception '라운딩 날짜를 골라 주세요';
  end;
  if v_play is null then
    raise exception '라운딩 날짜를 골라 주세요';
  end if;
  -- ⚠️ 지난 날짜로 열 수 없습니다. 오늘은 됩니다 (오늘 저녁 조인).
  if v_play < current_date then
    raise exception '지난 날짜로는 열 수 없습니다';
  end if;
  if v_play > current_date + interval '180 days' then
    raise exception '너무 먼 날짜입니다 (6개월 안으로 잡아 주세요)';
  end if;

  v_need := coalesce((p->>'need')::int, 1);
  if v_need < 1 or v_need > 3 then
    raise exception '더 필요한 인원은 1~3명입니다';
  end if;
  v_budget := nullif(btrim(coalesce(p->>'budget','')), '')::int;
  if v_budget is not null and (v_budget < 0 or v_budget > 10000000) then
    raise exception '예산이 올바르지 않습니다';
  end if;
  if v_note is not null and length(v_note) > 500 then
    raise exception '남기실 말이 너무 깁니다 (500자)';
  end if;

  -- ⚠️⚠️ **쏟아붓기 막기.** 한 사람이 자리를 백 개 열면 목록이 통째로
  --   쓸모없어집니다. 열려 있는 자리는 **한 번에 다섯**까지.
  --   ⚠️ 닫은 자리는 안 셉니다 (닫고 다시 여는 것은 정상입니다).
  if (select count(*) from joinroom
       where by_user = v_uid and state = 'open'
         and play_at >= current_date) >= 5 then
    raise exception '열어 두신 자리가 다섯입니다. 먼저 정리해 주세요';
  end if;
  -- 하루에 여는 수도 막습니다 (닫고 다시 열기를 되풀이하는 것)
  if (select count(*) from joinroom
       where by_user = v_uid and created_at > now() - interval '1 day') >= 10 then
    raise exception '오늘은 더 열 수 없습니다 (하루 열 개)';
  end if;

  insert into joinroom (by_user, region, play_at, title, body, course,
                        tee, need, budget, note, contact, agree_at)
  values (v_uid, v_region, v_play, v_title, v_body, v_course,
          v_tee, v_need, v_budget, v_note,
          v_contact, (p->>'agree_at')::timestamptz)
  returning id into v_id;
  return v_id;
end $$;
grant execute on function open_joinroom(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑥ 문 — 신청합니다
-- ════════════════════════════════════════════════════════════════════
create or replace function apply_joinroom(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_room    uuid := (p->>'room_id')::uuid;
  v_msg     text := nullif(btrim(coalesce(p->>'msg','')), '');
  v_contact text := nullif(btrim(coalesce(p->>'contact','')), '');
  v_owner   uuid;
  v_state   text;
  v_play    date;
  v_need    int;
  v_id      uuid;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  if v_contact is null then
    raise exception '연락처를 적어 주세요';
  end if;
  if length(v_contact) > 100 then
    raise exception '연락처가 너무 깁니다';
  end if;
  if v_msg is not null and length(v_msg) > 300 then
    raise exception '남기실 말이 너무 깁니다 (300자)';
  end if;
  if p->>'agree_at' is null then
    raise exception '개인정보 수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes'
     or (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의 시각이 올바르지 않습니다';
  end if;

  select by_user, state, play_at, need into v_owner, v_state, v_play, v_need
    from joinroom where id = v_room;
  if v_owner is null then
    raise exception '그런 자리가 없습니다';
  end if;
  -- ⚠️⚠️ **제 자리에 못 신청합니다.** 안 막으면 신청 수를 스스로
  --   부풀려 목록 위로 올립니다.
  if v_owner = v_uid then
    raise exception '직접 여신 자리에는 신청할 수 없습니다';
  end if;
  if v_state <> 'open' then
    raise exception '지금은 신청을 받지 않는 자리입니다';
  end if;
  if v_play < current_date then
    raise exception '이미 지난 자리입니다';
  end if;

  -- ⚠️ 받을 만큼 찼으면 더 안 받습니다 (수락된 것만 셉니다)
  if (select count(*) from joinapply
       where room_id = v_room and state = 'accepted') >= v_need then
    raise exception '이미 인원이 찼습니다';
  end if;

  -- ⚠️⚠️ 쏟아붓기 — 하루 스무 건. 자리마다 한 번은 unique 가 막습니다.
  if (select count(*) from joinapply
       where by_user = v_uid and created_at > now() - interval '1 day') >= 20 then
    raise exception '오늘은 더 신청할 수 없습니다 (하루 스무 건)';
  end if;

  -- ⚠️ 거절당한 뒤 **다시 넣는 것**은 막습니다 (unique 가 있으므로
  --   insert 가 실패합니다 — 말을 알아듣게 바꿔 줍니다).
  if exists (select 1 from joinapply where room_id = v_room and by_user = v_uid) then
    raise exception '이미 신청하셨습니다';
  end if;

  insert into joinapply (room_id, by_user, msg, contact, agree_at)
  values (v_room, v_uid, v_msg, v_contact, (p->>'agree_at')::timestamptz)
  returning id into v_id;
  return v_id;
end $$;
grant execute on function apply_joinroom(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑦ 문 — 신청을 옮깁니다 (수락 · 거절 · 거두기)
--   ⚠️⚠️ **여기서 연락처가 서로 보이게 됩니다** (accepted). 그래서
--   누가 무엇을 할 수 있는지를 한 줄씩 못박습니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function move_joinapply(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_id    uuid := (p->>'id')::uuid;
  v_to    text := nullif(btrim(coalesce(p->>'state','')), '');
  v_owner uuid;
  v_by    uuid;
  v_cur   text;
  v_room  uuid;
  v_need  int;
  v_play  date;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  /* ⚠️⚠️⚠️ **동시에 둘을 수락하면 정원이 넘습니다** (지시서 §2.A —
     "동시 신청의 정원 초과를 트랜잭션으로 방지"). 세어 보고 넣는
     사이에 다른 수락이 끼어들면 둘 다 "아직 자리 있음" 으로 읽습니다.
     그래서 **방 줄을 먼저 잠급니다** — 같은 방을 건드리는 수락은
     한 번에 하나씩 지나갑니다. */
  select r.id into v_room from joinroom r
    join joinapply a on a.room_id = r.id
   where a.id = v_id for update of r;

  select a.by_user, a.state, a.room_id, r.by_user, r.need, r.play_at
    into v_by, v_cur, v_room, v_owner, v_need, v_play
    from joinapply a join joinroom r on r.id = a.room_id
   where a.id = v_id;
  if v_cur is null then
    raise exception '그런 신청이 없습니다';
  end if;

  -- ⚠️⚠️⚠️ **SQL 에는 참 · 거짓 말고 NULL 이 있습니다.** 로그인은
  --   위에서 막았지만, 비교가 NULL 을 낼 수 있는 자리는 전부
  --   coalesce 로 땅에 내려놓습니다 (0034 에서 자물쇠가 통째로 열린
  --   자리입니다 — `not (NULL or false)` 는 NULL 이고 `if NULL then`
  --   은 안 걸립니다).
  if not coalesce(v_owner = v_uid, false)
     and not coalesce(v_by = v_uid, false) then
    raise exception '이 신청을 옮길 수 없습니다';
  end if;

  if v_to = 'canceled' then
    -- 거두기는 **신청한 사람만**
    if not coalesce(v_by = v_uid, false) then
      raise exception '신청을 거두는 것은 신청하신 분만 할 수 있습니다';
    end if;
    if v_cur <> 'applied' then
      raise exception '이미 처리된 신청입니다';
    end if;
  elsif v_to in ('accepted','rejected') then
    -- 수락 · 거절은 **연 사람만**
    if not coalesce(v_owner = v_uid, false) then
      raise exception '수락 · 거절은 자리를 여신 분만 할 수 있습니다';
    end if;
    if v_cur <> 'applied' then
      raise exception '이미 처리된 신청입니다';
    end if;
    if v_to = 'accepted' then
      if v_play < current_date then
        raise exception '이미 지난 자리입니다';
      end if;
      if (select count(*) from joinapply
           where room_id = v_room and state = 'accepted') >= v_need then
        raise exception '이미 인원이 찼습니다';
      end if;
    end if;
  else
    raise exception '옮길 수 없는 상태입니다';
  end if;

  update joinapply set state = v_to where id = v_id;
  return v_to;
end $$;
grant execute on function move_joinapply(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑧ 문 — 자리를 닫습니다
-- ════════════════════════════════════════════════════════════════════
create or replace function close_joinroom(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_id    uuid := (p->>'id')::uuid;
  v_owner uuid;
  v_state text;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  select by_user, state into v_owner, v_state from joinroom where id = v_id;
  if v_owner is null then
    raise exception '그런 자리가 없습니다';
  end if;
  -- ⚠️ 운영자도 닫을 수 있습니다 (신고가 들어온 자리를 내려야 합니다)
  if not coalesce(v_owner = v_uid, false)
     and not coalesce(my_role() in ('staff','admin'), false) then
    raise exception '이 자리를 닫을 수 없습니다';
  end if;
  if v_state <> 'open' then
    raise exception '이미 닫힌 자리입니다';
  end if;
  update joinroom set state = 'closed' where id = v_id;
  -- ⚠️ 아직 답 못 받은 신청은 **거절로 두지 않습니다** — 연 사람이
  --   그만둔 것이지 그 사람들을 고른 것이 아닙니다. applied 로 두면
  --   화면이 "자리가 닫혔습니다" 로 말해 줍니다.
  return 'closed';
end $$;
grant execute on function close_joinroom(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑨ 문 — ⚠️⚠️⚠️ **연락처를 보여 줄지 따로 고릅니다** (제17조 제2항)
--   수락과 **다른 결정**이라 문도 다릅니다. 누르는 사람은 **제 것만**
--   엽니다 — 상대 것을 대신 열 수 없습니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function share_joincontact(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_id    uuid := (p->>'id')::uuid;
  v_on    boolean := coalesce((p->>'on')::boolean, true);
  v_owner uuid;
  v_by    uuid;
  v_cur   text;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  if p->>'agree_at' is null then
    raise exception '연락처 제공 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes'
     or (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의 시각이 올바르지 않습니다';
  end if;

  select a.by_user, a.state, r.by_user into v_by, v_cur, v_owner
    from joinapply a join joinroom r on r.id = a.room_id
   where a.id = v_id;
  if v_cur is null then
    raise exception '그런 신청이 없습니다';
  end if;
  -- ⚠️ 수락된 짝에게만 — 아무 신청에나 번호를 뿌릴 수 없습니다
  if v_cur <> 'accepted' then
    raise exception '수락된 뒤에 고르실 수 있습니다';
  end if;

  if coalesce(v_owner = v_uid, false) then
    update joinapply
       set host_share_at = case when v_on then now() else null end
     where id = v_id;
    return case when v_on then 'host_shared' else 'host_hidden' end;
  elsif coalesce(v_by = v_uid, false) then
    update joinapply
       set guest_share_at = case when v_on then now() else null end
     where id = v_id;
    return case when v_on then 'guest_shared' else 'guest_hidden' end;
  end if;
  raise exception '이 신청과 관계가 없습니다';
end $$;
grant execute on function share_joincontact(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑩ 문 — 연 사람이 **제 자리를 고칩니다** (지시서 §2.A)
--   ⚠️ 줄이기만 막습니다: 이미 수락한 사람보다 적은 인원으로 못 줄입니다
--   (줄이면 수락해 놓고 자리를 뺏는 꼴입니다).
-- ════════════════════════════════════════════════════════════════════
create or replace function edit_joinroom(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid    uuid := auth.uid();
  v_id     uuid := (p->>'id')::uuid;
  v_owner  uuid;
  v_state  text;
  v_taken  int;
  v_title  text := nullif(btrim(coalesce(p->>'title','')), '');
  v_body   text := nullif(btrim(coalesce(p->>'body','')), '');
  v_course text := nullif(btrim(coalesce(p->>'course','')), '');
  v_tee    text := nullif(btrim(coalesce(p->>'tee','')), '');
  v_note   text := nullif(btrim(coalesce(p->>'note','')), '');
  v_need   int;
  v_budget int;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  select by_user, state into v_owner, v_state from joinroom where id = v_id for update;
  if v_owner is null then
    raise exception '그런 자리가 없습니다';
  end if;
  if not coalesce(v_owner = v_uid, false) then
    raise exception '여신 분만 고칠 수 있습니다';
  end if;
  if v_state <> 'open' then
    raise exception '닫힌 자리는 못 고칩니다';
  end if;

  if v_title is null or char_length(v_title) < 2 then
    raise exception '제목을 두 글자 이상 적어 주세요';
  end if;
  if v_body is null or char_length(v_body) < 5 then
    raise exception '설명을 다섯 글자 이상 적어 주세요';
  end if;

  select count(*) into v_taken from joinapply
   where room_id = v_id and state = 'accepted';
  v_need := coalesce((p->>'need')::int, v_taken);
  if v_need < 1 or v_need > 3 then
    raise exception '더 필요한 인원은 1~3명입니다';
  end if;
  -- ⚠️⚠️ 이미 수락한 사람보다 적게 줄일 수 없습니다
  if v_need < v_taken then
    raise exception '이미 수락하신 분이 더 많습니다 (먼저 정리해 주세요)';
  end if;
  v_budget := nullif(btrim(coalesce(p->>'budget','')), '')::int;

  /* ⚠️⚠️ **날짜 · 지역은 여기서 못 바꿉니다.** 바꾸면 신청한 사람이
     전혀 다른 약속에 묶입니다 — 그건 고치는 것이 아니라 새 자리입니다.
     바꾸시려면 닫고 새로 여십니다. */
  update joinroom
     set title = v_title, body = v_body, course = v_course,
         tee = v_tee, note = v_note, need = v_need, budget = v_budget,
         updated_at = now()
   where id = v_id;
  return v_id;
end $$;
grant execute on function edit_joinroom(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑪ 신고 — ⚠️ **새 신고 표를 만들지 않습니다** (지시서 §0-6 · §2.A)
--   이미 선 `report`(0040)에 가리킬 곳만 하나 늘립니다. 운영자는
--   한 자리(`/admin` 의 js/adminrep.js)에서 그대로 봅니다.
--   ⚠️⚠️ `open_report` 를 **0040 → 0046 으로 갈아 끼웁니다** —
--   0040 을 다시 붙여 넣으면 이 줄이 조용히 내려갑니다
--   (`tools/check-chains.js` 가 그 짝을 셉니다).
-- ════════════════════════════════════════════════════════════════════
alter table report add column if not exists joinroom_id uuid
  references joinroom(id) on delete cascade;
alter table report drop constraint if exists report_target_ck;
alter table report add  constraint report_target_ck check (
  request_id is not null or provider_id is not null
  or review_id is not null or joinroom_id is not null);


-- ⚠️⚠️ **open_report 를 갈아 끼웁니다** (0040 → 0046). 0040 의 본문을
--   **그대로 꺼내** 네 군데만 끼웠습니다 — 손으로 다시 쓰면 0040 이
--   하던 일(분쟁 당사자 확인 · 중복 막기 · 감사 기록에 본문 안 넣기)이
--   조용히 사라집니다. 0045 에서 make_apply 를 다시 쓰다 신청번호 꼴과
--   중복 막음을 날린 적이 있습니다.
create or replace function open_report(p jsonb)
  returns uuid language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_kind text := coalesce(nullif(btrim(p->>'kind'), ''), 'abuse');
  v_req  uuid := nullif(btrim(coalesce(p->>'request', '')), '')::uuid;
  v_pv   text := nullif(btrim(coalesce(p->>'provider', '')), '');
  v_rv   uuid := nullif(btrim(coalesce(p->>'review', '')), '')::uuid;
  -- ⚠️ 0046 — 조인 자리도 신고할 수 있습니다 (새 표를 만들지 않습니다)
  v_jr   uuid := nullif(btrim(coalesce(p->>'joinroom', '')), '')::uuid;
  v_body text := btrim(coalesce(p->>'body', ''));
  v_id   uuid;
  v_dup  int;
begin
  if v_me is null then raise exception '신고는 로그인한 뒤에 하실 수 있습니다'; end if;
  if v_kind not in ('abuse','dispute') then
    raise exception '신고 · 분쟁 중 하나로 적어 주세요';
  end if;
  if v_req is null and v_pv is null and v_rv is null and v_jr is null then
    raise exception '무엇에 대한 것인지 적어 주세요 (요청 · 업체 · 후기 · 조인 가운데 하나)';
  end if;
  if char_length(v_body) < 5 then
    raise exception '무슨 일이 있었는지 다섯 글자 이상 적어 주세요';
  end if;
  if char_length(v_body) > 2000 then
    raise exception '신고 내용은 이천 글자까지입니다';
  end if;

  -- ⚠️⚠️ **분쟁은 그 요청의 당사자만** 엽니다. 아무나 "저 거래가
  --   이상합니다" 라고 열 수 있으면 분쟁이 아니라 신고입니다.
  if v_kind = 'dispute' then
    if v_req is null then raise exception '분쟁은 어느 요청인지 적어야 합니다'; end if;
    if not (coalesce(is_my_request(v_req), false)
            or coalesce(exists (select 1 from assignment a
                                 where a.request_id = v_req
                                   and a.provider_id = my_provider()), false)
            or coalesce(my_role() in ('staff','admin'), false)) then
      raise exception '그 거래의 당사자만 분쟁을 열 수 있습니다';
    end if;
  end if;

  -- ⚠️⚠️ **같은 것을 두 번 열지 않습니다.** 누르는 손이 미끄러지면
  --   같은 신고가 둘이 되고, 운영자는 그것을 두 번 읽습니다.
  select count(*) into v_dup from report
   where by_user = v_me and kind = v_kind and state in ('open','reviewing')
     and request_id is not distinct from v_req
     and provider_id is not distinct from v_pv
     and review_id is not distinct from v_rv
     and joinroom_id is not distinct from v_jr;
  if v_dup > 0 then
    raise exception '같은 건으로 이미 접수된 것이 있습니다 — 운영자가 보고 있습니다';
  end if;

  insert into report (kind, request_id, provider_id, review_id, joinroom_id,
                      by_user, body)
  values (v_kind, v_req, v_pv, v_rv, v_jr, v_me, v_body)
  returning id into v_id;

  -- ⚠️ 감사 기록에 **신고 본문을 넣지 않습니다** — audit_log 는 오래
  --   남고 보는 사람도 넓습니다. 번호로 찾아갑니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'report', v_id::text, 'open',
          jsonb_build_object('kind', v_kind));
  return v_id;
end $$;

revoke all on function open_report(jsonb) from public;
grant execute on function open_report(jsonb) to authenticated;

insert into schema_version (n, name) values (46, '0046_join')
  on conflict (n) do nothing;

commit;

/* ---------------------------- 0047_community.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0047 — 골프 커뮤니티 (질문과 답변)  [통합작업지시서 §2.C]
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **막다른 길 셋 가운데 둘째입니다.** `/cat/community` 는
--   "아직 올라온 글이 없습니다" 만 보여 주고 끝이었습니다 — 단추도
--   없고 다른 데로 가는 길도 없었습니다 (절대 규칙 2 위반).
--
-- ⚠️⚠️ **첫 버전은 질문과 답변까지입니다** (§2.C). 인기글 · 좋아요 ·
--   랭킹 · 포인트 · 쪽지 · AI 답변 · 평점을 **만들지 않습니다.** 그런
--   것은 글이 쌓인 뒤에 뜻이 생기고, 지금 만들면 0건짜리 랭킹이
--   화면에 남습니다.
--
-- ⚠️⚠️⚠️ **누가 썼는지는 공개가 아닙니다.** 글은 공개지만 글쓴이는
--   아닙니다 — 후기(0037)와 같은 자리입니다. 공개로 읽는 길은 보기
--   둘뿐이고, 그 보기가 이름을 가리고 `by_user` 를 **아예 안 담습니다.**
--   ⚠️ "로그인한 아무나 표를 읽는다" 정책을 두면 안 됩니다 — 표에는
--   보기에 없는 칸이 있습니다.
--
-- ⚠️⚠️ **지우지 않고 내립니다.** 글쓴이가 지우면 `state='dropped'`,
--   운영자가 가리면 `state='hidden'` 이고 줄은 남습니다. 지우면
--   "그런 말 한 적 없다" 가 되고, 신고가 들어왔을 때 댈 것이 없습니다.
--   ⚠️ 운영자가 가릴 때는 **까닭을 반드시** 받습니다 (까닭 없이 가릴
--   수 있으면 불평할 때마다 지워 주는 자리가 됩니다 — 후기에서 배운 것).
--
-- ⚠️ 신고는 **새 표를 만들지 않습니다** (§0-6). `report`(0040)에
--   가리킬 곳만 늘립니다. 운영자는 한 자리에서 그대로 봅니다.
--
-- 되돌아갔는지 보는 법
--   select 1 from pg_proc where proname = 'ask_cq';        -- 있어야 합니다
--   select count(*) from information_schema.columns
--    where table_name = 'cq';                              -- 11 이어야 합니다
-- ════════════════════════════════════════════════════════════════════
begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 질문
-- ════════════════════════════════════════════════════════════════════
create table if not exists cq (
  id         uuid primary key default gen_random_uuid(),
  by_user    uuid not null references auth.users(id) on delete cascade,
  -- ⚠️ 분류 키는 `js/data/catalog.js` 의 AM_CATS 와 **같은 글자**입니다.
  --   여기 목록을 박지 않습니다 — 박으면 분류가 바뀌는 날 두 곳이
  --   어긋나고, 그때 화면은 보내는데 DB 가 거절합니다.
  cat        text not null check (btrim(cat) <> ''),
  title      text not null check (char_length(btrim(title)) between 2 and 80),
  body       text not null check (char_length(btrim(body)) between 5 and 4000),
  -- live    보입니다
  -- dropped 글쓴이가 내렸습니다
  -- hidden  운영자가 가렸습니다 (까닭이 반드시 있습니다)
  state      text not null default 'live'
             check (state in ('live','dropped','hidden')),
  hidden_why text,
  hidden_by  uuid references auth.users(id) on delete set null,
  hidden_at  timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- ⚠️⚠️ 가린 것에는 **까닭이 반드시** 있습니다. 문에서도 받고 여기서도
  --   봅니다 — 문이 내려가는 날 이 줄이 남습니다 (0040 과 같은 꼴).
  constraint cq_hidden_ck check (
    state <> 'hidden' or btrim(coalesce(hidden_why,'')) <> '')
);
create index if not exists cq_live_idx on cq (cat, created_at desc) where state = 'live';
create index if not exists cq_mine_idx on cq (by_user, created_at desc);

-- ════════════════════════════════════════════════════════════════════
-- ② 답변
-- ════════════════════════════════════════════════════════════════════
create table if not exists ca (
  id         uuid primary key default gen_random_uuid(),
  q_id       uuid not null references cq(id) on delete cascade,
  by_user    uuid not null references auth.users(id) on delete cascade,
  body       text not null check (char_length(btrim(body)) between 5 and 4000),
  state      text not null default 'live'
             check (state in ('live','dropped','hidden')),
  hidden_why text,
  hidden_by  uuid references auth.users(id) on delete set null,
  hidden_at  timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ca_hidden_ck check (
    state <> 'hidden' or btrim(coalesce(hidden_why,'')) <> '')
);
create index if not exists ca_q_idx on ca (q_id, created_at) where state = 'live';
create index if not exists ca_mine_idx on ca (by_user, created_at desc);

-- ════════════════════════════════════════════════════════════════════
-- ③ 공개 보기 — ⚠️⚠️ **where 절이 자물쇠 그 자체입니다**
--   보기는 RLS 를 지나지 않습니다 (임자 권한으로 돕니다).
--   ⚠️ `by_user` 를 **안 담습니다** — 글은 공개지만 글쓴이는 아닙니다.
--   ⚠️ 이름은 **저장하지 않고 셉니다** (후기와 같은 함수꼴).
-- ════════════════════════════════════════════════════════════════════
drop view if exists v_cq_public;
create view v_cq_public as
  select q.id, q.cat, q.title, q.body, q.created_at, q.updated_at,
         case
           when btrim(coalesce(a.name, '')) = '' then '회원'
           else left(btrim(a.name), 1) ||
                repeat('*', greatest(char_length(btrim(a.name)) - 1, 1))
         end as who,
         -- ⚠️ 답변 수는 칸에 저장하지 않고 **셉니다** (절대 규칙 1 —
         --   숫자로 들고 있으면 누군가 그 칸에 적어 넣습니다)
         (select count(*) from ca where ca.q_id = q.id and ca.state = 'live') as answer_n
    from cq q
    left join account a on a.id = q.by_user
   where q.state = 'live';
grant select on v_cq_public to anon, authenticated;

drop view if exists v_ca_public;
create view v_ca_public as
  select c.id, c.q_id, c.body, c.created_at, c.updated_at,
         case
           when btrim(coalesce(a.name, '')) = '' then '회원'
           else left(btrim(a.name), 1) ||
                repeat('*', greatest(char_length(btrim(a.name)) - 1, 1))
         end as who,
         -- ⚠️ 질문한 사람이 단 답변인지 — 화면이 "글쓴이" 라고 적습니다
         (c.by_user = q.by_user) as by_asker
    from ca c
    join cq q on q.id = c.q_id
    left join account a on a.id = c.by_user
   where c.state = 'live'
     and q.state = 'live';
grant select on v_ca_public to anon, authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ④ 자물쇠 — RLS 로 **줄**을, GRANT 로 **칸**을
-- ════════════════════════════════════════════════════════════════════
alter table cq enable row level security;
alter table ca enable row level security;

drop policy if exists cq_mine on cq;
create policy cq_mine on cq for select using (by_user = auth.uid());
drop policy if exists cq_staff on cq;
create policy cq_staff on cq for select using (my_role() in ('staff','admin'));

drop policy if exists ca_mine on ca;
create policy ca_mine on ca for select using (by_user = auth.uid());
drop policy if exists ca_staff on ca;
create policy ca_staff on ca for select using (my_role() in ('staff','admin'));

-- ⚠️⚠️ 쓰기는 **한 줄도 주지 않습니다** — 들어오는 길은 문뿐입니다.
grant select (id, by_user, cat, title, body, state, created_at, updated_at,
              hidden_why) on cq to authenticated;
grant select (id, q_id, by_user, body, state, created_at, updated_at,
              hidden_why) on ca to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑤ 문 — 질문을 올립니다
-- ════════════════════════════════════════════════════════════════════
create or replace function ask_cq(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_cat   text := nullif(btrim(coalesce(p->>'cat','')), '');
  v_title text := nullif(btrim(coalesce(p->>'title','')), '');
  v_body  text := nullif(btrim(coalesce(p->>'body','')), '');
  v_id    uuid;
begin
  if v_uid is null then
    raise exception '질문은 로그인한 뒤에 올리실 수 있습니다';
  end if;
  if v_cat is null then
    raise exception '질문 분류를 골라 주세요';
  end if;
  if v_title is null or char_length(v_title) < 2 then
    raise exception '제목을 두 글자 이상 적어 주세요';
  end if;
  if char_length(v_title) > 80 then
    raise exception '제목이 너무 깁니다 (80자)';
  end if;
  if v_body is null or char_length(v_body) < 5 then
    raise exception '내용을 다섯 글자 이상 적어 주세요';
  end if;
  if char_length(v_body) > 4000 then
    raise exception '내용이 너무 깁니다 (4000자)';
  end if;

  -- ⚠️⚠️ **쏟아붓기 막기.** 광고를 하루에 백 건 올리면 목록이 통째로
  --   쓸모없어집니다. 10분에 한 건 · 하루 열 건.
  --   ⚠️ 내린 글도 셉니다 — 올렸다 내리기를 되풀이하는 것이 바로
  --   쏟아붓기입니다.
  if exists (select 1 from cq where by_user = v_uid
              and created_at > now() - interval '10 minutes') then
    raise exception '방금 올리셨습니다. 10분 뒤에 다시 올려 주세요';
  end if;
  if (select count(*) from cq where by_user = v_uid
       and created_at > now() - interval '1 day') >= 10 then
    raise exception '오늘은 더 올리실 수 없습니다 (하루 열 건)';
  end if;

  insert into cq (by_user, cat, title, body) values (v_uid, v_cat, v_title, v_body)
  returning id into v_id;
  return v_id;
end $$;
grant execute on function ask_cq(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑥ 문 — 답변을 답니다
-- ════════════════════════════════════════════════════════════════════
create or replace function answer_cq(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid  uuid := auth.uid();
  v_q    uuid := (p->>'q_id')::uuid;
  v_body text := nullif(btrim(coalesce(p->>'body','')), '');
  v_st   text;
  v_id   uuid;
begin
  if v_uid is null then
    raise exception '답변은 로그인한 뒤에 다실 수 있습니다';
  end if;
  if v_body is null or char_length(v_body) < 5 then
    raise exception '답변을 다섯 글자 이상 적어 주세요';
  end if;
  if char_length(v_body) > 4000 then
    raise exception '답변이 너무 깁니다 (4000자)';
  end if;

  select state into v_st from cq where id = v_q;
  if v_st is null then
    raise exception '그런 질문이 없습니다';
  end if;
  -- ⚠️ 내려간 질문에는 답변을 못 답니다 (가려진 글에 글이 쌓이면
  --   가린 뜻이 없어집니다)
  if v_st <> 'live' then
    raise exception '지금은 답변을 받지 않는 질문입니다';
  end if;

  -- ⚠️ 쏟아붓기 — 1분에 한 건 · 하루 쉰 건. 답변은 질문보다 자주
  --   달리는 것이 정상이라 질문보다 느슨합니다.
  if exists (select 1 from ca where by_user = v_uid
              and created_at > now() - interval '1 minute') then
    raise exception '방금 다셨습니다. 잠시 뒤에 다시 달아 주세요';
  end if;
  if (select count(*) from ca where by_user = v_uid
       and created_at > now() - interval '1 day') >= 50 then
    raise exception '오늘은 더 다실 수 없습니다 (하루 쉰 건)';
  end if;

  insert into ca (q_id, by_user, body) values (v_q, v_uid, v_body)
  returning id into v_id;
  return v_id;
end $$;
grant execute on function answer_cq(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑦ 문 — 글쓴이가 **제 글을 고칩니다** (§2.C)
--   ⚠️ 분류는 못 바꿉니다 — 바꾸면 답변이 전혀 다른 자리로 옮겨 갑니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function edit_cq(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_id    uuid := (p->>'id')::uuid;
  v_title text := nullif(btrim(coalesce(p->>'title','')), '');
  v_body  text := nullif(btrim(coalesce(p->>'body','')), '');
  v_by    uuid;
  v_st    text;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  select by_user, state into v_by, v_st from cq where id = v_id for update;
  if v_by is null then raise exception '그런 질문이 없습니다'; end if;
  if not coalesce(v_by = v_uid, false) then
    raise exception '올리신 분만 고치실 수 있습니다';
  end if;
  -- ⚠️ 가려진 글은 못 고칩니다 — 고쳐서 가린 뜻을 지우면 안 됩니다
  if v_st <> 'live' then
    raise exception '내려간 글은 고치실 수 없습니다';
  end if;
  if v_title is null or char_length(v_title) < 2 then
    raise exception '제목을 두 글자 이상 적어 주세요';
  end if;
  if v_body is null or char_length(v_body) < 5 then
    raise exception '내용을 다섯 글자 이상 적어 주세요';
  end if;
  update cq set title = v_title, body = v_body, updated_at = now() where id = v_id;
  return v_id;
end $$;
grant execute on function edit_cq(jsonb) to authenticated;

create or replace function edit_ca(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid  uuid := auth.uid();
  v_id   uuid := (p->>'id')::uuid;
  v_body text := nullif(btrim(coalesce(p->>'body','')), '');
  v_by   uuid;
  v_st   text;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  select by_user, state into v_by, v_st from ca where id = v_id for update;
  if v_by is null then raise exception '그런 답변이 없습니다'; end if;
  if not coalesce(v_by = v_uid, false) then
    raise exception '다신 분만 고치실 수 있습니다';
  end if;
  if v_st <> 'live' then
    raise exception '내려간 답변은 고치실 수 없습니다';
  end if;
  if v_body is null or char_length(v_body) < 5 then
    raise exception '답변을 다섯 글자 이상 적어 주세요';
  end if;
  update ca set body = v_body, updated_at = now() where id = v_id;
  return v_id;
end $$;
grant execute on function edit_ca(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑧ 문 — 내립니다 (글쓴이) · 가립니다 (운영자)
--   ⚠️⚠️ **지우지 않습니다.** 줄은 남고 state 만 바뀝니다.
--   ⚠️⚠️ 가릴 때는 **까닭을 반드시** 받습니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function move_cq(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid := (p->>'id')::uuid;
  v_to  text := nullif(btrim(coalesce(p->>'state','')), '');
  v_why text := nullif(btrim(coalesce(p->>'why','')), '');
  v_by  uuid;
  v_st  text;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  select by_user, state into v_by, v_st from cq where id = v_id for update;
  if v_by is null then raise exception '그런 질문이 없습니다'; end if;

  if v_to = 'dropped' then
    -- 내리는 것은 **글쓴이만**
    if not coalesce(v_by = v_uid, false) then
      raise exception '올리신 분만 내리실 수 있습니다';
    end if;
    if v_st <> 'live' then raise exception '이미 내려간 글입니다'; end if;
    update cq set state = 'dropped', updated_at = now() where id = v_id;
    return 'dropped';
  elsif v_to = 'hidden' then
    -- 가리는 것은 **운영자만** — 까닭이 반드시 있어야 합니다
    if not coalesce(my_role() in ('staff','admin'), false) then
      raise exception '가리는 것은 운영자만 할 수 있습니다';
    end if;
    if v_why is null or char_length(v_why) < 5 then
      raise exception '가리는 까닭을 다섯 글자 이상 적어 주세요';
    end if;
    update cq set state = 'hidden', hidden_why = v_why, hidden_by = v_uid,
                  hidden_at = now(), updated_at = now() where id = v_id;
    -- ⚠️ 감사 기록에 **글 내용을 넣지 않습니다** — 번호로 찾아갑니다
    insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
    values (v_uid, my_role(), 'cq', v_id::text, 'hidden',
            jsonb_build_object('why_len', char_length(v_why)));
    return 'hidden';
  end if;
  raise exception '옮길 수 없는 상태입니다';
end $$;
grant execute on function move_cq(jsonb) to authenticated;

create or replace function move_ca(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid := (p->>'id')::uuid;
  v_to  text := nullif(btrim(coalesce(p->>'state','')), '');
  v_why text := nullif(btrim(coalesce(p->>'why','')), '');
  v_by  uuid;
  v_st  text;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  select by_user, state into v_by, v_st from ca where id = v_id for update;
  if v_by is null then raise exception '그런 답변이 없습니다'; end if;

  if v_to = 'dropped' then
    if not coalesce(v_by = v_uid, false) then
      raise exception '다신 분만 내리실 수 있습니다';
    end if;
    if v_st <> 'live' then raise exception '이미 내려간 답변입니다'; end if;
    update ca set state = 'dropped', updated_at = now() where id = v_id;
    return 'dropped';
  elsif v_to = 'hidden' then
    if not coalesce(my_role() in ('staff','admin'), false) then
      raise exception '가리는 것은 운영자만 할 수 있습니다';
    end if;
    if v_why is null or char_length(v_why) < 5 then
      raise exception '가리는 까닭을 다섯 글자 이상 적어 주세요';
    end if;
    update ca set state = 'hidden', hidden_why = v_why, hidden_by = v_uid,
                  hidden_at = now(), updated_at = now() where id = v_id;
    insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
    values (v_uid, my_role(), 'ca', v_id::text, 'hidden',
            jsonb_build_object('why_len', char_length(v_why)));
    return 'hidden';
  end if;
  raise exception '옮길 수 없는 상태입니다';
end $$;
grant execute on function move_ca(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑨ 신고 — ⚠️ **새 표를 만들지 않습니다** (§0-6)
--   `report`(0040)에 가리킬 곳 둘만 늘립니다.
--   ⚠️⚠️ `open_report` 를 **0046 → 0047 로 갈아 끼웁니다.**
-- ════════════════════════════════════════════════════════════════════
alter table report add column if not exists cq_id uuid references cq(id) on delete cascade;
alter table report add column if not exists ca_id uuid references ca(id) on delete cascade;
alter table report drop constraint if exists report_target_ck;
alter table report add  constraint report_target_ck check (
  request_id is not null or provider_id is not null or review_id is not null
  or joinroom_id is not null or cq_id is not null or ca_id is not null);


-- ⚠️⚠️ **open_report 를 갈아 끼웁니다** (0046 → 0047). 0046 의 본문을
--   **그대로 꺼내** 네 군데만 끼웠습니다 — 손으로 다시 쓰면 0040 ·
--   0046 이 하던 일이 조용히 사라집니다.
create or replace function open_report(p jsonb)
  returns uuid language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_kind text := coalesce(nullif(btrim(p->>'kind'), ''), 'abuse');
  v_req  uuid := nullif(btrim(coalesce(p->>'request', '')), '')::uuid;
  v_pv   text := nullif(btrim(coalesce(p->>'provider', '')), '');
  v_rv   uuid := nullif(btrim(coalesce(p->>'review', '')), '')::uuid;
  -- ⚠️ 0046 — 조인 자리도 신고할 수 있습니다 (새 표를 만들지 않습니다)
  v_jr   uuid := nullif(btrim(coalesce(p->>'joinroom', '')), '')::uuid;
  -- ⚠️ 0047 — 커뮤니티 질문 · 답변도 신고할 수 있습니다
  v_cq   uuid := nullif(btrim(coalesce(p->>'question', '')), '')::uuid;
  v_ca   uuid := nullif(btrim(coalesce(p->>'answer', '')), '')::uuid;
  v_body text := btrim(coalesce(p->>'body', ''));
  v_id   uuid;
  v_dup  int;
begin
  if v_me is null then raise exception '신고는 로그인한 뒤에 하실 수 있습니다'; end if;
  if v_kind not in ('abuse','dispute') then
    raise exception '신고 · 분쟁 중 하나로 적어 주세요';
  end if;
  if v_req is null and v_pv is null and v_rv is null and v_jr is null
     and v_cq is null and v_ca is null then
    raise exception '무엇에 대한 것인지 적어 주세요 (요청 · 업체 · 후기 · 조인 · 글 가운데 하나)';
  end if;
  if char_length(v_body) < 5 then
    raise exception '무슨 일이 있었는지 다섯 글자 이상 적어 주세요';
  end if;
  if char_length(v_body) > 2000 then
    raise exception '신고 내용은 이천 글자까지입니다';
  end if;

  -- ⚠️⚠️ **분쟁은 그 요청의 당사자만** 엽니다. 아무나 "저 거래가
  --   이상합니다" 라고 열 수 있으면 분쟁이 아니라 신고입니다.
  if v_kind = 'dispute' then
    if v_req is null then raise exception '분쟁은 어느 요청인지 적어야 합니다'; end if;
    if not (coalesce(is_my_request(v_req), false)
            or coalesce(exists (select 1 from assignment a
                                 where a.request_id = v_req
                                   and a.provider_id = my_provider()), false)
            or coalesce(my_role() in ('staff','admin'), false)) then
      raise exception '그 거래의 당사자만 분쟁을 열 수 있습니다';
    end if;
  end if;

  -- ⚠️⚠️ **같은 것을 두 번 열지 않습니다.** 누르는 손이 미끄러지면
  --   같은 신고가 둘이 되고, 운영자는 그것을 두 번 읽습니다.
  select count(*) into v_dup from report
   where by_user = v_me and kind = v_kind and state in ('open','reviewing')
     and request_id is not distinct from v_req
     and provider_id is not distinct from v_pv
     and review_id is not distinct from v_rv
     and joinroom_id is not distinct from v_jr
     and cq_id is not distinct from v_cq
     and ca_id is not distinct from v_ca;
  if v_dup > 0 then
    raise exception '같은 건으로 이미 접수된 것이 있습니다 — 운영자가 보고 있습니다';
  end if;

  insert into report (kind, request_id, provider_id, review_id, joinroom_id,
                      cq_id, ca_id, by_user, body)
  values (v_kind, v_req, v_pv, v_rv, v_jr, v_cq, v_ca, v_me, v_body)
  returning id into v_id;

  -- ⚠️ 감사 기록에 **신고 본문을 넣지 않습니다** — audit_log 는 오래
  --   남고 보는 사람도 넓습니다. 번호로 찾아갑니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'report', v_id::text, 'open',
          jsonb_build_object('kind', v_kind));
  return v_id;
end $$;

revoke all on function open_report(jsonb) from public;
grant execute on function open_report(jsonb) to authenticated;

insert into schema_version (n, name) values (47, '0047_community')
  on conflict (n) do nothing;

commit;

/* ---------------------------- 0048_career.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0048 — 골프 인력 · 비즈니스 (구인 · 구직 · 제휴)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **왜 지금 만드는가** — 막다른 분류 셋 가운데 마지막입니다
--   (조인 0046 · 커뮤니티 0047 · 여기). `/cat/career` 를 누르면
--   하위분류 여섯 이름만 보고 끝이었습니다 — 구인 글을 올릴 자리도,
--   지원할 자리도 없었습니다. 절대 규칙 2.
--
-- ⚠️⚠️ **한 표로 셋을 받습니다** (`kind`) —
--     hire  사람을 구합니다 (골프장 · 연습장 · 아카데미 → 프로 · 캐디)
--     seek  일자리를 구합니다 (프로 · 캐디 → 업체)
--     biz   제휴 · B2B · 양도양수 (업체끼리)
--   표를 셋으로 가르면 목록 · 지원 · 신고 · 가리기를 세 벌 적게 되고,
--   한 벌만 고치는 날 둘이 다른 말을 합니다.
--   ⚠️ **하위분류 키 목록을 여기 박지 않습니다** — `js/data/catalog.js`
--   의 `cr-*` 와 어긋나는 날 화면은 보내는데 DB 가 거절합니다
--   (지역 키와 같은 자리 — 0046 의 region 주석).
--
-- ⚠️⚠️⚠️ **연락처는 0046 과 똑같이 다룹니다** (개인정보보호법 제17조
--   제2항). 구인 글에 번호를 적어 두면 **아무나 긁어 갑니다** — 그리고
--   구직자 번호는 더합니다 (이력이 붙은 개인정보입니다).
--     ① 공개 보기에 `contact` 칸이 **아예 없습니다**
--     ② 표의 칸 단위 GRANT 에서 뺐습니다
--     ③ 오가는 길은 보기 `v_job_contact` 하나이고, 그 where 절이
--        **수락된 짝**만 냅니다
--   ⚠️ 그리고 **수락만으로 열리지 않습니다** — 각자 제 것만 따로 열고
--   언제든 닫습니다 (`share_jobcontact`). 수락은 "이야기해 봅시다"
--   이지 "내 번호를 줘도 좋다" 가 아닙니다.
--
-- ⚠️⚠️ **업체 이름으로 올리는 것은 고르는 것입니다** (`as_pro`).
--   켜면 **승인된 · 검사용이 아닌** 업체여야 하고, 그때만 상호가
--   목록에 나옵니다. 끄면 다른 글과 같이 가린 이름(`김**`)입니다.
--   ⚠️ 보기가 **읽을 때 다시** 상태를 봅니다 — 정지된 업체의 상호는
--   그 순간부터 목록에서 빠집니다 (저장된 이름을 믿지 않습니다).
--
-- ⚠️ **지우지 않고 내립니다**(`dropped`). 운영자가 가릴 때는 **까닭이
--   반드시**(`hidden`) — 0047 과 같은 자리입니다.
--
-- ⚠️⚠️ **급여 · 조건을 지어내지 않습니다.** 비우면 화면에서 그 줄이
--   **줄째 빠집니다** (절대 규칙 2). "협의" 를 우리가 적어 넣지
--   않습니다 — 그것은 글쓴이가 할 말입니다.
--
-- 되돌아갔는지 보는 법
--   select 1 from pg_proc where proname = 'open_jobpost';   -- 있어야 합니다
--   select count(*) from information_schema.columns
--    where table_name = 'jobpost';                          -- 19 여야 합니다
-- ════════════════════════════════════════════════════════════════════
begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 글 한 건
-- ════════════════════════════════════════════════════════════════════
create table if not exists jobpost (
  id          uuid primary key default gen_random_uuid(),
  by_user     uuid not null references auth.users(id) on delete cascade,
  -- ⚠️⚠️ **손님이 보낸 값으로 채우지 않습니다** — 문이 `my_provider()`
  --   에서 읽습니다. 보낸 값을 믿으면 아무나 남의 상호로 글을 올립니다.
  provider_id text references provider(id) on delete set null,
  kind        text not null check (kind in ('hire','seek','biz')),
  -- ⚠️ catalog.js 의 **하위** key (cr-coach · cr-caddy …). 목록을
  --   박지 않습니다 — 하위분류가 느는 날 두 곳이 어긋납니다.
  sub         text not null check (btrim(sub) <> ''),
  -- ⚠️ 지역 키는 js/data/regions.js 의 AM_REGIONS 와 **같은 글자**
  region      text not null check (btrim(region) <> ''),
  title       text not null check (char_length(btrim(title)) between 2 and 60),
  body        text not null check (char_length(btrim(body)) between 5 and 2000),
  -- 급여 · 조건 — 선택입니다 (비면 화면에서 줄째 빠집니다)
  pay         text check (pay is null or char_length(btrim(pay)) <= 60),
  terms       text check (terms is null or char_length(btrim(terms)) <= 200),
  -- 마감일 — 선택. ⚠️ 지나면 공개 보기에서 **저절로** 빠집니다
  close_at    date,
  -- open    받는 중
  -- closed  글쓴이가 마감했습니다 (사람을 구했거나 그만둠)
  -- dropped 글쓴이가 내렸습니다 ⚠️ 지우지 않습니다
  -- hidden  운영자가 가렸습니다 ⚠️ 까닭이 반드시 있습니다
  state       text not null default 'open'
              check (state in ('open','closed','dropped','hidden')),
  hidden_why  text,
  hidden_by   uuid references auth.users(id) on delete set null,
  hidden_at   timestamptz,
  -- ⚠️⚠️ **연락처는 여기 있지만 아무도 표에서 못 읽습니다** (④의 GRANT)
  contact     text not null check (btrim(contact) <> ''),
  -- ⚠️ 동의 **시각**을 받습니다. boolean 으로 두면 "언제 받았나" 를
  --   못 댑니다 (제15조 제2항을 따질 때 그것이 전부입니다).
  agree_at    timestamptz not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
-- ⚠️ 까닭 없이 가릴 수 없습니다 — 문에서도 막고 여기서도 봅니다
--   (문이 내려가는 날 이 줄이 남습니다)
do $$ begin
  alter table jobpost add constraint jobpost_hidden_ck
    check (state <> 'hidden' or btrim(coalesce(hidden_why,'')) <> '');
exception when duplicate_object then null; end $$;

create index if not exists jobpost_open_idx
  on jobpost (kind, created_at desc) where state = 'open';
create index if not exists jobpost_mine_idx on jobpost (by_user, created_at desc);
create index if not exists jobpost_sub_idx  on jobpost (sub) where state = 'open';

-- ════════════════════════════════════════════════════════════════════
-- ② 지원 · 제안 한 건
-- ════════════════════════════════════════════════════════════════════
create table if not exists jobapply (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references jobpost(id) on delete cascade,
  by_user    uuid not null references auth.users(id) on delete cascade,
  msg        text check (msg is null or char_length(btrim(msg)) <= 1000),
  contact    text not null check (btrim(contact) <> ''),
  -- applied  보냈습니다
  -- accepted 글쓴이가 받았습니다  ← 이때부터 **연락처를 열 수** 있습니다
  -- rejected 글쓴이가 거절했습니다
  -- canceled 보낸 사람이 거뒀습니다
  state      text not null default 'applied'
             check (state in ('applied','accepted','rejected','canceled')),
  agree_at   timestamptz not null,
  -- ⚠️⚠️⚠️ **수락만으로 연락처가 오가지 않습니다** (0046 과 같은 자리).
  --     host_share_at   글쓴이가 **제** 번호를 이 지원자에게 보여 줌
  --     guest_share_at  지원자가 **제** 번호를 글쓴이에게 보여 줌
  --   ⚠️ 한쪽만 눌러도 그쪽 것만 갑니다 (맞바꾸기를 강요하지 않습니다 —
  --   강요하면 "줘야 받는" 구조가 되어 사실상 강제 동의입니다).
  host_share_at  timestamptz,
  guest_share_at timestamptz,
  created_at timestamptz not null default now(),
  -- ⚠️ 한 글에 한 번만 — 안 막으면 한 사람이 같은 글에 백 번 넣습니다
  unique (post_id, by_user)
);
create index if not exists jobapply_post_idx on jobapply (post_id, created_at desc);
create index if not exists jobapply_mine_idx on jobapply (by_user, created_at desc);

-- ════════════════════════════════════════════════════════════════════
-- ③ 공개 보기 — ⚠️⚠️ **where 절이 자물쇠 그 자체입니다**
--   보기는 RLS 를 지나지 않습니다 (임자 권한으로 돕니다). 그래서
--   여기 담지 않은 칸은 **어떤 정책으로도** 새어 나가지 않습니다.
--   ⚠️ `contact` · `by_user` · `agree_at` 을 **안 담습니다**.
-- ════════════════════════════════════════════════════════════════════
drop view if exists v_job_open;
create view v_job_open as
  select j.id, j.kind, j.sub, j.region, j.title, j.body, j.pay, j.terms,
         j.close_at, j.created_at, j.updated_at,
         -- ⚠️ 이름은 **저장하지 않고 셉니다** (후기 · 커뮤니티와 같은 꼴)
         case
           when btrim(coalesce(ac.name, '')) = '' then '회원'
           else left(btrim(ac.name), 1) ||
                repeat('*', greatest(char_length(btrim(ac.name)) - 1, 1))
         end as who,
         -- ⚠️⚠️ **읽을 때 다시 봅니다** — 승인된 · 검사용이 아닌 업체의
         --   상호만 나옵니다. 정지되면 그 순간부터 빠집니다.
         --   ⚠️ 검사용 업체(0030)가 섞이면 없는 회사를 광고하는 것입니다.
         case when pv.id is not null and pv.state = 'approved'
                   and pv.is_test = false
              then pv.name end as pro_name,
         -- ⚠️ 지원 수는 칸에 저장하지 않고 **셉니다** (절대 규칙 1)
         (select count(*) from jobapply a
           where a.post_id = j.id and a.state in ('applied','accepted')) as apply_n
    from jobpost j
    left join account  ac on ac.id = j.by_user
    left join provider pv on pv.id = j.provider_id
   where j.state = 'open'
     and (j.close_at is null or j.close_at >= current_date);
grant select on v_job_open to anon, authenticated;

-- ⚠️⚠️⚠️ **연락처가 오가는 단 하나의 길입니다.**
--   ① 수락된 지원이어야 하고 ② 보는 사람이 그 둘 중 하나여야 하고
--   ③ **각자 열어 둔 것만** 나옵니다. 셋 다 where · case 에 있으므로
--   정책을 어떻게 쓰든 이 조건을 못 피합니다.
drop view if exists v_job_contact;
create view v_job_contact as
  select a.id as apply_id, a.post_id,
         j.by_user as post_owner, a.by_user as applicant,
         a.host_share_at, a.guest_share_at,
         case when a.host_share_at  is not null then j.contact end as post_contact,
         case when a.guest_share_at is not null then a.contact end as apply_contact
    from jobapply a
    join jobpost  j on j.id = a.post_id
   where a.state = 'accepted'
     and (auth.uid() = j.by_user or auth.uid() = a.by_user);
grant select on v_job_contact to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ④ 자물쇠 — RLS 로 **줄**을, GRANT 로 **칸**을
--   ⚠️⚠️ 둘을 따로 둡니다. 하나만 보고 "막혔다" 고 읽으면 다른 하나가
--   장식인지 알 수 없습니다.
-- ════════════════════════════════════════════════════════════════════
alter table jobpost  enable row level security;
alter table jobapply enable row level security;

drop policy if exists jobpost_mine on jobpost;
create policy jobpost_mine on jobpost for select
  using (by_user = auth.uid());
drop policy if exists jobpost_staff on jobpost;
create policy jobpost_staff on jobpost for select
  using (my_role() in ('staff','admin'));

drop policy if exists jobapply_mine on jobapply;
create policy jobapply_mine on jobapply for select
  using (by_user = auth.uid());
-- 내 글에 들어온 지원 — ⚠️ 연락처 칸은 아래 GRANT 가 막습니다
drop policy if exists jobapply_owner on jobapply;
create policy jobapply_owner on jobapply for select
  using (exists (select 1 from jobpost j
                  where j.id = jobapply.post_id and j.by_user = auth.uid()));
drop policy if exists jobapply_staff on jobapply;
create policy jobapply_staff on jobapply for select
  using (my_role() in ('staff','admin'));

-- ⚠️⚠️⚠️ **칸 단위 GRANT — `contact` 와 `agree_at` 을 빼고 줍니다.**
--   정책이 줄을 보여 줘도 이 칸들은 **읽히지 않습니다.**
--   ⚠️ 쓰기(insert · update · delete)는 **한 줄도 주지 않습니다** —
--   들어오는 길은 아래 문 여섯뿐입니다.
grant select (id, by_user, provider_id, kind, sub, region, title, body,
              pay, terms, close_at, state, hidden_why, hidden_at,
              created_at, updated_at)             on jobpost  to authenticated;
grant select (id, post_id, by_user, msg, state, created_at,
              host_share_at, guest_share_at)      on jobapply to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑤ 문 — 글을 올립니다
-- ════════════════════════════════════════════════════════════════════
create or replace function open_jobpost(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_kind    text := nullif(btrim(coalesce(p->>'kind','')), '');
  v_sub     text := nullif(btrim(coalesce(p->>'sub','')), '');
  v_region  text := nullif(btrim(coalesce(p->>'region','')), '');
  v_title   text := nullif(btrim(coalesce(p->>'title','')), '');
  v_body    text := nullif(btrim(coalesce(p->>'body','')), '');
  v_pay     text := nullif(btrim(coalesce(p->>'pay','')), '');
  v_terms   text := nullif(btrim(coalesce(p->>'terms','')), '');
  v_contact text := nullif(btrim(coalesce(p->>'contact','')), '');
  v_aspro   boolean := coalesce((p->>'as_pro')::boolean, false);
  v_close   date;
  v_pv      text;
  v_id      uuid;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  if v_kind is null or v_kind not in ('hire','seek','biz') then
    raise exception '구인 · 구직 · 제휴 가운데 하나를 골라 주세요';
  end if;
  if v_sub is null then
    raise exception '어떤 일인지 골라 주세요';
  end if;
  if char_length(v_sub) > 40 then
    raise exception '분류 값이 올바르지 않습니다';
  end if;
  if v_region is null then
    raise exception '지역을 골라 주세요';
  end if;
  if v_title is null or char_length(v_title) < 2 then
    raise exception '제목을 두 글자 이상 적어 주세요';
  end if;
  if char_length(v_title) > 60 then
    raise exception '제목이 너무 깁니다 (60자)';
  end if;
  if v_body is null or char_length(v_body) < 5 then
    raise exception '내용을 다섯 글자 이상 적어 주세요';
  end if;
  if char_length(v_body) > 2000 then
    raise exception '내용이 너무 깁니다 (2000자)';
  end if;
  if v_pay is not null and char_length(v_pay) > 60 then
    raise exception '급여 칸이 너무 깁니다 (60자)';
  end if;
  if v_terms is not null and char_length(v_terms) > 200 then
    raise exception '근무 조건이 너무 깁니다 (200자)';
  end if;
  if v_contact is null then
    raise exception '연락처를 적어 주세요';
  end if;
  if char_length(v_contact) > 100 then
    raise exception '연락처가 너무 깁니다';
  end if;

  -- ⚠️ 동의 시각 — 미래이거나 하루 넘게 지난 것은 받지 않습니다
  if p->>'agree_at' is null then
    raise exception '개인정보 수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes'
     or (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의 시각이 올바르지 않습니다';
  end if;

  -- 마감일 — 선택입니다
  if nullif(btrim(coalesce(p->>'close_at','')), '') is not null then
    begin
      v_close := (p->>'close_at')::date;
    exception when others then
      raise exception '마감일이 올바르지 않습니다';
    end;
    if v_close < current_date then
      raise exception '지난 날짜로는 마감일을 잡을 수 없습니다';
    end if;
    if v_close > current_date + interval '365 days' then
      raise exception '마감일이 너무 멉니다 (1년 안으로)';
    end if;
  end if;

  -- ⚠️⚠️ **업체 이름으로 올리는 것은 고르는 것입니다.** 켰으면
  --   승인된 · 검사용이 아닌 업체여야 합니다 — 보낸 값은 안 믿고
  --   `my_provider()` 에서 읽습니다.
  if v_aspro then
    v_pv := my_provider();
    if v_pv is null then
      raise exception '업체 이름으로 올리려면 업체 담당자로 로그인하셔야 합니다';
    end if;
    if not coalesce((select pv.state = 'approved' and pv.is_test = false
                       from provider pv where pv.id = v_pv), false) then
      raise exception '승인된 업체만 업체 이름으로 올릴 수 있습니다';
    end if;
  end if;

  -- ⚠️⚠️ **쏟아붓기 막기.** 한 사람이 글을 백 개 올리면 목록이 통째로
  --   쓸모없어집니다. 열려 있는 글은 **한 번에 열**까지.
  --   ⚠️ 마감 · 내린 글은 안 셉니다 (마감하고 다시 올리는 것은 정상).
  if (select count(*) from jobpost
       where by_user = v_uid and state = 'open') >= 10 then
    raise exception '올려 두신 글이 열입니다. 먼저 마감해 주세요';
  end if;
  if (select count(*) from jobpost
       where by_user = v_uid and created_at > now() - interval '1 day') >= 20 then
    raise exception '오늘은 더 올릴 수 없습니다 (하루 스무 개)';
  end if;

  insert into jobpost (by_user, provider_id, kind, sub, region, title, body,
                       pay, terms, close_at, contact, agree_at)
  values (v_uid, v_pv, v_kind, v_sub, v_region, v_title, v_body,
          v_pay, v_terms, v_close, v_contact, (p->>'agree_at')::timestamptz)
  returning id into v_id;
  return v_id;
end $$;
grant execute on function open_jobpost(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑥ 문 — 지원 · 제안을 보냅니다
-- ════════════════════════════════════════════════════════════════════
create or replace function apply_jobpost(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_post    uuid := nullif(btrim(coalesce(p->>'post_id','')), '')::uuid;
  v_msg     text := nullif(btrim(coalesce(p->>'msg','')), '');
  v_contact text := nullif(btrim(coalesce(p->>'contact','')), '');
  v_owner   uuid;
  v_state   text;
  v_close   date;
  v_id      uuid;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  if v_post is null then
    raise exception '어느 글인지 알 수 없습니다';
  end if;
  select j.by_user, j.state, j.close_at into v_owner, v_state, v_close
    from jobpost j where j.id = v_post;
  if v_owner is null then
    raise exception '그런 글이 없습니다';
  end if;
  -- ⚠️ 제 글에는 못 넣습니다 (후기에서 겪은 자리와 같습니다)
  if coalesce(v_owner = v_uid, false) then
    raise exception '올리신 글에는 지원하실 수 없습니다';
  end if;
  if v_state <> 'open' then
    raise exception '마감된 글입니다';
  end if;
  if v_close is not null and v_close < current_date then
    raise exception '마감일이 지난 글입니다';
  end if;
  if v_contact is null then
    raise exception '연락처를 적어 주세요';
  end if;
  if char_length(v_contact) > 100 then
    raise exception '연락처가 너무 깁니다';
  end if;
  if v_msg is not null and char_length(v_msg) > 1000 then
    raise exception '하실 말씀이 너무 깁니다 (1000자)';
  end if;
  if p->>'agree_at' is null then
    raise exception '개인정보 수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes'
     or (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의 시각이 올바르지 않습니다';
  end if;

  -- ⚠️ 쏟아붓기 — 하루 스무 건까지
  if (select count(*) from jobapply
       where by_user = v_uid and created_at > now() - interval '1 day') >= 20 then
    raise exception '오늘은 더 보낼 수 없습니다 (하루 스무 건)';
  end if;

  -- ⚠️⚠️ 같은 글에 두 번 — unique 가 막지만 **말이 알아들을 수 없습니다**
  --   (중복 키 오류가 손님 화면에 그대로 나갑니다). 여기서 먼저 봅니다.
  if exists (select 1 from jobapply
              where post_id = v_post and by_user = v_uid) then
    raise exception '이미 보내셨습니다 — 내 정보에서 보실 수 있습니다';
  end if;

  insert into jobapply (post_id, by_user, msg, contact, agree_at)
  values (v_post, v_uid, v_msg, v_contact, (p->>'agree_at')::timestamptz)
  returning id into v_id;
  return v_id;
end $$;
grant execute on function apply_jobpost(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑦ 문 — 지원을 수락 · 거절 · 거둡니다
-- ════════════════════════════════════════════════════════════════════
create or replace function move_jobapply(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_id    uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_to    text := nullif(btrim(coalesce(p->>'state','')), '');
  v_owner uuid;
  v_by    uuid;
  v_st    text;
  v_pst   text;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 지원인지 알 수 없습니다'; end if;
  if v_to not in ('accepted','rejected','canceled') then
    raise exception '옮길 수 없는 상태입니다';
  end if;

  -- ⚠️⚠️ **글 줄을 먼저 잠급니다.** 안 잠그면 둘을 동시에 수락할 때
  --   둘 다 "아직 괜찮다" 로 읽습니다 (0046 에서 겪은 자리).
  select j.by_user, j.state, a.by_user, a.state
    into v_owner, v_pst, v_by, v_st
    from jobapply a join jobpost j on j.id = a.post_id
   where a.id = v_id
     for update of j;
  if v_by is null then raise exception '그런 지원이 없습니다'; end if;

  if v_to = 'canceled' then
    -- 거두는 것은 **보낸 사람만**
    if not coalesce(v_by = v_uid, false) then
      raise exception '보내신 분만 거두실 수 있습니다';
    end if;
    if v_st <> 'applied' then
      raise exception '이미 처리된 지원입니다';
    end if;
    update jobapply set state = 'canceled' where id = v_id;
    return 'canceled';
  end if;

  -- 수락 · 거절은 **글쓴이만**
  if not coalesce(v_owner = v_uid, false) then
    raise exception '올리신 분만 수락 · 거절하실 수 있습니다';
  end if;
  if v_st <> 'applied' then
    raise exception '이미 처리된 지원입니다';
  end if;
  if v_pst <> 'open' then
    raise exception '마감된 글입니다';
  end if;
  update jobapply set state = v_to where id = v_id;
  return v_to;
end $$;
grant execute on function move_jobapply(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑧ 문 — 글을 마감 · 내립니다 (운영자는 가립니다)
-- ════════════════════════════════════════════════════════════════════
create or replace function move_jobpost(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_to  text := nullif(btrim(coalesce(p->>'state','')), '');
  v_why text := nullif(btrim(coalesce(p->>'why','')), '');
  v_by  uuid;
  v_st  text;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 글인지 알 수 없습니다'; end if;
  select by_user, state into v_by, v_st from jobpost where id = v_id for update;
  if v_by is null then raise exception '그런 글이 없습니다'; end if;

  if v_to in ('closed','dropped') then
    -- 마감 · 내리기는 **글쓴이만**
    if not coalesce(v_by = v_uid, false) then
      raise exception '올리신 분만 마감 · 내리실 수 있습니다';
    end if;
    if v_st = 'hidden' then
      raise exception '운영자가 가린 글은 글쓴이가 옮길 수 없습니다';
    end if;
    if v_st = v_to then
      raise exception '이미 그 상태입니다';
    end if;
    if v_st = 'dropped' then
      raise exception '이미 내려간 글입니다';
    end if;
    update jobpost set state = v_to, updated_at = now() where id = v_id;
    return v_to;
  elsif v_to = 'hidden' then
    -- 가리는 것은 **운영자만** — 까닭이 반드시 있어야 합니다
    if not coalesce(my_role() in ('staff','admin'), false) then
      raise exception '가리는 것은 운영자만 할 수 있습니다';
    end if;
    if v_why is null or char_length(v_why) < 5 then
      raise exception '가리는 까닭을 다섯 글자 이상 적어 주세요';
    end if;
    update jobpost set state = 'hidden', hidden_why = v_why, hidden_by = v_uid,
                       hidden_at = now(), updated_at = now() where id = v_id;
    -- ⚠️ 감사 기록에 **글 내용을 넣지 않습니다** — 번호로 찾아갑니다
    insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
    values (v_uid, my_role(), 'jobpost', v_id::text, 'hidden',
            jsonb_build_object('why_len', char_length(v_why)));
    return 'hidden';
  end if;
  raise exception '옮길 수 없는 상태입니다';
end $$;
grant execute on function move_jobpost(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑨ 문 — 올린 글을 고칩니다
--   ⚠️⚠️ **분류 · 갈래는 여기서 못 바꿉니다** — 바꾸면 들어온 지원이
--   전혀 다른 자리로 옮겨 갑니다 (커뮤니티의 cat 과 같은 자리).
--   ⚠️ 운영자가 **가린** 글은 글쓴이도 못 고칩니다 (고쳐서 가린 뜻을
--   지울 수 없습니다).
-- ════════════════════════════════════════════════════════════════════
create or replace function edit_jobpost(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_id      uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_title   text := nullif(btrim(coalesce(p->>'title','')), '');
  v_body    text := nullif(btrim(coalesce(p->>'body','')), '');
  v_pay     text := nullif(btrim(coalesce(p->>'pay','')), '');
  v_terms   text := nullif(btrim(coalesce(p->>'terms','')), '');
  v_contact text := nullif(btrim(coalesce(p->>'contact','')), '');
  v_close   date;
  v_by      uuid;
  v_st      text;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 글인지 알 수 없습니다'; end if;
  select by_user, state into v_by, v_st from jobpost where id = v_id for update;
  if v_by is null then raise exception '그런 글이 없습니다'; end if;
  if not coalesce(v_by = v_uid, false) then
    raise exception '올리신 분만 고치실 수 있습니다';
  end if;
  if v_st = 'hidden' then
    raise exception '운영자가 가린 글은 고치실 수 없습니다';
  end if;
  if v_st = 'dropped' then
    raise exception '내리신 글은 고치실 수 없습니다';
  end if;

  if v_title is null or char_length(v_title) < 2 then
    raise exception '제목을 두 글자 이상 적어 주세요';
  end if;
  if char_length(v_title) > 60 then
    raise exception '제목이 너무 깁니다 (60자)';
  end if;
  if v_body is null or char_length(v_body) < 5 then
    raise exception '내용을 다섯 글자 이상 적어 주세요';
  end if;
  if char_length(v_body) > 2000 then
    raise exception '내용이 너무 깁니다 (2000자)';
  end if;
  if v_pay is not null and char_length(v_pay) > 60 then
    raise exception '급여 칸이 너무 깁니다 (60자)';
  end if;
  if v_terms is not null and char_length(v_terms) > 200 then
    raise exception '근무 조건이 너무 깁니다 (200자)';
  end if;
  -- ⚠️⚠️ **연락처는 보낸 것으로 덮습니다** — 양식이 그 칸을 빠뜨리면
  --   지워집니다. 그래서 비워 보내는 것은 거절합니다
  --   (`save_provider_self` 에서 겪은 자리).
  if v_contact is null then
    raise exception '연락처를 적어 주세요';
  end if;
  if char_length(v_contact) > 100 then
    raise exception '연락처가 너무 깁니다';
  end if;

  if nullif(btrim(coalesce(p->>'close_at','')), '') is not null then
    begin
      v_close := (p->>'close_at')::date;
    exception when others then
      raise exception '마감일이 올바르지 않습니다';
    end;
    if v_close < current_date then
      raise exception '지난 날짜로는 마감일을 잡을 수 없습니다';
    end if;
    if v_close > current_date + interval '365 days' then
      raise exception '마감일이 너무 멉니다 (1년 안으로)';
    end if;
  end if;

  update jobpost
     set title = v_title, body = v_body, pay = v_pay, terms = v_terms,
         close_at = v_close, contact = v_contact, updated_at = now()
   where id = v_id;
  return v_id;
end $$;
grant execute on function edit_jobpost(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑩ 문 — **제** 연락처를 엽니다 · 닫습니다
--   ⚠️⚠️⚠️ 제17조 제2항의 "별도 동의" 가 여기입니다. 수락과 **다른
--   결정**이고, 각자 **제 것만** 열고 **언제든 닫습니다**(철회권).
-- ════════════════════════════════════════════════════════════════════
create or replace function share_jobcontact(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_id    uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_on    boolean := coalesce((p->>'on')::boolean, false);
  v_owner uuid;
  v_by    uuid;
  v_st    text;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 지원인지 알 수 없습니다'; end if;
  select j.by_user, a.by_user, a.state into v_owner, v_by, v_st
    from jobapply a join jobpost j on j.id = a.post_id
   where a.id = v_id for update of a;
  if v_by is null then raise exception '그런 지원이 없습니다'; end if;
  -- ⚠️ 수락된 뒤에만 — 수락 전에 열면 "누구에게 주는지" 가 정해지기
  --   전에 주는 것입니다 (제17조 제2항).
  if v_st <> 'accepted' then
    raise exception '수락된 뒤에 열 수 있습니다';
  end if;

  if coalesce(v_owner = v_uid, false) then
    update jobapply
       set host_share_at = case when v_on then now() else null end
     where id = v_id;
    return case when v_on then 'host-on' else 'host-off' end;
  elsif coalesce(v_by = v_uid, false) then
    update jobapply
       set guest_share_at = case when v_on then now() else null end
     where id = v_id;
    return case when v_on then 'guest-on' else 'guest-off' end;
  end if;
  raise exception '그 지원의 당사자만 열 수 있습니다';
end $$;
grant execute on function share_jobcontact(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑪ 신고 — ⚠️ **새 표를 만들지 않습니다.** `report` 에 칸을 더합니다
-- ════════════════════════════════════════════════════════════════════
alter table report add column if not exists jobpost_id uuid references jobpost(id) on delete cascade;
alter table report drop constraint if exists report_target_ck;
alter table report add  constraint report_target_ck check (
  request_id is not null or provider_id is not null or review_id is not null
  or joinroom_id is not null or cq_id is not null or ca_id is not null
  or jobpost_id is not null);


-- ⚠️⚠️ **open_report 를 갈아 끼웁니다** (0047 → 0048). 0047 의 본문을
--   **그대로 꺼내** 네 군데만 끼웠습니다 — 손으로 다시 쓰면 0040 ·
--   0046 · 0047 이 하던 일이 조용히 사라집니다.
create or replace function open_report(p jsonb)
  returns uuid language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_kind text := coalesce(nullif(btrim(p->>'kind'), ''), 'abuse');
  v_req  uuid := nullif(btrim(coalesce(p->>'request', '')), '')::uuid;
  v_pv   text := nullif(btrim(coalesce(p->>'provider', '')), '');
  v_rv   uuid := nullif(btrim(coalesce(p->>'review', '')), '')::uuid;
  -- ⚠️ 0046 — 조인 자리도 신고할 수 있습니다 (새 표를 만들지 않습니다)
  v_jr   uuid := nullif(btrim(coalesce(p->>'joinroom', '')), '')::uuid;
  -- ⚠️ 0047 — 커뮤니티 질문 · 답변도 신고할 수 있습니다
  v_cq   uuid := nullif(btrim(coalesce(p->>'question', '')), '')::uuid;
  v_ca   uuid := nullif(btrim(coalesce(p->>'answer', '')), '')::uuid;
  -- ⚠️ 0048 — 구인 · 구직 · 제휴 글도 신고할 수 있습니다
  v_jp   uuid := nullif(btrim(coalesce(p->>'jobpost', '')), '')::uuid;
  v_body text := btrim(coalesce(p->>'body', ''));
  v_id   uuid;
  v_dup  int;
begin
  if v_me is null then raise exception '신고는 로그인한 뒤에 하실 수 있습니다'; end if;
  if v_kind not in ('abuse','dispute') then
    raise exception '신고 · 분쟁 중 하나로 적어 주세요';
  end if;
  if v_req is null and v_pv is null and v_rv is null and v_jr is null
     and v_cq is null and v_ca is null and v_jp is null then
    raise exception '무엇에 대한 것인지 적어 주세요 (요청 · 업체 · 후기 · 조인 · 글 가운데 하나)';
  end if;
  if char_length(v_body) < 5 then
    raise exception '무슨 일이 있었는지 다섯 글자 이상 적어 주세요';
  end if;
  if char_length(v_body) > 2000 then
    raise exception '신고 내용은 이천 글자까지입니다';
  end if;

  -- ⚠️⚠️ **분쟁은 그 요청의 당사자만** 엽니다. 아무나 "저 거래가
  --   이상합니다" 라고 열 수 있으면 분쟁이 아니라 신고입니다.
  if v_kind = 'dispute' then
    if v_req is null then raise exception '분쟁은 어느 요청인지 적어야 합니다'; end if;
    if not (coalesce(is_my_request(v_req), false)
            or coalesce(exists (select 1 from assignment a
                                 where a.request_id = v_req
                                   and a.provider_id = my_provider()), false)
            or coalesce(my_role() in ('staff','admin'), false)) then
      raise exception '그 거래의 당사자만 분쟁을 열 수 있습니다';
    end if;
  end if;

  -- ⚠️⚠️ **같은 것을 두 번 열지 않습니다.** 누르는 손이 미끄러지면
  --   같은 신고가 둘이 되고, 운영자는 그것을 두 번 읽습니다.
  select count(*) into v_dup from report
   where by_user = v_me and kind = v_kind and state in ('open','reviewing')
     and request_id is not distinct from v_req
     and provider_id is not distinct from v_pv
     and review_id is not distinct from v_rv
     and joinroom_id is not distinct from v_jr
     and cq_id is not distinct from v_cq
     and ca_id is not distinct from v_ca
     and jobpost_id is not distinct from v_jp;
  if v_dup > 0 then
    raise exception '같은 건으로 이미 접수된 것이 있습니다 — 운영자가 보고 있습니다';
  end if;

  insert into report (kind, request_id, provider_id, review_id, joinroom_id,
                      cq_id, ca_id, jobpost_id, by_user, body)
  values (v_kind, v_req, v_pv, v_rv, v_jr, v_cq, v_ca, v_jp, v_me, v_body)
  returning id into v_id;

  -- ⚠️ 감사 기록에 **신고 본문을 넣지 않습니다** — audit_log 는 오래
  --   남고 보는 사람도 넓습니다. 번호로 찾아갑니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'report', v_id::text, 'open',
          jsonb_build_object('kind', v_kind));
  return v_id;
end $$;

revoke all on function open_report(jsonb) from public;
grant execute on function open_report(jsonb) to authenticated;

insert into schema_version (n, name) values (48, '0048_career')
  on conflict (n) do nothing;

commit;

/* ---------------------------- 0049_join_hide.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0049 — 조인 자리를 **운영자가 가립니다**
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **왜 필요한가 — 신고를 받아 놓고 할 수 있는 일이 없었습니다.**
--   0046 이 `report.joinroom_id` 를 더해 조인 자리를 신고할 수 있게
--   했는데, 운영자가 그 자리를 **내릴 길이 없었습니다**. 닫는 문
--   (`close_joinroom`)은 **연 사람만** 쓸 수 있습니다 — 전화번호를
--   본문에 적어 둔 자리나 욕설이 적힌 자리를 신고받아도 운영자는
--   "처리했음" 만 누를 수 있었습니다. 그건 처리한 것이 아닙니다.
--   ⚠️ 커뮤니티(0047)와 인력(0048)에는 그 길이 있습니다 — 조인만
--   빠져 있었습니다.
--
-- ⚠️⚠️ **까닭이 반드시 있습니다.** 까닭 없이 가릴 수 있으면 불평할
--   때마다 내려 주는 자리가 됩니다. 문에서도 막고 표의 check 로도
--   막습니다 (문이 내려가는 날 그 줄이 남습니다).
--   ⚠️ 그 까닭은 **연 사람에게 보여 줍니다** (`/my` 가 찍습니다) —
--   무엇이 문제였는지 모르면 다시 열 때도 같은 일을 합니다.
--
-- ⚠️⚠️ **고치는 문을 늘리지 않았습니다.** 0046 의 `apply_joinroom` ·
--   `edit_joinroom` · `close_joinroom` 은 모두 `state = 'open'` 을
--   요구하므로, 상태 하나를 더하는 것만으로 **새 신청 · 고치기 ·
--   닫기가 저절로 막힙니다.** 셋을 손대면 0046 이 하던 일이 조용히
--   사라질 수 있습니다 (갈아 끼우는 자리를 안 늘립니다).
--
-- ⚠️ **이미 수락된 짝의 연락처는 그대로 둡니다.** 가린다고 되돌릴 수
--   없습니다 — 상대는 이미 번호를 보았습니다. 거짓 안심을 주는 것보다
--   사실대로 두고, 당사자가 **스스로 닫는** 길(`share_joincontact`)을
--   그대로 둡니다.
--
-- ⚠️ 공개 목록(`v_join_open`)은 `state = 'open'` 만 내므로 **보기를
--   건드리지 않습니다** — 가린 자리는 그 자리에서 빠집니다 (보기를
--   다시 만들면 0046 을 다시 붙여 넣는 날 되돌아갑니다).
--
-- 되돌아갔는지 보는 법
--   select 1 from pg_proc where proname = 'move_joinroom';   -- 있어야 합니다
--   select pg_get_constraintdef(oid) from pg_constraint
--    where conname = 'joinroom_state_check';                 -- hidden 이 있어야
-- ════════════════════════════════════════════════════════════════════
begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 상태 하나를 더합니다 — hidden
-- ════════════════════════════════════════════════════════════════════
alter table joinroom add column if not exists hidden_why text;
alter table joinroom add column if not exists hidden_by  uuid
  references auth.users(id) on delete set null;
alter table joinroom add column if not exists hidden_at  timestamptz;

-- ⚠️ 0046 이 인라인 check 로 적어 두어 이름이 `joinroom_state_check`
--   입니다 (Postgres 가 지어 준 이름). 그 이름으로 떼고 다시 답니다.
alter table joinroom drop constraint if exists joinroom_state_check;
alter table joinroom add  constraint joinroom_state_check
  check (state in ('open','closed','done','hidden'));

-- ⚠️⚠️ 까닭 없이 가릴 수 없습니다 — **문이 내려가도 이 줄이 남습니다**
do $$ begin
  alter table joinroom add constraint joinroom_hidden_ck
    check (state <> 'hidden' or btrim(coalesce(hidden_why,'')) <> '');
exception when duplicate_object then null; end $$;

-- ⚠️ 칸 단위 GRANT 는 **더하는 것**입니다 — 0046 이 준 것은 그대로
--   두고 가린 까닭만 얹습니다 (연 사람이 제 화면에서 읽습니다).
--   ⚠️ `contact` 와 `agree_at` 은 **여전히 안 줍니다.**
grant select (hidden_why, hidden_at) on joinroom to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ② 문 — 운영자가 가립니다
--   ⚠️ 연 사람이 닫는 길은 `close_joinroom` 그대로입니다. 가리는 것과
--   닫는 것은 **다른 일**이라 문을 갈라 둡니다 (닫은 자리는 다시
--   열 수 있지만, 가린 자리는 운영자가 가린 것입니다).
-- ════════════════════════════════════════════════════════════════════
create or replace function move_joinroom(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_to  text := nullif(btrim(coalesce(p->>'state','')), '');
  v_why text := nullif(btrim(coalesce(p->>'why','')), '');
  v_st  text;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 자리인지 알 수 없습니다'; end if;
  if v_to <> 'hidden' then
    raise exception '옮길 수 없는 상태입니다';
  end if;
  -- ⚠️⚠️ 가리는 것은 **운영자만**입니다
  if not coalesce(my_role() in ('staff','admin'), false) then
    raise exception '가리는 것은 운영자만 할 수 있습니다';
  end if;
  if v_why is null or char_length(v_why) < 5 then
    raise exception '가리는 까닭을 다섯 글자 이상 적어 주세요';
  end if;

  select state into v_st from joinroom where id = v_id for update;
  if v_st is null then raise exception '그런 자리가 없습니다'; end if;
  if v_st = 'hidden' then raise exception '이미 가려진 자리입니다'; end if;

  update joinroom set state = 'hidden', hidden_why = v_why,
                      hidden_by = v_uid, hidden_at = now(),
                      updated_at = now()
   where id = v_id;

  -- ⚠️ 감사 기록에 **본문을 넣지 않습니다** — audit_log 는 오래 남고
  --   보는 사람도 넓습니다. 번호로 찾아갑니다.
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, data)
  values (v_uid, my_role(), 'joinroom', v_id::text, v_st, 'hidden',
          jsonb_build_object('why_len', char_length(v_why)));
  return 'hidden';
end $$;
revoke all on function move_joinroom(jsonb) from public;
grant execute on function move_joinroom(jsonb) to authenticated;

insert into schema_version (n, name) values (49, '0049_join_hide')
  on conflict (n) do nothing;

commit;

/* ---------------------------- 0050_notice.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0050 — 내부 알림 (밖으로 **안 보냅니다**)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **왜 "내부" 인가.** 문자 · 카톡 · 메일을 보내는 순간 —
--   ① 정보통신망법 제50조가 걸립니다 ((광고) 표기 · 보내는 사람 ·
--      수신거부 · 21시~08시 금지)
--   ② 발송사가 **수탁자**가 되어 개인정보처리방침에 그 회사를 적어야
--      합니다 (제26조 · 미국 회사면 나라까지 — 제28조의8)
--   ③ 환경변수가 하나 더 늘고, 그것이 비면 **조용히 안 보내집니다**
--   셋은 늘 같이 움직입니다. 그래서 지금은 **화면에서만** 알립니다 —
--   보내는 곳이 없으니 수탁자도 늘지 않고, 안 보내진 줄 모르는 일도
--   없습니다. ⚠️ 밖으로 보내기 시작하는 날 **방침의 수탁자를 같은
--   날** 적으세요 (작업 기억의 그 줄).
--
-- ⚠️⚠️ **알림은 "무엇이 생겼다" 까지입니다.** 본문을 담는 칸이 아예
--   없습니다 — 담으면 손님이 적은 글이 그대로 한 벌 더 복사되고, 그
--   안에 전화번호가 들어 있으면 **알림이 연락처를 나르는 길**이 됩니다
--   (감사 기록에 성함 · 연락처를 안 넣는 것과 같은 까닭).
--   제목은 우리가 쓴 **정해진 말**이고, 자세한 것은 가는 자리에서
--   그 사람의 권한으로 봅니다.
--
-- ⚠️⚠️ **가는 주소는 우리 주소만** 받습니다 (`/` 로 시작하고 `//` 는
--   아님). 지금은 트리거가 짓지만, 바깥 주소가 들어갈 수 있는 칸을
--   열어 두면 그것이 열린 넘겨주기(open redirect)입니다.
--
-- ⚠️ **문을 갈아 끼우지 않았습니다.** 알림은 **트리거**로 답니다 —
--   `make_quote` · `apply_jobpost` 같은 문을 다시 쓰면 0008 · 0048 이
--   하던 일이 조용히 사라질 수 있습니다 (앞 번호를 덮는 짝이 또 늡니다).
--
-- 되돌아갔는지 보는 법
--   select 1 from pg_proc where proname = 'read_notice';   -- 있어야 합니다
--   select count(*) from pg_trigger where tgname like 'notice_%_t';  -- 7 이어야
-- ════════════════════════════════════════════════════════════════════
begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 알림 한 줄
-- ════════════════════════════════════════════════════════════════════
create table if not exists notice (
  id         uuid primary key default gen_random_uuid(),
  to_user    uuid not null references auth.users(id) on delete cascade,
  -- ⚠️ 갈래는 정해진 것만 — 화면이 아이콘 · 말을 가릅니다
  kind       text not null check (kind in
               ('quote','jobapply','jobmoved','joinapply','joinmoved',
                'answer','hidden')),
  -- ⚠️⚠️ **우리가 쓴 말**입니다 (손님이 적은 글이 아닙니다)
  title      text not null check (btrim(title) <> '' and char_length(title) <= 60),
  -- ⚠️⚠️⚠️ **우리 주소만** — `/` 로 시작하고 `//` 는 아닙니다
  link       text not null check (
               link like '/%' and link not like '//%' and char_length(link) <= 120),
  -- 어디에 달린 알림인가 (번호로 찾아갑니다 — 내용은 안 담습니다)
  obj        text,
  obj_id     text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notice_mine_idx
  on notice (to_user, created_at desc);
create index if not exists notice_unread_idx
  on notice (to_user) where read_at is null;

-- ════════════════════════════════════════════════════════════════════
-- ② 자물쇠 — ⚠️ **제 알림만** 읽습니다
--   운영자 정책을 **두지 않습니다** — 남의 알림을 읽을 까닭이 없습니다
--   (후기에서 "로그인한 아무나 읽는다" 를 두었다가 고친 자리와 같은 결).
-- ════════════════════════════════════════════════════════════════════
alter table notice enable row level security;

drop policy if exists notice_mine on notice;
create policy notice_mine on notice for select
  using (to_user = auth.uid());

-- ⚠️ `to_user` 를 **안 줍니다** — 늘 제 것이라 화면이 쓸 일이 없고,
--   주면 그 칸으로 무엇을 할 수 있는지 다시 따져야 합니다.
-- ⚠️⚠️ 쓰기는 **한 줄도 주지 않습니다** — 트리거가 넣고 문이 읽음으로
--   바꿉니다.
grant select (id, kind, title, link, obj, obj_id, read_at, created_at)
  on notice to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ③ 안쪽 도움함수 — ⚠️ **문이 아닙니다** (아무에게도 GRANT 하지
--   않습니다). 트리거만 부릅니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function notify_one(
  p_to uuid, p_kind text, p_title text, p_link text,
  p_obj text, p_obj_id text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  -- ⚠️ 받을 사람이 없으면 조용히 끝냅니다. 로그인 없이 들어온 요청은
  --   `request.user_id` 가 비어 있습니다 (못 보내는 것이 맞습니다).
  if p_to is null then return; end if;
  -- ⚠️⚠️ **제가 한 일은 제게 안 알립니다.** 제 질문에 제가 답을 달면
  --   "답변이 달렸습니다" 가 저에게 오는 꼴입니다.
  if p_to = auth.uid() then return; end if;
  -- ⚠️⚠️ **안 읽은 같은 알림이 있으면 더 쌓지 않습니다.** 답변이 열 개
  --   달리면 "답변이 달렸습니다" 가 열 줄이 되고, 그러면 목록이
  --   쓸모없어집니다 (읽은 뒤에는 다시 옵니다).
  if exists (select 1 from notice
              where to_user = p_to and kind = p_kind
                and obj is not distinct from p_obj
                and obj_id is not distinct from p_obj_id
                and read_at is null) then
    return;
  end if;
  insert into notice (to_user, kind, title, link, obj, obj_id)
  values (p_to, p_kind, p_title, p_link, p_obj, p_obj_id);
end $$;

-- ════════════════════════════════════════════════════════════════════
-- ④ 트리거 — 견적이 왔습니다
-- ════════════════════════════════════════════════════════════════════
create or replace function notice_quote() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_to uuid;
begin
  select r.user_id into v_to from request r where r.id = new.request_id;
  perform notify_one(v_to, 'quote', '받으신 견적이 하나 늘었습니다',
                     '/my', 'request', new.request_id::text);
  return null;
end $$;
drop trigger if exists notice_quote_t on quote;
create trigger notice_quote_t after insert on quote
  for each row execute function notice_quote();

-- ════════════════════════════════════════════════════════════════════
-- ⑤ 트리거 — 구인 · 구직에 지원이 들어왔습니다 · 처리되었습니다
-- ════════════════════════════════════════════════════════════════════
create or replace function notice_jobapply() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_to uuid;
begin
  select j.by_user into v_to from jobpost j where j.id = new.post_id;
  perform notify_one(v_to, 'jobapply', '올리신 글에 지원 · 제안이 들어왔습니다',
                     '/my', 'jobpost', new.post_id::text);
  return null;
end $$;
drop trigger if exists notice_jobapply_t on jobapply;
create trigger notice_jobapply_t after insert on jobapply
  for each row execute function notice_jobapply();

create or replace function notice_jobmoved() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- ⚠️ 거둔 것(canceled)은 **제가 한 일**이라 안 알립니다
  if new.state = old.state or new.state not in ('accepted','rejected') then
    return null;
  end if;
  perform notify_one(new.by_user, 'jobmoved',
    case when new.state = 'accepted' then '보내신 지원이 수락되었습니다'
         else '보내신 지원이 거절되었습니다' end,
    '/my', 'jobapply', new.id::text);
  return null;
end $$;
drop trigger if exists notice_jobmoved_t on jobapply;
create trigger notice_jobmoved_t after update of state on jobapply
  for each row execute function notice_jobmoved();

-- ════════════════════════════════════════════════════════════════════
-- ⑥ 트리거 — 조인 신청이 들어왔습니다 · 처리되었습니다
-- ════════════════════════════════════════════════════════════════════
create or replace function notice_joinapply() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_to uuid;
begin
  select r.by_user into v_to from joinroom r where r.id = new.room_id;
  perform notify_one(v_to, 'joinapply', '여신 조인 자리에 신청이 들어왔습니다',
                     '/my', 'joinroom', new.room_id::text);
  return null;
end $$;
drop trigger if exists notice_joinapply_t on joinapply;
create trigger notice_joinapply_t after insert on joinapply
  for each row execute function notice_joinapply();

create or replace function notice_joinmoved() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.state = old.state or new.state not in ('accepted','rejected') then
    return null;
  end if;
  perform notify_one(new.by_user, 'joinmoved',
    case when new.state = 'accepted' then '조인 신청이 수락되었습니다'
         else '조인 신청이 거절되었습니다' end,
    '/my', 'joinapply', new.id::text);
  return null;
end $$;
drop trigger if exists notice_joinmoved_t on joinapply;
create trigger notice_joinmoved_t after update of state on joinapply
  for each row execute function notice_joinmoved();

-- ════════════════════════════════════════════════════════════════════
-- ⑦ 트리거 — 제 질문에 답변이 달렸습니다
-- ════════════════════════════════════════════════════════════════════
create or replace function notice_answer() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_to uuid;
begin
  select q.by_user into v_to from cq q where q.id = new.q_id;
  perform notify_one(v_to, 'answer', '올리신 질문에 답변이 달렸습니다',
                     '/cat/community', 'cq', new.q_id::text);
  return null;
end $$;
drop trigger if exists notice_answer_t on ca;
create trigger notice_answer_t after insert on ca
  for each row execute function notice_answer();

-- ════════════════════════════════════════════════════════════════════
-- ⑧ 트리거 — 운영자가 글을 가렸습니다
--   ⚠️⚠️ **까닭을 알림에 담지 않습니다** — 그 까닭은 그 사람의 화면
--   (`/my`)에서 그 사람 권한으로 봅니다. 알림은 "가렸습니다" 까지입니다.
--   ⚠️ 가린 까닭에는 신고 내용이 섞이기 쉽고, 알림은 오래 남습니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function notice_hidden() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.state <> 'hidden' or old.state = 'hidden' then return null; end if;
  perform notify_one(new.by_user, 'hidden',
    '올리신 글이 운영자에 의해 가려졌습니다', '/my',
    tg_table_name, new.id::text);
  return null;
end $$;
drop trigger if exists notice_hidden_cq_t on cq;
create trigger notice_hidden_cq_t after update of state on cq
  for each row execute function notice_hidden();
drop trigger if exists notice_hidden_job_t on jobpost;
create trigger notice_hidden_job_t after update of state on jobpost
  for each row execute function notice_hidden();

-- ════════════════════════════════════════════════════════════════════
-- ⑨ 문 — 읽음으로 바꿉니다
--   ⚠️⚠️ **RLS 는 UPDATE 에서 에러를 내지 않습니다** — 보이지 않는 줄은
--   그냥 안 걸릴 뿐입니다. 그래서 여기서 `to_user = auth.uid()` 를
--   **직접** 적고, **바뀐 줄 수**를 돌려줍니다 (0 이면 아무것도 안
--   바뀐 것이고, 검사가 그것을 봅니다).
-- ════════════════════════════════════════════════════════════════════
create or replace function read_notice(p jsonb)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_all boolean := coalesce((p->>'all')::boolean, false);
  v_n   int;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_all then
    update notice set read_at = now()
     where to_user = v_uid and read_at is null;
    get diagnostics v_n = row_count;
    return v_n;
  end if;
  if v_id is null then raise exception '어느 알림인지 알 수 없습니다'; end if;
  update notice set read_at = now()
   where id = v_id and to_user = v_uid and read_at is null;
  get diagnostics v_n = row_count;
  -- ⚠️ 남의 알림을 가리켰는지 **갈라서 말하지 않습니다** — 갈라 주면
  --   번호를 바꿔 가며 "그 알림이 있는지" 를 확인할 수 있습니다.
  return v_n;
end $$;
revoke all on function read_notice(jsonb) from public;
grant execute on function read_notice(jsonb) to authenticated;

insert into schema_version (n, name) values (50, '0050_notice')
  on conflict (n) do nothing;

commit;
