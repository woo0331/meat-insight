/* ==================================================================
   0060 ~ 0070 를 한 번에 —
   Supabase SQL 편집기에 **이 파일을 통째로** 붙여 넣고 Run 하세요.
   ==================================================================
   WARN 빌드가 만드는 파일입니다 — 손으로 고치지 마세요.
   db/migrations 의 11개를 번호 차례로 이어 붙인 것이고
   한 글자도 바꾸지 않았습니다. (node tools/make-apply.js)

   조각 파일입니다 — 바로 앞 조각까지 끝낸 DB 에만 쓰세요.
   어디까지 됐는지는 db/resume.sql 이 말해 줍니다
   (select max(n) from schema_version).

   돌린 뒤에는 db/verify.sql 을 붙여 넣어 보세요. 중간에서 멈추면 그
   파일 하나만 따로 돌리고 그 다음부터 이어 가시면 됩니다 — 번호를
   다시 쓰지 않습니다.

   WARN 통째로 begin/commit 으로 감싸지 마세요 — 파일마다 제
   트랜잭션이 있고 0015 는 일부러 감싸지 않았습니다. */

/* ---------------------------- 0060_teetime.sql ---------------------------- */
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
-- ⚠️⚠️ 같은 자리입니다 — `v_teetime_count` 가 이 보기 위에 섭니다.
drop view if exists v_teetime_count;
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

-- 조인 현황 — ⚠️⚠️⚠️ **여기만 표에서 직접 셉니다.** 위의 티타임 짝처럼
--   `v_join_open` 위에 세우고 싶지만, 그 보기는 **0046 의 것**입니다.
--   그 위에 보기를 얹으면 사장님이 붙여넣기 파일을 **두 번째로** 붙여
--   넣는 순간 0046 이 제 보기를 지우려다
--   `cannot drop view v_join_open because other objects depend on it` 으로
--   **거기서 멈춥니다** (`test-upgrade` ⑧ 이 잡았습니다 — 0044 가 같은
--   자리에서 멈춘 적이 있습니다).
--   ⚠️⚠️ 그래서 **조건을 한 번 더 적습니다.** 두 곳에 적은 조건이므로
--   어긋날 수 있고, `sql/teetime.js` 가 **줄마다** 두 보기를 맞춰 봅니다
--   (총합이 아니라 지역 · 날짜마다 — 총합만 보면 한쪽이 더 세고 한쪽이
--   덜 세는 것이 상쇄되어 **엉뚱한 까닭으로 통과**합니다).
--   ⚠️ 0046 을 고쳐서 풀지 않습니다 — **돌린 마이그레이션은 안 고칩니다.**
drop view if exists v_join_count;
create view v_join_count as
  select r.region, r.play_at, count(*)::int as n,
         sum(greatest(r.need - (select count(*) from joinapply a
                                 where a.room_id = r.id
                                   and a.state = 'accepted'), 0))::int as left_n
    from joinroom r
   where r.state = 'open'
     and r.play_at >= kst_today()
   group by r.region, r.play_at;

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

