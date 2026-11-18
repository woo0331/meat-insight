-- 0084 — STOREWAY 1차 사업 실행: 매장 정리 상담 (2026-11-18)
--
-- ⚠️⚠️ 아직 운영 DB 에 돌리지 않았습니다. 대표 승인 전에는 돌리지 않습니다.
--   검증은 tools/test-s1.js 가 로컬 임시 Postgres 에서만 합니다.
-- ⚠️ 0083 다음에 돌립니다. 기존 표를 고치지 않고 **더하기만** 합니다
--   (칸 추가는 전부 null 허용이라 기존 줄이 바뀌지 않습니다).
--
-- 하는 일
--   ① request.channel · src — 어느 접수 길로 · 어디서 들어왔나 (연락처 · 원문 없음)
--   ② request.outcome_why · outcome_on · settle — 계약/종료 사유 · 확인일 · 정산 확인
--   ③ quote.waste · restore · extra · src — 철거 견적을 같은 칸으로 견주기
--      (폐기물 반출 · 원상복구 범위 · 추가 비용 조건 · 누가 적었나)
--   ④ deal_move — 직원 · 관리자가 업체 대신 넘기는 네 걸음 (초기 수동 운영)
--   ⑤ staff_record_quote() · set_outcome() · note_intake_meta()
--   ⑥ intake_funnel 뷰 — 접수 · 배정 · 업체 응답 · 견적 · 계약 · 종료 시각 (개인정보 없음)

begin;

-- ① 접수 길 · 유입 경로 ───────────────────────────────────────────
-- ⚠️ src 에는 경로와 utm 값만 담습니다 — 연락처 · 상담 원문을 넣지 않습니다.
--   숫자가 아홉 개 이상이면(하이픈으로 끊긴 전화번호 포함) 받지 않습니다.
alter table request add column if not exists channel text;
alter table request add column if not exists src text;
alter table request drop constraint if exists request_channel_ck;
alter table request add constraint request_channel_ck
  check (channel is null or channel in ('quote','close','sell'));
alter table request drop constraint if exists request_src_ck;
alter table request add constraint request_src_ck
  check (src is null or (length(src) <= 300 and length(regexp_replace(src, '[^0-9]', '', 'g')) < 9 and src !~ '@'));

-- ② 결과 기록 ─────────────────────────────────────────────────────
alter table request add column if not exists outcome_why text;
alter table request add column if not exists outcome_on date;
alter table request add column if not exists settle text;
alter table request drop constraint if exists request_settle_ck;
alter table request add constraint request_settle_ck
  check (settle is null or settle in ('none','pending','done'));

-- ③ 견적 칸 ───────────────────────────────────────────────────────
alter table quote add column if not exists waste   text;
alter table quote add column if not exists restore text;
alter table quote add column if not exists extra   text;
alter table quote add column if not exists src     text not null default 'provider';
alter table quote drop constraint if exists quote_src_ck;
alter table quote add constraint quote_src_ck check (src in ('provider','staff'));

-- ④ 직원 · 관리자가 업체 대신 넘기는 길 (js/data/deal.js 와 같아야 합니다) ──
insert into deal_move (from_state, to_state, role, needs) values
('assigned','accepted','staff','{}'::text[]),
('assigned','accepted','admin','{}'::text[]),
('accepted','consult','staff','{}'::text[]),
('accepted','consult','admin','{}'::text[]),
('consult','quoted','staff','{}'::text[]),
('consult','quoted','admin','{}'::text[]),
('quoted','nego','staff','{}'::text[]),
('quoted','nego','admin','{}'::text[])
on conflict (from_state, to_state, role) do nothing;

