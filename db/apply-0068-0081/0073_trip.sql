-- 0073_trip · 운영 DB 판이 72 일 때만 실행합니다
select max(n) from schema_version;
create table if not exists trip (
  id          uuid primary key default gen_random_uuid(),
  provider_id text not null references provider(id) on delete cascade,
  by_user     uuid not null references auth.users(id) on delete cascade,
  scope       text not null check (scope in ('home','abroad')),
  dest        text not null check (btrim(dest) <> '' and char_length(dest) <= 40),
  title       text not null check (char_length(btrim(title)) between 2 and 80),
  body        text not null check (char_length(btrim(body)) between 5 and 4000),
  nights      int not null check (nights >= 0 and nights <= 60),
  days        int not null check (days   >= 1 and days   <= 61),
  constraint trip_span_ck check (days > nights),
  price_from  bigint not null check (price_from > 0 and price_from <= 100000000),
  price_note  text check (price_note is null or char_length(price_note) <= 120),
  incl        text[] not null default '{}',
  excl        text[] not null default '{}',
  constraint trip_incl_ck check (array_length(incl,1) is null or array_length(incl,1) <= 12),
  constraint trip_excl_ck check (array_length(excl,1) is null or array_length(excl,1) <= 12),
  state       text not null default 'pending'
              check (state in ('pending','approved','rejected','closed','hidden')),
  hidden_from text,
  state_why   text,
  state_by    uuid references auth.users(id) on delete set null,
  state_at    timestamptz,
  draft       jsonb,
  draft_state text not null default 'none'
              check (draft_state in ('none','pending','rejected')),
  draft_why   text,
  draft_by    uuid references auth.users(id) on delete set null,
  draft_at    timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint trip_why_ck check (
    state not in ('rejected','hidden') or btrim(coalesce(state_why,'')) <> ''),
  constraint trip_draft_ck check (
    (draft_state = 'none') = (draft is null)),
  constraint trip_draft_why_ck check (
    draft_state <> 'rejected' or btrim(coalesce(draft_why,'')) <> '')
);
create index if not exists trip_open_ix  on trip (state, scope, dest);
create index if not exists trip_pv_ix    on trip (provider_id, state);
create index if not exists trip_draft_ix on trip (draft_state);
create table if not exists tripphoto (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references trip(id) on delete cascade,
  by_user    uuid not null references auth.users(id) on delete cascade,
  path       text not null unique,
  mime       text not null,
  bytes      int  not null,
  caption    text,
  ord        int  not null default 0,
  live         boolean not null default true,
  drop_pending boolean not null default false,
  created_at timestamptz not null default now(),
  constraint tripphoto_mime_ok  check (mime in ('image/jpeg','image/png','image/webp')),
  constraint tripphoto_bytes_ok check (bytes > 0 and bytes <= 8388608),
  constraint tripphoto_cap_ok   check (caption is null or char_length(caption) <= 60),
  constraint tripphoto_ord_ok   check (ord >= 0 and ord <= 99),
  constraint tripphoto_drop_ok  check (not drop_pending or live),
  constraint tripphoto_path_ok check (
    path <> '' and length(path) <= 300
    and path = 'trip/' || trip_id::text || '/photo/' || split_part(path, '/', 4))
);
create index if not exists tripphoto_ord_ix on tripphoto (trip_id, ord, created_at);
alter table trip      enable row level security;
alter table tripphoto enable row level security;
drop view if exists v_trip_open;
create view v_trip_open as
  select t.id, t.scope, t.dest, t.title, t.body, t.nights, t.days,
         t.price_from, t.price_note, t.incl, t.excl,
         t.created_at, t.updated_at,
         pv.id   as provider_id,
         pv.name as provider_name,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and ph.live) as photo_n,
         (select ph.path from tripphoto ph
           where ph.trip_id = t.id and ph.live
           order by ph.ord, ph.created_at, ph.id limit 1) as thumb
    from trip t
    join provider pv on pv.id = t.provider_id
   where t.state = 'approved'
     and pv.state = 'approved'
     and pv.is_test = false;
