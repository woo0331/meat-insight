-- 0085 — 업체가 직접 올리는 티타임 · 예약 관리 (2026-11-17)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️ **운영에 아직 안 올렸습니다.** 사장님 승인 뒤에 0082 → 0083 → 0084 → 0085 차례로 올립니다
--   (번호 하나로 진행 위치를 세므로 건너뛰지 않습니다 · docs/photo-launch.md).
--
-- 무엇을 —
--   ① 자리 칸: 코스(골프장 안) · 최소 인원 · 가격 단위(1인 · 팀) · 카트비 · 캐디피(포함 · 별도 · **모름**) ·
--      신청 마감 시각 · 취소 · 변경 조건. ⚠️ 모르는 비용을 0 으로 담지 않습니다(null = 모름 · 0 = 무료).
--   ② 상태: 받는 중(open) · **접수 중지(paused)** · 마감(closed) · 운영자 가림(hidden). 마감한 자리를 다시 열 수 있습니다.
--   ③ 올리는 문: **부킹 분야(bk-)를 하는 승인 업체만** · 정확한 티오프 시각 필수 · 골프장은 공개 골프장 id 로
--      (이름은 그 자료에서 가져옵니다) · 같은 업체의 같은 골프장 · 코스 · 날짜 · 시각은 한 줄만.
--   ④ 신청: 접수 중지 · 마감 · 신청 마감 시각 · 오늘 이미 지난 티오프를 서버가 막습니다. 신청 순간의 가격 · 비용 ·
--      조건을 **신청 줄에 그대로 담습니다**(snap) — 업체가 나중에 값을 바꿔도 기존 신청은 안 바뀝니다.
--   ⑤ 처리: 업체 취소(pcanceled · 까닭 필수)를 손님 취소(canceled)와 가릅니다. 잠금 차례를 신청 문과 같게
--      맞춥니다(자리 → 신청 · 서로 반대 차례면 맞물려 멈출 수 있습니다).
--   ⑥ 이용 결과: 업체 표시(pv_result: used · noshow)와 손님 표시(cus_result: used · notused)를 **따로** 담고,
--      둘이 다르면 「분쟁 · 미확인」입니다. 업체가 「이용」을 눌렀다고 실제 이용 · 결제가 확인된 것이 아닙니다.
--      노쇼 표시만으로 아무도 제재하지 않습니다.
--   ⑦ 운영자 집계 보기(v_teetime_pv_stats) — 업체별 자리 · 신청 · 확정 · 취소 · 결과 건수. **돈은 안 셉니다.**
--
-- 기존 자료 — 지금 운영에 티타임 0줄입니다. 옛 줄은 가격 단위가 「1인」(기존 화면의 뜻), 비용 · 마감 · 조건은 모름으로 둡니다.
-- 되돌리기 — 맨 아래 주석.
-- ════════════════════════════════════════════════════════════════════
begin;

-- ① 칸 ───────────────────────────────────────────────────────────────
alter table teetime add column if not exists course_sub  text check (course_sub is null or char_length(btrim(course_sub)) between 1 and 30);
alter table teetime add column if not exists min_players int  check (min_players is null or min_players between 1 and 4);
alter table teetime add column if not exists price_unit  text not null default 'person' check (price_unit in ('person','team'));
alter table teetime add column if not exists cart_rule   text check (cart_rule is null or cart_rule in ('incl','extra'));
alter table teetime add column if not exists cart_fee    int  check (cart_fee is null or cart_fee between 0 and 10000000);
alter table teetime add column if not exists caddie_rule text check (caddie_rule is null or caddie_rule in ('incl','extra'));
alter table teetime add column if not exists caddie_fee  int  check (caddie_fee is null or caddie_fee between 0 and 10000000);
alter table teetime add column if not exists apply_until timestamptz;
alter table teetime add column if not exists cancel_terms text check (cancel_terms is null or length(cancel_terms) <= 500);
-- ⚠️ 포함이면 금액이 없어야 합니다(포함인데 금액이 있으면 손님이 두 번 내는 줄 압니다)
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'teetime_cost_ck') then
    alter table teetime add constraint teetime_cost_ck check (
      (cart_rule   is distinct from 'incl' or cart_fee   is null) and
      (caddie_rule is distinct from 'incl' or caddie_fee is null));
  end if;
end $$;

-- 상태에 접수 중지 — ⚠️ 제약 이름을 박지 않고 찾아서 뗍니다(0053 · 0069 의 그 자리)
do $$ declare c text; begin
  for c in select conname from pg_constraint
            where conrelid = 'teetime'::regclass and contype = 'c'
              and pg_get_constraintdef(oid) like '%state%' and pg_get_constraintdef(oid) like '%hidden%'
              and conname <> 'teetime_state_ck' loop
    execute format('alter table teetime drop constraint %I', c);
  end loop;
  if not exists (select 1 from pg_constraint where conname = 'teetime_state_ck') then
    alter table teetime add constraint teetime_state_ck check (state in ('open','paused','closed','hidden'));
  end if;
