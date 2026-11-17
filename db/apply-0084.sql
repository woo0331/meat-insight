/* ==================================================================
   0084 ~ 0084 를 한 번에 —
   Supabase SQL 편집기에 **이 파일을 통째로** 붙여 넣고 Run 하세요.
   ==================================================================
   WARN 빌드가 만드는 파일입니다 — 손으로 고치지 마세요.
   db/migrations 의 1개를 번호 차례로 이어 붙인 것이고
   한 글자도 바꾸지 않았습니다. (node tools/make-apply.js)

   조각 파일입니다 — 바로 앞 조각까지 끝낸 DB 에만 쓰세요.
   어디까지 됐는지는 db/resume.sql 이 말해 줍니다
   (select max(n) from schema_version).

   돌린 뒤에는 db/verify.sql 을 붙여 넣어 보세요. 중간에서 멈추면 그
   파일 하나만 따로 돌리고 그 다음부터 이어 가시면 됩니다 — 번호를
   다시 쓰지 않습니다.

   WARN 통째로 begin/commit 으로 감싸지 마세요 — 파일마다 제
   트랜잭션이 있고 0015 는 일부러 감싸지 않았습니다. */

/* ---------------------------- 0084_listing_photo_five.sql ---------------------------- */
-- 0084 — 중고 매물 사진: 다섯 장 · 동시 요청 잠금 · 저장 완료 표시 (2026-11-17)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️ **운영에 아직 안 올렸습니다.** 사장님 승인 뒤에 올립니다.
--
-- 왜 —
--   ① 화면 · 서버(api/upload.js)는 다섯 장인데 문(0069)은 **열 장**이었습니다. 문을 직접
--      부르면(PostgREST rpc) 서버를 안 지나 열 장까지 줄이 생깁니다.
--   ② 두 탭 · 동시 요청이 **같은 순간에 세면** 둘 다 "아직 넷" 으로 읽고 여섯째가 들어갑니다.
--      매물 줄을 `for update` 로 먼저 잠그고 셉니다(조인 정원과 같은 수 · 0046).
--   ③ 자리를 청한 순간(claim) 줄이 생기고 파일은 **그 뒤에** 갑니다. 그래서 파일이 안 갔거나
--      브라우저를 안 지난 파일(위치정보가 그대로인 원본)이 **공개 보기에 바로** 나갔습니다.
--      이제 서버(api/upload.js 의 저장 완료 검사)가 실제 파일을 보고 `stored_at` 을 적어야만
--      공개 보기 · 목록 카드에 나갑니다.
--   ④ (2026-11-17 더함) 문의 문이 손님이 **본 값**을 마지막으로 맞춰 보고 그때 값을 문의에 담습니다
--      (`listingask.price_at`). 상세를 열어 둔 사이 값이 바뀌면 옛 값을 보고 문의가 갔습니다.
--
-- 0082 · 0083 과 — **내용으로는 서로 상관이 없습니다**(사진 표 · 문 · 보기만 건드립니다).
--   다만 번호가 그 뒤라, `schema_version` 차례를 지키려면 **0082 → 0083 → 0084** 로 올립니다.
--   0082 · 0083 을 미루고 이것만 먼저 올려야 하면 그날 번호를 다시 정합니다(지금은 그대로 둡니다).
--
-- 기존 자료 — 이미 있는 사진 줄은 **저장된 것으로** 칩니다(이 파일이 칸을 처음 만들 때 한 번만).
--   여섯 장 넘게 가진 매물이 있어도 **지우지 않습니다** — 더 붙이지만 못 합니다.
--
-- 되돌리기 — 맨 아래 주석. 칸(`stored_at`)은 남깁니다(값이 사라지지 않게).
-- ════════════════════════════════════════════════════════════════════
begin;

-- ① 저장 완료 칸 — ⚠️ 칸을 **처음 만들 때만** 기존 줄을 채웁니다(두 번 붙여 넣어도
--    올리는 중인 줄을 "저장됨" 으로 바꾸지 않게).
do $$ begin
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'listingphoto'
                    and column_name = 'stored_at') then
    alter table listingphoto add column stored_at timestamptz;
    update listingphoto set stored_at = created_at;
  end if;
end $$;

