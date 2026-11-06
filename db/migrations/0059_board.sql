-- ════════════════════════════════════════════════════════════════════
-- 0059 — 자유게시판: 공개 닉네임 · 회원 조회 · 글 사진
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️ **글쓰기 · 댓글은 0047 에 이미 있습니다.** 표 둘(`cq` · `ca`),
--   문 여섯(`ask_cq` · `answer_cq` · `edit_cq` · `edit_ca` · `move_cq` ·
--   `move_ca`), 화면(`js/community.js` · `js/mycq.js`)이 서 있고 댓글 수도
--   이미 **세고** 있습니다(저장하지 않습니다 · 절대 규칙 1). 0059 가 더하는
--   것은 **지시서가 요구한 것 가운데 없던 셋**입니다 —
--     ① 공개 닉네임 (지금은 본이름을 가려서 `김**` 로 냅니다)
--     ② 조회 수 — **회원 조회**로만
--     ③ 글에 붙는 사진
--   그리고 공개 보기 둘에 **"내 글인가"**(`mine`)를 더합니다 — 상세 화면이
--   글쓴이에게만 고치기 · 내리기를 내려면 그것이 필요합니다.
--
-- ⚠️⚠️⚠️ **읽기는 누구나, 쓰기는 로그인한 사람만** — 0047 이 이미 그렇게
--   두었고 0059 도 그 선을 그대로 지킵니다. 공개 보기는 `anon` 에게도
--   GRANT 가 있고(가입 안 하신 분도 글과 댓글을 봅니다), 문은 전부
--   `authenticated` 에게만 있습니다.
--
-- ⚠️⚠️⚠️ **"조회 수" 가 아니라 "회원 조회" 입니다.** 비로그인 조회를 세려면
--   IP 나 세션을 받아야 하는데 이 서비스는 IP 를 **한 곳도 안 받습니다**
--   (받기 시작하면 그날부터 처리 항목이 늘어 방침을 같이 고쳐야 하고,
--   쏟아붓기를 막는 자리의 설명도 바뀝니다). 그래서 로그인 회원만
--   **1인 1회** 세고, 화면이 그 숫자를 **"회원 조회"** 라고 적습니다 —
--   그냥 "조회" 라고 적으면 실제보다 작은 수를 전체인 것처럼 내는 것이고
--   그건 지어낸 숫자입니다(절대 규칙 1 · 5).
--   ⚠️ 세는 것은 저장하지 않고 **줄에서 셉니다** — `cqview` 에 줄이 쌓이고
--   보기가 `count(*)` 합니다. 숫자 칸을 두면 누군가 거기 적어 넣습니다.
--   ⚠️ **제 글은 안 셉니다**(0050 의 "제가 한 일은 제게 안 알립니다" 와 같은
--   결입니다 — 글쓴이가 제 글을 열어 보는 것은 조회가 아닙니다).
--
-- ⚠️⚠️ **닉네임은 사칭을 막아야 합니다** — 겹치면 남의 이름으로 글을 쓸 수
--   있습니다. 그래서 ① 대소문자 · 앞뒤 공백을 무시한 **중복을 막고**
--   ② 운영자 · 관리자 같은 **지어내면 안 되는 이름**을 막고 ③ 부적절한
--   닉네임을 **운영자가 지우는 문**(`clear_nick`)을 같이 냅니다.
--   ⚠️⚠️ ③을 같이 내는 까닭: 0043(잇는 길만 내고 끊는 길을 안 냄) ·
--   0025(붙이는 문만 내고 떼는 문을 안 냄) · 0046(신고만 받고 내릴 길이
--   없음)을 **이미 세 번 겪었습니다.** 여는 길을 만드는 날 닫는 길도
--   같이 냅니다 — `check-doors` 는 **없는 문을 셀 수가 없습니다.**
--
-- ⚠️ **닉네임을 안 정하신 분은 지금처럼** 가린 성함으로 나옵니다(`김**`).
--   빈 자리를 지어 채우지 않고, 정하지 않은 것을 고장으로 만들지 않습니다.
--
-- ⚠️⚠️ **사진은 새 환경변수를 안 만듭니다.** 경로를
--   `cq/<글 id>/photo/<이름>` 으로 지으면 `api/upload.js` 의
--   `bucketForPath()` 가 `/photo/` 를 보고 **공개 버킷**을 고릅니다 —
--   게시판 사진은 공개 글에 그려지므로 공개가 맞습니다. 버킷이 꺼져 있으면
--   화면이 그 칸을 **아예 안 냅니다**(눌러도 아무 일이 안 나는 칸을 만들지
--   않습니다 · 절대 규칙 5).
--   ⚠️ 경로를 **문이 직접 짓습니다** — 화면이 보낸 이름을 쓰면 `../` 가
--   섞이고, 원래 파일 이름에는 성함이 들어 있기도 합니다(0051 의 그 자리).
--
-- 되돌아갔는지 보는 법
--   select count(*) from information_schema.columns
--    where table_name = 'v_cq_public' and column_name in ('nick','mine','view_n','photo_n');  -- 4
--   select count(*) from information_schema.columns
--    where table_name = 'v_ca_public' and column_name = 'mine';                               -- 1
--   ⚠️⚠️ **0047 파일만 따로 다시 붙여 넣으면 그 칸들이 조용히 사라집니다**
--   (그 파일이 옛 칸 목록으로 보기를 다시 만듭니다). 붙여넣기 파일을
--   통째로 쓰시면 0059 가 뒤에 와서 다시 만듭니다.
-- ════════════════════════════════════════════════════════════════════
begin;