end $$;

-- 신청 줄: 신청 순간의 조건 · 업체 취소 · 결과
alter table teebook add column if not exists snap jsonb not null default '{}'::jsonb;
alter table teebook add column if not exists pv_result  text check (pv_result  is null or pv_result  in ('used','noshow'));
alter table teebook add column if not exists cus_result text check (cus_result is null or cus_result in ('used','notused'));
alter table teebook add column if not exists result_at  timestamptz;
do $$ declare c text; begin
  for c in select conname from pg_constraint
            where conrelid = 'teebook'::regclass and contype = 'c'
              and pg_get_constraintdef(oid) like '%applied%' and pg_get_constraintdef(oid) like '%canceled%'
              and conname <> 'teebook_state_ck' loop
    execute format('alter table teebook drop constraint %I', c);
  end loop;
  if not exists (select 1 from pg_constraint where conname = 'teebook_state_ck') then
    alter table teebook add constraint teebook_state_ck
      check (state in ('applied','confirmed','rejected','canceled','pcanceled'));
  end if;
end $$;
-- ⚠️ 손님 · 업체에게 새 칸 읽기를 줍니다(칸 단위 GRANT 는 새 칸을 저절로 덮지 않습니다 · 0069 의 그 자리)
grant select (snap, pv_result, cus_result, result_at) on teebook to authenticated;

-- 같은 업체 · 같은 골프장 · 코스 · 날짜 · 시각은 한 줄만(받는 중 · 접수 중지일 때)
-- ⚠️⚠️ 골프장은 **적힌 이름**으로 가릅니다(course_id 가 아닙니다) — 운영자가 비슷한 이름을 같은 골프장으로
--   잇는 순간(link_course_alias · 0066) 서로 다른 이름의 두 줄이 같은 id 가 되어 그 잇기가 통째로 거절됐습니다
--   (검사가 잡았습니다). 목록에서 고른 골프장은 이름을 골프장 자료에서 가져오므로 같은 골프장은 같은 이름입니다.
create unique index if not exists teetime_dup_uq on teetime
  (provider_id, lower(btrim(course)), coalesce(lower(btrim(course_sub)), ''), play_at, tee_at)
  where state in ('open','paused');

-- 지금 한국 시각 (서버 기준 · 화면 시계를 안 믿습니다)
create or replace function kst_now_time() returns time
  language sql stable as $$ select (now() at time zone 'Asia/Seoul')::time $$;
revoke all on function kst_now_time() from public;
grant execute on function kst_now_time() to anon, authenticated;

-- 값 읽기 도우미 — 빈 글자는 null · 숫자가 아니면 거절
create or replace function tee_int(v text, what text) returns int
  language plpgsql immutable as $$
begin
  v := nullif(btrim(coalesce(v, '')), '');
  if v is null then return null; end if;
  if v !~ '^[0-9]+$' then raise exception '%은(는) 숫자만 적어 주세요', what; end if;
  return v::int;
end $$;
revoke all on function tee_int(text, text) from public;

-- 비용 규칙 읽기 — 'incl' · 'extra' · 빈 글자(모름)
create or replace function tee_rule(v text) returns text
  language plpgsql immutable as $$
begin
  v := nullif(btrim(coalesce(v, '')), '');
  if v is null then return null; end if;
  if v not in ('incl','extra') then raise exception '비용은 포함 · 별도 · 모름 가운데 골라 주세요'; end if;
  return v;
end $$;
revoke all on function tee_rule(text) from public;

