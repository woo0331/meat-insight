-- ════════════════════════════════════════════════════════════════════
-- 0060 — 티타임 **공급** (업체가 올리는 남는 자리 · 손님이 예약 신청)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **2026-11-06 까지 티타임을 담는 표가 한 줄도 없었습니다.**
--   `/cat/booking` 은 "업체를 찾아 상담" 하는 자리였고, 메인에 부킹
--   현황표를 그리려 해도 **셀 자료가 아예 없었습니다**. 지시서가 요구한
--   "날짜 · 지역별 현황" 의 부킹 숫자는 그래서 전부 0 이었습니다.
--   이 파일이 그 공급을 세웁니다.
--
-- ⚠️⚠️⚠️ **'예약 완료' 를 만들지 않습니다.** 업체가 확인하기 전까지는
--   **'예약 신청'** 입니다 (지시서 §6). 상태는
--   `applied → confirmed` · `rejected` · `canceled` 이고, 손님 화면이
--   확정 전에 "완료" 라고 적으면 절대 규칙 5 입니다.
--   ⚠️ 우리는 **결제를 받지 않습니다** — 그래서 "안전거래" 도 "에스크로"
--   도 없습니다. 대금을 받기 시작하는 날 전자상거래법 제20조의3 이
--   걸립니다 (업체가 안 지킨 의무를 **우리가 대신 이행**).
--
-- ⚠️⚠️⚠️ **회원 조인(0046)과 같은 표에 담지 않습니다.** 전자상거래법
--   제20조의4 ③ 이 "개인 판매자와 사업자가 섞여 있으면 **구분해 표시**"
--   하라고 합니다. 업체 자리는 **사업자**가 내놓는 것이고 회원 조인은
--   **개인끼리**입니다 — 표를 가르고 화면도 갈라서 냅니다.
--
-- ⚠️⚠️⚠️ **연락처가 업체에 갑니다 — 그 자리에서 상호를 보여 주고
--   받습니다** (개인정보보호법 제17조 제2항). 조인 · 중고는 "각자 제
--   것만 따로 열기" 였지만, 예약은 **업체가 전화를 해야 성립**합니다.
--   누구에게 주는지가 **이미 정해져 있으므로** 그 자리의 동의가 제2항을
--   만족합니다 (뭉뚱그린 동의가 아닙니다). `agree3rd_at` 이 **not null**
--   인 까닭이 그것입니다.
--
-- ⚠️⚠️ **공개하는 번호와 가리는 번호를 섞지 않습니다.**
--     공개  provider.tel        사업자 전화번호 — 제20조 제2항이 보이라고 한 값 (0057)
--     공개  teetime.tel         업체가 **공개를 고르고 적는** 예약 문의 번호
--     비공개 provider_contact   배정 담당자 직통 — **운영자와 그 업체만** (0013)
--   0013 이 그 직통을 `provider` 표에 **일부러 안 넣은** 까닭이
--   "거기 넣으면 손님 전부가 담당자 휴대폰을 봅니다" 입니다. 여기서
--   그것을 끌어오면 그 선이 한 번에 무너집니다.
--
-- ⚠️⚠️ **가리는 상태(`hidden`)를 처음부터 넣습니다.** 0046 은 신고만
--   받고 내릴 길이 없어 0049 를 따로 만들어야 했습니다.
--
-- ⚠️ **승인된 업체만 · 정지되면 그 순간 빠집니다** — 보기가 **읽을 때
--   다시** 상태를 봅니다 (0055 가 광고에 적용한 그 규칙. 조건은 공개
--   카드 보기 `v_provider_card` 와 **같은 셋**입니다).
--
-- ⚠️ **날짜는 Asia/Seoul 입니다.** Supabase 는 UTC 라 `current_date` 로
--   재면 한국 시각 자정~아침 9시 사이에 **하루가 밀립니다**. 이 파일은
--   `kst_today()` 하나를 두고 모두가 그것을 부릅니다 — 그리고 0046 의
--   `v_join_open` 이 그 고장을 그대로 들고 있어서 **같이 고칩니다**.
--
-- 되돌아갔는지 보는 법
--   select 1 from pg_proc where proname = 'book_teetime';            -- 있어야
--   select pg_get_viewdef('v_join_open'::regclass) ilike '%kst_today%';  -- t 여야
--   select pg_get_viewdef('v_teebook_pv'::regclass) ilike '%tel%';   -- t 여야
--   select count(*) from pg_trigger where tgname like 'notice_tee%';  -- 2
-- ════════════════════════════════════════════════════════════════════
begin;

