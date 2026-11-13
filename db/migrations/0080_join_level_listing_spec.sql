-- ════════════════════════════════════════════════════════════════════
-- 0080 — 조인 「실력」 · 중고 「샤프트 플렉스 · 좌/우타」
--        (확정 시안 ② · ③ · 2026-11-13)
--
-- ⚠️⚠️⚠️ **아직 운영에 올리지 않았습니다.** 연결 대상(어느 Supabase
--   프로젝트인가)이 확정되기 전이라, 이 파일은 **초안 + 검사**까지만
--   돼 있습니다. 적용은 승인 뒤입니다.
--
-- 무엇을 더하나 — **칸 셋뿐**입니다. 지우거나 이름을 바꾸는 줄이
-- 한 줄도 없습니다(전부 `add column if not exists`).
--   · joinroom.level  조인에 맞는 실력  (시안 ② 의 「실력」 거르개)
--   · listing.flex    샤프트 플렉스      (시안 ③ 의 「샤프트 플렉스」)
--   · listing.hand    좌타 · 우타        (시안 ③ 의 「좌/우타」)
--
-- ⚠️⚠️ **셋 다 비울 수 있습니다(null).** 이미 올라온 줄은 전부 null 이
--   되고, 그 줄들은 **그 조건으로 좁히면 빠집니다** — 모르는 값을 아무
--   칸에나 채우면 지어낸 값입니다(절대 규칙 1). 화면이 그 사실을 0건
--   안내에서 말합니다(피팅의 「이용 방식을 안 고르신 업체는 빠집니다」와
--   같은 결).
--
-- ⚠️⚠️⚠️ **칸을 더하면 칸 GRANT 도 같이 줘야 합니다.** `joinroom` 과
--   `listing` 은 **칸 단위**로 select 를 줍니다(연락처 · 동의 시각을
--   빼려고). 칸 단위 GRANT 는 **나중에 생긴 칸을 저절로 안 덮습니다** —
--   2026-11-09 에 `listing.model` 이 그래서 `/my` 의 「내 판매글」 상자를
--   통째로 비웠습니다(안 준 칸을 부르면 0줄이 아니라 **질의가 통째로
--   거절**됩니다).
--
-- ⚠️⚠️ **check 를 답니다**(`cond` 와 같은 결) — 값이 몇 개뿐이고 화면이
--   그 글자로 이름을 찾기 때문입니다. ⚠️ 값을 늘리시려면 **마이그레이션이
--   필요합니다**(`listing.sub` 는 반대로 일부러 안 박았습니다 — 거기는
--   종류가 계속 늡니다).
--
-- 되돌아갔는지 보는 법:
--   select column_name from information_schema.columns
--    where table_name = 'listing' and column_name in ('flex','hand');
--   select has_column_privilege('authenticated','listing','flex','SELECT');
-- ════════════════════════════════════════════════════════════════════

-- ── ① 조인 — 실력 ────────────────────────────────────────────────
alter table joinroom add column if not exists level text;
alter table joinroom drop constraint if exists joinroom_level_ck;
alter table joinroom add  constraint joinroom_level_ck
  check (level is null or level in ('any','beginner','mid','low'));

-- ⚠️ 칸 GRANT — 안 주면 `/my` 의 「내 조인」이 통째로 비워집니다
grant select (level) on joinroom to authenticated;

-- ── ② 중고 — 샤프트 플렉스 · 좌/우타 ─────────────────────────────
alter table listing add column if not exists flex text;
alter table listing add column if not exists hand text;
alter table listing drop constraint if exists listing_flex_ck;
alter table listing add  constraint listing_flex_ck
  check (flex is null or flex in ('r','sr','s','x'));
alter table listing drop constraint if exists listing_hand_ck;
alter table listing add  constraint listing_hand_ck
  check (hand is null or hand in ('right','left'));

grant select (flex, hand) on listing to authenticated;

-- ⚠️ 거르개가 쓰는 칸이라 인덱스를 답니다 — 값이 있는 줄만 담습니다
--   (대부분이 null 이라 전체 인덱스는 자리만 먹습니다).
create index if not exists listing_flex_idx on listing (flex)
  where flex is not null;
create index if not exists listing_hand_idx on listing (hand)
  where hand is not null;
create index if not exists joinroom_level_idx on joinroom (level)
  where level is not null;