-- ② 올리기 ───────────────────────────────────────────────────────────
create or replace function open_teetime(p jsonb default '{}'::jsonb)
  returns uuid
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_pv   text := my_provider();
  v_st   text;
  v_subs text[];
  v_id   uuid;
  v_day  date := nullif(btrim(coalesce(p->>'playAt','')), '')::date;
  v_at   time := nullif(btrim(coalesce(p->>'teeAt','')), '')::time;
  v_cid  uuid := nullif(btrim(coalesce(p->>'courseId','')), '')::uuid;
  v_course text := nullif(btrim(coalesce(p->>'course','')), '');
  v_region text := nullif(btrim(coalesce(p->>'region','')), '');
  v_slots int := coalesce(tee_int(p->>'slots', '자리 수'), 1);
  v_min  int := tee_int(p->>'minPlayers', '최소 인원');
  v_unit text := coalesce(nullif(btrim(coalesce(p->>'priceUnit','')), ''), '');
  v_cr   text := tee_rule(p->>'cartRule');
  v_dr   text := tee_rule(p->>'caddieRule');
  v_cf   int  := tee_int(p->>'cartFee', '카트비');
  v_df   int  := tee_int(p->>'caddieFee', '캐디피');
  v_until timestamptz := nullif(btrim(coalesce(p->>'applyUntil','')), '')::timestamptz;
  v_terms text := nullif(btrim(coalesce(p->>'cancelTerms','')), '');
  v_c    record;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_pv is null then raise exception '업체 담당자만 자리를 올릴 수 있습니다'; end if;
  select state, subs into v_st, v_subs from provider where id = v_pv and is_test = false;
  if v_st is null then raise exception '업체를 찾을 수 없습니다'; end if;
  if v_st <> 'approved' then raise exception '승인된 업체만 자리를 올릴 수 있습니다'; end if;
  -- ⚠️⚠️ **골프장 자료가 있다고 판매 권한이 있는 것이 아닙니다** — 부킹 분야를 하는 업체만
  if not exists (select 1 from unnest(coalesce(v_subs, '{}'::text[])) s where s like 'bk-%') then
    raise exception '부킹 분야 업체만 티타임을 올릴 수 있습니다 — 하시는 일은 운영자가 정합니다';
  end if;

  if coalesce(p->>'kind','') not in ('booking','join') then
    raise exception '부킹인지 조인인지 골라 주세요';
  end if;
  -- 골프장 — 공개 골프장 id(또는 주소 이름 slug — 화면의 골프장 자료에는 slug 만 있습니다)를 받으면
  --   이름 · 지역을 **그 자료에서** 가져옵니다(화면이 보낸 이름을 안 믿습니다)
  if v_cid is null and nullif(btrim(coalesce(p->>'courseSlug','')), '') is not null then
    select id into v_cid from course where lower(slug) = lower(btrim(p->>'courseSlug'));
    if v_cid is null then raise exception '그 골프장을 찾을 수 없습니다'; end if;
  end if;
  if v_cid is not null then
    select name, region, state into v_c from course where id = v_cid;
    if v_c.name is null or v_c.state = 'hidden' then raise exception '그 골프장을 찾을 수 없습니다'; end if;
    if v_c.state = 'closed' then raise exception '폐업으로 표시된 골프장입니다'; end if;
    v_course := v_c.name;
    v_region := coalesce(v_region, v_c.region);
  end if;
  if v_region is null then raise exception '지역을 골라 주세요'; end if;
  if v_course is null then raise exception '골프장을 골라 주세요'; end if;
  if v_day is null then raise exception '라운드 날짜를 골라 주세요'; end if;
  if v_at is null then raise exception '티오프 시각을 적어 주세요'; end if;
  if v_day < kst_today() then raise exception '지난 날짜에는 자리를 올릴 수 없습니다'; end if;
  if v_day = kst_today() and v_at <= kst_now_time() then
    raise exception '이미 지난 시각입니다';
  end if;
  if v_day > kst_today() + 90 then raise exception '90일 뒤까지만 올리실 수 있습니다'; end if;
  if v_slots < 1 or v_slots > 4 then raise exception '자리 수는 1~4 입니다'; end if;
  if v_min is not null and (v_min < 1 or v_min > v_slots) then
    raise exception '최소 인원은 1명부터 자리 수까지입니다';
  end if;
  if v_unit not in ('person','team') then raise exception '가격이 1인 기준인지 팀 기준인지 골라 주세요'; end if;
  if v_cr = 'incl' and v_cf is not null then raise exception '카트비가 포함이면 금액을 비워 주세요'; end if;
  if v_dr = 'incl' and v_df is not null then raise exception '캐디피가 포함이면 금액을 비워 주세요'; end if;
  if v_terms is null then raise exception '취소 · 변경 조건을 적어 주세요'; end if;
  if v_until is not null and v_until > ((v_day + v_at) at time zone 'Asia/Seoul') then
    raise exception '신청 마감은 티오프 전이어야 합니다';
  end if;
  if v_until is not null and v_until <= now() then raise exception '신청 마감 시각이 이미 지났습니다'; end if;
  if tee_int(p->>'greenFee', '그린피') is not null and tee_int(p->>'greenFee', '그린피') > 10000000 then
    raise exception '그린피가 너무 큽니다';
  end if;

  begin
    insert into teetime (provider_id, by_user, kind, region, course, course_id, course_sub, play_at,
                         tee_at, holes, slots, min_players, green_fee, price_unit,
                         cart_rule, cart_fee, caddie_rule, caddie_fee, apply_until, cancel_terms, tel, note)
    values (v_pv, v_me, p->>'kind', v_region, v_course, v_cid,
            nullif(btrim(coalesce(p->>'courseSub','')), ''), v_day, v_at,
            tee_int(p->>'holes', '홀 수'), v_slots, v_min,
            tee_int(p->>'greenFee', '그린피'), v_unit,
            v_cr, v_cf, v_dr, v_df, v_until, v_terms,
            nullif(btrim(coalesce(p->>'tel','')), ''),
            nullif(btrim(coalesce(p->>'note','')), ''))
    returning id into v_id;
  exception when unique_violation then
    raise exception '같은 골프장 · 코스 · 날짜 · 시각의 자리를 이미 올리셨습니다';
  end;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'teetime', v_id::text, 'open',
          jsonb_build_object('kind', p->>'kind', 'region', v_region, 'course_id', v_cid));
  return v_id;
