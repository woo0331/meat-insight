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
