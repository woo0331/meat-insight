-- ════════════════════════════════════════════════════════════════════
-- 0063 — 자유게시판: 로그인 없이 글쓰기 · 수정 · 삭제 (지시서 C)
--
-- ⚠️⚠️⚠️ **0059 는 쓰기가 `authenticated` 전용이었습니다.** 그래서 이것은
--   "권한을 하나 여는" 일이 아니라 **새 설계**입니다 — 비회원 글에는
--   주인을 가리킬 계정이 없으므로, 주인을 가리는 것이 **글 비밀번호**
--   하나뿐입니다. 그 하나가 뚫리면 남의 글을 고치고 지웁니다.
--
-- ⚠️⚠️⚠️ **비밀번호는 서버에서 단방향 해시로만 둡니다** (지시서 C).
--   pgcrypto 의 `crypt(pw, gen_salt('bf', 10))` = **bcrypt** 입니다.
--   · 평문을 **저장하지 않습니다**
--   · 해시를 **내보내지 않습니다** — 칸 GRANT 에서 빼고 공개 보기에도
--     그 칸이 **아예 없습니다** (자물쇠 둘입니다)
--   · 맞춰 보는 일은 **문 안에서만** 합니다. 화면이 해시를 받아 견주는
--     길은 아예 없습니다 (지시서: "프론트에서만 비밀번호 확인 금지").
--   ⚠️ Supabase 는 pgcrypto 를 `extensions` 스키마에 둡니다. 그래서 문의
--   search_path 에 그 스키마를 같이 적습니다 — **없는 스키마는 조용히
--   무시**되므로 맨 Postgres(검사용)에서도 그대로 돕니다.
--
-- ⚠️⚠️ **지우지 않고 내립니다**(`dropped`). 지우면 분쟁이 났을 때 낼 것이
--   남지 않습니다 (0047 이 세운 규칙 그대로).
--
-- ⚠️⚠️ **쏟아붓기를 막으려면 누가 넣는지 알아야 합니다.** 비회원에게는
--   계정이 없으므로 PostgREST 가 넘겨 주는 `x-forwarded-for` 를 씁니다 —
--   다만 **주소를 그대로 담지 않고 해시**로만 담고, 하루가 지나면
--   지웁니다. ⚠️ 이것은 **처리 항목이 하나 느는 일**이라 개인정보
--   처리방침을 같은 날 고쳐야 합니다 (작업 기억의 그 줄).
--
-- 되돌아갔는지 보는 법:
--   select count(*) from information_schema.columns
--    where table_name = 'cq' and column_name = 'guest_pw';          -- 1
--   select has_function_privilege('anon','ask_cq_guest(jsonb)','execute');  -- t
--   select has_column_privilege('anon','cq','guest_pw','select');   -- f  ← 반드시
-- ════════════════════════════════════════════════════════════════════
begin;

create extension if not exists pgcrypto;

-- ── ① 칸 ─────────────────────────────────────────────────────────
alter table cq alter column by_user drop not null;
alter table cq add column if not exists guest_nick text;
alter table cq add column if not exists guest_pw   text;
alter table cq add column if not exists guest_at   timestamptz;

-- ⚠️⚠️ **주인이 둘 중 하나로 반드시 정해져야 합니다** — 회원 글이면
--   `by_user`, 비회원 글이면 닉네임 + 비밀번호 해시. 둘 다 비면 아무도
--   고칠 수 없는 글이 되고, 둘 다 있으면 누구 글인지 알 수 없습니다.
alter table cq drop constraint if exists cq_owner_ck;
alter table cq add  constraint cq_owner_ck check (
  (by_user is not null and guest_nick is null and guest_pw is null)
  or
  (by_user is null and btrim(coalesce(guest_nick,'')) <> ''
   and btrim(coalesce(guest_pw,'')) <> '')
);

-- ⚠️ 닉네임 길이는 회원 닉네임(0059)과 **같은 자**로 둡니다
alter table cq drop constraint if exists cq_guest_nick_ck;
alter table cq add  constraint cq_guest_nick_ck check (
  guest_nick is null
  or (char_length(btrim(guest_nick)) between 2 and 16
      and guest_nick !~ '[[:cntrl:]]')
);

