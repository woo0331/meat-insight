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
--      ⚠️ 업체 응답과 운영자 대리 기록을 갈라 둡니다 (vendor_at · proxy_at · vendor_via)
--   ⑦ vendor_response 뷰 — 업체 응답률 · 응답 시간 (대리 기록은 세지 않음)

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

-- ⑥-0 직원이 신청 · 견적 이력을 읽습니다 ───────────────────────────
-- ⚠️⚠️ 0001 의 audit_read 는 직원에게 **자기가 쓴 줄만** 줍니다. 그대로 두면
--   업체가 스스로 응답한 기록이 직원 화면 · 시각 뷰에서 안 보여서, 대리 기록과
--   업체 직접 응답을 **가를 수가 없습니다.** 신청(request) · 견적(quote) 줄만
--   더 엽니다 — 계약 · 정산 · 업체 · 정책 기록은 그대로 관리자만입니다.
-- ⚠️ 고치거나 지우는 정책은 여전히 없습니다 (읽기만).
drop policy if exists audit_staff_req on audit_log;
create policy audit_staff_req on audit_log for select
  using (my_role() = 'staff' and obj in ('request','quote'));

-- ⑥ 시각만 모은 뷰 — 성함 · 연락처 · 원문 없음 ─────────────────────
-- ⚠️ security_invoker — 부른 사람의 RLS 를 그대로 거칩니다 (직원 · 관리자만 줄이 보입니다).
-- ⚠️⚠️ 업체 응답(vendor_at)은 **업체 계정이 스스로 넘긴 기록만** 셉니다.
--   직원 · 관리자가 대신 넘긴 것은 proxy_at 으로 따로 두고, vendor_via 가
--   provider | staff | null 로 가릅니다 — 섞으면 업체 응답률이 부풀려집니다.
create or replace view intake_funnel with (security_invoker = true) as
select r.id, r.no, r.channel, r.src, r.side, r.region, r.gu, r.state,
       r.created_at                                              as intake_at,
       (select min(a.created_at) from assignment a where a.request_id = r.id) as assigned_at,
       (select min(l.at) from audit_log l where l.obj = 'request' and l.obj_id = r.id::text
          and l.to_state = 'accepted' and l.by_role = 'provider') as vendor_at,
       (select min(l.at) from audit_log l where l.obj = 'request' and l.obj_id = r.id::text
          and l.to_state = 'accepted' and l.by_role in ('staff','admin')) as proxy_at,
       (select case when bool_or(l.by_role = 'provider') then 'provider'
                    when bool_or(l.by_role in ('staff','admin')) then 'staff' end
          from audit_log l where l.obj = 'request' and l.obj_id = r.id::text
           and l.to_state = 'accepted')                          as vendor_via,
       (select min(q.created_at) from quote q where q.request_id = r.id) as quote_at,
       (select min(q.created_at) from quote q where q.request_id = r.id and q.src = 'provider') as vendor_quote_at,
       (select d.signed_at from deal d where d.request_id = r.id) as signed_at,
       (select max(l.at) from audit_log l where l.obj = 'request' and l.obj_id = r.id::text
          and l.to_state in ('done','lost'))                     as closed_at,
       r.outcome_on, r.settle
  from request r;
revoke all on intake_funnel from public, anon;
grant select on intake_funnel to authenticated, service_role;

-- ⑦ 업체 응답률 · 응답 시간 — **업체가 스스로 응답한 것만** ──────────
-- ⚠️⚠️ 직원 · 관리자 대리 기록(proxy_n)은 응답으로 세지 않습니다.
--   응답률 = vendor_n / assigned_n · 응답 시간 = 업체 응답만의 중앙값 · 평균.
--   배정 줄마다 그 업체 계정(account.provider_id)이 넘긴 기록을 찾습니다 —
--   같은 신청에 업체가 둘이면 서로의 응답이 섞이지 않습니다.
-- ⚠️ 표본이 0이면 비율 · 시간을 null 로 둡니다 (0% 가 아닙니다).
-- ⚠️⚠️ security_invoker 를 **일부러 안 씁니다** — 직원은 account 에서 업체 계정 줄을
--   못 읽어서(0012 account_staff) 업체 응답이 늘 0 으로 나옵니다. 대신 뷰 안에서
--   my_role() 로 직원 · 관리자만 줄을 받게 막습니다 (성함 · 연락처는 애초에 없습니다).
create or replace view vendor_response as
with a as (
  select a.provider_id, a.request_id, a.created_at as assigned_at,
         (select min(l.at) from audit_log l join account ac on ac.id = l.by_user
           where l.obj = 'request' and l.obj_id = a.request_id::text
             and l.to_state = 'accepted' and l.by_role = 'provider'
             and ac.provider_id = a.provider_id)                 as vendor_at,
         (select min(l.at) from audit_log l
           where l.obj = 'request' and l.obj_id = a.request_id::text
             and l.to_state = 'accepted' and l.by_role in ('staff','admin')) as proxy_at
    from assignment a
   where my_role() in ('staff','admin')
)
select provider_id,
       count(*)                                                      as assigned_n,
       count(vendor_at)                                              as vendor_n,
       count(*) filter (where vendor_at is null and proxy_at is not null) as proxy_n,
       count(*) filter (where vendor_at is null and proxy_at is null)     as none_n,
       case when count(*) > 0 then round(100.0 * count(vendor_at) / count(*), 1) end as vendor_rate,
       round(avg(extract(epoch from vendor_at - assigned_at)) / 60.0, 1)   as vendor_avg_min,
       round((percentile_cont(0.5) within group (order by extract(epoch from vendor_at - assigned_at))
              filter (where vendor_at is not null))::numeric / 60.0, 1)    as vendor_median_min
  from a
 group by provider_id;
revoke all on vendor_response from public, anon;
grant select on vendor_response to authenticated, service_role;

-- ⑧ 로그인한 사람이 RLS 를 지날 수 있게 (따라잡기) ──────────────────
-- ⚠️⚠️ 2026-11-19 시험용 Supabase 에서 찾았습니다 — 새 프로젝트는 새 함수의 실행
--   권한을 PUBLIC 에 주지 않아서, RLS 정책이 부르는 my_role() · my_provider() 가
--   로그인한 사람에게 막혀 **직원 · 관리자 · 고객 · 업체가 신청을 하나도 못 읽었습니다.**
--   0001 에도 같은 줄을 넣었고, 이미 돌린 DB 는 여기서 받습니다 (두 번 줘도 같습니다).
grant execute on function my_role()     to authenticated, service_role;
grant execute on function my_provider() to authenticated, service_role;

insert into schema_version (n, name) values (84, '0084_storeway_close_consult')
on conflict (n) do nothing;

commit;