end $$;
revoke all on function open_teetime(jsonb) from public;
grant execute on function open_teetime(jsonb) to authenticated;

-- ③ 고치기 — 받는 중 · 접수 중지일 때. ⚠️ 이미 들어온 신청의 조건은 **안 바뀝니다**(snap)
create or replace function edit_teetime(p jsonb default '{}'::jsonb)
  returns uuid
  language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_pv text := my_provider();
  v_id uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_row teetime%rowtype;
  v_taken int;
  v_slots int; v_min int; v_cr text; v_dr text; v_cf int; v_df int; v_at time; v_until timestamptz;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 자리인지 알 수 없습니다'; end if;
  select * into v_row from teetime where id = v_id for update;
  if v_row.id is null then raise exception '그런 자리가 없습니다'; end if;
  if not coalesce(v_row.provider_id = v_pv, false) then raise exception '올리신 업체만 고치실 수 있습니다'; end if;
  if v_row.state not in ('open','paused') then raise exception '마감한 자리는 다시 연 뒤에 고치실 수 있습니다'; end if;

  v_slots := case when p ? 'slots' then tee_int(p->>'slots', '자리 수') else v_row.slots end;
  v_min   := case when p ? 'minPlayers' then tee_int(p->>'minPlayers', '최소 인원') else v_row.min_players end;
  v_cr    := case when p ? 'cartRule' then tee_rule(p->>'cartRule') else v_row.cart_rule end;
  v_dr    := case when p ? 'caddieRule' then tee_rule(p->>'caddieRule') else v_row.caddie_rule end;
  v_cf    := case when p ? 'cartFee' then tee_int(p->>'cartFee', '카트비') else v_row.cart_fee end;
  v_df    := case when p ? 'caddieFee' then tee_int(p->>'caddieFee', '캐디피') else v_row.caddie_fee end;
  v_at    := case when p ? 'teeAt' then nullif(btrim(coalesce(p->>'teeAt','')), '')::time else v_row.tee_at end;
  v_until := case when p ? 'applyUntil' then nullif(btrim(coalesce(p->>'applyUntil','')), '')::timestamptz else v_row.apply_until end;

  if v_slots is null or v_slots < 1 or v_slots > 4 then raise exception '자리 수는 1~4 입니다'; end if;
  select coalesce(sum(people), 0) into v_taken from teebook where tee_id = v_id and state = 'confirmed';
  if v_slots < v_taken then raise exception '이미 확정하신 분이 있어 그보다 적게 줄일 수 없습니다'; end if;
  if v_min is not null and (v_min < 1 or v_min > v_slots) then raise exception '최소 인원은 1명부터 자리 수까지입니다'; end if;
  if v_at is null then raise exception '티오프 시각을 적어 주세요'; end if;
  if v_cr = 'incl' and v_cf is not null then raise exception '카트비가 포함이면 금액을 비워 주세요'; end if;
  if v_dr = 'incl' and v_df is not null then raise exception '캐디피가 포함이면 금액을 비워 주세요'; end if;
  if v_until is not null and v_until > ((v_row.play_at + v_at) at time zone 'Asia/Seoul') then
    raise exception '신청 마감은 티오프 전이어야 합니다';
  end if;
  if p ? 'priceUnit' and coalesce(p->>'priceUnit','') not in ('person','team') then
    raise exception '가격이 1인 기준인지 팀 기준인지 골라 주세요';
  end if;
  if p ? 'cancelTerms' and nullif(btrim(coalesce(p->>'cancelTerms','')), '') is null then
    raise exception '취소 · 변경 조건을 비울 수 없습니다';
  end if;

  begin
    update teetime set
      tee_at = v_at, slots = v_slots, min_players = v_min,
      holes  = case when p ? 'holes' then tee_int(p->>'holes', '홀 수') else holes end,
      course_sub = case when p ? 'courseSub' then nullif(btrim(coalesce(p->>'courseSub','')), '') else course_sub end,
      green_fee = case when p ? 'greenFee' then tee_int(p->>'greenFee', '그린피') else green_fee end,
      price_unit = case when p ? 'priceUnit' then p->>'priceUnit' else price_unit end,
      cart_rule = v_cr, cart_fee = v_cf, caddie_rule = v_dr, caddie_fee = v_df,
      apply_until = v_until,
      cancel_terms = case when p ? 'cancelTerms' then btrim(p->>'cancelTerms') else cancel_terms end,
      tel  = case when p ? 'tel'  then nullif(btrim(coalesce(p->>'tel','')), '')  else tel end,
      note = case when p ? 'note' then nullif(btrim(coalesce(p->>'note','')), '') else note end,
      updated_at = now()
    where id = v_id;
  exception when unique_violation then
    raise exception '같은 골프장 · 코스 · 날짜 · 시각의 자리를 이미 올리셨습니다';
  end;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state)
  values (v_me, my_role(), 'teetime', v_id::text, 'edited');
  return v_id;