-- ── ⓪ 한국 날짜 ────────────────────────────────────────────────────
-- ⚠️⚠️ 세는 자리가 여럿이라 **함수 하나**로 둡니다. 두 곳에 적으면
--   한쪽만 고치는 날 목록과 현황표가 다른 날을 말합니다.
create or replace function kst_today() returns date
  language sql stable set search_path = public as $$
  select (now() at time zone 'Asia/Seoul')::date
$$;
revoke all on function kst_today() from public;
grant execute on function kst_today() to anon, authenticated;

-- ⚠️⚠️⚠️ **0046 의 보기가 `current_date`(UTC)를 쓰고 있었습니다** —
--   한국 시각 00:00~09:00 사이에는 UTC 가 아직 어제라, **어제 날짜 조인이
--   아직 열린 것으로** 보였습니다. 체인: v_join_open 보기 (0046 → 0060)
drop view if exists v_join_open;
create view v_join_open as
  select r.id, r.region, r.play_at, r.title, r.body, r.course, r.booked,
         r.tee, r.need, r.budget, r.note, r.created_at,
         (select count(*) from joinapply a
           where a.room_id = r.id and a.state = 'accepted') as taken_n,
         r.need - (select count(*) from joinapply a
                    where a.room_id = r.id and a.state = 'accepted') as left_n,
         (select count(*) from joinapply a
           where a.room_id = r.id and a.state = 'applied') as waiting_n
    from joinroom r
   where r.state = 'open'
     and r.play_at >= kst_today();