/* ---------------------------- 0061_wanted.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0061 — 회원이 올리는 **구합니다** (업체 · 회원이 답합니다)
--
-- 붙는 분류 여섯: 레슨 · 연습장 · 용품 마켓 · 피팅 · 수리 · 여행 · 부킹
--   그 여섯은 **업체만** 등록하는 자리였습니다. 업체가 0곳인 동안은
--   손님이 할 수 있는 일이 매칭 요청 하나뿐이고, 화면은 "등록된 업체가
--   없습니다" 만 말했습니다. 회원이 **먼저 올리고** 업체가 찾아오게
--   합니다.
--
-- ⚠️⚠️⚠️ **`/match`(매칭 요청)와 다릅니다 — 섞으면 안 됩니다.**
--     매칭 요청  운영자만 봅니다 · 배정할 때 상호를 알리고 다시 동의를
--                받아 그 업체에만 넘깁니다 (제17조 제2항)
--     구합니다   **누구나 봅니다** · 글에 연락처를 안 담고, 받아들인 뒤
--                **각자 제 것만** 엽니다
--   둘은 다른 길이고 화면이 그 차이를 **그 자리에서** 말해야 합니다.
--   안 적으면 손님이 둘 중 무엇을 써야 할지 모릅니다.
--
-- ⚠️⚠️⚠️ **0056(중고) · 0048(인력)을 그대로 베꼈습니다.** 짜임새가
--   같습니다 — 글을 올리고 · 상대가 말을 걸고 · 받아들이면 **각자 제
--   연락처만** 따로 엽니다. 새로 설계하면 "받아들이면 서로 보이게"
--   같은 자리를 다시 틀립니다 (0046 에서 지시서가 짚어 준 그 자리).
--
-- ⚠️⚠️⚠️ **연락처는 받아들이기만으로 안 열립니다** (제17조 제2항).
--   받아들이는 것은 "얘기해 봅시다" 이지 "내 번호를 줘도 좋다" 가
--   아닙니다. 각자 **제 것만** 열고 **언제든 닫습니다**(철회권) —
--   닫을 때는 동의 시각을 **안 받습니다**(받으면 철회를 막는 꼴입니다).
--
-- ⚠️⚠️ **답은 공개가 아닙니다.** 목록에는 **답이 몇 개인지만** 나오고
--   내용은 **올린 분과 답한 본인**만 봅니다 (0056 의 문의와 같습니다).
--   공개로 두면 답에 섞여 들어온 연락처가 그대로 공개됩니다.
--
-- ⚠️⚠️ **예산은 필수가 아닙니다** — 강요하면 지어내서 적습니다
--   (작업 기억의 그 줄). 비면 화면에서 **줄째 빠집니다**.
--
-- ⚠️ 분류 키 · 하위 키 · 지역 키를 **여기 박지 않습니다** — 박으면
--   분류가 바뀌는 날 두 곳이 어긋나고, 그때 화면은 보내는데 DB 가
--   거절합니다 (`make_request` 가 하위 예순둘을 모르는 그 까닭).
--
-- ⚠️ 보유 기간은 `js/data/site.js` 의 `wantedKeep` 입니다 (운영 정책이라
--   DB 에 안 박습니다). 비면 화면이 **양식을 안 엽니다** — 법이 보여
--   주라는 것을 안 보여 주고 동의를 받을 수는 없습니다 (제15조 제2항).
--
-- ⚠️ 신고는 **새 표를 안 만들고** `report` 에 `wanted_id` 를 더합니다.
--   체인: open_report (0040 → 0046 → 0047 → 0048 → 0056 → 0060 → **0061**)
-- ════════════════════════════════════════════════════════════════════

begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 구합니다 글 한 장
-- ════════════════════════════════════════════════════════════════════
create table if not exists wanted (
  id         uuid primary key default gen_random_uuid(),
  by_user    uuid not null references auth.users(id) on delete cascade,
  -- ⚠️ 분류 키 — `js/data/catalog.js` 의 AM_CATS 와 **같은 글자**입니다
  --   (lesson · range · market · fitting · travel · booking). 목록을
  --   박지 않습니다.
  cat        text not null check (btrim(cat) <> ''),
  -- ⚠️ 하위는 **고르셔도 되고 안 고르셔도 됩니다** — 좁혀 적으면 업체가
  --   찾기 쉽고, 모르시면 비우는 쪽이 맞습니다 (모르는 것을 고르게
  --   하면 틀린 하위가 쌓입니다).
  sub        text check (sub is null or btrim(sub) <> ''),
  -- ⚠️ 지역 키도 `js/data/regions.js` 의 AM_REGIONS 와 같은 글자입니다
  region     text not null check (btrim(region) <> ''),
  title      text not null check (char_length(btrim(title)) between 2 and 60),
  body       text not null check (char_length(btrim(body)) between 5 and 2000),
  -- ⚠️⚠️ **예산은 비워 두실 수 있습니다** (null = 안 적음). 0 도 받지만
  --   그건 "무료로 해 주실 분" 이라는 뜻이고 "안 적음" 과 다릅니다 —
  --   그래서 화면에서 `||` 를 쓰면 0 이 사라집니다 (작업 기억의 그 자리).
  budget     int check (budget is null or budget between 0 and 100000000),
  -- 언제 필요하신지 — ⚠️ **글자입니다** ("주말 오전" · "12월 중순").
  --   날짜 칸으로 두면 "아무 때나" 를 적을 자리가 없어집니다.
  when_txt   text check (when_txt is null or char_length(btrim(when_txt)) <= 60),
  -- open   찾고 있습니다
  -- done   구했습니다 (글쓴이가 눌렀습니다)
  -- closed 글쓴이가 내렸습니다
  -- hidden 운영자가 가렸습니다 — ⚠️ 까닭이 반드시 있습니다 (아래 check)
  state      text not null default 'open'
             check (state in ('open','done','closed','hidden')),
  -- ⚠️⚠️ **연락처는 여기 있지만 아무도 표에서 못 읽습니다** (④의 GRANT).
  --   오가는 길은 v_wanted_contact 하나입니다.
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
  constraint wanted_hidden_ck
    check (state <> 'hidden' or btrim(coalesce(hidden_why,'')) <> '')
);
create index if not exists wanted_open_idx
  on wanted (state, created_at desc) where state = 'open';
create index if not exists wanted_mine_idx on wanted (by_user, created_at desc);
create index if not exists wanted_cat_idx
  on wanted (cat, region) where state = 'open';

-- ════════════════════════════════════════════════════════════════════
-- ② 답 한 건 — "제가 해 드릴 수 있습니다"
-- ════════════════════════════════════════════════════════════════════
create table if not exists wantedreply (
  id         uuid primary key default gen_random_uuid(),
  w_id       uuid not null references wanted(id) on delete cascade,
  by_user    uuid not null references auth.users(id) on delete cascade,
  -- ⚠️⚠️ **업체 이름(상호)으로 답하는 것은 고르는 것입니다** (0048 의
  --   as_pro 와 같습니다). 승인된 · 검사용이 아닌 업체만 되고, 보기가
  --   **읽을 때 다시** 상태를 봅니다 — 정지되면 그 순간 빠집니다.
  --   ⚠️ 비우면 **개인으로** 답하는 것입니다.
  as_pro     text references provider(id) on delete set null,
  body       text not null check (char_length(btrim(body)) between 5 and 500),
  contact    text not null check (btrim(contact) <> ''),
  -- replied  보냈습니다
  -- accepted 올린 분이 받아들였습니다 ← 이때부터 **연락처를 고를 수** 있습니다
  -- rejected 올린 분이 거절했습니다
  -- canceled 답한 분이 거뒀습니다
  state      text not null default 'replied'
             check (state in ('replied','accepted','rejected','canceled')),
  agree_at   timestamptz not null,
  -- ⚠️⚠️⚠️ **각자 제 것만** (0046 의 host/guest · 0056 의 seller/buyer 와
  --   같은 자리입니다)
  --     owner_share_at   올린 분이 **제** 번호를 이 분에게 보여 줌
  --     helper_share_at  답한 분이 **제** 번호를 올린 분에게 보여 줌
  owner_share_at  timestamptz,
  helper_share_at timestamptz,
  created_at timestamptz not null default now(),
  -- ⚠️ 한 글에 한 번만 — 안 막으면 한 사람이 같은 글에 백 번 넣습니다
  unique (w_id, by_user)
);
create index if not exists wantedreply_w_idx
  on wantedreply (w_id, created_at desc);
create index if not exists wantedreply_mine_idx
  on wantedreply (by_user, created_at desc);

-- ════════════════════════════════════════════════════════════════════
-- ③ 공개 목록 — ⚠️ **보기의 where 절이 자물쇠 그 자체입니다**
--   보기는 RLS 를 지나지 않습니다 (임자 권한으로 돕니다). 그래서 여기
--   담지 않은 칸은 **어떤 정책으로도 새어 나가지 않습니다.**
--   ⚠️⚠️ `contact` 와 `by_user` 를 **담지 않습니다** — 글은 공개지만
--   누가 올렸는지와 연락처는 공개가 아닙니다 (후기 · 조인 · 중고와
--   같은 꼴).
-- ════════════════════════════════════════════════════════════════════
drop view if exists v_wanted_open;
create view v_wanted_open as
  select w.id, w.cat, w.sub, w.region, w.title, w.body, w.budget, w.when_txt,
         w.created_at,
         -- ⚠️ 칸에 저장하지 않고 **셉니다** (절대 규칙 1 — 숫자로 들고
         --   있으면 누군가 그 칸에 고쳐 적습니다)
         -- ⚠️⚠️ **개수만 공개입니다.** 답의 **내용**은 올린 분과 답한
         --   본인만 봅니다 — 공개로 두면 답에 섞여 들어온 연락처가
         --   그대로 공개됩니다.
         (select count(*) from wantedreply r
           where r.w_id = w.id and r.state = 'replied') as reply_n
    from wanted w
   where w.state = 'open';
grant select on v_wanted_open to anon, authenticated;

-- ⚠️⚠️ 올린 분이 **받은 답**을 읽는 자리 — 연락처는 **안 담습니다**
--   (그것은 v_wanted_contact 하나로만 갑니다).
--   ⚠️ 업체 이름으로 답한 것은 **읽을 때 다시** 상태를 봅니다 —
--   승인된 · 검사용이 아닌 · 정지되지 않은 업체만 상호가 나옵니다
--   (0048 의 as_pro · 0055 의 광고 보기와 **같은 셋**입니다).
drop view if exists v_wanted_reply;
create view v_wanted_reply as
  select r.id, r.w_id, r.by_user, r.body, r.state, r.created_at,
         r.owner_share_at, r.helper_share_at,
         case when p.id is not null then p.name end as pro_name,
         -- ⚠️ 개인으로 답한 분은 **가린 성함**입니다 (본이름은 안 냅니다 —
         --   화면에서 가리면 이미 브라우저까지 온 것입니다 · 0052)
         case when p.id is null then
           left(coalesce(nullif(btrim(a.name), ''), '회원'), 1) ||
           repeat('*', greatest(char_length(coalesce(nullif(btrim(a.name), ''), '회원')) - 1, 0))
         end as who,
         w.by_user as owner
    from wantedreply r
    join wanted  w on w.id = r.w_id
    left join account a on a.id = r.by_user
    left join provider p on p.id = r.as_pro
                        and p.listed = true
                        and p.is_test = false
                        and p.state = 'approved'
   where auth.uid() = w.by_user or auth.uid() = r.by_user;
grant select on v_wanted_reply to authenticated;

-- ⚠️⚠️⚠️ **연락처가 오가는 단 하나의 길입니다.**
--   ① 받아들인 답이어야 하고 ② 보는 사람이 그 둘 중 하나여야 합니다.
--   둘 다 where 절에 있으므로 정책을 어떻게 쓰든 이 조건을 못 피합니다.
drop view if exists v_wanted_contact;
create view v_wanted_contact as
  select r.id as reply_id, r.w_id,
         w.by_user as owner, r.by_user as helper,
         r.owner_share_at, r.helper_share_at,
         -- ⚠️⚠️⚠️ **받아들이기만으로는 둘 다 null 입니다** (제17조 제2항)
         case when r.owner_share_at  is not null then w.contact end as owner_contact,
         case when r.helper_share_at is not null then r.contact end as helper_contact
    from wantedreply r
    join wanted      w on w.id = r.w_id
   where r.state = 'accepted'
     and (auth.uid() = w.by_user or auth.uid() = r.by_user);
grant select on v_wanted_contact to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ④ 자물쇠 — RLS 로 **줄**을, GRANT 로 **칸**을 막습니다
--   ⚠️⚠️ 둘을 따로 둡니다. 하나만 보고 "막혔다" 고 읽으면 다른 하나가
--   장식인지 알 수 없습니다 (GRANT 를 잠깐 열어 RLS 가 막는지 봅니다).
-- ════════════════════════════════════════════════════════════════════
alter table wanted      enable row level security;
alter table wantedreply enable row level security;

drop policy if exists wanted_mine on wanted;
create policy wanted_mine on wanted for select
  using (by_user = auth.uid());
drop policy if exists wanted_staff on wanted;
create policy wanted_staff on wanted for select
  using (my_role() in ('staff','admin'));

drop policy if exists wantedreply_mine on wantedreply;
create policy wantedreply_mine on wantedreply for select
  using (by_user = auth.uid());
-- 내 글에 들어온 답 — ⚠️ 연락처 칸은 아래 GRANT 가 막습니다
drop policy if exists wantedreply_owner on wantedreply;
create policy wantedreply_owner on wantedreply for select
  using (exists (select 1 from wanted w
                  where w.id = wantedreply.w_id and w.by_user = auth.uid()));
drop policy if exists wantedreply_staff on wantedreply;
create policy wantedreply_staff on wantedreply for select
  using (my_role() in ('staff','admin'));

-- ⚠️⚠️⚠️ **칸 단위 GRANT — `contact` 와 `agree_at` 을 빼고 줍니다.**
--   정책이 줄을 보여 줘도 이 칸들은 **읽히지 않습니다.**
--   ⚠️ 쓰기(insert · update · delete)는 **한 줄도 주지 않습니다** —
--   들어오는 길은 아래 문 일곱뿐입니다.
--   ⚠️⚠️ 안 준 칸을 `where` 절에 쓰면 0줄이 아니라 **질의가 통째로
--   거절**됩니다 (0050 · 0052 · 0056 에서 세 번 밟은 자리입니다).
grant select (id, by_user, cat, sub, region, title, body, budget, when_txt,
              state, hidden_why, hidden_at, created_at, updated_at)
                                   on wanted      to authenticated;
grant select (id, w_id, by_user, as_pro, body, state, created_at,
              owner_share_at, helper_share_at)
                                   on wantedreply to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑤ 문 — 구합니다 글을 올립니다
-- ════════════════════════════════════════════════════════════════════
create or replace function open_wanted(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_cat     text := nullif(btrim(coalesce(p->>'cat','')), '');
  v_sub     text := nullif(btrim(coalesce(p->>'sub','')), '');
  v_region  text := nullif(btrim(coalesce(p->>'region','')), '');
  v_title   text := nullif(btrim(coalesce(p->>'title','')), '');
  v_body    text := nullif(btrim(coalesce(p->>'body','')), '');
  v_when    text := nullif(btrim(coalesce(p->>'when_txt','')), '');
  v_contact text := nullif(btrim(coalesce(p->>'contact','')), '');
  v_budget  int;
  v_id      uuid;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  if v_cat is null then
    raise exception '분류가 없습니다';
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
  if v_when is not null and char_length(v_when) > 60 then
    raise exception '언제 필요하신지가 너무 깁니다 (60자)';
  end if;

  -- ⚠️⚠️ **예산은 비워 두실 수 있습니다** — 강요하면 지어내서 적습니다.
  --   빈 글자는 "안 적음"(null)이고 0 은 "무료로 해 주실 분" 입니다.
  --   둘은 다른 뜻이라 섞지 않습니다.
  if p->>'budget' is not null and btrim(p->>'budget') <> '' then
    begin
      v_budget := btrim(p->>'budget')::int;
    exception when others then
      raise exception '예산은 숫자로 적어 주세요';
    end;
    if v_budget < 0 or v_budget > 100000000 then
      raise exception '예산이 올바르지 않습니다';
    end if;
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

  -- ⚠️⚠️ **쏟아붓기 막기.** 한 사람이 백 개를 올리면 목록이 통째로
  --   쓸모없어집니다. 찾고 있는 것은 **한 번에 열**까지.
  --   ⚠️ 내린 것 · 구한 것은 안 셉니다 (정상입니다).
  if (select count(*) from wanted
       where by_user = v_uid and state = 'open') >= 10 then
    raise exception '찾고 계신 글이 열입니다. 먼저 정리해 주세요';
  end if;
  if (select count(*) from wanted
       where by_user = v_uid and created_at > now() - interval '1 day') >= 20 then
    raise exception '오늘은 더 올릴 수 없습니다 (하루 스무 개)';
  end if;

  insert into wanted (by_user, cat, sub, region, title, body, budget,
                      when_txt, contact, agree_at)
  values (v_uid, v_cat, v_sub, v_region, v_title, v_body, v_budget,
          v_when, v_contact, (p->>'agree_at')::timestamptz)
  returning id into v_id;
  return v_id;
end $$;
revoke all on function open_wanted(jsonb) from public;
grant execute on function open_wanted(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑥ 문 — 글을 고칩니다
--   ⚠️⚠️ **보낸 칸만 고칩니다.** `save_provider_self` 처럼 통째로
--   덮으면 화면이 칸 하나를 빠뜨리는 날 그 칸이 **지워집니다**
--   (`js/deskme.js` 가 `industries` 를 지우고 있던 그 자리).
--   ⚠️⚠️ **분류 · 하위 · 지역은 못 고칩니다** — 바꾸면 답하신 분이
--   다른 것에 묶입니다 (조인에서 날짜 · 지역을 막은 그 까닭).
-- ════════════════════════════════════════════════════════════════════
create or replace function edit_wanted(p jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_id    uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_owner uuid;
  v_state text;
  v_budget int;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  if v_id is null then
    raise exception '어느 글인지 알 수 없습니다';
  end if;
  select by_user, state into v_owner, v_state from wanted where id = v_id;
  if v_owner is null then
    raise exception '그 글을 찾을 수 없습니다';
  end if;
  if v_owner <> v_uid then
    raise exception '올리신 분만 고칠 수 있습니다';
  end if;
  if v_state <> 'open' then
    raise exception '찾는 중인 글만 고칠 수 있습니다';
  end if;

  if p ? 'title' then
    if char_length(btrim(coalesce(p->>'title',''))) < 2 then
      raise exception '제목을 두 글자 이상 적어 주세요';
    end if;
    if char_length(btrim(p->>'title')) > 60 then
      raise exception '제목이 너무 깁니다 (60자)';
    end if;
    update wanted set title = btrim(p->>'title'), updated_at = now()
     where id = v_id;
  end if;

  if p ? 'body' then
    if char_length(btrim(coalesce(p->>'body',''))) < 5 then
      raise exception '내용을 다섯 글자 이상 적어 주세요';
    end if;
    if char_length(btrim(p->>'body')) > 2000 then
      raise exception '내용이 너무 깁니다 (2000자)';
    end if;
    update wanted set body = btrim(p->>'body'), updated_at = now()
     where id = v_id;
  end if;

  -- ⚠️ 예산을 **지우실 수도** 있어야 합니다 — 빈 글자를 보내면 null 로
  if p ? 'budget' then
    if btrim(coalesce(p->>'budget','')) = '' then
      update wanted set budget = null, updated_at = now() where id = v_id;
    else
      begin
        v_budget := btrim(p->>'budget')::int;
      exception when others then
        raise exception '예산은 숫자로 적어 주세요';
      end;
      if v_budget < 0 or v_budget > 100000000 then
        raise exception '예산이 올바르지 않습니다';
      end if;
      update wanted set budget = v_budget, updated_at = now() where id = v_id;
    end if;
  end if;

  if p ? 'when_txt' then
    if char_length(btrim(coalesce(p->>'when_txt',''))) > 60 then
      raise exception '언제 필요하신지가 너무 깁니다 (60자)';
    end if;
    update wanted set when_txt = nullif(btrim(p->>'when_txt'), ''),
                      updated_at = now()
     where id = v_id;
  end if;
end $$;
revoke all on function edit_wanted(jsonb) from public;
grant execute on function edit_wanted(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑦ 문 — 답합니다 ("제가 해 드릴 수 있습니다")
-- ════════════════════════════════════════════════════════════════════
create or replace function reply_wanted(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_w       uuid := nullif(btrim(coalesce(p->>'w_id','')), '')::uuid;
  v_body    text := nullif(btrim(coalesce(p->>'body','')), '');
  v_contact text := nullif(btrim(coalesce(p->>'contact','')), '');
  v_as_pro  text := nullif(btrim(coalesce(p->>'as_pro','')), '');
  v_owner   uuid;
  v_state   text;
  v_id      uuid;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  if v_w is null then
    raise exception '어느 글인지 알 수 없습니다';
  end if;
  select by_user, state into v_owner, v_state from wanted where id = v_w;
  if v_owner is null then
    raise exception '그 글을 찾을 수 없습니다';
  end if;
  if v_state <> 'open' then
    raise exception '이미 끝난 글입니다';
  end if;
  -- ⚠️ 제 글에는 답할 수 없습니다 (답 수를 제가 올리는 꼴입니다)
  if v_owner = v_uid then
    raise exception '올리신 글에는 답하실 수 없습니다';
  end if;
  if v_body is null or char_length(v_body) < 5 then
    raise exception '답을 다섯 글자 이상 적어 주세요';
  end if;
  if char_length(v_body) > 500 then
    raise exception '답이 너무 깁니다 (500자)';
  end if;
  if v_contact is null then
    raise exception '연락처를 적어 주세요';
  end if;
  if length(v_contact) > 100 then
    raise exception '연락처가 너무 깁니다';
  end if;

  -- ⚠️⚠️ **업체 이름으로 답하는 것은 고르는 것입니다** (0048 의 as_pro).
  --   ⚠️ 승인된 · 검사용이 아닌 업체여야 하고, **그 업체에 이어진
  --   분**이어야 합니다 — 남의 상호를 빌려 쓰지 못합니다.
  if v_as_pro is not null then
    if coalesce(my_provider(), '') <> v_as_pro then
      raise exception '그 업체의 담당자만 업체 이름으로 답할 수 있습니다';
    end if;
    if not exists (select 1 from provider
                    where id = v_as_pro and listed = true
                      and is_test = false and state = 'approved') then
      raise exception '지금은 업체 이름으로 답할 수 없습니다';
    end if;
  end if;

  if p->>'agree_at' is null then
    raise exception '개인정보 수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes'
     or (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의 시각이 올바르지 않습니다';
  end if;

  -- ⚠️ 한 글에 한 번만 — 표의 unique 가 막지만 **다른 말로** 거절합니다
  if exists (select 1 from wantedreply where w_id = v_w and by_user = v_uid) then
    raise exception '이미 답하셨습니다';
  end if;
  -- ⚠️ 쏟아붓기 — 하루에 서른 건까지
  if (select count(*) from wantedreply
       where by_user = v_uid and created_at > now() - interval '1 day') >= 30 then
    raise exception '오늘은 더 답하실 수 없습니다 (하루 서른 건)';
  end if;

  insert into wantedreply (w_id, by_user, as_pro, body, contact, agree_at)
  values (v_w, v_uid, v_as_pro, v_body, v_contact,
          (p->>'agree_at')::timestamptz)
  returning id into v_id;
  return v_id;
end $$;
revoke all on function reply_wanted(jsonb) from public;
grant execute on function reply_wanted(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑧ 문 — 답을 받아들이거나 거절합니다 (올린 분) · 거둡니다 (답한 분)
--   ⚠️⚠️⚠️ **받아들여도 연락처는 안 열립니다** (제17조 제2항).
--   여는 것은 ⑩ `share_wantedcontact` 이고 **각자 제 것만** 엽니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function move_wantedreply(p jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_id    uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_to    text := nullif(btrim(coalesce(p->>'to','')), '');
  v_owner uuid;
  v_by    uuid;
  v_cur   text;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  if v_id is null then
    raise exception '어느 답인지 알 수 없습니다';
  end if;
  if v_to is null or v_to not in ('accepted','rejected','canceled') then
    raise exception '옮길 자리가 올바르지 않습니다';
  end if;
  select w.by_user, r.by_user, r.state into v_owner, v_by, v_cur
    from wantedreply r join wanted w on w.id = r.w_id
   where r.id = v_id;
  if v_by is null then
    raise exception '그 답을 찾을 수 없습니다';
  end if;
  if v_cur <> 'replied' then
    raise exception '이미 처리된 답입니다';
  end if;

  -- ⚠️⚠️ **받아들이기 · 거절은 올린 분만, 거두기는 답한 분만**입니다.
  --   ⚠️ `coalesce(…, false)` 로 땅에 내려놓습니다 — SQL 에는 참 · 거짓
  --   말고 NULL 이 있고, `not (NULL or false)` 는 NULL 이라 `if` 에
  --   안 걸립니다 (0034 에서 남의 일정을 누구나 취소할 수 있던 자리).
  if v_to in ('accepted','rejected') then
    if not coalesce(v_owner = v_uid, false) then
      raise exception '글을 올리신 분만 하실 수 있습니다';
    end if;
  else
    if not coalesce(v_by = v_uid, false) then
      raise exception '답하신 분만 거두실 수 있습니다';
    end if;
  end if;

  update wantedreply set state = v_to where id = v_id;
end $$;
revoke all on function move_wantedreply(jsonb) from public;
grant execute on function move_wantedreply(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑨ 문 — 글을 내리거나 "구했습니다" 로 옮깁니다 (올린 분만)
-- ════════════════════════════════════════════════════════════════════
create or replace function close_wanted(p jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_id    uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_to    text := coalesce(nullif(btrim(coalesce(p->>'to','')), ''), 'closed');
  v_owner uuid;
  v_state text;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  if v_id is null then
    raise exception '어느 글인지 알 수 없습니다';
  end if;
  if v_to not in ('done','closed') then
    raise exception '옮길 자리가 올바르지 않습니다';
  end if;
  select by_user, state into v_owner, v_state from wanted where id = v_id;
  if v_owner is null then
    raise exception '그 글을 찾을 수 없습니다';
  end if;
  -- ⚠️ 내리는 문은 **올린 사람만** 씁니다 — 운영자가 가리는 길은 ⑪ 입니다
  if v_owner <> v_uid then
    raise exception '올리신 분만 하실 수 있습니다';
  end if;
  if v_state <> 'open' then
    raise exception '이미 끝난 글입니다';
  end if;
  update wanted set state = v_to, updated_at = now() where id = v_id;
end $$;
revoke all on function close_wanted(jsonb) from public;
grant execute on function close_wanted(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑩ 문 — 연락처를 **각자 제 것만** 엽니다 · 언제든 닫습니다
--   ⚠️⚠️⚠️ **받아들이기만으로는 안 열립니다** (제17조 제2항). 받아들이는
--   것은 "얘기해 봅시다" 이지 "내 번호를 줘도 좋다" 가 아닙니다.
--   ⚠️ **맞바꾸기를 강요하지 않습니다** — 한쪽만 열어도 그쪽 것만 갑니다
--   (강요하면 "줘야 받는" 구조가 되어 사실상 강제 동의입니다).
-- ════════════════════════════════════════════════════════════════════
create or replace function share_wantedcontact(p jsonb)
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
  if v_id is null then raise exception '어느 답인지 알 수 없습니다'; end if;
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

  select r.by_user, r.state, w.by_user into v_by, v_st, v_own
    from wantedreply r join wanted w on w.id = r.w_id
   where r.id = v_id;
  if v_st is null then raise exception '그런 답이 없습니다'; end if;
  if v_st <> 'accepted' then
    raise exception '받아들인 뒤에 고르실 수 있습니다';
  end if;

  if coalesce(v_own = v_uid, false) then
    update wantedreply
       set owner_share_at = case when v_on then now() else null end
     where id = v_id;
    return case when v_on then 'owner_shared' else 'owner_hidden' end;
  elsif coalesce(v_by = v_uid, false) then
    update wantedreply
       set helper_share_at = case when v_on then now() else null end
     where id = v_id;
    return case when v_on then 'helper_shared' else 'helper_hidden' end;
  end if;
  raise exception '이 답과 관계가 없습니다';
end $$;
revoke all on function share_wantedcontact(jsonb) from public;
grant execute on function share_wantedcontact(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑪ 문 — 운영자가 가립니다 (0049 · 0056 과 같은 꼴)
--   ⚠️ 글쓴이가 내리는 길(`close_wanted`)과 **다른 일**이라 문을
--   갈라 둡니다 (내린 것은 글쓴이의 뜻, 가린 것은 운영자의 판단).
--   ⚠️⚠️ **까닭이 반드시** 있습니다 — 까닭 없이 가릴 수 있으면
--   불평이 들어올 때마다 지워 주는 자리가 됩니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function move_wanted(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid  uuid := auth.uid();
  v_id   uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_why  text := nullif(btrim(coalesce(p->>'why','')), '');
  v_st   text;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  -- ⚠️⚠️⚠️ **`my_role()` 은 text 가 아니라 enum(`app_role`) 을 돌려줍니다.**
  --   처음에 `coalesce(my_role(), '')` 로 적었는데, 그 빈 글자가
  --   `''::app_role` 로 맞춰지면서 **누가 부르든 거기서 터졌습니다**
  --   (`invalid input value for enum app_role: ""`). 즉 구합니다 글을
  --   가리는 길이 **아무에게도 없었습니다.**
  --   ⚠️⚠️ 그런데 검사는 속았습니다 — 거절되는 것은 맞으니 `denied()`
  --   가 통과하고, 정작 **어느 자물쇠가 막는지는 안 봤습니다.** 작업
  --   기억의 "에러 글자까지 맞춰 보고, 자물쇠마다 다른 말로 거절하게
  --   두세요" 가 그대로 걸린 자리입니다.
  --   ⚠️ 고친 꼴은 이 저장소의 다른 자리와 **같습니다** —
  --   `coalesce(my_role() in (...), false)` (0040 · 0048 · 0051 · 0052).
  if not coalesce(my_role() in ('staff','admin'), false) then
    raise exception '가리는 것은 운영자만 할 수 있습니다';
  end if;
  if v_id is null then raise exception '어느 글인지 알 수 없습니다'; end if;
  -- ⚠️⚠️ 까닭을 **반드시** 받습니다 — 까닭 없이 가릴 수 있으면 불평이
  --   올 때마다 지워 주는 자리가 됩니다
  if v_why is null or char_length(v_why) < 5 then
    raise exception '가리는 까닭을 다섯 글자 이상 적어 주세요';
  end if;
  if char_length(v_why) > 300 then
    raise exception '까닭이 너무 깁니다 (300자)';
  end if;

  select state into v_st from wanted where id = v_id for update;
  if v_st is null then raise exception '그런 글이 없습니다'; end if;
  if v_st = 'hidden' then raise exception '이미 가려진 글입니다'; end if;

  update wanted set state = 'hidden', hidden_why = v_why,
                    hidden_by = v_uid, hidden_at = now(), updated_at = now()
   where id = v_id;

  -- ⚠️ 감사 기록에 **본문을 넣지 않습니다** (오래 남고 보는 사람도 넓습니다)
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, data)
  values (v_uid, my_role(), 'wanted', v_id::text, v_st, 'hidden',
          jsonb_build_object('why_len', char_length(v_why)));
  return 'hidden';
end $$;
revoke all on function move_wanted(jsonb) from public;
grant execute on function move_wanted(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑫ 신고 — **새 표를 안 만들고** `report` 에 칸을 하나 더합니다
--   ⚠️⚠️ **칸만 더하면 아무도 그 칸을 못 씁니다.** `open_report` 가 그
--   열쇠를 모르면 그 칸은 **영원히 null** 이고, 운영자 화면의 "이 글
--   가리기" 가지는 죽은 코드가 됩니다 (이 저장소가 "만들어 놓고 안 쓰는
--   칸" 을 다섯 번 겪은 자리). 그래서 문을 **같이** 고칩니다.
--   체인: open_report (0040 → 0046 → 0047 → 0048 → 0056 → 0060 → **0061**)
--   ⚠️ 내려갔는지 보는 법:
--       select pg_get_functiondef('open_report(jsonb)'::regprocedure)
--         like '%wanted_id%';
-- ════════════════════════════════════════════════════════════════════
alter table report add column if not exists wanted_id uuid
  references wanted(id) on delete cascade;
create index if not exists report_wanted_idx on report (wanted_id)
  where wanted_id is not null;


-- ⚠️⚠️⚠️ **`report_target_ck` 를 같이 늘립니다 — 0060 이 빠뜨렸습니다.**
--   0040 이 "가리키는 칸 가운데 **하나는 있어야 한다**" 를 check 로
--   두었고, 0046 · 0047 · 0048 · 0056 은 칸을 더할 때마다 그 check 를
--   다시 세웠습니다. 그런데 **0060 은 `teetime_id` 를 더하고 check 를
--   안 고쳤습니다** — 그래서 2026-11-06 부터 **티타임 자리를 신고하면
--   표가 거절**했고(`report_target_ck`), `js/adminrep.js` 의
--   "티타임 자리 가리기" 가지는 한 번도 돌 수 없는 죽은 코드였습니다.
--   `sql/teetime.js` 가 `open_report` 를 **안 눌러 봤기** 때문에
--   아무도 몰랐습니다 (0061 의 검사가 같은 자리를 눌러서 드러났습니다).
--   ⚠️⚠️ **칸을 더하는 날 이 check 도 같이** 고치세요 —
--   `check-chains` 는 함수 · 보기 · 정책만 셉니다(제약은 안 셉니다).
--   ⚠️ 그래서 앞 번호(0056)를 **따로 다시 붙여 넣으면** 이 늘림이
--   조용히 풀립니다 (0053 의 칸 GRANT 와 같은 자리입니다). 붙여넣기
--   파일을 통째로 쓰면 0061 이 뒤에 와서 다시 늘립니다.
--   되돌아갔는지 보는 법:
--     select pg_get_constraintdef(oid) from pg_constraint
--      where conname = 'report_target_ck';
alter table report drop constraint if exists report_target_ck;
alter table report add  constraint report_target_ck check (
  request_id is not null or provider_id is not null
  or review_id is not null or joinroom_id is not null
  or cq_id is not null or ca_id is not null or jobpost_id is not null
  or listing_id is not null or teetime_id is not null
  or wanted_id is not null);

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
  -- ⚠️ 0061 — 회원이 올린 구합니다 글도 신고할 수 있습니다
  v_wt   uuid := nullif(btrim(coalesce(p->>'wanted', '')), '')::uuid;
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
     and v_tt is null and v_wt is null then
    raise exception '무엇에 대한 것인지 적어 주세요 (요청 · 업체 · 후기 · 조인 · 글 · 매물 · 티타임 · 구합니다 가운데 하나)';
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
     and teetime_id is not distinct from v_tt
     and wanted_id is not distinct from v_wt;
  if v_dup > 0 then
    raise exception '같은 건으로 이미 접수된 것이 있습니다 — 운영자가 보고 있습니다';
  end if;

  insert into report (kind, request_id, provider_id, review_id, joinroom_id,
                      cq_id, ca_id, jobpost_id, listing_id, teetime_id,
                      wanted_id, by_user, body)
  values (v_kind, v_req, v_pv, v_rv, v_jr, v_cq, v_ca, v_jp, v_ls, v_tt,
          v_wt, v_me, v_body)
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
-- ⑬ 알림 (0050) — **밖으로 안 보냅니다.** 화면 안에서만 알립니다.
--   ⚠️⚠️ **제약 이름을 글자로 박지 않습니다** — 0050 은 칸 안에 그냥
--   `check (kind in (...))` 로 적어 이름을 Postgres 가 지어 줍니다.
--   이름이 다른 날 옛 제약이 **그대로 남고** 새 갈래를 거절하면서
--   에러는 트리거 안에서 조용히 나고 **알림만 안 붙습니다** (0053 의
--   그 자리). 그래서 그 칸을 지키는 check 를 **찾아서** 떼어 냅니다.
-- ════════════════════════════════════════════════════════════════════
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
   'answer','hidden','inquiry','listingask','listingmoved','watch',
   'teebook','teemoved','wantedreply','wantedmoved'));

-- 내 구합니다 글에 답이 들어왔습니다 → 올리신 분에게
create or replace function notice_wantedreply() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_to uuid;
begin
  select w.by_user into v_to from wanted w where w.id = new.w_id;
  perform notify_one(v_to, 'wantedreply', '올리신 글에 답이 들어왔습니다',
                     '/my', 'wanted', new.w_id::text);
  return null;
end $$;
revoke all on function notice_wantedreply() from public;
drop trigger if exists notice_wantedreply_t on wantedreply;
create trigger notice_wantedreply_t after insert on wantedreply
  for each row execute function notice_wantedreply();

-- 답이 처리되었습니다 → 답하신 분에게
create or replace function notice_wantedmoved() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.state = old.state or new.state not in ('accepted','rejected') then
    return null;
  end if;
  perform notify_one(new.by_user, 'wantedmoved',
    case when new.state = 'accepted' then '보내신 답이 받아들여졌습니다'
         else '보내신 답이 거절되었습니다' end,
    '/my', 'wantedreply', new.id::text);
  return null;
end $$;
revoke all on function notice_wantedmoved() from public;
drop trigger if exists notice_wantedmoved_t on wantedreply;
create trigger notice_wantedmoved_t after update of state on wantedreply
  for each row execute function notice_wantedmoved();

-- 글이 가려졌습니다 → 올리신 분에게
--   ⚠️ 갈래는 0050 의 `hidden` 을 그대로 씁니다 (가리는 것은 무엇이든
--   같은 말이라, 갈래를 늘리면 화면이 아이콘을 또 골라야 합니다)
create or replace function notice_hidden_wanted() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.state = old.state or new.state <> 'hidden' then return null; end if;
  perform notify_one(new.by_user, 'hidden', '올리신 구합니다 글이 가려졌습니다',
                     '/my', 'wanted', new.id::text);
  return null;
end $$;
revoke all on function notice_hidden_wanted() from public;
drop trigger if exists notice_hidden_wanted_t on wanted;
create trigger notice_hidden_wanted_t after update of state on wanted
  for each row execute function notice_hidden_wanted();

insert into schema_version (n, name) values (61, '0061_wanted')
  on conflict (n) do nothing;

commit;

/* ---------------------------- 0062_ad_home_slots.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0062 — 메인 광고 자리 넷 (지시서 B)
--
-- ⚠️⚠️ **키는 더하기만 합니다.** `ad_run.place` 가 이 enum 을 글자로
--   들고 있어서, 이름을 바꾸면 이미 들어간 광고가 갈 곳을 잃습니다.
--   그래서 지시서의 네 자리를 이렇게 맞춥니다 —
--     HOME_PREMIUM    → **`main_hero`** (이미 있습니다 · 같은 자리입니다)
--     HOME_SPONSOR_A  → `home_sponsor_a`   (새로)
--     HOME_SPONSOR_B  → `home_sponsor_b`   (새로)
--     HOME_BOTTOM     → `home_bottom`      (새로)
--   `main_band`(메인 가운데 띠)는 그대로 둡니다 — 쓰고 있는 자리입니다.
--
-- ⚠️⚠️⚠️ **`alter type … add value` 는 같은 트랜잭션 안에서 그 값을
--   쓸 수 없습니다.** 여기서는 더하기만 하고 쓰지 않으므로 괜찮습니다.
--   뒤에서 이 값으로 줄을 넣는 SQL 을 같은 파일에 적지 마세요.
--
-- ⚠️ `check-deal` 이 `create type` 과 `alter type … add value` 를 **합쳐서**
--   화면의 `AM_AD_PLACE` 와 맞춰 봅니다 — 한쪽만 고치면 빌드가 멈춥니다.
--
-- 되돌아갔는지 보는 법:
--   select unnest(enum_range(null::ad_place));
--   → home_sponsor_a · home_sponsor_b · home_bottom 셋이 보이면 올라간 것입니다.
-- ════════════════════════════════════════════════════════════════════
begin;

alter type ad_place add value if not exists 'home_sponsor_a';
alter type ad_place add value if not exists 'home_sponsor_b';
alter type ad_place add value if not exists 'home_bottom';

commit;

begin;
insert into schema_version (n, name) values (62, '0062_ad_home_slots')
  on conflict (n) do nothing;
commit;

/* ---------------------------- 0063_guest_board.sql ---------------------------- */
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
-- ⚠️⚠️⚠️ **`create or replace` 가 아니라 지우고 다시 만듭니다.**
--   0065 가 이 문의 **돌려주는 것**을 `void` 에서 `text` 로 바꿉니다
--   (비밀번호 갈래만 예외를 안 쓰고 글자로 돌려줍니다 — 예외는 틀린
--   시도를 적은 줄까지 되돌리기 때문입니다). 그런데 여기가
--   `create or replace` 이면, 사장님이 붙여넣기 파일을 **두 번째로**
--   붙여 넣는 날 이 줄에서
--   `cannot change return type of existing function` 으로 **멈춥니다**
--   (0064 가 `v_ad_live` 에 칸을 더해 0026 · 0032 · 0055 가 멈춘 그 자리).
--   ⚠️ 지우면 GRANT 도 같이 날아가므로 바로 아래에서 다시 줍니다.
--   ⚠️⚠️ 이 줄을 고쳐도 되는 까닭 — 운영 DB 는 아직 **0007 까지만**
--   올라가 있어 이 파일이 운영에서 한 번도 돌 적이 없습니다.
drop function if exists edit_cq_guest(jsonb);
create function edit_cq_guest(p jsonb)
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
-- ⚠️⚠️⚠️ **`create or replace` 가 아니라 지우고 다시 만듭니다.**
--   0065 가 이 문의 **돌려주는 것**을 `void` 에서 `text` 로 바꿉니다
--   (비밀번호 갈래만 예외를 안 쓰고 글자로 돌려줍니다 — 예외는 틀린
--   시도를 적은 줄까지 되돌리기 때문입니다). 그런데 여기가
--   `create or replace` 이면, 사장님이 붙여넣기 파일을 **두 번째로**
--   붙여 넣는 날 이 줄에서
--   `cannot change return type of existing function` 으로 **멈춥니다**
--   (0064 가 `v_ad_live` 에 칸을 더해 0026 · 0032 · 0055 가 멈춘 그 자리).
--   ⚠️ 지우면 GRANT 도 같이 날아가므로 바로 아래에서 다시 줍니다.
--   ⚠️⚠️ 이 줄을 고쳐도 되는 까닭 — 운영 DB 는 아직 **0007 까지만**
--   올라가 있어 이 파일이 운영에서 한 번도 돌 적이 없습니다.
drop function if exists drop_cq_guest(jsonb);
create function drop_cq_guest(p jsonb)
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

