-- ════════════════════════════════════════════════════════════════════
-- 0065 — 비회원 글의 **비밀번호 반복 시도**를 막습니다
--        (최종 작업지시서 C 의 "반복 비밀번호 시도 제한")
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **0063 이 쏟아붓기를 막는 자리를 한 곳만 걸었습니다.**
--   `ask_cq_guest`(새 글 올리기)에는 10분 3건 · 하루 20건이 걸려 있는데,
--   `edit_cq_guest` · `drop_cq_guest` 에는 **시도 횟수 제한이 한 줄도
--   없었습니다** — 글 비밀번호가 네 자리여도 되므로, 한 글에 번호를
--   끝까지 넣어 보면 남의 글을 고치거나 내릴 수 있습니다.
--   ⚠️ bcrypt(cost 10)가 한 번에 수십 밀리초를 쓰므로 빠르지는 않지만,
--   **무제한이면 시간이 해결해 줍니다**. 지시서 C 가 그 줄을 따로 적어
--   둔 까닭입니다.
--
-- ⚠️⚠️ **막는 것은 "틀린 시도" 입니다.** 맞은 시도는 안 셉니다 — 세면
--   제 글을 여러 번 고치시는 분이 먼저 막힙니다.
--
-- ⚠️⚠️⚠️ **주소(IP)를 모르면 못 막습니다.** 0063 의 `cq_ip_hash()` 는
--   `x-forwarded-for` 가 있을 때만 값을 냅니다 — 없으면 셀 자리가
--   없습니다. **못 막는 것을 막는다고 적지 않습니다**(`make_request` 가
--   "번호를 바꿔 가며 넣는 것은 못 막습니다" 라고 적어 둔 그 자리).
--   ⚠️ 그리고 주소를 바꿔 가며 넣는 것도 못 막습니다. 그래서 **글마다**
--   한 겹 더 둡니다 — 다만 그 겹은 **느슨하게**(한 시간에 30번) 둡니다.
--   빡빡하게 걸면 남이 일부러 틀려서 **글쓴이가 제 글을 못 고치게**
--   만드는 자리가 됩니다(막는 것이 거꾸로 공격이 되는 꼴).
--
-- ⚠️⚠️ **사람 정보를 담지 않습니다** — 주소는 **해시**로만 담고(0063 의
--   `cq_ip_hash()` 그대로), 글 번호와 시각뿐입니다. 하루 지난 줄은
--   부를 때마다 치웁니다.
--
-- ⚠️ 거절하는 말을 **비밀번호가 틀렸을 때와 다르게** 둡니다 — 같은 말을
--   쓰면 "막힌 것" 과 "틀린 것" 을 글쓴이가 가릴 수 없습니다.
--
-- 되돌아갔는지 보는 법
--   select pg_get_functiondef('edit_cq_guest'::regclass) ilike '%cqpw_try%'; -- t
--   select pg_get_functiondef('drop_cq_guest'::regclass) ilike '%cqpw_try%'; -- t
-- ════════════════════════════════════════════════════════════════════
begin;

-- ── ① 틀린 시도를 담는 표 ─────────────────────────────────────────
-- ⚠️⚠️ **아무에게도 GRANT 를 안 줍니다** — 넣는 것은 security definer
--   함수뿐이고, 읽을 까닭이 있는 사람이 없습니다(운영자도 아닙니다 —
--   누가 어느 글에 번호를 넣어 봤는지는 우리가 알 일이 아닙니다).
create table if not exists cqpw_try (
  id      bigserial primary key,
  ip_hash text,                       -- ⚠️ 주소를 모르면 null 입니다
  q_id    uuid not null references cq(id) on delete cascade,
  at      timestamptz not null default now()
);
create index if not exists cqpw_try_ip_idx on cqpw_try (ip_hash, at desc);
create index if not exists cqpw_try_q_idx  on cqpw_try (q_id, at desc);

alter table cqpw_try enable row level security;
revoke all on table cqpw_try from public, anon, authenticated;
revoke all on sequence cqpw_try_id_seq from public, anon, authenticated;