-- ② 자리를 청하는 문 — 0069 에서 **잠금 · 다섯 장**만 바뀌었습니다.
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
  -- ⚠️⚠️ **매물 줄을 먼저 잠급니다** — 두 요청이 같은 순간에 세면 둘 다 통과합니다.
  perform 1 from listing
    where id = v_l and by_user = v_me and state in ('open','reserved')
    for update;
  if not found then
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
  -- ⚠️ 올리는 중인 줄(`stored_at` 이 빈 줄)도 **같이 셉니다** — 안 세면 올리는 동안
  --   다른 탭에서 다섯 장을 더 청할 수 있습니다. 그 수는 js/lstphoto.js 의 MANY ·
  --   api/upload.js 의 LST_MANY 와 같습니다.
  if (select count(*) from listingphoto where listing_id = v_l) >= 5 then
    raise exception '사진은 다섯 장까지입니다. 먼저 빼 주세요';
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

-- ③ 저장 완료 — ⚠️⚠️ **서버만** 부릅니다(service_role). 손님 토큰으로 부르게 두면
--   파일을 안 보고 "저장됨" 을 적을 수 있습니다. 서버가 실제 파일의 첫 바이트 · 머리 ·
--   위치정보를 보고 나서 부릅니다(api/upload.js).
create or replace function store_listing_photo(p jsonb default '{}'::jsonb)
  returns int
  language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_n  int;
begin
  if v_id is null then raise exception '어느 사진인지 알 수 없습니다'; end if;
  update listingphoto set stored_at = now() where id = v_id and stored_at is null;
  get diagnostics v_n = row_count;
  return v_n;
end $$;
revoke all on function store_listing_photo(jsonb) from public;
revoke all on function store_listing_photo(jsonb) from anon, authenticated;
grant execute on function store_listing_photo(jsonb) to service_role;

-- ④ 차례 바꾸기 — **저장된 사진만** 셉니다(올리는 중인 줄은 화면에 안 보이므로
--   그것까지 "빠짐없이" 보내라고 하면 늘 거절됩니다). 나머지는 0069 그대로.
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
  perform 1 from listing
    where id = v_l and by_user = v_me and state in ('open','reserved')
    for update;
  if not found then
    raise exception '그 매물의 사진 순서는 바꾸실 수 없습니다';
  end if;
  if p->'ids' is null or jsonb_typeof(p->'ids') <> 'array' then
    raise exception '사진 차례를 보내 주세요';
  end if;

  select array_agg(x::uuid) into v_ids
    from jsonb_array_elements_text(p->'ids') as t(x);
  v_n := coalesce(array_length(v_ids, 1), 0);
  if v_n = 0 then raise exception '사진 차례를 보내 주세요'; end if;
  if v_n <> (select count(distinct x) from unnest(v_ids) as t(x)) then
    raise exception '같은 사진이 두 번 들어 있습니다';
  end if;

  select count(*) into v_have from listingphoto
   where listing_id = v_l and stored_at is not null;
  if v_n <> v_have then
    raise exception '그 매물의 사진이 %장인데 %장만 보내셨습니다', v_have, v_n;
  end if;
  if exists (select 1 from unnest(v_ids) as t(x)
              where not exists (select 1 from listingphoto
                                 where id = t.x and listing_id = v_l
                                   and stored_at is not null)) then
    raise exception '그 매물의 사진이 아닌 것이 들어 있습니다';
  end if;

  for i in 1 .. v_n loop
    update listingphoto set ord = i - 1 where id = v_ids[i] and listing_id = v_l;
  end loop;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'listing', v_l::text, 'photo_ordered',
          jsonb_build_object('n', v_n));
  return v_n;
end $$;
revoke all on function order_listing_photo(jsonb) from public;
grant execute on function order_listing_photo(jsonb) to authenticated;

-- ⑤ 공개 보기 둘 — **저장된 사진만** 냅니다. 칸은 그대로라 replace 로 됩니다.
create or replace view v_listing_open as
  select l.id, l.sub, l.region, l.ship, l.title, l.body, l.price, l.cond,
         l.brand, l.model, l.state, l.created_at,
         left(coalesce(nullif(btrim(a.name), ''), '회원'), 1) ||
         repeat('*', greatest(
           char_length(coalesce(nullif(btrim(a.name), ''), '회원')) - 1, 0))
           as seller,
         (select count(*) from listingask k
           where k.listing_id = l.id and k.state = 'asked') as ask_n,
         (select count(*) from listingphoto f
           where f.listing_id = l.id and f.stored_at is not null) as photo_n,
         (select f.path from listingphoto f
           where f.listing_id = l.id and f.stored_at is not null
           order by f.ord, f.created_at, f.id limit 1) as thumb,
         l.flex, l.hand
    from listing l
    left join account a on a.id = l.by_user
   where l.state in ('open','reserved');