grant select on v_trip_open to anon, authenticated;
drop view if exists v_trip_photo_public;
create view v_trip_photo_public as
  select ph.id, ph.trip_id, ph.path, ph.caption, ph.ord
    from tripphoto ph
    join trip t      on t.id = ph.trip_id
    join provider pv on pv.id = t.provider_id
   where ph.live
     and t.state = 'approved' and pv.state = 'approved' and pv.is_test = false
   order by ph.trip_id, ph.ord, ph.created_at, ph.id;
grant select on v_trip_photo_public to anon, authenticated;
drop view if exists v_trip_mine;
create view v_trip_mine as
  select t.*,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and ph.live) as photo_n,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and not ph.live) as photo_draft_n,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and ph.drop_pending) as photo_drop_n
    from trip t
   where t.provider_id = my_provider();
grant select on v_trip_mine to authenticated;
drop view if exists v_trip_photo_mine;
create view v_trip_photo_mine as
  select ph.id, ph.trip_id, ph.path, ph.caption, ph.ord,
         ph.live, ph.drop_pending, ph.created_at
    from tripphoto ph
    join trip t on t.id = ph.trip_id
   where t.provider_id = my_provider()
   order by ph.trip_id, ph.ord, ph.created_at, ph.id;
grant select on v_trip_photo_mine to authenticated;
drop view if exists v_trip_review;
create view v_trip_review as
  select t.*, pv.name as provider_name,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and ph.live) as photo_n,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and not ph.live) as photo_draft_n,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and ph.drop_pending) as photo_drop_n
    from trip t
    join provider pv on pv.id = t.provider_id
   where coalesce(my_role()::text, '') in ('admin','staff');
