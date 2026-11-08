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
