/* ==================================================================
   0008 ~ 0019 를 한 번에 —
   Supabase SQL 편집기에 **이 파일을 통째로** 붙여 넣고 Run 하세요.
   ==================================================================
   WARN 빌드가 만드는 파일입니다 — 손으로 고치지 마세요.
   db/migrations 의 12개를 번호 차례로 이어 붙인 것이고
   한 글자도 바꾸지 않았습니다.

   이미 0007 까지 돌려 두신 DB 에 쓰는 것입니다.
   지금 몇 번째 판인지는 /admin 1번 칸이 말해 줍니다 (남은 파일
   이름까지). 그보다 앞선 판이면 db/README.md 의 차례대로 먼저
   올리세요 — 이 파일은 건너뛴 번호를 메워 주지 않습니다.

   돌린 뒤에는 db/verify.sql 을 붙여 넣어 **열세 줄이 전부 OK** 인지
   보세요. 중간에서 멈추면 그 파일 하나만 따로 돌리고 그 다음부터
   이어 가시면 됩니다 — 번호를 다시 쓰지 않습니다.

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
--   js/data/offers.js 에 상품 스물일곱이 있는데 DB 에는 한 줄도 넣는
--   코드가 없었습니다. 그래서 —
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
-- ════════════════════════════════════════════════════════════════════
insert into offer (id, name, lead, cats, industries, regions,
                   apply_type, needs_consult, cost_note, status) values
  ('store-internet', '매장 인터넷', '개통일을 맞추는 것이 전부입니다. 공사 일정과 함께 잡으세요.', array['it'], '{}', '{}', 'install', true, 'quote', 'info'::offer_status),
  ('pos-card', 'POS · 카드단말기', '카드 수수료와 단말기 비용은 다른 이야기입니다. 둘을 갈라서 보세요.', array['it'], '{}', '{}', 'install', true, 'quote', 'info'::offer_status),
  ('cctv-security', 'CCTV · 보안', '대수와 저장 기간이 값을 가릅니다. 녹화 보관은 법에 걸리는 부분이 있습니다.', array['it'], '{}', '{}', 'install', true, 'quote', 'info'::offer_status),
  ('water-ice-rental', '정수기 · 제빙기 렌탈', '사는 것과 빌리는 것의 차액은 계약 기간에서 갈립니다.', array['equip'], '{}', '{}', 'rental', true, 'quote', 'info'::offer_status),
  ('kiosk-order', '키오스크 · 테이블오더', '인건비를 줄이려는 것이라면 먼저 계산해 보세요.', array['it'], '{}', '{}', 'install', true, 'tool', 'info'::offer_status),
  ('interior-sign', '인테리어 · 간판', '평수보다 무엇을 뜯는가가 금액을 가릅니다.', array['interior'], '{}', '{}', 'quote', true, 'quote', 'info'::offer_status),
  ('kitchen-equip', '주방 · 업소용 장비', '새것과 중고의 차이는 값이 아니라 수리와 부품입니다.', array['equip'], '{}', '{}', 'quote', true, 'quote', 'info'::offer_status),
  ('demolish-restore', '철거 · 원상복구', '원상복구 범위는 계약서에 적힌 대로입니다. 먼저 그것부터 확인하세요.', array['demolish'], '{}', '{}', 'quote', true, 'quote', 'info'::offer_status),
  ('clean-disinfect', '청소 · 방역', '문 열기 전 한 번과 정기로 받는 것은 다른 계약입니다.', array['clean'], '{}', '{}', 'quote', false, 'quote', 'info'::offer_status),
  ('used-equip', '중고 시설 · 장비', '정리하시는 사장님의 것이 시작하시는 사장님에게 갑니다.', array['asset'], '{}', '{}', 'dispose', false, 'quote', 'info'::offer_status),
  ('signage', '간판 · 사인', '크기와 내달는 자리에 따라 구청 허가가 따로 필요할 수 있습니다.', array['interior'], '{}', '{}', 'quote', true, 'quote', 'info'::offer_status),
  ('hvac', '냉난방 · 공조', '평수보다 천장 높이와 주방 열이 용량을 가릅니다.', array['interior'], '{}', '{}', 'quote', true, 'quote', 'info'::offer_status),
  ('furniture-set', '가구 · 집기', '붙박이인지 떼어 옮길 수 있는지를 먼저 보세요 — 정리할 때 갈립니다.', array['furniture'], '{}', '{}', 'quote', true, 'quote', 'info'::offer_status),
  ('booking-order', '예약 · 주문 솔루션', '예약과 주문은 다른 프로그램일 때가 많습니다. 묶을 수 있는지 보세요.', array['it'], '{}', '{}', 'install', true, 'quote', 'info'::offer_status),
  ('marketing-svc', '오픈 마케팅', '문 열기 전에 해 두는 것과 열고 나서 하는 것이 다릅니다.', array['marketing'], '{}', '{}', 'quote', true, 'quote', 'info'::offer_status),
  ('food-supply', '식자재 거래처 연결', '품목마다 거래처가 다릅니다. 육류 · 수산 · 농산을 한 곳에서 받기는 어렵습니다.', array['supply'], '{}', '{}', 'quote', true, 'quote', 'info'::offer_status),
  ('consum-supply', '소모품 · 포장재 정기 공급', '배달용기는 단가보다 최소 수량이 부담인 경우가 많습니다.', array['supply'], '{}', '{}', 'quote', true, 'quote', 'info'::offer_status),
  ('equip-repair', '장비 수리 · 유지보수', '멈춘 뒤에 부르면 그날 장사가 안 됩니다. 정기 점검을 같이 보세요.', array['repair'], '{}', '{}', 'quote', false, 'quote', 'info'::offer_status),
  ('regular-clean', '정기 청소 · 방역', '한 번 받는 것과 주기로 받는 것은 다른 계약입니다.', array['clean'], '{}', '{}', 'quote', false, 'quote', 'info'::offer_status),
  ('place-mkt', '플레이스 · 리뷰 관리', '검색해서 찾아오는 손님이 여기서 갈립니다.', array['marketing'], '{}', '{}', 'quote', true, 'quote', 'info'::offer_status),
  ('tax-labor', '세무 · 노무 기장', '직원이 생기면 노무가 같이 따라옵니다.', array['admin'], '{}', '{}', 'quote', true, 'quote', 'info'::offer_status),
  ('transfer-ready', '매장 양도 준비', '넘기기 전에 임대차 승계와 시설 범위를 먼저 정리합니다.', array['transfer'], '{}', '{}', 'quote', true, 'quote', 'info'::offer_status),
  ('store-photo', '매장 · 시설 촬영', '사진 한 장이 보러 오시는 분의 수를 가릅니다.', array['marketing'], '{}', '{}', 'quote', false, 'quote', 'info'::offer_status),
  ('stock-clear', '재고 처분', '반품이 되는 것부터 갈라 놓으세요 — 거래처와 먼저 얻습니다.', array['stock'], '{}', '{}', 'dispose', false, 'quote', 'info'::offer_status),
  ('restore-work', '원상복구', '범위는 임대차 계약서에 적힐 대로입니다. 그것부터 확인하세요.', array['restore'], '{}', '{}', 'quote', true, 'quote', 'info'::offer_status),
  ('waste-disposal', '폐기물 처리', '사업장 폐기물은 허가받은 업체만 가져갈 수 있고 증빙이 남아야 합니다.', array['waste'], '{}', '{}', 'quote', true, 'quote', 'info'::offer_status),
  ('equip-move', '장비 철거 · 이전', '떼어서 옮기면 돈이고 부수면 비용입니다. 순서를 먼저 정하세요.', array['demolish'], '{}', '{}', 'quote', true, 'quote', 'info'::offer_status)
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