end $$;
revoke all on function edit_teetime(jsonb) from public;
grant execute on function edit_teetime(jsonb) to authenticated;

-- ④ 상태 — 받는 중 ↔ 접수 중지 → 마감 · 마감 → 다시 열기.
--   ⚠️⚠️ **확정된 예약을 말없이 취소하지 않습니다** — 상태만 바꿉니다. 남은 신청 수를 돌려주어 화면이 말합니다.
create or replace function set_teetime_state(p jsonb default '{}'::jsonb)
  returns jsonb
  language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_pv text := my_provider();
  v_id uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_to text := nullif(btrim(coalesce(p->>'to','')), '');
  v_row teetime%rowtype;
  v_ap int; v_cf int;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 자리인지 알 수 없습니다'; end if;
  if v_to not in ('open','paused','closed') then raise exception '옮길 수 없는 상태입니다'; end if;
  select * into v_row from teetime where id = v_id for update;
  if v_row.id is null then raise exception '그런 자리가 없습니다'; end if;
  if not coalesce(v_row.provider_id = v_pv, false) then raise exception '올리신 업체만 바꾸실 수 있습니다'; end if;
  if v_row.state = 'hidden' then raise exception '운영자가 가린 자리입니다 — 고객센터로 알려 주세요'; end if;
  if v_row.state = v_to then raise exception '이미 그 상태입니다'; end if;
  if v_to = 'open' and (v_row.play_at < kst_today()
      or (v_row.play_at = kst_today() and v_row.tee_at is not null and v_row.tee_at <= kst_now_time())) then
    raise exception '지난 자리는 다시 열 수 없습니다';
  end if;
  begin
    update teetime set state = v_to, updated_at = now() where id = v_id;
  exception when unique_violation then
    raise exception '같은 골프장 · 코스 · 날짜 · 시각의 자리가 이미 열려 있습니다';
  end;
  select count(*) filter (where state = 'applied'), count(*) filter (where state = 'confirmed')
    into v_ap, v_cf from teebook where tee_id = v_id;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state)
  values (v_me, my_role(), 'teetime', v_id::text, v_to);
  return jsonb_build_object('state', v_to, 'applied', v_ap, 'confirmed', v_cf);
end $$;
revoke all on function set_teetime_state(jsonb) from public;
grant execute on function set_teetime_state(jsonb) to authenticated;

-- 옛 닫기 문도 같은 규칙으로(받는 중 · 접수 중지 → 마감)
create or replace function close_teetime(p jsonb default '{}'::jsonb)
  returns text
  language plpgsql security definer set search_path = public as $$
declare v_r jsonb; v_st text;
begin
  select state into v_st from teetime where id = nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  if v_st = 'closed' then raise exception '이미 닫힌 자리입니다'; end if;
  v_r := set_teetime_state(jsonb_build_object('id', p->>'id', 'to', 'closed'));
  return 'closed';
end $$;
revoke all on function close_teetime(jsonb) from public;
grant execute on function close_teetime(jsonb) to authenticated;