-- ⑤-1 운영자가 받은 견적을 적습니다 ──────────────────────────────
-- ⚠️ 배정된 업체의 견적만 적습니다 — 배정 전에는 연락처가 안 갔으니
--   그 업체가 견적을 낼 자리도 없습니다 (제17조).
-- ⚠️ 상태는 move_state() 로만 넘깁니다 (기록이 한 곳에만 남습니다).
create or replace function staff_record_quote(
  p_request  uuid,
  p_provider text,
  p_data     jsonb default '{}'::jsonb,
  p_why      text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me    uuid     := auth.uid();
  v_role  app_role := my_role();
  v_st    deal_state;
  v_was   text;
  v_id    uuid;
  v_amt   bigint;
  v_scope text := nullif(btrim(coalesce(p_data->>'scope','')), '');
  v_vat   text := coalesce(nullif(p_data->>'vat',''), 'add');
  v_days  int;
begin
  if v_me is null then
    raise exception '변경자를 알 수 없습니다 — 로그인한 세션에서만 됩니다';
  end if;
  if v_role is null or v_role not in ('staff','admin') then
    raise exception '견적 기록은 직원 · 관리자만 할 수 있습니다';
  end if;
  select state into v_st from request where id = p_request;
  if v_st is null then raise exception '없는 신청입니다'; end if;
  if not exists (select 1 from assignment
                  where request_id = p_request and provider_id = p_provider) then
    raise exception '이 신청에 연결된 업체가 아닙니다 — 먼저 업체를 연결해 주세요';
  end if;
  if v_st not in ('assigned','accepted','consult','quoted','nego') then
    raise exception '지금 상태(%)에서는 견적을 적을 수 없습니다', v_st;
  end if;
  if p_data->'amount' is null or jsonb_typeof(p_data->'amount') = 'null' then
    raise exception '견적 금액을 적어 주세요';
  end if;
  begin
    v_amt := (p_data->>'amount')::bigint;
  exception when others then
    raise exception '견적 금액을 숫자로 적어 주세요';
  end;
  if v_amt < 0 then raise exception '견적 금액이 음수입니다'; end if;
  if v_scope is null then raise exception '작업 범위를 적어 주세요'; end if;
  if v_vat not in ('add','incl','free') then
    raise exception '부가세 처리를 별도 · 포함 · 면세 중에서 골라 주세요';
  end if;
  begin
    v_days := nullif(p_data->>'days','')::int;
  exception when others then
    raise exception '작업 기간(일)을 숫자로 적어 주세요';
  end;
  if v_days is not null and v_days <= 0 then
    raise exception '작업 기간은 하루 이상으로 적어 주세요';
  end if;
  select state into v_was from quote where request_id = p_request and provider_id = p_provider;
  if v_was = 'chosen' then
    raise exception '고객이 고른 견적은 고칠 수 없습니다';
  end if;
  insert into quote (request_id, provider_id, amount, vat, scope, excludes, days,
                     note, waste, restore, extra, src, state, by_user)
  values (p_request, p_provider, v_amt, v_vat::fee_vat, v_scope,
          nullif(btrim(coalesce(p_data->>'excludes','')), ''), v_days,
          nullif(btrim(coalesce(p_data->>'note','')), ''),
          nullif(btrim(coalesce(p_data->>'waste','')), ''),
          nullif(btrim(coalesce(p_data->>'restore','')), ''),
          nullif(btrim(coalesce(p_data->>'extra','')), ''),
          'staff', 'open', v_me)
  on conflict (request_id, provider_id) do update
     set amount = excluded.amount, vat = excluded.vat, scope = excluded.scope,
         excludes = excluded.excludes, days = excluded.days, note = excluded.note,
         waste = excluded.waste, restore = excluded.restore, extra = excluded.extra,
         src = 'staff', state = 'open', chosen_at = null, by_user = v_me, updated_at = now()
  returning id into v_id;
  -- 견적이 들어왔으면 그 자리까지 넘깁니다 (업체 응답 → 상담 → 견적)
  if v_st = 'assigned' then
    perform move_state(p_request, 'accepted'::deal_state, jsonb_build_object('why','업체 응답 (운영자 기록)'));
    v_st := 'accepted';
  end if;
  if v_st = 'accepted' then
    perform move_state(p_request, 'consult'::deal_state, jsonb_build_object('why','상담 (운영자 기록)'));
    v_st := 'consult';
  end if;
  if v_st = 'consult' then
    perform move_state(p_request, 'quoted'::deal_state, jsonb_build_object('quoteId', v_id::text));
  end if;
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, v_role, 'quote', v_id::text, coalesce(v_was,'none'), 'open', p_why,
          jsonb_build_object('src','staff','provider_id',p_provider));
  return v_id;