-- ── ② 막혔는지 보는 안쪽 함수 ────────────────────────────────────
-- ⚠️⚠️⚠️ **예외로 막지 않고 참 · 거짓을 돌려줍니다.** 예외를 쓰면 그
--   함수가 한 일(틀린 시도 한 줄)이 **통째로 되돌아갑니다** — 처음에
--   그렇게 썼다가 시도가 한 건도 안 쌓였고 검사가 "전 0" 으로
--   잡았습니다. 함수 하나는 한 트랜잭션이고, 예외는 그 트랜잭션을
--   되감습니다 (Postgres 함수 안에서는 따로 커밋할 수가 없습니다).
-- ⚠️⚠️ **함수는 표와 반대입니다** — 만드는 순간 `public` 에게 EXECUTE
--   가 붙습니다 (0050 의 `notify_one` 이 그 꼴이었습니다). 거둡니다.
create or replace function cq_pw_blocked(p_q uuid)
  returns boolean language plpgsql security definer
  set search_path = public as $$
declare
  v_ip text := cq_ip_hash();
  v_n  int;
begin
  -- ⚠️ 하루 지난 줄은 들를 때마다 치웁니다 (따로 도는 일거리를 안 만듭니다)
  delete from cqpw_try where at < now() - interval '1 day';

  -- ⓐ 같은 주소 — 10분에 다섯 번까지
  if v_ip is not null then
    select count(*) into v_n from cqpw_try
     where ip_hash = v_ip and at > now() - interval '10 minutes';
    if v_n >= 5 then return true; end if;
  end if;

  -- ⓑ 같은 글 — 한 시간에 서른 번까지
  --   ⚠️⚠️ **느슨하게 둡니다.** 빡빡하게 걸면 남이 일부러 틀려서
  --   글쓴이가 제 글을 못 고치게 만드는 자리가 됩니다.
  select count(*) into v_n from cqpw_try
   where q_id = p_q and at > now() - interval '1 hour';
  return v_n >= 30;
end $$;
revoke all on function cq_pw_blocked(uuid) from public;


-- ════════════════════════════════════════════════════════════════════
-- ③ edit_cq_guest (0063 → 0065) · drop_cq_guest (0063 → 0065)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **`raise exception` 은 그 함수가 한 일을 통째로 되돌립니다.**
--   처음에는 "틀리면 한 줄 적고 `raise` 로 거절" 로 썼는데, **적은 줄이
--   같이 되돌아가서** 시도가 한 건도 안 쌓였습니다 — 검사가 "전 0" 으로
--   잡았습니다. 함수 하나는 한 트랜잭션이고, 예외는 그 트랜잭션을
--   되감습니다(Postgres 함수 안에서는 따로 커밋할 수가 없습니다).
--   ⚠️ 그래서 **비밀번호 갈래만 예외를 안 씁니다** — 결과를 **글자로
--   돌려주고** 화면이 그 말을 고릅니다. 그러면 적은 줄이 남습니다.
--   ⚠️⚠️ 나머지 거절(없는 글 · 이미 내려간 글 · 제목 · 내용 길이)은
--   **그대로 예외**입니다 — 그쪽은 남길 것이 없습니다.
--
-- ⚠️⚠️ **돌려주는 것이 바뀌므로 `create or replace` 로는 안 됩니다** —
--   Postgres 가 `cannot change return type of existing function` 으로
--   거절합니다. 지우고 다시 만들고 **GRANT 를 바로 다시** 줍니다.
--
-- 돌려주는 말 셋 (화면이 이것으로 갈립니다)
--   'ok'      됐습니다
--   'bad_pw'  비밀번호가 맞지 않습니다 (한 줄 쌓입니다)
--   'blocked' 시도가 너무 많습니다 (안 쌓습니다 — 막는 동안 더 쌓으면
--             막힌 채로 영원히 풀리지 않습니다)
-- ════════════════════════════════════════════════════════════════════
drop function if exists edit_cq_guest(jsonb);
create function edit_cq_guest(p jsonb)
returns text language plpgsql
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
    return 'bad_pw';
  end if;
  if v_state <> 'live' then raise exception '이미 내려간 글입니다'; end if;

  -- ⚠️⚠️ 0065 — **맞춰 보기 전에** 반복 시도를 막습니다 (뒤에 두면
  --   막는 동안에도 bcrypt 를 다 돌립니다)
  if cq_pw_blocked(v_id) then return 'blocked'; end if;

  -- ⚠️⚠️⚠️ 맞춰 보는 것은 **여기뿐**입니다 (화면은 해시를 못 받습니다)
  if v_hash <> crypt(v_pw, v_hash) then
    -- ⚠️ **틀린 것만** 셉니다 (맞은 것을 세면 제 글을 여러 번 고치시는
    --   분이 먼저 막힙니다)
    insert into cqpw_try (ip_hash, q_id) values (cq_ip_hash(), v_id);
    return 'bad_pw';
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
  return 'ok';
