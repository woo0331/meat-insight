-- ════════════════════════════════════════════════════════════════════
-- 0083 — W03 관리자 접수함 · 고객 본인 조회 (운영 미적용 · 대표 승인 후)
--
--   ① request.next_due + set_next_due()      다음 행동 기한
--   ② request_note + add_request_note()      내부 메모 · 연락 시도 기록 · 고객 공개 안내
--   ③ request_rollup()                       서비스별 상태를 부모 상태로 모으기 (T09)
--   ④ admin_inbox_flags()                    목록용 — 연락처 마스킹 · 중복 후보 · 알림 실패
--   ⑤ lookup_challenge · lookup_session      비회원 본인 조회 (T08)
--      lookup_start() · lookup_verify() · lookup_read()
--
-- ⚠️⚠️ 표마다 RLS 를 켜고 **쓰기 권한을 주지 않습니다.** 쓰는 길은 아래 함수뿐이고
--   함수가 감사 기록을 같은 트랜잭션에서 남깁니다 (§8).
-- ⚠️⚠️ 감사 기록 · 일반 로그에 원문 개인정보 · 메모 본문 · 인증번호 · 조회 토큰을
--   싣지 않습니다. 인증번호와 토큰은 **해시만** 저장합니다 (원문은 DB 에 없습니다).
-- ⚠️ 운영 Supabase 는 새 표에 anon · authenticated 전 권한을 기본으로 붙입니다
--   (alter default privileges) — 표마다 거둡니다. RLS 하나에 기대지 않습니다.
-- ⚠️ 번호가 0083 인 까닭 — 0082 와 같습니다 (운영 schema_version 의 골프 판 20~81).
-- ════════════════════════════════════════════════════════════════════
begin;

-- ① 다음 행동 기한 ──────────────────────────────────────────────────
alter table request add column if not exists next_due timestamptz;
create index if not exists request_next_due_idx on request (next_due) where next_due is not null;

create or replace function set_next_due(p_request uuid, p_due timestamptz default null, p_why text default null)
  returns void
  language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  rol app_role := my_role();
  was timestamptz;
begin
  if uid is null then raise exception '변경자를 알 수 없습니다 — 로그인 후 다시 시도해 주세요'; end if;
  if rol not in ('staff','admin') then raise exception '기한은 직원 · 관리자만 정할 수 있습니다'; end if;
  select next_due into was from request where id = p_request;
  if not found then raise exception '신청을 찾을 수 없습니다'; end if;
  update request set next_due = p_due where id = p_request;
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (uid, rol, 'request', p_request::text, 'due', 'due', p_why,
          jsonb_build_object('was', was, 'now', p_due));
end $$;
revoke all on function set_next_due(uuid, timestamptz, text) from public, anon;
grant execute on function set_next_due(uuid, timestamptz, text) to authenticated;

-- ② 메모 · 연락 시도 · 고객 공개 안내 ─────────────────────────────────
--   memo     내부 메모        — 직원 · 관리자만 봅니다
--   contact  연락 시도 기록    — 결과(result)가 반드시 같이 갑니다
--   public   고객 공개 안내    — 본인 조회 화면에 그대로 나갑니다
--   ⚠️⚠️ 셋을 한 칸(kind)으로 가르고, 고객에게 나가는 것은 public **하나뿐**입니다.
--   ⚠️ 고치거나 지우는 함수가 없습니다 — 기록입니다. 잘못 적었으면 새로 적습니다.
create table if not exists request_note (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references request(id) on delete cascade,
  item_id     uuid references request_item(id) on delete set null,
  kind        text not null check (kind in ('memo','contact','public')),
  body        text not null check (btrim(body) <> '' and length(body) <= 2000),
  result      text check (result is null or result in ('reached','no_answer','left_msg','wrong_no')),
  by_user     uuid references auth.users(id) on delete set null,
  by_role     app_role,
  at          timestamptz not null default now(),
  constraint note_result_ck check ((kind = 'contact') = (result is not null))
);
create index if not exists request_note_req_idx on request_note (request_id, at desc);
alter table request_note enable row level security;
drop policy if exists note_staff on request_note;
create policy note_staff on request_note for select using (my_role() in ('staff','admin'));
revoke all on request_note from public, anon, authenticated;
grant select on request_note to authenticated;

