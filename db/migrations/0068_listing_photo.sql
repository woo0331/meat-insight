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
