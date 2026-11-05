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
