-- ════════════════════════════════════════════════════════════════════
-- 0053 — 문의의 **답이 손님에게 닿는 길**
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **0045 는 답을 받는 자리까지 세워 두고, 그 답이 나가는 길을
--   안 냈습니다.** `move_inquiry` 는 "답했다고 두려면 답을 적어라" 까지
--   막고(`inquiry_answer_ck`), 제 문의를 읽는 자물쇠도 이미 있었습니다
--   (`inquiry_mine` 정책 + select GRANT). 그런데 그것을 **읽는 화면이
--   한 곳도 없었습니다** — 운영자는 답을 적고 "답변함" 으로 옮기고,
--   손님은 그 답을 어디서도 볼 수 없었습니다. 운영자 화면의 안내문이
--   "답은 적어 주신 연락처로 운영자가 직접 보냅니다" 라고 적어 둔 것이
--   그 때문입니다 — 즉 **DB 에 적힌 답은 아무도 안 읽는 글**이었습니다.
--   `save_provider_contact`(문만 서 있고 적는 자리가 없던 자리) ·
--   `drop_photo`(단추가 없던 자리)와 같은 꼴입니다.
--
--   이 번호가 하는 일은 셋입니다 —
--     ① 답이 달리면 **알림**을 보냅니다 (화면에서만 · 0050 의 그 길)
--     ② 운영자 **메모**를 손님이 못 읽게 칸을 좁힙니다
--     ③ (화면) `/my` 에 "내가 보낸 문의" 가 섭니다 — `js/myinq.js`
--
-- ⚠️⚠️ **밖으로 보내지 않습니다.** 0050 의 까닭 그대로입니다 (정보통신망법
--   제50조 · 발송사가 수탁자가 되어 방침에 적어야 함 · 환경변수가 비면
--   조용히 안 보내짐). 그래서 화면에도 "문자로 알려 드립니다" 를 **적지
--   않습니다** — "이 자리에서 보십니다" 라고 적습니다.
--
-- ⚠️⚠️ **알림에 답 글자를 담지 않습니다.** 0050 에 본문 칸이 아예 없는
--   그 까닭입니다 — 담으면 운영자가 적은 글이 한 벌 더 복사되고, 그 안에
--   연락처가 섞이면 알림이 그것을 나르는 길이 됩니다. 제목은 "답변이
--   올라왔습니다" 까지이고, 답은 가는 자리에서 그 사람 권한으로 봅니다.
--
-- ⚠️⚠️ **비로그인으로 들어온 문의에는 알림을 못 보냅니다** (`by_user`
--   가 비어 있습니다 — `notify_one` 이 조용히 끝냅니다. 그게 맞습니다).
--   그 경우는 적어 주신 연락처로 운영자가 직접 답하고, 화면이 **그
--   사실을 적습니다** (안 적으면 "넣었는데 안 보인다" 가 됩니다).
--
-- ⚠️⚠️⚠️ **②는 0045 의 GRANT 를 좁히는 것입니다** — 0045 는
--   `grant select on inquiry to authenticated` 로 **표 전체**를 주었고,
--   그 표에는 운영자만 쓰는 `memo` 와 누가 답했는지(`answered_by`)가
--   있습니다. `inquiry_mine` 정책은 **줄**만 제 것으로 좁히므로, 제
--   문의의 운영자 메모는 그대로 읽혔습니다 (RLS 는 줄은 막아도 **칸은
--   못 막습니다** — 0013 에서 연락처 표를 가른 그 까닭입니다).
--   ⚠️ 그래서 **0045 파일만 따로 다시 붙여 넣으면 이 좁힘이 조용히
--   풀립니다.** `db/apply-from-0008.sql` 을 통째로 붙여 넣으면 0053 이
--   뒤에 와서 다시 좁히므로 괜찮습니다 (두 번 붙여 넣어도 같습니다).
--
-- ⚠️ 0050 머리말의 "트리거가 7 이어야 합니다" 는 이제 **8** 입니다
--   (그 줄은 그 파일에서 고쳐 두었습니다 — 주석이 코드와 다른 자리를
--   남기지 않습니다).
--
-- 되돌아갔는지 보는 법
--   select count(*) from pg_trigger where tgname = 'notice_inquiry_t';
--     -- 1 이어야 합니다
--   select count(*) from information_schema.column_privileges
--    where table_name = 'inquiry' and grantee = 'authenticated'
--      and column_name in ('memo','answered_by');
--     -- 0 이어야 합니다 (1 이상이면 0045 가 다시 덮은 것입니다)
-- ════════════════════════════════════════════════════════════════════
begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 알림 갈래를 하나 늘립니다
--   ⚠️ 0050 은 `create table if not exists` 로 표를 만들었으므로, 그
--   파일을 다시 붙여 넣어도 **이 제약은 되돌아가지 않습니다** (표가
--   이미 있으면 그 구문이 통째로 건너뜁니다).
-- ════════════════════════════════════════════════════════════════════
--   ⚠️⚠️ **제약 이름을 글자로 박지 않습니다.** 0050 은 칸 안에 그냥
--   `check (kind in (...))` 로 적었고 이름은 Postgres 가 지어 줍니다
--   (`notice_kind_check` 일 것이지만 그건 **지금의 값**입니다). 이름을
--   박아 두고 `drop constraint if exists` 로 지나가면, 이름이 다른 날
--   **옛 제약이 그대로 남아** 새 갈래를 거절하면서 `add constraint` 는
--   성공합니다 — 조용히 아무 알림도 안 붙는 꼴입니다. 그래서 그 칸을
--   지키는 check 를 **찾아서** 떼어 냅니다.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
     where conrelid = 'notice'::regclass and contype = 'c'
       and pg_get_constraintdef(oid) like '%kind%'
  loop
    execute format('alter table notice drop constraint %I', c.conname);
  end loop;