grant select on v_trip_review to authenticated;
create or replace function trip_fields(p jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_scope text := nullif(btrim(coalesce(p->>'scope','')), '');
  v_dest  text := nullif(btrim(coalesce(p->>'dest','')), '');
  v_title text := nullif(btrim(coalesce(p->>'title','')), '');
  v_body  text := nullif(btrim(coalesce(p->>'body','')), '');
  v_note  text := nullif(btrim(coalesce(p->>'price_note','')), '');
  v_n int; v_d int; v_price bigint;
  v_incl text[] := coalesce((select array_agg(btrim(x)) from
    jsonb_array_elements_text(case when jsonb_typeof(p->'incl') = 'array'
      then p->'incl' else '[]'::jsonb end) x where btrim(x) <> ''), '{}');
  v_excl text[] := coalesce((select array_agg(btrim(x)) from
    jsonb_array_elements_text(case when jsonb_typeof(p->'excl') = 'array'
      then p->'excl' else '[]'::jsonb end) x where btrim(x) <> ''), '{}');
begin
  if v_scope is null or v_scope not in ('home','abroad') then
    raise exception '국내 · 해외 가운데 하나를 골라 주세요';
  end if;
  if v_dest is null or char_length(v_dest) > 40 then
    raise exception '목적지를 골라 주세요';
  end if;
  if v_title is null or char_length(v_title) < 2 then
    raise exception '상품 이름을 두 글자 이상 적어 주세요';
  end if;
  if char_length(v_title) > 80 then
    raise exception '상품 이름이 너무 깁니다 (80자)';
  end if;
  if v_body is null or char_length(v_body) < 5 then
    raise exception '상품 설명을 다섯 글자 이상 적어 주세요';
  end if;
  if char_length(v_body) > 4000 then
    raise exception '상품 설명이 너무 깁니다 (4000자)';
  end if;
  begin
    v_n := coalesce((nullif(btrim(coalesce(p->>'nights','')), ''))::int, -1);
    v_d := coalesce((nullif(btrim(coalesce(p->>'days','')),   ''))::int, -1);
  exception when others then
    raise exception '일정은 숫자로 적어 주세요';
  end;
  if v_n < 0 or v_n > 60 or v_d < 1 or v_d > 61 then
    raise exception '일정이 올바르지 않습니다';
  end if;
  if v_d <= v_n then
    raise exception '일수는 박수보다 하루 많아야 합니다';
  end if;
  begin
    v_price := (nullif(btrim(coalesce(p->>'price_from','')), ''))::bigint;
  exception when others then
    raise exception '가격은 숫자로 적어 주세요';
  end;
  -- ⚠️⚠️ 비우면 화면이 "가격 문의" 를 **지어 적게** 됩니다 (절대 규칙 1)
  if v_price is null then
    raise exception '1인 기준 최저 가격을 적어 주세요';
  end if;
  if v_price <= 0 then
    raise exception '가격은 0원보다 커야 합니다';
  end if;
  if v_price > 100000000 then
    raise exception '가격이 너무 큽니다 (자릿수를 확인해 주세요)';
  end if;
  if v_note is not null and char_length(v_note) > 120 then
    raise exception '가격 안내가 너무 깁니다 (120자)';
  end if;
  if coalesce(array_length(v_incl,1),0) > 12
     or coalesce(array_length(v_excl,1),0) > 12 then
    raise exception '포함 · 불포함 항목은 각각 열둘까지입니다';
  end if;
  return jsonb_build_object(
    'scope', v_scope, 'dest', v_dest, 'title', v_title, 'body', v_body,
    'nights', v_n, 'days', v_d, 'price_from', v_price,
    'price_note', v_note, 'incl', to_jsonb(v_incl), 'excl', to_jsonb(v_excl));
end $$;
revoke all on function trip_fields(jsonb) from public;
create or replace function trip_apply(p_id uuid, d jsonb)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update trip set
    scope = d->>'scope', dest = d->>'dest', title = d->>'title',
    body = d->>'body',
    nights = (d->>'nights')::int, days = (d->>'days')::int,
    price_from = (d->>'price_from')::bigint,
    price_note = nullif(btrim(coalesce(d->>'price_note','')), ''),
    incl = coalesce((select array_agg(x) from
      jsonb_array_elements_text(coalesce(d->'incl','[]'::jsonb)) x), '{}'),
    excl = coalesce((select array_agg(x) from
      jsonb_array_elements_text(coalesce(d->'excl','[]'::jsonb)) x), '{}'),
    updated_at = now()
  where id = p_id;
  -- 사진도 같이 갈아 끼웁니다 — 올린 것은 보이게, 뺀 것은 지웁니다
  delete from tripphoto where trip_id = p_id and drop_pending;
  update tripphoto set live = true where trip_id = p_id and not live;
  -- ⚠️⚠️ **차례도 수정본 안에 담깁니다.** 승인 뒤에 차례를 바꾸면
  --   대표 사진이 그 자리에서 바뀌는데, 그러면 "공개본은 그대로" 가
  --   거짓이 됩니다. 그래서 차례는 여기서 한꺼번에 씁니다.
  if d ? 'photo_order' then
    update tripphoto ph set ord = x.i - 1
      from (select u::uuid as id, ordinality as i
              from jsonb_array_elements_text(d->'photo_order')
                   with ordinality as t(u, ordinality)) x
     where ph.id = x.id and ph.trip_id = p_id;
  end if;
end $$;
revoke all on function trip_apply(uuid, jsonb) from public;
create or replace function open_trip(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_pv text := my_provider();
  v_f  jsonb;
  v_id uuid;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_pv is null then
    raise exception '여행 상품은 입점하신 업체만 올릴 수 있습니다';
  end if;
  if not coalesce((select pv.state = 'approved' and pv.is_test = false
                     from provider pv where pv.id = v_pv), false) then
    raise exception '승인된 업체만 상품을 올릴 수 있습니다';
  end if;
  v_f := trip_fields(p);
  -- ⚠️ 쏟아붓기 막기 — 심사 대기가 쌓이면 운영자가 못 봅니다
  if (select count(*) from trip
       where provider_id = v_pv and state in ('pending','approved')) >= 50 then
    raise exception '올려 두신 상품이 쉰입니다. 먼저 정리해 주세요';
  end if;
  if (select count(*) from trip
       where provider_id = v_pv and created_at > now() - interval '1 day') >= 20 then
    raise exception '오늘은 더 올릴 수 없습니다 (하루 스무 개)';
  end if;
  insert into trip (provider_id, by_user, scope, dest, title, body,
                    nights, days, price_from, price_note, incl, excl)
  values (v_pv, v_me, v_f->>'scope', v_f->>'dest', v_f->>'title', v_f->>'body',
          (v_f->>'nights')::int, (v_f->>'days')::int,
          (v_f->>'price_from')::bigint,
          nullif(btrim(coalesce(v_f->>'price_note','')), ''),
          coalesce((select array_agg(x) from jsonb_array_elements_text(v_f->'incl') x), '{}'),
          coalesce((select array_agg(x) from jsonb_array_elements_text(v_f->'excl') x), '{}'))
  returning id into v_id;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'trip', v_id::text, 'pending',
          jsonb_build_object('provider', v_pv, 'scope', v_f->>'scope'));
  return v_id;
end $$;
revoke all on function open_trip(jsonb) from public;
grant execute on function open_trip(jsonb) to authenticated;
create or replace function edit_trip(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_pv text := my_provider();
  v_id uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_owner text; v_st text;
  v_f jsonb;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 상품인지 알 수 없습니다'; end if;
  select provider_id, state into v_owner, v_st from trip where id = v_id for update;
  if v_owner is null then raise exception '그런 상품이 없습니다'; end if;
  if v_pv is null or v_owner <> v_pv then
    raise exception '올리신 업체만 고치실 수 있습니다';
  end if;
  if v_st = 'hidden' then
    raise exception '운영자가 가린 상품은 고치실 수 없습니다';
  end if;
  if v_st = 'closed' then
    raise exception '판매를 중지하신 상품입니다. 먼저 다시 올려 주세요';
  end if;
  v_f := trip_fields(p);
  if v_st = 'approved' then
    -- 공개본은 그대로 — 수정본만 담습니다
    update trip set draft = v_f, draft_state = 'pending',
                    draft_why = null, draft_by = v_me, draft_at = now(),
                    updated_at = now()
     where id = v_id;
    insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
    values (v_me, my_role(), 'trip', v_id::text, 'draft_pending', '{}'::jsonb);
    return 'draft';
  end if;
  -- 아직 공개된 적이 없습니다 — 그 자리에서 고치고 다시 심사로
  perform trip_apply(v_id, v_f);
  update trip set state = 'pending', state_why = null,
                  state_by = null, state_at = null, updated_at = now()
   where id = v_id;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'trip', v_id::text, 'pending',
          jsonb_build_object('edited', true, 'was', v_st));
  return 'pending';
end $$;
revoke all on function edit_trip(jsonb) from public;
grant execute on function edit_trip(jsonb) to authenticated;
create or replace function close_trip(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_pv text := my_provider();
  v_id uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_owner text; v_st text;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 상품인지 알 수 없습니다'; end if;
  select provider_id, state into v_owner, v_st from trip where id = v_id for update;
  if v_owner is null then raise exception '그런 상품이 없습니다'; end if;
  if v_pv is null or v_owner <> v_pv then
    raise exception '올리신 업체만 중지하실 수 있습니다';
  end if;
  if v_st = 'hidden' then
    raise exception '운영자가 가린 상품입니다';
  end if;
  -- ⚠️ 같은 상태로 옮기는 것은 거절합니다 — 조용히 성공하면 화면이
  --   "중지했습니다" 를 적는데 아무 일도 안 일어났습니다 (0069 의 자리).
  if v_st = 'closed' then
    raise exception '이미 판매를 중지하신 상품입니다';
  end if;
  update trip set state = 'closed', updated_at = now() where id = v_id;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'trip', v_id::text, 'closed',
          jsonb_build_object('was', v_st));
  return v_id;
end $$;
revoke all on function close_trip(jsonb) from public;
grant execute on function close_trip(jsonb) to authenticated;
create or replace function reopen_trip(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_pv text := my_provider();
  v_id uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_owner text; v_st text;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 상품인지 알 수 없습니다'; end if;
  select provider_id, state into v_owner, v_st from trip where id = v_id for update;
  if v_owner is null then raise exception '그런 상품이 없습니다'; end if;
  if v_pv is null or v_owner <> v_pv then
    raise exception '올리신 업체만 다시 올리실 수 있습니다';
  end if;
  if v_st <> 'closed' then
    raise exception '판매를 중지하신 상품만 다시 올리실 수 있습니다';
  end if;
  update trip set state = 'pending', updated_at = now() where id = v_id;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'trip', v_id::text, 'pending',
          jsonb_build_object('reopened', true));
  return v_id;
end $$;
revoke all on function reopen_trip(jsonb) from public;
grant execute on function reopen_trip(jsonb) to authenticated;
create or replace function trip_touch_draft(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare r trip%rowtype;
begin
  select * into r from trip where id = p_id;
  if r.id is null or r.state <> 'approved' then return; end if;
  if r.draft_state <> 'none' then return; end if;
  update trip set
    draft = jsonb_build_object(
      'scope', r.scope, 'dest', r.dest, 'title', r.title, 'body', r.body,
      'nights', r.nights, 'days', r.days, 'price_from', r.price_from,
      'price_note', r.price_note,
      'incl', to_jsonb(r.incl), 'excl', to_jsonb(r.excl)),
    draft_state = 'pending', draft_why = null,
    draft_by = auth.uid(), draft_at = now(), updated_at = now()
  where id = p_id;
end $$;
revoke all on function trip_touch_draft(uuid) from public;
create or replace function move_trip(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_id uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_to text := nullif(btrim(coalesce(p->>'to','')), '');
  v_why text := nullif(btrim(coalesce(p->>'why','')), '');
  v_st text; v_from text;
begin
  if coalesce(my_role()::text, '') not in ('admin','staff') then
    raise exception '운영자만 할 수 있습니다';
  end if;
  if v_id is null then raise exception '어느 상품인지 알 수 없습니다'; end if;
  select state, hidden_from into v_st, v_from from trip where id = v_id for update;
  if v_st is null then raise exception '그런 상품이 없습니다'; end if;
  if v_to is null or v_to not in ('approved','rejected','hidden','restore') then
    raise exception '승인 · 반려 · 가리기 · 되돌리기 가운데 하나를 골라 주세요';
  end if;
  if v_to <> 'restore' and v_to = v_st then
    raise exception '이미 그 상태입니다';
  end if;
  if v_to in ('rejected','hidden') and v_why is null then
    raise exception '까닭을 적어 주세요';
  end if;
  if v_why is not null and char_length(v_why) > 200 then
    raise exception '까닭이 너무 깁니다 (200자)';
  end if;
  if v_to = 'restore' then
    if v_st <> 'hidden' then
      raise exception '가려진 상품만 되돌릴 수 있습니다';
    end if;
    if v_from is null then
      raise exception '가리기 전 상태를 알 수 없습니다';
    end if;
    update trip set state = v_from, hidden_from = null,
                    state_why = null, state_by = v_me, state_at = now(),
                    updated_at = now()
     where id = v_id;
    insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
    values (v_me, my_role(), 'trip', v_id::text, v_from,
            jsonb_build_object('restored', true));
    return v_id;
  end if;
  update trip
     set state = v_to,
         hidden_from = case when v_to = 'hidden' then v_st else null end,
         state_why = v_why, state_by = v_me, state_at = now(),
         updated_at = now()
   where id = v_id;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'trip', v_id::text, v_to,
          jsonb_build_object('was', v_st, 'has_why', v_why is not null));
  return v_id;
end $$;
revoke all on function move_trip(jsonb) from public;
grant execute on function move_trip(jsonb) to authenticated;
create or replace function review_trip_draft(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_id uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_to text := nullif(btrim(coalesce(p->>'to','')), '');
  v_why text := nullif(btrim(coalesce(p->>'why','')), '');
  v_ds text; v_d jsonb;
begin
  if coalesce(my_role()::text, '') not in ('admin','staff') then
    raise exception '운영자만 할 수 있습니다';
  end if;
  if v_id is null then raise exception '어느 상품인지 알 수 없습니다'; end if;
  select draft_state, draft into v_ds, v_d from trip where id = v_id for update;
  if v_ds is null then raise exception '그런 상품이 없습니다'; end if;
  if v_ds = 'none' or v_d is null then
    raise exception '심사할 수정본이 없습니다';
  end if;
  if v_to is null or v_to not in ('approved','rejected') then
    raise exception '승인 · 반려 가운데 하나를 골라 주세요';
  end if;
  if v_to = 'rejected' and v_why is null then
    raise exception '까닭을 적어 주세요';
  end if;
  if v_why is not null and char_length(v_why) > 200 then
    raise exception '까닭이 너무 깁니다 (200자)';
  end if;
  if v_to = 'approved' then
    perform trip_apply(v_id, v_d);
    update trip set draft = null, draft_state = 'none', draft_why = null,
                    draft_by = v_me, draft_at = now(), updated_at = now()
     where id = v_id;
  else
    -- ⚠️ 수정본을 **지우지 않습니다** — 여행사가 그것을 고쳐 다시 냅니다
    update trip set draft_state = 'rejected', draft_why = v_why,
                    draft_by = v_me, draft_at = now(), updated_at = now()
     where id = v_id;
  end if;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'trip', v_id::text, 'draft_' || v_to,
          jsonb_build_object('has_why', v_why is not null));
  return v_id;
end $$;
revoke all on function review_trip_draft(jsonb) from public;
grant execute on function review_trip_draft(jsonb) to authenticated;
create or replace function claim_trip_photo(p jsonb default '{}'::jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_pv text := my_provider();
  v_t  uuid := nullif(btrim(coalesce(p->>'trip','')), '')::uuid;
  v_mime text := lower(btrim(coalesce(p->>'mime','')));
  v_bytes int := coalesce((nullif(btrim(coalesce(p->>'bytes','')), ''))::int, 0);
  v_cap text := nullif(btrim(coalesce(p->>'caption','')), '');
  v_st text; v_ext text; v_path text; v_id uuid; v_ord int; v_after int;
begin
  if v_me is null then raise exception '로그인하셔야 사진을 올릴 수 있습니다'; end if;
  if v_t is null then raise exception '어느 상품인지 알 수 없습니다'; end if;
  select state into v_st from trip
   where id = v_t and v_pv is not null and provider_id = v_pv;
  if v_st is null or v_st in ('closed','hidden') then
    raise exception '그 상품에는 사진을 붙일 수 없습니다';
  end if;
  if v_mime not in ('image/jpeg','image/png','image/webp') then
    raise exception '사진은 JPG · PNG · WEBP 만 올리실 수 있습니다';
  end if;
  if v_bytes <= 0 or v_bytes > 8388608 then
    raise exception '한 장에 8MB 까지 올리실 수 있습니다';
  end if;
  if v_cap is not null and char_length(v_cap) > 60 then
    raise exception '사진 설명이 너무 깁니다 (60자)';
  end if;
  select count(*) into v_after from tripphoto
   where trip_id = v_t and not drop_pending;
  if v_after >= 10 then
    raise exception '사진은 열 장까지입니다. 먼저 빼 주세요';
  end if;
  select coalesce(max(ord), -1) + 1 into v_ord from tripphoto where trip_id = v_t;
  if v_ord > 99 then v_ord := 99; end if;
  v_ext := case v_mime when 'image/jpeg' then 'jpg'
                       when 'image/png'  then 'png' else 'webp' end;
  v_path := 'trip/' || v_t::text || '/photo/' || gen_random_uuid()::text || '.' || v_ext;
  insert into tripphoto (trip_id, by_user, path, mime, bytes, caption, ord, live)
  values (v_t, v_me, v_path, v_mime, v_bytes, v_cap, v_ord, v_st <> 'approved')
  returning id into v_id;
  -- 승인된 상품이면 **심사를 받아야** 보입니다 (안 열어 두면 영영 안 보입니다)
  perform trip_touch_draft(v_t);
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'tripphoto', v_id::text, 'claimed',
          jsonb_build_object('mime', v_mime, 'bytes', v_bytes,
                             'live', v_st <> 'approved'));
  return jsonb_build_object('id', v_id, 'path', v_path, 'ord', v_ord,
                            'live', v_st <> 'approved');
end $$;
revoke all on function claim_trip_photo(jsonb) from public;
grant execute on function claim_trip_photo(jsonb) to authenticated;
create or replace function drop_trip_photo(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_pv text := my_provider();
  v_id uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_t uuid; v_live boolean; v_drop boolean; v_st text; v_n int;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 사진인지 알 수 없습니다'; end if;
  select ph.trip_id, ph.live, ph.drop_pending, t.state
    into v_t, v_live, v_drop, v_st
    from tripphoto ph join trip t on t.id = ph.trip_id
   where ph.id = v_id and v_pv is not null and t.provider_id = v_pv;
  if v_t is null then raise exception '그 사진은 뺄 수 없습니다'; end if;
  if v_drop then raise exception '이미 뺄 사진으로 표시하셨습니다'; end if;
  if v_st = 'approved' and v_live then
    update tripphoto set drop_pending = true where id = v_id;
    perform trip_touch_draft(v_t);
    insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
    values (v_me, my_role(), 'tripphoto', v_id::text, 'drop_pending', '{}'::jsonb);
    return 'pending';
  end if;
  delete from tripphoto where id = v_id;
  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception '그 사진은 뺄 수 없습니다'; end if;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'tripphoto', v_id::text, 'dropped', '{}'::jsonb);
  return 'dropped';
end $$;
revoke all on function drop_trip_photo(jsonb) from public;
grant execute on function drop_trip_photo(jsonb) to authenticated;
create or replace function order_trip_photo(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_pv text := my_provider();
  v_t  uuid := nullif(btrim(coalesce(p->>'trip','')), '')::uuid;
  v_ids uuid[]; v_have int; v_i int; v_st text; v_d jsonb;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_t is null then raise exception '어느 상품인지 알 수 없습니다'; end if;
  select state into v_st from trip
   where id = v_t and v_pv is not null and provider_id = v_pv;
  if v_st is null then raise exception '그 상품은 고치실 수 없습니다'; end if;
  select coalesce(array_agg(x::uuid), '{}') into v_ids
    from jsonb_array_elements_text(coalesce(p->'ids','[]'::jsonb)) x;
  select count(*) into v_have from tripphoto where trip_id = v_t;
  if coalesce(array_length(v_ids,1),0) <> v_have then
    raise exception '사진 차례는 빠짐없이 보내 주셔야 합니다';
  end if;
  if (select count(distinct u) from unnest(v_ids) u) <> v_have then
    raise exception '같은 사진이 두 번 들어 있습니다';
  end if;
  if exists (select 1 from unnest(v_ids) u
              where u not in (select id from tripphoto where trip_id = v_t)) then
    raise exception '그 상품의 사진이 아닌 것이 섞여 있습니다';
  end if;
  if v_st = 'approved' then
    perform trip_touch_draft(v_t);
    select draft into v_d from trip where id = v_t;
    update trip set draft = coalesce(v_d,'{}'::jsonb)
                      || jsonb_build_object('photo_order', to_jsonb(v_ids)),
                    updated_at = now()
     where id = v_t;
    return 'pending';
  end if;
  v_i := 0;
  while v_i < v_have loop
    update tripphoto set ord = v_i where id = v_ids[v_i + 1];
    v_i := v_i + 1;
  end loop;
  return 'done';
end $$;
revoke all on function order_trip_photo(jsonb) from public;
grant execute on function order_trip_photo(jsonb) to authenticated;
insert into schema_version (n, name) values (73, '0073_trip')
  on conflict (n) do nothing;
commit;
select max(n) as ver from schema_version;