-- ── ② 쏟아붓기를 세는 자리 ───────────────────────────────────────
-- ⚠️⚠️ **주소를 그대로 담지 않습니다** — sha256 해시만 담고 하루 뒤에
--   지웁니다. 정책도 GRANT 도 **주지 않습니다**: 누가 어디서 썼는지는
--   운영자도 못 읽습니다 (0059 의 `cqview` 와 같은 결).
create table if not exists cqguest_hit (
  ip_hash text        not null,
  at      timestamptz not null default now()
);
create index if not exists cqguest_hit_idx on cqguest_hit (ip_hash, at desc);
alter table cqguest_hit enable row level security;
revoke all on table cqguest_hit from anon, authenticated;

commit;

-- ════════════════════════════════════════════════════════════════════
-- ③ 공개 보기 — 체인: v_cq_public (0047 → 0059 → **0063**)
--
-- ⚠️⚠️⚠️ **`create or replace view` 로는 칸을 못 늘립니다.** 그래서 지우고
--   다시 만들고 **GRANT 를 바로 다시** 줍니다 (안 주면 그날부터
--   `permission denied for view` 입니다 · 0044 에서 겪은 자리).
-- ⚠️⚠️ **비밀번호 해시(`guest_pw`)는 이 보기에 아예 없습니다.** 보기는
--   RLS 를 지나지 않으므로 **여기 적힌 칸이 곧 공개 범위**입니다.
-- ⚠️ 비회원 글은 `mine` 이 늘 거짓입니다 — 계정이 없으니 "내 글" 을 알
--   길이 없고, 고치기 · 내리기는 **비밀번호로** 엽니다.
-- ════════════════════════════════════════════════════════════════════
begin;

drop view if exists v_cq_public;
create view v_cq_public as
  select q.id, q.cat, q.title, q.body, q.created_at, q.updated_at,
         case
           when q.by_user is null then btrim(coalesce(q.guest_nick, '손님'))
           when btrim(coalesce(a.nick, '')) <> '' then btrim(a.nick)
           when btrim(coalesce(a.name, '')) = '' then '회원'
           else left(btrim(a.name), 1) ||
                repeat('*', greatest(char_length(btrim(a.name)) - 1, 1))
         end as who,
         (q.by_user is null or btrim(coalesce(a.nick, '')) <> '') as named,
         -- ⚠️⚠️ **비회원이 쓴 글인가** — 화면이 "비밀번호로 고칩니다" 를
         --   그 자리에서 말하는 데 씁니다. 누가 썼는지는 안 냅니다.
         (q.by_user is null) as guest,
         coalesce(q.by_user = auth.uid(), false) as mine,
         (select count(*) from ca where ca.q_id = q.id and ca.state = 'live') as answer_n,
         (select count(*) from cqview v where v.q_id = q.id) as view_n,
         (select count(*) from cqphoto f where f.q_id = q.id) as photo_n
    from cq q
    left join account a on a.id = q.by_user
   where q.state = 'live';

grant select on v_cq_public to anon, authenticated;

commit;

-- ════════════════════════════════════════════════════════════════════
-- ④ 문 — ⚠️ 비밀번호를 맞춰 보는 일은 **여기 안에서만** 일어납니다
-- ════════════════════════════════════════════════════════════════════
begin;

-- 보는 사람의 주소를 **해시로** 돌려줍니다 (안쪽 도움함수)
-- ⚠️⚠️ **함수는 표와 반대로 기본이 "누구나 실행" 입니다** — 0050 에서
--   그걸 안 거둬 로그인한 누구나 남에게 알림을 꽂을 수 있었습니다.
create or replace function cq_ip_hash()
returns text language plpgsql stable
security definer set search_path = public, extensions as $$
declare v_ip text;
begin
  begin
    v_ip := coalesce(
      split_part(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ',', 1),
      '');
  exception when others then v_ip := '';
  end;
  if btrim(v_ip) = '' then return null; end if;
  -- ⚠️ 주소 **그대로를 안 담습니다** — 돌려주는 것도 해시입니다
  return encode(digest('cqguest|' || btrim(v_ip), 'sha256'), 'hex');