-- ⑤ 신청 — 신청 순간의 조건을 담습니다
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
  select * into v_row from teetime where id = v_id for update;
  if v_row.id is null then raise exception '그런 자리가 없습니다'; end if;
  if v_row.state = 'paused' then raise exception '업체가 지금 신청을 받지 않는 자리입니다'; end if;
  if v_row.state <> 'open' then raise exception '지금은 받지 않는 자리입니다'; end if;
  if v_row.play_at < kst_today() then raise exception '지난 날짜입니다'; end if;
  if v_row.play_at = kst_today() and v_row.tee_at is not null and v_row.tee_at <= kst_now_time() then
    raise exception '이미 지난 시각입니다';
  end if;
  if v_row.apply_until is not null and v_row.apply_until <= now() then
    raise exception '신청 마감 시각이 지났습니다';
  end if;
  select state into v_pvst from provider
   where id = v_row.provider_id and is_test = false and listed = true;
  if v_pvst is null or v_pvst <> 'approved' then raise exception '지금은 그 업체의 자리를 받지 않습니다'; end if;

  if v_name is null then raise exception '성함을 적어 주세요'; end if;
  if v_tel  is null then raise exception '연락처를 적어 주세요'; end if;
  if v_ppl < 1 or v_ppl > 4 then raise exception '인원을 1~4명으로 적어 주세요'; end if;
  if v_row.min_players is not null and v_ppl < v_row.min_players then
    raise exception '이 자리는 %명부터 신청하실 수 있습니다', v_row.min_players;
  end if;
  if not v_ok then
    raise exception '업체에 성함과 연락처를 넘기는 데 동의하셔야 신청하실 수 있습니다';
  end if;
  if coalesce(v_row.provider_id = my_provider(), false) then
    raise exception '제 업체의 자리에는 신청하실 수 없습니다';
  end if;

  select coalesce(sum(people), 0) into v_used
    from teebook where tee_id = v_id and state in ('applied','confirmed');
  if v_used + v_ppl > v_row.slots then raise exception '남은 자리보다 많습니다'; end if;

  insert into teebook (tee_id, by_user, name, tel, people, memo, agree3rd_at, snap)
  values (v_id, v_me, v_name, v_tel, v_ppl,
          nullif(btrim(coalesce(p->>'memo','')), ''), now(),
          jsonb_build_object(
            'course', v_row.course, 'course_sub', v_row.course_sub, 'play_at', v_row.play_at,
            'tee_at', v_row.tee_at, 'holes', v_row.holes, 'green_fee', v_row.green_fee,
            'price_unit', v_row.price_unit, 'cart_rule', v_row.cart_rule, 'cart_fee', v_row.cart_fee,
            'caddie_rule', v_row.caddie_rule, 'caddie_fee', v_row.caddie_fee,
            'cancel_terms', v_row.cancel_terms, 'note', v_row.note, 'at', now()))
  returning id into v_new;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'teebook', v_new::text, 'applied', jsonb_build_object('people', v_ppl));
  return v_new;
exception
  when unique_violation then raise exception '이미 신청하신 자리입니다';
end $$;
revoke all on function book_teetime(jsonb) from public;
grant execute on function book_teetime(jsonb) to authenticated;

-- ⑥ 처리 — ⚠️ 잠금 차례: **자리 → 신청**(신청 문과 같은 차례)
create or replace function move_teebook(p jsonb default '{}'::jsonb)
  returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_me  uuid := auth.uid();
  v_pv  text := my_provider();
  v_id  uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_to  text := nullif(btrim(coalesce(p->>'state','')), '');
  v_why text := nullif(btrim(coalesce(p->>'why','')), '');
  v_tee uuid;
  v_bk  teebook%rowtype;
  v_tt  teetime%rowtype;
  v_used int;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 신청인지 알 수 없습니다'; end if;
  select tee_id into v_tee from teebook where id = v_id;
  if v_tee is null then raise exception '그런 신청이 없습니다'; end if;
  select * into v_tt from teetime where id = v_tee for update;
  select * into v_bk from teebook where id = v_id for update;

  if v_to = 'canceled' then
    if not coalesce(v_bk.by_user = v_me, false) then raise exception '신청하신 분만 취소하실 수 있습니다'; end if;
    if v_bk.state not in ('applied','confirmed') then raise exception '이미 끝난 신청입니다'; end if;
    if v_tt.play_at < kst_today() then raise exception '라운드 날짜가 지나 취소할 수 없습니다 — 업체에 직접 알려 주세요'; end if;
    update teebook set state = 'canceled', updated_at = now() where id = v_id;
    insert into audit_log (by_user, by_role, obj, obj_id, to_state)
    values (v_me, my_role(), 'teebook', v_id::text, 'canceled');
    return 'canceled';
  end if;

  if v_to not in ('confirmed','rejected','pcanceled') then raise exception '옮길 수 없는 상태입니다'; end if;
  if not coalesce(v_tt.provider_id = v_pv, false) then
    raise exception '그 자리를 올린 업체만 처리하실 수 있습니다';
  end if;

  if v_to = 'pcanceled' then
    -- ⚠️ 업체 취소 — **확정한 예약만** · 까닭 필수(신청 단계는 거절입니다)
    if v_bk.state <> 'confirmed' then raise exception '확정한 예약만 업체가 취소할 수 있습니다 — 신청은 거절해 주세요'; end if;
    if v_why is null or char_length(v_why) < 2 then raise exception '취소하시는 까닭을 적어 주세요'; end if;
    update teebook set state = 'pcanceled', why = v_why, updated_at = now() where id = v_id;
    insert into audit_log (by_user, by_role, obj, obj_id, to_state)
    values (v_me, my_role(), 'teebook', v_id::text, 'pcanceled');
    return 'pcanceled';
  end if;

  if v_bk.state <> 'applied' then raise exception '이미 처리된 신청입니다'; end if;
  if v_to = 'rejected' then
    if v_why is null or char_length(v_why) < 2 then raise exception '거절하시는 까닭을 적어 주세요'; end if;
    update teebook set state = 'rejected', why = v_why, updated_at = now() where id = v_id;
    insert into audit_log (by_user, by_role, obj, obj_id, to_state)
    values (v_me, my_role(), 'teebook', v_id::text, 'rejected');
    return 'rejected';
  end if;

  if v_tt.state = 'hidden' then raise exception '운영자가 가린 자리라 확정할 수 없습니다'; end if;
  if v_tt.play_at < kst_today() then raise exception '지난 자리라 확정할 수 없습니다'; end if;
  select coalesce(sum(people), 0) into v_used
    from teebook where tee_id = v_tee and state = 'confirmed';
  if v_used + v_bk.people > v_tt.slots then raise exception '남은 자리보다 많아 확정하실 수 없습니다'; end if;
  update teebook set state = 'confirmed', updated_at = now() where id = v_id;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state)
  values (v_me, my_role(), 'teebook', v_id::text, 'confirmed');
  return 'confirmed';
