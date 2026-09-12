-- ════════════════════════════════════════════════════════════════════
-- phase8 — 알림을 사이트 밖으로 내보내기 (카카오 알림톡 / 문자)
--
-- 왜 필요한가
--   지금 알림은 notifications 표에 행 하나가 들어가는 것이 전부입니다.
--   업체가 고리에 들어와 종을 눌러야 보입니다. 그런데 도축장·가공업체
--   사장님이 하루에 몇 번씩 사이트를 들여다볼 리가 없습니다.
--   요청이 올라와도 아무도 모르고, 요청자는 견적을 한 건도 못 받고 떠납니다.
--   매칭 플랫폼에서 이건 기능이 빠진 게 아니라 **동작을 안 하는 것**입니다.
--
-- 왜 새 표를 만드는가 (CLAUDE.md 2번 — 기존 스키마는 안 건드립니다)
--   1. 알림톡은 **건당 돈이 나갑니다.** 두 번 보내면 두 번 나갑니다.
--      "이미 보냈다" 를 적어 둘 곳이 있어야 합니다.
--   2. 지금은 심사 전이라 문자로, 승인 뒤에는 알림톡으로 보냅니다.
--      어느 채널로 나갔는지 남아야 갈아끼울 수 있습니다.
--   3. 실패하면 다시 보내야 합니다. 시도 횟수가 필요합니다.
--   4. **밤에는 안 보냅니다.** 새벽 2시에 알림이 가면 사장님은 알림을
--      끕니다. 조용한 시간(21~08시)에 생긴 것은 아침 8시로 미룹니다 —
--      미루려면 "언제 보낼지" 를 적어 둘 곳이 있어야 합니다.
--   5. 전화번호가 들어갑니다. notifications 는 화면이 읽는 표라
--      anon 이 select 합니다. 거기에 번호를 얹으면 안 됩니다.
--
--   notifications 표는 칸 하나도 안 바꿉니다. 화면 쪽 코드도 그대로입니다.
--
-- 실행: Supabase 대시보드 → SQL Editor 에 통째로 붙여넣기
-- ════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────
-- 1. 내보낼 알림 큐
-- ────────────────────────────────────────────────────────────
create table if not exists public.notify_outbox (
  id              bigserial primary key,
  notification_id uuid unique,                         -- 같은 알림을 두 번 보내지 않습니다
  user_id         uuid not null,
  kind            text not null default 'etc',         -- request | quote | selected | chat …
  to_phone        text,                                -- 보내는 시점에 채웁니다
  title           text,
  body            text,
  link            text,
  send_after      timestamptz not null default now(),  -- 조용한 시간이면 아침 8시
  status          text not null default 'pending',     -- pending | sent | failed | skipped
  tries           integer not null default 0,
  channel         text,                                -- alimtalk | sms
  provider_id     text,                                -- 대행사가 준 메시지 id
  error           text,
  sent_at         timestamptz,
  created_at      timestamptz default now()
);

-- 보낼 것만 빨리 집어오기
create index if not exists notify_outbox_due_idx
  on public.notify_outbox (status, send_after)
  where status = 'pending';

-- ────────────────────────────────────────────────────────────
-- 2. notifications 에 행이 생기면 큐에 같이 넣습니다
--    (기존 트리거 trg_gori_notify_suppliers 는 그대로 둡니다 —
--     그게 notifications 를 채우고, 이 트리거가 그걸 받아 큐에 넣습니다)
-- ────────────────────────────────────────────────────────────
create or replace function public.gori_enqueue_notify()
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
  -- 밤 9시~아침 8시에 생긴 것은 아침 8시로 미룹니다.
  -- 새벽에 울리는 알림은 한 번이면 충분히 미움받습니다.
  if h >= 21 then
    due := ((date_trunc('day', kst) + interval '1 day 8 hour') at time zone 'Asia/Seoul');
  elsif h < 8 then
    due := ((date_trunc('day', kst) + interval '8 hour') at time zone 'Asia/Seoul');
  end if;

  insert into public.notify_outbox
    (notification_id, user_id, kind, title, body, link, send_after)
  values
    (new.id, new.user_id, coalesce(new.type, 'etc'), new.title, new.body, new.link, due)
  on conflict (notification_id) do nothing;

  return new;
exception when others then
  return new;   -- 큐 적재가 실패해도 알림 자체는 남아야 합니다
end $$;

drop trigger if exists trg_gori_enqueue_notify on public.notifications;
create trigger trg_gori_enqueue_notify
  after insert on public.notifications
  for each row execute function public.gori_enqueue_notify();

-- ────────────────────────────────────────────────────────────
-- 3. RLS — 전화번호가 들어 있는 표입니다. anon 은 못 봅니다.
--    정책을 하나도 안 만들면 RLS 가 켜진 표는 전부 막힙니다.
--    보내는 쪽(tools/notify-send.js)은 service_role 로 붙으므로
--    RLS 를 지나갑니다 — 그래서 정책이 필요 없습니다.
-- ────────────────────────────────────────────────────────────
alter table public.notify_outbox enable row level security;
revoke all on public.notify_outbox from anon, authenticated;

-- 끝. 확인:
--   select status, count(*) from public.notify_outbox group by status;