grant select on v_join_open to anon, authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ① 업체가 올리는 자리 한 건
-- ════════════════════════════════════════════════════════════════════
create table if not exists teetime (
  id          uuid primary key default gen_random_uuid(),
  provider_id text not null references provider(id) on delete cascade,
  -- ⚠️ 누가 올렸는지 — 업체에 담당자가 여럿일 수 있습니다 (0043 · 0052)
  by_user     uuid not null references auth.users(id) on delete cascade,
  -- ⚠️⚠️ **부킹과 조인을 한 표에 담되 `kind` 로 가릅니다** (0048 이
  --   구인 · 구직 · 제휴를 한 표로 받은 그 까닭 — 표를 가르면 목록 ·
  --   신청 · 신고 · 가리기를 두 벌 적게 되고 한 벌만 고치는 날 둘이
  --   다른 말을 합니다).
  --     booking  한 팀을 통째로 (손님이 팀을 꾸려 옵니다)
  --     join     자리 단위로 (혼자 · 둘이 와서 섞여 칩니다)
  kind        text not null check (kind in ('booking','join')),
  -- ⚠️ 지역 키는 js/data/regions.js 의 AM_REGIONS 와 **같은 글자**입니다.
  --   여기 목록을 박지 않습니다 (지역이 느는 날 두 곳이 어긋납니다).
  region      text not null check (btrim(region) <> ''),
  course      text not null check (char_length(btrim(course)) between 2 and 60),
  play_at     date not null,
  -- 티오프 시각 — ⚠️ 비울 수 있습니다 (아직 안 정해진 자리가 있습니다).
  --   비면 화면이 **줄째 뺍니다** — "미정" 을 우리가 지어 적지 않습니다.
  tee_at      time,
  holes       int check (holes is null or holes in (9, 18, 27, 36)),
  -- 남는 자리 수 — ⚠️ 4인 한 팀입니다
  slots       int not null check (slots between 1 and 4),
  -- 1인 그린피 — ⚠️⚠️ **비울 수 있고, 0 은 "무료"입니다.** 비면 화면이
  --   줄째 빼고 "협의" 를 지어 적지 않습니다 (절대 규칙 1 · 2).
  --   ⚠️ 0 을 기다리는 자리라 화면에서 `||` 를 쓰면 0 이 사라집니다.
  green_fee   int check (green_fee is null or green_fee between 0 and 10000000),
  -- ⚠️⚠️ **공개되는 예약 문의 번호**입니다. 비우면 화면이 사업자
  --   전화번호(provider.tel · 0057)를 냅니다 — 둘 다 **공개가 맞는**
  --   번호이고, 배정 담당자 직통(provider_contact)은 여기 못 들어옵니다.
  tel         text check (tel is null or char_length(btrim(tel)) between 7 and 20),
  note        text check (note is null or length(note) <= 500),
  -- open   받는 중  ·  closed  업체가 닫음  ·  hidden  운영자가 가림
  state       text not null default 'open'
              check (state in ('open','closed','hidden')),
  hidden_why  text,
  hidden_by   uuid references auth.users(id),
  hidden_at   timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists teetime_find_idx
  on teetime (state, play_at, region);
create index if not exists teetime_pv_idx
  on teetime (provider_id, play_at);

alter table teetime enable row level security;

-- ⚠️ 그 업체와 운영자가 제 줄을 봅니다. 공개로 가는 길은 **보기** 하나입니다.
drop policy if exists teetime_mine on teetime;
create policy teetime_mine on teetime
  for select using (
    coalesce(provider_id = my_provider(), false)
    or coalesce(my_role() in ('staff','admin'), false));

grant select on teetime to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ② 손님의 예약 신청
-- ════════════════════════════════════════════════════════════════════
create table if not exists teebook (
  id          uuid primary key default gen_random_uuid(),
  tee_id      uuid not null references teetime(id) on delete cascade,
  -- ⚠️⚠️ **로그인한 분만** 신청하십니다 — `/my` 에서 진행 상황을 보셔야
  --   하고, 안 그러면 "신청했는데 어디서 보나" 가 됩니다 (make_request 가
  --   비로그인도 받아서 그 요청이 /my 에 영영 안 보이던 그 자리).
  by_user     uuid not null references auth.users(id) on delete cascade,
  -- ⚠️⚠️⚠️ **이 둘이 업체에 넘어갑니다** (제17조 제2항).
  name        text not null check (char_length(btrim(name)) between 2 and 30),
  tel         text not null check (char_length(btrim(tel)) between 7 and 20),
  people      int  not null check (people between 1 and 4),
  memo        text check (memo is null or length(memo) <= 500),
  -- ⚠️⚠️ **상호를 보여 주고 받은 동의 시각** — 비울 수 없습니다.
  agree3rd_at timestamptz not null,
  -- applied 신청  ·  confirmed 업체가 확정  ·  rejected 거절  ·  canceled 손님이 취소
  state       text not null default 'applied'
              check (state in ('applied','confirmed','rejected','canceled')),
  why         text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ⚠️⚠️ **같은 자리에 두 번 살아 있는 신청을 못 넣습니다.** 없으면 한 분이
--   눌러서 자리를 다 먹을 수 있습니다 (끝난 신청은 다시 하실 수 있게
--   살아 있는 둘만 막습니다).
create unique index if not exists teebook_once_idx
  on teebook (tee_id, by_user) where state in ('applied','confirmed');
create index if not exists teebook_tee_idx on teebook (tee_id, state);

alter table teebook enable row level security;

-- ⚠️⚠️ **줄만 좁힙니다 — 칸은 못 막습니다.** 그래서 손님에게 GRANT 를
--   주는 칸을 고릅니다 (업체가 적은 거절 사유는 보셔야 하므로 `why` 는
--   줍니다. 남의 신청은 정책이 안 내줍니다).
drop policy if exists teebook_mine on teebook;
create policy teebook_mine on teebook
  for select using (coalesce(by_user = auth.uid(), false));

drop policy if exists teebook_admin on teebook;
create policy teebook_admin on teebook
  for select using (coalesce(my_role() in ('staff','admin'), false));

grant select (id, tee_id, people, memo, state, why, created_at, updated_at)
  on teebook to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ③ 문 — 업체가 자리를 올립니다
-- ════════════════════════════════════════════════════════════════════
-- ⚠️ 올릴 수 있는 날짜의 끝 — 지시서가 "61~90일은 예약 확정이 아닌
--   사전 상담만" 이라 했으므로 **표에는 90일까지** 담고, 확정으로 갈 수
--   있는 창(14 · 60)은 화면이 `js/data/site.js` 에서 읽습니다.
--   ⚠️ 그 값을 DB 에 박으면 사장님이 고치실 때 마이그레이션이 필요합니다.
create or replace function open_teetime(p jsonb default '{}'::jsonb)
  returns uuid
  language plpgsql security definer set search_path = public as $$
declare
  v_me  uuid := auth.uid();
  v_pv  text := my_provider();
  v_st  text;
  v_id  uuid;
  v_day date := nullif(btrim(coalesce(p->>'playAt','')), '')::date;
  v_fee text := nullif(btrim(coalesce(p->>'greenFee','')), '');
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_pv is null then raise exception '업체 담당자만 자리를 올릴 수 있습니다'; end if;
  -- ⚠️⚠️ **승인된 업체만** — 검사용 업체도 막습니다 (손님 화면에 나가는
  --   자리이고, 섞이면 그건 투자자와 손님에게 하는 거짓말입니다).
  select state into v_st from provider where id = v_pv and is_test = false;
  if v_st is null then raise exception '업체를 찾을 수 없습니다'; end if;
  if v_st <> 'approved' then
    raise exception '승인된 업체만 자리를 올릴 수 있습니다';
  end if;

  if coalesce(p->>'kind','') not in ('booking','join') then
    raise exception '부킹인지 조인인지 골라 주세요';
  end if;
  if nullif(btrim(coalesce(p->>'region','')), '') is null then
    raise exception '지역을 골라 주세요';
  end if;
  if nullif(btrim(coalesce(p->>'course','')), '') is null then
    raise exception '골프장 이름을 적어 주세요';
  end if;
  if v_day is null then raise exception '라운드 날짜를 골라 주세요'; end if;
  -- ⚠️ **한국 날짜**로 잽니다 (UTC 로 재면 새벽에 하루가 밀립니다)
  if v_day < kst_today() then raise exception '지난 날짜에는 자리를 올릴 수 없습니다'; end if;
  if v_day > kst_today() + 90 then
    raise exception '90일 뒤까지만 올리실 수 있습니다';
  end if;
  -- ⚠️⚠️ **0 은 무료입니다** — 빈 글자와 가릅니다 (`||` 를 쓰면 0 이 사라집니다)
  if v_fee is not null and v_fee !~ '^[0-9]+$' then
    raise exception '그린피는 숫자만 적어 주세요 (0 은 무료입니다)';
  end if;

  insert into teetime (provider_id, by_user, kind, region, course, play_at,
                       tee_at, holes, slots, green_fee, tel, note)
  values (v_pv, v_me, p->>'kind',
          btrim(p->>'region'), btrim(p->>'course'), v_day,
          nullif(btrim(coalesce(p->>'teeAt','')), '')::time,
          nullif(btrim(coalesce(p->>'holes','')), '')::int,
          coalesce(nullif(btrim(coalesce(p->>'slots','')), '')::int, 1),
          v_fee::int,
          nullif(btrim(coalesce(p->>'tel','')), ''),
          nullif(btrim(coalesce(p->>'note','')), ''))
  returning id into v_id;

  -- ⚠️ 기록에 손님 자료가 없습니다 (업체가 올린 자리입니다)
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'teetime', v_id::text, 'open',
          jsonb_build_object('kind', p->>'kind', 'region', btrim(p->>'region')));
  return v_id;
end $$;

revoke all on function open_teetime(jsonb) from public;
grant execute on function open_teetime(jsonb) to authenticated;

-- 고치기 — ⚠️⚠️ **보낸 칸만 고칩니다** (`save_provider_self` 처럼 통째로
--   덮으면 화면이 칸을 빠뜨리는 날 그 칸이 지워집니다).
--   ⚠️⚠️⚠️ **날짜 · 지역 · 골프장 · 갈래는 못 고칩니다** — 바꾸면 이미
--   신청하신 분이 **다른 자리에 묶입니다** (0056 에서 물건 종류와 지역을
--   막은 그 까닭).
create or replace function edit_teetime(p jsonb default '{}'::jsonb)
  returns uuid
  language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_pv text := my_provider();
  v_id uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_row teetime%rowtype;
  v_taken int;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 자리인지 알 수 없습니다'; end if;
  select * into v_row from teetime where id = v_id for update;
  if v_row.id is null then raise exception '그런 자리가 없습니다'; end if;
  if not coalesce(v_row.provider_id = v_pv, false) then
    raise exception '올리신 업체만 고치실 수 있습니다';
  end if;
  if v_row.state <> 'open' then raise exception '닫힌 자리는 고치실 수 없습니다'; end if;

  if p ? 'slots' then
    -- ⚠️⚠️ **이미 확정된 사람 수보다 적게 줄일 수 없습니다** — 줄이면
    --   확정해 드린 분이 자리 밖으로 밀려납니다.
    select coalesce(sum(people), 0) into v_taken
      from teebook where tee_id = v_id and state = 'confirmed';
    if coalesce(nullif(btrim(p->>'slots'), '')::int, 0) < v_taken then
      raise exception '이미 확정하신 분이 있어 그보다 적게 줄일 수 없습니다';
    end if;
  end if;

  update teetime set
    tee_at    = case when p ? 'teeAt'
                     then nullif(btrim(coalesce(p->>'teeAt','')), '')::time
                     else tee_at end,
    holes     = case when p ? 'holes'
                     then nullif(btrim(coalesce(p->>'holes','')), '')::int
                     else holes end,
    slots     = case when p ? 'slots'
                     then nullif(btrim(coalesce(p->>'slots','')), '')::int
                     else slots end,
    -- ⚠️ 0 을 지웁니다 — `nullif(…,'')` 뒤의 `::int` 라 '0' 은 0 으로 남습니다
    green_fee = case when p ? 'greenFee'
                     then nullif(btrim(coalesce(p->>'greenFee','')), '')::int
                     else green_fee end,
    tel       = case when p ? 'tel'
                     then nullif(btrim(coalesce(p->>'tel','')), '')
                     else tel end,
    note      = case when p ? 'note'
                     then nullif(btrim(coalesce(p->>'note','')), '')
                     else note end,
    updated_at = now()
  where id = v_id;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state)
  values (v_me, my_role(), 'teetime', v_id::text, 'edited');
  return v_id;