-- ── ① 공개 닉네임 ──────────────────────────────────────────────────
alter table account add column if not exists nick text;

comment on column account.nick is
  '공개 닉네임. 비면 공개 보기가 성함을 가려서 냅니다. set_my_nick · clear_nick 으로만 바뀝니다.';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'account_nick_ck') then
    alter table account add constraint account_nick_ck check (
      nick is null or (
        nick = btrim(nick)
        and char_length(nick) between 2 and 16
        -- ⚠️ 줄바꿈 · 탭이 섞이면 목록이 무너집니다
        and nick !~ '[[:cntrl:]]'
      ));
  end if;
end $$;

-- ⚠️⚠️ **대소문자 · 앞뒤 공백을 무시해 중복을 막습니다** — `Hong` 과
--   `hong` 이 둘 다 되면 사칭이 됩니다.
create unique index if not exists account_nick_uniq
  on account (lower(btrim(nick))) where nick is not null;

-- ⚠️⚠️ 지어내면 안 되는 이름 — 운영자를 사칭하는 자리입니다.
--   ⚠️ 함수로 둡니다(문 둘이 같은 목록을 봐야 하고, 두 곳에 적으면 한쪽만
--   고치는 날 어긋납니다).
create or replace function nick_taken_word(p_nick text) returns boolean
  language sql immutable set search_path = public as $$
  select lower(btrim(coalesce(p_nick, ''))) = any (array[
    '운영자','관리자','골프올인원','고객센터','admin','administrator',
    'staff','system','root','official','master'
  ]);
$$;

revoke all on function nick_taken_word(text) from public;

-- 본인이 정합니다
create or replace function set_my_nick(p jsonb default '{}'::jsonb)
  returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_nick text := nullif(btrim(coalesce(p->>'nick','')), '');
begin
  if v_me is null then raise exception '로그인하셔야 닉네임을 정할 수 있습니다'; end if;
  -- ⚠️ 비우는 것도 값입니다 — 그러면 가린 성함으로 돌아갑니다.
  if v_nick is not null then
    if char_length(v_nick) < 2 then raise exception '닉네임을 두 글자 이상 적어 주세요'; end if;
    if char_length(v_nick) > 16 then raise exception '닉네임이 너무 깁니다 (16자)'; end if;
    if v_nick ~ '[[:cntrl:]]' then raise exception '닉네임에 줄바꿈을 넣을 수 없습니다'; end if;
    if nick_taken_word(v_nick) then
      raise exception '그 닉네임은 쓸 수 없습니다 — 운영자로 보일 수 있는 이름입니다';
    end if;
    -- ⚠️⚠️ **다른 말로 거절합니다** — unique 인덱스도 같은 것을 막지만,
    --   거기서 걸리면 손님에게 알아볼 수 없는 말이 나갑니다. 자물쇠마다
    --   다른 말로 거절해야 어느 쪽이 막았는지 알 수 있습니다.
    if exists (select 1 from account
                where lower(btrim(nick)) = lower(v_nick) and id <> v_me) then
      raise exception '이미 쓰고 있는 닉네임입니다';
    end if;
  end if;

  update account set nick = v_nick where id = v_me;
  if not found then raise exception '회원 정보를 찾을 수 없습니다'; end if;

  -- ⚠️ 기록에 **닉네임 글자를 담지 않습니다** — `audit_log` 는 오래 남고
  --   보는 사람도 넓습니다. 정했는지 비웠는지만 남깁니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state)
  values (v_me, my_role(), 'account', v_me::text,
          case when v_nick is null then 'nick-cleared' else 'nick-set' end);

  return coalesce(v_nick, '');
end $$;

