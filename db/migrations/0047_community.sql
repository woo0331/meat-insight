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