end $$;

-- ⑤-2 계약 · 종료 사유와 확인일 · 정산 확인 ──────────────────────
-- ⚠️ 돈을 적는 문이 아닙니다 — 정산 "여부" 만 적습니다 (결제 · 청구 없음).
create or replace function set_outcome(
  p_request uuid,
  p_why     text,
  p_on      date,
  p_settle  text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_st   deal_state;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if v_role is null or v_role not in ('staff','admin') then
    raise exception '결과 기록은 직원 · 관리자만 할 수 있습니다';
  end if;
  select state into v_st from request where id = p_request;
  if v_st is null then raise exception '없는 신청입니다'; end if;
  if v_st not in ('signed','done','fee_wait','fee_done','lost') then
    raise exception '계약 또는 종료된 건에만 결과를 적습니다 (지금: %)', v_st;
  end if;
  if p_why is null or btrim(p_why) = '' then raise exception '사유를 적어 주세요'; end if;
  if p_on is null then raise exception '확인일을 적어 주세요'; end if;
  if p_settle is not null and p_settle not in ('none','pending','done') then
    raise exception '정산 여부를 다시 골라 주세요';
  end if;
  update request set outcome_why = btrim(p_why), outcome_on = p_on,
                     settle = coalesce(p_settle, settle)
   where id = p_request;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'request', p_request::text, v_st::text, btrim(p_why),
          jsonb_build_object('outcome_on', p_on, 'settle', p_settle));
end $$;

-- ⑤-3 접수 길 · 유입 경로 (서버가 접수 직후 부릅니다 · service_role 전용) ──
create or replace function note_intake_meta(p_no text, p_channel text, p_src text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update request set channel = nullif(btrim(coalesce(p_channel,'')), ''),
                     src = left(nullif(btrim(coalesce(p_src,'')), ''), 300)
   where no = p_no;
end $$;

revoke all on function staff_record_quote(uuid, text, jsonb, text) from public, anon;
revoke all on function set_outcome(uuid, text, date, text)          from public, anon;
revoke all on function note_intake_meta(text, text, text)            from public, anon, authenticated;
grant execute on function staff_record_quote(uuid, text, jsonb, text) to authenticated;
grant execute on function set_outcome(uuid, text, date, text)          to authenticated;
grant execute on function note_intake_meta(text, text, text)           to service_role;

-- ⑥ 시각만 모은 뷰 — 성함 · 연락처 · 원문 없음 ─────────────────────
-- ⚠️ security_invoker — 부른 사람의 RLS 를 그대로 거칩니다 (직원 · 관리자만 줄이 보입니다).
create or replace view intake_funnel with (security_invoker = true) as
select r.id, r.no, r.channel, r.src, r.side, r.region, r.gu, r.state,
       r.created_at                                              as intake_at,
       (select min(a.created_at) from assignment a where a.request_id = r.id) as assigned_at,
       (select min(l.at) from audit_log l where l.obj = 'request' and l.obj_id = r.id::text
          and l.to_state = 'accepted')                           as vendor_at,
       (select min(q.created_at) from quote q where q.request_id = r.id) as quote_at,
       (select d.signed_at from deal d where d.request_id = r.id) as signed_at,
       (select max(l.at) from audit_log l where l.obj = 'request' and l.obj_id = r.id::text
          and l.to_state in ('done','lost'))                     as closed_at,
       r.outcome_on, r.settle
  from request r;
revoke all on intake_funnel from public, anon;
grant select on intake_funnel to authenticated, service_role;

insert into schema_version (n, name) values (84, '0084_storeway_close_consult')
on conflict (n) do nothing;

commit;