/* ---------------------------- 0064_ad_creative.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0064 — 광고 소재(PC · 모바일) · 클릭 주소 · 청구 · 수납 · 환불 ·
--        노출 · 클릭 집계
--        (최종 작업지시서 B — 2026-11-07)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **2026-11-07 까지 `ad_run` 에 그림을 담는 칸이 한 줄도
--   없었습니다.** 0026 이 표를 세우고 0055 가 보기를 좁히고 0026+0032 가
--   관리 화면까지 세웠는데, 담긴 것은 **업체 · 자리 · 기간 · 금액**뿐이고
--   손님 화면은 `js/adslot.js` 가 **상호 글자만** 띄우고 있었습니다.
--   즉 지시서가 요구한 "소재 PC/모바일" 을 넣을 자리가 **없었습니다** —
--   배너 광고를 파실 수가 없는 상태였습니다.
--
-- ⚠️⚠️⚠️ **그리고 0062 가 자리 셋을 더하면서 `save_ad` 를 안 고쳤습니다.**
--   0036 의 그 문은 자리 이름을 **글자로 박아** 가립니다 —
--       if v_pl not in ('main_hero','main_band','cat_top','region')
--   그래서 `home_sponsor_a` · `home_sponsor_b` · `home_bottom` 은 enum 에
--   는 있는데 **문이 거절**했습니다. /admin 의 고르개에는 보이고 누르면
--   "광고 자리를 … 중에서 골라 주세요" 가 떴을 것입니다. 지금은 **enum
--   자체를 읽어** 가립니다 (자리를 더하는 날 고칠 자리가 하나로 줄었습니다).
--   ⚠️ 이것이 "같은 규칙을 두 곳에 적은" 자리의 또 한 판입니다.
--
-- ⚠️⚠️ **계약액과 실제 매출을 갈라 둡니다** (지시서 B).
--   `ad_run.price` 는 **계약액**(적어 둔 값)이고, 실제로 오간 돈은
--   `ad_bill` **줄**입니다 — 청구 · 수납 · 환불이 각각 한 줄입니다.
--   실매출 = 수납 합 − 환불 합 이고, 그 셈은 보기 `v_ad_money` 한 곳에
--   있습니다. 칸에 합계를 저장하지 않습니다 (절대 규칙 1 — 칸으로
--   들고 있으면 누군가 그 칸에 숫자를 적어 넣습니다).
--   ⚠️ 줄은 **더하기만** 합니다. 잘못 적으신 줄은 관리자가 까닭과 함께
--   뺄 수 있고 그 뺀 일이 감사 기록에 남습니다.
--
-- ⚠️⚠️⚠️ **노출 · 클릭은 "브라우저가 보낸 것을 센 값" 입니다.**
--   `bump_ad` 는 로그인하지 않은 분도 부릅니다 (광고는 비로그인 손님이
--   더 많이 봅니다). 그러니 **봇 · 중복이 섞입니다** — 그 사실을 관리자
--   화면이 그 자리에서 말하고, **청구 근거로 쓰지 말라고** 적습니다.
--   세는 것을 숨기고 "노출 수" 라고만 적으면 그건 지어낸 숫자입니다
--   (절대 규칙 1).
--   ⚠️ 그래서 **사람 정보를 한 글자도 안 담습니다** — 광고 id · 날짜 ·
--   수 셋뿐입니다 (IP 도 · user agent 도 · 회원 id 도 없습니다).
--   ⚠️⚠️ 날짜는 **Asia/Seoul** 입니다 (`kst_today()` · 0060) — UTC 로
--   세면 한국 시각 00:00~09:00 의 노출이 **어제 칸**에 쌓입니다.
--
-- ⚠️⚠️ **클릭 주소는 DB 가 가립니다** (지시서 B — "클릭 대상 URL 안전성
--   검증"). 화면에서만 가리면 꾸러미를 고쳐 `javascript:` 를 꽂을 수
--   있습니다. check 가 받는 것은 둘뿐입니다 —
--       ① `https://` 로 시작하고 `@` 가 없는 바깥 주소
--       ② `/` 하나로 시작하는 **우리 주소** (`//` 는 열린 넘겨주기입니다)
--   ⚠️ 비우면 **업체 화면**(`/pro/<id>`)으로 갑니다 — 그 자리가 지금까지
--   쓰던 길이고, 빌드에 없는 업체면 `js/adslot.js` 가 링크를 안 겁니다.
--
-- ⚠️⚠️ **소재 경로는 문이 짓습니다** (0051 과 같은 규칙) —
--   `ad/<광고 id>/<pc|mo>/<이름>` 이고 표의 check 가 그 꼴을 **다시**
--   봅니다. 화면이 지으면 남의 광고 칸에 쓸 수 있습니다.
--   ⚠️⚠️ 버킷은 **공개 버킷**(`PROVIDER_BUCKET`)입니다 — 배너는 정적
--   HTML 이 아니라 브라우저가 그리지만, 10분짜리 서명 주소로는 캐시가
--   안 되고 손님마다 서버를 한 번 더 두드립니다. 광고 그림은 공개가
--   맞습니다 (증빙서류와 **정반대**입니다 — 그쪽은 비공개 버킷입니다).
--   ⚠️⚠️⚠️ 버킷을 고르는 것은 **서버**입니다 (`api/upload.js` 의
--   `bucketForPath()`) — 화면이 고르게 두면 서류를 공개 버킷에 올릴 수
--   있습니다.
--
-- 되돌아갔는지 보는 법
--   select count(*) from information_schema.columns
--    where table_name = 'ad_run' and column_name in ('img_pc','img_mo');  -- 2
--   select pg_get_viewdef('v_ad_live'::regclass) ilike '%img_pc%';        -- t
--   select pg_get_functiondef('save_ad'::regclass) ilike '%enum_range%';  -- t
-- ════════════════════════════════════════════════════════════════════
begin;

-- ── ① ad_run 에 칸을 더합니다 ──────────────────────────────────────
-- ⚠️ 전부 **비울 수 있습니다** — 이미 들어 있는 줄이 있을 수 있고
--   (그 줄은 소재 없이 상호만 띄우던 광고입니다), 비면 화면이 전과
--   똑같이 동작합니다.
alter table ad_run add column if not exists advertiser text;
alter table ad_run add column if not exists click_url  text;
alter table ad_run add column if not exists img_pc     text;
alter table ad_run add column if not exists img_mo     text;
alter table ad_run add column if not exists img_alt    text;

-- ⚠️⚠️ 글자 길이를 막습니다 — 광고주 이름 자리에 글을 적어 넣으면
--   손님 화면의 배너가 통째로 밀립니다.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ad_run_advertiser_ck') then
    alter table ad_run add constraint ad_run_advertiser_ck
      check (advertiser is null or
             (btrim(advertiser) <> '' and char_length(advertiser) <= 60));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ad_run_alt_ck') then
    alter table ad_run add constraint ad_run_alt_ck
      check (img_alt is null or
             (btrim(img_alt) <> '' and char_length(img_alt) <= 120));
  end if;

  -- ⚠️⚠️⚠️ 클릭 주소 — 여기가 자물쇠입니다 (위 머리말)
  if not exists (select 1 from pg_constraint where conname = 'ad_run_click_ck') then
    alter table ad_run add constraint ad_run_click_ck
      check (
        click_url is null or (
          char_length(click_url) <= 500
          and position('@' in click_url) = 0
          and position(' ' in click_url) = 0
          and (
            click_url ~ '^https://[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(/|\?|$)'
            or click_url ~ '^/[a-z0-9]'
          )
        )
      );
  end if;

  -- ⚠️ 소재 경로의 꼴 — 문이 지은 것만 들어갑니다
  if not exists (select 1 from pg_constraint where conname = 'ad_run_img_pc_ck') then
    alter table ad_run add constraint ad_run_img_pc_ck
      check (img_pc is null or img_pc ~ '^ad/[0-9a-f-]{36}/pc/[A-Za-z0-9._-]{1,80}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ad_run_img_mo_ck') then
    alter table ad_run add constraint ad_run_img_mo_ck
      check (img_mo is null or img_mo ~ '^ad/[0-9a-f-]{36}/mo/[A-Za-z0-9._-]{1,80}$');
  end if;
end $$;

-- ── ①-2 ad_run_where — **자리 이름을 글자로 박지 않습니다** ─────
-- ⚠️⚠️⚠️ **0062 가 자리 셋을 더하고 이 check 를 안 고쳤습니다.**
--   0026 은 이렇게 적어 두었습니다 —
--       or place in ('main_hero','main_band')
--   그래서 `home_sponsor_a` · `home_sponsor_b` · `home_bottom` 은 enum 에는
--   있는데 **표가 거절**했습니다. 자물쇠가 둘이었고(문의 글자 목록 ·
--   표의 check) **둘 다** 그 자리에서 가로막았습니다.
-- ⚠️ 지금은 **뒤집어 적습니다** — "분류 상단이면 분류를, 지역
--   광고면 지역을, **그 밖은 아무 것도** 요구하지 않는다". 자리를
--   더하는 날 이 줄을 안 고쳐도 됩니다.
do $$
begin
  if exists (select 1 from pg_constraint where conname = 'ad_run_where') then
    alter table ad_run drop constraint ad_run_where;
  end if;
  alter table ad_run add constraint ad_run_where check (
    case place
      when 'cat_top' then cat_key is not null and btrim(cat_key) <> ''
      when 'region'  then region  is not null and btrim(region)  <> ''
      else true
    end
  );
end $$;

-- ⚠️ 칸을 더했으니 관리자가 읽을 수 있어야 합니다. 0026 은 `ad_run` 에
--   표 단위 select 를 주었으므로(칸 단위가 아닙니다) 따로 줄 것이
--   없습니다 — 아래로 확인만 해 둡니다.
--   select has_table_privilege('authenticated','ad_run','select');  -- t

-- ⚠️⚠️⚠️ **그런데 `anon` 에게 표 전체를 주고 있었습니다.** 0026 의
--   `ad_public` 정책이 "지금 돌고 있는 광고는 누구나" 이고 GRANT 가
--   **표 단위**라, 비로그인 손님이
--       /rest/v1/ad_run?select=price,note
--   로 **광고 단가와 운영자 메모를 그대로 읽을** 수 있었습니다.
--   RLS 는 **줄**은 막아도 **칸은 못 막습니다** (0053 에서 문의 메모로
--   겪은 그 자리이고, 0013 이 연락처 표를 가른 그 까닭입니다).
--   ⚠️ 공개로 읽는 길은 **보기 하나**(`v_ad_live`)이고 저장소의 어느
--   화면도 이 표를 비로그인으로 읽지 않습니다 (`js/` · `pages/` · `api/`
--   를 훑어 확인했습니다 — 읽는 곳은 `/admin` 하나이고 관리자입니다).
revoke select on ad_run from anon;


-- ── ② 청구 · 수납 · 환불 — 줄로 쌓습니다 ────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'ad_bill_kind') then
    create type ad_bill_kind as enum ('bill', 'pay', 'refund');
  end if;
end $$;

create table if not exists ad_bill (
  id      uuid primary key default gen_random_uuid(),
  ad_id   uuid         not null references ad_run(id) on delete cascade,
  kind    ad_bill_kind not null,
  amount  bigint       not null,
  on_day  date         not null,
  memo    text,
  by_user uuid references auth.users(id) on delete set null,
  at      timestamptz  not null default now(),
  -- ⚠️ 0 원짜리 청구 · 수납은 줄을 만들 까닭이 없습니다 (환불도 같습니다)
  constraint ad_bill_amount check (amount > 0),
  constraint ad_bill_memo   check (memo is null or
    (btrim(memo) <> '' and char_length(memo) <= 200))
);
create index if not exists ad_bill_ad_idx on ad_bill (ad_id, on_day desc);

alter table ad_bill enable row level security;
drop policy if exists adbill_admin on ad_bill;
drop policy if exists adbill_mine  on ad_bill;
-- ⚠️⚠️ **운영자만 봅니다.** 업체에 열면 "우리 광고가 얼마에 청구됐나" 를
--   업체가 보게 되는데, 그 값은 **계약서가 말하는 것**이고 화면이 말할
--   것이 아닙니다 (업체가 볼 수 있는 돈은 `settlement` 쪽입니다).
create policy adbill_admin on ad_bill for all
  using (my_role() in ('staff','admin')) with check (my_role() = 'admin');

revoke all on ad_bill from public, anon, authenticated;
grant select on ad_bill to authenticated;


-- ── ③ 노출 · 클릭 집계 ─────────────────────────────────────────────
-- ⚠️⚠️ **사람 정보를 한 글자도 안 담습니다** (위 머리말) — 광고 · 날짜 ·
--   수 셋뿐입니다. 누가 봤는지를 담기 시작하면 그날부터 처리 항목이
--   하나 늘어 개인정보 처리방침을 같이 고쳐야 합니다 (제30조).
create table if not exists ad_stat (
  ad_id  uuid   not null references ad_run(id) on delete cascade,
  on_day date   not null,
  views  bigint not null default 0,
  clicks bigint not null default 0,
  primary key (ad_id, on_day),
  constraint ad_stat_views  check (views  >= 0),
  constraint ad_stat_clicks check (clicks >= 0)
);

alter table ad_stat enable row level security;
drop policy if exists adstat_admin on ad_stat;
create policy adstat_admin on ad_stat for select
  using (my_role() in ('staff','admin'));

-- ⚠️⚠️⚠️ **쓰기 권한을 한 줄도 주지 않습니다.** 비로그인 손님이 세는
--   자리라 표를 열어 두면 아무 광고에 아무 수나 적어 넣을 수 있습니다 —
--   올라가는 길은 `bump_ad` 하나이고 그 문은 **+1 씩만** 올립니다.
revoke all on ad_stat from public, anon, authenticated;
grant select on ad_stat to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ④ save_ad (0036 → 0064) — 소재 · 클릭 주소 · 광고주 이름을 같이 받고,
--    **자리 목록을 enum 에서 읽습니다**
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ 0036 은 자리 이름 넷을 **글자로 박아** 두었고, 0062 가 셋을
--   더하면서 그 줄을 안 고쳤습니다 — 새 자리 셋은 **문이 거절**했습니다
--   (위 머리말). 지금은 `enum_range(null::ad_place)` 를 읽습니다.
-- ⚠️ 상태는 여기서 안 건드립니다 (`set_ad_state` 가 그 문입니다) —
--   새로 넣으면 늘 `draft` 입니다.
-- ⚠️⚠️ 소재 그림은 여기서 안 받습니다 — 경로는 `claim_ad_image` 가
--   **직접 지어** 넣습니다 (화면이 경로를 지으면 남의 광고 칸에 씁니다).
create or replace function save_ad(p jsonb)
  returns uuid language plpgsql security definer
  set search_path = public as $$
declare
  v_me  uuid := auth.uid();
  v_id  uuid := nullif(btrim(coalesce(p->>'id', '')), '')::uuid;
  v_pv  text := nullif(btrim(coalesce(p->>'provider', '')), '');
  v_pl  text := nullif(btrim(coalesce(p->>'place', '')), '');
  v_why text := nullif(btrim(coalesce(p->>'why', '')), '');
  v_adv text := nullif(btrim(coalesce(p->>'advertiser', '')), '');
  v_url text := nullif(btrim(coalesce(p->>'click_url', '')), '');
  v_alt text := nullif(btrim(coalesce(p->>'img_alt', '')), '');
  v_price bigint;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if my_role() <> 'admin' then
    raise exception '광고 집행은 관리자만 넣습니다';
  end if;
  if v_why is null then
    raise exception '까닭을 적어야 합니다 — 감사 기록에 남습니다';
  end if;
  if v_pv is null then raise exception '어느 업체인지 골라 주세요'; end if;
  if not exists (select 1 from provider where id = v_pv) then
    raise exception '없는 업체입니다 — %', v_pv;
  end if;
  if v_pl is null then raise exception '어느 자리인지 골라 주세요'; end if;

  -- ⚠️⚠️⚠️ **enum 에서 읽습니다** — 글자로 박았다가 0062 의 자리 셋이
  --   거절당했습니다 (위 머리말).
  if v_pl <> all (select unnest(enum_range(null::ad_place))::text) then
    raise exception '그런 광고 자리가 없습니다 — %', v_pl;
  end if;

  begin
    v_price := (p->>'price')::bigint;
  exception when others then
    raise exception '광고 금액을 숫자로 적어 주세요';
  end;
  -- ⚠️ 0 원도 됩니다 (무상 노출) — 안 적은 것만 막습니다.
  if p->'price' is null or jsonb_typeof(p->'price') = 'null' then
    raise exception '광고 금액을 적어 주세요 (무상이면 0)';
  end if;

  -- ⚠️⚠️ 클릭 주소는 표의 check 가 가립니다 — 그 거절을 **사람 말로**
  --   바꿔 주기 위해 여기서 한 번 더 봅니다 (자물쇠 둘이 **다른 말**로
  --   거절하게 두는 그 규칙입니다).
  if v_url is not null and not (
       v_url ~ '^https://[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(/|\?|$)'
       or v_url ~ '^/[a-z0-9]') then
    raise exception '클릭 주소는 https:// 로 시작하는 주소나 우리 사이트 주소(/로 시작)만 됩니다';
  end if;
  if v_url is not null and position('@' in v_url) > 0 then
    raise exception '클릭 주소에 @ 를 넣을 수 없습니다';
  end if;

  if v_id is null then
    insert into ad_run (provider_id, place, cat_key, region,
                        starts_on, ends_on, price, state, note, by_user,
                        advertiser, click_url, img_alt)
    values (v_pv, v_pl::ad_place,
            nullif(btrim(coalesce(p->>'cat_key', '')), ''),
            nullif(btrim(coalesce(p->>'region', '')), ''),
            (p->>'starts_on')::date, (p->>'ends_on')::date,
            v_price, 'draft', nullif(btrim(coalesce(p->>'note', '')), ''), v_me,
            v_adv, v_url, v_alt)
    returning id into v_id;
  else
    update ad_run set provider_id = v_pv, place = v_pl::ad_place,
           cat_key = nullif(btrim(coalesce(p->>'cat_key', '')), ''),
           region  = nullif(btrim(coalesce(p->>'region', '')), ''),
           starts_on = (p->>'starts_on')::date,
           ends_on   = (p->>'ends_on')::date,
           price = v_price,
           note = nullif(btrim(coalesce(p->>'note', '')), ''),
           by_user = v_me,
           advertiser = v_adv, click_url = v_url, img_alt = v_alt
     where id = v_id;
    if not found then raise exception '그런 광고가 없습니다'; end if;
  end if;

  -- ⚠️ 기록에는 **값이 아니라 무엇을 적었는지**만 남깁니다 (광고주 이름은
  --   사람 이름일 수 있습니다 — 감사 기록은 오래 남고 보는 사람도 넓습니다).
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, 'admin', 'ad_run', v_id::text, 'draft', v_why,
          jsonb_build_object('provider_id', v_pv, 'place', v_pl,
                             'price', v_price,
                             'has_url', (v_url is not null),
                             'has_advertiser', (v_adv is not null)));
  return v_id;
end $$;


-- ════════════════════════════════════════════════════════════════════
-- ⑤ claim_ad_image — 소재를 올릴 **자리**를 내줍니다 (경로를 문이 짓습니다)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️ 0051 의 `claim_provider_photo` 와 같은 짜임새입니다 — 경로를
--   **문이 짓고** 표의 check 가 그 꼴을 다시 봅니다.
-- ⚠️ 형식은 지시서 B 의 셋뿐입니다 (WebP · JPG · PNG) — PDF 는 광고 소재가
--   아닙니다. ⚠️ 실제로 막는 것은 **버킷 설정**입니다 (여기서 받는
--   `mime` · `bytes` 는 적어 보낸 값입니다 — 0011 머리말과 같습니다).
create or replace function claim_ad_image(p jsonb)
  returns table (path text) language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_ad   uuid := nullif(btrim(coalesce(p->>'ad', '')), '')::uuid;
  v_kind text := lower(nullif(btrim(coalesce(p->>'kind', '')), ''));
  v_mime text := lower(nullif(btrim(coalesce(p->>'mime', '')), ''));
  v_by   bigint := coalesce((p->>'bytes')::bigint, 0);
  v_ext  text;
  v_path text;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if my_role() <> 'admin' then
    raise exception '광고 소재는 관리자만 올립니다';
  end if;
  if v_ad is null then raise exception '어느 광고인지 알 수 없습니다'; end if;
  if not exists (select 1 from ad_run where id = v_ad) then
    raise exception '그런 광고가 없습니다';
  end if;
  if v_kind not in ('pc', 'mo') then
    raise exception 'PC 소재인지 모바일 소재인지 골라 주세요';
  end if;
  if v_mime = 'image/jpeg' then v_ext := 'jpg';
  elsif v_mime = 'image/png'  then v_ext := 'png';
  elsif v_mime = 'image/webp' then v_ext := 'webp';
  else raise exception '광고 소재는 JPG · PNG · WEBP 만 올리실 수 있습니다';
  end if;
  -- ⚠️ 배너 한 장에 2MB 를 넘길 까닭이 없습니다 (가장 큰 규격이
  --   1200x200 입니다) — 손님 화면 맨 위에 걸리는 그림입니다.
  if v_by <= 0 or v_by > 2097152 then
    raise exception '광고 소재는 한 장에 2MB 까지 올리실 수 있습니다';
  end if;

  -- ⚠️⚠️ 이름을 **새로 짓습니다** — 보낸 파일 이름을 쓰면 한글 · 공백 ·
  --   `..` 이 경로에 들어갑니다. 바뀔 때마다 이름이 달라야 손님
  --   브라우저가 옛 그림을 계속 쓰지 않습니다 (`?v=` 와 같은 까닭).
  v_path := 'ad/' || v_ad::text || '/' || v_kind || '/' ||
            to_char(now(), 'YYYYMMDDHH24MISS') || '-' ||
            substr(replace(gen_random_uuid()::text, '-', ''), 1, 8) ||
            '.' || v_ext;

  if v_kind = 'pc' then
    update ad_run set img_pc = v_path where id = v_ad;
  else
    update ad_run set img_mo = v_path where id = v_ad;
  end if;

  -- ⚠️ 기록에 **경로만** 남깁니다 (그림은 공개 버킷이라 경로가 비밀이
  --   아닙니다 — 증빙서류와 정반대입니다).
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, 'admin', 'ad_run', v_ad::text, null, '광고 소재 올리기',
          jsonb_build_object('kind', v_kind, 'path', v_path));

  return query select v_path;
end $$;


-- ════════════════════════════════════════════════════════════════════
-- ⑥ drop_ad_image — 올린 소재를 뺍니다
-- ════════════════════════════════════════════════════════════════════
-- ⚠️ **파일을 지우지 않습니다** — 칸을 비웁니다. 공개 버킷의 파일은
--   운영자가 Supabase 에서 지우시고, 그 전까지 주소를 아는 사람은 열 수
--   있습니다 (그래서 광고 그림만 그 버킷에 둡니다).
create or replace function drop_ad_image(p jsonb)
  returns void language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_ad   uuid := nullif(btrim(coalesce(p->>'ad', '')), '')::uuid;
  v_kind text := lower(nullif(btrim(coalesce(p->>'kind', '')), ''));
  v_had  text;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if my_role() <> 'admin' then
    raise exception '광고 소재는 관리자만 뺍니다';
  end if;
  if v_kind not in ('pc', 'mo') then
    raise exception 'PC 소재인지 모바일 소재인지 골라 주세요';
  end if;

  if v_kind = 'pc' then
    select img_pc into v_had from ad_run where id = v_ad for update;
  else
    select img_mo into v_had from ad_run where id = v_ad for update;
  end if;
  -- ⚠️⚠️ **줄이 없는 것**과 **칸이 비어 있는 것**을 갈라서 봅니다
  --   (0063 의 `move_cq` 에서 섞어 놓아 비회원 글을 못 가렸던 자리).
  if not exists (select 1 from ad_run where id = v_ad) then
    raise exception '그런 광고가 없습니다';
  end if;
  if v_had is null then
    raise exception '그 자리에 올린 소재가 없습니다';
  end if;

  if v_kind = 'pc' then
    update ad_run set img_pc = null where id = v_ad;
  else
    update ad_run set img_mo = null where id = v_ad;
  end if;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, 'admin', 'ad_run', v_ad::text, null, '광고 소재 빼기',
          jsonb_build_object('kind', v_kind, 'path', v_had));
end $$;


-- ════════════════════════════════════════════════════════════════════
-- ⑦ save_ad_bill — 청구 · 수납 · 환불을 **한 줄씩** 적습니다
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️ **합계를 칸에 저장하지 않습니다** (절대 규칙 1) — 줄을 쌓고
--   보기(`v_ad_money`)가 셉니다. 칸으로 들고 있으면 누군가 그 칸에
--   숫자를 적어 넣습니다.
-- ⚠️⚠️ **환불이 수납보다 많을 수는 없습니다** — 그러면 받지도 않은 돈을
--   돌려준 것이 되어 실매출이 음수가 됩니다. 문이 막습니다.
create or replace function save_ad_bill(p jsonb)
  returns uuid language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_ad   uuid := nullif(btrim(coalesce(p->>'ad', '')), '')::uuid;
  v_kind text := lower(nullif(btrim(coalesce(p->>'kind', '')), ''));
  v_why  text := nullif(btrim(coalesce(p->>'why', '')), '');
  v_memo text := nullif(btrim(coalesce(p->>'memo', '')), '');
  v_amt  bigint;
  v_day  date;
  v_paid bigint;
  v_ref  bigint;
  v_id   uuid;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  -- ⚠️⚠️ **관리자만**입니다 (직원도 거절) — 계약을 따는 사람과 청구서를
  --   만드는 사람이 같으면 아무도 교차 확인을 안 합니다 (0003 과 같은 선).
  if my_role() <> 'admin' then
    raise exception '광고 청구 · 수납 · 환불은 관리자만 적습니다';
  end if;
  if v_why is null then
    raise exception '까닭을 적어야 합니다 — 감사 기록에 남습니다';
  end if;
  if v_ad is null or not exists (select 1 from ad_run where id = v_ad) then
    raise exception '그런 광고가 없습니다';
  end if;
  if v_kind not in ('bill', 'pay', 'refund') then
    raise exception '청구 · 수납 · 환불 가운데서 골라 주세요';
  end if;

  begin
    v_amt := (p->>'amount')::bigint;
  exception when others then
    raise exception '금액을 숫자로 적어 주세요';
  end;
  if v_amt is null or v_amt <= 0 then
    raise exception '금액은 0원보다 커야 합니다';
  end if;

  begin
    v_day := coalesce(nullif(btrim(coalesce(p->>'on_day', '')), '')::date, kst_today());
  exception when others then
    raise exception '날짜를 올바르게 골라 주세요';
  end;
  if v_day > kst_today() then
    raise exception '앞날 날짜로는 적을 수 없습니다';
  end if;

  if v_kind = 'refund' then
    select coalesce(sum(amount), 0) into v_paid
      from ad_bill where ad_id = v_ad and kind = 'pay';
    select coalesce(sum(amount), 0) into v_ref
      from ad_bill where ad_id = v_ad and kind = 'refund';
    if v_ref + v_amt > v_paid then
      raise exception '환불이 수납보다 많습니다 — 수납 %원 · 이미 환불 %원',
        v_paid, v_ref;
    end if;
  end if;

  insert into ad_bill (ad_id, kind, amount, on_day, memo, by_user)
  values (v_ad, v_kind::ad_bill_kind, v_amt, v_day, v_memo, v_me)
  returning id into v_id;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, 'admin', 'ad_bill', v_id::text, v_kind, v_why,
          jsonb_build_object('ad_id', v_ad::text, 'amount', v_amt,
                             'on_day', v_day::text));
  return v_id;
end $$;


-- ════════════════════════════════════════════════════════════════════
-- ⑧ drop_ad_bill — 잘못 적은 줄을 뺍니다
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️ 돈 기록을 지우는 일이라 **까닭이 반드시**이고, 뺀 일 자체가
--   감사 기록에 남습니다 (0037 의 "지우지 않고 가립니다" 와 다릅니다 —
--   이 표는 손님 글이 아니라 **잘못 적힌 숫자**이고, 남겨 두면 합계가
--   틀립니다).
create or replace function drop_ad_bill(p jsonb)
  returns void language plpgsql security definer
  set search_path = public as $$
declare
  v_me  uuid := auth.uid();
  v_id  uuid := nullif(btrim(coalesce(p->>'id', '')), '')::uuid;
  v_why text := nullif(btrim(coalesce(p->>'why', '')), '');
  v_ad  uuid;
  v_k   text;
  v_amt bigint;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if my_role() <> 'admin' then
    raise exception '광고 돈 기록은 관리자만 뺍니다';
  end if;
  if v_why is null then
    raise exception '까닭을 적어야 합니다 — 감사 기록에 남습니다';
  end if;

  select ad_id, kind::text, amount into v_ad, v_k, v_amt
    from ad_bill where id = v_id for update;
  if v_ad is null then raise exception '그런 기록이 없습니다'; end if;

  delete from ad_bill where id = v_id;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, 'admin', 'ad_bill', v_id::text, 'removed', v_why,
          jsonb_build_object('ad_id', v_ad::text, 'kind', v_k, 'amount', v_amt));
end $$;


-- ════════════════════════════════════════════════════════════════════
-- ⑨ bump_ad — 노출 · 클릭을 셉니다
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **비로그인 손님도 부릅니다** — 광고는 로그인하지 않은 분이 더
--   많이 봅니다. 그래서 **봇 · 중복이 섞입니다.** 그 사실을 관리자 화면이
--   그 자리에서 말하고 **청구 근거로 쓰지 말라고** 적습니다 — 숨기고
--   "노출 수" 라고만 적으면 그건 지어낸 숫자입니다 (절대 규칙 1).
-- ⚠️⚠️ **지금 돌고 있는 광고만** 셉니다 — 아니면 아무 광고에 수를 쌓을
--   수 있습니다 (조건은 `v_ad_live` 와 같은 뜻이고, 거기 안 걸리는 광고는
--   손님 화면에 아예 안 나오므로 셀 노출도 없습니다).
-- ⚠️ 날짜는 **Asia/Seoul** 입니다 (`kst_today()`).
-- ⚠️ 돌려주는 것이 없습니다 — 손님 화면이 이 값을 쓰지 않습니다
--   (쓰면 "몇 번 봤는지" 가 손님에게 보입니다).
create or replace function bump_ad(p jsonb)
  returns void language plpgsql security definer
  set search_path = public as $$
declare
  v_ad   uuid;
  v_kind text := lower(nullif(btrim(coalesce(p->>'kind', '')), ''));
begin
  begin
    v_ad := nullif(btrim(coalesce(p->>'ad', '')), '')::uuid;
  exception when others then
    return;                   -- ⚠️ 조용히 끝냅니다 (손님에게 할 말이 없습니다)
  end;
  if v_ad is null then return; end if;
  if v_kind not in ('view', 'click') then return; end if;

  if not exists (
    select 1 from ad_run a join provider pr on pr.id = a.provider_id
     where a.id = v_ad
       and a.state = 'live'
       and kst_today() between a.starts_on and a.ends_on
       and pr.is_test = false and pr.listed = true and pr.state = 'approved'
  ) then return; end if;

  insert into ad_stat (ad_id, on_day, views, clicks)
  values (v_ad, kst_today(),
          case when v_kind = 'view'  then 1 else 0 end,
          case when v_kind = 'click' then 1 else 0 end)
  on conflict (ad_id, on_day) do update
    set views  = ad_stat.views  + (case when v_kind = 'view'  then 1 else 0 end),
        clicks = ad_stat.clicks + (case when v_kind = 'click' then 1 else 0 end);
end $$;


-- ════════════════════════════════════════════════════════════════════
-- ⑩ v_ad_live (0026 → 0032 → 0055 → 0064) — 소재와 클릭 주소를 같이 냅니다
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️ **칸이 늘어나므로 `create or replace` 로는 안 됩니다** —
--   `cannot drop columns from view` 가 아니라 **칸을 더하는 것**도 순서가
--   바뀌면 거절됩니다. 그래서 drop + create 이고, **GRANT 를 바로 다시**
--   줍니다 (지우면 권한도 같이 날아갑니다 — 0044 에서 겪은 자리).
-- ⚠️⚠️ **`label` 을 보기가 들고 나옵니다** (0026) — 화면이 이 칸을 그대로
--   찍으므로 "광고" 표시를 빠뜨릴 수 없습니다. 지우지 마세요.
-- ⚠️ 좁히는 조건은 0055 가 정한 셋을 **그대로** 둡니다
--   (listed · is_test · state) — 공개 카드 보기와 같은 뜻이어야 합니다.
-- ⚠️⚠️⚠️ **계약액(`price`) · 운영자 메모(`note`)는 담지 않습니다.**
--   이 보기는 `anon` 에게 열려 있습니다 — 담으면 광고 단가가 공개됩니다.
-- ⚠️⚠️⚠️ **날짜가 `current_date`(UTC) 여서 한국 시각 00:00~09:00 에는
--   하루 밀렸습니다.** Supabase 는 UTC 이고, 관리자가 적는 기간은
--   **한국 날짜**입니다 — 그래서 11-08 부터 시작하는 광고가 한국
--   11-08 새방5부터 아토 09시까지 **안 나가고**, 11-07 에 끝나는 광고는
--   11-08 아토까지 **그대로 나갔습니다**(돈을 받은 날에 안 리고 안 받은
--   날에 리는 꼴입니다). 0046 의 `v_join_open` 이 밟은 그 자리이고,
--   0060 이 `kst_today()` 한 함수를 만들어 고친 그 자리입니다.
--   ⚠️ 정입니다 — **정책도 같이** 고친니다 (아래 ⑧-2). 두 자물쇠가 다른
--   날을 보면 한국 새방5에 표는 내주고 보기는 안 내주는 시각이 생깁니다.
drop view if exists v_ad_live;
create view v_ad_live as
  select a.id, a.provider_id, p.name as provider_name,
         a.place, a.cat_key, a.region, a.starts_on, a.ends_on,
         a.advertiser, a.click_url, a.img_pc, a.img_mo, a.img_alt,
         '광고'::text as label
    from ad_run a join provider p on p.id = a.provider_id
   where a.state = 'live'
     and kst_today() between a.starts_on and a.ends_on
     and p.is_test = false
     and p.listed = true
     and p.state = 'approved';
grant select on v_ad_live to anon, authenticated;

-- —— ⑧-2 ad_public 정책 (0026 → 0064) — 같은 날을 봅니다 ————————
-- ⚠️⚠️ 보기와 정책이 **다른 날**을 보면, 한국 새방5 00:00~09:00 에
--   `v_ad_live` 는 어제 광고를 빼는데 `ad_run` 정책은 아직 내주는
--   시각이 생깁니다. 같은 함수를 부릅니다.
drop policy if exists ad_public on ad_run;
create policy ad_public on ad_run for select
  using (state = 'live' and kst_today() between starts_on and ends_on);


-- ════════════════════════════════════════════════════════════════════
-- ⑪ v_ad_board — 운영자가 보는 한 줄 (계약액 · 실매출 · 노출 · 클릭)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **`v_ad_live` 위에 얹지 않았습니다.** 앞 번호의 보기 위에 보기를
--   세우면 그 앞 번호를 다시 붙여 넣을 때
--   `cannot drop view … because other objects depend on it` 으로 **거기서
--   멈춥니다** (0060 이 `v_join_count` 를 0046 위에 세워 겪은 자리).
--   표에서 바로 셉니다.
-- ⚠️⚠️ **보기는 RLS 를 지나지 않습니다** — 그래서 이 `where` 절이
--   자물쇠 그 자체입니다. 운영자가 아니면 **0줄**입니다.
-- ⚠️⚠️ **계약액과 실제 매출을 갈라서 냅니다** (지시서 B) —
--       price   계약액 (적어 둔 값)
--       billed  청구 합
--       paid    수납 합
--       refunded 환불 합
--       net     실매출 = 수납 − 환불
--   화면이 다시 셈하지 않습니다 (두 곳에서 세면 어긋납니다).
-- ⚠️ `views` · `clicks` 는 **브라우저가 보낸 것을 센 값**입니다 —
--   화면이 그 사실을 적습니다 (위 ⑨ 머리말).
drop view if exists v_ad_board;
create view v_ad_board as
  select a.id, a.provider_id, p.name as provider_name, a.advertiser,
         a.place, a.cat_key, a.region, a.starts_on, a.ends_on,
         a.price, a.state, a.note,
         a.click_url, a.img_pc, a.img_mo, a.img_alt,
         coalesce(b.billed, 0)   as billed,
         coalesce(b.paid, 0)     as paid,
         coalesce(b.refunded, 0) as refunded,
         coalesce(b.paid, 0) - coalesce(b.refunded, 0) as net,
         coalesce(s.views, 0)    as views,
         coalesce(s.clicks, 0)   as clicks
    from ad_run a
    join provider p on p.id = a.provider_id
    left join (
      select ad_id,
             sum(case when kind = 'bill'   then amount else 0 end) as billed,
             sum(case when kind = 'pay'    then amount else 0 end) as paid,
             sum(case when kind = 'refund' then amount else 0 end) as refunded
        from ad_bill group by ad_id
    ) b on b.ad_id = a.id
    left join (
      select ad_id, sum(views) as views, sum(clicks) as clicks
        from ad_stat group by ad_id
    ) s on s.ad_id = a.id
   where my_role() in ('staff', 'admin');
grant select on v_ad_board to authenticated;


-- ── 문 권한 ───────────────────────────────────────────────────────
-- ⚠️⚠️⚠️ **함수는 표와 반대입니다** — 만드는 순간 `public` 에게 EXECUTE 가
--   붙습니다 (0050 에서 `notify_one` 이 그 꼴이었습니다). 전부 거두고
--   필요한 역할에만 줍니다.
revoke all on function save_ad(jsonb)         from public;
revoke all on function claim_ad_image(jsonb)  from public;
revoke all on function drop_ad_image(jsonb)   from public;
revoke all on function save_ad_bill(jsonb)    from public;
revoke all on function drop_ad_bill(jsonb)    from public;
revoke all on function bump_ad(jsonb)         from public;

grant execute on function save_ad(jsonb)        to authenticated;
grant execute on function claim_ad_image(jsonb) to authenticated;
grant execute on function drop_ad_image(jsonb)  to authenticated;
grant execute on function save_ad_bill(jsonb)   to authenticated;
grant execute on function drop_ad_bill(jsonb)   to authenticated;
-- ⚠️⚠️ **세는 문만 비로그인에게도 엽니다** — 광고를 보는 분의 대부분이
--   로그인하지 않았습니다. 그 문은 **+1 씩만** 올리고 아무것도 돌려주지
--   않으며 사람 정보를 한 글자도 안 담습니다.
grant execute on function bump_ad(jsonb)        to anon, authenticated;

insert into schema_version (n, name) values (64, '0064_ad_creative')
  on conflict (n) do nothing;

commit;

/* ---------------------------- 0065_guest_pw_tries.sql ---------------------------- */
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