revoke all on function set_my_nick(jsonb) from public;
grant execute on function set_my_nick(jsonb) to authenticated;

-- 운영자가 지웁니다 — ⚠️ 부적절한 닉네임을 내릴 길입니다
create or replace function clear_nick(p jsonb default '{}'::jsonb)
  returns int
  language plpgsql security definer set search_path = public as $$
declare
  v_me  uuid     := auth.uid();
  v_rl  app_role := my_role();
  v_who uuid     := nullif(btrim(coalesce(p->>'user','')), '')::uuid;
  v_why text     := nullif(btrim(coalesce(p->>'why','')), '');
  v_n   int;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if v_rl not in ('staff','admin') then
    raise exception '닉네임을 지우는 것은 운영자가 합니다';
  end if;
  if v_who is null then raise exception '누구의 닉네임인지 알 수 없습니다'; end if;
  -- ⚠️⚠️ **까닭이 반드시** — 남의 이름을 지우는 일입니다. 까닭 없이 지울 수
  --   있으면 누가 왜 지웠는지 아무 데도 안 남습니다(§8).
  if v_why is null then raise exception '지우시는 까닭을 적어 주세요'; end if;

  update account set nick = null where id = v_who and nick is not null;
  get diagnostics v_n = row_count;
  -- ⚠️⚠️ **0줄이면 거절합니다.** 조용히 끝내면 기록에 "지웠다" 가 남는데
  --   실제로는 아무 일도 안 일어난 것입니다 — 기록이 거짓이 됩니다
  --   (0054 에서 적어 둔 그 자리).
  if v_n = 0 then raise exception '지울 닉네임이 없습니다'; end if;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why)
  values (v_me, v_rl, 'account', v_who::text, 'nick-cleared-by-admin', v_why);

  return v_n;
end $$;

revoke all on function clear_nick(jsonb) from public;
grant execute on function clear_nick(jsonb) to authenticated;

-- ── ② 회원 조회 ────────────────────────────────────────────────────
-- ⚠️ 한 글에 한 회원 한 줄 — 몇 번 열어도 하나입니다(primary key).
create table if not exists cqview (
  q_id    uuid not null references cq(id) on delete cascade,
  by_user uuid not null references auth.users(id) on delete cascade,
  at      timestamptz not null default now(),
  primary key (q_id, by_user)
);

alter table cqview enable row level security;

-- ⚠️⚠️ **정책도 GRANT 도 주지 않습니다.** 누가 무엇을 봤는지는 아무도
--   읽을 까닭이 없습니다 — 세는 것은 공개 보기가 합니다(임자 권한으로
--   돌므로 이 표를 읽을 수 있습니다). 운영자 정책도 안 둡니다.

create or replace function view_cq(p jsonb default '{}'::jsonb)
  returns int
  language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_q  uuid := nullif(btrim(coalesce(p->>'question','')), '')::uuid;
  v_by uuid;
  v_n  int;
begin
  -- ⚠️⚠️ **주체가 없는 토큰은 조용히 0** 입니다 (role 은 authenticated 인데
  --   auth.uid() 가 null 인 경우). 거절하면 화면이 에러를 내는데, 글은
  --   보이는 것이 맞으므로(읽기는 누구나) 셀 수 없다고만 끝냅니다.
  --   ⚠️ **anon 은 이 자리까지 못 옵니다** — 아래 GRANT 가 authenticated
  --   에게만 있어 `permission denied for function` 입니다. 그것이 맞습니다
  --   (쓰는 문을 anon 에게 열 까닭이 없고 화면도 로그인했을 때만 부릅니다).
  --   자물쇠가 둘이라 `sql/board.js` 가 **갈라서** 눌러 봅니다.
  if v_me is null then return 0; end if;
  if v_q is null then raise exception '어느 글인지 알 수 없습니다'; end if;

  select by_user into v_by from cq where id = v_q and state = 'live';
  -- ⚠️ 없는 글 · 내려간 글도 조용히 0 — 있는지 없는지를 알려 주면 id 를
  --   넣어 가며 확인할 수 있습니다.
  if v_by is null then return 0; end if;
  -- ⚠️⚠️ **제 글은 안 셉니다.**
  if v_by = v_me then return 0; end if;

  insert into cqview (q_id, by_user) values (v_q, v_me)
  on conflict (q_id, by_user) do nothing;
  -- ⚠️ **넣은 줄 수를 그대로 돌려줍니다** — 두 번째로 여실 때는 0 입니다.
  --   그 자리에서 1 을 돌려주면 "셌다" 고 말하는데 실제로는 아무 일도
  --   안 일어난 것이고, 하지 않은 일을 했다고 말하는 것입니다(절대 규칙 5).
  get diagnostics v_n = row_count;
  return v_n;
