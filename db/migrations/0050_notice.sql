-- ════════════════════════════════════════════════════════════════════
-- 0050 — 내부 알림 (밖으로 **안 보냅니다**)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **왜 "내부" 인가.** 문자 · 카톡 · 메일을 보내는 순간 —
--   ① 정보통신망법 제50조가 걸립니다 ((광고) 표기 · 보내는 사람 ·
--      수신거부 · 21시~08시 금지)
--   ② 발송사가 **수탁자**가 되어 개인정보처리방침에 그 회사를 적어야
--      합니다 (제26조 · 미국 회사면 나라까지 — 제28조의8)
--   ③ 환경변수가 하나 더 늘고, 그것이 비면 **조용히 안 보내집니다**
--   셋은 늘 같이 움직입니다. 그래서 지금은 **화면에서만** 알립니다 —
--   보내는 곳이 없으니 수탁자도 늘지 않고, 안 보내진 줄 모르는 일도
--   없습니다. ⚠️ 밖으로 보내기 시작하는 날 **방침의 수탁자를 같은
--   날** 적으세요 (작업 기억의 그 줄).
--
-- ⚠️⚠️ **알림은 "무엇이 생겼다" 까지입니다.** 본문을 담는 칸이 아예
--   없습니다 — 담으면 손님이 적은 글이 그대로 한 벌 더 복사되고, 그
--   안에 전화번호가 들어 있으면 **알림이 연락처를 나르는 길**이 됩니다
--   (감사 기록에 성함 · 연락처를 안 넣는 것과 같은 까닭).
--   제목은 우리가 쓴 **정해진 말**이고, 자세한 것은 가는 자리에서
--   그 사람의 권한으로 봅니다.
--
-- ⚠️⚠️ **가는 주소는 우리 주소만** 받습니다 (`/` 로 시작하고 `//` 는
--   아님). 지금은 트리거가 짓지만, 바깥 주소가 들어갈 수 있는 칸을
--   열어 두면 그것이 열린 넘겨주기(open redirect)입니다.
--
-- ⚠️ **문을 갈아 끼우지 않았습니다.** 알림은 **트리거**로 답니다 —
--   `make_quote` · `apply_jobpost` 같은 문을 다시 쓰면 0008 · 0048 이
--   하던 일이 조용히 사라질 수 있습니다 (앞 번호를 덮는 짝이 또 늡니다).
--
-- 되돌아갔는지 보는 법
--   select 1 from pg_proc where proname = 'read_notice';   -- 있어야 합니다
--   select count(*) from pg_trigger where tgname like 'notice_%_t';  -- 7 이어야
-- ════════════════════════════════════════════════════════════════════
begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 알림 한 줄
-- ════════════════════════════════════════════════════════════════════
create table if not exists notice (
  id         uuid primary key default gen_random_uuid(),
  to_user    uuid not null references auth.users(id) on delete cascade,
  -- ⚠️ 갈래는 정해진 것만 — 화면이 아이콘 · 말을 가릅니다
  kind       text not null check (kind in
               ('quote','jobapply','jobmoved','joinapply','joinmoved',
                'answer','hidden')),
  -- ⚠️⚠️ **우리가 쓴 말**입니다 (손님이 적은 글이 아닙니다)
  title      text not null check (btrim(title) <> '' and char_length(title) <= 60),
  -- ⚠️⚠️⚠️ **우리 주소만** — `/` 로 시작하고 `//` 는 아닙니다
  link       text not null check (
               link like '/%' and link not like '//%' and char_length(link) <= 120),
  -- 어디에 달린 알림인가 (번호로 찾아갑니다 — 내용은 안 담습니다)
  obj        text,
  obj_id     text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notice_mine_idx
  on notice (to_user, created_at desc);
create index if not exists notice_unread_idx
  on notice (to_user) where read_at is null;

-- ════════════════════════════════════════════════════════════════════
-- ② 자물쇠 — ⚠️ **제 알림만** 읽습니다
--   운영자 정책을 **두지 않습니다** — 남의 알림을 읽을 까닭이 없습니다
--   (후기에서 "로그인한 아무나 읽는다" 를 두었다가 고친 자리와 같은 결).
-- ════════════════════════════════════════════════════════════════════
alter table notice enable row level security;

drop policy if exists notice_mine on notice;
create policy notice_mine on notice for select
  using (to_user = auth.uid());

-- ⚠️ `to_user` 를 **안 줍니다** — 늘 제 것이라 화면이 쓸 일이 없고,
--   주면 그 칸으로 무엇을 할 수 있는지 다시 따져야 합니다.
-- ⚠️⚠️ 쓰기는 **한 줄도 주지 않습니다** — 트리거가 넣고 문이 읽음으로
--   바꿉니다.
grant select (id, kind, title, link, obj, obj_id, read_at, created_at)
  on notice to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ③ 안쪽 도움함수 — ⚠️ **문이 아닙니다** (아무에게도 GRANT 하지
--   않습니다). 트리거만 부릅니다.
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **함수는 표와 다릅니다 — 기본이 "누구나 실행" 입니다.**
--   표는 GRANT 를 안 주면 아무도 못 읽지만, 함수는 만들면 그 순간
--   `public` 에게 EXECUTE 가 붙습니다. `security definer` 까지 달린
--   이 함수를 그대로 두면 **로그인한 누구나** 아무 사람에게 아무
--   제목으로 알림을 꽂을 수 있습니다 (제목은 자유 글자입니다 — 주소는
--   표의 check 가 막지만 제목은 안 막습니다).
--   ⚠️ 검사가 "직접 못 부른다" 를 눌러 보고서야 드러났습니다 — 문법도
--   빌드도 다른 검사도 전부 통과했습니다. 아래 `revoke` 가 자물쇠입니다.
create or replace function notify_one(
  p_to uuid, p_kind text, p_title text, p_link text,
  p_obj text, p_obj_id text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  -- ⚠️ 받을 사람이 없으면 조용히 끝냅니다. 로그인 없이 들어온 요청은
  --   `request.user_id` 가 비어 있습니다 (못 보내는 것이 맞습니다).
  if p_to is null then return; end if;
  -- ⚠️⚠️ **제가 한 일은 제게 안 알립니다.** 제 질문에 제가 답을 달면
  --   "답변이 달렸습니다" 가 저에게 오는 꼴입니다.
  if p_to = auth.uid() then return; end if;
  -- ⚠️⚠️ **안 읽은 같은 알림이 있으면 더 쌓지 않습니다.** 답변이 열 개
  --   달리면 "답변이 달렸습니다" 가 열 줄이 되고, 그러면 목록이
  --   쓸모없어집니다 (읽은 뒤에는 다시 옵니다).
  if exists (select 1 from notice
              where to_user = p_to and kind = p_kind
                and obj is not distinct from p_obj
                and obj_id is not distinct from p_obj_id
                and read_at is null) then
    return;
  end if;
  insert into notice (to_user, kind, title, link, obj, obj_id)
  values (p_to, p_kind, p_title, p_link, p_obj, p_obj_id);
end $$;
-- ⚠️⚠️ **아무에게도 주지 않습니다.** 트리거는 제 함수의 임자 권한으로
--   돌기 때문에 EXECUTE 를 거두어도 그대로 돕니다.
revoke all on function notify_one(uuid, text, text, text, text, text) from public;

-- ════════════════════════════════════════════════════════════════════
-- ④ 트리거 — 견적이 왔습니다
-- ════════════════════════════════════════════════════════════════════
create or replace function notice_quote() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_to uuid;
begin
  select r.user_id into v_to from request r where r.id = new.request_id;
  perform notify_one(v_to, 'quote', '받으신 견적이 하나 늘었습니다',
                     '/my', 'request', new.request_id::text);
  return null;
end $$;
revoke all on function notice_quote() from public;
drop trigger if exists notice_quote_t on quote;
create trigger notice_quote_t after insert on quote
  for each row execute function notice_quote();

-- ════════════════════════════════════════════════════════════════════
-- ⑤ 트리거 — 구인 · 구직에 지원이 들어왔습니다 · 처리되었습니다
-- ════════════════════════════════════════════════════════════════════
create or replace function notice_jobapply() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_to uuid;
begin
  select j.by_user into v_to from jobpost j where j.id = new.post_id;
  perform notify_one(v_to, 'jobapply', '올리신 글에 지원 · 제안이 들어왔습니다',
                     '/my', 'jobpost', new.post_id::text);
  return null;
end $$;
revoke all on function notice_jobapply() from public;
drop trigger if exists notice_jobapply_t on jobapply;
create trigger notice_jobapply_t after insert on jobapply
  for each row execute function notice_jobapply();

create or replace function notice_jobmoved() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- ⚠️ 거둔 것(canceled)은 **제가 한 일**이라 안 알립니다
  if new.state = old.state or new.state not in ('accepted','rejected') then
    return null;
  end if;
  perform notify_one(new.by_user, 'jobmoved',
    case when new.state = 'accepted' then '보내신 지원이 수락되었습니다'
         else '보내신 지원이 거절되었습니다' end,
    '/my', 'jobapply', new.id::text);
  return null;
end $$;
revoke all on function notice_jobmoved() from public;
drop trigger if exists notice_jobmoved_t on jobapply;
create trigger notice_jobmoved_t after update of state on jobapply
  for each row execute function notice_jobmoved();

-- ════════════════════════════════════════════════════════════════════
-- ⑥ 트리거 — 조인 신청이 들어왔습니다 · 처리되었습니다
-- ════════════════════════════════════════════════════════════════════
create or replace function notice_joinapply() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_to uuid;
begin
  select r.by_user into v_to from joinroom r where r.id = new.room_id;
  perform notify_one(v_to, 'joinapply', '여신 조인 자리에 신청이 들어왔습니다',
                     '/my', 'joinroom', new.room_id::text);
  return null;
end $$;
revoke all on function notice_joinapply() from public;
drop trigger if exists notice_joinapply_t on joinapply;
create trigger notice_joinapply_t after insert on joinapply
  for each row execute function notice_joinapply();

create or replace function notice_joinmoved() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.state = old.state or new.state not in ('accepted','rejected') then
    return null;
  end if;
  perform notify_one(new.by_user, 'joinmoved',
    case when new.state = 'accepted' then '조인 신청이 수락되었습니다'
         else '조인 신청이 거절되었습니다' end,
    '/my', 'joinapply', new.id::text);
  return null;
end $$;
revoke all on function notice_joinmoved() from public;
drop trigger if exists notice_joinmoved_t on joinapply;
create trigger notice_joinmoved_t after update of state on joinapply
  for each row execute function notice_joinmoved();

-- ════════════════════════════════════════════════════════════════════
-- ⑦ 트리거 — 제 질문에 답변이 달렸습니다
-- ════════════════════════════════════════════════════════════════════
create or replace function notice_answer() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_to uuid;
begin
  select q.by_user into v_to from cq q where q.id = new.q_id;
  perform notify_one(v_to, 'answer', '올리신 질문에 답변이 달렸습니다',
                     '/cat/community', 'cq', new.q_id::text);
  return null;
end $$;
revoke all on function notice_answer() from public;
drop trigger if exists notice_answer_t on ca;
create trigger notice_answer_t after insert on ca
  for each row execute function notice_answer();

-- ════════════════════════════════════════════════════════════════════
-- ⑧ 트리거 — 운영자가 글을 가렸습니다
--   ⚠️⚠️ **까닭을 알림에 담지 않습니다** — 그 까닭은 그 사람의 화면
--   (`/my`)에서 그 사람 권한으로 봅니다. 알림은 "가렸습니다" 까지입니다.
--   ⚠️ 가린 까닭에는 신고 내용이 섞이기 쉽고, 알림은 오래 남습니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function notice_hidden() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.state <> 'hidden' or old.state = 'hidden' then return null; end if;
  perform notify_one(new.by_user, 'hidden',
    '올리신 글이 운영자에 의해 가려졌습니다', '/my',
    tg_table_name, new.id::text);
  return null;
end $$;
revoke all on function notice_hidden() from public;
drop trigger if exists notice_hidden_cq_t on cq;
create trigger notice_hidden_cq_t after update of state on cq
  for each row execute function notice_hidden();
drop trigger if exists notice_hidden_job_t on jobpost;
create trigger notice_hidden_job_t after update of state on jobpost
  for each row execute function notice_hidden();

-- ════════════════════════════════════════════════════════════════════
-- ⑨ 문 — 읽음으로 바꿉니다
--   ⚠️⚠️ **RLS 는 UPDATE 에서 에러를 내지 않습니다** — 보이지 않는 줄은
--   그냥 안 걸릴 뿐입니다. 그래서 여기서 `to_user = auth.uid()` 를
--   **직접** 적고, **바뀐 줄 수**를 돌려줍니다 (0 이면 아무것도 안
--   바뀐 것이고, 검사가 그것을 봅니다).
-- ════════════════════════════════════════════════════════════════════
create or replace function read_notice(p jsonb)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_all boolean := coalesce((p->>'all')::boolean, false);
  v_n   int;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_all then
    update notice set read_at = now()
     where to_user = v_uid and read_at is null;
    get diagnostics v_n = row_count;
    return v_n;
  end if;
  if v_id is null then raise exception '어느 알림인지 알 수 없습니다'; end if;
  update notice set read_at = now()
   where id = v_id and to_user = v_uid and read_at is null;
  get diagnostics v_n = row_count;
  -- ⚠️ 남의 알림을 가리켰는지 **갈라서 말하지 않습니다** — 갈라 주면
  --   번호를 바꿔 가며 "그 알림이 있는지" 를 확인할 수 있습니다.
  return v_n;
end $$;
revoke all on function read_notice(jsonb) from public;
grant execute on function read_notice(jsonb) to authenticated;

insert into schema_version (n, name) values (50, '0050_notice')
  on conflict (n) do nothing;

commit;
