/* ==================================================================
   0046 ~ 0059 를 한 번에 —
   Supabase SQL 편집기에 **이 파일을 통째로** 붙여 넣고 Run 하세요.
   ==================================================================
   WARN 빌드가 만드는 파일입니다 — 손으로 고치지 마세요.
   db/migrations 의 14개를 번호 차례로 이어 붙인 것이고
   한 글자도 바꾸지 않았습니다. (node tools/make-apply.js)

   조각 파일입니다 — 바로 앞 조각까지 끝낸 DB 에만 쓰세요.
   어디까지 됐는지는 db/resume.sql 이 말해 줍니다
   (select max(n) from schema_version).

   돌린 뒤에는 db/verify.sql 을 붙여 넣어 보세요. 중간에서 멈추면 그
   파일 하나만 따로 돌리고 그 다음부터 이어 가시면 됩니다 — 번호를
   다시 쓰지 않습니다.

   WARN 통째로 begin/commit 으로 감싸지 마세요 — 파일마다 제
   트랜잭션이 있고 0015 는 일부러 감싸지 않았습니다. */

/* ---------------------------- 0046_join.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0046 — 골프 조인 (함께 라운딩할 사람 찾기)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **왜 지금 만드는가** — `/cat/matchup` 이 막다른 길이었습니다.
--   메인에서 "골프 조인" 을 누르면 "아직 열린 조인이 없습니다" 만 보고
--   끝이었습니다. 단추도 없고 다른 데로 가는 길도 없었습니다.
--   절대 규칙 2 가 "**막다른 길로 두지 않습니다** — 0 인 자리에는 지금
--   실제로 되는 것을 같이 냅니다" 인데, 열 분류 가운데 **셋**이 그
--   규칙을 어기고 있었습니다 (조인 · 인력 · 커뮤니티).
--
-- ⚠️⚠️⚠️ **여기서 가장 조심할 것은 연락처입니다** (개인정보보호법
--   제17조). 조인은 **회원끼리** 만나는 자리라, 연락처가 오가야 실제로
--   만날 수 있습니다. 그런데 —
--     · 목록에 연락처를 같이 내면 **아무나 긁어 갑니다**
--     · "신청하면 바로 보이게" 로 두면 신청만 하고 **긁어 갑니다**
--   그래서 **수락된 짝에게만** 서로 보입니다. 누구에게 줄지 정해진 뒤에
--   주는 것 — 제17조 제2항이 요구하는 그대로입니다.
--
-- ⚠️⚠️ **연락처는 표에서 읽을 수 없습니다.** 칸 단위 GRANT 로 빼 두고
--   (아래 ④), 오가는 길은 보기 `v_join_contact` **하나**입니다. 그
--   보기의 where 절이 자물쇠 그 자체입니다 (보기는 RLS 를 지나지
--   않습니다 — 임자 권한으로 돕니다).
--   ⚠️ 정책만 보고 "막혔다" 고 결론 내지 마세요. `tools/sql/join.js`
--   가 **그 역할로 실제로 질의해** 봅니다.
--
-- ⚠️ **지우지 않습니다.** 조인을 지우면 "그런 약속 한 적 없다" 가
--   됩니다. 끝난 것은 state 로 표시합니다 (`closed` · `done`).
--
-- 되돌아갔는지 보는 법
--   select 1 from pg_proc where proname = 'open_joinroom';   -- 있어야 합니다
--   select count(*) from information_schema.columns
--    where table_name = 'joinroom';                          -- 12 여야 합니다
-- ════════════════════════════════════════════════════════════════════
begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 조인 한 자리
-- ════════════════════════════════════════════════════════════════════
create table if not exists joinroom (
  id         uuid primary key default gen_random_uuid(),
  by_user    uuid not null references auth.users(id) on delete cascade,
  -- ⚠️ 지역 키는 js/data/regions.js 의 AM_REGIONS 와 **같은 글자**입니다.
  --   여기 목록을 박지 않습니다 — 박으면 지역이 느는 날 두 곳이
  --   어긋나고, 그때 화면은 보내는데 DB 가 거절합니다.
  region     text not null check (btrim(region) <> ''),
  play_at    date not null,
  -- ⚠️ 제목 · 설명은 **필수**입니다 (지시서 §2.A). 없으면 목록이
  --   "서울 11월 12일" 만 스무 줄이라 고를 수가 없습니다.
  title      text not null check (char_length(btrim(title)) between 2 and 60),
  body       text not null check (char_length(btrim(body)) between 5 and 1000),
  -- 골프장 — 선택입니다. ⚠️⚠️ 적혀 있어도 **부킹이 잡혔다는 뜻이
  --   아닙니다** (지시서 §2.A — 부킹 보장 금지). 화면이 그 사실을
  --   같이 적고, booked 가 그것을 가릅니다.
  course     text check (course is null or char_length(btrim(course)) <= 60),
  booked     boolean not null default false,
  tee        text,                       -- 희망 티타임 (아침 · 오전 …)
  -- 더 필요한 사람 수 — ⚠️ 4인 한 팀이라 셋을 넘을 수 없습니다
  need       int  not null check (need between 1 and 3),
  budget     int  check (budget is null or budget between 0 and 10000000),
  note       text check (note is null or length(note) <= 500),
  -- open   받는 중
  -- closed 연 사람이 닫음 (사람이 다 찼거나 그만둠)
  -- done   날짜가 지났습니다
  state      text not null default 'open'
             check (state in ('open','closed','done')),
  -- ⚠️⚠️ **연락처는 여기 있지만 아무도 표에서 못 읽습니다** (④의 GRANT).
  --   오가는 길은 v_join_contact 하나입니다.
  contact    text not null check (btrim(contact) <> ''),
  -- ⚠️ 동의 **시각**을 받습니다. boolean 으로 두면 "언제 받았나" 를
  --   못 댑니다 (제15조 제2항을 따질 때 그것이 전부입니다).
  agree_at   timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists joinroom_open_idx
  on joinroom (state, play_at) where state = 'open';
create index if not exists joinroom_mine_idx on joinroom (by_user, created_at desc);

-- ════════════════════════════════════════════════════════════════════
-- ② 신청 한 건
-- ════════════════════════════════════════════════════════════════════
create table if not exists joinapply (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references joinroom(id) on delete cascade,
  by_user    uuid not null references auth.users(id) on delete cascade,
  msg        text check (msg is null or length(msg) <= 300),
  contact    text not null check (btrim(contact) <> ''),
  -- applied  보냈습니다
  -- accepted 연 사람이 받았습니다  ← 이때부터 연락처가 서로 보입니다
  -- rejected 연 사람이 거절했습니다
  -- canceled 신청한 사람이 거뒀습니다
  state      text not null default 'applied'
             check (state in ('applied','accepted','rejected','canceled')),
  agree_at   timestamptz not null,
  -- ⚠️⚠️⚠️ **수락만으로 연락처가 오가지 않습니다** (지시서 §2.A).
  --   처음에는 "수락하면 서로 보이게" 로 지었는데, 그것은 제17조가
  --   말하는 "**별도** 동의" 가 아닙니다 — 수락은 "같이 치자" 이지
  --   "내 번호를 줘도 좋다" 가 아닙니다. 둘은 다른 결정입니다.
  --   그래서 **각자 제 연락처에 대해 따로** 누릅니다:
  --     host_share_at   연 사람이 **제** 번호를 이 신청자에게 보여 줌
  --     guest_share_at  신청자가 **제** 번호를 연 사람에게 보여 줌
  --   ⚠️ 한쪽만 눌러도 그쪽 것만 갑니다 (맞바꾸기를 강요하지 않습니다).
  host_share_at  timestamptz,
  guest_share_at timestamptz,
  created_at timestamptz not null default now(),
  -- ⚠️ 한 자리에 한 번만 — 안 막으면 한 사람이 같은 방에 백 번 넣습니다
  unique (room_id, by_user)
);
create index if not exists joinapply_room_idx on joinapply (room_id, created_at desc);
create index if not exists joinapply_mine_idx on joinapply (by_user, created_at desc);

-- ════════════════════════════════════════════════════════════════════
-- ③ 공개 목록 — ⚠️ **보기의 where 절이 자물쇠 그 자체입니다**
--   보기는 RLS 를 지나지 않습니다 (임자 권한으로 돕니다). 그래서
--   여기 담지 않은 칸은 **어떤 정책으로도 새어 나가지 않습니다.**
--   ⚠️⚠️ `contact` 와 `by_user` 를 **담지 않습니다** — 글은 공개지만
--   누가 열었는지와 연락처는 공개가 아닙니다 (후기 보기와 같은 꼴).
-- ════════════════════════════════════════════════════════════════════
drop view if exists v_join_open;
create view v_join_open as
  select r.id, r.region, r.play_at, r.title, r.body, r.course, r.booked,
         r.tee, r.need, r.budget, r.note, r.created_at,
         -- ⚠️ 칸에 저장하지 않고 **셉니다** (절대 규칙 1 — 숫자로
         --   들고 있으면 누가 그 칸에 고쳐 적습니다)
         (select count(*) from joinapply a
           where a.room_id = r.id and a.state = 'accepted') as taken_n,
         r.need - (select count(*) from joinapply a
                    where a.room_id = r.id and a.state = 'accepted') as left_n,
         (select count(*) from joinapply a
           where a.room_id = r.id and a.state = 'applied') as waiting_n
    from joinroom r
   where r.state = 'open'
     and r.play_at >= current_date;
grant select on v_join_open to anon, authenticated;

-- ⚠️⚠️⚠️ **연락처가 오가는 단 하나의 길입니다.**
--   ① 수락된 신청이어야 하고 ② 보는 사람이 그 둘 중 하나여야 합니다.
--   둘 다 where 절에 있으므로 정책을 어떻게 쓰든 이 조건을 못 피합니다.
drop view if exists v_join_contact;
create view v_join_contact as
  select a.id as apply_id, a.room_id,
         r.by_user as room_owner, a.by_user as applicant,
         a.host_share_at, a.guest_share_at,
         -- ⚠️⚠️⚠️ **각자 제 것만 엽니다.** 연 사람 번호는 연 사람이
         --   눌렀을 때만, 신청자 번호는 신청자가 눌렀을 때만 나옵니다.
         --   수락만으로는 **둘 다 null** 입니다 — 수락은 "같이 치자"
         --   이지 "내 번호를 줘도 좋다" 가 아닙니다 (제17조 제2항).
         case when a.host_share_at  is not null then r.contact end as room_contact,
         case when a.guest_share_at is not null then a.contact end as apply_contact
    from joinapply a
    join joinroom  r on r.id = a.room_id
   where a.state = 'accepted'
     and (auth.uid() = r.by_user or auth.uid() = a.by_user);
grant select on v_join_contact to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ④ 자물쇠 — RLS 로 **줄**을, GRANT 로 **칸**을 막습니다
--   ⚠️⚠️ 둘을 따로 둡니다. 하나만 보고 "막혔다" 고 읽으면 다른 하나가
--   장식인지 알 수 없습니다 (작업 기억 — GRANT 와 RLS 를 따로 눌러
--   보세요).
-- ════════════════════════════════════════════════════════════════════
alter table joinroom  enable row level security;
alter table joinapply enable row level security;

-- 내가 연 자리
drop policy if exists joinroom_mine on joinroom;
create policy joinroom_mine on joinroom for select
  using (by_user = auth.uid());
-- 운영자
drop policy if exists joinroom_staff on joinroom;
create policy joinroom_staff on joinroom for select
  using (my_role() in ('staff','admin'));

-- 내가 넣은 신청
drop policy if exists joinapply_mine on joinapply;
create policy joinapply_mine on joinapply for select
  using (by_user = auth.uid());
-- 내 자리에 들어온 신청 — ⚠️ 연락처 칸은 아래 GRANT 가 막습니다
drop policy if exists joinapply_owner on joinapply;
create policy joinapply_owner on joinapply for select
  using (exists (select 1 from joinroom r
                  where r.id = joinapply.room_id and r.by_user = auth.uid()));
drop policy if exists joinapply_staff on joinapply;
create policy joinapply_staff on joinapply for select
  using (my_role() in ('staff','admin'));

-- ⚠️⚠️⚠️ **칸 단위 GRANT — `contact` 와 `agree_at` 을 빼고 줍니다.**
--   정책이 줄을 보여 줘도 이 칸들은 **읽히지 않습니다.** 연락처가
--   나가는 길은 v_join_contact 하나뿐이라는 뜻입니다.
--   ⚠️ 쓰기(insert · update · delete)는 **한 줄도 주지 않습니다** —
--   들어오는 길은 아래 문 넷뿐입니다.
grant select (id, by_user, region, play_at, title, body, course, booked,
              tee, need, budget, note, state, created_at, updated_at)
                                   on joinroom  to authenticated;
grant select (id, room_id, by_user, msg, state, created_at,
              host_share_at, guest_share_at)
                                   on joinapply to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑤ 문 — 자리를 엽니다
-- ════════════════════════════════════════════════════════════════════
create or replace function open_joinroom(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_region  text := nullif(btrim(coalesce(p->>'region','')), '');
  v_tee     text := nullif(btrim(coalesce(p->>'tee','')), '');
  v_note    text := nullif(btrim(coalesce(p->>'note','')), '');
  v_contact text := nullif(btrim(coalesce(p->>'contact','')), '');
  v_title   text := nullif(btrim(coalesce(p->>'title','')), '');
  v_body    text := nullif(btrim(coalesce(p->>'body','')), '');
  v_course  text := nullif(btrim(coalesce(p->>'course','')), '');
  v_play    date;
  v_need    int;
  v_budget  int;
  v_id      uuid;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  if v_region is null then
    raise exception '지역을 골라 주세요';
  end if;
  -- ⚠️ 제목 · 설명은 필수입니다 (지시서 §2.A)
  if v_title is null or char_length(v_title) < 2 then
    raise exception '제목을 두 글자 이상 적어 주세요';
  end if;
  if char_length(v_title) > 60 then
    raise exception '제목이 너무 깁니다 (60자)';
  end if;
  if v_body is null or char_length(v_body) < 5 then
    raise exception '설명을 다섯 글자 이상 적어 주세요';
  end if;
  if char_length(v_body) > 1000 then
    raise exception '설명이 너무 깁니다 (1000자)';
  end if;
  if v_course is not null and char_length(v_course) > 60 then
    raise exception '골프장 이름이 너무 깁니다';
  end if;
  if v_contact is null then
    raise exception '연락처를 적어 주세요';
  end if;
  if length(v_contact) > 100 then
    raise exception '연락처가 너무 깁니다';
  end if;

  -- ⚠️ 동의 시각 — 미래이거나 하루 넘게 지난 것은 받지 않습니다
  --   (화면을 열어 두고 하루 뒤에 보내는 것을 막습니다)
  if p->>'agree_at' is null then
    raise exception '개인정보 수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes'
     or (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의 시각이 올바르지 않습니다';
  end if;

  begin
    v_play := (p->>'play_at')::date;
  exception when others then
    raise exception '라운딩 날짜를 골라 주세요';
  end;
  if v_play is null then
    raise exception '라운딩 날짜를 골라 주세요';
  end if;
  -- ⚠️ 지난 날짜로 열 수 없습니다. 오늘은 됩니다 (오늘 저녁 조인).
  if v_play < current_date then
    raise exception '지난 날짜로는 열 수 없습니다';
  end if;
  if v_play > current_date + interval '180 days' then
    raise exception '너무 먼 날짜입니다 (6개월 안으로 잡아 주세요)';
  end if;

  v_need := coalesce((p->>'need')::int, 1);
  if v_need < 1 or v_need > 3 then
    raise exception '더 필요한 인원은 1~3명입니다';
  end if;
  v_budget := nullif(btrim(coalesce(p->>'budget','')), '')::int;
  if v_budget is not null and (v_budget < 0 or v_budget > 10000000) then
    raise exception '예산이 올바르지 않습니다';
  end if;
  if v_note is not null and length(v_note) > 500 then
    raise exception '남기실 말이 너무 깁니다 (500자)';
  end if;

  -- ⚠️⚠️ **쏟아붓기 막기.** 한 사람이 자리를 백 개 열면 목록이 통째로
  --   쓸모없어집니다. 열려 있는 자리는 **한 번에 다섯**까지.
  --   ⚠️ 닫은 자리는 안 셉니다 (닫고 다시 여는 것은 정상입니다).
  if (select count(*) from joinroom
       where by_user = v_uid and state = 'open'
         and play_at >= current_date) >= 5 then
    raise exception '열어 두신 자리가 다섯입니다. 먼저 정리해 주세요';
  end if;
  -- 하루에 여는 수도 막습니다 (닫고 다시 열기를 되풀이하는 것)
  if (select count(*) from joinroom
       where by_user = v_uid and created_at > now() - interval '1 day') >= 10 then
    raise exception '오늘은 더 열 수 없습니다 (하루 열 개)';
  end if;

  insert into joinroom (by_user, region, play_at, title, body, course,
                        tee, need, budget, note, contact, agree_at)
  values (v_uid, v_region, v_play, v_title, v_body, v_course,
          v_tee, v_need, v_budget, v_note,
          v_contact, (p->>'agree_at')::timestamptz)
  returning id into v_id;
  return v_id;
end $$;
grant execute on function open_joinroom(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑥ 문 — 신청합니다
-- ════════════════════════════════════════════════════════════════════
create or replace function apply_joinroom(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_room    uuid := (p->>'room_id')::uuid;
  v_msg     text := nullif(btrim(coalesce(p->>'msg','')), '');
  v_contact text := nullif(btrim(coalesce(p->>'contact','')), '');
  v_owner   uuid;
  v_state   text;
  v_play    date;
  v_need    int;
  v_id      uuid;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  if v_contact is null then
    raise exception '연락처를 적어 주세요';
  end if;
  if length(v_contact) > 100 then
    raise exception '연락처가 너무 깁니다';
  end if;
  if v_msg is not null and length(v_msg) > 300 then
    raise exception '남기실 말이 너무 깁니다 (300자)';
  end if;
  if p->>'agree_at' is null then
    raise exception '개인정보 수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes'
     or (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의 시각이 올바르지 않습니다';
  end if;

  select by_user, state, play_at, need into v_owner, v_state, v_play, v_need
    from joinroom where id = v_room;
  if v_owner is null then
    raise exception '그런 자리가 없습니다';
  end if;
  -- ⚠️⚠️ **제 자리에 못 신청합니다.** 안 막으면 신청 수를 스스로
  --   부풀려 목록 위로 올립니다.
  if v_owner = v_uid then
    raise exception '직접 여신 자리에는 신청할 수 없습니다';
  end if;
  if v_state <> 'open' then
    raise exception '지금은 신청을 받지 않는 자리입니다';
  end if;
  if v_play < current_date then
    raise exception '이미 지난 자리입니다';
  end if;

  -- ⚠️ 받을 만큼 찼으면 더 안 받습니다 (수락된 것만 셉니다)
  if (select count(*) from joinapply
       where room_id = v_room and state = 'accepted') >= v_need then
    raise exception '이미 인원이 찼습니다';
  end if;

  -- ⚠️⚠️ 쏟아붓기 — 하루 스무 건. 자리마다 한 번은 unique 가 막습니다.
  if (select count(*) from joinapply
       where by_user = v_uid and created_at > now() - interval '1 day') >= 20 then
    raise exception '오늘은 더 신청할 수 없습니다 (하루 스무 건)';
  end if;

  -- ⚠️ 거절당한 뒤 **다시 넣는 것**은 막습니다 (unique 가 있으므로
  --   insert 가 실패합니다 — 말을 알아듣게 바꿔 줍니다).
  if exists (select 1 from joinapply where room_id = v_room and by_user = v_uid) then
    raise exception '이미 신청하셨습니다';
  end if;

  insert into joinapply (room_id, by_user, msg, contact, agree_at)
  values (v_room, v_uid, v_msg, v_contact, (p->>'agree_at')::timestamptz)
  returning id into v_id;
  return v_id;
end $$;
grant execute on function apply_joinroom(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑦ 문 — 신청을 옮깁니다 (수락 · 거절 · 거두기)
--   ⚠️⚠️ **여기서 연락처가 서로 보이게 됩니다** (accepted). 그래서
--   누가 무엇을 할 수 있는지를 한 줄씩 못박습니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function move_joinapply(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_id    uuid := (p->>'id')::uuid;
  v_to    text := nullif(btrim(coalesce(p->>'state','')), '');
  v_owner uuid;
  v_by    uuid;
  v_cur   text;
  v_room  uuid;
  v_need  int;
  v_play  date;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  /* ⚠️⚠️⚠️ **동시에 둘을 수락하면 정원이 넘습니다** (지시서 §2.A —
     "동시 신청의 정원 초과를 트랜잭션으로 방지"). 세어 보고 넣는
     사이에 다른 수락이 끼어들면 둘 다 "아직 자리 있음" 으로 읽습니다.
     그래서 **방 줄을 먼저 잠급니다** — 같은 방을 건드리는 수락은
     한 번에 하나씩 지나갑니다. */
  select r.id into v_room from joinroom r
    join joinapply a on a.room_id = r.id
   where a.id = v_id for update of r;

  select a.by_user, a.state, a.room_id, r.by_user, r.need, r.play_at
    into v_by, v_cur, v_room, v_owner, v_need, v_play
    from joinapply a join joinroom r on r.id = a.room_id
   where a.id = v_id;
  if v_cur is null then
    raise exception '그런 신청이 없습니다';
  end if;

  -- ⚠️⚠️⚠️ **SQL 에는 참 · 거짓 말고 NULL 이 있습니다.** 로그인은
  --   위에서 막았지만, 비교가 NULL 을 낼 수 있는 자리는 전부
  --   coalesce 로 땅에 내려놓습니다 (0034 에서 자물쇠가 통째로 열린
  --   자리입니다 — `not (NULL or false)` 는 NULL 이고 `if NULL then`
  --   은 안 걸립니다).
  if not coalesce(v_owner = v_uid, false)
     and not coalesce(v_by = v_uid, false) then
    raise exception '이 신청을 옮길 수 없습니다';
  end if;

  if v_to = 'canceled' then
    -- 거두기는 **신청한 사람만**
    if not coalesce(v_by = v_uid, false) then
      raise exception '신청을 거두는 것은 신청하신 분만 할 수 있습니다';
    end if;
    if v_cur <> 'applied' then
      raise exception '이미 처리된 신청입니다';
    end if;
  elsif v_to in ('accepted','rejected') then
    -- 수락 · 거절은 **연 사람만**
    if not coalesce(v_owner = v_uid, false) then
      raise exception '수락 · 거절은 자리를 여신 분만 할 수 있습니다';
    end if;
    if v_cur <> 'applied' then
      raise exception '이미 처리된 신청입니다';
    end if;
    if v_to = 'accepted' then
      if v_play < current_date then
        raise exception '이미 지난 자리입니다';
      end if;
      if (select count(*) from joinapply
           where room_id = v_room and state = 'accepted') >= v_need then
        raise exception '이미 인원이 찼습니다';
      end if;
    end if;
  else
    raise exception '옮길 수 없는 상태입니다';
  end if;

  update joinapply set state = v_to where id = v_id;
  return v_to;