end $$;

revoke all on function view_cq(jsonb) from public;
grant execute on function view_cq(jsonb) to authenticated;

-- ── ③ 글 사진 ──────────────────────────────────────────────────────
create table if not exists cqphoto (
  id         uuid primary key default gen_random_uuid(),
  q_id       uuid not null references cq(id) on delete cascade,
  by_user    uuid not null references auth.users(id) on delete cascade,
  path       text not null unique,
  mime       text not null,
  bytes      int  not null,
  caption    text,
  created_at timestamptz not null default now(),
  constraint cqphoto_mime_ok check (mime in ('image/jpeg','image/png','image/webp')),
  constraint cqphoto_bytes_ok check (bytes > 0 and bytes <= 8388608),
  constraint cqphoto_caption_ok check (caption is null or char_length(caption) <= 60),
  -- ⚠️⚠️ **경로 꼴을 표가 다시 봅니다** — 문이 지은 것만 들어갑니다
  --   (남의 글 칸에 못 씁니다). `/photo/` 가 글자로 들어가고 서버가
  --   그것으로 버킷을 고릅니다.
  constraint cqphoto_path_ok check (
    path <> '' and length(path) <= 300
    and path = 'cq/' || q_id::text || '/photo/' || split_part(path, '/', 4))
);

create index if not exists cqphoto_q_idx on cqphoto (q_id, created_at);

alter table cqphoto enable row level security;

-- ⚠️ 제 글의 사진 줄은 제가 봅니다(고치는 화면이 읽습니다) · 운영자도 봅니다.
--   공개로 가는 길은 아래 **보기** 하나입니다.
drop policy if exists cqphoto_mine on cqphoto;
create policy cqphoto_mine on cqphoto
  for select using (by_user = auth.uid() or my_role() in ('staff','admin'));

grant select on cqphoto to authenticated;

create or replace function claim_cq_photo(p jsonb default '{}'::jsonb)
  returns jsonb
  language plpgsql security definer set search_path = public as $$
declare
  v_me    uuid := auth.uid();
  v_q     uuid := nullif(btrim(coalesce(p->>'question','')), '')::uuid;
  v_mime  text := lower(btrim(coalesce(p->>'mime','')));
  v_bytes int  := coalesce((nullif(btrim(coalesce(p->>'bytes','')), ''))::int, 0);
  v_cap   text := nullif(btrim(coalesce(p->>'caption','')), '');
  v_ext   text;
  v_path  text;
  v_id    uuid;
begin
  if v_me is null then raise exception '로그인하셔야 사진을 올릴 수 있습니다'; end if;
  if v_q is null then raise exception '어느 글인지 알 수 없습니다'; end if;
  -- ⚠️⚠️ **제 글에만** 붙입니다. 운영자도 남의 글에 사진을 못 붙입니다 —
  --   붙일 까닭이 없고, 붙으면 글쓴이가 안 올린 것이 그 글에 달립니다.
  if not exists (select 1 from cq where id = v_q and by_user = v_me and state = 'live') then
    raise exception '그 글에는 사진을 붙일 수 없습니다';
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
  if (select count(*) from cqphoto where q_id = v_q) >= 5 then
    raise exception '사진은 다섯 장까지입니다. 먼저 빼 주세요';
  end if;

  v_ext := case v_mime when 'image/jpeg' then 'jpg'
                       when 'image/png'  then 'png'
                       else 'webp' end;
  v_path := 'cq/' || v_q::text || '/photo/' || gen_random_uuid()::text || '.' || v_ext;

  insert into cqphoto (q_id, by_user, path, mime, bytes, caption)
  values (v_q, v_me, v_path, v_mime, v_bytes, v_cap)
  returning id into v_id;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'cqphoto', v_id::text, 'claimed',
          jsonb_build_object('mime', v_mime, 'bytes', v_bytes));

  return jsonb_build_object('id', v_id, 'path', v_path);
end $$;

revoke all on function claim_cq_photo(jsonb) from public;
grant execute on function claim_cq_photo(jsonb) to authenticated;

create or replace function drop_cq_photo(p jsonb default '{}'::jsonb)
  returns int
  language plpgsql security definer set search_path = public as $$
declare
  v_me uuid     := auth.uid();
  v_rl app_role := my_role();
  v_id uuid     := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_n  int;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 사진인지 알 수 없습니다'; end if;
  -- ⚠️ 올린 사람과 운영자가 뺍니다 (운영자는 부적절한 사진을 내려야 합니다).
  delete from cqphoto where id = v_id
     and (by_user = v_me or v_rl in ('staff','admin'));
  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception '그 사진을 찾을 수 없습니다'; end if;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state)
  values (v_me, v_rl, 'cqphoto', v_id::text, 'dropped');
  return v_n;
