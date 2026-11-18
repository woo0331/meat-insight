-- 0082 — 인수인계(STOREWAY) 접수를 한 트랜잭션으로 · 동의 증거 · 알림 작업 (W02)
--
-- ⚠️⚠️ 번호가 0082 인 까닭 — 운영 DB 의 schema_version 은 골프올인원 때문에
--   81 까지 올라가 있습니다(0020~0081). 저장소에는 0001~0019 만 남았지만
--   그 사이 번호를 다시 쓰면 판 번호가 겹칩니다.
-- ⚠️⚠️ 아직 운영 DB 에 돌리지 않았습니다. 대표 승인 전에는 돌리지 않습니다.
--   검증은 tools/test-w02.js 가 로컬 임시 Postgres 에서만 합니다.
--
-- 하는 일 (기존 표를 고치지 않고 더하기만 합니다)
--   ① request.form · listing_state — /sell 은 검수대기로 저장 (자동 공개 없음)
--   ② consent_record — 동의 종류 · 고지 버전 · 항목 · 목적 · 보유기간 · 시각 · 철회
--   ③ notify_job — 알림을 저장과 떼어 냅니다 (상태 · 재시도 · 다음 시각 · 오류 코드)
--   ④ submit_intake() — 부모 요청 + 서비스 항목 + 동의 + 알림 작업 + 감사기록을
--      **한 트랜잭션**으로. 같은 멱등 키는 먼저 받은 번호를 돌려줍니다.
--   ⑤ submit_apply() — 업체 입점 신청을 같은 방식으로 (심사대기 · 자동 승인 없음)
--   ⑥ mark_notify() · due_notify() — 알림 결과 적기 · 재시도할 것 꺼내기
--
-- ⚠️ 세 함수 모두 서버(service_role)만 부릅니다. 손님 화면은 api/quote.js 를
--   거칩니다 — 공개 키로 부를 길을 열지 않습니다.
-- ⚠️ 알림 작업에는 성함 · 연락처 · 자유서술을 담지 않습니다 (지시서 9장).
--   알림은 접수번호와 종류만 실어 보내고, 원문은 /admin 에서 봅니다.

begin;

-- ① 양식 구분 · 매물 검수 상태 ─────────────────────────────────────
alter table request add column if not exists form text not null default 'quote';
alter table request drop constraint if exists request_form_ck;
alter table request add constraint request_form_ck check (form in ('quote','sell','sos'));
-- 매물(/sell)만 갖는 상태 — review(검수대기) · approved · rejected.
-- ⚠️ approved 여도 화면에 저절로 올라가지 않습니다 (매물 목록은 사람이 옮겨 적는
--   정적 자료입니다). 이 칸은 운영자가 검수를 끝냈는지 적는 자리입니다.
alter table request add column if not exists listing_state text;
alter table request drop constraint if exists request_listing_ck;
-- ⚠️⚠️ NULL 함정 — `listing_state in (...)` 는 칸이 NULL 이면 NULL 이고 CHECK 는
--   NULL 을 통과로 칩니다. 처음에 그렇게 적어 검수 상태 없는 매물이 들어갔습니다
--   (tools/test-w02.js 가 잡았습니다). coalesce 로 땅에 내려놓습니다.
alter table request add constraint request_listing_ck check (
  case when form = 'sell'
       then coalesce(listing_state in ('review','approved','rejected'), false)
       else listing_state is null end);

-- ② 동의 증거 ──────────────────────────────────────────────────────
create table if not exists consent_record (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid references request(id) on delete cascade,
  apply_id    uuid references provider_apply(id) on delete cascade,
  kind        text not null check (kind in ('collect','notify','third_party')),
  notice_ver  text not null check (btrim(notice_ver) <> ''),
  items       text not null check (btrim(items) <> ''),
  purpose     text not null check (btrim(purpose) <> ''),
  keep        text not null check (btrim(keep) <> ''),
  -- 후속 업체별 제3자 제공 동의를 잇는 자리 (1차에서는 비어 있습니다)
  provider_id text references provider(id) on delete set null,
  agreed_at   timestamptz not null default now(),
  revoked_at  timestamptz,
  constraint consent_target_ck check ((request_id is null) <> (apply_id is null))
);
create index if not exists consent_req_idx on consent_record (request_id);
alter table consent_record enable row level security;
-- 표에는 GRANT 를 주지 않습니다 — 서버(service_role)와 아래 정책만.
drop policy if exists consent_staff on consent_record;
create policy consent_staff on consent_record for select
  using (my_role() in ('staff','admin'));
