-- ════════════════════════════════════════════════════════════════════
-- phase9 — 운영자가 대신 등록한 업체도 알림을 받게
--
-- 왜 필요한가
--   지금 사이트의 진짜 병목은 디자인이 아니라 **등록된 업체가 0곳**인 것입니다.
--   요청을 올려도 견적 보낼 사람이 없습니다.
--   그런데 도축장·가공업체 사장님한테 "사이트 가서 가입하세요" 하면
--   열에 아홉은 안 합니다. 현실은 운영자가 전화로 영업해서 명함을 받고
--   **대신 넣어 드리는** 것입니다.
--
--   문제는 지금 구조로는 그렇게 넣은 업체가 알림을 못 받는다는 것입니다.
--   phase3 의 트리거가 `s.user_id is not null` 인 업체에만 알림을 넣습니다.
--   계정이 없으면 user_id 가 없고, 그러면 요청이 올라와도 영영 모릅니다.
--   대신 등록해 놓고 알림이 안 가면 안 넣은 것과 같습니다.
--
-- 무엇을 더하나 (전부 추가 전용 — 기존 칸·트리거는 하나도 안 건드립니다)
--   1. suppliers 에 초대용 칸 넷 (claim_token · invited_at · claimed_at · added_by)
--   2. notify_outbox 가 계정 없는 업체도 받을 수 있게 (user_id 를 비워도 되게)
--   3. 계정 없는 업체에게도 요청 알림을 큐에 직접 넣는 트리거 하나 더
--      → phase3 의 트리거는 그대로 둡니다. 둘은 서로 다른 업체를 봅니다.
--
--   ⚠️ phase8_notify.sql 을 먼저 실행해야 합니다.
--
-- 실행: Supabase 대시보드 → SQL Editor 에 통째로 붙여넣기
-- ════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────
-- 1. 초대 — 운영자가 넣은 업체를 사장님 계정에 연결하는 열쇠
--    링크를 문자로 보내고, 사장님이 열어 로그인하면 user_id 가 붙습니다.
--    그 전까지는 계정 없이도 문자로 요청 알림을 받습니다.
-- ────────────────────────────────────────────────────────────
alter table public.suppliers add column if not exists claim_token text;
alter table public.suppliers add column if not exists invited_at  timestamptz;  -- 초대 링크를 만든 때
alter table public.suppliers add column if not exists claimed_at  timestamptz;  -- 사장님이 연결한 때
alter table public.suppliers add column if not exists added_by    text;         -- 대신 넣은 운영자

-- 열쇠는 겹치면 안 됩니다 (남의 업체를 가져갈 수 있게 됩니다)
create unique index if not exists suppliers_claim_token_idx
  on public.suppliers (claim_token) where claim_token is not null;

-- ────────────────────────────────────────────────────────────
-- 2. 계정 없는 업체도 큐에 담기게
--    phase8 은 user_id 를 필수로 두었습니다 — 알림이 전부 계정으로만
--    왔으니까요. 이제 업체 자체를 가리킬 수 있어야 합니다.
-- ────────────────────────────────────────────────────────────
alter table public.notify_outbox alter column user_id drop not null;
alter table public.notify_outbox add column if not exists supplier_id uuid;

-- 같은 요청을 같은 업체에 두 번 담지 않습니다 (알림톡은 건당 과금)
create unique index if not exists notify_outbox_sup_link_idx
  on public.notify_outbox (supplier_id, link)
  where supplier_id is not null;

-- ────────────────────────────────────────────────────────────
-- 3. 계정 없는 업체에게도 요청 알림을 — 큐에 직접
--    phase3 의 gori_notify_matching_suppliers 는 그대로 둡니다.
--    그건 "계정이 있는 업체" 를, 이건 "계정이 없는 업체" 를 맡습니다.
--    분야·지역을 거르는 조건은 같습니다.
-- ────────────────────────────────────────────────────────────
create or replace function public.gori_notify_guest_suppliers()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  kst timestamp   := (now() at time zone 'Asia/Seoul');
  h   integer     := extract(hour from kst);
  due timestamptz := now();
begin
  -- phase8 과 같은 규칙: 밤에는 안 보냅니다
  if h >= 21 then
    due := ((date_trunc('day', kst) + interval '1 day 8 hour') at time zone 'Asia/Seoul');
  elsif h < 8 then
    due := ((date_trunc('day', kst) + interval '8 hour') at time zone 'Asia/Seoul');
  end if;

  insert into public.notify_outbox
    (supplier_id, user_id, kind, to_phone, title, body, link, send_after)
  select s.id, null, 'request', s.contact,
         '새 요청이 등록되었습니다',
         coalesce(new.title, new.description, new.category) || ' · ' || coalesce(new.region, '전국'),
         'req:' || new.id::text,
         due
  from public.suppliers s
  left join public.supplier_prefs p on p.supplier_id = s.id::text
  where s.user_id is null                       -- 계정이 있는 업체는 phase3 이 맡습니다
    and coalesce(s.contact, '') <> ''           -- 번호가 없으면 보낼 곳이 없습니다
    and coalesce(s.notify_on, true)
    and coalesce(p.notify_on, true)
    and (
      new.category_main is null
      or (p.category_mains is not null and new.category_main = any(p.category_mains))
      or (p.category_mains is null and s.category_mains is not null and new.category_main = any(s.category_mains))
      or (p.category_mains is null and s.category_mains is null)
    )
    and (
      new.region is null or new.region = '전국'
      or p.regions is null or '전국' = any(p.regions)
      or exists (select 1 from unnest(p.regions) r where new.region like '%' || r || '%' or r like '%' || new.region || '%')
    )
  on conflict do nothing;

  return new;
exception when others then
  return new;   -- 알림이 실패해도 요청 등록은 막지 않습니다
end $$;

drop trigger if exists trg_gori_notify_guest on public.purchase_requests;
create trigger trg_gori_notify_guest
  after insert on public.purchase_requests
  for each row execute function public.gori_notify_guest_suppliers();

-- ────────────────────────────────────────────────────────────
-- 4. 초대 링크를 열쇠로 업체를 내 계정에 연결
--    anon 이 suppliers 를 통째로 고치게 두면 안 되므로, 열쇠가 맞을 때
--    **그 한 줄만** 바꾸는 함수를 따로 둡니다 (security definer).
-- ────────────────────────────────────────────────────────────
create or replace function public.gori_claim_supplier(token text)
returns table (id uuid, name text, region text, contact text)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  sid uuid;
begin
  if uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  if token is null or length(token) < 16 then
    raise exception '초대 링크가 올바르지 않습니다';
  end if;

  select s.id into sid from public.suppliers s
   where s.claim_token = token and s.user_id is null
   limit 1;

  if sid is null then
    raise exception '이미 연결되었거나 없는 초대입니다';
  end if;

  update public.suppliers s
     set user_id = uid, claimed_at = now(), claim_token = null   -- 열쇠는 한 번만 씁니다
   where s.id = sid;

  return query
    select s.id, s.name, s.region, s.contact from public.suppliers s where s.id = sid;
end $$;

revoke all on function public.gori_claim_supplier(text) from public;
grant execute on function public.gori_claim_supplier(text) to authenticated;

-- 끝. 확인:
--   select count(*) from public.suppliers where user_id is null and contact is not null;