create or replace function add_request_note(p_request uuid, p_kind text, p_body text,
  p_item uuid default null, p_result text default null)
  returns uuid
  language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  rol app_role := my_role();
  v_id uuid;
begin
  if uid is null then raise exception '변경자를 알 수 없습니다 — 로그인 후 다시 시도해 주세요'; end if;
  if rol not in ('staff','admin') then raise exception '메모는 직원 · 관리자만 적을 수 있습니다'; end if;
  if p_kind not in ('memo','contact','public') then raise exception '메모 종류를 골라 주세요'; end if;
  if coalesce(btrim(p_body), '') = '' then raise exception '내용을 적어 주세요'; end if;
  if length(p_body) > 2000 then raise exception '2000자까지 적을 수 있습니다'; end if;
  if p_kind = 'contact' and coalesce(p_result, '') not in ('reached','no_answer','left_msg','wrong_no') then
    raise exception '연락 결과를 골라 주세요';
  end if;
  if not exists (select 1 from request where id = p_request) then raise exception '신청을 찾을 수 없습니다'; end if;
  if p_item is not null and not exists (select 1 from request_item where id = p_item and request_id = p_request) then
    raise exception '이 신청의 서비스가 아닙니다';
  end if;
  insert into request_note (request_id, item_id, kind, body, result, by_user, by_role)
  values (p_request, p_item, p_kind, btrim(p_body),
          case when p_kind = 'contact' then p_result else null end, uid, rol)
  returning id into v_id;
  -- ⚠️ 본문은 기록에 안 싣습니다 (원문 개인정보가 섞일 수 있고 기록은 못 지웁니다)
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (uid, rol, 'request', p_request::text, null, 'note:' || p_kind, null,
          jsonb_build_object('note_id', v_id, 'item_id', p_item, 'result', p_result,
                             'public', p_kind = 'public'));
  return v_id;
end $$;
revoke all on function add_request_note(uuid, text, text, uuid, text) from public, anon;
grant execute on function add_request_note(uuid, text, text, uuid, text) to authenticated;

-- ③ 상태 모으기 (T09) ──────────────────────────────────────────────
--   ⚠️⚠️ 한 서비스가 끝났다고 전체를 완료로 두지 않습니다.
--   열린 서비스가 하나라도 있으면 phase = 'open' 이고, 몇 개가 끝났는지는 숫자로 같이 냅니다.
create or replace function request_rollup(p_request uuid)
  returns jsonb
  language sql stable security definer set search_path = public as $$
  with s as (
    select coalesce(
      (select array_agg(state::text) from request_item where request_id = p_request),
      (select array[state::text] from request where id = p_request)) as st
  ), c as (
    select cardinality(st) as total,
      (select count(*) from unnest(st) x where x in ('done','fee_wait','fee_done')) as done,
      (select count(*) from unnest(st) x where x = 'lost') as lost,
      (select count(*) from unnest(st) x where x = 'hold') as hold
    from s
  )
  select jsonb_build_object(
    'total', total, 'done', done, 'lost', lost, 'hold', hold,
    'open', total - done - lost - hold,
    'phase', case when total = 0 then 'none'
                  when total - done - lost - hold > 0 then 'open'
                  when hold > 0 then 'hold'
                  when done > 0 then 'done'
                  else 'lost' end)
  from c;
$$;
revoke all on function request_rollup(uuid) from public, anon, authenticated;
grant execute on function request_rollup(uuid) to service_role;