end $$;
alter table notice add constraint notice_kind_check check (kind in
  ('quote','jobapply','jobmoved','joinapply','joinmoved',
   'answer','hidden','inquiry'));

-- ════════════════════════════════════════════════════════════════════
-- ② 트리거 — 보내신 문의에 답이 올라왔습니다
--   ⚠️ **문을 갈아 끼우지 않습니다** — `move_inquiry`(0045)를 다시 쓰면
--   그 문이 하던 일(답 없이 답변함으로 못 옮김 · 닫힌 것은 못 되돌림 ·
--   감사 기록)이 조용히 사라질 수 있고, 앞 번호를 덮는 짝이 또 늡니다.
--   ⚠️⚠️ 0050 의 트리거 일곱과 **같은 꼴**로 적습니다 (`notify_one` 은
--   안쪽 도움함수라 아무에게도 EXECUTE 를 주지 않았고, 트리거는 제
--   함수의 임자 권한으로 돌기 때문에 그대로 돕니다).
-- ════════════════════════════════════════════════════════════════════
create or replace function notice_inquiry() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- ⚠️ 답변함으로 **들어올 때 한 번**입니다. 이 줄이 없으면 그 뒤의
  --    메모 수정 · 닫기마다 같은 알림이 다시 붙습니다.
  if new.state <> 'answered' or old.state = 'answered' then return null; end if;
  -- ⚠️⚠️ 답 글자를 담지 않습니다 (위 머리말) — 가는 자리는 `/my` 이고,
  --    거기서 그 사람 권한으로 봅니다.
  -- ⚠️ 접수번호를 `obj_id` 로 둡니다 — 번호로 찾아갑니다 (내용은 안 담습니다).
  perform notify_one(new.by_user, 'inquiry',
    '보내신 문의에 답변이 올라왔습니다', '/my', 'inquiry', new.no);
  return null;
end $$;
revoke all on function notice_inquiry() from public;
drop trigger if exists notice_inquiry_t on inquiry;
create trigger notice_inquiry_t after update of state on inquiry
  for each row execute function notice_inquiry();

-- ════════════════════════════════════════════════════════════════════
-- ③ 손님이 읽는 칸을 좁힙니다
--   ⚠️⚠️⚠️ **`memo` 는 운영자의 내부 메모입니다.** 손님 화면에 운영자에게
--   할 말을 찍지 않는 것과 같은 선인데(절대 규칙 3), 지금은 손님이 제
--   문의 줄에서 그것을 **읽을 수 있었습니다.**
--   ⚠️ `answered_by` 도 뺍니다 — 누가 답했는지는 손님이 알 까닭이 없고,
--   운영자 계정 uuid 입니다.
--   ⚠️⚠️ **칸 단위 GRANT 는 `where` 절에도 걸립니다** — 안 준 칸을
--   조건에 쓰면 0줄이 아니라 **질의가 통째로 거절**됩니다 (0050 ·
--   0052 에서 두 번 밟았습니다). 두 칸을 부르는 화면은 없습니다
--   (`js/admininq.js` 도 안 부릅니다 — 세어 보고 좁혔습니다).
-- ════════════════════════════════════════════════════════════════════
revoke select on inquiry from authenticated;
grant select (id, no, kind, body, name, tel, email, by_user,
              agree_at, state, answer, answered_at, created_at, updated_at)
  on inquiry to authenticated;

insert into schema_version (n, name) values (53, '0053_inquiry_answer')
  on conflict (n) do nothing;

commit;
