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