-- ④ 관리자 목록용 표시 ─────────────────────────────────────────────
--   ⚠️⚠️ 목록에는 연락처를 **가려서**만 냅니다 (010-****-5678). 원문은 건을 열고
--   "연락처 보기" 를 눌러야 오고, 그때 열람 기록이 남습니다 (note_request_open · 0012).
--   중복 후보 — 같은 번호(숫자만)로 최근 30일 안에 들어온 **다른** 신청 수.
create or replace function admin_inbox_flags(p_ids uuid[])
  returns table (id uuid, tel_mask text, dup_count int, notify_failed boolean,
                 services text[], rollup jsonb)
  language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null or my_role() not in ('staff','admin') then
    raise exception '직원 · 관리자만 볼 수 있습니다';
  end if;
  if cardinality(coalesce(p_ids, '{}')) > 200 then raise exception '한 번에 200건까지입니다'; end if;
  return query
  select r.id,
    case when length(r.tel_key) >= 8
         then left(r.tel_key, 3) || '-****-' || right(r.tel_key, 4) else '***' end,
    (select count(*)::int from request o
      where o.tel_key = r.tel_key and o.id <> r.id and r.tel_key <> ''
        and o.created_at > r.created_at - interval '30 days'
        and o.created_at < r.created_at + interval '30 days'),
    exists (select 1 from notify_job j where j.request_id = r.id and j.status in ('failed','gave_up')),
    coalesce((select array_agg(i.service_id order by i.created_at) from request_item i where i.request_id = r.id), '{}'),
    request_rollup(r.id)
  from request r where r.id = any(p_ids);
end $$;
revoke all on function admin_inbox_flags(uuid[]) from public, anon;
grant execute on function admin_inbox_flags(uuid[]) to authenticated;

-- ⑤ 비회원 본인 조회 (T08) ─────────────────────────────────────────
--   ⚠️⚠️ 접수번호 + 전화번호만으로 원문을 열지 않습니다. 둘이 맞으면 **인증번호**를
--   보내고, 그 번호까지 맞아야 30분짜리 조회 토큰을 줍니다.
--   ⚠️ 인증번호 · 토큰은 서버가 만든 **해시만** 받습니다 (원문은 DB 에 없습니다).
--   ⚠️ 번호 · 전화가 안 맞아도 **같은 모양의 답**을 돌려줍니다 (가짜 도전 · send=false) —
--   갈라 주면 어느 번호가 있는지 긁을 수 있습니다.
create table if not exists lookup_challenge (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid references request(id) on delete cascade,     -- null = 안 맞은 요청(가짜)
  code_hash   text not null check (length(code_hash) between 32 and 128),
  expires_at  timestamptz not null,
  used_at     timestamptz,
  attempts    int not null default 0 check (attempts >= 0),
  created_at  timestamptz not null default now()
);
create index if not exists lookup_ch_req_idx on lookup_challenge (request_id, created_at desc);
alter table lookup_challenge enable row level security;
revoke all on lookup_challenge from public, anon, authenticated;

create table if not exists lookup_session (
  token_hash  text primary key check (length(token_hash) between 32 and 128),
  request_id  uuid not null references request(id) on delete cascade,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);
alter table lookup_session enable row level security;
revoke all on lookup_session from public, anon, authenticated;

create or replace function lookup_start(p_no text, p_tel text, p_code_hash text)
  returns jsonb
  language plpgsql security definer set search_path = public as $$
declare
  v_no  text := upper(regexp_replace(coalesce(p_no, ''), '\s', '', 'g'));
  v_tel text := regexp_replace(coalesce(p_tel, ''), '[^0-9]', '', 'g');
  v_req uuid; v_dest text; v_ch uuid; v_recent int := 0;