end $$;

revoke all on function drop_cq_photo(jsonb) from public;
grant execute on function drop_cq_photo(jsonb) to authenticated;

-- ⚠️⚠️ **공개로 가는 길은 이 보기 하나입니다** — 보기는 RLS 를 지나지
--   않으므로 이 `where` 절이 자물쇠 그 자체입니다(0051 에서 서류가
--   새지 않게 한 그 자리). 내려간 글의 사진은 안 냅니다.
drop view if exists v_cq_photo_public;
create view v_cq_photo_public as
  select f.id, f.q_id, f.path, f.caption, f.created_at
    from cqphoto f
    join cq q on q.id = f.q_id
   where q.state = 'live';

grant select on v_cq_photo_public to anon, authenticated;

-- ── ④ 공개 보기 둘을 다시 만듭니다 ─────────────────────────────────
-- ⚠️⚠️ **칸이 늘어나므로 `create or replace` 가 안 됩니다** — 지우고 다시
--   만들고 **GRANT 를 바로 다시** 줍니다(지우면 권한도 날아갑니다).
-- 체인: v_cq_public 보기 (0047 → **0059**)
drop view if exists v_cq_public;
create view v_cq_public as
  select q.id, q.cat, q.title, q.body, q.created_at, q.updated_at,
         -- ⚠️ 닉네임이 있으면 그것, 없으면 지금처럼 가린 성함
         case
           when btrim(coalesce(a.nick, '')) <> '' then btrim(a.nick)
           when btrim(coalesce(a.name, '')) = '' then '회원'
           else left(btrim(a.name), 1) ||
                repeat('*', greatest(char_length(btrim(a.name)) - 1, 1))
         end as who,
         -- ⚠️ 닉네임을 정하신 분인지 — 화면이 가린 성함과 구별해 적습니다
         (btrim(coalesce(a.nick, '')) <> '') as named,
         -- ⚠️⚠️ **`by_user` 는 담지 않습니다**(0047 이 일부러 뺀 칸입니다).
         --   대신 "내 글인가" 만 냅니다 — 상세 화면이 글쓴이에게만 고치기 ·
         --   내리기를 내는 데 그것으로 충분합니다.
         --   ⚠️ `coalesce(…, false)` 로 땅에 내려놓습니다 — anon 은
         --   `auth.uid()` 가 null 이라 비교가 **NULL** 이 되고, NULL 은
         --   화면에서 "참" 으로도 "거짓" 으로도 안 읽힙니다(0034 에서
         --   자물쇠가 통째로 열린 그 자리).
         coalesce(q.by_user = auth.uid(), false) as mine,
         -- ⚠️ 댓글 수 · 회원 조회 · 사진 수는 **저장하지 않고 셉니다**
         (select count(*) from ca where ca.q_id = q.id and ca.state = 'live') as answer_n,
         (select count(*) from cqview v where v.q_id = q.id) as view_n,
         (select count(*) from cqphoto f where f.q_id = q.id) as photo_n
    from cq q
    left join account a on a.id = q.by_user
   where q.state = 'live';

grant select on v_cq_public to anon, authenticated;

-- 체인: v_ca_public 보기 (0047 → **0059**)
drop view if exists v_ca_public;
create view v_ca_public as
  select c.id, c.q_id, c.body, c.created_at, c.updated_at,
         case
           when btrim(coalesce(a.nick, '')) <> '' then btrim(a.nick)
           when btrim(coalesce(a.name, '')) = '' then '회원'
           else left(btrim(a.name), 1) ||
                repeat('*', greatest(char_length(btrim(a.name)) - 1, 1))
         end as who,
         (btrim(coalesce(a.nick, '')) <> '') as named,
         -- ⚠️ 질문한 사람이 단 댓글인지 — 화면이 "글쓴이" 라고 적습니다
         (c.by_user = q.by_user) as by_asker,
         -- ⚠️ 내 댓글인가 — 상세 화면이 본인에게만 고치기 · 내리기를 냅니다
         coalesce(c.by_user = auth.uid(), false) as mine
    from ca c
    join cq q on q.id = c.q_id
    left join account a on a.id = c.by_user
   where c.state = 'live'
     and q.state = 'live';

grant select on v_ca_public to anon, authenticated;

insert into schema_version (n, name) values (59, '0059_board')
  on conflict (n) do nothing;

commit;