end $$;
grant execute on function move_joinapply(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑧ 문 — 자리를 닫습니다
-- ════════════════════════════════════════════════════════════════════
create or replace function close_joinroom(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_id    uuid := (p->>'id')::uuid;
  v_owner uuid;
  v_state text;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  select by_user, state into v_owner, v_state from joinroom where id = v_id;
  if v_owner is null then
    raise exception '그런 자리가 없습니다';
  end if;
  -- ⚠️ 운영자도 닫을 수 있습니다 (신고가 들어온 자리를 내려야 합니다)
  if not coalesce(v_owner = v_uid, false)
     and not coalesce(my_role() in ('staff','admin'), false) then
    raise exception '이 자리를 닫을 수 없습니다';
  end if;
  if v_state <> 'open' then
    raise exception '이미 닫힌 자리입니다';
  end if;
  update joinroom set state = 'closed' where id = v_id;
  -- ⚠️ 아직 답 못 받은 신청은 **거절로 두지 않습니다** — 연 사람이
  --   그만둔 것이지 그 사람들을 고른 것이 아닙니다. applied 로 두면
  --   화면이 "자리가 닫혔습니다" 로 말해 줍니다.
  return 'closed';
end $$;
grant execute on function close_joinroom(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑨ 문 — ⚠️⚠️⚠️ **연락처를 보여 줄지 따로 고릅니다** (제17조 제2항)
--   수락과 **다른 결정**이라 문도 다릅니다. 누르는 사람은 **제 것만**
--   엽니다 — 상대 것을 대신 열 수 없습니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function share_joincontact(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_id    uuid := (p->>'id')::uuid;
  v_on    boolean := coalesce((p->>'on')::boolean, true);
  v_owner uuid;
  v_by    uuid;
  v_cur   text;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  if p->>'agree_at' is null then
    raise exception '연락처 제공 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes'
     or (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의 시각이 올바르지 않습니다';
  end if;

  select a.by_user, a.state, r.by_user into v_by, v_cur, v_owner
    from joinapply a join joinroom r on r.id = a.room_id
   where a.id = v_id;
  if v_cur is null then
    raise exception '그런 신청이 없습니다';
  end if;
  -- ⚠️ 수락된 짝에게만 — 아무 신청에나 번호를 뿌릴 수 없습니다
  if v_cur <> 'accepted' then
    raise exception '수락된 뒤에 고르실 수 있습니다';
  end if;

  if coalesce(v_owner = v_uid, false) then
    update joinapply
       set host_share_at = case when v_on then now() else null end
     where id = v_id;
    return case when v_on then 'host_shared' else 'host_hidden' end;
  elsif coalesce(v_by = v_uid, false) then
    update joinapply
       set guest_share_at = case when v_on then now() else null end
     where id = v_id;
    return case when v_on then 'guest_shared' else 'guest_hidden' end;
  end if;
  raise exception '이 신청과 관계가 없습니다';
end $$;
grant execute on function share_joincontact(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑩ 문 — 연 사람이 **제 자리를 고칩니다** (지시서 §2.A)
--   ⚠️ 줄이기만 막습니다: 이미 수락한 사람보다 적은 인원으로 못 줄입니다
--   (줄이면 수락해 놓고 자리를 뺏는 꼴입니다).
-- ════════════════════════════════════════════════════════════════════
create or replace function edit_joinroom(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid    uuid := auth.uid();
  v_id     uuid := (p->>'id')::uuid;
  v_owner  uuid;
  v_state  text;
  v_taken  int;
  v_title  text := nullif(btrim(coalesce(p->>'title','')), '');
  v_body   text := nullif(btrim(coalesce(p->>'body','')), '');
  v_course text := nullif(btrim(coalesce(p->>'course','')), '');
  v_tee    text := nullif(btrim(coalesce(p->>'tee','')), '');
  v_note   text := nullif(btrim(coalesce(p->>'note','')), '');
  v_need   int;
  v_budget int;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  select by_user, state into v_owner, v_state from joinroom where id = v_id for update;
  if v_owner is null then
    raise exception '그런 자리가 없습니다';
  end if;
  if not coalesce(v_owner = v_uid, false) then
    raise exception '여신 분만 고칠 수 있습니다';
  end if;
  if v_state <> 'open' then
    raise exception '닫힌 자리는 못 고칩니다';
  end if;

  if v_title is null or char_length(v_title) < 2 then
    raise exception '제목을 두 글자 이상 적어 주세요';
  end if;
  if v_body is null or char_length(v_body) < 5 then
    raise exception '설명을 다섯 글자 이상 적어 주세요';
  end if;

  select count(*) into v_taken from joinapply
   where room_id = v_id and state = 'accepted';
  v_need := coalesce((p->>'need')::int, v_taken);
  if v_need < 1 or v_need > 3 then
    raise exception '더 필요한 인원은 1~3명입니다';
  end if;
  -- ⚠️⚠️ 이미 수락한 사람보다 적게 줄일 수 없습니다
  if v_need < v_taken then
    raise exception '이미 수락하신 분이 더 많습니다 (먼저 정리해 주세요)';
  end if;
  v_budget := nullif(btrim(coalesce(p->>'budget','')), '')::int;

  /* ⚠️⚠️ **날짜 · 지역은 여기서 못 바꿉니다.** 바꾸면 신청한 사람이
     전혀 다른 약속에 묶입니다 — 그건 고치는 것이 아니라 새 자리입니다.
     바꾸시려면 닫고 새로 여십니다. */
  update joinroom
     set title = v_title, body = v_body, course = v_course,
         tee = v_tee, note = v_note, need = v_need, budget = v_budget,
         updated_at = now()
   where id = v_id;
  return v_id;
end $$;
grant execute on function edit_joinroom(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑪ 신고 — ⚠️ **새 신고 표를 만들지 않습니다** (지시서 §0-6 · §2.A)
--   이미 선 `report`(0040)에 가리킬 곳만 하나 늘립니다. 운영자는
--   한 자리(`/admin` 의 js/adminrep.js)에서 그대로 봅니다.
--   ⚠️⚠️ `open_report` 를 **0040 → 0046 으로 갈아 끼웁니다** —
--   0040 을 다시 붙여 넣으면 이 줄이 조용히 내려갑니다
--   (`tools/check-chains.js` 가 그 짝을 셉니다).
-- ════════════════════════════════════════════════════════════════════
alter table report add column if not exists joinroom_id uuid
  references joinroom(id) on delete cascade;
alter table report drop constraint if exists report_target_ck;
alter table report add  constraint report_target_ck check (
  request_id is not null or provider_id is not null
  or review_id is not null or joinroom_id is not null);


-- ⚠️⚠️ **open_report 를 갈아 끼웁니다** (0040 → 0046). 0040 의 본문을
--   **그대로 꺼내** 네 군데만 끼웠습니다 — 손으로 다시 쓰면 0040 이
--   하던 일(분쟁 당사자 확인 · 중복 막기 · 감사 기록에 본문 안 넣기)이
--   조용히 사라집니다. 0045 에서 make_apply 를 다시 쓰다 신청번호 꼴과
--   중복 막음을 날린 적이 있습니다.
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
  v_body text := btrim(coalesce(p->>'body', ''));
  v_id   uuid;
  v_dup  int;
begin
  if v_me is null then raise exception '신고는 로그인한 뒤에 하실 수 있습니다'; end if;
  if v_kind not in ('abuse','dispute') then
    raise exception '신고 · 분쟁 중 하나로 적어 주세요';
  end if;
  if v_req is null and v_pv is null and v_rv is null and v_jr is null then
    raise exception '무엇에 대한 것인지 적어 주세요 (요청 · 업체 · 후기 · 조인 가운데 하나)';
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
     and joinroom_id is not distinct from v_jr;
  if v_dup > 0 then
    raise exception '같은 건으로 이미 접수된 것이 있습니다 — 운영자가 보고 있습니다';
  end if;

  insert into report (kind, request_id, provider_id, review_id, joinroom_id,
                      by_user, body)
  values (v_kind, v_req, v_pv, v_rv, v_jr, v_me, v_body)
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

insert into schema_version (n, name) values (46, '0046_join')
  on conflict (n) do nothing;

commit;

/* ---------------------------- 0047_community.sql ---------------------------- */
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

/* ---------------------------- 0048_career.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0048 — 골프 인력 · 비즈니스 (구인 · 구직 · 제휴)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **왜 지금 만드는가** — 막다른 분류 셋 가운데 마지막입니다
--   (조인 0046 · 커뮤니티 0047 · 여기). `/cat/career` 를 누르면
--   하위분류 여섯 이름만 보고 끝이었습니다 — 구인 글을 올릴 자리도,
--   지원할 자리도 없었습니다. 절대 규칙 2.
--
-- ⚠️⚠️ **한 표로 셋을 받습니다** (`kind`) —
--     hire  사람을 구합니다 (골프장 · 연습장 · 아카데미 → 프로 · 캐디)
--     seek  일자리를 구합니다 (프로 · 캐디 → 업체)
--     biz   제휴 · B2B · 양도양수 (업체끼리)
--   표를 셋으로 가르면 목록 · 지원 · 신고 · 가리기를 세 벌 적게 되고,
--   한 벌만 고치는 날 둘이 다른 말을 합니다.
--   ⚠️ **하위분류 키 목록을 여기 박지 않습니다** — `js/data/catalog.js`
--   의 `cr-*` 와 어긋나는 날 화면은 보내는데 DB 가 거절합니다
--   (지역 키와 같은 자리 — 0046 의 region 주석).
--
-- ⚠️⚠️⚠️ **연락처는 0046 과 똑같이 다룹니다** (개인정보보호법 제17조
--   제2항). 구인 글에 번호를 적어 두면 **아무나 긁어 갑니다** — 그리고
--   구직자 번호는 더합니다 (이력이 붙은 개인정보입니다).
--     ① 공개 보기에 `contact` 칸이 **아예 없습니다**
--     ② 표의 칸 단위 GRANT 에서 뺐습니다
--     ③ 오가는 길은 보기 `v_job_contact` 하나이고, 그 where 절이
--        **수락된 짝**만 냅니다
--   ⚠️ 그리고 **수락만으로 열리지 않습니다** — 각자 제 것만 따로 열고
--   언제든 닫습니다 (`share_jobcontact`). 수락은 "이야기해 봅시다"
--   이지 "내 번호를 줘도 좋다" 가 아닙니다.
--
-- ⚠️⚠️ **업체 이름으로 올리는 것은 고르는 것입니다** (`as_pro`).
--   켜면 **승인된 · 검사용이 아닌** 업체여야 하고, 그때만 상호가
--   목록에 나옵니다. 끄면 다른 글과 같이 가린 이름(`김**`)입니다.
--   ⚠️ 보기가 **읽을 때 다시** 상태를 봅니다 — 정지된 업체의 상호는
--   그 순간부터 목록에서 빠집니다 (저장된 이름을 믿지 않습니다).
--
-- ⚠️ **지우지 않고 내립니다**(`dropped`). 운영자가 가릴 때는 **까닭이
--   반드시**(`hidden`) — 0047 과 같은 자리입니다.
--
-- ⚠️⚠️ **급여 · 조건을 지어내지 않습니다.** 비우면 화면에서 그 줄이
--   **줄째 빠집니다** (절대 규칙 2). "협의" 를 우리가 적어 넣지
--   않습니다 — 그것은 글쓴이가 할 말입니다.
--
-- 되돌아갔는지 보는 법
--   select 1 from pg_proc where proname = 'open_jobpost';   -- 있어야 합니다
--   select count(*) from information_schema.columns
--    where table_name = 'jobpost';                          -- 19 여야 합니다
-- ════════════════════════════════════════════════════════════════════
begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 글 한 건
-- ════════════════════════════════════════════════════════════════════
create table if not exists jobpost (
  id          uuid primary key default gen_random_uuid(),
  by_user     uuid not null references auth.users(id) on delete cascade,
  -- ⚠️⚠️ **손님이 보낸 값으로 채우지 않습니다** — 문이 `my_provider()`
  --   에서 읽습니다. 보낸 값을 믿으면 아무나 남의 상호로 글을 올립니다.
  provider_id text references provider(id) on delete set null,
  kind        text not null check (kind in ('hire','seek','biz')),
  -- ⚠️ catalog.js 의 **하위** key (cr-coach · cr-caddy …). 목록을
  --   박지 않습니다 — 하위분류가 느는 날 두 곳이 어긋납니다.
  sub         text not null check (btrim(sub) <> ''),
  -- ⚠️ 지역 키는 js/data/regions.js 의 AM_REGIONS 와 **같은 글자**
  region      text not null check (btrim(region) <> ''),
  title       text not null check (char_length(btrim(title)) between 2 and 60),
  body        text not null check (char_length(btrim(body)) between 5 and 2000),
  -- 급여 · 조건 — 선택입니다 (비면 화면에서 줄째 빠집니다)
  pay         text check (pay is null or char_length(btrim(pay)) <= 60),
  terms       text check (terms is null or char_length(btrim(terms)) <= 200),
  -- 마감일 — 선택. ⚠️ 지나면 공개 보기에서 **저절로** 빠집니다
  close_at    date,
  -- open    받는 중
  -- closed  글쓴이가 마감했습니다 (사람을 구했거나 그만둠)
  -- dropped 글쓴이가 내렸습니다 ⚠️ 지우지 않습니다
  -- hidden  운영자가 가렸습니다 ⚠️ 까닭이 반드시 있습니다
  state       text not null default 'open'
              check (state in ('open','closed','dropped','hidden')),
  hidden_why  text,
  hidden_by   uuid references auth.users(id) on delete set null,
  hidden_at   timestamptz,
  -- ⚠️⚠️ **연락처는 여기 있지만 아무도 표에서 못 읽습니다** (④의 GRANT)
  contact     text not null check (btrim(contact) <> ''),
  -- ⚠️ 동의 **시각**을 받습니다. boolean 으로 두면 "언제 받았나" 를
  --   못 댑니다 (제15조 제2항을 따질 때 그것이 전부입니다).
  agree_at    timestamptz not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
-- ⚠️ 까닭 없이 가릴 수 없습니다 — 문에서도 막고 여기서도 봅니다
--   (문이 내려가는 날 이 줄이 남습니다)
do $$ begin
  alter table jobpost add constraint jobpost_hidden_ck
    check (state <> 'hidden' or btrim(coalesce(hidden_why,'')) <> '');
exception when duplicate_object then null; end $$;

create index if not exists jobpost_open_idx
  on jobpost (kind, created_at desc) where state = 'open';
create index if not exists jobpost_mine_idx on jobpost (by_user, created_at desc);
create index if not exists jobpost_sub_idx  on jobpost (sub) where state = 'open';

-- ════════════════════════════════════════════════════════════════════
-- ② 지원 · 제안 한 건
-- ════════════════════════════════════════════════════════════════════
create table if not exists jobapply (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references jobpost(id) on delete cascade,
  by_user    uuid not null references auth.users(id) on delete cascade,
  msg        text check (msg is null or char_length(btrim(msg)) <= 1000),
  contact    text not null check (btrim(contact) <> ''),
  -- applied  보냈습니다
  -- accepted 글쓴이가 받았습니다  ← 이때부터 **연락처를 열 수** 있습니다
  -- rejected 글쓴이가 거절했습니다
  -- canceled 보낸 사람이 거뒀습니다
  state      text not null default 'applied'
             check (state in ('applied','accepted','rejected','canceled')),
  agree_at   timestamptz not null,
  -- ⚠️⚠️⚠️ **수락만으로 연락처가 오가지 않습니다** (0046 과 같은 자리).
  --     host_share_at   글쓴이가 **제** 번호를 이 지원자에게 보여 줌
  --     guest_share_at  지원자가 **제** 번호를 글쓴이에게 보여 줌
  --   ⚠️ 한쪽만 눌러도 그쪽 것만 갑니다 (맞바꾸기를 강요하지 않습니다 —
  --   강요하면 "줘야 받는" 구조가 되어 사실상 강제 동의입니다).
  host_share_at  timestamptz,
  guest_share_at timestamptz,
  created_at timestamptz not null default now(),
  -- ⚠️ 한 글에 한 번만 — 안 막으면 한 사람이 같은 글에 백 번 넣습니다
  unique (post_id, by_user)
);
create index if not exists jobapply_post_idx on jobapply (post_id, created_at desc);
create index if not exists jobapply_mine_idx on jobapply (by_user, created_at desc);

-- ════════════════════════════════════════════════════════════════════
-- ③ 공개 보기 — ⚠️⚠️ **where 절이 자물쇠 그 자체입니다**
--   보기는 RLS 를 지나지 않습니다 (임자 권한으로 돕니다). 그래서
--   여기 담지 않은 칸은 **어떤 정책으로도** 새어 나가지 않습니다.
--   ⚠️ `contact` · `by_user` · `agree_at` 을 **안 담습니다**.
-- ════════════════════════════════════════════════════════════════════
drop view if exists v_job_open;
create view v_job_open as
  select j.id, j.kind, j.sub, j.region, j.title, j.body, j.pay, j.terms,
         j.close_at, j.created_at, j.updated_at,
         -- ⚠️ 이름은 **저장하지 않고 셉니다** (후기 · 커뮤니티와 같은 꼴)
         case
           when btrim(coalesce(ac.name, '')) = '' then '회원'
           else left(btrim(ac.name), 1) ||
                repeat('*', greatest(char_length(btrim(ac.name)) - 1, 1))
         end as who,
         -- ⚠️⚠️ **읽을 때 다시 봅니다** — 승인된 · 검사용이 아닌 업체의
         --   상호만 나옵니다. 정지되면 그 순간부터 빠집니다.
         --   ⚠️ 검사용 업체(0030)가 섞이면 없는 회사를 광고하는 것입니다.
         case when pv.id is not null and pv.state = 'approved'
                   and pv.is_test = false
              then pv.name end as pro_name,
         -- ⚠️ 지원 수는 칸에 저장하지 않고 **셉니다** (절대 규칙 1)
         (select count(*) from jobapply a
           where a.post_id = j.id and a.state in ('applied','accepted')) as apply_n
    from jobpost j
    left join account  ac on ac.id = j.by_user
    left join provider pv on pv.id = j.provider_id
   where j.state = 'open'
     and (j.close_at is null or j.close_at >= current_date);
grant select on v_job_open to anon, authenticated;

-- ⚠️⚠️⚠️ **연락처가 오가는 단 하나의 길입니다.**
--   ① 수락된 지원이어야 하고 ② 보는 사람이 그 둘 중 하나여야 하고
--   ③ **각자 열어 둔 것만** 나옵니다. 셋 다 where · case 에 있으므로
--   정책을 어떻게 쓰든 이 조건을 못 피합니다.
drop view if exists v_job_contact;
create view v_job_contact as
  select a.id as apply_id, a.post_id,
         j.by_user as post_owner, a.by_user as applicant,
         a.host_share_at, a.guest_share_at,
         case when a.host_share_at  is not null then j.contact end as post_contact,
         case when a.guest_share_at is not null then a.contact end as apply_contact
    from jobapply a
    join jobpost  j on j.id = a.post_id
   where a.state = 'accepted'
     and (auth.uid() = j.by_user or auth.uid() = a.by_user);
grant select on v_job_contact to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ④ 자물쇠 — RLS 로 **줄**을, GRANT 로 **칸**을
--   ⚠️⚠️ 둘을 따로 둡니다. 하나만 보고 "막혔다" 고 읽으면 다른 하나가
--   장식인지 알 수 없습니다.
-- ════════════════════════════════════════════════════════════════════
alter table jobpost  enable row level security;
alter table jobapply enable row level security;

drop policy if exists jobpost_mine on jobpost;
create policy jobpost_mine on jobpost for select
  using (by_user = auth.uid());
drop policy if exists jobpost_staff on jobpost;
create policy jobpost_staff on jobpost for select
  using (my_role() in ('staff','admin'));

drop policy if exists jobapply_mine on jobapply;
create policy jobapply_mine on jobapply for select
  using (by_user = auth.uid());
-- 내 글에 들어온 지원 — ⚠️ 연락처 칸은 아래 GRANT 가 막습니다
drop policy if exists jobapply_owner on jobapply;
create policy jobapply_owner on jobapply for select
  using (exists (select 1 from jobpost j
                  where j.id = jobapply.post_id and j.by_user = auth.uid()));
drop policy if exists jobapply_staff on jobapply;
create policy jobapply_staff on jobapply for select
  using (my_role() in ('staff','admin'));

-- ⚠️⚠️⚠️ **칸 단위 GRANT — `contact` 와 `agree_at` 을 빼고 줍니다.**
--   정책이 줄을 보여 줘도 이 칸들은 **읽히지 않습니다.**
--   ⚠️ 쓰기(insert · update · delete)는 **한 줄도 주지 않습니다** —
--   들어오는 길은 아래 문 여섯뿐입니다.
grant select (id, by_user, provider_id, kind, sub, region, title, body,
              pay, terms, close_at, state, hidden_why, hidden_at,
              created_at, updated_at)             on jobpost  to authenticated;
grant select (id, post_id, by_user, msg, state, created_at,
              host_share_at, guest_share_at)      on jobapply to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑤ 문 — 글을 올립니다
-- ════════════════════════════════════════════════════════════════════
create or replace function open_jobpost(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_kind    text := nullif(btrim(coalesce(p->>'kind','')), '');
  v_sub     text := nullif(btrim(coalesce(p->>'sub','')), '');
  v_region  text := nullif(btrim(coalesce(p->>'region','')), '');
  v_title   text := nullif(btrim(coalesce(p->>'title','')), '');
  v_body    text := nullif(btrim(coalesce(p->>'body','')), '');
  v_pay     text := nullif(btrim(coalesce(p->>'pay','')), '');
  v_terms   text := nullif(btrim(coalesce(p->>'terms','')), '');
  v_contact text := nullif(btrim(coalesce(p->>'contact','')), '');
  v_aspro   boolean := coalesce((p->>'as_pro')::boolean, false);
  v_close   date;
  v_pv      text;
  v_id      uuid;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  if v_kind is null or v_kind not in ('hire','seek','biz') then
    raise exception '구인 · 구직 · 제휴 가운데 하나를 골라 주세요';
  end if;
  if v_sub is null then
    raise exception '어떤 일인지 골라 주세요';
  end if;
  if char_length(v_sub) > 40 then
    raise exception '분류 값이 올바르지 않습니다';
  end if;
  if v_region is null then
    raise exception '지역을 골라 주세요';
  end if;
  if v_title is null or char_length(v_title) < 2 then
    raise exception '제목을 두 글자 이상 적어 주세요';
  end if;
  if char_length(v_title) > 60 then
    raise exception '제목이 너무 깁니다 (60자)';
  end if;
  if v_body is null or char_length(v_body) < 5 then
    raise exception '내용을 다섯 글자 이상 적어 주세요';
  end if;
  if char_length(v_body) > 2000 then
    raise exception '내용이 너무 깁니다 (2000자)';
  end if;
  if v_pay is not null and char_length(v_pay) > 60 then
    raise exception '급여 칸이 너무 깁니다 (60자)';
  end if;
  if v_terms is not null and char_length(v_terms) > 200 then
    raise exception '근무 조건이 너무 깁니다 (200자)';
  end if;
  if v_contact is null then
    raise exception '연락처를 적어 주세요';
  end if;
  if char_length(v_contact) > 100 then
    raise exception '연락처가 너무 깁니다';
  end if;

  -- ⚠️ 동의 시각 — 미래이거나 하루 넘게 지난 것은 받지 않습니다
  if p->>'agree_at' is null then
    raise exception '개인정보 수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes'
     or (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의 시각이 올바르지 않습니다';
  end if;

  -- 마감일 — 선택입니다
  if nullif(btrim(coalesce(p->>'close_at','')), '') is not null then
    begin
      v_close := (p->>'close_at')::date;
    exception when others then
      raise exception '마감일이 올바르지 않습니다';
    end;
    if v_close < current_date then
      raise exception '지난 날짜로는 마감일을 잡을 수 없습니다';
    end if;
    if v_close > current_date + interval '365 days' then
      raise exception '마감일이 너무 멉니다 (1년 안으로)';
    end if;
  end if;

  -- ⚠️⚠️ **업체 이름으로 올리는 것은 고르는 것입니다.** 켰으면
  --   승인된 · 검사용이 아닌 업체여야 합니다 — 보낸 값은 안 믿고
  --   `my_provider()` 에서 읽습니다.
  if v_aspro then
    v_pv := my_provider();
    if v_pv is null then
      raise exception '업체 이름으로 올리려면 업체 담당자로 로그인하셔야 합니다';
    end if;
    if not coalesce((select pv.state = 'approved' and pv.is_test = false
                       from provider pv where pv.id = v_pv), false) then
      raise exception '승인된 업체만 업체 이름으로 올릴 수 있습니다';
    end if;
  end if;

  -- ⚠️⚠️ **쏟아붓기 막기.** 한 사람이 글을 백 개 올리면 목록이 통째로
  --   쓸모없어집니다. 열려 있는 글은 **한 번에 열**까지.
  --   ⚠️ 마감 · 내린 글은 안 셉니다 (마감하고 다시 올리는 것은 정상).
  if (select count(*) from jobpost
       where by_user = v_uid and state = 'open') >= 10 then
    raise exception '올려 두신 글이 열입니다. 먼저 마감해 주세요';
  end if;
  if (select count(*) from jobpost
       where by_user = v_uid and created_at > now() - interval '1 day') >= 20 then
    raise exception '오늘은 더 올릴 수 없습니다 (하루 스무 개)';
  end if;

  insert into jobpost (by_user, provider_id, kind, sub, region, title, body,
                       pay, terms, close_at, contact, agree_at)
  values (v_uid, v_pv, v_kind, v_sub, v_region, v_title, v_body,
          v_pay, v_terms, v_close, v_contact, (p->>'agree_at')::timestamptz)
  returning id into v_id;
  return v_id;
end $$;
grant execute on function open_jobpost(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑥ 문 — 지원 · 제안을 보냅니다
-- ════════════════════════════════════════════════════════════════════
create or replace function apply_jobpost(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_post    uuid := nullif(btrim(coalesce(p->>'post_id','')), '')::uuid;
  v_msg     text := nullif(btrim(coalesce(p->>'msg','')), '');
  v_contact text := nullif(btrim(coalesce(p->>'contact','')), '');
  v_owner   uuid;
  v_state   text;
  v_close   date;
  v_id      uuid;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  if v_post is null then
    raise exception '어느 글인지 알 수 없습니다';
  end if;
  select j.by_user, j.state, j.close_at into v_owner, v_state, v_close
    from jobpost j where j.id = v_post;
  if v_owner is null then
    raise exception '그런 글이 없습니다';
  end if;
  -- ⚠️ 제 글에는 못 넣습니다 (후기에서 겪은 자리와 같습니다)
  if coalesce(v_owner = v_uid, false) then
    raise exception '올리신 글에는 지원하실 수 없습니다';
  end if;
  if v_state <> 'open' then
    raise exception '마감된 글입니다';
  end if;
  if v_close is not null and v_close < current_date then
    raise exception '마감일이 지난 글입니다';
  end if;
  if v_contact is null then
    raise exception '연락처를 적어 주세요';
  end if;
  if char_length(v_contact) > 100 then
    raise exception '연락처가 너무 깁니다';
  end if;
  if v_msg is not null and char_length(v_msg) > 1000 then
    raise exception '하실 말씀이 너무 깁니다 (1000자)';
  end if;
  if p->>'agree_at' is null then
    raise exception '개인정보 수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes'
     or (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의 시각이 올바르지 않습니다';
  end if;

  -- ⚠️ 쏟아붓기 — 하루 스무 건까지
  if (select count(*) from jobapply
       where by_user = v_uid and created_at > now() - interval '1 day') >= 20 then
    raise exception '오늘은 더 보낼 수 없습니다 (하루 스무 건)';
  end if;

  -- ⚠️⚠️ 같은 글에 두 번 — unique 가 막지만 **말이 알아들을 수 없습니다**
  --   (중복 키 오류가 손님 화면에 그대로 나갑니다). 여기서 먼저 봅니다.
  if exists (select 1 from jobapply
              where post_id = v_post and by_user = v_uid) then
    raise exception '이미 보내셨습니다 — 내 정보에서 보실 수 있습니다';
  end if;

  insert into jobapply (post_id, by_user, msg, contact, agree_at)
  values (v_post, v_uid, v_msg, v_contact, (p->>'agree_at')::timestamptz)
  returning id into v_id;
  return v_id;
end $$;
grant execute on function apply_jobpost(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑦ 문 — 지원을 수락 · 거절 · 거둡니다
-- ════════════════════════════════════════════════════════════════════
create or replace function move_jobapply(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_id    uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_to    text := nullif(btrim(coalesce(p->>'state','')), '');
  v_owner uuid;
  v_by    uuid;
  v_st    text;
  v_pst   text;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 지원인지 알 수 없습니다'; end if;
  if v_to not in ('accepted','rejected','canceled') then
    raise exception '옮길 수 없는 상태입니다';
  end if;

  -- ⚠️⚠️ **글 줄을 먼저 잠급니다.** 안 잠그면 둘을 동시에 수락할 때
  --   둘 다 "아직 괜찮다" 로 읽습니다 (0046 에서 겪은 자리).
  select j.by_user, j.state, a.by_user, a.state
    into v_owner, v_pst, v_by, v_st
    from jobapply a join jobpost j on j.id = a.post_id
   where a.id = v_id
     for update of j;
  if v_by is null then raise exception '그런 지원이 없습니다'; end if;

  if v_to = 'canceled' then
    -- 거두는 것은 **보낸 사람만**
    if not coalesce(v_by = v_uid, false) then
      raise exception '보내신 분만 거두실 수 있습니다';
    end if;
    if v_st <> 'applied' then
      raise exception '이미 처리된 지원입니다';
    end if;
    update jobapply set state = 'canceled' where id = v_id;
    return 'canceled';
  end if;

  -- 수락 · 거절은 **글쓴이만**
  if not coalesce(v_owner = v_uid, false) then
    raise exception '올리신 분만 수락 · 거절하실 수 있습니다';
  end if;
  if v_st <> 'applied' then
    raise exception '이미 처리된 지원입니다';
  end if;
  if v_pst <> 'open' then
    raise exception '마감된 글입니다';
  end if;
  update jobapply set state = v_to where id = v_id;
  return v_to;
end $$;
grant execute on function move_jobapply(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑧ 문 — 글을 마감 · 내립니다 (운영자는 가립니다)
-- ════════════════════════════════════════════════════════════════════
create or replace function move_jobpost(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_to  text := nullif(btrim(coalesce(p->>'state','')), '');
  v_why text := nullif(btrim(coalesce(p->>'why','')), '');
  v_by  uuid;
  v_st  text;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 글인지 알 수 없습니다'; end if;
  select by_user, state into v_by, v_st from jobpost where id = v_id for update;
  if v_by is null then raise exception '그런 글이 없습니다'; end if;

  if v_to in ('closed','dropped') then
    -- 마감 · 내리기는 **글쓴이만**
    if not coalesce(v_by = v_uid, false) then
      raise exception '올리신 분만 마감 · 내리실 수 있습니다';
    end if;
    if v_st = 'hidden' then
      raise exception '운영자가 가린 글은 글쓴이가 옮길 수 없습니다';
    end if;
    if v_st = v_to then
      raise exception '이미 그 상태입니다';
    end if;
    if v_st = 'dropped' then
      raise exception '이미 내려간 글입니다';
    end if;
    update jobpost set state = v_to, updated_at = now() where id = v_id;
    return v_to;
  elsif v_to = 'hidden' then
    -- 가리는 것은 **운영자만** — 까닭이 반드시 있어야 합니다
    if not coalesce(my_role() in ('staff','admin'), false) then
      raise exception '가리는 것은 운영자만 할 수 있습니다';
    end if;
    if v_why is null or char_length(v_why) < 5 then
      raise exception '가리는 까닭을 다섯 글자 이상 적어 주세요';
    end if;
    update jobpost set state = 'hidden', hidden_why = v_why, hidden_by = v_uid,
                       hidden_at = now(), updated_at = now() where id = v_id;
    -- ⚠️ 감사 기록에 **글 내용을 넣지 않습니다** — 번호로 찾아갑니다
    insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
    values (v_uid, my_role(), 'jobpost', v_id::text, 'hidden',
            jsonb_build_object('why_len', char_length(v_why)));
    return 'hidden';
  end if;
  raise exception '옮길 수 없는 상태입니다';
end $$;
grant execute on function move_jobpost(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑨ 문 — 올린 글을 고칩니다
--   ⚠️⚠️ **분류 · 갈래는 여기서 못 바꿉니다** — 바꾸면 들어온 지원이
--   전혀 다른 자리로 옮겨 갑니다 (커뮤니티의 cat 과 같은 자리).
--   ⚠️ 운영자가 **가린** 글은 글쓴이도 못 고칩니다 (고쳐서 가린 뜻을
--   지울 수 없습니다).
-- ════════════════════════════════════════════════════════════════════
create or replace function edit_jobpost(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_id      uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_title   text := nullif(btrim(coalesce(p->>'title','')), '');
  v_body    text := nullif(btrim(coalesce(p->>'body','')), '');
  v_pay     text := nullif(btrim(coalesce(p->>'pay','')), '');
  v_terms   text := nullif(btrim(coalesce(p->>'terms','')), '');
  v_contact text := nullif(btrim(coalesce(p->>'contact','')), '');
  v_close   date;
  v_by      uuid;
  v_st      text;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 글인지 알 수 없습니다'; end if;
  select by_user, state into v_by, v_st from jobpost where id = v_id for update;
  if v_by is null then raise exception '그런 글이 없습니다'; end if;
  if not coalesce(v_by = v_uid, false) then
    raise exception '올리신 분만 고치실 수 있습니다';
  end if;
  if v_st = 'hidden' then
    raise exception '운영자가 가린 글은 고치실 수 없습니다';
  end if;
  if v_st = 'dropped' then
    raise exception '내리신 글은 고치실 수 없습니다';
  end if;

  if v_title is null or char_length(v_title) < 2 then
    raise exception '제목을 두 글자 이상 적어 주세요';
  end if;
  if char_length(v_title) > 60 then
    raise exception '제목이 너무 깁니다 (60자)';
  end if;
  if v_body is null or char_length(v_body) < 5 then
    raise exception '내용을 다섯 글자 이상 적어 주세요';
  end if;
  if char_length(v_body) > 2000 then
    raise exception '내용이 너무 깁니다 (2000자)';
  end if;
  if v_pay is not null and char_length(v_pay) > 60 then
    raise exception '급여 칸이 너무 깁니다 (60자)';
  end if;
  if v_terms is not null and char_length(v_terms) > 200 then
    raise exception '근무 조건이 너무 깁니다 (200자)';
  end if;
  -- ⚠️⚠️ **연락처는 보낸 것으로 덮습니다** — 양식이 그 칸을 빠뜨리면
  --   지워집니다. 그래서 비워 보내는 것은 거절합니다
  --   (`save_provider_self` 에서 겪은 자리).
  if v_contact is null then
    raise exception '연락처를 적어 주세요';
  end if;
  if char_length(v_contact) > 100 then
    raise exception '연락처가 너무 깁니다';
  end if;

  if nullif(btrim(coalesce(p->>'close_at','')), '') is not null then
    begin
      v_close := (p->>'close_at')::date;
    exception when others then
      raise exception '마감일이 올바르지 않습니다';
    end;
    if v_close < current_date then
      raise exception '지난 날짜로는 마감일을 잡을 수 없습니다';
    end if;
    if v_close > current_date + interval '365 days' then
      raise exception '마감일이 너무 멉니다 (1년 안으로)';
    end if;
  end if;

  update jobpost
     set title = v_title, body = v_body, pay = v_pay, terms = v_terms,
         close_at = v_close, contact = v_contact, updated_at = now()
   where id = v_id;
  return v_id;
end $$;
grant execute on function edit_jobpost(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑩ 문 — **제** 연락처를 엽니다 · 닫습니다
--   ⚠️⚠️⚠️ 제17조 제2항의 "별도 동의" 가 여기입니다. 수락과 **다른
--   결정**이고, 각자 **제 것만** 열고 **언제든 닫습니다**(철회권).
-- ════════════════════════════════════════════════════════════════════
create or replace function share_jobcontact(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_id    uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_on    boolean := coalesce((p->>'on')::boolean, false);
  v_owner uuid;
  v_by    uuid;
  v_st    text;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 지원인지 알 수 없습니다'; end if;
  select j.by_user, a.by_user, a.state into v_owner, v_by, v_st
    from jobapply a join jobpost j on j.id = a.post_id
   where a.id = v_id for update of a;
  if v_by is null then raise exception '그런 지원이 없습니다'; end if;
  -- ⚠️ 수락된 뒤에만 — 수락 전에 열면 "누구에게 주는지" 가 정해지기
  --   전에 주는 것입니다 (제17조 제2항).
  if v_st <> 'accepted' then
    raise exception '수락된 뒤에 열 수 있습니다';
  end if;

  if coalesce(v_owner = v_uid, false) then
    update jobapply
       set host_share_at = case when v_on then now() else null end
     where id = v_id;
    return case when v_on then 'host-on' else 'host-off' end;
  elsif coalesce(v_by = v_uid, false) then
    update jobapply
       set guest_share_at = case when v_on then now() else null end
     where id = v_id;
    return case when v_on then 'guest-on' else 'guest-off' end;
  end if;
  raise exception '그 지원의 당사자만 열 수 있습니다';
end $$;
grant execute on function share_jobcontact(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑪ 신고 — ⚠️ **새 표를 만들지 않습니다.** `report` 에 칸을 더합니다
-- ════════════════════════════════════════════════════════════════════
alter table report add column if not exists jobpost_id uuid references jobpost(id) on delete cascade;
alter table report drop constraint if exists report_target_ck;
alter table report add  constraint report_target_ck check (
  request_id is not null or provider_id is not null or review_id is not null
  or joinroom_id is not null or cq_id is not null or ca_id is not null
  or jobpost_id is not null);


-- ⚠️⚠️ **open_report 를 갈아 끼웁니다** (0047 → 0048). 0047 의 본문을
--   **그대로 꺼내** 네 군데만 끼웠습니다 — 손으로 다시 쓰면 0040 ·
--   0046 · 0047 이 하던 일이 조용히 사라집니다.
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
  -- ⚠️ 0048 — 구인 · 구직 · 제휴 글도 신고할 수 있습니다
  v_jp   uuid := nullif(btrim(coalesce(p->>'jobpost', '')), '')::uuid;
  v_body text := btrim(coalesce(p->>'body', ''));
  v_id   uuid;
  v_dup  int;
begin
  if v_me is null then raise exception '신고는 로그인한 뒤에 하실 수 있습니다'; end if;
  if v_kind not in ('abuse','dispute') then
    raise exception '신고 · 분쟁 중 하나로 적어 주세요';
  end if;
  if v_req is null and v_pv is null and v_rv is null and v_jr is null
     and v_cq is null and v_ca is null and v_jp is null then
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
     and ca_id is not distinct from v_ca
     and jobpost_id is not distinct from v_jp;
  if v_dup > 0 then
    raise exception '같은 건으로 이미 접수된 것이 있습니다 — 운영자가 보고 있습니다';
  end if;

  insert into report (kind, request_id, provider_id, review_id, joinroom_id,
                      cq_id, ca_id, jobpost_id, by_user, body)
  values (v_kind, v_req, v_pv, v_rv, v_jr, v_cq, v_ca, v_jp, v_me, v_body)
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

insert into schema_version (n, name) values (48, '0048_career')
  on conflict (n) do nothing;

commit;

/* ---------------------------- 0049_join_hide.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0049 — 조인 자리를 **운영자가 가립니다**
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **왜 필요한가 — 신고를 받아 놓고 할 수 있는 일이 없었습니다.**
--   0046 이 `report.joinroom_id` 를 더해 조인 자리를 신고할 수 있게
--   했는데, 운영자가 그 자리를 **내릴 길이 없었습니다**. 닫는 문
--   (`close_joinroom`)은 **연 사람만** 쓸 수 있습니다 — 전화번호를
--   본문에 적어 둔 자리나 욕설이 적힌 자리를 신고받아도 운영자는
--   "처리했음" 만 누를 수 있었습니다. 그건 처리한 것이 아닙니다.
--   ⚠️ 커뮤니티(0047)와 인력(0048)에는 그 길이 있습니다 — 조인만
--   빠져 있었습니다.
--
-- ⚠️⚠️ **까닭이 반드시 있습니다.** 까닭 없이 가릴 수 있으면 불평할
--   때마다 내려 주는 자리가 됩니다. 문에서도 막고 표의 check 로도
--   막습니다 (문이 내려가는 날 그 줄이 남습니다).
--   ⚠️ 그 까닭은 **연 사람에게 보여 줍니다** (`/my` 가 찍습니다) —
--   무엇이 문제였는지 모르면 다시 열 때도 같은 일을 합니다.
--
-- ⚠️⚠️ **고치는 문을 늘리지 않았습니다.** 0046 의 `apply_joinroom` ·
--   `edit_joinroom` · `close_joinroom` 은 모두 `state = 'open'` 을
--   요구하므로, 상태 하나를 더하는 것만으로 **새 신청 · 고치기 ·
--   닫기가 저절로 막힙니다.** 셋을 손대면 0046 이 하던 일이 조용히
--   사라질 수 있습니다 (갈아 끼우는 자리를 안 늘립니다).
--
-- ⚠️ **이미 수락된 짝의 연락처는 그대로 둡니다.** 가린다고 되돌릴 수
--   없습니다 — 상대는 이미 번호를 보았습니다. 거짓 안심을 주는 것보다
--   사실대로 두고, 당사자가 **스스로 닫는** 길(`share_joincontact`)을
--   그대로 둡니다.
--
-- ⚠️ 공개 목록(`v_join_open`)은 `state = 'open'` 만 내므로 **보기를
--   건드리지 않습니다** — 가린 자리는 그 자리에서 빠집니다 (보기를
--   다시 만들면 0046 을 다시 붙여 넣는 날 되돌아갑니다).
--
-- 되돌아갔는지 보는 법
--   select 1 from pg_proc where proname = 'move_joinroom';   -- 있어야 합니다
--   select pg_get_constraintdef(oid) from pg_constraint
--    where conname = 'joinroom_state_check';                 -- hidden 이 있어야
-- ════════════════════════════════════════════════════════════════════
begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 상태 하나를 더합니다 — hidden
-- ════════════════════════════════════════════════════════════════════
alter table joinroom add column if not exists hidden_why text;
alter table joinroom add column if not exists hidden_by  uuid
  references auth.users(id) on delete set null;
alter table joinroom add column if not exists hidden_at  timestamptz;

-- ⚠️ 0046 이 인라인 check 로 적어 두어 이름이 `joinroom_state_check`
--   입니다 (Postgres 가 지어 준 이름). 그 이름으로 떼고 다시 답니다.
alter table joinroom drop constraint if exists joinroom_state_check;
alter table joinroom add  constraint joinroom_state_check
  check (state in ('open','closed','done','hidden'));

-- ⚠️⚠️ 까닭 없이 가릴 수 없습니다 — **문이 내려가도 이 줄이 남습니다**
do $$ begin
  alter table joinroom add constraint joinroom_hidden_ck
    check (state <> 'hidden' or btrim(coalesce(hidden_why,'')) <> '');
exception when duplicate_object then null; end $$;

-- ⚠️ 칸 단위 GRANT 는 **더하는 것**입니다 — 0046 이 준 것은 그대로
--   두고 가린 까닭만 얹습니다 (연 사람이 제 화면에서 읽습니다).
--   ⚠️ `contact` 와 `agree_at` 은 **여전히 안 줍니다.**
grant select (hidden_why, hidden_at) on joinroom to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ② 문 — 운영자가 가립니다
--   ⚠️ 연 사람이 닫는 길은 `close_joinroom` 그대로입니다. 가리는 것과
--   닫는 것은 **다른 일**이라 문을 갈라 둡니다 (닫은 자리는 다시
--   열 수 있지만, 가린 자리는 운영자가 가린 것입니다).
-- ════════════════════════════════════════════════════════════════════
create or replace function move_joinroom(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_to  text := nullif(btrim(coalesce(p->>'state','')), '');
  v_why text := nullif(btrim(coalesce(p->>'why','')), '');
  v_st  text;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 자리인지 알 수 없습니다'; end if;
  if v_to <> 'hidden' then
    raise exception '옮길 수 없는 상태입니다';
  end if;
  -- ⚠️⚠️ 가리는 것은 **운영자만**입니다
  if not coalesce(my_role() in ('staff','admin'), false) then
    raise exception '가리는 것은 운영자만 할 수 있습니다';
  end if;
  if v_why is null or char_length(v_why) < 5 then
    raise exception '가리는 까닭을 다섯 글자 이상 적어 주세요';
  end if;

  select state into v_st from joinroom where id = v_id for update;
  if v_st is null then raise exception '그런 자리가 없습니다'; end if;
  if v_st = 'hidden' then raise exception '이미 가려진 자리입니다'; end if;

  update joinroom set state = 'hidden', hidden_why = v_why,
                      hidden_by = v_uid, hidden_at = now(),
                      updated_at = now()
   where id = v_id;

  -- ⚠️ 감사 기록에 **본문을 넣지 않습니다** — audit_log 는 오래 남고
  --   보는 사람도 넓습니다. 번호로 찾아갑니다.
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, data)
  values (v_uid, my_role(), 'joinroom', v_id::text, v_st, 'hidden',
          jsonb_build_object('why_len', char_length(v_why)));
  return 'hidden';
end $$;
revoke all on function move_joinroom(jsonb) from public;
grant execute on function move_joinroom(jsonb) to authenticated;

insert into schema_version (n, name) values (49, '0049_join_hide')
  on conflict (n) do nothing;

commit;

/* ---------------------------- 0050_notice.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0050 — 내부 알림 (밖으로 **안 보냅니다**)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **왜 "내부" 인가.** 문자 · 카톡 · 메일을 보내는 순간 —
--   ① 정보통신망법 제50조가 걸립니다 ((광고) 표기 · 보내는 사람 ·
--      수신거부 · 21시~08시 금지)
--   ② 발송사가 **수탁자**가 되어 개인정보처리방침에 그 회사를 적어야
--      합니다 (제26조 · 미국 회사면 나라까지 — 제28조의8)
--   ③ 환경변수가 하나 더 늘고, 그것이 비면 **조용히 안 보내집니다**
--   셋은 늘 같이 움직입니다. 그래서 지금은 **화면에서만** 알립니다 —
--   보내는 곳이 없으니 수탁자도 늘지 않고, 안 보내진 줄 모르는 일도
--   없습니다. ⚠️ 밖으로 보내기 시작하는 날 **방침의 수탁자를 같은
--   날** 적으세요 (작업 기억의 그 줄).
--
-- ⚠️⚠️ **알림은 "무엇이 생겼다" 까지입니다.** 본문을 담는 칸이 아예
--   없습니다 — 담으면 손님이 적은 글이 그대로 한 벌 더 복사되고, 그
--   안에 전화번호가 들어 있으면 **알림이 연락처를 나르는 길**이 됩니다
--   (감사 기록에 성함 · 연락처를 안 넣는 것과 같은 까닭).
--   제목은 우리가 쓴 **정해진 말**이고, 자세한 것은 가는 자리에서
--   그 사람의 권한으로 봅니다.
--
-- ⚠️⚠️ **가는 주소는 우리 주소만** 받습니다 (`/` 로 시작하고 `//` 는
--   아님). 지금은 트리거가 짓지만, 바깥 주소가 들어갈 수 있는 칸을
--   열어 두면 그것이 열린 넘겨주기(open redirect)입니다.
--
-- ⚠️ **문을 갈아 끼우지 않았습니다.** 알림은 **트리거**로 답니다 —
--   `make_quote` · `apply_jobpost` 같은 문을 다시 쓰면 0008 · 0048 이
--   하던 일이 조용히 사라질 수 있습니다 (앞 번호를 덮는 짝이 또 늡니다).
--
-- 되돌아갔는지 보는 법
--   select 1 from pg_proc where proname = 'read_notice';   -- 있어야 합니다
--   select count(*) from pg_trigger where tgname like 'notice_%_t';
--     -- 이 번호가 일곱을 답니다. ⚠️ 뒤 번호가 더하면 늘어납니다 —
--     -- 0053 이 문의 답변 알림을 더해 지금은 **8** 입니다 (갯수를
--     -- 박아 두면 늘어난 날 멀쩡한 DB 를 고장으로 읽습니다).
-- ════════════════════════════════════════════════════════════════════
begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 알림 한 줄
-- ════════════════════════════════════════════════════════════════════
create table if not exists notice (
  id         uuid primary key default gen_random_uuid(),
  to_user    uuid not null references auth.users(id) on delete cascade,
  -- ⚠️ 갈래는 정해진 것만 — 화면이 아이콘 · 말을 가릅니다
  kind       text not null check (kind in
               ('quote','jobapply','jobmoved','joinapply','joinmoved',
                'answer','hidden')),
  -- ⚠️⚠️ **우리가 쓴 말**입니다 (손님이 적은 글이 아닙니다)
  title      text not null check (btrim(title) <> '' and char_length(title) <= 60),
  -- ⚠️⚠️⚠️ **우리 주소만** — `/` 로 시작하고 `//` 는 아닙니다
  link       text not null check (
               link like '/%' and link not like '//%' and char_length(link) <= 120),
  -- 어디에 달린 알림인가 (번호로 찾아갑니다 — 내용은 안 담습니다)
  obj        text,
  obj_id     text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notice_mine_idx
  on notice (to_user, created_at desc);
create index if not exists notice_unread_idx
  on notice (to_user) where read_at is null;

-- ════════════════════════════════════════════════════════════════════
-- ② 자물쇠 — ⚠️ **제 알림만** 읽습니다
--   운영자 정책을 **두지 않습니다** — 남의 알림을 읽을 까닭이 없습니다
--   (후기에서 "로그인한 아무나 읽는다" 를 두었다가 고친 자리와 같은 결).
-- ════════════════════════════════════════════════════════════════════
alter table notice enable row level security;

drop policy if exists notice_mine on notice;
create policy notice_mine on notice for select
  using (to_user = auth.uid());

-- ⚠️ `to_user` 를 **안 줍니다** — 늘 제 것이라 화면이 쓸 일이 없고,
--   주면 그 칸으로 무엇을 할 수 있는지 다시 따져야 합니다.
-- ⚠️⚠️ 쓰기는 **한 줄도 주지 않습니다** — 트리거가 넣고 문이 읽음으로
--   바꿉니다.
grant select (id, kind, title, link, obj, obj_id, read_at, created_at)
  on notice to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ③ 안쪽 도움함수 — ⚠️ **문이 아닙니다** (아무에게도 GRANT 하지
--   않습니다). 트리거만 부릅니다.
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **함수는 표와 다릅니다 — 기본이 "누구나 실행" 입니다.**
--   표는 GRANT 를 안 주면 아무도 못 읽지만, 함수는 만들면 그 순간
--   `public` 에게 EXECUTE 가 붙습니다. `security definer` 까지 달린
--   이 함수를 그대로 두면 **로그인한 누구나** 아무 사람에게 아무
--   제목으로 알림을 꽂을 수 있습니다 (제목은 자유 글자입니다 — 주소는
--   표의 check 가 막지만 제목은 안 막습니다).
--   ⚠️ 검사가 "직접 못 부른다" 를 눌러 보고서야 드러났습니다 — 문법도
--   빌드도 다른 검사도 전부 통과했습니다. 아래 `revoke` 가 자물쇠입니다.
create or replace function notify_one(
  p_to uuid, p_kind text, p_title text, p_link text,
  p_obj text, p_obj_id text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  -- ⚠️ 받을 사람이 없으면 조용히 끝냅니다. 로그인 없이 들어온 요청은
  --   `request.user_id` 가 비어 있습니다 (못 보내는 것이 맞습니다).
  if p_to is null then return; end if;
  -- ⚠️⚠️ **제가 한 일은 제게 안 알립니다.** 제 질문에 제가 답을 달면
  --   "답변이 달렸습니다" 가 저에게 오는 꼴입니다.
  if p_to = auth.uid() then return; end if;
  -- ⚠️⚠️ **안 읽은 같은 알림이 있으면 더 쌓지 않습니다.** 답변이 열 개
  --   달리면 "답변이 달렸습니다" 가 열 줄이 되고, 그러면 목록이
  --   쓸모없어집니다 (읽은 뒤에는 다시 옵니다).
  if exists (select 1 from notice
              where to_user = p_to and kind = p_kind
                and obj is not distinct from p_obj
                and obj_id is not distinct from p_obj_id
                and read_at is null) then
    return;
  end if;
  insert into notice (to_user, kind, title, link, obj, obj_id)
  values (p_to, p_kind, p_title, p_link, p_obj, p_obj_id);
end $$;
-- ⚠️⚠️ **아무에게도 주지 않습니다.** 트리거는 제 함수의 임자 권한으로
--   돌기 때문에 EXECUTE 를 거두어도 그대로 돕니다.
revoke all on function notify_one(uuid, text, text, text, text, text) from public;

-- ════════════════════════════════════════════════════════════════════
-- ④ 트리거 — 견적이 왔습니다
-- ════════════════════════════════════════════════════════════════════
create or replace function notice_quote() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_to uuid;
begin
  select r.user_id into v_to from request r where r.id = new.request_id;
  perform notify_one(v_to, 'quote', '받으신 견적이 하나 늘었습니다',
                     '/my', 'request', new.request_id::text);
  return null;
end $$;
revoke all on function notice_quote() from public;
drop trigger if exists notice_quote_t on quote;
create trigger notice_quote_t after insert on quote
  for each row execute function notice_quote();

-- ════════════════════════════════════════════════════════════════════
-- ⑤ 트리거 — 구인 · 구직에 지원이 들어왔습니다 · 처리되었습니다
-- ════════════════════════════════════════════════════════════════════
create or replace function notice_jobapply() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_to uuid;
begin
  select j.by_user into v_to from jobpost j where j.id = new.post_id;
  perform notify_one(v_to, 'jobapply', '올리신 글에 지원 · 제안이 들어왔습니다',
                     '/my', 'jobpost', new.post_id::text);
  return null;
end $$;
revoke all on function notice_jobapply() from public;
drop trigger if exists notice_jobapply_t on jobapply;
create trigger notice_jobapply_t after insert on jobapply
  for each row execute function notice_jobapply();

create or replace function notice_jobmoved() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- ⚠️ 거둔 것(canceled)은 **제가 한 일**이라 안 알립니다
  if new.state = old.state or new.state not in ('accepted','rejected') then
    return null;
  end if;
  perform notify_one(new.by_user, 'jobmoved',
    case when new.state = 'accepted' then '보내신 지원이 수락되었습니다'
         else '보내신 지원이 거절되었습니다' end,
    '/my', 'jobapply', new.id::text);
  return null;
end $$;
revoke all on function notice_jobmoved() from public;
drop trigger if exists notice_jobmoved_t on jobapply;
create trigger notice_jobmoved_t after update of state on jobapply
  for each row execute function notice_jobmoved();

-- ════════════════════════════════════════════════════════════════════
-- ⑥ 트리거 — 조인 신청이 들어왔습니다 · 처리되었습니다
-- ════════════════════════════════════════════════════════════════════
create or replace function notice_joinapply() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_to uuid;
begin
  select r.by_user into v_to from joinroom r where r.id = new.room_id;
  perform notify_one(v_to, 'joinapply', '여신 조인 자리에 신청이 들어왔습니다',
                     '/my', 'joinroom', new.room_id::text);
  return null;
end $$;
revoke all on function notice_joinapply() from public;
drop trigger if exists notice_joinapply_t on joinapply;
create trigger notice_joinapply_t after insert on joinapply
  for each row execute function notice_joinapply();

create or replace function notice_joinmoved() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.state = old.state or new.state not in ('accepted','rejected') then
    return null;
  end if;
  perform notify_one(new.by_user, 'joinmoved',
    case when new.state = 'accepted' then '조인 신청이 수락되었습니다'
         else '조인 신청이 거절되었습니다' end,
    '/my', 'joinapply', new.id::text);
  return null;
end $$;
revoke all on function notice_joinmoved() from public;
drop trigger if exists notice_joinmoved_t on joinapply;
create trigger notice_joinmoved_t after update of state on joinapply
  for each row execute function notice_joinmoved();

-- ════════════════════════════════════════════════════════════════════
-- ⑦ 트리거 — 제 질문에 답변이 달렸습니다
-- ════════════════════════════════════════════════════════════════════
create or replace function notice_answer() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_to uuid;
begin
  select q.by_user into v_to from cq q where q.id = new.q_id;
  perform notify_one(v_to, 'answer', '올리신 질문에 답변이 달렸습니다',
                     '/cat/community', 'cq', new.q_id::text);
  return null;
end $$;
revoke all on function notice_answer() from public;
drop trigger if exists notice_answer_t on ca;
create trigger notice_answer_t after insert on ca
  for each row execute function notice_answer();

-- ════════════════════════════════════════════════════════════════════
-- ⑧ 트리거 — 운영자가 글을 가렸습니다
--   ⚠️⚠️ **까닭을 알림에 담지 않습니다** — 그 까닭은 그 사람의 화면
--   (`/my`)에서 그 사람 권한으로 봅니다. 알림은 "가렸습니다" 까지입니다.
--   ⚠️ 가린 까닭에는 신고 내용이 섞이기 쉽고, 알림은 오래 남습니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function notice_hidden() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.state <> 'hidden' or old.state = 'hidden' then return null; end if;
  perform notify_one(new.by_user, 'hidden',
    '올리신 글이 운영자에 의해 가려졌습니다', '/my',
    tg_table_name, new.id::text);
  return null;
end $$;
revoke all on function notice_hidden() from public;
drop trigger if exists notice_hidden_cq_t on cq;
create trigger notice_hidden_cq_t after update of state on cq
  for each row execute function notice_hidden();
drop trigger if exists notice_hidden_job_t on jobpost;
create trigger notice_hidden_job_t after update of state on jobpost
  for each row execute function notice_hidden();

-- ════════════════════════════════════════════════════════════════════
-- ⑨ 문 — 읽음으로 바꿉니다
--   ⚠️⚠️ **RLS 는 UPDATE 에서 에러를 내지 않습니다** — 보이지 않는 줄은
--   그냥 안 걸릴 뿐입니다. 그래서 여기서 `to_user = auth.uid()` 를
--   **직접** 적고, **바뀐 줄 수**를 돌려줍니다 (0 이면 아무것도 안
--   바뀐 것이고, 검사가 그것을 봅니다).
-- ════════════════════════════════════════════════════════════════════
create or replace function read_notice(p jsonb)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_all boolean := coalesce((p->>'all')::boolean, false);
  v_n   int;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_all then
    update notice set read_at = now()
     where to_user = v_uid and read_at is null;
    get diagnostics v_n = row_count;
    return v_n;
  end if;
  if v_id is null then raise exception '어느 알림인지 알 수 없습니다'; end if;
  update notice set read_at = now()
   where id = v_id and to_user = v_uid and read_at is null;
  get diagnostics v_n = row_count;
  -- ⚠️ 남의 알림을 가리켰는지 **갈라서 말하지 않습니다** — 갈라 주면
  --   번호를 바꿔 가며 "그 알림이 있는지" 를 확인할 수 있습니다.
  return v_n;
end $$;
revoke all on function read_notice(jsonb) from public;
grant execute on function read_notice(jsonb) to authenticated;

insert into schema_version (n, name) values (50, '0050_notice')
  on conflict (n) do nothing;

commit;

/* ---------------------------- 0051_provider_photo.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0051 — 업체가 올리는 **시설 사진**과 **증빙서류**
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **둘은 같은 것이 아닙니다.** 한 표에 담되 `kind` 로 가르고,
--   **보는 길을 완전히 다르게** 둡니다 —
--     photo 시설 사진 — 손님 **누구나** 봅니다 (카드 · 업체 상세)
--     doc   증빙서류   — **운영자와 그 업체만** 봅니다 (심사용)
--   증빙서류가 공개로 새면 그건 사업자등록증 · 자격증이 인터넷에 올라간
--   것입니다. 그래서 자물쇠를 **세 겹**으로 둡니다:
--     ① 공개 보기(`v_provider_photo_public`)가 `kind = 'photo'` 만 냅니다
--        — 서류는 그 보기에 **아예 안 담깁니다**
--     ② 표의 RLS 가 그 업체와 운영자에게만 줄을 보여 줍니다
--     ③ 경로가 갈래를 **글자로** 들고 있고(`pv/<id>/photo/…` ·
--        `pv/<id>/doc/…`) 표의 check 가 그것을 봅니다 — 서버가 버킷을
--        고를 때 그 경로를 보므로, 문이 내려가도 이 줄이 남습니다
--   ⚠️ 셋을 **따로** 눌러 봅니다 (`tools/sql/pvphoto.js`).
--
-- ⚠️⚠️ **버킷이 둘입니다.** 공개 사진은 정적 HTML 에 `<img>` 로 찍히므로
--   (빌드가 `pull-providers.js` 의 자료를 읽습니다) **10분짜리 서명
--   주소를 쓸 수 없습니다** — 공개 버킷이라야 합니다. 서류는 그 반대로
--   비공개 버킷입니다.
--     photo → PROVIDER_BUCKET (공개)
--     doc   → INTAKE_BUCKET   (비공개 · 손님 사진과 같은 버킷)
--   ⚠️⚠️⚠️ **버킷은 서버가 `kind` 로 고릅니다** — 화면이 보낸 값으로
--   고르면 거기가 바로 구멍입니다 (`api/upload.js`).
--
-- ⚠️ **검사용 업체의 사진은 공개로 안 나갑니다** (`is_test = false`) —
--   0032 에서 광고 보기가 검사용 상호를 내보낼 뻔한 그 자리입니다.
--
-- ⚠️ **파일 이름을 담지 않습니다** (0011 과 같은 까닭) — 원래 이름에는
--   성함 · 상호가 들어 있기 쉽고, 담으면 그게 또 하나의 사본입니다.
--   경로는 **여기서** 만듭니다.
--
-- 되돌아갔는지 보는 법
--   select 1 from pg_proc where proname = 'claim_provider_photo';
--   select count(*) from information_schema.columns
--    where table_name = 'v_provider_photo_public';   -- 6 이어야 합니다
-- ════════════════════════════════════════════════════════════════════
begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 한 장
-- ════════════════════════════════════════════════════════════════════
create table if not exists provider_photo (
  id          uuid primary key default gen_random_uuid(),
  provider_id text not null references provider(id) on delete cascade,
  -- photo 시설 사진 (공개) · doc 증빙서류 (운영자 · 그 업체만)
  kind        text not null check (kind in ('photo','doc')),
  -- 버킷 안의 경로 — ⚠️ 파일 자체는 Storage 에 있습니다
  path        text not null unique,
  mime        text not null,
  bytes       bigint not null,
  -- 사진 설명 — ⚠️ 서류에는 안 보여 줍니다 (공개 보기에만 나갑니다)
  caption     text,
  by_user     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  -- ⚠️⚠️ 받는 형식 · 크기를 **DB 가** 정합니다 (0011 과 같은 값이어야
  --   합니다 — `api/upload.js` 의 OK_MIME · MAX_BYTES 와 셋이 같습니다)
  constraint pvphoto_mime_ok check (mime in
    ('image/jpeg','image/png','image/webp','application/pdf')),
  constraint pvphoto_bytes_ok check (bytes > 0 and bytes <= 8388608),
  constraint pvphoto_caption_ok check
    (caption is null or char_length(btrim(caption)) <= 60),
  -- ⚠️⚠️⚠️ **경로가 갈래를 글자로 들고 있습니다.** 서버가 버킷을 고를
  --   때 이 경로를 보므로, 문이 내려가도 이 줄이 남습니다. 서류 경로에
  --   photo 가 붙는 일이 없습니다.
  constraint pvphoto_path_ok check (
    path <> '' and length(path) <= 300
    and path = 'pv/' || provider_id || '/' || kind || '/' ||
               substring(path from '[^/]+$')),
  -- ⚠️ 사진에만 JPG · PNG · WEBP, 서류에만 PDF — 섞이면 공개 보기에
  --   PDF 가 `<img>` 로 나가고 화면이 깨집니다
  constraint pvphoto_kind_mime_ok check (
    (kind = 'photo' and mime <> 'application/pdf')
    or (kind = 'doc' and mime = 'application/pdf'))
);
create index if not exists pvphoto_pv_idx
  on provider_photo (provider_id, kind, created_at);

-- ════════════════════════════════════════════════════════════════════
-- ② 공개 보기 — ⚠️⚠️ **where 절이 자물쇠 그 자체입니다**
--   보기는 RLS 를 지나지 않습니다 (임자 권한으로 돕니다). 그래서 여기
--   담지 않은 것은 **어떤 정책으로도** 새어 나가지 않습니다.
--   ⚠️⚠️⚠️ `kind = 'photo'` — **증빙서류는 이 보기에 아예 안 담깁니다.**
--   ⚠️ `is_test = false` — 검사용 업체 사진이 손님에게 나가지 않습니다.
--   ⚠️ `by_user` 를 안 담습니다 (누가 올렸는지는 공개가 아닙니다).
-- ════════════════════════════════════════════════════════════════════
drop view if exists v_provider_photo_public;
create view v_provider_photo_public as
  select ph.id, ph.provider_id, ph.path, ph.mime, ph.caption, ph.created_at
    from provider_photo ph
    join provider p on p.id = ph.provider_id
   where ph.kind = 'photo'
     and p.state = 'approved'
     and p.listed = true
     and p.is_test = false;
grant select on v_provider_photo_public to anon, authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ③ 자물쇠 — RLS 로 줄을
-- ════════════════════════════════════════════════════════════════════
alter table provider_photo enable row level security;

-- 그 업체의 담당자 — ⚠️ 제 것만 (서류 포함)
drop policy if exists pvphoto_mine on provider_photo;
create policy pvphoto_mine on provider_photo for select
  using (my_provider() is not null and provider_id = my_provider());
drop policy if exists pvphoto_staff on provider_photo;
create policy pvphoto_staff on provider_photo for select
  using (my_role() in ('staff','admin'));

-- ⚠️⚠️ 쓰기는 **한 줄도 주지 않습니다** — 들어오는 길은 아래 문 둘뿐.
grant select (id, provider_id, kind, path, mime, bytes, caption, created_at)
  on provider_photo to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ④ 문 — 올릴 자리를 하나 받습니다
--   ⚠️ 0011 과 달리 **로그인한 업체 담당자**가 부릅니다 (service key 가
--   아닙니다) — 올리시는 분이 누구인지 토큰으로 압니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function claim_provider_photo(p jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_pv    text := my_provider();
  v_kind  text := nullif(btrim(coalesce(p->>'kind','')), '');
  v_mime  text := lower(nullif(btrim(coalesce(p->>'mime','')), ''));
  v_bytes bigint := nullif(btrim(coalesce(p->>'bytes','')), '')::bigint;
  v_cap   text := nullif(btrim(coalesce(p->>'caption','')), '');
  v_ext   text;
  v_path  text;
  v_id    uuid;
  v_n     int;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if my_role() <> 'provider' or v_pv is null then
    raise exception '업체 계정으로 로그인하셔야 합니다';
  end if;
  if not exists (select 1 from provider where id = v_pv) then
    raise exception '연결된 업체를 찾을 수 없습니다';
  end if;
  if v_kind not in ('photo','doc') then
    raise exception '사진인지 서류인지 골라 주세요';
  end if;
  -- ⚠️⚠️ 갈래와 형식이 **짝**이어야 합니다 — 섞이면 공개 보기에 PDF 가
  --   사진으로 나갑니다 (표의 check 도 같은 것을 봅니다).
  if v_kind = 'photo' and v_mime not in ('image/jpeg','image/png','image/webp') then
    raise exception '사진은 JPG · PNG · WEBP 만 올리실 수 있습니다';
  end if;
  if v_kind = 'doc' and v_mime <> 'application/pdf' then
    raise exception '서류는 PDF 만 올리실 수 있습니다';
  end if;
  if v_bytes is null or v_bytes <= 0 or v_bytes > 8388608 then
    raise exception '한 장에 8MB 까지 올리실 수 있습니다';
  end if;
  if v_cap is not null and char_length(v_cap) > 60 then
    raise exception '사진 설명이 너무 깁니다 (60자)';
  end if;

  -- ⚠️ 몇 장까지 — 사진 열 장 · 서류 다섯 장. 안 막으면 버킷이
  --   쓰레기통이 되고, 카드에 사진이 백 장 달립니다.
  select count(*) into v_n from provider_photo
   where provider_id = v_pv and kind = v_kind;
  if v_kind = 'photo' and v_n >= 10 then
    raise exception '사진은 열 장까지입니다. 먼저 빼 주세요';
  end if;
  if v_kind = 'doc' and v_n >= 5 then
    raise exception '서류는 다섯 장까지입니다. 먼저 빼 주세요';
  end if;

  v_ext := case v_mime when 'image/jpeg' then 'jpg'
                       when 'image/png'  then 'png'
                       when 'image/webp' then 'webp'
                       else 'pdf' end;
  -- ⚠️⚠️ **경로를 여기서 만듭니다.** 화면이 보낸 이름을 쓰면 `../` 같은
  --   것이 섞이고, 원래 파일 이름에는 성함 · 상호가 들어 있기도 합니다.
  --   ⚠️ 갈래가 경로에 **글자로** 들어갑니다 — 서버가 버킷을 그걸로
  --   고르고, 표의 check 가 그것을 봅니다.
  v_path := 'pv/' || v_pv || '/' || v_kind || '/' ||
            gen_random_uuid()::text || '.' || v_ext;

  insert into provider_photo (provider_id, kind, path, mime, bytes, caption, by_user)
  values (v_pv, v_kind, v_path, v_mime, v_bytes, v_cap, v_uid)
  returning id into v_id;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_uid, my_role(), 'provider_photo', v_id::text, v_kind,
          jsonb_build_object('mime', v_mime, 'bytes', v_bytes));

  return jsonb_build_object('id', v_id, 'path', v_path, 'kind', v_kind);
end $$;
revoke all on function claim_provider_photo(jsonb) from public;
grant execute on function claim_provider_photo(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑤ 문 — 뺍니다
--   ⚠️ 파일은 Storage 에 남습니다 (줄만 지웁니다) — 서버가 이어서
--   지우고, 못 지워도 보기에 안 나오므로 화면에는 안 보입니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function drop_provider_photo(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid  uuid := auth.uid();
  v_id   uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_pv   text;
  v_kind text;
  v_path text;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 파일인지 알 수 없습니다'; end if;
  select provider_id, kind, path into v_pv, v_kind, v_path
    from provider_photo where id = v_id;
  if v_pv is null then raise exception '그런 파일이 없습니다'; end if;
  -- ⚠️⚠️ 그 업체의 담당자 **또는** 운영자입니다
  if not (coalesce(my_provider() = v_pv, false)
          or coalesce(my_role() in ('staff','admin'), false)) then
    raise exception '이 파일을 뺄 권한이 없습니다';
  end if;

  delete from provider_photo where id = v_id;

  -- ⚠️ 감사 기록에 **경로를 넣지 않습니다** — 번호로 찾아갑니다
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_uid, my_role(), 'provider_photo', v_id::text, 'dropped',
          jsonb_build_object('kind', v_kind));
  -- ⚠️ 서버가 이어서 Storage 에서 지웁니다 (경로를 돌려줍니다)
  return v_path;
end $$;
revoke all on function drop_provider_photo(jsonb) from public;
grant execute on function drop_provider_photo(jsonb) to authenticated;

insert into schema_version (n, name) values (51, '0051_provider_photo')
  on conflict (n) do nothing;

commit;

/* ---------------------------- 0052_provider_staff.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0052 — 한 업체의 **담당자 명단**, 그리고 **내보내는 길**
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **한 업체에 담당자 여럿은 이미 됩니다.** `account.provider_id`
--   에 unique 가 없어서 여러 계정이 같은 업체를 가리킬 수 있고, 0043 의
--   초대 코드가 각자 들어오는 길입니다 (`redeem_provider_invite` 는
--   "이미 **다른** 업체에 이어진 계정" 만 거절합니다).
--   없던 것은 **그 명단을 보는 길**과 **떼는 길** 둘입니다.
--
-- ⚠️⚠️⚠️ **떼는 문이 저장소에 한 줄도 없었습니다.** 0043 머리말이
--   "옮기는 일은 운영자가 먼저 끊어야 합니다" 라고 적어 놓았는데, 끊는
--   문이 없었습니다 — 그만둔 담당자가 그 업체의 요청 · 견적 · 손님
--   성함과 연락처를 **계속 봅니다.** 사장님이 Supabase SQL 편집기에서
--   `update account set role='customer', provider_id=null` 을 직접
--   치셔야 끊겼습니다. 0051 까지 그 상태였습니다.
--
-- ⚠️⚠️ **명단은 개인정보입니다** (지시서 §0 — 기본은 비공개).
--   그래서 이름을 **갈라서** 냅니다 —
--     운영자(staff · admin)   전부 그대로 (내보낼 사람을 골라야 합니다)
--     제 줄                   제 이름 그대로 (자기 정보입니다)
--     같은 업체 동료          가려서 (`김**`) — 저장소의 관례와 같습니다
--                             (`v_review_public` · `v_cq_public`)
--   ⚠️ 동료의 uuid 도 **운영자에게만** 냅니다. 업체 담당자에게는 쓸
--     데가 없고(내보내는 단추가 없습니다), 안 주는 것이 최소 수집입니다.
--
-- ⚠️⚠️ **보기는 RLS 를 지나지 않습니다** — 임자 권한으로 돌기 때문에
--   **그 `where` 절이 자물쇠 그 자체**입니다. 여기서는 두 가지뿐입니다:
--   운영자이거나, **제 업체**(`my_provider()`)이거나.
--   ⚠️ `my_provider()` 가 NULL 인 사람(일반 회원)에게는 `a.provider_id
--   = NULL` 이 **NULL** 이 되어 줄이 안 걸립니다 — 그래서 한 줄도 안
--   보입니다. (NULL 이 자물쇠를 통째로 연 0034 의 반대 경우입니다 —
--   `where` 는 NULL 을 참으로 치지 않습니다. 그래도 아래 검사가 **일반
--   회원으로 눌러 보고** 0줄인지 셉니다.)
--
-- ⚠️ "이어진 날" 은 **초대로 들어온 분만** 있습니다. SQL 로 직접 이은
--   분(0018 의 길)에게는 그 기록이 없으므로 **NULL** 로 둡니다 —
--   화면이 그 줄을 뺍니다 (절대 규칙 2: 없는 값에 자리표시자를 찍지
--   않습니다). 지어내면 "언제 이어졌다" 는 거짓이 됩니다.
--
-- ⚠️⚠️ **`biz` 딱지를 손으로 떼지 않습니다.** 0028 의 트리거가
--   `account` 의 role · provider_id 를 보고 저절로 떼 줍니다 ("업체
--   계정이 풀려 자동으로 떨어짐"). 여기서 또 떼면 규칙이 두 곳이 되고,
--   한쪽만 고치는 날 조용히 어긋납니다.
--
-- ⚠️⚠️ **마지막 담당자는 그냥 못 뗍니다.** 배정 가능이 켜진 업체에서
--   마지막 사람을 떼면, 이미 배정된 건을 **수락 · 상담 · 견적으로 넘길
--   사람이 없습니다** (길 표의 네 걸음이 업체 전용입니다 — 0018 머리말).
--   0018 의 ③ 은 **새 배정**만 막고 이미 배정된 건은 못 구합니다.
--   그래서 이 문이 **사람 말로** 거절하고 무엇을 먼저 하라고 말합니다.
--
-- ⚠️ 두 번 돌려도 안전합니다 (drop view + create · create or replace).
-- ⚠️⚠️ 돌린 파일을 고치지 않습니다 — 다음 번호로 새로 만듭니다.
-- ════════════════════════════════════════════════════════════════════
begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 보기 — 담당자 명단
--
-- ⚠️⚠️ `drop view` + `create view` 입니다 (`create or replace view` 는
--   칸을 못 늘립니다 — 0044 가 그것으로 사장님의 두 번째 붙여넣기를
--   멈춰 세웠습니다). 지우면 GRANT 도 같이 날아가므로 **바로 다시**
--   줍니다.
-- ════════════════════════════════════════════════════════════════════
drop view if exists v_provider_staff;
create view v_provider_staff as
  select
    a.provider_id,
    p.name as provider_name,
    -- ⚠️ uuid 는 운영자에게만 (내보낼 사람을 가리키는 데만 씁니다)
    case when coalesce(my_role() in ('staff','admin'), false)
         then a.id end as account_id,
    -- 이름 — 운영자는 전부 · 제 줄은 제 이름 · 동료는 가려서
    -- ⚠️ 이름이 비어 있으면 "회원" 입니다 (별표만 찍으면 고장처럼 보입니다)
    case
      when btrim(coalesce(a.name, '')) = '' then '회원'
      when coalesce(my_role() in ('staff','admin'), false)
           or a.id = auth.uid() then btrim(a.name)
      else left(btrim(a.name), 1) ||
           repeat('*', greatest(char_length(btrim(a.name)) - 1, 1))
    end as who,
    coalesce(a.id = auth.uid(), false) as is_me,
    -- ⚠️ 초대로 들어온 분만 있습니다 — 없으면 NULL (지어내지 않습니다)
    -- ⚠️⚠️ **lateral 로 하나만** 가져옵니다. 한 사람이 같은 업체에 두
    --   번 이어진 적이 있으면(내보낸 뒤 새 코드로 다시 들어온 경우)
    --   그냥 join 하면 **줄이 둘**이 되어 명단에 같은 사람이 두 번
    --   찍힙니다 (에러는 안 납니다).
    i.used_at as joined_at
  from account a
  join provider p on p.id = a.provider_id
  left join lateral (
    select max(iv.used_at) as used_at
      from provider_invite iv
     where iv.used_by = a.id and iv.provider_id = a.provider_id
  ) i on true
 where a.role = 'provider'
   and a.provider_id is not null
   and ( coalesce(my_role() in ('staff','admin'), false)
         or a.provider_id = my_provider() );

grant select on v_provider_staff to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ② 문 — 운영자가 담당자를 **내보냅니다**
--
-- ⚠️⚠️ **업체 사장님이 동료를 뗄 수 없습니다.** 남의 권한을 거두는
--   일이고, 0018 · 0043 이 "역할을 올리는 길은 운영자가 정한다" 로
--   세워 둔 선의 반대쪽입니다 — 내리는 길을 업체에 열면 그 선이
--   한쪽만 지켜집니다. 업체는 명단을 **보고** 고객센터로 알립니다.
--
-- ⚠️ 자물쇠마다 **다른 말**로 거절합니다 (어느 것이 걸렸는지 알아야
--   합니다 — 같은 말이면 하나를 빼 봐도 다른 것이 먼저 막아서 검사가
--   엉뚱한 까닭으로 통과합니다).
-- ════════════════════════════════════════════════════════════════════
create or replace function drop_provider_staff(p jsonb)
  returns text language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_u    uuid;
  v_why  text := nullif(btrim(coalesce(p->>'why', '')), '');
  v_pv   text;
  v_n    int;
  v_asg  boolean;
  v_name text;
begin
  if v_me is null then
    raise exception '로그인이 필요합니다';
  end if;
  if coalesce(my_role() in ('staff','admin'), false) = false then
    raise exception '업체 담당자를 내보내는 일은 운영자만 할 수 있습니다';
  end if;
  -- ⚠️ 못 읽는 uuid 는 **거절**합니다 (cast 가 터지면 사람 말이 아닙니다)
  begin
    v_u := nullif(btrim(coalesce(p->>'user', '')), '')::uuid;
  exception when others then
    v_u := null;
  end;
  if v_u is null then
    raise exception '어느 담당자인지 골라 주세요';
  end if;
  if v_why is null then
    raise exception '까닭을 적어야 합니다 — 감사 기록에 남습니다';
  end if;

  select provider_id into v_pv
    from account where id = v_u and role = 'provider';
  if v_pv is null then
    raise exception '그 계정은 업체 담당자가 아닙니다';
  end if;

  -- ⚠️⚠️ 세는 사이에 다른 내보내기가 끼어들면 둘 다 "나 말고 또 있다"
  --   로 읽어 **둘이 같이 빠집니다.** 업체 줄을 먼저 잠급니다
  --   (조인 정원에서 겪은 그 자리 — 0046 의 `for update`).
  select assignable, name into v_asg, v_name
    from provider where id = v_pv for update;
  select count(*) into v_n
    from account where provider_id = v_pv and role = 'provider';

  if v_n <= 1 and coalesce(v_asg, false) then
    raise exception '마지막 담당자입니다 — 먼저 배정 가능을 끄시거나 새 담당자를 초대해 주세요 (지금 내보내면 이미 배정된 건을 수락 · 상담 · 견적으로 넘길 사람이 없습니다)';
  end if;

  -- ⚠️ `biz` 딱지는 0028 의 트리거가 저절로 뗍니다 — 여기서 안 건드립니다
  update account set role = 'customer', provider_id = null where id = v_u;

  -- ⚠️⚠️ **감사 기록에 성함 · 연락처를 넣지 않습니다** — uuid 와 업체
  --   주소만 남깁니다 (`audit_log` 는 오래 남고 보는 사람도 넓습니다).
  insert into audit_log (by_user, by_role, obj, obj_id,
                         from_state, to_state, why, data)
  values (v_me, my_role(), 'account', v_u::text,
          'provider', 'customer', v_why,
          jsonb_build_object('provider', v_pv, 'left', v_n - 1));

  return v_name;
end $$;

-- ⚠️⚠️⚠️ **함수는 표와 반대입니다** — 만드는 순간 `public` 에게
--   EXECUTE 가 붙습니다. 0050 의 `notify_one` 이 그래서 **로그인한
--   누구나 아무에게 알림을 꽂을 수** 있었습니다. 거두는 줄을 같이 씁니다.
revoke all on function drop_provider_staff(jsonb) from public;
grant execute on function drop_provider_staff(jsonb) to authenticated;


insert into schema_version (n, name) values (52, '0052_provider_staff')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0053_inquiry_answer.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0053 — 문의의 **답이 손님에게 닿는 길**
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **0045 는 답을 받는 자리까지 세워 두고, 그 답이 나가는 길을
--   안 냈습니다.** `move_inquiry` 는 "답했다고 두려면 답을 적어라" 까지
--   막고(`inquiry_answer_ck`), 제 문의를 읽는 자물쇠도 이미 있었습니다
--   (`inquiry_mine` 정책 + select GRANT). 그런데 그것을 **읽는 화면이
--   한 곳도 없었습니다** — 운영자는 답을 적고 "답변함" 으로 옮기고,
--   손님은 그 답을 어디서도 볼 수 없었습니다. 운영자 화면의 안내문이
--   "답은 적어 주신 연락처로 운영자가 직접 보냅니다" 라고 적어 둔 것이
--   그 때문입니다 — 즉 **DB 에 적힌 답은 아무도 안 읽는 글**이었습니다.
--   `save_provider_contact`(문만 서 있고 적는 자리가 없던 자리) ·
--   `drop_photo`(단추가 없던 자리)와 같은 꼴입니다.
--
--   이 번호가 하는 일은 셋입니다 —
--     ① 답이 달리면 **알림**을 보냅니다 (화면에서만 · 0050 의 그 길)
--     ② 운영자 **메모**를 손님이 못 읽게 칸을 좁힙니다
--     ③ (화면) `/my` 에 "내가 보낸 문의" 가 섭니다 — `js/myinq.js`
--
-- ⚠️⚠️ **밖으로 보내지 않습니다.** 0050 의 까닭 그대로입니다 (정보통신망법
--   제50조 · 발송사가 수탁자가 되어 방침에 적어야 함 · 환경변수가 비면
--   조용히 안 보내짐). 그래서 화면에도 "문자로 알려 드립니다" 를 **적지
--   않습니다** — "이 자리에서 보십니다" 라고 적습니다.
--
-- ⚠️⚠️ **알림에 답 글자를 담지 않습니다.** 0050 에 본문 칸이 아예 없는
--   그 까닭입니다 — 담으면 운영자가 적은 글이 한 벌 더 복사되고, 그 안에
--   연락처가 섞이면 알림이 그것을 나르는 길이 됩니다. 제목은 "답변이
--   올라왔습니다" 까지이고, 답은 가는 자리에서 그 사람 권한으로 봅니다.
--
-- ⚠️⚠️ **비로그인으로 들어온 문의에는 알림을 못 보냅니다** (`by_user`
--   가 비어 있습니다 — `notify_one` 이 조용히 끝냅니다. 그게 맞습니다).
--   그 경우는 적어 주신 연락처로 운영자가 직접 답하고, 화면이 **그
--   사실을 적습니다** (안 적으면 "넣었는데 안 보인다" 가 됩니다).
--
-- ⚠️⚠️⚠️ **②는 0045 의 GRANT 를 좁히는 것입니다** — 0045 는
--   `grant select on inquiry to authenticated` 로 **표 전체**를 주었고,
--   그 표에는 운영자만 쓰는 `memo` 와 누가 답했는지(`answered_by`)가
--   있습니다. `inquiry_mine` 정책은 **줄**만 제 것으로 좁히므로, 제
--   문의의 운영자 메모는 그대로 읽혔습니다 (RLS 는 줄은 막아도 **칸은
--   못 막습니다** — 0013 에서 연락처 표를 가른 그 까닭입니다).
--   ⚠️ 그래서 **0045 파일만 따로 다시 붙여 넣으면 이 좁힘이 조용히
--   풀립니다.** `db/apply-from-0008.sql` 을 통째로 붙여 넣으면 0053 이
--   뒤에 와서 다시 좁히므로 괜찮습니다 (두 번 붙여 넣어도 같습니다).
--
-- ⚠️ 0050 머리말의 "트리거가 7 이어야 합니다" 는 이제 **8** 입니다
--   (그 줄은 그 파일에서 고쳐 두었습니다 — 주석이 코드와 다른 자리를
--   남기지 않습니다).
--
-- 되돌아갔는지 보는 법
--   select count(*) from pg_trigger where tgname = 'notice_inquiry_t';
--     -- 1 이어야 합니다
--   select count(*) from information_schema.column_privileges
--    where table_name = 'inquiry' and grantee = 'authenticated'
--      and column_name in ('memo','answered_by');
--     -- 0 이어야 합니다 (1 이상이면 0045 가 다시 덮은 것입니다)
-- ════════════════════════════════════════════════════════════════════
begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 알림 갈래를 하나 늘립니다
--   ⚠️ 0050 은 `create table if not exists` 로 표를 만들었으므로, 그
--   파일을 다시 붙여 넣어도 **이 제약은 되돌아가지 않습니다** (표가
--   이미 있으면 그 구문이 통째로 건너뜁니다).
-- ════════════════════════════════════════════════════════════════════
--   ⚠️⚠️ **제약 이름을 글자로 박지 않습니다.** 0050 은 칸 안에 그냥
--   `check (kind in (...))` 로 적었고 이름은 Postgres 가 지어 줍니다
--   (`notice_kind_check` 일 것이지만 그건 **지금의 값**입니다). 이름을
--   박아 두고 `drop constraint if exists` 로 지나가면, 이름이 다른 날
--   **옛 제약이 그대로 남아** 새 갈래를 거절하면서 `add constraint` 는
--   성공합니다 — 조용히 아무 알림도 안 붙는 꼴입니다. 그래서 그 칸을
--   지키는 check 를 **찾아서** 떼어 냅니다.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
     where conrelid = 'notice'::regclass and contype = 'c'
       and pg_get_constraintdef(oid) like '%kind%'
  loop
    execute format('alter table notice drop constraint %I', c.conname);
  end loop;
end $$;
alter table notice add constraint notice_kind_check check (kind in
  ('quote','jobapply','jobmoved','joinapply','joinmoved',
   'answer','hidden','inquiry'));

-- ════════════════════════════════════════════════════════════════════
-- ② 트리거 — 보내신 문의에 답이 올라왔습니다
--   ⚠️ **문을 갈아 끼우지 않습니다** — `move_inquiry`(0045)를 다시 쓰면
--   그 문이 하던 일(답 없이 답변함으로 못 옮김 · 닫힌 것은 못 되돌림 ·
--   감사 기록)이 조용히 사라질 수 있고, 앞 번호를 덮는 짝이 또 늡니다.
--   ⚠️⚠️ 0050 의 트리거 일곱과 **같은 꼴**로 적습니다 (`notify_one` 은
--   안쪽 도움함수라 아무에게도 EXECUTE 를 주지 않았고, 트리거는 제
--   함수의 임자 권한으로 돌기 때문에 그대로 돕니다).
-- ════════════════════════════════════════════════════════════════════
create or replace function notice_inquiry() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- ⚠️ 답변함으로 **들어올 때 한 번**입니다. 이 줄이 없으면 그 뒤의
  --    메모 수정 · 닫기마다 같은 알림이 다시 붙습니다.
  if new.state <> 'answered' or old.state = 'answered' then return null; end if;
  -- ⚠️⚠️ 답 글자를 담지 않습니다 (위 머리말) — 가는 자리는 `/my` 이고,
  --    거기서 그 사람 권한으로 봅니다.
  -- ⚠️ 접수번호를 `obj_id` 로 둡니다 — 번호로 찾아갑니다 (내용은 안 담습니다).
  perform notify_one(new.by_user, 'inquiry',
    '보내신 문의에 답변이 올라왔습니다', '/my', 'inquiry', new.no);
  return null;
end $$;
revoke all on function notice_inquiry() from public;
drop trigger if exists notice_inquiry_t on inquiry;
create trigger notice_inquiry_t after update of state on inquiry
  for each row execute function notice_inquiry();

-- ════════════════════════════════════════════════════════════════════
-- ③ 손님이 읽는 칸을 좁힙니다
--   ⚠️⚠️⚠️ **`memo` 는 운영자의 내부 메모입니다.** 손님 화면에 운영자에게
--   할 말을 찍지 않는 것과 같은 선인데(절대 규칙 3), 지금은 손님이 제
--   문의 줄에서 그것을 **읽을 수 있었습니다.**
--   ⚠️ `answered_by` 도 뺍니다 — 누가 답했는지는 손님이 알 까닭이 없고,
--   운영자 계정 uuid 입니다.
--   ⚠️⚠️ **칸 단위 GRANT 는 `where` 절에도 걸립니다** — 안 준 칸을
--   조건에 쓰면 0줄이 아니라 **질의가 통째로 거절**됩니다 (0050 ·
--   0052 에서 두 번 밟았습니다). 두 칸을 부르는 화면은 없습니다
--   (`js/admininq.js` 도 안 부릅니다 — 세어 보고 좁혔습니다).
-- ════════════════════════════════════════════════════════════════════
revoke select on inquiry from authenticated;
grant select (id, no, kind, body, name, tel, email, by_user,
              agree_at, state, answer, answered_at, created_at, updated_at)
  on inquiry to authenticated;

insert into schema_version (n, name) values (53, '0053_inquiry_answer')
  on conflict (n) do nothing;

commit;

/* ---------------------------- 0054_revoke_hat.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0054 — 능력 딱지를 **떼는 문** (0025 의 반쪽)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **0025 는 붙이는 길만 냈습니다.** 운영자가 쓰는 문은
--   `grant_hat` 하나이고, 떼는 길은 `drop_my_hat`(**본인만**) 뿐입니다.
--   그래서 운영자가 잘못 붙인 딱지를 뗄 길이 **저장소에 한 줄도**
--   없었습니다 — 사장님이 Supabase SQL 편집기에서
--   `delete from account_hat …` 를 직접 치셔야 했습니다.
--   ⚠️ 0043(잇는 길만 내고 끊는 길을 안 낸 자리 · 0052 가 고쳤습니다)과
--   **같은 꼴**입니다. 여는 길을 만드는 날 닫는 길도 같이 봅니다.
--
-- ⚠️⚠️ **`biz` 는 여기서도 못 뗍니다.** 그 딱지의 주인은 사람이 아니라
--   **0028 의 트리거**입니다 (`account.role = 'provider'` 이고
--   `provider_id` 가 있으면 붙고, 아니면 떼어집니다). 여기서 떼어 봐야
--   그 계정이 다음에 한 번 바뀌는 순간 되돌아오고, 그 전까지는
--   **업체 담당자인데 사업자 딱지가 없는** 어긋난 상태가 됩니다.
--   입점을 끊는 길은 `drop_provider_staff`(0052)이고, 그 문이 계정의
--   `provider_id` 를 비우면 트리거가 딱지를 **저절로** 뗍니다.
--   ⚠️ 0025 의 `drop_my_hat` 이 "입점 해지는 관리자가 합니다" 라고 적어
--   두었는데, 그 "관리자가 하는 길" 이 바로 0052 입니다 (이 문이
--   아닙니다 — 그래서 여기서 그 말을 고쳐 적습니다).
--
-- ⚠️⚠️ **없는 딱지를 떼면 거절합니다.** 조용히 0줄로 끝내면 감사 기록에
--   "뗐다" 가 남는데 실제로는 아무 일도 안 일어난 것입니다 — 기록이
--   거짓이 됩니다 (RLS 가 UPDATE 에서 에러를 안 내는 그 자리와 같은
--   결입니다. **바뀐 줄 수**를 셉니다).
--
-- ⚠️ 까닭을 **반드시** 받습니다 (§8 · `grant_hat` 과 같은 규칙).
--
-- 되돌아갔는지 보는 법
--   select 1 from pg_proc where proname = 'revoke_hat';   -- 있어야 합니다
-- ════════════════════════════════════════════════════════════════════
begin;

create or replace function revoke_hat(p_user uuid, p_hat member_hat, p_why text)
  returns member_hat[]
  language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_n  int;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if my_role() not in ('staff','admin') then
    raise exception '회원의 역할은 운영자만 바꿉니다';
  end if;
  if p_why is null or btrim(p_why) = '' then
    raise exception '까닭을 적어야 합니다 — 감사 기록에 남습니다';
  end if;
  -- ⚠️⚠️ 위 머리말 — 이 딱지의 주인은 0028 의 트리거입니다
  if p_hat = 'biz' then
    raise exception '사업자 회원은 여기서 뗄 수 없습니다 — 업체 연결을 끊으면 저절로 떨어집니다';
  end if;
  if not exists (select 1 from account where id = p_user) then
    raise exception '그런 회원이 없습니다';
  end if;

  delete from account_hat where account_id = p_user and hat = p_hat;
  get diagnostics v_n = row_count;
  -- ⚠️⚠️ 0줄이면 **거절**합니다 (위 머리말 — 기록이 거짓이 되지 않게)
  if v_n = 0 then
    raise exception '그 회원에게 없는 역할입니다 — %', p_hat;
  end if;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, why)
  values (v_me, my_role(), 'account_hat', p_user::text, p_hat::text, p_why);

  return (select coalesce(array_agg(hat order by hat), '{}'::member_hat[])
            from account_hat where account_id = p_user);
end $$;

revoke all on function revoke_hat(uuid, member_hat, text) from public;
grant execute on function revoke_hat(uuid, member_hat, text) to authenticated;

insert into schema_version (n, name) values (54, '0054_revoke_hat')
  on conflict (n) do nothing;

commit;

/* ---------------------------- 0055_ad_live_listed.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0055 — 광고 보기가 **정지된 업체를 걸러내게** 합니다
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **0026 · 0032 의 `v_ad_live` 는 `is_test = false` 만 봤습니다.**
--   그래서 업체를 **정지시켜도**(0038 의 `set_provider_state`) 그 업체의
--   광고는 손님 화면에 그대로 나갔습니다. 작업 기억에 "정지는 셋을
--   동시에 막습니다 — 공개 목록 · 새 배정 · 새 견적" 이라고 적혀 있는데,
--   **광고가 넷째 자리**였고 아무도 그 줄을 세지 않았습니다.
--   ⚠️ 더 나쁜 것은 **아직 승인 안 된 업체**(`draft` · `submitted` ·
--   `under_review` · `rejected`)도 통과했다는 것입니다. 그 업체는
--   `/pro/<id>` 화면이 **빌드에 없어서** 광고를 눌러도 404 입니다.
--
-- ⚠️⚠️ **보기는 RLS 를 지나지 않습니다** — 임자 권한으로 돕니다. 그래서
--   이 `where` 절이 **자물쇠 그 자체**입니다 (0030 의 정책은 이 길을 못
--   막습니다 — 0032 가 검사용 업체를 걸러낸 그 자리와 같은 결입니다).
--
-- ⚠️ 조건은 공개 카드 보기(`v_provider_card` · 0044)와 **같은 셋**입니다 —
--   "손님에게 보이는 업체" 의 뜻이 두 곳에서 달라지지 않게.
--       listed = true  ·  is_test = false  ·  state = 'approved'
--
-- ⚠️ 칸은 **하나도 안 바꿉니다** (더하지도 빼지도 않습니다) — 그래서
--   `create or replace` 로 됩니다. 칸을 늘리려면 drop + create 여야
--   하고, 그때는 GRANT 를 바로 다시 줘야 합니다 (0044 에서 겪었습니다).
--
-- 되돌아갔는지 보는 법
--   select pg_get_viewdef('v_ad_live'::regclass) ilike '%listed%';  -- t 여야 합니다
--   ⚠️⚠️ 0026 이나 0032 **파일만 따로 다시 붙여 넣으면 이 좁힘이 조용히
--   풀립니다** (0053 의 칸 GRANT 와 같은 꼴). 붙여넣기 파일을 통째로
--   쓰시면 0055 가 뒤에 와서 다시 좁힙니다.
-- ════════════════════════════════════════════════════════════════════
begin;

-- ⚠️⚠️⚠️ **`create or replace view` 가 아니라 지우고 다시 만듭니다.**
--   0064 가 이 보기에 칸 다섯(소재 · 클릭 주소 · 광고주)을 더했는데,
--   여기가 `create or replace` 이면 사장님이 붙여넣기 파일을 **두 번째로**
--   붙여 넣는 날 이 줄에서 `cannot drop columns from view` 로 **멈춥니다**
--   — 앞쪽 파일이 **옛 칸 목록**으로 다시 만들려 하기 때문입니다.
--   0044 가 `v_provider_card` 에서 겪은 그 자리이고, `test-upgrade` 의
--   ⑧("두 번 붙여 넣어도 끝까지 도는가")이 잡았습니다.
--   ⚠️ 지우면 **GRANT 도 같이 날아가므로** 바로 아래에서 다시 줍니다
--   (안 주면 그날부터 손님 화면에 광고가 한 줄도 안 나옵니다).
--   ⚠️⚠️ 이 줄을 고친 까닭 — 운영 DB 는 아직 **0007 까지만** 올라가 있어
--   이 파일이 운영에서 한 번도 돈 적이 없습니다. 이미 돌린 파일이면
--   고치지 않고 새 번호로 갔을 것입니다 (작업 기억의 그 규칙).
drop view if exists v_ad_live;
create view v_ad_live as
  select a.id, a.provider_id, p.name as provider_name,
         a.place, a.cat_key, a.region, a.starts_on, a.ends_on,
         '광고'::text as label
    from ad_run a join provider p on p.id = a.provider_id
   where a.state = 'live'
     and current_date between a.starts_on and a.ends_on
     and p.is_test = false
     -- ⚠️ 여기가 0055 가 더한 줄입니다 (위 머리말)
     and p.listed = true
     and p.state = 'approved';

-- ⚠️ `create or replace` 는 권한을 지키지만, 다시 주는 것은 공짜이고
--   혹시 앞 번호가 drop 으로 바뀌는 날의 보험입니다.
grant select on v_ad_live to anon, authenticated;

insert into schema_version (n, name) values (55, '0055_ad_live_listed')
  on conflict (n) do nothing;

commit;

/* ---------------------------- 0056_listing.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0056 — 중고 직거래 **매물** (회원끼리 사고파는 자리)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **`/cat/used` 가 2026-11-06 까지 없는 기능을 있다고 말했습니다.**
--   "회원끼리 직접 사고파는 자리입니다" · "첫 매물이 올라오면 여기에
--   바로 보입니다" 라고 적혀 있었는데, 매물을 올리는 **표도 · 문도 ·
--   화면도 저장소에 한 줄도 없었습니다** (표 이름을 전부 훑었습니다 —
--   `offer` 는 앞 사업의 잔재, `device*` 는 중고폰 잔재입니다).
--   그날 글을 사실대로 고쳤고("아직 열지 않았습니다"), 이 파일이 그
--   기능을 실제로 세웁니다.
--
-- ⚠️⚠️ **0046(조인)을 그대로 베낍니다.** 짜임새가 같습니다 —
--   글을 올리고 · 상대가 말을 걸고 · 받아들이면 **각자 제 연락처만**
--   따로 엽니다. 새로 설계하면 그 자리마다 다시 틀립니다.
--     조인                        중고
--     joinroom                    listing     (매물)
--     joinapply                   listingask  (사겠다는 문의)
--     v_join_open                 v_listing_open
--     v_join_contact              v_listing_contact
--     host/guest_share_at         seller/buyer_share_at
--
-- ⚠️⚠️⚠️ **연락처는 수락만으로 안 열립니다** (개인정보보호법 제17조
--   제2항). 수락은 "팔겠습니다" 이지 "내 번호를 줘도 좋다" 가 아닙니다 —
--   둘은 다른 결정입니다. 각자 **제 것만** 열고 **언제든 닫습니다**.
--   ⚠️ 한쪽만 열어도 그쪽 것만 갑니다 (맞바꾸기를 강요하지 않습니다 —
--   강요하면 "줘야 받는" 구조가 되어 사실상 강제 동의입니다).
--
-- ⚠️⚠️ **골프올인원은 거래 당사자가 아닙니다** (전자상거래법 제20조).
--   돈이 우리를 지나가지 않고, 물건을 우리가 보지 않습니다. 에스크로도
--   안전거래도 **없습니다** — 있다고 적으면 절대 규칙 5 입니다.
--
-- ⚠️ **가리는 상태(`hidden`)를 처음부터 넣습니다.** 0046 은 신고만 받고
--   내릴 길이 없어 0049 를 따로 만들어야 했습니다 (닫는 문은 **연
--   사람만** 씁니다). 같은 자리를 또 밟지 않습니다.
--
-- 되돌아갔는지 보는 법
--   select 1 from pg_proc where proname = 'open_listing';        -- 있어야
--   select pg_get_viewdef('v_listing_contact'::regclass)
--            ilike '%seller_share_at%';                          -- t 여야
--   select count(*) from pg_trigger where tgname like 'notice_listing%';  -- 3
-- ════════════════════════════════════════════════════════════════════
begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 매물 한 건
-- ════════════════════════════════════════════════════════════════════
create table if not exists listing (
  id         uuid primary key default gen_random_uuid(),
  by_user    uuid not null references auth.users(id) on delete cascade,
  -- ⚠️⚠️ 물건 종류 — `js/data/catalog.js` 의 중고 하위 일곱과 **같은
  --   글자**입니다 (us-driver · us-wood · us-iron · us-wedge · us-shaft ·
  --   us-bag · us-gear). ⚠️ 여기 목록을 **박지 않습니다** — 박으면
  --   하위가 느는 날 두 곳이 어긋나고, 그때 화면은 보내는데 DB 가
  --   거절합니다 (지역 키를 안 박아 둔 그 까닭 · make_request 가 하위
  --   예순둘을 모르는 그 까닭).
  sub        text not null check (btrim(sub) <> ''),
  -- ⚠️ 지역 키도 `js/data/regions.js` 의 AM_REGIONS 와 같은 글자입니다
  region     text not null check (btrim(region) <> ''),
  -- 택배로도 보내 주시나 — ⚠️ 직거래가 기본이고 이것은 **더해지는 것**
  ship       boolean not null default false,
  title      text not null check (char_length(btrim(title)) between 2 and 60),
  body       text not null check (char_length(btrim(body)) between 5 and 2000),
  -- ⚠️⚠️ **값은 반드시 받습니다.** 값 없는 매물은 목록에서 고를 수가
  --   없고, 비워 두면 화면이 "협의" 를 **지어 적게** 됩니다 (절대 규칙 1).
  --   ⚠️ 0 은 됩니다 — 무료로 나누시는 자리입니다.
  price      int not null check (price between 0 and 100000000),
  -- 물건 상태 — ⚠️ 말은 `js/data/deal.js` 의 `AM_LST_COND` 한 곳이고
  --   `check-deal` 이 이 check 와 맞춰 봅니다 (어긋나면 손님 화면에
  --   영문 키가 그대로 찍힙니다).
  cond       text not null check (cond in ('new','like','good','fair')),
  -- open   팔고 있습니다
  -- done   팔렸습니다 (글쓴이가 눌렀습니다)
  -- closed 글쓴이가 내렸습니다
  -- hidden 운영자가 가렸습니다 — ⚠️ 까닭이 반드시 있습니다 (아래 check)
  state      text not null default 'open'
             check (state in ('open','done','closed','hidden')),
  -- ⚠️⚠️ **연락처는 여기 있지만 아무도 표에서 못 읽습니다** (④의 GRANT).
  --   오가는 길은 v_listing_contact 하나입니다.
  contact    text not null check (btrim(contact) <> ''),
  -- ⚠️ 동의 **시각**을 받습니다 (boolean 으로 두면 "언제 받았나" 를
  --   못 댑니다 — 제15조 제2항을 따질 때 그것이 전부입니다)
  agree_at   timestamptz not null,
  hidden_why text,
  hidden_by  uuid references auth.users(id) on delete set null,
  hidden_at  timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- ⚠️⚠️ 까닭 없이 가릴 수 없습니다 — **문이 내려가도 이 줄이 남습니다**
  constraint listing_hidden_ck
    check (state <> 'hidden' or btrim(coalesce(hidden_why,'')) <> '')
);
create index if not exists listing_open_idx
  on listing (state, created_at desc) where state = 'open';
create index if not exists listing_mine_idx on listing (by_user, created_at desc);
create index if not exists listing_sub_idx
  on listing (sub, region) where state = 'open';

-- ════════════════════════════════════════════════════════════════════
-- ② 사겠다는 문의 한 건
-- ════════════════════════════════════════════════════════════════════
create table if not exists listingask (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listing(id) on delete cascade,
  by_user    uuid not null references auth.users(id) on delete cascade,
  msg        text check (msg is null or length(msg) <= 300),
  contact    text not null check (btrim(contact) <> ''),
  -- asked    보냈습니다
  -- accepted 파는 분이 받았습니다  ← 이때부터 **연락처를 고를 수** 있습니다
  -- rejected 파는 분이 거절했습니다
  -- canceled 문의하신 분이 거뒀습니다
  state      text not null default 'asked'
             check (state in ('asked','accepted','rejected','canceled')),
  agree_at   timestamptz not null,
  -- ⚠️⚠️⚠️ **각자 제 것만** (0046 의 host/guest 와 같은 자리입니다)
  --     seller_share_at  파는 분이 **제** 번호를 이 분에게 보여 줌
  --     buyer_share_at   문의하신 분이 **제** 번호를 파는 분에게 보여 줌
  seller_share_at timestamptz,
  buyer_share_at  timestamptz,
  created_at timestamptz not null default now(),
  -- ⚠️ 한 매물에 한 번만 — 안 막으면 한 사람이 같은 매물에 백 번 넣습니다
  unique (listing_id, by_user)
);
create index if not exists listingask_lst_idx
  on listingask (listing_id, created_at desc);
create index if not exists listingask_mine_idx on listingask (by_user, created_at desc);

-- ════════════════════════════════════════════════════════════════════
-- ③ 공개 목록 — ⚠️ **보기의 where 절이 자물쇠 그 자체입니다**
--   보기는 RLS 를 지나지 않습니다 (임자 권한으로 돕니다). 그래서 여기
--   담지 않은 칸은 **어떤 정책으로도 새어 나가지 않습니다.**
--   ⚠️⚠️ `contact` 와 `by_user` 를 **담지 않습니다** — 글은 공개지만
--   누가 올렸는지와 연락처는 공개가 아닙니다 (후기 · 조인과 같은 꼴).
-- ════════════════════════════════════════════════════════════════════
drop view if exists v_listing_open;
create view v_listing_open as
  select l.id, l.sub, l.region, l.ship, l.title, l.body, l.price, l.cond,
         l.created_at,
         -- ⚠️ 칸에 저장하지 않고 **셉니다** (절대 규칙 1 — 숫자로 들고
         --   있으면 누군가 그 칸에 고쳐 적습니다)
         (select count(*) from listingask a
           where a.listing_id = l.id and a.state = 'asked') as ask_n
    from listing l
   where l.state = 'open';
grant select on v_listing_open to anon, authenticated;

-- ⚠️⚠️⚠️ **연락처가 오가는 단 하나의 길입니다.**
--   ① 수락된 문의여야 하고 ② 보는 사람이 그 둘 중 하나여야 합니다.
--   둘 다 where 절에 있으므로 정책을 어떻게 쓰든 이 조건을 못 피합니다.
drop view if exists v_listing_contact;
create view v_listing_contact as
  select a.id as ask_id, a.listing_id,
         l.by_user as seller, a.by_user as buyer,
         a.seller_share_at, a.buyer_share_at,
         -- ⚠️⚠️⚠️ **수락만으로는 둘 다 null 입니다** (제17조 제2항)
         case when a.seller_share_at is not null then l.contact end as seller_contact,
         case when a.buyer_share_at  is not null then a.contact end as buyer_contact
    from listingask a
    join listing    l on l.id = a.listing_id
   where a.state = 'accepted'
     and (auth.uid() = l.by_user or auth.uid() = a.by_user);
grant select on v_listing_contact to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ④ 자물쇠 — RLS 로 **줄**을, GRANT 로 **칸**을 막습니다
--   ⚠️⚠️ 둘을 따로 둡니다. 하나만 보고 "막혔다" 고 읽으면 다른 하나가
--   장식인지 알 수 없습니다 (GRANT 를 잠깐 열어 RLS 가 막는지 봅니다).
-- ════════════════════════════════════════════════════════════════════
alter table listing    enable row level security;
alter table listingask enable row level security;

drop policy if exists listing_mine on listing;
create policy listing_mine on listing for select
  using (by_user = auth.uid());
drop policy if exists listing_staff on listing;
create policy listing_staff on listing for select
  using (my_role() in ('staff','admin'));

drop policy if exists listingask_mine on listingask;
create policy listingask_mine on listingask for select
  using (by_user = auth.uid());
-- 내 매물에 들어온 문의 — ⚠️ 연락처 칸은 아래 GRANT 가 막습니다
drop policy if exists listingask_owner on listingask;
create policy listingask_owner on listingask for select
  using (exists (select 1 from listing l
                  where l.id = listingask.listing_id and l.by_user = auth.uid()));
drop policy if exists listingask_staff on listingask;
create policy listingask_staff on listingask for select
  using (my_role() in ('staff','admin'));

-- ⚠️⚠️⚠️ **칸 단위 GRANT — `contact` 와 `agree_at` 을 빼고 줍니다.**
--   정책이 줄을 보여 줘도 이 칸들은 **읽히지 않습니다.**
--   ⚠️ 쓰기(insert · update · delete)는 **한 줄도 주지 않습니다** —
--   들어오는 길은 아래 문 일곱뿐입니다.
--   ⚠️⚠️ 안 준 칸을 `where` 절에 쓰면 0줄이 아니라 **질의가 통째로
--   거절**됩니다 (0050 · 0052 에서 두 번 밟은 자리입니다).
grant select (id, by_user, sub, region, ship, title, body, price, cond,
              state, hidden_why, hidden_at, created_at, updated_at)
                                   on listing    to authenticated;
grant select (id, listing_id, by_user, msg, state, created_at,
              seller_share_at, buyer_share_at)
                                   on listingask to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑤ 문 — 매물을 올립니다
-- ════════════════════════════════════════════════════════════════════
create or replace function open_listing(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_sub     text := nullif(btrim(coalesce(p->>'sub','')), '');
  v_region  text := nullif(btrim(coalesce(p->>'region','')), '');
  v_title   text := nullif(btrim(coalesce(p->>'title','')), '');
  v_body    text := nullif(btrim(coalesce(p->>'body','')), '');
  v_cond    text := nullif(btrim(coalesce(p->>'cond','')), '');
  v_contact text := nullif(btrim(coalesce(p->>'contact','')), '');
  v_ship    boolean := coalesce((p->>'ship')::boolean, false);
  v_price   int;
  v_id      uuid;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  if v_sub is null then
    raise exception '물건 종류를 골라 주세요';
  end if;
  if v_region is null then
    raise exception '지역을 골라 주세요';
  end if;
  if v_title is null or char_length(v_title) < 2 then
    raise exception '제목을 두 글자 이상 적어 주세요';
  end if;
  if char_length(v_title) > 60 then
    raise exception '제목이 너무 깁니다 (60자)';
  end if;
  if v_body is null or char_length(v_body) < 5 then
    raise exception '설명을 다섯 글자 이상 적어 주세요';
  end if;
  if char_length(v_body) > 2000 then
    raise exception '설명이 너무 깁니다 (2000자)';
  end if;
  -- ⚠️⚠️ **값은 반드시 받습니다** — 비워 두면 화면이 "협의" 를 지어
  --   적게 됩니다. 0 은 무료로 나누시는 자리입니다.
  if p->>'price' is null or btrim(p->>'price') = '' then
    raise exception '값을 적어 주세요 (무료로 나누시면 0)';
  end if;
  begin
    v_price := btrim(p->>'price')::int;
  exception when others then
    raise exception '값은 숫자로 적어 주세요';
  end;
  if v_price < 0 or v_price > 100000000 then
    raise exception '값이 올바르지 않습니다';
  end if;
  if v_cond is null then
    raise exception '물건 상태를 골라 주세요';
  end if;
  -- ⚠️ 모르는 값은 표의 check 가 막지만, **다른 말로** 거절하게 둡니다
  --   (자물쇠마다 다른 말을 해야 어느 쪽이 막았는지 알 수 있습니다)
  if v_cond not in ('new','like','good','fair') then
    raise exception '물건 상태가 올바르지 않습니다';
  end if;
  if v_contact is null then
    raise exception '연락처를 적어 주세요';
  end if;
  if length(v_contact) > 100 then
    raise exception '연락처가 너무 깁니다';
  end if;

  -- ⚠️ 동의 시각 — 미래이거나 하루 넘게 지난 것은 받지 않습니다
  if p->>'agree_at' is null then
    raise exception '개인정보 수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes'
     or (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의 시각이 올바르지 않습니다';
  end if;

  -- ⚠️⚠️ **쏟아붓기 막기.** 한 사람이 매물을 백 개 올리면 목록이 통째로
  --   쓸모없어집니다. 팔고 있는 것은 **한 번에 열**까지.
  --   ⚠️ 내린 것 · 팔린 것은 안 셉니다 (정상입니다).
  if (select count(*) from listing
       where by_user = v_uid and state = 'open') >= 10 then
    raise exception '팔고 계신 매물이 열입니다. 먼저 정리해 주세요';
  end if;
  -- 하루에 올리는 수도 막습니다 (내리고 다시 올리기를 되풀이하는 것)
  if (select count(*) from listing
       where by_user = v_uid and created_at > now() - interval '1 day') >= 20 then
    raise exception '오늘은 더 올릴 수 없습니다 (하루 스무 개)';
  end if;

  insert into listing (by_user, sub, region, ship, title, body, price,
                       cond, contact, agree_at)
  values (v_uid, v_sub, v_region, v_ship, v_title, v_body, v_price,
          v_cond, v_contact, (p->>'agree_at')::timestamptz)
  returning id into v_id;
  return v_id;
end $$;
revoke all on function open_listing(jsonb) from public;
grant execute on function open_listing(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑥ 문 — 올린 것을 고칩니다 (글쓴이만 · 팔고 있는 것만)
--   ⚠️⚠️ **보낸 칸만 고칩니다** — `save_provider_self` 처럼 "보낸 것으로
--   통째로 덮는" 꼴로 두면, 화면이 칸 하나를 빠뜨리는 날 그 칸이
--   **지워집니다** (`js/deskme.js` 가 `industries` 를 지우고 있던 그
--   자리입니다). 그래서 없는 열쇠는 **그대로 둡니다**.
--   ⚠️ 연락처는 **고칠 수 있게** 둡니다 (번호가 바뀌면 고쳐야 합니다).
--   다만 화면이 그 칸을 읽어올 수는 없으므로(칸 GRANT) 비워 열고,
--   비워 보내면 **그대로 둡니다**.
-- ════════════════════════════════════════════════════════════════════
create or replace function edit_listing(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_own uuid;
  v_st  text;
  v_n   int;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 매물인지 알 수 없습니다'; end if;

  select by_user, state into v_own, v_st from listing where id = v_id for update;
  if v_st is null then raise exception '그런 매물이 없습니다'; end if;
  -- ⚠️ `coalesce(…, false)` — NULL 이면 `if` 가 안 걸려 자물쇠가 통째로
  --   열립니다 (0034 의 취소 문에서 겪은 자리입니다)
  if not coalesce(v_own = v_uid, false) then
    raise exception '올리신 분만 고치실 수 있습니다';
  end if;
  if v_st <> 'open' then
    raise exception '팔고 있는 매물만 고치실 수 있습니다';
  end if;

  -- 길이 · 범위는 보낸 것만 봅니다
  if p ? 'title' then
    if char_length(btrim(coalesce(p->>'title',''))) < 2
       or char_length(btrim(p->>'title')) > 60 then
      raise exception '제목은 2~60자입니다';
    end if;
  end if;
  if p ? 'body' then
    if char_length(btrim(coalesce(p->>'body',''))) < 5
       or char_length(btrim(p->>'body')) > 2000 then
      raise exception '설명은 5~2000자입니다';
    end if;
  end if;
  if p ? 'price' then
    if nullif(btrim(coalesce(p->>'price','')), '') is null then
      raise exception '값을 적어 주세요 (무료로 나누시면 0)';
    end if;
    if (p->>'price')::int < 0 or (p->>'price')::int > 100000000 then
      raise exception '값이 올바르지 않습니다';
    end if;
  end if;
  if p ? 'cond' and coalesce(p->>'cond','') not in ('new','like','good','fair') then
    raise exception '물건 상태가 올바르지 않습니다';
  end if;
  if p ? 'contact' and length(coalesce(p->>'contact','')) > 100 then
    raise exception '연락처가 너무 깁니다';
  end if;

  update listing set
    sub     = coalesce(nullif(btrim(coalesce(p->>'sub','')),    ''), sub),
    region  = coalesce(nullif(btrim(coalesce(p->>'region','')), ''), region),
    title   = coalesce(nullif(btrim(coalesce(p->>'title','')),  ''), title),
    body    = coalesce(nullif(btrim(coalesce(p->>'body','')),   ''), body),
    cond    = coalesce(nullif(btrim(coalesce(p->>'cond','')),   ''), cond),
    price   = coalesce(nullif(btrim(coalesce(p->>'price','')),  '')::int, price),
    ship    = coalesce((p->>'ship')::boolean, ship),
    -- ⚠️ 비워 보내면 **그대로 둡니다** (화면이 못 읽어 오는 칸입니다)
    contact = coalesce(nullif(btrim(coalesce(p->>'contact','')), ''), contact),
    updated_at = now()
   where id = v_id;
  get diagnostics v_n = row_count;
  -- ⚠️⚠️ 0줄이면 **거절**합니다 — RLS 가 UPDATE 에서 에러를 안 내므로
  --   "성공" 으로 돌아가면 고쳐진 줄 알고 넘어갑니다 (바뀐 줄 수를 셉니다)
  if v_n = 0 then raise exception '고치지 못했습니다'; end if;
  return 'edited';
end $$;
revoke all on function edit_listing(jsonb) from public;
grant execute on function edit_listing(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑦ 문 — 사겠다고 말을 겁니다
-- ════════════════════════════════════════════════════════════════════
create or replace function ask_listing(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_lst     uuid := nullif(btrim(coalesce(p->>'listing_id','')), '')::uuid;
  v_msg     text := nullif(btrim(coalesce(p->>'msg','')), '');
  v_contact text := nullif(btrim(coalesce(p->>'contact','')), '');
  v_own     uuid;
  v_st      text;
  v_id      uuid;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_lst is null then raise exception '어느 매물인지 알 수 없습니다'; end if;
  if v_contact is null then raise exception '연락처를 적어 주세요'; end if;
  if length(v_contact) > 100 then raise exception '연락처가 너무 깁니다'; end if;
  if v_msg is not null and length(v_msg) > 300 then
    raise exception '남기실 말이 너무 깁니다 (300자)';
  end if;
  if p->>'agree_at' is null then
    raise exception '개인정보 수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes'
     or (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의 시각이 올바르지 않습니다';
  end if;

  -- ⚠️ 매물 줄을 먼저 잠급니다 (동시에 들어오는 것을 가지런히)
  select by_user, state into v_own, v_st from listing where id = v_lst for update;
  if v_st is null then raise exception '그런 매물이 없습니다'; end if;
  if v_st <> 'open' then raise exception '지금은 문의를 받지 않는 매물입니다'; end if;
  -- ⚠️⚠️ 제 매물에 제가 문의할 수 없습니다 (후기에서 제 업체에 못 쓰게
  --   막은 그 자리와 같은 결입니다)
  if coalesce(v_own = v_uid, false) then
    raise exception '올리신 분은 문의하실 수 없습니다';
  end if;

  -- ⚠️ 쏟아붓기 — 하루에 넣는 문의 수를 막습니다
  if (select count(*) from listingask
       where by_user = v_uid and created_at > now() - interval '1 day') >= 30 then
    raise exception '오늘은 더 문의할 수 없습니다 (하루 서른 건)';
  end if;

  insert into listingask (listing_id, by_user, msg, contact, agree_at)
  values (v_lst, v_uid, v_msg, v_contact, (p->>'agree_at')::timestamptz)
  returning id into v_id;
  return v_id;
exception
  -- ⚠️ 같은 매물에 두 번 — 표의 unique 가 막는데, 그 말을 그대로
  --   내보내면 손님에게 영문 제약 이름이 보입니다
  when unique_violation then
    raise exception '이미 이 매물에 문의하셨습니다';
end $$;
revoke all on function ask_listing(jsonb) from public;
grant execute on function ask_listing(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑧ 문 — 문의를 처리합니다 (파는 분은 수락 · 거절 · 문의자는 거둠)
-- ════════════════════════════════════════════════════════════════════
create or replace function move_listingask(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_to  text := nullif(btrim(coalesce(p->>'state','')), '');
  v_own uuid;
  v_by  uuid;
  v_st  text;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 문의인지 알 수 없습니다'; end if;
  if v_to not in ('accepted','rejected','canceled') then
    raise exception '옮길 수 없는 상태입니다';
  end if;

  select a.by_user, a.state, l.by_user into v_by, v_st, v_own
    from listingask a join listing l on l.id = a.listing_id
   where a.id = v_id for update;
  if v_st is null then raise exception '그런 문의가 없습니다'; end if;
  if v_st <> 'asked' then raise exception '이미 처리된 문의입니다'; end if;

  -- ⚠️⚠️ **누가 무엇을 할 수 있는지 갈라 둡니다.** 거두는 것은 문의한
  --   분만, 받고 · 거절하는 것은 파는 분만입니다 — 섞으면 파는 분이
  --   남의 문의를 "거둔" 것으로 기록됩니다.
  if v_to = 'canceled' then
    if not coalesce(v_by = v_uid, false) then
      raise exception '문의하신 분만 거두실 수 있습니다';
    end if;
  else
    if not coalesce(v_own = v_uid, false) then
      raise exception '올리신 분만 받거나 거절하실 수 있습니다';
    end if;
  end if;

  update listingask set state = v_to where id = v_id;
  return v_to;
end $$;
revoke all on function move_listingask(jsonb) from public;
grant execute on function move_listingask(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑨ 문 — 매물을 내립니다 (팔렸거나 그만두거나)
--   ⚠️ **지우지 않고 내립니다** — 지우면 문의하신 분 화면에서 그 줄이
--   통째로 사라져 무슨 일인지 알 수 없습니다 (후기를 가리는 그 까닭).
-- ════════════════════════════════════════════════════════════════════
create or replace function close_listing(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_to  text := coalesce(nullif(btrim(coalesce(p->>'state','')), ''), 'closed');
  v_own uuid;
  v_st  text;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 매물인지 알 수 없습니다'; end if;
  if v_to not in ('done','closed') then
    raise exception '옮길 수 없는 상태입니다';
  end if;

  select by_user, state into v_own, v_st from listing where id = v_id for update;
  if v_st is null then raise exception '그런 매물이 없습니다'; end if;
  if not coalesce(v_own = v_uid, false) then
    raise exception '올리신 분만 내리실 수 있습니다';
  end if;
  -- ⚠️⚠️ **가려진 것은 글쓴이가 못 되돌립니다** (운영자가 가린 것입니다)
  if v_st = 'hidden' then
    raise exception '운영자가 가린 매물입니다 — 고객센터로 문의해 주세요';
  end if;
  if v_st <> 'open' then raise exception '이미 내려간 매물입니다'; end if;

  update listing set state = v_to, updated_at = now() where id = v_id;
  return v_to;
end $$;
revoke all on function close_listing(jsonb) from public;
grant execute on function close_listing(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑩ 문 — 연락처를 **각자 제 것만** 엽니다 (제17조 제2항)
--   ⚠️⚠️⚠️ 수락만으로는 열리지 않습니다. 그리고 **언제든 닫습니다**
--   (철회권). 한쪽만 열어도 그쪽 것만 갑니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function share_listingcontact(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_on  boolean := coalesce((p->>'on')::boolean, true);
  v_own uuid;
  v_by  uuid;
  v_st  text;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 문의인지 알 수 없습니다'; end if;
  -- ⚠️ **여는 쪽만** 동의 시각을 받습니다 (닫는 것은 철회라 동의가
  --   필요 없습니다 — 닫을 때도 요구하면 철회를 막는 꼴입니다)
  if v_on then
    if p->>'agree_at' is null then
      raise exception '연락처 제공 동의가 필요합니다';
    end if;
    if (p->>'agree_at')::timestamptz > now() + interval '5 minutes'
       or (p->>'agree_at')::timestamptz < now() - interval '1 day' then
      raise exception '동의 시각이 올바르지 않습니다';
    end if;
  end if;

  select a.by_user, a.state, l.by_user into v_by, v_st, v_own
    from listingask a join listing l on l.id = a.listing_id
   where a.id = v_id;
  if v_st is null then raise exception '그런 문의가 없습니다'; end if;
  if v_st <> 'accepted' then
    raise exception '받아들인 뒤에 고르실 수 있습니다';
  end if;

  if coalesce(v_own = v_uid, false) then
    update listingask
       set seller_share_at = case when v_on then now() else null end
     where id = v_id;
    return case when v_on then 'seller_shared' else 'seller_hidden' end;
  elsif coalesce(v_by = v_uid, false) then
    update listingask
       set buyer_share_at = case when v_on then now() else null end
     where id = v_id;
    return case when v_on then 'buyer_shared' else 'buyer_hidden' end;
  end if;
  raise exception '이 문의와 관계가 없습니다';
end $$;
revoke all on function share_listingcontact(jsonb) from public;
grant execute on function share_listingcontact(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑪ 문 — 운영자가 가립니다 (0049 와 같은 꼴)
--   ⚠️ 글쓴이가 내리는 길(`close_listing`)과 **다른 일**이라 문을
--   갈라 둡니다 (내린 것은 글쓴이의 뜻, 가린 것은 운영자의 판단).
-- ════════════════════════════════════════════════════════════════════
create or replace function move_listing(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_to  text := nullif(btrim(coalesce(p->>'state','')), '');
  v_why text := nullif(btrim(coalesce(p->>'why','')), '');
  v_st  text;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 매물인지 알 수 없습니다'; end if;
  if v_to <> 'hidden' then raise exception '옮길 수 없는 상태입니다'; end if;
  if not coalesce(my_role() in ('staff','admin'), false) then
    raise exception '가리는 것은 운영자만 할 수 있습니다';
  end if;
  -- ⚠️⚠️ 까닭을 **반드시** 받습니다 — 까닭 없이 가릴 수 있으면 불평이
  --   올 때마다 지워 주는 자리가 됩니다
  if v_why is null or char_length(v_why) < 5 then
    raise exception '가리는 까닭을 다섯 글자 이상 적어 주세요';
  end if;

  select state into v_st from listing where id = v_id for update;
  if v_st is null then raise exception '그런 매물이 없습니다'; end if;
  if v_st = 'hidden' then raise exception '이미 가려진 매물입니다'; end if;

  update listing set state = 'hidden', hidden_why = v_why,
                     hidden_by = v_uid, hidden_at = now(), updated_at = now()
   where id = v_id;

  -- ⚠️ 감사 기록에 **본문을 넣지 않습니다** (오래 남고 보는 사람도 넓습니다)
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, data)
  values (v_uid, my_role(), 'listing', v_id::text, v_st, 'hidden',
          jsonb_build_object('why_len', char_length(v_why)));
  return 'hidden';
end $$;
revoke all on function move_listing(jsonb) from public;
grant execute on function move_listing(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑫ 신고 — **새 표를 만들지 않고** `report` 에 칸을 더합니다 (0046 · 0048)
--   ⚠️⚠️ `open_report` 를 **0048 → 0056 으로 갈아 끼웁니다** — 0048 을
--   다시 붙여 넣으면 이 줄이 조용히 내려갑니다
--   (`tools/check-chains.js` 가 그 짝을 셉니다 — 거기 목록도 같이 고쳤습니다).
--   ⚠️⚠️⚠️ 본문을 **0048 에서 그대로 꺼내** 네 군데만 끼웠습니다. 손으로
--   다시 쓰면 0040 이 하던 일(분쟁 당사자 확인 · 중복 막기 · 감사 기록에
--   본문 안 넣기)이 조용히 사라집니다 — 0045 에서 `make_apply` 를 다시
--   쓰다 신청번호 꼴과 중복 막음을 날린 적이 있습니다.
--   ⚠️ 그리고 `/admin` 의 `js/adminrep.js` 가 **읽는 목록도 같이** 늘려야
--   합니다 (안 늘리면 운영자 화면에 아무것도 안 적히고 에러도 없습니다).
-- ════════════════════════════════════════════════════════════════════
alter table report add column if not exists listing_id uuid
  references listing(id) on delete cascade;
alter table report drop constraint if exists report_target_ck;
alter table report add  constraint report_target_ck check (
  request_id is not null or provider_id is not null
  or review_id is not null or joinroom_id is not null
  or cq_id is not null or ca_id is not null or jobpost_id is not null
  or listing_id is not null);

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
  -- ⚠️ 0048 — 구인 · 구직 · 제휴 글도 신고할 수 있습니다
  v_jp   uuid := nullif(btrim(coalesce(p->>'jobpost', '')), '')::uuid;
  -- ⚠️ 0056 — 중고 직거래 매물도 신고할 수 있습니다
  v_ls   uuid := nullif(btrim(coalesce(p->>'listing', '')), '')::uuid;
  v_body text := btrim(coalesce(p->>'body', ''));
  v_id   uuid;
  v_dup  int;
begin
  if v_me is null then raise exception '신고는 로그인한 뒤에 하실 수 있습니다'; end if;
  if v_kind not in ('abuse','dispute') then
    raise exception '신고 · 분쟁 중 하나로 적어 주세요';
  end if;
  if v_req is null and v_pv is null and v_rv is null and v_jr is null
     and v_cq is null and v_ca is null and v_jp is null and v_ls is null then
    raise exception '무엇에 대한 것인지 적어 주세요 (요청 · 업체 · 후기 · 조인 · 글 · 매물 가운데 하나)';
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
     and ca_id is not distinct from v_ca
     and jobpost_id is not distinct from v_jp
     and listing_id is not distinct from v_ls;
  if v_dup > 0 then
    raise exception '같은 건으로 이미 접수된 것이 있습니다 — 운영자가 보고 있습니다';
  end if;

  insert into report (kind, request_id, provider_id, review_id, joinroom_id,
                      cq_id, ca_id, jobpost_id, listing_id, by_user, body)
  values (v_kind, v_req, v_pv, v_rv, v_jr, v_cq, v_ca, v_jp, v_ls, v_me, v_body)
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

-- ════════════════════════════════════════════════════════════════════
-- ⑬ 알림 (0050) — ⚠️⚠️ **밖으로 안 보냅니다.** 화면에서만 알립니다.
--   ⚠️ 알림에 **본문을 담지 않습니다** (제목과 가는 자리까지) — 담으면
--   손님 글이 한 벌 더 복사되고, 그 안에 연락처가 있으면 알림이 그것을
--   나르는 길이 됩니다.
--   ⚠️⚠️ 표와 문은 **0056**, 트리거는 **여기**입니다 — 마이그레이션을
--   걸치는 자리이므로 검사도 **걸쳐서** 재야 합니다 (0050 의 조인 신청
--   트리거를 줄째 빼도 `sql/notice.js` 가 초록이던 그 자리입니다).
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️ 0050 은 칸 안에 그냥 `check (kind in (...))` 로 적어 이름을
--   Postgres 가 지어 줍니다. 이름을 글자로 박으면 **다른 날 옛 제약이
--   그대로 남고** 새 갈래를 그것이 거절합니다 (에러는 트리거 안에서
--   조용히 나고 알림만 안 붙습니다). 그래서 **찾아서** 떼어 냅니다.
do $$ declare c record; begin
  for c in
    select conname from pg_constraint
     where conrelid = 'notice'::regclass and contype = 'c'
       and pg_get_constraintdef(oid) like '%kind%'
  loop
    execute format('alter table notice drop constraint %I', c.conname);
  end loop;
end $$;
alter table notice add constraint notice_kind_check check (kind in
  ('quote','jobapply','jobmoved','joinapply','joinmoved',
   'answer','hidden','inquiry','listingask','listingmoved'));

-- 내 매물에 문의가 들어왔습니다 → 파는 분에게
create or replace function notice_listingask() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_to uuid;
begin
  select l.by_user into v_to from listing l where l.id = new.listing_id;
  perform notify_one(v_to, 'listingask', '올리신 매물에 문의가 들어왔습니다',
                     '/my', 'listing', new.listing_id::text);
  return null;
end $$;
revoke all on function notice_listingask() from public;
drop trigger if exists notice_listingask_t on listingask;
create trigger notice_listingask_t after insert on listingask
  for each row execute function notice_listingask();

-- 문의가 처리되었습니다 → 문의하신 분에게
create or replace function notice_listingmoved() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.state = old.state or new.state not in ('accepted','rejected') then
    return null;
  end if;
  perform notify_one(new.by_user, 'listingmoved',
    case when new.state = 'accepted' then '매물 문의가 받아들여졌습니다'
         else '매물 문의가 거절되었습니다' end,
    '/my', 'listingask', new.id::text);
  return null;
end $$;
revoke all on function notice_listingmoved() from public;
drop trigger if exists notice_listingmoved_t on listingask;
create trigger notice_listingmoved_t after update of state on listingask
  for each row execute function notice_listingmoved();

-- 매물이 가려졌습니다 → 올리신 분에게
--   ⚠️ 갈래는 0050 의 `hidden` 을 그대로 씁니다 (가리는 것은 무엇이든
--   같은 말이라, 갈래를 늘리면 화면이 아이콘을 또 골라야 합니다)
create or replace function notice_hidden_listing() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.state = old.state or new.state <> 'hidden' then return null; end if;
  perform notify_one(new.by_user, 'hidden', '올리신 매물이 가려졌습니다',
                     '/my', 'listing', new.id::text);
  return null;
end $$;
revoke all on function notice_hidden_listing() from public;
drop trigger if exists notice_hidden_listing_t on listing;
create trigger notice_hidden_listing_t after update of state on listing
  for each row execute function notice_hidden_listing();

insert into schema_version (n, name) values (56, '0056_listing')
  on conflict (n) do nothing;

commit;

/* ---------------------------- 0057_provider_ident.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0057 — 입점업체의 **사업자 신원정보**를 손님이 볼 수 있게 합니다
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **왜 이것이 필요한가 — 전자상거래법 제20조 제2항.**
--   통신판매중개자는 중개의뢰자(입점업체)가 사업자인 경우 그 업체의
--   **상호 · 대표자 성명 · 주소 · 전화번호 · 전자우편주소 ·
--   사업자등록번호**를 손님이 볼 수 있게 해야 합니다 (시행령 제25조).
--   공정위가 2026 년에 당근마켓에 **시정명령 + 과태료**를 부과한 조항이
--   바로 이것입니다 ("플랫폼 내에서 판매하는 사업자의 신원 정보를
--   소비자에게 제공하지 않았다").
--
--   ⚠️ 그런데 `provider` 표에는 **상호(`name`) 하나**뿐이었습니다.
--   `/pro/<id>` 화면은 `사업자등록 확인` **배지만** 내고 번호는 안 냈고,
--   입점 신청(`provider_apply`)이 받아 둔 `brn` · `tel` 은 **운영자만**
--   읽는 표에 있어서 손님에게 닿는 길이 한 곳도 없었습니다.
--   업체가 0곳인 동안은 안 걸리고, **첫 업체를 승인하시는 날** 걸립니다.
--
-- ⚠️⚠️⚠️ **0013 의 `provider_contact` 와 혼동하지 마세요 — 반대입니다.**
--     이 표(0057) : 공개해야 하는 **사업자 정보**. 손님에게 보입니다.
--     provider_contact(0013) : **배정받을 때 쓰는 담당자 직통**.
--       운영자와 그 업체만 봅니다 — 손님에게는 정책이 아예 없습니다.
--   0013 이 "`provider` 는 `listed = true` 면 로그인한 누구나 읽어서,
--   거기 직통을 넣으면 손님 전부가 담당자 휴대폰을 본다" 고 적어 둔
--   그 까닭 그대로입니다. 공개해야 하는 것은 여기, 가려야 하는 것은
--   거기 — **표를 가른 선이 공개 여부**입니다.
--
-- ⚠️⚠️ **지어내지 않습니다** (절대 규칙 1 · 제10조와 같은 결).
--   다섯 칸 모두 비울 수 있고, 비면 화면에서 **그 줄이 통째로 빠집니다.**
--   `(미기재)` 를 찍지 않습니다. 대신 업체 화면이 "아직 안 적혔습니다 —
--   운영자에게 알려 주세요" 로 **막다른 길을 막습니다** (절대 규칙 2).
--
-- ⚠️⚠️⚠️ **사업자등록번호는 업체가 못 고칩니다 — 자물쇠 두 겹.**
--     ① 0001 의 칸 단위 GRANT
--        `grant update (name, intro, regions, gu, industries, subs,
--                       since, consult_hours) on provider`
--        에 새 칸이 **하나도 없습니다** (그래서 PostgREST 로는 다섯 칸
--        전부 못 만집니다 — 고치는 길은 아래 문 둘뿐입니다).
--     ② `provider_ident_guard` 트리거가 `brn` 을 관리자만 바꾸게 막습니다.
--   ⚠️ 왜 brn 만 더 막는가: `verified.brn`(확인 배지)이 **플랫폼이 서류를
--   본 결과**입니다. 업체가 번호를 바꿀 수 있으면 배지가 가리키는 번호와
--   실제 번호가 달라져서 **그 배지가 거짓**이 됩니다 (지어낸 신뢰).
--   ⚠️ `provider_guard()`(0001→0021→0024→0030)를 **덮어쓰지 않고 따로**
--   답니다 — 0038 이 `provider_state_guard` 를 따로 단 그 까닭입니다
--   (같은 자리에 두 번 적으면 앞 번호를 다시 붙여 넣는 날 둘이 같이
--   내려갑니다).
--
-- 되돌아갔는지 보는 법
--   select count(*) from information_schema.columns
--    where table_name = 'v_provider_card' and column_name = 'brn';   -- 1 이어야 합니다
--   select count(*) from pg_trigger where tgname = 'provider_ident_guard_t';
--   ⚠️⚠️ **0032 · 0038 · 0044 파일만 따로 다시 붙여 넣으면 보기의 칸
--   다섯이 조용히 사라집니다** (그 파일들은 옛 칸 목록으로 보기를 다시
--   만듭니다). 붙여넣기 파일을 통째로 쓰시면 0057 이 뒤에 와서 다시
--   만듭니다.
-- ════════════════════════════════════════════════════════════════════
begin;

-- ── ① 칸 다섯 ──────────────────────────────────────────────────────
-- ⚠️ 전부 nullable 입니다 — 못 받은 것을 지어내지 않습니다.
alter table provider add column if not exists ceo   text;  -- 대표자 성명
alter table provider add column if not exists addr  text;  -- 영업소 주소
alter table provider add column if not exists tel   text;  -- 공개 대표번호
alter table provider add column if not exists email text;  -- 공개 전자우편
alter table provider add column if not exists brn   text;  -- 사업자등록번호

comment on column provider.tel is
  '⚠️ 공개 대표번호입니다 (손님에게 보입니다). 배정 담당자 직통은 provider_contact(0013) 입니다.';
comment on column provider.brn is
  '⚠️ 사업자등록번호. 업체는 못 고칩니다 — verified.brn 배지가 가리키는 값입니다.';

-- ⚠️⚠️ **꼴을 한 가지로 못박습니다** (`###-##-#####`). 꼴이 둘이면
--   화면이 둘 다 그려야 하고, 그러면 같은 번호가 두 모양으로 보입니다.
--   ⚠️ 넣는 쪽(문)이 하이픈을 **붙여서** 저장합니다 — check 는 마지막
--   자물쇠이지 변환기가 아닙니다.
-- ⚠️ 이름을 **적어서** 만들고 **있는지 세어** 보고 답니다 — 0053 에서
--   "이름을 글자로 박으면 다른 날 옛 제약이 그대로 남는다" 를 겪었습니다.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'provider_brn_ck') then
    alter table provider add constraint provider_brn_ck
      check (brn is null or brn ~ '^[0-9]{3}-[0-9]{2}-[0-9]{5}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'provider_email_ck') then
    alter table provider add constraint provider_email_ck
      check (email is null or (email like '%@%.%' and length(email) <= 120));
  end if;
end $$;

-- ── ② 업체가 brn 을 못 바꾸게 (둘째 자물쇠) ────────────────────────
create or replace function provider_ident_guard() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if my_role() = 'admin' then return new; end if;
  -- ⚠️ `is distinct from` 을 씁니다 — `<>` 는 한쪽이 null 이면 **null** 이고
  --   `if null then` 은 안 걸립니다 (0034 의 취소 문에서 자물쇠가 통째로
  --   열렸던 그 자리입니다).
  if new.brn is distinct from old.brn then
    raise exception '사업자등록번호는 업체가 바꿀 수 없습니다 — 운영자가 서류를 보고 적습니다';
  end if;
  return new;
end $$;

revoke all on function provider_ident_guard() from public;

drop trigger if exists provider_ident_guard_t on provider;
create trigger provider_ident_guard_t
  before update on provider
  for each row execute function provider_ident_guard();

-- ── ③ 업체가 적는 길 — `save_provider_self` 에 넷을 더합니다 ───────
-- ⚠️⚠️⚠️ **보낸 것으로 통째로 덮어씁니다.** 그래서 화면(`js/deskme.js`)이
--   새 칸 넷을 **읽고 또 보내야** 합니다 — 안 보내면 저장할 때마다
--   조용히 비워집니다 (2026-11-05 에 `industries` 가 실제로 그랬습니다).
--   ⚠️ `test-desk` 가 이 `update provider set` 를 **읽어서** 칸을 세므로
--   빠뜨리면 검사가 멈춥니다. 검사는 **번호를 박지 않고** 가장 뒤에서
--   이 문을 덮은 파일을 찾습니다.
-- ⚠️ `brn` 은 **여기 없습니다** (②가 막습니다 · 머리말).
-- 체인: save_provider_self (0014 → 0023 → 0044 → **0057**)
create or replace function save_provider_self(
  p_data jsonb default '{}'::jsonb,
  p_why  text  default null
) returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_pv   text     := my_provider();
  v_scale text    := nullif(btrim(coalesce(p_data->>'scale','')), '');
  v_email text    := nullif(btrim(coalesce(p_data->>'email','')), '');
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if v_role <> 'provider' or v_pv is null then
    raise exception '업체 계정으로 로그인하셔야 합니다';
  end if;
  if not exists (select 1 from provider where id = v_pv) then
    raise exception '연결된 업체를 찾을 수 없습니다';
  end if;
  if v_scale is not null and v_scale not in ('small','mid','large') then
    raise exception '거래 규모는 small · mid · large 중 하나입니다 — %', v_scale;
  end if;
  if exists (
    select 1 from jsonb_array_elements_text(
      case when jsonb_typeof(p_data->'contactWays') = 'array'
           then p_data->'contactWays' else '[]'::jsonb end) as t(x)
     where btrim(x) not in ('phone','visit','online','shop'))
  then
    raise exception '상담 방식은 전화 · 방문 · 온라인 · 매장 중에서 고르셔야 합니다';
  end if;
  -- ⚠️ 적으셨으면 꼴을 봅니다 (비우는 것은 됩니다 — 지어내지 않습니다).
  --   ⚠️⚠️ **다른 말로 거절합니다** — check 와 같은 말로 거절하면 어느
  --   자물쇠가 막았는지 알 수 없습니다 (검사가 둘을 갈라 셉니다).
  if v_email is not null and v_email not like '%@%.%' then
    raise exception '이메일 꼴이 아닙니다 — %', v_email;
  end if;

  update provider set
    intro = nullif(btrim(coalesce(p_data->>'intro','')), ''),
    regions = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'regions','[]'::jsonb)) x), '{}'),
    gu = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'gu','[]'::jsonb)) x), '{}'),
    industries = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'industries','[]'::jsonb)) x), '{}'),
    since = nullif(p_data->>'since','')::int,
    consult_hours = nullif(btrim(coalesce(p_data->>'consultHours','')), ''),
    brands = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'brands','[]'::jsonb)) x), '{}'),
    scale = v_scale,
    ceo = nullif(btrim(coalesce(p_data->>'ceo','')), ''),
    addr = nullif(btrim(coalesce(p_data->>'addr','')), ''),
    tel = nullif(btrim(coalesce(p_data->>'tel','')), ''),
    email = v_email,
    contact_ways = coalesce((select array_agg(btrim(x))
      from jsonb_array_elements_text(
        case when jsonb_typeof(p_data->'contactWays') = 'array'
             then p_data->'contactWays' else '[]'::jsonb end) x), '{}')
  where id = v_pv;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'provider', v_pv, 'self-updated', p_why, p_data);

  return v_pv;
end $$;

revoke all on function save_provider_self(jsonb, text) from public;
grant execute on function save_provider_self(jsonb, text) to authenticated;

-- ── ④ 운영자가 적는 길 (전화로 받아 적는 자리 · brn 포함) ──────────
-- ⚠️ 0013 의 `save_provider_contact` 와 같은 꼴입니다 — 업체가 안 적으면
--   그 기능이 반쪽이라, 운영자도 적을 수 있게 둡니다.
-- ⚠️⚠️ **인자는 `jsonb` 하나입니다** (`{ p: {...} }`). 0013 · 0003 만
--   자리 인자이고 그것이 저장소에서 예외입니다 — 새 문은 꾸러미 하나.
-- ⚠️ 보낸 칸만 고칩니다 (`p ? '칸'`) — `save_provider_self` 처럼 통째로
--   덮으면 운영자가 전화로 번호 하나만 받아 적는 날 나머지가 지워집니다.
create or replace function set_provider_ident(p jsonb default '{}'::jsonb)
  returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_pv   text     := nullif(btrim(coalesce(p->>'provider','')), '');
  v_brn  text     := nullif(btrim(coalesce(p->>'brn','')), '');
  v_mail text     := nullif(btrim(coalesce(p->>'email','')), '');
  v_why  text     := nullif(btrim(coalesce(p->>'why','')), '');
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if v_role not in ('staff','admin') then
    raise exception '업체 신원정보는 운영자가 적습니다';
  end if;
  if v_pv is null then raise exception '어느 업체인지 알 수 없습니다'; end if;
  if not exists (select 1 from provider where id = v_pv) then
    raise exception '업체를 찾을 수 없습니다 — %', v_pv;
  end if;
  -- ⚠️⚠️ **까닭을 반드시 받습니다** — 손님에게 보이는 값이고 기록에
  --   남아야 합니다 (§8). 까닭 없이 바꿀 수 있으면 누가 왜 바꿨는지
  --   아무 데도 안 남습니다.
  if v_why is null then raise exception '무엇을 보고 적으셨는지 까닭을 적어 주세요'; end if;
  -- ⚠️⚠️⚠️ **사업자등록번호는 관리자만입니다 — 직원도 거절합니다.**
  --   번호를 적는 일과 `verified.brn`(확인 배지)을 켜는 일은 **같은
  --   서류를 보는 한 사람**이어야 합니다. 배지는 `provider_guard`(0030)가
  --   관리자만 켜게 막고 있으니, 번호도 같은 선이어야 둘이 어긋나지
  --   않습니다.
  --   ⚠️ ②의 트리거도 같은 것을 막지만 **말이 다릅니다** — 자물쇠마다
  --   다른 말로 거절해야 어느 쪽이 막았는지 알 수 있습니다 (작업 기억).
  --   ⚠️⚠️ 화면도 직원에게는 그 칸을 **내지 않습니다** (그리면 눌러도
  --   거절당하는 칸입니다 · 절대 규칙 5).
  if (p ? 'brn') and v_role <> 'admin' then
    raise exception '사업자등록번호는 관리자만 적을 수 있습니다';
  end if;

  -- ⚠️ 하이픈을 **붙여서** 저장합니다 (꼴이 한 가지여야 화면이 하나만
  --   그립니다). 숫자 열 자리만 오면 여기서 꼴을 만듭니다.
  if v_brn is not null then
    v_brn := regexp_replace(v_brn, '[^0-9]', '', 'g');
    if length(v_brn) <> 10 then
      raise exception '사업자등록번호는 숫자 열 자리입니다 — %', p->>'brn';
    end if;
    v_brn := substr(v_brn,1,3) || '-' || substr(v_brn,4,2) || '-' || substr(v_brn,6,5);
  end if;
  if v_mail is not null and v_mail not like '%@%.%' then
    raise exception '이메일 꼴이 아닙니다 — %', v_mail;
  end if;

  update provider set
    ceo   = case when p ? 'ceo'   then nullif(btrim(coalesce(p->>'ceo','')),   '') else ceo   end,
    addr  = case when p ? 'addr'  then nullif(btrim(coalesce(p->>'addr','')),  '') else addr  end,
    tel   = case when p ? 'tel'   then nullif(btrim(coalesce(p->>'tel','')),   '') else tel   end,
    email = case when p ? 'email' then v_mail else email end,
    brn   = case when p ? 'brn'   then v_brn  else brn   end
  where id = v_pv;

  -- ⚠️⚠️ 기록에 **값을 담지 않습니다** — 대표자 성함이 들어갑니다.
  --   `audit_log` 는 오래 남고 보는 사람도 넓습니다 (작업 기억).
  --   무엇을 고쳤는지는 **칸 이름**으로 남깁니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'provider', v_pv, 'ident-updated', v_why,
          jsonb_build_object('fields',
            (select coalesce(jsonb_agg(k), '[]'::jsonb)
               from jsonb_object_keys(p) k
              where k in ('ceo','addr','tel','email','brn'))));

  return v_pv;
end $$;

revoke all on function set_provider_ident(jsonb) from public;
grant execute on function set_provider_ident(jsonb) to authenticated;

-- ── ⑤ 공개 보기에 칸 다섯을 더합니다 ───────────────────────────────
-- ⚠️⚠️⚠️ **안 더하면 손님에게 영원히 안 보입니다** — 에러 한 줄 없이.
--   `provider` 표는 anon 에게 열려 있지 않습니다 (0032 가 일부러 그렇게
--   두었습니다). 손님 · 크롤러에게 가는 길은 이 보기 하나이고,
--   `tools/pull-providers.js` 가 이것을 읽어 빌드가 HTML 에 찍습니다.
-- ⚠️⚠️ **`create or replace` 로는 칸을 못 늘립니다** — Postgres 가
--   "cannot change number of columns" 으로 거절합니다. 지우고 다시
--   만들고, **GRANT 를 바로 다시 줍니다** (지우면 권한도 날아가서,
--   안 주면 그날부터 `pull-providers` 가 permission denied 입니다).
-- 체인: v_provider_card (0032 → 0038 → 0044 → **0057**)
drop view if exists v_provider_card;
create view v_provider_card as
  select p.id, p.name, p.intro, p.regions, p.gu, p.subs, p.since,
         p.consult_hours, p.verified, p.brands, p.scale, p.contact_ways,
         -- ⚠️ 0057 이 더한 다섯 (제20조 제2항 · 시행령 제25조)
         p.ceo, p.addr, p.tel, p.email, p.brn,
         p.is_test
    from provider p
   where p.listed = true
     and p.is_test = false
     and p.state = 'approved';

grant select on v_provider_card to anon, authenticated;

insert into schema_version (n, name) values (57, '0057_provider_ident')
  on conflict (n) do nothing;

commit;

/* ---------------------------- 0058_watch.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0058 — **조건을 저장해 두면 맞는 글이 올라올 때 알립니다**
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️ **왜 이것이 필요한가.** 업체가 0곳이어도 되는 넷(조인 0046 ·
--   중고 직거래 0056 · 커뮤니티 0047 · 구인구직 0048) 가운데 셋은
--   **글이 올라오는 자리**입니다. 그런데 지금은 손님이 그 글을 보려면
--   **직접 들어와서 거르개를 눌러야** 합니다 — "서울 · 주말 · 15만원
--   이하 조인" 을 기다리는 분은 하루에 몇 번씩 들어와 봐야 합니다.
--   경쟁 서비스의 '예약매니저' 가 바로 그 자리입니다.
--
-- ⚠️⚠️⚠️ **밖으로 안 보냅니다 — 0050 의 내부 알림만 씁니다.**
--   문자 · 카톡 · 메일을 붙이면 ① 정보통신망법 제50조(광고 표기 ·
--   수신거부 · 21시~08시 금지) ② 발송사가 **수탁자**가 되어 방침에
--   적어야 함(제26조) ③ 환경변수가 늘고 비면 조용히 안 보내짐, 셋이
--   같이 움직입니다. 그래서 **알림 종이 한 장**만 꽂습니다.
--
-- ⚠️⚠️ **알림에 본문을 담지 않습니다** (0050 에 본문 칸이 아예 없는 그
--   까닭). 제목과 가는 자리까지입니다 — 담으면 남의 글이 한 벌 더
--   복사되고 그 안에 연락처가 있으면 알림이 그것을 나르는 길이 됩니다.
--
-- ⚠️⚠️⚠️ **제 글은 제게 안 알립니다.** `notify_one`(0050)이 이미
--   `p_to = auth.uid()` 를 보고 끝냅니다 — 여기서 또 거르지 않습니다
--   (같은 규칙을 두 곳에 적으면 한쪽만 고치는 날 어긋납니다).
--
-- ⚠️⚠️ **조건에 사람 정보를 담지 않습니다.** 지역 · 하위분류 · 값 ·
--   택배 여부 · 부킹 여부뿐입니다. 연락처를 담으면 "알림을 보내려고"
--   연락처를 또 받는 꼴이 되고, 그러면 ③의 길로 들어섭니다.
--
-- ⚠️ **갯수를 막습니다** (갈래마다 열 개). 수백 개를 저장하면 글 하나가
--   올라올 때마다 트리거가 수백 줄을 훑습니다 — 그리고 알림 목록이
--   쓸모없어집니다.
--
-- ⚠️⚠️ **같은 조건을 두 번 저장할 수 없습니다** (unique 인덱스). 두 벌이
--   있으면 글 하나에 알림이 두 장 꽂힙니다. ⚠️ `notify_one` 의 "안 읽은
--   같은 알림은 더 안 쌓습니다" 가 그것을 가려 주지만, 그건 **읽은 뒤에**
--   다시 쌓입니다 — 가려 주는 것에 기대지 않고 애초에 막습니다.
--
-- 되돌아갔는지 보는 법
--   select count(*) from pg_trigger where tgname like 'watch_%_t';   -- 3 이어야 합니다
--   select count(*) from pg_constraint where conname = 'notice_kind_check'
--    and pg_get_constraintdef(oid) like '%watch%';                   -- 1 이어야 합니다
--   ⚠️⚠️ **0050 · 0056 파일만 따로 다시 붙여 넣으면 `watch` 갈래가
--   제약에서 빠집니다** — 그러면 트리거 안에서 조용히 에러가 나고
--   **알림만 안 붙습니다**(0053 에서 적어 둔 그 자리). 붙여넣기 파일을
--   통째로 쓰시면 0058 이 뒤에 와서 다시 넣습니다.
-- ════════════════════════════════════════════════════════════════════
begin;

-- ── ① 표 ───────────────────────────────────────────────────────────
create table if not exists watch (
  id         uuid primary key default gen_random_uuid(),
  by_user    uuid not null references auth.users(id) on delete cascade,
  -- ⚠️ 갈래 셋. 말은 `js/data/deal.js` 한 곳이고 `check-deal` 이 이
  --    check 와 빌드마다 맞춰 봅니다 (조인은 `js/myjoin.js` 안에 말을
  --    들고 있어서 아무도 DB 와 안 맞춰 보다가 영문 키가 찍혔습니다).
  kind       text not null check (kind in ('join','listing','job')),
  -- ⚠️⚠️ 하위분류 — **조인에는 없습니다**(`joinroom` 에 하위 칸이
  --    없습니다). 중고는 물건 종류, 인력은 하는 일입니다.
  sub        text check (sub is null or btrim(sub) <> ''),
  region     text check (region is null or btrim(region) <> ''),
  -- ⚠️ 값은 **이 금액 이하**입니다. 중고는 매물 값, 조인은 예상 비용.
  --    ⚠️⚠️ 0 을 쓸 수 있어야 합니다 — 중고의 0 은 **무료로 나눔**입니다
  --    (그래서 세는 자리마다 `||` 를 쓰면 0원이 사라집니다).
  max_price  int  check (max_price is null or max_price between 0 and 100000000),
  -- ⚠️ 켜 두면 그 조건인 글만, 꺼 두면 가리지 않습니다 (null 과 false 를
  --    가르지 않습니다 — 둘 다 "안 가림" 입니다).
  ship       boolean not null default false,   -- 중고: 택배 되는 것만
  booked     boolean not null default false,   -- 조인: 부킹 잡힌 자리만
  created_at timestamptz not null default now()
);

create index if not exists watch_kind_idx on watch (kind, region);
create index if not exists watch_mine_idx on watch (by_user, created_at desc);

-- ⚠️⚠️ **같은 조건을 두 번 저장할 수 없습니다.** null 을 그대로 두면
--   unique 가 걸리지 않으므로(null 은 서로 다릅니다) 땅에 내려놓고 셉니다.
create unique index if not exists watch_same_idx on watch (
  by_user, kind, coalesce(sub,''), coalesce(region,''),
  coalesce(max_price, -1), ship, booked);

alter table watch enable row level security;

-- ⚠️ 제 것만 봅니다. 남의 조건을 볼 까닭이 없습니다 — 운영자 정책도
--   두지 않습니다 (0050 의 알림과 같은 결입니다).
drop policy if exists watch_mine on watch;
create policy watch_mine on watch
  for select using (by_user = auth.uid());

-- ⚠️⚠️ **쓰기 GRANT 를 주지 않습니다** — 들어오는 길은 아래 문 둘뿐입니다.
grant select on watch to authenticated;

-- ── ② 문 — 저장하기 ───────────────────────────────────────────────
-- ⚠️ 인자는 꾸러미 하나(`{ p: {...} }`)입니다.
create or replace function save_watch(p jsonb default '{}'::jsonb)
  returns uuid
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_kind text := nullif(btrim(coalesce(p->>'kind','')), '');
  v_sub  text := nullif(btrim(coalesce(p->>'sub','')), '');
  v_rg   text := nullif(btrim(coalesce(p->>'region','')), '');
  v_mp   int;
  v_ship boolean := coalesce((p->>'ship')::boolean, false);
  v_bk   boolean := coalesce((p->>'booked')::boolean, false);
  v_n    int;
  v_id   uuid;
begin
  if v_me is null then raise exception '로그인하셔야 조건을 저장할 수 있습니다'; end if;
  if v_kind is null or v_kind not in ('join','listing','job') then
    raise exception '어느 자리의 조건인지 골라 주세요';
  end if;
  -- ⚠️⚠️ **0 과 "안 적음" 을 가릅니다.** `(p->>'maxPrice')::int` 는 빈
  --   글자에서 터지고, `coalesce(…, 0)` 은 "안 적음" 을 0원으로 바꿉니다
  --   (0 은 무료로 나눔이라 **뜻이 다릅니다**).
  if p ? 'maxPrice' and nullif(btrim(coalesce(p->>'maxPrice','')), '') is not null then
    begin
      v_mp := (btrim(p->>'maxPrice'))::int;
    exception when others then
      raise exception '금액은 숫자로 적어 주세요 — %', p->>'maxPrice';
    end;
    if v_mp < 0 or v_mp > 100000000 then
      raise exception '금액이 범위를 벗어났습니다';
    end if;
  end if;
  -- ⚠️⚠️ 조인에는 하위분류가 없습니다 — 받아 두면 **영원히 안 걸리는
  --   조건**이 됩니다(글에 그 칸이 없으므로). 조용히 버리지 않고 거절합니다.
  if v_kind = 'join' and v_sub is not null then
    raise exception '조인은 하위분류로 좁힐 수 없습니다';
  end if;
  -- ⚠️ 켜 봐야 아무것도 안 걸리는 조건도 막습니다 (눌러도 아무 일이 안
  --   나는 칸과 같은 자리입니다 · 절대 규칙 5).
  if v_ship and v_kind <> 'listing' then
    raise exception '택배 여부는 중고 직거래에서만 고를 수 있습니다';
  end if;
  if v_bk and v_kind <> 'join' then
    raise exception '부킹 여부는 조인에서만 고를 수 있습니다';
  end if;

  -- ⚠️ 갈래마다 열 개까지입니다
  select count(*) into v_n from watch where by_user = v_me and kind = v_kind;
  if v_n >= 10 then
    raise exception '저장한 조건이 이미 열 개입니다 — 쓰지 않는 것을 지워 주세요';
  end if;

  insert into watch (by_user, kind, sub, region, max_price, ship, booked)
  values (v_me, v_kind, v_sub, v_rg, v_mp, v_ship, v_bk)
  -- ⚠️⚠️ 같은 조건이면 **조용히 그 줄을 돌려줍니다** — 거절하면 손님은
  --   "저장이 안 됐다" 로 읽습니다. 이미 저장되어 있는 것이 맞습니다.
  on conflict (by_user, kind, coalesce(sub,''), coalesce(region,''),
               coalesce(max_price, -1), ship, booked)
  do update set created_at = watch.created_at
  returning id into v_id;

  return v_id;
end $$;

revoke all on function save_watch(jsonb) from public;
grant execute on function save_watch(jsonb) to authenticated;

-- ── ③ 문 — 지우기 ─────────────────────────────────────────────────
-- ⚠️ 가리지 않고 **지웁니다.** 손님이 올린 **글**은 가리지만(0047 ·
--   0056), 이것은 그분의 **설정**입니다 — 끄는 길과 지우는 길을 둘로
--   두면 화면에 단추가 둘이 되고 둘의 뜻을 설명해야 합니다.
create or replace function drop_watch(p jsonb default '{}'::jsonb)
  returns int
  language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_id uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_n  int;
begin
  if v_me is null then raise exception '로그인하셔야 합니다'; end if;
  if v_id is null then raise exception '어느 조건인지 알 수 없습니다'; end if;
  delete from watch where id = v_id and by_user = v_me;
  get diagnostics v_n = row_count;
  -- ⚠️⚠️ **0줄이면 거절합니다.** 조용히 끝내면 화면은 "지웠다" 고
  --   말하는데 아무 일도 안 일어난 것입니다 (0054 에서 적어 둔 그 자리 ·
  --   RLS 가 UPDATE 에서 에러를 안 내는 결과 같습니다).
  if v_n = 0 then raise exception '그 조건을 찾을 수 없습니다'; end if;
  return v_n;
end $$;

revoke all on function drop_watch(jsonb) from public;
grant execute on function drop_watch(jsonb) to authenticated;

-- ── ④ 알림 갈래를 늘립니다 ─────────────────────────────────────────
-- ⚠️⚠️ 0050 은 칸 안에 그냥 `check (kind in (...))` 로 적어 이름을
--   Postgres 가 지어 줍니다. 이름을 글자로 박으면 다른 날 옛 제약이
--   그대로 남고 새 갈래를 그것이 거절합니다 — **찾아서** 떼어 냅니다.
do $$ declare c record; begin
  for c in
    select conname from pg_constraint
     where conrelid = 'notice'::regclass and contype = 'c'
       and pg_get_constraintdef(oid) like '%kind%'
  loop
    execute format('alter table notice drop constraint %I', c.conname);
  end loop;
end $$;
alter table notice add constraint notice_kind_check check (kind in
  ('quote','jobapply','jobmoved','joinapply','joinmoved',
   'answer','hidden','inquiry','listingask','listingmoved','watch'));

-- ── ⑤ 트리거 셋 ───────────────────────────────────────────────────
-- ⚠️⚠️⚠️ **`notify_one` 을 씁니다** — 거기에 ① 받을 사람이 없으면 끝 ②
--   제가 한 일은 제게 안 알림 ③ 안 읽은 같은 알림은 더 안 쌓음이 들어
--   있습니다. 여기서 다시 적으면 한쪽만 고치는 날 어긋납니다.
-- ⚠️ 가는 자리는 **우리 주소만**(`/` 로 시작 · `//` 아님 — 열린
--   넘겨주기를 막습니다. 표의 check 가 그것을 다시 봅니다).

-- 조인이 하나 열렸습니다 → 조건을 저장해 두신 분들에게
create or replace function watch_join() returns trigger
language plpgsql security definer set search_path = public as $$
declare w record;
begin
  -- ⚠️ 열린 자리만 알립니다 (닫힌 · 가려진 자리를 알리면 눌러 가서
  --    아무것도 못 봅니다 · 절대 규칙 5).
  if new.state <> 'open' then return null; end if;
  for w in
    select id, by_user from watch
     where kind = 'join'
       and (region is null or region = new.region)
       and (booked = false or new.booked)
       -- ⚠️⚠️ 예상 비용을 **안 적은 자리**는 금액 조건이 있는 분께
       --    안 알립니다 — 모르는 값을 "싸다" 로 읽지 않습니다.
       and (max_price is null or (new.budget is not null and new.budget <= max_price))
  loop
    perform notify_one(w.by_user, 'watch',
      '저장하신 조건에 맞는 조인이 열렸습니다',
      '/cat/matchup', 'joinroom', new.id::text);
  end loop;
  return null;
end $$;
revoke all on function watch_join() from public;
drop trigger if exists watch_join_t on joinroom;
create trigger watch_join_t after insert on joinroom
  for each row execute function watch_join();

-- 매물이 하나 올라왔습니다 → 조건을 저장해 두신 분들에게
create or replace function watch_listing() returns trigger
language plpgsql security definer set search_path = public as $$
declare w record;
begin
  if new.state <> 'open' then return null; end if;
  for w in
    select id, by_user from watch
     where kind = 'listing'
       and (sub is null or sub = new.sub)
       and (region is null or region = new.region)
       and (ship = false or new.ship)
       -- ⚠️ `listing.price` 는 **not null** 입니다 (0056 — 비우면 화면이
       --    "협의" 를 지어 적습니다). 그래서 모르는 값이 없습니다.
       and (max_price is null or new.price <= max_price)
  loop
    perform notify_one(w.by_user, 'watch',
      '저장하신 조건에 맞는 매물이 올라왔습니다',
      '/cat/used', 'listing', new.id::text);
  end loop;
  return null;
end $$;
revoke all on function watch_listing() from public;
drop trigger if exists watch_listing_t on listing;
create trigger watch_listing_t after insert on listing
  for each row execute function watch_listing();

-- 구인 · 구직 · 제휴 글이 하나 올라왔습니다
create or replace function watch_job() returns trigger
language plpgsql security definer set search_path = public as $$
declare w record;
begin
  if new.state <> 'open' then return null; end if;
  for w in
    select id, by_user from watch
     where kind = 'job'
       and (sub is null or sub = new.sub)
       and (region is null or region = new.region)
       -- ⚠️ 급여(`pay`)는 **글자**입니다 (0048 — "협의" 를 우리가 지어
       --    적지 않으려고 비울 수 있게 두었습니다). 숫자로 견줄 수 없으니
       --    금액 조건이 있는 분께는 **안 알립니다** — 지어내 견주지 않습니다.
       and max_price is null
  loop
    perform notify_one(w.by_user, 'watch',
      '저장하신 조건에 맞는 구인 · 구직 글이 올라왔습니다',
      '/cat/career', 'jobpost', new.id::text);
  end loop;
  return null;
end $$;
revoke all on function watch_job() from public;
drop trigger if exists watch_job_t on jobpost;
create trigger watch_job_t after insert on jobpost
  for each row execute function watch_job();

insert into schema_version (n, name) values (58, '0058_watch')
  on conflict (n) do nothing;

commit;

/* ---------------------------- 0059_board.sql ---------------------------- */
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
