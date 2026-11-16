/* ==================================================================
   0082 ~ 0082 를 한 번에 —
   Supabase SQL 편집기에 **이 파일을 통째로** 붙여 넣고 Run 하세요.
   ==================================================================
   WARN 빌드가 만드는 파일입니다 — 손으로 고치지 마세요.
   db/migrations 의 1개를 번호 차례로 이어 붙인 것이고
   한 글자도 바꾸지 않았습니다. (node tools/make-apply.js)

   조각 파일입니다 — 바로 앞 조각까지 끝낸 DB 에만 쓰세요.
   어디까지 됐는지는 db/resume.sql 이 말해 줍니다
   (select max(n) from schema_version).

   돌린 뒤에는 db/verify.sql 을 붙여 넣어 보세요. 중간에서 멈추면 그
   파일 하나만 따로 돌리고 그 다음부터 이어 가시면 됩니다 — 번호를
   다시 쓰지 않습니다.

   WARN 통째로 begin/commit 으로 감싸지 마세요 — 파일마다 제
   트랜잭션이 있고 0015 는 일부러 감싸지 않았습니다. */

/* ---------------------------- 0082_compare_quote.sql ---------------------------- */
-- 0082 — 비교견적 (레슨 · 피팅 · 수리 · 중고 매입) (2026-11-15)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **아직 운영에 안 올렸습니다.** 로컬 DB 에서만 돌리고 검사했습니다.
--   사장님이 승인하시는 날 `db/pre-apply.sql` → 이 파일 → `db/post-apply.sql`
--   차례로 붙여 넣습니다(0001~0081 은 다시 돌리지 않습니다).
--
-- 왜 필요했나 — 지금 흐름(0004 · 0007 · 0008)은 **한 요청에 업체 한 곳**만
-- 끝까지 갈 수 있습니다:
--   · `request.state` 가 한 칸이라, 두 번째 업체가 수락하면 `answer_assignment`
--     가 `move_state(accepted)` 를 또 불러 「같은 상태입니다」로 통째로 되돌아갑니다.
--   · 배정(`move_state(assigned)`)이 그 자리에서 **연락처 제3자 제공 동의**를
--     요구합니다 — 업체 셋에 견적을 받으려면 고르기도 전에 셋 모두에게 성함 ·
--     연락처가 갑니다(제17조 제2항의 「누구에게」가 고르기 전에 정해지는 꼴).
--   · 견적에 「예상인지 확정인지」 와 분류마다 다른 비교 항목을 담을 칸이 없고,
--     유효기간(`valid_to`)은 적기만 하고 아무도 안 봅니다.
--   · `request.detail` 은 0001 부터 있었는데 **아무 문도 안 채웁니다.**
--
-- 그래서 — ⚠️ **옛 문은 하나도 덮지 않습니다**(create or replace 체인을 안
-- 늘립니다). 비교 요청(`request.compare = true`)만 새 문 다섯이 맡고, 지금
-- 돌고 있는 한 업체 흐름은 그대로 둡니다.
--   ① `make_compare_request` — 로그인한 분만 · 분류 셋만 · 조건(detail)을 받아
--      `make_request` 를 **안쪽에서 불러** 같은 자물쇠(10분 · 하루 20건 · idem)를
--      그대로 지나갑니다
--   ② `assign_more` — 운영자가 **분야 · 지역이 맞는 승인 업체**만 여럿 배정
--      (연락처를 안 넘기는 배정 = `assignment.blind`)
--   ③ `answer_compare` — 업체가 참여 · 거절 (다른 업체 상태를 건드리지 않습니다)
--   ④ `submit_compare_quote` — 예상/확정 · 유효기간(필수 · 오늘 이후) · 비교 항목
--   ⑤ `pick_quote` — 손님이 **상담할 업체 하나**를 고르면서 **그 업체에만**
--      연락처를 넘기는 데 동의합니다(상호를 보여 주고 받습니다 — 제17조 제2항)
--
-- ⚠️⚠️⚠️ **연락처를 읽는 보기(`v_request_contact`)를 세웁니다** — 운영자 · 직원 /
--   그 요청을 낸 본인 / **수락한 · 거두지 않은 · blind 가 아닌** 배정의 업체만.
--   표에서 칸을 거두는 일은 **0083** 입니다(차례는 docs/compare-0082.md).
--
-- 되돌리기 — 맨 아래 주석. 기존 회원 · 요청 · 견적 줄은 **한 줄도 안 바뀝니다**
--   (칸을 더하고 · 기본값 false · 표 권한만 좁힙니다).
-- ════════════════════════════════════════════════════════════════════
begin;