end $$;
revoke all on function cq_ip_hash() from public;

-- ── 비회원 글쓰기 ────────────────────────────────────────────────
create or replace function ask_cq_guest(p jsonb)
returns uuid language plpgsql
security definer set search_path = public, extensions as $$
declare
  v_nick  text := btrim(coalesce(p->>'nick', ''));
  v_cat   text := btrim(coalesce(p->>'cat', ''));
  v_title text := btrim(coalesce(p->>'title', ''));
  v_body  text := btrim(coalesce(p->>'body', ''));
  v_pw    text := coalesce(p->>'pw', '');
  v_trap  text := btrim(coalesce(p->>'website', ''));   -- 허니팟
  v_ip    text;
  v_n     int;
  v_id    uuid;
begin
  -- ⚠️⚠️ **허니팟** — 화면에서는 안 보이는 칸입니다. 사람은 비워 두고
  --   자동 프로그램은 채웁니다. 채워져 있으면 조용히가 아니라 **거절**
  --   합니다 (조용히 성공시키면 올린 사람은 올라간 줄 압니다).
  if v_trap <> '' then
    raise exception '자동 등록으로 보여 받지 않았습니다';
  end if;

  if v_cat = '' then raise exception '게시판을 골라 주세요'; end if;
  if char_length(v_nick) < 2 or char_length(v_nick) > 16 then
    raise exception '닉네임은 2자에서 16자까지입니다';
  end if;
  if v_nick ~ '[[:cntrl:]]' then
    raise exception '닉네임에 줄바꿈을 넣을 수 없습니다';
  end if;
  -- ⚠️ 사칭 이름은 거절합니다 (0059 가 회원 닉네임에 건 그 규칙)
  if lower(v_nick) ~ '(운영자|관리자|골프올인원|admin|master)' then
    raise exception '그 닉네임은 쓰실 수 없습니다';
  end if;
  if char_length(v_title) < 2 or char_length(v_title) > 80 then
    raise exception '제목은 2자에서 80자까지입니다';
  end if;
  if char_length(v_body) < 5 or char_length(v_body) > 4000 then
    raise exception '내용은 5자에서 4000자까지입니다';
  end if;
  -- ⚠️⚠️ **비밀번호가 짧으면 주인을 가리는 자물쇠가 없는 것과 같습니다**
  if char_length(v_pw) < 4 or char_length(v_pw) > 64 then
    raise exception '글 비밀번호는 4자에서 64자까지입니다';
  end if;

  -- ⚠️⚠️ 쏟아붓기 — 주소를 모르면 **막지 못합니다.** 못 막는 것을 막는다고
  --   적지 않습니다: 알 때만 셉니다.
  v_ip := cq_ip_hash();
  if v_ip is not null then
    delete from cqguest_hit where at < now() - interval '1 day';
    select count(*) into v_n from cqguest_hit
     where ip_hash = v_ip and at > now() - interval '10 minutes';
    if v_n >= 3 then
      raise exception '잠시 뒤에 다시 올려 주세요 (10분에 3건까지)';
    end if;
    select count(*) into v_n from cqguest_hit
     where ip_hash = v_ip and at > now() - interval '1 day';
    if v_n >= 20 then
      raise exception '오늘은 더 올리실 수 없습니다 (하루 20건까지)';
    end if;
    insert into cqguest_hit (ip_hash) values (v_ip);
  end if;

  insert into cq (by_user, cat, title, body, guest_nick, guest_pw, guest_at)
  values (null, v_cat, v_title, v_body, v_nick,
          -- ⚠️⚠️⚠️ **bcrypt 단방향** — 평문은 어디에도 안 남습니다
          crypt(v_pw, gen_salt('bf', 10)), now())
  returning id into v_id;
  return v_id;
end $$;
revoke all on function ask_cq_guest(jsonb) from public;
grant execute on function ask_cq_guest(jsonb) to anon, authenticated;

