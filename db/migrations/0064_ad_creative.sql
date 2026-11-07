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