end $$;

revoke all on function edit_teetime(jsonb) from public;
grant execute on function edit_teetime(jsonb) to authenticated;

-- 닫기 — ⚠️ **올린 업체만** 씁니다 (운영자가 내리는 길은 아래 move_teetime)
create or replace function close_teetime(p jsonb default '{}'::jsonb)
  returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_pv text := my_provider();
  v_id uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_by text;
  v_st text;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 자리인지 알 수 없습니다'; end if;
  select provider_id, state into v_by, v_st from teetime where id = v_id for update;
  if v_by is null then raise exception '그런 자리가 없습니다'; end if;
  if not coalesce(v_by = v_pv, false) then
    raise exception '올리신 업체만 닫으실 수 있습니다';
  end if;
  if v_st <> 'open' then raise exception '이미 닫힌 자리입니다'; end if;

  update teetime set state = 'closed', updated_at = now() where id = v_id;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state)
  values (v_me, my_role(), 'teetime', v_id::text, 'closed');
  return 'closed';
end $$;

revoke all on function close_teetime(jsonb) from public;
grant execute on function close_teetime(jsonb) to authenticated;

-- 운영자가 가립니다 — ⚠️⚠️ **까닭이 반드시** 있어야 합니다 (§8)
create or replace function move_teetime(p jsonb default '{}'::jsonb)
  returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_me  uuid := auth.uid();
  v_rl  app_role := my_role();
  v_id  uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_why text := nullif(btrim(coalesce(p->>'why','')), '');
  v_n   int;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if v_rl not in ('staff','admin') then
    raise exception '가리는 것은 운영자만 할 수 있습니다';
  end if;
  if v_id is null then raise exception '어느 자리인지 알 수 없습니다'; end if;
  if v_why is null or char_length(v_why) < 5 then
    raise exception '가리는 까닭을 다섯 글자 이상 적어 주세요';
  end if;

  update teetime set state = 'hidden', hidden_why = v_why, hidden_by = v_me,
                     hidden_at = now(), updated_at = now()
   where id = v_id and state <> 'hidden';
  get diagnostics v_n = row_count;
  -- ⚠️⚠️ **0줄이면 거절합니다** — 조용히 끝내면 기록에 "가렸다" 가 남는데
  --   실제로는 아무 일도 안 일어난 것입니다 (0054 에서 적어 둔 자리).
  if v_n = 0 then raise exception '가릴 자리가 없습니다'; end if;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why)
  values (v_me, v_rl, 'teetime', v_id::text, 'hidden', v_why);
  return 'hidden';