-- ── 비회원 글 고치기 ─────────────────────────────────────────────
-- ⚠️ **보낸 칸만 고칩니다** — 통째로 덮으면 화면이 칸을 빠뜨리는 날
--   그 칸이 지워집니다 (`save_provider_self` 에서 겪은 자리).
-- ⚠️⚠️ **게시판 · 닉네임은 못 고칩니다** — 바꾸면 읽던 분이 다른 글을
--   보게 됩니다 (0056 · 0061 에서 지역 · 분류를 막은 그 까닭).
create or replace function edit_cq_guest(p jsonb)
returns void language plpgsql
security definer set search_path = public, extensions as $$
declare
  v_id    uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_pw    text := coalesce(p->>'pw', '');
  v_title text := btrim(coalesce(p->>'title', ''));
  v_body  text := btrim(coalesce(p->>'body', ''));
  v_hash  text;
  v_state text;
begin
  if v_id is null then raise exception '어느 글인지 알 수 없습니다'; end if;
  select guest_pw, state into v_hash, v_state from cq where id = v_id;
  if v_hash is null then
    -- ⚠️ 회원 글이거나 없는 글입니다. **어느 쪽인지 말하지 않습니다** —
    --   말하면 "이 번호는 있는 글" 을 알려 주는 자리가 됩니다.
    raise exception '비밀번호가 맞지 않습니다';
  end if;
  if v_state <> 'live' then raise exception '이미 내려간 글입니다'; end if;
  -- ⚠️⚠️⚠️ 맞춰 보는 것은 **여기뿐**입니다 (화면은 해시를 못 받습니다)
  if v_hash <> crypt(v_pw, v_hash) then
    raise exception '비밀번호가 맞지 않습니다';
  end if;
  if v_title <> '' and (char_length(v_title) < 2 or char_length(v_title) > 80) then
    raise exception '제목은 2자에서 80자까지입니다';
  end if;
  if v_body <> '' and (char_length(v_body) < 5 or char_length(v_body) > 4000) then
    raise exception '내용은 5자에서 4000자까지입니다';
  end if;
  update cq set
    title      = case when v_title <> '' then v_title else title end,
    body       = case when v_body  <> '' then v_body  else body  end,
    updated_at = now()
  where id = v_id;
end $$;
revoke all on function edit_cq_guest(jsonb) from public;
grant execute on function edit_cq_guest(jsonb) to anon, authenticated;

-- ── 비회원 글 내리기 ─────────────────────────────────────────────
-- ⚠️⚠️ **지우지 않고 내립니다**(`dropped`) — 지우면 분쟁이 났을 때 낼
--   것이 없습니다. 공개 보기는 `state = 'live'` 만 내므로 손님에게는
--   그 자리에서 사라집니다.
create or replace function drop_cq_guest(p jsonb)
returns void language plpgsql
security definer set search_path = public, extensions as $$
declare
  v_id   uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_pw   text := coalesce(p->>'pw', '');
  v_hash text;
  v_state text;
begin
  if v_id is null then raise exception '어느 글인지 알 수 없습니다'; end if;
  select guest_pw, state into v_hash, v_state from cq where id = v_id;
  if v_hash is null then raise exception '비밀번호가 맞지 않습니다'; end if;
  if v_state <> 'live' then raise exception '이미 내려간 글입니다'; end if;
  if v_hash <> crypt(v_pw, v_hash) then
    raise exception '비밀번호가 맞지 않습니다';
  end if;
  update cq set state = 'dropped', updated_at = now() where id = v_id;
end $$;
revoke all on function drop_cq_guest(jsonb) from public;
grant execute on function drop_cq_guest(jsonb) to anon, authenticated;

