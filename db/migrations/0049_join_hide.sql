-- ════════════════════════════════════════════════════════════════════
-- 0049 — 조인 자리를 **운영자가 가립니다**
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **왜 필요한가 — 신고를 받아 놓고 할 수 있는 일이 없었습니다.**
--   0046 이 `report.joinroom_id` 를 더해 조인 자리를 신고할 수 있게
--   했는데, 운영자가 그 자리를 **내릴 길이 없었습니다**. 닫는 문
--   (`close_joinroom`)은 **연 사람만** 쓸 수 있습니다 — 전화번호를
--   본문에 적어 둔 자리나 욕설이 적힌 자리를 신고받아도 운영자는
--   "처리했음" 만 누를 수 있었습니다. 그건 처리한 것이 아닙니다.
--   ⚠️ 커뮤니티(0047)와 인력(0048)에는 그 길이 있습니다 — 조인만
--   빠져 있었습니다.
--
-- ⚠️⚠️ **까닭이 반드시 있습니다.** 까닭 없이 가릴 수 있으면 불평할
--   때마다 내려 주는 자리가 됩니다. 문에서도 막고 표의 check 로도
--   막습니다 (문이 내려가는 날 그 줄이 남습니다).
--   ⚠️ 그 까닭은 **연 사람에게 보여 줍니다** (`/my` 가 찍습니다) —
--   무엇이 문제였는지 모르면 다시 열 때도 같은 일을 합니다.
--
-- ⚠️⚠️ **고치는 문을 늘리지 않았습니다.** 0046 의 `apply_joinroom` ·
--   `edit_joinroom` · `close_joinroom` 은 모두 `state = 'open'` 을
--   요구하므로, 상태 하나를 더하는 것만으로 **새 신청 · 고치기 ·
--   닫기가 저절로 막힙니다.** 셋을 손대면 0046 이 하던 일이 조용히
--   사라질 수 있습니다 (갈아 끼우는 자리를 안 늘립니다).
--
-- ⚠️ **이미 수락된 짝의 연락처는 그대로 둡니다.** 가린다고 되돌릴 수
--   없습니다 — 상대는 이미 번호를 보았습니다. 거짓 안심을 주는 것보다
--   사실대로 두고, 당사자가 **스스로 닫는** 길(`share_joincontact`)을
--   그대로 둡니다.
--
-- ⚠️ 공개 목록(`v_join_open`)은 `state = 'open'` 만 내므로 **보기를
--   건드리지 않습니다** — 가린 자리는 그 자리에서 빠집니다 (보기를
--   다시 만들면 0046 을 다시 붙여 넣는 날 되돌아갑니다).
--
-- 되돌아갔는지 보는 법
--   select 1 from pg_proc where proname = 'move_joinroom';   -- 있어야 합니다
--   select pg_get_constraintdef(oid) from pg_constraint
--    where conname = 'joinroom_state_check';                 -- hidden 이 있어야
-- ════════════════════════════════════════════════════════════════════
begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 상태 하나를 더합니다 — hidden
-- ════════════════════════════════════════════════════════════════════
alter table joinroom add column if not exists hidden_why text;
alter table joinroom add column if not exists hidden_by  uuid
  references auth.users(id) on delete set null;
alter table joinroom add column if not exists hidden_at  timestamptz;

-- ⚠️ 0046 이 인라인 check 로 적어 두어 이름이 `joinroom_state_check`
--   입니다 (Postgres 가 지어 준 이름). 그 이름으로 떼고 다시 답니다.
alter table joinroom drop constraint if exists joinroom_state_check;
alter table joinroom add  constraint joinroom_state_check
  check (state in ('open','closed','done','hidden'));

-- ⚠️⚠️ 까닭 없이 가릴 수 없습니다 — **문이 내려가도 이 줄이 남습니다**
do $$ begin
  alter table joinroom add constraint joinroom_hidden_ck
    check (state <> 'hidden' or btrim(coalesce(hidden_why,'')) <> '');
exception when duplicate_object then null; end $$;

-- ⚠️ 칸 단위 GRANT 는 **더하는 것**입니다 — 0046 이 준 것은 그대로
--   두고 가린 까닭만 얹습니다 (연 사람이 제 화면에서 읽습니다).
--   ⚠️ `contact` 와 `agree_at` 은 **여전히 안 줍니다.**
grant select (hidden_why, hidden_at) on joinroom to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ② 문 — 운영자가 가립니다
--   ⚠️ 연 사람이 닫는 길은 `close_joinroom` 그대로입니다. 가리는 것과
--   닫는 것은 **다른 일**이라 문을 갈라 둡니다 (닫은 자리는 다시
--   열 수 있지만, 가린 자리는 운영자가 가린 것입니다).
-- ════════════════════════════════════════════════════════════════════
create or replace function move_joinroom(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_to  text := nullif(btrim(coalesce(p->>'state','')), '');
  v_why text := nullif(btrim(coalesce(p->>'why','')), '');
  v_st  text;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 자리인지 알 수 없습니다'; end if;
  if v_to <> 'hidden' then
    raise exception '옮길 수 없는 상태입니다';
  end if;
  -- ⚠️⚠️ 가리는 것은 **운영자만**입니다
  if not coalesce(my_role() in ('staff','admin'), false) then
    raise exception '가리는 것은 운영자만 할 수 있습니다';
  end if;
  if v_why is null or char_length(v_why) < 5 then
    raise exception '가리는 까닭을 다섯 글자 이상 적어 주세요';
  end if;

  select state into v_st from joinroom where id = v_id for update;
  if v_st is null then raise exception '그런 자리가 없습니다'; end if;
  if v_st = 'hidden' then raise exception '이미 가려진 자리입니다'; end if;

  update joinroom set state = 'hidden', hidden_why = v_why,
                      hidden_by = v_uid, hidden_at = now(),
                      updated_at = now()
   where id = v_id;

  -- ⚠️ 감사 기록에 **본문을 넣지 않습니다** — audit_log 는 오래 남고
  --   보는 사람도 넓습니다. 번호로 찾아갑니다.
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, data)
  values (v_uid, my_role(), 'joinroom', v_id::text, v_st, 'hidden',
          jsonb_build_object('why_len', char_length(v_why)));
  return 'hidden';
end $$;
revoke all on function move_joinroom(jsonb) from public;
grant execute on function move_joinroom(jsonb) to authenticated;

insert into schema_version (n, name) values (49, '0049_join_hide')
  on conflict (n) do nothing;

commit;
