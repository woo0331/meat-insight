-- ════════════════════════════════════════════════════════════════════
-- phase10 — 알림을 24시간 보냅니다
--
-- 왜 바꾸나
--   phase8·phase9 의 트리거는 밤 9시~아침 8시에 생긴 알림을 아침 8시로
--   미뤄 두었습니다. 새벽에 울리면 알림을 꺼 버린다는 이유였습니다.
--
--   그런데 축산은 낮에만 돌아가지 않습니다. 도축장은 새벽에 시작하고,
--   당일알바는 **밤에 올라와야 다음 날 새벽에 사람이 붙습니다.**
--   밤 11시에 올라온 "내일 새벽 발골 3명" 을 아침 8시에 보내면
--   그때는 이미 늦습니다. 미루는 것이 배려가 아니라 손해였습니다.
--
--   법으로도 걸리지 않습니다 — 야간 발송 제한(정보통신망법 제50조 제3항)은
--   **광고성 정보**에만 걸립니다. 우리가 보내는 것은 "요청이 등록되었습니다"
--   같은 정보성입니다. ⚠️ 템플릿에 광고 문구를 넣는 순간 이야기가 달라집니다.
--
-- 무엇이 바뀌나
--   함수 두 개의 본문만 바꿉니다. **표·칸·트리거 이름은 그대로**이고
--   쌓여 있는 줄도 손대지 않습니다 (CLAUDE.md 2번).
--   send_after 칸도 그대로 둡니다 — 나중에 다시 미루고 싶어지면
--   이 파일만 되돌리면 됩니다. 보내는 쪽(tools/notify-send.js)에서는
--   Secrets 에 QUIET_HOURS="21-8" 을 넣는 것으로 코드 없이 막을 수 있습니다.
--
--   받는 쪽에서 아예 안 받겠다는 것은 예전부터 supplier_prefs.notify_on 입니다.
--
--   ⚠️ phase8 · phase9 를 먼저 실행해야 합니다.
--
-- 실행: Supabase 대시보드 → SQL Editor 에 통째로 붙여넣기
-- ════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────
-- 1. 계정 있는 업체 — notifications 에 행이 생기면 바로 큐에
--    (phase8 의 같은 이름 함수를 대신합니다. 트리거는 그대로 씁니다)
-- ────────────────────────────────────────────────────────────
create or replace function public.gori_enqueue_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notify_outbox
    (notification_id, user_id, kind, title, body, link, send_after)
  values
    (new.id, new.user_id, coalesce(new.type, 'etc'), new.title, new.body, new.link, now())
  on conflict (notification_id) do nothing;

  return new;
exception when others then
  return new;   -- 큐 적재가 실패해도 알림 자체는 남아야 합니다
end $$;

-- ────────────────────────────────────────────────────────────
-- 2. 운영자가 대신 등록한(계정 없는) 업체 — 번호로 바로 큐에
--    (phase9 의 같은 이름 함수를 대신합니다)
-- ────────────────────────────────────────────────────────────
create or replace function public.gori_notify_guest_suppliers()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notify_outbox
    (supplier_id, user_id, kind, to_phone, title, body, link, send_after)
  select s.id, null, 'request', s.contact,
         '새 요청이 등록되었습니다',
         coalesce(new.title, new.description, new.category) || ' · ' || coalesce(new.region, '전국'),
         'req:' || new.id::text,
         now()
  from public.suppliers s
  left join public.supplier_prefs p on p.supplier_id = s.id::text
  where s.user_id is null                       -- 계정이 있는 업체는 1번이 맡습니다
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

-- ────────────────────────────────────────────────────────────
-- 3. 이미 아침으로 미뤄 둔 채 기다리는 것들을 지금으로 당깁니다
--    (phase8·9 를 켜 두고 밤에 쌓인 것이 있다면 그것들입니다)
-- ────────────────────────────────────────────────────────────
update public.notify_outbox
   set send_after = now()
 where status = 'pending' and send_after > now();

-- 끝. 확인:
--   select status, count(*) from public.notify_outbox group by status;