end $$;
revoke all on function move_teebook(jsonb) from public;
grant execute on function move_teebook(jsonb) to authenticated;

-- ⑦ 이용 결과 — 확정된 예약 · 라운드 날짜부터. 업체 · 손님이 **각자 제 칸만** 적습니다.
create or replace function mark_teebook(p jsonb default '{}'::jsonb)
  returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_pv text := my_provider();
  v_id uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_r  text := nullif(btrim(coalesce(p->>'result','')), '');
  v_bk teebook%rowtype;
  v_tt teetime%rowtype;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  select * into v_bk from teebook where id = v_id for update;
  if v_bk.id is null then raise exception '그런 예약이 없습니다'; end if;
  select * into v_tt from teetime where id = v_bk.tee_id;
  if v_bk.state <> 'confirmed' then raise exception '확정된 예약만 결과를 적을 수 있습니다'; end if;
  if v_tt.play_at > kst_today() then raise exception '라운드 날짜부터 적을 수 있습니다'; end if;
  if coalesce(v_tt.provider_id = v_pv, false) then
    if v_r not in ('used','noshow') then raise exception '이용함 · 오지 않음 가운데 골라 주세요'; end if;
    update teebook set pv_result = v_r, result_at = now(), updated_at = now() where id = v_id;
  elsif coalesce(v_bk.by_user = v_me, false) then
    if v_r not in ('used','notused') then raise exception '이용함 · 이용 안 함 가운데 골라 주세요'; end if;
    update teebook set cus_result = v_r, result_at = now(), updated_at = now() where id = v_id;
  else
    raise exception '그 예약의 업체나 신청하신 분만 적을 수 있습니다';
  end if;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'teebook', v_id::text, 'marked', jsonb_build_object('result', v_r));
  return v_r;
end $$;
revoke all on function mark_teebook(jsonb) from public;
grant execute on function mark_teebook(jsonb) to authenticated;

-- 결과 읽기 — 한 곳에서 셉니다(보기 셋이 같이 씁니다)
create or replace function tee_outcome(st text, pv text, cus text) returns text
  language sql immutable as $$
  select case
    when st <> 'confirmed' then null
    when pv = 'used' and cus = 'used' then 'used'          -- 양쪽이 이용이라고 함
    when pv is null and cus is null then 'unknown'          -- 아무도 안 적음
    when pv = 'noshow' and cus = 'notused' then 'noshow'    -- 양쪽이 안 왔다고 함
    when pv is not null and cus is not null then 'disputed' -- 서로 다름
    else 'unknown' end                                      -- 한쪽만 적음 = 미확인
$$;

-- ⑧ 보기 — 칸을 **맨 뒤에** 더합니다(create or replace · v_teetime_count 가 위에 서 있습니다)
create or replace view v_teetime_open as
  select t.id, t.provider_id, p.name as provider_name,
         t.kind, t.region, t.course, t.play_at, t.tee_at, t.holes,
         t.slots, t.green_fee,
         coalesce(nullif(btrim(coalesce(t.tel, '')), ''), p.tel) as tel,
         t.note, t.created_at,
         t.slots - (select coalesce(sum(b.people), 0) from teebook b
                     where b.tee_id = t.id
                       and b.state in ('applied','confirmed')) as left_n,
         (select count(*) from teebook b
           where b.tee_id = t.id and b.state = 'confirmed') as confirmed_n,
         t.course_id,
         (select c.slug from course c
           where c.id = t.course_id and c.state <> 'hidden') as course_slug,
         (select c.photo from course c
           where c.id = t.course_id and c.state <> 'hidden') as photo,
         -- ── 0085 ──
         t.course_sub, t.min_players, t.price_unit, t.cart_rule, t.cart_fee,
         t.caddie_rule, t.caddie_fee, t.apply_until, t.cancel_terms
    from teetime t
    join provider p on p.id = t.provider_id
   where t.state = 'open'
     and t.play_at >= kst_today()
     and (t.apply_until is null or t.apply_until > now())
     and not (t.play_at = kst_today() and t.tee_at is not null and t.tee_at <= kst_now_time())
     and p.listed = true
     and p.is_test = false
     and p.state = 'approved';