-- ⚠️⚠️⚠️ **해시를 읽는 길을 전부 막습니다.** 0059 는 `cq` 를 표로 읽는
--   길을 열어 두었는데, 거기 새 칸이 붙었으므로 **칸 단위로** 다시
--   좁힙니다 — RLS 는 줄은 막아도 **칸은 못 막습니다**(0053 에서
--   운영자 메모가 손님에게 읽히던 그 자리).
-- ⚠️⚠️⚠️ **`anon` 에게는 표를 열지 않습니다.** 0047 은 `cq` 표를
--   `authenticated` 에게만 주었고, 비로그인은 **공개 보기**로만 읽습니다.
--   처음에 여기서 `anon` 에게도 칸을 주었다가 **`sql/board.js` 의
--   "비로그인은 표를 못 읽는다" 가 바로 떨어졌습니다** — 검사가
--   제가 넷 선을 그 자리에서 잡았습니다.
revoke select on cq from authenticated;
grant select (id, by_user, cat, title, body, state, hidden_why,
              created_at, updated_at, guest_nick, guest_at)
  on cq to authenticated;

commit;

begin;
insert into schema_version (n, name) values (63, '0063_guest_board')
  on conflict (n) do nothing;
commit;

-- ════════════════════════════════════════════════════════════════════
-- ⑤ 체인: move_cq (0047 → **0063**)
--
-- ⚠️⚠️⚠️ **운영자가 비회원 글을 가릴 수가 없었습니다.** 0047 의
--   `move_cq` 는 글을 찾은 뒤 이렇게 막습니다 —
--     if v_by is null then raise exception '그런 질문이 없습니다';
--   `v_by` 는 `cq.by_user` 입니다. 비회원 글은 그 칸이 **비어 있는 것이
--   정상**이므로, 줄이 멀쩡히 있는데도 "그런 질문이 없습니다" 로
--   튕겼습니다. 즉 지시서 C 가 요구한 **관리자 숨김**이 비회원 글에
--   대해서는 **처음부터 돌 수 없는 코드**였습니다.
--   ⚠️ "줄이 없다" 와 "칸이 비었다" 를 한 가지로 읽은 자리입니다 —
--   작업 기억에 **다른 자물쇠이므로 갈라서 재라**고 적어 둔 그것입니다.
--
-- ⚠️ 고치면서 선은 그대로 둡니다 —
--   · 내리는 것(`dropped`)은 **글쓴이만**. 비회원은 계정이 없으므로
--     이 문이 아니라 **`drop_cq_guest`**(비밀번호)로 내립니다.
--   · 가리는 것(`hidden`)은 **운영자만**, **까닭이 반드시**, 그리고
--     감사 기록에 남습니다 (글 내용은 안 담고 번호로 찾아갑니다).
--
-- 되돌아갔는지 보는 법 (비회원 글 하나를 만들어 두고):
--   select move_cq(jsonb_build_object('id', '<글>', 'state','hidden',
--                                     'why','검사용으로 가립니다'));
--   → '그런 질문이 없습니다' 가 나오면 0047 로 되돌아간 것입니다.
-- ════════════════════════════════════════════════════════════════════
begin;

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
  v_n   int;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  -- ⚠️⚠️ **줄이 있나**와 **칸이 비었나**를 갈라서 봅니다. 전에는 칸이
  --   빈 것을 줄이 없는 것으로 읽어 비회원 글이 통째로 막혔습니다.
  select count(*) into v_n from cq where id = v_id;
  if v_n = 0 then raise exception '그런 질문이 없습니다'; end if;
  select by_user, state into v_by, v_st from cq where id = v_id for update;

  if v_to = 'dropped' then
    -- 내리는 것은 **글쓴이만** — 비회원 글은 `drop_cq_guest` 로 갑니다
    if v_by is null then
      raise exception '로그인 없이 올린 글은 글 비밀번호로 내리셔야 합니다';
    end if;
    if not coalesce(v_by = v_uid, false) then
      raise exception '올리신 분만 내리실 수 있습니다';
    end if;
    if v_st <> 'live' then raise exception '이미 내려간 글입니다'; end if;
    update cq set state = 'dropped', updated_at = now() where id = v_id;
    return 'dropped';
  elsif v_to = 'hidden' then
    -- 가리는 것은 **운영자만** — 비회원 글도 같습니다
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
            jsonb_build_object('why_len', char_length(v_why),
                               'guest', (v_by is null)));
    return 'hidden';
  end if;
  raise exception '옮길 수 없는 상태입니다';
end $$;
grant execute on function move_cq(jsonb) to authenticated;

commit;