/* ---------------------------- 0066_course.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0066 — 전국 골프장 · 연습장 **마스터** (데이터 수집 지시서 작업 3)
--
-- 왜 이것이 먼저인가
--   부킹 · 조인 · 여행 · 회원권 **넷이 전부 골프장을 가리키는데**,
--   0060 까지는 골프장이 `teetime.course` 의 **자유 글자**였습니다.
--   그래서 "같은 골프장인데 다른 이름으로 올라온 티타임" 을 묶을 수 없고,
--   골프장별 화면도 만들 수 없었습니다.
--
-- ⚠️⚠️⚠️ **지어낸 시설을 한 줄도 넣지 않습니다.** 이 파일은 **표와 문만**
--   만듭니다. 줄을 채우는 것은 `tools/fetch-courses.js` 로 **공식 출처에서
--   실제로 받은 자료**뿐이고, 그 기록은 `data/staging/source_manifest.csv`
--   에 SHA256 과 함께 남습니다 (절대 규칙 1 · 표시광고법 제3조).
--
-- ⚠️⚠️⚠️ **`id` 와 `slug` 를 가릅니다** (지시서 작업 2).
--     id    안 바뀌는 안쪽 번호 (uuid) — 다른 표가 이것을 가리킵니다
--     slug  주소에 쓰는 글자 — **바뀔 수 있습니다** (운영자가 고칩니다)
--   `provider` 는 id 가 곧 slug 라 상호가 바뀌면 주소가 깨집니다. 골프장은
--   수천 곳이 될 자리라 같은 실수를 되풀이하지 않습니다.
--
-- ⚠️⚠️ **폐업을 지우지 않습니다** (`state = 'closed'`). 지우면 "원래 없던
--   곳" 이 되어 되살릴 근거가 사라지고, 다음 수집 때 새 줄로 또 들어옵니다.
--
-- ⚠️⚠️ **출처를 반드시 적습니다** (`course_source`). 어느 공공자료의 몇 번
--   줄에서 왔는지가 없으면 그 자료는 "우리가 적은 것" 과 구별되지 않습니다.
--   한 골프장이 여러 출처에서 올 수 있어 **표를 갈랐습니다**.
--
-- ⚠️⚠️⚠️ **제휴가 필요한 것은 이 표에 안 담습니다** (지시서 작업 5) —
--   실시간 잔여 티타임 · 그린피 · 회원권 호가 · 상품 재고는 **공식 제휴
--   피드**가 있어야 하는 값입니다. 공개 자료에 없는 것을 이 표에 칸으로
--   만들어 두면 누군가 그 칸을 채우고, 그 순간 지어낸 값이 손님 화면에
--   나갑니다. 그래서 **칸을 아예 안 만듭니다.**
--
-- ⚠️⚠️ **좌표는 null 이 기본입니다.** 공공 인허가 자료의 좌표는 EPSG:5174 ·
--   2097 처럼 좌표계가 섞여 있어, 확인 전에는 `tools/clean-courses.js` 가
--   비워 둡니다. 틀린 좌표로 지도에 찍으면 손님을 엉뚱한 곳으로 보냅니다.
--
-- 되돌아갔는지 보는 법
--   select count(*) from information_schema.tables where table_name = 'course';        -- 1
--   select count(*) from information_schema.views  where table_name = 'v_course_public'; -- 1
--   select pg_get_viewdef('v_teetime_open'::regclass) ilike '%course_id%';             -- t
-- ════════════════════════════════════════════════════════════════════


begin;


-- ── ⓪ 이름 정규화 — **규칙은 여기 한 곳** ──────────────────────
-- ⚠️⚠️⚠️ 처음에 이 규칙을 JS(tools/clean-courses.js)와 SQL 두 곳에 두었다가
--   잡았습니다 — JS 는 "컨트리클럽→cc" 를 하고 SQL 은 안 해서, 들여온
--   `name_norm` 과 트리거가 세는 값이 **조용히 달라집니다**. 그러면 티타임이
--   마스터에 영원히 안 이어지고 **에러도 안 납니다**.
-- ⚠️ 그래서 `course.name_norm` 은 **generated 칸**입니다 — 사람이 넣을 수
--   없고 DB 가 이 함수로 셉니다. 규칙이 둘이 될 수 없습니다.
create or replace function course_norm(p text) returns text
language sql immutable as $$
  select lower(regexp_replace(
           regexp_replace(
             regexp_replace(
               regexp_replace(coalesce(p,''),
                 '\(주\)|\(유\)|\(재\)|\(사\)|주식회사|유한회사|재단법인|사단법인', '', 'g'),
               '컨트리클럽|컨트리 클럽', 'cc', 'g'),
             '골프클럽|골프 클럽', 'gc', 'g'),
           '[[:space:]·.,''"()_-]', '', 'g'))
$$;
revoke all on function course_norm(text) from public;


-- ── ① 들여온 묶음 (어느 파일을 언제 넣었나) ─────────────────────────
-- ⚠️ import 는 **멱등**이어야 합니다 — 같은 파일을 두 번 넣어도 줄이
--    늘지 않게 `course_source` 에 unique 를 겁니다.
create table if not exists import_batch (
  id           uuid primary key default gen_random_uuid(),
  source_id    text not null check (btrim(source_id) <> ''),
  file_name    text not null,
  sha256       text not null check (char_length(sha256) = 64),
  http_status  int,
  license      text,
  data_as_of   date,
  rows_raw     int not null default 0,
  rows_ok      int not null default 0,
  rows_skipped int not null default 0,
  note         text,
  by_user      uuid references auth.users(id) on delete set null,
  at           timestamptz not null default now()
);
create unique index if not exists import_batch_sha_uq on import_batch (source_id, sha256);


-- ── ② 골프장 · 연습장 마스터 ────────────────────────────────────
create table if not exists course (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null,
  kind        text not null check (kind in ('golf','range')),
  name        text not null check (char_length(btrim(name)) between 2 and 80),
  name_norm   text generated always as (course_norm(name)) stored,
  region      text not null check (btrim(region) <> ''),
  gu          text,
  addr        text,
  addr_road   text,
  tel         text check (tel is null or char_length(btrim(tel)) between 7 and 20),
  holes       int  check (holes is null or holes between 1 and 72),
  biz_kind    text,
  site_url    text,
  -- ⚠️ 좌표는 **있을 때만** 채웁니다. 범위를 DB 가 다시 봅니다
  --    (한국 밖 좌표가 들어오면 지도가 엉뚱한 곳을 가리킵니다)
  lat         numeric(9,6) check (lat is null or lat between 32 and 40),
  lng         numeric(9,6) check (lng is null or lng between 124 and 132),
  state       text not null default 'open'
              check (state in ('open','closed','hidden')),
  state_why   text,
  state_at    timestamptz,
  state_by    uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- ⚠️ 가린 것은 **까닭이 반드시** 있습니다 (후기 · 게시판과 같은 규칙)
  constraint course_hidden_ck check (state <> 'hidden' or btrim(coalesce(state_why,'')) <> '')
);
create unique index if not exists course_slug_uq on course (lower(slug));
create index        if not exists course_region_ix on course (region, kind, state);
create index        if not exists course_norm_ix   on course (name_norm);


-- ── ③ 같은 골프장의 다른 이름 ───────────────────────────────────
-- ⚠️⚠️ 티타임은 **글자**로 올라옵니다(0060). 그 글자를 마스터에 잇는 길이
--    이것입니다. 자동 병합이 아니라 **운영자가 확인한 것만** 들어갑니다.
create table if not exists course_alias (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references course(id) on delete cascade,
  alias      text not null check (btrim(alias) <> ''),
  alias_norm text not null check (btrim(alias_norm) <> ''),
  by_user    uuid references auth.users(id) on delete set null,
  at         timestamptz not null default now()
);
create unique index if not exists course_alias_uq on course_alias (alias_norm);


-- ── ④ 어느 출처의 어느 줄에서 왔나 ──────────────────────────────
create table if not exists course_source (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references course(id) on delete cascade,
  source_id   text not null check (btrim(source_id) <> ''),
  src_key     text,
  status_raw  text,
  as_of       date,
  batch_id    uuid references import_batch(id) on delete set null,
  created_at  timestamptz not null default now()
);
-- ⚠️ 같은 출처의 같은 관리번호는 **한 줄**입니다 (두 번 넣어도 안 늘어납니다)
create unique index if not exists course_source_uq
  on course_source (source_id, src_key) where src_key is not null;


-- ── ⑤ 버린 줄 · 보류한 값 ───────────────────────────────────────
-- ⚠️ 왜 안 들어갔는지가 없으면 "그 골프장은 원래 없다" 로 읽힙니다.
create table if not exists import_row_issue (
  id        bigserial primary key,
  batch_id  uuid references import_batch(id) on delete cascade,
  source_id text not null,
  row_no    int,
  kind      text not null,
  detail    text,
  at        timestamptz not null default now()
);


-- ── ⑥ 티타임을 마스터에 잇는 칸 ─────────────────────────────────
-- ⚠️⚠️ **글자 칸(`teetime.course`)을 그대로 둡니다.** 마스터에 없는
--    골프장도 업체가 올릴 수 있어야 합니다 — 비면 글자를 그대로 보여 주고,
--    이어졌으면 골프장 화면으로 링크합니다.
alter table teetime add column if not exists course_id uuid
  references course(id) on delete set null;
create index if not exists teetime_course_ix on teetime (course_id);

-- 이름이 **정확히 맞을 때만** 잇습니다 — ⚠️⚠️⚠️ 비슷한 이름으로 추측해
-- 이으면 손님이 다른 골프장을 예약합니다. 못 찾으면 null 로 둡니다.

create or replace function teetime_link_course() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if new.course_id is not null then return new; end if;
  select c.id into v_id from course c
   where c.name_norm = course_norm(new.course) and c.state <> 'hidden'
   limit 1;
  if v_id is null then
    select a.course_id into v_id from course_alias a
     where a.alias_norm = course_norm(new.course) limit 1;
  end if;
  new.course_id := v_id;   -- ⚠️ 못 찾으면 null 그대로 (지어내지 않습니다)
  return new;
end $$;
revoke all on function teetime_link_course() from public;

drop trigger if exists teetime_link_course_t on teetime;
create trigger teetime_link_course_t
  before insert or update of course on teetime
  for each row execute function teetime_link_course();


-- ── ⑦ 공개로 읽는 길 — **보기 하나** ───────────────────────────
-- ⚠️⚠️ 보기는 RLS 를 지나지 않습니다 — 이 where 절이 자물쇠입니다.
--    가린 것(`hidden`)은 **손님에게 한 줄도 안 나갑니다.**
-- ⚠️ 폐업(`closed`)은 **냅니다** — 손님이 "여기 문 닫았나" 를 확인할 수
--    있어야 합니다. 다만 화면이 그 사실을 그 자리에서 말합니다.
drop view if exists v_course_count;
drop view if exists v_course_public;
create view v_course_public as
  select c.id, c.slug, c.kind, c.name, c.region, c.gu,
         c.addr, c.addr_road, c.tel, c.holes, c.biz_kind, c.site_url,
         c.lat, c.lng, c.state, c.updated_at,
         -- ⚠️ 출처와 기준일을 **같이** 냅니다 (지시서 작업 4 — 출처 표시)
         (select s.source_id from course_source s
           where s.course_id = c.id order by s.created_at limit 1) as source_id,
         (select max(s.as_of) from course_source s where s.course_id = c.id) as as_of
    from course c
   where c.state <> 'hidden';
grant select on v_course_public to anon, authenticated;

-- 집계 보기를 **목록 보기 위에** 세웁니다 — 0060 에서 배운 자리입니다.
-- 그러면 "집계와 목록이 다른 조건" 이 **구조적으로** 못 생깁니다.
create view v_course_count as
  select region, kind, count(*)::int as n
    from v_course_public
   where state = 'open'
   group by region, kind;
grant select on v_course_count to anon, authenticated;


-- ── ⑧ 문 — **운영자만** ─────────────────────────────────────────
-- ⚠️ 업체 · 손님은 골프장 마스터를 못 고칩니다. 업체가 제 골프장이라고
--    주장하는 길은 따로 세워야 하고(제휴 확인), 그 전에는 열지 않습니다.
create or replace function save_course(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_role app_role := my_role(); v_id uuid; v_slug text; v_name text;
begin
  if coalesce(v_role::text,'') not in ('staff','admin') then
    raise exception '골프장 정보는 운영자만 고칠 수 있습니다';
  end if;
  v_name := btrim(coalesce(p->>'name',''));
  if v_name = '' then raise exception '골프장 이름을 적어 주세요'; end if;
  v_slug := btrim(coalesce(p->>'slug',''));
  if v_slug = '' then raise exception '주소에 쓸 slug 를 적어 주세요'; end if;
  if v_slug !~ '^[a-z0-9][a-z0-9-]{1,60}$' then
    raise exception 'slug 는 영문 소문자 · 숫자 · 붙임표만 됩니다';
  end if;

  v_id := nullif(p->>'id','')::uuid;
  if v_id is null then
    insert into course (slug, kind, name, region, gu, addr, addr_road,
                        tel, holes, biz_kind, site_url, lat, lng)
    values (v_slug,
            coalesce(nullif(p->>'kind',''),'golf'),
            v_name,
            btrim(coalesce(p->>'region','')),
            nullif(btrim(coalesce(p->>'gu','')),''),
            nullif(btrim(coalesce(p->>'addr','')),''),
            nullif(btrim(coalesce(p->>'addr_road','')),''),
            nullif(btrim(coalesce(p->>'tel','')),''),
            nullif(p->>'holes','')::int,
            nullif(btrim(coalesce(p->>'biz_kind','')),''),
            nullif(btrim(coalesce(p->>'site_url','')),''),
            nullif(p->>'lat','')::numeric,
            nullif(p->>'lng','')::numeric)
    returning id into v_id;
  else
    -- ⚠️⚠️ **보낸 칸만 고칩니다** — 통째로 덮으면 화면이 칸을 빠뜨리는 날
    --    그 칸이 지워집니다 (`save_provider_self` 에서 겪은 자리).
    update course set
      slug      = v_slug,
      name      = v_name,
      kind      = coalesce(nullif(p->>'kind',''), kind),
      region    = coalesce(nullif(btrim(p->>'region'),''), region),
      gu        = case when p ? 'gu'        then nullif(btrim(p->>'gu'),'')        else gu end,
      addr      = case when p ? 'addr'      then nullif(btrim(p->>'addr'),'')      else addr end,
      addr_road = case when p ? 'addr_road' then nullif(btrim(p->>'addr_road'),'') else addr_road end,
      tel       = case when p ? 'tel'       then nullif(btrim(p->>'tel'),'')       else tel end,
      holes     = case when p ? 'holes'     then nullif(p->>'holes','')::int       else holes end,
      biz_kind  = case when p ? 'biz_kind'  then nullif(btrim(p->>'biz_kind'),'')  else biz_kind end,
      site_url  = case when p ? 'site_url'  then nullif(btrim(p->>'site_url'),'')  else site_url end,
      lat       = case when p ? 'lat'       then nullif(p->>'lat','')::numeric     else lat end,
      lng       = case when p ? 'lng'       then nullif(p->>'lng','')::numeric     else lng end,
      updated_at = now()
     where id = v_id;
    if not found then raise exception '그 골프장을 찾을 수 없습니다'; end if;
  end if;

  -- ⚠️ 기록에 **주소 · 전화를 안 담습니다** — 공개 자료라도 기록에 쌓아
  --    둘 까닭이 없고, audit_log 는 오래 남고 보는 사람도 넓습니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why)
  values (auth.uid(), v_role, 'course', v_id::text, null, left(v_name, 40));
  return v_id;
end $$;
revoke all on function save_course(jsonb) from public;
grant execute on function save_course(jsonb) to authenticated;

-- 가리기 · 폐업 표시 — ⚠️ **지우는 문을 만들지 않습니다**
create or replace function move_course(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare v_role app_role := my_role(); v_to text; v_why text;
begin
  if coalesce(v_role::text,'') not in ('staff','admin') then
    raise exception '골프장 상태는 운영자만 바꿀 수 있습니다';
  end if;
  v_to  := btrim(coalesce(p->>'to',''));
  v_why := btrim(coalesce(p->>'why',''));
  if v_to not in ('open','closed','hidden') then
    raise exception '그런 상태는 없습니다';
  end if;
  -- ⚠️ 가릴 때는 **까닭이 반드시** — 까닭 없이 가릴 수 있으면 누가
  --    불평할 때마다 지워 주는 자리가 됩니다 (후기에서 배운 규칙).
  if v_to = 'hidden' and v_why = '' then
    raise exception '가리는 까닭을 적어 주세요';
  end if;
  update course set state = v_to,
                    state_why = nullif(v_why,''),
                    state_at = now(), state_by = auth.uid(), updated_at = now()
   where id = (p->>'id')::uuid;
  if not found then raise exception '그 골프장을 찾을 수 없습니다'; end if;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why)
  values (auth.uid(), v_role, 'course', p->>'id', v_to, nullif(v_why,''));
end $$;
revoke all on function move_course(jsonb) from public;
grant execute on function move_course(jsonb) to authenticated;

-- 다른 이름 잇기 — ⚠️ 운영자가 **확인한 것만**
create or replace function link_course_alias(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare v_role app_role := my_role(); v_alias text;
begin
  if coalesce(v_role::text,'') not in ('staff','admin') then
    raise exception '골프장 이름 잇기는 운영자만 할 수 있습니다';
  end if;
  v_alias := btrim(coalesce(p->>'alias',''));
  if v_alias = '' then raise exception '이을 이름을 적어 주세요'; end if;
  insert into course_alias (course_id, alias, alias_norm, by_user)
  values ((p->>'course_id')::uuid, v_alias, course_norm(v_alias), auth.uid())
  on conflict (alias_norm) do nothing;

  -- 이미 올라온 티타임 가운데 **그 이름 그대로인 것만** 이어 줍니다
  update teetime set course_id = (p->>'course_id')::uuid
   where course_id is null and course_norm(course) = course_norm(v_alias);

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why)
  values (auth.uid(), v_role, 'course_alias', p->>'course_id', null, left(v_alias, 40));
end $$;
revoke all on function link_course_alias(jsonb) from public;
grant execute on function link_course_alias(jsonb) to authenticated;


-- ── ⑨ RLS — 표를 직접 읽거나 쓰는 길을 **안 엽니다** ───────────
alter table course           enable row level security;
alter table course_alias     enable row level security;
alter table course_source    enable row level security;
alter table import_batch     enable row level security;
alter table import_row_issue enable row level security;
-- ⚠️ 정책을 **하나도 안 둡니다** — 공개로 읽는 길은 보기 하나이고,
--    쓰는 길은 문 셋뿐입니다. 운영자도 표를 직접 안 읽습니다
--    (들여오기는 SQL 편집기에서 임자 권한으로 돕니다).
revoke all on table course           from anon, authenticated;
revoke all on table course_alias     from anon, authenticated;
revoke all on table course_source    from anon, authenticated;
revoke all on table import_batch     from anon, authenticated;
revoke all on table import_row_issue from anon, authenticated;


-- ── ⑩ 티타임 공개 보기에 골프장을 잇습니다 ─────────────────────
-- ⚠️⚠️ **칸을 늘리므로 지우고 다시 만듭니다** (`create or replace view`
--    는 칸을 못 늘립니다 — 0044 가 거기서 멈춘 자리입니다).
-- ⚠️ 집계 보기(`v_teetime_count`)가 이 보기 위에 서 있으므로 **먼저**
--    지웁니다. `cascade` 는 안 씁니다 (무엇이 같이 지워지는지 안 보입니다).
drop view if exists v_teetime_count;
drop view if exists v_teetime_open;
-- ⚠️⚠️⚠️ **0060 의 정의를 그대로 베끼고 두 칸만 더합니다.** 처음에 제가
--   기억으로 다시 썼다가 `tel` 합치기 · `left_n` · `confirmed_n` **셋을
--   빠뜨렸습니다** — 부킹 화면이 남은 자리를 못 세고 전화번호가 사라질
--   참이었고, `sql/teetime.js` 가 그 자리에서 잡았습니다.
--   ⚠️ 보기를 다시 만드는 날은 **앞 정의를 열어 보고** 더하기만 하세요.
create view v_teetime_open as
  select t.id, t.provider_id, p.name as provider_name,
         t.kind, t.region, t.course, t.play_at, t.tee_at, t.holes,
         t.slots, t.green_fee,
         -- 공개가 맞는 번호 둘 가운데 하나 (0060 그대로)
         coalesce(nullif(btrim(coalesce(t.tel, '')), ''), p.tel) as tel,
         t.note, t.created_at,
         t.slots - (select coalesce(sum(b.people), 0) from teebook b
                     where b.tee_id = t.id
                       and b.state in ('applied','confirmed')) as left_n,
         (select count(*) from teebook b
           where b.tee_id = t.id and b.state = 'confirmed') as confirmed_n,
         -- ── 0066 이 더한 둘 ──────────────────────────────────
         t.course_id,
         -- ⚠️ 마스터에 이어졌고 **가려지지 않았을 때만** slug 를 냅니다
         --    (없으면 null — 화면이 그것을 보고 링크를 걸지 말지 가릅니다)
         (select c.slug from course c
           where c.id = t.course_id and c.state <> 'hidden') as course_slug
    from teetime t
    join provider p on p.id = t.provider_id
   where t.state = 'open'
     and t.play_at >= kst_today()
     and p.listed = true
     and p.is_test = false
     and p.state = 'approved';
grant select on v_teetime_open to anon, authenticated;

-- ⚠️ 집계도 0060 의 칸 그대로입니다 (kind · left_n 을 빼면 메인 현황표와
--    부킹 화면이 조용히 틀립니다)
create view v_teetime_count as
  select kind, region, play_at, count(*)::int as n,
         sum(greatest(left_n, 0))::int as left_n
    from v_teetime_open
   group by kind, region, play_at;
grant select on v_teetime_count to anon, authenticated;


insert into schema_version (n, name) values (66, '0066_course')
  on conflict (n) do nothing;

commit;

/* ---------------------------- 0067_counts.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0067 — 중고 · 인력 · 구합니다 · 게시판의 **세는 보기** 넷
--
-- 왜 이것이 필요한가
--   0060 이 부킹 · 조인에 "날짜 · 지역별 현황" 을 세웠습니다. 손님은 그
--   표에서 **어디에 무엇이 있는지**를 먼저 보고 목록으로 들어갑니다.
--   나머지 네 자리(중고 · 인력 · 구합니다 · 게시판)에는 그 표가 없어서,
--   들어오신 분이 **목록부터** 보셨습니다 — 서울에 아이언이 몇 개
--   올라와 있는지 알려면 쉰 줄을 밀어 내려가야 했습니다.
--
-- ⚠️⚠️⚠️ **가로축에 날짜를 쓰지 않습니다.** 부킹 · 조인은 "언제 치느냐"
--   가 물건이라 날짜가 축이지만, 중고채 · 구인 글 · 구합니다 글은
--   **날짜로 찾는 것이 아닙니다**(올라온 날이 축이면 어제 글이 매일
--   한 칸씩 밀려 나가는 표가 됩니다). 그래서 축은 —
--     중고      물건 종류(sub) x 지역
--     인력      갈래(kind)     x 지역
--     구합니다  분류(cat) · 하위(sub) x 지역
--     게시판    게시판(cat)뿐 — cq 표에 **지역 칸이 없습니다**
--   없는 축을 지어내지 않습니다(절대 규칙 1).
--
-- ⚠️⚠️⚠️ **앞 번호의 공개 보기 위에 얹지 않습니다.** 0060 이
--   `v_join_count` 를 `v_join_open`(0046) 위에 세우려다 멈췄던 자리입니다 —
--   0046 이 제 보기를 `drop view` 하려 할 때
--   "cannot drop view v_join_open because other objects depend on it" 으로
--   **붙여넣기 파일 두 번째 실행이 거기서 멈춥니다**(test-upgrade ⑧).
--   그래서 이 파일의 보기 넷은 **표에서 직접 셉니다.**
--   ⚠️⚠️ 그 대가로 **조건이 두 곳**에 적힙니다. 어긋나면 표의 숫자와
--   목록의 줄 수가 다른데 **에러가 한 줄도 안 납니다** — 그래서
--   `tools/sql/counts.js` 가 **줄마다**(칸마다) 두 값을 맞춰 봅니다.
--   ⚠️ 총합으로 맞춰 보면 안 됩니다 — 한쪽이 더 세고 한쪽이 덜 세면
--   상쇄되어 **엉뚱한 까닭으로 통과**합니다(0060 에서 적어 둔 그 줄).
--
-- ⚠️⚠️ **숫자만 냅니다.** 이 보기 넷에는 제목 · 본문 · 연락처 · 글쓴이가
--   한 칸도 없습니다. 보기는 RLS 를 지나지 않으므로(임자 권한으로 돕니다)
--   **담은 칸이 곧 공개 범위**입니다 — 세는 자리에 글 내용을 담으면
--   가린 글 · 내린 글의 제목이 거기로 새어 나갑니다.
--
-- ⚠️⚠️⚠️ **같은 번에 `v_job_open` 의 UTC 버그를 고칩니다.** 0048 이
--   `close_at >= current_date` 로 적었는데 Supabase 는 UTC 라, 한국 시각
--   00:00~09:00 에는 UTC 가 아직 **어제**입니다 — 어제 마감된 구인 글이
--   한국 아침에 아직 열린 것으로 보였습니다(0046 의 `v_join_open` 이
--   밟고 0060 이 고친 그 자리). 세는 보기가 `kst_today()` 를 쓰는데
--   목록 보기가 `current_date` 를 쓰면 **그 아홉 시간 동안 표와 목록이
--   다른 수**를 말하고, 검사는 그 시각에만 떨어집니다.
--   ⚠️ 고치는 길은 보기를 다시 만드는 것뿐이라 **체인이 하나 늘어납니다**
--   (v_job_open 0048 → 0067). `check-chains` 가 셉니다.
--
-- 되돌아갔는지 보는 법 (0048 을 따로 다시 붙여 넣으면 조용히 되돌아갑니다)
--   select pg_get_viewdef('v_job_open'::regclass) ilike '%kst_today%';   -- t 여야
--   select count(*) from information_schema.views
--    where table_name in ('v_listing_count','v_job_count',
--                         'v_wanted_count','v_cq_count');                -- 4
-- ════════════════════════════════════════════════════════════════════


begin;


-- ── ① 중고 매물 — 물건 종류 x 지역 ────────────────────────────────
-- ⚠️ 조건은 `v_listing_open`(0056)과 **같아야 합니다**: state = 'open'.
--   팔린 것 · 내린 것 · 가린 것은 목록에 없으므로 표에도 없습니다.
-- ⚠️⚠️ 값(price)으로는 **안 나눕니다** — 가격대는 손님이 고르는 거르개이고
--   표의 축이 아닙니다. 축으로 두면 칸이 7 x 6 x 5 가 되어 못 읽습니다.
drop view if exists v_listing_count;
create view v_listing_count as
  select l.sub, l.region, count(*)::int as n
    from listing l
   where l.state = 'open'
   group by l.sub, l.region;

grant select on v_listing_count to anon, authenticated;


-- ── ② 구인 · 구직 · 제휴 — 갈래 x 지역 ────────────────────────────
-- ⚠️⚠️ 0048 이 한 표에 셋을 담았으므로(`kind`) 세로축이 **갈래 셋**입니다.
--   하위(sub)를 축으로 두면 6 x 6 인데, 손님이 먼저 묻는 것은
--   "구인인가 구직인가" 입니다 — 하위는 거르개로 둡니다.
-- ⚠️ 마감일이 지난 글은 목록에서 빠지므로 **표에서도 빠집니다**.
--   날짜는 **한국 날짜**입니다(아래 ⑤ 에서 목록 보기도 같이 고칩니다).
drop view if exists v_job_count;
create view v_job_count as
  select j.kind, j.region, count(*)::int as n
    from jobpost j
   where j.state = 'open'
     and (j.close_at is null or j.close_at >= kst_today())
   group by j.kind, j.region;

grant select on v_job_count to anon, authenticated;


-- ── ③ 구합니다 — 분류 · 하위 x 지역 ───────────────────────────────
-- ⚠️⚠️ 이 보기는 **분류까지** 담습니다 — 구합니다는 `/cat/lesson` 처럼
--   분류 화면마다 서는 자리라, 화면이 제 분류로 좁혀 읽습니다.
-- ⚠️⚠️⚠️ **`sub` 은 비어 있을 수 있습니다**(0061 — 하위를 모르고 적으시는
--   분이 있어 필수가 아닙니다). group by 가 null 을 **한 칸으로 모으므로**
--   그 줄이 그대로 나오고, 화면은 그 칸을 어느 하위 줄에도 안 더합니다 —
--   더하면 손님이 안 고른 하위에 글이 있는 것처럼 보입니다(절대 규칙 1).
--   ⚠️ 화면이 그 사실을 **그 자리에서** 말합니다("하위를 안 적은 글은
--   표에 안 들어갑니다" — 숨기면 목록 수와 표의 합이 달라 보입니다).
drop view if exists v_wanted_count;
create view v_wanted_count as
  select w.cat, w.sub, w.region, count(*)::int as n
    from wanted w
   where w.state = 'open'
   group by w.cat, w.sub, w.region;

grant select on v_wanted_count to anon, authenticated;


-- ── ④ 게시판 — 게시판마다 글 수 ───────────────────────────────────
-- ⚠️⚠️ **표를 만들지 않습니다.** `cq` 에는 지역 칸이 **없습니다** — 없는
--   축을 만들려면 칸을 새로 만들어야 하고, 칸을 만들면 누군가 채웁니다.
--   그래서 가로축 없이 **게시판마다 한 숫자**입니다.
-- ⚠️ 조건은 `v_cq_public`(0063)과 같습니다: state = 'live'.
--   내린 글 · 가린 글은 목록에 없으므로 숫자에도 없습니다.
-- ⚠️⚠️ **조회 수 · 댓글 수를 여기서 안 셉니다** — 그 둘은 이미
--   `v_cq_public` 이 글마다 세어 냅니다. 두 곳에서 세면 한쪽만 고치는 날
--   같은 게시판이 화면마다 다른 수를 말합니다.
drop view if exists v_cq_count;
create view v_cq_count as
  select q.cat, count(*)::int as n
    from cq q
   where q.state = 'live'
   group by q.cat;

grant select on v_cq_count to anon, authenticated;


-- ── ⑤ v_job_open — `current_date`(UTC) 를 `kst_today()` 로 ─────────
-- ⚠️⚠️⚠️ **0048 의 본문을 그대로 두고 날짜 함수만 바꿉니다.** 칸을
--   늘리거나 줄이지 않습니다 — 줄이면 `js/career.js` 가 읽는 칸이
--   사라지고, 늘리면 0048 을 다시 붙여 넣을 때
--   "cannot drop columns from view" 로 멈춥니다.
--   ⚠️ 그래서 `create or replace` 가 아니라 **drop + create** 이고,
--   GRANT 를 **바로 다시** 줍니다(지우면 권한도 같이 날아갑니다 — 0044 가
--   그 자리에서 `pull-providers` 를 permission denied 로 만들 뻔했습니다).
drop view if exists v_job_open;
create view v_job_open as
  select j.id, j.kind, j.sub, j.region, j.title, j.body, j.pay, j.terms,
         j.close_at, j.created_at, j.updated_at,
         case
           when btrim(coalesce(ac.name, '')) = '' then '회원'
           else left(btrim(ac.name), 1) ||
                repeat('*', greatest(char_length(btrim(ac.name)) - 1, 1))
         end as who,
         case when pv.id is not null and pv.state = 'approved'
                   and pv.is_test = false
              then pv.name end as pro_name,
         (select count(*) from jobapply a
           where a.post_id = j.id and a.state in ('applied','accepted')) as apply_n
    from jobpost j
    left join account  ac on ac.id = j.by_user
    left join provider pv on pv.id = j.provider_id
   where j.state = 'open'
     and (j.close_at is null or j.close_at >= kst_today());

grant select on v_job_open to anon, authenticated;


insert into schema_version (n, name) values (67, '0067_counts')
  on conflict (n) do nothing;

commit;

/* ---------------------------- 0068_listing_photo.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0068 — 중고 매물에 **사진**과 **브랜드**를 더합니다
--        (그리고 0067 의 세는 보기 넷을 내립니다)
--
-- 왜 이것인가
--   사장님이 "중고를 표로 내는 건 아닌 것 같다, 다른 업체를 알아보라"
--   고 하셨고, 알아본 다섯 곳(2nd Swing · SidelineSwap · 번개장터 ·
--   당근 · 골마켓)이 **하나도 빠짐없이** 같은 틀이었습니다 —
--     ① 사진이 먼저 오는 카드 격자
--     ② 브랜드가 첫 거르개
--     ③ 상태 · 가격대
--     ④ 폰에서는 「필터」 단추 하나
--   우리는 ③만 있었고 ① ② 가 **표에 아예 없었습니다.**
--
-- ⚠️⚠️⚠️ **사진이 없는 중고 장터는 알아본 다섯 곳에 하나도 없습니다.**
--   글자만으로 중고채를 사는 분은 없습니다. 그런데 `listing` 에는 사진을
--   담는 표가 **한 줄도 없었습니다** — 0056 이 표 · 문 · 화면을 다 세우고
--   그 칸만 빠뜨린 자리입니다.
--
-- ⚠️⚠️ **0059(게시판 사진)를 그대로 베낍니다.** 짜임새가 같습니다 —
--   경로는 **문이 짓고**(화면이 못 짓습니다) · 버킷은 **서버가** 그
--   경로를 보고 고르고(`api/upload.js` 의 `bucketForPath()`) · 표의
--   check 가 그 꼴을 **다시** 봅니다. 새로 설계하면 그 자리마다 다시
--   틀립니다(0056 이 0046 을 베낀 그 까닭).
--   ⚠️ `/photo/` 가 경로에 글자로 들어가므로 **공개 버킷**으로 갑니다 —
--   매물 사진은 손님 전부가 봐야 하는 것이고, 서명 주소로는 캐시가
--   안 되어 손님마다 서버를 한 번 더 두드립니다(0064 의 광고 소재와 같음).
--
-- ⚠️⚠️ **브랜드는 비워 둘 수 없게 합니다.** 비워 두면 거르개에 "브랜드
--   없음" 칸이 생기고, 그 칸은 손님이 고를 까닭이 없어 **아무도 안 보는
--   매물**이 됩니다. 대신 화면이 **「기타(직접 적기)」**를 냅니다 —
--   목록만 두면 없는 브랜드를 가진 분이 글을 아예 못 올립니다.
--   ⚠️ 브랜드 **목록을 DB 에 박지 않습니다**(지역 키 · 하위 키를 안 박은
--   그 까닭) — 늘어나는 날 두 곳이 어긋나고, 그때 화면은 보내는데 DB 가
--   거절합니다.
--
-- ⚠️⚠️⚠️ **0067 의 세는 보기 넷을 내립니다.** 읽는 화면이 0곳이 되었고,
--   안 쓰는 보기를 남겨 두면 다음 차수가 **없는 기능을 있다고** 읽습니다
--   (0052 에서 작업 기억을 믿고 있는 기능을 또 만들 뻔한 그 자리).
--   ⚠️ 0067 파일은 **고치지 않습니다** — 돌린 마이그레이션은 안 고치고,
--   지우는 일도 **새 번호**에 적습니다. 0067 의 `v_job_open` UTC 고침은
--   그대로 둡니다(그건 진짜 버그 고침이었습니다).
--
-- ⚠️ 날짜 × 지역 현황표는 **부킹 · 조인(0060)에만** 남습니다 — 거기는
--   "언제 치느냐" 가 물건이라 날짜가 축입니다. 중고채는 아닙니다.
--
-- 되돌아갔는지 보는 법 (0056 을 따로 다시 붙여 넣으면 조용히 되돌아갑니다)
--   select count(*) from information_schema.columns
--    where table_name = 'listing' and column_name = 'brand';          -- 1
--   select count(*) from information_schema.columns
--    where table_name = 'v_listing_open' and column_name = 'thumb';   -- 1
--   select count(*) from information_schema.views
--    where table_name in ('v_listing_count','v_job_count',
--                         'v_wanted_count','v_cq_count');             -- 0
-- ════════════════════════════════════════════════════════════════════


begin;


-- ── ① 0067 의 세는 보기 넷을 내립니다 ─────────────────────────────
-- ⚠️ 읽는 화면이 0곳입니다. `if exists` 라 0067 을 안 돌린 DB 에서도
--   그냥 지나갑니다(운영은 아직 0007 입니다).
drop view if exists v_listing_count;
drop view if exists v_job_count;
drop view if exists v_wanted_count;
drop view if exists v_cq_count;


-- ── ② 브랜드 칸 ─────────────────────────────────────────────────
-- ⚠️ 이미 올라온 줄이 있을 수 있으므로 칸은 **null 을 받습니다**.
--   비우지 못하게 막는 것은 **문**입니다(아래 ⑤) — 표를 not null 로
--   두면 0068 을 돌리는 순간 옛 줄 때문에 멈춥니다.
alter table listing add column if not exists brand text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'listing_brand_ok') then
    alter table listing add constraint listing_brand_ok
      check (brand is null or (btrim(brand) <> '' and char_length(brand) <= 30));
  end if;
end $$;

-- ⚠️ 브랜드로 좁히는 것이 첫 거르개라 인덱스를 답니다
create index if not exists listing_brand_idx on listing (brand) where state = 'open';
-- ⚠️ 값순 정렬이 새로 생깁니다(값 낮은 순 · 높은 순)
create index if not exists listing_price_idx on listing (price) where state = 'open';

-- ⚠️⚠️⚠️ **칸을 더하면 GRANT 도 같이 줘야 합니다.** 0056 은 `listing` 에
--   **칸 단위**로 select 를 줬습니다 — 안 준 칸은 0줄이 아니라 **질의가
--   통째로 거절**됩니다. `/my`(`js/mylisting.js`)가 줄머리에 브랜드를
--   적으려고 `select=…,brand,…` 를 부르므로, 이 줄이 없으면 **내 매물
--   목록이 통째로 안 나옵니다**(에러는 그 자리에서만 보입니다).
--   ⚠️ `tools/sql/listing.js` 가 이것을 잡았습니다 — 0050 · 0052 · 0053
--   에서 세 번 밟은 자리입니다(RLS 는 줄은 막아도 **칸은 못 막습니다**).
grant select (brand) on listing to authenticated;


-- ── ③ 매물 사진 ────────────────────────────────────────────────
-- ⚠️⚠️ 0059 의 `cqphoto` 와 **같은 꼴**입니다. 다른 것은 몇 장까지인가
--   뿐입니다 — 게시판 글은 다섯, 매물은 **여덟**(중고채는 여러 각도를
--   찍어야 팔립니다). 목록 카드는 **첫 장만** 씁니다.
create table if not exists listingphoto (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listing(id) on delete cascade,
  by_user    uuid not null references auth.users(id) on delete cascade,
  path       text not null unique,
  mime       text not null,
  bytes      int  not null,
  caption    text,
  created_at timestamptz not null default now(),
  constraint listingphoto_mime_ok check (mime in ('image/jpeg','image/png','image/webp')),
  constraint listingphoto_bytes_ok check (bytes > 0 and bytes <= 8388608),
  constraint listingphoto_caption_ok check (caption is null or char_length(caption) <= 60),
  -- ⚠️⚠️ **경로 꼴을 표가 다시 봅니다** — 문이 지은 것만 들어갑니다
  --   (남의 매물 칸에 못 씁니다). `/photo/` 가 글자로 들어가고 서버가
  --   그것으로 버킷을 고릅니다.
  constraint listingphoto_path_ok check (
    path <> '' and length(path) <= 300
    and path = 'lst/' || listing_id::text || '/photo/' || split_part(path, '/', 4))
);

create index if not exists listingphoto_l_idx on listingphoto (listing_id, created_at);

alter table listingphoto enable row level security;

-- ⚠️ 제 매물의 사진 줄은 제가 봅니다(고치는 화면이 읽습니다) · 운영자도.
--   공개로 가는 길은 아래 **보기** 하나입니다.
drop policy if exists listingphoto_mine on listingphoto;
create policy listingphoto_mine on listingphoto
  for select using (by_user = auth.uid() or my_role() in ('staff','admin'));

grant select on listingphoto to authenticated;


-- ── ④ 사진 문 둘 ───────────────────────────────────────────────
create or replace function claim_listing_photo(p jsonb default '{}'::jsonb)
  returns jsonb
  language plpgsql security definer set search_path = public as $$
declare
  v_me    uuid := auth.uid();
  v_l     uuid := nullif(btrim(coalesce(p->>'listing','')), '')::uuid;
  v_mime  text := lower(btrim(coalesce(p->>'mime','')));
  v_bytes int  := coalesce((nullif(btrim(coalesce(p->>'bytes','')), ''))::int, 0);
  v_cap   text := nullif(btrim(coalesce(p->>'caption','')), '');
  v_ext   text;
  v_path  text;
  v_id    uuid;
begin
  if v_me is null then raise exception '로그인하셔야 사진을 올릴 수 있습니다'; end if;
  if v_l is null then raise exception '어느 매물인지 알 수 없습니다'; end if;
  -- ⚠️⚠️ **제 매물에만** 붙입니다. 운영자도 남의 매물에 사진을 못 붙입니다 —
  --   붙일 까닭이 없고, 붙으면 올리신 분이 안 올린 것이 그 매물에 달립니다.
  if not exists (select 1 from listing
                  where id = v_l and by_user = v_me and state = 'open') then
    raise exception '그 매물에는 사진을 붙일 수 없습니다';
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
  if (select count(*) from listingphoto where listing_id = v_l) >= 8 then
    raise exception '사진은 여덟 장까지입니다. 먼저 빼 주세요';
  end if;

  v_ext := case v_mime when 'image/jpeg' then 'jpg'
                       when 'image/png'  then 'png'
                       else 'webp' end;
  v_path := 'lst/' || v_l::text || '/photo/' || gen_random_uuid()::text || '.' || v_ext;

  insert into listingphoto (listing_id, by_user, path, mime, bytes, caption)
  values (v_l, v_me, v_path, v_mime, v_bytes, v_cap)
  returning id into v_id;

  -- ⚠️ 기록에 **사진 설명을 안 담습니다** (손님 글입니다)
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'listingphoto', v_id::text, 'claimed',
          jsonb_build_object('mime', v_mime, 'bytes', v_bytes));

  return jsonb_build_object('id', v_id, 'path', v_path);
end $$;

revoke all on function claim_listing_photo(jsonb) from public;
grant execute on function claim_listing_photo(jsonb) to authenticated;


create or replace function drop_listing_photo(p jsonb default '{}'::jsonb)
  returns int
  language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_id uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_n  int;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 사진인지 알 수 없습니다'; end if;
  -- ⚠️ 올리신 분과 운영자가 뺍니다 (운영자는 신고를 받고 빼야 합니다)
  delete from listingphoto
   where id = v_id
     and (by_user = v_me or my_role() in ('staff','admin'));
  get diagnostics v_n = row_count;
  -- ⚠️⚠️ 0줄이면 **거절**합니다 — 조용히 끝내면 기록에 "뺐다" 가 남는데
  --   실제로는 아무 일도 안 일어난 것입니다 (0054 에서 적어 둔 그 자리).
  if v_n = 0 then raise exception '그 사진을 뺄 수 없습니다'; end if;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state)
  values (v_me, my_role(), 'listingphoto', v_id::text, 'dropped');
  return v_n;
end $$;

revoke all on function drop_listing_photo(jsonb) from public;
grant execute on function drop_listing_photo(jsonb) to authenticated;


-- ── ⑤ 올리는 문 — 브랜드를 받습니다 (0056 → 0068) ─────────────────
-- ⚠️⚠️ **0056 의 본문을 그대로 두고 브랜드만 더합니다.** 다른 자물쇠를
--   건드리면 0056 이 세운 것이 조용히 내려갑니다.
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
  v_brand   text := nullif(btrim(coalesce(p->>'brand','')), '');
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
  -- ⚠️⚠️ **브랜드를 비워 둘 수 없습니다** — 비면 거르개에 아무도 안 고르는
  --   칸이 생기고 그 매물은 영영 안 보입니다. 모르시면 화면이 「기타」를
  --   냅니다(목록만 두면 없는 브랜드를 가진 분이 글을 못 올립니다).
  if v_brand is null then
    raise exception '브랜드를 골라 주세요 (모르시면 기타)';
  end if;
  if char_length(v_brand) > 30 then
    raise exception '브랜드가 너무 깁니다 (30자)';
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
  if v_cond not in ('new','like','good','fair') then
    raise exception '물건 상태가 올바르지 않습니다';
  end if;
  if v_contact is null then
    raise exception '연락처를 적어 주세요';
  end if;
  if length(v_contact) > 100 then
    raise exception '연락처가 너무 깁니다';
  end if;
  if p->>'agree_at' is null then
    raise exception '개인정보 수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes'
     or (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의 시각이 올바르지 않습니다';
  end if;
  if (select count(*) from listing
       where by_user = v_uid and state = 'open') >= 10 then
    raise exception '팔고 계신 매물이 열입니다. 먼저 정리해 주세요';
  end if;
  if (select count(*) from listing
       where by_user = v_uid and created_at > now() - interval '1 day') >= 20 then
    raise exception '오늘은 더 올릴 수 없습니다 (하루 스무 개)';
  end if;

  insert into listing (by_user, sub, region, ship, title, body, price,
                       cond, contact, agree_at, brand)
  values (v_uid, v_sub, v_region, v_ship, v_title, v_body, v_price,
          v_cond, v_contact, (p->>'agree_at')::timestamptz, v_brand)
  returning id into v_id;
  return v_id;
end $$;
revoke all on function open_listing(jsonb) from public;
grant execute on function open_listing(jsonb) to authenticated;


-- ── ⑥ 고치는 문 — 브랜드도 고칩니다 (0056 → 0068) ─────────────────
-- ⚠️⚠️ **보낸 칸만 고칩니다** — 0056 의 그 규칙을 그대로 둡니다.
--   ⚠️ 물건 종류 · 지역은 여전히 **못 고칩니다**(문의하신 분이 다른 물건에
--   묶입니다) — 0056 이 그 둘을 `coalesce` 로 받고는 있지만 화면이 칸을
--   안 내는 것이 규칙이고, 여기서 그것을 바꾸지 않습니다.
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
  if not coalesce(v_own = v_uid, false) then
    raise exception '올리신 분만 고치실 수 있습니다';
  end if;
  if v_st <> 'open' then
    raise exception '팔고 있는 매물만 고치실 수 있습니다';
  end if;

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
  if p ? 'brand' then
    if nullif(btrim(coalesce(p->>'brand','')), '') is null then
      raise exception '브랜드를 골라 주세요 (모르시면 기타)';
    end if;
    if char_length(btrim(p->>'brand')) > 30 then
      raise exception '브랜드가 너무 깁니다 (30자)';
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
    brand   = coalesce(nullif(btrim(coalesce(p->>'brand','')),  ''), brand),
    price   = coalesce(nullif(btrim(coalesce(p->>'price','')),  '')::int, price),
    ship    = coalesce((p->>'ship')::boolean, ship),
    contact = coalesce(nullif(btrim(coalesce(p->>'contact','')), ''), contact),
    updated_at = now()
   where id = v_id;
  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception '고치지 못했습니다'; end if;
  return 'edited';
end $$;
revoke all on function edit_listing(jsonb) from public;
grant execute on function edit_listing(jsonb) to authenticated;


-- ── ⑦ 공개 보기 둘 (0056 → 0068) ──────────────────────────────────
-- ⚠️⚠️ **칸이 늘어나므로 `create or replace` 가 안 됩니다** — 지우고 다시
--   만들고 **GRANT 를 바로 다시** 줍니다(지우면 권한도 같이 날아가서,
--   안 주면 그날부터 목록이 permission denied 입니다 · 0044 의 그 자리).
-- ⚠️⚠️ `contact` 와 `by_user` 는 여전히 **안 담습니다** — 글은 공개지만
--   누가 올렸는지와 연락처는 공개가 아닙니다.
drop view if exists v_listing_open;
create view v_listing_open as
  select l.id, l.sub, l.region, l.ship, l.title, l.body, l.price, l.cond,
         l.brand, l.created_at,
         (select count(*) from listingask a
           where a.listing_id = l.id and a.state = 'asked') as ask_n,
         -- ⚠️ 사진 수도 **세어서** 냅니다 (칸에 저장하면 누군가 고쳐 적습니다)
         (select count(*) from listingphoto f where f.listing_id = l.id) as photo_n,
         -- ⚠️⚠️ 목록 카드가 쓰는 **첫 장**입니다 — 이것이 없으면 카드마다
         --   사진을 따로 물어보게 되어 스무 장이면 스무 번 두드립니다.
         --   ⚠️ 0장이면 null 이고, 화면은 **아이콘 타일**로 돌아갑니다
         --   (남의 사진을 깔지 않습니다 · 절대 규칙 1).
         (select f.path from listingphoto f
           where f.listing_id = l.id order by f.created_at, f.id limit 1) as thumb
    from listing l
   where l.state = 'open';
grant select on v_listing_open to anon, authenticated;

-- ⚠️⚠️ **매물 사진이 공개로 나가는 단 하나의 길입니다** — 팔고 있는
--   매물의 사진만 냅니다. 내린 · 팔린 · 가려진 매물의 사진은 여기서
--   빠집니다(0059 가 내린 글의 사진을 뺀 그 자리와 같습니다).
drop view if exists v_listing_photo_public;
create view v_listing_photo_public as
  select f.id, f.listing_id, f.path, f.caption, f.created_at
    from listingphoto f
    join listing l on l.id = f.listing_id
   where l.state = 'open';

grant select on v_listing_photo_public to anon, authenticated;


insert into schema_version (n, name) values (68, '0068_listing_photo')
  on conflict (n) do nothing;

commit;

/* ---------------------------- 0069_listing_market.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0069 — 중고 골프장터 전면 개편 (사장님 작업지시서 · 2026-11-08)
-- ════════════════════════════════════════════════════════════════════
-- 지시서가 요구한 것 가운데 **DB 가 없어서 못 하던 것**만 여기서 세웁니다.
-- 0056(표 · 문 · 보기) · 0068(사진 · 브랜드 · 거르개)이 이미 선 자리는
-- 손대지 않습니다 — 지시서도 "기존 DB 를 먼저 분석하고 재사용 가능한
-- 부분은 활용한다" 고 적었습니다.
--
--   지시서가 바란 것            여기서 하는 것
--   ─────────────────────────   ─────────────────────────────────────
--   상품 분류를 늘린다          `listing.sub` 는 **글자**라 DB 가 모릅니다
--                               → 마이그레이션이 **필요 없습니다**
--                                 (`js/data/catalog.js` 에서 늘립니다)
--   모델명                      ① `listing.model` (비울 수 있습니다)
--   예약중                      ② `state` 에 `reserved` 를 더합니다
--   사진 열 장 · 순서 · 대표    ③ `listingphoto.ord` + 문 하나
--   찜(관심상품)                ④ 표 `listingfav` + 문 하나
--   상세 화면                   보기를 **안 더합니다** — `v_listing_open`
--                               에 `?id=eq.<uuid>` 로 한 줄만 받습니다
--   판매자 "김**"               ⑥ 보기가 **가려서** 냅니다
--
-- ⚠️⚠️⚠️ **분류 키를 가르는 것은 지금만 됩니다.** `listing.sub` 는 키를
--   글자로 담고, 운영 DB 는 아직 0007 이라 `listing` 표가 **없습니다**
--   (매물 0건). 그래서 `us-wood`("우드 · 유틸리티")를 `us-wood`(우드) +
--   `us-utility`(유틸리티)로 가르고 `us-wedge`("웨지 · 퍼터")를
--   `us-wedge`(웨지) + `us-putter`(퍼터)로 가를 수 있습니다.
--   **매물이 한 건이라도 올라오면 그때부터는 못 가릅니다** (그 매물이
--   옛 키를 글자로 들고 있습니다 — 분류 키를 바꿀 수 있는 때는 데이터가
--   0건일 때뿐이라고 적어 둔 그 자리입니다).
--   ⚠️ 그래서 **키는 하나도 빼지 않습니다** — 지시서의 열둘에 샤프트가
--   없지만 `us-shaft` 를 그대로 둡니다(빼면 그 키를 가진 매물이 갈 자리가
--   없어집니다).
--
-- ⚠️⚠️ **안 만드는 것 — 까닭과 함께**
--   · **찜 수를 공개하지 않습니다.** 세어서 낼 수야 있지만, 그 수는
--     "인기" 로 읽히고 우리가 그것을 검증할 길이 없습니다. 그리고 누가
--     무엇에 찜했는지는 **행동 기록**입니다 — 파는 분에게도 안 냅니다
--     (0059 의 `cqview` 를 운영자도 못 읽게 둔 그 까닭). 찜은 **제 것만**
--     보이고 `/my` 에서 모아 봅니다.
--   · **안전결제 · 에스크로 칸을 안 만듭니다.** 결제를 아예 받지 않으므로
--     (전자상거래법 제20조의3) 칸을 만들어 두면 누군가 "안전결제 가능" 을
--     켜고 그 순간 지키지 못하는 약속이 손님 화면에 나갑니다.
--   · **거래 건수 · 판매자 평점 칸을 안 만듭니다** (절대 규칙 1 — 세는
--     것은 보기가 하고, 평가는 우리가 만들지 않습니다).
--
-- 되돌아갔는지 보는 법
--   select 1 from information_schema.columns
--    where table_name = 'listing' and column_name = 'model';            -- 1
--   select 'reserved' = any(enum_range(null::text)::text[]);            -- (아래 대신)
--   select pg_get_constraintdef(oid) from pg_constraint
--    where conrelid = 'listing'::regclass and conname like '%state%';   -- reserved 가 있어야
--   select 1 from pg_proc where proname = 'order_listing_photo';        -- 1
--   select 1 from pg_proc where proname = 'fav_listing';                -- 1
--   select 1 from information_schema.columns
--    where table_name = 'v_listing_open' and column_name = 'seller';    -- 1
-- ════════════════════════════════════════════════════════════════════
begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 모델명 — 비울 수 있습니다
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️ **브랜드와 반대입니다.** 브랜드는 반드시 받습니다(0068 — 비면
--   거르개에 아무도 안 고르는 칸이 생겨 그 매물이 영영 안 보입니다).
--   모델명은 **거르개가 아니고** 찾는 말로만 쓰므로, 반드시 받으면
--   모델명을 모르시는 분이 매물을 **아예 못 올립니다**(절대 규칙 2).
-- ⚠️ 비면 상세 화면에서 **줄째 빠집니다** — "(미기재)" 를 찍지 않습니다.
alter table listing add column if not exists model text;
alter table listing drop constraint if exists listing_model_ok;
alter table listing add constraint listing_model_ok
  check (model is null or char_length(btrim(model)) between 1 and 40);


-- ════════════════════════════════════════════════════════════════════
-- ② 예약중 — 파는 분이 고릅니다
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **제약 이름을 글자로 박지 않습니다.** 0056 은 칸 안에 그냥
--   `check (state in (...))` 로 적어 이름을 Postgres 가 지어 줍니다 —
--   `drop constraint if exists listing_state_check` 로 적으면 이름이 다른
--   날 **옛 제약이 그대로 남고** `add constraint` 는 성공합니다. 그러면
--   `reserved` 를 **옛 제약이 거절**하는데 에러는 문 안에서 조용히 나고
--   화면에는 "옮길 수 없는 상태입니다" 만 보입니다 (0053 에서 `notice.kind`
--   의 check 를 떼어 낼 때 밟은 그 자리입니다).
do $$
declare r record;
begin
  for r in
    select c.conname
      from pg_constraint c
     where c.conrelid = 'listing'::regclass
       and c.contype = 'c'
       and pg_get_constraintdef(c.oid) ilike '%state%'
       and pg_get_constraintdef(c.oid) ilike '%''open''%'
       and pg_get_constraintdef(c.oid) not ilike '%hidden_why%'
  loop
    execute format('alter table listing drop constraint %I', r.conname);
  end loop;
end $$;

-- open     팔고 있습니다
-- reserved **예약중** — 파는 분이 "이분과 거래하는 중" 으로 두셨습니다
-- done     팔렸습니다
-- closed   글쓴이가 내렸습니다
-- hidden   운영자가 가렸습니다
-- ⚠️⚠️ 말은 `js/data/deal.js` 의 `AM_LST_ST` 한 곳이고 `check-deal` 이
--   이 check 와 맞춰 봅니다 (어긋나면 손님 화면에 영문 키가 찍힙니다).
alter table listing add constraint listing_state_ok
  check (state in ('open','reserved','done','closed','hidden'));

-- ⚠️⚠️ **목록에 보이는 상태가 둘이 되었습니다.** 0068 의
--   `listing_open_idx` 는 `where state = 'open'` 이라 예약중을 안 담습니다 —
--   그 줄을 안 고치면 예약중 매물이 색인을 못 타고 느려집니다.
create index if not exists listing_live_idx
  on listing (state, created_at desc) where state in ('open','reserved');


-- ════════════════════════════════════════════════════════════════════
-- ③ 사진 — 열 장 · 순서 · 대표
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **대표 사진을 boolean 으로 두지 않습니다.** `is_main` 을 두면
--   둘 다 참인 줄이 생길 수 있고(막으려면 부분 unique 인덱스가 또 필요),
--   그러면 화면이 둘 가운데 하나를 **멋대로** 고릅니다. 대표는 **순서가
--   가장 앞선 것**이고, 그래서 저장하는 값이 하나뿐입니다 (평균을 칸에
--   저장하지 않고 세는 그 결입니다).
alter table listingphoto add column if not exists ord int not null default 0;
alter table listingphoto drop constraint if exists listingphoto_ord_ok;
alter table listingphoto add constraint listingphoto_ord_ok
  check (ord >= 0 and ord <= 99);
-- ⚠️ 순서가 같으면(옛 줄은 전부 0 입니다) 올린 차례로 갈립니다 — 보기와
--   문이 `ord, created_at, id` 세 칸을 **같은 차례로** 씁니다.
create index if not exists listingphoto_ord_idx
  on listingphoto (listing_id, ord, created_at, id);

-- ── 사진 문 — 열 장까지 받고 순서를 뒤에 붙입니다 (0068 → 0069) ────
-- ⚠️⚠️ **0068 의 본문을 그대로 두고 두 군데만 고칩니다** — 여덟 → 열,
--   그리고 새 줄의 `ord` 를 **지금 가장 큰 값 + 1** 로 둡니다(0 으로
--   두면 올릴 때마다 대표가 바뀝니다).
-- ⚠️ 예약중 매물에도 사진을 더할 수 있습니다 (아직 팔린 것이 아닙니다).
create or replace function claim_listing_photo(p jsonb default '{}'::jsonb)
  returns jsonb
  language plpgsql security definer set search_path = public as $$
declare
  v_me    uuid := auth.uid();
  v_l     uuid := nullif(btrim(coalesce(p->>'listing','')), '')::uuid;
  v_mime  text := lower(btrim(coalesce(p->>'mime','')));
  v_bytes int  := coalesce((nullif(btrim(coalesce(p->>'bytes','')), ''))::int, 0);
  v_cap   text := nullif(btrim(coalesce(p->>'caption','')), '');
  v_ext   text;
  v_path  text;
  v_id    uuid;
  v_ord   int;
begin
  if v_me is null then raise exception '로그인하셔야 사진을 올릴 수 있습니다'; end if;
  if v_l is null then raise exception '어느 매물인지 알 수 없습니다'; end if;
  if not exists (select 1 from listing
                  where id = v_l and by_user = v_me
                    and state in ('open','reserved')) then
    raise exception '그 매물에는 사진을 붙일 수 없습니다';
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
  -- ⚠️ 그 수는 여기와 `js/lstphoto.js` **두 곳**에 있고, 화면이 먼저
  --   막아도 **DB 가 다시 봅니다**(화면에서만 막으면 꾸러미를 고쳐
  --   지나갑니다).
  if (select count(*) from listingphoto where listing_id = v_l) >= 10 then
    raise exception '사진은 열 장까지입니다. 먼저 빼 주세요';
  end if;

  select coalesce(max(ord), -1) + 1 into v_ord
    from listingphoto where listing_id = v_l;
  if v_ord > 99 then v_ord := 99; end if;

  v_ext := case v_mime when 'image/jpeg' then 'jpg'
                       when 'image/png'  then 'png'
                       else 'webp' end;
  v_path := 'lst/' || v_l::text || '/photo/' || gen_random_uuid()::text || '.' || v_ext;

  insert into listingphoto (listing_id, by_user, path, mime, bytes, caption, ord)
  values (v_l, v_me, v_path, v_mime, v_bytes, v_cap, v_ord)
  returning id into v_id;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'listingphoto', v_id::text, 'claimed',
          jsonb_build_object('mime', v_mime, 'bytes', v_bytes));

  return jsonb_build_object('id', v_id, 'path', v_path, 'ord', v_ord);
end $$;
revoke all on function claim_listing_photo(jsonb) from public;
grant execute on function claim_listing_photo(jsonb) to authenticated;

-- ── 순서를 바꾸는 문 (대표 사진을 정하는 길도 이것 하나입니다) ──────
-- ⚠️⚠️ **보내는 것은 사진 id 를 늘어놓은 배열**입니다. 한 장씩 "위로"
--   보내면 중간에 다른 창에서 한 장이 빠졌을 때 번호가 어긋납니다 —
--   늘어놓은 차례를 통째로 받으면 그 자리에서 다시 셉니다.
-- ⚠️ **그 매물의 사진이 빠짐없이 와야** 합니다 — 일부만 보내면 안 보낸
--   것이 어디로 가야 하는지 아무도 모릅니다(조용히 0 으로 두면 그것이
--   대표가 됩니다).
create or replace function order_listing_photo(p jsonb default '{}'::jsonb)
  returns int
  language plpgsql security definer set search_path = public as $$
declare
  v_me  uuid := auth.uid();
  v_l   uuid := nullif(btrim(coalesce(p->>'listing','')), '')::uuid;
  v_ids uuid[];
  v_n   int;
  v_have int;
  i     int;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_l is null then raise exception '어느 매물인지 알 수 없습니다'; end if;
  if not exists (select 1 from listing
                  where id = v_l and by_user = v_me
                    and state in ('open','reserved')) then
    raise exception '그 매물의 사진 순서는 바꾸실 수 없습니다';
  end if;
  if p->'ids' is null or jsonb_typeof(p->'ids') <> 'array' then
    raise exception '사진 차례를 보내 주세요';
  end if;

  select array_agg(x::uuid) into v_ids
    from jsonb_array_elements_text(p->'ids') as t(x);
  v_n := coalesce(array_length(v_ids, 1), 0);
  if v_n = 0 then raise exception '사진 차례를 보내 주세요'; end if;
  -- ⚠️ 같은 사진을 두 번 보내면 거절합니다 (한 자리가 비게 됩니다)
  if v_n <> (select count(distinct x) from unnest(v_ids) as t(x)) then
    raise exception '같은 사진이 두 번 들어 있습니다';
  end if;

  select count(*) into v_have from listingphoto where listing_id = v_l;
  if v_n <> v_have then
    raise exception '그 매물의 사진이 %장인데 %장만 보내셨습니다', v_have, v_n;
  end if;
  -- ⚠️ 남의 매물 사진 id 를 섞어 보내는 것을 막습니다
  if exists (select 1 from unnest(v_ids) as t(x)
              where not exists (select 1 from listingphoto
                                 where id = t.x and listing_id = v_l)) then
    raise exception '그 매물의 사진이 아닌 것이 들어 있습니다';
  end if;

  for i in 1 .. v_n loop
    update listingphoto set ord = i - 1 where id = v_ids[i] and listing_id = v_l;
  end loop;

  -- ⚠️ 기록에 **장수만** 남깁니다 (사진 설명 · 경로는 손님 것입니다)
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'listing', v_l::text, 'photo_ordered',
          jsonb_build_object('n', v_n));
  return v_n;
end $$;
revoke all on function order_listing_photo(jsonb) from public;
grant execute on function order_listing_photo(jsonb) to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ④ 찜 (관심상품)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **찜 수를 공개하지 않습니다** (머리말에 적은 까닭 셋). 그래서
--   이 표에는 집계 보기가 없고, 공개 보기에도 칸이 없습니다.
-- ⚠️ 0058 의 `watch` 와 같은 꼴입니다 — 제 것만 보이고 쓰는 길은 문뿐.
create table if not exists listingfav (
  by_user    uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references listing(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (by_user, listing_id)
);
create index if not exists listingfav_mine_idx
  on listingfav (by_user, created_at desc);

alter table listingfav enable row level security;

-- ⚠️⚠️ **운영자 정책도 두지 않습니다** — 누가 무엇에 찜했는지는 행동
--   기록이고, 운영자가 그것을 읽을 까닭이 없습니다 (0050 의 알림 ·
--   0059 의 `cqview` 와 같은 결).
drop policy if exists listingfav_mine on listingfav;
create policy listingfav_mine on listingfav
  for select using (by_user = auth.uid());

-- ⚠️⚠️ **쓰기 GRANT 를 주지 않습니다** — 들어오는 길은 문 하나뿐입니다.
grant select on listingfav to authenticated;

-- ── 찜 켜고 끄는 문 하나 ───────────────────────────────────────────
-- ⚠️ 켜고 끄는 문을 **하나**로 둡니다 — 둘로 나누면 화면이 지금 상태를
--   먼저 알아야 하고, 그 사이에 다른 창에서 바뀌면 어긋납니다.
create or replace function fav_listing(p jsonb default '{}'::jsonb)
  returns boolean
  language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_l  uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_on boolean := coalesce((p->>'on')::boolean, true);
  v_st text;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_l is null then raise exception '어느 매물인지 알 수 없습니다'; end if;

  if v_on then
    select state into v_st from listing where id = v_l;
    if v_st is null then raise exception '그런 매물이 없습니다'; end if;
    -- ⚠️ 내려간 · 가려진 매물은 찜할 수 없습니다 (목록에 안 보이는 것을
    --   찜해 두면 관심상품에 **열 수 없는 줄**이 쌓입니다)
    if v_st not in ('open','reserved','done') then
      raise exception '지금은 찜할 수 없는 매물입니다';
    end if;
    -- ⚠️ 수백 개면 관심상품 목록이 쓸모없어집니다 (0058 과 같은 결)
    if (select count(*) from listingfav where by_user = v_me) >= 200 then
      raise exception '찜은 200개까지입니다. 먼저 정리해 주세요';
    end if;
    insert into listingfav (by_user, listing_id) values (v_me, v_l)
      on conflict (by_user, listing_id) do nothing;
    return true;
  end if;

  delete from listingfav where by_user = v_me and listing_id = v_l;
  return false;
end $$;
revoke all on function fav_listing(jsonb) from public;
grant execute on function fav_listing(jsonb) to authenticated;

-- ── 관심상품 보기 (`/my`) ──────────────────────────────────────────
-- ⚠️⚠️ **`v_listing_open` 을 그대로 쓸 수 없습니다** — 찜해 둔 매물이
--   팔리면 그 보기에서 빠지고, 그러면 관심상품 목록에서 **조용히
--   사라집니다**("팔렸습니다" 를 보여 드리는 것이 맞습니다).
-- ⚠️ 그래서 여기서는 `state` 를 그대로 내고, 내려간 · 가려진 것만 뺍니다.
-- ⚠️⚠️ `contact` · `by_user` 는 **안 담습니다** (0056 · 0068 과 같은 선).
drop view if exists v_listing_fav;
create view v_listing_fav as
  select f.listing_id as id, f.created_at as fav_at,
         l.sub, l.region, l.ship, l.title, l.price, l.cond, l.brand, l.model,
         l.state, l.created_at,
         (select ph.path from listingphoto ph
           where ph.listing_id = l.id
           order by ph.ord, ph.created_at, ph.id limit 1) as thumb
    from listingfav f
    join listing l on l.id = f.listing_id
   where f.by_user = auth.uid()
     and l.state in ('open','reserved','done');
grant select on v_listing_fav to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ⑤ 문 넷 — 예약중을 알게 하고 모델명을 받습니다
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **상태 하나를 더하면 문 넷이 같이 막힙니다.** 0056 의
--   `edit_listing` · `ask_listing` · `close_listing` 과 0068 의 사진 문
--   둘이 전부 `state = 'open'` 을 요구합니다 — 그대로 두면 예약중으로
--   바꾸는 순간 그 매물을 **고칠 수도 · 문의받을 수도 · 되돌릴 수도**
--   없어집니다(0056 이 `hidden` 을 더하면서 "상태 하나를 더하는 것만으로
--   신청 · 고치기 · 닫기가 저절로 막힙니다" 라고 적은 그 자리를
--   **거꾸로** 밟는 꼴입니다).

-- ── 올리는 문 — 모델명을 받습니다 (0056 → 0068 → 0069) ────────────
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
  v_brand   text := nullif(btrim(coalesce(p->>'brand','')), '');
  v_model   text := nullif(btrim(coalesce(p->>'model','')), '');
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
  if v_brand is null then
    raise exception '브랜드를 골라 주세요 (모르시면 기타)';
  end if;
  if char_length(v_brand) > 30 then
    raise exception '브랜드가 너무 깁니다 (30자)';
  end if;
  -- ⚠️ 모델명은 **비워도 됩니다** — 모르시는 분이 못 올리면 안 됩니다
  if v_model is not null and char_length(v_model) > 40 then
    raise exception '모델명이 너무 깁니다 (40자)';
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
  if v_cond not in ('new','like','good','fair') then
    raise exception '물건 상태가 올바르지 않습니다';
  end if;
  if v_contact is null then
    raise exception '연락처를 적어 주세요';
  end if;
  if length(v_contact) > 100 then
    raise exception '연락처가 너무 깁니다';
  end if;
  if p->>'agree_at' is null then
    raise exception '개인정보 수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes'
     or (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의 시각이 올바르지 않습니다';
  end if;
  -- ⚠️ 예약중도 **팔고 있는 것**으로 셉니다 (아직 안 팔렸습니다)
  if (select count(*) from listing
       where by_user = v_uid and state in ('open','reserved')) >= 10 then
    raise exception '팔고 계신 매물이 열입니다. 먼저 정리해 주세요';
  end if;
  if (select count(*) from listing
       where by_user = v_uid and created_at > now() - interval '1 day') >= 20 then
    raise exception '오늘은 더 올릴 수 없습니다 (하루 스무 개)';
  end if;

  insert into listing (by_user, sub, region, ship, title, body, price,
                       cond, contact, agree_at, brand, model)
  values (v_uid, v_sub, v_region, v_ship, v_title, v_body, v_price,
          v_cond, v_contact, (p->>'agree_at')::timestamptz, v_brand, v_model)
  returning id into v_id;
  return v_id;
end $$;
revoke all on function open_listing(jsonb) from public;
grant execute on function open_listing(jsonb) to authenticated;

-- ── 고치는 문 — 모델명도 고치고 예약중에도 됩니다 ──────────────────
-- ⚠️⚠️ **보낸 칸만 고칩니다** (0056 의 그 규칙). ⚠️ 물건 종류 · 지역은
--   여전히 화면이 칸을 안 냅니다(문의하신 분이 다른 물건에 묶입니다).
-- ⚠️⚠️⚠️ **모델명은 비우는 것도 보내는 것입니다** — `coalesce` 로 받으면
--   빈 글자가 "안 보냈다" 와 섞여 **지울 수가 없습니다**. `p ? 'model'`
--   로 보냈는지를 보고, 보냈으면 빈 것은 null 로 넣습니다.
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
  if not coalesce(v_own = v_uid, false) then
    raise exception '올리신 분만 고치실 수 있습니다';
  end if;
  if v_st not in ('open','reserved') then
    raise exception '팔고 있는 매물만 고치실 수 있습니다';
  end if;

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
  if p ? 'brand' then
    if nullif(btrim(coalesce(p->>'brand','')), '') is null then
      raise exception '브랜드를 골라 주세요 (모르시면 기타)';
    end if;
    if char_length(btrim(p->>'brand')) > 30 then
      raise exception '브랜드가 너무 깁니다 (30자)';
    end if;
  end if;
  if p ? 'model' and char_length(btrim(coalesce(p->>'model',''))) > 40 then
    raise exception '모델명이 너무 깁니다 (40자)';
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
    brand   = coalesce(nullif(btrim(coalesce(p->>'brand','')),  ''), brand),
    model   = case when p ? 'model'
                   then nullif(btrim(coalesce(p->>'model','')), '')
                   else model end,
    price   = coalesce(nullif(btrim(coalesce(p->>'price','')),  '')::int, price),
    ship    = coalesce((p->>'ship')::boolean, ship),
    contact = coalesce(nullif(btrim(coalesce(p->>'contact','')), ''), contact),
    updated_at = now()
   where id = v_id;
  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception '고치지 못했습니다'; end if;
  return 'edited';
end $$;
revoke all on function edit_listing(jsonb) from public;
grant execute on function edit_listing(jsonb) to authenticated;

-- ── 문의하는 문 — 예약중에도 받습니다 (0056 → 0069) ───────────────
-- ⚠️⚠️ **예약중은 "팔렸다" 가 아닙니다.** 앞의 거래가 깨질 수 있으므로
--   문의는 받고, 화면이 **예약중이라는 사실을 그 자리에서** 말합니다
--   (문을 닫아 두면 손님은 까닭을 모르고 "고장" 으로 읽습니다).
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
  -- ⚠️⚠️ **예약중에도 문의를 받습니다** (0056 → 0069) — 예약중은
  --   "팔렸다" 가 아니고 앞의 거래가 깨질 수 있습니다. 문을 닫아
  --   두면 손님은 까닭을 모르고 "고장" 으로 읽습니다 — 화면이
  --   **예약중이라는 사실을 그 자리에서** 말합니다.
  if v_st not in ('open','reserved') then
    raise exception '지금은 문의를 받지 않는 매물입니다';
  end if;
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

-- ── 상태를 옮기는 문 — 예약중을 오갑니다 (0056 → 0069) ────────────
-- ⚠️⚠️⚠️ **예약중은 파는 분이 고릅니다** (운영자가 아닙니다 — 운영자가
--   내리는 길은 `move_listing` 하나이고 그것은 `hidden` 입니다).
--   오갈 수 있는 길만 적습니다 —
--     open     → reserved · done · closed
--     reserved → open · done · closed      ← **되돌릴 수 있어야** 합니다
--     done · closed · hidden → 아무 데도
--   ⚠️ 되돌리는 길을 안 내면 잘못 누른 분이 매물을 **다시 올려야** 하고,
--   그러면 받아 둔 문의가 통째로 날아갑니다 (막다른 길 · 절대 규칙 2).
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
  if v_to not in ('open','reserved','done','closed') then
    raise exception '옮길 수 없는 상태입니다';
  end if;

  select by_user, state into v_own, v_st from listing where id = v_id for update;
  if v_st is null then raise exception '그런 매물이 없습니다'; end if;
  if not coalesce(v_own = v_uid, false) then
    raise exception '올리신 분만 바꾸실 수 있습니다';
  end if;
  if v_st = 'hidden' then
    raise exception '운영자가 가린 매물입니다 — 고객센터로 문의해 주세요';
  end if;
  if v_st not in ('open','reserved') then
    raise exception '이미 내려간 매물입니다';
  end if;
  -- ⚠️ 같은 상태로 옮기는 것은 **거절**합니다 — 조용히 성공으로 끝내면
  --   화면이 "바꿨습니다" 를 적는데 실제로는 아무 일도 안 일어났습니다
  --   (0054 의 "없는 역할을 떼면 거절한다" 와 같은 결).
  if v_to = v_st then
    raise exception '이미 그 상태입니다';
  end if;

  update listing set state = v_to, updated_at = now() where id = v_id;
  return v_to;
end $$;
revoke all on function close_listing(jsonb) from public;
grant execute on function close_listing(jsonb) to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ⑥ 공개 보기 둘 — 모델명 · 상태 · 가린 판매자 · 사진 차례
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️ **칸이 늘어나므로 `create or replace` 가 안 됩니다** — 지우고 다시
--   만들고 **GRANT 를 바로 다시** 줍니다.
-- ⚠️⚠️⚠️ **이름이 `v_listing_open` 인데 예약중도 냅니다.** 이름을 바꾸지
--   않는 까닭은 읽는 자리가 여럿(목록 · 메인 · 알림 트리거)이고 이름을
--   바꾸면 그 전부를 같이 고쳐야 하는데, 한 곳을 빠뜨리면 **조용히
--   빈 목록**이 됩니다. 그래서 `state` 칸을 같이 내고 **화면이 딱지를
--   붙입니다** — 보기가 내는 것은 "지금 살 수 있는 매물" 입니다.
-- ⚠️⚠️ `contact` 와 `by_user` 는 여전히 **안 담습니다** — 글은 공개지만
--   누가 올렸는지와 연락처는 공개가 아닙니다. 판매자는 **가린 성함**만
--   냅니다(화면에서 가리면 본이름이 이미 브라우저까지 온 것입니다 · 0052).
drop view if exists v_listing_open;
create view v_listing_open as
  select l.id, l.sub, l.region, l.ship, l.title, l.body, l.price, l.cond,
         l.brand, l.model, l.state, l.created_at,
         left(coalesce(nullif(btrim(a.name), ''), '회원'), 1) ||
         repeat('*', greatest(
           char_length(coalesce(nullif(btrim(a.name), ''), '회원')) - 1, 0))
           as seller,
         (select count(*) from listingask k
           where k.listing_id = l.id and k.state = 'asked') as ask_n,
         (select count(*) from listingphoto f where f.listing_id = l.id) as photo_n,
         -- ⚠️⚠️ **대표 사진입니다** — 0068 은 올린 차례의 첫 장이었고,
         --   이제 파는 분이 정한 차례(`ord`)의 첫 장입니다. 차례가 같으면
         --   올린 차례로 갈립니다(옛 줄은 전부 0 입니다).
         (select f.path from listingphoto f
           where f.listing_id = l.id
           order by f.ord, f.created_at, f.id limit 1) as thumb
    from listing l
    left join account a on a.id = l.by_user
   where l.state in ('open','reserved');
grant select on v_listing_open to anon, authenticated;

-- ⚠️⚠️ **예약중 매물의 사진도 나갑니다** — 안 내면 예약중으로 바꾸는
--   순간 카드가 **아이콘 타일로 돌아가** 사진을 뺀 것처럼 보입니다.
drop view if exists v_listing_photo_public;
create view v_listing_photo_public as
  select f.id, f.listing_id, f.path, f.caption, f.ord, f.created_at
    from listingphoto f
    join listing l on l.id = f.listing_id
   where l.state in ('open','reserved');
grant select on v_listing_photo_public to anon, authenticated;


insert into schema_version (n, name) values (69, '0069_listing_market')
  on conflict (n) do nothing;

commit;

/* ---------------------------- 0070_listing_unhide.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0070 — 가린 매물을 **되돌리는 길** (중고장터 개편 지시서 §7)
--
-- ⚠️⚠️⚠️ **0056 의 `move_listing` 은 한쪽으로만 갑니다.**
--   `if v_to <> 'hidden' then raise exception '옮길 수 없는 상태입니다'`
--   — 즉 운영자가 한 번 가리면 **되돌릴 길이 아무에게도 없었습니다.**
--   올린 분의 문(`edit_listing` · `close_listing`)은 전부
--   `state in ('open','reserved')` 를 요구하므로 가려진 매물에는 안
--   듣고, 사장님이 SQL 편집기에서 직접 `update` 를 치셔야 했습니다.
--   0043 이 잇는 문만 내고 끊는 문을 안 낸 자리 · 0025 가 붙이는 문만
--   내고 떼는 문을 안 낸 자리(0054 가 고쳤습니다)와 **같은 꼴**입니다.
--   ⚠️ `check-doors` 는 이것을 **못 잡습니다** — `move_listing` 을
--   부르는 화면은 있습니다(신고 처리). 없는 것은 **되돌리는 방향**이고,
--   **없는 것은 셀 수가 없습니다.**
--
-- ⚠️⚠️ **「판매중」으로 되돌리지 않습니다 — 가리기 전 상태로 되돌립니다.**
--   팔린(`done`) 매물을 가렸다가 되돌리면서 `open` 으로 두면 **이미
--   팔린 물건이 다시 살 수 있는 것처럼** 목록에 섭니다 (절대 규칙 1).
--   그래서 가릴 때 그 전 상태를 `hidden_from` 에 적어 둡니다.
--   ⚠️ 0070 **전에** 가려진 줄은 그 칸이 null 이라 `open` 으로 돌아갑니다
--   — 지어낼 수 없는 값이고, 운영 DB 에는 그런 줄이 0건입니다
--   (`listing` 표가 아직 운영에 없습니다).
--
-- ⚠️⚠️ **같은 상태로 옮기는 것은 거절합니다** — 조용히 성공하면 화면이
--   "바꿨습니다" 를 적는데 아무 일도 안 일어났고, 감사 기록에는
--   "가렸다" 가 남습니다 (0054 에서 세운 규칙).
--
-- ⚠️ 되돌아갔는지 보는 법 (0056 을 다시 붙여 넣으면 이 문이 내려갑니다):
--     select pg_get_functiondef('move_listing(jsonb)'::regprocedure)
--       like '%hidden_from%' as ok_0070;
--   false 면 0070 을 다시 붙여 넣으세요.
--   체인: move_listing(0056→0070)
-- ════════════════════════════════════════════════════════════════════

begin;

-- ① 가리기 전 상태를 적어 두는 칸
--    ⚠️ 값 묶음을 check 로 박지 않습니다 — `listing.state` 의 check 가
--      늘어나는 날 두 곳이 어긋나고, 그때 되돌리기가 조용히 거절됩니다.
alter table listing add column if not exists hidden_from text;

comment on column listing.hidden_from is
  '가리기 직전의 state. 되돌릴 때 이 값으로 돌아갑니다 (null 이면 open).';

-- ② 칸 단위 GRANT — ⚠️⚠️⚠️ **0069 가 `model` 을 빠뜨렸습니다.**
--   0056 은 `listing` 에 **칸 단위**로 select 를 줍니다(연락처 · 동의
--   시각을 빼려고 그렇게 했습니다). 칸 단위 GRANT 는 **나중에 생긴
--   칸을 저절로 덮지 않습니다** — 0068 은 `brand` 를 따로 줬는데
--   0069 는 `model` 을 더해 놓고 GRANT 를 안 줬습니다.
--   ⚠️⚠️ 그래서 `js/mylisting.js` 의
--     listing?select=id,title,...,brand,model,hidden_why,created_at
--   가 **질의째 거절**되고(0줄이 아닙니다), `/my` 의 「내 판매글」
--   상자가 **통째로 안 뜹니다.** 올리신 분이 제 매물을 고칠 수도 ·
--   팔렸다고 표시할 수도 · 사진을 붙일 수도 없습니다.
--   ⚠️ 검사가 못 잡은 까닭: `test-desk` 의 흉내 서버는 **칸 GRANT 를
--   흉내 내지 않습니다**(정해진 JSON 을 돌려줍니다). 그래서
--   `tools/sql/listing.js` 가 **그 질의를 글자 그대로** 눌러 봅니다.
--   ⚠️ **칸을 더하는 날 GRANT 도 같이** — 0053 의 `memo` · 0013 의
--   연락처와 같은 자리이고, 이번은 거꾸로(안 줘서 막힌 쪽)입니다.
grant select (model, hidden_from) on listing to authenticated;

-- ③ 문 — 가리기 · 되돌리기 (운영자만)
create or replace function move_listing(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_to  text := nullif(btrim(coalesce(p->>'state','')), '');
  v_why text := nullif(btrim(coalesce(p->>'why','')), '');
  v_st  text;
  v_fr  text;
  v_new text;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 매물인지 알 수 없습니다'; end if;
  -- ⚠️⚠️ 0070 — 되돌리는 길이 생겼습니다. `open` 은 "가리기 전으로" 라는
  --   뜻이고, 어느 상태로 돌아가는지는 `hidden_from` 이 정합니다.
  if v_to not in ('hidden','open') then
    raise exception '옮길 수 없는 상태입니다';
  end if;
  if not coalesce(my_role() in ('staff','admin'), false) then
    raise exception '가리는 것은 운영자만 할 수 있습니다';
  end if;

  select state, hidden_from into v_st, v_fr
    from listing where id = v_id for update;
  if v_st is null then raise exception '그런 매물이 없습니다'; end if;

  if v_to = 'hidden' then
    -- ⚠️⚠️ 까닭을 **반드시** 받습니다 — 까닭 없이 가릴 수 있으면 불평이
    --   올 때마다 지워 주는 자리가 됩니다
    if v_why is null or char_length(v_why) < 5 then
      raise exception '가리는 까닭을 다섯 글자 이상 적어 주세요';
    end if;
    if v_st = 'hidden' then raise exception '이미 가려진 매물입니다'; end if;

    update listing set state = 'hidden', hidden_why = v_why,
                       hidden_by = v_uid, hidden_at = now(),
                       hidden_from = v_st, updated_at = now()
     where id = v_id;
    v_new := 'hidden';
  else
    if v_st <> 'hidden' then raise exception '가려진 매물이 아닙니다'; end if;
    -- ⚠️ 되돌릴 때는 까닭을 안 받습니다 — 받으면 되돌리기가 가리기보다
    --   어려워지고, 그러면 잘못 가린 것이 그대로 남습니다.
    v_new := coalesce(nullif(btrim(coalesce(v_fr,'')), ''), 'open');
    -- ⚠️⚠️ **가리기 전 상태가 다시 `hidden` 일 수는 없습니다** — 그랬으면
    --   위에서 '이미 가려진 매물입니다' 로 막혔습니다. 그래도 한 번 더
    --   봅니다 (0070 전에 손으로 적힌 줄이 있을 수 있습니다).
    if v_new = 'hidden' then v_new := 'open'; end if;

    update listing set state = v_new, hidden_why = null, hidden_by = null,
                       hidden_at = null, hidden_from = null, updated_at = now()
     where id = v_id;
  end if;

  -- ⚠️ 감사 기록에 **본문을 넣지 않습니다** (오래 남고 보는 사람도 넓습니다)
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, data)
  values (v_uid, my_role(), 'listing', v_id::text, v_st, v_new,
          jsonb_build_object('why_len', coalesce(char_length(v_why), 0)));
  return v_new;
end $$;

revoke all on function move_listing(jsonb) from public;
grant execute on function move_listing(jsonb) to authenticated;

-- ⚠️ 돌린 판을 적어 둡니다 — `db/verify.sql` 과 `tools/sql/base.js` 가
--   **파일 수와 이 표의 줄 수가 같은지**를 봅니다 (안 적으면 그 줄이
--   빨개지고, 운영에서는 "무엇까지 올라갔나" 를 셀 수가 없습니다).
insert into schema_version (n, name) values (70, '0070_listing_unhide')
  on conflict (n) do nothing;

commit;