grant select on v_teetime_open to anon, authenticated;

create or replace view v_teebook_pv as
  select b.id, b.tee_id, b.name, b.tel, b.people, b.memo, b.state, b.why,
         b.agree3rd_at, b.created_at, b.updated_at,
         t.provider_id, t.kind, t.region, t.course, t.play_at, t.tee_at, t.slots,
         -- ── 0085 ──
         b.snap, b.pv_result, b.cus_result, tee_outcome(b.state, b.pv_result, b.cus_result) as outcome,
         t.state as tee_state
    from teebook b
    join teetime t on t.id = b.tee_id
   where coalesce(t.provider_id = my_provider(), false);
grant select on v_teebook_pv to authenticated;

create or replace view v_teebook_mine as
  select b.id, b.tee_id, b.people, b.memo, b.state, b.why,
         b.created_at, b.updated_at,
         t.kind, t.region, t.course, t.play_at, t.tee_at, t.holes, t.green_fee,
         t.provider_id, p.name as provider_name,
         coalesce(nullif(btrim(coalesce(t.tel, '')), ''), p.tel) as tel,
         -- ── 0085 ── 신청 당시 조건 · 결과
         b.snap, b.pv_result, b.cus_result, tee_outcome(b.state, b.pv_result, b.cus_result) as outcome
    from teebook b
    join teetime t on t.id = b.tee_id
    join provider p on p.id = t.provider_id
   where coalesce(b.by_user = auth.uid(), false);
grant select on v_teebook_mine to authenticated;

-- ⑨ 운영자 집계 — 업체별 건수만(성함 · 연락처 · 돈 없음). where 절이 자물쇠입니다.
drop view if exists v_teetime_pv_stats;
create view v_teetime_pv_stats as
  select p.id as provider_id, p.name as provider_name,
         (select count(*) from teetime t where t.provider_id = p.id) as tee_n,
         (select count(*) from teetime t where t.provider_id = p.id and t.state in ('open','paused')
             and t.play_at >= kst_today()) as tee_live_n,
         count(b.id) as book_n,
         count(b.id) filter (where b.state = 'applied')   as applied_n,
         count(b.id) filter (where b.state = 'confirmed') as confirmed_n,
         count(b.id) filter (where b.state = 'rejected')  as rejected_n,
         count(b.id) filter (where b.state = 'canceled')  as cus_canceled_n,
         count(b.id) filter (where b.state = 'pcanceled') as pv_canceled_n,
         count(b.id) filter (where tee_outcome(b.state, b.pv_result, b.cus_result) = 'used')     as used_n,
         count(b.id) filter (where tee_outcome(b.state, b.pv_result, b.cus_result) = 'noshow')   as noshow_n,
         count(b.id) filter (where tee_outcome(b.state, b.pv_result, b.cus_result) = 'disputed') as disputed_n,
         count(b.id) filter (where b.state = 'confirmed' and t2.play_at < kst_today()
             and tee_outcome(b.state, b.pv_result, b.cus_result) = 'unknown') as unknown_n
    from provider p
    left join teetime t2 on t2.provider_id = p.id
    left join teebook b on b.tee_id = t2.id
   where coalesce(my_role() in ('staff','admin'), false)
     and exists (select 1 from teetime x where x.provider_id = p.id)
   group by p.id, p.name;
grant select on v_teetime_pv_stats to authenticated;

insert into schema_version (n, name) values (85, '0085_teetime_manage')
  on conflict (n) do nothing;

commit;

-- ── 되돌리기 ──────────────────────────────────────────────────────────
-- ⚠️ 칸 · 줄은 남깁니다(신청 당시 조건 · 결과가 사라지지 않게). 새 문 · 보기만 거둡니다.
-- begin;
--   drop view if exists v_teetime_pv_stats;
--   drop function if exists mark_teebook(jsonb);
--   drop function if exists set_teetime_state(jsonb);
--   delete from schema_version where n = 85;
-- commit;
-- 그 뒤 0060 의 open_teetime · edit_teetime · close_teetime · book_teetime · move_teebook 과
-- 0081 의 v_teetime_open, 0060 의 v_teebook_pv · v_teebook_mine 을 그 파일에서 꺼내 붙여 넣으면 0084 상태로 돌아갑니다
-- (보기는 칸을 줄여야 하므로 그때는 drop view 뒤 create — v_teetime_count 를 먼저 지우고 다시 만듭니다).