begin
  if length(coalesce(p_code_hash, '')) < 32 then raise exception 'bad hash'; end if;
  if length(v_tel) >= 8 and length(v_no) between 4 and 40 then
    select id, tel into v_req, v_dest from request where no = v_no and tel_key = v_tel;
  end if;
  if v_req is not null then
    -- 한 신청에 한 시간 3번까지 (그 위로는 보내지 않고 같은 모양으로 답합니다)
    select count(*) into v_recent from lookup_challenge
     where request_id = v_req and created_at > now() - interval '1 hour';
  end if;
  insert into lookup_challenge (request_id, code_hash, expires_at)
  values (case when v_req is not null and v_recent < 3 then v_req else null end,
          p_code_hash, now() + interval '10 minutes')
  returning id into v_ch;
  return jsonb_build_object('challenge', v_ch,
    'send', v_req is not null and v_recent < 3,
    -- ⚠️ 보낼 곳은 서버(service_role)만 받습니다 — API 가 화면으로 넘기지 않습니다
    'dest', case when v_req is not null and v_recent < 3 then v_dest else null end);
end $$;
revoke all on function lookup_start(text, text, text) from public, anon, authenticated;
grant execute on function lookup_start(text, text, text) to service_role;

create or replace function lookup_verify(p_challenge uuid, p_code_hash text, p_token_hash text)
  returns jsonb
  language plpgsql security definer set search_path = public as $$
declare
  c lookup_challenge%rowtype;
begin
  if length(coalesce(p_token_hash, '')) < 32 then raise exception 'bad hash'; end if;
  select * into c from lookup_challenge where id = p_challenge for update;
  if not found then return jsonb_build_object('ok', false, 'why', 'none'); end if;
  if c.used_at is not null then return jsonb_build_object('ok', false, 'why', 'used'); end if;
  if c.expires_at < now() then return jsonb_build_object('ok', false, 'why', 'expired'); end if;
  if c.attempts >= 5 then return jsonb_build_object('ok', false, 'why', 'locked'); end if;
  if c.request_id is null or c.code_hash <> p_code_hash then
    update lookup_challenge set attempts = attempts + 1 where id = c.id;
    return jsonb_build_object('ok', false, 'why', 'wrong', 'left', greatest(0, 4 - c.attempts));
  end if;
  update lookup_challenge set used_at = now() where id = c.id;
  insert into lookup_session (token_hash, request_id, expires_at)
  values (p_token_hash, c.request_id, now() + interval '30 minutes');
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (null, null, 'request', c.request_id::text, null, 'lookup:verified', null,
          jsonb_build_object('challenge', c.id));
  return jsonb_build_object('ok', true);
end $$;
revoke all on function lookup_verify(uuid, text, text) from public, anon, authenticated;
grant execute on function lookup_verify(uuid, text, text) to service_role;

--   ⚠️⚠️ 고객에게 나가는 칸은 **여기 적힌 것뿐**입니다 — 성함 · 연락처 · 적어 주신 원문 ·
--   내부 메모 · 연락 기록 · 업체 정보는 싣지 않습니다.
create or replace function lookup_read(p_token_hash text)
  returns jsonb
  language plpgsql stable security definer set search_path = public as $$
declare
  v_req uuid; r request%rowtype;
begin
  select request_id into v_req from lookup_session
   where token_hash = p_token_hash and expires_at > now();
  if v_req is null then return null; end if;
  select * into r from request where id = v_req;
  return jsonb_build_object(
    'no', r.no, 'created_at', r.created_at, 'form', r.form, 'side', r.side, 'region', r.region,
    'industry', r.industry, 'state', r.state::text,
    'rollup', request_rollup(r.id),
    'items', coalesce((select jsonb_agg(jsonb_build_object('service_id', i.service_id, 'state', i.state::text)
                         order by i.created_at) from request_item i where i.request_id = r.id), '[]'::jsonb),
    'notes', coalesce((select jsonb_agg(jsonb_build_object('at', n.at, 'body', n.body) order by n.at desc)
                         from request_note n where n.request_id = r.id and n.kind = 'public'), '[]'::jsonb));
end $$;
revoke all on function lookup_read(text) from public, anon, authenticated;
grant execute on function lookup_read(text) to service_role;

insert into schema_version (n, name) values (83, '0083_storeway_inbox_lookup')
  on conflict (n) do nothing;

commit;