-- ⚠️ 운영 Supabase 는 새 표에 anon · authenticated 전 권한을 기본으로 붙입니다
--   (alter default privileges). 거두고 읽기만 다시 줍니다 — RLS 하나에 기대지 않습니다.
revoke all on consent_record from public, anon, authenticated;
grant select on consent_record to authenticated;

-- ③ 알림 작업 ──────────────────────────────────────────────────────
create table if not exists notify_job (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid references request(id) on delete cascade,
  apply_id    uuid references provider_apply(id) on delete cascade,
  kind        text not null check (kind in ('ops_new','ops_new_apply','customer_ack')),
  dedupe_key  text not null unique,
  status      text not null default 'pending' check (status in ('pending','sent','failed','gave_up')),
  tries       int  not null default 0 check (tries >= 0),
  next_at     timestamptz not null default now(),
  last_error  text check (last_error is null or length(last_error) <= 120),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists notify_due_idx on notify_job (status, next_at);
alter table notify_job enable row level security;
drop policy if exists notify_staff on notify_job;
create policy notify_staff on notify_job for select
  using (my_role() in ('staff','admin'));
-- ⚠️ 운영 Supabase 는 새 표에 anon · authenticated 전 권한을 기본으로 붙입니다
--   (alter default privileges). 거두고 읽기만 다시 줍니다 — RLS 하나에 기대지 않습니다.
revoke all on notify_job from public, anon, authenticated;
grant select on notify_job to authenticated;

-- ④ 접수 한 건을 한 트랜잭션으로 ──────────────────────────────────
--   p 의 칸: no idem form side industry cat offer_id region gu want_at body
--            detail(object) name tel email user_id items(array of {id,detail})
--            consent{notice_ver,items,purpose,keep} notify(bool)
--   돌려주는 것: {no, dup, request_id, jobs:[{id,kind}]}
create or replace function submit_intake(p jsonb)
  returns jsonb
  language plpgsql security definer set search_path = public as $$
declare
  v_idem  text := nullif(btrim(coalesce(p->>'idem','')), '');
  v_form  text := coalesce(nullif(p->>'form',''), 'quote');
  v_no    text := nullif(btrim(coalesce(p->>'no','')), '');
  v_name  text := nullif(btrim(coalesce(p->>'name','')), '');
  v_tel   text := nullif(btrim(coalesce(p->>'tel','')), '');
  v_offer text := nullif(btrim(coalesce(p->>'offer_id','')), '');
  v_c     jsonb := p->'consent';
  v_req   uuid;
  v_was   text;
  it      jsonb;
  sid     text;
  v_jobs  jsonb := '[]'::jsonb;
  v_job   uuid;
begin
  -- 같은 멱등 키 — 먼저 받은 번호를 돌려줍니다 (더블클릭 · 재시도)
  if v_idem is not null then
    select no into v_was from request where idem = v_idem limit 1;
    if v_was is not null then
      return jsonb_build_object('no', v_was, 'dup', true);
    end if;
  end if;

  -- 서버가 이미 막지만 DB 도 한 번 더 봅니다 (다른 길로 부르는 날을 위해)
  if v_no is null then raise exception 'intake: 접수번호가 없습니다'; end if;
  if v_name is null or v_tel is null then raise exception 'intake: 성함과 연락처가 필요합니다'; end if;
  if v_form not in ('quote','sell','sos') then raise exception 'intake: 모르는 양식 %', v_form; end if;
  if v_c is null or jsonb_typeof(v_c) <> 'object'
     or nullif(btrim(coalesce(v_c->>'notice_ver','')),'') is null
     or nullif(btrim(coalesce(v_c->>'items','')),'') is null
     or nullif(btrim(coalesce(v_c->>'purpose','')),'') is null
     or nullif(btrim(coalesce(v_c->>'keep','')),'') is null then
    raise exception 'intake: 동의 기록이 비었습니다';
  end if;
  -- 상품 표에 없는 id 는 비웁니다 (외래 키에 걸려 접수 전체를 잃지 않게)
  if v_offer is not null and not exists (select 1 from offer where id = v_offer) then
    v_offer := null;
  end if;

  begin
    insert into request (no, user_id, side, industry, cat, offer_id, region, gu,
                         want_at, body, detail, name, tel, email, agree_at,
                         notify_ok, notify_at, idem, state, form, listing_state)
    values (v_no, nullif(p->>'user_id','')::uuid,
            coalesce(nullif(p->>'side',''), 'start'),
            nullif(p->>'industry',''), nullif(p->>'cat',''), v_offer,
            nullif(p->>'region',''), nullif(p->>'gu',''), nullif(p->>'want_at',''),
            nullif(p->>'body',''),
            case when jsonb_typeof(p->'detail') = 'object' then p->'detail' else '{}'::jsonb end,
            v_name, v_tel, nullif(p->>'email',''), now(),
            coalesce((p->>'notify')::boolean, false),
            case when coalesce((p->>'notify')::boolean, false) then now() end,
            v_idem, 'new', v_form,
            case when v_form = 'sell' then 'review' end)
    returning id into v_req;
  exception when unique_violation then
    -- 같은 키가 동시에 들어온 경우 — 먼저 들어간 줄의 번호
    if v_idem is not null then
      select no into v_was from request where idem = v_idem limit 1;
      if v_was is not null then
        return jsonb_build_object('no', v_was, 'dup', true);
      end if;
    end if;
    raise;
  end;

  -- 서비스 항목 — 하나라도 실패하면 접수 전체가 되돌아갑니다
  if jsonb_typeof(p->'items') = 'array' then
    for it in select * from jsonb_array_elements(p->'items') loop
      sid := nullif(btrim(coalesce(it->>'id','')), '');
      if sid is null then raise exception 'intake: 빈 서비스 id'; end if;
      insert into request_item (request_id, service_id, detail)
      values (v_req, sid,
              case when jsonb_typeof(it->'detail') = 'object' then it->'detail' else '{}'::jsonb end)
      on conflict (request_id, service_id) do nothing;
    end loop;
  end if;

  insert into consent_record (request_id, kind, notice_ver, items, purpose, keep)
  values (v_req, 'collect', v_c->>'notice_ver', v_c->>'items', v_c->>'purpose', v_c->>'keep');

  insert into notify_job (request_id, kind, dedupe_key)
  values (v_req, 'ops_new', 'ops_new:' || v_req) returning id into v_job;
  v_jobs := v_jobs || jsonb_build_object('id', v_job, 'kind', 'ops_new');

  if nullif(p->>'email','') is not null then
    insert into notify_job (request_id, kind, dedupe_key)
    values (v_req, 'customer_ack', 'customer_ack:' || v_req) returning id into v_job;
    v_jobs := v_jobs || jsonb_build_object('id', v_job, 'kind', 'customer_ack');
  end if;

  -- 감사기록 — 성함 · 연락처를 담지 않습니다
  insert into audit_log (obj, obj_id, to_state, why, data)
  values ('request', v_req::text, 'new', 'intake',
          jsonb_build_object('form', v_form,
            'items', (select count(*) from request_item where request_id = v_req)));

  return jsonb_build_object('no', v_no, 'dup', false, 'request_id', v_req, 'jobs', v_jobs);
end $$;
revoke all on function submit_intake(jsonb) from public, anon, authenticated;
grant execute on function submit_intake(jsonb) to service_role;

-- ⑤ 업체 입점 신청 ─────────────────────────────────────────────────
create or replace function submit_apply(p jsonb)
  returns jsonb
  language plpgsql security definer set search_path = public as $$
declare
  v_c   jsonb := p->'consent';
  v_id  uuid;
  v_job uuid;
begin
  if nullif(btrim(coalesce(p->>'no','')),'') is null then raise exception 'apply: 접수번호가 없습니다'; end if;
  if nullif(btrim(coalesce(p->>'company','')),'') is null then raise exception 'apply: 업체명이 필요합니다'; end if;
  if nullif(btrim(coalesce(p->>'name','')),'') is null or nullif(btrim(coalesce(p->>'tel','')),'') is null then
    raise exception 'apply: 성함과 연락처가 필요합니다';
  end if;
  if v_c is null or nullif(btrim(coalesce(v_c->>'notice_ver','')),'') is null
     or nullif(btrim(coalesce(v_c->>'keep','')),'') is null then
    raise exception 'apply: 동의 기록이 비었습니다';
  end if;

  -- ⚠️ state 는 언제나 new(심사대기)입니다 — 화면이 무엇을 보내도 승인 · 배지 없음
  insert into provider_apply (no, company, brn, name, tel, email, region, industry,
                              services, note, agree_at, state)
  values (p->>'no', p->>'company', nullif(p->>'brn',''), p->>'name', p->>'tel',
          nullif(p->>'email',''), nullif(p->>'region',''), nullif(p->>'industry',''),
          coalesce((select array_agg(x) from jsonb_array_elements_text(
                      case when jsonb_typeof(p->'services') = 'array' then p->'services' else '[]'::jsonb end) x), '{}'),
          nullif(p->>'note',''), now(), 'new')
  returning id into v_id;

  insert into consent_record (apply_id, kind, notice_ver, items, purpose, keep)
  values (v_id, 'collect', v_c->>'notice_ver', coalesce(nullif(v_c->>'items',''),'-'),
          coalesce(nullif(v_c->>'purpose',''),'-'), v_c->>'keep');

  insert into notify_job (apply_id, kind, dedupe_key)
  values (v_id, 'ops_new_apply', 'ops_new_apply:' || v_id) returning id into v_job;

  insert into audit_log (obj, obj_id, to_state, why, data)
  values ('provider_apply', v_id::text, 'new', 'intake', '{}'::jsonb);

  return jsonb_build_object('no', p->>'no', 'dup', false, 'apply_id', v_id,
    'jobs', jsonb_build_array(jsonb_build_object('id', v_job, 'kind', 'ops_new_apply')));
end $$;
revoke all on function submit_apply(jsonb) from public, anon, authenticated;
grant execute on function submit_apply(jsonb) to service_role;

-- ⑥ 알림 결과 · 재시도 ─────────────────────────────────────────────
--   실패하면 5분 · 30분 · 2시간 · 12시간 뒤에 다시. 다섯 번 넘으면 gave_up
--   (운영자가 /admin 에서 봅니다). 오류 글은 120자 · 개인정보를 담지 않습니다.
create or replace function mark_notify(p_job uuid, p_ok boolean, p_err text default null)
  returns text
  language plpgsql security definer set search_path = public as $$
declare
  t int; s text;
begin
  update notify_job set tries = tries + 1, updated_at = now()
   where id = p_job and status in ('pending','failed')
   returning tries into t;
  if t is null then return 'skip'; end if;   -- 이미 보냈거나 없음 (중복 발송 방지)
  if p_ok then
    update notify_job set status = 'sent', last_error = null where id = p_job;
    return 'sent';
  end if;
  s := case when t >= 5 then 'gave_up' else 'failed' end;
  update notify_job set status = s,
         last_error = left(coalesce(p_err,'unknown'), 120),
         next_at = now() + case t when 1 then interval '5 min' when 2 then interval '30 min'
                                  when 3 then interval '2 hour' else interval '12 hour' end
   where id = p_job;
  return s;
end $$;
revoke all on function mark_notify(uuid, boolean, text) from public, anon, authenticated;
grant execute on function mark_notify(uuid, boolean, text) to service_role;

create or replace function due_notify(p_limit int default 20)
  returns table (id uuid, kind text, request_id uuid, apply_id uuid, tries int)
  language sql security definer set search_path = public as $$
  select id, kind, request_id, apply_id, tries from notify_job
   where status in ('pending','failed') and next_at <= now()
   order by next_at limit greatest(1, least(p_limit, 100));
$$;
revoke all on function due_notify(int) from public, anon, authenticated;
grant execute on function due_notify(int) to service_role;

insert into schema_version (n, name) values (82, '0082_storeway_intake')
  on conflict (n) do nothing;

commit;