grant select on v_listing_open to anon, authenticated;

create or replace view v_listing_photo_public as
  select f.id, f.listing_id, f.path, f.caption, f.ord, f.created_at
    from listingphoto f
    join listing l on l.id = f.listing_id
   where l.state in ('open','reserved')
     and f.stored_at is not null;
grant select on v_listing_photo_public to anon, authenticated;

-- ④ 문의 — 손님이 **본 값**을 서버가 마지막으로 맞춰 보고, 그때 값을 문의에 담습니다 (2026-11-17)
--   ⚠️⚠️ 상세 화면을 열어 둔 사이 파는 분이 값을 바꾸면, 손님은 옛 값을 보고 문의를 보내고
--   파는 분은 새 값으로 읽습니다. 화면이 보내기 직전에 다시 읽지만 그 틈까지 막으려고
--   여기서 한 번 더 봅니다. ⚠️ 옛 화면은 `seen_price` 를 안 보내므로 그때는 안 봅니다.
--   ⚠️ 문의는 **가격 약속이 아닙니다**(값은 둘이 이야기합니다) — 그래도 "문의하신 때의 값" 이
--   남아야 나중에 "그 값에 판다고 했다" 를 둘이 같은 자료로 봅니다.
alter table listingask add column if not exists price_at int;
grant select (price_at) on listingask to authenticated;

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
  v_price   int;
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

  select by_user, state, price into v_own, v_st, v_price from listing where id = v_lst for update;
  if v_st is null then raise exception '그런 매물이 없습니다'; end if;
  if v_st not in ('open','reserved') then
    raise exception '지금은 문의를 받지 않는 매물입니다';
  end if;
  if coalesce(v_own = v_uid, false) then
    raise exception '올리신 분은 문의하실 수 없습니다';
  end if;
  -- ⚠️⚠️ 본 값 — 숫자가 아니면 안 맞춰 보는 것이 아니라 **거절**합니다(꾸러미를 고친 것입니다)
  if p ? 'seen_price' and jsonb_typeof(p->'seen_price') <> 'null' then
    if jsonb_typeof(p->'seen_price') <> 'number' then
      raise exception '보신 값을 알 수 없습니다';
    end if;
    if (p->>'seen_price')::numeric is distinct from v_price::numeric then
      raise exception '값이 바뀌었습니다 — 바뀐 값을 확인하고 다시 문의해 주세요';
    end if;
  end if;

  if (select count(*) from listingask
       where by_user = v_uid and created_at > now() - interval '1 day') >= 30 then
    raise exception '오늘은 더 문의할 수 없습니다 (하루 서른 건)';
  end if;

  insert into listingask (listing_id, by_user, msg, contact, agree_at, price_at)
  values (v_lst, v_uid, v_msg, v_contact, (p->>'agree_at')::timestamptz, v_price)
  returning id into v_id;
  return v_id;
exception
  when unique_violation then
    raise exception '이미 이 매물에 문의하셨습니다';
end $$;
revoke all on function ask_listing(jsonb) from public;
grant execute on function ask_listing(jsonb) to authenticated;

insert into schema_version (n, name) values (84, '0084_listing_photo_five')
  on conflict (n) do nothing;

commit;

-- ── 되돌리기 ──────────────────────────────────────────────────────────
-- ⚠️ 칸(`stored_at`)은 남깁니다. 문 · 보기는 0069 · 0080 의 글을 다시 붙여 넣는 대신
--   아래 한 덩이로 되돌립니다(한도만 열 장으로 · 보기에서 저장 조건만 뺍니다).
-- begin;
--   drop function if exists store_listing_photo(jsonb);
--   update listingphoto set stored_at = coalesce(stored_at, created_at);
--   delete from schema_version where n = 84;
--   (문의의 `price_at` 칸은 남깁니다 — 문의 문은 0069 의 ask_listing 을 다시 붙여 넣으면 돌아갑니다)
-- commit;
-- 그 뒤 0069 의 claim_listing_photo · order_listing_photo 와 0080 의 v_listing_open,
-- 0069 의 v_listing_photo_public 을 그 파일에서 꺼내 붙여 넣으면 열 장 · 저장 조건 없음으로 돌아갑니다.