end $$;

revoke all on function move_teetime(jsonb) from public;
grant execute on function move_teetime(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ④ 문 — 손님이 예약을 신청합니다
-- ════════════════════════════════════════════════════════════════════
create or replace function book_teetime(p jsonb default '{}'::jsonb)
  returns uuid
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_id   uuid := nullif(btrim(coalesce(p->>'tee','')), '')::uuid;
  v_name text := nullif(btrim(coalesce(p->>'name','')), '');
  v_tel  text := nullif(btrim(coalesce(p->>'tel','')), '');
  v_ppl  int  := coalesce(nullif(btrim(coalesce(p->>'people','')), '')::int, 0);
  v_ok   boolean := coalesce((p->>'agree3rd')::boolean, false);
  v_row  teetime%rowtype;
  v_pvst text;
  v_used int;
  v_new  uuid;
begin
  if v_me is null then raise exception '로그인하셔야 예약을 신청하실 수 있습니다'; end if;
  if v_id is null then raise exception '어느 자리인지 알 수 없습니다'; end if;
  -- ⚠️⚠️ **줄을 먼저 잠급니다** — 세어 보고 넣는 사이에 다른 신청이
  --   끼어들면 둘 다 "아직 자리 있음" 으로 읽습니다 (0046 에서 겪은 자리).
  select * into v_row from teetime where id = v_id for update;
  if v_row.id is null then raise exception '그런 자리가 없습니다'; end if;
  if v_row.state <> 'open' then raise exception '지금은 받지 않는 자리입니다'; end if;
  if v_row.play_at < kst_today() then raise exception '지난 날짜입니다'; end if;
  -- ⚠️ **읽을 때 다시 봅니다** — 승인이 풀리거나 정지되면 그 순간 막힙니다
  select state into v_pvst from provider
   where id = v_row.provider_id and is_test = false and listed = true;
  if v_pvst is null or v_pvst <> 'approved' then
    raise exception '지금은 그 업체의 자리를 받지 않습니다';
  end if;

  if v_name is null then raise exception '성함을 적어 주세요'; end if;
  if v_tel  is null then raise exception '연락처를 적어 주세요'; end if;
  if v_ppl < 1 or v_ppl > 4 then raise exception '인원을 1~4명으로 적어 주세요'; end if;
  -- ⚠️⚠️⚠️ **동의 없이는 안 받습니다** — 성함과 연락처가 그 업체에
  --   넘어갑니다 (제17조 제2항). 화면이 **상호를 보여 주면서** 받습니다.
  if not v_ok then
    raise exception '업체에 성함과 연락처를 넘기는 데 동의하셔야 신청하실 수 있습니다';
  end if;

  -- ⚠️ 제 업체 자리에는 제가 신청하지 않습니다 (0037 이 후기에서 막은 그 자리)
  if coalesce(v_row.provider_id = my_provider(), false) then
    raise exception '제 업체의 자리에는 신청하실 수 없습니다';
  end if;

  select coalesce(sum(people), 0) into v_used
    from teebook where tee_id = v_id and state in ('applied','confirmed');
  if v_used + v_ppl > v_row.slots then
    raise exception '남은 자리보다 많습니다';
  end if;

  insert into teebook (tee_id, by_user, name, tel, people, memo, agree3rd_at)
  values (v_id, v_me, v_name, v_tel, v_ppl,
          nullif(btrim(coalesce(p->>'memo','')), ''), now())
  returning id into v_new;

  -- ⚠️⚠️ 기록에 **성함 · 연락처를 넣지 않습니다** (감사 기록은 오래 남고
  --   보는 사람도 넓습니다 — 번호로 찾아가게 둡니다).
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'teebook', v_new::text, 'applied',
          jsonb_build_object('people', v_ppl));
  return v_new;