-- ── 칸 ─────────────────────────────────────────────────────────────
alter table request add column if not exists compare boolean not null default false;

-- 비교 배정은 고르기 전이라 연락처를 넘기지 않습니다 → 동의 시각이 비어 있을 수 있음
alter table assignment alter column agree3rd_at drop not null;
alter table assignment add column if not exists blind boolean not null default false;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'assignment_consent_ck') then
    alter table assignment add constraint assignment_consent_ck
      check (agree3rd_at is not null or blind);
  end if;
end $$;

alter table quote add column if not exists kind text;
alter table quote add column if not exists terms jsonb not null default '{}'::jsonb;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'quote_kind_ck') then
    alter table quote add constraint quote_kind_ck
      check (kind is null or kind in ('estimate','fixed'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'quote_terms_ck') then
    alter table quote add constraint quote_terms_ck
      check (jsonb_typeof(terms) = 'object' and length(terms::text) <= 6000);
  end if;
end $$;

-- ── 연락처를 읽는 보기 ─────────────────────────────────────────────
-- ⚠️⚠️⚠️ **표의 연락처 칸을 거두는 일은 0083 이 합니다(이 파일이 아닙니다).**
--   0082 를 올린 뒤에도 스위치(compareOn)가 꺼진 지금 화면은 `request` 에서
--   name · tel · email 을 그대로 묻습니다 — 여기서 거두면 그 순간 업체 작업실 ·
--   운영자 배정이 빈 채로 남습니다. 그래서 차례가 이렇습니다:
--     0082(더하기만) → 스위치 켠 화면 배포(보기로 읽음) → 0083(표에서 거둠)
--   ⚠️ 0083 전에는 비교 배정을 **서버가 거절**합니다(`assign_more` 첫 줄) —
--   그 사이에 배정되면 연락처를 안 넘기는 배정인데도 업체가 표에서 읽을 수 있습니다.
drop view if exists v_request_contact;
create view v_request_contact as
  select r.id, r.name, r.tel, r.email
    from request r
   where coalesce(my_role() in ('staff','admin'), false)
      or r.user_id = auth.uid()
      or exists (select 1 from assignment a
                  where a.request_id = r.id
                    and a.provider_id = my_provider()
                    and a.state = 'accepted'
                    and a.revoked_at is null
                    and a.blind = false);
revoke all on v_request_contact from public, anon;
-- ⚠️ Supabase 의 기본 권한(pre-apply 를 안 거친 경우)이 anon 에게 준 것도 위 줄이 거둡니다
grant select on v_request_contact to authenticated;

-- ── 분류마다 받는 서비스 ─────────────────────────────────────────────
-- ⚠️ 키 묶음은 `js/data/catalog.js` 가 참입니다 — 여기서는 **앞머리**만 봅니다
--   (하위가 늘어도 이 함수를 안 고치게). 중고는 매입 견적 하나뿐입니다
--   (개인 매물 · 위탁은 비교견적이 아닙니다).
create or replace function compare_cat_ok(p_cat text, p_svc text) returns boolean
  language sql immutable set search_path = public as $$
  select case p_cat
    when 'lesson'  then p_svc like 'ls-%'
    when 'fitting' then p_svc like 'ft-%'
    when 'used'    then p_svc = 'us-buyquote'
    else false end;
$$;
revoke all on function compare_cat_ok(text, text) from public, anon, authenticated;

-- 조건 · 비교 항목 꾸러미 — 글자만 · 키 꼴 · 크기를 봅니다
create or replace function compare_bag_ok(p jsonb, p_max int) returns boolean
  language sql immutable set search_path = public as $$
  select jsonb_typeof(p) = 'object'
     and (select count(*) from jsonb_object_keys(p)) <= 24
     and not exists (select 1 from jsonb_each(p) e
                      where e.key !~ '^[a-z][a-z0-9_]{0,23}$'
                         or jsonb_typeof(e.value) <> 'string'
                         or length(e.value #>> '{}') > p_max);
$$;
revoke all on function compare_bag_ok(jsonb, int) from public, anon, authenticated;

-- ── ① 비교 요청 넣기 ─────────────────────────────────────────────────
create or replace function make_compare_request(p jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_cat text := btrim(coalesce(p->>'cat', ''));
  v_det jsonb := coalesce(p->'detail', '{}'::jsonb);
  v_no  text;
  k     text;
begin
  if auth.uid() is null then
    raise exception '비교견적은 로그인한 뒤에 요청하실 수 있습니다 — 내 정보에서 견적을 비교하셔야 하니까요';
  end if;
  if v_cat not in ('lesson','fitting','used') then
    raise exception '비교견적을 받는 분야가 아닙니다';
  end if;
  if jsonb_typeof(p->'services') <> 'array' or jsonb_array_length(p->'services') = 0 then
    raise exception '원하시는 서비스를 하나 이상 골라 주세요';
  end if;
  for k in select btrim(x) from jsonb_array_elements_text(p->'services') t(x) loop
    if not compare_cat_ok(v_cat, k) then
      raise exception '이 분야에서 고를 수 없는 서비스입니다';
    end if;
  end loop;
  if not compare_bag_ok(v_det, 300) then
    raise exception '조건을 다시 확인해 주세요 — 칸이 너무 많거나 길거나 꼴이 맞지 않습니다';
  end if;

  v_no := make_request(p);   -- ⚠️ 같은 자물쇠(10분 · 하루 20건 · idem)를 그대로 지납니다

  update request set compare = true, detail = v_det
   where no = v_no and user_id = auth.uid();
  if not found then
    raise exception '요청을 비교견적으로 표시하지 못했습니다 — 고객센터로 알려 주세요';
  end if;
  return v_no;
end $$;
revoke all on function make_compare_request(jsonb) from public, anon;
grant execute on function make_compare_request(jsonb) to authenticated;

-- ── ② 운영자가 업체를 여럿 배정 ──────────────────────────────────────
create or replace function assign_more(p jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_role app_role := my_role();
  v_rid  uuid;
  v_pv   text := btrim(coalesce(p->>'provider', ''));
  r      request%rowtype;
  v_subs text[]; v_regs text[];
  v_id   uuid;
begin
  perform set_config('app.compare_door', '1', true);
  if not coalesce(v_role in ('staff','admin'), false) then
    raise exception '배정은 운영자만 합니다';
  end if;
  /* ⚠️⚠️ 0083(연락처 칸 잠금)이 올라가기 전에는 비교 배정을 하지 않습니다 */
  if has_column_privilege('authenticated', 'public.request', 'tel', 'select') then
    raise exception '연락처 칸 잠금(0083)이 아직 적용되지 않아 비교 배정을 할 수 없습니다';
  end if;
  begin v_rid := (p->>'request')::uuid;
  exception when others then raise exception '요청을 다시 골라 주세요'; end;
  select * into r from request where id = v_rid for update;
  if r.id is null then raise exception '없는 요청입니다'; end if;
  if not r.compare then
    raise exception '비교견적 요청이 아닙니다 — 기존 배정 단추를 쓰세요';
  end if;
  if r.archived_at is not null then raise exception '보관된 요청입니다'; end if;
  if r.state not in ('new','check','assigned','accepted','consult','quoted','nego') then
    raise exception '지금 상태(%)에서는 업체를 더할 수 없습니다', r.state;
  end if;
  if exists (select 1 from quote where request_id = r.id and state = 'chosen') then
    raise exception '손님이 이미 상담할 업체를 고르셨습니다';
  end if;

  select subs, regions into v_subs, v_regs from provider where id = v_pv;
  if v_subs is null then raise exception '없는 업체입니다'; end if;
  if not exists (select 1 from request_item i
                  where i.request_id = r.id and i.service_id = any(v_subs)) then
    raise exception '이 업체가 하는 일(분야)이 요청과 맞지 않습니다';
  end if;
  if r.region is not null and not (r.region = any(v_regs)) then
    raise exception '이 업체의 영업 지역이 요청 지역과 맞지 않습니다';
  end if;

  insert into assignment (request_id, provider_id, state, agree3rd_at, blind, by_user, why)
  values (r.id, v_pv, 'sent', null, true, auth.uid(), nullif(btrim(coalesce(p->>'why','')), ''))
  on conflict (request_id, provider_id) do nothing
  returning id into v_id;
  if v_id is null then raise exception '이미 배정한 업체입니다'; end if;

  if r.state in ('new','check') then
    update request set state = 'assigned' where id = r.id;
  end if;
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (auth.uid(), v_role, 'assignment', v_id::text, 'none', 'sent',
          '비교견적 배정', jsonb_build_object('request', r.no, 'provider', v_pv));
  return v_id;
end $$;
revoke all on function assign_more(jsonb) from public, anon;
grant execute on function assign_more(jsonb) to authenticated;

-- ── ③ 업체가 참여 · 거절 ────────────────────────────────────────────
create or replace function answer_compare(p jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_pv  text := my_provider();
  v_rid uuid;
  v_yes boolean := coalesce((p->>'yes')::boolean, false);
  r     request%rowtype;
  v_as  assignment%rowtype;
begin
  perform set_config('app.compare_door', '1', true);
  if not coalesce(my_role() = 'provider', false) or v_pv is null then
    raise exception '배정받은 업체만 답할 수 있습니다';
  end if;
  begin v_rid := (p->>'request')::uuid;
  exception when others then raise exception '요청을 다시 골라 주세요'; end;
  select * into r from request where id = v_rid for update;
  if r.id is null or not r.compare then raise exception '비교견적 요청이 아닙니다'; end if;
  select * into v_as from assignment where request_id = r.id and provider_id = v_pv;
  if v_as.id is null then raise exception '이 요청에 배정되지 않았습니다'; end if;
  if v_as.revoked_at is not null then raise exception '손님이 거두신 배정입니다'; end if;
  if v_as.state <> 'sent' then raise exception '이미 답하셨습니다'; end if;
  if r.state in ('lost','done','signed','fee_wait','fee_done') then
    raise exception '끝난 요청입니다';
  end if;

  update assignment set state = case when v_yes then 'accepted' else 'declined' end,
         why = nullif(btrim(coalesce(p->>'why','')), '')
   where id = v_as.id;
  if v_yes and r.state = 'assigned' then
    update request set state = 'accepted' where id = r.id;
  end if;
  if not v_yes and r.state = 'assigned' and not exists (
       select 1 from assignment where request_id = r.id and state in ('sent','accepted')
         and revoked_at is null) then
    update request set state = 'check' where id = r.id;
  end if;
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why)
  values (auth.uid(), my_role(), 'assignment', v_as.id::text, 'sent',
          case when v_yes then 'accepted' else 'declined' end, '비교견적 답');
  return case when v_yes then 'accepted' else 'declined' end;
end $$;
revoke all on function answer_compare(jsonb) from public, anon;
grant execute on function answer_compare(jsonb) to authenticated;

-- ── ④ 업체가 비교 견적을 냅니다 ──────────────────────────────────────
create or replace function submit_compare_quote(p jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_pv   text := my_provider();
  v_rid  uuid;
  r      request%rowtype;
  v_as   assignment%rowtype;
  v_was  text;
  v_amt  bigint;
  v_kind text := btrim(coalesce(p->>'kind', ''));
  v_scope text := nullif(btrim(coalesce(p->>'scope','')), '');
  v_vat  text := coalesce(nullif(p->>'vat',''), 'incl');
  v_valid date;
  v_days int;
  v_terms jsonb := coalesce(p->'terms', '{}'::jsonb);
  v_id   uuid;
begin
  perform set_config('app.compare_door', '1', true);
  if v_me is null or not coalesce(my_role() = 'provider', false) or v_pv is null then
    raise exception '견적은 배정받은 업체만 낼 수 있습니다';
  end if;
  begin v_rid := (p->>'request')::uuid;
  exception when others then raise exception '요청을 다시 골라 주세요'; end;
  select * into r from request where id = v_rid for update;
  if r.id is null or not r.compare then raise exception '비교견적 요청이 아닙니다'; end if;
  select * into v_as from assignment where request_id = r.id and provider_id = v_pv;
  if v_as.id is null then raise exception '이 요청에 배정되지 않았습니다'; end if;
  if v_as.revoked_at is not null then raise exception '손님이 거두신 배정입니다'; end if;
  if v_as.state <> 'accepted' then raise exception '참여를 먼저 눌러 주세요'; end if;
  if r.state not in ('assigned','accepted','consult','quoted','nego') then
    raise exception '지금 상태(%)에서는 견적을 낼 수 없습니다', r.state;
  end if;

  if v_kind not in ('estimate','fixed') then
    raise exception '예상 견적인지 확정 견적인지 골라 주세요';
  end if;
  if p->'amount' is null or jsonb_typeof(p->'amount') = 'null' then
    raise exception '금액을 적어 주세요';
  end if;
  begin v_amt := (p->>'amount')::bigint;
  exception when others then raise exception '금액을 숫자로 적어 주세요'; end;
  if v_amt < 0 then raise exception '금액이 음수입니다'; end if;
  if v_scope is null then raise exception '이 금액에 무엇이 포함되는지 적어 주세요'; end if;
  if v_vat not in ('add','incl','free') then
    raise exception '부가세 처리를 별도 · 포함 · 면세 중에서 골라 주세요';
  end if;
  begin
    v_valid := nullif(p->>'validTo','')::date;
    v_days  := nullif(p->>'days','')::int;
  exception when others then raise exception '날짜와 기간을 다시 확인해 주세요'; end;
  if v_valid is null then raise exception '견적 유효기간을 적어 주세요'; end if;
  if v_valid < kst_today() then raise exception '유효기간이 이미 지났습니다'; end if;
  if v_valid > kst_today() + 90 then raise exception '유효기간은 90일 안으로 적어 주세요'; end if;
  if v_days is not null and v_days <= 0 then raise exception '기간은 하루 이상으로 적어 주세요'; end if;
  if not compare_bag_ok(v_terms, 300) then
    raise exception '비교 항목을 다시 확인해 주세요 — 칸이 너무 많거나 길거나 꼴이 맞지 않습니다';
  end if;

  select state into v_was from quote where request_id = r.id and provider_id = v_pv;
  if v_was = 'chosen' then raise exception '손님이 고른 견적은 고칠 수 없습니다'; end if;
  if v_was = 'passed' then raise exception '손님이 다른 업체를 고르셨습니다'; end if;
  if exists (select 1 from quote where request_id = r.id and state = 'chosen') then
    raise exception '손님이 이미 상담할 업체를 고르셨습니다';
  end if;

  insert into quote (request_id, provider_id, amount, vat, scope, excludes, days,
                     valid_to, note, kind, terms, state, by_user)
  values (r.id, v_pv, v_amt, v_vat::fee_vat, v_scope,
          nullif(btrim(coalesce(p->>'excludes','')), ''), v_days, v_valid,
          nullif(btrim(coalesce(p->>'note','')), ''), v_kind, v_terms, 'open', v_me)
  on conflict (request_id, provider_id) do update
    set amount = excluded.amount, vat = excluded.vat, scope = excluded.scope,
        excludes = excluded.excludes, days = excluded.days, valid_to = excluded.valid_to,
        note = excluded.note, kind = excluded.kind, terms = excluded.terms,
        state = 'open', chosen_at = null, by_user = v_me, updated_at = now()
  returning id into v_id;

  if r.state in ('assigned','accepted','consult') then
    update request set state = 'quoted' where id = r.id;
  end if;
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why)
  values (v_me, my_role(), 'quote', v_id::text, coalesce(v_was, 'none'), 'open', '비교 견적');
  return v_id;
end $$;
revoke all on function submit_compare_quote(jsonb) from public, anon;
grant execute on function submit_compare_quote(jsonb) to authenticated;

-- ── ⑤ 손님이 상담할 업체를 고르고 그 업체에만 연락처를 넘깁니다 ──────────
-- ⚠️⚠️ 「상담 선택」입니다 — 예약 · 계약 · 결제가 아닙니다. 요청 상태는 그대로
--   두고(최종 조건 확정은 업체와 이야기한 뒤 `move_state(signed)` 입니다).
create or replace function pick_quote(p jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_rid uuid;
  v_pv  text := btrim(coalesce(p->>'provider', ''));
  r     request%rowtype;
  q     quote%rowtype;
  v_as  assignment%rowtype;
begin
  perform set_config('app.compare_door', '1', true);
  begin v_rid := (p->>'request')::uuid;
  exception when others then raise exception '요청을 다시 골라 주세요'; end;
  select * into r from request where id = v_rid for update;
  if r.id is null or not r.compare then raise exception '비교견적 요청이 아닙니다'; end if;
  if r.user_id is distinct from auth.uid() or auth.uid() is null then
    raise exception '요청하신 분만 고를 수 있습니다';
  end if;
  if coalesce((p->>'share')::boolean, false) is not true then
    raise exception '고르신 업체에 연락처를 넘기는 데 동의해 주셔야 상담을 시작할 수 있습니다';
  end if;
  if r.state in ('lost','done','signed','fee_wait','fee_done') then
    raise exception '끝난 요청입니다';
  end if;
  if exists (select 1 from quote where request_id = r.id and state = 'chosen') then
    raise exception '이미 상담할 업체를 고르셨습니다 — 바꾸시려면 고객센터로 알려 주세요';
  end if;
  select * into q from quote where request_id = r.id and provider_id = v_pv;
  if q.id is null or q.state <> 'open' then raise exception '고를 수 있는 견적이 아닙니다'; end if;
  if q.valid_to is not null and q.valid_to < kst_today() then
    raise exception '유효기간이 지난 견적입니다 — 업체에 다시 요청해 주세요';
  end if;
  select * into v_as from assignment where request_id = r.id and provider_id = v_pv;
  if v_as.id is null or v_as.revoked_at is not null or v_as.state <> 'accepted' then
    raise exception '이 업체와의 배정이 거두어졌거나 끝났습니다';
  end if;

  update quote set state = 'passed', updated_at = now()
   where request_id = r.id and state = 'open' and provider_id <> v_pv;
  update quote set state = 'chosen', chosen_at = now(), updated_at = now() where id = q.id;
  update assignment set agree3rd_at = now(), blind = false where id = v_as.id;
  update request set agree3rd_at = coalesce(agree3rd_at, now()) where id = r.id;
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (auth.uid(), my_role(), 'quote', q.id::text, 'open', 'chosen',
          '상담 선택 · 연락처 제공 동의', jsonb_build_object('provider', v_pv));
  return q.id;
end $$;
revoke all on function pick_quote(jsonb) from public, anon;
grant execute on function pick_quote(jsonb) to authenticated;

-- ── 옛 문이 비교 요청을 건드리지 못하게 ─────────────────────────────
-- ⚠️⚠️ 옛 문(`submit_quote` · `choose_quote` · `move_state(assigned)`)은 비교
--   요청을 모릅니다 — 그대로 두면 ① 떨어진(passed) 견적을 다시 열고(0008 의
--   upsert 가 state 를 open 으로 되돌립니다) ② 고르기 전에 연락처를 넘기는
--   배정을 만들 수 있습니다. 옛 문을 덮지 않고(체인을 안 늘립니다) **표에서**
--   막습니다: 새 문이 그 거래 안에서만 켜는 표(`app.compare_door`)가 없으면 거절.
--   ⚠️ 거두기(withdrawn)는 옛 문 그대로 됩니다 — 업체가 제 견적을 거두는 일은
--   비교 요청에서도 같습니다.
create or replace function compare_door_guard() returns trigger
  language plpgsql set search_path = public as $$
declare v_cmp boolean;
begin
  select compare into v_cmp from request where id = new.request_id;
  if not coalesce(v_cmp, false) then return new; end if;
  if coalesce(current_setting('app.compare_door', true), '') = '1' then return new; end if;
  if tg_table_name = 'quote' then
    if tg_op = 'UPDATE' and new.state = 'withdrawn' then return new; end if;
    raise exception '비교견적 요청의 견적은 비교 견적 화면에서만 다룹니다';
  end if;
  if tg_table_name = 'assignment' and (tg_op = 'INSERT' or new.blind = false) then
    if tg_op = 'UPDATE' and new.blind = old.blind and
       new.agree3rd_at is not distinct from old.agree3rd_at then return new; end if;
    raise exception '비교견적 요청의 배정은 비교 배정으로만 합니다';
  end if;
  return new;
end $$;
revoke all on function compare_door_guard() from public, anon, authenticated;
drop trigger if exists compare_door_quote_t on quote;
create trigger compare_door_quote_t before insert or update on quote
  for each row execute function compare_door_guard();
drop trigger if exists compare_door_assign_t on assignment;
create trigger compare_door_assign_t before insert or update on assignment
  for each row execute function compare_door_guard();

-- ── 고른 업체만 다음 단계로 ─────────────────────────────────────────
-- ⚠️⚠️⚠️ 비교 요청에는 업체가 여럿 배정됩니다. 옛 문(`move_state` · 0019 의
--   `request_scope_check`)은 **배정된 업체면 누구나** 상태를 옮기게 두므로, 손님이
--   고르지 않은 업체가 「조율 · 계약 · 완료」로 옮기거나 계약(deal)을 제 이름으로
--   만들 수 있었습니다. 표에서 막습니다 — 업체가 옮길 때는 **손님이 고른 견적의
--   업체**여야 하고, 계약 줄의 업체도 그 업체여야 합니다(운영자 · 직원은 그대로).
create or replace function compare_state_guard() returns trigger
  language plpgsql set search_path = public as $$
begin
  if not coalesce(new.compare, false) then return new; end if;
  if new.state is not distinct from old.state then return new; end if;
  if coalesce(current_setting('app.compare_door', true), '') = '1' then return new; end if;
  if coalesce(my_role() = 'provider', false) and not exists (
       select 1 from quote where request_id = new.id
          and provider_id = my_provider() and state = 'chosen') then
    raise exception '손님이 상담할 업체로 고른 업체만 다음 단계로 옮길 수 있습니다';
  end if;
  return new;
end $$;
revoke all on function compare_state_guard() from public, anon, authenticated;
drop trigger if exists compare_state_t on request;
create trigger compare_state_t before update of state on request
  for each row execute function compare_state_guard();

create or replace function compare_deal_guard() returns trigger
  language plpgsql set search_path = public as $$
begin
  if not exists (select 1 from request where id = new.request_id and compare) then return new; end if;
  if not exists (select 1 from quote where request_id = new.request_id
                    and provider_id = new.provider_id and state = 'chosen') then
    raise exception '비교견적의 계약은 손님이 고른 업체와만 맺습니다';
  end if;
  return new;
end $$;
revoke all on function compare_deal_guard() from public, anon, authenticated;
drop trigger if exists compare_deal_t on deal;
create trigger compare_deal_t before insert or update of provider_id on deal
  for each row execute function compare_deal_guard();

insert into schema_version (n, name) values (82, '0082_compare_quote')
on conflict (n) do nothing;
commit;

-- ── 되돌리기 (사장님이 운영에서 되돌리셔야 할 때만) ─────────────────────
-- ⚠️ 비교 요청이 한 건이라도 들어온 뒤에는 칸을 지우면 그 줄의 조건이 사라집니다.
--   그때는 함수만 내리고 칸은 두세요.
-- begin;
--   drop function if exists pick_quote(jsonb), submit_compare_quote(jsonb),
--     answer_compare(jsonb), assign_more(jsonb), make_compare_request(jsonb),
--     compare_bag_ok(jsonb, int), compare_cat_ok(text, text);
--   drop trigger if exists compare_door_quote_t on quote;
--   drop trigger if exists compare_door_assign_t on assignment;
--   drop function if exists compare_door_guard();
--   drop trigger if exists compare_state_t on request;
--   drop trigger if exists compare_deal_t on deal;
--   drop function if exists compare_state_guard(), compare_deal_guard();
--   drop view if exists v_request_contact;
--   -- (blind 배정이 남아 있으면 아래 not null 이 실패합니다 — 그 줄을 먼저 정리)
--   -- alter table assignment alter column agree3rd_at set not null;
--   delete from schema_version where n = 82;
-- commit;