end $$;
revoke all on function edit_cq_guest(jsonb) from public;
grant execute on function edit_cq_guest(jsonb) to anon, authenticated;

drop function if exists drop_cq_guest(jsonb);
create function drop_cq_guest(p jsonb)
returns text language plpgsql
security definer set search_path = public, extensions as $$
declare
  v_id   uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_pw   text := coalesce(p->>'pw', '');
  v_hash text;
  v_state text;
begin
  if v_id is null then raise exception '어느 글인지 알 수 없습니다'; end if;
  select guest_pw, state into v_hash, v_state from cq where id = v_id;
  if v_hash is null then return 'bad_pw'; end if;
  if v_state <> 'live' then raise exception '이미 내려간 글입니다'; end if;
  if cq_pw_blocked(v_id) then return 'blocked'; end if;
  if v_hash <> crypt(v_pw, v_hash) then
    insert into cqpw_try (ip_hash, q_id) values (cq_ip_hash(), v_id);
    return 'bad_pw';
  end if;
  update cq set state = 'dropped', updated_at = now() where id = v_id;
  return 'ok';
end $$;
revoke all on function drop_cq_guest(jsonb) from public;
grant execute on function drop_cq_guest(jsonb) to anon, authenticated;



-- ════════════════════════════════════════════════════════════════════
-- ④ ask_cq_guest (0063 → 0065) — 링크가 셋 이상인 글을 안 받습니다
-- ════════════════════════════════════════════════════════════════════
-- ⚠️ 달라지는 것은 **한 덩이**입니다 (아래 0065 표시) — 나머지는 0063
--   그대로입니다. 돌려주는 것(`uuid`)이 안 바뀌므로 `create or replace`
--   로 됩니다.
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

  -- ⚠️⚠️⚠️ **0065 — 광고 글의 가장 흔한 꼴은 "링크 여러 개"입니다.**
  --   지시서 C 의 "스팸 · 광고 링크 필터" 가 이것입니다.
  --   ⚠️⚠️ **링크를 통째로 막지 않습니다** — 스윙 영상 한 편을 걸고
  --   물으시는 분이 훨씬 많습니다. 막는 것은 **셋 이상**뿐입니다.
  --   ⚠️⚠️⚠️ **"스팸을 막습니다" 라고 적지 않습니다** — 링크 하나짜리
  --   광고는 이 줄이 못 막습니다. 못 막는 것을 막는다고 적지 않고,
  --   화면도 **"링크는 둘까지"** 라고만 적습니다 (절대 규칙 5).
  --   ⚠️ 회원 글에는 안 겁니다 — 회원은 계정으로 책임이 남습니다.
  if (select count(*) from regexp_matches(
        v_title || ' ' || v_body, '(https?://|www\.)', 'gi')) >= 3 then
    raise exception '링크는 둘까지 넣으실 수 있습니다';
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

insert into schema_version (n, name) values (65, '0065_guest_pw_tries')
  on conflict (n) do nothing;

commit;