exception
  when unique_violation then
    raise exception '이미 신청하신 자리입니다';
end $$;

revoke all on function book_teetime(jsonb) from public;
grant execute on function book_teetime(jsonb) to authenticated;

-- 업체가 확정 · 거절 · 손님이 취소
-- ⚠️⚠️ **'예약 완료' 가 아니라 '확정' 입니다** — 그리고 확정은 **업체만**
--   합니다. 손님이 스스로 확정할 수 있으면 그건 예약이 아닙니다.
create or replace function move_teebook(p jsonb default '{}'::jsonb)
  returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_me  uuid := auth.uid();
  v_pv  text := my_provider();
  v_id  uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_to  text := nullif(btrim(coalesce(p->>'state','')), '');
  v_why text := nullif(btrim(coalesce(p->>'why','')), '');
  v_bk  teebook%rowtype;
  v_tt  teetime%rowtype;
  v_used int;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 신청인지 알 수 없습니다'; end if;
  select * into v_bk from teebook where id = v_id for update;
  if v_bk.id is null then raise exception '그런 신청이 없습니다'; end if;
  select * into v_tt from teetime where id = v_bk.tee_id for update;

  if v_to = 'canceled' then
    -- 취소는 **신청하신 분만**
    if not coalesce(v_bk.by_user = v_me, false) then
      raise exception '신청하신 분만 취소하실 수 있습니다';
    end if;
    if v_bk.state not in ('applied','confirmed') then
      raise exception '이미 끝난 신청입니다';
    end if;
    update teebook set state = 'canceled', updated_at = now() where id = v_id;
    insert into audit_log (by_user, by_role, obj, obj_id, to_state)
    values (v_me, my_role(), 'teebook', v_id::text, 'canceled');
    return 'canceled';
  end if;

  if v_to not in ('confirmed','rejected') then
    raise exception '옮길 수 없는 상태입니다';
  end if;
  -- 확정 · 거절은 **그 업체만**
  if not coalesce(v_tt.provider_id = v_pv, false) then
    raise exception '그 자리를 올린 업체만 처리하실 수 있습니다';
  end if;
  if v_bk.state <> 'applied' then raise exception '이미 처리된 신청입니다'; end if;

  if v_to = 'rejected' then
    -- ⚠️ 거절에는 까닭을 받습니다 — 손님이 왜 안 됐는지 알아야 합니다
    if v_why is null or char_length(v_why) < 2 then
      raise exception '거절하시는 까닭을 적어 주세요';
    end if;
    update teebook set state = 'rejected', why = v_why, updated_at = now()
     where id = v_id;
    insert into audit_log (by_user, by_role, obj, obj_id, to_state)
    values (v_me, my_role(), 'teebook', v_id::text, 'rejected');
    return 'rejected';
  end if;

  -- 확정 — ⚠️⚠️ **자리를 다시 셉니다** (사이에 다른 확정이 들어왔을 수 있습니다)
  select coalesce(sum(people), 0) into v_used
    from teebook where tee_id = v_bk.tee_id and state = 'confirmed';
  if v_used + v_bk.people > v_tt.slots then
    raise exception '남은 자리보다 많아 확정하실 수 없습니다';
  end if;
  update teebook set state = 'confirmed', updated_at = now() where id = v_id;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state)
  values (v_me, my_role(), 'teebook', v_id::text, 'confirmed');
  return 'confirmed';