-- ── ③ 여는 문 · 고치는 문 (조인) ─────────────────────────────────
-- ⚠️⚠️ `open_joinroom` 은 0046 이 마지막입니다 — 여기서 덮습니다
--   (check-chains 가 그 짝을 셉니다 · 0046→0080).
-- ⚠️ 바뀐 것은 **`level` 한 칸뿐**입니다. 나머지는 0046 그대로입니다.
create or replace function open_joinroom(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_region  text := nullif(btrim(coalesce(p->>'region','')), '');
  v_play    date;
  v_title   text := nullif(btrim(coalesce(p->>'title','')), '');
  v_body    text := nullif(btrim(coalesce(p->>'body','')), '');
  v_course  text := nullif(btrim(coalesce(p->>'course','')), '');
  v_tee     text := nullif(btrim(coalesce(p->>'tee','')), '');
  v_note    text := nullif(btrim(coalesce(p->>'note','')), '');
  v_level   text := nullif(btrim(coalesce(p->>'level','')), '');
  v_contact text := nullif(btrim(coalesce(p->>'contact','')), '');
  v_need    int;
  v_budget  int;
  v_id      uuid;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_region is null then raise exception '지역을 골라 주세요'; end if;
  if v_title is null or char_length(v_title) < 2 then
    raise exception '제목을 두 글자 이상 적어 주세요';
  end if;
  if char_length(v_title) > 60 then
    raise exception '제목이 너무 깁니다 (60자)';
  end if;
  if p->>'play_at' is null or btrim(p->>'play_at') = '' then
    raise exception '언제 치실지 골라 주세요';
  end if;
  begin
    v_play := (p->>'play_at')::date;
  exception when others then
    raise exception '날짜가 올바르지 않습니다';
  end;
  if v_play < kst_today() then
    raise exception '지난 날짜로는 열 수 없습니다';
  end if;
  if v_play > kst_today() + 90 then
    raise exception '90일 뒤까지만 열 수 있습니다';
  end if;
  if p->>'need' is null or btrim(p->>'need') = '' then
    raise exception '몇 분을 찾으시는지 적어 주세요';
  end if;
  begin
    v_need := btrim(p->>'need')::int;
  exception when others then
    raise exception '인원은 숫자로 적어 주세요';
  end;
  if v_need < 1 or v_need > 3 then
    raise exception '찾으시는 인원은 1~3명입니다';
  end if;
  if nullif(btrim(coalesce(p->>'budget','')), '') is not null then
    begin
      v_budget := btrim(p->>'budget')::int;
    exception when others then
      raise exception '예상 비용은 숫자로 적어 주세요';
    end;
    if v_budget < 0 or v_budget > 100000000 then
      raise exception '예상 비용이 올바르지 않습니다';
    end if;
  end if;
  -- ⚠️ 실력은 **안 고르셔도 됩니다** — 고르셨으면 아는 값이어야 합니다
  --   (모르는 글자를 담으면 화면이 「미확인」을 찍습니다).
  if v_level is not null and v_level not in ('any','beginner','mid','low') then
    raise exception '실력 값이 올바르지 않습니다';
  end if;
  if v_contact is null then raise exception '연락처를 적어 주세요'; end if;
  if length(v_contact) > 100 then raise exception '연락처가 너무 깁니다'; end if;
  if p->>'agree_at' is null then
    raise exception '개인정보 수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes'
     or (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의 시각이 올바르지 않습니다';
  end if;
  if (select count(*) from joinroom
       where by_user = v_uid and state = 'open') >= 5 then
    raise exception '열어 두신 자리가 다섯입니다. 먼저 정리해 주세요';
  end if;
  if (select count(*) from joinroom
       where by_user = v_uid and created_at > now() - interval '1 day') >= 10 then
    raise exception '오늘은 더 열 수 없습니다 (하루 열 개)';
  end if;

  insert into joinroom (by_user, region, play_at, title, body, course,
                        tee, need, budget, note, level, contact, agree_at)
  values (v_uid, v_region, v_play, v_title, v_body, v_course,
          v_tee, v_need, v_budget, v_note, v_level,
          v_contact, (p->>'agree_at')::timestamptz)
  returning id into v_id;
  return v_id;
end $$;
revoke all on function open_joinroom(jsonb) from public;
grant execute on function open_joinroom(jsonb) to authenticated;

-- ⚠️⚠️ 고치는 문 — **보낸 칸만** 고칩니다. 날짜 · 지역은 여전히 못
--   고칩니다(신청하신 분이 다른 자리에 묶입니다 · 0046 의 그 까닭).
-- ⚠️ 실력은 **비우는 것도 보내는 것**입니다 — `p ? 'level'` 로 갈립니다
--   (`coalesce` 로 받으면 빈 글자가 「안 보냈다」 와 섞여 못 지웁니다 ·
--   0069 의 `model` 자리).
create or replace function edit_joinroom(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid    uuid := auth.uid();
  v_id     uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_owner  uuid;
  v_state  text;
  v_title  text := nullif(btrim(coalesce(p->>'title','')), '');
  v_body   text := nullif(btrim(coalesce(p->>'body','')), '');
  v_course text := nullif(btrim(coalesce(p->>'course','')), '');
  v_tee    text := nullif(btrim(coalesce(p->>'tee','')), '');
  v_note   text := nullif(btrim(coalesce(p->>'note','')), '');
  v_need   int;
  v_budget int;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 자리인지 알 수 없습니다'; end if;
  select by_user, state into v_owner, v_state
    from joinroom where id = v_id for update;
  if v_state is null then raise exception '그런 자리가 없습니다'; end if;
  if not coalesce(v_owner = v_uid, false) then
    raise exception '여신 분만 고치실 수 있습니다';
  end if;
  if v_state <> 'open' then
    raise exception '열려 있는 자리만 고치실 수 있습니다';
  end if;
  if v_title is null or char_length(v_title) < 2 then
    raise exception '제목을 두 글자 이상 적어 주세요';
  end if;
  if char_length(v_title) > 60 then
    raise exception '제목이 너무 깁니다 (60자)';
  end if;
  if p->>'need' is null or btrim(p->>'need') = '' then
    raise exception '몇 분을 찾으시는지 적어 주세요';
  end if;
  begin
    v_need := btrim(p->>'need')::int;
  exception when others then
    raise exception '인원은 숫자로 적어 주세요';
  end;
  if v_need < 1 or v_need > 3 then
    raise exception '찾으시는 인원은 1~3명입니다';
  end if;
  -- ⚠️ 이미 수락한 분보다 적게 줄이지 못합니다
  if v_need < (select count(*) from joinapply a
                where a.room_id = v_id and a.state = 'accepted') then
    raise exception '이미 수락하신 분보다 적게 줄일 수 없습니다';
  end if;
  if nullif(btrim(coalesce(p->>'budget','')), '') is not null then
    begin
      v_budget := btrim(p->>'budget')::int;
    exception when others then
      raise exception '예상 비용은 숫자로 적어 주세요';
    end;
    if v_budget < 0 or v_budget > 100000000 then
      raise exception '예상 비용이 올바르지 않습니다';
    end if;
  end if;
  if p ? 'level' then
    if nullif(btrim(coalesce(p->>'level','')), '') is not null
       and btrim(p->>'level') not in ('any','beginner','mid','low') then
      raise exception '실력 값이 올바르지 않습니다';
    end if;
  end if;

  update joinroom
     set title = v_title, body = v_body, course = v_course,
         tee = v_tee, note = v_note, need = v_need, budget = v_budget,
         level = case when p ? 'level'
                      then nullif(btrim(coalesce(p->>'level','')), '')
                      else level end,
         updated_at = now()
   where id = v_id;
  return v_id;
end $$;
revoke all on function edit_joinroom(jsonb) from public;
grant execute on function edit_joinroom(jsonb) to authenticated;

-- ── ④ 공개 보기에 칸을 더합니다 ──────────────────────────────────
-- ⚠️⚠️ **`create or replace view` 대신 `drop` + `create` 입니다** —
--   앞 번호를 다시 붙여 넣는 날 「cannot drop columns from view」로
--   멈추는 자리입니다(0044 가 그랬습니다). 지우면 **권한도 같이
--   날아가므로 바로 다시 줍니다.**
-- ⚠️ 기대는 보기가 없는지 확인했습니다 — `v_join_count`(0060)는
--   `joinroom` 표를 **직접** 셉니다.
drop view if exists v_join_open;
create view v_join_open as
  select r.id, r.region, r.play_at, r.title, r.body, r.course, r.booked,
         r.tee, r.need, r.budget, r.note, r.level, r.created_at,
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

drop view if exists v_listing_open;
create view v_listing_open as
  select l.id, l.sub, l.region, l.ship, l.title, l.body, l.price, l.cond,
         l.brand, l.model, l.flex, l.hand, l.state, l.created_at,
         left(coalesce(nullif(btrim(a.name), ''), '회원'), 1) ||
         repeat('*', greatest(
           char_length(coalesce(nullif(btrim(a.name), ''), '회원')) - 1, 0))
           as seller,
         (select count(*) from listingask k
           where k.listing_id = l.id and k.state = 'asked') as ask_n,
         (select count(*) from listingphoto f where f.listing_id = l.id) as photo_n,
         (select f.path from listingphoto f
           where f.listing_id = l.id
           order by f.ord, f.created_at, f.id limit 1) as thumb
    from listing l
    left join account a on a.id = l.by_user
   where l.state in ('open','reserved');
grant select on v_listing_open to anon, authenticated;

-- ── ⑤ 중고 — 여는 문 · 고치는 문에 칸 둘 ─────────────────────────
-- ⚠️ 바뀐 것은 **`flex` · `hand` 두 칸뿐**입니다. 나머지는 0069 그대로.
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
  v_flex    text := nullif(btrim(coalesce(p->>'flex','')), '');
  v_hand    text := nullif(btrim(coalesce(p->>'hand','')), '');
  v_ship    boolean := coalesce((p->>'ship')::boolean, false);
  v_price   int;
  v_id      uuid;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_sub is null then raise exception '물건 종류를 골라 주세요'; end if;
  if v_region is null then raise exception '지역을 골라 주세요'; end if;
  if v_brand is null then
    raise exception '브랜드를 골라 주세요 (모르시면 기타)';
  end if;
  if char_length(v_brand) > 30 then
    raise exception '브랜드가 너무 깁니다 (30자)';
  end if;
  if v_model is not null and char_length(v_model) > 40 then
    raise exception '모델명이 너무 깁니다 (40자)';
  end if;
  -- ⚠️ 플렉스 · 좌우타는 **안 고르셔도 됩니다**(클럽이 아닌 물건도
  --   있습니다). 고르셨으면 아는 값이어야 합니다.
  if v_flex is not null and v_flex not in ('r','sr','s','x') then
    raise exception '샤프트 플렉스 값이 올바르지 않습니다';
  end if;
  if v_hand is not null and v_hand not in ('right','left') then
    raise exception '좌타 · 우타 값이 올바르지 않습니다';
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
  if v_cond is null then raise exception '물건 상태를 골라 주세요'; end if;
  if v_cond not in ('new','like','good','fair') then
    raise exception '물건 상태가 올바르지 않습니다';
  end if;
  if v_contact is null then raise exception '연락처를 적어 주세요'; end if;
  if length(v_contact) > 100 then raise exception '연락처가 너무 깁니다'; end if;
  if p->>'agree_at' is null then
    raise exception '개인정보 수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes'
     or (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의 시각이 올바르지 않습니다';
  end if;
  if (select count(*) from listing
       where by_user = v_uid and state in ('open','reserved')) >= 10 then
    raise exception '팔고 계신 매물이 열입니다. 먼저 정리해 주세요';
  end if;
  if (select count(*) from listing
       where by_user = v_uid and created_at > now() - interval '1 day') >= 20 then
    raise exception '오늘은 더 올릴 수 없습니다 (하루 스무 개)';
  end if;

  insert into listing (by_user, sub, region, ship, title, body, price,
                       cond, contact, agree_at, brand, model, flex, hand)
  values (v_uid, v_sub, v_region, v_ship, v_title, v_body, v_price,
          v_cond, v_contact, (p->>'agree_at')::timestamptz,
          v_brand, v_model, v_flex, v_hand)
  returning id into v_id;
  return v_id;
end $$;
revoke all on function open_listing(jsonb) from public;
grant execute on function open_listing(jsonb) to authenticated;

-- ⚠️⚠️ 고치는 문 — **보낸 칸만** 고칩니다. 플렉스 · 좌우타도 모델명과
--   같이 **비우는 것이 보내는 것**입니다(`p ? '...'`).
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
  if p ? 'flex' then
    if nullif(btrim(coalesce(p->>'flex','')), '') is not null
       and btrim(p->>'flex') not in ('r','sr','s','x') then
      raise exception '샤프트 플렉스 값이 올바르지 않습니다';
    end if;
  end if;
  if p ? 'hand' then
    if nullif(btrim(coalesce(p->>'hand','')), '') is not null
       and btrim(p->>'hand') not in ('right','left') then
      raise exception '좌타 · 우타 값이 올바르지 않습니다';
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
    model   = case when p ? 'model'
                   then nullif(btrim(coalesce(p->>'model','')), '')
                   else model end,
    flex    = case when p ? 'flex'
                   then nullif(btrim(coalesce(p->>'flex','')), '')
                   else flex end,
    hand    = case when p ? 'hand'
                   then nullif(btrim(coalesce(p->>'hand','')), '')
                   else hand end,
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

insert into schema_version (n, name) values (80, '0080_join_level_listing_spec')
on conflict (n) do nothing;