end $$;

revoke all on function move_teebook(jsonb) from public;
grant execute on function move_teebook(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑤ 공개 보기 — ⚠️⚠️ **보기는 RLS 를 지나지 않습니다.** 이 where 절이
--   자물쇠 그 자체입니다 (0051 에서 서류가 새지 않게 한 그 자리).
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️ 업체 상태를 **읽을 때 다시** 봅니다 — 정지되면 그 순간 빠집니다.
--   조건은 v_provider_card 와 **같은 셋**입니다 (listed · is_test · state).
drop view if exists v_teetime_open;
create view v_teetime_open as
  select t.id, t.provider_id, p.name as provider_name,
         t.kind, t.region, t.course, t.play_at, t.tee_at, t.holes,
         t.slots, t.green_fee,
         -- ⚠️⚠️ **공개가 맞는 번호 둘 가운데 하나**입니다 — 업체가 적은
         --   예약 문의 번호가 있으면 그것, 없으면 사업자 전화번호
         --   (제20조 제2항이 보이라고 한 값 · 0057). 배정 담당자 직통
         --   (provider_contact)은 **여기 안 들어옵니다**.
         coalesce(nullif(btrim(coalesce(t.tel, '')), ''), p.tel) as tel,
         t.note, t.created_at,
         -- ⚠️ 남은 자리는 **저장하지 않고 셉니다** (숫자로 들고 있으면
         --   누가 그 칸에 고쳐 적습니다 · 절대 규칙 1)
         t.slots - (select coalesce(sum(b.people), 0) from teebook b
                     where b.tee_id = t.id
                       and b.state in ('applied','confirmed')) as left_n,
         (select count(*) from teebook b
           where b.tee_id = t.id and b.state = 'confirmed') as confirmed_n
    from teetime t
    join provider p on p.id = t.provider_id
   where t.state = 'open'
     and t.play_at >= kst_today()
     and p.listed = true
     and p.is_test = false
     and p.state = 'approved';

grant select on v_teetime_open to anon, authenticated;

-- 날짜 · 지역별 현황 — ⚠️⚠️⚠️ **위 보기 위에 세웁니다.** 지시서가
--   "집계 조건과 결과 목록 필터를 일치시킨다" 고 한 자리인데, 따로
--   세면 한쪽만 고치는 날 **표의 숫자와 목록의 줄 수가 달라집니다**.
--   여기서는 구조적으로 그럴 수가 없습니다.
drop view if exists v_teetime_count;
create view v_teetime_count as
  select kind, region, play_at, count(*)::int as n,
         sum(greatest(left_n, 0))::int as left_n
    from v_teetime_open
   group by kind, region, play_at;

grant select on v_teetime_count to anon, authenticated;

-- 조인 현황도 같은 꼴로 — ⚠️ `v_join_open` 위에 세웁니다 (같은 까닭)
drop view if exists v_join_count;
create view v_join_count as
  select region, play_at, count(*)::int as n,
         sum(greatest(left_n, 0))::int as left_n
    from v_join_open
   group by region, play_at;

grant select on v_join_count to anon, authenticated;

-- ⚠️⚠️⚠️ **신청자 성함 · 연락처는 그 업체에게만.** 이 보기의 where 절이
--   자물쇠입니다 — 표에서는 칸 GRANT 가 `name` · `tel` 을 안 줍니다.
drop view if exists v_teebook_pv;
create view v_teebook_pv as
  select b.id, b.tee_id, b.name, b.tel, b.people, b.memo, b.state, b.why,
         b.agree3rd_at, b.created_at, b.updated_at,
         t.provider_id, t.kind, t.region, t.course, t.play_at, t.tee_at, t.slots
    from teebook b
    join teetime t on t.id = b.tee_id
   where coalesce(t.provider_id = my_provider(), false);

grant select on v_teebook_pv to authenticated;

-- 손님이 보는 제 신청 — ⚠️ 여기에는 **업체 쪽 정보**가 담깁니다
--   (상호 · 공개 전화번호). 제 성함 · 연락처는 제가 적은 것이라 그대로.
drop view if exists v_teebook_mine;
create view v_teebook_mine as
  select b.id, b.tee_id, b.people, b.memo, b.state, b.why,
         b.created_at, b.updated_at,
         t.kind, t.region, t.course, t.play_at, t.tee_at, t.holes, t.green_fee,
         t.provider_id, p.name as provider_name,
         coalesce(nullif(btrim(coalesce(t.tel, '')), ''), p.tel) as tel
    from teebook b
    join teetime t on t.id = b.tee_id
    join provider p on p.id = t.provider_id
   where coalesce(b.by_user = auth.uid(), false);

grant select on v_teebook_mine to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑥ 알림 — ⚠️ 밖으로 안 보냅니다 (0050 의 notify_one 을 그대로 씁니다)
-- ════════════════════════════════════════════════════════════════════
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
   'answer','hidden','inquiry','listingask','listingmoved','watch',
   'teebook','teemoved'));

-- 예약 신청이 들어왔습니다 → 그 자리를 올린 담당자에게
-- ⚠️⚠️ **본문 칸이 없습니다** (0050) — 제목과 가는 자리까지입니다.
--   손님이 적은 글이나 연락처를 알림이 나르면 안 됩니다.
create or replace function notice_teebook() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_to uuid;
begin
  select by_user into v_to from teetime where id = new.tee_id;
  perform notify_one(v_to, 'teebook', '예약 신청이 들어왔습니다',
                     '/desk', 'teebook', new.id::text);
  return new;
end $$;
revoke all on function notice_teebook() from public;

drop trigger if exists notice_teebook_t on teebook;
create trigger notice_teebook_t after insert on teebook
  for each row execute function notice_teebook();

-- 신청이 처리되었습니다 → 신청하신 분에게
create or replace function notice_teemoved() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.state is distinct from old.state
     and new.state in ('confirmed','rejected') then
    perform notify_one(new.by_user, 'teemoved', '예약 신청이 처리되었습니다',
                       '/my', 'teebook', new.id::text);
  end if;
  return new;
end $$;
revoke all on function notice_teemoved() from public;

drop trigger if exists notice_teemoved_t on teebook;
create trigger notice_teemoved_t after update on teebook
  for each row execute function notice_teemoved();


-- ── 신고 — ⚠️⚠️ **새 표를 안 만들고 `report` 에 칸을 더합니다** (0040 의 꼴).
--   ⚠️⚠️⚠️ **칸만 더하면 아무도 그 칸을 못 씁니다.** `open_report` 가
--   그 열쇠를 모르면 `teetime_id` 는 영원히 null 이고, 운영자 화면의
--   "티타임 자리 가리기" 가지는 **죽은 코드**가 됩니다 ("만들어 놓고
--   안 쓰는 칸" 을 이 저장소가 다섯 번 겪은 그 자리입니다).
--   체인: open_report (0040 → 0046 → 0047 → 0048 → 0056 → **0060**)
alter table report add column if not exists teetime_id uuid references teetime(id);

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
  -- ⚠️ 0060 — 업체가 올린 티타임 자리도 신고할 수 있습니다
  v_tt   uuid := nullif(btrim(coalesce(p->>'teetime', '')), '')::uuid;
  v_body text := btrim(coalesce(p->>'body', ''));
  v_id   uuid;
  v_dup  int;
begin
  if v_me is null then raise exception '신고는 로그인한 뒤에 하실 수 있습니다'; end if;
  if v_kind not in ('abuse','dispute') then
    raise exception '신고 · 분쟁 중 하나로 적어 주세요';
  end if;
  if v_req is null and v_pv is null and v_rv is null and v_jr is null
     and v_cq is null and v_ca is null and v_jp is null and v_ls is null
     and v_tt is null then
    raise exception '무엇에 대한 것인지 적어 주세요 (요청 · 업체 · 후기 · 조인 · 글 · 매물 · 티타임 가운데 하나)';
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
     and listing_id is not distinct from v_ls
     and teetime_id is not distinct from v_tt;
  if v_dup > 0 then
    raise exception '같은 건으로 이미 접수된 것이 있습니다 — 운영자가 보고 있습니다';
  end if;

  insert into report (kind, request_id, provider_id, review_id, joinroom_id,
                      cq_id, ca_id, jobpost_id, listing_id, teetime_id,
                      by_user, body)
  values (v_kind, v_req, v_pv, v_rv, v_jr, v_cq, v_ca, v_jp, v_ls, v_tt,
          v_me, v_body)
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

insert into schema_version (n, name) values (60, '0060_teetime')
  on conflict (n) do nothing;

commit;
